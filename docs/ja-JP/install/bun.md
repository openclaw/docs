---
read_when:
    - Bun で依存関係をインストールするか、パッケージスクリプトを実行したい場合
    - Bun のインストール／パッチ／ライフサイクルスクリプトの問題が発生する
summary: インストールとパッケージスクリプトには Bun ワークフローを使用し、実行時には Node が必要です
title: Bun
x-i18n:
    generated_at: "2026-07-14T13:49:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: b822f700123b91c785eb881ebf28a63e77915b46dfd44beb9dbf63fb71aaa0d2
    source_path: install/bun.md
    workflow: 16
---

<Warning>
Bun は必要な `node:sqlite` API を提供していないため、OpenClaw CLI または Gateway を実行できません。OpenClaw のすべてのランタイムコマンドには、サポートされている Node バージョンをインストールしてください。
</Warning>

Bun は、オプションの依存関係インストーラーおよびパッケージスクリプトランナーとして引き続き使用できます。デフォルトのパッケージマネージャーは引き続き `pnpm` であり、完全にサポートされ、ドキュメントツールで使用されています。Bun は `pnpm-lock.yaml` を使用できず、これを無視します。

## インストール

<Steps>
  <Step title="依存関係をインストール">
    ```sh
    bun install
    ```

    `bun.lock` / `bun.lockb` は gitignore の対象であるため、リポジトリに変更は生じません。ロックファイルへの書き込みを完全にスキップするには、次のコマンドを実行します。

    ```sh
    bun install --no-save
    ```

  </Step>
  <Step title="ビルドとテスト">
    ```sh
    bun run build
    bun run vitest run
    ```

    OpenClaw 自体を起動するコマンドは、引き続き Node 経由で実行する必要があります。

  </Step>
</Steps>

## ライフサイクルスクリプト

Bun は、明示的に信頼されていない依存関係のライフサイクルスクリプトをブロックします。このリポジトリでは、一般的にブロックされる次のスクリプトは必要ありません。

- `baileys` `preinstall`: Node のメジャーバージョンが 20 以上であることを確認します（OpenClaw には Node 22.22.3+、24.15+、または 25.9+ が必要で、Node 24 を推奨します）
- `protobufjs` `postinstall`: 互換性のないバージョン体系に関する警告を出力します（ビルド成果物は生成されません）

これらのスクリプトが必要となるランタイムの問題が発生した場合は、明示的に信頼してください。

```sh
bun pm trust baileys protobufjs
```

## 注意事項

一部のパッケージスクリプトでは、内部で `pnpm` がハードコードされています（例: `check:docs`、`ui:*`、`protocol:check`）。`bun run` 経由で実行しても `pnpm` がシェルから起動されるため、それらは `pnpm` から直接実行してください。

## 関連項目

- [インストールの概要](/ja-JP/install)
- [Node.js](/ja-JP/install/node)
- [更新](/ja-JP/install/updating)
