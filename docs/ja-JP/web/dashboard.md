---
read_when:
    - ダッシュボードの認証または公開モードの変更
summary: Gateway ダッシュボード（制御 UI）のアクセスと認証
title: ダッシュボード
x-i18n:
    generated_at: "2026-05-11T20:40:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 07e11c1f71e6691ee053192e238a3b48568f81c3180e6b5f8e21b6874417e57e
    source_path: web/dashboard.md
    workflow: 16
---

Gateway ダッシュボードは、デフォルトで `/` から提供されるブラウザーのコントロールUIです
（`gateway.controlUi.basePath` で上書きできます）。

クイックオープン（ローカル Gateway）:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/)（または [http://localhost:18789/](http://localhost:18789/)）
- `gateway.tls.enabled: true` の場合は、`https://127.0.0.1:18789/` を使用し、
  WebSocket エンドポイントには `wss://127.0.0.1:18789` を使用します。

主な参考資料:

- 使用方法と UI 機能については [コントロールUI](/ja-JP/web/control-ui)。
- Serve/Funnel 自動化については [Tailscale](/ja-JP/gateway/tailscale)。
- バインドモードとセキュリティメモについては [Web サーフェス](/ja-JP/web)。

認証は、設定された Gateway 認証パスを通じて WebSocket ハンドシェイクで強制されます:

- `connect.params.auth.token`
- `connect.params.auth.password`
- `gateway.auth.allowTailscale: true` の場合の Tailscale Serve ID ヘッダー
- `gateway.auth.mode: "trusted-proxy"` の場合の信頼済みプロキシ ID ヘッダー

[Gateway 設定](/ja-JP/gateway/configuration) の `gateway.auth` を参照してください。

セキュリティメモ: コントロールUIは **管理者サーフェス**（チャット、設定、実行承認）です。
公開しないでください。UI は、現在のブラウザータブセッションと選択された Gateway URL について、ダッシュボード URL トークンを sessionStorage に保持し、読み込み後に URL から削除します。
localhost、Tailscale Serve、または SSH トンネルを推奨します。

## 高速パス（推奨）

- オンボーディング後、CLI はダッシュボードを自動的に開き、クリーンな（トークン化されていない）リンクを表示します。
- いつでも再度開けます: `openclaw dashboard`（リンクをコピーし、可能であればブラウザーを開き、ヘッドレスの場合は SSH のヒントを表示します）。
- クリップボードとブラウザーへの配信が失敗しても、`openclaw dashboard` は
  クリーンな URL を表示し、`OPENCLAW_GATEWAY_TOKEN` または
  `gateway.auth.token` のトークンを URL フラグメントキー `token` として使用するよう案内します。ログにトークン値は表示しません。
- UI が共有シークレット認証を求める場合は、設定済みのトークンまたは
  パスワードをコントロールUI設定に貼り付けます。

## 認証の基本（ローカルとリモート）

- **Localhost**: `http://127.0.0.1:18789/` を開きます。
- **Gateway TLS**: `gateway.tls.enabled: true` の場合、ダッシュボード/ステータスリンクは
  `https://` を使用し、コントロールUI WebSocket リンクは `wss://` を使用します。
- **共有シークレットトークンのソース**: `gateway.auth.token`（または
  `OPENCLAW_GATEWAY_TOKEN`）。`openclaw dashboard` は 1 回限りのブートストラップのために URL フラグメント経由で渡すことができ、コントロールUIは localStorage ではなく、現在のブラウザータブセッションと選択された Gateway URL について sessionStorage に保持します。
- `gateway.auth.token` が SecretRef 管理の場合、`openclaw dashboard` は設計上、トークン化されていない URL を表示/コピー/開きます。これにより、外部管理トークンがシェルログ、クリップボード履歴、ブラウザー起動引数に露出するのを防ぎます。
- `gateway.auth.token` が SecretRef として設定されていて、現在のシェルで解決されていない場合でも、`openclaw dashboard` はトークン化されていない URL と、実行可能な認証設定ガイダンスを表示します。
- **共有シークレットパスワード**: 設定済みの `gateway.auth.password`（または
  `OPENCLAW_GATEWAY_PASSWORD`）を使用します。ダッシュボードはリロードをまたいでパスワードを永続化しません。
- **ID を持つモード**: `gateway.auth.allowTailscale: true` の場合、Tailscale Serve は ID ヘッダーを通じてコントロールUI/WebSocket 認証を満たせます。また、local loopback ではない ID 対応リバースプロキシは
  `gateway.auth.mode: "trusted-proxy"` を満たせます。これらのモードでは、ダッシュボードは WebSocket のために貼り付けられた共有シークレットを必要としません。
- **Localhost 以外**: Tailscale Serve、local loopback ではない共有シークレットバインド、
  `gateway.auth.mode: "trusted-proxy"` を使用する local loopback ではない ID 対応リバースプロキシ、または SSH トンネルを使用します。HTTP API は、private-ingress の `gateway.auth.mode: "none"` または trusted-proxy HTTP 認証を意図的に実行しない限り、引き続き共有シークレット認証を使用します。
  [Web サーフェス](/ja-JP/web) を参照してください。

<a id="if-you-see-unauthorized-1008"></a>

## 「unauthorized」/ 1008 が表示される場合

- Gateway に到達できることを確認します（ローカル: `openclaw status`; リモート: SSH トンネル `ssh -N -L 18789:127.0.0.1:18789 user@host` の後、`http://127.0.0.1:18789/` を開く）。
- `AUTH_TOKEN_MISMATCH` の場合、Gateway が再試行ヒントを返すと、クライアントはキャッシュされたデバイストークンで 1 回だけ信頼済み再試行を実行できます。そのキャッシュ済みトークンの再試行では、トークンのキャッシュ済み承認スコープが再利用されます。明示的な `deviceToken` / 明示的な `scopes` 呼び出し元は、要求したスコープセットを維持します。その再試行後も認証が失敗する場合は、トークンのずれを手動で解決します。
- `AUTH_SCOPE_MISMATCH` の場合、デバイストークンは認識されましたが、ダッシュボードが要求したスコープを持っていません。共有 Gateway トークンをローテーションするのではなく、再ペアリングするか、要求されたスコープ契約を承認してください。
- その再試行パス以外では、接続認証の優先順位は、明示的な共有トークン/パスワード、次に明示的な `deviceToken`、次に保存済みデバイストークン、次にブートストラップトークンです。
- 非同期 Tailscale Serve コントロールUIパスでは、同じ
  `{scope, ip}` に対する失敗した試行は、失敗認証リミッターが記録する前に直列化されるため、2 回目の同時の不正な再試行ではすでに `retry later` が表示される場合があります。
- トークンのずれの修復手順については、[トークンずれ復旧チェックリスト](/ja-JP/cli/devices#token-drift-recovery-checklist) に従ってください。
- Gateway ホストから共有シークレットを取得または指定します:
  - トークン: `openclaw config get gateway.auth.token`
  - パスワード: 設定済みの `gateway.auth.password` または
    `OPENCLAW_GATEWAY_PASSWORD` を解決します
  - SecretRef 管理トークン: 外部シークレットプロバイダーを解決するか、このシェルで
    `OPENCLAW_GATEWAY_TOKEN` をエクスポートし、その後 `openclaw dashboard` を再実行します
  - 共有シークレットが設定されていない場合: `openclaw doctor --generate-gateway-token`
- ダッシュボード設定で、認証フィールドにトークンまたはパスワードを貼り付け、
  その後接続します。
- UI 言語ピッカーは **Overview -> Gateway Access -> Language** にあります。
  これはアクセスカードの一部であり、Appearance セクションではありません。

## 関連

- [コントロールUI](/ja-JP/web/control-ui)
- [WebChat](/ja-JP/web/webchat)
