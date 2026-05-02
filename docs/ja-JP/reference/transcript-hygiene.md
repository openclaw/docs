---
read_when:
    - トランスクリプトの構造に関連するプロバイダーリクエスト拒否をデバッグしています
    - トランスクリプトのサニタイズまたはツール呼び出しの修復ロジックを変更している
    - プロバイダー間のツール呼び出し ID の不一致を調査しています
summary: 'リファレンス: プロバイダー固有のトランスクリプトのサニタイズと修復ルール'
title: トランスクリプトの整理
x-i18n:
    generated_at: "2026-05-02T21:06:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6976d4349e47954f49c9dbf300822013851b604ed665f4ab647c62025760a96c
    source_path: reference/transcript-hygiene.md
    workflow: 16
---

OpenClaw は、実行前（モデルコンテキストの構築時）にトランスクリプトへ**プロバイダー固有の修正**を適用します。これらの大半は、厳格なプロバイダー要件を満たすために使われる**インメモリ**の調整です。別のセッションファイル修復パスが、セッションの読み込み前に保存済み JSONL を書き換えることもあります。これは、不正な JSONL 行を削除するか、構文的には有効でもリプレイ時に
プロバイダーから拒否されることが分かっている永続化済みターンを修復するものです。修復が行われると、元のファイルは
セッションファイルの隣にバックアップされます。

範囲には次が含まれます。

- ランタイム専用のプロンプトコンテキストを、ユーザーに表示されるトランスクリプトターンに含めないこと
- ツール呼び出し ID のサニタイズ
- ツール呼び出し入力の検証
- ツール結果のペアリング修復
- ターンの検証 / 順序付け
- thought signature のクリーンアップ
- thinking signature のクリーンアップ
- 画像ペイロードのサニタイズ
- プロバイダーリプレイ前の空のテキストブロックのクリーンアップ
- ユーザー入力の由来タグ付け（セッション間でルーティングされたプロンプト用）
- Bedrock Converse リプレイ用の空の assistant エラーターン修復

トランスクリプト保存の詳細が必要な場合は、次を参照してください。

- [セッション管理の詳細](/ja-JP/reference/session-management-compaction)

---

## グローバルルール: ランタイムコンテキストはユーザートランスクリプトではない

ランタイム/システムコンテキストはターンのモデルプロンプトに追加できますが、これは
エンドユーザーが作成した内容ではありません。OpenClaw は、Gateway 応答、キュー済みフォローアップ、ACP、CLI、埋め込み Pi
実行用に、トランスクリプト向けのプロンプト本文を別に保持します。保存される可視ユーザーターンは、ランタイムで拡張されたプロンプトではなく、そのトランスクリプト本文を使用します。

ランタイムラッパーがすでに永続化されているレガシーセッションでは、Gateway 履歴
サーフェスは WebChat、
TUI、REST、SSE クライアントへメッセージを返す前に表示用の投影を適用します。

---

## 実行場所

すべてのトランスクリプト衛生処理は、埋め込みランナーに集約されています。

- ポリシー選択: `src/agents/transcript-policy.ts`
- サニタイズ/修復の適用: `src/agents/pi-embedded-runner/replay-history.ts` の `sanitizeSessionHistory`

ポリシーは `provider`、`modelApi`、`modelId` を使って、何を適用するかを決定します。

トランスクリプト衛生処理とは別に、セッションファイルは読み込み前に（必要であれば）修復されます。

- `src/agents/session-file-repair.ts` の `repairSessionFileIfNeeded`
- `run/attempt.ts` と `compact.ts`（埋め込みランナー）から呼び出されます

---

## グローバルルール: 画像サニタイズ

画像ペイロードは、サイズ制限によるプロバイダー側の拒否を防ぐため、常にサニタイズされます
（大きすぎる base64 画像の縮小/再圧縮）。

これは、視覚対応モデルで画像起因のトークン負荷を制御するのにも役立ちます。
最大寸法を小さくすると一般にトークン使用量が減り、大きくすると詳細が保持されます。

