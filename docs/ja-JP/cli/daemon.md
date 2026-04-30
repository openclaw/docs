---
read_when:
    - スクリプトでまだ`openclaw daemon ...`を使用しています
    - サービスライフサイクルコマンド (install/start/stop/restart/status) が必要です
summary: '`openclaw daemon` の CLI リファレンス（Gateway サービス管理のレガシーエイリアス）'
title: デーモン
x-i18n:
    generated_at: "2026-04-30T05:04:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 51839f7cbc180cc0c43caa2d7e83cc2add7cbca40665f83f64e6ce9dde8574dd
    source_path: cli/daemon.md
    workflow: 16
---

# `openclaw daemon`

Gateway サービス管理コマンドのレガシーエイリアス。

`openclaw daemon ...` は、`openclaw gateway ...` サービスコマンドと同じサービス制御面に対応します。

## 使用方法

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
- ライフサイクル（`uninstall|start|stop|restart`）: `--json`

注記:

- `status` は、可能な場合、プローブ認証用に設定済みの認証 SecretRefs を解決します。
- 必須の認証 SecretRef がこのコマンドパスで未解決の場合、`daemon status --json` は、プローブの接続または認証が失敗したときに `rpc.authWarning` を報告します。`--token`/`--password` を明示的に渡すか、先にシークレットソースを解決してください。
- プローブが成功した場合、誤検知を避けるため、未解決の認証参照警告は抑制されます。
- `status --deep` は、ベストエフォートのシステムレベルサービススキャンを追加します。他の Gateway 風サービスが見つかった場合、人間向け出力ではクリーンアップのヒントを表示し、1 台のマシンにつき 1 つの Gateway が通常の推奨であることを警告します。
- Linux の systemd インストールでは、`status` のトークンドリフトチェックに `Environment=` と `EnvironmentFile=` の両方のユニットソースが含まれます。
- ドリフトチェックは、マージ済みのランタイム環境変数（まずサービスコマンド環境変数、その後にプロセス環境変数へフォールバック）を使用して `gateway.auth.token` SecretRefs を解決します。
- トークン認証が実質的に有効でない場合（明示的な `gateway.auth.mode` が `password`/`none`/`trusted-proxy`、またはモード未設定でパスワードが優先される可能性があり、かつトークン候補が優先され得ない場合）、トークンドリフトチェックは設定トークンの解決をスキップします。
- トークン認証にトークンが必要で、`gateway.auth.token` が SecretRef 管理の場合、`install` は SecretRef が解決可能であることを検証しますが、解決済みトークンをサービス環境メタデータへ永続化しません。
- トークン認証にトークンが必要で、設定済みトークン SecretRef が未解決の場合、インストールは安全側に倒れて失敗します。
- `gateway.auth.token` と `gateway.auth.password` の両方が設定され、`gateway.auth.mode` が未設定の場合、モードが明示的に設定されるまでインストールはブロックされます。
- macOS では、`install` は LaunchAgent plist を所有者限定のままにし、API キーや認証プロファイル環境参照を `EnvironmentVariables` にシリアライズする代わりに、所有者限定のファイルとラッパーを通じて管理対象サービス環境値を読み込みます。
- 1 つのホストで意図的に複数の Gateway を実行する場合は、ポート、設定/状態、ワークスペースを分離してください。[/gateway#multiple-gateways-same-host](/ja-JP/gateway#multiple-gateways-same-host) を参照してください。

## 推奨

現在のドキュメントと例には [`openclaw gateway`](/ja-JP/cli/gateway) を使用してください。

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [Gateway ランブック](/ja-JP/gateway)
