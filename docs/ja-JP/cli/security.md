---
read_when:
    - config/state の簡易セキュリティ監査を実行したい
    - 安全な「修正」提案（権限、デフォルト設定の厳格化）を適用したい場合
summary: '`openclaw security` の CLI リファレンス（一般的なセキュリティ上の落とし穴を監査して修正）'
title: セキュリティ
x-i18n:
    generated_at: "2026-05-02T04:52:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 44eb50368cb54441782a7c4e20fab24d0488b80c9a1eedf8e1eb31dc8d7a9cf6
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

通常の `security audit` は、コールドな設定/ファイルシステム/読み取り専用パスにとどまります。デフォルトでは Plugin ランタイムのセキュリティコレクターを検出しないため、通常の監査でインストール済みのすべての Plugin ランタイムを読み込むことはありません。ベストエフォートのライブ Gateway プローブと Plugin 所有のセキュリティ監査コレクターを含めるには `--deep` を使用します。明示的な内部呼び出し元も、適切なランタイムスコープをすでに持っている場合は、それらの Plugin 所有コレクターを有効化できます。

複数の DM 送信者がメインセッションを共有している場合、監査は警告し、**セキュア DM モード**を推奨します: 共有受信箱には `session.dmScope="per-channel-peer"`（またはマルチアカウントチャンネルには `per-account-channel-peer`）。
これは協調的/共有受信箱の堅牢化のためのものです。相互に信頼できない/敵対的なオペレーターが 1 つの Gateway を共有する構成は推奨されません。別々の Gateway（または別々の OS ユーザー/ホスト）で信頼境界を分離してください。
また、設定が共有ユーザーによる流入の可能性を示唆している場合（たとえば、オープンな DM/グループポリシー、設定済みのグループ対象、ワイルドカード送信者ルールなど）、`security.trust_model.multi_user_heuristic` も出力し、OpenClaw はデフォルトではパーソナルアシスタントの信頼モデルであることを通知します。
意図的な共有ユーザー構成では、監査ガイダンスとして、すべてのセッションをサンドボックス化し、ファイルシステムアクセスをワークスペーススコープに保ち、個人/プライベートの ID や資格情報をそのランタイムに置かないことを推奨します。
また、小規模モデル（`<=300B`）がサンドボックスなしで、かつ Web/ブラウザツール有効の状態で使用されている場合も警告します。
Webhook 流入については、`hooks.token` が Gateway トークンを再利用している場合、`hooks.token` が短い場合、`hooks.path="/"` の場合、`hooks.defaultSessionKey` が未設定の場合、`hooks.allowedAgentIds` が無制限の場合、リクエストの `sessionKey` 上書きが有効な場合、また `hooks.allowedSessionKeyPrefixes` なしで上書きが有効な場合に警告します。
また、サンドボックスモードがオフの状態でサンドボックス Docker 設定が構成されている場合、`gateway.nodes.denyCommands` が無効なパターン風/不明なエントリを使用している場合（正確なノードコマンド名の一致のみで、シェルテキストのフィルタリングではありません）、`gateway.nodes.allowCommands` が危険なノードコマンドを明示的に有効にしている場合、グローバルな `tools.profile="minimal"` がエージェントツールプロファイルで上書きされている場合、オープングループがサンドボックス/ワークスペースガードなしでランタイム/ファイルシステムツールを公開している場合、許容的なツールポリシー下でインストール済み Plugin ツールに到達できる可能性がある場合にも警告します。
また、`gateway.allowRealIpFallback=true`（プロキシの設定ミス時のヘッダースプーフィングリスク）と `discovery.mdns.mode="full"`（mDNS TXT レコードによるメタデータ漏えい）にもフラグを立てます。
また、サンドボックスブラウザが `sandbox.browser.cdpSourceRange` なしで Docker `bridge` ネットワークを使用している場合も警告します。
また、危険なサンドボックス Docker ネットワークモード（`host` や `container:*` 名前空間参加を含む）にもフラグを立てます。
また、既存のサンドボックスブラウザ Docker コンテナにハッシュラベルの欠落/古さがある場合（たとえば `openclaw.browserConfigEpoch` が欠落している移行前コンテナ）にも警告し、`openclaw sandbox recreate --browser --all` を推奨します。
また、npm ベースの Plugin/hook インストール記録が固定されていない、整合性メタデータが欠落している、または現在インストールされているパッケージバージョンからずれている場合も警告します。
チャンネル allowlist が安定した ID ではなく、変更可能な名前/メール/タグに依存している場合（該当する場合は Discord、Slack、Google Chat、Microsoft Teams、Mattermost、IRC スコープ）に警告します。
`gateway.auth.mode="none"` により、共有シークレットなしで Gateway HTTP API（`/tools/invoke` と有効な `/v1/*` エンドポイント）が到達可能になる場合に警告します。
`dangerous`/`dangerously` で始まる設定は、明示的な緊急用オペレーター上書きです。有効化したこと自体は、セキュリティ脆弱性報告にはなりません。
危険なパラメーターの完全な一覧については、[セキュリティ](/ja-JP/gateway/security) の「安全でない、または危険なフラグの概要」セクションを参照してください。

SecretRef の動作:

- `security audit` は、対象パスについて、対応する SecretRef を読み取り専用モードで解決します。
- 現在のコマンドパスで SecretRef を利用できない場合、監査は継続し、クラッシュする代わりに `secretDiagnostics` を報告します。
- `--token` と `--password` は、そのコマンド呼び出しのディーププローブ認証だけを上書きします。設定や SecretRef マッピングは書き換えません。

## JSON 出力

CI/ポリシーチェックには `--json` を使用します:

```bash
openclaw security audit --json | jq '.summary'
openclaw security audit --deep --json | jq '.findings[] | select(.severity=="critical") | .checkId'
```

`--fix` と `--json` を組み合わせると、出力には修正アクションと最終レポートの両方が含まれます:

```bash
openclaw security audit --fix --json | jq '{fix: .fix.ok, summary: .report.summary}'
```

## `--fix` が変更する内容

`--fix` は、安全で決定的な修復を適用します:

- 一般的な `groupPolicy="open"` を `groupPolicy="allowlist"` に切り替えます（対応チャンネルのアカウントバリアントを含む）
- WhatsApp グループポリシーが `allowlist` に切り替わる場合、そのリストが存在し、設定でまだ
  `allowFrom` が定義されていなければ、保存済みの `allowFrom` ファイルから `groupAllowFrom` を初期設定します
- `logging.redactSensitive` を `"off"` から `"tools"` に設定します
- 状態/設定および一般的な機密ファイルの権限を強化します
  (`credentials/*.json`, `auth-profiles.json`, `sessions.json`, セッション
  `*.jsonl`)
- `openclaw.json` から参照される設定インクルードファイルの権限も強化します
- POSIX ホストでは `chmod` を使用し、Windows では `icacls` リセットを使用します

`--fix` が**行わない**こと:

- トークン/パスワード/API キーのローテーション
- ツール（`gateway`, `cron`, `exec` など）の無効化
- Gateway のバインド/認証/ネットワーク公開の選択の変更
- plugins/skills の削除または書き換え

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [セキュリティ監査](/ja-JP/gateway/security)
