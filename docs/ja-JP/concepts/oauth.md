---
read_when:
    - OpenClaw OAuthをエンドツーエンドで理解する
    - トークンの無効化 / ログアウトの問題が発生している
    - Claude CLI または OAuth 認証フローを使用したい場合
    - 複数のアカウントまたはプロファイルルーティングを使いたい場合
summary: 'OpenClaw における OAuth: トークン交換、保存、マルチアカウントパターン'
title: OAuth
x-i18n:
    generated_at: "2026-04-30T05:09:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: b4b228c83a79afa4018e9572f790ddfef016a73d2383d2847facdc5bb61ed004
    source_path: concepts/oauth.md
    workflow: 16
---

OpenClaw は、対応するプロバイダー（特に **OpenAI Codex (ChatGPT OAuth)**）向けに、OAuth による「サブスクリプション認証」をサポートします。Anthropic については、実務上の区分は現在次のようになります。

- **Anthropic API key**: 通常の Anthropic API 請求
- **OpenClaw 内の Anthropic Claude CLI / サブスクリプション認証**: Anthropic スタッフから、この使用が再び許可されたと伝えられています

OpenAI Codex OAuth は、OpenClaw のような外部ツールでの使用が明示的にサポートされています。このページでは次を説明します。

本番環境の Anthropic では、API キー認証がより安全な推奨経路です。

- OAuth の **トークン交換** の仕組み（PKCE）
- トークンが **保存** される場所（およびその理由）
- **複数アカウント** の扱い方（プロファイル + セッションごとの上書き）

OpenClaw は、独自の OAuth または API キーフローを同梱する **プロバイダーPlugin** もサポートします。次で実行します。

```bash
openclaw models auth login --provider <id>
```

## トークンシンク（存在する理由）

OAuth プロバイダーは、ログイン/更新フロー中に **新しいリフレッシュトークン** を発行することがよくあります。一部のプロバイダー（または OAuth クライアント）は、同じユーザー/アプリに対して新しいリフレッシュトークンが発行されると、古いリフレッシュトークンを無効化する場合があります。

実際の症状:

- OpenClaw _と_ Claude Code / Codex CLI の両方でログインする → どちらか一方が後でランダムに「ログアウト」される

これを減らすため、OpenClaw は `auth-profiles.json` を **トークンシンク** として扱います。

- ランタイムは **1 か所** から認証情報を読み取る
- 複数のプロファイルを保持し、決定的にルーティングできる
- 外部 CLI の再利用はプロバイダー固有です。Codex CLI は空の `openai-codex:default` プロファイルをブートストラップできますが、OpenClaw にローカル OAuth プロファイルができた後は、ローカルのリフレッシュトークンが正準になります。他の連携は外部管理のままにして、CLI の認証ストアを再読み取りできます
- 設定済みプロバイダーセットをすでに把握しているステータスと起動パスは、外部 CLI 検出をそのセットに限定するため、単一プロバイダー構成で無関係な CLI ログインストアは調査されません

## ストレージ（トークンの保存先）

シークレットはエージェント認証ストアに保存されます。

- 認証プロファイル（OAuth + API キー + 任意の値レベル参照）: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- レガシー互換ファイル: `~/.openclaw/agents/<agentId>/agent/auth.json`
  （静的な `api_key` エントリは検出時に除去されます）

レガシーのインポート専用ファイル（引き続きサポートされますが、メインストアではありません）:

- `~/.openclaw/credentials/oauth.json`（初回使用時に `auth-profiles.json` へインポートされます）

