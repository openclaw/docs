---
read_when:
    - Plugin をインストールまたは設定する場合
    - Plugin の検出および読み込みルールを理解する場合
    - Codex/Claude 互換 Plugin バンドルを扱う場合
sidebarTitle: Install and Configure
summary: OpenClaw Plugin のインストール、設定、および管理
title: Plugin
x-i18n:
    generated_at: "2026-04-26T11:42:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: b36ac0e71c95a1f5e3cf9edb1aa7175c04482c25dca72bbf12ad10bef17699c1
    source_path: tools/plugin.md
    workflow: 15
---

Plugin は OpenClaw を新しい機能で拡張します: channel、model provider、
agent harness、tool、Skills、speech、realtime transcription、realtime
voice、media-understanding、image generation、video generation、web fetch、web
search などです。一部の Plugin は **コア**（OpenClaw に同梱）で、他は
**外部**（コミュニティによって npm に公開）です。

## クイックスタート

<Steps>
  <Step title="何が読み込まれているか確認する">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="Plugin をインストールする">
    ```bash
    # From npm
    openclaw plugins install @openclaw/voice-call

    # From a local directory or archive
    openclaw plugins install ./my-plugin
    openclaw plugins install ./my-plugin.tgz
    ```

  </Step>

  <Step title="Gateway を再起動する">
    ```bash
    openclaw gateway restart
    ```

    その後、設定ファイルの `plugins.entries.\<id\>.config` 配下で設定してください。

  </Step>
</Steps>

chat ネイティブな制御を使いたい場合は、`commands.plugins: true` を有効にして次を使用します。

```text
/plugin install clawhub:@openclaw/voice-call
/plugin show voice-call
/plugin enable voice-call
```

インストールパスは CLI と同じ resolver を使用します: ローカル path/archive、明示的な
`clawhub:<pkg>`、または bare package spec（最初に ClawHub、次に npm fallback）。

config が無効な場合、通常インストールはクローズドフェイルし、
`openclaw doctor --fix` を案内します。唯一の回復例外は、
`openclaw.install.allowInvalidConfigRecovery` にオプトインした Plugin のための、
限定的な同梱 Plugin 再インストールパスです。

パッケージ化された OpenClaw インストールでは、すべての同梱 Plugin の
ランタイム依存ツリーを先回りしてインストールしません。Plugin config、
レガシー channel config、またはデフォルト有効の manifest によって同梱された
OpenClaw 管理 Plugin が有効な場合、起動時修復では import 前にその Plugin が宣言した
ランタイム依存関係のみを修復します。永続化された channel auth state だけでは、
Gateway 起動時のランタイム依存関係修復のために同梱 channel は有効化されません。
明示的な無効化は引き続き優先されます: `plugins.entries.<id>.enabled: false`、
`plugins.deny`、`plugins.enabled: false`、および `channels.<id>.enabled: false`
は、その Plugin/channel に対する自動の同梱ランタイム依存関係修復を防ぎます。
空でない `plugins.allow` も、デフォルト有効の同梱ランタイム依存関係修復を制限します。
明示的な同梱 channel 有効化（`channels.<id>.enabled: true`）は、その channel の
Plugin 依存関係を引き続き修復できます。
外部 Plugin とカスタム load path は、引き続き `openclaw plugins install` を通じてインストールする必要があります。

## Plugin の種類

OpenClaw は2つの Plugin 形式を認識します。

| Format     | 仕組み                                                           | 例                                                     |
| ---------- | ---------------------------------------------------------------- | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + ランタイム module。インプロセスで実行される | 公式 Plugin、コミュニティの npm package                |
| **Bundle** | Codex/Claude/Cursor 互換レイアウト。OpenClaw 機能にマッピングされる | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

どちらも `openclaw plugins list` に表示されます。bundle の詳細は [Plugin Bundles](/ja-JP/plugins/bundles) を参照してください。

ネイティブ Plugin を書く場合は、[Building Plugins](/ja-JP/plugins/building-plugins)
と [Plugin SDK Overview](/ja-JP/plugins/sdk-overview) から始めてください。

## Package Entrypoint

