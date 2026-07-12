---
read_when:
    - エージェントによる音楽または音声の生成
    - 音楽生成プロバイダーとモデルの設定
    - music_generate ツールのパラメータを理解する
sidebarTitle: Music generation
summary: ComfyUI、fal、Google Lyria、MiniMax、OpenRouterのワークフロー全体でmusic_generateを使用して音楽を生成する
title: 音楽生成
x-i18n:
    generated_at: "2026-07-11T22:46:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5a540f537141f0d97b264420aae9e986c1f0c3927b8988ebbaf3798b8afd5dd2
    source_path: tools/music-generation.md
    workflow: 16
---

`music_generate` ツールは、ComfyUI、fal、Google、MiniMax、OpenRouter を基盤とする共有の音楽生成機能を通じて、音楽または音声を作成します。

<Note>
`music_generate` は、少なくとも 1 つの音楽生成プロバイダーが利用可能な場合にのみ表示されます。具体的には、明示的な `agents.defaults.musicGenerationModel` 設定、または認証が設定されたプロバイダー（API キーが設定されている場合など）が必要です。
</Note>

セッションに紐づくエージェント実行では、`music_generate` はバックグラウンドタスクとして開始され、タスク台帳で進行状況を追跡します。トラックの準備が完了するとエージェントを起動し、ユーザーへの通知と完成した音声の添付を行えるようにします。完了処理を行うエージェントは、セッションの可視応答契約に従います。設定されている場合は最終応答を自動送信し、セッションでメッセージツールが必要な場合は `message(action="send")` を使用します。要求元のセッションが非アクティブであるか起動に失敗し、生成された音声が応答にまだ含まれていない場合、OpenClaw は不足している音声のみを含む冪等な直接フォールバックを送信します。

## クイックスタート

<Tabs>
  <Tab title="共有プロバイダー基盤">
    <Steps>
      <Step title="認証を設定する">
        少なくとも 1 つのプロバイダーに API キーを設定します。たとえば、`GEMINI_API_KEY` または `MINIMAX_API_KEY` を設定します。
      </Step>
      <Step title="デフォルトモデルを選択する（任意）">
        ```json5
        {
          agents: {
            defaults: {
              musicGenerationModel: {
                primary: "google/lyria-3-clip-preview",
              },
            },
          },
        }
        ```
      </Step>
      <Step title="エージェントに依頼する">
        _「ネオン輝く都市を夜にドライブする内容の、明るいシンセポップのトラックを生成して。」_

        エージェントは `music_generate` を自動的に呼び出します。ツールを許可リストに追加する必要はありません。
      </Step>
    </Steps>

    セッションに紐づくエージェント実行がない場合（直接またはローカルのコンテキスト）、ツールはインラインで実行され、同じツール結果内に最終的なメディアパスを返します。

  </Tab>
  <Tab title="ComfyUI ワークフロー">
    <Steps>
      <Step title="ワークフローを設定する">
        ワークフロー JSON とプロンプト／出力 Node を使用して、`plugins.entries.comfy.config.music` を設定します。
      </Step>
      <Step title="クラウド認証（任意）">
        Comfy Cloud では、`COMFY_API_KEY` または `COMFY_CLOUD_API_KEY` を設定します。
      </Step>
      <Step title="ツールを呼び出す">
        ```text
        /tool music_generate prompt="Warm ambient synth loop with soft tape texture"
        ```
      </Step>
    </Steps>
  </Tab>
</Tabs>

プロンプト例：

```text
Generate a cinematic piano track with soft strings and no vocals.
```

```text
Generate an energetic chiptune loop about launching a rocket at sunrise.
```

利用可能なプロバイダー／モデルを確認するには `action: "list"`、セッションに紐づくアクティブな音楽タスクを確認するには `action: "status"` を使用します。

```text
/tool music_generate action=list
/tool music_generate action=status
```

直接生成の例：

```text
/tool music_generate prompt="Dreamy lo-fi hip hop with vinyl texture and gentle rain" instrumental=true
```

## 対応プロバイダー

