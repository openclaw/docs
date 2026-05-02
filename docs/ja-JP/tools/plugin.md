---
read_when:
    - Plugin のインストールまたは設定
    - Plugin の検出と読み込みルールを理解する
    - Codex/Claude 互換の Plugin バンドルを扱う
sidebarTitle: Install and Configure
summary: OpenClaw Pluginのインストール、設定、管理
title: Plugin
x-i18n:
    generated_at: "2026-05-02T21:08:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: d553c917d9054f4cb5a244ffd0d749c37f6dde230a5887b6b71ba7cf39fcefe5
    source_path: tools/plugin.md
    workflow: 16
---

Plugins は、チャネル、モデルプロバイダー、エージェントハーネス、ツール、Skills、音声、リアルタイム文字起こし、リアルタイム音声、メディア理解、画像生成、動画生成、Web 取得、Web 検索などの新しい機能で OpenClaw を拡張します。一部の Plugin は **core**（OpenClaw に同梱）で、その他は **external** です。ほとんどの外部 Plugin は [ClawHub](/ja-JP/tools/clawhub) を通じて公開および検出されます。その移行が完了するまでの間、直接インストールと OpenClaw 所有の一時的な Plugin パッケージ群については、npm も引き続きサポートされます。

## クイックスタート

コピーアンドペーストできるインストール、一覧表示、アンインストール、更新、公開の例については、[Plugin を管理する](/ja-JP/plugins/manage-plugins) を参照してください。

