---
read_when:
    - stable/extended-stable/beta/dev を切り替えたい
    - 特定のバージョン、タグ、または SHA を固定したい場合
    - プレリリースにタグ付けまたは公開している場合
sidebarTitle: Release Channels
summary: 'Stable、extended-stable、beta、dev チャンネル: セマンティクス、切り替え、ピン留め、タグ付け'
title: リリースチャネル
x-i18n:
    generated_at: "2026-07-05T01:57:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0bfe2efcd25c74dc165759a8a26f9bebce58a4fdb9711a94713c2ae294172894
    source_path: install/development-channels.md
    workflow: 16
---

OpenClaw は4つの更新チャンネルを提供します。

- **stable**: npm dist-tag `latest`。ほとんどのユーザーに推奨されます。
- **extended-stable**: npm dist-tag `extended-stable`。新規の、遅行する
  サポート対象月パッケージチャンネルです。このリリースではフォアグラウンドのみです。
- **beta**: 最新の場合は npm dist-tag `beta`。beta が存在しないか、最新の
  stable リリースより古い場合、更新フローは `latest` にフォールバックします。
- **dev**: `main` の移動する先頭（git）。npm dist-tag: `dev`（公開されている場合）。
  `main` ブランチは実験とアクティブな開発用です。不完全な機能や破壊的変更を含む場合があります。
  本番 Gateway には使用しないでください。

通常、stable ビルドはまず **beta** に出荷し、そこでテストしてから、
検証済みビルドをバージョン番号を変更せずに `latest` へ移動する
明示的な昇格ステップを実行します。必要な場合、メンテナーは stable リリースを
直接 `latest` に公開することもできます。npm インストールでは dist-tag が
信頼できる情報源です。

## チャンネルの切り替え

```bash
openclaw update --channel stable
openclaw update --channel extended-stable
openclaw update --channel beta
openclaw update --channel dev
```

`--channel` は選択内容を config（`update.channel`）に永続化し、
インストール方法を合わせます。

- **`stable`**（パッケージインストール）: npm dist-tag `latest` 経由で更新します。
- **`extended-stable`**（パッケージインストールのみ）: 公開 npm
  `extended-stable` セレクターを解決し、選択された正確なパッケージバージョンを検証して、
  その正確なバージョンをインストールします。解決はフェイルクローズし、
  `latest`、`beta`、`dev` へのフォールバックはありません。
- **`beta`**（パッケージインストール）: npm dist-tag `beta` を優先しますが、
  `beta` が存在しないか現在の stable タグより古い場合は `latest` にフォールバックします。
- **`stable`**（git インストール）: 最新の stable git タグをチェックアウトします。
  `-alpha.N`、`-beta.N`、`-rc.N`、`-dev.N`、
  `-next.N`、`-preview.N`、`-canary.N`、`-nightly.N` などの
  semver プレリリースタグや、その他のプレリリースサフィックスは除外されます。
- **`beta`**（git インストール）: 最新の beta git タグを優先しますが、beta が存在しないか古い場合は
  最新の stable git タグにフォールバックします。
- **`extended-stable`**（git インストール）: サポートされていません。OpenClaw は
  チェックアウトを変更せず、パッケージインストールを使用するよう求めます。
- **`dev`**: git チェックアウト（デフォルトは `~/openclaw`、または
  `OPENCLAW_HOME` が設定されている場合は `$OPENCLAW_HOME/openclaw`。
  `OPENCLAW_GIT_DIR` で上書き可能）を確保し、`main` に切り替え、upstream に rebase し、
  ビルドして、そのチェックアウトからグローバル CLI をインストールします。

<Tip>
stable と dev を並行して使いたい場合は、2つの clone を保持し、Gateway を stable 側に向けてください。
</Tip>

## 一回限りのバージョンまたはタグ指定

永続化されたチャンネルを変更せずに、1回の更新だけ特定の dist-tag、バージョン、
またはパッケージ spec を対象にするには `--tag` を使用します。

