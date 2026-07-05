---
read_when:
    - OpenClaw の更新
    - 更新後に何かが壊れる
summary: OpenClaw を安全に更新する（グローバルインストールまたはソース）方法とロールバック戦略
title: 更新
x-i18n:
    generated_at: "2026-07-05T01:56:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: aaab9de5c41b8a9ce087a182b9cabe34fbf2e6d14524b10248c5403a2644208a
    source_path: install/updating.md
    workflow: 16
---

OpenClaw を最新の状態に保ちます。

## 推奨: `openclaw update`

更新する最速の方法です。インストール種別（npm または git）を検出し、最新バージョンを取得し、`openclaw doctor` を実行して、Gateway を再起動します。

```bash
openclaw update
```

チャンネルを切り替える、または特定のバージョンを対象にするには:

```bash
openclaw update --channel beta
openclaw update --channel extended-stable
openclaw update --channel dev
openclaw update --dry-run   # 適用せずにプレビュー
```

`openclaw update` は `--verbose` を受け付けません。更新診断には、計画されたアクションをプレビューする `--dry-run`、構造化された結果を得る `--json`、またはチャンネルと利用可能状態を調べる `openclaw update status --json` を使用します。インストーラーには独自の `--verbose` フラグがありますが、そのフラグは `openclaw update` の一部ではありません。

`--channel beta` は beta を優先しますが、beta タグが存在しない、または最新の stable リリースより古い場合、ランタイムは stable/latest にフォールバックします。一度だけのパッケージ更新で生の npm beta dist-tag を使いたい場合は、`--tag beta` を使用します。

`--channel extended-stable` はパッケージ専用かつフォアグラウンド専用です。OpenClaw は公開 npm の `extended-stable` セレクターを読み取り、選択された正確なパッケージを検証し、その正確なバージョンをインストールします。レジストリデータが存在しない、または一貫していない場合は fail closed になり、`latest` にはフォールバックしません。選択されたバージョンがインストール済みバージョンより古い場合、通常のダウングレード確認が引き続き適用されます。

永続的に移動する GitHub `main` チェックアウトには `--channel dev` を使用します。パッケージ更新では、`--tag main` は 1 回の実行について `github:openclaw/openclaw#main` に対応し、GitHub/git ソース仕様は段階的な npm インストールの前に一時 tarball にパックされます。

管理対象 Plugin では、beta チャンネルのフォールバックは警告です。Plugin beta が利用できないため Plugin が記録済みの default/latest リリースを使っていても、core 更新は成功する場合があります。

チャンネルのセマンティクスについては、[開発チャンネル](/ja-JP/install/development-channels)を参照してください。

## npm と git インストールを切り替える

インストール種別を変更したい場合はチャンネルを使用します。アップデーターは `~/.openclaw` 内の状態、設定、認証情報、ワークスペースを保持します。変更するのは、CLI と Gateway が使用する OpenClaw コードのインストールだけです。

```bash
# npm パッケージインストール -> 編集可能な git チェックアウト
openclaw update --channel dev

# git チェックアウト -> npm パッケージインストール
openclaw update --channel stable
```

正確なインストールモード切り替えをプレビューするには、先に `--dry-run` で実行します。

```bash
openclaw update --channel dev --dry-run
openclaw update --channel stable --dry-run
```

`dev` チャンネルは git チェックアウトを確保し、それをビルドし、そのチェックアウトからグローバル CLI をインストールします。`stable`、`extended-stable`、`beta` チャンネルはパッケージインストールを使用します。Extended-stable は Git チェックアウト上では、変更や変換を行わずに拒否されます。Gateway がすでにインストールされている場合、`--no-restart` を渡さない限り、`openclaw update` はサービスメタデータを更新して再起動します。

管理対象 Gateway サービスを伴うパッケージインストールでは、`openclaw update` はそのサービスが使用するパッケージルートを対象にします。シェルの `openclaw` コマンドが別のインストールから来ている場合、アップデーターは両方のルートと管理対象サービスの Node パスを出力します。パッケージ更新はサービスルートを所有するパッケージマネージャーを使用し、パッケージを置き換える前に、対象リリースのエンジンに対して管理対象サービスの Node を確認します。

## 代替: インストーラーを再実行する

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

オンボーディングをスキップするには `--no-onboard` を追加します。インストーラー経由で特定のインストール種別を強制するには、`--install-method git --no-onboard` または `--install-method npm --no-onboard` を渡します。

npm パッケージインストール段階の後に `openclaw update` が失敗した場合は、インストーラーを再実行します。インストーラーは古いアップデーターを呼び出しません。グローバルパッケージインストールを直接実行し、部分的に更新された npm インストールを復旧できます。

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

監視対象インストールでは、実行中の Gateway サービスとパッケージ交換を調整できるため、`openclaw update` を推奨します。監視対象インストールで手動更新する場合は、パッケージマネージャーを開始する前に管理対象 Gateway を停止します。パッケージマネージャーはファイルをその場で置き換えるため、実行中の Gateway が、一時的に半分入れ替わったパッケージツリーから core または Plugin ファイルを読み込もうとする可能性があります。パッケージマネージャー完了後に Gateway を再起動し、サービスが新しいインストールを取得するようにします。

root 所有の Linux システムグローバルインストールで、`openclaw update` が `EACCES` で失敗し、システム npm で復旧する場合は、手動パッケージ置き換えの間 Gateway を停止したままにしてください。その Gateway で通常使用している同じ `openclaw` プロファイルフラグまたは環境を使用します。`/usr/bin/npm` は、ホスト上で root 所有のグローバルプレフィックスを所有するシステム npm に置き換えてください。

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

