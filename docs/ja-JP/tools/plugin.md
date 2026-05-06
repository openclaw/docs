---
read_when:
    - Plugin のインストールまたは設定
    - Plugin の検出と読み込みルールを理解する
    - Codex/Claude 互換の Plugin バンドルを扱う
sidebarTitle: Install and Configure
summary: OpenClaw Pluginをインストール、設定、管理する
title: Plugin
x-i18n:
    generated_at: "2026-05-06T18:00:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: ef355ac480bce7140049f59d3d01909de2cf2fdf80ad07db62e05ee997840c81
    source_path: tools/plugin.md
    workflow: 16
---

Plugin は OpenClaw に新しい機能を追加します。チャンネル、モデルプロバイダー、
エージェントハーネス、ツール、Skills、音声、リアルタイム文字起こし、リアルタイム
音声、メディア理解、画像生成、動画生成、Web フェッチ、Web
検索などです。一部の Plugin は **コア**（OpenClaw に同梱）で、他は
**外部**です。ほとんどの外部 Plugin は
[ClawHub](/ja-JP/tools/clawhub) を通じて公開および検出されます。Npm は直接インストールと、
その移行が完了するまでの一時的な OpenClaw 所有 Plugin パッケージ群のために、
引き続きサポートされます。

## クイックスタート

インストール、一覧表示、アンインストール、更新、公開のコピー＆ペースト用の例は、
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

  <Step title="チャットネイティブな管理">
    実行中の Gateway では、所有者のみが使える `/plugins enable` と `/plugins disable` が
    Gateway 設定リローダーをトリガーします。Gateway は Plugin ランタイム
    サーフェスをプロセス内で再読み込みし、新しいエージェントターンは更新された
    レジストリからツール一覧を再構築します。`/plugins install` は Plugin ソースコードを変更するため、
    現在のプロセスがすでにインポートされたモジュールを安全に再読み込みできるように見せかけるのではなく、
    Gateway は再起動を要求します。

  </Step>

  <Step title="Plugin を検証する">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json

    # If the plugin registered a CLI root, run one command from that root.
    openclaw <plugin-command> --help
    ```

    登録済みのツール、サービス、Gateway
    メソッド、フック、または Plugin 所有の CLI コマンドを証明する必要がある場合は
    `--runtime` を使用します。通常の `inspect` はコールドな
    マニフェスト/レジストリチェックであり、意図的に Plugin ランタイムのインポートを避けます。

  </Step>
</Steps>

チャットネイティブな制御を好む場合は、`commands.plugins: true` を有効にして次を使用します。

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

インストールパスは CLI と同じリゾルバーを使用します。ローカルパス/アーカイブ、明示的な
`clawhub:<pkg>`、明示的な `npm:<pkg>`、明示的な `npm-pack:<path.tgz>`、
明示的な `git:<repo>`、または npm 経由のベアパッケージ指定です。

設定が無効な場合、インストールは通常フェイルクローズし、
`openclaw doctor --fix` を案内します。唯一の復旧例外は、
`openclaw.install.allowInvalidConfigRecovery` にオプトインする Plugin 向けの
限定的な同梱 Plugin 再インストールパスです。
Gateway 起動中は、無効な Plugin 設定は他の無効な設定と同じようにフェイルクローズします。
`openclaw doctor --fix` を実行すると、その Plugin エントリを無効化し、
無効な設定ペイロードを削除することで不正な Plugin 設定を隔離できます。通常の
設定バックアップにより以前の値は保持されます。
チャンネル設定が、もはや検出できない Plugin を参照している一方で、同じ古い Plugin id が
Plugin 設定またはインストール記録に残っている場合、Gateway 起動は警告をログに記録し、
他のすべてのチャンネルをブロックするのではなく、そのチャンネルをスキップします。
古いチャンネル/Plugin エントリを削除するには `openclaw doctor --fix` を実行します。古い
Plugin の証拠がない不明なチャンネルキーは、タイプミスが見えるように引き続き検証に失敗します。
`plugins.enabled: false` が設定されている場合、古い Plugin 参照は不活性として扱われます。
Gateway 起動は Plugin の検出/読み込み作業をスキップし、`openclaw doctor` は
無効化された Plugin 設定を自動削除する代わりに保持します。古い Plugin id を削除したい場合は、
doctor クリーンアップを実行する前に Plugin を再有効化してください。

Plugin 依存関係のインストールは、明示的なインストール/更新または
doctor 修復フロー中にのみ行われます。Gateway 起動、設定再読み込み、ランタイム検査は
パッケージマネージャーを実行したり、依存関係ツリーを修復したりしません。ローカル Plugin は
依存関係がすでにインストールされている必要があります。一方、npm、git、ClawHub Plugin は
OpenClaw の管理対象 Plugin ルート配下にインストールされます。npm 依存関係は
OpenClaw の管理対象 npm ルート内で巻き上げられる場合があります。インストール/更新は信頼前に
その管理対象ルートをスキャンし、アンインストールは npm 管理パッケージを npm 経由で削除します。外部 Plugin と
カスタム読み込みパスは、引き続き `openclaw plugins install` 経由でインストールする必要があります。
ランタイムコードをインポートしたり依存関係を修復したりせずに、表示可能な各
Plugin の静的な `dependencyStatus` を確認するには `openclaw plugins list --json` を使用します。
インストール時ライフサイクルについては
[Plugin 依存関係の解決](/ja-JP/plugins/dependency-resolution) を参照してください。

### ブロックされた Plugin パスの所有権

Plugin 診断に
`blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
と表示され、その後に設定検証で `plugin present but blocked` と表示される場合、OpenClaw は
読み込んでいるプロセスとは異なる Unix ユーザーが所有する Plugin ファイルを検出しました。
Plugin 設定はそのままにして、ファイルシステムの所有権を修正するか、
状態ディレクトリを所有する同じユーザーとして OpenClaw を実行してください。

