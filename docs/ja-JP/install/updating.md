---
read_when:
    - OpenClaw の更新
    - 更新後に問題が発生する
summary: OpenClaw を安全に更新する（グローバルインストールまたはソース）、およびロールバック戦略
title: 更新
x-i18n:
    generated_at: "2026-05-07T13:21:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3c9ff1d70d74f45efea3c148718e5cbc74001ce3d924b760edc4d68622d23714
    source_path: install/updating.md
    workflow: 16
---

OpenClaw を最新の状態に保ちます。

## 推奨: `openclaw update`

最速の更新方法です。インストール種別 (npm または git) を検出し、最新バージョンを取得し、`openclaw doctor` を実行して Gateway を再起動します。

```bash
openclaw update
```

チャネルを切り替える、または特定のバージョンを対象にするには:

```bash
openclaw update --channel beta
openclaw update --channel dev
openclaw update --tag main
openclaw update --dry-run   # preview without applying
```

`openclaw update` は `--verbose` を受け付けません。更新の診断には、
予定されている操作をプレビューする `--dry-run`、構造化された結果を得る `--json`、または
チャネルと利用可能状態を確認する `openclaw update status --json` を使用します。
インストーラーには独自の `--verbose` フラグがありますが、そのフラグは
`openclaw update` の一部ではありません。

`--channel beta` は beta を優先しますが、beta タグが存在しない、または最新の安定版リリースより古い場合、
ランタイムは stable/latest にフォールバックします。1 回限りのパッケージ更新で raw npm beta dist-tag を使いたい場合は、`--tag beta`
を使用してください。

チャネルの意味については [開発チャネル](/ja-JP/install/development-channels) を参照してください。

## npm インストールと git インストールを切り替える

インストール種別を変更したい場合はチャネルを使用します。アップデーターは
`~/.openclaw` 内の状態、設定、認証情報、ワークスペースを保持します。変更されるのは、
CLI と Gateway が使用する OpenClaw コードのインストールだけです。

```bash
# npm package install -> editable git checkout
openclaw update --channel dev

# git checkout -> npm package install
openclaw update --channel stable
```

正確なインストールモードの切り替えをプレビューするには、まず `--dry-run` 付きで実行します:

```bash
openclaw update --channel dev --dry-run
openclaw update --channel stable --dry-run
```

`dev` チャネルは git checkout を用意し、それをビルドして、その checkout からグローバル CLI
をインストールします。`stable` と `beta` チャネルはパッケージインストールを使用します。
Gateway がすでにインストールされている場合、`--no-restart` を渡さない限り、`openclaw update` はサービスメタデータを更新し、
再起動します。

## 代替: インストーラーを再実行する

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

オンボーディングをスキップするには `--no-onboard` を追加します。インストーラー経由で特定のインストール種別を強制するには、
`--install-method git --no-onboard` または
`--install-method npm --no-onboard` を渡します。

npm パッケージのインストール段階の後で `openclaw update` が失敗した場合は、
インストーラーを再実行してください。インストーラーは古いアップデーターを呼び出しません。グローバル
パッケージインストールを直接実行し、部分的に更新された npm インストールを復旧できます。

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
```

復旧を特定のバージョンまたは dist-tag に固定するには、`--version` を追加します:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm --version <version-or-dist-tag>
```

## 代替: 手動 npm、pnpm、または bun

```bash
npm i -g openclaw@latest
```

管理されたインストールでは `openclaw update` を推奨します。実行中の Gateway サービスと
パッケージの入れ替えを調整できるためです。管理された Gateway が実行中の間に手動で更新する場合は、
パッケージマネージャーの完了直後に Gateway を再起動し、古いプロセスが置き換え済みのパッケージ
ファイルから提供し続けないようにしてください。

`openclaw update` がグローバル npm インストールを管理する場合、まず対象を
一時的な npm prefix にインストールし、パッケージ化された `dist` インベントリを検証してから、
クリーンなパッケージツリーを実際のグローバル prefix に入れ替えます。これにより、npm が
古いパッケージの残存ファイルの上に新しいパッケージを重ねてしまうことを避けます。インストールコマンドが失敗した場合、
OpenClaw は `--omit=optional` 付きで 1 回再試行します。この再試行は、ネイティブの
optional dependencies をコンパイルできないホストで役立ちます。一方で、フォールバックも失敗した場合は元の失敗が見える状態を保ちます。

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

### 高度な npm インストールのトピック

