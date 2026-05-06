---
read_when:
    - Plugin のインストールまたは設定
    - Plugin の検出と読み込みルールを理解する
    - Codex/Claude 互換のPlugin バンドルを扱う
sidebarTitle: Install and Configure
summary: OpenClaw プラグインをインストール、構成、管理する
title: Plugin
x-i18n:
    generated_at: "2026-05-06T05:22:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 118c856507965f496d87edc1fef8cb67d36c7ef62acc84d5ad130ffd3a3f5568
    source_path: tools/plugin.md
    workflow: 16
---

PluginはOpenClawに新しい機能を追加します: チャンネル、モデルプロバイダー、
エージェントハーネス、ツール、Skills、音声、リアルタイム文字起こし、リアルタイム
音声、メディア理解、画像生成、動画生成、Web取得、Web
検索などです。一部のPluginは**コア** (OpenClawに同梱) で、その他は
**外部**です。ほとんどの外部Pluginは
[ClawHub](/ja-JP/tools/clawhub)を通じて公開および検出されます。移行が完了するまでの間、
直接インストール用と、OpenClaw所有の一時的なPluginパッケージ群用に、npmも引き続きサポートされます。

## クイックスタート

コピー＆ペーストできるインストール、一覧表示、アンインストール、更新、公開の例については、
[Pluginを管理する](/ja-JP/plugins/manage-plugins)を参照してください。

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

    その後、設定ファイル内の`plugins.entries.\<id\>.config`で設定します。

  </Step>

  <Step title="チャットネイティブ管理">
    実行中のGatewayでは、所有者専用の`/plugins enable`と`/plugins disable`が
    Gateway設定リローダーを起動します。GatewayはPluginランタイム
    サーフェスをプロセス内で再読み込みし、新しいエージェントターンは更新されたレジストリから
    ツール一覧を再構築します。`/plugins install`はPluginソースコードを変更するため、
    Gatewayは、現在のプロセスがすでにインポート済みのモジュールを安全に
    再読み込みできるふりをするのではなく、再起動を要求します。

  </Step>

  <Step title="Pluginを検証する">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json

    # If the plugin registered a CLI root, run one command from that root.
    openclaw <plugin-command> --help
    ```

    登録済みのツール、サービス、gateway
    メソッド、フック、またはPlugin所有のCLIコマンドを証明する必要がある場合は、`--runtime`を使用します。通常の`inspect`はコールドな
    マニフェスト/レジストリチェックであり、意図的にPluginランタイムのインポートを避けます。

  </Step>
</Steps>

チャットネイティブの制御を好む場合は、`commands.plugins: true`を有効にして次を使用します:

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

インストールパスはCLIと同じリゾルバーを使用します: ローカルパス/アーカイブ、明示的な
`clawhub:<pkg>`、明示的な`npm:<pkg>`、明示的な`git:<repo>`、またはnpm経由のベアパッケージ
指定です。

設定が無効な場合、通常インストールはフェイルクローズし、
`openclaw doctor --fix`を案内します。唯一の復旧例外は、
`openclaw.install.allowInvalidConfigRecovery`にオプトインしたPlugin向けの、狭い範囲の同梱Plugin
再インストールパスです。
Gateway起動時には、無効なPlugin設定は他の無効な設定と同様にフェイルクローズします。
`openclaw doctor --fix`を実行すると、そのPluginエントリを無効化し、無効な設定ペイロードを削除することで、不正なPlugin設定を隔離できます。通常の
設定バックアップにより以前の値は保持されます。
チャンネル設定が、すでに検出できなくなったPluginを参照している一方で、
同じ古いPlugin idがPlugin設定またはインストール記録に残っている場合、Gateway起動は
警告をログに記録し、他のすべてのチャンネルをブロックする代わりにそのチャンネルをスキップします。
古いチャンネル/Pluginエントリを削除するには、`openclaw doctor --fix`を実行してください。古いPluginの根拠がない不明な
チャンネルキーは引き続き検証に失敗するため、タイプミスは見えるままになります。
`plugins.enabled: false`が設定されている場合、古いPlugin参照は不活性なものとして扱われます:
Gateway起動はPlugin検出/読み込み作業をスキップし、`openclaw doctor`は
無効化されたPlugin設定を自動削除する代わりに保持します。古いPlugin idを削除したい場合は、
doctorクリーンアップを実行する前にPluginを再度有効化してください。

Plugin依存関係のインストールは、明示的なインストール/更新または
doctor修復フローの間にのみ行われます。Gateway起動、設定再読み込み、ランタイム検査では、
パッケージマネージャーの実行や依存関係ツリーの修復は行いません。ローカルPluginは
依存関係がすでにインストールされている必要があります。一方、npm、git、ClawHub Pluginは
OpenClawの管理対象Pluginルート配下にインストールされます。npm依存関係は
OpenClawの管理対象npmルート内で巻き上げられる場合があります。インストール/更新は信頼の前にその管理対象ルートをスキャンし、
アンインストールはnpm管理パッケージをnpm経由で削除します。外部Plugin
およびカスタム読み込みパスも、引き続き`openclaw plugins install`を通じてインストールする必要があります。
ランタイムコードのインポートや依存関係の修復なしで、表示可能な各
Pluginの静的な`dependencyStatus`を確認するには、`openclaw plugins list --json`を使用してください。
インストール時ライフサイクルについては、
[Plugin依存関係の解決](/ja-JP/plugins/dependency-resolution)を参照してください。

### ブロックされたPluginパスの所有権

Plugin診断で
`blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
と表示され、その後の設定検証で`plugin present but blocked`が出る場合、OpenClawは
それを読み込むプロセスとは異なるUnixユーザーが所有する
Pluginファイルを見つけています。Plugin設定はそのままにし、ファイルシステムの所有権を修正するか、
状態ディレクトリを所有する同じユーザーとしてOpenClawを実行してください。

