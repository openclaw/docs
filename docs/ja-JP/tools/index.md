---
read_when:
    - OpenClaw がどのような tools を提供しているかを知りたい場合
    - tools を設定、許可、または拒否したい場合
    - built-in tools、Skills、Plugin のどれを使うか判断している場合
summary: 'OpenClaw の tools と Plugin の概要: エージェントができることと、その拡張方法'
title: tools と Plugin
x-i18n:
    generated_at: "2026-04-24T05:25:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: f9ab57fcb1b58875866721fbadba63093827698ed980afeb14274da601b34f11
    source_path: tools/index.md
    workflow: 15
---

テキスト生成以外でエージェントが行うことは、すべて **tools** を通じて行われます。
tools は、エージェントがファイルを読み、コマンドを実行し、Web を閲覧し、メッセージを送り、
デバイスとやり取りするための手段です。

## tools、Skills、Plugin

OpenClaw には、連携して動作する 3 つのレイヤーがあります。

<Steps>
  <Step title="tools はエージェントが呼び出すもの">
    tool とは、エージェントが呼び出せる型付き関数です（例: `exec`、`browser`、
    `web_search`、`message`）。OpenClaw には **built-in tools** 一式が同梱されており、
    plugins は追加の tool を登録できます。

    エージェントは、tools を model API に送られる構造化関数定義として認識します。

  </Step>

  <Step title="Skills は、いつどのように使うかをエージェントに教える">
    skill は system prompt に注入される markdown file（`SKILL.md`）です。
    Skills は、tools を効果的に使うためのコンテキスト、制約、段階的ガイダンスを
    エージェントに与えます。Skills はあなたの workspace、共有フォルダ、
    または plugins 内に存在します。

    [Skills リファレンス](/ja-JP/tools/skills) | [Skills を作成する](/ja-JP/tools/creating-skills)

  </Step>

  <Step title="Plugin はすべてをまとめてパッケージ化する">
    Plugin は、任意の組み合わせの機能を登録できるパッケージです:
    channels、model providers、tools、Skills、speech、realtime transcription、
    realtime voice、media understanding、image generation、video generation、
    web fetch、web search などです。一部の plugins は **core**（OpenClaw に同梱）で、
    他は **external**（コミュニティにより npm で公開）です。

    [Plugin をインストールして設定する](/ja-JP/tools/plugin) | [自分の Plugin を作る](/ja-JP/plugins/building-plugins)

  </Step>
</Steps>

## built-in tools

これらの tools は OpenClaw に同梱されており、Plugin をインストールしなくても利用できます。

| Tool                                       | 何をするか                                                          | ページ                                                         |
| ------------------------------------------ | ------------------------------------------------------------------- | -------------------------------------------------------------- |
| `exec` / `process`                         | shell command を実行し、バックグラウンド process を管理する         | [Exec](/ja-JP/tools/exec), [Exec Approvals](/ja-JP/tools/exec-approvals)   |
| `code_execution`                           | サンドボックス化されたリモート Python 分析を実行する                | [コード実行](/ja-JP/tools/code-execution)                            |
| `browser`                                  | Chromium ブラウザを操作する（navigate、click、screenshot）          | [Browser](/ja-JP/tools/browser)                                      |
| `web_search` / `x_search` / `web_fetch`    | Web を検索し、X 投稿を検索し、ページ内容を取得する                  | [Web](/ja-JP/tools/web), [Web Fetch](/ja-JP/tools/web-fetch)               |
| `read` / `write` / `edit`                  | workspace 内の file I/O                                             |                                                                |
| `apply_patch`                              | 複数 hunk の file patch                                             | [Apply Patch](/ja-JP/tools/apply-patch)                              |
| `message`                                  | すべての channel にまたがってメッセージを送る                       | [Agent Send](/ja-JP/tools/agent-send)                                |
| `canvas`                                   | Node Canvas を操作する（present、eval、snapshot）                   |                                                                |
| `nodes`                                    | ペアリングされたデバイスを発見し、対象にする                        |                                                                |
| `cron` / `gateway`                         | スケジュール済み job を管理し、gateway を inspect、patch、restart、update する |                                                                |
| `image` / `image_generate`                 | 画像を解析または生成する                                            | [Image Generation](/ja-JP/tools/image-generation)                    |
| `music_generate`                           | 音楽トラックを生成する                                              | [Music Generation](/ja-JP/tools/music-generation)                    |
| `video_generate`                           | 動画を生成する                                                      | [Video Generation](/ja-JP/tools/video-generation)                    |
| `tts`                                      | ワンショット text-to-speech 変換                                    | [TTS](/ja-JP/tools/tts)                                              |
| `sessions_*` / `subagents` / `agents_list` | session 管理、status、sub-agent オーケストレーション                | [Sub-agents](/ja-JP/tools/subagents)                                 |
| `session_status`                           | 軽量な `/status` 形式の readback と session model override          | [Session Tools](/ja-JP/concepts/session-tool)                        |

