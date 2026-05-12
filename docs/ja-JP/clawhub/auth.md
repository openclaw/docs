---
read_when:
    - ClawHub にサインインする
    - ClawHub CLI の使用
    - 401エラーのデバッグ
summary: ClawHub のサインイン、API トークン、CLI ログイン、トークンの保存、失効。
x-i18n:
    generated_at: "2026-05-12T15:42:30Z"
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

削除、利用停止、または無効化されたアカウントは、通常の ClawHub サインインを完了できません。
サインイン後にログアウト状態へ戻される場合、アカウントが良好な状態ではない可能性があります。

## CLI ログイン

デフォルトの CLI ログインフローではブラウザーが開きます。

```bash
clawhub login
clawhub whoami
```

何が起きるか:

1. CLI は `127.0.0.1` で一時的なコールバックサーバーを起動します。
2. ブラウザーで ClawHub サインインページが開きます。
3. GitHub サインイン後、ClawHub が API トークンを作成します。
4. ブラウザーはローカルコールバックへリダイレクトします。
5. CLI はトークンを ClawHub 設定ファイルに保存します。

ファイアウォール、VPN、またはプロキシルールが原因でブラウザーがローカルコールバックに到達できない場合は、ヘッドレスのトークンフローを使用します。

## ヘッドレスログイン

ClawHub Web UI でトークンを作成し、それを CLI に渡します。

```bash
clawhub login --token clh_...
```

サーバー、CI ジョブ、またはターミナル専用環境では、このフローを使用します。

別の場所でブラウザーを開けるリモートシェルでは、次を実行します。

```bash
clawhub login --device
```

CLI は一回限りのコードを表示し、`https://clawhub.ai/cli/device` で認可されるまで待機します。

## トークンの保存

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

失効済み、無効、または欠落しているトークンは `401 Unauthorized` を返します。`clawhub login` で再度サインインするか、`clawhub login --token` で新しいトークンを指定します。

削除、利用停止、または無効化されたアカウントは、既存の API トークンを使い続けることができません。
