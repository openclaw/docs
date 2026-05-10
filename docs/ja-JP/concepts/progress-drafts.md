---
read_when:
    - 長時間実行されるチャットターンの表示用進捗更新を設定する
    - 部分、ブロック、進捗のストリーミングモードの選択
    - OpenClaw が作業の進行中に 1 件のチャネルメッセージを更新する仕組みの説明
    - 進行状況ドラフト、スタンドアロンの進行状況メッセージ、または最終化フォールバックのトラブルシューティング
summary: '進捗ドラフト: エージェントの実行中に更新される、表示される作業中メッセージ 1 件'
title: 進行中の下書き
x-i18n:
    generated_at: "2026-05-10T19:33:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3d84027a412a2c62ea9a5698d015c7aeb8a7f27d9db79112bb2c1c10f97ebd88
    source_path: concepts/progress-drafts.md
    workflow: 16
---

Progress drafts は、長時間実行されるエージェントターンを、会話を一時的なステータス返信の積み重ねにせずに、チャット上で動いているように見せます。

Progress drafts を有効にすると、OpenClaw はターンが実際に作業していることを示した後でのみ、表示される作業中メッセージを 1 つ作成し、エージェントが読み取り、計画し、ツールを呼び出し、または承認を待つ間にそれを更新し、チャネルが安全に実行できる場合は、その下書きを最終回答に変換します。

```text
Shelling...
📖 from docs/concepts/progress-drafts.md
🔎 Web Search: for "discord edit message"
🛠️ Bash: run tests
```

ツールを多用する作業中に整理されたステータスメッセージを 1 つ表示し、ターンが完了したら最終回答を表示したい場合に Progress drafts を使用します。

## クイックスタート

チャネルごとに `streaming.mode: "progress"` で Progress drafts を有効にします。

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
      },
    },
  },
}
```

通常はこれで十分です。OpenClaw は自動的に 1 語のラベルを選び、作業が少なくとも 5 秒続くか、2 つ目の作業イベントが発生するまで待機し、有用な作業が発生している間はコンパクトな進捗行を追加し、そのターンについて重複する単独の進捗チャットを抑制します。

## ユーザーに表示される内容

Progress draft は 2 つの部分で構成されます。

| 部分           | 目的                                                                               |
| -------------- | ------------------------------------------------------------------------------------- |
| ラベル          | `Thinking...` や `Shelling...` のような短い開始行またはステータス行。                   |
| 進捗行 | 詳細出力と同じツールアイコンおよび詳細フォーマッターを使った、コンパクトな実行更新。 |

ラベルは、エージェントが意味のある作業を開始し、5 秒間ビジー状態が続くか、2 つ目の作業イベントを発行した後に表示されます。これはローリング進捗行リストの一部であるため、十分な具体的作業が表示されると、開始ステータスはスクロールアウトします。プレーンテキストのみの返信では Progress draft は表示されません。進捗行は、エージェントが有用な作業更新を発行した場合にのみ追加されます。たとえば、`🛠️ Bash: run tests`、`🔎 Web Search: for "discord edit message"`、`✍️ Write: to /tmp/file` などです。既定では `/verbose` と同じコンパクトな説明モードを使用します。デバッグ中で、生のコマンドや詳細も追加したい場合は `agents.defaults.toolProgressDetail: "raw"` を設定します。
可能な場合、最終回答は下書きを置き換えます。それ以外の場合、OpenClaw は通常どおり最終回答を送信し、チャネルのトランスポートに応じて下書きをクリーンアップするか、更新を停止します。

## モードを選択する

`channels.<channel>.streaming.mode` は、表示される進行中の動作を制御します。

| モード       | 最適な用途                         | チャットに表示される内容                              |
| ---------- | -------------------------------- | ------------------------------------------------- |
| `off`      | 静かなチャネル                   | 最終回答のみ。                            |
| `partial`  | 回答テキストが表示されていく様子を見る場合      | 最新の回答テキストで編集される 1 つの下書き。     |
| `block`    | より大きな回答プレビューのチャンク     | より大きなチャンクで更新または追加される 1 つのプレビュー。 |
| `progress` | ツールを多用する、または長時間実行されるターン | 1 つのステータス下書き、その後に最終回答。          |

ユーザーが回答テキストをトークン単位でストリーミング表示することよりも、「何が起きているか」を重視する場合は `progress` を選択します。

回答自体が進捗シグナルである場合は `partial` を選択します。

より大きなテキストチャンクで下書きプレビューを更新したい場合は `block` を選択します。Discord と Telegram では、`streaming.mode: "block"` は通常のブロック配信ではなく、引き続きプレビューストリーミングです。通常のブロック返信を使いたい場合は `streaming.block.enabled` またはレガシーの `blockStreaming` を使用します。

## ラベルを設定する

進捗ラベルは `channels.<channel>.streaming.progress` の下にあります。

既定のラベルは `auto` で、OpenClaw の組み込みの、省略記号付き単一語ラベルプールから選択します。

```text
Thinking...
Shelling...
Scuttling...
Clawing...
Pinching...
Molting...
Bubbling...
Tiding...
Reefing...
Cracking...
Sifting...
Brining...
Nautiling...
Krilling...
Barnacling...
Lobstering...
Tidepooling...
Pearling...
Snapping...
Surfacing...
```

固定ラベルを使用します。

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          label: "Investigating",
        },
      },
    },
  },
}
```

