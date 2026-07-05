---
read_when:
    - 同じマシンで複数の Gateway を実行する
    - Gateway ごとに分離された設定/状態/ポートが必要です
summary: 1台のホストで複数の OpenClaw Gateway を実行する（分離、ポート、プロファイル）
title: 複数のGateway
x-i18n:
    generated_at: "2026-07-05T11:22:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3d5088d9bcfae6800217079365dcaec828a18ca19ac80c7ad7b4245d9059a986
    source_path: gateway/multiple-gateways.md
    workflow: 16
---

ほとんどのセットアップでは Gateway は 1 つで十分です。1 つの Gateway が複数のメッセージング接続とエージェントを処理します。より強い分離や冗長性が必要な場合（例: レスキューボット）にのみ、分離されたプロファイル/ポートで別々の Gateway を実行してください。

## レスキューボットのクイックスタート

最もシンプルなレスキューボットのセットアップ:

- メインボットはデフォルトプロファイルのままにします。
- レスキューボットは `--profile rescue` で実行し、専用の Telegram ボットトークンを使います。
- レスキューボットには別のベースポートを割り当てます。例: `19789`。

これにより、プライマリボットが停止している場合でも、レスキューボットでデバッグや設定変更を適用できます。派生するブラウザー/CDP ポートが衝突しないように、ベースポート間は少なくとも 20 ポート空けてください。

```bash
# Rescue bot (separate Telegram bot, separate profile, port 19789)
openclaw --profile rescue onboard
openclaw --profile rescue gateway install --port 19789
```

メインボットがすでに実行中なら、通常はこれだけで十分です。オンボーディングですでにレスキューサービスがインストールされている場合は、最後の `gateway install` を省略してください。

`openclaw --profile rescue onboard` の実行中:

- レスキューアカウント専用の別の Telegram ボットトークンを使います（オペレーター専用に保ちやすく、メインボットのチャンネル/アプリインストールから独立し、DM ベースのシンプルな復旧経路になります）。
- `rescue` プロファイル名を維持します。
- メインボットより少なくとも 20 高いベースポートを使います。
- すでに自分で管理しているワークスペースがない限り、デフォルトのレスキューワークスペースを受け入れます。

### `--profile rescue onboard` が変更するもの

`--profile rescue onboard` は通常のオンボーディングフローを実行しますが、すべてを別のプロファイルに書き込むため、レスキューボットには専用の次のものが割り当てられます。

- プロファイル/設定ファイル
- 状態ディレクトリ
- ワークスペース（デフォルト: `~/.openclaw/workspace-rescue`）
- 管理サービス名
- ベースポート（および派生ポート）
- Telegram ボットトークン

それ以外のプロンプトは通常のオンボーディングと同じです。

## 一般的なマルチ Gateway セットアップ

同じ分離パターンは、1 台のホスト上の任意の 2 つ以上の Gateway に使えます。追加の各 Gateway に専用の名前付きプロファイルとベースポートを割り当てます。

```bash
# main (default profile)
openclaw setup
openclaw gateway --port 18789

# extra gateway
openclaw --profile ops setup
openclaw --profile ops gateway --port 19789
```

両方で名前付きプロファイルを使うこともできます。

```bash
openclaw --profile main setup
openclaw --profile main gateway --port 18789

openclaw --profile ops setup
openclaw --profile ops gateway --port 19789
```

サービスも同じパターンに従います。

```bash
openclaw gateway install
openclaw --profile ops gateway install --port 19789
```

フォールバック用のオペレーターレーンにはレスキューボットのクイックスタートを使います。異なるチャンネル、テナント、ワークスペース、または運用ロールにまたがる長期運用の複数 Gateway には、一般的なプロファイルパターンを使います。

## 分離チェックリスト

Gateway インスタンスごとに、これらを一意に保ってください。

| 設定                         | 目的                                 |
| ---------------------------- | ------------------------------------ |
| `OPENCLAW_CONFIG_PATH`       | インスタンスごとの設定ファイル       |
| `OPENCLAW_STATE_DIR`         | インスタンスごとのセッション、認証情報、キャッシュ |
| `agents.defaults.workspace`  | インスタンスごとのワークスペースルート |
| `gateway.port`（または `--port`） | インスタンスごとに一意              |
| 派生ブラウザー/CDP ポート    | 下記を参照                           |

これらのいずれかを共有すると、設定の競合やポート衝突が発生します。

## ポートマッピング（派生）

ベースポート = `gateway.port`（または `OPENCLAW_GATEWAY_PORT` / `--port`）。

- ブラウザー制御サービスのポート = ベース + 2（loopback のみ）。
- Canvas ホストは Gateway HTTP サーバー自体で提供されます（`gateway.port` と同じポート）。
- ブラウザープロファイルの CDP ポートは、`browser control port + 9` から `+ 108` まで自動割り当てされます。

これらのいずれかを設定または env で上書きする場合は、インスタンスごとに一意に保つ必要があります。

## ブラウザー/CDP の注意事項（よくある落とし穴）

- 複数のインスタンスで `browser.cdpUrl` を同じ値に固定しないでください。
- 各インスタンスには専用のブラウザー制御ポートと CDP 範囲（Gateway ポートから派生）が必要です。
- 明示的な CDP ポートを使う場合は、インスタンスごとに `browser.profiles.<name>.cdpPort` を設定します。
- リモート Chrome の場合は、`browser.profiles.<name>.cdpUrl` を使います（プロファイルごと、インスタンスごと）。

## 手動 env の例

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

- `gateway status --deep` は、古いインストールから残った launchd/systemd/schtasks サービスを検出します。
- `multiple reachable gateway identities detected` のような `gateway probe` の警告テキストは、意図的に分離された Gateway を複数実行している場合、または到達可能なプローブ対象が同じ Gateway であることを OpenClaw が証明できない場合にのみ想定されます。同じ Gateway への SSH トンネル、プロキシ URL、または設定済みリモート URL は、トランスポートポートが異なっていても、複数のトランスポートを持つ 1 つの Gateway です。

## 関連

- [Gateway ランブック](/ja-JP/gateway)
- [Gateway ロック](/ja-JP/gateway/gateway-lock)
- [設定](/ja-JP/gateway/configuration)
