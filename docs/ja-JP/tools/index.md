---
doc-schema-version: 1
read_when:
    - OpenClaw が提供するツールを理解したい
    - 組み込みツール、Skills、Plugin のどれを使うかを判断している
    - ツールポリシー、自動化、またはエージェント調整に適したドキュメントの入口が必要です
summary: 'OpenClaw のツール、Skills、Plugin の概要: エージェントが呼び出せるものと拡張方法'
title: 概要
x-i18n:
    generated_at: "2026-06-27T13:14:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f49afa2354ebb26eeb5f036cd1f2f7ceb228b01287adbc6c305addfb0af4502d
    source_path: tools/index.md
    workflow: 16
---

このページを使って、適切な Capabilities サーフェスを選択します。**ツール**は呼び出し可能な
アクションで、**Skills**はエージェントに作業方法を教え、**Plugin**はツール、プロバイダー、
チャンネル、フック、パッケージ化された Skills などのランタイム機能を追加します。

これは概要とルーティングのページです。網羅的なツールポリシー、デフォルト、
グループ所属、プロバイダー制限、構成フィールドについては、
[ツールとカスタムプロバイダー](/ja-JP/gateway/config-tools)を参照してください。

## ここから始める

ほとんどのエージェントでは、組み込みツールカテゴリから始め、エージェントに見せるツールを減らす必要がある場合や、明示的なホストアクセスが必要な場合にのみポリシーを調整します。

