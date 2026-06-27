---
read_when:
    - 同じマシンで複数の Gateway を実行する
    - Gateway ごとに分離された config/state/ports が必要です
summary: 1台のホストで複数の OpenClaw Gateway を実行する（分離、ポート、プロファイル）
title: 複数のGateway
x-i18n:
    generated_at: "2026-06-27T11:30:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d6f6df481f6ba36749770199ef6eaf94eed33af2bed38d35a31f77b9dbba1913
    source_path: gateway/multiple-gateways.md
    workflow: 16
---

ほとんどのセットアップでは、1つの Gateway を使用してください。単一の Gateway で複数のメッセージング接続とエージェントを処理できるためです。より強い分離や冗長性が必要な場合（例: レスキューボット）は、分離されたプロファイル/ポートで別々の Gateway を実行します。

## 最も推奨されるセットアップ

ほとんどのユーザーにとって、最も単純なレスキューボット構成は次のとおりです。

- メインボットはデフォルトプロファイルのままにする
- レスキューボットは `--profile rescue` で実行する
- レスキューアカウントには完全に別の Telegram ボットを使用する
- レスキューボットは `19789` など別のベースポートで維持する

これにより、レスキューボットがメインボットから分離されるため、プライマリボットが停止している場合でも、デバッグや設定変更の適用ができます。派生するブラウザ/canvas/CDP ポートが衝突しないように、ベースポート間は少なくとも20ポート空けてください。

## レスキューボットのクイックスタート

別の方法を選ぶ強い理由がない限り、これをデフォルトの手順として使用してください。

```bash
# Rescue bot (separate Telegram bot, separate profile, port 19789)
openclaw --profile rescue onboard
openclaw --profile rescue gateway install --port 19789
```

メインボットがすでに実行中の場合、通常はこれだけで十分です。

`openclaw --profile rescue onboard` の実行中:

- 別の Telegram ボットトークンを使用する
- `rescue` プロファイルを維持する
- メインボットより少なくとも20高いベースポートを使用する
- 自分で管理しているものがすでにない限り、デフォルトのレスキューワークスペースを受け入れる

オンボーディングによってレスキューサービスがすでにインストールされている場合、最後の `gateway install` は不要です。

## これが機能する理由

レスキューボットは、次を独自に持つため独立したままになります。

- プロファイル/設定
- 状態ディレクトリ
- ワークスペース
- ベースポート（および派生ポート）
- Telegram ボットトークン

ほとんどのセットアップでは、レスキュープロファイルに完全に別の Telegram ボットを使用してください。

- オペレーター専用に保ちやすい
- ボットトークンと識別子が分離される
- メインボットのチャネル/アプリインストールから独立する
- メインボットが壊れている場合の単純な DM ベースの復旧経路になる

## `--profile rescue onboard` が変更する内容

`openclaw --profile rescue onboard` は通常のオンボーディングフローを使用しますが、すべてを別のプロファイルに書き込みます。

実際には、レスキューボットは次を独自に持ちます。

- 設定ファイル
- 状態ディレクトリ
- ワークスペース（デフォルトでは `~/.openclaw/workspace-rescue`）
- 管理対象サービス名

それ以外のプロンプトは通常のオンボーディングと同じです。

## 一般的な複数 Gateway セットアップ

上記のレスキューボット構成が最も簡単なデフォルトですが、同じ分離パターンは1つのホスト上の任意の Gateway のペアまたはグループにも使用できます。

より一般的なセットアップでは、追加の各 Gateway に独自の名前付きプロファイルと独自のベースポートを割り当てます。

```bash
# main (default profile)
openclaw setup
openclaw gateway --port 18789

# extra gateway
openclaw --profile ops setup
openclaw --profile ops gateway --port 19789
```

両方の Gateway で名前付きプロファイルを使用したい場合も可能です。

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

フォールバック用のオペレーターレーンが必要な場合は、レスキューボットのクイックスタートを使用してください。異なるチャネル、テナント、ワークスペース、または運用ロール向けに複数の長期稼働 Gateway が必要な場合は、一般的なプロファイルパターンを使用してください。

## 分離チェックリスト

Gateway インスタンスごとに、次を一意に保ってください。

- `OPENCLAW_CONFIG_PATH` — インスタンスごとの設定ファイル
- `OPENCLAW_STATE_DIR` — インスタンスごとのセッション、認証情報、キャッシュ
- `agents.defaults.workspace` — インスタンスごとのワークスペースルート
- `gateway.port`（または `--port`）— インスタンスごとに一意
- 派生するブラウザ/canvas/CDP ポート

これらを共有すると、設定の競合やポート衝突が発生します。

## ポートマッピング（派生）

ベースポート = `gateway.port`（または `OPENCLAW_GATEWAY_PORT` / `--port`）。

- ブラウザ制御サービスのポート = ベース + 2（local loopback のみ）
- canvas ホストは Gateway HTTP サーバーで提供される（`gateway.port` と同じポート）
- ブラウザプロファイルの CDP ポートは `browser.controlPort + 9 .. + 108` から自動割り当てされる

設定または環境変数でこれらのいずれかを上書きする場合は、インスタンスごとに一意に保つ必要があります。

## ブラウザ/CDP の注意事項（よくある落とし穴）

- 複数のインスタンスで `browser.cdpUrl` を同じ値に固定しないでください。
- 各インスタンスには、独自のブラウザ制御ポートと CDP 範囲（Gateway ポートから派生）が必要です。
- 明示的な CDP ポートが必要な場合は、インスタンスごとに `browser.profiles.<name>.cdpPort` を設定してください。
- リモート Chrome: `browser.profiles.<name>.cdpUrl` を使用します（プロファイルごと、インスタンスごと）。

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

- `gateway status --deep` は、古いインストールから残っている launchd/systemd/schtasks サービスの検出に役立ちます。
- `multiple reachable gateway identities detected` などの `gateway probe` の警告テキストは、意図的に複数の分離された Gateway を実行している場合、または OpenClaw が到達可能なプローブ対象が同じ Gateway であることを証明できない場合にのみ想定されます。SSH トンネル、プロキシ URL、または同じ Gateway への設定済みリモート URL は、トランスポートポートが異なる場合でも、複数のトランスポートを持つ1つの Gateway です。

## 関連

- [Gateway ランブック](/ja-JP/gateway)
- [Gateway ロック](/ja-JP/gateway/gateway-lock)
- [設定](/ja-JP/gateway/configuration)
