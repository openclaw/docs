---
read_when:
    - ClawHubへのサインイン
    - ClawHub CLI の使用
    - 401 エラーのデバッグ
summary: ClawHub のサインイン、API トークン、CLI ログイン、トークンの保存と失効。
x-i18n:
    generated_at: "2026-05-12T23:28:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 261f5a93200db8415e3bc8f35251c3486110ce8e076c482e846ad11f2ccd517f
    source_path: clawhub/auth.md
    workflow: 16
---

# 認証

ClawHub は Web サインインに GitHub を使用します。CLI は、そのサインイン済みアカウントを通じて作成された ClawHub API トークンを使用します。

## Web サインイン

[clawhub.ai](https://clawhub.ai) で GitHub を使用してサインインします。

削除、BAN、または無効化されたアカウントでは、通常の ClawHub サインインを完了できません。サインイン後にログアウト状態へ戻される場合、アカウントが良好な状態でない可能性があります。

## CLI ログイン

デフォルトの CLI ログインフローではブラウザーが開きます。

```bash
clawhub login
clawhub whoami
```

発生すること:

1. CLI が `127.0.0.1` で一時的なコールバックサーバーを起動します。
2. ブラウザーで ClawHub サインインページが開きます。
3. GitHub サインイン後、ClawHub が API トークンを作成します。
4. ブラウザーがローカルコールバックへリダイレクトします。
5. CLI がトークンを ClawHub 設定ファイルに保存します。

ファイアウォール、VPN、またはプロキシルールのためにブラウザーがローカルコールバックへ到達できない場合は、ヘッドレストークンフローを使用してください。

## ヘッドレスログイン

ClawHub Web UI でトークンを作成し、それを CLI に渡します。

```bash
clawhub login --token clh_...
```

このフローは、サーバー、CI ジョブ、またはターミナルのみの環境で使用します。

別の場所でブラウザーを開けるリモートシェルでは、次を実行します。

```bash
clawhub login --device
```

CLI は一度限りのコードを表示し、`https://clawhub.ai/cli/device` で認可されるまで待機します。

## トークンストレージ

デフォルトの設定パス:

- macOS: `~/Library/Application Support/clawhub/config.json`
- Linux/XDG: `$XDG_CONFIG_HOME/clawhub/config.json` または `~/.config/clawhub/config.json`
- Windows: `%APPDATA%\\clawhub\\config.json`

次でパスを上書きします。

```bash
export CLAWHUB_CONFIG_PATH=/path/to/config.json
```

## 取り消し

ClawHub Web UI で API トークンを取り消せます。

取り消された、無効な、または存在しないトークンは `401 Unauthorized` を返します。`clawhub login` で再度サインインするか、`clawhub login --token` で新しいトークンを指定してください。

削除、BAN、または無効化されたアカウントでは、既存の API トークンを使い続けることはできません。
