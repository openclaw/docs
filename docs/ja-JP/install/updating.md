---
read_when:
    - OpenClaw の更新
    - 更新後に問題が発生する
summary: OpenClaw を安全に更新する（グローバルインストールまたはソース）とロールバック戦略
title: 更新
x-i18n:
    generated_at: "2026-07-05T11:33:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4bdb63535a855e699ab95150fda40dd184036861ec449b6a8b386ae0e228af04
    source_path: install/updating.md
    workflow: 16
---

OpenClaw を最新に保ちます。

## 推奨: `openclaw update`

インストール種別 (npm または git) を検出し、最新バージョンを取得し、`openclaw doctor` を実行して Gateway を再起動します。

```bash
openclaw update
```

チャンネルを切り替えるか、特定のバージョンを指定します。

```bash
openclaw update --channel beta
openclaw update --channel extended-stable
openclaw update --channel dev
openclaw update --dry-run   # preview without applying
```

`openclaw update` には `--verbose` フラグはありません (インストーラーにはあります)。診断には、計画されたアクションをプレビューする
`--dry-run`、構造化された結果を得る `--json`、またはチャンネルと利用可能状態を確認する
`openclaw update status --json` を使用してください。

`--channel beta` は beta npm dist-tag を優先しますが、beta タグが存在しない場合や、そのバージョンが最新の安定版
リリースより古い場合は stable/latest にフォールバックします。代わりに、生の npm
beta dist-tag に固定した 1 回限りのパッケージ更新には `--tag beta` を使用してください。

`--channel extended-stable` はパッケージ専用かつフォアグラウンド専用です。OpenClaw は公開 npm の `extended-stable` セレクターを読み取り、選択された正確なパッケージを検証し、その正確なバージョンをインストールします。レジストリデータが欠落または不整合の場合は安全側に倒して失敗し、`latest` にフォールバックすることはありません。選択されたバージョンがインストール済みバージョンより古い場合は、通常のダウングレード確認が引き続き適用されます。

`--channel dev` は、継続的に移動する GitHub `main` チェックアウトを永続的に使用します。1 回限りの
パッケージ更新では、`--tag main` は `github:openclaw/openclaw#main` パッケージ
指定にマップされ、対象のパッケージマネージャー (npm/pnpm/bun) を通じて直接インストールされます。

管理対象 Plugin では、beta リリースがないことは失敗ではなく警告です。Plugin が記録済みの
default/latest リリースにフォールバックしても、core 更新は成功できます。

チャンネルの意味については [リリースチャンネル](/ja-JP/install/development-channels) を参照してください。

## npm と git インストールを切り替える

インストール種別を変更するにはチャンネルを使用します。アップデーターは `~/.openclaw` 内の状態、設定、
認証情報、ワークスペースを保持し、CLI と Gateway が使用する OpenClaw コードインストールだけを変更します。

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

`dev` は git チェックアウトを確保し、それをビルドし、そのチェックアウトからグローバル CLI をインストールします。
`stable`、`extended-stable`、`beta` チャンネルはパッケージインストールを使用します。Extended-stable は git チェックアウト上では、変更や変換を行わずに拒否されます。Gateway がすでにインストールされている場合、`openclaw update` はサービスメタデータを更新し、`--no-restart` を渡さない限り再起動します。

管理対象 Gateway サービス付きのパッケージインストールでは、`openclaw update` はそのサービスが使用する
パッケージルートを対象にします。シェルの `openclaw` コマンドが別のインストールに由来する場合、
アップデーターは両方のルートと管理対象サービスの Node パスを表示し、パッケージを置き換える前に、その Node バージョンを対象リリースの
`engines.node` 要件と照合します。

## 代替: インストーラーを再実行する

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

オンボーディングをスキップするには `--no-onboard` を追加します。特定のインストール種別を強制するには、
`--install-method git --no-onboard` または `--install-method npm --no-onboard` を渡します。

npm パッケージインストール段階の後に `openclaw update` が失敗した場合は、代わりにインストーラーを再実行してください。
これはアップデーターを呼び出しません。グローバルパッケージインストールを直接実行し、部分的に更新された npm インストールを復旧できます。

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
```

`--version` で復旧を特定のバージョンまたは dist-tag に固定します。

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm --version <version-or-dist-tag>
```

## 代替: 手動 npm、pnpm、または bun

```bash
npm i -g openclaw@latest
```

監督付きインストールでは `openclaw update` を優先してください。実行中の Gateway サービスとパッケージ
交換を調整できます。監督付きインストールで手動更新する場合は、まず管理対象 Gateway を停止してください。パッケージマネージャーはファイルをその場で置き換えるため、実行中の Gateway が交換中に core または Plugin ファイルを読み込もうとする可能性があります。パッケージマネージャーの完了後に Gateway を再起動し、新しいインストールを読み込ませます。

root 所有の Linux システムグローバルインストールで、`openclaw update` が
`EACCES` で失敗する場合は、手動置換の間 Gateway を停止したまま、システム npm で復旧してください。
その Gateway に通常使用しているものと同じプロファイルフラグ/環境を使用します。`/usr/bin/npm` は、ホスト上の
root 所有グローバルプレフィックスを所有するシステム npm に置き換えてください。

```bash
openclaw gateway stop
sudo /usr/bin/npm i -g openclaw@latest
openclaw gateway install --force
openclaw gateway restart
```

次に検証します。

