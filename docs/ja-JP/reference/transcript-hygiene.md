---
read_when:
    - プロバイダーリクエストの拒否が transcript の形状に関連している問題をデバッグしている
    - トランスクリプトのサニタイズまたはツール呼び出しの修復ロジックを変更している
    - プロバイダー間でのツール呼び出し ID の不一致を調査しています
summary: 'リファレンス: プロバイダー固有のトランスクリプトサニタイズと修復ルール'
title: トランスクリプトの衛生管理
x-i18n:
    generated_at: "2026-06-27T13:03:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ca1c747b33dc0d6730281d6c91d28a0f8a85bcc5e5cb00dbdebdb55157871a7d
    source_path: reference/transcript-hygiene.md
    workflow: 16
---

OpenClaw は、実行前（モデルコンテキストの構築時）にトランスクリプトへ**プロバイダー固有の修正**を適用します。これらの大半は、厳格なプロバイダー要件を満たすために使われる**インメモリ**調整です。別のセッションファイル修復パスが、セッション読み込み前に保存済み JSONL を書き換える場合もありますが、それは不正な行、または永続レコードとして無効な永続化済みターンに限られます。配信済みのアシスタント返信はディスク上で保持されます。プロバイダー固有の assistant-prefill 削除は、送信ペイロードの構築中にのみ行われます。修復が発生すると、アトミック置換の前に元のファイルが一時的な `*.bak-<pid>-<ts>` の兄弟ファイルへ書き込まれ、置換が成功すると削除されます。バックアップはクリーンアップ自体が失敗した場合にのみ保持されます（その場合、パスが報告されます）。

対象範囲は次のとおりです。

- ランタイム専用プロンプトコンテキストを、ユーザーに見えるトランスクリプトターンから除外する
- ツール呼び出し ID のサニタイズ
- ツール呼び出し入力の検証
- ツール結果ペアリングの修復
- ターンの検証 / 順序
- 思考シグネチャのクリーンアップ
- thinking シグネチャのクリーンアップ
- 画像ペイロードのサニタイズ
- プロバイダー再生前の空テキストブロックのクリーンアップ
- プロバイダー再生前の不完全な reasoning-only length ターンのクリーンアップ
- ユーザー入力の来歴タグ付け（セッション間でルーティングされたプロンプト用）
- Bedrock Converse 再生用の空のアシスタントエラーターン修復

トランスクリプト保存の詳細が必要な場合は、次を参照してください。

- [セッション管理の詳細](/ja-JP/reference/session-management-compaction)

---

## グローバルルール: ランタイムコンテキストはユーザートランスクリプトではない

ランタイム/システムコンテキストは、ターンのモデルプロンプトに追加できますが、
エンドユーザーが作成したコンテンツではありません。OpenClaw は、Gateway 返信、
キュー済み followup、ACP、CLI、埋め込み OpenClaw 実行向けに、トランスクリプト用の
プロンプト本文を別に保持します。保存される可視ユーザーターンは、ランタイムで拡張された
プロンプトではなく、そのトランスクリプト本文を使用します。

ランタイムラッパーがすでに永続化されているレガシーセッションでは、Gateway 履歴
サーフェスは WebChat、TUI、REST、または SSE クライアントへメッセージを返す前に
表示用プロジェクションを適用します。

---

## 実行される場所

すべてのトランスクリプト衛生処理は、埋め込みランナーに集約されています。

- ポリシー選択: `src/agents/transcript-policy.ts`
- サニタイズ/修復の適用: `src/agents/embedded-agent-runner/replay-history.ts` の `sanitizeSessionHistory`

ポリシーは `provider`、`modelApi`、`modelId` を使って、何を適用するかを決定します。

トランスクリプト衛生処理とは別に、セッションファイルは読み込み前に（必要であれば）修復されます。

- `src/agents/session-file-repair.ts` の `repairSessionFileIfNeeded`
- `run/attempt.ts` と `compact.ts`（埋め込みランナー）から呼び出されます

---

## グローバルルール: 画像サニタイズ

画像ペイロードは、サイズ制限によるプロバイダー側の拒否を防ぐため、常にサニタイズされます
（大きすぎる base64 画像の縮小/再圧縮）。

これは、ビジョン対応モデルで画像起因のトークン圧迫を制御するのにも役立ちます。
最大寸法を小さくすると通常はトークン使用量が減り、大きくすると詳細が保持されます。

実装:

- `src/agents/embedded-agent-helpers/images.ts` の `sanitizeSessionMessagesImages`
- `src/agents/tool-images.ts` の `sanitizeContentBlocksImages`
- 画像の最大辺は `agents.defaults.imageMaxDimensionPx` で設定できます（デフォルト: `1200`）。
- このパスが再生コンテンツを走査する間、空のテキストブロックは削除されます。空になった
  アシスタントターンは再生コピーから削除されます。空になったユーザーターンとツール結果
  ターンには、空ではない omitted-content プレースホルダーが入ります。

