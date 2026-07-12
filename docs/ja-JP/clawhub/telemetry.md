---
read_when:
    - テレメトリ／プライバシー制御に対応中
    - 収集されるデータに関する質問
summary: ClawHub CLI によって収集されるインストールテレメトリと、その収集を無効にする方法。
x-i18n:
    generated_at: "2026-07-12T21:24:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 906be32778baaf89e77c5350cd33ff3b975df66d8152a33fdf20c24b5c8286ce
    source_path: clawhub/telemetry.md
    workflow: 16
---

# テレメトリ

ClawHub は、インストール数の集計に最小限の CLI テレメトリを使用します。

## テレメトリが収集される条件

テレメトリは、次の条件をすべて満たす場合にのみ送信されます。

- CLI でログインしている。
- `clawhub install <slug>` を実行する。
- テレメトリが**無効化されていない**（下記の「無効化する方法」を参照）。

ログインしていない場合、何も報告されません。

## 収集する情報

報告対象となる `clawhub install` を実行するたびに、CLI はベストエフォートでインストールイベントを 1 件送信します。

イベントには次の情報が含まれます。

- `slug`: インストールされた Skills のスラッグ。
- `version`: 判明している場合は、インストールされたバージョン。

### 収集しない情報

- フォルダーパスや、フォルダーから派生した識別子。
- ファイルの内容。
- 実行ごとのログ、プロンプト、その他の CLI 出力。

## インストール数

ClawHub は、Skills ごとに次の集計カウンターを保持します。

- `installsAllTime`: その Skills について、CLI からのインストールを 1 回以上報告した一意のユーザー数。
- `installsCurrent`: インストールを報告し、自身のテレメトリを削除していない一意のユーザー数。

## 透明性とユーザーによる制御

すべてのユーザーに表示されるのは、**集計されたインストールカウンター**のみです。

アカウントを削除すると、テレメトリデータも削除されます。

## テレメトリを無効化する方法

次の環境変数を設定します。

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

これを設定すると、CLI はインストールテレメトリを送信しません。
