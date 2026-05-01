---
read_when:
    - Plugin のインストールまたは設定
    - Plugin の検出と読み込みルールを理解する
    - Codex/Claude 互換の Plugin バンドルを扱う
sidebarTitle: Install and Configure
summary: OpenClaw Plugin をインストール、設定、管理する
title: Plugin
x-i18n:
    generated_at: "2026-05-01T05:03:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 69f876df0c2ed3ff356ada9462b56f2b5a65a662b64b328ecc97d8b463036934
    source_path: tools/plugin.md
    workflow: 16
---

PluginはOpenClawを新しい機能で拡張します: チャネル、モデルプロバイダー、
エージェントハーネス、ツール、Skills、音声、リアルタイム文字起こし、リアルタイム
音声、メディア理解、画像生成、動画生成、Web取得、Web
検索などです。一部のPluginは**コア**（OpenClawに同梱）で、その他は
**外部**です。ほとんどの外部Pluginは
[ClawHub](/ja-JP/tools/clawhub)を通じて公開、検出されます。npmは直接インストールと、その移行が完了するまでの
OpenClaw所有Pluginパッケージの一時的なセット向けに、引き続きサポートされます。

## クイックスタート

<Steps>
  <Step title="See what is loaded">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="Install a plugin">
    ```bash
    # From npm
    openclaw plugins install npm:@acme/openclaw-plugin

    # From a local directory or archive
    openclaw plugins install ./my-plugin
    openclaw plugins install ./my-plugin.tgz
    ```

  </Step>

  <Step title="Restart the Gateway">
    ```bash
    openclaw gateway restart
    ```

    次に、設定ファイル内の`plugins.entries.\<id\>.config`で設定します。

  </Step>
</Steps>

チャットネイティブの制御を好む場合は、`commands.plugins: true`を有効にして次を使用します:

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

インストールパスはCLIと同じリゾルバーを使用します: ローカルパス/アーカイブ、明示的な
`clawhub:<pkg>`、明示的な`npm:<pkg>`、または素のパッケージ指定（ClawHubが先で、その後
npmフォールバック）。

設定が無効な場合、通常インストールはフェイルクローズし、
`openclaw doctor --fix`を案内します。唯一の復旧例外は、
`openclaw.install.allowInvalidConfigRecovery`を選択したPlugin向けの、狭い同梱Plugin
再インストールパスです。
Gateway起動中、1つのPluginの無効な設定はそのPluginに分離されます:
起動時に`plugins.entries.<id>.config`の問題をログに記録し、読み込み時にそのPluginをスキップし、
他のPluginとチャネルはオンラインのままにします。`openclaw doctor --fix`を実行すると、
そのPluginエントリを無効化し、無効な設定ペイロードを削除して、問題のあるPlugin設定を隔離できます。
通常の設定バックアップにより以前の値は保持されます。
チャネル設定が、もはや検出できないPluginを参照している一方で、同じ古いPlugin IDがPlugin設定またはインストール記録に残っている場合、
Gateway起動は警告をログに記録し、他のすべてのチャネルをブロックする代わりにそのチャネルをスキップします。
`openclaw doctor --fix`を実行すると、古いチャネル/Pluginエントリを削除できます。不明な
チャネルキーで古いPluginの根拠がないものは引き続き検証に失敗するため、タイプミスは可視のままです。
`plugins.enabled: false`が設定されている場合、古いPlugin参照は非アクティブとして扱われます:
Gateway起動はPluginの検出/読み込み作業をスキップし、`openclaw doctor`は無効化されたPlugin設定を
自動削除せずに保持します。古いPlugin IDを削除したい場合は、doctorクリーンアップを実行する前にPluginを再度有効化してください。

パッケージ化されたOpenClawインストールは、すべての同梱Pluginの
ランタイム依存ツリーを先行してインストールしません。同梱されたOpenClaw所有Pluginが
Plugin設定、レガシーチャネル設定、またはデフォルト有効のマニフェストから有効になっている場合、起動は
そのPluginをインポートする前に、そのPluginが宣言したランタイム依存関係だけを修復します。
永続化されたチャネル認証状態だけでは、Gateway起動時のランタイム依存関係修復のために
同梱チャネルは有効化されません。
明示的な無効化は引き続き優先されます: `plugins.entries.<id>.enabled: false`、
`plugins.deny`、`plugins.enabled: false`、`channels.<id>.enabled: false`は、
そのPlugin/チャネルの同梱ランタイム依存関係の自動修復を防ぎます。
空でない`plugins.allow`も、デフォルト有効の同梱ランタイム依存関係
修復を制限します。明示的な同梱チャネル有効化（`channels.<id>.enabled: true`）は、
引き続きそのチャネルのPlugin依存関係を修復できます。
外部Pluginとカスタム読み込みパスは、引き続き
`openclaw plugins install`を通じてインストールする必要があります。

