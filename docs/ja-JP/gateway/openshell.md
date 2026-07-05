---
read_when:
    - ローカル Docker ではなくクラウド管理のサンドボックスを使いたい
    - OpenShell Plugin を設定しています
    - ミラーとリモートワークスペースのモードを選択する必要があります
summary: OpenClaw エージェントの管理対象サンドボックスバックエンドとして OpenShell を使用する
title: OpenShell
x-i18n:
    generated_at: "2026-07-05T11:22:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bf5c33912bd0db759a01cf58ea26712a8ada68c0804bf16f69f1f7cdd496828c
    source_path: gateway/openshell.md
    workflow: 16
---

OpenShell はマネージドサンドボックスバックエンドです。Docker コンテナをローカルで実行する代わりに、OpenClaw はサンドボックスのライフサイクルを `openshell` CLI に委譲します。この CLI はリモート環境をプロビジョニングし、SSH 経由でコマンドを実行します。

この Plugin は、汎用の [SSH バックエンド](/ja-JP/gateway/sandboxing#ssh-backend) と同じ SSH トランスポートおよびリモートファイルシステムブリッジを再利用し、OpenShell のライフサイクル（`sandbox create/get/delete/ssh-config`）と任意の `mirror` ワークスペース同期モードを追加します。

## 前提条件

- OpenShell Plugin がインストールされていること（`openclaw plugins install @openclaw/openshell-sandbox`）
- `PATH` 上に `openshell` CLI があること（または
  `plugins.entries.openshell.config.command` でカスタムパスを指定）
- サンドボックスアクセス権を持つ OpenShell アカウント
- ホスト上で OpenClaw Gateway が実行中であること

## クイックスタート

```bash
openclaw plugins install @openclaw/openshell-sandbox
```

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "openshell",
        scope: "session",
        workspaceAccess: "rw",
      },
    },
  },
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          from: "openclaw",
          mode: "remote",
        },
      },
    },
  },
}
```

Gateway を再起動します。次のエージェントターンで OpenClaw は OpenShell サンドボックスを作成し、ツール実行をそこへルーティングします。次で確認します。

```bash
openclaw sandbox list
openclaw sandbox explain
```

## ワークスペースモード

これは OpenShell で最も重要な判断です。

### mirror（デフォルト）

`plugins.entries.openshell.config.mode: "mirror"` は **ローカルワークスペースを正準** として扱います。

- `exec` の前に、OpenClaw はローカルワークスペースをサンドボックスへ同期します。
- `exec` の後に、OpenClaw はリモートワークスペースをローカルへ同期します。
- ファイルツールはサンドボックスブリッジを経由しますが、ターン間ではローカルが信頼できる情報源のままです。

開発ワークフローに最適です。OpenClaw の外で行ったローカル編集は次の exec に反映され、サンドボックスは Docker バックエンドに近い挙動になります。

トレードオフ: exec ターンごとにアップロードとダウンロードのコストがかかります。

### remote

`mode: "remote"` は **OpenShell ワークスペースを正準** として扱います。

- 初回のサンドボックス作成時に、OpenClaw はローカルからリモートワークスペースへ一度だけシードします。
- その後は、`exec`、`read`、`write`、`edit`、`apply_patch` がリモートワークスペース上で直接動作します。OpenClaw はリモートの変更をローカルへ同期し**ません**。
- プロンプト時のメディア読み取りは引き続き機能します（ファイル/メディアツールはサンドボックスブリッジ経由で読み取ります）。

長時間実行されるエージェントや CI に最適です。ターンごとのオーバーヘッドが低く、ホストローカルの編集がリモート状態を黙って上書きすることもありません。

<Warning>
初回シード後に OpenClaw の外でホスト上のファイルを編集しても、リモートサンドボックスには見えません。再シードするには `openclaw sandbox recreate` を実行してください。
</Warning>

### モードの選択

|                          | `mirror`                   | `remote`                  |
| ------------------------ | -------------------------- | ------------------------- |
| **正準ワークスペース**   | ローカルホスト             | リモート OpenShell        |
| **同期方向**             | 双方向（exec ごと）        | 一度だけシード            |
| **ターンごとのオーバーヘッド** | 高い（アップロード + ダウンロード） | 低い（直接リモート操作） |
| **ローカル編集は見えるか** | はい、次の exec で         | いいえ、recreate まで     |
| **最適な用途**           | 開発ワークフロー           | 長時間実行エージェント、CI |

## 設定リファレンス

すべての OpenShell 設定は `plugins.entries.openshell.config` 配下にあります。

| キー                      | 型                       | デフォルト    | 説明                                                                                   |
| ------------------------- | ------------------------ | ------------- | -------------------------------------------------------------------------------------- |
| `mode`                    | `"mirror"` または `"remote"` | `"mirror"`    | ワークスペース同期モード                                                               |
| `command`                 | `string`                 | `"openshell"` | `openshell` CLI のパスまたは名前                                                       |
| `from`                    | `string`                 | `"openclaw"`  | 初回作成時のサンドボックスソース                                                       |
| `gateway`                 | `string`                 | 未設定        | OpenShell Gateway 名（トップレベルの `--gateway`）                                     |
| `gatewayEndpoint`         | `string`                 | 未設定        | OpenShell Gateway エンドポイント（トップレベルの `--gateway-endpoint`）                |
| `policy`                  | `string`                 | 未設定        | サンドボックス作成用の OpenShell ポリシー ID                                           |
| `providers`               | `string[]`               | `[]`          | サンドボックス作成時に接続するプロバイダー名（重複排除済み、エントリごとに `--provider` フラグ 1 つ） |
| `gpu`                     | `boolean`                | `false`       | GPU リソースを要求（`--gpu`）                                                          |
| `autoProviders`           | `boolean`                | `true`        | 作成時に `--auto-providers` を渡す（false の場合は `--no-auto-providers`）              |
| `remoteWorkspaceDir`      | `string`                 | `"/sandbox"`  | サンドボックス内の主な書き込み可能ワークスペース                                       |
| `remoteAgentWorkspaceDir` | `string`                 | `"/agent"`    | エージェントワークスペースのマウントパス（ワークスペースアクセスが `rw` でない場合は読み取り専用） |
| `timeoutSeconds`          | `number`                 | `120`         | `openshell` CLI 操作のタイムアウト                                                     |

`remoteWorkspaceDir` と `remoteAgentWorkspaceDir` は絶対パスである必要があり、マネージドルート `/sandbox` または `/agent` の下に留まる必要があります。それ以外の絶対パスは拒否されます。

サンドボックスレベルの設定（`mode`、`scope`、`workspaceAccess`）は、他のバックエンドと同様に `agents.defaults.sandbox` 配下にあります。完全なマトリクスについては [サンドボックス化](/ja-JP/gateway/sandboxing) を参照してください。

## 例

### 最小限の remote 設定

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "openshell",
      },
    },
  },
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          from: "openclaw",
          mode: "remote",
        },
      },
    },
  },
}
```

