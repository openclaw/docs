---
read_when:
    - 最速のローカル開発ループ（bun + watch）を使いたい場合
    - Bun のインストール、パッチ、ライフサイクルスクリプトの問題が発生した
summary: 'Bun ワークフロー（実験的）: pnpm とのインストールと注意点の比較'
title: Bun (実験的)
x-i18n:
    generated_at: "2026-06-27T11:47:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1c31f2c09f3c1f99ae1a306184a86f2240b0c0f4f655c2759f5aeb6bac6b745a
    source_path: install/bun.md
    workflow: 16
---

<Warning>
Bun は **Gateway ランタイムには推奨されません**（WhatsApp と Telegram で既知の問題があります）。本番環境では Node を使用してください。
</Warning>

Bun は、TypeScript を直接実行するための任意のローカルランタイムです（`bun run ...`、`bun --watch ...`）。デフォルトのパッケージマネージャーは引き続き `pnpm` であり、完全にサポートされ、docs ツールでも使用されています。Bun は `pnpm-lock.yaml` を使用できず、無視します。

## インストール

<Steps>
  <Step title="Install dependencies">
    ```sh
    bun install
    ```

    `bun.lock` / `bun.lockb` は gitignore 対象のため、リポジトリの差分は発生しません。lockfile の書き込みを完全にスキップするには、次のようにします。

    ```sh
    bun install --no-save
    ```

  </Step>
  <Step title="Build and test">
    ```sh
    bun run build
    bun run vitest run
    ```
  </Step>
</Steps>

## ライフサイクルスクリプト

Bun は、明示的に信頼されていない限り、依存関係のライフサイクルスクリプトをブロックします。このリポジトリでは、一般的にブロックされる次のスクリプトは不要です。

- `baileys` `preinstall` -- Node のメジャーバージョン >= 20 をチェックします（OpenClaw のデフォルトは Node 24 で、現在 `22.19+` の Node 22 LTS も引き続きサポートしています）
- `protobufjs` `postinstall` -- 互換性のないバージョンスキームに関する警告を出力します（ビルド成果物はありません）

これらのスクリプトを必要とするランタイムの問題に遭遇した場合は、明示的に信頼してください。

```sh
bun pm trust baileys protobufjs
```

## 注意事項

一部のスクリプトはまだ pnpm をハードコードしています（例: `check:docs`、`ui:*`、`protocol:check`）。当面はそれらを pnpm 経由で実行してください。

## 関連

- [インストール概要](/ja-JP/install)
- [Node.js](/ja-JP/install/node)
- [更新](/ja-JP/install/updating)
