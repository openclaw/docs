---
read_when:
    - OpenClaw の設定を作成済みの policy.jsonc と照合したい
    - doctor lint にポリシー検出結果を含めたい
    - 監査証跡にはポリシー証明ハッシュが必要です
summary: '`openclaw policy` 適合性チェックの CLI リファレンス'
title: ポリシー
x-i18n:
    generated_at: "2026-07-06T21:47:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5c58284793e9bdda4fa855b34b873d9427d9f64886882b2ad1dc4dc19dededaa
    source_path: cli/policy.md
    workflow: 16
---

# `openclaw policy`

`openclaw policy` は、バンドルされた Policy Plugin によって提供されます。これは既存の OpenClaw 設定の上にあるエンタープライズ向けの適合性レイヤーであり、第二の設定システムではありません。要件は `policy.jsonc` に記述します。OpenClaw はアクティブなワークスペースを証拠として観測し、ポリシーは `doctor --lint` を通じてドリフトを報告します。Policy はリクエスト時にツール呼び出しを強制したりランタイム動作を書き換えたりせず、`auth-profiles.json` のようなエージェントごとの認証情報ストアを証明することもありません。

Policy は、設定済みチャンネル、MCP サーバー、モデルプロバイダー、ネットワーク SSRF の姿勢、イングレス/チャンネルアクセス、Gateway の公開状態とノードコマンドの姿勢、エージェントのワークスペースアクセス、サンドボックスの姿勢、データ処理の姿勢、シークレットプロバイダー/auth プロファイルの姿勢、管理対象ツールメタデータ（`TOOLS.md`）をチェックします。ワークスペースに「Telegram を有効にしてはならない」や「管理対象ツールはリスクと所有者メタデータを宣言しなければならない」のような、永続的で検査可能なステートメントが必要な場合に使用します。証明やドリフト検出を伴わないローカル動作だけが必要な場合は、通常の設定で十分です。

## クイックスタート

```bash
openclaw plugins enable policy
```

`policy.jsonc` が存在しない場合でも Plugin は有効なままなので、doctor はチェックを暗黙にスキップするのではなく、不足している成果物を報告できます。

`policy.jsonc` は手作業で作成します。現在の設定から生成されるものではありません。各トップレベルセクションはルール名前空間です。具体的なルールがその配下に存在する場合にのみチェックが実行されます（サポートされていないセクションやキーは、暗黙に無視されるのではなく `policy/policy-jsonc-invalid` として失敗します）。サポートされるすべてのセクションを網羅する最小例:

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

下のルール表からは自明でない横断的な注記:

- 非 local loopback バインドを拒否しつつ `gateway.bind` を省略する場合、ランタイムのデフォルトを受け入れることを意味します。厳密な適合性には `gateway.bind: "loopback"` を設定してください。
- 読み取り専用エージェントの場合は、該当するデフォルト/エージェントでサンドボックス `mode` を `all` または `non-main` に設定し、`workspaceAccess` を `none` または `ro` に設定します。サンドボックスモードが未設定または `off` の場合、読み取り専用ポリシーは満たされません。
- `agents.workspace.denyTools` は `exec`、`process`、`write`、`edit`、`apply_patch` を受け入れます。設定のツール拒否グループ `group:fs`（ファイル変更）と `group:runtime`（シェル/プロセス）は、同等の姿勢を満たします。
- Exec 承認チェックは、`execApprovals` ルールが存在する場合にのみ、実際の `exec-approvals.json` 成果物を読み取ります。成果物が存在しない、または無効な場合、それは観測不能な証拠であり、合成された合格ではありません。
- シークレットと auth プロファイルの証拠は、プロバイダー/ソースの姿勢と SecretRef メタデータのみを記録し、生の値は記録しません。Policy は `auth-profiles.json` のようなエージェントごとの認証情報ストアを読み取ったり証明したりしません。
- データ処理の証拠は、設定レベルの姿勢のみです（秘匿化モード、テレメトリ取得トグル、セッションメンテナンスモード、トランスクリプトインデックス設定）。ログ、テレメトリエクスポート、トランスクリプト、メモリファイルは検査しません。また、クリーンな結果は、それらに個人データやシークレットが存在しないことを証明するものではありません。

### ポリシールールリファレンス

以下のすべてのルールは任意です。ルールが存在する場合にのみチェックが実行されます。観測される状態は、既存の OpenClaw 設定またはワークスペースメタデータです。

#### スコープ付きオーバーレイ

特定のエージェントやチャンネルにトップレベルのベースラインより厳格なポリシーが必要な場合は、`scopes.<scopeName>` を使用します。スコープ名は単なるラベルです。マッチングにはスコープ内のセレクターが使われます。オーバーレイは加算的です。グローバルルールは引き続き実行され、スコープ付きルールは同じ証拠に対して独自の検出結果を追加できます。

