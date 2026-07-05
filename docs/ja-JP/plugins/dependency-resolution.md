---
read_when:
    - Plugin パッケージのインストールをデバッグしています
    - Plugin の起動、doctor、またはパッケージマネージャーのインストール動作を変更している
    - パッケージ化された OpenClaw インストールまたはバンドル済み plugin マニフェストを保守している
sidebarTitle: Dependencies
summary: OpenClaw が Plugin パッケージをインストールし、Plugin 依存関係を解決する方法
title: Plugin 依存関係の解決
x-i18n:
    generated_at: "2026-07-05T11:37:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ae24a82568e275399cb7b68729d2805956792852612f84d6918850305f0eb243
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

OpenClaw は Plugin の依存関係をインストール/更新時にのみ処理します。ランタイム
読み込みでは、パッケージマネージャーの実行、依存関係ツリーの修復、または
OpenClaw パッケージディレクトリの変更は行いません。

## 責任分担

Plugin パッケージは自身の依存関係グラフを所有します。

- ランタイム依存関係は Plugin パッケージの `dependencies` または
  `optionalDependencies` に置きます。
- SDK/core のインポートは peer、または OpenClaw が提供するインポートです。
- ローカル開発 Plugin は、すでにインストール済みの自身の依存関係を持ち込みます。
- npm および git Plugin は、OpenClaw が所有するパッケージルートにインストールされます。

OpenClaw は Plugin ライフサイクルのみを所有します。

- Plugin ソースを検出する。
- 明示的に要求されたときにパッケージをインストールまたは更新する。
- インストールメタデータを記録する。
- Plugin エントリポイントを読み込む。
- 依存関係が欠けている場合は、対処可能なエラーで失敗する。

## インストールルート

OpenClaw はソースごとに安定したルートを使用します。

- npm パッケージは
  `~/.openclaw/npm/projects/<encoded-package>` 配下の Plugin ごとのプロジェクトにインストールされます。
- git パッケージは `~/.openclaw/git` 配下に clone されます。
- ローカル/path/archive インストールは、依存関係の修復なしでコピーまたは参照されます。

npm インストールは、その Plugin ごとのプロジェクトルートで次を実行します。

```bash
cd ~/.openclaw/npm/projects/<encoded-package>
npm install --omit=dev --omit=peer --legacy-peer-deps --ignore-scripts --no-audit --no-fund
```

`openclaw plugins install npm-pack:<path.tgz>` は、ローカル npm-pack tarball に同じ Plugin ごとの npm
プロジェクトルートを使用します。OpenClaw は tarball の npm
メタデータを読み取り、コピーされた `file:` 依存関係として管理対象プロジェクトへ追加し、上記の通常の npm install を実行してから、Plugin を信頼する前にインストール済み lockfile メタデータを検証します。この経路は、ローカル pack アーティファクトがシミュレートする registry アーティファクトのように振る舞うべき package-acceptance と release-candidate の証明のために存在します。

公開前に公式または外部 Plugin パッケージをテストするときは、`npm-pack:` を使用してください。生の archive または path インストールはローカルデバッグには有用ですが、インストール済み npm または ClawHub
パッケージと同じ依存関係経路を証明するものではありません。`npm-pack:` は管理対象パッケージインストールの形を証明します。それ自体は、その Plugin がカタログに紐付いた公式コンテンツであることの証明ではありません。

挙動が bundled-plugin または信頼済み公式 Plugin のステータスに依存する場合は、ローカルパッケージの証明と、カタログに裏付けられた公式インストール、または公式の信頼を記録する公開済みパッケージ経路を組み合わせてください。特権ヘルパーアクセスと trusted-official スコープの処理は、その信頼済みインストール経路で検証すべきであり、ローカル tarball インストールから推論すべきではありません。

