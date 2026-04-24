---
read_when:
    - macOS アプリ機能を実装すること
    - macOS で gateway ライフサイクルや Node ブリッジングを変更すること
summary: OpenClaw macOS コンパニオンアプリ（メニューバー + gateway ブローカー）
title: macOS アプリ
x-i18n:
    generated_at: "2026-04-24T05:09:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6c7911d0a2e7be7fa437c5ef01a98c0f7da5e44388152ba182581cd2e381ba8b
    source_path: platforms/macos.md
    workflow: 15
---

macOS アプリは OpenClaw の**メニューバーコンパニオン**です。権限を管理し、
ローカルで Gateway を管理/接続し（launchd または手動）、macOS の
capabilities を Node としてエージェントに公開します。

## 何をするか

- ネイティブ通知とステータスをメニューバーに表示します。
- TCC プロンプト（Notifications、Accessibility、Screen Recording、Microphone、
  Speech Recognition、Automation/AppleScript）を管理します。
- Gateway を実行または接続します（local または remote）。
- macOS 専用 tools（Canvas、Camera、Screen Recording、`system.run`）を公開します。
- **remote** mode ではローカル Node host service を開始し（launchd）、**local** mode では停止します。
- UI 自動化用に **PeekabooBridge** を任意でホストできます。
- 要求に応じて npm、pnpm、または bun 経由でグローバル CLI（`openclaw`）をインストールします（アプリは npm、次に pnpm、次に bun を優先しますが、Gateway ランタイムとしては引き続き Node が推奨です）。

## local と remote mode

- **Local**（デフォルト）: アプリは、動作中のローカル Gateway があればそれにアタッチします。
  なければ `openclaw gateway install` 経由で launchd service を有効化します。
- **Remote**: アプリは SSH/Tailscale 経由で Gateway に接続し、ローカルプロセスは起動しません。
  リモート Gateway からこの Mac に到達できるよう、アプリはローカルの **node host service** を起動します。
  アプリは Gateway を子プロセスとして起動しません。
  Gateway 検出は、raw tailnet IP よりも Tailscale MagicDNS 名を優先するようになったため、
  tailnet IP が変わったときでも Mac アプリはより確実に復旧します。

## Launchd 制御

アプリは、ユーザーごとの LaunchAgent `ai.openclaw.gateway`
を管理します（`--profile`/`OPENCLAW_PROFILE` 使用時は `ai.openclaw.<profile>`、旧式の `com.openclaw.*` もアンロード対象です）。

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.gateway
launchctl bootout gui/$UID/ai.openclaw.gateway
```

名前付き profile を実行している場合は、ラベルを `ai.openclaw.<profile>` に置き換えてください。

LaunchAgent がインストールされていない場合は、アプリから有効化するか、
`openclaw gateway install` を実行してください。

## Node capabilities（mac）

macOS アプリは自身を Node として提示します。主な command:

- Canvas: `canvas.present`, `canvas.navigate`, `canvas.eval`, `canvas.snapshot`, `canvas.a2ui.*`
- Camera: `camera.snap`, `camera.clip`
- Screen: `screen.snapshot`, `screen.record`
- System: `system.run`, `system.notify`

Node は `permissions` マップを報告するため、エージェントは何が許可されているか判断できます。

Node service + アプリ IPC:

- headless Node host service が動作しているとき（remote mode）、それは Node として Gateway WS に接続します。
- `system.run` はローカル Unix socket 経由で macOS アプリ（UI/TCC コンテキスト）内で実行されます。プロンプトと出力はアプリ内に留まります。

図（SCI）:

```
Gateway -> Node Service (WS)
                 |  IPC (UDS + token + HMAC + TTL)
                 v
             Mac App (UI + TCC + system.run)
```

## Exec approvals（system.run）

`system.run` は macOS アプリ内の **Exec approvals**（Settings → Exec approvals）で制御されます。
security + ask + allowlist は Mac 上の次の場所にローカル保存されます。

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

注:

- `allowlist` エントリーは、解決済みバイナリパスに対する glob パターンです。
- 生のシェルコマンド文字列にシェル制御または展開構文（`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`）が含まれている場合、それは allowlist miss として扱われ、明示的承認（またはシェルバイナリの allowlist 登録）が必要になります。
- プロンプトで「Always Allow」を選ぶと、そのコマンドが allowlist に追加されます。
- `system.run` の環境上書きはフィルタリングされ（`PATH`, `DYLD_*`, `LD_*`, `NODE_OPTIONS`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4` を削除）、その後アプリの環境とマージされます。
- シェルラッパー（`bash|sh|zsh ... -c/-lc`）では、リクエストスコープの環境上書きは小さな明示 allowlist（`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`）に縮小されます。
- allowlist mode で allow-always を選択した場合、既知のディスパッチラッパー（`env`, `nice`, `nohup`, `stdbuf`, `timeout`）はラッパーパスではなく内部実行ファイルパスを永続化します。安全にアンラップできない場合、allowlist エントリーは自動永続化されません。