Dockerインストールでは、公式イメージは`node` (uid `1000`) として実行されるため、
ホスト側でバインドマウントされるOpenClaw設定ディレクトリとワークスペースディレクトリは通常、
uid `1000`が所有している必要があります:

```bash
sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
```

意図的にOpenClawをrootとして実行する場合は、代わりに管理対象Pluginルートを
root所有に修復してください:

```bash
sudo chown -R root:root /path/to/openclaw-config/npm
```

所有権を修正した後、永続化されたPluginレジストリが
修復済みファイルと一致するように、`openclaw doctor --fix`または
`openclaw plugins registry --refresh`を再実行してください。

npmインストールでは、`latest`やdist-tagなどの可変セレクターは
インストール前に解決され、その後OpenClawの
管理対象npmルート内で、検証済みの正確なバージョンに固定されます。npmの完了後、OpenClawはインストールされた
`package-lock.json`エントリが、解決済みバージョンとintegrityに引き続き一致することを検証します。npmが
異なるパッケージメタデータを書き込んだ場合、異なるPluginアーティファクトを受け入れるのではなく、
インストールは失敗し、管理対象パッケージはロールバックされます。

ソースチェックアウトはpnpmワークスペースです。同梱Pluginを変更するためにOpenClawをクローンする場合は、
`pnpm install`を実行してください。そうするとOpenClawは同梱Pluginを
`extensions/<id>`から読み込むため、編集内容とパッケージローカルの依存関係が直接使用されます。
通常のnpmルートインストールはパッケージ化されたOpenClaw向けであり、ソースチェックアウト
開発向けではありません。

## Pluginの種類

OpenClawは2つのPlugin形式を認識します:

| 形式     | 仕組み                                                       | 例                                               |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **ネイティブ** | `openclaw.plugin.json` + ランタイムモジュール。プロセス内で実行       | 公式Plugin、コミュニティnpmパッケージ               |
| **バンドル** | Codex/Claude/Cursor互換レイアウト。OpenClaw機能にマッピング | `.codex-plugin/`、`.claude-plugin/`、`.cursor-plugin/` |

