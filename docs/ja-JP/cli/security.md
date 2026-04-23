---
read_when:
    - config/stateに対してクイックなセキュリティ監査を実行したい場合
    - 安全な「fix」提案（権限、デフォルトの強化）を適用したい場合
summary: '`openclaw security` のCLIリファレンス（よくあるセキュリティ上の落とし穴の監査と修正）'
title: セキュリティ
x-i18n:
    generated_at: "2026-04-23T14:02:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 92b80468403b7d329391c40add9ae9c0e2423f5c6ff162291fa13ab91ace985d
    source_path: cli/security.md
    workflow: 15
---

# `openclaw security`

セキュリティツール（監査 + 任意の修正）。

関連:

- セキュリティガイド: [Security](/ja-JP/gateway/security)

## 監査

```bash
openclaw security audit
openclaw security audit --deep
openclaw security audit --deep --password <password>
openclaw security audit --deep --token <token>
openclaw security audit --fix
openclaw security audit --json
```

この監査は、複数のDM送信者がmainセッションを共有している場合に警告を出し、**安全なDMモード** を推奨します: 共有受信トレイには `session.dmScope="per-channel-peer"`（またはマルチアカウントチャンネルでは `per-account-channel-peer`）。
これは協調的な/共有受信トレイのハードニング向けです。相互に信頼していない/敵対的なオペレーター間で1つのGatewayを共有する構成は推奨されません。信頼境界は別Gateway（または別OSユーザー/ホスト）で分離してください。
また、設定が共有ユーザーの受信を示唆している場合（たとえば開放されたDM/グループポリシー、設定済みグループターゲット、ワイルドカード送信者ルールなど）には `security.trust_model.multi_user_heuristic` を出力し、OpenClawのデフォルト信頼モデルは個人アシスタントであることを知らせます。
意図的な共有ユーザー構成では、監査ガイダンスは、すべてのセッションをサンドボックス化し、ファイルシステムアクセスをworkspaceスコープに保ち、個人用/非公開のIDや認証情報をそのランタイムに載せないことです。
また、サンドボックス化せずに小型モデル（`<=300B`）を使用し、かつweb/browserツールを有効にしている場合にも警告します。
Webhook受信については、`hooks.token` がGatewayトークンを再利用している場合、`hooks.token` が短い場合、`hooks.path="/"` の場合、`hooks.defaultSessionKey` が未設定の場合、`hooks.allowedAgentIds` が無制限の場合、リクエストの `sessionKey` 上書きが有効な場合、および上書きが有効なのに `hooks.allowedSessionKeyPrefixes` がない場合に警告します。
また、サンドボックスモードがオフなのにsandbox Docker設定が構成されている場合、`gateway.nodes.denyCommands` が無効なパターン風/未知エントリを使っている場合（Nodeコマンド名の完全一致のみで、シェルテキストのフィルタではありません）、`gateway.nodes.allowCommands` が危険なNodeコマンドを明示的に許可している場合、グローバル `tools.profile="minimal"` がagentツールプロファイルで上書きされている場合、開放グループがsandbox/workspaceガードなしでランタイム/ファイルシステムツールを公開している場合、およびインストール済みPluginツールが緩いツールポリシー下で到達可能な場合にも警告します。
さらに、`gateway.allowRealIpFallback=true`（プロキシ設定ミス時のヘッダースプーフィングリスク）と `discovery.mdns.mode="full"`（mDNS TXTレコードによるメタデータ漏えい）も検出します。
また、sandbox browserがDocker `bridge` ネットワークを使用していて `sandbox.browser.cdpSourceRange` が未設定の場合にも警告します。
さらに、危険なsandbox Dockerネットワークモード（`host` や `container:*` の名前空間結合を含む）も検出します。
また、既存のsandbox browser Dockerコンテナにハッシュラベルの欠落/古さがある場合（たとえば移行前コンテナに `openclaw.browserConfigEpoch` がない場合）にも警告し、`openclaw sandbox recreate --browser --all` を推奨します。
さらに、npmベースのPlugin/フックのインストール記録が未固定、integrityメタデータ欠落、または現在インストールされているパッケージバージョンとずれている場合にも警告します。
チャンネル許可リストが安定したIDではなく変更可能な名前/メール/タグに依存している場合（該当するDiscord、Slack、Google Chat、Microsoft Teams、Mattermost、IRCスコープ）にも警告します。
`gateway.auth.mode="none"` によって共有シークレットなしでGateway HTTP API（`/tools/invoke` と有効化された任意の `/v1/*` エンドポイント）へ到達可能な場合にも警告します。
`dangerous`/`dangerously` で始まる設定は、明示的な緊急回避用オペレーター上書きです。これらを有効にしていること自体は、単独ではセキュリティ脆弱性の報告にはなりません。
危険パラメータの完全な一覧については、[Security](/ja-JP/gateway/security) の「Insecure or dangerous flags summary」セクションを参照してください。

SecretRefの動作:

- `security audit` は、対象パスに対してサポートされるSecretRefを読み取り専用モードで解決します。
- 現在のコマンドパスでSecretRefが利用できない場合でも、監査は継続し、クラッシュする代わりに `secretDiagnostics` を報告します。
- `--token` と `--password` は、そのコマンド実行に対するdeep-probe認証のみを上書きします。configやSecretRefマッピングを書き換えることはありません。

## JSON出力

CI/ポリシーチェックには `--json` を使用してください:

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

- 一般的な `groupPolicy="open"` を `groupPolicy="allowlist"` に変更します（サポートされているチャンネルのアカウントバリアントを含む）
- WhatsAppのグループポリシーが `allowlist` に切り替わる際、そのリストが存在し、configに `allowFrom` がまだ定義されていない場合は、保存済みの `allowFrom` ファイルから `groupAllowFrom` を初期投入します
- `logging.redactSensitive` を `"off"` から `"tools"` に設定します
- state/config と一般的な機密ファイルの権限を強化します
  （`credentials/*.json`、`auth-profiles.json`、`sessions.json`、セッション
  `*.jsonl`）
- `openclaw.json` から参照されているconfig includeファイルも強化します
- POSIXホストでは `chmod` を、Windowsでは `icacls` のリセットを使用します

`--fix` が**行わない**こと:

- トークン/パスワード/APIキーのローテーション
- ツール（`gateway`、`cron`、`exec` など）の無効化
- Gatewayのbind/auth/network公開設定の変更
- Plugin/Skillsの削除や書き換え
