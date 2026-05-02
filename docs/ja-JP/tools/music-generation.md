---
read_when:
    - エージェントによる音楽または音声の生成
    - 音楽生成プロバイダーとモデルの設定
    - music_generate ツールのパラメーターを理解する
sidebarTitle: Music generation
summary: Google Lyria、MiniMax、ComfyUI のワークフロー全体で music_generate を介して音楽を生成する
title: 音楽生成
x-i18n:
    generated_at: "2026-05-02T21:08:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9199afe17b2641efb1a7523c651724af9c312c1415c7e60ca736341699f6bc26
    source_path: tools/music-generation.md
    workflow: 16
---

`music_generate` ツールにより、エージェントは設定済みプロバイダー（現在は Google、MiniMax、ワークフロー設定済みの ComfyUI）を使って、共有の音楽生成機能を通じて音楽または音声を作成できます。

セッションに裏付けられたエージェント実行では、OpenClaw は音楽生成をバックグラウンドタスクとして開始し、タスク台帳で追跡し、トラックの準備ができたらエージェントを再度起動して、完成した音声を元のチャンネルに投稿できるようにします。

<Note>
組み込みの共有ツールは、少なくとも 1 つの音楽生成プロバイダーが利用可能な場合にのみ表示されます。エージェントのツールに `music_generate` が表示されない場合は、`agents.defaults.musicGenerationModel` を設定するか、プロバイダーの API キーを設定してください。
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
        _「ネオンの街を夜にドライブすることをテーマにした、明るいシンセポップのトラックを生成して。」_

        エージェントは `music_generate` を自動的に呼び出します。ツールの許可リスト設定は不要です。
      </Step>
    </Steps>

    セッションに裏付けられたエージェント実行のない直接同期コンテキストでは、組み込みツールは引き続きインライン生成にフォールバックし、ツール結果で最終メディアパスを返します。

  </Tab>
  <Tab title="ComfyUI workflow">
    <Steps>
      <Step title="Configure the workflow">
        ワークフロー JSON とプロンプト/出力ノードを使って `plugins.entries.comfy.config.music` を設定します。
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

## サポートされているプロバイダー

| プロバイダー | デフォルトモデル          | 参照入力 | サポートされる制御                                        | 認証                                   |
| -------- | ---------------------- | ---------------- | --------------------------------------------------------- | -------------------------------------- |
| ComfyUI  | `workflow`             | 最大 1 枚の画像    | ワークフロー定義の音楽または音声                           | `COMFY_API_KEY`, `COMFY_CLOUD_API_KEY` |
| Google   | `lyria-3-clip-preview` | 最大 10 枚の画像  | `lyrics`, `instrumental`, `format`                        | `GEMINI_API_KEY`, `GOOGLE_API_KEY`     |
| MiniMax  | `music-2.6`            | なし             | `lyrics`, `instrumental`, `durationSeconds`, `format=mp3` | `MINIMAX_API_KEY` または MiniMax OAuth     |

### 機能マトリクス

`music_generate`、コントラクトテスト、共有ライブスイープで使用される明示的なモードコントラクト:

| プロバイダー | `generate` | `edit` | 編集制限 | 共有ライブレーン                                                         |
| -------- | :--------: | :----: | ---------- | ------------------------------------------------------------------------- |
| ComfyUI  |     ✓      |   ✓    | 1 枚の画像    | 共有スイープには含まれません。`extensions/comfy/comfy.live.test.ts` でカバーされます |
| Google   |     ✓      |   ✓    | 10 枚の画像  | `generate`, `edit`                                                        |
| MiniMax  |     ✓      |   —    | なし       | `generate`                                                                |

実行時に利用可能な共有プロバイダーとモデルを調べるには、`action: "list"` を使用します。

```text
/tool music_generate action=list
```

アクティブなセッション連動音楽タスクを調べるには、`action: "status"` を使用します。

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
  プロバイダーが明示的な歌詞入力をサポートしている場合の任意の歌詞。
