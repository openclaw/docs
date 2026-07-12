---
read_when:
    - 作成済みの policy.jsonc に照らして OpenClaw の設定を確認したい場合
    - doctor lint にポリシーに関する検出結果を含めたい場合
    - 監査証跡にはポリシー証明ハッシュが必要です
summary: '`openclaw policy` 適合性チェックの CLI リファレンス'
title: ポリシー
x-i18n:
    generated_at: "2026-07-12T14:23:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 280f9ed1e741786f85dfed978690eb18a03c8fbde20e0d01e31a9d215ae0a128
    source_path: cli/policy.md
    workflow: 16
---

# `openclaw policy`

`openclaw policy` は、同梱の Policy Plugin によって提供されます。これは既存の OpenClaw 設定に対するエンタープライズ向けの適合性レイヤーであり、第二の設定システムではありません。要件は `policy.jsonc` に記述します。OpenClaw はアクティブなワークスペースをエビデンスとして観測し、Policy は `doctor --lint` を通じてドリフトを報告します。Policy はツール呼び出しを強制したり、リクエスト時にランタイム動作を書き換えたりせず、`auth-profiles.json` などのエージェントごとの認証情報ストアを証明することもありません。

Policy は、設定済みチャネル、MCP サーバー、モデルプロバイダー、ネットワークの SSRF 対策状況、受信アクセスとチャネルアクセス、Gateway の公開範囲と Node コマンドの状態、エージェントのワークスペースアクセス、サンドボックスの状態、データ処理の状態、シークレットプロバイダーと認証プロファイルの状態、および管理対象ツールのメタデータ（`TOOLS.md`）をチェックします。ワークスペースに「Telegram を有効にしてはならない」や「管理対象ツールはリスクと所有者のメタデータを宣言しなければならない」といった、永続的かつ検証可能な規定が必要な場合に使用します。証明やドリフト検出を伴わないローカル動作だけが必要な場合は、通常の設定で十分です。

## クイックスタート

```bash
openclaw plugins enable policy
```

`policy.jsonc` が存在しない場合でも Plugin は有効なままになるため、doctor はチェックを暗黙にスキップせず、不足している成果物を報告できます。

`policy.jsonc` は手動で作成します。現在の設定から生成されるものではありません。各トップレベルセクションはルールの名前空間です。具体的なルールが配下に存在する場合にのみチェックが実行されます（サポートされていないセクションやキーは暗黙に無視されず、`policy/policy-jsonc-invalid` として失敗します）。サポートされているすべてのセクションを網羅する最小例：

