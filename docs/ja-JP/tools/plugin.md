---
read_when:
    - Plugin をインストールまたは設定する
    - Plugin の検出ルールと読み込みルールを理解する
    - Codex/Claude 互換の Plugin バンドルを扱う
sidebarTitle: Install and Configure
summary: OpenClaw Plugin をインストール、設定、管理する
title: Plugins
x-i18n:
    generated_at: "2026-04-21T04:51:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: a34995fe8a27b7c96fb2abd9ef55bea38ea7ba2ff4e867977683e09f799e9e8f
    source_path: tools/plugin.md
    workflow: 15
---

# Plugins

Plugin は OpenClaw に新しい機能を追加します。たとえば、チャネル、モデル provider、
ツール、Skills、音声、リアルタイム文字起こし、リアルタイム音声、
media-understanding、画像生成、動画生成、Web 取得、Web
検索などです。一部の Plugin は **core**（OpenClaw に同梱）で、他は
**external**（コミュニティが npm で公開）です。

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

    その後、config ファイルの `plugins.entries.\<id\>.config` で設定します。

  </Step>
</Steps>

チャットネイティブな制御を好む場合は、`commands.plugins: true` を有効にして次を使ってください。

```text
/plugin install clawhub:@openclaw/voice-call
/plugin show voice-call
/plugin enable voice-call
```

インストール経路は CLI と同じリゾルバを使います。ローカルパス/アーカイブ、明示的な
`clawhub:<pkg>`、または素の package spec（まず ClawHub、次に npm へフォールバック）です。

config が不正な場合、通常インストールは closed fail し、
`openclaw doctor --fix` を案内します。唯一の回復例外は、`openclaw.install.allowInvalidConfigRecovery` に opt-in した Plugin 向けの、限定的な bundled Plugin 再インストール経路です。

パッケージ化された OpenClaw インストールでは、同梱されたすべての Plugin の
ランタイム依存ツリーを事前にインストールしません。同梱された OpenClaw 所有 Plugin が、Plugin config、従来のチャネル config、またはデフォルト有効 manifest から有効になっている場合、起動時修復では、その Plugin を import する前に、その Plugin が宣言したランタイム依存関係だけを修復します。
external Plugin とカスタム読み込みパスは、引き続き `openclaw plugins install` でインストールする必要があります。

## Plugin の種類

OpenClaw は 2 つの Plugin 形式を認識します。

| 形式       | 仕組み                                                         | 例                                                     |
| ---------- | -------------------------------------------------------------- | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + ランタイム module。プロセス内で実行   | 公式 Plugin、コミュニティ npm package                  |
| **Bundle** | Codex/Claude/Cursor 互換レイアウト。OpenClaw 機能にマップされる | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

どちらも `openclaw plugins list` に表示されます。bundle の詳細は [Plugin Bundles](/ja-JP/plugins/bundles) を参照してください。

native Plugin を作成する場合は、[Building Plugins](/ja-JP/plugins/building-plugins)
と [Plugin SDK Overview](/ja-JP/plugins/sdk-overview) から始めてください。

## 公式 Plugins

### インストール可能（npm）

| Plugin          | Package                | ドキュメント                         |
| --------------- | ---------------------- | ------------------------------------ |
| Matrix          | `@openclaw/matrix`     | [Matrix](/ja-JP/channels/matrix)           |
| Microsoft Teams | `@openclaw/msteams`    | [Microsoft Teams](/ja-JP/channels/msteams) |
| Nostr           | `@openclaw/nostr`      | [Nostr](/ja-JP/channels/nostr)             |
| Voice Call      | `@openclaw/voice-call` | [Voice Call](/ja-JP/plugins/voice-call)    |
| Zalo            | `@openclaw/zalo`       | [Zalo](/ja-JP/channels/zalo)               |
| Zalo Personal   | `@openclaw/zalouser`   | [Zalo Personal](/ja-JP/plugins/zalouser)   |

### Core（OpenClaw に同梱）

<AccordionGroup>
  <Accordion title="モデル provider（デフォルトで有効）">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="メモリ Plugin">
    - `memory-core` — 同梱のメモリ検索（`plugins.slots.memory` によるデフォルト）
    - `memory-lancedb` — 必要時インストールの長期メモリ。自動 recall/capture 付き（`plugins.slots.memory = "memory-lancedb"` を設定）
  </Accordion>

  <Accordion title="音声 provider（デフォルトで有効）">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="その他">
    - `browser` — browser tool、`openclaw browser` CLI、`browser.request` gateway method、browser ランタイム、およびデフォルト browser control service 用の同梱 browser Plugin（デフォルトで有効。置き換える前に無効化してください）
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
    load: { paths: ["~/Projects/oss/voice-call-extension"] },
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
| `slots`          | 排他的 slot セレクタ（例: `memory`, `contextEngine`）     |
| `entries.\<id\>` | Plugin 単位のトグル + config                              |

