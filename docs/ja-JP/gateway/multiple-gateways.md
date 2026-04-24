---
read_when:
    - 同じマシン上で複数の Gateway を実行する
    - Gateway ごとに分離された config/状態/ポートが必要です
summary: 1 台のホストで複数の OpenClaw Gateway を実行する（分離、ポート、プロファイル）
title: 複数の Gateway
x-i18n:
    generated_at: "2026-04-24T04:58:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1700a0d29ceee3e2a242a8455a3c948895fb25750a2b1bce5c4bd0690a051881
    source_path: gateway/multiple-gateways.md
    workflow: 15
---

# 複数の Gateway（同一ホスト）

ほとんどの環境では 1 つの Gateway を使うべきです。単一の Gateway で複数のメッセージ接続とエージェントを扱えるからです。より強い分離や冗長性（たとえば rescue bot）が必要な場合は、分離された profile/port を使って別々の Gateway を実行してください。

## 最も推奨されるセットアップ

ほとんどのユーザーにとって、最も簡単な rescue bot セットアップは次のとおりです。

- メイン bot は default profile のままにする
- rescue bot は `--profile rescue` で実行する
- rescue アカウントには完全に別の Telegram bot を使う
- rescue bot は `19789` のような別の base port に置く

これにより、rescue bot はメイン bot から分離され、primary bot が落ちている場合でも
デバッグや config 変更を適用できます。派生する browser/canvas/CDP port が衝突しないよう、
base port 間は少なくとも 20 空けてください。

## Rescue Bot クイックスタート

強い理由がない限り、これをデフォルトの経路として使ってください。

```bash
# Rescue bot（別の Telegram bot、別の profile、port 19789）
openclaw --profile rescue onboard
openclaw --profile rescue gateway install --port 19789
```

メイン bot がすでに動作している場合、通常これだけで十分です。

`openclaw --profile rescue onboard` 中には:

- 別の Telegram bot token を使う
- `rescue` profile を維持する
- メイン bot より少なくとも 20 高い base port を使う
- すでに自分で管理していない限り、デフォルトの rescue workspace を受け入れる

onboarding がすでに rescue service をインストールしてくれている場合、最後の
`gateway install` は不要です。

## なぜこれでうまくいくのか

rescue bot は次のものを独自に持つため、独立性を保てます。

- profile/config
- 状態ディレクトリ
- workspace
- base port（および派生 port）
- Telegram bot token

ほとんどの環境では、rescue profile には完全に別の Telegram bot を使ってください。

- operator 専用に保ちやすい
- bot token と identity が別
- メイン bot のチャンネル/アプリインストールから独立
- メイン bot が壊れているときの DM ベース復旧経路が簡単

## `--profile rescue onboard` で変わること

`openclaw --profile rescue onboard` は通常の onboarding フローを使いますが、
すべてを別 profile に書き込みます。

実際には、rescue bot は次を独自に持つことになります。

- config ファイル
- 状態ディレクトリ
- workspace（デフォルトでは `~/.openclaw/workspace-rescue`）
- managed service 名

それ以外のプロンプトは通常の onboarding と同じです。

## 一般的なマルチ Gateway セットアップ

上記の rescue bot レイアウトが最も簡単なデフォルトですが、同じ分離
パターンは 1 台のホスト上の任意の Gateway の組み合わせに使えます。

より一般的なセットアップでは、追加の各 Gateway に独自の名前付き profile と
独自の base port を与えます。

```bash
# main（default profile）
openclaw setup
openclaw gateway --port 18789

# extra gateway
openclaw --profile ops setup
openclaw --profile ops gateway --port 19789
```

両方の Gateway に名前付き profile を使いたい場合も可能です。

```bash
openclaw --profile main setup
openclaw --profile main gateway --port 18789

openclaw --profile ops setup
openclaw --profile ops gateway --port 19789
```

service も同じパターンに従います。

```bash
openclaw gateway install
openclaw --profile ops gateway install --port 19789
```

fallback の operator レーンが欲しい場合は rescue bot クイックスタートを使ってください。
異なるチャンネル、tenant、workspace、または運用ロール向けに複数の長寿命 Gateway が欲しい場合は、
一般 profile パターンを使ってください。

## 分離チェックリスト

各 Gateway インスタンスごとに次を一意にしてください。

- `OPENCLAW_CONFIG_PATH` — インスタンスごとの config ファイル
- `OPENCLAW_STATE_DIR` — インスタンスごとのセッション、認証情報、キャッシュ
- `agents.defaults.workspace` — インスタンスごとの workspace ルート
- `gateway.port`（または `--port`）— インスタンスごとに一意
- 派生する browser/canvas/CDP port

これらが共有されていると、config race と port conflict が発生します。

## port マッピング（派生）

base port = `gateway.port`（または `OPENCLAW_GATEWAY_PORT` / `--port`）。

- browser control service port = base + 2（loopback のみ）
- canvas host は Gateway HTTP サーバー上で提供される（`gateway.port` と同じ port）
- Browser profile の CDP port は `browser.controlPort + 9 .. + 108` から自動割り当てされる

config または env でこれらのいずれかを上書きする場合は、インスタンスごとに一意に保つ必要があります。

## Browser/CDP に関する注記（よくある落とし穴）

- 複数インスタンスで `browser.cdpUrl` を同じ値に固定**しないでください**。
- 各インスタンスには独自の browser control port と CDP 範囲（gateway port から派生）が必要です。
- 明示的な CDP port が必要な場合は、インスタンスごとに `browser.profiles.<name>.cdpPort` を設定してください。
- リモート Chrome には `browser.profiles.<name>.cdpUrl` を使います（profile ごと、インスタンスごと）。

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

解釈:

- `gateway status --deep` は、古いインストールから残った stale な launchd/systemd/schtasks service を見つけるのに役立ちます。
- `multiple reachable gateways detected` のような `gateway probe` 警告文は、意図的に複数の分離された gateway を実行している場合にのみ想定されるものです。

## 関連

- [Gateway runbook](/ja-JP/gateway)
- [Gateway lock](/ja-JP/gateway/gateway-lock)
- [Configuration](/ja-JP/gateway/configuration)
