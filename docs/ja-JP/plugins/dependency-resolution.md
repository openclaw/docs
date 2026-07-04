---
read_when:
    - Plugin パッケージのインストールをデバッグしている
    - Plugin の起動、doctor、またはパッケージマネージャーのインストール動作を変更している
    - パッケージ版の OpenClaw インストールまたはバンドルされた Plugin マニフェストを保守している
sidebarTitle: Dependencies
summary: OpenClaw が Plugin パッケージをインストールし、Plugin の依存関係を解決する仕組み
title: Plugin 依存関係の解決
x-i18n:
    generated_at: "2026-07-04T15:08:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: adc6cc80bfe4e4c06ca0e99877c0d4148861ff88366ae233c254aac56c7cdf6d
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

OpenClaw は Plugin の依存関係作業をインストール/更新時に行います。ランタイム読み込みでは、パッケージマネージャーの実行、依存関係ツリーの修復、OpenClaw パッケージディレクトリの変更は行いません。

## 責任分担

Plugin パッケージは自身の依存関係グラフを所有します。

- ランタイム依存関係は Plugin パッケージの `dependencies` または `optionalDependencies` に置く
- SDK/コアの import は peer、または OpenClaw が提供する import にする
- ローカル開発 Plugin は、すでにインストール済みの依存関係を自分で用意する
- npm と git の Plugin は、OpenClaw が所有するパッケージルートにインストールされる

OpenClaw が所有するのは Plugin ライフサイクルだけです。

- Plugin ソースを検出する
- 明示的に要求されたときにパッケージをインストールまたは更新する
- インストールメタデータを記録する
- Plugin エントリポイントを読み込む
- 依存関係が欠落している場合は、対処可能なエラーで失敗する

## インストールルート

OpenClaw はソースごとに安定したルートを使用します。

- npm パッケージは、`~/.openclaw/npm/projects/<encoded-package>` 配下の Plugin ごとのプロジェクトにインストールされる
- git パッケージは `~/.openclaw/git` 配下に clone される
- ローカル/パス/archive インストールは、依存関係の修復なしでコピーまたは参照される

npm インストールは、その Plugin ごとのプロジェクトルートで次を実行します。

```bash
cd ~/.openclaw/npm/projects/<encoded-package>
npm install --omit=dev --omit=peer --legacy-peer-deps --ignore-scripts --no-audit --no-fund
```

`openclaw plugins install npm-pack:<path.tgz>` は、ローカルの npm-pack tarball にも同じ Plugin ごとの npm プロジェクトルートを使用します。OpenClaw は tarball の npm メタデータを読み取り、コピーされた `file:` 依存関係として管理対象プロジェクトに追加し、通常の npm install を実行してから、インストールされた lockfile メタデータを検証したうえで Plugin を信頼します。
これは、ローカルの pack 成果物が、それが模擬する registry 成果物と同じように振る舞うべき package-acceptance と release-candidate の証明を意図しています。

公開前に公式または外部 Plugin パッケージをテストするときは `npm-pack:` を使用します。生の archive やパスインストールはローカルデバッグには有用ですが、インストールされた npm または ClawHub パッケージと同じ依存関係パスを証明するものではありません。`npm-pack:` は管理対象パッケージのインストール形状を証明しますが、それ自体では、その Plugin が catalog に紐づいた公式コンテンツである証明にはなりません。

動作が bundled-plugin または信頼済み公式 Plugin の状態に依存する場合は、ローカルパッケージの証明に加えて、catalog に裏付けられた公式インストール、または公式の信頼を記録する公開済みパッケージパスを組み合わせます。特権 helper へのアクセスと trusted-official scope の処理は、その信頼済みインストールパスで検証すべきであり、ローカル tarball インストールから推測すべきではありません。

Plugin がランタイムで import 欠落により失敗する場合は、管理対象プロジェクトを手作業で修復するのではなく、パッケージ manifest を修正します。ランタイム import は Plugin パッケージの `dependencies` または `optionalDependencies` に属します。`devDependencies` は管理対象ランタイムプロジェクトにはインストールされません。`~/.openclaw/npm/projects/<encoded-package>` 内でローカルに `npm install` を実行すると一時的な診断の妨げは取り除けますが、次回のインストールまたは更新でパッケージメタデータからプロジェクトが再作成されるため、package-acceptance の証明にはなりません。

