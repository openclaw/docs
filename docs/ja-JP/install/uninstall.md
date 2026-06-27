---
read_when:
    - マシンからOpenClawを削除したい
    - アンインストール後も gateway サービスがまだ実行されています
summary: OpenClaw を完全にアンインストールする（CLI、サービス、状態、ワークスペース）
title: アンインストール
x-i18n:
    generated_at: "2026-06-27T11:50:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0f63bde2769b3d35d928aed1668121086a2952338f2634d45d55da8cc637025b
    source_path: install/uninstall.md
    workflow: 16
---

2つの手順があります。

- `openclaw` がまだインストールされている場合は **簡単な手順**。
- CLI はなくなっているがサービスがまだ実行中の場合は **手動でのサービス削除**。

## 簡単な手順（CLI がまだインストールされている場合）

推奨: 組み込みのアンインストーラーを使用します。

```bash
openclaw uninstall
```

CLI を使用する場合、`--workspace` も選択しない限り、状態の削除では設定済みのワークスペースディレクトリは保持されます。

削除される内容をプレビューします（安全）:

```bash
openclaw uninstall --dry-run --all
```

非対話型（自動化 / npx）。スコープを確認した後にのみ、注意して使用してください。

```bash
openclaw uninstall --all --yes --non-interactive
npx -y openclaw uninstall --all --yes --non-interactive
```

手動手順（同じ結果）:

1. Gateway サービスを停止します。

```bash
openclaw gateway stop
```

2. Gateway サービス（launchd/systemd/schtasks）をアンインストールします。

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

5. CLI インストールを削除します（使用したものを選んでください）。

```bash
npm rm -g openclaw
pnpm remove -g openclaw
bun remove -g openclaw
```

6. macOS アプリをインストールしていた場合:

```bash
rm -rf /Applications/OpenClaw.app
```

注:

- プロファイル（`--profile` / `OPENCLAW_PROFILE`）を使用していた場合は、各状態ディレクトリに対して手順 3 を繰り返してください（デフォルトは `~/.openclaw-<profile>`）。
- リモートモードでは、状態ディレクトリは **Gateway ホスト** 上にあるため、手順 1-4 もそこで実行してください。

## 手動でのサービス削除（CLI がインストールされていない場合）

Gateway サービスが実行され続けているが `openclaw` が見つからない場合に使用します。

### macOS（launchd）

デフォルトのラベルは `ai.openclaw.gateway`（または `ai.openclaw.<profile>`、レガシーの `com.openclaw.*` がまだ存在する場合があります）です。

```bash
launchctl bootout gui/$UID/ai.openclaw.gateway
rm -f ~/Library/LaunchAgents/ai.openclaw.gateway.plist
```

プロファイルを使用していた場合は、ラベルと plist 名を `ai.openclaw.<profile>` に置き換えてください。存在する場合は、レガシーの `com.openclaw.*` plist も削除してください。

### Linux（systemd ユーザーユニット）

デフォルトのユニット名は `openclaw-gateway.service`（または `openclaw-gateway-<profile>.service`）です。

```bash
systemctl --user disable --now openclaw-gateway.service
rm -f ~/.config/systemd/user/openclaw-gateway.service
systemctl --user daemon-reload
```

### Windows（スケジュールされたタスク）

デフォルトのタスク名は `OpenClaw Gateway`（または `OpenClaw Gateway (<profile>)`）です。
タスクスクリプトは状態ディレクトリ配下に `gateway.cmd` としてあります。現在のインストールでは、タスクスケジューラが `gateway.cmd` を直接開く代わりに実行する、ウィンドウなしの `gateway.vbs` ランチャーも作成される場合があります。

```powershell
schtasks /Delete /F /TN "OpenClaw Gateway"
Remove-Item -Force "$env:USERPROFILE\.openclaw\gateway.cmd" -ErrorAction SilentlyContinue
Remove-Item -Force "$env:USERPROFILE\.openclaw\gateway.vbs" -ErrorAction SilentlyContinue
```

プロファイルを使用していた場合は、一致するタスク名と、`~\.openclaw-<profile>` 配下の `gateway.cmd` /
`gateway.vbs` ファイルを削除してください。

## 通常インストールとソースチェックアウト

### 通常インストール（install.sh / npm / pnpm / bun）

`https://openclaw.ai/install.sh` または `install.ps1` を使用した場合、CLI は `npm install -g openclaw@latest` でインストールされています。
`npm rm -g openclaw`（またはその方法でインストールした場合は `pnpm remove -g` / `bun remove -g`）で削除してください。

### ソースチェックアウト（git clone）

リポジトリのチェックアウト（`git clone` + `openclaw ...` / `bun run openclaw ...`）から実行している場合:

1. リポジトリを削除する **前に** Gateway サービスをアンインストールします（上記の簡単な手順または手動でのサービス削除を使用）。
2. リポジトリディレクトリを削除します。
3. 上記のとおり、状態 + ワークスペースを削除します。

## 関連

- [インストール概要](/ja-JP/install)
- [移行ガイド](/ja-JP/install/migrating)
