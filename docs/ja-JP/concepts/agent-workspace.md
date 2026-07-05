---
read_when:
    - エージェントワークスペースまたはそのファイルレイアウトを説明する必要がある
    - エージェントワークスペースをバックアップまたは移行したい場合
sidebarTitle: Agent workspace
summary: 'エージェントワークスペース: 場所、レイアウト、バックアップ戦略'
title: エージェントワークスペース
x-i18n:
    generated_at: "2026-07-05T11:15:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a66c441267e306176e4e52c639892dae4a4363729ac647fedf7f946d189ce1b3
    source_path: concepts/agent-workspace.md
    workflow: 16
---

ワークスペースはエージェントのホームです。ファイルツールとワークスペースコンテキストに使われる作業ディレクトリです。非公開に保ち、メモリとして扱ってください。

これは、設定、認証情報、セッションを保存する `~/.openclaw/` とは別です。

<Warning>
ワークスペースは**デフォルトの cwd**であり、強いサンドボックスではありません。ツールは相対パスをワークスペース基準で解決しますが、サンドボックス化が有効でない限り、絶対パスはホスト上の別の場所にも到達できます。分離が必要な場合は、[`agents.defaults.sandbox`](/ja-JP/gateway/sandboxing)（および/またはエージェントごとのサンドボックス設定）を使用してください。

サンドボックス化が有効で、`workspaceAccess` が `"rw"` でない場合、ツールはホストのワークスペースではなく、`~/.openclaw/sandboxes` 配下のサンドボックスワークスペース内で動作します。
</Warning>

## デフォルトの場所

- デフォルト: `~/.openclaw/workspace`
- `OPENCLAW_PROFILE` が設定されていて `"default"` でない場合、デフォルトは `~/.openclaw/workspace-<profile>` になります。
- `OPENCLAW_WORKSPACE_DIR` が設定されている場合、上記の両方を上書きします。
- 明示的なワークスペースがない非デフォルトエージェント（`agents.list[]`）は、共有デフォルトワークスペースではなく `<state-dir>/workspace-<agentId>` に解決されます。

`~/.openclaw/openclaw.json` で上書きします:

```json5
{
  agents: {
    defaults: {
      workspace: "~/.openclaw/workspace",
    },
  },
}
```

エージェントごとの上書き: `agents.list[].workspace`。

`openclaw onboard`、`openclaw configure`、または `openclaw setup` は、ワークスペースを作成し、ブートストラップファイルがない場合はそれを配置します。

<Note>
サンドボックスシードコピーは、通常のワークスペース内ファイルのみを受け付けます。ソースワークスペース外に解決されるシンボリックリンク/ハードリンクのエイリアスは無視されます。
</Note>

ワークスペースファイルを自分で管理している場合は、ブートストラップファイルの作成を無効にしてください:

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## 追加のワークスペースフォルダ

古いインストールでは `~/openclaw` が作成されている場合があります。アクティブにできるワークスペースは一度に1つだけなので、複数のワークスペースディレクトリを残しておくと、認証や状態のずれで混乱することがあります。

<Note>
**推奨:** アクティブなワークスペースは1つにしてください。追加フォルダをもう使っていない場合は、アーカイブするかゴミ箱に移動してください（例: `trash ~/openclaw`）。複数のワークスペースを意図的に保持する場合は、`agents.defaults.workspace`（またはエージェントごとの `workspace` キー）がアクティブなものを指していることを確認してください。
</Note>

## ワークスペースファイルマップ

OpenClaw がワークスペース内に想定する標準ファイル:

