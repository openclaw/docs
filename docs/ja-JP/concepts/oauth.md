---
read_when:
    - OpenClaw OAuthをエンドツーエンドで理解したい
    - トークンの無効化 / ログアウトの問題が発生している
    - Claude CLI または OAuth 認証フローを使いたい
    - 複数のアカウントまたはプロファイルルーティングが必要な場合
summary: 'OpenClaw における OAuth: トークン交換、保存、マルチアカウントのパターン'
title: OAuth
x-i18n:
    generated_at: "2026-06-27T11:15:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4aa48fd468a541ed72935833a3196105798380799fa6135fe1dd9f68838307b6
    source_path: concepts/oauth.md
    workflow: 16
---

OpenClaw は、それを提供するプロバイダー向けに OAuth による「サブスクリプション認証」をサポートしています
（特に **OpenAI Codex (ChatGPT OAuth)**）。Anthropic では、実用上の区分は現在次のとおりです。

- **Anthropic APIキー**: 通常の Anthropic API 課金
- **OpenClaw 内の Anthropic Claude CLI / サブスクリプション認証**: Anthropic スタッフから、この利用は再び許可されていると伝えられています

OpenAI Codex OAuth は、OpenClaw のような外部ツールでの使用が明示的にサポートされています。

OpenClaw は、OpenAI APIキー認証と ChatGPT/Codex OAuth の両方を、正規のプロバイダー ID `openai` の下に保存します。古い `openai-codex:*` プロファイル ID と `auth.order.openai-codex` エントリは、`openclaw doctor --fix` で修復されるレガシー状態です。新しい構成では、`openai:*` プロファイル ID と `auth.order.openai` を使用してください。

本番環境の Anthropic では、APIキー認証がより安全な推奨パスです。

このページでは次を説明します。

- OAuth の **トークン交換** の仕組み（PKCE）
- トークンが **保存** される場所（およびその理由）
- **複数アカウント** の扱い方（プロファイル + セッションごとの上書き）

OpenClaw は、独自の OAuth または APIキーフローを提供する **プロバイダーPlugin** もサポートしています。次で実行します。

```bash
openclaw models auth login --provider <id>
```

## トークンシンク（存在する理由）

OAuth プロバイダーは、ログイン/リフレッシュフロー中に **新しいリフレッシュトークン** を発行することがよくあります。一部のプロバイダー（または OAuth クライアント）は、同じユーザー/アプリに対して新しいリフレッシュトークンが発行されると、古いリフレッシュトークンを無効化することがあります。

実際に起きる症状:

- OpenClaw _と_ Claude Code / Codex CLI の両方でログインする → どちらか一方が後でランダムに「ログアウト」される

これを減らすため、OpenClaw は `auth-profiles.json` を **トークンシンク** として扱います。

- ランタイムは **1か所** から認証情報を読み取る
- 複数のプロファイルを保持し、決定的にルーティングできる
- 外部 CLI の再利用はプロバイダー固有です。Codex CLI は空の `openai:default` プロファイルをブートストラップできますが、OpenClaw にローカル OAuth プロファイルができた後は、ローカルのリフレッシュトークンが正規になります。そのローカルリフレッシュトークンが拒否された場合、OpenClaw は同じアカウントで利用可能な Codex CLI トークンをランタイム限定のフォールバックとして使用できます。他の連携は外部管理のままにして、各 CLI の認証ストアを再読み取りできます
- 構成済みプロバイダーセットをすでに把握しているステータスと起動パスは、外部 CLI 検出をそのセットに限定するため、単一プロバイダー構成で無関係な CLI ログインストアは探索されません

## ストレージ（トークンの保存場所）

シークレットはエージェント認証ストアに保存されます。

- 認証プロファイル（OAuth + APIキー + 任意の値レベル参照）: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- レガシー互換ファイル: `~/.openclaw/agents/<agentId>/agent/auth.json`
  （静的な `api_key` エントリは検出時に削除されます）

レガシーのインポート専用ファイル（現在もサポートされていますが、メインストアではありません）:

- `~/.openclaw/credentials/oauth.json`（初回使用時に `auth-profiles.json` にインポートされます）

