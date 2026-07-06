---
read_when:
    - OpenClaw の更新
    - 更新後に何かが壊れる
summary: OpenClawを安全に更新する（グローバルインストールまたはソース）方法とロールバック戦略
title: 更新中
x-i18n:
    generated_at: "2026-07-06T10:50:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ee9b71b9d6897b37edd4fd6bdbe8a09e3c9855fd76495fc1d68c76bdc2b5026d
    source_path: install/updating.md
    workflow: 16
---

OpenClaw を最新の状態に保ちます。

## 推奨: `openclaw update`

インストール種別 (npm または git) を検出し、最新バージョンを取得し、`openclaw doctor` を実行して、gateway を再起動します。

```bash
openclaw update
```

チャネルを切り替えるか、特定のバージョンを対象にします。

```bash
openclaw update --channel beta
openclaw update --channel extended-stable
openclaw update --channel dev
openclaw update --dry-run   # preview without applying
```

`openclaw update` には `--verbose` フラグはありません (インストーラーにはあります)。診断には、予定されている操作をプレビューする `--dry-run`、構造化された結果を得る `--json`、またはチャネルと利用可能状態を調べる `openclaw update status --json` を使用します。

`--channel beta` は beta npm dist-tag を優先しますが、beta タグがない場合や、そのバージョンが最新の安定版リリースより古い場合は、stable/latest にフォールバックします。代わりに、生の npm beta dist-tag に固定した一回限りのパッケージ更新には `--tag beta` を使用します。

`--channel extended-stable` はパッケージ専用かつフォアグラウンド専用です。OpenClaw は公開 npm の `extended-stable` セレクターを読み取り、選択された正確なパッケージを検証し、その正確なバージョンをインストールします。レジストリーデータがない、または一貫性がない場合は安全側で失敗します。`latest` へフォールバックすることはありません。選択されたバージョンがインストール済みバージョンより古い場合は、通常のダウングレード確認が引き続き適用されます。コアの差し替え後、bare/default または `latest` の意図を持つ対象の公式 npm Plugins は、その正確なコアバージョンに収束します。正確な固定、明示的な非 `latest` タグ、サードパーティ Plugins、非 npm ソースは変更されません。現在の OpenClaw バージョンで作成されたカタログインストールは、そのデフォルトの意図を保持します。正確なバージョンのみを含む古い記録は固定されたままです。OpenClaw は古い自動固定とユーザーによる固定を安全に区別できないためです。その Plugin を正確なコア追跡に戻すには、extended-stable チャネルで `openclaw plugins update @openclaw/name` を一度実行します。

`--channel dev` は、永続的に移動する GitHub `main` チェックアウトを提供します。一回限りのパッケージ更新では、`--tag main` は `github:openclaw/openclaw#main` パッケージ仕様に対応し、対象のパッケージマネージャー (npm/pnpm/bun) を通じて直接インストールします。

管理対象 Plugins では、beta リリースがないことは警告であり、失敗ではありません。Plugin が記録済みの default/latest リリースへフォールバックしても、コア更新は成功できます。

チャネルの意味については、[リリースチャネル](/ja-JP/install/development-channels) を参照してください。

## npm インストールと git インストールを切り替える

インストール種別を変更するにはチャネルを使用します。アップデーターは `~/.openclaw` 内の状態、設定、認証情報、ワークスペースを保持します。変更するのは、CLI と gateway が使用する OpenClaw コードのインストールだけです。

```bash
# npm package install -> editable git checkout
openclaw update --channel dev

# git checkout -> npm package install
openclaw update --channel stable
```

まずインストールモードの切り替えをプレビューします。

```bash
openclaw update --channel dev --dry-run
openclaw update --channel stable --dry-run
```

