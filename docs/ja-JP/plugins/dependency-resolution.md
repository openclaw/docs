---
read_when:
    - Plugin パッケージのインストールをデバッグしている場合
    - Plugin の起動、doctor、またはパッケージマネージャーのインストール動作を変更している場合
    - パッケージ化された OpenClaw インストールまたは同梱 Plugin マニフェストを保守している場合
sidebarTitle: Dependencies
summary: OpenClaw が Plugin パッケージをインストールし、Plugin の依存関係を解決する仕組み
title: Plugin の依存関係の解決
x-i18n:
    generated_at: "2026-07-11T22:26:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ae24a82568e275399cb7b68729d2805956792852612f84d6918850305f0eb243
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

OpenClaw は Plugin の依存関係をインストール時または更新時にのみ処理します。ランタイムでの
読み込み時にパッケージマネージャーを実行したり、依存関係ツリーを修復したり、
OpenClaw のパッケージディレクトリを変更したりすることはありません。

## 責任の分担

Plugin パッケージは自身の依存関係グラフを管理します。

- ランタイム依存関係は、Plugin パッケージの `dependencies` または
  `optionalDependencies` に含めます。
- SDK/core のインポートは、ピア依存関係または OpenClaw が提供するインポートです。
- ローカル開発用 Plugin は、すでにインストール済みの依存関係を自身で用意します。
- npm および git の Plugin は、OpenClaw が管理するパッケージルートにインストールされます。

OpenClaw が管理するのは Plugin のライフサイクルのみです。

- Plugin のソースを検出します。
- 明示的に要求された場合にパッケージをインストールまたは更新します。
- インストールメタデータを記録します。
- Plugin のエントリポイントを読み込みます。
- 依存関係が不足している場合は、対処方法を示すエラーで失敗します。

## インストールルート

OpenClaw はソースごとに安定したルートを使用します。

- npm パッケージは、
  `~/.openclaw/npm/projects/<encoded-package>` 配下の Plugin ごとのプロジェクトにインストールされます。
- git パッケージは `~/.openclaw/git` 配下にクローンされます。
- ローカル、パス、アーカイブからのインストールは、依存関係を
  修復せずにコピーまたは参照されます。

npm のインストールは、その Plugin ごとのプロジェクトルートで実行されます。

```bash
cd ~/.openclaw/npm/projects/<encoded-package>
npm install --omit=dev --omit=peer --legacy-peer-deps --ignore-scripts --no-audit --no-fund
```

`openclaw plugins install npm-pack:<path.tgz>` は、ローカルの npm-pack tarball にも同じ Plugin ごとの npm
プロジェクトルートを使用します。OpenClaw は tarball の npm
メタデータを読み取り、コピーされた `file:` 依存関係として管理対象プロジェクトに追加し、
前述の通常の npm インストールを実行してから、インストール済みの lockfile メタデータを
検証したうえで Plugin を信頼します。この経路はパッケージ受け入れ検証と
リリース候補の証明用です。ローカルの pack 成果物を、それが模擬する
レジストリ成果物と同様に動作させるために使用します。

公開前に公式または外部の Plugin パッケージをテストする場合は、`npm-pack:` を使用します。
未加工のアーカイブまたはパスからのインストールはローカルデバッグに便利ですが、
インストール済みの npm または ClawHub
パッケージと同じ依存関係経路を証明するものではありません。`npm-pack:` は管理対象パッケージのインストール形態を証明しますが、それだけでは
Plugin がカタログに関連付けられた公式コンテンツであることの証明にはなりません。

動作がバンドル済み Plugin または信頼された公式 Plugin の状態に依存する場合は、
ローカルパッケージの証明と、カタログに基づく公式インストールまたは
公式の信頼情報を記録する公開済みパッケージ経路を組み合わせます。特権ヘルパーへのアクセスと
信頼済み公式スコープの処理は、ローカル tarball のインストールから推測せず、
その信頼されたインストール経路で検証する必要があります。

Plugin がランタイムでインポート不足により失敗する場合は、管理対象プロジェクトを
手動で修復するのではなく、パッケージマニフェストを修正します。ランタイムインポートは
Plugin パッケージの `dependencies` または `optionalDependencies` に含める必要があります。`devDependencies`
は管理対象のランタイムプロジェクトにはインストールされません。
`~/.openclaw/npm/projects/<encoded-package>` 内でローカルに `npm install` を実行すると、
一時的な診断を続行できる場合がありますが、パッケージ受け入れ検証にはなりません。次回のインストールまたは
更新時に、パッケージメタデータからプロジェクトが再作成されるためです。

