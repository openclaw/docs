---
read_when:
    - Plugin のインストールまたは設定
    - Plugin の検出と読み込みルールを理解する
    - Codex/Claude 互換 Plugin バンドルを扱う
sidebarTitle: Install and Configure
summary: OpenClaw Plugin をインストール、設定、管理する
title: Plugin
x-i18n:
    generated_at: "2026-04-23T14:10:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 63aa1b5ed9e3aaa2117b78137a457582b00ea47d94af7da3780ddae38e8e3665
    source_path: tools/plugin.md
    workflow: 15
---

# Plugin

Plugin は OpenClaw を新しい機能で拡張します。チャネル、モデル provider、
ツール、Skills、音声、リアルタイム文字起こし、リアルタイム音声、
media-understanding、画像生成、動画生成、Web fetch、Web
検索などを追加できます。一部の Plugin は **core**（OpenClaw に同梱）で、他は
**external**（コミュニティによって npm で公開）です。

## クイックスタート

<Steps>
  <Step title="何が読み込まれているか確認する">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="Plugin をインストールする">
    ```bash
    # npm から
    openclaw plugins install @openclaw/voice-call

    # ローカルディレクトリまたはアーカイブから
    openclaw plugins install ./my-plugin
    openclaw plugins install ./my-plugin.tgz
    ```

  </Step>

  <Step title="Gateway を再起動する">
    ```bash
    openclaw gateway restart
    ```

    その後、config ファイルの `plugins.entries.\<id\>.config` 配下で設定してください。

  </Step>
</Steps>

チャットネイティブな制御を使いたい場合は、`commands.plugins: true` を有効にして次を使ってください。

```text
/plugin install clawhub:@openclaw/voice-call
/plugin show voice-call
/plugin enable voice-call
```

インストール経路では CLI と同じ resolver を使います。ローカルパス/アーカイブ、
明示的な `clawhub:<pkg>`、または bare package spec（ClawHub 優先、その後 npm フォールバック）です。

config が無効な場合、インストールは通常 fail-closed で失敗し、
`openclaw doctor --fix` を案内します。唯一の回復例外は、
`openclaw.install.allowInvalidConfigRecovery`
にオプトインした Plugin のための、限定的な同梱 Plugin 再インストール経路です。

パッケージ化された OpenClaw インストールでは、すべての同梱 Plugin の
ランタイム依存ツリーを事前に積極インストールしません。同梱の OpenClaw 所有 Plugin が
plugin config、従来チャネル config、またはデフォルト有効 manifest から有効な場合、
起動時はその Plugin が宣言したランタイム依存関係だけを修復してから import します。
external Plugin やカスタム load path は、引き続き
`openclaw plugins install` でインストールする必要があります。

## Plugin の種類

OpenClaw は 2 つの Plugin 形式を認識します。

| 形式       | 動作方法                                                          | 例                                                     |
| ---------- | ----------------------------------------------------------------- | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + ランタイムモジュール。プロセス内で実行    | 公式 Plugin、コミュニティ npm パッケージ              |
| **Bundle** | Codex/Claude/Cursor 互換レイアウト。OpenClaw 機能にマッピング     | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

どちらも `openclaw plugins list` に表示されます。bundle の詳細は [Plugin Bundles](/ja-JP/plugins/bundles) を参照してください。

native Plugin を書く場合は、[Building Plugins](/ja-JP/plugins/building-plugins)
と [Plugin SDK Overview](/ja-JP/plugins/sdk-overview) から始めてください。

## 公式 Plugin

### インストール可能（npm）

| Plugin          | パッケージ             | ドキュメント                            |
| --------------- | ---------------------- | --------------------------------------- |
| Matrix          | `@openclaw/matrix`     | [Matrix](/ja-JP/channels/matrix)              |
| Microsoft Teams | `@openclaw/msteams`    | [Microsoft Teams](/ja-JP/channels/msteams)    |
| Nostr           | `@openclaw/nostr`      | [Nostr](/ja-JP/channels/nostr)                |
| Voice Call      | `@openclaw/voice-call` | [Voice Call](/ja-JP/plugins/voice-call)       |
| Zalo            | `@openclaw/zalo`       | [Zalo](/ja-JP/channels/zalo)                  |
| Zalo Personal   | `@openclaw/zalouser`   | [Zalo Personal](/ja-JP/plugins/zalouser)      |