Docker インストールでは、公式イメージは `node`（uid `1000`）として実行されるため、
ホスト側で bind mount された OpenClaw 設定ディレクトリとワークスペースディレクトリは、通常
uid `1000` が所有している必要があります。

```bash
sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
```

意図的に OpenClaw を root として実行する場合は、代わりに管理対象 Plugin ルートを
root 所有権に修復します。

```bash
sudo chown -R root:root /path/to/openclaw-config/npm
```

所有権を修正した後、永続化された Plugin レジストリが修復済みファイルと一致するように、
`openclaw doctor --fix` または
`openclaw plugins registry --refresh` を再実行します。

npm インストールでは、`latest` や dist-tag などの可変セレクターは
インストール前に解決され、その後 OpenClaw の管理対象 npm ルート内で正確に検証されたバージョンに固定されます。
npm の完了後、OpenClaw はインストールされた
`package-lock.json` エントリが解決済みバージョンおよび integrity とまだ一致していることを検証します。npm が
異なるパッケージメタデータを書き込んだ場合、別の Plugin アーティファクトを受け入れるのではなく、
インストールは失敗し、管理対象パッケージはロールバックされます。
管理対象 npm ルートは OpenClaw のパッケージレベル npm `overrides` も継承するため、
パッケージ化されたホストを保護するセキュリティピンは、巻き上げられた外部
Plugin 依存関係にも適用されます。

ソースチェックアウトは pnpm ワークスペースです。同梱 Plugin を変更するために OpenClaw をクローンする場合は、
`pnpm install` を実行してください。その後、OpenClaw は
`extensions/<id>` から同梱 Plugin を読み込むため、編集内容とパッケージローカルの依存関係が直接使用されます。
通常の npm ルートインストールは、パッケージ化された OpenClaw 向けであり、ソースチェックアウト
開発向けではありません。

## Plugin の種類

OpenClaw は 2 つの Plugin 形式を認識します。

| 形式       | 仕組み                                                             | 例                                                     |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + ランタイムモジュール。プロセス内で実行されます | 公式 Plugin、コミュニティ npm パッケージ               |
| **Bundle** | Codex/Claude/Cursor 互換レイアウト。OpenClaw 機能にマッピングされます | `.codex-plugin/`、`.claude-plugin/`、`.cursor-plugin/` |

どちらも `openclaw plugins list` に表示されます。Bundle の詳細は [Plugin Bundles](/ja-JP/plugins/bundles) を参照してください。

ネイティブ Plugin を作成する場合は、[Building Plugins](/ja-JP/plugins/building-plugins)
と [Plugin SDK Overview](/ja-JP/plugins/sdk-overview) から始めてください。

