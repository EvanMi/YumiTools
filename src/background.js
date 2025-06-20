chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    title: 'Add Keyword',
    id: 'addKw',
    contexts: ['selection'],
  });
  chrome.contextMenus.create({
    title: 'Clean Keyword',
    id: 'cleanKw',
    contexts: ['all'],
  });
});

chrome.runtime.onMessage.addListener(function (request, _sender, sendResponse) {
  if (request.action === "translateTimestamp") {
    translateTimestamp(request.text, function (translatedText) {
      sendResponse({ translation: translatedText })
    })
  }

  if (request.action === "translateJson") {
    translateJson(request.text, function (translatedText) {
      sendResponse({ translation: translatedText })
    })
  }

  if (request.action === "translateBase64") {
    translateBase64(request.text, function (translatedText) {
      sendResponse({ translation: translatedText })
    })
  }

  if (request.action === "translateBase64URLSafe") {
    translateBase64URLSafe(request.text, function (translatedText) {
      sendResponse({ translation: translatedText })
    })
  }

  if (request.action === "translate01") {
    const num = parseInt(request.text, 2)
    sendResponse({translation: num})
  }

  if (request.action === "translateHex") {
    const num = parseInt(request.text, 16)
    sendResponse({translation: num})
  }

})

function translateBase64(base64, callback) {
  const binaryString = atob(base64)
  const utf8Bytes = new Uint8Array([...binaryString].map(char => char.charCodeAt(0)))
  const decodedString = new TextDecoder().decode(utf8Bytes)
  callback(decodedString)
}

function translateBase64URLSafe(base64URLSafe, callback) {
  let base64String = base64URLSafe.replace(/-/g, '+').replace(/_/g, '/')
  const padding = 4 - (base64String.length % 4)
  if (padding !== 4) {
      base64String += '='.repeat(padding)
  }
  try {
      const binaryString = atob(base64String)
      const utf8Bytes = new Uint8Array([...binaryString].map(char => char.charCodeAt(0)))
      const decodedString = new TextDecoder().decode(utf8Bytes)

      callback(decodedString)
  } catch (error) {
      console.error("Invalid Base64 string", error)
  }
  
}

function translateJson(json, callback) {
  let res = []
  let i = 0
  while (i < json.length) {

    if (json.charAt(i) === '{') {
      let left = 1
      let inStr = false

      for (let j = i + 1; j < json.length; j++) {

        if (json.charAt(j) === '{' && !inStr) {
          left++
        } else if (json.charAt(j) === '}' && !inStr) {
          left--
        } else if (json.charAt(j) === '"' && json.charAt(j - 1) !== "\\") {
          inStr = !inStr
        }

        if (left === 0) {
          const subStr = json.substring(i, j + 1)
          if (isJsonString(subStr)) {
            res.push(subStr)
            i = j + 1
          } else {
            i++
          }
          break
        }
      }

      if (left !== 0) {
        i++
      }

    } else if (json.charAt(i) === '[') {
      let left = 1
      let inStr = false

      for (let j = i + 1; j < json.length; j++) {

        if (json.charAt(j) === '[' && !inStr) {
          left++
        } else if (json.charAt(j) === ']' && !inStr) {
          left--
        } else if (json.charAt(j) === '"' && json.charAt(j - 1) !== "\\") {
          inStr = !inStr
        }

        if (left === 0) {
          const subStr = json.substring(i, j + 1)
          if (isJsonString(subStr)) {
            res.push(subStr)
            i = j + 1
          } else {
            i++
          }
          break
        }
      }

      if (left !== 0) {
        i++
      }

    } else {
      i++
    }
  }
  callback("[" + res.join(",") + "]")
}

function translateTimestamp(text, callback) {
  let date = new Date(parseInt(text))
  let localTime = date.toLocaleString()
  callback(localTime)
}

function isJsonString(str) {
  try {
    if (typeof JSON.parse(str) == "object") {
      return true
    }
  } catch (e) {
  }
  return false
}

chrome.contextMenus.onClicked.addListener((info, tab) => {
  const selectedText = info.selectionText
  if (info.menuItemId === "addKw" || info.menuItemId === "cleanKw") {
    chrome.tabs.sendMessage(tab.id, { action: info.menuItemId, text: selectedText }, (_response) => { });
  }
})

// when open tab with same urls, they will be place together
chrome.tabs.onUpdated.addListener(async function (tabId, props) {
  if (props && props.status && props.status === 'complete') {
    const tabs = await chrome.tabs.query({currentWindow: true})
    
    for (const tabItem of tabs) {
      if (tabItem.id === tabId) {
        for (const tabSib of tabs) {
          if (tabSib.id !== tabId && tabSib.url === tabItem.url) {
            await chrome.tabs.move(tabItem.id, {index: tabSib.index + 1})
            break
          }
        }
        break
      }
    }
  }
});