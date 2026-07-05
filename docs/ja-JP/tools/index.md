---
doc-schema-version: 1
read_when:
    - OpenClaw が提供するツールについて理解したい
    - 組み込みツール、Skills、Plugin のどれを使うかを判断している
    - ツールポリシー、自動化、またはエージェント調整に適したドキュメントの入口が必要です
summary: 'OpenClawのツール、Skills、Pluginの概要: エージェントが呼び出せるものと、それらを拡張する方法'
title: 概要
x-i18n:
    generated_at: "2026-07-05T11:55:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7bd288b897e95363106fd8d82e4012959176110537ec877259d7dc8e0c9c8540
    source_path: tools/index.md
    workflow: 16
---

このページを使って、適切な Capabilities サーフェスを選択します。**ツール**は
呼び出し可能なアクション、**Skills**はエージェントに作業方法を教えるもの、**Plugin**は
ツール、プロバイダー、チャネル、フック、パッケージ化された
Skills などのランタイム機能を追加するものです。

これは概要とルーティングのページです。網羅的なツールポリシー、デフォルト、
グループメンバーシップ、プロバイダー制限、構成フィールドについては、
[ツールとカスタムプロバイダー](/ja-JP/gateway/config-tools)を参照してください。

## ここから始める

ほとんどのエージェントでは、まず組み込みのツールカテゴリから始め、エージェントに表示するツールを減らす必要がある場合や明示的なホストアクセスが必要な場合にのみポリシーを調整します。

