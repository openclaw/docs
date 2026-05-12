---
read_when:
    - プラグインのインストールまたは設定
    - Plugin の検出と読み込みルールを理解する
    - Codex/Claude 互換 Plugin バンドルの扱い
sidebarTitle: Install and Configure
summary: OpenClaw Plugin をインストール、設定、管理する
title: Plugin
x-i18n:
    generated_at: "2026-05-12T08:46:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: e8773fc3feb19c867b1978f21d83f1cad1752d5a2572ad607d481539ad7471df
    source_path: tools/plugin.md
    workflow: 16
---

Plugin は、新しい機能で OpenClaw を拡張します。チャンネル、モデルプロバイダー、
エージェントハーネス、ツール、Skills、音声、リアルタイム文字起こし、リアルタイム
音声、メディア理解、画像生成、動画生成、Web 取得、Web
検索などがあります。一部の Plugin は **コア**（OpenClaw に同梱）で、その他は
**外部**です。ほとんどの外部 Plugin は [ClawHub](/ja-JP/clawhub) を通じて公開および検出されます。Npm は直接インストール、およびその移行が完了するまでの間の一時的な OpenClaw 所有 Plugin パッケージ群に対して、引き続きサポートされます。

## クイックスタート

コピーして貼り付けられるインストール、一覧表示、アンインストール、更新、公開の例については、
[Plugin を管理する](/ja-JP/plugins/manage-plugins) を参照してください。

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

    その後、設定ファイルの `plugins.entries.\<id\>.config` 配下で設定します。

  </Step>

  <Step title="Chat-native management">
    実行中の Gateway では、所有者専用の `/plugins enable` と `/plugins disable` が
    Gateway 設定リローダーをトリガーします。Gateway はプロセス内で Plugin ランタイム
    サーフェスを再読み込みし、新しいエージェントターンは更新されたレジストリから
    ツール一覧を再構築します。`/plugins install` は Plugin ソースコードを変更するため、
    Gateway は現在のプロセスがすでにインポート済みのモジュールを安全に再読み込みできるかのように
    振る舞うのではなく、再起動を要求します。

  </Step>

  <Step title="Verify the plugin">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json

    # If the plugin registered a CLI root, run one command from that root.
    openclaw <plugin-command> --help
    ```

    登録済みのツール、サービス、Gateway
    メソッド、フック、または Plugin 所有の CLI コマンドを証明する必要がある場合は
    `--runtime` を使用します。通常の `inspect` はコールドな
    マニフェスト/レジストリ確認であり、意図的に Plugin ランタイムのインポートを避けます。

  </Step>
</Steps>

チャットネイティブ制御を好む場合は、`commands.plugins: true` を有効にして、次を使用します。

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

インストールパスは CLI と同じリゾルバーを使用します。ローカルパス/アーカイブ、明示的な
`clawhub:<pkg>`、明示的な `npm:<pkg>`、明示的な `npm-pack:<path.tgz>`、
明示的な `git:<repo>`、または npm 経由の裸のパッケージ指定です。

設定が無効な場合、インストールは通常フェイルクローズし、
`openclaw doctor --fix` を案内します。唯一の回復例外は、
`openclaw.install.allowInvalidConfigRecovery` にオプトインしている Plugin のための、
狭い同梱 Plugin 再インストールパスです。
Gateway 起動中、無効な Plugin 設定は他の無効な設定と同様にフェイルクローズします。
`openclaw doctor --fix` を実行すると、その Plugin エントリを無効化し、
無効な設定ペイロードを削除することで不正な Plugin 設定を隔離できます。通常の
設定バックアップにより、以前の値は保持されます。
チャンネル設定が、もはや検出できない Plugin を参照しているが、同じ古い Plugin ID が
Plugin 設定またはインストール記録に残っている場合、Gateway 起動は警告をログに記録し、
他のすべてのチャンネルをブロックする代わりにそのチャンネルをスキップします。
`openclaw doctor --fix` を実行して、古いチャンネル/Plugin エントリを削除します。
古い Plugin の証拠がない不明なチャンネルキーは引き続き検証に失敗するため、
タイプミスは見える状態に保たれます。
`plugins.enabled: false` が設定されている場合、古い Plugin 参照は不活性として扱われます。
Gateway 起動は Plugin の検出/読み込み作業をスキップし、`openclaw doctor` は
無効化された Plugin 設定を自動削除せずに保持します。古い Plugin ID を削除したい場合は、
doctor クリーンアップを実行する前に Plugin を再度有効にしてください。

Plugin 依存関係のインストールは、明示的なインストール/更新または doctor 修復フロー中にのみ発生します。
Gateway 起動、設定の再読み込み、ランタイム検査は、パッケージマネージャーを実行したり
依存関係ツリーを修復したりしません。ローカル Plugin は依存関係がすでにインストールされている必要があります。一方で npm、git、ClawHub Plugin は OpenClaw の管理対象 Plugin ルート配下にインストールされます。npm 依存関係は OpenClaw の管理対象 npm ルート内で巻き上げられることがあります。インストール/更新は信頼の前にその管理対象ルートをスキャンし、アンインストールは npm 管理パッケージを npm 経由で削除します。外部 Plugin とカスタム読み込みパスも、引き続き `openclaw plugins install` でインストールする必要があります。
`openclaw plugins list --json` を使用すると、ランタイムコードをインポートしたり依存関係を修復したりせずに、表示可能な各
Plugin の静的な `dependencyStatus` を確認できます。
インストール時ライフサイクルについては、[Plugin 依存関係の解決](/ja-JP/plugins/dependency-resolution) を参照してください。

### ブロックされた Plugin パスの所有権

Plugin 診断が
`blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
と表示し、設定検証が続けて `plugin present but blocked` と表示する場合、OpenClaw は、
Plugin ファイルが、それらを読み込んでいるプロセスとは異なる Unix ユーザーによって所有されていることを検出しました。
Plugin 設定はそのままにし、ファイルシステムの所有権を修正するか、状態ディレクトリを所有する同じユーザーとして
OpenClaw を実行してください。

