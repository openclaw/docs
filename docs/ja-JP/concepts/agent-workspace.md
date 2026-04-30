---
read_when:
    - エージェントのワークスペースまたはそのファイル構成を説明する必要がある
    - エージェントワークスペースをバックアップまたは移行したい場合
sidebarTitle: Agent workspace
summary: 'エージェントのワークスペース: 場所、レイアウト、バックアップ戦略'
title: エージェントのワークスペース
x-i18n:
    generated_at: "2026-04-30T20:05:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: b1ccf74cbec3ff20f4c1c1ce52f099a7ca3365b2536b0aad6ff1d3a5fafcca0a
    source_path: concepts/agent-workspace.md
    workflow: 16
---

ワークスペースはエージェントのホームです。ファイルツールとワークスペースコンテキストで使用される唯一の作業ディレクトリです。非公開に保ち、メモリとして扱ってください。

これは、設定、認証情報、セッションを保存する `~/.openclaw/` とは別です。

<Warning>
ワークスペースは**デフォルトの cwd**であり、厳密なサンドボックスではありません。ツールは相対パスをワークスペースを基準に解決しますが、サンドボックスが有効でない限り、絶対パスはホスト上の別の場所にも到達できます。分離が必要な場合は、[`agents.defaults.sandbox`](/ja-JP/gateway/sandboxing)（および/またはエージェントごとのサンドボックス設定）を使用してください。

サンドボックスが有効で、`workspaceAccess` が `"rw"` でない場合、ツールはホストのワークスペースではなく、`~/.openclaw/sandboxes` 配下のサンドボックスワークスペース内で動作します。
</Warning>

## デフォルトの場所

- デフォルト: `~/.openclaw/workspace`
- `OPENCLAW_PROFILE` が設定されていて `"default"` でない場合、デフォルトは `~/.openclaw/workspace-<profile>` になります。
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

`openclaw onboard`、`openclaw configure`、または `openclaw setup` は、ワークスペースを作成し、ブートストラップファイルが存在しない場合はそれらを初期配置します。

<Note>
サンドボックスの初期コピーは、ワークスペース内の通常ファイルのみを受け入れます。ソースワークスペースの外部に解決されるシンボリックリンク/ハードリンクのエイリアスは無視されます。
</Note>

ワークスペースファイルをすでに自分で管理している場合は、ブートストラップファイルの作成を無効にできます:

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## 追加のワークスペースフォルダー

古いインストールでは `~/openclaw` が作成されている場合があります。複数のワークスペースディレクトリを残しておくと、一度に有効なのは1つのワークスペースだけであるため、認証や状態のずれで混乱が生じる可能性があります。

<Note>
**推奨:** 有効なワークスペースは1つだけにしてください。追加のフォルダーをもう使用していない場合は、アーカイブするかゴミ箱に移動してください（例: `trash ~/openclaw`）。意図的に複数のワークスペースを維持する場合は、`agents.defaults.workspace` が有効なものを指していることを確認してください。

`openclaw doctor` は、追加のワークスペースディレクトリを検出すると警告します。
</Note>

## ワークスペースファイルマップ

これらは OpenClaw がワークスペース内にあることを想定する標準ファイルです:

<AccordionGroup>
  <Accordion title="AGENTS.md — 操作指示">
    エージェントの操作指示と、メモリの使い方です。すべてのセッション開始時に読み込まれます。ルール、優先順位、「どのように振る舞うか」の詳細を書くのに適しています。
  </Accordion>
  <Accordion title="SOUL.md — ペルソナとトーン">
    ペルソナ、トーン、境界です。すべてのセッションで読み込まれます。ガイド: [SOUL.md パーソナリティガイド](/ja-JP/concepts/soul)。
  </Accordion>
  <Accordion title="USER.md — ユーザーについて">
    ユーザーが誰で、どのように呼びかけるかです。すべてのセッションで読み込まれます。
  </Accordion>
  <Accordion title="IDENTITY.md — 名前、雰囲気、絵文字">
    エージェントの名前、雰囲気、絵文字です。ブートストラップ儀式中に作成/更新されます。
  </Accordion>
  <Accordion title="TOOLS.md — ローカルツールの慣例">
    ローカルツールと慣例に関するメモです。ツールの利用可否を制御するものではなく、ガイダンスにすぎません。
  </Accordion>
  <Accordion title="HEARTBEAT.md — Heartbeat チェックリスト">
    Heartbeat 実行用の任意の小さなチェックリストです。トークン消費を避けるため短くしてください。
  </Accordion>
  <Accordion title="BOOT.md — 起動チェックリスト">
    Gateway 再起動時に自動実行される任意の起動チェックリストです（[内部フック](/ja-JP/automation/hooks)が有効な場合）。短く保ち、外部送信にはメッセージツールを使用してください。
  </Accordion>
  <Accordion title="BOOTSTRAP.md — 初回実行の儀式">
    1回限りの初回実行の儀式です。完全に新しいワークスペースにのみ作成されます。儀式が完了したら削除してください。
  </Accordion>
  <Accordion title="memory/YYYY-MM-DD.md — 日次メモリログ">
    日次メモリログ（1日につき1ファイル）です。セッション開始時に今日と昨日を読むことを推奨します。
  </Accordion>
  <Accordion title="MEMORY.md — キュレーション済み長期メモリ（任意）">
    キュレーション済みの長期メモリです。メインの非公開セッションでのみ読み込んでください（共有/グループコンテキストでは使用しません）。ワークフローと自動メモリフラッシュについては [Memory](/ja-JP/concepts/memory) を参照してください。
  </Accordion>
  <Accordion title="skills/ — ワークスペース Skills（任意）">
    ワークスペース固有の Skills です。そのワークスペースで最も優先度の高い Skills の場所です。名前が衝突した場合、プロジェクトエージェント Skills、個人エージェント Skills、管理対象 Skills、バンドル済み Skills、および `skills.load.extraDirs` を上書きします。
  </Accordion>
  <Accordion title="canvas/ — Canvas UI ファイル（任意）">
    ノード表示用の Canvas UI ファイルです（例: `canvas/index.html`）。
  </Accordion>
