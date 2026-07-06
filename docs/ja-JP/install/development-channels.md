---
read_when:
    - stable/extended-stable/beta/dev を切り替えたい
    - 特定のバージョン、タグ、または SHA を固定したい場合
    - プレリリースをタグ付けまたは公開している
sidebarTitle: Release Channels
summary: '安定版、延長安定版、ベータ、開発版チャネル: セマンティクス、切り替え、固定、タグ付け'
title: リリースチャネル
x-i18n:
    generated_at: "2026-07-06T10:51:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 00b35a9dd74a2a5ffad67b28538d0e210634fa474b70b65aeba49a09c0a73368
    source_path: install/development-channels.md
    workflow: 16
---

OpenClaw は4つの更新チャネルを提供します。

- **stable**: npm dist-tag `latest`。ほとんどのユーザーに推奨されます。
- **extended-stable**: npm dist-tag `extended-stable`。新規の、サポート対象月を後追いする
  パッケージチャネルです。このリリースではパッケージ専用かつフォアグラウンド専用です。
- **beta**: npm dist-tag `beta`。`beta` がない場合、または現在の stable リリースより古い場合は
  `latest` にフォールバックします。
- **dev**: `main` (git) の移動ヘッド。公開されている場合は npm dist-tag `dev`。`main`
  は実験とアクティブな開発向けです。不完全な機能や破壊的変更が含まれる場合があります。
  本番 Gateway では実行しないでください。

stable ビルドは通常、まず **beta** に出荷され、そこで検証された後、バージョンを上げずに
**latest** へ昇格されます。メンテナーは `latest` に直接公開することもできます。
dist-tag は npm インストールの信頼できる情報源です。

## チャネルの切り替え

```bash
openclaw update --channel stable
openclaw update --channel extended-stable
openclaw update --channel beta
openclaw update --channel dev
```

`--channel` は選択内容を設定の `update.channel` に永続化し、両方のインストールパスを制御します。

| チャネル          | npm/パッケージインストール                                                                                                                                                            | git インストール                                                                                                                                                  |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `stable`          | dist-tag `latest`                                                                                                                                                                      | 最新の stable git タグ (`-alpha.N`、`-beta.N`、`-rc.N`、`-dev.N`、`-next.N`、`-preview.N`、`-canary.N`、`-nightly.N`、その他の名前付きプレリリース接尾辞を除く) |
| `extended-stable` | 公開 npm `extended-stable` セレクターを解決し、選択された正確なパッケージを検証して、その正確なバージョンをインストールします。`latest`、`beta`、`dev` へのフォールバックなしでフェイルクローズします。 | 非対応: OpenClaw はチェックアウトを変更せず、パッケージインストールを使用するよう求めます                                                                         |
| `beta`            | dist-tag `beta`。`beta` がない場合、または古い場合は `latest` にフォールバックします                                                                                                  | 最新の beta git タグ。beta がない場合、または古い場合は最新の stable git タグにフォールバックします                                                              |
| `dev`             | dist-tag `dev` (まれです。ほとんどの dev ユーザーは git インストールを実行します)                                                                                                     | フェッチし、チェックアウトをアップストリームの `main` ブランチにリベースし、ビルドして、グローバル CLI を再インストールします                                     |

`dev` git インストールでは、デフォルトのチェックアウトは `~/openclaw` (または
`OPENCLAW_HOME` が設定されている場合は `$OPENCLAW_HOME/openclaw`) です。
`OPENCLAW_GIT_DIR` で上書きできます。

<Tip>
stable と dev を並行して維持するには、2つの別々のチェックアウトを使用し、それぞれの Gateway をそれぞれに向けてください。
</Tip>

## 単発のバージョンまたはタグ指定

永続化されたチャネルを変更せずに、1回の更新だけ特定の dist-tag、バージョン、またはパッケージ仕様を対象にするには
`--tag` を使用します。

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

