---
read_when:
    - スクリプトでは引き続き `openclaw daemon ...` を使用します
    - サービスのライフサイクルコマンド（インストール/起動/停止/再起動/ステータス）が必要です
summary: '`openclaw daemon` のCLIリファレンス（Gatewayサービス管理用のレガシーエイリアス）'
title: デーモン
x-i18n:
    generated_at: "2026-07-11T22:07:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4933885078d067ff2e077f25f14483aa5a10e3cd36951d0dc25c625d8b4d78e6
    source_path: cli/daemon.md
    workflow: 16
---

# `openclaw daemon`

Gatewayサービス管理用のレガシーエイリアスです。`openclaw daemon ...`は、`openclaw gateway ...`と同じサービス制御コマンドに対応します。最新のドキュメントと例については、[`openclaw gateway`](/ja-JP/cli/gateway)を使用してください。

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
| `install`   | `--port`, `--runtime <node\|bun>`, `--token`, `--wrapper <path>`, `--force`, `--json`            |
| `uninstall` | `--json`                                                                                         |
| `start`     | `--json`                                                                                         |
| `stop`      | `--json`, `--disable`（launchdのみ：次回の起動までKeepAlive/RunAtLoadを継続的に抑止） |
| `restart`   | `--force`, `--safe`, `--skip-deferral`, `--wait <duration>`, `--json`                            |

- `status`：サービスのインストール状態（launchd/systemd/schtasks）を表示し、Gatewayの正常性を検査します。
- `install`：サービスをインストールします。`--force`を指定すると、既存のインストールを再インストールまたは上書きします。
- `restart --safe`：実行中のGatewayに対し、進行中の処理を事前確認し、処理が完了した後に統合された1回の再起動をスケジュールするよう要求します。待機時間は`gateway.reload.deferralTimeoutMs`（デフォルトは300000ミリ秒／5分、無期限に待機するには`0`を設定）で制限されます。この時間を超えると、再起動は強制的に実行されます。通常の`restart`はサービスマネージャーを直接使用し、`--force`は即時実行を強制します。
- `restart --safe --skip-deferral`：進行中の処理による延期ゲートを回避し、ブロッカーが報告されている場合でもGatewayを直ちに再起動します。`--safe`が必要です。

## 注意事項

- `status`は、可能な場合、検査時の認証用に設定済みの認証SecretRefを解決します。必須のSecretRefを解決できない場合、`status --json`は`rpc.authWarning`を報告します。`--token`／`--password`を明示的に渡すか、先にシークレットのソースを解決してください。検査がそれ以外の点で成功すると、未解決の認証に関する警告は表示されなくなります。
- `status --deep`は、Gatewayに類似する他のサービスを対象に、ベストエフォート方式のシステムレベルスキャンを追加します（クリーンアップのヒントを表示しますが、マシン1台につきGatewayを1つにすることを引き続き推奨します）。また、Pluginを認識するモードで設定検証を実行し、高速なデフォルト経路では省略されるPluginマニフェストの警告を表示します。
- Linuxのsystemdインストールでは、トークンの差異チェックによって`Environment=`と`EnvironmentFile=`の両方のユニットソースが検査されます。
- トークンの差異チェックでは、統合された実行時環境変数（最初にサービスコマンドの環境変数、次にプロセスの環境変数）を使用して、`gateway.auth.token`のSecretRefを解決します。トークン認証が実質的に有効でない場合（`gateway.auth.mode`が`password`／`none`／`trusted-proxy`である場合、または未設定でパスワード認証が優先される場合）、設定トークンの解決はスキップされます。
- `install`は、SecretRefで管理される`gateway.auth.token`が解決可能であることを検証しますが、解決した値をサービス環境のメタデータに保存することはありません。解決できない場合、インストールは安全側に倒して失敗します。
- `gateway.auth.token`と`gateway.auth.password`の両方が設定され、`gateway.auth.mode`が未設定の場合、モードを明示的に設定するまで`install`は処理を停止します。
- macOSでは、`install`はシークレットを`EnvironmentVariables`に埋め込む代わりに、LaunchAgentのplistと生成された環境変数ファイル／ラッパーを所有者のみがアクセス可能な状態（モード`0600`／`0700`）に保ちます。
- 1台のホストで複数のGatewayを実行する場合は、ポート、設定／状態、およびワークスペースを分離してください。[複数のGateway](/ja-JP/gateway#multiple-gateways-same-host)を参照してください。

## 関連項目

- [CLIリファレンス](/ja-JP/cli)
- [Gateway運用手順書](/ja-JP/gateway)
