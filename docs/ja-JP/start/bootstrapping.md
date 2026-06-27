---
read_when:
    - 初回のエージェント実行で何が起こるかを理解する
    - ブートストラップ用ファイルの配置場所を説明する
    - オンボーディングのアイデンティティ設定のデバッグ
sidebarTitle: Bootstrapping
summary: ワークスペースとアイデンティティファイルを準備するエージェントのブートストラップ手順
title: エージェントのブートストラップ
x-i18n:
    generated_at: "2026-05-06T09:10:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: e25f05ca47184068b87f0bf8b7dea1c427f4ed48edde170a74888d586b8a606d
    source_path: start/bootstrapping.md
    workflow: 16
    postprocess_version: locale-links-v1
---

ブートストラップは、エージェントのワークスペースを準備し、ID 詳細を収集する**初回実行**の手順です。これはオンボーディングの後、エージェントが初めて起動するときに実行されます。

## ブートストラップで行われること

エージェントの初回実行時に、OpenClaw はワークスペース（デフォルトは
`~/.openclaw/workspace`）をブートストラップします。

- `AGENTS.md`、`BOOTSTRAP.md`、`IDENTITY.md`、`USER.md` をシードします。
- 短い Q&A 手順を実行します（1 回に 1 つの質問）。
- ID と設定を `IDENTITY.md`、`USER.md`、`SOUL.md` に書き込みます。
- 完了時に `BOOTSTRAP.md` を削除し、1 回だけ実行されるようにします。

埋め込みモデルまたはローカルモデルで実行する場合、OpenClaw は `BOOTSTRAP.md` を特権付きシステムコンテキストに含めません。主要な対話型の初回実行では、`read` ツールを確実には呼び出さないモデルでもこの手順を完了できるように、ユーザープロンプト内でファイルの内容を引き続き渡します。現在の実行がワークスペースに安全にアクセスできない場合、エージェントは汎用的な挨拶ではなく、限定的なブートストラップノートを受け取ります。

## ブートストラップをスキップする

事前にシード済みのワークスペースでこれをスキップするには、`openclaw onboard --skip-bootstrap` を実行します。

## 実行される場所

ブートストラップは常に **Gateway ホスト**で実行されます。macOS アプリがリモート Gateway に接続している場合、ワークスペースとブートストラップファイルはそのリモートマシン上にあります。

<Note>
Gateway が別のマシンで実行されている場合は、Gateway ホスト上のワークスペースファイルを編集してください（例: `user@gateway-host:~/.openclaw/workspace`）。
</Note>

## 関連ドキュメント

- macOS アプリのオンボーディング: [オンボーディング](/ja-JP/start/onboarding)
- ワークスペースレイアウト: [エージェントワークスペース](/ja-JP/concepts/agent-workspace)