画像関連では、解析には `image` を使い、生成または編集には `image_generate` を使ってください。`openai/*`、`google/*`、`fal/*`、またはその他の非デフォルト image provider を対象にする場合は、まずその provider の auth/API key を設定してください。

音楽関連では、`music_generate` を使ってください。`google/*`、`minimax/*`、またはその他の非デフォルト music provider を対象にする場合は、まずその provider の auth/API key を設定してください。

動画関連では、`video_generate` を使ってください。`qwen/*` またはその他の非デフォルト video provider を対象にする場合は、まずその provider の auth/API key を設定してください。

ワークフロー駆動の音声生成には、ComfyUI のような Plugin がそれを登録している場合は `music_generate` を使ってください。これは text-to-speech である `tts` とは別物です。

`session_status` は sessions グループにある軽量な status/readback tool です。
これは現在の session に関する `/status` 形式の質問に答え、
任意で session ごとの model override を設定できます。`model=default` はその
override をクリアします。`/status` と同様に、最新の transcript usage エントリから、
不足している token/cache カウンタとアクティブな runtime model label を補完できます。

`gateway` は gateway 操作用の owner-only runtime tool です。

- 編集前に、1 つの path スコープ config subtree を取得する `config.schema.lookup`
- 現在の config snapshot + hash を取得する `config.get`
- restart 付きで部分的 config 更新を行う `config.patch`
- 完全な config 置換にのみ使う `config.apply`
- 明示的な self-update + restart を行う `update.run`

部分変更では、`config.schema.lookup` の後に `config.patch` を使うことを推奨します。
`config.apply` は、設定全体を意図的に置き換える場合にのみ使ってください。
この tool は `tools.exec.ask` や `tools.exec.security` の変更も拒否します。
レガシーな `tools.bash.*` alias は、同じ保護された exec path に正規化されます。

### Plugin 提供 tools

plugins は追加の tool を登録できます。例:

- [Diffs](/ja-JP/tools/diffs) — diff ビューアーとレンダラー
- [LLM Task](/ja-JP/tools/llm-task) — 構造化出力用の JSON-only LLM step
- [Lobster](/ja-JP/tools/lobster) — resumable approval を備えた型付き workflow runtime
- [Music Generation](/ja-JP/tools/music-generation) — workflow-backed provider を備えた共有 `music_generate` tool
- [OpenProse](/ja-JP/prose) — markdown-first の workflow オーケストレーション
- [Tokenjuice](/ja-JP/tools/tokenjuice) — ノイズの多い `exec` と `bash` の tool result をコンパクト化する

## tool 設定

### allow list と deny list

config の `tools.allow` / `tools.deny` で、エージェントが呼び出せる tool を制御します。
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

`tools.profile` は、`allow`/`deny` が適用される前のベース allowlist を設定します。
エージェント単位の override: `agents.list[].tools.profile`。

| Profile     | 含まれるもの                                                                                                                                     |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `full`      | 制限なし（未設定と同じ）                                                                                                                          |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `music_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                                        |
| `minimal`   | `session_status` のみ                                                                                                                             |

`coding` と `messaging` profile は、Plugin key `bundle-mcp` 配下の設定済み bundle MCP tools も許可します。profile で通常の built-in は維持しつつ、設定済みの MCP tools をすべて隠したい場合は、`tools.deny: ["bundle-mcp"]` を追加してください。
`minimal` profile には bundle MCP tools は含まれません。

### tool group

allow/deny list では `group:*` の短縮記法を使います。

| Group              | Tools                                                                                                     |
| ------------------ | --------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | exec, process, code_execution（`bash` は `exec` の alias として受け付けられます）                        |
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
| `group:openclaw`   | すべての built-in OpenClaw tools（Plugin tools は除く）                                                   |

`sessions_history` は、境界付きで安全性フィルタ済みの recall view を返します。これは
thinking tag、`<relevant-memories>` scaffolding、プレーンテキストの tool-call XML
payload（`<tool_call>...</tool_call>`、
`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、
`<function_calls>...</function_calls>`、および切り詰められた tool-call block を含む）、
格下げされた tool-call scaffolding、漏れ出した ASCII/全角の model control
token、不正な MiniMax tool-call XML を assistant text から除去し、その後、
raw transcript dump として振る舞うのではなく、redaction/truncation と必要に応じた oversized-row placeholder を適用します。

### provider 固有の制限

グローバルデフォルトを変えずに、特定 provider の tool を制限するには `tools.byProvider` を使います。

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
