---
read_when:
    - macOS アプリ機能の実装
    - macOS での Gateway ライフサイクルまたはノードブリッジの変更
summary: OpenClaw macOS コンパニオンアプリ（メニューバー + Gateway ブローカー）
title: macOS アプリ
x-i18n:
    generated_at: "2026-06-27T12:05:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4e637a1ae5ca66dfb6255fb6a233436ae0cf04b972f96446e8dc3d703486c9fa
    source_path: platforms/macos.md
    workflow: 16
---

macOS アプリは OpenClaw の **メニューバー コンパニオン**です。権限を管理し、
Gateway にローカルで接続または管理し（launchd または手動）、macOS の
機能をノードとしてエージェントに公開します。

## 機能

- メニューバーにネイティブ通知とステータスを表示します。
- TCC プロンプト（通知、アクセシビリティ、画面収録、マイク、
  音声認識、Automation/AppleScript）を管理します。
- Gateway（ローカルまたはリモート）を実行または接続します。
- macOS 専用ツール（Canvas、Camera、Screen Recording、`system.run`）を公開します。
- **リモート**モードではローカルのノードホストサービスを起動し（launchd）、**ローカル**モードでは停止します。
- 任意で UI 自動化用の **PeekabooBridge** をホストします。
- 要求に応じて npm、pnpm、または bun 経由でグローバル CLI（`openclaw`）をインストールします（アプリは npm、次に pnpm、次に bun を優先します。Node は引き続き推奨される Gateway ランタイムです）。

## ローカルモードとリモートモード

- **ローカル**（デフォルト）: 実行中のローカル Gateway があればアプリが接続します。
  なければ `openclaw gateway install` 経由で launchd サービスを有効にします。
- **リモート**: アプリは SSH/Tailscale 経由で Gateway に接続し、ローカルプロセスは
  起動しません。
  アプリはローカルの **ノードホストサービス** を起動し、リモート Gateway がこの Mac に到達できるようにします。
  アプリは Gateway を子プロセスとして生成しません。
  Gateway 検出は raw tailnet IP よりも Tailscale MagicDNS 名を優先するようになったため、
  tailnet IP が変わった場合でも Mac アプリはより確実に復旧します。

## Launchd 制御

アプリは `ai.openclaw.gateway` というラベルのユーザー単位 LaunchAgent
（`--profile`/`OPENCLAW_PROFILE` を使う場合は `ai.openclaw.<profile>`。従来の `com.openclaw.*` は引き続き unload されます）を管理します。

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.gateway
launchctl bootout gui/$UID/ai.openclaw.gateway
```

名前付きプロファイルで実行する場合は、ラベルを `ai.openclaw.<profile>` に置き換えます。

LaunchAgent がインストールされていない場合は、アプリから有効化するか、
`openclaw gateway install` を実行します。

Gateway が数分から数時間にわたって繰り返し消え、Control UI に触れるかホストへ SSH したときだけ再開する場合は、[Gateway トラブルシューティング](/ja-JP/gateway/troubleshooting#macos-gateway-silently-stops-responding-then-resumes-when-you-touch-the-dashboard) の macOS Maintenance Sleep / `ENETDOWN` クラッシュと launchd の respawn-protection gate に関するトラブルシューティングメモを参照してください。

## ノード機能（Mac）

macOS アプリは自身をノードとして提示します。一般的なコマンド:

- Canvas: `canvas.present`, `canvas.navigate`, `canvas.eval`, `canvas.snapshot`, `canvas.a2ui.*`
- Camera: `camera.snap`, `camera.clip`
- Screen: `screen.snapshot`, `screen.record`
- System: `system.run`, `system.notify`

ノードは `permissions` マップを報告するため、エージェントは何が許可されているかを判断できます。

ノードサービス + アプリ IPC:

- ヘッドレスのノードホストサービスが実行中（リモートモード）の場合、Gateway WS にノードとして接続します。
- `system.run` はローカル Unix ソケット経由で macOS アプリ（UI/TCC コンテキスト）内で実行されます。プロンプトと出力はアプリ内に留まります。

図（SCI）:

```
Gateway -> Node Service (WS)
                 |  IPC (UDS + token + HMAC + TTL)
                 v
             Mac App (UI + TCC + system.run)
