---
read_when:
    - エージェントワークスペースまたはそのファイルレイアウトを説明する必要がある
    - エージェントワークスペースをバックアップまたは移行したい
sidebarTitle: Agent workspace
summary: 'エージェントワークスペース: 場所、レイアウト、バックアップ戦略'
title: Agent ワークスペース
x-i18n:
    generated_at: "2026-06-27T11:06:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6020aa96b2aa829a9684164994d1fb1fb1b31157c47b60e947ad82f9f5508e1c
    source_path: concepts/agent-workspace.md
    workflow: 16
---

ワークスペースはエージェントのホームです。これはファイルツールとワークスペースコンテキストに使われる唯一の作業ディレクトリです。非公開に保ち、メモリとして扱ってください。

これは、設定、認証情報、セッションを保存する `~/.openclaw/` とは別です。

<Warning>
ワークスペースは**デフォルトの cwd**であり、強固なサンドボックスではありません。ツールは相対パスをワークスペース基準で解決しますが、サンドボックス化が有効でない限り、絶対パスはホスト上の別の場所にも到達できます。分離が必要な場合は、[`agents.defaults.sandbox`](/ja-JP/gateway/sandboxing)（および/またはエージェントごとのサンドボックス設定）を使用してください。

サンドボックス化が有効で、`workspaceAccess` が `"rw"` でない場合、ツールはホストのワークスペースではなく、`~/.openclaw/sandboxes` の下にあるサンドボックスワークスペース内で動作します。
</Warning>

## デフォルトの場所

- デフォルト: `~/.openclaw/workspace`
- `OPENCLAW_PROFILE` が設定され、かつ `"default"` でない場合、デフォルトは `~/.openclaw/workspace-<profile>` になります。
- `~/.openclaw/openclaw.json` で上書きします:

```json5
{
  agents: {
    defaults: {
      workspace: "~/.openclaw/workspace",
    },
  },
}
```

`openclaw onboard`、`openclaw configure`、または `openclaw setup` は、ワークスペースを作成し、不足している場合はブートストラップファイルを初期配置します。

<Note>
サンドボックスのシードコピーは、ワークスペース内の通常ファイルのみを受け付けます。ソースワークスペースの外側に解決されるシンボリックリンク/ハードリンクのエイリアスは無視されます。
</Note>

ワークスペースファイルをすでに自分で管理している場合は、ブートストラップファイルの作成を無効にできます:

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## 追加のワークスペースフォルダー

古いインストールでは `~/openclaw` が作成されている場合があります。複数のワークスペースディレクトリを残しておくと、同時にアクティブになるワークスペースは 1 つだけであるため、認証や状態のずれで混乱することがあります。

<Note>
**推奨:** アクティブなワークスペースは 1 つだけにしてください。追加フォルダーをもう使っていない場合は、アーカイブするかゴミ箱に移動してください（例: `trash ~/openclaw`）。意図的に複数のワークスペースを保持する場合は、`agents.defaults.workspace` がアクティブなものを指していることを確認してください。

`openclaw doctor` は、追加のワークスペースディレクトリを検出すると警告します。
</Note>

## ワークスペースファイルマップ

これらは、OpenClaw がワークスペース内にあることを想定する標準ファイルです:

<AccordionGroup>
  <Accordion title="AGENTS.md - operating instructions">
    エージェントの操作指示と、メモリの使い方です。各セッションの開始時に読み込まれます。ルール、優先順位、「どう振る舞うか」の詳細を書くのに適しています。
  </Accordion>
  <Accordion title="SOUL.md - persona and tone">
    ペルソナ、トーン、境界です。各セッションで読み込まれます。ガイド: [SOUL.md パーソナリティガイド](/ja-JP/concepts/soul)。
  </Accordion>
  <Accordion title="USER.md - who the user is">
    ユーザーが誰で、どのように呼びかけるかです。各セッションで読み込まれます。
  </Accordion>
  <Accordion title="IDENTITY.md - name, vibe, emoji">
    エージェントの名前、雰囲気、絵文字です。ブートストラップ儀式中に作成/更新されます。
  </Accordion>
  <Accordion title="TOOLS.md - local tool conventions">
    ローカルツールと規約に関するメモです。ツールの利用可否は制御せず、単なるガイダンスです。
  </Accordion>
  <Accordion title="HEARTBEAT.md - heartbeat checklist">
    Heartbeat 実行用の任意の小さなチェックリストです。トークン消費を避けるため短く保ってください。
  </Accordion>
  <Accordion title="BOOT.md - startup checklist">
    Gateway の再起動時に自動実行される任意の起動チェックリストです（[内部フック](/ja-JP/automation/hooks)が有効な場合）。短く保ち、外向き送信には message ツールを使ってください。
  </Accordion>
  <Accordion title="BOOTSTRAP.md - first-run ritual">
    初回実行時だけの儀式です。新規ワークスペースにのみ作成されます。儀式が完了したら削除してください。
  </Accordion>
  <Accordion title="memory/YYYY-MM-DD.md - daily memory log">
    日次メモリログ（1 日につき 1 ファイル）です。セッション開始時に今日と昨日を読むことを推奨します。
  </Accordion>
  <Accordion title="MEMORY.md - curated long-term memory (optional)">
    整理された長期メモリ: 永続的な事実、好み、決定、短い要約です。詳細なログは `memory/YYYY-MM-DD.md` に保持し、メモリツールが必要に応じて取得できるようにしてください。各プロンプトへ注入しないためです。`MEMORY.md` はメインの非公開セッションでのみ読み込みます（共有/グループコンテキストでは読み込まない）。ワークフローと自動メモリフラッシュについては [メモリ](/ja-JP/concepts/memory) を参照してください。
  </Accordion>
  <Accordion title="skills/ - workspace skills (optional)">
    ワークスペース固有の Skills です。そのワークスペースで最も優先度の高い Skill の場所です。名前が衝突した場合、プロジェクトエージェントの Skills、個人エージェントの Skills、管理対象 Skills、同梱 Skills、`skills.load.extraDirs` を上書きします。
  </Accordion>
  <Accordion title="canvas/ - Canvas UI files (optional)">
    ノード表示用の Canvas UI ファイルです（例: `canvas/index.html`）。
  </Accordion>
