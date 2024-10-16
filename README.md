# Simple ChatGPT Text Exporter

## Overview

This Tampermonkey script enhances the ChatGPT web interface by adding a text export functionality. It allows users to easily copy the entire chat conversation, including both user and assistant messages.

## Features

- Automatically detects and logs chat messages
- Dynamically updates as new messages appear
- Provides a user-friendly interface for selecting the chat container
- Includes a "Copy Chat" button for quick export
- Persists chat container selection across page reloads
- Adapts to URL changes within ChatGPT

## Installation

1. Install the Tampermonkey browser extension:
   - [Chrome](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)
   - [Firefox](https://addons.mozilla.org/en-US/firefox/addon/tampermonkey/)
   - [Edge](https://microsoftedge.microsoft.com/addons/detail/tampermonkey/iikmkjmpaadaobahmlepeloendndfphd)

2. Click [here](https://github.com/samomar/Simple-ChatGPT-Text-Exporter/raw/refs/heads/main/simple_chatgpt_text_exporter.user.js) to install the script

3. Tampermonkey will open a new tab with the script contents and an "Install" button. Click "Install" to proceed.

4. The script is now installed and will run automatically when you visit ChatGPT.

## Usage

1. Navigate to [chat.openai.com](https://chat.openai.com)

2. Look for the control panel at the top center of the page

3. Select the appropriate chat container from the dropdown menu

4. Start or continue your ChatGPT conversation 

5. Click the "Copy Chat" button to copy the entire conversation to your clipboard

## Configuration

The script includes a `CONFIG` object with the following options:

- `enableLogging`: Set to `true` to enable console logging (default: `false`)
- `chatContainerSelector`: Hard-coded selector for the chat container (leave empty to use auto-detection)

## Troubleshooting

If the script doesn't work as expected:

1. Ensure you've selected the correct chat container from the dropdown
2. Try refreshing the page and selecting a different container
3. Check the browser console for any error messages

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
