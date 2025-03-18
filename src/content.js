const translatorIconName = "translator-icon"
const clsPrefix = "chrome-extension-YumiTools-FindMany-style-"
const clsClass = "chrome-extension-YumiTools-FindMany"

let mouseX = 0
let mouseY = 0
let selectedText = ""
let timestampTranslationDiv = null
let timeOutFun = null

let highlightCnt = 0

// 监听鼠标移动事件以获取鼠标位置
document.addEventListener('mousemove', function (event) {
    mouseX = event.clientX
    mouseY = event.clientY
});

// 监听文本选中事件
document.addEventListener('mouseup', function (_event) {

    selectedText = window.getSelection().toString().trim();

    if (selectedText.length > 0 && /^-?\d+$/.test(selectedText)) {
        showTranslateIcon(mouseX, mouseY, "time", translateTimestamp);
    } else if (selectedText.length > 0 && ((selectedText.indexOf("{") >= 0 && selectedText.indexOf("}") > 0) || (selectedText.indexOf("[") >= 0 && selectedText.indexOf("]") > 0))) {
        showTranslateIcon(mouseX, mouseY, "json", translateJson);
    } else {
        hideTranslateIcon()
    }
});

function showTranslateIcon(x, y, imgName, clickFunc) {
    if (document.getElementById(translatorIconName)) {
        return
    }
    let icon = document.createElement("img")
    //https://www.logosc.cn/favicon-generator?s=TM
    
    icon.src = chrome.runtime.getURL("imgs/" + imgName + ".png")
    icon.style.position = "fixed"
    icon.style.left = (x + 10) + "px"
    icon.style.top = (y + 10) + "px"
    icon.style.width = "16px"
    icon.style.height = "16px"
    icon.style.cursor = "pointer"
    icon.style.zIndex = 2147483647
    icon.id = translatorIconName

    icon.addEventListener('click', function () {
        clickFunc(selectedText)
    });

    document.body.appendChild(icon)
}

function hideTranslateIcon() {
    let icon = document.getElementById(translatorIconName)
    if (icon) {
        document.body.removeChild(icon)
    }
}

function translateTimestamp(text) {
    hideTranslateIcon()
    chrome.runtime.sendMessage({ action: "translateTimestamp", text: text }, function (response) {
        clearSelection()
        showTimestampTranslation(response.translation)
    });
}

function translateJson(text) {
    hideTranslateIcon()
    chrome.runtime.sendMessage({ action: "translateJson", text: text }, function (response) {
        clearSelection()
        navigator.clipboard.writeText(response.translation)
    })
}

function showTimestampTranslation(text) {
    if (timestampTranslationDiv) {
        document.body.removeChild(timestampTranslationDiv)
        if (timeOutFun) {
            clearTimeout(timeOutFun)
        }
    }

    timestampTranslationDiv = document.createElement("div")
    timestampTranslationDiv.style.position = "fixed"
    timestampTranslationDiv.style.backgroundColor = "white"
    timestampTranslationDiv.style.border = "1px solid black"
    timestampTranslationDiv.style.padding = "10px"
    timestampTranslationDiv.style.zIndex = 2147483647
    timestampTranslationDiv.style.maxWidth = "300px"
    timestampTranslationDiv.innerText = text

    document.body.appendChild(timestampTranslationDiv)

    // Get the dimensions of the tooltip and the viewport
    const tooltipRect = timestampTranslationDiv.getBoundingClientRect()
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    // Calculate the position of the tooltip
    let left = mouseX
    let top = mouseY

    // Adjust the position if the tooltip goes beyond the right edge of the viewport
    if (left + tooltipRect.width > viewportWidth) {
        left = viewportWidth - tooltipRect.width
    }

    // Adjust the position if the tooltip goes beyond the bottom edge of the viewport
    if (top + tooltipRect.height > viewportHeight) {
        top = viewportHeight - tooltipRect.height
    }

    // Set the adjusted position
    timestampTranslationDiv.style.left = left + "px"
    timestampTranslationDiv.style.top = top + "px"

    timeOutFun = setTimeout(function () {
        if (timestampTranslationDiv) {
            document.body.removeChild(timestampTranslationDiv)
            timestampTranslationDiv = null
        }
    }, 5000);
}

function clearSelection() {
    if (window.getSelection) {
        const selection = window.getSelection()
        if (selection.empty) {
            selection.empty()
        } else if (selection.removeAllRanges) {
            selection.removeAllRanges()
        }
    } else if (document.selection) {
        document.selection.empty()
    }
}


chrome.runtime.onMessage.addListener(function (
    request,
    _sender,
    sendResponse
) {
    if (request.action === "addKw") {
        hl_search(request.text)
    }
    if (request.action === "cleanKw") {
        hl_clearall()
    }
    sendResponse({ success: true })
    return true
});

function hl_search(addedKeyWord) {
    function KeywordEscape(kw) {
        return kw.replace(/\n/sgi, '\\n')
    }

    var hl_param1 = KeywordEscape(addedKeyWord);
    var hlClassName = clsPrefix + highlightCnt + " " + clsClass
    highlightCnt = (highlightCnt + 1) % 20

    var hl_param2 = {
        className: hlClassName,
        wordsOnly: false,
        caseSensitive: false,
        element: "mh"
    }

    $(document.body).highlight(hl_param1, hl_param2)
}


function hl_clearall() {
    $(document.body).unhighlight({ className: clsClass, element: "mh" })
}