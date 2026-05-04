---
read_when:
    - スクリプト内でまだ `openclaw daemon ...` を使用しています
    - サービスのライフサイクルコマンド (install/start/stop/restart/status) が必要です
summary: '`openclaw daemon` の CLI リファレンス（Gateway サービス管理のレガシーエイリアス）'
title: デーモン
x-i18n:
    generated_at: "2026-05-04T18:23:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: f84e11fc50bdf38da518a8fcf415ae461a2688c2299f996eee384357c0d04a05
    source_path: cli/daemon.md
    workflow: 16
---

# `openclaw daemon`

Gateway サービス管理コマンドのレガシーエイリアスです。

`openclaw daemon ...` は、`openclaw gateway ...` サービスコマンドと同じサービス制御サーフェスに対応します。

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

- `status`: サービスのインストール状態を表示し、Gateway の健全性をプローブします
- `install`: サービスをインストールします（`launchd`/`systemd`/`schtasks`）
- `uninstall`: サービスを削除します
- `start`: サービスを開始します
- `stop`: サービスを停止します
- `restart`: サービスを再起動します

## 共通オプション

- `status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
- `install`: `--port`, `--runtime <node|bun>`, `--token`, `--force`, `--json`
- `restart`: `--safe`, `--force`, `--wait <duration>`, `--json`
- ライフサイクル（`uninstall|start|stop`）: `--json`

注記:

- `status` は、可能な場合はプローブ認証用に設定済みの認証 SecretRefs を解決します。
- このコマンドパスで必須の認証 SecretRef が未解決の場合、プローブの接続性または認証が失敗すると `daemon status --json` は `rpc.authWarning` を報告します。`--token`/`--password` を明示的に渡すか、先にシークレットソースを解決してください。
- プローブが成功した場合、誤検知を避けるため未解決の auth-ref 警告は抑制されます。
- `status --deep` は、ベストエフォートのシステムレベルサービススキャンを追加します。他の Gateway らしいサービスが見つかった場合、人間向け出力にはクリーンアップのヒントが表示され、1 台のマシンにつき 1 つの Gateway が通常の推奨であることを警告します。
- Linux systemd インストールでは、`status` のトークンドリフトチェックに `Environment=` と `EnvironmentFile=` の両方の unit ソースが含まれます。
- ドリフトチェックは、マージ済みランタイム env（最初にサービスコマンド env、次にプロセス env フォールバック）を使用して `gateway.auth.token` SecretRefs を解決します。
- トークン認証が実質的に有効でない場合（`gateway.auth.mode` が明示的に `password`/`none`/`trusted-proxy`、または mode が未設定で password が優先され、勝てるトークン候補がない場合）、トークンドリフトチェックは config トークン解決をスキップします。
- トークン認証でトークンが必要で、`gateway.auth.token` が SecretRef 管理の場合、`install` は SecretRef が解決可能であることを検証しますが、解決済みトークンをサービス環境メタデータには永続化しません。
- トークン認証でトークンが必要で、設定済みトークン SecretRef が未解決の場合、install はフェイルクローズします。
- `gateway.auth.token` と `gateway.auth.password` の両方が設定されていて、`gateway.auth.mode` が未設定の場合、mode が明示的に設定されるまで install はブロックされます。
- macOS では、`install` は LaunchAgent plists を owner-only に保ち、API キーや auth-profile env refs を `EnvironmentVariables` にシリアライズする代わりに、owner-only ファイルと wrapper を通じて管理対象サービス環境値を読み込みます。
- 1 台のホストで複数の Gateway を意図的に実行する場合は、ポート、config/state、ワークスペースを分離してください。[/gateway#multiple-gateways-same-host](/ja-JP/gateway#multiple-gateways-same-host) を参照してください。
- `restart --safe` は、実行中の Gateway にアクティブ作業をプリフライトし、アクティブ作業が排出された後に 1 回にまとめた再起動をスケジュールするよう求めます。通常の `restart` は既存のサービスマネージャー動作を維持し、`--force` は引き続き即時オーバーライドパスです。

## 推奨

最新のドキュメントと例には [`openclaw gateway`](/ja-JP/cli/gateway) を使用してください。

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [Gateway ランブック](/ja-JP/gateway)