どちらも`openclaw plugins list`に表示されます。バンドルの詳細については[Pluginバンドル](/ja-JP/plugins/bundles)を参照してください。

ネイティブPluginを書く場合は、[Pluginの構築](/ja-JP/plugins/building-plugins)
と[Plugin SDK概要](/ja-JP/plugins/sdk-overview)から始めてください。

## パッケージエントリポイント

ネイティブPluginのnpmパッケージは、`package.json`で`openclaw.extensions`を宣言する必要があります。
各エントリはパッケージディレクトリ内に留まり、読み取り可能な
ランタイムファイル、または`src/index.ts`から`dist/index.js`のように、推定されるビルド済みJavaScript
ピアを持つTypeScriptソースファイルに解決される必要があります。
パッケージ化されたインストールでは、そのJavaScriptランタイム出力を含める必要があります。TypeScript
ソースのフォールバックはソースチェックアウトとローカル開発パス向けであり、
OpenClawの管理対象Pluginルートにインストールされるnpmパッケージ向けではありません。

管理対象パッケージの警告で、
`requires compiled runtime output for TypeScript entry ...`と表示される場合、そのパッケージは
OpenClawがランタイムで必要とするJavaScriptファイルなしで公開されています。これはPluginのパッケージング問題であり、ローカル設定
の問題ではありません。公開者がコンパイル済み
JavaScriptを再公開した後にPluginを更新または再インストールするか、修正済みパッケージが利用可能になるまでそのPluginを無効化/アンインストールしてください。

公開済みランタイムファイルがソースエントリと同じパスに存在しない場合は、
`openclaw.runtimeExtensions`を使用してください。存在する場合、`runtimeExtensions`には
すべての`extensions`エントリに対して正確に1つのエントリが含まれている必要があります。一致しないリストは、ソースパスへ黙ってフォールバックするのではなく、
インストールとPlugin検出に失敗します。`openclaw.setupEntry`も
公開する場合は、そのビルド済み
JavaScriptピアに`openclaw.runtimeSetupEntry`を使用してください。宣言された場合、そのファイルは必須です。

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

ClawHubはほとんどのPluginの主要な配布経路です。現在のパッケージ化された
OpenClawリリースにはすでに多くの公式Pluginが同梱されているため、通常のセットアップでは
それらを別途npmインストールする必要はありません。OpenClaw所有のすべてのPluginが
ClawHubへ移行するまでの間、OpenClawは古い/カスタムインストールと直接npmワークフロー向けに、一部の`@openclaw/*`Pluginパッケージを
npmで引き続き提供します。

npmが`@openclaw/*`Pluginパッケージを非推奨として報告する場合、そのパッケージ
バージョンは古い外部パッケージ系列のものです。より新しいnpmパッケージが公開されるまで、
現在のOpenClawに同梱されたPluginまたはローカルチェックアウトを使用してください。

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

### コア (OpenClawに同梱)

<AccordionGroup>
  <Accordion title="モデルプロバイダー (デフォルトで有効)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="メモリPlugin">
    - `memory-core` - 同梱メモリ検索 (デフォルトは`plugins.slots.memory`経由)
    - `memory-lancedb` - 自動リコール/キャプチャ付きのLanceDBベースの長期メモリ (`plugins.slots.memory = "memory-lancedb"`を設定)

    [Memory LanceDB](/ja-JP/plugins/memory-lancedb) で、OpenAI 互換の
    埋め込み設定、Ollama の例、リコール制限、トラブルシューティングを参照してください。

  </Accordion>

  <Accordion title="音声プロバイダー（デフォルトで有効）">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="その他">
    - `browser` - ブラウザツール、`openclaw browser` CLI、`browser.request` gateway メソッド、ブラウザランタイム、デフォルトのブラウザ制御サービス向けの同梱ブラウザ Plugin（デフォルトで有効。置き換える前に無効化してください）
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

