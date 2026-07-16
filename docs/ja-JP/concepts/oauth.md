---
read_when:
    - OpenClaw OAuth の全体像をエンドツーエンドで理解したい場合
    - トークンの無効化／ログアウトの問題が発生する
    - Claude CLI または OAuth 認証フローを使用したい場合
    - 複数のアカウントまたはプロファイルのルーティングを使用したい場合
summary: OpenClaw における OAuth：トークン交換、保存、マルチアカウントのパターン
title: OAuth
x-i18n:
    generated_at: "2026-07-16T11:35:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 3ef94af0601b7d57bb7e2d53c3d8231708b401251eca7dc1bb1e7e4fc09b46da
    source_path: concepts/oauth.md
    workflow: 16
---

OpenClaw は、OAuth（「サブスクリプション認証」）を提供するプロバイダーでこれをサポートしています。
代表例は **OpenAI Codex（ChatGPT OAuth）** と **Anthropic Claude CLI の再利用**です。
Anthropic の場合、実際の区分は次のとおりです。

- **Anthropic API キー**：通常の Anthropic API 課金です。
- **OpenClaw 内での Anthropic Claude CLI／サブスクリプション認証**：Anthropic のスタッフから
  この利用が再び許可されたとの回答を得たため、Anthropic が新しいポリシーを
  公開しない限り、OpenClaw はこの連携における Claude CLI の再利用と
  `claude -p` の使用を認可済みとして扱います。本番環境で Anthropic を使用する場合は、
  引き続き API キー認証がより安全な推奨経路です。

OpenClaw は、OpenAI API キー認証と ChatGPT/Codex OAuth の両方を、
正規プロバイダー ID `openai` の下に保存します。古い `openai-codex:*` プロファイル ID と
`auth.order.openai-codex` エントリは、
`openclaw doctor --fix` によって修復されるレガシー状態です。新しい設定には
`openai:*` プロファイル ID と `auth.order.openai` を使用してください。

このページでは、次の内容を説明します。

- OAuth の **トークン交換**の仕組み（PKCE）
- トークンが**保存される場所**（およびその理由）
- **複数アカウント**の扱い方（プロファイル＋セッション単位のオーバーライド）

独自の OAuth または API キーフローを提供するプロバイダー Plugin も、
同じエントリポイントを通じて実行されます。

```bash
openclaw models auth login --provider <id>
```

## トークンシンク（存在する理由）

OAuth プロバイダーは通常、ログインや更新のたびに新しい更新トークンを発行します。
プロバイダーによっては、同じユーザー／アプリに対して新しい更新トークンを
発行すると、以前の更新トークンを無効化します。実際に現れる症状は、OpenClaw と
Claude Code／Codex CLI の両方でログインすると、後からどちらか一方が
不規則にログアウトされることです。

これを減らすため、OpenClaw は認証プロファイルストアを**トークンシンク**として扱います。

- ランタイムは、エージェントごとに単一の場所から認証情報を読み取ります
- 複数のプロファイルが共存でき、決定的にルーティングできます
- 外部 CLI の再利用はプロバイダー固有です。OpenClaw がプロバイダーのローカル OAuth
  プロファイルを所有した後は、ローカルの更新トークンが正規のものになります。そのローカル
  更新トークンが拒否された場合、OpenClaw は外部 CLI のトークン情報へフォールバックせず、
  再認証が必要なプロファイルとして報告します。
  Codex CLI のブートストラップはさらに限定的です。OpenClaw がその
  プロバイダーの OAuth を所有する前に限り、空の
  `openai:default` 形式のプロファイルへ初期値を設定できます。それ以降は、
  OpenClaw が所有する更新が引き続き正規のものとなります
- ステータス／起動経路では、外部 CLI の検出範囲を
  すでに設定済みのプロバイダー集合に限定するため、単一プロバイダーの設定で
  無関係な CLI ログインストアが探索されることはありません

## ストレージ（トークンの保存場所）

