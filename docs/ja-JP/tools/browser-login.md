---
read_when:
    - ブラウザー自動化のためにサイトへログインする必要がある場合
    - X/Twitterへ更新を投稿したい場合
summary: ブラウザー自動化 + X/Twitter投稿の手動ログイン
title: ブラウザーログイン
x-i18n:
  refreshed_at: '2026-04-28T05:23:26Z'
  generated_at: "2026-04-24T05:24:17Z"
  model: gpt-5.4
  provider: openai
  source_hash: 3e70ae373fed861ffde0e03dfe6252b0589f7cc1946585e9b055cbed70de14b1
  source_path: tools/browser-login.md
  workflow: 15
---

# ブラウザーログイン + X/Twitter投稿

## 手動ログイン（推奨）

サイトでログインが必要な場合は、**ホスト**のブラウザープロファイル（openclaw browser）で**手動でサインイン**してください。

認証情報をモデルに渡さないでください。自動ログインはしばしばアンチボット防御を発動させ、アカウントをロックすることがあります。

メインのブラウザードキュメントに戻る: [Browser](/ja-JP/tools/browser)。

## どのChromeプロファイルが使われますか？

OpenClawは、**専用のChromeプロファイル**（`openclaw`という名前、オレンジ系UI）を制御します。これは日常的に使うブラウザープロファイルとは別です。

エージェントのbrowser tool呼び出しでは:

- デフォルト選択: エージェントは隔離された`openclaw` browserを使うべきです。
- 既存のログイン済みセッションが重要で、かつユーザーがPCの前にいてattachプロンプトをクリック/承認できる場合にのみ、`profile="user"`を使ってください。
- 複数のuser-browserプロファイルがある場合は、推測せず明示的に指定してください。

アクセスする簡単な方法は2つあります。

1. **エージェントにブラウザーを開かせる**。その後、自分でログインします。
2. **CLI経由で開く**:

```bash
openclaw browser start
openclaw browser open https://x.com
```

複数プロファイルがある場合は、`--browser-profile <name>`を渡してください（デフォルトは`openclaw`）。

## X/Twitter: 推奨フロー

- **閲覧/検索/スレッド:** **ホスト**ブラウザーを使う（手動ログイン）。
- **更新投稿:** **ホスト**ブラウザーを使う（手動ログイン）。

## サンドボックス + ホストブラウザーアクセス

サンドボックス化されたブラウザーセッションは、bot検出を発動しやすくなります。X/Twitter（および他の厳格なサイト）では、**ホスト**ブラウザーを優先してください。

エージェントがサンドボックス化されている場合、browser toolはデフォルトでサンドボックスを使います。ホスト制御を許可するには:

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

その後、ホストブラウザーを対象にします。

```bash
openclaw browser open https://x.com --browser-profile openclaw --target host
```

または、更新を投稿するエージェントではサンドボックスを無効にしてください。

## 関連

- [Browser](/ja-JP/tools/browser)
- [Browser Linux troubleshooting](/ja-JP/tools/browser-linux-troubleshooting)
- [Browser WSL2 troubleshooting](/ja-JP/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
