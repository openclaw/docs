---
read_when:
    - OpenClaw が提供するツールを理解したい
    - ツールを設定、許可、または拒否する必要があります
    - 組み込みツール、Skills、Plugin のどれを使うかを決める
summary: 'OpenClaw のツールと Plugin の概要: エージェントができることと拡張方法'
title: ツールとPlugin
x-i18n:
    generated_at: "2026-05-07T13:26:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: e001a51222a1b838ded2498bcedc6bd95dbc0a8912850ad7de21e28b25c50790
    source_path: tools/index.md
    workflow: 16
---

エージェントがテキスト生成以外に行うすべてのことは、**ツール**を通じて実行されます。
ツールは、エージェントがファイルを読み、コマンドを実行し、ウェブを閲覧し、メッセージを送信し、デバイスとやり取りするための仕組みです。

## ツール、Skills、Plugin

OpenClaw には、連携して動作する 3 つのレイヤーがあります。

<Steps>
  <Step title="ツールはエージェントが呼び出すもの">
    ツールは、エージェントが呼び出せる型付き関数です（例: `exec`、`browser`、
    `web_search`、`message`）。OpenClaw には一連の**組み込みツール**が同梱されており、
    Plugin は追加のツールを登録できます。

    エージェントから見るツールは、モデル API に送信される構造化された関数定義です。

  </Step>

  <Step title="Skills はエージェントにいつ、どのように使うかを教える">
    Skill は、システムプロンプトに注入される markdown ファイル（`SKILL.md`）です。
    Skills は、ツールを効果的に使うためのコンテキスト、制約、段階的な手順を
    エージェントに提供します。Skills はワークスペース内、共有フォルダー内、
    または Plugin 内に含まれます。

    [Skills リファレンス](/ja-JP/tools/skills) | [Skills の作成](/ja-JP/tools/creating-skills)

  </Step>

  <Step title="Plugin はすべてをまとめてパッケージ化する">
    Plugin は、チャンネル、モデルプロバイダー、ツール、Skills、音声、リアルタイム文字起こし、
    リアルタイム音声、メディア理解、画像生成、動画生成、
    web fetch、web search など、任意の組み合わせの機能を登録できるパッケージです。一部の Plugin は **core**（OpenClaw に同梱）で、
    それ以外は **external**（コミュニティによって npm に公開）です。

    [Plugin のインストールと設定](/ja-JP/tools/plugin) | [独自にビルドする](/ja-JP/plugins/building-plugins)

  </Step>
</Steps>

## 組み込みツール

これらのツールは OpenClaw に同梱されており、Plugin をインストールしなくても利用できます。

| ツール                                     | 機能                                                                  | ページ                                                       |
| ------------------------------------------ | --------------------------------------------------------------------- | ------------------------------------------------------------ |
| `exec` / `process`                         | シェルコマンドを実行し、バックグラウンドプロセスを管理する            | [Exec](/ja-JP/tools/exec), [Exec Approvals](/ja-JP/tools/exec-approvals) |
| `code_execution`                           | サンドボックス化されたリモート Python 解析を実行する                  | [Code Execution](/ja-JP/tools/code-execution)                      |
| `browser`                                  | Chromium ブラウザーを制御する（移動、クリック、スクリーンショット）   | [Browser](/ja-JP/tools/browser)                                    |
| `web_search` / `x_search` / `web_fetch`    | ウェブを検索し、X の投稿を検索し、ページ内容を取得する                | [Web](/ja-JP/tools/web), [Web Fetch](/ja-JP/tools/web-fetch)             |
| `read` / `write` / `edit`                  | ワークスペース内のファイル I/O                                        |                                                              |
| `apply_patch`                              | 複数ハンクのファイルパッチ                                            | [Apply Patch](/ja-JP/tools/apply-patch)                            |
| `message`                                  | すべてのチャンネルにメッセージを送信する                              | [Agent Send](/ja-JP/tools/agent-send)                              |
| `nodes`                                    | ペアリング済みデバイスを検出してターゲットにする                      |                                                              |
| `cron` / `gateway`                         | スケジュール済みジョブを管理し、Gateway を検査、パッチ、再起動、更新する |                                                              |
| `image` / `image_generate`                 | 画像を解析または生成する                                              | [Image Generation](/ja-JP/tools/image-generation)                  |
| `music_generate`                           | 音楽トラックを生成する                                                | [Music Generation](/ja-JP/tools/music-generation)                  |
| `video_generate`                           | 動画を生成する                                                        | [Video Generation](/ja-JP/tools/video-generation)                  |
| `tts`                                      | 1 回限りのテキスト読み上げ変換                                        | [TTS](/ja-JP/tools/tts)                                            |
| `sessions_*` / `subagents` / `agents_list` | セッション管理、ステータス、サブエージェントのオーケストレーション    | [サブエージェント](/ja-JP/tools/subagents)                         |
| `session_status`                           | 軽量な `/status` 形式の読み返しとセッションモデル上書き               | [セッションツール](/ja-JP/concepts/session-tool)                   |

