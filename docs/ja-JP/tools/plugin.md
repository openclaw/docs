---
read_when:
    - Pluginのインストールまたは設定
    - Pluginの検出と読み込みルールを理解する
    - Codex/Claude互換のPluginバンドルを扱う
sidebarTitle: Install and Configure
summary: OpenClaw Pluginをインストール、設定、管理する
title: Plugin
x-i18n:
    generated_at: "2026-04-24T05:26:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: a2cf5cb6146ae5e52a32201ee08c03211dbea2313b884c696307abc56d3f9cbf
    source_path: tools/plugin.md
    workflow: 15
---

Pluginは新しい機能でOpenClawを拡張します。たとえば、チャネル、モデルプロバイダー、ツール、Skills、音声、リアルタイム文字起こし、リアルタイム音声、メディア理解、画像生成、動画生成、Webフェッチ、Web検索などです。Pluginの一部は**core**（OpenClawに同梱）で、その他は**external**（コミュニティがnpmで公開）です。

## クイックスタート

<Steps>
  <Step title="読み込まれているものを確認する">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="Pluginをインストールする">
    ```bash
    # npmから
    openclaw plugins install @openclaw/voice-call

    # ローカルディレクトリまたはアーカイブから
    openclaw plugins install ./my-plugin
    openclaw plugins install ./my-plugin.tgz
    ```

  </Step>

  <Step title="Gatewayを再起動する">
    ```bash
    openclaw gateway restart
    ```

    その後、設定ファイルの`plugins.entries.\<id\>.config`で設定します。

  </Step>
</Steps>

チャットネイティブな操作を使いたい場合は、`commands.plugins: true`を有効にして、次を使用します。

```text
/plugin install clawhub:@openclaw/voice-call
/plugin show voice-call
/plugin enable voice-call
```

インストールパスはCLIと同じリゾルバーを使用します。ローカルパス/アーカイブ、明示的な
`clawhub:<pkg>`、または素のパッケージ指定（最初にClawHub、その後npmへフォールバック）です。

設定が無効な場合、通常、インストールはフェイルクローズで失敗し、
`openclaw doctor --fix`へ誘導されます。唯一の回復例外は、`openclaw.install.allowInvalidConfigRecovery`に
オプトインしたPlugin向けの、限定的な同梱Plugin再インストールパスです。

パッケージ化されたOpenClawのインストールでは、同梱されているすべてのPluginの
ランタイム依存ツリーが即座にインストールされるわけではありません。同梱のOpenClaw所有Pluginが、
Plugin設定、従来のチャネル設定、またはデフォルト有効のマニフェストからアクティブになると、
起動時の修復では、そのPluginをimportする前に、そのPluginが宣言したランタイム依存のみを修復します。
external Pluginおよびカスタム読み込みパスは、引き続き
`openclaw plugins install`でインストールする必要があります。

## Pluginの種類

OpenClawは2つのPlugin形式を認識します。

| 形式       | 動作方法                                                           | 例                                                     |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + ランタイムモジュール。プロセス内で実行されます | 公式Plugin、コミュニティのnpmパッケージ               |
| **Bundle** | Codex/Claude/Cursor互換レイアウト。OpenClaw機能にマッピングされます | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

どちらも`openclaw plugins list`に表示されます。Bundleの詳細は[Plugin Bundles](/ja-JP/plugins/bundles)を参照してください。

native Pluginを作成する場合は、[Building Plugins](/ja-JP/plugins/building-plugins)
と[Plugin SDK Overview](/ja-JP/plugins/sdk-overview)から始めてください。

## 公式Plugin

### インストール可能（npm）

| Plugin          | パッケージ             | ドキュメント                           |
| --------------- | ---------------------- | -------------------------------------- |
| Matrix          | `@openclaw/matrix`     | [Matrix](/ja-JP/channels/matrix)             |
| Microsoft Teams | `@openclaw/msteams`    | [Microsoft Teams](/ja-JP/channels/msteams)   |
| Nostr           | `@openclaw/nostr`      | [Nostr](/ja-JP/channels/nostr)               |
| Voice Call      | `@openclaw/voice-call` | [Voice Call](/ja-JP/plugins/voice-call)      |
| Zalo            | `@openclaw/zalo`       | [Zalo](/ja-JP/channels/zalo)                 |
| Zalo Personal   | `@openclaw/zalouser`   | [Zalo Personal](/ja-JP/plugins/zalouser)     |