Docker インストールの場合、公式イメージは `node`（uid `1000`）として実行されるため、
ホストでバインドマウントされた OpenClaw 設定ディレクトリとワークスペースディレクトリは、
通常 uid `1000` が所有している必要があります。

```bash
sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
```

OpenClaw を意図的に root として実行する場合は、代わりに管理対象 Plugin ルートの所有権を
root に修復します。

```bash
sudo chown -R root:root /path/to/openclaw-config/npm
```

所有権を修正した後、`openclaw doctor --fix` または
`openclaw plugins registry --refresh` を再実行し、永続化された Plugin レジストリが
修復済みファイルと一致するようにします。

npm インストールの場合、`latest` や dist-tag などの可変セレクターは、
インストール前に解決され、その後 OpenClaw の管理対象 npm ルート内で正確に検証済みのバージョンへ固定されます。
npm の完了後、OpenClaw はインストール済みの
`package-lock.json` エントリが、解決済みバージョンおよび integrity と引き続き一致することを検証します。npm が異なるパッケージメタデータを書き込んだ場合、異なる Plugin アーティファクトを受け入れるのではなく、インストールは失敗し、管理対象パッケージはロールバックされます。
管理対象 npm ルートは OpenClaw のパッケージレベルの npm `overrides` も継承するため、
パッケージ化されたホストを保護するセキュリティピンは、巻き上げられた外部
Plugin 依存関係にも適用されます。

ソースチェックアウトは pnpm ワークスペースです。OpenClaw をクローンして同梱
Plugin を編集する場合は、`pnpm install` を実行してください。その後 OpenClaw は
`extensions/<id>` から同梱 Plugin を読み込むため、編集内容とパッケージローカルの依存関係が直接使用されます。
通常の npm ルートインストールは、パッケージ化された OpenClaw 向けであり、ソースチェックアウト開発向けではありません。

## Plugin の種類

OpenClaw は 2 つの Plugin 形式を認識します。

| 形式       | 仕組み                                                             | 例                                                     |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **ネイティブ** | `openclaw.plugin.json` + ランタイムモジュール。プロセス内で実行します | 公式 Plugin、コミュニティ npm パッケージ               |
| **バンドル** | Codex/Claude/Cursor 互換レイアウト。OpenClaw 機能にマッピングされます | `.codex-plugin/`、`.claude-plugin/`、`.cursor-plugin/` |