</ParamField>
<ParamField path="instrumental" type="boolean">
  プロバイダーがサポートしている場合に、インストゥルメンタルのみの出力を要求します。
</ParamField>
<ParamField path="image" type="string">
  単一の参照画像パスまたは URL。
</ParamField>
<ParamField path="images" type="string[]">
  複数の参照画像（対応プロバイダーでは最大 10 枚）。
</ParamField>
<ParamField path="durationSeconds" type="number">
  プロバイダーが長さのヒントをサポートしている場合の目標秒数。
</ParamField>
<ParamField path="format" type='"mp3" | "wav"'>
  プロバイダーがサポートしている場合の出力形式ヒント。
</ParamField>
<ParamField path="filename" type="string">出力ファイル名のヒント。</ParamField>
<ParamField path="timeoutMs" type="number">任意のプロバイダーリクエストタイムアウト（ミリ秒）。10000ms 未満の値は 10000ms に引き上げられ、ツール結果で報告されます。</ParamField>

<Note>
すべてのプロバイダーがすべてのパラメーターをサポートしているわけではありません。OpenClaw は送信前に入力数などのハードリミットを引き続き検証します。プロバイダーが長さをサポートしているものの、要求値より短い最大値を使用する場合、OpenClaw は最も近いサポート対象の長さに丸めます。本当にサポートされていない任意のヒントは、選択したプロバイダーまたはモデルがそれらを満たせない場合、警告付きで無視されます。ツール結果には適用された設定が報告され、`details.normalization` には要求値から適用値へのマッピングが記録されます。
</Note>

## 非同期動作

セッションに裏付けられた音楽生成はバックグラウンドタスクとして実行されます。

- **バックグラウンドタスク:** `music_generate` はバックグラウンドタスクを作成し、開始済み/タスクレスポンスをすぐに返し、完成したトラックを後続のエージェントメッセージで後から投稿します。
- **重複防止:** タスクが `queued` または `running` の間、同じセッション内の後続の `music_generate` 呼び出しは、別の生成を開始する代わりにタスクステータスを返します。明示的に確認するには `action: "status"` を使用します。
- **ステータス検索:** `openclaw tasks list` または `openclaw tasks show <taskId>` は、キュー済み、実行中、終端ステータスを調べます。
- **完了時の起動:** OpenClaw は内部の完了イベントを同じセッションに注入し、モデルがユーザー向けのフォローアップを自分で書けるようにします。
- **プロンプトヒント:** 同じセッション内の後続のユーザー/手動ターンでは、音楽タスクがすでに進行中の場合に小さなランタイムヒントが与えられるため、モデルが無条件に `music_generate` を再度呼び出すことを防げます。
- **セッションなしのフォールバック:** 実際のエージェントセッションを持たない直接/ローカルコンテキストはインラインで実行され、同じターンで最終的な音声結果を返します。

### タスクライフサイクル

| 状態       | 意味                                                                                        |
| ----------- | ---------------------------------------------------------------------------------------------- |
| `queued`    | タスクが作成され、プロバイダーが受け付けるのを待っています。                                           |
| `running`   | プロバイダーが処理中です（通常はプロバイダーと長さに応じて 30 秒から 3 分）。 |
| `succeeded` | トラックの準備ができました。エージェントが起動して会話に投稿します。                                 |
| `failed`    | プロバイダーエラーまたはタイムアウトです。エージェントがエラー詳細付きで起動します。                                 |

CLI からステータスを確認します。

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

OpenClaw は次の順序でプロバイダーを試行します。

1. ツール呼び出しの `model` パラメーター（エージェントが指定した場合）。
2. 設定の `musicGenerationModel.primary`。
3. 順番どおりの `musicGenerationModel.fallbacks`。
4. 認証に裏付けられたプロバイダーのデフォルトのみを使った自動検出:
   - 現在のデフォルトプロバイダーが最初。
   - 残りの登録済み音楽生成プロバイダーを provider-id 順で。

