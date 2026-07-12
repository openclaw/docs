---
read_when:
    - stable/extended-stable/beta/dev を切り替えたい場合
    - 特定のバージョン、タグ、または SHA を固定したい場合
    - プレリリースにタグ付けするか、公開しようとしています
sidebarTitle: Release Channels
summary: 安定版、延長安定版、ベータ版、開発版の各チャネル：セマンティクス、切り替え、バージョン固定、タグ付け
title: リリースチャネル
x-i18n:
    generated_at: "2026-07-12T14:32:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: a99e31f5121c0ab8696e638cb10a7ce16e8f32c81e4b2bef1f703eef71191494
    source_path: install/development-channels.md
    workflow: 16
---

OpenClaw には4つの更新チャネルがあります。

- **stable**: npm dist-tag `latest`。ほとんどのユーザーに推奨されます。
- **extended-stable**: npm dist-tag `extended-stable`。新たに追加された、サポート対象月を後追いする
  パッケージチャネルです。パッケージ専用で、インストールは
  フォアグラウンドでのみ実行されます。選択内容を保存している場合、`update.checkOnStart`
  が有効なら読み取り専用の更新通知を受け取りますが、自動適用されることはありません。
- **beta**: npm dist-tag `beta`。`beta` が存在しない場合、または
  現在の安定版リリースより古い場合は `latest` にフォールバックします。
- **dev**: `main`（git）の最新状態。公開されている場合は npm dist-tag `dev`。`main`
  は実験と活発な開発を目的としており、未完成の
  機能や破壊的変更が含まれる可能性があります。本番環境の Gateway では実行しないでください。

安定版ビルドは通常、まず **beta** としてリリースされ、そこで検証された後、
バージョンを上げずに **latest** へ昇格されます。メンテナーが
`latest` に直接公開することもできます。npm インストールでは dist-tag が信頼できる唯一の情報源です。

## チャネルの切り替え

```bash
openclaw update --channel stable
openclaw update --channel extended-stable
openclaw update --channel beta
openclaw update --channel dev
```

`--channel` は選択内容を設定の `update.channel` に保存し、次の両方の
インストール経路を制御します。

| チャネル          | npm／パッケージインストール                                                                                                                                                            | git インストール                                                                                                                                                    |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `stable`          | dist-tag `latest`                                                                                                                                                                      | 最新の安定版 git タグ（`-alpha.N`、`-beta.N`、`-rc.N`、`-dev.N`、`-next.N`、`-preview.N`、`-canary.N`、`-nightly.N`、およびその他の名前付きプレリリース接尾辞を除外） |
| `extended-stable` | 公開 npm の `extended-stable` セレクターを解決し、選択されたパッケージを厳密に検証して、その正確なバージョンをインストールします。`latest`、`beta`、`dev` へのフォールバックなしでフェイルクローズします。 | 非対応：OpenClaw はチェックアウトを変更せず、パッケージインストールを使用するよう求めます                                                                           |
| `beta`            | dist-tag `beta`。`beta` が存在しないか古い場合は `latest` にフォールバックします                                                                                                      | 最新の beta git タグ。beta が存在しないか古い場合は最新の安定版 git タグにフォールバックします                                                                      |
| `dev`             | dist-tag `dev`（まれ。ほとんどの dev ユーザーは git インストールを使用します）                                                                                                        | フェッチし、チェックアウトを上流の `main` ブランチ上にリベースして、ビルド後にグローバル CLI を再インストールします                                                 |

`dev` の git インストールでは、デフォルトのチェックアウト先は `~/openclaw`（
`OPENCLAW_HOME` が設定されている場合は `$OPENCLAW_HOME/openclaw`）です。
`OPENCLAW_GIT_DIR` で上書きできます。

<Tip>
stable と dev を並行して維持するには、2つの別々のチェックアウトを使用し、それぞれの Gateway が個別のチェックアウトを参照するようにしてください。
</Tip>

## 1回限りのバージョンまたはタグの指定

永続化されたチャネルを変更せず、1回の更新に限って特定の dist-tag、
バージョン、またはパッケージ指定を対象にするには `--tag` を使用します。

```bash
# 特定のバージョンをインストール
openclaw update --tag 2026.4.1-beta.1

# beta dist-tag からインストール（1回限り、永続化されません）
openclaw update --tag beta

# 最新状態に追従する GitHub main チェックアウトへ切り替え（永続的）
openclaw update --channel dev

# 特定の npm パッケージ指定をインストール
openclaw update --tag openclaw@2026.4.1-beta.1

# チャネルを永続化せず、GitHub main から1回だけインストール
openclaw update --tag main
```

