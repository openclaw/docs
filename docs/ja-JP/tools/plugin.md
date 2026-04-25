---
read_when:
    - Plugin のインストールまたは設定
    - Plugin の検出とロードルールを理解する
    - Codex / Claude 互換 Plugin バンドルを扱う
sidebarTitle: Install and Configure
summary: OpenClaw の Plugin をインストール、設定、管理する
title: Plugin
x-i18n:
    generated_at: "2026-04-25T18:21:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 82e272b1b59006b1f40b4acc3f21a8bca8ecacc1a8b7fb577ad3d874b9a8e326
    source_path: tools/plugin.md
    workflow: 15
---

Plugin は、新しい機能で OpenClaw を拡張します。チャネル、モデルプロバイダー、
agent harnesses、ツール、Skills、音声、リアルタイム文字起こし、リアルタイム
音声、media-understanding、画像生成、動画生成、Web 取得、Web
検索などです。一部の Plugin は **core**（OpenClaw に同梱）、その他は
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

    その後、設定ファイルの `plugins.entries.\<id\>.config` 配下で設定します。

  </Step>
</Steps>

チャットネイティブな制御を使いたい場合は、`commands.plugins: true` を有効にして、次を使います。

```text
/plugin install clawhub:@openclaw/voice-call
/plugin show voice-call
/plugin enable voice-call
```

インストールパスは CLI と同じリゾルバーを使います。ローカルパス / アーカイブ、明示的な
`clawhub:<pkg>`、または裸のパッケージ指定です（まず ClawHub、その後 npm にフォールバック）。

設定が無効な場合、通常インストールはフェイルクローズし、
`openclaw doctor --fix` を案内します。唯一の復旧例外は、同梱 Plugin 向けの限定的な
再インストールパスで、これは
`openclaw.install.allowInvalidConfigRecovery` をオプトインした Plugin に限られます。

パッケージ版 OpenClaw インストールは、同梱 Plugin の
ランタイム依存ツリーをすべて積極的にインストールするわけではありません。
Plugin 設定、レガシーチャネル設定、またはデフォルト有効の manifest から
同梱の OpenClaw 所有 Plugin がアクティブになると、起動時の修復では
インポート前にその Plugin が宣言したランタイム依存のみを修復します。
明示的な無効化が引き続き優先されます: `plugins.entries.<id>.enabled: false`、
`plugins.deny`、`plugins.enabled: false`、および `channels.<id>.enabled: false` は、
その Plugin / チャネルに対する同梱ランタイム依存の自動修復を防ぎます。
external Plugin とカスタムロードパスは、引き続き
`openclaw plugins install` でインストールする必要があります。

## Plugin の種類

OpenClaw は 2 つの Plugin 形式を認識します。

| Format     | How it works                                                       | Examples                                               |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + ランタイムモジュール; プロセス内で実行    | 公式 Plugin、コミュニティ npm パッケージ              |
| **Bundle** | Codex / Claude / Cursor 互換レイアウト; OpenClaw 機能にマップされる | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

どちらも `openclaw plugins list` に表示されます。Bundle の詳細は [Plugin Bundles](/ja-JP/plugins/bundles) を参照してください。

ネイティブ Plugin を書く場合は、[Building Plugins](/ja-JP/plugins/building-plugins)
と [Plugin SDK Overview](/ja-JP/plugins/sdk-overview) から始めてください。

## 公式 Plugin

### インストール可能（npm）

| Plugin          | Package                | Docs                                 |
| --------------- | ---------------------- | ------------------------------------ |
| Matrix          | `@openclaw/matrix`     | [Matrix](/ja-JP/channels/matrix)           |
| Microsoft Teams | `@openclaw/msteams`    | [Microsoft Teams](/ja-JP/channels/msteams) |
| Nostr           | `@openclaw/nostr`      | [Nostr](/ja-JP/channels/nostr)             |
| Voice Call      | `@openclaw/voice-call` | [Voice Call](/ja-JP/plugins/voice-call)    |
| Zalo            | `@openclaw/zalo`       | [Zalo](/ja-JP/channels/zalo)               |
| Zalo Personal   | `@openclaw/zalouser`   | [Zalo Personal](/ja-JP/plugins/zalouser)   |

### Core（OpenClaw に同梱）

