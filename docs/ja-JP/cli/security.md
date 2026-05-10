---
read_when:
    - config/state の簡易セキュリティ監査を実行したい
    - 安全な「fix」提案（権限、デフォルトを厳格化）を適用したい場合
summary: '`openclaw security` の CLI リファレンス（よくあるセキュリティ上の落とし穴を監査し修正する）'
title: セキュリティ
x-i18n:
    generated_at: "2026-05-10T19:29:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: fb7c65b2d5b17ade8756997f53f28283fbbc9146ccc460fb0e2d49b6d64777e5
    source_path: cli/security.md
    workflow: 16
---

# `openclaw security`

セキュリティツール（監査 + 任意の修正）。

関連:

- セキュリティガイド: [セキュリティ](/ja-JP/gateway/security)

## 監査

```bash
openclaw security audit
openclaw security audit --deep
openclaw security audit --deep --password <password>
openclaw security audit --deep --token <token>
openclaw security audit --fix
openclaw security audit --json
```

通常の `security audit` はコールドな設定/ファイルシステム/読み取り専用パスに留まります。デフォルトではPluginランタイムのセキュリティコレクターを検出しないため、通常の監査でインストール済みのすべてのPluginランタイムを読み込むことはありません。ベストエフォートのライブGatewayプローブとPlugin所有のセキュリティ監査コレクターを含めるには、`--deep` を使用してください。明示的な内部呼び出し元も、適切なランタイムスコープをすでに持っている場合は、それらのPlugin所有コレクターを有効にできます。

複数のDM送信者がメインセッションを共有している場合、監査は警告し、**セキュアDMモード**を推奨します。共有受信箱には `session.dmScope="per-channel-peer"`（マルチアカウントチャネルには `per-account-channel-peer`）を使用します。
これは、協調的/共有受信箱の堅牢化を目的としています。相互に信頼できない、または敵対的な運用者が1つのGatewayを共有する構成は推奨されません。別々のGateway（または別々のOSユーザー/ホスト）で信頼境界を分離してください。
また、設定から共有ユーザーの流入がありそうだと推測される場合（たとえば、オープンなDM/グループポリシー、設定済みのグループターゲット、ワイルドカード送信者ルールなど）、`security.trust_model.multi_user_heuristic` も出力し、OpenClawはデフォルトでパーソナルアシスタントの信頼モデルであることを通知します。
意図的な共有ユーザー構成では、すべてのセッションをサンドボックス化し、ファイルシステムアクセスをワークスペーススコープに限定し、個人/プライベートのIDや資格情報をそのランタイムから切り離すことが監査ガイダンスです。
また、小規模モデル（`<=300B`）がサンドボックス化なしで使用され、Web/ブラウザツールが有効な場合も警告します。
Webhook流入については、`hooks.token` がGatewayトークンを再利用している場合、`hooks.token` が短い場合、`hooks.path="/"` の場合、`hooks.defaultSessionKey` が未設定の場合、`hooks.allowedAgentIds` が無制限の場合、リクエストの `sessionKey` 上書きが有効な場合、また上書きが有効で `hooks.allowedSessionKeyPrefixes` がない場合に警告します。
また、サンドボックスモードがオフのままサンドボックスDocker設定が構成されている場合、`gateway.nodes.denyCommands` が効果のないパターン風/不明なエントリを使用している場合（正確なNodeコマンド名の照合のみで、シェルテキストのフィルタリングではありません）、`gateway.nodes.allowCommands` が危険なNodeコマンドを明示的に有効にしている場合、グローバルな `tools.profile="minimal"` がエージェントツールプロファイルで上書きされている場合、書き込み/編集ツールが無効でも `exec` が制約のあるサンドボックスファイルシステム境界なしで利用可能な場合、オープングループがサンドボックス/ワークスペースガードなしでランタイム/ファイルシステムツールを公開している場合、インストール済みPluginツールが寛容なツールポリシーの下で到達可能になり得る場合にも警告します。
また、`gateway.allowRealIpFallback=true`（プロキシが誤設定されている場合のヘッダー偽装リスク）と `discovery.mdns.mode="full"`（mDNS TXTレコード経由のメタデータ漏えい）も検出します。
また、サンドボックスブラウザが `sandbox.browser.cdpSourceRange` なしでDocker `bridge` ネットワークを使用している場合も警告します。
また、危険なサンドボックスDockerネットワークモード（`host` や `container:*` 名前空間参加を含む）も検出します。
また、既存のサンドボックスブラウザDockerコンテナにハッシュラベルが存在しない、または古い場合（たとえば `openclaw.browserConfigEpoch` がない移行前コンテナ）にも警告し、`openclaw sandbox recreate --browser --all` を推奨します。
また、npmベースのPlugin/フックインストール記録が固定されていない、整合性メタデータがない、または現在インストールされているパッケージバージョンからドリフトしている場合も警告します。
チャネルの許可リストが、安定したIDではなく変更可能な名前/メール/タグに依存している場合に警告します（該当する場合、Discord、Slack、Google Chat、Microsoft Teams、Mattermost、IRCスコープ）。
`gateway.auth.mode="none"` によって、共有シークレットなしでGateway HTTP API（`/tools/invoke` と有効な `/v1/*` エンドポイント）が到達可能になる場合に警告します。
`dangerous`/`dangerously` で始まる設定は、明示的な緊急用の運用者上書きです。それを有効にすること自体は、セキュリティ脆弱性レポートではありません。
危険なパラメーターの完全な一覧については、[セキュリティ](/ja-JP/gateway/security)の「安全でない、または危険なフラグの概要」セクションを参照してください。

