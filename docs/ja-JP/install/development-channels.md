---
read_when:
    - stable/extended-stable/beta/dev を切り替えたい場合
    - 特定のバージョン、タグ、または SHA を固定したい場合
    - プレリリースにタグを付けるか、公開しています
sidebarTitle: Release Channels
summary: 安定版、延長安定版、ベータ版、開発版の各チャネル：意味、切り替え、固定、タグ付け
title: リリースチャンネル
x-i18n:
    generated_at: "2026-07-11T22:20:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a99e31f5121c0ab8696e638cb10a7ce16e8f32c81e4b2bef1f703eef71191494
    source_path: install/development-channels.md
    workflow: 16
---

OpenClaw には4つの更新チャネルがあります。

- **stable**: npm dist-tag `latest`。ほとんどのユーザーに推奨されます。
- **extended-stable**: npm dist-tag `extended-stable`。新規に追加された、サポート対象月から一定期間遅れて提供される
  パッケージチャネルです。パッケージ専用で、インストールはフォアグラウンドでのみ実行されます。保存された選択には、
  `update.checkOnStart` が有効な場合、読み取り専用の更新通知が表示されますが、自動適用されることはありません。
- **beta**: npm dist-tag `beta`。`beta` が存在しない場合、または現在の安定版リリースより
  古い場合は `latest` にフォールバックします。
- **dev**: `main`（git）の移動する最新ヘッド。公開されている場合は npm dist-tag `dev`。`main`
  は実験と活発な開発のためのもので、不完全な機能や破壊的変更が含まれる可能性があります。
  本番環境の Gateway では実行しないでください。

安定版ビルドは通常、まず **beta** としてリリースされ、そこで検証された後、
バージョンを上げずに **latest** に昇格されます。メンテナーは `latest` に
直接公開することもできます。npm インストールでは dist-tag が信頼できる唯一の情報源です。

## チャネルの切り替え

```bash
openclaw update --channel stable
openclaw update --channel extended-stable
openclaw update --channel beta
openclaw update --channel dev
```

`--channel` は選択内容を設定の `update.channel` に永続化し、両方の
インストール経路を制御します。

| チャネル          | npm／パッケージインストール                                                                                                                                                              | git インストール                                                                                                                                                    |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `stable`          | dist-tag `latest`                                                                                                                                                                      | 最新の安定版 git タグ（`-alpha.N`、`-beta.N`、`-rc.N`、`-dev.N`、`-next.N`、`-preview.N`、`-canary.N`、`-nightly.N`、およびその他の名前付きプレリリース接尾辞を除く） |
| `extended-stable` | 公開 npm の `extended-stable` セレクターを解決し、選択された正確なパッケージを検証して、その正確なバージョンをインストールします。`latest`、`beta`、`dev` へのフォールバックはなく、安全側に失敗します。 | 非対応：OpenClaw はチェックアウトを変更せず、パッケージインストールを使用するよう案内します                                                                       |
| `beta`            | dist-tag `beta`。`beta` が存在しないか古い場合は `latest` にフォールバックします                                                                                                        | 最新のベータ版 git タグ。ベータ版が存在しないか古い場合は、最新の安定版 git タグにフォールバックします                                                            |
| `dev`             | dist-tag `dev`（まれ。ほとんどの開発ユーザーは git インストールを使用します）                                                                                                           | 取得後、チェックアウトをアップストリームの `main` ブランチ上にリベースし、ビルドしてグローバル CLI を再インストールします                                        |

`dev` の git インストールでは、デフォルトのチェックアウト先は `~/openclaw`（または
`OPENCLAW_HOME` が設定されている場合は `$OPENCLAW_HOME/openclaw`）です。変更するには
`OPENCLAW_GIT_DIR` を使用します。

<Tip>
stable と dev を並行して維持するには、2つの別々のチェックアウトを使用し、各 Gateway がそれぞれ専用のチェックアウトを参照するようにします。
</Tip>

## 単発でのバージョンまたはタグ指定

永続化されたチャネルを変更せずに、1回の更新で特定の dist-tag、バージョン、
またはパッケージ仕様を指定するには `--tag` を使用します。

```bash
# 特定のバージョンをインストール
openclaw update --tag 2026.4.1-beta.1

# beta dist-tag からインストール（単発で、永続化しない）
openclaw update --tag beta

# 移動する GitHub main チェックアウトに切り替える（永続化）
openclaw update --channel dev

# 特定の npm パッケージ仕様をインストール
openclaw update --tag openclaw@2026.4.1-beta.1

# チャネルを永続化せずに GitHub main から1回だけインストール
openclaw update --tag main
```

