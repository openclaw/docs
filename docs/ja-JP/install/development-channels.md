---
read_when:
    - stable / beta / dev を切り替えたい
    - 特定のバージョン、タグ、またはSHAをピン留めしたい
    - プレリリースをタグ付けまたは公開している
sidebarTitle: Release Channels
summary: 'stable、beta、devチャネル: セマンティクス、切り替え、ピン留め、タグ付け'
title: リリースチャネル
x-i18n:
    generated_at: "2026-04-24T05:03:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: d892f3b801cb480652e6e7e757c91c000e842689070564f18782c25108dafa3e
    source_path: install/development-channels.md
    workflow: 15
---

# 開発チャネル

OpenClawは3つの更新チャネルを提供します:

- **stable**: npm dist-tag `latest`。ほとんどのユーザーに推奨されます。
- **beta**: 現在存在する場合は npm dist-tag `beta`。betaが存在しない、または最新のstableリリースより古い場合、更新フローは `latest` にフォールバックします。
- **dev**: `main` の移動ヘッド（git）。npm dist-tag: `dev`（公開されている場合）。
  `main` ブランチは実験および活発な開発のためのものです。不完全な機能や互換性を壊す変更が含まれることがあります。本番Gatewayでは使用しないでください。

通常、stableビルドはまず **beta** に出荷され、そこでテストしたあと、明示的なpromote手順を実行して、検証済みビルドをバージョン番号を変えずに `latest` へ移します。必要に応じて、メンテナはstableリリースを直接 `latest` に公開することもできます。npmインストールではdist-tagが唯一の真実のソースです。

## チャネルの切り替え

```bash
openclaw update --channel stable
openclaw update --channel beta
openclaw update --channel dev
```

`--channel` は選択を設定（`update.channel`）に永続化し、インストール方法も一致させます:

- **`stable`**（package installs）: npm dist-tag `latest` 経由で更新します。
- **`beta`**（package installs）: npm dist-tag `beta` を優先しますが、`beta` が存在しない、または現在のstableタグより古い場合は `latest` にフォールバックします。
- **`stable`**（git installs）: 最新のstable git tagをcheckoutします。
- **`beta`**（git installs）: 最新のbeta git tagを優先しますが、betaが存在しない、またはより古い場合は最新のstable git tagにフォールバックします。
- **`dev`**: git checkoutを確実に用意し（デフォルト `~/openclaw`、`OPENCLAW_GIT_DIR` で上書き可能）、`main` に切り替え、upstreamにrebaseし、ビルドし、そのcheckoutからグローバルCLIをインストールします。

ヒント: stable + dev を並行して使いたい場合は、cloneを2つ保持し、gatewayをstable側に向けてください。

## バージョンまたはタグを1回だけ指定する

永続化されたチャネルを変更せず、1回の更新だけ特定のdist-tag、バージョン、またはpackage specを対象にするには `--tag` を使います:

```bash
# 特定バージョンをインストール
openclaw update --tag 2026.4.1-beta.1

# beta dist-tagからインストール（1回限り、永続化しない）
openclaw update --tag beta

# GitHub mainブランチからインストール（npm tarball）
openclaw update --tag main

# 特定のnpm package specをインストール
openclaw update --tag openclaw@2026.4.1-beta.1
```

注記:

- `--tag` は**package（npm）インストールのみ**に適用されます。git installsでは無視されます。
- タグは永続化されません。次回の `openclaw update` では、通常どおり設定済みチャネルが使われます。
- ダウングレード保護: 対象バージョンが現在のバージョンより古い場合、OpenClawは確認を求めます（`--yes` でスキップ）。
- `--channel beta` は `--tag beta` とは異なります。チャネルフローでは、betaが存在しない、またはより古い場合にstable/latestへフォールバックできますが、`--tag beta` はその1回に限り生の `beta` dist-tag を対象にします。

## Dry run

変更を加えずに、`openclaw update` が何をするかをプレビューします:

```bash
openclaw update --dry-run
openclaw update --channel beta --dry-run
openclaw update --tag 2026.4.1-beta.1 --dry-run
openclaw update --dry-run --json
```

dry runでは、有効なチャネル、対象バージョン、予定されているアクション、およびダウングレード確認が必要かどうかが表示されます。

## Pluginとチャネル

`openclaw update` でチャネルを切り替えると、OpenClawはPluginソースも同期します:

- `dev` では、git checkoutからのバンドル済みPluginを優先します。
- `stable` と `beta` では、npmインストール済みPlugin packageを復元します。
- npmインストール済みPluginは、コア更新完了後に更新されます。

## 現在の状態を確認する

```bash
openclaw update status
```

アクティブなチャネル、install kind（git または package）、現在のバージョン、ソース（config、git tag、git branch、または default）を表示します。

## タグ付けのベストプラクティス

- git checkoutの着地点にしたいリリースにはタグを付けてください（stableは `vYYYY.M.D`、betaは `vYYYY.M.D-beta.N`）。
- 互換性のため `vYYYY.M.D.beta.N` も認識されますが、`-beta.N` を推奨します。
- 従来の `vYYYY.M.D-<patch>` タグも引き続きstable（非beta）として認識されます。
- タグは不変に保ってください。タグを移動または再利用しないでください。
- npmインストールではdist-tagが引き続き唯一の真実のソースです:
  - `latest` -> stable
  - `beta` -> 候補ビルドまたはbeta先行stableビルド
  - `dev` -> mainスナップショット（任意）

## macOSアプリの提供状況

Betaおよびdevビルドには、**macOSアプリのリリースが含まれない**ことがあります。これは問題ありません:

- git tagとnpm dist-tagはそれでも公開できます。
- リリースノートまたはchangelogで「このbetaにはmacOSビルドはありません」と明記してください。

## 関連

- [更新](/ja-JP/install/updating)
- [インストーラ内部](/ja-JP/install/installer)
