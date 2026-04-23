---
read_when:
    - QA シナリオ定義または qa-lab ハーネスコードをリファクタリングする場合
    - QA の動作を markdown シナリオと TypeScript ハーネスロジックの間で移動する場合
summary: シナリオカタログとハーネス統合のための QA リファクタリング計画
title: QA リファクタリング
x-i18n:
    generated_at: "2026-04-23T14:09:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 16867d5be372ab414aa516144193144414c326ea53a52627f3ff91f85b8fdf9d
    source_path: refactor/qa.md
    workflow: 15
---

# QA リファクタリング

ステータス: 基盤となる移行は完了しました。

## 目標

OpenClaw QA を分割定義モデルから単一の信頼できる情報源へ移行します:

- シナリオ metadata
- model に送る prompt
- セットアップと teardown
- ハーネスロジック
- アサーションと成功条件
- artifacts とレポート用ヒント

望ましい最終状態は、ほとんどの動作を TypeScript にハードコードするのではなく、
強力なシナリオ定義ファイルを読み込む汎用 QA ハーネスです。

## 現在の状態

現在の主要な信頼できる情報源は、`qa/scenarios/index.md` と、
`qa/scenarios/<theme>/*.md` 配下のシナリオごとのファイルです。

実装済み:

- `qa/scenarios/index.md`
  - 正式な QA pack metadata
  - operator identity
  - kickoff mission
- `qa/scenarios/<theme>/*.md`
  - シナリオごとに 1 つの markdown ファイル
  - シナリオ metadata
  - handler binding
  - シナリオ固有の実行設定
- `extensions/qa-lab/src/scenario-catalog.ts`
  - markdown pack parser + zod validation
- `extensions/qa-lab/src/qa-agent-bootstrap.ts`
  - markdown pack からの plan rendering
- `extensions/qa-lab/src/qa-agent-workspace.ts`
  - 生成された互換ファイルと `QA_SCENARIOS.md` の seed
- `extensions/qa-lab/src/suite.ts`
  - markdown 定義された handler binding を通じた実行可能シナリオの選択
- QA bus protocol + UI
  - image/video/audio/file rendering 用の汎用 inline attachment

残っている分割サーフェス:

- `extensions/qa-lab/src/suite.ts`
  - 依然として実行可能なカスタム handler ロジックの大半を所有している
- `extensions/qa-lab/src/report.ts`
  - 依然としてランタイム出力からレポート構造を導出している

つまり、信頼できる情報源の分割自体は修正されましたが、実行は依然として完全宣言的ではなく、
主に handler ベースです。

## 実際のシナリオサーフェスはどうなっているか

現在の suite を読むと、いくつかの異なるシナリオクラスがあります。

### 単純なインタラクション

- channel baseline
- DM baseline
- threaded follow-up
- model switch
- approval followthrough
- reaction/edit/delete

### Config とランタイム変更

- config patch skill disable
- config apply restart wake-up
- config restart capability flip
- runtime inventory drift check

### ファイルシステムと repo アサーション

- source/docs discovery report
- build Lobster Invaders
- generated image artifact lookup

### memory オーケストレーション

- memory recall
- memory tools in channel context
- memory failure fallback
- session memory ranking
- thread memory isolation
- memory Dreaming sweep

### tool と plugin 統合

- MCP plugin-tools call
- skill visibility
- skill hot install
- native image generation
- image roundtrip
- image understanding from attachment

### 複数 turn と複数 actor

- subagent handoff
- subagent fanout synthesis
- restart recovery style flows

これらのカテゴリは DSL 要件を決めるため重要です。単なる prompt + 期待テキストの
平坦な一覧では不十分です。

## 方向性

### 単一の信頼できる情報源

著者が編集する信頼できる情報源として、
`qa/scenarios/index.md` と `qa/scenarios/<theme>/*.md` を使用します。

pack は次を満たすべきです:

- レビュー時に人が読めること
- 機械が解析できること
- 次を駆動するのに十分豊かであること:
  - suite 実行
  - QA workspace bootstrap
  - QA Lab UI metadata
  - docs/discovery prompts
  - report 生成

### 推奨される記述形式

トップレベル形式として markdown を使い、その中に構造化された YAML を入れます。

推奨形状:

- YAML frontmatter
  - id
  - title
  - surface
  - tags
  - docs refs
  - code refs
  - model/provider overrides
  - prerequisites
- prose sections
  - objective
  - notes
  - debugging hints
- fenced YAML blocks
  - setup
  - steps
  - assertions
  - cleanup

これにより次が得られます:

- 巨大な JSON より PR の可読性が高い
- 純粋な YAML より豊かなコンテキスト
- 厳密な parsing と zod validation

生の JSON は、中間生成形式としてのみ許容されます。

## 提案するシナリオファイル形状

例:

````md
---
id: image-generation-roundtrip
title: 画像生成ラウンドトリップ
surface: image
tags: [media, image, roundtrip]
models:
  primary: openai/gpt-5.4
requires:
  tools: [image_generate]
  plugins: [openai, qa-channel]
docsRefs:
  - docs/help/testing.md
  - docs/concepts/model-providers.md
codeRefs:
  - extensions/qa-lab/src/suite.ts
  - src/gateway/chat-attachments.ts
---

# Objective

生成されたメディアが follow-up turn で再添付されることを検証する。

# Setup

```yaml scenario.setup
- action: config.patch
  patch:
    agents:
      defaults:
        imageGenerationModel:
          primary: openai/gpt-image-1
- action: session.create
  key: agent:qa:image-roundtrip
```

# Steps

```yaml scenario.steps
- action: agent.send
  session: agent:qa:image-roundtrip
  message: |
    画像生成チェック: QA lighthouse 画像を生成し、それを短い 1 文で要約してください。
- action: artifact.capture
  kind: generated-image
  promptSnippet: Image generation check
  saveAs: lighthouseImage
- action: agent.send
  session: agent:qa:image-roundtrip
  message: |
    ラウンドトリップ画像検査チェック: 生成された lighthouse 添付を短い 1 文で説明してください。
  attachments:
    - fromArtifact: lighthouseImage
```

# Expect

```yaml scenario.expect
- assert: outbound.textIncludes
  value: lighthouse
- assert: requestLog.matches
  where:
    promptIncludes: Roundtrip image inspection check
  imageInputCountGte: 1
- assert: artifact.exists
  ref: lighthouseImage
```
````

## DSL がカバーすべき runner capabilities

現在の suite に基づくと、汎用 runner には prompt 実行以上の機能が必要です。

### 環境とセットアップのアクション

- `bus.reset`
- `gateway.waitHealthy`
- `channel.waitReady`
- `session.create`
- `thread.create`
- `workspace.writeSkill`

### agent turn アクション

- `agent.send`
- `agent.wait`
- `bus.injectInbound`
- `bus.injectOutbound`

### Config とランタイムのアクション

- `config.get`
- `config.patch`
- `config.apply`
- `gateway.restart`
- `tools.effective`
- `skills.status`

### ファイルと artifact のアクション

- `file.write`
- `file.read`
- `file.delete`
- `file.touchTime`
- `artifact.captureGeneratedImage`
- `artifact.capturePath`

### memory と Cron のアクション

- `memory.indexForce`
- `memory.searchCli`
- `doctor.memory.status`
- `cron.list`
- `cron.run`
- `cron.waitCompletion`
- `sessionTranscript.write`

### MCP アクション

- `mcp.callTool`

### アサーション

- `outbound.textIncludes`
- `outbound.inThread`
- `outbound.notInRoot`
- `tool.called`
- `tool.notPresent`
- `skill.visible`
- `skill.disabled`
- `file.contains`
- `memory.contains`
- `requestLog.matches`
- `sessionStore.matches`
- `cron.managedPresent`
- `artifact.exists`

## 変数と artifact 参照

DSL は、保存された出力とその後の参照をサポートする必要があります。

現在の suite の例:

- thread を作成して、その後 `threadId` を再利用する
- session を作成して、その後 `sessionKey` を再利用する
- 画像を生成して、次の turn でその file を添付する
- wake marker 文字列を生成して、それが後で現れることをアサートする

必要な capability:

- `saveAs`
- `${vars.name}`
- `${artifacts.name}`
- path、session key、thread id、marker、tool output の型付き参照

変数サポートがなければ、ハーネスはシナリオロジックを TypeScript 側へ漏らし続けることになります。

## どこをエスケープハッチとして残すべきか

フェーズ 1 で完全に純粋な宣言型 runner を目指すのは現実的ではありません。

一部のシナリオは本質的にオーケストレーション負荷が高いです:

- memory Dreaming sweep
- config apply restart wake-up
- config restart capability flip
- timestamp/path による generated image artifact 解決
- discovery-report evaluation

これらは当面、明示的な custom handler を使うべきです。

推奨ルール:

- 85〜90% は宣言的
- 残りの難しい部分には明示的な `customHandler` step
- custom handler は名前付きかつ文書化されていること
- シナリオファイル内に匿名のインラインコードを置かないこと

これにより、進捗を維持しながら汎用 engine をクリーンに保てます。

## アーキテクチャ変更

### 現在

シナリオ markdown はすでに次の信頼できる情報源です:

- suite 実行
- workspace bootstrap ファイル
- QA Lab UI シナリオカタログ
- report metadata
- discovery prompts

生成される互換ファイル:

- seed された workspace は依然として `QA_KICKOFF_TASK.md` を含む
- seed された workspace は依然として `QA_SCENARIO_PLAN.md` を含む
- seed された workspace は現在 `QA_SCENARIOS.md` も含む

