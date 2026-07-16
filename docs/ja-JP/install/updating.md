---
read_when:
    - OpenClaw の更新
    - アップデート後に問題が発生する
summary: OpenClaw を安全に更新する（グローバルインストールまたはソースからのインストール）方法とロールバック戦略
title: 更新中
x-i18n:
    generated_at: "2026-07-16T11:57:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: baf849d27fd1132833832734ff5b1648b7401d53925a624176832bca614d1160
    source_path: install/updating.md
    workflow: 16
---

OpenClaw を最新の状態に保ちます。

Docker、Podman、Kubernetes のイメージ置換については、
[コンテナイメージのアップグレード](/ja-JP/install/docker#upgrading-container-images)を参照してください。Gateway は準備完了になる前に起動時に安全なアップグレード処理を実行し、マウントされた状態に手動修復が必要な場合は終了します。

## 推奨: `openclaw update`

インストール形式（npm、pnpm、Bun、git）を検出し、最新バージョンを取得して `openclaw doctor` を実行し、Gateway を再起動します。

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

`openclaw update` には `--verbose` フラグはありません（インストーラーにはあります）。診断には、予定されている操作をプレビューする `--dry-run`、構造化された結果を得る `--json`、またはチャンネルと可用性の状態を確認する `openclaw update status --json` を使用します。

`--channel beta` は beta npm dist-tag を優先しますが、beta タグがない場合、またはそのバージョンが最新の安定版リリースより古い場合は stable/latest にフォールバックします。生の npm beta dist-tag に固定した一度限りのパッケージ更新には、代わりに `--tag beta` を使用します。

`--channel extended-stable` はパッケージ専用であり、インストールは引き続きフォアグラウンドでのみ実行されます。OpenClaw は公開 npm の `extended-stable` セレクターを読み取り、選択された正確なパッケージを検証して、その正確なバージョンをインストールします。レジストリデータが欠落または不整合な場合は安全側に失敗し、`latest` にフォールバックすることはありません。
選択されたバージョンがインストール済みバージョンより古い場合は、通常のダウングレード確認が引き続き適用されます。CLI はコアの更新成功後にチャンネルを永続化しますが、直接 `npm install -g openclaw@extended-stable` を実行しても `update.channel` は更新されません。
コアの切り替え後、bare/default または `latest` の意図を持つ、対象となる公式 npm Plugin は、その正確なコアバージョンに収束します。正確な固定、明示的な非 `latest` タグ、サードパーティ Plugin、npm 以外のソースは変更されません。
現在の OpenClaw バージョンで作成されたカタログインストールは、そのデフォルトの意図を保持します。正確なバージョンのみを含む古いレコードは固定されたままになります。OpenClaw は、古い自動固定とユーザーによる固定を安全に区別できないためです。その Plugin を正確なコアバージョンの追跡に戻すには、extended-stable チャンネルで `openclaw plugins update @openclaw/name` を一度実行します。

`--channel dev` は、永続的に更新される GitHub `main` チェックアウトを提供します。一度限りのパッケージ更新では、`--tag main` が `github:openclaw/openclaw#main` パッケージ仕様にマッピングされ、対象のパッケージマネージャー（npm/pnpm/bun）を介して直接インストールされます。

管理対象 Plugin では、beta リリースがない場合は失敗ではなく警告になります。Plugin が記録済みの default/latest リリースにフォールバックしても、コアの更新は成功できます。

チャンネルのセマンティクスについては、[リリースチャンネル](/ja-JP/install/development-channels)を参照してください。

## npm と git のインストールを切り替える

インストール形式を変更するにはチャンネルを使用します。アップデーターは `~/.openclaw` にある状態、設定、認証情報、ワークスペースを維持し、CLI と Gateway が使用する OpenClaw コードのインストールだけを変更します。

```bash
# npm パッケージインストール -> 編集可能な git チェックアウト
openclaw update --channel dev

# git チェックアウト -> npm パッケージインストール
openclaw update --channel stable
```

最初にインストールモードの切り替えをプレビューします。

```bash
openclaw update --channel dev --dry-run
openclaw update --channel stable --dry-run
```

`dev` は git チェックアウトを確保し、それをビルドして、そのチェックアウトからグローバル CLI をインストールします。`stable`、`extended-stable`、`beta` チャンネルはパッケージインストールを使用します。git チェックアウトでは、変更や変換を行わずに Extended-stable が拒否されます。Gateway がすでにインストールされている場合、`--no-restart` を渡さない限り、`openclaw update` はサービスメタデータを更新して再起動します。

管理対象 Gateway サービスを使用するパッケージインストールでは、`openclaw update` はそのサービスが使用するパッケージルートを対象にします。シェルの `openclaw` コマンドが別のインストールから提供されている場合、アップデーターは両方のルートと管理対象サービスの Node パスを表示し、パッケージを置き換える前に、その Node バージョンを対象リリースの `engines.node` 要件と照合します。

## 代替方法: インストーラーを再実行する

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

オンボーディングを省略するには `--no-onboard` を追加します。特定のインストール形式を強制するには、`--install-method git --no-onboard` または `--install-method npm --no-onboard` を渡します。

npm パッケージのインストールフェーズ後に `openclaw update` が失敗した場合は、代わりにインストーラーを再実行します。インストーラーはアップデーターを呼び出さず、グローバルパッケージのインストールを直接実行するため、部分的に更新された npm インストールを復旧できます。

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

監視対象のインストールでは `openclaw update` を推奨します。実行中の Gateway サービスとパッケージの切り替えを調整できます。監視対象のインストールを手動で更新する場合は、最初に管理対象 Gateway を停止します。パッケージマネージャーはファイルをその場で置き換えるため、そうしないと実行中の Gateway が切り替えの途中でコアまたは Plugin のファイルを読み込もうとする可能性があります。パッケージマネージャーの完了後に Gateway を再起動し、新しいインストールを読み込ませます。

root 所有の Linux システム全体へのグローバルインストールで、`openclaw update` が `EACCES` により失敗した場合は、手動置換中に Gateway を停止したまま、システムの npm を使用して復旧します。その Gateway で通常使用しているものと同じプロファイルフラグ／環境を使用します。`/usr/bin/npm` は、ホスト上の root 所有グローバルプレフィックスを所有するシステム npm に置き換えてください。

```bash
openclaw gateway stop
sudo /usr/bin/npm i -g openclaw@latest
openclaw gateway install --force
openclaw gateway restart
```

続いて検証します。

```bash
openclaw --version
curl -fsS http://127.0.0.1:18789/readyz
openclaw plugins list --json
openclaw gateway status --deep --json
openclaw doctor --lint --json
```

`openclaw update` がグローバル npm インストールを管理する場合、最初に対象を一時的な npm プレフィックスへインストールします。候補パッケージは `preinstall` 中にホストの Node バージョンを検証します。その後にのみ、OpenClaw はパッケージ化された `dist` インベントリを検証し、クリーンなパッケージツリーを実際のグローバルプレフィックスへ切り替えます。パッケージ化された完了ガードは期待されるインベントリから除外され、`preinstall` が成功した後にのみ削除されるため、ライフサイクルスクリプトが省略された場合も切り替え前に失敗します。npm 12 以降では、アップデーターは候補の OpenClaw ライフサイクルのみを許可し、推移的依存関係のスクリプトは引き続きブロックされます。これにより、npm が古いパッケージの残存ファイルに新しいパッケージを上書きすることを防ぎます。インストールコマンドが失敗した場合、OpenClaw は `--omit=optional` を使用して一度再試行します。これは、ネイティブのオプション依存関係をコンパイルできないホストで役立ちます。

OpenClaw が管理する npm 更新コマンドと Plugin 更新コマンドは、子 npm プロセスに対して npm の `min-release-age` サプライチェーン隔離（または古い `before` 設定キー）も解除します。このポリシーは一般的な保護のために存在しますが、明示的な OpenClaw 更新は「選択したリリースを今すぐインストールする」ことを意味します。

```bash
pnpm add -g openclaw@latest
```

pnpm 11 で OpenClaw 2026.7.1 をインストールした場合は、その手動コマンドを一度実行してください。このリリースは pnpm 11 の分離されたグローバルパッケージレイアウトより前のものであるため、アップデーターが別の npm インストールを実行中の CLI と誤認する可能性があります。それ以降のリリースは pnpm の所有権を保持し、更新時に置換対象のパッケージルートを追跡します。また、所有するマネージャーが報告するグローバル bin ディレクトリを使用し、利用可能な pnpm コマンドが別のグローバルルートまたはメジャーバージョンを報告する場合、あるいは呼び出し元パッケージが孤立しているか、その場所で唯一の有効な OpenClaw インストールではない場合は、変更前に停止します。

OpenClaw が別のパッケージと pnpm 11 のグローバルインストールグループを共有している場合、自動アップデーターはグループを変更する前に停止します。兄弟パッケージとビルドポリシーを維持するため、元のカンマ区切りグループを手動で更新します。

```bash
bun add -g openclaw@latest
```

### npm インストールの高度なトピック

<AccordionGroup>
  <Accordion title="読み取り専用パッケージツリー">
    OpenClaw は、現在のユーザーがグローバルパッケージディレクトリへ書き込める場合でも、パッケージ化されたグローバルインストールを実行時に読み取り専用として扱います。Plugin パッケージのインストール先は、ユーザー設定ディレクトリ配下にある OpenClaw 所有の npm/git ルートであり、Gateway の起動時に OpenClaw パッケージツリーが変更されることはありません。

    一部の Linux npm 環境では、`/usr/lib/node_modules/openclaw` などの root 所有ディレクトリ配下にグローバルパッケージがインストールされます。Plugin のインストール／更新コマンドはそのグローバルパッケージディレクトリの外部へ書き込むため、OpenClaw はこのレイアウトをサポートします。

  </Accordion>
  <Accordion title="強化された systemd ユニット">
    明示的な Plugin のインストール、Plugin の更新、doctor のクリーンアップによる変更を永続化できるように、OpenClaw に設定／状態ルートへの書き込みアクセス権を付与します。

    ```ini
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

  </Accordion>
  <Accordion title="ディスク容量の事前確認">
    パッケージ更新と明示的な Plugin インストールの前に、OpenClaw は対象ボリュームのディスク容量を可能な範囲で確認します。容量不足の場合は確認対象のパスを含む警告が表示されますが、ファイルシステムのクォータ、スナップショット、ネットワークボリュームは確認後に変化する可能性があるため、更新はブロックされません。実際のパッケージマネージャーによるインストールとインストール後の検証が引き続き最終的な判断基準となります。
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

| チャンネル           | 動作                                                                                                                                     |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `stable`          | `stableDelayHours`（デフォルト: 6）待機した後、段階的なロールアウトのために `stableJitterHours`（デフォルト: 12）の範囲で決定論的なジッターを加えて適用します。 |
| `extended-stable` | `checkOnStart` が有効な場合、起動時と 24 時間ごとに読み取り専用の更新ヒントを確認します。自動的に適用することはありません。                |
| `beta`            | `betaCheckIntervalHours`（デフォルト: 1）ごとに確認し、直ちに適用します。                                                                  |
| `dev`             | 自動適用はありません。`openclaw update` を手動で使用します。                                                                                          |

Gateway は起動時に更新ヒントもログへ記録します（`update.checkOnStart: false` で無効化できます）。保存された extended-stable の選択では、この読み取り専用ヒントの経路と既存の 24 時間間隔が使用されますが、自動インストール、引き継ぎ、再起動、stable の遅延／ジッター、beta のポーリングが呼び出されることはありません。
ダウングレードまたはインシデント復旧では、`update.auto.enabled` が設定されている場合でも自動適用をブロックするため、Gateway 環境で `OPENCLAW_NO_AUTO_UPDATE=1` を設定します。`update.checkOnStart` も無効にしない限り、起動時の更新ヒントは引き続き実行できます。

稼働中の Gateway コントロールプレーン（`update.run`）を介して要求されたパッケージマネージャー更新は、実行中の Gateway プロセス内でパッケージツリーを置き換えません。管理対象サービスのインストールでは、Gateway が分離された引き継ぎを開始して終了し、通常の `openclaw update --yes --json` CLI 経路に、サービスの停止、パッケージの置換、サービスメタデータの更新、再起動、Gateway のバージョンと到達可能性の検証、可能な場合はインストール済みだが読み込まれていない macOS LaunchAgent の復旧を実行させます。Gateway がその引き継ぎを安全に行えない場合、`update.run` はプロセス内でパッケージマネージャーを実行する代わりに、安全なシェルコマンドを報告します。

Control UI のサイドバーにある更新カードには、この `update.run` フローを直接開始する場合、**Gateway を更新**と表示されます。これは、ブラウザーでホストされる Control UI、リモート Gateway、手動管理されるローカル Gateway に適用されます。

署名済み macOS アプリでは、アプリが所有するローカル Gateway の場合、そのカードは
**Mac アプリ + Gateway を更新**に変わります。まず Sparkle がアプリを更新します。再起動後、アプリは `openclaw update --tag <app-version> --json` を実行し、Gateway を再起動して、セットアップ形式の進行状況ウィンドウで正常性を検証します。このウィンドウは、その管理対象 Gateway に更新、修復、またはインストールが必要な場合にのみ表示されます。アプリのみの更新では、再起動後に直接アプリが開きます。失敗の詳細は、Retry、[更新ガイド](/ja-JP/install/updating)、および
[Discord](https://discord.gg/clawd) の各アクションとともに表示されたままになります。アプリは、リモートまたは外部管理の Gateway に対してこの連携パスを使用せず、より新しい Gateway をダウングレードせず、`extended-stable` チャンネルの固定設定を上書きすることもありません。

更新が成功すると、アプリは、実際のユーザーまたはチャンネルとのやり取りがある直近のトップレベル直接セッションに対して、1 回限りのウェルカムイベントをキューに追加します。Cron の実行、Heartbeat、およびバックグラウンドのみのセッション更新によって、この選択が変更されることはありません。リモートモードでは、アプリはローカルの Mac Node ランタイムのみを更新し、接続先のリモート Gateway がアプリと同じかそれより新しい場合にのみイベントを送信します。

## 更新後

<Steps>

### doctor を実行する

```bash
openclaw doctor
```

設定を移行し、DM ポリシーを監査して、Gateway の正常性を確認します。詳細：[Doctor](/ja-JP/gateway/doctor)

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

ロールバックには 2 つのレイヤーがあります。

1. 現在の状態を維持したまま、古い OpenClaw コードを再インストールします。
2. 古いコードが移行済みの設定またはデータベースを使用できない場合にのみ、更新前の状態を復元します。

まず、コードのみをロールバックしてください。状態を復元すると、バックアップ後に行われた変更は破棄されます。

### 更新前：検証済みバックアップを作成する

`openclaw update` は更新前の設定コピーを自動的に保存しますが、完全な状態復旧ポイントは作成しません。重要な更新の前に、明示的に作成してください。

```bash
mkdir -p ~/Backups/openclaw
openclaw backup create --output ~/Backups/openclaw --verify
```

アーカイブのマニフェストには、OpenClaw のバージョンとバックアップに含まれるソースパスが記録されます。アーカイブには認証情報、認証プロファイル、チャンネル状態が含まれる可能性があるため、所有者のみがアクセスできる権限を設定し、稼働中の状態ディレクトリと同等に保護して保存してください。含まれるファイルと意図的に除外されるファイルについては、[バックアップ](/ja-JP/cli/backup)を参照してください。

ポータブルアーカイブから除外される揮発性アーティファクトを含む、バイト単位で同一の復旧ポイントを作成するには、Gateway を停止し、プラットフォームが提供するファイルシステム、ボリューム、または VM のスナップショットを使用してください。

### パッケージインストールをロールバックする

公開済みバージョンを一覧表示してから、動作確認済みのバージョンをプレビューしてインストールします。

```bash
npm view openclaw versions --json
openclaw update --tag <known-good-version> --dry-run
openclaw update --tag <known-good-version>
```

パッケージマネージャーで直接インストールするより、`openclaw update --tag` の使用を推奨します。これはダウングレードを検出して確認を求め、インストール対象に対して管理対象 Plugin の収束処理と互換性チェックを実行し、サービスメタデータを更新して Gateway を再起動し、実行中のバージョンを検証します。保存済みチャンネルが `extended-stable` の場合、完全に一致する単発タグは `extended-stable` セレクターと組み合わせられないため、`--channel stable --tag <known-good-version>` を使用してください。

パッケージの更新では、有効化前に候補をステージングして検証します。ファイルシステムの入れ替えまたはコマンドシムの置換に失敗した場合、OpenClaw は古いパッケージを自動的に復元します。入れ替えに成功した後で Gateway の正常性チェックに失敗した場合、パッケージを再び自動置換するのではなく、以前のバージョンと手動ロールバック手順が報告されます。

CLI の更新パスを利用できない場合は、現在の Gateway を管理しているものと同じパッケージマネージャーおよびインストールスコープを使用してください。

```bash
openclaw gateway stop
npm i -g openclaw@<known-good-version>
openclaw gateway install --force
openclaw gateway restart
```

そのマネージャーがインストールを管理している場合は、`npm` を `pnpm` または `bun` に置き換えてください。障害復旧中は、有効な自動更新機能がより新しいリリースをすぐに適用しないように、Gateway の環境で `OPENCLAW_NO_AUTO_UPDATE=1` を設定してください。

### ソースチェックアウトをロールバックする

クリーンなチェックアウトを使用し、動作確認済みのタグまたはコミットを選択します。

```bash
git fetch --all --tags
git checkout --detach <known-good-tag-or-commit>
pnpm install && pnpm build
openclaw gateway restart
```

最新版に戻すには、`git checkout main && git pull` を使用します。

git 更新の開始後に依存関係のインストール、ビルド、UI ビルド、または doctor が失敗した場合、アップデーターは git チェックアウトを以前のブランチと SHA に自動的に戻します。意図的に古いコミットを選択する場合は、引き続き手動でチェックアウトする必要があります。

### セッション SQLite 移行をまたいでダウングレードする

ファイルベースの古い OpenClaw リリースを起動する前に、現在の CLI を使用して、アーカイブ済みの従来のトランスクリプトアーティファクトを復元します。

```bash
openclaw gateway stop
openclaw doctor --session-sqlite restore --session-sqlite-all-agents
```

これによって SQLite データが削除されることはありません。SQLite 移行後に作成されたセッションは SQLite にのみ存在するため、古いランタイムには表示されません。[セッション SQLite 移行後のダウングレード](/ja-JP/cli/doctor#downgrading-after-session-sqlite-migration)を参照してください。

### 必要な場合にのみ状態を復元する

古いコードが新しい設定またはデータベーススキーマを読み取れない場合は、Gateway を停止し、検証済みの更新前のファイルシステム、ボリューム、または VM のスナップショットを復元します。復元するとスナップショット後に行われた変更が削除されるため、復元前に現在の状態を別途保存してください。

広範な `openclaw backup create` アーカイブは作成と検証をサポートしますが、アーカイブ全体をその場で有効化することはできません。広範なアーカイブをステージングディレクトリに展開し、その `manifest.json` のソースからアーカイブへのマッピングを使用してオフラインで復元してください。`openclaw backup sqlite restore` も同様に、検証済みデータベースを新しいターゲットに書き込みます。そのターゲットの有効化は、引き続き明示的なオフライン運用手順として実行する必要があります。

### ロールバックを検証する

```bash
openclaw --version
openclaw health
openclaw plugins list --json
openclaw gateway status --deep --json
openclaw doctor --lint --json
```

## 問題が解決しない場合

- `openclaw doctor` をもう一度実行し、出力を注意深く確認してください。
- ソースチェックアウト上の `openclaw update --channel dev` では、必要に応じてアップデーターが `pnpm` を自動的にブートストラップします。pnpm/corepack のブートストラップエラーが表示された場合は、`pnpm` を手動でインストールするか、`corepack` を再度有効にしてから、更新を再実行してください。
- 確認：[トラブルシューティング](/ja-JP/gateway/troubleshooting)
- Discord で質問：[https://discord.gg/clawd](https://discord.gg/clawd)

## 関連項目

- [インストールの概要](/ja-JP/install)：すべてのインストール方法。
- [Doctor](/ja-JP/gateway/doctor)：更新後の正常性チェック。
- [移行](/ja-JP/install/migrating)：メジャーバージョンの移行ガイド。
