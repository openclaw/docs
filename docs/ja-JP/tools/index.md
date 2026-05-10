---
read_when:
    - OpenClaw が提供するツールについて理解したい
    - ツールを設定、許可、または拒否する必要があります
    - 組み込みツール、Skills、Plugin のどれを使うかを判断している
summary: 'OpenClaw のツールと Plugin の概要: エージェントができることと拡張方法'
title: ツールとPlugin
x-i18n:
    generated_at: "2026-05-10T19:55:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: b12b2d605c8fccb0de378f8a63fb92b8c3bad8abd3edf10bb79632d6ef6089fd
    source_path: tools/index.md
    workflow: 16
---

エージェントがテキスト生成以外で行うすべてのことは、**ツール**を通じて行われます。
ツールは、エージェントがファイルを読み取り、コマンドを実行し、ウェブを閲覧し、
メッセージを送信し、デバイスとやり取りするための手段です。

## ツール、Skills、Plugin

OpenClaw には、連携して動作する 3 つのレイヤーがあります。

<Steps>
  <Step title="ツールはエージェントが呼び出すものです">
    ツールは、エージェントが呼び出せる型付き関数です（例: `exec`、`browser`、
    `web_search`、`message`）。OpenClaw には一連の**組み込みツール**が同梱されており、
    Plugin は追加のツールを登録できます。

    エージェントには、モデル API に送信される構造化された関数定義としてツールが見えます。

  </Step>

  <Step title="Skills はエージェントにいつ、どのように行うかを教えます">
    Skill は、システムプロンプトに注入される Markdown ファイル（`SKILL.md`）です。
    Skills は、ツールを効果的に使用するためのコンテキスト、制約、段階的なガイダンスを
    エージェントに提供します。Skills はワークスペース、共有フォルダー、または
    Plugin 内に同梱されます。

    [Skills リファレンス](/ja-JP/tools/skills) | [Skills の作成](/ja-JP/tools/creating-skills)

  </Step>

  <Step title="Plugin はすべてをまとめてパッケージ化します">
    Plugin は、チャネル、モデルプロバイダー、ツール、Skills、音声、リアルタイム文字起こし、
    リアルタイム音声、メディア理解、画像生成、動画生成、ウェブ取得、ウェブ検索など、
    任意の組み合わせの機能を登録できるパッケージです。一部の Plugin は**コア**（OpenClaw に同梱）
    であり、その他は**外部**（コミュニティによって npm で公開）です。

    [Plugin のインストールと設定](/ja-JP/tools/plugin) | [独自に構築する](/ja-JP/plugins/building-plugins)

  </Step>
</Steps>

## 組み込みツール

これらのツールは OpenClaw に同梱されており、Plugin をインストールしなくても使用できます。

| ツール                                     | 何をするか                                                          | ページ                                                       |
| ------------------------------------------ | ------------------------------------------------------------------- | ------------------------------------------------------------ |
| `exec` / `process`                         | シェルコマンドを実行し、バックグラウンドプロセスを管理する          | [Exec](/ja-JP/tools/exec), [Exec Approvals](/ja-JP/tools/exec-approvals) |
| `code_execution`                           | サンドボックス化されたリモート Python 解析を実行する                | [Code Execution](/ja-JP/tools/code-execution)                      |
| `browser`                                  | Chromium ブラウザーを制御する（移動、クリック、スクリーンショット） | [Browser](/ja-JP/tools/browser)                                    |
| `web_search` / `x_search` / `web_fetch`    | ウェブを検索し、X の投稿を検索し、ページ内容を取得する              | [Web](/ja-JP/tools/web), [Web Fetch](/ja-JP/tools/web-fetch)             |
| `read` / `write` / `edit`                  | ワークスペース内のファイル I/O                                      |                                                              |
| `apply_patch`                              | 複数ハンクのファイルパッチ                                          | [Apply Patch](/ja-JP/tools/apply-patch)                            |
| `message`                                  | すべてのチャネルにメッセージを送信する                              | [Agent Send](/ja-JP/tools/agent-send)                              |
| `nodes`                                    | ペアリング済みデバイスを検出し、対象にする                          |                                                              |
| `cron` / `gateway`                         | スケジュール済みジョブを管理し、Gateway を検査、パッチ、再起動、または更新する |                                                              |
| `image` / `image_generate`                 | 画像を解析または生成する                                            | [画像生成](/ja-JP/tools/image-generation)                          |
| `music_generate`                           | 音楽トラックを生成する                                              | [音楽生成](/ja-JP/tools/music-generation)                          |
| `video_generate`                           | 動画を生成する                                                      | [動画生成](/ja-JP/tools/video-generation)                          |
| `tts`                                      | 単発のテキスト読み上げ変換                                          | [TTS](/ja-JP/tools/tts)                                            |
| `sessions_*` / `subagents` / `agents_list` | セッション管理、ステータス、サブエージェントのオーケストレーション  | [サブエージェント](/ja-JP/tools/subagents)                         |
| `session_status`                           | 軽量な `/status` 形式の読み戻しとセッションモデルの上書き           | [セッションツール](/ja-JP/concepts/session-tool)                   |