| プロバイダー | デフォルトモデル | 参照入力 | 対応する制御 | 認証 |
| ---------- | ---------------------------- | ---------------- | ----------------------------------------------------- | -------------------------------------- |
| ComfyUI    | `workflow`                   | 画像 1 枚まで    | ワークフローで定義された音楽または音声                | `COMFY_API_KEY`, `COMFY_CLOUD_API_KEY` |
| fal        | `fal-ai/minimax-music/v2.6`  | なし             | `lyrics`, `instrumental`, `durationSeconds`, `format` | `FAL_KEY` または `FAL_API_KEY`         |
| Google     | `lyria-3-clip-preview`       | 画像 10 枚まで   | `lyrics`, `instrumental`, `format`                    | `GEMINI_API_KEY`, `GOOGLE_API_KEY`     |
| MiniMax    | `music-2.6`                  | なし             | `lyrics`, `instrumental`, `format`（mp3 のみ）        | `MINIMAX_API_KEY` または MiniMax OAuth |
| OpenRouter | `google/lyria-3-pro-preview` | 画像 1 枚まで    | `lyrics`, `instrumental`, `durationSeconds`, `format` | `OPENROUTER_API_KEY`                   |

MiniMax は、同じモデルを共有する 2 つのプロバイダー ID を登録します。API キー認証には `minimax`、OAuth には `minimax-portal` を使用します。モデル参照は認証経路に従います（`minimax/music-2.6` と `minimax-portal/music-2.6`）。詳しくは [MiniMax](/ja-JP/providers/minimax#music-generation) を参照してください。

fal は、デフォルトの MiniMax 基盤モデルに加えて、`fal-ai/ace-step/prompt-to-audio`（wav、歌詞なし、インストゥルメンタル切り替えなし）と `fal-ai/stable-audio-25/text-to-audio`（wav、プロンプトのみ）も公開しています。Google のデフォルトである `lyria-3-clip-preview` は mp3 のみを出力します。`lyria-3-pro-preview` は wav にも対応します。MiniMax は `music-2.6-free`、`music-cover`、`music-cover-free` も公開しています。OpenRouter は `google/lyria-3-clip-preview` も公開しています。

### 機能マトリクス

`music_generate`、契約テスト、共有ライブスイープで使用される明示的なモード契約：

| プロバイダー | `generate` | `edit` | 編集上限 | 共有ライブレーン |
| ---------- | :--------: | :----: | ---------- | ------------------------------------------------------------------------- |
| ComfyUI    |     ✓      |   ✓    | 画像 1 枚  | 共有スイープの対象外。`extensions/comfy/comfy.live.test.ts` で検証 |
| fal        |     ✓      |   —    | なし       | `generate` |
| Google     |     ✓      |   ✓    | 画像 10 枚 | `generate`, `edit` |
| MiniMax    |     ✓      |   —    | なし       | `generate` |
| OpenRouter |     ✓      |   ✓    | 画像 1 枚  | `generate`, `edit` |

## ツールパラメーター

<ParamField path="prompt" type="string" required>
  音楽生成プロンプト。`action: "generate"` では必須です。
</ParamField>
<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  `"status"` は現在のセッションタスクを返し、`"list"` はプロバイダーを確認します。
</ParamField>
<ParamField path="model" type="string">
  プロバイダー／モデルの上書き（例：`google/lyria-3-pro-preview`、`comfy/workflow`）。
</ParamField>
<ParamField path="lyrics" type="string">
  プロバイダーが明示的な歌詞入力に対応している場合に使用できる任意の歌詞。
</ParamField>
<ParamField path="instrumental" type="boolean">
  プロバイダーが対応している場合、インストゥルメンタルのみの出力を要求します。
</ParamField>
<ParamField path="image" type="string">
  単一の参照画像のパスまたは URL。
</ParamField>
<ParamField path="images" type="string[]">
  複数の参照画像（対応プロバイダーでは最大 10 枚）。
</ParamField>
<ParamField path="durationSeconds" type="number">
  プロバイダーが再生時間の指定に対応している場合の、秒単位の目標再生時間。
</ParamField>
<ParamField path="format" type='"mp3" | "wav"'>
  プロバイダーが対応している場合の出力形式指定。
</ParamField>
<ParamField path="filename" type="string">出力ファイル名の指定。</ParamField>

<Note>
すべてのプロバイダーがすべてのパラメーターに対応しているわけではありません。OpenClaw は送信前に、入力数などの厳格な上限を引き続き検証します。プロバイダーが再生時間に対応していても、要求値より短い最大値を使用する場合、OpenClaw は最も近い対応再生時間に制限します。選択したプロバイダーまたはモデルが任意の指定に対応できない場合、その指定は警告とともに無視されます。ツール結果には適用された設定が報告され、`details.normalization` には要求値から適用値への変換が記録されます。
</Note>

プロバイダー要求のタイムアウトは、オペレーター設定でのみ指定できます。設定されている場合、OpenClaw は `agents.defaults.musicGenerationModel.timeoutMs` を使用し、120000ms 未満の値を 120000ms に引き上げます。それ以外の場合、プロバイダー要求のデフォルトは 300000ms です。

## 非同期動作

セッションに紐づく音楽生成は、バックグラウンドタスクとして実行されます。

- **バックグラウンドタスク：** `music_generate` はバックグラウンドタスクを作成し、開始済み／タスク応答をすぐに返した後、完成したトラックを後続のエージェントメッセージで送信します。
- **重複防止：** タスクが `queued` または `running` の間、同じセッションで後から行われた `music_generate` 呼び出しは、別の生成を開始せずにタスクの状態を返します。明示的に確認するには `action: "status"` を使用します。直近 2 分以内に完了した同一の要求も重複排除されます。
- **状態の確認：** `openclaw tasks list` または `openclaw tasks show <taskId>` で、待機中、実行中、終了状態を確認できます。
- **完了時の起動：** OpenClaw は内部完了イベントを同じセッションに戻して注入し、モデル自身がユーザー向けの後続応答を作成できるようにします。
- **プロンプトのヒント：** 音楽タスクがすでに処理中の場合、同じセッションで後から行われるユーザー／手動ターンには小さなランタイムヒントが与えられ、モデルが無条件に `music_generate` を再度呼び出すことを防ぎます。
- **セッションなしのフォールバック：** 実際のエージェントセッションがない直接／ローカルのコンテキストではインラインで実行され、同じターンで最終的な音声結果を返します。

### タスクのライフサイクル

音楽タスクは一般的なタスクレジストリと同じ状態を公開します（`timed_out`、`cancelled`、`lost` を含む完全な状態遷移については、[バックグラウンドタスク](/ja-JP/automation/tasks#task-lifecycle) を参照してください）。ほとんどの音楽生成は、次の状態を遷移します。

| 状態        | 意味 |
| ----------- | ---------------------------------------------------------------------------------------------- |
| `queued`    | タスクが作成され、プロバイダーによる受け付けを待機しています。 |
| `running`   | プロバイダーが処理中です（通常、プロバイダーと再生時間に応じて 30 秒～3 分）。 |
| `succeeded` | トラックの準備が完了し、エージェントが起動して会話に投稿します。 |
| `failed`    | プロバイダーエラーまたはタイムアウトが発生し、エージェントがエラーの詳細とともに起動します。 |

CLI から状態を確認します。

```bash
openclaw tasks list
openclaw tasks show <taskId>
openclaw tasks cancel <taskId>
```

## 設定

### モデルの選択

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "google/lyria-3-clip-preview",
        fallbacks: ["fal/fal-ai/minimax-music/v2.6", "minimax/music-2.6"],
      },
    },
  },
}
```

### プロバイダーの選択順序

OpenClaw は次の順序でプロバイダーを試行します。

1. ツール呼び出しの `model` パラメーター（エージェントが指定した場合）。
2. 設定の `musicGenerationModel.primary`。
3. 設定順の `musicGenerationModel.fallbacks`。
4. 認証に基づくプロバイダーのデフォルトのみを使用した自動検出：
   - 現在のデフォルトのテキストモデルプロバイダーが音楽生成にも対応している場合は、それを最初に使用します。
   - 残りの登録済み音楽生成プロバイダーを、プロバイダー ID のアルファベット順で使用します。

プロバイダーが失敗すると、次の候補が自動的に試行されます。すべて失敗した場合、エラーには各試行の詳細が含まれます。

明示的な `model`、`primary`、`fallbacks` エントリのみを使用するには、`agents.defaults.mediaGenerationAutoProviderFallback: false` を設定します。

## プロバイダーに関する注記

<AccordionGroup>
  <Accordion title="ComfyUI">
    ワークフロー駆動型であり、設定されたグラフと、プロンプトおよび出力フィールドの
    ノードマッピングに依存します。バンドルされている `comfy` Plugin は、
    音楽生成プロバイダーレジストリを通じて共有 `music_generate` ツールに
    接続します。
  </Accordion>
  <Accordion title="fal">
    共有プロバイダー認証パスを通じて fal モデルエンドポイントを使用します。
    バンドルされているプロバイダーのデフォルトは `fal-ai/minimax-music/v2.6` で、
    プロンプトから音声を生成するリクエスト向けに
    `fal-ai/ace-step/prompt-to-audio` と
    `fal-ai/stable-audio-25/text-to-audio` も公開します。
    歌詞とインストゥルメンタルモードは MiniMax モデルでのみ使用でき、ほかの2つの
    モデルはプロンプトのみに対応します。
  </Accordion>
  <Accordion title="Google (Lyria 3)">
    Lyria 3 のバッチ生成を使用します。現在バンドルされているフローは、
    プロンプト、任意の歌詞テキスト、任意の参照画像に対応します。
    デフォルトの `lyria-3-clip-preview` モデルは mp3 のみを出力し、
    `lyria-3-pro-preview` モデルは wav にも対応します。
  </Accordion>
  <Accordion title="MiniMax">
    バッチ `music_generation` エンドポイントを使用します。`minimax` の
    API キー認証または `minimax-portal` OAuth を通じて、プロンプト、
    任意の歌詞、インストゥルメンタルモード、mp3 出力に対応します。
    `music-2.6-free`、`music-cover`、`music-cover-free` モデルも
    公開します。
  </Accordion>
  <Accordion title="OpenRouter">
    ストリーミングを有効にした OpenRouter チャット補完の音声出力を使用します。
    バンドルされているプロバイダーのデフォルトは
    `google/lyria-3-pro-preview` で、
    `openrouter/google/lyria-3-clip-preview` も公開します。
  </Accordion>
</AccordionGroup>

## 適切なパスの選択

- モデル選択、プロバイダーのフェイルオーバー、組み込みの非同期タスクおよび
  ステータスフローが必要な場合は、**共有プロバイダー経由**。
- カスタムワークフローグラフ、または共有のバンドル済み音楽機能に含まれない
  プロバイダーが必要な場合は、**Plugin パス（ComfyUI）**。

ComfyUI 固有の動作をデバッグする場合は、
[ComfyUI](/ja-JP/providers/comfy) を参照してください。共有プロバイダーの
動作をデバッグする場合は、[fal](/ja-JP/providers/fal)、[Google (Gemini)](/ja-JP/providers/google)、
[MiniMax](/ja-JP/providers/minimax)、または [OpenRouter](/ja-JP/providers/openrouter) から
始めてください。

## プロバイダー機能モード

共有音楽生成コントラクトは、明示的なモード宣言に対応しています。

- プロンプトのみの生成には `generate`。
- リクエストに1つ以上の参照画像が含まれる場合は `edit`。

新しいプロバイダー実装では、明示的なモードブロックを使用することを推奨します。

```typescript
capabilities: {
  generate: {
    maxTracks: 1,
    supportsLyrics: true,
    supportsFormat: true,
  },
  edit: {
    enabled: true,
    maxTracks: 1,
    maxInputImages: 1,
    supportsFormat: true,
  },
}
```

`maxInputImages`、`supportsLyrics`、`supportsFormat` などの従来の
フラットフィールドだけでは、編集対応を表明するには**不十分**です。ライブテスト、
コントラクトテスト、共有 `music_generate` ツールがモード対応を決定論的に
検証できるように、プロバイダーは `generate` と `edit` を明示的に
宣言する必要があります。

## ライブテスト

共有のバンドル済みプロバイダー（fal、Google、MiniMax、OpenRouter）向けの
オプトイン式ライブカバレッジ：

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts
```

