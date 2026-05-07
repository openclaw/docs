---
read_when:
    - stable/beta/dev を切り替えたい場合
    - 特定のバージョン、タグ、または SHA を固定したい場合
    - プレリリースにタグを付けるか公開している場合
sidebarTitle: Release Channels
summary: stable、beta、dev チャンネル：セマンティクス、切り替え、固定、タグ付け
title: リリースチャンネル
x-i18n:
    generated_at: "2026-05-07T01:52:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6579110cc5c0e62ef238d7e4200db5fea188f35dc9366a17b3cf92a58c8935cc
    source_path: install/development-channels.md
    workflow: 16
---

OpenClaw には 3 つの更新チャネルがあります:

- **stable**: npm dist-tag `latest`。ほとんどのユーザーに推奨されます。
- **beta**: 現行の場合は npm dist-tag `beta`。beta がない、または最新の安定リリースより古い場合、
  更新フローは `latest` にフォールバックします。
- **dev**: `main` (git) の移動する先頭。npm dist-tag: `dev` (公開されている場合)。
  `main` ブランチは実験と活発な開発用です。未完成の機能や破壊的変更が含まれる場合があります。
  本番環境の Gateway には使用しないでください。

通常、安定ビルドはまず **beta** にリリースし、そこでテストしてから、
検証済みのビルドをバージョン番号を変更せずに `latest` へ移動する
明示的な昇格ステップを実行します。必要に応じて、メンテナーは安定リリースを
直接 `latest` に公開することもできます。npm
インストールでは dist-tag が信頼できる唯一の情報源です。

## 計画中の月次サポートライン

OpenClaw はまだ LTS や月次サポートチャネルを提供していません。ユーザーがより静かな
ラインに留まりつつ、`latest` は高速に動き続けられるように、SemVer 互換の月次サポートラインに
向けて取り組んでいます。

計画中のバージョン形式は `YYYY.M.PATCH` です:

- `YYYY` は年です。
- `M` は月次リリースラインで、先頭のゼロは付けません。
- `PATCH` はその月次ライン内で増加し、必要に応じて 100 を超えることもあります。

将来のタグ例:

- 6 月ラインの `v2026.6.0`、`v2026.6.1`、`v2026.6.2`。
- fast/latest トレイン上のプレリリース用 `v2026.6.3-beta.1`。
- `stable-2026-6` や `lts-2026-6` のような将来のサポートライン dist-tag が
  月次ラインを指す場合がありますが、現在そのようなチャネルは利用できません。

その移行が完了するまでは、公開更新チャネルは `stable`、`beta`、
`dev` のままです。

## チャネルの切り替え

```bash
openclaw update --channel stable
openclaw update --channel beta
openclaw update --channel dev
```

`--channel` は選択を設定 (`update.channel`) に保存し、
インストール方法を合わせます:

- **`stable`** (パッケージインストール): npm dist-tag `latest` 経由で更新します。
- **`beta`** (パッケージインストール): npm dist-tag `beta` を優先しますが、
  `beta` がない、または現在の安定タグより古い場合は `latest` にフォールバックします。
- **`stable`** (git インストール): 最新の安定 git タグをチェックアウトします。
- **`beta`** (git インストール): 最新の beta git タグを優先しますが、
  beta がない、または古い場合は最新の安定 git タグにフォールバックします。
- **`dev`**: git チェックアウトを確保し (既定は `~/openclaw`、`OPENCLAW_GIT_DIR` で上書き可能)、
  `main` に切り替え、upstream にリベースし、ビルドして、そのチェックアウトから
  グローバル CLI をインストールします。

<Tip>
stable と dev を並行して使いたい場合は、2 つのクローンを保持し、Gateway を stable 側に向けてください。
</Tip>

## 1 回限りのバージョンまたはタグ指定

`--tag` を使用すると、保存済みチャネルを変更**せずに**、1 回の更新だけ特定の dist-tag、
バージョン、またはパッケージ spec を対象にできます:

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

注記:

- `--tag` は**パッケージ (npm) インストールにのみ**適用されます。git インストールでは無視されます。
- タグは保存されません。次回の `openclaw update` は通常どおり設定済みの
  チャネルを使用します。
- ダウングレード保護: 対象バージョンが現在のバージョンより古い場合、
  OpenClaw は確認を求めます (`--yes` でスキップ)。
- `--channel beta` は `--tag beta` とは異なります。チャネルフローは
  beta がない、または古い場合に stable/latest へフォールバックできますが、`--tag beta` は
  その 1 回の実行で生の `beta` dist-tag を対象にします。

## ドライラン

変更を加えずに `openclaw update` が行う内容をプレビューします:

```bash
openclaw update --dry-run
openclaw update --channel beta --dry-run
openclaw update --tag 2026.4.1-beta.1 --dry-run
openclaw update --dry-run --json
```

ドライランでは、有効なチャネル、対象バージョン、予定されているアクション、
およびダウングレード確認が必要かどうかが表示されます。

## Plugins とチャネル

`openclaw update` でチャネルを切り替えると、OpenClaw は Plugin
ソースも同期します:

- `dev` は git チェックアウト内のバンドル済み Plugins を優先します。
- `stable` と `beta` は npm でインストールされた Plugin パッケージを復元します。
- npm でインストールされた Plugins は、コア更新の完了後に更新されます。

## 現在の状態の確認

```bash
openclaw update status
```

有効なチャネル、インストール種別 (git またはパッケージ)、現在のバージョン、
ソース (設定、git タグ、git ブランチ、または既定値) を表示します。

## タグ付けのベストプラクティス

- git チェックアウトが着地してほしいリリースにタグを付けます (現在の安定リリースは `vYYYY.M.D`、
  現在の beta リリースは `vYYYY.M.D-beta.N`)。
- `vYYYY.M.D.beta.N` も互換性のために認識されますが、`-beta.N` を推奨します。
- レガシーな `vYYYY.M.D-<patch>` タグも安定版 (非 beta) として認識されますが、
  計画中の月次サポートモデルでは、ハイフン補正サフィックスではなく通常のパッチ番号
  (`vYYYY.M.PATCH`) を使用します。
- タグは不変に保ってください。タグを移動したり再利用したりしないでください。
- npm dist-tag は npm インストールにおける信頼できる唯一の情報源であり続けます:
  - `latest` -> stable
  - `beta` -> 候補ビルドまたは beta 先行の安定ビルド
  - `dev` -> main スナップショット (任意)

## macOS アプリの利用可否

Beta および dev ビルドには macOS アプリリリースが含まれ**ない**場合があります。それで問題ありません:

- git タグと npm dist-tag は引き続き公開できます。
- リリースノートまたは changelog で「この beta には macOS ビルドがない」と明記してください。

## 関連

- [更新](/ja-JP/install/updating)
- [インストーラー内部](/ja-JP/install/installer)
