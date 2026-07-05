---
read_when:
    - 長時間実行されるチャットターンの表示可能な進捗更新を設定する
    - partial、block、progress ストリーミングモードの選択
    - 作業の進行中に OpenClaw が1つのチャネルメッセージを更新する仕組みの説明
    - トラブルシューティング進捗下書き、単独の進捗メッセージ、または最終化フォールバック
summary: '進捗下書き: エージェントの実行中に更新される、表示可能な作業中メッセージ'
title: 進行中の下書き
x-i18n:
    generated_at: "2026-07-05T11:18:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6e284f9a7895ac9111608899ba8a4b4824a10159bc38b4158928bdf7fd3c45cd
    source_path: concepts/progress-drafts.md
    workflow: 16
---

進行状況ドラフトは、エージェントが作業している間、一時的な「まだ作業中」返信を積み重ねる代わりに、1つのチャンネルメッセージをライブのステータス行に変えます。`channels.<channel>.streaming.mode: "progress"` を設定すると、OpenClaw は実際の作業が始まった時点でメッセージを作成し、エージェントが読み取り、計画し、ツールを呼び出し、承認を待つ間に編集してから、最終回答に変換します。

```text
Shelling...
📖 from docs/concepts/progress-drafts.md
🔎 Web Search: for "discord edit message"
🛠️ Bash: run tests
```

