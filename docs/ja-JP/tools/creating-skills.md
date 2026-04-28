---
read_when:
    - workspace で新しい custom skill を作成しています
    - SKILL.md ベースの Skills のためのクイックスタートワークフローが必要です
summary: SKILL.md を使って custom workspace Skills を構築およびテストする
title: Skills を作成すること
x-i18n:
  refreshed_at: '2026-04-28T05:23:26Z'
  generated_at: "2026-04-24T05:24:03Z"
  model: gpt-5.4
  provider: openai
  source_hash: df9249e14936c65143580a6618679cf2d79a2960390e5c7afc5dbea1a9a6e045
  source_path: tools/creating-skills.md
  workflow: 15
---

Skills は、tool をどのように、いつ使うかをエージェントに教えます。各 skill は、
YAML frontmatter と markdown 命令を含む `SKILL.md` ファイルを持つディレクトリです。

Skills の読み込み方法と優先順位については、[Skills](/ja-JP/tools/skills) を参照してください。

## 最初の skill を作成する

<Steps>
  <Step title="skill ディレクトリを作成する">
    Skills は workspace 内に配置されます。新しいフォルダーを作成してください。

    ```bash
    mkdir -p ~/.openclaw/workspace/skills/hello-world
    ```

  </Step>

  <Step title="SKILL.md を書く">
    そのディレクトリ内に `SKILL.md` を作成します。frontmatter でメタデータを定義し、
    markdown 本文にエージェント向けの指示を書きます。

    ```markdown
    ---
    name: hello_world
    description: あいさつを返すシンプルな skill。
    ---

    # Hello World Skill

    ユーザーがあいさつを求めたら、`echo` tool を使って
    "Hello from your custom skill!" と返してください。
    ```

  </Step>

  <Step title="tool を追加する（任意）">
    frontmatter で custom tool schema を定義することも、
    既存の system tool（`exec` や `browser` など）を使うようエージェントに指示することもできます。
    Skills は、それが説明する tool と一緒に plugin 内で配布することもできます。

  </Step>

  <Step title="skill を読み込む">
    OpenClaw が skill を認識するよう、新しいセッションを開始してください。

    ```bash
    # チャットから
    /new

    # または gateway を再起動
    openclaw gateway restart
    ```

    skill が読み込まれたことを確認します。

    ```bash
    openclaw skills list
    ```

  </Step>

  <Step title="テストする">
    skill を発動するはずのメッセージを送ってください。

    ```bash
    openclaw agent --message "give me a greeting"
    ```

    または、単にエージェントと会話して、あいさつを求めてください。

  </Step>
</Steps>

## skill メタデータリファレンス

YAML frontmatter は次のフィールドをサポートします。

| Field | Required | 説明 |
| ----------------------------------- | -------- | ------------------------------------------- |
| `name` | Yes | 一意の識別子（snake_case） |
| `description` | Yes | エージェントに表示される 1 行の説明 |
| `metadata.openclaw.os` | No | OS フィルター（`["darwin"]`, `["linux"]` など） |
| `metadata.openclaw.requires.bins` | No | PATH 上で必要なバイナリ |
| `metadata.openclaw.requires.config` | No | 必要な config key |

## ベストプラクティス

- **簡潔にする** — AI としてどう振る舞うかではなく、何をするかをモデルに指示します
- **安全性を最優先にする** — skill が `exec` を使う場合、信頼できない入力から任意コマンド注入が起きないようにしてください
- **ローカルでテストする** — 共有する前に `openclaw agent --message "..."` でテストしてください
- **ClawHub を使う** — [ClawHub](https://clawhub.ai) で Skills を閲覧し、貢献できます

## Skills の配置場所

| Location | Precedence | Scope |
| ------------------------------- | ---------- | --------------------- |
| `\<workspace\>/skills/` | 最優先 | エージェントごと |
| `\<workspace\>/.agents/skills/` | 高 | workspace ごとのエージェント |
| `~/.agents/skills/` | 中 | 共有エージェントプロファイル |
| `~/.openclaw/skills/` | 中 | 共有（すべてのエージェント） |
| Bundled（OpenClaw 同梱） | 低 | グローバル |
| `skills.load.extraDirs` | 最低 | custom 共有フォルダー |

## 関連

- [Skills reference](/ja-JP/tools/skills) — 読み込み、優先順位、ゲーティングルール
- [Skills config](/ja-JP/tools/skills-config) — `skills.*` config schema
- [ClawHub](/ja-JP/tools/clawhub) — 公開 skill registry
- [Building Plugins](/ja-JP/plugins/building-plugins) — plugin は skill を同梱できます
