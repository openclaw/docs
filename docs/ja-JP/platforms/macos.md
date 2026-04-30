---
read_when:
    - macOSアプリ機能の実装
    - macOS での Gateway ライフサイクルまたは Node ブリッジングの変更
summary: OpenClaw macOS コンパニオンアプリ（メニューバー + Gateway ブローカー）
title: macOSアプリ
x-i18n:
    generated_at: "2026-04-30T05:23:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2ed98cd4865f2117728d4349c9be99d9c2e20f4d86a77c80f5ba0b5520eb81cd
    source_path: platforms/macos.md
    workflow: 16
---

macOS アプリは OpenClaw の**メニューバーコンパニオン**です。権限を所有し、
Gateway をローカルで管理/接続し（launchd または手動）、macOS の
機能をノードとしてエージェントに公開します。

## 何をするか

- メニューバーにネイティブ通知とステータスを表示します。
- TCC プロンプト（通知、アクセシビリティ、画面収録、マイク、
  音声認識、Automation/AppleScript）を所有します。
- Gateway を実行するか接続します（ローカルまたはリモート）。
- macOS 専用ツール（Canvas、Camera、Screen Recording、`system.run`）を公開します。
- **リモート**モードではローカルノードホストサービスを開始し（launchd）、**ローカル**モードでは停止します。
- 必要に応じて、UI 自動化用の **PeekabooBridge** をホストします。
- 要求に応じて npm、pnpm、bun 経由でグローバル CLI（`openclaw`）をインストールします（アプリは npm、pnpm、bun の順に優先します。Node は引き続き推奨される Gateway ランタイムです）。

## ローカルモードとリモートモード

- **ローカル**（デフォルト）: 実行中のローカル Gateway が存在する場合、アプリはそれに接続します。
  それ以外の場合は `openclaw gateway install` により launchd サービスを有効化します。
- **リモート**: アプリは SSH/Tailscale 経由で Gateway に接続し、ローカルプロセスは一切開始しません。
  アプリはローカルの**ノードホストサービス**を開始し、リモート Gateway がこの Mac に到達できるようにします。
  アプリは Gateway を子プロセスとして起動しません。
  Gateway 検出は、生の tailnet IP よりも Tailscale MagicDNS 名を優先するようになったため、
  tailnet IP が変わっても Mac アプリはより確実に復旧します。

## Launchd 制御

アプリは、`ai.openclaw.gateway` というラベルのユーザーごとの LaunchAgent
（`--profile`/`OPENCLAW_PROFILE` 使用時は `ai.openclaw.<profile>`。従来の `com.openclaw.*` も引き続き unload されます）を管理します。

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.gateway
launchctl bootout gui/$UID/ai.openclaw.gateway
```

名前付きプロファイルを実行している場合は、ラベルを `ai.openclaw.<profile>` に置き換えてください。

LaunchAgent がインストールされていない場合は、アプリから有効化するか、
`openclaw gateway install` を実行してください。

## Node 機能（mac）

macOS アプリは自身をノードとして提示します。一般的なコマンド:

- Canvas: `canvas.present`, `canvas.navigate`, `canvas.eval`, `canvas.snapshot`, `canvas.a2ui.*`
- Camera: `camera.snap`, `camera.clip`
- Screen: `screen.snapshot`, `screen.record`
- System: `system.run`, `system.notify`

ノードは `permissions` マップを報告するため、エージェントは許可されている内容を判断できます。

ノードサービス + アプリ IPC:

- ヘッドレスのノードホストサービスが実行中の場合（リモートモード）、Gateway WS にノードとして接続します。
- `system.run` は、ローカル Unix ソケット経由で macOS アプリ内（UI/TCC コンテキスト）で実行されます。プロンプトと出力はアプリ内に残ります。

図（SCI）:

```
Gateway -> Node Service (WS)
                 |  IPC (UDS + token + HMAC + TTL)
                 v
             Mac App (UI + TCC + system.run)
```

## 実行承認（system.run）

`system.run` は macOS アプリの**実行承認**（Settings → Exec approvals）によって制御されます。
セキュリティ + 確認 + allowlist は Mac 上の次の場所にローカル保存されます:

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

注記:

- `allowlist` エントリは、解決済みバイナリパスの glob パターン、または PATH 経由で呼び出されるコマンドの裸のコマンド名です。
- シェル制御または展開構文（`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`）を含む生のシェルコマンドテキストは allowlist ミスとして扱われ、明示的な承認（またはシェルバイナリの allowlist 追加）が必要です。
- プロンプトで「常に許可」を選ぶと、そのコマンドが allowlist に追加されます。
- `system.run` の環境上書きはフィルタリングされ（`PATH`, `DYLD_*`, `LD_*`, `NODE_OPTIONS`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4` を削除）、その後アプリの環境とマージされます。
- シェルラッパー（`bash|sh|zsh ... -c/-lc`）では、リクエストスコープの環境上書きは小さな明示的 allowlist（`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`）に削減されます。
- allowlist モードで常に許可する判定では、既知のディスパッチラッパー（`env`, `nice`, `nohup`, `stdbuf`, `timeout`）はラッパーパスではなく内部の実行可能ファイルパスを永続化します。安全に展開できない場合、allowlist エントリは自動的には永続化されません。

