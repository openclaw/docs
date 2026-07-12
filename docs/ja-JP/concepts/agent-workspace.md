---
read_when:
    - エージェントワークスペースまたはそのファイル構成について説明する必要がある場合
    - エージェントのワークスペースをバックアップまたは移行したい場合
sidebarTitle: Agent workspace
summary: エージェントワークスペース：場所、構成、バックアップ戦略
title: エージェントワークスペース
x-i18n:
    generated_at: "2026-07-12T14:24:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: e09c26d19dd7926b379ae4d094c98c2a2f5b37b9453a4cc2048c3b212ae5a9c2
    source_path: concepts/agent-workspace.md
    workflow: 16
---

ワークスペースはエージェントのホームです。ファイルツールとワークスペースコンテキストで使用される作業ディレクトリです。非公開に保ち、メモリとして扱ってください。

これは、設定、認証情報、セッションを保存する `~/.openclaw/` とは別のものです。

<Warning>
ワークスペースは**デフォルトの cwd** であり、厳密なサンドボックスではありません。ツールはワークスペースを基準に相対パスを解決しますが、サンドボックス化が有効でない限り、絶対パスを使用するとホスト上の別の場所にもアクセスできます。分離が必要な場合は、[`agents.defaults.sandbox`](/ja-JP/gateway/sandboxing)（および必要に応じてエージェントごとのサンドボックス設定）を使用してください。

サンドボックス化が有効で、`workspaceAccess` が `"rw"` でない場合、ツールはホストのワークスペースではなく、`~/.openclaw/sandboxes` 配下のサンドボックスワークスペース内で動作します。
</Warning>

## デフォルトの場所

- デフォルト: `~/.openclaw/workspace`
- `OPENCLAW_PROFILE` が設定され、かつ `"default"` でない場合、デフォルトは `~/.openclaw/workspace-<profile>` になります。
- `OPENCLAW_WORKSPACE_DIR` が設定されている場合、上記の両方より優先されます。
- ワークスペースが明示されていない非デフォルトエージェント（`agents.list[]`）は、共有のデフォルトワークスペースではなく、`<state-dir>/workspace-<agentId>` に解決されます。

`~/.openclaw/openclaw.json` で上書きします。

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

`openclaw onboard`、`openclaw configure`、または `openclaw setup` は、ワークスペースを作成し、ブートストラップファイルがない場合は初期ファイルを配置します。

<Note>
サンドボックスへの初期ファイルのコピーでは、ワークスペース内の通常ファイルのみが受け入れられます。ソースワークスペース外を参照するシンボリックリンクやハードリンクのエイリアスは無視されます。
</Note>

ワークスペースファイルをすでに自分で管理している場合は、ブートストラップファイルの作成を無効にします。

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## 追加のワークスペースフォルダー

古いインストールでは、`~/openclaw` が作成されている場合があります。複数のワークスペースディレクトリを残しておくと、一度にアクティブになるワークスペースは1つだけであるため、認証や状態のずれが分かりにくくなることがあります。

<Note>
**推奨:** アクティブなワークスペースは1つだけにしてください。追加のフォルダーを使用しなくなった場合は、アーカイブするかゴミ箱に移動してください（例: `trash ~/openclaw`）。複数のワークスペースを意図的に保持する場合は、`agents.defaults.workspace`（またはエージェントごとの `workspace` キー）がアクティブなワークスペースを指していることを確認してください。
</Note>

## ワークスペースファイルマップ

OpenClaw がワークスペース内に存在することを想定する標準ファイル:

<AccordionGroup>
  <Accordion title="AGENTS.md - 運用指示">
    エージェントの運用指示と、メモリの使用方法です。各セッションの開始時に読み込まれます。ルール、優先事項、「どのように振る舞うか」の詳細を記述するのに適しています。
  </Accordion>
  <Accordion title="SOUL.md - ペルソナと口調">
    ペルソナ、口調、境界です。各セッションで読み込まれます。ガイド: [SOUL.md パーソナリティガイド](/ja-JP/concepts/soul)。
  </Accordion>
  <Accordion title="USER.md - ユーザーについて">
    ユーザーが誰であり、どのように呼びかけるかを記述します。各セッションで読み込まれます。
  </Accordion>
  <Accordion title="IDENTITY.md - 名前、雰囲気、絵文字">
    エージェントの名前、雰囲気、絵文字です。ブートストラップの手順中に作成または更新されます。
  </Accordion>
  <Accordion title="TOOLS.md - ローカルツールの規約">
    ローカルツールと規約に関するメモです。ツールの利用可否は制御せず、ガイダンスとしてのみ機能します。
  </Accordion>
  <Accordion title="HEARTBEAT.md - Heartbeat チェックリスト">
    Heartbeat 実行用の省略可能な小さなチェックリストです。トークン消費を避けるため、短く保ってください。
  </Accordion>
  <Accordion title="BOOT.md - 起動チェックリスト">
    Gateway の再起動時に自動実行される、省略可能な起動チェックリストです（[内部フック](/ja-JP/automation/hooks)が有効な場合）。短く保ち、外部への送信にはメッセージツールを使用してください。
  </Accordion>
  <Accordion title="BOOTSTRAP.md - 初回実行手順">
    一度だけ行う初回実行手順です。新規ワークスペースにのみ作成されます。手順の完了後に削除してください。
  </Accordion>
  <Accordion title="memory/YYYY-MM-DD.md - 日次メモリログ">
    日次メモリログ（1日につき1ファイル）です。セッション開始時に今日と昨日のファイルを読むことを推奨します。
  </Accordion>
  <Accordion title="MEMORY.md - 整理された長期メモリ（省略可能）">
    整理された長期メモリです。永続的な事実、設定、決定、短い要約を保存します。詳細なログは `memory/YYYY-MM-DD.md` に保持すると、メモリツールがすべてのプロンプトへ挿入せず、必要に応じて取得できます。`MEMORY.md` はメインの非公開セッションでのみ読み込んでください（共有またはグループコンテキストでは読み込まないでください）。ワークフローとメモリの自動フラッシュについては、[メモリ](/ja-JP/concepts/memory)を参照してください。
  </Accordion>
  <Accordion title="skills/ - ワークスペースの Skills（省略可能）">
    ワークスペース固有の Skills です。名前が競合する場合、そのワークスペースで最も優先順位の高い Skills の場所となり、プロジェクトのエージェント Skills、個人のエージェント Skills、管理対象 Skills、同梱 Skills、および `skills.load.extraDirs` より優先されます。
  </Accordion>
  <Accordion title="canvas/ - Canvas UI ファイル（省略可能）">
    Node 表示用の Canvas UI ファイルです（例: `canvas/index.html`）。
  </Accordion>
</AccordionGroup>

<Note>
ブートストラップファイルがない場合、OpenClaw は「ファイルがありません」というマーカーをセッションに挿入して処理を続行します。大きなブートストラップファイルは挿入時に切り詰められます。制限は `agents.defaults.bootstrapMaxChars`（デフォルト: `20000`）と `agents.defaults.bootstrapTotalMaxChars`（デフォルト: `60000`）で調整できます。`openclaw setup` は、既存ファイルを上書きせずに不足しているデフォルトファイルを再作成できます。
</Note>

## ワークスペースに含まれないもの

以下は `~/.openclaw/` 配下にあり、ワークスペースのリポジトリへコミットしてはいけません。

- `~/.openclaw/openclaw.json`（設定）
- `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`（モデル認証プロファイル: OAuth + API キー）
- `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`（セッション行、トランスクリプト、エージェントごとのランタイム状態）
- `~/.openclaw/agents/<agentId>/agent/codex-home/`（エージェントごとの Codex ランタイムアカウント、設定、Skills、Plugin、ネイティブスレッド状態）
- `~/.openclaw/credentials/`（チャンネル/プロバイダーの状態と、レガシー OAuth インポートデータ）
- `~/.openclaw/agents/<agentId>/sessions/`（レガシーマイグレーション元とアーカイブ/サポート成果物）
- `~/.openclaw/skills/`（管理対象 Skills）

