---
read_when:
    - 作成済みの `policy.jsonc` に照らして OpenClaw 設定を確認したい場合
    - doctor lint にポリシー検出結果が必要
    - 監査証拠用のポリシー証明ハッシュが必要です
summary: '`openclaw policy` 適合性チェックの CLI リファレンス'
title: ポリシー
x-i18n:
    generated_at: "2026-07-05T17:41:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 12f20bc0cf4f048ee70bba55540746297cb394a258138f2794dce1a1f6a6d4a2
    source_path: cli/policy.md
    workflow: 16
---

# `openclaw policy`

`openclaw policy` は、バンドルされた Policy Plugin によって提供されます。これは既存の OpenClaw 設定の上にあるエンタープライズ向け準拠レイヤーであり、2 つ目の設定システムではありません。要件は `policy.jsonc` に記述します。OpenClaw はアクティブなワークスペースを証拠として観測します。ポリシーは `doctor --lint` を通じてドリフトを報告します。Policy はリクエスト時にツール呼び出しを強制したり、ランタイムの動作を書き換えたりしません。また、`auth-profiles.json` のようなエージェントごとの認証情報ストアを証明しません。

Policy は、設定済みチャンネル、MCP サーバー、モデルプロバイダー、ネットワーク SSRF 姿勢、Ingress/チャンネルアクセス、Gateway の公開状態とノードコマンド姿勢、エージェントのワークスペースアクセス、サンドボックス姿勢、データ処理姿勢、シークレットプロバイダー/auth プロファイル姿勢、管理対象ツールメタデータ（`TOOLS.md`）をチェックします。ワークスペースに「Telegram は有効化してはならない」や「管理対象ツールはリスクと所有者メタデータを宣言しなければならない」といった、永続的でチェック可能な記述が必要な場合に使用します。証明やドリフト検出を伴わないローカル動作だけが必要な場合は、通常の設定で十分です。

## クイックスタート

```bash
openclaw plugins enable policy
```

`policy.jsonc` が存在しない場合でも Plugin は有効なままなので、doctor はチェックを黙ってスキップするのではなく、不足している成果物を報告できます。

`policy.jsonc` は手動で記述します。現在の設定から生成されるものではありません。各トップレベルセクションはルール名前空間です。チェックは、その下に具体的なルールが存在する場合にのみ実行されます（サポートされていないセクションやキーは黙って無視されるのではなく、`policy/policy-jsonc-invalid` として失敗します）。サポートされているすべてのセクションを網羅する最小例:

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

以下のルール表だけでは明らかでない横断的な注意事項:

- 非 local loopback バインドを拒否しつつ `gateway.bind` を省略する場合は、ランタイム既定値を受け入れることを意味します。厳密な準拠には `gateway.bind: "loopback"` を設定してください。
- 読み取り専用エージェントの場合は、該当する defaults/agent のサンドボックス `mode` を `all` または `non-main` に設定し、`workspaceAccess` を `none` または `ro` に設定します。サンドボックスモードが未設定または `off` の場合、読み取り専用ポリシーを満たしません。
- `agents.workspace.denyTools` は `exec`、`process`、`write`、`edit`、`apply_patch` を受け付けます。設定のツール拒否グループ `group:fs`（ファイル変更）と `group:runtime`（シェル/プロセス）は、同等の姿勢を満たします。
- Exec 承認チェックは、`execApprovals` ルールが存在する場合にのみ、ライブの `exec-approvals.json` 成果物を読み取ります。成果物が存在しない、または無効な場合は、合成された合格ではなく、観測不能な証拠です。
- シークレットと auth プロファイルの証拠は、プロバイダー/ソース姿勢と SecretRef メタデータのみを記録し、生の値は決して記録しません。Policy は `auth-profiles.json` のようなエージェントごとの認証情報ストアを読み取ったり証明したりしません。
- データ処理の証拠は設定レベルの姿勢のみです（リダクションモード、テレメトリキャプチャのトグル、セッション保守モード、トランスクリプトインデックス設定）。ログ、テレメトリのエクスポート、トランスクリプト、メモリファイルは検査しません。また、クリーンな結果は、それらの中に個人データやシークレットが存在しないことを証明しません。

### ポリシールールリファレンス

以下のすべてのルールは任意です。チェックはルールが存在する場合にのみ実行されます。観測される状態は、既存の OpenClaw 設定またはワークスペースメタデータです。

#### スコープ付きオーバーレイ

特定のエージェントまたはチャンネルに、トップレベルのベースラインより厳格なポリシーが必要な場合は、`scopes.<scopeName>` を使用します。スコープ名は単なるラベルです。照合にはスコープ内のセレクターが使用されます。オーバーレイは加算的です。グローバルルールは引き続き実行され、スコープ付きルールは同じ証拠に対して独自の検出結果を追加できます。

