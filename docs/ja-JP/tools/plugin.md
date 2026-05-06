---
read_when:
    - Pluginのインストールまたは設定
    - Plugin の検出と読み込みルールを理解する
    - Codex/Claude互換のPluginバンドルを扱う
sidebarTitle: Install and Configure
summary: OpenClaw Pluginのインストール、設定、管理
title: Plugin
x-i18n:
    generated_at: "2026-05-06T09:11:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0d68ad3cbd040d3f973d219cf273a792f11df382f6c4ccbf80c07acb0d26c658
    source_path: tools/plugin.md
    workflow: 16
---

Plugins は OpenClaw に新しい機能を追加します: チャンネル、モデルプロバイダー、
エージェントハーネス、ツール、Skills、音声、リアルタイム文字起こし、リアルタイム
音声、メディア理解、画像生成、動画生成、web フェッチ、web
検索などです。一部の Plugin は **コア** (OpenClaw に同梱) で、その他は
**外部** です。ほとんどの外部 Plugin は
[ClawHub](/ja-JP/tools/clawhub) を通じて公開され、検出されます。Npm は直接インストールと、その移行が完了するまでの一時的な OpenClaw 所有 Plugin パッケージ群のために引き続きサポートされます。

## クイックスタート

コピーして貼り付けられるインストール、一覧表示、アンインストール、更新、公開の例については、
[Plugin を管理する](/ja-JP/plugins/manage-plugins) を参照してください。

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
    openclaw plugins install npm-pack:./openclaw-plugin-1.2.3.tgz

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

  <Step title="チャットネイティブの管理">
    実行中の Gateway では、所有者専用の `/plugins enable` と `/plugins disable` が
    Gateway 設定リローダーを起動します。Gateway は Plugin ランタイム
    サーフェスをプロセス内で再読み込みし、新しいエージェントターンは更新されたレジストリからツール一覧を再構築します。`/plugins install` は Plugin ソースコードを変更するため、現在のプロセスがすでにインポート済みのモジュールを安全に再読み込みできるように見せかけるのではなく、Gateway が再起動を要求します。

  </Step>

  <Step title="Plugin を検証する">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json

    # If the plugin registered a CLI root, run one command from that root.
    openclaw <plugin-command> --help
    ```

    登録済みのツール、サービス、Gateway
    メソッド、フック、または Plugin 所有の CLI コマンドを証明する必要がある場合は、`--runtime` を使用します。単なる `inspect` はコールドなマニフェスト/レジストリチェックであり、Plugin ランタイムのインポートを意図的に避けます。

  </Step>
</Steps>

チャットネイティブ制御を好む場合は、`commands.plugins: true` を有効にして次を使用します:

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

インストールパスは CLI と同じリゾルバーを使用します: ローカルパス/アーカイブ、明示的な
`clawhub:<pkg>`、明示的な `npm:<pkg>`、明示的な `npm-pack:<path.tgz>`、
明示的な `git:<repo>`、または npm 経由の裸のパッケージ指定です。

設定が無効な場合、通常インストールはフェイルクローズし、
`openclaw doctor --fix` を案内します。唯一の復旧例外は、
`openclaw.install.allowInvalidConfigRecovery` にオプトインした Plugin 向けの限定的な同梱 Plugin
再インストールパスです。
Gateway 起動中、無効な Plugin 設定は他の無効な設定と同様にフェイルクローズします。
`openclaw doctor --fix` を実行すると、その Plugin エントリを無効化し、無効な設定ペイロードを削除することで、不正な Plugin 設定を隔離できます。通常の設定バックアップにより以前の値は保持されます。
チャンネル設定が、もはや検出できない Plugin を参照している一方で、同じ古い Plugin id が Plugin 設定またはインストール記録に残っている場合、Gateway 起動は警告をログ出力し、他のすべてのチャンネルをブロックする代わりにそのチャンネルをスキップします。
古いチャンネル/Plugin エントリを削除するには `openclaw doctor --fix` を実行してください。古い Plugin の証拠がない不明なチャンネルキーは引き続き検証に失敗するため、タイプミスは見える状態に保たれます。
`plugins.enabled: false` が設定されている場合、古い Plugin 参照は不活性として扱われます:
Gateway 起動は Plugin 検出/読み込み作業をスキップし、`openclaw doctor` は無効化された Plugin 設定を自動削除せず保持します。古い Plugin id を削除したい場合は、doctor クリーンアップを実行する前に Plugin を再度有効化してください。

Plugin 依存関係のインストールは、明示的なインストール/更新または doctor 修復フローの間だけ発生します。Gateway 起動、設定再読み込み、ランタイム検査では、パッケージマネージャーの実行や依存関係ツリーの修復は行われません。ローカル Plugin は依存関係がすでにインストールされている必要がありますが、npm、git、ClawHub Plugin は OpenClaw の管理対象 Plugin ルート配下にインストールされます。npm 依存関係は OpenClaw の管理対象 npm ルート内でホイストされる場合があります。インストール/更新は信頼前にその管理対象ルートをスキャンし、アンインストールは npm 管理パッケージを npm 経由で削除します。外部 Plugin とカスタム読み込みパスは、引き続き `openclaw plugins install` 経由でインストールする必要があります。
ランタイムコードをインポートしたり依存関係を修復したりせずに、表示されている各 Plugin の静的な `dependencyStatus` を確認するには、`openclaw plugins list --json` を使用してください。
インストール時ライフサイクルについては
[Plugin 依存関係の解決](/ja-JP/plugins/dependency-resolution) を参照してください。

### ブロックされた Plugin パスの所有権

Plugin 診断に
`blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
と表示され、続いて設定検証で `plugin present but blocked` と表示される場合、OpenClaw は、それらを読み込んでいるプロセスとは異なる Unix ユーザーが所有する Plugin ファイルを見つけています。Plugin 設定はそのまま維持し、ファイルシステムの所有権を修正するか、状態ディレクトリを所有しているのと同じユーザーとして OpenClaw を実行してください。

