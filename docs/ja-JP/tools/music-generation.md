---
read_when:
    - エージェント経由で音楽や音声を生成する
    - 音楽生成プロバイダーとモデルの設定
    - '`music_generate`ツールのパラメーターを理解する'
sidebarTitle: Music generation
summary: Google Lyria、MiniMax、ComfyUIワークフロー全体で`music_generate`を使って音楽を生成する
title: 音楽生成
x-i18n:
  refreshed_at: '2026-04-28T05:23:26Z'
  generated_at: "2026-04-26T11:42:11Z"
  model: gpt-5.4
  provider: openai
  source_hash: 4eda549dbb93cbfe15e04462e08b7c86ff0718160244e3e5de3b041c62ee81ea
  source_path: tools/music-generation.md
  workflow: 15
---

`music_generate`ツールを使うと、設定済みプロバイダーを通じて共有音楽生成capabilityで音楽や音声を作成できます。現在はGoogle、MiniMax、ワークフロー設定済みのComfyUIに対応しています。

セッションを伴うエージェント実行では、OpenClawは音楽生成をバックグラウンドタスクとして開始し、タスク台帳で追跡し、その後トラックの準備ができるとエージェントを再び起こして、完成した音声を元のチャンネルに投稿できるようにします。

<Note>
組み込みの共有ツールは、少なくとも1つの音楽生成プロバイダーが利用可能な場合にのみ表示されます。エージェントのツール内に`music_generate`が見当たらない場合は、`agents.defaults.musicGenerationModel`を設定するか、プロバイダーのAPIキーを設定してください。
</Note>

## クイックスタート

<Tabs>
  <Tab title="共有プロバイダーバックエンド">
    <Steps>
      <Step title="認証を設定する">
        少なくとも1つのプロバイダーにAPIキーを設定します。たとえば
        `GEMINI_API_KEY`または`MINIMAX_API_KEY`です。
      </Step>
      <Step title="デフォルトモデルを選ぶ（任意）">
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
        _「ネオンの街を夜にドライブすることをテーマに、アップビートなシンセポップのトラックを生成して。」_

        エージェントは自動的に`music_generate`を呼び出します。ツールの許可リスト設定は不要です。
      </Step>
    </Steps>

    セッションを伴うエージェント実行のない直接的な同期コンテキストでは、
    組み込みツールは引き続きインライン生成にフォールバックし、
    ツール結果内に最終メディアパスを返します。

  </Tab>
  <Tab title="ComfyUIワークフロー">
    <Steps>
      <Step title="ワークフローを設定する">
        `plugins.entries.comfy.config.music`にワークフロー
        JSONとprompt/outputノードを設定します。
      </Step>
      <Step title="Cloud認証（任意）">
        Comfy Cloudでは、`COMFY_API_KEY`または`COMFY_CLOUD_API_KEY`を設定します。
      </Step>
      <Step title="ツールを呼び出す">
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

## サポートされるプロバイダー

| プロバイダー | デフォルトモデル | Reference入力 | サポートされる制御 | 認証 |
| -------- | ---------------------- | ---------------- | --------------------------------------------------------- | -------------------------------------- |
| ComfyUI  | `workflow`             | 最大1画像    | ワークフロー定義の音楽または音声                           | `COMFY_API_KEY`, `COMFY_CLOUD_API_KEY` |
| Google   | `lyria-3-clip-preview` | 最大10画像  | `lyrics`, `instrumental`, `format`                        | `GEMINI_API_KEY`, `GOOGLE_API_KEY`     |
| MiniMax  | `music-2.6`            | なし             | `lyrics`, `instrumental`, `durationSeconds`, `format=mp3` | `MINIMAX_API_KEY`またはMiniMax OAuth     |

### capabilityマトリクス

`music_generate`、contract test、および共有live sweepで使われる明示的なモード契約:

| プロバイダー | `generate` | `edit` | 編集上限 | 共有liveレーン |
| -------- | :--------: | :----: | ---------- | ------------------------------------------------------------------------- |
| ComfyUI  |     ✓      |   ✓    | 1画像    | 共有sweepには含まれず、`extensions/comfy/comfy.live.test.ts`でカバー |
| Google   |     ✓      |   ✓    | 10画像  | `generate`, `edit`                                                        |
| MiniMax  |     ✓      |   —    | なし       | `generate`                                                                |

