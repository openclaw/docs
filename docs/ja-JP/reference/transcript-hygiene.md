---
read_when:
    - トランスクリプトの形状に関連するプロバイダーリクエストの拒否をデバッグしています
    - トランスクリプトのサニタイズまたはツール呼び出しの修復ロジックを変更しています
    - プロバイダー間のツール呼び出し ID の不一致を調査しています
summary: 'リファレンス: プロバイダー固有のトランスクリプトのサニタイズと修復ルール'
title: トランスクリプトの整理
x-i18n:
    generated_at: "2026-05-03T05:04:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: ff3a364a4c4d1c0d1e03b2860396c2d7e32c554d7acd0791ed2eaadae06d35ab
    source_path: reference/transcript-hygiene.md
    workflow: 16
---

OpenClaw は、実行前（モデルコンテキストの構築時）にトランスクリプトへ**プロバイダー固有の修正**を適用します。これらの大半は、厳格なプロバイダー要件を満たすために使われる**インメモリ**調整です。別のセッションファイル修復パスが、セッションの読み込み前に保存済み JSONL を書き換えることもありますが、対象は不正な行または永続レコードとして無効な保存済みターンに限られます。配信済みのアシスタント返信はディスク上で保持されます。プロバイダー固有の assistant-prefill 除去は、送信ペイロードの構築時にのみ行われます。修復が発生した場合、元のファイルはセッションファイルの横にバックアップされます。

対象範囲は次のとおりです。

- ランタイム専用プロンプトコンテキストを、ユーザーに見えるトランスクリプトターンから除外する
- ツール呼び出し id のサニタイズ
- ツール呼び出し入力の検証
- ツール結果ペアリングの修復
- ターン検証 / 順序付け
- Thought signature のクリーンアップ
- Thinking signature のクリーンアップ
- 画像ペイロードのサニタイズ
- プロバイダー再生前の空テキストブロックのクリーンアップ
- ユーザー入力の由来タグ付け（セッション間でルーティングされたプロンプト用）
- Bedrock Converse 再生用の空アシスタントエラーターン修復

トランスクリプト保存の詳細が必要な場合は、次を参照してください。

- [セッション管理の詳細](/ja-JP/reference/session-management-compaction)

---

## グローバルルール: ランタイムコンテキストはユーザートランスクリプトではない

ランタイム/システムコンテキストは、ターンのモデルプロンプトに追加できますが、
エンドユーザーが作成したコンテンツではありません。OpenClaw は、Gateway 返信、キュー済みフォローアップ、ACP、CLI、埋め込み Pi 実行向けに、トランスクリプト用の
プロンプト本文を別に保持します。保存される可視ユーザーターンでは、ランタイムで拡張されたプロンプトではなく、そのトランスクリプト本文が使われます。

すでにランタイムラッパーを永続化しているレガシーセッションについては、Gateway 履歴
サーフェスが WebChat、TUI、REST、または SSE クライアントへメッセージを返す前に表示用プロジェクションを適用します。

---

## 実行箇所

すべてのトランスクリプト衛生処理は、埋め込みランナーに集約されています。

- ポリシー選択: `src/agents/transcript-policy.ts`
- サニタイズ/修復の適用: `src/agents/pi-embedded-runner/replay-history.ts` の `sanitizeSessionHistory`

このポリシーは、`provider`、`modelApi`、`modelId` を使って、何を適用するかを決定します。

トランスクリプト衛生処理とは別に、セッションファイルは読み込み前に必要に応じて修復されます。

- `src/agents/session-file-repair.ts` の `repairSessionFileIfNeeded`
- `run/attempt.ts` と `compact.ts`（埋め込みランナー）から呼び出されます

---

## グローバルルール: 画像サニタイズ

画像ペイロードは、サイズ制限によるプロバイダー側の拒否を防ぐために常にサニタイズされます
（大きすぎる base64 画像の縮小/再圧縮）。

