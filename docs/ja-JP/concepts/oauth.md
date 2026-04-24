---
read_when:
    - OpenClawのOAuthをエンドツーエンドで理解したい場合
    - トークン無効化 / ログアウトの問題に遭遇した場合
    - Claude CLIまたはOAuth認証フローが必要な場合
    - 複数アカウントまたはプロファイルルーティングが必要な場合
summary: 'OpenClawにおけるOAuth: トークン交換、保存、およびマルチアカウントパターン'
title: OAuth
x-i18n:
    generated_at: "2026-04-24T04:54:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 81b8891850123c32a066dbfb855feb132bc1f2bbc694f10ee2797b694bd5d848
    source_path: concepts/oauth.md
    workflow: 15
---

OpenClawは、それを提供するプロバイダー向けに、OAuthによる「サブスクリプション認証」をサポートしています
（特に**OpenAI Codex（ChatGPT OAuth）**）。Anthropicについては、現在の実用的な区分は次のとおりです。

- **Anthropic API key**: 通常のAnthropic API課金
- **OpenClaw内のAnthropic Claude CLI / サブスクリプション認証**: Anthropicスタッフから、この使用法は再び許可されていると案内されています

OpenAI Codex OAuthは、OpenClawのような外部ツールでの使用が明示的にサポートされています。
このページでは、次を説明します。

本番環境のAnthropicでは、API key認証のほうがより安全で推奨される経路です。

- OAuthの**トークン交換**がどのように機能するか（PKCE）
- トークンが**どこに保存**されるか（およびその理由）
- **複数アカウント**の扱い方（プロファイル + セッションごとの上書き）

OpenClawは、独自のOAuthまたはAPI-key
フローを同梱する**プロバイダーPlugin**もサポートします。実行には次を使用します。

```bash
openclaw models auth login --provider <id>
```

## トークンシンク（これが存在する理由）

OAuthプロバイダーは、ログイン/リフレッシュフローのたびに**新しいrefresh token**を発行することがよくあります。一部のプロバイダー（またはOAuthクライアント）は、同じユーザー/アプリに対して新しいものが発行されると、古いrefresh tokenを無効化することがあります。

実際の症状:

- OpenClaw _と_ Claude Code / Codex CLIの両方でログインすると → 後でどちらか一方がランダムに「ログアウト」される

これを減らすため、OpenClawは`auth-profiles.json`を**トークンシンク**として扱います。

- ランタイムは**1か所**から資格情報を読み取る
- 複数プロファイルを保持し、決定的にルーティングできる
- Codex CLIのような外部CLIから資格情報を再利用する場合、OpenClawは
  それらを来歴付きでミラーし、refresh token自体を回転させる代わりに
  その外部ソースを再読込する

## 保存（トークンの保存先）

シークレットは**エージェントごと**に保存されます。

- Authプロファイル（OAuth + API keys + 任意の値レベルref）: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- レガシー互換ファイル: `~/.openclaw/agents/<agentId>/agent/auth.json`
  （静的な`api_key`エントリは発見時に除去されます）

レガシーのインポート専用ファイル（引き続きサポートされますが、メインストアではありません）:

- `~/.openclaw/credentials/oauth.json`（初回使用時に`auth-profiles.json`へインポートされます）

