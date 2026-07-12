---
read_when:
    - config/state の簡易セキュリティ監査を実行したい場合
    - 安全な「修正」の提案（権限、デフォルト設定の厳格化）を適用したい場合
summary: '`openclaw security` の CLI リファレンス（よくあるセキュリティ上の危険な設定を監査・修正）'
title: セキュリティ
x-i18n:
    generated_at: "2026-07-12T14:28:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 613d1afa63e46a7dc3474d0b175cf2389703a86b00f861b4140d64e11c28ece5
    source_path: cli/security.md
    workflow: 16
---

# `openclaw security`

セキュリティツール：監査と、オプションの安全な修正。関連項目：[セキュリティ](/ja-JP/gateway/security)。

```bash
openclaw security audit
openclaw security audit --deep
openclaw security audit --deep --password <password>
openclaw security audit --deep --token <token>
openclaw security audit --auth password --password <password>
openclaw security audit --fix
openclaw security audit --json
```

## 監査モード

通常の `security audit` は、コールド設定／ファイルシステム／読み取り専用のパスのみを使用します。Plugin ランタイムのセキュリティコレクターを検出しないため、日常的な監査でインストール済みのすべての Plugin ランタイムが読み込まれることはありません。`--deep` を指定すると、ベストエフォートのライブ Gateway プローブと、Plugin が所有するセキュリティ監査コレクターが追加されます（明示的な内部呼び出し元も、適切なランタイムスコープをすでに持っている場合は、これらのコレクターの使用を選択できます）。

Gateway のパスワード認証を起動時にのみ指定している場合、監査で `hooks.token` と照合できるよう、同じ値を `--auth password --password <password>` で渡します。

## チェック内容

**DM／信頼モデル**

- 複数の DM 送信者がメインセッションを共有している場合に警告し、共有受信トレイでは安全な DM モードとして `session.dmScope="per-channel-peer"`（複数アカウントのチャネルでは `per-account-channel-peer`）を推奨します。これは協調的な共有受信トレイの強化であり、相互に信頼できない運用者を分離するものではありません。その場合は、別々の Gateway（または別々の OS ユーザー／ホスト）を使用して信頼境界を分割してください。
- 設定が共有ユーザーからの受信を示唆する場合（たとえば、オープンな DM／グループポリシー、設定済みのグループ送信先、ワイルドカードの送信者ルール）、`security.trust_model.multi_user_heuristic` を出力します。OpenClaw のデフォルトの信頼モデルは、敵対的なマルチテナント分離ではなく、パーソナルアシスタント（1 人の運用者）です。意図的に複数ユーザーで共有する構成では、すべてのセッションをサンドボックス化し、ファイルシステムへのアクセスをワークスペースのスコープ内に制限し、個人用／非公開の ID や認証情報をそのランタイムに置かないでください。
- 小規模モデル（パラメーター数 `<=300B`）を、サンドボックス化せずに Web／ブラウザツールを有効にして使用している場合に警告します。

**Webhook／フック**

起動ログに非致命的なセキュリティ警告を記録し、監査では `hooks.token` が有効な Gateway 共有シークレット認証値（`gateway.auth.token`／`OPENCLAW_GATEWAY_TOKEN`、`gateway.auth.password`／`OPENCLAW_GATEWAY_PASSWORD`）と再利用されている場合にフラグを立てます。以下の場合にも警告します。

- `hooks.token` が短い
- `hooks.path="/"`
- `hooks.defaultSessionKey` が未設定
- `hooks.allowedAgentIds` が無制限
- リクエストによる `sessionKey` の上書きが有効
- `hooks.allowedSessionKeyPrefixes` なしで上書きが有効

永続化された再利用中の `hooks.token` をローテーションするには `openclaw doctor --fix` を実行し、その後、外部のフック送信元を新しいトークンを使用するよう更新してください。

**サンドボックス／ツール**

- サンドボックスモードがオフなのに、サンドボックスの Docker 設定が構成されている場合に警告します。
- `gateway.nodes.denyCommands` に効果のないパターン風のエントリや不明なエントリが含まれている場合に警告します（照合対象は Node コマンド名との完全一致のみであり、シェルテキストのフィルタリングではありません）。
- `gateway.nodes.allowCommands` で危険な Node コマンドが明示的に有効化されている場合に警告します。
- グローバルな `tools.profile="minimal"` がエージェントのツールプロファイルによって上書きされている場合に警告します。
- 書き込み／編集ツールが無効でも、ファイルシステム境界を制約するサンドボックスなしで `exec` が引き続き利用可能な場合に警告します。
- オープンな DM またはグループが、サンドボックス／ワークスペースの保護なしでランタイム／ファイルシステムツールを公開している場合に警告します。
- 寛容なツールポリシーのもとで、インストール済み Plugin のツールが利用可能になる可能性がある場合に警告します。

**サンドボックスブラウザ**

- サンドボックスブラウザが Docker の `bridge` ネットワークを使用し、`sandbox.browser.cdpSourceRange` が設定されていない場合に警告します。
- `host` や `container:*` 名前空間への参加を含む、危険なサンドボックス Docker ネットワークモードにフラグを立てます。
- 既存のサンドボックスブラウザの Docker コンテナでハッシュラベルが欠落しているか古い場合（たとえば、移行前のコンテナに `openclaw.browserConfigEpoch` がない場合）に警告し、`openclaw sandbox recreate --browser --all` を推奨します。

