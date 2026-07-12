---
read_when:
    - 同じマシン上で複数の Gateway を実行する
    - Gateway ごとに個別の設定・状態・ポートが必要です
summary: 1台のホストで複数のOpenClaw Gatewayを実行する（分離、ポート、プロファイル）
title: 複数の Gateway
x-i18n:
    generated_at: "2026-07-11T22:13:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3d5088d9bcfae6800217079365dcaec828a18ca19ac80c7ad7b4245d9059a986
    source_path: gateway/multiple-gateways.md
    workflow: 16
---

多くのセットアップでは Gateway は1つで十分です。1つの Gateway で複数のメッセージング接続とエージェントを処理できます。より強力な分離や冗長性が必要な場合（例: レスキューボット）に限り、プロファイルとポートを分離した複数の Gateway を実行してください。

## レスキューボットのクイックスタート

最もシンプルなレスキューボットのセットアップ:

- メインボットではデフォルトプロファイルを使用します。
- レスキューボットは、専用の Telegram ボットトークンを使用して `--profile rescue` で実行します。
- レスキューボットには別のベースポート（例: `19789`）を指定します。

これにより、プライマリボットが停止している場合でも、レスキューボットでデバッグや設定変更を行えます。派生するブラウザー/CDP ポートが衝突しないよう、ベースポート間は少なくとも20ポート空けてください。

```bash
# レスキューボット（別の Telegram ボット、別のプロファイル、ポート19789）
openclaw --profile rescue onboard
openclaw --profile rescue gateway install --port 19789
```

メインボットがすでに実行中であれば、通常はこれだけで十分です。オンボーディングですでにレスキューサービスがインストールされている場合は、最後の `gateway install` を省略してください。

`openclaw --profile rescue onboard` の実行中:

- レスキューアカウント専用の別の Telegram ボットトークンを使用します（オペレーター専用にしやすく、メインボットのチャンネル/アプリのインストールから独立しており、DM ベースのシンプルな復旧経路になります）。
- プロファイル名は `rescue` のままにします。
- メインボットより少なくとも20大きいベースポートを使用します。
- すでに独自に管理しているワークスペースがない限り、デフォルトのレスキューワークスペースを使用します。

### `--profile rescue onboard` による変更内容

`--profile rescue onboard` は通常のオンボーディングフローを実行しますが、すべてを別のプロファイルに書き込むため、レスキューボットには次のものが個別に用意されます。

- プロファイル/設定ファイル
- 状態ディレクトリ
- ワークスペース（デフォルト: `~/.openclaw/workspace-rescue`）
- 管理対象サービス名
- ベースポート（および派生ポート）
- Telegram ボットトークン

それ以外のプロンプトは通常のオンボーディングと同じです。

## 一般的な複数 Gateway のセットアップ

同じ分離パターンは、1台のホスト上にある任意の2つ以上の Gateway に適用できます。追加する各 Gateway に、固有の名前付きプロファイルとベースポートを指定します。

```bash
# メイン（デフォルトプロファイル）
openclaw setup
openclaw gateway --port 18789

# 追加の Gateway
openclaw --profile ops setup
openclaw --profile ops gateway --port 19789
```

両方で名前付きプロファイルを使用することもできます。

```bash
openclaw --profile main setup
openclaw --profile main gateway --port 18789

openclaw --profile ops setup
openclaw --profile ops gateway --port 19789
```

サービスでも同じパターンを使用します。

```bash
openclaw gateway install
openclaw --profile ops gateway install --port 19789
```

フォールバック用のオペレーター経路にはレスキューボットのクイックスタートを使用し、異なるチャンネル、テナント、ワークスペース、または運用上の役割にまたがって複数の Gateway を長期運用する場合は、一般的なプロファイルパターンを使用してください。

## 分離チェックリスト

Gateway インスタンスごとに、次の項目を固有にしてください。

| 設定                         | 目的                                           |
| ---------------------------- | ---------------------------------------------- |
| `OPENCLAW_CONFIG_PATH`       | インスタンスごとの設定ファイル                 |
| `OPENCLAW_STATE_DIR`         | インスタンスごとのセッション、認証情報、キャッシュ |
| `agents.defaults.workspace`  | インスタンスごとのワークスペースルート         |
| `gateway.port`（または `--port`） | インスタンスごとに固有                     |
| 派生するブラウザー/CDP ポート | 下記を参照                                     |

これらのいずれかを共有すると、設定の競合やポートの衝突が発生します。

## ポートマッピング（派生）

ベースポート = `gateway.port`（または `OPENCLAW_GATEWAY_PORT` / `--port`）。

- ブラウザー制御サービスのポート = ベース + 2（ループバックのみ）。
- Canvas ホストは Gateway の HTTP サーバー自体で提供されます（`gateway.port` と同じポート）。
- ブラウザープロファイルの CDP ポートは、`browser control port + 9` から `+ 108` の範囲で自動的に割り当てられます。

これらを設定または環境変数で上書きする場合は、インスタンスごとに固有の値を指定する必要があります。

## ブラウザー/CDP に関する注意事項（よくある落とし穴）

- 複数のインスタンスで `browser.cdpUrl` を同じ値に固定しては**なりません**。
- 各インスタンスには、固有のブラウザー制御ポートと CDP 範囲（Gateway ポートから派生）が必要です。
- CDP ポートを明示的に指定する場合は、インスタンスごとに `browser.profiles.<name>.cdpPort` を設定します。
- リモート Chrome の場合は、`browser.profiles.<name>.cdpUrl` を使用します（プロファイルごと、インスタンスごと）。

## 手動での環境変数設定例

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/main.json \
OPENCLAW_STATE_DIR=~/.openclaw \
openclaw gateway --port 18789

OPENCLAW_CONFIG_PATH=~/.openclaw/rescue.json \
OPENCLAW_STATE_DIR=~/.openclaw-rescue \
openclaw gateway --port 19789
```

## クイックチェック

```bash
openclaw gateway status --deep
openclaw --profile rescue gateway status --deep
openclaw --profile rescue gateway probe
openclaw status
openclaw --profile rescue status
openclaw --profile rescue browser status
```

- `gateway status --deep` は、古いインストールに由来する残存した launchd/systemd/schtasks サービスを検出します。
- `multiple reachable gateway identities detected` のような `gateway probe` の警告テキストが想定されるのは、複数の分離された Gateway を意図的に実行している場合、または到達可能なプローブ対象が同じ Gateway であることを OpenClaw が確認できない場合のみです。同じ Gateway への SSH トンネル、プロキシ URL、または設定済みのリモート URL は、転送ポートが異なる場合でも、複数の転送経路を持つ1つの Gateway です。

## 関連項目

- [Gateway 運用手順書](/ja-JP/gateway)
- [Gateway ロック](/ja-JP/gateway/gateway-lock)
- [設定](/ja-JP/gateway/configuration)
