---
read_when:
    - zsh/bash/fish/PowerShell のシェル補完が必要な場合
    - OpenClaw 状態配下に補完スクリプトをキャッシュする必要があります
summary: 'CLI リファレンス: `openclaw completion`（シェル補完スクリプトの生成/インストール）'
title: 完了
x-i18n:
    generated_at: "2026-07-05T11:11:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 67cb52a47036745150887c752d18e2dfa84fab2722c27c696142d23080bb2efd
    source_path: cli/completion.md
    workflow: 16
---

# `openclaw completion`

シェル補完スクリプトを生成し、OpenClaw の状態にキャッシュし、必要に応じてシェルプロファイルにインストールします。

## 使用方法

```bash
openclaw completion                          # print zsh script to stdout
openclaw completion --shell fish             # print fish script
openclaw completion --write-state            # cache scripts for all shells
openclaw completion --write-state --install  # cache, then install in one step
openclaw completion --shell bash --write-state
```

## オプション

- `-s, --shell <shell>`: シェルターゲット（`zsh`、`bash`、`powershell`、`fish`。デフォルト: `zsh`）
- `-i, --install`: キャッシュされたスクリプトの source 行をシェルプロファイルに追加して補完をインストールします
- `--write-state`: stdout に出力せずに、補完スクリプトを `$OPENCLAW_STATE_DIR/completions`（デフォルト `~/.openclaw/completions`）に書き込みます。`--shell` 付きではそのシェルのみを書き込み、それ以外では 4 つすべてを書き込みます
- `-y, --yes`: インストール確認プロンプトをスキップします（非対話）

## インストールフロー

`--install` はプロファイルをキャッシュ済みスクリプトに向けるため、先にキャッシュが存在している必要があります。存在しない場合、コマンドは失敗し、`openclaw completion --write-state` を実行するよう案内します。`--write-state --install` を組み合わせると、両方を 1 ステップで実行できます。`--shell` がない場合、`--install` は `$SHELL` からシェルを検出します（zsh にフォールバック）。

インストールは小さな `# OpenClaw Completion` ブロックをシェルプロファイルに書き込み、古い低速な `source <(openclaw completion ...)` 行をキャッシュ済み source 行に置き換えます。

| シェル      | プロファイル                                                                                                                                                                              |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| bash       | `~/.bashrc`（`~/.bashrc` がない場合は `~/.bash_profile` にフォールバック）                                                                                                                |
| fish       | `~/.config/fish/config.fish`                                                                                                                                                              |
| powershell | `~/.config/powershell/Microsoft.PowerShell_profile.ps1`（Windows の場合: `Documents/PowerShell/Microsoft.PowerShell_profile.ps1`、または Windows PowerShell では `Documents/WindowsPowerShell/...`） |
| zsh        | `~/.zshrc`                                                                                                                                                                                |

## 注記

- `--install` または `--write-state` がない場合、コマンドはスクリプトを stdout に出力します。
- 補完生成は Plugin CLI コマンドを含む完全なコマンドツリーを積極的に読み込むため、ネストされたサブコマンドも含まれます。
- `openclaw update` は更新が成功した後に補完キャッシュを自動的に更新します。`openclaw doctor` は欠落または古くなった補完設定を修復できます。

## 関連

- [CLI リファレンス](/ja-JP/cli)
