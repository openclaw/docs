---
read_when:
    - OpenClaw が提供するツールを理解したい
    - ツールを設定、許可、または拒否する必要があります
    - 組み込みツール、Skills、Plugin のどれを使うかを判断している場合
summary: 'OpenClaw のツールと Plugin の概要: エージェントができることと拡張方法'
title: ツールとプラグイン
x-i18n:
    generated_at: "2026-05-06T05:21:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 894f6dc7e840f3153e95696a63c470a200886af7d3dc8399e87446cf0fb1b027
    source_path: tools/index.md
    workflow: 16
---

エージェントがテキスト生成を超えて行うすべてのことは、**tools** を通じて実行されます。
tools は、エージェントがファイルを読み、コマンドを実行し、Web を閲覧し、メッセージを送り、デバイスと対話するための仕組みです。

## tools、Skills、plugins

OpenClaw には連携して動作する 3 つのレイヤーがあります。

<Steps>
  <Step title="tools はエージェントが呼び出すもの">
    tool は、エージェントが呼び出せる型付き関数です（例: `exec`, `browser`,
    `web_search`, `message`）。OpenClaw には一連の **組み込み tools** が同梱されており、
    plugins は追加の tools を登録できます。

    エージェントには、tools はモデル API に送信される構造化された関数定義として見えます。

  </Step>

  <Step title="Skills はいつ、どのように使うかをエージェントに教える">
    skill は、システムプロンプトに注入される Markdown ファイル（`SKILL.md`）です。
    Skills は、tools を効果的に使うためのコンテキスト、制約、段階的なガイダンスを
    エージェントに提供します。Skills はワークスペース内、共有フォルダー内、
    または plugins 内に同梱されます。

    [Skills リファレンス](/ja-JP/tools/skills) | [Skills の作成](/ja-JP/tools/creating-skills)

  </Step>

  <Step title="plugins はすべてをまとめてパッケージ化する">
    plugin は、機能の任意の組み合わせを登録できるパッケージです:
    チャンネル、モデルプロバイダー、tools、Skills、音声、リアルタイム文字起こし、
    リアルタイム音声、メディア理解、画像生成、動画生成、Web 取得、Web 検索などです。
    一部の plugins は **core**（OpenClaw に同梱）で、その他は **external**
    （コミュニティによって npm に公開）です。

    [plugins のインストールと設定](/ja-JP/tools/plugin) | [独自に構築する](/ja-JP/plugins/building-plugins)

  </Step>
</Steps>

## 組み込み tools

これらの tools は OpenClaw に同梱されており、plugins をインストールしなくても利用できます。

| Tool                                       | 機能                                                                  | ページ                                                       |
| ------------------------------------------ | --------------------------------------------------------------------- | ------------------------------------------------------------ |
| `exec` / `process`                         | シェルコマンドを実行し、バックグラウンドプロセスを管理する            | [Exec](/ja-JP/tools/exec), [Exec Approvals](/ja-JP/tools/exec-approvals) |
| `code_execution`                           | サンドボックス化されたリモート Python 分析を実行する                  | [Code Execution](/ja-JP/tools/code-execution)                      |
| `browser`                                  | Chromium ブラウザーを制御する（移動、クリック、スクリーンショット）   | [Browser](/ja-JP/tools/browser)                                    |
| `web_search` / `x_search` / `web_fetch`    | Web を検索し、X 投稿を検索し、ページ内容を取得する                    | [Web](/ja-JP/tools/web), [Web Fetch](/ja-JP/tools/web-fetch)             |
| `read` / `write` / `edit`                  | ワークスペース内のファイル I/O                                       |                                                              |
| `apply_patch`                              | 複数ハンクのファイルパッチ                                            | [Apply Patch](/ja-JP/tools/apply-patch)                            |
| `message`                                  | すべてのチャンネルにメッセージを送信する                              | [Agent Send](/ja-JP/tools/agent-send)                              |
| `canvas`                                   | node Canvas を操作する（present、eval、snapshot）                     |                                                              |
| `nodes`                                    | ペアリング済みデバイスを検出し、対象にする                            |                                                              |
| `cron` / `gateway`                         | スケジュール済みジョブを管理し、gateway を検査、パッチ、再起動、更新する |                                                              |
| `image` / `image_generate`                 | 画像を分析または生成する                                              | [Image Generation](/ja-JP/tools/image-generation)                  |
| `music_generate`                           | 音楽トラックを生成する                                                | [Music Generation](/ja-JP/tools/music-generation)                  |
| `video_generate`                           | 動画を生成する                                                        | [Video Generation](/ja-JP/tools/video-generation)                  |
| `tts`                                      | 1 回限りのテキスト読み上げ変換                                        | [TTS](/ja-JP/tools/tts)                                            |
| `sessions_*` / `subagents` / `agents_list` | セッション管理、ステータス、サブエージェントのオーケストレーション    | [サブエージェント](/ja-JP/tools/subagents)                         |
| `session_status`                           | 軽量な `/status` 風の読み戻しとセッションモデルのオーバーライド       | [セッション tools](/ja-JP/concepts/session-tool)                   |

