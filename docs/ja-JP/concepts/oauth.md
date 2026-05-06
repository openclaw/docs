---
read_when:
    - OpenClaw OAuth をエンドツーエンドで理解したい
    - トークンの無効化 / ログアウトの問題に遭遇した場合
    - Claude CLI または OAuth 認証フローを使用したい場合
    - 複数のアカウントまたはプロファイルルーティングを使いたい場合
summary: 'OpenClaw における OAuth: トークン交換、保存、マルチアカウントパターン'
title: OAuth
x-i18n:
    generated_at: "2026-05-06T05:02:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 223480a24bd30f92f5d9fdc35e937e582f9e81f5bee2fb0e5c0ea445ac552a40
    source_path: concepts/oauth.md
    workflow: 16
---

OpenClaw は、それを提供するプロバイダー向けに OAuth による「サブスクリプション認証」をサポートします
（特に **OpenAI Codex (ChatGPT OAuth)**）。Anthropic については、実用上の分け方は
現在次のようになります。

- **Anthropic API キー**: 通常の Anthropic API 課金
- **OpenClaw 内の Anthropic Claude CLI / サブスクリプション認証**: Anthropic スタッフから
  この利用は再び許可されていると聞いています

OpenAI Codex OAuth は、OpenClaw のような外部ツールでの利用が明示的にサポートされています。このページでは次を説明します。

本番環境の Anthropic では、API キー認証がより安全な推奨経路です。

- OAuth の **トークン交換** の仕組み（PKCE）
- トークンが **保存** される場所（およびその理由）
- **複数アカウント** の扱い方（プロファイル + セッションごとの上書き）

OpenClaw は、独自の OAuth または API キー
フローを提供する **プロバイダー Plugin** もサポートします。次で実行します。

```bash
openclaw models auth login --provider <id>
```

## トークンシンク（存在する理由）

OAuth プロバイダーは、ログイン/更新フロー中に **新しい更新トークン** を発行することが一般的です。一部のプロバイダー（または OAuth クライアント）は、同じユーザー/アプリに対して新しい更新トークンが発行されたときに、古い更新トークンを無効化することがあります。

実際に見える症状:

- OpenClaw _と_ Claude Code / Codex CLI の両方でログインする → 後でどちらかがランダムに「ログアウト」される

これを減らすため、OpenClaw は `auth-profiles.json` を **トークンシンク** として扱います。

- ランタイムは **1 か所** から認証情報を読み取る
- 複数のプロファイルを保持し、決定的にルーティングできる
- 外部 CLI の再利用はプロバイダー固有です。Codex CLI は空の
  `openai-codex:default` プロファイルをブートストラップできますが、OpenClaw にローカル OAuth プロファイルができた後は、
  ローカルの更新トークンが正規となります。他の統合は引き続き
  外部管理のままにし、CLI 認証ストアを再読み取りできます
- 設定済みプロバイダー集合をすでに把握しているステータスおよび起動パスは、
  外部 CLI の検出をその集合に限定するため、単一プロバイダー構成で無関係な CLI ログインストアが
  探査されません

## ストレージ（トークンの保存場所）

シークレットはエージェント認証ストアに保存されます。

- 認証プロファイル（OAuth + API キー + 任意の値レベル参照）: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- レガシー互換ファイル: `~/.openclaw/agents/<agentId>/agent/auth.json`
  （静的な `api_key` エントリは検出時に除去されます）

レガシーのインポート専用ファイル（引き続きサポートされますが、メインストアではありません）:

- `~/.openclaw/credentials/oauth.json`（初回利用時に `auth-profiles.json` へインポートされます）

