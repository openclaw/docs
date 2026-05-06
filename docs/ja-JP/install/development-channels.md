---
read_when:
    - stable/beta/dev を切り替えたい
    - 特定のバージョン、タグ、または SHA を固定したい場合
    - プレリリースにタグを付けるか公開する場合
sidebarTitle: Release Channels
summary: '安定版、ベータ版、開発版チャンネル: 意味、切り替え、固定、タグ付け'
title: リリースチャネル
x-i18n:
    generated_at: "2026-05-06T05:09:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: d2516165635eb8fbaddf19e07fbb591b659479b5226c2bf467e29247552ababb
    source_path: install/development-channels.md
    workflow: 16
---

OpenClaw には 3 つの更新チャンネルがあります。

- **stable**: npm dist-tag `latest`。ほとんどのユーザーに推奨されます。
- **beta**: 現行の場合は npm dist-tag `beta`。beta が存在しないか、最新の安定版リリースより古い場合、
  更新フローは `latest` にフォールバックします。
- **dev**: `main` (git) の移動する最新状態。npm dist-tag: `dev` (公開されている場合)。
  `main` ブランチは実験とアクティブな開発用です。不完全な機能や破壊的変更が
  含まれることがあります。本番 Gateway には使用しないでください。

通常、安定版ビルドはまず **beta** に出荷し、そこでテストしてから、検証済みビルドを
バージョン番号を変更せずに `latest` へ移動する明示的な昇格ステップを実行します。
必要に応じて、メンテナーが安定版リリースを直接 `latest` に公開することもできます。
dist-tag は npm インストールにおける信頼できる情報源です。

## チャンネルの切り替え

```bash
openclaw update --channel stable
openclaw update --channel beta
openclaw update --channel dev
```

`--channel` は選択内容を設定 (`update.channel`) に永続化し、
インストール方法をそろえます。

- **`stable`** (パッケージインストール): npm dist-tag `latest` 経由で更新します。
- **`beta`** (パッケージインストール): npm dist-tag `beta` を優先しますが、
  `beta` が存在しないか、現在の安定版タグより古い場合は `latest` にフォールバックします。
- **`stable`** (git インストール): 最新の安定版 git タグをチェックアウトします。
- **`beta`** (git インストール): 最新の beta git タグを優先しますが、beta が存在しないか
  古い場合は最新の安定版 git タグにフォールバックします。
- **`dev`**: git チェックアウト (デフォルトは `~/openclaw`、`OPENCLAW_GIT_DIR` で上書き可能) を確保し、
  `main` に切り替え、upstream に rebase し、ビルドして、そのチェックアウトから
  グローバル CLI をインストールします。

<Tip>
stable と dev を並行して使いたい場合は、2 つの clone を保持し、Gateway は stable 側を指すようにしてください。
</Tip>

## 一回限りのバージョンまたはタグ指定

永続化されたチャンネルを変更せずに、1 回の更新だけ特定の dist-tag、バージョン、
またはパッケージ spec を対象にするには `--tag` を使用します。

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

注意:

- `--tag` は **パッケージ (npm) インストールのみ**に適用されます。git インストールでは無視されます。
- タグは永続化されません。次回の `openclaw update` は通常どおり設定済みの
  チャンネルを使用します。
- ダウングレード保護: 対象バージョンが現在のバージョンより古い場合、
  OpenClaw は確認を求めます (`--yes` でスキップできます)。
- `--channel beta` は `--tag beta` とは異なります。チャンネルフローは
  beta が存在しないか古い場合に stable/latest へフォールバックできますが、`--tag beta` は
  その 1 回の実行で生の `beta` dist-tag を対象にします。

## ドライラン

変更を加えずに `openclaw update` が実行する内容をプレビューします。

```bash
openclaw update --dry-run
openclaw update --channel beta --dry-run
openclaw update --tag 2026.4.1-beta.1 --dry-run
openclaw update --dry-run --json
```

ドライランでは、有効なチャンネル、対象バージョン、予定されるアクション、
およびダウングレード確認が必要かどうかが表示されます。

## Plugin とチャンネル

`openclaw update` でチャンネルを切り替えると、OpenClaw は Plugin ソースも同期します。

- `dev` は git チェックアウトにバンドルされた Plugin を優先します。
- `stable` と `beta` は npm でインストールされた Plugin パッケージを復元します。
- npm でインストールされた Plugin は、コア更新の完了後に更新されます。

## 現在の状態の確認

```bash
openclaw update status
```

アクティブなチャンネル、インストール種別 (git またはパッケージ)、現在のバージョン、
およびソース (設定、git タグ、git ブランチ、またはデフォルト) を表示します。

## タグ付けのベストプラクティス

- git チェックアウトで到達させたいリリースにタグを付けます (stable は `vYYYY.M.D`、
  beta は `vYYYY.M.D-beta.N`)。
- `vYYYY.M.D.beta.N` も互換性のために認識されますが、`-beta.N` を推奨します。
- レガシーな `vYYYY.M.D-<patch>` タグは、引き続き stable (非 beta) として認識されます。
- タグは不変に保ってください。タグを移動したり再利用したりしないでください。
- npm dist-tag は npm インストールにおける信頼できる情報源のままです。
  - `latest` -> stable
  - `beta` -> 候補ビルドまたは beta 先行の安定版ビルド
  - `dev` -> main スナップショット (任意)

## macOS アプリの提供状況

Beta および dev ビルドには macOS アプリリリースが含まれ**ない**場合があります。それで問題ありません。

- git タグと npm dist-tag は引き続き公開できます。
- リリースノートまたは changelog で「この beta には macOS ビルドがない」と明記してください。

## 関連

- [更新](/ja-JP/install/updating)
- [インストーラー内部](/ja-JP/install/installer)