```jsonc
{
  "channels": {
    "denyRules": [
      {
        "id": "no-telegram",
        "when": { "provider": "telegram" },
        "reason": "このワークスペースでは Telegram は承認されていません。",
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

以下のルール表だけでは分かりにくい、セクション横断の注意事項：

- 非 local loopback バインドを拒否しながら `gateway.bind` を省略すると、ランタイムのデフォルトを受け入れることになります。厳密に適合させるには `gateway.bind: "loopback"` を設定してください。
- 読み取り専用エージェントの場合は、該当するデフォルトまたはエージェントのサンドボックス `mode` を `all` または `non-main` に設定し、`workspaceAccess` を `none` または `ro` に設定します。サンドボックスモードが未設定または `off` の場合、読み取り専用ポリシーを満たしません。
- `agents.workspace.denyTools` は `exec`、`process`、`write`、`edit`、`apply_patch` を受け付けます。設定のツール拒否グループ `group:fs`（ファイル変更）と `group:runtime`（シェル／プロセス）は、同等の状態を満たします。
- Exec 承認チェックは、`execApprovals` ルールが存在する場合にのみ、稼働中の `exec-approvals.json` 成果物を読み取ります。成果物が存在しないか無効な場合、それは観測不能なエビデンスであり、合格と見なされることはありません。
- シークレットおよび認証プロファイルのエビデンスには、プロバイダー／ソースの状態と SecretRef メタデータのみが記録され、生の値は一切記録されません。Policy は `auth-profiles.json` などのエージェントごとの認証情報ストアを読み取ったり証明したりしません。
- データ処理のエビデンスは設定レベルの状態（秘匿化モード、テレメトリー取得トグル、セッションメンテナンスモード、トランスクリプトのインデックス設定）のみです。ログ、テレメトリーのエクスポート、トランスクリプト、メモリファイルは検査しません。また、結果に問題がなくても、それらに個人データやシークレットが存在しないことを証明するものではありません。

### Policy ルールリファレンス

以下の各ルールはすべて任意です。ルールが存在する場合にのみチェックが実行されます。観測対象の状態は、既存の OpenClaw 設定またはワークスペースのメタデータです。

#### スコープ付きオーバーレイ

特定のエージェントまたはチャネルにトップレベルのベースラインより厳しいポリシーが必要な場合は、`scopes.<scopeName>` を使用します。スコープ名は単なるラベルであり、照合にはスコープ内のセレクターが使用されます。オーバーレイは加算的です。グローバルルールは引き続き実行され、スコープ付きルールは同じエビデンスに対して独自の検出事項を追加できます。

| セレクター   | サポートされるセクション                                                         | 使用する場合                                             |
| ------------ | ------------------------------------------------------------------------------ | ------------------------------------------------- |
| `agentIds`   | `tools`, `agents.workspace`, `sandbox`, `dataHandling.memory`, `execApprovals` | 1 つ以上のランタイムエージェントに、より厳しいルールが必要な場合。 |
| `channelIds` | `ingress.channels`                                                             | 1 つ以上のチャネルに、より厳しい受信ルールが必要な場合。          |

`agentIds` のエントリが `agents.list[]` に存在しない場合、OpenClaw はそのエントリをスキップせず、そのランタイムエージェント ID に継承されるグローバル／デフォルトの状態に対してスコープ付きルールを評価します。

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

上記のように、各スコープが異なるフィールドを管理する場合、同じエージェントを複数のスコープに含めることができます。同じエージェントについてスコープ付きフィールドを重複させる場合は、同等以上に厳しくなければなりません。より緩い重複指定は拒否されます（許可リストは部分集合、拒否リストは上位集合、必須のブール値は固定です）。

コンテナ状態ルール（`sandbox.containers.*`）は、照合されたエージェントのサンドボックスバックエンドが公開可能なエビデンスに対してのみチェックされます。バックエンドが有効化されたルールを観測できない場合、Policy は合格とせず、`policy/sandbox-container-posture-unobservable` を報告します。コンテナルールは、それらを公開できるバックエンドを使用するエージェントグループにスコープ設定してください。

トップレベルの `ingress.session.requireDmScope` はグローバルなままです。`session.dmScope` はチャネルに帰属可能なエビデンスではないため、`channelIds` でスコープ設定できません。

`policy.jsonc` に存在するすべてのスコープは、有効かつ実施可能でなければなりません。

#### チャネル

| Policy フィールド                    | 観測対象の状態                            | 使用する場合                                                    |
| ------------------------------------ | --------------------------------------- | ------------------------------------------------------------ |
| `channels.denyRules[].when.provider` | `channels.*` のプロバイダーと有効化状態     | `telegram` などのプロバイダーから設定済みチャネルを拒否する場合。 |
| `channels.denyRules[].reason`        | 検出メッセージと修復ヒントのコンテキスト      | プロバイダーが拒否される理由を説明する場合。                       |

#### MCP サーバー

| Policy フィールド    | 観測対象の状態        | 使用する場合                                                |
| ------------------- | ------------------- | ---------------------------------------------------------- |
| `mcp.servers.allow` | `mcp.servers.*` の ID | 設定済みのすべての MCP サーバーが許可リストに含まれることを必須にする場合。 |
| `mcp.servers.deny`  | `mcp.servers.*` の ID | 設定済みの特定の MCP サーバー ID を拒否する場合。              |

#### モデルプロバイダー

| Policy フィールド         | 観測対象の状態                                     | 使用する場合                                                                       |
| ------------------------ | ------------------------------------------------ | ------------------------------------------------------------------------------- |
| `models.providers.allow` | `models.providers.*` の ID と選択されたモデル参照 | 設定済みプロバイダーと選択されたモデル参照で、承認済みプロバイダーの使用を必須にする場合。 |
| `models.providers.deny`  | `models.providers.*` の ID と選択されたモデル参照 | 設定済みプロバイダーと選択されたモデル参照を、プロバイダー ID に基づいて拒否する場合。    |

#### ネットワーク

| Policy フィールド               | 観測対象の状態                         | 使用する場合                                                       |
| ------------------------------ | ----------------------------------- | ------------------------------------------------------------------ |
| `network.privateNetwork.allow` | プライベートネットワークへの SSRF 回避経路 | プライベートネットワークへのアクセスを無効のままにするには、`false` に設定します。 |

#### 受信アクセスとチャネルアクセス

| ポリシーフィールド                        | 観測された状態                                                 | 使用する場合                                                             |
| ----------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `ingress.session.requireDmScope`          | `session.dmScope`                                              | レビュー済みのダイレクトメッセージ分離スコープを必須にする。             |
| `ingress.channels.allowDmPolicies`        | `channels.*.dmPolicy` およびレガシーなチャンネル DM ポリシーフィールド | レビュー済みのダイレクトメッセージチャンネルポリシーのみを許可する。     |
| `ingress.channels.denyOpenGroups`         | チャンネル、アカウント、およびグループの受信ポリシー           | 設定されたチャンネルとアカウントへのオープングループ受信を拒否する。     |
| `ingress.channels.requireMentionInGroups` | チャンネル、アカウント、グループ、ギルド、およびネストされたメンションゲート設定 | グループ受信がオープンまたはメンション制限付きの場合に、メンションゲートを必須にする。 |

#### Gateway

| ポリシーフィールド                      | 観測された状態                                 | 使用する場合                                                                           |
| --------------------------------------- | ---------------------------------------------- | -------------------------------------------------------------------------------------- |
| `gateway.exposure.allowNonLoopbackBind` | `gateway.bind`                                 | loopback への Gateway バインドを必須にするには `false` に設定する。                    |
| `gateway.exposure.allowTailscaleFunnel` | Tailscale serve/funnel の Gateway セキュリティ態勢 | Tailscale Funnel による公開を拒否するには `false` に設定する。                         |
| `gateway.auth.requireAuth`              | `gateway.auth.mode`                            | Gateway 認証の無効化を拒否するには `true` に設定する。                                 |
| `gateway.auth.requireExplicitRateLimit` | `gateway.auth.rateLimit`                       | 明示的な認証レート制限設定を必須にするには `true` に設定する。                         |
| `gateway.controlUi.allowInsecure`       | Control UI の安全でない認証、デバイス、オリジンの切り替え設定 | 安全でない Control UI 公開の切り替え設定を拒否するには `false` に設定する。            |
| `gateway.remote.allow`                  | リモート Gateway モードおよび設定              | リモート Gateway モードを拒否するには `false` に設定する。                             |
| `gateway.http.denyEndpoints`            | Gateway HTTP API エンドポイント               | `chatCompletions` や `responses` などのエンドポイント ID を拒否する。                  |
| `gateway.http.requireUrlAllowlists`     | Gateway HTTP の URL 取得入力                   | URL 取得入力で URL 許可リストを必須にするには `true` に設定する。                      |
| `gateway.nodes.denyCommands`            | `gateway.nodes.denyCommands`                   | `system.run` などの正確な Node コマンド ID が OpenClaw 設定で拒否されていることを必須にする。 |

`gateway.nodes.denyCommands` は、大文字と小文字を区別する完全一致の拒否スーパーセットルールです。
特権 Node コマンドが OpenClaw 設定によって明示的に
拒否されていることをポリシーで証明する必要がある場合に使用します。特権
Node コマンドを意図的に許可するデプロイでは、
`gateway.nodes.allowCommands` のみに依存せず、レビュー後に `policy.jsonc` を更新する必要があります。

#### エージェントワークスペース

| ポリシーフィールド               | 観測された状態                                                                        | 使用する場合                                                                             |
| -------------------------------- | ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `agents.workspace.allowedAccess` | `agents.defaults.sandbox.workspaceAccess` および `agents.list[].sandbox.workspaceAccess` | `none` や `ro` など、サンドボックスワークスペースへのアクセス値のみを許可する。          |
| `agents.workspace.denyTools`     | グローバルおよびエージェントごとのツール拒否設定                                      | 変更ツール（`exec`、`process`、`write`、`edit`、`apply_patch`）が拒否されていることを必須にする。 |

#### サンドボックスのセキュリティ態勢

| ポリシーフィールド                                    | 観測された状態                                            | 使用する場合                                                        |
| ----------------------------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------- |
| `sandbox.requireMode`                                 | `agents.defaults.sandbox.mode` およびエージェントごとのモード | `all` や `non-main` など、レビュー済みのサンドボックスモードのみを許可する。 |
| `sandbox.allowBackends`                               | `agents.defaults.sandbox.backend` およびエージェントごとのバックエンド | `docker` など、レビュー済みのサンドボックスバックエンドのみを許可する。 |
| `sandbox.containers.denyHostNetwork`                  | コンテナベースのサンドボックス／ブラウザのネットワークモード | ホストネットワークモードを拒否する。                                |
| `sandbox.containers.denyContainerNamespaceJoin`       | コンテナベースのサンドボックス／ブラウザのネットワークモード | 別のコンテナのネットワーク名前空間への参加を拒否する。              |
| `sandbox.containers.requireReadOnlyMounts`            | コンテナベースのサンドボックス／ブラウザのマウントモード   | マウントを読み取り専用にすることを必須にする。                       |
| `sandbox.containers.denyContainerRuntimeSocketMounts` | コンテナベースのサンドボックス／ブラウザのマウント先       | コンテナランタイムソケットのマウントを拒否する。                    |
| `sandbox.containers.denyUnconfinedProfiles`           | コンテナセキュリティプロファイルのセキュリティ態勢          | 制約のないコンテナセキュリティプロファイルを拒否する。              |
| `sandbox.browser.requireCdpSourceRange`               | サンドボックスブラウザの CDP ソース範囲                    | ブラウザの CDP 公開でソース範囲の宣言を必須にする。                  |

ポリシーでは、欠落している `sandbox.mode` を暗黙のデフォルト値 `off` として扱うため、
`sandbox.requireMode` は、新規または未設定のサンドボックスを
`["all"]` などの許可リストの範囲外として報告します。

#### データ処理

| ポリシーフィールド                                  | 観測された状態                                                                       | 使用する場合                                                             |
| --------------------------------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------ |
| `dataHandling.sensitiveLogging.requireRedaction`    | `logging.redactSensitive`                                                            | `logging.redactSensitive: "off"` を拒否するには `true` に設定する。      |
| `dataHandling.telemetry.denyContentCapture`         | `diagnostics.otel.captureContent`                                                    | テレメトリによるコンテンツ取得を拒否するには `true` に設定する。         |
| `dataHandling.retention.requireSessionMaintenance`  | `session.maintenance.mode`                                                           | 有効なセッションメンテナンスモード `enforce` を必須にするには `true` に設定する。 |
| `dataHandling.memory.denySessionTranscriptIndexing` | `memory.qmd.sessions.enabled` および `agents.*.memorySearch.experimental.sessionMemory` | セッショントランスクリプトのメモリへのインデックス作成を拒否するには `true` に設定する。 |

#### シークレット

| ポリシーフィールド                | 観測された状態                                           | 使用する場合                                                              |
| --------------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------- |
| `secrets.requireManagedProviders` | 設定の SecretRef および `secrets.providers.*` 宣言       | SecretRef が宣言済みプロバイダーを参照することを必須にするには `true` に設定する。 |
| `secrets.denySources`             | シークレットプロバイダーのソースおよび SecretRef のソース | `exec`、`file`、または設定済みの別のソース名などのソースを拒否する。      |
| `secrets.allowInsecureProviders`  | 安全でないシークレットプロバイダーのセキュリティ態勢フラグ | 安全でないセキュリティ態勢を選択するプロバイダーを拒否するには `false` に設定する。 |

#### Exec 承認

Exec 承認チェックは、ランタイムの `exec-approvals.json` アーティファクトを読み取ります。
デフォルトでは `~/.openclaw/exec-approvals.json`、または
`OPENCLAW_STATE_DIR` が設定されている場合は
`$OPENCLAW_STATE_DIR/exec-approvals.json` です。
`execApprovals.defaults.*` または `execApprovals.agents.*` 配下の
セキュリティ態勢ルールには、読み取り可能なアーティファクトの証拠が必要です。アーティファクトが欠落しているか無効な場合、
ベストエフォートで合格とはせず、観測不能な証拠として報告されます。読み取り可能になると、省略された
フィールドはランタイムのデフォルトを継承します。`defaults.security` が欠落している場合は `full` となり、
エージェントのセキュリティ設定が欠落している場合はそのデフォルトを継承します。証拠には `defaults`、
`agents.*`、`agents.*.allowlist[].pattern`、任意の `argPattern`、有効な
`autoAllowSkills` のセキュリティ態勢、およびエントリのソースが含まれます。ソケットパス／トークン、
`commandText`、`lastUsedCommand`、解決済みパス、タイムスタンプは決して含まれません。

| ポリシーフィールド                          | 観測された状態                                                                         | 使用する場合                                                                              |
| ------------------------------------------- | -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `execApprovals.requireFile`                 | アクティブなランタイムの `exec-approvals.json` パス                                    | 承認アーティファクトが存在し、解析可能であることを必須にするには `true` に設定する。       |
| `execApprovals.defaults.allowSecurity`      | `defaults.security`。デフォルトは `full`                                               | 承認済みのデフォルト承認セキュリティモードのみを許可する。                                |
| `execApprovals.agents.allowSecurity`        | `agents.*.security`。デフォルトを継承                                                  | エージェントごとに、承認済みの有効な承認セキュリティモードのみを許可する。                |
| `execApprovals.agents.allowAutoAllowSkills` | `defaults.autoAllowSkills` および `agents.*.autoAllowSkills`。ランタイムのデフォルトを継承 | 暗黙的な Skills CLI 承認を使用せず、厳格な手動許可リストを必須にするには `false` に設定する。 |
| `execApprovals.agents.allowlist.expected`   | `agents.*.allowlist[]` のパターンおよび任意の argPattern エントリの集合                 | 承認許可リストがレビュー済みのパターンセットと一致することを必須にする。                  |

例：承認アーティファクトを必須にし、制限の緩いデフォルトを拒否し、選択したエージェントについて
レビュー済みの Exec 承認セキュリティ態勢のみを許可します。

```jsonc
{
  "execApprovals": {
    "requireFile": true,
    "defaults": {
      // セキュリティモード: "deny"、"allowlist"、または "full"。
      // このデフォルトでは、制限された deny 姿勢のみを許可します。
      "allowSecurity": ["deny"],
    },
  },
  "scopes": {
    "restricted-shell": {
      "agentIds": ["family-agent", "groups-agent"],
      "execApprovals": {
        "agents": {
          // 選択されたエージェントは、レビュー済みの allowlist 姿勢を使用できますが、"full" は使用できません。
          "allowSecurity": ["allowlist"],
          // false は、autoAllowSkills によって暗黙的に承認されるのではなく、
          // Skills の CLI がレビュー済みの allowlist に含まれている必要があることを意味します。
          "allowAutoAllowSkills": false,
          "allowlist": {
            "expected": [
              // 単純なエントリ: argPattern のない、正確にレビューされた実行可能ファイルパターン。
              "travel-hub",
              // 制約付きエントリ: パターンとレビュー済みの引数正規表現。
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

| ポリシーフィールド                | 観測された状態                               | 使用する場合                                                                                 |
| ------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `auth.profiles.requireMetadata` | `auth.profiles.*` のプロバイダーおよびモードのメタデータ | 設定の認証プロファイルに `provider` や `mode` などのメタデータキーを必須とする場合。               |
| `auth.profiles.allowModes`      | `auth.profiles.*.mode`                       | `api_key`、`aws-sdk`、`oauth`、`token` など、サポートされている認証プロファイルモードのみを許可する場合。 |

#### ツールのメタデータ

| ポリシーフィールド        | 観測された状態                   | 使用する場合                                                                                   |
| ----------------------- | -------------------------------- | ------------------------------------------------------------------------------------------ |
| `tools.requireMetadata` | 管理対象の `TOOLS.md` 宣言 | 管理対象ツールに `risk`、`sensitivity`、`owner` などのメタデータキーの宣言を必須とする場合。 |

#### ツールの姿勢

| ポリシーフィールド                | 観測された状態                                              | 使用する場合                                                                                                 |
| ------------------------------- | ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `tools.profiles.allow`          | `tools.profile` および `agents.list[].tools.profile`           | `minimal`、`messaging`、`coding` などのツールプロファイル ID のみを許可する場合。                                 |
| `tools.fs.requireWorkspaceOnly` | `tools.fs.workspaceOnly` およびエージェントごとの `tools.fs` オーバーライド | ファイルシステムツールをワークスペース専用の姿勢にすることを必須とするには、`true` に設定します。                                         |
| `tools.exec.allowSecurity`      | `tools.exec.security` およびエージェントごとの実行セキュリティ           | `deny` や `allowlist` などの実行セキュリティモードのみを許可する場合。                                            |
| `tools.exec.requireAsk`         | `tools.exec.ask` およびエージェントごとの実行確認モード                | `always` などの承認姿勢を必須とする場合。                                                               |
| `tools.exec.allowHosts`         | `tools.exec.host` およびエージェントごとの実行ホストルーティング           | `sandbox` などの実行ホストルーティングモードのみを許可する場合。                                                    |
| `tools.elevated.allow`          | `tools.elevated.enabled` およびエージェントごとの昇格姿勢     | 昇格ツールモードを無効のままにすることを必須とするには、`false` に設定します。                                           |
| `tools.alsoAllow.expected`      | `tools.alsoAllow` およびエージェントごとの `tools.alsoAllow`           | 正確な `alsoAllow` エントリを必須とし、不足または予期しない追加のツール権限を報告する場合。                 |
| `tools.denyTools`               | `tools.deny` および `agents.list[].tools.deny`                 | 設定されたツール拒否リストに、`group:runtime` や `group:fs` などのツール ID またはグループを含めることを必須とする場合。 |

## チェックの実行

作成中にポリシーのみのチェックを実行します。

```bash
openclaw policy check
openclaw policy check --json
openclaw policy check --severity-min error
```

`policy check` はポリシーチェックセットのみを実行し、証拠、検出事項、
および証明ハッシュを出力します。Policy Plugin が有効な場合、同じ検出事項が
`openclaw doctor --lint` にも表示されます。

オペレーターのポリシーファイルを作成済みのベースラインと比較します。

```bash
openclaw policy compare --baseline official.policy.jsonc
openclaw policy compare --baseline official.policy.jsonc --policy policy.jsonc --json
```

`policy compare` はポリシーファイルの構文同士を比較します。ランタイム状態、
証拠、認証情報、シークレットは検査しません。スコープ付きオーバーレイを管理するものと同じ
ルールメタデータを使用します。allowlist は同等またはより狭く、
denylist は同等またはより広く維持する必要があり、必須のブール値は
その値を維持する必要があります。順序付き文字列は設定された順序の
より厳格な側にのみ移動でき、完全一致リストは一致する必要があります。ベースラインには
組織が作成したポリシーを使用でき、チェック対象のポリシーにはより厳格な値や
追加ルールを加えることができます。トップレベルのチェック対象ルールは、
同等またはより制限的であれば、スコープ付きベースラインルールを満たせます。
ファイル間でスコープ名を一致させる必要はありません。比較はセレクター
（`agentIds`/`channelIds`）とフィールドをキーとして行われます。

問題のない比較（`--json`）:

```json
{
  "ok": true,
  "baselinePath": "official.policy.jsonc",
  "policyPath": "policy.jsonc",
  "rulesChecked": 3,
  "findings": []
}
```

問題のない `policy check --json` の出力には、オペレーターまたは
スーパーバイザーが記録できる安定したハッシュが含まれます。

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

ポリシー設定は `plugins.entries.policy.config` にあります。

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

| 設定                      | 目的                                                         |
| ------------------------- | --------------------------------------------------------------- |
| `enabled`                 | `policy.jsonc` が存在する前でもポリシーチェックを有効にします。         |
| `workspaceRepairs`        | `doctor --fix` によるポリシー管理対象のワークスペース設定の編集を許可します。 |
| `expectedHash`            | 承認済みポリシー成果物のオプションのハッシュロック。            |
| `expectedAttestationHash` | 最後に受理された問題のないポリシーチェックのオプションのハッシュロック。    |
| `path`                    | ポリシー成果物のワークスペース相対位置。             |

Plugin をインストールしたままワークスペースのポリシーチェックを
無効にするには、`plugins.entries.policy.config.enabled` を `false` に設定します。

## ポリシー状態の受理

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

`attestation.policy.hash` は作成されたルール成果物を識別します。`evidence` は
チェックで使用された観測済みの OpenClaw 状態を記録し、
`workspace.hash` はその証拠ペイロードを識別します。`findingsHash` は
正確な検出事項セットを識別します。`checkedAt` はチェックが実行された時刻を記録します。
`attestationHash` は安定した主張（ポリシーハッシュ、証拠ハッシュ、
検出事項ハッシュ、および問題あり／なしの状態）を識別し、意図的に `checkedAt` を除外します。
そのため、同じポリシー状態からは常に同じ証明ハッシュが生成されます。これら
4 つの値を合わせたものが、1 回のポリシーチェックに対する監査タプルです。

Gateway またはスーパーバイザーがポリシーを使用してランタイムアクションを
ブロック、承認、または注釈付けする場合、最後の問題のないチェックの証明ハッシュを記録する必要があります。
`checkedAt` は監査ログ用に JSON 出力へ残りますが、
安定したハッシュの一部ではありません。

ポリシー状態を受理するライフサイクル:

1. `policy.jsonc` を作成またはレビューします。
2. `openclaw policy check --json` を実行します。
3. 問題がなければ、`attestation.policy.hash` を `expectedHash` として記録します。
4. `attestation.attestationHash` を `expectedAttestationHash` として記録します。
5. CI またはリリースゲートで `openclaw doctor --lint` を再実行します。

ポリシールールを意図的に変更した場合は、クリーンなチェック結果に基づいて、許可済みの両方のハッシュを更新してください。ワークスペース設定のみを変更した場合（ポリシー自体は変更しない場合）は、通常 `expectedAttestationHash` のみが変更されます。

`agents.workspace` ルールを有効化またはアップグレードすると、ワークスペースハッシュとアテステーションハッシュに `agentWorkspace` エビデンスが追加されます。有効化後に新しいエビデンスを確認し、許可済みのアテステーションハッシュを更新してください。ツールのポスチャールールを有効化またはアップグレードした場合も、同様に `toolPosture` エビデンスが追加されます。

`openclaw policy watch` はチェックを再実行し、現在のエビデンスが `expectedAttestationHash` と一致しなくなったときに報告します。

```bash
openclaw policy watch --json
```

単一のドリフト評価が必要な CI またはスクリプトでは、`--once` を使用してください。`--once` を指定しない場合、デフォルトでは 2 秒ごとにポーリングします。間隔を変更するには `--interval-ms` を使用してください。

## 検出事項

| チェック ID                                              | 検出事項                                                                          |
| -------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `policy/policy-jsonc-missing`                            | ポリシーは有効ですが、`policy.jsonc` がありません。                               |
| `policy/policy-jsonc-invalid`                            | ポリシーを解析できないか、不正な形式のルールエントリが含まれています。            |
| `policy/policy-hash-mismatch`                            | ポリシーが設定済みの `expectedHash` と一致しません。                              |
| `policy/attestation-hash-mismatch`                       | 現在のポリシーエビデンスが許可済みのアテステーションと一致しなくなっています。    |
| `policy/policy-conformance-invalid`                      | ベースラインまたはチェック対象のポリシーファイルに無効な比較構文があります。      |
| `policy/policy-conformance-missing`                      | チェック対象のポリシーファイルに、ベースラインポリシーファイルで必須のルールがありません。 |
| `policy/policy-conformance-weaker`                       | チェック対象のポリシーファイルの値が、ベースラインポリシーファイルより緩くなっています。 |
| `policy/channels-denied-provider`                        | 有効なチャンネルが、チャンネル拒否ルールに一致しています。                        |
| `policy/mcp-denied-server`                               | 設定済みの MCP サーバーがポリシーによって拒否されています。                       |
| `policy/mcp-unapproved-server`                           | 設定済みの MCP サーバーが許可リストに含まれていません。                           |
| `policy/models-denied-provider`                          | 設定済みのモデルプロバイダーまたはモデル参照が、拒否されたプロバイダーを使用しています。 |
| `policy/models-unapproved-provider`                      | 設定済みのモデルプロバイダーまたはモデル参照が許可リストに含まれていません。       |
| `policy/network-private-access-enabled`                  | ポリシーで拒否されているにもかかわらず、プライベートネットワーク向け SSRF 回避手段が有効です。 |
| `policy/ingress-dm-policy-unapproved`                    | チャンネルの DM ポリシーがポリシーの許可リストに含まれていません。                 |
| `policy/ingress-dm-scope-unapproved`                     | `session.dmScope` がポリシーで必須とされる DM 分離スコープと一致しません。         |
| `policy/ingress-open-groups-denied`                      | ポリシーがオープングループからの受信を拒否しているにもかかわらず、チャンネルグループポリシーが `open` です。 |
| `policy/ingress-group-mention-required`                  | ポリシーでメンションゲートが必須であるにもかかわらず、チャンネルまたはグループのエントリで無効化されています。 |
| `policy/gateway-non-loopback-bind`                       | ポリシーで拒否されているにもかかわらず、Gateway のバインドポスチャーで非ループバックへの公開が許可されています。 |
| `policy/gateway-auth-disabled`                           | ポリシーで認証が必須であるにもかかわらず、Gateway の認証が無効です。               |
| `policy/gateway-rate-limit-missing`                      | ポリシーで必須であるにもかかわらず、Gateway の認証レート制限ポスチャーが明示されていません。 |
| `policy/gateway-control-ui-insecure`                     | Gateway Control UI の安全でない公開を許可する切り替えが有効です。                  |
| `policy/gateway-tailscale-funnel`                        | ポリシーで拒否されているにもかかわらず、Gateway の Tailscale Funnel 公開が有効です。 |
| `policy/gateway-remote-enabled`                          | ポリシーで拒否されているにもかかわらず、Gateway のリモートモードが有効です。        |
| `policy/gateway-http-endpoint-enabled`                   | ポリシーで拒否されているにもかかわらず、Gateway HTTP API エンドポイントが有効です。 |
| `policy/gateway-http-url-fetch-unrestricted`             | Gateway HTTP の URL フェッチ入力に、必須の URL 許可リストがありません。            |
| `policy/gateway-node-command-denied`                     | ポリシーで拒否されている Node コマンドが、OpenClaw の設定では拒否されていません。   |
| `policy/agents-workspace-access-denied`                  | エージェントのサンドボックスモードまたはワークスペースアクセスが、ポリシーの許可リストに含まれていません。 |
| `policy/agents-tool-not-denied`                          | エージェントまたはデフォルト設定で、ポリシーにより拒否が必須のツールが拒否されていません。 |
| `policy/tools-profile-unapproved`                        | 設定済みのグローバルまたはエージェント単位のツールプロファイルが許可リストに含まれていません。 |
| `policy/tools-fs-workspace-only-required`                | ファイルシステムツールが、ワークスペース内のパスのみに制限するポスチャーで設定されていません。 |
| `policy/tools-exec-security-unapproved`                  | Exec セキュリティモードがポリシーの許可リストに含まれていません。                  |
| `policy/tools-exec-ask-unapproved`                       | Exec 確認モードがポリシーの許可リストに含まれていません。                          |
| `policy/tools-exec-host-unapproved`                      | Exec ホストルーティングがポリシーの許可リストに含まれていません。                  |
| `policy/tools-elevated-enabled`                          | ポリシーで拒否されているにもかかわらず、昇格ツールモードが有効です。                |
| `policy/tools-also-allow-missing`                        | 設定済みの `alsoAllow` リストに、ポリシーで必須のエントリがありません。            |
| `policy/tools-also-allow-unexpected`                     | 設定済みの `alsoAllow` リストに、ポリシーで想定されていないエントリが含まれています。 |
| `policy/tools-required-deny-missing`                     | グローバルまたはエージェント単位のツール拒否リストに、拒否が必須のツールが含まれていません。 |
| `policy/sandbox-mode-unapproved`                         | サンドボックスモードがポリシーの許可リストに含まれていません。                    |
| `policy/sandbox-backend-unapproved`                      | サンドボックスバックエンドがポリシーの許可リストに含まれていません。              |
| `policy/sandbox-container-posture-unobservable`          | コンテナポスチャールールが、そのポスチャーを観測できないバックエンドで有効になっています。 |
| `policy/sandbox-container-host-network-denied`           | コンテナベースのサンドボックスまたはブラウザーがホストネットワークモードを使用しています。 |
| `policy/sandbox-container-namespace-join-denied`         | コンテナベースのサンドボックスまたはブラウザーが、別のコンテナの名前空間に参加しています。 |
| `policy/sandbox-container-mount-mode-required`           | コンテナベースのサンドボックスまたはブラウザーのマウントが読み取り専用ではありません。 |
| `policy/sandbox-container-runtime-socket-mount`          | コンテナベースのサンドボックスまたはブラウザーのマウントによって、コンテナランタイムソケットが公開されています。 |
| `policy/sandbox-container-unconfined-profile`            | ポリシーで拒否されているにもかかわらず、コンテナサンドボックスのプロファイルが制限なしになっています。 |
| `policy/sandbox-browser-cdp-source-range-missing`        | ポリシーで必須であるにもかかわらず、サンドボックスブラウザーの CDP ソース範囲がありません。 |
| `policy/data-handling-redaction-disabled`                | ポリシーで必須であるにもかかわらず、機密ログのマスキングが無効です。               |
| `policy/data-handling-telemetry-content-capture`         | ポリシーで拒否されているにもかかわらず、テレメトリーのコンテンツキャプチャが有効です。 |
| `policy/data-handling-session-retention-not-enforced`    | ポリシーで必須であるにもかかわらず、セッション保持期間のメンテナンスが適用されていません。 |
| `policy/data-handling-session-transcript-memory-enabled` | ポリシーで拒否されているにもかかわらず、セッショントランスクリプトのメモリインデックス作成が有効です。 |
| `policy/secrets-unmanaged-provider`                      | 設定の SecretRef が、`secrets.providers` で宣言されていないプロバイダーを参照しています。 |
| `policy/secrets-denied-provider-source`                  | 設定のシークレットプロバイダーまたは SecretRef が、ポリシーで拒否されたソースを使用しています。 |
| `policy/secrets-insecure-provider`                       | ポリシーで拒否されているにもかかわらず、シークレットプロバイダーで安全でないポスチャーが有効です。 |
| `policy/auth-profile-invalid-metadata`                   | 設定の認証プロファイルに、有効なプロバイダーまたはモードのメタデータがありません。 |
| `policy/auth-profile-unapproved-mode`                    | 設定の認証プロファイルモードがポリシーの許可リストに含まれていません。             |
| `policy/exec-approvals-missing`                          | ポリシーで `exec-approvals.json` が必須ですが、アーティファクトがありません。      |
| `policy/exec-approvals-invalid`                          | 設定済みの Exec 承認アーティファクトを解析できません。                            |
| `policy/exec-approvals-default-security-unapproved`      | Exec 承認のデフォルトで、ポリシーの許可リストに含まれていないセキュリティモードが使用されています。 |
| `policy/exec-approvals-agent-security-unapproved`        | エージェント単位で有効な Exec 承認セキュリティモードが許可リストに含まれていません。 |
| `policy/exec-approvals-auto-allow-skills-enabled`        | ポリシーで拒否されているにもかかわらず、Exec 承認エージェントが Skills の CLI を暗黙的に自動許可しています。 |
| `policy/exec-approvals-allowlist-missing`                | 承認許可リストに、ポリシーで必須のパターンがありません。                          |
| `policy/exec-approvals-allowlist-unexpected`             | 承認許可リストに、ポリシーで想定されていないパターンが含まれています。            |
| `policy/tools-missing-risk-level`                        | 管理対象のツール宣言にリスクメタデータがありません。                              |
| `policy/tools-unknown-risk-level`                        | 管理対象のツール宣言で不明なリスク値が使用されています。                          |
| `policy/tools-missing-sensitivity-token`                 | 管理対象のツール宣言に機密度メタデータがありません。                              |
| `policy/tools-missing-owner`                             | 管理対象のツール宣言に所有者メタデータがありません。                              |
| `policy/tools-unknown-sensitivity-token`                 | 管理対象のツール宣言で不明な機密度値が使用されています。                          |

検出事項には、準拠していないことが観測されたワークスペース内の対象を示す `target` と、その検出事項の根拠となった記述済みルールを示す `requirement` の両方を含めることができます。現在はいずれも `oc://` アドレス文字列ですが、フィールド名はアドレス形式ではなく、ポリシー上の役割を表しています。

検出事項の例:

```json
{
  "checkId": "policy/channels-denied-provider",
  "severity": "error",
  "message": "チャンネル 'telegram' は拒否されたプロバイダー 'telegram' を使用しています。",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/channels/telegram",
  "target": "oc://openclaw.config/channels/telegram",
  "requirement": "oc://policy.jsonc/channels/denyRules/#0",
  "fixHint": "Telegram はこのワークスペースでは承認されていません。"
}
```

```json
{
  "checkId": "policy/tools-missing-risk-level",
  "severity": "error",
  "message": "TOOLS.md のツール 'deploy' には明示的なリスク分類がありません。",
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
  "message": "MCPサーバー「remote」はポリシーの許可リストに含まれていません。",
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
  "message": "モデル参照「anthropic/claude-sonnet-4.7」は、承認されていないプロバイダー「anthropic」を使用しています。",
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
  "message": "ネットワーク設定「browser-private-network」はプライベートネットワークへのアクセスを許可しています。",
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
  "message": "Gatewayのバインド設定「gateway-bind」は、ループバック以外への公開を許可しています。",
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
  "message": "GatewayのNodeコマンド「system.run」はポリシーで拒否されていますが、OpenClaw設定では拒否されていません。",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/gateway/nodes/denyCommands",
  "target": "oc://openclaw.config/gateway/nodes/denyCommands",
  "requirement": "oc://policy.jsonc/gateway/nodes/denyCommands",
  "fixHint": "「system.run」をgateway.nodes.denyCommandsに追加するか、レビュー後にポリシーを更新してください。"
}
```

```json
{
  "checkId": "policy/agents-workspace-access-denied",
  "severity": "error",
  "message": "agents.defaultsのサンドボックスworkspaceAccess「rw」はポリシーで許可されていません。",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/agents/defaults/sandbox/workspaceAccess",
  "target": "oc://openclaw.config/agents/defaults/sandbox/workspaceAccess",
  "requirement": "oc://policy.jsonc/agents/workspace/allowedAccess"
}
```

## 修復

`doctor --lint`と`policy check`は読み取り専用です。

`doctor --fix`は、`workspaceRepairs`が明示的に有効化されている場合にのみ、ポリシー管理対象のワークスペース設定を編集します。それ以外の場合、チェックは修復対象を報告しますが、設定は変更しません。

このバージョンでは、修復により`channels.denyRules`で拒否されたチャンネルを無効化し、以下に示す自動的な制限強化の修復を適用できます。有効なルールによってワークスペース設定が変更される可能性があるため、ポリシーファイルをレビューした後にのみ`workspaceRepairs`を有効化してください。

- グローバルポリシーで昇格ツールが禁止されている場合、`tools.elevated.enabled=false`を設定する
- ポリシーで該当ツールの拒否が必須とされている場合、不足している必須拒否ツールIDを`tools.deny`または
  `agents.list[].tools.deny`に追加する
- 安全でない`gateway.controlUi.*`トグルを`false`に設定する
- ポリシーでリモートGatewayモードが拒否されている場合、`gateway.mode=local`を設定する
- ポリシーでGateway HTTP APIエンドポイントが拒否されている場合、報告された`gateway.http.endpoints.*.enabled`パスを`false`に設定する
- ポリシーでオープンなグループ受信が拒否されている場合、報告されたチャンネル受信の`groupPolicy`パスを`allowlist`に設定する
- ポリシーでグループメンションが必須とされている場合、報告されたチャンネル受信の`requireMention`パスを`true`に設定する
- ポリシーで機密ログのマスキングが必須とされている場合、`logging.redactSensitive=tools`を設定する
- ポリシーでテレメトリコンテンツのキャプチャが拒否されている場合、`diagnostics.otel.captureContent=false`を設定する。オブジェクト形式のテレメトリキャプチャ設定では、
  `diagnostics.otel.captureContent.enabled=false`を設定する

スコープ付き昇格ツールの修復は検出のみです。スコープ付きデータ処理の修復も、検出結果で共有のログまたはテレメトリ設定が報告されている場合はスキップされます。共有設定を変更すると、スコープ付きポリシーの対象範囲を超えて影響するためです。

スコープ付き必須拒否の修復は、検出結果で継承されたルート`tools.deny`が報告されている場合はスキップされます。必須ツールをルート設定に追加すると、スコープ付きポリシーの対象範囲を超えて影響するためです。エージェントローカルの必須拒否修復では、報告された`agents.list[].tools.deny`パスを更新できます。

スコープ付きチャンネル受信の修復は、検出結果で継承された`channels.defaults.*`が報告されている場合はスキップされます。共有チャンネルのデフォルトを変更すると、スコープ付きポリシーの対象範囲を超えて影響するためです。Gateway HTTP URL取得の許可リストに関する検出結果は、正しいエンドポイントURLの許可リスト値を自動修復で選択できないため、引き続き手動対応が必要です。

GatewayのバインドおよびNodeコマンドに関する検出結果には、引き続きレビューが必要です。`policy/gateway-non-loopback-bind`または`policy/gateway-node-command-denied`を設定パスにマッピングできる場合、`doctor --fix`は、提案する`gateway.bind`または`gateway.nodes.denyCommands`の変更を、スキップされたプレビューガイダンスとして報告します。変更は適用されず、オペレーターが設定またはポリシーをレビューして更新するまで、検出結果は修復済みとしてカウントされません。

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

| コマンド         | `0`                                                        | `1`                                                                  | `2`                          |
| ---------------- | ---------------------------------------------------------- | -------------------------------------------------------------------- | ---------------------------- |
| `policy check`   | しきい値に達した検出結果はありません。                     | 1件以上の検出結果がしきい値に達しました。                            | 引数または実行時の失敗です。 |
| `policy compare` | ポリシーファイルはベースライン以上に厳格です。             | ポリシーファイルが無効、不足、またはベースラインルールより緩いです。 | 引数または実行時の失敗です。 |
| `policy watch`   | 検出結果はなく、承認済みハッシュは最新です。               | 検出結果が存在するか、承認済みの証明が古くなっています。             | 引数または実行時の失敗です。 |

## 関連項目

- [Doctorのlintモード](/ja-JP/cli/doctor#lint-mode)
- [パスCLI](/ja-JP/cli/path)