<Steps>
  <Step title="読み込まれているものを確認する">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="Plugin をインストールする">
    ```bash
    # Search ClawHub plugins
    openclaw plugins search "calendar"

    # From ClawHub
    openclaw plugins install clawhub:openclaw-codex-app-server

    # From npm
    openclaw plugins install npm:@acme/openclaw-plugin

    # From git
    openclaw plugins install git:github.com/acme/openclaw-plugin@v1.0.0

    # From a local directory or archive
    openclaw plugins install ./my-plugin
    openclaw plugins install ./my-plugin.tgz
    ```

  </Step>

  <Step title="Gateway を再起動する">
    ```bash
    openclaw gateway restart
    ```

    その後、設定ファイル内の `plugins.entries.\<id\>.config` で構成します。

  </Step>

  <Step title="チャットネイティブ管理">
    実行中の Gateway では、所有者限定の `/plugins enable` と `/plugins disable` が Gateway 設定リローダーをトリガーします。Gateway は Plugin ランタイムサーフェスをプロセス内で再読み込みし、新しいエージェントターンは更新されたレジストリからツール一覧を再構築します。`/plugins install` は Plugin ソースコードを変更するため、Gateway は現在のプロセスが既にインポート済みのモジュールを安全に再読み込みできるかのように扱うのではなく、再起動を要求します。

  </Step>

  <Step title="Plugin を検証する">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json

    # If the plugin registered a CLI root, run one command from that root.
    openclaw <plugin-command> --help
    ```

    登録済みのツール、サービス、gateway メソッド、フック、または Plugin 所有の CLI コマンドを証明する必要がある場合は、`--runtime` を使用します。通常の `inspect` はコールドなマニフェスト/レジストリチェックであり、意図的に Plugin ランタイムのインポートを避けます。

  </Step>
</Steps>

チャットネイティブ制御を好む場合は、`commands.plugins: true` を有効化して次を使用します。

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

インストールパスは CLI と同じリゾルバーを使用します。ローカルパス/アーカイブ、明示的な `clawhub:<pkg>`、明示的な `npm:<pkg>`、明示的な `git:<repo>`、または npm 経由の裸のパッケージ指定です。

設定が無効な場合、インストールは通常フェイルクローズし、`openclaw doctor --fix` を案内します。唯一の復旧例外は、`openclaw.install.allowInvalidConfigRecovery` をオプトインした Plugin 向けの限定的な同梱 Plugin 再インストールパスです。
Gateway 起動時、ある Plugin の無効な設定はその Plugin に隔離されます。起動は `plugins.entries.<id>.config` の問題をログに記録し、読み込み中にその Plugin をスキップし、他の Plugin とチャネルをオンラインのまま保ちます。`openclaw doctor --fix` を実行すると、その Plugin エントリを無効化し、無効な設定ペイロードを削除することで、不正な Plugin 設定を隔離できます。通常の設定バックアップに以前の値は保持されます。
チャネル設定が、既に検出できなくなった Plugin を参照しているものの、同じ古い Plugin ID が Plugin 設定またはインストール記録に残っている場合、Gateway 起動は警告をログに記録し、他のすべてのチャネルをブロックするのではなく、そのチャネルをスキップします。古いチャネル/Plugin エントリを削除するには `openclaw doctor --fix` を実行します。古い Plugin の証拠がない未知のチャネルキーは引き続き検証に失敗するため、入力ミスは見えるままになります。
`plugins.enabled: false` が設定されている場合、古い Plugin 参照は不活性として扱われます。Gateway 起動は Plugin 検出/読み込み作業をスキップし、`openclaw doctor` は無効化された Plugin 設定を自動削除せず保持します。古い Plugin ID を削除したい場合は、doctor クリーンアップを実行する前に Plugin を再度有効化してください。

Plugin 依存関係のインストールは、明示的なインストール/更新または doctor 修復フローの間にのみ行われます。Gateway 起動、設定リロード、ランタイム検査は、パッケージマネージャーを実行したり依存関係ツリーを修復したりしません。ローカル Plugin は依存関係が既にインストール済みである必要があります。一方、npm、git、ClawHub Plugin は OpenClaw の管理対象 Plugin ルート配下にインストールされます。npm 依存関係は OpenClaw の管理対象 npm ルート内で hoist される場合があります。インストール/更新は信頼の前にその管理対象ルートをスキャンし、アンインストールは npm 管理パッケージを npm 経由で削除します。外部 Plugin とカスタム読み込みパスは、引き続き `openclaw plugins install` を通じてインストールする必要があります。ランタイムコードをインポートしたり依存関係を修復したりせずに、表示可能な各 Plugin の静的な `dependencyStatus` を確認するには、`openclaw plugins list --json` を使用します。
インストール時のライフサイクルについては、[Plugin 依存関係解決](/ja-JP/plugins/dependency-resolution) を参照してください。

ソースチェックアウトは pnpm ワークスペースです。同梱 Plugin を変更するために OpenClaw をクローンした場合は、`pnpm install` を実行してください。そうすると OpenClaw は `extensions/<id>` から同梱 Plugin を読み込むため、編集内容とパッケージローカルの依存関係が直接使用されます。通常の npm ルートインストールは、パッケージ化された OpenClaw 向けであり、ソースチェックアウト開発向けではありません。

## Plugin の種類

OpenClaw は 2 つの Plugin 形式を認識します。

| 形式       | 仕組み                                                             | 例                                                     |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + ランタイムモジュール。プロセス内で実行   | 公式 Plugin、コミュニティ npm パッケージ              |
| **Bundle** | Codex/Claude/Cursor 互換レイアウト。OpenClaw 機能にマッピング    | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

どちらも `openclaw plugins list` に表示されます。Bundle の詳細については、[Plugin Bundles](/ja-JP/plugins/bundles) を参照してください。

Native Plugin を書く場合は、[Plugin の構築](/ja-JP/plugins/building-plugins) と [Plugin SDK 概要](/ja-JP/plugins/sdk-overview) から始めてください。

## パッケージエントリポイント

Native Plugin npm パッケージは、`package.json` で `openclaw.extensions` を宣言する必要があります。各エントリはパッケージディレクトリ内に留まり、読み取り可能なランタイムファイル、または `src/index.ts` から `dist/index.js` のように推論されたビルド済み JavaScript peer を持つ TypeScript ソースファイルに解決される必要があります。

公開済みランタイムファイルがソースエントリと同じパスにない場合は、`openclaw.runtimeExtensions` を使用します。存在する場合、`runtimeExtensions` はすべての `extensions` エントリに対して正確に 1 つのエントリを含む必要があります。一致しないリストは、ソースパスへ黙ってフォールバックするのではなく、インストールと Plugin 検出を失敗させます。`openclaw.setupEntry` も公開する場合は、そのビルド済み JavaScript peer に `openclaw.runtimeSetupEntry` を使用します。そのファイルは宣言された場合に必須です。

```json
{
  "name": "@acme/openclaw-plugin",
  "openclaw": {
    "extensions": ["./src/index.ts"],
    "runtimeExtensions": ["./dist/index.js"]
  }
}
```

## 公式 Plugin

### 移行中の OpenClaw 所有 npm パッケージ

ClawHub はほとんどの Plugin の主要な配布パスです。現在のパッケージ化された OpenClaw リリースには既に多くの公式 Plugin が同梱されているため、通常のセットアップではそれらを個別に npm インストールする必要はありません。すべての OpenClaw 所有 Plugin が ClawHub に移行するまで、OpenClaw は古い/カスタムインストールと直接 npm ワークフロー向けに、いくつかの `@openclaw/*` Plugin パッケージを引き続き npm で出荷します。

npm が `@openclaw/*` Plugin パッケージを deprecated と報告する場合、そのパッケージバージョンは古い外部パッケージ系列のものです。新しい npm パッケージが公開されるまでは、現在の OpenClaw の同梱 Plugin またはローカルチェックアウトを使用してください。

| Plugin          | パッケージ                 | ドキュメント                             |
| --------------- | -------------------------- | ---------------------------------------- |
| BlueBubbles     | `@openclaw/bluebubbles`    | [BlueBubbles](/ja-JP/channels/bluebubbles)     |
| Discord         | `@openclaw/discord`        | [Discord](/ja-JP/channels/discord)             |
| Feishu          | `@openclaw/feishu`         | [Feishu](/ja-JP/channels/feishu)               |
| Matrix          | `@openclaw/matrix`         | [Matrix](/ja-JP/channels/matrix)               |
| Mattermost      | `@openclaw/mattermost`     | [Mattermost](/ja-JP/channels/mattermost)       |
| Microsoft Teams | `@openclaw/msteams`        | [Microsoft Teams](/ja-JP/channels/msteams)     |
| Nextcloud Talk  | `@openclaw/nextcloud-talk` | [Nextcloud Talk](/ja-JP/channels/nextcloud-talk) |
| Nostr           | `@openclaw/nostr`          | [Nostr](/ja-JP/channels/nostr)                 |
| Synology Chat   | `@openclaw/synology-chat`  | [Synology Chat](/ja-JP/channels/synology-chat) |
| Tlon            | `@openclaw/tlon`           | [Tlon](/ja-JP/channels/tlon)                   |
| WhatsApp        | `@openclaw/whatsapp`       | [WhatsApp](/ja-JP/channels/whatsapp)           |
| Zalo            | `@openclaw/zalo`           | [Zalo](/ja-JP/channels/zalo)                   |
| Zalo Personal   | `@openclaw/zalouser`       | [Zalo Personal](/ja-JP/plugins/zalouser)       |

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
    - `memory-core` — 同梱メモリ検索（`plugins.slots.memory` 経由のデフォルト）
    - `memory-lancedb` — 自動リコール/キャプチャを備えた LanceDB ベースの長期メモリ（`plugins.slots.memory = "memory-lancedb"` を設定）

    OpenAI 互換の埋め込み設定、Ollama の例、リコール制限、トラブルシューティングについては、[Memory LanceDB](/ja-JP/plugins/memory-lancedb) を参照してください。

  </Accordion>

  <Accordion title="音声プロバイダー（デフォルトで有効）">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="その他">
    - `browser` — browser ツール、`openclaw browser` CLI、`browser.request` gateway メソッド、browser ランタイム、デフォルト browser 制御サービス向けの同梱 browser Plugin（デフォルトで有効。置き換える前に無効化してください）
    - `copilot-proxy` — VS Code Copilot Proxy ブリッジ（デフォルトで無効）

  </Accordion>
</AccordionGroup>

サードパーティ Plugin を探していますか？[コミュニティ Plugin](/ja-JP/plugins/community) を参照してください。

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
| `allow`          | Plugin 許可リスト（任意）                                |
| `deny`           | Plugin 拒否リスト（任意。deny が優先）                   |
| `load.paths`     | 追加の Plugin ファイル/ディレクトリ                      |
| `slots`          | 排他的なスロットセレクター（例: `memory`, `contextEngine`） |
| `entries.\<id\>` | Plugin ごとのトグル + 設定                               |

`plugins.allow` は排他的です。空でない場合、`tools.allow` に `"*"` または特定の Plugin 所有ツール名が含まれていても、列挙された Plugin だけが読み込みまたはツール公開できます。ツール許可リストが Plugin ツールを参照する場合は、所有元の Plugin ID を `plugins.allow` に追加するか、`plugins.allow` を削除してください。`openclaw doctor` はこの形について警告します。

設定変更が `/plugins enable` または `/plugins disable` を通じて行われると、インプロセスの Gateway Plugin リロードがトリガーされます。新しいエージェントターンは、更新された Plugin レジストリからツールリストを再構築します。install、update、uninstall などのソースを変更する操作では、すでにインポート済みの Plugin モジュールをその場で安全に置き換えることができないため、引き続き Gateway プロセスを再起動します。

`openclaw plugins list` はローカルの Plugin レジストリ/設定スナップショットです。そこで `enabled` の Plugin は、永続化されたレジストリと現在の設定がその Plugin の参加を許可していることを意味します。すでに実行中のリモート Gateway が同じ Plugin コードにリロードまたは再起動済みであることは証明しません。ラッパープロセスを使う VPS/コンテナ環境では、実際の `openclaw gateway run` プロセスに対して再起動またはリロードをトリガーする書き込みを送るか、リロードが失敗を報告する場合は実行中の Gateway に対して `openclaw gateway restart` を使用してください。

<Accordion title="Plugin の状態: 無効、欠落、無効な設定">
  - **無効**: Plugin は存在しますが、有効化ルールによってオフになっています。設定は保持されます。
  - **欠落**: 設定が、検出で見つからなかった Plugin ID を参照しています。
  - **無効な設定**: Plugin は存在しますが、その設定が宣言されたスキーマと一致しません。Gateway 起動時はその Plugin だけをスキップします。`openclaw doctor --fix` は、その無効なエントリを無効化し、設定ペイロードを削除することで隔離できます。

</Accordion>

## 検出と優先順位

OpenClaw は次の順序で Plugin をスキャンします（最初の一致が優先されます）。

<Steps>
  <Step title="設定パス">
    `plugins.load.paths` — 明示的なファイルまたはディレクトリパスです。OpenClaw 自身のパッケージ済みバンドル Plugin ディレクトリを指し戻すパスは無視されます。これらの古いエイリアスを削除するには `openclaw doctor --fix` を実行してください。
  </Step>

  <Step title="ワークスペース Plugin">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` と `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`。
  </Step>

  <Step title="グローバル Plugin">
    `~/.openclaw/<plugin-root>/*.ts` と `~/.openclaw/<plugin-root>/*/index.ts`。
  </Step>

  <Step title="バンドル Plugin">
    OpenClaw に同梱されています。多くはデフォルトで有効です（モデルプロバイダー、音声など）。その他は明示的な有効化が必要です。
  </Step>
</Steps>

パッケージ化されたインストールと Docker イメージでは、通常、コンパイル済みの `dist/extensions` ツリーからバンドル Plugin を解決します。バンドル Plugin のソースディレクトリが、対応するパッケージ済みソースパスに bind mount されている場合、たとえば `/app/extensions/synology-chat` の場合、OpenClaw はそのマウントされたソースディレクトリをバンドルソースオーバーレイとして扱い、パッケージ済みの `/app/dist/extensions/synology-chat` バンドルより先に検出します。これにより、すべてのバンドル Plugin を TypeScript ソースへ戻さなくても、メンテナーのコンテナループが機能します。ソースオーバーレイのマウントが存在する場合でもパッケージ済み dist バンドルを強制するには、`OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1` を設定してください。

### 有効化ルール

- `plugins.enabled: false` はすべての Plugin を無効化し、Plugin の検出/読み込み作業をスキップします
- `plugins.deny` は常に allow より優先されます
- `plugins.entries.\<id\>.enabled: false` はその Plugin を無効化します
- ワークスペース由来の Plugin は**デフォルトで無効**です（明示的に有効化する必要があります）
- バンドル Plugin は、上書きされない限り、組み込みのデフォルト有効セットに従います
- 排他的スロットは、そのスロットに選択された Plugin を強制的に有効化できます
- 一部のオプトインのバンドル Plugin は、設定が Plugin 所有のサーフェスを指定したときに自動的に有効化されます。たとえば、プロバイダーモデル参照、チャンネル設定、ハーネスランタイムなどです
- `plugins.enabled: false` が有効な間、古い Plugin 設定は保持されます。古い ID を削除したい場合は、doctor クリーンアップを実行する前に Plugin を再度有効化してください
- OpenAI 系 Codex ルートは別々の Plugin 境界を維持します。`openai-codex/*` は OpenAI Plugin に属し、バンドルされた Codex app-server Plugin は `agentRuntime.id: "codex"` または従来の `codex/*` モデル参照によって選択されます

## ランタイムフックのトラブルシューティング

Plugin が `plugins list` に表示されるのに、`register(api)` の副作用やフックがライブチャットトラフィックで実行されない場合は、まず次を確認してください。

- `openclaw gateway status --deep --require-rpc` を実行し、アクティブな Gateway URL、プロファイル、設定パス、プロセスが、編集しているものと一致していることを確認してください。
- Plugin のインストール/設定/コード変更後にライブ Gateway を再起動してください。ラッパーコンテナでは、PID 1 は単なるスーパーバイザーである場合があります。子の `openclaw gateway run` プロセスを再起動するかシグナルを送ってください。
- `openclaw plugins inspect <id> --runtime --json` を使用して、フック登録と診断を確認してください。`llm_input`、`llm_output`、`before_agent_finalize`、`agent_end` などの非バンドル会話フックには `plugins.entries.<id>.hooks.allowConversationAccess=true` が必要です。
- モデル切り替えには `before_model_resolve` を推奨します。これはエージェントターンのモデル解決前に実行されます。`llm_output` は、モデル試行がアシスタント出力を生成した後にのみ実行されます。
- 有効なセッションモデルの証明には、`openclaw sessions` または Gateway のセッション/ステータスサーフェスを使用してください。プロバイダーペイロードをデバッグする場合は、`--raw-stream --raw-stream-path <path>` を付けて Gateway を起動してください。

### 遅い Plugin ツールセットアップ

ツール準備中にエージェントターンが停止しているように見える場合は、トレースログを有効化し、Plugin ツールファクトリのタイミング行を確認してください。

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

次を探してください。

```text
[trace:plugin-tools] factory timings ...
```

サマリーには、合計ファクトリ時間と最も遅い Plugin ツールファクトリが一覧表示されます。Plugin ID、宣言されたツール名、結果の形状、ツールが任意かどうかも含まれます。単一のファクトリに 1 秒以上かかる場合、または Plugin ツールファクトリ準備の合計が 5 秒以上かかる場合、遅い行は警告に昇格されます。

OpenClaw は、同じ有効リクエストコンテキストで繰り返し解決される成功済みの Plugin ツールファクトリ結果をキャッシュします。キャッシュキーには、有効なランタイム設定、ワークスペース、エージェント/セッション ID、サンドボックスポリシー、ブラウザー設定、配信コンテキスト、リクエスター ID、所有状態が含まれるため、これらの信頼済みフィールドに依存するファクトリは、コンテキストが変わると再実行されます。

1 つの Plugin がタイミングの大半を占める場合は、そのランタイム登録を調べてください。

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

その後、その Plugin を更新、再インストール、または無効化してください。Plugin 作者は、高コストな依存関係の読み込みをツールファクトリ内で行うのではなく、ツール実行パスの背後へ移動するべきです。

### チャンネルまたはツール所有権の重複

症状:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

これらは、複数の有効な Plugin が同じチャンネル、セットアップフロー、またはツール名を所有しようとしていることを意味します。最も一般的な原因は、外部チャンネル Plugin が、現在同じチャンネル ID を提供しているバンドル Plugin と並んでインストールされていることです。

デバッグ手順:

- `openclaw plugins list --enabled --verbose` を実行し、有効なすべての Plugin とその由来を確認してください。
- 疑わしい各 Plugin について `openclaw plugins inspect <id> --runtime --json` を実行し、`channels`、`channelConfigs`、`tools`、診断を比較してください。
- Plugin パッケージのインストールまたは削除後に `openclaw plugins registry --refresh` を実行し、永続化メタデータが現在のインストールを反映するようにしてください。
- インストール、レジストリ、または設定変更後に Gateway を再起動してください。

修正オプション:

- 1 つの Plugin が同じチャンネル ID に対して別の Plugin を意図的に置き換える場合、優先される Plugin は、低優先度の Plugin ID を指定して `channelConfigs.<channel-id>.preferOver` を宣言するべきです。[/plugins/manifest#replacing-another-channel-plugin](/ja-JP/plugins/manifest#replacing-another-channel-plugin) を参照してください。
- 重複が偶発的な場合は、`plugins.entries.<plugin-id>.enabled: false` で片方を無効化するか、古い Plugin インストールを削除してください。
- 両方の Plugin を明示的に有効化した場合、OpenClaw はその要求を維持し、競合を報告します。チャンネルの所有者を 1 つ選ぶか、Plugin 所有のツール名を変更して、ランタイムサーフェスを曖昧でない状態にしてください。

## Plugin スロット（排他的カテゴリー）

一部のカテゴリーは排他的です（一度にアクティブにできるのは 1 つのみ）。

```json5
{
  plugins: {
    slots: {
      memory: "memory-core", // or "none" to disable
      contextEngine: "legacy", // or a plugin id
    },
  },
}
```

| スロット        | 制御対象                  | デフォルト          |
| --------------- | ------------------------- | ------------------- |
| `memory`        | アクティブメモリ Plugin   | `memory-core`       |
| `contextEngine` | アクティブコンテキストエンジン | `legacy` (built-in) |

## CLI リファレンス

```bash
openclaw plugins list                       # compact inventory
openclaw plugins list --enabled            # only enabled plugins
openclaw plugins list --verbose            # per-plugin detail lines
openclaw plugins list --json               # machine-readable inventory
openclaw plugins search <query>            # search ClawHub plugin catalog
openclaw plugins inspect <id>              # static detail
openclaw plugins inspect <id> --runtime    # registered hooks/tools/CLI/gateway methods
openclaw plugins inspect <id> --json       # machine-readable
openclaw plugins inspect --all             # fleet-wide table
openclaw plugins info <id>                 # inspect alias
openclaw plugins doctor                    # diagnostics
openclaw plugins registry                  # inspect persisted registry state
openclaw plugins registry --refresh        # rebuild persisted registry
openclaw doctor --fix                      # repair plugin registry state

openclaw plugins install <package>         # install from npm by default
openclaw plugins install clawhub:<pkg>     # install from ClawHub only
openclaw plugins install npm:<pkg>         # install from npm only
openclaw plugins install git:<repo>        # install from git
openclaw plugins install git:<repo>@<ref>  # install from git ref
openclaw plugins install <spec> --force    # overwrite existing install
openclaw plugins install <path>            # install from local path
openclaw plugins install -l <path>         # link (no copy) for dev
openclaw plugins install <plugin> --marketplace <source>
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <spec> --pin      # record exact resolved npm spec
openclaw plugins install <spec> --dangerously-force-unsafe-install
openclaw plugins update <id-or-npm-spec> # update one plugin
openclaw plugins update <id-or-npm-spec> --dangerously-force-unsafe-install
openclaw plugins update --all            # update all
openclaw plugins uninstall <id>          # remove config and plugin index records
openclaw plugins uninstall <id> --keep-files
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json

# Verify runtime registrations after install.
openclaw plugins inspect <id> --runtime --json

# Run plugin-owned CLI commands directly from the OpenClaw root CLI.
openclaw <plugin-command> --help

openclaw plugins enable <id>
openclaw plugins disable <id>
```

バンドル Plugin は OpenClaw に同梱されています。多くはデフォルトで有効です（たとえば、バンドルされたモデルプロバイダー、バンドルされた音声プロバイダー、バンドルされたブラウザー Plugin）。その他のバンドル Plugin には、引き続き `openclaw plugins enable <id>` が必要です。

`--force` は、既存のインストール済み Plugin またはフックパックをその場で上書きします。追跡対象の npm Plugin の通常アップグレードには `openclaw plugins update <id-or-npm-spec>` を使用してください。これは、管理対象インストール先へコピーする代わりにソースパスを再利用する `--link` とは併用できません。

`plugins.allow` がすでに設定されている場合、`openclaw plugins install` はインストールした Plugin ID を有効化する前に、その許可リストへ追加します。同じ Plugin ID が `plugins.deny` に存在する場合、install はその古い deny エントリを削除するため、明示的にインストールした Plugin は再起動後すぐに読み込み可能になります。

OpenClaw は、Plugin インベントリ、コントリビューションの所有権、起動計画のコールドリードモデルとして、永続化されたローカル Plugin レジストリを保持します。インストール、更新、
アンインストール、有効化、無効化のフローは、Plugin
の状態を変更したあとにそのレジストリを更新します。同じ `plugins/installs.json` ファイルは、耐久性のあるインストールメタデータを
トップレベルの `installRecords` に、再構築可能なマニフェストメタデータを `plugins` に保持します。レジストリが存在しない、古い、または無効な場合、`openclaw plugins registry
--refresh` は、Plugin ランタイムモジュールをロードせずに、インストールレコード、設定ポリシー、
マニフェスト/パッケージメタデータからマニフェストビューを再構築します。
`openclaw plugins update <id-or-npm-spec>` は追跡済みインストールに適用されます。dist-tag または正確なバージョンを含む
npm パッケージ spec を渡すと、パッケージ名が追跡済み Plugin レコードへ解決され、
今後の更新用に新しい spec が記録されます。バージョンなしでパッケージ名を渡すと、正確にピン留めされたインストールが
レジストリのデフォルトリリースラインに戻されます。インストール済みの npm Plugin が、解決されたバージョンおよび記録済みアーティファクト ID とすでに一致している場合、OpenClaw はダウンロード、再インストール、設定の書き換えを行わずに更新をスキップします。
`openclaw update` がベータチャンネルで実行されると、デフォルトラインの npm および ClawHub
Plugin レコードはまず `@beta` を試し、Plugin のベータリリースが存在しない場合は default/latest にフォールバックします。正確なバージョンと明示的なタグはピン留めされたままです。

`--pin` は npm 専用です。`--marketplace` ではサポートされません。これは、
マーケットプレイスインストールが npm spec ではなくマーケットプレイスソースメタデータを永続化するためです。

`--dangerously-force-unsafe-install` は、組み込みの危険コードスキャナーによる誤検知のための
非常用オーバーライドです。これにより、組み込みの `critical` 検出結果があっても Plugin インストール
および Plugin 更新を続行できますが、Plugin の `before_install` ポリシーブロックやスキャン失敗によるブロックは回避しません。
インストールスキャンは、パッケージ化されたテストモックのブロックを避けるため、`tests/`、
`__tests__/`、`*.test.*`、`*.spec.*` などの一般的なテストファイルとディレクトリを無視します。
宣言済みの Plugin ランタイムエントリポイントは、それらの名前のいずれかを使用していても引き続きスキャンされます。

この CLI フラグは、Plugin のインストール/更新フローにのみ適用されます。Gateway が支える skill
依存関係のインストールでは、代わりに対応する `dangerouslyForceUnsafeInstall` リクエスト
オーバーライドを使用します。一方、`openclaw skills install` は別個の ClawHub
skill ダウンロード/インストールフローのままです。

ClawHub で公開した Plugin がスキャンによって非表示またはブロックされている場合は、
ClawHub ダッシュボードを開くか、`clawhub package rescan <name>` を実行して ClawHub に再チェックを依頼してください。`--dangerously-force-unsafe-install` は自分のマシン上のインストールにのみ影響します。ClawHub に Plugin の再スキャンを依頼したり、ブロックされたリリースを公開したりするものではありません。

互換バンドルは、同じ Plugin list/inspect/enable/disable フローに参加します。現在のランタイムサポートには、バンドル Skills、Claude コマンド Skills、
Claude `settings.json` デフォルト、Claude `.lsp.json` およびマニフェストで宣言された
`lspServers` デフォルト、Cursor コマンド Skills、互換性のある Codex hook
ディレクトリが含まれます。

`openclaw plugins inspect <id>` は、バンドルで支えられた Plugin について、検出されたバンドル機能に加え、
サポート対象または非サポートの MCP および LSP サーバーエントリも報告します。

マーケットプレイスソースには、`~/.claude/plugins/known_marketplaces.json` にある Claude の既知マーケットプレイス名、ローカルマーケットプレイスルートまたは
`marketplace.json` パス、`owner/repo` のような GitHub 短縮表記、GitHub リポジトリ
URL、または git URL を指定できます。リモートマーケットプレイスでは、Plugin エントリはクローンされた
マーケットプレイスリポジトリ内に留まり、相対パスソースのみを使用する必要があります。

詳細は [`openclaw plugins` CLI リファレンス](/ja-JP/cli/plugins) を参照してください。

## Plugin API の概要

ネイティブ Plugin は `register(api)` を公開するエントリオブジェクトをエクスポートします。古い
Plugin はレガシーエイリアスとして `activate(api)` をまだ使用できますが、新しい Plugin は
`register` を使用する必要があります。

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

OpenClaw はエントリオブジェクトをロードし、Plugin
のアクティベーション中に `register(api)` を呼び出します。ローダーは古い Plugin のために
`activate(api)` へ引き続きフォールバックしますが、バンドル済み Plugin と新しい外部 Plugin は
`register` を公開契約として扱う必要があります。

`api.registrationMode` は、エントリがロードされている理由を Plugin に伝えます。

| モード            | 意味                                                                                                                          |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | ランタイムアクティベーション。ツール、hook、サービス、コマンド、ルート、その他のライブ副作用を登録します。                              |
| `discovery`     | 読み取り専用の機能検出。プロバイダーとメタデータを登録します。信頼済み Plugin エントリコードはロードされる場合がありますが、ライブ副作用はスキップします。 |
| `setup-only`    | 軽量なセットアップエントリを通じたチャンネルセットアップメタデータのロード。                                                                |
| `setup-runtime` | ランタイムエントリも必要とするチャンネルセットアップのロード。                                                                         |
| `cli-metadata`  | CLI コマンドメタデータの収集のみ。                                                                                            |

ソケット、データベース、バックグラウンドワーカー、または長寿命
クライアントを開く Plugin エントリは、それらの副作用を `api.registrationMode === "full"` でガードする必要があります。
検出ロードはアクティベーションロードとは別にキャッシュされ、実行中の Gateway レジストリを置き換えません。検出は非アクティベーションですが、import-free ではありません。
OpenClaw は、スナップショットを構築するために、信頼済み Plugin エントリまたはチャンネル Plugin モジュールを評価する場合があります。モジュールのトップレベルは軽量かつ副作用なしに保ち、
ネットワーククライアント、サブプロセス、リスナー、認証情報の読み取り、サービス起動は
フルランタイムパスの背後に移動してください。

一般的な登録メソッド:

| メソッド                                  | 登録するもの           |
| --------------------------------------- | --------------------------- |
| `registerProvider`                      | モデルプロバイダー (LLM)        |
| `registerChannel`                       | チャットチャンネル                |
| `registerTool`                          | エージェントツール                  |
| `registerHook` / `on(...)`              | ライフサイクル hook             |
| `registerSpeechProvider`                | テキスト読み上げ / STT        |
| `registerRealtimeTranscriptionProvider` | ストリーミング STT               |
| `registerRealtimeVoiceProvider`         | 双方向リアルタイム音声       |
| `registerMediaUnderstandingProvider`    | 画像/音声解析        |
| `registerImageGenerationProvider`       | 画像生成            |
| `registerMusicGenerationProvider`       | 音楽生成            |
| `registerVideoGenerationProvider`       | 動画生成            |
| `registerWebFetchProvider`              | Web fetch / スクレイププロバイダー |
| `registerWebSearchProvider`             | Web 検索                  |
| `registerHttpRoute`                     | HTTP エンドポイント               |
| `registerCommand` / `registerCli`       | CLI コマンド                |
| `registerContextEngine`                 | コンテキストエンジン              |
| `registerService`                       | バックグラウンドサービス          |

型付きライフサイクル hook のガード動作:

- `before_tool_call`: `{ block: true }` は終端です。低優先度のハンドラーはスキップされます。
- `before_tool_call`: `{ block: false }` は no-op であり、先行するブロックを解除しません。
- `before_install`: `{ block: true }` は終端です。低優先度のハンドラーはスキップされます。
- `before_install`: `{ block: false }` は no-op であり、先行するブロックを解除しません。
- `message_sending`: `{ cancel: true }` は終端です。低優先度のハンドラーはスキップされます。
- `message_sending`: `{ cancel: false }` は no-op であり、先行するキャンセルを解除しません。

ネイティブ Codex app-server は、Codex ネイティブのツールイベントをこの
hook サーフェスへブリッジします。Plugin は `before_tool_call` を通じてネイティブ Codex ツールをブロックし、
`after_tool_call` を通じて結果を観察し、Codex
`PermissionRequest` 承認に参加できます。このブリッジはまだ Codex ネイティブのツール
引数を書き換えません。正確な Codex ランタイムサポート境界は
[Codex harness v1 サポート契約](/ja-JP/plugins/codex-harness#v1-support-contract)にあります。

型付き hook の完全な動作については、[SDK 概要](/ja-JP/plugins/sdk-overview#hook-decision-semantics)を参照してください。

## 関連

- [Plugin の構築](/ja-JP/plugins/building-plugins) — 独自の Plugin を作成する
- [Plugin バンドル](/ja-JP/plugins/bundles) — Codex/Claude/Cursor バンドル互換性
- [Plugin マニフェスト](/ja-JP/plugins/manifest) — マニフェストスキーマ
- [ツールの登録](/ja-JP/plugins/building-plugins#registering-agent-tools) — Plugin にエージェントツールを追加する
- [Plugin 内部構造](/ja-JP/plugins/architecture) — 機能モデルとロードパイプライン
- [コミュニティ Plugin](/ja-JP/plugins/community) — サードパーティ一覧