<AccordionGroup>
  <Accordion title="AGENTS.md - operating instructions">
    エージェントの操作指示と、メモリの使い方です。各セッションの開始時に読み込まれます。ルール、優先事項、「どう振る舞うか」の詳細を書くのに適しています。
  </Accordion>
  <Accordion title="SOUL.md - persona and tone">
    ペルソナ、トーン、境界です。各セッションで読み込まれます。ガイド: [SOUL.md パーソナリティガイド](/ja-JP/concepts/soul)。
  </Accordion>
  <Accordion title="USER.md - who the user is">
    ユーザーが誰で、どう呼びかけるかです。各セッションで読み込まれます。
  </Accordion>
  <Accordion title="IDENTITY.md - name, vibe, emoji">
    エージェントの名前、雰囲気、絵文字です。ブートストラップの儀式中に作成/更新されます。
  </Accordion>
  <Accordion title="TOOLS.md - local tool conventions">
    ローカルツールと規約に関するメモです。ツールの利用可否は制御しません。単なるガイダンスです。
  </Accordion>
  <Accordion title="HEARTBEAT.md - heartbeat checklist">
    Heartbeat 実行用の任意の小さなチェックリストです。トークン消費を避けるため短く保ってください。
  </Accordion>
  <Accordion title="BOOT.md - startup checklist">
    Gateway 再起動時に自動実行される任意の起動チェックリストです（[内部フック](/ja-JP/automation/hooks)が有効な場合）。短く保ち、外向き送信にはメッセージツールを使用してください。
  </Accordion>
  <Accordion title="BOOTSTRAP.md - first-run ritual">
    1回限りの初回実行儀式です。完全に新しいワークスペースにのみ作成されます。儀式が完了したら削除してください。
  </Accordion>
  <Accordion title="memory/YYYY-MM-DD.md - daily memory log">
    日次メモリログ（1日1ファイル）です。セッション開始時に今日と昨日を読むことを推奨します。
  </Accordion>
  <Accordion title="MEMORY.md - curated long-term memory (optional)">
    整理された長期メモリです。永続的な事実、好み、決定、短い要約を含みます。詳細なログは `memory/YYYY-MM-DD.md` に保持し、メモリツールが必要に応じて取得できるようにします。これにより、毎回のプロンプトに注入せずに済みます。`MEMORY.md` はメインの非公開セッションでのみ読み込んでください（共有/グループコンテキストでは読み込まないでください）。ワークフローと自動メモリフラッシュについては [メモリ](/ja-JP/concepts/memory) を参照してください。
  </Accordion>
  <Accordion title="skills/ - workspace skills (optional)">
    ワークスペース固有の Skills です。名前が衝突した場合、そのワークスペースで最も優先度が高い Skills の場所であり、プロジェクトエージェント Skills、個人エージェント Skills、管理対象 Skills、バンドル Skills、`skills.load.extraDirs` よりも優先されます。
  </Accordion>
  <Accordion title="canvas/ - Canvas UI files (optional)">
    ノード表示用の Canvas UI ファイルです（例: `canvas/index.html`）。
  </Accordion>
</AccordionGroup>

<Note>
ブートストラップファイルがない場合、OpenClaw は「見つからないファイル」マーカーをセッションに注入して続行します。大きなブートストラップファイルは注入時に切り詰められます。制限は `agents.defaults.bootstrapMaxChars`（デフォルト: `20000`）と `agents.defaults.bootstrapTotalMaxChars`（デフォルト: `60000`）で調整してください。`openclaw setup` は既存ファイルを上書きせずに、欠落したデフォルトを再作成できます。
</Note>

## ワークスペースに含まれないもの

これらは `~/.openclaw/` 配下にあり、ワークスペースリポジトリにコミットしてはいけません:

- `~/.openclaw/openclaw.json`（設定）
- `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`（モデル認証プロファイル: OAuth + API キー）
- `~/.openclaw/agents/<agentId>/agent/codex-home/`（エージェントごとの Codex ランタイムアカウント、設定、Skills、plugins、ネイティブスレッド状態）
- `~/.openclaw/credentials/`（チャネル/プロバイダー状態とレガシー OAuth インポートデータ）
- `~/.openclaw/agents/<agentId>/sessions/`（セッションのトランスクリプト + メタデータ）
- `~/.openclaw/skills/`（管理対象 Skills）

セッションや設定を移行する必要がある場合は、別途コピーし、バージョン管理には含めないでください。

## Git バックアップ（推奨、非公開）

ワークスペースを非公開メモリとして扱ってください。バックアップと復元ができるように、**非公開** git リポジトリに入れてください。