| フィールド       | 説明                                                      |
| ------------------ | --------------------------------------------------------- |
| `enabled`          | マスタートグル（デフォルト: `true`）                      |
| `allow`            | Plugin 許可リスト（任意）                                |
| `bundledDiscovery` | 同梱 Plugin の探索モード（デフォルトは `allowlist`）      |
| `deny`             | Plugin 拒否リスト（任意。拒否が優先）                    |
| `load.paths`       | 追加の Plugin ファイル/ディレクトリ                       |
| `slots`            | 排他的なスロットセレクター（例: `memory`, `contextEngine`） |
| `entries.\<id\>`   | Plugin ごとのトグル + 設定                                |

`plugins.allow` は排他的です。空でない場合、`tools.allow` に `"*"` や特定の Plugin 所有のツール名が含まれていても、一覧にある Plugin だけが読み込まれるかツールを公開できます。ツール許可リストが Plugin ツールを参照している場合は、所有する Plugin id を `plugins.allow` に追加するか、`plugins.allow` を削除してください。`openclaw doctor` はこの形について警告します。

`plugins.bundledDiscovery` は新しい設定ではデフォルトで `"allowlist"` になるため、制限的な `plugins.allow` インベントリは、ランタイム web-search プロバイダー探索を含め、省略された同梱プロバイダー Plugin もブロックします。Doctor は移行時に、古い制限的な許可リスト設定へ `"compat"` をスタンプするため、オペレーターがより厳格なモードを選択するまで、アップグレード後も従来の同梱プロバイダー動作が維持されます。空の `plugins.allow` は、引き続き未設定/開放として扱われます。

`/plugins enable` または `/plugins disable` で行われた設定変更は、プロセス内の Gateway Plugin リロードをトリガーします。新しいエージェントターンは、更新された Plugin レジストリからツール一覧を再構築します。install、update、uninstall などのソースを変更する操作では、すでにインポートされた Plugin モジュールを安全にその場で置き換えられないため、引き続き Gateway プロセスを再起動します。

`openclaw plugins list` はローカルの Plugin レジストリ/設定スナップショットです。そこで `enabled` の Plugin は、永続化されたレジストリと現在の設定が、その Plugin の参加を許可していることを意味します。すでに実行中のリモート Gateway が同じ Plugin コードへリロードまたは再起動済みであることを証明するものではありません。ラッパープロセスを使う VPS/コンテナ構成では、実際の `openclaw gateway run` プロセスへ再起動またはリロードをトリガーする書き込みを送るか、リロードが失敗を報告する場合は実行中の Gateway に対して `openclaw gateway restart` を使用してください。

<Accordion title="Plugin の状態: 無効、見つからない、不正">
  - **無効**: Plugin は存在しますが、有効化ルールによってオフになっています。設定は保持されます。
  - **見つからない**: 設定が、探索で見つからなかった Plugin id を参照しています。
  - **不正**: Plugin は存在しますが、その設定が宣言されたスキーマと一致しません。Gateway 起動時はその Plugin だけをスキップします。`openclaw doctor --fix` は、その不正なエントリを無効化して設定ペイロードを削除することで隔離できます。

</Accordion>

## 探索と優先順位

OpenClaw は次の順序で Plugin をスキャンします（最初の一致が優先されます）。

