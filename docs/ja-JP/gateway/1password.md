---
read_when:
    - API キーを openclaw.json から削除して 1Password 内に保存する場合
    - Gateway をヘッドレスで実行し、op のサービスアカウント認証が必要です
    - op CLI を使用して、エージェントにシークレットを読み取らせたり注入させたりする場合
summary: 1Password CLI で Gateway のシークレットを解決し、エージェントが同梱の 1password Skills を使用できるようにする
title: 1Password
x-i18n:
    generated_at: "2026-07-14T13:40:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: dbe92009cd4409ae8e7235f5462f059783d5ca863557f1a7b12cacd47ee718c9
    source_path: gateway/1password.md
    workflow: 16
---

OpenClaw は、2 つの独立した方法で **1Password** と連携します。

- **設定シークレット:** `openclaw.json` 内の任意の [SecretRef](/ja-JP/gateway/secrets) フィールドは、実行時に `op` CLI を通じて解決できるため、API キーが設定ファイル内に保存されることはありません。
- **エージェントワークフロー:** バンドルされている `1password` skill により、エージェントは自身のタスク用にサインインし、`op` でシークレットを読み取ったり注入したりできます。

## 要件

- [1Password CLI](https://developer.1password.com/docs/cli/get-started/)（`op`）が Gateway ホストにインストールされていること（macOS では `brew install 1password-cli`）。
- `op` の認証モード:
  - **サービスアカウント**（ヘッドレス Gateway に推奨）: Gateway サービス環境で `OP_SERVICE_ACCOUNT_TOKEN` をエクスポートします。デスクトップアプリも対話的なサインインも不要です。
  - **デスクトップアプリ統合**: CLI 統合を有効にした 1Password アプリを同じマシンで実行します。最初の呼び出し時に Touch ID またはシステム認証が要求される場合があります。
  - **スタンドアロンサインイン**: `op signin` がセッションごとに入力を求めます。skill を介したエージェントでの利用は可能ですが、ヘッドレス Gateway での設定シークレット解決には適していません。

## op を使用した設定シークレットの解決

`op://vault/item/field` 参照を指定して `op read` を実行する exec シークレットプロバイダーを宣言し、SecretRef 対応フィールドから参照します。

```json5
{
  secrets: {
    providers: {
      onepassword_openai: {
        source: "exec",
        command: "/opt/homebrew/bin/op",
        allowSymlinkCommand: true, // Homebrew のシンボリックリンクされたバイナリには必須
        trustedDirs: ["/opt/homebrew"],
        args: ["read", "op://Personal/OpenClaw QA API Key/password"],
        passEnv: ["HOME"],
        jsonOnly: false,
      },
    },
  },
  models: {
    providers: {
      openai: {
        baseUrl: "https://api.openai.com/v1",
        models: [{ id: "gpt-5", name: "gpt-5" }],
        apiKey: { source: "exec", provider: "onepassword_openai", id: "value" },
      },
    },
  },
}
```

各要素の関係は次のとおりです。

- `command` は絶対パスである必要があります。`trustedDirs` はそのディレクトリを信頼済みとして指定し、Homebrew は `op` をシンボリックリンクとしてインストールするため、`allowSymlinkCommand` が必要です。
- `args` は `op://vault/item/field` 参照をそのまま渡します。OpenClaw 自体は `op://` スキームを解析せず、`op` バイナリが解決します。
- `passEnv` は、一覧に指定された変数を Gateway 環境から転送します。デスクトップアプリ統合には `HOME` が必要です。サービスアカウントでは、Gateway サービス環境に `OP_SERVICE_ACCOUNT_TOKEN` も存在する必要があります（`passEnv` に追加するか、トークンが設定ファイルから読み取り可能になることを許容する場合に限り、`env` で設定します）。
- 単一値の出力では `id: "value"` を維持します。`jsonOnly: true` と JSON ペイロードを使用する場合は、代わりに JSON ポインター ID でフィールドを指定します。
- シークレットごとにプロバイダーエントリを 1 つ作成すると、参照を監査しやすくなります。プロバイダーには利用元にちなんだ名前を付けます（`onepassword_openai`、`onepassword_telegram`）。

解決順序、キャッシュ、失敗時の動作については [Gateway シークレット](/ja-JP/gateway/secrets) を、SecretRef を受け入れるすべてのフィールドについては [SecretRef 認証情報サーフェス](/ja-JP/reference/secretref-credential-surface) を参照してください。

## ヘッドレス Gateway 向けサービスアカウントのセットアップ

1. 1Password アカウントでサービスアカウントを作成し、Gateway が必要とする保管庫アイテムのみに対する読み取りアクセス権を付与します。
2. `OP_SERVICE_ACCOUNT_TOKEN` を Gateway サービス（launchd plist、systemd ユニット、またはコンテナ環境）に渡します。
3. `"OP_SERVICE_ACCOUNT_TOKEN"` をプロバイダーの `passEnv` リストに追加します。
4. Gateway ホスト環境から確認します。`op whoami` は入力を求めずにサービスアカウントを表示する必要があります。

サービスアカウントによる読み取りでは、`op://` 参照内に保管庫名を明示する必要があります。アカウントのスコープは厳密に限定してください。これはベアラー認証情報です。

## エージェント向け 1password skill

OpenClaw には、エージェントを熟練した `op` オペレーターにする `1password` skill がバンドルされています。この skill は、利用可能な認証モード（サービスアカウント、デスクトップアプリ統合、スタンドアロンサインイン）を検出し、何かを読み取る前に `op whoami` でアクセスを確認します。また、シークレット値をディスクへ書き込むよりも `op run` / `op inject` の使用を優先します。この skill には `op` バイナリが必要で、存在しない場合は Homebrew によるインストールを案内します。

エージェントは、タスクの途中でデプロイトークンを読み取ったり、コマンドに環境変数を注入したりするなど、自身のワークフローにこの skill を使用します。これは設定シークレットの解決とは独立しています。Gateway は skill を一切介さずに SecretRef を解決します。

## セキュリティ上の注意

- exec プロバイダーを通じて解決されたシークレット値は Gateway のメモリ内に保持されます。設定スナップショットと `config.get` の応答では、SecretRef フィールドがマスキングされます。
- シークレット値を `openclaw.json`、ログ、またはチャットに決して記載しないでください。設定にはアイテム名を、1Password には値を保持します。
- 1Password の監査証跡にはサービスアカウントによるすべての読み取りが記録されるため、キーのローテーションとインシデントレビューを実施しやすくなります。

## トラブルシューティング

- `command not found` または生成エラー: `op` の絶対パスを使用し、そのディレクトリを `trustedDirs` に含めます。
- `op` は解決されるものの、シンボリックリンクエラーにより読み取りが失敗する場合: Homebrew インストールでは `allowSymlinkCommand: true` を設定します。
- `account is not signed in`: サービスアカウントでは、`OP_SERVICE_ACCOUNT_TOKEN` が Gateway サービスに渡され、`passEnv` に含まれていることを確認します。デスクトップ統合では、アプリが実行中でロック解除されていることを確認します。
- 最初の読み取りが遅い場合: プロバイダーの `timeoutMs` を増やします。負荷の高いホストでは、`op` のコールドスタートが厳しいタイムアウトを超えることがあります。