これは、ビジョン対応モデルで画像に起因するトークン負荷を制御する助けにもなります。
最大寸法を小さくすると一般にトークン使用量が減り、寸法を大きくすると詳細が保持されます。

実装:

- `src/agents/pi-embedded-helpers/images.ts` の `sanitizeSessionMessagesImages`
- `src/agents/tool-images.ts` の `sanitizeContentBlocksImages`
- 最大画像辺は `agents.defaults.imageMaxDimensionPx` で設定できます（デフォルト: `1200`）。
- このパスが再生コンテンツを走査する間に、空のテキストブロックは削除されます。空になったアシスタント
  ターンは再生コピーから削除されます。空になったユーザーおよびツール結果
  ターンには、空でない omitted-content プレースホルダーが付与されます。

---

## グローバルルール: 不正なツール呼び出し

`input` と `arguments` の両方が欠落しているアシスタントツール呼び出しブロックは、
モデルコンテキストが構築される前に削除されます。これにより、部分的に
永続化されたツール呼び出し（たとえばレート制限失敗後）によるプロバイダー拒否を防ぎます。

実装:

- `src/agents/session-transcript-repair.ts` の `sanitizeToolCallInputs`
- `src/agents/pi-embedded-runner/replay-history.ts` の `sanitizeSessionHistory` で適用されます

---

## グローバルルール: セッション間入力の由来

エージェントが `sessions_send`（agent-to-agent の reply/announce ステップを含む）経由で別のセッションにプロンプトを送ると、
OpenClaw は作成されたユーザーターンを次の内容で永続化します。

- `message.provenance.kind = "inter_session"`

OpenClaw はまた、ルーティングされたプロンプトテキストの前に、同じターン内の `[Inter-session message ... isUser=false]`
マーカーを付加します。これにより、アクティブなモデル呼び出しは、外部セッションの出力と外部エンドユーザー指示を区別できます。このマーカーには、
利用可能な場合、送信元セッション、チャンネル、ツールが含まれます。プロバイダー互換性のため、トランスクリプトでは引き続き
`role: "user"` を使いますが、可視テキストと由来
メタデータの両方が、そのターンをセッション間データとして示します。

コンテキスト再構築中、OpenClaw は、由来メタデータだけを持つ古い永続化済み
セッション間ユーザーターンにも同じマーカーを適用します。

---

## プロバイダーマトリクス（現在の挙動）

**OpenAI / OpenAI Codex**

- 画像サニタイズのみ。
- OpenAI Responses/Codex トランスクリプトでは、孤立した reasoning signatures（後続のコンテンツブロックがない単独の reasoning items）を削除し、モデルルート切り替え後は再生可能な OpenAI reasoning を削除します。
- 暗号化された空サマリー項目を含む、再生可能な OpenAI Responses reasoning item ペイロードを保持します。これにより、手動/WebSocket 再生で必要な `rs_*` 状態がアシスタント出力項目とペアのまま保たれます。
- ツール呼び出し id のサニタイズはありません。
- ツール結果ペアリング修復は、実際に一致した出力を移動し、不足しているツール呼び出し用に Codex 形式の `aborted` 出力を合成する場合があります。
- ターン検証または並べ替えはありません。
- 不足している OpenAI Responses ファミリーのツール出力は、Codex 再生正規化に合わせるため `aborted` として合成されます。
- thought signature の除去はありません。

**OpenAI 互換 Gemma 4**

- 過去のアシスタント thinking/reasoning ブロックは、ローカルの
  OpenAI 互換 Gemma 4 サーバーが以前のターンの reasoning コンテンツを受け取らないよう、再生前に除去されます。
- 現在の同一ターンのツール呼び出し継続では、ツール結果が再生されるまで、アシスタント reasoning ブロックを
  ツール呼び出しに付けたままにします。

**Google（Generative AI / Gemini CLI / Antigravity）**

- ツール呼び出し id のサニタイズ: 厳格な英数字。
- ツール結果ペアリング修復と合成ツール結果。
- ターン検証（Gemini 形式のターン交替）。
- Google ターン順序修正（履歴がアシスタントで始まる場合、小さなユーザー bootstrap を先頭に追加）。
- Antigravity Claude: thinking signatures を正規化し、署名のない thinking ブロックを削除します。