どちらも `openclaw plugins list` 配下に表示されます。バンドルの詳細は [Plugin バンドル](/ja-JP/plugins/bundles) を参照してください。

ネイティブ Plugin を作成する場合は、[Plugin の構築](/ja-JP/plugins/building-plugins)
と [Plugin SDK 概要](/ja-JP/plugins/sdk-overview) から始めてください。

## パッケージエントリポイント

ネイティブ Plugin npm パッケージは、`package.json` で `openclaw.extensions` を宣言する必要があります。
各エントリはパッケージディレクトリ内にとどまり、読み取り可能な
ランタイムファイル、または `src/index.ts` から `dist/index.js` のように推定されるビルド済み JavaScript
ピアを持つ TypeScript ソースファイルに解決される必要があります。
パッケージ化されたインストールには、その JavaScript ランタイム出力が含まれている必要があります。TypeScript
ソースフォールバックは、ソースチェックアウトとローカル開発パス向けであり、
OpenClaw の管理対象 Plugin ルートにインストールされた npm パッケージ向けではありません。

グローバル拡張ルートに置かれた未追跡ディレクトリは、ローカルソースチェックアウトとして扱われ、
TypeScript エントリを直接読み込むことがあります。`installPath` や `sourcePath` を含め、
インストール記録によってまだ名前付けされているディレクトリは管理対象のままであり、グローバルスキャンがそれらを見つけた場合でも、コンパイル済み出力要件を維持します。管理対象インストールを未追跡のローカルチェックアウトに意図的に変換する場合は、まずアンインストールまたは doctor クリーンアップで古いインストール記録を削除してください。

管理対象パッケージの警告が `requires compiled runtime output for
TypeScript entry ...` と表示する場合、そのパッケージは OpenClaw がランタイムで必要とする JavaScript ファイルなしで公開されています。
これは Plugin パッケージングの問題であり、ローカル設定の問題ではありません。
公開者がコンパイル済み JavaScript を再公開した後に Plugin を更新または再インストールするか、
修正版パッケージが利用可能になるまでその Plugin を無効化/アンインストールしてください。

公開済みランタイムファイルがソースエントリと同じパスにない場合は、`openclaw.runtimeExtensions` を使用します。
存在する場合、`runtimeExtensions` にはすべての `extensions` エントリに対して
正確に 1 つのエントリが含まれている必要があります。一致しないリストは、ソースパスに黙ってフォールバックするのではなく、インストールと
Plugin 検出を失敗させます。`openclaw.setupEntry` も公開する場合は、そのビルド済み
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

ClawHub はほとんどの Plugin の主要な配布経路です。現在のパッケージ化された
OpenClaw リリースには、すでに多くの公式 Plugin が同梱されているため、通常のセットアップではそれらを別途
npm インストールする必要はありません。すべての OpenClaw 所有 Plugin が
ClawHub に移行するまで、OpenClaw は古い/カスタムインストールおよび直接 npm ワークフロー向けに、一部の `@openclaw/*` Plugin パッケージを
npm で引き続き提供します。

npm が `@openclaw/*` Plugin パッケージを deprecated と報告する場合、そのパッケージバージョンは古い外部パッケージ系列のものです。新しい npm パッケージが公開されるまで、現在の OpenClaw に同梱された Plugin またはローカルチェックアウトを使用してください。

| Plugin          | パッケージ                 | ドキュメント                             |
| --------------- | -------------------------- | ---------------------------------------- |
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
    - `memory-core` - バンドルされたメモリ検索（`plugins.slots.memory` 経由のデフォルト）
    - `memory-lancedb` - 自動リコール/キャプチャ付きの LanceDB ベースの長期メモリ（`plugins.slots.memory = "memory-lancedb"` を設定）

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

サードパーティー Plugin を探していますか？[ClawHub](/ja-JP/clawhub) を参照してください。

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
| `bundledDiscovery` | バンドル Plugin の検出モード（デフォルトは `allowlist`）  |
| `deny`             | Plugin 拒否リスト（任意。拒否が優先）                    |
| `load.paths`       | 追加の Plugin ファイル/ディレクトリ                      |
| `slots`            | 排他的なスロットセレクター（例: `memory`, `contextEngine`） |
| `entries.\<id\>`   | Plugin ごとのトグル + 設定                               |