| 必要なこと                                  | 最初に使うもの                                  | 次に読むもの                                                                                                    |
| ------------------------------------------- | ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| 既存の機能でエージェントに動作させる        | [組み込みツール](#built-in-tool-categories)    | [ツールカテゴリ](#built-in-tool-categories)                                                                    |
| エージェントが呼び出せるものを制御する      | [ツールポリシー](#configure-access-and-approvals) | [ツールとカスタムプロバイダー](/ja-JP/gateway/config-tools)                                                          |
| エージェントにワークフローを教える          | [Skills](#choose-tools-skills-or-plugins)      | [Skills](/ja-JP/tools/skills)、[Skills の作成](/ja-JP/tools/creating-skills)、[Skill Workshop](/ja-JP/tools/skill-workshop) |
| 新しい統合またはランタイムサーフェスを追加する | [Plugin](#extend-capabilities)                | [Plugin](/ja-JP/tools/plugin) と [Plugin の構築](/ja-JP/plugins/building-plugins)                                          |
| 後で、またはバックグラウンドで作業を実行する | [自動化](/ja-JP/automation)                          | [自動化の概要](/ja-JP/automation)                                                                                    |
| 複数のエージェントまたはハーネスを調整する  | [サブエージェント](/ja-JP/tools/subagents)           | [ACP エージェント](/ja-JP/tools/acp-agents) と [エージェント送信](/ja-JP/tools/agent-send)                                  |
| 大規模な OpenClaw ツールカタログを検索する  | [ツール検索](/ja-JP/tools/tool-search)               | [ツール検索](/ja-JP/tools/tool-search)                                                                               |

## ツール、Skills、Plugin を選ぶ

<Steps>
  <Step title="エージェントが動作する必要がある場合はツールを使う">
    ツールは、`exec`、`browser`、
    `web_search`、`message`、`image_generate` など、エージェントが呼び出せる型付き関数です。エージェントが
    データを読み取る、ファイルを変更する、メッセージを送信する、プロバイダーを呼び出す、または
    別のシステムを操作する必要がある場合にツールを使います。表示されるツールは、構造化された関数
    定義としてモデルに送信されます。

    モデルに見えるのは、アクティブなプロファイル、許可/拒否
    ポリシー、プロバイダー制限、サンドボックス状態、チャンネル権限、Plugin の可用性を通過したツールだけです。

  </Step>

  <Step title="エージェントが指示を必要とする場合は Skills を使う">
    Skill は、エージェントプロンプトに読み込まれる `SKILL.md` 指示パックです。エージェントが必要なツールをすでに持っているが、反復可能な
    ワークフロー、レビュールーブリック、コマンドシーケンス、または運用上の制約を必要とする場合に
    Skill を使います。

    Skills は、ワークスペース、共有 Skill ディレクトリ、管理対象の OpenClaw
    Skill ルート、または Plugin パッケージに配置できます。

    [Skills](/ja-JP/tools/skills) | [Skill Workshop](/ja-JP/tools/skill-workshop) | [Skills の作成](/ja-JP/tools/creating-skills) | [Skills 構成](/ja-JP/tools/skills-config)

  </Step>

  <Step title="OpenClaw に新しい機能が必要な場合は Plugin を使う">
    Plugin は、ツール、Skills、チャンネル、モデルプロバイダー、音声、リアルタイム
    音声、メディア生成、Web 検索、Web 取得、フック、その他のランタイム
    機能を追加できます。機能にコード、認証情報、
    ライフサイクルフック、マニフェストメタデータ、またはインストール可能なパッケージングがある場合に Plugin を使います。既存の
    Plugin は、ClawHub、npm、git、ローカルディレクトリ、または
    アーカイブからインストールできます。

    [Plugin のインストールと構成](/ja-JP/tools/plugin) | [Plugin の構築](/ja-JP/plugins/building-plugins) | [Plugin SDK](/ja-JP/plugins/sdk-overview)

  </Step>
</Steps>

## 組み込みツールカテゴリ

この表には、サーフェスを識別できるように代表的なツールを示しています。これは
完全なポリシーリファレンスではありません。正確なグループ、デフォルト、許可/拒否
セマンティクスについては、[ツールとカスタムプロバイダー](/ja-JP/gateway/config-tools)を参照してください。

| カテゴリ                | エージェントが必要とすること                                                | 代表的なツール                                                     | 次に読むもの                                                                                |
| ----------------------- | ----------------------------------------------------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| ランタイム              | コマンドを実行する、プロセスを管理する、またはプロバイダー支援の Python 解析を使う | `exec`, `process`, `code_execution`                                  | [Exec](/ja-JP/tools/exec), [コード実行](/ja-JP/tools/code-execution)                                    |
| ファイル                | ワークスペースファイルを読み取り、変更する                                    | `read`, `write`, `edit`, `apply_patch`                               | [パッチ適用](/ja-JP/tools/apply-patch)                                                           |
| Web                     | Web を検索する、X 投稿を検索する、または読み取り可能なページコンテンツを取得する | `web_search`, `x_search`, `web_fetch`                                | [Web ツール](/ja-JP/tools/web), [Web 取得](/ja-JP/tools/web-fetch)                                      |
| ブラウザ                | ブラウザセッションを操作する                                                  | `browser`                                                            | [ブラウザ](/ja-JP/tools/browser)                                                                  |
| メッセージングとチャンネル | 返信またはチャンネルアクションを送信する                                    | `message`                                                            | [エージェント送信](/ja-JP/tools/agent-send)                                                       |
| セッションとエージェント | セッションを調査する、作業を委任する、別の実行を誘導する、またはステータスを報告する | `sessions_*`, `subagents`, `agents_list`, `session_status`, `goal`   | [Goal](/ja-JP/tools/goal), [サブエージェント](/ja-JP/tools/subagents), [セッションツール](/ja-JP/concepts/session-tool) |
| 自動化                  | 作業をスケジュールする、またはバックグラウンドイベントに応答する              | `cron`, `heartbeat_respond`                                          | [自動化](/ja-JP/automation)                                                                       |
| Gateway とノード        | Gateway の状態またはペアリング済みターゲットデバイスを調査する               | `gateway`, `nodes`                                                   | [Gateway 構成](/ja-JP/gateway/configuration), [ノード](/ja-JP/nodes)                                   |
| メディア                | メディアを解析、生成、または読み上げる                                        | `image`, `image_generate`, `music_generate`, `video_generate`, `tts` | [メディアの概要](/ja-JP/tools/media-overview)                                                     |
| 大規模な OpenClaw カタログ | すべてのスキーマをモデルに送信せずに、多数の対象ツールを検索して呼び出す    | `tool_search_code`, `tool_search`, `tool_describe`                   | [ツール検索](/ja-JP/tools/tool-search)                                                           |

<Note>
ツール検索は実験的な OpenClaw エージェントサーフェスです。Codex ハーネス実行では、
`tools.toolSearch` の代わりに Codex ネイティブのコードモード、ネイティブツール検索、遅延動的ツール、ネストされた
ツール呼び出しを使います。
</Note>

## Plugin 提供ツール

Plugin は追加のツールを登録できます。Plugin 作者は
`api.registerTool(...)` とマニフェストの `contracts.tools` を通じてツールを接続します。契約の詳細については、
[Plugin SDK](/ja-JP/plugins/sdk-overview) と [Plugin マニフェスト](/ja-JP/plugins/manifest)を参照してください。

一般的な Plugin 提供ツールには次のものがあります。

- [Diffs](/ja-JP/tools/diffs): ファイルと Markdown 差分のレンダリング
- [LLM Task](/ja-JP/tools/llm-task): JSON のみのワークフローステップ
- [Lobster](/ja-JP/tools/lobster): 再開可能な承認を備えた型付きワークフロー
- [Tokenjuice](/ja-JP/tools/tokenjuice): ノイズの多い `exec` と `bash` ツール
  出力の圧縮
- [ツール検索](/ja-JP/tools/tool-search): すべてのスキーマをプロンプトに入れずに、大規模なツール
  カタログを発見して呼び出す
- [Canvas](/ja-JP/plugins/reference/canvas): ノード Canvas 制御と A2UI
  レンダリング

## アクセスと承認を構成する

ツールポリシーはモデル呼び出しの前に適用されます。ポリシーがツールを削除すると、
モデルはそのターンでそのツールのスキーマを受け取りません。実行は、
グローバル構成、エージェントごとの構成、チャンネルポリシー、プロバイダー
制限、サンドボックスルール、チャンネル/ランタイムポリシー、または Plugin の可用性によりツールを失うことがあります。

- [ツールとカスタムプロバイダー](/ja-JP/gateway/config-tools)では、ツールプロファイル、
  許可/拒否リスト、プロバイダー固有の制限、ループ検出、
  プロバイダー支援ツール設定について説明しています。
- [Exec 承認](/ja-JP/tools/exec-approvals)では、ホストコマンド承認
  ポリシーについて説明しています。
- [Elevated exec](/ja-JP/tools/elevated)では、サンドボックス外での制御された実行について説明しています。
- [サンドボックス vs ツールポリシー vs elevated](/ja-JP/gateway/sandbox-vs-tool-policy-vs-elevated)では、どのレイヤーがファイルとプロセスアクセスを制御するかを説明しています。
- [エージェントごとのサンドボックスとツール制限](/ja-JP/tools/multi-agent-sandbox-tools)
  では、委任された実行に対するエージェント固有の制限について説明しています。

## 機能を拡張する

OpenClaw に実行させたいジョブに応じて拡張パスを選択します。

- 既存の Plugin をインストールまたは管理するには、[Plugin](/ja-JP/tools/plugin)を使います。
- 新しい統合、プロバイダー、チャンネル、ツール、またはフックを構築するには、
  [Plugin の構築](/ja-JP/plugins/building-plugins)を使います。
- 再利用可能なエージェント指示を追加または調整するには、[Skills](/ja-JP/tools/skills) と
  [Skills の作成](/ja-JP/tools/creating-skills)を使います。
- 実装契約が必要な場合は、[Plugin SDK](/ja-JP/plugins/sdk-overview) と [Plugin マニフェスト](/ja-JP/plugins/manifest)を使います。

## 見つからないツールをトラブルシュートする

モデルがツールを確認または呼び出しできない場合は、
現在のターンの有効なポリシーから始めます。

1. [ツールとカスタムプロバイダー](/ja-JP/gateway/config-tools)で、アクティブなプロファイル、`tools.allow`、`tools.deny` を確認します。
2. [ツールとカスタムプロバイダー](/ja-JP/gateway/config-tools)でプロバイダー固有の制限を確認し、選択された
   [モデルプロバイダー](/ja-JP/concepts/model-providers)がそのツール形状をサポートしていることを確認します。
3. [サンドボックス vs ツールポリシー vs elevated](/ja-JP/gateway/sandbox-vs-tool-policy-vs-elevated) と [Elevated exec](/ja-JP/tools/elevated)で、チャンネル権限、サンドボックス状態、elevated アクセスを確認します。
4. 所有元の Plugin がインストールされ、有効になっているかを
   [Plugin](/ja-JP/tools/plugin)で確認します。
5. 委任された実行については、
   [エージェントごとのサンドボックスとツール制限](/ja-JP/tools/multi-agent-sandbox-tools)でエージェントごとの制限を確認します。
6. 大規模な OpenClaw カタログについては、実行が直接的なツール公開を使うのか、
   [ツール検索](/ja-JP/tools/tool-search)を使うのかを確認します。

## 関連

- [自動化](/ja-JP/automation): cron、タスク、heartbeat、コミットメント、フック、常時指示、Task Flow
- [エージェント](/ja-JP/concepts/agent): エージェントモデル、セッション、メモリ、マルチエージェント調整
- [ツールとカスタムプロバイダー](/ja-JP/gateway/config-tools): 正規のツールポリシーリファレンス
- [Plugin](/ja-JP/tools/plugin): Plugin のインストールと管理
- [Plugin SDK](/ja-JP/plugins/sdk-overview): Plugin 作者向けリファレンス
- [Skills](/ja-JP/tools/skills): Skill の読み込み順序、ゲート、構成
- [Skill Workshop](/ja-JP/tools/skill-workshop): 生成され、レビューされた Skill 作成
- [ツール検索](/ja-JP/tools/tool-search): コンパクトな OpenClaw ツールカタログ発見
