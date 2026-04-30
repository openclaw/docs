---
read_when:
    - OpenClaw が提供するツールを理解したい場合
    - ツールを設定、許可、または拒否する必要があります
    - 組み込みツール、Skills、Plugin のどれを使うか判断している
summary: 'OpenClawのツールとPluginの概要: エージェントにできることと、その拡張方法'
title: ツールとPlugin
x-i18n:
    generated_at: "2026-04-30T05:38:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 62cde740188c224af03b4425c7f6dfca9a12f95603066db5925724fc6a07dcf0
    source_path: tools/index.md
    workflow: 16
---

エージェントがテキスト生成以外で行うことはすべて **ツール** を通じて実行されます。
ツールは、エージェントがファイルを読み取り、コマンドを実行し、Web を閲覧し、メッセージを送信し、デバイスとやり取りするための仕組みです。

## ツール、Skills、Plugin

OpenClaw には、連携して動作する3つのレイヤーがあります。

<Steps>
  <Step title="ツールはエージェントが呼び出すものです">
    ツールは、エージェントが呼び出せる型付き関数です（例: `exec`、`browser`、
    `web_search`、`message`）。OpenClaw には **組み込みツール** のセットが同梱されており、
    Plugin は追加のツールを登録できます。

    エージェントから見ると、ツールはモデル API に送信される構造化された関数定義です。

  </Step>

  <Step title="Skills はエージェントにタイミングと方法を教えます">
    Skill は、システムプロンプトに注入される Markdown ファイル（`SKILL.md`）です。
    Skills は、ツールを効果的に使用するためのコンテキスト、制約、段階的なガイダンスを
    エージェントに提供します。Skills はワークスペース内、共有フォルダー内、
    または Plugin に同梱されます。

    [Skills リファレンス](/ja-JP/tools/skills) | [Skills の作成](/ja-JP/tools/creating-skills)

  </Step>

  <Step title="Plugin はすべてをまとめてパッケージ化します">
    Plugin は、チャンネル、モデルプロバイダー、ツール、Skills、音声、リアルタイム文字起こし、
    リアルタイム音声、メディア理解、画像生成、動画生成、Web フェッチ、Web 検索など、
    任意の組み合わせの機能を登録できるパッケージです。一部の Plugin は **コア**（OpenClaw に同梱）で、
    その他は **外部**（コミュニティによって npm で公開）です。

    [Plugin のインストールと設定](/ja-JP/tools/plugin) | [独自に構築](/ja-JP/plugins/building-plugins)

  </Step>
</Steps>

## 組み込みツール

これらのツールは OpenClaw に同梱されており、Plugin をインストールしなくても利用できます。

