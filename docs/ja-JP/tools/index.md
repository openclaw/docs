---
read_when:
    - OpenClaw が提供するツールを理解したい場合
    - ツールを設定、許可、または拒否する必要があります
    - 組み込みツール、Skills、Pluginのどれを使うかを決めています
summary: 'OpenClaw のツールと Plugin の概要: エージェントでできることと拡張方法'
title: ツールとプラグイン
x-i18n:
    generated_at: "2026-04-30T16:30:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7acfac11669b6f9696a368c08afada8d33e30ac2f452d507f5d1bc36bae367eb
    source_path: tools/index.md
    workflow: 16
---

エージェントがテキスト生成以外に行うすべてのことは、**ツール**を通じて実行されます。
ツールは、エージェントがファイルを読み取り、コマンドを実行し、Webを閲覧し、メッセージを送信し、デバイスとやり取りするための仕組みです。

## ツール、Skills、Plugin

OpenClaw には、連携して動作する3つのレイヤーがあります。

<Steps>
  <Step title="Tools are what the agent calls">
    ツールは、エージェントが呼び出せる型付き関数です（例: `exec`、`browser`、
    `web_search`、`message`）。OpenClaw には一連の**組み込みツール**が含まれており、
    Plugin は追加のツールを登録できます。

    エージェントには、ツールがモデル API に送信される構造化された関数定義として見えます。

  </Step>

  <Step title="Skills teach the agent when and how">
    Skill は、システムプロンプトに注入される Markdown ファイル（`SKILL.md`）です。
    Skills は、ツールを効果的に使うためのコンテキスト、制約、手順ごとのガイダンスを
    エージェントに提供します。Skills はワークスペース、共有フォルダー、
    または Plugin 内に配置されます。

    [Skills リファレンス](/ja-JP/tools/skills) | [Skills の作成](/ja-JP/tools/creating-skills)

  </Step>

  <Step title="Plugins package everything together">
    Plugin は、機能の任意の組み合わせを登録できるパッケージです:
    チャンネル、モデルプロバイダー、ツール、Skills、音声、リアルタイム文字起こし、
    リアルタイム音声、メディア理解、画像生成、動画生成、
    Web 取得、Web 検索などです。一部の Plugin は **core**（OpenClaw に同梱）
    であり、その他は **external**（コミュニティによって npm で公開）です。

    [Plugin のインストールと設定](/ja-JP/tools/plugin) | [独自に構築する](/ja-JP/plugins/building-plugins)

  </Step>
</Steps>

## 組み込みツール

これらのツールは OpenClaw に同梱されており、Plugin をインストールしなくても利用できます。

| ツール                                     | 機能                                                                  | ページ                                                       |
| ------------------------------------------ | --------------------------------------------------------------------- | ------------------------------------------------------------ |
| `exec` / `process`                         | シェルコマンドを実行し、バックグラウンドプロセスを管理する            | [Exec](/ja-JP/tools/exec), [Exec 承認](/ja-JP/tools/exec-approvals)      |
| `code_execution`                           | サンドボックス化されたリモート Python 解析を実行する                  | [Code Execution](/ja-JP/tools/code-execution)                      |
| `browser`                                  | Chromium ブラウザーを制御する（移動、クリック、スクリーンショット）   | [Browser](/ja-JP/tools/browser)                                    |
| `web_search` / `x_search` / `web_fetch`    | Web を検索し、X の投稿を検索し、ページコンテンツを取得する            | [Web](/ja-JP/tools/web), [Web Fetch](/ja-JP/tools/web-fetch)             |
| `read` / `write` / `edit`                  | ワークスペース内のファイル I/O                                        |                                                              |
| `apply_patch`                              | 複数ハンクのファイルパッチ                                            | [Apply Patch](/ja-JP/tools/apply-patch)                            |
| `message`                                  | すべてのチャンネルにメッセージを送信する                              | [Agent Send](/ja-JP/tools/agent-send)                              |
| `canvas`                                   | Node Canvas を操作する（表示、評価、スナップショット）                |                                                              |
| `nodes`                                    | ペアリングされたデバイスを検出し、対象にする                          |                                                              |
| `cron` / `gateway`                         | スケジュールされたジョブを管理し、gateway を検査、パッチ、再起動、更新する |                                                              |
| `image` / `image_generate`                 | 画像を解析または生成する                                              | [画像生成](/ja-JP/tools/image-generation)                          |
| `music_generate`                           | 音楽トラックを生成する                                                | [音楽生成](/ja-JP/tools/music-generation)                          |
| `video_generate`                           | 動画を生成する                                                        | [動画生成](/ja-JP/tools/video-generation)                          |
| `tts`                                      | 1回限りのテキスト読み上げ変換                                         | [TTS](/ja-JP/tools/tts)                                            |
| `sessions_*` / `subagents` / `agents_list` | セッション管理、ステータス、サブエージェントのオーケストレーション    | [サブエージェント](/ja-JP/tools/subagents)                         |
| `session_status`                           | 軽量な `/status` 形式の読み戻しとセッションモデルのオーバーライド     | [セッションツール](/ja-JP/concepts/session-tool)                   |

