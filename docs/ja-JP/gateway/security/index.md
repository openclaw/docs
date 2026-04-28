---
read_when:
    - アクセスや自動化の範囲を広げる機能を追加する
summary: シェルアクセスを持つ AI Gateway を実行する際のセキュリティ上の考慮事項と脅威モデル
title: セキュリティ
x-i18n:
    generated_at: "2026-04-26T11:31:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 982a3164178822475c3ac3d871eb83d77c9d7cb0980ad93c781565110755e022
    source_path: gateway/security/index.md
    workflow: 15
---

<Warning>
  **パーソナルアシスタントの信頼モデル。** このガイダンスは、Gateway ごとに
  1 つの信頼された operator 境界（単一ユーザー、パーソナルアシスタントモデル）を前提としています。
  OpenClaw は、1 つの agent または gateway を複数の敵対的ユーザーが共有するような、
  hostile multi-tenant のセキュリティ境界では**ありません**。混在した信頼境界や
  敵対的ユーザー運用が必要な場合は、信頼境界を分離してください（別の gateway +
  認証情報、理想的には別の OS ユーザーまたはホスト）。
</Warning>

## まずスコープから: パーソナルアシスタントのセキュリティモデル

OpenClaw のセキュリティガイダンスは **パーソナルアシスタント** 配置を前提としています: 1 つの信頼された operator 境界に、複数の agent が存在しうる形です。

- サポートされるセキュリティ姿勢: Gateway ごとに 1 ユーザー/信頼境界（境界ごとに 1 OS ユーザー/ホスト/VPS を推奨）。
- サポートされないセキュリティ境界: 相互に信頼していない、または敵対的なユーザーが共有する 1 つの Gateway/agent。
- 敵対的ユーザーの分離が必要な場合は、信頼境界ごとに分割してください（別の Gateway + 認証情報、理想的には別の OS ユーザー/ホスト）。
- 複数の信頼していないユーザーが、ツール有効化済み agent にメッセージできる場合、それらのユーザーはその agent に委任された同じツール権限を共有しているものとして扱ってください。

このページは **そのモデル内での** ハードニングを説明します。1 つの共有 Gateway 上での hostile multi-tenant 分離を主張するものではありません。

## クイックチェック: `openclaw security audit`

参照: [Formal Verification (Security Models)](/ja-JP/security/formal-verification)

これを定期的に実行してください（特に設定変更後やネットワーク面を公開した後）:

```bash
openclaw security audit
openclaw security audit --deep
openclaw security audit --fix
openclaw security audit --json
```

`security audit --fix` は意図的に対象を絞っています: よくある open group
policy を allowlist に切り替え、`logging.redactSensitive: "tools"` を復元し、
state/config/include-file の権限を厳格化し、Windows 上では
POSIX の `chmod` ではなく Windows ACL のリセットを使います。

これは一般的な落とし穴（Gateway auth の露出、browser control の露出、昇格された allowlist、filesystem 権限、緩い exec approvals、open-channel のツール露出）を指摘します。

OpenClaw はプロダクトであると同時に実験でもあります: 最先端モデルの挙動を、実際のメッセージング面と実際のツールに接続しているからです。**「完全に安全」なセットアップはありません。** 目標は、以下を意識的に設計することです:

- 誰がボットとやり取りできるか
- ボットがどこで動作できるか
- ボットが何に触れられるか

まずは動作に必要な最小アクセスから始め、信頼が高まるにつれて広げてください。

### デプロイとホストの信頼

OpenClaw は、ホストと設定境界が信頼されていることを前提とします:

- 誰かが Gateway ホストの state/config（`~/.openclaw`、`openclaw.json` を含む）を変更できるなら、その人は信頼された operator とみなしてください。
- 1 つの Gateway を、相互に信頼していない/敵対的な複数の operator で共有して実行するのは、**推奨されるセットアップではありません**。
- 信頼が混在するチームでは、別々の Gateway で信頼境界を分離してください（少なくとも別の OS ユーザー/ホスト）。
- 推奨デフォルト: マシン/ホスト（または VPS）ごとに 1 ユーザー、そのユーザーに対して 1 Gateway、その Gateway 内に 1 つ以上の agent。
- 1 つの Gateway インスタンス内では、認証済み operator アクセスは信頼された control-plane ロールであり、ユーザーごとの tenant ロールではありません。
- セッション識別子（`sessionKey`、session ID、label）はルーティングセレクターであり、認可トークンではありません。
- 複数人が 1 つのツール有効化済み agent にメッセージできる場合、それぞれが同じ権限セットを操作できます。ユーザーごとの session/memory 分離はプライバシーには役立ちますが、共有 agent をユーザーごとのホスト認可に変えるものではありません。

### 共有 Slack workspace: 現実のリスク

「Slack の全員がボットにメッセージできる」場合、中核的なリスクは委任されたツール権限です:

- 許可された送信者は誰でも、その agent の policy の範囲内でツール呼び出し（`exec`、browser、network/file tools）を誘発できます。
- 1 人の送信者からの prompt/content injection により、共有 state、デバイス、または出力に影響するアクションが引き起こされる可能性があります。
- 1 つの共有 agent が機密認証情報/ファイルを持っている場合、許可された送信者は誰でも、ツール使用を通じてそれらを流出させる可能性があります。

チームワークフローには、最小ツールのみを持つ別 agent/Gateway を使用してください。個人データを扱う agent は非公開のままにしてください。

### 会社共有 agent: 許容できるパターン

その agent を使う全員が同じ信頼境界内にあり（たとえば同一企業チーム）、その agent が厳密に業務スコープに限定されている場合は許容できます。

- 専用のマシン/VM/container 上で実行する
- そのランタイム専用の OS ユーザー + 専用 browser/profile/accounts を使う
- そのランタイムで個人の Apple/Google アカウントや個人用パスワードマネージャー/browser profile にサインインしない

個人と会社の identity を同じランタイムに混在させると、分離が崩れ、個人データ露出リスクが高まります。

## Gateway と Node の信頼概念

Gateway と Node は、役割の異なる 1 つの operator 信頼ドメインとして扱ってください:

- **Gateway** は control plane と policy 面です（`gateway.auth`、tool policy、routing）。
- **Node** はその Gateway にペアリングされたリモート実行面です（コマンド、デバイスアクション、ホストローカル機能）。
- Gateway に認証された呼び出し元は、Gateway スコープで信頼されます。ペアリング後の Node アクションは、その Node 上での信頼された operator アクションです。
- 共有 gateway
  token/password で認証された直接 loopback backend client は、ユーザー
  device identity を提示せずに内部 control-plane RPC を呼び出せます。
  これはリモートまたは browser のペアリング回避ではありません: network
  client、node client、device-token client、明示的な device identity は、引き続き
  pairing と scope-upgrade enforcement を通過します。
- `sessionKey` はルーティング/コンテキスト選択であり、ユーザーごとの auth ではありません。
- Exec approvals（allowlist + ask）は operator 意図のガードレールであり、hostile multi-tenant 分離ではありません。
- 信頼された単一 operator セットアップに対する OpenClaw のプロダクトデフォルトでは、`gateway`/`node` 上の host exec は approval prompt なしで許可されます（`security="full"`、`ask="off"`。厳しくする場合を除く）。このデフォルトは意図的な UX であり、それ自体が脆弱性ではありません。
- Exec approvals は正確なリクエストコンテキストと、ベストエフォートな直接ローカルファイル operand を束縛しますが、すべての runtime/interpreter loader path を意味論的にモデル化するものではありません。強い境界には sandboxing とホスト分離を使ってください。

敵対的ユーザーの分離が必要なら、OS ユーザー/ホストごとに信頼境界を分け、別の Gateway を実行してください。

## 信頼境界マトリクス

リスクをトリアージする際のクイックモデルとして使ってください:

| Boundary or control                                       | What it means                                     | Common misread                                                                |
| --------------------------------------------------------- | ------------------------------------------------- | ----------------------------------------------------------------------------- |
| `gateway.auth`（token/password/trusted-proxy/device auth） | gateway API への呼び出し元を認証する              | 「安全にするには毎フレームごとの per-message signature が必要」               |
| `sessionKey`                                              | コンテキスト/セッション選択のためのルーティングキー | 「session key はユーザー auth 境界である」                                    |
| Prompt/content guardrails                                 | モデル悪用リスクを減らす                           | 「prompt injection だけで auth bypass が証明される」                          |
| `canvas.eval` / browser evaluate                          | 有効化時の意図的な operator 機能                  | 「任意の JS eval primitive はこの信頼モデルでは自動的に脆弱性になる」         |
| ローカル TUI `!` shell                                    | 明示的に operator が起動するローカル実行          | 「ローカル shell の簡易コマンドは remote injection である」                   |
| Node pairing と Node コマンド                             | ペアリング済みデバイス上での operator レベルのリモート実行 | 「リモートデバイス制御はデフォルトで信頼していないユーザーアクセスとして扱うべき」 |
| `gateway.nodes.pairing.autoApproveCidrs`                  | オプトイン式の trusted-network Node 登録 policy   | 「デフォルト無効の allowlist は自動ペアリング脆弱性である」                   |

## 設計上、脆弱性ではないもの

<Accordion title="スコープ外の一般的な報告">

以下のパターンは頻繁に報告されますが、実際の境界回避が示されない限り、
通常は対応不要としてクローズされます:

- policy、auth、sandbox bypass を伴わない、prompt injection のみのチェーン。
- 1 つの共有 host または
  config 上で hostile multi-tenant 運用を前提とした主張。
