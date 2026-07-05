---
read_when:
    - エージェントによる音楽または音声の生成
    - 音楽生成プロバイダーとモデルの設定
    - music_generate ツールのパラメーターを理解する
sidebarTitle: Music generation
summary: ComfyUI、fal、Google Lyria、MiniMax、OpenRouter のワークフロー全体で music_generate により音楽を生成する
title: 音楽生成
x-i18n:
    generated_at: "2026-07-05T11:51:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5a540f537141f0d97b264420aae9e986c1f0c3927b8988ebbaf3798b8afd5dd2
    source_path: tools/music-generation.md
    workflow: 16
---

`music_generate` ツールは、ComfyUI、fal、Google、MiniMax、OpenRouter をバックエンドとする共有の音楽生成機能を通じて、音楽または音声を作成します。

<Note>
`music_generate` は、少なくとも1つの音楽生成プロバイダーが利用可能な場合にのみ表示されます。明示的な `agents.defaults.musicGenerationModel` 設定、または認証設定済みのプロバイダー（たとえば API キーが設定済み）です。
</Note>

セッションに紐づくエージェント実行では、`music_generate` はバックグラウンドタスクとして開始され、タスク台帳で進行状況を追跡し、トラックの準備ができるとエージェントを起動して、ユーザーに通知し、完成した音声を添付できるようにします。完了エージェントは、セッションの可視返信契約に従います。設定されている場合は自動の最終返信を行い、セッションがメッセージツールを必要とする場合は `message(action="send")` を使います。リクエスト元のセッションが非アクティブ、または起動に失敗し、生成された音声がまだ返信に含まれていない場合、OpenClaw は不足している音声だけを含む冪等な直接フォールバックを送信します。

## クイックスタート

<Tabs>
  <Tab title="Shared provider-backed">
    <Steps>
      <Step title="Configure auth">
        少なくとも1つのプロバイダーに API キーを設定します。たとえば `GEMINI_API_KEY` または `MINIMAX_API_KEY` です。
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

    セッションに紐づくエージェント実行がない場合（直接/ローカルコンテキスト）、ツールはインラインで実行され、同じツール結果内で最終的なメディアパスを返します。

  </Tab>
  <Tab title="ComfyUI workflow">
    <Steps>
      <Step title="Configure the workflow">
        ワークフロー JSON とプロンプト/出力ノードを使用して `plugins.entries.comfy.config.music` を設定します。
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

利用可能なプロバイダー/モデルを確認するには `action: "list"` を使い、アクティブなセッション紐づきの音楽タスクを確認するには `action: "status"` を使います。

```text
/tool music_generate action=list
/tool music_generate action=status
```

直接生成の例:

```text
/tool music_generate prompt="Dreamy lo-fi hip hop with vinyl texture and gentle rain" instrumental=true
```

## 対応プロバイダー

| プロバイダー | デフォルトモデル             | 参照入力          | 対応する制御                                          | 認証                                   |
| ---------- | ---------------------------- | ---------------- | ----------------------------------------------------- | -------------------------------------- |
| ComfyUI    | `workflow`                   | 最大1枚の画像    | ワークフロー定義の音楽または音声                      | `COMFY_API_KEY`, `COMFY_CLOUD_API_KEY` |
| fal        | `fal-ai/minimax-music/v2.6`  | なし             | `lyrics`, `instrumental`, `durationSeconds`, `format` | `FAL_KEY` または `FAL_API_KEY`         |
| Google     | `lyria-3-clip-preview`       | 最大10枚の画像   | `lyrics`, `instrumental`, `format`                    | `GEMINI_API_KEY`, `GOOGLE_API_KEY`     |
| MiniMax    | `music-2.6`                  | なし             | `lyrics`, `instrumental`, `format`（mp3 のみ）        | `MINIMAX_API_KEY` または MiniMax OAuth |
| OpenRouter | `google/lyria-3-pro-preview` | 最大1枚の画像    | `lyrics`, `instrumental`, `durationSeconds`, `format` | `OPENROUTER_API_KEY`                   |