画像作業では、解析には `image` を、生成または編集には `image_generate` を使用します。`openai/*`、`google/*`、`fal/*`、または別の非デフォルト画像プロバイダーを対象にする場合は、まずそのプロバイダーの認証/API キーを設定してください。

音楽作業では、`music_generate` を使用します。`google/*`、`minimax/*`、または別の非デフォルト音楽プロバイダーを対象にする場合は、まずそのプロバイダーの認証/API キーを設定してください。

動画作業では、`video_generate` を使用します。`qwen/*` または別の非デフォルト動画プロバイダーを対象にする場合は、まずそのプロバイダーの認証/API キーを設定してください。

ワークフロー駆動の音声生成では、ComfyUI などの Plugin が登録している場合に
`music_generate` を使用します。これはテキスト読み上げである `tts` とは別です。

`session_status` は、sessions グループ内の軽量なステータス/読み戻しツールです。
現在のセッションに関する `/status` 形式の質問に回答し、
必要に応じてセッション単位のモデルオーバーライドを設定できます。`model=default` はその
オーバーライドを解除します。`/status` と同様に、最新のトランスクリプト使用状況エントリから、
疎なトークン/キャッシュカウンターとアクティブなランタイムモデルラベルを補完できます。

`gateway` は、gateway 操作用の所有者専用ランタイムツールです。

- 編集前に1つのパススコープ設定サブツリーを確認するための `config.schema.lookup`
- 現在の設定スナップショット + ハッシュ用の `config.get`
- 再起動を伴う部分的な設定更新用の `config.patch`
- 完全な設定置換専用の `config.apply`
- 明示的な自己更新 + 再起動用の `update.run`

部分的な変更では、`config.schema.lookup` の後に `config.patch` を優先してください。
`config.apply` は、設定全体を意図的に置き換える場合にのみ使用してください。
より広範な設定ドキュメントについては、[設定](/ja-JP/gateway/configuration) と
[設定リファレンス](/ja-JP/gateway/configuration-reference) を読んでください。
このツールは `tools.exec.ask` や `tools.exec.security` の変更も拒否します。
従来の `tools.bash.*` エイリアスは、同じ保護対象の exec パスに正規化されます。

### Plugin 提供ツール

Plugin は追加のツールを登録できます。例:

- [Diffs](/ja-JP/tools/diffs) — 差分ビューアーとレンダラー
- [LLM Task](/ja-JP/tools/llm-task) — 構造化出力向けの JSON 専用 LLM ステップ
- [Lobster](/ja-JP/tools/lobster) — 再開可能な承認を備えた型付きワークフローランタイム
- [音楽生成](/ja-JP/tools/music-generation) — ワークフロー連携プロバイダーを備えた共有 `music_generate` ツール
- [OpenProse](/ja-JP/prose) — Markdown 優先のワークフローオーケストレーション
- [Tokenjuice](/ja-JP/tools/tokenjuice) — ノイズの多い `exec` と `bash` ツール結果を圧縮する

## ツール設定

### 許可リストと拒否リスト