画像作業には、分析には `image` を、生成または編集には `image_generate` を使用します。`openai/*`、`google/*`、`fal/*`、または別の非デフォルト画像プロバイダーを対象にする場合は、先にそのプロバイダーの認証/API キーを設定してください。

音楽作業には `music_generate` を使用します。`google/*`、`minimax/*`、または別の非デフォルト音楽プロバイダーを対象にする場合は、先にそのプロバイダーの認証/API キーを設定してください。

動画作業には `video_generate` を使用します。`qwen/*` または別の非デフォルト動画プロバイダーを対象にする場合は、先にそのプロバイダーの認証/API キーを設定してください。

ワークフロー駆動の音声生成には、ComfyUI のような plugin が登録している場合は
`music_generate` を使用します。これはテキスト読み上げである `tts` とは別です。

`sessions_status` は sessions グループ内の軽量なステータス/読み戻し tool です。
現在のセッションに関する `/status` 風の質問に回答し、必要に応じて
セッション単位のモデルオーバーライドを設定できます。`model=default` はその
オーバーライドを解除します。`/status` と同様に、最新のトランスクリプト使用状況エントリから、
疎なトークン/キャッシュカウンターとアクティブなランタイムモデルラベルを補完できます。

`gateway` は gateway 操作用の所有者専用ランタイム tool です。

- 編集前に 1 つのパススコープの config サブツリーを調べる `config.schema.lookup`
- 現在の config スナップショット + ハッシュを取得する `config.get`
- 再起動を伴う部分的な config 更新用の `config.patch`
- 完全な config 置換のみに使う `config.apply`
- 明示的な自己更新 + 再起動用の `update.run`

部分的な変更には、`config.schema.lookup` の後に `config.patch` を優先してください。
`config.apply` は、意図的に config 全体を置き換える場合にのみ使用します。
より広範な config ドキュメントについては、[Configuration](/ja-JP/gateway/configuration) と
[Configuration reference](/ja-JP/gateway/configuration-reference) を読んでください。
この tool は `tools.exec.ask` または `tools.exec.security` の変更も拒否します。
従来の `tools.bash.*` エイリアスは、同じ保護対象 exec パスに正規化されます。

### plugin 提供の tools

plugins は追加の tools を登録できます。例:

- [Diffs](/ja-JP/tools/diffs) — diff ビューアーとレンダラー
- [LLM Task](/ja-JP/tools/llm-task) — 構造化出力用の JSON 限定 LLM ステップ
- [Lobster](/ja-JP/tools/lobster) — 再開可能な承認を備えた型付きワークフローランタイム
- [Music Generation](/ja-JP/tools/music-generation) — ワークフロー支援プロバイダーを備えた共有 `music_generate` tool
- [OpenProse](/ja-JP/prose) — Markdown 優先のワークフローオーケストレーション
- [Tokenjuice](/ja-JP/tools/tokenjuice) — ノイズの多い `exec` と `bash` tool の結果をコンパクト化

plugin tools は引き続き `api.registerTool(...)` で作成され、
plugin マニフェストの `contracts.tools` リストで宣言されます。OpenClaw は検出時に検証済みの
tool 記述子を取得し、plugin ソースと契約ごとにキャッシュするため、
後続の tool 計画では plugin ランタイムの読み込みを省略できます。tool 実行では引き続き、
所有元 plugin を読み込んで、ライブ登録された実装を呼び出します。

## Tool 設定

### 許可リストと拒否リスト

config の `tools.allow` / `tools.deny` を通じて、エージェントが呼び出せる tools を制御します。
拒否は常に許可より優先されます。

```json5
{
  tools: {
    allow: ["group:fs", "browser", "web_search"],
    deny: ["exec"],
  },
}
```