Plugin がランタイムで missing import により失敗する場合は、管理対象プロジェクトを手で修復するのではなく、パッケージ manifest を修正してください。ランタイムインポートは Plugin パッケージの `dependencies` または `optionalDependencies` に属します。`devDependencies` は管理対象ランタイムプロジェクトにはインストールされません。`~/.openclaw/npm/projects/<encoded-package>` 内でローカルに `npm install` すると一時的な診断のブロックは解除できますが、次のインストールまたは更新でパッケージメタデータからプロジェクトが再作成されるため、package-acceptance の証明にはなりません。

npm は推移的依存関係を、Plugin パッケージの隣にある Plugin ごとのプロジェクトの
`node_modules` へ hoist する場合があります。OpenClaw はインストールを信頼する前に管理対象プロジェクトルートをスキャンし、アンインストール時にそのプロジェクトを削除するため、hoist されたランタイム依存関係はその Plugin のクリーンアップ境界内に留まります。

公開済み npm Plugin パッケージは `npm-shrinkwrap.json` を同梱できます。npm はインストール時にその公開可能な lockfile を使用し、OpenClaw の管理対象 npm プロジェクトルートは通常のインストール経路を通じてそれをサポートします。OpenClaw 所有の公開可能な
Plugin パッケージには、そのパッケージの公開済み依存関係グラフから生成された、パッケージローカルの shrinkwrap を含める必要があります。

```bash
pnpm deps:shrinkwrap:generate
pnpm deps:shrinkwrap:check
```

generator は Plugin の `devDependencies` を取り除き、workspace override
ポリシーを適用し、`openclaw.release.publishToNpm: true` を持つ各 Plugin に対して `extensions/<id>/npm-shrinkwrap.json` を書き込みます。サードパーティ Plugin パッケージも shrinkwrap を同梱できます。OpenClaw はコミュニティパッケージにそれを必須とはしませんが、存在する場合 npm はそれを尊重します。

ローカルパッケージを release-candidate の証明として扱う前に、インストールされる
tarball を検査してください。

```bash
npm pack --pack-destination /tmp
tar -xOf /tmp/<plugin-package>.tgz package/package.json
tar -tf /tmp/<plugin-package>.tgz | grep '^package/dist/'
```

依存関係の変更では、dev 依存関係なしで production install がランタイムパッケージを解決できることも検証してください。

```bash
tmpdir=$(mktemp -d)
(
  cd "$tmpdir"
  npm init -y >/dev/null
  npm install --package-lock-only --omit=dev --omit=peer --legacy-peer-deps --ignore-scripts /tmp/<plugin-package>.tgz
)
rm -rf "$tmpdir"
```

OpenClaw 所有の npm Plugin パッケージは、明示的な
`bundledDependencies` を付けて公開することもできます。npm publish 経路はランタイム依存関係名リストを overlay し、公開 manifest から dev 専用 workspace メタデータを取り除き、パッケージローカルのランタイム依存関係に対して script-free の npm install を実行してから、それらの依存関係ファイルを含めて Plugin tarball を pack または公開します。ネイティブ要素の重いパッケージ (Codex, ACPX, Copilot, llama.cpp,
memory-lancedb, Tlon) は
`openclaw.release.bundleRuntimeDependencies: false` で opt out します。それらも shrinkwrap は同梱しますが、Plugin tarball にすべての platform binary を埋め込むのではなく、インストール時に npm がランタイム依存関係を解決します。ルートの `openclaw`
パッケージは、完全な依存関係ツリーを bundle しません。

`openclaw/plugin-sdk/*` をインポートする Plugin は、`openclaw` を peer
dependency として宣言します。OpenClaw は、host パッケージの別個の registry コピーを npm が管理対象プロジェクトへインストールすることを許可しません。古い host パッケージが、その Plugin 内の npm の peer 解決に影響する可能性があるためです。管理対象 npm インストールは npm peer の解決/materialization をスキップし、OpenClaw はインストールまたは更新後、host peer を宣言するインストール済みパッケージに対して Plugin ローカルの
`node_modules/openclaw` リンクを再度適用します。

git インストールは repository を clone または refresh してから、次を実行します。

```bash
npm install --omit=dev --ignore-scripts --no-audit --no-fund
```