npm は推移的依存関係を、Plugin パッケージの隣にある Plugin ごとのプロジェクトの `node_modules` に hoist することがあります。OpenClaw はインストールを信頼する前に管理対象プロジェクトルートをスキャンし、アンインストール時にはそのプロジェクトを削除するため、hoist されたランタイム依存関係はその Plugin のクリーンアップ境界内に留まります。

公開済み npm Plugin パッケージは `npm-shrinkwrap.json` を同梱できます。npm はインストール時にその公開可能な lockfile を使用し、OpenClaw の管理対象 npm プロジェクトルートは通常の npm install パスを通じてそれをサポートします。OpenClaw が所有する公開可能な Plugin パッケージには、その Plugin パッケージの公開済み依存関係グラフから生成された、パッケージローカルの shrinkwrap を含める必要があります。

```bash
pnpm deps:shrinkwrap:generate
pnpm deps:shrinkwrap:check
```

generator は Plugin の `devDependencies` を取り除き、workspace override ポリシーを適用し、各 `publishToNpm` Plugin に対して `extensions/<id>/npm-shrinkwrap.json` を書き込みます。サードパーティ Plugin パッケージも shrinkwrap を同梱できます。OpenClaw は community パッケージにそれを必須とはしませんが、存在する場合 npm はそれを尊重します。

ローカルパッケージを release-candidate の証明として扱う前に、インストールされる tarball を検査します。

```bash
npm pack --pack-destination /tmp
tar -xOf /tmp/<plugin-package>.tgz package/package.json
tar -tf /tmp/<plugin-package>.tgz | grep '^package/dist/'
```

依存関係の変更については、本番インストールが dev 依存関係なしでランタイムパッケージを解決できることも確認します。

```bash
tmpdir=$(mktemp -d)
(
  cd "$tmpdir"
  npm init -y >/dev/null
  npm install --package-lock-only --omit=dev --omit=peer --legacy-peer-deps --ignore-scripts /tmp/<plugin-package>.tgz
)
rm -rf "$tmpdir"
```

OpenClaw が所有する npm Plugin パッケージは、明示的な `bundledDependencies` を付けて公開することもできます。npm publish パスはランタイム依存関係名の一覧を overlay し、公開されるパッケージ manifest から dev 専用の workspace メタデータを削除し、パッケージローカルのランタイム依存関係に対して script-free の npm install を実行してから、それらの依存関係ファイルを含めて Plugin tarball を pack または publish します。Codex や ACP ランタイムを含む native-heavy パッケージは、`openclaw.release.bundleRuntimeDependencies: false` で opt out します。これらのパッケージは引き続き shrinkwrap を同梱しますが、すべてのプラットフォームバイナリを Plugin tarball に埋め込む代わりに、npm がインストール時にランタイム依存関係を解決します。ルートの `openclaw` パッケージは、自身の完全な依存関係ツリーを bundle しません。

`openclaw/plugin-sdk/*` を import する Plugin は、`openclaw` を peer dependency として宣言します。OpenClaw は、host パッケージの別の registry コピーを npm が管理対象プロジェクトにインストールすることを許可しません。古い host パッケージが、その Plugin 内の npm peer 解決に影響する可能性があるためです。管理対象 npm インストールでは npm peer の解決/実体化をスキップし、OpenClaw はインストールまたは更新後に、host peer を宣言するインストール済みパッケージについて Plugin ローカルの `node_modules/openclaw` リンクを再確立します。

git インストールはリポジトリを clone または refresh してから、次を実行します。

```bash
npm install --omit=dev --ignore-scripts --no-audit --no-fund
```

インストールされた Plugin はその後、そのパッケージディレクトリから読み込まれるため、パッケージローカルおよび親の `node_modules` 解決は、通常の Node パッケージと同じように機能します。

