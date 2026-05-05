---
read_when:
    - Pluginのインストールまたは設定
    - Pluginの検出と読み込みルールを理解する
    - Codex/Claude 互換 Plugin バンドルを扱う
sidebarTitle: Install and Configure
summary: OpenClaw Pluginをインストール、設定、管理する
title: Plugin
x-i18n:
    generated_at: "2026-05-05T01:50:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1de640f7766a6b312a2385075ae1abdb19f5c2afcb0e7063eba0d3edde697004
    source_path: tools/plugin.md
    workflow: 16
---

Plugin は OpenClaw に新しい機能を追加します: チャネル、モデルプロバイダー、
エージェントハーネス、ツール、Skills、音声、リアルタイム文字起こし、リアルタイム
音声、メディア理解、画像生成、動画生成、Web取得、Web
検索などです。一部の Plugin は **コア** (OpenClaw に同梱) で、その他は
**外部** です。ほとんどの外部 Plugin は
[ClawHub](/ja-JP/tools/clawhub) を通じて公開・検出されます。Npm は、直接インストールと、
その移行が完了するまでの一時的な OpenClaw 所有 Plugin パッケージ群のために、引き続きサポートされます。

## クイックスタート

コピー&ペースト用のインストール、一覧表示、アンインストール、更新、公開の例については、
[Pluginを管理する](/ja-JP/plugins/manage-plugins) を参照してください。

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

  <Step title="Gateway を再起動する">
    ```bash
    openclaw gateway restart
    ```

    その後、設定ファイル内の `plugins.entries.\<id\>.config` で設定します。

  </Step>

  <Step title="チャットネイティブ管理">
    実行中の Gateway では、所有者専用の `/plugins enable` と `/plugins disable` が
    Gateway 設定リローダーをトリガーします。Gateway は Plugin ランタイム
    サーフェスをプロセス内でリロードし、新しいエージェントターンは更新された
    レジストリからツール一覧を再構築します。`/plugins install` は Plugin ソースコードを変更するため、
    Gateway は、現在のプロセスがすでにインポート済みのモジュールを安全にリロードできると見せかけるのではなく、
    再起動を要求します。

  </Step>

  <Step title="Pluginを検証する">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json

    # If the plugin registered a CLI root, run one command from that root.
    openclaw <plugin-command> --help
    ```

    登録済みのツール、サービス、Gateway
    メソッド、フック、または Plugin 所有の CLI コマンドを証明する必要がある場合は `--runtime` を使用します。通常の `inspect` はコールドな
    マニフェスト/レジストリチェックであり、意図的に Plugin ランタイムのインポートを避けます。

  </Step>
</Steps>

チャットネイティブな制御を好む場合は、`commands.plugins: true` を有効にして次を使用します。

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

インストールパスは CLI と同じリゾルバーを使用します: ローカルパス/アーカイブ、明示的な
`clawhub:<pkg>`、明示的な `npm:<pkg>`、明示的な `git:<repo>`、または npm 経由の裸のパッケージ
指定です。

設定が無効な場合、通常インストールはフェイルクローズし、
`openclaw doctor --fix` を案内します。唯一の復旧例外は、
`openclaw.install.allowInvalidConfigRecovery` にオプトインした Plugin 向けの、狭い同梱 Plugin
再インストールパスです。
Gateway 起動時には、無効な Plugin 設定は他の無効な設定と同様にフェイルクローズします。
`openclaw doctor --fix` を実行すると、その Plugin エントリを無効化し、無効な設定ペイロードを削除することで、不正な Plugin 設定を隔離します。通常の
設定バックアップにより以前の値は保持されます。
チャネル設定が、もはや検出できない Plugin を参照している一方で、
同じ古い Plugin ID が Plugin 設定またはインストール記録に残っている場合、Gateway 起動は
警告をログに出し、他のすべてのチャネルをブロックするのではなくそのチャネルをスキップします。
`openclaw doctor --fix` を実行すると、古いチャネル/Plugin エントリが削除されます。古い Plugin の証拠がない不明な
チャネルキーは引き続き検証に失敗するため、入力ミスは見えるままになります。
`plugins.enabled: false` が設定されている場合、古い Plugin 参照は不活性として扱われます:
Gateway 起動は Plugin の検出/読み込み作業をスキップし、`openclaw doctor` は
無効化された Plugin 設定を自動削除せずに保持します。古い Plugin ID を削除したい場合は、
doctor クリーンアップを実行する前に Plugin を再度有効にしてください。

Plugin 依存関係のインストールは、明示的なインストール/更新または
doctor 修復フローの間にのみ行われます。Gateway 起動、設定リロード、ランタイム検査では
パッケージマネージャーを実行したり、依存関係ツリーを修復したりしません。ローカル Plugin は、依存関係がすでにインストールされている必要があります。一方 npm、git、ClawHub の Plugin は
OpenClaw の管理対象 Plugin ルート配下にインストールされます。npm 依存関係は
OpenClaw の管理対象 npm ルート内で hoist される場合があります。インストール/更新は信頼する前にその管理対象ルートをスキャンし、アンインストールは npm 管理パッケージを npm 経由で削除します。外部 Plugin
とカスタム読み込みパスは、引き続き `openclaw plugins install` を通じてインストールする必要があります。
ランタイムコードをインポートしたり依存関係を修復したりせず、表示可能な各
Plugin の静的な `dependencyStatus` を確認するには、`openclaw plugins list --json` を使用します。
インストール時ライフサイクルについては、
[Plugin依存関係の解決](/ja-JP/plugins/dependency-resolution) を参照してください。

npm インストールでは、`latest` や dist-tag などの可変セレクターは
インストール前に解決され、その後 OpenClaw の
管理対象 npm ルート内で検証済みの正確なバージョンに固定されます。npm 完了後、OpenClaw はインストール済みの
`package-lock.json` エントリが、解決済みバージョンおよび integrity とまだ一致することを検証します。
npm が異なるパッケージメタデータを書き込んだ場合、異なる Plugin アーティファクトを受け入れるのではなく、
インストールは失敗し、管理対象パッケージはロールバックされます。

ソースチェックアウトは pnpm ワークスペースです。同梱 Plugin を改造するために OpenClaw をクローンした場合は、
`pnpm install` を実行してください。OpenClaw はその後、
`extensions/<id>` から同梱 Plugin を読み込むため、編集内容とパッケージローカルの依存関係が直接使用されます。
通常の npm ルートインストールはパッケージ化された OpenClaw 向けであり、ソースチェックアウト
開発向けではありません。

## Pluginタイプ

OpenClaw は 2 つの Plugin 形式を認識します。

| 形式       | 仕組み                                                             | 例                                                     |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + ランタイムモジュール。プロセス内で実行される | 公式 Plugin、コミュニティ npm パッケージ               |
| **Bundle** | Codex/Claude/Cursor 互換レイアウト。OpenClaw 機能にマッピングされる | `.codex-plugin/`、`.claude-plugin/`、`.cursor-plugin/` |

どちらも `openclaw plugins list` に表示されます。Bundle の詳細については [Plugin Bundles](/ja-JP/plugins/bundles) を参照してください。

Native Plugin を書く場合は、[Pluginの構築](/ja-JP/plugins/building-plugins)
と [Plugin SDK概要](/ja-JP/plugins/sdk-overview) から始めてください。

## パッケージエントリポイント

Native Plugin の npm パッケージは、`package.json` で `openclaw.extensions` を宣言する必要があります。
各エントリはパッケージディレクトリ内に留まり、読み取り可能な
ランタイムファイル、または `src/index.ts` から `dist/index.js` のように推論されるビルド済み JavaScript
ピアを持つ TypeScript ソースファイルへ解決される必要があります。
パッケージ化されたインストールには、その JavaScript ランタイム出力を同梱する必要があります。TypeScript
ソースフォールバックは、ソースチェックアウトとローカル開発パス向けであり、
OpenClaw の管理対象 Plugin ルートへインストールされる npm パッケージ向けではありません。

公開されたランタイムファイルがソースエントリと同じパスに存在しない場合は、
`openclaw.runtimeExtensions` を使用します。存在する場合、`runtimeExtensions` には
すべての `extensions` エントリに対応するエントリが正確に 1 つずつ含まれている必要があります。一致しない一覧は、ソースパスへ黙ってフォールバックするのではなく、インストールと
Plugin 検出を失敗させます。`openclaw.setupEntry` も
公開する場合は、そのビルド済み JavaScript ピアに `openclaw.runtimeSetupEntry` を使用してください。宣言された場合、そのファイルは必須です。

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

ClawHub はほとんどの Plugin の主要な配布パスです。現在のパッケージ化された
OpenClaw リリースには、すでに多くの公式 Plugin が同梱されているため、通常のセットアップではそれらを
個別に npm インストールする必要はありません。すべての OpenClaw 所有 Plugin が
ClawHub へ移行するまでは、OpenClaw は古い/カスタムインストールと直接 npm ワークフロー向けに、一部の `@openclaw/*` Plugin パッケージを npm で引き続き提供します。

npm が `@openclaw/*` Plugin パッケージを非推奨として報告する場合、そのパッケージ
バージョンは古い外部パッケージ系列のものです。より新しい npm パッケージが公開されるまでは、
現在の OpenClaw に同梱された Plugin、またはローカルチェックアウトを使用してください。

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

### コア (OpenClaw に同梱)

<AccordionGroup>
  <Accordion title="モデルプロバイダー (デフォルトで有効)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="メモリ Plugin">
    - `memory-core` — 同梱メモリ検索 (デフォルトは `plugins.slots.memory` 経由)
    - `memory-lancedb` — 自動リコール/キャプチャを備えた LanceDB ベースの長期記憶 (`plugins.slots.memory = "memory-lancedb"` を設定)

    OpenAI 互換の埋め込みセットアップ、Ollama の例、リコール制限、トラブルシューティングについては
    [Memory LanceDB](/ja-JP/plugins/memory-lancedb) を参照してください。

  </Accordion>

  <Accordion title="音声プロバイダー (デフォルトで有効)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="その他">
    - `browser` — ブラウザツール、`openclaw browser` CLI、`browser.request` gateway メソッド、ブラウザランタイム、デフォルトのブラウザ制御サービス向けの同梱ブラウザ Plugin (デフォルトで有効。置き換える前に無効化してください)
    - `copilot-proxy` — VS Code Copilot Proxy ブリッジ (デフォルトで無効)

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
| ------------------ | --------------------------------------------------------- |
| `enabled`          | マスタートグル（デフォルト: `true`）                      |
| `allow`            | Plugin 許可リスト（任意）                                |
| `bundledDiscovery` | バンドル Plugin の検出モード（デフォルトは `allowlist`） |
| `deny`             | Plugin 拒否リスト（任意。deny が優先）                   |
| `load.paths`       | 追加の Plugin ファイル/ディレクトリ                      |
| `slots`            | 排他的なスロットセレクタ（例: `memory`, `contextEngine`） |
| `entries.\<id\>`   | Plugin ごとのトグル + 設定                               |

`plugins.allow` は排他的です。空でない場合、`tools.allow` に `"*"` または特定の Plugin 所有ツール名が含まれていても、一覧にある Plugin だけが読み込まれるか、ツールを公開できます。ツール許可リストが Plugin ツールを参照している場合は、所有元の Plugin id を `plugins.allow` に追加するか、`plugins.allow` を削除してください。この形については `openclaw doctor` が警告します。

`plugins.bundledDiscovery` は新しい設定ではデフォルトで `"allowlist"` になるため、制限的な `plugins.allow` インベントリは、実行時の Web 検索プロバイダー検出を含め、省略されたバンドルプロバイダー Plugin もブロックします。doctor は、古い制限的な許可リスト設定に移行時に `"compat"` を付与し、オペレーターがより厳密なモードへ明示的に切り替えるまで、アップグレード後も従来のバンドルプロバイダー動作を維持します。空の `plugins.allow` は引き続き未設定/オープンとして扱われます。

`/plugins enable` または `/plugins disable` を通じて行われた設定変更は、プロセス内の Gateway Plugin リロードをトリガーします。新しいエージェントターンでは、更新された Plugin レジストリからツールリストが再構築されます。install、update、uninstall などのソース変更操作では、すでにインポート済みの Plugin モジュールをその場で安全に置き換えられないため、引き続き Gateway プロセスを再起動します。

`openclaw plugins list` はローカルの Plugin レジストリ/設定スナップショットです。そこにある `enabled` の Plugin は、永続化されたレジストリと現在の設定が、その Plugin の参加を許可していることを意味します。すでに実行中のリモート Gateway が同じ Plugin コードでリロードまたは再起動済みであることを証明するものではありません。ラッパープロセスを持つ VPS/コンテナ構成では、実際の `openclaw gateway run` プロセスに対して再起動またはリロードをトリガーする書き込みを送るか、リロードで失敗が報告された場合は実行中の Gateway に対して `openclaw gateway restart` を使用してください。

<Accordion title="Plugin の状態: 無効、欠落、無効な設定">
  - **無効**: Plugin は存在しますが、有効化ルールによってオフにされています。設定は保持されます。
  - **欠落**: 設定が、検出で見つからなかった Plugin id を参照しています。
  - **無効な設定**: Plugin は存在しますが、その設定が宣言されたスキーマと一致しません。Gateway 起動時にはその Plugin だけがスキップされます。`openclaw doctor --fix` は、その無効なエントリを無効化し、設定ペイロードを削除することで隔離できます。

</Accordion>

## 検出と優先順位

OpenClaw は次の順序で Plugin をスキャンします（最初の一致が優先されます）。

<Steps>
  <Step title="設定パス">
    `plugins.load.paths` — 明示的なファイルまたはディレクトリパス。OpenClaw 自身のパッケージ化されたバンドル Plugin ディレクトリを指すパスは無視されます。古いエイリアスを削除するには `openclaw doctor --fix` を実行してください。
  </Step>

  <Step title="ワークスペース Plugin">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` と `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`。
  </Step>

  <Step title="グローバル Plugin">
    `~/.openclaw/<plugin-root>/*.ts` と `~/.openclaw/<plugin-root>/*/index.ts`。
  </Step>

  <Step title="バンドル Plugin">
    OpenClaw に同梱されています。多くはデフォルトで有効です（モデルプロバイダー、音声）。それ以外は明示的な有効化が必要です。
  </Step>
</Steps>

パッケージインストールと Docker イメージでは、通常、コンパイル済みの `dist/extensions` ツリーからバンドル Plugin を解決します。バンドル Plugin のソースディレクトリが一致するパッケージ化済みソースパス上にバインドマウントされている場合、たとえば `/app/extensions/synology-chat` の場合、OpenClaw はそのマウントされたソースディレクトリをバンドルソースオーバーレイとして扱い、パッケージ化済みの `/app/dist/extensions/synology-chat` バンドルより先に検出します。これにより、すべてのバンドル Plugin を TypeScript ソースへ戻さなくても、メンテナーのコンテナループが動作し続けます。ソースオーバーレイマウントが存在する場合でも、パッケージ化済み dist バンドルを強制するには `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1` を設定してください。

### 有効化ルール

- `plugins.enabled: false` はすべての Plugin を無効にし、Plugin の検出/読み込み作業をスキップします
- `plugins.deny` は常に allow より優先されます
- `plugins.entries.\<id\>.enabled: false` はその Plugin を無効にします
- ワークスペース由来の Plugin は**デフォルトで無効**です（明示的に有効にする必要があります）
- バンドル Plugin は、上書きされない限り組み込みのデフォルトオン集合に従います
- 排他的スロットは、そのスロットで選択された Plugin を強制的に有効化できます
- 一部のバンドルオプトイン Plugin は、設定がプロバイダーモデル参照、チャネル設定、ハーネスランタイムなどの Plugin 所有サーフェスを名指しすると、自動的に有効になります
- `plugins.enabled: false` が有効な間は古い Plugin 設定が保持されます。古い id を削除したい場合は、doctor cleanup を実行する前に Plugin を再度有効にしてください
- OpenAI 系の Codex ルートは個別の Plugin 境界を維持します。`openai-codex/*` は OpenAI Plugin に属し、バンドルされた Codex app-server Plugin は `agentRuntime.id: "codex"` または従来の `codex/*` モデル参照によって選択されます

## ランタイムフックのトラブルシューティング

Plugin が `plugins list` に表示されているのに、ライブチャットトラフィックで `register(api)` の副作用やフックが実行されない場合は、まず次を確認してください。

- `openclaw gateway status --deep --require-rpc` を実行し、アクティブな Gateway URL、プロファイル、設定パス、プロセスが編集対象のものと一致していることを確認します。
- Plugin のインストール/設定/コード変更後にライブ Gateway を再起動します。ラッパーコンテナでは、PID 1 が単なるスーパーバイザーである場合があります。子の `openclaw gateway run` プロセスを再起動するかシグナルを送ってください。
- フック登録と診断を確認するには `openclaw plugins inspect <id> --runtime --json` を使用します。`llm_input`、`llm_output`、`before_agent_finalize`、`agent_end` などの非バンドル会話フックには `plugins.entries.<id>.hooks.allowConversationAccess=true` が必要です。
- モデル切り替えには `before_model_resolve` を優先してください。これはエージェントターンのモデル解決前に実行されます。`llm_output` は、モデル試行がアシスタント出力を生成した後にのみ実行されます。
- 有効なセッションモデルの証拠には、`openclaw sessions` または Gateway のセッション/ステータスサーフェスを使用し、プロバイダーペイロードをデバッグする場合は `--raw-stream --raw-stream-path <path>` を付けて Gateway を起動します。

### 遅い Plugin ツールセットアップ

エージェントターンがツール準備中に停止しているように見える場合は、トレースログを有効にして、Plugin ツールファクトリのタイミング行を確認してください。

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

次を探してください。

```text
[trace:plugin-tools] factory timings ...
```

サマリーには、合計ファクトリ時間と最も遅い Plugin ツールファクトリが一覧表示されます。これには Plugin id、宣言されたツール名、結果の形、ツールが任意かどうかが含まれます。単一のファクトリに少なくとも 1 秒かかる場合、または Plugin ツールファクトリ準備全体に少なくとも 5 秒かかる場合、遅い行は警告に昇格されます。

OpenClaw は、同じ有効なリクエストコンテキストで解決が繰り返される場合に、成功した Plugin ツールファクトリ結果をキャッシュします。キャッシュキーには、有効なランタイム設定、ワークスペース、エージェント/セッション id、サンドボックスポリシー、ブラウザー設定、配信コンテキスト、リクエスター ID、所有状態が含まれるため、それらの信頼済みフィールドに依存するファクトリは、コンテキストが変わると再実行されます。

1 つの Plugin がタイミングの大部分を占めている場合は、そのランタイム登録を調べてください。

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

その後、その Plugin を更新、再インストール、または無効化します。Plugin 作者は、高コストな依存関係の読み込みをツールファクトリ内で行うのではなく、ツール実行パスの背後へ移すべきです。

### チャネルまたはツール所有権の重複

症状:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

これらは、複数の有効な Plugin が同じチャネル、セットアップフロー、またはツール名を所有しようとしていることを意味します。最も一般的な原因は、同じチャネル id を提供するようになったバンドル Plugin の横に、外部チャネル Plugin がインストールされていることです。

デバッグ手順:

- `openclaw plugins list --enabled --verbose` を実行して、有効なすべての Plugin と出所を確認します。
- 疑わしい各 Plugin について `openclaw plugins inspect <id> --runtime --json` を実行し、`channels`、`channelConfigs`、`tools`、診断を比較します。
- Plugin パッケージをインストールまたは削除した後は、永続化されたメタデータが現在のインストールを反映するように `openclaw plugins registry --refresh` を実行します。
- インストール、レジストリ、または設定の変更後に Gateway を再起動します。

修正オプション:

- 1 つの Plugin が同じチャネル id について別の Plugin を意図的に置き換える場合、優先する Plugin は `channelConfigs.<channel-id>.preferOver` に低優先度の Plugin id を宣言する必要があります。[/plugins/manifest#replacing-another-channel-plugin](/ja-JP/plugins/manifest#replacing-another-channel-plugin) を参照してください。
- 重複が意図しないものの場合は、`plugins.entries.<plugin-id>.enabled: false` で一方を無効にするか、古い Plugin インストールを削除します。
- 両方の Plugin を明示的に有効にした場合、OpenClaw はその要求を保持し、競合を報告します。ランタイムサーフェスが曖昧にならないように、チャネルの所有者を 1 つ選ぶか、Plugin 所有ツールの名前を変更してください。

## Plugin スロット（排他的カテゴリ）

一部のカテゴリは排他的です（一度にアクティブにできるのは 1 つだけ）。

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

| スロット        | 制御するもの             | デフォルト          |
| --------------- | ------------------------ | ------------------- |
| `memory`        | アクティブなメモリ Plugin | `memory-core`       |
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

バンドルされたPluginはOpenClawに同梱されています。多くはデフォルトで有効化されています（たとえば、バンドルされたモデルプロバイダー、バンドルされた音声プロバイダー、バンドルされたブラウザーPlugin）。他のバンドル済みPluginでは、引き続き`openclaw plugins enable <id>`が必要です。

`--force`は、既存のインストール済みPluginまたはフックパックをその場で上書きします。追跡対象のnpm Pluginを通常アップグレードする場合は、`openclaw plugins update <id-or-npm-spec>`を使用します。管理対象のインストール先へコピーする代わりにソースパスを再利用する`--link`とは併用できません。

`plugins.allow`がすでに設定されている場合、`openclaw plugins install`はインストールしたPlugin IDを有効化前にその許可リストへ追加します。同じPlugin IDが`plugins.deny`に存在する場合、installはその古い拒否エントリを削除し、明示的にインストールしたPluginが再起動後すぐに読み込めるようにします。

OpenClawは、Pluginインベントリ、コントリビューション所有権、起動計画のコールドリードモデルとして、永続化されたローカルPluginレジストリを保持します。install、update、uninstall、enable、disableの各フローは、Plugin状態の変更後にそのレジストリを更新します。同じ`plugins/installs.json`ファイルは、トップレベルの`installRecords`に永続的なインストールメタデータを保持し、`plugins`に再構築可能なマニフェストメタデータを保持します。レジストリが存在しない、古い、または無効な場合、`openclaw plugins registry --refresh`は、Pluginランタイムモジュールを読み込まずに、インストールレコード、設定ポリシー、マニフェスト/パッケージメタデータからマニフェストビューを再構築します。
`openclaw plugins update <id-or-npm-spec>`は追跡対象のインストールに適用されます。dist-tagまたは厳密なバージョンを含むnpmパッケージ仕様を渡すと、パッケージ名を追跡対象のPluginレコードへ解決し直し、今後の更新用に新しい仕様を記録します。バージョンなしでパッケージ名を渡すと、厳密にピン留めされたインストールはレジストリのデフォルトリリースラインへ戻ります。インストール済みのnpm Pluginが、解決されたバージョンおよび記録されたアーティファクトIDとすでに一致している場合、OpenClawはダウンロード、再インストール、設定の書き換えを行わずに更新をスキップします。
`openclaw update`がベータチャネルで実行される場合、デフォルトラインのnpmおよびClawHub Pluginレコードは最初に`@beta`を試し、Pluginのベータリリースが存在しない場合はdefault/latestへフォールバックします。厳密なバージョンと明示的なタグはピン留めされたままです。

`--pin`はnpm専用です。marketplaceインストールはnpm仕様ではなくmarketplaceソースメタデータを永続化するため、`--marketplace`とは併用できません。

`--dangerously-force-unsafe-install`は、組み込みの危険コードスキャナーによる誤検知に対する緊急用オーバーライドです。組み込みの`critical`検出があってもPluginのインストールとPlugin更新を続行できますが、Pluginの`before_install`ポリシーブロックやスキャン失敗によるブロックは迂回しません。インストールスキャンは、パッケージ化されたテストモックをブロックしないように、`tests/`、`__tests__/`、`*.test.*`、`*.spec.*`などの一般的なテストファイルとディレクトリを無視します。ただし、宣言されたPluginランタイムエントリポイントは、それらの名前のいずれかを使用している場合でも引き続きスキャンされます。

このCLIフラグはPluginのinstall/updateフローにのみ適用されます。Gateway経由のskill依存関係インストールでは、代わりに対応する`dangerouslyForceUnsafeInstall`リクエストオーバーライドを使用します。一方、`openclaw skills install`は別個のClawHub skillダウンロード/インストールフローのままです。

ClawHubで公開したPluginがスキャンによって非表示またはブロックされている場合は、ClawHubダッシュボードを開くか、`clawhub package rescan <name>`を実行してClawHubに再チェックを依頼します。`--dangerously-force-unsafe-install`は自分のマシン上のインストールにのみ影響します。ClawHubにPluginの再スキャンを依頼したり、ブロックされたリリースを公開したりするものではありません。

互換バンドルは、同じPluginのlist/inspect/enable/disableフローに参加します。現在のランタイムサポートには、バンドルSkills、ClaudeコマンドSkills、Claude `settings.json`デフォルト、Claude `.lsp.json`およびマニフェスト宣言の`lspServers`デフォルト、CursorコマンドSkills、互換性のあるCodexフックディレクトリが含まれます。

`openclaw plugins inspect <id>`は、検出されたバンドル機能に加えて、バンドルに基づくPluginのサポート対象または非サポートのMCPおよびLSPサーバーエントリも報告します。

Marketplaceソースには、`~/.claude/plugins/known_marketplaces.json`にあるClaudeの既知marketplace名、ローカルmarketplaceルートまたは`marketplace.json`パス、`owner/repo`のようなGitHub短縮表記、GitHubリポジトリURL、またはgit URLを指定できます。リモートmarketplaceでは、Pluginエントリはクローンされたmarketplaceリポジトリ内に留まり、相対パスソースのみを使用する必要があります。

詳細は[`openclaw plugins` CLIリファレンス](/ja-JP/cli/plugins)を参照してください。

## Plugin APIの概要

ネイティブPluginは、`register(api)`を公開するエントリオブジェクトをエクスポートします。古いPluginではレガシーエイリアスとして`activate(api)`をまだ使用している場合がありますが、新しいPluginでは`register`を使用する必要があります。

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

OpenClawはPluginの有効化中にエントリオブジェクトを読み込み、`register(api)`を呼び出します。ローダーは古いPlugin向けに引き続き`activate(api)`へフォールバックしますが、バンドルされたPluginと新しい外部Pluginは`register`を公開契約として扱う必要があります。

`api.registrationMode`は、エントリが読み込まれている理由をPluginに伝えます。

| モード | 意味 |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full` | ランタイム有効化。ツール、フック、サービス、コマンド、ルート、その他のライブ副作用を登録します。 |
| `discovery` | 読み取り専用の機能検出。プロバイダーとメタデータを登録します。信頼済みPluginのエントリコードは読み込まれる場合がありますが、ライブ副作用はスキップします。 |
| `setup-only` | 軽量なセットアップエントリによるチャネルセットアップメタデータの読み込み。 |
| `setup-runtime` | ランタイムエントリも必要とするチャネルセットアップの読み込み。 |
| `cli-metadata` | CLIコマンドメタデータの収集のみ。 |

ソケット、データベース、バックグラウンドワーカー、長寿命クライアントを開くPluginエントリは、それらの副作用を`api.registrationMode === "full"`でガードする必要があります。Discovery読み込みは有効化読み込みとは別にキャッシュされ、実行中のGatewayレジストリを置き換えません。Discoveryは非有効化ですが、importなしではありません。OpenClawはスナップショットを構築するために、信頼済みPluginエントリまたはチャネルPluginモジュールを評価する場合があります。モジュールのトップレベルは軽量かつ副作用なしに保ち、ネットワーククライアント、サブプロセス、リスナー、認証情報の読み取り、サービス起動はフルランタイムのパスの背後へ移動してください。

一般的な登録メソッド:

| メソッド | 登録内容 |
| --------------------------------------- | --------------------------- |
| `registerProvider` | モデルプロバイダー（LLM） |
| `registerChannel` | チャットチャネル |
| `registerTool` | エージェントツール |
| `registerHook` / `on(...)` | ライフサイクルフック |
| `registerSpeechProvider` | テキスト読み上げ / STT |
| `registerRealtimeTranscriptionProvider` | ストリーミングSTT |
| `registerRealtimeVoiceProvider` | 双方向リアルタイム音声 |
| `registerMediaUnderstandingProvider` | 画像/音声分析 |
| `registerImageGenerationProvider` | 画像生成 |
| `registerMusicGenerationProvider` | 音楽生成 |
| `registerVideoGenerationProvider` | 動画生成 |
| `registerWebFetchProvider` | Web取得 / スクレイピングプロバイダー |
| `registerWebSearchProvider` | Web検索 |
| `registerHttpRoute` | HTTPエンドポイント |
| `registerCommand` / `registerCli` | CLIコマンド |
| `registerContextEngine` | コンテキストエンジン |
| `registerService` | バックグラウンドサービス |

型付きライフサイクルフックのフックガード動作:

- `before_tool_call`: `{ block: true }`は終端です。低優先度のハンドラーはスキップされます。
- `before_tool_call`: `{ block: false }`は何もせず、以前のブロックを解除しません。
- `before_install`: `{ block: true }`は終端です。低優先度のハンドラーはスキップされます。
- `before_install`: `{ block: false }`は何もせず、以前のブロックを解除しません。
- `message_sending`: `{ cancel: true }`は終端です。低優先度のハンドラーはスキップされます。
- `message_sending`: `{ cancel: false }`は何もせず、以前のキャンセルを解除しません。

ネイティブCodex app-serverは、Codexネイティブのツールイベントをこのフックサーフェスへブリッジします。Pluginは`before_tool_call`を通じてネイティブCodexツールをブロックし、`after_tool_call`を通じて結果を監視し、Codex `PermissionRequest`の承認に参加できます。このブリッジはまだCodexネイティブのツール引数を書き換えません。Codexランタイムサポートの正確な境界は、[Codex harness v1サポート契約](/ja-JP/plugins/codex-harness#v1-support-contract)にあります。

型付きフック動作の詳細は、[SDK概要](/ja-JP/plugins/sdk-overview#hook-decision-semantics)を参照してください。

## 関連

- [Plugin の構築](/ja-JP/plugins/building-plugins) — 独自の Plugin を作成する
- [Plugin バンドル](/ja-JP/plugins/bundles) — Codex/Claude/Cursor バンドル互換性
- [Plugin マニフェスト](/ja-JP/plugins/manifest) — マニフェストスキーマ
- [ツールの登録](/ja-JP/plugins/building-plugins#registering-agent-tools) — Plugin にエージェントツールを追加する
- [Plugin 内部構造](/ja-JP/plugins/architecture) — ケイパビリティモデルと読み込みパイプライン
- [コミュニティ Plugin](/ja-JP/plugins/community) — サードパーティの一覧
