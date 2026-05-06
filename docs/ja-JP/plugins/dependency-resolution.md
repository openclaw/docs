---
read_when:
    - Plugin パッケージのインストールをデバッグしています
    - Plugin の起動、doctor、またはパッケージマネージャーのインストール動作を変更している場合
    - パッケージ化されたOpenClawインストールまたはバンドルされたPluginマニフェストを保守している
sidebarTitle: Dependencies
summary: OpenClaw が Plugin パッケージをインストールし、Plugin の依存関係を解決する仕組み
title: Plugin の依存関係解決
x-i18n:
    generated_at: "2026-05-06T19:35:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: d51785b67d491d09e3a7a3ffcd6c991f7415c46b207596151dbc29b0c43e9341
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

OpenClaw は Plugin 依存関係の処理をインストール/更新時に行います。ランタイム読み込みでは、パッケージマネージャーの実行、依存関係ツリーの修復、OpenClaw パッケージディレクトリの変更は行いません。

## 責任分担

Plugin パッケージは自身の依存関係グラフを所有します。

- ランタイム依存関係は Plugin パッケージの `dependencies` または `optionalDependencies` に置きます
- SDK/core のインポートは peer、または OpenClaw が提供するインポートです
- ローカル開発用 Plugin は、すでにインストール済みの依存関係を自身で用意します
- npm および git Plugin は、OpenClaw 所有のパッケージルートにインストールされます

OpenClaw が所有するのは Plugin ライフサイクルのみです。

- Plugin ソースを検出する
- 明示的に要求されたときにパッケージをインストールまたは更新する
- インストールメタデータを記録する
- Plugin エントリポイントを読み込む
- 依存関係が不足している場合は、実行可能なエラーで失敗する

## インストールルート

OpenClaw はソースごとに安定したルートを使用します。

- npm パッケージは `~/.openclaw/npm` 配下にインストールされます
- git パッケージは `~/.openclaw/git` 配下に clone されます
- local/path/archive インストールは、依存関係の修復なしでコピーまたは参照されます

npm インストールは npm ルートで次のように実行されます。

```bash
npm install --prefix ~/.openclaw/npm <spec> --omit=dev --omit=peer --legacy-peer-deps --ignore-scripts --no-audit --no-fund
```

`openclaw plugins install npm-pack:<path.tgz>` は、ローカル npm-pack tarball に対して同じ管理対象 npm ルートを使用します。OpenClaw は tarball の npm メタデータを読み取り、コピーされた `file:` 依存関係として管理対象ルートに追加し、通常の npm install を実行してから、インストール済み lockfile メタデータを検証したうえで Plugin を信頼します。これは、ローカル pack アーティファクトが、模擬している registry アーティファクトと同じように動作すべき package-acceptance と release-candidate の証明を目的としています。

npm は推移的依存関係を Plugin パッケージの横にある `~/.openclaw/npm/node_modules` へ hoist する場合があります。OpenClaw はインストールを信頼する前に管理対象 npm ルートをスキャンし、アンインストール時には npm を使って npm 管理のパッケージを削除するため、hoist されたランタイム依存関係は管理対象のクリーンアップ境界内に残ります。

`openclaw/plugin-sdk/*` をインポートする Plugin は、`openclaw` を peer 依存関係として宣言します。OpenClaw は、ホストパッケージの別の registry コピーを npm が管理対象ルートにインストールすることを許可しません。古いホストパッケージが、後続の Plugin インストール時に npm の peer 解決へ影響する可能性があるためです。管理対象 npm インストールでは、共有ルートに対する npm の peer 解決/実体化をスキップし、OpenClaw はインストール、更新、アンインストール後に、ホスト peer を宣言しているインストール済みパッケージについて Plugin ローカルの `node_modules/openclaw` リンクを再適用します。

git インストールはリポジトリを clone または更新してから、次を実行します。

```bash
npm install --omit=dev --ignore-scripts --no-audit --no-fund
```

その後、インストール済み Plugin はそのパッケージディレクトリから読み込まれるため、パッケージローカルおよび親 `node_modules` の解決は通常の Node パッケージと同じように機能します。

