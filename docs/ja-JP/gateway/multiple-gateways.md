---
read_when:
    - 同じマシンで複数の Gateway を実行する
    - Gateway ごとに分離された設定/状態/ポートが必要です
summary: 1 台のホストで複数の OpenClaw Gateway を実行する（分離、ポート、プロファイル）
title: 複数のGateway
x-i18n:
    generated_at: "2026-04-30T05:14:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 655f9ea5100813d5836f24eb47a5646443f83d70953efa64122633a5a1341002
    source_path: gateway/multiple-gateways.md
    workflow: 16
---

ほとんどのセットアップでは 1 つの Gateway を使うべきです。単一の Gateway で複数のメッセージング接続とエージェントを処理できるためです。より強い分離や冗長性（例: レスキューボット）が必要な場合は、分離されたプロファイル/ポートで別々の Gateway を実行してください。

## 最も推奨されるセットアップ

ほとんどのユーザーにとって、最も単純なレスキューボットのセットアップは次のとおりです。

- メインボットはデフォルトプロファイルのままにする
- レスキューボットを `--profile rescue` で実行する
- レスキューアカウントには完全に別の Telegram ボットを使う
- レスキューボットは `19789` などの別のベースポートに置く

これにより、レスキューボットはメインボットから分離されるため、プライマリボットが停止している場合でもデバッグや設定変更を適用できます。派生するブラウザ/canvas/CDP ポートが衝突しないように、ベースポート間には少なくとも 20 ポートの間隔を空けてください。

## レスキューボットのクイックスタート

他の方法を選ぶ強い理由がない限り、これをデフォルトの手順として使ってください。

```bash
# Rescue bot (separate Telegram bot, separate profile, port 19789)
openclaw --profile rescue onboard
openclaw --profile rescue gateway install --port 19789
```

メインボットがすでに実行中の場合、通常はこれだけで十分です。

`openclaw --profile rescue onboard` の実行中:

- 別の Telegram ボットトークンを使う
- `rescue` プロファイルを維持する
- メインボットより少なくとも 20 大きいベースポートを使う
- すでに自分で管理しているワークスペースがない限り、デフォルトのレスキューワークスペースを受け入れる

オンボーディングですでにレスキューサービスがインストールされている場合、最後の `gateway install` は不要です。

## これが機能する理由

レスキューボットは、次のものを独自に持つため独立したままになります。

- プロファイル/設定
- 状態ディレクトリ
- ワークスペース
- ベースポート（および派生ポート）
- Telegram ボットトークン

ほとんどのセットアップでは、レスキュープロファイル用に完全に別の Telegram ボットを使ってください。

- オペレーター専用にしやすい
- ボットトークンと ID が分離される
- メインボットのチャンネル/アプリインストールから独立する
- メインボットが壊れているときに、DM ベースの単純な復旧経路になる

## `--profile rescue onboard` が変更する内容

`openclaw --profile rescue onboard` は通常のオンボーディングフローを使いますが、すべてを別のプロファイルに書き込みます。

実際には、レスキューボットは次のものを独自に持つことになります。

- 設定ファイル
- 状態ディレクトリ
- ワークスペース（デフォルトでは `~/.openclaw/workspace-rescue`）
- 管理対象サービス名

それ以外のプロンプトは通常のオンボーディングと同じです。

## 一般的なマルチ Gateway セットアップ

上記のレスキューボット構成が最も簡単なデフォルトですが、同じ分離パターンは 1 台のホスト上の任意の 2 つ以上の Gateway にも使えます。

より一般的なセットアップでは、追加の各 Gateway に独自の名前付きプロファイルと独自のベースポートを与えます。

```bash
# main (default profile)
openclaw setup
openclaw gateway --port 18789

# extra gateway
openclaw --profile ops setup
openclaw --profile ops gateway --port 19789
```

両方の Gateway で名前付きプロファイルを使いたい場合も可能です。

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

フォールバックのオペレーター経路が必要な場合は、レスキューボットのクイックスタートを使ってください。異なるチャンネル、テナント、ワークスペース、または運用上の役割のために、長期間稼働する複数の Gateway が必要な場合は、一般的なプロファイルパターンを使ってください。

## 分離チェックリスト

Gateway インスタンスごとに次のものを一意にしてください。

- `OPENCLAW_CONFIG_PATH` — インスタンスごとの設定ファイル
- `OPENCLAW_STATE_DIR` — インスタンスごとのセッション、認証情報、キャッシュ
- `agents.defaults.workspace` — インスタンスごとのワークスペースルート
- `gateway.port`（または `--port`）— インスタンスごとに一意
- 派生するブラウザ/canvas/CDP ポート

これらを共有すると、設定の競合やポート衝突が発生します。

## ポートマッピング（派生）

ベースポート = `gateway.port`（または `OPENCLAW_GATEWAY_PORT` / `--port`）。

- ブラウザ制御サービスのポート = ベース + 2（local loopback のみ）
- canvas ホストは Gateway HTTP サーバーで提供されます（`gateway.port` と同じポート）
- ブラウザプロファイルの CDP ポートは `browser.controlPort + 9 .. + 108` から自動割り当てされます

設定や環境変数でこれらのいずれかを上書きする場合は、インスタンスごとに一意に保つ必要があります。

## ブラウザ/CDP の注意点（よくある落とし穴）

- 複数のインスタンスで `browser.cdpUrl` を同じ値に固定しないでください。
- 各インスタンスには、独自のブラウザ制御ポートと CDP 範囲（Gateway ポートから派生）が必要です。
- 明示的な CDP ポートが必要な場合は、インスタンスごとに `browser.profiles.<name>.cdpPort` を設定してください。
- リモート Chrome: `browser.profiles.<name>.cdpUrl` を使ってください（プロファイルごと、インスタンスごと）。

## 手動環境変数の例

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

解釈:

- `gateway status --deep` は、古いインストールから残った launchd/systemd/schtasks サービスを検出するのに役立ちます。
- `multiple reachable gateways detected` のような `gateway probe` の警告テキストは、意図的に複数の分離された Gateway を実行している場合にのみ想定されます。

## 関連

- [Gateway ランブック](/ja-JP/gateway)
- [Gateway ロック](/ja-JP/gateway/gateway-lock)
- [設定](/ja-JP/gateway/configuration)