---

## グローバルルール: 不正なツール呼び出し

`input` と `arguments` の両方が欠けているアシスタントのツール呼び出しブロックは、
モデルコンテキストの構築前に削除されます。これにより、部分的に永続化されたツール呼び出し
（たとえばレート制限失敗後）によるプロバイダー拒否を防ぎます。

実装:

- `src/agents/session-transcript-repair.ts` の `sanitizeToolCallInputs`
- `src/agents/embedded-agent-runner/replay-history.ts` の `sanitizeSessionHistory` で適用

---

## グローバルルール: 不完全な reasoning-only ターン

プロバイダー出力制限に到達し、thinking または redacted-thinking コンテンツしか持たない
アシスタントターンは、インメモリ再生コピーから省略されます。このようなターンには不完全な
プロバイダー状態が含まれ、部分的な thinking シグネチャを持つ場合があります。

空の length ターンは変更されません。可視テキスト、ツール呼び出し、または未知のコンテンツ
ブロックを持つ length ターンも同様です。保存済みトランスクリプトは書き換えられません。

実装:

- `src/agents/embedded-agent-runner/replay-history.ts` の `normalizeAssistantReplayContent`

---

## グローバルルール: セッション間入力の来歴

エージェントが `sessions_send` 経由で別のセッションにプロンプトを送信する場合
（エージェント間の reply/announce ステップを含む）、OpenClaw は作成されたユーザーターンを
次のように永続化します。

- `message.provenance.kind = "inter_session"`

OpenClaw はまた、ルーティングされたプロンプトテキストの前に、同一ターン内の
`[Inter-session message ... isUser=false]` マーカーを付けます。これにより、アクティブな
モデル呼び出しは、外部セッション出力と外部エンドユーザー指示を区別できます。このマーカーには、
利用可能な場合、送信元セッション、チャンネル、ツールが含まれます。トランスクリプトは
プロバイダー互換性のために引き続き `role: "user"` を使用しますが、可視テキストと来歴
メタデータの両方が、そのターンをセッション間データとして示します。

コンテキスト再構築中、OpenClaw は来歴メタデータのみを持つ古い永続化済みセッション間
ユーザーターンにも同じマーカーを適用します。

---

## プロバイダーマトリクス（現在の動作）

**OpenAI / OpenAI Codex**

- 画像サニタイズのみ。
- OpenAI Responses/Codex トランスクリプトでは、孤立した reasoning シグネチャ（後続のコンテンツブロックがない単独の reasoning アイテム）を削除し、モデルルート切り替え後の再生可能な OpenAI reasoning も削除します。
- 暗号化された空サマリーアイテムを含め、再生可能な OpenAI Responses reasoning アイテムペイロードを保持します。これにより、手動/WebSocket 再生では、必要な `rs_*` 状態がアシスタント出力アイテムとペアのまま維持されます。
- ネイティブ ChatGPT Codex Responses は、セッション `prompt_cache_key` を保持しつつ、過去の Responses reasoning/message/function ペイロードを過去アイテム ID なしで再生することで、Codex ワイヤ互換性に従います。
- OpenAI Responses ファミリーの再生は、正規の `call_*|fc_*` 同一モデル reasoning ペアを保持しますが、pi-ai ペイロード変換前に、不正または長すぎる `call_id` / function-call アイテム ID を決定的に正規化します。
- ツール結果ペアリング修復では、実際に一致した出力を移動し、不足しているツール呼び出しに対して Codex 形式の `aborted` 出力を合成する場合があります。
- ターンの検証や並べ替えはありません。
- 不足している OpenAI Responses ファミリーのツール出力は、Codex 再生正規化に合わせて `aborted` として合成されます。
- 思考シグネチャの削除はありません。

**OpenAI 互換 Chat Completions**

- 履歴上のアシスタント thinking/reasoning ブロックは再生前に削除されます。これにより、
  ローカルおよびプロキシ形式の OpenAI 互換サーバーは、`reasoning` や
  `reasoning_content` などの過去ターン reasoning フィールドを受け取りません。
- 現在の同一ターンのツール呼び出し継続では、ツール結果が再生されるまで、
  アシスタント reasoning ブロックをツール呼び出しに付けたままにします。
- `reasoning: true` を持つカスタム/セルフホスト型モデルエントリは、再生された
  reasoning メタデータを保持します。
- プロバイダー所有の例外は、そのワイヤプロトコルが再生済み reasoning メタデータを
  必要とする場合にオプトアウトできます。

**Google (Generative AI / Gemini CLI / Antigravity)**

