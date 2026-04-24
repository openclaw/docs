---
read_when:
    - OpenClaw をマシンから削除したい場合
    - アンインストール後も gateway サービスが動作している場合
summary: OpenClaw を完全にアンインストールする（CLI、サービス、state、workspace）
title: アンインストール
x-i18n:
    generated_at: "2026-04-24T05:05:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6d73bc46f4878510706132e5c6cfec3c27cdb55578ed059dc12a785712616d75
    source_path: install/uninstall.md
    workflow: 15
---

方法は 2 つあります:

- `openclaw` がまだインストールされている場合の **簡単な方法**
- CLI は消えたがサービスがまだ動いている場合の **手動サービス削除**

## 簡単な方法（CLI がまだインストールされている）

推奨: 組み込みアンインストーラーを使います:

```bash
openclaw uninstall
```

非対話モード（自動化 / npx）:

```bash
openclaw uninstall --all --yes --non-interactive
npx -y openclaw uninstall --all --yes --non-interactive
```

手動手順（結果は同じ）:

1. gateway サービスを停止:

```bash
openclaw gateway stop
```

2. gateway サービスをアンインストール（launchd/systemd/schtasks）:

```bash
openclaw gateway uninstall
```

3. state + config を削除:

```bash
rm -rf "${OPENCLAW_STATE_DIR:-$HOME/.openclaw}"
```

`OPENCLAW_CONFIG_PATH` を state dir 外のカスタム場所に設定していた場合は、そのファイルも削除してください。

4. workspace を削除（任意。エージェントファイルも削除されます）:

```bash
rm -rf ~/.openclaw/workspace
```

5. CLI インストールを削除（使った方法に応じて選ぶ）:

```bash
npm rm -g openclaw
pnpm remove -g openclaw
bun remove -g openclaw
```

6. macOS アプリをインストールしていた場合:

```bash
rm -rf /Applications/OpenClaw.app
```

注記:

- profile（`--profile` / `OPENCLAW_PROFILE`）を使っていた場合は、各 state dir に対して手順 3 を繰り返してください（デフォルトは `~/.openclaw-<profile>`）。
- リモートモードでは state dir は **gateway ホスト** 上にあるため、手順 1〜4 もそこで実行してください。

## 手動サービス削除（CLI がインストールされていない）

gateway サービスが動き続けているが `openclaw` が存在しない場合は、これを使ってください。

### macOS（launchd）

デフォルトラベルは `ai.openclaw.gateway`（または `ai.openclaw.<profile>`。旧来の `com.openclaw.*` が残っていることもあります）です:

```bash
launchctl bootout gui/$UID/ai.openclaw.gateway
rm -f ~/Library/LaunchAgents/ai.openclaw.gateway.plist
```

profile を使っていた場合は、ラベルと plist 名を `ai.openclaw.<profile>` に置き換えてください。旧来の `com.openclaw.*` plist がある場合はそれも削除してください。

### Linux（systemd user unit）

デフォルト unit 名は `openclaw-gateway.service`（または `openclaw-gateway-<profile>.service`）です:

```bash
systemctl --user disable --now openclaw-gateway.service
rm -f ~/.config/systemd/user/openclaw-gateway.service
systemctl --user daemon-reload
```

### Windows（Scheduled Task）

デフォルトタスク名は `OpenClaw Gateway`（または `OpenClaw Gateway (<profile>)`）です。
タスクスクリプトは state dir 配下にあります。

```powershell
schtasks /Delete /F /TN "OpenClaw Gateway"
Remove-Item -Force "$env:USERPROFILE\.openclaw\gateway.cmd"
```

profile を使っていた場合は、対応するタスク名と `~\.openclaw-<profile>\gateway.cmd` を削除してください。

## 通常インストールとソース checkout の違い

### 通常インストール（install.sh / npm / pnpm / bun）

`https://openclaw.ai/install.sh` または `install.ps1` を使った場合、CLI は `npm install -g openclaw@latest` でインストールされています。
`npm rm -g openclaw`（または、その方法でインストールしたなら `pnpm remove -g` / `bun remove -g`）で削除してください。

### ソース checkout（git clone）

リポジトリ checkout から実行している場合（`git clone` + `openclaw ...` / `bun run openclaw ...`）:

1. リポジトリを削除する **前に** gateway サービスをアンインストールしてください（上記の簡単な方法または手動サービス削除を使う）。
2. リポジトリディレクトリを削除します。
3. 上記のとおり state + workspace を削除します。

## 関連

- [Install overview](/ja-JP/install)
- [Migration guide](/ja-JP/install/migrating)
