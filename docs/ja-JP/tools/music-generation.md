---
read_when:
    - エージェント経由で音楽や音声を生成する
    - 音楽生成プロバイダーとモデルの設定
    - music_generate ツールのパラメーターを理解する
sidebarTitle: Music generation
summary: ComfyUI、fal、Google Lyria、MiniMax、OpenRouter ワークフロー全体で music_generate により音楽を生成する
title: 音楽生成
x-i18n:
    generated_at: "2026-06-27T13:14:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4fe6ad09b6e2cfae03bc5d5ef4368e80845a9e4a8c25c6303e181a6436a17c7e
    source_path: tools/music-generation.md
    workflow: 16
---

`music_generate` ツールにより、エージェントは設定済みプロバイダー (現時点では ComfyUI、fal、Google、MiniMax、OpenRouter) を使い、共有の音楽生成機能を通じて音楽や音声を作成できます。

セッション付きのエージェント実行では、OpenClaw は音楽生成をバックグラウンドタスクとして開始し、タスク台帳で追跡してから、トラックの準備ができたときにエージェントを再度起動します。これにより、エージェントはユーザーに通知し、完成した音声を添付できます。完了エージェントは、セッションの通常の可視返信モードに従います。設定されている場合は自動的に最終返信を配信し、セッションでメッセージツールが必要な場合は `message(action="send")` を使います。要求元セッションが非アクティブ、またはそのアクティブウェイクが失敗し、生成された音声の一部が完了返信にまだ含まれていない場合、OpenClaw は不足している音声だけを含む冪等な直接フォールバックを送信します。

<Note>
組み込みの共有ツールは、少なくとも1つの音楽生成プロバイダーが利用可能な場合にのみ表示されます。エージェントのツールに `music_generate` が表示されない場合は、`agents.defaults.musicGenerationModel` を設定するか、プロバイダー API キーを設定してください。
</Note>

## クイックスタート

<Tabs>
  <Tab title="Shared provider-backed">
    <Steps>
      <Step title="Configure auth">
        少なくとも1つのプロバイダーに API キーを設定します。たとえば
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

        エージェントは `music_generate` を自動的に呼び出します。ツールの許可リスト登録は不要です。
      </Step>
    </Steps>

    セッション付きエージェント実行がない直接同期コンテキストでは、組み込みツールは引き続きインライン生成にフォールバックし、ツール結果で最終メディアパスを返します。

  </Tab>
  <Tab title="ComfyUI workflow">
    <Steps>
      <Step title="Configure the workflow">
        ワークフロー JSON とプロンプト/出力ノードを使って
        `plugins.entries.comfy.config.music` を設定します。
      </Step>
      <Step title="Cloud auth (optional)">
        Comfy Cloud では、`COMFY_API_KEY` または `COMFY_CLOUD_API_KEY` を設定します。
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

| プロバイダー | デフォルトモデル             | 参照入力       | 対応コントロール                                      | 認証                                   |
| ---------- | ---------------------------- | ---------------- | ----------------------------------------------------- | -------------------------------------- |
| ComfyUI    | `workflow`                   | 最大1枚の画像  | ワークフローで定義された音楽または音声                | `COMFY_API_KEY`, `COMFY_CLOUD_API_KEY` |
| fal        | `fal-ai/minimax-music/v2.6`  | なし           | `lyrics`, `instrumental`, `durationSeconds`, `format` | `FAL_KEY` or `FAL_API_KEY`             |
| Google     | `lyria-3-clip-preview`       | 最大10枚の画像 | `lyrics`, `instrumental`, `format`                    | `GEMINI_API_KEY`, `GOOGLE_API_KEY`     |
| MiniMax    | `music-2.6`                  | なし           | `lyrics`, `instrumental`, `format=mp3`                | `MINIMAX_API_KEY` or MiniMax OAuth     |
| OpenRouter | `google/lyria-3-pro-preview` | 最大1枚の画像  | `lyrics`, `instrumental`, `durationSeconds`, `format` | `OPENROUTER_API_KEY`                   |

### 機能マトリクス

`music_generate`、コントラクトテスト、共有ライブスイープで使用される明示的なモード契約:

| プロバイダー | `generate` | `edit` | 編集上限   | 共有ライブレーン                                                       |
| ---------- | :--------: | :----: | ---------- | ------------------------------------------------------------------------- |
| ComfyUI    |     ✓      |   ✓    | 1枚の画像  | 共有スイープには含まれません。`extensions/comfy/comfy.live.test.ts` でカバーされます |
| fal        |     ✓      |   —    | なし       | `generate`                                                                |
| Google     |     ✓      |   ✓    | 10枚の画像 | `generate`, `edit`                                                        |
| MiniMax    |     ✓      |   —    | なし       | `generate`                                                                |
| OpenRouter |     ✓      |   ✓    | 1枚の画像  | `generate`, `edit`                                                        |