### GPU 付き mirror モード

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "openshell",
        scope: "agent",
        workspaceAccess: "rw",
      },
    },
  },
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          from: "openclaw",
          mode: "mirror",
          gpu: true,
          providers: ["openai"],
          timeoutSeconds: 180,
        },
      },
    },
  },
}
```

### カスタム Gateway を使うエージェントごとの OpenShell

```json5
{
  agents: {
    defaults: {
      sandbox: { mode: "off" },
    },
    list: [
      {
        id: "researcher",
        sandbox: {
          mode: "all",
          backend: "openshell",
          scope: "agent",
          workspaceAccess: "rw",
        },
      },
    ],
  },
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          from: "openclaw",
          mode: "remote",
          gateway: "lab",
          gatewayEndpoint: "https://lab.example",
          policy: "strict",
        },
      },
    },
  },
}
```

## ライフサイクル管理

```bash
# すべてのサンドボックスランタイムを一覧表示（Docker + OpenShell）
openclaw sandbox list

# 有効なポリシーを調査
openclaw sandbox explain

# 再作成（リモートワークスペースを削除し、次回使用時に再シード）
openclaw sandbox recreate --all
```

`remote` モードでは、recreate は特に重要です。そのスコープの正準リモートワークスペースを削除し、次回使用時にローカルから新しいものをシードします。`mirror` モードでは、ローカルが正準のままなので、recreate は主にリモート実行環境をリセットします。

次のいずれかを変更した後は recreate してください。

- `agents.defaults.sandbox.backend`
- `plugins.entries.openshell.config.from`
- `plugins.entries.openshell.config.mode`
- `plugins.entries.openshell.config.policy`

## セキュリティ強化

mirror モードのファイルシステムブリッジはローカルワークスペースルートを固定し、読み取り、書き込み、mkdir、remove、rename の前に毎回（realpath 経由で）正準パスを再確認し、パス途中のシンボリックリンクを拒否します。シンボリックリンクの差し替えやワークスペースの再マウントによって、ミラーされたツリーの外へファイルアクセスをリダイレクトすることはできません。

## 現在の制限

- OpenShell バックエンドではサンドボックスブラウザーはサポートされていません。
- `sandbox.docker.binds` は OpenShell には適用されません。binds が設定されている場合、サンドボックス作成は失敗します。
- `sandbox.docker.*` 配下の Docker 固有のランタイム調整項目（`env` 以外）は、Docker バックエンドにのみ適用されます。

## 仕組み

1. OpenClaw はサンドボックス名に対して `sandbox get` を実行します（設定済みの
   `--gateway`/`--gateway-endpoint` があれば含めます）。失敗した場合は
   `sandbox create` で作成し、`--name`、`--from`、設定されている場合は `--policy`、有効な場合は `--gpu`、
   `--auto-providers`/`--no-auto-providers`、および設定済みプロバイダーごとに 1 つの
   `--provider` フラグを渡します。
2. OpenClaw はサンドボックス名に対して `sandbox ssh-config` を実行し、SSH 接続の詳細を取得します。
3. コアは SSH 設定を一時ファイルへ書き込み、汎用 SSH バックエンドと同じリモートファイルシステムブリッジを通じて SSH セッションを開きます。
4. `mirror` モード: exec 前にローカルからリモートへ同期し、実行後に同期し戻します。
5. `remote` モード: 作成時に一度だけシードし、その後はリモートワークスペース上で直接操作します。

## 関連

- [サンドボックス化](/ja-JP/gateway/sandboxing) - モード、スコープ、バックエンド比較
- [サンドボックス vs ツールポリシー vs 昇格](/ja-JP/gateway/sandbox-vs-tool-policy-vs-elevated) - ブロックされたツールのデバッグ
- [マルチエージェントサンドボックスとツール](/ja-JP/tools/multi-agent-sandbox-tools) - エージェントごとのオーバーライド
- [サンドボックス CLI](/ja-JP/cli/sandbox) - `openclaw sandbox` コマンド
