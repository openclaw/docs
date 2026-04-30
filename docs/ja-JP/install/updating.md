---
read_when:
    - OpenClaw の更新
    - 更新後に問題が発生する
summary: OpenClawの安全な更新（グローバルインストールまたはソースから）とロールバック戦略
title: 更新
x-i18n:
    generated_at: "2026-04-30T05:21:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 17d4839002b153976e014e0eefcb44f92dcb9bb45b81bf30efb1e8e8c0f30ec3
    source_path: install/updating.md
    workflow: 16
---

OpenClaw を最新の状態に保つ。

## 推奨: `openclaw update`

最も速い更新方法。インストール種別（npm または git）を検出し、最新バージョンを取得し、`openclaw doctor` を実行して、gateway を再起動します。

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

`--channel beta` は beta を優先しますが、beta タグがない場合や最新の stable リリースより古い場合、ランタイムは stable/latest にフォールバックします。1 回限りのパッケージ更新で生の npm beta dist-tag を使いたい場合は、`--tag beta` を使用してください。

チャンネルの意味については、[開発チャンネル](/ja-JP/install/development-channels) を参照してください。

## npm インストールと git インストールを切り替える

インストール種別を変更したい場合はチャンネルを使用します。アップデーターは `~/.openclaw` 内の状態、設定、認証情報、ワークスペースを保持します。変更されるのは、CLI と gateway が使用する OpenClaw コードのインストールだけです。

```bash
# npm package install -> editable git checkout
openclaw update --channel dev

# git checkout -> npm package install
openclaw update --channel stable
```

正確なインストールモードの切り替えを事前確認するには、まず `--dry-run` を付けて実行します:

```bash
openclaw update --channel dev --dry-run
openclaw update --channel stable --dry-run
```

`dev` チャンネルは git checkout を確保し、それをビルドして、その checkout からグローバル CLI をインストールします。`stable` と `beta` チャンネルはパッケージインストールを使用します。gateway がすでにインストールされている場合、`openclaw update` はサービスメタデータを更新し、`--no-restart` を渡さない限り再起動します。

## 代替手段: インストーラーを再実行する

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

オンボーディングをスキップするには `--no-onboard` を追加します。インストーラー経由で特定のインストール種別を強制するには、`--install-method git --no-onboard` または `--install-method npm --no-onboard` を渡します。

npm パッケージインストール段階の後に `openclaw update` が失敗した場合は、インストーラーを再実行してください。インストーラーは古いアップデーターを呼び出しません。グローバルパッケージインストールを直接実行し、部分的に更新された npm インストールを復旧できます。

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
```

復旧を特定のバージョンまたは dist-tag に固定するには、`--version` を追加します:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm --version <version-or-dist-tag>
```

## 代替手段: 手動の npm、pnpm、または bun

```bash
npm i -g openclaw@latest
```

`openclaw update` がグローバル npm インストールを管理する場合、まず一時的な npm prefix に対象をインストールし、パッケージ化された `dist` インベントリを検証してから、クリーンなパッケージツリーを実際のグローバル prefix に入れ替えます。これにより、npm が古いパッケージの残存ファイルの上に新しいパッケージを重ねてしまうことを避けられます。インストールコマンドが失敗した場合、OpenClaw は `--omit=optional` を付けて 1 回再試行します。この再試行は、ネイティブの任意依存関係をコンパイルできないホストで役立ちます。一方で、フォールバックも失敗した場合は元の失敗が確認できる状態に保たれます。

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

### 高度な npm インストールトピック

