---
read_when:
    - OpenClaw の設定を、作成済みの `policy.jsonc` と照合したい
    - doctor lint にポリシー検出結果が必要です
    - 監査証跡にはポリシー証明ハッシュが必要です
summary: '`openclaw policy` 適合性チェックの CLI リファレンス'
title: ポリシー
x-i18n:
    generated_at: "2026-06-27T11:00:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5af65bb34aeed72bbb348a56195d65152dce1e8d0e7236da8d8681e56c9b32f4
    source_path: cli/policy.md
    workflow: 16
---

# `openclaw policy`

`openclaw policy` は、同梱の Policy plugin によって提供されます。Policy は、既存の OpenClaw 設定の上にあるエンタープライズ向け適合レイヤーです。第二の設定システムを追加するものではありません。`policy.jsonc` は作成された要件を定義し、OpenClaw はアクティブなワークスペースを証拠として観測し、policy ヘルスチェックは `doctor --lint` を通じてドリフトを報告します。最終的な適合シグナルは、問題のない `doctor --lint` 実行です。policy は、別個のヘルスゲートを作成するのではなく、その共有 lint サーフェスに検出結果を提供します。

Policy は現在、設定済みチャンネル、MCP サーバー、モデルプロバイダー、ネットワーク SSRF 姿勢、ingress/チャンネルアクセス姿勢、Gateway 公開姿勢、エージェントワークスペース姿勢、データ処理姿勢、OpenClaw 設定のシークレットプロバイダー/auth プロファイル姿勢、および管理対象ツール宣言を管理します。たとえば、IT またはワークスペース運用者は、Telegram が承認済みチャンネルプロバイダーではないことを記録し、MCP サーバーとモデル参照を承認済みエントリに制限し、プライベートネットワークの fetch/browser アクセスを無効のままにすることを要求し、ダイレクトメッセージのセッション分離とチャンネル ingress 姿勢をレビュー済みの範囲内に維持することを要求し、Gateway の bind/auth/HTTP 公開をレビュー済みの範囲内に維持することを要求し、エージェントワークスペースアクセスとツール拒否をレビュー済み姿勢に維持することを要求し、OpenClaw 設定の SecretRef に管理対象プロバイダーを使用することを要求し、設定 auth プロファイルに provider/mode メタデータを持たせることを要求し、管理対象ツールにリスクと機密性のメタデータを持たせることを要求し、機密ログのリダクションを要求し、テレメトリのコンテンツ取得を拒否し、セッション保持メンテナンスを要求し、セッショントランスクリプトのメモリインデックス化を拒否し、そのうえで `doctor --lint` を共有適合ゲートとして使用できます。

ワークスペースに「これらのチャンネルは有効化してはならない」や「管理対象ツールは承認メタデータを宣言しなければならない」といった永続的な宣言と、OpenClaw がその宣言に引き続き適合していることを証明する反復可能な方法が必要な場合に、policy を使用します。ローカルの挙動だけが必要で、policy の検出結果や証明出力が不要な場合は、通常の設定とワークスペースドキュメントだけを使用してください。

## クイックスタート

初回使用前に、同梱の Policy plugin を有効化します。

```bash
openclaw plugins enable policy
```

policy が有効な場合、doctor は任意の plugins をアクティブ化せずに policy ヘルスチェックを読み込めます。`policy.jsonc` が存在しない場合でも plugin は有効なままなので、doctor は欠落している成果物を報告できます。

Policy は作成するものであり、ユーザーの現在の設定から生成されるものではありません。チャンネル、MCP サーバー、モデルプロバイダー、ネットワーク姿勢、ingress/チャンネルアクセス、Gateway 公開、エージェントワークスペース姿勢、設定済み sandbox ランタイム姿勢、OpenClaw データ処理姿勢、設定シークレットプロバイダー/auth プロファイル姿勢、exec 承認ファイル姿勢、およびツールメタデータの最小 policy は次のようになります。

```jsonc
{
  "channels": {
    "denyRules": [
      {
        "id": "no-telegram",
        "when": { "provider": "telegram" },
        "reason": "Telegram is not approved for this workspace.",
      },
    ],
  },
  "mcp": {
    "servers": {
      "allow": ["docs"],
      "deny": ["untrusted"],
    },
  },
  "models": {
    "providers": {
      "allow": ["openai", "anthropic"],
      "deny": ["openrouter"],
    },
  },
  "network": {
    "privateNetwork": {
      "allow": false,
    },
  },
  "ingress": {
    "session": {
      "requireDmScope": "per-channel-peer",
    },
    "channels": {
      "allowDmPolicies": ["pairing", "allowlist", "disabled"],
      "denyOpenGroups": true,
      "requireMentionInGroups": true,
    },
  },
  "gateway": {
    "exposure": {
      "allowNonLoopbackBind": false,
      "allowTailscaleFunnel": false,
    },
    "auth": {
      "requireAuth": true,
      "requireExplicitRateLimit": true,
    },
    "controlUi": {
      "allowInsecure": false,
    },
    "remote": {
      "allow": false,
    },
    "http": {
      "denyEndpoints": ["chatCompletions", "responses"],
      "requireUrlAllowlists": true,
    },
  },
  "agents": {
    "workspace": {
      "allowedAccess": ["none", "ro"],
      "denyTools": ["exec", "process", "write", "edit", "apply_patch"],
    },
  },
  "dataHandling": {
    "sensitiveLogging": {
      "requireRedaction": true,
    },
    "telemetry": {
      "denyContentCapture": true,
    },
    "retention": {
      "requireSessionMaintenance": true,
    },
    "memory": {
      "denySessionTranscriptIndexing": true,
    },
  },
  "secrets": {
    "requireManagedProviders": true,
    "denySources": ["exec"],
    "allowInsecureProviders": false,
  },
  "auth": {
    "profiles": {
      "requireMetadata": ["provider", "mode"],
      "allowModes": ["api_key", "token"],
    },
  },
  "execApprovals": {
    "requireFile": true,
    "defaults": { "allowSecurity": ["deny"] },
    "agents": {
      "allowSecurity": ["deny", "allowlist"],
      "allowAutoAllowSkills": false,
      "allowlist": { "expected": ["deploy", "status"] },
    },
  },
  "tools": {
    "requireMetadata": ["risk", "sensitivity", "owner"],
    "profiles": {
      "allow": ["messaging", "minimal"],
    },
    "fs": {
      "requireWorkspaceOnly": true,
    },
    "exec": {
      "allowSecurity": ["deny", "allowlist"],
      "requireAsk": ["always"],
      "allowHosts": ["sandbox"],
    },
    "elevated": {
      "allow": false,
    },
    "denyTools": ["group:runtime", "group:fs"],
  },
}
```