同じテストファイルを実行する、同等のリポジトリラッパー：

```bash
pnpm test:live:media:music
```

このライブテストファイルはデフォルトで、保存済み認証プロファイルよりも
エクスポート済みのプロバイダー環境変数を優先して使用し、プロバイダーが
編集モードを有効にしている場合は、`generate` と宣言済みの `edit` の
両方を実行します。現在のカバレッジ：

- `google`：`generate` と `edit`
- `fal`：`generate` のみ
- `minimax`：`generate` のみ
- `openrouter`：`generate` と `edit`
- `comfy`：共有プロバイダーの一括テストとは別の Comfy ライブカバレッジ

バンドル済み ComfyUI 音楽パス向けのオプトイン式ライブカバレッジ：

```bash
OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
```

Comfy ライブテストファイルは、それらのセクションが設定されている場合、
Comfy の画像および動画ワークフローも対象にします。

## 関連項目

- [バックグラウンドタスク](/ja-JP/automation/tasks) — 切り離して実行される `music_generate` のタスク追跡
- [ComfyUI](/ja-JP/providers/comfy)
- [設定リファレンス](/ja-JP/gateway/config-agents#agent-defaults) — `musicGenerationModel` の設定
- [Google (Gemini)](/ja-JP/providers/google)
- [MiniMax](/ja-JP/providers/minimax)
- [モデル](/ja-JP/concepts/models) — モデル設定とフェイルオーバー
- [ツール概要](/ja-JP/tools)
