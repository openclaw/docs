---
read_when:
    - エージェント経由で音楽や音声を生成する
    - 音楽生成プロバイダーとモデルの設定
    - music_generate ツールのパラメーターを理解する
sidebarTitle: Music generation
summary: Google Lyria、MiniMax、ComfyUI のワークフロー全体で music_generate を介して音楽を生成
title: 音楽生成
x-i18n:
    generated_at: "2026-05-11T20:39:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: b355dd6f1f41074624b692edb8a597a65ad99fc3ad61d2ed5e32f1b6cf393244
    source_path: tools/music-generation.md
    workflow: 16
---

`music_generate` ツールにより、エージェントは設定済みプロバイダー（現在は Google、
MiniMax、およびワークフロー設定済みの ComfyUI）を使った共有の音楽生成機能を通じて、音楽や音声を作成できます。

セッションに基づくエージェント実行では、OpenClaw は音楽生成を
バックグラウンドタスクとして開始し、タスク台帳で追跡したうえで、トラックの準備ができると
エージェントを再度起動します。これにより、エージェントはユーザーに通知し、完成した音声を
添付できます。メッセージツールのみで可視配信するグループ/チャンネルチャットでは、
エージェントはメッセージツールを通じて結果を中継します。完了エージェントが非公開の最終返信のみを書いた場合、OpenClaw は生成されたメディアを付けて
チャンネルへの直接送信にフォールバックします。完了時の起動では、通常の最終返信は
これらのルートでは非公開であることをエージェントに明示的に警告します。

<Note>
組み込みの共有ツールは、少なくとも 1 つの音楽生成
プロバイダーが利用可能な場合にのみ表示されます。エージェントの
ツールに `music_generate` が表示されない場合は、`agents.defaults.musicGenerationModel` を設定するか、
プロバイダー API キーをセットアップしてください。
</Note>

## クイックスタート

<Tabs>
  <Tab title="Shared provider-backed">
    <Steps>
      <Step title="Configure auth">
        少なくとも 1 つのプロバイダーに API キーを設定します。たとえば
        `GEMINI_API_KEY` または `MINIMAX_API_KEY` です。
      </Step>
      <Step title="Pick a default model (optional)">
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
      <Step title="Ask the agent">
        _"Generate an upbeat synthpop track about a night drive through a
        neon city."_

        エージェントは `music_generate` を自動的に呼び出します。ツールの
        allow-listing は不要です。
      </Step>
    </Steps>

    セッションに基づくエージェント実行を持たない直接的な同期コンテキストでは、
    組み込みツールは引き続きインライン生成にフォールバックし、
    ツール結果で最終メディアパスを返します。

  </Tab>
  <Tab title="ComfyUI workflow">
    <Steps>
      <Step title="Configure the workflow">
        ワークフロー
        JSON とプロンプト/出力ノードを使用して `plugins.entries.comfy.config.music` を設定します。
      </Step>
      <Step title="Cloud auth (optional)">
        Comfy Cloud の場合は、`COMFY_API_KEY` または `COMFY_CLOUD_API_KEY` を設定します。
      </Step>
      <Step title="Call the tool">
        ```text
        /tool music_generate prompt="Warm ambient synth loop with soft tape texture"
        ```
      </Step>
    </Steps>
  </Tab>
</Tabs>

プロンプト例:

```text
Generate a cinematic piano track with soft strings and no vocals.
```

```text
Generate an energetic chiptune loop about launching a rocket at sunrise.
```

## 対応プロバイダー

| プロバイダー | デフォルトモデル          | 参照入力 | 対応コントロール                                        | 認証                                   |
| -------- | ---------------------- | ---------------- | --------------------------------------------------------- | -------------------------------------- |
| ComfyUI  | `workflow`             | 最大 1 枚の画像    | ワークフロー定義の音楽または音声                           | `COMFY_API_KEY`, `COMFY_CLOUD_API_KEY` |
| Google   | `lyria-3-clip-preview` | 最大 10 枚の画像  | `lyrics`, `instrumental`, `format`                        | `GEMINI_API_KEY`, `GOOGLE_API_KEY`     |
| MiniMax  | `music-2.6`            | なし             | `lyrics`, `instrumental`, `durationSeconds`, `format=mp3` | `MINIMAX_API_KEY` または MiniMax OAuth     |

### 機能マトリクス

`music_generate`、契約テスト、および
共有ライブスイープで使用される明示的なモード契約:

| プロバイダー | `generate` | `edit` | 編集制限 | 共有ライブレーン                                                         |
| -------- | :--------: | :----: | ---------- | ------------------------------------------------------------------------- |
| ComfyUI  |     ✓      |   ✓    | 1 枚の画像    | 共有スイープには含まれません。`extensions/comfy/comfy.live.test.ts` でカバーされます |
| Google   |     ✓      |   ✓    | 10 枚の画像  | `generate`, `edit`                                                        |
| MiniMax  |     ✓      |   —    | なし       | `generate`                                                                |

