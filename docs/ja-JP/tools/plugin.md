---
read_when:
    - Pluginのインストールまたは設定
    - Plugin の検出と読み込みルールを理解する
    - Codex/Claude 互換の Plugin バンドルを扱う
sidebarTitle: Install and Configure
summary: OpenClaw Plugin をインストール、設定、管理する
title: Plugin
x-i18n:
    generated_at: "2026-04-30T05:39:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7a12d158053c13b47a56d8d6b382818962e9b5109fdf8ededd3ecf92b83089e6
    source_path: tools/plugin.md
    workflow: 16
---

Plugins は、チャンネル、モデルプロバイダー、エージェントハーネス、ツール、Skills、音声、リアルタイム文字起こし、リアルタイム音声、メディア理解、画像生成、動画生成、Web 取得、Web 検索などの新しい機能で OpenClaw を拡張します。一部の Plugin は **core**（OpenClaw に同梱）で、その他は **external** です。ほとんどの外部 Plugin は [ClawHub](/ja-JP/tools/clawhub) を通じて公開および検出されます。npm は、その移行が完了するまでの間、直接インストールと OpenClaw 所有 Plugin パッケージの一時的なセット向けに引き続きサポートされます。

## クイックスタート

<Steps>
  <Step title="読み込まれているものを確認する">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="Plugin をインストールする">
    ```bash
    # From npm
    openclaw plugins install npm:@acme/openclaw-plugin

    # From a local directory or archive
    openclaw plugins install ./my-plugin
    openclaw plugins install ./my-plugin.tgz
    ```

  </Step>

  <Step title="Gateway を再起動する">
    ```bash
    openclaw gateway restart
    ```

    その後、設定ファイルの `plugins.entries.\<id\>.config` で設定します。

  </Step>
</Steps>

チャットネイティブな制御を好む場合は、`commands.plugins: true` を有効にして次を使用します。

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

インストールパスは CLI と同じリゾルバーを使用します。ローカルパス/アーカイブ、明示的な `clawhub:<pkg>`、明示的な `npm:<pkg>`、または素のパッケージ指定（まず ClawHub、次に npm フォールバック）です。

設定が無効な場合、通常インストールはフェイルクローズし、`openclaw doctor --fix` を案内します。唯一の回復例外は、`openclaw.install.allowInvalidConfigRecovery` にオプトインした Plugin 向けの狭い範囲の同梱 Plugin 再インストールパスです。
Gateway 起動中、1 つの Plugin の無効な設定はその Plugin に隔離されます。起動は `plugins.entries.<id>.config` の問題をログに記録し、読み込み中にその Plugin をスキップして、他の Plugin とチャンネルはオンラインのままにします。`openclaw doctor --fix` を実行すると、その Plugin エントリを無効化し、無効な設定ペイロードを削除することで、不正な Plugin 設定を隔離します。通常の設定バックアップには以前の値が保持されます。
チャンネル設定が、もはや検出できない Plugin を参照している一方で、同じ古い Plugin ID が Plugin 設定またはインストール記録に残っている場合、Gateway 起動は警告をログに記録し、他のすべてのチャンネルをブロックするのではなく、そのチャンネルをスキップします。`openclaw doctor --fix` を実行すると、古いチャンネル/Plugin エントリを削除します。古い Plugin の証拠がない不明なチャンネルキーは引き続き検証に失敗するため、タイプミスは見える状態に保たれます。
`plugins.enabled: false` が設定されている場合、古い Plugin 参照は不活性として扱われます。Gateway 起動は Plugin の検出/読み込み作業をスキップし、`openclaw doctor` は無効化された Plugin 設定を自動削除せずに保持します。古い Plugin ID を削除したい場合は、doctor クリーンアップを実行する前に Plugin を再度有効化してください。

