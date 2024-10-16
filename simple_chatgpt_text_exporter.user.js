// ==UserScript==
// @name         Simple ChatGPT Text Exporter
// @namespace    https://github.com/samomar/Simple-ChatGPT-Text-Exporter
// @version      3.8
// @description  Logs ChatGPT messages with labels, dynamically updates, and includes a copy button. UI can be positioned at the top center or above the input box.
// @match        https://chatgpt.com/*
// @grant        none
// @downloadURL  https://greasyfork.org/scripts/512815-smiple-chatgpt-text-exporter/code/Smiple%20ChatGPT%20text%20exporter.user.js
// @updateURL    https://greasyfork.org/scripts/512815-smiple-chatgpt-text-exporter/code/Smiple%20ChatGPT%20text%20exporter.meta.js
// @homepage     https://github.com/samomar/Simple-ChatGPT-Text-Exporter
// @supportURL   https://github.com/samomar/Simple-ChatGPT-Text-Exporter/issues
// @license      MIT
// ==/UserScript==

(function() {
    'use strict';

    const CONFIG = {
        enableLogging: false,
        chatContainerSelector: localStorage.getItem('chatContainerSelector') || '',
        position: localStorage.getItem('chatLoggerPosition') || 'bottom'
    };

    let chatMessages = [];
    let observer = null;
    let lastUrl = location.href;

    function init() {
        CONFIG.chatContainerSelector = localStorage.getItem('chatContainerSelector') || '';
        CONFIG.position = localStorage.getItem('chatLoggerPosition') || 'bottom';

        // Immediately try to create controls and observe chat
        tryInitialize();

        // Set up a MutationObserver to watch for DOM changes
        const bodyObserver = new MutationObserver(tryInitialize);
        bodyObserver.observe(document.body, { childList: true, subtree: true });

        // Also set up an interval as a fallback
        const initInterval = setInterval(() => {
            if (document.getElementById('chat-logger-controls')) {
                clearInterval(initInterval);
            } else {
                tryInitialize();
            }
        }, 1000);

        // Continue checking for URL changes
        setInterval(checkUrlChange, 1000);
    }

    function tryInitialize() {
        if (!document.getElementById('chat-logger-controls')) {
            const inputBox = findInputBox();
            if (inputBox) {
                createControls();
                if (CONFIG.chatContainerSelector) {
                    observeChatContainer(CONFIG.chatContainerSelector);
                } else {
                    // If no selector is saved, try to find a suitable container
                    const containers = findPossibleChatContainers();
                    if (containers.length > 0) {
                        CONFIG.chatContainerSelector = containers[0].selector;
                        localStorage.setItem('chatContainerSelector', CONFIG.chatContainerSelector);
                        observeChatContainer(CONFIG.chatContainerSelector);
                    }
                }
            }
        }
    }

    function createControls() {
        const existingControls = document.getElementById('chat-logger-controls');
        if (existingControls) existingControls.remove();

        const container = document.createElement('div');
        container.id = 'chat-logger-controls';

        updateControlsStyle(container);

        container.innerHTML = `
            <div class="dropdown">
                <button id="download-chat-button" class="chat-logger-btn">⬇️</button>
                <div class="dropdown-content">
                    <a href="#" id="download-txt">Download TXT</a>
                    <a href="#" id="download-json">Download JSON</a>
                </div>
            </div>
            <button id="toggle-selector-button" class="chat-logger-btn">⚙️</button>
            <button id="copy-chat-button" class="chat-logger-btn">Copy Chat</button>
            <button id="toggle-position-button" class="chat-logger-btn">↕️</button>
            <div id="chat-selector-container" style="display:none;">
                <select id="chat-container-dropdown" class="chat-logger-select"></select>
                <button id="copy-selector-button" class="chat-logger-btn">📋</button>
            </div>
        `;

        const style = document.createElement('style');
        style.textContent = `
            #chat-logger-controls {
                display: flex;
                align-items: center;
                gap: 5px;
                padding: 5px;
                background-color: #202123;
                border-radius: 5px;
            }
            .chat-logger-btn {
                padding: 5px 10px;
                font-size: 12px;
                background-color: #343541;
                color: #fff;
                border: none;
                border-radius: 4px;
                cursor: pointer;
            }
            .chat-logger-btn:hover {
                background-color: #40414f;
            }
            .chat-logger-select {
                background-color: #343541;
                color: #fff;
                border: none;
                border-radius: 4px;
                padding: 5px;
                font-size: 12px;
            }
            .dropdown {
                position: relative;
                display: inline-block;
            }
            .dropdown-content {
                display: none;
                position: absolute;
                background-color: #202123;
                min-width: 160px;
                box-shadow: 0px 8px 16px 0px rgba(0,0,0,0.2);
                z-index: 1;
                border-radius: 4px;
                top: 100%;
                left: 0;
            }
            .dropdown-content a {
                color: #fff;
                padding: 12px 16px;
                text-decoration: none;
                display: block;
                font-size: 12px;
            }
            .dropdown-content a:hover {
                background-color: #343541;
            }
            .dropdown:hover .dropdown-content {
                display: block;
            }
        `;
        document.head.appendChild(style);

        if (CONFIG.position === 'top') {
            document.body.insertBefore(container, document.body.firstChild);
        } else {
            const inputBox = findInputBox();
            if (inputBox) {
                inputBox.parentElement.insertBefore(container, inputBox);
            } else {
                console.warn('Input box not found. Appending to body.');
                document.body.appendChild(container);
            }
        }

        populateDropdown();
        addEventListeners();
    }

    function updateControlsStyle(container) {
        const commonStyles = {
            zIndex: '9999',
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            fontFamily: 'Arial, sans-serif',
            color: '#fff',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            padding: '3px 6px',
            fontSize: '12px',
            gap: '4px',
        };

        if (CONFIG.position === 'top') {
            Object.assign(container.style, {
                ...commonStyles,
                position: 'fixed',
                top: '10px',
                left: '50%',
                transform: 'translateX(-50%)',
            });
        } else {
            Object.assign(container.style, {
                ...commonStyles,
                position: 'relative',
                marginBottom: '5px',
                width: 'fit-content',
            });
        }
    }

    function addEventListeners() {
        document.getElementById('toggle-selector-button').addEventListener('click', toggleSelectorVisibility);
        document.getElementById('download-chat-button').addEventListener('click', toggleDownloadOptions);
        document.getElementById('download-txt').addEventListener('click', (e) => downloadChat(e, 'txt'));
        document.getElementById('download-json').addEventListener('click', (e) => downloadChat(e, 'json'));
        document.getElementById('copy-chat-button').addEventListener('click', copyChat);
        document.getElementById('toggle-position-button').addEventListener('click', togglePosition);
        document.getElementById('copy-selector-button').addEventListener('click', copySelectorToClipboard);
        document.getElementById('chat-container-dropdown').addEventListener('change', onSelectChange);
        document.addEventListener('click', closeDropdowns);
    }

    function toggleSelectorVisibility(event) {
        event.stopPropagation();
        const selectorContainer = document.getElementById('chat-selector-container');
        selectorContainer.style.display = selectorContainer.style.display === 'none' ? 'block' : 'none';
    }

    function toggleDownloadOptions(event) {
        event.stopPropagation();
        const dropdownContent = document.querySelector('.dropdown-content');
        dropdownContent.style.display = dropdownContent.style.display === 'none' ? 'block' : 'none';
    }

    function copyChat(e) {
        e.preventDefault();
        const button = e.target;
        const chatContent = chatMessages.join('\n\n');
        if (chatContent) {
            navigator.clipboard.writeText(chatContent).then(() => {
                showTemporaryStatus(button, 'Copied!', '#4CAF50');
            }).catch(() => {
                showTemporaryStatus(button, 'Failed to Copy', '#f44336');
            });
        } else {
            showTemporaryStatus(button, 'No Content', '#FFA500');
        }
    }

    function downloadChat(e, format) {
        e.preventDefault();
        e.stopPropagation();
        const content = format === 'json' ? JSON.stringify(chatMessages, null, 2) : chatMessages.join('\n\n');
        const blob = new Blob([content], { type: format === 'json' ? 'application/json' : 'text/plain' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `chat_export.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);
    }

    function togglePosition() {
        CONFIG.position = CONFIG.position === 'top' ? 'bottom' : 'top';
        localStorage.setItem('chatLoggerPosition', CONFIG.position);
        createControls(); // Recreate controls with new position
    }

    function copySelectorToClipboard(e) {
        e.preventDefault();
        const select = document.getElementById('chat-container-dropdown');
        navigator.clipboard.writeText(select.value).then(() => {
            alert('Selector copied to clipboard!');
        }).catch(() => {
            alert('Failed to copy selector');
        });
    }

    function onSelectChange(e) {
        CONFIG.chatContainerSelector = e.target.value;
        localStorage.setItem('chatContainerSelector', CONFIG.chatContainerSelector);
        resetChatData();
        if (CONFIG.chatContainerSelector) {
            observeChatContainer();
        }
    }

    function showTemporaryStatus(button, message, bgColor) {
        const originalText = button.innerText;
        button.innerText = message;
        button.style.backgroundColor = bgColor;
        button.style.color = '#fff';
        setTimeout(() => {
            button.innerText = originalText;
            button.style.backgroundColor = 'transparent';
            button.style.color = '#fff';
        }, 2000);
    }

    function closeDropdowns() {
        document.querySelectorAll('.dropdown-content, #chat-selector-container').forEach(el => {
            el.style.display = 'none';
        });
    }

    function checkUrlChange() {
        if (location.href !== lastUrl) {
            lastUrl = location.href;
            resetChatData();
            if (CONFIG.chatContainerSelector) {
                observeChatContainer();
            }
        }
    }

    function resetChatData() {
        chatMessages = [];
        if (observer) observer.disconnect();
    }

    function observeChatContainer() {
        if (observer) observer.disconnect();
        const container = document.querySelector(CONFIG.chatContainerSelector);
        if (container) {
            scanChatContent(container);
            observer = new MutationObserver(() => scanChatContent(container));
            observer.observe(container, { childList: true, subtree: true });
        } else {
            const intervalId = setInterval(() => {
                const container = document.querySelector(CONFIG.chatContainerSelector);
                if (container) {
                    clearInterval(intervalId);
                    scanChatContent(container);
                    observer = new MutationObserver(() => scanChatContent(container));
                    observer.observe(container, { childList: true, subtree: true });
                }
            }, 500);
        }
    }

    function scanChatContent(container) {
        const messageElements = container.querySelectorAll('[data-message-author-role]');
        chatMessages = Array.from(messageElements).map(el => {
            const role = el.getAttribute('data-message-author-role');
            const textElement = el.querySelector('.text-message') || el;
            const text = textElement.innerText.trim();
            return text ? `${role === 'user' ? 'You' : 'Assistant'} said:\n${text}` : null;
        }).filter(Boolean);

        if (CONFIG.enableLogging) {
            console.log(chatMessages);
        }
    }

    function populateDropdown() {
        const select = document.getElementById('chat-container-dropdown');
        const options = findPossibleChatContainers();
        select.innerHTML = '<option value="">-- Select --</option>' + options.map(opt =>
            `<option value="${opt.selector}">${opt.description}</option>`
        ).join('');
        if (CONFIG.chatContainerSelector) select.value = CONFIG.chatContainerSelector;
    }

    function findPossibleChatContainers() {
        const selectors = [
            '[data-testid^="conversation-turn-"]',
            '[role*="log"]',
            '[role*="feed"]',
            '[role*="list"]',
            '[aria-live="polite"]',
            '[aria-relevant="additions"]',
            '[class*="chat"]',
            '[class*="message"]',
            'main',
            'section',
            // Add more general selectors that might contain the chat
            'div[class*="conversation"]',
            'div[class*="thread"]',
            'div[class*="dialog"]'
        ];

        return selectors.flatMap(selector =>
            Array.from(document.querySelectorAll(selector)).map(el => ({
                selector: getUniqueSelector(el),
                description: buildElementDescription(el, selector)
            }))
        ).filter((item, index, self) =>
            index === self.findIndex((t) => t.selector === item.selector)
        );
    }

    function getUniqueSelector(el) {
        if (el.id) return `#${el.id}`;
        if (el.className) {
            const className = `.${[...el.classList].join('.')}`;
            return `${el.tagName.toLowerCase()}${className}`;
        }
        return el.tagName.toLowerCase();
    }

    function buildElementDescription(el, selector) {
        const description = [];
        if (el.id) {
            description.push(`#${el.id}`);
        }
        if (el.className) {
            description.push(`.${[...el.classList].join('.')}`);
        }
        if (el.tagName) {
            description.push(el.tagName.toLowerCase());
        }
        return description.join(' ');
    }

    function findInputBox() {
        const selectors = [
            'textarea',
            'div[contenteditable="true"]',
            'input[type="text"]',
            'div.group.relative.flex.w-full.items-center',
            'form div.relative',
            'div[role="presentation"]',
            'div.flex.flex-col.w-full.py-2.flex-grow.md\\:py-3.md\\:pl-4',
            'div.flex.flex-col.w-full.py-[10px].flex-grow.md\\:py-4.md\\:pl-4'
        ];
        for (const sel of selectors) {
            const el = document.querySelector(sel);
            if (el) return el;
        }
        return null;
    }

    window.addEventListener('load', init);
})();
