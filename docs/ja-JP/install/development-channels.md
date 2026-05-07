---
read_when:
    - stable/beta/dev を切り替えたい場合
    - 特定のバージョン、タグ、または SHA に固定したい場合
    - プレリリースにタグ付けする、または公開する場合
sidebarTitle: Release Channels
summary: '安定版、ベータ版、開発版チャンネル: セマンティクス、切り替え、固定、タグ付け'
title: リリースチャネル
x-i18n:
    generated_at: "2026-05-07T13:21:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: d2516165635eb8fbaddf19e07fbb591b659479b5226c2bf467e29247552ababb
    source_path: install/development-channels.md
    workflow: 16
---

OpenClawには3つの更新チャネルがあります。

- **stable**: npm dist-tag `latest`。ほとんどのユーザーに推奨されます。
- **beta**: 最新の場合は npm dist-tag `beta`。beta が存在しない、または
  最新の安定版リリースより古い場合、更新フローは `latest` にフォールバックします。
- **dev**: `main` (git) の移動する先頭。npm dist-tag: `dev` (公開されている場合)。
  `main` ブランチは実験とアクティブな開発用です。不完全な機能や破壊的変更が含まれる
  場合があります。本番Gatewayには使用しないでください。

通常は安定版ビルドをまず **beta** にリリースし、そこでテストしてから、
検証済みビルドをバージョン番号を変更せずに `latest` へ移動する明示的な
昇格手順を実行します。メンテナーは必要に応じて安定版リリースを直接
`latest` に公開することもできます。npm インストールでは dist-tag が信頼できる情報源です。

## チャネルの切り替え

```bash
openclaw update --channel stable
openclaw update --channel beta
openclaw update --channel dev
```

`--channel` は選択内容を設定 (`update.channel`) に永続化し、インストール方法を
揃えます。

- **`stable`** (パッケージインストール): npm dist-tag `latest` 経由で更新します。
- **`beta`** (パッケージインストール): npm dist-tag `beta` を優先しますが、
  `beta` が存在しない、または現在の安定版タグより古い場合は `latest` にフォールバックします。
- **`stable`** (git インストール): 最新の安定版 git タグをチェックアウトします。
- **`beta`** (git インストール): 最新の beta git タグを優先しますが、beta が存在しない
  または古い場合は最新の安定版 git タグにフォールバックします。
- **`dev`**: git チェックアウト (既定は `~/openclaw`、`OPENCLAW_GIT_DIR` で上書き可能) を用意し、`main` に切り替え、upstream に rebase し、ビルドして、
  そのチェックアウトからグローバル CLI をインストールします。

<Tip>
stable と dev を並行して使いたい場合は、2つの clone を保持し、Gateway は stable 側を参照するようにしてください。
</Tip>

## 1回限りのバージョンまたはタグ指定

永続化されたチャネルを変更せずに、1回の更新だけ特定の dist-tag、バージョン、
またはパッケージ spec を対象にするには `--tag` を使います。

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

- `--tag` は **パッケージ (npm) インストールにのみ** 適用されます。git インストールでは無視されます。
- タグは永続化されません。次回の `openclaw update` は通常どおり、設定された
  チャネルを使用します。
- ダウングレード保護: 対象バージョンが現在のバージョンより古い場合、
  OpenClaw は確認を求めます (`--yes` でスキップできます)。
- `--channel beta` は `--tag beta` とは異なります。チャネルフローでは beta が存在しない
  または古い場合に stable/latest へフォールバックできますが、`--tag beta` は
  その1回の実行で生の `beta` dist-tag を対象にします。

## ドライラン

変更を加えずに `openclaw update` が何を行うかをプレビューします。

```bash
openclaw update --dry-run
openclaw update --channel beta --dry-run
openclaw update --tag 2026.4.1-beta.1 --dry-run
openclaw update --dry-run --json
```

ドライランでは、有効なチャネル、対象バージョン、予定されるアクション、
ダウングレード確認が必要かどうかが表示されます。

## Pluginとチャネル

`openclaw update` でチャネルを切り替えると、OpenClaw はPluginソースも同期します。

- `dev` は git チェックアウト内のバンドルされたPluginを優先します。
- `stable` と `beta` は npm インストール済みのPluginパッケージを復元します。
- npm インストール済みのPluginは、コア更新の完了後に更新されます。

## 現在の状態の確認

```bash
openclaw update status
```

アクティブなチャネル、インストール種別 (git またはパッケージ)、現在のバージョン、
およびソース (設定、git タグ、git ブランチ、または既定値) を表示します。

## タグ付けのベストプラクティス

- git チェックアウトの着地点にしたいリリースにタグを付けます (安定版は `vYYYY.M.D`、
  beta は `vYYYY.M.D-beta.N`)。
- `vYYYY.M.D.beta.N` も互換性のために認識されますが、`-beta.N` を推奨します。
- レガシーの `vYYYY.M.D-<patch>` タグは、引き続き安定版 (非 beta) として認識されます。
- タグは不変に保ちます。タグを移動したり再利用したりしないでください。
- npm dist-tag は npm インストールにおける信頼できる情報源のままです。
  - `latest` -> stable
  - `beta` -> 候補ビルドまたは beta 先行の安定版ビルド
  - `dev` -> main スナップショット (任意)

## macOSアプリの提供状況

Beta と dev ビルドには macOS アプリリリースが含まれない場合があります。それで問題ありません。

- git タグと npm dist-tag は引き続き公開できます。
- リリースノートまたは changelog で「この beta には macOS ビルドがない」と明記してください。

## 関連

- [更新](/ja-JP/install/updating)
- [インストーラー内部](/ja-JP/install/installer)
