---
read_when:
    - macOS アプリ機能を実装する
    - macOS 上で Gateway ライフサイクルまたは Node bridging を変更する
summary: OpenClaw macOS companion app（メニューバー + Gateway broker）
title: macOS アプリ
x-i18n:
  refreshed_at: '2026-04-28T05:23:26Z'
  generated_at: "2026-04-25T13:52:27Z"
  model: gpt-5.4
  provider: openai
  source_hash: 852c93694ebb4ac083b9a44c2e4d6e40274e6e7f3aa6fa664a8eba1a82aaf5b1
  source_path: platforms/macos.md
  workflow: 15
---

macOS アプリは、OpenClaw 用の**メニューバー companion**です。permissions を管理し、
Gateway をローカルで管理/接続し（launchd または手動）、macOS の
capability を node としてエージェントへ公開します。

## 何をするのか

- メニューバーにネイティブ通知とステータスを表示する。
- TCC プロンプト（Notifications、Accessibility、Screen Recording、Microphone、
  Speech Recognition、Automation/AppleScript）を管理する。
- Gateway を実行または接続する（local または remote）。
- macOS 専用ツール（Canvas、Camera、Screen Recording、`system.run`）を公開する。
- **remote** モードではローカル node host service（launchd）を起動し、**local** モードでは停止する。
- UI 自動化用に **PeekabooBridge** を任意でホストする。
- npm、pnpm、または bun 経由で、要求に応じてグローバル CLI（`openclaw`）をインストールする（アプリは npm、次に pnpm、最後に bun を優先します。Gateway ランタイムとしては引き続き Node が推奨です）。

## Local モードと remote モード

- **Local**（デフォルト）: アプリは、稼働中のローカル Gateway があればそれに接続します。
  なければ `openclaw gateway install` により launchd service を有効化します。
- **Remote**: アプリは SSH/Tailscale 経由で Gateway に接続し、ローカル process は起動しません。
  アプリは、remote Gateway がこの Mac に到達できるように、ローカルの**node host service**を起動します。
  アプリは Gateway を子 process として spawn しません。
  Gateway discovery は現在、raw tailnet IP よりも Tailscale MagicDNS 名を優先するため、
  tailnet IP が変わったときでも Mac アプリはより確実に復旧します。

## Launchd 制御

アプリは、ユーザーごとの LaunchAgent `ai.openclaw.gateway`
（`--profile`/`OPENCLAW_PROFILE` を使う場合は `ai.openclaw.<profile>`、レガシーな `com.openclaw.*` も unload 対象）
を管理します。

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.gateway
launchctl bootout gui/$UID/ai.openclaw.gateway
```

名前付き profile を使っている場合は、ラベルを `ai.openclaw.<profile>` に置き換えてください。

LaunchAgent がインストールされていない場合は、アプリから有効化するか、
`openclaw gateway install` を実行してください。

## Node capabilities（mac）

macOS アプリは自分自身を node として提示します。一般的なコマンド:

- Canvas: `canvas.present`, `canvas.navigate`, `canvas.eval`, `canvas.snapshot`, `canvas.a2ui.*`
- Camera: `camera.snap`, `camera.clip`
- Screen: `screen.snapshot`, `screen.record`
- System: `system.run`, `system.notify`

node は `permissions` map を報告するため、エージェントは何が許可されているかを判断できます。

Node service + app IPC:

- ヘッドレス node host service が動作中（remote モード）のとき、それは node として Gateway WS に接続します。
- `system.run` は、ローカル Unix socket 経由で macOS アプリ（UI/TCC コンテキスト）内で実行されます。プロンプトと出力はアプリ内に留まります。

図（SCI）:

```
Gateway -> Node Service (WS)
                 |  IPC (UDS + token + HMAC + TTL)
                 v
             Mac App (UI + TCC + system.run)
```

## Exec approvals（system.run）

`system.run` は、macOS アプリ内の **Exec approvals**（Settings → Exec approvals）で制御されます。
security + ask + allowlist は Mac 上にローカル保存されます:

```
~/.openclaw/exec-approvals.json
```

例:

```json
{
  "version": 1,
  "defaults": {
    "security": "deny",
    "ask": "on-miss"
  },
  "agents": {
    "main": {
      "security": "allowlist",
      "ask": "on-miss",
      "allowlist": [{ "pattern": "/opt/homebrew/bin/rg" }]
    }
  }
}
```

注意:

- `allowlist` エントリは、解決済みバイナリパスに対する glob pattern、または PATH 経由で呼び出されるコマンドに対する素のコマンド名です。
- シェル制御または展開構文（`&&`、`||`、`;`、`|`、`` ` ``、`$`、`<`、`>`、`(`、`)`）を含む raw shell command text は allowlist miss として扱われ、明示的な承認が必要です（またはシェルバイナリ自体を allowlist に入れる必要があります）。
- プロンプトで「Always Allow」を選ぶと、そのコマンドが allowlist に追加されます。
- `system.run` の environment override はフィルタされ（`PATH`、`DYLD_*`、`LD_*`、`NODE_OPTIONS`、`PYTHON*`、`PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4` を除去）、その後アプリの environment とマージされます。
- シェルラッパー（`bash|sh|zsh ... -c/-lc`）では、request スコープの environment override は小さな明示的 allowlist（`TERM`、`LANG`、`LC_*`、`COLORTERM`、`NO_COLOR`、`FORCE_COLOR`）に絞られます。
- allowlist モードでの allow-always 決定では、既知の dispatch ラッパー（`env`、`nice`、`nohup`、`stdbuf`、`timeout`）は、ラッパーパスではなく内側の executable path を永続化します。安全に unwrap できない場合、allowlist エントリは自動永続化されません。