上記はすべて `$OPENCLAW_STATE_DIR`（状態ディレクトリの上書き）も尊重します。完全なリファレンス: [/gateway/configuration](/ja-JP/gateway/configuration-reference#auth-storage)

静的シークレット参照とランタイムスナップショットの有効化動作については、[シークレット管理](/ja-JP/gateway/secrets) を参照してください。

セカンダリエージェントにローカル認証プロファイルがない場合、OpenClaw はデフォルト/メインエージェントストアからの読み取りスルー継承を使用します。読み取り時にメインエージェントの `auth-profiles.json` を複製することはありません。OAuth リフレッシュトークンは特に機密性が高く、通常のコピーフローではデフォルトでスキップされます。一部のプロバイダーは、使用後にリフレッシュトークンをローテーションまたは無効化するためです。エージェントに独立したアカウントが必要な場合は、そのエージェント用に別個の OAuth ログインを設定してください。

## Anthropic レガシートークン互換性

<Warning>
Anthropic の公開 Claude Code ドキュメントでは、Claude Code の直接使用は Claude サブスクリプション制限内に収まると説明されており、Anthropic スタッフからは OpenClaw 形式の Claude CLI 使用が再び許可されたと伝えられています。そのため OpenClaw は、Anthropic が新しいポリシーを公開しない限り、この連携における Claude CLI の再利用と `claude -p` の使用を認可されたものとして扱います。

Anthropic の現在の直接 Claude Code プランドキュメントについては、[Pro または Max プランで Claude Code を使用する](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan) および [Team または Enterprise プランで Claude Code を使用する](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/) を参照してください。

OpenClaw で他のサブスクリプション形式の選択肢を使いたい場合は、[OpenAI Codex](/ja-JP/providers/openai)、[Qwen Cloud Coding Plan](/ja-JP/providers/qwen)、[MiniMax Coding Plan](/ja-JP/providers/minimax)、[Z.AI / GLM Coding Plan](/ja-JP/providers/glm) を参照してください。
</Warning>

OpenClaw は、Anthropic setup-token もサポート対象のトークン認証経路として公開していますが、現在は利用可能な場合に Claude CLI の再利用と `claude -p` を優先します。

## Anthropic Claude CLI 移行

OpenClaw は Anthropic Claude CLI の再利用を再びサポートします。ホスト上にすでにローカルの Claude ログインがある場合、オンボーディング/設定でそれを直接再利用できます。

## OAuth 交換（ログインの仕組み）

OpenClaw の対話型ログインフローは `@mariozechner/pi-ai` に実装され、ウィザード/コマンドに接続されています。

### Anthropic setup-token

フローの形:

1. OpenClaw から Anthropic setup-token または paste-token を開始する
2. OpenClaw は結果の Anthropic 認証情報を認証プロファイルに保存する
3. モデル選択は `anthropic/...` のまま維持される
4. 既存の Anthropic 認証プロファイルは、ロールバック/順序制御に引き続き利用可能

### OpenAI Codex (ChatGPT OAuth)

OpenAI Codex OAuth は、OpenClaw ワークフローを含め、Codex CLI の外部での使用が明示的にサポートされています。

フローの形（PKCE）:

1. PKCE ベリファイア/チャレンジ + ランダムな `state` を生成する
2. `https://auth.openai.com/oauth/authorize?...` を開く
3. `http://127.0.0.1:1455/auth/callback` でコールバックの取得を試みる
4. コールバックをバインドできない場合（またはリモート/ヘッドレスの場合）、リダイレクト URL/コードを貼り付ける
5. `https://auth.openai.com/oauth/token` で交換する
6. アクセストークンから `accountId` を抽出し、`{ access, refresh, expires, accountId }` を保存する

ウィザードパスは `openclaw onboard` → 認証選択 `openai-codex` です。

## 更新 + 有効期限

プロファイルは `expires` タイムスタンプを保存します。

ランタイムでは:

- `expires` が未来の場合 → 保存済みのアクセストークンを使用する
- 期限切れの場合 → （ファイルロック下で）更新し、保存済み認証情報を上書きする
- セカンダリエージェントが継承されたメインエージェントの OAuth プロファイルを読み取る場合、更新はリフレッシュトークンをセカンダリエージェントストアにコピーする代わりに、メインエージェントストアへ書き戻す
- 例外: 一部の外部 CLI 認証情報は外部管理のままです。OpenClaw は、コピーされたリフレッシュトークンを消費する代わりに、それらの CLI 認証ストアを再読み取りします。Codex CLI ブートストラップは意図的により狭く、空の `openai-codex:default` プロファイルをシードし、その後 OpenClaw 所有の更新がローカルプロファイルを正準に保ちます。

更新フローは自動です。通常、トークンを手動で管理する必要はありません。

## 複数アカウント（プロファイル）+ ルーティング

2 つのパターンがあります。

### 1) 推奨: 別々のエージェント

「個人用」と「仕事用」を一切相互作用させたくない場合は、分離されたエージェント（別々のセッション + 認証情報 + ワークスペース）を使用します。

```bash
openclaw agents add work
openclaw agents add personal
```

その後、エージェントごとに認証を設定し（ウィザード）、チャットを適切なエージェントへルーティングします。

### 2) 高度: 1 つのエージェント内の複数プロファイル

`auth-profiles.json` は、同じプロバイダーに対して複数のプロファイル ID をサポートします。

使用するプロファイルを選びます。

- 設定の順序（`auth.order`）によるグローバル指定
- `/model ...@<profileId>` によるセッションごとの指定

例（セッション上書き）:

- `/model Opus@anthropic:work`

存在するプロファイル ID を確認する方法:

- `openclaw channels list --json`（`auth[]` を表示）

関連ドキュメント:

- [モデルフェイルオーバー](/ja-JP/concepts/model-failover)（ローテーション + クールダウン規則）
- [スラッシュコマンド](/ja-JP/tools/slash-commands)（コマンドサーフェス）

## 関連

- [認証](/ja-JP/gateway/authentication) — モデルプロバイダー認証の概要
- [シークレット](/ja-JP/gateway/secrets) — 認証情報ストレージと SecretRef
- [設定リファレンス](/ja-JP/gateway/configuration-reference#auth-storage) — 認証設定キー