シークレットはエージェントごとに保存され、論理名 `auth-profiles.json` をキーとして使用します
（基盤となるストアはエージェントの SQLite データベースです。JSON 名は
互換性とツールでの表示のために維持されています）。

- 認証プロファイル（OAuth＋API キー＋任意の値レベル参照）：
  `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- レガシー互換ファイル：`~/.openclaw/agents/<agentId>/agent/auth.json`
  （静的な `api_key` エントリは検出時に消去されます）

レガシーのインポート専用ファイル（引き続きサポートされますが、メインストアではありません）：

- `~/.openclaw/credentials/oauth.json`（初回使用時に認証プロファイルストアへインポートされます）

上記はすべて `$OPENCLAW_STATE_DIR`（状態ディレクトリのオーバーライド）にも従います。完全なリファレンス：[/gateway/configuration-reference#auth-storage](/ja-JP/gateway/configuration-reference#auth-storage)

静的なシークレット参照とランタイムスナップショットの有効化動作については、[シークレット管理](/ja-JP/gateway/secrets)を参照してください。

セカンダリエージェントにローカル認証プロファイルがない場合、OpenClaw はデフォルト／メイン
エージェントのストアから読み取り時継承を行います。読み取り時にメイン
エージェントのストアを複製することはありません。OAuth 更新トークンは特に機密性が高く、
プロバイダーによっては使用後に更新トークンをローテーションまたは無効化するため、通常の
コピー処理ではデフォルトで除外されます。エージェントに独立したアカウントが必要な場合は、
そのエージェント用に個別の OAuth ログインを設定してください。

## Anthropic Claude CLI の再利用

OpenClaw は、認可済みの認証経路として Anthropic Claude CLI の再利用と `claude -p` をサポートしています。
ホスト上ですでにローカルの Claude ログインがある場合、
オンボーディング／設定時にそれを直接再利用できます。Anthropic setup-token は、
サポート対象のトークン認証経路として引き続き利用できますが、OpenClaw は
利用可能な場合には Claude CLI の再利用を優先します。

<Warning>
Anthropic の公開 Claude Code ドキュメントには、Claude Code の直接利用は
Claude サブスクリプションの上限内に留まると記載されており、Anthropic のスタッフからは
OpenClaw 形式の Claude CLI 利用が再び許可されたとの回答を得ています。そのため OpenClaw は、
Anthropic が新しいポリシーを公開しない限り、この連携における Claude CLI の再利用と
`claude -p` の使用を認可済みとして扱います。

Anthropic の現在の Claude Code 直接利用プランに関するドキュメントについては、[Pro または Max
プランでの Claude Code の使用](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
および [Team または Enterprise
プランでの Claude Code の使用](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/)を参照してください。

OpenClaw でその他のサブスクリプション形式の選択肢を使用する場合は、[OpenAI
Codex](/ja-JP/providers/openai)、[Qwen Cloud Coding
Plan](/ja-JP/providers/qwen)、[MiniMax Coding Plan](/ja-JP/providers/minimax)、
および [Z.AI／GLM Coding Plan](/ja-JP/providers/zai)を参照してください。
</Warning>

## OAuth 交換（ログインの仕組み）

OpenClaw の対話型ログインフローは `openclaw/plugin-sdk/llm.ts` に実装され、ウィザード／コマンドに接続されています。

### Anthropic setup-token

フローの概要：

1. Claude Code がある任意のマシンで `claude setup-token` を実行してトークンを作成し、OpenClaw から Anthropic setup-token または paste-token を開始します
2. OpenClaw は生成された Anthropic 認証情報を認証プロファイルに保存します
3. モデル選択は `anthropic/...` のままです
4. 既存の Anthropic 認証プロファイルは、ロールバック／順序制御のため引き続き利用できます

### OpenAI Codex（ChatGPT OAuth）

OpenAI Codex OAuth は、OpenClaw のワークフローを含め、Codex CLI の外部での使用が明示的にサポートされています。

ログインコマンドでは、正規の OpenAI プロバイダー ID を使用します。

```bash
openclaw models auth login --provider openai
```

1 つのエージェントで複数の ChatGPT/Codex OAuth アカウントを使用するには、
`--profile-id openai:<name>` を使用します。新しいプロファイルには `openai-codex:<name>` を使用しないでください。
Doctor はその古いプレフィックスを衝突のない `openai:*` プロファイル ID に移行します。
プロファイル ID を `auth.order` または `/model ...@<profileId>` にコピーする前に、
修復後に `openclaw models auth list --provider openai` を実行してください。

フローの概要（PKCE）：

1. PKCE 検証子／チャレンジとランダムな `state` を生成します
2. `https://auth.openai.com/oauth/authorize?...`（スコープ
   `openid profile email offline_access`）を開きます