### Core（OpenClawに同梱）

<AccordionGroup>
  <Accordion title="モデルプロバイダー（デフォルトで有効）">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="メモリPlugin">
    - `memory-core` — 同梱のメモリ検索（`plugins.slots.memory`によるデフォルト）
    - `memory-lancedb` — 必要時インストールの長期メモリ。自動想起/自動取得に対応（`plugins.slots.memory = "memory-lancedb"`を設定）
  </Accordion>

  <Accordion title="音声プロバイダー（デフォルトで有効）">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="その他">
    - `browser` — ブラウザツール、`openclaw browser` CLI、`browser.request` Gatewayメソッド、ブラウザランタイム、デフォルトのブラウザ制御サービス向けの同梱ブラウザPlugin（デフォルトで有効。置き換える前に無効化してください）
    - `copilot-proxy` — VS Code Copilot Proxyブリッジ（デフォルトでは無効）
  </Accordion>
</AccordionGroup>

サードパーティのPluginを探していますか？ [Community Plugins](/ja-JP/plugins/community)を参照してください。

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
| `allow`          | Plugin許可リスト（任意）                                  |
| `deny`           | Plugin拒否リスト（任意。拒否が優先）                      |
| `load.paths`     | 追加のPluginファイル/ディレクトリ                         |
| `slots`          | 排他的スロットセレクター（例: `memory`, `contextEngine`） |
| `entries.\<id\>` | Pluginごとのトグル + 設定                                 |

設定変更には**Gatewayの再起動が必要**です。Gatewayが設定監視 + プロセス内再起動を有効にして
実行されている場合（デフォルトの`openclaw gateway`パス）、通常、この再起動は
設定の書き込み後しばらくして自動的に実行されます。

<Accordion title="Pluginの状態: disabled と missing と invalid">
  - **Disabled**: Pluginは存在しますが、有効化ルールによって無効化されています。設定は保持されます。
  - **Missing**: 設定がPlugin IDを参照していますが、検出では見つかりませんでした。
  - **Invalid**: Pluginは存在しますが、その設定が宣言されたスキーマに一致しません。
</Accordion>

## 検出と優先順位

OpenClawは次の順序でPluginをスキャンします（最初に一致したものが優先されます）。

<Steps>
  <Step title="設定パス">
    `plugins.load.paths` — 明示的なファイルまたはディレクトリパス。
  </Step>

  <Step title="ワークスペースPlugin">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` および `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`。
  </Step>

  <Step title="グローバルPlugin">
    `~/.openclaw/<plugin-root>/*.ts` および `~/.openclaw/<plugin-root>/*/index.ts`。
  </Step>

  <Step title="同梱Plugin">
    OpenClawに同梱されています。多くはデフォルトで有効です（モデルプロバイダー、音声など）。
    それ以外は明示的な有効化が必要です。
  </Step>
</Steps>

### 有効化ルール

- `plugins.enabled: false` はすべてのPluginを無効にします
- `plugins.deny` は常にallowより優先されます
- `plugins.entries.\<id\>.enabled: false` はそのPluginを無効にします
- ワークスペース由来のPluginは**デフォルトで無効**です（明示的に有効化する必要があります）
- 同梱Pluginは、上書きされない限り、組み込みのデフォルト有効セットに従います
- 排他的スロットは、そのスロット用に選択されたPluginを強制的に有効化できます

## Pluginスロット（排他的カテゴリ）

一部のカテゴリは排他的です（一度に1つだけ有効）。

```json5
{
  plugins: {
    slots: {
      memory: "memory-core", // または "none" で無効化
      contextEngine: "legacy", // または Plugin ID
    },
  },
}
```

| スロット        | 制御対象                 | デフォルト          |
| --------------- | ------------------------ | ------------------- |
| `memory`        | Active Memory Plugin     | `memory-core`       |
| `contextEngine` | アクティブなコンテキストエンジン | `legacy` (組み込み) |

## CLIリファレンス

```bash
openclaw plugins list                       # 簡潔な一覧
openclaw plugins list --enabled            # 読み込まれているPluginのみ
openclaw plugins list --verbose            # Pluginごとの詳細行
openclaw plugins list --json               # 機械可読な一覧
openclaw plugins inspect <id>              # 詳細情報
openclaw plugins inspect <id> --json       # 機械可読
openclaw plugins inspect --all             # 全体テーブル
openclaw plugins info <id>                 # inspectのエイリアス
openclaw plugins doctor                    # 診断

