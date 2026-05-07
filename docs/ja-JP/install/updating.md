---
read_when:
    - OpenClaw の更新
    - 更新後に何かが動作しなくなる
summary: OpenClaw の安全な更新（グローバルインストールまたはソースから）とロールバック戦略
title: 更新
x-i18n:
    generated_at: "2026-05-07T01:52:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 520f30980c56b9bcfc78bb2e916df812b2770a88c663140eeee3e9697bf58ee6
    source_path: install/updating.md
    workflow: 16
---

OpenClaw を最新の状態に保ちます。

## 推奨: `openclaw update`

更新する最速の方法です。インストール種別（npm または git）を検出し、最新バージョンを取得し、`openclaw doctor` を実行して、Gateway を再起動します。

```bash
openclaw update
```

チャンネルを切り替える、または特定のバージョンを対象にするには:

```bash
openclaw update --channel beta
openclaw update --channel dev
openclaw update --tag main
openclaw update --dry-run   # preview without applying
```

`openclaw update` は `--verbose` を受け付けません。更新の診断には、予定されている操作をプレビューする `--dry-run`、構造化された結果を得る `--json`、またはチャンネルと利用可能状態を確認する `openclaw update status --json` を使用します。インストーラーには独自の `--verbose` フラグがありますが、そのフラグは `openclaw update` の一部ではありません。

`--channel beta` は beta を優先しますが、beta タグが存在しない、または最新の安定版リリースより古い場合、ランタイムは stable/latest にフォールバックします。一回限りのパッケージ更新で生の npm beta dist-tag を使いたい場合は、`--tag beta` を使用してください。

OpenClaw はまだ LTS や月次サポート更新チャンネルを公開していません。SemVer 互換の月次サポート系列に向けて取り組んでいますが、現時点でサポートされているチャンネルは `stable`、`beta`、`dev` のままです。

チャンネルの意味については、[開発チャンネル](/ja-JP/install/development-channels) を参照してください。

## npm と git インストールを切り替える

インストール種別を変更したい場合はチャンネルを使用します。アップデーターは、`~/.openclaw` 内の状態、設定、認証情報、ワークスペースを保持します。変更するのは、CLI と Gateway が使用する OpenClaw コードのインストール先だけです。

```bash
# npm package install -> editable git checkout
openclaw update --channel dev

# git checkout -> npm package install
openclaw update --channel stable
```

正確なインストールモード切り替えをプレビューするには、まず `--dry-run` 付きで実行します。

```bash
openclaw update --channel dev --dry-run
openclaw update --channel stable --dry-run
```

`dev` チャンネルは git チェックアウトを確保し、それをビルドして、そのチェックアウトからグローバル CLI をインストールします。`stable` と `beta` チャンネルはパッケージインストールを使用します。Gateway がすでにインストールされている場合、`openclaw update` はサービスメタデータを更新し、`--no-restart` を渡さない限り再起動します。

## 代替: インストーラーを再実行する

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

オンボーディングをスキップするには `--no-onboard` を追加します。インストーラー経由で特定のインストール種別を強制するには、`--install-method git --no-onboard` または `--install-method npm --no-onboard` を渡します。

npm パッケージインストール段階の後で `openclaw update` が失敗した場合は、インストーラーを再実行してください。インストーラーは古いアップデーターを呼び出しません。グローバルパッケージのインストールを直接実行し、部分的に更新された npm インストールを復旧できます。

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
```

復旧を特定のバージョンまたは dist-tag に固定するには、`--version` を追加します。

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm --version <version-or-dist-tag>
```

## 代替: 手動の npm、pnpm、または bun

```bash
npm i -g openclaw@latest
```

管理されたインストールでは、実行中の Gateway サービスとパッケージ入れ替えを調整できるため、`openclaw update` を推奨します。管理対象の Gateway が実行中に手動で更新する場合は、パッケージマネージャー完了直後に Gateway を再起動し、古いプロセスが置き換えられたパッケージファイルから提供を続けないようにしてください。

`openclaw update` がグローバル npm インストールを管理する場合、まず一時的な npm prefix に対象をインストールし、パッケージ化された `dist` インベントリを検証してから、クリーンなパッケージツリーを実際のグローバル prefix に入れ替えます。これにより、npm が古いパッケージの残存ファイルの上に新しいパッケージを重ねてしまうことを避けます。インストールコマンドが失敗した場合、OpenClaw は `--omit=optional` 付きで 1 回再試行します。この再試行は、ネイティブの optional dependencies をコンパイルできないホストで役立ちます。また、フォールバックも失敗した場合は元の失敗が見える状態を保ちます。

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

