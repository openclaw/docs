---
read_when:
    - OpenClaw の更新
    - アップデート後に何かが壊れる
summary: OpenClaw を安全に更新する（グローバルインストールまたはソース）方法とロールバック戦略
title: 更新中
x-i18n:
    generated_at: "2026-06-27T11:51:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a96c5b9b12040fe9bb8b1623c88a9c305d58dc6fcee7003f500e897ded9e7b4a
    source_path: install/updating.md
    workflow: 16
---

OpenClaw を最新の状態に保ちます。

## 推奨: `openclaw update`

最速の更新方法です。インストール種別（npm または git）を検出し、最新バージョンを取得し、`openclaw doctor` を実行して、Gateway を再起動します。

```bash
openclaw update
```

チャネルを切り替える、または特定のバージョンを対象にするには:

```bash
openclaw update --channel beta
openclaw update --channel dev
openclaw update --dry-run   # preview without applying
```

`openclaw update` は `--verbose` を受け付けません。更新診断には、予定されている操作をプレビューする `--dry-run`、構造化された結果を得る `--json`、またはチャネルと利用可能状態を調べる `openclaw update status --json` を使用します。インストーラーには独自の `--verbose` フラグがありますが、そのフラグは `openclaw update` の一部ではありません。

`--channel beta` は beta を優先しますが、beta タグが存在しない、または最新の stable リリースより古い場合、ランタイムは stable/latest にフォールバックします。一回限りのパッケージ更新で生の npm beta dist-tag を使いたい場合は、`--tag beta` を使用します。

永続的に追従する GitHub `main` チェックアウトには `--channel dev` を使用します。パッケージ更新では、`--tag main` は 1 回の実行に対して `github:openclaw/openclaw#main` に対応し、GitHub/git ソース指定は段階的な npm install の前に一時 tarball へパックされます。

管理対象プラグインでは、beta チャネルのフォールバックは警告です。プラグインの beta が利用できないためにプラグインが記録済みの default/latest リリースを使用しても、コア更新は成功する場合があります。

チャネルの意味については [開発チャネル](/ja-JP/install/development-channels) を参照してください。

## npm インストールと git インストールを切り替える

インストール種別を変更したい場合はチャネルを使用します。アップデーターは `~/.openclaw` 内の状態、設定、認証情報、ワークスペースを保持します。変更するのは、CLI と Gateway が使用する OpenClaw コードのインストールだけです。

```bash
# npm package install -> editable git checkout
openclaw update --channel dev

# git checkout -> npm package install
openclaw update --channel stable
```

まず `--dry-run` 付きで実行し、正確なインストールモードの切り替えをプレビューします。

```bash
openclaw update --channel dev --dry-run
openclaw update --channel stable --dry-run
```

`dev` チャネルは git チェックアウトを確保し、それをビルドし、そのチェックアウトからグローバル CLI をインストールします。`stable` と `beta` チャネルはパッケージインストールを使用します。Gateway がすでにインストールされている場合、`openclaw update` はサービスメタデータを更新し、`--no-restart` を渡さない限り再起動します。

管理対象 Gateway サービスを伴うパッケージインストールでは、`openclaw update` はそのサービスが使用するパッケージルートを対象にします。シェルの `openclaw` コマンドが別のインストール由来の場合、アップデーターは両方のルートと管理対象サービスの Node パスを出力します。パッケージ更新は、サービスルートを所有するパッケージマネージャーを使用し、パッケージを置き換える前に管理対象サービスの Node を対象リリースのエンジン要件と照合します。

## 代替: インストーラーを再実行する

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

オンボーディングをスキップするには `--no-onboard` を追加します。インストーラー経由で特定のインストール種別を強制するには、`--install-method git --no-onboard` または `--install-method npm --no-onboard` を渡します。

npm パッケージのインストール段階の後に `openclaw update` が失敗した場合は、インストーラーを再実行します。インストーラーは古いアップデーターを呼び出しません。グローバルパッケージインストールを直接実行し、部分的に更新された npm インストールを復旧できます。

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
```

復旧を特定のバージョンまたは dist-tag に固定するには、`--version` を追加します。

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm --version <version-or-dist-tag>
```

## 代替: 手動 npm、pnpm、または bun

```bash
npm i -g openclaw@latest
```

監視付きインストールでは `openclaw update` を優先してください。実行中の Gateway サービスとパッケージの入れ替えを調整できるためです。監視付きインストールを手動で更新する場合は、パッケージマネージャーを開始する前に管理対象 Gateway を停止します。パッケージマネージャーはファイルをその場で置き換えるため、Gateway が実行中だと、パッケージツリーが一時的に半分入れ替わった状態でコアまたはプラグインファイルを読み込もうとする可能性があります。パッケージマネージャーの完了後に Gateway を再起動し、サービスが新しいインストールを取得するようにします。

root 所有の Linux システムグローバルインストールで、`openclaw update` が `EACCES` で失敗し、システム npm で復旧する場合は、手動のパッケージ置換中は Gateway を停止したままにします。その Gateway で通常使用しているものと同じ `openclaw` プロファイルフラグまたは環境を使用します。`/usr/bin/npm` は、ホスト上で root 所有のグローバル prefix を所有するシステム npm に置き換えてください。

```bash
openclaw gateway stop
sudo /usr/bin/npm i -g openclaw@latest
openclaw gateway install --force
openclaw gateway restart
```

