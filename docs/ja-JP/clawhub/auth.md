---
read_when:
    - ClawHub へのサインイン
    - ClawHub CLI の使用
    - 401 のデバッグ
summary: ClawHub サインイン、API トークン、CLI ログイン、トークン保存、取り消し。
x-i18n:
    generated_at: "2026-07-05T04:48:30Z"
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

[clawhub.ai](https://clawhub.ai) で GitHub を使用してサインインします。

削除、BAN、または無効化されたアカウントでは、通常の ClawHub サインインを完了できません。サインイン後にログアウト状態へ戻される場合、アカウントの状態に問題がある可能性があります。アカウントが BAN または無効化された場合、誤りだと思うときは [ClawHub 異議申し立てフォーム](https://appeals.openclaw.ai/) を使用してください。

## CLI ログイン

デフォルトの CLI ログインフローではブラウザが開きます。

```bash
clawhub login
clawhub whoami
```

発生する処理:

1. CLI が `127.0.0.1` で一時的なコールバックサーバーを起動します。
2. ブラウザで ClawHub サインインページが開きます。
3. GitHub サインイン後、ClawHub が API トークンを作成します。
4. ブラウザがローカルコールバックへリダイレクトします。
5. CLI がトークンを ClawHub 設定ファイルに保存します。

ファイアウォール、VPN、またはプロキシのルールによりブラウザがローカルコールバックに到達できない場合は、ヘッドレスのトークンフローを使用してください。

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

CLI はワンタイムコードを表示し、`https://clawhub.ai/cli/device` で認可されるまで待機します。

## トークン保存

デフォルトの設定パス:

- macOS: `~/Library/Application Support/clawhub/config.json`
- Linux/XDG: `$XDG_CONFIG_HOME/clawhub/config.json` または `~/.config/clawhub/config.json`
- Windows: `%APPDATA%\\clawhub\\config.json`

次でパスを上書きします。

```bash
export CLAWHUB_CONFIG_PATH=/path/to/config.json
```

CI セットアップ用に保存済みトークンを表示するには、次を実行します。

```bash
clawhub token
```

## 失効

ClawHub Web UI で API トークンを失効できます。

失効済み、無効、または存在しないトークンは `401 Unauthorized` を返します。`clawhub login` で再度サインインするか、`clawhub login --token` で新しいトークンを指定してください。

削除、BAN、または無効化されたアカウントでは、既存の API トークンを使い続けることはできません。アカウントが BAN または無効化された場合、誤りだと思うときは [ClawHub 異議申し立てフォーム](https://appeals.openclaw.ai/) を使用してください。