Docker インストールでは、公式イメージは `node` (uid `1000`) として実行されるため、ホストでバインドマウントされる OpenClaw 設定ディレクトリとワークスペースディレクトリは通常 uid `1000` が所有する必要があります:

```bash
sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
```

意図的に OpenClaw を root として実行する場合は、代わりに管理対象 Plugin ルートを
root 所有権に修復します:

```bash
sudo chown -R root:root /path/to/openclaw-config/npm
```

所有権を修正した後、`openclaw doctor --fix` または
`openclaw plugins registry --refresh` を再実行して、永続化された Plugin レジストリを修復済みファイルと一致させます。

npm インストールでは、`latest` や dist-tag などの可変セレクターはインストール前に解決され、その後 OpenClaw の管理対象 npm ルート内で正確に検証されたバージョンに固定されます。npm 完了後、OpenClaw はインストール済みの
`package-lock.json` エントリが解決済みバージョンおよび完全性とまだ一致していることを検証します。npm が異なるパッケージメタデータを書き込んだ場合、別の Plugin アーティファクトを受け入れるのではなく、インストールは失敗し、管理対象パッケージはロールバックされます。

ソースチェックアウトは pnpm ワークスペースです。同梱 Plugin をハックするために OpenClaw をクローンした場合は、`pnpm install` を実行してください。その後、OpenClaw は同梱 Plugin を
`extensions/<id>` から読み込むため、編集内容とパッケージローカル依存関係が直接使用されます。
通常の npm ルートインストールはパッケージ化された OpenClaw 向けであり、ソースチェックアウト開発向けではありません。

## Plugin の種類

OpenClaw は 2 つの Plugin 形式を認識します:

| 形式       | 仕組み                                                           | 例                                                     |
| ---------- | ---------------------------------------------------------------- | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + ランタイムモジュール; プロセス内で実行 | 公式 Plugin、コミュニティ npm パッケージ              |
| **Bundle** | Codex/Claude/Cursor 互換レイアウト; OpenClaw 機能にマッピング | `.codex-plugin/`、`.claude-plugin/`、`.cursor-plugin/` |

どちらも `openclaw plugins list` に表示されます。Bundle の詳細は [Plugin Bundles](/ja-JP/plugins/bundles) を参照してください。

