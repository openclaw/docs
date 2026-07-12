---
read_when:
    - zsh/bash/fish/PowerShell 用のシェル補完が必要な場合
    - OpenClaw の状態領域に補完スクリプトをキャッシュする必要があります
summary: '`openclaw completion` の CLI リファレンス（シェル補完スクリプトの生成/インストール）'
title: 補完
x-i18n:
    generated_at: "2026-07-11T22:05:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 67cb52a47036745150887c752d18e2dfa84fab2722c27c696142d23080bb2efd
    source_path: cli/completion.md
    workflow: 16
---

# `openclaw completion`

シェル補完スクリプトを生成し、OpenClaw の状態ディレクトリにキャッシュします。また、必要に応じてシェルプロファイルへインストールします。

## 使用方法

```bash
openclaw completion                          # zsh スクリプトを標準出力に出力
openclaw completion --shell fish             # fish スクリプトを出力
openclaw completion --write-state            # すべてのシェル用スクリプトをキャッシュ
openclaw completion --write-state --install  # 1回の操作でキャッシュしてからインストール
openclaw completion --shell bash --write-state
```

## オプション

- `-s, --shell <shell>`: 対象シェル（`zsh`、`bash`、`powershell`、`fish`。デフォルト: `zsh`）
- `-i, --install`: キャッシュされたスクリプトを読み込む行をシェルプロファイルに追加して、補完をインストール
- `--write-state`: 標準出力には出力せず、補完スクリプトを `$OPENCLAW_STATE_DIR/completions`（デフォルトは `~/.openclaw/completions`）に書き込みます。`--shell` を指定した場合はそのシェルのみ、指定しない場合は4つすべてを書き込みます
- `-y, --yes`: インストール確認プロンプトを省略（非対話モード）

## インストール手順

`--install` はプロファイルからキャッシュ済みスクリプトを参照するため、先にキャッシュが存在している必要があります。存在しない場合、コマンドは失敗し、`openclaw completion --write-state` を実行するよう案内します。`--write-state --install` を組み合わせると、両方を1回の操作で実行できます。`--shell` を指定しない場合、`--install` は `$SHELL` からシェルを検出します（検出できない場合は zsh を使用します）。

インストールでは、シェルプロファイルに小さな `# OpenClaw Completion` ブロックを書き込み、古くて低速な `source <(openclaw completion ...)` 行がある場合は、キャッシュを読み込む行に置き換えます。

| シェル     | プロファイル                                                                                                                                                                               |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| bash       | `~/.bashrc`（`~/.bashrc` が存在しない場合は `~/.bash_profile` を使用）                                                                                                                     |
| fish       | `~/.config/fish/config.fish`                                                                                                                                                               |
| powershell | `~/.config/powershell/Microsoft.PowerShell_profile.ps1`（Windows の場合: `Documents/PowerShell/Microsoft.PowerShell_profile.ps1`、または Windows PowerShell では `Documents/WindowsPowerShell/...`） |
| zsh        | `~/.zshrc`                                                                                                                                                                                 |

## 注意事項

- `--install` または `--write-state` を指定しない場合、コマンドはスクリプトを標準出力に出力します。
- 補完の生成では、Plugin の CLI コマンドを含むコマンドツリー全体が事前に読み込まれるため、ネストされたサブコマンドも含まれます。
- `openclaw update` は、更新が正常に完了すると補完キャッシュを自動的に更新します。`openclaw doctor` は、補完設定の欠落や古い設定を修復できます。

## 関連項目

- [CLI リファレンス](/ja-JP/cli)