独自の自動ラベルプールを使用します。

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          label: "auto",
          labels: ["Checking", "Reading", "Testing", "Finishing"],
        },
      },
    },
  },
}
```

ラベルを非表示にし、進捗行のみを表示します。

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          label: false,
        },
      },
    },
  },
}
```

## 進捗行を制御する

進捗行は progress モードで既定で有効です。これは実際の実行イベントから生成されます。ツール開始、項目更新、タスク計画、承認、コマンド出力、パッチ要約、および同様のエージェント活動です。

OpenClaw は Progress drafts と `/verbose` に同じフォーマッターを使用します。

```json5
{
  agents: {
    defaults: {
      toolProgressDetail: "explain", // explain | raw
    },
  },
}
```

`"explain"` が既定で、`🛠️ check JS syntax for /tmp/app.js` のような簡潔なラベルで下書きを安定させます。`"raw"` は利用可能な場合に基になるコマンドや詳細を追加します。デバッグ中には便利ですが、チャットではよりノイズが増えます。

たとえば、同じコマンドでも詳細モードによって表示が異なります。

| モード      | 進捗行                                                  |
| --------- | -------------------------------------------------------------- |
| `explain` | `🛠️ check JS syntax for /tmp/app.js`                           |
| `raw`     | `🛠️ check JS syntax for /tmp/app.js, node --check /tmp/app.js` |

表示されたままにする行数を制限します。

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          maxLines: 4,
        },
      },
    },
  },
}
```

進捗行は、下書きが編集されている間のチャットバブルの再フローを減らすために自動的に圧縮されます。

OpenClaw は既定で長い進捗行を切り詰めるため、繰り返し下書きを編集しても、更新のたびに折り返しが変わりません。プレフィックスは読みやすいまま残り、パスや生のコマンドなどの長い詳細は省略記号で短縮されます。

Slack は、進捗行を単一のテキスト本文ではなく、構造化された Block Kit フィールドとしてレンダリングできます。

```json5
{
  channels: {
    slack: {
      streaming: {
        mode: "progress",
        progress: {
          render: "rich",
        },
      },
    },
  },
}
```

リッチレンダリングでも同じプレーンテキストのフォールバックが維持されるため、よりリッチな形をサポートしないチャネルやクライアントでも、コンパクトな進捗テキストを表示できます。

単一の Progress draft は維持しつつ、ツール行とタスク行を非表示にします。

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          toolProgress: false,
        },
      },
    },
  },
}
```

`toolProgress: false` の場合でも、OpenClaw はそのターンについて古い単独のツール進捗メッセージを抑制します。ラベルが設定されている場合を除き、チャネルは最終回答まで視覚的に静かなままです。

## チャネルの動作

各チャネルは、サポートする最もクリーンなトランスポートを使用します。

