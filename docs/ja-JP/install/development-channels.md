---
read_when:
    - stable/beta/dev を切り替えたい
    - 特定のバージョン、タグ、または SHA を固定したい場合
    - プレリリースのタグ付けまたは公開を行っている
sidebarTitle: Release Channels
summary: '安定版、ベータ版、開発版チャンネル: セマンティクス、切り替え、固定、タグ付け'
title: リリースチャネル
x-i18n:
    generated_at: "2026-06-27T11:47:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7b5b0b8b43dd15b3fdd83d28c5d0292d260594325ad6e6e95533720ba3e59277
    source_path: install/development-channels.md
    workflow: 16
---

OpenClaw は 3 つの更新チャンネルを提供しています。

- **stable**: npm dist-tag `latest`。ほとんどのユーザーに推奨されます。
- **beta**: 現行の場合は npm dist-tag `beta`。beta が存在しない、または
  最新の stable リリースより古い場合、更新フローは `latest` にフォールバックします。
- **dev**: `main` の移動する先頭（git）。npm dist-tag: `dev`（公開されている場合）。
  `main` ブランチは実験とアクティブな開発用です。未完成の機能や破壊的変更が
  含まれる場合があります。本番 Gateway には使用しないでください。

通常は stable ビルドをまず **beta** に出荷し、そこでテストしてから、検証済みビルドを
バージョン番号を変更せずに `latest` へ移動する明示的な昇格ステップを実行します。
必要に応じて、メンテナーが stable リリースを直接 `latest` に公開することもできます。
npm インストールでは、dist-tag が信頼できる情報源です。

## チャンネルの切り替え

```bash
openclaw update --channel stable
openclaw update --channel beta
openclaw update --channel dev
```

`--channel` は設定（`update.channel`）に選択を永続化し、インストール方法を
そろえます。

- **`stable`**（パッケージインストール）: npm dist-tag `latest` 経由で更新します。
- **`beta`**（パッケージインストール）: npm dist-tag `beta` を優先しますが、
  `beta` が存在しない、または現在の stable タグより古い場合は `latest` にフォールバックします。
- **`stable`**（git インストール）: 最新の stable git タグをチェックアウトします。
  `-alpha.N`、`-beta.N`、`-rc.N`、`-dev.N`、
  `-next.N`、`-preview.N`、`-canary.N`、`-nightly.N` などの
  semver プレリリースタグやその他のプレリリースサフィックスは除外されます。
- **`beta`**（git インストール）: 最新の beta git タグを優先しますが、
  beta が存在しない、または古い場合は最新の stable git タグにフォールバックします。
- **`dev`**: git チェックアウト（既定は `~/openclaw`、または
  `OPENCLAW_HOME` が設定されている場合は `$OPENCLAW_HOME/openclaw`。
  `OPENCLAW_GIT_DIR` で上書き可能）を確保し、`main` に切り替え、
  upstream に rebase し、ビルドして、そのチェックアウトからグローバル CLI を
  インストールします。

<Tip>
stable と dev を並行して使いたい場合は、2 つの clone を保持し、Gateway を stable 側に向けてください。
</Tip>

## 一回限りのバージョンまたはタグ指定

永続化されたチャンネルを変更せずに、1 回の更新だけ特定の dist-tag、バージョン、
またはパッケージ仕様を対象にするには `--tag` を使用します。

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

注記:

- `--tag` は **パッケージ（npm）インストールのみ** に適用されます。git インストールでは無視されます。
- タグは永続化されません。次回の `openclaw update` は通常どおり、設定済みの
  チャンネルを使用します。
- パッケージインストールでは、OpenClaw は staged npm install の前に GitHub/git ソース仕様を
  一時 tarball に事前パックします。移動する `main`
  チェックアウトを永続的なインストールとして使いたい場合は、`--channel dev` または
  `--install-method git --version main` を使用してください。
- ダウングレード保護: 対象バージョンが現在のバージョンより古い場合、
  OpenClaw は確認を求めます（`--yes` でスキップ）。
- `--channel beta` は `--tag beta` とは異なります。チャンネルフローは beta が存在しない、
  または古い場合に stable/latest へフォールバックできますが、`--tag beta` はその 1 回の実行で
  生の `beta` dist-tag を対象にします。

## ドライラン

変更を加えずに `openclaw update` が行う内容をプレビューします。

```bash
openclaw update --dry-run
openclaw update --channel beta --dry-run
openclaw update --tag 2026.4.1-beta.1 --dry-run
openclaw update --dry-run --json
```

ドライランでは、有効なチャンネル、対象バージョン、予定されているアクション、
およびダウングレード確認が必要かどうかが表示されます。

## Plugin とチャンネル

`openclaw update` でチャンネルを切り替えると、OpenClaw は Plugin ソースも同期します。

- `dev` は git チェックアウトに同梱された Plugin を優先します。
- `stable` と `beta` は npm でインストールされた Plugin パッケージを復元します。
- npm でインストールされた Plugin は、core 更新の完了後に更新されます。

## 現在の状態の確認

```bash
openclaw update status
```

アクティブなチャンネル、インストール種別（git または package）、現在のバージョン、
およびソース（config、git tag、git branch、または default）を表示します。

## タグ付けのベストプラクティス

- git チェックアウトの到達先にしたいリリースにタグを付けます（stable は `vYYYY.M.PATCH`、
  beta は `vYYYY.M.PATCH-beta.N`。`-alpha.N`、`-rc.N`、`-next.N` などの
  名前付き semver プレリリースサフィックスは stable の対象ではありません）。
- `vYYYY.M.PATCH-1` や `v1.0.1-1` などの従来の数値付き stable タグは、
  互換性のために stable git タグとして引き続き認識されます。
- `vYYYY.M.PATCH.beta.N` も互換性のために認識されますが、`-beta.N` を優先してください。
- タグは不変に保ってください。タグを移動したり再利用したりしないでください。
- npm インストールでは、npm dist-tag が引き続き信頼できる情報源です。
  - `latest` -> stable
  - `beta` -> 候補ビルドまたは beta-first stable ビルド
  - `dev` -> main snapshot（任意）

## macOS アプリの可用性

Beta と dev ビルドには macOS アプリリリースが含まれない場合があります。これは問題ありません。

- git tag と npm dist-tag は引き続き公開できます。
- リリースノートまたは changelog で「この beta には macOS ビルドがない」と明記してください。

## 関連

- [更新](/ja-JP/install/updating)
- [インストーラー内部](/ja-JP/install/installer)
