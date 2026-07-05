---
read_when:
    - 再現可能でロールバック可能なインストールを求める場合
    - すでに Nix/NixOS/Home Manager を使用している
    - すべてを固定し、宣言的に管理したい
summary: Nix で OpenClaw を宣言的にインストールする
title: Nix
x-i18n:
    generated_at: "2026-07-05T11:32:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6f74e259ec3d909c73d9184db24d236135db04c29c2e7fab9be9e6fa7f98ba91
    source_path: install/nix.md
    workflow: 16
---

OpenClaw を宣言的にインストールするには、ファーストパーティの必要な機能が揃った Home Manager モジュールである **[nix-openclaw](https://github.com/openclaw/nix-openclaw)** を使用します。

<Info>
[nix-openclaw](https://github.com/openclaw/nix-openclaw) リポジトリは、Nix インストールに関する信頼できる情報源です。このページはクイック概要です。
</Info>

## 得られるもの

- Gateway + macOS アプリ + ツール（whisper、spotify、cameras）。すべてピン留め済み
- 再起動後も継続する launchd サービス
- 宣言的設定を備えた Plugin システム
- 即時ロールバック: `home-manager switch --rollback`

## クイックスタート

<Steps>
  <Step title="Install Determinate Nix">
    Nix がまだインストールされていない場合は、[Determinate Nix installer](https://github.com/DeterminateSystems/nix-installer) の手順に従ってください。
  </Step>
  <Step title="Create a local flake">
    nix-openclaw リポジトリの agent-first テンプレートを使用します。
    ```bash
    mkdir -p ~/code/openclaw-local
    # Copy templates/agent-first/flake.nix from the nix-openclaw repo
    ```
  </Step>
  <Step title="Configure secrets">
    メッセージングボットのトークンとモデルプロバイダーの API キーを設定します。`~/.secrets/` にあるプレーンファイルで問題ありません。
  </Step>
  <Step title="Fill in template placeholders and switch">
    ```bash
    home-manager switch
    ```
  </Step>
  <Step title="Verify">
    launchd サービスが実行中で、ボットがメッセージに応答することを確認します。
  </Step>
</Steps>

完全なモジュールオプションと例については、[nix-openclaw README](https://github.com/openclaw/nix-openclaw) を参照してください。

## Nix モードのランタイム動作

`OPENCLAW_NIX_MODE=1` が設定されている場合（nix-openclaw では自動）、OpenClaw は Nix 管理のインストール向けの決定論的モードに入ります。他の Nix パッケージも同じモードを設定できます。nix-openclaw はファーストパーティのリファレンスです。

手動で設定することもできます。

```bash
export OPENCLAW_NIX_MODE=1
```

macOS では、GUI アプリはシェル環境変数を継承しません。代わりに `defaults` で Nix モードを有効にしてください。

```bash
defaults write ai.openclaw.mac openclaw.nixMode -bool true
```

### Nix モードで変わること

- 自動インストールと自己変更フローは無効化されます。
- `openclaw.json` は不変として扱われます。起動時に導出されるデフォルトはランタイム内にのみ留まり、設定ライター（setup、オンボーディング、変更を伴う `openclaw update`、Plugin の install/update/uninstall/enable、`doctor --fix`、`doctor --generate-gateway-token`、`openclaw config set`）はファイルの編集を拒否します。
- 代わりに Nix ソースを編集してください。nix-openclaw では、agent-first の[クイックスタート](https://github.com/openclaw/nix-openclaw#quick-start)を使用し、`programs.openclaw.config` または `instances.<name>.config` の下に設定を置きます。
- 不足している依存関係は、Nix 固有の修復メッセージとして表示されます。
- UI には読み取り専用の Nix モードバナーが表示されます。

### 設定と状態のパス

OpenClaw は `OPENCLAW_CONFIG_PATH` から JSON5 設定を読み取り、`OPENCLAW_STATE_DIR` に可変データを保存します。Nix では、ランタイム状態と設定が不変ストアの外に留まるよう、これらを Nix 管理の場所に明示的に設定してください。

| 変数                   | デフォルト                              |
| ---------------------- | --------------------------------------- |
| `OPENCLAW_HOME`        | `HOME` / `USERPROFILE` / `os.homedir()` |
| `OPENCLAW_STATE_DIR`   | `~/.openclaw`                           |
| `OPENCLAW_CONFIG_PATH` | `$OPENCLAW_STATE_DIR/openclaw.json`     |

### サービス PATH の検出

launchd/systemd の Gateway サービスは Nix プロファイルのバイナリを自動検出するため、`nix` でインストールされた実行可能ファイルをシェルから呼び出す Plugin やツールは、手動で PATH を設定しなくても動作します。

- `NIX_PROFILES` が設定されている場合、すべてのエントリが右から左の優先順位でサービス PATH に追加されます（Nix シェルの優先順位と一致し、最も右が優先されます）。
- `NIX_PROFILES` が未設定の場合、フォールバックとして `~/.nix-profile/bin` が追加されます。

これは macOS launchd と Linux systemd の両方のサービス環境に適用されます。

## 関連

<CardGroup cols={2}>
  <Card title="nix-openclaw" href="https://github.com/openclaw/nix-openclaw" icon="arrow-up-right-from-square">
    信頼できる情報源である Home Manager モジュールと完全なセットアップガイド。
  </Card>
  <Card title="Setup wizard" href="/ja-JP/start/wizard" icon="wand-magic-sparkles">
    Nix 以外の CLI セットアップ手順。
  </Card>
  <Card title="Docker" href="/ja-JP/install/docker" icon="docker">
    Nix 以外の代替手段としてのコンテナ化セットアップ。
  </Card>
  <Card title="Updating" href="/ja-JP/install/updating" icon="arrow-up-right-from-square">
    パッケージとともに Home Manager 管理のインストールを更新する方法。
  </Card>
</CardGroup>
