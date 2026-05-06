---
read_when:
    - config/state の簡単なセキュリティ監査を実行したい場合
    - 安全な「修正」の提案（権限、デフォルトの厳格化）を適用したい場合
summary: '`openclaw security` の CLI リファレンス（よくあるセキュリティ上の落とし穴を監査して修正する）'
title: セキュリティ
x-i18n:
    generated_at: "2026-05-06T17:54:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0e70c9ea085bc9c0edebe801e4feb876d1cb776848d693e9699f4d238fc9b60f
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

通常の `security audit` は、コールドな設定/ファイルシステム/読み取り専用パスにとどまります。デフォルトでは Plugin ランタイムのセキュリティコレクターを検出しないため、日常的な監査でインストール済みのすべての Plugin ランタイムを読み込むことはありません。ベストエフォートのライブ Gateway プローブと、Plugin が所有するセキュリティ監査コレクターを含めるには `--deep` を使用します。明示的な内部呼び出し元も、適切なランタイムスコープをすでに持っている場合は、それらの Plugin 所有コレクターを有効にできます。

監査は、複数の DM 送信者がメインセッションを共有している場合に警告し、**セキュア DM モード**: 共有 inbox では `session.dmScope="per-channel-peer"`（または複数アカウントのチャネルでは `per-account-channel-peer`）を推奨します。
これは協調的な共有 inbox の強化を目的としています。互いに信頼されていない、または敵対的なオペレーターが単一の Gateway を共有する構成は推奨されません。別々の Gateway（または別々の OS ユーザー/ホスト）で信頼境界を分離してください。
また、設定が共有ユーザーの流入の可能性を示している場合（たとえば open DM/group ポリシー、設定済みのグループターゲット、ワイルドカード送信者ルールなど）、`security.trust_model.multi_user_heuristic` も出力し、OpenClaw がデフォルトでは個人アシスタントの信頼モデルであることを通知します。
意図的な共有ユーザー構成の場合、監査ガイダンスは、すべてのセッションをサンドボックス化し、ファイルシステムアクセスをワークスペーススコープに限定し、個人/プライベートの ID や認証情報をそのランタイムに置かないことです。
また、小規模モデル（`<=300B`）がサンドボックス化なしで使用され、web/browser ツールが有効な場合にも警告します。
Webhook 流入については、`hooks.token` が Gateway トークンを再利用している場合、`hooks.token` が短い場合、`hooks.path="/"` の場合、`hooks.defaultSessionKey` が未設定の場合、`hooks.allowedAgentIds` が無制限の場合、リクエストの `sessionKey` 上書きが有効な場合、および `hooks.allowedSessionKeyPrefixes` なしで上書きが有効な場合に警告します。
また、サンドボックスモードがオフなのにサンドボックス Docker 設定が構成されている場合、`gateway.nodes.denyCommands` が効果のないパターン風/不明なエントリを使用している場合（正確なノードコマンド名の一致のみで、シェルテキストのフィルタリングではありません）、`gateway.nodes.allowCommands` が危険なノードコマンドを明示的に有効にしている場合、グローバルな `tools.profile="minimal"` がエージェントのツールプロファイルで上書きされている場合、open group がサンドボックス/ワークスペースガードなしでランタイム/ファイルシステムツールを公開している場合、およびインストール済み Plugin ツールが寛容なツールポリシーの下で到達可能になる可能性がある場合にも警告します。
また、`gateway.allowRealIpFallback=true`（プロキシが誤設定されている場合のヘッダー偽装リスク）と `discovery.mdns.mode="full"`（mDNS TXT レコード経由のメタデータ漏えい）もフラグ付けします。
また、サンドボックスブラウザーが Docker `bridge` ネットワークを `sandbox.browser.cdpSourceRange` なしで使用している場合にも警告します。
また、危険なサンドボックス Docker ネットワークモード（`host` や `container:*` 名前空間 join を含む）もフラグ付けします。
また、既存のサンドボックスブラウザー Docker コンテナーにハッシュラベルが存在しない、または古い場合（たとえば `openclaw.browserConfigEpoch` がない移行前コンテナー）にも警告し、`openclaw sandbox recreate --browser --all` を推奨します。
また、npm ベースの Plugin/hook インストール記録がピン留めされていない場合、integrity メタデータがない場合、または現在インストールされているパッケージバージョンからずれている場合にも警告します。
チャネルの allowlist が安定した ID ではなく、変更可能な名前/メール/タグに依存している場合（該当する Discord、Slack、Google Chat、Microsoft Teams、Mattermost、IRC スコープ）に警告します。
`gateway.auth.mode="none"` により、共有シークレットなしで Gateway HTTP API（`/tools/invoke` と有効な `/v1/*` エンドポイント）が到達可能になる場合に警告します。
`dangerous`/`dangerously` で始まる設定は、break-glass 用の明示的なオペレーター上書きです。それを有効にすること自体は、セキュリティ脆弱性報告ではありません。
危険なパラメーターの完全な一覧については、[セキュリティ](/ja-JP/gateway/security) の「安全でない、または危険なフラグの概要」セクションを参照してください。

SecretRef の動作:

- `security audit` は、対象パスについて、サポート対象の SecretRef を読み取り専用モードで解決します。
- 現在のコマンドパスで SecretRef が利用できない場合、監査は続行し、クラッシュする代わりに `secretDiagnostics` を報告します。
- `--token` と `--password` は、そのコマンド実行における deep-probe 認証だけを上書きします。設定や SecretRef マッピングを書き換えることはありません。

## JSON 出力

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
- WhatsApp group ポリシーが `allowlist` に切り替わる場合、そのリストが存在し、設定がまだ `allowFrom` を定義していなければ、保存済みの `allowFrom` ファイルから `groupAllowFrom` をシードします
- `logging.redactSensitive` を `"off"` から `"tools"` に設定します
- state/config と一般的な機密ファイル（`credentials/*.json`、`auth-profiles.json`、`sessions.json`、セッション `*.jsonl`）の権限を厳格化します
- `openclaw.json` から参照される設定 include ファイルの権限も厳格化します
- POSIX ホストでは `chmod` を使用し、Windows では `icacls` リセットを使用します

`--fix` は以下を**行いません**:

- トークン/パスワード/API キーのローテーション
- ツール（`gateway`、`cron`、`exec` など）の無効化
- gateway bind/auth/network 公開の選択の変更
- plugins/skills の削除または書き換え

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [セキュリティ監査](/ja-JP/gateway/security)