</AccordionGroup>

<Note>
ブートストラップファイルが不足している場合、OpenClaw は「missing file」マーカーをセッションに注入して続行します。大きなブートストラップファイルは注入時に切り詰められます。制限は `agents.defaults.bootstrapMaxChars`（デフォルト: 20000）と `agents.defaults.bootstrapTotalMaxChars`（デフォルト: 60000）で調整してください。`openclaw setup` は既存ファイルを上書きせずに、不足しているデフォルトを再作成できます。
</Note>

## ワークスペースに含まれないもの

これらは `~/.openclaw/` の下にあり、ワークスペースリポジトリへコミットしてはいけません:

- `~/.openclaw/openclaw.json`（設定）
- `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`（モデル認証プロファイル: OAuth + API キー）
- `~/.openclaw/agents/<agentId>/agent/codex-home/`（エージェントごとの Codex ランタイムアカウント、設定、Skills、Plugin、ネイティブスレッド状態）
- `~/.openclaw/credentials/`（チャンネル/プロバイダー状態とレガシー OAuth インポートデータ）
- `~/.openclaw/agents/<agentId>/sessions/`（セッション文字起こし + メタデータ）
- `~/.openclaw/skills/`（管理対象 Skills）

セッションや設定を移行する必要がある場合は、別途コピーし、バージョン管理の対象外にしてください。

## Git バックアップ（推奨、非公開）

ワークスペースを非公開メモリとして扱ってください。バックアップと復元ができるよう、**private** git リポジトリに入れてください。

これらの手順は、Gateway が動作するマシン（つまりワークスペースが存在する場所）で実行します。

<Steps>
  <Step title="Initialize the repo">
    git がインストールされている場合、新規ワークスペースは自動的に初期化されます。このワークスペースがまだリポジトリでない場合は、次を実行します:

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
        1. GitHub で新しい **private** リポジトリを作成します。
        2. README で初期化しないでください（マージ競合を避けるため）。
        3. HTTPS リモート URL をコピーします。
        4. リモートを追加して push します:

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
        1. GitLab で新しい **private** リポジトリを作成します。
        2. README で初期化しないでください（マージ競合を避けるため）。
        3. HTTPS リモート URL をコピーします。
        4. リモートを追加して push します:

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
private リポジトリであっても、ワークスペースにシークレットを保存するのは避けてください:

- API キー、OAuth トークン、パスワード、または private 認証情報。
- `~/.openclaw/` 配下のもの。
- チャットや機密性の高い添付ファイルの生ダンプ。

機密性の高い参照を保存する必要がある場合は、プレースホルダーを使い、実際のシークレットは別の場所（パスワードマネージャー、環境変数、または `~/.openclaw/`）に保管してください。
</Warning>

推奨される `.gitignore` スターター:

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
    リポジトリを目的のパス（デフォルトは `~/.openclaw/workspace`）に clone します。
  </Step>
  <Step title="Update config">
    `~/.openclaw/openclaw.json` で `agents.defaults.workspace` をそのパスに設定します。
  </Step>
  <Step title="Seed missing files">
    不足しているファイルをシードするには、`openclaw setup --workspace <path>` を実行します。
  </Step>
  <Step title="Copy sessions (optional)">
    セッションが必要な場合は、古いマシンから `~/.openclaw/agents/<agentId>/sessions/` を別途コピーします。
  </Step>
</Steps>

## 高度なメモ

- マルチエージェントルーティングでは、エージェントごとに異なるワークスペースを使用できます。ルーティング設定については [チャンネルルーティング](/ja-JP/channels/channel-routing) を参照してください。
- `agents.defaults.sandbox` が有効な場合、メイン以外のセッションは `agents.defaults.sandbox.workspaceRoot` 配下のセッションごとのサンドボックスワークスペースを使用できます。

## 関連

- [Heartbeat](/ja-JP/gateway/heartbeat) - HEARTBEAT.md ワークスペースファイル
- [サンドボックス化](/ja-JP/gateway/sandboxing) - サンドボックス化された環境でのワークスペースアクセス
- [セッション](/ja-JP/concepts/session) - セッション保存パス
- [永続指示](/ja-JP/automation/standing-orders) - ワークスペースファイル内の永続的な指示
