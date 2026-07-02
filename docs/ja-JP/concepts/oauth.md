---
read_when:
    - OpenClaw OAuth をエンドツーエンドで理解したい
    - |-
      OpenClaw ドキュメント i18n 入力>
      トークンの無効化 / ログアウトの問題が発生している
    - Claude CLI または OAuth 認証フローを使用したい
    - 複数のアカウントまたはプロファイルのルーティングが必要な場合
summary: 'OpenClaw の OAuth: トークン交換、保存、マルチアカウントパターン'
title: OAuth
x-i18n:
    generated_at: "2026-07-02T22:22:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5cffefec8bb3e755bcd4583a7957510c7ba3b605e21a3fd876f27c8fc9aa65aa
    source_path: concepts/oauth.md
    workflow: 16
---

OpenClaw は、それを提供するプロバイダー向けに OAuth による「サブスクリプション認証」をサポートします
（特に **OpenAI Codex (ChatGPT OAuth)**）。Anthropic については、実用上の区分は
現在次のとおりです。

- **Anthropic API キー**: 通常の Anthropic API 課金
- **OpenClaw 内の Anthropic Claude CLI / サブスクリプション認証**: Anthropic スタッフから、
  この利用は再び許可されていると聞いています

OpenAI Codex OAuth は、OpenClaw のような外部ツールでの利用が明示的にサポートされています。

OpenClaw は、OpenAI API キー認証と ChatGPT/Codex OAuth の両方を
正規のプロバイダー id `openai` の下に保存します。古い `openai-codex:*` プロファイル id と
`auth.order.openai-codex` エントリは、`openclaw doctor --fix` によって修復される
レガシー状態です。新しい設定では `openai:*` プロファイル id と `auth.order.openai` を使用してください。

本番環境の Anthropic では、API キー認証がより安全な推奨パスです。

このページでは次を説明します。

- OAuth **トークン交換** の仕組み（PKCE）
- トークンが **保存** される場所（およびその理由）
- **複数アカウント** の扱い方（プロファイル + セッションごとのオーバーライド）

OpenClaw は、独自の OAuth または API キー
フローを同梱する **プロバイダーPlugin** もサポートします。次で実行します。

```bash
openclaw models auth login --provider <id>
```

## トークンシンク（存在する理由）

OAuth プロバイダーは、ログイン/リフレッシュフロー中に **新しいリフレッシュトークン** を発行することがよくあります。一部のプロバイダー（または OAuth クライアント）は、同じユーザー/アプリに対して新しいリフレッシュトークンが発行されると、古いリフレッシュトークンを無効化する場合があります。

実際に起きる症状:

- OpenClaw _と_ Claude Code / Codex CLI の両方でログインする → どちらか一方が後でランダムに「ログアウト」される

これを減らすため、OpenClaw は `auth-profiles.json` を **トークンシンク** として扱います。

- ランタイムは **1 か所** から認証情報を読み取る
- 複数のプロファイルを保持し、決定的にルーティングできる
- 外部 CLI の再利用はプロバイダー固有です。Codex CLI は空の
  `openai:default` プロファイルをブートストラップできますが、OpenClaw にローカル OAuth プロファイルがある場合は、
  ローカルのリフレッシュトークンが正規です。そのローカルリフレッシュトークンが拒否された場合、
  OpenClaw は Codex CLI のトークン素材を兄弟ランタイムのフォールバックとして使うのではなく、
  管理対象プロファイルを再認証対象として報告します。他の統合は
  外部管理のままにして、CLI 認証ストアを再読み取りできます
- すでに設定済みプロバイダーセットを把握しているステータスおよび起動パスは、
  外部 CLI 探索をそのセットに限定するため、単一プロバイダー構成で無関係な CLI ログインストアが
  プローブされることはありません

## ストレージ（トークンの保存先）

シークレットはエージェント認証ストアに保存されます。

- 認証プロファイル（OAuth + API キー + 任意の値レベル参照）: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- レガシー互換ファイル: `~/.openclaw/agents/<agentId>/agent/auth.json`
  （静的な `api_key` エントリは検出時に削除されます）

レガシーのインポート専用ファイル（引き続きサポートされますが、メインストアではありません）:

- `~/.openclaw/credentials/oauth.json`（初回使用時に `auth-profiles.json` へインポートされます）