```bash
# Install a specific version
openclaw update --tag 2026.4.1-beta.1

# Install from the beta dist-tag (one-off, does not persist)
openclaw update --tag beta

# Switch to the moving GitHub main checkout
openclaw update --channel dev

# Install a specific npm package spec
openclaw update --tag openclaw@2026.4.1-beta.1

# Install from GitHub main once without persisting the channel
openclaw update --tag main
```

注:

- `--tag` は **パッケージ（npm）インストールのみ** に適用されます。git インストールでは無視されます。
- タグは永続化されません。次回の `openclaw update` は通常どおり設定済みの
  チャンネルを使用します。
- パッケージインストールでは、OpenClaw はステージングされた npm インストールの前に
  GitHub/git ソース spec を一時 tarball に事前パックします。移動する `main`
  チェックアウトを永続的なインストールとして使いたい場合は、`--channel dev` または
  `--install-method git --version main` を使用してください。
- ダウングレード保護: 対象バージョンが現在のバージョンより古い場合、
  OpenClaw は確認を求めます（`--yes` でスキップ）。
- extended-stable は常に検証済みの正確なパッケージ対象を使用します。これは
  `--tag extended-stable` の一回限りのエイリアスではなく、`--tag` を
  effective extended-stable チャンネルと組み合わせることはできません。
- `--channel beta` は `--tag beta` とは異なります。チャンネルフローは
  beta が存在しないか古い場合に stable/latest へフォールバックできますが、
  `--tag beta` はその1回の実行で生の `beta` dist-tag を対象にします。

## ドライラン

変更を加えずに `openclaw update` が何を行うかをプレビューします。

```bash
openclaw update --dry-run
openclaw update --channel beta --dry-run
openclaw update --tag 2026.4.1-beta.1 --dry-run
openclaw update --dry-run --json
```

ドライランでは、effective チャンネル、対象バージョン、予定されているアクション、
およびダウングレード確認が必要かどうかが表示されます。

## プラグインとチャンネル

`openclaw update` でチャンネルを切り替えると、OpenClaw はプラグイン
ソースも同期します。

- `dev` は git チェックアウトからの同梱プラグインを優先します。
- `stable` と `beta` は npm インストールされたプラグインパッケージを復元します。
- `extended-stable` は現在、core パッケージが成功した後に既存の stable/latest プラグインラインを使用します。
  公式プラグインの `@extended-stable` セレクターはまだ照会されません。
- npm インストールされたプラグインは、core 更新の完了後に更新されます。

## 現在のステータスの確認

```bash
openclaw update status
```

アクティブなチャンネル、インストール種別（git または package）、現在のバージョン、
およびソース（config、git tag、git branch、または default）を表示します。

## タグ付けのベストプラクティス

- git チェックアウトの到達先にしたいリリースにタグを付けます（stable は `vYYYY.M.PATCH`、
  beta は `vYYYY.M.PATCH-beta.N`。`-alpha.N`、`-rc.N`、`-next.N` などの
  名前付き semver プレリリースサフィックスは stable 対象ではありません）。
- `vYYYY.M.PATCH-1` や `v1.0.1-1` などのレガシーな数値 stable タグも、
  互換性のため stable git タグとして認識されます。
- `vYYYY.M.PATCH.beta.N` も互換性のため認識されますが、`-beta.N` を推奨します。
- タグは不変に保ちます。タグを移動したり再利用したりしないでください。
- npm インストールでは npm dist-tag が引き続き信頼できる情報源です。
  - `latest` -> stable
  - `extended-stable` -> 遅行するサポート対象月パッケージリリース
  - `beta` -> 候補ビルドまたは beta-first stable ビルド
  - `dev` -> main スナップショット（任意）

## macOS app の提供状況

Beta および dev ビルドには macOS app リリースが含まれない場合があります。それで問題ありません。

- git tag と npm dist-tag は引き続き公開できます。
- リリースノートまたは changelog で「この beta には macOS ビルドなし」と明記してください。

## 関連

- [更新](/ja-JP/install/updating)
- [インストーラー内部](/ja-JP/install/installer)