## Deep links

アプリは、ローカルアクション用に `openclaw://` URL scheme を登録します。

### `openclaw://agent`

Gateway `agent` リクエストをトリガーします。
__OC_I18N_900004__
クエリパラメータ:

- `message`（必須）
- `sessionKey`（任意）
- `thinking`（任意）
- `deliver` / `to` / `channel`（任意）
- `timeoutSeconds`（任意）
- `key`（任意の unattended mode key）

安全性:

- `key` がない場合、アプリは確認を求めます。
- `key` がない場合、アプリは確認プロンプト用に短い message 上限を適用し、`deliver` / `to` / `channel` は無視します。
- 有効な `key` がある場合、その実行は unattended になります（個人用自動化向け）。

## オンボーディングフロー（典型例）

1. **OpenClaw.app** をインストールして起動する。
2. permissions チェックリスト（TCC プロンプト）を完了する。
3. **Local** モードが有効で、Gateway が稼働していることを確認する。
4. ターミナルアクセスが必要なら CLI をインストールする。

## 状態ディレクトリ配置（macOS）

OpenClaw の state dir は iCloud や他のクラウド同期フォルダに置かないでください。
同期バックエンドのパスは遅延を増やし、セッションや credential に対する
ファイルロック/同期競合を起こすことがあります。

次のようなローカルの非同期 state path を推奨します:
__OC_I18N_900005__
`openclaw doctor` が以下の場所配下の state を検出した場合:

- `~/Library/Mobile Documents/com~apple~CloudDocs/...`
- `~/Library/CloudStorage/...`

警告を出し、ローカル path へ戻すことを推奨します。

## Build & dev workflow（native）

- `cd apps/macos && swift build`
- `swift run OpenClaw`（または Xcode）
- アプリをパッケージ化: `scripts/package-mac-app.sh`

## Gateway 接続のデバッグ（macOS CLI）

アプリを起動せずに、macOS アプリが使うものと同じ Gateway WebSocket handshake と discovery
ロジックを試すには、debug CLI を使用します。
__OC_I18N_900006__
Connect オプション:

- `--url <ws://host:port>`: config を上書き
- `--mode <local|remote>`: config から解決（デフォルト: config または local）
- `--probe`: 強制的に新しい health probe を実行
- `--timeout <ms>`: リクエスト timeout（デフォルト: `15000`）
- `--json`: diff 用の構造化出力

Discovery オプション:

- `--include-local`: 「local」としてフィルタされる gateway も含める
- `--timeout <ms>`: discovery 全体の待機時間（デフォルト: `2000`）
- `--json`: diff 用の構造化出力

ヒント: `openclaw gateway discover --json` と比較すると、
macOS アプリの discovery pipeline（`local.` と設定された wide-area domain、および
wide-area と Tailscale Serve の fallback）が、
Node CLI の `dns-sd` ベース discovery とどう異なるか確認できます。

## Remote 接続の配線（SSH トンネル）

macOS アプリが **Remote** モードで動作する場合、SSH トンネルを開き、ローカル UI
コンポーネントが remote Gateway と localhost 上にあるかのように通信できるようにします。

### Control トンネル（Gateway WebSocket port）

- **Purpose:** health check、status、Web Chat、config、およびその他の control-plane 呼び出し。
- **Local port:** Gateway port（デフォルト `18789`）、常に固定。
- **Remote port:** remote host 上の同じ Gateway port。
- **Behavior:** ランダムな local port は使わない。アプリは既存の正常なトンネルを再利用するか、必要に応じて再起動する。
- **SSH shape:** `ssh -N -L <local>:127.0.0.1:<remote>` に BatchMode +
  ExitOnForwardFailure + keepalive オプションを付ける。
- **IP reporting:** SSH トンネルは loopback を使うため、gateway から見える node
  IP は `127.0.0.1` になります。実際の client
  IP を表示したい場合は **Direct (ws/wss)** transport を使ってください（[macOS remote access](/ja-JP/platforms/mac/remote) を参照）。

セットアップ手順は [macOS remote access](/ja-JP/platforms/mac/remote) を参照してください。protocol の
詳細は [Gateway protocol](/ja-JP/gateway/protocol) を参照してください。

## 関連ドキュメント

- [Gateway runbook](/ja-JP/gateway)
- [Gateway (macOS)](/ja-JP/platforms/mac/bundled-gateway)
- [macOS permissions](/ja-JP/platforms/mac/permissions)
- [Canvas](/ja-JP/platforms/mac/canvas)
