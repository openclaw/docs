---
read_when:
    - OpenClaw OAuth の全体像をエンドツーエンドで理解したい場合
    - トークンの無効化／ログアウトの問題が発生する
    - Claude CLI または OAuth 認証フローを使用したい場合
    - 複数のアカウントまたはプロファイルルーティングを使用したい場合
summary: OpenClaw における OAuth：トークン交換、保存、マルチアカウントのパターン
title: OAuth
x-i18n:
    generated_at: "2026-07-11T22:12:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 51aa98a9cb9614107ce979eca235c175a1748df2facdded852cd8899cebba22c
    source_path: concepts/oauth.md
    workflow: 16
---

OpenClaw は、OAuth（「サブスクリプション認証」）を提供するプロバイダーで OAuth をサポートしています。特に **OpenAI Codex（ChatGPT OAuth）** と **Anthropic Claude CLI の再利用**に対応しています。
Anthropic では、実際には次のように分かれます。

- **Anthropic API キー**：通常の Anthropic API 課金。
- **OpenClaw 内での Anthropic Claude CLI / サブスクリプション認証**：Anthropic のスタッフから、この利用方法は再び許可されているとの回答を得たため、Anthropic が新しいポリシーを公開しない限り、OpenClaw はこの連携における Claude CLI の再利用と `claude -p` の使用を認可されたものとして扱います。本番環境で Anthropic を使用する場合は、引き続き API キー認証のほうが安全な推奨方法です。

OpenClaw は、OpenAI API キー認証と ChatGPT/Codex OAuth の両方を、正規のプロバイダー ID `openai` の配下に保存します。古い `openai-codex:*` プロファイル ID と `auth.order.openai-codex` エントリは、`openclaw doctor --fix` によって修復されるレガシー状態です。新しい設定では、`openai:*` プロファイル ID と `auth.order.openai` を使用してください。

このページでは、次の内容を扱います。

- OAuth の**トークン交換**の仕組み（PKCE）
- トークンが**保存される場所**（およびその理由）
- **複数アカウント**の扱い方（プロファイル + セッション単位の上書き）

独自の OAuth または API キーフローを提供するプロバイダー Plugin も、同じエントリポイントを使用します。

```bash
openclaw models auth login --provider <id>
```

## トークンシンク（存在する理由）

OAuth プロバイダーは通常、ログインまたは更新のたびに新しいリフレッシュトークンを発行します。一部のプロバイダーは、同じユーザーまたはアプリに新しいリフレッシュトークンを発行すると、以前のリフレッシュトークンを無効化します。実際に現れる症状としては、OpenClaw と Claude Code / Codex CLI の両方でログインすると、後になってどちらか一方が不規則にログアウトされます。

これを減らすため、OpenClaw は認証プロファイルストアを**トークンシンク**として扱います。

- ランタイムは、エージェントごとに 1 か所から認証情報を読み取ります
- 複数のプロファイルを共存させ、決定論的にルーティングできます
- 外部 CLI の再利用はプロバイダー固有です。OpenClaw がプロバイダーのローカル OAuth プロファイルを所有した後は、ローカルのリフレッシュトークンが正規のものになります。そのローカルリフレッシュトークンが拒否された場合、OpenClaw は外部 CLI のトークン情報へフォールバックせず、再認証が必要なプロファイルを報告します。Codex CLI のブートストラップはさらに限定されます。OpenClaw がそのプロバイダーの OAuth を所有する前に、空の `openai:default` 形式のプロファイルを初期化する場合にのみ使用できます。それ以降は、OpenClaw が管理する更新が正規のものとして維持されます
- ステータス処理と起動処理では、外部 CLI の検出対象を設定済みのプロバイダー集合に限定します。そのため、単一プロバイダー構成で無関係な CLI ログインストアが調査されることはありません

## 保存先（トークンの場所）

シークレットはエージェントごとに、論理名 `auth-profiles.json` をキーとして保存されます（基盤となるストアはエージェントの SQLite データベースです。JSON 名は互換性とツール上の表示のために維持されています）。

