---
read_when:
    - OpenClaw の更新
    - 更新後に問題が発生する
summary: OpenClaw を安全に更新する（グローバルインストールまたはソースから）方法とロールバック戦略
title: 更新
x-i18n:
    generated_at: "2026-05-04T07:03:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3c9ff1d70d74f45efea3c148718e5cbc74001ce3d924b760edc4d68622d23714
    source_path: install/updating.md
    workflow: 16
---

OpenClaw を最新の状態に保ちます。

## 推奨: `openclaw update`

更新する最速の方法です。インストール種別 (npm または git) を検出し、最新バージョンを取得し、`openclaw doctor` を実行して、gateway を再起動します。

```bash
openclaw update
```

チャンネルを切り替える、または特定のバージョンを対象にするには:

```bash
openclaw update --channel beta
openclaw update --channel dev
openclaw update --tag main
openclaw update --dry-run   # 適用せずにプレビュー
```

`openclaw update` は `--verbose` を受け付けません。更新診断には、予定されている操作をプレビューする `--dry-run`、構造化された結果を得る `--json`、またはチャンネルと利用可能状態を確認する `openclaw update status --json` を使用してください。インストーラーには独自の `--verbose` フラグがありますが、そのフラグは `openclaw update` の一部ではありません。

`--channel beta` は beta を優先しますが、beta タグがない場合、または最新の安定版リリースより古い場合、runtime は stable/latest にフォールバックします。1 回限りのパッケージ更新で生の npm beta dist-tag を使いたい場合は、`--tag beta` を使用してください。

チャンネルの意味については、[開発チャンネル](/ja-JP/install/development-channels)を参照してください。

## npm インストールと git インストールを切り替える

インストール種別を変更したい場合はチャンネルを使用します。アップデーターは `~/.openclaw` 内の状態、設定、認証情報、ワークスペースを保持します。変更するのは、CLI と gateway が使用する OpenClaw コードのインストール先だけです。

```bash
# npm パッケージインストール -> 編集可能な git checkout
openclaw update --channel dev

# git checkout -> npm パッケージインストール
openclaw update --channel stable
```

正確なインストールモード切り替えをプレビューするには、まず `--dry-run` 付きで実行します:

```bash
openclaw update --channel dev --dry-run
openclaw update --channel stable --dry-run
```

`dev` チャンネルは git checkout を確保し、それをビルドして、その checkout からグローバル CLI をインストールします。`stable` と `beta` チャンネルはパッケージインストールを使用します。gateway がすでにインストールされている場合、`openclaw update` はサービスメタデータを更新し、`--no-restart` を渡さない限り再起動します。

## 代替: インストーラーを再実行する

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

オンボーディングをスキップするには `--no-onboard` を追加します。インストーラー経由で特定のインストール種別を強制するには、`--install-method git --no-onboard` または `--install-method npm --no-onboard` を渡します。

npm パッケージインストール段階の後で `openclaw update` が失敗した場合は、インストーラーを再実行してください。インストーラーは古いアップデーターを呼び出しません。グローバルパッケージインストールを直接実行し、部分的に更新された npm インストールを復旧できます。

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
```

復旧を特定のバージョンまたは dist-tag に固定するには、`--version` を追加します:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm --version <version-or-dist-tag>
```

## 代替: 手動で npm、pnpm、または bun を使う

```bash
npm i -g openclaw@latest
```

管理下のインストールでは `openclaw update` を推奨します。実行中の Gateway サービスとパッケージ入れ替えを調整できるためです。管理下の Gateway が実行中の状態で手動更新する場合は、パッケージマネージャーの完了直後に Gateway を再起動してください。古いプロセスが置き換え済みのパッケージファイルから提供し続けないようにするためです。

`openclaw update` がグローバル npm インストールを管理する場合、まず対象を一時的な npm prefix にインストールし、パッケージ化された `dist` インベントリを検証してから、クリーンなパッケージツリーを実際のグローバル prefix に入れ替えます。これにより、npm が古いパッケージ由来の古いファイルの上に新しいパッケージを重ねることを避けられます。インストールコマンドが失敗した場合、OpenClaw は `--omit=optional` 付きで 1 回再試行します。この再試行は、ネイティブのオプション依存関係をコンパイルできないホストで役立ちます。一方で、フォールバックも失敗した場合は元の失敗が見えるままになります。

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