<AccordionGroup>
  <Accordion title="モデルプロバイダー（デフォルトで有効）">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="メモリ Plugin">
    - `memory-core` — 同梱メモリ検索（`plugins.slots.memory` のデフォルト）
    - `memory-lancedb` — 必要時インストールの長期メモリ。auto-recall / capture 付き（`plugins.slots.memory = "memory-lancedb"` を設定）
  </Accordion>

  <Accordion title="音声プロバイダー（デフォルトで有効）">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="その他">
    - `browser` — browser ツール、`openclaw browser` CLI、`browser.request` Gateway メソッド、browser ランタイム、およびデフォルト browser control service 用の同梱 browser Plugin（デフォルトで有効。置き換える前に無効化してください）
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

| Field            | Description                                               |
| ---------------- | --------------------------------------------------------- |
| `enabled`        | マスタートグル（デフォルト: `true`）                      |
| `allow`          | Plugin の allowlist（任意）                               |
| `deny`           | Plugin の denylist（任意。deny が優先）                   |
| `load.paths`     | 追加の Plugin ファイル / ディレクトリ                     |
| `slots`          | 排他的スロットセレクター（例: `memory`, `contextEngine`） |
| `entries.\<id\>` | Plugin ごとのトグル + 設定                                |

設定変更には **Gateway の再起動が必要**です。Gateway が config
watch + プロセス内再起動を有効にして実行されている場合（デフォルトの `openclaw gateway` パス）、
通常その再起動は config の書き込み後まもなく自動的に行われます。
ネイティブ Plugin のランタイムコードやライフサイクルフックに対するサポートされた
hot-reload パスはありません。更新した `register(api)` コード、`api.on(...)`
フック、ツール、サービス、または provider / runtime フックが動作することを期待する前に、
ライブチャネルを提供している Gateway プロセスを再起動してください。

`openclaw plugins list` はローカルの Plugin レジストリ / 設定スナップショットです。
そこで `enabled` の Plugin は、永続化されたレジストリと現在の設定により、
その Plugin が参加可能であることを意味します。すでに実行中のリモート Gateway
child が同じ Plugin コードで再起動済みであることまでは証明しません。VPS / container 構成で
wrapper process がある場合は、実際の `openclaw gateway run` プロセスに
再起動を送るか、実行中の Gateway に対して `openclaw gateway restart` を使ってください。

<Accordion title="Plugin の状態: disabled vs missing vs invalid">
  - **Disabled**: Plugin は存在するが、有効化ルールによりオフになっている。設定は保持される。
  - **Missing**: 設定が Plugin ID を参照しているが、検出では見つからなかった。
  - **Invalid**: Plugin は存在するが、その設定が宣言されたスキーマと一致しない。
</Accordion>

## 検出と優先順位

OpenClaw は次の順序で Plugin をスキャンします（最初に一致したものが優先されます）。