明示的な許可リストが呼び出し可能な tools に解決されない場合、OpenClaw はフェイルクローズします。
たとえば、`tools.allow: ["query_db"]` は、読み込まれた plugin が実際に
`query_db` を登録している場合にのみ機能します。許可リストに一致する組み込み、plugin、
または同梱 MCP tool がない場合、tool 結果を幻覚できるテキストのみの実行として続行するのではなく、
モデル呼び出しの前に実行が停止します。

### Tool プロファイル

`tools.profile` は、`allow`/`deny` が適用される前のベース許可リストを設定します。
エージェント単位のオーバーライド: `agents.list[].tools.profile`。

| プロファイル | 含まれるもの                                                                                                                                      |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `full`      | すべての core および任意の plugin tools。より広範なコマンド/制御アクセス向けの無制限ベースライン                                                  |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `music_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                                         |
| `minimal`   | `session_status` のみ                                                                                                                             |

<Note>
`tools.profile: "messaging"` は、チャンネル重視のエージェント向けに意図的に狭くなっています。
filesystem、runtime、browser、canvas、nodes、cron、gateway 制御などの
より広範なコマンド/制御 tools は含まれません。より広範なコマンド/制御アクセスの
無制限ベースラインとして `tools.profile: "full"` を使用し、必要に応じて
`tools.allow` / `tools.deny` でアクセスを絞り込んでください。
</Note>

`coding` には軽量な Web tools（`web_search`, `web_fetch`, `x_search`）が含まれますが、
完全なブラウザー制御 tool は含まれません。ブラウザー自動化は実際のセッションや
ログイン済みプロファイルを操作できるため、`tools.alsoAllow: ["browser"]` または
エージェント単位の `agents.list[].tools.alsoAllow: ["browser"]` で明示的に追加してください。

<Note>
制限的なプロファイル（`messaging`, `minimal`）の下で `tools.exec` または `tools.fs` を設定しても、そのプロファイルの許可リストは暗黙には広がりません。制限的なプロファイルでそれらの設定済みセクションを使用したい場合は、明示的な `tools.alsoAllow` エントリ（たとえば exec には `["exec", "process"]`、fs には `["read", "write", "edit"]`）を追加してください。一致する `alsoAllow` 権限がない状態で config セクションが存在する場合、OpenClaw は起動時警告をログに記録します。
</Note>

`coding` と `messaging` プロファイルは、plugin キー `bundle-mcp` の下にある
設定済み bundle MCP tools も許可します。プロファイルに通常の組み込みは維持させつつ、
設定済み MCP tools をすべて非表示にしたい場合は、`tools.deny: ["bundle-mcp"]` を追加してください。
`minimal` プロファイルには bundle MCP tools は含まれません。

例（デフォルトで最も広い tool サーフェス）:

```json5
{
  tools: {
    profile: "full",
  },
}
```

### Tool グループ

許可/拒否リストでは `group:*` 省略形を使用します:

| グループ           | ツール                                                                                                    |
| ------------------ | --------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | exec, process, code_execution（`bash` は `exec` のエイリアスとして受け入れられます）                       |
| `group:fs`         | read, write, edit, apply_patch                                                                            |
| `group:sessions`   | sessions_list, sessions_history, sessions_send, sessions_spawn, sessions_yield, subagents, session_status |
| `group:memory`     | memory_search, memory_get                                                                                 |
| `group:web`        | web_search, x_search, web_fetch                                                                           |
| `group:ui`         | browser, canvas                                                                                           |
| `group:automation` | heartbeat_respond, cron, gateway                                                                          |
| `group:messaging`  | message                                                                                                   |
| `group:nodes`      | nodes                                                                                                     |
| `group:agents`     | agents_list, update_plan                                                                                  |
| `group:media`      | image, image_generate, music_generate, video_generate, tts                                                |
| `group:openclaw`   | すべての組み込み OpenClaw ツール（Plugin ツールを除く）                                                   |

`sessions_history` は、範囲が限定され、安全性フィルターが適用された想起ビューを返します。これは
思考タグ、`<relevant-memories>` の足場、プレーンテキストのツール呼び出し XML
ペイロード（`<tool_call>...</tool_call>`、
`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、
`<function_calls>...</function_calls>`、および切り詰められたツール呼び出しブロックを含む）、
ダウングレードされたツール呼び出しの足場、漏えいした ASCII/全角のモデル制御
トークン、assistant テキスト内の不正な MiniMax ツール呼び出し XML を除去し、その後、
生のトランスクリプトダンプとして扱うのではなく、墨消し/切り詰めと、必要に応じて過大な行のプレースホルダーを適用します。

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
