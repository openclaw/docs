---
read_when:
    - OpenClaw で `exec` または `bash` のツール結果をより短くしたい場合
    - バンドル済み tokenjuice Plugin を有効にしたい場合
    - tokenjuice が何を変更し、何を生のまま残すのかを理解する必要があります
summary: 任意のバンドル済み Plugin で、ノイズの多い exec と bash ツール結果をコンパクト化する
title: Tokenjuice
x-i18n:
    generated_at: "2026-04-24T05:27:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0ff542095eb730f06eadec213289b93e31f1afa179160b7d4e915329f09ad5f1
    source_path: tools/tokenjuice.md
    workflow: 15
---

`tokenjuice` は、コマンド実行後にノイズの多い `exec` と `bash`
ツール結果をコンパクト化する、任意のバンドル済み Plugin です。

これはコマンド自体ではなく、返される `tool_result` を変更します。tokenjuice は
shell 入力を書き換えたり、コマンドを再実行したり、終了コードを変更したりしません。

現時点では、これは Pi 埋め込み実行に適用されます。ここでは tokenjuice が埋め込み
`tool_result` 経路にフックし、セッションに戻る出力をトリムします。

## Plugin を有効にする

手早い方法:

```bash
openclaw config set plugins.entries.tokenjuice.enabled true
```

同等の方法:

```bash
openclaw plugins enable tokenjuice
```

OpenClaw にはすでにこの Plugin が同梱されています。別途 `plugins install`
や `tokenjuice install openclaw` の手順はありません。

config を直接編集したい場合:

```json5
{
  plugins: {
    entries: {
      tokenjuice: {
        enabled: true,
      },
    },
  },
}
```

## tokenjuice が変更するもの

- ノイズの多い `exec` と `bash` の結果を、セッションに戻す前にコンパクト化します。
- 元のコマンド実行には手を加えません。
- 正確な file-content 読み取りや、tokenjuice が生のまま残すべきその他のコマンドは保持します。
- オプトインのままです。どこでも逐語的な出力が欲しい場合は、この Plugin を無効にしてください。

## 動作確認

1. Plugin を有効にします。
2. `exec` を呼び出せるセッションを開始します。
3. `git status` のようなノイズの多いコマンドを実行します。
4. 返されるツール結果が、生の shell 出力より短く、より構造化されていることを確認します。

## Plugin を無効にする

```bash
openclaw config set plugins.entries.tokenjuice.enabled false
```

または:

```bash
openclaw plugins disable tokenjuice
```

## 関連

- [Exec ツール](/ja-JP/tools/exec)
- [Thinking レベル](/ja-JP/tools/thinking)
- [コンテキストエンジン](/ja-JP/concepts/context-engine)