| セレクター   | サポートされるセクション                                                       | 使用する場合                                               |
| ------------ | ------------------------------------------------------------------------------ | ---------------------------------------------------------- |
| `agentIds`   | `tools`, `agents.workspace`, `sandbox`, `dataHandling.memory`, `execApprovals` | 1 つ以上のランタイムエージェントにより厳格なルールが必要な場合。 |
| `channelIds` | `ingress.channels`                                                             | 1 つ以上のチャンネルにより厳格な Ingress ルールが必要な場合。 |

`agentIds` エントリが `agents.list[]` に存在しない場合、OpenClaw はそのルールをスキップするのではなく、そのランタイムエージェント ID の継承されたグローバル/default 姿勢に対してスコープ付きルールを評価します。

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

同じエージェントは、上記のように各スコープが異なるフィールドを管理する場合、複数のスコープに出現できます。同じエージェントに対してスコープ付きフィールドが繰り返される場合は、同等またはより制限的でなければなりません。より弱い重複した主張は拒否されます（許可リストはサブセット、拒否リストはスーパーセット、必須ブール値は固定です）。

コンテナ姿勢ルール（`sandbox.containers.*`）は、照合されたエージェントのサンドボックスバックエンドが公開できる証拠に対してのみチェックされます。バックエンドが有効化されたルールを観測できない場合、Policy は合格ではなく `policy/sandbox-container-posture-unobservable` を報告します。コンテナルールは、それを公開できるバックエンドを使用するエージェントグループにスコープしてください。

トップレベルの `ingress.session.requireDmScope` はグローバルのままです。`session.dmScope` はチャンネルに帰属できる証拠ではないため、`channelIds` ではスコープできません。

`policy.jsonc` に存在するすべてのスコープは、有効かつ強制可能でなければなりません。

#### チャンネル

| ポリシーフィールド                 | 観測される状態                          | 使用する場合                                               |
| ---------------------------------- | --------------------------------------- | ---------------------------------------------------------- |
| `channels.denyRules[].when.provider` | `channels.*` provider と enabled 状態 | `telegram` のようなプロバイダーから設定済みチャンネルを拒否する場合。 |
| `channels.denyRules[].reason`      | 検出メッセージと修復ヒントのコンテキスト | プロバイダーが拒否される理由を説明する場合。               |

#### MCP サーバー

| ポリシーフィールド | 観測される状態      | 使用する場合                                                 |
| ------------------ | ------------------- | ------------------------------------------------------------ |
| `mcp.servers.allow` | `mcp.servers.*` ids | 設定済みのすべての MCP サーバーが許可リストに含まれることを要求する場合。 |
| `mcp.servers.deny`  | `mcp.servers.*` ids | 特定の設定済み MCP サーバー ID を拒否する場合。              |

#### モデルプロバイダー

| ポリシーフィールド        | 観測される状態                                   | 使用する場合                                                                   |
| ------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------ |
| `models.providers.allow` | `models.providers.*` ids と選択済みモデル参照 | 設定済みプロバイダーと選択済みモデル参照が承認済みプロバイダーを使用することを要求する場合。 |
| `models.providers.deny`  | `models.providers.*` ids と選択済みモデル参照 | プロバイダー ID によって設定済みプロバイダーと選択済みモデル参照を拒否する場合。 |

#### ネットワーク

| ポリシーフィールド             | 観測される状態                         | 使用する場合                                                     |
| ------------------------------ | -------------------------------------- | ---------------------------------------------------------------- |
| `network.privateNetwork.allow` | プライベートネットワーク SSRF エスケープハッチ | プライベートネットワークアクセスを無効のままにすることを要求するには `false` に設定します。 |

#### Ingress とチャンネルアクセス

| ポリシーフィールド                              | 観測された状態                                                 | 使用する場合                                                           |
| ----------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------ |
| `ingress.session.requireDmScope`          | `session.dmScope`                                              | レビュー済みのダイレクトメッセージ分離スコープを必須にする。                 |
| `ingress.channels.allowDmPolicies`        | `channels.*.dmPolicy` およびレガシーチャンネル DM ポリシーフィールド      | レビュー済みのダイレクトメッセージチャンネルポリシーのみを許可する。               |
| `ingress.channels.denyOpenGroups`         | チャンネル、アカウント、およびグループ ingress ポリシー                     | 設定済みのチャンネルとアカウントでオープングループ ingress を拒否する。      |
| `ingress.channels.requireMentionInGroups` | チャンネル、アカウント、グループ、ギルド、およびネストされたメンションゲート設定 | グループ ingress が開いている、またはメンションゲート付きの場合にメンションゲートを必須にする。 |

#### Gateway

