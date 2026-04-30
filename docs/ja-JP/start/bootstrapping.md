---
read_when:
    - 初回エージェント実行で何が起こるかを理解する
    - ブートストラップファイルの配置場所を説明する
    - オンボーディングのアイデンティティ設定のデバッグ
sidebarTitle: Bootstrapping
summary: ワークスペースとアイデンティティファイルをシードするエージェントのブートストラップ手順
title: エージェントのブートストラップ
x-i18n:
    generated_at: "2026-04-30T05:35:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: de829f82016ae1e4dcd7714502ca8d11755556fed18b985a7e2bada4149a2d46
    source_path: start/bootstrapping.md
    workflow: 16
---

ブートストラップは、エージェントワークスペースを準備し、アイデンティティの詳細情報を収集する**初回実行**手順です。オンボーディング後、エージェントが初めて起動するときに実行されます。

## ブートストラップが行うこと

初回のエージェント実行時に、OpenClaw はワークスペース（デフォルトは
`~/.openclaw/workspace`）をブートストラップします。

- `AGENTS.md`、`BOOTSTRAP.md`、`IDENTITY.md`、`USER.md` をシードします。
- 短い Q&A 手順を実行します（一度に1つの質問）。
- アイデンティティと設定を `IDENTITY.md`、`USER.md`、`SOUL.md` に書き込みます。
- 完了後に `BOOTSTRAP.md` を削除し、一度だけ実行されるようにします。

埋め込み/ローカルモデル実行では、OpenClaw は `BOOTSTRAP.md` を特権システムコンテキストに含めません。主要な対話型の初回実行では、`read` ツールを確実に呼び出さないモデルでも手順を完了できるように、ユーザープロンプトにファイル内容を渡します。現在の実行がワークスペースに安全にアクセスできない場合、エージェントには汎用の挨拶ではなく、限定されたブートストラップメモが渡されます。

## ブートストラップをスキップする

事前にシード済みのワークスペースでこれをスキップするには、`openclaw onboard --skip-bootstrap` を実行します。

## 実行される場所

ブートストラップは常に **Gateway ホスト**で実行されます。macOS アプリがリモート Gateway に接続する場合、ワークスペースとブートストラップファイルはそのリモートマシン上にあります。

<Note>
Gateway が別のマシンで実行されている場合は、ゲートウェイホスト上のワークスペースファイルを編集してください（例: `user@gateway-host:~/.openclaw/workspace`）。
</Note>

## 関連ドキュメント

- macOS アプリのオンボーディング: [オンボーディング](/ja-JP/start/onboarding)
- ワークスペースレイアウト: [エージェントワークスペース](/ja-JP/concepts/agent-workspace)