上記はすべて`$OPENCLAW_STATE_DIR`（state dir上書き）にも従います。完全なリファレンス: [/gateway/configuration](/ja-JP/gateway/configuration-reference#auth-storage)

静的なSecretRefとランタイムスナップショット有効化動作については、[Secrets Management](/ja-JP/gateway/secrets)を参照してください。

## Anthropicレガシートークン互換性

<Warning>
Anthropicの公開Claude Codeドキュメントでは、Claude Codeを直接使用する場合は
Claudeのサブスクリプション制限内にとどまるとされており、AnthropicスタッフからもOpenClaw風のClaude
CLI使用は再び許可されていると案内されています。そのためOpenClawは、Anthropicが
新しいポリシーを公開しない限り、この連携におけるClaude CLI再利用と
`claude -p`使用を許可済みとして扱います。

Anthropicの現在の直接Claude Codeプランのドキュメントについては、
[Using Claude Code
with your Pro or Max
plan](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
および[Using Claude Code with your Team or Enterprise
plan](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/)を参照してください。

OpenClawで他のサブスクリプション型オプションが必要な場合は、[OpenAI
Codex](/ja-JP/providers/openai)、[Qwen Cloud Coding
Plan](/ja-JP/providers/qwen)、[MiniMax Coding Plan](/ja-JP/providers/minimax)、
および[Z.AI / GLM Coding Plan](/ja-JP/providers/glm)を参照してください。
</Warning>

OpenClawはAnthropic setup-tokenもサポートされたトークン認証パスとして公開していますが、現在は可能ならClaude CLI再利用と`claude -p`を優先します。

## Anthropic Claude CLI移行

OpenClawはAnthropic Claude CLI再利用を再びサポートしています。ホスト上に既存の
Claudeログインがある場合、オンボーディング/設定からそれを直接再利用できます。

## OAuth交換（ログインの仕組み）

OpenClawの対話型ログインフローは`@mariozechner/pi-ai`に実装されており、ウィザード/コマンドに接続されています。

### Anthropic setup-token

フローの形:

1. OpenClawからAnthropic setup-tokenを開始するか、トークンを貼り付ける
2. OpenClawが、得られたAnthropic資格情報をauthプロファイルに保存する
3. モデル選択は`anthropic/...`のまま維持される
4. 既存のAnthropic authプロファイルは、ロールバック/順序制御のため引き続き利用可能

### OpenAI Codex（ChatGPT OAuth）

OpenAI Codex OAuthは、Codex CLI外部での使用、OpenClawワークフローを含めて、明示的にサポートされています。

フローの形（PKCE）:

1. PKCE verifier/challenge + ランダム`state`を生成する
2. `https://auth.openai.com/oauth/authorize?...`を開く
3. `http://127.0.0.1:1455/auth/callback`でコールバックの取得を試みる
4. コールバックをbindできない場合（またはリモート/ヘッドレス環境の場合）、リダイレクトURL/codeを貼り付ける
5. `https://auth.openai.com/oauth/token`で交換する
6. access tokenから`accountId`を抽出し、`{ access, refresh, expires, accountId }`を保存する

ウィザード経路は`openclaw onboard` → auth選択`openai-codex`です。

## リフレッシュ + 有効期限

プロファイルには`expires`タイムスタンプが保存されます。

実行時:

- `expires`が未来なら → 保存済みaccess tokenを使用する
- 期限切れなら → リフレッシュし（ファイルロック下で）、保存済み資格情報を上書きする
- 例外: 再利用された外部CLI資格情報は外部管理のままであり、OpenClawは
  CLI認証ストアを再読込し、コピーしたrefresh token自体は決して消費しない

リフレッシュフローは自動であり、通常はトークンを手動管理する必要はありません。

## 複数アカウント（プロファイル） + ルーティング

2つのパターンがあります。

### 1) 推奨: エージェントを分ける

「personal」と「work」を決して相互作用させたくない場合は、分離されたエージェント（セッション + 資格情報 + ワークスペースを分離）を使います。

```bash
openclaw agents add work
openclaw agents add personal
```

その後、エージェントごとに認証を設定し（ウィザード）、適切なエージェントへチャットをルーティングします。

### 2) 高度: 1つのエージェント内で複数プロファイルを使う

`auth-profiles.json`は、同じプロバイダーに対して複数のプロファイルIDをサポートします。

どのプロファイルを使うかの指定方法:

- グローバルには設定順序（`auth.order`）経由
- セッションごとには`/model ...@<profileId>`経由

例（セッション上書き）:

- `/model Opus@anthropic:work`

存在するプロファイルIDを確認する方法:

- `openclaw channels list --json`（`auth[]`を表示します）

関連ドキュメント:

- [/concepts/model-failover](/ja-JP/concepts/model-failover)（ローテーション + クールダウンルール）
- [/tools/slash-commands](/ja-JP/tools/slash-commands)（コマンドインターフェース）

## 関連

- [Authentication](/ja-JP/gateway/authentication) — モデルプロバイダー認証の概要
- [Secrets](/ja-JP/gateway/secrets) — 資格情報ストレージとSecretRef
- [Configuration Reference](/ja-JP/gateway/configuration-reference#auth-storage) — 認証設定キー