画像作業では、解析には `image` を、生成または編集には `image_generate` を使用します。`openai/*`、`google/*`、`fal/*`、または別の非デフォルト画像プロバイダーを対象にする場合は、先にそのプロバイダーの認証/API キーを設定してください。

音楽作業では、`music_generate` を使用します。`google/*`、`minimax/*`、または別の非デフォルト音楽プロバイダーを対象にする場合は、先にそのプロバイダーの認証/API キーを設定してください。

動画作業では、`video_generate` を使用します。`qwen/*` または別の非デフォルト動画プロバイダーを対象にする場合は、先にそのプロバイダーの認証/API キーを設定してください。

ワークフロー駆動の音声生成では、ComfyUI などの Plugin が登録している場合は
`music_generate` を使用します。これはテキスト読み上げである `tts` とは別です。

`session_status` は、セッショングループ内の軽量なステータス/読み返しツールです。
現在のセッションに関する `/status` 形式の質問に答え、
任意でセッションごとのモデル上書きを設定できます。`model=default` はその
上書きを解除します。`/status` と同様に、最新のトランスクリプト使用量エントリから
疎なトークン/キャッシュカウンターと、アクティブなランタイムモデルラベルをバックフィルできます。

`gateway` は、Gateway 操作用のオーナー専用ランタイムツールです。

- 編集前に 1 つのパススコープ設定サブツリーを確認する `config.schema.lookup`
- 現在の設定スナップショット + ハッシュを取得する `config.get`
- 再起動を伴う部分的な設定更新を行う `config.patch`
- 設定全体の置換にのみ使う `config.apply`
- 明示的な自己更新 + 再起動を行う `update.run`

部分的な変更では、`config.schema.lookup` の後に `config.patch` を使うことを推奨します。
`config.apply` は、意図的に設定全体を置き換える場合にのみ使用してください。
より広範な設定ドキュメントについては、[設定](/ja-JP/gateway/configuration) と
[設定リファレンス](/ja-JP/gateway/configuration-reference) を参照してください。
このツールは `tools.exec.ask` または `tools.exec.security` の変更も拒否します。
従来の `tools.bash.*` エイリアスは、同じ保護対象の exec パスに正規化されます。

### Plugin 提供ツール

Plugin は追加ツールを登録できます。例:

- [Canvas](/ja-JP/plugins/reference/canvas) — Node Canvas 制御と A2UI レンダリングのための実験的な同梱 Plugin
- [Diffs](/ja-JP/tools/diffs) — diff ビューアーおよびレンダラー
- [LLM Task](/ja-JP/tools/llm-task) — 構造化出力のための JSON 専用 LLM ステップ
- [Lobster](/ja-JP/tools/lobster) — 再開可能な承認を備えた型付きワークフローランタイム
- [Music Generation](/ja-JP/tools/music-generation) — ワークフロー対応プロバイダーを備えた共有 `music_generate` ツール
- [OpenProse](/ja-JP/prose) — markdown ファーストのワークフローオーケストレーション
- [Tokenjuice](/ja-JP/tools/tokenjuice) — ノイズの多い `exec` と `bash` ツール結果をコンパクト化する

Plugin ツールは引き続き `api.registerTool(...)` で作成され、
Plugin マニフェストの `contracts.tools` リストで宣言されます。OpenClaw は検出時に検証済みの
ツール記述子を取得し、Plugin ソースと contract ごとにキャッシュするため、
以降のツール計画では Plugin ランタイムの読み込みを省略できます。ツール実行時には引き続き
所有元 Plugin を読み込み、ライブ登録された実装を呼び出します。

## ツール設定

### 許可リストと拒否リスト

設定内の `tools.allow` / `tools.deny` を使って、エージェントが呼び出せるツールを制御します。
拒否は常に許可より優先されます。

```json5
{
  tools: {
    allow: ["group:fs", "browser", "web_search"],
    deny: ["exec"],
  },
}
```

明示的な許可リストが呼び出し可能なツールに解決されない場合、OpenClaw は閉じた状態で失敗します。
たとえば、`tools.allow: ["query_db"]` は、読み込まれた Plugin が実際に
`query_db` を登録している場合にのみ機能します。許可リストに一致する組み込み、Plugin、
または同梱 MCP ツールがない場合、ツール結果を幻覚する可能性のある
テキスト専用実行として続行するのではなく、モデル呼び出し前に実行が停止します。