ランタイムで利用可能な共有プロバイダーとモデルを確認するには、`action: "list"`を使います。

```text
/tool music_generate action=list
```

アクティブなセッションバックエンド音楽タスクを確認するには、`action: "status"`を使います。

```text
/tool music_generate action=status
```

直接生成の例:

```text
/tool music_generate prompt="Dreamy lo-fi hip hop with vinyl texture and gentle rain" instrumental=true
```

## ツールパラメーター

<ParamField path="prompt" type="string" required>
  音楽生成プロンプト。`action: "generate"`では必須です。
</ParamField>
<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  `"status"`は現在のセッションタスクを返し、`"list"`はプロバイダーを確認します。
</ParamField>
<ParamField path="model" type="string">
  プロバイダー/モデル上書き（例: `google/lyria-3-pro-preview`、
  `comfy/workflow`）。
</ParamField>
<ParamField path="lyrics" type="string">
  プロバイダーが明示的な歌詞入力をサポートしている場合の任意の歌詞。
</ParamField>
<ParamField path="instrumental" type="boolean">
  プロバイダーがサポートしている場合、インストゥルメンタルのみの出力を要求します。
</ParamField>
<ParamField path="image" type="string">
  単一のreference画像パスまたはURL。
</ParamField>
<ParamField path="images" type="string[]">
  複数のreference画像（対応プロバイダーでは最大10枚）。
</ParamField>
<ParamField path="durationSeconds" type="number">
  プロバイダーがdurationヒントをサポートしている場合の、目標秒数。
</ParamField>
<ParamField path="format" type='"mp3" | "wav"'>
  プロバイダーがサポートしている場合の、出力形式ヒント。
</ParamField>
<ParamField path="filename" type="string">出力ファイル名ヒント。</ParamField>
<ParamField path="timeoutMs" type="number">任意のプロバイダーリクエストタイムアウト（ミリ秒）。</ParamField>

<Note>
すべてのプロバイダーがすべてのパラメーターをサポートしているわけではありません。それでもOpenClawは、送信前に入力数などの厳格な上限を検証します。プロバイダーがdurationをサポートしていても、要求値より短い最大値しか使えない場合、OpenClawは最も近い対応durationにクランプします。本当に未対応の任意ヒントは、選択されたプロバイダーまたはモデルがそれを満たせない場合、警告付きで無視されます。ツール結果は適用された設定を報告し、`details.normalization`は要求値から適用値へのマッピングを記録します。
</Note>

## 非同期動作

セッションバックエンド音楽生成はバックグラウンドタスクとして実行されます。

- **バックグラウンドタスク:** `music_generate`はバックグラウンドタスクを作成し、即座にstarted/taskレスポンスを返し、完成したトラックは後からフォローアップのエージェントメッセージで投稿されます。
- **重複防止:** 同じセッション内でタスクが`queued`または`running`の間は、後続の`music_generate`呼び出しは別の生成を開始せず、代わりにタスクステータスを返します。明示的に確認するには`action: "status"`を使ってください。
- **ステータス確認:** `openclaw tasks list`または`openclaw tasks show <taskId>`で、queued、running、終端状態を確認できます。
- **完了時の再起動:** OpenClawは、同じセッションに内部完了イベントを注入し、モデルがユーザー向けフォローアップを自分で書けるようにします。
- **プロンプトヒント:** 同じセッション内で後から行われるユーザー/手動ターンには、音楽タスクがすでに進行中であることを示す小さなランタイムヒントが付くため、モデルがやみくもに再び`music_generate`を呼ぶことがありません。
- **セッションなしフォールバック:** 実際のエージェントセッションがない直接/ローカルコンテキストでは、インライン実行され、同じターン内で最終音声結果を返します。

### タスクライフサイクル

| 状態 | 意味 |
| ----------- | ---------------------------------------------------------------------------------------------- |
| `queued` | タスクは作成済みで、プロバイダーが受け付けるのを待っています。 |
| `running` | プロバイダーが処理中です（通常はプロバイダーとdurationに応じて30秒〜3分）。 |
| `succeeded` | トラックの準備ができ、エージェントが起きて会話に投稿します。 |
| `failed` | プロバイダーエラーまたはタイムアウト。エージェントはエラー詳細付きで起きます。 |

CLIからステータスを確認します。

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

### プロバイダー選択順序

