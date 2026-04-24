---
read_when:
    - エージェントワークスペースまたはそのファイルレイアウトを説明する必要がある場合
    - エージェントワークスペースをバックアップまたは移行したい場合
summary: 'Agent workspace: 場所、レイアウト、バックアップ戦略'
title: エージェントワークスペース
x-i18n:
    generated_at: "2026-04-24T04:52:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: d6441991b5f9f71b13b2423d3c36b688a2d7d96386381e610a525aaccd55c9bf
    source_path: concepts/agent-workspace.md
    workflow: 15
---

ワークスペースはエージェントのホームです。これは、ファイル tools とワークスペースコンテキストに使われる唯一の作業ディレクトリです。非公開に保ち、メモリとして扱ってください。

これは、config、認証情報、セッションを保存する `~/.openclaw/` とは別です。

**重要:** ワークスペースは**デフォルトの cwd**であり、厳密な sandbox ではありません。tools は相対パスをワークスペース基準で解決しますが、sandboxing が有効でない限り、絶対パスではホスト上の他の場所にも到達できます。分離が必要な場合は、[`agents.defaults.sandbox`](/ja-JP/gateway/sandboxing)（および/またはエージェントごとの sandbox config）を使用してください。sandboxing が有効で、`workspaceAccess` が `"rw"` でない場合、tools はホストのワークスペースではなく `~/.openclaw/sandboxes` 配下の sandbox ワークスペース内で動作します。

## デフォルトの場所

- デフォルト: `~/.openclaw/workspace`
- `OPENCLAW_PROFILE` が設定されていて `"default"` でない場合、デフォルトは `~/.openclaw/workspace-<profile>` になります。
- `~/.openclaw/openclaw.json` で上書きします:

```json5
{
  agent: {
    workspace: "~/.openclaw/workspace",
  },
}
```

`openclaw onboard`、`openclaw configure`、または `openclaw setup` は、ワークスペースを作成し、不足している場合はブートストラップファイルを初期投入します。
sandbox の seed コピーは、ワークスペース内の通常ファイルだけを受け付けます。ソースワークスペース外を指す symlink/hardlink の別名は無視されます。

すでにワークスペースファイルを自分で管理している場合は、ブートストラップファイル作成を無効にできます。

```json5
{ agent: { skipBootstrap: true } }
```

## 追加のワークスペースフォルダー

古いインストールでは `~/openclaw` が作成されていることがあります。複数のワークスペースディレクトリを残しておくと、同時に有効なのは 1 つだけなので、認証や状態のずれで混乱を招くことがあります。

**推奨:** 有効なワークスペースは 1 つだけにしてください。追加フォルダーをもう使わないなら、アーカイブするか Trash に移動してください（例: `trash ~/openclaw`）。
意図的に複数ワークスペースを保持する場合は、`agents.defaults.workspace` が有効なものを指していることを確認してください。

`openclaw doctor` は、追加のワークスペースディレクトリを検出すると警告します。

## ワークスペースファイルマップ（各ファイルの意味）

OpenClaw がワークスペース内に期待する標準ファイルは次のとおりです。

- `AGENTS.md`
  - エージェントへの運用指示と、メモリの使い方。
  - 毎セッション開始時に読み込まれます。
  - ルール、優先順位、「どう振る舞うか」の詳細を書くのに適しています。

- `SOUL.md`
  - ペルソナ、口調、境界。
  - 毎セッション読み込まれます。
  - ガイド: [SOUL.md Personality Guide](/ja-JP/concepts/soul)

- `USER.md`
  - ユーザーが誰か、どう呼びかけるか。
  - 毎セッション読み込まれます。

- `IDENTITY.md`
  - エージェントの名前、雰囲気、絵文字。
  - ブートストラップ儀式の間に作成/更新されます。

- `TOOLS.md`
  - ローカル tools と慣習に関するメモ。
  - tool の可用性を制御するものではなく、ガイダンスにすぎません。

- `HEARTBEAT.md`
  - Heartbeat 実行向けの任意の小さなチェックリスト。
  - トークン消費を避けるため短く保ってください。

- `BOOT.md`
  - [internal hooks](/ja-JP/automation/hooks) が有効なときに gateway 再起動時に自動実行される、任意の起動チェックリスト。
  - 短く保ち、送信には message tool を使ってください。

- `BOOTSTRAP.md`
  - 一度だけの初回実行儀式。
  - brand-new なワークスペースに対してのみ作成されます。
  - 儀式が完了したら削除してください。

- `memory/YYYY-MM-DD.md`
  - 日次メモリログ（1 日 1 ファイル）。
  - セッション開始時に今日分 + 昨日分を読むことを推奨します。

- `MEMORY.md`（任意）
  - 厳選された長期メモリ。
  - メインのプライベートセッションでのみ読み込んでください（共有/グループコンテキストではない）。

ワークフローと自動メモリフラッシュについては [Memory](/ja-JP/concepts/memory) を参照してください。