`plugins.allow` は排他的です。空でない場合、`tools.allow` に `"*"` または特定の Plugin 所有ツール名が含まれていても、一覧にある Plugin だけが読み込まれるかツールを公開できます。ツール許可リストが Plugin ツールを参照している場合は、所有元の Plugin ID を `plugins.allow` に追加するか、`plugins.allow` を削除してください。`openclaw doctor` はこの形について警告します。

新しい設定では、`plugins.bundledDiscovery` のデフォルトは `"allowlist"` です。そのため、制限的な `plugins.allow` インベントリは、ランタイムの Web 検索プロバイダー検出を含め、省略されたバンドル済みプロバイダー Plugin もブロックします。doctor は移行時に、古い制限的な許可リスト設定へ `"compat"` を刻印します。これにより、オペレーターがより厳格なモードを選択するまで、アップグレード後もレガシーのバンドル済みプロバイダー動作が維持されます。空の `plugins.allow` は引き続き未設定/オープンとして扱われます。

`/plugins enable` または `/plugins disable` 経由で行われた設定変更は、プロセス内の Gateway Plugin リロードをトリガーします。新しいエージェントターンは、更新された Plugin レジストリからツールリストを再構築します。インストール、更新、アンインストールなどのソース変更操作では、すでにインポート済みの Plugin モジュールをその場で安全に置き換えられないため、引き続き Gateway プロセスを再起動します。

`openclaw plugins list` はローカルの Plugin レジストリ/設定スナップショットです。そこで `enabled` の Plugin は、永続化されたレジストリと現在の設定が、その Plugin の参加を許可していることを意味します。すでに実行中のリモート Gateway が同じ Plugin コードへリロードまたは再起動済みであることは証明しません。ラッパープロセスを使う VPS/コンテナー構成では、実際の `openclaw gateway run` プロセスに再起動またはリロードをトリガーする書き込みを送るか、リロードが失敗を報告する場合は実行中の Gateway に対して `openclaw gateway restart` を使用してください。

<Accordion title="Plugin の状態: 無効、欠落、無効な設定">
  - **無効**: Plugin は存在しますが、有効化ルールによってオフになっています。設定は保持されます。
  - **欠落**: 設定が、検出で見つからなかった Plugin ID を参照しています。
  - **無効な設定**: Plugin は存在しますが、その設定が宣言されたスキーマと一致していません。Gateway 起動時はその Plugin だけをスキップします。`openclaw doctor --fix` は、その項目を無効化して設定ペイロードを削除することで、無効な項目を隔離できます。

</Accordion>

## 検出と優先順位

OpenClaw は次の順序で Plugin をスキャンします（最初の一致が優先されます）。