3. `http://localhost:1455/auth/callback` でコールバックの取得を試みます（
   コールバックホストのデフォルトは `localhost` で、ループバックホストのみを受け付けます。
   `OPENCLAW_OAUTH_CALLBACK_HOST` でオーバーライドします）
4. コールバックが到着する前にコードを貼り付けられる場合（または
   リモート／ヘッドレス環境でコールバックをバインドできない場合）は、代わりにリダイレクト URL／コードを
   貼り付けます。手動貼り付けはブラウザーのコールバックと競合し、先に完了した方が採用されます
5. `https://auth.openai.com/oauth/token` でコードを交換します
6. アクセストークンから `accountId` を抽出し、`{ access, refresh, expires, accountId }` を保存します

ウィザードの経路は `openclaw onboard` → 認証の選択肢 `openai` です。

## 更新＋有効期限

プロファイルには `expires` タイムスタンプが保存されます。ランタイムでは次のように動作します。

- `expires` が未来の場合、保存済みのアクセストークンを使用します
- 期限切れの場合、（ファイルロック下で）更新し、保存済みの認証情報を上書きします
- セカンダリエージェントが継承されたメインエージェントの OAuth プロファイルを読み取る場合、
  更新では、更新トークンをセカンダリエージェントのストアにコピーせず、
  メインエージェントのストアへ書き戻します
- 外部管理の CLI 認証情報（Claude CLI、限定的な Codex CLI ブートストラップ。
  [トークンシンク](#the-token-sink-why-it-exists)を参照）は、
  コピーされた更新トークンを使用せず、再読み込みされます。管理対象の更新に失敗した場合、
  OpenClaw は外部 CLI のトークン情報を返さず、
  影響を受けたプロファイルを再認証が必要なものとして報告します。

更新フローは自動です。通常、トークンを手動で管理する必要はありません。

## 複数アカウント（プロファイル）＋ルーティング

2 つのパターンがあります。

### 1) 推奨：個別のエージェント

「個人用」と「仕事用」を一切相互作用させたくない場合は、分離されたエージェント
（個別のセッション＋認証情報＋ワークスペース）を使用します。

```bash
openclaw agents add work
openclaw agents add personal
```

次に、エージェントごとに認証を設定し（ウィザード）、チャットを適切なエージェントへルーティングします。

### 2) 高度：1 つのエージェント内に複数のプロファイル

認証プロファイルストアでは、同じプロバイダーに対して複数のプロファイル ID を使用できます。
使用するものを次の方法で選択します。

- 設定の順序（`auth.order`）によるグローバル指定
- `/model ...@<profileId>` によるセッション単位の指定

例（セッションのオーバーライド）：

- `/model Opus@anthropic:work`

既存のプロファイル ID を一覧表示するには、次を使用します。

```bash
openclaw models auth list --provider <id>
```

関連ドキュメント：

- [モデルのフェイルオーバー](/ja-JP/concepts/model-failover)（ローテーション＋クールダウンのルール）
- [スラッシュコマンド](/ja-JP/tools/slash-commands)（コマンドサーフェス）

## 関連項目

- [認証](/ja-JP/gateway/authentication) - モデルプロバイダー認証の概要
- [シークレット](/ja-JP/gateway/secrets) - 認証情報の保存と SecretRef
- [設定リファレンス](/ja-JP/gateway/configuration-reference#auth-storage) - 認証設定キー
