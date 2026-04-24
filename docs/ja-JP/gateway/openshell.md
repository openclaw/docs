---
read_when:
    - ローカル Docker の代わりにクラウド管理 sandbox を使いたい場合
    - OpenShell Plugin をセットアップしている場合
    - mirror モードと remote workspace モードのどちらを使うか決める必要がある場合
summary: OpenClaw エージェント向けの管理された sandbox バックエンドとして OpenShell を使う
title: OpenShell
x-i18n:
    generated_at: "2026-04-24T04:58:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 47954cd27b4c7ef9d4268597c2846960b39b99fd03ece5dddb5055e9282366a0
    source_path: gateway/openshell.md
    workflow: 15
---

OpenShell は OpenClaw 向けの管理された sandbox バックエンドです。Docker
コンテナをローカルで実行する代わりに、OpenClaw は sandbox のライフサイクルを `openshell` CLI に委譲し、SSH ベースのコマンド実行を備えたリモート環境をプロビジョニングします。

OpenShell Plugin は、汎用 [SSH backend](/ja-JP/gateway/sandboxing#ssh-backend) と同じコア SSH トランスポートおよびリモートファイルシステムブリッジを再利用します。そこに OpenShell 固有のライフサイクル（`sandbox create/get/delete`、`sandbox ssh-config`）と、任意の `mirror` workspace モードを追加します。

## 前提条件

- `openshell` CLI がインストールされており、`PATH` 上にあること（または `plugins.entries.openshell.config.command` でカスタムパスを設定）
- sandbox アクセス権のある OpenShell アカウント
- ホスト上で OpenClaw Gateway が動作していること

## クイックスタート

1. Plugin を有効にし、sandbox バックエンドを設定します:

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

2. Gateway を再起動します。次のエージェントターンで、OpenClaw は OpenShell
   sandbox を作成し、ツール実行をそこへルーティングします。

3. 確認します:

```bash
openclaw sandbox list
openclaw sandbox explain
```

## Workspace モード

これは OpenShell を使うときにもっとも重要な判断です。

### `mirror`

**ローカル workspace を正本のまま維持したい** 場合は、`plugins.entries.openshell.config.mode: "mirror"` を使ってください。

動作:

- `exec` の前に、OpenClaw はローカル workspace を OpenShell sandbox に同期します。
- `exec` の後に、OpenClaw はリモート workspace をローカル workspace に同期し戻します。
- ファイルツールは引き続き sandbox ブリッジ経由で動作しますが、ターン間ではローカル workspace
  がソースオブトゥルースのままです。

最適な用途:

- OpenClaw の外でローカルにファイルを編集しており、その変更を自動的に
  sandbox 側に反映させたい。
- OpenShell sandbox を可能な限り Docker バックエンドのように振る舞わせたい。
- 各 exec ターン後に、ホスト workspace に sandbox 書き込みを反映させたい。

トレードオフ: 各 exec の前後で追加の同期コストがかかります。

### `remote`

**OpenShell workspace を正本にしたい** 場合は、`plugins.entries.openshell.config.mode: "remote"` を使ってください。

動作:

- sandbox が最初に作成されたとき、OpenClaw はローカル workspace から
  リモート workspace に一度だけシードします。
- その後は `exec`、`read`、`write`、`edit`、`apply_patch` が
  リモート OpenShell workspace に対して直接動作します。
- OpenClaw はリモート変更をローカル workspace へ同期し戻しません。
- プロンプト時のメディア読み取りは、ファイルおよびメディアツールが sandbox ブリッジ経由で読むため、引き続き動作します。

最適な用途:

- workspace を主としてリモート側で運用したい。
- ターンごとの同期オーバーヘッドを下げたい。
- ホストローカルでの編集が、気づかないうちにリモート sandbox 状態を上書きするのを避けたい。

重要: 初回シード後に OpenClaw の外でホスト上のファイルを編集しても、
リモート sandbox にはその変更は見えません。再シードするには
`openclaw sandbox recreate` を使ってください。

### モードの選び方

|                          | `mirror`                 | `remote`                |
| ------------------------ | ------------------------ | ----------------------- |
| **正本 workspace**       | ローカルホスト           | リモート OpenShell      |
| **同期方向**             | 双方向（各 exec ごと）   | 初回シードのみ          |
| **ターンごとのオーバーヘッド** | 高い（アップロード + ダウンロード） | 低い（直接リモート操作） |
| **ローカル編集は見えるか？** | はい、次回 exec で反映   | いいえ、recreate まで反映されない |
| **最適な用途**           | 開発ワークフロー         | 長時間実行エージェント、CI |

## 設定リファレンス

OpenShell の設定はすべて `plugins.entries.openshell.config` 配下にあります:

| キー                      | 型                       | デフォルト    | 説明                                                   |
| ------------------------- | ------------------------ | ------------- | ------------------------------------------------------ |
| `mode`                    | `"mirror"` または `"remote"` | `"mirror"`    | Workspace 同期モード                                   |
| `command`                 | `string`                 | `"openshell"` | `openshell` CLI のパスまたは名前                       |
| `from`                    | `string`                 | `"openclaw"`  | 初回作成時の sandbox ソース                            |
| `gateway`                 | `string`                 | —             | OpenShell gateway 名（`--gateway`）                    |
| `gatewayEndpoint`         | `string`                 | —             | OpenShell gateway エンドポイント URL（`--gateway-endpoint`） |
| `policy`                  | `string`                 | —             | sandbox 作成用 OpenShell policy ID                     |
| `providers`               | `string[]`               | `[]`          | sandbox 作成時にアタッチするプロバイダ名               |
| `gpu`                     | `boolean`                | `false`       | GPU リソースを要求                                     |
| `autoProviders`           | `boolean`                | `true`        | sandbox create 時に `--auto-providers` を渡す          |
| `remoteWorkspaceDir`      | `string`                 | `"/sandbox"`  | sandbox 内の主たる書き込み可能 workspace               |
| `remoteAgentWorkspaceDir` | `string`                 | `"/agent"`    | エージェント workspace マウントパス（読み取り専用アクセス用） |
| `timeoutSeconds`          | `number`                 | `120`         | `openshell` CLI 操作のタイムアウト                     |

sandbox レベル設定（`mode`、`scope`、`workspaceAccess`）は、他のバックエンドと同様に
`agents.defaults.sandbox` 配下で設定します。完全なマトリクスは
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

### カスタム gateway を使うエージェント単位 OpenShell

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

OpenShell sandbox は通常の sandbox CLI 経由で管理されます:

```bash
# すべての sandbox ランタイムを一覧表示（Docker + OpenShell）
openclaw sandbox list

# 有効ポリシーを確認
openclaw sandbox explain

# recreate（リモート workspace を削除し、次回使用時に再シード）
openclaw sandbox recreate --all
```

`remote` モードでは、**recreate が特に重要** です。これはそのスコープの正本である
リモート workspace を削除します。次回使用時に、ローカル workspace から
新しいリモート workspace がシードされます。

`mirror` モードでは、ローカル workspace が正本のままなので、recreate は主に
リモート実行環境をリセットします。

### recreate すべきタイミング

次のいずれかを変更した後は recreate してください:

- `agents.defaults.sandbox.backend`
- `plugins.entries.openshell.config.from`
- `plugins.entries.openshell.config.mode`
- `plugins.entries.openshell.config.policy`

```bash
openclaw sandbox recreate --all
```

## セキュリティ強化

OpenShell は workspace ルート fd を固定し、各 read の前に sandbox ID を再確認するため、
シンボリックリンク差し替えや workspace の再マウントによって、意図したリモート workspace の外へ
読み取りが向けられることはありません。

## 現在の制限

- sandbox browser は OpenShell バックエンドではサポートされません。
- `sandbox.docker.binds` は OpenShell には適用されません。
- `sandbox.docker.*` 配下の Docker 固有ランタイム設定は、Docker
  バックエンドにのみ適用されます。

## 仕組み

1. OpenClaw は `openshell sandbox create` を呼び出します（設定に応じて `--from`、`--gateway`、
   `--policy`、`--providers`、`--gpu` フラグ付き）。
2. OpenClaw は `openshell sandbox ssh-config <name>` を呼び出し、
   sandbox 用の SSH 接続情報を取得します。
3. コアは SSH 設定を一時ファイルに書き出し、汎用 SSH バックエンドと同じ
   リモートファイルシステムブリッジを使って SSH セッションを開きます。
4. `mirror` モードでは: exec 前にローカルからリモートへ同期し、実行し、exec 後に同期し戻します。
5. `remote` モードでは: 作成時に一度だけシードし、その後はリモート
   workspace に対して直接操作します。

## 関連

- [Sandboxing](/ja-JP/gateway/sandboxing) -- モード、スコープ、バックエンド比較
- [Sandbox vs Tool Policy vs Elevated](/ja-JP/gateway/sandbox-vs-tool-policy-vs-elevated) -- ブロックされたツールのデバッグ
- [Multi-Agent Sandbox and Tools](/ja-JP/tools/multi-agent-sandbox-tools) -- エージェント単位の上書き
- [Sandbox CLI](/ja-JP/cli/sandbox) -- `openclaw sandbox` コマンド
