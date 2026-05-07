---
read_when:
    - アクセスや自動化の範囲を広げる機能の追加
summary: シェルアクセスを持つ AI Gateway を実行する際のセキュリティ上の考慮事項と脅威モデル
title: セキュリティ
x-i18n:
    generated_at: "2026-05-07T01:52:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 076b3254955a7bec22788b6f11fc69dc17f6fa7f5bcf48def27deaf567526a55
    source_path: gateway/security/index.md
    workflow: 16
---

<Warning>
  **パーソナルアシスタントの信頼モデル。** このガイダンスは、Gateway ごとに1つの信頼済み
  オペレーター境界があることを前提としています（単一ユーザー、パーソナルアシスタントモデル）。
  OpenClaw は、1つのエージェントまたは Gateway を共有する複数の
  敵対的ユーザーに対する、敵対的なマルチテナントのセキュリティ境界では**ありません**。混在した信頼レベルや
  敵対的ユーザーでの運用が必要な場合は、信頼境界を分割してください（別々の Gateway +
  認証情報、理想的には別々の OS ユーザーまたはホスト）。
</Warning>

## まずスコープ: パーソナルアシスタントのセキュリティモデル

OpenClaw のセキュリティガイダンスは、**パーソナルアシスタント**のデプロイを前提としています。つまり、1つの信頼済みオペレーター境界と、必要に応じた複数のエージェントです。

- サポートされるセキュリティ姿勢: Gateway ごとに1ユーザー/信頼境界（境界ごとに1つの OS ユーザー/ホスト/VPS を推奨）。
- サポートされるセキュリティ境界ではないもの: 相互に信頼されていない、または敵対的なユーザーが使う1つの共有 Gateway/エージェント。
- 敵対的ユーザーの分離が必要な場合は、信頼境界ごとに分割します（別々の Gateway + 認証情報、理想的には別々の OS ユーザー/ホスト）。
- 複数の信頼されていないユーザーが1つのツール有効エージェントにメッセージを送れる場合、その全員が、そのエージェントに委任された同じツール権限を共有しているものとして扱ってください。

このページでは、**そのモデル内での**ハードニングを説明します。1つの共有 Gateway 上で敵対的なマルチテナント分離を主張するものではありません。

## クイック確認: `openclaw security audit`

関連項目: [形式検証（セキュリティモデル）](/ja-JP/security/formal-verification)

これを定期的に実行してください（特に設定変更後やネットワーク面を公開した後）:

```bash
openclaw security audit
openclaw security audit --deep
openclaw security audit --fix
openclaw security audit --json
```

`security audit --fix` は意図的に狭い範囲にとどまります。一般的なオープングループ
ポリシーを許可リストに切り替え、`logging.redactSensitive: "tools"` を復元し、
状態/設定/include ファイルの権限を厳しくし、Windows 上で実行している場合は
POSIX `chmod` ではなく Windows ACL リセットを使います。

一般的な落とし穴（Gateway 認証の露出、ブラウザー制御の露出、昇格された許可リスト、ファイルシステム権限、緩い exec 承認、オープンチャネルでのツール露出）を検出します。

OpenClaw はプロダクトであると同時に実験でもあります。フロンティアモデルの挙動を、実際のメッセージング面と実際のツールに接続します。**「完全に安全」なセットアップはありません。** 目標は、次の点について意図的に判断することです。

- 誰がボットと会話できるか
- ボットがどこで動作してよいか
- ボットが何に触れられるか

まずは動作に必要な最小アクセスから始め、確信が深まるにつれて広げてください。

### デプロイとホストの信頼

OpenClaw は、ホストと設定境界が信頼済みであることを前提としています。

- 誰かが Gateway ホストの状態/設定（`openclaw.json` を含む `~/.openclaw`）を変更できる場合、その人を信頼済みオペレーターとして扱ってください。
- 複数の相互に信頼されていない/敵対的なオペレーター向けに1つの Gateway を実行することは、**推奨されるセットアップではありません**。
- 信頼レベルが混在するチームでは、別々の Gateway（または少なくとも別々の OS ユーザー/ホスト）で信頼境界を分割してください。
- 推奨されるデフォルト: マシン/ホスト（または VPS）ごとに1ユーザー、そのユーザー用に1つの Gateway、その Gateway 内に1つ以上のエージェント。
- 1つの Gateway インスタンス内では、認証済みオペレーターアクセスは信頼済みのコントロールプレーンロールであり、ユーザーごとのテナントロールではありません。
- セッション識別子（`sessionKey`、セッション ID、ラベル）はルーティングセレクターであり、認可トークンではありません。
- 複数の人が1つのツール有効エージェントにメッセージを送れる場合、それぞれが同じ権限セットを操作できます。ユーザーごとのセッション/メモリ分離はプライバシーには役立ちますが、共有エージェントをユーザーごとのホスト認可へ変換するものではありません。

### 安全なファイル操作

OpenClaw は、ルート境界付きファイルアクセス、アトミック書き込み、アーカイブ展開、一時ワークスペース、秘密ファイルヘルパーに `@openclaw/fs-safe` を使います。OpenClaw は fs-safe の任意の POSIX Python ヘルパーをデフォルトで**オフ**にしています。追加の fd 相対ミューテーションハードニングが必要で、Python ランタイムをサポートできる場合にのみ、`OPENCLAW_FS_SAFE_PYTHON_MODE=auto` または `require` を設定してください。

詳細: [安全なファイル操作](/ja-JP/gateway/security/secure-file-operations)。

### 共有 Slack ワークスペース: 現実のリスク

「Slack の全員がボットにメッセージを送れる」場合、主要なリスクは委任されたツール権限です。

- 許可された送信者は誰でも、エージェントのポリシー内でツール呼び出し（`exec`、ブラウザー、ネットワーク/ファイルツール）を誘導できます。
- ある送信者からのプロンプト/コンテンツインジェクションにより、共有状態、デバイス、出力に影響するアクションが発生する可能性があります。
- 1つの共有エージェントが機密の認証情報/ファイルを持っている場合、許可された送信者は誰でも、ツール使用を通じて流出を引き起こせる可能性があります。

チームワークフローには、最小限のツールを持つ別々のエージェント/Gateway を使用してください。個人データを扱うエージェントは非公開にしてください。

### 会社共有エージェント: 許容されるパターン

これは、そのエージェントを使う全員が同じ信頼境界内にあり（たとえば1つの会社チーム）、エージェントが厳密に業務スコープである場合に許容されます。

- 専用のマシン/VM/コンテナで実行する。
- そのランタイムには、専用の OS ユーザー + 専用のブラウザー/プロファイル/アカウントを使う。
- そのランタイムを個人の Apple/Google アカウントや個人のパスワードマネージャー/ブラウザープロファイルにサインインさせない。

同じランタイム上で個人 ID と会社 ID を混在させると、分離が崩れ、個人データの露出リスクが高まります。

## Gateway と Node の信頼概念

Gateway と Node を、役割の異なる1つのオペレーター信頼ドメインとして扱ってください。

- **Gateway** はコントロールプレーンとポリシー面です（`gateway.auth`、ツールポリシー、ルーティング）。
- **Node** は、その Gateway にペアリングされたリモート実行面です（コマンド、デバイスアクション、ホストローカル機能）。
- Gateway に認証された呼び出し元は、Gateway スコープで信頼されます。ペアリング後、Node のアクションはその Node 上での信頼済みオペレーターアクションです。
- オペレータースコープレベルと承認時チェックは、
  [オペレータースコープ](/ja-JP/gateway/operator-scopes)に要約されています。
- 共有 Gateway
  トークン/パスワードで認証された直接のループバックバックエンドクライアントは、ユーザー
  デバイス ID を提示せずに内部コントロールプレーン RPC を実行できます。これはリモートまたはブラウザーのペアリング回避ではありません。ネットワーク
  クライアント、Node クライアント、デバイストークンクライアント、明示的なデバイス ID は、
  引き続きペアリングとスコープアップグレードの強制を通ります。
- `sessionKey` はルーティング/コンテキスト選択であり、ユーザーごとの認証ではありません。
- Exec 承認（許可リスト + 確認）はオペレーター意図のガードレールであり、敵対的なマルチテナント分離ではありません。
- 信頼済み単一オペレーターセットアップにおける OpenClaw のプロダクトデフォルトは、`gateway`/`node` 上のホスト exec が承認プロンプトなしで許可されることです（明示的に厳しくしない限り、`security="full"`、`ask="off"`）。そのデフォルトは意図的な UX であり、それ自体が脆弱性ではありません。
- Exec 承認は、正確なリクエストコンテキストと、ベストエフォートの直接ローカルファイルオペランドに結び付きます。すべてのランタイム/インタープリターローダーパスを意味的にモデル化するものではありません。強い境界にはサンドボックス化とホスト分離を使ってください。

敵対的ユーザーの分離が必要な場合は、OS ユーザー/ホストごとに信頼境界を分割し、別々の Gateway を実行してください。

## 信頼境界マトリクス

リスクをトリアージするときのクイックモデルとして使ってください。

| 境界または制御 | 意味 | よくある誤読 |
| --------------------------------------------------------- | ------------------------------------------------- | ----------------------------------------------------------------------------- |
| `gateway.auth`（トークン/パスワード/信頼済みプロキシ/デバイス認証） | 呼び出し元を Gateway API に対して認証する | 「安全であるには、すべてのフレームでメッセージごとの署名が必要」 |
| `sessionKey` | コンテキスト/セッション選択用のルーティングキー | 「セッションキーはユーザー認証境界である」 |
| プロンプト/コンテンツのガードレール | モデル悪用リスクを減らす | 「プロンプトインジェクションだけで認証回避が証明される」 |
| `canvas.eval` / ブラウザー evaluate | 有効な場合の意図的なオペレーター機能 | 「どの JS eval プリミティブも、この信頼モデルでは自動的に脆弱性である」 |
| ローカル TUI `!` シェル | 明示的にオペレーターが起動するローカル実行 | 「ローカルシェルの便利コマンドはリモートインジェクションである」 |
| Node ペアリングと Node コマンド | ペアリング済みデバイス上のオペレーターレベルのリモート実行 | 「リモートデバイス制御はデフォルトで信頼されていないユーザーアクセスとして扱うべき」 |
| `gateway.nodes.pairing.autoApproveCidrs` | オプトインの信頼済みネットワーク Node 登録ポリシー | 「デフォルト無効の許可リストは自動ペアリング脆弱性である」 |

## マルチエージェントとサブエージェントの境界

OpenClaw は1つの Gateway 内で多くのエージェントを実行できますが、それらのエージェントは、デプロイを
Gateway、OS ユーザー、ホスト、またはサンドボックスで分割しない限り、同じ信頼済みオペレーター境界内に
あります。サブエージェント委任は、敵対的なマルチテナント認可レイヤーではなく、ツールポリシー
およびサンドボックス化の判断として扱ってください。

