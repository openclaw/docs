---
read_when:
    - Pluginのインストールまたは設定
    - Plugin の検出と読み込みルールを理解する
    - Codex/Claude 互換 Plugin バンドルを扱う
sidebarTitle: Install and Configure
summary: OpenClaw Plugin をインストール、設定、管理する
title: Plugins
x-i18n:
    generated_at: "2026-05-07T13:27:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: ef355ac480bce7140049f59d3d01909de2cf2fdf80ad07db62e05ee997840c81
    source_path: tools/plugin.md
    workflow: 16
---

Plugin は OpenClaw に新しい機能を追加します。対象には、チャンネル、モデルプロバイダー、
エージェントハーネス、ツール、Skills、音声、リアルタイム文字起こし、リアルタイム
音声、メディア理解、画像生成、動画生成、Web フェッチ、Web
検索などがあります。一部の Plugin は **core**（OpenClaw に同梱）であり、その他は
**external** です。ほとんどの外部 Plugin は
[ClawHub](/ja-JP/tools/clawhub) を通じて公開、検出されます。この移行が完了するまでの間、
Npm は直接インストールと、OpenClaw が所有する一時的な Plugin パッケージ群のために引き続きサポートされます。

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

  <Step title="チャットネイティブ管理">
    実行中の Gateway では、オーナー専用の `/plugins enable` と `/plugins disable` が
    Gateway 設定リローダーをトリガーします。Gateway は Plugin ランタイム
    サーフェスをプロセス内で再読み込みし、新しいエージェントターンは更新されたレジストリから
    ツールリストを再構築します。`/plugins install` は Plugin ソースコードを変更するため、
    現在のプロセスが既にインポート済みのモジュールを安全に再読み込みできるふりをするのではなく、
    Gateway が再起動を要求します。

  </Step>

  <Step title="Plugin を検証する">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json

    # If the plugin registered a CLI root, run one command from that root.
    openclaw <plugin-command> --help
    ```

    登録済みツール、サービス、Gateway
    メソッド、フック、または Plugin が所有する CLI コマンドを証明する必要がある場合は
    `--runtime` を使用します。通常の `inspect` はコールドな
    マニフェスト/レジストリチェックであり、意図的に Plugin ランタイムのインポートを避けます。

  </Step>
</Steps>

チャットネイティブ制御を使いたい場合は、`commands.plugins: true` を有効にして次を使用します。

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
`openclaw.install.allowInvalidConfigRecovery` にオプトインした Plugin 向けの、
範囲を絞った同梱 Plugin 再インストールパスです。
Gateway 起動中は、無効な Plugin 設定は他の無効な設定と同様にフェイルクローズします。
`openclaw doctor --fix` を実行すると、その Plugin エントリを無効化し、
無効な設定ペイロードを削除することで問題のある Plugin 設定を隔離できます。通常の
設定バックアップにより以前の値は保持されます。
チャンネル設定が、もはや検出できない Plugin を参照している一方で、同じ古い Plugin ID が
Plugin 設定またはインストール記録に残っている場合、Gateway 起動は警告をログに出力し、
他のすべてのチャンネルをブロックするのではなく、そのチャンネルをスキップします。
`openclaw doctor --fix` を実行すると、古いチャンネル/Plugin エントリを削除できます。古い
Plugin の証拠がない未知のチャンネルキーは引き続き検証に失敗するため、タイプミスは可視のままです。
`plugins.enabled: false` が設定されている場合、古い Plugin 参照は非アクティブとして扱われます。
Gateway 起動は Plugin の検出/読み込み作業をスキップし、`openclaw doctor` は
無効化された Plugin 設定を自動削除せずに保持します。古い Plugin ID を削除したい場合は、
doctor クリーンアップを実行する前に Plugin を再度有効にしてください。

Plugin 依存関係のインストールは、明示的なインストール/更新または
doctor 修復フロー中にのみ行われます。Gateway 起動、設定の再読み込み、ランタイム検査では、
パッケージマネージャーの実行や依存関係ツリーの修復は行いません。ローカル Plugin は
依存関係が既にインストールされている必要があります。一方、npm、git、ClawHub の Plugin は
OpenClaw の管理対象 Plugin ルート配下にインストールされます。npm 依存関係は
OpenClaw の管理対象 npm ルート内でホイストされる場合があります。インストール/更新は
信頼前にその管理対象ルートをスキャンし、アンインストールは npm を通じて npm 管理パッケージを削除します。外部 Plugin と
カスタム読み込みパスは、引き続き `openclaw plugins install` を通じてインストールする必要があります。
`openclaw plugins list --json` を使用すると、ランタイムコードをインポートしたり依存関係を修復したりせずに、
表示可能な各 Plugin の静的な `dependencyStatus` を確認できます。
インストール時ライフサイクルについては
[Plugin 依存関係解決](/ja-JP/plugins/dependency-resolution) を参照してください。

### ブロックされた Plugin パスの所有権

Plugin 診断で
`blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
と表示され、その後の設定検証で `plugin present but blocked` と表示される場合、OpenClaw は
Plugin ファイルが、それらを読み込んでいるプロセスとは異なる Unix ユーザーに所有されていることを検出しています。
Plugin 設定はそのままにし、ファイルシステムの所有権を修正するか、状態ディレクトリを所有するユーザーと同じユーザーで
OpenClaw を実行してください。

