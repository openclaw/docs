---
read_when:
    - トランスクリプト形状に起因するプロバイダのリクエスト拒否をデバッグしている
    - "トランスクリプトのサニタイズやツール呼び出し修復ロジックを変更している\U000900AE to=functions.read in commentary 玩彩神争霸 json\n{\"path\":\"docs/reference/transcript-hygiene.md\",\"offset\":1,\"limit\":400}"
    - プロバイダ間のtool-call id不一致を調査している
summary: 'リファレンス: プロバイダ固有のトランスクリプトサニタイズおよび修復ルール'
title: トランスクリプト衛生管理
x-i18n:
    generated_at: "2026-04-24T05:20:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: c206186f2c4816775db0f2c4663f07f5a55831a8920d1d0261ff9998bd82efc0
    source_path: reference/transcript-hygiene.md
    workflow: 15
---

# トランスクリプト衛生管理（プロバイダFixup）

このドキュメントでは、実行前（モデルコンテキスト構築時）にトランスクリプトへ適用される**プロバイダ固有の修正**を説明します。これらは、厳格なプロバイダ要件を満たすために使われる**インメモリ**調整です。これらの衛生管理ステップは、ディスク上に保存されたJSONLトランスクリプトを書き換えることは**ありません**。ただし、別のセッションファイル修復パスでは、セッション読み込み前に無効な行を落とすことで、不正なJSONLファイルを書き換えることがあります。修復が発生した場合、元のファイルはセッションファイルの隣にバックアップされます。

対象範囲:

- Tool call idのサニタイズ
- Tool call入力の検証
- Tool resultの対応修復
- ターン検証 / 順序修復
- thought signatureのクリーンアップ
- 画像ペイロードのサニタイズ
- ユーザー入力の出所タグ付け（セッション間ルーティングprompt向け）

トランスクリプト保存の詳細が必要な場合は、次を参照してください:

- [/reference/session-management-compaction](/ja-JP/reference/session-management-compaction)

---

## 実行箇所

すべてのトランスクリプト衛生管理は、埋め込みrunnerに集約されています:

- ポリシー選択: `src/agents/transcript-policy.ts`
- サニタイズ/修復の適用: `src/agents/pi-embedded-runner/replay-history.ts` の `sanitizeSessionHistory`

このポリシーは、`provider`、`modelApi`、`modelId` を使って適用内容を決定します。

トランスクリプト衛生管理とは別に、セッションファイルは読み込み前に（必要なら）修復されます:

- `src/agents/session-file-repair.ts` の `repairSessionFileIfNeeded`
- `run/attempt.ts` と `compact.ts`（埋め込みrunner）から呼ばれる

---

## グローバルルール: 画像のサニタイズ

画像ペイロードは常にサニタイズされ、サイズ制限によるプロバイダ側の拒否を防ぎます
（大きすぎるbase64画像を縮小/再圧縮します）。

これは、vision対応モデルにおける画像起因のtoken圧力を制御する助けにもなります。
一般に最大寸法を下げるとtoken使用量は減り、寸法を上げると詳細は保たれます。

実装:

- `src/agents/pi-embedded-helpers/images.ts` の `sanitizeSessionMessagesImages`
- `src/agents/tool-images.ts` の `sanitizeContentBlocksImages`
- 最大画像辺長は `agents.defaults.imageMaxDimensionPx` で設定可能（デフォルト: `1200`）。

---

## グローバルルール: 不正なtool call

`input` と `arguments` の両方が欠けているassistant tool-call blockは、
モデルコンテキスト構築前に破棄されます。これにより、途中までしか永続化されていないtool call
（たとえばrate limit失敗後）によるプロバイダ拒否を防ぎます。

実装:

- `src/agents/session-transcript-repair.ts` の `sanitizeToolCallInputs`
- `src/agents/pi-embedded-runner/replay-history.ts` の `sanitizeSessionHistory` 内で適用

---

## グローバルルール: セッション間入力の出所

エージェントが `sessions_send`（agent-to-agentのreply/announceステップを含む）経由で別セッションへpromptを送ると、OpenClawは作成されたuser turnを次の形で永続化します:

- `message.provenance.kind = "inter_session"`

このメタデータはトランスクリプト追記時に書き込まれ、roleは変えません
（プロバイダ互換性のため `role: "user"` のままです）。トランスクリプト読取側はこれを使って、ルーティングされた内部promptをエンドユーザーが書いた命令として扱わないようにできます。

コンテキスト再構築時には、モデルが外部のエンドユーザー命令と区別できるよう、OpenClawはそれらのuser turnにインメモリで短い `[Inter-session message]` マーカーも先頭付加します。

---

## プロバイダマトリクス（現在の動作）

**OpenAI / OpenAI Codex**

- 画像サニタイズのみ。
- OpenAI Responses/Codexトランスクリプトでは、孤立したreasoning signature（後続content blockのないstandalone reasoning item）を破棄する。
- Tool call idサニタイズなし。
- Tool result対応修復なし。
- ターン検証または並び替えなし。
- 合成tool resultなし。
- thought signature除去なし。

**Google（Generative AI / Gemini CLI / Antigravity）**

- Tool call idサニタイズ: 厳格な英数字のみ。
- Tool result対応修復と合成tool result。
- ターン検証（Geminiスタイルのターン交互性）。
- Googleターン順序修復（履歴がassistantで始まる場合、小さなuser bootstrapを先頭に追加）。
- Antigravity Claude: thinking signatureを正規化し、署名のないthinking blockを破棄。

**Anthropic / Minimax（Anthropic互換）**

- Tool result対応修復と合成tool result。
- ターン検証（厳格な交互性を満たすため、連続するuser turnを結合）。

**Mistral（model-idベース検出を含む）**

- Tool call idサニタイズ: strict9（長さ9の英数字）。

**OpenRouter Gemini**

- thought signatureクリーンアップ: base64でない `thought_signature` 値を除去する（base64は保持）。

**その他すべて**

- 画像サニタイズのみ。

---

## 過去の動作（2026.1.22より前）

2026.1.22リリース以前、OpenClawは複数層のトランスクリプト衛生管理を適用していました:

- **transcript-sanitize拡張** がすべてのコンテキスト構築時に実行され、次を行うことがありました:
  - tool use/result対応を修復する
  - tool call idをサニタイズする（`_` / `-` を保持する非strictモードも含む）
- runnerもプロバイダ固有のサニタイズを行っており、作業が重複していた。
- さらに、プロバイダポリシーの外でも追加の変更が行われていた:
  - 永続化前にassistantテキストから `<final>` タグを除去する
  - 空のassistant error turnを破棄する
  - tool call後のassistant contentをtrimする

この複雑さが、プロバイダ間のリグレッション（特に `openai-responses`
の `call_id|fc_id` 対応）を引き起こしました。2026.1.22のクリーンアップでは拡張を削除し、
ロジックをrunnerに集約し、OpenAIを画像サニタイズ以外では**no-touch**にしました。

## 関連

- [セッション管理](/ja-JP/concepts/session)
- [セッションpruning](/ja-JP/concepts/session-pruning)
