---
read_when:
    - Plugin パッケージのインストールをデバッグしています
    - Plugin の起動、doctor、またはパッケージマネージャーによるインストールの動作を変更している
    - パッケージ化された OpenClaw インストールまたはバンドルされた Plugin マニフェストを保守している
sidebarTitle: Dependencies
summary: OpenClaw が Plugin パッケージをインストールし、Plugin 依存関係を解決する仕組み
title: Plugin の依存関係解決
x-i18n:
    generated_at: "2026-05-06T17:59:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 15cdc75d92a675fd5474c49572639ab7510618e393fb7cf9f8b94506c859bee8
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

OpenClaw は Plugin の依存関係作業をインストール/更新時に保持します。ランタイム読み込みでは、
パッケージマネージャーを実行したり、依存関係ツリーを修復したり、OpenClaw
パッケージディレクトリを変更したりしません。

## 責任の分担

Plugin パッケージが自身の依存関係グラフを所有します。

- ランタイム依存関係は Plugin パッケージの `dependencies` または
  `optionalDependencies` に置く
- SDK/core のインポートは peer または OpenClaw が提供するインポートにする
- ローカル開発 Plugin は、すでにインストール済みの依存関係を自分で持ち込む
- npm および git Plugin は OpenClaw が所有するパッケージルートにインストールされる

OpenClaw が所有するのは Plugin ライフサイクルだけです。

- Plugin ソースを検出する
- 明示的に要求されたときにパッケージをインストールまたは更新する
- インストールメタデータを記録する
- Plugin エントリポイントを読み込む
- 依存関係が欠落している場合は、対応可能なエラーで失敗する

## インストールルート

OpenClaw はソースごとに安定したルートを使用します。

- npm パッケージは `~/.openclaw/npm` 配下にインストールされる
- git パッケージは `~/.openclaw/git` 配下にクローンされる
- local/path/archive のインストールは、依存関係修復なしでコピーまたは参照される

npm インストールは npm ルートで次のように実行されます。

```bash
npm install --prefix ~/.openclaw/npm <spec> --omit=dev --ignore-scripts --no-audit --no-fund
```

`openclaw plugins install npm-pack:<path.tgz>` は、ローカルの npm-pack tarball に対して
同じ管理対象 npm ルートを使用します。OpenClaw は tarball の npm メタデータを読み取り、
コピーされた `file:` 依存関係として管理対象ルートへ追加し、通常の npm install を実行したうえで、
インストール済み lockfile メタデータを検証してから Plugin を信頼します。
これは、ローカル pack アーティファクトがシミュレート対象のレジストリアーティファクトと同じように
動作すべきパッケージ受け入れおよびリリース候補の証明を意図しています。

npm は推移的依存関係を Plugin パッケージの横にある `~/.openclaw/npm/node_modules` へ
hoist する場合があります。OpenClaw はインストールを信頼する前に管理対象 npm ルートをスキャンし、
アンインストール時には npm を使って npm 管理パッケージを削除するため、hoist された
ランタイム依存関係は管理対象のクリーンアップ境界内に残ります。

`openclaw/plugin-sdk/*` をインポートする Plugin は、`openclaw` を peer
dependency として宣言します。OpenClaw は、ホストパッケージの別のレジストリコピーを
管理対象ルートへ npm にインストールさせません。古いホストパッケージが、後続の Plugin
インストール時に npm の peer 解決へ影響する可能性があるためです。代わりに、インストール、
更新、またはアンインストールの間に npm が共有ルートの変更を完了した後、OpenClaw は
ホスト peer を宣言しているインストール済みパッケージに対して、Plugin ローカルの
`node_modules/openclaw` リンクを再確立します。

git インストールでは、リポジトリをクローンまたは更新してから、次を実行します。

```bash
npm install --omit=dev --ignore-scripts --no-audit --no-fund
```

その後、インストール済み Plugin はそのパッケージディレクトリから読み込まれるため、
パッケージローカルおよび親 `node_modules` の解決は通常の Node パッケージと同じように動作します。

## ローカル Plugin

