---
read_when:
    - Plugin のインストールまたは設定
    - Plugin の検出と読み込みルールを理解する
    - Codex/Claude 互換の Plugin バンドルを扱う
sidebarTitle: Install and Configure
summary: OpenClaw pluginsをインストール、設定、管理する
title: Plugin
x-i18n:
    generated_at: "2026-05-02T05:07:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: c9378ef4a6aef26949148702f2f6d8537811869511e8830ae5c3d560ff06d98b
    source_path: tools/plugin.md
    workflow: 16
---

Plugin は OpenClaw に新しい機能を追加します: チャンネル、モデルプロバイダー、エージェントハーネス、ツール、Skills、音声、リアルタイム文字起こし、リアルタイム音声、メディア理解、画像生成、動画生成、Web 取得、Web 検索などです。一部の Plugin は **コア**（OpenClaw に同梱）で、その他は **外部** です。ほとんどの外部 Plugin は [ClawHub](/ja-JP/tools/clawhub) を通じて公開および検出されます。Npm は直接インストールと、移行が完了するまでの一時的な OpenClaw 所有 Plugin パッケージ群のために、引き続きサポートされます。

## クイックスタート

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

    その後、設定ファイル内の `plugins.entries.\<id\>.config` で設定します。

  </Step>

  <Step title="Plugin を検証する">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json

    # If the plugin registered a CLI root, run one command from that root.
    openclaw <plugin-command> --help
    ```

    登録済みのツール、サービス、gateway メソッド、フック、または Plugin 所有の CLI コマンドを証明する必要がある場合は、`--runtime` を使用します。通常の `inspect` はコールドなマニフェスト/レジストリチェックであり、Plugin ランタイムのインポートを意図的に回避します。

  </Step>
</Steps>

チャットネイティブの制御を好む場合は、`commands.plugins: true` を有効にして次を使用します:

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

インストールパスは CLI と同じリゾルバーを使用します: ローカルパス/アーカイブ、明示的な `clawhub:<pkg>`、明示的な `npm:<pkg>`、明示的な `git:<repo>`、またはベアパッケージ指定（ClawHub が先、次に npm フォールバック）です。

設定が無効な場合、インストールは通常フェイルクローズし、`openclaw doctor --fix` を案内します。唯一の復旧例外は、`openclaw.install.allowInvalidConfigRecovery` にオプトインした Plugin 向けの、範囲の狭い同梱 Plugin 再インストールパスです。
Gateway 起動中、ある Plugin の無効な設定はその Plugin に分離されます: 起動ログに `plugins.entries.<id>.config` の問題を記録し、読み込み時にその Plugin をスキップし、他の Plugin とチャンネルはオンラインのままにします。`openclaw doctor --fix` を実行すると、その Plugin エントリを無効化し、無効な設定ペイロードを削除することで、不正な Plugin 設定を隔離します。通常の設定バックアップにより以前の値は保持されます。
チャンネル設定が、すでに検出できない Plugin を参照している一方で、同じ古い Plugin id が Plugin 設定またはインストール記録に残っている場合、Gateway 起動はすべての他チャンネルをブロックするのではなく、警告をログに記録してそのチャンネルをスキップします。`openclaw doctor --fix` を実行すると、古いチャンネル/Plugin エントリを削除します。古い Plugin の証拠がない不明なチャンネルキーは引き続き検証に失敗するため、タイプミスは可視のままです。
`plugins.enabled: false` が設定されている場合、古い Plugin 参照は不活性として扱われます: Gateway 起動は Plugin の検出/読み込み作業をスキップし、`openclaw doctor` は無効化された Plugin 設定を自動削除せずに保持します。古い Plugin id を削除したい場合は、doctor クリーンアップを実行する前に Plugin を再有効化してください。

Plugin 依存関係のインストールは、明示的なインストール/更新または doctor 修復フロー中にのみ行われます。Gateway 起動、設定リロード、ランタイム検査では、パッケージマネージャーを実行したり依存関係ツリーを修復したりしません。ローカル Plugin は依存関係がすでにインストールされている必要があります。一方、npm、git、ClawHub Plugin は OpenClaw の管理対象 Plugin ルート配下にインストールされます。npm 依存関係は OpenClaw の管理対象 npm ルート内で hoist される場合があります。インストール/更新では、信頼の前にその管理対象ルートをスキャンし、アンインストールでは npm 管理パッケージを npm 経由で削除します。外部 Plugin とカスタム読み込みパスは、引き続き `openclaw plugins install` 経由でインストールする必要があります。インストール時ライフサイクルについては [Plugin 依存関係の解決](/ja-JP/plugins/dependency-resolution) を参照してください。

ソースチェックアウトは pnpm ワークスペースです。同梱 Plugin を変更するために OpenClaw をクローンする場合は、`pnpm install` を実行してください。その後、OpenClaw は `extensions/<id>` から同梱 Plugin を読み込むため、編集内容とパッケージローカルの依存関係が直接使用されます。通常の npm ルートインストールは、パッケージ化された OpenClaw 用であり、ソースチェックアウト開発用ではありません。

## Plugin の種類

OpenClaw は 2 つの Plugin 形式を認識します:

| 形式       | 仕組み                                                              | 例                                                     |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + ランタイムモジュール。インプロセスで実行  | 公式 Plugin、コミュニティ npm パッケージ               |
| **Bundle** | Codex/Claude/Cursor 互換レイアウト。OpenClaw 機能にマッピングされる | `.codex-plugin/`、`.claude-plugin/`、`.cursor-plugin/` |

どちらも `openclaw plugins list` に表示されます。バンドルの詳細については [Plugin Bundles](/ja-JP/plugins/bundles) を参照してください。

ネイティブ Plugin を作成する場合は、[Plugin の構築](/ja-JP/plugins/building-plugins) と [Plugin SDK の概要](/ja-JP/plugins/sdk-overview) から始めてください。

## パッケージエントリポイント

ネイティブ Plugin の npm パッケージは、`package.json` で `openclaw.extensions` を宣言する必要があります。各エントリはパッケージディレクトリ内に収まり、読み取り可能なランタイムファイル、または `src/index.ts` から `dist/index.js` のように推論されるビルド済み JavaScript ピアを持つ TypeScript ソースファイルに解決される必要があります。

公開済みランタイムファイルがソースエントリと同じパスに存在しない場合は、`openclaw.runtimeExtensions` を使用します。存在する場合、`runtimeExtensions` にはすべての `extensions` エントリに対して正確に 1 つのエントリが含まれている必要があります。一致しないリストは、ソースパスへ静かにフォールバックするのではなく、インストールと Plugin 検出を失敗させます。`openclaw.setupEntry` も公開する場合は、そのビルド済み JavaScript ピアとして `openclaw.runtimeSetupEntry` を使用します。宣言された場合、そのファイルは必須です。

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

ClawHub は、ほとんどの Plugin にとって主要な配布パスです。現在のパッケージ化された OpenClaw リリースにはすでに多くの公式 Plugin が同梱されているため、通常のセットアップではそれらを別途 npm インストールする必要はありません。すべての OpenClaw 所有 Plugin が ClawHub に移行するまで、OpenClaw は古い/カスタムインストールと直接 npm ワークフロー向けに、一部の `@openclaw/*` Plugin パッケージを npm で引き続き提供します。

npm が `@openclaw/*` Plugin パッケージを非推奨として報告する場合、そのパッケージバージョンは古い外部パッケージ系統のものです。新しい npm パッケージが公開されるまでは、現在の OpenClaw に同梱された Plugin、またはローカルチェックアウトを使用してください。

| Plugin          | パッケージ                 | ドキュメント                               |
| --------------- | -------------------------- | ------------------------------------------ |
| BlueBubbles     | `@openclaw/bluebubbles`    | [BlueBubbles](/ja-JP/channels/bluebubbles)       |
| Discord         | `@openclaw/discord`        | [Discord](/ja-JP/channels/discord)               |
| Feishu          | `@openclaw/feishu`         | [Feishu](/ja-JP/channels/feishu)                 |
| Matrix          | `@openclaw/matrix`         | [Matrix](/ja-JP/channels/matrix)                 |
| Mattermost      | `@openclaw/mattermost`     | [Mattermost](/ja-JP/channels/mattermost)         |
| Microsoft Teams | `@openclaw/msteams`        | [Microsoft Teams](/ja-JP/channels/msteams)       |
| Nextcloud Talk  | `@openclaw/nextcloud-talk` | [Nextcloud Talk](/ja-JP/channels/nextcloud-talk) |
| Nostr           | `@openclaw/nostr`          | [Nostr](/ja-JP/channels/nostr)                   |
| Synology Chat   | `@openclaw/synology-chat`  | [Synology Chat](/ja-JP/channels/synology-chat)   |
| Tlon            | `@openclaw/tlon`           | [Tlon](/ja-JP/channels/tlon)                     |
| WhatsApp        | `@openclaw/whatsapp`       | [WhatsApp](/ja-JP/channels/whatsapp)             |
| Zalo            | `@openclaw/zalo`           | [Zalo](/ja-JP/channels/zalo)                     |
| Zalo Personal   | `@openclaw/zalouser`       | [Zalo Personal](/ja-JP/plugins/zalouser)         |

### コア（OpenClaw に同梱）

<AccordionGroup>
  <Accordion title="モデルプロバイダー（デフォルトで有効）">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Memory Plugin">
    - `memory-core` — 同梱メモリ検索（`plugins.slots.memory` 経由のデフォルト）
    - `memory-lancedb` — 自動 recall/capture を備えた LanceDB バックエンドの長期メモリ（`plugins.slots.memory = "memory-lancedb"` を設定）

    OpenAI 互換の embedding セットアップ、Ollama の例、recall 制限、トラブルシューティングについては、[Memory LanceDB](/ja-JP/plugins/memory-lancedb) を参照してください。

  </Accordion>

  <Accordion title="音声プロバイダー（デフォルトで有効）">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="その他">
    - `browser` — ブラウザツール、`openclaw browser` CLI、`browser.request` gateway メソッド、ブラウザランタイム、デフォルトのブラウザ制御サービスのための同梱ブラウザ Plugin（デフォルトで有効。置き換える前に無効化してください）
    - `copilot-proxy` — VS Code Copilot Proxy ブリッジ（デフォルトで無効）

  </Accordion>
</AccordionGroup>

サードパーティ Plugin を探していますか？[Community Plugins](/ja-JP/plugins/community) を参照してください。

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

| フィールド       | 説明                                                         |
| ---------------- | ------------------------------------------------------------ |
| `enabled`        | マスタートグル（デフォルト: `true`）                         |
| `allow`          | Plugin allowlist（任意）                                     |
| `deny`           | Plugin denylist（任意。deny が優先）                         |
| `load.paths`     | 追加の Plugin ファイル/ディレクトリ                          |
| `slots`          | 排他的なスロットセレクター（例: `memory`, `contextEngine`）  |
| `entries.\<id\>` | Plugin ごとのトグル + 設定                                   |

`plugins.allow` は排他的です。空でない場合、`tools.allow` に `"*"` または特定の Plugin 所有ツール名が含まれていても、一覧にある Plugin だけが読み込みまたはツール公開を行えます。ツール allowlist が Plugin ツールを参照する場合は、所有 Plugin id を `plugins.allow` に追加するか、`plugins.allow` を削除してください。`openclaw doctor` はこの形について警告します。

設定変更には **gateway の再起動が必要** です。Gateway が設定監視 + インプロセス再起動を有効にして実行されている場合（デフォルトの `openclaw gateway` パス）、その再起動は通常、設定書き込みが反映された少し後に自動で実行されます。ネイティブ Plugin のランタイムコードまたはライフサイクルフックには、サポートされたホットリロードパスはありません。更新された `register(api)` コード、`api.on(...)` フック、ツール、サービス、またはプロバイダー/ランタイムフックが実行されることを期待する前に、ライブチャンネルを提供している Gateway プロセスを再起動してください。

`openclaw plugins list` はローカルの Plugin レジストリ/設定スナップショットです。そこで
`enabled` の Plugin は、永続化されたレジストリと現在の設定がその
Plugin の参加を許可していることを意味します。すでに実行中のリモート Gateway
子プロセスが同じ Plugin コードで再起動済みであることを証明するものではありません。VPS/コンテナ構成で
ラッパープロセスを使っている場合は、実際の `openclaw gateway run` プロセスに
再起動を送るか、実行中の Gateway に対して `openclaw gateway restart` を使ってください。

<Accordion title="Plugin states: disabled vs missing vs invalid">
  - **無効**: Plugin は存在しますが、有効化ルールによってオフになっています。設定は保持されます。
  - **欠落**: 設定が参照している Plugin id を検出で見つけられませんでした。
  - **無効な設定**: Plugin は存在しますが、その設定が宣言されたスキーマに一致しません。Gateway の起動ではその Plugin だけがスキップされます。`openclaw doctor --fix` は、無効なエントリを無効化して設定ペイロードを削除することで隔離できます。

</Accordion>

## 検出と優先順位

OpenClaw は次の順序で Plugin をスキャンします（最初に一致したものが優先されます）。

<Steps>
  <Step title="Config paths">
    `plugins.load.paths` — 明示的なファイルまたはディレクトリパスです。OpenClaw 自身のパッケージ済み同梱 Plugin ディレクトリを
    指すパスは無視されます。これらの古いエイリアスを削除するには
    `openclaw doctor --fix` を実行してください。
  </Step>

  <Step title="Workspace plugins">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` と `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`。
  </Step>

  <Step title="Global plugins">
    `~/.openclaw/<plugin-root>/*.ts` と `~/.openclaw/<plugin-root>/*/index.ts`。
  </Step>

  <Step title="Bundled plugins">
    OpenClaw に同梱されています。多くはデフォルトで有効です（モデルプロバイダー、音声など）。
    それ以外は明示的な有効化が必要です。
  </Step>
</Steps>

パッケージ済みインストールと Docker イメージは通常、コンパイル済みの
`dist/extensions` ツリーから同梱 Plugin を解決します。同梱 Plugin のソースディレクトリが
対応するパッケージ済みソースパス上に bind mount されている場合、たとえば
`/app/extensions/synology-chat` のような場合、OpenClaw はそのマウントされたソースディレクトリを
同梱ソースオーバーレイとして扱い、パッケージ済みの
`/app/dist/extensions/synology-chat` バンドルより前に検出します。これにより、すべての同梱 Plugin を TypeScript ソースに戻さなくても
メンテナー向けコンテナループが動作し続けます。
ソースオーバーレイのマウントが存在しても、パッケージ済み dist バンドルを強制するには
`OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1` を設定してください。

### 有効化ルール

- `plugins.enabled: false` はすべての Plugin を無効化し、Plugin の検出/読み込み作業をスキップします
- `plugins.deny` は常に allow より優先されます
- `plugins.entries.\<id\>.enabled: false` はその Plugin を無効化します
- ワークスペース由来の Plugin は**デフォルトで無効**です（明示的な有効化が必要です）
- 同梱 Plugin は、上書きされない限り組み込みのデフォルトオンセットに従います
- 排他的スロットは、そのスロットで選択された Plugin を強制的に有効化できます
- 一部の同梱オプトイン Plugin は、設定が Plugin 所有のサーフェスを指定している場合に自動で有効になります。
  たとえばプロバイダーモデル参照、チャンネル設定、ハーネス
  ランタイムなどです
- `plugins.enabled: false` が有効な間、古い Plugin 設定は保持されます。
  古い id を削除したい場合は、doctor クリーンアップを実行する前に Plugin を再度有効化してください
- OpenAI 系 Codex ルートは個別の Plugin 境界を維持します。
  `openai-codex/*` は OpenAI Plugin に属し、同梱 Codex
  app-server Plugin は `agentRuntime.id: "codex"` または従来の
  `codex/*` モデル参照によって選択されます

## ランタイムフックのトラブルシューティング

Plugin が `plugins list` に表示されるのに、`register(api)` の副作用やフックが
ライブチャットトラフィックで実行されない場合は、まず次を確認してください。

- `openclaw gateway status --deep --require-rpc` を実行し、アクティブな
  Gateway URL、プロファイル、設定パス、プロセスが編集対象のものと一致していることを確認します。
- Plugin のインストール/設定/コード変更後に、ライブ Gateway を再起動します。ラッパー
  コンテナでは、PID 1 が単なる supervisor の場合があります。子の
  `openclaw gateway run` プロセスを再起動またはシグナル送信してください。
- フック登録と診断を確認するには、`openclaw plugins inspect <id> --runtime --json` を使います。
  `llm_input`、`llm_output`、`before_agent_finalize`、`agent_end` などの非同梱会話フックには
  `plugins.entries.<id>.hooks.allowConversationAccess=true` が必要です。
- モデル切り替えには `before_model_resolve` を推奨します。これはエージェントターンのモデル
  解決前に実行されます。`llm_output` は、モデル試行が
  アシスタント出力を生成した後にのみ実行されます。
- 有効なセッションモデルの証明には、`openclaw sessions` または
  Gateway のセッション/ステータスサーフェスを使い、プロバイダーペイロードをデバッグする場合は
  `--raw-stream --raw-stream-path <path>` を付けて Gateway を起動します。

### Plugin ツールセットアップが遅い場合

ツールの準備中にエージェントターンが停止しているように見える場合は、トレースログを有効にし、
Plugin ツールファクトリーのタイミング行を確認します。

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

探す内容:

```text
[trace:plugin-tools] factory timings ...
```

要約には、合計ファクトリー時間と最も遅い Plugin ツールファクトリーが表示されます。
これには Plugin id、宣言されたツール名、結果の形状、そのツールが
optional かどうかが含まれます。単一のファクトリーに少なくとも
1 秒かかった場合、または Plugin ツールファクトリー準備の合計に少なくとも 5 秒かかった場合、遅い行は警告に昇格されます。

1 つの Plugin がタイミングの大部分を占めている場合は、そのランタイム登録を調べます。

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

その後、その Plugin を更新、再インストール、または無効化します。Plugin 作者は、
高コストな依存関係の読み込みをツールファクトリー内で行うのではなく、
ツール実行パスの背後へ移動する必要があります。

### 重複したチャンネルまたはツール所有権

症状:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

これらは、有効な複数の Plugin が同じチャンネル、
セットアップフロー、またはツール名を所有しようとしていることを意味します。最も一般的な原因は、
同じチャンネル id を提供するようになった同梱 Plugin の隣に外部チャンネル Plugin が
インストールされていることです。

デバッグ手順:

- `openclaw plugins list --enabled --verbose` を実行し、有効なすべての Plugin
  とその由来を確認します。
- 疑わしい各 Plugin に対して `openclaw plugins inspect <id> --runtime --json` を実行し、
  `channels`、`channelConfigs`、`tools`、診断を比較します。
- Plugin パッケージをインストールまたは削除した後は、`openclaw plugins registry --refresh` を実行して、
  永続化されたメタデータが現在のインストールを反映するようにします。
- インストール、レジストリ、設定の変更後は Gateway を再起動します。

修正オプション:

- 1 つの Plugin が同じチャンネル id に対して別の Plugin を意図的に置き換える場合、
  優先する Plugin は、優先度の低い Plugin id とともに
  `channelConfigs.<channel-id>.preferOver` を宣言する必要があります。[/plugins/manifest#replacing-another-channel-plugin](/ja-JP/plugins/manifest#replacing-another-channel-plugin) を参照してください。
- 重複が意図しないものである場合は、
  `plugins.entries.<plugin-id>.enabled: false` で片方を無効化するか、古い Plugin
  インストールを削除します。
- 両方の Plugin を明示的に有効化した場合、OpenClaw はその要求を保持し、
  競合を報告します。チャンネルの所有者を 1 つ選ぶか、Plugin 所有の
  ツール名を変更して、ランタイムサーフェスを曖昧にしないようにしてください。

## Plugin スロット（排他的カテゴリ）

一部のカテゴリは排他的です（一度にアクティブにできるのは 1 つだけです）。

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

| スロット        | 制御するもの          | デフォルト          |
| --------------- | --------------------- | ------------------- |
| `memory`        | Active memory Plugin  | `memory-core`       |
| `contextEngine` | Active context engine | `legacy` (built-in) |

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

openclaw plugins install <package>         # install (ClawHub first, then npm)
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

同梱 Plugin は OpenClaw とともに出荷されます。多くはデフォルトで有効です（たとえば
同梱モデルプロバイダー、同梱音声プロバイダー、同梱ブラウザー
Plugin）。他の同梱 Plugin には引き続き `openclaw plugins enable <id>` が必要です。

`--force` は、既存のインストール済み Plugin またはフックパックをその場で上書きします。追跡対象の npm
Plugin の通常アップグレードには
`openclaw plugins update <id-or-npm-spec>` を使います。これは `--link` とは併用できません。`--link` は管理対象インストール先へコピーする代わりに
ソースパスを再利用します。

`plugins.allow` がすでに設定されている場合、`openclaw plugins install` は
インストールされた Plugin id を有効化する前にその allowlist へ追加します。同じ Plugin id
が `plugins.deny` に存在する場合、install はその古い deny エントリを削除するため、
明示的なインストールは再起動後すぐに読み込み可能になります。

OpenClaw は、Plugin インベントリ、コントリビューション所有権、起動計画の
コールド読み取りモデルとして、永続化されたローカル Plugin レジストリを保持します。install、update、
uninstall、enable、disable の各フローは、Plugin
状態の変更後にそのレジストリを更新します。同じ `plugins/installs.json` ファイルは、
トップレベルの `installRecords` に永続的なインストールメタデータを保持し、
`plugins` に再構築可能なマニフェストメタデータを保持します。レジストリが欠落、古い、または無効な場合、
`openclaw plugins registry
--refresh` は、Plugin ランタイムモジュールを読み込まずに、インストールレコード、設定ポリシー、
マニフェスト/パッケージメタデータからマニフェストビューを再構築します。
`openclaw plugins update <id-or-npm-spec>` は追跡対象のインストールに適用されます。dist-tag または正確なバージョンを含む
npm パッケージ spec を渡すと、パッケージ名が追跡対象 Plugin レコードへ解決され、
今後の更新用に新しい spec が記録されます。
バージョンなしでパッケージ名を渡すと、正確にピン留めされたインストールは
レジストリのデフォルトリリースラインへ戻ります。インストール済み npm Plugin が解決済みバージョンおよび記録済み artifact identity とすでに一致している場合、OpenClaw は
ダウンロード、再インストール、設定の書き換えを行わずに更新をスキップします。

`--pin` は npm 専用です。`--marketplace` ではサポートされません。これは、マーケットプレイスのインストールでは npm spec ではなくマーケットプレイスソースのメタデータが永続化されるためです。

`--dangerously-force-unsafe-install` は、組み込みの危険コードスキャナーによる誤検知に対する非常用の上書きです。Plugin のインストールと Plugin の更新で、組み込みの `critical` 検出を越えて続行できるようにしますが、それでも Plugin の `before_install` ポリシーブロックやスキャン失敗によるブロックはバイパスしません。インストールスキャンでは、パッケージ化されたテストモックでブロックしないように、`tests/`、`__tests__/`、`*.test.*`、`*.spec.*` などの一般的なテストファイルとディレクトリを無視します。ただし、宣言された Plugin ランタイムエントリポイントは、それらの名前のいずれかを使用している場合でもスキャンされます。

この CLI フラグは、Plugin のインストール/更新フローにのみ適用されます。Gateway バックの Skill 依存関係インストールでは、代わりに対応する `dangerouslyForceUnsafeInstall` リクエスト上書きを使用します。一方、`openclaw skills install` は独立した ClawHub Skill のダウンロード/インストールフローのままです。

ClawHub で公開した Plugin がスキャンによって非表示またはブロックされている場合は、ClawHub ダッシュボードを開くか、`clawhub package rescan <name>` を実行して ClawHub に再チェックを依頼してください。`--dangerously-force-unsafe-install` は自分のマシン上のインストールにのみ影響します。ClawHub に Plugin の再スキャンを依頼したり、ブロックされたリリースを公開したりするものではありません。

互換バンドルは、同じ Plugin の一覧表示/検査/有効化/無効化フローに参加します。現在のランタイムサポートには、バンドル Skills、Claude コマンド Skills、Claude `settings.json` デフォルト、Claude `.lsp.json` とマニフェスト宣言の `lspServers` デフォルト、Cursor コマンド Skills、および互換性のある Codex フックディレクトリが含まれます。

`openclaw plugins inspect <id>` は、検出されたバンドル機能に加えて、バンドルバックの Plugin に対するサポート対象または未サポートの MCP および LSP サーバーエントリも報告します。

マーケットプレイスソースには、`~/.claude/plugins/known_marketplaces.json` にある Claude の既知マーケットプレイス名、ローカルマーケットプレイスルートまたは `marketplace.json` パス、`owner/repo` のような GitHub 省略形、GitHub リポジトリ URL、または git URL を指定できます。リモートマーケットプレイスの場合、Plugin エントリはクローンされたマーケットプレイスリポジトリ内に収め、相対パスソースのみを使用する必要があります。

詳細は [`openclaw plugins` CLI リファレンス](/ja-JP/cli/plugins) を参照してください。

## Plugin API の概要

ネイティブ Plugin は、`register(api)` を公開するエントリオブジェクトをエクスポートします。古い Plugin はレガシーエイリアスとして `activate(api)` をまだ使用している場合がありますが、新しい Plugin は `register` を使用するべきです。

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

OpenClaw はエントリオブジェクトを読み込み、Plugin の有効化中に `register(api)` を呼び出します。ローダーは古い Plugin 向けに引き続き `activate(api)` にフォールバックしますが、バンドル Plugin と新しい外部 Plugin は `register` を公開契約として扱うべきです。

`api.registrationMode` は、Plugin に対してそのエントリが読み込まれている理由を伝えます。

| モード          | 意味                                                                                                                          |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `full`          | ランタイム有効化。ツール、フック、サービス、コマンド、ルート、その他のライブ副作用を登録します。                              |
| `discovery`     | 読み取り専用の機能検出。プロバイダーとメタデータを登録します。信頼済みの Plugin エントリコードは読み込まれる場合がありますが、ライブ副作用はスキップします。 |
| `setup-only`    | 軽量なセットアップエントリを通じたチャネルセットアップメタデータの読み込み。                                                  |
| `setup-runtime` | ランタイムエントリも必要とするチャネルセットアップの読み込み。                                                                |
| `cli-metadata`  | CLI コマンドメタデータの収集のみ。                                                                                            |

ソケット、データベース、バックグラウンドワーカー、または長命のクライアントを開く Plugin エントリは、それらの副作用を `api.registrationMode === "full"` でガードするべきです。検出用の読み込みは有効化用の読み込みとは別にキャッシュされ、実行中の Gateway レジストリを置き換えません。検出は有効化を伴いませんが、インポート不要ではありません。OpenClaw はスナップショットを構築するために、信頼済みの Plugin エントリまたはチャネル Plugin モジュールを評価する場合があります。モジュールのトップレベルは軽量かつ副作用なしに保ち、ネットワーククライアント、サブプロセス、リスナー、認証情報の読み取り、サービス起動はフルランタイムパスの背後に移動してください。

一般的な登録メソッド:

| メソッド                                | 登録するもの                  |
| --------------------------------------- | ----------------------------- |
| `registerProvider`                      | モデルプロバイダー (LLM)      |
| `registerChannel`                       | チャットチャネル              |
| `registerTool`                          | エージェントツール            |
| `registerHook` / `on(...)`              | ライフサイクルフック          |
| `registerSpeechProvider`                | テキスト読み上げ / STT        |
| `registerRealtimeTranscriptionProvider` | ストリーミング STT            |
| `registerRealtimeVoiceProvider`         | 双方向リアルタイム音声        |
| `registerMediaUnderstandingProvider`    | 画像/音声分析                 |
| `registerImageGenerationProvider`       | 画像生成                      |
| `registerMusicGenerationProvider`       | 音楽生成                      |
| `registerVideoGenerationProvider`       | 動画生成                      |
| `registerWebFetchProvider`              | Web フェッチ / スクレイププロバイダー |
| `registerWebSearchProvider`             | Web 検索                      |
| `registerHttpRoute`                     | HTTP エンドポイント           |
| `registerCommand` / `registerCli`       | CLI コマンド                  |
| `registerContextEngine`                 | コンテキストエンジン          |
| `registerService`                       | バックグラウンドサービス      |

型付きライフサイクルフックのフックガード動作:

- `before_tool_call`: `{ block: true }` は終端です。優先度の低いハンドラーはスキップされます。
- `before_tool_call`: `{ block: false }` は no-op であり、以前のブロックを解除しません。
- `before_install`: `{ block: true }` は終端です。優先度の低いハンドラーはスキップされます。
- `before_install`: `{ block: false }` は no-op であり、以前のブロックを解除しません。
- `message_sending`: `{ cancel: true }` は終端です。優先度の低いハンドラーはスキップされます。
- `message_sending`: `{ cancel: false }` は no-op であり、以前のキャンセルを解除しません。

ネイティブ Codex アプリサーバーは、Codex ネイティブツールイベントをこのフックサーフェスへブリッジします。Plugin は `before_tool_call` を通じてネイティブ Codex ツールをブロックし、`after_tool_call` を通じて結果を監視し、Codex の `PermissionRequest` 承認に参加できます。このブリッジは、まだ Codex ネイティブツール引数を書き換えません。正確な Codex ランタイムサポート境界は、[Codex harness v1 サポート契約](/ja-JP/plugins/codex-harness#v1-support-contract) にあります。

型付きフック動作の詳細は、[SDK 概要](/ja-JP/plugins/sdk-overview#hook-decision-semantics) を参照してください。

## 関連

- [Plugin の構築](/ja-JP/plugins/building-plugins) — 独自の Plugin を作成する
- [Plugin バンドル](/ja-JP/plugins/bundles) — Codex/Claude/Cursor バンドル互換性
- [Plugin マニフェスト](/ja-JP/plugins/manifest) — マニフェストスキーマ
- [ツールの登録](/ja-JP/plugins/building-plugins#registering-agent-tools) — Plugin にエージェントツールを追加する
- [Plugin 内部](/ja-JP/plugins/architecture) — 機能モデルと読み込みパイプライン
- [コミュニティ Plugin](/ja-JP/plugins/community) — サードパーティ一覧