これらの手順は、Gateway が動作するマシン（つまりワークスペースが存在する場所）で実行します。

<Steps>
  <Step title="Initialize the repo">
    git がインストールされている場合、完全に新しいワークスペースは自動的に初期化されます。このワークスペースがまだリポジトリでない場合は、次を実行してください:

    ```bash
    cd ~/.openclaw/workspace
    git init
    git add AGENTS.md SOUL.md TOOLS.md IDENTITY.md USER.md HEARTBEAT.md memory/
    git commit -m "Add agent workspace"
    ```

  </Step>
  <Step title="Add a private remote">
    <Tabs>
      <Tab title="GitHub web UI">
        1. GitHub で新しい**非公開**リポジトリを作成します。
        2. README で初期化しないでください（マージ競合を避けるため）。
        3. HTTPS リモート URL をコピーします。
        4. リモートを追加してプッシュします:

        ```bash
        git branch -M main
        git remote add origin <https-url>
        git push -u origin main
        ```
      </Tab>
      <Tab title="GitHub CLI (gh)">
        ```bash
        gh auth login
        gh repo create openclaw-workspace --private --source . --remote origin --push
        ```
      </Tab>
      <Tab title="GitLab web UI">
        1. GitLab で新しい**非公開**リポジトリを作成します。
        2. README で初期化しないでください（マージ競合を避けるため）。
        3. HTTPS リモート URL をコピーします。
        4. リモートを追加してプッシュします:

        ```bash
        git branch -M main
        git remote add origin <https-url>
        git push -u origin main
        ```
      </Tab>
    </Tabs>

  </Step>
  <Step title="Ongoing updates">
    ```bash
    git status
    git add .
    git commit -m "Update memory"
    git push
    ```
  </Step>
</Steps>

## シークレットをコミットしない

<Warning>
非公開リポジトリであっても、ワークスペースにシークレットを保存することは避けてください:

- API キー、OAuth トークン、パスワード、または非公開認証情報。
- `~/.openclaw/` 配下のもの。
- チャットや機密性の高い添付ファイルの生ダンプ。

機密性の高い参照を保存する必要がある場合は、プレースホルダーを使い、実際のシークレットは別の場所（パスワードマネージャー、環境変数、または `~/.openclaw/`）に保管してください。
</Warning>

推奨される `.gitignore` の開始例:

```gitignore
.DS_Store
.env
**/*.key
**/*.pem
**/secrets*
```

## ワークスペースを新しいマシンへ移動する

<Steps>
  <Step title="Clone the repo">
    リポジトリを目的のパス（デフォルトは `~/.openclaw/workspace`）にクローンします。
  </Step>
  <Step title="Update config">
    `~/.openclaw/openclaw.json` で `agents.defaults.workspace` をそのパスに設定します。
  </Step>
  <Step title="Seed missing files">
    `openclaw setup --workspace <path>` を実行して、欠落しているファイルを配置します。
  </Step>
  <Step title="Copy sessions (optional)">
    セッションが必要な場合は、古いマシンから `~/.openclaw/agents/<agentId>/sessions/` を別途コピーします。
  </Step>
</Steps>

## 高度なメモ

- マルチエージェントルーティングでは、`agents.list[].workspace` を介してエージェントごとに異なるワークスペースを使用できます。ルーティング設定については [チャネルルーティング](/ja-JP/channels/channel-routing) を参照してください。
- `agents.defaults.sandbox` が有効な場合、メイン以外のセッションは `agents.defaults.sandbox.workspaceRoot` 配下のセッションごとのサンドボックスワークスペースを使用できます。

## 関連

- [Heartbeat](/ja-JP/gateway/heartbeat) - HEARTBEAT.md ワークスペースファイル
- [サンドボックス化](/ja-JP/gateway/sandboxing) - サンドボックス環境でのワークスペースアクセス
- [セッション](/ja-JP/concepts/session) - セッション保存パス
- [常設指示](/ja-JP/automation/standing-orders) - ワークスペースファイル内の永続的な指示