## ディープリンク

アプリはローカル action 用に `openclaw://` URL スキームを登録します。

### `openclaw://agent`

Gateway の `agent` request をトリガーします。
__OC_I18N_900004__
クエリパラメーター:

- `message`（必須）
- `sessionKey`（任意）
- `thinking`（任意）
- `deliver` / `to` / `channel`（任意）
- `timeoutSeconds`（任意）
- `key`（任意の unattended mode key）

安全性:

- `key` がない場合、アプリは確認を求めます。
- `key` がない場合、確認プロンプトでは短いメッセージ長制限が適用され、`deliver` / `to` / `channel` は無視されます。
- 有効な `key` がある場合、その実行は unattended になります（個人用自動化を想定）。

## オンボーディングフロー（典型）

1. **OpenClaw.app** をインストールして起動する。
2. 権限チェックリスト（TCC プロンプト）を完了する。
3. **Local** mode が有効で、Gateway が動作していることを確認する。
4. ターミナルアクセスが欲しければ CLI をインストールする。

## 状態ディレクトリ配置（macOS）

OpenClaw の状態ディレクトリを iCloud やその他のクラウド同期フォルダーに置くのは避けてください。
同期付きパスはレイテンシを増やし、セッションや認証情報に対してファイルロック/同期 race を引き起こすことがあります。

次のような、ローカルで非同期の状態パスを推奨します。
__OC_I18N_900005__
`openclaw doctor` が次の配下に状態を検出した場合:

- `~/Library/Mobile Documents/com~apple~CloudDocs/...`
- `~/Library/CloudStorage/...`

警告を出し、ローカルパスへ戻すことを推奨します。

## ビルドと開発ワークフロー（ネイティブ）

- `cd apps/macos && swift build`
- `swift run OpenClaw`（または Xcode）
- アプリをパッケージ化: `scripts/package-mac-app.sh`

## Gateway 接続性のデバッグ（macOS CLI）

デバッグ CLI を使うと、アプリを起動せずに、macOS アプリが使うのと同じ Gateway WebSocket handshake と検出
ロジックを試せます。
__OC_I18N_900006__
connect オプション:

- `--url <ws://host:port>`: config を上書き
- `--mode <local|remote>`: config から解決（デフォルト: config または local）
- `--probe`: 新しい health probe を強制
- `--timeout <ms>`: request タイムアウト（デフォルト: `15000`）
- `--json`: diff 用の構造化出力

discovery オプション:

- `--include-local`: 「local」としてフィルターされる gateway も含める
- `--timeout <ms>`: 全体の discovery ウィンドウ（デフォルト: `2000`）
- `--json`: diff 用の構造化出力

ヒント: `openclaw gateway discover --json` と比較すると、
macOS アプリの discovery pipeline（`local.` と設定済みの広域ドメインに加え、
広域および Tailscale Serve のフォールバックあり）が、
Node CLI の `dns-sd` ベース検出と異なるかどうか確認できます。

## リモート接続の配線（SSH トンネル）

macOS アプリが **Remote** mode で動作しているとき、ローカル UI
コンポーネントがリモート Gateway と localhost 上にあるかのように話せるよう、SSH トンネルを開きます。

### Control トンネル（Gateway WebSocket port）

- **目的:** health check、status、Web Chat、config、その他の control-plane 呼び出し。
- **ローカルポート:** Gateway port（デフォルト `18789`）、常に安定。
- **リモートポート:** リモートホスト上の同じ Gateway port。
- **動作:** ランダムなローカルポートは使いません。アプリは既存の健全なトンネルを再利用し、
  必要に応じて再起動します。
- **SSH 形状:** BatchMode +
  ExitOnForwardFailure + keepalive オプション付きの `ssh -N -L <local>:127.0.0.1:<remote>`。
- **IP 表示:** SSH トンネルは loopback を使うため、gateway からは Node
  IP が `127.0.0.1` に見えます。実際のクライアント
  IP を表示したい場合は **Direct (ws/wss)** トランスポートを使ってください（[macOS remote access](/ja-JP/platforms/mac/remote) を参照）。

セットアップ手順については [macOS remote access](/ja-JP/platforms/mac/remote) を参照してください。protocol
の詳細については [Gateway protocol](/ja-JP/gateway/protocol) を参照してください。

## 関連ドキュメント

- [Gateway runbook](/ja-JP/gateway)
- [Gateway (macOS)](/ja-JP/platforms/mac/bundled-gateway)
- [macOS permissions](/ja-JP/platforms/mac/permissions)
- [Canvas](/ja-JP/platforms/mac/canvas)