<Note>
  Discord は、`channels.discord.streaming.mode`/`streamMode` が未設定の場合、すでに既定で `streaming.mode: "progress"` になるため、設定なしで進行状況ドラフトが表示されます。他のすべてのチャンネルは既定で `partial` または `off` です。チャンネルごとの既定値の完全な表は [ストリーミングとチャンク化](/ja-JP/concepts/streaming#channel-mapping) を参照してください。
</Note>

## クイックスタート

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

ここからの既定値: 自動の1語ラベル、5秒の開始遅延（または2つ目の作業イベントで即時開始）、有用な作業が発生している間のコンパクトな進行状況行、そのターンでの古い単独の進行状況メッセージの抑制。

このページでは、進行状況ドラフトの体験とその設定ノブについて説明します。ストリーミングモードの完全なマトリクス、チャンネルごとのランタイムメモ、レガシーキーの移行については、[ストリーミングとチャンク化](/ja-JP/concepts/streaming) を参照してください。

## ユーザーに表示されるもの

| 部分           | 目的                                                                           |
| -------------- | --------------------------------------------------------------------------------- |
| ラベル          | `Working` や `Shelling` などの短い開始/ステータス行。                        |
| 進行状況行 | `/verbose` と同じツールアイコンと詳細フォーマッターを使ったコンパクトな実行更新。 |

ラベルは、エージェントが意味のある作業を開始し、初期遅延の間ビジー状態が続いたとき、または2つ目の作業イベントが即時に発火したときに表示されます。これはローリング進行状況行リストの先頭に配置されるため、十分な具体的な作業行が表示されるとスクロールアウトします。プレーンテキストのみの返信では進行状況ドラフトは表示されません。行が表示されるのは実際の作業更新に限られます。たとえば `🛠️ Bash: run tests`、`🔎 Web Search: for "discord edit message"`、`✍️ Write: to /tmp/file` です。

チャンネルが安全にそれを実行できる場合、最終回答はドラフトをその場で置き換えます。それ以外の場合、OpenClaw は通常の配信で最終回答を送信し、ドラフトをクリーンアップするか更新を停止します（[最終化](#finalization) を参照）。

## モードを選ぶ

`channels.<channel>.streaming.mode` は、表示される進行中の挙動を制御します。

| モード       | 最適な用途                         | チャットに表示されるもの                              |
| ---------- | -------------------------------- | ------------------------------------------------- |
| `off`      | 静かなチャンネル                   | 最終回答のみ。                            |
| `partial`  | 回答テキストが表示されていく様子を見る      | 最新の回答テキストで編集される1つのドラフト。     |
| `block`    | より大きな回答プレビューチャンク     | より大きなチャンクで更新または追記される1つのプレビュー。 |
| `progress` | ツールが多い、または長時間実行されるターン | 1つのステータスドラフト、その後に最終回答。          |

ユーザーが回答テキストがトークン単位でストリームされる様子よりも「何が起きているか」を重視する場合は `progress` を選びます。回答テキスト自体が進行状況シグナルである場合は `partial`、より大きなプレビューチャンクには `block` を選びます。Discord と Telegram では、`streaming.mode: "block"` は通常のブロック返信配信ではなく、引き続きプレビューストリーミングです。その用途には `streaming.block.enabled`（またはレガシーの `blockStreaming`）を使います。

## ラベルを設定する

進行状況ラベルは `channels.<channel>.streaming.progress` の下にあります。既定の `label` は `"auto"` で、OpenClaw の組み込み単語ラベルプールから選択します。

```text
Working, Shelling, Scuttling, Clawing, Pinching, Molting, Bubbling, Tiding,
Reefing, Cracking, Sifting, Brining, Nautiling, Krilling, Barnacling,
Lobstering, Tidepooling, Pearling, Snapping, Surfacing
```

固定ラベルを使います。

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

独自のラベルプールを使います（`label: "auto"` の場合、引き続きランダム/シードで選択されます）。

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

ラベルを非表示にし、進行状況行だけを表示します。

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

## 進行状況行を制御する

進行状況行は実際の実行イベントから生成されます。ツール開始、項目更新、タスク計画、承認、コマンド出力、パッチ要約、および類似のエージェントアクティビティです。これは既定で有効です（`progress.toolProgress`、既定値 `true`）。

ツールは、単一の呼び出しがまだ実行中の間にも型付き進行状況を送出できます。これにより、遅い取得や検索では、ツールが最終結果を返す前に表示中のドラフトを更新できます。進行状況更新は、空のモデルコンテンツと明示的なパブリックチャンネルメタデータを持つ部分的なツール結果です。

```json
{
  "content": [],
  "progress": {
    "text": "Fetching page content...",
    "visibility": "channel",
    "privacy": "public",
    "id": "web_fetch:fetching"
  }
}
```

OpenClaw はチャンネル進行状況 UI に `progress.text` だけをレンダリングします。通常のツール結果は後で `content`/`details` として到着し、モデルに返されるのはその部分だけです。

ツールに進行状況を追加するときは、短く汎用的なメッセージを送出し、操作が有用といえる程度に長く保留された後まで遅延させます。`web_fetch` は5秒の遅延でこれを実行します。

```typescript
const clearProgressTimer = scheduleToolProgress(
  onUpdate,
  { text: "Fetching page content...", id: "web_fetch:fetching" },
  5_000,
  { signal },
);

try {
  return await runToolWork();
} finally {
  clearProgressTimer();
}
```

速い呼び出しでは進行状況行は表示されません。長い呼び出しでは保留中に1行が表示されます。キャンセルされた呼び出しでは、古い進行状況が表示される前にタイマーがクリアされます。進行状況テキストはパブリックな UI サイドチャンネルであるため、秘密情報、生の引数、取得したコンテンツ、コマンド出力、ページテキストを含めてはいけません。

### 詳細モード

OpenClaw は、進行状況ドラフトと `/verbose` に同じフォーマッターを使います。

```json5
{
  agents: {
    defaults: {
      toolProgressDetail: "explain", // explain | raw
    },
  },
}
```

`"explain"` が既定で、簡潔なラベルによってドラフトを安定させます。`"raw"` は利用可能な場合に基になるコマンドを追加します。これはデバッグ時に便利ですが、チャットではノイズが増えます。たとえば、`node --check /tmp/app.js` 呼び出しはモードによって異なる表示になります。

| モード      | 進行状況行                                                   |
| --------- | --------------------------------------------------------------- |
| `explain` | `🛠️ check js syntax for /tmp/app.js`                            |
| `raw`     | `🛠️ check js syntax for /tmp/app.js · node --check /tmp/app.js` |

### コマンド/exec テキスト

`streaming.progress.commandText`（既定値 `"raw"`）は、上記の詳細モードとは独立して、exec/bash 進行状況行の横に表示されるコマンド詳細の量を制御します。コマンドテキストを完全に隠しつつツール進行状況行を表示したままにするには、`"status"` に設定します。

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          commandText: "status",
        },
      },
    },
  },
}
```

### commentary レーン

`streaming.progress.commentary`（既定値 `false`）は、モデルのツール前 commentary/前置きナレーション（💬、たとえば「I'll check... then ...」）を、ドラフト内のツール行と交互に挿入します。チャンネル間で共有される設定形状については、[ストリーミングとチャンク化](/ja-JP/concepts/streaming#commentary-progress-lane) を参照してください。

### 行数制限

表示されたままにする行数を制限します（既定値 8）。

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

ドラフトの編集中にチャット吹き出しの再フローを減らすため、進行状況行は自動的にコンパクト化されます。また OpenClaw は長い行を切り詰めるため、繰り返しのドラフト編集で更新ごとに異なる折り返しになりません。既定の1行あたりの予算は120文字です。文章は単語境界で切られ、パスや生コマンドなどの長い詳細は、接尾部分が見えるように中央の省略記号で短縮されます。

1行あたりの予算を調整します。

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          maxLineChars: 160,
        },
      },
    },
  },
}
```

### リッチレンダリング（Slack）

Slack は、進行状況行をプレーンテキストではなく構造化された Block Kit フィールドとしてレンダリングできます。

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

リッチレンダリングでは、Block Kit フィールドと一緒に常に同じプレーンテキスト本文も送信されるため、よりリッチな形状をレンダリングできないクライアントでもコンパクトな進行状況テキストを表示できます。

### ツール/タスク行を非表示にする

単一の進行状況ドラフトは維持しつつ、ツール行とタスク行を非表示にします。

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

