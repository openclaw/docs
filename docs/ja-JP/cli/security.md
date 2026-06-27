---
read_when:
    - config/state の簡単なセキュリティ監査を実行したい
    - 安全な「修正」提案（権限、デフォルトの厳格化）を適用したい
summary: 'CLI リファレンス: `openclaw security`（一般的なセキュリティ上の落とし穴を監査して修正）'
title: セキュリティ
x-i18n:
    generated_at: "2026-06-27T11:01:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 58876d7ab4dd3e5d3f5c915700b08ca234e5ccefdfc35a79e60a31e1fce21774
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

通常の `security audit` は、コールドな設定/ファイルシステム/読み取り専用パスにとどまります。デフォルトでは Plugin ランタイムのセキュリティコレクターを検出しないため、定常的な監査でインストール済みのすべての Plugin ランタイムを読み込むことはありません。ベストエフォートのライブ Gateway プローブと Plugin 所有のセキュリティ監査コレクターを含めるには `--deep` を使用します。明示的な内部呼び出し元も、適切なランタイムスコープをすでに持っている場合は、これらの Plugin 所有コレクターをオプトインできます。

複数の DM 送信者がメインセッションを共有している場合、監査は警告し、**セキュア DM モード**: 共有インボックスには `session.dmScope="per-channel-peer"`（またはマルチアカウントチャンネルには `per-account-channel-peer`）を推奨します。
これは、協調型/共有インボックスの堅牢化を目的としています。互いに信頼されていない、または敵対的な運用者が 1 つの Gateway を共有する構成は推奨されません。別々の Gateway（または別々の OS ユーザー/ホスト）で信頼境界を分離してください。
設定が共有ユーザーの流入を示唆する場合（たとえばオープンな DM/グループポリシー、設定済みのグループターゲット、ワイルドカード送信者ルール）、`security.trust_model.multi_user_heuristic` も出力し、OpenClaw はデフォルトでパーソナルアシスタントの信頼モデルであることを通知します。
意図的な共有ユーザー構成では、監査ガイダンスとして、すべてのセッションをサンドボックス化し、ファイルシステムアクセスをワークスペーススコープに制限し、そのランタイムから個人/プライベートの ID や資格情報を遠ざけることを推奨します。
また、小規模モデル（`<=300B`）がサンドボックスなしで、かつ Web/ブラウザツールを有効にして使用されている場合にも警告します。
Webhook 流入では、起動時に非致命的なセキュリティ警告をログ出力し、監査は `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` および `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` を含む、アクティブな Gateway 共有シークレット認証値の `hooks.token` 再利用をフラグします。次の場合にも警告します。

- `hooks.token` が短い
- `hooks.path="/"`
- `hooks.defaultSessionKey` が未設定
- `hooks.allowedAgentIds` が無制限
- リクエストの `sessionKey` オーバーライドが有効
- `hooks.allowedSessionKeyPrefixes` なしでオーバーライドが有効

Gateway パスワード認証が起動時にのみ指定されている場合は、`hooks.token` と照合できるように、同じ値を `openclaw security audit --auth password --password <password>` に渡してください。
永続化された再利用済みの `hooks.token` をローテーションするには `openclaw doctor --fix` を実行し、その後、外部フック送信元を新しいフックトークンを使用するように更新します。

サンドボックスモードがオフのままサンドボックス Docker 設定が構成されている場合、`gateway.nodes.denyCommands` が効果のないパターン風/未知のエントリを使用している場合（シェルテキストのフィルタリングではなく、正確なノードコマンド名の一致のみ）、`gateway.nodes.allowCommands` が危険なノードコマンドを明示的に有効にしている場合、グローバルの `tools.profile="minimal"` がエージェントツールプロファイルで上書きされている場合、書き込み/編集ツールが無効でも `exec` が制約付きサンドボックスファイルシステム境界なしでまだ利用可能な場合、オープンな DM またはグループがサンドボックス/ワークスペースガードなしでランタイム/ファイルシステムツールを公開している場合、インストール済み Plugin ツールが寛容なツールポリシー下で到達可能になる可能性がある場合にも警告します。
また、`gateway.allowRealIpFallback=true`（プロキシが誤設定されている場合のヘッダースプーフィングリスク）と `discovery.mdns.mode="full"`（mDNS TXT レコードによるメタデータ漏えい）もフラグします。
サンドボックスブラウザが `sandbox.browser.cdpSourceRange` なしで Docker `bridge` ネットワークを使用している場合にも警告します。
危険なサンドボックス Docker ネットワークモード（`host` や `container:*` 名前空間参加を含む）もフラグします。
既存のサンドボックスブラウザ Docker コンテナにハッシュラベルの欠落/古さがある場合（たとえば `openclaw.browserConfigEpoch` が欠落した移行前コンテナ）にも警告し、`openclaw sandbox recreate --browser --all` を推奨します。
npm ベースの Plugin/フックインストール記録がピン留めされていない、整合性メタデータが欠落している、または現在インストールされているパッケージバージョンからずれている場合にも警告します。
チャンネル許可リストが、安定した ID ではなく変更可能な名前/メール/タグに依存している場合に警告します（該当する場合は Discord、Slack、Google Chat、Microsoft Teams、Mattermost、IRC スコープ）。
`gateway.auth.mode="none"` により、共有シークレットなしで Gateway HTTP API（`/tools/invoke` と有効な任意の `/v1/*` エンドポイント）が到達可能になる場合に警告します。
`dangerous`/`dangerously` で始まる設定は、明示的な緊急時用の運用者オーバーライドです。有効化すること自体は、セキュリティ脆弱性レポートではありません。
危険なパラメーターの完全な一覧については、[セキュリティ](/ja-JP/gateway/security) の「安全でない、または危険なフラグの概要」セクションを参照してください。

