---
read_when:
    - エージェントの実行中に /steer または /tell を使用する
    - /steer と /queue モードの比較
    - 現在の実行を制御するか、ACP セッションを制御するかを決定する
sidebarTitle: Steer
summary: キューモードを変更せずに実行中の処理を制御する
title: 操作指示
x-i18n:
    generated_at: "2026-07-11T22:48:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2e73f3f2fd938ee9dbdd14d183abe7f8676dbc7bb7382e6ad2c1fd41034fa09c
    source_path: tools/steer.md
    workflow: 16
---

`/steer` はまず、すでに実行中の処理へ指示を送ろうとします。これは、
「まだ処理中のこの実行を調整する」場面で使用します。現在のランタイムが
ステアリングを受け付けられない場合、OpenClaw はメッセージを破棄せず、
通常のプロンプトとして送信します。

## 現在のセッション

トップレベルの `/steer` を使用して、現在のセッションで実行中の処理を対象にします。

```text
/steer prefer the smaller patch and keep the tests focused
/tell summarize before making the next tool call
```

動作:

- 現在のセッションで実行中の処理のみを対象にします。
- セッションの `/queue` モードとは独立して動作します。
- セッションがアイドル状態の場合、または実行中の処理がステアリングを受け付けられない場合は、同じメッセージで通常のターンを開始します。
- 実行中のランタイムのステアリング経路を使用するため、モデルはランタイムが次に対応する境界で指示を受け取ります。

## ステアリングとキューの違い

`/queue steer` を使用すると、通常の受信メッセージが処理の実行中に到着した場合、
そのメッセージによって実行中の処理のステアリングが試みられます。`/steer <message>` は、
保存されている `/queue` 設定に関係なく、ランタイムが次に対応する境界で、そのコマンドの
メッセージを実行中の処理へ明示的に注入しようとするコマンドです。この注入を利用できない場合、
コマンドのプレフィックスが取り除かれ、`<message>` は通常のプロンプトとして処理されます。

使用方法:

- 実行中の処理を今すぐ誘導する場合は、`/steer <message>` を使用します。
- 今後の通常のメッセージで、デフォルトで実行中の処理を誘導する場合は、`/queue steer` を使用します。
- 今後の通常のメッセージを、実行中の処理の誘導に使用せず、後のターンまで待機させる場合は、`/queue collect` または `/queue followup` を使用します。
- 最新のメッセージで実行中の処理を誘導するのではなく置き換える場合は、`/queue interrupt` を使用します。

キューモードとステアリング境界については、[コマンドキュー](/ja-JP/concepts/queue)および
[ステアリングキュー](/ja-JP/concepts/queue-steering)を参照してください。

## サブエージェント

トップレベルの `/steer` は、現在のセッションで実行中の処理を対象にします。サブエージェントは、
親またはリクエスト元のセッションへ結果を報告します。`/subagents` は表示確認専用です。

## ACP セッション

対象が ACP ハーネスセッションの場合は、`/acp steer` を使用します。

```text
/acp steer --session agent:main:acp:codex tighten the repro
```

ACP セッションの選択とランタイムの動作については、[ACP エージェント](/ja-JP/tools/acp-agents)を
参照してください。

## 関連項目

- [スラッシュコマンド](/ja-JP/tools/slash-commands)
- [コマンドキュー](/ja-JP/concepts/queue)
- [ステアリングキュー](/ja-JP/concepts/queue-steering)
- [サブエージェント](/ja-JP/tools/subagents)