実行時に利用可能な共有プロバイダーとモデルを調べるには、`action: "list"` を使用します。

```text
/tool music_generate action=list
```

アクティブなセッション付き音楽タスクを調べるには、`action: "status"` を使用します。

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
  `"status"` は現在のセッションタスクを返します。`"list"` はプロバイダーを調べます。
</ParamField>
<ParamField path="model" type="string">
  プロバイダー/モデルの上書き (例: `google/lyria-3-pro-preview`,
  `comfy/workflow`)。
</ParamField>
<ParamField path="lyrics" type="string">
  プロバイダーが明示的な歌詞入力に対応している場合の任意の歌詞。
</ParamField>
<ParamField path="instrumental" type="boolean">
  プロバイダーが対応している場合、インストゥルメンタルのみの出力を要求します。
</ParamField>
<ParamField path="image" type="string">
  単一の参照画像パスまたは URL。
</ParamField>
<ParamField path="images" type="string[]">
  複数の参照画像 (対応プロバイダーでは最大10枚)。
</ParamField>
<ParamField path="durationSeconds" type="number">
  プロバイダーが長さのヒントに対応している場合の目標秒数。
</ParamField>
<ParamField path="format" type='"mp3" | "wav"'>
  プロバイダーが対応している場合の出力形式ヒント。
</ParamField>
<ParamField path="filename" type="string">出力ファイル名のヒント。</ParamField>

<Note>
すべてのプロバイダーがすべてのパラメーターに対応しているわけではありません。OpenClaw は送信前に、入力数などの厳格な制限を引き続き検証します。プロバイダーが長さに対応しているものの、要求値より短い最大値を使用する場合、OpenClaw は最も近い対応済みの長さに丸めます。選択したプロバイダーまたはモデルが実際には対応できない任意ヒントは、警告とともに無視されます。ツール結果には適用された設定が報告されます。`details.normalization` には、要求値から適用値へのマッピングが記録されます。
</Note>

プロバイダー要求のタイムアウトは、オペレーター設定専用です。OpenClaw は、設定されている場合は `agents.defaults.musicGenerationModel.timeoutMs` を使用し、120000ms 未満の値は 120000ms に引き上げ、それ以外の場合はプロバイダー要求のデフォルトを 300000ms にします。

## 非同期動作

セッション付き音楽生成はバックグラウンドタスクとして実行されます。

- **バックグラウンドタスク:** `music_generate` はバックグラウンドタスクを作成し、開始済み/タスク応答をただちに返し、後でフォローアップのエージェントメッセージに完成したトラックを投稿します。
- **重複防止:** タスクが `queued` または `running` の間、同じセッション内の後続の `music_generate` 呼び出しは、別の生成を開始する代わりにタスクステータスを返します。明示的に確認するには `action: "status"` を使用します。
- **ステータス参照:** `openclaw tasks list` または `openclaw tasks show <taskId>` は、キュー済み、実行中、終端ステータスを調べます。
- **完了ウェイク:** OpenClaw は内部の完了イベントを同じセッションに注入し、モデルがユーザー向けフォローアップを自分で書けるようにします。
- **プロンプトヒント:** 同じセッション内の後続のユーザー/手動ターンでは、音楽タスクがすでに進行中の場合に小さなランタイムヒントが渡されるため、モデルが盲目的に `music_generate` を再度呼び出すことはありません。
- **セッションなしフォールバック:** 実際のエージェントセッションがない直接/ローカルコンテキストではインラインで実行され、同じターンで最終音声結果を返します。

### タスクライフサイクル