| ポリシーフィールド                            | 観測された状態                                 | 使用する場合                                                                             |
| --------------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------ |
| `gateway.exposure.allowNonLoopbackBind` | `gateway.bind`                                 | ループバック Gateway バインドを必須にするには `false` に設定する。                                  |
| `gateway.exposure.allowTailscaleFunnel` | Tailscale serve/funnel Gateway 姿勢         | Tailscale Funnel 公開を拒否するには `false` に設定する。                                    |
| `gateway.auth.requireAuth`              | `gateway.auth.mode`                            | 無効化された Gateway 認証を拒否するには `true` に設定する。                                       |
| `gateway.auth.requireExplicitRateLimit` | `gateway.auth.rateLimit`                       | 明示的な認証レート制限設定を必須にするには `true` に設定する。                            |
| `gateway.controlUi.allowInsecure`       | Control UI の安全でない認証/デバイス/オリジン切り替え | 安全でない Control UI 公開切り替えを拒否するには `false` に設定する。                         |
| `gateway.remote.allow`                  | リモート Gateway モード/設定                     | リモート Gateway モードを拒否するには `false` に設定する。                                          |
| `gateway.http.denyEndpoints`            | Gateway HTTP API エンドポイント                     | `chatCompletions` や `responses` などのエンドポイント ID を拒否する。                          |
| `gateway.http.requireUrlAllowlists`     | Gateway HTTP URL フェッチ入力                  | URL フェッチ入力で URL 許可リストを必須にするには `true` に設定する。                         |
| `gateway.nodes.denyCommands`            | `gateway.nodes.denyCommands`                   | `system.run` などの正確なノードコマンド ID が OpenClaw 設定で拒否されることを必須にする。 |

`gateway.nodes.denyCommands` は、正確で大文字小文字を区別する拒否スーパーセットルールです。
特権ノードコマンドが OpenClaw 設定で明示的に
拒否されていることをポリシーで証明する必要がある場合に使用します。特権
ノードコマンドを意図的に許可するデプロイメントでは、
`gateway.nodes.allowCommands` のみに依存するのではなく、レビュー後に `policy.jsonc` を更新する必要があります。

#### エージェントワークスペース

| ポリシーフィールド                     | 観測された状態                                                                        | 使用する場合                                                                                 |
| -------------------------------- | ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `agents.workspace.allowedAccess` | `agents.defaults.sandbox.workspaceAccess` および `agents.list[].sandbox.workspaceAccess` | `none` や `ro` などのサンドボックスワークスペースアクセス値のみを許可する。                       |
| `agents.workspace.denyTools`     | グローバルおよびエージェントごとのツール拒否設定                                                 | 変更ツール（`exec`、`process`、`write`、`edit`、`apply_patch`）が拒否されることを必須にする。 |

#### サンドボックス姿勢

| ポリシーフィールド                                          | 観測された状態                                          | 使用する場合                                                       |
| ----------------------------------------------------- | ------------------------------------------------------- | -------------------------------------------------------------- |
| `sandbox.requireMode`                                 | `agents.defaults.sandbox.mode` およびエージェントごとのモード       | `all` や `non-main` などのレビュー済みサンドボックスモードのみを許可する。 |
| `sandbox.allowBackends`                               | `agents.defaults.sandbox.backend` およびエージェントごとのバックエンド | `docker` などのレビュー済みサンドボックスバックエンドのみを許可する。         |
| `sandbox.containers.denyHostNetwork`                  | コンテナベースのサンドボックス/ブラウザネットワークモード           | ホストネットワークモードを拒否する。                                        |
| `sandbox.containers.denyContainerNamespaceJoin`       | コンテナベースのサンドボックス/ブラウザネットワークモード           | 別のコンテナネットワーク名前空間への参加を拒否する。              |
| `sandbox.containers.requireReadOnlyMounts`            | コンテナベースのサンドボックス/ブラウザマウントモード             | マウントを読み取り専用にすることを必須にする。                                |
| `sandbox.containers.denyContainerRuntimeSocketMounts` | コンテナベースのサンドボックス/ブラウザマウントターゲット          | コンテナランタイムソケットマウントを拒否する。                          |
| `sandbox.containers.denyUnconfinedProfiles`           | コンテナセキュリティプロファイル姿勢                      | 非制限コンテナセキュリティプロファイルを拒否する。                   |
| `sandbox.browser.requireCdpSourceRange`               | サンドボックスブラウザ CDP ソース範囲                        | ブラウザ CDP 公開でソース範囲の宣言を必須にする。        |

ポリシーは欠落した `sandbox.mode` を暗黙のデフォルト `off` として扱うため、
`sandbox.requireMode` は、新規または未設定のサンドボックスを
`["all"]` などの許可リストの範囲外として報告します。

#### データ処理