## リファクタリング計画

### フェーズ 1: loader と schema

完了。

- `qa/scenarios/index.md` を追加
- シナリオを `qa/scenarios/<theme>/*.md` に分割
- 名前付き markdown YAML pack content 用 parser を追加
- zod で検証
- consumer を解析済み pack に切り替え
- repo レベルの `qa/seed-scenarios.json` と `qa/QA_KICKOFF_TASK.md` を削除

### フェーズ 2: 汎用 engine

- `extensions/qa-lab/src/suite.ts` を次に分割:
  - loader
  - engine
  - action registry
  - assertion registry
  - custom handlers
- 既存 helper function は engine operation として維持

成果物:

- engine が単純な宣言型シナリオを実行する

まずは、ほぼ prompt + wait + assert で構成されるシナリオから始める:

- threaded follow-up
- image understanding from attachment
- skill visibility and invocation
- channel baseline

成果物:

- 汎用 engine 経由で配信される、最初の本物の markdown 定義シナリオ

### フェーズ 4: 中程度のシナリオを移行

- image generation roundtrip
- memory tools in channel context
- session memory ranking
- subagent handoff
- subagent fanout synthesis

成果物:

- 変数、artifacts、tool assertions、request-log assertions が実証される

### フェーズ 5: 難しいシナリオは custom handler のまま維持

- memory Dreaming sweep
- config apply restart wake-up
- config restart capability flip
- runtime inventory drift

成果物:

- 同じ記述形式を使いながら、必要な箇所に明示的な custom-step block を使う

### フェーズ 6: ハードコードされたシナリオ map を削除

pack coverage が十分になったら:

- `extensions/qa-lab/src/suite.ts` から、シナリオ固有の TypeScript 分岐の大半を削除

## Fake Slack / リッチメディアサポート

現在の QA bus は text-first です。

関連ファイル:

- `extensions/qa-channel/src/protocol.ts`
- `extensions/qa-lab/src/bus-state.ts`
- `extensions/qa-lab/src/bus-queries.ts`
- `extensions/qa-lab/src/bus-server.ts`
- `extensions/qa-lab/web/src/ui-render.ts`

現在 QA bus がサポートしているもの:

- text
- reactions
- threads

まだ inline media attachment はモデル化していません。

### 必要な transport 契約

汎用 QA bus attachment モデルを追加します:

```ts
type QaBusAttachment = {
  id: string;
  kind: "image" | "video" | "audio" | "file";
  mimeType: string;
  fileName?: string;
  inline?: boolean;
  url?: string;
  contentBase64?: string;
  width?: number;
  height?: number;
  durationMs?: number;
  altText?: string;
  transcript?: string;
};
```

そのうえで `attachments?: QaBusAttachment[]` を次に追加します:

- `QaBusMessage`
- `QaBusInboundMessageInput`
- `QaBusOutboundMessageInput`

### なぜ最初に汎用化するのか

Slack 専用のメディアモデルを作ってはいけません。

代わりに次の構成にします:

- 1 つの汎用 QA transport モデル
- その上に複数の renderer
  - 現在の QA Lab chat
  - 将来の fake Slack web
  - その他の fake transport view

これによりロジックの重複を防ぎ、メディアシナリオを transport 非依存に保てます。

### 必要な UI 作業

QA UI を更新して次をレンダリングします:

- inline image preview
- inline audio player
- inline video player
- file attachment chip

現在の UI はすでに threads と reactions をレンダリングできるため、
attachment rendering は同じ message card モデルに重ねられるはずです。

### メディア transport で可能になるシナリオ作業

attachment が QA bus を流れるようになれば、より豊かな fake-chat シナリオを追加できます:

- fake Slack での inline image reply
- audio attachment understanding
- video attachment understanding
- mixed attachment ordering
- media を保持した thread reply

## 推奨

次の実装単位は以下にするべきです:

1. markdown シナリオ loader + zod schema を追加
2. markdown から現在のカタログを生成
3. まず簡単なシナリオをいくつか移行
4. 汎用 QA bus attachment サポートを追加
5. QA UI で inline image をレンダリング
6. その後、audio と video へ拡張

これは、次の 2 つの目標を実証する最小経路です:

- 汎用の markdown 定義 QA
- より豊かな fake messaging surface

## 未解決の質問

- シナリオファイルで、変数補間付きの埋め込み markdown prompt template を許可するべきか
- setup/cleanup は名前付きセクションにするべきか、それとも順序付きアクション一覧だけにするべきか
- artifact 参照は schema 上で強い型付けにするべきか、それとも文字列ベースにするべきか
- custom handler は 1 つの registry に置くべきか、それとも surface ごとの registry にするべきか
- 生成される JSON 互換ファイルは、移行中も引き続きチェックインしたままにするべきか
