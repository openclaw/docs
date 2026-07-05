---
read_when:
    - プロバイダーリクエストの拒否がトランスクリプトの形状に関連している問題をデバッグしている
    - あなたはトランスクリプトのサニタイズまたはツール呼び出し修復ロジックを変更しています
    - OpenClaw Docs i18n の入力におけるプロバイダー間のツール呼び出し ID の不一致を調査している
summary: '参照: プロバイダー固有のトランスクリプトのサニタイズと修復ルール'
title: トランスクリプトの衛生管理
x-i18n:
    generated_at: "2026-07-05T11:49:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4c78d718106498e92c34e3ad6af452a340f230fa88fbf3da36a568e9814ec759
    source_path: reference/transcript-hygiene.md
    workflow: 16
---

OpenClaw は、実行前（モデルコンテキストの構築時）にトランスクリプトへ **プロバイダー固有の修正** を適用します。その多くは、厳格なプロバイダー要件を満たすために使われる **インメモリ** 調整です。別のセッションファイル修復パスが、セッションの読み込み前に保存済み JSONL を書き換える場合もありますが、それは不正な形式の行、または永続レコードとして無効な永続化済みターンに限られます。配信済みのアシスタント返信はディスク上に保持されます。プロバイダー固有のアシスタントプリフィル削除は、送信ペイロードの構築中にのみ行われます。

修復が発生すると、atomic replace の前に元のファイルが一時的な `*.bak-<pid>-<ts>` sibling に書き込まれ、replace が成功すると削除されます。バックアップは cleanup 自体が失敗した場合にのみ保持され、その場合はパスが報告されます。

対象範囲は次のとおりです。

- ユーザーに見えるトランスクリプトターンから Runtime 専用プロンプトコンテキストを除外
- ツール呼び出し ID のサニタイズ
- ツール呼び出し入力の検証
- ツール結果ペアリング修復
- ターン検証 / 順序付け
- 思考シグネチャの cleanup
- Thinking シグネチャの cleanup
- 画像ペイロードのサニタイズ
- プロバイダーリプレイ前の空のテキストブロック cleanup
- プロバイダーリプレイ前の、不完全な reasoning のみの length ターン cleanup
- ユーザー入力 provenance タグ付け（セッション間でルーティングされたプロンプト用）
- Bedrock Converse リプレイ用の空のアシスタント error ターン修復

トランスクリプトストレージの詳細が必要な場合は、[セッション管理の詳細](/ja-JP/reference/session-management-compaction)を参照してください。

---

## グローバルルール: Runtime コンテキストはユーザートランスクリプトではない

Runtime/system コンテキストはターンのモデルプロンプトに追加できますが、エンドユーザーが作成したコンテンツではありません。OpenClaw は、Gateway 返信、queued followups、ACP、CLI、埋め込み OpenClaw 実行のために、トランスクリプト向けプロンプト本文を別に保持します。保存される可視ユーザーターンは、Runtime で拡張されたプロンプトではなく、そのトランスクリプト本文を使用します。

すでに Runtime ラッパーを永続化しているレガシーセッションでは、Gateway 履歴サーフェスが WebChat、TUI、REST、または SSE クライアントへメッセージを返す前に表示 projection を適用します。

---

## 実行場所

すべてのトランスクリプト衛生処理は埋め込み runner に集約されています。

- ポリシー選択: `src/agents/transcript-policy.ts`
  （`resolveTranscriptPolicy`、`provider`、`modelApi`、`modelId` をキーにする）
- サニタイズ / 修復の適用: `src/agents/embedded-agent-runner/replay-history.ts` の `sanitizeSessionHistory`

トランスクリプト衛生処理とは別に、セッションファイルは読み込み前に（必要な場合）修復されます。

- `src/agents/session-file-repair.ts` の `repairSessionFileIfNeeded`
- `src/agents/embedded-agent-runner/run/attempt.ts` と
  `src/agents/embedded-agent-runner/compact.ts` から呼び出されます

---

## グローバルルール: 画像サニタイズ

画像ペイロードは、サイズ制限によるプロバイダー側の拒否を防ぐために常にサニタイズされます（過大な base64 画像を downscale/recompress）。これは vision 対応モデルで画像によるトークン負荷を制御する助けにもなります。最大寸法を低くするとトークン使用量が減り、高くすると詳細が保持されます。

実装:

- `src/agents/embedded-agent-helpers/images.ts` の `sanitizeSessionMessagesImages`
- `src/agents/tool-images.ts` の `sanitizeContentBlocksImages`
- 画像の最大辺は `agents.defaults.imageMaxDimensionPx` で設定できます
  （デフォルト: `1200`）
