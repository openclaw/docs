---
read_when:
    - stable/extended-stable/beta/dev を切り替えたい
    - 特定のバージョン、タグ、または SHA を固定したい場合
    - プレリリースにタグ付けまたは公開している
sidebarTitle: Release Channels
summary: '安定版、延長安定版、ベータ、開発チャンネル: セマンティクス、切り替え、固定、タグ付け'
title: リリースチャネル
x-i18n:
    generated_at: "2026-07-05T11:31:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 51ae160723558722c5a39d25d63b844f761b8f1127957bafe833d047e173e8b6
    source_path: install/development-channels.md
    workflow: 16
---

OpenClaw は4つの更新チャネルを提供しています。

- **stable**: npm dist-tag `latest`。ほとんどのユーザーに推奨されます。
- **extended-stable**: npm dist-tag `extended-stable`。新規の、追随型
  サポート月次パッケージチャネルです。このリリースではパッケージ専用かつフォアグラウンド専用です。
- **beta**: npm dist-tag `beta`。`beta` が存在しない場合、または現在の stable リリースより古い場合は
  `latest` にフォールバックします。
- **dev**: `main` (git) の移動ヘッド。公開されている場合は npm dist-tag `dev`。`main`
  は実験とアクティブな開発用です。不完全な機能や破壊的変更が含まれる場合があります。本番 Gateway では実行しないでください。

Stable ビルドは通常、まず **beta** に出荷され、そこで検証された後、バージョンを上げずに
**latest** へ昇格されます。メンテナーは `latest` へ直接公開することもできます。Dist-tag は npm インストールの信頼できる情報源です。

## チャネルの切り替え

```bash
openclaw update --channel stable
openclaw update --channel extended-stable
openclaw update --channel beta
openclaw update --channel dev
```

`--channel` は選択を config の `update.channel` に永続化し、両方の
インストール経路を制御します。

| チャネル          | npm/パッケージインストール                                                                                                                                                             | git インストール                                                                                                                                                    |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `stable`          | dist-tag `latest`                                                                                                                                                                      | 最新の stable git タグ（`-alpha.N`、`-beta.N`、`-rc.N`、`-dev.N`、`-next.N`、`-preview.N`、`-canary.N`、`-nightly.N`、およびその他の名前付きプレリリース接尾辞を除外） |
| `extended-stable` | 公開 npm の `extended-stable` セレクターを解決し、選択された正確なパッケージを検証して、その正確なバージョンをインストールします。`latest`、`beta`、`dev` へのフォールバックなしで失敗します。 | 非対応: OpenClaw はチェックアウトを変更せず、パッケージインストールを使うよう求めます                                                                             |
| `beta`            | dist-tag `beta`。`beta` が存在しない場合、または古い場合は `latest` にフォールバックします                                                                                              | 最新の beta git タグ。beta が存在しない場合、または古い場合は最新の stable git タグにフォールバックします                                                         |
| `dev`             | dist-tag `dev`（まれです。ほとんどの dev ユーザーは git インストールを実行します）                                                                                                     | 取得し、チェックアウトを upstream の `main` ブランチ上にリベースし、ビルドして、グローバル CLI を再インストールします                                               |

`dev` git インストールでは、デフォルトのチェックアウトは `~/openclaw`（または
`OPENCLAW_HOME` が設定されている場合は `$OPENCLAW_HOME/openclaw`）です。
`OPENCLAW_GIT_DIR` で上書きできます。

<Tip>
stable と dev を並行して維持するには、2つの別々のチェックアウトを使い、それぞれの gateway をそれぞれに向けてください。
</Tip>

## 1回限りのバージョンまたはタグ指定

永続化されたチャネルを変更せずに、単一の更新で特定の dist-tag、バージョン、またはパッケージ仕様を
対象にするには `--tag` を使います。

```bash
# Install a specific version
openclaw update --tag 2026.4.1-beta.1

# Install from the beta dist-tag (one-off, does not persist)
openclaw update --tag beta

# Switch to the moving GitHub main checkout (persistent)
openclaw update --channel dev

# Install a specific npm package spec
openclaw update --tag openclaw@2026.4.1-beta.1

# Install from GitHub main once without persisting the channel
openclaw update --tag main
```

