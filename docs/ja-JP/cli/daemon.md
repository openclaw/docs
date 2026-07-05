---
read_when:
    - スクリプト内でまだ `openclaw daemon ...` を使用しています
    - サービスのライフサイクルコマンド（install/start/stop/restart/status）が必要です
summary: '`openclaw daemon` の CLI リファレンス（Gateway サービス管理のレガシーエイリアス）'
title: デーモン
x-i18n:
    generated_at: "2026-07-05T11:11:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4933885078d067ff2e077f25f14483aa5a10e3cd36951d0dc25c625d8b4d78e6
    source_path: cli/daemon.md
    workflow: 16
---

# `openclaw daemon`

Gateway サービス管理のレガシーエイリアスです。`openclaw daemon ...` は、`openclaw gateway ...` と同じサービス制御コマンドに対応します。現在のドキュメントと例では [`openclaw gateway`](/ja-JP/cli/gateway) を優先してください。

## 使い方

```bash
openclaw daemon status
openclaw daemon install
openclaw daemon start
openclaw daemon stop
openclaw daemon restart
openclaw daemon uninstall
```

## サブコマンドとオプション

| サブコマンド | オプション                                                                                       |
| ----------- | ------------------------------------------------------------------------------------------------ |
| `status`    | `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json` |
| `install`   | `--port`, `--runtime <node\|bun>`, `--token`, `--wrapper <path>`, `--force`, `--json`            |
| `uninstall` | `--json`                                                                                         |
| `start`     | `--json`                                                                                         |
| `stop`      | `--json`, `--disable` (launchd のみ: 次回開始まで KeepAlive/RunAtLoad を永続的に抑制) |
| `restart`   | `--force`, `--safe`, `--skip-deferral`, `--wait <duration>`, `--json`                            |

- `status`: サービスのインストール状態 (launchd/systemd/schtasks) を表示し、Gateway のヘルスをプローブします。
- `install`: サービスをインストールします。`--force` は既存のインストールを再インストールまたは上書きします。
- `restart --safe`: 実行中の Gateway に、アクティブな作業を事前確認し、作業が排出された後に 1 回にまとめた再起動をスケジュールするよう要求します。これは `gateway.reload.deferralTimeoutMs` (デフォルト 300000ms/5 分、無期限に待つには `0` に設定) によって制限されます。その予算が期限切れになると、再起動はそれでも強制されます。通常の `restart` はサービスマネージャーを直接使用します。`--force` は即時オーバーライドです。
- `restart --safe --skip-deferral`: アクティブ作業の延期ゲートをバイパスし、ブロッカーが報告されていても Gateway を即座に再起動します。`--safe` が必要です。

## 注意

- `status` は、可能な場合、プローブ認証用に構成済みの認証 SecretRefs を解決します。必要な SecretRef が未解決の場合、`status --json` は `rpc.authWarning` を報告します。`--token`/`--password` を明示的に渡すか、先にシークレットソースを解決してください。未解決認証の警告は、それ以外のプローブが成功すると抑制されます。
- `status --deep` は、他の Gateway 風サービスに対するベストエフォートのシステムレベルスキャンを追加し (クリーンアップのヒントを出力します。1 台のマシンにつき 1 つの Gateway が引き続き推奨です)、Plugin 対応モードで構成検証を実行して、高速なデフォルトパスではスキップされる Plugin マニフェスト警告を表示します。
- Linux systemd インストールでは、トークンドリフトチェックが `Environment=` と `EnvironmentFile=` の両方の unit ソースを検査します。
- トークンドリフトチェックは、マージされたランタイム環境 (先にサービスコマンド環境、その後にプロセス環境) を使用して `gateway.auth.token` SecretRefs を解決します。トークン認証が実質的にアクティブでない場合 (`gateway.auth.mode` が `password`/`none`/`trusted-proxy`、または未設定でパスワードが優先され得る場合)、構成トークンの解決はスキップされます。
- `install` は SecretRef 管理の `gateway.auth.token` が解決可能であることを検証しますが、解決された値をサービス環境メタデータに永続化することはありません。解決できない場合、インストールはフェイルクローズします。
- `gateway.auth.token` と `gateway.auth.password` の両方が構成されていて、`gateway.auth.mode` が未設定の場合、`install` はモードを明示的に設定するまでブロックします。
- macOS では、`install` はシークレットを `EnvironmentVariables` に埋め込む代わりに、LaunchAgent plist と生成された環境ファイル/ラッパーを所有者のみ (モード `0600`/`0700`) に保ちます。
- 1 台のホストで複数の Gateway を実行する場合: ポート、構成/状態、ワークスペースを分離してください。[複数の Gateway](/ja-JP/gateway#multiple-gateways-same-host) を参照してください。

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [Gateway ランブック](/ja-JP/gateway)