## ディープリンク

アプリはローカルアクション用に `openclaw://` URL スキームを登録します。

### `openclaw://agent`

Gateway の `agent` リクエストをトリガーします。
__OC_I18N_900004__
クエリパラメーター:

- `message`（必須）
- `sessionKey`（任意）
- `thinking`（任意）
- `deliver` / `to` / `channel`（任意）
- `timeoutSeconds`（任意）
- `key`（任意の無人モードキー）

安全性:

- `key` がない場合、アプリは確認を求めます。
- `key` がない場合、アプリは確認プロンプトに短いメッセージ制限を適用し、`deliver` / `to` / `channel` を無視します。
- 有効な `key` がある場合、実行は無人になります（個人用自動化を想定）。

## オンボーディングフロー（典型）

1. **OpenClaw.app** をインストールして起動します。
2. 権限チェックリスト（TCC プロンプト）を完了します。
3. **ローカル**モードが有効で、Gateway が実行中であることを確認します。
4. ターミナルアクセスが必要な場合は CLI をインストールします。

## 状態ディレクトリの配置（macOS）

OpenClaw の状態ディレクトリを iCloud やその他のクラウド同期フォルダーに置くことは避けてください。
同期付きパスはレイテンシを追加し、セッションや認証情報でファイルロック/同期の競合を
まれに引き起こす場合があります。

次のような、同期されないローカルの状態パスを推奨します:
__OC_I18N_900005__
`openclaw doctor` が次の配下に状態を検出した場合:

- `~/Library/Mobile Documents/com~apple~CloudDocs/...`
- `~/Library/CloudStorage/...`

警告し、ローカルパスに戻すことを推奨します。

## ビルドと開発ワークフロー（ネイティブ）

- `cd apps/macos && swift build`
- `swift run OpenClaw`（または Xcode）
- アプリをパッケージ化: `scripts/package-mac-app.sh`

## Gateway 接続のデバッグ（macOS CLI）

アプリを起動せずに、macOS アプリが使用するものと同じ Gateway WebSocket ハンドシェイクと検出
ロジックをデバッグ CLI で実行できます。
__OC_I18N_900006__
接続オプション:

- `--url <ws://host:port>`: 設定を上書き
- `--mode <local|remote>`: 設定から解決（デフォルト: 設定またはローカル）
- `--probe`: 新しいヘルスプローブを強制
- `--timeout <ms>`: リクエストタイムアウト（デフォルト: `15000`）
- `--json`: 差分確認用の構造化出力

検出オプション:

- `--include-local`: 「ローカル」としてフィルタリングされる Gateway を含める
- `--timeout <ms>`: 全体の検出ウィンドウ（デフォルト: `2000`）
- `--json`: 差分確認用の構造化出力

<Tip>
`openclaw gateway discover --json` と比較して、macOS アプリの検出パイプライン（`local.` と設定済みの広域ドメインに加え、広域および Tailscale Serve フォールバック）が、Node CLI の `dns-sd` ベースの検出と異なるかどうかを確認してください。
</Tip>

## リモート接続の配管（SSH トンネル）

macOS アプリが**リモート**モードで実行されている場合、ローカル UI
コンポーネントが localhost 上にあるかのようにリモート Gateway と通信できるよう、SSH トンネルを開きます。

### 制御トンネル（Gateway WebSocket ポート）

- **目的:** ヘルスチェック、ステータス、Web Chat、設定、およびその他のコントロールプレーン呼び出し。
- **ローカルポート:** Gateway ポート（デフォルト `18789`）。常に安定しています。
- **リモートポート:** リモートホスト上の同じ Gateway ポート。
- **動作:** ランダムなローカルポートは使いません。アプリは既存の正常なトンネルを再利用するか、
  必要に応じて再起動します。
- **SSH 形状:** BatchMode +
  ExitOnForwardFailure + keepalive オプション付きの `ssh -N -L <local>:127.0.0.1:<remote>`。
- **IP 報告:** SSH トンネルは loopback を使用するため、Gateway はノード
  IP を `127.0.0.1` として認識します。実際のクライアント IP を表示したい場合は
  **Direct (ws/wss)** トランスポートを使用してください（[macOS リモートアクセス](/ja-JP/platforms/mac/remote)を参照）。

セットアップ手順については、[macOS リモートアクセス](/ja-JP/platforms/mac/remote)を参照してください。プロトコルの
詳細については、[Gateway プロトコル](/ja-JP/gateway/protocol)を参照してください。

## 関連ドキュメント

- [Gateway ランブック](/ja-JP/gateway)
- [Gateway (macOS)](/ja-JP/platforms/mac/bundled-gateway)
- [macOS 権限](/ja-JP/platforms/mac/permissions)
- [Canvas](/ja-JP/platforms/mac/canvas)
