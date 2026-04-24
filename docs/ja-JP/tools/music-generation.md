---
read_when:
    - エージェント経由で音楽や音声を生成する場合
    - 音楽生成 provider と model を設定する場合
    - '`music_generate` tool のパラメータを理解する場合'
summary: 共有 provider を使って音楽を生成する（workflow-backed Plugin を含む）
title: 音楽生成
x-i18n:
    generated_at: "2026-04-24T05:25:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: c5fe640c6b83f6f2cf5ad8e57294da147f241706c30eee0d0eb6f7d82cbbe0d3
    source_path: tools/music-generation.md
    workflow: 15
---

`music_generate` tool を使うと、Google、
MiniMax、workflow 設定済み ComfyUI などの provider を通じた共有音楽生成機能により、
エージェントが音楽や音声を作成できます。

共有 provider-backed の agent session では、OpenClaw は音楽生成を
バックグラウンド task として開始し、task ledger で追跡し、その後トラックの準備ができると
エージェントを再度起こして、完成した音声を元の channel に投稿できるようにします。

<Note>
built-in の共有 tool は、少なくとも 1 つの音楽生成 provider が利用可能な場合にのみ表示されます。agent の tools に `music_generate` が見当たらない場合は、`agents.defaults.musicGenerationModel` を設定するか、provider の API key を設定してください。
</Note>

## クイックスタート

### 共有 provider-backed 生成

1. 少なくとも 1 つの provider の API key を設定します。たとえば `GEMINI_API_KEY` または
   `MINIMAX_API_KEY`。
2. 必要に応じて、好みの model を設定します。

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

3. エージェントに次のように依頼します: _「ネオンの街を夜に走るドライブをテーマにした、アップビートなシンセポップのトラックを生成して。」_

エージェントは自動で `music_generate` を呼び出します。tool allow-list の設定は不要です。

実際の session-backed agent run を伴わない直接的な同期コンテキストでは、built-in
tool は引き続きインライン生成にフォールバックし、最終的な media path を
tool result で返します。

プロンプト例:

```text
Generate a cinematic piano track with soft strings and no vocals.
```

```text
Generate an energetic chiptune loop about launching a rocket at sunrise.
```

### workflow 駆動の Comfy 生成

bundled の `comfy` Plugin は、音楽生成 provider registry を通じて共有 `music_generate` tool に接続します。

1. `models.providers.comfy.music` に workflow JSON と
   prompt/output node を設定します。
2. Comfy Cloud を使う場合は、`COMFY_API_KEY` または `COMFY_CLOUD_API_KEY` を設定します。
3. エージェントに音楽生成を依頼するか、tool を直接呼び出します。

例:

```text
/tool music_generate prompt="Warm ambient synth loop with soft tape texture"
```

## 共有 bundled provider サポート

| Provider | デフォルト model       | 参照入力       | サポートされる制御                                    | API key                                |
| -------- | ---------------------- | -------------- | ----------------------------------------------------- | -------------------------------------- |
| ComfyUI  | `workflow`             | 最大 1 画像    | workflow 定義の音楽または音声                         | `COMFY_API_KEY`, `COMFY_CLOUD_API_KEY` |
| Google   | `lyria-3-clip-preview` | 最大 10 画像   | `lyrics`, `instrumental`, `format`                    | `GEMINI_API_KEY`, `GOOGLE_API_KEY`     |
| MiniMax  | `music-2.5+`           | なし           | `lyrics`, `instrumental`, `durationSeconds`, `format=mp3` | `MINIMAX_API_KEY`                  |

### 宣言された機能マトリクス

これは `music_generate`、contract test、
共有 live sweep が使用する明示的な mode 契約です。

| Provider | `generate` | `edit` | edit 上限 | 共有 live lane                                                          |
| -------- | ---------- | ------ | --------- | ----------------------------------------------------------------------- |
| ComfyUI  | はい       | はい   | 1 画像    | 共有 sweep には含まれず、`extensions/comfy/comfy.live.test.ts` でカバー |
| Google   | はい       | はい   | 10 画像   | `generate`, `edit`                                                      |
| MiniMax  | はい       | いいえ | なし      | `generate`                                                              |