| やりたいこと...                           | まず使うもの                                 | 次に読むもの                                                                                                       |
| ------------------------------------------- | ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| 既存の機能でエージェントに動作させる | [組み込みツール](#built-in-tool-categories)    | [ツールカテゴリ](#built-in-tool-categories)                                                                    |
| エージェントが呼び出せるものを制御する              | [ツールポリシー](#configure-access-and-approvals) | [ツールとカスタムプロバイダー](/ja-JP/gateway/config-tools)                                                             |
| エージェントにワークフローを教える                   | [Skills](#choose-tools-skills-or-plugins)      | [Skills](/ja-JP/tools/skills)、[Skills の作成](/ja-JP/tools/creating-skills)、[Skill Workshop](/ja-JP/tools/skill-workshop) |
| 新しい統合またはランタイムサーフェスを追加する    | [Plugin](#extend-capabilities)                | [Plugin](/ja-JP/tools/plugin) と [Plugin の構築](/ja-JP/plugins/building-plugins)                                         |
| 後で、またはバックグラウンドで作業を実行する         | [自動化](/ja-JP/automation)                      | [自動化の概要](/ja-JP/automation)                                                                              |
| 複数のエージェントまたはハーネスを調整する     | [サブエージェント](/ja-JP/tools/subagents)                 | [ACP エージェント](/ja-JP/tools/acp-agents) と [エージェント送信](/ja-JP/tools/agent-send)                                             |
| 大規模な OpenClaw ツールカタログを検索する        | [ツール検索](/ja-JP/tools/tool-search)              | [ツール検索](/ja-JP/tools/tool-search)                                                                               |

## ツール、Skills、Plugin を選択する

<Steps>
  <Step title="エージェントが動作する必要がある場合はツールを使う">
    ツールは、`exec`、`browser`、
    `web_search`、`message`、`image_generate` など、エージェントが呼び出せる型付き関数です。エージェントが
    データを読み取る、ファイルを変更する、メッセージを送信する、プロバイダーを呼び出す、または
    別のシステムを操作する必要がある場合にツールを使います。表示されるツールは、構造化された
    関数定義としてモデルに送信されます。

    モデルに見えるのは、アクティブなプロファイル、許可/拒否
    ポリシー、プロバイダー制限、サンドボックス状態、チャネル権限、
    Plugin の可用性を通過したツールだけです。

  </Step>

  <Step title="エージェントに指示が必要な場合は Skill を使う">
    Skill は、エージェントプロンプトに読み込まれる `SKILL.md` 指示パックです。
    エージェントが必要なツールをすでに持っているが、反復可能な
    ワークフロー、レビュー基準、コマンドシーケンス、または運用上の
    制約が必要な場合に Skill を使います。

    Skills は、ワークスペース、共有 Skill ディレクトリ、管理対象の OpenClaw
    Skill ルート、または Plugin パッケージに配置できます。

    [Skills](/ja-JP/tools/skills) | [Skill Workshop](/ja-JP/tools/skill-workshop) | [Skills の作成](/ja-JP/tools/creating-skills) | [Skills 設定](/ja-JP/tools/skills-config)

  </Step>

  <Step title="OpenClaw に新しい機能が必要な場合は Plugin を使う">
    Plugin は、ツール、Skills、チャネル、モデルプロバイダー、音声、
    リアルタイム音声、メディア生成、Web 検索、Web 取得、フック、その他の
    ランタイム機能を追加できます。機能にコード、
    認証情報、ライフサイクルフック、マニフェストメタデータ、またはインストール可能な
    パッケージングがある場合に Plugin を使います。既存の Plugin は ClawHub、npm、git、
    ローカルディレクトリ、またはアーカイブからインストールできます。

    [Plugin のインストールと設定](/ja-JP/tools/plugin) | [Plugin の構築](/ja-JP/plugins/building-plugins) | [Plugin SDK](/ja-JP/plugins/sdk-overview)

  </Step>
</Steps>

## 組み込みツールカテゴリ

この表には、サーフェスを識別しやすいように代表的なツールを示しています。これは
完全なポリシーリファレンスではありません。正確なグループ、デフォルト、許可/拒否
セマンティクスについては、[ツールとカスタムプロバイダー](/ja-JP/gateway/config-tools)を参照してください。

| カテゴリ                | エージェントが必要とする場合...                                                | 代表的なツール                                                                                 | 次に読むもの                                                                                   |
| ----------------------- | ----------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| ランタイム                 | コマンドの実行、プロセスの管理、またはプロバイダー支援の Python 分析の使用        | `exec`, `process`, `code_execution`                                                                  | [Exec](/ja-JP/tools/exec), [コード実行](/ja-JP/tools/code-execution)                                |
| ファイル                   | ワークスペースファイルの読み取りと変更                                               | `read`, `write`, `edit`, `apply_patch`                                                               | [パッチ適用](/ja-JP/tools/apply-patch)                                                           |
| Web                     | Web の検索、X 投稿の検索、または読み取り可能なページ内容の取得                | `web_search`, `x_search`, `web_fetch`                                                                | [Web ツール](/ja-JP/tools/web), [Web 取得](/ja-JP/tools/web-fetch)                                      |
| ブラウザ                 | ブラウザセッションの操作                                                     | `browser`                                                                                            | [ブラウザ](/ja-JP/tools/browser)                                                                   |
| メッセージングとチャネル  | 返信またはチャネルアクションの送信                                               | `message`                                                                                            | [エージェント送信](/ja-JP/tools/agent-send)                                                             |
| セッションとエージェント     | セッションの検査、作業の委任、別の実行の誘導、またはステータスの報告          | `sessions_*`, `subagents`, `agents_list`, `session_status`, `get_goal`, `create_goal`, `update_goal` | [Goal](/ja-JP/tools/goal), [サブエージェント](/ja-JP/tools/subagents), [セッションツール](/ja-JP/concepts/session-tool) |
| 自動化              | 作業のスケジュールまたはバックグラウンドイベントへの応答                                 | `cron`, `heartbeat_respond`                                                                          | [自動化](/ja-JP/automation)                                                                   |
| Gateway とノード       | Gateway 状態またはペアリングされた対象デバイスの検査                                | `gateway`, `nodes`                                                                                   | [Gateway 設定](/ja-JP/gateway/configuration), [ノード](/ja-JP/nodes)                            |
| メディア                   | メディアの分析、生成、または読み上げ                                             | `image`, `image_generate`, `music_generate`, `video_generate`, `tts`                                 | [メディア概要](/ja-JP/tools/media-overview)                                                     |
| 大規模な OpenClaw カタログ | すべてのスキーマをモデルに送らずに、多数の対象ツールを検索して呼び出す | `tool_search_code`, `tool_search`, `tool_describe`                                                   | [ツール検索](/ja-JP/tools/tool-search)                                                           |

<Note>
ツール検索は実験的な OpenClaw エージェントサーフェスです。Codex ハーネスの実行では、
`tools.toolSearch` の代わりに Codex ネイティブのコードモード、ネイティブツール検索、
遅延動的ツール、ネストされたツール呼び出しを使います。
</Note>

## Plugin 提供のツール

Plugin は追加のツールを登録できます。Plugin 作者は
`api.registerTool(...)` とマニフェストの `contracts.tools` を通じてツールを接続します。契約の詳細については、
[Plugin SDK](/ja-JP/plugins/sdk-overview) と [Plugin マニフェスト](/ja-JP/plugins/manifest)
を参照してください。

一般的な Plugin 提供ツールには次のものがあります。

- ファイルと Markdown の差分をレンダリングする [Diffs](/ja-JP/tools/diffs)
- JSON のみのワークフローステップ用の [LLM Task](/ja-JP/tools/llm-task)
- 再開可能な承認を伴う型付きワークフロー用の [Lobster](/ja-JP/tools/lobster)
- ノイズの多い `exec` と `bash` ツールの出力を圧縮する
  [Tokenjuice](/ja-JP/tools/tokenjuice)
- すべてのスキーマをプロンプトに入れずに大規模なツール
  カタログを検出して呼び出すための [ツール検索](/ja-JP/tools/tool-search)
- Node Canvas 制御と A2UI
  レンダリング用の [Canvas](/ja-JP/plugins/reference/canvas)

## アクセスと承認を設定する

ツールポリシーはモデル呼び出しの前に適用されます。ポリシーがツールを削除すると、
モデルはそのターンでそのツールのスキーマを受け取りません。実行は、グローバル設定、
エージェントごとの設定、チャネルポリシー、プロバイダー
制限、サンドボックスルール、チャネル/ランタイムポリシー、または Plugin の可用性によってツールを失うことがあります。

- [ツールとカスタムプロバイダー](/ja-JP/gateway/config-tools)では、ツールプロファイル、
  許可/拒否リスト、プロバイダー固有の制限、ループ検出、
  プロバイダー支援ツール設定について説明しています。
- [Exec 承認](/ja-JP/tools/exec-approvals)では、ホストコマンド承認
  ポリシーについて説明しています。
- [昇格 exec](/ja-JP/tools/elevated)では、サンドボックス外での制御された実行について説明しています。
- [サンドボックス vs ツールポリシー vs 昇格](/ja-JP/gateway/sandbox-vs-tool-policy-vs-elevated)
  では、ファイルおよびプロセスアクセスをどのレイヤーが制御するかを説明しています。
- [エージェントごとのサンドボックスとツール制限](/ja-JP/tools/multi-agent-sandbox-tools)
  では、委任された実行に対するエージェント固有の制限について説明しています。

## 機能を拡張する

OpenClaw に実行させたいジョブに応じて拡張パスを選択します。

- 既存の Plugin をインストールまたは管理するには、[Plugin](/ja-JP/tools/plugin)を使います。
- 新しい統合、プロバイダー、チャネル、ツール、またはフックを構築するには、
  [Plugin の構築](/ja-JP/plugins/building-plugins)を使います。
- 再利用可能なエージェント指示を追加または調整するには、[Skills](/ja-JP/tools/skills) と
  [Skills の作成](/ja-JP/tools/creating-skills)を使います。
- 実装
  契約が必要な場合は、[Plugin SDK](/ja-JP/plugins/sdk-overview) と
  [Plugin マニフェスト](/ja-JP/plugins/manifest)を使います。

## 見つからないツールのトラブルシューティング

モデルがツールを見られない、または呼び出せない場合は、現在のターンの有効なポリシーから確認します。

1. [ツールとカスタムプロバイダー](/ja-JP/gateway/config-tools)で、アクティブなプロファイル、`tools.allow`、`tools.deny` を確認します。
2. [ツールとカスタムプロバイダー](/ja-JP/gateway/config-tools)でプロバイダー固有の制限を確認し、
   選択された[モデルプロバイダー](/ja-JP/concepts/model-providers)がそのツール
   形状をサポートしていることを確認します。
3. [サンドボックス vs ツールポリシー vs 昇格](/ja-JP/gateway/sandbox-vs-tool-policy-vs-elevated)
   と [昇格 exec](/ja-JP/tools/elevated)で、チャネル権限、サンドボックス状態、昇格アクセスを確認します。
4. 所有元の Plugin がインストールされ、有効になっているかを
   [Plugin](/ja-JP/tools/plugin)で確認します。
5. 委任された実行については、
   [エージェントごとのサンドボックスとツール制限](/ja-JP/tools/multi-agent-sandbox-tools)でエージェントごとの制限を確認します。
6. 大規模な OpenClaw カタログについては、実行が直接的なツール
   公開を使っているのか、[ツール検索](/ja-JP/tools/tool-search)を使っているのかを確認します。

## 関連

- [自動化](/ja-JP/automation): cron、タスク、Heartbeat、コミットメント、フック、
  常設指示、Task Flow
- [エージェント](/ja-JP/concepts/agent): エージェントモデル、セッション、メモリ、
  マルチエージェント連携
- [ツールとカスタムプロバイダー](/ja-JP/gateway/config-tools): 正規のツール
  ポリシーリファレンス
- [Plugin](/ja-JP/tools/plugin): Pluginのインストールと管理
- [Plugin SDK](/ja-JP/plugins/sdk-overview): Plugin作成者向けリファレンス
- [Skills](/ja-JP/tools/skills): スキルの読み込み順序、ゲーティング、設定
- [スキルワークショップ](/ja-JP/tools/skill-workshop): 生成済みおよびレビュー済みスキルの
  作成
- [ツール検索](/ja-JP/tools/tool-search): コンパクトなOpenClawツールカタログの
  検出