上記はすべて `$OPENCLAW_STATE_DIR`（状態ディレクトリのオーバーライド）も尊重します。完全なリファレンス: [/gateway/configuration](/ja-JP/gateway/configuration-reference#auth-storage)

静的なシークレット参照とランタイムスナップショットの有効化動作については、[シークレット管理](/ja-JP/gateway/secrets) を参照してください。

セカンダリエージェントにローカル認証プロファイルがない場合、OpenClaw はデフォルト/メインエージェントストアからの読み取りスルー継承を使用します。読み取り時にメイン
エージェントの `auth-profiles.json` を複製することはありません。OAuth リフレッシュトークンは特に
機密性が高いものです。通常のコピーフローでは、利用後に一部のプロバイダーがリフレッシュトークンをローテーション
または無効化するため、デフォルトでそれらをスキップします。エージェントに独立したアカウントが必要な場合は、
そのエージェント用に別個の OAuth ログインを設定してください。

## Anthropic レガシートークン互換性

<Warning>
Anthropic の公開 Claude Code ドキュメントでは、Claude Code の直接利用は
Claude サブスクリプションの制限内に収まるとされています。また Anthropic スタッフから、OpenClaw スタイルの Claude
CLI 利用は再び許可されていると聞いています。そのため OpenClaw は、Anthropic が
新しいポリシーを公開しない限り、この統合における Claude CLI の再利用と
`claude -p` の利用を認可されたものとして扱います。

Anthropic の現在の direct-Claude-Code プランドキュメントについては、[Using Claude Code
with your Pro or Max
plan](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
および [Using Claude Code with your Team or Enterprise
plan](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/) を参照してください。

OpenClaw で他のサブスクリプション型オプションを使いたい場合は、[OpenAI
Codex](/ja-JP/providers/openai)、[Qwen Cloud Coding
Plan](/ja-JP/providers/qwen)、[MiniMax Coding Plan](/ja-JP/providers/minimax)、
および [Z.AI / GLM Coding Plan](/ja-JP/providers/zai) を参照してください。
</Warning>

OpenClaw は、Anthropic setup-token もサポート済みのトークン認証パスとして公開していますが、現在は利用可能な場合に Claude CLI の再利用と `claude -p` を優先します。

## Anthropic Claude CLI 移行

OpenClaw は Anthropic Claude CLI の再利用を再びサポートします。ホスト上にすでにローカルの
Claude ログインがある場合、オンボーディング/configure はそれを直接再利用できます。

## OAuth 交換（ログインの仕組み）

OpenClaw の対話型ログインフローは `openclaw/plugin-sdk/llm` に実装され、ウィザード/コマンドに接続されています。

### Anthropic setup-token

フローの形:

1. OpenClaw から Anthropic setup-token または paste-token を開始する
2. OpenClaw が結果の Anthropic 認証情報を認証プロファイルに保存する
3. モデル選択は `anthropic/...` のままになる
4. 既存の Anthropic 認証プロファイルはロールバック/順序制御に引き続き利用できる

### OpenAI Codex (ChatGPT OAuth)

OpenAI Codex OAuth は、OpenClaw ワークフローを含め、Codex CLI の外部での利用が明示的にサポートされています。

ログインコマンドは引き続き正規の OpenAI プロバイダー id を使用します。

```bash
openclaw models auth login --provider openai
```

1 つのエージェント内で複数の ChatGPT/Codex OAuth アカウントを使う場合は
`--profile-id openai:<name>` を使用します。新しいプロファイルに `openai-codex:<name>` は使用しないでください。Doctor は
その古いプレフィックスを衝突しない `openai:*` プロファイル id に移行します。修復後、プロファイル id を
`auth.order` または `/model ...@<profileId>` にコピーする前に
`openclaw models auth list --provider openai` を実行してください。

フローの形（PKCE）:

1. PKCE verifier/challenge + ランダムな `state` を生成する
2. `https://auth.openai.com/oauth/authorize?...` を開く
3. `http://127.0.0.1:1455/auth/callback` でコールバックの取得を試みる
4. コールバックをバインドできない場合（またはリモート/ヘッドレスの場合）、リダイレクト URL/code を貼り付ける
5. `https://auth.openai.com/oauth/token` で交換する
6. アクセストークンから `accountId` を抽出し、`{ access, refresh, expires, accountId }` を保存する

ウィザードパスは `openclaw onboard` → 認証選択 `openai` です。

## リフレッシュ + 期限切れ

プロファイルは `expires` タイムスタンプを保存します。

ランタイムでは:

- `expires` が未来の場合 → 保存済みアクセストークンを使用する
- 期限切れの場合 → （ファイルロック下で）リフレッシュし、保存済み認証情報を上書きする
- セカンダリエージェントが継承されたメインエージェントの OAuth プロファイルを読み取る場合、リフレッシュは
  リフレッシュトークンをセカンダリエージェントストアへコピーするのではなく、
  メインエージェントストアへ書き戻します
- 例外: 一部の外部 CLI 認証情報は外部管理のままです。OpenClaw は
  コピーされたリフレッシュトークンを消費するのではなく、それらの CLI 認証ストアを再読み取りします。
  Codex CLI ブートストラップは意図的により狭く、OpenClaw がそのプロバイダーの OAuth を
  所有する前に限り、空の `openai:default` または明示的に要求された OpenAI プロファイルだけをシードできます。
  その後は、OpenClaw 所有のリフレッシュがローカルプロファイルを正規に保ち、
  探索によって Codex CLI 認証がどの兄弟スロットにも追加されることはありません。
  管理対象のリフレッシュが失敗した場合、OpenClaw は外部 CLI トークン素材を返すのではなく、
  影響を受けたプロファイルを再認証対象として報告します。

リフレッシュフローは自動です。通常、トークンを手動で管理する必要はありません。

## 複数アカウント（プロファイル）+ ルーティング

2 つのパターンがあります。

### 1) 推奨: 別々のエージェント

「個人用」と「仕事用」を一切相互作用させたくない場合は、分離されたエージェント（別々のセッション + 認証情報 + ワークスペース）を使用します。

```bash
openclaw agents add work
openclaw agents add personal
```

その後、エージェントごとに認証（ウィザード）を設定し、チャットを適切なエージェントへルーティングします。

### 2) 高度: 1 つのエージェント内の複数プロファイル

`auth-profiles.json` は、同じプロバイダーに対して複数のプロファイル ID をサポートします。

使用するプロファイルの選択方法:

- 設定の順序指定（`auth.order`）によるグローバル指定
- `/model ...@<profileId>` によるセッションごとの指定

例（セッションオーバーライド）:

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
