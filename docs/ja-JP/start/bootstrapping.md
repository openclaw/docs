---
read_when:
    - 最初のエージェント実行で何が起こるかを理解する
    - ブートストラップ用ファイルの場所を説明する
    - オンボーディング ID セットアップのデバッグ
sidebarTitle: Bootstrapping
summary: エージェントのブートストラップ儀式により、ワークスペースと ID ファイルをシードします
title: Agent のブートストラップ
x-i18n:
    generated_at: "2026-07-05T11:51:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d8356684e8567b02f558ce2b455a20019e55579e5dcb4625bb441d66656098e0
    source_path: start/bootstrapping.md
    workflow: 16
---

ブートストラップは、新しいエージェントワークスペースを初期化し、エージェントがアイデンティティを選ぶまで案内する初回実行時の手順です。オンボーディングの直後、エージェントの最初の実際のターンで一度だけ実行されます。

## 何が起こるか

まったく新しいワークスペース（デフォルトは `~/.openclaw/workspace`）での初回実行時に、OpenClaw は次を行います。

- `AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、`BOOTSTRAP.md` を配置します。
- エージェントに `BOOTSTRAP.md` に従わせます。これは、名前、性格、雰囲気を決めるための自由形式の会話（固定の Q&A フォームではありません）です。
- 学習した内容を `IDENTITY.md`、`USER.md`、`SOUL.md` に書き込みます。
- ワークスペースが設定済みに見えたら `BOOTSTRAP.md` を削除し、この手順が一度だけ実行されるようにします。

`SOUL.md`、`IDENTITY.md`、または `USER.md` がスターターテンプレートから変化しているか、`memory/` フォルダーが存在する場合、ワークスペースは設定済みと見なされます。

<Note>
`BOOTSTRAP.md` はアイデンティティに関する会話全体を扱います。内容は
[BOOTSTRAP.md テンプレート](/ja-JP/reference/templates/BOOTSTRAP) を参照してください。
</Note>

## 組み込みモデルとローカルモデルの実行

組み込みモデルまたはローカルモデルの実行では、OpenClaw は `BOOTSTRAP.md` を特権システムコンテキストに含めません。主要な対話型の初回実行では、引き続きユーザープロンプトを通じてファイル内容を渡すため、`read` ツールを確実に呼び出さないモデルでもこの手順を完了できます。現在の実行でワークスペースに安全にアクセスできない場合、エージェントは汎用的な挨拶ではなく、短い限定ブートストラップのメモを受け取ります。

## ブートストラップをスキップする

事前に初期化済みのワークスペースでこれをスキップするには、次を実行します。

```bash
openclaw onboard --skip-bootstrap
```

## 実行場所

ブートストラップは常に Gateway ホスト上で実行されます。macOS アプリがリモート Gateway に接続している場合、ワークスペースとそのブートストラップファイルは Mac ではなく、そのリモートマシン上にあります。

<Note>
Gateway が別のマシンで実行されている場合は、Gateway ホスト上でワークスペースファイルを編集してください（例: `user@gateway-host:~/.openclaw/workspace`）。
</Note>

## 関連ドキュメント

- macOS アプリのオンボーディング: [オンボーディング](/ja-JP/start/onboarding)
- ワークスペースのレイアウト: [エージェントワークスペース](/ja-JP/concepts/agent-workspace)
- テンプレートの内容: [BOOTSTRAP.md テンプレート](/ja-JP/reference/templates/BOOTSTRAP)