プロバイダーが失敗した場合、次の候補が自動的に試行されます。すべて失敗した場合、エラーには各試行の詳細が含まれます。

明示的な `model`、`primary`、`fallbacks` エントリのみを使用するには、`agents.defaults.mediaGenerationAutoProviderFallback: false` を設定します。

## プロバイダーノート

<AccordionGroup>
  <Accordion title="ComfyUI">
    ワークフロー駆動であり、設定されたグラフとプロンプト/出力フィールドのノードマッピングに依存します。バンドルされた `comfy` Plugin は、音楽生成プロバイダーレジストリを通じて共有 `music_generate` ツールに接続します。
  </Accordion>
  <Accordion title="Google (Lyria 3)">
    Lyria 3 バッチ生成を使用します。現在のバンドルフローは、プロンプト、任意の歌詞テキスト、任意の参照画像をサポートしています。
  </Accordion>
  <Accordion title="MiniMax">
    バッチ `music_generation` エンドポイントを使用します。プロンプト、任意の歌詞、インストゥルメンタルモード、長さの誘導、mp3 出力を、`minimax` API キー認証または `minimax-portal` OAuth のいずれかを通じてサポートします。
  </Accordion>
</AccordionGroup>

## 適切なパスの選択

- **共有プロバイダー連動** は、モデル選択、プロバイダーのフェイルオーバー、組み込みの非同期タスク/ステータスフローが必要な場合に使用します。
- **Plugin パス（ComfyUI）** は、カスタムワークフローグラフ、または共有バンドル音楽機能の一部ではないプロバイダーが必要な場合に使用します。

ComfyUI 固有の動作をデバッグしている場合は、[ComfyUI](/ja-JP/providers/comfy) を参照してください。共有プロバイダーの動作をデバッグしている場合は、[Google (Gemini)](/ja-JP/providers/google) または [MiniMax](/ja-JP/providers/minimax) から始めてください。

## プロバイダー機能モード

共有音楽生成コントラクトは、明示的なモード宣言をサポートしています。

- `generate` はプロンプトのみの生成用です。
- `edit` はリクエストに 1 つ以上の参照画像が含まれる場合に使用します。

新しいプロバイダー実装では、明示的なモードブロックを優先してください。

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

`maxInputImages`、`supportsLyrics`、`supportsFormat` などの従来のフラットフィールドは、編集サポートを示すには**十分ではありません**。プロバイダーは `generate` と `edit` を明示的に宣言し、ライブテスト、コントラクトテスト、共有 `music_generate` ツールがモードサポートを決定論的に検証できるようにする必要があります。

## ライブテスト

共有バンドルプロバイダー向けのオプトインライブカバレッジ:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts
```

リポジトリラッパー:

```bash
pnpm test:live:media music
```

このライブファイルは、不足しているプロバイダー環境変数を `~/.profile` から読み込み、既定では保存済み認証プロファイルよりもライブ/環境 API キーを優先し、プロバイダーが編集モードを有効にしている場合は `generate` と宣言済み `edit` の両方のカバレッジを実行します。現在のカバレッジ:

- `google`: `generate` と `edit`
- `minimax`: `generate` のみ
- `comfy`: 個別の Comfy ライブカバレッジであり、共有プロバイダースイープではありません

バンドルされた ComfyUI 音楽パス向けのオプトインライブカバレッジ:

```bash
OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
```

Comfy live ファイルは、それらのセクションが設定されている場合、comfy の画像および動画ワークフローも扱います。

## 関連

- [バックグラウンドタスク](/ja-JP/automation/tasks) — 切り離された `music_generate` 実行のタスク追跡
- [ComfyUI](/ja-JP/providers/comfy)
- [設定リファレンス](/ja-JP/gateway/config-agents#agent-defaults) — `musicGenerationModel` 設定
- [Google (Gemini)](/ja-JP/providers/google)
- [MiniMax](/ja-JP/providers/minimax)
- [モデル](/ja-JP/concepts/models) — モデル設定とフェイルオーバー
- [ツール概要](/ja-JP/tools)