<Steps>
  <Step title="設定パス">
    `plugins.load.paths` - 明示的なファイルまたはディレクトリパス。OpenClaw 自身のパッケージ済みバンドル Plugin ディレクトリを指し戻すパスは無視されます。古いエイリアスを削除するには `openclaw doctor --fix` を実行してください。
  </Step>

  <Step title="ワークスペース Plugin">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` と `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`。
  </Step>

  <Step title="グローバル Plugin">
    `~/.openclaw/<plugin-root>/*.ts` と `~/.openclaw/<plugin-root>/*/index.ts`。
  </Step>

  <Step title="バンドル Plugin">
    OpenClaw と一緒に出荷されます。多くはデフォルトで有効です（モデルプロバイダー、音声）。その他は明示的な有効化が必要です。
  </Step>
</Steps>

パッケージ済みインストールと Docker イメージでは、通常、コンパイル済みの `dist/extensions` ツリーからバンドル Plugin を解決します。バンドル Plugin のソースディレクトリが、一致するパッケージ済みソースパスの上にバインドマウントされている場合、たとえば `/app/extensions/synology-chat` の場合、OpenClaw はそのマウントされたソースディレクトリをバンドルソースオーバーレイとして扱い、パッケージ済みの `/app/dist/extensions/synology-chat` バンドルより前に検出します。これにより、すべてのバンドル Plugin を TypeScript ソースに戻さなくても、メンテナーのコンテナーループが機能します。ソースオーバーレイマウントが存在する場合でもパッケージ済み dist バンドルを強制するには、`OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1` を設定してください。

### 有効化ルール

- `plugins.enabled: false` はすべての Plugin を無効化し、Plugin の検出/読み込み作業をスキップします
- `plugins.deny` は常に許可より優先されます
- `plugins.entries.\<id\>.enabled: false` はその Plugin を無効化します
- ワークスペース由来の Plugin は **デフォルトで無効** です（明示的に有効化する必要があります）
- バンドル Plugin は、上書きされない限り、組み込みのデフォルトオンセットに従います
- 排他的スロットは、そのスロットに選択された Plugin を強制的に有効化できます
- 一部のバンドル済みオプトイン Plugin は、プロバイダーモデル参照、チャンネル設定、ハーネスランタイムなど、設定で Plugin 所有サーフェスの名前が指定されると自動的に有効化されます
- `plugins.enabled: false` が有効な間、古い Plugin 設定は保持されます。古い ID を削除したい場合は、doctor クリーンアップを実行する前に Plugin を再有効化してください
- OpenAI ファミリーの Codex ルートは個別の Plugin 境界を維持します。`openai-codex/*` は OpenAI Plugin に属し、バンドル済み Codex アプリサーバー Plugin は、正規の `openai/*` エージェント参照、明示的な provider/model `agentRuntime.id: "codex"`、またはレガシーの `codex/*` モデル参照によって選択されます

## ランタイムフックのトラブルシューティング

Plugin が `plugins list` に表示されているにもかかわらず、ライブチャットトラフィックで `register(api)` の副作用やフックが実行されない場合は、まず次を確認してください。

- `openclaw gateway status --deep --require-rpc` を実行し、アクティブな Gateway URL、プロファイル、設定パス、プロセスが編集対象のものであることを確認します。
- Plugin のインストール/設定/コード変更後に、ライブ Gateway を再起動します。ラッパーコンテナーでは、PID 1 はスーパーバイザーにすぎない場合があります。子の `openclaw gateway run` プロセスを再起動するかシグナルを送ってください。
- フック登録と診断を確認するには、`openclaw plugins inspect <id> --runtime --json` を使用します。`before_model_resolve`、`before_agent_reply`、`before_agent_run`、`llm_input`、`llm_output`、`before_agent_finalize`、`agent_end` などの非バンドル会話フックには、`plugins.entries.<id>.hooks.allowConversationAccess=true` が必要です。
- モデル切り替えには `before_model_resolve` を推奨します。これはエージェントターンのモデル解決前に実行されます。`llm_output` は、モデル試行がアシスタント出力を生成した後にのみ実行されます。
- 有効なセッションモデルの証明には、`openclaw sessions` または Gateway のセッション/ステータスサーフェスを使用します。プロバイダーペイロードをデバッグする場合は、`--raw-stream --raw-stream-path <path>` を付けて Gateway を起動してください。

### 遅い Plugin ツールセットアップ

エージェントターンがツール準備中に停止しているように見える場合は、トレースログを有効化し、Plugin ツールファクトリーのタイミング行を確認してください。

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

次を探します。

```text
[trace:plugin-tools] factory timings ...
```

概要には、合計ファクトリー時間と最も遅い Plugin ツールファクトリーが、Plugin ID、宣言されたツール名、結果の形状、ツールが任意かどうかを含めて一覧表示されます。単一ファクトリーに少なくとも 1 秒かかる場合、または Plugin ツールファクトリー準備の合計が少なくとも 5 秒かかる場合、遅い行は警告に昇格されます。

OpenClaw は、同じ有効リクエストコンテキストで繰り返し解決する場合に、成功した Plugin ツールファクトリーの結果をキャッシュします。キャッシュキーには、有効なランタイム設定、ワークスペース、エージェント/セッション ID、サンドボックスポリシー、ブラウザ設定、配信コンテキスト、リクエスターのID、所有状態が含まれるため、これらの信頼されたフィールドに依存するファクトリーは、コンテキストが変わると再実行されます。

1 つの Plugin がタイミングを支配している場合は、そのランタイム登録を確認してください。

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

その後、その Plugin を更新、再インストール、または無効化します。Plugin 作者は、高コストな依存関係の読み込みをツールファクトリー内で行うのではなく、ツール実行パスの背後に移動する必要があります。

### 重複したチャンネルまたはツール所有権

症状:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

これは、複数の有効な Plugin が同じチャンネル、セットアップフロー、またはツール名を所有しようとしていることを意味します。最も一般的な原因は、現在同じチャンネル ID を提供しているバンドル Plugin の隣に外部チャンネル Plugin がインストールされていることです。

デバッグ手順:

- `openclaw plugins list --enabled --verbose` を実行して、有効なすべての Plugin とそのオリジンを確認します。
- 疑わしい各 Plugin に対して `openclaw plugins inspect <id> --runtime --json` を実行し、`channels`、`channelConfigs`、`tools`、診断を比較します。
- Plugin パッケージをインストールまたは削除した後は、永続化されたメタデータが現在のインストールを反映するように `openclaw plugins registry --refresh` を実行します。
- インストール、レジストリ、設定の変更後に Gateway を再起動します。

修正オプション:

- 1 つの Plugin が同じチャンネル ID について別の Plugin を意図的に置き換える場合、優先する Plugin は `channelConfigs.<channel-id>.preferOver` で優先度の低い Plugin ID を宣言する必要があります。[/plugins/manifest#replacing-another-channel-plugin](/ja-JP/plugins/manifest#replacing-another-channel-plugin) を参照してください。
- 重複が偶発的な場合は、`plugins.entries.<plugin-id>.enabled: false` で片方を無効化するか、古い Plugin インストールを削除します。
- 両方の Plugin を明示的に有効化した場合、OpenClaw はそのリクエストを維持し、競合を報告します。ランタイムサーフェスを曖昧にしないように、チャンネルの所有者を 1 つ選ぶか、Plugin 所有ツールの名前を変更してください。

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

| スロット        | 制御対象                  | デフォルト          |
| --------------- | ------------------------- | ------------------- |
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

バンドルされたPluginはOpenClawに同梱されています。多くはデフォルトで有効です（たとえば、バンドルされたモデルプロバイダー、バンドルされた音声プロバイダー、バンドルされたブラウザーPlugin）。その他のバンドルPluginは、引き続き`openclaw plugins enable <id>`が必要です。

`--force`は、既存のインストール済みPluginまたはフックパックをその場で上書きします。追跡対象のnpm Pluginの通常のアップグレードには`openclaw plugins update <id-or-npm-spec>`を使用してください。これは`--link`ではサポートされません。`--link`は、管理対象のインストール先へコピーする代わりにソースパスを再利用します。

`plugins.allow`がすでに設定されている場合、`openclaw plugins install`はインストールしたPlugin IDを、有効化する前にその許可リストへ追加します。同じPlugin IDが`plugins.deny`に存在する場合、インストールはその古い拒否エントリを削除するため、明示的にインストールしたPluginは再起動後すぐに読み込み可能になります。

OpenClawは、Pluginインベントリ、コントリビューション所有権、起動計画のコールドリードモデルとして、永続化されたローカルPluginレジストリを保持します。インストール、更新、アンインストール、有効化、無効化の各フローは、Pluginの状態を変更した後にそのレジストリを更新します。同じ`plugins/installs.json`ファイルは、トップレベルの`installRecords`に耐久性のあるインストールメタデータを保持し、`plugins`に再構築可能なマニフェストメタデータを保持します。レジストリが存在しない、古い、または無効な場合、`openclaw plugins registry --refresh`は、Pluginランタイムモジュールを読み込まずに、インストールレコード、設定ポリシー、マニフェスト/packageメタデータからマニフェストビューを再構築します。

Nixモード（`OPENCLAW_NIX_MODE=1`）では、Pluginライフサイクルの変更操作は無効になります。代わりに、インストール用のNixソースを通じてPluginパッケージ選択と設定を管理してください。nix-openclawでは、agent-firstの[クイックスタート](https://github.com/openclaw/nix-openclaw#quick-start)から始めてください。
`openclaw plugins update <id-or-npm-spec>`は追跡対象のインストールに適用されます。dist-tagまたは正確なバージョンを含むnpmパッケージspecを渡すと、パッケージ名は追跡対象のPluginレコードへ解決され、新しいspecが今後の更新用に記録されます。バージョンなしのパッケージ名を渡すと、正確にピン留めされたインストールはレジストリのデフォルトリリースラインへ戻されます。インストール済みのnpm Pluginが解決済みバージョンおよび記録済みアーティファクトIDとすでに一致している場合、OpenClawはダウンロード、再インストール、設定の書き換えを行わずに更新をスキップします。
`openclaw update`がベータチャンネルで実行される場合、デフォルトラインのnpmおよびClawHub Pluginレコードはまず`@beta`を試し、Pluginのベータリリースが存在しない場合はdefault/latestへフォールバックします。正確なバージョンと明示的なタグはピン留めされたままです。

`--pin`はnpm専用です。これは`--marketplace`ではサポートされません。marketplaceインストールはnpm specではなくmarketplaceソースメタデータを永続化するためです。

`--dangerously-force-unsafe-install`は、組み込みの危険コードスキャナーによる誤検知に対する非常用の上書きです。PluginのインストールおよびPluginの更新が、組み込みの`critical`検出を超えて続行できるようにしますが、Pluginの`before_install`ポリシーブロックやスキャン失敗によるブロックは引き続き回避しません。インストールスキャンは、パッケージ化されたテストモックをブロックしないように、`tests/`、`__tests__/`、`*.test.*`、`*.spec.*`などの一般的なテストファイルとディレクトリを無視します。宣言されたPluginランタイムエントリポイントは、それらの名前のいずれかを使用していても引き続きスキャンされます。

このCLIフラグは、Pluginのインストール/更新フローにのみ適用されます。Gateway-backedのSkill依存関係インストールでは、対応する`dangerouslyForceUnsafeInstall`リクエスト上書きを代わりに使用します。一方、`openclaw skills install`は別個のClawHub Skillダウンロード/インストールフローのままです。

ClawHubで公開したPluginがスキャンによって非表示またはブロックされている場合は、ClawHubダッシュボードを開くか、`clawhub package rescan <name>`を実行してClawHubに再チェックを依頼してください。`--dangerously-force-unsafe-install`は自分のマシン上のインストールにのみ影響します。ClawHubにPluginの再スキャンを依頼したり、ブロックされたリリースを公開したりするものではありません。

互換バンドルは、同じPlugin list/inspect/enable/disableフローに参加します。現在のランタイムサポートには、バンドルSkills、ClaudeコマンドSkills、Claude `settings.json`デフォルト、Claude `.lsp.json`およびマニフェスト宣言の`lspServers`デフォルト、CursorコマンドSkills、互換性のあるCodexフックディレクトリが含まれます。

`openclaw plugins inspect <id>`は、検出されたバンドル機能に加えて、バンドル backed Pluginのサポート対象または非サポートのMCPおよびLSPサーバーエントリも報告します。

Marketplaceソースには、`~/.claude/plugins/known_marketplaces.json`にあるClaudeの既知marketplace名、ローカルmarketplaceルートまたは`marketplace.json`パス、`owner/repo`のようなGitHub省略形、GitHubリポジトリURL、またはgit URLを指定できます。リモートmarketplaceの場合、Pluginエントリはクローンされたmarketplaceリポジトリ内に留まり、相対パスソースのみを使用する必要があります。

詳細は[`openclaw plugins` CLIリファレンス](/ja-JP/cli/plugins)を参照してください。

## Plugin API概要

ネイティブPluginは`register(api)`を公開するエントリオブジェクトをエクスポートします。古いPluginはレガシーエイリアスとして引き続き`activate(api)`を使用できますが、新しいPluginは`register`を使用してください。

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

OpenClawはPluginのアクティベーション中にエントリオブジェクトを読み込み、`register(api)`を呼び出します。ローダーは古いPlugin向けに引き続き`activate(api)`へフォールバックしますが、バンドルPluginと新しい外部Pluginは`register`を公開コントラクトとして扱うべきです。

`api.registrationMode`は、Pluginにそのエントリが読み込まれている理由を伝えます。

| モード | 意味 |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full` | ランタイムアクティベーション。ツール、フック、サービス、コマンド、ルート、その他のライブ副作用を登録します。 |
| `discovery` | 読み取り専用の機能検出。プロバイダーとメタデータを登録します。信頼済みPluginエントリコードは読み込まれる場合がありますが、ライブ副作用はスキップします。 |
| `setup-only` | 軽量なセットアップエントリを通じたチャンネルセットアップメタデータの読み込み。 |
| `setup-runtime` | ランタイムエントリも必要とするチャンネルセットアップの読み込み。 |
| `cli-metadata` | CLIコマンドメタデータの収集のみ。 |

ソケット、データベース、バックグラウンドワーカー、または長寿命クライアントを開くPluginエントリは、それらの副作用を`api.registrationMode === "full"`でガードしてください。Discovery読み込みはアクティベーション読み込みとは別にキャッシュされ、実行中のGatewayレジストリを置き換えません。Discoveryは非アクティベーションですが、import-freeではありません。OpenClawはスナップショットを構築するために、信頼済みPluginエントリまたはチャンネルPluginモジュールを評価する場合があります。モジュールのトップレベルは軽量で副作用のない状態に保ち、ネットワーククライアント、サブプロセス、リスナー、認証情報の読み取り、サービス起動はフルランタイムパスの背後へ移動してください。

一般的な登録メソッド:

| メソッド | 登録するもの |
| --------------------------------------- | --------------------------- |
| `registerProvider` | モデルプロバイダー（LLM） |
| `registerChannel` | チャットチャンネル |
| `registerTool` | エージェントツール |
| `registerHook` / `on(...)` | ライフサイクルフック |
| `registerSpeechProvider` | テキスト読み上げ / STT |
| `registerRealtimeTranscriptionProvider` | ストリーミングSTT |
| `registerRealtimeVoiceProvider` | 双方向リアルタイム音声 |
| `registerMediaUnderstandingProvider` | 画像/音声分析 |
| `registerImageGenerationProvider` | 画像生成 |
| `registerMusicGenerationProvider` | 音楽生成 |
| `registerVideoGenerationProvider` | 動画生成 |
| `registerWebFetchProvider` | Web取得 / スクレイププロバイダー |
| `registerWebSearchProvider` | Web検索 |
| `registerHttpRoute` | HTTPエンドポイント |
| `registerCommand` / `registerCli` | CLIコマンド |
| `registerContextEngine` | コンテキストエンジン |
| `registerService` | バックグラウンドサービス |

型付きライフサイクルフックのフックガード動作:

- `before_tool_call`: `{ block: true }`は終端です。優先度の低いハンドラーはスキップされます。
- `before_tool_call`: `{ block: false }`はno-opであり、以前のブロックを解除しません。
- `before_install`: `{ block: true }`は終端です。優先度の低いハンドラーはスキップされます。
- `before_install`: `{ block: false }`はno-opであり、以前のブロックを解除しません。
- `message_sending`: `{ cancel: true }`は終端です。優先度の低いハンドラーはスキップされます。
- `message_sending`: `{ cancel: false }`はno-opであり、以前のキャンセルを解除しません。

ネイティブ Codex app-server は、Codex ネイティブのツールイベントをこの
フックサーフェスへブリッジして戻します。Plugin は `before_tool_call` を通じて
ネイティブ Codex ツールをブロックし、`after_tool_call` を通じて結果を監視し、
Codex の `PermissionRequest` 承認に関与できます。このブリッジは、まだ Codex ネイティブのツール
引数を書き換えません。正確な Codex ランタイムのサポート境界は
[Codex ハーネス v1 サポート契約](/ja-JP/plugins/codex-harness-runtime#v1-support-contract) にあります。

型付きフックの完全な動作については、[SDK 概要](/ja-JP/plugins/sdk-overview#hook-decision-semantics) を参照してください。

## 関連

- [Plugin の構築](/ja-JP/plugins/building-plugins) - 独自の Plugin を作成する
- [Plugin バンドル](/ja-JP/plugins/bundles) - Codex/Claude/Cursor バンドル互換性
- [Plugin マニフェスト](/ja-JP/plugins/manifest) - マニフェストスキーマ
- [ツールの登録](/ja-JP/plugins/building-plugins#registering-agent-tools) - Plugin にエージェントツールを追加する
- [Plugin 内部構造](/ja-JP/plugins/architecture) - capability モデルとロードパイプライン
- [ClawHub](/ja-JP/clawhub) - サードパーティ Plugin の検出