Docker インストールでは、公式イメージは `node`（uid `1000`）として実行されるため、
ホスト側でバインドマウントされた OpenClaw 設定ディレクトリとワークスペースディレクトリは、通常
uid `1000` に所有されている必要があります。

```bash
sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
```

意図的に OpenClaw を root として実行する場合は、代わりに管理対象 Plugin ルートを
root 所有権に修復してください。

```bash
sudo chown -R root:root /path/to/openclaw-config/npm
```

所有権を修正した後、永続化された Plugin レジストリが修復済みファイルと一致するように、
`openclaw doctor --fix` または
`openclaw plugins registry --refresh` を再実行してください。

npm インストールでは、`latest` や dist-tag のような可変セレクターは
インストール前に解決され、その後 OpenClaw の管理対象 npm ルート内で検証済みの正確なバージョンに固定されます。
npm 完了後、OpenClaw はインストール済みの
`package-lock.json` エントリが、解決済みバージョンと integrity に引き続き一致することを検証します。
npm が異なるパッケージメタデータを書き込んだ場合、異なる Plugin アーティファクトを受け入れるのではなく、
インストールは失敗し、管理対象パッケージはロールバックされます。
管理対象 npm ルートは OpenClaw のパッケージレベルの npm `overrides` も継承するため、
パッケージ化されたホストを保護するセキュリティ固定は、ホイストされた外部
Plugin 依存関係にも適用されます。

ソースチェックアウトは pnpm ワークスペースです。同梱 Plugin を編集するために OpenClaw をクローンした場合は、
`pnpm install` を実行してください。その後 OpenClaw は
`extensions/<id>` から同梱 Plugin を読み込むため、編集内容とパッケージローカルの依存関係が直接使用されます。
通常の npm ルートインストールは、パッケージ化された OpenClaw 向けであり、ソースチェックアウト
開発向けではありません。

## Plugin の種類

OpenClaw は 2 つの Plugin 形式を認識します。

| 形式       | 仕組み                                                             | 例                                                     |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + ランタイムモジュール。プロセス内で実行    | 公式 Plugin、コミュニティ npm パッケージ               |
| **Bundle** | Codex/Claude/Cursor 互換レイアウト。OpenClaw 機能にマッピング     | `.codex-plugin/`、`.claude-plugin/`、`.cursor-plugin/` |

どちらも `openclaw plugins list` に表示されます。バンドルの詳細については [Plugin Bundles](/ja-JP/plugins/bundles) を参照してください。

Native Plugin を作成する場合は、[Plugin の構築](/ja-JP/plugins/building-plugins)
と [Plugin SDK 概要](/ja-JP/plugins/sdk-overview) から始めてください。