- 認証プロファイル（OAuth + API キー + 任意の値レベル参照）：
  `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- レガシー互換ファイル：`~/.openclaw/agents/<agentId>/agent/auth.json`
  （静的な `api_key` エントリは、検出時に削除されます）

レガシーのインポート専用ファイル（引き続きサポートされますが、メインストアではありません）：

- `~/.openclaw/credentials/oauth.json`（初回使用時に認証プロファイルストアへインポートされます）

上記すべてで `$OPENCLAW_STATE_DIR`（状態ディレクトリの上書き）も適用されます。完全なリファレンス：[/gateway/configuration-reference#auth-storage](/ja-JP/gateway/configuration-reference#auth-storage)

静的シークレット参照とランタイムスナップショットの有効化動作については、[シークレット管理](/ja-JP/gateway/secrets)を参照してください。

セカンダリエージェントにローカル認証プロファイルがない場合、OpenClaw はデフォルトまたはメインエージェントのストアから読み取り透過型の継承を使用します。読み取り時にメインエージェントのストアを複製することはありません。OAuth リフレッシュトークンは特に機密性が高く、一部のプロバイダーは使用後にリフレッシュトークンをローテーションまたは無効化するため、通常のコピー処理ではデフォルトで除外されます。エージェントが独立したアカウントを必要とする場合は、そのエージェント用に別の OAuth ログインを設定してください。

## Anthropic Claude CLI の再利用

OpenClaw は、認可された認証方法として Anthropic Claude CLI の再利用と `claude -p` をサポートします。ホスト上ですでにローカルの Claude ログインがある場合、オンボーディングまたは設定処理から直接再利用できます。Anthropic セットアップトークンも、サポートされるトークン認証方法として引き続き利用できますが、Claude CLI を再利用できる場合、OpenClaw はそちらを優先します。

<Warning>
Anthropic の公開 Claude Code ドキュメントには、Claude Code の直接利用は Claude サブスクリプションの上限内に収まると記載されています。また、Anthropic のスタッフから、OpenClaw 形式の Claude CLI 利用は再び許可されているとの回答を得ています。そのため、Anthropic が新しいポリシーを公開しない限り、OpenClaw はこの連携における Claude CLI の再利用と `claude -p` の使用を認可されたものとして扱います。

Anthropic による現在の Claude Code 直接利用プランのドキュメントについては、[Pro または Max プランでの Claude Code の使用](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)および[Team または Enterprise プランでの Claude Code の使用](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/)を参照してください。

OpenClaw でサブスクリプション形式のほかの選択肢を利用する場合は、[OpenAI Codex](/ja-JP/providers/openai)、[Qwen Cloud Coding Plan](/ja-JP/providers/qwen)、[MiniMax Coding Plan](/ja-JP/providers/minimax)、および [Z.AI / GLM Coding Plan](/ja-JP/providers/zai)を参照してください。
</Warning>

## OAuth 交換（ログインの仕組み）

OpenClaw の対話型ログインフローは `openclaw/plugin-sdk/llm.ts` に実装され、ウィザードとコマンドに接続されています。

### Anthropic セットアップトークン

フローの概要：

1. OpenClaw から Anthropic セットアップトークンまたはトークン貼り付けを開始する
2. OpenClaw が取得した Anthropic 認証情報を認証プロファイルに保存する
3. モデル選択は `anthropic/...` のまま維持される
4. 既存の Anthropic 認証プロファイルは、ロールバックと順序制御のために引き続き利用できる

### OpenAI Codex（ChatGPT OAuth）

OpenAI Codex OAuth は、OpenClaw のワークフローを含め、Codex CLI の外部での使用が明示的にサポートされています。

ログインコマンドでは、正規の OpenAI プロバイダー ID を使用します。

```bash
openclaw models auth login --provider openai
```

1 つのエージェントで複数の ChatGPT/Codex OAuth アカウントを使用するには、`--profile-id openai:<name>` を使用します。新しいプロファイルには `openai-codex:<name>` を使用しないでください。Doctor は、その古いプレフィックスを衝突しない `openai:*` プロファイル ID へ移行します。プロファイル ID を `auth.order` または `/model ...@<profileId>` にコピーする前に、修復後に `openclaw models auth list --provider openai` を実行してください。

フローの概要（PKCE）：

1. PKCE 検証子とチャレンジ、およびランダムな `state` を生成する
2. `https://auth.openai.com/oauth/authorize?...` を開く（スコープは
   `openid profile email offline_access`）
