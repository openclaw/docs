---
read_when:
    - telemetry / プライバシー制御に取り組んでいます
    - 収集されるデータに関する質問
summary: ClawHub CLI によって収集されるインストールテレメトリと、オプトアウトする方法。
x-i18n:
    generated_at: "2026-07-06T10:49:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 906be32778baaf89e77c5350cd33ff3b975df66d8152a33fdf20c24b5c8286ce
    source_path: clawhub/telemetry.md
    workflow: 16
---

# テレメトリ

ClawHub は、集計インストール数を計算するために最小限の CLI テレメトリを使用します。

## テレメトリが収集されるタイミング

テレメトリは次の場合にのみ送信されます。

- CLI にログインしている。
- `clawhub install <slug>` を実行する。
- テレメトリが**無効化されていない**（下の「無効化する方法」を参照）。

ログインしていない場合、何も報告されません。

## 収集するもの

報告対象の各 `clawhub install` で、CLI はベストエフォートのインストールイベントを 1 件送信します。

イベントには次が含まれます。

- `slug`: インストールされた skill slug。
- `version`: インストールされたバージョン（判明している場合）。

### 収集_しない_もの

- フォルダー パスやフォルダー由来の識別子は含みません。
- ファイル内容は含みません。
- 実行ごとのログ、プロンプト、その他の CLI 出力は含みません。

## インストール数

ClawHub は skill ごとの集計カウンターを保持します。

- `installsAllTime`: その skill について少なくとも 1 回 CLI インストールを報告したユニークユーザー。
- `installsCurrent`: インストールを報告し、かつ自分のテレメトリを削除していないユニークユーザー。

## 透明性 + ユーザー制御

すべての人が見るのは**集計されたインストールカウンター**だけです。

アカウントを削除すると、テレメトリデータも削除されます。

## テレメトリを無効化する方法

環境変数を設定します。

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

これを設定すると、CLI はインストールテレメトリを送信しません。
