---
read_when:
    - エージェントのワークスペースまたはそのファイル構成を説明する必要があります
    - エージェントワークスペースをバックアップまたは移行したい場合
sidebarTitle: Agent workspace
summary: 'エージェントワークスペース: 場所、レイアウト、バックアップ戦略'
title: エージェントのワークスペース
x-i18n:
    generated_at: "2026-05-10T19:30:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: adb2ae19c702589010cc67907940ae21feb669cca262e36790a3059aa7d7744c
    source_path: concepts/agent-workspace.md
    workflow: 16
---

ワークスペースはエージェントのホームです。これはファイルツールとワークスペースコンテキストに使われる唯一の作業ディレクトリです。非公開に保ち、メモリとして扱ってください。

これは、設定、認証情報、セッションを保存する `~/.openclaw/` とは別です。

<Warning>
ワークスペースは**デフォルトの cwd** であり、強固なサンドボックスではありません。ツールは相対パスをワークスペースに対して解決しますが、サンドボックス化が有効でない限り、絶対パスはホスト上の他の場所にも到達できます。分離が必要な場合は、[`agents.defaults.sandbox`](/ja-JP/gateway/sandboxing)（および/またはエージェントごとのサンドボックス設定）を使ってください。

サンドボックス化が有効で、`workspaceAccess` が `"rw"` でない場合、ツールはホストのワークスペースではなく、`~/.openclaw/sandboxes` 配下のサンドボックスワークスペース内で動作します。
</Warning>

## デフォルトの場所

- デフォルト: `~/.openclaw/workspace`
- `OPENCLAW_PROFILE` が設定されていて `"default"` でない場合、デフォルトは `~/.openclaw/workspace-<profile>` になります。
- `~/.openclaw/openclaw.json` で上書きします。

```json5
{
  agents: {
    defaults: {
      workspace: "~/.openclaw/workspace",
    },
  },
}
```

`openclaw onboard`、`openclaw configure`、または `openclaw setup` は、ワークスペースを作成し、ブートストラップファイルが欠けている場合はそれらを初期配置します。

<Note>
サンドボックスのシードコピーは、ワークスペース内の通常ファイルだけを受け付けます。ソースワークスペースの外に解決されるシンボリックリンク/ハードリンクのエイリアスは無視されます。
</Note>

ワークスペースファイルをすでに自分で管理している場合は、ブートストラップファイルの作成を無効にできます。

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## 追加のワークスペースフォルダ

古いインストールでは `~/openclaw` が作成されている場合があります。複数のワークスペースディレクトリを残しておくと、一度にアクティブにできるワークスペースは 1 つだけであるため、認証や状態のずれで混乱を招く可能性があります。

<Note>
**推奨:** アクティブなワークスペースは 1 つだけにしてください。追加フォルダをもう使っていない場合は、アーカイブするかゴミ箱に移動します（例: `trash ~/openclaw`）。意図的に複数のワークスペースを保持する場合は、`agents.defaults.workspace` がアクティブなものを指していることを確認してください。

`openclaw doctor` は、追加のワークスペースディレクトリを検出すると警告します。
</Note>

## ワークスペースファイルマップ

これらは、OpenClaw がワークスペース内にあることを想定する標準ファイルです。

<AccordionGroup>
  <Accordion title="AGENTS.md - 操作手順">
    エージェント向けの操作手順と、メモリの使い方です。各セッションの開始時に読み込まれます。ルール、優先順位、「どのように振る舞うか」の詳細を書くのに適しています。
  </Accordion>
  <Accordion title="SOUL.md - ペルソナとトーン">
    ペルソナ、トーン、境界です。各セッションで読み込まれます。ガイド: [SOUL.md パーソナリティガイド](/ja-JP/concepts/soul)。
  </Accordion>
  <Accordion title="USER.md - ユーザーについて">
    ユーザーが誰で、どのように呼びかけるかです。各セッションで読み込まれます。
  </Accordion>
  <Accordion title="IDENTITY.md - 名前、雰囲気、絵文字">
    エージェントの名前、雰囲気、絵文字です。ブートストラップの儀式中に作成/更新されます。
  </Accordion>
  <Accordion title="TOOLS.md - ローカルツールの規約">
    ローカルツールと規約に関するメモです。ツールの利用可否は制御せず、ガイダンスのみです。
  </Accordion>
  <Accordion title="HEARTBEAT.md - Heartbeat チェックリスト">
    Heartbeat 実行用の任意の小さなチェックリストです。トークン消費を避けるため短く保ってください。
  </Accordion>
  <Accordion title="BOOT.md - 起動チェックリスト">
    Gateway 再起動時に自動実行される任意の起動チェックリストです（[内部フック](/ja-JP/automation/hooks) が有効な場合）。短く保ち、外部への送信にはメッセージツールを使ってください。
  </Accordion>
  <Accordion title="BOOTSTRAP.md - 初回実行の儀式">
    一度限りの初回実行の儀式です。新しいワークスペースでのみ作成されます。儀式が完了したら削除してください。
  </Accordion>
  <Accordion title="memory/YYYY-MM-DD.md - 日次メモリログ">
    日次メモリログ（1 日 1 ファイル）です。セッション開始時に今日 + 昨日を読むことを推奨します。
  </Accordion>
  <Accordion title="MEMORY.md - 整理済みの長期メモリ（任意）">
    整理済みの長期メモリ: 永続的な事実、設定、判断、短い要約です。詳細なログは `memory/YYYY-MM-DD.md` に保管し、メモリツールが必要に応じて取得できるようにして、毎回のプロンプトに注入しないようにします。`MEMORY.md` はメインの非公開セッションでのみ読み込みます（共有/グループコンテキストでは読み込みません）。ワークフローと自動メモリフラッシュについては [メモリ](/ja-JP/concepts/memory) を参照してください。
  </Accordion>
  <Accordion title="skills/ - ワークスペース Skills（任意）">
    ワークスペース固有の Skills です。そのワークスペースで最優先されるスキル配置場所です。名前が衝突する場合、プロジェクトエージェント Skills、個人エージェント Skills、管理対象 Skills、バンドル Skills、`skills.load.extraDirs` を上書きします。
  </Accordion>
  <Accordion title="canvas/ - Canvas UI ファイル（任意）">
    ノード表示用の Canvas UI ファイルです（例: `canvas/index.html`）。
  </Accordion>
