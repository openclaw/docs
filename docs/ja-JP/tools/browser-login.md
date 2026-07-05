---
read_when:
    - ブラウザー自動化のためにサイトにログインする必要があります
    - X/Twitter に更新を投稿したい
summary: ブラウザ自動化 + X/Twitter 投稿の手動ログイン
title: ブラウザログイン
x-i18n:
    generated_at: "2026-07-05T11:53:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bccd363cf7c9611f4687d50a92f7fb3e2fd1c1d67bb27a80c892f7ac58ae1f8f
    source_path: tools/browser-login.md
    workflow: 16
---

## 手動ログイン（推奨）

サイトでログインが必要な場合は、ホストブラウザーの `openclaw`
プロファイルで手動でサインインします。モデルに認証情報を渡さないでください。自動ログインは多くの場合
ボット対策を発動させ、アカウントがロックされる可能性があります。

X/Twitter やその他のボット検出に敏感なサイトでの閲覧（検索/スレッド）と
投稿の両方には、ホストブラウザー（手動ログイン）を使用します。サンドボックス化されたブラウザーセッションは
ボット検出を発動させる可能性が高くなります。

メインのブラウザードキュメントに戻る: [ブラウザー](/ja-JP/tools/browser)。

## どの Chrome プロファイルが使われますか？

OpenClaw は、日常用のブラウザープロファイルとは別に、`openclaw` という名前の専用 Chrome プロファイル（オレンジ色がかった
UI）を制御します。

エージェントのブラウザーツール呼び出しでは:

- デフォルトの選択: エージェントは分離された `openclaw` ブラウザーを使用します。
- 既存のログイン済みセッションが重要で、アタッチ確認プロンプトをクリック/承認するために
  コンピューターの前にいる場合にのみ、`profile="user"` を使用します。
- 複数のユーザーブラウザープロファイルがある場合は、推測せずにプロファイルを明示的に
  指定します。

`openclaw` プロファイルにアクセスする方法は 2 つあります:

1. エージェントにブラウザーを開くよう依頼し、その後自分でログインします。
2. CLI 経由で開きます:

```bash
openclaw browser start
openclaw browser open https://x.com
```

デフォルト以外のプロファイルでは、サブコマンドの前に
`--browser-profile <name>` を置きます（デフォルトは `openclaw`）:

```bash
openclaw browser --browser-profile <name> open https://x.com
```

## サンドボックス化: ホストブラウザーへのアクセスを許可する

エージェントがサンドボックス化されている場合、その `browser` ツール呼び出しはデフォルトでホストではなく
サンドボックスブラウザーを使用します。代わりにエージェントがホストブラウザーを対象にできるようにするには:

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

CLI 呼び出しは常にホストブラウザーを対象にし、サンドボックスは対象にしないため、この設定に関係なく
自分でホストブラウザーを開くことができます:

```bash
openclaw browser --browser-profile openclaw open https://x.com
```

`sandbox.browser.allowHostControl: true` を設定すると、エージェントの `browser`
ツール呼び出しもホストを対象にできます。あるいは、更新を投稿するエージェントの
サンドボックス化を無効にします。

## 関連

- [ブラウザー](/ja-JP/tools/browser)
- [ブラウザー Linux トラブルシューティング](/ja-JP/tools/browser-linux-troubleshooting)
- [ブラウザー WSL2 トラブルシューティング](/ja-JP/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