### 高度な npm インストールトピック

<AccordionGroup>
  <Accordion title="Read-only package tree">
    OpenClaw は、現在のユーザーがグローバルパッケージディレクトリに書き込める場合でも、パッケージ化されたグローバルインストールを実行時には読み取り専用として扱います。Plugin パッケージのインストール先は、ユーザー設定ディレクトリ配下にある OpenClaw 所有の npm/git ルートであり、Gateway 起動時に OpenClaw パッケージツリーは変更されません。

    一部の Linux npm セットアップでは、`/usr/lib/node_modules/openclaw` のような root 所有ディレクトリ配下にグローバルパッケージをインストールします。Plugin のインストール/更新コマンドはそのグローバルパッケージディレクトリの外側に書き込むため、OpenClaw はそのレイアウトをサポートしています。

  </Accordion>
  <Accordion title="Hardened systemd units">
    明示的な Plugin インストール、Plugin 更新、doctor クリーンアップが変更を永続化できるように、OpenClaw に設定/状態ルートへの書き込みアクセスを与えます。

    ```ini
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

  </Accordion>
  <Accordion title="Disk-space preflight">
    パッケージ更新と明示的な Plugin インストールの前に、OpenClaw は対象ボリュームについてベストエフォートのディスク容量チェックを試行します。容量不足の場合はチェックしたパスを含む警告が出ますが、ファイルシステムのクォータ、スナップショット、ネットワークボリュームはチェック後に変化する可能性があるため、更新はブロックされません。実際のパッケージマネージャーによるインストールとインストール後の検証が、引き続き権威ある判定になります。
  </Accordion>
</AccordionGroup>

## 自動アップデーター

自動アップデーターはデフォルトでオフです。`~/.openclaw/openclaw.json` で有効にします。

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

| チャンネル | 動作                                                                                                      |
| -------- | ------------------------------------------------------------------------------------------------------------- |
| `stable` | `stableDelayHours` 待機した後、`stableJitterHours` 全体の決定的ジッター（分散ロールアウト）で適用します。 |
| `beta`   | `betaCheckIntervalHours` ごと（デフォルト: 1 時間ごと）にチェックし、即座に適用します。                              |
| `dev`    | 自動適用はありません。`openclaw update` を手動で使用してください。                                                           |

Gateway は起動時にも更新ヒントをログに記録します（`update.checkOnStart: false` で無効化）。
ダウングレードまたはインシデント復旧では、`update.auto.enabled` が設定されている場合でも自動適用をブロックするために、Gateway 環境で `OPENCLAW_NO_AUTO_UPDATE=1` を設定します。起動時の更新ヒントは、`update.checkOnStart` も無効化されていない限り、引き続き実行される可能性があります。

ライブ Gateway 制御プレーンハンドラー経由で要求されたパッケージマネージャー更新は、パッケージ入れ替え後に遅延なし、クールダウンなしの更新再起動を強制します。これにより、すでに置き換えられたパッケージツリーからチャンクを遅延ロードできるほど長く、古いメモリ内プロセスが残ることを避けます。シェルの `openclaw update` は、更新の前後でサービスを停止および再起動できるため、管理されたインストールでは引き続き推奨される経路です。

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

### バージョンを固定する（npm）

```bash
npm i -g openclaw@<version>
openclaw doctor
openclaw gateway restart
```

<Tip>
`npm view openclaw version` は現在公開されているバージョンを表示します。
</Tip>

### コミットを固定する（ソース）

```bash
git fetch origin
git checkout "$(git rev-list -n 1 --before=\"2026-01-01\" origin/main)"
pnpm install && pnpm build
openclaw gateway restart
```

最新に戻すには: `git checkout main && git pull`。

## 行き詰まった場合

- `openclaw doctor` をもう一度実行し、出力を注意深く読んでください。
- ソースチェックアウト上の `openclaw update --channel dev` では、必要に応じてアップデーターが `pnpm` を自動ブートストラップします。pnpm/corepack のブートストラップエラーが表示される場合は、`pnpm` を手動でインストールする（または `corepack` を再度有効にする）してから更新を再実行してください。
- 確認: [トラブルシューティング](/ja-JP/gateway/troubleshooting)
- Discord で質問する: [https://discord.gg/clawd](https://discord.gg/clawd)

## 関連

- [インストール概要](/ja-JP/install): すべてのインストール方法。
- [Doctor](/ja-JP/gateway/doctor): 更新後の健全性チェック。
- [移行](/ja-JP/install/migrating): メジャーバージョン移行ガイド。