1つの信頼済み Gateway 内で期待される挙動:

- 認証済みオペレーターは、設定で使用を許可されているセッションとエージェントに
  作業をルーティングできます。
- `sessionKey`、セッション ID、ラベル、サブエージェントのセッションキーは
  会話コンテキストを選択します。これらはベアラー認証情報ではなく、ユーザーごとの
  認可境界でもありません。
- サブエージェントはデフォルトで別々のセッションを持ちます。ネイティブの `sessions_spawn` は、
  呼び出し元が明示的に `context: "fork"` を要求しない限り、分離されたコンテキストを使います。
  スレッドに紐づくフォローアップセッションは、会話スレッドを継続するため、フォークされたコンテキストを使います。
- フォークされたサブエージェントは、意図的に与えられたトランスクリプトコンテキストを見ることができます。
  これは想定どおりです。ポリシー上受け取ってはならないコンテキストを受け取った場合にのみ、
  セキュリティ問題になります。
- ツールアクセスは、有効なプロファイル、チャネル/グループ/プロバイダーポリシー、
  サンドボックスポリシー、エージェントごとのポリシー、サブエージェント制限レイヤーから決まります。広い
  ツールプロファイルは意図的に広い機能を与えます。
- サブエージェントの認証プロファイルはターゲットエージェント ID によって解決されます。認証情報/デプロイを分割しない限り、メインエージェントの認証は
  フォールバックとして利用可能な場合があります。強いシークレット分離をサブエージェント ID だけに依存しないでください。

実際の境界回避に該当するもの:

- 有効なツールポリシーが拒否しているにもかかわらず、`sessions_spawn` が動作する。
- リクエスターがサンドボックス化されている、または呼び出しが `sandbox: "require"` を要求しているにもかかわらず、子がサンドボックスなしで実行される。
- 解決された設定が拒否しているセッションツール、システムツール、またはターゲットエージェントアクセスを子が受け取る。
- リーフサブエージェントが、自分が生成していない兄弟セッションを制御、終了、誘導、またはメッセージ送信する。
- 明示的なポリシーまたはサンドボックス境界によって除外されたトランスクリプト、メモリ、認証情報、またはファイルをサブエージェントが見る。
- 必要な Gateway 認証または信頼済みプロキシ/デバイス ID を持たない Gateway/API 呼び出し元が、エージェントまたはツール実行をトリガーできる。

ハードニング設定:

- エージェントが本当に委任を必要としない限り、`sessions_spawn` は拒否したままにします。
- 外部チャネルと会話するエージェントには、`tools.profile: "messaging"` または別の狭いプロファイルを優先します。
- 作業を生成する可能性があるエージェントには `agents.list[].subagents.requireAgentId: true` を設定し、ターゲット選択を明示的にします。
- `agents.defaults.subagents.allowAgents` と
  `agents.list[].subagents.allowAgents` は狭く保ちます。信頼されていない入力を
  受け取るエージェントでは `["*"]` を避けてください。
- `tools.subagents.tools.allow` を使い、広い親プロファイルを継承するのではなく、サブエージェントのツールを許可のみの方式にします。
- サンドボックス化を維持する必要があるワークフローでは、
  `sessions_spawn` を `sandbox: "require"` とともに使います。
- エージェントまたはユーザーが相互に信頼されていない場合は、別々の Gateway、OS ユーザー、ホスト、ブラウザープロファイル、認証情報を使います。

## 設計上、脆弱性ではないもの

<Accordion title="Common findings that are out of scope">

これらのパターンは頻繁に報告されますが、実際の境界回避が示されない限り、
通常は対応なしとしてクローズされます。

- ポリシー、認証、またはサンドボックスのバイパスを伴わない、プロンプトインジェクションのみの連鎖。
- 1つの共有ホストまたは共有設定上での敵対的なマルチテナント運用を前提にした主張。
- 共有 Gateway 構成で、通常のオペレーター読み取りパスアクセス（たとえば `sessions.list` / `sessions.preview` / `chat.history`）を IDOR と分類する主張。
- リクエスターがそのコンテキストを明示的に fork した場合に、想定される `context: "fork"` のトランスクリプト継承を境界バイパスとして扱う主張。
- 構成されたプロファイルまたは許可リストがそれらのツールを意図的に許可している場合に、サブエージェントの広範なツールアクセスをバイパスとして扱う主張。
- ローカルホスト限定デプロイに関する指摘（たとえば loopback 限定 Gateway での HSTS）。
- このリポジトリに存在しないインバウンドパスに対する Discord インバウンド Webhook 署名の指摘。
- 実際の実行境界が引き続き Gateway のグローバルなノードコマンドポリシーとノード自身の exec 承認であるにもかかわらず、ノードペアリングメタデータを `system.run` の隠れた2つ目のコマンド単位承認レイヤーとして扱うレポート。
- 構成済みの `gateway.nodes.pairing.autoApproveCidrs` 自体を脆弱性として扱うレポート。この設定はデフォルトで無効であり、明示的な CIDR/IP エントリを必要とし、要求スコープがない初回の `role: node` ペアリングにのみ適用されます。また、loopback trusted-proxy 認証が明示的に有効化されていない限り、operator/browser/Control UI、WebChat、ロール昇格、スコープ昇格、メタデータ変更、公開鍵変更、同一ホスト loopback の trusted-proxy ヘッダーパスを自動承認しません。
- `sessionKey` を認証トークンとして扱う「ユーザー単位の認可がない」という指摘。

</Accordion>

## 60秒でできる堅牢化ベースライン

まずこのベースラインを使用し、その後、信頼済みエージェントごとにツールを選択的に再有効化してください。

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

これにより、Gateway をローカル限定に保ち、DM を分離し、制御プレーン/ランタイムツールをデフォルトで無効化します。

## 共有受信箱の簡易ルール

複数の人がボットに DM できる場合:

- `session.dmScope: "per-channel-peer"` を設定します（複数アカウントのチャンネルでは `"per-account-channel-peer"`）。
- `dmPolicy: "pairing"` または厳格な許可リストを維持します。
- 共有 DM と広範なツールアクセスを組み合わせないでください。
- これは協調型/共有受信箱を堅牢化しますが、ユーザーがホスト/設定への書き込みアクセスを共有する場合の敵対的な共同テナント分離としては設計されていません。

## コンテキスト可視性モデル

OpenClaw は2つの概念を分離します。

- **トリガー認可**: エージェントをトリガーできる人（`dmPolicy`、`groupPolicy`、許可リスト、メンションゲート）。
- **コンテキスト可視性**: モデル入力に注入される補足コンテキスト（返信本文、引用テキスト、スレッド履歴、転送メタデータ）。

許可リストはトリガーとコマンド認可を制御します。`contextVisibility` 設定は、補足コンテキスト（引用返信、スレッドルート、取得した履歴）をどのようにフィルタリングするかを制御します。

- `contextVisibility: "all"`（デフォルト）は、受信した補足コンテキストをそのまま保持します。
- `contextVisibility: "allowlist"` は、アクティブな許可リストチェックで許可された送信者に補足コンテキストをフィルタリングします。
- `contextVisibility: "allowlist_quote"` は `allowlist` と同様に動作しますが、明示的な引用返信を1つだけ保持します。