- 通常の operator 読み取りパスアクセス（たとえば
  `sessions.list` / `sessions.preview` / `chat.history`）を、
  shared-gateway セットアップで IDOR と分類する主張。
- localhost 専用デプロイに関する指摘（たとえば loopback-only
  gateway での HSTS）。
- このリポジトリに存在しない受信パスに対する Discord inbound webhook signature の指摘。
- Node pairing metadata を、`system.run` の
  隠れたコマンドごとの第二 approval 層として扱う報告。実際の実行境界は依然として
  gateway のグローバル Node コマンド policy と Node 自身の exec
  approvals です。
- 設定済みの `gateway.nodes.pairing.autoApproveCidrs` を、それ自体で
  脆弱性とみなす報告。この設定はデフォルトで無効であり、
  明示的な CIDR/IP エントリーが必要で、要求スコープのない初回 `role: node` pairing にのみ適用され、
  operator/browser/Control UI、
  WebChat、role upgrade、scope upgrade、metadata 変更、public-key 変更、
  または同一ホスト loopback trusted-proxy header path を自動承認しません。
- `sessionKey` を
  auth token とみなす「per-user authorization 欠如」の指摘。

</Accordion>

## 60 秒でできるハードニング済みベースライン

まずこのベースラインを使い、その後信頼された agent ごとに必要なツールだけを再有効化してください:

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

これにより、Gateway はローカル専用に保たれ、DM は分離され、control-plane/runtime ツールはデフォルトで無効になります。

## 共有受信箱のクイックルール

複数人がボットに DM できる場合:

- `session.dmScope: "per-channel-peer"` を設定してください（マルチアカウントチャネルなら `"per-account-channel-peer"`）。
- `dmPolicy: "pairing"` または厳格な allowlist を維持してください。
- 共有 DM と広範なツールアクセスを決して組み合わせないでください。
- これにより協調的な/共有受信箱は強化されますが、ユーザーが host/config 書き込みアクセスを共有する場合の hostile な共同テナント分離を目的に設計されたものではありません。

## コンテキスト可視性モデル

OpenClaw は 2 つの概念を分離しています:

- **トリガー認可**: 誰が agent をトリガーできるか（`dmPolicy`、`groupPolicy`、allowlist、mention gate）。
- **コンテキスト可視性**: どの補助コンテキストが model 入力に注入されるか（返信本文、引用テキスト、thread 履歴、転送 metadata）。

Allowlists はトリガーとコマンド認可を制御します。`contextVisibility` 設定は、補助コンテキスト（引用返信、thread root、取得された履歴）をどのようにフィルタリングするかを制御します:

- `contextVisibility: "all"`（デフォルト）は、補助コンテキストを受信したまま維持します。
- `contextVisibility: "allowlist"` は、補助コンテキストをアクティブな allowlist チェックで許可された送信者に限定してフィルタリングします。
- `contextVisibility: "allowlist_quote"` は `allowlist` と同様ですが、明示的に引用された 1 件の返信は保持します。

