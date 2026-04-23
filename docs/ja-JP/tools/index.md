---
read_when:
    - OpenClaw が提供する tools を理解したい場合
    - tools を設定、許可、または拒否する必要がある場合
    - 組み込み tools、Skills、plugins のどれを使うか判断している場合
summary: 'OpenClaw の tools と plugins の概要: agent ができることと拡張方法'
title: Tools と Plugins
x-i18n:
    generated_at: "2026-04-23T14:10:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: ef0975c567b0bca0e991a0445d3db4a00fe2e2cf91b9e6bea5686825deac91a0
    source_path: tools/index.md
    workflow: 15
---

# Tools と Plugins

agent がテキスト生成以外で行うことはすべて **tools** を通じて行われます。
tools は、agent がファイルを読み、コマンドを実行し、web を閲覧し、メッセージを送り、
device とやり取りする方法です。

## tools、Skills、plugins

OpenClaw には、連携して動作する 3 つのレイヤーがあります:

<Steps>
  <Step title="tools は agent が呼び出すもの">
    tool は、agent が呼び出せる型付き関数です（例: `exec`、`browser`、
    `web_search`、`message`）。OpenClaw は **組み込み tools** のセットを提供し、
    plugins は追加の tool を登録できます。

    agent から見ると、tools は model API に送られる構造化された関数定義です。

  </Step>

  <Step title="Skills は、いつどう使うかを agent に教える">
    Skill は、system prompt に注入される markdown file（`SKILL.md`）です。
    Skills は、tools を効果的に使うためのコンテキスト、制約、段階的なガイダンスを
    agent に与えます。Skills は workspace、共有フォルダー、
    または plugins 内にあります。

    [Skills reference](/ja-JP/tools/skills) | [Creating skills](/ja-JP/tools/creating-skills)

  </Step>

  <Step title="plugins はすべてをまとめてパッケージ化する">
    plugin は、channels、model providers、tools、Skills、speech、realtime transcription、
    realtime voice、media understanding、image generation、video generation、
    web fetch、web search など、任意の capability の組み合わせを登録できる package です。
    一部の plugins は **core**（OpenClaw に同梱）で、
    その他は **external**（コミュニティが npm で公開）です。

    [Install and configure plugins](/ja-JP/tools/plugin) | [Build your own](/ja-JP/plugins/building-plugins)

  </Step>
</Steps>

## 組み込み tools

これらの tools は OpenClaw に同梱されており、plugin をインストールしなくても使えます:

| Tool | 役割 | ページ |
| ------------------------------------------ | --------------------------------------------------------------------- | ------------------------------------------------------------ |
| `exec` / `process` | shell コマンドを実行し、バックグラウンド process を管理する | [Exec](/ja-JP/tools/exec), [Exec Approvals](/ja-JP/tools/exec-approvals) |
| `code_execution` | sandbox 化されたリモート Python 分析を実行する | [Code Execution](/ja-JP/tools/code-execution) |
| `browser` | Chromium browser を制御する（移動、クリック、スクリーンショット） | [Browser](/ja-JP/tools/browser) |
| `web_search` / `x_search` / `web_fetch` | web 検索、X 投稿検索、ページ内容取得 | [Web](/ja-JP/tools/web), [Web Fetch](/ja-JP/tools/web-fetch) |
| `read` / `write` / `edit` | workspace 内のファイル I/O | |
| `apply_patch` | 複数 hunk のファイル patch | [Apply Patch](/ja-JP/tools/apply-patch) |
| `message` | すべてのチャンネルへメッセージ送信 | [Agent Send](/ja-JP/tools/agent-send) |
| `canvas` | node Canvas を操作する（present、eval、snapshot） | |
| `nodes` | ペアリング済み device を検出して対象指定する | |
| `cron` / `gateway` | スケジュール job を管理し、Gateway を確認、patch、再起動、更新する | |
| `image` / `image_generate` | 画像を解析または生成する | [Image Generation](/ja-JP/tools/image-generation) |
| `music_generate` | 音楽トラックを生成する | [Music Generation](/ja-JP/tools/music-generation) |
| `video_generate` | 動画を生成する | [Video Generation](/ja-JP/tools/video-generation) |
| `tts` | 単発の text-to-speech 変換 | [TTS](/ja-JP/tools/tts) |
| `sessions_*` / `subagents` / `agents_list` | セッション管理、状態確認、sub-agent オーケストレーション | [Sub-agents](/ja-JP/tools/subagents) |
| `session_status` | 軽量な `/status` スタイルの読み出しとセッション model 上書き | [Session Tools](/ja-JP/concepts/session-tool) |

画像作業では、解析には `image`、生成または編集には `image_generate` を使用してください。`openai/*`、`google/*`、`fal/*`、または他の非デフォルト画像 provider を使う場合は、先にその provider の auth/API key を設定してください。