意図的な継続的検出事項は `security.audit.suppressions` で受け入れられます。
各抑制は正確な `checkId` に一致し、大文字と小文字を区別しない部分文字列である
`titleIncludes` および/または `detailIncludes` で絞り込めます。

```json
{
  "security": {
    "audit": {
      "suppressions": [
        {
          "checkId": "plugins.tools_reachable_permissive_policy",
          "detailIncludes": "Enabled extension plugins: gbrain",
          "reason": "trusted local operator plugin"
        }
      ]
    }
  }
}
```

抑制された検出事項は、アクティブな `summary` と `findings` リストから削除されます。
JSON 出力では、監査可能性のために `suppressedFindings` の下に保持されます。
抑制が設定されている場合、アクティブな出力には、監査がフィルタリングされたことを読者が判別できるように、抑制不可の
`security.audit.suppressions.active` 情報検出事項も保持されます。危険な設定フラグは 1 つのフラグにつき 1 つの検出事項として出力されるため、
1 つの危険なフラグを受け入れても、同じ `config.insecure_or_dangerous_flags` checkId を共有する他の有効なフラグは隠されません。
抑制は継続的なリスクを隠せるため、エージェント実行シェルコマンドを通じて抑制を追加または削除するには、信頼済みローカル自動化向けに `security="full"` かつ `ask="off"` で exec がすでに実行されていない限り、exec 承認が必要です。

SecretRef の動作:

- `security audit` は、対象パスに対してサポートされる SecretRef を読み取り専用モードで解決します。
- 現在のコマンドパスで SecretRef が利用できない場合、監査は続行し、クラッシュする代わりに `secretDiagnostics` を報告します。
- `--token` と `--password` は、そのコマンド呼び出しに対してのみディーププローブ認証を上書きします。設定や SecretRef マッピングを書き換えることはありません。

## JSON 出力

CI/ポリシーチェックには `--json` を使用します。

```bash
openclaw security audit --json | jq '.summary'
openclaw security audit --deep --json | jq '.findings[] | select(.severity=="critical") | .checkId'
```

`--fix` と `--json` を組み合わせた場合、出力には修正アクションと最終レポートの両方が含まれます。

```bash
openclaw security audit --fix --json | jq '{fix: .fix.ok, summary: .report.summary}'
```

## `--fix` が変更する内容

`--fix` は、安全で決定的な修復を適用します。

- 一般的な `groupPolicy="open"` を `groupPolicy="allowlist"` に切り替えます（サポートされるチャンネルのアカウントバリアントを含む）
- WhatsApp グループポリシーが `allowlist` に切り替わる場合、そのリストが存在し、設定で `allowFrom` がまだ定義されていないときは、保存済みの `allowFrom` ファイルから `groupAllowFrom` を初期設定します
- `logging.redactSensitive` を `"off"` から `"tools"` に設定します
- state/config と一般的な機密ファイル
  （`credentials/*.json`、`auth-profiles.json`、`sessions.json`、セッション
  `*.jsonl`）の権限を厳格化します
- `openclaw.json` から参照される設定 include ファイルも厳格化します
- POSIX ホストでは `chmod`、Windows では `icacls` リセットを使用します

`--fix` は次を行いません。

- トークン/パスワード/API キーをローテーションする
- ツール（`gateway`、`cron`、`exec` など）を無効化する
- Gateway の bind/auth/ネットワーク公開の選択を変更する
- Plugins/Skills を削除または書き換える

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [セキュリティ監査](/ja-JP/gateway/security)
