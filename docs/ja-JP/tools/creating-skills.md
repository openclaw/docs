---
read_when:
    - 新しいカスタムSkillを作成しています
    - SKILL.md ベースの Skills 向けに、すぐに始められるワークフローが必要です
    - Skill Workshop を使用して、エージェントレビュー用のスキルを提案したい
sidebarTitle: Creating skills
summary: OpenClaw エージェント向けのカスタム SKILL.md ワークスペース Skills をビルド、テスト、公開します。
title: Skills の作成
x-i18n:
    generated_at: "2026-06-27T13:10:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7a744e9010c66b8465449d24430520473717edde86711bbb59774519189b9e72
    source_path: tools/creating-skills.md
    workflow: 16
---

Skills は、エージェントがツールをいつどのように使うかを教えます。各Skillは、YAMLフロントマターとMarkdownの手順を含む`SKILL.md`ファイルを持つディレクトリです。
OpenClaw は、定義済みの[優先順位](/ja-JP/tools/skills#loading-order)に従って複数のルートからSkillsを読み込みます。

## 最初のSkillを作成する

<Steps>
  <Step title="Create the skill directory">
    Skills はワークスペースの`skills/`フォルダーに置きます。新しいSkill用のディレクトリを作成します。

    ```bash
    mkdir -p ~/.openclaw/workspace/skills/hello-world
    ```

    整理のためにSkillsをサブフォルダーにまとめることもできます。Skillの名前はフォルダーパスではなく、`SKILL.md`のフロントマターで決まります。

    ```bash
    mkdir -p ~/.openclaw/workspace/skills/personal/hello-world
    # skill name is still "hello-world", invoked as /hello-world
    ```

  </Step>

  <Step title="Write SKILL.md">
    ディレクトリ内に`SKILL.md`を作成します。フロントマターはメタデータを定義し、本文はエージェントへの手順を示します。

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
    - `name`には小文字、数字、ハイフンを使用します。
    - ディレクトリ名とフロントマターの`name`を一致させます。
    - `description`はエージェントとスラッシュコマンド検出に表示されます。1行に収め、160文字未満にしてください。

  </Step>

  <Step title="Verify the skill loaded">
    ```bash
    openclaw skills list
    ```

    OpenClaw はデフォルトでSkillsルート配下の`SKILL.md`ファイルを監視します。監視が無効になっている場合、または既存のセッションを継続している場合は、エージェントが更新済みリストを受け取れるように新しいセッションを開始します。

    ```bash
    # From chat — archive current session and start fresh
    /new

    # Or restart the gateway
    openclaw gateway restart
    ```

  </Step>

  <Step title="Test it">
    Skillをトリガーするはずのメッセージを送信します。

    ```bash
    openclaw agent --message "give me a greeting"
    ```

    またはチャットを開き、エージェントに直接依頼します。名前で明示的に呼び出すには`/skill hello-world`を使用します。

  </Step>
</Steps>

## SKILL.mdリファレンス

### 必須フィールド

| フィールド    | 説明                                                   |
| ------------- | ------------------------------------------------------ |
| `name`        | 小文字、数字、ハイフンを使った一意のスラッグ           |
| `description` | エージェントと検出出力に表示される1行の説明            |

### 任意のフロントマターキー

| フィールド                 | デフォルト | 説明                                                                      |
| -------------------------- | ---------- | ------------------------------------------------------------------------- |
| `user-invocable`           | `true`     | Skillをユーザー用スラッシュコマンドとして公開する                         |
| `disable-model-invocation` | `false`    | Skillをエージェントのシステムプロンプトから除外する（`/skill`では引き続き実行される） |
| `command-dispatch`         | —          | `tool`に設定すると、モデルをバイパスしてスラッシュコマンドを直接ツールへルーティングする |
| `command-tool`             | —          | `command-dispatch: tool`が設定されているときに呼び出すツール名             |
| `command-arg-mode`         | `raw`      | ツールディスパッチでは、生の引数文字列をツールへ転送する                  |
| `homepage`                 | —          | macOS Skills UIで「Website」として表示されるURL                            |

ゲート用フィールド（`requires.bins`、`requires.env`など）については、
[Skills — ゲーティング](/ja-JP/tools/skills#gating)を参照してください。

### `{baseDir}`の使用

Skill本文内で`{baseDir}`を使うと、パスをハードコードせずにSkillディレクトリ内のファイルを参照できます。

```markdown
Run the helper script at `{baseDir}/scripts/run.sh`.
```

## 条件付き有効化を追加する

依存関係が利用可能な場合にのみ読み込まれるように、Skillにゲートを設定します。

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
    | `requires.bins` | すべてのバイナリが`PATH`上に存在する必要がある |
    | `requires.anyBins` | 少なくとも1つのバイナリが`PATH`上に存在する必要がある |
    | `requires.env` | 各環境変数がプロセスまたは設定内に存在する必要がある |
    | `requires.config` | 各`openclaw.json`パスが真値である必要がある |
    | `os` | プラットフォームフィルター: `["darwin"]`、`["linux"]`、`["win32"]` |
    | `always` | `true`に設定するとすべてのゲートをスキップし、常にSkillを含める |

    完全なリファレンス: [Skills — ゲーティング](/ja-JP/tools/skills#gating)。

  </Accordion>
  <Accordion title="Environment and API keys">
    APIキーを`openclaw.json`内のSkillエントリに接続します。

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
    サンドボックスには届きません。詳細は
    [サンドボックス化された環境変数](/ja-JP/tools/skills-config#sandboxed-skills-and-env-vars)を参照してください。

  </Accordion>
</AccordionGroup>

## Skill Workshop経由で提案する

エージェントが下書きしたSkillsや、Skillを有効化する前にオペレーターのレビューを受けたい場合は、`SKILL.md`を直接書く代わりに[Skill Workshop](/ja-JP/tools/skill-workshop)の提案を使用します。

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

提案にサポートファイルが含まれる場合は`--proposal-dir`を使用します。

```bash
openclaw skills workshop propose-create \
  --name "hello-world" \
  --description "A simple skill that prints a greeting." \
  --proposal-dir ./hello-world-proposal/
```

ディレクトリには`PROPOSAL.md`が含まれている必要があります。サポートファイルは`assets/`、`examples/`、`references/`、`scripts/`、または`templates/`に置けます。

レビュー後:

```bash
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop apply <proposal-id>
```

提案ライフサイクル全体については[Skill Workshop](/ja-JP/tools/skill-workshop)を参照してください。

## ClawHubへ公開する

<Steps>
  <Step title="Ensure your SKILL.md is complete">
    `name`、`description`、および`metadata.openclaw`のゲート用フィールドが設定されていることを確認します。プロジェクトページがある場合は`homepage` URLを追加します。
  </Step>
  <Step title="Install the ClawHub skill">
    ClawHub Skillには、現在の公開コマンド形式と必要なメタデータが記載されています。

    ```bash
    openclaw skills install @openclaw/clawhub-publish
    ```

  </Step>
  <Step title="Publish">
    ```bash
    clawhub publish
    ```

    フロー全体については[ClawHub — 公開](/ja-JP/clawhub/publishing)を参照してください。

  </Step>
</Steps>

## ベストプラクティス

<Tip>
  - **簡潔にする** — AIとして振る舞う方法ではなく、*何を*するかをモデルに指示します。
  - **安全を最優先にする** — Skillが`exec`を使用する場合、信頼できない入力から任意のコマンド注入を許さないようにプロンプトを設計してください。
  - **ローカルでテストする** — 共有する前に`openclaw agent --message "..."`を使用します。
  - **ClawHubを使用する** — ゼロから構築する前に、[clawhub.ai](https://clawhub.ai)でコミュニティのSkillsを探します。
</Tip>

## 関連

<CardGroup cols={2}>
  <Card title="Skills reference" href="/ja-JP/tools/skills" icon="puzzle-piece">
    読み込み順、ゲーティング、許可リスト、SKILL.md形式。
  </Card>
  <Card title="Skill Workshop" href="/ja-JP/tools/skill-workshop" icon="flask">
    エージェントが下書きしたSkills用の提案キュー。
  </Card>
  <Card title="Skills config" href="/ja-JP/tools/skills-config" icon="gear">
    完全な`skills.*`設定スキーマ。
  </Card>
  <Card title="ClawHub" href="/ja-JP/clawhub" icon="cloud">
    公開レジストリでSkillsを探して公開する。
  </Card>
  <Card title="Building plugins" href="/ja-JP/plugins/building-plugins" icon="plug">
    Pluginは、説明対象のツールと一緒にSkillsを同梱できます。
  </Card>
</CardGroup>
