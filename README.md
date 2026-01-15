# Obsidian Content Extractor

This plugin allows you to extract specific elements (like Links and Headings) from your active note and display them in a dedicated sidebar view. 

Unlike standard outline views, this plugin is designed to find **headings nested within list items**, making it perfect for users who use a structured, outliner-style note-taking approach.



## Features

- **Nested Heading Extraction**: Finds headings even when they are inside bullet points (e.g., `- ### My Heading`).
- **Internal Link Extraction**: Lists all `[[wikilinks]]` found in the current document.
- **Interactive Navigation**:
    - Click on a heading or link icon to jump to that specific line in the editor.
    - Click on an internal link to open the linked note.
- **Dynamic Updates**: The view automatically refreshes whenever you switch notes or modify content.

## How to use

1. **Open the View**: Click the dice icon in the left ribbon or use the command palette (`Ctrl/Cmd + P`) and search for `Open Extractor View`.
2. **Switch Modes**: Use the buttons at the top of the sidebar view to toggle between **Links** and **Headings**.
3. **Navigate**: 
    - In **Headings mode**, click the text to scroll the editor to that line.
    - In **Links mode**, click the link to open the file, or click the 📍 icon to find where it is mentioned in the current note.

## Installation

### From GitHub (Manual)
1. Download the `main.js`, `manifest.json`, and `styles.css` from the latest release.
2. Create a folder named `obsidian-content-extractor` in your vault's `.obsidian/plugins/` directory.
3. Move the downloaded files into that folder.
4. Reload Obsidian and enable the plugin in **Settings > Community plugins**.

## Development

If you want to modify the plugin:

1. Clone this repository.
2. Run `npm install` to install dependencies.
3. Run `npm run dev` to start the build process in watch mode.
4. (Optional) Install the **Hot Reload** plugin in Obsidian to see changes immediately.

## License

This plugin is licensed under the [MIT License](LICENSE).