<AccordionGroup>
  <Accordion title="読み取り専用パッケージツリー">
    OpenClaw は、グローバルパッケージディレクトリが現在のユーザーによって書き込み可能な場合でも、パッケージ化されたグローバルインストールを実行時には読み取り専用として扱います。Plugin パッケージインストールは、ユーザー設定ディレクトリ配下にある OpenClaw 所有の npm/git ルートに配置され、Gateway 起動時に OpenClaw パッケージツリーは変更されません。

    一部の Linux npm 環境では、グローバルパッケージが `/usr/lib/node_modules/openclaw` などの root 所有ディレクトリ配下にインストールされます。Plugin のインストール/更新コマンドはそのグローバルパッケージディレクトリの外側に書き込むため、OpenClaw はそのレイアウトをサポートします。

  </Accordion>
  <Accordion title="強化された systemd ユニット">
    明示的な Plugin インストール、Plugin 更新、doctor クリーンアップが変更を永続化できるように、OpenClaw に設定/状態ルートへの書き込みアクセスを付与します:

    ```ini
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

  </Accordion>
  <Accordion title="ディスク容量の事前チェック">
    パッケージ更新と明示的な Plugin インストールの前に、OpenClaw は対象ボリュームに対してベストエフォートのディスク容量チェックを試みます。空き容量が少ない場合、チェックしたパスを含む警告が生成されますが、更新はブロックされません。ファイルシステムのクォータ、スナップショット、ネットワークボリュームはチェック後に変化する可能性があるためです。実際のパッケージマネージャーによるインストールとインストール後の検証が、引き続き信頼できる判断基準です。
  </Accordion>
</AccordionGroup>

## 自動アップデーター

自動アップデーターはデフォルトでオフです。`~/.openclaw/openclaw.json` で有効化します:

```json5
{
  update: {
    channel: "stable",
    auto: {
      enabled: true,
      stableDelayHours: 6,
      stableJitterHours: 12,
      betaCheckIntervalHours: 1,
    },
  },
}
```

| チャネル | 動作                                                                                                          |
| -------- | ------------------------------------------------------------------------------------------------------------- |
| `stable` | `stableDelayHours` だけ待機し、その後 `stableJitterHours` 全体にわたる決定的ジッター (段階的ロールアウト) で適用します。 |
| `beta`   | `betaCheckIntervalHours` ごとに確認し (デフォルト: 1 時間ごと)、すぐに適用します。                              |
| `dev`    | 自動適用はありません。`openclaw update` を手動で使用します。                                                   |

Gateway は起動時にも更新ヒントをログに出力します (`update.checkOnStart: false` で無効化)。
ダウングレードやインシデント復旧では、Gateway 環境で `OPENCLAW_NO_AUTO_UPDATE=1` を設定すると、`update.auto.enabled` が設定されていても自動適用をブロックできます。`update.checkOnStart` も無効化されていない限り、起動時の更新ヒントは引き続き実行される可能性があります。

ライブ Gateway コントロールプレーンハンドラー経由で要求されたパッケージマネージャー更新は、
パッケージ入れ替え後に、遅延なし、クールダウンなしの更新再起動を強制します。これにより、
すでに置き換えられたパッケージツリーからチャンクを遅延ロードするのに十分な時間、古いインメモリプロセスが残ることを避けます。
シェルの `openclaw update` は、更新の前後でサービスを停止して再起動できるため、
管理されたインストールでは引き続き推奨される経路です。

## 更新後

<Steps>

### doctor を実行する

```bash
openclaw doctor
```

設定を移行し、DM ポリシーを監査し、Gateway の健全性を確認します。詳細: [Doctor](/ja-JP/gateway/doctor)

### Gateway を再起動する

```bash
openclaw gateway restart
```

### 検証する

```bash
openclaw health
```

</Steps>

## ロールバック

### バージョンを固定する (npm)

```bash
npm i -g openclaw@<version>
openclaw doctor
openclaw gateway restart
```

<Tip>
`npm view openclaw version` は現在公開されているバージョンを表示します。
</Tip>

### コミットを固定する (source)

```bash
git fetch origin
git checkout "$(git rev-list -n 1 --before=\"2026-01-01\" origin/main)"
pnpm install && pnpm build
openclaw gateway restart
```

最新に戻すには: `git checkout main && git pull`。

## 行き詰まった場合

- `openclaw doctor` をもう一度実行し、出力を慎重に読んでください。
- source checkout 上で `openclaw update --channel dev` を実行する場合、必要に応じてアップデーターが `pnpm` を自動ブートストラップします。pnpm/corepack のブートストラップエラーが表示された場合は、`pnpm` を手動でインストールする (または `corepack` を再有効化する) して、更新を再実行してください。
- 確認: [トラブルシューティング](/ja-JP/gateway/troubleshooting)
- Discord で質問: [https://discord.gg/clawd](https://discord.gg/clawd)

## 関連

- [インストール概要](/ja-JP/install): すべてのインストール方法。
- [Doctor](/ja-JP/gateway/doctor): 更新後の健全性チェック。
- [移行](/ja-JP/install/migrating): メジャーバージョンの移行ガイド。
