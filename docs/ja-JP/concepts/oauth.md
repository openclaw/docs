---
read_when:
    - OpenClaw OAuth をエンドツーエンドで理解したい
    - トークンの無効化 / ログアウトの問題が発生した
    - Claude CLI または OAuth 認証フローを使いたい
    - 複数のアカウントまたはプロファイルルーティングを使いたい
summary: 'OpenClaw における OAuth: トークン交換、保存、マルチアカウントパターン'
title: OAuth
x-i18n:
    generated_at: "2026-07-05T11:19:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 51aa98a9cb9614107ce979eca235c175a1748df2facdded852cd8899cebba22c
    source_path: concepts/oauth.md
    workflow: 16
---

OpenClaw は OAuth（「サブスクリプション認証」）を提供するプロバイダーでサポートしています。
特に **OpenAI Codex（ChatGPT OAuth）** と **Anthropic Claude CLI reuse** です。
Anthropic では、実務上の区分は次のとおりです。

- **Anthropic API キー**: 通常の Anthropic API 課金。
- **Anthropic Claude CLI / OpenClaw 内のサブスクリプション認証**: Anthropic スタッフから、この利用は再び許可されていると伝えられたため、Anthropic が新しいポリシーを公開しない限り、OpenClaw はこの連携における Claude CLI reuse と `claude -p` の使用を認可済みとして扱います。本番環境の Anthropic では、API キー認証が引き続きより安全な推奨経路です。

OpenClaw は、OpenAI API キー認証と ChatGPT/Codex OAuth の両方を、正規のプロバイダー ID `openai` の下に保存します。古い `openai-codex:*` プロファイル ID と `auth.order.openai-codex` エントリは、`openclaw doctor --fix` によって修復されるレガシー状態です。新しい設定では `openai:*` プロファイル ID と `auth.order.openai` を使用してください。

このページでは次を扱います。

- OAuth **トークン交換** の仕組み（PKCE）
- トークンが **保存** される場所（およびその理由）
- **複数アカウント** の扱い方（プロファイル + セッションごとの上書き）

独自の OAuth または API キーフローを同梱するプロバイダー Plugin は、同じエントリーポイントを通ります。

```bash
openclaw models auth login --provider <id>
```

## トークンシンク（存在する理由）

OAuth プロバイダーは、ログインまたは更新のたびに新しい更新トークンを発行することが一般的です。一部のプロバイダーは、同じユーザー/アプリに対して新しい更新トークンが発行されると、以前の更新トークンを無効化します。実際の症状としては、OpenClaw _と_ Claude Code / Codex CLI の両方でログインすると、後でどちらかがランダムにログアウトされます。

これを減らすために、OpenClaw は認証プロファイルストアを **トークンシンク** として扱います。

- ランタイムはエージェントごとに 1 か所から認証情報を読み取る
- 複数のプロファイルは共存でき、決定論的にルーティングできる
- 外部 CLI の再利用はプロバイダー固有: OpenClaw がプロバイダーのローカル OAuth プロファイルを所有した後は、ローカル更新トークンが正規になります。そのローカル更新トークンが拒否された場合、OpenClaw は外部 CLI のトークン素材にフォールバックするのではなく、再認証対象としてプロファイルを報告します。Codex CLI ブートストラップはさらに狭く、OpenClaw がそのプロバイダーの OAuth を所有する前に、空の `openai:default` 形式のプロファイルを初期投入できるだけです。その後は、OpenClaw が所有する更新が正規のままです
- ステータス/起動パスは、外部 CLI の検出範囲を、すでに設定済みのプロバイダー集合に限定します。そのため、単一プロバイダーのセットアップで無関係な CLI ログインストアは調査されません

## ストレージ（トークンの保存先）

シークレットはエージェントごとに、論理名 `auth-profiles.json` でキー付けされて保存されます（基盤となるストアはエージェントの SQLite データベースです。JSON 名は互換性とツール表示のために保持されています）。