openclaw plugins install <package>         # インストール（最初にClawHub、その後npm）
openclaw plugins install clawhub:<pkg>     # ClawHubのみからインストール
openclaw plugins install <spec> --force    # 既存インストールを上書き
openclaw plugins install <path>            # ローカルパスからインストール
openclaw plugins install -l <path>         # 開発用にリンク（コピーなし）
openclaw plugins install <plugin> --marketplace <source>
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <spec> --pin      # 解決された正確なnpm specを記録
openclaw plugins install <spec> --dangerously-force-unsafe-install
openclaw plugins update <id-or-npm-spec> # 1つのPluginを更新
openclaw plugins update <id-or-npm-spec> --dangerously-force-unsafe-install
openclaw plugins update --all            # すべて更新
openclaw plugins uninstall <id>          # 設定/インストール記録を削除
openclaw plugins uninstall <id> --keep-files
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json

openclaw plugins enable <id>
openclaw plugins disable <id>
```

同梱PluginはOpenClawに同梱されています。多くはデフォルトで有効です（たとえば、
同梱のモデルプロバイダー、同梱の音声プロバイダー、同梱のbrowser
Plugin）。その他の同梱Pluginは、引き続き`openclaw plugins enable <id>`が必要です。

`--force`は、既存のインストール済みPluginまたはhook packをその場で上書きします。追跡されているnpm
Pluginの通常のアップグレードには、`openclaw plugins update <id-or-npm-spec>`を使用してください。
これは`--link`とは併用できません。`--link`は、管理されたインストール先にコピーする代わりに、
ソースパスを再利用します。

`plugins.allow`がすでに設定されている場合、`openclaw plugins install`は、
インストールしたPlugin IDをそのallowlistに追加してから有効化するため、再起動後すぐに
読み込み可能になります。

`openclaw plugins update <id-or-npm-spec>`は追跡されているインストールに適用されます。
dist-tagまたは正確なバージョン付きのnpmパッケージspecを渡すと、パッケージ名が
追跡中のPluginレコードへ解決し直され、今後の更新用に新しいspecが記録されます。
バージョンなしのパッケージ名を渡すと、正確にpinされたインストールがレジストリの
デフォルトのリリース系列へ戻されます。インストール済みのnpm Pluginが、解決されたバージョンおよび
記録されたアーティファクト識別子にすでに一致している場合、OpenClawはダウンロード、再インストール、
設定の書き換えを行わずに更新をスキップします。

`--pin`はnpm専用です。`--marketplace`とは併用できません。
marketplaceインストールでは、npm specの代わりにmarketplaceソースメタデータが永続化されるためです。

`--dangerously-force-unsafe-install`は、組み込みの危険コードスキャナーによる誤検知に対する
緊急回避用のオーバーライドです。これにより、組み込みの`critical`検出結果があっても
Pluginのインストールと更新を続行できますが、それでもPluginの`before_install`ポリシーブロックや
スキャン失敗によるブロックは回避されません。

このCLIフラグは、Pluginのインストール/更新フローにのみ適用されます。Gateway経由のSkill
依存関係インストールでは、代わりに対応する`dangerouslyForceUnsafeInstall`リクエストオーバーライドを使用し、
`openclaw skills install`は引き続き別個のClawHub Skillダウンロード/インストールフローです。

互換Bundleは、同じPlugin list/inspect/enable/disableフローに参加します。
現在のランタイムサポートには、Bundle Skills、Claude command-skills、
Claude `settings.json`のデフォルト、Claude `.lsp.json`とマニフェスト宣言の
`lspServers`デフォルト、Cursor command-skills、互換Codex hook
ディレクトリが含まれます。

`openclaw plugins inspect <id>`は、Bundle対応Plugin向けに、検出されたBundle機能に加え、
サポートされる、またはサポートされないMCPおよびLSPサーバーエントリも報告します。

Marketplaceソースには、`~/.claude/plugins/known_marketplaces.json`にあるClaudeの既知marketplace名、ローカルのmarketplaceルートまたは`marketplace.json`パス、`owner/repo`のようなGitHub短縮表記、GitHubリポジトリURL、またはgit URLを指定できます。リモートmarketplaceでは、Pluginエントリはクローンされたmarketplaceリポジトリ内にとどまり、ソースには相対パスのみを使用する必要があります。

完全な詳細については、[`openclaw plugins` CLIリファレンス](/ja-JP/cli/plugins)を参照してください。

## Plugin API概要

native Pluginは、`register(api)`を公開するエントリオブジェクトをexportします。古い
Pluginはレガシーなエイリアスとして`activate(api)`をまだ使用している場合がありますが、新しいPluginでは
`register`を使用してください。

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

OpenClawはエントリオブジェクトを読み込み、Pluginの有効化時に`register(api)`を呼び出します。ローダーは古い
Plugin向けに引き続き`activate(api)`へフォールバックしますが、同梱Pluginと新しいexternal Pluginでは、
`register`を公開コントラクトとして扱う必要があります。

一般的な登録メソッド:

| メソッド                                | 登録されるもの              |
| --------------------------------------- | --------------------------- |
| `registerProvider`                      | モデルプロバイダー（LLM）   |
| `registerChannel`                       | チャットチャネル            |
| `registerTool`                          | エージェントツール          |
| `registerHook` / `on(...)`              | ライフサイクルフック        |
| `registerSpeechProvider`                | テキスト読み上げ / STT      |
| `registerRealtimeTranscriptionProvider` | ストリーミングSTT           |
| `registerRealtimeVoiceProvider`         | 双方向リアルタイム音声      |
| `registerMediaUnderstandingProvider`    | 画像/音声解析               |
| `registerImageGenerationProvider`       | 画像生成                    |
| `registerMusicGenerationProvider`       | 音楽生成                    |
| `registerVideoGenerationProvider`       | 動画生成                    |
| `registerWebFetchProvider`              | Webフェッチ / スクレイププロバイダー |
| `registerWebSearchProvider`             | Web検索                     |
| `registerHttpRoute`                     | HTTPエンドポイント          |
| `registerCommand` / `registerCli`       | CLIコマンド                 |
| `registerContextEngine`                 | コンテキストエンジン        |
| `registerService`                       | バックグラウンドサービス    |

型付きライフサイクルフックにおけるフックガードの動作:

- `before_tool_call`: `{ block: true }`は終端です。より低い優先度のハンドラーはスキップされます。
- `before_tool_call`: `{ block: false }`は何もしない動作で、以前のblockを解除しません。
- `before_install`: `{ block: true }`は終端です。より低い優先度のハンドラーはスキップされます。
- `before_install`: `{ block: false }`は何もしない動作で、以前のblockを解除しません。
- `message_sending`: `{ cancel: true }`は終端です。より低い優先度のハンドラーはスキップされます。
- `message_sending`: `{ cancel: false }`は何もしない動作で、以前のcancelを解除しません。

完全な型付きフックの動作については、[SDK Overview](/ja-JP/plugins/sdk-overview#hook-decision-semantics)を参照してください。

## 関連

- [Building Plugins](/ja-JP/plugins/building-plugins) — 独自のPluginを作成する
- [Plugin Bundles](/ja-JP/plugins/bundles) — Codex/Claude/Cursor Bundle互換性
- [Plugin Manifest](/ja-JP/plugins/manifest) — マニフェストスキーマ
- [Registering Tools](/ja-JP/plugins/building-plugins#registering-agent-tools) — Pluginにエージェントツールを追加する
- [Plugin Internals](/ja-JP/plugins/architecture) — 機能モデルと読み込みパイプライン
- [Community Plugins](/ja-JP/plugins/community) — サードパーティ一覧
