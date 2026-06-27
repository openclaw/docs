---
read_when:
    - Plugin パッケージのインストールをデバッグしている
    - Plugin の起動、doctor、またはパッケージマネージャーのインストール動作を変更している
    - パッケージ化された OpenClaw インストールまたはバンドルされた plugin マニフェストを保守している
sidebarTitle: Dependencies
summary: OpenClaw が Plugin パッケージをインストールし、Plugin 依存関係を解決する方法
title: Plugin 依存関係の解決
x-i18n:
    generated_at: "2026-06-27T12:15:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d5d2f3efe40c50433bd44961f6f5b8d03f3c69d3f5112163613b8efbd0f17c65
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

OpenClaw は、Plugin の依存関係に関する作業をインストール時または更新時に行います。ランタイム読み込みでは、パッケージマネージャーを実行したり、依存関係ツリーを修復したり、OpenClaw
パッケージディレクトリを変更したりしません。

## 責任分担

Plugin パッケージは、自身の依存関係グラフを所有します。

- ランタイム依存関係は Plugin パッケージの `dependencies` または
  `optionalDependencies` に置かれます
- SDK/core のインポートは peer、または OpenClaw が提供するインポートです
- ローカル開発用 Plugin は、すでにインストール済みの依存関係を自分で用意します
- npm および git Plugin は、OpenClaw が所有するパッケージルートにインストールされます

OpenClaw が所有するのは Plugin のライフサイクルだけです。

- Plugin ソースを検出する
- 明示的に要求されたときにパッケージをインストールまたは更新する
- インストールメタデータを記録する
- Plugin エントリポイントを読み込む
- 依存関係が欠落している場合は、対処可能なエラーで失敗する

## インストールルート

OpenClaw はソースごとに安定したルートを使用します。

- npm パッケージは、Plugin ごとのプロジェクトとして
  `~/.openclaw/npm/projects/<encoded-package>` 配下にインストールされます
- git パッケージは `~/.openclaw/git` 配下にクローンされます
- ローカル/path/archive インストールは、依存関係修復なしでコピーまたは参照されます

npm インストールは、その Plugin ごとのプロジェクトルートで次のように実行されます。

```bash
cd ~/.openclaw/npm/projects/<encoded-package>
npm install --omit=dev --omit=peer --legacy-peer-deps --ignore-scripts --no-audit --no-fund
```

`openclaw plugins install npm-pack:<path.tgz>` は、ローカル npm-pack tarball に同じ Plugin ごとの npm
プロジェクトルートを使用します。OpenClaw は tarball の npm
メタデータを読み取り、それをコピー済みの `file:` 依存関係として管理対象プロジェクトに追加し、通常の npm install を実行してから、
Plugin を信頼する前にインストール済み lockfile メタデータを検証します。
これは、ローカル pack アーティファクトを、それがシミュレートする registry アーティファクトのように動作させる必要がある、パッケージ受け入れおよびリリース候補の証明を目的としています。

npm は推移的依存関係を、Plugin パッケージの隣にある Plugin ごとのプロジェクトの
`node_modules` に hoist することがあります。OpenClaw はインストールを信頼する前に管理対象プロジェクトルートをスキャンし、アンインストール時にそのプロジェクトを削除するため、
hoist されたランタイム依存関係はその Plugin のクリーンアップ境界内に残ります。

公開済み npm Plugin パッケージは `npm-shrinkwrap.json` を同梱できます。npm はインストール時にその公開可能な lockfile を使用し、OpenClaw の管理対象 npm プロジェクトルートは通常の npm install パスを通じてそれをサポートします。OpenClaw 所有の公開可能な
Plugin パッケージには、その Plugin パッケージの公開済み依存関係グラフから生成された、パッケージローカルの shrinkwrap を含める必要があります。

```bash
pnpm deps:shrinkwrap:generate
pnpm deps:shrinkwrap:check
```

生成器は Plugin の `devDependencies` を削除し、workspace override
ポリシーを適用し、各 `publishToNpm` Plugin について
`extensions/<id>/npm-shrinkwrap.json` を書き込みます。サードパーティ Plugin パッケージも shrinkwrap を同梱できます。
OpenClaw は community パッケージにそれを必須とはしませんが、存在する場合 npm はそれを尊重します。

OpenClaw 所有の npm Plugin パッケージは、明示的な
`bundledDependencies` 付きで公開することもできます。npm publish パスはランタイム依存関係名リストを重ね合わせ、公開される package
manifest から dev 専用 workspace メタデータを削除し、パッケージローカルのランタイム依存関係に対して script-free な npm install を実行してから、それらの依存関係ファイルを含めて Plugin tarball を pack または公開します。Codex や ACP ランタイムを含むネイティブ依存の重いパッケージは、
`openclaw.release.bundleRuntimeDependencies: false` でオプトアウトします。それらのパッケージも shrinkwrap は同梱しますが、npm はすべてのプラットフォームバイナリを Plugin tarball に埋め込む代わりに、インストール時にランタイム依存関係を解決します。ルートの
`openclaw` パッケージは、完全な依存関係ツリーをバンドルしません。

