---
read_when:
    - Pluginのインストールまたは設定
    - Plugin の検出と読み込みルールを理解する
    - Codex/Claude 互換の Plugin バンドルを扱う
sidebarTitle: Install and Configure
summary: OpenClaw Plugin をインストール、設定、管理する
title: Plugin
x-i18n:
    generated_at: "2026-05-03T21:39:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 30e3cffc15c5c52dd539e21103c207c9e38955f9fd3acd561a52964eefafb8f0
    source_path: tools/plugin.md
    workflow: 16
---

Pluginは、チャネル、モデルプロバイダー、エージェントハーネス、ツール、Skills、音声、リアルタイム文字起こし、リアルタイム音声、メディア理解、画像生成、動画生成、web fetch、web
searchなどの新しい機能でOpenClawを拡張します。一部のPluginは**コア**（OpenClawに同梱）で、その他は**外部**です。ほとんどの外部Pluginは
[ClawHub](/ja-JP/tools/clawhub)を通じて公開・検出されます。移行が完了するまで、直接インストールおよびOpenClaw所有のPluginパッケージの一時的なセットについては、Npmも引き続きサポートされます。

## クイックスタート

コピー＆ペーストできるインストール、一覧表示、アンインストール、更新、公開の例については、
[Pluginを管理](/ja-JP/plugins/manage-plugins)を参照してください。