| ポリシーフィールド                                        | 観測された状態                                                                       | 使用する場合                                                               |
| --------------------------------------------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------- |
| `dataHandling.sensitiveLogging.requireRedaction`    | `logging.redactSensitive`                                                            | `logging.redactSensitive: "off"` を拒否するには `true` に設定する。              |
| `dataHandling.telemetry.denyContentCapture`         | `diagnostics.otel.captureContent`                                                    | テレメトリのコンテンツキャプチャを拒否するには `true` に設定する。                     |
| `dataHandling.retention.requireSessionMaintenance`  | `session.maintenance.mode`                                                           | 有効なセッションメンテナンスモード `enforce` を必須にするには `true` に設定する。 |
| `dataHandling.memory.denySessionTranscriptIndexing` | `memory.qmd.sessions.enabled` および `agents.*.memorySearch.experimental.sessionMemory` | セッショントランスクリプトのメモリへのインデックス化を拒否するには `true` に設定する。       |

#### シークレット

| ポリシーフィールド                      | 観測された状態                                           | 使用する場合                                                                |
| --------------------------------- | -------------------------------------------------------- | ----------------------------------------------------------------------- |
| `secrets.requireManagedProviders` | 設定 SecretRefs および `secrets.providers.*` 宣言 | SecretRefs が宣言済みプロバイダーを指すことを必須にするには `true` に設定する。     |
| `secrets.denySources`             | シークレットプロバイダーソースおよび SecretRef ソース            | `exec`、`file`、または別の設定済みソース名などのソースを拒否する。 |
| `secrets.allowInsecureProviders`  | 安全でないシークレットプロバイダー姿勢フラグ                   | 安全でない姿勢を選択するプロバイダーを拒否するには `false` に設定する。      |

#### exec 承認

exec 承認チェックは、ランタイムの `exec-approvals.json` アーティファクトを読み取ります。
デフォルトでは `~/.openclaw/exec-approvals.json`、または
`OPENCLAW_STATE_DIR` が設定されている場合は `$OPENCLAW_STATE_DIR/exec-approvals.json` です。
`execApprovals.defaults.*` または `execApprovals.agents.*` 以下の
姿勢ルールには、読み取り可能なアーティファクト証拠が必要です。欠落または無効なアーティファクトは、
ベストエフォートの合格ではなく、観測不能な証拠として報告されます。読み取り可能になると、省略された
フィールドはランタイムデフォルトを継承します。欠落した `defaults.security` は `full` であり、
欠落したエージェントセキュリティはそのデフォルトを継承します。証拠には `defaults`、
`agents.*`、`agents.*.allowlist[].pattern`、任意の `argPattern`、有効な
`autoAllowSkills` 姿勢、およびエントリソースが含まれます。ソケットパス/トークン、
`commandText`、`lastUsedCommand`、解決済みパス、またはタイムスタンプは含まれません。

| ポリシーフィールド                                | 観測された状態                                                                         | 使用する場合                                                                                |
| ------------------------------------------- | -------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `execApprovals.requireFile`                 | アクティブなランタイム `exec-approvals.json` パス                                              | 承認アーティファクトが存在し、解析できることを必須にするには `true` に設定する。                     |
| `execApprovals.defaults.allowSecurity`      | `defaults.security`、デフォルトは `full`                                              | 承認済みのデフォルト承認セキュリティモードのみを許可する。                                    |
| `execApprovals.agents.allowSecurity`        | `agents.*.security`、デフォルトを継承                                               | 承認済みのエージェントごとの有効な承認セキュリティモードのみを許可する。                        |
| `execApprovals.agents.allowAutoAllowSkills` | `defaults.autoAllowSkills` および `agents.*.autoAllowSkills`、ランタイムデフォルトを継承 | 暗黙のスキル CLI 承認なしで厳密な手動許可リストを必須にするには `false` に設定する。 |
| `execApprovals.agents.allowlist.expected`   | 集約された `agents.*.allowlist[]` pattern および任意の argPattern エントリ               | 承認許可リストがレビュー済みパターンセットと一致することを必須にする。                      |

例: 承認アーティファクトを必須にし、寛容なデフォルトを拒否し、選択したエージェントについて
レビュー済みの exec 承認姿勢のみを許可します。

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

| ポリシーフィールド            | 観測された状態                                 | 使用する場合                                                                                 |
| ------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `auth.profiles.requireMetadata` | `auth.profiles.*` のプロバイダーとモードメタデータ | 設定の認証プロファイルで `provider` や `mode` などのメタデータキーを必須にする。               |
| `auth.profiles.allowModes`      | `auth.profiles.*.mode`                       | `api_key`、`aws-sdk`、`oauth`、`token` など、サポートされている認証プロファイルモードのみを許可する。 |

#### ツールメタデータ

