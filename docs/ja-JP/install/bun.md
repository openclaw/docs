---
read_when:
    - 最速のローカル開発ループ (bun + watch) を使いたい場合
    - Bun のインストール、パッチ、ライフサイクルスクリプトの問題に遭遇した場合
summary: Bun ワークフロー（実験的）：pnpm と比較したインストールと注意点
title: Bun (実験的)
x-i18n:
    generated_at: "2026-04-30T05:18:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: d596c8fa9cc585e23184e7b983ec3842361eac807a1f3c12a0529631876db486
    source_path: install/bun.md
    workflow: 16
---

<Warning>
Bun は **Gateway ランタイムには推奨されません**（WhatsApp と Telegram で既知の問題があります）。本番環境では Node を使用してください。
</Warning>

Bun は、TypeScript を直接実行するための任意のローカルランタイムです（`bun run ...`、`bun --watch ...`）。デフォルトのパッケージマネージャーは引き続き `pnpm` で、完全にサポートされており、docs ツールでも使用されています。Bun は `pnpm-lock.yaml` を使用できず、無視します。

## インストール

<Steps>
  <Step title="依存関係をインストールする">
    ```sh
    bun install
    ```

    `bun.lock` / `bun.lockb` は gitignore されているため、リポジトリの変更は発生しません。lockfile の書き込みを完全にスキップするには:

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

Bun は、明示的に信頼されていない限り、依存関係のライフサイクルスクリプトをブロックします。このリポジトリでは、一般的にブロックされるスクリプトは不要です:

- `@whiskeysockets/baileys` `preinstall` -- Node メジャー >= 20 を確認します（OpenClaw はデフォルトで Node 24 を使用し、現在 `22.14+` の Node 22 LTS も引き続きサポートしています）
- `protobufjs` `postinstall` -- 互換性のないバージョン体系に関する警告を出力します（ビルドアーティファクトはありません）

これらのスクリプトを必要とするランタイムの問題に遭遇した場合は、明示的に信頼してください:

```sh
bun pm trust @whiskeysockets/baileys protobufjs
```

## 注意事項

一部のスクリプトはまだ pnpm をハードコードしています（例: `docs:build`、`ui:*`、`protocol:check`）。当面はそれらを pnpm 経由で実行してください。

## 関連情報

- [インストールの概要](/ja-JP/install)
- [Node.js](/ja-JP/install/node)
- [更新](/ja-JP/install/updating)