パッケージ化された OpenClaw インストールは、すべての同梱 Plugin のランタイム依存関係ツリーを先行してインストールしません。OpenClaw 所有の同梱 Plugin が Plugin 設定、レガシーチャンネル設定、またはデフォルト有効のマニフェストからアクティブな場合、起動はその Plugin をインポートする前に、その Plugin が宣言したランタイム依存関係だけを修復します。永続化されたチャンネル認証状態だけでは、Gateway 起動時のランタイム依存関係修復のために同梱チャンネルは有効化されません。
明示的な無効化は引き続き優先されます。`plugins.entries.<id>.enabled: false`、`plugins.deny`、`plugins.enabled: false`、`channels.<id>.enabled: false` は、その Plugin/チャンネルの同梱ランタイム依存関係の自動修復を防ぎます。
空でない `plugins.allow` も、デフォルト有効の同梱ランタイム依存関係修復の範囲を制限します。明示的な同梱チャンネル有効化（`channels.<id>.enabled: true`）では、そのチャンネルの Plugin 依存関係を引き続き修復できます。
外部 Plugin とカスタム読み込みパスは、引き続き `openclaw plugins install` を通じてインストールする必要があります。

## Plugin の種類

OpenClaw は 2 つの Plugin 形式を認識します。

| 形式     | 仕組み                                                       | 例                                               |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + ランタイムモジュール。インプロセスで実行       | 公式 Plugin、コミュニティ npm パッケージ               |
| **Bundle** | Codex/Claude/Cursor 互換レイアウト。OpenClaw 機能にマッピング | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

どちらも `openclaw plugins list` に表示されます。Bundle の詳細は [Plugin Bundles](/ja-JP/plugins/bundles) を参照してください。

Native Plugin を作成する場合は、[Building Plugins](/ja-JP/plugins/building-plugins)
と [Plugin SDK Overview](/ja-JP/plugins/sdk-overview) から始めてください。

## パッケージエントリポイント

Native Plugin npm パッケージは、`package.json` で `openclaw.extensions` を宣言する必要があります。
各エントリはパッケージディレクトリ内に収まり、読み取り可能なランタイムファイル、または `src/index.ts` から `dist/index.js` のように推論されたビルド済み JavaScript ピアを持つ TypeScript ソースファイルへ解決される必要があります。

公開済みランタイムファイルがソースエントリと同じパスに存在しない場合は、`openclaw.runtimeExtensions` を使用します。存在する場合、`runtimeExtensions` はすべての `extensions` エントリに対して正確に 1 つのエントリを含む必要があります。リストが一致しない場合、ソースパスへ黙ってフォールバックするのではなく、インストールと Plugin 検出は失敗します。

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

ClawHub は、ほとんどの Plugin の主要な配布パスです。現在のパッケージ化された OpenClaw リリースには、すでに多くの公式 Plugin が同梱されているため、通常のセットアップでは個別の npm インストールは不要です。すべての OpenClaw 所有 Plugin が ClawHub へ移行するまで、OpenClaw は古い/カスタムインストールと直接 npm ワークフロー向けに、一部の `@openclaw/*` Plugin パッケージを npm で引き続き提供します。

npm が `@openclaw/*` Plugin パッケージを deprecated と報告する場合、そのパッケージバージョンは古い外部パッケージ系列のものです。より新しい npm パッケージが公開されるまで、現在の OpenClaw に同梱された Plugin またはローカルチェックアウトを使用してください。

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

### Core（OpenClaw に同梱）

<AccordionGroup>
  <Accordion title="モデルプロバイダー（デフォルトで有効）">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="メモリ Plugin">
    - `memory-core` — 同梱メモリ検索（デフォルトは `plugins.slots.memory` 経由）
    - `memory-lancedb` — 自動リコール/キャプチャ付きのオンデマンドインストール長期メモリ（`plugins.slots.memory = "memory-lancedb"` を設定）

    OpenAI 互換の embedding セットアップ、Ollama の例、リコール制限、トラブルシューティングについては [Memory LanceDB](/ja-JP/plugins/memory-lancedb) を参照してください。

  </Accordion>

  <Accordion title="音声プロバイダー（デフォルトで有効）">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="その他">
    - `browser` — ブラウザーツール、`openclaw browser` CLI、`browser.request` Gateway メソッド、ブラウザーランタイム、デフォルトのブラウザー制御サービス向けの同梱ブラウザー Plugin（デフォルトで有効。置き換える前に無効化してください）
    - `copilot-proxy` — VS Code Copilot Proxy ブリッジ（デフォルトで無効）

  </Accordion>
</AccordionGroup>

