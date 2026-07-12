---
read_when:
    - マシンから OpenClaw を削除する場合
    - アンインストール後もGatewayサービスが実行されています
summary: OpenClaw を完全にアンインストールする（CLI、サービス、状態、ワークスペース）
title: アンインストール
x-i18n:
    generated_at: "2026-07-11T22:22:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 84f01dc11defe6f19c89232375e48bad383b2e71379f47f43e759d3d7bb908b5
    source_path: install/uninstall.md
    workflow: 16
---

2つの方法があります。

- `openclaw` がまだインストールされている場合の**簡単な方法**。
- CLI は削除済みでもサービスがまだ実行中の場合の**手動でのサービス削除**。

## 簡単な方法（CLI がまだインストールされている場合）

推奨: 組み込みのアンインストーラーを使用します。

```bash
openclaw uninstall
```

状態を削除しても、`--workspace` も選択しない限り、設定済みのワークスペースディレクトリは保持されます。

削除対象をプレビューします（安全）。

```bash
openclaw uninstall --dry-run --all
```

非対話形式（自動化 / npx）。スコープを確認した後にのみ、注意して使用してください。

```bash
openclaw uninstall --all --yes --non-interactive
npx -y openclaw uninstall --all --yes --non-interactive
```

フラグ: `--service`、`--state`、`--workspace`、`--app` は個別のスコープを選択し、`--all` は4つすべてを選択します。

手動での手順（結果は同じです）。

1. Gateway サービスを停止します。

```bash
openclaw gateway stop
```

2. Gateway サービス（launchd/systemd/schtasks）をアンインストールします。

```bash
openclaw gateway uninstall
```

3. 状態と設定を削除します。

```bash
rm -rf "${OPENCLAW_STATE_DIR:-$HOME/.openclaw}"
```

`OPENCLAW_CONFIG_PATH` を状態ディレクトリ外のカスタム場所に設定した場合は、そのファイルも削除してください。
`~/.openclaw/workspace` など、状態ディレクトリ内のワークスペースを保持する場合は、`rm -rf` を実行する前に別の場所へ移動するか、状態の内容を選択的に削除してください。

4. ワークスペースを削除します（任意。エージェントファイルも削除されます）。

```bash
rm -rf ~/.openclaw/workspace
```

5. CLI のインストールを削除します（使用したものを選択してください）。

```bash
npm rm -g openclaw
pnpm remove -g openclaw
bun remove -g openclaw
```

6. macOS アプリをインストールした場合:

```bash
rm -rf /Applications/OpenClaw.app
```

注記:

- プロファイル（`--profile` / `OPENCLAW_PROFILE`）を使用した場合は、各状態ディレクトリに対して手順3を繰り返してください（デフォルトは `~/.openclaw-<profile>`）。
- リモートモードでは、状態ディレクトリは **Gateway ホスト**上にあるため、手順1〜4もそこで実行してください。

## 手動でのサービス削除（CLI がインストールされていない場合）

Gateway サービスが実行され続けているものの、`openclaw` が存在しない場合に使用します。

### macOS（launchd）

デフォルトのラベルは `ai.openclaw.gateway` です（プロファイルを使用する場合は `ai.openclaw.<profile>`）。

```bash
launchctl bootout gui/$UID/ai.openclaw.gateway
rm -f ~/Library/LaunchAgents/ai.openclaw.gateway.plist
```

プロファイルを使用した場合は、ラベルと plist 名を `ai.openclaw.<profile>` に置き換えてください。

### Linux（systemd ユーザーユニット）

デフォルトのユニット名は `openclaw-gateway.service` です（または `openclaw-gateway-<profile>.service`）。非常に古いインストールからアップグレードしたマシンには、名前変更前の `clawdbot-gateway.service` ユニットが残っている場合があります。`openclaw uninstall` / `openclaw gateway uninstall` はこれを検出して自動的に削除します。

```bash
systemctl --user disable --now openclaw-gateway.service
rm -f ~/.config/systemd/user/openclaw-gateway.service
systemctl --user daemon-reload
```

### Windows（スケジュールされたタスク）

デフォルトのタスク名は `OpenClaw Gateway` です（または `OpenClaw Gateway (<profile>)`）。
このタスクは状態ディレクトリ内のウィンドウを表示しない `gateway.vbs` スクリプトを起動し、そのスクリプトが `gateway.cmd` を実行します。両方を削除してください。

```powershell
schtasks /Delete /F /TN "OpenClaw Gateway"
Remove-Item -Force "$env:USERPROFILE\.openclaw\gateway.cmd" -ErrorAction SilentlyContinue
Remove-Item -Force "$env:USERPROFILE\.openclaw\gateway.vbs" -ErrorAction SilentlyContinue
```

プロファイルを使用した場合は、対応するタスク名と、`~\.openclaw-<profile>` 内の `gateway.cmd` /
`gateway.vbs` ファイルを削除してください。

## 通常のインストールとソースチェックアウト

### 通常のインストール（install.sh / npm / pnpm / bun）

`https://openclaw.ai/install.sh` または `install.ps1` を使用した場合、CLI は `npm install -g openclaw@latest` でインストールされています。
`npm rm -g openclaw` で削除してください（その方法でインストールした場合は `pnpm remove -g` / `bun remove -g`）。

### ソースチェックアウト（git clone）

リポジトリのチェックアウトから実行している場合（`git clone` + `openclaw ...` / `bun run openclaw ...`）:

1. リポジトリを削除する**前に**、Gateway サービスをアンインストールします（上記の簡単な方法または手動でのサービス削除を使用してください）。
2. リポジトリディレクトリを削除します。
3. 上記の手順に従って、状態とワークスペースを削除します。

## 関連項目

- [インストールの概要](/ja-JP/install)
- [移行ガイド](/ja-JP/install/migrating)
