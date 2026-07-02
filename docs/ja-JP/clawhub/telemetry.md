---
read_when:
    - テレメトリ / プライバシー制御に対応中
    - 収集されるデータに関する質問
summary: ClawHub CLI が収集するインストールテレメトリと、オプトアウトする方法。
x-i18n:
    generated_at: "2026-07-02T07:59:44Z"
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

## 収集する内容

報告対象の各 `clawhub install` で、CLI はベストエフォートのインストールイベントを 1 件送信します。

イベントには次が含まれます。

- `slug`: インストールされた skill slug。
- `version`: インストールされたバージョン（判明している場合）。

### 収集_しない_内容

- フォルダーパスやフォルダー由来の識別子はありません。
- ファイル内容はありません。
- 実行ごとのログ、プロンプト、その他の CLI 出力はありません。

## インストール数

ClawHub は skill ごとに集計カウンターを保持します。

- `installsAllTime`: その skill について少なくとも 1 回の CLI インストールを報告した一意のユーザー。
- `installsCurrent`: インストールを報告済みで、かつ自分のテレメトリを削除していない一意のユーザー。

## 透明性 + ユーザー制御

全員に表示されるのは**集計インストールカウンター**のみです。

アカウントを削除すると、テレメトリデータも削除されます。

## テレメトリを無効化する方法

環境変数を設定します。

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

これを設定すると、CLI はインストールテレメトリを送信しません。