### Core（OpenClaw 同梱）

<AccordionGroup>
  <Accordion title="モデル provider（デフォルトで有効）">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="メモリ Plugin">
    - `memory-core` — 同梱メモリ検索（デフォルトで `plugins.slots.memory` 経由）
    - `memory-lancedb` — install-on-demand の長期メモリ。auto-recall/capture 付き（`plugins.slots.memory = "memory-lancedb"` を設定）
  </Accordion>

  <Accordion title="音声 provider（デフォルトで有効）">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="その他">
    - `browser` — browser ツール、`openclaw browser` CLI、`browser.request` gateway メソッド、browser ランタイム、およびデフォルト browser control service 用の同梱 browser Plugin（デフォルトで有効。置き換える前に無効化してください）
    - `copilot-proxy` — VS Code Copilot Proxy ブリッジ（デフォルトでは無効）
  </Accordion>
</AccordionGroup>

サードパーティ Plugin を探していますか？ [Community Plugins](/ja-JP/plugins/community) を参照してください。

## 設定

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    deny: ["untrusted-plugin"],
    load: { paths: ["~/Projects/oss/voice-call-plugin"] },
    entries: {
      "voice-call": { enabled: true, config: { provider: "twilio" } },
    },
  },
}
```

| フィールド       | 説明                                                      |
| ---------------- | --------------------------------------------------------- |
| `enabled`        | マスタートグル（デフォルト: `true`）                      |
| `allow`          | Plugin allowlist（任意）                                  |
| `deny`           | Plugin denylist（任意。deny が優先）                      |
| `load.paths`     | 追加の Plugin ファイル/ディレクトリ                       |
| `slots`          | 排他的スロット選択子（例: `memory`, `contextEngine`）     |
| `entries.\<id\>` | Plugin 単位の有効/無効と config                           |

config の変更には **Gateway の再起動が必要** です。Gateway が config
watch + プロセス内再起動有効（デフォルトの `openclaw gateway` 経路）で動いている場合、
その再起動は通常、config 書き込み後しばらくして自動的に行われます。

<Accordion title="Plugin 状態: 無効 / 不在 / 無効設定">
  - **無効**: Plugin は存在するが、有効化ルールによって無効化されている。config は保持されます。
  - **不在**: config が Plugin id を参照しているが、検出で見つからなかった。
  - **無効設定**: Plugin は存在するが、その config が宣言スキーマに一致しない。
</Accordion>

## 検出と優先順位

OpenClaw は以下の順序で Plugin をスキャンします（最初に一致したものが勝ちます）。

<Steps>
  <Step title="Config パス">
    `plugins.load.paths` — 明示的なファイルまたはディレクトリパス。
  </Step>

  <Step title="ワークスペース Plugin">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` と `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`。
  </Step>

  <Step title="グローバル Plugin">
    `~/.openclaw/<plugin-root>/*.ts` と `~/.openclaw/<plugin-root>/*/index.ts`。
  </Step>

  <Step title="同梱 Plugin">
    OpenClaw に同梱されています。多くはデフォルトで有効です（モデル provider、音声など）。
    他は明示的な有効化が必要です。
  </Step>
</Steps>

### 有効化ルール

- `plugins.enabled: false` はすべての Plugin を無効化します
- `plugins.deny` は常に allow より優先されます
- `plugins.entries.\<id\>.enabled: false` はその Plugin を無効化します
- ワークスペース由来の Plugin は **デフォルトで無効** です（明示的に有効化する必要があります）
- 同梱 Plugin は、上書きされない限り組み込みの default-on セットに従います
- 排他的スロットは、そのスロット用に選択された Plugin を強制有効化できます

## Plugin スロット（排他的カテゴリ）

一部カテゴリは排他的です（同時に有効なのは 1 つだけ）。

```json5
{
  plugins: {
    slots: {
      memory: "memory-core", // または無効化するには "none"
      contextEngine: "legacy", // または Plugin id
    },
  },
}
```

