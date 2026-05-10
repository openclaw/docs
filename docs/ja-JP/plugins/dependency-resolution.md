---
read_when:
    - Plugin パッケージのインストールをデバッグしています
    - Plugin の起動、doctor、またはパッケージマネージャーのインストール動作を変更しています
    - パッケージ化された OpenClaw インストールまたは同梱 Plugin マニフェストを保守している
sidebarTitle: Dependencies
summary: OpenClaw が Plugin パッケージをインストールし、Plugin の依存関係を解決する仕組み
title: Plugin の依存関係の解決
x-i18n:
    generated_at: "2026-05-10T19:43:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: eb9637f46f273de976ff9203d23558d8bb51922b347871bc71917ef61d3c04a3
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

OpenClaw は Plugin の依存関係作業をインストール時または更新時に行います。ランタイム読み込みでは、パッケージマネージャーの実行、依存関係ツリーの修復、OpenClaw パッケージディレクトリの変更は行いません。

## 責任分担

Plugin パッケージは自身の依存関係グラフを所有します。

- ランタイム依存関係は Plugin パッケージの `dependencies` または `optionalDependencies` に置く
- SDK/コアのインポートはピア依存関係、または OpenClaw から提供されるインポートにする
- ローカル開発用 Plugin は、すでにインストール済みの自身の依存関係を持ち込む
- npm および git Plugin は、OpenClaw が所有するパッケージルートにインストールされる

OpenClaw は Plugin ライフサイクルだけを所有します。

- Plugin ソースを検出する
- 明示的に要求されたときにパッケージをインストールまたは更新する
- インストールメタデータを記録する
- Plugin エントリポイントを読み込む
- 依存関係が不足している場合は、実行可能なエラーで失敗する

## インストールルート

OpenClaw はソースごとに安定したルートを使用します。

- npm パッケージは `~/.openclaw/npm` の下にインストールされる
- git パッケージは `~/.openclaw/git` の下にクローンされる
- ローカル/パス/アーカイブのインストールは、依存関係の修復なしでコピーまたは参照される

npm インストールは npm ルートで次を実行します。

```bash
cd ~/.openclaw/npm
npm install --omit=dev --omit=peer --legacy-peer-deps --ignore-scripts --no-audit --no-fund
```

`openclaw plugins install npm-pack:<path.tgz>` は、ローカルの npm-pack tarball に対して同じ管理対象 npm ルートを使用します。OpenClaw は tarball の npm メタデータを読み取り、コピーされた `file:` 依存関係として管理対象ルートに追加し、通常の npm インストールを実行してから、Plugin を信頼する前にインストール済み lockfile メタデータを検証します。これは、ローカルの pack アーティファクトが、それが模擬するレジストリアーティファクトのように振る舞うべきパッケージ受け入れおよびリリース候補の証明を目的としています。

npm は推移的依存関係を Plugin パッケージの横にある `~/.openclaw/npm/node_modules` に巻き上げることがあります。OpenClaw はインストールを信頼する前に管理対象 npm ルートをスキャンし、アンインストール時には npm を使って npm 管理パッケージを削除するため、巻き上げられたランタイム依存関係は管理対象のクリーンアップ境界内に留まります。

`openclaw/plugin-sdk/*` をインポートする Plugin は、`openclaw` をピア依存関係として宣言します。古いホストパッケージは後続の Plugin インストール中に npm のピア解決に影響する可能性があるため、OpenClaw は npm がホストパッケージの別のレジストリコピーを管理対象ルートへインストールすることを許可しません。管理対象 npm インストールは共有ルートでの npm ピア解決/具現化をスキップし、OpenClaw はインストール、更新、またはアンインストール後に、ホストピアを宣言しているインストール済みパッケージについて Plugin ローカルの `node_modules/openclaw` リンクを再確立します。

git インストールはリポジトリをクローンまたは更新してから、次を実行します。

```bash
npm install --omit=dev --ignore-scripts --no-audit --no-fund
```

その後、インストール済み Plugin はそのパッケージディレクトリから読み込まれるため、パッケージローカルおよび親 `node_modules` の解決は通常の Node パッケージと同じように機能します。