画像作業では、解析には `image` を使用し、生成または編集には `image_generate` を使用します。`openai/*`、`google/*`、`fal/*`、または別の非デフォルト画像プロバイダーを対象にする場合は、先にそのプロバイダーの認証/API キーを設定してください。

音楽作業では、`music_generate` を使用します。`google/*`、`minimax/*`、または別の非デフォルト音楽プロバイダーを対象にする場合は、先にそのプロバイダーの認証/API キーを設定してください。

動画作業では、`video_generate` を使用します。`qwen/*`、または別の非デフォルト動画プロバイダーを対象にする場合は、先にそのプロバイダーの認証/API キーを設定してください。

ワークフロー駆動の音声生成には、ComfyUI などの Plugin が登録している場合は
`music_generate` を使用します。これはテキスト読み上げである `tts` とは別です。

`session_status` は、セッショングループ内の軽量なステータス/読み戻しツールです。
現在のセッションに関する `/status` 形式の質問に回答し、必要に応じて
セッション単位のモデル上書きを設定できます。`model=default` はその
上書きを解除します。`/status` と同様に、最新のトランスクリプト使用状況エントリから、
まばらなトークン/キャッシュカウンターとアクティブなランタイムモデルラベルを補完できます。

`gateway` は、Gateway 操作用の所有者専用ランタイムツールです。

- 編集前に、1 つのパススコープ付き設定サブツリーに対して `config.schema.lookup`
- 現在の設定スナップショット + ハッシュに対して `config.get`
- 再起動を伴う部分的な設定更新に対して `config.patch`
- 完全な設定置換のみに `config.apply`
- 明示的な自己更新 + 再起動に対して `update.run`

部分的な変更では、`config.schema.lookup` の後に `config.patch` を使用してください。
設定全体を意図的に置換する場合にのみ `config.apply` を使用します。
より広範な設定ドキュメントについては、[設定](/ja-JP/gateway/configuration) と
[設定リファレンス](/ja-JP/gateway/configuration-reference) を参照してください。
このツールは `tools.exec.ask` または `tools.exec.security` の変更も拒否します。
従来の `tools.bash.*` エイリアスは、同じ保護対象の exec パスに正規化されます。

### Plugin 提供ツール

Plugin は追加のツールを登録できます。例:

- [Canvas](/ja-JP/plugins/reference/canvas) — Node Canvas 制御と A2UI レンダリング向けの実験的な同梱 Plugin
- [Diffs](/ja-JP/tools/diffs) — diff ビューアーおよびレンダラー
- [LLM Task](/ja-JP/tools/llm-task) — 構造化出力向けの JSON 専用 LLM ステップ
- [Lobster](/ja-JP/tools/lobster) — 再開可能な承認を備えた型付きワークフローランタイム
- [音楽生成](/ja-JP/tools/music-generation) — ワークフロー支援プロバイダーを備えた共有 `music_generate` ツール
- [OpenProse](/ja-JP/prose) — Markdown 優先のワークフローオーケストレーション
- [Tokenjuice](/ja-JP/tools/tokenjuice) — ノイズの多い `exec` および `bash` ツール結果をコンパクト化

Plugin ツールは引き続き `api.registerTool(...)` で作成され、
Plugin マニフェストの `contracts.tools` リストで宣言されます。OpenClaw は検出時に
検証済みのツール記述子を取得し、Plugin ソースとコントラクトごとにキャッシュするため、
後続のツール計画では Plugin ランタイムの読み込みを省略できます。ツール実行では引き続き
所有元の Plugin を読み込み、ライブ登録済みの実装を呼び出します。

[ツール検索](/ja-JP/tools/tool-search) は、大規模カタログ向けのコンパクトなサーフェスです。
すべての OpenClaw、MCP、またはクライアントツールスキーマをプロンプトに入れる代わりに、
OpenClaw は `openclaw.tools.search`、`openclaw.tools.describe`、
`openclaw.tools.call` を備えた分離された Node ランタイムをモデルに提供できます。
呼び出しは引き続き Gateway を通って戻るため、ツールポリシー、承認、フック、
セッションログは引き続き信頼できる情報源のままです。

## ツール設定

### 許可リストと拒否リスト

設定内の `tools.allow` / `tools.deny` によって、エージェントが呼び出せるツールを制御します。
拒否は常に許可より優先されます。