| セレクター | サポートされるセクション | 使用する場面 |
| ------------ | ------------------------------------------------------------------------------ | ------------------------------------------------- |
| `agentIds`   | `tools`, `agents.workspace`, `sandbox`, `dataHandling.memory`, `execApprovals` | 1 つ以上のランタイムエージェントに、より厳格なルールが必要な場合。 |
| `channelIds` | `ingress.channels`                                                             | 1 つ以上のチャンネルに、より厳格なイングレスルールが必要な場合。 |

`agentIds` エントリが `agents.list[]` に存在しない場合、OpenClaw はそのスコープ付きルールをスキップするのではなく、そのランタイムエージェント ID について継承されたグローバル/デフォルトの姿勢に対して評価します。

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

上の例のように、各スコープが異なるフィールドを管理する場合、同じエージェントを複数のスコープに含めることができます。同じエージェントに対してスコープ付きフィールドが重複する場合は、同等またはより制限的でなければなりません。より弱い重複主張は拒否されます（allow リストはサブセット、deny リストはスーパーセット、必須のブール値は固定です）。

コンテナ姿勢ルール（`sandbox.containers.*`）は、マッチしたエージェントのサンドボックスバックエンドが公開できる証拠に対してのみチェックされます。有効化したルールをバックエンドが観測できない場合、ポリシーは合格にするのではなく `policy/sandbox-container-posture-unobservable` を報告します。コンテナルールは、それを公開できるバックエンドを使うエージェントグループにスコープしてください。

トップレベルの `ingress.session.requireDmScope` はグローバルのままです。`session.dmScope` はチャンネルに帰属できる証拠ではないため、`channelIds` でスコープできません。

`policy.jsonc` に存在するすべてのスコープは、有効かつ強制可能でなければなりません。

#### チャンネル

| ポリシーフィールド | 観測される状態 | 使用する場面 |
| ------------------------------------ | --------------------------------------- | ------------------------------------------------------------ |
| `channels.denyRules[].when.provider` | `channels.*` のプロバイダーと有効状態 | `telegram` などのプロバイダーから設定済みチャンネルを拒否します。 |
| `channels.denyRules[].reason`        | 検出メッセージと修復ヒントのコンテキスト | プロバイダーが拒否される理由を説明します。 |

#### MCP サーバー

| ポリシーフィールド | 観測される状態 | 使用する場面 |
| ------------------- | ------------------- | ---------------------------------------------------------- |
| `mcp.servers.allow` | `mcp.servers.*` IDs | 設定済みのすべての MCP サーバーが allowlist に含まれることを要求します。 |
| `mcp.servers.deny`  | `mcp.servers.*` IDs | 特定の設定済み MCP サーバー ID を拒否します。 |

#### モデルプロバイダー

| ポリシーフィールド | 観測される状態 | 使用する場面 |
| ------------------------ | ------------------------------------------------ | ------------------------------------------------------------------------------- |
| `models.providers.allow` | `models.providers.*` IDs と選択されたモデル参照 | 設定済みプロバイダーと選択されたモデル参照が承認済みプロバイダーを使用することを要求します。 |
| `models.providers.deny`  | `models.providers.*` IDs と選択されたモデル参照 | プロバイダー ID によって、設定済みプロバイダーと選択されたモデル参照を拒否します。 |

#### ネットワーク

| ポリシーフィールド | 観測される状態 | 使用する場面 |
| ------------------------------ | ----------------------------------- | ------------------------------------------------------------------ |
| `network.privateNetwork.allow` | プライベートネットワーク SSRF の回避口 | `false` に設定し、プライベートネットワークアクセスが無効のままであることを要求します。 |

#### イングレスとチャンネルアクセス

| ポリシーフィールド                              | 観測された状態                                                 | 使用する場合                                                           |
| ----------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------ |
| `ingress.session.requireDmScope`          | `session.dmScope`                                              | レビュー済みのダイレクトメッセージ分離スコープを必須にする。                 |
| `ingress.channels.allowDmPolicies`        | `channels.*.dmPolicy` と従来のチャンネル DM ポリシーフィールド      | レビュー済みのダイレクトメッセージチャンネルポリシーのみを許可する。               |
| `ingress.channels.denyOpenGroups`         | チャンネル、アカウント、グループのイングレスポリシー                     | 構成済みのチャンネルとアカウントでオープングループのイングレスを拒否する。      |
| `ingress.channels.requireMentionInGroups` | チャンネル、アカウント、グループ、ギルド、ネストされたメンションゲート構成 | グループイングレスがオープンまたはメンションゲート付きの場合、メンションゲートを必須にする。 |

#### Gateway

