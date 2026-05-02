---
read_when:
    - スクリプトではまだ `openclaw daemon ...` を使用しています
    - サービスのライフサイクルコマンド (install/start/stop/restart/status) が必要です
summary: '`openclaw daemon` の CLI リファレンス（Gateway サービス管理のレガシーエイリアス）'
title: デーモン
x-i18n:
    generated_at: "2026-05-02T22:17:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3f11b75bf2781e69f6f59b23364f06cf359f9f24407f25f19b9d2186f7158512
    source_path: cli/daemon.md
    workflow: 16
---

# `openclaw daemon`

Gateway サービス管理コマンドのレガシーエイリアス。

`openclaw daemon ...` は `openclaw gateway ...` サービスコマンドと同じサービス制御サーフェスに対応します。

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
- `restart`: `--force`, `--wait <duration>`, `--json`
- ライフサイクル（`uninstall|start|stop`）: `--json`

注記:

- `status` は、可能な場合にプローブ認証用として設定済みの認証 SecretRefs を解決します。
- このコマンドパスで必須の認証 SecretRef が未解決の場合、プローブの接続性または認証に失敗すると `daemon status --json` は `rpc.authWarning` を報告します。`--token`/`--password` を明示的に渡すか、先にシークレットソースを解決してください。
- プローブが成功した場合、誤検知を避けるために未解決の auth-ref 警告は抑制されます。
- `status --deep` は、ベストエフォートのシステムレベルサービススキャンを追加します。他の gateway らしいサービスが見つかった場合、人間向け出力ではクリーンアップのヒントを表示し、1 台のマシンにつき 1 つの gateway が通常の推奨であることを警告します。
- Linux systemd インストールでは、`status` のトークンドリフトチェックに `Environment=` と `EnvironmentFile=` の両方の unit ソースが含まれます。
- ドリフトチェックは、マージされたランタイム env（最初にサービスコマンド env、次にプロセス env フォールバック）を使用して `gateway.auth.token` SecretRefs を解決します。
- トークン認証が実質的に有効でない場合（明示的な `gateway.auth.mode` が `password`/`none`/`trusted-proxy`、または mode が未設定で password が優先され得て、勝てる token 候補がない場合）、トークンドリフトチェックは設定トークン解決をスキップします。
- トークン認証にトークンが必要で、`gateway.auth.token` が SecretRef 管理の場合、`install` は SecretRef が解決可能であることを検証しますが、解決されたトークンをサービス環境メタデータに永続化しません。
- トークン認証にトークンが必要で、設定されたトークン SecretRef が未解決の場合、インストールはクローズドに失敗します。
- `gateway.auth.token` と `gateway.auth.password` の両方が設定され、`gateway.auth.mode` が未設定の場合、mode が明示的に設定されるまでインストールはブロックされます。
- macOS では、`install` は LaunchAgent plist を所有者専用に保ち、API キーや auth-profile env 参照を `EnvironmentVariables` にシリアライズする代わりに、所有者専用ファイルとラッパーを通じて管理対象サービス環境値を読み込みます。
- 1 つのホストで意図的に複数の gateways を実行する場合は、ポート、設定/状態、ワークスペースを分離してください。[/gateway#multiple-gateways-same-host](/ja-JP/gateway#multiple-gateways-same-host) を参照してください。

## 推奨

現在のドキュメントと例については、[`openclaw gateway`](/ja-JP/cli/gateway) を使用してください。

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [Gateway ランブック](/ja-JP/gateway)