OpenClawは、次の順序でプロバイダーを試します。

1. ツール呼び出しの`model`パラメーター（エージェントが指定した場合）。
2. configの`musicGenerationModel.primary`。
3. 順番どおりの`musicGenerationModel.fallbacks`。
4. 認証バックエンドのプロバイダーデフォルトのみを使った自動検出:
   - 現在のデフォルトプロバイダーを最初に。
   - 残りの登録済み音楽生成プロバイダーをprovider-id順に。

プロバイダーが失敗した場合、次の候補が自動的に試されます。すべて失敗した場合、エラーには各試行の詳細が含まれます。

明示的な`model`、`primary`、`fallbacks`エントリーだけを使うには、`agents.defaults.mediaGenerationAutoProviderFallback: false`を設定してください。

## プロバイダーに関する注意

<AccordionGroup>
  <Accordion title="ComfyUI">
    ワークフロー駆動であり、設定されたグラフと、prompt/outputフィールド用のノードマッピングに依存します。バンドル済みの`comfy` Pluginは、音楽生成プロバイダーレジストリーを通じて、共有`music_generate`ツールに接続します。
  </Accordion>
  <Accordion title="Google（Lyria 3）">
    Lyria 3のバッチ生成を使用します。現在のバンドル済みフローは、prompt、任意のlyricsテキスト、および任意のreference画像をサポートします。
  </Accordion>
  <Accordion title="MiniMax">
    バッチ`music_generation`エンドポイントを使用します。`minimax` APIキー認証または`minimax-portal` OAuthを通じて、prompt、任意のlyrics、インストゥルメンタルモード、duration調整、mp3出力をサポートします。
  </Accordion>
</AccordionGroup>

## 適切な経路を選ぶ

- **共有プロバイダーバックエンド**: モデル選択、プロバイダーフェイルオーバー、および組み込みの非同期タスク/ステータスフローが必要な場合。
- **Plugin経路（ComfyUI）**: カスタムワークフローグラフや、共有バンドル済み音楽capabilityに含まれないプロバイダーが必要な場合。

ComfyUI固有の挙動をデバッグしている場合は
[ComfyUI](/ja-JP/providers/comfy)を参照してください。共有プロバイダーの
挙動をデバッグしている場合は、まず[Google (Gemini)](/ja-JP/providers/google)または
[MiniMax](/ja-JP/providers/minimax)から始めてください。

## プロバイダーcapabilityモード

共有音楽生成契約は、明示的なモード宣言をサポートしています。

- プロンプトのみの生成用の`generate`。
- リクエストに1枚以上のreference画像が含まれる場合の`edit`。

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

従来の`maxInputImages`、`supportsLyrics`、`supportsFormat`のような
フラットフィールドだけでは、編集対応を示すには**不十分**です。プロバイダーは`generate`と`edit`を明示的に宣言し、live test、contract test、および共有`music_generate`ツールがモード対応を決定論的に検証できるようにする必要があります。

## live test

共有バンドル済みプロバイダー向けのオプトインliveカバレッジ:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts
```

リポジトリーラッパー:

```bash
pnpm test:live:media music
```

このliveファイルは、`~/.profile`から不足しているプロバイダーenv varsを読み込み、デフォルトで保存済みauth profileよりlive/env APIキーを優先し、プロバイダーがeditモードを有効にしている場合は`generate`と宣言済み`edit`の両方を実行します。現在のカバレッジ:

- `google`: `generate`と`edit`
- `minimax`: `generate`のみ
- `comfy`: 共有プロバイダーsweepではなく、個別のComfy liveカバレッジ

バンドル済みComfyUI音楽経路向けのオプトインliveカバレッジ:

```bash
OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
```

Comfy liveファイルは、それらのセクションが設定されている場合、comfy画像および動画ワークフローもカバーします。

## 関連

- [バックグラウンドタスク](/ja-JP/automation/tasks) — 分離された`music_generate`実行のタスク追跡
- [ComfyUI](/ja-JP/providers/comfy)
- [Configuration reference](/ja-JP/gateway/config-agents#agent-defaults) — `musicGenerationModel` config
- [Google (Gemini)](/ja-JP/providers/google)
- [MiniMax](/ja-JP/providers/minimax)
- [Models](/ja-JP/concepts/models) — モデル設定とフェイルオーバー
- [ツール概要](/ja-JP/tools)