npm は推移的依存関係を、Plugin パッケージと同じ Plugin ごとのプロジェクトの
`node_modules` に巻き上げることがあります。OpenClaw はインストールを信頼する前に管理対象プロジェクトの
ルートをスキャンし、アンインストール時にそのプロジェクトを削除するため、
巻き上げられたランタイム依存関係はその Plugin のクリーンアップ境界内に維持されます。

公開済みの npm Plugin パッケージには `npm-shrinkwrap.json` を同梱できます。npm はインストール時にその
公開可能な lockfile を使用し、OpenClaw の管理対象 npm プロジェクトルートは
通常のインストール経路を通じてこれをサポートします。OpenClaw が管理する公開可能な
Plugin パッケージには、そのパッケージで公開される依存関係グラフから生成された
パッケージローカルの shrinkwrap を含める必要があります。

```bash
pnpm deps:shrinkwrap:generate
pnpm deps:shrinkwrap:check
```

ジェネレーターは Plugin の `devDependencies` を除去し、ワークスペースのオーバーライド
ポリシーを適用して、`openclaw.release.publishToNpm: true` が設定された各 Plugin の
`extensions/<id>/npm-shrinkwrap.json` を書き出します。サードパーティーの Plugin パッケージにも
shrinkwrap を同梱できます。OpenClaw はコミュニティパッケージに対してこれを必須とはしませんが、
存在する場合は npm が使用します。

ローカルパッケージをリリース候補の証明として扱う前に、インストール対象の
tarball を確認します。

```bash
npm pack --pack-destination /tmp
tar -xOf /tmp/<plugin-package>.tgz package/package.json
tar -tf /tmp/<plugin-package>.tgz | grep '^package/dist/'
```

依存関係を変更した場合は、開発用依存関係なしの本番インストールで
ランタイムパッケージを解決できることも確認します。

```bash
tmpdir=$(mktemp -d)
(
  cd "$tmpdir"
  npm init -y >/dev/null
  npm install --package-lock-only --omit=dev --omit=peer --legacy-peer-deps --ignore-scripts /tmp/<plugin-package>.tgz
)
rm -rf "$tmpdir"
```

OpenClaw が管理する npm Plugin パッケージは、明示的な
`bundledDependencies` を指定して公開することもできます。npm の公開経路はランタイム依存関係の
名前一覧をオーバーレイし、公開されるマニフェストから開発専用のワークスペースメタデータを除去し、
パッケージローカルのランタイム依存関係に対してスクリプトを実行しない npm インストールを行った後、
それらの依存関係ファイルを含む Plugin の tarball を pack または公開します。
ネイティブ依存の大きいパッケージ（Codex、ACPX、Copilot、llama.cpp、
memory-lancedb、Tlon）は、
`openclaw.release.bundleRuntimeDependencies: false` を指定して対象外とします。これらにも
shrinkwrap は同梱されますが、すべてのプラットフォーム用バイナリを Plugin の tarball に
埋め込む代わりに、インストール時に npm がランタイム依存関係を解決します。ルートの `openclaw`
パッケージは、依存関係ツリー全体をバンドルしません。

`openclaw/plugin-sdk/*` をインポートする Plugin は、`openclaw` をピア
依存関係として宣言します。OpenClaw は、ホストパッケージの別のレジストリコピーを npm が
管理対象プロジェクトにインストールすることを許可しません。古いホストパッケージが、その Plugin 内での
npm のピア解決に影響する可能性があるためです。管理対象の npm インストールでは、npm のピア
解決と実体化を省略します。また OpenClaw は、インストールまたは更新後に、
ホストのピア依存関係を宣言しているインストール済みパッケージについて、Plugin ローカルの
`node_modules/openclaw` リンクを再設定します。

git からのインストールでは、リポジトリをクローンまたは更新してから、次を実行します。

```bash
npm install --omit=dev --ignore-scripts --no-audit --no-fund
```

インストール済みの Plugin はそのパッケージディレクトリから読み込まれるため、
パッケージローカルおよび親の `node_modules` の解決は、通常の Node パッケージと
同じように機能します。

## ローカル Plugin