<Steps>
  <Step title="設定パス">
    `plugins.load.paths` - 明示的なファイルまたはディレクトリパス。OpenClaw 自身のパッケージ化された同梱 Plugin ディレクトリを指し返すパスは無視されます。
    それらの古いエイリアスを削除するには `openclaw doctor --fix` を実行してください。
  </Step>

  <Step title="ワークスペース Plugin">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` と `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`。
  </Step>

  <Step title="グローバル Plugin">
    `~/.openclaw/<plugin-root>/*.ts` と `~/.openclaw/<plugin-root>/*/index.ts`。
  </Step>

  <Step title="同梱 Plugin">
    OpenClaw に同梱されています。多くはデフォルトで有効です（モデルプロバイダー、音声）。
    その他は明示的な有効化が必要です。
  </Step>
</Steps>

パッケージ化されたインストールと Docker イメージは通常、コンパイル済みの `dist/extensions` ツリーから同梱 Plugin を解決します。同梱 Plugin のソースディレクトリが対応するパッケージ化済みソースパス上に bind mount されている場合、たとえば `/app/extensions/synology-chat` のような場合、OpenClaw はそのマウントされたソースディレクトリを同梱ソースオーバーレイとして扱い、パッケージ化された `/app/dist/extensions/synology-chat` バンドルより先に探索します。これにより、すべての同梱 Plugin を TypeScript ソースへ戻さなくても、メンテナーのコンテナループが動作します。ソースオーバーレイのマウントが存在する場合でもパッケージ化された dist バンドルを強制するには、`OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1` を設定してください。

### 有効化ルール

- `plugins.enabled: false` はすべての Plugin を無効化し、Plugin の探索/読み込み作業をスキップします
- `plugins.deny` は常に allow より優先されます
- `plugins.entries.\<id\>.enabled: false` はその Plugin を無効化します
- ワークスペース由来の Plugin は **デフォルトで無効** です（明示的に有効化する必要があります）
- 同梱 Plugin は、上書きされない限り組み込みのデフォルトオン集合に従います
- 排他的スロットは、そのスロットで選択された Plugin を強制的に有効化できます
- 一部の同梱オプトイン Plugin は、プロバイダーモデル参照、チャネル設定、ハーネスランタイムなど、設定が Plugin 所有のサーフェスを指定している場合に自動的に有効化されます
- `plugins.enabled: false` が有効な間、古い Plugin 設定は保持されます。古い id を削除したい場合は、doctor クリーンアップを実行する前に Plugin を再度有効化してください
- OpenAI 系 Codex ルートは個別の Plugin 境界を保持します。
  `openai-codex/*` は OpenAI Plugin に属し、同梱 Codex app-server Plugin は `agentRuntime.id: "codex"` または従来の `codex/*` モデル参照によって選択されます

## ランタイムフックのトラブルシューティング

Plugin が `plugins list` に表示されているのに、ライブチャットトラフィックで `register(api)` の副作用やフックが実行されない場合は、まず次を確認してください。

- `openclaw gateway status --deep --require-rpc` を実行し、アクティブな Gateway URL、プロファイル、設定パス、プロセスが編集対象と一致していることを確認します。
- Plugin のインストール/設定/コード変更後にライブ Gateway を再起動します。ラッパーコンテナでは、PID 1 は単なるスーパーバイザーである場合があります。子の `openclaw gateway run` プロセスを再起動するかシグナルを送ってください。
- フック登録と診断を確認するには、`openclaw plugins inspect <id> --runtime --json` を使用します。`llm_input`、`llm_output`、`before_agent_finalize`、`agent_end` などの非同梱会話フックには、`plugins.entries.<id>.hooks.allowConversationAccess=true` が必要です。
- モデル切り替えには `before_model_resolve` を優先してください。これはエージェントターンのモデル解決前に実行されます。`llm_output` は、モデル試行がアシスタント出力を生成した後にのみ実行されます。
- 有効なセッションモデルの証拠には、`openclaw sessions` または Gateway のセッション/ステータスサーフェスを使用し、プロバイダーペイロードをデバッグする場合は `--raw-stream --raw-stream-path <path>` を付けて Gateway を起動してください。

### 遅い Plugin ツールセットアップ

エージェントターンがツール準備中に停止しているように見える場合は、トレースログを有効にして Plugin ツールファクトリのタイミング行を確認してください。

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

次を探してください。

```text
[trace:plugin-tools] factory timings ...
```

サマリーには、合計ファクトリ時間と最も遅い Plugin ツールファクトリが一覧表示されます。Plugin id、宣言されたツール名、結果の形、ツールが任意かどうかが含まれます。単一のファクトリに少なくとも 1s かかる場合、または Plugin ツールファクトリ準備の合計が少なくとも 5s かかる場合、遅い行は警告に昇格されます。

OpenClaw は、同じ有効なリクエストコンテキストで繰り返し解決するために、成功した Plugin ツールファクトリ結果をキャッシュします。キャッシュキーには、有効なランタイム設定、ワークスペース、エージェント/セッション id、サンドボックスポリシー、ブラウザ設定、配信コンテキスト、リクエスターの ID、所有権状態が含まれるため、これらの信頼済みフィールドに依存するファクトリは、コンテキストが変わると再実行されます。

1 つの Plugin がタイミングの大半を占める場合は、そのランタイム登録を調べてください。

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

その後、その Plugin を更新、再インストール、または無効化してください。Plugin 作者は、高コストな依存関係の読み込みをツールファクトリ内で行うのではなく、ツール実行パスの背後へ移動する必要があります。

### チャネルまたはツール所有権の重複

症状:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

これらは、複数の有効な Plugin が同じチャネル、セットアップフロー、またはツール名を所有しようとしていることを意味します。最も一般的な原因は、現在同じチャネル id を提供している同梱 Plugin の横に、外部チャネル Plugin がインストールされていることです。

デバッグ手順:

- `openclaw plugins list --enabled --verbose` を実行し、有効なすべての Plugin と由来を確認します。
- 疑わしい各 Plugin に対して `openclaw plugins inspect <id> --runtime --json` を実行し、`channels`、`channelConfigs`、`tools`、診断を比較します。
- Plugin パッケージをインストールまたは削除した後は、永続化されたメタデータが現在のインストールを反映するように `openclaw plugins registry --refresh` を実行します。
- インストール、レジストリ、設定の変更後に Gateway を再起動します。

修正オプション:

- 1 つの Plugin が同じチャネル id について別の Plugin を意図的に置き換える場合、優先する Plugin は `channelConfigs.<channel-id>.preferOver` に低優先度の Plugin id を宣言する必要があります。[/plugins/manifest#replacing-another-channel-plugin](/ja-JP/plugins/manifest#replacing-another-channel-plugin) を参照してください。
- 重複が偶発的な場合は、`plugins.entries.<plugin-id>.enabled: false` で片方を無効化するか、古い Plugin インストールを削除します。
- 両方の Plugin を明示的に有効化した場合、OpenClaw はそのリクエストを保持して競合を報告します。チャネルの所有者を 1 つ選ぶか、ランタイムサーフェスが曖昧にならないように Plugin 所有のツール名を変更してください。

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

| スロット        | 制御するもの              | デフォルト          |
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

バンドル済みPluginは OpenClaw に同梱されます。多くはデフォルトで有効です（たとえば、バンドル済みモデルプロバイダー、バンドル済み音声プロバイダー、バンドル済みブラウザーPlugin）。その他のバンドル済みPluginでは、引き続き `openclaw plugins enable <id>` が必要です。

`--force` は、既存のインストール済みPluginまたはフックパックをその場で上書きします。追跡中の npm Plugin の通常のアップグレードには `openclaw plugins update <id-or-npm-spec>` を使用してください。管理対象のインストール先へコピーする代わりにソースパスを再利用する `--link` とは併用できません。

`plugins.allow` がすでに設定されている場合、`openclaw plugins install` は、インストールしたPlugin ID を有効化する前にその許可リストへ追加します。同じPlugin ID が `plugins.deny` に存在する場合、インストールはその古い拒否エントリを削除するため、明示的にインストールしたPluginは再起動後すぐに読み込み可能になります。

OpenClaw は、Pluginインベントリ、コントリビューション所有権、起動計画のコールドリードモデルとして、永続化されたローカルPluginレジストリを保持します。インストール、更新、アンインストール、有効化、無効化の各フローは、Plugin状態の変更後にそのレジストリを更新します。同じ `plugins/installs.json` ファイルには、トップレベルの `installRecords` に永続的なインストールメタデータを、`plugins` に再構築可能なマニフェストメタデータを保持します。レジストリが存在しない、古い、または無効な場合、`openclaw plugins registry --refresh` は、Pluginランタイムモジュールを読み込まずに、インストールレコード、設定ポリシー、マニフェスト/パッケージメタデータからマニフェストビューを再構築します。
`openclaw plugins update <id-or-npm-spec>` は追跡中のインストールに適用されます。dist-tag または厳密なバージョンを含む npm パッケージ仕様を渡すと、パッケージ名を追跡中のPluginレコードへ解決し直し、以後の更新用に新しい仕様を記録します。バージョンなしのパッケージ名を渡すと、厳密にピン留めされたインストールをレジストリのデフォルトリリースラインへ戻します。インストール済みの npm Pluginが解決済みバージョンおよび記録済みアーティファクト ID とすでに一致する場合、OpenClaw はダウンロード、再インストール、設定の書き換えを行わずに更新をスキップします。
`openclaw update` がベータチャンネルで実行されると、デフォルトラインの npm および ClawHub Pluginレコードはまず `@beta` を試し、Pluginのベータリリースが存在しない場合は default/latest にフォールバックします。厳密なバージョンと明示的なタグはピン留めされたままです。

`--pin` は npm 専用です。マーケットプレイスのインストールは npm 仕様ではなくマーケットプレイスソースメタデータを永続化するため、`--marketplace` とは併用できません。

`--dangerously-force-unsafe-install` は、組み込みの危険コードスキャナーによる誤検知向けの緊急用オーバーライドです。これにより、組み込みの `critical` 検出結果があってもPluginのインストールおよびPluginの更新を続行できますが、Pluginの `before_install` ポリシーブロックやスキャン失敗によるブロックは引き続き迂回しません。インストールスキャンは、パッケージ化されたテストモックでブロックしないように、`tests/`、`__tests__/`、`*.test.*`、`*.spec.*` などの一般的なテストファイルおよびディレクトリを無視します。ただし、宣言されたPluginランタイムエントリポイントは、それらの名前のいずれかを使用していてもスキャンされます。

この CLI フラグはPluginのインストール/更新フローのみに適用されます。Gateway に支えられたSkill依存関係のインストールでは、代わりに対応する `dangerouslyForceUnsafeInstall` リクエストオーバーライドを使用します。一方、`openclaw skills install` は別個の ClawHub Skill ダウンロード/インストールフローのままです。

ClawHub で公開したPluginがスキャンによって非表示またはブロックされている場合は、ClawHub ダッシュボードを開くか、`clawhub package rescan <name>` を実行して ClawHub に再チェックを依頼してください。`--dangerously-force-unsafe-install` は自分のマシン上のインストールにのみ影響します。ClawHub にPluginの再スキャンを依頼したり、ブロックされたリリースを公開したりするものではありません。

互換バンドルは、同じPluginの list/inspect/enable/disable フローに参加します。現在のランタイムサポートには、バンドルSkill、Claude コマンドSkill、Claude `settings.json` デフォルト、Claude `.lsp.json` とマニフェスト宣言の `lspServers` デフォルト、Cursor コマンドSkill、互換性のある Codex フックディレクトリが含まれます。

`openclaw plugins inspect <id>` は、検出されたバンドル機能に加えて、バンドルに支えられたPluginのサポート済みまたは未サポートの MCP および LSP サーバーエントリも報告します。

マーケットプレイスソースには、`~/.claude/plugins/known_marketplaces.json` にある Claude の既知マーケットプレイス名、ローカルマーケットプレイスルートまたは `marketplace.json` パス、`owner/repo` のような GitHub 省略形、GitHub リポジトリ URL、または git URL を使用できます。リモートマーケットプレイスでは、Pluginエントリはクローンされたマーケットプレイスリポジトリ内に留まり、相対パスソースのみを使用する必要があります。

詳細は [`openclaw plugins` CLI リファレンス](/ja-JP/cli/plugins) を参照してください。

## Plugin API の概要

ネイティブPluginは、`register(api)` を公開するエントリオブジェクトをエクスポートします。古いPluginではレガシーエイリアスとして `activate(api)` をまだ使用している場合がありますが、新しいPluginでは `register` を使用する必要があります。

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

OpenClaw はPluginの有効化中にエントリオブジェクトを読み込み、`register(api)` を呼び出します。ローダーは古いPlugin向けに引き続き `activate(api)` へフォールバックしますが、バンドル済みPluginと新しい外部Pluginは `register` を公開契約として扱う必要があります。

`api.registrationMode` は、エントリがなぜ読み込まれているのかをPluginに伝えます。

| モード | 意味 |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full` | ランタイム有効化。ツール、フック、サービス、コマンド、ルート、その他のライブ副作用を登録します。 |
| `discovery` | 読み取り専用の機能検出。プロバイダーとメタデータを登録します。信頼済みPluginエントリコードは読み込まれる場合がありますが、ライブ副作用はスキップします。 |
| `setup-only` | 軽量なセットアップエントリを通じたチャンネルセットアップメタデータの読み込み。 |
| `setup-runtime` | ランタイムエントリも必要とするチャンネルセットアップの読み込み。 |
| `cli-metadata` | CLI コマンドメタデータの収集のみ。 |

ソケット、データベース、バックグラウンドワーカー、または長寿命クライアントを開くPluginエントリは、それらの副作用を `api.registrationMode === "full"` でガードする必要があります。検出の読み込みは有効化の読み込みとは別にキャッシュされ、実行中の Gateway レジストリを置き換えません。検出は非有効化ですが、インポート不要ではありません。OpenClaw はスナップショットを構築するために、信頼済みPluginエントリまたはチャンネルPluginモジュールを評価する場合があります。モジュールのトップレベルは軽量かつ副作用なしに保ち、ネットワーククライアント、サブプロセス、リスナー、認証情報の読み取り、サービス起動はフルランタイムパスの背後へ移動してください。

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
| `registerMediaUnderstandingProvider` | 画像/音声分析 |
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

- `before_tool_call`: `{ block: true }` は終端です。低優先度のハンドラーはスキップされます。
- `before_tool_call`: `{ block: false }` は no-op であり、以前のブロックを解除しません。
- `before_install`: `{ block: true }` は終端です。低優先度のハンドラーはスキップされます。
- `before_install`: `{ block: false }` は no-op であり、以前のブロックを解除しません。
- `message_sending`: `{ cancel: true }` は終端です。低優先度のハンドラーはスキップされます。
- `message_sending`: `{ cancel: false }` は no-op であり、以前のキャンセルを解除しません。

ネイティブ Codex アプリサーバーは、Codex ネイティブツールイベントをこのフックサーフェスへブリッジして戻します。Pluginは `before_tool_call` を通じてネイティブ Codex ツールをブロックし、`after_tool_call` を通じて結果を観察し、Codex `PermissionRequest` 承認に参加できます。ブリッジはまだ Codex ネイティブツール引数を書き換えません。正確な Codex ランタイムサポート境界は [Codex ハーネス v1 サポート契約](/ja-JP/plugins/codex-harness#v1-support-contract) にあります。

型付きフック動作の詳細は、[SDK 概要](/ja-JP/plugins/sdk-overview#hook-decision-semantics) を参照してください。

## 関連

- [Plugin の構築](/ja-JP/plugins/building-plugins) - 独自の Plugin を作成する
- [Plugin バンドル](/ja-JP/plugins/bundles) - Codex/Claude/Cursor バンドル互換性
- [Plugin マニフェスト](/ja-JP/plugins/manifest) - マニフェストスキーマ
- [ツールの登録](/ja-JP/plugins/building-plugins#registering-agent-tools) - Plugin にエージェントツールを追加する
- [Plugin の内部](/ja-JP/plugins/architecture) - ケイパビリティモデルと読み込みパイプライン
- [コミュニティ Plugin](/ja-JP/plugins/community) - サードパーティの一覧
