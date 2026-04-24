---
read_when:
    - 最速のローカル開発ループ（bun + watch）が欲しい場合
    - Bun のインストール/patch/ライフサイクルスクリプトの問題に遭遇した場合
summary: 'Bun ワークフロー（実験的）: インストール方法と pnpm との違い・注意点'
title: Bun（実験的）
x-i18n:
    generated_at: "2026-04-24T05:03:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5637f64fe272faf74915e8de115f21fdf9c9dd0406e5c471932323b2c1d4c0bd
    source_path: install/bun.md
    workflow: 15
---

<Warning>
Bun は **gateway ランタイムには推奨されません**（WhatsApp と Telegram で既知の問題があります）。本番環境では Node を使用してください。
</Warning>

Bun は、TypeScript を直接実行するための任意のローカルランタイムです（`bun run ...`, `bun --watch ...`）。デフォルトのパッケージマネージャーは引き続き `pnpm` であり、これは完全にサポートされ、docs tooling でも使用されています。Bun は `pnpm-lock.yaml` を使用できず、無視します。

## インストール

<Steps>
  <Step title="依存関係をインストールする">
    ```sh
    bun install
    ```

    `bun.lock` / `bun.lockb` は gitignore 対象なので、repo に差分は発生しません。lockfile の書き込み自体を完全にスキップするには:

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

Bun は、明示的に信頼されない限り依存関係のライフサイクルスクリプトをブロックします。この repo では、よくブロックされるスクリプトは必須ではありません。

- `@whiskeysockets/baileys` の `preinstall` -- Node major >= 20 を確認します（OpenClaw のデフォルトは Node 24 で、現在も Node 22 LTS（`22.14+`）をサポートしています）
- `protobufjs` の `postinstall` -- 互換性のないバージョンスキームについて警告を出します（ビルド成果物はありません）

これらのスクリプトが必要なランタイム問題に遭遇した場合は、明示的に信頼してください。

```sh
bun pm trust @whiskeysockets/baileys protobufjs
```

## 注意点

一部のスクリプトは依然として pnpm をハードコードしています（たとえば `docs:build`, `ui:*`, `protocol:check`）。それらは現時点では pnpm 経由で実行してください。

## 関連

- [Install overview](/ja-JP/install)
- [Node.js](/ja-JP/install/node)
- [Updating](/ja-JP/install/updating)