## パッケージエントリポイント

Native Plugin の npm パッケージは、`package.json` で `openclaw.extensions` を宣言する必要があります。
各エントリはパッケージディレクトリ内に留まり、読み取り可能なランタイムファイル、または
`src/index.ts` から `dist/index.js` のように、推論されたビルド済み JavaScript
ピアを持つ TypeScript ソースファイルに解決される必要があります。
パッケージ化されたインストールには、その JavaScript ランタイム出力が含まれている必要があります。TypeScript
ソースのフォールバックは、ソースチェックアウトとローカル開発パス向けであり、
OpenClaw の管理対象 Plugin ルートにインストールされる npm パッケージ向けではありません。

管理対象パッケージの警告で `requires compiled runtime output for
TypeScript entry ...` と表示される場合、そのパッケージは OpenClaw が実行時に必要とする JavaScript ファイルなしで公開されています。
これは Plugin のパッケージング問題であり、ローカル設定の問題ではありません。
公開者がコンパイル済み JavaScript を再公開した後に Plugin を更新または再インストールするか、
修正済みパッケージが利用可能になるまでその Plugin を無効化/アンインストールしてください。

公開済みランタイムファイルがソースエントリと同じパスにない場合は、`openclaw.runtimeExtensions` を使用します。
存在する場合、`runtimeExtensions` にはすべての `extensions` エントリに対して
正確に 1 つずつエントリが含まれている必要があります。リストが一致しない場合、ソースパスへ暗黙にフォールバックするのではなく、
インストールと Plugin 検出が失敗します。`openclaw.setupEntry` も公開する場合は、
そのビルド済み JavaScript ピアに `openclaw.runtimeSetupEntry` を使用してください。宣言した場合、そのファイルは必須です。

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

ClawHub はほとんどの Plugin にとって主要な配布パスです。現在のパッケージ化された
OpenClaw リリースには既に多くの公式 Plugin が同梱されているため、通常のセットアップではそれらを
別途 npm インストールする必要はありません。OpenClaw 所有のすべての Plugin が
ClawHub に移行するまで、OpenClaw は古い/カスタムインストールと直接 npm ワークフロー向けに、
一部の `@openclaw/*` Plugin パッケージを npm で引き続き提供します。

npm が `@openclaw/*` Plugin パッケージを deprecated と報告する場合、そのパッケージ
バージョンは古い外部パッケージ系列のものです。新しい npm パッケージが公開されるまで、
現在の OpenClaw に同梱された Plugin またはローカルチェックアウトを使用してください。

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

### Core（OpenClaw に同梱）

<AccordionGroup>
  <Accordion title="モデルプロバイダー（デフォルトで有効）">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="メモリPlugin">
    - `memory-core` - バンドルされたメモリ検索（`plugins.slots.memory` によるデフォルト）
    - `memory-lancedb` - 自動リコール/キャプチャ付きの LanceDB バックエンド長期メモリ（`plugins.slots.memory = "memory-lancedb"` を設定）

    OpenAI 互換の埋め込み設定、Ollama の例、リコール制限、トラブルシューティングについては、[Memory LanceDB](/ja-JP/plugins/memory-lancedb) を参照してください。

  </Accordion>

  <Accordion title="音声プロバイダー（デフォルトで有効）">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="その他">
    - `browser` - ブラウザツール、`openclaw browser` CLI、`browser.request` Gateway メソッド、ブラウザランタイム、デフォルトのブラウザ制御サービス向けのバンドル済みブラウザPlugin（デフォルトで有効。置き換える前に無効化してください）
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
| `allow`            | Plugin 許可リスト（任意）                                |
| `bundledDiscovery` | バンドル済みPluginの検出モード（デフォルトは `allowlist`） |
| `deny`             | Plugin 拒否リスト（任意。拒否が優先）                    |
| `load.paths`       | 追加のPluginファイル/ディレクトリ                         |
| `slots`            | 排他的なスロットセレクター（例: `memory`, `contextEngine`） |
| `entries.\<id\>`   | Pluginごとのトグル + 設定                                 |