| スロット        | 制御対象               | デフォルト          |
| --------------- | ---------------------- | ------------------- |
| `memory`        | アクティブなメモリ Plugin | `memory-core`    |
| `contextEngine` | アクティブな context engine | `legacy`（組み込み） |

## CLI リファレンス

```bash
openclaw plugins list                       # コンパクトな一覧
openclaw plugins list --enabled            # 読み込まれている Plugin のみ
openclaw plugins list --verbose            # Plugin ごとの詳細行
openclaw plugins list --json               # 機械可読な一覧
openclaw plugins inspect <id>              # 詳細表示
openclaw plugins inspect <id> --json       # 機械可読
openclaw plugins inspect --all             # 全体テーブル
openclaw plugins info <id>                 # inspect の別名
openclaw plugins doctor                    # 診断

openclaw plugins install <package>         # インストール（ClawHub 優先、その後 npm）
openclaw plugins install clawhub:<pkg>     # ClawHub のみからインストール
openclaw plugins install <spec> --force    # 既存インストールを上書き
openclaw plugins install <path>            # ローカルパスからインストール
openclaw plugins install -l <path>         # 開発用リンク（コピーしない）
openclaw plugins install <plugin> --marketplace <source>
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <spec> --pin      # 正確な解決済み npm spec を記録
openclaw plugins install <spec> --dangerously-force-unsafe-install
openclaw plugins update <id-or-npm-spec> # 1 つの Plugin を更新
openclaw plugins update <id-or-npm-spec> --dangerously-force-unsafe-install
openclaw plugins update --all            # すべて更新
openclaw plugins uninstall <id>          # config/インストール記録を削除
openclaw plugins uninstall <id> --keep-files
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json

openclaw plugins enable <id>
openclaw plugins disable <id>
```

同梱 Plugin は OpenClaw と一緒に出荷されます。多くはデフォルトで有効です（たとえば
同梱モデル provider、同梱音声 provider、同梱 browser
Plugin など）。その他の同梱 Plugin では、依然として
`openclaw plugins enable <id>` が必要です。

`--force` は、既存のインストール済み Plugin または hook pack をその場で上書きします。追跡対象の npm
Plugin を通常アップグレードするには
`openclaw plugins update <id-or-npm-spec>` を使ってください。`--link` とは併用できません。`--link` は、管理対象インストール先へコピーする代わりにソースパスを再利用するためです。

`plugins.allow` がすでに設定されている場合、`openclaw plugins install` は、
インストールした Plugin id を有効化前にその allowlist に追加するため、再起動後すぐに読み込めるようになります。

`openclaw plugins update <id-or-npm-spec>` は追跡済みインストールに適用されます。
dist-tag または正確なバージョン付きの npm package spec を渡すと、パッケージ名を追跡済み Plugin レコードに解決し直し、今後の更新のために新しい spec を記録します。
バージョンなしでパッケージ名を渡すと、正確に pin されたインストールをレジストリのデフォルトリリースラインに戻します。インストール済み npm Plugin がすでに解決済みバージョンと記録された成果物識別情報に一致している場合、OpenClaw はダウンロード、再インストール、config 書き換えを行わずに更新をスキップします。

`--pin` は npm 専用です。`--marketplace` とは併用できません。
marketplace インストールでは npm spec ではなく marketplace のソースメタデータが保持されるためです。

`--dangerously-force-unsafe-install` は、組み込み dangerous-code scanner の誤検知に対する非常用上書きです。組み込みの `critical` 検出結果があっても Plugin インストールと Plugin 更新を続行できますが、Plugin の `before_install` ポリシーブロックやスキャン失敗によるブロックまでは回避しません。

この CLI フラグは Plugin のインストール/更新フローにのみ適用されます。Gateway バックの Skill 依存関係インストールでは、代わりに対応する `dangerouslyForceUnsafeInstall` リクエスト上書きを使います。一方、`openclaw skills install` は、別個の ClawHub Skill ダウンロード/インストールフローのままです。

互換 bundle も同じ Plugin の list/inspect/enable/disable
フローに参加します。現在のランタイムサポートには、bundle Skills、Claude command-skills、
Claude `settings.json` デフォルト、Claude `.lsp.json` と manifest 宣言の
`lspServers` デフォルト、Cursor command-skills、互換 Codex hook
ディレクトリが含まれます。