### ツールプロファイル

`tools.profile` は、`allow`/`deny` が適用される前の基本許可リストを設定します。
エージェントごとの上書き: `agents.list[].tools.profile`。

| プロファイル | 含まれるもの                                                                                                                                      |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `full`      | すべての core および任意の Plugin ツール。より広範なコマンド/制御アクセスのための無制限のベースライン                                           |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `music_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                                         |
| `minimal`   | `session_status` のみ                                                                                                                             |

<Note>
`tools.profile: "messaging"` は、チャンネル中心のエージェント向けに意図的に狭く設定されています。
ファイルシステム、ランタイム、ブラウザー、canvas、nodes、cron、Gateway 制御などの、
より広範なコマンド/制御ツールは含まれません。より広範なコマンド/制御アクセスのための
無制限のベースラインとして `tools.profile: "full"` を使用し、必要に応じて
`tools.allow` / `tools.deny` でアクセスを絞り込んでください。
</Note>

`coding` には軽量なウェブツール（`web_search`、`web_fetch`、`x_search`）が含まれますが、
完全なブラウザー制御ツールは含まれません。ブラウザー自動化は実際の
セッションとログイン済みプロファイルを操作できるため、
`tools.alsoAllow: ["browser"]` またはエージェントごとの
`agents.list[].tools.alsoAllow: ["browser"]` で明示的に追加してください。

<Note>
制限付きプロファイル（`messaging`、`minimal`）の下で `tools.exec` または `tools.fs` を設定しても、プロファイルの許可リストは暗黙的には広がりません。制限付きプロファイルでそれらの設定セクションを使用したい場合は、明示的な `tools.alsoAllow` エントリ（たとえば exec には `["exec", "process"]`、fs には `["read", "write", "edit"]`）を追加してください。一致する `alsoAllow` 付与がない設定セクションが存在する場合、OpenClaw は起動時に警告をログ出力します。
</Note>

`coding` と `messaging` プロファイルでは、Plugin キー `bundle-mcp` の下にある
設定済みの bundle MCP ツールも許可されます。プロファイルで通常の組み込みツールは維持しつつ、
設定済み MCP ツールをすべて非表示にしたい場合は、`tools.deny: ["bundle-mcp"]` を追加してください。
`minimal` プロファイルには bundle MCP ツールは含まれません。

例（デフォルトで最も広いツールサーフェス）:

```json5
{
  tools: {
    profile: "full",
  },
}
```

### ツールグループ

許可/拒否リストでは `group:*` 省略形を使用します:

| グループ           | ツール                                                                                                    |
| ------------------ | --------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | exec, process, code_execution（`bash` は `exec` の別名として受け付けられます）                            |
| `group:fs`         | read, write, edit, apply_patch                                                                            |
| `group:sessions`   | sessions_list, sessions_history, sessions_send, sessions_spawn, sessions_yield, subagents, session_status |
| `group:memory`     | memory_search, memory_get                                                                                 |
| `group:web`        | web_search, x_search, web_fetch                                                                           |
| `group:ui`         | バンドルされた Canvas Plugin が有効な場合の browser, canvas                                              |
| `group:automation` | heartbeat_respond, cron, gateway                                                                          |
| `group:messaging`  | message                                                                                                   |
| `group:nodes`      | nodes                                                                                                     |
| `group:agents`     | agents_list, update_plan                                                                                  |
| `group:media`      | image, image_generate, music_generate, video_generate, tts                                                |
| `group:openclaw`   | すべての組み込み OpenClaw ツール（Plugin ツールを除く）                                                  |

`sessions_history` は、境界付きで安全性フィルター済みの想起ビューを返します。これは
thinking タグ、`<relevant-memories>` の足場、プレーンテキストのツール呼び出し XML
ペイロード（`<tool_call>...</tool_call>`、
`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、
`<function_calls>...</function_calls>`、および切り詰められたツール呼び出しブロックを含む）、
降格されたツール呼び出しの足場、漏出した ASCII/全角のモデル制御
トークン、assistant テキスト内の不正な MiniMax ツール呼び出し XML を除去し、その後、
生のトランスクリプトダンプとして動作する代わりに、墨消し/切り詰めと、必要に応じてサイズ超過行のプレースホルダーを適用します。

### プロバイダー固有の制限

グローバル既定値を変更せずに、特定のプロバイダー向けにツールを制限するには `tools.byProvider` を使用します。

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
