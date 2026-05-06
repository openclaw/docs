---
read_when:
    - エージェントのワークスペースまたはそのファイルレイアウトを説明する必要がある
    - エージェントワークスペースをバックアップまたは移行したい場合
sidebarTitle: Agent workspace
summary: 'エージェントワークスペース: 場所、レイアウト、バックアップ戦略'
title: エージェントワークスペース
x-i18n:
    generated_at: "2026-05-06T04:59:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: be5c4c55f3cda5dcf6b763f8e59fa926283cee18270a58dbd62593947a55e67c
    source_path: concepts/agent-workspace.md
    workflow: 16
---

ワークスペースはエージェントのホームです。これはファイルツールとワークスペースコンテキストに使われる唯一の作業ディレクトリです。非公開に保ち、メモリとして扱ってください。

これは設定、認証情報、セッションを保存する `~/.openclaw/` とは別です。

<Warning>
ワークスペースは**デフォルトのcwd**であり、強制的なサンドボックスではありません。ツールは相対パスをワークスペース基準で解決しますが、サンドボックス化が有効でない限り、絶対パスではホスト上の別の場所にも到達できます。分離が必要な場合は、[`agents.defaults.sandbox`](/ja-JP/gateway/sandboxing)（および必要に応じてエージェントごとのサンドボックス設定）を使用してください。

サンドボックス化が有効で、`workspaceAccess` が `"rw"` でない場合、ツールはホストのワークスペースではなく、`~/.openclaw/sandboxes` 配下のサンドボックスワークスペース内で動作します。
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

`openclaw onboard`、`openclaw configure`、または `openclaw setup` は、ワークスペースを作成し、不足している場合はブートストラップファイルを配置します。

<Note>
サンドボックスのシードコピーは、ワークスペース内の通常ファイルのみを受け付けます。ソースワークスペース外へ解決されるシンボリックリンクやハードリンクのエイリアスは無視されます。
</Note>

ワークスペースファイルを自分で管理している場合は、ブートストラップファイルの作成を無効にできます:

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## 追加のワークスペースフォルダ

古いインストールでは `~/openclaw` が作成されている場合があります。複数のワークスペースディレクトリを残しておくと、一度に有効なのは1つのワークスペースだけであるため、認証や状態のずれが分かりにくくなることがあります。

<Note>
**推奨:** 有効なワークスペースは1つだけにしてください。追加フォルダをもう使っていない場合は、アーカイブするかゴミ箱へ移動してください（例: `trash ~/openclaw`）。意図的に複数のワークスペースを保持する場合は、`agents.defaults.workspace` が有効なものを指していることを確認してください。

`openclaw doctor` は、追加のワークスペースディレクトリを検出すると警告します。
</Note>

## ワークスペースファイルマップ

これらは OpenClaw がワークスペース内に期待する標準ファイルです:

<AccordionGroup>
  <Accordion title="AGENTS.md - 操作指示">
    エージェントの操作指示と、メモリの使い方です。各セッションの開始時に読み込まれます。ルール、優先事項、「どう振る舞うか」の詳細を書くのに適した場所です。
  </Accordion>
  <Accordion title="SOUL.md - ペルソナとトーン">
    ペルソナ、トーン、境界です。各セッションで読み込まれます。ガイド: [SOUL.md パーソナリティガイド](/ja-JP/concepts/soul)。
  </Accordion>
  <Accordion title="USER.md - ユーザーについて">
    ユーザーが誰で、どのように呼びかけるかです。各セッションで読み込まれます。
  </Accordion>
  <Accordion title="IDENTITY.md - 名前、雰囲気、絵文字">
    エージェントの名前、雰囲気、絵文字です。ブートストラップ儀式中に作成または更新されます。
  </Accordion>
  <Accordion title="TOOLS.md - ローカルツールの規約">
    ローカルツールと規約に関するメモです。ツールの利用可否は制御せず、ガイダンスのみです。
  </Accordion>
  <Accordion title="HEARTBEAT.md - Heartbeatチェックリスト">
    Heartbeat実行用の任意の小さなチェックリストです。トークン消費を避けるため短くしてください。
  </Accordion>
  <Accordion title="BOOT.md - 起動チェックリスト">
    Gateway再起動時に自動実行される任意の起動チェックリストです（[内部フック](/ja-JP/automation/hooks)が有効な場合）。短くしてください。外部送信にはメッセージツールを使用してください。
  </Accordion>
  <Accordion title="BOOTSTRAP.md - 初回実行儀式">
    1回限りの初回実行儀式です。新しいワークスペースの場合のみ作成されます。儀式が完了したら削除してください。
  </Accordion>
  <Accordion title="memory/YYYY-MM-DD.md - 日次メモリログ">
    日次メモリログ（1日につき1ファイル）です。セッション開始時に今日と昨日を読むことを推奨します。
  </Accordion>
  <Accordion title="MEMORY.md - キュレーション済み長期メモリ（任意）">
    キュレーション済み長期メモリです。メインの非公開セッションでのみ読み込んでください（共有またはグループコンテキストでは読み込まないでください）。ワークフローと自動メモリフラッシュについては、[Memory](/ja-JP/concepts/memory)を参照してください。
  </Accordion>
  <Accordion title="skills/ - ワークスペースSkills（任意）">
    ワークスペース固有のSkillsです。そのワークスペースで最も優先されるスキル場所です。名前が衝突した場合は、プロジェクトエージェントSkills、個人エージェントSkills、管理対象Skills、バンドルSkills、`skills.load.extraDirs` を上書きします。
  </Accordion>
  <Accordion title="canvas/ - Canvas UIファイル（任意）">
    ノード表示用の Canvas UIファイルです（例: `canvas/index.html`）。
  </Accordion>