ローカル Plugin は開発者が管理するディレクトリとして扱われます。OpenClaw はそれらに対して
`npm install`、`pnpm install`、または依存関係修復を実行しません。ローカル
Plugin に依存関係がある場合は、読み込む前にその Plugin 内でインストールしてください。

サードパーティの TypeScript ローカル Plugin は、緊急用の Jiti パスを使用できます。
パッケージ化された JavaScript Plugin とバンドルされた内部 Plugin は、Jiti ではなくネイティブの
import/require を通じて読み込まれます。

## 起動と再読み込み

Gateway の起動と設定の再読み込みでは、Plugin の依存関係をインストールしません。それらは
Plugin インストールレコードを読み取り、エントリポイントを計算し、それを読み込みます。

ランタイムで依存関係が欠落している場合、Plugin の読み込みは失敗し、エラーはオペレーターに
明示的な修正方法を示す必要があります。

```bash
openclaw plugins update <id>
openclaw plugins install <source>
openclaw doctor --fix
```

`doctor --fix` は、OpenClaw が生成したレガシーな依存関係状態をクリーンアップし、
設定から参照されているのにローカルインストールレコードに存在しないダウンロード可能な Plugin を
復旧できます。Doctor は、すでにインストール済みのローカル Plugin の依存関係は修復しません。

## バンドル Plugin

軽量で core に重要なバンドル Plugin は、OpenClaw の一部として出荷されます。
それらは重いランタイム依存関係ツリーを持たないようにするか、ClawHub/npm 上の
ダウンロード可能パッケージへ移動する必要があります。

core パッケージに同梱される、外部インストールされる、またはソース専用のまま残る Plugin の
現在の生成済み一覧については、[Plugin インベントリ](/ja-JP/plugins/plugin-inventory) を参照してください。

バンドル Plugin の manifest は依存関係ステージングを要求してはいけません。大規模または任意の
Plugin 機能は通常の Plugin としてパッケージ化し、サードパーティ Plugin と同じ
npm/git/ClawHub パスを通じてインストールする必要があります。

ソースチェックアウトでは、OpenClaw はリポジトリを pnpm monorepo として扱います。
`pnpm install` の後、バンドル Plugin は `extensions/<id>` から読み込まれるため、
パッケージローカルの workspace 依存関係が利用可能になり、編集内容が直接反映されます。
ソースチェックアウト開発は pnpm 専用です。リポジトリルートでの通常の `npm install` は、
バンドル Plugin の依存関係を準備する方法としてサポートされていません。

| インストール形態                    | バンドル Plugin の場所               | 依存関係の所有者                                                     |
| -------------------------------- | ------------------------------------- | -------------------------------------------------------------------- |
| `npm install -g openclaw`        | パッケージ内のビルド済みランタイムツリー | OpenClaw パッケージと明示的な Plugin install/update/doctor フロー     |
| Git checkout plus `pnpm install` | `extensions/<id>` workspace packages  | 各 Plugin パッケージ自身の依存関係を含む pnpm workspace |
| `openclaw plugins install ...`   | 管理対象 npm/git/ClawHub Plugin ルート   | Plugin install/update フロー                                       |

## レガシークリーンアップ

古い OpenClaw バージョンは、起動時または doctor 修復中にバンドル Plugin の依存関係ルートを
生成していました。現在の doctor cleanup は、`--fix` が使用されたときに、それらの古いディレクトリと
symlink を削除します。対象には、古い `plugin-runtime-deps` ルート、削除済みの
`plugin-runtime-deps` ターゲットを指すグローバル Node-prefix パッケージ symlink、
`.openclaw-runtime-deps*` manifest、生成された Plugin `node_modules`、インストール
ステージディレクトリ、パッケージローカルの pnpm store が含まれます。パッケージ化された
postinstall も、レガシーターゲットルートを削除する前にそれらのグローバル symlink を削除するため、
アップグレード後に壊れた ESM パッケージインポートが残りません。

これらのパスはレガシーな残骸にすぎません。新規インストールでは作成されるべきではありません。
