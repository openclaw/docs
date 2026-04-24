---
read_when:
    - zsh/bash/fish/PowerShell 用のシェル補完が必要な場合
    - OpenClaw の状態配下に補完スクリプトをキャッシュする必要がある場合
summary: '`openclaw completion` の CLI リファレンス（シェル補完スクリプトを生成/インストール）'
title: 補完
x-i18n:
    generated_at: "2026-04-24T04:49:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9d064723b97f09105154197e4ef35b98ccb61e4b775f3fd990b18958f751f713
    source_path: cli/completion.md
    workflow: 15
---

# `openclaw completion`

シェル補完スクリプトを生成し、必要に応じてシェルプロファイルにインストールします。

## 使用法

```bash
openclaw completion
openclaw completion --shell zsh
openclaw completion --install
openclaw completion --shell fish --install
openclaw completion --write-state
openclaw completion --shell bash --write-state
```

## オプション

- `-s, --shell <shell>`: 対象シェル（`zsh`、`bash`、`powershell`、`fish`。デフォルト: `zsh`）
- `-i, --install`: source 行をシェルプロファイルに追加して補完をインストールします
- `--write-state`: スクリプトを stdout に出力せず、補完スクリプトを `$OPENCLAW_STATE_DIR/completions` に書き込みます
- `-y, --yes`: インストール確認プロンプトをスキップします

## 注

- `--install` は、シェルプロファイルに小さな「OpenClaw Completion」ブロックを書き込み、キャッシュされたスクリプトを参照するようにします。
- `--install` または `--write-state` を指定しない場合、このコマンドはスクリプトを stdout に出力します。
- 補完生成ではコマンドツリーを事前に読み込むため、ネストされたサブコマンドも含まれます。

## 関連

- [CLI リファレンス](/ja-JP/cli)
