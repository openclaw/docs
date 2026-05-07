---
read_when:
    - Plugin のインストールまたは設定
    - Plugin の検出と読み込みルールを理解する
    - Codex/Claude互換Pluginバンドルの扱い
sidebarTitle: Install and Configure
summary: OpenClaw Pluginをインストール、設定、管理する
title: Plugin
x-i18n:
    generated_at: "2026-05-07T01:54:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 91c476a2e3d7078ac3af22767a22afec685a25707b9aebf36e1ed7b3fdc87961
    source_path: tools/plugin.md
    workflow: 16
---

Pluginは、チャンネル、モデルプロバイダー、
エージェントハーネス、ツール、Skills、音声、リアルタイム文字起こし、リアルタイム
音声、メディア理解、画像生成、動画生成、Web取得、Web
検索などの新しい機能でOpenClawを拡張します。一部のPluginは**コア**（OpenClawに同梱）で、その他は
**外部**です。ほとんどの外部Pluginは
[ClawHub](/ja-JP/tools/clawhub)を通じて公開、検出されます。Npmは、直接インストールと、その移行が完了するまでの
一時的なOpenClaw所有Pluginパッケージ群向けに引き続きサポートされています。

## クイックスタート

コピー＆ペーストできるインストール、一覧表示、アンインストール、更新、公開の例については、
[Pluginを管理する](/ja-JP/plugins/manage-plugins)を参照してください。

<Steps>
  <Step title="See what is loaded">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="Install a plugin">
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

  <Step title="Restart the Gateway">
    ```bash
    openclaw gateway restart
    ```

    その後、設定ファイル内の`plugins.entries.\<id\>.config`で設定します。

  </Step>

  <Step title="Chat-native management">
    実行中のGatewayでは、所有者専用の`/plugins enable`と`/plugins disable`が
    Gateway設定リローダーを起動します。GatewayはPluginのランタイム
    サーフェスをプロセス内で再読み込みし、新しいエージェントターンは更新された
    レジストリからツール一覧を再構築します。`/plugins install`はPluginのソースコードを変更するため、
    Gatewayは、現在のプロセスがすでにインポート済みのモジュールを
    安全に再読み込みできるふりをするのではなく、再起動を要求します。

  </Step>

  <Step title="Verify the plugin">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json

    # If the plugin registered a CLI root, run one command from that root.
    openclaw <plugin-command> --help
    ```

    登録済みのツール、サービス、gateway
    メソッド、フック、またはPlugin所有のCLIコマンドを証明する必要がある場合は`--runtime`を使用します。通常の`inspect`はコールドな
    マニフェスト/レジストリ確認であり、意図的にPluginランタイムのインポートを避けます。

  </Step>
</Steps>

チャットネイティブの制御を好む場合は、`commands.plugins: true`を有効にして次を使用します。

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

インストールパスはCLIと同じリゾルバーを使用します: ローカルパス/アーカイブ、明示的な
`clawhub:<pkg>`、明示的な`npm:<pkg>`、明示的な`npm-pack:<path.tgz>`、
明示的な`git:<repo>`、またはnpm経由のベアパッケージ指定です。

設定が無効な場合、インストールは通常フェイルクローズし、
`openclaw doctor --fix`を案内します。唯一の復旧例外は、
`openclaw.install.allowInvalidConfigRecovery`にオプトインしているPlugin向けの狭い同梱Plugin
再インストールパスです。
Gateway起動時には、無効なPlugin設定は他の無効な
設定と同じようにフェイルクローズします。`openclaw doctor --fix`を実行すると、そのPluginエントリを
無効化し、無効な設定ペイロードを削除することで、不正なPlugin設定を隔離できます。通常の
設定バックアップにより以前の値は保持されます。
チャンネル設定が、もはや検出できないPluginを参照している一方で、同じ
古いPlugin IDがPlugin設定またはインストール記録に残っている場合、Gateway起動は
警告をログに記録し、他のすべてのチャンネルをブロックするのではなくそのチャンネルをスキップします。
`openclaw doctor --fix`を実行すると、古いチャンネル/Pluginエントリを削除できます。不明な
チャンネルキーで古いPluginの証拠がないものは引き続き検証に失敗するため、入力ミスは
見えるままになります。
`plugins.enabled: false`が設定されている場合、古いPlugin参照は不活性として扱われます:
Gateway起動はPluginの検出/読み込み作業をスキップし、`openclaw doctor`は
無効化されたPlugin設定を自動削除せず保持します。古いPlugin IDを削除したい場合は、
doctorクリーンアップを実行する前にPluginを再度有効化してください。

Plugin依存関係のインストールは、明示的なインストール/更新または
doctor修復フローの間にのみ行われます。Gateway起動、設定の再読み込み、ランタイム検査は
パッケージマネージャーを実行せず、依存関係ツリーも修復しません。ローカルPluginは依存関係がすでに
インストールされている必要があり、npm、git、ClawHubのPluginは
OpenClawの管理対象Pluginルート配下にインストールされます。npm依存関係は
OpenClawの管理対象npmルート内でhoistされる場合があります。インストール/更新は信頼前にその管理対象ルートをスキャンし、
アンインストールはnpm管理のパッケージをnpm経由で削除します。外部Plugin
とカスタムロードパスも、引き続き`openclaw plugins install`経由でインストールする必要があります。
ランタイムコードをインポートしたり依存関係を修復したりせずに、表示可能な各
Pluginの静的な`dependencyStatus`を確認するには`openclaw plugins list --json`を使用します。
インストール時のライフサイクルについては
[Plugin依存関係の解決](/ja-JP/plugins/dependency-resolution)を参照してください。

### ブロックされたPluginパスの所有権

Plugin診断で
`blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
と表示され、その後の設定検証で`plugin present but blocked`が表示される場合、OpenClawは
Pluginファイルが、それらを読み込んでいるプロセスとは異なるUnixユーザーに所有されていることを検出しています。
Plugin設定はそのままにし、ファイルシステムの所有権を修正するか、
状態ディレクトリを所有しているユーザーと同じユーザーでOpenClawを実行してください。