```

## 実行承認（system.run）

`system.run` は macOS アプリの **実行承認**（Settings → Exec approvals）で制御されます。
セキュリティ + ask + allowlist は Mac 上の以下にローカル保存されます。

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
- シェル制御または展開構文（`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`）を含む raw シェルコマンドテキストは allowlist ミスとして扱われ、明示的な承認（またはシェルバイナリの allowlist 追加）が必要です。
- プロンプトで「Always Allow」を選択すると、そのコマンドが allowlist に追加されます。
- `system.run` の環境オーバーライドはフィルタリングされ（`PATH`, `DYLD_*`, `LD_*`, `BASHOPTS`, `FPATH`, `KSH_ENV`, `NODE_OPTIONS`, `NODE_REDIRECT_WARNINGS`, `NODE_REPL_EXTERNAL_MODULE`, `NODE_REPL_HISTORY`, `NODE_V8_COVERAGE`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4`, `TCLLIBPATH` を削除）、その後アプリの環境とマージされます。
- シェルラッパー（`bash|sh|zsh ... -c/-lc`）では、リクエストスコープの環境オーバーライドは小さな明示的 allowlist（`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`）に縮小されます。
- allowlist モードで常に許可する判断をした場合、既知のディスパッチラッパー（`env`, `flock`, `nice`, `nohup`, `stdbuf`, `timeout`）は、ラッパーパスではなく内部の実行可能ファイルパスを永続化します。安全に展開できない場合、allowlist エントリは自動的には永続化されません。

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
- `key` がない場合、アプリは確認プロンプトのメッセージ長を短く制限し、`deliver` / `to` / `channel` を無視します。
- 有効な `key` がある場合、実行は無人になります（個人用自動化向け）。

## オンボーディングフロー（典型）

1. **OpenClaw.app** をインストールして起動します。
2. 権限チェックリスト（TCC プロンプト）を完了します。
3. **ローカル**モードが有効で、Gateway が実行中であることを確認します。
4. ターミナルアクセスが必要な場合は CLI をインストールします。

## state dir の配置（macOS）

OpenClaw の state dir は iCloud やその他のクラウド同期フォルダーに置かないでください。
同期されるパスではレイテンシが増え、セッションや認証情報でファイルロック/同期競合が
発生することがあります。

次のようなローカルの非同期 state パスを推奨します。
__OC_I18N_900005__
`openclaw doctor` が以下の配下の state を検出した場合:

- `~/Library/Mobile Documents/com~apple~CloudDocs/...`
- `~/Library/CloudStorage/...`

警告を出し、ローカルパスへ戻すことを推奨します。

## ビルドと開発ワークフロー（ネイティブ）

- `cd apps/macos && swift build`
- `swift run OpenClaw`（または Xcode）
- アプリをパッケージ化: `scripts/package-mac-app.sh`

## Gateway 接続のデバッグ（macOS CLI）

デバッグ CLI を使うと、macOS アプリを起動せずに、アプリが使うものと同じ Gateway WebSocket ハンドシェイクと検出ロジックを実行できます。
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
`openclaw gateway discover --json` と比較して、macOS アプリの検出パイプライン（`local.` と設定済みの wide-area ドメイン、wide-area と Tailscale Serve のフォールバック）が、Node CLI の `dns-sd` ベースの検出と異なるか確認してください。
</Tip>

## リモート接続の配管（SSH トンネル）

macOS アプリが **リモート**モードで実行されている場合、ローカル UI
コンポーネントがリモート Gateway と localhost 上にあるかのように通信できるよう、SSH トンネルを開きます。

### 制御トンネル（Gateway WebSocket ポート）

- **目的:** ヘルスチェック、ステータス、Web Chat、設定、その他のコントロールプレーン呼び出し。
- **ローカルポート:** Gateway ポート（デフォルト `18789`）。常に安定しています。
- **リモートポート:** リモートホスト上の同じ Gateway ポート。
- **動作:** ランダムなローカルポートは使いません。アプリは既存の正常なトンネルを再利用するか、
  必要に応じて再起動します。
- **SSH 形状:** `ssh -N -L <local>:127.0.0.1:<remote>` と BatchMode +
  ExitOnForwardFailure + keepalive オプション。
- **IP 報告:** SSH トンネルはループバックを使用するため、Gateway から見るノード
  IP は `127.0.0.1` になります。実際のクライアント IP を表示したい場合は
  **Direct (ws/wss)** トランスポートを使用してください（[macOS リモートアクセス](/ja-JP/platforms/mac/remote)を参照）。

セットアップ手順は [macOS リモートアクセス](/ja-JP/platforms/mac/remote)を参照してください。プロトコルの
詳細は [Gateway プロトコル](/ja-JP/gateway/protocol)を参照してください。

## 関連ドキュメント

- [Gateway ランブック](/ja-JP/gateway)
- [Gateway（macOS）](/ja-JP/platforms/mac/bundled-gateway)
- [macOS 権限](/ja-JP/platforms/mac/permissions)
- [Canvas](/ja-JP/platforms/mac/canvas)
