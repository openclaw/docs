---
doc-schema-version: 1
read_when:
    - OpenClaw が提供するツールについて理解したい場合
    - 組み込みツール、Skills、Plugin のどれを使用するかを決定します
    - ツールポリシー、自動化、またはエージェント連携に適したドキュメントの入口が必要です
summary: OpenClaw のツール、Skills、Plugin の概要：エージェントが呼び出せるものとその拡張方法
title: 概要
x-i18n:
    generated_at: "2026-07-12T14:53:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 628b47a8756e229a712981b669c96a36689909755dcd244667612f8761e67526
    source_path: tools/index.md
    workflow: 16
---

適切なケイパビリティサーフェスを選択するには、このページを使用してください。**ツール**は
呼び出し可能なアクション、**Skills**はエージェントに作業方法を教えるもの、**Plugin**は
ツール、プロバイダー、チャネル、フック、パッケージ化された Skills などの
ランタイムケイパビリティを追加するものです。

これは概要と案内のページです。ツールポリシー、デフォルト、
グループ所属、プロバイダー制限、設定フィールドの完全なリファレンスについては、
[ツールとカスタムプロバイダー](/ja-JP/gateway/config-tools)を参照してください。

## ここから始める

ほとんどのエージェントでは、組み込みツールカテゴリから始め、エージェントに表示するツールを
減らす必要がある場合や、明示的なホストアクセスが必要な場合にのみポリシーを調整します。