`openclaw update` がグローバル npm インストールを管理する場合、まず対象を一時 npm プレフィックスにインストールし、パッケージ化された `dist` インベントリを検証してから、クリーンなパッケージツリーを実際のグローバルプレフィックスに入れ替えます。これにより、npm が古いパッケージ由来の古いファイルの上に新しいパッケージを重ねることを避けられます。インストールコマンドが失敗した場合、OpenClaw は `--omit=optional` を付けて 1 回再試行します。この再試行は、ネイティブの任意依存関係をコンパイルできないホストで役立ちます。一方で、フォールバックも失敗した場合は元の失敗が見える状態を保ちます。

OpenClaw 管理の npm 更新コマンドと Plugin 更新コマンドは、子 npm プロセスについて npm の `min-release-age` 検疫も解除します。npm はそのポリシーを派生した `before` カットオフとして報告する場合があります。どちらも一般的なサプライチェーン検疫ポリシーには有用ですが、明示的な OpenClaw 更新は「選択された OpenClaw リリースを今インストールする」ことを意味します。

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

### 高度な npm インストールトピック

<AccordionGroup>
  <Accordion title="読み取り専用パッケージツリー">
    OpenClaw は、グローバルパッケージディレクトリが現在のユーザーにより書き込み可能な場合でも、パッケージ化されたグローバルインストールをランタイムでは読み取り専用として扱います。Plugin パッケージインストールはユーザー設定ディレクトリ配下の OpenClaw 所有の npm/git ルートに配置され、Gateway 起動は OpenClaw パッケージツリーを変更しません。

    一部の Linux npm セットアップでは、グローバルパッケージを `/usr/lib/node_modules/openclaw` のような root 所有ディレクトリ配下にインストールします。Plugin インストール/更新コマンドはそのグローバルパッケージディレクトリの外へ書き込むため、OpenClaw はそのレイアウトをサポートします。

  </Accordion>
  <Accordion title="強化された systemd ユニット">
    明示的な Plugin インストール、Plugin 更新、doctor クリーンアップが変更を永続化できるように、OpenClaw に設定/状態ルートへの書き込みアクセスを付与します。

    ```ini
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

  </Accordion>
  <Accordion title="ディスク容量の事前確認">
    パッケージ更新と明示的な Plugin インストールの前に、OpenClaw は対象ボリュームのディスク容量についてベストエフォートの確認を試みます。容量不足の場合、確認したパスを含む警告が出ますが、ファイルシステムクォータ、スナップショット、ネットワークボリュームは確認後に変化する可能性があるため、更新はブロックされません。実際のパッケージマネージャーによるインストールとインストール後の検証が引き続き権威ある結果です。
  </Accordion>
</AccordionGroup>

## 自動アップデーター

自動アップデーターはデフォルトでオフです。`~/.openclaw/openclaw.json` で有効にします。

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
| ----------------- | ------------------------------------------------------------------------------------------------------------- |
| `stable` | `stableDelayHours` 待機してから、`stableJitterHours` 全体で決定論的ジッターを使って適用します（分散ロールアウト）。 |
| `extended-stable` | 起動時確認または自動適用はありません。`openclaw update` または `openclaw update status` を手動で使用します。 |
| `beta` | `betaCheckIntervalHours` ごと（デフォルト: 1 時間ごと）に確認し、即座に適用します。 |
| `dev` | 自動適用はありません。`openclaw update` を手動で使用します。 |

Gateway は起動時にも更新ヒントをログに記録します（`update.checkOnStart: false` で無効化）。
保存済みの extended-stable 選択では、起動時およびバックグラウンドの解決を完全にスキップします。
ダウングレードまたはインシデント復旧では、Gateway 環境で `OPENCLAW_NO_AUTO_UPDATE=1` を設定すると、`update.auto.enabled` が構成されている場合でも自動適用をブロックできます。起動時更新ヒントは、`update.checkOnStart` も無効化されていない限り、引き続き実行される場合があります。

ライブ Gateway コントロールプレーンハンドラーを通じて要求されたパッケージマネージャー更新は、実行中の Gateway プロセス内のパッケージツリーを置き換えません。管理対象サービスインストールでは、Gateway が切り離されたハンドオフを開始して終了し、通常の `openclaw update --yes --json` CLI パスにサービスの停止、パッケージの置き換え、サービスメタデータの更新、再起動、Gateway バージョンと到達性の検証、および可能な場合はインストール済みだが未ロードの macOS LaunchAgent の復旧を任せます。Gateway がそのハンドオフを安全に行えない場合、`update.run` はパッケージマネージャーをプロセス内で実行する代わりに、安全なシェルコマンドを報告します。

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

- `openclaw doctor` をもう一度実行し、出力を注意深く読んでください。
- ソースチェックアウト上の `openclaw update --channel dev` では、必要に応じてアップデーターが `pnpm` を自動ブートストラップします。pnpm/corepack のブートストラップエラーが表示された場合は、`pnpm` を手動でインストールする（または `corepack` を再度有効にする）してから、更新を再実行してください。
- 確認: [トラブルシューティング](/ja-JP/gateway/troubleshooting)
- Discord で質問する: [https://discord.gg/clawd](https://discord.gg/clawd)

## 関連

- [インストール概要](/ja-JP/install): すべてのインストール方法。
- [Doctor](/ja-JP/gateway/doctor): 更新後の健全性チェック。
- [移行](/ja-JP/install/migrating): メジャーバージョン移行ガイド。