実行時に利用可能な共有 provider と model を確認するには、
`action: "list"` を使ってください。

```text
/tool music_generate action=list
```

アクティブな session-backed 音楽 task を確認するには、
`action: "status"` を使ってください。

```text
/tool music_generate action=status
```

直接生成の例:

```text
/tool music_generate prompt="Dreamy lo-fi hip hop with vinyl texture and gentle rain" instrumental=true
```

## built-in tool パラメータ

| パラメータ        | 型       | 説明                                                                                         |
| ----------------- | -------- | -------------------------------------------------------------------------------------------- |
| `prompt`          | string   | 音楽生成 prompt（`action: "generate"` では必須）                                             |
| `action`          | string   | `"generate"`（デフォルト）、現在の session task 用の `"status"`、または provider 確認用の `"list"` |
| `model`           | string   | provider/model override。例: `google/lyria-3-pro-preview` または `comfy/workflow`           |
| `lyrics`          | string   | provider が明示的な歌詞入力をサポートする場合の任意の歌詞                                   |
| `instrumental`    | boolean  | provider がサポートする場合、インストゥルメンタルのみの出力を要求する                       |
| `image`           | string   | 単一の参照画像 path または URL                                                               |
| `images`          | string[] | 複数の参照画像（最大 10）                                                                    |
| `durationSeconds` | number   | provider が長さヒントをサポートする場合の目標長さ（秒）                                     |
| `timeoutMs`       | number   | ミリ秒単位の任意の provider リクエスト timeout                                               |
| `format`          | string   | provider がサポートする場合の出力 format ヒント（`mp3` または `wav`）                       |
| `filename`        | string   | 出力 filename ヒント                                                                         |

すべての provider がすべてのパラメータをサポートしているわけではありません。OpenClaw は送信前に、入力数のような厳格な上限も引き続き検証します。provider が duration をサポートしていても、要求値より短い最大値しか使えない場合、OpenClaw は自動的に最も近いサポート値へ丸めます。選択した provider または model が本当にサポートしない任意ヒントは、警告付きで無視されます。

tool result は適用された設定を報告します。provider フォールバック中に OpenClaw が duration を丸めた場合、返される `durationSeconds` は送信された値を反映し、`details.normalization.durationSeconds` には要求値から適用値への対応が表示されます。

## 共有 provider-backed 経路の非同期動作

- session-backed agent run: `music_generate` はバックグラウンド task を作成し、started/task レスポンスを即座に返し、完成したトラックは後続の agent message で後から投稿します。
- 重複防止: そのバックグラウンド task が同じ session でまだ `queued` または `running` の間は、後続の `music_generate` 呼び出しは新しい生成を開始せず、task status を返します。
- status 確認: 新しい生成を始めずにアクティブな session-backed 音楽 task を確認するには `action: "status"` を使ってください。
- task 追跡: `openclaw tasks list` または `openclaw tasks show <taskId>` を使って、生成の `queued`、`running`、終端 status を確認してください。
- 完了 wake: OpenClaw は内部 completion event を同じ session に注入し、model 自身がユーザー向け follow-up を書けるようにします。
- prompt ヒント: 同じ session で後続の user/manual turn が来たとき、音楽 task がすでに進行中なら、小さな runtime ヒントが追加され、model が盲目的に `music_generate` を再度呼ばないようにします。
- no-session フォールバック: 実際の agent session がない直接/ローカルコンテキストでは、引き続きインラインで実行され、最終音声結果を同じ turn で返します。

### task ライフサイクル

各 `music_generate` リクエストは 4 つの状態を通ります。

1. **queued** -- task は作成済みで、provider が受け付けるのを待っています。
2. **running** -- provider が処理中です（通常は provider と duration に応じて 30 秒から 3 分）。
3. **succeeded** -- トラックの準備ができ、agent が起きて会話に投稿します。
4. **failed** -- provider error または timeout。agent はエラー詳細付きで再開します。

CLI から status を確認するには:

```bash
openclaw tasks list
openclaw tasks show <taskId>
openclaw tasks cancel <taskId>
```