## Pluginの種類

OpenClawは2つのPlugin形式を認識します:

| 形式       | 仕組み                                                             | 例                                                     |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **ネイティブ** | `openclaw.plugin.json` + ランタイムモジュール。プロセス内で実行       | 公式Plugin、コミュニティnpmパッケージ                  |
| **バンドル** | Codex/Claude/Cursor互換レイアウト。OpenClaw機能にマッピングされる | `.codex-plugin/`、`.claude-plugin/`、`.cursor-plugin/` |

どちらも`openclaw plugins list`に表示されます。バンドルの詳細は[Plugin Bundles](/ja-JP/plugins/bundles)を参照してください。

ネイティブPluginを作成する場合は、[Building Plugins](/ja-JP/plugins/building-plugins)
と[Plugin SDK Overview](/ja-JP/plugins/sdk-overview)から始めてください。

## パッケージエントリポイント

ネイティブPluginのnpmパッケージは、`package.json`で`openclaw.extensions`を宣言する必要があります。
各エントリはパッケージディレクトリ内にとどまり、読み取り可能な
ランタイムファイル、または`src/index.ts`から`dist/index.js`のように推定されるビルド済みJavaScript
ピアを持つTypeScriptソースファイルに解決される必要があります。

公開済みランタイムファイルがソースエントリと同じパスに存在しない場合は、
`openclaw.runtimeExtensions`を使用します。存在する場合、`runtimeExtensions`には
すべての`extensions`エントリに対して正確に1つのエントリが含まれている必要があります。一致しないリストは、ソースパスへ暗黙にフォールバックするのではなく、インストールと
Plugin検出を失敗させます。

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
個別にnpmインストールする必要はありません。すべてのOpenClaw所有Pluginが
ClawHubへ移行するまで、OpenClawは古い/カスタムインストールと直接npmワークフロー向けに、一部の`@openclaw/*`Pluginパッケージをnpmで引き続き提供します。

npmが`@openclaw/*`Pluginパッケージを非推奨として報告する場合、そのパッケージ
バージョンは古い外部パッケージ列のものです。新しいnpmパッケージが公開されるまでは、
現在のOpenClawに同梱されているPlugin、またはローカルチェックアウトを使用してください。

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

### コア（OpenClawに同梱）

<AccordionGroup>
  <Accordion title="Model providers (enabled by default)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Memory plugins">
    - `memory-core` — 同梱メモリ検索（デフォルトは`plugins.slots.memory`経由）
    - `memory-lancedb` — 自動リコール/キャプチャ付きのオンデマンドインストール長期メモリ（`plugins.slots.memory = "memory-lancedb"`を設定）

    OpenAI互換の埋め込みセットアップ、Ollamaの例、リコール上限、トラブルシューティングについては、
    [Memory LanceDB](/ja-JP/plugins/memory-lancedb)を参照してください。

  </Accordion>

  <Accordion title="Speech providers (enabled by default)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Other">
    - `browser` — ブラウザツール、`openclaw browser` CLI、`browser.request` gatewayメソッド、ブラウザランタイム、デフォルトブラウザ制御サービス向けの同梱ブラウザPlugin（デフォルトで有効。置き換える前に無効化してください）
    - `copilot-proxy` — VS Code Copilot Proxyブリッジ（デフォルトで無効）

  </Accordion>
</AccordionGroup>

サードパーティPluginを探していますか？[Community Plugins](/ja-JP/plugins/community)を参照してください。

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

| フィールド       | 説明                                                     |
| ---------------- | -------------------------------------------------------- |
| `enabled`        | マスタートグル（デフォルト: `true`）                     |
| `allow`          | Plugin許可リスト（任意）                                 |
| `deny`           | Plugin拒否リスト（任意。拒否が優先）                    |
| `load.paths`     | 追加のPluginファイル/ディレクトリ                       |
| `slots`          | 排他的なスロットセレクター（例: `memory`、`contextEngine`） |
| `entries.\<id\>` | Pluginごとのトグル + 設定                                |