</AccordionGroup>

<Note>
ブートストラップファイルが不足している場合、OpenClaw は「missing file」マーカーをセッションに注入して続行します。大きなブートストラップファイルは注入時に切り詰められます。制限は `agents.defaults.bootstrapMaxChars`（デフォルト: 12000）と `agents.defaults.bootstrapTotalMaxChars`（デフォルト: 60000）で調整してください。`openclaw setup` は、既存ファイルを上書きせずに不足しているデフォルトを再作成できます。
</Note>

## ワークスペースに含まれないもの

これらは `~/.openclaw/` 配下にあり、ワークスペースリポジトリへコミットしてはいけません:

- `~/.openclaw/openclaw.json`（設定）
- `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`（モデル認証プロファイル: OAuth + APIキー）
- `~/.openclaw/agents/<agentId>/agent/codex-home/`（エージェントごとの Codex ランタイムアカウント、設定、Skills、plugins、ネイティブスレッド状態）
- `~/.openclaw/credentials/`（チャンネルまたはプロバイダー状態とレガシーOAuthインポートデータ）
- `~/.openclaw/agents/<agentId>/sessions/`（セッショントランスクリプトとメタデータ）
- `~/.openclaw/skills/`（管理対象Skills）

セッションや設定を移行する必要がある場合は、別途コピーし、バージョン管理には含めないでください。

## Gitバックアップ（推奨、非公開）

ワークスペースは非公開メモリとして扱ってください。バックアップと復元ができるように、**非公開** gitリポジトリに入れてください。

これらの手順は、Gateway が実行されているマシン（ワークスペースが存在する場所）で実行します。

<Steps>
  <Step title="リポジトリを初期化する">
    git がインストールされている場合、新しいワークスペースは自動的に初期化されます。このワークスペースがまだリポジトリでない場合は、次を実行します:

    ```bash
    cd ~/.openclaw/workspace
    git init
    git add AGENTS.md SOUL.md TOOLS.md IDENTITY.md USER.md HEARTBEAT.md memory/
    git commit -m "Add agent workspace"
    ```

  </Step>
  <Step title="非公開リモートを追加する">
    <Tabs>
      <Tab title="GitHubのウェブUI">
        1. GitHubで新しい**非公開**リポジトリを作成します。
        2. READMEで初期化しないでください（マージコンフリクトを避けるため）。
        3. HTTPSリモートURLをコピーします。
        4. リモートを追加してプッシュします:

        ```bash
        git branch -M main
        git remote add origin <https-url>
        git push -u origin main
        ```
      </Tab>
      <Tab title="GitHub CLI（gh）">
        ```bash
        gh auth login
        gh repo create openclaw-workspace --private --source . --remote origin --push
        ```
      </Tab>
      <Tab title="GitLabのウェブUI">
        1. GitLabで新しい**非公開**リポジトリを作成します。
        2. READMEで初期化しないでください（マージコンフリクトを避けるため）。
        3. HTTPSリモートURLをコピーします。
        4. リモートを追加してプッシュします:

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
非公開リポジトリでも、ワークスペースにシークレットを保存することは避けてください:

- APIキー、OAuthトークン、パスワード、または非公開の認証情報。
- `~/.openclaw/` 配下のもの。
- チャットや機密性の高い添付ファイルの生データダンプ。

機密性の高い参照を保存する必要がある場合は、プレースホルダーを使用し、本物のシークレットは別の場所（パスワードマネージャー、環境変数、または `~/.openclaw/`）に保持してください。
</Warning>

推奨される `.gitignore` のスターター:

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
    リポジトリを希望のパス（デフォルトは `~/.openclaw/workspace`）へクローンします。
  </Step>
  <Step title="設定を更新する">
    `~/.openclaw/openclaw.json` で `agents.defaults.workspace` をそのパスに設定します。
  </Step>
  <Step title="不足ファイルをシードする">
    `openclaw setup --workspace <path>` を実行して、不足しているファイルをシードします。
  </Step>
  <Step title="セッションをコピーする（任意）">
    セッションが必要な場合は、古いマシンから `~/.openclaw/agents/<agentId>/sessions/` を別途コピーします。
  </Step>
</Steps>

## 高度なメモ

- マルチエージェントルーティングでは、エージェントごとに異なるワークスペースを使用できます。ルーティング設定については、[チャンネルルーティング](/ja-JP/channels/channel-routing)を参照してください。
- `agents.defaults.sandbox` が有効な場合、メイン以外のセッションは `agents.defaults.sandbox.workspaceRoot` 配下のセッションごとのサンドボックスワークスペースを使用できます。

## 関連

- [Heartbeat](/ja-JP/gateway/heartbeat) - HEARTBEAT.md ワークスペースファイル
- [サンドボックス化](/ja-JP/gateway/sandboxing) - サンドボックス環境でのワークスペースアクセス
- [セッション](/ja-JP/concepts/session) - セッション保存パス
- [常設指示](/ja-JP/automation/standing-orders) - ワークスペースファイル内の永続的な指示
