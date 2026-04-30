---
read_when:
    - stable/beta/dev を切り替えたい場合
    - 特定のバージョン、タグ、または SHA を固定したい場合
    - プレリリースのタグ付けまたは公開を行っている
sidebarTitle: Release Channels
summary: '安定版、ベータ版、開発版チャネル: 意味、切り替え、固定、タグ付け'
title: リリースチャネル
x-i18n:
    generated_at: "2026-04-30T05:19:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 741d8ed2a1599264e1b41a99e81fac4b06d14cb026aa945a8757b15e5733f682
    source_path: install/development-channels.md
    workflow: 16
---

# 開発チャネル

OpenClawは3つの更新チャネルを提供しています:

- **stable**: npm dist-tag `latest`。ほとんどのユーザーに推奨されます。
- **beta**: 最新の場合は npm dist-tag `beta`。beta が存在しない、または
  最新の stable リリースより古い場合、更新フローは `latest` にフォールバックします。
- **dev**: `main` の移動する先頭（git）。npm dist-tag: `dev`（公開されている場合）。
  `main` ブランチは実験とアクティブな開発用です。不完全な機能や破壊的変更が
  含まれる場合があります。本番用Gatewayには使用しないでください。

通常は stable ビルドをまず **beta** に出荷し、そこでテストしてから、検証済みのビルドを
バージョン番号を変更せずに `latest` へ移動する明示的な昇格ステップを実行します。
メンテナーは必要に応じて stable リリースを直接 `latest` に公開することもできます。
Dist-tag は npm インストールにおける信頼できる情報源です。

## チャネルの切り替え

```bash
openclaw update --channel stable
openclaw update --channel beta
openclaw update --channel dev
```

`--channel` は選択内容を設定（`update.channel`）に永続化し、インストール方法を揃えます:

- **`stable`**（パッケージインストール）: npm dist-tag `latest` 経由で更新します。
- **`beta`**（パッケージインストール）: npm dist-tag `beta` を優先しますが、`beta` が存在しない、
  または現在の stable タグより古い場合は `latest` にフォールバックします。
- **`stable`**（git インストール）: 最新の stable git タグをチェックアウトします。
- **`beta`**（git インストール）: 最新の beta git タグを優先しますが、beta が存在しない、または古い場合は
  最新の stable git タグにフォールバックします。
- **`dev`**: git チェックアウト（デフォルトは `~/openclaw`、`OPENCLAW_GIT_DIR` で上書き可能）を確保し、
  `main` に切り替え、upstream にリベースし、ビルドして、そのチェックアウトからグローバルCLIをインストールします。

<Tip>
stable と dev を並行して使いたい場合は、2つのクローンを保持し、Gatewayを stable 側に向けてください。
</Tip>

## 1回限りのバージョンまたはタグ指定

永続化されたチャネルを変更せずに、1回の更新で特定の dist-tag、バージョン、またはパッケージ仕様を
対象にするには `--tag` を使用します:

```bash
# Install a specific version
openclaw update --tag 2026.4.1-beta.1

# Install from the beta dist-tag (one-off, does not persist)
openclaw update --tag beta

# Install from GitHub main branch (npm tarball)
openclaw update --tag main

# Install a specific npm package spec
openclaw update --tag openclaw@2026.4.1-beta.1
```

注:

- `--tag` は **パッケージ（npm）インストールのみ** に適用されます。git インストールでは無視されます。
- タグは永続化されません。次回の `openclaw update` は通常どおり設定済みの
  チャネルを使用します。
- ダウングレード保護: 対象バージョンが現在のバージョンより古い場合、
  OpenClawは確認を求めます（`--yes` でスキップ）。
- `--channel beta` は `--tag beta` とは異なります。チャネルフローは beta が存在しない、または古い場合に
  stable/latest へフォールバックできますが、`--tag beta` はその1回の実行で
  生の `beta` dist-tag を対象にします。

## ドライラン

変更を加えずに `openclaw update` が何を行うかをプレビューします:

```bash
openclaw update --dry-run
openclaw update --channel beta --dry-run
openclaw update --tag 2026.4.1-beta.1 --dry-run
openclaw update --dry-run --json
```

ドライランでは、有効なチャネル、対象バージョン、予定されるアクション、
ダウングレード確認が必要かどうかが表示されます。

## Pluginとチャネル

`openclaw update` でチャネルを切り替えると、OpenClawはPluginソースも同期します:

- `dev` は git チェックアウト内のバンドルPluginを優先します。
- `stable` と `beta` は npm でインストールされたPluginパッケージを復元します。
- npm でインストールされたPluginは、コア更新の完了後に更新されます。

## 現在の状態の確認

```bash
openclaw update status
```

アクティブなチャネル、インストール種別（git またはパッケージ）、現在のバージョン、
ソース（設定、git タグ、git ブランチ、またはデフォルト）を表示します。

## タグ付けのベストプラクティス

- git チェックアウトで到達させたいリリースにタグを付けます（stable は `vYYYY.M.D`、
  beta は `vYYYY.M.D-beta.N`）。
- `vYYYY.M.D.beta.N` も互換性のため認識されますが、`-beta.N` を推奨します。
- 従来の `vYYYY.M.D-<patch>` タグは、引き続き stable（非 beta）として認識されます。
- タグは不変に保ってください。タグを移動したり再利用したりしないでください。
- npm dist-tag は npm インストールにおける信頼できる情報源のままです:
  - `latest` -> stable
  - `beta` -> 候補ビルドまたは beta 先行の stable ビルド
  - `dev` -> main スナップショット（任意）

## macOSアプリの利用可否

Beta と dev ビルドには macOS アプリリリースが含まれない場合があります。それで問題ありません:

- git タグと npm dist-tag は引き続き公開できます。
- リリースノートまたは変更履歴で「この beta には macOS ビルドがありません」と明記してください。

## 関連

- [更新](/ja-JP/install/updating)
- [インストーラー内部](/ja-JP/install/installer)