設定内の `tools.allow` / `tools.deny` を通じて、エージェントが呼び出せるツールを制御します。
拒否は常に許可より優先されます。

```json5
{
  tools: {
    allow: ["group:fs", "browser", "web_search"],
    deny: ["exec"],
  },
}
```

明示的な許可リストが呼び出し可能なツールに解決されない場合、OpenClaw は安全側に倒して失敗します。
たとえば、`tools.allow: ["query_db"]` は、読み込まれた Plugin が実際に
`query_db` を登録している場合にのみ機能します。組み込み、Plugin、または同梱 MCP ツールのいずれも
許可リストに一致しない場合、ツール結果を幻覚する可能性のある
テキストのみの実行として続行するのではなく、モデル呼び出し前に実行が停止します。

### ツールプロファイル

`tools.profile` は、`allow`/`deny` が適用される前のベース許可リストを設定します。
エージェント単位のオーバーライド: `agents.list[].tools.profile`。

| プロファイル | 含まれるもの                                                                                                                                    |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `full`      | より広範なコマンド/制御アクセス向けの無制限ベースライン。`tools.profile` を未設定にするのと同じ                                                 |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `music_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                                         |
| `minimal`   | `session_status` のみ                                                                                                                             |

<Note>
`tools.profile: "messaging"` は、チャンネル重視のエージェント向けに意図的に狭く設定されています。
ファイルシステム、ランタイム、ブラウザー、canvas、nodes、cron、gateway 制御などの
より広範なコマンド/制御ツールは含まれません。より広範なコマンド/制御アクセスには、
無制限のベースラインとして `tools.profile: "full"` を使用し、必要に応じて
`tools.allow` / `tools.deny` でアクセスを絞ってください。
</Note>

`coding` には軽量な Web ツール（`web_search`、`web_fetch`、`x_search`）が含まれますが、
完全なブラウザー制御ツールは含まれません。ブラウザー自動化は実際の
セッションやログイン済みプロファイルを操作できるため、
`tools.alsoAllow: ["browser"]` またはエージェント単位の
`agents.list[].tools.alsoAllow: ["browser"]` で明示的に追加してください。

<Note>
制限の強いプロファイル（`messaging`、`minimal`）の下で `tools.exec` または `tools.fs` を設定しても、プロファイルの許可リストが暗黙的に広がることはありません。制限の強いプロファイルでそれらの設定セクションを使用したい場合は、明示的な `tools.alsoAllow` エントリ（たとえば exec には `["exec", "process"]`、fs には `["read", "write", "edit"]`）を追加してください。設定セクションが存在していて、対応する `alsoAllow` 付与がない場合、OpenClaw は起動時警告をログに出力します。
</Note>

`coding` と `messaging` プロファイルでは、Plugin キー `bundle-mcp` の下で設定された
バンドル MCP ツールも許可されます。通常の組み込みツールは維持しつつ、設定された MCP ツールを
すべて非表示にしたい場合は、`tools.deny: ["bundle-mcp"]` を追加してください。
`minimal` プロファイルにはバンドル MCP ツールは含まれません。

例（デフォルトで最も広いツールサーフェス）:

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
| `group:openclaw`   | すべての組み込み OpenClaw ツール（Plugin ツールを除く）                                                   |

`sessions_history` は、境界付きで安全性フィルター済みの想起ビューを返します。これは
thinking タグ、`<relevant-memories>` の足場、プレーンテキストのツール呼び出し XML
ペイロード（`<tool_call>...</tool_call>`、
`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、
`<function_calls>...</function_calls>`、および切り詰められたツール呼び出しブロックを含む）、
格下げされたツール呼び出しの足場、漏えいした ASCII/全角のモデル制御
トークン、assistant テキスト内の不正な MiniMax ツール呼び出し XML を除去し、その後、
生のトランスクリプトダンプとして扱う代わりに、秘匿化/切り詰めと、必要に応じて過大行プレースホルダーを適用します。

### プロバイダー固有の制限

`tools.byProvider` を使用すると、グローバルなデフォルトを変更せずに、特定のプロバイダー向けにツールを制限できます:

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