注記：

- `--tag` は **パッケージ（npm）インストールのみ**に適用されます。git インストールでは無視されます。
- タグは永続化されません。次回の `openclaw update` では設定済みの
  チャネルが使用されます。
- `--tag main` は、その1回の実行に限り、npm 互換の指定
  `github:openclaw/openclaw#main` にマッピングされます。最新状態に追従する `main` インストールを永続化するには、
  `openclaw update --channel dev`（パッケージインストールから git チェックアウトへ切り替わります）
  を使用するか、インストーラーの git 方式で再インストールしてください：
  `curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git --version main`。
  npm インストール経路では GitHub／git ソースの対象を完全に拒否し、
  代わりに git 方式を案内します。
- ダウングレード保護：対象バージョンが現在の
  バージョンより古い場合、OpenClaw は確認を求めます（`--yes` で省略できます）。
- extended-stable は常に検証済みの正確なパッケージ対象を使用します。これは
  `--tag extended-stable` の1回限りのエイリアスではなく、実効チャネルが extended-stable の場合は
  `--tag` と組み合わせることができません。
- `--channel beta` は `--tag beta` と異なります。チャネルのフローでは、beta が存在しないか
  古い場合に stable／latest へフォールバックできますが、`--tag beta` は常に
  その1回の実行で生の `beta` dist-tag を対象にします。

## ドライラン

変更を加えずに `openclaw update` の実行内容をプレビューします。

```bash
openclaw update --dry-run
openclaw update --channel beta --dry-run
openclaw update --tag 2026.4.1-beta.1 --dry-run
openclaw update --dry-run --json
```

ドライランでは、実効チャネル、対象バージョン、予定されている操作、
およびダウングレード確認が必要かどうかが報告されます。

## Plugin とチャネル

`openclaw update` でチャネルを切り替えると、Plugin のソースも同期されます。

- `dev` は、バンドル版に対応するものがあるインストール済み Plugin を、
  バンドルされた（git チェックアウト）ソースへ戻します。
- `stable` と `beta` は、npm または ClawHub からインストールされた Plugin
  パッケージを復元します。
- `extended-stable` は、指定が未修飾／デフォルトまたは `latest` となっている対象の公式 npm Plugin を、
  インストール済みコアの正確なバージョンに解決します。実行時に
  Plugin の `@extended-stable` タグを照会することはありません。
- npm からインストールされた Plugin は、コアの更新完了後に更新されます。

## 現在の状態の確認

```bash
openclaw update status
```

アクティブなチャネル（その決定元：設定、git タグ、
git ブランチ、インストール済みバージョン、またはデフォルト）、インストール種別（git またはパッケージ）、
現在のバージョン、および更新の有無を表示します。

## タグ付けのベストプラクティス

- git チェックアウトの到達先にしたいリリースにはタグを付けます。stable には `vYYYY.M.PATCH`、
  beta には `vYYYY.M.PATCH-beta.N` を使用します。`-alpha.N`、`-rc.N`、
  `-next.N` などの名前付きプレリリース接尾辞は、stable または beta の対象にはなりません。
- `vYYYY.M.PATCH-1` や `v1.0.1-1` などの従来の数値形式の stable タグも、
  互換性のため stable git タグとして引き続き認識されます。
- `vYYYY.M.PATCH.beta.N`（ドット区切り）も互換性のため認識されますが、
  `-beta.N` を推奨します。
- タグは不変に保ってください。タグを移動したり再利用したりしないでください。
- npm インストールでは、npm dist-tag が引き続き信頼できる唯一の情報源です。
  - `latest` -> stable
  - `extended-stable` -> 後追いのサポート対象月パッケージリリース
  - `beta` -> 候補ビルド、または beta 先行の安定版ビルド
  - `dev` -> main スナップショット（任意）

## macOS アプリの提供状況

Beta および dev ビルドには、macOS アプリのリリースが含まれ**ない**場合があります。これは問題ありません。

- git タグと npm dist-tag は、それぞれ単独でも公開できます。
- リリースノートまたは変更履歴に「この beta には macOS ビルドがありません」と明記してください。

## 関連項目

- [更新](/ja-JP/install/updating)
- [インストーラーの内部構造](/ja-JP/install/installer)
