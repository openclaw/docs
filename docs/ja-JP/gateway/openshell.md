---
read_when:
    - ローカルの Docker ではなく、クラウド管理のサンドボックスを使用したい場合
    - OpenShell Pluginを設定しています
    - ミラーとリモートワークスペースのいずれかのモードを選択する必要があります
summary: OpenShell を OpenClaw エージェント向けのマネージドサンドボックスバックエンドとして使用する
title: OpenShell
x-i18n:
    generated_at: "2026-07-11T22:16:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bf5c33912bd0db759a01cf58ea26712a8ada68c0804bf16f69f1f7cdd496828c
    source_path: gateway/openshell.md
    workflow: 16
---

OpenShell はマネージドサンドボックスバックエンドです。Docker コンテナを
ローカルで実行する代わりに、OpenClaw はサンドボックスのライフサイクルを `openshell` CLI に委任し、
リモート環境のプロビジョニングと SSH 経由でのコマンド実行を行います。

この Plugin は、汎用の [SSH バックエンド](/ja-JP/gateway/sandboxing#ssh-backend) と同じ SSH トランスポートおよび
リモートファイルシステムブリッジを再利用し、OpenShell のライフサイクル
（`sandbox create/get/delete/ssh-config`）と、オプションの `mirror`
ワークスペース同期モードを追加します。

## 前提条件

- OpenShell Plugin がインストールされていること（`openclaw plugins install @openclaw/openshell-sandbox`）
- `openshell` CLI が `PATH` 上にあること（または
  `plugins.entries.openshell.config.command` でカスタムパスを指定）
- サンドボックスへのアクセス権を持つ OpenShell アカウント
- ホスト上で OpenClaw Gateway が実行されていること

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

Gateway を再起動します。次のエージェントターンで OpenClaw が OpenShell
サンドボックスを作成し、ツール実行をそこへルーティングします。次のコマンドで確認します。

```bash
openclaw sandbox list
openclaw sandbox explain
```

## ワークスペースモード

これは OpenShell における最も重要な選択です。

### mirror（デフォルト）

`plugins.entries.openshell.config.mode: "mirror"` では、**ローカルワークスペースが
正規の状態**として維持されます。

- `exec` の前に、OpenClaw がローカルワークスペースをサンドボックスへ同期します。
- `exec` の後に、OpenClaw がリモートワークスペースをローカルへ同期します。
- ファイルツールはサンドボックスブリッジを経由しますが、ターン間ではローカルが信頼できる唯一の情報源となります。

開発ワークフローに最適です。OpenClaw 外部で行ったローカル編集は次回の
実行時に反映され、サンドボックスは Docker バックエンドに近い動作をします。

トレードオフ：実行ターンごとにアップロードとダウンロードのコストが発生します。

### remote

`mode: "remote"` では、**OpenShell ワークスペースが正規の状態**となります。

- 最初のサンドボックス作成時に、OpenClaw がローカルからリモートワークスペースへ
  一度だけ初期データを投入します。
- その後、`exec`、`read`、`write`、`edit`、`apply_patch` は
  リモートワークスペースを直接操作します。OpenClaw はリモートの変更を
  ローカルへ同期**しません**。
- プロンプト処理時のメディア読み取りも引き続き機能します（ファイル／メディアツールは
  サンドボックスブリッジ経由で読み取ります）。

長時間実行するエージェントや CI に最適です。ターンごとのオーバーヘッドが低く、
ホスト上のローカル編集によってリモート状態が暗黙に上書きされることもありません。

<Warning>
初期データ投入後にホスト上で OpenClaw の外部からファイルを編集しても、リモートサンドボックスには反映されません。再度初期データを投入するには `openclaw sandbox recreate` を実行してください。
</Warning>

### モードの選択

|                          | `mirror`                         | `remote`                         |
| ------------------------ | -------------------------------- | -------------------------------- |
| **正規のワークスペース** | ローカルホスト                   | リモート OpenShell               |
| **同期方向**             | 双方向（実行ごと）               | 1 回限りの初期データ投入         |
| **ターンごとの負荷**     | 高い（アップロード＋ダウンロード） | 低い（リモートを直接操作）       |
| **ローカル編集の反映**   | あり（次回の実行時）             | なし（再作成するまで）           |
| **最適な用途**           | 開発ワークフロー                 | 長時間実行するエージェント、CI   |

## 設定リファレンス

すべての OpenShell 設定は `plugins.entries.openshell.config` 配下にあります。

| キー                      | 型                       | デフォルト    | 説明                                                                                          |
| ------------------------- | ------------------------ | ------------- | --------------------------------------------------------------------------------------------- |
| `mode`                    | `"mirror"` または `"remote"` | `"mirror"`    | ワークスペース同期モード                                                                      |
| `command`                 | `string`                 | `"openshell"` | `openshell` CLI のパスまたは名前                                                              |
| `from`                    | `string`                 | `"openclaw"`  | 初回作成時のサンドボックスソース                                                              |
| `gateway`                 | `string`                 | 未設定        | OpenShell Gateway 名（トップレベルの `--gateway`）                                            |
| `gatewayEndpoint`         | `string`                 | 未設定        | OpenShell Gateway エンドポイント（トップレベルの `--gateway-endpoint`）                       |
| `policy`                  | `string`                 | 未設定        | サンドボックス作成用の OpenShell ポリシー ID                                                  |
| `providers`               | `string[]`               | `[]`          | サンドボックス作成時に関連付けるプロバイダー名（重複排除され、エントリごとに `--provider` フラグを 1 つ指定） |
| `gpu`                     | `boolean`                | `false`       | GPU リソースを要求（`--gpu`）                                                                 |
| `autoProviders`           | `boolean`                | `true`        | 作成時に `--auto-providers`（false の場合は `--no-auto-providers`）を渡す                      |
| `remoteWorkspaceDir`      | `string`                 | `"/sandbox"`  | サンドボックス内の主要な書き込み可能ワークスペース                                            |
| `remoteAgentWorkspaceDir` | `string`                 | `"/agent"`    | エージェントワークスペースのマウントパス（ワークスペースアクセスが `rw` でない場合は読み取り専用） |
| `timeoutSeconds`          | `number`                 | `120`         | `openshell` CLI 操作のタイムアウト                                                             |

`remoteWorkspaceDir` と `remoteAgentWorkspaceDir` は絶対パスである必要があり、
管理対象ルート `/sandbox` または `/agent` の配下に収まらなければなりません。その他の絶対パスは
拒否されます。

サンドボックスレベルの設定（`mode`、`scope`、`workspaceAccess`）は、他のバックエンドと同様に
`agents.defaults.sandbox` 配下にあります。完全な対応表については
[サンドボックス化](/ja-JP/gateway/sandboxing)を参照してください。

## 例

### 最小構成のリモート設定

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

### GPU を使用するミラーモード

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

### カスタム Gateway を使用するエージェント単位の OpenShell

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

# 有効なポリシーを確認
openclaw sandbox explain

# 再作成（リモートワークスペースを削除し、次回使用時に再度初期データを投入）
openclaw sandbox recreate --all
```

`remote` モードでは、再作成が特に重要です。対象スコープの正規の
リモートワークスペースが削除され、次回使用時にローカルから新しいワークスペースへ
初期データが投入されます。`mirror` モードではローカルが正規の状態として維持されるため、
再作成は主にリモート実行環境をリセットします。

次のいずれかを変更した後は再作成してください。

- `agents.defaults.sandbox.backend`
- `plugins.entries.openshell.config.from`
- `plugins.entries.openshell.config.mode`
- `plugins.entries.openshell.config.policy`

## セキュリティ強化

ミラーモードのファイルシステムブリッジはローカルワークスペースのルートを固定し、
読み取り、書き込み、ディレクトリ作成、削除、名前変更の前に、正規パスを
（realpath を使用して）毎回再確認し、パス途中のシンボリックリンクを拒否します。シンボリックリンクの
差し替えやワークスペースの再マウントによって、ミラー対象ツリー外へファイルアクセスを
リダイレクトすることはできません。

## 現在の制限事項

- OpenShell バックエンドではサンドボックスブラウザーはサポートされません。
- `sandbox.docker.binds` は OpenShell には適用されません。バインドが設定されている場合、
  サンドボックスの作成は失敗します。
- `sandbox.docker.*` 配下の Docker 固有のランタイム設定（`env` を除く）は、
  Docker バックエンドにのみ適用されます。

## 仕組み

1. OpenClaw はサンドボックス名を指定して `sandbox get` を実行します（設定されている
   `--gateway`／`--gateway-endpoint` を含む）。失敗した場合は、
   `sandbox create` で作成し、`--name`、`--from`、設定されている場合は `--policy`、
   有効な場合は `--gpu`、`--auto-providers`／`--no-auto-providers`、および設定済みの
   プロバイダーごとに 1 つの `--provider` フラグを渡します。
2. OpenClaw はサンドボックス名を指定して `sandbox ssh-config` を実行し、SSH
   接続情報を取得します。
3. コアが SSH 設定を一時ファイルへ書き込み、汎用 SSH バックエンドと同じ
   リモートファイルシステムブリッジを介して SSH セッションを開きます。
4. `mirror` モード：実行前にローカルからリモートへ同期し、実行後にリモートから同期を戻します。
5. `remote` モード：作成時に一度だけ初期データを投入し、その後はリモート
   ワークスペースを直接操作します。

## 関連項目

- [サンドボックス化](/ja-JP/gateway/sandboxing) - モード、スコープ、バックエンドの比較
- [サンドボックス、ツールポリシー、昇格の比較](/ja-JP/gateway/sandbox-vs-tool-policy-vs-elevated) - ブロックされたツールのデバッグ
- [マルチエージェントのサンドボックスとツール](/ja-JP/tools/multi-agent-sandbox-tools) - エージェント単位のオーバーライド
- [サンドボックス CLI](/ja-JP/cli/sandbox) - `openclaw sandbox` コマンド