- ツール呼び出し ID のサニタイズ: 厳格な英数字。
- ツール結果ペアリング修復と合成ツール結果。
- ターン検証（Gemini 形式のターン交替）。
- Google ターン順序の補正（履歴がアシスタントで始まる場合、小さなユーザーブートストラップを先頭に追加）。
- Antigravity Claude: thinking シグネチャを正規化し、署名なし thinking ブロックを削除します。

**Anthropic / Minimax (Anthropic 互換)**

- ツール結果ペアリング修復と合成ツール結果。
- ターン検証（厳格な交替を満たすため、連続するユーザーターンをマージ）。
- thinking が有効な場合、末尾の assistant prefill ターンは送信される Anthropic Messages
  ペイロードから削除されます。Cloudflare AI Gateway ルートも含まれます。
- セッションが compact されている場合、Compaction 前のアシスタント thinking シグネチャは
  プロバイダー再生前に削除されます。thinking シグネチャは生成時の会話プレフィックスに
  暗号学的にバインドされています。Compaction 後はプレフィックスが変わる（要約された
  コンテンツが compaction summary に置き換えられる）ため、元のシグネチャを再生すると
  Anthropic は "Invalid signature in thinking block" でリクエストを拒否します。thinking
  テキストは署名なしブロックとして保持され、その後、下のルールで処理されます。
- 再生シグネチャが欠落、空、または空白の thinking ブロックは、プロバイダー変換前に
  削除されます。それによりアシスタントターンが空になる場合、OpenClaw は空ではない
  omitted-reasoning テキストでターン形状を維持します。
- 削除が必要な古い thinking-only アシスタントターンは、空ではない omitted-reasoning
  テキストに置き換えられます。これにより、プロバイダーアダプターは再生ターンを削除しません。

**Amazon Bedrock (Converse API)**

- 空のアシスタント stream-error ターンは、再生前に空ではないフォールバックテキストブロックへ
  修復されます。Bedrock Converse は `content: []` を持つアシスタントメッセージを拒否するため、
  `stopReason: "error"` と空コンテンツを持つ永続化済みアシスタントターンも、読み込み前に
  ディスク上で修復されます。
- 空白テキストブロックのみを含むアシスタント stream-error ターンは、無効な空白ブロックを
  再生する代わりに、インメモリ再生コピーから削除されます。
- セッションが compact されている場合、Compaction 前のアシスタント thinking シグネチャは
  上記の Anthropic と同じ理由で Converse 再生前に削除されます。
- 再生シグネチャが欠落、空、または空白の Claude thinking ブロックは、Converse 再生前に
  削除されます。それによりアシスタントターンが空になる場合、OpenClaw は空ではない
  omitted-reasoning テキストでターン形状を維持します。
- 削除が必要な古い thinking-only アシスタントターンは、空ではない omitted-reasoning
  テキストに置き換えられます。これにより、Converse 再生は厳格なターン形状を維持します。
- 再生では、OpenClaw 配信ミラーと Gateway 注入のアシスタントターンをフィルターします。
- 画像サニタイズはグローバルルール経由で適用されます。

**Mistral（model-id ベースの検出を含む）**

- ツール呼び出し ID のサニタイズ: strict9（英数字、長さ 9）。

**OpenRouter Gemini**

- 思考シグネチャのクリーンアップ: base64 ではない `thought_signature` 値を削除します（base64 は保持）。

**OpenRouter Anthropic**

- reasoning が有効な場合、検証済み OpenRouter OpenAI 互換 Anthropic モデルペイロードから
  末尾の assistant prefill ターンが削除されます。これは直接 Anthropic および Cloudflare
  Anthropic 再生動作に一致します。

**その他すべて**

- 画像サニタイズのみ。

---

## 履歴上の動作（2026.1.22 より前）

2026.1.22 リリース以前、OpenClaw はトランスクリプト衛生処理を複数の層で適用していました。

- **transcript-sanitize 拡張**がすべてのコンテキスト構築で実行され、次のことが可能でした。
  - ツール使用/結果ペアリングを修復する。
  - ツール呼び出し ID をサニタイズする（`_`/`-` を保持する非厳格モードを含む）。
- ランナーもプロバイダー固有のサニタイズを実行しており、処理が重複していました。
- プロバイダーポリシーの外側でも追加の変更が発生していました。例:
  - 永続化前にアシスタントテキストから `<final>` タグを削除する。
  - 空のアシスタントエラーターンを削除する。
  - ツール呼び出し後のアシスタントコンテンツをトリミングする。

この複雑さにより、プロバイダー間の回帰（特に `openai-responses` の `call_id|fc_id`
ペアリング）が発生しました。2026.1.22 のクリーンアップでは、この拡張を削除し、ロジックを
ランナーへ集約し、OpenAI を画像サニタイズ以外は**非変更**にしました。

## 関連

- [セッション管理](/ja-JP/concepts/session)
- [セッション枝刈り](/ja-JP/concepts/session-pruning)
