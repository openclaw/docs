---
read_when:
    - ローカル Docker の代わりにクラウド管理の sandboxes を使いたいです
    - OpenShell Plugin をセットアップしています
    - mirror と remote workspace モードのどちらを選ぶか決める必要があります
summary: OpenClaw agents 用の管理された sandbox backend として OpenShell を使用する
title: OpenShell
x-i18n:
    generated_at: "2026-04-23T14:03:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2534127b293364659a14df3e36583a9b7120f5d55cdbd8b4b611efe44adc7ff8
    source_path: gateway/openshell.md
    workflow: 15
---

# OpenShell

OpenShell は OpenClaw 用の管理された sandbox backend です。Docker
containers をローカルで実行する代わりに、OpenClaw は sandbox のライフサイクルを `openshell` CLI に委譲し、
それが SSH ベースのコマンド実行を備えたリモート環境をプロビジョニングします。

OpenShell Plugin は、汎用の [SSH backend](/ja-JP/gateway/sandboxing#ssh-backend) と同じ core SSH transport と remote filesystem
bridge を再利用します。これに OpenShell 固有のライフサイクル（`sandbox create/get/delete`, `sandbox ssh-config`）
と、任意の `mirror` workspace mode を追加します。

## 前提条件

- `openshell` CLI がインストールされていて `PATH` 上にあること（または
  `plugins.entries.openshell.config.command` でカスタムパスを設定）
- sandbox access がある OpenShell account
- host 上で動作している OpenClaw Gateway

## クイックスタート

1. Plugin を有効にし、sandbox backend を設定します。

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

2. Gateway を再起動します。次の agent turn で、OpenClaw は OpenShell
   sandbox を作成し、tool 実行をそこ経由にルーティングします。

3. 検証します。

```bash
openclaw sandbox list
openclaw sandbox explain
```

## Workspace モード

これは OpenShell を使うときの最重要の判断です。

### `mirror`

**ローカル
workspace を正本のまま保ちたい** 場合は、`plugins.entries.openshell.config.mode: "mirror"` を使用します。

動作:

- `exec` の前に、OpenClaw はローカル workspace を OpenShell sandbox に同期します。
- `exec` の後に、OpenClaw はリモート workspace をローカル workspace に同期し戻します。
- file tools は引き続き sandbox bridge 経由で動作しますが、turn 間ではローカル workspace
  が source of truth のままです。

最適なケース:

- OpenClaw の外でローカルにファイルを編集しており、その変更を
  sandbox に自動的に反映したい。
- OpenShell sandbox を Docker backend にできるだけ近い挙動にしたい。
- 各 exec turn 後に、host workspace に sandbox の書き込みを反映したい。

トレードオフ: 各 exec の前後に追加の同期コストがかかります。

### `remote`

**OpenShell workspace を正本にしたい** 場合は、`plugins.entries.openshell.config.mode: "remote"` を使用します。

動作:

- sandbox が最初に作成されるとき、OpenClaw は一度だけローカル workspace から
  リモート workspace を seed します。
- その後は、`exec`、`read`、`write`、`edit`、`apply_patch` は
  直接リモート OpenShell workspace に対して動作します。
- OpenClaw はリモート変更をローカル workspace に同期し戻しません。
- prompt 時の media reads は、file tools と media tools が sandbox bridge 経由で読むため、引き続き動作します。

最適なケース:

- sandbox を主にリモート側で存続させたい。
- turn ごとの同期オーバーヘッドを下げたい。
- host 側ローカル編集で、リモート sandbox state が黙って上書きされるのを避けたい。

重要: 初回 seed 後に OpenClaw の外で host 上のファイルを編集しても、
リモート sandbox はその変更を認識しません。再 seed するには
`openclaw sandbox recreate` を使用してください。

### モードの選び方

|                          | `mirror`                   | `remote`                  |
| ------------------------ | -------------------------- | ------------------------- |
| **正本の workspace**     | ローカル host              | リモート OpenShell        |
| **同期方向**             | 双方向（各 exec ごと）     | 初回 seed のみ            |
| **turn ごとのオーバーヘッド** | 高い（upload + download） | 低い（直接リモート操作） |
| **ローカル編集は見えるか** | はい、次の exec で反映     | いいえ、recreate まで反映されない |
| **最適な用途**           | 開発ワークフロー           | 長時間実行 agents、CI     |

## Configuration reference

すべての OpenShell config は `plugins.entries.openshell.config` の下にあります。

| Key                       | Type                     | Default       | 説明 |
| ------------------------- | ------------------------ | ------------- | ---- |
| `mode`                    | `"mirror"` or `"remote"` | `"mirror"`    | workspace 同期モード |
| `command`                 | `string`                 | `"openshell"` | `openshell` CLI のパスまたは名前 |
| `from`                    | `string`                 | `"openclaw"`  | 初回 create 用の sandbox source |
| `gateway`                 | `string`                 | —             | OpenShell gateway 名（`--gateway`） |
| `gatewayEndpoint`         | `string`                 | —             | OpenShell gateway endpoint URL（`--gateway-endpoint`） |
| `policy`                  | `string`                 | —             | sandbox 作成用の OpenShell policy ID |
| `providers`               | `string[]`               | `[]`          | sandbox 作成時にアタッチする provider 名 |
| `gpu`                     | `boolean`                | `false`       | GPU リソースを要求する |
| `autoProviders`           | `boolean`                | `true`        | sandbox create 時に `--auto-providers` を渡す |
| `remoteWorkspaceDir`      | `string`                 | `"/sandbox"`  | sandbox 内の主な書き込み可能 workspace |
| `remoteAgentWorkspaceDir` | `string`                 | `"/agent"`    | agent workspace の mount path（読み取り専用アクセス用） |
| `timeoutSeconds`          | `number`                 | `120`         | `openshell` CLI 操作のタイムアウト |

sandbox レベルの設定（`mode`, `scope`, `workspaceAccess`）は、
他の backend と同様に `agents.defaults.sandbox` の下で設定します。完全なマトリクスは
[Sandboxing](/ja-JP/gateway/sandboxing) を参照してください。

## 例

### 最小の remote セットアップ

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

### カスタム gateway を使う agent ごとの OpenShell

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

OpenShell sandboxes は通常の sandbox CLI で管理します。

```bash
# すべての sandbox runtimes を一覧表示（Docker + OpenShell）
openclaw sandbox list

# 実効 policy を確認
openclaw sandbox explain

# recreate（リモート workspace を削除し、次回使用時に再 seed）
openclaw sandbox recreate --all
```

`remote` モードでは、**recreate は特に重要** です。これは、そのスコープに対する正本の
リモート workspace を削除します。次回使用時に、ローカル workspace から新しいリモート workspace が seed されます。

`mirror` モードでは、ローカル workspace が正本のままなので、
recreate は主にリモート実行環境をリセットします。

### recreate すべきタイミング

次のいずれかを変更した後は recreate してください。

- `agents.defaults.sandbox.backend`
- `plugins.entries.openshell.config.from`
- `plugins.entries.openshell.config.mode`
- `plugins.entries.openshell.config.policy`

```bash
openclaw sandbox recreate --all
```

## セキュリティ強化

OpenShell は workspace root fd を pin し、各
read の前に sandbox identity を再確認するため、symlink の差し替えや workspace の再マウントによって、意図したリモート workspace の外へ reads がリダイレクトされることはありません。

## 現在の制限

- sandbox browser は OpenShell backend ではサポートされていません。
- `sandbox.docker.binds` は OpenShell には適用されません。
- `sandbox.docker.*` 配下の Docker 固有の runtime knobs は、Docker
  backend にのみ適用されます。

## 仕組み

1. OpenClaw は `openshell sandbox create` を呼び出します（設定に応じて `--from`、`--gateway`、
   `--policy`、`--providers`、`--gpu` flags を付与）。
2. OpenClaw は `openshell sandbox ssh-config <name>` を呼び出して、sandbox の SSH 接続
   詳細を取得します。
3. Core は SSH config を temp file に書き込み、汎用 SSH backend と同じ remote filesystem bridge を使って SSH session を開きます。
4. `mirror` モードでは: exec 前に local から remote へ同期し、実行し、exec 後に同期し戻します。
5. `remote` モードでは: create 時に 1 回 seed し、その後は直接リモート
   workspace で動作します。

## 関連項目

- [Sandboxing](/ja-JP/gateway/sandboxing) -- モード、スコープ、backend 比較
- [Sandbox vs Tool Policy vs Elevated](/ja-JP/gateway/sandbox-vs-tool-policy-vs-elevated) -- ブロックされた tools のデバッグ
- [Multi-Agent Sandbox and Tools](/ja-JP/tools/multi-agent-sandbox-tools) -- agent ごとの上書き
- [Sandbox CLI](/ja-JP/cli/sandbox) -- `openclaw sandbox` コマンド