上記はすべて `$OPENCLAW_STATE_DIR`（状態ディレクトリの上書き）も尊重します。完全なリファレンス: [/gateway/configuration](/ja-JP/gateway/configuration-reference#auth-storage)

静的シークレット参照とランタイムスナップショットの有効化動作については、[シークレット管理](/ja-JP/gateway/secrets) を参照してください。

セカンダリエージェントにローカル認証プロファイルがない場合、OpenClaw はデフォルト/メインエージェントストアからの読み取り継承を使用します。読み取り時にメインエージェントの `auth-profiles.json` を複製することはありません。OAuth リフレッシュトークンは特にセンシティブです。一部のプロバイダーは使用後にリフレッシュトークンをローテーションまたは無効化するため、通常のコピーフローでは既定でスキップされます。エージェントに独立したアカウントが必要な場合は、そのエージェント用に別の OAuth ログインを構成してください。

## Anthropic レガシートークン互換性

<Warning>
Anthropic の公開 Claude Code ドキュメントでは、Claude Code の直接利用は Claude サブスクリプションの制限内に留まるとされています。また、Anthropic スタッフから、OpenClaw 形式の Claude CLI 利用は再び許可されていると伝えられています。そのため OpenClaw は、Anthropic が新しいポリシーを公開しない限り、この連携における Claude CLI 再利用と `claude -p` の使用を認可済みとして扱います。

Anthropic の現在の直接 Claude Code プランドキュメントについては、[Pro または Max プランで Claude Code を使用する](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan) と [Team または Enterprise プランで Claude Code を使用する](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/) を参照してください。

OpenClaw で他のサブスクリプション形式の選択肢を使いたい場合は、[OpenAI Codex](/ja-JP/providers/openai)、[Qwen Cloud Coding Plan](/ja-JP/providers/qwen)、[MiniMax Coding Plan](/ja-JP/providers/minimax)、[Z.AI / GLM Coding Plan](/ja-JP/providers/zai) を参照してください。
</Warning>

OpenClaw は、サポート対象のトークン認証パスとして Anthropic setup-token も公開していますが、現在は利用可能な場合に Claude CLI 再利用と `claude -p` を優先します。

## Anthropic Claude CLI 移行

OpenClaw は Anthropic Claude CLI の再利用を再びサポートしています。ホスト上にすでにローカル Claude ログインがある場合、オンボーディング/構成でそれを直接再利用できます。

## OAuth 交換（ログインの仕組み）

OpenClaw の対話型ログインフローは `openclaw/plugin-sdk/llm` に実装され、ウィザード/コマンドに接続されています。

### Anthropic setup-token

フローの形:

1. OpenClaw から Anthropic setup-token を開始する、または paste-token を貼り付ける
2. OpenClaw は結果の Anthropic 認証情報を認証プロファイルに保存する
3. モデル選択は `anthropic/...` のままにする
4. 既存の Anthropic 認証プロファイルはロールバック/順序制御に引き続き利用できる

### OpenAI Codex (ChatGPT OAuth)

OpenAI Codex OAuth は、OpenClaw ワークフローを含め、Codex CLI の外部での使用が明示的にサポートされています。

ログインコマンドは引き続き正規の OpenAI プロバイダー ID を使用します。

```bash
openclaw models auth login --provider openai
```

1つのエージェントで複数の ChatGPT/Codex OAuth アカウントを使うには、`--profile-id openai:<name>` を使用します。新しいプロファイルに `openai-codex:<name>` を使用しないでください。Doctor はその古いプレフィックスを衝突しない `openai:*` プロファイル ID に移行します。修復後、プロファイル ID を `auth.order` または `/model ...@<profileId>` にコピーする前に、`openclaw models auth list --provider openai` を実行してください。

フローの形（PKCE）:

1. PKCE verifier/challenge + ランダムな `state` を生成する
2. `https://auth.openai.com/oauth/authorize?...` を開く
3. `http://127.0.0.1:1455/auth/callback` でコールバックの取得を試みる
4. コールバックをバインドできない場合（またはリモート/ヘッドレスの場合）、リダイレクト URL/コードを貼り付ける
5. `https://auth.openai.com/oauth/token` で交換する
6. アクセストークンから `accountId` を抽出し、`{ access, refresh, expires, accountId }` を保存する

ウィザードパスは `openclaw onboard` → 認証選択 `openai` です。

## リフレッシュ + 有効期限

プロファイルは `expires` タイムスタンプを保存します。

ランタイムでは:

- `expires` が未来の場合 → 保存済みアクセストークンを使用する
- 期限切れの場合 → （ファイルロック下で）リフレッシュし、保存済み認証情報を上書きする
- セカンダリエージェントが継承されたメインエージェント OAuth プロファイルを読み取る場合、リフレッシュはリフレッシュトークンをセカンダリエージェントストアにコピーするのではなく、メインエージェントストアへ書き戻す
- 例外: 一部の外部 CLI 認証情報は外部管理のままです。OpenClaw はコピーされたリフレッシュトークンを消費する代わりに、それらの CLI 認証ストアを再読み取りします。Codex CLI ブートストラップは意図的により限定されています。空の `openai:default` プロファイルをシードし、その後は OpenClaw 所有のリフレッシュによってローカルプロファイルを正規に保ちます。ローカル Codex リフレッシュが失敗し、Codex CLI に同じアカウントで利用可能なトークンがある場合、OpenClaw はそのトークンを現在のランタイムリクエストに使用できますが、`auth-profiles.json` へ書き戻しません。

リフレッシュフローは自動です。通常、手動でトークンを管理する必要はありません。

## 複数アカウント（プロファイル）+ ルーティング

2つのパターンがあります。

### 1) 推奨: エージェントを分ける

「個人」と「仕事」を一切相互作用させたくない場合は、分離されたエージェント（別々のセッション + 認証情報 + ワークスペース）を使用します。

```bash
openclaw agents add work
openclaw agents add personal
```

次に、エージェントごとに認証を構成し（ウィザード）、チャットを適切なエージェントへルーティングします。

### 2) 高度: 1つのエージェント内で複数プロファイル

`auth-profiles.json` は、同じプロバイダーに対して複数のプロファイル ID をサポートします。

使用するプロファイルの選択方法:

- 構成の順序指定（`auth.order`）でグローバルに指定
- `/model ...@<profileId>` でセッションごとに指定

例（セッション上書き）:

- `/model Opus@anthropic:work`

存在するプロファイル ID を確認する方法:

- `openclaw channels list --json`（`auth[]` を表示）

関連ドキュメント:

- [モデルフェイルオーバー](/ja-JP/concepts/model-failover)（ローテーション + クールダウンルール）
- [スラッシュコマンド](/ja-JP/tools/slash-commands)（コマンドサーフェス）

## 関連

- [認証](/ja-JP/gateway/authentication) - モデルプロバイダー認証の概要
- [シークレット](/ja-JP/gateway/secrets) - 認証情報ストレージと SecretRef
- [構成リファレンス](/ja-JP/gateway/configuration-reference#auth-storage) - 認証構成キー
