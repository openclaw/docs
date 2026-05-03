---
read_when:
    - OpenClawを更新する
    - 更新後に問題が発生する
summary: OpenClaw を安全に更新する方法（グローバルインストールまたはソースから）とロールバック戦略
title: 更新
x-i18n:
    generated_at: "2026-05-03T21:35:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: f9e26ea71748dfd1573cdca01126bf29ebc56be56eac604e2b6a009b463820d1
    source_path: install/updating.md
    workflow: 16
---

OpenClawを最新の状態に保ちます。

## 推奨: `openclaw update`

更新する最速の方法です。インストール種別（npm または git）を検出し、最新バージョンを取得し、`openclaw doctor` を実行して、Gatewayを再起動します。

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

`openclaw update` は `--verbose` を受け付けません。更新診断には、予定されている操作をプレビューする `--dry-run`、構造化された結果を得る `--json`、またはチャネルと利用可能状態を確認する `openclaw update status --json` を使用します。インストーラーには独自の `--verbose` フラグがありますが、そのフラグは `openclaw update` の一部ではありません。

`--channel beta` は beta を優先しますが、beta タグが存在しない場合、または最新の stable リリースより古い場合、ランタイムは stable/latest にフォールバックします。1回限りのパッケージ更新で npm の未加工の beta dist-tag を使いたい場合は、`--tag beta` を使用します。

チャネルの意味については、[開発チャネル](/ja-JP/install/development-channels)を参照してください。

## npm インストールと git インストールを切り替える

インストール種別を変更したい場合はチャネルを使用します。アップデーターは `~/.openclaw` 内の状態、設定、認証情報、ワークスペースを保持します。変更されるのは、CLI と Gateway が使用する OpenClaw コードのインストールだけです。

```bash
# npm package install -> editable git checkout
openclaw update --channel dev

# git checkout -> npm package install
openclaw update --channel stable
```

まず `--dry-run` で実行して、正確なインストールモード切り替えをプレビューします。

```bash
openclaw update --channel dev --dry-run
openclaw update --channel stable --dry-run
```

`dev` チャネルは git チェックアウトを用意し、それをビルドして、そのチェックアウトからグローバル CLI をインストールします。`stable` と `beta` チャネルはパッケージインストールを使用します。Gateway がすでにインストールされている場合、`--no-restart` を渡さない限り、`openclaw update` はサービスメタデータを更新して再起動します。

## 代替: インストーラーを再実行する

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

オンボーディングをスキップするには `--no-onboard` を追加します。インストーラー経由で特定のインストール種別を強制するには、`--install-method git --no-onboard` または `--install-method npm --no-onboard` を渡します。

npm パッケージのインストール段階の後に `openclaw update` が失敗した場合は、インストーラーを再実行します。インストーラーは古いアップデーターを呼び出しません。グローバルパッケージのインストールを直接実行し、部分的に更新された npm インストールを復旧できます。

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

`openclaw update` がグローバル npm インストールを管理する場合、まず一時的な npm prefix に対象をインストールし、パッケージ化された `dist` インベントリを検証してから、クリーンなパッケージツリーを実際のグローバル prefix に入れ替えます。これにより、npm が古いパッケージの古いファイルの上に新しいパッケージを重ねてしまうことを避けられます。インストールコマンドが失敗した場合、OpenClaw は `--omit=optional` を付けて1回再試行します。この再試行は、ネイティブの任意依存関係をコンパイルできないホストで役立ちます。一方で、フォールバックも失敗した場合は元の失敗が見える状態を保ちます。

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

### npm インストールの高度なトピック

<AccordionGroup>
  <Accordion title="読み取り専用パッケージツリー">
    OpenClaw は、現在のユーザーがグローバルパッケージディレクトリに書き込める場合でも、パッケージ化されたグローバルインストールを実行時には読み取り専用として扱います。Plugin パッケージのインストール先は、ユーザー設定ディレクトリ配下にある OpenClaw 所有の npm/git ルートです。Gateway の起動時に OpenClaw パッケージツリーは変更されません。

    一部の Linux npm セットアップでは、`/usr/lib/node_modules/openclaw` など root 所有のディレクトリ配下にグローバルパッケージをインストールします。Plugin のインストール/更新コマンドはそのグローバルパッケージディレクトリの外へ書き込むため、OpenClaw はそのレイアウトをサポートします。

  </Accordion>
  <Accordion title="強化された systemd ユニット">
    明示的な Plugin インストール、Plugin 更新、doctor クリーンアップが変更を永続化できるように、OpenClaw の設定/状態ルートへの書き込みアクセスを付与します。

    ```ini
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

  </Accordion>
  <Accordion title="ディスク容量の事前確認">
    パッケージ更新と明示的な Plugin インストールの前に、OpenClaw は対象ボリュームのディスク容量をベストエフォートで確認しようとします。容量不足の場合は確認されたパスを含む警告が表示されますが、ファイルシステムのクォータ、スナップショット、ネットワークボリュームは確認後に変化する可能性があるため、更新はブロックされません。実際のパッケージマネージャーによるインストールとインストール後の検証が引き続き信頼できる基準です。
  </Accordion>
</AccordionGroup>

## 自動アップデーター

自動アップデーターはデフォルトではオフです。`~/.openclaw/openclaw.json` で有効にします。

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

| チャネル | 動作 |
| -------- | ------------------------------------------------------------------------------------------------------------- |
| `stable` | `stableDelayHours` 待機し、その後 `stableJitterHours` にわたる決定的ジッター（分散ロールアウト）で適用します。 |
| `beta`   | `betaCheckIntervalHours` ごと（デフォルト: 1時間ごと）に確認し、すぐに適用します。 |
| `dev`    | 自動適用はありません。`openclaw update` を手動で使用します。 |

Gateway は起動時にも更新ヒントをログに出力します（`update.checkOnStart: false` で無効化）。
ダウングレードやインシデント復旧では、Gateway 環境で `OPENCLAW_NO_AUTO_UPDATE=1` を設定すると、`update.auto.enabled` が設定されていても自動適用をブロックできます。`update.checkOnStart` も無効化されていない限り、起動時の更新ヒントは引き続き実行される可能性があります。

ライブ Gateway コントロールプレーンハンドラー経由で要求されたパッケージマネージャー更新では、パッケージ入れ替え後に、延期なし、クールダウンなしの更新再起動が強制されます。これにより、すでに置き換え済みのパッケージツリーからチャンクを遅延読み込みするほど古いインメモリプロセスが残ることを避けられます。監督下のインストールでは、更新の前後でサービスを停止および再起動できるため、シェルの `openclaw update` が推奨される経路です。

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

最新へ戻すには: `git checkout main && git pull`。

## 行き詰まった場合

- もう一度 `openclaw doctor` を実行し、出力を注意深く読んでください。
- ソースチェックアウト上で `openclaw update --channel dev` を実行する場合、必要に応じてアップデーターが `pnpm` を自動ブートストラップします。pnpm/corepack のブートストラップエラーが表示された場合は、`pnpm` を手動でインストールする（または `corepack` を再有効化する）してから、更新を再実行してください。
- 確認: [トラブルシューティング](/ja-JP/gateway/troubleshooting)
- Discord で質問する: [https://discord.gg/clawd](https://discord.gg/clawd)

## 関連

- [インストール概要](/ja-JP/install): すべてのインストール方法。
- [Doctor](/ja-JP/gateway/doctor): 更新後の健全性チェック。
- [移行](/ja-JP/install/migrating): メジャーバージョン移行ガイド。
