---
read_when:
    - ClawHubへのサインイン
    - ClawHub CLI の使用方法
    - 401 エラーのデバッグ
summary: ClawHubへのサインイン、APIトークン、CLIログイン、トークンの保存、取り消し。
x-i18n:
    generated_at: "2026-07-12T14:22:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 4f39be61235d71ff7a563c11a16cfd3b90562b664314c9cffd184dddd2199dbc
    source_path: clawhub/auth.md
    workflow: 16
---

# 認証

ClawHub は、Web サインインに GitHub を使用します。CLI は、そのサインイン済みアカウントを通じて作成された ClawHub API トークンを使用します。

## Web サインイン

GitHub を使用して [clawhub.ai](https://clawhub.ai) にサインインします。

削除、BAN、または無効化されたアカウントでは、通常の ClawHub サインインを完了できません。サインイン後にログアウト状態へ戻る場合、アカウントが良好な状態ではない可能性があります。アカウントが BAN または無効化されており、それが誤りだと思われる場合は、[ClawHub 異議申し立てフォーム](https://appeals.openclaw.ai/)を使用してください。

## CLI ログイン

デフォルトの CLI ログインフローでは、ブラウザーが開きます。

```bash
clawhub login
clawhub whoami
```

処理の流れ：

1. CLI が `127.0.0.1` で一時的なコールバックサーバーを起動します。
2. ブラウザーで ClawHub のサインインページが開きます。
3. GitHub へのサインイン後、ClawHub が API トークンを作成します。
4. ブラウザーがローカルコールバックへリダイレクトされます。
5. CLI がトークンを ClawHub 設定ファイルに保存します。

ファイアウォール、VPN、またはプロキシのルールが原因でブラウザーからローカルコールバックに到達できない場合は、ヘッドレストークンフローを使用してください。

## ヘッドレスログイン

ClawHub の Web UI でトークンを作成し、CLI に渡します。

```bash
clawhub login --token clh_...
```

サーバー、CI ジョブ、またはターミナルのみの環境では、このフローを使用します。

別の場所でブラウザーを開けるリモートシェルでは、次を実行します。

```bash
clawhub login --device
```

CLI にワンタイムコードが表示され、`https://clawhub.ai/cli/device` で認証を行うまで待機します。

## トークンの保存

デフォルトの設定ファイルパス：

- macOS：`~/Library/Application Support/clawhub/config.json`
- Linux/XDG：`$XDG_CONFIG_HOME/clawhub/config.json` または `~/.config/clawhub/config.json`
- Windows：`%APPDATA%\\clawhub\\config.json`

次のようにパスを上書きできます。

```bash
export CLAWHUB_CONFIG_PATH=/path/to/config.json
```

CI のセットアップ用に、保存されているトークンを表示するには、次を実行します。

```bash
clawhub token
```

## 失効

ClawHub の Web UI で API トークンを失効させることができます。

失効済み、無効、または欠落しているトークンを使用すると、`401 Unauthorized` が返されます。`clawhub login` で再度サインインするか、`clawhub login --token` で新しいトークンを指定してください。

削除、BAN、または無効化されたアカウントでは、既存の API トークンを引き続き使用できません。アカウントが BAN または無効化されており、それが誤りだと思われる場合は、[ClawHub 異議申し立てフォーム](https://appeals.openclaw.ai/)を使用してください。