</AccordionGroup>

<Note>
ブートストラップファイルが欠けている場合、OpenClaw は「missing file」マーカーをセッションに挿入して続行します。大きなブートストラップファイルは挿入時に切り詰められます。制限は `agents.defaults.bootstrapMaxChars`（デフォルト: 12000）と `agents.defaults.bootstrapTotalMaxChars`（デフォルト: 60000）で調整してください。`openclaw setup` は、既存ファイルを上書きせずに欠けているデフォルトを再作成できます。
</Note>

## ワークスペースに含まれないもの

これらは `~/.openclaw/` 配下にあり、ワークスペースリポジトリにコミットすべきではありません:

- `~/.openclaw/openclaw.json`（設定）
- `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`（モデル認証プロファイル: OAuth + API キー）
- `~/.openclaw/agents/<agentId>/agent/codex-home/`（エージェントごとの Codex ランタイムアカウント、設定、Skills、plugins、ネイティブスレッド状態）
- `~/.openclaw/credentials/`（チャンネル/プロバイダー状態とレガシー OAuth インポートデータ）
- `~/.openclaw/agents/<agentId>/sessions/`（セッションのトランスクリプト + メタデータ）
- `~/.openclaw/skills/`（管理対象 Skills）

セッションや設定を移行する必要がある場合は、別途コピーし、バージョン管理に含めないでください。

## Git バックアップ（推奨、非公開）

ワークスペースは非公開メモリとして扱ってください。バックアップと復旧ができるよう、**private** git リポジトリに置いてください。

これらの手順は Gateway が動作するマシン上で実行してください（そこにワークスペースがあります）。

<Steps>
  <Step title="リポジトリを初期化する">
    git がインストールされている場合、完全に新しいワークスペースは自動的に初期化されます。このワークスペースがまだリポジトリでない場合は、次を実行します:

    ```bash
    cd ~/.openclaw/workspace
    git init
    git add AGENTS.md SOUL.md TOOLS.md IDENTITY.md USER.md HEARTBEAT.md memory/
    git commit -m "Add agent workspace"
    ```

  </Step>
  <Step title="非公開リモートを追加する">
    <Tabs>
      <Tab title="GitHub Web UI">
        1. GitHub で新しい **private** リポジトリを作成します。
        2. README で初期化しないでください（マージコンフリクトを避けるため）。
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
      <Tab title="GitLab Web UI">
        1. GitLab で新しい **private** リポジトリを作成します。
        2. README で初期化しないでください（マージコンフリクトを避けるため）。
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
private リポジトリであっても、ワークスペースにシークレットを保存することは避けてください:

- API キー、OAuth トークン、パスワード、または非公開認証情報。
- `~/.openclaw/` 配下のあらゆるもの。
- チャットや機密添付ファイルの生ダンプ。

機密参照を保存する必要がある場合は、プレースホルダーを使用し、実際のシークレットは別の場所（パスワードマネージャー、環境変数、または `~/.openclaw/`）に保管してください。
</Warning>

推奨 `.gitignore` スターター:

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
    目的のパス（デフォルトは `~/.openclaw/workspace`）にリポジトリをクローンします。
  </Step>
  <Step title="設定を更新する">
    `~/.openclaw/openclaw.json` で `agents.defaults.workspace` をそのパスに設定します。
  </Step>
  <Step title="欠けているファイルを初期配置する">
    `openclaw setup --workspace <path>` を実行して、欠けているファイルを初期配置します。
  </Step>
  <Step title="セッションをコピーする（任意）">
    セッションが必要な場合は、古いマシンから `~/.openclaw/agents/<agentId>/sessions/` を別途コピーします。
  </Step>
</Steps>

## 詳細メモ

- マルチエージェントルーティングでは、エージェントごとに異なるワークスペースを使用できます。ルーティング設定については [Channel routing](/ja-JP/channels/channel-routing) を参照してください。
- `agents.defaults.sandbox` が有効な場合、メイン以外のセッションは `agents.defaults.sandbox.workspaceRoot` 配下のセッションごとのサンドボックスワークスペースを使用できます。

## 関連

- [Heartbeat](/ja-JP/gateway/heartbeat) — HEARTBEAT.md ワークスペースファイル
- [サンドボックス化](/ja-JP/gateway/sandboxing) — サンドボックス環境でのワークスペースアクセス
- [セッション](/ja-JP/concepts/session) — セッション保存パス
- [常設指示](/ja-JP/automation/standing-orders) — ワークスペースファイル内の永続的な指示