`contextVisibility` はチャネルごと、または room/conversation ごとに設定してください。セットアップの詳細は [Group Chats](/ja-JP/channels/groups#context-visibility-and-allowlists) を参照してください。

アドバイザリートリアージガイダンス:

- 「model が allowlist にない送信者からの引用または履歴テキストを見られる」ことだけを示す主張は、`contextVisibility` で対処できるハードニング指摘であり、それ自体で auth や sandbox 境界の回避ではありません。
- セキュリティ影響があるとみなされるには、報告には依然として信頼境界の回避（auth、policy、sandbox、approval、または他の文書化された境界）の実証が必要です。

## 監査が確認する内容（概要）

- **受信アクセス**（DM policy、group policy、allowlist）: 見知らぬ相手がボットをトリガーできるか?
- **ツールの blast radius**（昇格ツール + open room）: prompt injection が shell/file/network アクションに変わりうるか?
- **Exec approval drift**（`security=full`、`autoAllowSkills`、`strictInlineEval` なしの interpreter allowlist）: host-exec ガードレールは依然として意図どおりに機能しているか?
  - `security="full"` は広い姿勢に対する警告であり、バグの証拠ではありません。これは信頼されたパーソナルアシスタントセットアップ向けに選ばれたデフォルトです。脅威モデルで approval や allowlist ガードレールが必要な場合にのみ厳しくしてください。
- **ネットワーク露出**（Gateway bind/auth、Tailscale Serve/Funnel、弱い/短い auth token）。
- **ブラウザー制御の露出**（リモート Node、relay port、リモート CDP endpoint）。
- **ローカルディスク衛生**（権限、symlink、config include、「同期フォルダー」パス）。
- **Plugins**（明示的な allowlist なしで Plugin がロードされる）。
- **policy drift/misconfig**（sandbox docker 設定があるのに sandbox mode が off、`gateway.nodes.denyCommands` パターンが exact command-name のみ一致で shell text を検査しないため無効になっている、たとえば `system.run`、危険な `gateway.nodes.allowCommands` エントリー、グローバル `tools.profile="minimal"` が agent ごとの profile で上書きされている、Plugin 所有ツールが緩いツール policy の下で到達可能になっている）。
- **ランタイム期待値の drift**（たとえば `tools.exec.host` のデフォルトが `auto` になった後も暗黙の exec がまだ `sandbox` を意味すると仮定している、または sandbox mode が off なのに明示的に `tools.exec.host="sandbox"` を設定している場合）。
- **モデル衛生**（設定済みモデルが legacy に見える場合に警告。ハードブロックではありません）。

`--deep` を実行すると、OpenClaw はベストエフォートの live Gateway probe も試みます。

## 認証情報ストレージマップ

アクセス監査やバックアップ対象の判断にはこれを使ってください:

- **WhatsApp**: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Telegram bot token**: config/env または `channels.telegram.tokenFile`（通常ファイルのみ。symlink は拒否）
- **Discord bot token**: config/env または SecretRef（env/file/exec provider）
- **Slack tokens**: config/env（`channels.slack.*`）
- **Pairing allowlist**:
  - `~/.openclaw/credentials/<channel>-allowFrom.json`（デフォルト account）
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json`（非デフォルト account）
- **モデル auth profile**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **ファイルベースの secret payload（任意）**: `~/.openclaw/secrets.json`
- **Legacy OAuth import**: `~/.openclaw/credentials/oauth.json`

## セキュリティ監査チェックリスト

監査が指摘を出した場合、優先順位は次の順で扱ってください:

1. **「open」状態 + ツール有効** のもの: まず DM/group をロックダウンし（pairing/allowlist）、その後ツール policy/sandboxing を厳格化する。
2. **公開ネットワーク露出**（LAN bind、Funnel、auth なし）: 直ちに修正する。
3. **ブラウザー制御のリモート露出**: operator アクセスとして扱う（tailnet 専用、Node は意図的にペアリングし、公開露出は避ける）。
4. **権限**: state/config/credentials/auth が group/world-readable でないことを確認する。
5. **Plugins**: 明示的に信頼したものだけをロードする。
6. **モデル選択**: ツール付きボットには、最新で instruction-hardening されたモデルを優先する。

## セキュリティ監査用語集

各監査指摘は構造化された `checkId`（たとえば
`gateway.bind_no_auth` や `tools.exec.security_full_configured`）で識別されます。一般的な
critical severity クラス:

- `fs.*` — state、config、credentials、auth profile 上の filesystem 権限。
- `gateway.*` — bind mode、auth、Tailscale、Control UI、trusted-proxy セットアップ。
- `hooks.*`、`browser.*`、`sandbox.*`、`tools.exec.*` — 面ごとのハードニング。
- `plugins.*`、`skills.*` — Plugin/Skill のサプライチェーンおよびスキャン指摘。
- `security.exposure.*` — アクセス policy とツール blast radius が交わる横断的チェック。

severity level、fix key、自動修正対応を含む完全な一覧は
[Security audit checks](/ja-JP/gateway/security/audit-checks) を参照してください。

## HTTP 上の Control UI

Control UI が device
identity を生成するには **secure context**（HTTPS または localhost）が必要です。
`gateway.controlUi.allowInsecureAuth` はローカル互換性用トグルです:

- localhost 上では、ページが non-secure HTTP で
  読み込まれた場合に、device identity なしで Control UI auth を許可します。
- pairing check を回避するものではありません。
- リモート（non-localhost）の device identity 要件を緩和するものでもありません。

HTTPS（Tailscale Serve）を推奨するか、UI を `127.0.0.1` で開いてください。

緊急時専用として、`gateway.controlUi.dangerouslyDisableDeviceAuth`
は device identity チェックを完全に無効化します。これは重大なセキュリティ低下です。
積極的にデバッグしていて、すぐ元に戻せる場合を除き、無効のままにしてください。

それらの dangerous フラグとは別に、成功した `gateway.auth.mode: "trusted-proxy"`
は、device identity なしで **operator** の Control UI セッションを受け入れられます。これは
意図的な auth-mode の挙動であり、`allowInsecureAuth` の近道ではありません。また
node-role の Control UI セッションには拡張されません。

`openclaw security audit` は、この設定が有効な場合に警告します。

## insecure または dangerous フラグの概要

`openclaw security audit` は、既知の insecure/dangerous なデバッグスイッチが有効な場合、
`config.insecure_or_dangerous_flags` を出します。本番ではこれらを未設定にしてください。

<AccordionGroup>
  <Accordion title="現在監査が追跡するフラグ">
    - `gateway.controlUi.allowInsecureAuth=true`
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true`
    - `gateway.controlUi.dangerouslyDisableDeviceAuth=true`
    - `hooks.gmail.allowUnsafeExternalContent=true`
    - `hooks.mappings[<index>].allowUnsafeExternalContent=true`
    - `tools.exec.applyPatch.workspaceOnly=false`
    - `plugins.entries.acpx.config.permissionMode=approve-all`

  </Accordion>

  <Accordion title="設定スキーマ内のすべての `dangerous*` / `dangerously*` キー">
    Control UI と browser:

    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback`
    - `gateway.controlUi.dangerouslyDisableDeviceAuth`
    - `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`

    チャネル名マッチング（バンドル済みおよび Plugin チャネル。該当する場合は
    `accounts.<accountId>` ごとにも利用可能）:

    - `channels.discord.dangerouslyAllowNameMatching`
    - `channels.slack.dangerouslyAllowNameMatching`
    - `channels.googlechat.dangerouslyAllowNameMatching`
    - `channels.msteams.dangerouslyAllowNameMatching`
    - `channels.synology-chat.dangerouslyAllowNameMatching`（Plugin channel）
    - `channels.synology-chat.dangerouslyAllowInheritedWebhookPath`（Plugin channel）
    - `channels.zalouser.dangerouslyAllowNameMatching`（Plugin channel）
    - `channels.irc.dangerouslyAllowNameMatching`（Plugin channel）
    - `channels.mattermost.dangerouslyAllowNameMatching`（Plugin channel）

    ネットワーク露出:

    - `channels.telegram.network.dangerouslyAllowPrivateNetwork`（account ごとにも設定可能）

    sandbox Docker（defaults + agent ごと）:

    - `agents.defaults.sandbox.docker.dangerouslyAllowReservedContainerTargets`
    - `agents.defaults.sandbox.docker.dangerouslyAllowExternalBindSources`
    - `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin`

  </Accordion>
</AccordionGroup>

## リバースプロキシ設定

Gateway をリバースプロキシ（nginx、Caddy、Traefik など）の背後で動かす場合は、
forwarded-client IP を正しく扱うために `gateway.trustedProxies` を設定してください。

Gateway が、`trustedProxies` に**含まれていない**アドレスからの proxy header を検出した場合、
その接続をローカルクライアントとして**扱いません**。gateway auth が無効なら、
その接続は拒否されます。これにより、本来は localhost から来たように見えて
自動的に信頼されてしまう proxied 接続による認証回避を防ぎます。

`gateway.trustedProxies` は `gateway.auth.mode: "trusted-proxy"` にも使われますが、
その auth mode はさらに厳格です:

- trusted-proxy auth は **loopback-source proxy では fail closed** します
- 同一ホスト上の loopback reverse proxy は、ローカルクライアント判定と forwarded IP 処理のために `gateway.trustedProxies` を引き続き使用できます
- 同一ホスト上の loopback reverse proxy では、`gateway.auth.mode: "trusted-proxy"` ではなく token/password auth を使用してください

```yaml
gateway:
  trustedProxies:
    - "10.0.0.1" # reverse proxy IP
  # 任意。デフォルト false。
  # プロキシが X-Forwarded-For を提供できない場合にのみ有効化してください。
  allowRealIpFallback: false
  auth:
    mode: password
    password: ${OPENCLAW_GATEWAY_PASSWORD}
```

`trustedProxies` が設定されると、Gateway はクライアント IP 判定に `X-Forwarded-For` を使用します。`X-Real-IP` は、`gateway.allowRealIpFallback: true` が明示的に設定されない限り、デフォルトでは無視されます。

Trusted proxy header によって Node device pairing が自動的に信頼されることはありません。
`gateway.nodes.pairing.autoApproveCidrs` は別の、デフォルト無効の
operator policy です。有効化されていても、loopback-source trusted-proxy header path は
ローカル呼び出し元がそれらの header を偽装できるため、Node 自動承認から除外されます。

望ましい reverse proxy の挙動（受信 forwarding header を上書きする）:

```nginx
proxy_set_header X-Forwarded-For $remote_addr;
proxy_set_header X-Real-IP $remote_addr;
```

望ましくない reverse proxy の挙動（信頼できない forwarding header を追加/保持する）:

```nginx
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
```

## HSTS と origin に関する注意

- OpenClaw Gateway は local/loopback 優先です。リバースプロキシで TLS を終端する場合は、そちらのプロキシ側 HTTPS ドメインで HSTS を設定してください。
- Gateway 自身が HTTPS を終端する場合は、`gateway.http.securityHeaders.strictTransportSecurity` を設定して、OpenClaw のレスポンスから HSTS ヘッダーを出せます。
- 詳細なデプロイガイダンスは [Trusted Proxy Auth](/ja-JP/gateway/trusted-proxy-auth#tls-termination-and-hsts) にあります。
- non-loopback の Control UI デプロイでは、デフォルトで `gateway.controlUi.allowedOrigins` が必要です。
- `gateway.controlUi.allowedOrigins: ["*"]` は、強化されたデフォルトではなく、明示的な全 browser-origin 許可 policy です。厳密に制御されたローカルテスト以外では避けてください。
- 一般的な loopback 免除が有効でも、loopback 上の browser-origin auth failure には引き続き rate limit がかかりますが、lockout key は 1 つの共有 localhost バケットではなく、正規化された `Origin` 値ごとにスコープされます。
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` は Host-header origin fallback mode を有効にします。これは operator が選択した危険な policy として扱ってください。
- DNS rebinding と proxy-host header の挙動は、デプロイハードニング上の懸念として扱ってください。`trustedProxies` は厳格に保ち、Gateway を直接 public internet に露出しないでください。

## ローカルセッションログはディスク上に保存される

OpenClaw はセッショントランスクリプトを `~/.openclaw/agents/<agentId>/sessions/*.jsonl` にディスク保存します。
これはセッション継続性と（任意で）セッションメモリインデックスに必要ですが、同時に
**filesystem アクセスを持つ任意のプロセス/ユーザーがそのログを読める**ことも意味します。ディスクアクセスを信頼
境界として扱い、`~/.openclaw` の権限を厳格化してください（以下の監査セクションを参照）。agent 間で
より強い分離が必要な場合は、別々の OS ユーザーまたは別々のホストで実行してください。

## Node 実行（system.run）

macOS Node がペアリングされている場合、Gateway はその Node 上で `system.run` を呼び出せます。これは Mac 上での **リモートコード実行** です:

- Node pairing（承認 + token）が必要です。
- Gateway の Node pairing はコマンドごとの approval 面ではありません。これは Node identity/trust と token 発行を確立します。
- Gateway は `gateway.nodes.allowCommands` / `denyCommands` によって、大まかなグローバル Node コマンド policy を適用します。
- Mac 側では **Settings → Exec approvals**（security + ask + allowlist）で制御されます。
- Node ごとの `system.run` policy は、その Node 自身の exec approvals ファイル（`exec.approvals.node.*`）であり、Gateway のグローバル command-ID policy より厳しいことも、緩いこともあります。
- `security="full"` と `ask="off"` で動作している Node は、デフォルトの trusted-operator モデルに従っています。デプロイでより厳しい approval または allowlist 姿勢が明示的に必要とされていない限り、これは想定された挙動として扱ってください。
- Approval mode は、正確なリクエストコンテキストと、可能な場合は 1 つの具体的なローカル script/file operand を束縛します。OpenClaw が interpreter/runtime コマンドに対して、ちょうど 1 つの直接ローカルファイルを正確に特定できない場合、approval ベースの実行は、完全な意味的カバレッジを約束する代わりに拒否されます。
- `host=node` では、approval ベースの実行は正規化された準備済み
  `systemRunPlan` も保存します。その後の承認済み転送ではその保存済みプランを再利用し、
  Gateway の検証は approval リクエスト作成後の command/cwd/session コンテキストに対する呼び出し元編集を拒否します。
- リモート実行を望まない場合は、security を **deny** に設定し、その Mac の Node pairing を削除してください。

この区別はトリアージで重要です:

- 異なる command list を広告しながら再接続するペアリング済み Node は、それだけで脆弱性ではありません。Gateway のグローバル policy と Node のローカル exec approvals が実際の実行境界を引き続き強制している限り問題ありません。
- Node pairing metadata を、隠れた第二のコマンドごとの approval 層として扱う報告は、通常は policy/UX の混乱であり、セキュリティ境界の回避ではありません。

## 動的 Skills（watcher / リモート Node）

OpenClaw はセッション途中で Skills 一覧を更新できます:

- **Skills watcher**: `SKILL.md` の変更により、次のエージェントターンで Skills スナップショットが更新されることがあります。
- **リモート Node**: macOS Node が接続されると、macOS 専用 Skills が有効になる場合があります（bin probing に基づく）。

Skill フォルダーは **信頼されたコード** として扱い、変更できる人を制限してください。

## 脅威モデル

あなたの AI アシスタントは次のことができます:

- 任意のシェルコマンドを実行する
- ファイルを読み書きする
- ネットワークサービスにアクセスする
- 誰にでもメッセージを送る（WhatsApp アクセスを与えた場合）

あなたにメッセージできる人は次のことができます:

- AI をだまして悪いことをさせようとする
- あなたのデータへのアクセスをソーシャルエンジニアリングする
- インフラの詳細を探ろうとする

## 中核概念: 知能の前にアクセス制御

ここでの失敗の多くは高度なエクスプロイトではありません — 「誰かがボットにメッセージし、ボットが頼まれたことをやった」というものです。

OpenClaw の立場:

- **まず identity:** 誰がボットと話せるかを決める（DM pairing / allowlist / 明示的な「open」）。
- **次に scope:** ボットがどこで動作できるかを決める（group allowlist + mention gating、tools、sandboxing、device permissions）。
- **最後に model:** model は操作されうると仮定し、その操作の blast radius が限定されるように設計する。

## コマンド認可モデル

Slash command と directive は、**認可された送信者** に対してのみ有効です。認可は
チャネル allowlist/pairing と `commands.useAccessGroups` から導出されます（[Configuration](/ja-JP/gateway/configuration)
および [Slash commands](/ja-JP/tools/slash-commands) を参照）。チャネル allowlist が空、または `"*"` を含む場合、
そのチャネルでは command は実質的に open です。

`/exec` は認可済み operator 向けのセッション専用 convenience です。これは config を書き換えたり、
他の session を変更したりはしません。

## コントロールプレーンツールのリスク

永続的な control-plane 変更を行える組み込みツールが 2 つあります:

- `gateway` は `config.schema.lookup` / `config.get` で config を検査でき、`config.apply`、`config.patch`、`update.run` で永続変更も行えます。
- `cron` は、元の chat/task が終わった後も実行し続けるスケジュールジョブを作成できます。

owner-only の `gateway` runtime tool は、依然として
`tools.exec.ask` または `tools.exec.security` の書き換えを拒否します。legacy の `tools.bash.*` alias は、
書き込み前に同じ保護された exec パスへ正規化されます。
agent 駆動の `gateway config.apply` および `gateway config.patch` 編集は、
デフォルトで fail closed です: agent が調整できるのは、prompt、model、mention-gating の
ごく狭いパスのみです。そのため、新しい機密 config tree は
allowlist に意図的に追加されない限り保護されます。

信頼できないコンテンツを扱う agent/面では、デフォルトでこれらを deny してください:

```json5
{
  tools: {
    deny: ["gateway", "cron", "sessions_spawn", "sessions_send"],
  },
}
```

`commands.restart=false` は restart アクションのみをブロックします。`gateway` の config/update アクションは無効化しません。

## Plugins

Plugin は Gateway **と同一プロセス内** で動作します。信頼されたコードとして扱ってください:

- 信頼するソースからの Plugin だけをインストールしてください。
- 明示的な `plugins.allow` allowlist を推奨します。
- 有効化前に Plugin 設定を確認してください。
- Plugin 変更後は Gateway を再起動してください。
- Plugin をインストールまたは更新する場合（`openclaw plugins install <package>`、`openclaw plugins update <id>`）、これは信頼できないコードを実行するのと同じように扱ってください:
  - インストール先は、アクティブな Plugin install root 配下の Plugin ごとのディレクトリです。
  - OpenClaw は install/update 前に組み込みの dangerous-code scan を実行します。`critical` 指摘はデフォルトでブロックされます。
  - OpenClaw は `npm pack` を使い、その後そのディレクトリ内で project-local の `npm install --omit=dev --ignore-scripts` を実行します。継承されたグローバル npm install 設定は無視され、依存関係は Plugin install path 配下に留まります。
  - 固定された正確なバージョン（`@scope/pkg@1.2.3`）を推奨し、有効化前にディスク上へ展開されたコードを確認してください。
  - `--dangerously-force-unsafe-install` は、Plugin install/update フローで組み込み scan の false positive が出た場合にのみ使う緊急用です。Plugin の `before_install` hook policy block も、scan failure も回避しません。
  - Gateway を使う Skill 依存関係 install も同じ dangerous/suspicious 分岐に従います: 組み込み `critical` 指摘は、呼び出し元が明示的に `dangerouslyForceUnsafeInstall` を設定しない限りブロックされ、一方 suspicious 指摘は引き続き警告のみです。`openclaw skills install` は、ClawHub の Skill download/install 用の別フローのままです。

詳細: [Plugins](/ja-JP/tools/plugin)

## DM アクセスモデル: pairing、allowlist、open、disabled

現在の DM 対応チャネルはすべて、メッセージを処理する **前に** 受信 DM を制御する DM policy（`dmPolicy` または `*.dm.policy`）をサポートしています:

- `pairing`（デフォルト）: 未知の送信者には短い pairing code が送られ、承認されるまでそのメッセージは無視されます。code は 1 時間で期限切れになります。繰り返し DM しても、新しいリクエストが作成されるまでは code は再送されません。保留中リクエストの上限はデフォルトで **チャネルごとに 3 件** です。
- `allowlist`: 未知の送信者はブロックされます（pairing handshake なし）。
- `open`: 誰でも DM 可能にします（公開）。チャネル allowlist に `"*"` を含めることが **必須** です（明示的オプトイン）。
- `disabled`: 受信 DM を完全に無視します。

CLI で承認するには:

```bash
openclaw pairing list <channel>
openclaw pairing approve <channel> <code>
```

詳細とディスク上のファイル: [Pairing](/ja-JP/channels/pairing)

## DM セッション分離（マルチユーザーモード）

デフォルトでは、OpenClaw は **すべての DM をメインセッションにルーティング** するため、あなたのアシスタントはデバイスやチャネルをまたいで継続性を持ちます。**複数人** がボットに DM できる場合（open DM または複数人 allowlist）は、DM セッション分離を検討してください:

```json5
{
  session: { dmScope: "per-channel-peer" },
}
```

これにより、group chat を分離したまま、ユーザー間のコンテキスト漏洩を防げます。

これはメッセージングコンテキストの境界であり、ホスト管理境界ではありません。ユーザー同士が相互に敵対的で、同じ Gateway host/config を共有している場合は、信頼境界ごとに別々の Gateway を実行してください。

### セキュア DM モード（推奨）

上記のスニペットを **セキュア DM モード** として扱ってください:

- デフォルト: `session.dmScope: "main"`（すべての DM が 1 つのセッションを共有して継続性を保つ）。
- ローカル CLI オンボーディングのデフォルト: 未設定時に `session.dmScope: "per-channel-peer"` を書き込みます（既存の明示設定は維持）。
- セキュア DM モード: `session.dmScope: "per-channel-peer"`（各チャネル+送信者ペアが分離された DM コンテキストを持つ）。
- チャネル横断の peer 分離: `session.dmScope: "per-peer"`（各送信者が同じ種類のすべてのチャネルで 1 つのセッションを持つ）。

同じチャネルで複数の account を運用している場合は、代わりに `per-account-channel-peer` を使ってください。同じ人が複数のチャネルから連絡してくる場合は、`session.identityLinks` を使ってそれらの DM セッションを 1 つの正規 identity に統合してください。詳細は [Session Management](/ja-JP/concepts/session) と [Configuration](/ja-JP/gateway/configuration) を参照してください。

## DM と group の allowlist

OpenClaw には「誰が自分をトリガーできるか?」に関する 2 つの別レイヤーがあります:

- **DM allowlist**（`allowFrom` / `channels.discord.allowFrom` / `channels.slack.allowFrom`; legacy: `channels.discord.dm.allowFrom`、`channels.slack.dm.allowFrom`）: ダイレクトメッセージで誰がボットと話せるか。
  - `dmPolicy="pairing"` の場合、承認は `~/.openclaw/credentials/` 配下の account スコープ pairing allowlist store に書き込まれます（デフォルト account は `<channel>-allowFrom.json`、非デフォルト account は `<channel>-<accountId>-allowFrom.json`）。これが config allowlist とマージされます。
- **Group allowlist**（チャネル固有）: どの group/channel/guild からのメッセージをボットが受け付けるか。
  - 一般的なパターン:
    - `channels.whatsapp.groups`、`channels.telegram.groups`、`channels.imessage.groups`: `requireMention` のような group ごとのデフォルト。設定すると group allowlist としても機能します（全許可動作を維持するには `"*"` を含めます）。
    - `groupPolicy="allowlist"` + `groupAllowFrom`: group session の _内部で_ 誰がボットをトリガーできるかを制限します（WhatsApp/Telegram/Signal/iMessage/Microsoft Teams）。
    - `channels.discord.guilds` / `channels.slack.channels`: 面ごとの allowlist + mention デフォルト。
  - Group チェックは次の順序で実行されます: まず `groupPolicy`/group allowlist、次に mention/reply activation。
  - ボットメッセージへの返信（暗黙の mention）は、`groupAllowFrom` のような送信者 allowlist を回避しません。
  - **セキュリティ上の注意:** `dmPolicy="open"` と `groupPolicy="open"` は最後の手段として扱ってください。ほとんど使うべきではありません。room の全員を完全に信頼している場合を除き、pairing + allowlist を優先してください。

詳細: [Configuration](/ja-JP/gateway/configuration) および [Groups](/ja-JP/channels/groups)

## Prompt injection（それが何か、なぜ重要か）

Prompt injection とは、攻撃者が model を操作して危険なことをさせるメッセージを作ることです（「指示を無視しろ」「filesystem をダンプしろ」「このリンクをたどってコマンドを実行しろ」など）。

強力な system prompt があっても、**prompt injection は未解決** です。System prompt のガードレールはソフトなガイダンスにすぎません。ハードな強制は tool policy、exec approvals、sandboxing、channel allowlist から来ます（そして operator は設計上これらを無効化できます）。実際に役立つのは:

- 受信 DM はロックダウンしたままにする（pairing/allowlist）。
- group では mention gating を優先し、公開 room での「常時稼働」ボットは避ける。
- リンク、添付ファイル、貼り付けられた指示はデフォルトで敵対的なものとして扱う。
- 機密性の高いツール実行は sandbox 内で行い、secret は agent が到達可能な filesystem から外しておく。
- 注意: sandboxing はオプトインです。sandbox mode が off の場合、暗黙の `host=auto` は gateway host に解決されます。明示的な `host=sandbox` は、利用可能な sandbox runtime がないため引き続き fail closed します。その挙動を設定で明示したい場合は `host=gateway` を設定してください。
- 高リスクツール（`exec`、`browser`、`web_fetch`、`web_search`）は、信頼された agent または明示的な allowlist に制限する。
- interpreter（`python`、`node`、`ruby`、`perl`、`php`、`lua`、`osascript`）を allowlist 化する場合は、インライン eval 形式にも明示的 approval が必要になるよう `tools.exec.strictInlineEval` を有効にする。
- Shell approval 解析は、**引用されていない heredoc** 内の POSIX parameter-expansion 形式（`$VAR`、`$?`、`$$`、`$1`、`$@`、`${…}`）も拒否します。これにより、allowlist 化された heredoc 本文が plain text を装って shell expansion を allowlist 審査の外へ持ち込むことを防ぎます。リテラル本文の意味論を選ぶには、heredoc terminator を引用してください（例: `<<'EOF'`）。変数展開が起きる未引用 heredoc は拒否されます。
- **モデル選択は重要です:** 古い/小さい/legacy モデルは、prompt injection やツール誤用に対して著しく堅牢性が低いです。ツール有効化済み agent には、利用可能な中で最も強力な最新世代の instruction-hardening 済みモデルを使ってください。

信頼しないものとして扱うべき危険信号:

- 「このファイル/URL を読んで、その指示どおりに実行して」
- 「system prompt や安全ルールを無視して」
- 「隠れた指示や tool output を明かして」
- 「`~/.openclaw` やログの中身を全部貼り付けて」

## 外部コンテンツの special-token サニタイズ

OpenClaw は、モデルに到達する前に、ラップされた外部コンテンツと metadata から、セルフホスト LLM の chat-template でよく使われる special-token リテラルを除去します。対象となる marker ファミリーには、Qwen/ChatML、Llama、Gemma、Mistral、Phi、GPT-OSS の role/turn token が含まれます。

理由:

- セルフホストモデルの前段にある OpenAI-compatible backend では、ユーザーテキスト中に現れる special token をマスクせず保持してしまうことがあります。受信外部コンテンツ（取得したページ、メール本文、ファイル内容ツールの出力）に書き込める攻撃者が、そうした token を使って合成の `assistant` や `system` の role boundary を注入し、wrapped-content guardrail を抜ける可能性があります。
- サニタイズは外部コンテンツの wrapping 層で行われるため、プロバイダーごとではなく、fetch/read ツールや受信チャネルコンテンツ全体に一様に適用されます。
- 送信されるモデル応答には、ユーザー可視の返信から漏れた `<tool_call>`、`<function_calls>`、および類似の scaffold を除去する別の sanitizer がすでにあります。外部コンテンツ sanitizer はその受信側対応です。

これは、このページの他のハードニングに取って代わるものではありません。`dmPolicy`、allowlist、exec approvals、sandboxing、`contextVisibility` が依然として主要な役割を果たします。これは、special token をそのまま含むユーザーテキストを転送するセルフホストスタックに対する、特定の tokenizer 層の回避を塞ぐものです。

## 安全でない外部コンテンツのバイパスフラグ

OpenClaw には、外部コンテンツの安全ラッピングを無効化する明示的なバイパスフラグがあります:

- `hooks.mappings[].allowUnsafeExternalContent`
- `hooks.gmail.allowUnsafeExternalContent`
- Cron payload フィールド `allowUnsafeExternalContent`

ガイダンス:

- 本番ではこれらを未設定/false に保ってください。
- 厳密に限定したデバッグ時にのみ一時的に有効化してください。
- 有効化する場合は、その agent を分離してください（sandbox + 最小ツール + 専用 session namespace）。

Hooks のリスクに関する注意:

- Hook payload は、配信元が管理下のシステムであっても信頼できないコンテンツです（mail/docs/web コンテンツは prompt injection を含みえます）。
- 弱いモデル階層はこのリスクを高めます。hook 駆動の自動化では、強力な最新モデル階層を優先し、ツール policy は厳密に保ってください（`tools.profile: "messaging"` またはそれ以上に厳しいもの）。可能なら sandboxing も使ってください。

### Prompt injection は公開 DM を必要としない

たとえ **あなただけ** がボットにメッセージできる場合でも、prompt injection は依然として
ボットが読む **信頼できないコンテンツ**（web search/fetch 結果、browser page、
email、docs、attachments、貼り付けられたログ/コード）経由で起こりえます。つまり、送信者だけが
脅威面なのではなく、**コンテンツそのもの** が敵対的指示を運びうるということです。

ツールが有効な場合、典型的なリスクはコンテキストの流出やツール呼び出しの誘発です。blast radius を減らすには:

- 信頼できないコンテンツを要約するために、読み取り専用またはツール無効の **reader agent** を使い、
  その要約をメイン agent に渡す。
- 必要ない限り、ツール有効化済み agent では `web_search` / `web_fetch` / `browser` を無効にしておく。
- OpenResponses の URL 入力（`input_file` / `input_image`）では、
  `gateway.http.endpoints.responses.files.urlAllowlist` と
  `gateway.http.endpoints.responses.images.urlAllowlist` を厳密に設定し、
  `maxUrlParts` は低く保ってください。
  空の allowlist は未設定として扱われます。URL 取得を完全に無効にしたい場合は `files.allowUrl: false` / `images.allowUrl: false`
  を使ってください。
- OpenResponses の file 入力では、デコードされた `input_file` テキストも依然として
  **信頼できない外部コンテンツ** として注入されます。Gateway がローカルでデコードしたからといって、
  file テキストを信頼してはいけません。注入ブロックには引き続き明示的な
  `<<<EXTERNAL_UNTRUSTED_CONTENT ...>>>` 境界 marker と `Source: External`
  metadata が付与されます。ただし、この経路では長い `SECURITY NOTICE:` バナーは省略されます。
- 添付ドキュメントから media-understanding がテキストを抽出し、そのテキストを media prompt に追加する場合にも、同じ marker ベースの wrapping が適用されます。
- 信頼できない入力に触れる agent には sandboxing と厳密なツール allowlist を有効にする。
- secret を prompt に含めない。代わりに gateway host 上の env/config 経由で渡す。

### セルフホスト LLM バックエンド

vLLM、SGLang、TGI、LM Studio、
またはカスタム Hugging Face tokenizer stack のような OpenAI-compatible なセルフホスト backend は、
chat-template special token の扱いにおいて hosted provider と異なる場合があります。backend が
`<|im_start|>`、`<|start_header_id|>`、`<start_of_turn>` のようなリテラル文字列を、
ユーザーコンテンツ内で構造的な chat-template token として token 化する場合、
信頼できないテキストが tokenizer 層で role boundary を偽装しようとする可能性があります。

OpenClaw は、モデルへ送る前に、ラップされた
外部コンテンツから一般的なモデルファミリーの special-token リテラルを除去します。外部コンテンツ
wrapping は有効のままにし、利用可能であれば、ユーザー提供コンテンツ中の special
token を分割またはエスケープする backend 設定を優先してください。OpenAI
や Anthropic のような hosted provider は、すでにリクエスト側で独自のサニタイズを適用しています。

### モデルの強さ（セキュリティ注記）

Prompt injection 耐性はモデル階層全体で**均一ではありません**。小さく安価なモデルほど、特に敵対的な prompt に対して、ツール誤用や命令乗っ取りに弱い傾向があります。

<Warning>
ツール有効化済み agent や信頼できないコンテンツを読む agent では、古い/小さいモデルでの prompt-injection リスクは高すぎることがよくあります。そうしたワークロードを弱いモデル階層で実行してはいけません。
</Warning>

推奨事項:

- ツールを実行できる、または file/network に触れられるボットには、**最新世代の最高階層モデル** を使ってください。
- ツール有効化済み agent や信頼できない受信箱には、**古い/弱い/小さい階層を使わないでください**。prompt-injection リスクが高すぎます。
- やむを得ず小さいモデルを使う場合は、**blast radius を縮小してください**（読み取り専用ツール、強力な sandboxing、最小の filesystem アクセス、厳格な allowlist）。
- 小さいモデルを動かす場合は、**すべてのセッションで sandboxing を有効化** し、入力が厳密に制御されていない限り **web_search/web_fetch/browser を無効化** してください。
- 信頼された入力のみでツールなしの chat-only パーソナルアシスタントなら、小さいモデルでも通常は問題ありません。

## Group での reasoning と verbose 出力

`/reasoning`、`/verbose`、`/trace` は、内部 reasoning、tool
output、または plugin diagnostics のうち、
公開チャネル向けではないものを露出する可能性があります。group 設定では、これらは **デバッグ専用**
として扱い、明示的に必要でない限り無効のままにしてください。

ガイダンス:

- 公開 room では `/reasoning`、`/verbose`、`/trace` を無効のままにする。
- 有効化する場合は、信頼された DM または厳密に制御された room に限る。
- 覚えておいてください: verbose と trace 出力には、tool 引数、URL、plugin diagnostics、model が見たデータが含まれる場合があります。

## 設定ハードニングの例

### ファイル権限

Gateway host 上では config + state を非公開に保ってください:

- `~/.openclaw/openclaw.json`: `600`（ユーザーの読み書きのみ）
- `~/.openclaw`: `700`（ユーザーのみ）

`openclaw doctor` はこれらの権限を警告し、厳格化を提案できます。

### ネットワーク露出（bind、port、firewall）

Gateway は **WebSocket + HTTP** を単一ポートで多重化します:

- デフォルト: `18789`
- config/flags/env: `gateway.port`、`--port`、`OPENCLAW_GATEWAY_PORT`

この HTTP 面には Control UI と canvas host が含まれます:

- Control UI（SPA asset）（デフォルト base path `/`）
- Canvas host: `/__openclaw__/canvas/` と `/__openclaw__/a2ui/`（任意の HTML/JS。信頼できないコンテンツとして扱ってください）

通常の browser で canvas コンテンツを読み込む場合は、他の信頼できない web page と同様に扱ってください:

- 信頼できないネットワーク/ユーザーに canvas host を公開しない。
- implications を完全に理解していない限り、canvas コンテンツを特権 web 面と同一 origin にしない。

Bind mode は Gateway がどこで listen するかを制御します:

- `gateway.bind: "loopback"`（デフォルト）: ローカル client のみ接続可能。
- non-loopback bind（`"lan"`、`"tailnet"`、`"custom"`）は攻撃面を広げます。使うのは gateway auth（共有 token/password または正しく設定された non-loopback trusted proxy）と実際の firewall を併用する場合に限ってください。

経験則:

- LAN bind より Tailscale Serve を優先する（Serve は Gateway を loopback 上に保ち、アクセスは Tailscale が処理します）。
- LAN に bind しなければならない場合は、そのポートを厳格な送信元 IP allowlist で firewall してください。広く port-forward しないでください。
- `0.0.0.0` 上で認証なしの Gateway を決して公開しないでください。

### Docker のポート公開と UFW

VPS 上で Docker を使って OpenClaw を実行する場合、公開されたコンテナポート
（`-p HOST:CONTAINER` または Compose の `ports:`）は、ホストの `INPUT` ルールだけではなく
Docker の転送チェーンを通ることを覚えておいてください。

Docker トラフィックを firewall policy と揃えるには、
`DOCKER-USER` でルールを強制してください（このチェーンは Docker 自身の accept ルールより前に評価されます）。
多くの最近のディストリでは、`iptables`/`ip6tables` は `iptables-nft` frontend を使っており、
これらのルールは引き続き nftables backend に適用されます。

最小 allowlist の例（IPv4）:

```bash
# /etc/ufw/after.rules（独自の *filter セクションとして追記）
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

IPv6 には別のテーブルがあります。Docker IPv6 が有効なら、
`/etc/ufw/after6.rules` に対応する policy を追加してください。

ドキュメントのスニペットで `eth0` のような interface 名をハードコードしないでください。interface 名は
VPS イメージごとに異なり（`ens3`、`enp*` など）、不一致により deny ルールが
意図せずスキップされることがあります。

再読み込み後の簡易検証:

```bash
ufw reload
iptables -S DOCKER-USER
ip6tables -S DOCKER-USER
nmap -sT -p 1-65535 <public-ip> --open
```

意図した外部ポートだけが開いているのが期待される結果です（多くの
セットアップでは SSH + reverse proxy のポートのみ）。

### mDNS/Bonjour discovery

Gateway は、ローカルデバイス discovery 用に mDNS（ポート 5353 の `_openclaw-gw._tcp`）で自身の存在をブロードキャストします。full mode では、これに運用上の詳細を露出しうる TXT record が含まれる場合があります:

- `cliPath`: CLI バイナリの完全な filesystem path（ユーザー名とインストール場所を明かす）
- `sshPort`: ホスト上の SSH 可用性を広告する
- `displayName`、`lanHost`: hostname 情報

**運用上のセキュリティ上の考慮事項:** インフラの詳細をブロードキャストすると、ローカルネットワーク上の誰にとっても偵察が容易になります。filesystem path や SSH の可用性のような「無害そうな」情報でさえ、攻撃者があなたの環境を把握する助けになります。

**推奨事項:**

1. **Minimal mode**（デフォルト。公開される Gateway に推奨）: mDNS ブロードキャストから機微なフィールドを省きます:

   ```json5
   {
     discovery: {
       mdns: { mode: "minimal" },
     },
   }
   ```

2. ローカルデバイス discovery が不要なら **完全に無効化** します:

   ```json5
   {
     discovery: {
       mdns: { mode: "off" },
     },
   }
   ```

3. **Full mode**（オプトイン）: TXT record に `cliPath` + `sshPort` を含めます:

   ```json5
   {
     discovery: {
       mdns: { mode: "full" },
     },
   }
   ```

4. **環境変数**（代替手段）: 設定変更なしで mDNS を無効化するには `OPENCLAW_DISABLE_BONJOUR=1` を設定します。

minimal mode では、Gateway はデバイス discovery に必要な情報（`role`、`gatewayPort`、`transport`）は引き続きブロードキャストしますが、`cliPath` と `sshPort` は省略します。CLI path 情報が必要なアプリは、代わりに認証済み WebSocket 接続経由で取得できます。

### Gateway WebSocket をロックダウンする（ローカル auth）

Gateway auth はデフォルトで **必須** です。有効な gateway auth パスが設定されていない場合、
Gateway は WebSocket 接続を拒否します（fail‑closed）。

オンボーディングでは、ローカル client でも
認証が必要になるよう、デフォルトで token が生成されます。

**すべての** WS client に認証を要求するには token を設定します:

```json5
{
  gateway: {
    auth: { mode: "token", token: "your-token" },
  },
}
```

doctor に生成させることもできます: `openclaw doctor --generate-gateway-token`。

注意: `gateway.remote.token` / `.password` は client 側の認証情報ソースです。これら
自体ではローカル WS アクセスを保護しません。
ローカル call パスで `gateway.remote.*` をフォールバックとして使えるのは、`gateway.auth.*`
が未設定の場合のみです。
`gateway.auth.token` / `gateway.auth.password` が SecretRef 経由で明示的に設定され、
未解決の場合、解決は fail closed します（remote フォールバックによるマスキングなし）。
任意: `wss://` 使用時は `gateway.remote.tlsFingerprint` でリモート TLS をピン留めできます。
平文の `ws://` はデフォルトで loopback 専用です。信頼できるプライベートネットワーク
経路では、break-glass としてクライアントプロセスに `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` を設定してください。これは意図的にプロセス環境のみであり、
`openclaw.json` の設定キーではありません。
モバイルペアリング、および Android の手動またはスキャンされた gateway route はさらに厳格です:
平文は loopback では受け入れられますが、private-LAN、link-local、`.local`、
dotless hostname では、信頼されたプライベートネットワークの平文パスに明示的にオプトインしない限り TLS が必要です。

ローカル device pairing:

- direct local loopback 接続に対する device pairing は、同一ホスト client の体験を滑らかに保つため自動承認されます。
- OpenClaw には、信頼された共有シークレット helper フロー向けの、狭く限定された backend/container-local self-connect path もあります。
- Tailnet と LAN 接続は、同一ホストの tailnet bind を含め、pairing 上はリモートとして扱われ、引き続き承認が必要です。
- loopback リクエストに forwarded-header の証拠がある場合、loopback
  ローカリティの資格を失います。metadata-upgrade の自動承認は狭く限定されています。両ルールについては
  [Gateway pairing](/ja-JP/gateway/pairing) を参照してください。

Auth mode:

- `gateway.auth.mode: "token"`: 共有 bearer token（多くのセットアップで推奨）。
- `gateway.auth.mode: "password"`: password auth（環境変数での設定を推奨: `OPENCLAW_GATEWAY_PASSWORD`）。
- `gateway.auth.mode: "trusted-proxy"`: identity-aware reverse proxy にユーザー認証を任せ、header 経由で identity を渡します（[Trusted Proxy Auth](/ja-JP/gateway/trusted-proxy-auth) を参照）。

ローテーションチェックリスト（token/password）:

1. 新しい secret を生成/設定します（`gateway.auth.token` または `OPENCLAW_GATEWAY_PASSWORD`）。
2. Gateway を再起動します（または macOS アプリが Gateway を監督しているなら、そちらを再起動します）。
3. リモート client を更新します（Gateway を呼び出すマシン上の `gateway.remote.token` / `.password`）。
4. 旧認証情報では接続できなくなったことを確認します。

### Tailscale Serve identity header

`gateway.auth.allowTailscale` が `true`（Serve ではデフォルト）の場合、OpenClaw
は Control
UI/WebSocket 認証に Tailscale Serve の identity header（`tailscale-user-login`）を受け入れます。OpenClaw は、その identity を、`x-forwarded-for` アドレスをローカル Tailscale daemon（`tailscale whois`）で解決し、header と一致するか確認することで検証します。この処理は、loopback に到達し、
Tailscale によって注入された `x-forwarded-for`、`x-forwarded-proto`、`x-forwarded-host` を含むリクエストに対してのみ発動します。
この非同期 identity check パスでは、同じ `{scope, ip}`
に対する失敗試行は、limiter が失敗を記録する前に直列化されます。そのため、1 つの Serve client からの
同時の不正リトライでは、2 回目の試行は 2 つの単なる不一致として競合するのではなく、即座に lock out される可能性があります。
HTTP API endpoint（たとえば `/v1/*`、`/tools/invoke`、`/api/channels/*`）は **Tailscale identity-header auth を使用しません**。それらは引き続き gateway の
設定済み HTTP auth mode に従います。

重要な境界の注意:

- Gateway の HTTP bearer auth は、実質的に all-or-nothing の operator アクセスです。
- `/v1/chat/completions`、`/v1/responses`、または `/api/channels/*` を呼び出せる認証情報は、その gateway に対するフルアクセスの operator secret として扱ってください。
- OpenAI-compatible な HTTP 面では、共有シークレットの bearer auth は、agent ターンに対して完全なデフォルト operator scope（`operator.admin`、`operator.approvals`、`operator.pairing`、`operator.read`、`operator.talk.secrets`、`operator.write`）と owner semantics を復元します。より狭い `x-openclaw-scopes` 値では、この共有シークレット経路は縮小されません。
- HTTP 上の per-request scope semantics が適用されるのは、trusted proxy auth や private ingress 上の `gateway.auth.mode="none"` のような、identity を伴う mode から来たリクエストの場合だけです。
- それらの identity-bearing mode では、`x-openclaw-scopes` を省略すると通常の operator デフォルト scope set にフォールバックします。より狭い scope set が欲しい場合は、明示的に header を送ってください。
- `/tools/invoke` も同じ共有シークレットルールに従います: token/password の bearer auth はそこでもフル operator アクセスとして扱われ、一方 identity-bearing mode は宣言された scope を引き続き尊重します。
- これらの認証情報を信頼できない呼び出し元と共有しないでください。信頼境界ごとに別の Gateway を使うことを推奨します。

**信頼前提:** token なしの Serve auth は gateway host が信頼されていることを前提とします。
これを敵対的な同一ホストプロセスに対する保護とみなしてはいけません。gateway host 上で信頼できない
ローカルコードが動く可能性がある場合は、`gateway.auth.allowTailscale`
を無効にし、`gateway.auth.mode: "token"` または
`"password"` による明示的な共有シークレット auth を必須にしてください。

**セキュリティルール:** 自前の reverse proxy からこれらの header を転送しないでください。TLS を終端したり、gateway の前段で proxy を使う場合は、
`gateway.auth.allowTailscale` を無効にし、共有シークレット auth（`gateway.auth.mode:
"token"` または `"password"`）か [Trusted Proxy Auth](/ja-JP/gateway/trusted-proxy-auth)
を使用してください。

Trusted proxy:

- Gateway の前段で TLS を終端する場合は、`gateway.trustedProxies` に proxy の IP を設定してください。
- OpenClaw は、それらの IP からの `x-forwarded-for`（または `x-real-ip`）を信頼し、ローカル pairing チェックや HTTP auth/ローカルチェック用の client IP 判定に使います。
- Proxy が `x-forwarded-for` を **上書き** し、Gateway ポートへの直接アクセスを遮断していることを確認してください。

参照: [Tailscale](/ja-JP/gateway/tailscale) および [Web overview](/ja-JP/web)。

### Node ホスト経由のブラウザー制御（推奨）

Gateway がリモートにあり、browser が別マシン上で動く場合は、その browser マシン上で **Node ホスト**
を動かし、Gateway に browser アクションをプロキシさせてください（[Browser tool](/ja-JP/tools/browser) を参照）。
Node pairing は管理者アクセスとして扱ってください。

推奨パターン:

- Gateway と Node ホストを同じ tailnet（Tailscale）上に保つ。
- Node は意図的にペアリングし、browser proxy routing が不要なら無効化する。

避けるべきこと:

- relay/control port を LAN または public Internet に公開する。
- browser control endpoint に Tailscale Funnel を使う（公開露出）。

### ディスク上の secret

`~/.openclaw/`（または `$OPENCLAW_STATE_DIR/`）配下のものには secret または private data が含まれる可能性があると考えてください:

- `openclaw.json`: config に token（gateway、remote gateway）、provider 設定、allowlist が含まれる場合があります。
- `credentials/**`: channel 認証情報（例: WhatsApp creds）、pairing allowlist、legacy OAuth import。
- `agents/<agentId>/agent/auth-profiles.json`: API key、token profile、OAuth token、および任意の `keyRef`/`tokenRef`。
- `secrets.json`（任意）: `file` SecretRef provider（`secrets.providers`）で使われるファイルベース secret payload。
- `agents/<agentId>/agent/auth.json`: legacy 互換ファイル。静的な `api_key` エントリーは発見時に scrub されます。
- `agents/<agentId>/sessions/**`: private message や tool output を含みうる session transcript（`*.jsonl`）+ routing metadata（`sessions.json`）。
- バンドル済み Plugin package: インストールされた Plugin（およびその `node_modules/`）。
- `sandboxes/**`: ツール sandbox workspace。sandbox 内で読み書きしたファイルのコピーが蓄積することがあります。

ハードニングのヒント:

- 権限を厳格に保つ（ディレクトリは `700`、ファイルは `600`）。
- Gateway host ではフルディスク暗号化を使う。
- ホストが共有される場合は、Gateway 専用の OS ユーザーアカウントを推奨します。

### Workspace の `.env` ファイル

OpenClaw は agent と tool 用に workspace ローカルの `.env` ファイルを読み込みますが、それらのファイルが Gateway のランタイム制御を黙って上書きすることは決して許しません。

- `OPENCLAW_*` で始まるキーは、信頼されていない workspace `.env` ファイルではブロックされます。
- Matrix、Mattermost、IRC、Synology Chat のチャネル endpoint 設定も、workspace `.env` の上書きからブロックされるため、クローンされた workspace がローカル endpoint 設定経由でバンドル済み connector トラフィックをリダイレクトすることはできません。endpoint 環境変数キー（`MATRIX_HOMESERVER`、`MATTERMOST_URL`、`IRC_HOST`、`SYNOLOGY_CHAT_INCOMING_URL` など）は、workspace 読み込み `.env` ではなく、gateway プロセス環境または `env.shellEnv` から来る必要があります。
- このブロックは fail-closed です: 将来のリリースで新しいランタイム制御変数が追加されても、それがチェックイン済みまたは攻撃者が供給した `.env` から継承されることはありません。キーは無視され、gateway は自身の値を維持します。
- 信頼されたプロセス/OS 環境変数（gateway 自身の shell、launchd/systemd unit、app bundle）は引き続き適用されます — これは `.env` ファイル読み込みだけを制約します。

理由: workspace の `.env` ファイルはしばしば agent コードの隣にあり、誤ってコミットされたり、ツールによって書き込まれたりします。`OPENCLAW_*` 接頭辞全体をブロックすることで、後から新しい `OPENCLAW_*` フラグが追加されても、それが workspace state から静かに継承される退行が決して起きないようにします。

### ログと transcript（redaction と保持）

アクセス制御が正しくても、ログや transcript は機微情報を漏らす可能性があります:

- Gateway ログには tool の要約、エラー、URL が含まれる場合があります。
- Session transcript には、貼り付けられた secret、ファイル内容、コマンド出力、リンクが含まれる場合があります。

推奨事項:

- tool summary の redaction を有効のままにする（`logging.redactSensitive: "tools"`。デフォルト）。
- `logging.redactPatterns` で環境固有のカスタムパターン（token、hostname、内部 URL）を追加する。
- 診断を共有する際は、生ログではなく `openclaw status --all`（貼り付けやすく、secret は redaction 済み）を優先する。
- 長期保持が不要なら、古い session transcript とログファイルを削除する。

詳細: [Logging](/ja-JP/gateway/logging)

### DMs: デフォルトで pairing

```json5
{
  channels: { whatsapp: { dmPolicy: "pairing" } },
}
```

### Groups: すべてで mention 必須

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

group chat では、明示的に mention されたときだけ応答します。

### 番号を分ける（WhatsApp、Signal、Telegram）

電話番号ベースのチャネルでは、AI を個人用番号とは別の電話番号で運用することを検討してください:

- 個人番号: あなたの会話は非公開のまま
- ボット番号: AI がこれを扱い、適切な境界を設ける

### 読み取り専用モード（sandbox と tools 経由）

次を組み合わせることで、読み取り専用 profile を構築できます:

- `agents.defaults.sandbox.workspaceAccess: "ro"`（または workspace アクセスをなくすなら `"none"`）
- `write`、`edit`、`apply_patch`、`exec`、`process` などをブロックする tool allow/deny list

追加のハードニングオプション:

- `tools.exec.applyPatch.workspaceOnly: true`（デフォルト）: sandboxing が off でも、`apply_patch` が workspace ディレクトリ外を書き込み/削除できないようにします。`apply_patch` が意図的に workspace 外のファイルに触れる必要がある場合にのみ `false` にしてください。
- `tools.fs.workspaceOnly: true`（任意）: `read`/`write`/`edit`/`apply_patch` のパスと、ネイティブ prompt 画像の自動読み込みパスを workspace ディレクトリに制限します（現在絶対パスを許可していて、単一のガードレールが欲しい場合に有用です）。
- filesystem root は狭く保ってください: agent workspace/sandbox workspace にホームディレクトリのような広い root を使うのは避けてください。広い root は、filesystem tool に機密ローカルファイル（たとえば `~/.openclaw` 配下の state/config）を露出しうます。

### セキュアベースライン（コピーペースト用）

Gateway を非公開に保ち、DM pairing を要求し、常時稼働の group ボットを避ける「安全なデフォルト」設定の 1 つ:

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

ツール実行も「より安全なデフォルト」にしたい場合は、sandbox を追加し、owner 以外の agent には危険なツールを deny してください（以下の「エージェントごとのアクセスプロファイル」の例を参照）。

chat 駆動の agent turn 向けの組み込みベースラインでは、owner 以外の送信者は `cron` または `gateway` ツールを使えません。

## Sandboxing（推奨）

専用ドキュメント: [Sandboxing](/ja-JP/gateway/sandboxing)

補完的な 2 つのアプローチがあります:

- **Gateway 全体を Docker で実行する**（container 境界）: [Docker](/ja-JP/install/docker)
- **Tool sandbox**（`agents.defaults.sandbox`、host gateway + sandbox 分離ツール。デフォルト backend は Docker）: [Sandboxing](/ja-JP/gateway/sandboxing)

注意: agent 間アクセスを防ぐには、`agents.defaults.sandbox.scope` を `"agent"`（デフォルト）
またはより厳格なセッションごとの分離なら `"session"` のままにしてください。`scope: "shared"` では、
単一の container/workspace を使います。

sandbox 内での agent workspace アクセスも検討してください:

- `agents.defaults.sandbox.workspaceAccess: "none"`（デフォルト）は agent workspace をアクセス不可に保ちます。ツールは `~/.openclaw/sandboxes` 配下の sandbox workspace に対して実行されます
- `agents.defaults.sandbox.workspaceAccess: "ro"` は agent workspace を `/agent` に読み取り専用でマウントします（`write`/`edit`/`apply_patch` を無効化）
- `agents.defaults.sandbox.workspaceAccess: "rw"` は agent workspace を `/workspace` に読み書き可能でマウントします
- 追加の `sandbox.docker.binds` は、正規化および canonicalize された source path に対して検証されます。親 symlink トリックや canonical home alias も、`/etc`、`/var/run`、または OS home 配下の認証情報ディレクトリのようなブロックされた root に解決される場合は引き続き fail closed します。

重要: `tools.elevated` は、sandbox 外で exec を実行するためのグローバルな baseline escape hatch です。実効 host はデフォルトで `gateway`、exec target が `node` に設定されている場合は `node` です。`tools.elevated.allowFrom` は厳格に保ち、見知らぬ相手に対して有効化しないでください。`agents.list[].tools.elevated` により、agent ごとに elevated をさらに制限できます。参照: [Elevated Mode](/ja-JP/tools/elevated)。

### サブエージェント委譲のガードレール

session tool を許可する場合は、委譲されたサブエージェント実行も別の境界判断として扱ってください:

- agent が本当に委譲を必要としない限り、`sessions_spawn` を deny する。
- `agents.defaults.subagents.allowAgents` と、agent ごとの `agents.list[].subagents.allowAgents` 上書きは、既知の安全な target agent に限定する。
- sandbox 化を維持しなければならないワークフローでは、`sessions_spawn` を `sandbox: "require"` で呼び出す（デフォルトは `inherit`）。
- `sandbox: "require"` は、target child runtime が sandbox 化されていない場合に即座に失敗します。

## ブラウザー制御のリスク

ブラウザー制御を有効にすると、model に実ブラウザーを操作する能力を与えることになります。
その browser profile にすでにログイン済みセッションが含まれている場合、model は
それらのアカウントやデータにアクセスできます。browser profile は **機密 state** として扱ってください:

- agent 専用の profile を推奨します（デフォルトの `openclaw` profile）。
- agent に個人用の日常 profile を向けるのは避けてください。
- sandbox 化済み agent では、それらを信頼していない限り host browser control を無効のままにしてください。
- スタンドアロンの loopback browser control API は、共有シークレット auth
  （gateway token bearer auth または gateway password）のみを受け付けます。trusted-proxy や Tailscale Serve の identity header は使用しません。
- browser download は信頼できない入力として扱い、分離された download ディレクトリを推奨します。
- 可能なら、agent profile では browser sync/password manager を無効化してください（blast radius を縮小できます）。
- リモート Gateway では、「browser control」は、その profile が到達できるものすべてに対する「operator access」と同等だと考えてください。
- Gateway と Node host は tailnet 専用に保ち、browser control port を LAN や public Internet に露出しないでください。
- browser proxy routing が不要なら無効化してください（`gateway.nodes.browser.mode="off"`）。
- Chrome MCP の existing-session mode は **より安全ではありません**。その host の Chrome profile が到達できるものすべてに対して、あなたとして動作できます。

### Browser SSRF policy（デフォルトで厳格）

OpenClaw の browser navigation policy はデフォルトで厳格です: private/internal 宛先は、明示的にオプトインしない限りブロックされたままです。

- デフォルト: `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` は未設定のため、browser navigation は private/internal/special-use 宛先を引き続きブロックします。
- Legacy alias: `browser.ssrfPolicy.allowPrivateNetwork` も互換性のため引き続き受け付けられます。
- オプトインモード: private/internal/special-use 宛先を許可するには `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true` を設定します。
- 厳格モードでは、明示的な例外として `hostnameAllowlist`（`*.example.com` のようなパターン）と `allowedHostnames`（`localhost` のようなブロック対象名を含む exact host 例外）を使います。
- Navigation は request 前にチェックされ、redirect ベースの pivot を減らすため、navigation 後の最終 `http(s)` URL に対してもベストエフォートで再チェックされます。

厳格 policy の例:

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

## エージェントごとのアクセスプロファイル（マルチエージェント）

マルチエージェントルーティングでは、各 agent が独自の sandbox + tool policy を持てます:
これを使って agent ごとに **フルアクセス**、**読み取り専用**、**アクセスなし** を与えてください。
詳細と優先順位ルールは [Multi-Agent Sandbox & Tools](/ja-JP/tools/multi-agent-sandbox-tools) を参照してください。

一般的なユースケース:

- 個人 agent: フルアクセス、sandbox なし
- 家族/仕事 agent: sandbox 化 + 読み取り専用ツール
- 公開 agent: sandbox 化 + filesystem/shell ツールなし

### 例: フルアクセス（sandbox なし）

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

### 例: 読み取り専用ツール + 読み取り専用 workspace

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

### 例: filesystem/shell アクセスなし（provider messaging は許可）

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
        // Session tool は transcript から機密データを明かす可能性があります。デフォルトでは OpenClaw はこれらのツールを
        // 現在の session + spawn された subagent session に制限しますが、必要ならさらに厳しくできます。
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

## インシデント対応

AI が問題を起こした場合:

### 封じ込め

1. **止める:** macOS アプリ（Gateway を監督している場合）を停止するか、`openclaw gateway` プロセスを終了します。
2. **露出を閉じる:** 何が起きたか理解するまで、`gateway.bind: "loopback"` に設定します（または Tailscale Funnel/Serve を無効化します）。
3. **アクセスを凍結する:** 危険な DM/group を `dmPolicy: "disabled"` に切り替える / mention 必須にし、もし `"*"` の全許可エントリーがあれば削除します。

### ローテーション（secret が漏れたなら侵害されたと仮定する）

1. Gateway auth（`gateway.auth.token` / `OPENCLAW_GATEWAY_PASSWORD`）をローテーションし、再起動します。
2. Gateway を呼び出せる全マシン上のリモート client secret（`gateway.remote.token` / `.password`）をローテーションします。
3. provider/API 認証情報（WhatsApp creds、Slack/Discord token、`auth-profiles.json` の model/API key、および使用している場合は暗号化された secret payload 値）をローテーションします。

### 監査

1. Gateway ログを確認します: `/tmp/openclaw/openclaw-YYYY-MM-DD.log`（または `logging.file`）。
2. 関連する transcript を確認します: `~/.openclaw/agents/<agentId>/sessions/*.jsonl`。
3. 最近の config 変更を確認します（アクセスを広げた可能性があるもの: `gateway.bind`、`gateway.auth`、dm/group policy、`tools.elevated`、Plugin 変更）。
4. `openclaw security audit --deep` を再実行し、critical 指摘が解消されたことを確認します。

### 報告用に収集するもの

- タイムスタンプ、gateway host OS + OpenClaw version
- セッション transcript + 短いログ末尾（redaction 後）
- 攻撃者が送った内容 + agent が行ったこと
- Gateway が loopback を超えて露出していたかどうか（LAN/Tailscale Funnel/Serve）

## detect-secrets による secret スキャン

CI は `secrets` job で `detect-secrets` pre-commit hook を実行します。
`main` への push では常に全ファイルスキャンが実行されます。pull request では、
base commit が利用可能なら変更ファイルのみの高速パスが使われ、そうでない場合は全ファイルスキャンにフォールバックします。これが失敗した場合、
baseline にまだ入っていない新しい候補があります。

### CI が失敗した場合

1. ローカルで再現します:

   ```bash
   pre-commit run --all-files detect-secrets
   ```

2. ツールを理解します:
   - pre-commit 内の `detect-secrets` は、リポジトリの
     baseline と除外設定を使って `detect-secrets-hook` を実行します。
   - `detect-secrets audit` は、各 baseline
     項目を本物か false positive かとしてマークする対話レビューを開きます。
3. 本物の secret なら: ローテーション/削除し、その後スキャンを再実行して baseline を更新します。
4. false positive なら: 対話 audit を実行して false とマークします:

   ```bash
   detect-secrets audit .secrets.baseline
   ```

5. 新しい除外が必要なら、それを `.detect-secrets.cfg` に追加し、
   一致する `--exclude-files` / `--exclude-lines` フラグで
   baseline を再生成してください（設定
   ファイルは参照用のみで、detect-secrets は自動では読み込みません）。

意図した状態を反映したら、更新された `.secrets.baseline` をコミットしてください。

## セキュリティ問題の報告

OpenClaw に脆弱性を見つけましたか? 責任ある開示で報告してください:

1. メール: [security@openclaw.ai](mailto:security@openclaw.ai)
2. 修正されるまで公開投稿しない
3. あなたをクレジットします（匿名希望でない限り）
