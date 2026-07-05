---
read_when:
    - OpenClaw 設定を作成済みの policy.jsonc と照合したい
    - doctor lint にポリシー検出事項を含めたい
    - 監査証跡にはポリシー証明ハッシュが必要です
summary: '`openclaw policy` 適合性チェックの CLI リファレンス'
title: ポリシー
x-i18n:
    generated_at: "2026-07-05T11:13:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7dcfb534a6abbfbf8c05e50a6cc81403410c74dc2d557db5c1cab299da3f7ca4
    source_path: cli/policy.md
    workflow: 16
---

# `openclaw policy`

`openclaw policy` は、バンドルされた Policy plugin によって提供されます。これは既存の OpenClaw 設定の上にあるエンタープライズ向けの適合レイヤーであり、2つ目の設定システムではありません。要件は `policy.jsonc` に記述し、OpenClaw はアクティブなワークスペースを証拠として観測し、ポリシーは `doctor --lint` を通じてドリフトを報告します。Policy はリクエスト時にツール呼び出しを強制したりランタイム動作を書き換えたりせず、`auth-profiles.json` のようなエージェントごとの認証情報ストアを証明することもありません。

Policy は、設定済みチャネル、MCP サーバー、モデルプロバイダー、ネットワーク SSRF 姿勢、イングレス/チャネルアクセス、Gateway の公開範囲とノードコマンド姿勢、エージェントのワークスペースアクセス、サンドボックス姿勢、データ取り扱い姿勢、シークレットプロバイダー/認証プロファイル姿勢、管理対象ツールメタデータ（`TOOLS.md`）を確認します。ワークスペースに「Telegram を有効にしてはならない」や「管理対象ツールはリスクと所有者メタデータを宣言しなければならない」のような、永続的で確認可能な記述が必要な場合に使用します。証明やドリフト検出を伴わないローカル動作だけが必要なら、通常の設定で十分です。

## クイックスタート

```bash
openclaw plugins enable policy
```

`policy.jsonc` がなくても Plugin は有効のままなので、doctor はチェックを黙ってスキップするのではなく、欠落している成果物を報告できます。

`policy.jsonc` は手動で作成します。現在の設定から生成されるものではありません。各トップレベルセクションはルール名前空間です。具体的なルールがその配下に存在する場合にのみチェックが実行されます（サポートされていないセクションやキーは、黙って無視されるのではなく `policy/policy-jsonc-invalid` として失敗します）。サポートされるすべてのセクションを網羅する最小例:

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

以下のルール表だけでは分かりにくい横断的な注意点:

- 非 local loopback バインドを拒否しつつ `gateway.bind` を省略する場合、ランタイムのデフォルトを受け入れることを意味します。厳密に適合させるには `gateway.bind: "loopback"` を設定します。
- 読み取り専用エージェントでは、該当するデフォルト/エージェントでサンドボックス `mode` を `all` または `non-main` に設定し、`workspaceAccess` を `none` または `ro` に設定します。サンドボックスモードが欠落している場合や `off` の場合、読み取り専用ポリシーを満たしません。
- `agents.workspace.denyTools` は `exec`、`process`、`write`、`edit`、`apply_patch` を受け付けます。設定のツール拒否グループ `group:fs`（ファイル変更）と `group:runtime`（シェル/プロセス）は、同等の姿勢を満たします。
- Exec 承認チェックは、`execApprovals` ルールが存在する場合にのみ、ライブの `exec-approvals.json` 成果物を読み取ります。成果物が欠落している、または無効な場合、それは観測不能な証拠であり、合成された合格ではありません。
- シークレットと認証プロファイルの証拠は、プロバイダー/ソース姿勢と SecretRef メタデータのみを記録し、生の値は決して記録しません。Policy は `auth-profiles.json` のようなエージェントごとの認証情報ストアを読み取ったり証明したりしません。
- データ取り扱いの証拠は設定レベルの姿勢のみです（リダクションモード、テレメトリ取得トグル、セッション保守モード、トランスクリプトインデックス設定）。ログ、テレメトリエクスポート、トランスクリプト、メモリファイルは検査しません。また、クリーンな結果は、それらに個人データやシークレットが存在しないことを証明するものではありません。

### Policy ルールリファレンス

以下の各ルールは任意です。ルールが存在する場合にのみチェックが実行されます。観測される状態は、既存の OpenClaw 設定またはワークスペースメタデータです。

#### スコープ付きオーバーレイ

