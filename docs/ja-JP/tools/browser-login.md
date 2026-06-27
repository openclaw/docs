---
read_when:
    - ブラウザー自動化のためにサイトにログインする必要があります
    - X/Twitter に更新を投稿したい
summary: ブラウザー自動化 + X/Twitter投稿のための手動ログイン
title: ブラウザログイン
x-i18n:
    generated_at: "2026-05-11T20:37:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 89501b47611a39df5a658ed7e144b7c16a07188dfa52544b56cbfc6e296e2ecc
    source_path: tools/browser-login.md
    workflow: 16
    postprocess_version: locale-links-v1
---

## 手動ログイン（推奨）

サイトでログインが必要な場合は、**ホスト**ブラウザープロファイル（openclaw ブラウザー）で**手動でサインイン**してください。

モデルに認証情報を渡さないでください。自動ログインはボット対策を誘発しやすく、アカウントがロックされることがあります。

メインのブラウザードキュメントに戻る: [Browser](/ja-JP/tools/browser)。

## どの Chrome プロファイルが使われますか？

OpenClaw は**専用の Chrome プロファイル**（名前は `openclaw`、オレンジ色がかった UI）を制御します。これは普段使いのブラウザープロファイルとは別です。

エージェントのブラウザーツール呼び出しでは:

- デフォルトの選択: エージェントは分離された `openclaw` ブラウザーを使うべきです。
- 既存のログイン済みセッションが重要で、ユーザーがコンピューターの前にいて接続プロンプトをクリック/承認できる場合にのみ、`profile="user"` を使ってください。
- ユーザーブラウザーのプロファイルが複数ある場合は、推測せずにプロファイルを明示的に指定してください。

アクセスする簡単な方法は 2 つあります:

1. **エージェントにブラウザーを開くよう依頼**し、その後自分でログインします。
2. **CLI 経由で開きます**:

```bash
openclaw browser start
openclaw browser open https://x.com
```

プロファイルが複数ある場合は、`--browser-profile <name>` を渡します（デフォルトは `openclaw` です）。

## X/Twitter: 推奨フロー

- **読み取り/検索/スレッド:** **ホスト**ブラウザーを使います（手動ログイン）。
- **更新の投稿:** **ホスト**ブラウザーを使います（手動ログイン）。

## サンドボックス化 + ホストブラウザーアクセス

サンドボックス化されたブラウザーセッションは、ボット検出を誘発する可能性が**高くなります**。X/Twitter（およびその他の厳格なサイト）では、**ホスト**ブラウザーを優先してください。

エージェントがサンドボックス化されている場合、ブラウザーツールのデフォルトはサンドボックスになります。ホスト制御を許可するには:

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

その後、自分でホストブラウザーを開きます（CLI 呼び出しは常にホストブラウザーに対して実行されます）:

```bash
openclaw browser open https://x.com --browser-profile openclaw
```

`sandbox.browser.allowHostControl: true` が設定されると、エージェントの `browser` ツール呼び出しはホストを対象にできます。あるいは、更新を投稿するエージェントのサンドボックス化を無効にしてください。

## 関連

- [Browser](/ja-JP/tools/browser)
- [Browser Linux トラブルシューティング](/ja-JP/tools/browser-linux-troubleshooting)
- [Browser WSL2 トラブルシューティング](/ja-JP/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