| ツール                                       | 機能                                                                  | ページ                                                       |
| ------------------------------------------ | --------------------------------------------------------------------- | ------------------------------------------------------------ |
| `exec` / `process`                         | シェルコマンドを実行し、バックグラウンドプロセスを管理する            | [Exec](/ja-JP/tools/exec), [Exec 承認](/ja-JP/tools/exec-approvals)      |
| `code_execution`                           | サンドボックス化されたリモート Python 解析を実行する                  | [コード実行](/ja-JP/tools/code-execution)                         |
| `browser`                                  | Chromium ブラウザーを操作する（移動、クリック、スクリーンショット）   | [ブラウザー](/ja-JP/tools/browser)                                |
| `web_search` / `x_search` / `web_fetch`    | Web を検索し、X の投稿を検索し、ページコンテンツを取得する            | [Web](/ja-JP/tools/web), [Web フェッチ](/ja-JP/tools/web-fetch)          |
| `read` / `write` / `edit`                  | ワークスペース内のファイル I/O                                        |                                                              |
| `apply_patch`                              | 複数ハンクのファイルパッチ                                            | [パッチ適用](/ja-JP/tools/apply-patch)                            |
| `message`                                  | すべてのチャンネルでメッセージを送信する                              | [エージェント送信](/ja-JP/tools/agent-send)                       |
| `canvas`                                   | Node Canvas を駆動する（表示、評価、スナップショット）                |                                                              |
| `nodes`                                    | ペアリング済みデバイスを検出し、対象にする                            |                                                              |
| `cron` / `gateway`                         | スケジュール済みジョブを管理し、Gateway を検査、パッチ、再起動、更新する |                                                              |
| `image` / `image_generate`                 | 画像を解析または生成する                                              | [画像生成](/ja-JP/tools/image-generation)                         |
| `music_generate`                           | 音楽トラックを生成する                                                | [音楽生成](/ja-JP/tools/music-generation)                         |
| `video_generate`                           | 動画を生成する                                                        | [動画生成](/ja-JP/tools/video-generation)                         |
| `tts`                                      | 一回限りのテキスト読み上げ変換                                        | [TTS](/ja-JP/tools/tts)                                            |
| `sessions_*` / `subagents` / `agents_list` | セッション管理、ステータス、サブエージェントのオーケストレーション    | [サブエージェント](/ja-JP/tools/subagents)                        |
| `session_status`                           | 軽量な `/status` 形式の読み返しとセッションモデルの上書き             | [セッションツール](/ja-JP/concepts/session-tool)                  |

画像作業では、解析には `image` を、生成や編集には `image_generate` を使用します。`openai/*`、`google/*`、`fal/*`、または別の非デフォルト画像プロバイダーを対象にする場合は、先にそのプロバイダーの認証/API キーを設定してください。

音楽作業では、`music_generate` を使用します。`google/*`、`minimax/*`、または別の非デフォルト音楽プロバイダーを対象にする場合は、先にそのプロバイダーの認証/API キーを設定してください。

動画作業では、`video_generate` を使用します。`qwen/*` または別の非デフォルト動画プロバイダーを対象にする場合は、先にそのプロバイダーの認証/API キーを設定してください。

ワークフロー駆動の音声生成では、ComfyUI などの Plugin が登録している場合に
`music_generate` を使用します。これはテキスト読み上げである `tts` とは別です。

`sessions` グループ内の軽量なステータス/読み返しツールが `session_status` です。
現在のセッションに関する `/status` 形式の質問に回答し、
必要に応じてセッション単位のモデル上書きを設定できます。`model=default` はその
上書きを解除します。`/status` と同様に、最新のトランスクリプト使用状況エントリから、
まばらなトークン/キャッシュカウンターとアクティブなランタイムモデルラベルを補完できます。

`gateway` は、Gateway 操作用の所有者専用ランタイムツールです。

- 編集前に1つのパススコープ付き設定サブツリーを確認する `config.schema.lookup`
- 現在の設定スナップショット + ハッシュを取得する `config.get`
- 再起動を伴う部分的な設定更新を行う `config.patch`
- 完全な設定置換にのみ使用する `config.apply`
- 明示的な自己更新 + 再起動を行う `update.run`

部分的な変更では、`config.schema.lookup` の後に `config.patch` を使用してください。
設定全体を意図的に置き換える場合にのみ `config.apply` を使用します。
より広範な設定ドキュメントについては、[設定](/ja-JP/gateway/configuration) と
[設定リファレンス](/ja-JP/gateway/configuration-reference) を参照してください。
このツールは `tools.exec.ask` または `tools.exec.security` の変更も拒否します。
従来の `tools.bash.*` エイリアスは、同じ保護対象 exec パスに正規化されます。

### Plugin 提供ツール

Plugin は追加のツールを登録できます。例:

- [Diffs](/ja-JP/tools/diffs) — diff ビューアーとレンダラー
- [LLM タスク](/ja-JP/tools/llm-task) — 構造化出力のための JSON 専用 LLM ステップ
- [Lobster](/ja-JP/tools/lobster) — 再開可能な承認を備えた型付きワークフローランタイム
- [音楽生成](/ja-JP/tools/music-generation) — ワークフローバックのプロバイダーを備えた共有 `music_generate` ツール
- [OpenProse](/ja-JP/prose) — Markdown ファーストのワークフローオーケストレーション
- [Tokenjuice](/ja-JP/tools/tokenjuice) — ノイズの多い `exec` と `bash` ツール結果をコンパクト化

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