ルールが権威です。カテゴリブロックは名前空間にすぎません。具体的なルールが存在する場合にチェックが実行されます。OpenClaw は、現在の `channels.*` 設定、`mcp.servers.*`、`models.providers.*`、選択されたエージェントモデル参照、ネットワーク SSRF 設定、ダイレクトメッセージセッションスコープ、チャンネル DM policy、チャンネルグループ policy、チャンネル/グループの mention ゲート、Gateway の bind/auth/Control UI/Tailscale/remote/HTTP 姿勢、OpenClaw 設定のエージェント sandbox ワークスペースアクセスとツール拒否姿勢、データ処理設定姿勢、設定シークレットプロバイダーと SecretRef の来歴、設定 auth プロファイルメタデータ、設定済みのグローバル/エージェントごとのツール姿勢、および `TOOLS.md` 宣言を証拠として読み取り、適合しない観測状態を報告します。policy が non-loopback Gateway bind を拒否する場合、ランタイムデフォルトをレビューする意思があるときだけ `gateway.bind` を省略してください。厳密な設定適合には `gateway.bind=loopback` を設定します。読み取り専用エージェント姿勢では、該当するデフォルトまたはエージェントに sandbox mode を設定し、`workspaceAccess` を `none` または `ro` に設定してください。sandbox mode が省略されている場合や `off` の場合、読み取り専用/書き込み不可 policy は満たされません。`agents.workspace.denyTools` は `exec`、`process`、`write`、`edit`、`apply_patch` をサポートします。OpenClaw 設定の `group:fs` はファイル変更ツールを対象とし、`group:runtime` はシェル/プロセスツールを対象とします。ツール姿勢 policy は、`tools.profile`、`tools.allow`、`tools.alsoAllow`、`tools.deny`、`tools.fs.workspaceOnly`、`tools.exec.security`、`tools.exec.ask`、`tools.exec.host`、`tools.elevated.enabled`、および同じエージェントごとの `agents.list[].tools.*` オーバーライドを観測します。Exec 承認 policy は、`execApprovals` ルールが存在する場合にのみ、名前付きの `exec-approvals.json` プロダクト成果物を読み取ります。証拠には、socket トークンや最後に使用されたコマンドテキストを含めず、デフォルト、エージェントごとの姿勢、allowlist パターンを記録します。Policy はランタイムでツール呼び出しを強制しません。シークレット証拠は、provider/source 姿勢と SecretRef メタデータを記録し、生のシークレット値は記録しません。Policy は、`auth-profiles.json` のようなエージェントごとの認証情報ストアを読み取ったり証明したりしません。これらのストアは引き続き既存の auth と認証情報フローが所有します。データ処理証拠は、設定レベルの姿勢のみです。設定済みのリダクションモード、テレメトリのコンテンツ取得トグル、セッションメンテナンスモード、セッショントランスクリプトのメモリインデックス化設定をチェックします。生ログ、テレメトリエクスポート、トランスクリプト内容、メモリファイルを検査したり、個人データやシークレットが存在しないことを証明したりはしません。

### Policy ルールリファレンス

以下の各 policy フィールドは任意です。対応するルールが `policy.jsonc` に存在する場合にのみ、チェックが実行されます。観測状態は既存の OpenClaw 設定またはワークスペースメタデータです。policy はドリフトを報告しますが、修復パスが明示的に利用可能で有効化されていない限り、ランタイム挙動を書き換えません。
Policy ファイルは厳密です。サポートされていないセクションまたはルールキーは、無視されるのではなく `policy/policy-jsonc-invalid` として報告されます。

Policy オーバーレイは、広範なトップレベルルールをグローバルに保持し、その後、名前付きスコープブロックで明示的なセレクターに対してより厳格な通常の policy セクションを追加できるようにします。スコープ名は説明用のバケットにすぎません。マッチングにはスコープ内のセレクター値が使用されます。オーバーレイは加算的です。グローバルな主張は引き続き実行され、スコープ付きの主張は同じ観測設定に対して独自の検出結果を出すことができます。

#### スコープ付きオーバーレイ

一部のエージェントまたはチャンネルにトップレベルのベースラインより厳格な policy が必要な場合は、`scopes.<scopeName>` を使用します。エージェントスコープのセクションは `agentIds` を使用し、これは `tools.*`、`agents.workspace.*`、`sandbox.*`、`dataHandling.memory.*`、`execApprovals.*` をサポートします。チャンネルスコープの ingress は `channelIds` を使用し、これは `ingress.channels.*` をサポートします。サポートされていないセクションは、無視されるのではなく拒否されます。`agentIds` エントリが `agents.list[]` に存在しない場合、OpenClaw はそのランタイムエージェント ID について、継承されたグローバル/デフォルト姿勢に対してスコープ付きルールを評価します。

```jsonc
{
  "tools": {
    "exec": {
      "allowHosts": ["sandbox", "node"],
    },
  },
  "sandbox": {
    "requireMode": ["all", "non-main"],
  },
  "scopes": {
    "release-workspace": {
      "agentIds": ["release-agent", "review-agent"],
      "agents": {
        "workspace": {
          "allowedAccess": ["none", "ro"],
        },
      },
    },
    "release-lockdown": {
      "agentIds": ["release-agent"],
      "tools": {
        "exec": {
          "allowHosts": ["sandbox"],
          "allowSecurity": ["deny", "allowlist"],
          "requireAsk": ["always"],
        },
        "denyTools": ["exec", "process", "write", "edit", "apply_patch"],
      },
      "sandbox": {
        "requireMode": ["all"],
        "allowBackends": ["docker"],
      },
      "dataHandling": {
        "memory": {
          "denySessionTranscriptIndexing": true,
        },
      },
    },
    "shell-sandbox": {
      "agentIds": ["shell-agent"],
      "sandbox": {
        "allowBackends": ["openshell"],
        "containers": {
          "requireReadOnlyMounts": false,
        },
      },
    },
    "telegram-ingress": {
      "channelIds": ["telegram"],
      "ingress": {
        "channels": {
          "allowDmPolicies": ["pairing"],
          "denyOpenGroups": true,
          "requireMentionInGroups": true,
        },
      },
    },
  },
}
```

上記のように、各スコープが異なるフィールドを管理する場合、同じエージェントを複数のスコープに含めることができます。同じエージェントに対して繰り返されるスコープ付きフィールドは、policy メタデータに従って同等またはより制限的でなければなりません。より弱い重複した主張は拒否されます。厳格性メタデータでは、allow-list は部分集合、deny-list は上位集合、必須 boolean は固定要件として扱われます。