特定のエージェントやチャネルにトップレベルのベースラインより厳しいポリシーが必要な場合は、`scopes.<scopeName>` を使用します。スコープ名は単なるラベルです。マッチングにはスコープ内のセレクターが使用されます。オーバーレイは加算的です。グローバルルールは引き続き実行され、スコープ付きルールは同じ証拠に対して独自の検出事項を追加できます。

| セレクター | サポートされるセクション | 使用する場面 |
| ------------ | ------------------------------------------------------------------------------ | ------------------------------------------------- |
| `agentIds`   | `tools`, `agents.workspace`, `sandbox`, `dataHandling.memory`, `execApprovals` | 1つ以上のランタイムエージェントにより厳しいルールが必要な場合。 |
| `channelIds` | `ingress.channels`                                                             | 1つ以上のチャネルにより厳しいイングレスルールが必要な場合。 |

`agentIds` エントリが `agents.list[]` に存在しない場合、OpenClaw はそのランタイムエージェント ID について、スキップするのではなく、継承されたグローバル/デフォルト姿勢に対してスコープ付きルールを評価します。

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

上記のように、各スコープが異なるフィールドを管理する場合、同じエージェントを複数のスコープに含めることができます。同じエージェントに対してスコープ付きフィールドが繰り返される場合、それは同等またはより制限的でなければなりません。弱い重複主張は拒否されます（許可リストはサブセット、拒否リストはスーパーセット、必須ブール値は固定です）。

コンテナ姿勢ルール（`sandbox.containers.*`）は、マッチしたエージェントのサンドボックスバックエンドが公開できる証拠に対してのみ確認されます。バックエンドが有効化されたルールを観測できない場合、policy は合格させるのではなく `policy/sandbox-container-posture-unobservable` を報告します。コンテナルールは、それらを公開できるバックエンドを使用するエージェントグループにスコープ設定してください。

トップレベルの `ingress.session.requireDmScope` はグローバルのままです。`session.dmScope` はチャネルに帰属できる証拠ではないため、`channelIds` によってスコープ設定することはできません。

`policy.jsonc` に存在するすべてのスコープは、有効かつ強制可能でなければなりません。

#### チャネル

| ポリシーフィールド | 観測される状態 | 使用する場面 |
| ------------------------------------ | --------------------------------------- | ------------------------------------------------------------ |
| `channels.denyRules[].when.provider` | `channels.*` プロバイダーと有効状態 | `telegram` のようなプロバイダーからの設定済みチャネルを拒否する場合。 |
| `channels.denyRules[].reason`        | 検出事項メッセージと修復ヒントのコンテキスト | プロバイダーが拒否される理由を説明する場合。 |

#### MCP サーバー

| ポリシーフィールド | 観測される状態 | 使用する場面 |
| ------------------- | ------------------- | ---------------------------------------------------------- |
| `mcp.servers.allow` | `mcp.servers.*` ID | 設定済みのすべての MCP サーバーが許可リストに含まれることを要求する場合。 |
| `mcp.servers.deny`  | `mcp.servers.*` ID | 特定の設定済み MCP サーバー ID を拒否する場合。 |

#### モデルプロバイダー

| ポリシーフィールド | 観測される状態 | 使用する場面 |
| ------------------------ | ------------------------------------------------ | ------------------------------------------------------------------------------- |
| `models.providers.allow` | `models.providers.*` ID と選択されたモデル参照 | 設定済みプロバイダーと選択されたモデル参照が承認済みプロバイダーを使用することを要求する場合。 |
| `models.providers.deny`  | `models.providers.*` ID と選択されたモデル参照 | プロバイダー ID によって、設定済みプロバイダーと選択されたモデル参照を拒否する場合。 |

#### ネットワーク

| ポリシーフィールド | 観測される状態 | 使用する場面 |
| ------------------------------ | ----------------------------------- | ------------------------------------------------------------------ |
| `network.privateNetwork.allow` | プライベートネットワーク SSRF エスケープハッチ | `false` に設定し、プライベートネットワークアクセスが無効のままであることを要求する場合。 |

#### イングレスとチャネルアクセス

| ポリシーフィールド                              | 観測された状態                                                 | 使用する場合                                                           |
| ----------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------ |
| `ingress.session.requireDmScope`          | `session.dmScope`                                              | レビュー済みのダイレクトメッセージ分離スコープを必須にします。                 |
| `ingress.channels.allowDmPolicies`        | `channels.*.dmPolicy` とレガシーチャンネル DM ポリシーフィールド      | レビュー済みのダイレクトメッセージチャンネルポリシーのみを許可します。               |
| `ingress.channels.denyOpenGroups`         | チャンネル、アカウント、グループの ingress ポリシー                     | 設定済みのチャンネルとアカウントでオープングループ ingress を拒否します。      |
| `ingress.channels.requireMentionInGroups` | チャンネル、アカウント、グループ、ギルド、ネストされたメンションゲート設定 | グループ ingress が開放されている、またはメンションゲート付きの場合にメンションゲートを必須にします。 |