ネイティブ Plugin の npm package は、`package.json` で `openclaw.extensions` を宣言する必要があります。
各エントリは package ディレクトリ内に収まり、読み取り可能な
ランタイム file に解決されるか、`src/index.ts` から `dist/index.js` のように推論可能なビルド済み JavaScript
peer を持つ TypeScript ソース file に解決される必要があります。

公開ランタイム file がソースエントリと同じ path に存在しない場合は、
`openclaw.runtimeExtensions` を使用してください。`runtimeExtensions` が存在する場合、
すべての `extensions` エントリに対してちょうど1つずつエントリを含める必要があります。
リストが一致しない場合、ソース path に黙ってフォールバックするのではなく、
インストールと Plugin 検出が失敗します。

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

### インストール可能（npm）

| Plugin          | Package                | Docs                                 |
| --------------- | ---------------------- | ------------------------------------ |
| Matrix          | `@openclaw/matrix`     | [Matrix](/ja-JP/channels/matrix)           |
| Microsoft Teams | `@openclaw/msteams`    | [Microsoft Teams](/ja-JP/channels/msteams) |
| Nostr           | `@openclaw/nostr`      | [Nostr](/ja-JP/channels/nostr)             |
| Voice Call      | `@openclaw/voice-call` | [Voice Call](/ja-JP/plugins/voice-call)    |
| Zalo            | `@openclaw/zalo`       | [Zalo](/ja-JP/channels/zalo)               |
| Zalo Personal   | `@openclaw/zalouser`   | [Zalo Personal](/ja-JP/plugins/zalouser)   |

### コア（OpenClaw に同梱）

<AccordionGroup>
  <Accordion title="Model provider（デフォルトで有効）">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="メモリ Plugin">
    - `memory-core` — 同梱メモリ検索（`plugins.slots.memory` によるデフォルト）
    - `memory-lancedb` — 自動リコール/キャプチャ付きのオンデマンドインストール長期メモリ（`plugins.slots.memory = "memory-lancedb"` を設定）

  </Accordion>

  <Accordion title="Speech provider（デフォルトで有効）">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="その他">
    - `browser` — browser tool、`openclaw browser` CLI、`browser.request` gateway method、browser runtime、およびデフォルト browser control service のための同梱 browser Plugin（デフォルトで有効。置き換える前に無効化してください）
    - `copilot-proxy` — VS Code Copilot Proxy bridge（デフォルトでは無効）

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

| Field            | 説明                                                |
| ---------------- | --------------------------------------------------- |
| `enabled`        | マスタートグル（デフォルト: `true`）                |
| `allow`          | Plugin allowlist（任意）                            |
| `deny`           | Plugin denylist（任意。deny が優先）                |
| `load.paths`     | 追加の Plugin file/ディレクトリ                     |
| `slots`          | 排他的 slot セレクター（例: `memory`, `contextEngine`） |
| `entries.\<id\>` | Plugin ごとのトグル + config                        |

config の変更には **gateway の再起動が必要** です。Gateway が config watch + インプロセス再起動を有効にした状態（デフォルトの `openclaw gateway` パス）で動作している場合、その再起動は通常、config 書き込みが反映された直後に自動実行されます。ネイティブ Plugin のランタイムコードやライフサイクル hook に対するサポートされた hot-reload パスはありません。更新した `register(api)` コード、`api.on(...)` hook、tool、service、または provider/runtime hook を動作させたい場合は、ライブ channel を提供している Gateway プロセスを再起動してください。

`openclaw plugins list` はローカルの Plugin registry/config スナップショットです。そこに
`enabled` の Plugin があることは、永続化された registry と現在の config がその
Plugin の参加を許可していることを意味します。すでに動作中のリモート Gateway
child が同じ Plugin コードで再起動済みであることを証明するものではありません。VPS/container 環境で wrapper process を使っている場合は、実際の `openclaw gateway run` プロセスに再起動を送るか、動作中の Gateway に対して `openclaw gateway restart` を使用してください。

<Accordion title="Plugin の状態: disabled vs missing vs invalid">
  - **Disabled**: Plugin は存在するが、有効化ルールにより無効化されている。config は保持される。
  - **Missing**: config が Plugin id を参照しているが、検出で見つからなかった。
  - **Invalid**: Plugin は存在するが、その config が宣言された schema と一致しない。

