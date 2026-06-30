---
read_when:
    - まだ scripts で `openclaw daemon ...` を使用しています
    - サービスライフサイクルコマンド（インストール/開始/停止/再起動/ステータス）が必要です
summary: '`openclaw daemon` の CLI リファレンス（Gateway サービス管理の従来のエイリアス）'
title: デーモン
x-i18n:
    generated_at: "2026-06-30T13:47:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1a3ec72b22907994ecefac84b2b9e5b22bf1d922e5b2822a1c0db80f0362dade
    source_path: cli/daemon.md
    workflow: 16
---

# `openclaw daemon`

Gateway サービス管理コマンドのレガシーエイリアス。

`openclaw daemon ...` は、`openclaw gateway ...` サービスコマンドと同じサービス制御面にマップされます。

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
- `start`: サービスを起動する
- `stop`: サービスを停止する
- `restart`: サービスを再起動する

## 共通オプション

- `status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
- `install`: `--port`, `--runtime <node|bun>`, `--token`, `--force`, `--json`
- `restart`: `--safe`, `--skip-deferral`, `--force`, `--wait <duration>`, `--json`
- ライフサイクル（`uninstall|start|stop`）: `--json`

注:

- `status` は、可能な場合にプローブ認証用として設定済みの認証 SecretRefs を解決します。
- このコマンドパスで必須の認証 SecretRef が未解決の場合、プローブ接続または認証に失敗すると `daemon status --json` は `rpc.authWarning` を報告します。`--token`/`--password` を明示的に渡すか、先にシークレットソースを解決してください。
- プローブが成功した場合、未解決の認証参照警告は誤検知を避けるため抑制されます。
- `status --deep` は、ベストエフォートのシステムレベルのサービススキャンを追加します。他の Gateway らしいサービスを見つけると、人間向け出力にはクリーンアップのヒントが表示され、1 台のマシンにつき 1 つの Gateway が通常の推奨であることを警告します。
- `status --deep` は Plugin 対応モードで設定検証も実行し、設定済み Plugin マニフェストの警告（たとえばチャンネル設定メタデータの欠落）を表面化するため、インストールと更新のスモークチェックで検出できます。既定の `status` は、Plugin 検証をスキップする高速な読み取り専用パスを維持します。
- Linux systemd インストールでは、`status` のトークンドリフトチェックに `Environment=` と `EnvironmentFile=` の両方のユニットソースが含まれます。
- ドリフトチェックは、マージ済みランタイム env（まずサービスコマンドの env、次にプロセス env フォールバック）を使って `gateway.auth.token` SecretRefs を解決します。
- トークン認証が実質的に有効でない場合（明示的な `gateway.auth.mode` が `password`/`none`/`trusted-proxy`、またはモード未設定でパスワードが優先され得て、トークン候補が優先され得ない場合）、トークンドリフトチェックは設定トークンの解決をスキップします。
- トークン認証にトークンが必要で、`gateway.auth.token` が SecretRef 管理の場合、`install` は SecretRef が解決可能であることを検証しますが、解決済みトークンをサービス環境メタデータに永続化しません。
- トークン認証にトークンが必要で、設定済みトークン SecretRef が未解決の場合、インストールはフェイルクローズします。
- `gateway.auth.token` と `gateway.auth.password` の両方が設定され、`gateway.auth.mode` が未設定の場合、モードが明示的に設定されるまでインストールはブロックされます。
- macOS では、`install` は LaunchAgent plists を所有者専用に保ち、API キーや認証プロファイルの env 参照を `EnvironmentVariables` にシリアライズする代わりに、所有者専用ファイルとラッパーを通じて管理対象サービス環境値を読み込みます。
- 1 つのホストで複数の Gateway を意図的に実行する場合は、ポート、設定/状態、ワークスペースを分離してください。[/gateway#multiple-gateways-same-host](/ja-JP/gateway#multiple-gateways-same-host) を参照してください。
- `restart --safe` は、実行中の Gateway にアクティブな作業を事前確認し、アクティブな作業が排出された後に 1 回の集約された再起動をスケジュールするよう要求します。既定の安全な再起動は、設定済みの `gateway.reload.deferralTimeoutMs`（既定 5 分）までアクティブな作業を待機します。その予算を使い切ると再起動は強制されます。強制しない無期限の安全待機にするには、`gateway.reload.deferralTimeoutMs` を `0` に設定してください。通常の `restart` は既存のサービスマネージャーの挙動を維持します。`--force` は即時上書きパスのままです。
- `restart --safe --skip-deferral` は OpenClaw 対応の安全な再起動を実行しますが、アクティブ作業の遅延ゲートをバイパスするため、ブロッカーが報告されていても Gateway は即座に再起動を発行します。停止したタスク実行が安全な再起動を固定している場合のオペレーター向け脱出口です。`--safe` が必要です。

## 推奨

現在のドキュメントと例には [`openclaw gateway`](/ja-JP/cli/gateway) を使用してください。

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [Gateway ランブック](/ja-JP/gateway)