注:

- `--tag` は **パッケージ (npm) インストールのみに**適用されます。git インストールでは無視されます。
- タグは永続化されません。次回の `openclaw update` では設定済みの
  チャネルが使われます。
- `--tag main` は、その1回の実行について npm 互換の仕様 `github:openclaw/openclaw#main`
  にマップされます。移動する `main` インストールを永続化するには、
  `openclaw update --channel dev`（パッケージインストールは git チェックアウトに切り替わります）
  を使うか、インストーラーの git メソッドで再インストールします:
  `curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git --version main`。
  npm インストール経路は GitHub/git ソースターゲットを完全に拒否し、代わりに
  git メソッドを案内します。
- ダウングレード保護: ターゲットバージョンが現在のバージョンより古い場合、
  OpenClaw は確認を求めます（`--yes` でスキップ）。
- Extended-stable は常に検証済みの正確なパッケージターゲットを使います。これは
  `--tag extended-stable` の1回限りのエイリアスではなく、`--tag` は有効な
  extended-stable チャネルと組み合わせることはできません。
- `--channel beta` は `--tag beta` と異なります。チャネルフローは
  beta が存在しない場合、または古い場合に stable/latest へフォールバックできますが、`--tag beta` は常に
  その1回の実行で生の `beta` dist-tag を対象にします。

## ドライラン

変更を加えずに `openclaw update` が何を行うかをプレビューします。

```bash
openclaw update --dry-run
openclaw update --channel beta --dry-run
openclaw update --tag 2026.4.1-beta.1 --dry-run
openclaw update --dry-run --json
```

ドライランは、有効なチャネル、ターゲットバージョン、予定されているアクション、
およびダウングレード確認が必要かどうかを報告します。

## Plugins とチャネル

`openclaw update` でチャネルを切り替えると、Plugin ソースも同期されます。

- `dev` は、バンドル版の対応物があるインストール済み Plugin を
  バンドルされた（git チェックアウト）ソースに戻します。
- `stable` と `beta` は、npm インストールまたは ClawHub インストールされた Plugin
  パッケージを復元します。
- `extended-stable` は現在、コアパッケージが成功した後に既存の stable/latest Plugin ラインを
  使います。公式 Plugin の `@extended-stable`
  セレクターはまだ照会されません。
- npm インストールされた Plugin は、コア更新が完了した後に更新されます。

## 現在の状態の確認

```bash
openclaw update status
```

アクティブなチャネル（その決定元: config、git tag、
git branch、インストール済みバージョン、またはデフォルト）、インストール種別（git または package）、
現在のバージョン、および更新の有無を表示します。

## タグ付けのベストプラクティス

- git チェックアウトを着地させたいリリースにタグを付けます: stable には `vYYYY.M.PATCH`、
  beta には `vYYYY.M.PATCH-beta.N`。`-alpha.N`、`-rc.N`、`-next.N` などの
  名前付きプレリリース接尾辞は stable または beta のターゲットではありません。
- `vYYYY.M.PATCH-1` や `v1.0.1-1` などのレガシーな数値 stable タグは、互換性のために
  stable git タグとして引き続き認識されます。
- `vYYYY.M.PATCH.beta.N`（ドット区切り）も互換性のために認識されます。
  `-beta.N` を優先してください。
- タグは不変に保ちます。タグを移動したり再利用したりしないでください。
- npm dist-tag は npm インストールの信頼できる情報源のままです:
  - `latest` -> stable
  - `extended-stable` -> 追随型サポート月次パッケージリリース
  - `beta` -> 候補ビルドまたは beta-first stable ビルド
  - `dev` -> main スナップショット（任意）

## macOS アプリの利用可否

Beta と dev ビルドには macOS アプリリリースが含まれない場合があります。それで問題ありません。

- git タグと npm dist-tag は、それぞれ単独で引き続き公開できます。
- リリースノートまたは changelog で「この beta には macOS ビルドがありません」と明記してください。

## 関連

- [更新](/ja-JP/install/updating)
- [インストーラー内部](/ja-JP/install/installer)