SecretRefの動作:

- `security audit` は、対象パスでサポートされるSecretRefを読み取り専用モードで解決します。
- 現在のコマンドパスでSecretRefが利用できない場合、監査は継続し、クラッシュする代わりに `secretDiagnostics` を報告します。
- `--token` と `--password` は、そのコマンド呼び出しのディーププローブ認証だけを上書きします。設定やSecretRefマッピングを書き換えることはありません。

## JSON出力

CI/ポリシーチェックには `--json` を使用します:

```bash
openclaw security audit --json | jq '.summary'
openclaw security audit --deep --json | jq '.findings[] | select(.severity=="critical") | .checkId'
```

`--fix` と `--json` を組み合わせた場合、出力には修正アクションと最終レポートの両方が含まれます:

```bash
openclaw security audit --fix --json | jq '{fix: .fix.ok, summary: .report.summary}'
```

## `--fix` が変更する内容

`--fix` は、安全で決定的な修復を適用します:

- 一般的な `groupPolicy="open"` を `groupPolicy="allowlist"` に切り替えます（サポート対象チャネルのアカウントバリアントを含む）
- WhatsAppのグループポリシーが `allowlist` に切り替わる場合、そのリストが存在し、設定がまだ `allowFrom` を定義していなければ、保存済みの `allowFrom` ファイルから `groupAllowFrom` を初期化します
- `logging.redactSensitive` を `"off"` から `"tools"` に設定します
- 状態/設定ファイルと、一般的な機密ファイル（`credentials/*.json`、`auth-profiles.json`、`sessions.json`、セッション `*.jsonl`）の権限を厳格化します
- `openclaw.json` から参照される設定インクルードファイルも厳格化します
- POSIXホストでは `chmod`、Windowsでは `icacls` リセットを使用します

`--fix` は次のことは**行いません**:

- トークン/パスワード/APIキーのローテーション
- ツール（`gateway`、`cron`、`exec` など）の無効化
- Gatewayのバインド/認証/ネットワーク公開の選択の変更
- Plugin/Skillsの削除または書き換え

## 関連

- [CLIリファレンス](/ja-JP/cli)
- [セキュリティ監査](/ja-JP/gateway/security)
