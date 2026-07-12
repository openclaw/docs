---
read_when:
    - 作成済みの policy.jsonc に照らして OpenClaw の設定を確認したい場合
    - doctor lint にポリシーの検出結果を含めたい場合
    - 監査証跡としてポリシー証明ハッシュが必要です
summary: '`openclaw policy` 適合性チェックの CLI リファレンス'
title: ポリシー
x-i18n:
    generated_at: "2026-07-11T22:03:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 280f9ed1e741786f85dfed978690eb18a03c8fbde20e0d01e31a9d215ae0a128
    source_path: cli/policy.md
    workflow: 16
---

# `openclaw policy`

`openclaw policy` は、同梱の Policy Plugin によって提供されます。これは既存の OpenClaw 設定に対するエンタープライズ向け適合レイヤーであり、第二の設定システムではありません。要件は `policy.jsonc` に記述します。OpenClaw はアクティブなワークスペースを証拠として観測し、Policy は `doctor --lint` を通じて逸脱を報告します。Policy はツール呼び出しを強制したり、リクエスト時にランタイム動作を書き換えたりせず、`auth-profiles.json` などのエージェントごとの認証情報ストアを証明対象にもしません。

Policy は、設定済みチャンネル、MCP サーバー、モデルプロバイダー、ネットワークの SSRF 対策状態、受信経路とチャンネルのアクセス、Gateway の公開状態と Node コマンドの状態、エージェントのワークスペースアクセス、サンドボックスの状態、データ処理の状態、シークレットプロバイダーと認証プロファイルの状態、および管理対象ツールのメタデータ（`TOOLS.md`）をチェックします。「Telegram を有効にしてはならない」や「管理対象ツールにはリスクと所有者のメタデータを宣言しなければならない」といった、永続的で検証可能な方針をワークスペースに定める必要がある場合に使用します。証明や逸脱検出を伴わないローカル動作だけが必要な場合は、通常の設定で十分です。

## クイックスタート

```bash
openclaw plugins enable policy
```

`policy.jsonc` が存在しない場合も Plugin は有効なままになるため、doctor はチェックを暗黙にスキップせず、不足している成果物を報告できます。