#### Gateway

| ポリシーフィールド                            | 観測された状態                                 | 使用する場合                                                                             |
| --------------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------ |
| `gateway.exposure.allowNonLoopbackBind` | `gateway.bind`                                 | `false` に設定して、Gateway の loopback バインドを必須にします。                                  |
| `gateway.exposure.allowTailscaleFunnel` | Tailscale serve/funnel Gateway 姿勢         | `false` に設定して、Tailscale Funnel 露出を拒否します。                                    |
| `gateway.auth.requireAuth`              | `gateway.auth.mode`                            | `true` に設定して、無効化された Gateway 認証を拒否します。                                       |
| `gateway.auth.requireExplicitRateLimit` | `gateway.auth.rateLimit`                       | `true` に設定して、明示的な認証レート制限設定を必須にします。                            |
| `gateway.controlUi.allowInsecure`       | Control UI の安全でない認証/デバイス/オリジン切り替え | `false` に設定して、安全でない Control UI 露出切り替えを拒否します。                         |
| `gateway.remote.allow`                  | リモート Gateway モード/設定                     | `false` に設定して、リモート Gateway モードを拒否します。                                          |
| `gateway.http.denyEndpoints`            | Gateway HTTP API エンドポイント                     | `chatCompletions` や `responses` などのエンドポイント ID を拒否します。                          |
| `gateway.http.requireUrlAllowlists`     | Gateway HTTP URL 取得入力                  | `true` に設定して、URL 取得入力で URL 許可リストを必須にします。                         |
| `gateway.nodes.denyCommands`            | `gateway.nodes.denyCommands`                   | `system.run` などの正確なノードコマンド ID が OpenClaw 設定で拒否されることを必須にします。 |

`gateway.nodes.denyCommands` は、完全一致で大文字小文字を区別する拒否スーパーセットルールです。
特権ノードコマンドが OpenClaw 設定で明示的に拒否されていることをポリシーで証明する必要がある場合に使用します。特権
ノードコマンドを意図的に許可するデプロイメントでは、
`gateway.nodes.allowCommands` のみに依存するのではなく、レビュー後に
`policy.jsonc` を更新する必要があります。

#### エージェントワークスペース

| ポリシーフィールド                     | 観測された状態                                                                        | 使用する場合                                                                                 |
| -------------------------------- | ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `agents.workspace.allowedAccess` | `agents.defaults.sandbox.workspaceAccess` と `agents.list[].sandbox.workspaceAccess` | `none` や `ro` などのサンドボックスワークスペースアクセス値のみを許可します。                       |
| `agents.workspace.denyTools`     | グローバルおよびエージェントごとのツール拒否設定                                                 | 変更ツール（`exec`、`process`、`write`、`edit`、`apply_patch`）が拒否されることを必須にします。 |

#### サンドボックス姿勢

| ポリシーフィールド                                          | 観測された状態                                          | 使用する場合                                                       |
| ----------------------------------------------------- | ------------------------------------------------------- | -------------------------------------------------------------- |
| `sandbox.requireMode`                                 | `agents.defaults.sandbox.mode` とエージェントごとのモード       | `all` や `non-main` など、レビュー済みのサンドボックスモードのみを許可します。 |
| `sandbox.allowBackends`                               | `agents.defaults.sandbox.backend` とエージェントごとのバックエンド | `docker` など、レビュー済みのサンドボックスバックエンドのみを許可します。         |
| `sandbox.containers.denyHostNetwork`                  | コンテナベースのサンドボックス/ブラウザネットワークモード           | ホストネットワークモードを拒否します。                                        |
| `sandbox.containers.denyContainerNamespaceJoin`       | コンテナベースのサンドボックス/ブラウザネットワークモード           | 別のコンテナネットワーク名前空間への参加を拒否します。              |
| `sandbox.containers.requireReadOnlyMounts`            | コンテナベースのサンドボックス/ブラウザマウントモード             | マウントを読み取り専用にすることを必須にします。                                |
| `sandbox.containers.denyContainerRuntimeSocketMounts` | コンテナベースのサンドボックス/ブラウザマウントターゲット          | コンテナランタイムソケットのマウントを拒否します。                          |
| `sandbox.containers.denyUnconfinedProfiles`           | コンテナセキュリティプロファイル姿勢                      | unconfined コンテナセキュリティプロファイルを拒否します。                   |
| `sandbox.browser.requireCdpSourceRange`               | サンドボックスブラウザ CDP ソース範囲                        | ブラウザ CDP 露出でソース範囲の宣言を必須にします。        |

