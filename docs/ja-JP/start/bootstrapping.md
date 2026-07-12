---
read_when:
    - エージェントの初回実行時に何が起こるかを理解する
    - ブートストラップファイルの保存場所の説明
    - オンボーディングのID設定をデバッグする
sidebarTitle: Bootstrapping
summary: ワークスペースとアイデンティティファイルを初期設定するエージェントのブートストラップ手順
title: エージェントのブートストラップ
x-i18n:
    generated_at: "2026-07-11T22:42:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d8356684e8567b02f558ce2b455a20019e55579e5dcb4625bb441d66656098e0
    source_path: start/bootstrapping.md
    workflow: 16
---

ブートストラップは、新しいエージェントワークスペースに初期ファイルを配置し、エージェントがアイデンティティを選択する手順を案内する初回実行時の儀式です。オンボーディングの直後、エージェントが初めて実際に応答する際に一度だけ実行されます。

## 実行される処理

まったく新しいワークスペース（デフォルトは `~/.openclaw/workspace`）で初めて実行すると、OpenClaw は次の処理を行います。

- `AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、`BOOTSTRAP.md` を初期配置します。
- エージェントに `BOOTSTRAP.md` の手順に従わせ、自由形式の会話（固定された一問一答形式ではありません）を通じて、名前、性格、雰囲気を決定します。
- 会話から得た情報を `IDENTITY.md`、`USER.md`、`SOUL.md` に書き込みます。
- ワークスペースの設定が完了したと判断されると `BOOTSTRAP.md` を削除し、この儀式が一度だけ実行されるようにします。

`SOUL.md`、`IDENTITY.md`、`USER.md` のいずれかが初期テンプレートから変更されているか、`memory/` フォルダーが存在すると、ワークスペースは設定済みとみなされます。

<Note>
`BOOTSTRAP.md` には、アイデンティティを決める会話の全内容が記載されています。内容については、[BOOTSTRAP.md テンプレート](/ja-JP/reference/templates/BOOTSTRAP)を参照してください。
</Note>

## 組み込みモデルとローカルモデルでの実行

組み込みモデルまたはローカルモデルで実行する場合、OpenClaw は `BOOTSTRAP.md` を特権システムコンテキストに含めません。ただし、主要な対話型の初回実行では、ファイルの内容をユーザープロンプト経由で渡します。そのため、`read` ツールを確実に呼び出せないモデルでも、この儀式を完了できます。現在の実行環境からワークスペースへ安全にアクセスできない場合、エージェントは一般的な挨拶の代わりに、短い制限付きブートストラップの注記を受け取ります。

## ブートストラップのスキップ

事前に初期ファイルを配置したワークスペースでこの処理をスキップするには、次を実行します。

```bash
openclaw onboard --skip-bootstrap
```

## 実行場所

ブートストラップは常に Gateway ホスト上で実行されます。macOS アプリがリモート Gateway に接続する場合、ワークスペースとそのブートストラップファイルは Mac ではなく、そのリモートマシン上に置かれます。

<Note>
Gateway が別のマシンで実行されている場合は、Gateway ホスト上のワークスペースファイル（たとえば、`user@gateway-host:~/.openclaw/workspace`）を編集してください。
</Note>

## 関連ドキュメント

- macOS アプリのオンボーディング：[オンボーディング](/ja-JP/start/onboarding)
- ワークスペースの構成：[エージェントワークスペース](/ja-JP/concepts/agent-workspace)
- テンプレートの内容：[BOOTSTRAP.md テンプレート](/ja-JP/reference/templates/BOOTSTRAP)