サードパーティ Plugin を探している場合は、[Community Plugins](/ja-JP/plugins/community) を参照してください。

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
| `deny`           | Plugin 拒否リスト（任意。deny が優先）                     |
| `load.paths`     | 追加の Plugin ファイル/ディレクトリ                            |
| `slots`          | 排他的なスロットセレクター（例: `memory`, `contextEngine`） |
| `entries.\<id\>` | Plugin ごとのトグル + 設定                               |

設定変更には **Gateway の再起動が必要** です。Gateway が設定監視 + インプロセス再起動を有効にして実行されている場合（デフォルトの `openclaw gateway` パス）、その再起動は通常、設定の書き込みが反映された少し後に自動的に実行されます。Native Plugin のランタイムコードやライフサイクルフックには、サポートされているホットリロードパスはありません。更新された `register(api)` コード、`api.on(...)` フック、ツール、サービス、またはプロバイダー/ランタイムフックが実行されることを期待する前に、ライブチャンネルを提供している Gateway プロセスを再起動してください。

`openclaw plugins list` はローカルの Plugin レジストリ/設定スナップショットです。そこにある `enabled` Plugin は、永続化されたレジストリと現在の設定がその Plugin の参加を許可していることを意味します。すでに実行中のリモート Gateway 子プロセスが同じ Plugin コードへ再起動済みであることを証明するものではありません。ラッパープロセスを使用する VPS/コンテナーセットアップでは、実際の `openclaw gateway run` プロセスへ再起動を送信するか、実行中の Gateway に対して `openclaw gateway restart` を使用してください。

<Accordion title="Plugin の状態: 無効、欠落、無効">
  - **無効**: Plugin は存在しますが、有効化ルールによってオフになっています。設定は保持されます。
  - **欠落**: 設定が、検出で見つからなかった Plugin ID を参照しています。
  - **無効**: Plugin は存在しますが、その設定が宣言されたスキーマと一致しません。Gateway 起動はその Plugin だけをスキップします。`openclaw doctor --fix` は、そのエントリを無効化し設定ペイロードを削除することで、無効なエントリを隔離できます。

</Accordion>

## 検出と優先順位

OpenClaw は次の順序で Plugin をスキャンします（最初の一致が優先されます）。

<Steps>
  <Step title="設定パス">
    `plugins.load.paths` — 明示的なファイルパスまたはディレクトリパス。OpenClaw 自身のパッケージ化された同梱 Plugin ディレクトリを指すパスは無視されます。
    そのような古いエイリアスを削除するには、`openclaw doctor --fix` を実行してください。
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

パッケージ化されたインストールと Docker イメージは、通常、コンパイル済みの
`dist/extensions` ツリーから同梱 Plugin を解決します。同梱 Plugin のソースディレクトリが、
対応するパッケージ化済みソースパスに bind mount されている場合、たとえば
`/app/extensions/synology-chat` のような場合、OpenClaw はそのマウントされたソースディレクトリを
同梱ソースオーバーレイとして扱い、パッケージ化された
`/app/dist/extensions/synology-chat` バンドルより先に検出します。これにより、すべての同梱 Plugin を
TypeScript ソースへ戻さなくても、メンテナーのコンテナループが動作し続けます。
ソースオーバーレイのマウントが存在する場合でも、パッケージ化済み dist バンドルを強制するには
`OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1` を設定します。

### 有効化ルール

- `plugins.enabled: false` はすべての Plugin を無効化し、Plugin の検出/読み込み処理をスキップします
- `plugins.deny` は常に allow より優先されます
- `plugins.entries.\<id\>.enabled: false` はその Plugin を無効化します
- ワークスペース由来の Plugin は**デフォルトで無効**です（明示的に有効化する必要があります）
- 同梱 Plugin は、上書きされない限り、組み込みのデフォルト有効セットに従います
- 排他的スロットは、そのスロットで選択された Plugin を強制的に有効化できます
- 一部のオプトイン同梱 Plugin は、プロバイダーモデル参照、チャンネル設定、ハーネス
  runtime など、設定で Plugin 所有のサーフェスが指定されている場合に自動的に有効化されます
- `plugins.enabled: false` が有効な間、古い Plugin 設定は保持されます。
  古い id を削除したい場合は、doctor cleanup を実行する前に Plugin を再度有効化してください
- OpenAI 系 Codex ルートは個別の Plugin 境界を保持します。
  `openai-codex/*` は OpenAI Plugin に属し、一方で同梱 Codex
  app-server Plugin は `agentRuntime.id: "codex"` または従来の
  `codex/*` モデル参照によって選択されます