## ローカル Plugin

ローカル Plugin は開発者が管理するディレクトリとして扱われます。OpenClaw はそれらに対して `npm install`、`pnpm install`、依存関係修復を実行しません。ローカル Plugin に依存関係がある場合は、読み込む前にその Plugin 内でインストールしてください。

サードパーティの TypeScript ローカル Plugin は緊急用の Jiti パスを使用できます。パッケージ化された JavaScript Plugin と bundled internal Plugin は、Jiti ではなく native import/require を通じて読み込まれます。

## 起動と再読み込み

Gateway の起動と config の再読み込みでは、Plugin の依存関係はインストールされません。これらは Plugin インストール記録を読み取り、エントリポイントを計算し、それを読み込みます。

ランタイムで依存関係が欠落している場合、Plugin は読み込みに失敗し、エラーは operator に明示的な修正を示すべきです。

```bash
openclaw plugins update <id>
openclaw plugins install <source>
openclaw doctor --fix
```

`doctor --fix` は、OpenClaw が生成した legacy 依存関係 state をクリーンアップし、config が参照しているのにローカルインストール記録から欠落しているダウンロード可能な Plugin を復旧できます。Doctor は、すでにインストールされているローカル Plugin の依存関係は修復しません。

## Bundled Plugin

軽量でコアに重要な bundled Plugin は OpenClaw の一部として同梱されます。重いランタイム依存関係ツリーを持たないようにするか、ClawHub/npm 上のダウンロード可能なパッケージに移すべきです。

コアパッケージに同梱される Plugin、外部インストールされる Plugin、source-only のままの Plugin の現在の生成済み一覧については、[Plugin インベントリ](/ja-JP/plugins/plugin-inventory)を参照してください。

Bundled Plugin の manifest は dependency staging を要求してはいけません。大規模または任意の Plugin 機能は通常の Plugin としてパッケージ化し、サードパーティ Plugin と同じ npm/git/ClawHub パスでインストールすべきです。

ソース checkout では、OpenClaw はリポジトリを pnpm monorepo として扱います。`pnpm install` の後、bundled Plugin は `extensions/<id>` から読み込まれるため、パッケージローカルの workspace 依存関係が利用可能になり、編集は直接反映されます。ソース checkout 開発は pnpm のみです。リポジトリルートで通常の `npm install` を実行する方法は、bundled Plugin 依存関係を準備する手段としてサポートされていません。

| インストール形状                 | Bundled Plugin の場所                | 依存関係の所有者                                                       |
| -------------------------------- | ------------------------------------- | -------------------------------------------------------------------- |
| `npm install -g openclaw`        | パッケージ内のビルド済みランタイムツリー | OpenClaw パッケージと明示的な Plugin install/update/doctor フロー     |
| Git checkout plus `pnpm install` | `extensions/<id>` workspace packages  | 各 Plugin パッケージ自身の依存関係を含む pnpm workspace              |
| `openclaw plugins install ...`   | Managed npm project/git/ClawHub root  | Plugin install/update フロー                                          |

## Legacy クリーンアップ

古い OpenClaw バージョンは、起動時または doctor repair 中に bundled-plugin 依存関係ルートを生成していました。現在の doctor cleanup は、`--fix` が使われたときに、古い `plugin-runtime-deps` ルート、prune された `plugin-runtime-deps` ターゲットを指す global Node-prefix パッケージ symlink、`.openclaw-runtime-deps*` manifest、生成された Plugin `node_modules`、install stage ディレクトリ、パッケージローカルの pnpm store を含む、古いディレクトリと symlink を削除します。パッケージ化された postinstall も、legacy ターゲットルートを prune する前にそれらの global symlink を削除するため、upgrade 後に壊れた ESM パッケージ import が残りません。

古い npm インストールでは、共有の `~/.openclaw/npm/node_modules` ルートも使用していました。現在の install、update、uninstall、doctor フローは、復旧とクリーンアップのためだけに、その legacy flat root を引き続き認識します。新しい npm インストールでは、代わりに Plugin ごとのプロジェクトルートを作成すべきです。