`dev` は git チェックアウトを確保し、それをビルドして、そのチェックアウトからグローバル CLI をインストールします。`stable`、`extended-stable`、`beta` チャネルはパッケージインストールを使用します。Extended-stable は git チェックアウト上では、変更や変換を行わずに拒否されます。gateway がすでにインストールされている場合、`openclaw update` は `--no-restart` を渡さない限り、サービスメタデータを更新して再起動します。

管理対象 Gateway サービスを伴うパッケージインストールでは、`openclaw update` はそのサービスが使用するパッケージルートを対象にします。シェルの `openclaw` コマンドが別のインストールから来ている場合、アップデーターは両方のルートと管理対象サービスの Node パスを表示し、パッケージを置き換える前に、その Node バージョンを対象リリースの `engines.node` 要件と照合します。

## 代替: インストーラーを再実行する

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

オンボーディングをスキップするには `--no-onboard` を追加します。特定のインストール種別を強制するには、`--install-method git --no-onboard` または `--install-method npm --no-onboard` を渡します。

npm パッケージインストール段階の後に `openclaw update` が失敗した場合は、代わりにインストーラーを再実行します。これはアップデーターを呼び出しません。グローバルパッケージインストールを直接実行し、部分的に更新された npm インストールを復旧できます。

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
```

`--version` で復旧を特定のバージョンまたは dist-tag に固定します。

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm --version <version-or-dist-tag>
```

## 代替: 手動の npm、pnpm、または bun

```bash
npm i -g openclaw@latest
```

管理下のインストールでは `openclaw update` を推奨します。実行中の Gateway サービスとパッケージ差し替えを調整できるためです。管理下のインストールで手動更新する場合は、先に管理対象 Gateway を停止してください。パッケージマネージャーはファイルをその場で置き換えるため、実行中の Gateway が差し替え中にコアまたは Plugin ファイルを読み込もうとする可能性があります。パッケージマネージャーの完了後に Gateway を再起動し、新しいインストールを反映させます。

root 所有の Linux システムグローバルインストールで、`openclaw update` が `EACCES` により失敗する場合は、手動置き換えの間 Gateway を停止したまま、システム npm で復旧します。その Gateway に通常使用しているものと同じプロファイルフラグ/環境を使用してください。`/usr/bin/npm` は、ホスト上で root 所有のグローバルプレフィックスを所有しているシステム npm に置き換えてください。

```bash
openclaw gateway stop
sudo /usr/bin/npm i -g openclaw@latest
openclaw gateway install --force
openclaw gateway restart
```

その後、検証します。

```bash
openclaw --version
curl -fsS http://127.0.0.1:18789/readyz
openclaw plugins list --json
openclaw gateway status --deep --json
openclaw doctor --lint --json
```

`openclaw update` がグローバル npm インストールを管理する場合、まず対象を一時 npm プレフィックスにインストールし、パッケージ化された `dist` インベントリを検証してから、クリーンなパッケージツリーを実際のグローバルプレフィックスへ差し替えます。これにより、npm が古いパッケージの残存ファイル上に新しいパッケージを重ねることを避けます。インストールコマンドが失敗した場合、OpenClaw は `--omit=optional` を付けて一度だけ再試行します。これはネイティブの任意依存関係をコンパイルできないホストで役立ちます。

OpenClaw 管理の npm update および plugin-update コマンドは、子 npm プロセスに対して npm の `min-release-age` サプライチェーン隔離 (または古い `before` 設定キー) もクリアします。このポリシーは一般的な保護のために存在しますが、明示的な OpenClaw 更新は「選択されたリリースを今インストールする」ことを意味します。

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

### 高度な npm インストールのトピック