- `skills/`（任意）
  - ワークスペース固有の Skills。
  - そのワークスペースで最優先される Skills の場所です。
  - 名前が衝突した場合、project agent skills、personal agent skills、managed skills、bundled skills、`skills.load.extraDirs` より優先されます。

- `canvas/`（任意）
  - ノード表示用の Canvas UI ファイル（例: `canvas/index.html`）。

いずれかのブートストラップファイルが欠けている場合、OpenClaw はセッションに「missing file」マーカーを注入して続行します。大きなブートストラップファイルは注入時に切り詰められます。制限は `agents.defaults.bootstrapMaxChars`（デフォルト: 12000）と `agents.defaults.bootstrapTotalMaxChars`（デフォルト: 60000）で調整してください。
`openclaw setup` は、既存ファイルを上書きせずに不足しているデフォルトを再作成できます。

## ワークスペースに含まれないもの

以下は `~/.openclaw/` 配下にあり、ワークスペース repo にコミットしてはいけません。

- `~/.openclaw/openclaw.json`（config）
- `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`（モデル認証プロファイル: OAuth + API keys）
- `~/.openclaw/credentials/`（チャンネル/プロバイダー状態と旧式 OAuth import データ）
- `~/.openclaw/agents/<agentId>/sessions/`（セッショントランスクリプト + メタデータ）
- `~/.openclaw/skills/`（managed Skills）

セッションや config を移行する必要がある場合は、それらを別途コピーし、バージョン管理から外してください。

## Git バックアップ（推奨、非公開）

ワークスペースは非公開メモリとして扱ってください。**private** な git repo に入れて、バックアップと復旧を可能にすることをおすすめします。

以下の手順は Gateway が動作しているマシンで実行してください（ワークスペースがそこにあるためです）。

### 1) repo を初期化する

git がインストールされていれば、brand-new なワークスペースは自動的に初期化されます。このワークスペースがまだ repo でない場合は、次を実行してください。

```bash
cd ~/.openclaw/workspace
git init
git add AGENTS.md SOUL.md TOOLS.md IDENTITY.md USER.md HEARTBEAT.md memory/
git commit -m "Add agent workspace"
```

### 2) private remote を追加する（初心者向けの方法）

オプション A: GitHub Web UI

1. GitHub で新しい **private** repository を作成します。
2. README 付きで初期化しないでください（マージ競合を避けるため）。
3. HTTPS remote URL をコピーします。
4. remote を追加して push します。

```bash
git branch -M main
git remote add origin <https-url>
git push -u origin main
```

オプション B: GitHub CLI (`gh`)

```bash
gh auth login
gh repo create openclaw-workspace --private --source . --remote origin --push
```

オプション C: GitLab Web UI

1. GitLab で新しい **private** repository を作成します。
2. README 付きで初期化しないでください（マージ競合を避けるため）。
3. HTTPS remote URL をコピーします。
4. remote を追加して push します。

```bash
git branch -M main
git remote add origin <https-url>
git push -u origin main
```

### 3) 継続的な更新

```bash
git status
git add .
git commit -m "Update memory"
git push
```

## シークレットをコミットしない

private repo であっても、ワークスペースにシークレットを保存しないでください。

- API keys、OAuth トークン、パスワード、または private な認証情報。
- `~/.openclaw/` 配下のものすべて。
- チャットや機密添付ファイルの生ダンプ。

機密参照をどうしても保存する必要がある場合は、プレースホルダーを使い、実際のシークレットは別の場所に保存してください（パスワードマネージャー、環境変数、または `~/.openclaw/`）。

推奨される `.gitignore` のひな形:

```gitignore
.DS_Store
.env
**/*.key
**/*.pem
**/secrets*
```

## ワークスペースを新しいマシンに移動する

1. 希望するパス（デフォルトは `~/.openclaw/workspace`）に repo を clone します。
2. `~/.openclaw/openclaw.json` で `agents.defaults.workspace` をそのパスに設定します。
3. `openclaw setup --workspace <path>` を実行して、不足しているファイルを初期投入します。
4. セッションも必要なら、古いマシンから `~/.openclaw/agents/<agentId>/sessions/` を別途コピーします。

## 高度な注記

- マルチエージェントルーティングでは、エージェントごとに異なるワークスペースを使えます。ルーティング設定については [Channel routing](/ja-JP/channels/channel-routing) を参照してください。
- `agents.defaults.sandbox` が有効な場合、メイン以外のセッションでは `agents.defaults.sandbox.workspaceRoot` 配下のセッションごとの sandbox ワークスペースを使用できます。

## 関連

- [Standing Orders](/ja-JP/automation/standing-orders) — ワークスペースファイル内の永続的な指示
- [Heartbeat](/ja-JP/gateway/heartbeat) — HEARTBEAT.md ワークスペースファイル
- [Session](/ja-JP/concepts/session) — セッション保存パス
- [Sandboxing](/ja-JP/gateway/sandboxing) — sandbox 環境でのワークスペースアクセス
