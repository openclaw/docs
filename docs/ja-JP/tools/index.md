---
read_when:
    - OpenClaw が提供するツールについて理解したい
    - ツールを設定、許可、または拒否する必要があります
    - 組み込みツール、Skills、pluginsのどれを使うかを決めています
summary: 'OpenClawのツールとPluginの概要: エージェントでできることと拡張方法'
title: ツールとPlugin
x-i18n:
    generated_at: "2026-05-02T21:07:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 892eb520c14c13e4f55c80aa17ccd2578cc803796844c15cd71674cb2a0a8adf
    source_path: tools/index.md
    workflow: 16
---

エージェントがテキスト生成を超えて行うことは、すべて **ツール** を通じて実行されます。
ツールは、エージェントがファイルを読み取り、コマンドを実行し、Web を閲覧し、
メッセージを送信し、デバイスとやり取りするための仕組みです。

## ツール、Skills、plugins

OpenClaw には、連携して動作する 3 つのレイヤーがあります。

<Steps>
  <Step title="ツールはエージェントが呼び出すものです">
    ツールは、エージェントが呼び出せる型付き関数です（例: `exec`、`browser`、
    `web_search`、`message`）。OpenClaw には一連の **組み込みツール** が同梱されており、
    plugins は追加のツールを登録できます。

    エージェントは、モデル API に送信される構造化された関数定義としてツールを認識します。

  </Step>

  <Step title="Skills はエージェントにいつ、どのように行うかを教えます">
    skill は、システムプロンプトに注入される Markdown ファイル（`SKILL.md`）です。
    Skills は、ツールを効果的に使うためのコンテキスト、制約、段階的なガイダンスを
    エージェントに提供します。Skills はワークスペース内、共有フォルダー内、
    または plugins 内に同梱されています。

    [Skills リファレンス](/ja-JP/tools/skills) | [Skills の作成](/ja-JP/tools/creating-skills)

  </Step>

  <Step title="Plugins はすべてをまとめてパッケージ化します">
    plugin は、任意の組み合わせの機能を登録できるパッケージです。
    チャンネル、モデルプロバイダー、ツール、Skills、音声、リアルタイム文字起こし、
    リアルタイム音声、メディア理解、画像生成、動画生成、
    Web フェッチ、Web 検索などを登録できます。一部の plugins は **core**（OpenClaw に同梱）で、
    その他は **外部**（コミュニティによって npm に公開）です。

    [plugins のインストールと設定](/ja-JP/tools/plugin) | [独自に構築する](/ja-JP/plugins/building-plugins)

  </Step>
</Steps>

## 組み込みツール

これらのツールは OpenClaw に同梱されており、plugins をインストールしなくても利用できます。

| ツール                                     | 機能                                                                  | ページ                                                       |
| ------------------------------------------ | --------------------------------------------------------------------- | ------------------------------------------------------------ |
| `exec` / `process`                         | シェルコマンドを実行し、バックグラウンドプロセスを管理する            | [Exec](/ja-JP/tools/exec), [Exec 承認](/ja-JP/tools/exec-approvals)      |
| `code_execution`                           | サンドボックス化されたリモート Python 解析を実行する                  | [Code Execution](/ja-JP/tools/code-execution)                      |
| `browser`                                  | Chromium ブラウザーを制御する（移動、クリック、スクリーンショット）   | [Browser](/ja-JP/tools/browser)                                    |
| `web_search` / `x_search` / `web_fetch`    | Web を検索し、X 投稿を検索し、ページコンテンツを取得する              | [Web](/ja-JP/tools/web), [Web Fetch](/ja-JP/tools/web-fetch)             |
| `read` / `write` / `edit`                  | ワークスペース内のファイル I/O                                       |                                                              |
| `apply_patch`                              | 複数ハンクのファイルパッチ                                            | [Apply Patch](/ja-JP/tools/apply-patch)                            |
| `message`                                  | すべてのチャンネルにメッセージを送信する                              | [Agent Send](/ja-JP/tools/agent-send)                              |
| `canvas`                                   | ノード Canvas を操作する（表示、評価、スナップショット）              |                                                              |
| `nodes`                                    | ペアリング済みデバイスを検出して対象にする                            |                                                              |
| `cron` / `gateway`                         | スケジュール済みジョブを管理し、gateway を検査、パッチ、再起動、更新する |                                                              |
| `image` / `image_generate`                 | 画像を解析または生成する                                              | [画像生成](/ja-JP/tools/image-generation)                          |
| `music_generate`                           | 音楽トラックを生成する                                                | [音楽生成](/ja-JP/tools/music-generation)                          |
| `video_generate`                           | 動画を生成する                                                        | [動画生成](/ja-JP/tools/video-generation)                          |
| `tts`                                      | 単発のテキスト読み上げ変換                                            | [TTS](/ja-JP/tools/tts)                                            |
| `sessions_*` / `subagents` / `agents_list` | セッション管理、ステータス、サブエージェントのオーケストレーション    | [サブエージェント](/ja-JP/tools/subagents)                         |
| `session_status`                           | 軽量な `/status` 形式の読み戻しとセッションモデルの上書き             | [セッションツール](/ja-JP/concepts/session-tool)                   |

