---
read_when:
    - 新しいカスタムスキルを作成しています
    - SKILL.md ベースの Skills 向けに、手早く始めるためのワークフローが必要です
    - Skill Workshop を使用して、エージェントレビュー用のスキルを提案したい
sidebarTitle: Creating skills
summary: OpenClaw エージェント向けのカスタム SKILL.md ワークスペース Skills をビルド、テスト、公開します。
title: Skills の作成
x-i18n:
    generated_at: "2026-07-05T11:49:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cba2aa863ebd083d4592e8a764dbdc2c30a0dd8aff49d273927e82df0069bc81
    source_path: tools/creating-skills.md
    workflow: 16
---

Skills は、エージェントにツールをいつ、どのように使うかを教えます。各スキルは、
YAML フロントマターと Markdown の手順を含む `SKILL.md` ファイルを持つディレクトリです。
OpenClaw は、定義済みの[優先順位](/ja-JP/tools/skills#loading-order)に従って複数のルートから Skills を読み込みます。

## 最初のスキルを作成する

<Steps>
  <Step title="Create the skill directory">
    Skills はワークスペースの `skills/` フォルダーに配置します。

    ```bash
    mkdir -p ~/.openclaw/workspace/skills/hello-world
    ```

    整理のためにスキルをサブフォルダーでグループ化できます。スキル名はフォルダーパスではなく、
    `SKILL.md` のフロントマターで決まります。

    ```bash
    mkdir -p ~/.openclaw/workspace/skills/personal/hello-world
    # skill name is still "hello-world", invoked as /hello-world
    ```

  </Step>

  <Step title="Write SKILL.md">
    フロントマターはメタデータを定義し、本文はエージェントへの手順を示します。

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
    - `description` はエージェントとスラッシュコマンドの探索に表示されます。
      1 行にし、160 文字未満にしてください。

  </Step>

  <Step title="Verify the skill loaded">
    ```bash
    openclaw skills list
    ```

    OpenClaw はデフォルトで、Skills ルート配下の `SKILL.md` ファイルを監視します。
    ウォッチャーが無効になっている場合、または既存のセッションを続けている場合は、
    エージェントが更新済みリストを受け取れるように新しいセッションを開始します。

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

    またはチャットを開き、エージェントに直接依頼します。名前で明示的に呼び出すには
    `/skill hello-world` を使用します。

  </Step>
</Steps>

## `SKILL.md` リファレンス

### 必須フィールド

| フィールド | 説明 |
| ------------- | --------------------------------------------------------------- |
| `name` | 小文字、数字、ハイフンを使用する一意のスラッグ |
| `description` | エージェントと探索出力に表示される 1 行の説明 |

### 任意のフロントマターキー

| フィールド | デフォルト | 説明 |
| -------------------------- | ------- | -------------------------------------------------------------------------------- |
| `user-invocable` | `true` | スキルをユーザー向けスラッシュコマンドとして公開します |
| `disable-model-invocation` | `false` | スキルをエージェントのシステムプロンプトから除外します（`/skill` 経由では引き続き実行されます） |
| `command-dispatch` | — | `tool` に設定すると、モデルを迂回してスラッシュコマンドをツールへ直接ルーティングします |
| `command-tool` | — | `command-dispatch: tool` が設定されているときに呼び出すツール名 |
| `command-arg-mode` | `raw` | ツールディスパッチ時に、生の引数文字列をツールへ転送します |
| `homepage` | — | macOS の Skills UI で「Website」として表示される URL |

ゲート用フィールド（`requires.bins`、`requires.env` など）については
[Skills — ゲート](/ja-JP/tools/skills#gating)を参照してください。

### `{baseDir}` の使用

パスをハードコードせずに、スキルディレクトリ内のファイルを参照します。
エージェントは、スキル自身のディレクトリを基準に `{baseDir}` を解決します。

```markdown
Run the helper script at `{baseDir}/scripts/run.sh`.
```

## 条件付き有効化を追加する

依存関係が利用可能な場合にのみ読み込まれるように、スキルにゲートを設定します。

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
    | `requires.bins` | すべてのバイナリが `PATH` 上に存在する必要があります |
    | `requires.anyBins` | 少なくとも 1 つのバイナリが `PATH` 上に存在する必要があります |
    | `requires.env` | 各環境変数がプロセスまたは設定内に存在する必要があります |
    | `requires.config` | 各 `openclaw.json` パスが truthy である必要があります |
    | `os` | プラットフォームフィルター: `["darwin"]`、`["linux"]`、`["win32"]` |
    | `always` | `true` に設定すると、すべてのゲートをスキップし、常にスキルを含めます |

    完全なリファレンス: [Skills — ゲート](/ja-JP/tools/skills#gating)。

  </Accordion>
  <Accordion title="Environment and API keys">
    `openclaw.json` のスキルエントリに API キーを接続します。

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

    キーは、そのエージェントターンに限ってホストプロセスへ注入されます。
    サンドボックスには到達しません。詳しくは
    [サンドボックス化された環境変数](/ja-JP/tools/skills-config#sandboxed-skills-and-env-vars)を参照してください。

  </Accordion>
</AccordionGroup>

## Skill Workshop 経由で提案する

エージェントが下書きしたスキル、またはスキルを有効化する前にオペレーターのレビューを行いたい場合は、
`SKILL.md` を直接書く代わりに [Skill Workshop](/ja-JP/tools/skill-workshop) の提案を使用します。

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

提案にサポートファイルが含まれる場合は `--proposal-dir` を使用します。

```bash
openclaw skills workshop propose-create \
  --name "hello-world" \
  --description "A simple skill that prints a greeting." \
  --proposal-dir ./hello-world-proposal/
```

ディレクトリのルートには `PROPOSAL.md` が含まれている必要があります。サポートファイルは
`assets/`、`examples/`、`references/`、`scripts/`、または `templates/` の下に置きます。

レビュー後:

```bash
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop apply <proposal-id>
```

提案ライフサイクル全体については [Skill Workshop](/ja-JP/tools/skill-workshop) を参照してください。

## ClawHub へ公開する

<Steps>
  <Step title="Ensure your SKILL.md is complete">
    `name`、`description`、および任意の `metadata.openclaw` ゲートフィールドが設定されていることを確認します。
    プロジェクトページがある場合は `homepage` URL を追加します。
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

    推定されたバージョンを上書きするには `--version <version>` を追加し、
    特定の所有者の下で公開するには `--owner <owner>` を追加します。完全なフロー、所有者スコープ、
    その他のメンテナンスコマンド（`clawhub sync`、`clawhub skill rename` など）については、
    [ClawHub — 公開](/ja-JP/clawhub/publishing) と
    [ClawHub CLI](/ja-JP/clawhub/cli) を参照してください。

  </Step>
</Steps>

## ベストプラクティス

<Tip>
  - **簡潔にする** — AI としてどう振る舞うかではなく、モデルに*何を*するかを指示します。
  - **安全を最優先にする** — スキルが `exec` を使用する場合、信頼できない入力から任意のコマンドインジェクションが発生しないようにプロンプトを設計します。
  - **ローカルでテストする** — 共有する前に `openclaw agent --message "..."` を使用します。
  - **ClawHub を使用する** — ゼロから構築する前に、[clawhub.ai](https://clawhub.ai) でコミュニティの Skills を確認します。

</Tip>

## 関連

<CardGroup cols={2}>
  <Card title="Skills reference" href="/ja-JP/tools/skills" icon="puzzle-piece">
    読み込み順序、ゲート、許可リスト、および SKILL.md 形式。
  </Card>
  <Card title="Skill Workshop" href="/ja-JP/tools/skill-workshop" icon="flask">
    エージェントが下書きした Skills の提案キュー。
  </Card>
  <Card title="Skills config" href="/ja-JP/tools/skills-config" icon="gear">
    完全な `skills.*` 設定スキーマ。
  </Card>
  <Card title="ClawHub" href="/clawhub" icon="cloud">
    公開レジストリで Skills を閲覧および公開します。
  </Card>
  <Card title="Building plugins" href="/ja-JP/plugins/building-plugins" icon="plug">
    Plugins は、ドキュメント化するツールと一緒に Skills を同梱できます。
  </Card>
</CardGroup>
