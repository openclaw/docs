---
read_when:
    - 最速のローカル開発ループが必要な場合（bun + watch）
    - Bun のインストール／パッチ／ライフサイクルスクリプトに関する問題が発生した場合
summary: Bun ワークフロー（実験的）：pnpm と比較したインストール方法と注意点
title: Bun（実験的）
x-i18n:
    generated_at: "2026-07-11T22:20:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b836be354166ceb073d170e472e8b69c3f517e754fe71417df1d85d27a18ae94
    source_path: install/bun.md
    workflow: 16
---

<Warning>
Gateway ランタイムに Bun は推奨されません（WhatsApp と Telegram に既知の問題があります）。本番環境では Node を使用してください。
</Warning>

Bun は、TypeScript を直接実行するためのオプションのローカルランタイムです（`bun run ...`、`bun --watch ...`）。デフォルトのパッケージマネージャーは引き続き `pnpm` であり、完全にサポートされ、ドキュメントツールでも使用されています。Bun は `pnpm-lock.yaml` を使用できず、これを無視します。

## インストール

<Steps>
  <Step title="依存関係をインストール">
    ```sh
    bun install
    ```

    `bun.lock` / `bun.lockb` は gitignore の対象であるため、リポジトリに変更は発生しません。ロックファイルへの書き込みを完全にスキップするには、次を実行します。

    ```sh
    bun install --no-save
    ```

  </Step>
  <Step title="ビルドとテスト">
    ```sh
    bun run build
    bun run vitest run
    ```
  </Step>
</Steps>

## ライフサイクルスクリプト

Bun は、明示的に信頼されていない依存関係のライフサイクルスクリプトをブロックします。このリポジトリでは、一般的にブロックされる次のスクリプトは必要ありません。

- `baileys` の `preinstall`: Node のメジャーバージョンが 20 以上であることを確認します（OpenClaw には Node 22.19 以降または 23.11 以降が必要で、Node 24 が推奨されます）
- `protobufjs` の `postinstall`: 互換性のないバージョン体系について警告を出力します（ビルド成果物はありません）

これらのスクリプトを必要とするランタイムの問題が発生した場合は、明示的に信頼してください。

```sh
bun pm trust baileys protobufjs
```

## 注意事項

一部のパッケージスクリプトでは、内部で `pnpm` がハードコードされています（例: `check:docs`、`ui:*`、`protocol:check`）。これらを `bun run` で実行しても、シェル経由で `pnpm` が呼び出されるため、直接 `pnpm` で実行してください。

## 関連項目

- [インストールの概要](/ja-JP/install)
- [Node.js](/ja-JP/install/node)
- [アップデート](/ja-JP/install/updating)