| ポリシーフィールド                            | 観測された状態                                 | 使用する場合                                                                             |
| --------------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------ |
| `gateway.exposure.allowNonLoopbackBind` | `gateway.bind`                                 | local loopback Gateway バインドを必須にするには `false` に設定する。                                  |
| `gateway.exposure.allowTailscaleFunnel` | Tailscale serve/funnel Gateway の態勢         | Tailscale Funnel 露出を拒否するには `false` に設定する。                                    |
| `gateway.auth.requireAuth`              | `gateway.auth.mode`                            | 無効化された Gateway 認証を拒否するには `true` に設定する。                                       |
| `gateway.auth.requireExplicitRateLimit` | `gateway.auth.rateLimit`                       | 明示的な認証レート制限構成を必須にするには `true` に設定する。                            |
| `gateway.controlUi.allowInsecure`       | Control UI の安全でない認証/デバイス/オリジン切り替え | 安全でない Control UI 露出切り替えを拒否するには `false` に設定する。                         |
| `gateway.remote.allow`                  | リモート Gateway モード/構成                     | リモート Gateway モードを拒否するには `false` に設定する。                                          |
| `gateway.http.denyEndpoints`            | Gateway HTTP API エンドポイント                     | `chatCompletions` や `responses` などのエンドポイント ID を拒否する。                          |
| `gateway.http.requireUrlAllowlists`     | Gateway HTTP URL 取得入力                  | URL 取得入力で URL 許可リストを必須にするには `true` に設定する。                         |
| `gateway.nodes.denyCommands`            | `gateway.nodes.denyCommands`                   | OpenClaw 構成で `system.run` などの正確なノードコマンド ID が拒否されることを必須にする。 |

`gateway.nodes.denyCommands` は、大文字小文字を区別する完全一致の拒否スーパーセットルールです。
特権ノードコマンドが OpenClaw 構成で明示的に拒否されていることをポリシーで証明する必要がある場合に使用します。
特権ノードコマンドを意図的に許可するデプロイメントでは、
`gateway.nodes.allowCommands` だけに依存するのではなく、レビュー後に `policy.jsonc` を更新する必要があります。

#### エージェントワークスペース

| ポリシーフィールド                     | 観測された状態                                                                        | 使用する場合                                                                                 |
| -------------------------------- | ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `agents.workspace.allowedAccess` | `agents.defaults.sandbox.workspaceAccess` と `agents.list[].sandbox.workspaceAccess` | `none` や `ro` などのサンドボックスワークスペースアクセス値のみを許可する。                       |
| `agents.workspace.denyTools`     | グローバルおよびエージェントごとのツール拒否構成                                                 | 変更ツール（`exec`、`process`、`write`、`edit`、`apply_patch`）が拒否されることを必須にする。 |

#### サンドボックス態勢

| ポリシーフィールド                                          | 観測された状態                                          | 使用する場合                                                       |
| ----------------------------------------------------- | ------------------------------------------------------- | -------------------------------------------------------------- |
| `sandbox.requireMode`                                 | `agents.defaults.sandbox.mode` とエージェントごとのモード       | `all` や `non-main` などのレビュー済みサンドボックスモードのみを許可する。 |
| `sandbox.allowBackends`                               | `agents.defaults.sandbox.backend` とエージェントごとのバックエンド | `docker` などのレビュー済みサンドボックスバックエンドのみを許可する。         |
| `sandbox.containers.denyHostNetwork`                  | コンテナベースのサンドボックス/ブラウザネットワークモード           | ホストネットワークモードを拒否する。                                        |
| `sandbox.containers.denyContainerNamespaceJoin`       | コンテナベースのサンドボックス/ブラウザネットワークモード           | 別のコンテナネットワーク名前空間への参加を拒否する。              |
| `sandbox.containers.requireReadOnlyMounts`            | コンテナベースのサンドボックス/ブラウザマウントモード             | マウントを読み取り専用にすることを必須にする。                                |
| `sandbox.containers.denyContainerRuntimeSocketMounts` | コンテナベースのサンドボックス/ブラウザマウントターゲット          | コンテナランタイムソケットのマウントを拒否する。                          |
| `sandbox.containers.denyUnconfinedProfiles`           | コンテナセキュリティプロファイルの態勢                      | 非制限コンテナセキュリティプロファイルを拒否する。                   |
| `sandbox.browser.requireCdpSourceRange`               | サンドボックスブラウザ CDP ソース範囲                        | ブラウザ CDP 露出でソース範囲の宣言を必須にする。        |

ポリシーは、欠落している `sandbox.mode` を暗黙のデフォルト `off` として扱うため、
`sandbox.requireMode` は、新規または未構成のサンドボックスを `["all"]` などの
許可リスト外として報告します。

#### データ処理

