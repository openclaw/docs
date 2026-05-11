---
read_when:
    - スクリプト内でまだ `openclaw daemon ...` を使用しています
    - サービスライフサイクルコマンド (install/start/stop/restart/status) が必要です
summary: '`openclaw daemon` の CLI リファレンス（Gateway サービス管理のレガシーエイリアス）'
title: デーモン
x-i18n:
    generated_at: "2026-05-11T20:26:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0131c3838ac0240f38e755eb779134d19a935821d90bb2898648b947696be12e
    source_path: cli/daemon.md
    workflow: 16
---

# `openclaw daemon`

Gateway サービス管理コマンドのレガシーエイリアス。

`openclaw daemon ...` は、`openclaw gateway ...` サービスコマンドと同じサービス制御インターフェイスに対応します。

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
- `start`: サービスを開始する
- `stop`: サービスを停止する
- `restart`: サービスを再起動する

## 共通オプション

- `status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
- `install`: `--port`, `--runtime <node|bun>`, `--token`, `--force`, `--json`
- `restart`: `--safe`, `--skip-deferral`, `--force`, `--wait <duration>`, `--json`
- ライフサイクル（`uninstall|start|stop`）: `--json`

注記:

- `status` は、可能な場合、プローブ認証用に設定済みの認証 SecretRefs を解決します。
- このコマンドパスで必須の認証 SecretRef が未解決の場合、プローブの接続または認証が失敗すると、`daemon status --json` は `rpc.authWarning` を報告します。`--token`/`--password` を明示的に渡すか、先にシークレットソースを解決してください。
- プローブが成功した場合、誤検知を避けるため、未解決の auth-ref 警告は抑制されます。
- `status --deep` は、ベストエフォートのシステムレベルサービススキャンを追加します。他の Gateway 風サービスが見つかった場合、人間向け出力にはクリーンアップのヒントが表示され、マシン 1 台につき Gateway 1 つが引き続き通常の推奨であることを警告します。
- `status --deep` は、Plugin 対応モードで設定検証も実行し、設定済み Plugin マニフェスト警告（たとえばチャンネル設定メタデータの欠落）を表面化するため、インストールおよび更新のスモークチェックで検出できます。既定の `status` は、Plugin 検証をスキップする高速な読み取り専用パスを維持します。
- Linux systemd インストールでは、`status` のトークンドリフトチェックに `Environment=` と `EnvironmentFile=` の両方のユニットソースが含まれます。
- ドリフトチェックは、マージされたランタイム環境（最初にサービスコマンド環境、次にプロセス環境フォールバック）を使用して `gateway.auth.token` SecretRefs を解決します。
- トークン認証が実質的に有効でない場合（明示的な `gateway.auth.mode` が `password`/`none`/`trusted-proxy`、またはモード未設定でパスワードが優先され得る一方でトークン候補が優先され得ない場合）、トークンドリフトチェックは設定トークン解決をスキップします。
- トークン認証にトークンが必要で、`gateway.auth.token` が SecretRef 管理の場合、`install` は SecretRef が解決可能であることを検証しますが、解決済みトークンをサービス環境メタデータに永続化しません。
- トークン認証にトークンが必要で、設定済みトークン SecretRef が未解決の場合、インストールは安全側に倒して失敗します。
- `gateway.auth.token` と `gateway.auth.password` の両方が設定され、`gateway.auth.mode` が未設定の場合、モードが明示的に設定されるまでインストールはブロックされます。
- macOS では、`install` は LaunchAgent plists を所有者専用に保ち、API キーや auth-profile 環境参照を `EnvironmentVariables` にシリアライズする代わりに、所有者専用ファイルとラッパーを通じて管理対象サービス環境値を読み込みます。
- 1 つのホストで意図的に複数の Gateway を実行する場合は、ポート、設定/状態、ワークスペースを分離してください。[/gateway#multiple-gateways-same-host](/ja-JP/gateway#multiple-gateways-same-host) を参照してください。
- `restart --safe` は、実行中の Gateway にアクティブな作業の事前確認を依頼し、アクティブな作業が排出された後に 1 回にまとめた再起動をスケジュールします。通常の `restart` は既存のサービスマネージャー動作を維持します。`--force` は引き続き即時上書きパスです。
- `restart --safe --skip-deferral` は OpenClaw 対応の安全な再起動を実行しますが、アクティブ作業の延期ゲートを迂回するため、ブロッカーが報告されている場合でも Gateway はすぐに再起動を発行します。スタックしたタスク実行が安全な再起動を固定している場合のオペレーター用エスケープハッチです。`--safe` が必要です。

## 推奨

現在のドキュメントと例については [`openclaw gateway`](/ja-JP/cli/gateway) を使用してください。

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [Gateway ランブック](/ja-JP/gateway)