| ポリシーフィールド        | 観測された状態                 | 使用する場合                                                                                 |
| ----------------------- | -------------------------------- | ------------------------------------------------------------------------------------------ |
| `tools.requireMetadata` | 管理対象の `TOOLS.md` 宣言 | 管理対象ツールで `risk`、`sensitivity`、`owner` などのメタデータキーの宣言を必須にする。 |

#### ツール態勢

| ポリシーフィールド              | 観測された状態                                              | 使用する場合                                                                                               |
| ------------------------------- | ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `tools.profiles.allow`          | `tools.profile` と `agents.list[].tools.profile`           | `minimal`、`messaging`、`coding` などのツールプロファイル ID のみを許可する。                                 |
| `tools.fs.requireWorkspaceOnly` | `tools.fs.workspaceOnly` とエージェントごとの `tools.fs` オーバーライド | ワークスペース限定のファイルシステムツール態勢を必須にするには `true` に設定する。                                         |
| `tools.exec.allowSecurity`      | `tools.exec.security` とエージェントごとの exec セキュリティ           | `deny` や `allowlist` などの exec セキュリティモードのみを許可する。                                            |
| `tools.exec.requireAsk`         | `tools.exec.ask` とエージェントごとの exec ask モード                | `always` などの承認態勢を必須にする。                                                               |
| `tools.exec.allowHosts`         | `tools.exec.host` とエージェントごとの exec ホストルーティング           | `sandbox` などの exec ホストルーティングモードのみを許可する。                                                    |
| `tools.elevated.allow`          | `tools.elevated.enabled` とエージェントごとの昇格態勢     | 昇格ツールモードを無効のままにするには `false` に設定する。                                           |
| `tools.alsoAllow.expected`      | `tools.alsoAllow` とエージェントごとの `tools.alsoAllow`           | 正確な `alsoAllow` エントリを必須にし、不足している、または想定外に追加されたツール許可を報告する。                 |
| `tools.denyTools`               | `tools.deny` と `agents.list[].tools.deny`                 | 設定済みのツール拒否リストに `group:runtime` や `group:fs` などのツール ID またはグループを含めることを必須にする。 |

## チェックを実行

作成中にポリシー専用チェックを実行します。

```bash
openclaw policy check
openclaw policy check --json
openclaw policy check --severity-min error
```

`policy check` はポリシーチェックセットのみを実行し、エビデンス、検出事項、
および証明ハッシュを出力します。同じ検出事項は、Policy Plugin が有効な場合に
`openclaw doctor --lint` にも表示されます。

オペレーターのポリシーファイルを、作成済みのベースラインと比較します。

```bash
openclaw policy compare --baseline official.policy.jsonc
openclaw policy compare --baseline official.policy.jsonc --policy policy.jsonc --json
```

`policy compare` は、ポリシーファイル構文をポリシーファイル構文に対してチェックします。
ランタイム状態、エビデンス、認証情報、シークレットは検査しません。スコープ付きオーバーレイを管理するものと同じ
ルールメタデータを使用します。許可リストは同一またはより狭く、
拒否リストは同一またはより広く、必須ブール値はその値を維持し、
順序付き文字列は設定された順序のより厳格な側にのみ移動でき、
完全一致リストは一致している必要があります。ベースラインは組織が作成した
ポリシーにできます。チェック対象ポリシーでは、より厳格な値や
追加ルールを加えられます。トップレベルのチェック対象ルールは、
同等またはより制限的であれば、スコープ付きベースラインルールを満たせます。
ファイル間でスコープ名が一致している必要はありません。比較はセレクター
（`agentIds`/`channelIds`）とフィールドをキーにします。

クリーンな比較（`--json`）:

```json
{
  "ok": true,
  "baselinePath": "official.policy.jsonc",
  "policyPath": "policy.jsonc",
  "rulesChecked": 3,
  "findings": []
}
```

クリーンな `policy check --json` 出力には、オペレーターまたは
スーパーバイザーが記録できる安定ハッシュが含まれます。

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

## ポリシーを設定

ポリシー設定は `plugins.entries.policy.config` の下にあります。

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
| `enabled`                 | `policy.jsonc` が存在する前でもポリシーチェックを有効にする。         |
| `workspaceRepairs`        | `doctor --fix` がポリシー管理対象のワークスペース設定を編集できるようにする。 |
| `expectedHash`            | 承認済みポリシー成果物用の任意のハッシュロック。            |
| `expectedAttestationHash` | 最後に受け入れられたクリーンなポリシーチェック用の任意のハッシュロック。    |
| `path`                    | ポリシー成果物のワークスペース相対の場所。             |

Plugin をインストールしたままワークスペースのポリシーチェックを無効にするには、
`plugins.entries.policy.config.enabled` を `false` に設定します。

## ポリシー状態を受け入れる

JSON 出力例:

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

