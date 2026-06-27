---
read_when:
    - OpenClaw でより短い `exec` または `bash` のツール結果が必要な場合
    - Tokenjuiceプラグインをインストールまたは有効化したい場合
    - tokenjuiceが何を変更し、何を未加工のまま残すかを理解する必要があります
summary: 任意の Tokenjuice Plugin でノイズの多い exec と bash ツール結果を圧縮する
title: トークンジュース
x-i18n:
    generated_at: "2026-06-27T13:20:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 183ab08d2a1150b446245514423b893cff9a85581980c15600cc16aec10eeae7
    source_path: tools/tokenjuice.md
    workflow: 16
---

`tokenjuice` は、コマンドがすでに実行された後に、ノイズの多い `exec` と `bash` のツール結果を圧縮する任意の外部 Plugin です。

これは返される `tool_result` を変更するもので、コマンド自体は変更しません。Tokenjuice はシェル入力を書き換えたり、コマンドを再実行したり、終了コードを変更したりしません。

現在、これは OpenClaw 埋め込み実行と、Codex app-server ハーネス内の OpenClaw 動的ツールに適用されます。Tokenjuice は OpenClaw のツール結果ミドルウェアにフックし、出力がアクティブなハーネスセッションへ戻る前にトリムします。

## Plugin を有効化する

一度だけインストールします。

```bash
openclaw plugins install clawhub:@openclaw/tokenjuice
```

次に有効化します。

```bash
openclaw config set plugins.entries.tokenjuice.enabled true
```

同等の方法:

```bash
openclaw plugins enable tokenjuice
```

設定を直接編集したい場合:

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

## tokenjuice が変更すること

- セッションへ戻される前に、ノイズの多い `exec` と `bash` の結果を圧縮します。
- 元のコマンド実行には手を加えません。
- 正確なファイル内容の読み取りや、tokenjuice が未加工のまま残すべきその他のコマンドを保持します。
- オプトインのままです。すべての場所で逐語的な出力が必要な場合は、Plugin を無効化してください。

## 動作を確認する

1. Plugin を有効化します。
2. `exec` を呼び出せるセッションを開始します。
3. `git status` などのノイズの多いコマンドを実行します。
4. 返されたツール結果が、生のシェル出力より短く、より構造化されていることを確認します。

## Plugin を無効化する

```bash
openclaw config set plugins.entries.tokenjuice.enabled false
```

または:

```bash
openclaw plugins disable tokenjuice
```

## 関連

- [Exec ツール](/ja-JP/tools/exec)
- [思考レベル](/ja-JP/tools/thinking)
- [コンテキストエンジン](/ja-JP/concepts/context-engine)
