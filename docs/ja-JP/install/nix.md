---
read_when:
    - 再現可能でロールバックできるインストールが必要な場合
    - すでに Nix/NixOS/Home Manager を使用している場合
    - すべてを固定し、宣言的に管理したい場合
summary: Nix を使用して OpenClaw を宣言的にインストールする
title: Nix
x-i18n:
    generated_at: "2026-07-11T22:21:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6f74e259ec3d909c73d9184db24d236135db04c29c2e7fab9be9e6fa7f98ba91
    source_path: install/nix.md
    workflow: 16
---

**[nix-openclaw](https://github.com/openclaw/nix-openclaw)** を使用して、OpenClaw を宣言的にインストールします。これは、必要な機能をすべて備えた公式の Home Manager モジュールです。

<Info>
[nix-openclaw](https://github.com/openclaw/nix-openclaw) リポジトリが、Nix インストールに関する信頼できる唯一の情報源です。このページでは概要を簡潔に説明します。
</Info>

## 導入されるもの

- Gateway + macOS アプリ + ツール（whisper、spotify、カメラ）。すべてバージョン固定
- 再起動後も稼働する launchd サービス
- 宣言的な設定に対応した Plugin システム
- 即時ロールバック: `home-manager switch --rollback`

## クイックスタート

<Steps>
  <Step title="Determinate Nix をインストールする">
    Nix がまだインストールされていない場合は、[Determinate Nix インストーラー](https://github.com/DeterminateSystems/nix-installer)の手順に従ってください。
  </Step>
  <Step title="ローカル flake を作成する">
    nix-openclaw リポジトリのエージェント優先テンプレートを使用します。
    ```bash
    mkdir -p ~/code/openclaw-local
    # nix-openclaw リポジトリから templates/agent-first/flake.nix をコピー
    ```
  </Step>
  <Step title="シークレットを設定する">
    メッセージングボットのトークンとモデルプロバイダーの API キーを設定します。`~/.secrets/` に通常のファイルとして保存する方法で問題ありません。
  </Step>
  <Step title="テンプレートのプレースホルダーを埋めて切り替える">
    ```bash
    home-manager switch
    ```
  </Step>
  <Step title="確認する">
    launchd サービスが実行中で、ボットがメッセージに応答することを確認します。
  </Step>
</Steps>

モジュールの全オプションと例については、[nix-openclaw README](https://github.com/openclaw/nix-openclaw) を参照してください。

## Nix モードのランタイム動作

`OPENCLAW_NIX_MODE=1` が設定されている場合（nix-openclaw では自動設定）、OpenClaw は Nix 管理のインストール向けの決定論的モードに移行します。他の Nix パッケージでも同じモードを設定できます。nix-openclaw が公式リファレンスです。

手動で設定することもできます。

```bash
export OPENCLAW_NIX_MODE=1
```

macOS では、GUI アプリはシェルの環境変数を継承しません。代わりに `defaults` で Nix モードを有効にします。

```bash
defaults write ai.openclaw.mac openclaw.nixMode -bool true
```

### Nix モードで変わること

- 自動インストールと自己変更のフローが無効になります。
- `openclaw.json` は不変として扱われます。起動時に導出されるデフォルト値はランタイム内だけに保持され、設定を書き込む機能（セットアップ、オンボーディング、変更を伴う `openclaw update`、Plugin のインストール／更新／アンインストール／有効化、`doctor --fix`、`doctor --generate-gateway-token`、`openclaw config set`）はファイルの編集を拒否します。
- 代わりに Nix ソースを編集します。nix-openclaw では、エージェント優先の[クイックスタート](https://github.com/openclaw/nix-openclaw#quick-start)を使用し、`programs.openclaw.config` または `instances.<name>.config` に設定を記述します。
- 依存関係が不足している場合は、Nix 固有の修正方法を示すメッセージが表示されます。
- UI に読み取り専用の Nix モードバナーが表示されます。

### 設定と状態のパス

OpenClaw は `OPENCLAW_CONFIG_PATH` から JSON5 設定を読み取り、変更可能なデータを `OPENCLAW_STATE_DIR` に保存します。Nix では、ランタイム状態と設定が不変ストアに入らないよう、これらを Nix 管理の場所に明示的に設定してください。

| 変数                   | デフォルト                              |
| ---------------------- | --------------------------------------- |
| `OPENCLAW_HOME`        | `HOME` / `USERPROFILE` / `os.homedir()` |
| `OPENCLAW_STATE_DIR`   | `~/.openclaw`                           |
| `OPENCLAW_CONFIG_PATH` | `$OPENCLAW_STATE_DIR/openclaw.json`     |

### サービスの PATH 検出

launchd/systemd の Gateway サービスは Nix プロファイルのバイナリを自動検出するため、`nix` でインストールされた実行ファイルを呼び出す Plugin やツールは、PATH を手動設定しなくても動作します。

- `NIX_PROFILES` が設定されている場合、すべてのエントリが右から左の優先順位でサービスの PATH に追加されます（Nix シェルの優先順位と一致し、右端が優先されます）。
- `NIX_PROFILES` が未設定の場合、フォールバックとして `~/.nix-profile/bin` が追加されます。

これは、macOS の launchd と Linux の systemd の両方のサービス環境に適用されます。

## 関連項目

<CardGroup cols={2}>
  <Card title="nix-openclaw" href="https://github.com/openclaw/nix-openclaw" icon="arrow-up-right-from-square">
    信頼できる唯一の情報源である Home Manager モジュールと完全なセットアップガイド。
  </Card>
  <Card title="セットアップウィザード" href="/ja-JP/start/wizard" icon="wand-magic-sparkles">
    Nix を使用しない CLI セットアップの手順。
  </Card>
  <Card title="Docker" href="/ja-JP/install/docker" icon="docker">
    Nix を使用しない代替手段としてのコンテナ化セットアップ。
  </Card>
  <Card title="更新" href="/ja-JP/install/updating" icon="arrow-up-right-from-square">
    Home Manager で管理されるインストールをパッケージとともに更新する方法。
  </Card>
</CardGroup>