```json5
{
  tools: {
    allow: ["group:fs", "browser", "web_search"],
    deny: ["exec"],
  },
}
```

OpenClaw は、明示的な許可リストが呼び出し可能なツールに解決されない場合、閉じた状態で失敗します。
たとえば、`tools.allow: ["query_db"]` は、読み込まれた Plugin が実際に
`query_db` を登録している場合にのみ機能します。組み込み、Plugin、または同梱 MCP ツールのいずれも
許可リストに一致しない場合、実行は、ツール結果を幻覚する可能性のあるテキスト専用実行として続行するのではなく、
モデル呼び出しの前に停止します。

### ツールプロファイル

`tools.profile` は、`allow`/`deny` が適用される前の基本許可リストを設定します。
エージェント単位の上書き: `agents.list[].tools.profile`。

| プロファイル | 含まれるもの                                                                                                                                        |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `full`      | すべてのコアおよび任意の Plugin ツール。より広範なコマンド/制御アクセス向けの無制限のベースライン                                                   |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `music_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                                          |
| `minimal`   | `session_status` のみ                                                                                                                               |

<Note>
`tools.profile: "messaging"` は、チャネル中心のエージェント向けに意図的に狭くなっています。
ファイルシステム、ランタイム、ブラウザー、canvas、nodes、cron、Gateway 制御などの
より広範なコマンド/制御ツールは含まれません。より広範なコマンド/制御アクセス向けの無制限の
ベースラインとして `tools.profile: "full"` を使用し、必要に応じて
`tools.allow` / `tools.deny` でアクセスを絞り込んでください。
</Note>

`coding` には軽量なウェブツール（`web_search`、`web_fetch`、`x_search`）が含まれますが、
完全なブラウザー制御ツールは含まれません。ブラウザー自動化は実際のセッションや
ログイン済みプロファイルを操作できるため、`tools.alsoAllow: ["browser"]` または
エージェント単位の `agents.list[].tools.alsoAllow: ["browser"]` で明示的に追加してください。

<Note>
制限的なプロファイル（`messaging`、`minimal`）の下で `tools.exec` または `tools.fs` を設定しても、
プロファイルの許可リストは暗黙的に拡張されません。制限的なプロファイルでそれらの設定セクションを使いたい場合は、
明示的な `tools.alsoAllow` エントリ（たとえば exec には `["exec", "process"]`、fs には `["read", "write", "edit"]`）を追加してください。
設定セクションが存在するのに対応する `alsoAllow` 許可がない場合、OpenClaw は起動時に警告をログに記録します。
</Note>

`coding` および `messaging` プロファイルでは、Plugin キー `bundle-mcp` の下にある
設定済みのバンドル MCP ツールも許可されます。プロファイルに通常の組み込みツールを維持させつつ、
設定済みの MCP ツールをすべて非表示にしたい場合は、`tools.deny: ["bundle-mcp"]` を追加してください。
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

許可/拒否リストでは `group:*` 省略形を使用します:

| グループ           | ツール                                                                                                    |
| ------------------ | --------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | exec, process, code_execution (`bash` は `exec` のエイリアスとして受け入れられます)                       |
| `group:fs`         | read, write, edit, apply_patch                                                                            |
| `group:sessions`   | sessions_list, sessions_history, sessions_send, sessions_spawn, sessions_yield, subagents, session_status |
| `group:memory`     | memory_search, memory_get                                                                                 |
| `group:web`        | web_search, x_search, web_fetch                                                                           |
| `group:ui`         | バンドルされた Canvas Plugin が有効な場合の browser, canvas                                               |
| `group:automation` | heartbeat_respond, cron, gateway                                                                          |
| `group:messaging`  | message                                                                                                   |
| `group:nodes`      | nodes                                                                                                     |
| `group:agents`     | agents_list, update_plan                                                                                  |
| `group:media`      | image, image_generate, music_generate, video_generate, tts                                                |
| `group:openclaw`   | すべての組み込み OpenClaw ツール (Plugin ツールを除く)                                                    |

`sessions_history` は、範囲が制限され安全性フィルターが適用されたリコールビューを返します。これは、生のトランスクリプトダンプとして動作する代わりに、thinking タグ、`<relevant-memories>` スキャフォールディング、プレーンテキストのツール呼び出し XML ペイロード (`<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>`、および切り詰められたツール呼び出しブロックを含む)、格下げされたツール呼び出しスキャフォールディング、漏えいした ASCII/全角のモデル制御トークン、アシスタントテキスト内の不正な MiniMax ツール呼び出し XML を取り除き、その後で墨消し/切り詰めと、必要に応じて過大な行のプレースホルダーを適用します。

### プロバイダー固有の制限

グローバルデフォルトを変更せずに特定のプロバイダーのツールを制限するには、`tools.byProvider` を使用します。

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