コンテナ姿勢 policy は、OpenClaw が一致したエージェントについて観測できる証拠に対してのみ評価されます。有効な `sandbox.containers.*` ルールが、sandbox backend がそのフィールドを公開できないエージェントに適用される場合、policy はその主張を合格として扱うのではなく、`policy/sandbox-container-posture-unobservable` を報告します。異なる sandbox backend を使用するエージェントグループには個別の `agentIds` スコープを使用し、それらのフィールドを観測できないグループでは、サポートされていないコンテナルールを未設定または false のままにします。

トップレベルの `ingress.session.requireDmScope` は、`session.dmScope` がチャンネルに帰属可能な証拠ではないため、グローバルのままです。

| セレクター     | サポートされるセクション                                                                 | 使用する場合                                          |
| ------------ | ---------------------------------------------------------------------------------- | ------------------------------------------------- |
| `agentIds`   | `tools`, `agents.workspace`, `sandbox`, `dataHandling.memory`, and `execApprovals` | 1 つ以上のランタイムエージェントにより厳格なルールが必要な場合。   |
| `channelIds` | `ingress.channels`                                                                 | 1 つ以上のチャンネルにより厳格な入口ルールが必要な場合。 |

`policy.jsonc` に存在するすべてのスコープは、有効で適用可能でなければなりません。

#### チャンネル

| ポリシーフィールド                         | 観測される状態                          | 使用する場合                                                     |
| ------------------------------------ | --------------------------------------- | ------------------------------------------------------------ |
| `channels.denyRules[].when.provider` | `channels.*` プロバイダーと有効化状態 | `telegram` などのプロバイダーから構成済みチャンネルを拒否します。 |
| `channels.denyRules[].reason`        | 検出メッセージと修復ヒントのコンテキスト | プロバイダーが拒否される理由を説明します。                          |

#### MCP サーバー

| ポリシーフィールド        | 観測される状態      | 使用する場合                                                   |
| ------------------- | ------------------- | ---------------------------------------------------------- |
| `mcp.servers.allow` | `mcp.servers.*` ID | 構成済みのすべての MCP サーバーが許可リストに含まれることを要求します。 |
| `mcp.servers.deny`  | `mcp.servers.*` ID | 特定の構成済み MCP サーバー ID を拒否します。                   |

#### モデルプロバイダー

| ポリシーフィールド             | 観測される状態                                   | 使用する場合                                                                        |
| ------------------------ | ------------------------------------------------ | ------------------------------------------------------------------------------- |
| `models.providers.allow` | `models.providers.*` ID と選択されたモデル参照 | 構成済みプロバイダーと選択されたモデル参照が承認済みプロバイダーを使用することを要求します。 |
| `models.providers.deny`  | `models.providers.*` ID と選択されたモデル参照 | 構成済みプロバイダーと選択されたモデル参照をプロバイダー ID で拒否します。               |

#### ネットワーク

| ポリシーフィールド                   | 観測される状態                      | 使用する場合                                                           |
| ------------------------------ | ----------------------------------- | ------------------------------------------------------------------ |
| `network.privateNetwork.allow` | プライベートネットワーク SSRF 例外経路 | `false` に設定して、プライベートネットワークアクセスを無効のままにすることを要求します。 |

#### 入口とチャンネルアクセス

| ポリシーフィールド                              | 観測される状態                                                 | 使用する場合                                                           |
| ----------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------ |
| `ingress.session.requireDmScope`          | `session.dmScope`                                              | レビュー済みのダイレクトメッセージ分離スコープを要求します。                 |
| `ingress.channels.allowDmPolicies`        | `channels.*.dmPolicy` とレガシーチャンネル DM ポリシーフィールド      | レビュー済みのダイレクトメッセージチャンネルポリシーのみを許可します。               |
| `ingress.channels.denyOpenGroups`         | チャンネル、アカウント、グループの入口ポリシー                     | 構成済みチャンネルとアカウントに対してオープングループ入口を拒否します。      |
| `ingress.channels.requireMentionInGroups` | チャンネル、アカウント、グループ、ギルド、ネストされたメンションゲート構成 | グループ入口がオープンまたはメンションゲート付きの場合に、メンションゲートを要求します。 |

#### Gateway

| ポリシーフィールド                            | 観測される状態                                 | 使用する場合                                                     |
| --------------------------------------- | ---------------------------------------------- | ------------------------------------------------------------ |
| `gateway.exposure.allowNonLoopbackBind` | `gateway.bind`                                 | `false` に設定して、Gateway のループバックバインドを要求します。          |
| `gateway.exposure.allowTailscaleFunnel` | Tailscale サーブ/ファネル Gateway 姿勢         | `false` に設定して、Tailscale Funnel の公開を拒否します。            |
| `gateway.auth.requireAuth`              | `gateway.auth.mode`                            | `true` に設定して、無効化された Gateway 認証を拒否します。               |
| `gateway.auth.requireExplicitRateLimit` | `gateway.auth.rateLimit`                       | `true` に設定して、明示的な認証レート制限構成を要求します。    |
| `gateway.controlUi.allowInsecure`       | Control UI の安全でない認証/デバイス/オリジントグル | `false` に設定して、安全でない Control UI 公開トグルを拒否します。 |
| `gateway.remote.allow`                  | リモート Gateway モード/構成                     | `false` に設定して、リモート Gateway モードを拒否します。                  |
| `gateway.http.denyEndpoints`            | Gateway HTTP API エンドポイント                     | `chatCompletions` や `responses` などのエンドポイント ID を拒否します。  |
| `gateway.http.requireUrlAllowlists`     | Gateway HTTP URL 取得入力                  | `true` に設定して、URL 取得入力に URL 許可リストを要求します。 |

#### エージェントワークスペース

| ポリシーフィールド                     | 観測される状態                                                                        | 使用する場合                                                                                                            |
| -------------------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `agents.workspace.allowedAccess` | `agents.defaults.sandbox.workspaceAccess` と `agents.list[].sandbox.workspaceAccess` | `none` や `ro` などのサンドボックスワークスペースアクセス値のみを許可します。                                                  |
| `agents.workspace.denyTools`     | グローバルおよびエージェントごとのツール拒否構成                                                 | `exec`、`process`、`write`、`edit`、`apply_patch` などのワークスペース/ランタイム変更ツールを拒否することを要求します。 |

#### サンドボックス姿勢