</Accordion>

## 検出と優先順位

OpenClaw はこの順序で Plugin をスキャンします（最初の一致が優先）。

<Steps>
  <Step title="Config path">
    `plugins.load.paths` — 明示的な file またはディレクトリ path。OpenClaw 自身のパッケージ化された同梱 Plugin ディレクトリを指し返す path は無視されます。これらの古い alias を削除するには `openclaw doctor --fix` を実行してください。
  </Step>

  <Step title="Workspace Plugin">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` と `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`。
  </Step>

  <Step title="グローバル Plugin">
    `~/.openclaw/<plugin-root>/*.ts` と `~/.openclaw/<plugin-root>/*/index.ts`。
  </Step>

  <Step title="同梱 Plugin">
    OpenClaw に同梱。多くはデフォルトで有効です（model provider、speech）。
    他は明示的な有効化が必要です。
  </Step>
</Steps>

パッケージ化されたインストールと Docker image は通常、同梱 Plugin をコンパイル済みの
`dist/extensions` ツリーから解決します。同梱 Plugin のソースディレクトリが、対応するパッケージ化ソース path の上に bind mount されている場合、たとえば
`/app/extensions/synology-chat` のように、OpenClaw はその mount されたソースディレクトリを同梱ソース overlay として扱い、パッケージ化された
`/app/dist/extensions/synology-chat` bundle より前に検出します。これにより、保守担当者の container ループを、すべての同梱 Plugin を再び TypeScript ソースに切り替えることなく動作させられます。
ソース overlay mount が存在していてもパッケージ化された dist bundle を強制したい場合は、`OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1` を設定してください。

### 有効化ルール

- `plugins.enabled: false` はすべての Plugin を無効化します
- `plugins.deny` は常に allow より優先されます
- `plugins.entries.\<id\>.enabled: false` はその Plugin を無効化します
- workspace 由来の Plugin は **デフォルトで無効** です（明示的な有効化が必要）
- 同梱 Plugin は、上書きされない限り組み込みの default-on セットに従います
- 排他的 slot は、その slot 用に選択された Plugin を強制有効化できます
- 一部の同梱オプトイン Plugin は、config が provider model ref、channel config、または harness runtime のような Plugin 所有サーフェスを指定したときに自動有効化されます
- OpenAI ファミリーの Codex route は独立した Plugin 境界を維持します:
  `openai-codex/*` は OpenAI Plugin に属し、同梱 Codex
  app-server Plugin は `agentRuntime.id: "codex"` またはレガシーな
  `codex/*` model ref で選択されます

## ランタイム hook のトラブルシューティング

Plugin が `plugins list` に表示されているのに、`register(api)` の副作用や hook がライブ chat トラフィックで動作しない場合は、まず以下を確認してください。

- `openclaw gateway status --deep --require-rpc` を実行し、アクティブな
  Gateway URL、profile、config path、および process が、編集中のものと一致していることを確認してください。
- Plugin のインストール/config/コード変更後に、ライブ Gateway を再起動してください。wrapper
  container では、PID 1 は supervisor にすぎない場合があります。child の
  `openclaw gateway run` process を再起動または signal してください。
- `openclaw plugins inspect <id> --json` を使用して、hook 登録と
  diagnostics を確認してください。`llm_input`、
  `llm_output`、`before_agent_finalize`、`agent_end` のような非同梱 conversation hook には、`plugins.entries.<id>.hooks.allowConversationAccess=true` が必要です。
- model 切り替えには、`before_model_resolve` を優先してください。これはエージェントターンの model 解決前に実行されます。`llm_output` は model の試行が assistant 出力を生成した後にのみ実行されます。
- 有効な session model の証拠には、`openclaw sessions` または
  Gateway の session/status サーフェスを使用してください。また、provider payload をデバッグする場合は、Gateway を `--raw-stream --raw-stream-path <path>` 付きで起動してください。

### 重複した channel または tool の所有権

症状:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

これは、複数の有効な Plugin が同じ channel、
セットアップフロー、または tool 名を所有しようとしていることを意味します。もっとも一般的な原因は、同じ channel id を同梱 Plugin が提供するようになった後も、外部 channel Plugin がそのままインストールされていることです。

デバッグ手順:

- `openclaw plugins list --enabled --verbose` を実行して、有効なすべての Plugin
  とその由来を確認します。
- 疑わしい各 Plugin に対して `openclaw plugins inspect <id> --json` を実行し、
  `channels`、`channelConfigs`、`tools`、および diagnostics を比較します。
- Plugin package をインストールまたは削除した後に
  `openclaw plugins registry --refresh` を実行して、永続化された metadata が現在のインストール状態を反映するようにします。
- インストール、registry、または config の変更後に Gateway を再起動します。

修正方法:

- ある Plugin が同じ channel id に対して別の Plugin を意図的に置き換える場合、
  優先される Plugin は `channelConfigs.<channel-id>.preferOver` に低優先度の Plugin id を宣言する必要があります。[`/plugins/manifest#replacing-another-channel-plugin`](/ja-JP/plugins/manifest#replacing-another-channel-plugin) を参照してください。
- 重複が意図しないものであれば、
  `plugins.entries.<plugin-id>.enabled: false` で片方を無効化するか、
  古い Plugin インストールを削除してください。
- 両方の Plugin を明示的に有効化した場合、OpenClaw はその要求を維持しつつ、
  競合を報告します。channel の所有者を1つに決めるか、ランタイムサーフェスが曖昧にならないように Plugin 所有の tool 名を変更してください。

## Plugin slot（排他的カテゴリ）

一部のカテゴリは排他的です（同時に有効なのは1つだけ）。

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

| Slot            | 制御対象                 | Default             |
| --------------- | ------------------------ | ------------------- |
| `memory`        | 有効なメモリ Plugin      | `memory-core`       |
| `contextEngine` | 有効な context engine    | `legacy`（built-in） |

## CLI リファレンス

```bash
openclaw plugins list                       # コンパクトな一覧
openclaw plugins list --enabled            # 有効な Plugin のみ
openclaw plugins list --verbose            # Plugin ごとの詳細行
openclaw plugins list --json               # 機械可読な一覧
openclaw plugins inspect <id>              # 詳細情報
openclaw plugins inspect <id> --json       # 機械可読
openclaw plugins inspect --all             # 全体表
openclaw plugins info <id>                 # inspect の別名
openclaw plugins doctor                    # diagnostics
openclaw plugins registry                  # 永続化された registry 状態を確認
openclaw plugins registry --refresh        # 永続化された registry を再構築
openclaw doctor --fix                      # Plugin registry 状態を修復

openclaw plugins install <package>         # インストール（最初に ClawHub、次に npm）
openclaw plugins install clawhub:<pkg>     # ClawHub からのみインストール
openclaw plugins install <spec> --force    # 既存のインストールを上書き
openclaw plugins install <path>            # ローカル path からインストール
openclaw plugins install -l <path>         # 開発用に link（コピーしない）
openclaw plugins install <plugin> --marketplace <source>
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <spec> --pin      # 解決された正確な npm spec を記録
openclaw plugins install <spec> --dangerously-force-unsafe-install
openclaw plugins update <id-or-npm-spec> # 1つの Plugin を更新
openclaw plugins update <id-or-npm-spec> --dangerously-force-unsafe-install
openclaw plugins update --all            # すべて更新
openclaw plugins uninstall <id>          # config と Plugin index レコードを削除
openclaw plugins uninstall <id> --keep-files
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json

openclaw plugins enable <id>
openclaw plugins disable <id>
```

同梱 Plugin は OpenClaw と一緒に提供されます。多くはデフォルトで有効です（たとえば
同梱 model provider、同梱 speech provider、同梱 browser
Plugin）。その他の同梱 Plugin は、引き続き `openclaw plugins enable <id>` が必要です。

`--force` は、既存のインストール済み Plugin または hook pack をその場で上書きします。追跡対象の npm
Plugin の通常のアップグレードには `openclaw plugins update <id-or-npm-spec>` を使用してください。これは、管理対象インストール先にコピーする代わりにソース path を再利用する `--link` ではサポートされません。

`plugins.allow` がすでに設定されている場合、`openclaw plugins install` は、
インストールした Plugin id を有効化前にその allowlist に追加します。同じ Plugin id が
`plugins.deny` に存在する場合、インストールはその古い deny エントリを削除するため、
明示的にインストールした Plugin は再起動後すぐに読み込み可能になります。

OpenClaw は、Plugin 一覧、contribution の所有権、および起動計画のコールドリードモデルとして、
永続化されたローカル Plugin registry を保持します。インストール、更新、
アンインストール、有効化、および無効化の各フローは、Plugin 状態を変更した後にこの registry を更新します。同じ `plugins/installs.json` file は、トップレベル
`installRecords` に永続的なインストール metadata を、`plugins` に再構築可能な manifest metadata を保持します。registry が欠落している、古い、または無効な場合、
`openclaw plugins registry --refresh` は、Plugin ランタイム module を読み込まずに、
インストールレコード、config policy、および manifest/package metadata からその manifest view を再構築します。
`openclaw plugins update <id-or-npm-spec>` は追跡対象インストールに適用されます。
dist-tag または正確なバージョンを持つ npm package spec を渡すと、package 名は追跡対象の Plugin レコードに解決し直され、今後の更新用に新しい spec が記録されます。
バージョンなしの package 名を渡すと、正確に pin 留めされたインストールは registry のデフォルト release line に戻ります。インストール済みの npm Plugin がすでに解決済みバージョンおよび記録済み artifact identity と一致している場合、OpenClaw はダウンロード、再インストール、config の書き換えを行わずに更新をスキップします。

`--pin` は npm 専用です。`--marketplace` ではサポートされません。これは、
marketplace インストールが npm spec ではなく marketplace ソース metadata を永続化するためです。

`--dangerously-force-unsafe-install` は、組み込みの危険コードスキャナーによる誤検知に対するブレークグラス用上書きです。これにより、組み込みの `critical` 検出結果があっても Plugin のインストールと Plugin の更新を継続できますが、それでも Plugin の `before_install` policy block や scan-failure blocking は回避しません。

この CLI フラグは、Plugin のインストール/更新フローにのみ適用されます。Gateway ベースの Skill
依存関係インストールでは、代わりに対応する `dangerouslyForceUnsafeInstall` リクエスト上書きを使用します。一方で `openclaw skills install` は、ClawHub
Skill のダウンロード/インストール用の別フローのままです。

互換 bundle は、同じ Plugin の list/inspect/enable/disable
フローに参加します。現在サポートされるランタイムには、bundle Skills、Claude command-skills、
Claude `settings.json` defaults、Claude `.lsp.json` と manifest 宣言の
`lspServers` defaults、Cursor command-skills、および互換性のある Codex hook
ディレクトリが含まれます。

`openclaw plugins inspect <id>` は、bundle ベースの Plugin に対して、検出された bundle 機能に加え、サポートされるまたはサポートされない MCP および LSP server エントリも報告します。

Marketplace ソースには、`~/.claude/plugins/known_marketplaces.json` にある Claude の既知 marketplace 名、ローカル marketplace root または
`marketplace.json` path、`owner/repo` のような GitHub 短縮表記、GitHub repo
URL、または git URL を指定できます。リモート marketplace では、Plugin エントリはクローンされた marketplace repo 内に収まっていなければならず、相対 path ソースのみを使用する必要があります。

完全な詳細は [`openclaw plugins` CLI リファレンス](/ja-JP/cli/plugins) を参照してください。

## Plugin API 概要

ネイティブ Plugin は `register(api)` を公開するエントリオブジェクトを export します。古い
Plugin はレガシーな別名として `activate(api)` をまだ使用している場合がありますが、新しい Plugin は `register` を使用してください。

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
有効化時に `register(api)` を呼び出します。ローダーは古い Plugin に対しては依然として
`activate(api)` にフォールバックしますが、同梱 Plugin と新しい外部 Plugin は
`register` を公開契約として扱うべきです。

`api.registrationMode` は、エントリがなぜ読み込まれているかを Plugin に伝えます。

| Mode            | 意味                                                                                                                             |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | ランタイム有効化。tool、hook、service、command、route、およびその他のライブ副作用を登録します。                                 |
| `discovery`     | 読み取り専用の機能検出。provider と metadata を登録します。信頼された Plugin エントリコードは読み込まれる場合がありますが、ライブ副作用はスキップします。 |
| `setup-only`    | 軽量なセットアップエントリを通じた channel セットアップ metadata の読み込み。                                                     |
| `setup-runtime` | ランタイムエントリも必要な channel セットアップ読み込み。                                                                         |
| `cli-metadata`  | CLI command metadata の収集のみ。                                                                                                 |

socket、database、バックグラウンド worker、または長寿命 client を開く
Plugin エントリは、それらの副作用を `api.registrationMode === "full"` でガードする必要があります。
discovery 読み込みは、有効化読み込みとは別にキャッシュされ、実行中の Gateway
registry を置き換えません。discovery は非有効化であり、import なしではありません。OpenClaw は snapshot を構築するために、信頼された Plugin エントリまたは channel Plugin module を評価することがあります。module のトップレベルは軽量かつ副作用なしに保ち、network client、subprocess、listener、credential 読み込み、および service 起動はフルランタイムのパスの後ろに移してください。

一般的な登録メソッド:

| Method                                  | 登録するもの                 |
| --------------------------------------- | ---------------------------- |
| `registerProvider`                      | Model provider（LLM）        |
| `registerChannel`                       | Chat channel                 |
| `registerTool`                          | Agent tool                   |
| `registerHook` / `on(...)`              | ライフサイクル hook          |
| `registerSpeechProvider`                | Text-to-speech / STT         |
| `registerRealtimeTranscriptionProvider` | ストリーミング STT           |
| `registerRealtimeVoiceProvider`         | 双方向 realtime voice        |
| `registerMediaUnderstandingProvider`    | 画像/音声分析                |
| `registerImageGenerationProvider`       | 画像生成                     |
| `registerMusicGenerationProvider`       | 音楽生成                     |
| `registerVideoGenerationProvider`       | 動画生成                     |
| `registerWebFetchProvider`              | Web fetch / scrape provider  |
| `registerWebSearchProvider`             | Web search                   |
| `registerHttpRoute`                     | HTTP endpoint                |
| `registerCommand` / `registerCli`       | CLI command                  |
| `registerContextEngine`                 | Context engine               |
| `registerService`                       | バックグラウンド service     |

型付きライフサイクル hook のガード動作:

- `before_tool_call`: `{ block: true }` は終端です。より低い優先度の handler はスキップされます。
- `before_tool_call`: `{ block: false }` は no-op であり、それ以前の block を解除しません。
- `before_install`: `{ block: true }` は終端です。より低い優先度の handler はスキップされます。
- `before_install`: `{ block: false }` は no-op であり、それ以前の block を解除しません。
- `message_sending`: `{ cancel: true }` は終端です。より低い優先度の handler はスキップされます。
- `message_sending`: `{ cancel: false }` は no-op であり、それ以前の cancel を解除しません。

ネイティブ Codex app-server 実行は、Codex ネイティブの tool イベントをこの
hook サーフェスにブリッジバックします。Plugin は `before_tool_call` を通じてネイティブ Codex tool をブロックでき、`after_tool_call` を通じて結果を観測でき、Codex
`PermissionRequest` 承認にも参加できます。このブリッジは、まだ Codex ネイティブの tool 引数を書き換えません。正確な Codex ランタイムのサポート境界は、
[Codex harness v1 support contract](/ja-JP/plugins/codex-harness#v1-support-contract) にあります。

完全な型付き hook 動作については、[SDK overview](/ja-JP/plugins/sdk-overview#hook-decision-semantics) を参照してください。

## 関連項目

- [Building plugins](/ja-JP/plugins/building-plugins) — 独自の Plugin を作成する
- [Plugin bundles](/ja-JP/plugins/bundles) — Codex/Claude/Cursor bundle 互換性
- [Plugin manifest](/ja-JP/plugins/manifest) — manifest schema
- [Registering tools](/ja-JP/plugins/building-plugins#registering-agent-tools) — Plugin に agent tool を追加する
- [Plugin internals](/ja-JP/plugins/architecture) — 機能モデルと読み込みパイプライン
- [Community plugins](/ja-JP/plugins/community) — サードパーティ一覧
