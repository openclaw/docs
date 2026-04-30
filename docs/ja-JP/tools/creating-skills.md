---
read_when:
    - ワークスペースで新しいカスタムスキルを作成しています
    - SKILL.mdベースのSkills向けに、すぐに始められるワークフローが必要です
summary: SKILL.mdでカスタムワークスペースSkillsをビルドしてテストする
title: Skillsの作成
x-i18n:
    generated_at: "2026-04-30T05:37:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 201718f4088f4243b0dabe12fb4fce4b8a7e64df9a4b7d651356ab4ae0dd3579
    source_path: tools/creating-skills.md
    workflow: 16
---

Skillsは、いつどのようにツールを使うかをエージェントに教えます。各スキルは、YAMLフロントマターとMarkdown指示を含む`SKILL.md`ファイルを持つディレクトリです。

Skillsの読み込みと優先順位付けの仕組みについては、[Skills](/ja-JP/tools/skills)を参照してください。

## 最初のスキルを作成する

<Steps>
  <Step title="スキルディレクトリを作成する">
    Skillsはワークスペース内に配置されます。新しいフォルダーを作成します。

    ```bash
    mkdir -p ~/.openclaw/workspace/skills/hello-world
    ```

  </Step>

  <Step title="SKILL.mdを書く">
    そのディレクトリ内に`SKILL.md`を作成します。フロントマターはメタデータを定義し、
    Markdown本文にはエージェントへの指示を記述します。

    ```markdown
    ---
    name: hello-world
    description: A simple skill that says hello.
    ---

    # Hello World Skill

    When the user asks for a greeting, use the `echo` tool to say
    "Hello from your custom skill!".
    ```

    スキルの`name`には、小文字、数字、ハイフンを使ったハイフンケースを使用します。
    フォルダー名とフロントマターの`name`を一致させてください。

  </Step>

  <Step title="ツールを追加する（任意）">
    フロントマターでカスタムツールスキーマを定義することも、エージェントに既存のシステムツール
    （`exec`や`browser`など）を使うよう指示することもできます。Skillsは、説明対象のツールと一緒に
    plugins内で配布することもできます。

  </Step>

  <Step title="スキルを読み込む">
    OpenClawがスキルを検出するように、新しいセッションを開始します。

    ```bash
    # From chat
    /new

    # Or restart the gateway
    openclaw gateway restart
    ```

    スキルが読み込まれたことを確認します。

    ```bash
    openclaw skills list
    ```

  </Step>

  <Step title="テストする">
    スキルをトリガーするはずのメッセージを送信します。

    ```bash
    openclaw agent --message "give me a greeting"
    ```

    または、エージェントとチャットして挨拶を依頼します。

  </Step>
</Steps>

## スキルメタデータリファレンス

YAMLフロントマターは次のフィールドをサポートします。

| フィールド                          | 必須     | 説明                                                           |
| ----------------------------------- | -------- | -------------------------------------------------------------- |
| `name`                              | はい     | 小文字、数字、ハイフンを使った一意の識別子                    |
| `description`                       | はい     | エージェントに表示される1行の説明                             |
| `metadata.openclaw.os`              | いいえ   | OSフィルター（`["darwin"]`、`["linux"]`など）                  |
| `metadata.openclaw.requires.bins`   | いいえ   | PATH上に必要なバイナリ                                         |
| `metadata.openclaw.requires.config` | いいえ   | 必要な設定キー                                                 |

## ベストプラクティス

- **簡潔にする** — AIとしてどう振る舞うかではなく、_何を_するかをモデルに指示する
- **安全第一** — スキルが`exec`を使う場合、信頼できない入力から任意のコマンドインジェクションができないようにプロンプトを設計する
- **ローカルでテストする** — 共有する前に`openclaw agent --message "..."`を使ってテストする
- **ClawHubを使う** — [ClawHub](https://clawhub.ai)でSkillsを探して投稿する

## Skillsの配置場所

| 場所                            | 優先順位 | スコープ              |
| ------------------------------- | -------- | --------------------- |
| `\<workspace\>/skills/`         | 最高     | エージェント単位      |
| `\<workspace\>/.agents/skills/` | 高       | ワークスペース内のエージェント単位 |
| `~/.agents/skills/`             | 中       | 共有エージェントプロファイル |
| `~/.openclaw/skills/`           | 中       | 共有（すべてのエージェント） |
| バンドル済み（OpenClawに同梱） | 低       | グローバル            |
| `skills.load.extraDirs`         | 最低     | カスタム共有フォルダー |

## 関連

- [Skillsリファレンス](/ja-JP/tools/skills) — 読み込み、優先順位、ゲートルール
- [Skills設定](/ja-JP/tools/skills-config) — `skills.*`設定スキーマ
- [ClawHub](/ja-JP/tools/clawhub) — 公開スキルレジストリ
- [Pluginsの構築](/ja-JP/plugins/building-plugins) — pluginsはSkillsを同梱できる
