---
read_when:
    - OpenClaw の更新
    - アップデート後に問題が発生する
summary: OpenClaw を安全に更新する（グローバルインストールまたはソース）方法とロールバック戦略
title: 更新中
x-i18n:
    generated_at: "2026-07-12T14:39:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 06b475fcd715afa5f4b9fa3fc7d546ba8dc53805c6a29e12fd4706dceb04cb60
    source_path: install/updating.md
    workflow: 16
---

OpenClaw を最新の状態に保ちます。

Docker、Podman、Kubernetes のイメージを置き換える場合は、
[コンテナイメージのアップグレード](/ja-JP/install/docker#upgrading-container-images)を参照してください。Gateway は
準備完了になる前に起動時に安全なアップグレード処理を実行し、マウントされた
状態に手動修復が必要な場合は終了します。

## 推奨: `openclaw update`

インストール種別（npm または git）を検出し、最新バージョンを取得して `openclaw doctor` を実行し、Gateway を再起動します。

```bash
openclaw update
```

チャネルを切り替えるか、特定のバージョンを指定します。

```bash
openclaw update --channel beta
openclaw update --channel extended-stable
openclaw update --channel dev
openclaw update --dry-run   # 適用せずにプレビュー
```

`openclaw update` には `--verbose` フラグがありません（インストーラーにはあります）。診断には、
計画されたアクションをプレビューする `--dry-run`、構造化された結果を取得する `--json`、または
チャネルと利用可能状態を確認する `openclaw update status --json` を使用してください。

`--channel beta` は beta npm dist-tag を優先しますが、beta タグが存在しない場合や、
そのバージョンが最新の stable リリースより古い場合は stable/latest に
フォールバックします。raw npm beta dist-tag に固定した一度限りのパッケージ更新には、
代わりに `--tag beta` を使用してください。

`--channel extended-stable` はパッケージ専用であり、インストールは
フォアグラウンドでのみ実行されます。OpenClaw は公開 npm の `extended-stable` セレクターを読み取り、
選択された正確なパッケージを検証し、その正確なバージョンをインストールします。レジストリデータが
欠落または不整合の場合は安全側で失敗し、`latest` には決してフォールバックしません。
選択されたバージョンがインストール済みバージョンより古い場合は、通常の
ダウングレード確認が引き続き適用されます。CLI はコア更新の成功後に
チャネルを永続化しますが、直接実行した `npm install -g openclaw@extended-stable` は
`update.channel` を更新しません。
コアの入れ替え後、bare/default または `latest` を意図する対象の公式 npm Plugin は、
その正確なコアバージョンに収束します。正確な固定バージョンと明示的な
`latest` 以外のタグ、サードパーティ Plugin、npm 以外のソースは変更されません。
現在の OpenClaw バージョンによって作成されたカタログインストールは、そのデフォルトの
意図を保持します。正確なバージョンのみを含む古いレコードは固定されたままになります。
これは、OpenClaw が古い自動固定とユーザーによる固定を安全に区別できないためです。
extended-stable チャネルで `openclaw plugins update @openclaw/name` を一度実行すると、
その Plugin を正確なコアバージョンの追跡に戻せます。

`--channel dev` は、継続的に更新される GitHub `main` チェックアウトを永続的に使用します。一度限りの
パッケージ更新では、`--tag main` が `github:openclaw/openclaw#main` パッケージ
指定に対応し、対象のパッケージマネージャー（npm/pnpm/bun）を通じて直接インストールします。

管理対象 Plugin では、beta リリースが存在しなくても失敗ではなく警告になります。
Plugin が記録済みの default/latest リリースにフォールバックしても、
コア更新は成功できます。

チャネルのセマンティクスについては、[リリースチャネル](/ja-JP/install/development-channels)を参照してください。

## npm インストールと git インストールを切り替える

インストール種別を変更するにはチャネルを使用します。アップデーターは、
`~/.openclaw` にある状態、設定、認証情報、ワークスペースを維持します。変更されるのは、
CLI と Gateway が使用する OpenClaw コードのインストールだけです。

```bash
# npm パッケージのインストール -> 編集可能な git チェックアウト
openclaw update --channel dev

# git チェックアウト -> npm パッケージのインストール
openclaw update --channel stable
```

最初にインストールモードの切り替えをプレビューします。

```bash
openclaw update --channel dev --dry-run
openclaw update --channel stable --dry-run
```

`dev` は git チェックアウトを確保してビルドし、そのチェックアウトから
グローバル CLI をインストールします。`stable`、`extended-stable`、`beta` チャネルは
パッケージインストールを使用します。git チェックアウトで extended-stable を指定すると、
変更や変換を行わずに拒否されます。Gateway がすでにインストールされている場合、
`--no-restart` を渡さない限り、`openclaw update` はサービスメタデータを更新して再起動します。

管理対象 Gateway サービスを伴うパッケージインストールでは、`openclaw update` は
そのサービスが使用するパッケージルートを対象にします。シェルの `openclaw` コマンドが
別のインストールから提供されている場合、アップデーターは両方のルートと管理対象
サービスの Node パスを表示し、パッケージを置き換える前に、その Node バージョンが対象リリースの
`engines.node` 要件を満たしているか確認します。

## 代替方法: インストーラーを再実行する

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

オンボーディングをスキップするには `--no-onboard` を追加します。特定のインストール種別を強制するには、
`--install-method git --no-onboard` または `--install-method npm --no-onboard` を渡します。

npm パッケージのインストールフェーズ後に `openclaw update` が失敗した場合は、
代わりにインストーラーを再実行してください。インストーラーはアップデーターを呼び出さず、
グローバルパッケージのインストールを直接実行するため、部分的に更新された npm インストールを復旧できます。

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
```

`--version` を使用して、復旧を特定のバージョンまたは dist-tag に固定します。

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm --version <version-or-dist-tag>
```

## 代替方法: npm、pnpm、bun を手動で使用する

```bash
npm i -g openclaw@latest
```

監視管理されたインストールでは `openclaw update` を推奨します。実行中の Gateway サービスと
パッケージの入れ替えを調整できるためです。監視管理されたインストールを手動で更新する場合は、
最初に管理対象 Gateway を停止してください。パッケージマネージャーはファイルをその場で置き換えるため、
実行中の Gateway が入れ替え途中のコアまたは Plugin ファイルを読み込もうとする可能性があります。
パッケージマネージャーの完了後に Gateway を再起動し、新しいインストールを認識させてください。

root 所有の Linux システム全体のグローバルインストールで、`openclaw update` が
`EACCES` により失敗した場合は、手動置換の間 Gateway を停止したまま、
システムの npm を使用して復旧してください。その Gateway で通常使用するものと同じ
プロファイルフラグや環境を使用してください。`/usr/bin/npm` は、ホスト上で
root 所有のグローバルプレフィックスを所有するシステム npm に置き換えてください。

```bash
openclaw gateway stop
sudo /usr/bin/npm i -g openclaw@latest
openclaw gateway install --force
openclaw gateway restart
```

その後、確認します。

```bash
openclaw --version
curl -fsS http://127.0.0.1:18789/readyz
openclaw plugins list --json
openclaw gateway status --deep --json
openclaw doctor --lint --json
```

`openclaw update` がグローバル npm インストールを管理する場合、最初に対象を
一時的な npm プレフィックスにインストールし、パッケージ化された `dist` インベントリを検証してから、
クリーンなパッケージツリーを実際のグローバルプレフィックスに入れ替えます。これにより、npm が
新しいパッケージを古いパッケージの残存ファイルに重ねることを防ぎます。インストール
コマンドが失敗した場合、OpenClaw は `--omit=optional` を付けて一度再試行します。これは、
ネイティブのオプション依存関係をコンパイルできないホストで役立ちます。

OpenClaw が管理する npm の更新コマンドと Plugin 更新コマンドは、子 npm プロセスに対して、
npm の `min-release-age` サプライチェーン隔離（または旧式の `before` 設定キー）も解除します。
このポリシーは一般的な保護のために存在しますが、明示的な OpenClaw 更新は
「選択したリリースを今すぐインストールする」ことを意味します。

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

### npm インストールの高度なトピック

<AccordionGroup>
  <Accordion title="読み取り専用パッケージツリー">
    OpenClaw は、グローバルパッケージディレクトリに現在のユーザーが書き込める場合でも、パッケージ化されたグローバルインストールを実行時には読み取り専用として扱います。Plugin パッケージのインストール先は、ユーザー設定ディレクトリ配下にある OpenClaw 所有の npm/git ルートであり、Gateway の起動時に OpenClaw パッケージツリーが変更されることはありません。

    一部の Linux npm 構成では、グローバルパッケージが `/usr/lib/node_modules/openclaw` などの root 所有ディレクトリにインストールされます。Plugin のインストールおよび更新コマンドはそのグローバルパッケージディレクトリ外に書き込むため、OpenClaw はこのレイアウトをサポートします。

  </Accordion>
  <Accordion title="強化された systemd ユニット">
    明示的な Plugin のインストール、Plugin の更新、doctor のクリーンアップで変更を永続化できるように、OpenClaw に設定および状態ルートへの書き込みアクセスを付与します。

    ```ini
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

  </Accordion>
  <Accordion title="ディスク容量の事前チェック">
    パッケージ更新および明示的な Plugin のインストール前に、OpenClaw は対象ボリュームのディスク容量をベストエフォートで確認します。容量が少ない場合は確認対象のパスを含む警告が表示されますが、ファイルシステムのクォータ、スナップショット、ネットワークボリュームは確認後に変化する可能性があるため、更新はブロックされません。実際のパッケージマネージャーによるインストールとインストール後の検証が引き続き最終的な判断基準になります。
  </Accordion>
</AccordionGroup>

## 自動アップデーター

デフォルトでは無効です。`~/.openclaw/openclaw.json` で有効にします。

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

| チャネル          | 動作                                                                                                                                                              |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `stable`          | `stableDelayHours`（デフォルト: 6）だけ待機してから、段階的なロールアウトのため `stableJitterHours`（デフォルト: 12）の範囲で決定論的なジッターを加えて適用します。 |
| `extended-stable` | `checkOnStart` が有効な場合、起動時および 24 時間ごとに読み取り専用の更新通知を確認します。自動では決して適用しません。                                            |
| `beta`            | `betaCheckIntervalHours`（デフォルト: 1）ごとに確認し、直ちに適用します。                                                                                           |
| `dev`             | 自動適用しません。`openclaw update` を手動で使用してください。                                                                                                    |

Gateway は起動時にも更新通知をログに記録します（無効にするには
`update.checkOnStart: false` を指定します）。保存された extended-stable の選択では、この
読み取り専用の通知パスと既存の 24 時間の通知間隔が使用されますが、
自動インストール、引き継ぎ、再起動、stable の遅延やジッター、beta のポーリングは
決して実行されません。ダウングレードやインシデント復旧では、Gateway の環境に
`OPENCLAW_NO_AUTO_UPDATE=1` を設定すると、`update.auto.enabled` が構成されていても自動適用をブロックできます。
`update.checkOnStart` も無効にしない限り、起動時の更新通知は引き続き実行される場合があります。

稼働中の Gateway コントロールプレーン（`update.run`）を介して要求された
パッケージマネージャーの更新では、実行中の Gateway プロセス内のパッケージツリーは
置き換えられません。管理対象サービスのインストールでは、Gateway は切り離された引き継ぎ処理を開始して
終了し、通常の `openclaw update --yes --json` CLI パスにサービスの停止、
パッケージの置換、サービスメタデータの更新、再起動、Gateway のバージョンと
到達可能性の検証、および可能な場合はインストール済みだが読み込まれていない macOS
LaunchAgent の復旧を実行させます。Gateway がその引き継ぎを安全に実行できない場合、
`update.run` はパッケージマネージャーをプロセス内で実行せず、安全なシェルコマンドを報告します。

Control UI のサイドバーにある更新カードは、同じ `update.run` フローを開始します。
署名済み macOS アプリでは、カードがまず Sparkle を通じてアプリを更新します。再起動後、
アプリは管理対象のローカル Gateway を一致するバージョンに更新します。

## 更新後

<Steps>

### doctor を実行する

```bash
openclaw doctor
```

設定を移行し、DM ポリシーを監査して、Gateway の正常性を確認します。詳細: [Doctor](/ja-JP/gateway/doctor)

### Gateway を再起動する

```bash
openclaw gateway restart
```

### 確認する

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

最新に戻すには、`git checkout main && git pull` を実行します。

## 問題が解決しない場合

- `openclaw doctor` を再度実行し、出力を注意深く確認してください。
- ソースチェックアウトでの `openclaw update --channel dev` では、必要に応じてアップデーターが `pnpm` を自動的にブートストラップします。pnpm/corepack のブートストラップエラーが表示された場合は、`pnpm` を手動でインストール（または `corepack` を再度有効化）して、更新を再実行してください。
- 確認: [トラブルシューティング](/ja-JP/gateway/troubleshooting)
- Discord で質問: [https://discord.gg/clawd](https://discord.gg/clawd)

## 関連項目

- [インストール概要](/ja-JP/install): すべてのインストール方法。
- [Doctor](/ja-JP/gateway/doctor): 更新後の健全性チェック。
- [移行](/ja-JP/install/migrating): メジャーバージョンの移行ガイド。