MiniMax は、同じモデルを共有する2つのプロバイダー ID を登録します。API キー認証用の `minimax` と OAuth 用の `minimax-portal` です。モデル参照は認証パスに従います（`minimax/music-2.6` と `minimax-portal/music-2.6`）。[MiniMax](/ja-JP/providers/minimax#music-generation) を参照してください。

fal は、デフォルトの MiniMax バックエンドモデルに加えて、`fal-ai/ace-step/prompt-to-audio`（wav、歌詞なし、インストゥルメンタル切り替えなし）と `fal-ai/stable-audio-25/text-to-audio`（wav、プロンプトのみ）も公開しています。Google のデフォルト `lyria-3-clip-preview` は mp3 のみを出力します。`lyria-3-pro-preview` は wav にも対応します。MiniMax は `music-2.6-free`、`music-cover`、`music-cover-free` も公開しています。OpenRouter は `google/lyria-3-clip-preview` も公開しています。

### 機能マトリクス

`music_generate`、契約テスト、共有ライブスイープで使われる明示的なモード契約:

| プロバイダー | `generate` | `edit` | 編集上限       | 共有ライブレーン                                                       |
| ---------- | :--------: | :----: | -------------- | ------------------------------------------------------------------------- |
| ComfyUI    |     ✓      |   ✓    | 1枚の画像      | 共有スイープには含まれません。`extensions/comfy/comfy.live.test.ts` でカバーされています |
| fal        |     ✓      |   —    | なし           | `generate`                                                                |
| Google     |     ✓      |   ✓    | 10枚の画像     | `generate`, `edit`                                                        |
| MiniMax    |     ✓      |   —    | なし           | `generate`                                                                |
| OpenRouter |     ✓      |   ✓    | 1枚の画像      | `generate`, `edit`                                                        |

## ツールパラメーター

<ParamField path="prompt" type="string" required>
  音楽生成プロンプト。`action: "generate"` には必須です。
</ParamField>
<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  `"status"` は現在のセッションタスクを返します。`"list"` はプロバイダーを確認します。
</ParamField>
<ParamField path="model" type="string">
  プロバイダー/モデルの上書き（例: `google/lyria-3-pro-preview`、`comfy/workflow`）。
</ParamField>
<ParamField path="lyrics" type="string">
  プロバイダーが明示的な歌詞入力に対応している場合の任意の歌詞。
</ParamField>
<ParamField path="instrumental" type="boolean">
  プロバイダーが対応している場合、インストゥルメンタルのみの出力をリクエストします。
</ParamField>
<ParamField path="image" type="string">
  単一の参照画像パスまたは URL。
</ParamField>
<ParamField path="images" type="string[]">
  複数の参照画像（対応プロバイダーでは最大10枚）。
</ParamField>
<ParamField path="durationSeconds" type="number">
  プロバイダーが長さのヒントに対応している場合の目標秒数。
</ParamField>
<ParamField path="format" type='"mp3" | "wav"'>
  プロバイダーが対応している場合の出力形式ヒント。
</ParamField>
<ParamField path="filename" type="string">出力ファイル名のヒント。</ParamField>

<Note>
すべてのプロバイダーがすべてのパラメーターに対応しているわけではありません。OpenClaw は送信前に、入力数などの厳格な上限を引き続き検証します。プロバイダーが長さに対応していても、リクエストされた値より短い最大値を使う場合、OpenClaw は最も近い対応可能な長さに丸めます。選択されたプロバイダーまたはモデルが処理できない、本当に未対応の任意ヒントは、警告付きで無視されます。ツール結果は適用済み設定を報告します。`details.normalization` は、リクエスト値から適用値へのマッピングを記録します。
</Note>

プロバイダーリクエストのタイムアウトは、オペレーター設定専用です。OpenClaw は、設定されている場合は `agents.defaults.musicGenerationModel.timeoutMs` を使い、120000ms 未満の値は 120000ms に引き上げ、それ以外の場合はプロバイダーリクエストのデフォルトを 300000ms にします。

## 非同期動作

セッションに紐づく音楽生成はバックグラウンドタスクとして実行されます。

- **バックグラウンドタスク:** `music_generate` はバックグラウンドタスクを作成し、開始済み/タスク応答を即座に返し、完成したトラックを後続のエージェントメッセージで後から投稿します。
- **重複防止:** タスクが `queued` または `running` の間、同じセッション内の後続の `music_generate` 呼び出しは、別の生成を開始する代わりにタスクステータスを返します。明示的に確認するには `action: "status"` を使います。最近完了した一致リクエストも2分間重複排除されます。
- **ステータス参照:** `openclaw tasks list` または `openclaw tasks show <taskId>` は、キュー済み、実行中、終了状態を確認します。
- **完了時の起動:** OpenClaw は内部の完了イベントを同じセッションに注入し、モデルがユーザー向けの後続メッセージを自分で書けるようにします。
- **プロンプトヒント:** 同じセッション内の後続のユーザー/手動ターンでは、音楽タスクがすでに進行中の場合に小さなランタイムヒントを受け取るため、モデルが盲目的に再度 `music_generate` を呼び出すことはありません。
- **セッションなしフォールバック:** 実際のエージェントセッションを持たない直接/ローカルコンテキストはインラインで実行され、同じターンで最終的な音声結果を返します。

### タスクライフサイクル

音楽タスクは、一般的なタスクレジストリと同じ状態を公開します（`timed_out`、`cancelled`、`lost` を含む完全な状態マシンについては [バックグラウンドタスク](/ja-JP/automation/tasks#task-lifecycle) を参照してください）。ほとんどの音楽実行は次のように遷移します。

| 状態        | 意味                                                                                           |
| ----------- | ---------------------------------------------------------------------------------------------- |
| `queued`    | タスクが作成され、プロバイダーが受け付けるのを待っています。                                   |
| `running`   | プロバイダーが処理中です（通常はプロバイダーと長さに応じて30秒から3分）。                      |
| `succeeded` | トラックの準備ができています。エージェントが起動し、会話に投稿します。                         |
| `failed`    | プロバイダーエラーまたはタイムアウトです。エージェントがエラー詳細とともに起動します。         |

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

1. ツール呼び出しの `model` パラメーター（エージェントが指定した場合）。
2. 設定の `musicGenerationModel.primary`。
3. `musicGenerationModel.fallbacks` の順序。
4. 認証済みプロバイダーのデフォルトのみを使った自動検出:
   - 現在のデフォルトテキストモデルプロバイダーが音楽生成も提供している場合は、それを最初に使用します。
   - 残りの登録済み音楽生成プロバイダーを、プロバイダー ID のアルファベット順に使用します。

プロバイダーが失敗した場合、次の候補が自動的に試されます。すべて失敗した場合、エラーには各試行の詳細が含まれます。

明示的な `model`、`primary`、`fallbacks` エントリのみを使うには、`agents.defaults.mediaGenerationAutoProviderFallback: false` を設定します。

## プロバイダーノート

<AccordionGroup>
  <Accordion title="ComfyUI">
    ワークフロー駆動で、プロンプト/出力フィールド用に構成されたグラフとノードマッピングに依存します。バンドルされた `comfy` Plugin は、音楽生成プロバイダー
    レジストリを通じて、共有の `music_generate` ツールに接続します。
  </Accordion>
  <Accordion title="fal">
    共有プロバイダー認証パスを通じて fal モデルエンドポイントを使用します。バンドルされたプロバイダーはデフォルトで `fal-ai/minimax-music/v2.6` を使用し、プロンプトから音声へのリクエスト向けに
    `fal-ai/ace-step/prompt-to-audio` と
    `fal-ai/stable-audio-25/text-to-audio` も公開します。
    歌詞とインストゥルメンタルモードは MiniMax モデル専用です。他の 2 つの
    モデルはプロンプトのみです。
  </Accordion>
  <Accordion title="Google (Lyria 3)">
    Lyria 3 バッチ生成を使用します。現在のバンドルされたフローは、
    プロンプト、任意の歌詞テキスト、任意の参照画像をサポートします。
    デフォルトの `lyria-3-clip-preview` モデルは mp3 のみを出力します。
    `lyria-3-pro-preview` モデルは wav もサポートします。
  </Accordion>
  <Accordion title="MiniMax">
    バッチ `music_generation` エンドポイントを使用します。プロンプト、任意の
    歌詞、インストゥルメンタルモード、および `minimax`
    API キー認証または `minimax-portal` OAuth 経由の mp3 出力をサポートします。`music-2.6-free`、
    `music-cover`、`music-cover-free` モデルも公開します。
  </Accordion>
  <Accordion title="OpenRouter">
    ストリーミングを有効にした OpenRouter チャット補完の音声出力を使用します。
    バンドルされたプロバイダーはデフォルトで `google/lyria-3-pro-preview` を使用し、
    `openrouter/google/lyria-3-clip-preview` も公開します。
  </Accordion>
</AccordionGroup>

## 適切なパスの選択

- **共有プロバイダー支援** は、モデル選択、プロバイダー
  フェイルオーバー、組み込みの非同期タスク/ステータスフローが必要な場合に使用します。
- **Plugin パス (ComfyUI)** は、カスタムワークフローグラフ、または
  共有のバンドルされた音楽機能に含まれないプロバイダーが必要な場合に使用します。

ComfyUI 固有の動作をデバッグしている場合は、
[ComfyUI](/ja-JP/providers/comfy) を参照してください。共有プロバイダーの
動作をデバッグしている場合は、[fal](/ja-JP/providers/fal)、[Google (Gemini)](/ja-JP/providers/google)、
[MiniMax](/ja-JP/providers/minimax)、または [OpenRouter](/ja-JP/providers/openrouter) から始めてください。

## プロバイダー機能モード

共有の音楽生成コントラクトは、明示的なモード宣言をサポートします。

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

`maxInputImages`、`supportsLyrics`、`supportsFormat` などのレガシーなフラットフィールドだけでは、編集サポートの告知には
**不十分** です。プロバイダーは `generate` と `edit` を明示的に宣言し、ライブテスト、コントラクト
テスト、および共有の `music_generate` ツールがモードサポートを
決定論的に検証できるようにする必要があります。

## ライブテスト

共有のバンドルされたプロバイダー (fal、Google、MiniMax、
OpenRouter) 向けのオプトインのライブカバレッジ:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts
```

同じテストファイルを実行する同等のリポジトリラッパー:

```bash
pnpm test:live:media:music
```

このライブファイルは、デフォルトで保存済みの認証
プロファイルよりも先に、すでにエクスポートされたプロバイダー環境変数を使用し、
プロバイダーが編集モードを有効にしている場合は `generate` と宣言済みの `edit` カバレッジの両方を実行します。現在のカバレッジ:

- `google`: `generate` と `edit`
- `fal`: `generate` のみ
- `minimax`: `generate` のみ
- `openrouter`: `generate` と `edit`
- `comfy`: 共有プロバイダーの一括テストではなく、別個の Comfy ライブカバレッジ

バンドルされた ComfyUI 音楽パス向けのオプトインのライブカバレッジ:

```bash
OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
```

Comfy ライブファイルは、該当セクションが構成されている場合、
comfy の画像および動画ワークフローもカバーします。

## 関連

- [バックグラウンドタスク](/ja-JP/automation/tasks) — 分離された `music_generate` 実行のタスク追跡
- [ComfyUI](/ja-JP/providers/comfy)
- [構成リファレンス](/ja-JP/gateway/config-agents#agent-defaults) — `musicGenerationModel` 構成
- [Google (Gemini)](/ja-JP/providers/google)
- [MiniMax](/ja-JP/providers/minimax)
- [モデル](/ja-JP/concepts/models) — モデル構成とフェイルオーバー
- [ツール概要](/ja-JP/tools)
