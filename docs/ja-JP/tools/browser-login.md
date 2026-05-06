---
read_when:
    - ブラウザー自動化のためにサイトへログインする必要があります
    - X/Twitter に更新情報を投稿したい
summary: ブラウザー自動化 + X/Twitter投稿のための手動ログイン
title: ブラウザでログイン
x-i18n:
    generated_at: "2026-05-06T05:19:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 235194fd3a49724247f98e6d7c848c4cc3317f749ff4a8918c2172b73baf21e3
    source_path: tools/browser-login.md
    workflow: 16
---

## 手動ログイン（推奨）

サイトでログインが必要な場合は、**ホスト**ブラウザプロファイル（openclaw ブラウザ）で**手動でサインイン**します。

モデルに認証情報を渡さないでください。自動ログインは多くの場合、ボット対策を発動させ、アカウントがロックされる可能性があります。

メインのブラウザドキュメントに戻る: [ブラウザ](/ja-JP/tools/browser)。

## どの Chrome プロファイルが使用されますか?

OpenClaw は**専用の Chrome プロファイル**（名前は `openclaw`、オレンジ色がかった UI）を制御します。これは日常的に使うブラウザプロファイルとは別です。

エージェントのブラウザツール呼び出しの場合:

- 既定の選択: エージェントは分離された `openclaw` ブラウザを使用する必要があります。
- 既存のログイン済みセッションが重要で、ユーザーがコンピューターの前にいて、接続プロンプトをクリックまたは承認できる場合にのみ `profile="user"` を使用します。
- ユーザーブラウザプロファイルが複数ある場合は、推測せずにプロファイルを明示的に指定します。

アクセスする簡単な方法は 2 つあります:

1. **エージェントにブラウザを開くよう依頼**し、その後自分でログインします。
2. **CLI 経由で開きます**:

```bash
openclaw browser start
openclaw browser open https://x.com
```

複数のプロファイルがある場合は、`--browser-profile <name>` を渡します（既定は `openclaw`）。

## X/Twitter: 推奨フロー

- **読み取り/検索/スレッド:** **ホスト**ブラウザを使用します（手動ログイン）。
- **更新の投稿:** **ホスト**ブラウザを使用します（手動ログイン）。

## サンドボックス化 + ホストブラウザアクセス

サンドボックス化されたブラウザセッションは、ボット検出を発動する**可能性が高くなります**。X/Twitter（およびその他の厳格なサイト）では、**ホスト**ブラウザを優先してください。

エージェントがサンドボックス化されている場合、ブラウザツールは既定でサンドボックスを使用します。ホスト制御を許可するには:

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

次に、ホストブラウザを対象にします:

```bash
openclaw browser open https://x.com --browser-profile openclaw --target host
```

または、更新を投稿するエージェントのサンドボックス化を無効にします。

## 関連

- [ブラウザ](/ja-JP/tools/browser)
- [ブラウザ Linux トラブルシューティング](/ja-JP/tools/browser-linux-troubleshooting)
- [ブラウザ WSL2 トラブルシューティング](/ja-JP/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