重複防止: 現在の session ですでに音楽 task が `queued` または `running` の場合、`music_generate` は新しい task を開始せず、既存 task の status を返します。新しい生成をトリガーせず明示的に確認したい場合は `action: "status"` を使ってください。

## 設定

### model 選択

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "google/lyria-3-clip-preview",
        fallbacks: ["minimax/music-2.5+"],
      },
    },
  },
}
```

### provider 選択順序

音楽を生成するとき、OpenClaw は次の順で provider を試します。

1. agent が指定した場合は、tool call の `model` パラメータ
2. config の `musicGenerationModel.primary`
3. `musicGenerationModel.fallbacks` を順番に
4. auth-backed provider デフォルトのみを使った自動検出:
   - 現在のデフォルト provider を最初に
   - 残りの登録済み音楽生成 provider を provider-id 順で

ある provider が失敗すると、次の候補が自動的に試されます。すべて失敗した場合、
error には各試行の詳細が含まれます。

音楽生成で明示的な `model`、`primary`、`fallbacks`
エントリだけを使いたい場合は、`agents.defaults.mediaGenerationAutoProviderFallback: false` を設定してください。

## provider に関する注記

- Google は Lyria 3 の batch generation を使います。現在の bundled フローは
  prompt、任意の歌詞テキスト、任意の参照画像をサポートします。
- MiniMax は batch `music_generation` endpoint を使います。現在の bundled フローは
  prompt、任意の歌詞、instrumental mode、duration 制御、
  mp3 出力をサポートします。
- ComfyUI サポートは workflow 駆動で、設定された graph と
  prompt/output field の node mapping に依存します。

## provider 機能 mode

共有音楽生成契約は、現在、明示的な mode 宣言をサポートしています。

- prompt のみの生成用 `generate`
- 1 つ以上の参照画像を含むリクエスト時の `edit`

新しい provider 実装では、明示的な mode block を優先してください。

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

レガシーなフラット field、たとえば `maxInputImages`、`supportsLyrics`、
`supportsFormat` だけでは、edit サポートを告知するには不十分です。provider は
`generate` と `edit` を明示的に宣言し、live test、contract test、
共有 `music_generate` tool が mode サポートを決定的に検証できるようにするべきです。

## 適切な経路を選ぶ

- model 選択、provider failover、built-in の非同期 task/status フローが必要な場合は、共有 provider-backed 経路を使ってください。
- custom workflow graph や、共有 bundled 音楽機能に含まれない provider が必要な場合は、ComfyUI のような Plugin 経路を使ってください。
- ComfyUI 固有の動作をデバッグしているなら [ComfyUI](/ja-JP/providers/comfy) を参照してください。共有 provider の動作をデバッグしているなら、まず [Google (Gemini)](/ja-JP/providers/google) または [MiniMax](/ja-JP/providers/minimax) から始めてください。

## live test

共有 bundled provider 用の opt-in live カバレッジ:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts
```

repo wrapper:

```bash
pnpm test:live:media music
```

この live file は、不足している provider env var を `~/.profile` から読み込み、
デフォルトでは保存済み auth profile よりも live/env API key を優先し、
provider が edit mode を有効にしている場合は `generate` と宣言済み `edit`
の両方のカバレッジを実行します。

現在これは次を意味します:

- `google`: `generate` と `edit`
- `minimax`: `generate` のみ
- `comfy`: 共有 provider sweep ではなく、個別の Comfy live カバレッジ

bundled ComfyUI 音楽経路用の opt-in live カバレッジ:

```bash
OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
```

Comfy live file は、それらの section が設定されている場合、
comfy の画像および動画 workflow もカバーします。

## 関連

- [バックグラウンドタスク](/ja-JP/automation/tasks) - 分離された `music_generate` 実行の task 追跡
- [設定リファレンス](/ja-JP/gateway/config-agents#agent-defaults) - `musicGenerationModel` 設定
- [ComfyUI](/ja-JP/providers/comfy)
- [Google (Gemini)](/ja-JP/providers/google)
- [MiniMax](/ja-JP/providers/minimax)
- [Models](/ja-JP/concepts/models) - model 設定とフェイルオーバー
- [tools 概要](/ja-JP/tools)