上記はすべて `$OPENCLAW_STATE_DIR`（状態ディレクトリの上書き）も尊重します。完全なリファレンス: [/gateway/configuration](/ja-JP/gateway/configuration-reference#auth-storage)

静的なシークレット参照とランタイムスナップショット有効化の動作については、[シークレット管理](/ja-JP/gateway/secrets)を参照してください。

セカンダリエージェントにローカル認証プロファイルがない場合、OpenClaw はデフォルト/メインエージェントストアからの読み取りスルー
継承を使用します。読み取り時にメイン
エージェントの `auth-profiles.json` を複製することはありません。OAuth 更新トークンは特に
機密性が高く、通常のコピーフローではデフォルトでスキップされます。一部のプロバイダーは、使用後に更新トークンをローテーション
または無効化するためです。エージェントに独立したアカウントが必要な場合は、
別個の OAuth ログインを設定してください。

## Anthropic レガシートークン互換性

<Warning>
Anthropic の公開 Claude Code ドキュメントでは、Claude Code を直接使用する場合は
Claude サブスクリプション制限内に留まると記載されており、Anthropic スタッフからは OpenClaw 形式の Claude
CLI 利用が再び許可されていると聞いています。そのため OpenClaw は、Anthropic が
新しいポリシーを公開しない限り、この統合では Claude CLI の再利用と
`claude -p` の利用を認可されたものとして扱います。

Anthropic の現在の直接 Claude Code プランのドキュメントについては、[Using Claude Code
with your Pro or Max
plan](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
および [Using Claude Code with your Team or Enterprise
plan](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/) を参照してください。

OpenClaw で他のサブスクリプション形式の選択肢を使いたい場合は、[OpenAI
Codex](/ja-JP/providers/openai)、[Qwen Cloud Coding
Plan](/ja-JP/providers/qwen)、[MiniMax Coding Plan](/ja-JP/providers/minimax)、
および [Z.AI / GLM Coding Plan](/ja-JP/providers/glm) を参照してください。
</Warning>

OpenClaw は、サポートされるトークン認証経路として Anthropic setup-token も公開していますが、現在は利用可能な場合に Claude CLI の再利用と `claude -p` を優先します。

## Anthropic Claude CLI 移行

OpenClaw は Anthropic Claude CLI の再利用を再びサポートします。ホスト上にすでにローカルの
Claude ログインがある場合、オンボーディング/設定でそれを直接再利用できます。

## OAuth 交換（ログインの仕組み）

OpenClaw の対話型ログインフローは `@mariozechner/pi-ai` に実装されており、ウィザード/コマンドに接続されています。

### Anthropic setup-token

フローの形:

1. OpenClaw から Anthropic setup-token を開始するか、paste-token を貼り付ける
2. OpenClaw が結果の Anthropic 認証情報を認証プロファイルに保存する
3. モデル選択は `anthropic/...` のまま維持される
4. 既存の Anthropic 認証プロファイルはロールバック/順序制御に引き続き利用できる

### OpenAI Codex (ChatGPT OAuth)

OpenAI Codex OAuth は、OpenClaw ワークフローを含め、Codex CLI の外部での利用が明示的にサポートされています。

フローの形（PKCE）:

1. PKCE 検証子/チャレンジ + ランダムな `state` を生成する
2. `https://auth.openai.com/oauth/authorize?...` を開く
3. `http://127.0.0.1:1455/auth/callback` でコールバックの取得を試みる
4. コールバックをバインドできない場合（またはリモート/ヘッドレスの場合）は、リダイレクト URL/コードを貼り付ける
5. `https://auth.openai.com/oauth/token` で交換する
6. アクセストークンから `accountId` を抽出し、`{ access, refresh, expires, accountId }` を保存する

ウィザードのパスは `openclaw onboard` → 認証選択 `openai-codex` です。

## 更新 + 有効期限

プロファイルは `expires` タイムスタンプを保存します。

ランタイムでは:

- `expires` が未来の場合 → 保存済みアクセストークンを使用する
- 期限切れの場合 → （ファイルロック下で）更新し、保存済み認証情報を上書きする
- セカンダリエージェントが継承されたメインエージェント OAuth プロファイルを読み取る場合、更新は
  更新トークンをセカンダリエージェントストアへコピーする代わりに、メインエージェントストアへ
  書き戻します
- 例外: 一部の外部 CLI 認証情報は外部管理のままです。OpenClaw は
  コピーされた更新トークンを消費する代わりに、それらの CLI 認証ストアを再読み取りします。
  Codex CLI ブートストラップは意図的により狭くなっています。空の
  `openai-codex:default` プロファイルをシードし、その後は OpenClaw 所有の更新によってローカル
  プロファイルを正規として維持します。

更新フローは自動です。通常、トークンを手動で管理する必要はありません。

## 複数アカウント（プロファイル）+ ルーティング

2 つのパターンがあります。

### 1) 推奨: 別々のエージェント

「個人用」と「仕事用」を決して相互作用させたくない場合は、分離されたエージェント（別々のセッション + 認証情報 + ワークスペース）を使用します。

```bash
openclaw agents add work
openclaw agents add personal
```

その後、エージェントごとに（ウィザードで）認証を設定し、チャットを適切なエージェントにルーティングします。

### 2) 上級: 1 つのエージェント内の複数プロファイル

`auth-profiles.json` は、同じプロバイダーに対して複数のプロファイル ID をサポートします。

使用するプロファイルを選びます。

- 設定の順序（`auth.order`）でグローバルに
- `/model ...@<profileId>` でセッションごとに

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
- [設定リファレンス](/ja-JP/gateway/configuration-reference#auth-storage) - 認証設定キー
