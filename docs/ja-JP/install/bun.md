---
read_when:
    - 最速のローカル開発ループ（bun + watch）が必要な場合
    - Bun のインストール、パッチ、ライフサイクルスクリプトの問題に遭遇した場合
summary: Bun ワークフロー（実験的）：pnpm と比較したインストールと注意点
title: Bun (実験的)
x-i18n:
    generated_at: "2026-05-07T13:20:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1637cb81310422b718934f9c2d1f506dec46f1624dd9ac850bed04321b863041
    source_path: install/bun.md
    workflow: 16
---

<Warning>
Bun は **Gateway ランタイムには推奨されません**（WhatsApp と Telegram に既知の問題があります）。本番環境では Node を使用してください。
</Warning>

Bun は TypeScript を直接実行するための任意のローカルランタイムです（`bun run ...`、`bun --watch ...`）。デフォルトのパッケージマネージャーは引き続き `pnpm` で、完全にサポートされており、ドキュメントツールでも使用されています。Bun は `pnpm-lock.yaml` を使用できず、無視します。

## インストール

<Steps>
  <Step title="依存関係をインストール">
    ```sh
    bun install
    ```

    `bun.lock` / `bun.lockb` は gitignore されているため、リポジトリに変更は発生しません。lockfile の書き込みを完全にスキップするには:

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

- `@whiskeysockets/baileys` `preinstall` -- Node のメジャーバージョンが 20 以上であることを確認します（OpenClaw はデフォルトで Node 24 を使用し、現在 `22.16+` の Node 22 LTS も引き続きサポートしています）
- `protobufjs` `postinstall` -- 互換性のないバージョンスキームに関する警告を出力します（ビルド成果物はありません）

これらのスクリプトを必要とするランタイム問題に遭遇した場合は、明示的に信頼してください:

```sh
bun pm trust @whiskeysockets/baileys protobufjs
```

## 注意事項

一部のスクリプトでは、まだ pnpm がハードコードされています（例: `docs:build`、`ui:*`、`protocol:check`）。当面はそれらを pnpm 経由で実行してください。

## 関連

- [インストールの概要](/ja-JP/install)
- [Node.js](/ja-JP/install/node)
- [更新](/ja-JP/install/updating)