- 認証プロファイル（OAuth + API キー + 任意の値レベル参照）:
  `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- レガシー互換ファイル: `~/.openclaw/agents/<agentId>/agent/auth.json`
  （静的な `api_key` エントリは検出時に消去されます）

レガシーのインポート専用ファイル（引き続きサポートされていますが、主ストアではありません）。

- `~/.openclaw/credentials/oauth.json`（初回使用時に認証プロファイルストアへインポートされます）

上記はすべて `$OPENCLAW_STATE_DIR`（状態ディレクトリの上書き）にも従います。完全なリファレンス: [/gateway/configuration-reference#auth-storage](/ja-JP/gateway/configuration-reference#auth-storage)

静的シークレット参照とランタイムスナップショットの有効化動作については、[シークレット管理](/ja-JP/gateway/secrets) を参照してください。

セカンダリエージェントにローカル認証プロファイルがない場合、OpenClaw はデフォルト/メインエージェントストアからの読み取り透過継承を使用します。読み取り時にメインエージェントのストアを複製することはありません。OAuth 更新トークンは特に機微です。一部のプロバイダーは使用後に更新トークンをローテーションまたは無効化するため、通常のコピー フローではデフォルトでそれらをスキップします。独立したアカウントが必要なエージェントには、別個の OAuth ログインを設定してください。

## Anthropic Claude CLI reuse

OpenClaw は、認可済みの認証経路として Anthropic Claude CLI reuse と `claude -p` をサポートしています。ホスト上に既存のローカル Claude ログインがある場合、オンボーディング/設定でそれを直接再利用できます。Anthropic setup-token は、サポートされるトークン認証経路として引き続き利用できますが、OpenClaw は利用可能な場合 Claude CLI reuse を優先します。

<Warning>
Anthropic の公開 Claude Code ドキュメントでは、Claude Code を直接使用する場合は Claude サブスクリプション制限内に留まるとされています。また Anthropic スタッフから、OpenClaw 形式の Claude CLI 使用は再び許可されていると伝えられました。そのため OpenClaw は、Anthropic が新しいポリシーを公開しない限り、この連携における Claude CLI reuse と `claude -p` の使用を認可済みとして扱います。

Anthropic の現在の直接 Claude Code プランのドキュメントについては、[Pro または Max プランで Claude Code を使用する](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan) および [Team または Enterprise プランで Claude Code を使用する](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/) を参照してください。

OpenClaw で他のサブスクリプション形式の選択肢が必要な場合は、[OpenAI Codex](/ja-JP/providers/openai)、[Qwen Cloud Coding Plan](/ja-JP/providers/qwen)、[MiniMax Coding Plan](/ja-JP/providers/minimax)、[Z.AI / GLM Coding Plan](/ja-JP/providers/zai) を参照してください。
</Warning>

## OAuth 交換（ログインの仕組み）

OpenClaw の対話型ログインフローは `openclaw/plugin-sdk/llm.ts` に実装され、ウィザード/コマンドに接続されています。

### Anthropic setup-token

フローの形:

1. OpenClaw から Anthropic setup-token または paste-token を開始する
2. OpenClaw は結果の Anthropic 認証情報を認証プロファイルに保存する
3. モデル選択は `anthropic/...` のままにする
4. 既存の Anthropic 認証プロファイルは、ロールバック/順序制御のために引き続き利用できる

### OpenAI Codex（ChatGPT OAuth）

OpenAI Codex OAuth は、OpenClaw ワークフローを含め、Codex CLI 外での使用が明示的にサポートされています。

ログインコマンドは正規の OpenAI プロバイダー ID を使用します。

```bash
openclaw models auth login --provider openai
```

1 つのエージェント内で複数の ChatGPT/Codex OAuth アカウントを使う場合は、`--profile-id openai:<name>` を使用してください。新しいプロファイルに `openai-codex:<name>` は使用しないでください。Doctor はその古いプレフィックスを衝突しない `openai:*` プロファイル ID に移行します。修復後、プロファイル ID を `auth.order` または `/model ...@<profileId>` にコピーする前に、`openclaw models auth list --provider openai` を実行してください。

フローの形（PKCE）:

1. PKCE 検証子/チャレンジとランダムな `state` を生成する
2. `https://auth.openai.com/oauth/authorize?...` を開く（スコープ `openid profile email offline_access`）
3. `http://localhost:1455/auth/callback` でコールバックの取得を試みる（コールバックホストのデフォルトは `localhost` で、loopback ホストのみを受け付けます。`OPENCLAW_OAUTH_CALLBACK_HOST` で上書きできます）
4. コールバックが到着する前にコードを貼り付けられる場合（またはリモート/ヘッドレスでコールバックをバインドできない場合）は、代わりにリダイレクト URL/コードを貼り付ける - 手動貼り付けはブラウザーコールバックと競合し、先に完了した方が勝ちます
5. `https://auth.openai.com/oauth/token` でコードを交換する
6. アクセストークンから `accountId` を抽出し、`{ access, refresh, expires, accountId }` を保存する

ウィザードのパスは `openclaw onboard` → 認証選択 `openai` です。

## 更新 + 有効期限

プロファイルは `expires` タイムスタンプを保存します。ランタイムでは次のようになります。

- `expires` が未来の場合、保存済みアクセストークンを使用する
- 期限切れの場合、（ファイルロック下で）更新し、保存済み認証情報を上書きする
- セカンダリエージェントが継承されたメインエージェントの OAuth プロファイルを読み取る場合、更新は更新トークンをセカンダリエージェントストアへコピーするのではなく、メインエージェントストアへ書き戻す
- 外部管理の CLI 認証情報（Claude CLI、狭い Codex CLI ブートストラップ。[トークンシンク](#the-token-sink-why-it-exists) を参照）は、コピーされた更新トークンを消費するのではなく再読み取りされます。管理対象の更新が失敗した場合、OpenClaw は外部 CLI のトークン素材を返すのではなく、影響を受けたプロファイルを再認証対象として報告します。

更新フローは自動です。通常、トークンを手動で管理する必要はありません。

## 複数アカウント（プロファイル）+ ルーティング

2 つのパターンがあります。

### 1) 推奨: エージェントを分ける

「個人用」と「仕事用」を一切相互作用させたくない場合は、分離されたエージェント（別々のセッション + 認証情報 + ワークスペース）を使用してください。

```bash
openclaw agents add work
openclaw agents add personal
```

その後、エージェントごとに認証を設定し（ウィザード）、チャットを適切なエージェントへルーティングします。

### 2) 高度: 1 つのエージェント内に複数プロファイル

認証プロファイルストアは、同じプロバイダーに対する複数のプロファイル ID をサポートします。どれを使用するかを選択します。

- 設定の順序付け（`auth.order`）によるグローバル指定
- `/model ...@<profileId>` によるセッションごとの指定

例（セッション上書き）:

- `/model Opus@anthropic:work`

既存のプロファイル ID を一覧表示するには、次を使用します。

```bash
openclaw models auth list --provider <id>
```

関連ドキュメント:

- [モデルフェイルオーバー](/ja-JP/concepts/model-failover)（ローテーション + クールダウン ルール）
- [スラッシュコマンド](/ja-JP/tools/slash-commands)（コマンドサーフェス）

## 関連

- [認証](/ja-JP/gateway/authentication) - モデルプロバイダー認証の概要
- [シークレット](/ja-JP/gateway/secrets) - 認証情報ストレージと SecretRef
- [設定リファレンス](/ja-JP/gateway/configuration-reference#auth-storage) - 認証設定キー
