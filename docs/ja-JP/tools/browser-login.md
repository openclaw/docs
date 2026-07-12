---
read_when:
    - ブラウザ自動化のためにサイトへログインする必要があります
    - X/Twitter に更新情報を投稿したい場合
summary: ブラウザ自動化とX/Twitterへの投稿のための手動ログイン
title: ブラウザログイン
x-i18n:
    generated_at: "2026-07-11T22:43:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bccd363cf7c9611f4687d50a92f7fb3e2fd1c1d67bb27a80c892f7ac58ae1f8f
    source_path: tools/browser-login.md
    workflow: 16
---

## 手動ログイン（推奨）

サイトでログインが必要な場合は、ホストブラウザの `openclaw` プロファイルで手動でサインインしてください。モデルに認証情報を渡さないでください。自動ログインはボット対策を作動させることが多く、アカウントがロックされる可能性があります。

X/Twitter やその他のボット検出が厳しいサイトでは、閲覧（検索やスレッド）と投稿の両方にホストブラウザ（手動ログイン）を使用してください。サンドボックス化されたブラウザセッションは、ボット検出を作動させる可能性が高くなります。

ブラウザのメインドキュメントに戻る：[ブラウザ](/ja-JP/tools/browser)。

## どの Chrome プロファイルが使用されますか？

OpenClaw は、普段使用するブラウザプロファイルとは別の、`openclaw` という名前の専用 Chrome プロファイル（オレンジ色の UI）を制御します。

エージェントによるブラウザツール呼び出しの場合：

- デフォルト：エージェントは分離された `openclaw` ブラウザを使用します。
- 既存のログイン済みセッションが必要で、接続確認プロンプトをクリックまたは承認するためにコンピューターの前にいる場合にのみ、`profile="user"` を使用してください。
- ユーザーブラウザのプロファイルが複数ある場合は、推測せずにプロファイルを明示的に指定してください。

`openclaw` プロファイルにアクセスする方法は 2 つあります。

1. エージェントにブラウザを開くよう依頼し、自分でログインします。
2. CLI から開きます。

```bash
openclaw browser start
openclaw browser open https://x.com
```

デフォルト以外のプロファイルを使用する場合は、サブコマンドの前に `--browser-profile <name>` を指定します（デフォルトは `openclaw`）。

```bash
openclaw browser --browser-profile <name> open https://x.com
```

## サンドボックス化：ホストブラウザへのアクセスを許可する

エージェントがサンドボックス化されている場合、その `browser` ツール呼び出しは、デフォルトでホストではなくサンドボックス内のブラウザを使用します。エージェントが代わりにホストブラウザを操作できるようにするには、次のように設定します。

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main",
        browser: {
          allowHostControl: true,
        },
      },
    },
  },
}
```

CLI 呼び出しは常にホストブラウザを対象とし、サンドボックスを対象とすることはありません。そのため、この設定にかかわらず、自分でホストブラウザを開けます。

```bash
openclaw browser --browser-profile openclaw open https://x.com
```

`sandbox.browser.allowHostControl: true` を設定すると、エージェントの `browser` ツール呼び出しでもホストを対象にできます。別の方法として、更新を投稿するエージェントのサンドボックス化を無効にします。

## 関連項目

- [ブラウザ](/ja-JP/tools/browser)
- [ブラウザの Linux トラブルシューティング](/ja-JP/tools/browser-linux-troubleshooting)
- [ブラウザの WSL2 トラブルシューティング](/ja-JP/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