| 目的                                        | 最初に使用するもの                               | 次に読むもの                                                                                                    |
| ------------------------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| 既存のケイパビリティでエージェントに操作させる | [組み込みツール](#built-in-tool-categories)      | [ツールカテゴリ](#built-in-tool-categories)                                                                    |
| エージェントが呼び出せるものを制御する      | [ツールポリシー](#configure-access-and-approvals) | [ツールとカスタムプロバイダー](/ja-JP/gateway/config-tools)                                                          |
| エージェントにワークフローを教える          | [Skills](#choose-tools-skills-or-plugins)        | [Skills](/ja-JP/tools/skills)、[Skills の作成](/ja-JP/tools/creating-skills)、[Skill Workshop](/ja-JP/tools/skill-workshop)       |
| 新しい統合やランタイムサーフェスを追加する  | [Plugin](#extend-capabilities)                   | [Plugin](/ja-JP/tools/plugin)と[Plugin の構築](/ja-JP/plugins/building-plugins)                                             |
| 後で、またはバックグラウンドで作業を実行する | [自動化](/ja-JP/automation)                            | [自動化の概要](/ja-JP/automation)                                                                                     |
| 複数のエージェントやハーネスを連携させる    | [サブエージェント](/ja-JP/tools/subagents)             | [ACP エージェント](/ja-JP/tools/acp-agents)と[エージェント送信](/ja-JP/tools/agent-send)                                   |
| 大規模な OpenClaw ツールカタログを検索する  | [ツール検索](/ja-JP/tools/tool-search)                 | [ツール検索](/ja-JP/tools/tool-search)                                                                                |

## ツール、Skills、Plugin の選択

<Steps>
  <Step title="エージェントが操作する必要がある場合はツールを使用する">
    ツールは、`exec`、`browser`、`web_search`、`message`、`image_generate`
    など、エージェントが呼び出せる型付き関数です。エージェントが
    データを読み取る、ファイルを変更する、メッセージを送信する、プロバイダーを呼び出す、
    または別のシステムを操作する必要がある場合にツールを使用します。表示されるツールは、
    構造化された関数定義としてモデルに送信されます。

    モデルに表示されるのは、アクティブなプロファイル、許可・拒否
    ポリシー、プロバイダー制限、サンドボックスの状態、チャネル権限、
    Plugin の可用性をすべて通過したツールだけです。

  </Step>

  <Step title="エージェントに手順が必要な場合は Skills を使用する">
    Skills は、エージェントのプロンプトに読み込まれる `SKILL.md` の手順パックです。
    エージェントが必要なツールをすでに備えているものの、
    再利用可能なワークフロー、レビュールーブリック、コマンドシーケンス、または運用上の
    制約が必要な場合に Skills を使用します。

    Skills は、ワークスペース、共有 Skills ディレクトリ、管理対象の OpenClaw
    Skills ルート、または Plugin パッケージに配置できます。

    [Skills](/ja-JP/tools/skills) | [Skill Workshop](/ja-JP/tools/skill-workshop) | [Skills の作成](/ja-JP/tools/creating-skills) | [Skills の設定](/ja-JP/tools/skills-config)

  </Step>

  <Step title="OpenClaw に新しいケイパビリティが必要な場合は Plugin を使用する">
    Plugin は、ツール、Skills、チャネル、モデルプロバイダー、音声、
    リアルタイム音声、メディア生成、ウェブ検索、ウェブ取得、フック、その他の
    ランタイムケイパビリティを追加できます。そのケイパビリティにコード、
    認証情報、ライフサイクルフック、マニフェストメタデータ、またはインストール可能な
    パッケージが含まれる場合は Plugin を使用します。既存の Plugin は ClawHub、npm、git、
    ローカルディレクトリ、またはアーカイブからインストールできます。

    [Plugin のインストールと設定](/ja-JP/tools/plugin) | [Plugin の構築](/ja-JP/plugins/building-plugins) | [Plugin SDK](/ja-JP/plugins/sdk-overview)

  </Step>
</Steps>

## 組み込みツールカテゴリ

この表には、サーフェスを識別できるように代表的なツールを掲載しています。これは
完全なポリシーリファレンスではありません。正確なグループ、デフォルト、許可・拒否の
セマンティクスについては、[ツールとカスタムプロバイダー](/ja-JP/gateway/config-tools)を参照してください。

| カテゴリ                | エージェントが必要とする場合...                                                | 代表的なツール                                                                                       | 次に読むもの                                                                                     |
| ----------------------- | ----------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| ランタイム              | コマンドの実行、プロセスの管理、またはプロバイダー提供の Python 分析の使用     | `exec`、`process`、`code_execution`                                                                  | [Exec](/ja-JP/tools/exec)、[コード実行](/ja-JP/tools/code-execution)                                         |
| ファイル                | ワークスペースファイルの読み取りと変更                                         | `read`、`write`、`edit`、`apply_patch`                                                               | [パッチの適用](/ja-JP/tools/apply-patch)                                                               |
| ウェブ                  | ウェブの検索、X 投稿の検索、または読み取り可能なページコンテンツの取得         | `web_search`、`x_search`、`web_fetch`                                                                | [ウェブツール](/ja-JP/tools/web)、[ウェブ取得](/ja-JP/tools/web-fetch)                                       |
| ブラウザ                | ブラウザセッションの操作                                                       | `browser`                                                                                            | [ブラウザ](/ja-JP/tools/browser)                                                                       |
| メッセージングとチャネル | 返信またはチャネルアクションの送信                                             | `message`                                                                                            | [エージェント送信](/ja-JP/tools/agent-send)                                                            |
| セッションとエージェント | セッションの検査、作業の委任、別の実行の誘導、またはステータスの報告           | `sessions_*`、`subagents`、`agents_list`、`session_status`、`get_goal`、`create_goal`、`update_goal` | [目標](/ja-JP/tools/goal)、[サブエージェント](/ja-JP/tools/subagents)、[セッションツール](/ja-JP/concepts/session-tool) |
| 自動化                  | 作業のスケジュール、またはバックグラウンドイベントへの応答                     | `cron`、`heartbeat_respond`                                                                          | [自動化](/ja-JP/automation)                                                                            |
| Gateway と Node         | Gateway の状態、またはペアリング済み対象デバイスの検査                         | `gateway`、`nodes`                                                                                   | [Gateway の設定](/ja-JP/gateway/configuration)、[Node](/ja-JP/nodes)                                         |
| メディア                | メディアの分析、生成、または音声化                                             | `image`、`image_generate`、`music_generate`、`video_generate`、`tts`                                 | [メディアの概要](/ja-JP/tools/media-overview)                                                          |
| 大規模な OpenClaw カタログ | すべてのスキーマをモデルに送信せず、多数の対象ツールを検索して呼び出す         | `tool_search_code`、`tool_search`、`tool_describe`                                                   | [ツール検索](/ja-JP/tools/tool-search)                                                                 |

<Note>
ツール検索は、実験的な OpenClaw エージェントサーフェスです。Codex ハーネスの実行では、
`tools.toolSearch` の代わりに、Codex ネイティブのコードモード、ネイティブツール検索、
遅延動的ツール、ネストされたツール呼び出しを使用します。
</Note>

## Plugin が提供するツール

Plugin は追加のツールを登録できます。Plugin の作成者は
`api.registerTool(...)` とマニフェストの `contracts.tools` を通じてツールを接続します。
コントラクトの詳細については、[Plugin SDK](/ja-JP/plugins/sdk-overview)と
[Plugin マニフェスト](/ja-JP/plugins/manifest)を参照してください。

一般的な Plugin 提供ツールには、次のものがあります。

- ファイルと Markdown の差分をレンダリングするための [差分](/ja-JP/tools/diffs)
- ウェブチャット内で自己完結型のインライン SVG と HTML を表示するための [ウィジェットを表示](/tools/show-widget)
- JSON 専用ワークフローステップのための [LLM タスク](/ja-JP/tools/llm-task)
- 再開可能な承認を備えた型付きワークフローのための [Lobster](/ja-JP/tools/lobster)
- ノイズの多い `exec` と `bash` ツールの
  出力を圧縮するための [Tokenjuice](/ja-JP/tools/tokenjuice)
- すべてのスキーマをプロンプトに含めずに大規模なツール
  カタログを検出して呼び出すための [ツール検索](/ja-JP/tools/tool-search)
- Node の Canvas 制御と A2UI
  レンダリングのための [Canvas](/ja-JP/plugins/reference/canvas)

## アクセスと承認の設定

ツールポリシーはモデル呼び出しの前に適用されます。ポリシーによってツールが除外された場合、
モデルはそのターンでそのツールのスキーマを受け取りません。グローバル設定、エージェントごとの設定、
チャネルポリシー、プロバイダー制限、サンドボックスルール、チャネル・ランタイムポリシー、
または Plugin の可用性が原因で、実行時にツールが利用できなくなることがあります。

- [ツールとカスタムプロバイダー](/ja-JP/gateway/config-tools)では、ツールプロファイル、
  許可・拒否リスト、プロバイダー固有の制限、ループ検出、
  プロバイダー提供ツールの設定について説明します。
- [Exec の承認](/ja-JP/tools/exec-approvals)では、ホストコマンドの承認
  ポリシーについて説明します。
- [昇格 Exec](/ja-JP/tools/elevated)では、サンドボックス外で制御された実行を
  行う方法について説明します。
- [サンドボックス、ツールポリシー、昇格の比較](/ja-JP/gateway/sandbox-vs-tool-policy-vs-elevated)では、
  ファイルおよびプロセスへのアクセスをどのレイヤーが制御するかを説明します。
- [エージェントごとのサンドボックスとツール制限](/ja-JP/tools/multi-agent-sandbox-tools)では、
  委任された実行に対するエージェント固有の制限について説明します。

## ケイパビリティの拡張

OpenClaw に実行させる作業に応じて、拡張方法を選択します。

- [Plugin](/ja-JP/tools/plugin)を使用して、既存の Plugin をインストールまたは管理します。
- [Plugin の構築](/ja-JP/plugins/building-plugins)を使用して、新しい統合、プロバイダー、チャネル、ツール、またはフックを
  構築します。
- [Skills](/ja-JP/tools/skills)と
  [Skills の作成](/ja-JP/tools/creating-skills)を使用して、再利用可能なエージェント手順を追加または調整します。
- 実装コントラクトが必要な場合は、[Plugin SDK](/ja-JP/plugins/sdk-overview)と
  [Plugin マニフェスト](/ja-JP/plugins/manifest)を使用します。

## 見つからないツールのトラブルシューティング

モデルがツールを表示または呼び出せない場合は、現在のターンに適用される
実効ポリシーの確認から始めます。

1. [ツールとカスタムプロバイダー](/ja-JP/gateway/config-tools)で、アクティブなプロファイル、
   `tools.allow`、`tools.deny`を確認します。
2. [ツールとカスタムプロバイダー](/ja-JP/gateway/config-tools)でプロバイダー固有の制限を確認し、
   選択した[モデルプロバイダー](/ja-JP/concepts/model-providers)がそのツールの
   形式をサポートしていることを確認します。
3. [サンドボックス、ツールポリシー、昇格の比較](/ja-JP/gateway/sandbox-vs-tool-policy-vs-elevated)と
   [昇格 Exec](/ja-JP/tools/elevated)で、チャネル権限、サンドボックスの状態、昇格アクセスを確認します。
4. [Plugin](/ja-JP/tools/plugin)で、所有元の Plugin がインストールされ、有効になっているかを確認します。
5. 委任された実行では、
   [エージェントごとのサンドボックスとツール制限](/ja-JP/tools/multi-agent-sandbox-tools)でエージェントごとの制限を確認します。
6. 大規模な OpenClaw カタログでは、その実行がツールの直接公開と
   [ツール検索](/ja-JP/tools/tool-search)のどちらを使用しているか確認します。

## 関連項目

- cron、タスク、Heartbeat、コミットメント、フック、
  常設指示、Task Flowについては[自動化](/ja-JP/automation)
- エージェントモデル、セッション、メモリ、
  マルチエージェント連携については[エージェント](/ja-JP/concepts/agent)
- 正式なツールポリシーの
  リファレンスについては[ツールとカスタムプロバイダー](/ja-JP/gateway/config-tools)
- Pluginのインストールと管理については[Plugin](/ja-JP/tools/plugin)
- Plugin作成者向けリファレンスについては[Plugin SDK](/ja-JP/plugins/sdk-overview)
- Skillsの読み込み順序、ゲーティング、設定については[Skills](/ja-JP/tools/skills)
- 生成およびレビューを伴うSkills作成については[Skillsワークショップ](/ja-JP/tools/skill-workshop)
- OpenClawのコンパクトなツールカタログの
  検索については[ツール検索](/ja-JP/tools/tool-search)