| 状態        | 意味                                                                                           |
| ----------- | ---------------------------------------------------------------------------------------------- |
| `queued`    | タスクが作成され、プロバイダーが受け付けるのを待っています。                                   |
| `running`   | プロバイダーが処理中です (通常はプロバイダーと長さに応じて30秒から3分)。                       |
| `succeeded` | トラックの準備ができました。エージェントが起動し、会話に投稿します。                           |
| `failed`    | プロバイダーエラーまたはタイムアウトです。エージェントはエラー詳細とともに起動します。         |

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
        fallbacks: ["fal/fal-ai/minimax-music/v2.6", "minimax/music-2.6"],
      },
    },
  },
}
```

### プロバイダー選択順序

OpenClaw は次の順序でプロバイダーを試します。

1. ツール呼び出しの `model` パラメーター (エージェントが指定した場合)。
2. 設定の `musicGenerationModel.primary`。
3. `musicGenerationModel.fallbacks` の順序。
4. 認証に裏付けられたプロバイダーデフォルトのみを使う自動検出:
   - 現在のデフォルトプロバイダーを最初に使用;
   - 残りの登録済み音楽生成プロバイダーをプロバイダー ID 順に使用。

プロバイダーが失敗した場合は、次の候補が自動的に試されます。すべて失敗した場合、エラーには各試行の詳細が含まれます。

明示的な `model`、`primary`、`fallbacks` エントリだけを使用するには、`agents.defaults.mediaGenerationAutoProviderFallback: false` を設定します。

## プロバイダーノート

<AccordionGroup>
  <Accordion title="ComfyUI">
    ワークフロー駆動であり、設定されたグラフとプロンプト/出力フィールドのノードマッピングに依存します。バンドルされた `comfy` Plugin は、音楽生成プロバイダーレジストリを通じて共有 `music_generate` ツールに接続します。
  </Accordion>
  <Accordion title="fal">
    共有プロバイダー認証パスを通じて fal モデルエンドポイントを使用します。バンドルされたプロバイダーのデフォルトは `fal-ai/minimax-music/v2.6` で、プロンプトから音声への要求向けに `fal-ai/ace-step/prompt-to-audio` と
    `fal-ai/stable-audio-25/text-to-audio` も公開します。
  </Accordion>
  <Accordion title="Google (Lyria 3)">
    Lyria 3 のバッチ生成を使用します。現在のバンドルフローは、プロンプト、任意の歌詞テキスト、任意の参照画像に対応しています。
  </Accordion>
  <Accordion title="MiniMax">
    バッチ `music_generation` エンドポイントを使用します。`minimax` API キー認証または `minimax-portal` OAuth を通じて、プロンプト、任意の歌詞、インストゥルメンタルモード、mp3 出力に対応しています。
  </Accordion>
  <Accordion title="OpenRouter">
    ストリーミングを有効にした OpenRouter チャット補完の音声出力を使用します。バンドルされたプロバイダーのデフォルトは `google/lyria-3-pro-preview` で、`openrouter/google/lyria-3-clip-preview` も公開します。
  </Accordion>
</AccordionGroup>

## 適切なパスの選択

- **共有プロバイダー裏付け** は、モデル選択、プロバイダーフェイルオーバー、組み込みの非同期タスク/ステータスフローが必要な場合に使用します。
- **Plugin パス (ComfyUI)** は、カスタムワークフローグラフ、または共有のバンドル音楽機能に含まれないプロバイダーが必要な場合に使用します。

ComfyUI固有の動作をデバッグしている場合は、
[ComfyUI](/ja-JP/providers/comfy)を参照してください。共有プロバイダーの
動作をデバッグしている場合は、[fal](/ja-JP/providers/fal)、[Google (Gemini)](/ja-JP/providers/google)、
[MiniMax](/ja-JP/providers/minimax)、または[OpenRouter](/ja-JP/providers/openrouter)から始めてください。

## プロバイダー機能モード

共有の音楽生成コントラクトは、明示的なモード宣言をサポートします。

- プロンプトのみの生成には`generate`。
- リクエストに1つ以上の参照画像が含まれる場合は`edit`。

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

`maxInputImages`、`supportsLyrics`、`supportsFormat`などの従来のフラットなフィールドは、編集サポートを告知するには**不十分**です。プロバイダーは`generate`と`edit`を明示的に宣言し、ライブテスト、コントラクトテスト、共有`music_generate`ツールがモードサポートを決定論的に検証できるようにする必要があります。

## ライブテスト

共有バンドルプロバイダー向けのオプトインのライブカバレッジ:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts
```

リポジトリラッパー:

```bash
pnpm test:live:media music
```

このライブファイルはデフォルトで、保存済み認証プロファイルよりも、すでにエクスポートされているプロバイダー環境変数を優先して使用し、プロバイダーが編集モードを有効にしている場合は、`generate`と宣言済みの`edit`カバレッジの両方を実行します。現在のカバレッジ:

- `google`: `generate`と`edit`
- `fal`: `generate`のみ
- `minimax`: `generate`のみ
- `openrouter`: `generate`と`edit`
- `comfy`: 共有プロバイダースイープではなく、個別のComfyライブカバレッジ

バンドルされたComfyUI音楽パス向けのオプトインのライブカバレッジ:

```bash
OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
```

Comfyライブファイルは、それらのセクションが設定されている場合、comfy画像および動画ワークフローもカバーします。

## 関連

- [バックグラウンドタスク](/ja-JP/automation/tasks) — デタッチされた`music_generate`実行のタスク追跡
- [ComfyUI](/ja-JP/providers/comfy)
- [設定リファレンス](/ja-JP/gateway/config-agents#agent-defaults) — `musicGenerationModel`設定
- [Google (Gemini)](/ja-JP/providers/google)
- [MiniMax](/ja-JP/providers/minimax)
- [モデル](/ja-JP/concepts/models) — モデル設定とフェイルオーバー
- [ツール概要](/ja-JP/tools)
