---
read_when:
    - スクリプトでは引き続き `openclaw daemon ...` を使用します
    - サービスのライフサイクルコマンド（インストール/起動/停止/再起動/状態確認）が必要です
summary: '`openclaw daemon` のCLIリファレンス（Gatewayサービス管理用のレガシーエイリアス）'
title: デーモン
x-i18n:
    generated_at: "2026-07-16T11:30:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: a5e08114a8a0de959b54fcb0fcef88b880424fd89c133f7c383f254d18f0d71d
    source_path: cli/daemon.md
    workflow: 16
---

# `openclaw daemon`

Gateway サービス管理用のレガシーエイリアスです。`openclaw daemon ...` は、`openclaw gateway ...` と同じサービス制御コマンドにマッピングされます。現在のドキュメントと例については、[`openclaw gateway`](/ja-JP/cli/gateway) を使用してください。

## 使用方法

```bash
openclaw daemon status
openclaw daemon install
openclaw daemon start
openclaw daemon stop
openclaw daemon restart
openclaw daemon uninstall
```

## サブコマンドとオプション

| サブコマンド  | オプション                                                                                          |
| ----------- | ------------------------------------------------------------------------------------------------ |
| `status`    | `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json` |
| `install`   | `--port`, `--runtime <node>`, `--token`, `--wrapper <path>`, `--force`, `--json`                 |
| `uninstall` | `--json`                                                                                         |
| `start`     | `--json`                                                                                         |
| `stop`      | `--json`, `--disable`（launchd のみ：次回起動まで KeepAlive/RunAtLoad を永続的に抑制） |
| `restart`   | `--force`, `--safe`, `--skip-deferral`, `--wait <duration>`, `--json`                            |

- `status`：サービスのインストール状態（launchd/systemd/schtasks）を表示し、Gateway の正常性をプローブします。
- `install`：サービスをインストールします。`--force` を指定すると、既存のインストールを再インストールまたは上書きします。
- `restart --safe`：実行中の Gateway に対して、アクティブな処理の事前確認を行い、処理が完了した後に統合された再起動を 1 回スケジュールするよう要求します。待機時間は `gateway.reload.deferralTimeoutMs` で制限されます（デフォルトは 300000ms/5 分。無期限に待機するには `0` に設定します）。この時間制限を超えると、いずれの場合も再起動が強制されます。通常の `restart` はサービスマネージャーを直接使用します。`--force` は即時実行のオーバーライドです。
- `restart --safe --skip-deferral`：アクティブな処理の延期ゲートをバイパスし、ブロッカーが報告されている場合でも Gateway を即座に再起動します。`--safe` が必要です。

## 注意事項

- `status` は、可能な場合、プローブ認証用に設定された認証 SecretRef を解決します。必要な SecretRef が未解決の場合、`status --json` は `rpc.authWarning` を報告します。`--token`/`--password` を明示的に渡すか、先にシークレットソースを解決してください。プローブがそれ以外の点で成功すると、未解決の認証に関する警告は抑制されます。
- `status --deep` は、Gateway に類似する他のサービスをシステムレベルでベストエフォート方式により追加スキャンし（クリーンアップのヒントを表示します。引き続きマシンごとに Gateway を 1 つにすることを推奨します）、Plugin 対応モードで設定検証を実行して、高速なデフォルトパスでは省略される Plugin マニフェストの警告を表示します。
- Linux の systemd インストールでは、トークンの差異チェックにより `Environment=` と `EnvironmentFile=` の両方のユニットソースが検査されます。
- トークンの差異チェックでは、マージされたランタイム環境（最初にサービスコマンド環境、次にプロセス環境）を使用して `gateway.auth.token` SecretRef を解決します。トークン認証が実質的に有効でない場合（`password`/`none`/`trusted-proxy` の `gateway.auth.mode`、または未設定でパスワードが優先され得る場合）、設定トークンの解決はスキップされます。
- `install` は、SecretRef で管理される `gateway.auth.token` が解決可能であることを検証しますが、解決された値をサービス環境のメタデータに永続化することはありません。解決できない場合、インストールは安全側に失敗します。
- `gateway.auth.token` と `gateway.auth.password` の両方が設定され、`gateway.auth.mode` が未設定の場合、モードを明示的に設定するまで `install` は処理をブロックします。
- macOS では、`install` はシークレットを `EnvironmentVariables` に埋め込む代わりに、LaunchAgent の plist と生成された環境ファイル／ラッパーを所有者のみがアクセス可能な状態（モード `0600`/`0700`）に保ちます。
- 1 台のホストで複数の Gateway を実行する場合は、ポート、設定／状態、ワークスペースを分離してください。[複数の Gateway](/ja-JP/gateway#multiple-gateways-same-host)を参照してください。

## 関連情報

- [CLI リファレンス](/ja-JP/cli)
- [Gateway 運用手順書](/ja-JP/gateway)
