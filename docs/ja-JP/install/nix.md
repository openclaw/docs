---
read_when:
    - 再現可能でロールバック可能なインストールを行いたい場合
    - すでに Nix/NixOS/Home Manager を使用している
    - すべてを固定し、宣言的に管理したい場合
summary: Nix で OpenClaw を宣言的にインストールする
title: Nix
x-i18n:
    generated_at: "2026-05-06T17:57:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1b4c2eca298ac7ae60baea4d06855edb73c0b8bfe253a3f478d93e934b31253b
    source_path: install/nix.md
    workflow: 16
    postprocess_version: locale-links-v1
---

OpenClaw を **[nix-openclaw](https://github.com/openclaw/nix-openclaw)** で宣言的にインストールします - ファーストパーティの、必要な機能を含む Home Manager モジュールです。

<Info>
[nix-openclaw](https://github.com/openclaw/nix-openclaw) リポジトリは Nix インストールの信頼できる情報源です。このページはクイック概要です。
</Info>

## 得られるもの

- Gateway + macOS アプリ + ツール (whisper, spotify, cameras) -- すべてピン留め済み
- 再起動後も維持される launchd サービス
- 宣言的設定に対応した Plugin システム
- 即時ロールバック: `home-manager switch --rollback`

## クイックスタート

<Steps>
  <Step title="Determinate Nix をインストールする">
    Nix がまだインストールされていない場合は、[Determinate Nix installer](https://github.com/DeterminateSystems/nix-installer) の手順に従ってください。
  </Step>
  <Step title="ローカル flake を作成する">
    nix-openclaw リポジトリのエージェント優先テンプレートを使用します:
    ```bash
    mkdir -p ~/code/openclaw-local
    # Copy templates/agent-first/flake.nix from the nix-openclaw repo
    ```
  </Step>
  <Step title="シークレットを設定する">
    メッセージングボットのトークンとモデルプロバイダーの API キーを設定します。`~/.secrets/` にあるプレーンファイルで問題なく機能します。
  </Step>
  <Step title="テンプレートのプレースホルダーを埋めて切り替える">
    ```bash
    home-manager switch
    ```
  </Step>
  <Step title="検証する">
    launchd サービスが実行中で、ボットがメッセージに応答することを確認します。
  </Step>
</Steps>

完全なモジュールオプションと例については、[nix-openclaw README](https://github.com/openclaw/nix-openclaw) を参照してください。

## Nix モードのランタイム動作

`OPENCLAW_NIX_MODE=1` が設定されている場合 (nix-openclaw では自動)、OpenClaw は Nix 管理のインストール向けの決定論的モードに入ります。他の Nix パッケージも同じモードを設定できます。nix-openclaw はファーストパーティのリファレンスです。

手動で設定することもできます:

```bash
export OPENCLAW_NIX_MODE=1
```

macOS では、GUI アプリはシェル環境変数を自動的には継承しません。代わりに defaults 経由で Nix モードを有効にします:

```bash
defaults write ai.openclaw.mac openclaw.nixMode -bool true
```

### Nix モードで変わること

- 自動インストールと自己変更フローが無効になります
- `openclaw.json` はイミュータブルとして扱われます。起動時に導出されるデフォルトはランタイムのみのままで、setup、オンボーディング、変更を伴う `openclaw update`、Plugin のインストール/更新/アンインストール/有効化、`doctor --fix`、`doctor --generate-gateway-token`、`openclaw config set` などの設定ライターはファイルの編集を拒否します。
- エージェントは代わりに Nix ソースを編集する必要があります。nix-openclaw では、エージェント優先の [クイックスタート](https://github.com/openclaw/nix-openclaw#quick-start) を使用し、`programs.openclaw.config` または `instances.<name>.config` の下に設定を置きます。
- 不足している依存関係には Nix 固有の修復メッセージが表示されます
- UI に読み取り専用の Nix モードバナーが表示されます

### 設定と状態のパス

OpenClaw は `OPENCLAW_CONFIG_PATH` から JSON5 設定を読み取り、可変データを `OPENCLAW_STATE_DIR` に保存します。Nix 下で実行する場合は、ランタイム状態と設定がイミュータブルなストアに入らないよう、これらを Nix 管理の場所へ明示的に設定してください。

| 変数                   | デフォルト                              |
| ---------------------- | --------------------------------------- |
| `OPENCLAW_HOME`        | `HOME` / `USERPROFILE` / `os.homedir()` |
| `OPENCLAW_STATE_DIR`   | `~/.openclaw`                           |
| `OPENCLAW_CONFIG_PATH` | `$OPENCLAW_STATE_DIR/openclaw.json`     |

### サービス PATH の検出

launchd/systemd の gateway サービスは Nix プロファイルのバイナリを自動検出するため、
Plugin や、`nix` でインストールされた実行可能ファイルをシェルアウトするツールは、
手動の PATH 設定なしで機能します:

- `NIX_PROFILES` が設定されている場合、すべてのエントリが右から左の優先順位でサービス PATH に追加されます
  (Nix シェルの優先順位と一致します - 右端が優先されます)。
- `NIX_PROFILES` が未設定の場合、フォールバックとして `~/.nix-profile/bin` が追加されます。

これは macOS launchd と Linux systemd の両方のサービス環境に適用されます。

## 関連

<CardGroup cols={2}>
  <Card title="nix-openclaw" href="https://github.com/openclaw/nix-openclaw" icon="arrow-up-right-from-square">
    信頼できる情報源である Home Manager モジュールと完全なセットアップガイド。
  </Card>
  <Card title="セットアップウィザード" href="/ja-JP/start/wizard" icon="wand-magic-sparkles">
    Nix 以外の CLI セットアップ手順。
  </Card>
  <Card title="Docker" href="/ja-JP/install/docker" icon="docker">
    Nix 以外の代替手段としてのコンテナ化セットアップ。
  </Card>
  <Card title="更新" href="/ja-JP/install/updating" icon="arrow-up-right-from-square">
    パッケージとあわせて Home Manager 管理のインストールを更新する方法。
  </Card>
</CardGroup>
