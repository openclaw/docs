---
read_when:
    - マシンからOpenClawを削除したい
    - アンインストール後も Gateway サービスがまだ実行されています
summary: OpenClaw を完全にアンインストールする（CLI、サービス、状態、ワークスペース）
title: アンインストール
x-i18n:
    generated_at: "2026-07-05T11:33:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 84f01dc11defe6f19c89232375e48bad383b2e71379f47f43e759d3d7bb908b5
    source_path: install/uninstall.md
    workflow: 16
---

2 つの方法があります。

- `openclaw` がまだインストールされている場合は **簡単な方法**。
- CLI はなくなったがサービスがまだ実行中の場合は **手動サービス削除**。

## 簡単な方法（CLI がまだインストール済み）

推奨: 組み込みのアンインストーラーを使用します。

```bash
openclaw uninstall
```

状態の削除では、`--workspace` も選択しない限り、設定済みのワークスペースディレクトリは保持されます。

削除される内容をプレビューします（安全）:

```bash
openclaw uninstall --dry-run --all
```

非対話型（自動化 / npx）。注意して使用し、スコープを確認した後にのみ実行してください。

```bash
openclaw uninstall --all --yes --non-interactive
npx -y openclaw uninstall --all --yes --non-interactive
```

フラグ: `--service`、`--state`、`--workspace`、`--app` は個別のスコープを選択します。`--all` は 4 つすべてを選択します。

手動手順（同じ結果）:

1. ゲートウェイサービスを停止します。

```bash
openclaw gateway stop
```

2. ゲートウェイサービス（launchd/systemd/schtasks）をアンインストールします。

```bash
openclaw gateway uninstall
```

3. 状態 + 設定を削除します。

```bash
rm -rf "${OPENCLAW_STATE_DIR:-$HOME/.openclaw}"
```

`OPENCLAW_CONFIG_PATH` を状態ディレクトリ外のカスタム場所に設定している場合は、そのファイルも削除してください。
`~/.openclaw/workspace` など、状態ディレクトリ内のワークスペースを保持したい場合は、`rm -rf` を実行する前に別の場所へ移動するか、状態の内容を選択的に削除してください。

4. ワークスペースを削除します（任意、エージェントファイルを削除します）。

```bash
rm -rf ~/.openclaw/workspace
```

5. CLI インストールを削除します（使用したものを選択してください）。

```bash
npm rm -g openclaw
pnpm remove -g openclaw
bun remove -g openclaw
```

6. macOS アプリをインストールしている場合:

```bash
rm -rf /Applications/OpenClaw.app
```

注記:

- プロファイル（`--profile` / `OPENCLAW_PROFILE`）を使用した場合は、各状態ディレクトリに対して手順 3 を繰り返してください（デフォルトは `~/.openclaw-<profile>`）。
- リモートモードでは、状態ディレクトリは **ゲートウェイホスト** 上にあるため、手順 1-4 もそこで実行してください。

## 手動サービス削除（CLI が未インストール）

ゲートウェイサービスが実行され続けているが `openclaw` が見つからない場合に使用します。

### macOS（launchd）

デフォルトのラベルは `ai.openclaw.gateway` です（プロファイル使用時は `ai.openclaw.<profile>`）。

```bash
launchctl bootout gui/$UID/ai.openclaw.gateway
rm -f ~/Library/LaunchAgents/ai.openclaw.gateway.plist
```

プロファイルを使用した場合は、ラベルと plist 名を `ai.openclaw.<profile>` に置き換えてください。

### Linux（systemd ユーザーユニット）

デフォルトのユニット名は `openclaw-gateway.service` です（または `openclaw-gateway-<profile>.service`）。非常に古いインストールからアップグレードされたマシンには、改名前の `clawdbot-gateway.service` ユニットがまだ存在する場合があります。`openclaw uninstall` / `openclaw gateway uninstall` はこれを自動的に検出して削除します。

```bash
systemctl --user disable --now openclaw-gateway.service
rm -f ~/.config/systemd/user/openclaw-gateway.service
systemctl --user daemon-reload
```

### Windows（スケジュールされたタスク）

デフォルトのタスク名は `OpenClaw Gateway` です（または `OpenClaw Gateway (<profile>)`）。
このタスクは、状態ディレクトリ配下のウィンドウなし `gateway.vbs` スクリプトを起動し、それが
`gateway.cmd` を実行します。両方を削除してください。

```powershell
schtasks /Delete /F /TN "OpenClaw Gateway"
Remove-Item -Force "$env:USERPROFILE\.openclaw\gateway.cmd" -ErrorAction SilentlyContinue
Remove-Item -Force "$env:USERPROFILE\.openclaw\gateway.vbs" -ErrorAction SilentlyContinue
```

プロファイルを使用した場合は、一致するタスク名と、`~\.openclaw-<profile>` 配下の `gateway.cmd` /
`gateway.vbs` ファイルを削除してください。

## 通常インストールとソースチェックアウト

### 通常インストール（install.sh / npm / pnpm / bun）

`https://openclaw.ai/install.sh` または `install.ps1` を使用した場合、CLI は `npm install -g openclaw@latest` でインストールされています。
`npm rm -g openclaw` で削除してください（その方法でインストールした場合は `pnpm remove -g` / `bun remove -g`）。

### ソースチェックアウト（git clone）

リポジトリチェックアウト（`git clone` + `openclaw ...` / `bun run openclaw ...`）から実行している場合:

1. リポジトリを削除する **前に** ゲートウェイサービスをアンインストールします（上記の簡単な方法または手動サービス削除を使用）。
2. リポジトリディレクトリを削除します。
3. 上記のとおり状態 + ワークスペースを削除します。

## 関連

- [インストール概要](/ja-JP/install)
- [移行ガイド](/ja-JP/install/migrating)
