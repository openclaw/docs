---
read_when:
    - QA シナリオ定義または qa-lab ハーネスコードをリファクタリングする場合
    - Markdown シナリオと TypeScript ハーネスロジックの間で QA 挙動を移動する場合
summary: シナリオカタログとハーネス統合のための QA リファクタ計画
title: QA リファクタ＿日本assistant to=final ավարտ്
x-i18n:
    generated_at: "2026-04-24T05:18:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0d774d7b5e0fffd5c2504d9a4d6063198d77b866263ea8448474dce6246012d4
    source_path: refactor/qa.md
    workflow: 15
---

ステータス: 基盤となる移行は完了済みです。

## 目的

OpenClaw QA を、定義が分散したモデルから単一の source of truth へ移行すること:

- シナリオメタデータ
- モデルへ送る prompt
- setup と teardown
- harness ロジック
- assertion と成功基準
- artifact とレポートヒント

目指す最終状態は、TypeScript にほとんどの挙動をハードコードするのではなく、強力なシナリオ定義ファイルを読み込む汎用 QA harness です。

## 現在の状態

現在の primary source of truth は `qa/scenarios/index.md` と、
`qa/scenarios/<theme>/*.md` 配下のシナリオごとのファイルです。

実装済み:

- `qa/scenarios/index.md`
  - 正規の QA pack metadata
  - オペレーター identity
  - kickoff mission
- `qa/scenarios/<theme>/*.md`
  - シナリオごとに 1 つの markdown file
  - シナリオ metadata
  - handler binding
  - シナリオ固有の実行 config
- `extensions/qa-lab/src/scenario-catalog.ts`
  - markdown pack parser + zod validation
- `extensions/qa-lab/src/qa-agent-bootstrap.ts`
  - markdown pack からの plan rendering
- `extensions/qa-lab/src/qa-agent-workspace.ts`
  - 生成された互換 file と `QA_SCENARIOS.md` を seed
- `extensions/qa-lab/src/suite.ts`
  - markdown 定義 handler binding を通じた実行可能シナリオの選択
- QA bus protocol + UI
  - image/video/audio/file rendering 用の汎用 inline attachment

残っている分割サーフェス:

- `extensions/qa-lab/src/suite.ts`
  - 実行可能な custom handler ロジックの大半をまだ所有している
- `extensions/qa-lab/src/report.ts`
  - まだレポート構造を runtime 出力から導出している

したがって、source-of-truth の分割は修正されましたが、実行はまだほとんどが完全に宣言的ではなく handler ベースです。

## 実際のシナリオサーフェスはどう見えるか

現在の suite を読むと、いくつかの異なるシナリオクラスがあります。

### 単純な対話

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

### ファイルシステムと repo assertion

- source/docs discovery report
- build Lobster Invaders
- generated image artifact lookup

### メモリオーケストレーション

- memory recall
- channel context における memory tools
- memory failure fallback
- session memory ranking
- thread memory isolation
- memory dreaming sweep

### ツールと Plugin 統合

- MCP plugin-tools call
- skill visibility
- skill hot install
- native image generation
- image roundtrip
- attachment からの image understanding

### 複数ターンと複数アクター

- subagent handoff
- subagent fanout synthesis
- restart recovery style flow

これらのカテゴリは、DSL 要件を決めるので重要です。prompt + 期待テキストのフラットな一覧だけでは不十分です。

## 方向性

### 単一の source of truth

著者が書く source of truth として `qa/scenarios/index.md` と
`qa/scenarios/<theme>/*.md` を使います。

Pack は次を保つべきです:

- レビュー時に人間が読みやすい
- 機械で parse 可能
- 次を駆動できるだけの十分な情報量を持つ:
  - suite 実行
  - QA workspace bootstrap
  - QA Lab UI metadata
  - docs/discovery prompt
  - レポート生成

### 推奨する記述形式

トップレベル形式には markdown を使い、その中で構造化 YAML を使います。

推奨形状:

- YAML frontmatter
  - id
  - title
  - surface
  - tags
  - docs refs
  - code refs
  - model/provider override
  - prerequisite