| チャネル         | 進捗トランスポート                     | 注記                                                                 |
| --------------- | -------------------------------------- | --------------------------------------------------------------------- |
| Discord         | 1 つのメッセージを送信し、その後編集します。        | 最終テキストが 1 つの安全なプレビューメッセージに収まる場合は、その場で編集されます。      |
| Matrix          | 1 つのイベントを送信し、その後編集します。          | アカウントレベルのストリーミング設定が、アカウントレベルの下書きを制御します。         |
| Microsoft Teams | 個人チャットのネイティブ Teams ストリーム。 | `streaming.mode: "block"` は Teams ブロック配信にマップされます。               |
| Slack           | ネイティブストリームまたは編集可能な下書き投稿。  | スレッドの可用性は、ネイティブストリーミングを使用できるかどうかに影響します。     |
| Telegram        | 1 つのメッセージを送信し、その後編集します。        | 最終タイムスタンプが有用なままになるように、古い表示下書きが置き換えられる場合があります。 |
| Mattermost      | 編集可能な下書き投稿。                   | ツール活動は同じ下書き形式の投稿に折り込まれます。               |

安全な編集サポートがないチャネルは通常、入力インジケーターまたは最終回答のみの配信にフォールバックします。

## 最終化

最終回答の準備ができると、OpenClaw はチャットをきれいに保とうとします。

- 下書きを安全に最終回答にできる場合、OpenClaw はその場で編集します。
- チャネルがネイティブの進捗ストリーミングを使用する場合、ネイティブトランスポートが最終テキストを受け入れた時点で、OpenClaw はそのストリームを最終化します。
- 最終回答にメディア、承認プロンプト、明示的な返信先、過剰なチャンク数、または編集や送信の失敗がある場合、OpenClaw は通常のチャネル配信パスで最終回答を送信します。

フォールバックパスは意図的なものです。テキストを失ったり、返信スレッドを誤ったり、チャネルが安全に表現できないペイロードで下書きを上書きしたりするよりも、新しい最終回答を送信する方が適切です。

## トラブルシューティング

**最終回答しか表示されません。**

メッセージを処理したアカウントまたはチャネルで、`channels.<channel>.streaming.mode` が `progress` に設定されていることを確認します。一部のグループまたは引用返信のパスでは、チャネルが正しいメッセージを安全に編集できない場合、そのターンの下書きプレビューが無効になることがあります。

**ラベルは表示されますが、ツール行が表示されません。**

`streaming.progress.toolProgress` を確認します。`false` の場合、OpenClaw は単一下書きの動作を維持しますが、ツールとタスクの進捗行を非表示にします。

**編集された下書きではなく、新しい最終メッセージが表示されます。**

これは安全のためのフォールバックです。メディア返信、長い回答、明示的な返信先、古い Telegram 下書き、Slack スレッド先の欠落、削除されたプレビューメッセージ、またはネイティブストリームの最終化失敗で発生することがあります。

**単独の進捗メッセージがまだ表示されます。**

Progress mode は、下書きがアクティブな場合に既定の単独のツール進捗メッセージを抑制します。それでも単独メッセージが表示される場合は、そのターンが実際に progress mode を使用しており、`streaming.mode: "off"` や、そのメッセージの下書きを作成できないチャネルパスではないことを確認します。

**Teams の動作が Discord や Telegram と異なります。**

Microsoft Teams は、汎用の送信して編集するプレビュートランスポートの代わりに、個人チャットでネイティブストリームを使用します。また Teams は、Discord や Telegram で使われる同じ下書きプレビューブロックモードを持たないため、`streaming.mode: "block"` を Teams ブロック配信として扱います。

## 関連

- [ストリーミングとチャンク化](/ja-JP/concepts/streaming)
- [メッセージ](/ja-JP/concepts/messages)
- [チャネル設定](/ja-JP/gateway/config-channels)
- [Discord](/ja-JP/channels/discord)
- [Matrix](/ja-JP/channels/matrix)
- [Microsoft Teams](/ja-JP/channels/msteams)
- [Slack](/ja-JP/channels/slack)
- [Telegram](/ja-JP/channels/telegram)