| ポリシーフィールド                                          | 観測される状態                                          | 使用する場合                                                       |
| ----------------------------------------------------- | ------------------------------------------------------- | -------------------------------------------------------------- |
| `sandbox.requireMode`                                 | `agents.defaults.sandbox.mode` とエージェントごとのモード       | `all` や `non-main` などのレビュー済みサンドボックスモードのみを許可します。 |
| `sandbox.allowBackends`                               | `agents.defaults.sandbox.backend` とエージェントごとのバックエンド | `docker` などのレビュー済みサンドボックスバックエンドのみを許可します。         |
| `sandbox.containers.denyHostNetwork`                  | コンテナベースのサンドボックス/ブラウザネットワークモード           | ホストネットワークモードを拒否します。                                        |
| `sandbox.containers.denyContainerNamespaceJoin`       | コンテナベースのサンドボックス/ブラウザネットワークモード           | 別のコンテナネットワーク名前空間への参加を拒否します。              |
| `sandbox.containers.requireReadOnlyMounts`            | コンテナベースのサンドボックス/ブラウザマウントモード             | マウントが読み取り専用であることを要求します。                                |
| `sandbox.containers.denyContainerRuntimeSocketMounts` | コンテナベースのサンドボックス/ブラウザマウントターゲット          | コンテナランタイムソケットのマウントを拒否します。                          |
| `sandbox.containers.denyUnconfinedProfiles`           | コンテナセキュリティプロファイル姿勢                      | 制限なしのコンテナセキュリティプロファイルを拒否します。                   |
| `sandbox.browser.requireCdpSourceRange`               | サンドボックスブラウザ CDP ソース範囲                        | ブラウザ CDP 公開でソース範囲の宣言を要求します。        |

ポリシーは欠落した `sandbox.mode` を暗黙のデフォルト `off` として扱うため、
`sandbox.requireMode` は、新規または未構成のサンドボックスを
`["all"]` のような許可リスト外として報告します。

#### データ処理

| ポリシーフィールド                                        | 観測される状態                                                                       | 使用する場合                                                               |
| --------------------------------------------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------- |
| `dataHandling.sensitiveLogging.requireRedaction`    | `logging.redactSensitive`                                                            | `true` に設定して、`logging.redactSensitive: "off"` を拒否します。              |
| `dataHandling.telemetry.denyContentCapture`         | `diagnostics.otel.captureContent`                                                    | `true` に設定して、テレメトリーのコンテンツキャプチャを拒否します。                     |
| `dataHandling.retention.requireSessionMaintenance`  | `session.maintenance.mode`                                                           | `true` に設定して、有効なセッションメンテナンスモード `enforce` を要求します。 |
| `dataHandling.memory.denySessionTranscriptIndexing` | `memory.qmd.sessions.enabled` と `agents.*.memorySearch.experimental.sessionMemory` | `true` に設定して、セッション transcript のメモリへのインデックス化を拒否します。       |

#### シークレット

| ポリシーフィールド                      | 観測される状態                                           | 使用する場合                                                                |
| --------------------------------- | -------------------------------------------------------- | ----------------------------------------------------------------------- |
| `secrets.requireManagedProviders` | Config SecretRefs と `secrets.providers.*` 宣言 | `true` に設定して、SecretRefs が宣言済みプロバイダーを指すことを要求します。     |
| `secrets.denySources`             | シークレットプロバイダーソースと SecretRef ソース            | `exec`、`file`、または別の構成済みソース名などのソースを拒否します。 |
| `secrets.allowInsecureProviders`  | 安全でないシークレットプロバイダー姿勢フラグ                   | `false` に設定して、安全でない姿勢を選択したプロバイダーを拒否します。      |

#### Exec 承認

Exec 承認ポリシーは、アクティブなランタイム `exec-approvals.json`
アーティファクトを観測します。デフォルトではこれは `~/.openclaw/exec-approvals.json` です。
`OPENCLAW_STATE_DIR` が設定されている場合、Policy は
`$OPENCLAW_STATE_DIR/exec-approvals.json` を読み取ります。
`execApprovals.defaults.*` や `execApprovals.agents.*` などの実際の姿勢ルールには、
読み取り可能なアーティファクト証拠が必要です。アーティファクトが欠落しているか無効な場合は、
合成ランタイムデフォルトに対するベストエフォート合格になるのではなく、観測不能な証拠として報告されます。
アーティファクトが読み取り可能になると、省略された承認フィールドはランタイムデフォルトを継承します。欠落した
`defaults.security` は `full` で、欠落したエージェントセキュリティはその
デフォルトを継承します。証拠には `defaults`、`agents.*`、
`agents.*.allowlist[].pattern` に加えて、任意の `argPattern`、有効な
`autoAllowSkills` 姿勢、およびエントリソースが含まれます。ソケット
パス/トークン、`commandText`、`lastUsedCommand`、解決済みパス、タイムスタンプは含まれません。

| ポリシーフィールド                        | 観測される状態                                                                         | 使用する場合                                                                                |
| ------------------------------------------- | -------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `execApprovals.requireFile`                 | アクティブなランタイム `exec-approvals.json` パス                                              | 承認アーティファクトが存在し、解析できることを要求するには `true` に設定します。                     |
| `execApprovals.defaults.allowSecurity`      | `defaults.security`、デフォルトは `full`                                              | 承認済みのデフォルト承認セキュリティモードのみを許可します。                                    |
| `execApprovals.agents.allowSecurity`        | `agents.*.security`、デフォルトを継承                                               | エージェントごとに有効な承認セキュリティモードのうち、承認済みのものだけを許可します。                        |
| `execApprovals.agents.allowAutoAllowSkills` | `defaults.autoAllowSkills` と `agents.*.autoAllowSkills`、ランタイムデフォルトを継承 | 暗黙的なスキル CLI 承認なしで、厳密な手動許可リストを要求するには `false` に設定します。 |
| `execApprovals.agents.allowlist.expected`   | 集約された `agents.*.allowlist[]` パターンと任意の argPattern エントリ               | 承認許可リストがレビュー済みのパターンセットと一致することを要求します。                      |

たとえば、承認アーティファクトを要求し、寛容なデフォルトを拒否し、
選択したエージェントに対してレビュー済みの exec 承認姿勢のみを許可します。

```jsonc
{
  "execApprovals": {
    "requireFile": true,
    "defaults": {
      // Security modes: "deny", "allowlist", or "full".
      // This default permits only the locked-down deny posture.
      "allowSecurity": ["deny"],
    },
  },
  "scopes": {
    "restricted-shell": {
      "agentIds": ["family-agent", "groups-agent"],
      "execApprovals": {
        "agents": {
          // Selected agents may use reviewed allowlist posture, but not "full".
          "allowSecurity": ["allowlist"],
          // false means skill CLIs must appear in the reviewed allowlist instead of
          // being implicitly approved by autoAllowSkills.
          "allowAutoAllowSkills": false,
          "allowlist": {
            "expected": [
              // Simple entry: exact reviewed executable pattern with no argPattern.
              "travel-hub",
              // Constrained entry: pattern plus reviewed argument regex.
              { "pattern": "calendar-cli", "argPattern": "^sync\\b" },
              "/bin/date",
            ],
          },
        },
      },
    },
  },
}
```