`plugins.allow` は排他的です。空でない場合、`tools.allow` に `"*"` または特定のPlugin所有ツール名が含まれていても、リストされたPluginだけがロードまたはツール公開できます。ツール許可リストがPluginツールを参照している場合は、所有元のPlugin IDを `plugins.allow` に追加するか、`plugins.allow` を削除してください。`openclaw doctor` はこの形について警告します。

新しい設定では、`plugins.bundledDiscovery` のデフォルトは `"allowlist"` です。そのため、制限的な `plugins.allow` インベントリは、実行時の Web 検索プロバイダー検出を含む、省略されたバンドル済みプロバイダーPluginもブロックします。Doctor は移行中に古い制限的な許可リスト設定へ `"compat"` を刻印するため、オペレーターがより厳格なモードを選択するまで、アップグレード後も従来のバンドル済みプロバイダー動作が維持されます。空の `plugins.allow` は引き続き未設定/オープンとして扱われます。

`/plugins enable` または `/plugins disable` による設定変更は、プロセス内の Gateway Plugin リロードをトリガーします。新しいエージェントターンは、更新されたPluginレジストリからツール一覧を再構築します。install、update、uninstall のようなソース変更操作では、すでにインポートされたPluginモジュールを安全にその場で置き換えられないため、引き続き Gateway プロセスを再起動します。

`openclaw plugins list` はローカルのPluginレジストリ/設定スナップショットです。そこで `enabled` のPluginは、永続化されたレジストリと現在の設定がそのPluginの参加を許可していることを意味します。すでに実行中のリモート Gateway が同じPluginコードへリロードまたは再起動済みであることを証明するものではありません。ラッパープロセスを持つ VPS/コンテナ構成では、実際の `openclaw gateway run` プロセスへ再起動またはリロードをトリガーする書き込みを送るか、リロードが失敗を報告した場合は実行中の Gateway に対して `openclaw gateway restart` を使用してください。

<Accordion title="Plugin の状態: 無効 vs 欠落 vs 無効">
  - **無効**: Pluginは存在しますが、有効化ルールによってオフになっています。設定は保持されます。
  - **欠落**: 設定が、検出で見つからなかったPlugin IDを参照しています。
  - **無効**: Pluginは存在しますが、その設定が宣言されたスキーマと一致しません。Gateway 起動時はそのPluginだけをスキップします。`openclaw doctor --fix` は、無効化して設定ペイロードを削除することで、無効なエントリを隔離できます。

</Accordion>

## 検出と優先順位

OpenClaw は次の順序でPluginをスキャンします（最初に一致したものが優先）:

<Steps>
  <Step title="設定パス">
    `plugins.load.paths` - 明示的なファイルまたはディレクトリパス。OpenClaw 自身のパッケージ化されたバンドル済みPluginディレクトリを指すパスは無視されます。これらの古いエイリアスを削除するには `openclaw doctor --fix` を実行してください。
  </Step>

  <Step title="ワークスペースPlugin">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` と `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`。
  </Step>

  <Step title="グローバルPlugin">
    `~/.openclaw/<plugin-root>/*.ts` と `~/.openclaw/<plugin-root>/*/index.ts`。
  </Step>

  <Step title="バンドル済みPlugin">
    OpenClaw に同梱されています。多くはデフォルトで有効です（モデルプロバイダー、音声）。その他は明示的な有効化が必要です。
  </Step>
</Steps>

パッケージ化されたインストールと Docker イメージでは、通常、コンパイル済みの `dist/extensions` ツリーからバンドル済みPluginを解決します。たとえば `/app/extensions/synology-chat` のように、バンドル済みPluginのソースディレクトリが一致するパッケージ化済みソースパスへバインドマウントされている場合、OpenClaw はそのマウントされたソースディレクトリをバンドル済みソースオーバーレイとして扱い、パッケージ化された `/app/dist/extensions/synology-chat` バンドルより先に検出します。これにより、保守担当者のコンテナループは、すべてのバンドル済みPluginを TypeScript ソースへ戻さずに動作し続けます。ソースオーバーレイマウントが存在する場合でもパッケージ化された dist バンドルを強制するには、`OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1` を設定してください。

### 有効化ルール

- `plugins.enabled: false` はすべてのPluginを無効化し、Pluginの検出/ロード作業をスキップします
- `plugins.deny` は常に allow より優先されます
- `plugins.entries.\<id\>.enabled: false` はそのPluginを無効化します
- ワークスペース由来のPluginは**デフォルトで無効**です（明示的に有効化する必要があります）
- バンドル済みPluginは、上書きされない限り、組み込みのデフォルトオンセットに従います
- 排他的スロットは、そのスロットで選択されたPluginを強制的に有効化できます
- 一部のオプトイン型バンドル済みPluginは、設定がプロバイダーモデル参照、チャンネル設定、ハーネスランタイムなどのPlugin所有サーフェスを名指しすると自動的に有効化されます
- `plugins.enabled: false` が有効な間、古いPlugin設定は保持されます。古い ID を削除したい場合は、doctor クリーンアップを実行する前にPluginを再有効化してください
- OpenAI ファミリーの Codex ルートは個別のPlugin境界を維持します:
  `openai-codex/*` は OpenAI Plugin に属し、バンドル済み Codex app-server Plugin は `agentRuntime.id: "codex"` またはレガシーの `codex/*` モデル参照によって選択されます

## ランタイムフックのトラブルシューティング

Pluginが `plugins list` に表示されるのに、ライブチャットトラフィックで `register(api)` の副作用やフックが実行されない場合は、まず次を確認してください:

- `openclaw gateway status --deep --require-rpc` を実行し、アクティブな Gateway URL、プロファイル、設定パス、プロセスが編集対象と一致していることを確認します。
- Pluginのインストール/設定/コード変更後にライブ Gateway を再起動します。ラッパーコンテナでは、PID 1 は単なるスーパーバイザーである場合があります。子の `openclaw gateway run` プロセスを再起動するか、シグナルを送ってください。
- フック登録と診断を確認するには、`openclaw plugins inspect <id> --runtime --json` を使用します。`before_model_resolve`、`before_agent_reply`、`before_agent_run`、`llm_input`、`llm_output`、`before_agent_finalize`、`agent_end` などの非バンドル会話フックには、`plugins.entries.<id>.hooks.allowConversationAccess=true` が必要です。
- モデル切り替えには `before_model_resolve` を推奨します。これはエージェントターンのモデル解決前に実行されます。`llm_output` はモデル試行がアシスタント出力を生成した後にのみ実行されます。
- 有効なセッションモデルの証明には、`openclaw sessions` または Gateway のセッション/ステータスサーフェスを使用します。プロバイダーペイロードをデバッグする場合は、`--raw-stream --raw-stream-path <path>` 付きで Gateway を起動してください。

### 遅いPluginツールセットアップ

エージェントターンがツール準備中に停止しているように見える場合は、トレースログを有効化し、Pluginツールファクトリのタイミング行を確認してください:

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

次を探します:

```text
[trace:plugin-tools] factory timings ...
```

サマリーには、合計ファクトリ時間と最も遅いPluginツールファクトリが表示されます。これには、Plugin ID、宣言されたツール名、結果の形状、ツールが任意かどうかが含まれます。単一のファクトリが少なくとも 1s かかるか、Pluginツールファクトリ準備の合計が少なくとも 5s かかる場合、遅い行は警告へ昇格されます。

OpenClaw は、同じ有効なリクエストコンテキストで繰り返し解決される成功済みPluginツールファクトリ結果をキャッシュします。キャッシュキーには、有効なランタイム設定、ワークスペース、エージェント/セッション ID、サンドボックスポリシー、ブラウザ設定、配信コンテキスト、リクエスター ID、所有状態が含まれます。そのため、これらの信頼されたフィールドに依存するファクトリは、コンテキストが変わると再実行されます。

1 つのPluginがタイミングを支配している場合は、そのランタイム登録を確認してください:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

その後、そのPluginを更新、再インストール、または無効化します。Plugin作者は、高コストな依存関係のロードをツールファクトリ内で行うのではなく、ツール実行パスの背後へ移動する必要があります。

### 重複したチャンネルまたはツール所有権

症状:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

これは、複数の有効なPluginが同じチャンネル、セットアップフロー、またはツール名を所有しようとしていることを意味します。最も一般的な原因は、同じチャンネル ID を提供するようになったバンドル済みPluginの横に、外部チャンネルPluginがインストールされていることです。

デバッグ手順:

- `openclaw plugins list --enabled --verbose` を実行し、有効なすべてのPluginと由来を確認します。
- 疑わしい各Pluginに対して `openclaw plugins inspect <id> --runtime --json` を実行し、`channels`、`channelConfigs`、`tools`、診断を比較します。
- Pluginパッケージのインストールまたは削除後に `openclaw plugins registry --refresh` を実行し、永続化されたメタデータが現在のインストールを反映するようにします。
- インストール、レジストリ、または設定変更後に Gateway を再起動します。

修正オプション:

- あるPluginが同じチャンネル ID で別のPluginを意図的に置き換える場合、優先するPluginは、優先度の低いPlugin ID を指定して `channelConfigs.<channel-id>.preferOver` を宣言する必要があります。[/plugins/manifest#replacing-another-channel-plugin](/ja-JP/plugins/manifest#replacing-another-channel-plugin) を参照してください。
- 重複が偶発的な場合は、`plugins.entries.<plugin-id>.enabled: false` で片方を無効化するか、古いPluginインストールを削除します。
- 両方のPluginを明示的に有効化した場合、OpenClaw はそのリクエストを保持し、競合を報告します。チャンネルの所有者を 1 つ選ぶか、Plugin所有ツールの名前を変更して、ランタイムサーフェスが曖昧にならないようにしてください。

## Pluginスロット（排他的カテゴリ）

一部のカテゴリは排他的です（一度に有効なのは 1 つだけ）:

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

| スロット        | 制御内容              | デフォルト          |
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

バンドル済みのPluginはOpenClawに同梱されています。多くはデフォルトで有効化されています（たとえば、バンドル済みモデルプロバイダー、バンドル済み音声プロバイダー、バンドル済みブラウザーPlugin）。その他のバンドル済みPluginは、引き続き `openclaw plugins enable <id>` が必要です。

`--force` は、既存のインストール済みPluginまたはフックパックをその場で上書きします。追跡対象のnpm Pluginの通常のアップグレードには `openclaw plugins update <id-or-npm-spec>` を使用してください。これは、管理対象のインストール先にコピーする代わりにソースパスを再利用する `--link` とは併用できません。

`plugins.allow` がすでに設定されている場合、`openclaw plugins install` はインストールしたPlugin IDを、有効化する前にその許可リストへ追加します。同じPlugin IDが `plugins.deny` に存在する場合、installはその古いdenyエントリを削除し、明示的にインストールしたPluginが再起動後すぐに読み込み可能になるようにします。

OpenClawは、Pluginインベントリ、コントリビューションの所有関係、起動計画のコールドリードモデルとして、永続化されたローカルPluginレジストリを保持します。install、update、uninstall、enable、disableの各フローは、Pluginの状態を変更した後にそのレジストリを更新します。同じ `plugins/installs.json` ファイルは、トップレベルの `installRecords` に永続的なインストールメタデータを、`plugins` に再構築可能なマニフェストメタデータを保持します。レジストリが存在しない、古い、または無効な場合、`openclaw plugins registry --refresh` はPluginランタイムモジュールを読み込まずに、インストールレコード、設定ポリシー、マニフェスト/パッケージメタデータからマニフェストビューを再構築します。

Nixモード（`OPENCLAW_NIX_MODE=1`）では、Pluginライフサイクルのミューテーターは無効化されます。代わりに、そのインストールのNixソースを通じてPluginパッケージの選択と設定を管理してください。nix-openclawについては、agent-firstの[クイックスタート](https://github.com/openclaw/nix-openclaw#quick-start)から始めてください。`openclaw plugins update <id-or-npm-spec>` は追跡対象のインストールに適用されます。dist-tagまたは正確なバージョンを含むnpmパッケージ仕様を渡すと、パッケージ名を追跡対象のPluginレコードへ解決し直し、今後の更新用に新しい仕様を記録します。バージョンなしのパッケージ名を渡すと、正確に固定されたインストールをレジストリのデフォルトリリースラインへ戻します。インストール済みのnpm Pluginが、解決済みバージョンおよび記録済みアーティファクトIDとすでに一致している場合、OpenClawはダウンロード、再インストール、設定の書き換えを行わずに更新をスキップします。`openclaw update` がベータチャネルで実行されると、デフォルトラインのnpmおよびClawHub Pluginレコードは最初に `@beta` を試し、Pluginのベータリリースが存在しない場合はdefault/latestへフォールバックします。正確なバージョンと明示的なタグは固定されたままです。

`--pin` はnpm専用です。マーケットプレイスのインストールはnpm仕様ではなくマーケットプレイスソースメタデータを永続化するため、`--marketplace` とは併用できません。

`--dangerously-force-unsafe-install` は、組み込みの危険コードスキャナーによる誤検知に対する緊急回避オーバーライドです。これにより、組み込みの `critical` 検出を越えてPluginのインストールとPluginの更新を続行できますが、Pluginの `before_install` ポリシーブロックやスキャン失敗によるブロックはバイパスしません。インストールスキャンは、パッケージ化されたテストモックによるブロックを避けるため、`tests/`、`__tests__/`、`*.test.*`、`*.spec.*` などの一般的なテストファイルとディレクトリを無視します。ただし、宣言済みのPluginランタイムエントリポイントは、それらの名前のいずれかを使用している場合でもスキャンされます。

このCLIフラグは、Pluginのインストール/更新フローにのみ適用されます。Gatewayを利用するSkills依存関係のインストールでは、代わりに対応する `dangerouslyForceUnsafeInstall` リクエストオーバーライドを使用します。一方、`openclaw skills install` は別個のClawHub Skillダウンロード/インストールフローのままです。

ClawHubで公開したPluginがスキャンにより非表示またはブロックされている場合は、ClawHubダッシュボードを開くか、`clawhub package rescan <name>` を実行してClawHubに再チェックを依頼してください。`--dangerously-force-unsafe-install` は自分のマシン上のインストールにのみ影響します。ClawHubにPluginの再スキャンを依頼したり、ブロックされたリリースを公開したりするものではありません。

互換バンドルは、同じPlugin list/inspect/enable/disableフローに参加します。現在のランタイムサポートには、バンドルSkills、ClaudeコマンドSkills、Claude `settings.json` デフォルト、Claude `.lsp.json` およびマニフェスト宣言の `lspServers` デフォルト、CursorコマンドSkills、互換性のあるCodexフックディレクトリが含まれます。

`openclaw plugins inspect <id>` は、バンドル支援Pluginについて、検出されたバンドル機能に加えて、サポート対象または非サポートのMCPおよびLSPサーバーエントリも報告します。

マーケットプレイスソースには、`~/.claude/plugins/known_marketplaces.json` にあるClaude既知マーケットプレイス名、ローカルマーケットプレイスルートまたは `marketplace.json` パス、`owner/repo` のようなGitHub短縮表記、GitHubリポジトリURL、またはgit URLを指定できます。リモートマーケットプレイスでは、Pluginエントリはクローンされたマーケットプレイスリポジトリ内にとどまり、相対パスソースのみを使用する必要があります。

完全な詳細については、[`openclaw plugins` CLIリファレンス](/ja-JP/cli/plugins)を参照してください。

## Plugin APIの概要

ネイティブPluginは、`register(api)` を公開するエントリオブジェクトをエクスポートします。古いPluginではレガシーエイリアスとして `activate(api)` を引き続き使用している場合がありますが、新しいPluginでは `register` を使用してください。

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

OpenClawはPluginのアクティベーション中にエントリオブジェクトを読み込み、`register(api)` を呼び出します。ローダーは古いPlugin向けに `activate(api)` へ引き続きフォールバックしますが、バンドル済みPluginと新しい外部Pluginは `register` を公開契約として扱うべきです。

`api.registrationMode` は、Pluginのエントリが読み込まれている理由をPluginに伝えます。

| モード | 意味 |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full` | ランタイムアクティベーション。ツール、フック、サービス、コマンド、ルート、その他のライブ副作用を登録します。 |
| `discovery` | 読み取り専用の機能検出。プロバイダーとメタデータを登録します。信頼済みPluginエントリコードは読み込まれる場合がありますが、ライブ副作用はスキップします。 |
| `setup-only` | 軽量なセットアップエントリを通じたチャネルセットアップメタデータの読み込み。 |
| `setup-runtime` | ランタイムエントリも必要とするチャネルセットアップの読み込み。 |
| `cli-metadata` | CLIコマンドメタデータの収集のみ。 |

ソケット、データベース、バックグラウンドワーカー、または長寿命クライアントを開くPluginエントリは、それらの副作用を `api.registrationMode === "full"` でガードする必要があります。検出読み込みはアクティベーション読み込みとは別にキャッシュされ、実行中のGatewayレジストリを置き換えません。検出は非アクティベーションですが、インポート不要ではありません。OpenClawはスナップショットを構築するため、信頼済みPluginエントリまたはチャネルPluginモジュールを評価する場合があります。モジュールのトップレベルは軽量かつ副作用なしに保ち、ネットワーククライアント、サブプロセス、リスナー、認証情報の読み取り、サービス起動はフルランタイムパスの背後へ移動してください。

一般的な登録メソッド:

| メソッド | 登録対象 |
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

- `before_tool_call`: `{ block: true }` は終端です。優先度の低いハンドラーはスキップされます。
- `before_tool_call`: `{ block: false }` は何もせず、以前のブロックを解除しません。
- `before_install`: `{ block: true }` は終端です。優先度の低いハンドラーはスキップされます。
- `before_install`: `{ block: false }` は何もせず、以前のブロックを解除しません。
- `message_sending`: `{ cancel: true }` は終端です。優先度の低いハンドラーはスキップされます。
- `message_sending`: `{ cancel: false }` は何もせず、以前のキャンセルを解除しません。

ネイティブ Codex app-server の実行は、Codex ネイティブのツールイベントをこの
フックサーフェスへブリッジして戻します。Plugin は `before_tool_call` を通じて
ネイティブ Codex ツールをブロックし、`after_tool_call` を通じて結果を観察し、
Codex `PermissionRequest` の承認に参加できます。このブリッジは、Codex ネイティブのツール
引数をまだ書き換えません。正確な Codex ランタイムサポートの境界は
[Codex ハーネス v1 サポート契約](/ja-JP/plugins/codex-harness#v1-support-contract)にあります。

完全な型付きフックの動作については、[SDK 概要](/ja-JP/plugins/sdk-overview#hook-decision-semantics)を参照してください。

## 関連

- [Plugin の構築](/ja-JP/plugins/building-plugins) - 独自の Plugin を作成する
- [Plugin バンドル](/ja-JP/plugins/bundles) - Codex/Claude/Cursor バンドル互換性
- [Plugin マニフェスト](/ja-JP/plugins/manifest) - マニフェストスキーマ
- [ツールの登録](/ja-JP/plugins/building-plugins#registering-agent-tools) - Plugin にエージェントツールを追加する
- [Plugin の内部構造](/ja-JP/plugins/architecture) - ケイパビリティモデルとロードパイプライン
- [コミュニティ Plugin](/ja-JP/plugins/community) - サードパーティの一覧
