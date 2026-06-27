---
read_when:
    - エージェントがすでに実行中に /steer または /tell を使用する
    - /steer と /queue モードの比較
    - 現在の実行を操作するか ACP セッションを操作するかを判断する
sidebarTitle: Steer
summary: キューモードを変更せずにアクティブな実行を操作する
title: 誘導
x-i18n:
    generated_at: "2026-06-27T13:18:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2e73f3f2fd938ee9dbdd14d183abe7f8676dbc7bb7382e6ad2c1fd41034fa09c
    source_path: tools/steer.md
    workflow: 16
---

`/steer` は、まずすでにアクティブな実行にガイダンスを送信しようとします。これは
「まだ動作中のこの実行を調整したい」場面向けです。現在のランタイムが
ステアリングを受け付けられない場合、OpenClaw はそのメッセージを破棄する代わりに
通常のプロンプトとして送信します。

## 現在のセッション

トップレベルの `/steer` を使って、現在のセッションのアクティブな実行を対象にします。

```text
/steer prefer the smaller patch and keep the tests focused
/tell summarize before making the next tool call
```

動作:

- 現在のセッションのアクティブな実行のみを対象にします。
- セッションの `/queue` モードとは独立して動作します。
- セッションがアイドル状態の場合、またはアクティブな実行がステアリングを受け付けられない場合は、
  同じメッセージで通常のターンを開始します。
- アクティブなランタイムのステアリング経路を使うため、モデルは次にサポートされる
  ランタイム境界でガイダンスを確認します。

## ステアリングとキュー

`/queue steer` は、通常の受信メッセージが実行中に届いたとき、アクティブな実行を
ステアリングしようとします。`/steer <message>` は明示的なコマンドで、
保存されている `/queue` 設定に関係なく、そのコマンドのメッセージを次にサポートされる
ランタイム境界でアクティブな実行に注入しようとします。その注入が利用できない場合、
コマンドプレフィックスは取り除かれ、`<message>` は通常のプロンプトとして続行されます。

用途:

- アクティブな実行を今すぐ誘導したい場合は `/steer <message>`。
- 今後の通常メッセージで、デフォルトでアクティブな実行をステアリングしたい場合は `/queue steer`。
- 今後の通常メッセージがアクティブな実行をステアリングせず、後続のターンまで待つべき場合は
  `/queue collect` または `/queue followup`。
- 最新のメッセージでアクティブな実行をステアリングするのではなく置き換えたい場合は
  `/queue interrupt`。

キューモードとステアリング境界については、[コマンドキュー](/ja-JP/concepts/queue) と
[ステアリングキュー](/ja-JP/concepts/queue-steering) を参照してください。

## サブエージェント

トップレベルの `/steer` は、現在のセッションのアクティブな実行を対象にします。サブエージェントは
親/リクエスト元のセッションへ報告します。`/subagents` は表示専用です。

## ACP セッション

対象が ACP ハーネスセッションの場合は `/acp steer` を使います。

```text
/acp steer --session agent:main:acp:codex tighten the repro
```

ACP セッションの選択とランタイムの動作については、[ACP エージェント](/ja-JP/tools/acp-agents) を参照してください。

## 関連

- [スラッシュコマンド](/ja-JP/tools/slash-commands)
- [コマンドキュー](/ja-JP/concepts/queue)
- [ステアリングキュー](/ja-JP/concepts/queue-steering)
- [サブエージェント](/ja-JP/tools/subagents)
