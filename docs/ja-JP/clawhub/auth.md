---
read_when:
    - ClawHubへのサインイン
    - ClawHub CLI の使用
    - 401 のデバッグ
summary: ClawHub サインイン、API トークン、CLI ログイン、トークン保存、取り消し。
x-i18n:
    generated_at: "2026-07-05T01:53:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4f39be61235d71ff7a563c11a16cfd3b90562b664314c9cffd184dddd2199dbc
    source_path: clawhub/auth.md
    workflow: 16
---

# 認証

ClawHub は Web サインインに GitHub を使用します。CLI は、そのサインイン済みアカウントを通じて作成された ClawHub API トークンを使用します。

## Web サインイン

[clawhub.ai](https://clawhub.ai) で GitHub を使ってサインインします。

削除、禁止、または無効化されたアカウントでは、通常の ClawHub サインインを完了できません。サインイン後にログアウト状態へ戻される場合、アカウントが良好な状態ではない可能性があります。アカウントが禁止または無効化されていて、それが誤りだと思う場合は、[ClawHub 異議申し立てフォーム](https://appeals.openclaw.ai/) を使用してください。

## CLI ログイン

デフォルトの CLI ログインフローではブラウザが開きます。

```bash
clawhub login
clawhub whoami
```

処理内容:

1. CLI が `127.0.0.1` で一時的なコールバックサーバーを起動します。
2. ブラウザで ClawHub サインインページが開きます。
3. GitHub サインイン後、ClawHub が API トークンを作成します。
4. ブラウザがローカルコールバックへリダイレクトします。
5. CLI がトークンを ClawHub 設定ファイルに保存します。

ファイアウォール、VPN、またはプロキシのルールによりブラウザがローカルコールバックへ到達できない場合は、ヘッドレストークンフローを使用してください。

## ヘッドレスログイン

ClawHub Web UI でトークンを作成し、それを CLI に渡します。

```bash
clawhub login --token clh_...
```

このフローは、サーバー、CI ジョブ、またはターミナルのみの環境で使用します。

別の場所でブラウザを開けるリモートシェルでは、次を実行します。

```bash
clawhub login --device
```

CLI はワンタイムコードを表示し、`https://clawhub.ai/cli/device` で承認されるまで待機します。

## トークンストレージ

デフォルトの設定パス:

- macOS: `~/Library/Application Support/clawhub/config.json`
- Linux/XDG: `$XDG_CONFIG_HOME/clawhub/config.json` または `~/.config/clawhub/config.json`
- Windows: `%APPDATA%\\clawhub\\config.json`

次でパスを上書きします。

```bash
export CLAWHUB_CONFIG_PATH=/path/to/config.json
```

CI セットアップ用に保存済みトークンを表示するには、次を使用します。

```bash
clawhub token
```

## 取り消し

ClawHub Web UI で API トークンを取り消すことができます。

取り消し済み、無効、または欠落しているトークンは `401 Unauthorized` を返します。`clawhub login` でもう一度サインインするか、`clawhub login --token` で新しいトークンを指定してください。

削除、禁止、または無効化されたアカウントでは、既存の API トークンを引き続き使用できません。アカウントが禁止または無効化されていて、それが誤りだと思う場合は、[ClawHub 異議申し立てフォーム](https://appeals.openclaw.ai/) を使用してください。