#### 認証プロファイル

| ポリシーフィールド                    | 観測される状態                               | 使用する場合                                                                                   |
| ------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `auth.profiles.requireMetadata` | `auth.profiles.*` のプロバイダーとモードメタデータ | config 認証プロファイルで `provider` や `mode` などのメタデータキーを要求します。               |
| `auth.profiles.allowModes`      | `auth.profiles.*.mode`                       | `api_key`、`aws-sdk`、`oauth`、`token` など、サポートされている認証プロファイルモードのみを許可します。 |

#### ツールメタデータ

| ポリシーフィールド            | 観測される状態                   | 使用する場合                                                                                   |
| ----------------------- | -------------------------------- | ------------------------------------------------------------------------------------------ |
| `tools.requireMetadata` | 管理対象の `TOOLS.md` 宣言 | 管理対象ツールが `risk`、`sensitivity`、`owner` などのメタデータキーを宣言することを要求します。 |

#### ツール姿勢

| ポリシーフィールド                    | 観測される状態                                              | 使用する場合                                                                                                 |
| ------------------------------- | ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `tools.profiles.allow`          | `tools.profile` と `agents.list[].tools.profile`           | `minimal`、`messaging`、`coding` などのツールプロファイル ID のみを許可します。                                 |
| `tools.fs.requireWorkspaceOnly` | `tools.fs.workspaceOnly` とエージェントごとの `tools.fs` オーバーライド | ワークスペース限定のファイルシステムツール姿勢を要求するには `true` に設定します。                                         |
| `tools.exec.allowSecurity`      | `tools.exec.security` とエージェントごとの exec セキュリティ           | `deny` や `allowlist` などの exec セキュリティモードのみを許可します。                                            |
| `tools.exec.requireAsk`         | `tools.exec.ask` とエージェントごとの exec ask モード                | `always` などの承認姿勢を要求します。                                                               |
| `tools.exec.allowHosts`         | `tools.exec.host` とエージェントごとの exec ホストルーティング           | `sandbox` などの exec ホストルーティングモードのみを許可します。                                                    |
| `tools.elevated.allow`          | `tools.elevated.enabled` とエージェントごとの昇格姿勢     | 昇格ツールモードを無効のままにすることを要求するには `false` に設定します。                                           |
| `tools.alsoAllow.expected`      | `tools.alsoAllow` とエージェントごとの `tools.alsoAllow`           | 正確な `alsoAllow` エントリを要求し、不足または想定外の追加ツール権限付与を報告します。                 |
| `tools.denyTools`               | `tools.deny` と `agents.list[].tools.deny`                 | 設定済みのツール拒否リストに、`group:runtime` や `group:fs` などのツール ID またはグループを含めることを要求します。 |

作成中にポリシーのみのチェックを実行します。

```bash
openclaw policy check
openclaw policy check --json
openclaw policy check --severity-min error
```

`policy check` はポリシーチェックセットのみを実行し、証拠、検出結果、
証明ハッシュを出力します。Policy plugin が有効な場合、同じ検出結果は
`openclaw doctor --lint` にも表示されます。

オペレーターのポリシーファイルを、作成済みのベースラインポリシーファイルと比較します。

```bash
openclaw policy compare --baseline official.policy.jsonc
openclaw policy compare --baseline official.policy.jsonc --policy policy.jsonc --json
```

`policy compare` は、ポリシーファイル構文同士を比較します。OpenClaw の
ランタイム状態、証拠、認証情報、シークレットは検査しません。このコマンドは、
スコープ付きオーバーレイを管理するものと同じポリシールールメタデータを使用します。
許可リストは同等またはより狭く、拒否リストは同等またはより広く、必須 boolean は
必須値を維持し、順序付き文字列は設定された順序のより制限的な端に向かう場合のみ
移動でき、完全一致リストは一致する必要があります。

ベースラインファイルは組織が作成したポリシーにできます。チェック対象ポリシーは、
より厳格な値を使用したり、追加のポリシールールを追加したりできます。最上位の
チェック対象ルールは、同等またはより制限的であれば、スコープ付きベースラインルールも
満たせます。これは最上位ポリシーが広く適用されるためです。スコープ名は一致する必要がありません。
スコープ付き比較は、`agentIds` や `channelIds` などのセレクター値と、
チェック対象のポリシーフィールドによってキー付けされます。

クリーンな比較 JSON 出力の例は、ポリシーファイル比較状態のみを報告します。

```json
{
  "ok": true,
  "baselinePath": "official.policy.jsonc",
  "policyPath": "policy.jsonc",
  "rulesChecked": 3,
  "findings": []
}
```

クリーンな `policy check --json` 出力の例には、オペレーターまたは監督者が記録できる
安定したハッシュが含まれます。

```json
{
  "ok": true,
  "attestation": {
    "policy": {
      "path": "policy.jsonc",
      "hash": "sha256:..."
    },
    "workspace": {
      "scope": "policy",
      "hash": "sha256:..."
    },
    "findingsHash": "sha256:...",
    "attestationHash": "sha256:..."
  },
  "checksRun": 5,
  "checksSkipped": 0,
  "findings": []
}
```

## ポリシーを設定する

ポリシー設定は `plugins.entries.policy.config` 配下にあります。

```jsonc
{
  "plugins": {
    "entries": {
      "policy": {
        "enabled": true,
        "config": {
          "enabled": true,
          "path": "policy.jsonc",
          "workspaceRepairs": false,
          "expectedHash": "sha256:...",
          "expectedAttestationHash": "sha256:...",
        },
      },
    },
  },
}
```

| 設定                   | 目的                                                         |
| ------------------------- | --------------------------------------------------------------- |
| `enabled`                 | `policy.jsonc` が存在する前でもポリシーチェックを有効にします。         |
| `workspaceRepairs`        | `doctor --fix` がポリシー管理対象のワークスペース設定を編集できるようにします。 |
| `expectedHash`            | 承認済みポリシーアーティファクトに対する任意のハッシュロック。            |
| `expectedAttestationHash` | 最後に受け入れられたクリーンなポリシーチェックに対する任意のハッシュロック。    |
| `path`                    | ポリシーアーティファクトのワークスペース相対位置。             |

Plugin をインストールしたままワークスペースのポリシーチェックを無効にするには、
`plugins.entries.policy.config.enabled` を `false` に設定します。

ツールメタデータ要件は、`tools.requireMetadata` を使って `policy.jsonc` に作成します。
たとえば `["risk", "sensitivity", "owner"]` です。

## ポリシー状態を受け入れる

JSON 出力の例:

```json
{
  "ok": true,
  "attestation": {
    "checkedAt": "2026-05-10T20:00:00.000Z",
    "policy": {
      "path": "policy.jsonc",
      "hash": "sha256:..."
    },
    "workspace": {
      "scope": "policy",
      "hash": "sha256:..."
    },
    "findingsHash": "sha256:...",
    "attestationHash": "sha256:..."
  },
  "evidence": {
    "channels": [
      {
        "id": "telegram",
        "provider": "telegram",
        "source": "oc://openclaw.config/channels/telegram",
        "enabled": false
      }
    ],
    "mcpServers": [
      {
        "id": "docs",
        "transport": "stdio",
        "source": "oc://openclaw.config/mcp/servers/docs",
        "command": "npx"
      }
    ],
    "modelProviders": [
      {
        "id": "openai",
        "source": "oc://openclaw.config/models/providers/openai"
      }
    ],
    "modelRefs": [
      {
        "ref": "openai/gpt-5.5",
        "provider": "openai",
        "model": "gpt-5.5",
        "source": "oc://openclaw.config/agents/defaults/model"
      }
    ],
    "network": [
      {
        "id": "browser-private-network",
        "source": "oc://openclaw.config/browser/ssrfPolicy/dangerouslyAllowPrivateNetwork",
        "value": false
      }
    ],
    "gatewayExposure": [
      {
        "id": "gateway-bind",
        "kind": "bind",
        "source": "oc://openclaw.config/gateway/bind",
        "value": "loopback",
        "nonLoopback": false,
        "explicit": true
      }
    ],
    "agentWorkspace": [
      {
        "id": "agents-defaults-workspace-access",
        "kind": "workspaceAccess",
        "source": "oc://openclaw.config/agents/defaults/sandbox/workspaceAccess",
        "scope": "defaults",
        "value": "ro",
        "sandboxMode": "all",
        "sandboxModeSource": "oc://openclaw.config/agents/defaults/sandbox/mode",
        "sandboxEnabled": true,
        "explicit": true
      },
      {
        "id": "agents-defaults-tool-exec",
        "kind": "toolDeny",
        "source": "oc://openclaw.config/tools/deny",
        "scope": "defaults",
        "tool": "exec",
        "denied": true,
        "explicit": true
      }
    ],
    "secrets": [
      {
        "id": "vault",
        "kind": "provider",
        "source": "oc://openclaw.config/secrets/providers/vault",
        "providerSource": "env"
      },
      {
        "id": "oc://openclaw.config/models/providers/openai/apiKey",
        "kind": "input",
        "source": "oc://openclaw.config/models/providers/openai/apiKey",
        "provenance": "secretRef",
        "refSource": "env",
        "refProvider": "vault"
      }
    ],
    "authProfiles": [
      {
        "id": "github",
        "source": "oc://openclaw.config/auth/profiles/github",
        "validMetadata": true,
        "provider": "github",
        "mode": "token"
      }
    ],
    "tools": [
      {
        "id": "deploy",
        "source": "oc://TOOLS.md/tools/deploy",
        "line": 12,
        "risk": "critical",
        "sensitivity": "restricted",
        "capabilities": ["IRREVERSIBLE_EXTERNAL"]
      }
    ]
  },
  "checksRun": 30,
  "checksSkipped": 0,
  "findings": []
}
```

ポリシーハッシュは、作成されたルール成果物を識別します。エビデンスブロックは、ポリシーチェックで使用された観測済みのOpenClaw状態を記録します。`workspace.hash`値は、チェック対象スコープのそのエビデンスペイロードを識別します。検出事項ハッシュは、チェックによって返された正確な検出事項セットを識別します。`checkedAt`は評価が実行された時刻を記録します。証明ハッシュは、ポリシーハッシュ、エビデンスハッシュ、検出事項ハッシュ、および結果がクリーンだったかどうかという安定した主張を識別します。同じポリシー状態で繰り返しチェックした場合に同じ証明が生成されるよう、意図的に`checkedAt`は含めていません。これらを合わせて、このポリシーチェックの監査タプルを形成します。

後続のGatewayまたはスーパーバイザーがポリシーを使ってランタイムアクションをブロック、承認、または注釈付けする場合、最後にクリーンだったポリシーチェックの証明ハッシュを記録する必要があります。`checkedAt`は監査ログ用にJSON出力内に残りますが、安定した証明ハッシュの一部ではありません。

ポリシー状態を受け入れるときは、次のライフサイクルを使用します。

1. `policy.jsonc`を作成またはレビューします。
2. `openclaw policy check --json`を実行します。
3. 結果がクリーンな場合、`attestation.policy.hash`を`expectedHash`として記録します。
4. `attestation.attestationHash`を`expectedAttestationHash`として記録します。
5. CIまたはリリースゲートで`openclaw doctor --lint`を再実行します。

ポリシールールを意図的に変更した場合は、クリーンなチェック結果から、受け入れ済みの両方のハッシュを更新します。ワークスペース設定を意図的に変更してもポリシーが同じままの場合、通常は`expectedAttestationHash`のみが変わります。

`agents.workspace`ルールを有効化またはアップグレードすると、ワークスペースハッシュと証明ハッシュに`agentWorkspace`エビデンスが追加されます。オペレーターは新しいエビデンスを確認し、これらのルールを有効化した後に受け入れ済みの証明ハッシュを更新する必要があります。ツール態勢ルールを有効化またはアップグレードすると、同じ方法で`toolPosture`エビデンスが追加されます。

`openclaw policy watch`は同じチェックを繰り返し実行し、現在のエビデンスが`expectedAttestationHash`と一致しなくなった場合に報告します。

```bash
openclaw policy watch --json
```

1回のドリフト評価だけが必要なCIまたはスクリプトでは、`--once`を使用します。`--once`を指定しない場合、コマンドはデフォルトで2秒ごとにポーリングします。別の間隔を選ぶには`--interval-ms`を使用します。

## 検出事項

ポリシーは現在、次を検証します。

