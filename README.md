# Simple ChatGPT Text Exporter

## Overview

This Tampermonkey script enhances the ChatGPT web interface by adding a text export functionality. It allows users to easily copy or download the entire chat conversation, including both user and assistant messages, with proper formatting and real-time updates.

## Features

- Automatically detects and logs chat messages
- Dynamically updates the content of existing messages in real-time
- Provides a user-friendly interface for selecting the chat container
- Includes a "Copy Chat" button for quick export of the most up-to-date conversation
- Offers a download option for saving the conversation as TXT or JSON
- Persists chat container selection across page reloads
- Adapts to URL changes within ChatGPT
- Maintains proper formatting and line breaks in exported text

## Installation

1. Install the Tampermonkey browser extension:
   - [Chrome](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)
   - [Firefox](https://addons.mozilla.org/en-US/firefox/addon/tampermonkey/)
   - [Edge](https://microsoftedge.microsoft.com/addons/detail/tampermonkey/iikmkjmpaadaobahmlepeloendndfphd)

2. Install the script:
   - [Install from GitHub](https://github.com/samomar/Simple-ChatGPT-Text-Exporter/raw/refs/heads/main/simple_chatgpt_text_exporter.user.js)
   - [Install from Greasy Fork](https://greasyfork.org/en/scripts/512815-smiple-chatgpt-text-exporter)

3. Tampermonkey will open a new tab with the script contents and an "Install" button. Click "Install" to proceed.

4. The script is now installed and will run automatically when you visit ChatGPT.

## Usage

1. Navigate to [chat.openai.com](https://chat.openai.com)

2. Look for the control panel at the top center of the page

3. Click the "Select Chat" button to show the dropdown menu

4. Select the appropriate chat container from the dropdown menu

5. If needed, click the clipboard icon next to the dropdown to copy the selected chat container selector to your clipboard

6. Start or continue your ChatGPT conversation 

7. Click the "Copy Chat" button to copy the entire conversation to your clipboard

8. Click the download icon next to the "Copy Chat" button to save the conversation as a TXT or JSON file

9. The script continuously updates the content of existing messages, ensuring that when you copy or download the chat, you get the most current version of the conversation

## Configuration

The script includes a `CONFIG` object with the following options:

- `enableLogging`: Set to `true` to enable console logging (default: `false`)
- `chatContainerSelector`: Hard-coded selector for the chat container (leave empty to use auto-detection)

## Troubleshooting

If the script doesn't work as expected:

1. Ensure you've selected the correct chat container from the dropdown
2. Try refreshing the page and selecting a different container
3. Check the browser console for any error messages
4. If you notice that message updates are not being captured, try clicking the "Copy Chat" button again to get the latest content

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