| ポリシーフィールド                                        | 観測された状態                                                                       | 使用する場合                                                               |
| --------------------------------------------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------- |
| `dataHandling.sensitiveLogging.requireRedaction`    | `logging.redactSensitive`                                                            | `logging.redactSensitive: "off"` を拒否するには `true` に設定する。              |
| `dataHandling.telemetry.denyContentCapture`         | `diagnostics.otel.captureContent`                                                    | テレメトリーのコンテンツキャプチャを拒否するには `true` に設定する。                     |
| `dataHandling.retention.requireSessionMaintenance`  | `session.maintenance.mode`                                                           | 有効なセッションメンテナンスモード `enforce` を必須にするには `true` に設定する。 |
| `dataHandling.memory.denySessionTranscriptIndexing` | `memory.qmd.sessions.enabled` と `agents.*.memorySearch.experimental.sessionMemory` | セッショントランスクリプトのメモリへのインデックス化を拒否するには `true` に設定する。       |

#### シークレット

| ポリシーフィールド                      | 観測された状態                                           | 使用する場合                                                                |
| --------------------------------- | -------------------------------------------------------- | ----------------------------------------------------------------------- |
| `secrets.requireManagedProviders` | 構成 SecretRefs と `secrets.providers.*` 宣言 | SecretRefs が宣言済みプロバイダーを指すことを必須にするには `true` に設定する。     |
| `secrets.denySources`             | シークレットプロバイダーソースと SecretRef ソース            | `exec`、`file`、または別の構成済みソース名などのソースを拒否する。 |
| `secrets.allowInsecureProviders`  | 安全でないシークレットプロバイダー態勢フラグ                   | 安全でない態勢を選択したプロバイダーを拒否するには `false` に設定する。      |

#### Exec 承認

Exec 承認チェックは、ランタイムの `exec-approvals.json` アーティファクトを読み取ります。
デフォルトでは `~/.openclaw/exec-approvals.json`、または
`OPENCLAW_STATE_DIR` が設定されている場合は `$OPENCLAW_STATE_DIR/exec-approvals.json` です。
`execApprovals.defaults.*` または `execApprovals.agents.*` 配下の態勢ルールには、
読み取り可能なアーティファクト証拠が必要です。アーティファクトが欠落しているか無効な場合は、
ベストエフォートの合格ではなく、観測不能な証拠として報告されます。読み取り可能になると、省略された
フィールドはランタイムのデフォルトを継承します。欠落している `defaults.security` は `full` で、
欠落しているエージェントセキュリティはそのデフォルトを継承します。証拠には `defaults`、
`agents.*`、`agents.*.allowlist[].pattern`、任意の `argPattern`、有効な
`autoAllowSkills` 態勢、エントリソースが含まれます。ソケットパス/トークン、
`commandText`、`lastUsedCommand`、解決済みパス、タイムスタンプは含まれません。

| ポリシーフィールド                                | 観測された状態                                                                         | 使用する場合                                                                                |
| ------------------------------------------- | -------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `execApprovals.requireFile`                 | アクティブなランタイム `exec-approvals.json` パス                                              | 承認アーティファクトが存在し、解析できることを必須にするには `true` に設定する。                     |
| `execApprovals.defaults.allowSecurity`      | `defaults.security`、デフォルトは `full`                                              | 承認済みのデフォルト承認セキュリティモードのみを許可する。                                    |
| `execApprovals.agents.allowSecurity`        | `agents.*.security`、デフォルトを継承                                               | 承認済みのエージェントごとの有効な承認セキュリティモードのみを許可する。                        |
| `execApprovals.agents.allowAutoAllowSkills` | `defaults.autoAllowSkills` と `agents.*.autoAllowSkills`、ランタイムデフォルトを継承 | 暗黙の skill CLI 承認なしで厳密な手動許可リストを必須にするには `false` に設定する。 |
| `execApprovals.agents.allowlist.expected`   | 集約された `agents.*.allowlist[]` パターンと任意の argPattern エントリ               | 承認許可リストがレビュー済みパターンセットと一致することを必須にする。                      |

例: 承認アーティファクトを必須にし、許容度の高いデフォルトを拒否し、選択したエージェントに対して
レビュー済みの exec 承認態勢のみを許可します。

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

| ポリシーフィールド                    | 観測された状態                               | 使用する場合                                                                                   |
| ------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `auth.profiles.requireMetadata` | `auth.profiles.*` のプロバイダーとモードのメタデータ | 設定の認証プロファイルで `provider` や `mode` などのメタデータキーを必須にする。               |
| `auth.profiles.allowModes`      | `auth.profiles.*.mode`                       | `api_key`、`aws-sdk`、`oauth`、`token` など、サポートされている認証プロファイルモードのみを許可する。 |

#### ツールメタデータ

| ポリシーフィールド            | 観測された状態                   | 使用する場合                                                                                   |
| ----------------------- | -------------------------------- | ------------------------------------------------------------------------------------------ |
| `tools.requireMetadata` | 管理対象の `TOOLS.md` 宣言 | 管理対象ツールで `risk`、`sensitivity`、`owner` などのメタデータキーの宣言を必須にする。 |

