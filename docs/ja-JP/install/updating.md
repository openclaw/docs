---
read_when:
    - OpenClaw の更新
    - アップデート後に問題が発生する
summary: OpenClaw を安全に更新する（グローバルインストールまたはソースから）とロールバック戦略
title: 更新
x-i18n:
    generated_at: "2026-05-02T04:59:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 84bf4462a4ee041b0d22e433d1e9f44cfd799a5c327ba94f9df96595d92bdb3c
    source_path: install/updating.md
    workflow: 16
---

OpenClaw を最新の状態に保ちます。

## 推奨: `openclaw update`

更新する最速の方法です。インストール種別（npm または git）を検出し、最新バージョンを取得し、`openclaw doctor` を実行して、gateway を再起動します。

```bash
openclaw update
```

チャンネルを切り替える、または特定のバージョンを指定するには:

```bash
openclaw update --channel beta
openclaw update --channel dev
openclaw update --tag main
openclaw update --dry-run   # 適用せずにプレビュー
```

`--channel beta` は beta を優先しますが、beta タグが存在しない場合、または最新の stable リリースより古い場合、ランタイムは stable/latest にフォールバックします。一度限りのパッケージ更新で生の npm beta dist-tag を使いたい場合は `--tag beta` を使用してください。

チャンネルのセマンティクスについては [開発チャンネル](/ja-JP/install/development-channels) を参照してください。

## npm インストールと git インストールを切り替える

インストール種別を変更したい場合はチャンネルを使用します。アップデーターは `~/.openclaw` 内の状態、設定、認証情報、ワークスペースを保持します。変更されるのは、CLI と gateway が使用する OpenClaw コードのインストールだけです。

```bash
# npm package install -> editable git checkout
openclaw update --channel dev

# git checkout -> npm package install
openclaw update --channel stable
```

まず `--dry-run` 付きで実行して、正確なインストールモードの切り替えをプレビューします:

```bash
openclaw update --channel dev --dry-run
openclaw update --channel stable --dry-run
```

`dev` チャンネルは git checkout を確保し、それをビルドして、その checkout からグローバル CLI をインストールします。`stable` と `beta` チャンネルはパッケージインストールを使用します。gateway がすでにインストールされている場合、`--no-restart` を渡さない限り、`openclaw update` はサービスメタデータを更新して再起動します。

## 代替: インストーラーを再実行する

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

オンボーディングをスキップするには `--no-onboard` を追加します。インストーラー経由で特定のインストール種別を強制するには、`--install-method git --no-onboard` または `--install-method npm --no-onboard` を渡します。

npm パッケージのインストール段階後に `openclaw update` が失敗した場合は、インストーラーを再実行してください。インストーラーは古いアップデーターを呼び出しません。グローバルパッケージのインストールを直接実行し、部分的に更新された npm インストールを復旧できます。

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

`openclaw update` がグローバル npm インストールを管理する場合、まず対象を一時的な npm prefix にインストールし、パッケージ化された `dist` インベントリを検証してから、クリーンなパッケージツリーを実際のグローバル prefix に差し替えます。これにより、npm が古いパッケージの残存ファイルに新しいパッケージを重ねて配置することを避けられます。インストールコマンドが失敗した場合、OpenClaw は `--omit=optional` 付きで一度だけ再試行します。この再試行は、ネイティブのオプション依存関係をコンパイルできないホストで役立ち、フォールバックも失敗した場合は元の失敗を確認できる状態に保ちます。

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

### 高度な npm インストールのトピック

<AccordionGroup>
  <Accordion title="読み取り専用パッケージツリー">
    OpenClaw は、グローバルパッケージディレクトリが現在のユーザーによって書き込み可能な場合でも、パッケージ化されたグローバルインストールを実行時に読み取り専用として扱います。Plugin パッケージのインストール先は、ユーザー設定ディレクトリ配下の OpenClaw 所有の npm/git ルートです。また、Gateway の起動時に OpenClaw パッケージツリーは変更されません。

    一部の Linux npm セットアップでは、グローバルパッケージが `/usr/lib/node_modules/openclaw` のような root 所有ディレクトリ配下にインストールされます。OpenClaw はこのレイアウトをサポートしています。Plugin のインストール/更新コマンドは、そのグローバルパッケージディレクトリの外部に書き込むためです。

  </Accordion>
  <Accordion title="強化された systemd ユニット">
    明示的な Plugin インストール、Plugin 更新、doctor クリーンアップが変更を永続化できるように、OpenClaw に設定/状態ルートへの書き込みアクセスを付与します:

    ```ini
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

  </Accordion>
  <Accordion title="ディスク容量の事前確認">
    パッケージ更新と明示的な Plugin インストールの前に、OpenClaw は対象ボリュームに対してベストエフォートのディスク容量チェックを試みます。容量不足の場合はチェックしたパスを含む警告が出ますが、ファイルシステムのクォータ、スナップショット、ネットワークボリュームはチェック後に変化する可能性があるため、更新はブロックされません。実際のパッケージマネージャーによるインストールとインストール後の検証が引き続き authoritative です。
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

| チャンネル | 動作                                                                                                         |
| -------- | ------------------------------------------------------------------------------------------------------------- |
| `stable` | `stableDelayHours` 待機し、その後 `stableJitterHours` 全体にわたる決定的なジッター（分散ロールアウト）付きで適用します。 |
| `beta`   | `betaCheckIntervalHours` ごと（デフォルト: 1 時間ごと）にチェックし、ただちに適用します。                              |
| `dev`    | 自動適用はありません。`openclaw update` を手動で使用してください。                                                           |

gateway は起動時にも更新ヒントをログに記録します（`update.checkOnStart: false` で無効化）。
ダウングレードまたはインシデント復旧の場合は、gateway 環境で `OPENCLAW_NO_AUTO_UPDATE=1` を設定すると、`update.auto.enabled` が設定されていても自動適用をブロックできます。`update.checkOnStart` も無効化されていない限り、起動時の更新ヒントは引き続き実行できます。

ライブ Gateway コントロールプレーンハンドラー経由で要求されたパッケージマネージャー更新は、パッケージ差し替え後に、延期なし・クールダウンなしの更新再起動を強制します。これにより、すでに置き換えられたパッケージツリーからチャンクを遅延ロードするほど長く、古いメモリ内プロセスが残ることを避けられます。Shell の `openclaw update` は、更新の前後でサービスを停止および再起動できるため、監視付きインストールでは引き続き推奨される経路です。

## 更新後

<Steps>

### doctor を実行する

```bash
openclaw doctor
```

設定を移行し、DM ポリシーを監査し、gateway の健全性をチェックします。詳細: [Doctor](/ja-JP/gateway/doctor)

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

最新に戻すには: `git checkout main && git pull`。

## 行き詰まった場合

- `openclaw doctor` を再度実行し、出力を注意深く読んでください。
- ソース checkout で `openclaw update --channel dev` を実行する場合、必要に応じてアップデーターが `pnpm` を自動でブートストラップします。pnpm/corepack のブートストラップエラーが表示された場合は、`pnpm` を手動でインストール（または `corepack` を再有効化）し、更新を再実行してください。
- 確認: [トラブルシューティング](/ja-JP/gateway/troubleshooting)
- Discord で質問: [https://discord.gg/clawd](https://discord.gg/clawd)

## 関連

- [インストール概要](/ja-JP/install): すべてのインストール方法。
- [Doctor](/ja-JP/gateway/doctor): 更新後の健全性チェック。
- [移行](/ja-JP/install/migrating): メジャーバージョンの移行ガイド。
