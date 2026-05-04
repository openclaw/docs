---
read_when:
    - エージェントがすでに実行中のときに /steer または /tell を使用する
    - /steer と /queue steer の比較
    - 現在の実行、サブエージェント、または ACP セッションのどれを操作するかを判断する
sidebarTitle: Steer
summary: キューモードを変更せずにアクティブな実行を操作する
title: 誘導
x-i18n:
    generated_at: "2026-05-04T05:03:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 71e1c80c0eea86d5c3c29513d3ed0675c04779fc9c6ee3b8a76c4bedaa264d22
    source_path: tools/steer.md
    workflow: 16
---

`/steer` は、すでにアクティブな実行へガイダンスを送信します。新しいターンを開始するためではなく、「まだ処理中のこの実行を調整する」場面のためのものです。

## 現在のセッション

現在のセッションのアクティブな実行を対象にするには、トップレベルの `/steer` を使います。

```text
/steer prefer the smaller patch and keep the tests focused
/tell summarize before making the next tool call
```

動作:

- 現在のセッションのアクティブな実行のみを対象にします。
- セッションの `/queue` モードとは独立して動作します。
- セッションがアイドル状態のときに新しい実行を開始しません。
- 指示を送る対象のアクティブな実行がない場合は、警告を返します。
- アクティブなランタイムのステアリング経路を使うため、モデルは次にサポートされるランタイム境界でガイダンスを受け取ります。

## ステアリングとキュー

`/queue steer` は、実行がアクティブな間に通常の受信メッセージが到着した場合の動作を変更します。`/steer <message>` は明示的なコマンドであり、保存済みの `/queue` 設定に関係なく、そのコマンドのメッセージを次にサポートされるランタイム境界でアクティブな実行へ注入しようとします。

使用方法:

- アクティブな実行を今すぐ誘導したい場合は `/steer <message>` を使います。
- 今後の通常メッセージで、デフォルトでアクティブな実行を誘導したい場合は `/queue steer` を使います。
- 新しいメッセージがアクティブな実行を誘導するのではなく、後のターンまで待つべき場合は `/queue collect` または `/queue followup` を使います。

キューモードとフォールバック動作については、[コマンドキュー](/ja-JP/concepts/queue) と [ステアリングキュー](/ja-JP/concepts/queue-steering) を参照してください。

## サブエージェント

対象が子実行の場合は `/subagents steer` を使います。

```text
/subagents steer 2 focus only on the API surface
```

トップレベルの `/steer` は、サブエージェントを id やリストインデックスで選択しません。常に現在のセッションのアクティブな実行を対象にします。サブエージェントの id、ラベル、制御コマンドについては、[サブエージェント](/ja-JP/tools/subagents) を参照してください。

## ACP セッション

対象が ACP ハーネスセッションの場合は `/acp steer` を使います。

```text
/acp steer --session agent:main:acp:codex tighten the repro
```

ACP セッションの選択とランタイム動作については、[ACP エージェント](/ja-JP/tools/acp-agents) を参照してください。

## 関連項目

- [スラッシュコマンド](/ja-JP/tools/slash-commands)
- [コマンドキュー](/ja-JP/concepts/queue)
- [ステアリングキュー](/ja-JP/concepts/queue-steering)
- [サブエージェント](/ja-JP/tools/subagents)
