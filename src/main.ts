import { ItemView, WorkspaceLeaf, Plugin, TFile } from 'obsidian';

// ビューの一意識別子
const VIEW_TYPE_EXTRACTOR = "my-extractor-view";

export default class MyExtractorPlugin extends Plugin {
    async onload() {
        // ビューを登録
        this.registerView(
            VIEW_TYPE_EXTRACTOR,
            (leaf) => new ExtractorView(leaf)
        );

        // リボンアイコンを追加（クリックでサイドバーを開く）
        this.addRibbonIcon("dice", "Extractor View", () => {
            this.activateView();
        });
        // コマンドパレットに追加
        this.addCommand({
            id: 'open-extractor-view',
            name: 'Open Extractor View',
            callback: () => {
                this.activateView();
            }
        });
    }

    async activateView() {
        const { workspace } = this.app;

        let leaf: WorkspaceLeaf | null = null;
        const leaves = workspace.getLeavesOfType(VIEW_TYPE_EXTRACTOR);

        if (leaves.length > 0) {
            leaf = leaves[0];
        } else {
            // 右サイドバーに新しいリーフを作成
            leaf = workspace.getRightLeaf(false);
            await leaf.setViewState({ type: VIEW_TYPE_EXTRACTOR, active: true });
        }

        workspace.revealLeaf(leaf);
    }
}

class ExtractorView extends ItemView {
    mode: 'links' | 'headings' = 'links';

    constructor(leaf: WorkspaceLeaf) {
        super(leaf);
    }

    getViewType() { return VIEW_TYPE_EXTRACTOR; }
    getDisplayText() { return "Extractor"; }
    getIcon() { return "search"; }

    async onOpen() {
        const container = this.containerEl.children[1];
        container.empty();
        container.createEl("h4", { text: "Extractor" });

        // ボタンエリアの作成
        const btnContainer = container.createDiv({ cls: "extractor-buttons" });
        const linkBtn = btnContainer.createEl("button", { text: "Links" });
        const headingBtn = btnContainer.createEl("button", { text: "Headings" });

        // 表示エリアの作成
        const resultContainer = container.createDiv({ cls: "extractor-results" });

        // イベント登録
        linkBtn.onclick = () => { this.mode = 'links'; this.update(resultContainer); };
        headingBtn.onclick = () => { this.mode = 'headings'; this.update(resultContainer); };

        // ファイルの切り替えを検知して更新
        this.registerEvent(this.app.workspace.on('file-open', () => this.update(resultContainer)));
        
        // 初回表示
        this.update(resultContainer);
    }

    async update(container: HTMLElement) {
        container.empty();
        const activeFile = this.app.workspace.getActiveFile();
        if (!activeFile) {
            container.setText("No active file");
            return;
        }

        // ファイルの全文を読み込む
        const content = await this.app.vault.cachedRead(activeFile);
        const lines = content.split("\n");

        if (this.mode === 'links') {
            container.createEl("strong", { text: "Links in this page:" });
            const list = container.createEl("ul");
            
            // リンクは引き続きキャッシュから取るのが正確で早いです
            const cache = this.app.metadataCache.getFileCache(activeFile);
            cache?.links?.forEach(link => {
                const item = list.createEl("li", { cls: "extractor-item-link" });
            
                // リンク要素を作成
                const linkEl = item.createEl("a", {
                    text: link.displayText || link.link, // 表示名があれば使い、なければパスを表示
                    cls: "internal-link",
                });

                // クリックイベント
                linkEl.onclick = (e) => {
                    e.preventDefault();
                    // リンク先を開く
                    this.app.workspace.openLinkText(link.link, activeFile.path, true);
                };

                // (オプション) 行へのジャンプ機能も付ける場合
                const jumpBtn = item.createEl("span", { 
                    text: " 🧷", 
                    cls: "extractor-jump-icon" 
                });
                jumpBtn.onclick = () => {
                    this.jumpToLine(link.position.start.line);
                };
            });
        } else {
            container.createEl("strong", { text: "List-style Headings:" });
            const list = container.createEl("ul");

            // 正規表現で「箇条書きの中の見出し」を探す
            // 例: - ### 見出し  や  * # 見出し
            const headingRegex = /^\s*[-*+]\s+(#{1,6})\s+(.*)$/;

            lines.forEach((line, index) => {
                const match = line.match(headingRegex);
                if (match) {
                    const level = match[1].length; // # の数
                    const title = match[2];         // 見出しのテキスト
                    
                    const item = list.createEl("li", { cls: "extractor-item-heading" });
                
                    // 見出しレベル（#）の表示
                    item.createSpan({ text: "#".repeat(level) + " ", cls: "extractor-hash" });

                    // テキストとリンクをパースして追加
                    this.renderTextWithLinks(item, title, activeFile.path);

                    // 行へのジャンプ機能（リンク以外の場所をクリックしたとき用）
                    item.addEventListener("click", (e) => {
                        // クリックされたのが <a> タグ（内部リンク）なら、ジャンプ処理をスキップ
                        if ((e.target as HTMLElement).tagName === "A") return;
                        this.jumpToLine(index);
                    });
                }
            });
        }
        
    }

        // 指定した行にカーソルを移動させる関数
jumpToLine(line: number) {
    const leaf = this.app.workspace.getMostRecentLeaf();
    if (leaf) {
        const editor = (leaf.view as any).editor;
        if (editor) {
            editor.setCursor({ line: line, ch: 0 });
            editor.scrollIntoView({ from: { line: line, ch: 0 }, to: { line: line, ch: 0 } }, true);
        }
    }
}

/**
 * テキスト内の [[Link]] を解析して要素を追加する
 */
renderTextWithLinks(parentEl: HTMLElement, text: string, sourcePath: string) {
    // Wikilink を探す正規表現: [[ファイル名|表示名]]
    const linkRegex = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;
    let lastIndex = 0;
    let match;

    while ((match = linkRegex.exec(text)) !== null) {
        // リンク前の普通のテキストを追加
        if (match.index > lastIndex) {
            parentEl.createSpan({ text: text.slice(lastIndex, match.index) });
        }

        const linkPath = match[1];
        const linkDisplay = match[2] || linkPath; // エイリアスがなければパスを表示

        // リンク要素を作成
        const linkEl = parentEl.createEl("a", {
            text: linkDisplay,
            cls: "internal-link",
        });

        // リンクのクリックイベント
        linkEl.onclick = (e) => {
            e.preventDefault();
            // Obsidian標準のリンク開きを実行
            this.app.workspace.openLinkText(linkPath, sourcePath, true);
        };

        lastIndex = linkRegex.lastIndex;
    }

    // 残りのテキストを追加
    if (lastIndex < text.length) {
        parentEl.createSpan({ text: text.slice(lastIndex) });
    }
}
}