## パッケージエントリポイント

ネイティブ Plugin npm パッケージは、`package.json` で `openclaw.extensions` を宣言する必要があります。
各エントリはパッケージディレクトリ内に留まり、読み取り可能な
ランタイムファイル、または `src/index.ts` から `dist/index.js` のように推論されたビルド済み JavaScript
ピアを持つ TypeScript ソースファイルへ解決される必要があります。
パッケージ化されたインストールには、その JavaScript ランタイム出力を同梱する必要があります。TypeScript
ソースフォールバックは、ソースチェックアウトとローカル開発パス向けであり、
OpenClaw の管理対象 Plugin ルートにインストールされる
npm パッケージ向けではありません。

管理対象パッケージの警告で `requires compiled runtime output for
TypeScript entry ...` と表示される場合、そのパッケージは OpenClaw がランタイムで必要とする JavaScript ファイルなしで
公開されています。これは Plugin パッケージングの問題であり、ローカル設定の
問題ではありません。公開者がコンパイル済み
JavaScript を再公開した後に Plugin を更新または再インストールするか、修正済みパッケージが利用可能になるまで
その Plugin を無効化/アンインストールしてください。

公開済みランタイムファイルがソースエントリと同じパスに存在しない場合は、
`openclaw.runtimeExtensions` を使用します。存在する場合、`runtimeExtensions` には
すべての `extensions` エントリに対して正確に 1 つのエントリが含まれている必要があります。一致しないリストは、
ソースパスへ暗黙にフォールバックするのではなく、インストールと
Plugin 検出に失敗します。`openclaw.setupEntry` も公開する場合は、そのビルド済み
JavaScript ピアに `openclaw.runtimeSetupEntry` を使用します。宣言されている場合、そのファイルは必須です。

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
OpenClaw リリースにはすでに多くの公式 Plugin が同梱されているため、通常のセットアップでは
それらを個別に npm インストールする必要はありません。すべての OpenClaw 所有 Plugin が
ClawHub に移行するまで、OpenClaw は古い/カスタムインストールと直接 npm ワークフロー向けに、
一部の `@openclaw/*` Plugin パッケージを npm で引き続き提供します。

npm が `@openclaw/*` Plugin パッケージを deprecated と報告する場合、そのパッケージ
バージョンは古い外部パッケージ系列のものです。新しい npm パッケージが公開されるまでは、
現在の OpenClaw に同梱された Plugin またはローカルチェックアウトを使用してください。

| Plugin          | パッケージ                 | Docs                                       |
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

  <Accordion title="メモリ Plugin">
    - `memory-core` - バンドルされたメモリ検索（`plugins.slots.memory` によるデフォルト）
    - `memory-lancedb` - 自動リコール/キャプチャを備えた LanceDB バックエンドの長期メモリ（`plugins.slots.memory = "memory-lancedb"` を設定）

    OpenAI 互換の埋め込み設定、Ollama の例、リコール制限、トラブルシューティングについては、[Memory LanceDB](/ja-JP/plugins/memory-lancedb) を参照してください。

  </Accordion>

  <Accordion title="音声プロバイダー（デフォルトで有効）">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="その他">
    - `browser` - ブラウザツール、`openclaw browser` CLI、`browser.request` gateway メソッド、ブラウザランタイム、デフォルトのブラウザ制御サービス用のバンドル済みブラウザ Plugin（デフォルトで有効。置き換える前に無効化してください）
    - `copilot-proxy` - VS Code Copilot Proxy ブリッジ（デフォルトでは無効）

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

| フィールド         | 説明                                                      |
| ------------------ | --------------------------------------------------------- |
| `enabled`          | マスタートグル（デフォルト: `true`）                      |
| `allow`            | Plugin 許可リスト（任意）                                |
| `bundledDiscovery` | バンドル済み Plugin 検出モード（デフォルトは `allowlist`） |
| `deny`             | Plugin 拒否リスト（任意。拒否が優先）                    |
| `load.paths`       | 追加の Plugin ファイル/ディレクトリ                      |
| `slots`            | 排他的なスロットセレクター（例: `memory`, `contextEngine`） |
| `entries.\<id\>`   | Plugin ごとのトグル + 設定                               |

