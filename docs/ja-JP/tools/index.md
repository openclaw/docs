---
read_when:
    - OpenClawがどのようなtoolsを提供するのかを理解したい＿日本assistant to=final
    - toolsを設定、許可、または拒否する必要がある
    - 組み込みtools、Skills、Pluginのどれを使うかを判断している
summary: 'OpenClawのtoolsとPluginの概要: agentができることと、その拡張方法'
title: toolsとPlugin
x-i18n:
    generated_at: "2026-04-25T18:21:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 72f1257f5e556b57238f9a0ff01574510f310250cf6da73c74f9f2421fa2c917
    source_path: tools/index.md
    workflow: 15
---

テキストを生成する以外でagentが行うすべてのことは、**tools** を通じて行われます。
toolsは、agentがファイルを読み、コマンドを実行し、Webを閲覧し、メッセージを送り、
デバイスとやり取りするための仕組みです。

## tools、Skills、Plugin

OpenClawには、連携して動作する3つのレイヤーがあります。

<Steps>
  <Step title="toolsはagentが呼び出すもの">
    toolは、agentが呼び出せる型付き関数です（例: `exec`、`browser`、
    `web_search`、`message`）。OpenClawは**組み込みtools**のセットを提供し、
    Pluginは追加のtoolを登録できます。

    agentには、toolsはmodel APIに送られる構造化された関数定義として見えます。

  </Step>

  <Step title="Skillsはいつどのように使うかをagentに教える">
    Skillは、システムプロンプトに注入されるmarkdownファイル（`SKILL.md`）です。
    Skillsは、toolsを効果的に使うためのコンテキスト、制約、段階的なガイダンスを
    agentに与えます。Skillsは、ワークスペース、共有フォルダ、
    またはPlugin内に存在します。

    [Skillsリファレンス](/ja-JP/tools/skills) | [Skillsの作成](/ja-JP/tools/creating-skills)

  </Step>

  <Step title="Pluginはすべてをまとめてパッケージ化する">
    Pluginは、任意の組み合わせのcapabilityを登録できるパッケージです:
    channel、model provider、tools、Skills、speech、realtime transcription、
    realtime voice、media understanding、image generation、video generation、
    web fetch、web search など。Pluginの一部は**core**（OpenClawに同梱）で、
    ほかは**external**（コミュニティがnpmで公開）です。

    [Pluginのインストールと設定](/ja-JP/tools/plugin) | [独自に作成する](/ja-JP/plugins/building-plugins)

  </Step>
</Steps>

## 組み込みtools

これらのtoolはOpenClawに同梱されており、Pluginをインストールしなくても利用できます。

| Tool                                       | 役割                                                          | ページ                                                         |
| ------------------------------------------ | --------------------------------------------------------------------- | ------------------------------------------------------------ |
| `exec` / `process`                         | シェルコマンドを実行し、バックグラウンドプロセスを管理する                       | [Exec](/ja-JP/tools/exec), [Exec Approvals](/ja-JP/tools/exec-approvals) |
| `code_execution`                           | サンドボックス化されたリモートPython分析を実行する                                  | [Code Execution](/ja-JP/tools/code-execution)                      |
| `browser`                                  | Chromiumブラウザを操作する（移動、クリック、スクリーンショット）              | [Browser](/ja-JP/tools/browser)                                    |
| `web_search` / `x_search` / `web_fetch`    | Web検索、X投稿検索、ページ内容取得                    | [Web](/ja-JP/tools/web), [Web Fetch](/ja-JP/tools/web-fetch)             |
| `read` / `write` / `edit`                  | ワークスペース内のファイルI/O                                             |                                                              |
| `apply_patch`                              | 複数hunkのファイルpatch                                               | [Apply Patch](/ja-JP/tools/apply-patch)                            |
| `message`                                  | すべてのchannelにまたがってメッセージを送信する                                     | [Agent Send](/ja-JP/tools/agent-send)                              |
| `canvas`                                   | node Canvasを操作する（present、eval、snapshot）                           |                                                              |
| `nodes`                                    | ペアリングされたデバイスを検出し、対象にする                                    |                                                              |
| `cron` / `gateway`                         | スケジュール済みジョブを管理し、gatewayを検査、patch、再起動、更新する |                                                              |
| `image` / `image_generate`                 | 画像を分析または生成する                                            | [Image Generation](/ja-JP/tools/image-generation)                  |
| `music_generate`                           | 音楽トラックを生成する                                                 | [Music Generation](/ja-JP/tools/music-generation)                  |
| `video_generate`                           | 動画を生成する                                                       | [Video Generation](/ja-JP/tools/video-generation)                  |
| `tts`                                      | ワンショットのtext-to-speech 変換                                    | [TTS](/ja-JP/tools/tts)                                            |
| `sessions_*` / `subagents` / `agents_list` | セッション管理、ステータス、およびsub-agentオーケストレーション               | [Sub-agents](/ja-JP/tools/subagents)                               |
| `session_status`                           | 軽量な `/status` 形式のreadbackとセッションごとのmodel override       | [Session Tools](/ja-JP/concepts/session-tool)                      |

画像処理では、分析には `image`、生成または編集には `image_generate` を使います。`openai/*`、`google/*`、`fal/*`、または別の非デフォルト画像providerを対象にする場合は、まずそのproviderのauth/API keyを設定してください。