Native Plugin を作成している場合は、[Building Plugins](/ja-JP/plugins/building-plugins)
と [Plugin SDK Overview](/ja-JP/plugins/sdk-overview) から始めてください。

## パッケージエントリポイント

Native Plugin npm パッケージは、`package.json` で `openclaw.extensions` を宣言する必要があります。
各エントリはパッケージディレクトリ内に収まり、読み取り可能な
ランタイムファイル、または `src/index.ts` から `dist/index.js` のように推定されるビルド済み JavaScript
ピアを持つ TypeScript ソースファイルに解決される必要があります。
パッケージ化されたインストールでは、その JavaScript ランタイム出力を同梱する必要があります。TypeScript
ソースフォールバックは、ソースチェックアウトとローカル開発パス向けであり、OpenClaw の管理対象 Plugin ルートにインストールされる
npm パッケージ向けではありません。

管理対象パッケージの警告で、TypeScript エントリに対して `requires compiled runtime output for
TypeScript entry ...` が必要だと表示される場合、そのパッケージは OpenClaw がランタイムで必要とする JavaScript ファイルなしで公開されています。これは Plugin のパッケージング問題であり、ローカル設定の問題ではありません。公開者がコンパイル済み JavaScript を再公開した後に Plugin を更新または再インストールするか、修正済みパッケージが利用可能になるまでその Plugin を無効化/アンインストールしてください。

公開済みランタイムファイルがソースエントリと同じパスに存在しない場合は、`openclaw.runtimeExtensions` を使用します。存在する場合、`runtimeExtensions` にはすべての `extensions` エントリに対して正確に 1 つずつエントリが含まれている必要があります。一致しないリストは、ソースパスへ暗黙にフォールバックするのではなく、インストールと Plugin 検出を失敗させます。`openclaw.setupEntry` も公開する場合は、そのビルド済み JavaScript ピアに `openclaw.runtimeSetupEntry` を使用します。宣言された場合、そのファイルは必須です。

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
OpenClaw リリースはすでに多くの公式 Plugin を同梱しているため、通常のセットアップではそれらを別途
npm インストールする必要はありません。OpenClaw 所有のすべての Plugin が
ClawHub に移行するまで、OpenClaw は古い/カスタムインストールと直接 npm ワークフローのために、一部の `@openclaw/*` Plugin パッケージを npm で引き続き提供します。

npm が `@openclaw/*` Plugin パッケージを非推奨として報告する場合、そのパッケージ
バージョンは古い外部パッケージ系列のものです。新しい npm パッケージが公開されるまでは、現在の OpenClaw の同梱 Plugin またはローカルチェックアウトを使用してください。

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

### コア (OpenClaw に同梱)

<AccordionGroup>
  <Accordion title="モデルプロバイダー (デフォルトで有効)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Memory Plugin">
    - `memory-core` - 同梱メモリ検索 (`plugins.slots.memory` 経由のデフォルト)
    - `memory-lancedb` - 自動リコール/キャプチャ付きの LanceDB バックエンド長期メモリ (`plugins.slots.memory = "memory-lancedb"` を設定)

    OpenAI 互換の埋め込み設定、Ollama の例、リコール制限、トラブルシューティングについては、[Memory LanceDB](/ja-JP/plugins/memory-lancedb) を参照してください。

  </Accordion>

  <Accordion title="音声プロバイダー（デフォルトで有効）">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="その他">
    - `browser` - ブラウザツール、`openclaw browser` CLI、`browser.request` Gateway メソッド、ブラウザランタイム、デフォルトのブラウザ制御サービス用の同梱ブラウザ plugin（デフォルトで有効。置き換える前に無効化してください）
    - `copilot-proxy` - VS Code Copilot Proxy ブリッジ（デフォルトで無効）

  </Accordion>
</AccordionGroup>