その後、インストール済み Plugin はそのパッケージディレクトリから読み込まれるため、パッケージローカルおよび親 `node_modules` の解決は通常の Node パッケージと同じように機能します。

## ローカル Plugin

ローカル Plugin は開発者が管理するディレクトリです。OpenClaw はそれらに対して
`npm install`、`pnpm install`、または依存関係修復を一切実行しません。ローカル
Plugin に依存関係がある場合は、それを読み込む前にその Plugin 内でインストールしてください。

サードパーティ TypeScript ローカル Plugin は緊急経路として Jiti 経由で読み込まれます。
パッケージ化済み JavaScript Plugin と bundled internal Plugin は、代わりに native
import/require 経由で読み込まれます。

## 起動と再読み込み

Gateway の起動と config reload は、Plugin 依存関係をインストールしません。
Plugin インストールレコードを読み取り、エントリポイントを計算して、それを読み込みます。

ランタイムで依存関係が欠けている場合、Plugin load は operator に明示的な修正を示すエラーで失敗します。

```bash
openclaw plugins update <id>
openclaw plugins install <source>
openclaw doctor --fix
```

`doctor --fix` は、legacy の OpenClaw 生成依存関係 state をクリーンアップし、config がまだ参照しているのにローカルインストールレコードから欠けている downloadable Plugin を復旧できます。Doctor は、すでにインストール済みのローカル Plugin の依存関係は修復しません。

## Bundled Plugin

軽量で core-critical な bundled Plugin は OpenClaw の一部として同梱されます。それらは重いランタイム依存関係ツリーを持たないか、ClawHub/npm 上の downloadable package へ移動すべきです。

core package に同梱される、外部インストールされる、または source-only のままの Plugin の現在の生成済みリストについては、
[Plugin inventory](/ja-JP/plugins/plugin-inventory) を参照してください。

Bundled Plugin manifest は dependency staging を要求してはなりません。大規模または任意の
Plugin 機能は通常の Plugin としてパッケージ化し、サードパーティ Plugin と同じ
npm/git/ClawHub 経路でインストールすべきです。

source checkout では、OpenClaw は repository を pnpm monorepo として扱います。
`pnpm install` 後、bundled Plugin は `extensions/<id>` から読み込まれるため、パッケージローカルの workspace 依存関係が利用可能になり、編集内容が直接反映されます。
source checkout 開発は pnpm のみです。repository root での単純な `npm install` は bundled Plugin の依存関係を準備しません。

| インストール形態                    | Bundled Plugin の場所               | 依存関係の所有者                                                     |
| -------------------------------- | ------------------------------------- | -------------------------------------------------------------------- |
| `npm install -g openclaw`        | パッケージ内のビルド済みランタイムツリー | OpenClaw パッケージおよび明示的な Plugin install/update/doctor フロー     |
| Git checkout と `pnpm install` | `extensions/<id>` workspace パッケージ  | 各 Plugin パッケージ自身の依存関係を含む pnpm workspace |
| `openclaw plugins install ...`   | 管理対象 npm project/git/ClawHub ルート  | Plugin install/update フロー                                       |

## Legacy cleanup

古い OpenClaw バージョンは、起動時または doctor repair 中に bundled-plugin 依存関係ルートを生成していました。現在の doctor cleanup は `--fix` により、古い `plugin-runtime-deps`
ルート、prune 済みの `plugin-runtime-deps` ターゲットを指す global Node-prefix パッケージ symlink、`.openclaw-runtime-deps*` manifest、生成済み
Plugin `node_modules`、install stage ディレクトリ、package-local pnpm
store を含む、これらの古いディレクトリと symlink を削除します。Packaged postinstall も legacy target root を prune する前にこれらの global symlink を削除するため、アップグレード後に参照切れの ESM
パッケージインポートが残ることはありません。

古い npm インストールは、共有の `~/.openclaw/npm/node_modules` ルートも使用していました。現在の install、update、uninstall、および doctor フローは、復旧とクリーンアップの目的でのみ、その legacy flat root を引き続き認識します。新しい npm インストールは、代わりに Plugin ごとの project root を作成します。
