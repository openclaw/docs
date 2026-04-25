---
read_when:
    - transcript 形状に起因するプロバイダー request 拒否をデバッグしている
    - transcript のサニタイズまたはツール呼び出し修復ロジックを変更している
    - プロバイダー間での tool-call ID の不一致を調査している
summary: 'リファレンス: プロバイダー固有の transcript サニタイズおよび修復ルール'
title: Transcript の衛生管理
x-i18n:
    generated_at: "2026-04-25T18:21:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 880a72d4f73e195ff93f26537d3c80c88dc454691765d3d44032ff43076a07c3
    source_path: reference/transcript-hygiene.md
    workflow: 15
---

このドキュメントでは、実行前（モデルコンテキストの構築時）に transcript に適用される**プロバイダー固有の修正**について説明します。これらの多くは、厳格なプロバイダー要件を満たすための**インメモリ**調整です。これとは別に、セッションファイル修復パスが、セッション読み込み前に保存済み JSONL を書き換えることもあります。これは、不正な JSONL 行を削除する場合と、構文的には有効でもリプレイ時にプロバイダーに拒否されることが既知の保存済みターンを修復する場合があります。修復が発生すると、元のファイルはセッションファイルと並んでバックアップされます。

対象範囲は次のとおりです。

- ユーザーに見える transcript ターンに入らない、ランタイム専用の prompt context
- ツール呼び出し ID のサニタイズ
- ツール呼び出し入力の検証
- ツール結果のペアリング修復
- ターンの検証 / 順序
- 思考シグネチャのクリーンアップ
- 画像 payload のサニタイズ
- ユーザー入力の provenance タグ付け（セッション間でルーティングされた prompt 用）
- Bedrock Converse リプレイ向けの空の assistant エラーターン修復

transcript ストレージの詳細が必要な場合は、次を参照してください。

- [Session management deep dive](/ja-JP/reference/session-management-compaction)

---

## グローバルルール: ランタイムコンテキストはユーザー transcript ではない

ランタイム/system context はターンのモデル prompt に追加できますが、
これはエンドユーザーが作成した内容ではありません。OpenClaw は、Gateway 返信、
キューされたフォローアップ、ACP、CLI、埋め込み Pi 実行のために、
transcript 向けの別個の prompt body を保持します。保存される可視ユーザーターンは、
ランタイムで拡張された prompt ではなく、その transcript body を使用します。

すでにランタイムラッパーが保存されているレガシーセッションでは、
Gateway の履歴画面が、メッセージを WebChat、
TUI、REST、または SSE クライアントに返す前に表示用の投影を適用します。

---

## これが実行される場所

すべての transcript の衛生管理は、埋め込み runner に集約されています。

- ポリシー選択: `src/agents/transcript-policy.ts`
- サニタイズ/修復の適用: `src/agents/pi-embedded-runner/replay-history.ts` 内の `sanitizeSessionHistory`

このポリシーは `provider`、`modelApi`、`modelId` を使用して、何を適用するかを決定します。

transcript の衛生管理とは別に、セッションファイルは読み込み前に（必要に応じて）修復されます。

- `src/agents/session-file-repair.ts` 内の `repairSessionFileIfNeeded`
- `run/attempt.ts` と `compact.ts`（埋め込み runner）から呼び出されます

---

## グローバルルール: 画像サニタイズ

画像 payload は、サイズ制限によるプロバイダー側の拒否を防ぐために常にサニタイズされます
（大きすぎる base64 画像を縮小/再圧縮）。

これは、vision 対応モデルで画像駆動のトークン圧力を抑えるのにも役立ちます。
最大画像辺を小さくすると通常はトークン使用量が減り、大きくすると詳細が保持されます。

実装:

- `src/agents/pi-embedded-helpers/images.ts` 内の `sanitizeSessionMessagesImages`
- `src/agents/tool-images.ts` 内の `sanitizeContentBlocksImages`
- 最大画像辺は `agents.defaults.imageMaxDimensionPx` で設定可能です（デフォルト: `1200`）。

---

## グローバルルール: 不正なツール呼び出し

`input` と `arguments` の両方が欠けている assistant のツール呼び出しブロックは、
モデルコンテキスト構築前に削除されます。これにより、部分的に保存された
ツール呼び出し（たとえば、レート制限失敗後）によるプロバイダー拒否を防ぎます。

実装:

- `src/agents/session-transcript-repair.ts` 内の `sanitizeToolCallInputs`
- `src/agents/pi-embedded-runner/replay-history.ts` 内の `sanitizeSessionHistory` で適用

---

## グローバルルール: セッション間入力の provenance

エージェントが `sessions_send` を介して別のセッションに prompt を送信する場合（
エージェント間の reply/announce ステップを含む）、OpenClaw は作成された user ターンを次のように保存します。

- `message.provenance.kind = "inter_session"`

このメタデータは transcript 追加時に書き込まれ、role は変更しません
（プロバイダー互換性のため `role: "user"` のままです）。transcript リーダーは、
これを使ってルーティングされた内部 prompt をエンドユーザー作成の指示として扱わないようにできます。

コンテキスト再構築中、OpenClaw はこれらの user ターンの先頭に短い `[Inter-session message]`
マーカーもインメモリで付加するため、モデルはそれらを外部のエンドユーザー指示と区別できます。

---

## プロバイダーマトリクス（現在の動作）

**OpenAI / OpenAI Codex**

- 画像サニタイズのみ。
- OpenAI Responses/Codex transcript では孤立した reasoning シグネチャ（後続の content block を持たない単独の reasoning アイテム）を削除し、モデルルート切り替え後にはリプレイ可能な OpenAI reasoning を削除します。
- ツール呼び出し ID のサニタイズなし。
- ツール結果ペアリング修復では、実際に一致した出力を移動し、不足しているツール呼び出しに対して Codex 形式の `aborted` 出力を合成することがあります。
- ターンの検証や並べ替えはありません。
- 欠落している OpenAI Responses 系のツール出力は、Codex リプレイ正規化に合わせて `aborted` として合成されます。
- thought シグネチャの除去はありません。

**Google（Generative AI / Gemini CLI / Antigravity）**

- ツール呼び出し ID のサニタイズ: 厳格な英数字。
- ツール結果ペアリング修復と合成ツール結果。
- ターン検証（Gemini 形式のターン交互性）。
- Google ターン順序修正（履歴が assistant で始まる場合、小さな user bootstrap を先頭に追加）。
- Antigravity Claude: thinking シグネチャを正規化し、署名のない thinking block を削除。

**Anthropic / Minimax（Anthropic 互換）**

- ツール結果ペアリング修復と合成ツール結果。
- ターン検証（厳格な交互性を満たすため、連続する user ターンを結合）。

**Amazon Bedrock（Converse API）**

- 空の assistant stream-error ターンは、リプレイ前に空でないフォールバックテキスト block に修復されます。
  Bedrock Converse は `content: []` の assistant メッセージを拒否するため、
  `stopReason: "error"` かつ空の content を持つ保存済み assistant ターンも、
  読み込み前にディスク上で修復されます。
- リプレイでは OpenClaw の delivery-mirror と gateway 注入 assistant ターンを除外します。
- 画像サニタイズはグローバルルールを通じて適用されます。

**Mistral（model-id ベースの検出を含む）**

- ツール呼び出し ID のサニタイズ: strict9（長さ 9 の英数字）。

**OpenRouter Gemini**

- thought シグネチャのクリーンアップ: base64 でない `thought_signature` 値を除去（base64 は保持）。

**それ以外すべて**

- 画像サニタイズのみ。

---

## 過去の動作（2026.1.22 より前）

2026.1.22 リリース以前、OpenClaw は transcript の衛生管理を複数層で適用していました。

- **transcript-sanitize extension** がコンテキスト構築ごとに実行され、次を行うことがありました。
  - ツール使用/結果ペアリングの修復。
  - ツール呼び出し ID のサニタイズ（`_` / `-` を保持する非厳格モードを含む）。
- runner もプロバイダー固有のサニタイズを実行しており、処理が重複していました。
- さらに、プロバイダーポリシー外でも追加の変更が行われていました。たとえば:
  - assistant テキストの `<final>` タグを保存前に除去。
  - 空の assistant エラーターンを削除。
  - ツール呼び出し後の assistant content をトリミング。

この複雑さは、プロバイダー間のリグレッション（特に `openai-responses`
`call_id|fc_id` ペアリング）を引き起こしました。2026.1.22 のクリーンアップでは extension を削除し、
ロジックを runner に集約し、OpenAI は画像サニタイズ以外では **no-touch** にしました。

## 関連

- [Session management](/ja-JP/concepts/session)
- [Session pruning](/ja-JP/concepts/session-pruning)