- prose section
  - objective
  - note
  - debugging hint
- fenced YAML block
  - setup
  - steps
  - assertions
  - cleanup

これにより次が得られます:

- 巨大 JSON よりも良い PR 可読性
- pure YAML より豊かなコンテキスト
- 厳格な parse と zod validation

生 JSON は、中間生成形式としてのみ許容されます。

## 提案するシナリオファイル形状

例:

````md
---
id: image-generation-roundtrip
title: Image generation roundtrip
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

Verify generated media is reattached on the follow-up turn.

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
    Image generation check: generate a QA lighthouse image and summarize it in one short sentence.
- action: artifact.capture
  kind: generated-image
  promptSnippet: Image generation check
  saveAs: lighthouseImage
- action: agent.send
  session: agent:qa:image-roundtrip
  message: |
    Roundtrip image inspection check: describe the generated lighthouse attachment in one short sentence.
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

## DSL がカバーすべき runner 機能

現在の suite に基づくと、汎用 runner には prompt 実行以上のものが必要です。

### 環境と setup アクション

- `bus.reset`
- `gateway.waitHealthy`
- `channel.waitReady`
- `session.create`
- `thread.create`
- `workspace.writeSkill`

### エージェントターンアクション

- `agent.send`
- `agent.wait`
- `bus.injectInbound`
- `bus.injectOutbound`

### Config とランタイムアクション

- `config.get`
- `config.patch`
- `config.apply`
- `gateway.restart`
- `tools.effective`
- `skills.status`

### ファイルと artifact アクション

- `file.write`
- `file.read`
- `file.delete`
- `file.touchTime`
- `artifact.captureGeneratedImage`
- `artifact.capturePath`

### メモリと Cron アクション

- `memory.indexForce`
- `memory.searchCli`
- `doctor.memory.status`
- `cron.list`
- `cron.run`
- `cron.waitCompletion`
- `sessionTranscript.write`

### MCP アクション

- `mcp.callTool`

### Assertion

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

DSL は、保存した出力と後続参照をサポートする必要があります。

現在の suite にある例:

- thread を作成して、その後 `threadId` を再利用する
- session を作成して、その後 `sessionKey` を再利用する
- image を生成し、次のターンでそのファイルを添付する
- wake marker 文字列を生成し、それが後で現れることを検証する

必要な機能:

- `saveAs`
- `${vars.name}`
- `${artifacts.name}`
- path、session key、thread id、marker、tool output 向けの型付き参照

変数サポートがなければ、harness は引き続きシナリオロジックを TypeScript 側へ漏らし続けます。

## エスケープハッチとして残すべきもの

完全に純粋な宣言的 runner は、phase 1 では現実的ではありません。

一部のシナリオは本質的にオーケストレーションが重いです:

- memory dreaming sweep
- config apply restart wake-up
- config restart capability flip
- generated image artifact resolution by timestamp/path
- discovery-report evaluation

これらは、当面は明示的 custom handler を使うべきです。

推奨ルール:

- 85-90% は宣言的
- 難しい残りには明示的な `customHandler` step
- custom handler は名前付きで文書化されたものだけ
- シナリオファイル内に匿名インラインコードは置かない

こうすることで、汎用 engine をきれいに保ちつつ、前進も可能になります。

## アーキテクチャ変更

### 現在

シナリオ markdown はすでに、次に対する source of truth です:

- suite 実行
- workspace bootstrap file
- QA Lab UI シナリオカタログ
- report metadata
- discovery prompt

生成される互換物:

- seed された workspace には引き続き `QA_KICKOFF_TASK.md` が含まれる
- seed された workspace には引き続き `QA_SCENARIO_PLAN.md` が含まれる
- seed された workspace には現在 `QA_SCENARIOS.md` も含まれる

## リファクタ計画

### Phase 1: loader と schema

完了。

- `qa/scenarios/index.md` を追加
- シナリオを `qa/scenarios/<theme>/*.md` に分割
- 名前付き markdown YAML pack content 用 parser を追加
- zod で検証
- consumer を parse 済み pack に切り替え
- repo レベルの `qa/seed-scenarios.json` と `qa/QA_KICKOFF_TASK.md` を削除