- このパスがリプレイコンテンツを走査する間に、空のテキストブロックは削除されます。
  空になったアシスタントターンはリプレイコピーから削除されます。空になったユーザーターンとツール結果ターンには、空ではない omitted-content プレースホルダーが付与されます。

---

## グローバルルール: 不正な形式のツール呼び出し

`input` と `arguments` の両方を欠くアシスタントのツール呼び出しブロックは、モデルコンテキストが構築される前に削除されます。これにより、部分的に永続化されたツール呼び出し（たとえば rate limit 失敗後）によるプロバイダー拒否を防ぎます。

実装:

- `src/agents/session-transcript-repair.ts` の `sanitizeToolCallInputs`
- `sanitizeSessionHistory` で適用
  （`src/agents/embedded-agent-runner/replay-history.ts`）

---

## グローバルルール: 不完全な reasoning のみのターン

thinking または redacted-thinking コンテンツのみでプロバイダー出力制限に達したアシスタントターンは、インメモリのリプレイコピーから省略されます。このようなターンには不完全なプロバイダー状態が含まれ、部分的な thinking シグネチャを持つ場合があります。

空の length ターンは変更されません。可視テキスト、ツール呼び出し、または不明なコンテンツブロックを含む length ターンも同様です。保存済みトランスクリプトは書き換えられません。

実装: `src/agents/embedded-agent-runner/replay-history.ts` の `normalizeAssistantReplayContent`

---

## グローバルルール: セッション間入力 provenance

エージェントが `sessions_send` を介して（agent-to-agent reply/announce ステップを含め）別のセッションへプロンプトを送ると、OpenClaw は作成されたユーザーターンを `message.provenance.kind = "inter_session"` 付きで永続化します。

OpenClaw はまた、ルーティングされたプロンプトテキストの前に、同一ターンの `[Inter-session message] ... isUser=false` マーカーを付加し、アクティブなモデル呼び出しが外部セッションの出力を外部エンドユーザー指示と区別できるようにします。このマーカーには、利用可能な場合、送信元セッション、チャネル、ツールが含まれます。プロバイダー互換性のためトランスクリプトは引き続き `role: "user"` を使用しますが、可視テキストと provenance メタデータの両方が、そのターンをセッション間データとして示します。

コンテキスト再構築時、OpenClaw は provenance メタデータのみを持つ古い永続化済みセッション間ユーザーターンにも同じマーカーを適用します。

---

## プロバイダーマトリクス（現在の挙動）

**OpenAI / OpenAI Codex**

- 画像サニタイズのみ。
- OpenAI Responses/Codex トランスクリプトでは孤立した reasoning シグネチャ（後続のコンテンツブロックを持たない standalone reasoning item）を削除し、モデル route 切り替え後のリプレイ可能な OpenAI reasoning を削除します。
- 暗号化された empty-summary items を含む、リプレイ可能な OpenAI Responses reasoning item ペイロードを保持し、manual/WebSocket リプレイで必須の `rs_*` state がアシスタント出力 item とペアになるようにします。
- ネイティブ ChatGPT Codex Responses は、セッション `prompt_cache_key` を保持しつつ、prior item IDs なしで過去の Responses reasoning/message/function ペイロードをリプレイすることで Codex wire parity に従います。
- OpenAI Responses-family リプレイは canonical `call_*|fc_*` same-model reasoning ペアを保持しますが、pi-ai ペイロード変換前に、不正な形式または過長の `call_id`/function-call item ids を決定論的に正規化します。
- ツール結果ペアリング修復は、実際に一致した出力を移動し、欠落したツール呼び出しに対して Codex 風の `aborted` 出力を合成する場合があります。
- ターン検証や並べ替えは行いません。thought シグネチャの削除も行いません。

**OpenAI 互換 Chat Completions**

- 過去のアシスタント thinking/reasoning ブロックはリプレイ前に削除され、local および proxy-style の OpenAI 互換サーバーが `reasoning` や `reasoning_content` などの prior-turn reasoning フィールドを受け取らないようにします。
- 現在の same-turn ツール呼び出し continuation は、ツール結果がリプレイされるまで、アシスタント reasoning ブロックをツール呼び出しに付けたままにします。
- `reasoning: true` を持つ custom/self-hosted モデルエントリは、リプレイされた reasoning メタデータを保持します。
- Provider-owned 例外は、wire protocol がリプレイ済み reasoning メタデータを必要とする場合に opt out できます。

**Google（Generative AI / Gemini CLI / Antigravity）**