## ローカル Plugin

ローカル Plugin は、開発者が管理するディレクトリとして扱われます。OpenClaw はこれらに対して `npm install`、`pnpm install`、依存関係の修復を実行しません。ローカル Plugin に依存関係がある場合は、読み込む前にその Plugin 内でインストールしてください。

サードパーティの TypeScript ローカル Plugin は、緊急用の Jiti パスを使用できます。パッケージ化された JavaScript Plugin とバンドル済み内部 Plugin は、Jiti ではなくネイティブの import/require を通じて読み込まれます。

## 起動と再読み込み

Gateway の起動と設定の再読み込みでは、Plugin 依存関係をインストールしません。Plugin インストールレコードを読み取り、エントリポイントを計算して読み込みます。

ランタイムで依存関係が不足している場合、Plugin の読み込みは失敗し、エラーは運用者に明示的な修正方法を示すべきです。

```bash
openclaw plugins update <id>
openclaw plugins install <source>
openclaw doctor --fix
```

`doctor --fix` は、従来の OpenClaw 生成の依存関係状態をクリーンアップし、設定から参照されているもののローカルインストールレコードに存在しないダウンロード可能な Plugin を復旧できます。Doctor は、すでにインストール済みのローカル Plugin の依存関係は修復しません。

## バンドル済み Plugin

軽量または core-critical なバンドル済み Plugin は、OpenClaw の一部として出荷されます。これらは重いランタイム依存関係ツリーを持たないようにするか、ClawHub/npm 上のダウンロード可能なパッケージへ移動する必要があります。

core パッケージに同梱される、外部インストールされる、または source-only のまま残る Plugin の現在の生成済み一覧については、[Plugin インベントリ](/ja-JP/plugins/plugin-inventory) を参照してください。

バンドル済み Plugin マニフェストは、依存関係のステージングを要求してはいけません。大規模または任意の Plugin 機能は、通常の Plugin としてパッケージ化し、サードパーティ Plugin と同じ npm/git/ClawHub パスを通じてインストールする必要があります。

ソース checkout では、OpenClaw はリポジトリを pnpm monorepo として扱います。`pnpm install` 後、バンドル済み Plugin は `extensions/<id>` から読み込まれるため、パッケージローカルの workspace 依存関係が利用でき、編集内容も直接反映されます。ソース checkout での開発は pnpm のみをサポートします。リポジトリルートでの単純な `npm install` は、バンドル済み Plugin 依存関係を準備する方法としてサポートされていません。

| インストール形態                 | バンドル済み Plugin の場所           | 依存関係の所有者                                                     |
| -------------------------------- | ------------------------------------- | -------------------------------------------------------------------- |
| `npm install -g openclaw`        | パッケージ内のビルド済みランタイムツリー | OpenClaw パッケージ、および明示的な Plugin install/update/doctor フロー |
| Git checkout plus `pnpm install` | `extensions/<id>` workspace パッケージ | 各 Plugin パッケージ自身の依存関係を含む pnpm workspace              |
| `openclaw plugins install ...`   | 管理対象 npm/git/ClawHub Plugin ルート | Plugin install/update フロー                                         |

## レガシーのクリーンアップ

古い OpenClaw バージョンは、起動時または doctor repair 中にバンドル済み Plugin の依存関係ルートを生成していました。現在の doctor cleanup は、`--fix` が使用されたときに、それらの古いディレクトリと symlink を削除します。これには、古い `plugin-runtime-deps` ルート、削除済みの `plugin-runtime-deps` ターゲットを指すグローバル Node-prefix パッケージ symlink、`.openclaw-runtime-deps*` マニフェスト、生成された Plugin `node_modules`、インストールステージディレクトリ、パッケージローカルの pnpm store が含まれます。パッケージ化された postinstall も、レガシーのターゲットルートを削除する前にこれらのグローバル symlink を削除するため、アップグレード後に壊れた ESM パッケージインポートが残りません。

これらのパスはレガシーの残骸にすぎません。新規インストールで作成されるべきではありません。