セッションまたは設定を移行する必要がある場合は、個別にコピーし、バージョン管理の対象外にしてください。

## Git バックアップ（推奨、非公開）

ワークスペースを非公開メモリとして扱ってください。バックアップと復元ができるよう、**非公開**の git リポジトリに保存してください。

以下の手順は、Gateway が動作しているマシン（ワークスペースが存在する場所）で実行してください。

<Steps>
  <Step title="リポジトリを初期化する">
    git がインストールされている場合、新しいワークスペースは自動的に初期化されます。このワークスペースがまだリポジトリでない場合は、次を実行します。

    ```bash
    cd ~/.openclaw/workspace
    git init
    git add AGENTS.md SOUL.md TOOLS.md IDENTITY.md USER.md HEARTBEAT.md memory/
    git commit -m "Add agent workspace"
    ```

  </Step>
  <Step title="非公開リモートを追加する">
    <Tabs>
      <Tab title="GitHub web UI">
        1. GitHub で新しい**非公開**リポジトリを作成します。
        2. README で初期化しないでください（マージ競合を避けるため）。
        3. HTTPS リモート URL をコピーします。
        4. リモートを追加してプッシュします。

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
        4. リモートを追加してプッシュします。

        ```bash
        git branch -M main
        git remote add origin <https-url>
        git push -u origin main
        ```
      </Tab>
    </Tabs>

  </Step>
  <Step title="継続的な更新">
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
非公開リポジトリであっても、ワークスペースにシークレットを保存しないでください。

- API キー、OAuth トークン、パスワード、または非公開の認証情報。
- `~/.openclaw/` 配下のすべてのもの。
- チャットの生データや機密性の高い添付ファイル。

機密情報への参照を保存する必要がある場合は、プレースホルダーを使用し、実際のシークレットは別の場所（パスワードマネージャー、環境変数、または `~/.openclaw/`）に保管してください。
</Warning>

推奨される `.gitignore` の初期例:

```gitignore
.DS_Store
.env
**/*.key
**/*.pem
**/secrets*
```

## ワークスペースを新しいマシンへ移動する

<Steps>
  <Step title="リポジトリをクローンする">
    リポジトリを目的のパス（デフォルトは `~/.openclaw/workspace`）にクローンします。
  </Step>
  <Step title="設定を更新する">
    `~/.openclaw/openclaw.json` で、`agents.defaults.workspace` をそのパスに設定します。
  </Step>
  <Step title="不足しているファイルを配置する">
    `openclaw setup --workspace <path>` を実行し、不足しているファイルを配置します。
  </Step>
  <Step title="セッションをコピーする（省略可能）">
    セッションが必要な場合は、古いマシンから `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`
    を個別にコピーします。`~/.openclaw/agents/<agentId>/sessions/` は、
    レガシーマイグレーション入力またはアーカイブ/サポート成果物も必要な場合にのみコピーしてください。
  </Step>
</Steps>

## 高度な注意事項

- マルチエージェントルーティングでは、`agents.list[].workspace` を介してエージェントごとに異なるワークスペースを使用できます。ルーティング設定については、[チャンネルルーティング](/ja-JP/channels/channel-routing)を参照してください。
- `agents.defaults.sandbox` が有効な場合、メイン以外のセッションでは、`agents.defaults.sandbox.workspaceRoot` 配下のセッションごとのサンドボックスワークスペースを使用できます。

## 関連項目

- [Heartbeat](/ja-JP/gateway/heartbeat) - HEARTBEAT.md ワークスペースファイル
- [サンドボックス化](/ja-JP/gateway/sandboxing) - サンドボックス環境でのワークスペースアクセス
- [セッション](/ja-JP/concepts/session) - セッション保存パス
- [常設指示](/ja-JP/automation/standing-orders) - ワークスペースファイル内の永続的な指示
