---
read_when:
    - ClawHubへのサインイン
    - ClawHub CLI の使用
    - 401エラーのデバッグ
summary: ClawHub のサインイン、API トークン、CLI ログイン、トークンの保存、失効。
x-i18n:
    generated_at: "2026-05-13T04:17:56Z"
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

削除、禁止、または無効化されたアカウントでは、通常の ClawHub サインインを完了できません。
サインイン後にログアウト状態へ戻る場合、アカウントの状態が良好ではない可能性があります。

## CLI ログイン

デフォルトの CLI ログインフローではブラウザーが開きます。

```bash
clawhub login
clawhub whoami
```

処理の流れ:

1. CLI は `127.0.0.1` で一時的なコールバックサーバーを開始します。
2. ブラウザーで ClawHub サインインページが開きます。
3. GitHub サインイン後、ClawHub が API トークンを作成します。
4. ブラウザーはローカルコールバックへリダイレクトします。
5. CLI は ClawHub 設定ファイルにトークンを保存します。

ファイアウォール、VPN、またはプロキシルールが原因でブラウザーがローカルコールバックに到達できない場合は、ヘッドレストークンフローを使用します。

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

CLI はワンタイムコードを出力し、`https://clawhub.ai/cli/device` で認可されるまで待機します。

## トークンストレージ

デフォルトの設定パス:

- macOS: `~/Library/Application Support/clawhub/config.json`
- Linux/XDG: `$XDG_CONFIG_HOME/clawhub/config.json` または `~/.config/clawhub/config.json`
- Windows: `%APPDATA%\\clawhub\\config.json`

次でパスを上書きします。

```bash
export CLAWHUB_CONFIG_PATH=/path/to/config.json
```

## 失効

ClawHub Web UI で API トークンを失効できます。

失効済み、無効、または存在しないトークンは `401 Unauthorized` を返します。`clawhub login` で再度サインインするか、`clawhub login --token` で新しいトークンを指定します。

削除、禁止、または無効化されたアカウントでは、既存の API トークンを使い続けることはできません。