Dockerインストールでは、公式イメージは`node`（uid `1000`）として実行されるため、
ホスト側でバインドマウントされるOpenClaw設定ディレクトリとワークスペースディレクトリは、通常
uid `1000`が所有している必要があります。

```bash
sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
```

意図的にOpenClawをrootとして実行する場合は、代わりに管理対象Pluginルートを
root所有に修復してください。

```bash
sudo chown -R root:root /path/to/openclaw-config/npm
```

所有権を修正したら、`openclaw doctor --fix`または
`openclaw plugins registry --refresh`を再実行して、永続化されたPluginレジストリを
修復済みファイルに一致させます。

npmインストールでは、`latest`やdist-tagなどの可変セレクターは
インストール前に解決され、その後OpenClawの
管理対象npmルート内で検証済みの正確なバージョンにピン留めされます。npmが完了した後、OpenClawはインストール済みの
`package-lock.json`エントリが解決済みバージョンとintegrityにまだ一致していることを検証します。npmが
異なるパッケージメタデータを書き込んだ場合、異なるPluginアーティファクトを受け入れるのではなく、
インストールは失敗し、管理対象パッケージはロールバックされます。
管理対象npmルートはOpenClawのパッケージレベルnpm `overrides`も継承するため、
パッケージ化されたホストを保護するセキュリティピンは、hoistされた外部
Plugin依存関係にも適用されます。

ソースチェックアウトはpnpmワークスペースです。同梱Pluginを変更するためにOpenClawをクローンした場合は、
`pnpm install`を実行してください。その後OpenClawは
`extensions/<id>`から同梱Pluginを読み込むため、編集内容とパッケージローカル依存関係が直接使用されます。
通常のnpmルートインストールはパッケージ化されたOpenClaw向けであり、ソースチェックアウト
開発向けではありません。

## Pluginの種類

OpenClawは2つのPlugin形式を認識します。

| 形式     | 仕組み                                                       | 例                                               |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + ランタイムモジュール。プロセス内で実行       | 公式Plugin、コミュニティnpmパッケージ               |
| **Bundle** | Codex/Claude/Cursor互換レイアウト。OpenClaw機能にマッピング | `.codex-plugin/`、`.claude-plugin/`、`.cursor-plugin/` |