### 高度な npm インストールのトピック

<AccordionGroup>
  <Accordion title="読み取り専用パッケージツリー">
    OpenClaw は、グローバルパッケージディレクトリが現在のユーザーによって書き込み可能な場合でも、パッケージ化されたグローバルインストールを runtime では読み取り専用として扱います。Plugin パッケージインストールは、ユーザー設定ディレクトリ配下の OpenClaw 所有の npm/git ルートに配置され、Gateway 起動時に OpenClaw パッケージツリーは変更されません。

    一部の Linux npm セットアップでは、`/usr/lib/node_modules/openclaw` のような root 所有ディレクトリ配下にグローバルパッケージをインストールします。Plugin のインストール/更新コマンドはそのグローバルパッケージディレクトリの外側に書き込むため、OpenClaw はそのレイアウトをサポートします。

  </Accordion>
  <Accordion title="強化された systemd ユニット">
    明示的な Plugin インストール、Plugin 更新、doctor クリーンアップが変更を永続化できるように、OpenClaw に設定/状態ルートへの書き込みアクセス権を与えます:

    ```ini
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

  </Accordion>
  <Accordion title="ディスク容量の事前確認">
    パッケージ更新と明示的な Plugin インストールの前に、OpenClaw は対象ボリュームのディスク容量をベストエフォートで確認しようとします。容量不足の場合は確認したパスとともに警告が出ますが、更新はブロックされません。ファイルシステムのクォータ、スナップショット、ネットワークボリュームは確認後に変わる可能性があるためです。実際のパッケージマネージャーによるインストールとインストール後の検証が引き続き信頼できる根拠です。
  </Accordion>
</AccordionGroup>

## 自動アップデーター

自動アップデーターはデフォルトではオフです。`~/.openclaw/openclaw.json` で有効にします:

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

| チャンネル | 動作                                                                                                                |
| -------- | ------------------------------------------------------------------------------------------------------------------- |
| `stable` | `stableDelayHours` 待機した後、`stableJitterHours` 全体にわたる決定的なジッターで適用します (段階的ロールアウト)。 |
| `beta`   | `betaCheckIntervalHours` ごと (デフォルト: 1 時間ごと) に確認し、即座に適用します。                                |
| `dev`    | 自動適用はありません。`openclaw update` を手動で使用してください。                                                 |

gateway は起動時にも更新ヒントをログ出力します (`update.checkOnStart: false` で無効化)。
ダウングレードまたはインシデント復旧では、Gateway 環境で `OPENCLAW_NO_AUTO_UPDATE=1` を設定して、`update.auto.enabled` が設定されている場合でも自動適用をブロックします。`update.checkOnStart` も無効化しない限り、起動時の更新ヒントは引き続き実行できます。

稼働中の Gateway コントロールプレーンハンドラー経由で要求されたパッケージマネージャー更新は、パッケージ入れ替え後に、遅延なし、クールダウンなしの更新再起動を強制します。これにより、すでに置き換えられたパッケージツリーからチャンクを遅延読み込みできるほど長く、古いインメモリプロセスが残ることを避けます。Shell の `openclaw update` は、更新の前後でサービスを停止して再起動できるため、管理下のインストールでは引き続き推奨される経路です。

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

### コミットを固定する (source)

```bash
git fetch origin
git checkout "$(git rev-list -n 1 --before=\"2026-01-01\" origin/main)"
pnpm install && pnpm build
openclaw gateway restart
```

最新に戻すには: `git checkout main && git pull`。

## 行き詰まった場合

- `openclaw doctor` をもう一度実行し、出力を注意深く読んでください。
- ソース checkout 上で `openclaw update --channel dev` を実行する場合、必要に応じてアップデーターが `pnpm` を自動ブートストラップします。pnpm/corepack のブートストラップエラーが表示された場合は、`pnpm` を手動でインストールする (または `corepack` を再度有効化する) して、更新を再実行してください。
- 確認: [トラブルシューティング](/ja-JP/gateway/troubleshooting)
- Discord で質問: [https://discord.gg/clawd](https://discord.gg/clawd)

## 関連

- [インストール概要](/ja-JP/install): すべてのインストール方法。
- [Doctor](/ja-JP/gateway/doctor): 更新後の健全性確認。
- [移行](/ja-JP/install/migrating): メジャーバージョン移行ガイド。