実行時に利用可能な共有プロバイダーとモデルを調べるには、
`action: "list"` を使用します:

```text
/tool music_generate action=list
```

アクティブなセッションに基づく音楽タスクを調べるには、`action: "status"` を使用します:

```text
/tool music_generate action=status
```

直接生成の例:

```text
/tool music_generate prompt="Dreamy lo-fi hip hop with vinyl texture and gentle rain" instrumental=true
```

## ツールパラメーター

<ParamField path="prompt" type="string" required>
  音楽生成プロンプト。`action: "generate"` では必須です。
</ParamField>
<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  `"status"` は現在のセッションタスクを返し、`"list"` はプロバイダーを調べます。
</ParamField>
<ParamField path="model" type="string">
  プロバイダー/モデルの上書き（例: `google/lyria-3-pro-preview`,
  `comfy/workflow`）。
</ParamField>
<ParamField path="lyrics" type="string">
  プロバイダーが明示的な歌詞入力に対応している場合の任意の歌詞。
</ParamField>
<ParamField path="instrumental" type="boolean">
  プロバイダーが対応している場合に、インストゥルメンタルのみの出力をリクエストします。
</ParamField>
<ParamField path="image" type="string">
  単一の参照画像パスまたは URL。
</ParamField>
<ParamField path="images" type="string[]">
  複数の参照画像（対応プロバイダーでは最大 10 枚）。
</ParamField>
<ParamField path="durationSeconds" type="number">
  プロバイダーが長さのヒントに対応している場合の目標時間（秒）。
</ParamField>
<ParamField path="format" type='"mp3" | "wav"'>
  プロバイダーが対応している場合の出力形式ヒント。
</ParamField>
<ParamField path="filename" type="string">出力ファイル名のヒント。</ParamField>
<ParamField path="timeoutMs" type="number">任意のプロバイダーリクエストタイムアウト（ミリ秒）。省略した場合、OpenClaw は設定されていれば `agents.defaults.musicGenerationModel.timeoutMs` を使用します。10000ms 未満の値は 10000ms に引き上げられ、ツール結果で報告されます。</ParamField>

<Note>
すべてのプロバイダーがすべてのパラメーターに対応しているわけではありません。OpenClaw は送信前に、入力数などのハード
制限を引き続き検証します。プロバイダーが
長さに対応しているものの、リクエスト値より短い最大値を使用する場合、OpenClaw は
最も近い対応済みの長さに丸めます。選択されたプロバイダーまたはモデルが対応できない、実際には未対応の任意ヒントは
警告付きで無視されます。ツール結果は適用された設定を報告し、`details.normalization`
はリクエスト値から適用値へのマッピングを記録します。
</Note>

## 非同期動作

セッションに基づく音楽生成はバックグラウンドタスクとして実行されます:

- **バックグラウンドタスク:** `music_generate` はバックグラウンドタスクを作成し、
  開始済み/タスクレスポンスをすぐに返し、後続のエージェントメッセージで
  完成したトラックを後から投稿します。
- **重複防止:** タスクが `queued` または `running` の間は、同じセッション内の後続の
  `music_generate` 呼び出しは、別の生成を開始せずにタスクステータスを返します。明示的に確認するには `action: "status"` を使用します。
- **ステータス検索:** `openclaw tasks list` または `openclaw tasks show <taskId>` は、
  キュー済み、実行中、および終了状態を調べます。
- **完了時の起動:** OpenClaw は内部の完了イベントを同じセッションに
  注入し、モデルがユーザー向けのフォローアップを
  自分で書けるようにします。
- **プロンプトヒント:** 同じセッションの後続のユーザー/手動ターンでは、音楽タスクがすでに進行中の場合に小さな
  実行時ヒントを受け取ります。そのため、モデルは
  `music_generate` を無条件に再度呼び出しません。
- **セッションなしのフォールバック:** 実際のエージェント
  セッションを持たない直接/ローカルコンテキストではインラインで実行され、同じターンで最終音声結果を返します。

### タスクライフサイクル

| 状態       | 意味                                                                                        |
| ----------- | ---------------------------------------------------------------------------------------------- |
| `queued`    | タスクが作成され、プロバイダーが受け付けるのを待っています。                                           |
| `running`   | プロバイダーが処理中です（通常、プロバイダーと長さに応じて 30 秒から 3 分）。 |
| `succeeded` | トラックの準備ができました。エージェントが起動し、会話に投稿します。                                 |
| `failed`    | プロバイダーエラーまたはタイムアウトです。エージェントはエラー詳細を伴って起動します。                                 |

CLI からステータスを確認します:

```bash
openclaw tasks list
openclaw tasks show <taskId>
openclaw tasks cancel <taskId>
```