どちらも`openclaw plugins list`に表示されます。バンドルの詳細については[Plugin Bundles](/ja-JP/plugins/bundles)を参照してください。

ネイティブPluginを書く場合は、[Pluginの構築](/ja-JP/plugins/building-plugins)
と[Plugin SDK概要](/ja-JP/plugins/sdk-overview)から始めてください。

## パッケージエントリポイント

ネイティブPluginのnpmパッケージは、`package.json`で`openclaw.extensions`を宣言する必要があります。
各エントリはパッケージディレクトリ内にとどまり、読み取り可能な
ランタイムファイル、または`src/index.ts`から`dist/index.js`のような推論されたビルド済みJavaScript
peerを持つTypeScriptソースファイルに解決される必要があります。
パッケージ化されたインストールには、そのJavaScriptランタイム出力が含まれている必要があります。TypeScript
ソースフォールバックはソースチェックアウトとローカル開発パス向けであり、
OpenClawの管理対象Pluginルートにインストールされたnpmパッケージ向けではありません。

管理対象パッケージの警告で、`requires compiled runtime output for
TypeScript entry ...`と表示される場合、そのパッケージはOpenClawがランタイムに必要とするJavaScriptファイルなしで
公開されています。これはPluginのパッケージング問題であり、ローカル設定
の問題ではありません。公開者がコンパイル済み
JavaScriptを再公開した後でPluginを更新または再インストールするか、修正版パッケージが利用可能になるまでそのPluginを無効化/アンインストールしてください。

公開済みランタイムファイルがソースエントリと同じパスに存在しない場合は、`openclaw.runtimeExtensions`を使用します。
存在する場合、`runtimeExtensions`には
すべての`extensions`エントリに対して正確に1つのエントリが含まれている必要があります。一致しないリストは、黙ってソースパスにフォールバックするのではなく、インストールと
Plugin検出を失敗させます。`openclaw.setupEntry`も
公開する場合は、そのビルド済みJavaScript peerに`openclaw.runtimeSetupEntry`を使用してください。そのファイルは宣言されている場合に必須です。

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

ClawHubはほとんどのPluginの主要な配布パスです。現在のパッケージ化された
OpenClawリリースにはすでに多くの公式Pluginが同梱されているため、通常のセットアップではそれらを
別途npmインストールする必要はありません。すべてのOpenClaw所有Pluginが
ClawHubへ移行するまで、OpenClawは古い/カスタムインストールと直接npmワークフロー向けに、一部の`@openclaw/*` Pluginパッケージをnpmで引き続き提供します。

npmが`@openclaw/*` Pluginパッケージを非推奨として報告する場合、そのパッケージ
バージョンは古い外部パッケージ系列のものです。新しいnpmパッケージが公開されるまで、
現在のOpenClawに同梱されているPlugin、またはローカルチェックアウトを使用してください。

| Plugin          | パッケージ                    | ドキュメント                                       |
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

### コア（OpenClawに同梱）

<AccordionGroup>
  <Accordion title="Model providers (enabled by default)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="メモリPlugin">
    - `memory-core` - バンドルされたメモリ検索（`plugins.slots.memory` によりデフォルト）
    - `memory-lancedb` - 自動リコール/キャプチャを備えた LanceDB ベースの長期メモリ（`plugins.slots.memory = "memory-lancedb"` を設定）

    OpenAI 互換の埋め込み設定、Ollama の例、リコール制限、トラブルシューティングについては、[Memory LanceDB](/ja-JP/plugins/memory-lancedb) を参照してください。

  </Accordion>

  <Accordion title="音声プロバイダー（デフォルトで有効）">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="その他">
    - `browser` - ブラウザーツール、`openclaw browser` CLI、`browser.request` Gateway メソッド、ブラウザーランタイム、デフォルトのブラウザー制御サービス向けのバンドル済みブラウザーPlugin（デフォルトで有効。置き換える前に無効化してください）
    - `copilot-proxy` - VS Code Copilot Proxy ブリッジ（デフォルトでは無効）

  </Accordion>
</AccordionGroup>