`plugins.allow` は排他的です。空でない場合、`tools.allow` に `"*"` や特定の Plugin 所有ツール名が含まれていても、リストされた Plugin だけが読み込まれるか、ツールを公開できます。ツール許可リストが Plugin ツールを参照する場合は、所有する Plugin id を `plugins.allow` に追加するか、`plugins.allow` を削除してください。`openclaw doctor` はこの形について警告します。

新しい設定では、`plugins.bundledDiscovery` のデフォルトは `"allowlist"` です。そのため、制限的な `plugins.allow` インベントリは、ランタイムの Web 検索プロバイダー検出を含め、省略されたバンドル済みプロバイダー Plugin もブロックします。Doctor は移行中に古い制限的な許可リスト設定へ `"compat"` を刻印し、オペレーターがより厳格なモードに明示的に切り替えるまで、アップグレード後もレガシーのバンドル済みプロバイダー動作を維持します。空の `plugins.allow` は引き続き未設定/オープンとして扱われます。

`/plugins enable` または `/plugins disable` を通じて行われた設定変更は、プロセス内の Gateway Plugin リロードをトリガーします。新しいエージェントターンは、更新された Plugin レジストリからツールリストを再構築します。インストール、更新、アンインストールなどのソース変更操作では、すでにインポートされた Plugin モジュールを安全にその場で置き換えられないため、引き続き Gateway プロセスを再起動します。

`openclaw plugins list` はローカルの Plugin レジストリ/設定スナップショットです。そこで `enabled` の Plugin は、永続化されたレジストリと現在の設定がその Plugin の参加を許可していることを意味します。すでに稼働中のリモート Gateway が、同じ Plugin コードへリロードまたは再起動済みであることは証明しません。ラッパープロセスを持つ VPS/コンテナ構成では、実際の `openclaw gateway run` プロセスへ再起動またはリロードをトリガーする書き込みを送るか、リロードが失敗を報告した場合は稼働中の Gateway に対して `openclaw gateway restart` を使用してください。

<Accordion title="Plugin の状態: 無効、欠落、無効">
  - **無効**: Plugin は存在するが、有効化ルールによってオフになっています。設定は保持されます。
  - **欠落**: 設定が、検出で見つからなかった Plugin id を参照しています。
  - **無効**: Plugin は存在するが、その設定が宣言されたスキーマと一致しません。Gateway 起動時はその Plugin だけをスキップします。`openclaw doctor --fix` は、その無効なエントリを無効化し、設定ペイロードを削除することで隔離できます。

</Accordion>

## 検出と優先順位

OpenClaw は次の順序で Plugin をスキャンします（最初の一致が優先）:

<Steps>
  <Step title="設定パス">
    `plugins.load.paths` - 明示的なファイルまたはディレクトリパス。OpenClaw 自身のパッケージ化されたバンドル済み Plugin ディレクトリを指し返すパスは無視されます。古いエイリアスを削除するには `openclaw doctor --fix` を実行してください。
  </Step>

  <Step title="ワークスペース Plugin">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` および `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`。
  </Step>

  <Step title="グローバル Plugin">
    `~/.openclaw/<plugin-root>/*.ts` および `~/.openclaw/<plugin-root>/*/index.ts`。
  </Step>

  <Step title="バンドル済み Plugin">
    OpenClaw に同梱されています。多くはデフォルトで有効です（モデルプロバイダー、音声）。その他は明示的な有効化が必要です。
  </Step>
</Steps>

パッケージ化されたインストールと Docker イメージは通常、コンパイル済みの `dist/extensions` ツリーからバンドル済み Plugin を解決します。バンドル済み Plugin のソースディレクトリが、対応するパッケージ化済みソースパス上にバインドマウントされている場合、たとえば `/app/extensions/synology-chat` の場合、OpenClaw はそのマウントされたソースディレクトリをバンドル済みソースオーバーレイとして扱い、パッケージ化された `/app/dist/extensions/synology-chat` バンドルより先に検出します。これにより、すべてのバンドル済み Plugin を TypeScript ソースへ戻さなくても、メンテナーのコンテナループが機能します。ソースオーバーレイマウントが存在する場合でもパッケージ化された dist バンドルを強制するには、`OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1` を設定してください。

### 有効化ルール

- `plugins.enabled: false` はすべての Plugin を無効化し、Plugin の検出/読み込み作業をスキップします
- `plugins.deny` は常に allow より優先されます
- `plugins.entries.\<id\>.enabled: false` はその Plugin を無効化します
- ワークスペース由来の Plugin は **デフォルトで無効** です（明示的に有効化する必要があります）
- バンドル済み Plugin は、上書きされない限り組み込みのデフォルトオンセットに従います
- 排他的スロットは、そのスロットで選択された Plugin を強制的に有効化できます
- 一部のバンドル済みオプトイン Plugin は、プロバイダーモデル参照、チャンネル設定、ハーネスランタイムなど、Plugin 所有のサーフェスを設定が指定した場合に自動的に有効化されます
- `plugins.enabled: false` が有効な間、古い Plugin 設定は保持されます。古い id を削除したい場合は、doctor cleanup を実行する前に Plugin を再度有効化してください
- OpenAI 系の Codex ルートは、別々の Plugin 境界を維持します。`openai-codex/*` は OpenAI Plugin に属し、バンドル済みの Codex app-server Plugin は `agentRuntime.id: "codex"` またはレガシーの `codex/*` モデル参照によって選択されます

## ランタイムフックのトラブルシューティング

Plugin が `plugins list` に表示されているのに、ライブチャットトラフィックで `register(api)` の副作用やフックが実行されない場合は、まず次を確認してください。

- `openclaw gateway status --deep --require-rpc` を実行し、アクティブな Gateway URL、プロファイル、設定パス、プロセスが編集対象のものか確認してください。
- Plugin のインストール/設定/コード変更後に、ライブ Gateway を再起動してください。ラッパーコンテナでは、PID 1 は単なるスーパーバイザーの場合があります。子の `openclaw gateway run` プロセスを再起動するか、シグナルを送ってください。
- フック登録と診断を確認するには、`openclaw plugins inspect <id> --runtime --json` を使用してください。`before_model_resolve`、`before_agent_reply`、`before_agent_run`、`llm_input`、`llm_output`、`before_agent_finalize`、`agent_end` などの非バンドル会話フックには、`plugins.entries.<id>.hooks.allowConversationAccess=true` が必要です。
- モデル切り替えには `before_model_resolve` を推奨します。これはエージェントターンのモデル解決前に実行されます。`llm_output` は、モデル試行がアシスタント出力を生成した後にのみ実行されます。
- 有効なセッションモデルの証明には、`openclaw sessions` または Gateway のセッション/ステータスサーフェスを使用し、プロバイダーペイロードをデバッグする場合は `--raw-stream --raw-stream-path <path>` を付けて Gateway を起動してください。

### 遅い Plugin ツールセットアップ

ツールの準備中にエージェントターンが停止しているように見える場合は、トレースログを有効化し、Plugin ツールファクトリのタイミング行を確認してください。

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

次を探してください。

```text
[trace:plugin-tools] factory timings ...
```

サマリーには、合計ファクトリ時間と最も遅い Plugin ツールファクトリが一覧表示されます。Plugin id、宣言されたツール名、結果の形、ツールが任意かどうかが含まれます。単一のファクトリが少なくとも 1 秒かかる場合、または Plugin ツールファクトリ準備の合計が少なくとも 5 秒かかる場合、遅い行は警告に昇格されます。

OpenClaw は、同じ有効リクエストコンテキストで繰り返し解決するために、成功した Plugin ツールファクトリ結果をキャッシュします。キャッシュキーには、有効なランタイム設定、ワークスペース、エージェント/セッション id、サンドボックスポリシー、ブラウザ設定、配信コンテキスト、リクエスター ID、所有権状態が含まれるため、これらの信頼済みフィールドに依存するファクトリは、コンテキストが変わると再実行されます。

1 つの Plugin がタイミングの大半を占める場合は、そのランタイム登録を調べてください。

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

その後、その Plugin を更新、再インストール、または無効化してください。Plugin 作者は、高コストな依存関係の読み込みをツールファクトリ内ではなく、ツール実行パスの背後へ移動する必要があります。

### チャンネルまたはツール所有権の重複

症状:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

これらは、複数の有効な Plugin が同じチャンネル、セットアップフロー、またはツール名を所有しようとしていることを意味します。最も一般的な原因は、同じチャンネル id を現在提供しているバンドル済み Plugin の横に、外部チャンネル Plugin がインストールされていることです。

デバッグ手順:

- `openclaw plugins list --enabled --verbose` を実行して、有効なすべての Plugin と出所を確認してください。
- 疑わしい各 Plugin に対して `openclaw plugins inspect <id> --runtime --json` を実行し、`channels`、`channelConfigs`、`tools`、診断を比較してください。
- Plugin パッケージをインストールまたは削除した後、`openclaw plugins registry --refresh` を実行して、永続化されたメタデータが現在のインストールを反映するようにしてください。
- インストール、レジストリ、設定の変更後に Gateway を再起動してください。

修正オプション:

- ある Plugin が同じチャンネル id で別の Plugin を意図的に置き換える場合、優先する Plugin は、低優先度の Plugin id とともに `channelConfigs.<channel-id>.preferOver` を宣言する必要があります。[/plugins/manifest#replacing-another-channel-plugin](/ja-JP/plugins/manifest#replacing-another-channel-plugin) を参照してください。
- 重複が偶発的な場合は、`plugins.entries.<plugin-id>.enabled: false` で片方を無効化するか、古い Plugin インストールを削除してください。
- 両方の Plugin を明示的に有効化した場合、OpenClaw はその要求を維持し、競合を報告します。チャンネルの所有者を 1 つ選ぶか、Plugin 所有ツールの名前を変更して、ランタイムサーフェスが曖昧にならないようにしてください。

## Plugin スロット（排他的カテゴリ）

一部のカテゴリは排他的です（一度にアクティブにできるのは 1 つだけ）:

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
| `memory`        | アクティブなメモリ Plugin | `memory-core`       |
| `contextEngine` | アクティブなコンテキストエンジン | `legacy` (built-in) |

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

バンドル Plugin は OpenClaw に同梱されています。多くはデフォルトで有効です（たとえば、バンドルされたモデルプロバイダー、バンドルされた音声プロバイダー、バンドルされたブラウザー Plugin）。その他のバンドル Plugin では、引き続き `openclaw plugins enable <id>` が必要です。

`--force` は、既存のインストール済み Plugin またはフックパックをその場で上書きします。追跡対象の npm Plugin の通常のアップグレードには `openclaw plugins update <id-or-npm-spec>` を使用してください。これは `--link` とは併用できません。`--link` は管理対象のインストール先にコピーする代わりに、ソースパスを再利用します。

`plugins.allow` がすでに設定されている場合、`openclaw plugins install` はインストール済みの Plugin ID を、有効化する前にその許可リストへ追加します。同じ Plugin ID が `plugins.deny` に存在する場合、インストールはその古い拒否エントリを削除するため、明示的にインストールした Plugin は再起動後すぐに読み込み可能になります。

OpenClaw は、Plugin インベントリ、コントリビューション所有権、起動計画のコールドリードモデルとして、永続化されたローカル Plugin レジストリを保持します。インストール、更新、アンインストール、有効化、無効化の各フローは、Plugin 状態を変更した後にそのレジストリを更新します。同じ `plugins/installs.json` ファイルは、耐久性のあるインストールメタデータをトップレベルの `installRecords` に、再構築可能なマニフェストメタデータを `plugins` に保持します。レジストリが存在しない、古い、または無効な場合、`openclaw plugins registry --refresh` は、Plugin ランタイムモジュールを読み込まずに、インストールレコード、設定ポリシー、マニフェスト/パッケージメタデータからマニフェストビューを再構築します。

Nix モード（`OPENCLAW_NIX_MODE=1`）では、Plugin ライフサイクルの変更操作は無効になります。代わりに、そのインストールの Nix ソースを通じて Plugin パッケージの選択と設定を管理してください。nix-openclaw では、エージェント優先の[クイックスタート](https://github.com/openclaw/nix-openclaw#quick-start)から始めます。
`openclaw plugins update <id-or-npm-spec>` は追跡対象のインストールに適用されます。dist-tag または正確なバージョンを含む npm パッケージ仕様を渡すと、パッケージ名が追跡対象の Plugin レコードへ解決され、今後の更新用に新しい仕様が記録されます。バージョンなしでパッケージ名を渡すと、正確に固定されたインストールがレジストリのデフォルトリリースラインへ戻されます。インストール済みの npm Plugin が、解決済みバージョンおよび記録済みアーティファクト ID とすでに一致している場合、OpenClaw はダウンロード、再インストール、設定の書き換えを行わずに更新をスキップします。
`openclaw update` がベータチャンネルで実行されると、デフォルトラインの npm および ClawHub Plugin レコードはまず `@beta` を試し、Plugin のベータリリースが存在しない場合は default/latest にフォールバックします。正確なバージョンと明示的なタグは固定されたままです。

`--pin` は npm 専用です。マーケットプレイスインストールは npm 仕様ではなくマーケットプレイスソースのメタデータを永続化するため、`--marketplace` とは併用できません。

`--dangerously-force-unsafe-install` は、組み込みの危険コードスキャナーの誤検知に対する緊急用オーバーライドです。これにより、組み込みの `critical` 検出を越えて Plugin インストールと Plugin 更新を続行できますが、Plugin の `before_install` ポリシーブロックやスキャン失敗によるブロックはバイパスしません。インストールスキャンは、パッケージ化されたテストモックでブロックされないように、`tests/`、`__tests__/`、`*.test.*`、`*.spec.*` などの一般的なテストファイルとディレクトリを無視します。ただし、宣言された Plugin ランタイムエントリポイントは、それらの名前のいずれかを使用していても引き続きスキャンされます。

この CLI フラグは、Plugin のインストール/更新フローにのみ適用されます。Gateway バックの Skills 依存関係インストールでは、代わりに対応する `dangerouslyForceUnsafeInstall` リクエストオーバーライドを使用します。一方、`openclaw skills install` は別個の ClawHub Skills ダウンロード/インストールフローのままです。

ClawHub で公開した Plugin がスキャンによって非表示またはブロックされている場合は、ClawHub ダッシュボードを開くか、`clawhub package rescan <name>` を実行して ClawHub に再確認を依頼してください。`--dangerously-force-unsafe-install` は自分のマシン上でのインストールにのみ影響します。ClawHub に Plugin の再スキャンを依頼したり、ブロックされたリリースを公開したりするものではありません。

互換バンドルは、同じ Plugin list/inspect/enable/disable フローに参加します。現在のランタイムサポートには、バンドル Skills、Claude コマンド Skills、Claude `settings.json` デフォルト、Claude `.lsp.json` とマニフェストで宣言された `lspServers` デフォルト、Cursor コマンド Skills、互換 Codex フックディレクトリが含まれます。

`openclaw plugins inspect <id>` は、検出されたバンドル機能に加えて、バンドルバックの Plugin に対するサポート対象または非サポートの MCP および LSP サーバーエントリも報告します。

マーケットプレイスソースには、`~/.claude/plugins/known_marketplaces.json` の Claude 既知マーケットプレイス名、ローカルマーケットプレイスルートまたは `marketplace.json` パス、`owner/repo` のような GitHub 省略表記、GitHub リポジトリ URL、または git URL を指定できます。リモートマーケットプレイスでは、Plugin エントリはクローンされたマーケットプレイスリポジトリ内に収まり、相対パスソースのみを使用する必要があります。

詳細は [`openclaw plugins` CLI リファレンス](/ja-JP/cli/plugins)を参照してください。

## Plugin API の概要

ネイティブ Plugin は、`register(api)` を公開するエントリオブジェクトをエクスポートします。古い Plugin では、レガシーエイリアスとして `activate(api)` をまだ使用している場合がありますが、新しい Plugin では `register` を使用してください。

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

OpenClaw は Plugin の有効化中にエントリオブジェクトを読み込み、`register(api)` を呼び出します。ローダーは古い Plugin 向けに引き続き `activate(api)` へフォールバックしますが、バンドル Plugin と新しい外部 Plugin は、`register` を公開コントラクトとして扱うべきです。

`api.registrationMode` は、エントリが読み込まれている理由を Plugin に伝えます。

| モード            | 意味                                                                                                                          |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | ランタイム有効化。ツール、フック、サービス、コマンド、ルート、その他のライブ副作用を登録します。                              |
| `discovery`     | 読み取り専用の機能検出。プロバイダーとメタデータを登録します。信頼済みの Plugin エントリコードは読み込まれることがありますが、ライブ副作用はスキップします。 |
| `setup-only`    | 軽量なセットアップエントリを通じたチャンネルセットアップメタデータの読み込み。                                                                |
| `setup-runtime` | ランタイムエントリも必要とするチャンネルセットアップの読み込み。                                                                         |
| `cli-metadata`  | CLI コマンドメタデータの収集のみ。                                                                                            |

ソケット、データベース、バックグラウンドワーカー、または長寿命クライアントを開く Plugin エントリは、それらの副作用を `api.registrationMode === "full"` でガードする必要があります。検出読み込みは、有効化読み込みとは別にキャッシュされ、実行中の Gateway レジストリを置き換えません。検出は非有効化ですが、インポート不要ではありません。OpenClaw はスナップショットを構築するために、信頼済みの Plugin エントリまたはチャンネル Plugin モジュールを評価する場合があります。モジュールのトップレベルは軽量で副作用のない状態に保ち、ネットワーククライアント、サブプロセス、リスナー、認証情報の読み取り、サービス起動はフルランタイムパスの背後へ移動してください。

一般的な登録メソッド:

| メソッド                                  | 登録するもの           |
| --------------------------------------- | --------------------------- |
| `registerProvider`                      | モデルプロバイダー（LLM）        |
| `registerChannel`                       | チャットチャンネル                |
| `registerTool`                          | エージェントツール                  |
| `registerHook` / `on(...)`              | ライフサイクルフック             |
| `registerSpeechProvider`                | テキスト読み上げ / STT        |
| `registerRealtimeTranscriptionProvider` | ストリーミング STT               |
| `registerRealtimeVoiceProvider`         | 双方向リアルタイム音声       |
| `registerMediaUnderstandingProvider`    | 画像/音声分析        |
| `registerImageGenerationProvider`       | 画像生成            |
| `registerMusicGenerationProvider`       | 音楽生成            |
| `registerVideoGenerationProvider`       | 動画生成            |
| `registerWebFetchProvider`              | Web フェッチ / スクレイププロバイダー |
| `registerWebSearchProvider`             | Web 検索                  |
| `registerHttpRoute`                     | HTTP エンドポイント               |
| `registerCommand` / `registerCli`       | CLI コマンド                |
| `registerContextEngine`                 | コンテキストエンジン              |
| `registerService`                       | バックグラウンドサービス          |

型付きライフサイクルフックのフックガード動作:

- `before_tool_call`: `{ block: true }` は終端です。優先度の低いハンドラーはスキップされます。
- `before_tool_call`: `{ block: false }` は no-op であり、以前のブロックを解除しません。
- `before_install`: `{ block: true }` は終端です。優先度の低いハンドラーはスキップされます。
- `before_install`: `{ block: false }` は no-op であり、以前のブロックを解除しません。
- `message_sending`: `{ cancel: true }` は終端です。優先度の低いハンドラーはスキップされます。
- `message_sending`: `{ cancel: false }` は no-op であり、以前のキャンセルを解除しません。

ネイティブ Codex app-server は、Codex ネイティブのツールイベントをこの
フックサーフェスへブリッジします。Plugin は `before_tool_call` を通じてネイティブ Codex ツールをブロックし、
`after_tool_call` を通じて結果を観測し、Codex
`PermissionRequest` の承認に参加できます。このブリッジは、Codex ネイティブのツール
引数をまだ書き換えません。正確な Codex ランタイム対応の境界は
[Codex harness v1 対応コントラクト](/ja-JP/plugins/codex-harness#v1-support-contract) にあります。

型付きフックの完全な挙動については、[SDK 概要](/ja-JP/plugins/sdk-overview#hook-decision-semantics) を参照してください。

## 関連

- [Plugin の構築](/ja-JP/plugins/building-plugins) - 独自の Plugin を作成する
- [Plugin バンドル](/ja-JP/plugins/bundles) - Codex/Claude/Cursor バンドル互換性
- [Plugin マニフェスト](/ja-JP/plugins/manifest) - マニフェストスキーマ
- [ツールの登録](/ja-JP/plugins/building-plugins#registering-agent-tools) - Plugin にエージェントツールを追加する
- [Plugin 内部](/ja-JP/plugins/architecture) - ケイパビリティモデルと読み込みパイプライン
- [コミュニティ Plugin](/ja-JP/plugins/community) - サードパーティの一覧