実装:

- `src/agents/pi-embedded-helpers/images.ts` の `sanitizeSessionMessagesImages`
- `src/agents/tool-images.ts` の `sanitizeContentBlocksImages`
- 画像の最大辺は `agents.defaults.imageMaxDimensionPx`（デフォルト: `1200`）で設定できます。
- このパスがリプレイ内容を走査する間に、空のテキストブロックは削除されます。空になる assistant
  ターンはリプレイコピーから削除されます。空になる user および tool-result
  ターンには、空ではない省略コンテンツのプレースホルダーが付与されます。

---

## グローバルルール: 不正なツール呼び出し

`input` と `arguments` の両方が欠落している assistant ツール呼び出しブロックは、モデルコンテキストが構築される前に削除されます。これにより、部分的に
永続化されたツール呼び出し（たとえばレート制限エラー後）によるプロバイダー拒否を防ぎます。

実装:

- `src/agents/session-transcript-repair.ts` の `sanitizeToolCallInputs`
- `src/agents/pi-embedded-runner/replay-history.ts` の `sanitizeSessionHistory` で適用

---

## グローバルルール: セッション間入力の由来

エージェントが `sessions_send` を介して（エージェント間の reply/announce ステップを含めて）別のセッションへプロンプトを送信すると、OpenClaw は作成されたユーザーターンを次のように永続化します。

- `message.provenance.kind = "inter_session"`

OpenClaw はまた、ルーティングされたプロンプトテキストの前に、同一ターンの `[Inter-session message ... isUser=false]`
マーカーを付加します。これにより、アクティブなモデル呼び出しが、外部のエンドユーザー指示と外部セッションの出力を区別できるようになります。このマーカーには、利用可能な場合、送信元セッション、チャンネル、ツールが含まれます。トランスクリプトはプロバイダー互換性のために
`role: "user"` を引き続き使用しますが、可視テキストと由来
メタデータの両方で、そのターンがセッション間データであることを示します。

コンテキスト再構築中、OpenClaw は、由来メタデータしか持たない古い永続化済み
セッション間ユーザーターンにも同じマーカーを適用します。

---

## プロバイダーマトリックス（現在の動作）

**OpenAI / OpenAI Codex**

- 画像サニタイズのみ。
- OpenAI Responses/Codex トランスクリプトでは、孤立した reasoning signature（後続のコンテンツブロックがない単独の reasoning item）を削除し、モデルルート切り替え後はリプレイ可能な OpenAI reasoning も削除します。
- 手動/WebSocket リプレイで、assistant 出力 item とペアになった必須の `rs_*` 状態が保持されるように、暗号化された空のサマリー item を含むリプレイ可能な OpenAI Responses reasoning item ペイロードを保持します。
- ツール呼び出し ID のサニタイズは行いません。
- ツール結果のペアリング修復では、実際に一致した出力を移動し、欠落したツール呼び出しに対して Codex 形式の `aborted` 出力を合成することがあります。
- ターン検証や並べ替えは行いません。
- 欠落している OpenAI Responses 系のツール出力は、Codex リプレイ正規化に合わせて `aborted` として合成されます。
- thought signature の削除は行いません。

**OpenAI 互換 Gemma 4**

- ローカルの
  OpenAI 互換 Gemma 4 サーバーが前ターンの reasoning コンテンツを受け取らないように、履歴内の assistant thinking/reasoning ブロックはリプレイ前に削除されます。
- 現在の同一ターンのツール呼び出し継続では、ツール結果がリプレイされるまで、assistant reasoning ブロックを
  ツール呼び出しに付けたままにします。

**Google（Generative AI / Gemini CLI / Antigravity）**

- ツール呼び出し ID のサニタイズ: 厳格な英数字。
- ツール結果のペアリング修復と合成ツール結果。
- ターン検証（Gemini 形式のターン交替）。
- Google ターン順序の修正（履歴が assistant で始まる場合は、ごく小さな user ブートストラップを先頭に追加）。
- Antigravity Claude: thinking signature を正規化し、署名なしの thinking ブロックを削除します。