- ツール呼び出し ID サニタイズ: strict alphanumeric。
- ツール結果ペアリング修復と合成ツール結果。
- ターン検証（Gemini-style のターン交替）。
- Google ターン順序 fixup（履歴が assistant から始まる場合、小さな user bootstrap を先頭に追加）。
- Antigravity Claude: thinking シグネチャを正規化し、署名なし thinking ブロックを削除します。

**Anthropic / Minimax（Anthropic 互換）**

- ツール結果ペアリング修復と合成ツール結果。
- ターン検証（厳格な交替を満たすため、連続する user ターンを merge）。
- thinking が有効な場合、Cloudflare AI Gateway routes を含め、末尾の assistant prefill ターンは送信 Anthropic Messages ペイロードから削除されます。
- セッションが compacted されている場合、pre-compaction assistant thinking シグネチャはプロバイダーリプレイ前に削除されます。Thinking シグネチャは生成時の会話プレフィックスに暗号学的にバインドされています。compaction 後はプレフィックスが変わる（要約コンテンツが元の内容を置き換える）ため、元のシグネチャをリプレイすると Anthropic が "Invalid signature in thinking block" でリクエストを拒否します。thinking テキストは署名なしブロックとして保持され、その後、下記のルールで処理されます。
- replay シグネチャが欠落、空、または blank の thinking ブロックは、プロバイダー変換前に削除されます。それによりアシスタントターンが空になる場合、OpenClaw は空ではない omitted-reasoning テキストでターン形状を保持します。
- 削除する必要がある古い thinking-only アシスタントターンは、プロバイダーアダプターがリプレイターンを削除しないように、空ではない omitted-reasoning テキストで置き換えられます。

**Amazon Bedrock（Converse API）**

- 空の assistant stream-error ターンは、リプレイ前に空ではない fallback テキストブロックへ修復されます。Bedrock Converse は `content: []` を持つ assistant メッセージを拒否するため、`stopReason:
"error"` と空コンテンツを持つ永続化済み assistant ターンも、読み込み前にディスク上で修復されます。
- 空白テキストブロックのみを持つ assistant stream-error ターンは、無効な空白ブロックをリプレイする代わりに、インメモリのリプレイコピーから削除されます。
- セッションが compacted されている場合、Anthropic 上記と同じ理由で、pre-compaction assistant thinking シグネチャは Converse リプレイ前に削除されます。
- replay シグネチャが欠落、空、または blank の Claude thinking ブロックは、Converse リプレイ前に削除されます。それによりアシスタントターンが空になる場合、OpenClaw は空ではない omitted-reasoning テキストでターン形状を保持します。
- 削除する必要がある古い thinking-only アシスタントターンは、Converse リプレイが厳格なターン形状を維持するように、空ではない omitted-reasoning テキストで置き換えられます。
- リプレイは OpenClaw delivery-mirror と gateway-injected assistant ターンをフィルタリングします。
- 画像サニタイズはグローバルルールを通じて適用されます。

**Mistral（model-id ベースの検出を含む）**

- ツール呼び出し ID サニタイズ: strict9（alphanumeric、長さ 9）。

**OpenRouter Gemini**

- Thought シグネチャ cleanup: base64 ではない `thought_signature` 値を削除します（base64 は保持）。

**OpenRouter Anthropic**

- reasoning が有効な場合、検証済み OpenRouter OpenAI 互換 Anthropic モデルペイロードから、末尾の assistant prefill ターンが削除されます。これは direct Anthropic および Cloudflare Anthropic リプレイ挙動と一致します。

**その他すべて**

- 画像サニタイズのみ。

---

## 履歴上の挙動（2026.1.22 より前）

2026.1.22 リリース以前、OpenClaw は複数レイヤーのトランスクリプト衛生処理を適用していました。

- **transcript-sanitize extension** がすべてのコンテキスト構築で実行され、次を行うことができました。
  - ツール use/result ペアリングを修復。
  - ツール呼び出し ID をサニタイズ（`_`/`-` を保持する non-strict mode を含む）。
- runner もプロバイダー固有のサニタイズを実行しており、作業が重複していました。
- プロバイダーポリシーの外側でも追加の mutation が発生していました。これには、永続化前に assistant テキストから `<final>` tags を削除すること、空の assistant error ターンを削除すること、ツール呼び出し後に assistant コンテンツを trim することが含まれていました。

この複雑さは、クロスプロバイダーのリグレッション（特に `openai-responses` の `call_id|fc_id` ペアリング）を引き起こしました。2026.1.22 の cleanup で extension を削除し、ロジックを runner に集約し、OpenAI は画像サニタイズを除いて **no-touch** になりました。

## 関連

- [セッション管理](/ja-JP/concepts/session)
- [セッション pruning](/ja-JP/concepts/session-pruning)