`openclaw plugins inspect <id>` では、bundle バック Plugin について、検出された bundle capability と、サポート済みまたは未サポートの MCP および LSP サーバーエントリも報告されます。

マーケットプレイスのソースには、
`~/.claude/plugins/known_marketplaces.json` 内の Claude 既知マーケットプレイス名、
ローカルのマーケットプレイスルートまたは `marketplace.json` パス、
`owner/repo` のような GitHub 短縮表記、GitHub リポジトリ URL、または git URL を使えます。リモートマーケットプレイスでは、Plugin エントリはクローンしたマーケットプレイスリポジトリ内に留まり、ソースには相対パスのみを使う必要があります。

詳細は [`openclaw plugins` CLI リファレンス](/ja-JP/cli/plugins) を参照してください。

## Plugin API の概要

native Plugin は `register(api)` を公開するエントリオブジェクトを export します。
古い Plugin では従来の別名として `activate(api)` を使っている場合もありますが、新しい Plugin では `register` を使うべきです。

```typescript
export default definePluginEntry({
  id: "my-plugin",
  name: "My Plugin",
  register(api) {
    api.registerProvider({
      /* ... */
    });
    api.registerTool({
      /* ... */
    });
    api.registerChannel({
      /* ... */
    });
  },
});
```

OpenClaw はエントリオブジェクトを読み込み、Plugin 有効化中に `register(api)` を呼び出します。
ローダーは古い Plugin 用に `activate(api)` にも引き続きフォールバックしますが、
同梱 Plugin と新しい external Plugin では `register` を公開契約として扱うべきです。

一般的な登録メソッド:

| メソッド                                | 登録するもの                |
| --------------------------------------- | --------------------------- |
| `registerProvider`                      | モデル provider（LLM）      |
| `registerChannel`                       | チャットチャネル            |
| `registerTool`                          | エージェントツール          |
| `registerHook` / `on(...)`              | ライフサイクルフック        |
| `registerSpeechProvider`                | Text-to-speech / STT        |
| `registerRealtimeTranscriptionProvider` | ストリーミング STT          |
| `registerRealtimeVoiceProvider`         | 双方向リアルタイム音声      |
| `registerMediaUnderstandingProvider`    | 画像/audio 解析             |
| `registerImageGenerationProvider`       | 画像生成                    |
| `registerMusicGenerationProvider`       | 音楽生成                    |
| `registerVideoGenerationProvider`       | 動画生成                    |
| `registerWebFetchProvider`              | Web fetch / scrape provider |
| `registerWebSearchProvider`             | Web 検索                    |
| `registerHttpRoute`                     | HTTP エンドポイント         |
| `registerCommand` / `registerCli`       | CLI コマンド                |
| `registerContextEngine`                 | context engine              |
| `registerService`                       | バックグラウンドサービス    |

型付きライフサイクルフックのガード動作:

- `before_tool_call`: `{ block: true }` は終端です。より低優先度のハンドラーはスキップされます。
- `before_tool_call`: `{ block: false }` は no-op であり、以前の block を解除しません。
- `before_install`: `{ block: true }` は終端です。より低優先度のハンドラーはスキップされます。
- `before_install`: `{ block: false }` は no-op であり、以前の block を解除しません。
- `message_sending`: `{ cancel: true }` は終端です。より低優先度のハンドラーはスキップされます。
- `message_sending`: `{ cancel: false }` は no-op であり、以前の cancel を解除しません。

型付きフック動作の完全版については、[SDK Overview](/ja-JP/plugins/sdk-overview#hook-decision-semantics) を参照してください。

## 関連

- [Building Plugins](/ja-JP/plugins/building-plugins) — 自分の Plugin を作成する
- [Plugin Bundles](/ja-JP/plugins/bundles) — Codex/Claude/Cursor bundle 互換性
- [Plugin Manifest](/ja-JP/plugins/manifest) — manifest スキーマ
- [Registering Tools](/ja-JP/plugins/building-plugins#registering-agent-tools) — Plugin にエージェントツールを追加する
- [Plugin Internals](/ja-JP/plugins/architecture) — capability モデルと読み込みパイプライン
- [Community Plugins](/ja-JP/plugins/community) — サードパーティ一覧