**Anthropic / Minimax（Anthropic 互換）**

- ツール結果のペアリング修復と合成ツール結果。
- ターン検証（厳格な交替を満たすため、連続する user ターンをマージ）。
- thinking が有効な場合、Cloudflare AI Gateway ルートを含め、末尾の assistant prefill ターンは送信される Anthropic Messages
  ペイロードから削除されます。
- リプレイ署名が欠落、空、または空白のみの thinking ブロックは、
  プロバイダー変換前に削除されます。それにより assistant ターンが空になる場合、OpenClaw は
  空ではない省略 reasoning テキストでターンの形状を保持します。
- 削除が必要な古い thinking のみの assistant ターンは、
  空ではない省略 reasoning テキストに置き換えられるため、プロバイダーアダプターはリプレイ
  ターンを削除しません。

**Amazon Bedrock（Converse API）**

- 空の assistant ストリームエラーターンは、リプレイ前に空ではないフォールバックテキストブロックへ修復されます。Bedrock Converse は `content: []` を含む assistant メッセージを拒否するため、`stopReason: "error"` と空の content を持つ永続化済み assistant ターンも、
  読み込み前にディスク上で修復されます。
- 空白のみのテキストブロックだけを含む assistant ストリームエラーターンは、
  無効な空白ブロックをリプレイする代わりに、インメモリのリプレイコピーから削除されます。
- リプレイ署名が欠落、空、または空白のみの Claude thinking ブロックは、
  Converse リプレイ前に削除されます。それにより assistant ターンが空になる場合、OpenClaw は
  空ではない省略 reasoning テキストでターンの形状を保持します。
- 削除が必要な古い thinking のみの assistant ターンは、
  空ではない省略 reasoning テキストに置き換えられるため、Converse リプレイは厳格なターン形状を保持します。
- リプレイは OpenClaw delivery-mirror と gateway-injected assistant ターンをフィルターします。
- 画像サニタイズはグローバルルールを通じて適用されます。

**Mistral（model-id ベースの検出を含む）**

- ツール呼び出し ID のサニタイズ: strict9（長さ 9 の英数字）。

**OpenRouter Gemini**

- thought signature のクリーンアップ: base64 ではない `thought_signature` 値を削除します（base64 は保持）。

**OpenRouter Anthropic**

- reasoning が有効な場合、検証済みの OpenRouter
  OpenAI 互換 Anthropic モデルペイロードから末尾の assistant prefill ターンを削除します。これは、直接の Anthropic および Cloudflare Anthropic リプレイ動作と一致します。

**その他すべて**

- 画像サニタイズのみ。

---

## 履歴上の動作（2026.1.22 より前）

2026.1.22 リリースより前、OpenClaw はトランスクリプト衛生処理を複数のレイヤーで適用していました。

- **transcript-sanitize extension** がすべてのコンテキスト構築で実行され、次を行うことができました。
  - ツール使用/結果のペアリングを修復。
  - ツール呼び出し ID をサニタイズ（`_`/`-` を保持する非厳格モードを含む）。
- ランナーもプロバイダー固有のサニタイズを実行しており、処理が重複していました。
- プロバイダーポリシーの外側でも、次のような追加の変更が行われていました。
  - 永続化前に assistant テキストから `<final>` タグを削除。
  - 空の assistant エラーターンを削除。
  - ツール呼び出し後の assistant コンテンツをトリミング。

この複雑さにより、プロバイダー間のリグレッション（特に `openai-responses`
`call_id|fc_id` ペアリング）が発生しました。2026.1.22 のクリーンアップでは extension を削除し、ロジックをランナーに集約し、OpenAI は画像サニタイズ以外を**非介入**にしました。

## 関連

- [セッション管理](/ja-JP/concepts/session)
- [セッションプルーニング](/ja-JP/concepts/session-pruning)
