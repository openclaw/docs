---
read_when:
    - OpenClaw の更新
    - アップデート後に問題が発生する
summary: OpenClaw を安全に更新する（グローバルインストールまたはソース）、およびロールバック戦略
title: 更新
x-i18n:
    generated_at: "2026-05-11T20:32:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: cb1506ed87b1cf2e4928987c9dbfaff17d47b87f6c18239d694e0f55deb609f7
    source_path: install/updating.md
    workflow: 16
---

OpenClaw を最新の状態に保つ。

## 推奨: `openclaw update`

更新する最速の方法です。インストール種別 (npm または git) を検出し、最新バージョンを取得し、`openclaw doctor` を実行して、gateway を再起動します。

```bash
openclaw update
```

チャネルを切り替える、または特定のバージョンを対象にするには:

```bash
openclaw update --channel beta
openclaw update --channel dev
openclaw update --tag main
openclaw update --dry-run   # 適用せずにプレビュー
```

`openclaw update` は `--verbose` を受け付けません。更新の診断には、
計画されたアクションをプレビューする `--dry-run`、構造化された結果を得る `--json`、または
チャネルと利用可能状態を調べる `openclaw update status --json` を使用します。
インストーラーには独自の `--verbose` フラグがありますが、そのフラグは
`openclaw update` の一部ではありません。

`--channel beta` は beta を優先しますが、beta タグが存在しない、または最新の安定版リリースより古い場合、
ランタイムは stable/latest にフォールバックします。一度きりのパッケージ更新で
生の npm beta dist-tag を使いたい場合は、`--tag beta` を使用してください。

管理対象 Plugin では、beta チャネルのフォールバックは警告です。Plugin beta が利用できないために
Plugin が記録済みの default/latest リリースを使っていても、コアの更新は
成功する場合があります。

チャネルの意味については、[開発チャネル](/ja-JP/install/development-channels) を参照してください。

## npm と git インストールを切り替える

インストール種別を変更したい場合はチャネルを使用します。アップデーターは
`~/.openclaw` 内の状態、設定、認証情報、ワークスペースを保持します。変更するのは
CLI と gateway が使用する OpenClaw コードのインストール先だけです。

```bash
# npm パッケージインストール -> 編集可能な git チェックアウト
openclaw update --channel dev

# git チェックアウト -> npm パッケージインストール
openclaw update --channel stable
```

正確なインストールモード切り替えをプレビューするには、まず `--dry-run` 付きで実行します:

```bash
openclaw update --channel dev --dry-run
openclaw update --channel stable --dry-run
```

`dev` チャネルは git チェックアウトを用意し、ビルドして、そのチェックアウトからグローバル CLI を
インストールします。`stable` と `beta` チャネルはパッケージインストールを使用します。
gateway がすでにインストールされている場合、`openclaw update` はサービスメタデータを更新し、
`--no-restart` を渡さない限り再起動します。

## 代替: インストーラーを再実行する

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

オンボーディングをスキップするには `--no-onboard` を追加します。インストーラー経由で特定のインストール種別を
強制するには、`--install-method git --no-onboard` または
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

## 代替: 手動の npm、pnpm、または bun

```bash
npm i -g openclaw@latest
```

管理されたインストールでは `openclaw update` を推奨します。実行中の Gateway サービスと
パッケージの入れ替えを連携できるためです。管理対象 Gateway が実行中の状態で手動更新する場合は、
パッケージマネージャーの完了直後に Gateway を再起動し、古いプロセスが置き換え済みのパッケージ
ファイルから提供を続けないようにしてください。

`openclaw update` がグローバル npm インストールを管理する場合、まず対象を一時的な npm prefix に
インストールし、パッケージ化された `dist` インベントリを検証してから、クリーンなパッケージツリーを
実際のグローバル prefix に入れ替えます。これにより、npm が古いパッケージ由来の古いファイルに
新しいパッケージを上書き配置することを避けられます。インストールコマンドが失敗した場合、
OpenClaw は `--omit=optional` 付きでもう一度試行します。この再試行は、ネイティブの任意依存関係を
コンパイルできないホストで役立ち、フォールバックも失敗した場合は元の失敗を見える状態に保ちます。

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

### 高度な npm インストールトピック