`openclaw/plugin-sdk/*` をインポートする Plugin は、`openclaw` を peer
dependency として宣言します。OpenClaw は、host パッケージの別の registry コピーを npm が管理対象プロジェクトにインストールすることを許可しません。古い host パッケージは、その Plugin 内の npm peer 解決に影響する可能性があるためです。管理対象 npm インストールは npm peer の解決/materialization をスキップし、OpenClaw はインストールまたは更新後に、host peer を宣言するインストール済みパッケージに対して Plugin ローカルの
`node_modules/openclaw` リンクを再確立します。

git インストールはリポジトリをクローンまたは更新してから、次を実行します。

```bash
npm install --omit=dev --ignore-scripts --no-audit --no-fund
```

インストール済み Plugin はそのパッケージディレクトリから読み込まれるため、パッケージローカルおよび親の `node_modules` 解決は通常の
Node パッケージと同じように機能します。

## ローカル Plugin

ローカル Plugin は、開発者が管理するディレクトリとして扱われます。OpenClaw はそれらに対して
`npm install`、`pnpm install`、依存関係修復を実行しません。ローカル
Plugin に依存関係がある場合は、読み込む前にその Plugin 内でインストールしてください。

サードパーティの TypeScript ローカル Plugin は、緊急用の Jiti パスを使用できます。パッケージ化された
JavaScript Plugin とバンドルされた内部 Plugin は、Jiti ではなくネイティブの import/require を通じて読み込まれます。

## 起動と再読み込み

Gateway の起動と config の再読み込みでは、Plugin の依存関係は一切インストールされません。Plugin のインストール記録を読み取り、エントリポイントを計算し、それを読み込みます。

ランタイムで依存関係が欠落している場合、Plugin は読み込みに失敗し、エラーはオペレーターに明示的な修正方法を示す必要があります。

```bash
openclaw plugins update <id>
openclaw plugins install <source>
openclaw doctor --fix
```

`doctor --fix` は、レガシーの OpenClaw 生成依存関係状態をクリーンアップし、config が参照しているのにローカルのインストール記録に存在しないダウンロード可能な
Plugin を復旧できます。Doctor は、すでにインストール済みのローカル Plugin の依存関係は修復しません。

## バンドル Plugin

軽量で core-critical なバンドル Plugin は OpenClaw の一部として出荷されます。重いランタイム依存関係ツリーを持たないようにするか、
ClawHub/npm 上のダウンロード可能なパッケージに移す必要があります。

core パッケージに同梱される、外部インストールされる、またはソース専用のままになる Plugin の現在の生成済みリストについては、[Plugin インベントリ](/ja-JP/plugins/plugin-inventory) を参照してください。

バンドル Plugin manifest は依存関係 staging を要求してはなりません。大規模または任意の Plugin 機能は通常の Plugin としてパッケージ化し、サードパーティ Plugin と同じ npm/git/ClawHub パスでインストールする必要があります。

ソース checkout では、OpenClaw はリポジトリを pnpm monorepo として扱います。
`pnpm install` の後、バンドル Plugin は `extensions/<id>` から読み込まれるため、パッケージローカルの workspace 依存関係が利用でき、編集内容が直接反映されます。ソース checkout 開発は pnpm のみ対応です。リポジトリルートでの単純な
`npm install` は、バンドル Plugin の依存関係を準備する方法としてサポートされていません。

| インストール形態                    | バンドル Plugin の場所               | 依存関係の所有者                                                     |
| -------------------------------- | ------------------------------------- | -------------------------------------------------------------------- |
| `npm install -g openclaw`        | パッケージ内のビルド済みランタイムツリー | OpenClaw パッケージと明示的な Plugin install/update/doctor フロー     |
| Git checkout plus `pnpm install` | `extensions/<id>` workspace packages  | 各 Plugin パッケージ自身の依存関係を含む pnpm workspace |
| `openclaw plugins install ...`   | 管理対象 npm プロジェクト/git/ClawHub ルート  | Plugin install/update フロー                                       |

## レガシークリーンアップ

古い OpenClaw バージョンは、起動時または doctor repair 中にバンドル Plugin の依存関係ルートを生成していました。現在の doctor cleanup は、`--fix` が使用されたときに、それらの古いディレクトリと symlink を削除します。これには、古い `plugin-runtime-deps` ルート、pruned された `plugin-runtime-deps` target を指す global
Node-prefix package symlinks、`.openclaw-runtime-deps*` manifests、生成された Plugin
`node_modules`、install stage directories、package-local pnpm stores が含まれます。パッケージ化された postinstall も、レガシー target roots を pruning する前にそれらの global symlinks を削除するため、アップグレード後に壊れた ESM package imports が残りません。

古い npm インストールも、共有 `~/.openclaw/npm/node_modules` ルートを使用していました。現在の install、update、uninstall、doctor フローは、そのレガシーの flat root を recovery と cleanup のためにのみ引き続き認識します。新しい npm インストールでは、代わりに Plugin ごとのプロジェクトルートを作成する必要があります。