#### ツール姿勢

| ポリシーフィールド                    | 観測された状態                                              | 使用する場合                                                                                                 |
| ------------------------------- | ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `tools.profiles.allow`          | `tools.profile` と `agents.list[].tools.profile`           | `minimal`、`messaging`、`coding` などのツールプロファイル ID のみを許可する。                                 |
| `tools.fs.requireWorkspaceOnly` | `tools.fs.workspaceOnly` とエージェントごとの `tools.fs` オーバーライド | `true` に設定して、ワークスペース限定のファイルシステムツール姿勢を必須にする。                                         |
| `tools.exec.allowSecurity`      | `tools.exec.security` とエージェントごとの exec セキュリティ           | `deny` や `allowlist` などの exec セキュリティモードのみを許可する。                                            |
| `tools.exec.requireAsk`         | `tools.exec.ask` とエージェントごとの exec ask モード                | `always` などの承認姿勢を必須にする。                                                               |
| `tools.exec.allowHosts`         | `tools.exec.host` とエージェントごとの exec ホストルーティング           | `sandbox` などの exec ホストルーティングモードのみを許可する。                                                    |
| `tools.elevated.allow`          | `tools.elevated.enabled` とエージェントごとの昇格姿勢     | `false` に設定して、昇格ツールモードを無効のままにすることを必須にする。                                           |
| `tools.alsoAllow.expected`      | `tools.alsoAllow` とエージェントごとの `tools.alsoAllow`           | 正確な `alsoAllow` エントリを必須にし、不足または想定外に追加されたツール許可を報告する。                 |
| `tools.denyTools`               | `tools.deny` と `agents.list[].tools.deny`                 | 設定済みのツール拒否リストに、`group:runtime` や `group:fs` などのツール ID またはグループを含めることを必須にする。 |

## チェックを実行する

作成中にポリシー専用チェックを実行します。

```bash
openclaw policy check
openclaw policy check --json
openclaw policy check --severity-min error
```

`policy check` はポリシーチェックセットのみを実行し、エビデンス、検出事項、
および証明ハッシュを出力します。Policy plugin が有効な場合、同じ検出事項は
`openclaw doctor --lint` にも表示されます。

オペレーターのポリシーファイルを作成済みベースラインと比較します。

```bash
openclaw policy compare --baseline official.policy.jsonc
openclaw policy compare --baseline official.policy.jsonc --policy policy.jsonc --json
```

`policy compare` は、ポリシーファイル構文をポリシーファイル構文に対してチェックします。
ランタイム状態、エビデンス、認証情報、シークレットは検査しません。スコープ付きオーバーレイを管理するものと同じ
ルールメタデータを使用します。許可リストは同等またはより狭く、
拒否リストは同等またはより広く、必須ブール値は
その値を維持し、順序付き文字列は設定された順序の
より厳格な端にのみ移動でき、完全一致リストは一致する必要があります。ベースラインは
組織が作成したポリシーにできます。チェック対象ポリシーは、より厳格な値または
追加ルールを加えられます。トップレベルのチェック対象ルールは、
同等またはより制限的であれば、スコープ付きベースラインルールを満たせます。スコープ名は
ファイル間で一致する必要はありません。比較はセレクター（`agentIds`/`channelIds`）とフィールドでキー付けされます。

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
監督者が記録できる安定したハッシュが含まれます。

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

| 設定                   | 目的                                                         |
| ------------------------- | --------------------------------------------------------------- |
| `enabled`                 | `policy.jsonc` が存在する前でもポリシーチェックを有効にする。         |
| `workspaceRepairs`        | `doctor --fix` がポリシー管理対象のワークスペース設定を編集できるようにする。 |
| `expectedHash`            | 承認済みポリシー成果物の任意のハッシュロック。            |
| `expectedAttestationHash` | 最後に受け入れられたクリーンなポリシーチェックの任意のハッシュロック。    |
| `path`                    | ポリシー成果物のワークスペース相対の場所。             |

`plugins.entries.policy.config.enabled` を `false` に設定すると、Plugin を
インストールしたまま、ワークスペースのポリシーチェックを無効にできます。

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

`attestation.policy.hash` は、作成されたルール成果物を識別します。`evidence` は
チェックで使用された観測済み OpenClaw 状態を記録し、
`workspace.hash` はそのエビデンスペイロードを識別します。`findingsHash` は
正確な検出事項セットを識別します。`checkedAt` はチェックの実行時刻を記録します。
`attestationHash` は安定した主張（ポリシーハッシュ、エビデンスハッシュ、
検出事項ハッシュ、クリーン/ダーティ状態）を識別し、意図的に `checkedAt` を除外します。
そのため、同じポリシー状態は常に同じ証明ハッシュを生成します。これら
4 つの値を合わせて、1 回のポリシーチェックの監査タプルを形成します。

