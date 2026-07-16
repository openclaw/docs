---
read_when:
    - 同じマシン上で複数の Gateway を実行する
    - Gateway ごとに分離された設定、状態、ポートが必要です
summary: 1台のホストで複数のOpenClaw Gatewayを実行する（分離、ポート、プロファイル）
title: 複数の Gateway
x-i18n:
    generated_at: "2026-07-16T11:38:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 655fa865a98064d7c017a7c2eb08ea9a9683002d96a3dbe45a8c16cbd3c86ba1
    source_path: gateway/multiple-gateways.md
    workflow: 16
---

ほとんどのセットアップでは Gateway は 1 つで十分です。1 つの Gateway で複数のメッセージング接続とエージェントを処理できます。より強力な分離や冗長性（例: レスキューボット）が必要な場合にのみ、分離されたプロファイル/ポートで個別の Gateway を実行してください。

## レスキューボットのクイックスタート

最も簡単なレスキューボットのセットアップ:

- メインボットはデフォルトプロファイルのままにします。
- レスキューボットは、専用の Telegram ボットトークンを使用して `--profile rescue` で実行します。
- レスキューボットには別のベースポート（例: `19789`）を設定します。

これにより、プライマリボットが停止している場合でも、レスキューボットでデバッグや設定変更を適用できます。派生するブラウザー/CDP ポートが衝突しないように、ベースポート間には少なくとも 20 ポート分の間隔を空けてください。

```bash
# レスキューボット（別の Telegram ボット、別のプロファイル、ポート 19789）
openclaw --profile rescue onboard
openclaw --profile rescue gateway install --port 19789
```

メインボットがすでに実行中であれば、通常はこれだけで十分です。オンボーディングによってレスキューサービスがすでにインストールされている場合は、最後の `gateway install` を省略してください。

`openclaw --profile rescue onboard` の実行中:

- レスキューアカウント専用の別の Telegram ボットトークンを使用します（オペレーター専用にしやすく、メインボットのチャンネル/アプリのインストールから独立し、DM ベースの簡単な復旧経路になります）。
- `rescue` というプロファイル名を維持します。
- メインボットより少なくとも 20 大きいベースポートを使用します。
- すでに独自に管理しているワークスペースがない限り、デフォルトのレスキューワークスペースを使用します。

### `--profile rescue onboard` による変更

`--profile rescue onboard` は通常のオンボーディングフローを実行しますが、すべてを別のプロファイルに書き込むため、レスキューボットには次の専用リソースが割り当てられます:

- プロファイル/設定ファイル
- 状態ディレクトリ
- ワークスペース（デフォルト: `~/.openclaw/workspace-rescue`）
- 管理対象サービス名
- ベースポート（および派生ポート）
- Telegram ボットトークン

その他のプロンプトは通常のオンボーディングと同じです。

## 一般的な複数 Gateway のセットアップ

同じ分離パターンは、1 台のホスト上にある任意の 2 つ以上の Gateway に適用できます。追加する各 Gateway に固有の名前付きプロファイルとベースポートを割り当てます:

```bash
# メイン（デフォルトプロファイル）
openclaw setup
openclaw gateway --port 18789

# 追加の Gateway
openclaw --profile ops setup
openclaw --profile ops gateway --port 19789
```

両方で名前付きプロファイルを使用することもできます:

```bash
openclaw --profile main setup
openclaw --profile main gateway --port 18789

openclaw --profile ops setup
openclaw --profile ops gateway --port 19789
```

サービスも同じパターンに従います:

```bash
openclaw gateway install
openclaw --profile ops gateway install --port 19789
```

フォールバック用のオペレーター経路にはレスキューボットのクイックスタートを使用し、異なるチャンネル、テナント、ワークスペース、運用上の役割にわたって複数の長期稼働 Gateway を使用する場合は、一般的なプロファイルパターンを使用してください。

## 分離チェックリスト

Gateway インスタンスごとに、以下を一意にしてください:

| 設定                      | 目的                              |
| ---------------------------- | ------------------------------------ |
| `OPENCLAW_CONFIG_PATH`       | インスタンスごとの設定ファイル             |
| `OPENCLAW_STATE_DIR`         | インスタンスごとのセッション、認証情報、キャッシュ |
| `agents.defaults.workspace`  | インスタンスごとのワークスペースルート          |
| `gateway.port`（または `--port`） | インスタンスごとに一意                  |
| 派生するブラウザー/CDP ポート    | 以下を参照                            |

これらのいずれかを共有すると、設定、状態、またはポートの競合が発生します。Gateway の起動時には、
`OPENCLAW_ALLOW_MULTI_GATEWAY=1` が設定ごとのシングルトンをスキップする場合でも、
状態ディレクトリの所有権が一意であることが強制されます。

## ポートマッピング（派生）

ベースポート = `gateway.port`（または `OPENCLAW_GATEWAY_PORT` / `--port`）。

- ブラウザー制御サービスのポート = ベース + 2（ループバックのみ）。
- Canvas ホストは Gateway HTTP サーバー自体で提供されます（`gateway.port` と同じポート）。
- ブラウザープロファイルの CDP ポートは、`browser control port + 9` から `+ 108` の範囲で自動的に割り当てられます。

設定または環境変数でこれらのいずれかを上書きする場合は、インスタンスごとに一意にする必要があります。

## ブラウザー/CDP に関する注意事項（よくある落とし穴）

- 複数のインスタンスで `browser.cdpUrl` を同じ値に固定しないでください。
- 各インスタンスには、固有のブラウザー制御ポートと CDP 範囲（Gateway ポートから派生）が必要です。
- CDP ポートを明示的に指定する場合は、インスタンスごとに `browser.profiles.<name>.cdpPort` を設定します。
- リモート Chrome の場合は、`browser.profiles.<name>.cdpUrl` を使用します（プロファイルごと、インスタンスごと）。

## 手動での環境変数の例

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

- `gateway status --deep` は、以前のインストールで残った古い launchd/systemd/schtasks サービスを検出します。
- `gateway probe` の `multiple reachable gateway identities detected` のような警告テキストは、複数の分離された Gateway を意図的に実行している場合、または到達可能なプローブ対象が同じ Gateway であることを OpenClaw が証明できない場合にのみ表示されるのが正常です。SSH トンネル、プロキシ URL、または同じ Gateway に設定されたリモート URL は、転送ポートが異なっていても、複数の転送方式を持つ 1 つの Gateway です。

## 関連項目

- [Gateway 運用手順書](/ja-JP/gateway)
- [Gateway ロック](/ja-JP/gateway/gateway-lock)
- [設定](/ja-JP/gateway/configuration)
