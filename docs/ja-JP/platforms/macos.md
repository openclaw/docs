---
read_when:
    - macOS アプリ機能の実装
    - macOSでのGatewayライフサイクルまたはNodeブリッジの変更
summary: OpenClaw macOS コンパニオンアプリ (メニューバー + Gateway ブローカー)
title: macOS アプリ
x-i18n:
    generated_at: "2026-05-06T05:12:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: cc67a88303073bb771fcec09e7366f710a6bd5500f584f8782232deaa69e599d
    source_path: platforms/macos.md
    workflow: 16
---

macOS アプリは OpenClaw の **メニューバー用コンパニオン**です。権限を管理し、
ローカルで Gateway に接続または管理（launchd または手動）し、macOS
機能を Node としてエージェントに公開します。

## できること

- メニューバーにネイティブ通知とステータスを表示します。
- TCC プロンプト（通知、アクセシビリティ、画面収録、マイク、
  音声認識、Automation/AppleScript）を管理します。
- Gateway（ローカルまたはリモート）を実行または接続します。
- macOS 専用ツール（Canvas、Camera、Screen Recording、`system.run`）を公開します。
- **remote** モードではローカル Node ホストサービスを開始し（launchd）、**local** モードでは停止します。
- 必要に応じて、UI 自動化用の **PeekabooBridge** をホストします。
- 要求に応じて npm、pnpm、または bun 経由でグローバル CLI（`openclaw`）をインストールします（アプリは npm、次に pnpm、次に bun を優先します。Node は引き続き推奨 Gateway ランタイムです）。

## ローカルモードとリモートモード

- **Local**（デフォルト）: 実行中のローカル Gateway がある場合、アプリはそれに接続します。
  それ以外の場合は、`openclaw gateway install` によって launchd サービスを有効にします。
- **Remote**: アプリは SSH/Tailscale 経由で Gateway に接続し、ローカルプロセスは開始しません。
  リモート Gateway がこの Mac に到達できるよう、アプリはローカル **Node ホストサービス**を開始します。
  アプリは Gateway を子プロセスとして起動しません。
  Gateway 検出は現在、未加工の tailnet IP よりも Tailscale MagicDNS 名を優先するため、
  tailnet IP が変わっても Mac アプリはより確実に復旧できます。

## Launchd 制御

アプリは `ai.openclaw.gateway` というラベルのユーザー単位の LaunchAgent
（`--profile`/`OPENCLAW_PROFILE` を使う場合は `ai.openclaw.<profile>`。従来の `com.openclaw.*` も引き続き unload します）を管理します。

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.gateway
launchctl bootout gui/$UID/ai.openclaw.gateway
```

名前付きプロファイルを実行している場合は、ラベルを `ai.openclaw.<profile>` に置き換えます。

LaunchAgent がインストールされていない場合は、アプリから有効化するか、
`openclaw gateway install` を実行します。

## Node 機能 (mac)

macOS アプリは自身を Node として提示します。一般的なコマンド:

- Canvas: `canvas.present`, `canvas.navigate`, `canvas.eval`, `canvas.snapshot`, `canvas.a2ui.*`
- Camera: `camera.snap`, `camera.clip`
- Screen: `screen.snapshot`, `screen.record`
- System: `system.run`, `system.notify`

Node は `permissions` マップを報告するため、エージェントは許可されている内容を判断できます。

Node サービス + アプリ IPC:

- ヘッドレス Node ホストサービスが実行中（remote モード）の場合、Gateway WS に Node として接続します。
- `system.run` はローカル Unix ソケット経由で macOS アプリ（UI/TCC コンテキスト）内で実行されます。プロンプトと出力はアプリ内に留まります。

図 (SCI):

```
Gateway -> Node Service (WS)
                 |  IPC (UDS + token + HMAC + TTL)
                 v
             Mac App (UI + TCC + system.run)
```

## 実行承認 (system.run)

`system.run` は macOS アプリの **実行承認**（設定 → 実行承認）で制御されます。
セキュリティ、確認、allowlist は Mac 上の次の場所にローカル保存されます。

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

メモ:

- `allowlist` エントリは、解決済みバイナリパスの glob パターン、または PATH 経由で呼び出されるコマンドの素のコマンド名です。
- シェル制御または展開構文（`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`）を含む生のシェルコマンドテキストは allowlist ミスとして扱われ、明示的な承認（またはシェルバイナリの allowlist 登録）が必要です。
- プロンプトで「Always Allow」を選ぶと、そのコマンドが allowlist に追加されます。
- `system.run` の環境オーバーライドはフィルタリングされ（`PATH`, `DYLD_*`, `LD_*`, `NODE_OPTIONS`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4` を除外）、その後アプリの環境とマージされます。
- シェルラッパー（`bash|sh|zsh ... -c/-lc`）では、リクエスト単位の環境オーバーライドは小さな明示的 allowlist（`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`）に絞られます。
- allowlist モードで常に許可する判断の場合、既知のディスパッチラッパー（`env`, `nice`, `nohup`, `stdbuf`, `timeout`）はラッパーパスではなく内部の実行可能ファイルパスを永続化します。安全にアンラップできない場合、allowlist エントリは自動的には永続化されません。