3. `http://localhost:1455/auth/callback` でコールバックの取得を試みる（コールバックホストのデフォルトは `localhost` で、ループバックホストのみを受け付けます。`OPENCLAW_OAUTH_CALLBACK_HOST` で上書きできます）
4. コールバックが到着する前にコードを貼り付けられる場合（またはリモートやヘッドレス環境でコールバックをバインドできない場合）は、代わりにリダイレクト URL またはコードを貼り付ける。手動貼り付けとブラウザーのコールバックは競合し、先に完了したほうが採用される
5. `https://auth.openai.com/oauth/token` でコードを交換する
6. アクセストークンから `accountId` を抽出し、`{ access, refresh, expires, accountId }` を保存する

ウィザードの経路は `openclaw onboard` → 認証の選択肢 `openai` です。

## 更新と有効期限

プロファイルには `expires` タイムスタンプが保存されます。ランタイムでは次のように動作します。

- `expires` が将来の時刻なら、保存済みのアクセストークンを使用する
- 期限切れなら、ファイルロック下で更新し、保存済みの認証情報を上書きする
- セカンダリエージェントが継承したメインエージェントの OAuth プロファイルを読み取った場合、リフレッシュトークンをセカンダリエージェントのストアへコピーせず、更新結果をメインエージェントのストアへ書き戻す
- 外部管理の CLI 認証情報（Claude CLI、および限定的な Codex CLI ブートストラップ。[トークンシンク](#the-token-sink-why-it-exists)を参照）は、コピーしたリフレッシュトークンを使用する代わりに再読み取りされる。管理対象の更新が失敗した場合、OpenClaw は外部 CLI のトークン情報を返さず、再認証が必要な対象プロファイルを報告する

更新フローは自動です。通常、トークンを手動で管理する必要はありません。

## 複数アカウント（プロファイル）とルーティング

2 つのパターンがあります。

### 1）推奨：エージェントを分離する

「個人用」と「仕事用」を一切連携させたくない場合は、分離されたエージェント（個別のセッション + 認証情報 + ワークスペース）を使用します。

```bash
openclaw agents add work
openclaw agents add personal
```

その後、エージェントごとに認証を設定し（ウィザード）、チャットを適切なエージェントへルーティングします。

### 2）高度：1 つのエージェントで複数のプロファイルを使用する

認証プロファイルストアは、同じプロバイダーに対する複数のプロファイル ID をサポートします。
使用するプロファイルは次の方法で選択します。

- 設定の順序（`auth.order`）によるグローバルな選択
- `/model ...@<profileId>` によるセッション単位の選択

例（セッション単位の上書き）：

- `/model Opus@anthropic:work`

既存のプロファイル ID は次のコマンドで一覧表示できます。

```bash
openclaw models auth list --provider <id>
```

関連ドキュメント：

- [モデルのフェイルオーバー](/ja-JP/concepts/model-failover)（ローテーション + クールダウンのルール）
- [スラッシュコマンド](/ja-JP/tools/slash-commands)（コマンドインターフェース）

## 関連情報

- [認証](/ja-JP/gateway/authentication) - モデルプロバイダー認証の概要
- [シークレット](/ja-JP/gateway/secrets) - 認証情報の保存と SecretRef
- [設定リファレンス](/ja-JP/gateway/configuration-reference#auth-storage) - 認証設定キー