## runtime hook のトラブルシューティング

Plugin が `plugins list` に表示されているのに、ライブチャットトラフィックで
`register(api)` の副作用や hook が実行されない場合は、まず次を確認してください。

- `openclaw gateway status --deep --require-rpc` を実行し、アクティブな
  Gateway URL、プロファイル、設定パス、プロセスが編集対象のものであることを確認します。
- Plugin のインストール/設定/コード変更後に、ライブ Gateway を再起動します。ラッパー
  コンテナでは、PID 1 は supervisor にすぎない場合があります。子プロセスである
  `openclaw gateway run` プロセスを再起動するか、シグナルを送ります。
- `openclaw plugins inspect <id> --json` を使って hook 登録と診断を確認します。
  `llm_input`、`llm_output`、`before_agent_finalize`、`agent_end` などの
  非同梱 conversation hook には
  `plugins.entries.<id>.hooks.allowConversationAccess=true` が必要です。
- モデル切り替えには、`before_model_resolve` を優先してください。これは agent turn のモデル
  解決前に実行されます。`llm_output` は、モデル試行が assistant 出力を生成した後にのみ実行されます。
- 有効なセッションモデルの証明には、`openclaw sessions` または
  Gateway のセッション/ステータスサーフェスを使用し、プロバイダーペイロードをデバッグする場合は
  `--raw-stream --raw-stream-path <path>` を付けて Gateway を起動します。

### チャンネルまたはツール所有権の重複

症状:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

これは、有効化された複数の Plugin が同じチャンネル、セットアップフロー、またはツール名を所有しようとしていることを意味します。最も一般的な原因は、同じチャンネル id を提供するようになった同梱 Plugin の横に、外部チャンネル Plugin がインストールされていることです。

デバッグ手順:

- `openclaw plugins list --enabled --verbose` を実行して、有効なすべての Plugin と
  由来を確認します。
- 疑わしい各 Plugin に対して `openclaw plugins inspect <id> --json` を実行し、
  `channels`、`channelConfigs`、`tools`、診断を比較します。
- Plugin パッケージをインストールまたは削除した後、`openclaw plugins registry --refresh` を実行して、
  永続化されたメタデータが現在のインストールを反映するようにします。
- インストール、registry、または設定を変更した後は Gateway を再起動します。

修正オプション:

- ある Plugin が同じチャンネル id に対して別の Plugin を意図的に置き換える場合、
  優先される Plugin は、優先度の低い Plugin id を指定して
  `channelConfigs.<channel-id>.preferOver` を宣言する必要があります。[/plugins/manifest#replacing-another-channel-plugin](/ja-JP/plugins/manifest#replacing-another-channel-plugin) を参照してください。
- 重複が意図しないものである場合は、`plugins.entries.<plugin-id>.enabled: false` で
  どちらか一方を無効化するか、古い Plugin インストールを削除します。
- 両方の Plugin を明示的に有効化した場合、OpenClaw はその要求を保持し、
  競合を報告します。チャンネルの所有者を 1 つ選ぶか、Plugin 所有のツール名を変更して、
  runtime サーフェスが曖昧にならないようにします。

## Plugin スロット（排他的カテゴリ）

一部のカテゴリは排他的です（一度にアクティブにできるのは 1 つのみ）。

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
| `memory`        | アクティブメモリ Plugin   | `memory-core`       |
| `contextEngine` | アクティブ context engine | `legacy` (built-in) |

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

同梱 Plugin は OpenClaw と一緒に提供されます。多くはデフォルトで有効です（たとえば、
同梱モデルプロバイダー、同梱音声プロバイダー、同梱ブラウザー
Plugin）。その他の同梱 Plugin は、引き続き `openclaw plugins enable <id>` が必要です。

`--force` は、既存のインストール済み Plugin または hook pack をその場で上書きします。
追跡対象の npm Plugin の通常アップグレードには
`openclaw plugins update <id-or-npm-spec>` を使用してください。これは `--link` とは併用できません。
`--link` は管理対象のインストール先へコピーする代わりに、ソースパスを再利用します。

`plugins.allow` がすでに設定されている場合、`openclaw plugins install` は
インストールされた Plugin id をその allowlist に追加してから有効化します。同じ Plugin id が
`plugins.deny` に存在する場合、インストールはその古い deny エントリを削除するため、
再起動後すぐに明示的なインストールを読み込めます。

OpenClaw は、Plugin インベントリ、contribution 所有権、起動計画の cold read モデルとして、
永続化されたローカル Plugin registry を保持します。インストール、更新、
アンインストール、有効化、無効化のフローは、Plugin 状態を変更した後にその registry を更新します。
同じ `plugins/installs.json` ファイルは、トップレベルの `installRecords` に永続的なインストールメタデータを、
`plugins` に再構築可能な manifest メタデータを保持します。registry が存在しない、古い、または無効な場合、
`openclaw plugins registry --refresh` は、Plugin runtime モジュールを読み込まずに、
インストール記録、設定ポリシー、manifest/package メタデータから manifest ビューを再構築します。
`openclaw plugins update <id-or-npm-spec>` は追跡対象のインストールに適用されます。
dist-tag または正確なバージョンを含む npm パッケージ spec を渡すと、パッケージ名を
追跡対象の Plugin レコードへ解決し、今後の更新用に新しい spec を記録します。
バージョンなしのパッケージ名を渡すと、正確に pin されたインストールは registry の
デフォルトリリースラインへ戻ります。インストール済みの npm Plugin がすでに解決済みバージョンおよび記録済み
artifact identity と一致している場合、OpenClaw はダウンロード、再インストール、設定の書き換えを行わずに更新をスキップします。

`--pin` は npm 専用です。`--marketplace` とは併用できません。marketplace インストールは
npm spec ではなく marketplace ソースメタデータを永続化するためです。

`--dangerously-force-unsafe-install` は、組み込みの危険コードスキャナーによる誤検出に対する
break-glass オーバーライドです。Plugin のインストールと Plugin の更新が、組み込みの
`critical` findings を越えて続行できるようにしますが、Plugin の `before_install` ポリシーブロックや
スキャン失敗によるブロックは依然として回避しません。インストールスキャンは、パッケージ化された test mock をブロックしないように、
`tests/`、`__tests__/`、`*.test.*`、`*.spec.*` などの一般的なテストファイルやディレクトリを無視します。
宣言された Plugin runtime entrypoint は、それらの名前のいずれかを使用していても引き続きスキャンされます。

この CLI フラグは、Plugin のインストール/更新フローにのみ適用されます。Gateway-backed skill の
依存関係インストールでは、代わりに対応する `dangerouslyForceUnsafeInstall` request
override を使用し、`openclaw skills install` は別個の ClawHub
skill ダウンロード/インストールフローのままです。

ClawHub で公開した Plugin がスキャンによって非表示またはブロックされた場合は、
ClawHub dashboard を開くか、`clawhub package rescan <name>` を実行して、ClawHub に再確認を依頼してください。
`--dangerously-force-unsafe-install` は自分のマシン上のインストールにのみ影響します。
ClawHub に Plugin の再スキャンを依頼したり、ブロックされたリリースを公開したりするものではありません。

互換バンドルは、同じ Plugin list/inspect/enable/disable フローに参加します。
現在の runtime サポートには、bundle skills、Claude command-skills、
Claude `settings.json` defaults、Claude `.lsp.json` と manifest 宣言の
`lspServers` defaults、Cursor command-skills、互換 Codex hook
ディレクトリが含まれます。

`openclaw plugins inspect <id>` は、検出された bundle capabilities に加えて、
bundle-backed Plugin のサポート対象または非サポート対象の MCP および LSP server entry も報告します。

Marketplace sources には、`~/.claude/plugins/known_marketplaces.json` の Claude known-marketplace 名、
ローカル marketplace root または `marketplace.json` パス、`owner/repo` のような GitHub shorthand、
GitHub repo URL、または git URL を指定できます。リモート marketplace の場合、Plugin エントリは
cloned marketplace repo 内に留まり、relative path sources のみを使用する必要があります。

詳細は [`openclaw plugins` CLI リファレンス](/ja-JP/cli/plugins) を参照してください。

## Plugin API 概要

Native Plugin は `register(api)` を公開するエントリオブジェクトを export します。古い
Plugin は legacy alias として `activate(api)` をまだ使用する場合がありますが、新しい Plugin は
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

OpenClaw はエントリオブジェクトを読み込み、Plugin
activation 中に `register(api)` を呼び出します。loader は古い Plugin 向けに
`activate(api)` へまだフォールバックしますが、同梱 Plugin と新しい外部 Plugin は
`register` を public contract として扱う必要があります。

`api.registrationMode` は、なぜそのエントリが読み込まれているのかを Plugin に伝えます:

| モード            | 意味                                                                                                                          |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | ランタイム有効化。ツール、フック、サービス、コマンド、ルート、その他のライブ副作用を登録します。                              |
| `discovery`     | 読み取り専用の機能検出。プロバイダーとメタデータを登録します。信頼済みの Plugin エントリコードは読み込まれる場合がありますが、ライブ副作用はスキップします。 |
| `setup-only`    | 軽量なセットアップエントリを通じたチャネルセットアップメタデータの読み込み。                                                                |
| `setup-runtime` | ランタイムエントリも必要とするチャネルセットアップの読み込み。                                                                         |
| `cli-metadata`  | CLI コマンドメタデータの収集のみ。                                                                                            |

ソケット、データベース、バックグラウンドワーカー、長寿命の
クライアントを開く Plugin エントリは、それらの副作用を `api.registrationMode === "full"` でガードする必要があります。
検出読み込みは有効化読み込みとは別にキャッシュされ、実行中の Gateway レジストリを置き換えません。
検出は有効化を行いませんが、インポート不要ではありません。
OpenClaw は、信頼済みの Plugin エントリまたはチャネル Plugin モジュールを評価して
スナップショットを構築する場合があります。モジュールのトップレベルは軽量で副作用がない状態に保ち、
ネットワーククライアント、サブプロセス、リスナー、認証情報の読み取り、サービス起動は
完全ランタイムパスの背後に移動してください。

一般的な登録メソッド:

| メソッド                                  | 登録するもの           |
| --------------------------------------- | --------------------------- |
| `registerProvider`                      | モデルプロバイダー (LLM)        |
| `registerChannel`                       | チャットチャネル                |
| `registerTool`                          | エージェントツール                  |
| `registerHook` / `on(...)`              | ライフサイクルフック             |
| `registerSpeechProvider`                | テキスト読み上げ / STT        |
| `registerRealtimeTranscriptionProvider` | ストリーミング STT               |
| `registerRealtimeVoiceProvider`         | 双方向リアルタイム音声       |
| `registerMediaUnderstandingProvider`    | 画像/音声分析        |
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
- `before_tool_call`: `{ block: false }` は no-op であり、以前のブロックを解除しません。
- `before_install`: `{ block: true }` は終端です。優先度の低いハンドラーはスキップされます。
- `before_install`: `{ block: false }` は no-op であり、以前のブロックを解除しません。
- `message_sending`: `{ cancel: true }` は終端です。優先度の低いハンドラーはスキップされます。
- `message_sending`: `{ cancel: false }` は no-op であり、以前のキャンセルを解除しません。

ネイティブ Codex アプリサーバーの実行では、Codex ネイティブツールイベントをこの
フックサーフェスへブリッジします。Plugin は `before_tool_call` を通じてネイティブ Codex ツールをブロックし、
`after_tool_call` を通じて結果を観測し、Codex
`PermissionRequest` 承認に参加できます。このブリッジは、まだ Codex ネイティブツールの
引数を書き換えません。正確な Codex ランタイムサポート境界は
[Codex ハーネス v1 サポート契約](/ja-JP/plugins/codex-harness#v1-support-contract)にあります。

型付きフックの完全な動作については、[SDK 概要](/ja-JP/plugins/sdk-overview#hook-decision-semantics)を参照してください。

## 関連

- [Plugin の構築](/ja-JP/plugins/building-plugins) — 独自の Plugin を作成する
- [Plugin バンドル](/ja-JP/plugins/bundles) — Codex/Claude/Cursor バンドル互換性
- [Plugin マニフェスト](/ja-JP/plugins/manifest) — マニフェストスキーマ
- [ツールの登録](/ja-JP/plugins/building-plugins#registering-agent-tools) — Plugin にエージェントツールを追加する
- [Plugin 内部構造](/ja-JP/plugins/architecture) — 機能モデルと読み込みパイプライン
- [コミュニティ Plugin](/ja-JP/plugins/community) — サードパーティの一覧