明示的な許可リストが呼び出し可能なツールに解決されない場合、OpenClaw は失敗終了します。
たとえば、`tools.allow: ["query_db"]` は、読み込まれた Plugin が実際に
`query_db` を登録している場合にのみ機能します。組み込み、Plugin、または同梱 MCP ツールのいずれも
許可リストに一致しない場合、ツール結果を幻覚する可能性のある
テキストのみの実行として続行するのではなく、モデル呼び出しの前に実行が停止します。

### ツールプロファイル

`tools.profile` は、`allow`/`deny` が適用される前のベース許可リストを設定します。
エージェント単位の上書き: `agents.list[].tools.profile`。

| プロファイル | 含まれるもの                                                                                                                                      |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `full`      | より広範なコマンド/制御アクセスのための無制限ベースライン。`tools.profile` を未設定にした場合と同じ                                               |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `music_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                                         |
| `minimal`   | `session_status` のみ                                                                                                                              |

<Note>
`tools.profile: "messaging"` は、チャンネル中心のエージェント向けに意図的に狭くなっています。
ファイルシステム、ランタイム、ブラウザー、canvas、nodes、cron、Gateway 制御などの
より広範なコマンド/制御ツールは含まれません。より広範なコマンド/制御アクセスの無制限ベースラインとして
`tools.profile: "full"` を使用し、必要に応じて
`tools.allow` / `tools.deny` でアクセスを絞り込んでください。
</Note>

`coding` には軽量な Web ツール（`web_search`、`web_fetch`、`x_search`）が含まれますが、
完全なブラウザー制御ツールは含まれません。ブラウザー自動化は実際の
セッションやログイン済みプロファイルを操作できるため、
`tools.alsoAllow: ["browser"]` またはエージェント単位の
`agents.list[].tools.alsoAllow: ["browser"]` で明示的に追加してください。

`coding` と `messaging` のプロファイルでは、Plugin キー `bundle-mcp` 配下に設定された
バンドル MCP ツールも許可されます。プロファイルの通常の組み込みツールは維持しつつ、
設定済みの MCP ツールをすべて非表示にしたい場合は、`tools.deny: ["bundle-mcp"]` を追加してください。
`minimal` プロファイルにはバンドル MCP ツールは含まれません。

例（デフォルトで最も広いツール範囲）:

```json5
{
  tools: {
    profile: "full",
  },
}
```

### ツールグループ

許可/拒否リストでは `group:*` の短縮表記を使用します:

| グループ           | ツール                                                                                                    |
| ------------------ | --------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | exec, process, code_execution（`bash` は `exec` のエイリアスとして受け付けられます）                      |
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
| `group:openclaw`   | すべての組み込み OpenClaw ツール（Plugin ツールは除く）                                                   |

`sessions_history` は、範囲が制限され、安全性フィルターが適用された想起ビューを返します。生のトランスクリプトのダンプとして動作するのではなく、思考タグ、`<relevant-memories>` のスキャフォールディング、プレーンテキストのツール呼び出し XML ペイロード（`<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>`、および切り詰められたツール呼び出しブロックを含む）、ダウングレードされたツール呼び出しスキャフォールディング、漏出した ASCII/全角のモデル制御トークン、assistant テキスト内の不正な MiniMax ツール呼び出し XML を取り除き、その後に秘匿化/切り詰めと、必要に応じてサイズ過大行のプレースホルダーを適用します。

### プロバイダー固有の制限

グローバルなデフォルトを変更せずに特定のプロバイダーのツールを制限するには、`tools.byProvider` を使用します。

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