`plugins.allow`は排他的です。空でない場合、`tools.allow`に`"*"`または特定のPlugin所有
ツール名が含まれていても、一覧にあるPluginだけが読み込まれるかツールを公開できます。
ツール許可リストがPluginツールを参照する場合は、所有するPlugin IDを
`plugins.allow`に追加するか、`plugins.allow`を削除してください。`openclaw doctor`はこの
形状について警告します。

設定変更には**Gatewayの再起動が必要**です。Gatewayが設定
監視 + プロセス内再起動を有効にして実行されている場合（デフォルトの`openclaw gateway`パス）、
通常は設定書き込みが反映された少し後にその再起動が自動的に実行されます。
ネイティブPluginのランタイムコードやライフサイクル
フックに対してサポートされるホットリロードパスはありません。更新された`register(api)`コード、`api.on(...)`フック、ツール、サービス、または
プロバイダー/ランタイムフックが実行されることを期待する前に、ライブチャネルを提供しているGatewayプロセスを再起動してください。

`openclaw plugins list`はローカルPluginレジストリ/設定スナップショットです。そこで
`enabled`になっているPluginは、永続化されたレジストリと現在の設定がそのPluginの参加を許可していることを意味します。
すでに実行中のリモートGateway
子プロセスが同じPluginコードで再起動済みであることを証明するものではありません。ラッパープロセスを伴うVPS/コンテナセットアップでは、
実際の`openclaw gateway run`プロセスへ再起動を送るか、実行中のGatewayに対して
`openclaw gateway restart`を使用してください。

<Accordion title="Plugin states: disabled vs missing vs invalid">
  - **無効**: Pluginは存在するが、有効化ルールによりオフになっています。設定は保持されます。
  - **欠落**: 設定が、検出で見つからなかったPlugin IDを参照しています。
  - **無効**: Pluginは存在するが、その設定が宣言されたスキーマと一致しません。Gateway起動はそのPluginだけをスキップします。`openclaw doctor --fix`は、そのPluginを無効化し、設定ペイロードを削除して、無効なエントリを隔離できます。

</Accordion>

## 検出と優先順位

OpenClawは次の順序でPluginをスキャンします（最初に一致したものが優先されます）:

<Steps>
  <Step title="設定パス">
    `plugins.load.paths` — 明示的なファイルパスまたはディレクトリパス。OpenClaw 自身のパッケージ済み同梱 Plugin ディレクトリを指し戻すパスは無視されます。
    これらの古いエイリアスを削除するには、`openclaw doctor --fix` を実行します。
  </Step>

  <Step title="ワークスペース Plugin">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` と `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`。
  </Step>

  <Step title="グローバル Plugin">
    `~/.openclaw/<plugin-root>/*.ts` と `~/.openclaw/<plugin-root>/*/index.ts`。
  </Step>

  <Step title="同梱 Plugin">
    OpenClaw に同梱されています。多くはデフォルトで有効化されています（モデルプロバイダー、音声）。
    その他は明示的な有効化が必要です。
  </Step>
</Steps>

パッケージ済みインストールと Docker イメージは通常、コンパイル済みの `dist/extensions` ツリーから同梱 Plugin を解決します。同梱 Plugin のソースディレクトリが、対応するパッケージ済みソースパス上にバインドマウントされている場合、たとえば `/app/extensions/synology-chat` の場合、OpenClaw はそのマウントされたソースディレクトリを同梱ソースオーバーレイとして扱い、パッケージ済みの `/app/dist/extensions/synology-chat` バンドルより先に検出します。これにより、すべての同梱 Plugin を TypeScript ソースへ戻さなくても、メンテナーのコンテナ内ループが機能し続けます。ソースオーバーレイのマウントが存在しても、パッケージ済み dist バンドルを強制するには `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1` を設定します。

### 有効化ルール

- `plugins.enabled: false` はすべての Plugin を無効化し、Plugin の検出/読み込み処理をスキップします
- `plugins.deny` は常に allow より優先されます
- `plugins.entries.\<id\>.enabled: false` はその Plugin を無効化します
- ワークスペース由来の Plugin は **デフォルトで無効** です（明示的な有効化が必要です）
- 同梱 Plugin は、上書きされない限り、組み込みのデフォルト有効セットに従います
- 排他的スロットは、そのスロットで選択された Plugin を強制的に有効化できます
- 一部の同梱オプトイン Plugin は、設定で Plugin 所有のサーフェス（プロバイダーモデル参照、チャンネル設定、ハーネスランタイムなど）が指定されると自動的に有効化されます
- `plugins.enabled: false` が有効な間、古い Plugin 設定は保持されます。古い id を削除したい場合は、doctor cleanup を実行する前に Plugin を再度有効化します
- OpenAI 系の Codex ルートは個別の Plugin 境界を維持します:
  `openai-codex/*` は OpenAI Plugin に属し、同梱 Codex app-server Plugin は `agentRuntime.id: "codex"` またはレガシーの `codex/*` モデル参照で選択されます

## ランタイムフックのトラブルシューティング

Plugin が `plugins list` に表示されているのに、ライブチャットトラフィックで `register(api)` の副作用やフックが実行されない場合は、まず次を確認してください。

- `openclaw gateway status --deep --require-rpc` を実行し、アクティブな Gateway URL、プロファイル、設定パス、プロセスが編集対象と一致していることを確認します。
- Plugin のインストール、設定、コード変更後にライブ Gateway を再起動します。ラッパーコンテナでは、PID 1 がスーパーバイザーにすぎない場合があります。その場合は、子の `openclaw gateway run` プロセスを再起動するかシグナルを送ります。
- `openclaw plugins inspect <id> --json` を使用して、フック登録と診断を確認します。`llm_input`、`llm_output`、`before_agent_finalize`、`agent_end` などの非同梱会話フックには `plugins.entries.<id>.hooks.allowConversationAccess=true` が必要です。
- モデル切り替えには `before_model_resolve` を優先してください。これはエージェントターンのモデル解決前に実行されます。`llm_output` は、モデル試行がアシスタント出力を生成した後にのみ実行されます。
- 有効なセッションモデルの証明には `openclaw sessions`、または Gateway のセッション/ステータスサーフェスを使用し、プロバイダーペイロードをデバッグする場合は `--raw-stream --raw-stream-path <path>` を付けて Gateway を起動します。

### チャンネルまたはツール所有権の重複

症状:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

これは、複数の有効な Plugin が同じチャンネル、セットアップフロー、またはツール名を所有しようとしていることを意味します。最も一般的な原因は、同じチャンネル id を提供するようになった同梱 Plugin の横に外部チャンネル Plugin がインストールされていることです。

デバッグ手順:

- `openclaw plugins list --enabled --verbose` を実行し、有効なすべての Plugin と由来を確認します。
- 疑わしい各 Plugin について `openclaw plugins inspect <id> --json` を実行し、`channels`、`channelConfigs`、`tools`、診断を比較します。
- Plugin パッケージをインストールまたは削除した後は、`openclaw plugins registry --refresh` を実行して、永続化されたメタデータが現在のインストールを反映するようにします。
- インストール、レジストリ、または設定の変更後に Gateway を再起動します。

修正オプション:

- ある Plugin が同じチャンネル id の別の Plugin を意図的に置き換える場合、優先する Plugin は `channelConfigs.<channel-id>.preferOver` に優先度の低い Plugin id を宣言する必要があります。[/plugins/manifest#replacing-another-channel-plugin](/ja-JP/plugins/manifest#replacing-another-channel-plugin) を参照してください。
- 重複が偶発的な場合は、`plugins.entries.<plugin-id>.enabled: false` で一方を無効化するか、古い Plugin インストールを削除します。
- 両方の Plugin を明示的に有効化した場合、OpenClaw はその要求を保持して競合を報告します。チャンネルの所有者を 1 つ選ぶか、Plugin 所有のツール名を変更して、ランタイムサーフェスが曖昧にならないようにします。

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

| スロット        | 制御対象              | デフォルト          |
| --------------- | --------------------- | ------------------- |
| `memory`        | アクティブメモリ Plugin | `memory-core`       |
| `contextEngine` | アクティブコンテキストエンジン | `legacy`（組み込み） |

## CLI リファレンス

```bash
openclaw plugins list                       # compact inventory
openclaw plugins list --enabled            # only enabled plugins
openclaw plugins list --verbose            # per-plugin detail lines
openclaw plugins list --json               # machine-readable inventory
openclaw plugins inspect <id>              # deep detail
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

openclaw plugins enable <id>
openclaw plugins disable <id>
```

同梱 Plugin は OpenClaw に含まれています。多くはデフォルトで有効化されています（たとえば、同梱モデルプロバイダー、同梱音声プロバイダー、同梱ブラウザー Plugin）。その他の同梱 Plugin には、引き続き `openclaw plugins enable <id>` が必要です。

`--force` は、既存のインストール済み Plugin またはフックパックをその場で上書きします。追跡対象 npm Plugin の通常のアップグレードには `openclaw plugins update <id-or-npm-spec>` を使用します。これは `--link` とは併用できません。`--link` は管理対象インストール先へコピーする代わりに、ソースパスを再利用します。

`plugins.allow` がすでに設定されている場合、`openclaw plugins install` はインストールした Plugin id を、その Plugin を有効化する前に allowlist へ追加します。同じ Plugin id が `plugins.deny` に存在する場合、install はその古い deny エントリを削除するため、明示的にインストールした Plugin は再起動後すぐに読み込み可能になります。

OpenClaw は、Plugin インベントリ、コントリビューション所有権、起動計画のコールド読み取りモデルとして、永続化されたローカル Plugin レジストリを保持します。インストール、更新、アンインストール、有効化、無効化の各フローは、Plugin 状態を変更した後にそのレジストリを更新します。同じ `plugins/installs.json` ファイルは、永続的なインストールメタデータをトップレベルの `installRecords` に、再構築可能なマニフェストメタデータを `plugins` に保持します。レジストリが存在しない、古い、または無効な場合、`openclaw plugins registry
--refresh` は、Plugin ランタイムモジュールを読み込まずに、インストール記録、設定ポリシー、マニフェスト/パッケージメタデータからマニフェストビューを再構築します。
`openclaw plugins update <id-or-npm-spec>` は追跡対象インストールに適用されます。dist-tag または正確なバージョンを含む npm パッケージ spec を渡すと、パッケージ名を追跡対象 Plugin レコードへ解決し直し、今後の更新用に新しい spec を記録します。バージョンなしでパッケージ名を渡すと、正確にピン留めされたインストールがレジストリのデフォルトリリースラインへ戻ります。インストール済み npm Plugin が解決済みバージョンおよび記録されたアーティファクト ID とすでに一致する場合、OpenClaw はダウンロード、再インストール、設定の書き換えを行わずに更新をスキップします。

`--pin` は npm 専用です。`--marketplace` とは併用できません。marketplace インストールは npm spec ではなく marketplace ソースメタデータを永続化するためです。

`--dangerously-force-unsafe-install` は、組み込みの危険コードスキャナーによる誤検知に対する緊急用の上書きです。これにより、組み込みの `critical` findings を超えて Plugin インストールと Plugin 更新を続行できますが、Plugin の `before_install` ポリシーブロックやスキャン失敗によるブロックは回避しません。インストールスキャンは、パッケージ化されたテストモックでブロックされるのを避けるため、`tests/`、`__tests__/`、`*.test.*`、`*.spec.*` などの一般的なテストファイルやディレクトリを無視します。ただし、宣言された Plugin ランタイムエントリポイントは、それらの名前のいずれかを使用していても引き続きスキャンされます。

この CLI フラグは Plugin のインストール/更新フローにのみ適用されます。Gateway が支える skill 依存関係インストールでは、代わりに対応する `dangerouslyForceUnsafeInstall` リクエスト上書きを使用します。一方、`openclaw skills install` は引き続き別個の ClawHub skill ダウンロード/インストールフローです。

ClawHub で公開した Plugin がスキャンによって非表示またはブロックされている場合は、ClawHub ダッシュボードを開くか、`clawhub package rescan <name>` を実行して ClawHub に再確認を依頼します。`--dangerously-force-unsafe-install` は自分のマシン上のインストールにのみ影響します。ClawHub に Plugin の再スキャンを依頼したり、ブロックされたリリースを公開状態にしたりするものではありません。

互換バンドルは、同じ Plugin list/inspect/enable/disable フローに参加します。現在のランタイムサポートには、bundle skills、Claude command-skills、Claude `settings.json` デフォルト、Claude `.lsp.json` とマニフェスト宣言 `lspServers` デフォルト、Cursor command-skills、互換 Codex フックディレクトリが含まれます。

`openclaw plugins inspect <id>` は、検出されたバンドル機能に加えて、バンドルベース Plugin のサポート対象または非サポートの MCP および LSP サーバーエントリも報告します。

Marketplace ソースには、`~/.claude/plugins/known_marketplaces.json` の Claude 既知 marketplace 名、ローカル marketplace ルートまたは `marketplace.json` パス、`owner/repo` のような GitHub 省略形、GitHub リポジトリ URL、git URL を指定できます。リモート marketplace では、Plugin エントリはクローンされた marketplace リポジトリ内に留まり、相対パスソースのみを使用する必要があります。

詳細は [`openclaw plugins` CLI リファレンス](/ja-JP/cli/plugins) を参照してください。

## Plugin API 概要

ネイティブ Plugin は `register(api)` を公開するエントリオブジェクトをエクスポートします。古い Plugin はレガシーエイリアスとして `activate(api)` をまだ使用している場合がありますが、新しい Plugin は `register` を使用する必要があります。

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

OpenClaw は Plugin の有効化中にエントリオブジェクトを読み込み、`register(api)` を呼び出します。ローダーは古い Plugin 向けに引き続き `activate(api)` へフォールバックしますが、同梱 Plugin と新しい外部 Plugin は `register` を公開コントラクトとして扱う必要があります。

`api.registrationMode` は、Plugin のエントリが読み込まれる理由を Plugin に伝えます。

| モード | 意味 |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full` | ランタイム有効化。ツール、フック、サービス、コマンド、ルート、その他のライブ副作用を登録します。 |
| `discovery` | 読み取り専用の機能検出。プロバイダーとメタデータを登録します。信頼済み Plugin のエントリコードは読み込まれる場合がありますが、ライブ副作用はスキップします。 |
| `setup-only` | 軽量なセットアップエントリを通じたチャンネルセットアップメタデータの読み込み。 |
| `setup-runtime` | ランタイムエントリも必要とするチャンネルセットアップの読み込み。 |
| `cli-metadata` | CLI コマンドメタデータの収集のみ。 |

ソケット、データベース、バックグラウンドワーカー、または長寿命クライアントを開く Plugin エントリは、それらの副作用を `api.registrationMode === "full"` でガードする必要があります。検出用の読み込みは有効化用の読み込みとは別にキャッシュされ、実行中の Gateway レジストリを置き換えません。検出は有効化を伴いませんが、インポート不要ではありません。OpenClaw はスナップショットを構築するために、信頼済み Plugin エントリまたはチャンネル Plugin モジュールを評価する場合があります。モジュールのトップレベルは軽量かつ副作用なしに保ち、ネットワーククライアント、サブプロセス、リスナー、認証情報の読み取り、サービス起動はフルランタイムパスの背後に移動してください。

一般的な登録メソッド:

| メソッド | 登録するもの |
| --------------------------------------- | --------------------------- |
| `registerProvider` | モデルプロバイダー (LLM) |
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
- `before_tool_call`: `{ block: false }` は何もせず、以前のブロックをクリアしません。
- `before_install`: `{ block: true }` は終端です。優先度の低いハンドラーはスキップされます。
- `before_install`: `{ block: false }` は何もせず、以前のブロックをクリアしません。
- `message_sending`: `{ cancel: true }` は終端です。優先度の低いハンドラーはスキップされます。
- `message_sending`: `{ cancel: false }` は何もせず、以前のキャンセルをクリアしません。

ネイティブ Codex app-server の実行では、Codex ネイティブツールイベントがこのフック面へブリッジされます。Plugin は `before_tool_call` を通じてネイティブ Codex ツールをブロックし、`after_tool_call` を通じて結果を監視し、Codex `PermissionRequest` の承認に参加できます。このブリッジは、まだ Codex ネイティブツールの引数を書き換えません。正確な Codex ランタイムサポート境界は、[Codex ハーネス v1 サポートコントラクト](/ja-JP/plugins/codex-harness#v1-support-contract)にあります。

型付きフックの完全な動作については、[SDK 概要](/ja-JP/plugins/sdk-overview#hook-decision-semantics)を参照してください。

## 関連

- [Plugin の構築](/ja-JP/plugins/building-plugins) — 独自の Plugin を作成する
- [Plugin バンドル](/ja-JP/plugins/bundles) — Codex/Claude/Cursor バンドル互換性
- [Plugin マニフェスト](/ja-JP/plugins/manifest) — マニフェストスキーマ
- [ツールの登録](/ja-JP/plugins/building-plugins#registering-agent-tools) — Plugin にエージェントツールを追加する
- [Plugin 内部構造](/ja-JP/plugins/architecture) — 機能モデルと読み込みパイプライン
- [コミュニティ Plugin](/ja-JP/plugins/community) — サードパーティ一覧