Gateway または監督者が、ランタイムアクションのブロック、承認、注釈付けに
ポリシーを使用する場合、最後のクリーンなチェックの証明ハッシュを記録する必要があります。
`checkedAt` は監査ログ用に JSON 出力に残りますが、
安定ハッシュの一部ではありません。

ポリシー状態を受け入れるライフサイクル:

1. `policy.jsonc` を作成またはレビューする。
2. `openclaw policy check --json` を実行する。
3. クリーンであれば、`attestation.policy.hash` を `expectedHash` として記録する。
4. `attestation.attestationHash` を `expectedAttestationHash` として記録する。
5. CI またはリリースゲートで `openclaw doctor --lint` を再実行する。

ポリシールールを意図的に変更した場合は、クリーンなチェックから受け入れ済みハッシュを両方更新します。ワークスペース設定だけが変わった場合（ポリシーは同じまま）、通常は `expectedAttestationHash` だけが変わります。

`agents.workspace` ルールを有効化またはアップグレードすると、ワークスペースハッシュと証明ハッシュに `agentWorkspace` 証拠が追加されます。有効化後に新しい証拠を確認し、受け入れ済み証明ハッシュを更新してください。ツールポスチャルールを有効化またはアップグレードすると、同じ方法で `toolPosture` 証拠が追加されます。

`openclaw policy watch` はチェックを再実行し、現在の証拠が `expectedAttestationHash` と一致しなくなったときに報告します。

```bash
openclaw policy watch --json
```

CI や 1 回だけドリフト評価が必要なスクリプトでは `--once` を使用します。`--once` がない場合、デフォルトでは 2 秒ごとにポーリングします。間隔を変更するには `--interval-ms` を使用します。

## 検出事項