`attestation.policy.hash` は作成されたルール成果物を識別します。`evidence` は
チェックで使用された観測済みの OpenClaw 状態を記録し、
`workspace.hash` はそのエビデンスペイロードを識別します。`findingsHash` は
正確な検出事項セットを識別します。`checkedAt` はチェックが実行された時刻を記録します。
`attestationHash` は安定した主張（ポリシーハッシュ、エビデンスハッシュ、
検出事項ハッシュ、クリーン/ダーティ状態）を識別し、意図的に `checkedAt` を除外します。
そのため、同じポリシー状態は常に同じ証明ハッシュを生成します。これら 4 つの値を合わせて、
1 回のポリシーチェックの監査タプルを形成します。

Gateway またはスーパーバイザーが、ランタイムアクションのブロック、承認、注釈付けに
ポリシーを使用する場合、最後のクリーンなチェックから取得した証明ハッシュを記録する必要があります。
`checkedAt` は監査ログ用に JSON 出力に残りますが、安定ハッシュの一部ではありません。

ポリシー状態を受け入れるライフサイクル:

1. `policy.jsonc` を作成またはレビューする。
2. `openclaw policy check --json` を実行する。
3. クリーンな場合、`attestation.policy.hash` を `expectedHash` として記録する。
4. `attestation.attestationHash` を `expectedAttestationHash` として記録する。
5. CI またはリリースゲートで `openclaw doctor --lint` を再実行する。

ポリシールールを意図的に変更した場合は、クリーンなチェックから両方の承認済みハッシュを更新します。ワークスペース設定だけが変更された場合（ポリシーは同じまま）、通常は `expectedAttestationHash` だけが変更されます。

`agents.workspace` ルールを有効化またはアップグレードすると、ワークスペースハッシュとアテステーションハッシュに `agentWorkspace` エビデンスが追加されます。有効化後は新しいエビデンスを確認し、承認済みアテステーションハッシュを更新してください。ツール態勢ルールを有効化またはアップグレードすると、同じ方法で `toolPosture` エビデンスが追加されます。

`openclaw policy watch` はチェックを再実行し、現在のエビデンスが `expectedAttestationHash` と一致しなくなったときに報告します。

```bash
openclaw policy watch --json
```

CI または単一のドリフト評価が必要なスクリプトでは `--once` を使用します。`--once` がない場合、既定では 2 秒ごとにポーリングします。間隔を変更するには `--interval-ms` を使用します。

## 検出事項