音楽作業では、`music_generate` を使用してください。`google/*`、`minimax/*`、または他の非デフォルト音楽 provider を使う場合は、先にその provider の auth/API key を設定してください。

動画作業では、`video_generate` を使用してください。`qwen/*` または他の非デフォルト動画 provider を使う場合は、先にその provider の auth/API key を設定してください。

ワークフロー駆動の音声生成では、ComfyUI のような plugin が
`music_generate` を登録している場合はそれを使用してください。これは、text-to-speech である `tts` とは別です。

`session_status` は sessions グループ内の軽量な status/readback tool です。
現在のセッションについて `/status` スタイルの質問に答え、
必要に応じてセッション単位の model override を設定できます。`model=default` はその
override をクリアします。`/status` と同様に、最新 transcript の usage エントリから
不足している token/cache counter やアクティブなランタイム model label を補完できます。

`gateway` は Gateway 操作用の owner 専用ランタイム tool です:

- 編集前に 1 つの path スコープ設定 subtree を確認する `config.schema.lookup`
- 現在の設定スナップショット + hash 用の `config.get`
- 再起動付き部分設定更新用の `config.patch`
- 完全設定置き換え専用の `config.apply`
- 明示的な self-update + restart 用の `update.run`

部分変更では、`config.schema.lookup` の後に `config.patch` を推奨します。
`config.apply` は設定全体を意図的に置き換える場合にのみ使用してください。
この tool は `tools.exec.ask` や `tools.exec.security` の変更も拒否します。
従来の `tools.bash.*` エイリアスは、同じ保護された exec path に正規化されます。

### plugin が提供する tools

plugins は追加の tool を登録できます。例:

- [Diffs](/ja-JP/tools/diffs) — diff viewer と renderer
- [LLM Task](/ja-JP/tools/llm-task) — 構造化出力のための JSON 専用 LLM step
- [Lobster](/ja-JP/tools/lobster) — 再開可能な approvals を持つ型付き workflow runtime
- [Music Generation](/ja-JP/tools/music-generation) — workflow ベース provider を持つ共有 `music_generate` tool
- [OpenProse](/ja-JP/prose) — markdown-first の workflow orchestration
- [Tokenjuice](/ja-JP/tools/tokenjuice) — ノイズの多い `exec` と `bash` の tool 結果をコンパクト化

## tool 設定

### 許可リストと拒否リスト

設定の `tools.allow` / `tools.deny` を使って、agent が呼び出せる tool を制御します。
deny は常に allow より優先されます。

```json5
{
  tools: {
    allow: ["group:fs", "browser", "web_search"],
    deny: ["exec"],
  },
}
```

### tool profile

`tools.profile` は、`allow`/`deny` が適用される前のベース許可リストを設定します。
agent ごとの上書き: `agents.list[].tools.profile`。

| Profile | 含まれるもの |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `full` | 制限なし（未設定と同じ） |
| `coding` | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `music_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status` |
| `minimal` | `session_status` のみ |

`coding` と `messaging` profile は、設定済み bundle MCP tools も
plugin key `bundle-mcp` の下で許可します。通常の組み込みは維持したまま、設定済みの MCP tools をすべて隠したい場合は、
`tools.deny: ["bundle-mcp"]` を追加してください。
`minimal` profile には bundle MCP tools は含まれません。

### tool group

allow/deny リストでは `group:*` の短縮表記を使用します:

| Group | Tools |
| ------------------ | --------------------------------------------------------------------------------------------------------- |
| `group:runtime` | exec, process, code_execution（`bash` は `exec` のエイリアスとして受理される） |
| `group:fs` | read, write, edit, apply_patch |
| `group:sessions` | sessions_list, sessions_history, sessions_send, sessions_spawn, sessions_yield, subagents, session_status |
| `group:memory` | memory_search, memory_get |
| `group:web` | web_search, x_search, web_fetch |
| `group:ui` | browser, canvas |
| `group:automation` | cron, gateway |
| `group:messaging` | message |
| `group:nodes` | nodes |
| `group:agents` | agents_list |
| `group:media` | image, image_generate, music_generate, video_generate, tts |
| `group:openclaw` | すべての組み込み OpenClaw tools（plugin tool は除く） |

`sessions_history` は、境界付きで安全性フィルタ済みの recall view を返します。
thinking tag、`<relevant-memories>` scaffolding、プレーンテキストの tool-call XML
payload（`<tool_call>...</tool_call>`、
`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、
`<function_calls>...</function_calls>`、および切り詰められた tool-call block を含む）、
格下げされた tool-call scaffolding、漏洩した ASCII/全角 model control
token、不正な MiniMax tool-call XML を assistant text から除去し、その後
生 transcript dump として扱う代わりに redaction/truncation と、
必要に応じて oversized-row placeholder を適用します。

### provider 固有の制限

グローバルデフォルトを変えずに特定 provider 用の tool を制限するには、
`tools.byProvider` を使用します:

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
