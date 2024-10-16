// ==UserScript==
// @name         Smiple ChatGPT text exporter
// @namespace    https://chatgpt.com/
// @version      3.1
// @description  Logs chat ChatGPT messages with labels, dynamically updates, and includes a copy button. UI is centered at the top.
// @match        *://*chatgpt.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    /***** Configuration *****/
    const CONFIG = {
        // Set to true to enable console logging
        enableLogging: false,
        // Hard-coded selector for the chat container (leave empty to auto-detect)
        chatContainerSelector: '',
    };

    /***** Variables *****/
    const scannedMessages = new Set();
    let chatMessages = [];
    let observer = null;
    let lastUrl = location.href;

    /***** Initialization *****/
    function init() {
        // Load selector from localStorage if available
        if (!CONFIG.chatContainerSelector) {
            CONFIG.chatContainerSelector = localStorage.getItem('chatContainerSelector') || '';
        }

        // Create UI controls
        createControls();

        // Start observing if a selector is set
        if (CONFIG.chatContainerSelector) {
            observeChatContainer(CONFIG.chatContainerSelector);
        }

        // Monitor URL changes
        setInterval(checkUrlChange, 1000);
    }

    /***** UI Creation *****/
    function createControls() {
        // Remove existing controls
        const existingControls = document.getElementById('chat-logger-controls');
        if (existingControls) existingControls.remove();

        // Create container
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

        // Create label
        const label = document.createElement('label');
        label.innerText = 'Chat Container: ';
        label.style.marginRight = '5px';
        container.appendChild(label);

        // Create dropdown
        const select = document.createElement('select');
        select.id = 'chat-container-dropdown';
        Object.assign(select.style, {
            backgroundColor: '#fff',
            color: '#000',
            border: '1px solid #ccc',
            borderRadius: '3px',
            padding: '2px 5px',
            fontSize: '12px',
        });
        select.addEventListener('change', onSelectChange);
        container.appendChild(select);

        // Create copy button
        const copyButton = document.createElement('button');
        copyButton.id = 'copy-chat-button';
        copyButton.innerText = 'Copy Chat';
        Object.assign(copyButton.style, {
            marginLeft: '10px',
            padding: '2px 5px',
            fontSize: '12px',
            backgroundColor: '#fff',
            color: '#000',
            border: '1px solid #ccc',
            borderRadius: '3px',
            cursor: 'pointer',
        });
        copyButton.addEventListener('click', onCopyButtonClick);
        container.appendChild(copyButton);

        // Add container to body
        document.body.appendChild(container);

        // Populate dropdown
        populateDropdown(select);
    }

    function populateDropdown(select) {
        // Clear existing options
        select.innerHTML = '';

        // Add default option
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.innerText = '-- Select --';
        select.appendChild(defaultOption);

        // Get possible containers
        const possibleContainers = findPossibleChatContainers();
        possibleContainers.forEach(item => {
            const option = document.createElement('option');
            option.value = item.selector;
            option.innerText = item.description;
            select.appendChild(option);
        });

        // Set selected value if available
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
            navigator.clipboard.writeText(chatContent).then(() => {
                showCopyStatus(copyButton, 'Copied!', '#4CAF50', '#fff');
            }, () => {
                showCopyStatus(copyButton, 'Failed to Copy', '#f44336', '#fff');
            });
        } else {
            showCopyStatus(copyButton, 'No Content', '#FFA500', '#fff');
        }
    }

    function showCopyStatus(button, message, bgColor, color) {
        button.innerText = message;
        button.style.backgroundColor = bgColor;
        button.style.color = color;
        setTimeout(() => {
            button.innerText = 'Copy Chat';
            button.style.backgroundColor = '#fff';
            button.style.color = '#000';
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
        messageElements.forEach(el => {
            if (!scannedMessages.has(el)) {
                const role = el.getAttribute('data-message-author-role');
                const textElement = el.querySelector('.text-message') || el;
                const text = textElement.innerText.trim();

                if (text) {
                    let formattedMessage = `${role === 'user' ? 'You' : 'Assistant'} said:\n${text}`;
                    if (CONFIG.enableLogging) console.log(formattedMessage);
                    chatMessages.push(formattedMessage);
                    scannedMessages.add(el);
                }
            }
        });
    }

    function resetChatData() {
        scannedMessages.clear();
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

        const containers = [];
        selectors.forEach(selector => {
            document.querySelectorAll(selector).forEach(el => {
                const description = buildElementDescription(el, selector);
                containers.push({
                    selector: getUniqueSelector(el),
                    description: description
                });
            });
        });

        // Remove duplicates
        return Array.from(new Map(containers.map(item => [item.selector, item])).values());
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

    /***** Start Script *****/
    window.addEventListener('load', init);
})();
