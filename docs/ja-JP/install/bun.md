---
read_when:
    - 最速のローカル開発ループ（bun + watch）を使いたい
    - Bun のインストール、パッチ、ライフサイクルスクリプトの問題に遭遇した
summary: 'Bun ワークフロー（実験的）: pnpm と比較したインストールと注意点'
title: Bun（実験的）
x-i18n:
    generated_at: "2026-07-05T11:31:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b836be354166ceb073d170e472e8b69c3f517e754fe71417df1d85d27a18ae94
    source_path: install/bun.md
    workflow: 16
---

<Warning>
Bun は Gateway ランタイムには推奨されません（WhatsApp と Telegram で既知の問題があります）。本番環境では Node を使用してください。
</Warning>

Bun は TypeScript を直接実行するための任意のローカルランタイムです（`bun run ...`、`bun --watch ...`）。デフォルトのパッケージマネージャーは引き続き `pnpm` で、完全にサポートされ、ドキュメントツールで使用されています。Bun は `pnpm-lock.yaml` を使用できず、無視します。

## インストール

<Steps>
  <Step title="依存関係をインストール">
    ```sh
    bun install
    ```

    `bun.lock` / `bun.lockb` は gitignore されているため、リポジトリの差分は発生しません。lockfile の書き込みを完全にスキップするには:

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

Bun は明示的に信頼しない限り、依存関係のライフサイクルスクリプトをブロックします。このリポジトリでは、一般的にブロックされる次のスクリプトは不要です:

- `baileys` `preinstall`: Node のメジャーバージョンが 20 以上かを確認します（OpenClaw には Node 22.19+ または 23.11+ が必要で、Node 24 が推奨されます）
- `protobufjs` `postinstall`: 互換性のないバージョンスキームに関する警告を出力します（ビルド成果物はありません）

これらのスクリプトが必要なランタイム問題に遭遇した場合は、明示的に信頼してください:

```sh
bun pm trust baileys protobufjs
```

## 注意点

一部のパッケージスクリプトは内部で `pnpm` をハードコードしています（例: `check:docs`、`ui:*`、`protocol:check`）。`bun run` 経由で実行しても `pnpm` をシェル経由で呼び出すため、それらは `pnpm` で直接実行してください。

## 関連

- [インストール概要](/ja-JP/install)
- [Node.js](/ja-JP/install/node)
- [更新](/ja-JP/install/updating)