| チェック ID                                             | 検出事項                                                                          |
| -------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `policy/policy-jsonc-missing`                            | ポリシーは有効ですが、`policy.jsonc` がありません。                               |
| `policy/policy-jsonc-invalid`                            | ポリシーを解析できないか、不正な形式のルールエントリが含まれています。            |
| `policy/policy-hash-mismatch`                            | ポリシーが設定済みの `expectedHash` と一致しません。                              |
| `policy/attestation-hash-mismatch`                       | 現在のポリシー証拠が、受け入れ済み証明と一致しなくなりました。                    |
| `policy/policy-conformance-invalid`                      | ベースラインまたはチェック対象のポリシーファイルに無効な比較構文があります。      |
| `policy/policy-conformance-missing`                      | チェック対象のポリシーファイルに、ベースラインポリシーファイルで必須のルールがありません。 |
| `policy/policy-conformance-weaker`                       | チェック対象のポリシーファイルの値が、ベースラインポリシーファイルより弱くなっています。 |
| `policy/channels-denied-provider`                        | 有効化されたチャネルがチャネル拒否ルールに一致します。                            |
| `policy/mcp-denied-server`                               | 設定済みの MCP サーバーがポリシーによって拒否されています。                       |
| `policy/mcp-unapproved-server`                           | 設定済みの MCP サーバーが許可リストの外にあります。                               |
| `policy/models-denied-provider`                          | 設定済みのモデルプロバイダーまたはモデル参照が、拒否されたプロバイダーを使用しています。 |
| `policy/models-unapproved-provider`                      | 設定済みのモデルプロバイダーまたはモデル参照が許可リストの外にあります。          |
| `policy/network-private-access-enabled`                  | ポリシーが拒否しているにもかかわらず、プライベートネットワーク SSRF エスケープハッチが有効です。 |
| `policy/ingress-dm-policy-unapproved`                    | チャネル DM ポリシーがポリシー許可リストの外にあります。                          |
| `policy/ingress-dm-scope-unapproved`                     | `session.dmScope` が、ポリシーで必須の DM 分離スコープと一致しません。             |
| `policy/ingress-open-groups-denied`                      | ポリシーがオープングループの流入を拒否しているにもかかわらず、チャネルグループポリシーが `open` です。 |
| `policy/ingress-group-mention-required`                  | ポリシーがメンションゲートを必須としているにもかかわらず、チャネルまたはグループエントリがそれを無効化しています。 |
| `policy/gateway-non-loopback-bind`                       | ポリシーが拒否しているにもかかわらず、Gateway バインドポスチャが非ループバック公開を許可しています。 |
| `policy/gateway-auth-disabled`                           | ポリシーが認証を必須としているにもかかわらず、Gateway 認証が無効です。             |
| `policy/gateway-rate-limit-missing`                      | ポリシーが必須としているにもかかわらず、Gateway 認証レート制限ポスチャが明示されていません。 |
| `policy/gateway-control-ui-insecure`                     | Gateway Control UI の安全でない公開トグルが有効です。                             |
| `policy/gateway-tailscale-funnel`                        | ポリシーが拒否しているにもかかわらず、Gateway Tailscale Funnel 公開が有効です。   |
| `policy/gateway-remote-enabled`                          | ポリシーが拒否しているにもかかわらず、Gateway リモートモードがアクティブです。     |
| `policy/gateway-http-endpoint-enabled`                   | ポリシーで拒否されているにもかかわらず、Gateway HTTP API エンドポイントが有効です。 |
| `policy/gateway-http-url-fetch-unrestricted`             | Gateway HTTP URL 取得入力に、必須の URL 許可リストがありません。                  |
| `policy/gateway-node-command-denied`                     | ポリシーで拒否された Node コマンドが、OpenClaw 設定で拒否されていません。          |
| `policy/agents-workspace-access-denied`                  | エージェントのサンドボックスモードまたはワークスペースアクセスがポリシー許可リストの外にあります。 |
| `policy/agents-tool-not-denied`                          | エージェントまたはデフォルト設定が、ポリシーで必須のツールを拒否していません。     |
| `policy/tools-profile-unapproved`                        | 設定済みのグローバルまたはエージェント別ツールプロファイルが許可リストの外にあります。 |
| `policy/tools-fs-workspace-only-required`                | ファイルシステムツールが、ワークスペース限定パスポスチャで設定されていません。    |
| `policy/tools-exec-security-unapproved`                  | Exec セキュリティモードがポリシー許可リストの外にあります。                       |
| `policy/tools-exec-ask-unapproved`                       | Exec 確認モードがポリシー許可リストの外にあります。                               |
| `policy/tools-exec-host-unapproved`                      | Exec ホストルーティングがポリシー許可リストの外にあります。                       |
| `policy/tools-elevated-enabled`                          | ポリシーが拒否しているにもかかわらず、昇格ツールモードが有効です。                |
| `policy/tools-also-allow-missing`                        | 設定済みの `alsoAllow` リストに、ポリシーで必須のエントリがありません。            |
| `policy/tools-also-allow-unexpected`                     | 設定済みの `alsoAllow` リストに、ポリシーが想定していないエントリが含まれています。 |
| `policy/tools-required-deny-missing`                     | グローバルまたはエージェント別ツール拒否リストに、必須の拒否ツールが含まれていません。 |
| `policy/sandbox-mode-unapproved`                         | サンドボックスモードがポリシー許可リストの外にあります。                          |
| `policy/sandbox-backend-unapproved`                      | サンドボックスバックエンドがポリシー許可リストの外にあります。                    |
| `policy/sandbox-container-posture-unobservable`          | 観測できないバックエンドに対して、コンテナポスチャルールが有効化されています。    |
| `policy/sandbox-container-host-network-denied`           | コンテナベースのサンドボックスまたはブラウザーがホストネットワークモードを使用しています。 |
| `policy/sandbox-container-namespace-join-denied`         | コンテナベースのサンドボックスまたはブラウザーが別のコンテナ名前空間に参加しています。 |
| `policy/sandbox-container-mount-mode-required`           | コンテナベースのサンドボックスまたはブラウザーのマウントが読み取り専用ではありません。 |
| `policy/sandbox-container-runtime-socket-mount`          | コンテナベースのサンドボックスまたはブラウザーのマウントが、コンテナランタイムソケットを公開しています。 |
| `policy/sandbox-container-unconfined-profile`            | ポリシーが拒否しているにもかかわらず、コンテナサンドボックスプロファイルが無制限です。 |
| `policy/sandbox-browser-cdp-source-range-missing`        | ポリシーが必須としているにもかかわらず、サンドボックスブラウザー CDP ソース範囲がありません。 |
| `policy/data-handling-redaction-disabled`                | ポリシーが必須としているにもかかわらず、機密ログのリダクションが無効です。          |
| `policy/data-handling-telemetry-content-capture`         | ポリシーが拒否しているにもかかわらず、テレメトリコンテンツキャプチャが有効です。  |
| `policy/data-handling-session-retention-not-enforced`    | ポリシーが必須としているにもかかわらず、セッション保持メンテナンスが強制されていません。 |
| `policy/data-handling-session-transcript-memory-enabled` | ポリシーが拒否しているにもかかわらず、セッショントランスクリプトメモリインデックスが有効です。 |
| `policy/secrets-unmanaged-provider`                      | 設定の SecretRef が、`secrets.providers` の下で宣言されていないプロバイダーを参照しています。 |
| `policy/secrets-denied-provider-source`                  | 設定のシークレットプロバイダーまたは SecretRef が、ポリシーで拒否されたソースを使用しています。 |
| `policy/secrets-insecure-provider`                       | ポリシーが拒否しているにもかかわらず、シークレットプロバイダーが安全でないポスチャを選択しています。 |
| `policy/auth-profile-invalid-metadata`                   | 設定の認証プロファイルに、有効なプロバイダーまたはモードのメタデータがありません。 |
| `policy/auth-profile-unapproved-mode`                    | 設定の認証プロファイルモードがポリシー許可リストの外にあります。                  |
| `policy/exec-approvals-missing`                          | ポリシーが `exec-approvals.json` を必須としていますが、そのアーティファクトがありません。 |
| `policy/exec-approvals-invalid`                          | 設定済みの Exec 承認アーティファクトを解析できません。                            |
| `policy/exec-approvals-default-security-unapproved`      | Exec 承認のデフォルトが、ポリシー許可リストの外にあるセキュリティモードを使用しています。 |
| `policy/exec-approvals-agent-security-unapproved`        | エージェント別の有効な Exec 承認セキュリティモードが許可リストの外にあります。     |
| `policy/exec-approvals-auto-allow-skills-enabled`        | ポリシーが拒否しているにもかかわらず、Exec 承認エージェントが skill CLI を暗黙的に自動許可しています。 |
| `policy/exec-approvals-allowlist-missing`                | 承認許可リストに、ポリシーで必須のパターンがありません。                          |
| `policy/exec-approvals-allowlist-unexpected`             | 承認許可リストに、ポリシーが想定していないパターンが含まれています。              |
| `policy/tools-missing-risk-level`                        | ガバナンス対象ツール宣言にリスクメタデータがありません。                          |
| `policy/tools-unknown-risk-level`                        | ガバナンス対象ツール宣言が不明なリスク値を使用しています。                        |
| `policy/tools-missing-sensitivity-token`                 | ガバナンス対象ツール宣言に機密度メタデータがありません。                          |
| `policy/tools-missing-owner`                             | ガバナンス対象ツール宣言に所有者メタデータがありません。                          |
| `policy/tools-unknown-sensitivity-token`                 | ガバナンス対象ツール宣言が不明な機密度値を使用しています。                        |