サードパーティPluginを探していますか？[Community Plugins](/ja-JP/plugins/community) を参照してください。

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
| `allow`            | Plugin許可リスト（任意）                                 |
| `bundledDiscovery` | バンドルPlugin検出モード（デフォルトは `allowlist`）      |
| `deny`             | Plugin拒否リスト（任意。拒否が優先）                     |
| `load.paths`       | 追加のPluginファイル/ディレクトリ                        |
| `slots`            | 排他的なスロットセレクター（例: `memory`, `contextEngine`） |
| `entries.\<id\>`   | Pluginごとのトグル + 設定                                |

`plugins.allow` は排他的です。空でない場合、`tools.allow` に `"*"` または特定のPlugin所有ツール名が含まれていても、一覧にあるPluginだけが読み込まれるかツールを公開できます。ツール許可リストがPluginツールを参照する場合は、所有するPlugin IDを `plugins.allow` に追加するか、`plugins.allow` を削除してください。この形については `openclaw doctor` が警告します。

`plugins.bundledDiscovery` は新しい設定ではデフォルトで `"allowlist"` になるため、制限的な `plugins.allow` インベントリは、ランタイムのウェブ検索プロバイダー検出を含め、省略されたバンドルプロバイダーPluginもブロックします。doctor は移行中、古い制限的な許可リスト設定に `"compat"` を記録し、オペレーターがより厳格なモードを選択するまで、アップグレード後も従来のバンドルプロバイダー動作を維持します。空の `plugins.allow` は引き続き未設定/オープンとして扱われます。

`/plugins enable` または `/plugins disable` による設定変更は、プロセス内の Gateway Plugin リロードをトリガーします。新しいエージェントターンでは、更新されたPluginレジストリからツール一覧が再構築されます。インストール、更新、アンインストールなどソースを変更する操作では、すでにインポートされたPluginモジュールをその場で安全に置き換えられないため、Gateway プロセスは引き続き再起動されます。

`openclaw plugins list` はローカルのPluginレジストリ/設定スナップショットです。そこにある `enabled` Pluginは、永続化されたレジストリと現在の設定により、そのPluginの参加が許可されていることを意味します。すでに実行中のリモート Gateway が同じPluginコードへリロードまたは再起動済みであることを証明するものではありません。ラッパープロセスを使う VPS/コンテナー環境では、実際の `openclaw gateway run` プロセスへ再起動またはリロードをトリガーする書き込みを送るか、リロードが失敗を報告した場合は実行中の Gateway に対して `openclaw gateway restart` を使用してください。

<Accordion title="Plugin状態: 無効、欠落、無効">
  - **無効**: Pluginは存在しますが、有効化ルールによってオフになっています。設定は保持されます。
  - **欠落**: 設定が、検出で見つからなかったPlugin IDを参照しています。
  - **無効**: Pluginは存在しますが、その設定が宣言されたスキーマと一致しません。Gateway 起動時はそのPluginだけをスキップします。`openclaw doctor --fix` は、その無効なエントリを無効化し、設定ペイロードを削除することで隔離できます。

</Accordion>

## 検出と優先順位

OpenClaw は次の順序でPluginをスキャンします（最初に一致したものが優先）:

<Steps>
  <Step title="設定パス">
    `plugins.load.paths` - 明示的なファイルまたはディレクトリパス。OpenClaw 自身のパッケージ済みバンドルPluginディレクトリを指すパスは無視されます。古いエイリアスを削除するには `openclaw doctor --fix` を実行してください。
  </Step>

  <Step title="ワークスペースPlugin">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` と `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`。
  </Step>

  <Step title="グローバルPlugin">
    `~/.openclaw/<plugin-root>/*.ts` と `~/.openclaw/<plugin-root>/*/index.ts`。
  </Step>

  <Step title="バンドルPlugin">
    OpenClaw に同梱されています。多くはデフォルトで有効です（モデルプロバイダー、音声）。
    その他は明示的な有効化が必要です。
  </Step>
</Steps>

パッケージインストールと Docker イメージでは通常、コンパイル済みの `dist/extensions` ツリーからバンドルPluginを解決します。バンドルPluginのソースディレクトリが、対応するパッケージ済みソースパスにバインドマウントされている場合、たとえば `/app/extensions/synology-chat` のような場合、OpenClaw はそのマウントされたソースディレクトリをバンドルソースオーバーレイとして扱い、パッケージ済みの `/app/dist/extensions/synology-chat` バンドルより前に検出します。これにより、すべてのバンドルPluginを TypeScript ソースへ戻さなくても、メンテナーのコンテナーループが動作し続けます。ソースオーバーレイマウントが存在する場合でもパッケージ済み dist バンドルを強制するには、`OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1` を設定してください。

### 有効化ルール

- `plugins.enabled: false` はすべてのPluginを無効化し、Pluginの検出/読み込み作業をスキップします
- `plugins.deny` は常に許可より優先されます
- `plugins.entries.\<id\>.enabled: false` はそのPluginを無効化します
- ワークスペース由来のPluginは**デフォルトで無効**です（明示的に有効化する必要があります）
- バンドルPluginは、上書きされない限り組み込みのデフォルト有効セットに従います
- 排他的スロットは、そのスロットに選択されたPluginを強制的に有効化できます
- 一部のバンドルされたオプトインPluginは、設定がプロバイダーモデル参照、チャンネル設定、ハーネスランタイムなどのPlugin所有サーフェスを指定した場合、自動的に有効化されます
- `plugins.enabled: false` が有効な間、古いPlugin設定は保持されます。古い ID を削除したい場合は、doctor クリーンアップを実行する前にPluginを再有効化してください
- OpenAI 系 Codex ルートは、個別のPlugin境界を維持します:
  `openai-codex/*` は OpenAI Pluginに属し、バンドルされた Codex アプリサーバーPluginは `agentRuntime.id: "codex"` または従来の `codex/*` モデル参照によって選択されます

## ランタイムフックのトラブルシューティング

Pluginが `plugins list` に表示されているのに、ライブチャットトラフィックで `register(api)` の副作用またはフックが実行されない場合は、まず次を確認してください:

- `openclaw gateway status --deep --require-rpc` を実行し、アクティブな Gateway URL、プロファイル、設定パス、プロセスが編集対象と同じであることを確認します。
- Pluginのインストール/設定/コード変更後にライブ Gateway を再起動します。ラッパーコンテナーでは、PID 1 は単なるスーパーバイザーである場合があります。子の `openclaw gateway run` プロセスを再起動するかシグナルを送ってください。
- フック登録と診断を確認するには、`openclaw plugins inspect <id> --runtime --json` を使用します。`before_model_resolve`、`before_agent_reply`、`before_agent_run`、`llm_input`、`llm_output`、`before_agent_finalize`、`agent_end` などの非バンドル会話フックには、`plugins.entries.<id>.hooks.allowConversationAccess=true` が必要です。
- モデル切り替えには `before_model_resolve` を優先してください。これはエージェントターンのモデル解決前に実行されます。`llm_output` はモデル試行がアシスタント出力を生成した後にのみ実行されます。
- 有効なセッションモデルの証明には、`openclaw sessions` または Gateway のセッション/ステータスサーフェスを使用します。プロバイダーペイロードをデバッグする場合は、`--raw-stream --raw-stream-path <path>` 付きで Gateway を起動してください。

### 遅いPluginツール設定

エージェントターンがツール準備中に停止しているように見える場合は、トレースログを有効化し、Pluginツールファクトリーのタイミング行を確認してください:

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

次を探します:

```text
[trace:plugin-tools] factory timings ...
```

概要には、合計ファクトリー時間と最も遅いPluginツールファクトリーが表示されます。Plugin ID、宣言されたツール名、結果形状、そのツールが任意かどうかが含まれます。単一のファクトリーに少なくとも 1 秒かかる場合、または合計Pluginツールファクトリー準備に少なくとも 5 秒かかる場合、遅い行は警告に昇格されます。

OpenClaw は、同じ有効リクエストコンテキストでの繰り返し解決に対して、成功したPluginツールファクトリー結果をキャッシュします。キャッシュキーには、有効なランタイム設定、ワークスペース、エージェント/セッション ID、サンドボックスポリシー、ブラウザー設定、配信コンテキスト、リクエスター ID、所有状態が含まれるため、これらの信頼済みフィールドに依存するファクトリーは、コンテキストが変わると再実行されます。

1 つのPluginがタイミングを支配している場合は、そのランタイム登録を調べます:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

その後、そのPluginを更新、再インストール、または無効化してください。Plugin作者は、高コストな依存関係の読み込みをツールファクトリー内で行うのではなく、ツール実行パスの背後へ移動する必要があります。

### チャンネルまたはツール所有権の重複

症状:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

これは、有効化された複数のPluginが同じチャンネル、セットアップフロー、またはツール名を所有しようとしていることを意味します。最も一般的な原因は、現在同じチャンネル ID を提供しているバンドルPluginの横に、外部チャンネルPluginがインストールされていることです。

デバッグ手順:

- 有効なすべてのPluginとその由来を確認するには、`openclaw plugins list --enabled --verbose` を実行します。
- 疑わしい各Pluginについて `openclaw plugins inspect <id> --runtime --json` を実行し、`channels`、`channelConfigs`、`tools`、診断を比較します。
- Pluginパッケージのインストールまたは削除後は、永続化メタデータが現在のインストールを反映するように、`openclaw plugins registry --refresh` を実行します。
- インストール、レジストリ、設定の変更後は Gateway を再起動します。

修正オプション:

- 1 つのPluginが同じチャンネル ID について別のPluginを意図的に置き換える場合、優先されるPluginは、優先度の低いPlugin ID を指定して `channelConfigs.<channel-id>.preferOver` を宣言する必要があります。[/plugins/manifest#replacing-another-channel-plugin](/ja-JP/plugins/manifest#replacing-another-channel-plugin) を参照してください。
- 重複が意図しないものなら、`plugins.entries.<plugin-id>.enabled: false` で片方を無効化するか、古いPluginインストールを削除してください。
- 両方のPluginを明示的に有効化した場合、OpenClaw はその要求を維持し、競合を報告します。チャンネルの所有者を 1 つ選ぶか、Plugin所有ツールの名前を変更して、ランタイムサーフェスが曖昧にならないようにしてください。

## Pluginスロット（排他的カテゴリ）

一部のカテゴリは排他的です（一度にアクティブなのは 1 つだけ）:

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
| `memory`        | アクティブなメモリPlugin | `memory-core`       |
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

同梱 Plugin は OpenClaw と一緒に提供されます。多くはデフォルトで有効化されています（たとえば、同梱モデルプロバイダー、同梱音声プロバイダー、同梱ブラウザー Plugin）。その他の同梱 Plugin は引き続き `openclaw plugins enable <id>` が必要です。

`--force` は既存のインストール済み Plugin またはフックパックをその場で上書きします。追跡対象の npm Plugin の通常のアップグレードには `openclaw plugins update <id-or-npm-spec>` を使用してください。これは、管理対象のインストール先にコピーせずソースパスを再利用する `--link` とは併用できません。

`plugins.allow` がすでに設定されている場合、`openclaw plugins install` は有効化する前に、インストールされた Plugin id をその許可リストに追加します。同じ Plugin id が `plugins.deny` に存在する場合、明示的なインストールが再起動後すぐに読み込み可能になるように、インストールはその古い拒否エントリを削除します。

OpenClaw は、Plugin インベントリ、コントリビューション所有権、起動計画のコールドリードモデルとして、永続化されたローカル Plugin レジストリを保持します。インストール、更新、アンインストール、有効化、無効化のフローは、Plugin 状態を変更した後にそのレジストリを更新します。同じ `plugins/installs.json` ファイルは、永続的なインストールメタデータをトップレベルの `installRecords` に、再構築可能なマニフェストメタデータを `plugins` に保持します。レジストリが欠落している、古い、または無効な場合、`openclaw plugins registry --refresh` は Plugin ランタイムモジュールを読み込まずに、インストールレコード、設定ポリシー、マニフェスト/パッケージメタデータからそのマニフェストビューを再構築します。

Nix モード（`OPENCLAW_NIX_MODE=1`）では、Plugin ライフサイクルの変更操作は無効化されます。代わりに、そのインストール用の Nix ソースを通じて Plugin パッケージ選択と設定を管理してください。nix-openclaw では、エージェント優先の[クイックスタート](https://github.com/openclaw/nix-openclaw#quick-start)から始めてください。`openclaw plugins update <id-or-npm-spec>` は追跡対象のインストールに適用されます。dist-tag または正確なバージョンを含む npm パッケージ spec を渡すと、パッケージ名が追跡対象の Plugin レコードへ解決され、今後の更新用に新しい spec が記録されます。バージョンなしでパッケージ名を渡すと、正確にピン留めされたインストールがレジストリのデフォルトリリースラインに戻ります。インストール済みの npm Plugin が、解決されたバージョンおよび記録済みアーティファクト ID とすでに一致している場合、OpenClaw はダウンロード、再インストール、設定の書き換えを行わずに更新をスキップします。
`openclaw update` がベータチャンネルで実行される場合、デフォルトラインの npm および ClawHub Plugin レコードはまず `@beta` を試し、Plugin のベータリリースが存在しない場合は default/latest にフォールバックします。正確なバージョンと明示的なタグはピン留めされたままです。

OpenClaw は、LTS または月次サポートの Plugin チャンネルをまだ公開していません。計画中の月次サポートライン作業では、Plugin npm と ClawHub のタグが、暗黙に `latest` を使用するのではなく、コアパッケージと同じサポートラインに従う必要があります。

`--pin` は npm 専用です。`--marketplace` とは併用できません。マーケットプレイスのインストールは npm spec ではなく、マーケットプレイスソースのメタデータを永続化するためです。

`--dangerously-force-unsafe-install` は、組み込みの危険コードスキャナーによる誤検知のための非常用オーバーライドです。これにより、組み込みの `critical` 検出結果があっても Plugin のインストールと Plugin の更新を続行できますが、Plugin の `before_install` ポリシーブロックやスキャン失敗によるブロックは引き続きバイパスしません。インストールスキャンは、パッケージ化されたテストモックをブロックしないように、`tests/`、`__tests__/`、`*.test.*`、`*.spec.*` などの一般的なテストファイルとディレクトリを無視します。ただし、宣言された Plugin ランタイムエントリポイントは、それらの名前のいずれかを使用していても引き続きスキャンされます。

この CLI フラグは、Plugin のインストール/更新フローにのみ適用されます。Gateway 経由の Skill 依存関係インストールでは、代わりに対応する `dangerouslyForceUnsafeInstall` リクエストオーバーライドを使用します。一方、`openclaw skills install` は別個の ClawHub Skill ダウンロード/インストールフローのままです。

ClawHub に公開した Plugin がスキャンによって非表示またはブロックされている場合は、ClawHub ダッシュボードを開くか、`clawhub package rescan <name>` を実行して、ClawHub に再チェックを依頼してください。`--dangerously-force-unsafe-install` は自分のマシン上のインストールにのみ影響します。ClawHub に Plugin の再スキャンを依頼したり、ブロックされたリリースを公開したりするものではありません。

互換バンドルは、同じ Plugin の list/inspect/enable/disable フローに参加します。現在のランタイムサポートには、バンドル Skills、Claude command-skills、Claude `settings.json` デフォルト、Claude `.lsp.json` とマニフェスト宣言の `lspServers` デフォルト、Cursor command-skills、互換 Codex フックディレクトリが含まれます。

`openclaw plugins inspect <id>` は、検出されたバンドル機能に加え、バンドルに裏付けられた Plugin のサポート対象または非サポートの MCP と LSP サーバーエントリも報告します。

マーケットプレイスソースには、`~/.claude/plugins/known_marketplaces.json` にある Claude の既知マーケットプレイス名、ローカルマーケットプレイスルートまたは `marketplace.json` パス、`owner/repo` のような GitHub 省略形、GitHub リポジトリ URL、または git URL を使用できます。リモートマーケットプレイスでは、Plugin エントリはクローンされたマーケットプレイスリポジトリ内に留まり、相対パスソースのみを使用する必要があります。

詳細は [`openclaw plugins` CLI リファレンス](/ja-JP/cli/plugins) を参照してください。

## Plugin API の概要

ネイティブ Plugin は、`register(api)` を公開するエントリオブジェクトをエクスポートします。古い Plugin はレガシーエイリアスとして引き続き `activate(api)` を使用する場合がありますが、新しい Plugin は `register` を使用するべきです。

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

OpenClaw は Plugin の有効化中にエントリオブジェクトを読み込み、`register(api)` を呼び出します。ローダーは古い Plugin 向けに引き続き `activate(api)` へフォールバックしますが、同梱 Plugin と新しい外部 Plugin は `register` を公開契約として扱うべきです。

`api.registrationMode` は、なぜそのエントリが読み込まれているのかを Plugin に伝えます。

| モード | 意味 |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full` | ランタイム有効化。ツール、フック、サービス、コマンド、ルート、その他のライブ副作用を登録します。 |
| `discovery` | 読み取り専用の機能検出。プロバイダーとメタデータを登録します。信頼済み Plugin エントリコードは読み込まれる場合がありますが、ライブ副作用はスキップします。 |
| `setup-only` | 軽量なセットアップエントリを通じたチャンネルセットアップメタデータの読み込み。 |
| `setup-runtime` | ランタイムエントリも必要とするチャンネルセットアップの読み込み。 |
| `cli-metadata` | CLI コマンドメタデータの収集のみ。 |

ソケット、データベース、バックグラウンドワーカー、または長寿命クライアントを開く Plugin エントリは、それらの副作用を `api.registrationMode === "full"` で保護するべきです。検出ロードは有効化ロードとは別にキャッシュされ、実行中の Gateway レジストリを置き換えません。検出は有効化を伴いませんが、インポート不要ではありません。OpenClaw はスナップショットを構築するために、信頼済み Plugin エントリまたはチャンネル Plugin モジュールを評価する場合があります。モジュールのトップレベルは軽量かつ副作用なしに保ち、ネットワーククライアント、サブプロセス、リスナー、認証情報の読み取り、サービス起動はフルランタイムパスの背後に移動してください。

一般的な登録メソッド:

| メソッド | 登録するもの |
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
| `registerWebFetchProvider` | Web 取得 / スクレイピングプロバイダー |
| `registerWebSearchProvider` | Web 検索 |
| `registerHttpRoute` | HTTP エンドポイント |
| `registerCommand` / `registerCli` | CLI コマンド |
| `registerContextEngine` | コンテキストエンジン |
| `registerService` | バックグラウンドサービス |

型付きライフサイクルフックのフックガード動作:

- `before_tool_call`: `{ block: true }` は終端です。優先度の低いハンドラーはスキップされます。
- `before_tool_call`: `{ block: false }` は何もせず、以前のブロックを解除しません。
- `before_install`: `{ block: true }` は終端です。優先度の低いハンドラーはスキップされます。
- `before_install`: `{ block: false }` は何もせず、以前のブロックを解除しません。
- `message_sending`: `{ cancel: true }` は終端です。優先度の低いハンドラーはスキップされます。
- `message_sending`: `{ cancel: false }` は何もせず、以前のキャンセルを解除しません。

Native Codex app-server は、Codex ネイティブのツールイベントをこのフックサーフェスへブリッジします。Plugin は `before_tool_call` を通じてネイティブ Codex ツールをブロックし、`after_tool_call` を通じて結果を観察し、Codex `PermissionRequest` の承認に参加できます。このブリッジはまだ Codex ネイティブのツール引数を書き換えません。正確な Codex ランタイムサポートの境界は、[Codex harness v1 サポート契約](/ja-JP/plugins/codex-harness#v1-support-contract) にあります。

完全な型付きフックの動作については、[SDK 概要](/ja-JP/plugins/sdk-overview#hook-decision-semantics) を参照してください。

## 関連

- [Plugin の構築](/ja-JP/plugins/building-plugins) - 独自の plugin を作成する
- [Plugin バンドル](/ja-JP/plugins/bundles) - Codex/Claude/Cursor バンドル互換性
- [Plugin マニフェスト](/ja-JP/plugins/manifest) - マニフェストスキーマ
- [ツールの登録](/ja-JP/plugins/building-plugins#registering-agent-tools) - plugin にエージェントツールを追加する
- [Plugin 内部構造](/ja-JP/plugins/architecture) - ケイパビリティモデルとロードパイプライン
- [コミュニティ plugin](/ja-JP/plugins/community) - サードパーティ一覧