| チェック ID                                             | 検出事項                                                                          |
| -------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `policy/policy-jsonc-missing`                            | Policy が有効だが、`policy.jsonc` がありません。                                  |
| `policy/policy-jsonc-invalid`                            | Policy を解析できないか、不正な形式のルールエントリが含まれています。            |
| `policy/policy-hash-mismatch`                            | Policy が設定済みの `expectedHash` と一致しません。                               |
| `policy/attestation-hash-mismatch`                       | 現在の Policy 証拠が、承認済みの証明と一致しなくなっています。                   |
| `policy/policy-conformance-invalid`                      | ベースラインまたはチェック対象の Policy ファイルに無効な比較構文があります。     |
| `policy/policy-conformance-missing`                      | チェック対象の Policy ファイルに、ベースライン Policy ファイルで必要なルールがありません。 |
| `policy/policy-conformance-weaker`                       | チェック対象の Policy ファイルに、ベースライン Policy ファイルより弱い値があります。 |
| `policy/channels-denied-provider`                        | 有効なチャンネルがチャンネル拒否ルールに一致しています。                         |
| `policy/mcp-denied-server`                               | 設定済みの MCP サーバーが Policy によって拒否されています。                      |
| `policy/mcp-unapproved-server`                           | 設定済みの MCP サーバーが許可リスト外です。                                      |
| `policy/models-denied-provider`                          | 設定済みのモデルプロバイダーまたはモデル参照が、拒否されたプロバイダーを使用しています。 |
| `policy/models-unapproved-provider`                      | 設定済みのモデルプロバイダーまたはモデル参照が許可リスト外です。                |
| `policy/network-private-access-enabled`                  | Policy が拒否しているときに、プライベートネットワーク SSRF エスケープハッチが有効です。 |
| `policy/ingress-dm-policy-unapproved`                    | チャンネル DM Policy が Policy 許可リスト外です。                                |
| `policy/ingress-dm-scope-unapproved`                     | `session.dmScope` が、Policy で要求される DM 分離スコープと一致しません。        |
| `policy/ingress-open-groups-denied`                      | Policy がオープングループの受信を拒否しているのに、チャンネルグループ Policy が `open` です。 |
| `policy/ingress-group-mention-required`                  | Policy がメンションゲートを要求しているのに、チャンネルまたはグループエントリがそれを無効にしています。 |
| `policy/gateway-non-loopback-bind`                       | Policy が拒否しているときに、Gateway のバインドポスチャーが非ループバック公開を許可しています。 |
| `policy/gateway-auth-disabled`                           | Policy が認証を要求しているときに、Gateway 認証が無効です。                      |
| `policy/gateway-rate-limit-missing`                      | Policy が要求しているときに、Gateway 認証のレート制限ポスチャーが明示されていません。 |
| `policy/gateway-control-ui-insecure`                     | Gateway Control UI の安全でない公開トグルが有効です。                            |
| `policy/gateway-tailscale-funnel`                        | Policy が拒否しているときに、Gateway Tailscale Funnel 公開が有効です。           |
| `policy/gateway-remote-enabled`                          | Policy が拒否しているときに、Gateway リモートモードがアクティブです。            |
| `policy/gateway-http-endpoint-enabled`                   | Policy で拒否されているのに、Gateway HTTP API エンドポイントが有効です。         |
| `policy/gateway-http-url-fetch-unrestricted`             | Gateway HTTP URL フェッチ入力に、必須の URL 許可リストがありません。             |
| `policy/agents-workspace-access-denied`                  | エージェントのサンドボックスモードまたはワークスペースアクセスが Policy 許可リスト外です。 |
| `policy/agents-tool-not-denied`                          | エージェントまたはデフォルト設定が、Policy で必要なツールを拒否していません。    |
| `policy/tools-profile-unapproved`                        | 設定済みのグローバルまたはエージェント別ツールプロファイルが許可リスト外です。  |
| `policy/tools-fs-workspace-only-required`                | ファイルシステムツールが、ワークスペースのみのパスポスチャーで設定されていません。 |
| `policy/tools-exec-security-unapproved`                  | Exec セキュリティモードが Policy 許可リスト外です。                              |
| `policy/tools-exec-ask-unapproved`                       | Exec 確認モードが Policy 許可リスト外です。                                      |
| `policy/tools-exec-host-unapproved`                      | Exec ホストルーティングが Policy 許可リスト外です。                              |
| `policy/tools-elevated-enabled`                          | Policy が拒否しているときに、昇格ツールモードが有効です。                        |
| `policy/tools-also-allow-missing`                        | 設定済みの `alsoAllow` リストに、Policy で必要なエントリがありません。           |
| `policy/tools-also-allow-unexpected`                     | 設定済みの `alsoAllow` リストに、Policy で想定されていないエントリが含まれています。 |
| `policy/tools-required-deny-missing`                     | グローバルまたはエージェント別ツール拒否リストに、必須の拒否ツールが含まれていません。 |
| `policy/sandbox-mode-unapproved`                         | サンドボックスモードが Policy 許可リスト外です。                                 |
| `policy/sandbox-backend-unapproved`                      | サンドボックスバックエンドが Policy 許可リスト外です。                           |
| `policy/sandbox-container-posture-unobservable`          | 観測できないバックエンドに対して、コンテナポスチャールールが有効です。           |
| `policy/sandbox-container-host-network-denied`           | コンテナベースのサンドボックスまたはブラウザーがホストネットワークモードを使用しています。 |
| `policy/sandbox-container-namespace-join-denied`         | コンテナベースのサンドボックスまたはブラウザーが別のコンテナ名前空間に参加しています。 |
| `policy/sandbox-container-mount-mode-required`           | コンテナベースのサンドボックスまたはブラウザーのマウントが読み取り専用ではありません。 |
| `policy/sandbox-container-runtime-socket-mount`          | コンテナベースのサンドボックスまたはブラウザーのマウントが、コンテナランタイムソケットを公開しています。 |
| `policy/sandbox-container-unconfined-profile`            | Policy が拒否しているときに、コンテナサンドボックスプロファイルが無制限です。    |
| `policy/sandbox-browser-cdp-source-range-missing`        | Policy が要求しているときに、サンドボックスブラウザーの CDP ソース範囲がありません。 |
| `policy/data-handling-redaction-disabled`                | Policy が要求しているときに、機密ログのリダクションが無効です。                  |
| `policy/data-handling-telemetry-content-capture`         | Policy が拒否しているときに、テレメトリーのコンテンツキャプチャが有効です。      |
| `policy/data-handling-session-retention-not-enforced`    | Policy が要求しているときに、セッション保持メンテナンスが強制されていません。    |
| `policy/data-handling-session-transcript-memory-enabled` | Policy が拒否しているときに、セッショントランスクリプトのメモリーインデックス化が有効です。 |
| `policy/secrets-unmanaged-provider`                      | 設定の SecretRef が、`secrets.providers` で宣言されていないプロバイダーを参照しています。 |
| `policy/secrets-denied-provider-source`                  | 設定のシークレットプロバイダーまたは SecretRef が、Policy で拒否されたソースを使用しています。 |
| `policy/secrets-insecure-provider`                       | Policy が拒否しているときに、シークレットプロバイダーが安全でないポスチャーにオプトインしています。 |
| `policy/auth-profile-invalid-metadata`                   | 設定の認証プロファイルに、有効なプロバイダーまたはモードメタデータがありません。 |
| `policy/auth-profile-unapproved-mode`                    | 設定の認証プロファイルモードが Policy 許可リスト外です。                         |
| `policy/exec-approvals-missing`                          | Policy が `exec-approvals.json` を要求していますが、アーティファクトがありません。 |
| `policy/exec-approvals-invalid`                          | 設定済みの Exec 承認アーティファクトを解析できません。                           |
| `policy/exec-approvals-default-security-unapproved`      | Exec 承認のデフォルトが、Policy 許可リスト外のセキュリティモードを使用しています。 |
| `policy/exec-approvals-agent-security-unapproved`        | エージェント別の有効な Exec 承認セキュリティモードが許可リスト外です。           |
| `policy/exec-approvals-auto-allow-skills-enabled`        | Policy が拒否しているときに、Exec 承認エージェントが Skills CLI を暗黙的に自動許可しています。 |
| `policy/exec-approvals-allowlist-missing`                | 承認許可リストに、Policy で必要なパターンがありません。                         |
| `policy/exec-approvals-allowlist-unexpected`             | 承認許可リストに、Policy で想定されていないパターンが含まれています。            |
| `policy/tools-missing-risk-level`                        | 管理対象ツール宣言にリスクメタデータがありません。                              |
| `policy/tools-unknown-risk-level`                        | 管理対象ツール宣言が不明なリスク値を使用しています。                            |
| `policy/tools-missing-sensitivity-token`                 | 管理対象ツール宣言に機密度メタデータがありません。                              |
| `policy/tools-missing-owner`                             | 管理対象ツール宣言に所有者メタデータがありません。                              |
| `policy/tools-unknown-sensitivity-token`                 | 管理対象ツール宣言が不明な機密度値を使用しています。                            |