## 設定

### モデル選択

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "google/lyria-3-clip-preview",
        fallbacks: ["minimax/music-2.6"],
      },
    },
  },
}
```

### プロバイダー選択順

OpenClaw は次の順序でプロバイダーを試します:

1. ツール呼び出しの `model` パラメーター（エージェントが指定した場合）。
2. 設定の `musicGenerationModel.primary`。
3. `musicGenerationModel.fallbacks` の順序どおり。
4. 認証に基づくプロバイダーのデフォルトのみを使用した自動検出:
   - 現在のデフォルトプロバイダーを最初に使用。
   - 残りの登録済み音楽生成プロバイダーを provider-id 順に使用。

プロバイダーが失敗した場合は、次の候補が自動的に試されます。すべてが
失敗した場合、エラーには各試行の詳細が含まれます。

明示的な `model`、`primary`、`fallbacks` エントリーのみを使用するには、
`agents.defaults.mediaGenerationAutoProviderFallback: false` を設定します。

## プロバイダーメモ

<AccordionGroup>
  <Accordion title="ComfyUI">
    ワークフロー駆動であり、設定済みグラフとプロンプト/出力フィールド用のノードマッピングに依存します。バンドルされた `comfy` Plugin は、音楽生成プロバイダー
    レジストリを通じて共有 `music_generate` ツールに接続します。
  </Accordion>
  <Accordion title="Google (Lyria 3)">
    Lyria 3 バッチ生成を使用します。現在のバンドルフローは
    プロンプト、任意の歌詞テキスト、および任意の参照画像に対応しています。
  </Accordion>
  <Accordion title="MiniMax">
    バッチ `music_generation` エンドポイントを使用します。プロンプト、任意の
    歌詞、インストゥルメンタルモード、長さの誘導、および
    `minimax` API キー認証または `minimax-portal` OAuth のいずれかを通じた mp3 出力に対応しています。
  </Accordion>
</AccordionGroup>

## 適切なパスの選択

- **共有プロバイダーに基づくパス** は、モデル選択、プロバイダー
  フェイルオーバー、および組み込みの非同期タスク/ステータスフローが必要な場合に使用します。
- **Plugin パス（ComfyUI）** は、カスタムワークフローグラフ、または
  共有のバンドル音楽機能に含まれないプロバイダーが必要な場合に使用します。

ComfyUI 固有の動作をデバッグしている場合は、
[ComfyUI](/ja-JP/providers/comfy) を参照してください。共有プロバイダーの
動作をデバッグしている場合は、[Google (Gemini)](/ja-JP/providers/google) または
[MiniMax](/ja-JP/providers/minimax) から始めてください。

## プロバイダー機能モード

共有音楽生成契約は、明示的なモード宣言に対応しています:

- プロンプトのみの生成には `generate`。
- リクエストに 1 つ以上の参照画像が含まれる場合は `edit`。

新しいプロバイダー実装では、明示的なモードブロックを優先する必要があります:

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

`maxInputImages`、`supportsLyrics`、および
`supportsFormat` のような従来のフラットなフィールドだけでは、編集対応を示すには**不十分**です。プロバイダーは `generate` と `edit` を明示的に宣言し、ライブテスト、契約
テスト、および共有 `music_generate` ツールがモード対応を
決定論的に検証できるようにする必要があります。

## ライブテスト

共有バンドルプロバイダー向けのオプトインライブカバレッジ:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts
```

リポジトリラッパー:

```bash
pnpm test:live:media music
```

このライブファイルは不足しているプロバイダー環境変数を `~/.profile` から読み込み、デフォルトでは保存済み認証プロファイルよりも
live/env API キーを優先し、プロバイダーが編集モードを有効にしている場合は
`generate` と宣言済みの `edit` カバレッジの両方を実行します。現在のカバレッジ:

- `google`: `generate` と `edit`
- `minimax`: `generate` のみ
- `comfy`: 個別の Comfy ライブカバレッジ。共有プロバイダー sweep ではありません

バンドルされた ComfyUI 音楽パスのライブカバレッジをオプトインで有効にするには:

```bash
OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
```

Comfy ライブファイルは、それらのセクションが設定されている場合、comfy 画像および動画ワークフローもカバーします。

## 関連

- [バックグラウンドタスク](/ja-JP/automation/tasks) — デタッチされた `music_generate` 実行のタスク追跡
- [ComfyUI](/ja-JP/providers/comfy)
- [設定リファレンス](/ja-JP/gateway/config-agents#agent-defaults) — `musicGenerationModel` 設定
- [Google (Gemini)](/ja-JP/providers/google)
- [MiniMax](/ja-JP/providers/minimax)
- [モデル](/ja-JP/concepts/models) — モデル設定とフェイルオーバー
- [ツール概要](/ja-JP/tools)