次にサービスを検証します。

```bash
openclaw --version
curl -fsS http://127.0.0.1:18789/readyz
openclaw plugins list --json
openclaw gateway status --deep --json
openclaw doctor --lint --json
```

`openclaw update` がグローバル npm インストールを管理する場合、最初に対象を一時 npm prefix にインストールし、パッケージ化された `dist` インベントリを検証してから、クリーンなパッケージツリーを実際のグローバル prefix に入れ替えます。これにより、npm が古いパッケージの残存ファイルの上に新しいパッケージを重ねることを防ぎます。インストールコマンドが失敗した場合、OpenClaw は `--omit=optional` 付きで 1 回再試行します。この再試行はネイティブのオプション依存関係をコンパイルできないホストで役立ち、フォールバックも失敗した場合は元の失敗を見える状態に保ちます。

OpenClaw 管理の npm 更新コマンドとプラグイン更新コマンドは、子 npm プロセスの npm `min-release-age` 隔離も解除します。npm はそのポリシーを派生した `before` カットオフとして報告する場合があります。どちらも一般的なサプライチェーン隔離ポリシーには有用ですが、明示的な OpenClaw 更新は「選択した OpenClaw リリースを今インストールする」という意味です。

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

### 高度な npm インストールのトピック

<AccordionGroup>
  <Accordion title="読み取り専用パッケージツリー">
    OpenClaw は、グローバルパッケージディレクトリが現在のユーザーから書き込み可能であっても、パッケージ化されたグローバルインストールをランタイムでは読み取り専用として扱います。プラグインパッケージのインストール先は、ユーザー設定ディレクトリ配下の OpenClaw 所有の npm/git ルートであり、Gateway 起動時に OpenClaw パッケージツリーは変更されません。

    一部の Linux npm セットアップでは、グローバルパッケージを `/usr/lib/node_modules/openclaw` のような root 所有ディレクトリ配下にインストールします。OpenClaw はそのレイアウトをサポートします。プラグインのインストール/更新コマンドは、そのグローバルパッケージディレクトリの外に書き込むためです。

  </Accordion>
  <Accordion title="強化された systemd ユニット">
    明示的なプラグインインストール、プラグイン更新、doctor クリーンアップが変更を永続化できるように、OpenClaw に設定/状態ルートへの書き込みアクセスを付与します。

    ```ini
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

  </Accordion>
  <Accordion title="ディスク容量の事前確認">
    パッケージ更新と明示的なプラグインインストールの前に、OpenClaw は対象ボリュームのディスク容量をベストエフォートで確認します。容量不足の場合は確認したパス付きの警告が出ますが、更新はブロックされません。ファイルシステムのクォータ、スナップショット、ネットワークボリュームは確認後に変化する可能性があるためです。実際のパッケージマネージャーによるインストールとインストール後の検証が引き続き正式な判定になります。
  </Accordion>
</AccordionGroup>

## 自動アップデーター

自動アップデーターはデフォルトで無効です。`~/.openclaw/openclaw.json` で有効にします。

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
| -------- | ---- |
| `stable` | `stableDelayHours` 待機し、その後 `stableJitterHours` 全体にわたる決定的なジッター（分散ロールアウト）で適用します。 |
| `beta`   | `betaCheckIntervalHours` ごと（デフォルト: 1 時間ごと）に確認し、すぐに適用します。 |
| `dev`    | 自動適用はありません。`openclaw update` を手動で使用します。 |

Gateway は起動時にも更新ヒントをログに出力します（`update.checkOnStart: false` で無効化）。
ダウングレードまたはインシデント復旧では、Gateway 環境で `OPENCLAW_NO_AUTO_UPDATE=1` を設定すると、`update.auto.enabled` が設定されていても自動適用をブロックできます。`update.checkOnStart` も無効化しない限り、起動時の更新ヒントは引き続き実行できます。

ライブ Gateway コントロールプレーンハンドラー経由で要求されたパッケージマネージャー更新は、実行中の Gateway プロセス内のパッケージツリーを置き換えません。管理対象サービスインストールでは、Gateway は分離された引き継ぎを開始して終了し、通常の `openclaw update --yes --json` CLI パスに、サービスの停止、パッケージの置換、サービスメタデータの更新、再起動、Gateway バージョンと到達性の検証、可能な場合はインストール済みだが未ロードの macOS LaunchAgent の復旧を任せます。Gateway がその引き継ぎを安全に行えない場合、`update.run` はパッケージマネージャーをプロセス内で実行する代わりに、安全なシェルコマンドを報告します。

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

- `openclaw doctor` を再度実行し、出力を注意深く読みます。
- ソースチェックアウトで `openclaw update --channel dev` を使用する場合、アップデーターは必要に応じて `pnpm` を自動でブートストラップします。pnpm/corepack のブートストラップエラーが表示された場合は、`pnpm` を手動でインストールする（または `corepack` を再有効化する）し、更新を再実行します。
- 確認: [トラブルシューティング](/ja-JP/gateway/troubleshooting)
- Discord で質問する: [https://discord.gg/clawd](https://discord.gg/clawd)

## 関連

- [インストール概要](/ja-JP/install): すべてのインストール方法。
- [Doctor](/ja-JP/gateway/doctor): 更新後の健全性チェック。
- [移行](/ja-JP/install/migrating): メジャーバージョン移行ガイド。
