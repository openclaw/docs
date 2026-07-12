---
read_when:
    - OpenClaw で `exec` または `bash` ツールの結果を短くしたい場合
    - Tokenjuice Pluginをインストールまたは有効化したい場合
    - tokenjuice が何を変更し、何を未加工のまま残すのかを理解する必要があります
summary: オプションの Tokenjuice Plugin を使用して、冗長な exec および bash ツールの結果を圧縮する
title: トークン効率
x-i18n:
    generated_at: "2026-07-11T22:48:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 96b110563a2600429dd9f0d38997cf7cc5ae4952b7f146a6ab64c96f2f202440
    source_path: tools/tokenjuice.md
    workflow: 16
---

`tokenjuice` は、コマンドの実行後にノイズの多い `exec` および `bash`
ツールの結果を圧縮する、オプションの外部 Plugin です。

変更するのは返される `tool_result` であり、コマンド自体ではありません。Tokenjuice は
シェル入力の書き換え、コマンドの再実行、終了コードの変更を行いません。

現在、これは OpenClaw の組み込み実行と、Codex app-server ハーネス内の OpenClaw
動的ツールに適用されます。Tokenjuice は OpenClaw のツール結果ミドルウェアにフックし、
出力がアクティブなハーネスセッションに戻される前にトリミングします。

## Plugin を有効にする

一度インストールします。

```bash
openclaw plugins install clawhub:@openclaw/tokenjuice
```

次に有効にします。

```bash
openclaw config set plugins.entries.tokenjuice.enabled true
```

同等の操作:

```bash
openclaw plugins enable tokenjuice
```

設定を直接編集する場合:

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

## tokenjuice が変更する内容

- ノイズの多い `exec` および `bash` の結果を、セッションに戻す前に圧縮します。
- 元のコマンド実行には一切変更を加えません。
- 安全なインベントリーポリシーを適用します。ファイル内容を正確に読み取るコマンドの出力はそのまま維持し、単独のリポジトリインベントリーコマンドは圧縮可能とし、安全でない複合コマンドシーケンスの出力はそのまま維持します。
- オプトインのままです。すべての出力を逐語的に保持する場合は、Plugin を無効にしてください。

## 動作を確認する

1. Plugin を有効にします。
2. `exec` を呼び出せるセッションを開始します。
3. `git status` など、ノイズの多いコマンドを実行します。
4. 返されたツール結果が、生のシェル出力よりも短く、構造化されていることを確認します。

## Plugin を無効にする

```bash
openclaw config set plugins.entries.tokenjuice.enabled false
```

または:

```bash
openclaw plugins disable tokenjuice
```

## 関連項目

- [Exec ツール](/ja-JP/tools/exec)
- [思考レベル](/ja-JP/tools/thinking)
- [コンテキストエンジン](/ja-JP/concepts/context-engine)