ポリシーは、欠落した `sandbox.mode` を暗黙のデフォルト `off` として扱うため、
`sandbox.requireMode` は、新規または未設定のサンドボックスを
`["all"]` などの許可リスト外として報告します。

#### データ処理

| ポリシーフィールド                                        | 観測された状態                                                                       | 使用する場合                                                               |
| --------------------------------------------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------- |
| `dataHandling.sensitiveLogging.requireRedaction`    | `logging.redactSensitive`                                                            | `true` に設定して、`logging.redactSensitive: "off"` を拒否します。              |
| `dataHandling.telemetry.denyContentCapture`         | `diagnostics.otel.captureContent`                                                    | `true` に設定して、テレメトリーコンテンツキャプチャを拒否します。                     |
| `dataHandling.retention.requireSessionMaintenance`  | `session.maintenance.mode`                                                           | `true` に設定して、有効なセッションメンテナンスモード `enforce` を必須にします。 |
| `dataHandling.memory.denySessionTranscriptIndexing` | `memory.qmd.sessions.enabled` と `agents.*.memorySearch.experimental.sessionMemory` | `true` に設定して、セッショントランスクリプトのメモリへのインデックス化を拒否します。       |

#### シークレット

| ポリシーフィールド                      | 観測された状態                                           | 使用する場合                                                                |
| --------------------------------- | -------------------------------------------------------- | ----------------------------------------------------------------------- |
| `secrets.requireManagedProviders` | 設定 SecretRefs と `secrets.providers.*` 宣言 | `true` に設定して、SecretRefs が宣言済みプロバイダーを指すことを必須にします。     |
| `secrets.denySources`             | シークレットプロバイダーソースと SecretRef ソース            | `exec`、`file`、または別の設定済みソース名などのソースを拒否します。 |
| `secrets.allowInsecureProviders`  | 安全でないシークレットプロバイダー姿勢フラグ                   | `false` に設定して、安全でない姿勢を選択するプロバイダーを拒否します。      |

#### Exec 承認

Exec 承認チェックは、ランタイムの `exec-approvals.json` アーティファクトを読み取ります。
デフォルトでは `~/.openclaw/exec-approvals.json`、または
`OPENCLAW_STATE_DIR` が設定されている場合は
`$OPENCLAW_STATE_DIR/exec-approvals.json` です。
`execApprovals.defaults.*` または `execApprovals.agents.*` 配下の
姿勢ルールには、読み取り可能なアーティファクト証拠が必要です。アーティファクトが欠落または無効な場合は、
ベストエフォートの合格ではなく、観測不能な証拠として報告されます。読み取り可能になると、省略された
フィールドはランタイムデフォルトを継承します。欠落した `defaults.security` は `full` で、
欠落したエージェントセキュリティはそのデフォルトを継承します。証拠には `defaults`、
`agents.*`、`agents.*.allowlist[].pattern`、任意の `argPattern`、有効な
`autoAllowSkills` 姿勢、エントリソースが含まれます。ソケットパス/トークン、
`commandText`、`lastUsedCommand`、解決済みパス、タイムスタンプは含まれません。

| ポリシーフィールド                                | 観測された状態                                                                         | 使用する場合                                                                                |
| ------------------------------------------- | -------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `execApprovals.requireFile`                 | アクティブなランタイム `exec-approvals.json` パス                                              | `true` に設定して、承認アーティファクトが存在し解析できることを必須にします。                     |
| `execApprovals.defaults.allowSecurity`      | `defaults.security`、デフォルトは `full`                                              | 承認済みのデフォルト承認セキュリティモードのみを許可します。                                    |
| `execApprovals.agents.allowSecurity`        | `agents.*.security`、デフォルトを継承                                               | 承認済みのエージェントごとの有効な承認セキュリティモードのみを許可します。                        |
| `execApprovals.agents.allowAutoAllowSkills` | `defaults.autoAllowSkills` と `agents.*.autoAllowSkills`、ランタイムデフォルトを継承 | `false` に設定して、暗黙の skill CLI 承認なしで厳密な手動許可リストを必須にします。 |
| `execApprovals.agents.allowlist.expected`   | 集約された `agents.*.allowlist[]` パターンと任意の argPattern エントリ               | 承認許可リストがレビュー済みパターンセットと一致することを必須にします。                      |

例: 承認アーティファクトを必須にし、許容的なデフォルトを拒否し、選択したエージェントに対して
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