config の変更には **Gateway の再起動が必要** です。Gateway が config
watch + プロセス内再起動を有効にして動作している場合（デフォルトの `openclaw gateway` 経路）、その再起動は通常、config の書き込み後しばらくして自動的に実行されます。

<Accordion title="Plugin の状態: disabled vs missing vs invalid">
  - **Disabled**: Plugin は存在するが、有効化ルールにより無効化されている。config は保持される。
  - **Missing**: config が Plugin ID を参照しているが、discovery では見つからなかった。
  - **Invalid**: Plugin は存在するが、その config が宣言された schema に一致しない。
</Accordion>

## 検出と優先順位

OpenClaw は次の順序で Plugin を走査します（最初に一致したものが優先）。

<Steps>
  <Step title="Config パス">
    `plugins.load.paths` — 明示的なファイルまたはディレクトリパス。
  </Step>

  <Step title="Workspace 拡張">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` と `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`。
  </Step>

  <Step title="グローバル拡張">
    `~/.openclaw/<plugin-root>/*.ts` と `~/.openclaw/<plugin-root>/*/index.ts`。
  </Step>

  <Step title="同梱 Plugins">
    OpenClaw に同梱。多くはデフォルトで有効（モデル provider、音声など）。
    他は明示的な有効化が必要。
  </Step>
</Steps>

### 有効化ルール

- `plugins.enabled: false` はすべての Plugin を無効化する
- `plugins.deny` は常に allow より優先
- `plugins.entries.\<id\>.enabled: false` はその Plugin を無効化する
- workspace 由来の Plugin は **デフォルトで無効**（明示的な有効化が必要）
- 同梱 Plugin は、上書きされない限り組み込みのデフォルト有効セットに従う
- 排他的 slot は、その slot で選択された Plugin を強制的に有効化できる

## Plugin slot（排他的カテゴリ）

一部のカテゴリは排他的です（同時に 1 つだけ有効）。

```json5
{
  plugins: {
    slots: {
      memory: "memory-core", // または無効化するなら "none"
      contextEngine: "legacy", // または Plugin ID
    },
  },
}
```

| Slot            | 制御対象             | デフォルト          |
| --------------- | -------------------- | ------------------- |
| `memory`        | Active Memory Plugin | `memory-core`       |
| `contextEngine` | アクティブな context engine | `legacy` (組み込み) |

## CLI リファレンス

```bash
openclaw plugins list                       # コンパクトな一覧
openclaw plugins list --enabled            # 読み込み済み Plugin のみ
openclaw plugins list --verbose            # Plugin ごとの詳細行
openclaw plugins list --json               # 機械可読な一覧
openclaw plugins inspect <id>              # 詳細表示
openclaw plugins inspect <id> --json       # 機械可読
openclaw plugins inspect --all             # 全体テーブル
openclaw plugins info <id>                 # inspect のエイリアス
openclaw plugins doctor                    # 診断

openclaw plugins install <package>         # インストール（まず ClawHub、次に npm）
openclaw plugins install clawhub:<pkg>     # ClawHub のみからインストール
openclaw plugins install <spec> --force    # 既存インストールを上書き
openclaw plugins install <path>            # ローカルパスからインストール
openclaw plugins install -l <path>         # link（コピーなし、開発用）
openclaw plugins install <plugin> --marketplace <source>
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <spec> --pin      # 解決済みの正確な npm spec を記録
openclaw plugins install <spec> --dangerously-force-unsafe-install
openclaw plugins update <id>             # 1 つの Plugin を更新
openclaw plugins update <id> --dangerously-force-unsafe-install
openclaw plugins update --all            # すべて更新
openclaw plugins uninstall <id>          # config/インストール記録を削除
openclaw plugins uninstall <id> --keep-files
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json

