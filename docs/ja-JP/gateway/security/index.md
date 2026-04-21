---
read_when:
    - アクセスや自動化を拡大する機能を追加する
summary: シェルアクセスを持つ AI Gateway を実行する際のセキュリティ上の考慮事項と脅威モデル
title: セキュリティ
x-i18n:
    generated_at: "2026-04-21T04:46:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: aa10d97773a78c43d238aed495e00d83a3e28a50939cbe8941add05874846a86
    source_path: gateway/security/index.md
    workflow: 15
---

# セキュリティ

<Warning>
**個人アシスタントの信頼モデル:** このガイダンスは、gateway ごとに 1 つの信頼された運用者境界（単一ユーザー/個人アシスタントモデル）を前提としています。
OpenClaw は、複数の敵対的ユーザーが 1 つの agent/gateway を共有する前提の、敵対的マルチテナント向けセキュリティ境界 **ではありません**。
混在した信頼や敵対的ユーザー運用が必要な場合は、信頼境界を分離してください（gateway と資格情報を分離し、理想的には OS ユーザー/host も分離します）。
</Warning>

**このページの内容:** [信頼モデル](#scope-first-personal-assistant-security-model) | [クイック監査](#quick-check-openclaw-security-audit) | [60 秒でできる強化ベースライン](#hardened-baseline-in-60-seconds) | [DM アクセスモデル](#dm-access-model-pairing-allowlist-open-disabled) | [設定の強化](#configuration-hardening-examples) | [インシデント対応](#incident-response)

## まず範囲を明確にする: 個人アシスタントのセキュリティモデル

OpenClaw のセキュリティガイダンスは、**個人アシスタント** のデプロイを前提としています。つまり、1 つの信頼された運用者境界があり、そこに複数の agent が存在しうるという前提です。

- サポートされるセキュリティ姿勢: gateway ごとに 1 ユーザー/信頼境界（信頼境界ごとに 1 OS ユーザー/host/VPS を推奨）
- サポート対象外のセキュリティ境界: 相互に信頼していない、または敵対的なユーザーが共有する 1 つの shared gateway/agent
- 敵対的ユーザー間の分離が必要な場合は、信頼境界ごとに分割してください（gateway と資格情報を分離し、理想的には OS ユーザー/host も分離）
- 複数の信頼されていないユーザーが 1 つの tool 有効 agent にメッセージできる場合、それらのユーザーはその agent に委譲された同じツール権限を共有しているものとして扱ってください

このページでは、そのモデル **の範囲内での** 強化方法を説明します。1 つの shared gateway 上で敵対的マルチテナント分離を実現すると主張するものではありません。

## クイックチェック: `openclaw security audit`

関連項目: [Formal Verification (Security Models)](/ja-JP/security/formal-verification)

これを定期的に実行してください（特に config を変更した後や、ネットワーク面を公開した後）。

```bash
openclaw security audit
openclaw security audit --deep
openclaw security audit --fix
openclaw security audit --json
```

`security audit --fix` は意図的に範囲を絞っています。一般的な open group ポリシーを allowlist に切り替え、`logging.redactSensitive: "tools"` を復元し、state/config/include-file の権限を厳格化し、Windows 上では POSIX `chmod` ではなく Windows ACL のリセットを使います。

一般的な落とし穴（Gateway 認証の露出、ブラウザ制御の露出、昇格権限の許可リスト、ファイルシステム権限、緩い exec 承認、open-channel のツール露出）を検出します。

OpenClaw はプロダクトであると同時に実験でもあります。実際のメッセージング面と実際のツールに、最先端 model の振る舞いを接続しているからです。**「完全に安全な」構成は存在しません。** 目標は次の点を意識的に決めることです。

- 誰がボットに話しかけられるか
- ボットがどこで動作してよいか
- ボットが何に触れてよいか

まずは動作に必要な最小のアクセスから始め、信頼が深まるにつれて段階的に広げてください。

### デプロイと host の信頼

OpenClaw は、host と config 境界が信頼されていることを前提とします。

- 誰かが Gateway host の state/config（`openclaw.json` を含む `~/.openclaw`）を変更できるなら、その人は信頼された運用者として扱ってください。
- 相互に信頼していない/敵対的な複数の運用者のために 1 つの Gateway を運用するのは、**推奨される構成ではありません**。
- 混在した信頼のチームでは、gateway を分離するか、少なくとも OS ユーザー/host を分けて、信頼境界を分離してください。
- 推奨されるデフォルト: 1 台のマシン/host（または VPS）につき 1 ユーザー、そのユーザーにつき 1 gateway、その gateway 内に 1 つ以上の agent。
- 1 つの Gateway インスタンスの中では、認証済みの運用者アクセスは、ユーザー単位のテナントロールではなく、信頼されたコントロールプレーンロールです。
- セッション識別子（`sessionKey`、session ID、label）はルーティング用セレクタであり、認可トークンではありません。
- 複数人が 1 つの tool 有効 agent にメッセージできる場合、それぞれが同じ権限セットを操作できます。ユーザー単位の session/memory 分離はプライバシーには役立ちますが、shared agent をユーザー単位の host 認可境界に変えることはできません。

### shared Slack workspace: 実際のリスク

「Slack の全員が bot にメッセージできる」場合、核心的なリスクは委譲されたツール権限です。

- 許可された送信者は誰でも、その agent のポリシー内でツール呼び出し（`exec`、browser、network/file ツール）を誘発できる
- ある送信者からの prompt/content injection により、共有 state、デバイス、出力に影響するアクションが引き起こされうる
- 1 つの shared agent が機密の資格情報/ファイルを持っている場合、許可された送信者は誰でも、ツール利用を通じた流出を誘導できる可能性がある

チームのワークフローには、最小限のツールだけを持つ agent/gateway を分離して使ってください。個人データを扱う agent は非公開に保ってください。

### 会社共有 agent: 許容できるパターン

その agent を使う全員が同じ信頼境界に属しており（たとえば 1 つの会社チーム）、agent が厳密に業務スコープに限定されているなら、これは許容できます。

- 専用のマシン/VM/container 上で実行する
- そのランタイム専用の OS ユーザー + 専用の browser/profile/account を使う
- そのランタイムでは、個人の Apple/Google アカウントや個人のパスワードマネージャ/ブラウザプロファイルにサインインしない

個人と会社のアイデンティティを同じランタイムで混在させると、分離が崩れ、個人データ露出のリスクが高まります。

## Gateway と node の信頼概念

Gateway と node は、役割は異なっても 1 つの運用者信頼ドメインとして扱ってください。

- **Gateway** はコントロールプレーンであり、ポリシー面です（`gateway.auth`、ツールポリシー、ルーティング）。
- **Node** は、その Gateway にペアリングされたリモート実行面です（コマンド、デバイス操作、host ローカル機能）。
- Gateway に認証された呼び出し元は、Gateway スコープで信頼されます。ペアリング後の node アクションは、その node 上での信頼された運用者アクションです。
- `sessionKey` はルーティング/コンテキスト選択であり、ユーザー単位の認証ではありません。
- Exec 承認（allowlist + ask）は、運用者の意図に対するガードレールであり、敵対的マルチテナント分離ではありません。
- 信頼された単一運用者構成における OpenClaw のプロダクトデフォルトは、`gateway`/`node` での host exec を承認プロンプトなしで許可することです（厳格化しない限り `security="full"`、`ask="off"`）。このデフォルトは意図された UX であり、それ自体が脆弱性ではありません。
- Exec 承認は、正確なリクエストコンテキストと、ベストエフォートでの直接ローカルファイルオペランドに紐づきます。すべてのランタイム/インタープリタのローダーパスを意味的にモデル化するものではありません。強い境界には sandbox 化と host 分離を使ってください。

敵対的ユーザー分離が必要なら、OS ユーザー/host ごとに信頼境界を分けて、別々の gateway を実行してください。

## 信頼境界マトリクス

リスクをトリアージするときのクイックモデルとして使ってください。

| 境界または制御                                          | 意味                                              | よくある誤解                                                                  |
| ------------------------------------------------------- | ------------------------------------------------- | ----------------------------------------------------------------------------- |
| `gateway.auth`（token/password/trusted-proxy/device auth） | gateway API への呼び出し元を認証する              | 「安全にするにはすべてのフレームにメッセージ単位の署名が必要」                 |
| `sessionKey`                                            | コンテキスト/session 選択のためのルーティングキー | 「session key はユーザー認証境界である」                                       |
| Prompt/content ガードレール                             | model 悪用リスクを減らす                          | 「prompt injection だけで auth バイパスが証明される」                          |
| `canvas.eval` / browser evaluate                        | 有効化されているときの意図的な運用者機能          | 「どんな JS eval プリミティブも、この信頼モデルでは自動的に脆弱性になる」      |
| ローカル TUI の `!` shell                               | 明示的に運用者が起動するローカル実行              | 「ローカル shell の便利コマンドはリモートインジェクションである」              |
| Node ペアリングと node コマンド                         | ペアリング済みデバイス上での運用者レベルのリモート実行 | 「リモートデバイス制御はデフォルトで信頼されていないユーザーアクセスとして扱うべき」 |

## 設計上、脆弱性ではないもの

これらのパターンはよく報告されますが、実際の境界バイパスが示されない限り、通常は no-action としてクローズされます。

- ポリシー/auth/sandbox のバイパスを伴わない、prompt injection のみのチェーン
- 1 つの shared host/config 上で敵対的マルチテナント運用を前提にした主張
- 共有 gateway 構成で、通常の運用者読み取り経路アクセス（たとえば `sessions.list`/`sessions.preview`/`chat.history`）を IDOR と分類する主張
- localhost 限定デプロイに関する指摘（たとえば loopback 専用 gateway に対する HSTS）
- この repo に存在しない受信経路に対する Discord inbound Webhook 署名の指摘
- `system.run` に対して、実際の実行境界が依然として gateway のグローバル node コマンドポリシーと node 自身の exec 承認であるにもかかわらず、node pairing メタデータを隠れた第 2 のコマンド単位承認レイヤーとして扱う報告
- `sessionKey` を auth token とみなす「ユーザー単位の認可がない」という指摘

## 研究者向け事前チェックリスト

GHSA を開く前に、次のすべてを確認してください。

1. 再現が最新の `main` または最新リリースでまだ成立する。
2. 報告に正確なコードパス（`file`、function、line range）と検証した version/commit が含まれている。
3. 影響が文書化された信頼境界をまたいでいる（単なる prompt injection ではない）。
4. 主張が [Out of Scope](https://github.com/openclaw/openclaw/blob/main/SECURITY.md#out-of-scope) に含まれていない。
5. 重複がないよう既存の advisory を確認した（必要なら正規 GHSA を再利用する）。
6. デプロイ前提（loopback/local か公開か、trusted operator か untrusted operator か）が明示されている。

## 60 秒でできる強化ベースライン

まずこのベースラインを使い、その後、信頼された agent ごとにツールを選択的に再有効化してください。

```json5
{
  gateway: {
    mode: "local",
    bind: "loopback",
    auth: { mode: "token", token: "replace-with-long-random-token" },
  },
  session: {
    dmScope: "per-channel-peer",
  },
  tools: {
    profile: "messaging",
    deny: ["group:automation", "group:runtime", "group:fs", "sessions_spawn", "sessions_send"],
    fs: { workspaceOnly: true },
    exec: { security: "deny", ask: "always" },
    elevated: { enabled: false },
  },
  channels: {
    whatsapp: { dmPolicy: "pairing", groups: { "*": { requireMention: true } } },
  },
}
```

これにより、Gateway はローカル専用のままとなり、DM は分離され、コントロールプレーン/ランタイムツールはデフォルトで無効になります。

## 共有 inbox の簡易ルール

複数人が bot に DM できる場合:

- `session.dmScope: "per-channel-peer"`（またはマルチアカウントチャネルでは `"per-account-channel-peer"`）を設定する
- `dmPolicy: "pairing"` または厳格な allowlist を維持する
- 共有 DM と広範なツールアクセスを決して組み合わせない
- これは協調/共有 inbox を強化しますが、ユーザーが host/config への書き込み権限を共有している場合の敵対的コテナント分離を目的としたものではありません

## コンテキスト可視性モデル

OpenClaw は、次の 2 つの概念を分離しています。

- **トリガー認可**: 誰が agent を起動できるか（`dmPolicy`、`groupPolicy`、allowlist、mention ゲート）
- **コンテキスト可視性**: どの補助コンテキストが model 入力に注入されるか（返信本文、引用テキスト、スレッド履歴、転送メタデータ）

Allowlist はトリガーとコマンド認可を制御します。`contextVisibility` 設定は、補助コンテキスト（引用返信、スレッドルート、取得された履歴）をどうフィルタするかを制御します。

- `contextVisibility: "all"`（デフォルト）は、補助コンテキストを受信したまま保持します。
- `contextVisibility: "allowlist"` は、補助コンテキストを、アクティブな allowlist チェックで許可された送信者に限定してフィルタします。
- `contextVisibility: "allowlist_quote"` は `allowlist` と同様に動作しますが、明示的に引用された 1 件の返信は保持します。

`contextVisibility` はチャネル単位または room/conversation 単位で設定できます。設定方法の詳細は [Group Chats](/ja-JP/channels/groups#context-visibility-and-allowlists) を参照してください。

advisory トリアージの指針:

- 「model が allowlist にない送信者の引用や履歴テキストを見られる」というだけの主張は、`contextVisibility` で対処すべき強化項目であり、それ自体では auth や sandbox 境界のバイパスではありません。
- セキュリティ上の影響があるとみなされるには、報告には依然として信頼境界のバイパス（auth、ポリシー、sandbox、承認、またはその他の文書化された境界）の実証が必要です。

## 監査で確認する内容（高レベル）

- **受信アクセス**（DM ポリシー、グループポリシー、allowlist）: 見知らぬ人が bot を起動できますか？
- **ツールの影響半径**（昇格権限付きツール + open room）: prompt injection が shell/file/network アクションに発展する可能性はありますか？
- **Exec 承認のドリフト**（`security=full`、`autoAllowSkills`、`strictInlineEval` のないインタープリタ allowlist）: host-exec のガードレールは、まだ想定どおりに機能していますか？
  - `security="full"` は広い姿勢への警告であり、バグの証明ではありません。これは、信頼された個人アシスタント構成向けに選ばれたデフォルトです。承認や allowlist のガードレールが脅威モデル上必要な場合にのみ厳格化してください。
- **ネットワーク露出**（Gateway の bind/auth、Tailscale Serve/Funnel、弱い/短い auth token）。
- **ブラウザ制御の露出**（remote node、relay port、remote CDP エンドポイント）。
- **ローカルディスク衛生**（権限、symlink、config include、「同期フォルダ」パス）。
- **Plugin**（明示的な allowlist なしで存在する拡張機能）。
- **ポリシードリフト/設定ミス**（sandbox docker 設定があるのに sandbox mode が off、`gateway.nodes.denyCommands` のパターンが無効なのは一致が正確なコマンド名のみに対して行われるためで、shell テキストは検査しないことによるもの〔たとえば `system.run`〕、危険な `gateway.nodes.allowCommands` エントリ、グローバル `tools.profile="minimal"` が agent 単位プロファイルで上書きされる、緩いツールポリシー下で拡張 Plugin ツールに到達できる）。
- **ランタイム期待値のドリフト**（たとえば、`tools.exec.host` のデフォルトが `auto` になったのに、暗黙の exec が依然として `sandbox` を意味すると想定している、または sandbox mode が off なのに明示的に `tools.exec.host="sandbox"` を設定している）。
- **モデル衛生**（設定されたモデルが古いように見える場合は警告します。強制ブロックではありません）。

`--deep` を付けて実行すると、OpenClaw はベストエフォートで live Gateway プローブも試みます。

## 資格情報の保存先マップ

アクセス監査やバックアップ対象の判断に使ってください。

- **WhatsApp**: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Telegram bot token**: config/env または `channels.telegram.tokenFile`（通常ファイルのみ。symlink は拒否）
- **Discord bot token**: config/env または SecretRef（env/file/exec provider）
- **Slack token**: config/env（`channels.slack.*`）
- **ペアリング allowlist**:
  - `~/.openclaw/credentials/<channel>-allowFrom.json`（デフォルトアカウント）
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json`（デフォルト以外のアカウント）
- **モデル auth profile**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **ファイルベースの secret ペイロード（任意）**: `~/.openclaw/secrets.json`
- **従来の OAuth インポート**: `~/.openclaw/credentials/oauth.json`

## セキュリティ監査チェックリスト

監査で findings が出たら、次の優先順位で扱ってください。

1. **「open」かつツール有効なものすべて**: まず DM/グループをロックダウンし（pairing/allowlist）、次にツールポリシー/sandbox 化を厳格化する。
2. **公開ネットワーク露出**（LAN bind、Funnel、auth なし）: 即座に修正する。
3. **ブラウザ制御のリモート露出**: 運用者アクセス同等として扱う（tailnet 限定、意図的に node をペアリングする、公開露出を避ける）。
4. **権限**: state/config/credentials/auth が group/world-readable でないことを確認する。
5. **Plugin/拡張機能**: 明示的に信頼するものだけを読み込む。
6. **モデル選択**: ツールを使う bot には、現代的で instruction-hardening されたモデルを優先する。

## セキュリティ監査用語集

実運用で目にする可能性が高い、高シグナルの `checkId` 値（網羅的ではありません）:

| `checkId`                                                     | 重大度        | 重要である理由                                                                       | 主な修正キー/パス                                                                                     | 自動修正 |
| ------------------------------------------------------------- | ------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------- | -------- |
| `fs.state_dir.perms_world_writable`                           | critical      | 他のユーザー/プロセスが OpenClaw の状態全体を変更できる                             | `~/.openclaw` のファイルシステム権限                                                                 | yes      |
| `fs.state_dir.perms_group_writable`                           | warn          | グループユーザーが OpenClaw の状態全体を変更できる                                  | `~/.openclaw` のファイルシステム権限                                                                 | yes      |
| `fs.state_dir.perms_readable`                                 | warn          | 状態ディレクトリが他者に読み取り可能                                                 | `~/.openclaw` のファイルシステム権限                                                                 | yes      |
| `fs.state_dir.symlink`                                        | warn          | 状態ディレクトリの対象が別の信頼境界になる                                           | 状態ディレクトリのファイルシステム構成                                                               | no       |
| `fs.config.perms_writable`                                    | critical      | 他者が auth/ツールポリシー/config を変更できる                                       | `~/.openclaw/openclaw.json` のファイルシステム権限                                                   | yes      |
| `fs.config.symlink`                                           | warn          | config の対象が別の信頼境界になる                                                    | config ファイルのファイルシステム構成                                                                | no       |
| `fs.config.perms_group_readable`                              | warn          | グループユーザーが config token/設定を読める                                         | config ファイルのファイルシステム権限                                                                | yes      |
| `fs.config.perms_world_readable`                              | critical      | config により token/設定が露出する可能性がある                                       | config ファイルのファイルシステム権限                                                                | yes      |
| `fs.config_include.perms_writable`                            | critical      | config include ファイルを他者が変更できる                                            | `openclaw.json` から参照される include ファイルの権限                                                | yes      |
| `fs.config_include.perms_group_readable`                      | warn          | グループユーザーが include された secret/設定を読める                                | `openclaw.json` から参照される include ファイルの権限                                                | yes      |
| `fs.config_include.perms_world_readable`                      | critical      | include された secret/設定が全員に読み取り可能                                       | `openclaw.json` から参照される include ファイルの権限                                                | yes      |
| `fs.auth_profiles.perms_writable`                             | critical      | 他者が保存済みモデル資格情報を注入または置換できる                                   | `agents/<agentId>/agent/auth-profiles.json` の権限                                                   | yes      |
| `fs.auth_profiles.perms_readable`                             | warn          | 他者が API key や OAuth token を読める                                               | `agents/<agentId>/agent/auth-profiles.json` の権限                                                   | yes      |
| `fs.credentials_dir.perms_writable`                           | critical      | 他者がチャネルのペアリング/資格情報状態を変更できる                                  | `~/.openclaw/credentials` のファイルシステム権限                                                     | yes      |
| `fs.credentials_dir.perms_readable`                           | warn          | 他者がチャネル資格情報の状態を読める                                                 | `~/.openclaw/credentials` のファイルシステム権限                                                     | yes      |
| `fs.sessions_store.perms_readable`                            | warn          | 他者がセッショントランスクリプト/メタデータを読める                                  | セッションストアの権限                                                                               | yes      |
| `fs.log_file.perms_readable`                                  | warn          | 他者が、秘匿化されていても依然として機微なログを読める                               | gateway ログファイルの権限                                                                           | yes      |
| `fs.synced_dir`                                               | warn          | iCloud/Dropbox/Drive 上の state/config は token/トランスクリプトの露出を広げる       | config/state を同期フォルダ外に移動する                                                              | no       |
| `gateway.bind_no_auth`                                        | critical      | shared secret なしでリモート bind されている                                         | `gateway.bind`, `gateway.auth.*`                                                                     | no       |
| `gateway.loopback_no_auth`                                    | critical      | リバースプロキシされた loopback が未認証になる可能性がある                            | `gateway.auth.*`, proxy 設定                                                                         | no       |
| `gateway.trusted_proxies_missing`                             | warn          | リバースプロキシヘッダーは存在するが、信頼済みとして設定されていない                  | `gateway.trustedProxies`                                                                             | no       |
| `gateway.http.no_auth`                                        | warn/critical | `auth.mode="none"` で Gateway HTTP API に到達可能                                     | `gateway.auth.mode`, `gateway.http.endpoints.*`                                                      | no       |
| `gateway.http.session_key_override_enabled`                   | info          | HTTP API の呼び出し元が `sessionKey` を上書きできる                                  | `gateway.http.allowSessionKeyOverride`                                                               | no       |
| `gateway.tools_invoke_http.dangerous_allow`                   | warn/critical | HTTP API 経由で危険なツールが再有効化される                                           | `gateway.tools.allow`                                                                                | no       |
| `gateway.nodes.allow_commands_dangerous`                      | warn/critical | 高影響な node コマンド（camera/screen/contacts/calendar/SMS）を有効化する             | `gateway.nodes.allowCommands`                                                                        | no       |
| `gateway.nodes.deny_commands_ineffective`                     | warn          | パターン風の deny エントリは shell テキストやグループに一致しない                     | `gateway.nodes.denyCommands`                                                                         | no       |
| `gateway.tailscale_funnel`                                    | critical      | 公開インターネットへの露出                                                            | `gateway.tailscale.mode`                                                                             | no       |
| `gateway.tailscale_serve`                                     | info          | Serve による tailnet 露出が有効                                                      | `gateway.tailscale.mode`                                                                             | no       |
| `gateway.control_ui.allowed_origins_required`                 | critical      | loopback 以外の Control UI に、明示的な browser-origin allowlist がない               | `gateway.controlUi.allowedOrigins`                                                                   | no       |
| `gateway.control_ui.allowed_origins_wildcard`                 | warn/critical | `allowedOrigins=["*"]` により browser-origin allowlisting が無効になる                | `gateway.controlUi.allowedOrigins`                                                                   | no       |
| `gateway.control_ui.host_header_origin_fallback`              | warn/critical | Host ヘッダー起点の origin フォールバックを有効化している（DNS rebinding 強化を弱める） | `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback`                                         | no       |
| `gateway.control_ui.insecure_auth`                            | warn          | insecure-auth 互換トグルが有効                                                        | `gateway.controlUi.allowInsecureAuth`                                                                | no       |
| `gateway.control_ui.device_auth_disabled`                     | critical      | デバイス ID チェックを無効化している                                                  | `gateway.controlUi.dangerouslyDisableDeviceAuth`                                                     | no       |
| `gateway.real_ip_fallback_enabled`                            | warn/critical | `X-Real-IP` フォールバックを信頼すると、proxy 設定ミス経由で送信元 IP 詐称を許す可能性がある | `gateway.allowRealIpFallback`, `gateway.trustedProxies`                                              | no       |
| `gateway.token_too_short`                                     | warn          | 短い shared token は総当たりされやすい                                               | `gateway.auth.token`                                                                                 | no       |
| `gateway.auth_no_rate_limit`                                  | warn          | レート制限のない公開 auth は総当たりリスクを高める                                   | `gateway.auth.rateLimit`                                                                             | no       |
| `gateway.trusted_proxy_auth`                                  | critical      | proxy の ID がそのまま auth 境界になる                                                | `gateway.auth.mode="trusted-proxy"`                                                                  | no       |
| `gateway.trusted_proxy_no_proxies`                            | critical      | trusted-proxy auth なのに trusted proxy IP がないのは危険                            | `gateway.trustedProxies`                                                                             | no       |
| `gateway.trusted_proxy_no_user_header`                        | critical      | trusted-proxy auth が安全にユーザー ID を解決できない                                 | `gateway.auth.trustedProxy.userHeader`                                                               | no       |
| `gateway.trusted_proxy_no_allowlist`                          | warn          | trusted-proxy auth が認証済み上流ユーザーを誰でも受け入れる                           | `gateway.auth.trustedProxy.allowUsers`                                                               | no       |
| `checkId`                                                     | 重大度        | 重要である理由                                                                       | 主な修正キー/パス                                                                                     | 自動修正 |
| ------------------------------------------------------------- | ------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------- | -------- |
| `gateway.probe_auth_secretref_unavailable`                    | warn          | Deep probe がこのコマンド経路では auth SecretRef を解決できなかった                  | deep-probe の auth ソース / SecretRef の可用性                                                       | no       |
| `gateway.probe_failed`                                        | warn/critical | live Gateway probe が失敗した                                                        | gateway の到達可能性/auth                                                                            | no       |
| `discovery.mdns_full_mode`                                    | warn/critical | mDNS full mode がローカルネットワーク上に `cliPath`/`sshPort` メタデータを広告する   | `discovery.mdns.mode`, `gateway.bind`                                                                | no       |
| `config.insecure_or_dangerous_flags`                          | warn          | insecure/dangerous なデバッグフラグがいずれか有効                                    | 複数キー（finding の詳細を参照）                                                                     | no       |
| `config.secrets.gateway_password_in_config`                   | warn          | Gateway password が config に直接保存されている                                      | `gateway.auth.password`                                                                              | no       |
| `config.secrets.hooks_token_in_config`                        | warn          | hook bearer token が config に直接保存されている                                     | `hooks.token`                                                                                        | no       |
| `hooks.token_reuse_gateway_token`                             | critical      | hook の受信 token が Gateway auth の解除にも使える                                   | `hooks.token`, `gateway.auth.token`                                                                  | no       |
| `hooks.token_too_short`                                       | warn          | hook 受信で総当たりされやすい                                                        | `hooks.token`                                                                                        | no       |
| `hooks.default_session_key_unset`                             | warn          | hook agent 実行が、リクエストごとに生成されたセッションへ分散する                    | `hooks.defaultSessionKey`                                                                            | no       |
| `hooks.allowed_agent_ids_unrestricted`                        | warn/critical | 認証済み hook 呼び出し元が、設定済みの任意の agent にルーティングできる               | `hooks.allowedAgentIds`                                                                              | no       |
| `hooks.request_session_key_enabled`                           | warn/critical | 外部呼び出し元が `sessionKey` を選択できる                                           | `hooks.allowRequestSessionKey`                                                                       | no       |
| `hooks.request_session_key_prefixes_missing`                  | warn/critical | 外部の session key 形状に制限がない                                                   | `hooks.allowedSessionKeyPrefixes`                                                                    | no       |
| `hooks.path_root`                                             | critical      | hook パスが `/` であり、受信の衝突や誤ルーティングが起きやすい                        | `hooks.path`                                                                                         | no       |
| `hooks.installs_unpinned_npm_specs`                           | warn          | hook のインストール記録が不変の npm spec に固定されていない                           | hook インストールメタデータ                                                                          | no       |
| `hooks.installs_missing_integrity`                            | warn          | hook のインストール記録に integrity メタデータがない                                  | hook インストールメタデータ                                                                          | no       |
| `hooks.installs_version_drift`                                | warn          | hook のインストール記録がインストール済み package とずれている                        | hook インストールメタデータ                                                                          | no       |
| `logging.redact_off`                                          | warn          | 機微な値がログ/ステータスに漏れる                                                     | `logging.redactSensitive`                                                                            | yes      |
| `browser.control_invalid_config`                              | warn          | browser control の config がランタイム前の時点で不正                                  | `browser.*`                                                                                          | no       |
| `browser.control_no_auth`                                     | critical      | browser control が token/password auth なしで公開されている                           | `gateway.auth.*`                                                                                     | no       |
| `browser.remote_cdp_http`                                     | warn          | 平文 HTTP 上の remote CDP には転送暗号化がない                                        | browser profile の `cdpUrl`                                                                          | no       |
| `browser.remote_cdp_private_host`                             | warn          | remote CDP が private/internal host を対象にしている                                  | browser profile の `cdpUrl`, `browser.ssrfPolicy.*`                                                  | no       |
| `sandbox.docker_config_mode_off`                              | warn          | sandbox Docker config は存在するが無効                                                | `agents.*.sandbox.mode`                                                                              | no       |
| `sandbox.bind_mount_non_absolute`                             | warn          | 相対 bind mount は予測不能に解決されることがある                                      | `agents.*.sandbox.docker.binds[]`                                                                    | no       |
| `sandbox.dangerous_bind_mount`                                | critical      | sandbox bind mount の対象が、ブロック対象の system、資格情報、または Docker socket パス | `agents.*.sandbox.docker.binds[]`                                                                    | no       |
| `sandbox.dangerous_network_mode`                              | critical      | sandbox Docker network が `host` または `container:*` の namespace-join モードを使う | `agents.*.sandbox.docker.network`                                                                    | no       |
| `sandbox.dangerous_seccomp_profile`                           | critical      | sandbox seccomp profile がコンテナ分離を弱める                                        | `agents.*.sandbox.docker.securityOpt`                                                                | no       |
| `sandbox.dangerous_apparmor_profile`                          | critical      | sandbox AppArmor profile がコンテナ分離を弱める                                       | `agents.*.sandbox.docker.securityOpt`                                                                | no       |
| `sandbox.browser_cdp_bridge_unrestricted`                     | warn          | sandbox browser bridge が送信元範囲制限なしで公開されている                           | `sandbox.browser.cdpSourceRange`                                                                     | no       |
| `sandbox.browser_container.non_loopback_publish`              | critical      | 既存の browser container が非 loopback インターフェースで CDP を公開している          | browser sandbox container の publish 設定                                                            | no       |
| `sandbox.browser_container.hash_label_missing`                | warn          | 既存の browser container が現在の config-hash label より前のもの                      | `openclaw sandbox recreate --browser --all`                                                          | no       |
| `sandbox.browser_container.hash_epoch_stale`                  | warn          | 既存の browser container が現在の browser config epoch より前のもの                   | `openclaw sandbox recreate --browser --all`                                                          | no       |
| `tools.exec.host_sandbox_no_sandbox_defaults`                 | warn          | sandbox が off のとき、`exec host=sandbox` は closed fail する                        | `tools.exec.host`, `agents.defaults.sandbox.mode`                                                    | no       |
| `tools.exec.host_sandbox_no_sandbox_agents`                   | warn          | sandbox が off のとき、agent 単位の `exec host=sandbox` は closed fail する            | `agents.list[].tools.exec.host`, `agents.list[].sandbox.mode`                                        | no       |
| `tools.exec.security_full_configured`                         | warn/critical | host exec が `security="full"` で実行されている                                       | `tools.exec.security`, `agents.list[].tools.exec.security`                                           | no       |
| `tools.exec.auto_allow_skills_enabled`                        | warn          | exec 承認が skill bin を暗黙的に信頼する                                              | `~/.openclaw/exec-approvals.json`                                                                    | no       |
| `tools.exec.allowlist_interpreter_without_strict_inline_eval` | warn          | インタープリタ allowlist が、強制再承認なしで inline eval を許可する                  | `tools.exec.strictInlineEval`, `agents.list[].tools.exec.strictInlineEval`, exec approvals allowlist | no       |
| `tools.exec.safe_bins_interpreter_unprofiled`                 | warn          | `safeBins` 内のインタープリタ/ランタイム bin に明示的プロファイルがなく、exec リスクを広げる | `tools.exec.safeBins`, `tools.exec.safeBinProfiles`, `agents.list[].tools.exec.*`                   | no       |
| `tools.exec.safe_bins_broad_behavior`                         | warn          | `safeBins` 内の広範な挙動を持つツールが、低リスク stdin-filter 信頼モデルを弱める      | `tools.exec.safeBins`, `agents.list[].tools.exec.safeBins`                                           | no       |
| `tools.exec.safe_bin_trusted_dirs_risky`                      | warn          | `safeBinTrustedDirs` に変更可能または危険なディレクトリが含まれている                 | `tools.exec.safeBinTrustedDirs`, `agents.list[].tools.exec.safeBinTrustedDirs`                      | no       |
| `skills.workspace.symlink_escape`                             | warn          | workspace `skills/**/SKILL.md` が workspace ルート外に解決される（symlink チェーンのドリフト） | workspace `skills/**` のファイルシステム状態                                                         | no       |
| `plugins.extensions_no_allowlist`                             | warn          | 明示的な plugin allowlist なしで拡張機能がインストールされている                      | `plugins.allowlist`                                                                                  | no       |
| `plugins.installs_unpinned_npm_specs`                         | warn          | Plugin のインストール記録が不変の npm spec に固定されていない                         | Plugin インストールメタデータ                                                                        | no       |
| `checkId`                                                     | 重大度        | 重要である理由                                                                       | 主な修正キー/パス                                                                                     | 自動修正 |
| ------------------------------------------------------------- | ------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------- | -------- |
| `plugins.installs_missing_integrity`                          | warn          | Plugin のインストール記録に integrity メタデータがない                              | Plugin インストールメタデータ                                                                        | no       |
| `plugins.installs_version_drift`                              | warn          | Plugin のインストール記録がインストール済み package とずれている                    | Plugin インストールメタデータ                                                                        | no       |
| `plugins.code_safety`                                         | warn/critical | Plugin コードスキャンで不審または危険なパターンが見つかった                         | Plugin コード / インストール元                                                                       | no       |
| `plugins.code_safety.entry_path`                              | warn          | Plugin のエントリパスが hidden または `node_modules` 配下を指している               | Plugin manifest の `entry`                                                                           | no       |
| `plugins.code_safety.entry_escape`                            | critical      | Plugin エントリが Plugin ディレクトリを逸脱している                                 | Plugin manifest の `entry`                                                                           | no       |
| `plugins.code_safety.scan_failed`                             | warn          | Plugin コードスキャンを完了できなかった                                              | Plugin 拡張パス / スキャン環境                                                                       | no       |
| `skills.code_safety`                                          | warn/critical | Skill インストーラのメタデータ/コードに不審または危険なパターンが含まれる           | skill のインストール元                                                                               | no       |
| `skills.code_safety.scan_failed`                              | warn          | Skill コードスキャンを完了できなかった                                               | skill スキャン環境                                                                                   | no       |
| `security.exposure.open_channels_with_exec`                   | warn/critical | shared/public room から exec 有効 agent に到達できる                                 | `channels.*.dmPolicy`, `channels.*.groupPolicy`, `tools.exec.*`, `agents.list[].tools.exec.*`       | no       |
| `security.exposure.open_groups_with_elevated`                 | critical      | open group と昇格権限付きツールの組み合わせは、高影響な prompt injection 経路を作る  | `channels.*.groupPolicy`, `tools.elevated.*`                                                         | no       |
| `security.exposure.open_groups_with_runtime_or_fs`            | critical/warn | open group から、sandbox/workspace ガードなしでコマンド/ファイルツールに到達できる   | `channels.*.groupPolicy`, `tools.profile/deny`, `tools.fs.workspaceOnly`, `agents.*.sandbox.mode`   | no       |
| `security.trust_model.multi_user_heuristic`                   | warn          | config が、gateway の信頼モデルである個人アシスタントよりもマルチユーザーに見える   | 信頼境界の分離、または shared-user 強化（`sandbox.mode`、ツール deny/workspace スコープ）           | no       |
| `tools.profile_minimal_overridden`                            | warn          | agent の上書きがグローバル minimal profile を迂回している                            | `agents.list[].tools.profile`                                                                        | no       |
| `plugins.tools_reachable_permissive_policy`                   | warn          | 緩いポリシー環境で拡張ツールに到達できる                                             | `tools.profile` + ツール allow/deny                                                                  | no       |
| `models.legacy`                                               | warn          | 古い model ファミリーがまだ設定されている                                            | model 選択                                                                                           | no       |
| `models.weak_tier`                                            | warn          | 設定された model が現在の推奨 tier を下回っている                                    | model 選択                                                                                           | no       |
| `models.small_params`                                         | critical/info | 小さなモデルと安全でないツール面の組み合わせは injection リスクを高める              | model 選択 + sandbox/ツールポリシー                                                                  | no       |
| `summary.attack_surface`                                      | info          | auth、チャネル、ツール、露出姿勢のロールアップ要約                                   | 複数キー（finding の詳細を参照）                                                                     | no       |

## HTTP 上の Control UI

Control UI がデバイス ID を生成するには、**セキュアコンテキスト**（HTTPS または localhost）が必要です。`gateway.controlUi.allowInsecureAuth` はローカル互換性のためのトグルです。

- localhost では、ページが非セキュアな HTTP で読み込まれたときに、デバイス ID なしで Control UI auth を許可します。
- これは pairing チェックを回避しません。
- リモート（non-localhost）のデバイス ID 要件は緩和しません。

HTTPS（Tailscale Serve）を優先するか、`127.0.0.1` で UI を開いてください。

緊急時専用として、`gateway.controlUi.dangerouslyDisableDeviceAuth` はデバイス ID チェックを完全に無効にします。これは重大なセキュリティ低下です。積極的にデバッグしていて、すぐ元に戻せる場合以外は無効のままにしてください。

それらの危険フラグとは別に、`gateway.auth.mode: "trusted-proxy"` が成功した場合、デバイス ID なしで **運用者** の Control UI セッションを許可できます。これは意図された auth モード動作であり、`allowInsecureAuth` の抜け道ではありません。また、node ロールの Control UI セッションには適用されません。

`openclaw security audit` は、この設定が有効な場合に警告を出します。

## insecure または dangerous なフラグの要約

`openclaw security audit` は、既知の insecure/dangerous なデバッグスイッチが有効な場合に `config.insecure_or_dangerous_flags` を含めます。このチェックは現在、次を集約します。

- `gateway.controlUi.allowInsecureAuth=true`
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true`
- `gateway.controlUi.dangerouslyDisableDeviceAuth=true`
- `hooks.gmail.allowUnsafeExternalContent=true`
- `hooks.mappings[<index>].allowUnsafeExternalContent=true`
- `tools.exec.applyPatch.workspaceOnly=false`
- `plugins.entries.acpx.config.permissionMode=approve-all`

OpenClaw の config schema で定義されている完全な `dangerous*` / `dangerously*` config キー:

- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback`
- `gateway.controlUi.dangerouslyDisableDeviceAuth`
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
- `channels.discord.dangerouslyAllowNameMatching`
- `channels.discord.accounts.<accountId>.dangerouslyAllowNameMatching`
- `channels.slack.dangerouslyAllowNameMatching`
- `channels.slack.accounts.<accountId>.dangerouslyAllowNameMatching`
- `channels.googlechat.dangerouslyAllowNameMatching`
- `channels.googlechat.accounts.<accountId>.dangerouslyAllowNameMatching`
- `channels.msteams.dangerouslyAllowNameMatching`
- `channels.synology-chat.dangerouslyAllowNameMatching`（拡張チャネル）
- `channels.synology-chat.accounts.<accountId>.dangerouslyAllowNameMatching`（拡張チャネル）
- `channels.synology-chat.dangerouslyAllowInheritedWebhookPath`（拡張チャネル）
- `channels.zalouser.dangerouslyAllowNameMatching`（拡張チャネル）
- `channels.zalouser.accounts.<accountId>.dangerouslyAllowNameMatching`（拡張チャネル）
- `channels.irc.dangerouslyAllowNameMatching`（拡張チャネル）
- `channels.irc.accounts.<accountId>.dangerouslyAllowNameMatching`（拡張チャネル）
- `channels.mattermost.dangerouslyAllowNameMatching`（拡張チャネル）
- `channels.mattermost.accounts.<accountId>.dangerouslyAllowNameMatching`（拡張チャネル）
- `channels.telegram.network.dangerouslyAllowPrivateNetwork`
- `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`
- `agents.defaults.sandbox.docker.dangerouslyAllowReservedContainerTargets`
- `agents.defaults.sandbox.docker.dangerouslyAllowExternalBindSources`
- `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin`
- `agents.list[<index>].sandbox.docker.dangerouslyAllowReservedContainerTargets`
- `agents.list[<index>].sandbox.docker.dangerouslyAllowExternalBindSources`
- `agents.list[<index>].sandbox.docker.dangerouslyAllowContainerNamespaceJoin`

## リバースプロキシ設定

Gateway をリバースプロキシ（nginx、Caddy、Traefik など）の背後で実行する場合は、転送されたクライアント IP を正しく処理するために `gateway.trustedProxies` を設定してください。

Gateway が、`trustedProxies` に **含まれていない** アドレスからの proxy ヘッダーを検出した場合、その接続をローカルクライアントとして **扱いません**。gateway auth が無効な場合、それらの接続は拒否されます。これにより、プロキシ経由の接続が localhost から来たように見えて自動的に信頼される認証バイパスを防ぎます。

`gateway.trustedProxies` は `gateway.auth.mode: "trusted-proxy"` にも使われますが、この auth モードはより厳格です。

- trusted-proxy auth は **loopback 発信 proxy では closed fail** します
- 同一 host 上の loopback リバースプロキシでも、ローカルクライアント検出と転送 IP 処理には `gateway.trustedProxies` を使えます
- 同一 host 上の loopback リバースプロキシでは、`gateway.auth.mode: "trusted-proxy"` ではなく token/password auth を使ってください

```yaml
gateway:
  trustedProxies:
    - "10.0.0.1" # reverse proxy IP
  # 任意。デフォルトは false。
  # proxy が X-Forwarded-For を提供できない場合のみ有効にしてください。
  allowRealIpFallback: false
  auth:
    mode: password
    password: ${OPENCLAW_GATEWAY_PASSWORD}
```

`trustedProxies` が設定されている場合、Gateway は `X-Forwarded-For` を使ってクライアント IP を判定します。`X-Real-IP` は、`gateway.allowRealIpFallback: true` が明示的に設定されていない限り、デフォルトで無視されます。

望ましいリバースプロキシ動作（受信した forwarding ヘッダーを上書きする）:

```nginx
proxy_set_header X-Forwarded-For $remote_addr;
proxy_set_header X-Real-IP $remote_addr;
```

望ましくないリバースプロキシ動作（信頼されていない forwarding ヘッダーを追加/保持する）:

```nginx
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
```

## HSTS と origin に関する注意

- OpenClaw Gateway はまず local/loopback を前提としています。リバースプロキシで TLS を終端する場合は、そこで proxy 向け HTTPS ドメインに HSTS を設定してください。
- Gateway 自体が HTTPS を終端する場合は、`gateway.http.securityHeaders.strictTransportSecurity` を設定して、OpenClaw のレスポンスから HSTS ヘッダーを出せます。
- 詳しいデプロイガイダンスは [Trusted Proxy Auth](/ja-JP/gateway/trusted-proxy-auth#tls-termination-and-hsts) にあります。
- non-loopback の Control UI デプロイでは、デフォルトで `gateway.controlUi.allowedOrigins` が必要です。
- `gateway.controlUi.allowedOrigins: ["*"]` は明示的な全 browser-origin 許可ポリシーであり、強化されたデフォルトではありません。厳密に制御されたローカルテスト以外では避けてください。
- loopback 上の browser-origin auth 失敗も、一般的な loopback 例外が有効であってもレート制限されますが、ロックアウトキーは共有された localhost バケット 1 つではなく、正規化された `Origin` 値ごとにスコープされます。
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` は Host ヘッダー起点の origin フォールバックモードを有効にします。危険な運用者選択ポリシーとして扱ってください。
- DNS rebinding と proxy-host header の挙動はデプロイ強化上の懸念として扱ってください。`trustedProxies` は厳密に保ち、gateway を公開インターネットに直接露出させないでください。

## ローカルセッションログはディスク上に保存される

OpenClaw は、`~/.openclaw/agents/<agentId>/sessions/*.jsonl` にセッショントランスクリプトをディスク保存します。
これはセッション継続性と、（任意で）セッションメモリのインデックス化のために必要ですが、同時に **ファイルシステムアクセス権を持つ任意のプロセス/ユーザーがそれらのログを読める** ことも意味します。ディスクアクセスを信頼境界として扱い、`~/.openclaw` の権限を厳格化してください（下の監査セクションを参照）。agent 間でより強い分離が必要な場合は、別々の OS ユーザーまたは別々の host の下で実行してください。

## Node 実行（system.run）

macOS node がペアリングされている場合、Gateway はその node 上で `system.run` を呼び出せます。これは Mac 上での **リモートコード実行** です。

- node pairing（承認 + token）が必要です。
- Gateway の node pairing はコマンド単位の承認面ではありません。これは node の ID/信頼確立と token 発行を行います。
- Gateway は `gateway.nodes.allowCommands` / `denyCommands` を通じて、大まかなグローバル node コマンドポリシーを適用します。
- Mac 側では **Settings → Exec approvals**（security + ask + allowlist）で制御されます。
- node 単位の `system.run` ポリシーは、node 自身の exec approvals ファイル（`exec.approvals.node.*`）であり、gateway のグローバルコマンド ID ポリシーより厳格な場合も、緩い場合もあります。
- `security="full"` かつ `ask="off"` で動作する node は、デフォルトの trusted-operator モデルに従っています。デプロイでより厳格な承認や allowlist の姿勢を明示的に要求していない限り、これは期待どおりの動作として扱ってください。
- 承認モードは、正確なリクエストコンテキストと、可能な場合は 1 つの具体的なローカルスクリプト/ファイルオペランドに結び付けられます。インタープリタ/ランタイムコマンドについて OpenClaw が正確に 1 つの直接ローカルファイルを特定できない場合、承認に基づく実行は、完全な意味的カバレッジを約束する代わりに拒否されます。
- `host=node` の場合、承認ベースの実行は正規化済みの `systemRunPlan` も保存します。後続の承認済み転送ではその保存済み plan を再利用し、gateway は承認要求作成後の command/cwd/session コンテキストに対する呼び出し元の編集を拒否します。
- リモート実行を望まない場合は、security を **deny** に設定し、その Mac の node pairing を解除してください。

この区別はトリアージで重要です。

- 再接続したペアリング済み node が別のコマンド一覧を通知しても、それ自体は脆弱性ではありません。Gateway のグローバルポリシーと node のローカル exec approvals が実際の実行境界を依然として強制しているなら問題ありません。
- node pairing メタデータを、隠れた第 2 のコマンド単位承認レイヤーとして扱う報告は、通常はポリシー/UX の混乱であり、セキュリティ境界のバイパスではありません。

## 動的 Skills（watcher / remote node）

OpenClaw はセッション途中で Skills 一覧を更新できます。

- **Skills watcher**: `SKILL.md` への変更は、次のエージェントターンで skills スナップショットを更新できます。
- **Remote node**: macOS node が接続されると、macOS 専用 Skills が対象になることがあります（bin probing に基づく）。

skill フォルダは **信頼されたコード** として扱い、誰が変更できるかを制限してください。

## 脅威モデル

AI アシスタントは次のことができます。

- 任意のシェルコマンドを実行する
- ファイルを読み書きする
- ネットワークサービスにアクセスする
- 誰にでもメッセージを送る（WhatsApp アクセスを与えた場合）

あなたにメッセージする人は次のことができます。

- AI をだまして悪いことをさせようとする
- あなたのデータへのアクセスをソーシャルエンジニアリングで狙う
- インフラの詳細を探ろうとする

## コア概念: 知能より先にアクセス制御

ここでの失敗の大半は巧妙なエクスプロイトではありません。単に「誰かが bot にメッセージし、bot が言われたとおりに実行した」というものです。

OpenClaw の基本姿勢:

- **まず ID:** 誰が bot と話せるかを決める（DM pairing / allowlist / 明示的な `open`）
- **次にスコープ:** bot がどこで動いてよいかを決める（group allowlist + mention ゲート、ツール、sandbox 化、デバイス権限）
- **最後に model:** model は操作されうると想定し、その操作の影響半径が限定されるよう設計する

## コマンド認可モデル

スラッシュコマンドとディレクティブは、**認可された送信者** に対してのみ処理されます。認可は、チャネル allowlist/pairing と `commands.useAccessGroups` から導出されます（[Configuration](/ja-JP/gateway/configuration) と [Slash commands](/ja-JP/tools/slash-commands) を参照）。チャネル allowlist が空、または `"*"` を含む場合、そのチャネルではコマンドは事実上オープンです。

`/exec` は、認可された運用者向けのセッション専用の利便機能です。config への書き込みや他のセッションの変更は行いません。

## コントロールプレーンツールのリスク

永続的なコントロールプレーン変更を行える組み込みツールは 2 つあります。

- `gateway` は `config.schema.lookup` / `config.get` で config を確認でき、`config.apply`、`config.patch`、`update.run` で永続的な変更を行えます。
- `cron` は、元のチャット/タスク終了後も実行され続ける定期実行ジョブを作成できます。

owner 専用の `gateway` ランタイムツールは、依然として `tools.exec.ask` や `tools.exec.security` の書き換えを拒否します。従来の `tools.bash.*` エイリアスは、書き込み前に同じ保護された exec パスへ正規化されます。

信頼されていないコンテンツを扱う agent/サーフェスでは、これらをデフォルトで拒否してください。

```json5
{
  tools: {
    deny: ["gateway", "cron", "sessions_spawn", "sessions_send"],
  },
}
```

`commands.restart=false` は restart アクションをブロックするだけです。`gateway` の config/update アクションは無効にしません。

## Plugin/拡張機能

Plugin は Gateway と **同じプロセス内** で実行されます。信頼されたコードとして扱ってください。

- 信頼できるソースからの Plugin のみインストールしてください。
- 明示的な `plugins.allow` allowlist を優先してください。
- 有効化する前に Plugin の config を確認してください。
- Plugin 変更後は Gateway を再起動してください。
- Plugin をインストールまたは更新する場合（`openclaw plugins install <package>`、`openclaw plugins update <id>`）、それは信頼されていないコードを実行するのと同様に扱ってください。
  - インストール先は、アクティブな Plugin インストールルート配下の Plugin ごとのディレクトリです。
  - OpenClaw は、インストール/更新前に組み込みの危険コードスキャンを実行します。`critical` findings はデフォルトでブロックされます。
  - OpenClaw は `npm pack` を使い、その後そのディレクトリで `npm install --omit=dev` を実行します（npm lifecycle script はインストール中にコードを実行できます）。
  - 固定された正確なバージョン（`@scope/pkg@1.2.3`）を優先し、有効化前にディスク上へ展開されたコードを確認してください。
  - `--dangerously-force-unsafe-install` は、Plugin のインストール/更新フローにおける組み込みスキャンの false positive に対する緊急用です。これは Plugin の `before_install` hook ポリシーブロックを回避せず、スキャン失敗も回避しません。
  - Gateway バックエンドの skill 依存関係インストールも同じ dangerous/suspicious の区別に従います。組み込みの `critical` findings は、呼び出し元が明示的に `dangerouslyForceUnsafeInstall` を設定しない限りブロックされ、suspicious findings は引き続き警告のみです。`openclaw skills install` は、別系統の ClawHub skill ダウンロード/インストールフローのままです。

詳細: [Plugins](/ja-JP/tools/plugin)

<a id="dm-access-model-pairing-allowlist-open-disabled"></a>

## DM アクセスモデル（pairing / allowlist / open / disabled）

現在 DM 対応のすべてのチャネルは、メッセージが処理される **前に** 受信 DM を制御する DM ポリシー（`dmPolicy` または `*.dm.policy`）をサポートしています。

- `pairing`（デフォルト）: 未知の送信者には短い pairing code が送られ、承認されるまで bot はそのメッセージを無視します。code の有効期限は 1 時間です。繰り返し DM しても、新しいリクエストが作成されるまで code は再送されません。保留中リクエストは、デフォルトで **チャネルごとに 3 件** までに制限されます。
- `allowlist`: 未知の送信者はブロックされます（pairing ハンドシェイクなし）。
- `open`: 誰でも DM 可能にします（公開）。チャネル allowlist に `"*"` が含まれている必要があります（明示的な opt-in）。
- `disabled`: 受信 DM を完全に無視します。

CLI で承認:

```bash
openclaw pairing list <channel>
openclaw pairing approve <channel> <code>
```

詳細とディスク上のファイル: [Pairing](/ja-JP/channels/pairing)

## DM セッション分離（マルチユーザーモード）

デフォルトでは、OpenClaw は **すべての DM をメインセッションにルーティング** し、デバイスやチャネルをまたいでアシスタントの継続性を保ちます。**複数人** が bot に DM できる場合（open DM または複数人の allowlist）、DM セッションの分離を検討してください。

```json5
{
  session: { dmScope: "per-channel-peer" },
}
```

これにより、グループチャットの分離を維持しつつ、ユーザー間のコンテキスト漏えいを防げます。

これはメッセージングコンテキスト境界であり、host 管理者境界ではありません。ユーザー同士が相互に敵対的で、同じ Gateway host/config を共有している場合は、信頼境界ごとに別々の gateway を実行してください。

### セキュア DM モード（推奨）

上記スニペットを **セキュア DM モード** として扱ってください。

- デフォルト: `session.dmScope: "main"`（すべての DM が継続性のために 1 つのセッションを共有）
- ローカル CLI オンボーディングのデフォルト: 未設定時は `session.dmScope: "per-channel-peer"` を書き込む（既存の明示値は保持）
- セキュア DM モード: `session.dmScope: "per-channel-peer"`（各チャネル+送信者ペアに分離された DM コンテキスト）
- チャネル横断の peer 分離: `session.dmScope: "per-peer"`（同じ種類のすべてのチャネルをまたいで、送信者ごとに 1 つのセッション）

同じチャネル上で複数アカウントを実行している場合は、代わりに `per-account-channel-peer` を使ってください。同じ人が複数チャネルから連絡してくる場合は、`session.identityLinks` を使って、それらの DM セッションを 1 つの正規 ID に統合してください。[Session Management](/ja-JP/concepts/session) と [Configuration](/ja-JP/gateway/configuration) を参照してください。

## Allowlist（DM + グループ）- 用語

OpenClaw には、「誰が自分を起動できるか」に関する 2 つの別レイヤーがあります。

- **DM allowlist**（`allowFrom` / `channels.discord.allowFrom` / `channels.slack.allowFrom`; 従来: `channels.discord.dm.allowFrom`, `channels.slack.dm.allowFrom`）: ダイレクトメッセージで bot に話しかけることを許可される相手。
  - `dmPolicy="pairing"` の場合、承認は `~/.openclaw/credentials/` 配下のアカウントスコープ付き pairing allowlist ストアに書き込まれます（デフォルトアカウントは `<channel>-allowFrom.json`、デフォルト以外は `<channel>-<accountId>-allowFrom.json`）。これが config の allowlist とマージされます。
- **グループ allowlist**（チャネル固有）: bot がそもそもメッセージを受け付けるグループ/チャネル/guild。
  - 一般的なパターン:
    - `channels.whatsapp.groups`, `channels.telegram.groups`, `channels.imessage.groups`: `requireMention` のようなグループ単位デフォルト。これを設定するとグループ allowlist としても機能します（全許可を維持するには `"*"` を含める）。
    - `groupPolicy="allowlist"` + `groupAllowFrom`: グループセッション **内で** bot を起動できる相手を制限する（WhatsApp/Telegram/Signal/iMessage/Microsoft Teams）。
    - `channels.discord.guilds` / `channels.slack.channels`: サーフェス単位の allowlist + mention デフォルト。
  - グループチェックは次の順で実行されます。まず `groupPolicy`/グループ allowlist、次に mention/返信アクティベーション。
  - bot メッセージへの返信（暗黙の mention）は、`groupAllowFrom` のような送信者 allowlist を回避しません。
  - **セキュリティ上の注意:** `dmPolicy="open"` と `groupPolicy="open"` は最後の手段として扱ってください。これらはほとんど使うべきではありません。部屋の全員を完全に信頼している場合を除き、pairing + allowlist を優先してください。

詳細: [Configuration](/ja-JP/gateway/configuration) と [Groups](/ja-JP/channels/groups)

## Prompt injection（それは何か、なぜ重要か）

Prompt injection とは、攻撃者がメッセージを巧妙に作り、model を操作して危険なことをさせることです（「指示を無視しろ」「ファイルシステムを全部出せ」「このリンクを開いてコマンドを実行しろ」など）。

強力なシステムプロンプトがあっても、**prompt injection は未解決です**。システムプロンプトのガードレールはあくまでソフトなガイダンスにすぎません。厳格な強制は、ツールポリシー、exec 承認、sandbox 化、チャネル allowlist から来ます（しかも運用者は設計上これらを無効化できます）。実際に役立つこと:

- 受信 DM をロックダウンする（pairing/allowlist）。
- グループでは mention ゲートを優先し、公開 room での「常時待機」bot を避ける。
- リンク、添付ファイル、貼り付けられた指示は、デフォルトで敵対的なものとして扱う。
- 機微なツール実行は sandbox で行い、secret を agent がアクセス可能なファイルシステム外に置く。
- 注: sandbox 化は opt-in です。sandbox mode が off の場合、暗黙の `host=auto` は gateway host に解決されます。明示的な `host=sandbox` は、利用可能な sandbox ランタイムがないため closed fail します。その挙動を config 上でも明示したい場合は `host=gateway` を設定してください。
- 高リスクツール（`exec`、`browser`、`web_fetch`、`web_search`）は、信頼された agent または明示的な allowlist に限定する。
- インタープリタ（`python`, `node`, `ruby`, `perl`, `php`, `lua`, `osascript`）を allowlist する場合は、inline eval 形式でも明示的承認が必要になるよう `tools.exec.strictInlineEval` を有効にする。
- **モデル選択は重要です:** 古い/小さい/従来型のモデルは、prompt injection とツール誤用に対して大幅に脆弱です。ツール有効 agent には、利用可能な中で最も強い最新世代の instruction-hardening 済みモデルを使ってください。

信頼してはいけない危険信号:

- 「このファイル/URL を読んで、その指示どおり正確に実行して」
- 「システムプロンプトや安全ルールを無視して」
- 「隠された指示やツール出力を明かして」
- 「`~/.openclaw` やログの内容を全部貼って」

## 安全でない外部コンテンツのバイパスフラグ

OpenClaw には、外部コンテンツの安全ラップを無効にする明示的なバイパスフラグがあります。

- `hooks.mappings[].allowUnsafeExternalContent`
- `hooks.gmail.allowUnsafeExternalContent`
- Cron ペイロードフィールド `allowUnsafeExternalContent`

ガイダンス:

- 本番環境では未設定/false のままにしてください。
- 厳密に範囲を限定したデバッグ時にのみ一時的に有効にしてください。
- 有効にする場合は、その agent を分離してください（sandbox + 最小ツール + 専用セッション namespace）。

hooks のリスクに関する注意:

- hook ペイロードは、配信元が自分で管理しているシステムであっても、信頼されていないコンテンツです（メール/ドキュメント/Web コンテンツは prompt injection を含みえます）。
- 弱いモデル tier はこのリスクを高めます。hook 駆動の自動化では、強力で現代的なモデル tier を優先し、ツールポリシーを厳格に保ってください（`tools.profile: "messaging"` またはそれより厳格）。可能なら sandbox 化も行ってください。

### Prompt injection は公開 DM を必要としない

bot にメッセージできるのが **自分だけ** であっても、bot が読む **信頼されていないコンテンツ**（Web 検索/取得結果、browser ページ、メール、ドキュメント、添付ファイル、貼り付けられたログ/コード）を通じて、prompt injection は依然として起こりえます。つまり、送信者だけが脅威面なのではなく、**コンテンツ自体** が敵対的指示を運ぶ可能性があります。

ツールが有効な場合、典型的なリスクはコンテキスト流出やツール呼び出しの誘発です。影響半径を減らす方法:

- 読み取り専用またはツール無効の **reader agent** を使って信頼されていないコンテンツを要約し、その要約をメイン agent に渡す。
- 必要でない限り、ツール有効 agent では `web_search` / `web_fetch` / `browser` を無効にしておく。
- OpenResponses の URL 入力（`input_file` / `input_image`）では、`gateway.http.endpoints.responses.files.urlAllowlist` と `gateway.http.endpoints.responses.images.urlAllowlist` を厳密に設定し、`maxUrlParts` は低く保つ。空の allowlist は未設定として扱われます。URL 取得を完全に無効にしたいなら `files.allowUrl: false` / `images.allowUrl: false` を使ってください。
- OpenResponses の file 入力では、デコードされた `input_file` テキストも依然として **信頼されていない外部コンテンツ** として注入されます。Gateway がローカルでデコードしたからといって、その file テキストを信頼済みだと思わないでください。注入ブロックには、長い `SECURITY NOTICE:` バナーが省略されるこの経路でも、明示的な `<<<EXTERNAL_UNTRUSTED_CONTENT ...>>>` 境界マーカーと `Source: External` メタデータが付きます。
- 添付ドキュメントから media-understanding がテキストを抽出し、それを media prompt に追加する場合にも、同じマーカーベースのラップが適用されます。
- 信頼されていない入力に触れる agent では sandbox 化と厳格なツール allowlist を有効にする。
- secret をプロンプトに含めず、gateway host 上の env/config 経由で渡す。

### モデルの強さ（セキュリティ上の注意）

prompt injection への耐性は、model tier 間で **一様ではありません**。一般に、小さく安価なモデルほど、特に敵対的プロンプト下では、ツール誤用や指示乗っ取りに弱い傾向があります。

<Warning>
ツール有効 agent や信頼されていないコンテンツを読む agent では、古い/小さいモデルの prompt injection リスクはしばしば高すぎます。そのようなワークロードを弱い model tier で実行しないでください。
</Warning>

推奨事項:

- ツールを実行できる、またはファイル/ネットワークに触れられる bot には、**最新世代で最高 tier の model** を使う。
- ツール有効 agent や信頼されていない inbox には、**古い/弱い/小さい tier を使わない**。prompt injection リスクが高すぎます。
- どうしても小さい model を使う必要がある場合は、**影響半径を減らす**（読み取り専用ツール、強力な sandbox 化、最小のファイルシステムアクセス、厳格な allowlist）。
- 小さいモデルを実行する場合は、**すべてのセッションで sandbox 化を有効** にし、入力が厳密に制御されていない限り **web_search/web_fetch/browser を無効** にする。
- チャット専用の個人アシスタントで、入力が信頼されておりツールがない場合は、小さいモデルでも通常は問題ありません。

<a id="reasoning-verbose-output-in-groups"></a>

## グループでの Reasoning と詳細出力

`/reasoning`、`/verbose`、`/trace` は、公開チャネル向けではない内部 reasoning、ツール出力、または Plugin 診断情報を露出する可能性があります。グループ設定では、これらを **デバッグ専用** として扱い、明示的に必要な場合を除いて無効にしてください。

ガイダンス:

- 公開 room では `/reasoning`、`/verbose`、`/trace` を無効のままにする。
- 有効にする場合は、信頼された DM または厳密に制御された room でのみ行う。
- 詳細出力やトレース出力には、ツール引数、URL、Plugin 診断、model が見たデータが含まれる可能性があることを忘れないでください。

## 設定の強化（例）

### 0) ファイル権限

gateway host 上の config と state は非公開に保ってください。

- `~/.openclaw/openclaw.json`: `600`（ユーザーのみ読み書き）
- `~/.openclaw`: `700`（ユーザーのみ）

`openclaw doctor` は、これらの権限を警告し、厳格化を提案できます。

### 0.4) ネットワーク露出（bind + port + firewall）

Gateway は **WebSocket + HTTP** を単一ポートで多重化します。

- デフォルト: `18789`
- config/flags/env: `gateway.port`, `--port`, `OPENCLAW_GATEWAY_PORT`

この HTTP サーフェスには Control UI と canvas host が含まれます。

- Control UI（SPA アセット）（デフォルトベースパス `/`）
- Canvas host: `/__openclaw__/canvas/` と `/__openclaw__/a2ui/`（任意の HTML/JS。信頼されていないコンテンツとして扱ってください）

通常のブラウザで canvas コンテンツを読み込む場合、それは他の信頼されていない Web ページと同様に扱ってください。

- canvas host を信頼されていないネットワーク/ユーザーに公開しない。
- 影響を完全に理解していない限り、canvas コンテンツを特権 Web サーフェスと同一 origin にしない。

bind mode は、Gateway がどこで listen するかを制御します。

- `gateway.bind: "loopback"`（デフォルト）: ローカルクライアントのみ接続可能。
- non-loopback bind（`"lan"`、`"tailnet"`、`"custom"`）は攻撃面を広げます。gateway auth（shared token/password または正しく設定された non-loopback trusted proxy）と実際の firewall を伴う場合にのみ使ってください。

経験則:

- LAN bind より Tailscale Serve を優先する（Serve は Gateway を loopback のまま保ち、アクセスは Tailscale が処理する）。
- LAN に bind する必要がある場合は、port を厳密な送信元 IP allowlist に firewall してください。広く port-forward しないでください。
- `0.0.0.0` 上に未認証の Gateway を絶対に公開しないでください。

### 0.4.1) Docker のポート公開 + UFW（`DOCKER-USER`）

VPS 上で Docker により OpenClaw を実行している場合、公開されたコンテナポート（`-p HOST:CONTAINER` または Compose の `ports:`）は、ホストの `INPUT` ルールだけでなく Docker の転送チェーンを通ることを覚えておいてください。

Docker のトラフィックを firewall ポリシーと整合させるには、`DOCKER-USER` でルールを強制してください（このチェーンは Docker 自身の accept ルールより前に評価されます）。
多くの最近のディストリでは、`iptables`/`ip6tables` は `iptables-nft` フロントエンドを使っており、これらのルールは nftables バックエンドにも適用されます。

最小 allowlist 例（IPv4）:

```bash
# /etc/ufw/after.rules（独立した *filter セクションとして追記）
*filter
:DOCKER-USER - [0:0]
-A DOCKER-USER -m conntrack --ctstate ESTABLISHED,RELATED -j RETURN
-A DOCKER-USER -s 127.0.0.0/8 -j RETURN
-A DOCKER-USER -s 10.0.0.0/8 -j RETURN
-A DOCKER-USER -s 172.16.0.0/12 -j RETURN
-A DOCKER-USER -s 192.168.0.0/16 -j RETURN
-A DOCKER-USER -s 100.64.0.0/10 -j RETURN
-A DOCKER-USER -p tcp --dport 80 -j RETURN
-A DOCKER-USER -p tcp --dport 443 -j RETURN
-A DOCKER-USER -m conntrack --ctstate NEW -j DROP
-A DOCKER-USER -j RETURN
COMMIT
```

IPv6 には別のテーブルがあります。Docker IPv6 が有効なら、`/etc/ufw/after6.rules` に対応するポリシーも追加してください。

ドキュメントのスニペットで `eth0` のようなインターフェース名を固定しないでください。インターフェース名は VPS イメージによって異なり（`ens3`、`enp*` など）、不一致により deny ルールが意図せずスキップされることがあります。

再読み込み後の簡易検証:

```bash
ufw reload
iptables -S DOCKER-USER
ip6tables -S DOCKER-USER
nmap -sT -p 1-65535 <public-ip> --open
```

外部から見える想定ポートは、意図的に公開したものだけであるべきです（多くの構成では SSH + リバースプロキシのポート）。

### 0.4.2) mDNS/Bonjour discovery（情報漏えい）

Gateway は、ローカルデバイス発見のために mDNS（port 5353 上の `_openclaw-gw._tcp`）で存在をブロードキャストします。full mode では、運用上の詳細を露出しうる TXT レコードが含まれます。

- `cliPath`: CLI バイナリへの完全なファイルシステムパス（ユーザー名とインストール場所がわかる）
- `sshPort`: host 上で SSH が利用可能であることを通知する
- `displayName`, `lanHost`: hostname 情報

**運用セキュリティ上の考慮:** インフラ詳細をブロードキャストすると、ローカルネットワーク上の誰にとっても偵察が容易になります。ファイルシステムパスや SSH 可用性のような「無害」に見える情報でも、攻撃者が環境を把握する助けになります。

**推奨事項:**

1. **minimal mode**（デフォルト。公開 gateway に推奨）: 機微なフィールドを mDNS ブロードキャストから省略します。

   ```json5
   {
     discovery: {
       mdns: { mode: "minimal" },
     },
   }
   ```

2. ローカルデバイス discovery が不要なら **完全に無効化** します。

   ```json5
   {
     discovery: {
       mdns: { mode: "off" },
     },
   }
   ```

3. **full mode**（opt-in）: TXT レコードに `cliPath` + `sshPort` を含めます。

   ```json5
   {
     discovery: {
       mdns: { mode: "full" },
     },
   }
   ```

4. **環境変数**（代替手段）: config を変えずに mDNS を無効化するには `OPENCLAW_DISABLE_BONJOUR=1` を設定します。

minimal mode でも、Gateway はデバイス discovery に十分な情報（`role`、`gatewayPort`、`transport`）はブロードキャストしますが、`cliPath` と `sshPort` は省略します。CLI パス情報が必要な app は、認証済み WebSocket 接続経由で取得できます。

### 0.5) Gateway WebSocket をロックダウンする（ローカル auth）

Gateway auth は **デフォルトで必須** です。有効な gateway auth 経路が設定されていない場合、Gateway は WebSocket 接続を拒否します（fail‑closed）。

オンボーディングは、ローカルクライアントにも認証を要求するため、デフォルトで token を生成します（loopback でも同様です）。

**すべての** WS クライアントに認証を要求するには token を設定してください。

```json5
{
  gateway: {
    auth: { mode: "token", token: "your-token" },
  },
}
```

Doctor は token を生成できます: `openclaw doctor --generate-gateway-token`。

注: `gateway.remote.token` / `.password` はクライアント資格情報ソースです。これらだけではローカル WS アクセスは保護されません。
ローカル呼び出し経路は、`gateway.auth.*` が未設定の場合にのみ `gateway.remote.*` をフォールバックとして使えます。
`gateway.auth.token` / `gateway.auth.password` が SecretRef 経由で明示的に設定されていて未解決の場合、解決は closed fail します（remote フォールバックで隠されることはありません）。
任意ですが、`wss://` を使う場合は `gateway.remote.tlsFingerprint` でリモート TLS をピン留めできます。
平文の `ws://` はデフォルトで loopback 専用です。信頼されたプライベートネットワーク経路では、緊急用としてクライアントプロセスに `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` を設定してください。

ローカルデバイス pairing:

- 同一 host クライアントを円滑にするため、直接のローカル loopback 接続ではデバイス pairing は自動承認されます。
- OpenClaw には、信頼された shared-secret ヘルパーフロー向けに、狭く限定された backend/container-local self-connect 経路もあります。
- tailnet や LAN 接続は、同一 host の tailnet bind を含めて remote として扱われ、引き続き承認が必要です。

auth mode:

- `gateway.auth.mode: "token"`: shared bearer token（多くの構成で推奨）。
- `gateway.auth.mode: "password"`: password auth（env での設定を推奨: `OPENCLAW_GATEWAY_PASSWORD`）。
- `gateway.auth.mode: "trusted-proxy"`: identity-aware なリバースプロキシがユーザーを認証し、ヘッダーで ID を渡す構成を信頼する（[Trusted Proxy Auth](/ja-JP/gateway/trusted-proxy-auth) を参照）。

ローテーションチェックリスト（token/password）:

1. 新しい secret を生成/設定する（`gateway.auth.token` または `OPENCLAW_GATEWAY_PASSWORD`）。
2. Gateway を再起動する（または macOS app が Gateway を監督している場合はその app を再起動する）。
3. リモートクライアントを更新する（Gateway を呼び出すマシン上の `gateway.remote.token` / `.password`）。
4. 古い資格情報では接続できないことを確認する。

### 0.6) Tailscale Serve の ID ヘッダー

`gateway.auth.allowTailscale` が `true` の場合（Serve のデフォルト）、OpenClaw は Control UI/WebSocket 認証に Tailscale Serve の ID ヘッダー（`tailscale-user-login`）を受け入れます。OpenClaw は、`x-forwarded-for` アドレスをローカル Tailscale デーモン（`tailscale whois`）経由で解決し、その結果をヘッダーと照合して ID を検証します。これは、Tailscale により注入された `x-forwarded-for`、`x-forwarded-proto`、`x-forwarded-host` を含み、かつ loopback に到達したリクエストでのみ発動します。
この非同期 ID チェック経路では、同じ `{scope, ip}` に対する失敗試行は、リミッタが失敗を記録する前に直列化されます。そのため、1 つの Serve クライアントからの同時の不正再試行は、単なる 2 件の不一致として競合するのではなく、2 回目の試行が即座にロックアウトされることがあります。
HTTP API エンドポイント（たとえば `/v1/*`、`/tools/invoke`、`/api/channels/*`）は Tailscale の ID ヘッダー auth を **使用しません**。これらは引き続き gateway の設定済み HTTP auth mode に従います。

重要な境界に関する注意:

- Gateway HTTP bearer auth は、実質的にオールオアナッシングの運用者アクセスです。
- `/v1/chat/completions`、`/v1/responses`、または `/api/channels/*` を呼び出せる資格情報は、その gateway に対する完全アクセスの運用者 secret として扱ってください。
- OpenAI 互換 HTTP サーフェスでは、shared-secret bearer auth は、完全なデフォルト運用者スコープ（`operator.admin`、`operator.approvals`、`operator.pairing`、`operator.read`、`operator.talk.secrets`、`operator.write`）と、エージェントターン向けの owner セマンティクスを復元します。より狭い `x-openclaw-scopes` 値では、この shared-secret 経路は縮小されません。
- HTTP 上のリクエスト単位スコープセマンティクスは、trusted proxy auth やプライベート受信口上の `gateway.auth.mode="none"` のような、ID を持つモードから来たリクエストにのみ適用されます。
- そのような ID を持つモードでは、`x-openclaw-scopes` を省略すると通常の運用者デフォルトスコープ集合にフォールバックします。より狭いスコープ集合を望む場合は、明示的にそのヘッダーを送ってください。
- `/tools/invoke` も同じ shared-secret ルールに従います。そこでの token/password bearer auth も完全な運用者アクセスとして扱われ、一方で ID を持つモードでは引き続き宣言されたスコープが尊重されます。
- これらの資格情報を信頼されていない呼び出し元と共有しないでください。信頼境界ごとに別々の gateway を使うことを優先してください。

**信頼前提:** token なし Serve auth は、gateway host が信頼されていることを前提としています。これを、敵対的な同一 host プロセスに対する保護と見なさないでください。信頼されていないローカルコードが gateway host 上で実行される可能性がある場合は、`gateway.auth.allowTailscale` を無効にし、`gateway.auth.mode: "token"` または `"password"` による明示的な shared-secret auth を必須にしてください。

**セキュリティルール:** 自前のリバースプロキシからこれらのヘッダーを転送しないでください。gateway の前で TLS を終端またはプロキシする場合は、`gateway.auth.allowTailscale` を無効にし、shared-secret auth（`gateway.auth.mode: "token"` または `"password"`）か [Trusted Proxy Auth](/ja-JP/gateway/trusted-proxy-auth) を使ってください。

信頼済みプロキシ:

- Gateway の前で TLS を終端する場合は、`gateway.trustedProxies` にプロキシ IP を設定してください。
- OpenClaw は、それらの IP からの `x-forwarded-for`（または `x-real-ip`）を信頼して、ローカル pairing チェックおよび HTTP auth/ローカルチェック用のクライアント IP を判定します。
- プロキシが `x-forwarded-for` を **上書き** し、Gateway port への直接アクセスをブロックしていることを確認してください。

[Tailscale](/ja-JP/gateway/tailscale) と [Web overview](/web) を参照してください。

### 0.6.1) node host 経由の browser 制御（推奨）

Gateway が remote で、browser が別のマシンで実行される場合は、その browser マシン上で **node host** を実行し、Gateway に browser アクションを proxy させてください（[Browser tool](/ja-JP/tools/browser) を参照）。node pairing は管理者アクセスとして扱ってください。

推奨パターン:

- Gateway と node host を同じ tailnet（Tailscale）上に置く。
- node を意図的に pair し、browser proxy routing が不要なら無効にする。

避けるべきこと:

- relay/control port を LAN や公開インターネットに公開すること。
- browser control エンドポイントに Tailscale Funnel を使うこと（公開露出）。

### 0.7) ディスク上の secret（機微データ）

`~/.openclaw/`（または `$OPENCLAW_STATE_DIR/`）配下のものには secret や private data が含まれている可能性があると考えてください。

- `openclaw.json`: config には token（gateway、remote gateway）、provider 設定、allowlist が含まれる場合があります。
- `credentials/**`: チャネル資格情報（例: WhatsApp creds）、pairing allowlist、従来の OAuth インポート。
- `agents/<agentId>/agent/auth-profiles.json`: API key、token profile、OAuth token、および任意の `keyRef`/`tokenRef`。
- `secrets.json`（任意）: `file` SecretRef provider（`secrets.providers`）で使うファイルベースの secret ペイロード。
- `agents/<agentId>/agent/auth.json`: 従来互換ファイル。静的な `api_key` エントリは検出時に削除されます。
- `agents/<agentId>/sessions/**`: セッショントランスクリプト（`*.jsonl`）+ ルーティングメタデータ（`sessions.json`）。private message やツール出力を含むことがあります。
- 同梱 Plugin package: インストール済み Plugin（およびその `node_modules/`）。
- `sandboxes/**`: ツール sandbox ワークスペース。sandbox 内で読み書きしたファイルのコピーが蓄積することがあります。

強化のヒント:

- 権限を厳格に保つ（ディレクトリは `700`、ファイルは `600`）。
- gateway host ではフルディスク暗号化を使う。
- host を共有している場合は、Gateway 専用の OS ユーザーアカウントを優先する。

### 0.8) ログ + トランスクリプト（秘匿化 + 保持期間）

アクセス制御が正しくても、ログとトランスクリプトは機微情報を漏らす可能性があります。

- Gateway ログには、ツール要約、エラー、URL が含まれることがあります。
- セッショントランスクリプトには、貼り付けられた secret、ファイル内容、コマンド出力、リンクが含まれることがあります。

推奨事項:

- ツール要約の秘匿化を有効のままにする（`logging.redactSensitive: "tools"`; デフォルト）。
- 環境に合わせて `logging.redactPatterns` でカスタムパターンを追加する（token、hostname、内部 URL）。
- 診断を共有する場合は、生ログより `openclaw status --all`（貼り付けやすく、secret は秘匿化済み）を優先する。
- 長期保持が不要なら、古いセッショントランスクリプトとログファイルを削除する。

詳細: [Logging](/ja-JP/gateway/logging)

### 1) DM: デフォルトは pairing

```json5
{
  channels: { whatsapp: { dmPolicy: "pairing" } },
}
```

### 2) グループ: どこでも mention 必須

```json
{
  "channels": {
    "whatsapp": {
      "groups": {
        "*": { "requireMention": true }
      }
    }
  },
  "agents": {
    "list": [
      {
        "id": "main",
        "groupChat": { "mentionPatterns": ["@openclaw", "@mybot"] }
      }
    ]
  }
}
```

グループチャットでは、明示的に mention されたときだけ応答してください。

### 3) 番号を分ける（WhatsApp、Signal、Telegram）

電話番号ベースのチャネルでは、AI を個人用番号とは別の番号で動かすことを検討してください。

- 個人番号: 会話は非公開のまま
- bot 番号: AI が適切な境界のもとで処理

### 4) 読み取り専用モード（sandbox + ツールによる）

次の組み合わせで読み取り専用プロファイルを構築できます。

- `agents.defaults.sandbox.workspaceAccess: "ro"`（またはワークスペースアクセスなしの `"none"`）
- `write`、`edit`、`apply_patch`、`exec`、`process` などをブロックするツール allow/deny リスト

追加の強化オプション:

- `tools.exec.applyPatch.workspaceOnly: true`（デフォルト）: sandbox 化が off でも、`apply_patch` が workspace ディレクトリ外への書き込み/削除をできないようにします。workspace 外のファイルに `apply_patch` を意図的に触れさせたい場合にのみ `false` にしてください。
- `tools.fs.workspaceOnly: true`（任意）: `read`/`write`/`edit`/`apply_patch` のパスと、ネイティブプロンプト画像の自動読み込みパスを workspace ディレクトリに制限します（現在絶対パスを許可していて、単一のガードレールを追加したい場合に有用）。
- ファイルシステムルートは狭く保つ: agent workspace/sandbox workspace にホームディレクトリのような広いルートを使わないでください。広いルートは、ローカルの機微ファイル（たとえば `~/.openclaw` 配下の state/config）をファイルシステムツールにさらす可能性があります。

### 5) セキュアなベースライン（そのまま使える）

Gateway を非公開に保ち、DM に pairing を必須とし、常時待機のグループ bot を避ける「安全なデフォルト」config の一例です。

```json5
{
  gateway: {
    mode: "local",
    bind: "loopback",
    port: 18789,
    auth: { mode: "token", token: "your-long-random-token" },
  },
  channels: {
    whatsapp: {
      dmPolicy: "pairing",
      groups: { "*": { requireMention: true } },
    },
  },
}
```

ツール実行も「より安全なデフォルト」にしたい場合は、sandbox を追加し、owner 以外の agent には危険なツールを拒否してください（下の「agent 単位のアクセスプロファイル」の例を参照）。

チャット駆動のエージェントターン向けの組み込みベースライン: owner 以外の送信者は `cron` または `gateway` ツールを使えません。

## Sandboxing（推奨）

専用ドキュメント: [Sandboxing](/ja-JP/gateway/sandboxing)

補完的な 2 つのアプローチがあります。

- **Gateway 全体を Docker で実行**（コンテナ境界）: [Docker](/ja-JP/install/docker)
- **ツール sandbox**（`agents.defaults.sandbox`、host 上の gateway + sandbox 分離ツール。Docker がデフォルト backend）: [Sandboxing](/ja-JP/gateway/sandboxing)

注: agent 間アクセスを防ぐには、`agents.defaults.sandbox.scope` を `"agent"`（デフォルト）
または、より厳格なセッション単位分離として `"session"` に保ってください。`scope: "shared"` は単一の container/workspace を使います。

sandbox 内での agent workspace アクセスも検討してください。

- `agents.defaults.sandbox.workspaceAccess: "none"`（デフォルト）は agent workspace を不可視にし、ツールは `~/.openclaw/sandboxes` 配下の sandbox workspace に対して実行されます
- `agents.defaults.sandbox.workspaceAccess: "ro"` は agent workspace を `/agent` に読み取り専用でマウントします（`write`/`edit`/`apply_patch` を無効化）
- `agents.defaults.sandbox.workspaceAccess: "rw"` は agent workspace を `/workspace` に読み書き可能でマウントします
- 追加の `sandbox.docker.binds` は、正規化済みおよび正準化済みのソースパスに対して検証されます。親 symlink トリックや正準ホームエイリアスでも、`/etc`、`/var/run`、または OS ホーム配下の資格情報ディレクトリのようなブロック対象ルートに解決される場合は closed fail します。

重要: `tools.elevated` は、sandbox 外で exec を実行するグローバルなベースラインのエスケープハッチです。有効な host はデフォルトでは `gateway`、exec ターゲットが `node` に設定されている場合は `node` です。`tools.elevated.allowFrom` は厳密に保ち、見知らぬ相手に対して有効化しないでください。さらに `agents.list[].tools.elevated` により agent 単位で制限できます。[Elevated Mode](/ja-JP/tools/elevated) を参照してください。

### sub-agent 委譲のガードレール

session ツールを許可する場合、委譲された sub-agent 実行も別の境界判断として扱ってください。

- agent が本当に委譲を必要としない限り、`sessions_spawn` を拒否する。
- `agents.defaults.subagents.allowAgents` と、agent 単位の `agents.list[].subagents.allowAgents` 上書きは、既知で安全な target agent に限定する。
- sandbox 化を維持すべきワークフローでは、`sessions_spawn` を `sandbox: "require"` で呼び出す（デフォルトは `inherit`）。
- `sandbox: "require"` は、target child ランタイムが sandbox 化されていない場合に即座に失敗します。

## browser 制御のリスク

browser 制御を有効にすると、model に実際の browser を操作する能力が与えられます。
その browser プロファイルにすでにログイン済みセッションが含まれている場合、model はそれらのアカウントやデータにアクセスできます。browser プロファイルは **機微な状態** として扱ってください。

- agent 専用のプロファイル（デフォルトの `openclaw` プロファイル）を優先する。
- agent に個人用の常用プロファイルを向けない。
- sandbox 化された agent については、信頼していない限り host browser 制御を無効のままにする。
- スタンドアロンの loopback browser 制御 API は shared-secret auth（gateway token bearer auth または gateway password）のみを受け付けます。trusted-proxy や Tailscale Serve の ID ヘッダーは使用しません。
- browser のダウンロードは信頼されていない入力として扱い、分離されたダウンロードディレクトリを優先する。
- 可能なら agent プロファイルで browser sync/パスワードマネージャを無効にする（影響半径を減らす）。
- remote gateway では、「browser 制御」は、そのプロファイルが到達できるものに対する「運用者アクセス」と同等だと考える。
- Gateway と node host は tailnet 限定に保ち、browser 制御ポートを LAN や公開インターネットに公開しない。
- browser proxy routing が不要なら無効にする（`gateway.nodes.browser.mode="off"`）。
- Chrome MCP の既存セッションモードは **より安全ではありません**。その host の Chrome プロファイルで到達できる範囲で、あなたとして動作できます。

### browser SSRF ポリシー（デフォルトで厳格）

OpenClaw の browser ナビゲーションポリシーは、デフォルトで厳格です。private/internal 宛先は、明示的に opt-in しない限りブロックされたままです。

- デフォルト: `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` は未設定なので、browser ナビゲーションでは private/internal/special-use 宛先はブロックされたままです。
- 従来エイリアス: `browser.ssrfPolicy.allowPrivateNetwork` も互換性のために引き続き受け付けます。
- opt-in mode: private/internal/special-use 宛先を許可するには `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true` を設定します。
- 厳格モードでは、明示的な例外に `hostnameAllowlist`（`*.example.com` のようなパターン）と `allowedHostnames`（`localhost` のようなブロック名も含む正確な host 例外）を使います。
- リダイレクト経由のピボットを減らすため、ナビゲーションはリクエスト前にチェックされ、ナビゲーション後の最終 `http(s)` URL に対してもベストエフォートで再チェックされます。

厳格ポリシーの例:

```json5
{
  browser: {
    ssrfPolicy: {
      dangerouslyAllowPrivateNetwork: false,
      hostnameAllowlist: ["*.example.com", "example.com"],
      allowedHostnames: ["localhost"],
    },
  },
}
```

## agent 単位のアクセスプロファイル（マルチエージェント）

マルチエージェントルーティングでは、各 agent が独自の sandbox + ツールポリシーを持てます。
これを使って、agent ごとに **完全アクセス**、**読み取り専用**、**アクセスなし** を与えてください。
詳細と優先順位ルールは [Multi-Agent Sandbox & Tools](/ja-JP/tools/multi-agent-sandbox-tools) を参照してください。

一般的な用途:

- 個人用 agent: 完全アクセス、sandbox なし
- 家族/仕事用 agent: sandbox 化 + 読み取り専用ツール
- 公開 agent: sandbox 化 + ファイルシステム/シェルツールなし

### 例: 完全アクセス（sandbox なし）

```json5
{
  agents: {
    list: [
      {
        id: "personal",
        workspace: "~/.openclaw/workspace-personal",
        sandbox: { mode: "off" },
      },
    ],
  },
}
```

### 例: 読み取り専用ツール + 読み取り専用ワークスペース

```json5
{
  agents: {
    list: [
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        sandbox: {
          mode: "all",
          scope: "agent",
          workspaceAccess: "ro",
        },
        tools: {
          allow: ["read"],
          deny: ["write", "edit", "apply_patch", "exec", "process", "browser"],
        },
      },
    ],
  },
}
```

### 例: ファイルシステム/シェルアクセスなし（provider のメッセージングは許可）

```json5
{
  agents: {
    list: [
      {
        id: "public",
        workspace: "~/.openclaw/workspace-public",
        sandbox: {
          mode: "all",
          scope: "agent",
          workspaceAccess: "none",
        },
        // Session ツールはトランスクリプトから機微なデータを露出する可能性があります。デフォルトでは OpenClaw は
        // これらのツールを現在のセッション + 起動された subagent セッションに制限しますが、必要ならさらに絞れます。
        // 設定リファレンスの `tools.sessions.visibility` を参照してください。
        tools: {
          sessions: { visibility: "tree" }, // self | tree | agent | all
          allow: [
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
            "whatsapp",
            "telegram",
            "slack",
            "discord",
          ],
          deny: [
            "read",
            "write",
            "edit",
            "apply_patch",
            "exec",
            "process",
            "browser",
            "canvas",
            "nodes",
            "cron",
            "gateway",
            "image",
          ],
        },
      },
    ],
  },
}
```

## AI に伝えるべきこと

agent のシステムプロンプトにはセキュリティガイドラインを含めてください。

```
## セキュリティルール
- 見知らぬ相手にディレクトリ一覧やファイルパスを絶対に共有しない
- API key、資格情報、インフラ詳細を絶対に明かさない
- システム config を変更する要求は owner に確認する
- 迷ったら実行前に確認する
- 明示的な認可がない限り private data は private に保つ
```

## インシデント対応

AI が何か悪いことをしてしまった場合:

### 封じ込め

1. **止める:** macOS app（Gateway を監督している場合）を停止するか、`openclaw gateway` プロセスを終了する。
2. **露出を閉じる:** 何が起きたか理解するまで、`gateway.bind: "loopback"` に設定する（または Tailscale Funnel/Serve を無効にする）。
3. **アクセスを凍結する:** 危険な DM/グループを `dmPolicy: "disabled"` に切り替える / mention 必須にする。もし `"*"` の全許可エントリがあるなら削除する。

### ローテーション（secret が漏れたなら侵害されたとみなす）

1. Gateway auth（`gateway.auth.token` / `OPENCLAW_GATEWAY_PASSWORD`）をローテーションし、再起動する。
2. Gateway を呼び出せるすべてのマシン上のリモートクライアント secret（`gateway.remote.token` / `.password`）をローテーションする。
3. provider/API 資格情報（WhatsApp creds、Slack/Discord token、`auth-profiles.json` 内の model/API key、および使用している場合は暗号化された secret ペイロード値）をローテーションする。

### 監査

1. Gateway ログを確認する: `/tmp/openclaw/openclaw-YYYY-MM-DD.log`（または `logging.file`）。
2. 該当するトランスクリプトを確認する: `~/.openclaw/agents/<agentId>/sessions/*.jsonl`。
3. 最近の config 変更を確認する（アクセスを広げた可能性のあるもの: `gateway.bind`、`gateway.auth`、DM/グループポリシー、`tools.elevated`、Plugin 変更）。
4. `openclaw security audit --deep` を再実行し、critical findings が解消されたことを確認する。

### レポート用に収集するもの

- タイムスタンプ、gateway host の OS + OpenClaw バージョン
- セッショントランスクリプト + 短いログ末尾（秘匿化後）
- 攻撃者が送った内容 + agent が実行したこと
- Gateway が loopback を超えて公開されていたかどうか（LAN/Tailscale Funnel/Serve）

## シークレットスキャン（detect-secrets）

CI は `secrets` ジョブで `detect-secrets` の pre-commit hook を実行します。
`main` への push では常に全ファイルスキャンが実行されます。プルリクエストでは、base commit が利用可能な場合は変更ファイルだけの高速経路を使い、そうでない場合は全ファイルスキャンにフォールバックします。失敗した場合、まだ baseline に入っていない新しい候補があります。

### CI が失敗した場合

1. ローカルで再現する:

   ```bash
   pre-commit run --all-files detect-secrets
   ```

2. ツールを理解する:
   - pre-commit 内の `detect-secrets` は、repo の baseline と除外設定を使って `detect-secrets-hook` を実行します。
   - `detect-secrets audit` は対話型レビューを開き、baseline の各項目を実在の secret か false positive かとしてマークできます。
3. 実在する secret の場合: ローテーション/削除し、その後スキャンを再実行して baseline を更新する。
4. false positive の場合: 対話型監査を実行し、false としてマークする:

   ```bash
   detect-secrets audit .secrets.baseline
   ```

5. 新しい除外が必要な場合は、それを `.detect-secrets.cfg` に追加し、一致する `--exclude-files` / `--exclude-lines` フラグで baseline を再生成する（config ファイルは参照用のみであり、detect-secrets は自動では読み込みません）。

更新した `.secrets.baseline` が意図した状態を反映したら、それを commit してください。

## セキュリティ問題の報告

OpenClaw に脆弱性を見つけた場合は、責任ある形で報告してください。

1. メール: [security@openclaw.ai](mailto:security@openclaw.ai)
2. 修正されるまで公開投稿しない
3. ご希望であれば匿名にできますが、通常はクレジットを掲載します