| チェック ID                                              | 検出事項                                                                          |
| -------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `policy/policy-jsonc-missing`                            | ポリシーは有効ですが、`policy.jsonc` がありません。                              |
| `policy/policy-jsonc-invalid`                            | ポリシーを解析できないか、不正な形式のルールエントリが含まれています。            |
| `policy/policy-hash-mismatch`                            | ポリシーが設定済みの `expectedHash` と一致しません。                              |
| `policy/attestation-hash-mismatch`                       | 現在のポリシーエビデンスが承認済みアテステーションと一致しなくなっています。      |
| `policy/policy-conformance-invalid`                      | ベースラインまたはチェック対象のポリシーファイルに無効な比較構文があります。      |
| `policy/policy-conformance-missing`                      | チェック対象のポリシーファイルに、ベースラインポリシーファイルで必須のルールがありません。 |
| `policy/policy-conformance-weaker`                       | チェック対象のポリシーファイルに、ベースラインポリシーファイルより弱い値があります。 |
| `policy/channels-denied-provider`                        | 有効なチャネルがチャネル拒否ルールに一致しています。                              |
| `policy/mcp-denied-server`                               | 設定済み MCP サーバーがポリシーによって拒否されています。                         |
| `policy/mcp-unapproved-server`                           | 設定済み MCP サーバーが許可リスト外です。                                         |
| `policy/models-denied-provider`                          | 設定済みモデルプロバイダーまたはモデル参照が、拒否されたプロバイダーを使用しています。 |
| `policy/models-unapproved-provider`                      | 設定済みモデルプロバイダーまたはモデル参照が許可リスト外です。                    |
| `policy/network-private-access-enabled`                  | ポリシーで拒否されているにもかかわらず、プライベートネットワーク SSRF エスケープハッチが有効です。 |
| `policy/ingress-dm-policy-unapproved`                    | チャネル DM ポリシーがポリシー許可リスト外です。                                  |
| `policy/ingress-dm-scope-unapproved`                     | `session.dmScope` がポリシーで要求される DM 分離スコープと一致しません。          |
| `policy/ingress-open-groups-denied`                      | ポリシーでオープングループの受信が拒否されているのに、チャネルグループポリシーが `open` です。 |
| `policy/ingress-group-mention-required`                  | ポリシーでメンションゲートが必須なのに、チャネルまたはグループエントリで無効化されています。 |
| `policy/gateway-non-loopback-bind`                       | ポリシーで拒否されているにもかかわらず、Gateway バインド態勢が非ループバック公開を許可しています。 |
| `policy/gateway-auth-disabled`                           | ポリシーで認証が必須なのに、Gateway 認証が無効です。                              |
| `policy/gateway-rate-limit-missing`                      | ポリシーで必須なのに、Gateway 認証レート制限態勢が明示されていません。            |
| `policy/gateway-control-ui-insecure`                     | Gateway Control UI の安全でない公開トグルが有効です。                             |
| `policy/gateway-tailscale-funnel`                        | ポリシーで拒否されているにもかかわらず、Gateway Tailscale Funnel 公開が有効です。 |
| `policy/gateway-remote-enabled`                          | ポリシーで拒否されているにもかかわらず、Gateway リモートモードがアクティブです。  |
| `policy/gateway-http-endpoint-enabled`                   | ポリシーで拒否されているにもかかわらず、Gateway HTTP API エンドポイントが有効です。 |
| `policy/gateway-http-url-fetch-unrestricted`             | Gateway HTTP URL フェッチ入力に、必須の URL 許可リストがありません。              |
| `policy/gateway-node-command-denied`                     | ポリシーで拒否されたノードコマンドが OpenClaw 設定で拒否されていません。          |
| `policy/agents-workspace-access-denied`                  | エージェントのサンドボックスモードまたはワークスペースアクセスがポリシー許可リスト外です。 |
| `policy/agents-tool-not-denied`                          | エージェントまたは既定設定が、ポリシーで必須のツールを拒否していません。          |
| `policy/tools-profile-unapproved`                        | 設定済みのグローバルまたはエージェント単位のツールプロファイルが許可リスト外です。 |
| `policy/tools-fs-workspace-only-required`                | ファイルシステムツールがワークスペース限定パス態勢で設定されていません。          |
| `policy/tools-exec-security-unapproved`                  | Exec セキュリティモードがポリシー許可リスト外です。                               |
| `policy/tools-exec-ask-unapproved`                       | Exec 確認モードがポリシー許可リスト外です。                                       |
| `policy/tools-exec-host-unapproved`                      | Exec ホストルーティングがポリシー許可リスト外です。                               |
| `policy/tools-elevated-enabled`                          | ポリシーで拒否されているにもかかわらず、昇格ツールモードが有効です。              |
| `policy/tools-also-allow-missing`                        | 設定済みの `alsoAllow` リストに、ポリシーで必須のエントリがありません。           |
| `policy/tools-also-allow-unexpected`                     | 設定済みの `alsoAllow` リストに、ポリシーで想定されていないエントリが含まれています。 |
| `policy/tools-required-deny-missing`                     | グローバルまたはエージェント単位のツール拒否リストに、必須の拒否ツールが含まれていません。 |
| `policy/sandbox-mode-unapproved`                         | サンドボックスモードがポリシー許可リスト外です。                                  |
| `policy/sandbox-backend-unapproved`                      | サンドボックスバックエンドがポリシー許可リスト外です。                            |
| `policy/sandbox-container-posture-unobservable`          | 監視できないバックエンドに対してコンテナ態勢ルールが有効です。                    |
| `policy/sandbox-container-host-network-denied`           | コンテナベースのサンドボックスまたはブラウザーがホストネットワークモードを使用しています。 |
| `policy/sandbox-container-namespace-join-denied`         | コンテナベースのサンドボックスまたはブラウザーが別のコンテナ名前空間に参加しています。 |
| `policy/sandbox-container-mount-mode-required`           | コンテナベースのサンドボックスまたはブラウザーマウントが読み取り専用ではありません。 |
| `policy/sandbox-container-runtime-socket-mount`          | コンテナベースのサンドボックスまたはブラウザーマウントがコンテナランタイムソケットを公開しています。 |
| `policy/sandbox-container-unconfined-profile`            | ポリシーで拒否されているにもかかわらず、コンテナサンドボックスプロファイルが unconfined です。 |
| `policy/sandbox-browser-cdp-source-range-missing`        | ポリシーで必須なのに、サンドボックスブラウザー CDP ソース範囲がありません。       |
| `policy/data-handling-redaction-disabled`                | ポリシーで必須なのに、機微なログのリダクションが無効です。                        |
| `policy/data-handling-telemetry-content-capture`         | ポリシーで拒否されているにもかかわらず、テレメトリーコンテンツキャプチャが有効です。 |
| `policy/data-handling-session-retention-not-enforced`    | ポリシーで必須なのに、セッション保持メンテナンスが強制されていません。            |
| `policy/data-handling-session-transcript-memory-enabled` | ポリシーで拒否されているにもかかわらず、セッショントランスクリプトのメモリインデックス化が有効です。 |
| `policy/secrets-unmanaged-provider`                      | 設定 SecretRef が、`secrets.providers` で宣言されていないプロバイダーを参照しています。 |
| `policy/secrets-denied-provider-source`                  | 設定シークレットプロバイダーまたは SecretRef が、ポリシーで拒否されたソースを使用しています。 |
| `policy/secrets-insecure-provider`                       | ポリシーで拒否されているにもかかわらず、シークレットプロバイダーが安全でない態勢を選択しています。 |
| `policy/auth-profile-invalid-metadata`                   | 設定認証プロファイルに、有効なプロバイダーまたはモードのメタデータがありません。  |
| `policy/auth-profile-unapproved-mode`                    | 設定認証プロファイルモードがポリシー許可リスト外です。                            |
| `policy/exec-approvals-missing`                          | ポリシーで `exec-approvals.json` が必須ですが、アーティファクトがありません。     |
| `policy/exec-approvals-invalid`                          | 設定済みの exec 承認アーティファクトを解析できません。                            |
| `policy/exec-approvals-default-security-unapproved`      | Exec 承認の既定値が、ポリシー許可リスト外のセキュリティモードを使用しています。  |
| `policy/exec-approvals-agent-security-unapproved`        | エージェント単位の有効な exec 承認セキュリティモードが許可リスト外です。          |
| `policy/exec-approvals-auto-allow-skills-enabled`        | ポリシーで拒否されているにもかかわらず、exec 承認エージェントが Skills CLI を暗黙的に自動許可しています。 |
| `policy/exec-approvals-allowlist-missing`                | 承認許可リストに、ポリシーで必須のパターンがありません。                          |
| `policy/exec-approvals-allowlist-unexpected`             | 承認許可リストに、ポリシーで想定されていないパターンが含まれています。            |
| `policy/tools-missing-risk-level`                        | 管理対象ツール宣言にリスクメタデータがありません。                                |
| `policy/tools-unknown-risk-level`                        | 管理対象ツール宣言が不明なリスク値を使用しています。                              |
| `policy/tools-missing-sensitivity-token`                 | 管理対象ツール宣言に機密度メタデータがありません。                                |
| `policy/tools-missing-owner`                             | 管理対象ツール宣言にオーナーメタデータがありません。                              |
| `policy/tools-unknown-sensitivity-token`                 | 管理対象ツール宣言が不明な機密度値を使用しています。                              |

