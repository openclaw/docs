---
read_when:
    - 最初のエージェント実行で何が起こるかを理解する
    - ブートストラップファイルがどこにあるかの説明
    - オンボーディング ID セットアップをデバッグしています
sidebarTitle: Bootstrapping
summary: workspace と ID ファイルを初期化するエージェントのブートストラップ儀式
title: エージェントのブートストラップ
x-i18n:
    generated_at: "2026-04-24T05:21:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0c23a204a7afbf2ca0c0d19a227286cf0ae396181073403055db41dafa764d2a
    source_path: start/bootstrapping.md
    workflow: 15
---

ブートストラップは、エージェント workspace を準備し、
ID 詳細を収集する **初回実行** の儀式です。オンボーディング後、
エージェントが初めて起動したときに行われます。

## ブートストラップが行うこと

最初のエージェント実行時に、OpenClaw は workspace（デフォルト
`~/.openclaw/workspace`）をブートストラップします。

- `AGENTS.md`, `BOOTSTRAP.md`, `IDENTITY.md`, `USER.md` を初期配置する
- 短い Q&A 儀式を実行する（1 回に 1 問）
- ID と設定を `IDENTITY.md`, `USER.md`, `SOUL.md` に書き込む
- 完了後に `BOOTSTRAP.md` を削除し、1 回だけ実行されるようにする

## 実行場所

ブートストラップは常に **Gateway ホスト** 上で実行されます。macOS アプリが
リモート Gateway に接続している場合、workspace とブートストラップファイルはそのリモート
マシン上にあります。

<Note>
Gateway が別マシン上で動作している場合は、その Gateway
ホスト上で workspace ファイルを編集してください（例: `user@gateway-host:~/.openclaw/workspace`）。
</Note>

## 関連ドキュメント

- macOS アプリのオンボーディング: [オンボーディング](/ja-JP/start/onboarding)
- workspace レイアウト: [エージェントワークスペース](/ja-JP/concepts/agent-workspace)