`toolProgress: false` の場合でも、OpenClaw はそのターンで古い単独のツール進行状況メッセージを抑制します。ラベルが設定されている場合を除き、チャンネルは最終回答まで視覚的に静かなままです。

## チャンネルの挙動

| チャンネル         | 進行状況トランスポート                     | メモ                                                                                                                                                     |
| --------------- | -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Discord         | 1つのメッセージを送信し、その後編集します。        | 既定で `progress` モードです。最終テキストが安全なプレビューメッセージ1つに収まる場合、その場で編集されます。                                                             |
| Matrix          | 1つのイベントを送信し、その後編集します。          | アカウントレベルのストリーミング設定がアカウントレベルのドラフトを制御します。                                                                                             |
| Microsoft Teams | 個人チャットでネイティブ Teams ストリームを使います。 | 代わりに `streaming.mode: "block"` は Teams ブロック配信にマップされます。                                                                                           |
| Slack           | ネイティブストリームまたは編集可能なドラフト投稿。  | 返信スレッドターゲットが必要です。ターゲットのないトップレベル DM でも、ドラフトプレビュー投稿と編集は行われます。                                                           |
| Telegram        | 1つのメッセージを送信し、その後編集します。        | 進行状況ドラフトと回答の間にメッセージが届いた場合、クライアントをスクロールジャンプさせる代わりに、ドラフトはその下に再投稿されます（新規投稿後に古いものを削除）。 |
| Mattermost      | 編集可能なドラフト投稿。                   | ツールアクティビティは同じドラフト形式の投稿に畳み込まれます。                                                                                                       |

安全な編集サポートがないチャンネルは、タイピングインジケーターまたは最終回答のみの配信にフォールバックします。チャンネルごとの完全なランタイム挙動の内訳は、[ストリーミングとチャンク化](/ja-JP/concepts/streaming) を参照してください。

## 最終化

最終回答の準備ができると、OpenClaw はチャットをきれいに保とうとします。

- ドラフトを安全に最終回答にできる場合、OpenClaw はその場で編集します。
- チャンネルがネイティブの進捗ストリーミングを使用している場合、OpenClaw はネイティブ転送が最終テキストを受け入れた時点でそのストリームを最終確定します。
- それ以外の場合（メディア、承認プロンプト、明示的な返信先、チャンクが多すぎる場合、または編集/送信の失敗）、OpenClaw はドラフトを上書きする代わりに、通常のチャンネル配信パスを通じて最終回答を送信します。

このフォールバックは意図的なものです。新しい最終回答を送信するほうが、テキストを失ったり、返信先スレッドを誤ったり、チャンネルが安全に表現できないペイロードでドラフトを上書きしたりするより優れています。

## トラブルシューティング

**最終回答しか表示されません。**

メッセージを処理したアカウントまたはチャンネルで `channels.<channel>.streaming.mode` が `progress` になっていることを確認してください。一部のグループまたは引用返信パスでは、チャンネルが正しいメッセージを安全に編集できない場合、そのターンのドラフトプレビューが無効になります。

**ラベルは表示されますが、ツール行が表示されません。**

`streaming.progress.toolProgress` を確認してください。`false` の場合、OpenClaw は単一ドラフトの動作を維持しますが、ツールとタスクの進捗行を非表示にします。

**編集されたドラフトではなく、新しい最終メッセージが表示されます。**

これは [最終確定](#finalization) で説明した安全フォールバックです。メディア返信、長い回答、明示的な返信先、古い Telegram ドラフト、Slack スレッド先の欠落、削除されたプレビューメッセージ、またはネイティブストリームの最終確定失敗で発生することがあります。

**独立した進捗メッセージがまだ表示されます。**

進捗モードでは、ドラフトがアクティブな間、既定の独立したツール進捗メッセージは抑制されます。独立したメッセージがまだ表示される場合は、そのターンが実際に `progress` モードを使用しており、`streaming.mode: "off"` や、そのメッセージのドラフトを作成できないチャンネルパスではないことを確認してください。

**Microsoft Teams は Discord や Telegram と異なる動作をします。**

Microsoft Teams は個人チャットで汎用の送信して編集するプレビュー転送ではなくネイティブストリームを使用し、Discord や Telegram のようなドラフトプレビューのブロックモードがないため、`streaming.mode: "block"` を Teams ブロック配信にマッピングします。

## 関連

- [ストリーミングとチャンク化](/ja-JP/concepts/streaming)
- [メッセージ](/ja-JP/concepts/messages)
- [チャンネル設定](/ja-JP/gateway/config-channels)
- [Discord](/ja-JP/channels/discord)
- [Matrix](/ja-JP/channels/matrix)
- [Microsoft Teams](/ja-JP/channels/msteams)
- [Slack](/ja-JP/channels/slack)
- [Telegram](/ja-JP/channels/telegram)
- [Mattermost](/ja-JP/channels/mattermost)
