---
read_when:
    - まだスクリプトで `openclaw daemon ...` を使用しています
    - サービスライフサイクルコマンド (install/start/stop/restart/status) が必要です
summary: '`openclaw daemon` の CLI リファレンス（Gateway サービス管理の従来のエイリアス）'
title: デーモン
x-i18n:
    generated_at: "2026-05-10T19:27:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: b1951ade64d538130e4f04954cc8dec136f54a78b1fdf94e6ce988ded8cab516
    source_path: cli/daemon.md
    workflow: 16
---

# `openclaw daemon`

Gateway サービス管理コマンドのレガシーエイリアス。

`openclaw daemon ...` は、`openclaw gateway ...` サービスコマンドと同じサービス制御面に対応します。

## 使用法

```bash
openclaw daemon status
openclaw daemon install
openclaw daemon start
openclaw daemon stop
openclaw daemon restart
openclaw daemon uninstall
```

## サブコマンド

- `status`: サービスのインストール状態を表示し、Gateway の健全性をプローブする
- `install`: サービスをインストールする（`launchd`/`systemd`/`schtasks`）
- `uninstall`: サービスを削除する
- `start`: サービスを開始する
- `stop`: サービスを停止する
- `restart`: サービスを再起動する

## 共通オプション

- `status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
- `install`: `--port`, `--runtime <node|bun>`, `--token`, `--force`, `--json`
- `restart`: `--safe`, `--skip-deferral`, `--force`, `--wait <duration>`, `--json`
- ライフサイクル（`uninstall|start|stop`）: `--json`

注記:

- `status` は、可能な場合、プローブ認証用に設定済みの認証 SecretRef を解決します。
- このコマンドパスで必須の認証 SecretRef が解決されていない場合、プローブの接続性または認証が失敗すると、`daemon status --json` は `rpc.authWarning` を報告します。`--token`/`--password` を明示的に渡すか、先にシークレットソースを解決してください。
- プローブが成功した場合、誤検出を避けるため、未解決の認証参照警告は抑制されます。
- `status --deep` は、ベストエフォートのシステムレベルのサービススキャンを追加します。他の Gateway らしきサービスが見つかった場合、人間向け出力にはクリーンアップのヒントが表示され、1 台のマシンにつき 1 つの Gateway が通常の推奨事項であることを警告します。
- Linux の systemd インストールでは、`status` のトークンドリフトチェックに `Environment=` と `EnvironmentFile=` の両方のユニットソースが含まれます。
- ドリフトチェックは、マージされたランタイム環境（最初にサービスコマンド環境、次にフォールバックとしてプロセス環境）を使用して `gateway.auth.token` SecretRef を解決します。
- トークン認証が実質的に有効でない場合（`gateway.auth.mode` が `password`/`none`/`trusted-proxy` に明示されている、またはモード未設定でパスワードが優先され、トークン候補が優先されない場合）、トークンドリフトチェックは設定トークンの解決をスキップします。
- トークン認証にトークンが必要で、`gateway.auth.token` が SecretRef 管理の場合、`install` は SecretRef が解決可能であることを検証しますが、解決済みトークンをサービス環境メタデータには永続化しません。
- トークン認証にトークンが必要で、設定済みトークン SecretRef が未解決の場合、インストールは安全側に倒して失敗します。
- `gateway.auth.token` と `gateway.auth.password` の両方が設定され、`gateway.auth.mode` が未設定の場合、モードが明示的に設定されるまでインストールはブロックされます。
- macOS では、`install` は LaunchAgent plist を所有者のみが扱える状態に保ち、API キーや認証プロファイルの環境参照を `EnvironmentVariables` にシリアライズする代わりに、所有者専用ファイルとラッパーを通じて管理対象サービス環境値を読み込みます。
- 1 つのホスト上で意図的に複数の Gateway を実行する場合は、ポート、設定/状態、ワークスペースを分離してください。[/gateway#multiple-gateways-same-host](/ja-JP/gateway#multiple-gateways-same-host) を参照してください。
- `restart --safe` は、実行中の Gateway にアクティブな作業を事前確認させ、アクティブな作業が排出された後に 1 回にまとめた再起動をスケジュールします。通常の `restart` は既存のサービスマネージャー動作を維持します。`--force` は引き続き即時上書きパスです。
- `restart --safe --skip-deferral` は OpenClaw 対応の安全な再起動を実行しますが、アクティブ作業の延期ゲートを迂回するため、ブロッカーが報告されている場合でも Gateway は再起動を即座に発行します。スタックしたタスク実行によって安全な再起動が固定される場合のオペレーター向け脱出口です。`--safe` が必要です。

## 推奨

現在のドキュメントと例には [`openclaw gateway`](/ja-JP/cli/gateway) を使用してください。

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [Gateway ランブック](/ja-JP/gateway)