| ポリシーフィールド            | 観測された状態                               | 使用する場合                                                                                   |
| ------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `auth.profiles.requireMetadata` | `auth.profiles.*` provider と mode メタデータ | 設定の認証プロファイルに `provider` や `mode` などのメタデータキーを必須にします。               |
| `auth.profiles.allowModes`      | `auth.profiles.*.mode`                       | `api_key`、`aws-sdk`、`oauth`、`token` など、サポートされている認証プロファイルモードのみを許可します。 |

#### ツールメタデータ

| ポリシーフィールド    | 観測された状態                   | 使用する場合                                                                                   |
| ----------------------- | -------------------------------- | ------------------------------------------------------------------------------------------ |
| `tools.requireMetadata` | 管理対象の `TOOLS.md` 宣言 | 管理対象ツールに `risk`、`sensitivity`、`owner` などのメタデータキーの宣言を必須にします。 |

#### ツール姿勢

| ポリシーフィールド            | 観測された状態                                              | 使用する場合                                                                                                 |
| ------------------------------- | ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `tools.profiles.allow`          | `tools.profile` と `agents.list[].tools.profile`           | `minimal`、`messaging`、`coding` などのツールプロファイル ID のみを許可します。                                 |
| `tools.fs.requireWorkspaceOnly` | `tools.fs.workspaceOnly` とエージェントごとの `tools.fs` オーバーライド | `true` に設定すると、ワークスペース限定のファイルシステムツール姿勢を必須にします。                                         |
| `tools.exec.allowSecurity`      | `tools.exec.security` とエージェントごとの exec セキュリティ           | `deny` や `allowlist` などの exec セキュリティモードのみを許可します。                                            |
| `tools.exec.requireAsk`         | `tools.exec.ask` とエージェントごとの exec 確認モード                | `always` などの承認姿勢を必須にします。                                                               |
| `tools.exec.allowHosts`         | `tools.exec.host` とエージェントごとの exec ホストルーティング           | `sandbox` などの exec ホストルーティングモードのみを許可します。                                                    |
| `tools.elevated.allow`          | `tools.elevated.enabled` とエージェントごとの昇格姿勢     | `false` に設定すると、昇格ツールモードを無効のままにすることを必須にします。                                           |
| `tools.alsoAllow.expected`      | `tools.alsoAllow` とエージェントごとの `tools.alsoAllow`           | 正確な `alsoAllow` エントリを必須にし、不足している、または想定外に追加されたツール許可を報告します。                 |
| `tools.denyTools`               | `tools.deny` と `agents.list[].tools.deny`                 | 設定済みのツール拒否リストに `group:runtime` や `group:fs` などのツール ID またはグループを含めることを必須にします。 |

## チェックを実行する

作成中にポリシー専用チェックを実行します。

```bash
openclaw policy check
openclaw policy check --json
openclaw policy check --severity-min error
```

`policy check` はポリシーチェックセットのみを実行し、証拠、検出事項、
および証明ハッシュを出力します。Policy plugin が有効な場合、同じ検出事項は
`openclaw doctor --lint` にも表示されます。

作成したベースラインに対してオペレーターポリシーファイルを比較します。

```bash
openclaw policy compare --baseline official.policy.jsonc
openclaw policy compare --baseline official.policy.jsonc --policy policy.jsonc --json
```

`policy compare` はポリシーファイル構文をポリシーファイル構文に対してチェックします。
ランタイム状態、証拠、認証情報、シークレットは検査しません。スコープ付きオーバーレイを管理するものと同じ
ルールメタデータを使用します。allowlist は同一またはより狭く保つ必要があり、
denylist は同一またはより広く保つ必要があり、必須のブール値は
値を維持する必要があり、順序付き文字列は設定済み順序のより厳格な側にのみ移動でき、
完全一致リストは一致する必要があります。ベースラインは
組織が作成したポリシーにできます。チェック対象ポリシーは、より厳格な値や
追加ルールを加えられます。トップレベルのチェック対象ルールは、
同等以上に制限的であれば、スコープ付きベースラインルールを満たせます。スコープ名は
ファイル間で一致する必要はありません。比較はセレクター（`agentIds`/`channelIds`）とフィールドでキー化されます。

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

## ポリシーを設定する

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
| `enabled`                 | `policy.jsonc` が存在する前でもポリシーチェックを有効にします。         |
| `workspaceRepairs`        | `doctor --fix` がポリシー管理対象のワークスペース設定を編集することを許可します。 |
| `expectedHash`            | 承認済みポリシー成果物の任意のハッシュロック。            |
| `expectedAttestationHash` | 最後に受け入れられたクリーンなポリシーチェックの任意のハッシュロック。    |
| `path`                    | ポリシー成果物のワークスペース相対位置。             |

