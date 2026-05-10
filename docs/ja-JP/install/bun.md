---
read_when:
    - 最速のローカル開発ループ (bun + watch) が必要な場合
    - Bun のインストール、パッチ、ライフサイクルスクリプトの問題に遭遇した
summary: Bun ワークフロー（実験的）：pnpm と比べたインストールと注意点
title: Bun (実験的)
x-i18n:
    generated_at: "2026-05-10T19:39:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: d97a7da26520d66e6033065c50d6490c869ace3d5f0b25aafcd196074cf7df7c
    source_path: install/bun.md
    workflow: 16
---

<Warning>
Bun は **Gateway ランタイムには推奨されません**（WhatsApp と Telegram に既知の問題があります）。本番環境では Node を使用してください。
</Warning>

Bun は、TypeScript を直接実行するための任意のローカルランタイムです（`bun run ...`、`bun --watch ...`）。デフォルトのパッケージマネージャーは引き続き `pnpm` であり、完全にサポートされ、ドキュメントツールで使用されています。Bun は `pnpm-lock.yaml` を使用できず、無視します。

## インストール

<Steps>
  <Step title="依存関係をインストール">
    ```sh
    bun install
    ```

    `bun.lock` / `bun.lockb` は gitignore の対象なので、リポジトリに差分は発生しません。lockfile の書き込みを完全にスキップするには:

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

Bun は、明示的に信頼されていない限り、依存関係のライフサイクルスクリプトをブロックします。このリポジトリでは、一般的にブロックされる次のスクリプトは不要です:

- `baileys` `preinstall` -- Node のメジャーバージョンが 20 以上か確認します（OpenClaw はデフォルトで Node 24 を使用し、現在 `22.16+` の Node 22 LTS も引き続きサポートしています）
- `protobufjs` `postinstall` -- 互換性のないバージョンスキームに関する警告を出力します（ビルド成果物はありません）

これらのスクリプトが必要なランタイム問題に遭遇した場合は、明示的に信頼してください:

```sh
bun pm trust baileys protobufjs
```

## 注意点

一部のスクリプトはまだ pnpm をハードコードしています（例: `docs:build`、`ui:*`、`protocol:check`）。現時点では、それらは pnpm 経由で実行してください。

## 関連

- [インストール概要](/ja-JP/install)
- [Node.js](/ja-JP/install/node)
- [更新](/ja-JP/install/updating)