チャンネル単位またはルーム/会話単位で `contextVisibility` を設定してください。設定の詳細は [グループチャット](/ja-JP/channels/groups#context-visibility-and-allowlists) を参照してください。

アドバイザリートリアージの指針:

- 「モデルが許可リストにない送信者からの引用または履歴テキストを見られる」ことだけを示す主張は、`contextVisibility` で対処可能な堅牢化の指摘であり、それ自体では認証またはサンドボックス境界のバイパスではありません。
- セキュリティ影響があるためには、レポートは引き続き、信頼境界のバイパス（認証、ポリシー、サンドボックス、承認、または別の文書化された境界）を実証する必要があります。

## 監査で確認する内容（概要）

- **インバウンドアクセス**（DM ポリシー、グループポリシー、許可リスト）: 見知らぬ人がボットをトリガーできるか。
- **ツールの影響範囲**（昇格ツール + オープンなルーム）: プロンプトインジェクションがシェル/ファイル/ネットワーク操作につながる可能性があるか。
- **Exec 承認のドリフト**（`security=full`、`autoAllowSkills`、`strictInlineEval` なしのインタープリター許可リスト）: ホスト exec ガードレールが、まだ想定どおり機能しているか。
  - `security="full"` は広範な姿勢に関する警告であり、バグの証明ではありません。これは信頼済みの個人アシスタント構成向けに選ばれたデフォルトです。脅威モデルで承認または許可リストのガードレールが必要な場合にのみ厳格化してください。
- **ネットワーク公開**（Gateway の bind/auth、Tailscale Serve/Funnel、弱い/短い認証トークン）。
- **ブラウザー制御の公開**（リモートノード、リレーポート、リモート CDP エンドポイント）。
- **ローカルディスクの衛生状態**（権限、シンボリックリンク、設定 include、「同期フォルダー」パス）。
- **Plugins**（明示的な許可リストなしで plugins がロードされる）。
- **ポリシードリフト/誤設定**（sandbox docker 設定は構成されているが sandbox モードがオフになっている、`gateway.nodes.denyCommands` パターンが無効になっている。これは一致が正確なコマンド名のみ（たとえば `system.run`）で、シェルテキストを検査しないためです。危険な `gateway.nodes.allowCommands` エントリ、エージェント単位プロファイルによって上書きされるグローバルな `tools.profile="minimal"`、寛容なツールポリシー下で到達可能な plugin 所有ツール）。
- **ランタイム期待値のドリフト**（たとえば、`tools.exec.host` が現在 `auto` をデフォルトにしているのに、暗黙の exec がまだ `sandbox` を意味すると想定する、または sandbox モードがオフの状態で `tools.exec.host="sandbox"` を明示的に設定する）。
- **モデル衛生**（構成済みモデルがレガシーに見える場合は警告します。ハードブロックではありません）。

`--deep` を実行すると、OpenClaw はベストエフォートのライブ Gateway プローブも試行します。

## 認証情報ストレージマップ

アクセスを監査する場合やバックアップ対象を決める場合に使用してください。

- **WhatsApp**: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Telegram ボットトークン**: config/env または `channels.telegram.tokenFile`（通常ファイルのみ。シンボリックリンクは拒否）
- **Discord ボットトークン**: config/env または SecretRef（env/file/exec プロバイダー）
- **Slack トークン**: config/env（`channels.slack.*`）
- **ペアリング許可リスト**:
  - `~/.openclaw/credentials/<channel>-allowFrom.json`（デフォルトアカウント）
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json`（非デフォルトアカウント）
- **モデル認証プロファイル**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **Codex ランタイム状態**: `~/.openclaw/agents/<agentId>/agent/codex-home/`
- **ファイル backed secrets ペイロード（任意）**: `~/.openclaw/secrets.json`
- **レガシー OAuth インポート**: `~/.openclaw/credentials/oauth.json`

## セキュリティ監査チェックリスト

監査で指摘が出力された場合は、次の優先順位として扱ってください。

1. **「open」なもの + ツール有効**: まず DM/グループをロックダウンし（ペアリング/許可リスト）、次にツールポリシー/サンドボックスを厳格化します。
2. **公開ネットワークへの露出**（LAN bind、Funnel、認証欠落）: 直ちに修正します。
3. **ブラウザー制御のリモート露出**: operator アクセスのように扱います（tailnet 限定、ノードを意図的にペアリング、公開露出を避ける）。
4. **権限**: 状態/設定/認証情報/認証がグループまたは全世界から読み取り可能でないことを確認します。
5. **Plugins**: 明示的に信頼するものだけをロードします。
6. **モデル選択**: ツールを持つボットには、モダンで指示堅牢化されたモデルを優先します。

## セキュリティ監査用語集

各監査指摘は、構造化された `checkId`（たとえば `gateway.bind_no_auth` または `tools.exec.security_full_configured`）でキー付けされます。一般的な重大度の高いクラス:

- `fs.*` - 状態、設定、認証情報、認証プロファイルのファイルシステム権限。
- `gateway.*` - bind モード、認証、Tailscale、Control UI、trusted-proxy 設定。
- `hooks.*`、`browser.*`、`sandbox.*`、`tools.exec.*` - サーフェス単位の堅牢化。
- `plugins.*`、`skills.*` - plugin/skill のサプライチェーンとスキャン指摘。
- `security.exposure.*` - アクセスポリシーとツールの影響範囲が交わる横断的なチェック。

重大度レベル、修正キー、自動修正サポートを含む完全なカタログは、[セキュリティ監査チェック](/ja-JP/gateway/security/audit-checks) を参照してください。

## HTTP 経由の Control UI

Control UI でデバイス ID を生成するには **セキュアコンテキスト**（HTTPS または localhost）が必要です。`gateway.controlUi.allowInsecureAuth` はローカル互換性トグルです。

- localhost では、ページが非セキュア HTTP で読み込まれた場合に、デバイス ID なしで Control UI 認証を許可します。
- ペアリングチェックはバイパスしません。
- リモート（非 localhost）のデバイス ID 要件は緩和しません。

HTTPS（Tailscale Serve）を優先するか、`127.0.0.1` で UI を開いてください。

緊急時専用として、`gateway.controlUi.dangerouslyDisableDeviceAuth` はデバイス ID チェックを完全に無効化します。これは重大なセキュリティ低下です。実際にデバッグ中で、すばやく戻せる場合を除き、無効のままにしてください。

これらの危険なフラグとは別に、`gateway.auth.mode: "trusted-proxy"` が成功すると、デバイス ID なしで **operator** Control UI セッションを許可できます。これは意図された認証モードの動作であり、`allowInsecureAuth` の近道ではありません。また、node ロールの Control UI セッションには引き続き拡張されません。

この設定が有効な場合、`openclaw security audit` は警告します。

## 安全でない、または危険なフラグの概要

既知の安全でない/危険なデバッグスイッチが有効になっている場合、`openclaw security audit` は `config.insecure_or_dangerous_flags` を出します。本番環境ではこれらを未設定のままにしてください。

<AccordionGroup>
  <Accordion title="Flags tracked by the audit today">
    - `gateway.controlUi.allowInsecureAuth=true`
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true`
    - `gateway.controlUi.dangerouslyDisableDeviceAuth=true`
    - `hooks.gmail.allowUnsafeExternalContent=true`
    - `hooks.mappings[<index>].allowUnsafeExternalContent=true`
    - `tools.exec.applyPatch.workspaceOnly=false`
    - `plugins.entries.acpx.config.permissionMode=approve-all`

  </Accordion>

  <Accordion title="All `dangerous*` / `dangerously*` keys in the config schema">
    Control UI とブラウザー:

    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback`
    - `gateway.controlUi.dangerouslyDisableDeviceAuth`
    - `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`

    チャンネル名照合（同梱および plugin チャンネル。該当する場合は `accounts.<accountId>` 単位でも利用可能）:

    - `channels.discord.dangerouslyAllowNameMatching`
    - `channels.slack.dangerouslyAllowNameMatching`
    - `channels.googlechat.dangerouslyAllowNameMatching`
    - `channels.msteams.dangerouslyAllowNameMatching`
    - `channels.synology-chat.dangerouslyAllowNameMatching`（plugin チャンネル）
    - `channels.synology-chat.dangerouslyAllowInheritedWebhookPath`（plugin チャンネル）
    - `channels.zalouser.dangerouslyAllowNameMatching`（plugin チャンネル）
    - `channels.irc.dangerouslyAllowNameMatching`（plugin チャンネル）
    - `channels.mattermost.dangerouslyAllowNameMatching`（plugin チャンネル）

    ネットワーク公開:

    - `channels.telegram.network.dangerouslyAllowPrivateNetwork`（アカウント単位でも可）

    Sandbox Docker（デフォルト + エージェント単位）:

    - `agents.defaults.sandbox.docker.dangerouslyAllowReservedContainerTargets`
    - `agents.defaults.sandbox.docker.dangerouslyAllowExternalBindSources`
    - `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin`

  </Accordion>
</AccordionGroup>

## リバースプロキシ構成

Gateway をリバースプロキシ（nginx、Caddy、Traefik など）の背後で実行する場合は、転送されたクライアント IP を適切に処理するために `gateway.trustedProxies` を構成してください。

Gateway が `trustedProxies` に含まれないアドレスからプロキシヘッダーを検出した場合、その接続をローカルクライアントとして扱いません。gateway 認証が無効な場合、それらの接続は拒否されます。これにより、プロキシされた接続が localhost から来たように見えて自動的な信頼を受ける認証バイパスを防ぎます。

`gateway.trustedProxies` は `gateway.auth.mode: "trusted-proxy"` にも使われますが、この認証モードはより厳格です。

- trusted-proxy 認証は **デフォルトで loopback 送信元プロキシに対してフェイルクローズします**
- 同一ホストの loopback リバースプロキシは、ローカルクライアント検出と転送元 IP 処理に `gateway.trustedProxies` を使用できます
- 同一ホストの loopback リバースプロキシが `gateway.auth.mode: "trusted-proxy"` を満たせるのは、`gateway.auth.trustedProxy.allowLoopback = true` の場合だけです。それ以外の場合はトークン/パスワード認証を使用してください

```yaml
gateway:
  trustedProxies:
    - "10.0.0.1" # reverse proxy IP
  # Optional. Default false.
  # Only enable if your proxy cannot provide X-Forwarded-For.
  allowRealIpFallback: false
  auth:
    mode: password
    password: ${OPENCLAW_GATEWAY_PASSWORD}
```

`trustedProxies` が構成されている場合、Gateway は `X-Forwarded-For` を使用してクライアント IP を判定します。`gateway.allowRealIpFallback: true` が明示的に設定されていない限り、`X-Real-IP` はデフォルトで無視されます。

信頼済みプロキシヘッダーによって、Node デバイスのペアリングが自動的に信頼済みになるわけではありません。
`gateway.nodes.pairing.autoApproveCidrs` は、デフォルトでは無効な、別個の
運用者ポリシーです。有効にされている場合でも、loopback 送信元の信頼済みプロキシヘッダーパスは、
Node の自動承認から除外されます。これは、loopback の信頼済みプロキシ認証が明示的に有効化されている場合も含め、
ローカル呼び出し元がこれらのヘッダーを偽装できるためです。

適切なリバースプロキシの動作（受信した転送ヘッダーを上書きする）:

```nginx
proxy_set_header X-Forwarded-For $remote_addr;
proxy_set_header X-Real-IP $remote_addr;
```

不適切なリバースプロキシの動作（信頼できない転送ヘッダーを追加/保持する）:

```nginx
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
```

## HSTS とオリジンに関する注記

- OpenClaw Gateway はローカル/loopback 優先です。リバースプロキシで TLS を終端する場合は、プロキシ側の HTTPS ドメインで HSTS を設定してください。
- Gateway 自体が HTTPS を終端する場合は、OpenClaw レスポンスから HSTS ヘッダーを送出するために `gateway.http.securityHeaders.strictTransportSecurity` を設定できます。
- 詳細なデプロイガイダンスは [Trusted Proxy Auth](/ja-JP/gateway/trusted-proxy-auth#tls-termination-and-hsts) にあります。
- 非 loopback の Control UI デプロイでは、デフォルトで `gateway.controlUi.allowedOrigins` が必要です。
- `gateway.controlUi.allowedOrigins: ["*"]` は、強化されたデフォルトではなく、明示的な全ブラウザーオリジン許可ポリシーです。厳密に管理されたローカルテスト以外では避けてください。
- loopback でのブラウザーオリジン認証失敗は、一般的な loopback 免除が有効な場合でもレート制限されますが、
  ロックアウトキーは共有の localhost バケット 1 つではなく、正規化された `Origin` 値ごとにスコープされます。
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` は Host ヘッダーオリジンのフォールバックモードを有効にします。危険な、運用者が選択するポリシーとして扱ってください。
- DNS リバインディングとプロキシの Host ヘッダー動作はデプロイ強化の懸念事項として扱ってください。`trustedProxies` を厳密に保ち、Gateway を public internet に直接公開することは避けてください。

## ローカルセッションログはディスク上に存在します

OpenClaw はセッショントランスクリプトを `~/.openclaw/agents/<agentId>/sessions/*.jsonl` 配下のディスク上に保存します。
これはセッション継続性と（任意で）セッションメモリー索引作成に必要ですが、同時に
**ファイルシステムアクセスを持つ任意のプロセス/ユーザーがこれらのログを読める** ことも意味します。ディスクアクセスを信頼境界として扱い、
`~/.openclaw` の権限をロックダウンしてください（下の監査セクションを参照）。エージェント間で
より強い分離が必要な場合は、別々の OS ユーザーまたは別々のホストで実行してください。

## Node 実行（system.run）

macOS Node がペアリングされている場合、Gateway はその Node 上で `system.run` を呼び出せます。これは Mac 上での **リモートコード実行** です。

- Node ペアリング（承認 + トークン）が必要です。
- Gateway Node ペアリングはコマンドごとの承認サーフェスではありません。Node の ID/信頼とトークン発行を確立します。
- Gateway は `gateway.nodes.allowCommands` / `denyCommands` によって粗いグローバル Node コマンドポリシーを適用します。
- Mac 側では **Settings → Exec approvals**（security + ask + allowlist）で制御されます。
- Node ごとの `system.run` ポリシーは、その Node 自身の exec approvals ファイル（`exec.approvals.node.*`）であり、Gateway のグローバルなコマンド ID ポリシーより厳しくも緩くもできます。
- `security="full"` かつ `ask="off"` で実行されている Node は、デフォルトの信頼済み運用者モデルに従っています。デプロイで明示的により厳しい承認または allowlist 方針が必要でない限り、これは想定された動作として扱ってください。
- 承認モードは、正確なリクエストコンテキストと、可能な場合は具体的なローカルスクリプト/ファイルオペランド 1 つに紐づきます。OpenClaw がインタープリター/ランタイムコマンドに対して直接のローカルファイルを正確に 1 つ特定できない場合、承認に基づく実行は、完全な意味的カバレッジを約束するのではなく拒否されます。
- `host=node` の場合、承認に基づく実行は正準化された準備済みの
  `systemRunPlan` も保存します。後続の承認済み転送はその保存済みプランを再利用し、Gateway
  検証は、承認リクエスト作成後に呼び出し元が command/cwd/session コンテキストを編集することを拒否します。
- リモート実行を望まない場合は、security を **deny** に設定し、その Mac の Node ペアリングを削除してください。

この区別はトリアージで重要です。

- 再接続したペアリング済み Node が別のコマンドリストを広告しているだけでは、Gateway のグローバルポリシーと Node のローカル exec approvals が実際の実行境界を引き続き強制している限り、それ自体は脆弱性ではありません。
- Node ペアリングメタデータを第 2 の隠れたコマンドごとの承認レイヤーとして扱う報告は、通常はセキュリティ境界のバイパスではなく、ポリシー/UX の混乱です。

## 動的 Skills（ウォッチャー / リモート Node）

OpenClaw はセッション中に Skills リストを更新できます。

- **Skills ウォッチャー**: `SKILL.md` への変更は、次のエージェントターンで Skills スナップショットを更新できます。
- **リモート Node**: macOS Node が接続されると、（bin プローブに基づいて）macOS 専用 Skills が利用可能になります。

Skill フォルダーは **信頼済みコード** として扱い、変更できる人を制限してください。

## 脅威モデル

AI アシスタントは次のことができます。

- 任意の shell コマンドを実行する
- ファイルを読み書きする
- ネットワークサービスにアクセスする
- 誰にでもメッセージを送信する（WhatsApp アクセスを与えた場合）

あなたにメッセージを送る人は次のことができます。

- AI をだまして悪いことをさせようとする
- あなたのデータへのアクセスをソーシャルエンジニアリングする
- インフラの詳細を探る

## 中核概念: 知能より先にアクセス制御

ここでの失敗の多くは高度な exploit ではなく、「誰かが bot にメッセージし、bot が依頼どおりに実行した」というものです。

OpenClaw の方針:

- **まず ID:** 誰が bot と会話できるかを決めます（DM ペアリング / allowlist / 明示的な「open」）。
- **次にスコープ:** bot がどこで動作してよいかを決めます（グループ allowlist + mention ゲート、tools、サンドボックス化、デバイス権限）。
- **最後にモデル:** モデルは操作され得ると想定し、操作されても影響範囲が限定されるように設計します。

## コマンド認可モデル

スラッシュコマンドとディレクティブは、**認可済み送信者** に対してのみ尊重されます。認可は
チャネル allowlist/ペアリングと `commands.useAccessGroups` から派生します（[構成](/ja-JP/gateway/configuration)
および [スラッシュコマンド](/ja-JP/tools/slash-commands) を参照）。チャネル allowlist が空、または `"*"` を含む場合、
そのチャネルではコマンドが実質的に開放されます。

`/exec` は認可済み運用者向けのセッション限定の便宜機能です。これは構成を書き込んだり、
他のセッションを変更したり **しません**。

## コントロールプレーン tools のリスク

2 つの組み込み tools は、永続的なコントロールプレーン変更を行えます。

- `gateway` は `config.schema.lookup` / `config.get` で構成を調査でき、`config.apply`、`config.patch`、`update.run` で永続的な変更を行えます。
- `cron` は、元のチャット/タスクが終了した後も実行され続けるスケジュール済みジョブを作成できます。

owner-only の `gateway` ランタイム tool は、引き続き
`tools.exec.ask` または `tools.exec.security` の書き換えを拒否します。従来の `tools.bash.*` エイリアスは、
書き込み前に同じ保護対象 exec パスへ正規化されます。
エージェント駆動の `gateway config.apply` および `gateway config.patch` 編集は、
デフォルトでフェイルクローズします。エージェントが調整できるのは、prompt、model、mention-gating
パスの狭い集合だけです。そのため、新しい機微な構成ツリーは、
意図的に allowlist に追加されない限り保護されます。

信頼できないコンテンツを扱うエージェント/サーフェスでは、これらをデフォルトで拒否してください。

```json5
{
  tools: {
    deny: ["gateway", "cron", "sessions_spawn", "sessions_send"],
  },
}
```

`commands.restart=false` は再起動アクションだけをブロックします。`gateway` の構成/更新アクションは無効化しません。

## Plugins

Plugins は Gateway と **同一プロセス内** で実行されます。信頼済みコードとして扱ってください。

- 信頼できるソースからの Plugins だけをインストールしてください。
- 明示的な `plugins.allow` allowlist を優先してください。
- 有効化前に Plugin 構成をレビューしてください。
- Plugin の変更後は Gateway を再起動してください。
- Plugins をインストールまたは更新する場合（`openclaw plugins install <package>`、`openclaw plugins update <id>`）、信頼できないコードを実行するものとして扱ってください。
  - インストール先は、有効な Plugin インストールルート配下の Plugin ごとのディレクトリです。
  - OpenClaw は install/update の前に組み込みの危険コードスキャンを実行します。`critical` の検出結果はデフォルトでブロックされます。
  - npm および git の Plugin インストールは、明示的な install/update フロー中にのみ、パッケージマネージャーの依存関係収束を実行します。ローカルパスとアーカイブは自己完結した Plugin パッケージとして扱われ、OpenClaw は `npm install` を実行せずにコピー/参照します。
  - 固定された正確なバージョン（`@scope/pkg@1.2.3`）を優先し、有効化前にディスク上で展開済みコードを検査してください。
  - `--dangerously-force-unsafe-install` は、Plugin install/update フローにおける組み込みスキャンの誤検知に対する break-glass 専用です。Plugin `before_install` hook ポリシーブロックをバイパスせず、スキャン失敗もバイパスしません。
  - Gateway に基づく Skill 依存関係インストールは、同じ dangerous/suspicious の分離に従います。組み込みの `critical` 検出結果は、呼び出し元が `dangerouslyForceUnsafeInstall` を明示的に設定しない限りブロックされます。一方で suspicious の検出結果は引き続き警告のみです。`openclaw skills install` は、別個の ClawHub Skill ダウンロード/インストールフローのままです。

詳細: [Plugins](/ja-JP/tools/plugin)

## DM アクセスモデル: ペアリング、allowlist、open、disabled

現在の DM 対応チャネルはすべて、メッセージが処理される **前に** 受信 DM をゲートする DM ポリシー（`dmPolicy` または `*.dm.policy`）をサポートしています。

- `pairing`（デフォルト）: 未知の送信者は短いペアリングコードを受け取り、承認されるまで bot はそのメッセージを無視します。コードは 1 時間後に期限切れになります。新しいリクエストが作成されるまで、DM を繰り返してもコードは再送されません。保留中のリクエストはデフォルトで **チャネルごとに 3 件** に制限されます。
- `allowlist`: 未知の送信者はブロックされます（ペアリングハンドシェイクなし）。
- `open`: 誰でも DM できるようにします（public）。チャネル allowlist に `"*"` が含まれていることが **必要** です（明示的な opt-in）。
- `disabled`: 受信 DM を完全に無視します。

CLI で承認:

```bash
openclaw pairing list <channel>
openclaw pairing approve <channel> <code>
```

詳細 + ディスク上のファイル: [ペアリング](/ja-JP/channels/pairing)

## DM セッション分離（マルチユーザーモード）

デフォルトでは、OpenClaw は **すべての DM をメインセッションへルーティング** するため、アシスタントはデバイスとチャネルをまたいだ継続性を持ちます。**複数の人** が bot に DM できる場合（open DM または複数人 allowlist）は、DM セッションの分離を検討してください。

```json5
{
  session: { dmScope: "per-channel-peer" },
}
```

これにより、グループチャットを分離したまま、ユーザー間のコンテキスト漏えいを防げます。

これはメッセージングコンテキストの境界であり、ホスト管理者の境界ではありません。ユーザー同士が相互に敵対的で、同じ Gateway ホスト/構成を共有する場合は、信頼境界ごとに別々の Gateway を実行してください。

### セキュア DM モード（推奨）

上のスニペットを **セキュア DM モード** として扱ってください。

- デフォルト: `session.dmScope: "main"`（継続性のため、すべての DM が 1 つのセッションを共有します）。
- ローカル CLI オンボーディングのデフォルト: 未設定の場合に `session.dmScope: "per-channel-peer"` を書き込みます（既存の明示的な値は保持します）。
- セキュア DM モード: `session.dmScope: "per-channel-peer"`（各チャネル+送信者ペアが分離された DM コンテキストを取得します）。
- クロスチャネルの peer 分離: `session.dmScope: "per-peer"`（各送信者が同じタイプのすべてのチャネルをまたいで 1 つのセッションを取得します）。

同じチャネルで複数のアカウントを運用する場合は、代わりに `per-account-channel-peer` を使用します。同じ人物が複数のチャネルで連絡してくる場合は、`session.identityLinks` を使用して、それらの DM セッションを 1 つの正規アイデンティティにまとめます。[セッション管理](/ja-JP/concepts/session) と [設定](/ja-JP/gateway/configuration) を参照してください。

## DM とグループの許可リスト

OpenClaw には、「誰が自分を起動できるか?」に関する 2 つの別々のレイヤーがあります。

- **DM 許可リスト** (`allowFrom` / `channels.discord.allowFrom` / `channels.slack.allowFrom`; レガシー: `channels.discord.dm.allowFrom`, `channels.slack.dm.allowFrom`): ダイレクトメッセージでボットと会話できる相手。
  - `dmPolicy="pairing"` の場合、承認は `~/.openclaw/credentials/` 配下のアカウントスコープのペアリング許可リストストアに書き込まれます（デフォルトアカウントでは `<channel>-allowFrom.json`、非デフォルトアカウントでは `<channel>-<accountId>-allowFrom.json`）。これは設定の許可リストとマージされます。
- **グループ許可リスト**（チャネル固有）: ボットがそもそもメッセージを受け付けるグループ/チャネル/ギルド。
  - 一般的なパターン:
    - `channels.whatsapp.groups`, `channels.telegram.groups`, `channels.imessage.groups`: `requireMention` などのグループ単位のデフォルト。設定すると、グループ許可リストとしても機能します（全許可の挙動を維持するには `"*"` を含めます）。
    - `groupPolicy="allowlist"` + `groupAllowFrom`: グループセッション _内_ でボットを起動できる相手を制限します（WhatsApp/Telegram/Signal/iMessage/Microsoft Teams）。
    - `channels.discord.guilds` / `channels.slack.channels`: サーフェス単位の許可リスト + メンションのデフォルト。
  - グループチェックはこの順序で実行されます: まず `groupPolicy`/グループ許可リスト、次にメンション/返信による有効化。
  - ボットメッセージへの返信（暗黙のメンション）は、`groupAllowFrom` のような送信者許可リストを**迂回しません**。
  - **セキュリティメモ:** `dmPolicy="open"` と `groupPolicy="open"` は最後の手段として扱ってください。ほとんど使うべきではありません。ルームの全メンバーを完全に信頼している場合を除き、ペアリング + 許可リストを優先してください。

詳細: [設定](/ja-JP/gateway/configuration) と [グループ](/ja-JP/channels/groups)

## プロンプトインジェクション（それが何であり、なぜ重要か）

プロンプトインジェクションとは、攻撃者がモデルを操作して安全でないことを行わせるメッセージを作ることです（「指示を無視せよ」、「ファイルシステムを出力せよ」、「このリンクを開いてコマンドを実行せよ」など）。

強力なシステムプロンプトがあっても、**プロンプトインジェクションは解決済みではありません**。システムプロンプトのガードレールはあくまで柔らかいガイダンスです。強制力は、ツールポリシー、exec 承認、サンドボックス化、チャネル許可リストから生まれます（また、運用者は設計上これらを無効化できます）。実際に役立つこと:

- 受信 DM をロックダウンする（ペアリング/許可リスト）。
- グループではメンションゲートを優先し、公開ルームで「常時オン」のボットを避ける。
- リンク、添付ファイル、貼り付けられた指示は、デフォルトで敵対的なものとして扱う。
- 機密性の高いツール実行はサンドボックス内で行い、エージェントが到達できるファイルシステムにシークレットを置かない。
- 注: サンドボックス化はオプトインです。サンドボックスモードがオフの場合、暗黙の `host=auto` は Gateway ホストに解決されます。明示的な `host=sandbox` は、利用可能なサンドボックスランタイムがないため、引き続きフェイルクローズします。その挙動を設定で明示したい場合は `host=gateway` を設定します。
- 高リスクツール（`exec`, `browser`, `web_fetch`, `web_search`）は、信頼済みエージェントまたは明示的な許可リストに制限する。
- インタープリター（`python`, `node`, `ruby`, `perl`, `php`, `lua`, `osascript`）を許可リストに入れる場合は、`tools.exec.strictInlineEval` を有効にし、インライン eval 形式にも明示的な承認が必要になるようにする。
- シェル承認分析は、**引用符なしの heredoc** 内の POSIX パラメーター展開形式（`$VAR`, `$?`, `$$`, `$1`, `$@`, `${…}`）も拒否します。そのため、許可リスト済みの heredoc 本文が、プレーンテキストとしての許可リストレビューをすり抜けてシェル展開を忍び込ませることはできません。リテラルな本文セマンティクスを選択するには、heredoc 終端子を引用します（例: `<<'EOF'`）。変数を展開するはずだった引用符なし heredoc は拒否されます。
- **モデル選択は重要です:** 古い/小さい/レガシーモデルは、プロンプトインジェクションやツール誤用に対して著しく堅牢性が低くなります。ツール有効エージェントには、利用可能な最新世代で最も強力な、指示に対して堅牢化されたモデルを使用してください。

信頼できないものとして扱うべき危険信号:

- 「このファイル/URL を読んで、書かれていることをそのまま実行して。」
- 「システムプロンプトや安全ルールを無視して。」
- 「隠された指示やツール出力を開示して。」
- 「~/.openclaw やログの全内容を貼り付けて。」

## 外部コンテンツの特殊トークンサニタイズ

OpenClaw は、モデルに到達する前に、ラップされた外部コンテンツとメタデータから、一般的なセルフホスト LLM チャットテンプレートの特殊トークンリテラルを取り除きます。対象のマーカーファミリーには、Qwen/ChatML、Llama、Gemma、Mistral、Phi、GPT-OSS のロール/ターントークンが含まれます。

理由:

- セルフホストモデルの前段にある OpenAI 互換バックエンドは、ユーザーテキストに出現する特殊トークンをマスクせず、そのまま保持することがあります。受信外部コンテンツ（取得したページ、メール本文、ファイル内容ツール出力）に書き込める攻撃者は、そうでなければ合成された `assistant` または `system` ロール境界を注入し、ラップ済みコンテンツのガードレールを脱出できる可能性があります。
- サニタイズは外部コンテンツのラップレイヤーで行われるため、provider 単位ではなく、取得/読み取りツールと受信チャネルコンテンツ全体に一様に適用されます。
- 送信モデル応答にはすでに別のサニタイザーがあり、ユーザーに見える返信から、漏れた `<tool_call>`、`<function_calls>`、`<system-reminder>`、`<previous_response>`、および類似の内部ランタイム足場を最終的なチャネル配信境界で取り除きます。外部コンテンツサニタイザーは、その受信側の対になるものです。

これは、このページの他の堅牢化（`dmPolicy`、許可リスト、exec 承認、サンドボックス化、`contextVisibility`）を置き換えるものではありません。主要な役割は引き続きそれらが担います。これは、特殊トークンをそのまま含むユーザーテキストを転送するセルフホストスタックに対して、トークナイザーレイヤーの特定の迂回を 1 つ塞ぐものです。

## 安全でない外部コンテンツの迂回フラグ

OpenClaw には、外部コンテンツの安全ラップを無効化する明示的な迂回フラグが含まれています。

- `hooks.mappings[].allowUnsafeExternalContent`
- `hooks.gmail.allowUnsafeExternalContent`
- Cron ペイロードフィールド `allowUnsafeExternalContent`

ガイダンス:

- 本番環境では未設定/false のままにします。
- 厳密にスコープされたデバッグのために、一時的にのみ有効化します。
- 有効化する場合は、そのエージェントを分離します（サンドボックス + 最小限のツール + 専用セッション名前空間）。

フックのリスクメモ:

- フックペイロードは、配信元が自分で制御しているシステムであっても、信頼できないコンテンツです（メール/ドキュメント/Web コンテンツはプロンプトインジェクションを含み得ます）。
- 弱いモデル階層はこのリスクを高めます。フック駆動の自動化では、強力な最新モデル階層を優先し、ツールポリシーを厳しく保ちます（`tools.profile: "messaging"` またはそれ以上に厳格な設定）。可能であればサンドボックス化も併用します。

### プロンプトインジェクションに公開 DM は不要

**自分だけ**がボットにメッセージできる場合でも、ボットが読む任意の**信頼できないコンテンツ**（Web 検索/取得結果、ブラウザページ、メール、ドキュメント、添付ファイル、貼り付けられたログ/コード）を介して、プロンプトインジェクションは発生し得ます。言い換えると、送信者だけが脅威面ではありません。**コンテンツそのもの**が敵対的な指示を運ぶことがあります。

ツールが有効な場合、典型的なリスクはコンテキストの流出やツール呼び出しの誘発です。影響範囲を小さくするには:

- 信頼できないコンテンツの要約には、読み取り専用またはツール無効の**リーダーエージェント**を使用し、その要約をメインエージェントに渡します。
- ツール有効エージェントでは、必要でない限り `web_search` / `web_fetch` / `browser` をオフにしておきます。
- OpenResponses URL 入力（`input_file` / `input_image`）では、
  `gateway.http.endpoints.responses.files.urlAllowlist` と
  `gateway.http.endpoints.responses.images.urlAllowlist` を厳しく設定し、`maxUrlParts` を低く保ちます。
  空の許可リストは未設定として扱われます。URL 取得を完全に無効化したい場合は、`files.allowUrl: false` / `images.allowUrl: false` を使用します。
- OpenResponses ファイル入力では、デコードされた `input_file` テキストも
  **信頼できない外部コンテンツ**として注入されます。Gateway がローカルでデコードしたからといって、ファイルテキストが信頼済みであるとは考えないでください。注入されるブロックには、この経路では長い `SECURITY NOTICE:` バナーが省略されるものの、明示的な `<<<EXTERNAL_UNTRUSTED_CONTENT ...>>>` 境界マーカーと `Source: External` メタデータが引き続き含まれます。
- 添付ドキュメントからメディア理解がテキストを抽出し、そのテキストをメディアプロンプトに追加する場合にも、同じマーカーベースのラップが適用されます。
- 信頼できない入力に触れるすべてのエージェントで、サンドボックス化と厳格なツール許可リストを有効にします。
- シークレットをプロンプトに含めないでください。代わりに Gateway ホスト上の env/設定経由で渡します。

### セルフホスト LLM バックエンド

vLLM、SGLang、TGI、LM Studio、またはカスタム Hugging Face トークナイザースタックなどの OpenAI 互換セルフホストバックエンドは、チャットテンプレートの特殊トークンの扱いがホスト型 provider と異なることがあります。バックエンドが `<|im_start|>`、`<|start_header_id|>`、`<start_of_turn>` のようなリテラル文字列を、ユーザーコンテンツ内で構造的なチャットテンプレートトークンとしてトークン化する場合、信頼できないテキストがトークナイザーレイヤーでロール境界を偽造しようとする可能性があります。

OpenClaw は、モデルへ送信する前に、ラップされた外部コンテンツから一般的なモデルファミリーの特殊トークンリテラルを取り除きます。外部コンテンツのラップを有効に保ち、利用可能な場合は、ユーザー提供コンテンツ内の特殊トークンを分割またはエスケープするバックエンド設定を優先してください。OpenAI や Anthropic などのホスト型 provider は、すでに独自のリクエスト側サニタイズを適用しています。

### モデルの強さ（セキュリティメモ）

プロンプトインジェクション耐性は、モデル階層全体で**一様ではありません**。小さい/安価なモデルは、特に敵対的なプロンプト下では、一般にツール誤用や指示の乗っ取りを受けやすくなります。

<Warning>
ツール有効エージェント、または信頼できないコンテンツを読むエージェントでは、古い/小さいモデルによるプロンプトインジェクションリスクは高すぎることがよくあります。そのようなワークロードを弱いモデル階層で実行しないでください。
</Warning>

推奨事項:

- ツールを実行できる、またはファイル/ネットワークに触れるボットには、**最新世代の最上位モデル**を使用します。
- ツール有効エージェントや信頼できない受信箱には、**古い/弱い/小さい階層を使用しないでください**。プロンプトインジェクションリスクが高すぎます。
- 小さいモデルを使わざるを得ない場合は、**影響範囲を小さくします**（読み取り専用ツール、強力なサンドボックス化、最小限のファイルシステムアクセス、厳格な許可リスト）。
- 小さいモデルを実行する場合は、入力が厳密に制御されていない限り、**すべてのセッションでサンドボックス化を有効にし**、**web_search/web_fetch/browser を無効化します**。
- 信頼済み入力のみでツールを使わないチャット専用の個人アシスタントでは、小さいモデルでも通常は問題ありません。

## グループでの推論と詳細出力

`/reasoning`、`/verbose`、`/trace` は、公開チャネル向けではない内部推論、ツール出力、または Plugin 診断を露出する可能性があります。グループ設定では、これらを**デバッグ専用**として扱い、明示的に必要な場合を除いてオフにしておきます。

ガイダンス:

- 公開ルームでは `/reasoning`、`/verbose`、`/trace` を無効のままにします。
- 有効化する場合は、信頼済み DM または厳密に管理されたルームでのみ行います。
- 注意: 詳細出力とトレース出力には、ツール引数、URL、Plugin 診断、モデルが見たデータが含まれる場合があります。

## 設定堅牢化の例

### ファイル権限

Gateway ホスト上の設定 + 状態を非公開に保ちます。

- `~/.openclaw/openclaw.json`: `600`（ユーザーの読み取り/書き込みのみ）
- `~/.openclaw`: `700`（ユーザーのみ）

`openclaw doctor` は、これらの権限について警告し、厳格化を提案できます。

### ネットワーク公開（バインド、ポート、ファイアウォール）

Gateway は単一ポート上で **WebSocket + HTTP** を多重化します。

- デフォルト: `18789`
- 設定/フラグ/env: `gateway.port`, `--port`, `OPENCLAW_GATEWAY_PORT`

この HTTP サーフェスには Control UI とキャンバスホストが含まれます。

- Control UI（SPA アセット）（デフォルトベースパス `/`）
- キャンバスホスト: `/__openclaw__/canvas/` と `/__openclaw__/a2ui/`（任意の HTML/JS。信頼できないコンテンツとして扱ってください）

通常のブラウザでキャンバスコンテンツを読み込む場合は、他の信頼できない Web ページと同様に扱ってください。

- キャンバスホストを信頼できないネットワーク/ユーザーに公開しないでください。
- 影響を完全に理解していない限り、キャンバスコンテンツが特権のある Web サーフェスと同じオリジンを共有しないようにしてください。

バインドモードは、Gateway がどこで待ち受けるかを制御します。

- `gateway.bind: "loopback"` (デフォルト): ローカルクライアントだけが接続できます。
- 非 loopback バインド (`"lan"`、`"tailnet"`、`"custom"`) は攻撃対象領域を広げます。Gateway 認証 (共有トークン/パスワード、または正しく構成された信頼済みプロキシ) と実際のファイアウォールを併用する場合だけ使ってください。

経験則:

- LAN バインドより Tailscale Serve を優先してください (Serve は Gateway を loopback のままにし、Tailscale がアクセスを処理します)。
- LAN にバインドする必要がある場合は、ポートを送信元 IP の厳密な許可リストにファイアウォールで制限してください。広範囲にポートフォワードしないでください。
- Gateway を認証なしで `0.0.0.0` に公開しないでください。

### UFW を使った Docker ポート公開

VPS 上で Docker を使って OpenClaw を実行する場合、公開されたコンテナポート
(`-p HOST:CONTAINER` または Compose の `ports:`) は、ホストの `INPUT` ルールだけでなく、Docker の転送
チェーンを通ってルーティングされることに注意してください。

Docker トラフィックをファイアウォールポリシーと揃えるには、
`DOCKER-USER` でルールを適用します (このチェーンは Docker 自身の accept ルールより前に評価されます)。
多くの最新ディストリビューションでは、`iptables`/`ip6tables` は `iptables-nft` フロントエンドを使用し、
それでもこれらのルールを nftables バックエンドに適用します。

最小限の許可リスト例 (IPv4):

```bash
# /etc/ufw/after.rules (append as its own *filter section)
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

IPv6 には別のテーブルがあります。
Docker IPv6 が有効な場合は、`/etc/ufw/after6.rules` に対応するポリシーを追加してください。

ドキュメントのスニペットで `eth0` のようなインターフェイス名をハードコードしないでください。インターフェイス名は
VPS イメージによって異なり (`ens3`、`enp*` など)、不一致があると deny ルールが誤って
スキップされる可能性があります。

リロード後の簡易検証:

```bash
ufw reload
iptables -S DOCKER-USER
ip6tables -S DOCKER-USER
nmap -sT -p 1-65535 <public-ip> --open
```

外部に見える想定ポートは、意図して公開したものだけであるべきです (ほとんどの
セットアップでは SSH + リバースプロキシのポート)。

### mDNS/Bonjour 検出

同梱の `bonjour` plugin が有効な場合、Gateway はローカルデバイス検出のために mDNS (ポート 5353 の `_openclaw-gw._tcp`) で存在をブロードキャストします。full モードでは、運用上の詳細を露出する可能性がある TXT レコードが含まれます。

- `cliPath`: CLI バイナリへの完全なファイルシステムパス (ユーザー名とインストール場所を明かします)
- `sshPort`: ホスト上で SSH が利用可能であることを通知します
- `displayName`、`lanHost`: ホスト名情報

**運用セキュリティ上の考慮事項:** インフラの詳細をブロードキャストすると、ローカルネットワーク上の誰にとっても偵察が容易になります。ファイルシステムパスや SSH の可用性のような「無害」に見える情報でも、攻撃者が環境を把握する助けになります。

**推奨事項:**

1. **LAN 検出が必要でない限り、Bonjour は無効のままにしてください。** Bonjour は macOS ホストでは自動起動し、その他ではオプトインです。直接の Gateway URL、Tailnet、SSH、または広域 DNS-SD を使えば、ローカルマルチキャストを避けられます。

2. **minimal モード** (Bonjour 有効時のデフォルト、公開された Gateway に推奨): mDNS ブロードキャストから機密フィールドを省略します。

   ```json5
   {
     discovery: {
       mdns: { mode: "minimal" },
     },
   }
   ```

3. Plugin は有効のままにしつつローカルデバイス検出を抑止したい場合は、**mDNS モードを無効化**します。

   ```json5
   {
     discovery: {
       mdns: { mode: "off" },
     },
   }
   ```

4. **full モード** (オプトイン): TXT レコードに `cliPath` + `sshPort` を含めます。

   ```json5
   {
     discovery: {
       mdns: { mode: "full" },
     },
   }
   ```

5. **環境変数** (代替): 設定変更なしで mDNS を無効にするには、`OPENCLAW_DISABLE_BONJOUR=1` を設定します。

Bonjour が minimal モードで有効な場合、Gateway はデバイス検出に十分な情報 (`role`、`gatewayPort`、`transport`) をブロードキャストしますが、`cliPath` と `sshPort` は省略します。CLI パス情報が必要なアプリは、代わりに認証済み WebSocket 接続経由で取得できます。

### Gateway WebSocket をロックダウンする (ローカル認証)

Gateway 認証は**デフォルトで必須**です。有効な gateway 認証パスが構成されていない場合、
Gateway は WebSocket 接続を拒否します (fail-closed)。

オンボーディングはデフォルトでトークンを生成するため (loopback の場合でも)、
ローカルクライアントは認証する必要があります。

**すべての** WS クライアントに認証を要求するには、トークンを設定します。

```json5
{
  gateway: {
    auth: { mode: "token", token: "your-token" },
  },
}
```

Doctor で生成できます: `openclaw doctor --generate-gateway-token`。

<Note>
`gateway.remote.token` と `gateway.remote.password` はクライアント資格情報のソースです。それ自体ではローカル WS アクセスを保護しません。ローカル呼び出しパスは、`gateway.auth.*` が未設定の場合に限り、フォールバックとして `gateway.remote.*` を使用できます。`gateway.auth.token` または `gateway.auth.password` が SecretRef 経由で明示的に構成されていて未解決の場合、解決は fail closed になります (remote フォールバックによる隠蔽はありません)。
</Note>
任意: `wss://` を使用する場合は、`gateway.remote.tlsFingerprint` でリモート TLS をピン留めします。
平文の `ws://` はデフォルトで loopback 専用です。信頼済みプライベートネットワーク
パスでは、break-glass としてクライアントプロセスに
`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` を設定します。これは意図的にプロセス環境のみであり、
`openclaw.json` 設定キーではありません。
モバイルペアリング、および Android の手動またはスキャンされた gateway ルートはより厳格です:
cleartext は loopback では受け入れられますが、private-LAN、link-local、`.local`、および
ドットなしホスト名では、信頼済みプライベートネットワークの cleartext パスへ明示的にオプトインしない限り TLS が必要です。

ローカルデバイスのペアリング:

- 同一ホストのクライアントを滑らかにするため、直接の local loopback 接続ではデバイスペアリングが自動承認されます。
- OpenClaw には、信頼済み共有シークレットのヘルパーフロー向けに、狭く限定された backend/container-local 自己接続パスもあります。
- 同一ホストの tailnet バインドを含む Tailnet および LAN 接続は、ペアリングではリモートとして扱われ、引き続き承認が必要です。
- loopback リクエスト上の forwarded-header 証拠は、loopback ローカリティの資格を失わせます。metadata-upgrade の自動承認は狭くスコープされています。両方のルールについては [Gateway ペアリング](/ja-JP/gateway/pairing) を参照してください。

認証モード:

- `gateway.auth.mode: "token"`: 共有 bearer token (ほとんどのセットアップに推奨)。
- `gateway.auth.mode: "password"`: パスワード認証 (env 経由での設定を推奨: `OPENCLAW_GATEWAY_PASSWORD`)。
- `gateway.auth.mode: "trusted-proxy"`: identity-aware なリバースプロキシがユーザーを認証し、ヘッダー経由で identity を渡すことを信頼します ([Trusted Proxy Auth](/ja-JP/gateway/trusted-proxy-auth) を参照)。

ローテーションチェックリスト (トークン/パスワード):

1. 新しいシークレット (`gateway.auth.token` または `OPENCLAW_GATEWAY_PASSWORD`) を生成/設定します。
2. Gateway を再起動します (または macOS アプリが Gateway を監督している場合は macOS アプリを再起動します)。
3. すべてのリモートクライアントを更新します (Gateway を呼び出すマシン上の `gateway.remote.token` / `.password`)。
4. 古い資格情報で接続できなくなったことを確認します。

### Tailscale Serve identity ヘッダー

`gateway.auth.allowTailscale` が `true` の場合 (Serve のデフォルト)、OpenClaw は Control
UI/WebSocket 認証のために Tailscale Serve identity ヘッダー (`tailscale-user-login`) を
受け入れます。OpenClaw は、ローカル Tailscale デーモン (`tailscale whois`) を通じて
`x-forwarded-for` アドレスを解決し、それをヘッダーと照合することで identity を検証します。これは loopback に到達し、
Tailscale によって注入される `x-forwarded-for`、`x-forwarded-proto`、`x-forwarded-host` を含む
リクエストに対してのみ発動します。
この非同期 identity チェックパスでは、同じ `{scope, ip}` の失敗試行は、limiter が失敗を記録する前に直列化されます。そのため、1 つの Serve クライアントからの並行した不正な再試行は、2 つの単純な不一致として競合して通過する代わりに、2 回目の試行を即座にロックアウトできます。
HTTP API エンドポイント (たとえば `/v1/*`、`/tools/invoke`、`/api/channels/*`) は
Tailscale identity-header 認証を使用**しません**。これらは引き続き gateway に構成された
HTTP 認証モードに従います。

重要な境界メモ:

- Gateway HTTP bearer 認証は、実質的にオペレーターアクセスの全部か無かです。
- `/v1/chat/completions`、`/v1/responses`、または `/api/channels/*` を呼び出せる資格情報は、その gateway に対するフルアクセスのオペレーターシークレットとして扱ってください。
- OpenAI 互換 HTTP サーフェスでは、共有シークレットの bearer 認証により、完全なデフォルトのオペレータースコープ (`operator.admin`、`operator.approvals`、`operator.pairing`、`operator.read`、`operator.talk.secrets`、`operator.write`) とエージェントターンの owner セマンティクスが復元されます。より狭い `x-openclaw-scopes` 値は、その共有シークレットパスを縮小しません。
- HTTP 上のリクエストごとのスコープセマンティクスは、trusted proxy auth やプライベート ingress 上の `gateway.auth.mode="none"` のような identity-bearing モードからリクエストが来る場合にのみ適用されます。
- それらの identity-bearing モードでは、`x-openclaw-scopes` を省略すると通常のオペレーターデフォルトスコープセットにフォールバックします。より狭いスコープセットが必要な場合は、ヘッダーを明示的に送信してください。
- `/tools/invoke` は同じ共有シークレットルールに従います。token/password bearer 認証はここでもフルオペレーターアクセスとして扱われます。一方、identity-bearing モードは引き続き宣言されたスコープを尊重します。
- これらの資格情報を信頼できない呼び出し元と共有しないでください。信頼境界ごとに別々の gateway を使うことを推奨します。

**信頼の前提:** tokenless Serve auth は gateway ホストが信頼済みであることを前提にします。
これを、同一ホスト上の敵対的プロセスからの保護として扱わないでください。信頼できない
ローカルコードが gateway ホストで実行される可能性がある場合は、`gateway.auth.allowTailscale` を無効化し、
`gateway.auth.mode: "token"` または
`"password"` による明示的な共有シークレット認証を必須にしてください。

**セキュリティルール:** これらのヘッダーを自分のリバースプロキシから転送しないでください。
Gateway の前段で TLS 終端またはプロキシを行う場合は、
`gateway.auth.allowTailscale` を無効化し、共有シークレット認証 (`gateway.auth.mode:
"token"` または `"password"`) または [Trusted Proxy Auth](/ja-JP/gateway/trusted-proxy-auth)
を代わりに使用してください。

信頼済みプロキシ:

- Gateway の前段で TLS 終端する場合は、`gateway.trustedProxies` をプロキシ IP に設定します。
- OpenClaw は、それらの IP からの `x-forwarded-for` (または `x-real-ip`) を信頼し、ローカルペアリングチェックと HTTP 認証/ローカルチェックのためのクライアント IP を判定します。
- プロキシが `x-forwarded-for` を**上書き**し、Gateway ポートへの直接アクセスをブロックしていることを確認してください。

[Tailscale](/ja-JP/gateway/tailscale) と [Web 概要](/ja-JP/web) を参照してください。

### node host 経由のブラウザ制御 (推奨)

Gateway がリモートにあり、ブラウザが別のマシンで動作している場合は、ブラウザマシン上で **node host** を実行し、
Gateway にブラウザ操作をプロキシさせます ([Browser tool](/ja-JP/tools/browser) を参照)。
node pairing は管理者アクセスのように扱ってください。

推奨パターン:

- Gateway と node host を同じ tailnet (Tailscale) 上に置きます。
- node を意図的にペアリングします。不要な場合はブラウザプロキシルーティングを無効化します。

避けること:

- relay/control ポートを LAN や公開 Internet に公開する。
- ブラウザ制御エンドポイントに Tailscale Funnel を使う (公開露出)。

### ディスク上のシークレット

`~/.openclaw/` (または `$OPENCLAW_STATE_DIR/`) 配下のものはすべて、シークレットまたはプライベートデータを含む可能性があると想定してください。

- `openclaw.json`: 設定にはトークン (gateway、remote gateway)、プロバイダー設定、許可リストが含まれる場合があります。
- `credentials/**`: チャンネル資格情報 (例: WhatsApp 資格情報)、ペアリング許可リスト、レガシー OAuth インポート。
- `agents/<agentId>/agent/auth-profiles.json`: API キー、トークンプロファイル、OAuth トークン、任意の `keyRef`/`tokenRef`。
- `agents/<agentId>/agent/codex-home/**`: エージェントごとの Codex app-server アカウント、設定、skills、plugins、ネイティブスレッド状態、診断。
- `secrets.json` (任意): `file` SecretRef プロバイダー (`secrets.providers`) によって使用されるファイル backed のシークレットペイロード。
- `agents/<agentId>/agent/auth.json`: レガシー互換ファイル。静的な `api_key` エントリは検出時にスクラブされます。
- `agents/<agentId>/sessions/**`: セッショントランスクリプト (`*.jsonl`) + ルーティングメタデータ (`sessions.json`)。プライベートメッセージやツール出力を含む可能性があります。
- bundled plugin packages: インストール済み plugins (およびそれらの `node_modules/`)。
- `sandboxes/**`: ツールサンドボックスのワークスペース。サンドボックス内で読み書きしたファイルのコピーが蓄積される可能性があります。

堅牢化のヒント:

- 権限を厳格に保つ（ディレクトリは `700`、ファイルは `600`）。
- Gateway ホストでフルディスク暗号化を使用する。
- ホストを共有している場合は、Gateway 専用の OS ユーザーアカウントを使用することを推奨します。

### ワークスペースの `.env` ファイル

OpenClaw はエージェントとツール用にワークスペースローカルの `.env` ファイルを読み込みますが、それらのファイルが Gateway のランタイム制御を暗黙に上書きすることは決して許可しません。

- `OPENCLAW_*` で始まるキーは、信頼されていないワークスペースの `.env` ファイルからはブロックされます。
- Matrix、Mattermost、IRC、Synology Chat のチャネルエンドポイント設定も、ワークスペース `.env` による上書きからブロックされます。そのため、クローンされたワークスペースがローカルエンドポイント設定を通じて同梱コネクタのトラフィックをリダイレクトすることはできません。エンドポイント環境変数キー（`MATRIX_HOMESERVER`、`MATTERMOST_URL`、`IRC_HOST`、`SYNOLOGY_CHAT_INCOMING_URL` など）は、ワークスペースから読み込まれる `.env` ではなく、Gateway プロセス環境または `env.shellEnv` から取得する必要があります。
- ブロックはフェイルクローズです。将来のリリースで新しいランタイム制御変数が追加されても、チェックイン済みまたは攻撃者が提供した `.env` から継承されることはありません。そのキーは無視され、Gateway は自身の値を維持します。
- 信頼されたプロセス/OS 環境変数（Gateway 自身のシェル、launchd/systemd ユニット、アプリバンドル）は引き続き適用されます。これは `.env` ファイルの読み込みだけを制限します。

理由: ワークスペースの `.env` ファイルは、エージェントコードの隣に置かれることが多く、誤ってコミットされたり、ツールによって書き込まれたりします。`OPENCLAW_*` プレフィックス全体をブロックすることで、後から新しい `OPENCLAW_*` フラグを追加しても、ワークスペース状態から暗黙に継承される退行は決して起きません。

### ログとトランスクリプト（墨消しと保持）

ログとトランスクリプトは、アクセス制御が正しくても機密情報を漏えいする可能性があります:

- Gateway ログには、ツールの要約、エラー、URL が含まれる場合があります。
- セッショントランスクリプトには、貼り付けられたシークレット、ファイル内容、コマンド出力、リンクが含まれる場合があります。

推奨事項:

- ログとトランスクリプトの墨消しをオンのままにします（`logging.redactSensitive: "tools"`、デフォルト）。
- `logging.redactPatterns` で自分の環境向けのカスタムパターン（トークン、ホスト名、内部 URL）を追加します。
- 診断情報を共有するときは、生ログではなく `openclaw status --all`（貼り付け可能で、シークレットは墨消し済み）を推奨します。
- 長期保持が不要な場合は、古いセッショントランスクリプトとログファイルを削除します。

詳細: [ロギング](/ja-JP/gateway/logging)

### DM: デフォルトでペアリング

```json5
{
  channels: { whatsapp: { dmPolicy: "pairing" } },
}
```

### グループ: すべての場所でメンションを必須にする

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

グループチャットでは、明示的にメンションされた場合にのみ応答します。

### 番号を分ける（WhatsApp、Signal、Telegram）

電話番号ベースのチャネルでは、個人用とは別の電話番号で AI を実行することを検討してください:

- 個人用番号: 会話を非公開に保てます
- ボット用番号: AI が適切な境界のもとで対応します

### 読み取り専用モード（サンドボックスとツール経由）

次を組み合わせることで、読み取り専用プロファイルを構築できます:

- `agents.defaults.sandbox.workspaceAccess: "ro"`（ワークスペースアクセスなしの場合は `"none"`）
- `write`、`edit`、`apply_patch`、`exec`、`process` などをブロックするツールの許可/拒否リスト

追加の堅牢化オプション:

- `tools.exec.applyPatch.workspaceOnly: true`（デフォルト）: サンドボックスがオフの場合でも、`apply_patch` がワークスペースディレクトリの外に書き込み/削除できないようにします。`apply_patch` が意図的にワークスペース外のファイルに触れる必要がある場合にのみ `false` に設定してください。
- `tools.fs.workspaceOnly: true`（任意）: `read`/`write`/`edit`/`apply_patch` のパスと、ネイティブプロンプト画像の自動読み込みパスをワークスペースディレクトリに制限します（現在絶対パスを許可していて、単一のガードレールが必要な場合に有用です）。
- ファイルシステムルートは狭く保ちます。エージェントワークスペース/サンドボックスワークスペースに、自分のホームディレクトリのような広いルートを使うことは避けてください。広いルートは、機密性の高いローカルファイル（たとえば `~/.openclaw` 配下の状態/設定）をファイルシステムツールに露出させる可能性があります。

### セキュアなベースライン（コピー/貼り付け）

Gateway を非公開に保ち、DM ペアリングを必須にし、常時稼働のグループボットを避ける「安全なデフォルト」設定の一例です:

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

ツール実行も「デフォルトでより安全」にしたい場合は、非所有者エージェントに対してサンドボックスと危険なツールの拒否を追加してください（下の「エージェントごとのアクセスプロファイル」の例を参照）。

チャット駆動のエージェントターン向けの組み込みベースライン: 非所有者の送信者は `cron` または `gateway` ツールを使用できません。

## サンドボックス化（推奨）

専用ドキュメント: [サンドボックス化](/ja-JP/gateway/sandboxing)

相互補完する 2 つのアプローチ:

- **Gateway 全体を Docker で実行する**（コンテナ境界）: [Docker](/ja-JP/install/docker)
- **ツールサンドボックス**（`agents.defaults.sandbox`、ホスト Gateway + サンドボックス隔離されたツール。Docker がデフォルトのバックエンド）: [サンドボックス化](/ja-JP/gateway/sandboxing)

<Note>
エージェント間アクセスを防ぐには、`agents.defaults.sandbox.scope` を `"agent"`（デフォルト）のままにするか、より厳格なセッション単位の分離には `"session"` を使用します。`scope: "shared"` は単一のコンテナまたはワークスペースを使用します。
</Note>

サンドボックス内のエージェントワークスペースアクセスも検討してください:

- `agents.defaults.sandbox.workspaceAccess: "none"`（デフォルト）は、エージェントワークスペースをアクセス不可に保ちます。ツールは `~/.openclaw/sandboxes` 配下のサンドボックスワークスペースに対して実行されます
- `agents.defaults.sandbox.workspaceAccess: "ro"` は、エージェントワークスペースを `/agent` に読み取り専用でマウントします（`write`/`edit`/`apply_patch` を無効化）
- `agents.defaults.sandbox.workspaceAccess: "rw"` は、エージェントワークスペースを `/workspace` に読み書き可能でマウントします
- 追加の `sandbox.docker.binds` は、正規化および正準化されたソースパスに対して検証されます。親シンボリックリンクのトリックや正準的なホームエイリアスも、`/etc`、`/var/run`、OS ホーム配下の認証情報ディレクトリなど、ブロックされたルートへ解決される場合はフェイルクローズします。

<Warning>
`tools.elevated` は、サンドボックス外で exec を実行するグローバルベースラインのエスケープハッチです。有効なホストはデフォルトで `gateway`、exec ターゲットが `node` に設定されている場合は `node` です。`tools.elevated.allowFrom` は厳格に保ち、見知らぬ相手に対して有効にしないでください。`agents.list[].tools.elevated` によって、エージェントごとに elevated をさらに制限できます。[Elevated モード](/ja-JP/tools/elevated)を参照してください。
</Warning>

### サブエージェント委譲のガードレール

セッションツールを許可する場合、委譲されたサブエージェント実行も別の境界判断として扱ってください:

- エージェントが委譲を本当に必要とする場合を除き、`sessions_spawn` を拒否します。
- `agents.defaults.subagents.allowAgents` と、エージェントごとの `agents.list[].subagents.allowAgents` 上書きは、既知の安全なターゲットエージェントに制限します。
- サンドボックス化を維持する必要があるワークフローでは、`sandbox: "require"` を指定して `sessions_spawn` を呼び出します（デフォルトは `inherit`）。
- `sandbox: "require"` は、ターゲットの子ランタイムがサンドボックス化されていない場合に高速に失敗します。

## ブラウザー制御のリスク

ブラウザー制御を有効にすると、モデルが実際のブラウザーを操作できるようになります。
そのブラウザープロファイルにログイン済みセッションがすでに含まれている場合、モデルは
それらのアカウントとデータにアクセスできます。ブラウザープロファイルは **機密状態** として扱ってください:

- エージェント専用のプロファイル（デフォルトの `openclaw` プロファイル）を推奨します。
- エージェントを個人の日常利用プロファイルに向けることは避けてください。
- サンドボックス化されたエージェントでは、信頼できる場合を除き、ホストのブラウザー制御を無効に保ちます。
- スタンドアロンの loopback ブラウザー制御 API は、共有シークレット認証（Gateway トークンベアラー認証または Gateway パスワード）だけを尊重します。trusted-proxy または Tailscale Serve の ID ヘッダーは使用しません。
- ブラウザーのダウンロードは信頼されていない入力として扱います。分離されたダウンロードディレクトリを推奨します。
- 可能であれば、エージェントプロファイルでブラウザー同期/パスワードマネージャーを無効にします（影響範囲を縮小します）。
- リモート Gateway では、「ブラウザー制御」は、そのプロファイルが到達できる対象への「オペレーターアクセス」と同等だと想定してください。
- Gateway とノードホストは tailnet 専用に保ちます。ブラウザー制御ポートを LAN や公開インターネットに露出させないでください。
- 不要な場合はブラウザープロキシルーティングを無効にします（`gateway.nodes.browser.mode="off"`）。
- Chrome MCP の既存セッションモードは「より安全」では**ありません**。そのホストの Chrome プロファイルが到達できる範囲で、あなたとして動作できます。

### ブラウザー SSRF ポリシー（デフォルトで厳格）

OpenClaw のブラウザーナビゲーションポリシーはデフォルトで厳格です。明示的にオプトインしない限り、プライベート/内部宛先はブロックされたままです。

- デフォルト: `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` は未設定のため、ブラウザーナビゲーションはプライベート/内部/特殊用途の宛先をブロックし続けます。
- レガシーエイリアス: 互換性のため、`browser.ssrfPolicy.allowPrivateNetwork` も引き続き受け付けられます。
- オプトインモード: プライベート/内部/特殊用途の宛先を許可するには、`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true` を設定します。
- 厳格モードでは、明示的な例外に `hostnameAllowlist`（`*.example.com` のようなパターン）と `allowedHostnames`（`localhost` のようなブロック対象名を含む完全一致ホスト例外）を使用します。
- リダイレクトベースのピボットを減らすため、ナビゲーションはリクエスト前にチェックされ、ナビゲーション後の最終 `http(s)` URL でもベストエフォートで再チェックされます。

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

## エージェントごとのアクセスプロファイル（マルチエージェント）

マルチエージェントルーティングでは、各エージェントが独自のサンドボックス + ツールポリシーを持てます:
これを使用して、エージェントごとに **フルアクセス**、**読み取り専用**、または **アクセスなし** を付与します。
詳細と優先順位ルールについては、[マルチエージェントのサンドボックスとツール](/ja-JP/tools/multi-agent-sandbox-tools)を参照してください。

一般的なユースケース:

- 個人用エージェント: フルアクセス、サンドボックスなし
- 家族/仕事用エージェント: サンドボックス化 + 読み取り専用ツール
- 公開エージェント: サンドボックス化 + ファイルシステム/シェルツールなし

### 例: フルアクセス（サンドボックスなし）

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

### 例: ファイルシステム/シェルアクセスなし（プロバイダーメッセージングは許可）

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
        // Session tools can reveal sensitive data from transcripts. By default OpenClaw limits these tools
        // to the current session + spawned subagent sessions, but you can clamp further if needed.
        // See `tools.sessions.visibility` in the configuration reference.
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

AI が悪いことをした場合:

### 封じ込め

1. **停止する:** macOS アプリ（Gateway を監視している場合）を停止するか、`openclaw gateway` プロセスを終了します。
2. **露出を閉じる:** 何が起きたか把握するまで、`gateway.bind: "loopback"` を設定する（または Tailscale Funnel/Serve を無効にする）。
3. **アクセスを凍結する:** リスクのある DM/グループを `dmPolicy: "disabled"` に切り替えるかメンション必須にし、`"*"` の全許可エントリがある場合は削除します。

### ローテーション（シークレットが漏えいした場合は侵害を想定）

1. Gateway 認証（`gateway.auth.token` / `OPENCLAW_GATEWAY_PASSWORD`）をローテーションして再起動します。
2. Gateway を呼び出せるすべてのマシンで、リモートクライアントシークレット（`gateway.remote.token` / `.password`）をローテーションします。
3. プロバイダー/API 認証情報（WhatsApp 認証情報、Slack/Discord トークン、`auth-profiles.json` 内のモデル/API キー、使用している場合は暗号化シークレットペイロード値）をローテーションします。

### 監査

1. Gateway ログを確認します: `/tmp/openclaw/openclaw-YYYY-MM-DD.log`（または `logging.file`）。
2. 関連するトランスクリプトを確認します: `~/.openclaw/agents/<agentId>/sessions/*.jsonl`。
3. 最近の設定変更（アクセスを広げた可能性があるもの: `gateway.bind`、`gateway.auth`、DM/グループポリシー、`tools.elevated`、Plugin の変更）を確認します。
4. `openclaw security audit --deep` を再実行し、重大な検出事項が解決されていることを確認します。

### レポート用に収集するもの

- タイムスタンプ、Gateway ホスト OS + OpenClaw バージョン
- セッションのトランスクリプト + 短いログ末尾（編集後）
- 攻撃者が送信した内容 + エージェントが実行したこと
- Gateway が loopback を超えて露出していたかどうか（LAN/Tailscale Funnel/Serve）

## シークレットスキャン

CI はリポジトリ全体に対して pre-commit の `detect-private-key` フックを実行します。失敗した場合は、コミットされた鍵素材を削除またはローテーションしてから、ローカルで再現します:

```bash
pre-commit run --all-files detect-private-key
```

## セキュリティ問題の報告

OpenClaw に脆弱性を見つけましたか？責任ある方法で報告してください:

1. メール: [security@openclaw.ai](mailto:security@openclaw.ai)
2. 修正されるまで公開しないでください
3. クレジットを記載します（匿名を希望する場合を除く）
