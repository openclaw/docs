---
read_when:
    - ローカル Docker ではなくクラウド管理のサンドボックスを使いたい
    - OpenShell Plugin を設定しています
    - ミラーモードとリモートワークスペースモードのどちらかを選択する必要があります
summary: OpenClaw エージェントの管理対象サンドボックスバックエンドとして OpenShell を使用する
title: OpenShell
x-i18n:
    generated_at: "2026-04-30T05:15:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 694a0a145802f4b624af01b58cbb5886bab7426fb9a90f216480141082089144
    source_path: gateway/openshell.md
    workflow: 16
---

OpenShell は OpenClaw 用のマネージドサンドボックスバックエンドです。Docker
コンテナをローカルで実行する代わりに、OpenClaw はサンドボックスのライフサイクルを `openshell` CLI に委譲し、
SSH ベースのコマンド実行を備えたリモート環境をプロビジョニングします。

OpenShell Plugin は、汎用 [SSH バックエンド](/ja-JP/gateway/sandboxing#ssh-backend)と同じコア SSH トランスポートとリモートファイルシステム
ブリッジを再利用します。さらに、
OpenShell 固有のライフサイクル（`sandbox create/get/delete`、`sandbox ssh-config`）と、任意の `mirror` ワークスペースモードを追加します。

## 前提条件

- `openshell` CLI がインストールされ、`PATH` 上にあること（または
  `plugins.entries.openshell.config.command` でカスタムパスを設定）
- サンドボックスアクセス権を持つ OpenShell アカウント
- ホスト上で OpenClaw Gateway が実行中であること

## クイックスタート

1. Plugin を有効化し、サンドボックスバックエンドを設定します。

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

2. Gateway を再起動します。次の agent ターンで、OpenClaw は OpenShell
   サンドボックスを作成し、ツール実行をそこにルーティングします。

3. 確認します。

```bash
openclaw sandbox list
openclaw sandbox explain
```

## ワークスペースモード

これは OpenShell を使用する際の最も重要な判断です。

### `mirror`

**ローカルワークスペースを正本として維持**したい場合は、`plugins.entries.openshell.config.mode: "mirror"` を使用します。

動作:

- `exec` の前に、OpenClaw はローカルワークスペースを OpenShell サンドボックスに同期します。
- `exec` の後に、OpenClaw はリモートワークスペースをローカルワークスペースへ同期します。
- ファイルツールは引き続きサンドボックスブリッジ経由で動作しますが、ターン間ではローカルワークスペースが
  真実のソースのままです。

最適な用途:

- OpenClaw の外部でファイルをローカル編集し、その変更をサンドボックスで自動的に見えるようにしたい。
- OpenShell サンドボックスを Docker バックエンドにできるだけ近い挙動にしたい。
- 各 exec ターン後に、ホストワークスペースへサンドボックス内の書き込みを反映したい。

トレードオフ: 各 exec の前後に追加の同期コストが発生します。

### `remote`

**OpenShell ワークスペースを正本にしたい**場合は、`plugins.entries.openshell.config.mode: "remote"` を使用します。

動作:

- サンドボックスが最初に作成されるとき、OpenClaw はローカルワークスペースからリモートワークスペースへ
  一度だけシードします。
- その後、`exec`、`read`、`write`、`edit`、`apply_patch` は
  リモートの OpenShell ワークスペースに対して直接動作します。
- OpenClaw はリモートの変更をローカルワークスペースに同期しません。
- ファイルツールとメディアツールはサンドボックスブリッジ経由で読み取るため、プロンプト時のメディア読み取りは引き続き機能します。

最適な用途:

- サンドボックスを主にリモート側で維持したい。
- ターンごとの同期オーバーヘッドを下げたい。
- ホストローカルの編集でリモートサンドボックス状態が暗黙的に上書きされることを避けたい。

<Warning>
初回シード後に OpenClaw の外部でホスト上のファイルを編集しても、リモートサンドボックスはその変更を認識しません。再シードするには `openclaw sandbox recreate` を使用してください。
</Warning>

### モードの選択

|                          | `mirror`                   | `remote`                  |
| ------------------------ | -------------------------- | ------------------------- |
| **正本ワークスペース**  | ローカルホスト                 | リモート OpenShell          |
| **同期方向**       | 双方向（各 exec）  | 1 回限りのシード             |
| **ターンごとのオーバーヘッド**    | 高い（アップロード + ダウンロード） | 低い（直接リモート操作） |
| **ローカル編集は見えるか？** | はい、次の exec で          | いいえ、再作成まで        |
| **最適な用途**             | 開発ワークフロー      | 長時間実行 agents、CI   |

## 設定リファレンス

すべての OpenShell 設定は `plugins.entries.openshell.config` 配下にあります。

| キー                       | 型                     | デフォルト       | 説明                                           |
| ------------------------- | ------------------------ | ------------- | ----------------------------------------------------- |
| `mode`                    | `"mirror"` または `"remote"` | `"mirror"`    | ワークスペース同期モード                                   |
| `command`                 | `string`                 | `"openshell"` | `openshell` CLI のパスまたは名前                   |
| `from`                    | `string`                 | `"openclaw"`  | 初回作成時のサンドボックスソース                  |
| `gateway`                 | `string`                 | —             | OpenShell gateway 名（`--gateway`）                  |
| `gatewayEndpoint`         | `string`                 | —             | OpenShell gateway エンドポイント URL（`--gateway-endpoint`） |
| `policy`                  | `string`                 | —             | サンドボックス作成用の OpenShell ポリシー ID              |
| `providers`               | `string[]`               | `[]`          | サンドボックス作成時にアタッチするプロバイダー名      |
| `gpu`                     | `boolean`                | `false`       | GPU リソースを要求する                                 |
| `autoProviders`           | `boolean`                | `true`        | サンドボックス作成時に `--auto-providers` を渡す         |
| `remoteWorkspaceDir`      | `string`                 | `"/sandbox"`  | サンドボックス内の主要な書き込み可能ワークスペース         |
| `remoteAgentWorkspaceDir` | `string`                 | `"/agent"`    | agent ワークスペースのマウントパス（読み取り専用アクセス用）     |
| `timeoutSeconds`          | `number`                 | `120`         | `openshell` CLI 操作のタイムアウト                |

サンドボックスレベルの設定（`mode`、`scope`、`workspaceAccess`）は、他のバックエンドと同様に
`agents.defaults.sandbox` 配下で設定します。完全なマトリクスについては
[サンドボックス化](/ja-JP/gateway/sandboxing)を参照してください。

## 例

### 最小限の remote セットアップ

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

OpenShell サンドボックスは通常のサンドボックス CLI で管理します。

```bash
# List all sandbox runtimes (Docker + OpenShell)
openclaw sandbox list

# Inspect effective policy
openclaw sandbox explain

# Recreate (deletes remote workspace, re-seeds on next use)
openclaw sandbox recreate --all
```

`remote` モードでは、**再作成が特に重要**です。そのスコープの正本である
リモートワークスペースを削除します。次回使用時に、ローカルワークスペースから新しいリモートワークスペースがシードされます。

`mirror` モードでは、ローカルワークスペースが正本のままなので、再作成は主にリモート実行環境をリセットします。

### 再作成が必要な場合

次のいずれかを変更した後は再作成してください。

- `agents.defaults.sandbox.backend`
- `plugins.entries.openshell.config.from`
- `plugins.entries.openshell.config.mode`
- `plugins.entries.openshell.config.policy`

```bash
openclaw sandbox recreate --all
```

## セキュリティ強化

OpenShell はワークスペースのルート fd を固定し、各読み取りの前にサンドボックス ID を再確認するため、
シンボリックリンクの差し替えやワークスペースの再マウントによって、意図したリモートワークスペース外へ読み取りがリダイレクトされることはありません。

## 現在の制限

- サンドボックスブラウザーは OpenShell バックエンドではサポートされていません。
- `sandbox.docker.binds` は OpenShell には適用されません。
- `sandbox.docker.*` 配下の Docker 固有のランタイムノブは Docker
  バックエンドにのみ適用されます。

## 仕組み

1. OpenClaw は `openshell sandbox create` を呼び出します（設定に応じて `--from`、`--gateway`、
   `--policy`、`--providers`、`--gpu` フラグを指定）。
2. OpenClaw は `openshell sandbox ssh-config <name>` を呼び出して、サンドボックスの SSH 接続
   詳細を取得します。
3. コアは SSH 設定を一時ファイルに書き込み、汎用 SSH バックエンドと同じリモートファイルシステムブリッジを使って
   SSH セッションを開きます。
4. `mirror` モードの場合: exec の前にローカルからリモートへ同期し、実行し、exec 後に同期して戻します。
5. `remote` モードの場合: 作成時に一度シードし、その後はリモート
   ワークスペースで直接動作します。

## 関連

- [サンドボックス化](/ja-JP/gateway/sandboxing) -- モード、スコープ、バックエンド比較
- [サンドボックス vs ツールポリシー vs Elevated](/ja-JP/gateway/sandbox-vs-tool-policy-vs-elevated) -- ブロックされたツールのデバッグ
- [Multi-Agent サンドボックスとツール](/ja-JP/tools/multi-agent-sandbox-tools) -- agent ごとのオーバーライド
- [サンドボックス CLI](/ja-JP/cli/sandbox) -- `openclaw sandbox` コマンド