注記：

- `--tag` は **パッケージ（npm）インストールのみ**に適用されます。git インストールでは無視されます。
- タグは永続化されません。次回の `openclaw update` では設定済みの
  チャネルが使用されます。
- `--tag main` は、その1回の実行に限り、npm 互換仕様 `github:openclaw/openclaw#main`
  にマッピングされます。移動する `main` を永続的にインストールするには、
  `openclaw update --channel dev`（パッケージインストールは git チェックアウトに切り替わります）
  を使用するか、インストーラーの git 方式で再インストールします。
  `curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git --version main`。
  npm のインストール経路は GitHub／git ソースの指定を完全に拒否し、
  代わりに git 方式を案内します。
- ダウングレード保護：対象バージョンが現在のバージョンより古い場合、
  OpenClaw は確認を求めます（`--yes` で省略できます）。
- extended-stable は常に、検証済みの正確なパッケージ対象を使用します。
  `--tag extended-stable` の単発エイリアスではなく、`--tag` を実効的な
  extended-stable チャネルと組み合わせることはできません。
- `--channel beta` は `--tag beta` と異なります。チャネル経路では、
  ベータ版が存在しないか古い場合に stable／latest へフォールバックできますが、
  `--tag beta` は常に、その1回の実行に限って生の `beta` dist-tag を指定します。

## ドライラン

変更を加えずに `openclaw update` の実行内容をプレビューします。

```bash
openclaw update --dry-run
openclaw update --channel beta --dry-run
openclaw update --tag 2026.4.1-beta.1 --dry-run
openclaw update --dry-run --json
```

ドライランでは、実効チャネル、対象バージョン、予定されている処理、
およびダウングレード確認が必要かどうかが報告されます。

## Plugin とチャネル

`openclaw update` でチャネルを切り替えると、Plugin のソースも同期されます。

- `dev` は、バンドル版が存在するインストール済み Plugin を、
  バンドル済み（git チェックアウト）ソースに戻します。
- `stable` と `beta` は、npm または ClawHub からインストールされた Plugin
  パッケージを復元します。
- `extended-stable` は、指定が省略されているかデフォルト、または `latest`
  を意図している対象の公式 npm Plugin を、インストール済みコアの正確なバージョンに解決します。
  実行時に Plugin の `@extended-stable` タグを照会することはありません。
- npm からインストールされた Plugin は、コアの更新完了後に更新されます。

## 現在の状態の確認

```bash
openclaw update status
```

有効なチャネル（設定、git タグ、git ブランチ、インストール済みバージョン、
またはデフォルトのうち、それを決定したソースを含む）、インストール種別（git またはパッケージ）、
現在のバージョン、および更新の有無を表示します。

## タグ付けのベストプラクティス

- git チェックアウトの到達先にしたいリリースへタグを付けます。安定版には `vYYYY.M.PATCH`、
  ベータ版には `vYYYY.M.PATCH-beta.N` を使用します。`-alpha.N`、`-rc.N`、
  `-next.N` などの名前付きプレリリース接尾辞は、安定版またはベータ版の対象ではありません。
- `vYYYY.M.PATCH-1` や `v1.0.1-1` などの従来の数値形式の安定版タグも、
  互換性のため、引き続き安定版 git タグとして認識されます。
- `vYYYY.M.PATCH.beta.N`（ドット区切り）も互換性のため認識されますが、
  `-beta.N` を推奨します。
- タグは不変に保ってください。タグを移動または再利用してはいけません。
- npm インストールでは、引き続き npm dist-tag が信頼できる唯一の情報源です。
  - `latest` -> stable
  - `extended-stable` -> サポート対象月から一定期間遅れて提供されるパッケージリリース
  - `beta` -> 候補ビルド、または最初にベータとして提供される安定版ビルド
  - `dev` -> main のスナップショット（任意）

## macOS アプリの提供状況

ベータ版と開発版のビルドには、macOS アプリのリリースが**含まれない**場合があります。問題ありません。

- git タグと npm dist-tag は、それぞれ単独でも公開できます。
- リリースノートまたは変更履歴に「このベータ版には macOS ビルドがありません」と明記してください。

## 関連項目

- [更新](/ja-JP/install/updating)
- [インストーラーの内部構造](/ja-JP/install/installer)