- `--tag` は **パッケージ (npm) インストールのみ** に適用されます。git インストールでは無視されます。
- タグは永続化されません。次回の `openclaw update` では設定されたチャネルが使用されます。
- `--tag main` は、その1回の実行について npm 互換の仕様 `github:openclaw/openclaw#main`
  にマップされます。永続的に移動する `main` インストールには、
  `openclaw update --channel dev` (パッケージインストールは git チェックアウトに切り替わります)
  を使用するか、インストーラーの git メソッドで再インストールします:
  `curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git --version main`。
  npm インストールパスは GitHub/git ソースターゲットを完全に拒否し、代わりに git メソッドを案内します。
- ダウングレード保護: ターゲットバージョンが現在のバージョンより古い場合、
  OpenClaw は確認を求めます (`--yes` でスキップできます)。
- extended-stable は常に、検証済みの正確なパッケージターゲットを使用します。
  これは `--tag extended-stable` の単発エイリアスではなく、`--tag` を有効な extended-stable チャネルと組み合わせることはできません。
- `--channel beta` は `--tag beta` と異なります。チャネルフローは beta がない場合や古い場合に
  stable/latest へフォールバックできますが、`--tag beta` は常にその1回の実行で生の `beta` dist-tag を対象にします。

## ドライラン

変更を加えずに `openclaw update` が何を行うかをプレビューします。

```bash
openclaw update --dry-run
openclaw update --channel beta --dry-run
openclaw update --tag 2026.4.1-beta.1 --dry-run
openclaw update --dry-run --json
```

ドライランでは、有効なチャネル、ターゲットバージョン、予定されているアクション、
およびダウングレード確認が必要かどうかが報告されます。

## Plugin とチャネル

`openclaw update` でチャネルを切り替えると、Plugin ソースも同期されます。

- `dev` は、バンドル版の対応物を持つインストール済み Plugin を、
  バンドルされた (git チェックアウト) ソースへ戻します。
- `stable` と `beta` は、npm インストールまたは ClawHub インストールされた Plugin
  パッケージを復元します。
- `extended-stable` は、bare/default または `latest` 意図を持つ対象の公式 npm Plugin を、
  インストール済み core の正確なバージョンに解決します。実行時に Plugin の
  `@extended-stable` タグは問い合わせません。
- npm インストール済み Plugin は、core 更新の完了後に更新されます。

## 現在の状態の確認

```bash
openclaw update status
```

アクティブなチャネル (それを決定したソース: 設定、git タグ、git ブランチ、
インストール済みバージョン、またはデフォルトを含む)、インストール種別 (git またはパッケージ)、
現在のバージョン、更新の有無を表示します。

## タグ付けのベストプラクティス

- git チェックアウトを着地させたいリリースにタグを付けます。stable には `vYYYY.M.PATCH`、
  beta には `vYYYY.M.PATCH-beta.N` を使用します。`-alpha.N`、`-rc.N`、`-next.N`
  などの名前付きプレリリース接尾辞は、stable または beta のターゲットではありません。
- `vYYYY.M.PATCH-1` や `v1.0.1-1` などのレガシーな数値 stable タグは、互換性のために
  stable git タグとして引き続き認識されます。
- `vYYYY.M.PATCH.beta.N` (ドット区切り) も互換性のために認識されます。
  `-beta.N` を推奨します。
- タグは不変に保ちます。タグを移動したり再利用したりしないでください。
- npm dist-tag は npm インストールの信頼できる情報源のままです:
  - `latest` -> stable
  - `extended-stable` -> サポート対象月を後追いするパッケージリリース
  - `beta` -> 候補ビルドまたは beta-first stable ビルド
  - `dev` -> main スナップショット (任意)

## macOS アプリの提供状況

Beta および dev ビルドには、macOS アプリリリースが含まれない場合があります。それで問題ありません。

- git タグと npm dist-tag は、それぞれ単独で公開できます。
- リリースノートまたは変更履歴で「この beta には macOS ビルドがない」と明記してください。

## 関連

- [更新](/ja-JP/install/updating)
- [インストーラー内部](/ja-JP/install/installer)