**Anthropic / Minimax（Anthropic 互換）**

- ツール結果ペアリング修復と合成ツール結果。
- ターン検証（厳格な交替を満たすため、連続するユーザーターンを結合）。
- thinking が有効な場合、Cloudflare AI Gateway ルートを含め、末尾のアシスタント prefill ターンは送信 Anthropic Messages
  ペイロードから除去されます。
- 欠落、空、または空白の再生署名を持つ Thinking ブロックは、
  プロバイダー変換前に除去されます。それによってアシスタントターンが空になる場合、OpenClaw は
  空でない omitted-reasoning テキストでターン形状を保持します。
- 除去する必要がある古い thinking-only アシスタントターンは、
  プロバイダーアダプターが再生ターンを削除しないよう、空でない omitted-reasoning テキストに置き換えられます。

**Amazon Bedrock（Converse API）**

- 空のアシスタントストリームエラーターンは、再生前に空でないフォールバックテキストブロックへ修復されます。Bedrock Converse は `content: []` を持つアシスタントメッセージを拒否するため、
  `stopReason: "error"` と空コンテンツを持つ永続化済みアシスタントターンも、
  読み込み前にディスク上で修復されます。
- 空白テキストブロックのみを含むアシスタントストリームエラーターンは、
  無効な空白ブロックを再生する代わりに、インメモリ再生コピーから削除されます。
- 欠落、空、または空白の再生署名を持つ Claude thinking ブロックは、
  Converse 再生前に除去されます。それによってアシスタントターンが空になる場合、OpenClaw は
  空でない omitted-reasoning テキストでターン形状を保持します。
- 除去する必要がある古い thinking-only アシスタントターンは、
  Converse 再生が厳格なターン形状を保つよう、空でない omitted-reasoning テキストに置き換えられます。
- 再生は OpenClaw delivery-mirror と Gateway 注入のアシスタントターンをフィルターします。
- 画像サニタイズはグローバルルールに従って適用されます。

**Mistral（model-id ベースの検出を含む）**

- ツール呼び出し id のサニタイズ: strict9（英数字、長さ 9）。

**OpenRouter Gemini**

- Thought signature のクリーンアップ: base64 ではない `thought_signature` 値を除去します（base64 は保持）。

**OpenRouter Anthropic**

- reasoning が有効な場合、検証済み OpenRouter
  OpenAI 互換 Anthropic モデルペイロードから末尾のアシスタント prefill ターンを除去します。これは直接 Anthropic および Cloudflare Anthropic の再生挙動と一致します。

**その他すべて**

- 画像サニタイズのみ。

---

## 過去の挙動（2026.1.22 より前）

2026.1.22 リリースより前、OpenClaw は複数層のトランスクリプト衛生処理を適用していました。

- **transcript-sanitize extension** がコンテキスト構築のたびに実行され、次のことが可能でした。
  - ツール use/result ペアリングを修復する。
  - ツール呼び出し id をサニタイズする（`_`/`-` を保持する非厳格モードを含む）。
- ランナーもプロバイダー固有のサニタイズを実行していたため、処理が重複していました。
- 次を含む追加の変更が、プロバイダーポリシーの外側で発生していました。
  - 永続化前にアシスタントテキストから `<final>` タグを除去する。
  - 空のアシスタントエラーターンを削除する。
  - ツール呼び出し後のアシスタントコンテンツをトリミングする。

この複雑さは、プロバイダー間のリグレッション（特に `openai-responses`
`call_id|fc_id` ペアリング）を引き起こしました。2026.1.22 のクリーンアップでは extension を削除し、
ロジックをランナーに集約し、画像サニタイズ以外について OpenAI を**非介入**にしました。

## 関連

- [セッション管理](/ja-JP/concepts/session)
- [セッション pruning](/ja-JP/concepts/session-pruning)