`plugins.entries.policy.config.enabled` を `false` に設定すると、Plugin をインストールしたまま、
ワークスペースのポリシーチェックを無効にできます。

## ポリシー状態を受け入れる

JSON出力例:

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
チェックで使用された観測済み OpenClaw 状態を記録し、
`workspace.hash` はその証拠ペイロードを識別します。`findingsHash` は
正確な検出事項セットを識別します。`checkedAt` はチェックが実行された時刻を記録します。
`attestationHash` は安定した主張（ポリシーハッシュ、証拠ハッシュ、
検出事項ハッシュ、クリーン/ダーティ状態）を識別し、意図的に `checkedAt` を除外します。
そのため、同じポリシー状態は常に同じ証明ハッシュを生成します。これら
4 つの値は合わせて、1 回のポリシーチェックの監査タプルを形成します。

Gateway またはスーパーバイザーがポリシーを使用してランタイムアクションをブロック、承認、または注釈付けする場合、
最後のクリーンなチェックの証明ハッシュを記録する必要があります。
`checkedAt` は監査ログ用に JSON 出力に残りますが、
安定ハッシュの一部ではありません。

ポリシー状態を受け入れるライフサイクル:

1. `policy.jsonc` を作成またはレビューします。
2. `openclaw policy check --json` を実行します。
3. クリーンであれば、`attestation.policy.hash` を `expectedHash` として記録します。
4. `attestation.attestationHash` を `expectedAttestationHash` として記録します。
5. CI またはリリースゲートで `openclaw doctor --lint` を再実行します。

ポリシールールを意図的に変更した場合は、クリーンなチェックから両方の受け入れ済みハッシュを更新します。ワークスペース設定だけが変更された場合（ポリシーは同じまま）、通常は `expectedAttestationHash` だけが変更されます。

`agents.workspace` ルールを有効化またはアップグレードすると、ワークスペースハッシュと証明ハッシュに `agentWorkspace` エビデンスが追加されます。有効化後は新しいエビデンスを確認し、受け入れ済み証明ハッシュを更新してください。ツールポスチャルールを有効化またはアップグレードした場合も、同じ方法で `toolPosture` エビデンスが追加されます。

`openclaw policy watch` はチェックを再実行し、現在のエビデンスが `expectedAttestationHash` と一致しなくなったときに報告します。

```bash
openclaw policy watch --json
```

CI または 1 回だけドリフト評価が必要なスクリプトでは `--once` を使用します。`--once` がない場合、デフォルトでは 2 秒ごとにポーリングします。間隔を変更するには `--interval-ms` を使用します。

## 検出事項