画像作業では、解析には `image` を、生成または編集には `image_generate` を使用します。`openai/*`、`google/*`、`fal/*`、または別の非デフォルト画像プロバイダーを対象にする場合は、先にそのプロバイダーの auth/API キーを設定してください。

音楽作業では、`music_generate` を使用します。`google/*`、`minimax/*`、または別の非デフォルト音楽プロバイダーを対象にする場合は、先にそのプロバイダーの auth/API キーを設定してください。

動画作業では、`video_generate` を使用します。`qwen/*` または別の非デフォルト動画プロバイダーを対象にする場合は、先にそのプロバイダーの auth/API キーを設定してください。

ワークフロー駆動の音声生成では、ComfyUI のような plugin が登録している場合に
`music_generate` を使用します。これは、テキスト読み上げである `tts` とは別です。

`session_status` は、セッショングループ内の軽量なステータス/読み戻しツールです。
現在のセッションに関する `/status` 形式の質問に答え、
任意でセッション単位のモデル上書きを設定できます。`model=default` はその
上書きをクリアします。`/status` と同様に、最新のトランスクリプト使用状況エントリから、
不足しているトークン/キャッシュカウンターとアクティブなランタイムモデルラベルを補完できます。

`gateway` は、Gateway 操作用の所有者専用ランタイムツールです。

- 編集前に 1 つのパススコープ設定サブツリーを対象にする `config.schema.lookup`
- 現在の設定スナップショット + ハッシュを取得する `config.get`
- 再起動を伴う部分的な設定更新のための `config.patch`
- 完全な設定置換専用の `config.apply`
- 明示的な自己更新 + 再起動のための `update.run`

部分的な変更では、`config.schema.lookup` の後に `config.patch` を優先してください。
`config.apply` は、設定全体を意図的に置き換える場合にのみ使用します。
より広範な設定ドキュメントについては、[設定](/ja-JP/gateway/configuration) と
[設定リファレンス](/ja-JP/gateway/configuration-reference) を参照してください。
このツールは `tools.exec.ask` や `tools.exec.security` の変更も拒否します。
レガシーの `tools.bash.*` エイリアスは、同じ保護対象の exec パスに正規化されます。

### Plugin 提供ツール

Plugins は追加のツールを登録できます。例:

- [Diffs](/ja-JP/tools/diffs) — diff ビューアーとレンダラー
- [LLM Task](/ja-JP/tools/llm-task) — 構造化出力のための JSON 専用 LLM ステップ
- [Lobster](/ja-JP/tools/lobster) — 再開可能な承認を備えた型付きワークフローランタイム
- [音楽生成](/ja-JP/tools/music-generation) — ワークフロー支援プロバイダーを備えた共有 `music_generate` ツール
- [OpenProse](/ja-JP/prose) — Markdown 優先のワークフローオーケストレーション
- [Tokenjuice](/ja-JP/tools/tokenjuice) — ノイズの多い `exec` と `bash` ツール結果をコンパクト化

Plugin ツールは引き続き `api.registerTool(...)` で作成され、
plugin manifest の `contracts.tools` リストで宣言されます。OpenClaw は検出時に検証済みの
ツール記述子を取得し、plugin ソースとコントラクトごとにキャッシュするため、
後続のツール計画では plugin ランタイムのロードを省略できます。ツール実行時には引き続き、
所有する plugin をロードし、実際に登録された実装を呼び出します。

## ツール設定

### allow リストと deny リスト

config の `tools.allow` / `tools.deny` で、エージェントが呼び出せるツールを制御します。
deny は常に allow より優先されます。

```json5
{
  tools: {
    allow: ["group:fs", "browser", "web_search"],
    deny: ["exec"],
  },
}
```

明示的な allowlist が呼び出し可能なツールに解決されない場合、OpenClaw はクローズドに失敗します。
たとえば、`tools.allow: ["query_db"]` は、ロード済みの plugin が実際に
`query_db` を登録している場合にのみ機能します。組み込み、plugin、または同梱 MCP ツールのいずれも
allowlist に一致しない場合、ツール結果を幻覚する可能性があるテキスト専用実行として続行するのではなく、
モデル呼び出しの前に実行を停止します。

