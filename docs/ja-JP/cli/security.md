---
read_when:
    - config/state に対して簡単なセキュリティ監査を実行したい場合
    - 安全な「修正」提案（権限、デフォルトの強化）を適用したい場合
summary: '`openclaw security` の CLI リファレンス（よくあるセキュリティ上の落とし穴を監査して修正する）'
title: セキュリティ
x-i18n:
  refreshed_at: '2026-04-28T05:23:26Z'
  generated_at: "2026-04-24T04:51:49Z"
  model: gpt-5.4
  provider: openai
  source_hash: b4c15f2111cac2492aa331e5217dd18de169c8b6440f103e3009e059a06d81f6
  source_path: cli/security.md
  workflow: 15
---

# `openclaw security`

セキュリティツール（監査 + オプションの修正）。

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

この監査は、複数の DM 送信者がメインセッションを共有している場合に警告し、**セキュア DM モード**（共有受信トレイでは `session.dmScope="per-channel-peer"`、マルチアカウントチャネルでは `per-account-channel-peer`）を推奨します。
これは協調的/共有受信トレイのハードニング向けです。相互に信頼していない/敵対的な運用者同士で 1 つの Gateway を共有する構成は推奨されません。信頼境界は別々の Gateway（または別々の OS ユーザー/ホスト）で分離してください。
また、設定から共有ユーザー入口の可能性が高いと示唆される場合（たとえば open な DM/グループポリシー、設定済みグループターゲット、ワイルドカード送信者ルールなど）、`security.trust_model.multi_user_heuristic` を出力し、OpenClaw のデフォルトの信頼モデルは個人アシスタントであることを知らせます。
意図的に共有ユーザー構成を使う場合、監査ガイダンスでは、すべてのセッションをサンドボックス化し、ファイルシステムアクセスを workspace スコープに保ち、個人/プライベートなアイデンティティや認証情報をそのランタイムから外しておくことを推奨します。
また、サンドボックス化なしで Web/ブラウザーツールを有効にしたまま小型モデル（`<=300B`）を使用している場合にも警告します。
Webhook 入口については、`hooks.token` が Gateway トークンを再利用している場合、`hooks.token` が短い場合、`hooks.path="/"` の場合、`hooks.defaultSessionKey` が未設定の場合、`hooks.allowedAgentIds` が無制限の場合、リクエストの `sessionKey` 上書きが有効な場合、上書きが有効で `hooks.allowedSessionKeyPrefixes` がない場合に警告します。
また、サンドボックスモードがオフなのに sandbox Docker 設定がされている場合、`gateway.nodes.denyCommands` に実効性のないパターン風/未知のエントリーがある場合（Node コマンド名の完全一致のみで、シェルテキストのフィルタリングではありません）、`gateway.nodes.allowCommands` が危険な Node コマンドを明示的に有効化している場合、グローバル `tools.profile="minimal"` がエージェント tool プロファイルで上書きされている場合、open グループがサンドボックス/workspace ガードなしでランタイム/ファイルシステムツールを公開している場合、インストール済み Plugin tools が緩い tool ポリシー下で到達可能かもしれない場合にも警告します。
さらに、`gateway.allowRealIpFallback=true`（プロキシ設定を誤るとヘッダー偽装のリスク）と `discovery.mdns.mode="full"`（mDNS TXT レコード経由のメタデータ漏えい）も警告対象です。
また、サンドボックスブラウザーが `sandbox.browser.cdpSourceRange` なしで Docker `bridge` ネットワークを使っている場合にも警告します。
さらに、危険な sandbox Docker ネットワークモード（`host` や `container:*` namespace join を含む）も検出します。
既存の sandbox browser Docker コンテナにハッシュラベルの欠落/古さがある場合（たとえば移行前コンテナに `openclaw.browserConfigEpoch` がない場合）にも警告し、`openclaw sandbox recreate --browser --all` を推奨します。
また、npm ベースの Plugin/フックのインストール記録がピン留めされていない場合、整合性メタデータがない場合、現在インストールされているパッケージバージョンとずれている場合にも警告します。
チャネルの許可リストが、安定した ID ではなく変更可能な名前/メール/タグに依存している場合（Discord、Slack、Google Chat、Microsoft Teams、Mattermost、および該当する IRC スコープ）にも警告します。
`gateway.auth.mode="none"` により Gateway HTTP API が共有シークレットなしで到達可能になっている場合（`/tools/invoke` と有効な `/v1/*` エンドポイント）も警告します。
`dangerous`/`dangerously` プレフィックス付き設定は、明示的な緊急用の運用者オーバーライドです。これを有効にしていること自体は、単独ではセキュリティ脆弱性報告ではありません。
危険なパラメーターの完全な一覧については、[セキュリティ](/ja-JP/gateway/security) の「安全でない、または危険なフラグの要約」セクションを参照してください。

SecretRef の動作:

- `security audit` は、対象パスに対してサポートされる SecretRef を読み取り専用モードで解決します。
- 現在のコマンドパスで SecretRef が利用できない場合、監査は継続し、クラッシュせずに `secretDiagnostics` を報告します。
- `--token` と `--password` は、そのコマンド実行時の deep-probe 認証のみを上書きします。config や SecretRef マッピングを書き換えることはありません。

## JSON 出力

CI/ポリシーチェックには `--json` を使用してください。

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

- 一般的な `groupPolicy="open"` を `groupPolicy="allowlist"` に切り替える（サポートされるチャネルのアカウントバリアントを含む）
- WhatsApp のグループポリシーが `allowlist` に切り替わるとき、保存済み `allowFrom` ファイル内の一覧が存在し、config にすでに `allowFrom` が定義されていない場合は、そこから `groupAllowFrom` を初期投入する
- `logging.redactSensitive` を `"off"` から `"tools"` に設定する
- state/config と一般的な機密ファイルの権限を強化する
  （`credentials/*.json`、`auth-profiles.json`、`sessions.json`、セッション
  `*.jsonl`）
- `openclaw.json` から参照される config include ファイルの権限も強化する
- POSIX ホストでは `chmod`、Windows では `icacls` リセットを使用する

`--fix` が**行わない**こと:

- トークン/パスワード/API キーのローテーション
- tool の無効化（`gateway`、`cron`、`exec` など）
- Gateway の bind/auth/ネットワーク公開の選択の変更
- Plugin/Skills の削除または書き換え

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [セキュリティ監査](/ja-JP/gateway/security)