<AccordionGroup>
  <Accordion title="読み取り専用パッケージツリー">
    OpenClaw は、グローバルパッケージディレクトリが現在のユーザーにより書き込み可能であっても、パッケージ化されたグローバルインストールを実行時には読み取り専用として扱います。Plugin パッケージインストールは、ユーザー設定ディレクトリ配下の OpenClaw 所有の npm/git ルートに配置され、Gateway 起動時に OpenClaw パッケージツリーを変更することはありません。

    一部の Linux npm セットアップでは、グローバルパッケージを `/usr/lib/node_modules/openclaw` など root 所有のディレクトリ配下にインストールします。OpenClaw はそのレイアウトをサポートします。Plugin のインストール/更新コマンドは、そのグローバルパッケージディレクトリの外側に書き込むためです。

  </Accordion>
  <Accordion title="強化された systemd ユニット">
    OpenClaw に設定/状態ルートへの書き込みアクセスを付与し、明示的な Plugin インストール、Plugin 更新、doctor クリーンアップが変更を永続化できるようにします。

    ```ini
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

  </Accordion>
  <Accordion title="ディスク容量の事前確認">
    パッケージ更新と明示的な Plugin インストールの前に、OpenClaw は対象ボリュームに対してベストエフォートのディスク容量チェックを試みます。空き容量が少ない場合は、確認したパスを含む警告が出ますが、更新はブロックされません。ファイルシステムのクォータ、スナップショット、ネットワークボリュームはチェック後に変わる可能性があるためです。実際のパッケージマネージャーによるインストールとインストール後の検証が、引き続き信頼できる判断基準です。
  </Accordion>
</AccordionGroup>

## 自動アップデーター

デフォルトではオフです。`~/.openclaw/openclaw.json` で有効化します。

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

| チャネル          | 動作                                                                                                                                          |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `stable`          | `stableDelayHours` (デフォルト: 6) 待機してから、分散ロールアウトのために `stableJitterHours` (デフォルト: 12) にわたる決定論的ジッターで適用します。 |
| `extended-stable` | 起動時チェックや自動適用はありません。`openclaw update` または `openclaw update status` を手動で使用します。                                  |
| `beta`            | `betaCheckIntervalHours` (デフォルト: 1) ごとに確認し、即座に適用します。                                                                      |
| `dev`             | 自動適用はありません。`openclaw update` を手動で使用します。                                                                                  |

gateway は起動時にも更新ヒントをログに出力します (`update.checkOnStart: false` で無効化できます)。保存済みの extended-stable 選択は、起動時解決とバックグラウンド解決を完全にスキップします。ダウングレードまたはインシデント復旧では、gateway 環境に `OPENCLAW_NO_AUTO_UPDATE=1` を設定すると、`update.auto.enabled` が設定されていても自動適用をブロックできます。`update.checkOnStart` も無効化されていない限り、起動時の更新ヒントは引き続き実行される場合があります。

ライブ Gateway コントロールプレーン (`update.run`) を通じて要求されたパッケージマネージャー更新は、実行中の Gateway プロセス内のパッケージツリーを置き換えません。管理対象サービスのインストールでは、Gateway は切り離された引き継ぎを開始して終了し、通常の `openclaw update --yes --json` CLI パスに、サービス停止、パッケージ置き換え、サービスメタデータ更新、再起動、Gateway バージョンと到達性の検証、可能な場合はインストール済みだが未ロードの macOS LaunchAgent の復旧を任せます。Gateway がその引き継ぎを安全に行えない場合、`update.run` はパッケージマネージャーをプロセス内で実行する代わりに、安全なシェルコマンドを報告します。

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
- ソースチェックアウト上の `openclaw update --channel dev` では、必要に応じてアップデーターが `pnpm` を自動でブートストラップします。pnpm/corepack のブートストラップエラーが表示された場合は、`pnpm` を手動でインストールする (または `corepack` を再度有効化する) してから、更新を再実行してください。
- 確認: [トラブルシューティング](/ja-JP/gateway/troubleshooting)
- Discord で質問する: [https://discord.gg/clawd](https://discord.gg/clawd)

## 関連

- [インストール概要](/ja-JP/install): すべてのインストール方法。
- [Doctor](/ja-JP/gateway/doctor): 更新後の健全性チェック。
- [移行](/ja-JP/install/migrating): メジャーバージョン移行ガイド。