```bash
openclaw --version
curl -fsS http://127.0.0.1:18789/readyz
openclaw plugins list --json
openclaw gateway status --deep --json
openclaw doctor --lint --json
```

`openclaw update` がグローバル npm インストールを管理する場合、まず対象を一時 npm プレフィックスに
インストールし、パッケージ化された `dist` インベントリを検証してから、クリーンなパッケージツリーを実際のグローバルプレフィックスへ
交換します。これにより、npm が古いパッケージの残存ファイルの上に新しいパッケージを重ねることを避けます。インストール
コマンドが失敗した場合、OpenClaw は `--omit=optional` 付きで 1 回再試行します。これはネイティブの任意依存関係をコンパイルできないホストで役立ちます。

OpenClaw 管理の npm 更新コマンドと Plugin 更新コマンドは、子 npm プロセスについて npm の
`min-release-age` サプライチェーン隔離 (または古い `before` 設定キー) も解除します。このポリシーは一般的な保護のために存在しますが、明示的な OpenClaw 更新は「選択されたリリースを今インストールする」ことを意味します。

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

### 高度な npm インストールのトピック

<AccordionGroup>
  <Accordion title="読み取り専用パッケージツリー">
    OpenClaw は、グローバルパッケージディレクトリが現在のユーザーから書き込み可能な場合でも、実行時にはパッケージ化されたグローバルインストールを読み取り専用として扱います。Plugin パッケージインストールはユーザー設定ディレクトリ配下の OpenClaw 所有 npm/git ルートに配置され、Gateway 起動時に OpenClaw パッケージツリーを変更することはありません。

    一部の Linux npm セットアップでは、グローバルパッケージを `/usr/lib/node_modules/openclaw` のような root 所有ディレクトリ配下にインストールします。OpenClaw はこのレイアウトをサポートします。Plugin install/update コマンドはそのグローバルパッケージディレクトリの外側に書き込むためです。

  </Accordion>
  <Accordion title="強化された systemd ユニット">
    明示的な Plugin インストール、Plugin 更新、doctor クリーンアップが変更を永続化できるように、OpenClaw に config/state ルートへの書き込みアクセスを与えます。

    ```ini
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

  </Accordion>
  <Accordion title="ディスク容量の事前確認">
    パッケージ更新と明示的な Plugin インストールの前に、OpenClaw は対象ボリュームに対してベストエフォートのディスク容量チェックを試みます。容量不足の場合、確認したパスを含む警告が表示されますが、ファイルシステムクォータ、スナップショット、ネットワークボリュームはチェック後に変化する可能性があるため、更新はブロックされません。実際のパッケージマネージャーによるインストールとインストール後の検証が引き続き権威ある判断となります。
  </Accordion>
</AccordionGroup>

## 自動アップデーター

デフォルトではオフです。`~/.openclaw/openclaw.json` で有効にします。

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

| チャンネル        | 挙動                                                                                                                                         |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `stable`          | `stableDelayHours` (デフォルト: 6) 待機し、その後 `stableJitterHours` (デフォルト: 12) にわたる決定的ジッターで適用し、段階的なロールアウトを行います。 |
| `extended-stable` | 起動時チェックも自動適用もありません。`openclaw update` または `openclaw update status` を手動で使用します。                                 |
| `beta`            | `betaCheckIntervalHours` (デフォルト: 1) ごとにチェックし、すぐに適用します。                                                                  |
| `dev`             | 自動適用はありません。`openclaw update` を手動で使用します。                                                                                  |

Gateway は起動時にも更新ヒントをログに記録します (`update.checkOnStart: false` で無効化)。
保存済みの extended-stable 選択では、起動時およびバックグラウンドでの解決を完全にスキップします。
ダウングレードやインシデント復旧では、Gateway 環境で `OPENCLAW_NO_AUTO_UPDATE=1` を設定すると、`update.auto.enabled` が設定されていても自動適用をブロックできます。起動時の更新ヒントは、`update.checkOnStart` も無効化されていない限り引き続き実行できます。

ライブ Gateway control-plane (`update.run`) を通じて要求されたパッケージマネージャー更新は、実行中の Gateway
プロセス内のパッケージツリーを置き換えません。管理対象サービスインストールでは、Gateway が切り離されたハンドオフを開始して
終了し、通常の `openclaw update --yes --json` CLI パスにサービス停止、パッケージ置換、サービスメタデータ更新、再起動、Gateway バージョンと到達性の検証、可能な場合はインストール済みだが未ロードの macOS
LaunchAgent の復旧を任せます。Gateway がそのハンドオフを安全に行えない場合、`update.run` はパッケージ
マネージャーをインプロセスで実行せず、安全なシェルコマンドを報告します。

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
- ソースチェックアウト上の `openclaw update --channel dev` では、必要に応じてアップデーターが `pnpm` を自動ブートストラップします。pnpm/corepack ブートストラップエラーが表示された場合は、`pnpm` を手動でインストールする (または `corepack` を再度有効にする) してから更新を再実行してください。
- 確認: [トラブルシューティング](/ja-JP/gateway/troubleshooting)
- Discord で質問: [https://discord.gg/clawd](https://discord.gg/clawd)

## 関連

- [インストール概要](/ja-JP/install): すべてのインストール方法。
- [Doctor](/ja-JP/gateway/doctor): 更新後の健全性チェック。
- [移行](/ja-JP/install/migrating): メジャーバージョンの移行ガイド。