openclaw plugins enable <id>
openclaw plugins disable <id>
```

同梱 Plugin は OpenClaw に含まれています。多くはデフォルトで有効です（たとえば、
同梱モデル provider、同梱音声 provider、同梱 browser
Plugin）。他の同梱 Plugin は依然として `openclaw plugins enable <id>` が必要です。

`--force` は既存のインストール済み Plugin または hook pack をその場で上書きします。
これは、管理対象インストール先へコピーする代わりにソースパスを再利用する `--link` ではサポートされません。

`--pin` は npm 専用です。これは `--marketplace` ではサポートされません。なぜなら
marketplace インストールは npm spec ではなく marketplace ソースメタデータを永続化するためです。

`--dangerously-force-unsafe-install` は、組み込み危険コードスキャナの false
positive に対する緊急用上書きです。これにより、組み込みの `critical` findings を超えて Plugin のインストール
および更新を続行できますが、それでも Plugin の `before_install` ポリシーブロックやスキャン失敗によるブロックは回避しません。

この CLI フラグは、Plugin のインストール/更新フローにのみ適用されます。Gateway バックエンドの skill
依存関係インストールでは、代わりに対応する `dangerouslyForceUnsafeInstall` リクエスト上書きを使います。一方、`openclaw skills install` は引き続き別系統の ClawHub skill ダウンロード/インストールフローです。

互換 bundle は、同じ Plugin の list/inspect/enable/disable
フローに参加します。現在のランタイムサポートには、bundle Skills、Claude command-skills、
Claude `settings.json` デフォルト、Claude `.lsp.json` と manifest で宣言された
`lspServers` デフォルト、Cursor command-skills、および互換 Codex hook
ディレクトリが含まれます。

`openclaw plugins inspect <id>` では、検出された bundle 機能に加えて、
bundle バックエンド Plugin 向けのサポート済みまたは未サポートの MCP および LSP server エントリも報告されます。

Marketplace ソースには、`~/.claude/plugins/known_marketplaces.json` にある Claude 既知 marketplace 名、
ローカル marketplace ルートまたは `marketplace.json` パス、`owner/repo` のような GitHub 短縮形、GitHub repo
URL、または git URL を指定できます。リモート marketplace では、Plugin エントリは
clone された marketplace repo 内に留まり、相対パスソースのみを使用する必要があります。

完全な詳細は [`openclaw plugins` CLI reference](/cli/plugins) を参照してください。

## Plugin API 概要

native Plugin は `register(api)` を公開するエントリオブジェクトを export します。古い
Plugin では従来のエイリアスとして `activate(api)` を使っている場合もありますが、新しい Plugin は
`register` を使うべきです。

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

OpenClaw はエントリオブジェクトを読み込み、Plugin の
有効化時に `register(api)` を呼び出します。ローダーは古い Plugin 向けに依然として `activate(api)` にフォールバックしますが、
同梱 Plugin および新しい external Plugin では、`register` を公開契約として扱うべきです。

一般的な登録メソッド:

| メソッド                                | 登録対象                     |
| --------------------------------------- | ---------------------------- |
| `registerProvider`                      | モデル provider（LLM）       |
| `registerChannel`                       | チャットチャネル             |
| `registerTool`                          | エージェントツール           |
| `registerHook` / `on(...)`              | ライフサイクル hook          |
| `registerSpeechProvider`                | テキスト読み上げ / STT       |
| `registerRealtimeTranscriptionProvider` | ストリーミング STT           |
| `registerRealtimeVoiceProvider`         | 双方向リアルタイム音声       |
| `registerMediaUnderstandingProvider`    | 画像/音声解析                |
| `registerImageGenerationProvider`       | 画像生成                     |
| `registerMusicGenerationProvider`       | 音楽生成                     |
| `registerVideoGenerationProvider`       | 動画生成                     |
| `registerWebFetchProvider`              | Web 取得 / スクレイプ provider |
| `registerWebSearchProvider`             | Web 検索                     |
| `registerHttpRoute`                     | HTTP エンドポイント          |
| `registerCommand` / `registerCli`       | CLI コマンド                 |
| `registerContextEngine`                 | context engine               |
| `registerService`                       | バックグラウンドサービス     |

型付きライフサイクル hook のガード動作:

- `before_tool_call`: `{ block: true }` は終端です。より低い優先度のハンドラはスキップされます。
- `before_tool_call`: `{ block: false }` は no-op であり、先行する block を解除しません。
- `before_install`: `{ block: true }` は終端です。より低い優先度のハンドラはスキップされます。
- `before_install`: `{ block: false }` は no-op であり、先行する block を解除しません。
- `message_sending`: `{ cancel: true }` は終端です。より低い優先度のハンドラはスキップされます。
- `message_sending`: `{ cancel: false }` は no-op であり、先行する cancel を解除しません。

完全な型付き hook 動作については、[SDK Overview](/ja-JP/plugins/sdk-overview#hook-decision-semantics) を参照してください。

## 関連

- [Building Plugins](/ja-JP/plugins/building-plugins) — 独自の Plugin を作成する
- [Plugin Bundles](/ja-JP/plugins/bundles) — Codex/Claude/Cursor bundle 互換性
- [Plugin Manifest](/ja-JP/plugins/manifest) — manifest schema
- [Registering Tools](/ja-JP/plugins/building-plugins#registering-agent-tools) — Plugin でエージェントツールを追加する
- [Plugin Internals](/ja-JP/plugins/architecture) — 機能モデルと読み込みパイプライン
- [Community Plugins](/ja-JP/plugins/community) — サードパーティ一覧