## ローカル Plugin

ローカル Plugin は開発者が管理するディレクトリとして扱われます。OpenClaw はそれらに対して `npm install`、`pnpm install`、または依存関係の修復を実行しません。ローカル Plugin に依存関係がある場合は、読み込む前にその Plugin 内でインストールしてください。

サードパーティの TypeScript ローカル Plugin は緊急用 Jiti パスを使用できます。パッケージ化された JavaScript Plugin とバンドルされた内部 Plugin は、Jiti ではなくネイティブの import/require を通じて読み込まれます。

## 起動と再読み込み

Gateway の起動と設定の再読み込みでは、Plugin 依存関係は一切インストールされません。Plugin インストール記録を読み取り、エントリポイントを計算し、それを読み込みます。

ランタイムで依存関係が不足している場合、Plugin の読み込みは失敗し、エラーはオペレーターに明示的な修正方法を示す必要があります。

```bash
openclaw plugins update <id>
openclaw plugins install <source>
openclaw doctor --fix
```

`doctor --fix` は、OpenClaw が生成したレガシーな依存関係状態をクリーンアップし、設定で参照されているのにローカルのインストール記録から欠落しているダウンロード可能な Plugin を復旧できます。Doctor は、すでにインストール済みのローカル Plugin の依存関係は修復しません。

## バンドル Plugin

軽量でコアに不可欠なバンドル Plugin は、OpenClaw の一部として同梱されます。それらは重いランタイム依存関係ツリーを持たないか、ClawHub/npm 上のダウンロード可能パッケージへ移動されるべきです。

コアパッケージに同梱される、外部にインストールされる、またはソース専用のままになる Plugin の現在の生成済み一覧については、[Plugin インベントリ](/ja-JP/plugins/plugin-inventory)を参照してください。

バンドル Plugin の manifest は、依存関係ステージングを要求してはいけません。大規模または任意の Plugin 機能は通常の Plugin としてパッケージ化し、サードパーティ Plugin と同じ npm/git/ClawHub パスを通じてインストールする必要があります。

ソースチェックアウトでは、OpenClaw はリポジトリを pnpm モノレポとして扱います。`pnpm install` の後、バンドル Plugin は `extensions/<id>` から読み込まれるため、パッケージローカルのワークスペース依存関係が利用可能になり、編集内容が直接反映されます。ソースチェックアウトでの開発は pnpm のみ対応です。リポジトリルートでの通常の `npm install` は、バンドル Plugin の依存関係を準備する方法としてサポートされていません。

| インストール形態                 | バンドル Plugin の場所                | 依存関係の所有者                                                     |
| -------------------------------- | ------------------------------------- | -------------------------------------------------------------------- |
| `npm install -g openclaw`        | パッケージ内のビルド済みランタイムツリー | OpenClaw パッケージ、および明示的な Plugin インストール/更新/doctor フロー |
| Git チェックアウトと `pnpm install` | `extensions/<id>` ワークスペースパッケージ | 各 Plugin パッケージ自身の依存関係を含む pnpm ワークスペース |
| `openclaw plugins install ...`   | 管理対象 npm/git/ClawHub Plugin ルート | Plugin インストール/更新フロー                                       |

## レガシークリーンアップ

古い OpenClaw バージョンは、起動時または doctor 修復中にバンドル Plugin の依存関係ルートを生成していました。現在の doctor クリーンアップは、`--fix` が使われたときにそれらの古いディレクトリとシンボリックリンクを削除します。これには、古い `plugin-runtime-deps` ルート、削除済みの `plugin-runtime-deps` ターゲットを指すグローバル Node プレフィックスのパッケージシンボリックリンク、`.openclaw-runtime-deps*` manifest、生成された Plugin の `node_modules`、インストールステージディレクトリ、パッケージローカルの pnpm ストアが含まれます。パッケージ化された postinstall も、レガシーターゲットルートを削除する前にそれらのグローバルシンボリックリンクを削除するため、アップグレード後に壊れた ESM パッケージインポートが残りません。

これらのパスはレガシーな残骸にすぎません。新規インストールで作成されるべきではありません。