| チェック ID                                               | 検出事項                                                                          |
| -------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `policy/policy-jsonc-missing`                            | ポリシーが有効ですが、`policy.jsonc` がありません。                               |
| `policy/policy-jsonc-invalid`                            | ポリシーを解析できないか、不正な形式のルールエントリが含まれています。            |
| `policy/policy-hash-mismatch`                            | ポリシーが設定済みの `expectedHash` と一致しません。                              |
| `policy/attestation-hash-mismatch`                       | 現在のポリシーエビデンスが、受け入れ済み証明と一致しなくなりました。              |
| `policy/policy-conformance-invalid`                      | ベースラインまたはチェック対象のポリシーファイルに無効な比較構文があります。      |
| `policy/policy-conformance-missing`                      | チェック対象のポリシーファイルに、ベースラインポリシーファイルで必要なルールがありません。 |
| `policy/policy-conformance-weaker`                       | チェック対象のポリシーファイルの値が、ベースラインポリシーファイルより弱くなっています。 |
| `policy/channels-denied-provider`                        | 有効なチャネルがチャネル拒否ルールに一致しています。                              |
| `policy/mcp-denied-server`                               | 設定済みの MCP サーバーがポリシーで拒否されています。                             |
| `policy/mcp-unapproved-server`                           | 設定済みの MCP サーバーが許可リストの外にあります。                               |
| `policy/models-denied-provider`                          | 設定済みのモデルプロバイダーまたはモデル参照が、拒否されたプロバイダーを使用しています。 |
| `policy/models-unapproved-provider`                      | 設定済みのモデルプロバイダーまたはモデル参照が許可リストの外にあります。          |
| `policy/network-private-access-enabled`                  | ポリシーで拒否されているのに、プライベートネットワーク SSRF 回避手段が有効です。  |
| `policy/ingress-dm-policy-unapproved`                    | チャネル DM ポリシーがポリシー許可リストの外にあります。                          |
| `policy/ingress-dm-scope-unapproved`                     | `session.dmScope` がポリシーで要求される DM 分離スコープと一致しません。          |
| `policy/ingress-open-groups-denied`                      | ポリシーがオープングループ受信を拒否しているのに、チャネルグループポリシーが `open` です。 |
| `policy/ingress-group-mention-required`                  | ポリシーがメンションゲートを要求しているのに、チャネルまたはグループエントリがそれを無効化しています。 |
| `policy/gateway-non-loopback-bind`                       | ポリシーが拒否しているのに、Gateway バインドポスチャが非ループバック公開を許可しています。 |
| `policy/gateway-auth-disabled`                           | ポリシーが認証を要求しているのに、Gateway 認証が無効です。                        |
| `policy/gateway-rate-limit-missing`                      | ポリシーが要求しているのに、Gateway 認証レート制限ポスチャが明示されていません。  |
| `policy/gateway-control-ui-insecure`                     | Gateway Control UI の安全でない公開トグルが有効です。                             |
| `policy/gateway-tailscale-funnel`                        | ポリシーが拒否しているのに、Gateway Tailscale Funnel 公開が有効です。             |
| `policy/gateway-remote-enabled`                          | ポリシーが拒否しているのに、Gateway リモートモードが有効です。                    |
| `policy/gateway-http-endpoint-enabled`                   | ポリシーで拒否されているのに、Gateway HTTP API エンドポイントが有効です。         |
| `policy/gateway-http-url-fetch-unrestricted`             | Gateway HTTP URL フェッチ入力に、必要な URL 許可リストがありません。              |
| `policy/gateway-node-command-denied`                     | ポリシーで拒否された Node コマンドが、OpenClaw 設定で拒否されていません。         |
| `policy/agents-workspace-access-denied`                  | エージェントのサンドボックスモードまたはワークスペースアクセスがポリシー許可リストの外にあります。 |
| `policy/agents-tool-not-denied`                          | エージェントまたはデフォルト設定が、ポリシーで拒否が必要なツールを拒否していません。 |
| `policy/tools-profile-unapproved`                        | 設定済みのグローバルまたはエージェント別ツールプロファイルが許可リストの外にあります。 |
| `policy/tools-fs-workspace-only-required`                | ファイルシステムツールがワークスペース限定パスポスチャで設定されていません。      |
| `policy/tools-exec-security-unapproved`                  | 実行セキュリティモードがポリシー許可リストの外にあります。                        |
| `policy/tools-exec-ask-unapproved`                       | 実行確認モードがポリシー許可リストの外にあります。                                |
| `policy/tools-exec-host-unapproved`                      | 実行ホストルーティングがポリシー許可リストの外にあります。                        |
| `policy/tools-elevated-enabled`                          | ポリシーが拒否しているのに、昇格ツールモードが有効です。                          |
| `policy/tools-also-allow-missing`                        | 設定済みの `alsoAllow` リストに、ポリシーで必要なエントリがありません。           |
| `policy/tools-also-allow-unexpected`                     | 設定済みの `alsoAllow` リストに、ポリシーが想定していないエントリが含まれています。 |
| `policy/tools-required-deny-missing`                     | グローバルまたはエージェント別ツール拒否リストに、必要な拒否済みツールが含まれていません。 |
| `policy/sandbox-mode-unapproved`                         | サンドボックスモードがポリシー許可リストの外にあります。                          |
| `policy/sandbox-backend-unapproved`                      | サンドボックスバックエンドがポリシー許可リストの外にあります。                    |
| `policy/sandbox-container-posture-unobservable`          | 監視できないバックエンドに対して、コンテナポスチャルールが有効です。              |
| `policy/sandbox-container-host-network-denied`           | コンテナベースのサンドボックスまたはブラウザーがホストネットワークモードを使用しています。 |
| `policy/sandbox-container-namespace-join-denied`         | コンテナベースのサンドボックスまたはブラウザーが別のコンテナ名前空間に参加しています。 |
| `policy/sandbox-container-mount-mode-required`           | コンテナベースのサンドボックスまたはブラウザーのマウントが読み取り専用ではありません。 |
| `policy/sandbox-container-runtime-socket-mount`          | コンテナベースのサンドボックスまたはブラウザーのマウントがコンテナランタイムソケットを公開しています。 |
| `policy/sandbox-container-unconfined-profile`            | ポリシーが拒否しているのに、コンテナサンドボックスプロファイルが unconfined です。 |
| `policy/sandbox-browser-cdp-source-range-missing`        | ポリシーが要求しているのに、サンドボックスブラウザー CDP ソース範囲がありません。  |
| `policy/data-handling-redaction-disabled`                | ポリシーが要求しているのに、機微情報ログのリダクションが無効です。                |
| `policy/data-handling-telemetry-content-capture`         | ポリシーが拒否しているのに、テレメトリコンテンツキャプチャが有効です。            |
| `policy/data-handling-session-retention-not-enforced`    | ポリシーが要求しているのに、セッション保持メンテナンスが強制されていません。      |
| `policy/data-handling-session-transcript-memory-enabled` | ポリシーが拒否しているのに、セッショントランスクリプトのメモリーインデックス化が有効です。 |
| `policy/secrets-unmanaged-provider`                      | 設定 SecretRef が、`secrets.providers` で宣言されていないプロバイダーを参照しています。 |
| `policy/secrets-denied-provider-source`                  | 設定シークレットプロバイダーまたは SecretRef が、ポリシーで拒否されたソースを使用しています。 |
| `policy/secrets-insecure-provider`                       | ポリシーが拒否しているのに、シークレットプロバイダーが安全でないポスチャを選択しています。 |
| `policy/auth-profile-invalid-metadata`                   | 設定認証プロファイルに、有効なプロバイダーまたはモードメタデータがありません。    |
| `policy/auth-profile-unapproved-mode`                    | 設定認証プロファイルモードがポリシー許可リストの外にあります。                    |
| `policy/exec-approvals-missing`                          | ポリシーが `exec-approvals.json` を要求していますが、アーティファクトがありません。 |
| `policy/exec-approvals-invalid`                          | 設定済みの実行承認アーティファクトを解析できません。                              |
| `policy/exec-approvals-default-security-unapproved`      | 実行承認のデフォルトが、ポリシー許可リストの外にあるセキュリティモードを使用しています。 |
| `policy/exec-approvals-agent-security-unapproved`        | エージェント別の有効な実行承認セキュリティモードが許可リストの外にあります。      |
| `policy/exec-approvals-auto-allow-skills-enabled`        | ポリシーが拒否しているのに、実行承認エージェントが暗黙的に Skills CLI を自動許可しています。 |
| `policy/exec-approvals-allowlist-missing`                | 承認許可リストに、ポリシーで必要なパターンがありません。                          |
| `policy/exec-approvals-allowlist-unexpected`             | 承認許可リストに、ポリシーが想定していないパターンが含まれています。              |
| `policy/tools-missing-risk-level`                        | 管理対象ツール宣言にリスクメタデータがありません。                                |
| `policy/tools-unknown-risk-level`                        | 管理対象ツール宣言が不明なリスク値を使用しています。                              |
| `policy/tools-missing-sensitivity-token`                 | 管理対象ツール宣言にセンシティビティメタデータがありません。                      |
| `policy/tools-missing-owner`                             | 管理対象ツール宣言に所有者メタデータがありません。                                |
| `policy/tools-unknown-sensitivity-token`                 | 管理対象ツール宣言が不明なセンシティビティ値を使用しています。                    |