**ネットワーク／検出**

- `gateway.allowRealIpFallback=true` にフラグを立てます（プロキシが誤って構成されている場合、ヘッダー偽装のリスクがあります）。
- `discovery.mdns.mode="full"` にフラグを立てます（mDNS TXT レコードを介したメタデータ漏えい）。
- `gateway.auth.mode="none"` によって、共有シークレットなしで Gateway HTTP API（`/tools/invoke` および有効化されたすべての `/v1/*` エンドポイント）にアクセス可能になる場合に警告します。

**Plugin／チャネル**

- npm ベースの Plugin/フックのインストール記録がバージョン固定されていない、整合性メタデータが欠落している、または現在インストールされているパッケージのバージョンからずれている場合に警告します。
- チャネルの許可リストが、安定した ID ではなく変更可能な名前/メールアドレス/タグに依存している場合に警告します（該当する Discord、Slack、Google Chat、Microsoft Teams、Mattermost、IRC のスコープ）。

`dangerous`/`dangerously` で始まる設定は、緊急時に使用する明示的な運用者向けオーバーライドです。これらのいずれかを有効にすること自体は、セキュリティ脆弱性の報告にはなりません。危険なパラメーターの完全な一覧については、[セキュリティ](/ja-JP/gateway/security)の「安全でない、または危険なフラグの概要」を参照してください。

## SecretRef の動作

`security audit` は、対象パスでサポートされている SecretRef を読み取り専用モードで解決します。現在のコマンドパスで SecretRef を利用できない場合でも、監査はクラッシュせずに続行し、代わりに `secretDiagnostics` を報告します。`--token` と `--password` は、そのコマンド呼び出しに対する詳細プローブ認証のみを上書きします。設定や SecretRef のマッピングは書き換えません。

## 抑制

意図的に継続している検出事項は、`security.audit.suppressions` で許容できます。各抑制は正確な `checkId` と一致し、大文字と小文字を区別しない `titleIncludes` および/または `detailIncludes` の部分文字列で対象を絞り込めます。

```json
{
  "security": {
    "audit": {
      "suppressions": [
        {
          "checkId": "plugins.tools_reachable_permissive_policy",
          "detailIncludes": "有効な拡張 Plugin: gbrain",
          "reason": "信頼済みのローカル運用者用 Plugin"
        }
      ]
    }
  }
}
```

抑制された検出事項は、アクティブな `summary` および `findings` リストから削除されます。監査可能性を確保するため、JSON 出力ではそれらを `suppressedFindings` に保持します。抑制が設定されている場合、監査がフィルタリングされたことを読者が判別できるように、アクティブな出力には抑制できない `security.audit.suppressions.active` の情報レベルの検出事項も保持されます。危険な設定フラグはフラグごとに 1 件の検出事項として出力されるため、1 つの危険なフラグを許容しても、同じ `config.insecure_or_dangerous_flags` の checkId を共有する他の有効なフラグは非表示になりません。

抑制は継続的なリスクを隠す可能性があるため、エージェントが実行するシェルコマンドを通じて抑制を追加または削除する場合は、信頼されたローカル自動化のために exec がすでに `security="full"` および `ask="off"` で実行されていない限り、exec の承認が必要です。

## JSON 出力

```bash
openclaw security audit --json | jq '.summary'
openclaw security audit --deep --json | jq '.findings[] | select(.severity=="critical") | .checkId'
```

`--fix --json` を指定すると、出力には修正アクションと最終レポートの両方が含まれます。

```bash
openclaw security audit --fix --json | jq '{fix: .fix.ok, summary: .report.summary}'
```

## `--fix` が変更する内容

安全かつ決定論的な修復を適用します。

- 一般的な `groupPolicy="open"` を `groupPolicy="allowlist"` に切り替えます（サポート対象チャネルのアカウント別設定を含む）
- WhatsApp のグループポリシーを `allowlist` に切り替える際、保存済みの `allowFrom` ファイルが存在し、設定で `allowFrom` がまだ定義されていない場合は、そのファイルから `groupAllowFrom` を初期設定します
- `logging.redactSensitive` を `"off"` から `"tools"` に設定します
- 状態/設定ファイルおよび一般的な機密ファイル（`credentials/*.json`、`auth-profiles.json`、`openclaw-agent.sqlite`、レガシーセッション成果物）の権限を厳格化します
- `openclaw.json` から参照される設定インクルードファイルの権限も厳格化します
- POSIX ホストでは `chmod`、Windows では `icacls` によるリセットを使用します

`--fix` は、以下を**行いません**。

- トークン/パスワード/API キーのローテーション
- ツール（`gateway`、`cron`、`exec` など）の無効化
- Gateway のバインド/認証/ネットワーク公開設定の変更
- Plugin/Skills の削除または書き換え

## 関連項目

- [CLI リファレンス](/ja-JP/cli)
- [セキュリティ監査](/ja-JP/gateway/security)