音楽処理では、`music_generate` を使います。`google/*`、`minimax/*`、または別の非デフォルト音楽providerを対象にする場合は、まずそのproviderのauth/API keyを設定してください。

動画処理では、`video_generate` を使います。`qwen/*` または別の非デフォルト動画providerを対象にする場合は、まずそのproviderのauth/API keyを設定してください。

ワークフロー駆動の音声生成では、ComfyUIのようなPluginがそれを登録している場合は `music_generate` を使います。これは、text-to-speech である `tts` とは別です。

`session_status` はsessionsグループ内の軽量なstatus/readback toolです。
現在のセッションに関する `/status` 形式の質問に答え、必要に応じて
セッションごとのmodel overrideを設定できます。`model=default` はその
overrideをクリアします。`/status` と同様に、最新のtranscript usage entryから
不足しているtoken/cacheカウンターと、アクティブなランタイムmodel labelを
補完できます。

`gateway` はgateway操作用のowner専用ランタイムtoolです。

- 編集前に1つのpathスコープのconfig subtreeを取得する `config.schema.lookup`
- 現在のconfig snapshot + hashを取得する `config.get`
- 再起動付きで部分的なconfig更新を行う `config.patch`
- 完全なconfig置き換えにのみ使う `config.apply`
- 明示的なself-update + restart を行う `update.run`

部分変更では、`config.schema.lookup` の後に `config.patch` を使うのを優先してください。
`config.apply` は、設定全体を意図的に置き換える場合にのみ使います。
このtoolは `tools.exec.ask` や `tools.exec.security` の変更も拒否します。
レガシーな `tools.bash.*` aliasは、同じ保護されたexec pathに正規化されます。

### Pluginが提供するtools

Pluginは追加のtoolを登録できます。例:

- [Diffs](/ja-JP/tools/diffs) — diffビューアおよびrenderer
- [LLM Task](/ja-JP/tools/llm-task) — 構造化出力のためのJSON専用LLMステップ
- [Lobster](/ja-JP/tools/lobster) — 再開可能なapprovalを持つ型付きワークフローランタイム
- [Music Generation](/ja-JP/tools/music-generation) — ワークフローバックend providerを持つ共有 `music_generate` tool
- [OpenProse](/ja-JP/prose) — markdown優先のワークフローオーケストレーション
- [Tokenjuice](/ja-JP/tools/tokenjuice) — ノイズの多い `exec` と `bash` のtool結果をコンパクト化する

## tool設定

### 許可リストと拒否リスト

設定内の `tools.allow` / `tools.deny` で、agentが呼び出せるtoolを制御します。
拒否は常に許可より優先されます。

```json5
{
  tools: {
    allow: ["group:fs", "browser", "web_search"],
    deny: ["exec"],
  },
}
```

OpenClawは、明示的なallowlistが呼び出し可能なtoolを1つも解決しない場合、fail closedします。
たとえば、`tools.allow: ["query_db"]` は、読み込まれたPluginが実際に
`query_db` を登録している場合にのみ動作します。組み込みtool、Plugin、
またはバンドル済みMCP toolのいずれもallowlistに一致しない場合、実行はmodel呼び出し前に停止し、
tool結果を幻覚生成しかねないテキスト専用実行として継続しません。

### toolプロファイル

`tools.profile` は、`allow`/`deny` が適用される前のベースallowlistを設定します。
agentごとのoverride: `agents.list[].tools.profile`。

| Profile     | 含まれるもの                                                                                                                                  |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `full`      | 制限なし（未設定と同じ）                                                                                                                    |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `music_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                                         |
| `minimal`   | `session_status` のみ                                                                                                                             |

`coding` には軽量なWeb tool（`web_search`、`web_fetch`、`x_search`）は含まれますが、
完全なbrowser制御toolは含まれません。ブラウザ自動化は実際のセッションやログイン済みプロファイルを
操作できるため、`tools.alsoAllow: ["browser"]` またはagentごとの
`agents.list[].tools.alsoAllow: ["browser"]` で明示的に追加してください。

`coding` と `messaging` のプロファイルは、Plugin key `bundle-mcp` 配下の
設定済みbundle MCP toolも許可します。通常の組み込みtoolは維持しつつ、
設定済みMCP toolをすべて隠したい場合は `tools.deny: ["bundle-mcp"]` を追加してください。
`minimal` プロファイルにはbundle MCP toolは含まれません。

### toolグループ

allow/deny リストでは `group:*` の短縮記法を使えます。

| Group              | Tools                                                                                                     |
| ------------------ | --------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | exec, process, code_execution（`bash` は `exec` のaliasとして受け付けられます）                                 |
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
| `group:openclaw`   | すべての組み込みOpenClaw tool（Plugin toolは除く）                                                       |

`sessions_history` は、境界付きで安全性フィルタ済みのrecall viewを返します。これは
thinking tag、`<relevant-memories>` のscaffolding、プレーンテキストのtool-call XML
payload（`<tool_call>...</tool_call>`、
`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、
`<function_calls>...</function_calls>`、および切り詰められたtool-call blockを含む）、
ダウングレードされたtool-call scaffolding、漏出したASCII/全角のmodel control
token、壊れたMiniMax tool-call XMLをassistant textから取り除き、その後、
生のtranscript dumpとして振る舞う代わりに、redaction/truncation と、必要に応じて
oversized-row placeholderを適用します。

### provider固有の制限

グローバルデフォルトを変えずに特定のproviderのtoolを制限するには、
`tools.byProvider` を使います。

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
