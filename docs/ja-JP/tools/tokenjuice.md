---
read_when:
    - OpenClawでより短い`exec`または`bash`ツール結果を求めている
    - Tokenjuice Plugin をインストールまたは有効化したい
    - tokenjuice が何を変更し、何を未加工のまま残すのかを理解する必要があります
summary: 任意の Tokenjuice Plugin を使用して、ノイズの多い exec と bash ツールの結果を圧縮する
title: Tokenjuice
x-i18n:
    generated_at: "2026-07-05T11:56:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 96b110563a2600429dd9f0d38997cf7cc5ae4952b7f146a6ab64c96f2f202440
    source_path: tools/tokenjuice.md
    workflow: 16
---

`tokenjuice` は、コマンドがすでに実行された後にノイズの多い `exec` と `bash`
ツール結果を圧縮する、任意の外部プラグインです。

これは返される `tool_result` を変更するもので、コマンド自体は変更しません。Tokenjuice は
シェル入力を書き換えたり、コマンドを再実行したり、終了コードを変更したりしません。

現在、これは OpenClaw の埋め込み実行と、Codex app-server ハーネス内の OpenClaw 動的ツールに適用されます。Tokenjuice は OpenClaw のツール結果ミドルウェアにフックし、
出力がアクティブなハーネスセッションに戻る前にトリミングします。

## プラグインを有効化する

一度だけインストールします。

```bash
openclaw plugins install clawhub:@openclaw/tokenjuice
```

次に有効化します。

```bash
openclaw config set plugins.entries.tokenjuice.enabled true
```

同等のコマンド:

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

- ノイズの多い `exec` と `bash` の結果を、セッションに戻す前に圧縮します。
- 元のコマンド実行は変更せずに保ちます。
- 安全なインベントリポリシーを適用します。正確なファイル内容の読み取りは未加工のままにし、単独のリポジトリインベントリコマンドは圧縮でき、安全でない混在コマンド列は未加工のままにします。
- オプトインのままです。すべての場所で逐語的な出力が必要な場合は、プラグインを無効化してください。

## 動作を確認する

1. プラグインを有効化します。
2. `exec` を呼び出せるセッションを開始します。
3. `git status` のようなノイズの多いコマンドを実行します。
4. 返されたツール結果が、生のシェル出力より短く、より構造化されていることを確認します。

## プラグインを無効化する

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