<Steps>
  <Step title="読み込まれているものを確認する">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="Pluginをインストールする">
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

  <Step title="Gatewayを再起動する">
    ```bash
    openclaw gateway restart
    ```

    その後、設定ファイル内の`plugins.entries.\<id\>.config`で構成します。

  </Step>

  <Step title="チャットネイティブな管理">
    実行中のGatewayでは、所有者専用の`/plugins enable`と`/plugins disable`がGateway設定リローダーをトリガーします。GatewayはPluginランタイムサーフェスをプロセス内で再読み込みし、新しいエージェントターンは更新されたレジストリからツール一覧を再構築します。`/plugins install`はPluginソースコードを変更するため、現在のプロセスがすでにインポート済みのモジュールを安全に再読み込みできるかのように扱うのではなく、Gatewayは再起動を要求します。

  </Step>

  <Step title="Pluginを検証する">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json

    # If the plugin registered a CLI root, run one command from that root.
    openclaw <plugin-command> --help
    ```

    登録済みのツール、サービス、gatewayメソッド、フック、またはPlugin所有のCLIコマンドを証明する必要がある場合は、`--runtime`を使用します。通常の`inspect`はコールドなマニフェスト/レジストリチェックであり、意図的にPluginランタイムのインポートを避けます。

  </Step>
</Steps>

チャットネイティブな制御を好む場合は、`commands.plugins: true`を有効にして次を使用します。

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

インストールパスはCLIと同じリゾルバーを使用します。ローカルパス/アーカイブ、明示的な`clawhub:<pkg>`、明示的な`npm:<pkg>`、明示的な`git:<repo>`、またはnpm経由のベアパッケージ指定です。

設定が無効な場合、通常インストールはフェイルクローズし、`openclaw doctor --fix`を案内します。唯一の復旧例外は、`openclaw.install.allowInvalidConfigRecovery`にオプトインしたPlugin向けの、範囲の狭い同梱Plugin再インストールパスです。
Gateway起動中は、無効なPlugin設定は他の無効な設定と同様にフェイルクローズします。不正なPlugin設定を隔離するには`openclaw doctor --fix`を実行してください。これにより、そのPluginエントリを無効化し、無効な設定ペイロードを削除します。通常の設定バックアップにより以前の値は保持されます。
チャネル設定が検出できなくなったPluginを参照している一方で、同じ古いPlugin IDがPlugin設定またはインストール記録に残っている場合、Gateway起動時は警告をログに記録し、すべての他のチャネルをブロックするのではなく、そのチャネルをスキップします。
古いチャネル/Pluginエントリを削除するには`openclaw doctor --fix`を実行してください。古いPluginの証拠がない未知のチャネルキーは引き続き検証に失敗するため、入力ミスは見える状態に保たれます。
`plugins.enabled: false`が設定されている場合、古いPlugin参照は不活性として扱われます。Gateway起動時はPlugin検出/読み込み作業をスキップし、`openclaw doctor`は無効化されたPlugin設定を自動削除せず保持します。古いPlugin IDを削除したい場合は、doctorクリーンアップを実行する前にPluginを再有効化してください。

Plugin依存関係のインストールは、明示的なインストール/更新またはdoctor修復フローの間にのみ行われます。Gateway起動、設定再読み込み、ランタイム検査は、パッケージマネージャーを実行したり依存関係ツリーを修復したりしません。ローカルPluginは依存関係がすでにインストールされている必要があります。一方、npm、git、ClawHubのPluginはOpenClawの管理対象Pluginルート配下にインストールされます。npm依存関係はOpenClawの管理対象npmルート内で巻き上げられる場合があります。インストール/更新は信頼する前にその管理対象ルートをスキャンし、アンインストールはnpmを通じてnpm管理のパッケージを削除します。外部Pluginとカスタム読み込みパスは、引き続き`openclaw plugins install`を通じてインストールする必要があります。
ランタイムコードをインポートしたり依存関係を修復したりせず、表示可能な各Pluginの静的な`dependencyStatus`を確認するには、`openclaw plugins list --json`を使用してください。
インストール時ライフサイクルについては、[Plugin依存関係の解決](/ja-JP/plugins/dependency-resolution)を参照してください。

npmインストールでは、`latest`やdist-tagのような可変セレクターはインストール前に解決され、その後OpenClawの管理対象npmルート内で正確に検証済みのバージョンへ固定されます。npmが完了した後、OpenClawはインストールされた`package-lock.json`エントリが、解決済みバージョンおよび完全性とまだ一致していることを検証します。npmが異なるパッケージメタデータを書き込んだ場合、異なるPlugin成果物を受け入れるのではなく、インストールは失敗し、管理対象パッケージはロールバックされます。

ソースチェックアウトはpnpmワークスペースです。同梱Pluginを変更するためにOpenClawをクローンした場合は、`pnpm install`を実行してください。OpenClawはその後、`extensions/<id>`から同梱Pluginを読み込むため、編集内容とパッケージローカル依存関係が直接使用されます。
通常のnpmルートインストールは、パッケージ化されたOpenClaw向けであり、ソースチェックアウト開発向けではありません。

## Pluginの種類

OpenClawは2つのPlugin形式を認識します。

| 形式       | 仕組み                                                             | 例                                                     |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + ランタイムモジュール。プロセス内で実行   | 公式Plugin、コミュニティnpmパッケージ                 |
| **Bundle** | Codex/Claude/Cursor互換レイアウト。OpenClaw機能にマッピングされる | `.codex-plugin/`、`.claude-plugin/`、`.cursor-plugin/` |

どちらも`openclaw plugins list`に表示されます。Bundleの詳細については、[Plugin Bundle](/ja-JP/plugins/bundles)を参照してください。

ネイティブPluginを書く場合は、[Pluginの構築](/ja-JP/plugins/building-plugins)と
[Plugin SDK概要](/ja-JP/plugins/sdk-overview)から始めてください。

## パッケージエントリポイント

ネイティブPluginのnpmパッケージは、`package.json`で`openclaw.extensions`を宣言する必要があります。
各エントリはパッケージディレクトリ内に留まり、読み取り可能なランタイムファイル、または`src/index.ts`から`dist/index.js`のように推論されたビルド済みJavaScriptピアを持つTypeScriptソースファイルへ解決される必要があります。
パッケージ化されたインストールには、そのJavaScriptランタイム出力を同梱する必要があります。TypeScriptソースのフォールバックは、ソースチェックアウトとローカル開発パス向けであり、OpenClawの管理対象Pluginルートにインストールされたnpmパッケージ向けではありません。

公開されたランタイムファイルがソースエントリと同じパスに存在しない場合は、`openclaw.runtimeExtensions`を使用します。存在する場合、`runtimeExtensions`はすべての`extensions`エントリに対して正確に1つのエントリを含む必要があります。一致しない一覧は、ソースパスへ静かにフォールバックするのではなく、インストールとPlugin検出を失敗させます。`openclaw.setupEntry`も公開する場合は、そのビルド済みJavaScriptピアに`openclaw.runtimeSetupEntry`を使用してください。宣言された場合、そのファイルは必須です。

```json
{
  "name": "@acme/openclaw-plugin",
  "openclaw": {
    "extensions": ["./src/index.ts"],
    "runtimeExtensions": ["./dist/index.js"]
  }
}
```

## 公式Plugin

### 移行中のOpenClaw所有npmパッケージ

ClawHubはほとんどのPluginの主要な配布パスです。現在のパッケージ化されたOpenClawリリースには、すでに多くの公式Pluginが同梱されているため、通常のセットアップではそれらを個別にnpmインストールする必要はありません。すべてのOpenClaw所有PluginがClawHubへ移行するまで、OpenClawは古い/カスタムインストールと直接npmワークフロー向けに、一部の`@openclaw/*` Pluginパッケージをnpmで引き続き提供します。

npmが`@openclaw/*` Pluginパッケージを非推奨として報告する場合、そのパッケージバージョンは古い外部パッケージ系列のものです。新しいnpmパッケージが公開されるまでは、現在のOpenClawに同梱されたPluginまたはローカルチェックアウトを使用してください。

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

### コア（OpenClawに同梱）

<AccordionGroup>
  <Accordion title="モデルプロバイダー（デフォルトで有効）">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="メモリPlugin">
    - `memory-core` — 同梱のメモリ検索（デフォルトは`plugins.slots.memory`経由）
    - `memory-lancedb` — LanceDBバックエンドの自動想起/キャプチャ付き長期メモリ（`plugins.slots.memory = "memory-lancedb"`を設定）

    OpenAI互換の埋め込み設定、Ollamaの例、想起制限、トラブルシューティングについては、[Memory LanceDB](/ja-JP/plugins/memory-lancedb)を参照してください。

  </Accordion>

  <Accordion title="音声プロバイダー（デフォルトで有効）">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="その他">
    - `browser` — ブラウザツール、`openclaw browser` CLI、`browser.request` gatewayメソッド、ブラウザランタイム、デフォルトのブラウザ制御サービス向けの同梱ブラウザPlugin（デフォルトで有効。置き換える前に無効化してください）
    - `copilot-proxy` — VS Code Copilot Proxyブリッジ（デフォルトで無効）

  </Accordion>
</AccordionGroup>

サードパーティPluginを探していますか？[コミュニティPlugin](/ja-JP/plugins/community)を参照してください。

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

| フィールド            | 説明                                               |
| ---------------- | --------------------------------------------------------- |
| `enabled`        | マスタートグル（デフォルト: `true`）                           |
| `allow`          | Plugin 許可リスト（任意）                               |
| `deny`           | Plugin 拒否リスト（任意、拒否が優先）                     |
| `load.paths`     | 追加の plugin ファイル/ディレクトリ                            |
| `slots`          | 排他的なスロットセレクター（例: `memory`, `contextEngine`） |
| `entries.\<id\>` | Plugin ごとのトグル + 設定                               |

`plugins.allow` は排他的です。空でない場合、`tools.allow` に `"*"` または特定の plugin 所有のツール名が含まれていても、リストされた plugin だけが読み込まれるかツールを公開できます。ツール許可リストが plugin ツールを参照する場合は、所有する plugin id を `plugins.allow` に追加するか、`plugins.allow` を削除してください。`openclaw doctor` はこの形について警告します。

`/plugins enable` または `/plugins disable` を通じて行われた設定変更は、プロセス内の Gateway plugin 再読み込みをトリガーします。新しいエージェントターンは、更新された plugin レジストリからツールリストを再構築します。インストール、更新、アンインストールなどのソースを変更する操作では、すでにインポート済みの plugin モジュールをその場で安全に置き換えられないため、引き続き Gateway プロセスが再起動されます。

`openclaw plugins list` はローカルの plugin レジストリ/設定のスナップショットです。そこで `enabled` な plugin とは、永続化されたレジストリと現在の設定がその plugin の参加を許可していることを意味します。すでに実行中のリモート Gateway が同じ plugin コードへ再読み込みまたは再起動済みであることを証明するものではありません。ラッパープロセスを使う VPS/コンテナ構成では、再起動または再読み込みをトリガーする書き込みを実際の `openclaw gateway run` プロセスへ送るか、再読み込みが失敗を報告する場合は実行中の Gateway に対して `openclaw gateway restart` を使用してください。

<Accordion title="Plugin の状態: 無効、欠落、無効な設定">
  - **無効**: plugin は存在しますが、有効化ルールによってオフになっています。設定は保持されます。
  - **欠落**: 設定が参照する plugin id を検出で見つけられませんでした。
  - **無効な設定**: plugin は存在しますが、その設定が宣言されたスキーマと一致しません。Gateway 起動時はその plugin だけをスキップします。`openclaw doctor --fix` は、その無効なエントリを無効化し、設定ペイロードを削除することで隔離できます。

</Accordion>

## 検出と優先順位

OpenClaw は次の順序で plugin をスキャンします（最初の一致が優先）:

<Steps>
  <Step title="設定パス">
    `plugins.load.paths` — 明示的なファイルまたはディレクトリパス。OpenClaw 自身のパッケージ済みバンドル plugin ディレクトリを指し戻すパスは無視されます。そうした古い別名を削除するには `openclaw doctor --fix` を実行してください。
  </Step>

  <Step title="ワークスペース plugin">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` と `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`。
  </Step>

  <Step title="グローバル plugin">
    `~/.openclaw/<plugin-root>/*.ts` と `~/.openclaw/<plugin-root>/*/index.ts`。
  </Step>

  <Step title="バンドル plugin">
    OpenClaw に同梱されています。多くはデフォルトで有効です（モデルプロバイダー、音声）。他のものは明示的な有効化が必要です。
  </Step>
</Steps>

パッケージインストールと Docker イメージでは、通常、コンパイル済みの `dist/extensions` ツリーからバンドル plugin を解決します。たとえば `/app/extensions/synology-chat` のように、バンドル plugin のソースディレクトリが対応するパッケージ済みソースパス上に bind mount されている場合、OpenClaw はそのマウントされたソースディレクトリをバンドルソースオーバーレイとして扱い、パッケージ済みの `/app/dist/extensions/synology-chat` バンドルより先に検出します。これにより、すべてのバンドル plugin を TypeScript ソースへ戻さなくても、メンテナーのコンテナループが動作し続けます。ソースオーバーレイマウントが存在する場合でもパッケージ済み dist バンドルを強制するには、`OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1` を設定してください。

### 有効化ルール

- `plugins.enabled: false` はすべての plugin を無効化し、plugin の検出/読み込み作業をスキップします
- `plugins.deny` は常に allow より優先されます
- `plugins.entries.\<id\>.enabled: false` はその plugin を無効化します
- ワークスペース由来の plugin は**デフォルトで無効**です（明示的な有効化が必要）
- バンドル plugin は、上書きされない限り組み込みのデフォルトオンセットに従います
- 排他的スロットは、そのスロットに選択された plugin を強制的に有効化できます
- 一部のオプトイン型バンドル plugin は、設定がプロバイダーモデル参照、チャネル設定、ハーネスランタイムなどの plugin 所有サーフェスを指定している場合に自動で有効化されます
- `plugins.enabled: false` が有効な間、古い plugin 設定は保持されます。古い id を削除したい場合は、doctor クリーンアップを実行する前に plugin を再度有効化してください
- OpenAI 系 Codex ルートは別々の plugin 境界を保ちます: `openai-codex/*` は OpenAI plugin に属し、バンドルされた Codex app-server plugin は `agentRuntime.id: "codex"` または従来の `codex/*` モデル参照によって選択されます

## ランタイムフックのトラブルシューティング

plugin が `plugins list` に表示されるのに、ライブチャットトラフィックで `register(api)` の副作用やフックが実行されない場合は、まず次を確認してください:

- `openclaw gateway status --deep --require-rpc` を実行し、アクティブな Gateway URL、プロファイル、設定パス、プロセスが編集対象のものであることを確認します。
- plugin のインストール/設定/コード変更後にライブ Gateway を再起動します。ラッパーコンテナでは、PID 1 はスーパーバイザーだけの場合があります。子の `openclaw gateway run` プロセスを再起動するかシグナルを送ってください。
- フック登録と診断を確認するには `openclaw plugins inspect <id> --runtime --json` を使用します。`llm_input`、`llm_output`、`before_agent_finalize`、`agent_end` などの非バンドル会話フックには `plugins.entries.<id>.hooks.allowConversationAccess=true` が必要です。
- モデル切り替えには `before_model_resolve` を推奨します。これはエージェントターンのモデル解決前に実行されます。`llm_output` はモデル試行がアシスタント出力を生成した後にのみ実行されます。
- 有効なセッションモデルの証拠には `openclaw sessions` または Gateway セッション/ステータスサーフェスを使用し、プロバイダーペイロードをデバッグする場合は `--raw-stream --raw-stream-path <path>` 付きで Gateway を起動します。

### 遅い plugin ツールセットアップ

エージェントターンがツールの準備中に停止しているように見える場合は、トレースログを有効にして、plugin ツールファクトリのタイミング行を確認してください:

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

次を探してください:

```text
[trace:plugin-tools] factory timings ...
```

概要には、合計ファクトリ時間と、最も遅い plugin ツールファクトリが一覧表示されます。plugin id、宣言されたツール名、結果の形、ツールが任意かどうかも含まれます。単一ファクトリに少なくとも 1 秒かかる場合、または plugin ツールファクトリ準備の合計に少なくとも 5 秒かかる場合、遅い行は警告に昇格されます。

OpenClaw は、同じ有効なリクエストコンテキストで繰り返し解決する場合に、成功した plugin ツールファクトリ結果をキャッシュします。キャッシュキーには、有効なランタイム設定、ワークスペース、エージェント/セッション id、サンドボックスポリシー、ブラウザー設定、配信コンテキスト、リクエスター ID、所有状態が含まれるため、それらの信頼済みフィールドに依存するファクトリはコンテキストが変わると再実行されます。

1 つの plugin がタイミングの大半を占める場合は、そのランタイム登録を調べます:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

その後、その plugin を更新、再インストール、または無効化してください。Plugin 作者は、高コストな依存関係の読み込みをツールファクトリ内ではなく、ツール実行パスの背後に移すべきです。

### チャネルまたはツール所有権の重複

症状:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

これは、複数の有効な plugin が同じチャネル、セットアップフロー、またはツール名を所有しようとしていることを意味します。最も一般的な原因は、同じチャネル id を提供するようになったバンドル plugin の横に、外部チャネル plugin がインストールされていることです。

デバッグ手順:

- 有効なすべての plugin と由来を確認するには、`openclaw plugins list --enabled --verbose` を実行します。
- 疑わしい各 plugin に対して `openclaw plugins inspect <id> --runtime --json` を実行し、`channels`、`channelConfigs`、`tools`、診断を比較します。
- plugin パッケージのインストールまたは削除後は、永続化されたメタデータが現在のインストールを反映するように `openclaw plugins registry --refresh` を実行します。
- インストール、レジストリ、設定の変更後は Gateway を再起動します。

修正オプション:

- 1 つの plugin が同じチャネル id について別の plugin を意図的に置き換える場合、推奨される plugin は低優先度の plugin id とともに `channelConfigs.<channel-id>.preferOver` を宣言するべきです。[/plugins/manifest#replacing-another-channel-plugin](/ja-JP/plugins/manifest#replacing-another-channel-plugin) を参照してください。
- 重複が意図しないものの場合は、`plugins.entries.<plugin-id>.enabled: false` で一方を無効化するか、古い plugin インストールを削除します。
- 両方の plugin を明示的に有効化した場合、OpenClaw はそのリクエストを保持し、競合を報告します。チャネルの所有者を 1 つ選ぶか、plugin 所有のツール名を変更してランタイムサーフェスを曖昧でないものにしてください。

## Plugin スロット（排他的カテゴリ）

一部のカテゴリは排他的です（同時にアクティブにできるのは 1 つのみ）:

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

| スロット            | 制御対象      | デフォルト             |
| --------------- | --------------------- | ------------------- |
| `memory`        | Active Memory plugin  | `memory-core`       |
| `contextEngine` | アクティブなコンテキストエンジン | `legacy`（組み込み） |

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

バンドル Plugin は OpenClaw とともに提供されます。多くはデフォルトで有効です（たとえば
バンドルされたモデルプロバイダー、バンドルされた音声プロバイダー、バンドルされたブラウザー
Plugin）。その他のバンドル Plugin は、引き続き `openclaw plugins enable <id>` が必要です。

`--force` は、既存のインストール済み Plugin またはフックパックをその場で上書きします。追跡対象の npm
Plugin の通常のアップグレードには
`openclaw plugins update <id-or-npm-spec>` を使用してください。これは `--link` とは併用できません。`--link` は、管理対象のインストール先へコピーする代わりにソースパスを再利用します。

`plugins.allow` がすでに設定されている場合、`openclaw plugins install` は、インストールした
Plugin ID を有効化前にその許可リストへ追加します。同じ Plugin ID が
`plugins.deny` に存在する場合、インストールはその古い拒否エントリを削除するため、明示的にインストールした
Plugin は再起動後すぐにロード可能になります。

OpenClaw は、Plugin インベントリ、コントリビューション所有権、起動計画のコールドリードモデルとして、永続化されたローカル Plugin レジストリを保持します。インストール、更新、アンインストール、有効化、無効化の各フローは、Plugin 状態を変更した後にそのレジストリを更新します。同じ `plugins/installs.json` ファイルは、トップレベルの `installRecords` に永続的なインストールメタデータを保持し、`plugins` に再構築可能なマニフェストメタデータを保持します。レジストリが存在しない、古い、または無効な場合、`openclaw plugins registry
--refresh` は、Plugin ランタイムモジュールをロードせずに、インストール記録、構成ポリシー、マニフェスト/パッケージメタデータからマニフェストビューを再構築します。
`openclaw plugins update <id-or-npm-spec>` は追跡対象のインストールに適用されます。dist-tag または正確なバージョンを含む npm パッケージ指定を渡すと、パッケージ名は追跡対象の Plugin レコードへ解決され、今後の更新用に新しい指定が記録されます。バージョンなしでパッケージ名を渡すと、正確にピン留めされたインストールは、レジストリのデフォルトリリースラインに戻ります。インストール済み npm Plugin が、解決済みバージョンおよび記録済みアーティファクト ID とすでに一致している場合、OpenClaw はダウンロード、再インストール、構成の書き換えを行わずに更新をスキップします。
`openclaw update` がベータチャネルで実行されると、デフォルトラインの npm および ClawHub
Plugin レコードは最初に `@beta` を試し、Plugin のベータリリースが存在しない場合は default/latest にフォールバックします。正確なバージョンと明示的なタグはピン留めされたままです。

`--pin` は npm 専用です。`--marketplace` とは併用できません。マーケットプレイスからのインストールは、npm 指定ではなくマーケットプレイスソースメタデータを永続化するためです。

`--dangerously-force-unsafe-install` は、組み込みの危険コードスキャナーによる誤検知に対する非常用の上書きです。これにより、組み込みの `critical` 検出を超えて Plugin のインストールと Plugin の更新を続行できますが、Plugin の `before_install` ポリシーブロックやスキャン失敗によるブロックは引き続き回避しません。インストールスキャンは、パッケージ化されたテストモックのブロックを避けるため、`tests/`、`__tests__/`、`*.test.*`、`*.spec.*` などの一般的なテストファイルとディレクトリを無視します。ただし、宣言済みの Plugin ランタイムエントリポイントは、それらの名前を使用していても引き続きスキャンされます。

この CLI フラグは、Plugin のインストール/更新フローにのみ適用されます。Gateway ベースの Skills 依存関係インストールでは、代わりに対応する `dangerouslyForceUnsafeInstall` リクエスト上書きを使用します。一方、`openclaw skills install` は別個の ClawHub Skills ダウンロード/インストールフローのままです。

ClawHub で公開した Plugin がスキャンによって非表示またはブロックされた場合は、ClawHub ダッシュボードを開くか、`clawhub package rescan <name>` を実行して ClawHub に再チェックを依頼してください。`--dangerously-force-unsafe-install` は自分のマシン上のインストールにのみ影響します。ClawHub に Plugin の再スキャンを依頼したり、ブロックされたリリースを公開したりするものではありません。

互換バンドルは、同じ Plugin の一覧表示/検査/有効化/無効化フローに参加します。現在のランタイムサポートには、バンドル Skills、Claude コマンド Skills、Claude `settings.json` のデフォルト、Claude `.lsp.json` とマニフェストで宣言された `lspServers` のデフォルト、Cursor コマンド Skills、互換性のある Codex フックディレクトリが含まれます。

`openclaw plugins inspect <id>` は、検出されたバンドル機能に加え、バンドルベース Plugin のサポート済みまたは未サポートの MCP および LSP サーバーエントリも報告します。

マーケットプレイスソースには、`~/.claude/plugins/known_marketplaces.json` にある Claude の既知マーケットプレイス名、ローカルマーケットプレイスルートまたは `marketplace.json` パス、`owner/repo` のような GitHub 省略表記、GitHub リポジトリ URL、または git URL を指定できます。リモートマーケットプレイスでは、Plugin エントリはクローンされたマーケットプレイスリポジトリ内にとどまり、相対パスソースのみを使用する必要があります。

詳細は [`openclaw plugins` CLI リファレンス](/ja-JP/cli/plugins) を参照してください。

## Plugin API の概要

ネイティブ Plugin は、`register(api)` を公開するエントリオブジェクトをエクスポートします。古い
Plugin は引き続きレガシーエイリアスとして `activate(api)` を使用できますが、新しい Plugin は
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

OpenClaw はエントリオブジェクトをロードし、Plugin の有効化中に `register(api)` を呼び出します。ローダーは古い Plugin 向けに引き続き `activate(api)` にフォールバックしますが、バンドル Plugin と新しい外部 Plugin は `register` を公開コントラクトとして扱う必要があります。

`api.registrationMode` は、エントリがロードされている理由を Plugin に伝えます。

| モード            | 意味                                                                                                                          |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | ランタイム有効化。ツール、フック、サービス、コマンド、ルート、その他のライブ副作用を登録します。                              |
| `discovery`     | 読み取り専用の機能検出。プロバイダーとメタデータを登録します。信頼済み Plugin エントリコードはロードされる場合がありますが、ライブ副作用はスキップします。 |
| `setup-only`    | 軽量なセットアップエントリを通じたチャネルセットアップメタデータのロード。                                                                |
| `setup-runtime` | ランタイムエントリも必要とするチャネルセットアップのロード。                                                                         |
| `cli-metadata`  | CLI コマンドメタデータの収集のみ。                                                                                            |

ソケット、データベース、バックグラウンドワーカー、長寿命クライアントを開く Plugin エントリは、それらの副作用を `api.registrationMode === "full"` でガードする必要があります。検出ロードは有効化ロードとは別にキャッシュされ、実行中の Gateway レジストリを置き換えません。検出は有効化を伴いませんが、インポート不要ではありません。OpenClaw はスナップショットを構築するために、信頼済み Plugin エントリまたはチャネル Plugin モジュールを評価する場合があります。モジュールのトップレベルは軽量で副作用のない状態に保ち、ネットワーククライアント、サブプロセス、リスナー、認証情報の読み取り、サービス起動はフルランタイムパスの背後へ移動してください。

一般的な登録メソッド:

| メソッド                                  | 登録対象           |
| --------------------------------------- | --------------------------- |
| `registerProvider`                      | モデルプロバイダー（LLM）        |
| `registerChannel`                       | チャットチャネル                |
| `registerTool`                          | エージェントツール                  |
| `registerHook` / `on(...)`              | ライフサイクルフック             |
| `registerSpeechProvider`                | テキスト読み上げ / STT        |
| `registerRealtimeTranscriptionProvider` | ストリーミング STT               |
| `registerRealtimeVoiceProvider`         | 双方向リアルタイム音声       |
| `registerMediaUnderstandingProvider`    | 画像/音声解析        |
| `registerImageGenerationProvider`       | 画像生成            |
| `registerMusicGenerationProvider`       | 音楽生成            |
| `registerVideoGenerationProvider`       | 動画生成            |
| `registerWebFetchProvider`              | Web フェッチ / スクレイピングプロバイダー |
| `registerWebSearchProvider`             | Web 検索                  |
| `registerHttpRoute`                     | HTTP エンドポイント               |
| `registerCommand` / `registerCli`       | CLI コマンド                |
| `registerContextEngine`                 | コンテキストエンジン              |
| `registerService`                       | バックグラウンドサービス          |

型付きライフサイクルフックのフックガード動作:

- `before_tool_call`: `{ block: true }` は終端です。優先度の低いハンドラーはスキップされます。
- `before_tool_call`: `{ block: false }` は何もせず、以前のブロックを解除しません。
- `before_install`: `{ block: true }` は終端です。優先度の低いハンドラーはスキップされます。
- `before_install`: `{ block: false }` は何もせず、以前のブロックを解除しません。
- `message_sending`: `{ cancel: true }` は終端です。優先度の低いハンドラーはスキップされます。
- `message_sending`: `{ cancel: false }` は何もせず、以前のキャンセルを解除しません。

ネイティブ Codex app-server は、Codex ネイティブのツールイベントをこのフックサーフェスへブリッジします。Plugin は `before_tool_call` を通じてネイティブ Codex ツールをブロックし、`after_tool_call` を通じて結果を観察し、Codex
`PermissionRequest` 承認に参加できます。このブリッジは、Codex ネイティブのツール引数をまだ書き換えません。正確な Codex ランタイムサポート境界は、
[Codex ハーネス v1 サポートコントラクト](/ja-JP/plugins/codex-harness#v1-support-contract) にあります。

型付きフック動作の詳細は、[SDK 概要](/ja-JP/plugins/sdk-overview#hook-decision-semantics) を参照してください。

## 関連情報

- [Plugin の構築](/ja-JP/plugins/building-plugins) — 独自の Plugin を作成する
- [Plugin バンドル](/ja-JP/plugins/bundles) — Codex/Claude/Cursor バンドル互換性
- [Plugin マニフェスト](/ja-JP/plugins/manifest) — マニフェストスキーマ
- [ツールの登録](/ja-JP/plugins/building-plugins#registering-agent-tools) — Plugin にエージェントツールを追加する
- [Plugin 内部構造](/ja-JP/plugins/architecture) — 機能モデルとロードパイプライン
- [コミュニティ Plugin](/ja-JP/plugins/community) — サードパーティ一覧