検出事項には、`target`（適合していない観測されたワークスペース上の対象）と `requirement`（検出事項になった作成済みルール）の両方を含めることができます。現在はどちらも `oc://` アドレス文字列ですが、フィールド名はアドレス形式ではなくポリシー上の役割を表しています。

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

`doctor --fix` は、`workspaceRepairs` が明示的に有効化されている場合にのみ、ポリシー管理対象のワークスペース設定を編集します。それ以外の場合、チェックは修復予定の内容を報告し、設定は変更しません。

このバージョンでは、修復によって `channels.denyRules` で拒否されたチャンネルを無効化し、以下に示す自動的な絞り込み修復を適用できます。有効なルールによってワークスペース設定が変更される可能性があるため、`workspaceRepairs` はポリシーファイルのレビュー後にのみ有効化してください。

- グローバルポリシーが昇格ツールを禁止している場合、`tools.elevated.enabled=false` を設定する
- ポリシーでそれらのツールの拒否が要求されている場合、不足している必須拒否ツール ID を `tools.deny` または
  `agents.list[].tools.deny` に追加する
- 安全でない `gateway.controlUi.*` トグルを `false` に設定する
- ポリシーがリモート Gateway モードを拒否している場合、`gateway.mode=local` を設定する
- ポリシーが機密ログの墨消しを要求している場合、`logging.redactSensitive=tools` を設定する
- ポリシーがテレメトリ内容のキャプチャを拒否している場合、`diagnostics.otel.captureContent=false`、またはオブジェクト形式のテレメトリキャプチャ設定では
  `diagnostics.otel.captureContent.enabled=false` を設定する

スコープ付き昇格ツール修復は検出のみです。スコープ付きデータ処理修復も、検出結果が共有ログ設定またはテレメトリ設定を報告している場合はスキップされます。共有設定を変更すると、スコープ付きポリシー対象を超えて影響するためです。

スコープ付き必須拒否修復は、検出結果が継承されたルート `tools.deny` を報告している場合はスキップされます。必要なツールをルート設定に追加すると、スコープ付きポリシー対象を超えて影響するためです。エージェントローカルの必須拒否修復では、報告された `agents.list[].tools.deny` パスを更新できます。

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
| `policy check`   | しきい値以上の検出結果はありません。                          | 1件以上の検出結果がしきい値に達しました。                             | 引数またはランタイムの失敗。 |
| `policy compare` | ポリシーファイルはベースラインと同等以上に厳格です。 | ポリシーファイルが無効、欠落、またはベースラインルールより弱いです。 | 引数またはランタイムの失敗。 |
| `policy watch`   | 検出結果はなく、承認済みハッシュは最新です。              | 検出結果が存在するか、承認済み証明が古くなっています。                    | 引数またはランタイムの失敗。 |

## 関連

- [Doctor lint モード](/ja-JP/cli/doctor#lint-mode)
- [Path CLI](/ja-JP/cli/path)