Policy の検出事項には、`target` と `requirement` の両方を含めることができます。`target` は、準拠していないことが観測されたワークスペース内の対象です。`requirement` は、その検出事項を発生させた、作成済みの Policy ルールです。現在、どちらの値もアドレスであり、通常は `oc://` パスですが、フィールド名はアドレス形式ではなく Policy 上の役割を表しています。

JSON 検出事項の例:

```json
{
  "checkId": "policy/channels-denied-provider",
  "severity": "error",
  "message": "Channel 'telegram' uses denied provider 'telegram'.",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/channels/telegram",
  "target": "oc://openclaw.config/channels/telegram",
  "requirement": "oc://policy.jsonc/channels/denyRules/#0",
  "fixHint": "Telegram is not approved for this workspace."
}
```

ツール検出事項の例:

```json
{
  "checkId": "policy/tools-missing-risk-level",
  "severity": "error",
  "message": "TOOLS.md tool 'deploy' has no explicit risk classification.",
  "source": "policy",
  "path": "TOOLS.md",
  "line": 12,
  "ocPath": "oc://TOOLS.md/tools/deploy",
  "target": "oc://TOOLS.md/tools/deploy",
  "requirement": "oc://policy.jsonc/tools/requireMetadata"
}
```

MCP 検出事項の例:

```json
{
  "checkId": "policy/mcp-unapproved-server",
  "severity": "error",
  "message": "MCP server 'remote' is not in the policy allowlist.",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/mcp/servers/remote",
  "target": "oc://openclaw.config/mcp/servers/remote",
  "requirement": "oc://policy.jsonc/mcp/servers/allow"
}
```

モデルプロバイダー検出事項の例:

```json
{
  "checkId": "policy/models-unapproved-provider",
  "severity": "error",
  "message": "Model ref 'anthropic/claude-sonnet-4.7' uses unapproved provider 'anthropic'.",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/agents/defaults/model/fallbacks/#0",
  "target": "oc://openclaw.config/agents/defaults/model/fallbacks/#0",
  "requirement": "oc://policy.jsonc/models/providers/allow"
}
```

ネットワーク検出事項の例:

```json
{
  "checkId": "policy/network-private-access-enabled",
  "severity": "error",
  "message": "Network setting 'browser-private-network' allows private-network access.",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/browser/ssrfPolicy/dangerouslyAllowPrivateNetwork",
  "target": "oc://openclaw.config/browser/ssrfPolicy/dangerouslyAllowPrivateNetwork",
  "requirement": "oc://policy.jsonc/network/privateNetwork/allow"
}
```

Gateway公開の検出例:

```json
{
  "checkId": "policy/gateway-non-loopback-bind",
  "severity": "error",
  "message": "Gateway bind setting 'gateway-bind' permits non-loopback exposure.",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/gateway/bind",
  "target": "oc://openclaw.config/gateway/bind",
  "requirement": "oc://policy.jsonc/gateway/exposure/allowNonLoopbackBind"
}
```

エージェントワークスペースの検出例:

```json
{
  "checkId": "policy/agents-workspace-access-denied",
  "severity": "error",
  "message": "agents.defaults sandbox workspaceAccess 'rw' is not allowed by policy.",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/agents/defaults/sandbox/workspaceAccess",
  "target": "oc://openclaw.config/agents/defaults/sandbox/workspaceAccess",
  "requirement": "oc://policy.jsonc/agents/workspace/allowedAccess"
}
```

## 修復

`doctor --lint` と `policy check` は読み取り専用です。

`workspaceRepairs` が明示的に有効化されている場合に限り、`doctor --fix` はポリシー管理下のワークスペース設定を編集します。このオプトインがない場合、ポリシーチェックは修復予定の内容を報告し、設定は変更しません。

このバージョンでは、OpenClaw 設定で有効化されているものの `channels.denyRules` で拒否されているチャネルを、修復によって無効化できます。有効な拒否ルールは設定済みチャネルをオフにできるため、ポリシーファイルをレビューした後にのみ `workspaceRepairs` を有効化してください。

```jsonc
{
  "plugins": {
    "entries": {
      "policy": {
        "config": {
          "workspaceRepairs": true,
        },
      },
    },
  },
}
```

## 終了コード

| コマンド          | `0`                                                    | `1`                                                                 | `2`                          |
| ---------------- | ------------------------------------------------------ | ------------------------------------------------------------------- | ---------------------------- |
| `policy check`   | しきい値に達した検出事項はありません。                          | 1件以上の検出事項がしきい値に達しました。                             | 引数またはランタイムの失敗。 |
| `policy compare` | ポリシーファイルはベースラインと同等以上に厳格です。 | ポリシーファイルが無効、欠落、またはベースラインルールより弱いです。 | 引数またはランタイムの失敗。 |
| `policy watch`   | 検出事項はなく、承認済みハッシュは最新です。              | 検出事項が存在するか、承認済みアテステーションが古くなっています。                    | 引数またはランタイムの失敗。 |

## 関連

- [Doctor lint モード](/ja-JP/cli/doctor#lint-mode)
- [Path CLI](/ja-JP/cli/path)
