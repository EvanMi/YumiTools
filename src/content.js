const translatorIconName = "translator-icon"
const translatorPopName = "translator-pop"
const clsPrefix = "chrome-extension-YumiTools-FindMany-style-"
const clsClass = "chrome-extension-YumiTools-FindMany"

let mouseX = 0
let mouseY = 0
let selectedText = ""
let timestampTranslationDiv = null
let timeOutFun = null

let highlightCnt = 0

class PopupBtn {
    constructor(name, fun) {
        this.name = name
        this.fun = fun
    }
}

// 监听鼠标移动事件以获取鼠标位置
document.addEventListener('mousemove', function (event) {
    mouseX = event.clientX
    mouseY = event.clientY
});

// 监听文本选中事件
document.addEventListener('mouseup', function (_event) {

    selectedText = window.getSelection().toString().trim();

    if (selectedText.length > 0 && /^[01]+$/.test(selectedText)) {
        showTranslateIcon(mouseX, mouseY, "01", translate01);
    }
    else if (selectedText.length > 12 && /^-?\d+$/.test(selectedText)) {
        showTranslateIcon(mouseX, mouseY, "time", translateTimestamp);
    }
    else if (selectedText.length > 0 && ((selectedText.indexOf("{") >= 0 && selectedText.indexOf("}") > 0) || (selectedText.indexOf("[") >= 0 && selectedText.indexOf("]") > 0))) {
        showTranslateIcon(mouseX, mouseY, "json", translateJson);
    }
    else if (selectedText.length > 0 && (/^(?:[A-Za-z0-9+\/]{4})*(?:[A-Za-z0-9+\/]{2}==|[A-Za-z0-9+\/]{3}=)?$/.test(selectedText) 
        || selectedText.length > 0 && /^[A-Za-z0-9\-_]+$/.test(selectedText) || /^[0-9a-fA-F]+$/.test(selectedText))) {
        showTranslateIcon(mouseX, mouseY, "trans", showTranslateBase64OrHex)
    }
    else {
        hideTranslateIcon()
        hidePopup()
    }
    
});

function showTranslateBase64OrHex(_text) {
    hideTranslateIcon()
    showPopup(mouseX, mouseY, [new PopupBtn("Base64", translateBase64), new PopupBtn("Base64URL", translateBase64URLSafe), new PopupBtn("Hex", translateHex)])
}

function showPopup(x, y, btns) {
    if (document.getElementById(translatorPopName)) {
        return;
    }

    const popup = document.createElement('div');
    popup.id = translatorPopName;

    popup.style.position = "fixed";
    popup.style.left = (x + 10) + "px";
    popup.style.top = (y + 10) + "px";
    popup.style.backgroundColor = 'white';
    popup.style.border = '1px solid black';
    popup.style.padding = '10px';
    popup.style.zIndex = 2147483647;
    popup.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)';

    for (const btn of btns) {
        const button = document.createElement('button');
        button.textContent = btn.name;
        styleButton(button);
        button.onclick = () => {
            btn.fun(selectedText)
        };
        popup.appendChild(button);
    }

    document.body.appendChild(popup);
}

function styleButton(button) {
    button.style.margin = '5px';
    button.style.padding = '8px 16px';
    button.style.border = 'none';
    button.style.borderRadius = '4px';
    button.style.backgroundColor = '#28a745';
    button.style.color = 'white';
    button.style.cursor = 'pointer';
    button.style.fontSize = '14px';
    button.style.transition = 'background-color 0.3s';

    button.onmouseover = function() {
        button.style.backgroundColor = '#218838';
    };

    button.onmouseout = function() {
        button.style.backgroundColor = '#28a745';
    };
}

function hidePopup() {
    let popup = document.getElementById(translatorPopName)
    if (popup) {
        document.body.removeChild(popup)
    }
}


function showTranslateIcon(x, y, imgName, clickFunc) {
    if (document.getElementById(translatorIconName)) {
        return
    }
    let icon = document.createElement("img")
    //https://www.logosc.cn/favicon-generator?s=TM
    //https://www.bejson.com/image/text2img/
    icon.src = chrome.runtime.getURL("imgs/" + imgName + ".png")
    icon.style.position = "fixed"
    icon.style.left = (x + 10) + "px"
    icon.style.top = (y + 10) + "px"
    icon.style.width = "27px"
    icon.style.height = "27px"
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
        showTranslationWithTip(response.translation)
    });
}

function translate01(text) {
    hideTranslateIcon()
    chrome.runtime.sendMessage({ action: "translate01", text: text }, function (response) {
        clearSelection()
        showTranslationWithTip(response.translation)
    });
}

function translateHex(text) {
    hidePopup()
    chrome.runtime.sendMessage({ action: "translateHex", text: text }, function (response) {
        clearSelection()
        showTranslationWithTip(response.translation)
    });
}

function translateJson(text) {
    hideTranslateIcon()
    chrome.runtime.sendMessage({ action: "translateJson", text: text }, function (response) {
        clearSelection()
        navigator.clipboard.writeText(response.translation)
    })
}

function translateBase64(text) {
    hidePopup()
    chrome.runtime.sendMessage({ action: "translateBase64", text: text }, function (response) {
        clearSelection()
        showTranslationWithTip(response.translation)
    });
}

function translateBase64URLSafe(text) {
    hidePopup()
    chrome.runtime.sendMessage({ action: "translateBase64URLSafe", text: text }, function (response) {
        clearSelection()
        showTranslationWithTip(response.translation)
    });
}

function showTranslationWithTip(text) {
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