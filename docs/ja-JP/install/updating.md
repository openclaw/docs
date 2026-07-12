---
read_when:
    - OpenClaw の更新
    - アップデート後に問題が発生する
summary: OpenClaw を安全に更新する（グローバルインストールまたはソースからのインストール）方法とロールバック戦略
title: 更新中
x-i18n:
    generated_at: "2026-07-11T22:21:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 06b475fcd715afa5f4b9fa3fc7d546ba8dc53805c6a29e12fd4706dceb04cb60
    source_path: install/updating.md
    workflow: 16
---

OpenClaw を最新の状態に保ちます。

Docker、Podman、Kubernetes のイメージを置き換える場合は、
[コンテナイメージのアップグレード](/ja-JP/install/docker#upgrading-container-images)を参照してください。Gateway は準備完了になる前に、起動時に安全に実行できるアップグレード処理を行い、マウントされた状態に手動修復が必要な場合は終了します。

## 推奨: `openclaw update`

インストール形式（npm または git）を検出し、最新バージョンを取得して `openclaw doctor` を実行し、Gateway を再起動します。

```bash
openclaw update
```

チャンネルを切り替えるか、特定のバージョンを指定します。

```bash
openclaw update --channel beta
openclaw update --channel extended-stable
openclaw update --channel dev
openclaw update --dry-run   # 適用せずにプレビュー
```

`openclaw update` には `--verbose` フラグがありません（インストーラーにはあります）。診断には、予定されている処理をプレビューする `--dry-run`、構造化された結果を得る `--json`、またはチャンネルと利用可能状況を確認する `openclaw update status --json` を使用します。

`--channel beta` は beta の npm dist-tag を優先しますが、beta タグが存在しない場合や、そのバージョンが最新の安定版リリースより古い場合は stable/latest にフォールバックします。生の npm beta dist-tag に固定した一度限りのパッケージ更新には、代わりに `--tag beta` を使用します。

`--channel extended-stable` はパッケージ専用であり、インストールは引き続きフォアグラウンドでのみ実行されます。OpenClaw は公開 npm の `extended-stable` セレクターを読み取り、選択された正確なパッケージを検証して、そのバージョンを厳密にインストールします。レジストリーデータが欠落しているか整合しない場合は安全側で失敗し、`latest` には決してフォールバックしません。選択されたバージョンがインストール済みバージョンより古い場合は、通常のダウングレード確認が引き続き適用されます。CLI はコアの更新が成功した後にチャンネルを保存しますが、`npm install -g openclaw@extended-stable` を直接実行しても `update.channel` は更新されません。
コアの入れ替え後、指定が未設定/デフォルトまたは `latest` である対象の公式 npm Plugin は、そのコアとまったく同じバージョンに収束します。正確なバージョン固定、`latest` 以外の明示的なタグ、サードパーティー製 Plugin、npm 以外のソースは変更されません。現在の OpenClaw バージョンで作成されたカタログインストールは、そのデフォルトの指定を保持します。正確なバージョンしか含まない古い記録は、OpenClaw が以前の自動固定とユーザーによる固定を安全に区別できないため、固定されたままになります。extended-stable チャンネルで `openclaw plugins update @openclaw/name` を一度実行すると、その Plugin をコアの正確なバージョンへの追従に戻せます。

`--channel dev` は、継続的に更新される GitHub `main` のチェックアウトを永続的に使用します。一度限りのパッケージ更新では、`--tag main` が `github:openclaw/openclaw#main` パッケージ指定に対応し、対象のパッケージマネージャー（npm/pnpm/bun）を通じて直接インストールします。

管理対象の Plugin では、beta リリースが存在しなくても失敗ではなく警告になります。Plugin が記録済みのデフォルト/latest リリースにフォールバックしても、コアの更新は成功できます。

チャンネルの意味については、[リリースチャンネル](/ja-JP/install/development-channels)を参照してください。

## npm インストールと git インストールを切り替える

インストール形式を変更するにはチャンネルを使用します。アップデーターは `~/.openclaw` 内の状態、設定、認証情報、ワークスペースを保持し、CLI と Gateway が使用する OpenClaw コードのインストールだけを変更します。

```bash
# npm パッケージインストール -> 編集可能な git チェックアウト
openclaw update --channel dev

# git チェックアウト -> npm パッケージインストール
openclaw update --channel stable
```

まずインストールモードの切り替えをプレビューします。

```bash
openclaw update --channel dev --dry-run
openclaw update --channel stable --dry-run
```

`dev` は git チェックアウトを確保してビルドし、そのチェックアウトからグローバル CLI をインストールします。`stable`、`extended-stable`、`beta` チャンネルはパッケージインストールを使用します。git チェックアウトで extended-stable を指定すると、変更や変換を行わずに拒否されます。Gateway がすでにインストールされている場合、`--no-restart` を渡さない限り、`openclaw update` はサービスのメタデータを更新して再起動します。

管理対象の Gateway サービスを伴うパッケージインストールでは、`openclaw update` はそのサービスが使用するパッケージルートを対象にします。シェルの `openclaw` コマンドが別のインストールから提供されている場合、アップデーターは両方のルートと管理対象サービスの Node パスを表示し、パッケージを置き換える前に、その Node バージョンが対象リリースの `engines.node` 要件を満たすか確認します。

## 代替方法: インストーラーを再実行する

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

オンボーディングを省略するには `--no-onboard` を追加します。特定のインストール形式を強制するには、`--install-method git --no-onboard` または `--install-method npm --no-onboard` を渡します。

npm パッケージのインストール段階後に `openclaw update` が失敗した場合は、代わりにインストーラーを再実行します。インストーラーはアップデーターを呼び出さず、グローバルパッケージのインストールを直接実行するため、部分的に更新された npm インストールを復旧できます。

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
```

復旧を特定のバージョンまたは dist-tag に固定するには、`--version` を使用します。

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm --version <version-or-dist-tag>
```

## 代替方法: npm、pnpm、または bun を手動で使用する

```bash
npm i -g openclaw@latest
```

監視管理されたインストールでは `openclaw update` を推奨します。実行中の Gateway サービスとパッケージの入れ替えを連携できるためです。監視管理されたインストールを手動で更新する場合は、最初に管理対象の Gateway を停止します。パッケージマネージャーはファイルをその場で置き換えるため、Gateway が実行中だと、入れ替えの途中でコアまたは Plugin のファイルを読み込もうとする可能性があります。パッケージマネージャーの処理完了後に Gateway を再起動し、新しいインストールを読み込ませます。

root 所有の Linux システム全体へのグローバルインストールで `openclaw update` が `EACCES` により失敗した場合は、手動で置き換える間 Gateway を停止したまま、システムの npm を使用して復旧します。その Gateway で通常使用しているものと同じプロファイルフラグ/環境を使用してください。`/usr/bin/npm` は、ホスト上で root 所有のグローバルプレフィックスを所有するシステム npm に置き換えてください。

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

`openclaw update` がグローバル npm インストールを管理する場合、まず対象を一時的な npm プレフィックスにインストールし、パッケージ化された `dist` の構成を検証してから、クリーンなパッケージツリーを実際のグローバルプレフィックスに入れ替えます。これにより、npm が古いパッケージの残存ファイルに新しいパッケージを重ね書きすることを防ぎます。インストールコマンドが失敗した場合、OpenClaw は `--omit=optional` を付けて一度再試行します。これは、ネイティブのオプション依存関係をコンパイルできないホストで役立ちます。

OpenClaw が管理する npm 更新コマンドと Plugin 更新コマンドは、子 npm プロセスに対して npm の `min-release-age` サプライチェーン隔離（または旧 `before` 設定キー）も解除します。このポリシーは一般的な保護のために存在しますが、OpenClaw の明示的な更新は「選択したリリースを今すぐインストールする」ことを意味します。

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

### npm インストールの高度なトピック

<AccordionGroup>
  <Accordion title="読み取り専用のパッケージツリー">
    現在のユーザーがグローバルパッケージディレクトリに書き込める場合でも、OpenClaw はパッケージ化されたグローバルインストールを実行時に読み取り専用として扱います。Plugin パッケージのインストール先は、ユーザー設定ディレクトリ配下にある OpenClaw 所有の npm/git ルートであり、Gateway の起動時に OpenClaw のパッケージツリーが変更されることはありません。

    一部の Linux npm 環境では、グローバルパッケージが `/usr/lib/node_modules/openclaw` などの root 所有ディレクトリにインストールされます。Plugin のインストール/更新コマンドはそのグローバルパッケージディレクトリの外部に書き込むため、OpenClaw はこの構成をサポートします。

  </Accordion>
  <Accordion title="強化された systemd ユニット">
    明示的な Plugin のインストール、Plugin の更新、doctor によるクリーンアップで変更を永続化できるよう、OpenClaw に設定/状態ルートへの書き込みアクセス権を付与します。

    ```ini
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

  </Accordion>
  <Accordion title="ディスク容量の事前確認">
    パッケージ更新と明示的な Plugin インストールの前に、OpenClaw は対象ボリュームのディスク容量を可能な範囲で確認します。容量が少ない場合は確認対象のパスを含む警告が表示されますが、ファイルシステムのクォータ、スナップショット、ネットワークボリュームは確認後に変化する可能性があるため、更新はブロックされません。実際のパッケージマネージャーによるインストールとインストール後の検証が、引き続き最終的な判断基準です。
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

| チャンネル        | 動作                                                                                                                                                       |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `stable`          | `stableDelayHours`（デフォルト: 6）待機し、その後 `stableJitterHours`（デフォルト: 12）の範囲で決定論的なジッターを適用して、段階的に展開します。          |
| `extended-stable` | `checkOnStart` が有効な場合、起動時および24時間ごとに読み取り専用の更新通知を確認します。自動適用は決して行いません。                                     |
| `beta`            | `betaCheckIntervalHours`（デフォルト: 1）ごとに確認し、即座に適用します。                                                                                  |
| `dev`             | 自動適用しません。`openclaw update` を手動で使用します。                                                                                                   |

Gateway は起動時にも更新通知をログに記録します（`update.checkOnStart: false` で無効化できます）。保存された extended-stable の選択では、この読み取り専用の通知経路と既存の24時間ごとの通知間隔を使用しますが、自動インストール、引き継ぎ、再起動、stable の遅延/ジッター、beta のポーリングは決して実行しません。ダウングレードやインシデント復旧時には、Gateway 環境で `OPENCLAW_NO_AUTO_UPDATE=1` を設定すると、`update.auto.enabled` が設定されていても自動適用をブロックできます。`update.checkOnStart` も無効にしない限り、起動時の更新通知は引き続き実行される場合があります。

稼働中の Gateway コントロールプレーン（`update.run`）を通じて要求されたパッケージマネージャー更新では、実行中の Gateway プロセス内のパッケージツリーを置き換えません。管理対象サービスのインストールでは、Gateway が切り離された引き継ぎ処理を開始して終了し、通常の `openclaw update --yes --json` CLI 経路にサービスの停止、パッケージの置き換え、サービスメタデータの更新、再起動、Gateway のバージョンと到達可能性の検証、および可能な場合はインストール済みだが読み込まれていない macOS LaunchAgent の復旧を行わせます。Gateway がその引き継ぎを安全に実行できない場合、`update.run` はプロセス内でパッケージマネージャーを実行する代わりに、安全なシェルコマンドを報告します。

Control UI サイドバーの更新カードは、同じ `update.run` フローを開始します。署名済み macOS アプリでは、カードが最初に Sparkle を通じてアプリを更新します。再起動後、アプリは管理対象のローカル Gateway を対応するバージョンに更新します。

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

- `openclaw doctor` をもう一度実行し、出力を注意深く確認します。
- ソースチェックアウトで `openclaw update --channel dev` を実行する場合、アップデーターは必要に応じて `pnpm` を自動的にブートストラップします。pnpm/corepack のブートストラップエラーが表示された場合は、`pnpm` を手動でインストールする（または `corepack` を再度有効にする）してから、更新を再実行します。
- 確認: [トラブルシューティング](/ja-JP/gateway/troubleshooting)
- Discord で質問: [https://discord.gg/clawd](https://discord.gg/clawd)

## 関連項目

- [インストールの概要](/ja-JP/install): すべてのインストール方法。
- [Doctor](/ja-JP/gateway/doctor): 更新後の健全性チェック。
- [移行](/ja-JP/install/migrating): メジャーバージョンの移行ガイド。