<AccordionGroup>
  <Accordion title="読み取り専用のパッケージツリー">
    OpenClaw は、グローバルパッケージディレクトリが現在のユーザーにより書き込み可能な場合でも、パッケージ化されたグローバルインストールをランタイムでは読み取り専用として扱います。Plugin パッケージのインストール先は、ユーザー設定ディレクトリ配下の OpenClaw 所有の npm/git ルートであり、Gateway 起動時に OpenClaw パッケージツリーを変更することはありません。

    一部の Linux npm セットアップでは、`/usr/lib/node_modules/openclaw` など root 所有のディレクトリ配下にグローバルパッケージをインストールします。OpenClaw はそのレイアウトをサポートします。Plugin のインストール/更新コマンドは、そのグローバルパッケージディレクトリの外部に書き込むためです。

  </Accordion>
  <Accordion title="強化された systemd ユニット">
    明示的な Plugin インストール、Plugin 更新、doctor クリーンアップが変更を永続化できるように、OpenClaw に設定/状態ルートへの書き込み権限を付与します:

    ```ini
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

  </Accordion>
  <Accordion title="ディスク容量の事前チェック">
    パッケージ更新と明示的な Plugin インストールの前に、OpenClaw は対象ボリュームに対してベストエフォートのディスク容量チェックを試みます。容量不足の場合はチェックしたパスを含む警告が表示されますが、更新はブロックされません。ファイルシステムのクォータ、スナップショット、ネットワークボリュームはチェック後に変わる可能性があるためです。実際のパッケージマネージャーによるインストールとインストール後の検証が、引き続き権威ある結果となります。
  </Accordion>
</AccordionGroup>

## 自動アップデーター

自動アップデーターはデフォルトでオフです。`~/.openclaw/openclaw.json` で有効にします:

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

| チャネル | 動作                                                                                                      |
| -------- | ------------------------------------------------------------------------------------------------------------- |
| `stable` | `stableDelayHours` 待機してから、`stableJitterHours` 全体に決定的なジッターをかけて適用します (段階的ロールアウト)。 |
| `beta`   | `betaCheckIntervalHours` ごとにチェックし (デフォルト: 1 時間ごと)、ただちに適用します。                              |
| `dev`    | 自動適用はありません。`openclaw update` を手動で使用してください。                                                           |

gateway は起動時にも更新ヒントをログに記録します (`update.checkOnStart: false` で無効化)。
ダウングレードやインシデント復旧では、Gateway 環境で `OPENCLAW_NO_AUTO_UPDATE=1` を設定すると、`update.auto.enabled` が構成されていても自動適用をブロックできます。起動時の更新ヒントは、`update.checkOnStart` も無効化されていない限り引き続き実行される場合があります。

ライブ Gateway コントロールプレーンハンドラー経由で要求されたパッケージマネージャー更新は、
パッケージ入れ替え後に、延期なし・クールダウンなしの更新再起動を強制します。これにより、
すでに置き換えられたパッケージツリーから古いメモリ内プロセスがチャンクを遅延ロードできるほど
長く残ることを避けられます。シェルの `openclaw update` は、更新の前後でサービスを停止および
再起動できるため、管理されたインストールでは引き続き推奨される方法です。

## 更新後

<Steps>

### doctor を実行する

```bash
openclaw doctor
```

設定を移行し、DM ポリシーを監査し、gateway の健全性を確認します。詳細: [Doctor](/ja-JP/gateway/doctor)

### gateway を再起動する

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

### コミットを固定する (ソース)

```bash
git fetch origin
git checkout "$(git rev-list -n 1 --before=\"2026-01-01\" origin/main)"
pnpm install && pnpm build
openclaw gateway restart
```

最新に戻すには: `git checkout main && git pull`。

## 行き詰まった場合

- `openclaw doctor` を再度実行し、出力を注意深く読んでください。
- ソースチェックアウトで `openclaw update --channel dev` を実行する場合、アップデーターは必要に応じて `pnpm` を自動ブートストラップします。pnpm/corepack のブートストラップエラーが表示された場合は、`pnpm` を手動でインストールする (または `corepack` を再度有効化する) して、更新を再実行してください。
- 確認: [トラブルシューティング](/ja-JP/gateway/troubleshooting)
- Discord で質問: [https://discord.gg/clawd](https://discord.gg/clawd)

## 関連

- [インストール概要](/ja-JP/install): すべてのインストール方法。
- [Doctor](/ja-JP/gateway/doctor): 更新後の健全性チェック。
- [移行](/ja-JP/install/migrating): メジャーバージョン移行ガイド。
