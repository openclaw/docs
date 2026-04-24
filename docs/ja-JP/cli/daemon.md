---
read_when:
    - スクリプトで今も `openclaw daemon ...` を使用している場合
    - サービスのライフサイクルコマンド（install/start/stop/restart/status）が必要な場合
summary: '`openclaw daemon` の CLI リファレンス（Gateway サービス管理の旧来のエイリアス）'
title: デーモン
x-i18n:
    generated_at: "2026-04-24T04:50:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: b492768b46c459b69cd3127c375e0c573db56c76572fdbf7b2b8eecb3e9835ce
    source_path: cli/daemon.md
    workflow: 15
---

# `openclaw daemon`

Gateway サービス管理コマンドの旧来のエイリアスです。

`openclaw daemon ...` は、`openclaw gateway ...` のサービスコマンドと同じサービス制御サーフェスにマッピングされます。

## 使い方

```bash
openclaw daemon status
openclaw daemon install
openclaw daemon start
openclaw daemon stop
openclaw daemon restart
openclaw daemon uninstall
```

## サブコマンド

- `status`: サービスのインストール状態を表示し、Gateway のヘルスをプローブする
- `install`: サービスをインストールする（`launchd`/`systemd`/`schtasks`）
- `uninstall`: サービスを削除する
- `start`: サービスを起動する
- `stop`: サービスを停止する
- `restart`: サービスを再起動する

## 共通オプション

- `status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
- `install`: `--port`, `--runtime <node|bun>`, `--token`, `--force`, `--json`
- ライフサイクル（`uninstall|start|stop|restart`）: `--json`

注意:

- `status` は、可能な場合、プローブ認証のために設定済みの認証 SecretRef を解決します。
- このコマンドパスで必要な認証 SecretRef が未解決の場合、`daemon status --json` は、プローブ接続/認証が失敗したときに `rpc.authWarning` を報告します。`--token`/`--password` を明示的に渡すか、先にシークレットソースを解決してください。
- プローブが成功した場合、誤検知を避けるため、未解決 auth-ref 警告は抑制されます。
- `status --deep` は、ベストエフォートのシステムレベルサービススキャンを追加します。他の Gateway 類似サービスを検出した場合、人間向け出力ではクリーンアップのヒントを表示し、1 台のマシンにつき 1 つの Gateway が依然として通常の推奨であることを警告します。
- Linux の systemd インストールでは、`status` のトークンドリフトチェックには `Environment=` と `EnvironmentFile=` の両方の unit ソースが含まれます。
- ドリフトチェックは、マージ済みランタイム環境（まずサービスコマンド環境、次にプロセス環境へのフォールバック）を使って `gateway.auth.token` SecretRef を解決します。
- トークン認証が実質的に有効でない場合（`gateway.auth.mode` が明示的に `password`/`none`/`trusted-proxy`、または mode 未設定で password が優先されうるうえ、トークン候補が有効になりえない場合）、トークンドリフトチェックは設定トークンの解決をスキップします。
- トークン認証にトークンが必要で、`gateway.auth.token` が SecretRef 管理の場合、`install` はその SecretRef が解決可能であることを検証しますが、解決済みトークンをサービス環境メタデータに永続化しません。
- トークン認証にトークンが必要で、設定されたトークン SecretRef が未解決の場合、インストールは fail-closed で失敗します。
- `gateway.auth.token` と `gateway.auth.password` の両方が設定されており、`gateway.auth.mode` が未設定の場合、mode が明示的に設定されるまでインストールはブロックされます。
- 意図的に 1 台のホストで複数の Gateway を実行する場合は、ポート、config/state、workspace を分離してください。[/gateway#multiple-gateways-same-host](/ja-JP/gateway#multiple-gateways-same-host) を参照してください。

## 推奨

最新のドキュメントと例については [`openclaw gateway`](/ja-JP/cli/gateway) を使用してください。

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [Gateway ランブック](/ja-JP/gateway)