### ツールプロファイル

`tools.profile` は、`allow`/`deny` が適用される前の基本 allowlist を設定します。
エージェント単位の上書き: `agents.list[].tools.profile`。

| プロファイル | 含まれるもの                                                                                                                                      |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `full`      | より広範なコマンド/制御アクセスのための無制限ベースライン。`tools.profile` を未設定のままにするのと同じ                                           |
| `coding`    | `group:fs`、`group:runtime`、`group:web`、`group:sessions`、`group:memory`、`cron`、`image`、`image_generate`、`music_generate`、`video_generate` |
| `messaging` | `group:messaging`、`sessions_list`、`sessions_history`、`sessions_send`、`session_status`                                                        |
| `minimal`   | `session_status` のみ                                                                                                                             |

<Note>
`tools.profile: "messaging"` は、チャンネル中心のエージェント向けに意図的に狭く設定されています。
ファイルシステム、ランタイム、ブラウザー、canvas、nodes、cron、gateway 制御のような
より広範なコマンド/制御ツールは含まれません。より広範なコマンド/制御アクセスの
無制限ベースラインとして `tools.profile: "full"` を使用し、必要に応じて
`tools.allow` / `tools.deny` でアクセスを絞り込んでください。
</Note>

`coding` には軽量な Web ツール（`web_search`、`web_fetch`、`x_search`）が含まれますが、
完全なブラウザー制御ツールは含まれません。ブラウザー自動化は実際の
セッションやログイン済みプロファイルを操作できるため、`tools.alsoAllow: ["browser"]`
またはエージェント単位の `agents.list[].tools.alsoAllow: ["browser"]` で明示的に追加してください。

<Note>
制限付きプロファイル（`messaging`、`minimal`）の下で `tools.exec` または `tools.fs` を設定しても、プロファイルの allowlist が暗黙的に広がることはありません。制限付きプロファイルでそれらの設定セクションを使いたい場合は、明示的な `tools.alsoAllow` エントリ（たとえば exec には `["exec", "process"]`、fs には `["read", "write", "edit"]`）を追加してください。OpenClaw は、一致する `alsoAllow` 付与なしに設定セクションが存在する場合、起動時に警告を記録します。
</Note>

`coding` と `messaging` プロファイルでは、plugin キー `bundle-mcp` の下にある
設定済み bundle MCP ツールも許可されます。通常の組み込みツールは維持しつつ、
設定済み MCP ツールをすべて非表示にしたい場合は、`tools.deny: ["bundle-mcp"]` を追加してください。
`minimal` プロファイルには bundle MCP ツールは含まれません。

例（デフォルトで最も広いツール面）:

```json5
{
  tools: {
    profile: "full",
  },
}
```

### ツールグループ

allow/deny リストでは `group:*` 省略表記を使用します:

| グループ           | ツール                                                                                                    |
| ------------------ | --------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | exec, process, code_execution（`bash` は `exec` のエイリアスとして受け入れられます）                       |
| `group:fs`         | read, write, edit, apply_patch                                                                            |
| `group:sessions`   | sessions_list, sessions_history, sessions_send, sessions_spawn, sessions_yield, subagents, session_status |
| `group:memory`     | memory_search, memory_get                                                                                 |
| `group:web`        | web_search, x_search, web_fetch                                                                           |
| `group:ui`         | browser, canvas                                                                                           |
| `group:automation` | cron, gateway                                                                                             |
| `group:messaging`  | message                                                                                                   |
| `group:nodes`      | nodes                                                                                                     |
| `group:agents`     | agents_list                                                                                               |
| `group:media`      | image, image_generate, music_generate, video_generate, tts                                                |
| `group:openclaw`   | すべての組み込み OpenClaw ツール（Pluginツールを除く）                                                    |

`sessions_history` は、範囲が制限され、安全性でフィルタリングされた想起ビューを返します。これは、thinkingタグ、`<relevant-memories>` の足場、プレーンテキストのツール呼び出しXMLペイロード（`<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>`、および切り詰められたツール呼び出しブロックを含む）、降格されたツール呼び出しの足場、漏えいしたASCII/全角のモデル制御トークン、assistantテキスト内の不正なMiniMaxツール呼び出しXMLを取り除きます。その後、生のトランスクリプトダンプとして動作するのではなく、秘匿/切り詰めと、必要に応じて過大な行のプレースホルダーを適用します。

### プロバイダー固有の制限

グローバルデフォルトを変更せずに特定のプロバイダー向けのツールを制限するには、`tools.byProvider` を使用します。

```json5
{
  tools: {
    profile: "coding",
    byProvider: {
      "google-antigravity": { profile: "minimal" },
    },
  },
}
```