## ディープリンク

アプリはローカルアクション用に `openclaw://` URL スキームを登録します。

### `openclaw://agent`

Gateway の `agent` リクエストをトリガーします。
__OC_I18N_900004__
クエリパラメータ:

- `message`（必須）
- `sessionKey`（任意）
- `thinking`（任意）
- `deliver` / `to` / `channel`（任意）
- `timeoutSeconds`（任意）
- `key`（任意の無人モードキー）

安全性:

- `key` がない場合、アプリは確認を求めます。
- `key` がない場合、アプリは確認プロンプト用に短いメッセージ制限を適用し、`deliver` / `to` / `channel` を無視します。
- 有効な `key` がある場合、実行は無人になります（個人用オートメーションを想定）。

## オンボーディングフロー（一般的）

1. **OpenClaw.app** をインストールして起動します。
2. 権限チェックリスト（TCC プロンプト）を完了します。
3. **Local** モードが有効で、Gateway が実行中であることを確認します。
4. ターミナルアクセスが必要な場合は CLI をインストールします。

## 状態ディレクトリの配置 (macOS)

OpenClaw の状態ディレクトリを iCloud やその他のクラウド同期フォルダに置くのは避けてください。
同期ベースのパスでは遅延が増え、セッションや認証情報でファイルロック/同期競合が発生することがあります。

次のようなローカルの非同期状態パスを推奨します。
__OC_I18N_900005__
`openclaw doctor` が次の場所に状態を検出した場合:

- `~/Library/Mobile Documents/com~apple~CloudDocs/...`
- `~/Library/CloudStorage/...`

警告を出し、ローカルパスへ戻すことを推奨します。

## ビルドと開発ワークフロー（ネイティブ）

- `cd apps/macos && swift build`
- `swift run OpenClaw`（または Xcode）
- アプリのパッケージ化: `scripts/package-mac-app.sh`

## Gateway 接続のデバッグ (macOS CLI)

デバッグ CLI を使うと、アプリを起動せずに、macOS アプリが使うものと同じ Gateway WebSocket ハンドシェイクと検出ロジックを実行できます。
__OC_I18N_900006__
接続オプション:

- `--url <ws://host:port>`: 設定を上書き
- `--mode <local|remote>`: 設定から解決（デフォルト: 設定または local）
- `--probe`: 新しいヘルスプローブを強制
- `--timeout <ms>`: リクエストタイムアウト（デフォルト: `15000`）
- `--json`: 差分確認用の構造化出力

検出オプション:

- `--include-local`: 「local」としてフィルタリングされる Gateway を含める
- `--timeout <ms>`: 全体の検出ウィンドウ（デフォルト: `2000`）
- `--json`: 差分確認用の構造化出力

<Tip>
`openclaw gateway discover --json` と比較して、macOS アプリの検出パイプライン（`local.` に加えて設定済みの広域ドメイン、広域および Tailscale Serve フォールバックあり）が、Node CLI の `dns-sd` ベースの検出と異なるかどうかを確認してください。
</Tip>

## リモート接続の配管（SSH トンネル）

macOS アプリが **Remote** モードで実行される場合、ローカル UI
コンポーネントがリモート Gateway と localhost 上にあるかのように通信できるよう、SSH トンネルを開きます。

### 制御トンネル（Gateway WebSocket ポート）

- **目的:** ヘルスチェック、ステータス、Web Chat、設定、その他のコントロールプレーン呼び出し。
- **ローカルポート:** Gateway ポート（デフォルト `18789`）。常に安定しています。
- **リモートポート:** リモートホスト上の同じ Gateway ポート。
- **動作:** ランダムなローカルポートは使いません。アプリは既存の正常なトンネルを再利用するか、
  必要に応じて再起動します。
- **SSH 形状:** BatchMode +
  ExitOnForwardFailure + keepalive オプション付きの `ssh -N -L <local>:127.0.0.1:<remote>`。
- **IP レポート:** SSH トンネルは loopback を使うため、Gateway から見える Node
  IP は `127.0.0.1` になります。実際のクライアント
  IP を表示したい場合は、**Direct (ws/wss)** トランスポートを使用してください（[macOS リモートアクセス](/ja-JP/platforms/mac/remote)を参照）。

セットアップ手順については、[macOS リモートアクセス](/ja-JP/platforms/mac/remote)を参照してください。プロトコルの
詳細については、[Gateway プロトコル](/ja-JP/gateway/protocol)を参照してください。

## 関連ドキュメント

- [Gateway runbook](/ja-JP/gateway)
- [Gateway (macOS)](/ja-JP/platforms/mac/bundled-gateway)
- [macOS 権限](/ja-JP/platforms/mac/permissions)
- [Canvas](/ja-JP/platforms/mac/canvas)
