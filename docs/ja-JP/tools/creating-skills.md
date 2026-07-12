---
read_when:
    - 新しいカスタムスキルを作成しています
    - SKILL.md ベースのスキル向けクイックスタートワークフローが必要です
    - Skill Workshopを使用して、エージェントによるレビュー用のスキルを提案したい場合
sidebarTitle: Creating skills
summary: OpenClaw エージェント向けのカスタム SKILL.md ワークスペース Skills を構築、テスト、公開します。
title: スキルの作成
x-i18n:
    generated_at: "2026-07-11T22:44:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cba2aa863ebd083d4592e8a764dbdc2c30a0dd8aff49d273927e82df0069bc81
    source_path: tools/creating-skills.md
    workflow: 16
---

Skills は、ツールを使用する方法とタイミングをエージェントに教えます。各 skill は、
YAML フロントマターと Markdown の指示を記述した `SKILL.md` ファイルを含むディレクトリです。
OpenClaw は、定義された[優先順位](/ja-JP/tools/skills#loading-order)に従って複数のルートから skills を読み込みます。

## 最初の skill を作成する

<Steps>
  <Step title="Create the skill directory">
    Skills はワークスペースの `skills/` フォルダーに配置します。

    ```bash
    mkdir -p ~/.openclaw/workspace/skills/hello-world
    ```

    整理のために skills をサブフォルダーにまとめることもできます。ただし、skill の名前は
    フォルダーのパスではなく、`SKILL.md` のフロントマターによって決まります。

    ```bash
    mkdir -p ~/.openclaw/workspace/skills/personal/hello-world
    # skill name is still "hello-world", invoked as /hello-world
    ```

  </Step>

  <Step title="Write SKILL.md">
    フロントマターでメタデータを定義し、本文でエージェントへの指示を記述します。

    ```markdown
    ---
    name: hello-world
    description: A simple skill that prints a greeting.
    ---

    # Hello World

    When the user asks for a greeting, use the `exec` tool to run:

    ```bash
    echo "Hello from your custom skill!"
    ```
    ```

    命名規則:
    - `name` には小文字、数字、ハイフンを使用します。
    - ディレクトリ名とフロントマターの `name` を一致させます。
    - `description` はエージェントとスラッシュコマンドの検出結果に表示されるため、
      1 行かつ 160 文字未満にします。

  </Step>

  <Step title="Verify the skill loaded">
    ```bash
    openclaw skills list
    ```

    OpenClaw はデフォルトで、skills ルート配下の `SKILL.md` ファイルを監視します。
    監視機能が無効になっている場合や、既存のセッションを継続している場合は、
    エージェントが更新後の一覧を受け取れるように新しいセッションを開始します。

    ```bash
    # From chat — archive current session and start fresh
    /new

    # Or restart the gateway
    openclaw gateway restart
    ```

  </Step>

  <Step title="Test it">
    ```bash
    openclaw agent --message "give me a greeting"
    ```

    または、チャットを開いてエージェントに直接依頼します。名前を指定して明示的に
    呼び出すには、`/skill hello-world` を使用します。

  </Step>
</Steps>

## SKILL.md リファレンス

### 必須フィールド

| フィールド    | 説明                                                         |
| ------------- | ------------------------------------------------------------ |
| `name`        | 小文字、数字、ハイフンを使用した一意のスラッグ               |
| `description` | エージェントと検出結果に表示される 1 行の説明                |

### 任意のフロントマターキー

| フィールド                 | デフォルト | 説明                                                                                     |
| -------------------------- | ---------- | ---------------------------------------------------------------------------------------- |
| `user-invocable`           | `true`     | skill をユーザー向けスラッシュコマンドとして公開する                                     |
| `disable-model-invocation` | `false`    | skill をエージェントのシステムプロンプトから除外する（`/skill` では引き続き実行可能）     |
| `command-dispatch`         | —          | `tool` に設定すると、モデルを経由せずスラッシュコマンドをツールへ直接ルーティングする     |
| `command-tool`             | —          | `command-dispatch: tool` が設定されている場合に呼び出すツール名                           |
| `command-arg-mode`         | `raw`      | ツールへのディスパッチ時に、生の引数文字列をツールへ転送する                             |
| `homepage`                 | —          | macOS の Skills UI で "Website" として表示される URL                                      |

ゲーティングフィールド（`requires.bins`、`requires.env` など）については、
[Skills — ゲーティング](/ja-JP/tools/skills#gating)を参照してください。

### `{baseDir}` の使用

パスをハードコードせずに、skill ディレクトリ内のファイルを参照できます。
エージェントは `{baseDir}` を、その skill 自身のディレクトリを基準に解決します。

```markdown
Run the helper script at `{baseDir}/scripts/run.sh`.
```

## 条件付き有効化を追加する

依存関係が利用可能な場合にのみ読み込まれるよう、skill にゲートを設定します。

```markdown
---
name: gemini-search
description: Search using Gemini CLI.
metadata: { "openclaw": { "requires": { "bins": ["gemini"] }, "primaryEnv": "GEMINI_API_KEY" } }
---
```

<AccordionGroup>
  <Accordion title="Gating options">
    | キー | 説明 |
    | --- | --- |
    | `requires.bins` | すべてのバイナリが `PATH` 上に存在する必要がある |
    | `requires.anyBins` | 1 つ以上のバイナリが `PATH` 上に存在する必要がある |
    | `requires.env` | 各環境変数がプロセスまたは設定内に存在する必要がある |
    | `requires.config` | `openclaw.json` の各パスが真と評価される必要がある |
    | `os` | プラットフォームフィルター: `["darwin"]`、`["linux"]`、`["win32"]` |
    | `always` | `true` に設定すると、すべてのゲートをスキップして常に skill を含める |

    完全なリファレンス: [Skills — ゲーティング](/ja-JP/tools/skills#gating)。

  </Accordion>
  <Accordion title="Environment and API keys">
    `openclaw.json` 内の skill エントリに API キーを関連付けます。

    ```json5
    {
      skills: {
        entries: {
          "gemini-search": {
            enabled: true,
            apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" },
          },
        },
      },
    }
    ```

    キーは、そのエージェントターンの間だけホストプロセスに注入されます。
    サンドボックスには渡されません。詳しくは
    [サンドボックス化された環境変数](/ja-JP/tools/skills-config#sandboxed-skills-and-env-vars)を参照してください。

  </Accordion>
</AccordionGroup>

## Skill Workshop で提案する

エージェントが下書きした skills の場合や、skill を公開する前にオペレーターによるレビューが必要な場合は、
`SKILL.md` を直接作成する代わりに、[Skill Workshop](/ja-JP/tools/skill-workshop) の提案を使用します。

```bash
# Propose a brand-new skill
openclaw skills workshop propose-create \
  --name "hello-world" \
  --description "A simple skill that prints a greeting." \
  --proposal ./PROPOSAL.md

# Propose an update to an existing skill
openclaw skills workshop propose-update hello-world \
  --proposal ./PROPOSAL.md \
  --description "Updated greeting skill"
```

提案に補助ファイルが含まれる場合は、`--proposal-dir` を使用します。

```bash
openclaw skills workshop propose-create \
  --name "hello-world" \
  --description "A simple skill that prints a greeting." \
  --proposal-dir ./hello-world-proposal/
```

ディレクトリのルートには `PROPOSAL.md` が必要です。補助ファイルは
`assets/`、`examples/`、`references/`、`scripts/`、または `templates/` の配下に配置します。

レビュー後:

```bash
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop apply <proposal-id>
```

提案のライフサイクル全体については、[Skill Workshop](/ja-JP/tools/skill-workshop) を参照してください。

## ClawHub への公開

<Steps>
  <Step title="Ensure your SKILL.md is complete">
    `name`、`description`、および `metadata.openclaw` のゲーティングフィールドが設定されていることを
    確認します。プロジェクトページがある場合は、`homepage` URL を追加します。
  </Step>
  <Step title="Install the standalone ClawHub CLI and log in">
    ```bash
    npm i -g clawhub
    clawhub login
    ```
  </Step>
  <Step title="Publish">
    ```bash
    clawhub skill publish ./path/to/hello-world
    ```

    推測されたバージョンを上書きするには `--version <version>` を、特定の所有者として公開するには
    `--owner <owner>` を追加します。完全な手順、所有者のスコープ、その他のメンテナンスコマンド
    （`clawhub sync`、`clawhub skill rename` など）については、
    [ClawHub — 公開](/ja-JP/clawhub/publishing)および
    [ClawHub CLI](/ja-JP/clawhub/cli)を参照してください。

  </Step>
</Steps>

## ベストプラクティス

<Tip>
  - **簡潔にする** — AI としてどう振る舞うかではなく、*何を*行うかをモデルに指示します。
  - **安全性を最優先する** — skill で `exec` を使用する場合は、信頼できない入力によって
    任意のコマンドが注入されないようにプロンプトを構成します。
  - **ローカルでテストする** — 共有する前に `openclaw agent --message "..."` を使用します。
  - **ClawHub を使用する** — ゼロから構築する前に、[clawhub.ai](https://clawhub.ai) で
    コミュニティの skills を確認します。
</Tip>

## 関連項目

<CardGroup cols={2}>
  <Card title="Skills reference" href="/ja-JP/tools/skills" icon="puzzle-piece">
    読み込み順序、ゲーティング、許可リスト、および SKILL.md の形式。
  </Card>
  <Card title="Skill Workshop" href="/ja-JP/tools/skill-workshop" icon="flask">
    エージェントが下書きした skills の提案キュー。
  </Card>
  <Card title="Skills config" href="/ja-JP/tools/skills-config" icon="gear">
    `skills.*` の完全な設定スキーマ。
  </Card>
  <Card title="ClawHub" href="/clawhub" icon="cloud">
    公開レジストリで skills を参照して公開します。
  </Card>
  <Card title="Building plugins" href="/ja-JP/plugins/building-plugins" icon="plug">
    Plugins は、説明対象のツールとともに skills を配布できます。
  </Card>
</CardGroup>
