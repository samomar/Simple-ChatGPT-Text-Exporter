// ==UserScript==
// @name         Simple ChatGPT Text Exporter
// @namespace    https://github.com/samomar/Simple-ChatGPT-Text-Exporter
// @version      3.4
// @description  Logs chat ChatGPT messages with labels, dynamically updates, and includes a copy button. UI is centered at the top.
// @match        https://chatgpt.com/*
// @grant        none
// @downloadURL  https://greasyfork.org/scripts/512815-smiple-chatgpt-text-exporter/code/Smiple%20ChatGPT%20text%20exporter.user.js
// @updateURL    https://greasyfork.org/scripts/512815-smiple-chatgpt-text-exporter/code/Smiple%20ChatGPT%20text%20exporter.meta.js
// @homepage     https://github.com/samomar/Simple-ChatGPT-Text-Exporter
// @supportURL   https://github.com/samomar/Simple-ChatGPT-Text-Exporter/issues
// ==/UserScript==

(function() {
    'use strict';

    /***** Configuration *****/
    const CONFIG = {
        enableLogging: false,
        chatContainerSelector: '',
    };

    /***** Variables *****/
    let chatMessages = [];
    let observer = null;
    let lastUrl = location.href;

    /***** Initialization *****/
    function init() {
        CONFIG.chatContainerSelector = localStorage.getItem('chatContainerSelector') || '';
        createControls();
        if (CONFIG.chatContainerSelector) {
            observeChatContainer(CONFIG.chatContainerSelector);
        }
        setInterval(checkUrlChange, 1000);
    }

    /***** UI Creation *****/
    function createControls() {
        const existingControls = document.getElementById('chat-logger-controls');
        if (existingControls) existingControls.remove();

        const container = document.createElement('div');
        container.id = 'chat-logger-controls';
        Object.assign(container.style, {
            position: 'fixed',
            top: '10px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: '9999',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            border: '1px solid #ccc',
            padding: '5px',
            fontSize: '12px',
            fontFamily: 'Arial, sans-serif',
            color: '#fff',
            borderRadius: '5px',
            display: 'flex',
            alignItems: 'center',
        });

        container.innerHTML = `
            <button id="toggle-selector-button" style="margin-right:5px; padding:2px 5px; font-size:12px; background-color:#2c2c2c; color:#fff; border:1px solid #444; border-radius:3px; cursor:pointer;">⚙️</button>
            <div class="dropdown" style="display:inline-block; position:relative; margin-right:5px;">
                <button id="download-chat-button" style="padding:2px 5px; font-size:12px; background-color:#2c2c2c; color:#fff; border:1px solid #444; border-radius:3px; cursor:pointer;">⬇️</button>
                <div class="dropdown-content" style="display:none; position:absolute; background-color:#1c1c1c; min-width:120px; box-shadow:0px 8px 16px 0px rgba(0,0,0,0.5); z-index:1; border-radius:3px; overflow:hidden;">
                    <a href="#" id="download-txt" style="color:#fff; padding:8px 12px; text-decoration:none; display:block; font-size:12px; transition:background-color 0.3s;">Download TXT</a>
                    <a href="#" id="download-json" style="color:#fff; padding:8px 12px; text-decoration:none; display:block; font-size:12px; transition:background-color 0.3s;">Download JSON</a>
                </div>
            </div>
            <button id="copy-chat-button" style="margin-right:5px; padding:2px 5px; font-size:12px; background-color:#2c2c2c; color:#fff; border:1px solid #444; border-radius:3px; cursor:pointer;">Copy Chat</button>
            <div id="chat-selector-container" style="display:none; margin-right: 5px;">
                <label style="margin-right:3px;">Chat Container: </label>
                <select id="chat-container-dropdown" style="background-color:#2c2c2c; color:#fff; border:1px solid #444; border-radius:3px; padding:2px 5px; font-size:12px;"></select>
                <button id="copy-selector-button" style="margin-left:3px; padding:0 3px; font-size:10px; background-color:#2c2c2c; color:#fff; border:1px solid #444; border-radius:3px; cursor:pointer;">📋</button>
            </div>
        `;

        document.body.appendChild(container);

        const select = document.getElementById('chat-container-dropdown');
        select.addEventListener('change', onSelectChange);
        document.getElementById('toggle-selector-button').addEventListener('click', toggleSelectorVisibility);
        document.getElementById('copy-chat-button').addEventListener('click', onCopyButtonClick);
        document.getElementById('download-chat-button').addEventListener('click', toggleDownloadOptions);
        document.getElementById('download-txt').addEventListener('click', (e) => { e.stopPropagation(); downloadChat('txt'); });
        document.getElementById('download-json').addEventListener('click', (e) => { e.stopPropagation(); downloadChat('json'); });
        document.getElementById('copy-selector-button').addEventListener('click', copySelectorToClipboard);

        document.addEventListener('click', closeDropdowns);

        populateDropdown(select);

        // Add hover effect for dropdown items
        const dropdownItems = container.querySelectorAll('.dropdown-content a');
        dropdownItems.forEach(item => {
            item.addEventListener('mouseover', () => item.style.backgroundColor = '#3c3c3c');
            item.addEventListener('mouseout', () => item.style.backgroundColor = 'transparent');
        });
    }

    function populateDropdown(select) {
        const containers = findPossibleChatContainers();
        select.innerHTML = '<option value="">-- Select --</option>' +
            containers.map(item =>
                `<option value="${item.selector}">${item.description}</option>`
            ).join('');

        if (CONFIG.chatContainerSelector) {
            select.value = CONFIG.chatContainerSelector;
        }
    }

    /***** Event Handlers *****/
    function onSelectChange(event) {
        CONFIG.chatContainerSelector = event.target.value;
        localStorage.setItem('chatContainerSelector', CONFIG.chatContainerSelector);
        resetChatData();
        if (CONFIG.chatContainerSelector) {
            observeChatContainer(CONFIG.chatContainerSelector);
        }
    }

    function onCopyButtonClick() {
        const copyButton = document.getElementById('copy-chat-button');
        const chatContent = chatMessages.join('\n\n');
        if (chatContent.length > 0) {
            copyToClipboard(chatContent, copyButton);
        } else {
            showCopyStatus(copyButton, 'No Content', '#FFA500', '#fff');
        }
    }

    function copyToClipboard(text, button) {
        navigator.clipboard.writeText(text).then(() => {
            showCopyStatus(button, 'Copied!', '#4CAF50', '#fff');
        }, () => {
            showCopyStatus(button, 'Failed to Copy', '#f44336', '#fff');
        });
    }

    function showCopyStatus(button, message, bgColor, color) {
        button.innerText = message;
        button.style.backgroundColor = bgColor;
        button.style.color = color;
        setTimeout(() => {
            button.innerText = 'Copy Chat';
            button.style.backgroundColor = '#2c2c2c';
            button.style.color = '#fff';
        }, 2000);
    }

    /***** Core Functions *****/
    function observeChatContainer(selector) {
        if (observer) observer.disconnect();

        const chatContainer = document.querySelector(selector);
        if (!chatContainer) {
            console.warn('Selected chat container not found.');
            return;
        }

        resetChatData();
        scanChatContent(chatContainer);

        observer = new MutationObserver(() => scanChatContent(chatContainer));
        observer.observe(chatContainer, { childList: true, subtree: true });
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

    function resetChatData() {
        chatMessages = [];
        if (CONFIG.enableLogging) console.log('Chat data reset due to URL change');
    }

    function checkUrlChange() {
        if (location.href !== lastUrl) {
            lastUrl = location.href;
            resetChatData();
            if (CONFIG.chatContainerSelector) {
                observeChatContainer(CONFIG.chatContainerSelector);
            }
        }
    }

    /***** Utility Functions *****/
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
            'section'
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

    function buildElementDescription(el, selector) {
        let description = selector;
        if (el.id) description += ` | #${el.id}`;
        if (el.className) description += ` | .${el.className.trim().replace(/\s+/g, '.')}`;
        return description;
    }

    function getUniqueSelector(el) {
        if (el.id) return `#${el.id}`;
        if (el.className) {
            const className = `.${el.className.trim().replace(/\s+/g, '.')}`;
            return `${el.tagName.toLowerCase()}${className}`;
        }
        return el.tagName.toLowerCase();
    }

    /***** UI Event Handlers *****/
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

    function closeDropdowns() {
        document.querySelectorAll('.dropdown-content, #chat-selector-container').forEach(el => {
            el.style.display = 'none';
        });
    }

    function downloadChat(format) {
        const content = format === 'json' ? JSON.stringify(chatMessages, null, 2) : chatMessages.join('\n\n');
        const blob = new Blob([content], {type: format === 'json' ? 'application/json' : 'text/plain'});
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `chat_export.${format}`;
        a.click();
        URL.revokeObjectURL(a.href);
    }

    function copySelectorToClipboard() {
        const select = document.getElementById('chat-container-dropdown');
        const selectorText = select.value;
        navigator.clipboard.writeText(selectorText).then(() => {
            alert('Selector copied to clipboard!');
        }, () => {
            alert('Failed to copy selector');
        });
    }

    /***** Start Script *****/
    window.addEventListener('load', init);

    // Expose event handlers to the global scope
    window.onSelectChange = onSelectChange;
    window.onCopyButtonClick = onCopyButtonClick;
    window.toggleSelectorVisibility = toggleSelectorVisibility;
    window.toggleDownloadOptions = toggleDownloadOptions;
    window.closeDropdowns = closeDropdowns;
    window.downloadChat = downloadChat;
    window.copySelectorToClipboard = copySelectorToClipboard;
})();
