---
read_when:
    - 再現可能でロールバック可能なインストールを求める場合
    - すでに Nix/NixOS/Home Manager を使用している
    - すべてを固定し、宣言的に管理したい
summary: Nix で OpenClaw を宣言的にインストールする
title: Nix
x-i18n:
    generated_at: "2026-05-06T05:10:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: f0c25b97fb46a906bb726a13de095ead1e6c3642d28f66173b488acfbc5e0001
    source_path: install/nix.md
    workflow: 16
---

OpenClawを宣言的にインストールするには、**[nix-openclaw](https://github.com/openclaw/nix-openclaw)**を使います。バッテリー同梱の Home Manager モジュールです。

<Info>
[Nixのインストール](https://github.com/openclaw/nix-openclaw)については、[nix-openclaw](https://github.com/openclaw/nix-openclaw)リポジトリが信頼できる情報源です。このページは簡単な概要です。
</Info>

## 得られるもの

- Gateway + macOS アプリ + ツール（whisper、spotify、カメラ）-- すべて固定
- 再起動後も動作し続ける launchd サービス
- 宣言的な設定に対応した Plugin システム
- 即時ロールバック: `home-manager switch --rollback`

## クイックスタート

<Steps>
  <Step title="Determinate Nixをインストールする">
    Nix がまだインストールされていない場合は、[Determinate Nix installer](https://github.com/DeterminateSystems/nix-installer)の手順に従います。
  </Step>
  <Step title="ローカル flake を作成する">
    nix-openclaw リポジトリの agent-first テンプレートを使用します。
    ```bash
    mkdir -p ~/code/openclaw-local
    # nix-openclaw リポジトリから templates/agent-first/flake.nix をコピーする
    ```
  </Step>
  <Step title="シークレットを設定する">
    メッセージング bot トークンとモデルプロバイダーの API キーを設定します。`~/.secrets/` に置いたプレーンファイルで問題ありません。
  </Step>
  <Step title="テンプレートのプレースホルダーを埋めて切り替える">
    ```bash
    home-manager switch
    ```
  </Step>
  <Step title="検証する">
    launchd サービスが実行中で、bot がメッセージに応答することを確認します。
  </Step>
</Steps>

完全なモジュールオプションと例については、[nix-openclaw README](https://github.com/openclaw/nix-openclaw)を参照してください。

## Nixモードのランタイム動作

`OPENCLAW_NIX_MODE=1` が設定されている場合（nix-openclaw では自動）、OpenClaw は自動インストールフローを無効化する決定的モードに入ります。

手動で設定することもできます。

```bash
export OPENCLAW_NIX_MODE=1
```

macOS では、GUI アプリは shell 環境変数を自動的には継承しません。代わりに defaults で Nix モードを有効にします。

```bash
defaults write ai.openclaw.mac openclaw.nixMode -bool true
```

### Nixモードで変わること

- 自動インストールと自己変更フローが無効化されます
- 欠落している依存関係には、Nix 固有の修復メッセージが表示されます
- UI に読み取り専用の Nix モードバナーが表示されます

### 設定と状態のパス

OpenClaw は `OPENCLAW_CONFIG_PATH` から JSON5 設定を読み取り、変更可能なデータを `OPENCLAW_STATE_DIR` に保存します。Nix 配下で実行する場合は、ランタイム状態と設定が不変ストアの外に置かれるように、これらを Nix 管理の場所へ明示的に設定します。

| 変数                   | デフォルト                              |
| ---------------------- | --------------------------------------- |
| `OPENCLAW_HOME`        | `HOME` / `USERPROFILE` / `os.homedir()` |
| `OPENCLAW_STATE_DIR`   | `~/.openclaw`                           |
| `OPENCLAW_CONFIG_PATH` | `$OPENCLAW_STATE_DIR/openclaw.json`     |

### サービス PATH の検出

launchd/systemd Gateway サービスは Nix プロファイルのバイナリを自動検出するため、
`nix` でインストールされた実行ファイルを shell から呼び出す Plugin やツールは、
手動で PATH を設定しなくても動作します。

- `NIX_PROFILES` が設定されている場合、各エントリが右から左の優先順位でサービス PATH に追加されます
  （Nix shell の優先順位と一致し、右端が優先されます）。
- `NIX_PROFILES` が未設定の場合、フォールバックとして `~/.nix-profile/bin` が追加されます。

これは macOS launchd と Linux systemd の両方のサービス環境に適用されます。

## 関連

<CardGroup cols={2}>
  <Card title="nix-openclaw" href="https://github.com/openclaw/nix-openclaw" icon="arrow-up-right-from-square">
    信頼できる情報源である Home Manager モジュールと完全なセットアップガイド。
  </Card>
  <Card title="セットアップウィザード" href="/ja-JP/start/wizard" icon="wand-magic-sparkles">
    Nix ではない CLI セットアップの手順。
  </Card>
  <Card title="Docker" href="/ja-JP/install/docker" icon="docker">
    Nix 以外の代替手段としてのコンテナ化セットアップ。
  </Card>
  <Card title="更新" href="/ja-JP/install/updating" icon="arrow-up-right-from-square">
    Home Manager 管理のインストールをパッケージと合わせて更新する方法。
  </Card>
</CardGroup>