<AccordionGroup>
  <Accordion title="読み取り専用パッケージツリー">
    OpenClaw は、グローバルパッケージディレクトリが現在のユーザーによって書き込み可能な場合でも、パッケージ化されたグローバルインストールを実行時には読み取り専用として扱います。バンドルされた Plugin のランタイム依存関係は、パッケージツリーを変更する代わりに、書き込み可能なランタイムディレクトリにステージングされます。これにより、同じインストール中に Plugin 依存関係を修復している実行中の gateway やローカルエージェントと `openclaw update` が競合することを防ぎます。

    一部の Linux npm セットアップでは、グローバルパッケージが `/usr/lib/node_modules/openclaw` のような root 所有ディレクトリの下にインストールされます。OpenClaw は同じ外部ステージングパスを通じて、そのレイアウトをサポートします。

  </Accordion>
  <Accordion title="強化された systemd unit">
    `ReadWritePaths` に含まれる書き込み可能なステージディレクトリを設定します:

    ```ini
    Environment=OPENCLAW_PLUGIN_STAGE_DIR=/var/lib/openclaw/plugin-runtime-deps
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

    `OPENCLAW_PLUGIN_STAGE_DIR` はパスリストも受け付けます。OpenClaw は、列挙された root 全体でバンドルされた Plugin のランタイム依存関係を左から右に解決し、前方の root を読み取り専用の事前インストール済みレイヤーとして扱い、最後の書き込み可能な root にのみインストールまたは修復します:

    ```ini
    Environment=OPENCLAW_PLUGIN_STAGE_DIR=/opt/openclaw/plugin-runtime-deps:/var/lib/openclaw/plugin-runtime-deps
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

    `OPENCLAW_PLUGIN_STAGE_DIR` が設定されていない場合、OpenClaw は systemd が提供する場合は `$STATE_DIRECTORY` を使用し、その後 `~/.openclaw/plugin-runtime-deps` にフォールバックします。修復ステップはそのステージを OpenClaw 所有のローカルパッケージ root として扱い、ユーザーの npm prefix とグローバル設定を無視します。そのため、グローバルインストールの npm config によって、バンドルされた Plugin 依存関係が `~/node_modules` やグローバルパッケージツリーへリダイレクトされることはありません。

  </Accordion>
  <Accordion title="ディスク容量の事前確認">
    パッケージ更新とバンドルされたランタイム依存関係の修復の前に、OpenClaw は対象ボリュームのディスク容量をベストエフォートで確認しようとします。容量不足の場合は確認したパス付きの警告が出ますが、ファイルシステムのクォータ、スナップショット、ネットワークボリュームは確認後に変わる可能性があるため、更新はブロックされません。実際の npm インストール、コピー、インストール後の検証が引き続き最終的な判断基準です。
  </Accordion>
  <Accordion title="バンドルされた Plugin ランタイム依存関係">
    パッケージ化されたインストールでは、バンドルされた Plugin のランタイム依存関係は読み取り専用パッケージツリーの外に保持されます。起動時および `openclaw doctor --fix` の実行中、OpenClaw は、設定でアクティブ、レガシーチャンネル設定を通じてアクティブ、またはバンドルされたマニフェスト既定値によって有効化されているバンドル Plugin に対してのみランタイム依存関係を修復します。永続化されたチャンネル認証状態だけでは、Gateway 起動時のランタイム依存関係修復はトリガーされません。

    明示的な無効化が優先されます。無効化された Plugin やチャンネルは、パッケージ内に存在するというだけではランタイム依存関係を修復されません。外部 Plugin とカスタムロードパスは、引き続き `openclaw plugins install` または `openclaw plugins update` を使用します。

  </Accordion>
</AccordionGroup>

## 自動アップデーター

自動アップデーターは既定でオフです。`~/.openclaw/openclaw.json` で有効化します:

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

| チャンネル | 動作 |
| -------- | ------------------------------------------------------------------------------------------------------------- |
| `stable` | `stableDelayHours` 待機した後、`stableJitterHours` 全体にわたる決定的なジッター（段階的ロールアウト）で適用します。 |
| `beta`   | `betaCheckIntervalHours` ごと（既定: 1 時間ごと）に確認し、即時適用します。 |
| `dev`    | 自動適用はありません。`openclaw update` を手動で使用します。 |

gateway は起動時にも更新ヒントをログに記録します（`update.checkOnStart: false` で無効化）。
ダウングレードやインシデント復旧の場合は、gateway 環境で `OPENCLAW_NO_AUTO_UPDATE=1` を設定し、`update.auto.enabled` が構成されていても自動適用をブロックします。`update.checkOnStart` も無効化されていない限り、起動時の更新ヒントは引き続き実行できます。

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

最新へ戻るには: `git checkout main && git pull`。

## 行き詰まった場合

- `openclaw doctor` を再度実行し、出力を注意深く読んでください。
- ソース checkout 上で `openclaw update --channel dev` を実行する場合、アップデーターは必要に応じて `pnpm` を自動ブートストラップします。pnpm/corepack のブートストラップエラーが表示された場合は、`pnpm` を手動でインストール（または `corepack` を再有効化）してから更新を再実行してください。
- 確認: [トラブルシューティング](/ja-JP/gateway/troubleshooting)
- Discord で質問: [https://discord.gg/clawd](https://discord.gg/clawd)

## 関連

- [インストール概要](/ja-JP/install): すべてのインストール方法。
- [Doctor](/ja-JP/gateway/doctor): 更新後の健全性チェック。
- [移行](/ja-JP/install/migrating): メジャーバージョン移行ガイド。