検出事項には、`target`（観測された、適合していないワークスペース内の対象）と `requirement`（検出事項となった作成済みルール）の両方を含めることができます。どちらも現在は `oc://` アドレス文字列ですが、フィールド名はアドレス形式ではなくポリシー上の役割を表しています。

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

`doctor --fix` は、`workspaceRepairs` が明示的に有効化されている場合にのみ、ポリシー管理対象のワークスペース設定を編集します。それ以外の場合、チェックは修復対象を報告し、設定は変更しません。

現在、修復では OpenClaw config で有効化されているものの `channels.denyRules` によって拒否されているチャネルを無効化できます。有効な拒否ルールによって設定済みチャネルがオフになる可能性があるため、ポリシーファイルをレビューした後にのみ `workspaceRepairs` を有効化してください。

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

| コマンド         | `0`                                                    | `1`                                                                   | `2`                              |
| ---------------- | ------------------------------------------------------ | --------------------------------------------------------------------- | -------------------------------- |
| `policy check`   | しきい値で検出事項がありません。                       | 1 件以上の検出事項がしきい値に達しました。                            | 引数またはランタイムの失敗です。 |
| `policy compare` | ポリシーファイルはベースライン以上に厳格です。         | ポリシーファイルが無効、欠落、またはベースラインルールより弱いです。  | 引数またはランタイムの失敗です。 |
| `policy watch`   | 検出事項がなく、受理済みハッシュは最新です。           | 検出事項が存在するか、受理済みの証明が古くなっています。              | 引数またはランタイムの失敗です。 |

## 関連

- [Doctor lint モード](/ja-JP/cli/doctor#lint-mode)
- [Path CLI](/ja-JP/cli/path)