`policy.jsonc` は手動で作成します。現在の設定から生成されるものではありません。各トップレベルセクションはルールの名前空間です。その配下に具体的なルールが存在する場合にのみチェックが実行されます（未対応のセクションやキーは暗黙に無視されず、`policy/policy-jsonc-invalid` として失敗します）。対応するすべてのセクションを網羅した最小例：

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
    "nodes": {
      "denyCommands": ["system.run"],
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

以下のルール表からは分かりにくい、セクション横断的な注意事項：

- 非 local loopback バインドを禁止しながら `gateway.bind` を省略すると、ランタイムのデフォルトを受け入れることになります。厳密な適合性を求める場合は、`gateway.bind: "loopback"` を設定してください。
- 読み取り専用エージェントでは、該当するデフォルトまたはエージェントのサンドボックス `mode` を `all` または `non-main` に設定し、`workspaceAccess` を `none` または `ro` に設定します。サンドボックスモードが未設定または `off` の場合、読み取り専用ポリシーを満たしません。
- `agents.workspace.denyTools` には `exec`、`process`、`write`、`edit`、`apply_patch` を指定できます。設定のツール拒否グループ `group:fs`（ファイル変更）と `group:runtime`（シェル／プロセス）は、同等の状態を満たします。
- 実行承認のチェックは、`execApprovals` ルールが存在する場合にのみ、実際の `exec-approvals.json` 成果物を読み取ります。成果物が存在しない、または無効な場合は観測不能な証拠であり、合格として合成されることはありません。
- シークレットと認証プロファイルの証拠には、プロバイダー／ソースの状態と SecretRef メタデータのみが記録され、生の値は決して記録されません。Policy は `auth-profiles.json` などのエージェントごとの認証情報ストアを読み取らず、証明対象にもしません。
- データ処理の証拠は、設定レベルの状態（秘匿化モード、テレメトリ取得の切り替え、セッション保守モード、トランスクリプトのインデックス設定）のみです。ログ、テレメトリのエクスポート、トランスクリプト、メモリファイルは検査しません。また、問題のない結果であっても、それらに個人データやシークレットが存在しないことを証明するものではありません。

### Policy ルールリファレンス

以下のすべてのルールは任意です。ルールが存在する場合にのみチェックが実行されます。観測対象の状態は、既存の OpenClaw 設定またはワークスペースのメタデータです。

#### スコープ付きオーバーレイ

特定のエージェントまたはチャンネルに、トップレベルのベースラインより厳格なポリシーが必要な場合は、`scopes.<scopeName>` を使用します。スコープ名は単なるラベルであり、照合にはスコープ内のセレクターが使用されます。オーバーレイは追加適用されます。グローバルルールは引き続き実行され、スコープ付きルールは同じ証拠に対して独自の検出結果を追加できます。

| セレクター   | 対応セクション                                                                 | 使用する場合                                             |
| ------------ | ------------------------------------------------------------------------------ | -------------------------------------------------------- |
| `agentIds`   | `tools`, `agents.workspace`, `sandbox`, `dataHandling.memory`, `execApprovals` | 1 つ以上のランタイムエージェントに厳格なルールが必要な場合。 |
| `channelIds` | `ingress.channels`                                                             | 1 つ以上のチャンネルに厳格な受信ルールが必要な場合。     |

`agentIds` のエントリが `agents.list[]` に存在しない場合、OpenClaw はそのエントリをスキップせず、そのランタイムエージェント ID について継承されたグローバル／デフォルトの状態を基にスコープ付きルールを評価します。

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

上記のように、それぞれのスコープが異なるフィールドを管理する場合、同じエージェントを複数のスコープに含めることができます。同じエージェントに対して同じスコープ付きフィールドを繰り返す場合は、同等以上に厳格でなければなりません。より緩い重複指定は拒否されます（許可リストは部分集合、拒否リストは上位集合、必須のブール値は固定です）。

コンテナ状態ルール（`sandbox.containers.*`）は、一致したエージェントのサンドボックスバックエンドが公開できる証拠に対してのみチェックされます。バックエンドが、有効化されたルールを観測できない場合、Policy は合格とせず、`policy/sandbox-container-posture-unobservable` を報告します。コンテナルールは、そのルールを公開できるバックエンドを使用するエージェントグループにスコープ設定してください。

トップレベルの `ingress.session.requireDmScope` はグローバルのままです。`session.dmScope` は特定のチャンネルに帰属できる証拠ではないため、`channelIds` でスコープ設定することはできません。

`policy.jsonc` に存在するすべてのスコープは、有効かつ適用可能でなければなりません。

#### チャンネル

| Policy フィールド                    | 観測対象の状態                            | 使用する場合                                                        |
| ------------------------------------ | ----------------------------------------- | ------------------------------------------------------------------- |
| `channels.denyRules[].when.provider` | `channels.*` のプロバイダーと有効化状態   | `telegram` などのプロバイダーによる設定済みチャンネルを禁止する場合。 |
| `channels.denyRules[].reason`        | 検出メッセージと修復ヒントのコンテキスト | プロバイダーが禁止される理由を説明する場合。                        |

#### MCP サーバー

| Policy フィールド    | 観測対象の状態      | 使用する場合                                                        |
| -------------------- | ------------------- | ------------------------------------------------------------------- |
| `mcp.servers.allow`  | `mcp.servers.*` ID  | 設定済みのすべての MCP サーバーが許可リストに含まれることを必須にする場合。 |
| `mcp.servers.deny`   | `mcp.servers.*` ID  | 設定済みの特定の MCP サーバー ID を禁止する場合。                   |

#### モデルプロバイダー

| Policy フィールド         | 観測対象の状態                                      | 使用する場合                                                                  |
| ------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------- |
| `models.providers.allow`  | `models.providers.*` ID と選択されたモデル参照      | 設定済みプロバイダーと選択されたモデル参照に、承認済みプロバイダーの使用を必須にする場合。 |
| `models.providers.deny`   | `models.providers.*` ID と選択されたモデル参照      | 設定済みプロバイダーと選択されたモデル参照をプロバイダー ID によって禁止する場合。 |

#### ネットワーク

| Policy フィールド                 | 観測対象の状態                         | 使用する場合                                                        |
| --------------------------------- | -------------------------------------- | ------------------------------------------------------------------- |
| `network.privateNetwork.allow`    | プライベートネットワーク SSRF の迂回手段 | プライベートネットワークアクセスを無効のままにすることを必須にするには、`false` に設定します。 |

#### 受信経路とチャンネルアクセス

| ポリシーフィールド                        | 観測される状態                                                 | 使用する場合                                                         |
| ----------------------------------------- | -------------------------------------------------------------- | -------------------------------------------------------------------- |
| `ingress.session.requireDmScope`          | `session.dmScope`                                              | レビュー済みのダイレクトメッセージ分離スコープを必須にする。         |
| `ingress.channels.allowDmPolicies`        | `channels.*.dmPolicy` および従来のチャンネル DM ポリシーフィールド | レビュー済みのダイレクトメッセージチャンネルポリシーのみを許可する。 |
| `ingress.channels.denyOpenGroups`         | チャンネル、アカウント、グループの受信ポリシー                 | 設定済みのチャンネルとアカウントに対するオープングループ受信を拒否する。 |
| `ingress.channels.requireMentionInGroups` | チャンネル、アカウント、グループ、ギルド、およびネストされたメンションゲート設定 | グループ受信がオープンまたはメンション必須の場合に、メンションゲートを必須にする。 |

#### Gateway

| ポリシーフィールド                      | 観測される状態                                 | 使用する場合                                                                         |
| --------------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------ |
| `gateway.exposure.allowNonLoopbackBind` | `gateway.bind`                                 | local loopback への Gateway バインドを必須にするには `false` に設定する。            |
| `gateway.exposure.allowTailscaleFunnel` | Tailscale serve/funnel の Gateway セキュリティ態勢 | Tailscale Funnel での公開を拒否するには `false` に設定する。                         |
| `gateway.auth.requireAuth`              | `gateway.auth.mode`                            | Gateway 認証の無効化を拒否するには `true` に設定する。                               |
| `gateway.auth.requireExplicitRateLimit` | `gateway.auth.rateLimit`                       | 明示的な認証レート制限設定を必須にするには `true` に設定する。                       |
| `gateway.controlUi.allowInsecure`       | Control UI の安全でない認証、デバイス、オリジンの切り替え設定 | 安全でない Control UI 公開の切り替え設定を拒否するには `false` に設定する。          |
| `gateway.remote.allow`                  | リモート Gateway のモードと設定               | リモート Gateway モードを拒否するには `false` に設定する。                           |
| `gateway.http.denyEndpoints`            | Gateway HTTP API エンドポイント               | `chatCompletions` や `responses` などのエンドポイント ID を拒否する。                |
| `gateway.http.requireUrlAllowlists`     | Gateway HTTP の URL 取得入力                   | URL 取得入力で URL 許可リストを必須にするには `true` に設定する。                    |
| `gateway.nodes.denyCommands`            | `gateway.nodes.denyCommands`                   | `system.run` などの正確な Node コマンド ID が OpenClaw 設定で拒否されることを必須にする。 |

`gateway.nodes.denyCommands` は、大文字と小文字を区別する正確な拒否スーパーセットルールです。
特権 Node コマンドが OpenClaw 設定によって明示的に拒否されていることをポリシーで証明する必要がある場合に使用します。特権
Node コマンドを意図的に許可するデプロイでは、
`gateway.nodes.allowCommands` のみに依存せず、レビュー後に `policy.jsonc` を更新してください。

#### エージェントワークスペース

| ポリシーフィールド               | 観測される状態                                                                        | 使用する場合                                                                                |
| -------------------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `agents.workspace.allowedAccess` | `agents.defaults.sandbox.workspaceAccess` および `agents.list[].sandbox.workspaceAccess` | `none` や `ro` などのサンドボックスワークスペースアクセス値のみを許可する。                 |
| `agents.workspace.denyTools`     | グローバルおよびエージェントごとのツール拒否設定                                      | 変更ツール（`exec`、`process`、`write`、`edit`、`apply_patch`）の拒否を必須にする。          |

#### サンドボックスのセキュリティ態勢

| ポリシーフィールド                                  | 観測される状態                                          | 使用する場合                                                   |
| ----------------------------------------------------- | ------------------------------------------------------- | -------------------------------------------------------------- |
| `sandbox.requireMode`                                 | `agents.defaults.sandbox.mode` およびエージェントごとのモード | `all` や `non-main` などのレビュー済みサンドボックスモードのみを許可する。 |
| `sandbox.allowBackends`                               | `agents.defaults.sandbox.backend` およびエージェントごとのバックエンド | `docker` などのレビュー済みサンドボックスバックエンドのみを許可する。 |
| `sandbox.containers.denyHostNetwork`                  | コンテナベースのサンドボックス／ブラウザーのネットワークモード | ホストネットワークモードを拒否する。                           |
| `sandbox.containers.denyContainerNamespaceJoin`       | コンテナベースのサンドボックス／ブラウザーのネットワークモード | 別のコンテナのネットワーク名前空間への参加を拒否する。         |
| `sandbox.containers.requireReadOnlyMounts`            | コンテナベースのサンドボックス／ブラウザーのマウントモード | マウントを読み取り専用にすることを必須にする。                 |
| `sandbox.containers.denyContainerRuntimeSocketMounts` | コンテナベースのサンドボックス／ブラウザーのマウント先 | コンテナランタイムソケットのマウントを拒否する。               |
| `sandbox.containers.denyUnconfinedProfiles`           | コンテナセキュリティプロファイルのセキュリティ態勢     | 制限なしのコンテナセキュリティプロファイルを拒否する。         |
| `sandbox.browser.requireCdpSourceRange`               | サンドボックスブラウザーの CDP ソース範囲              | ブラウザーの CDP 公開でソース範囲の宣言を必須にする。          |

ポリシーでは、欠落した `sandbox.mode` を暗黙のデフォルト値 `off` として扱うため、
`sandbox.requireMode` は、新規または未設定のサンドボックスを
`["all"]` などの許可リスト外として報告します。

#### データ処理

| ポリシーフィールド                                  | 観測される状態                                                                       | 使用する場合                                                           |
| --------------------------------------------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------- |
| `dataHandling.sensitiveLogging.requireRedaction`    | `logging.redactSensitive`                                                            | `logging.redactSensitive: "off"` を拒否するには `true` に設定する。    |
| `dataHandling.telemetry.denyContentCapture`         | `diagnostics.otel.captureContent`                                                    | テレメトリによるコンテンツ取得を拒否するには `true` に設定する。       |
| `dataHandling.retention.requireSessionMaintenance`  | `session.maintenance.mode`                                                           | 有効なセッションメンテナンスモード `enforce` を必須にするには `true` に設定する。 |
| `dataHandling.memory.denySessionTranscriptIndexing` | `memory.qmd.sessions.enabled` および `agents.*.memorySearch.experimental.sessionMemory` | セッションのトランスクリプトをメモリへインデックス化する処理を拒否するには `true` に設定する。 |

#### シークレット

| ポリシーフィールド                | 観測される状態                                           | 使用する場合                                                                |
| --------------------------------- | -------------------------------------------------------- | --------------------------------------------------------------------------- |
| `secrets.requireManagedProviders` | 設定の SecretRef および `secrets.providers.*` 宣言       | SecretRef が宣言済みプロバイダーを指すことを必須にするには `true` に設定する。 |
| `secrets.denySources`             | シークレットプロバイダーのソースおよび SecretRef のソース | `exec`、`file`、または別の設定済みソース名などのソースを拒否する。          |
| `secrets.allowInsecureProviders`  | 安全でないシークレットプロバイダーのセキュリティ態勢フラグ | 安全でないセキュリティ態勢を選択するプロバイダーを拒否するには `false` に設定する。 |

#### Exec 承認

Exec 承認チェックは、実行時の `exec-approvals.json` アーティファクトを読み取ります。
デフォルトでは `~/.openclaw/exec-approvals.json`、`OPENCLAW_STATE_DIR` が設定されている場合は
`$OPENCLAW_STATE_DIR/exec-approvals.json` です。
`execApprovals.defaults.*` または `execApprovals.agents.*` 以下の
セキュリティ態勢ルールには、読み取り可能なアーティファクトの証拠が必要です。アーティファクトが欠落しているか無効な場合、
可能な範囲での合格ではなく、観測不能な証拠として報告されます。読み取り可能になると、省略された
フィールドは実行時のデフォルトを継承します。`defaults.security` が欠落している場合は `full` となり、
エージェントのセキュリティ設定が欠落している場合はそのデフォルトを継承します。証拠には `defaults`、
`agents.*`、`agents.*.allowlist[].pattern`、任意の `argPattern`、有効な
`autoAllowSkills` のセキュリティ態勢、およびエントリのソースが含まれます。ソケットパス／トークン、
`commandText`、`lastUsedCommand`、解決済みパス、タイムスタンプは決して含まれません。

| ポリシーフィールド                          | 観測される状態                                                                         | 使用する場合                                                                                  |
| ------------------------------------------- | -------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `execApprovals.requireFile`                 | 有効な実行時 `exec-approvals.json` のパス                                               | 承認アーティファクトの存在と解析成功を必須にするには `true` に設定する。                       |
| `execApprovals.defaults.allowSecurity`      | `defaults.security`。デフォルトは `full`                                                | 承認済みのデフォルト承認セキュリティモードのみを許可する。                                    |
| `execApprovals.agents.allowSecurity`        | `agents.*.security`。デフォルトを継承                                                   | エージェントごとに有効な承認セキュリティモードのうち、承認済みのもののみを許可する。          |
| `execApprovals.agents.allowAutoAllowSkills` | `defaults.autoAllowSkills` および `agents.*.autoAllowSkills`。実行時のデフォルトを継承 | 暗黙的な Skills CLI 承認を使わず、厳格な手動許可リストを必須にするには `false` に設定する。    |
| `execApprovals.agents.allowlist.expected`   | `agents.*.allowlist[]` のパターンと任意の argPattern エントリの集約                    | 承認許可リストがレビュー済みのパターンセットと一致することを必須にする。                      |

例：承認アーティファクトを必須にし、寛容なデフォルトを拒否し、選択したエージェントに対して
レビュー済みの Exec 承認セキュリティ態勢のみを許可します。

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

| ポリシーフィールド              | 観測された状態                               | 使用する場合                                                                                         |
| ------------------------------- | -------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `auth.profiles.requireMetadata` | `auth.profiles.*` のプロバイダーとモードのメタデータ | 設定の認証プロファイルに `provider` や `mode` などのメタデータキーを必須とする場合。                  |
| `auth.profiles.allowModes`      | `auth.profiles.*.mode`                       | `api_key`、`aws-sdk`、`oauth`、`token` など、サポート対象の認証プロファイルモードのみを許可する場合。 |

#### ツールのメタデータ

| ポリシーフィールド      | 観測された状態                 | 使用する場合                                                                                     |
| ----------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------ |
| `tools.requireMetadata` | 管理対象の `TOOLS.md` 宣言     | 管理対象ツールに `risk`、`sensitivity`、`owner` などのメタデータキーの宣言を必須とする場合。      |

#### ツールの態勢

| ポリシーフィールド              | 観測された状態                                              | 使用する場合                                                                                                     |
| ------------------------------- | ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `tools.profiles.allow`          | `tools.profile` と `agents.list[].tools.profile`            | `minimal`、`messaging`、`coding` などのツールプロファイル ID のみを許可する場合。                                 |
| `tools.fs.requireWorkspaceOnly` | `tools.fs.workspaceOnly` とエージェントごとの `tools.fs` オーバーライド | ファイルシステムツールをワークスペース内のみに制限する態勢を必須とするには `true` に設定します。                  |
| `tools.exec.allowSecurity`      | `tools.exec.security` とエージェントごとの実行セキュリティ | `deny` や `allowlist` などの実行セキュリティモードのみを許可する場合。                                            |
| `tools.exec.requireAsk`         | `tools.exec.ask` とエージェントごとの実行確認モード        | `always` などの承認態勢を必須とする場合。                                                                        |
| `tools.exec.allowHosts`         | `tools.exec.host` とエージェントごとの実行ホストルーティング | `sandbox` などの実行ホストルーティングモードのみを許可する場合。                                                 |
| `tools.elevated.allow`          | `tools.elevated.enabled` とエージェントごとの昇格態勢      | 昇格ツールモードを無効のままにすることを必須とするには `false` に設定します。                                    |
| `tools.alsoAllow.expected`      | `tools.alsoAllow` とエージェントごとの `tools.alsoAllow`   | `alsoAllow` のエントリとの完全一致を必須とし、不足または想定外の追加ツール許可を報告する場合。                    |
| `tools.denyTools`               | `tools.deny` と `agents.list[].tools.deny`                  | 設定済みのツール拒否リストに、`group:runtime` や `group:fs` などのツール ID またはグループを含めることを必須とする場合。 |

## チェックの実行

作成中はポリシーのみのチェックを実行します。

```bash
openclaw policy check
openclaw policy check --json
openclaw policy check --severity-min error
```

`policy check` はポリシーチェックセットのみを実行し、証拠、検出事項、
および証明ハッシュを出力します。Policy plugin が有効な場合、同じ検出事項が
`openclaw doctor --lint` にも表示されます。

運用者のポリシーファイルを作成済みのベースラインと比較します。

```bash
openclaw policy compare --baseline official.policy.jsonc
openclaw policy compare --baseline official.policy.jsonc --policy policy.jsonc --json
```

`policy compare` はポリシーファイルの構文同士を検査します。ランタイム状態、
証拠、資格情報、シークレットは検査しません。スコープ付きオーバーレイを
管理するものと同じルールメタデータを使用します。許可リストは同等または
より限定的でなければならず、拒否リストは同等またはより広範でなければなりません。
必須のブール値はその値を維持し、順序付き文字列は設定された順序のより厳格な側に
のみ移動でき、完全一致リストは一致しなければなりません。ベースラインには
組織が作成したポリシーを使用でき、検査対象のポリシーにはより厳格な値や
追加ルールを設定できます。トップレベルの検査対象ルールは、同等以上に制限的で
あれば、スコープ付きのベースラインルールを満たせます。ファイル間でスコープ名を
一致させる必要はありません。比較はセレクター（`agentIds`/`channelIds`）と
フィールドをキーとして行われます。

正常な比較（`--json`）：

```json
{
  "ok": true,
  "baselinePath": "official.policy.jsonc",
  "policyPath": "policy.jsonc",
  "rulesChecked": 3,
  "findings": []
}
```

正常な `policy check --json` の出力には、運用者または監督システムが記録できる
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

## ポリシーの設定

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

| 設定                      | 目的                                                                    |
| ------------------------- | ----------------------------------------------------------------------- |
| `enabled`                 | `policy.jsonc` が存在する前でもポリシーチェックを有効にします。         |
| `workspaceRepairs`        | `doctor --fix` によるポリシー管理対象のワークスペース設定の編集を許可します。 |
| `expectedHash`            | 承認済みポリシー成果物に対する任意のハッシュロック。                    |
| `expectedAttestationHash` | 最後に受理した正常なポリシーチェックに対する任意のハッシュロック。      |
| `path`                    | ポリシー成果物のワークスペース相対位置。                                |

Plugin をインストールしたままワークスペースのポリシーチェックを無効にするには、
`plugins.entries.policy.config.enabled` を `false` に設定します。

## ポリシー状態の受理

JSON 出力の例：

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
        "ref": "openai/gpt-5.6-sol",
        "provider": "openai",
        "model": "gpt-5.6-sol",
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

`attestation.policy.hash` は作成済みのルール成果物を識別します。`evidence` は
チェックで使用された観測済みの OpenClaw 状態を記録し、`workspace.hash` は
その証拠ペイロードを識別します。`findingsHash` は正確な検出事項セットを
識別します。`checkedAt` はチェックの実行時刻を記録します。
`attestationHash` は安定した主張（ポリシーハッシュ、証拠ハッシュ、
検出事項ハッシュ、正常または異常の状態）を識別し、意図的に `checkedAt` を
除外します。そのため、同じポリシー状態からは常に同じ証明ハッシュが生成されます。
これら 4 つの値を合わせたものが、1 回のポリシーチェックに対する監査タプルです。

Gateway または監督システムがポリシーを使用してランタイム操作をブロック、承認、
または注釈付けする場合、最後に正常だったチェックの証明ハッシュを記録する必要が
あります。`checkedAt` は監査ログ用として JSON 出力に残りますが、安定した
ハッシュには含まれません。

ポリシー状態を受理するライフサイクル：

1. `policy.jsonc` を作成またはレビューします。
2. `openclaw policy check --json` を実行します。
3. 正常な場合、`attestation.policy.hash` を `expectedHash` として記録します。
4. `attestation.attestationHash` を `expectedAttestationHash` として記録します。
5. CI またはリリースゲートで `openclaw doctor --lint` を再実行します。

ポリシールールを意図的に変更した場合は、クリーンなチェック結果から承認済みの両方のハッシュを更新します。ワークスペース設定のみを変更した場合（ポリシー自体は同じ場合）は、通常 `expectedAttestationHash` だけが変更されます。

`agents.workspace` ルールを有効化またはアップグレードすると、ワークスペースハッシュとアテステーションハッシュに `agentWorkspace` エビデンスが追加されます。有効化後に新しいエビデンスを確認し、承認済みのアテステーションハッシュを更新してください。ツール態勢ルールを有効化またはアップグレードした場合も、同様に `toolPosture` エビデンスが追加されます。

`openclaw policy watch` はチェックを再実行し、現在のエビデンスが `expectedAttestationHash` と一致しなくなった場合に報告します。

```bash
openclaw policy watch --json
```

単一のドリフト評価が必要な CI またはスクリプトでは `--once` を使用します。`--once` を指定しない場合、デフォルトでは 2 秒ごとにポーリングします。間隔を変更するには `--interval-ms` を使用します。

## 検出事項

| チェック ID                                              | 検出事項                                                                          |
| -------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `policy/policy-jsonc-missing`                            | ポリシーは有効ですが、`policy.jsonc` がありません。                               |
| `policy/policy-jsonc-invalid`                            | ポリシーを解析できないか、不正な形式のルールエントリが含まれています。            |
| `policy/policy-hash-mismatch`                            | ポリシーが設定済みの `expectedHash` と一致しません。                              |
| `policy/attestation-hash-mismatch`                       | 現在のポリシーエビデンスが、承認済みのアテステーションと一致しなくなっています。  |
| `policy/policy-conformance-invalid`                      | ベースラインまたはチェック対象のポリシーファイルに無効な比較構文があります。      |
| `policy/policy-conformance-missing`                      | チェック対象のポリシーファイルに、ベースラインポリシーファイルで必須のルールがありません。 |
| `policy/policy-conformance-weaker`                       | チェック対象のポリシーファイルの値が、ベースラインポリシーファイルより弱くなっています。 |
| `policy/channels-denied-provider`                        | 有効なチャネルが、チャネル拒否ルールに一致しています。                            |
| `policy/mcp-denied-server`                               | 設定済みの MCP サーバーがポリシーによって拒否されています。                       |
| `policy/mcp-unapproved-server`                           | 設定済みの MCP サーバーが許可リストの対象外です。                                  |
| `policy/models-denied-provider`                          | 設定済みのモデルプロバイダーまたはモデル参照が、拒否されたプロバイダーを使用しています。 |
| `policy/models-unapproved-provider`                      | 設定済みのモデルプロバイダーまたはモデル参照が許可リストの対象外です。              |
| `policy/network-private-access-enabled`                  | ポリシーで拒否されているにもかかわらず、プライベートネットワークへの SSRF エスケープハッチが有効です。 |
| `policy/ingress-dm-policy-unapproved`                    | チャネルの DM ポリシーが、ポリシーの許可リストの対象外です。                       |
| `policy/ingress-dm-scope-unapproved`                     | `session.dmScope` が、ポリシーで必須とされる DM 分離スコープと一致しません。       |
| `policy/ingress-open-groups-denied`                      | ポリシーでオープングループの受信が拒否されているにもかかわらず、チャネルグループポリシーが `open` です。 |
| `policy/ingress-group-mention-required`                  | ポリシーでメンションゲートが必須であるにもかかわらず、チャネルまたはグループのエントリで無効化されています。 |
| `policy/gateway-non-loopback-bind`                       | ポリシーで拒否されているにもかかわらず、Gateway のバインド態勢でループバック以外への公開が許可されています。 |
| `policy/gateway-auth-disabled`                           | ポリシーで認証が必須であるにもかかわらず、Gateway 認証が無効です。                 |
| `policy/gateway-rate-limit-missing`                      | ポリシーで必須であるにもかかわらず、Gateway 認証のレート制限態勢が明示されていません。 |
| `policy/gateway-control-ui-insecure`                     | Gateway Control UI の安全でない公開を許可するトグルが有効です。                    |
| `policy/gateway-tailscale-funnel`                        | ポリシーで拒否されているにもかかわらず、Gateway の Tailscale Funnel 公開が有効です。 |
| `policy/gateway-remote-enabled`                          | ポリシーで拒否されているにもかかわらず、Gateway のリモートモードが有効です。       |
| `policy/gateway-http-endpoint-enabled`                   | ポリシーで拒否されているにもかかわらず、Gateway HTTP API エンドポイントが有効です。 |
| `policy/gateway-http-url-fetch-unrestricted`             | Gateway HTTP の URL 取得入力に、必須の URL 許可リストがありません。                |
| `policy/gateway-node-command-denied`                     | ポリシーで拒否された Node コマンドが、OpenClaw の設定では拒否されていません。      |
| `policy/agents-workspace-access-denied`                  | エージェントのサンドボックスモードまたはワークスペースアクセスが、ポリシーの許可リストの対象外です。 |
| `policy/agents-tool-not-denied`                          | エージェントまたはデフォルト設定で、ポリシーにより拒否が必須とされるツールが拒否されていません。 |
| `policy/tools-profile-unapproved`                        | 設定済みのグローバルまたはエージェント単位のツールプロファイルが許可リストの対象外です。 |
| `policy/tools-fs-workspace-only-required`                | ファイルシステムツールが、ワークスペース限定のパス態勢で設定されていません。        |
| `policy/tools-exec-security-unapproved`                  | 実行セキュリティモードがポリシーの許可リストの対象外です。                          |
| `policy/tools-exec-ask-unapproved`                       | 実行確認モードがポリシーの許可リストの対象外です。                                  |
| `policy/tools-exec-host-unapproved`                      | 実行ホストのルーティングがポリシーの許可リストの対象外です。                        |
| `policy/tools-elevated-enabled`                          | ポリシーで拒否されているにもかかわらず、昇格ツールモードが有効です。                |
| `policy/tools-also-allow-missing`                        | 設定済みの `alsoAllow` リストに、ポリシーで必須のエントリがありません。             |
| `policy/tools-also-allow-unexpected`                     | 設定済みの `alsoAllow` リストに、ポリシーで想定されていないエントリが含まれています。 |
| `policy/tools-required-deny-missing`                     | グローバルまたはエージェント単位のツール拒否リストに、必須の拒否対象ツールが含まれていません。 |
| `policy/sandbox-mode-unapproved`                         | サンドボックスモードがポリシーの許可リストの対象外です。                            |
| `policy/sandbox-backend-unapproved`                      | サンドボックスバックエンドがポリシーの許可リストの対象外です。                      |
| `policy/sandbox-container-posture-unobservable`          | 監視できないバックエンドに対して、コンテナ態勢ルールが有効になっています。          |
| `policy/sandbox-container-host-network-denied`           | コンテナベースのサンドボックスまたはブラウザーが、ホストネットワークモードを使用しています。 |
| `policy/sandbox-container-namespace-join-denied`         | コンテナベースのサンドボックスまたはブラウザーが、別のコンテナの名前空間に参加しています。 |
| `policy/sandbox-container-mount-mode-required`           | コンテナベースのサンドボックスまたはブラウザーのマウントが読み取り専用ではありません。 |
| `policy/sandbox-container-runtime-socket-mount`          | コンテナベースのサンドボックスまたはブラウザーのマウントによって、コンテナランタイムソケットが公開されています。 |
| `policy/sandbox-container-unconfined-profile`            | ポリシーで拒否されているにもかかわらず、コンテナサンドボックスプロファイルが制限なしです。 |
| `policy/sandbox-browser-cdp-source-range-missing`        | ポリシーで必須であるにもかかわらず、サンドボックスブラウザーの CDP ソース範囲がありません。 |
| `policy/data-handling-redaction-disabled`                | ポリシーで必須であるにもかかわらず、機密ログの墨消しが無効です。                    |
| `policy/data-handling-telemetry-content-capture`         | ポリシーで拒否されているにもかかわらず、テレメトリコンテンツの取得が有効です。      |
| `policy/data-handling-session-retention-not-enforced`    | ポリシーで必須であるにもかかわらず、セッション保持のメンテナンスが強制されていません。 |
| `policy/data-handling-session-transcript-memory-enabled` | ポリシーで拒否されているにもかかわらず、セッショントランスクリプトのメモリインデックス作成が有効です。 |
| `policy/secrets-unmanaged-provider`                      | 設定の SecretRef が、`secrets.providers` で宣言されていないプロバイダーを参照しています。 |
| `policy/secrets-denied-provider-source`                  | 設定のシークレットプロバイダーまたは SecretRef が、ポリシーで拒否されたソースを使用しています。 |
| `policy/secrets-insecure-provider`                       | ポリシーで拒否されているにもかかわらず、シークレットプロバイダーが安全でない態勢を明示的に選択しています。 |
| `policy/auth-profile-invalid-metadata`                   | 設定の認証プロファイルに、有効なプロバイダーまたはモードのメタデータがありません。 |
| `policy/auth-profile-unapproved-mode`                    | 設定の認証プロファイルモードがポリシーの許可リストの対象外です。                    |
| `policy/exec-approvals-missing`                          | ポリシーで `exec-approvals.json` が必須ですが、アーティファクトがありません。      |
| `policy/exec-approvals-invalid`                          | 設定済みの実行承認アーティファクトを解析できません。                                |
| `policy/exec-approvals-default-security-unapproved`      | 実行承認のデフォルトが、ポリシーの許可リストの対象外であるセキュリティモードを使用しています。 |
| `policy/exec-approvals-agent-security-unapproved`        | エージェント単位の有効な実行承認セキュリティモードが許可リストの対象外です。        |
| `policy/exec-approvals-auto-allow-skills-enabled`        | ポリシーで拒否されているにもかかわらず、実行承認エージェントが Skills の CLI を暗黙的に自動許可しています。 |
| `policy/exec-approvals-allowlist-missing`                | 承認許可リストに、ポリシーで必須のパターンがありません。                            |
| `policy/exec-approvals-allowlist-unexpected`             | 承認許可リストに、ポリシーで想定されていないパターンが含まれています。              |
| `policy/tools-missing-risk-level`                        | 管理対象ツールの宣言にリスクメタデータがありません。                                |
| `policy/tools-unknown-risk-level`                        | 管理対象ツールの宣言で、不明なリスク値が使用されています。                          |
| `policy/tools-missing-sensitivity-token`                 | 管理対象ツールの宣言に機密度メタデータがありません。                                |
| `policy/tools-missing-owner`                             | 管理対象ツールの宣言に所有者メタデータがありません。                                |
| `policy/tools-unknown-sensitivity-token`                 | 管理対象ツールの宣言で、不明な機密度の値が使用されています。                        |

検出事項には、適合していないことが確認されたワークスペースの対象を示す `target` と、その検出事項の根拠となった記述済みルールを示す `requirement` の両方が含まれる場合があります。現在、どちらも `oc://` アドレス文字列ですが、フィールド名はアドレス形式ではなくポリシー上の役割を表します。

検出事項の例:

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

```json
{
  "checkId": "policy/gateway-node-command-denied",
  "severity": "error",
  "message": "Gateway node command 'system.run' is denied by policy but not denied by OpenClaw config.",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/gateway/nodes/denyCommands",
  "target": "oc://openclaw.config/gateway/nodes/denyCommands",
  "requirement": "oc://policy.jsonc/gateway/nodes/denyCommands",
  "fixHint": "Add 'system.run' to gateway.nodes.denyCommands or update policy after review."
}
```

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

`doctor --fix` がポリシー管理対象のワークスペース設定を編集するのは、
`workspaceRepairs` が明示的に有効な場合のみです。それ以外の場合、チェックは
修復対象を報告しますが、設定は変更しません。

このバージョンでは、修復によって `channels.denyRules` で拒否されたチャンネルを無効化し、
以下に示す自動的な制限強化修復を適用できます。有効なルールによって
ワークスペース設定が変更される可能性があるため、`workspaceRepairs` を有効にするのは
ポリシーファイルを確認した後に限ってください。

- グローバルポリシーで昇格ツールが禁止されている場合、`tools.elevated.enabled=false` に設定する
- ポリシーで対象ツールの拒否が必須の場合、不足している必須拒否ツール ID を `tools.deny` または
  `agents.list[].tools.deny` に追加する
- 安全でない `gateway.controlUi.*` トグルを `false` に設定する
- ポリシーでリモート Gateway モードが拒否されている場合、`gateway.mode=local` に設定する
- ポリシーで Gateway HTTP API エンドポイントが拒否されている場合、報告された
  `gateway.http.endpoints.*.enabled` パスを `false` に設定する
- ポリシーでオープンなグループ受信が拒否されている場合、報告されたチャンネル受信の
  `groupPolicy` パスを `allowlist` に設定する
- ポリシーでグループメンションが必須の場合、報告されたチャンネル受信の
  `requireMention` パスを `true` に設定する
- ポリシーで機密ログの編集が必須の場合、`logging.redactSensitive=tools` に設定する
- ポリシーでテレメトリ内容のキャプチャが拒否されている場合、
  `diagnostics.otel.captureContent=false`、またはオブジェクト形式のテレメトリ
  キャプチャ設定では `diagnostics.otel.captureContent.enabled=false` に設定する

スコープ付きの昇格ツール修復は検出のみです。スコープ付きのデータ処理修復も、
検出結果で共有のログまたはテレメトリ設定が報告されている場合はスキップされます。
共有設定を変更すると、スコープ付きポリシーの対象範囲を超えて影響するためです。

検出結果で継承されたルートの `tools.deny` が報告されている場合、
スコープ付きの必須拒否修復はスキップされます。必須ツールをルート設定に追加すると、
スコープ付きポリシーの対象範囲を超えて影響するためです。エージェントローカルの
必須拒否修復では、報告された `agents.list[].tools.deny` パスを更新できます。

検出結果で継承された `channels.defaults.*` が報告されている場合、
スコープ付きのチャンネル受信修復はスキップされます。共有チャンネルのデフォルトを変更すると、
スコープ付きポリシーの対象範囲を超えて影響するためです。Gateway HTTP の URL 取得許可リストに
関する検出結果は、自動修復では正しいエンドポイント URL の許可リスト値を選択できないため、
引き続き手動での対応が必要です。

Gateway のバインドと Node コマンドに関する検出結果は、引き続きレビューが必要です。
`policy/gateway-non-loopback-bind` または `policy/gateway-node-command-denied` を
設定パスに対応付けられる場合、`doctor --fix` は提案された `gateway.bind` または
`gateway.nodes.denyCommands` の変更を、スキップされたプレビューガイダンスとして報告します。
変更は適用されず、オペレーターが設定またはポリシーを確認して更新するまで、
検出結果は修復済みとして扱われません。

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

| コマンド         | `0`                                                        | `1`                                                                  | `2`                              |
| ---------------- | ---------------------------------------------------------- | -------------------------------------------------------------------- | -------------------------------- |
| `policy check`   | しきい値に達する検出結果はありません。                     | 1 件以上の検出結果がしきい値に達しました。                           | 引数または実行時の失敗です。     |
| `policy compare` | ポリシーファイルはベースラインと同等以上に厳格です。       | ポリシーファイルが無効、欠落、またはベースラインルールより緩いです。 | 引数または実行時の失敗です。     |
| `policy watch`   | 検出結果がなく、承認済みのハッシュが最新です。             | 検出結果が存在するか、承認済みの証明が古くなっています。             | 引数または実行時の失敗です。     |

## 関連項目

- [Doctor lint モード](/ja-JP/cli/doctor#lint-mode)
- [パス CLI](/ja-JP/cli/path)