<Steps>
  <Step title="設定パス">
    `plugins.load.paths` — 明示的なファイルまたはディレクトリパス。
  </Step>

  <Step title="ワークスペース Plugin">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` および `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`。
  </Step>

  <Step title="グローバル Plugin">
    `~/.openclaw/<plugin-root>/*.ts` および `~/.openclaw/<plugin-root>/*/index.ts`。
  </Step>

  <Step title="同梱 Plugin">
    OpenClaw に同梱。多くはデフォルトで有効です（モデルプロバイダー、音声）。
    その他は明示的な有効化が必要です。
  </Step>
</Steps>

### 有効化ルール

- `plugins.enabled: false` はすべての Plugin を無効化します
- `plugins.deny` は常に allow より優先されます
- `plugins.entries.\<id\>.enabled: false` はその Plugin を無効化します
- ワークスペース由来の Plugin は **デフォルトで無効**です（明示的に有効化する必要があります）
- 同梱 Plugin は、上書きされない限り組み込みのデフォルト有効セットに従います
- 排他的スロットは、そのスロットで選ばれた Plugin を強制有効にすることがあります
- 一部の同梱オプトイン Plugin は、設定が
  Plugin 所有サーフェス（プロバイダーモデル参照、チャネル設定、harness
  runtime など）を指定すると自動的に有効になります
- OpenAI 系の Codex ルートは別々の Plugin 境界を維持します:
  `openai-codex/*` は OpenAI Plugin に属し、同梱 Codex
  app-server Plugin は `embeddedHarness.runtime: "codex"` またはレガシー
  `codex/*` モデル参照で選択されます

## ランタイムフックのトラブルシューティング

Plugin が `plugins list` に表示されるのに、`register(api)` の副作用やフックが
ライブチャットトラフィックで実行されない場合は、まず次を確認してください。

- `openclaw gateway status --deep --require-rpc` を実行し、アクティブな
  Gateway URL、profile、config path、および process が、自分が編集しているものと同じであることを確認する。
- Plugin のインストール / 設定 / コード変更後にライブ Gateway を再起動する。wrapper
  container では、PID 1 が supervisor に過ぎない場合があります。その場合は child
  `openclaw gateway run` process を再起動またはシグナル送信してください。
- `openclaw plugins inspect <id> --json` を使ってフック登録と
  diagnostics を確認する。`llm_input`、
  `llm_output`、`agent_end` のような同梱でない conversation hook には
  `plugins.entries.<id>.hooks.allowConversationAccess=true` が必要です。
- モデル切り替えには、`before_model_resolve` を優先してください。これは agent turn の
  モデル解決前に実行されます。`llm_output` は、モデル試行が assistant 出力を生成した後にしか実行されません。
- 実効セッションモデルの証明には、`openclaw sessions` または
  Gateway の session / status サーフェスを使い、プロバイダーペイロードのデバッグ時には
  Gateway を `--raw-stream --raw-stream-path <path>` 付きで起動してください。

## Plugin スロット（排他的カテゴリ）

一部のカテゴリは排他的です（一度に 1 つだけアクティブ）。

```json5
{
  plugins: {
    slots: {
      memory: "memory-core", // または無効化するには "none"
      contextEngine: "legacy", // または Plugin ID
    },
  },
}
```

| Slot            | What it controls      | Default             |
| --------------- | --------------------- | ------------------- |
| `memory`        | アクティブなメモリ Plugin  | `memory-core`       |
| `contextEngine` | アクティブな context engine | `legacy`（組み込み） |

## CLI リファレンス

```bash
openclaw plugins list                       # コンパクトなインベントリ
openclaw plugins list --enabled            # 有効な Plugin のみ
openclaw plugins list --verbose            # Plugin ごとの詳細行
openclaw plugins list --json               # 機械可読なインベントリ
openclaw plugins inspect <id>              # 詳細情報
openclaw plugins inspect <id> --json       # 機械可読
openclaw plugins inspect --all             # 全体テーブル
openclaw plugins info <id>                 # inspect のエイリアス
openclaw plugins doctor                    # 診断
openclaw plugins registry                  # 永続化されたレジストリ状態を確認
openclaw plugins registry --refresh        # 永続化されたレジストリを再構築

openclaw plugins install <package>         # インストール（まず ClawHub、その後 npm）
openclaw plugins install clawhub:<pkg>     # ClawHub からのみインストール
openclaw plugins install <spec> --force    # 既存のインストールを上書き
openclaw plugins install <path>            # ローカルパスからインストール
openclaw plugins install -l <path>         # 開発用に link（コピーなし）
openclaw plugins install <plugin> --marketplace <source>
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <spec> --pin      # 正確に解決された npm spec を記録
openclaw plugins install <spec> --dangerously-force-unsafe-install
openclaw plugins update <id-or-npm-spec> # 1 つの Plugin を更新
openclaw plugins update <id-or-npm-spec> --dangerously-force-unsafe-install
openclaw plugins update --all            # すべて更新
openclaw plugins uninstall <id>          # 設定 / インストール記録を削除
openclaw plugins uninstall <id> --keep-files
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json

openclaw plugins enable <id>
openclaw plugins disable <id>
```

同梱 Plugin は OpenClaw と一緒に提供されます。多くはデフォルトで有効です（たとえば、
同梱モデルプロバイダー、同梱音声プロバイダー、および同梱 browser
Plugin）。その他の同梱 Plugin は依然として `openclaw plugins enable <id>` が必要です。

`--force` は、既存のインストール済み Plugin または hook pack をその場で上書きします。追跡対象 npm
Plugin の通常のアップグレードには `openclaw plugins update <id-or-npm-spec>` を使ってください。
これは `--link` ではサポートされません。`--link` は管理対象インストール先にコピーせず、
ソースパスを再利用するためです。

`plugins.allow` がすでに設定されている場合、`openclaw plugins install` は
インストールされた Plugin ID を有効化前にその allowlist に追加するため、再起動後すぐに
読み込み可能になります。

OpenClaw は、Plugin インベントリ、貢献の所有権、および起動計画のための
コールドリードモデルとして、永続化されたローカル Plugin レジストリを保持します。インストール、更新、
アンインストール、有効化、無効化の各フローは、Plugin
状態を変更したあとにそのレジストリを更新します。レジストリが欠落している、古い、または無効な場合、`openclaw plugins registry
--refresh` は、Plugin ランタイムモジュールを読み込まずに、耐久的なインストール ledger、設定ポリシー、
manifest / package メタデータからそれを再構築します。

`openclaw plugins update <id-or-npm-spec>` は追跡対象インストールに適用されます。
dist-tag または正確なバージョン付きの npm package spec を渡すと、パッケージ名は
追跡対象 Plugin レコードへ解決し直され、今後の更新用に新しい spec が記録されます。
バージョンなしのパッケージ名を渡すと、正確に pin されたインストールは
レジストリのデフォルトリリースラインに戻ります。インストール済み npm Plugin がすでに
解決されたバージョンと記録済み artifact identity に一致している場合、OpenClaw は
ダウンロード、再インストール、設定書き換えを行わずに更新をスキップします。

`--pin` は npm 専用です。`--marketplace` とは併用できません。
marketplace インストールは npm spec ではなく、
marketplace source metadata を永続化するためです。

`--dangerously-force-unsafe-install` は、組み込みの危険コードスキャナーによる
誤検知に対する非常用オーバーライドです。これにより、組み込みの `critical`
所見を超えて Plugin のインストールと更新を続行できますが、依然として
Plugin の `before_install` ポリシーブロックやスキャン失敗によるブロックは回避しません。

この CLI フラグは Plugin の install / update フローにのみ適用されます。Gateway ベースの Skill
依存インストールは、代わりに対応する `dangerouslyForceUnsafeInstall` リクエスト
オーバーライドを使います。一方で `openclaw skills install` は、別個の ClawHub
Skill ダウンロード / インストールフローのままです。

互換 Bundle は、同じ Plugin list / inspect / enable / disable
フローに参加します。現在のランタイムサポートには、bundle Skills、Claude command-skills、
Claude `settings.json` のデフォルト、Claude `.lsp.json` と manifest 宣言された
`lspServers` のデフォルト、Cursor command-skills、および互換 Codex hook
ディレクトリが含まれます。

`openclaw plugins inspect <id>` は、bundle-backed Plugin について検出された
Bundle 機能に加えて、サポート対象または非対応の MCP / LSP サーバーエントリも報告します。

Marketplace source には、次のものを指定できます:
`~/.claude/plugins/known_marketplaces.json` の Claude の既知 marketplace 名、
ローカル marketplace root または `marketplace.json` パス、
`owner/repo` のような GitHub 省略記法、GitHub repo
URL、または git URL。リモート marketplace の場合、Plugin エントリは
clone された marketplace repo 内にとどまり、source には相対パスのみを使う必要があります。

完全な詳細は [`openclaw plugins` CLI reference](/ja-JP/cli/plugins) を参照してください。

## Plugin API 概要

ネイティブ Plugin は、`register(api)` を公開するエントリオブジェクトをエクスポートします。古い
Plugin では、レガシーエイリアスとして `activate(api)` をまだ使っている場合がありますが、新しい Plugin では
`register` を使ってください。

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

OpenClaw はエントリオブジェクトを読み込み、Plugin
有効化中に `register(api)` を呼び出します。ローダーは古い Plugin に対しては依然として
`activate(api)` にフォールバックしますが、同梱 Plugin と新しい external Plugin は
`register` を公開契約として扱うべきです。

`api.registrationMode` は、Plugin にそのエントリがなぜ読み込まれているかを伝えます。

| Mode            | Meaning                                                                                                                          |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | ランタイム有効化。ツール、フック、サービス、コマンド、ルート、およびその他のライブ副作用を登録する。                            |
| `discovery`     | 読み取り専用の機能検出。プロバイダーとメタデータを登録する。信頼された Plugin エントリコードは読み込まれる場合があるが、ライブ副作用はスキップする。 |
| `setup-only`    | 軽量な setup エントリを通じたチャネル setup メタデータ読み込み。                                                                 |
| `setup-runtime` | ランタイムエントリも必要とするチャネル setup 読み込み。                                                                          |
| `cli-metadata`  | CLI コマンドメタデータ収集のみ。                                                                                                 |

ソケット、データベース、バックグラウンドワーカー、または長寿命クライアントを開く Plugin
エントリは、`api.registrationMode === "full"` で
それらの副作用をガードする必要があります。discovery 読み込みは有効化読み込みとは別に
キャッシュされ、実行中の Gateway レジストリを置き換えません。discovery は非有効化ですが、
import-free ではありません。OpenClaw は、スナップショットを構築するために、信頼された
Plugin エントリやチャネル Plugin モジュールを評価することがあります。
モジュールのトップレベルは軽量かつ副作用なしに保ち、ネットワーククライアント、サブプロセス、
リスナー、認証情報の読み取り、サービス起動は full-runtime パスの背後へ移してください。

一般的な登録メソッド:

| Method                                  | What it registers           |
| --------------------------------------- | --------------------------- |
| `registerProvider`                      | モデルプロバイダー（LLM）   |
| `registerChannel`                       | チャットチャネル            |
| `registerTool`                          | エージェントツール          |
| `registerHook` / `on(...)`              | ライフサイクルフック        |
| `registerSpeechProvider`                | Text-to-speech / STT        |
| `registerRealtimeTranscriptionProvider` | ストリーミング STT          |
| `registerRealtimeVoiceProvider`         | 双方向 realtime voice       |
| `registerMediaUnderstandingProvider`    | 画像 / 音声解析            |
| `registerImageGenerationProvider`       | 画像生成                    |
| `registerMusicGenerationProvider`       | 音楽生成                    |
| `registerVideoGenerationProvider`       | 動画生成                    |
| `registerWebFetchProvider`              | Web fetch / scrape provider |
| `registerWebSearchProvider`             | Web search                  |
| `registerHttpRoute`                     | HTTP エンドポイント         |
| `registerCommand` / `registerCli`       | CLI コマンド                |
| `registerContextEngine`                 | context engine              |
| `registerService`                       | バックグラウンドサービス    |

型付きライフサイクルフックのフックガード動作:

- `before_tool_call`: `{ block: true }` は終端です。より低優先度のハンドラーはスキップされます。
- `before_tool_call`: `{ block: false }` は no-op であり、以前の block を解除しません。
- `before_install`: `{ block: true }` は終端です。より低優先度のハンドラーはスキップされます。
- `before_install`: `{ block: false }` は no-op であり、以前の block を解除しません。
- `message_sending`: `{ cancel: true }` は終端です。より低優先度のハンドラーはスキップされます。
- `message_sending`: `{ cancel: false }` は no-op であり、以前の cancel を解除しません。

ネイティブ Codex app-server 実行は、Codex ネイティブのツールイベントをこの
フックサーフェスへブリッジします。Plugin は `before_tool_call` を通じてネイティブ Codex ツールを
ブロックでき、`after_tool_call` を通じて結果を観測でき、Codex
`PermissionRequest` 承認に参加できます。このブリッジはまだ Codex ネイティブ
ツール引数を書き換えません。正確な Codex ランタイムサポート境界は、
[Codex harness v1 support contract](/ja-JP/plugins/codex-harness#v1-support-contract) にあります。

完全な型付きフック動作については、[SDK overview](/ja-JP/plugins/sdk-overview#hook-decision-semantics) を参照してください。

## 関連

- [Building plugins](/ja-JP/plugins/building-plugins) — 独自の Plugin を作成する
- [Plugin bundles](/ja-JP/plugins/bundles) — Codex / Claude / Cursor Bundle 互換性
- [Plugin manifest](/ja-JP/plugins/manifest) — manifest スキーマ
- [Registering tools](/ja-JP/plugins/building-plugins#registering-agent-tools) — Plugin にエージェントツールを追加する
- [Plugin internals](/ja-JP/plugins/architecture) — 機能モデルとロードパイプライン
- [Community plugins](/ja-JP/plugins/community) — サードパーティ一覧