サードパーティ plugin を探していますか？[Community Plugins](/ja-JP/plugins/community) を参照してください。

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
| `enabled`          | マスタートグル（デフォルト: `true`）                           |
| `allow`            | Plugin 許可リスト（任意）                               |
| `bundledDiscovery` | 同梱 plugin の検出モード（デフォルトは `allowlist`）    |
| `deny`             | Plugin 拒否リスト（任意。拒否が優先）                     |
| `load.paths`       | 追加の plugin ファイル/ディレクトリ                            |
| `slots`            | 排他的なスロットセレクター（例: `memory`, `contextEngine`） |
| `entries.\<id\>`   | Plugin ごとのトグル + 設定                               |

`plugins.allow` は排他的です。空でない場合、`tools.allow` に `"*"` や特定の plugin 所有ツール名が含まれていても、一覧にある plugin だけが読み込まれるかツールを公開できます。ツール許可リストが plugin ツールを参照する場合は、所有元の plugin id を `plugins.allow` に追加するか、`plugins.allow` を削除してください。`openclaw doctor` はこの形について警告します。

新しい設定では `plugins.bundledDiscovery` のデフォルトは `"allowlist"` なので、制限的な `plugins.allow` インベントリは、ランタイムの Web 検索プロバイダー検出を含め、省略された同梱プロバイダー plugin もブロックします。Doctor は移行時に古い制限的な許可リスト設定へ `"compat"` を刻印するため、オペレーターがより厳格なモードにオプトインするまで、アップグレード後も従来の同梱プロバイダーの動作が維持されます。空の `plugins.allow` は引き続き未設定/オープンとして扱われます。

`/plugins enable` または `/plugins disable` を通じて行われた設定変更は、プロセス内の Gateway plugin リロードをトリガーします。新しいエージェントターンは、更新された plugin レジストリからツール一覧を再構築します。インストール、更新、アンインストールなどソースを変更する操作では、すでにインポート済みの plugin モジュールをその場で安全に置き換えられないため、引き続き Gateway プロセスを再起動します。

`openclaw plugins list` はローカルの plugin レジストリ/設定スナップショットです。そこで `enabled` と表示される plugin は、永続化されたレジストリと現在の設定がその plugin の参加を許可していることを意味します。すでに実行中のリモート Gateway が同じ plugin コードへリロードまたは再起動済みであることを証明するものではありません。ラッパープロセスを使う VPS/コンテナ構成では、実際の `openclaw gateway run` プロセスへ再起動やリロードをトリガーする書き込みを送るか、リロードが失敗を報告した場合は実行中の Gateway に対して `openclaw gateway restart` を使用してください。

<Accordion title="Plugin の状態: 無効、欠落、無効">
  - **無効**: plugin は存在するが、有効化ルールによってオフにされています。設定は保持されます。
  - **欠落**: 設定が参照している plugin id が検出で見つかりませんでした。
  - **無効**: plugin は存在するが、その設定が宣言されたスキーマと一致しません。Gateway 起動時はその plugin だけをスキップします。`openclaw doctor --fix` は、その plugin を無効化して設定ペイロードを削除することで、無効なエントリを隔離できます。

</Accordion>

## 検出と優先順位

OpenClaw は次の順序で plugin をスキャンします（最初に一致したものが優先）:

<Steps>
  <Step title="設定パス">
    `plugins.load.paths` - 明示的なファイルまたはディレクトリパス。OpenClaw 自身のパッケージ化済み同梱 plugin ディレクトリを指し戻すパスは無視されます。そうした古いエイリアスを削除するには `openclaw doctor --fix` を実行してください。
  </Step>

  <Step title="ワークスペース plugin">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` と `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`。
  </Step>

  <Step title="グローバル plugin">
    `~/.openclaw/<plugin-root>/*.ts` と `~/.openclaw/<plugin-root>/*/index.ts`。
  </Step>

  <Step title="同梱 plugin">
    OpenClaw に同梱されています。多くはデフォルトで有効です（モデルプロバイダー、音声）。その他は明示的な有効化が必要です。
  </Step>
</Steps>

パッケージインストールと Docker イメージでは、通常、コンパイル済みの `dist/extensions` ツリーから同梱 plugin を解決します。たとえば `/app/extensions/synology-chat` のように、同梱 plugin ソースディレクトリが対応するパッケージ済みソースパスに bind-mounted されている場合、OpenClaw はそのマウントされたソースディレクトリを同梱ソースオーバーレイとして扱い、パッケージ済みの `/app/dist/extensions/synology-chat` バンドルより前に検出します。これにより、すべての同梱 plugin を TypeScript ソースへ戻さなくても、メンテナーのコンテナループが機能します。ソースオーバーレイマウントが存在する場合でもパッケージ済み dist バンドルを強制するには、`OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1` を設定してください。

### 有効化ルール

- `plugins.enabled: false` はすべての plugin を無効化し、plugin の検出/読み込み作業をスキップします
- `plugins.deny` は常に許可より優先されます
- `plugins.entries.\<id\>.enabled: false` はその plugin を無効化します
- ワークスペース由来の plugin は**デフォルトで無効**です（明示的に有効化する必要があります）
- 同梱 plugin は、上書きされない限り組み込みのデフォルトオン集合に従います
- 排他的スロットは、そのスロットに選択された plugin を強制的に有効化できます
- 一部の同梱オプトイン plugin は、設定がプロバイダーモデル参照、チャンネル設定、ハーネスランタイムなどの plugin 所有サーフェスを指定している場合、自動的に有効化されます
- `plugins.enabled: false` が有効な間、古い plugin 設定は保持されます。古い id を削除したい場合は、doctor クリーンアップを実行する前に plugin を再度有効化してください
- OpenAI 系 Codex ルートは別々の plugin 境界を維持します:
  `openai-codex/*` は OpenAI plugin に属し、同梱の Codex app-server plugin は `agentRuntime.id: "codex"` またはレガシーな `codex/*` モデル参照によって選択されます

## ランタイムフックのトラブルシューティング

plugin が `plugins list` に表示されているのに、ライブチャットトラフィックで `register(api)` の副作用やフックが実行されない場合は、まず次を確認してください。

- `openclaw gateway status --deep --require-rpc` を実行し、アクティブな Gateway URL、プロファイル、設定パス、プロセスが編集対象のものと一致していることを確認します。
- plugin のインストール/設定/コード変更後にライブ Gateway を再起動します。ラッパーコンテナでは、PID 1 が単なるスーパーバイザーである場合があります。子の `openclaw gateway run` プロセスを再起動するかシグナルを送ってください。
- フック登録と診断を確認するには、`openclaw plugins inspect <id> --runtime --json` を使用します。`llm_input`、`llm_output`、`before_agent_finalize`、`agent_end` などの非同梱会話フックには `plugins.entries.<id>.hooks.allowConversationAccess=true` が必要です。
- モデル切り替えには `before_model_resolve` を推奨します。これはエージェントターンのモデル解決前に実行されます。`llm_output` は、モデル試行がアシスタント出力を生成した後にのみ実行されます。
- 有効なセッションモデルの証拠には、`openclaw sessions` または Gateway のセッション/ステータスサーフェスを使用し、プロバイダーペイロードをデバッグする場合は `--raw-stream --raw-stream-path <path>` 付きで Gateway を起動します。

### 遅い plugin ツールセットアップ

ツール準備中にエージェントターンが停止しているように見える場合は、トレースログを有効化し、plugin ツールファクトリのタイミング行を確認してください。

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

次を探してください。

```text
[trace:plugin-tools] factory timings ...
```

サマリーには、合計ファクトリ時間と最も遅い plugin ツールファクトリが一覧表示されます。plugin id、宣言されたツール名、結果の形状、ツールが任意かどうかが含まれます。単一のファクトリに少なくとも 1 秒かかるか、plugin ツールファクトリ準備の合計に少なくとも 5 秒かかる場合、遅い行は警告に昇格します。

OpenClaw は、同じ有効リクエストコンテキストで解決が繰り返される場合、成功した plugin ツールファクトリ結果をキャッシュします。キャッシュキーには、有効なランタイム設定、ワークスペース、エージェント/session id、サンドボックスポリシー、ブラウザ設定、配信コンテキスト、リクエスター ID、所有状態が含まれるため、これらの信頼済みフィールドに依存するファクトリは、コンテキストが変化すると再実行されます。

1 つの plugin がタイミングを支配している場合は、そのランタイム登録を調査してください。

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

その後、その plugin を更新、再インストール、または無効化します。Plugin 作者は、高コストな依存関係の読み込みをツールファクトリ内で行うのではなく、ツール実行パスの背後に移動する必要があります。

### チャンネルまたはツール所有権の重複

症状:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

これは、複数の有効な plugin が同じチャンネル、セットアップフロー、またはツール名を所有しようとしていることを意味します。最も一般的な原因は、同じチャンネル id を提供するようになった同梱 plugin の隣に、外部チャンネル plugin がインストールされていることです。

デバッグ手順:

- 有効なすべての plugin と由来を確認するには、`openclaw plugins list --enabled --verbose` を実行します。
- 疑わしい plugin ごとに `openclaw plugins inspect <id> --runtime --json` を実行し、`channels`、`channelConfigs`、`tools`、診断を比較します。
- plugin パッケージをインストールまたは削除した後、永続化されたメタデータが現在のインストールを反映するように `openclaw plugins registry --refresh` を実行します。
- インストール、レジストリ、または設定の変更後に Gateway を再起動します。

修正オプション:

- 1 つの plugin が同じチャンネル id について別の plugin を意図的に置き換える場合、優先する plugin は低優先度の plugin id を指定して `channelConfigs.<channel-id>.preferOver` を宣言する必要があります。[/plugins/manifest#replacing-another-channel-plugin](/ja-JP/plugins/manifest#replacing-another-channel-plugin) を参照してください。
- 重複が偶発的な場合は、`plugins.entries.<plugin-id>.enabled: false` で片方を無効化するか、古い plugin インストールを削除します。
- 両方の plugin を明示的に有効化した場合、OpenClaw はそのリクエストを維持し、競合を報告します。チャンネルの所有者を 1 つ選ぶか、plugin 所有ツールの名前を変更して、ランタイムサーフェスが曖昧にならないようにしてください。

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

| スロット        | 制御対象              | デフォルト          |
| --------------- | --------------------- | ------------------- |
| `memory`        | Active memory plugin  | `memory-core`       |
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

バンドルされた Plugin は OpenClaw に同梱されています。多くはデフォルトで有効です（たとえば、バンドルされたモデルプロバイダー、バンドルされた音声プロバイダー、バンドルされたブラウザー Plugin）。他のバンドル済み Plugin では、引き続き `openclaw plugins enable <id>` が必要です。

`--force` は、既存のインストール済み Plugin またはフックパックをその場で上書きします。追跡対象の npm Plugin の通常アップグレードには `openclaw plugins update <id-or-npm-spec>` を使います。管理対象のインストール先へコピーする代わりにソースパスを再利用する `--link` とは併用できません。

`plugins.allow` がすでに設定されている場合、`openclaw plugins install` はインストールした Plugin ID をその許可リストに追加してから有効化します。同じ Plugin ID が `plugins.deny` に存在する場合、インストールはその古い拒否エントリを削除するため、明示的にインストールした Plugin は再起動後すぐに読み込み可能になります。

OpenClaw は、Plugin インベントリ、コントリビューション所有権、起動計画のコールドリードモデルとして、永続化されたローカル Plugin レジストリを保持します。インストール、更新、アンインストール、有効化、無効化の各フローは、Plugin 状態を変更した後にそのレジストリを更新します。同じ `plugins/installs.json` ファイルは、耐久的なインストールメタデータをトップレベルの `installRecords` に、再構築可能なマニフェストメタデータを `plugins` に保持します。レジストリがない、古い、または無効な場合、`openclaw plugins registry --refresh` は、Plugin ランタイムモジュールを読み込まずに、インストールレコード、設定ポリシー、マニフェスト/パッケージメタデータからマニフェストビューを再構築します。`openclaw plugins update <id-or-npm-spec>` は追跡対象のインストールに適用されます。dist-tag または厳密なバージョンを含む npm パッケージ仕様を渡すと、パッケージ名を追跡対象の Plugin レコードへ解決し直し、今後の更新用に新しい仕様を記録します。バージョンなしでパッケージ名を渡すと、厳密に固定されたインストールがレジストリのデフォルトリリースラインへ戻ります。インストール済みの npm Plugin が、解決されたバージョンおよび記録されたアーティファクト ID とすでに一致している場合、OpenClaw はダウンロード、再インストール、設定の書き換えを行わずに更新をスキップします。`openclaw update` がベータチャンネルで実行されると、デフォルトラインの npm および ClawHub Plugin レコードはまず `@beta` を試し、Plugin のベータリリースが存在しない場合はデフォルト/latest にフォールバックします。厳密なバージョンと明示的なタグは固定されたままです。

`--pin` は npm 専用です。マーケットプレイスインストールは npm 仕様ではなくマーケットプレイスソースメタデータを永続化するため、`--marketplace` とは併用できません。

`--dangerously-force-unsafe-install` は、組み込みの危険コードスキャナーによる誤検知に対する非常用の上書きです。これにより、組み込みの `critical` 検出があっても Plugin のインストールと更新を続行できますが、Plugin の `before_install` ポリシーブロックやスキャン失敗によるブロックはバイパスしません。インストールスキャンは、パッケージ化されたテストモックをブロックしないように、`tests/`、`__tests__/`、`*.test.*`、`*.spec.*` などの一般的なテストファイルとディレクトリを無視します。宣言された Plugin ランタイムエントリポイントは、それらの名前のいずれかを使っている場合でも引き続きスキャンされます。

この CLI フラグは、Plugin のインストール/更新フローにのみ適用されます。Gateway ベースの skill 依存関係インストールでは、代わりに対応する `dangerouslyForceUnsafeInstall` リクエスト上書きを使います。一方、`openclaw skills install` は独立した ClawHub skill ダウンロード/インストールフローのままです。

ClawHub で公開した Plugin がスキャンによって非表示またはブロックされている場合は、ClawHub ダッシュボードを開くか、`clawhub package rescan <name>` を実行して ClawHub に再チェックを依頼します。`--dangerously-force-unsafe-install` は自分のマシン上のインストールにのみ影響します。ClawHub に Plugin の再スキャンを依頼したり、ブロックされたリリースを公開したりするものではありません。

互換バンドルは、同じ Plugin の list/inspect/enable/disable フローに参加します。現在のランタイムサポートには、バンドル skill、Claude command-skill、Claude `settings.json` デフォルト、Claude `.lsp.json` とマニフェスト宣言の `lspServers` デフォルト、Cursor command-skill、互換性のある Codex フックディレクトリが含まれます。

`openclaw plugins inspect <id>` は、検出されたバンドル機能に加えて、バンドルベース Plugin のサポート対象または非サポートの MCP および LSP サーバーエントリも報告します。

マーケットプレイスソースには、`~/.claude/plugins/known_marketplaces.json` にある Claude の既知マーケットプレイス名、ローカルマーケットプレイスルートまたは `marketplace.json` パス、`owner/repo` のような GitHub 省略形、GitHub リポジトリ URL、または git URL を指定できます。リモートマーケットプレイスでは、Plugin エントリはクローンされたマーケットプレイスリポジトリ内に留まり、相対パスソースのみを使う必要があります。

詳細は [`openclaw plugins` CLI リファレンス](/ja-JP/cli/plugins) を参照してください。

## Plugin API の概要

ネイティブ Plugin は、`register(api)` を公開するエントリオブジェクトをエクスポートします。古い Plugin は引き続きレガシーエイリアスとして `activate(api)` を使う場合がありますが、新しい Plugin は `register` を使うべきです。

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

OpenClaw は Plugin の有効化中にエントリオブジェクトを読み込み、`register(api)` を呼び出します。ローダーは古い Plugin 向けに引き続き `activate(api)` へフォールバックしますが、バンドル済み Plugin と新しい外部 Plugin は `register` を公開コントラクトとして扱うべきです。

`api.registrationMode` は、そのエントリがなぜ読み込まれているのかを Plugin に伝えます。

| モード | 意味 |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full` | ランタイム有効化。ツール、フック、サービス、コマンド、ルート、その他のライブ副作用を登録します。 |
| `discovery` | 読み取り専用の機能検出。プロバイダーとメタデータを登録します。信頼された Plugin エントリコードは読み込まれる場合がありますが、ライブ副作用はスキップします。 |
| `setup-only` | 軽量なセットアップエントリを通じたチャンネルセットアップメタデータの読み込み。 |
| `setup-runtime` | ランタイムエントリも必要とするチャンネルセットアップの読み込み。 |
| `cli-metadata` | CLI コマンドメタデータの収集のみ。 |

ソケット、データベース、バックグラウンドワーカー、または長寿命クライアントを開く Plugin エントリは、それらの副作用を `api.registrationMode === "full"` でガードするべきです。検出読み込みは有効化読み込みとは別にキャッシュされ、実行中の Gateway レジストリを置き換えません。検出は非有効化ですが、インポートなしではありません。OpenClaw はスナップショットを構築するために、信頼された Plugin エントリまたはチャンネル Plugin モジュールを評価する場合があります。モジュールのトップレベルは軽量かつ副作用なしに保ち、ネットワーククライアント、サブプロセス、リスナー、認証情報読み取り、サービス起動はフルランタイムパスの背後へ移動してください。

一般的な登録メソッド:

| メソッド | 登録内容 |
| --------------------------------------- | --------------------------- |
| `registerProvider` | モデルプロバイダー（LLM） |
| `registerChannel` | チャットチャンネル |
| `registerTool` | エージェントツール |
| `registerHook` / `on(...)` | ライフサイクルフック |
| `registerSpeechProvider` | テキスト読み上げ / STT |
| `registerRealtimeTranscriptionProvider` | ストリーミング STT |
| `registerRealtimeVoiceProvider` | 双方向リアルタイム音声 |
| `registerMediaUnderstandingProvider` | 画像/音声解析 |
| `registerImageGenerationProvider` | 画像生成 |
| `registerMusicGenerationProvider` | 音楽生成 |
| `registerVideoGenerationProvider` | 動画生成 |
| `registerWebFetchProvider` | Web fetch / スクレイププロバイダー |
| `registerWebSearchProvider` | Web 検索 |
| `registerHttpRoute` | HTTP エンドポイント |
| `registerCommand` / `registerCli` | CLI コマンド |
| `registerContextEngine` | コンテキストエンジン |
| `registerService` | バックグラウンドサービス |

型付きライフサイクルフックのフックガード動作:

- `before_tool_call`: `{ block: true }` は終端です。低優先度のハンドラーはスキップされます。
- `before_tool_call`: `{ block: false }` は何もせず、以前のブロックを解除しません。
- `before_install`: `{ block: true }` は終端です。低優先度のハンドラーはスキップされます。
- `before_install`: `{ block: false }` は何もせず、以前のブロックを解除しません。
- `message_sending`: `{ cancel: true }` は終端です。低優先度のハンドラーはスキップされます。
- `message_sending`: `{ cancel: false }` は何もせず、以前のキャンセルを解除しません。

ネイティブ Codex app-server は、ブリッジによって Codex ネイティブのツールイベントをこのフックサーフェスへ戻します。Plugin は `before_tool_call` を通じてネイティブ Codex ツールをブロックし、`after_tool_call` を通じて結果を観察し、Codex の `PermissionRequest` 承認に参加できます。このブリッジはまだ Codex ネイティブツールの引数を書き換えません。正確な Codex ランタイムサポート境界は [Codex harness v1 support contract](/ja-JP/plugins/codex-harness#v1-support-contract) にあります。

型付きフック動作の詳細は、[SDK overview](/ja-JP/plugins/sdk-overview#hook-decision-semantics) を参照してください。

## 関連

- [Pluginの構築](/ja-JP/plugins/building-plugins) - 独自のPluginを作成する
- [Pluginバンドル](/ja-JP/plugins/bundles) - Codex/Claude/Cursorバンドルの互換性
- [Pluginマニフェスト](/ja-JP/plugins/manifest) - マニフェストスキーマ
- [ツールの登録](/ja-JP/plugins/building-plugins#registering-agent-tools) - Pluginにエージェントツールを追加する
- [Plugin内部](/ja-JP/plugins/architecture) - ケイパビリティモデルと読み込みパイプライン
- [コミュニティPlugin](/ja-JP/plugins/community) - サードパーティの一覧