### Phase 2: generic engine

- `extensions/qa-lab/src/suite.ts` を次に分割:
  - loader
  - engine
  - action registry
  - assertion registry
  - custom handler
- 既存 helper function は engine operation として保持

成果物:

- engine が単純な宣言的シナリオを実行する

まず、ほぼ prompt + wait + assert で構成されるシナリオから始める:

- threaded follow-up
- image understanding from attachment
- skill visibility and invocation
- channel baseline

成果物:

- 最初の実際の markdown 定義シナリオが generic engine 経由で出荷される

### Phase 4: 中規模シナリオを移行

- image generation roundtrip
- memory tools in channel context
- session memory ranking
- subagent handoff
- subagent fanout synthesis

成果物:

- 変数、artifact、tool assertion、request-log assertion が実証される

### Phase 5: 難しいシナリオは custom handler のままにする

- memory dreaming sweep
- config apply restart wake-up
- config restart capability flip
- runtime inventory drift

成果物:

- 同じ記述形式だが、必要な箇所では明示的な custom-step block を使う

### Phase 6: ハードコードされたシナリオ map を削除

pack coverage が十分になったら:

- `extensions/qa-lab/src/suite.ts` から、シナリオ固有の TypeScript 分岐の大半を削除する

## Fake Slack / Rich Media サポート

現在の QA bus は text-first です。

関連ファイル:

- `extensions/qa-channel/src/protocol.ts`
- `extensions/qa-lab/src/bus-state.ts`
- `extensions/qa-lab/src/bus-queries.ts`
- `extensions/qa-lab/src/bus-server.ts`
- `extensions/qa-lab/web/src/ui-render.ts`

現在 QA bus がサポートするもの:

- text
- reaction
- thread

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

その後、次に `attachments?: QaBusAttachment[]` を追加します:

- `QaBusMessage`
- `QaBusInboundMessageInput`
- `QaBusOutboundMessageInput`

### なぜまず汎用なのか

Slack 専用 media モデルを作らないでください。

代わりに:

- 1 つの汎用 QA transport モデル
- その上に複数のレンダラー
  - 現在の QA Lab chat
  - 将来の fake Slack web
  - その他の fake transport view

これによりロジックの重複を防ぎ、media シナリオを transport 非依存に保てます。

### 必要な UI 作業

QA UI を更新して次をレンダリングします:

- inline image preview
- inline audio player
- inline video player
- file attachment chip

現在の UI はすでに thread と reaction をレンダリングできるため、attachment rendering は同じ message card モデルの上に重ねられるはずです。

### media transport によって有効になるシナリオ作業

attachment が QA bus を流れるようになれば、より豊かな fake-chat シナリオを追加できます:

- fake Slack での inline image reply
- audio attachment understanding
- video attachment understanding
- mixed attachment ordering
- media を保持した thread reply

## 推奨

次に実装すべきまとまりは次です:

1. markdown scenario loader + zod schema を追加する
2. markdown から現在の catalog を生成する
3. まず少数の単純なシナリオを移行する
4. 汎用 QA bus attachment サポートを追加する
5. QA UI で inline image をレンダリングする
6. その後、audio と video に拡張する

これは、次の 2 つの目標を証明する最小経路です:

- 汎用 markdown 定義 QA
- より豊かな fake messaging surface

## 未解決の質問

- シナリオファイルで、変数補間付きの埋め込み markdown prompt template を許可すべきかどうか
- setup/cleanup を名前付き section にすべきか、それとも単なる順序付き action list にすべきか
- artifact 参照を schema 上で強く型付けすべきか、それとも文字列ベースにすべきか
- custom handler を 1 つの registry に置くべきか、それとも surface ごとの registry にすべきか
- 生成される JSON 互換 file を、移行期間中は引き続きチェックインしておくべきかどうか

## 関連

- [QA E2E automation](/ja-JP/concepts/qa-e2e-automation)