検出事項には、`target`（準拠していない観測済みワークスペース対象）と `requirement`（検出事項になった作成済みルール）の両方を含めることができます。現在はいずれも `oc://` アドレス文字列ですが、フィールド名はアドレス形式ではなくポリシー上の役割を表します。

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

`doctor --fix` は、`workspaceRepairs` が明示的に有効な場合にのみ、ポリシー管理対象のワークスペース設定を編集します。それ以外の場合、チェックは修復対象を報告し、設定は変更しません。

このバージョンでは、修復により `channels.denyRules` で拒否されたチャンネルを無効化し、以下に示す自動的な絞り込み修復を適用できます。有効なルールによってワークスペース設定が変更される可能性があるため、ポリシーファイルのレビュー後にのみ `workspaceRepairs` を有効にしてください。

- グローバルポリシーが昇格ツールを禁止している場合、`tools.elevated.enabled=false` を設定する
- 安全でない `gateway.controlUi.*` トグルを `false` に設定する
- ポリシーがリモート Gateway モードを拒否している場合、`gateway.mode=local` を設定する
- ポリシーがセンシティブログのリダクションを要求している場合、`logging.redactSensitive=tools` を設定する
- ポリシーがテレメトリ内容のキャプチャを拒否している場合、`diagnostics.otel.captureContent=false`、またはオブジェクト形式のテレメトリキャプチャ設定では `diagnostics.otel.captureContent.enabled=false` を設定する

スコープ付き昇格ツール修復は検出のみです。スコープ付きデータ処理修復も、検出結果が共有ログ設定またはテレメトリ設定を報告している場合はスキップされます。共有設定を変更すると、スコープ付きポリシー対象を超えて影響するためです。

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

| コマンド         | `0`                                                       | `1`                                                                    | `2`                          |
| ---------------- | --------------------------------------------------------- | ---------------------------------------------------------------------- | ---------------------------- |
| `policy check`   | しきい値で検出結果がない。                                | 1件以上の検出結果がしきい値を満たした。                                | 引数またはランタイムの失敗。 |
| `policy compare` | ポリシーファイルがベースライン以上に厳格である。          | ポリシーファイルが無効、欠落、またはベースラインルールより弱い。       | 引数またはランタイムの失敗。 |
| `policy watch`   | 検出結果がなく、承認済みハッシュが最新である。            | 検出結果が存在する、または承認済み attest が古い。                     | 引数またはランタイムの失敗。 |

## 関連

- [Doctor lint モード](/ja-JP/cli/doctor#lint-mode)
- [Path CLI](/ja-JP/cli/path)
