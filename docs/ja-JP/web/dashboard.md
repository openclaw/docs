---
read_when:
    - ダッシュボードの認証または公開モードの変更
summary: Gateway ダッシュボード（コントロール UI）のアクセスと認証
title: ダッシュボード
x-i18n:
    generated_at: "2026-05-05T01:50:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0e2086587fee6303221663748c3047886a5beae29862d66e2edf78e02bfe3da1
    source_path: web/dashboard.md
    workflow: 16
---

Gateway ダッシュボードは、デフォルトで `/` から提供されるブラウザー版 Control UI です
（`gateway.controlUi.basePath` で上書きできます）。

すばやく開く（ローカル Gateway）:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/)（または [http://localhost:18789/](http://localhost:18789/)）
- `gateway.tls.enabled: true` の場合は、WebSocket エンドポイントに `https://127.0.0.1:18789/` と
  `wss://127.0.0.1:18789` を使用します。

主なリファレンス:

- 使い方と UI 機能については [Control UI](/ja-JP/web/control-ui)。
- Serve/Funnel 自動化については [Tailscale](/ja-JP/gateway/tailscale)。
- バインドモードとセキュリティ上の注意については [Web サーフェス](/ja-JP/web)。

認証は、設定された gateway 認証パスを通じて WebSocket ハンドシェイクで強制されます。

- `connect.params.auth.token`
- `connect.params.auth.password`
- `gateway.auth.allowTailscale: true` の場合は Tailscale Serve ID ヘッダー
- `gateway.auth.mode: "trusted-proxy"` の場合は信頼済みプロキシ ID ヘッダー

[Gateway 設定](/ja-JP/gateway/configuration)の `gateway.auth` を参照してください。

セキュリティ上の注意: Control UI は**管理者サーフェス**です（チャット、設定、exec 承認）。
公開しないでください。UI は、現在のブラウザータブセッションと選択された gateway URL について、ダッシュボード URL トークンを sessionStorage に保持し、読み込み後に URL から削除します。
localhost、Tailscale Serve、または SSH トンネルを優先してください。

## 高速パス（推奨）

- オンボーディング後、CLI はダッシュボードを自動的に開き、クリーンな（トークン化されていない）リンクを表示します。
- いつでも再度開く: `openclaw dashboard`（リンクをコピーし、可能ならブラウザーを開き、ヘッドレスの場合は SSH ヒントを表示します）。
- クリップボードとブラウザー配信に失敗した場合でも、`openclaw dashboard` はクリーンな URL を表示し、
  `OPENCLAW_GATEWAY_TOKEN` または `gateway.auth.token` のトークンを URL フラグメントキー `token` として使用するよう伝えます。ログにはトークン値を表示しません。
- UI が共有シークレット認証を求めた場合は、設定済みのトークンまたは
  パスワードを Control UI 設定に貼り付けます。

## 認証の基本（ローカルとリモート）

- **Localhost**: `http://127.0.0.1:18789/` を開きます。
- **Gateway TLS**: `gateway.tls.enabled: true` の場合、ダッシュボード/ステータスリンクは
  `https://` を使用し、Control UI WebSocket リンクは `wss://` を使用します。
- **共有シークレットトークンのソース**: `gateway.auth.token`（または
  `OPENCLAW_GATEWAY_TOKEN`）。`openclaw dashboard` は 1 回限りのブートストラップのために URL フラグメント経由で渡すことができ、Control UI はそれを localStorage ではなく、現在のブラウザータブセッションと選択された gateway URL の sessionStorage に保持します。
- `gateway.auth.token` が SecretRef 管理の場合、`openclaw dashboard` は設計上、トークン化されていない URL を表示/コピー/開きます。これにより、外部管理トークンがシェルログ、クリップボード履歴、ブラウザー起動引数に露出することを避けます。
- `gateway.auth.token` が SecretRef として設定され、現在のシェルで解決されていない場合でも、`openclaw dashboard` はトークン化されていない URL と実行可能な認証セットアップガイダンスを表示します。
- **共有シークレットパスワード**: 設定済みの `gateway.auth.password`（または
  `OPENCLAW_GATEWAY_PASSWORD`）を使用します。ダッシュボードはリロードをまたいでパスワードを保持しません。
- **ID を伴うモード**: `gateway.auth.allowTailscale: true` の場合、Tailscale Serve は ID ヘッダーによって Control UI/WebSocket 認証を満たせます。また、local loopback ではない ID 対応リバースプロキシは
  `gateway.auth.mode: "trusted-proxy"` を満たせます。これらのモードでは、ダッシュボードは WebSocket 用に共有シークレットを貼り付ける必要がありません。
- **Localhost ではない場合**: Tailscale Serve、local loopback ではない共有シークレットバインド、
  `gateway.auth.mode: "trusted-proxy"` を使用する local loopback ではない ID 対応リバースプロキシ、または SSH トンネルを使用します。意図的にプライベートイングレスの
  `gateway.auth.mode: "none"` または trusted-proxy HTTP 認証を実行していない限り、HTTP API は引き続き共有シークレット認証を使用します。
  [Web サーフェス](/ja-JP/web)を参照してください。

<a id="if-you-see-unauthorized-1008"></a>

## 「unauthorized」/ 1008 が表示される場合

- gateway に到達できることを確認します（ローカル: `openclaw status`、リモート: SSH トンネル `ssh -N -L 18789:127.0.0.1:18789 user@host` の後、`http://127.0.0.1:18789/` を開きます）。
- `AUTH_TOKEN_MISMATCH` の場合、gateway が再試行ヒントを返すと、クライアントはキャッシュされたデバイストークンで 1 回の信頼済み再試行を行うことがあります。そのキャッシュトークン再試行では、トークンのキャッシュ済み承認スコープが再利用されます。明示的な `deviceToken` / 明示的な `scopes` 呼び出し元は、要求したスコープセットを保持します。その再試行後も認証が失敗する場合は、トークンのずれを手動で解決してください。
- その再試行パス以外では、接続認証の優先順位は、明示的な共有トークン/パスワード、明示的な `deviceToken`、保存済みデバイストークン、ブートストラップトークンの順です。
- 非同期 Tailscale Serve Control UI パスでは、同じ
  `{scope, ip}` に対する失敗した試行は、失敗認証リミッターが記録する前に直列化されるため、
  2 回目の同時不正再試行はすでに `retry later` を表示することがあります。
- トークンずれの修復手順については、[トークンずれ回復チェックリスト](/ja-JP/cli/devices#token-drift-recovery-checklist)に従ってください。
- gateway ホストから共有シークレットを取得または指定します。
  - トークン: `openclaw config get gateway.auth.token`
  - パスワード: 設定済みの `gateway.auth.password` または
    `OPENCLAW_GATEWAY_PASSWORD` を解決します
  - SecretRef 管理トークン: 外部シークレットプロバイダーを解決するか、このシェルで
    `OPENCLAW_GATEWAY_TOKEN` をエクスポートしてから、`openclaw dashboard` を再実行します
  - 共有シークレットが設定されていない: `openclaw doctor --generate-gateway-token`
- ダッシュボード設定で、認証フィールドにトークンまたはパスワードを貼り付けてから、
  接続します。
- UI 言語ピッカーは **概要 -> Gateway アクセス -> 言語** にあります。
  これはアクセスカードの一部であり、外観セクションではありません。

## 関連

- [Control UI](/ja-JP/web/control-ui)
- [WebChat](/ja-JP/web/webchat)