ローカル Plugin は開発者が管理するディレクトリです。OpenClaw はそれらに対して
`npm install`、`pnpm install`、または依存関係の修復を実行しません。ローカル
Plugin に依存関係がある場合は、読み込む前にその Plugin 内でインストールします。

サードパーティー製の TypeScript ローカル Plugin は、緊急時の経路として Jiti を介して読み込まれます。
パッケージ化された JavaScript Plugin とバンドル済みの内部 Plugin は、代わりにネイティブの
import/require を介して読み込まれます。

## 起動と再読み込み

Gateway の起動時および設定の再読み込み時に、Plugin の依存関係がインストールされることはありません。
Plugin のインストール記録を読み取り、エントリポイントを計算して読み込みます。

ランタイムで依存関係が不足している場合、Plugin の読み込みは失敗し、
運用者に明示的な修正方法を示すエラーが表示されます。

```bash
openclaw plugins update <id>
openclaw plugins install <source>
openclaw doctor --fix
```

`doctor --fix` は、OpenClaw が生成した旧形式の依存関係状態をクリーンアップします。また、
設定から引き続き参照されているものの、ローカルのインストール記録から欠落している
ダウンロード可能な Plugin を復旧できます。Doctor は、すでにインストールされている
ローカル Plugin の依存関係を修復しません。

## バンドル済み Plugin

軽量で core に不可欠なバンドル済み Plugin は、OpenClaw の一部として提供されます。これらは
大規模なランタイム依存関係ツリーを持たないようにするか、ClawHub/npm 上の
ダウンロード可能なパッケージに移行する必要があります。

core パッケージに同梱される Plugin、外部インストールされる Plugin、またはソース専用として維持される Plugin の
現在の生成済み一覧については、
[Plugin インベントリ](/ja-JP/plugins/plugin-inventory)を参照してください。

バンドル済み Plugin のマニフェストは、依存関係のステージングを要求してはなりません。大規模または
任意の Plugin 機能は、通常の Plugin としてパッケージ化し、
サードパーティー製 Plugin と同じ npm/git/ClawHub 経路でインストールする必要があります。

ソースチェックアウトでは、OpenClaw はリポジトリを pnpm モノレポとして扱います。
`pnpm install` の実行後、バンドル済み Plugin は `extensions/<id>` から読み込まれるため、
パッケージローカルのワークスペース依存関係を利用でき、編集内容が直接反映されます。
ソースチェックアウトでの開発は pnpm 専用です。リポジトリルートで通常の `npm install` を
実行しても、バンドル済み Plugin の依存関係は準備されません。

| インストール形態                 | バンドル済み Plugin の場所             | 依存関係の管理者                                                       |
| -------------------------------- | ------------------------------------- | -------------------------------------------------------------------- |
| `npm install -g openclaw`        | パッケージ内のビルド済みランタイムツリー | OpenClaw パッケージ、および明示的な Plugin のインストール、更新、doctor フロー |
| Git チェックアウトと `pnpm install` | `extensions/<id>` ワークスペースパッケージ | 各 Plugin パッケージ自身の依存関係を含む pnpm ワークスペース                 |
| `openclaw plugins install ...`   | 管理対象の npm プロジェクト/git/ClawHub ルート | Plugin のインストールおよび更新フロー                                    |

## 旧形式のクリーンアップ

以前の OpenClaw バージョンでは、起動時または doctor による修復時に、
バンドル済み Plugin の依存関係ルートが生成されていました。現在の doctor のクリーンアップでは、
`--fix` により、それらの古いディレクトリとシンボリックリンクを削除します。対象には、古い
`plugin-runtime-deps` ルート、削除済みの
`plugin-runtime-deps` ターゲットを指すグローバル Node プレフィックスのパッケージシンボリックリンク、
`.openclaw-runtime-deps*` マニフェスト、生成された
Plugin の `node_modules`、インストール用ステージディレクトリ、パッケージローカルの pnpm
ストアが含まれます。パッケージ化された postinstall も、旧形式のターゲットルートを
削除する前に、それらのグローバルシンボリックリンクを削除します。これにより、アップグレード後に参照先のない ESM
パッケージインポートが残ることを防ぎます。

以前の npm インストールでは、共有の `~/.openclaw/npm/node_modules` ルートも使用されていました。
現在のインストール、更新、アンインストール、doctor の各フローでは、復旧とクリーンアップに限り、
この旧形式のフラットなルートを引き続き認識します。新しい npm インストールでは、
代わりに Plugin ごとのプロジェクトルートを作成します。