</AccordionGroup>

<Note>
ブートストラップファイルが欠けている場合、OpenClaw は「missing file」マーカーをセッションに注入して続行します。大きなブートストラップファイルは注入時に切り詰められます。制限は `agents.defaults.bootstrapMaxChars`（デフォルト: 12000）と `agents.defaults.bootstrapTotalMaxChars`（デフォルト: 60000）で調整できます。`openclaw setup` は既存ファイルを上書きせずに、欠けているデフォルトを再作成できます。
</Note>

## ワークスペースに含まれないもの

これらは `~/.openclaw/` 配下にあり、ワークスペースリポジトリにコミットすべきではありません。

- `~/.openclaw/openclaw.json`（設定）
- `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`（モデル認証プロファイル: OAuth + API キー）
- `~/.openclaw/agents/<agentId>/agent/codex-home/`（エージェントごとの Codex ランタイムアカウント、設定、Skills、plugins、ネイティブスレッド状態）
- `~/.openclaw/credentials/`（チャンネル/プロバイダー状態とレガシー OAuth インポートデータ）
- `~/.openclaw/agents/<agentId>/sessions/`（セッショントランスクリプト + メタデータ）
- `~/.openclaw/skills/`（管理対象 Skills）

セッションや設定を移行する必要がある場合は、別途コピーし、バージョン管理の対象外にしてください。

## Git バックアップ（推奨、非公開）

ワークスペースは非公開メモリとして扱います。バックアップと復元ができるよう、**private** git リポジトリに置いてください。

これらの手順は、Gateway が実行されているマシン（ワークスペースが存在する場所）で実行します。

<Steps>
  <Step title="リポジトリを初期化する">
    git がインストールされている場合、新規ワークスペースは自動的に初期化されます。このワークスペースがまだリポジトリでない場合は、次を実行します。

    ```bash
    cd ~/.openclaw/workspace
    git init
    git add AGENTS.md SOUL.md TOOLS.md IDENTITY.md USER.md HEARTBEAT.md memory/
    git commit -m "Add agent workspace"
    ```

  </Step>
  <Step title="private リモートを追加する">
    <Tabs>
      <Tab title="GitHub Web UI">
        1. GitHub で新しい **private** リポジトリを作成します。
        2. README では初期化しないでください（マージコンフリクトを避けるため）。
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
      <Tab title="GitLab Web UI">
        1. GitLab で新しい **private** リポジトリを作成します。
        2. README では初期化しないでください（マージコンフリクトを避けるため）。
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

## 秘密情報をコミットしない

<Warning>
private リポジトリであっても、ワークスペースに秘密情報を保存することは避けてください。

- API キー、OAuth トークン、パスワード、または非公開の認証情報。
- `~/.openclaw/` 配下のものすべて。
- チャットや機密添付ファイルの生ダンプ。

機密参照を保存する必要がある場合は、プレースホルダーを使い、実際の秘密情報は別の場所（パスワードマネージャー、環境変数、または `~/.openclaw/`）に保管してください。
</Warning>

推奨される `.gitignore` スターター:

```gitignore
.DS_Store
.env
**/*.key
**/*.pem
**/secrets*
```

## ワークスペースを新しいマシンに移動する

<Steps>
  <Step title="リポジトリをクローンする">
    目的のパス（デフォルトは `~/.openclaw/workspace`）にリポジトリをクローンします。
  </Step>
  <Step title="設定を更新する">
    `~/.openclaw/openclaw.json` で `agents.defaults.workspace` をそのパスに設定します。
  </Step>
  <Step title="欠けているファイルを初期配置する">
    欠けているファイルを初期配置するには、`openclaw setup --workspace <path>` を実行します。
  </Step>
  <Step title="セッションをコピーする（任意）">
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
- [常設指示](/ja-JP/automation/standing-orders) - ワークスペースファイル内の永続的な指示
