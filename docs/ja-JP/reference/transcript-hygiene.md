---
read_when:
    - transcriptの形状に起因するprovider request拒否をデバッグしている。
    - transcriptサニタイズまたはtool-call修復ロジックを変更している。
    - providers間のtool-call id不一致を調査している。
summary: '参考: provider固有のtranscriptサニタイズおよび修復ルール'
title: Transcript Hygiene
x-i18n:
    generated_at: "2026-04-23T14:09:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0b528099b547155e5cf25be19e64a017d338b6f7b9c7ef51dc3ce2c2963193b8
    source_path: reference/transcript-hygiene.md
    workflow: 15
---

# Transcript Hygiene（Provider Fixups）

このドキュメントでは、run前（model context構築時）にtranscriptsへ適用される**provider固有の修正**を説明します。これらは、厳格なprovider要件を満たすために使われる**インメモリ**の調整です。これらのhygiene手順は、ディスク上に保存されたJSONL transcriptを**書き換えません**。ただし、別のsession-file repair passにより、session読み込み前に不正なlinesを削除して不正なJSONL filesを書き換えることがあります。repairが発生した場合、元のfileはsession fileと並んでバックアップされます。

スコープには次が含まれます:

- Tool call idサニタイズ
- Tool call input検証
- Tool resultペアリング修復
- Turn検証 / 並び順
- Thought signatureクリーンアップ
- Image payloadサニタイズ
- User-input provenance tagging（session間でルーティングされたprompts向け）

Transcriptストレージの詳細が必要な場合は、次を参照してください:

- [/reference/session-management-compaction](/ja-JP/reference/session-management-compaction)

---

## 実行場所

すべてのtranscript hygieneはembedded runnerに集約されています:

- ポリシー選択: `src/agents/transcript-policy.ts`
- サニタイズ/修復の適用: `src/agents/pi-embedded-runner/replay-history.ts` の `sanitizeSessionHistory`

このポリシーは、`provider`、`modelApi`、`modelId` を使って適用内容を決定します。

Transcript hygieneとは別に、session filesは読み込み前に必要に応じてrepairされます:

- `src/agents/session-file-repair.ts` の `repairSessionFileIfNeeded`
- `run/attempt.ts` と `compact.ts`（embedded runner）から呼び出されます

---

## グローバルルール: imageサニタイズ

Image payloadsは、サイズ制限によるprovider側の拒否を防ぐため、常にサニタイズされます
（大きすぎるbase64 imagesを縮小/再圧縮します）。

これは、vision対応modelsにおけるimage由来のtoken pressure制御にも役立ちます。
最大画像サイズを小さくすると通常はtoken使用量が減り、大きくすると詳細が保たれます。

実装:

- `src/agents/pi-embedded-helpers/images.ts` の `sanitizeSessionMessagesImages`
- `src/agents/tool-images.ts` の `sanitizeContentBlocksImages`
- 最大画像辺長は `agents.defaults.imageMaxDimensionPx`（デフォルト: `1200`）で設定できます。

---

## グローバルルール: 不正なtool calls

`input` と `arguments` の両方を欠くassistant tool-call blocksは、
model context構築前に削除されます。これにより、部分的に永続化されたtool calls
（たとえばrate limit failure後など）によるprovider拒否を防ぎます。

実装:

- `src/agents/session-transcript-repair.ts` の `sanitizeToolCallInputs`
- `src/agents/pi-embedded-runner/replay-history.ts` の `sanitizeSessionHistory` で適用

---

## グローバルルール: session間入力のprovenance

Agentが `sessions_send` 経由で別のsessionへpromptを送るとき（
agent-to-agentのreply/announce手順を含む）、OpenClawは作成されたuser turnを次の情報付きで永続化します:

- `message.provenance.kind = "inter_session"`

このmetadataはtranscript append時に書き込まれ、roleは変更しません
（provider互換性のため `role: "user"` のままです）。Transcript readerはこれを使って、
ルーティングされた内部promptsをエンドユーザー作成の指示として扱わないようにできます。

Context再構築時には、OpenClawはそれらのuser turnsに対してインメモリで短い `[Inter-session message]`
マーカーも先頭に追加するため、modelはそれらを
外部エンドユーザーの指示と区別できます。

---

## Provider matrix（現在の動作）

**OpenAI / OpenAI Codex**

- Imageサニタイズのみ。
- OpenAI Responses/Codex transcriptsでは、孤立したreasoning signatures（後続content blockのない単独reasoning items）を削除。
- Tool call idサニタイズなし。
- Tool resultペアリング修復なし。
- Turn検証または並び替えなし。
- Synthetic tool resultsなし。
- Thought signature除去なし。

**Google（Generative AI / Gemini CLI / Antigravity）**

- Tool call idサニタイズ: 厳格な英数字のみ。
- Tool resultペアリング修復とsynthetic tool results。
- Turn検証（Gemini形式のturn交互性）。
- Google turn ordering fixup（履歴がassistantで始まる場合、小さなuser bootstrapを先頭追加）。
- Antigravity Claude: thinking signaturesを正規化し、署名なしthinking blocksを削除。

**Anthropic / Minimax（Anthropic互換）**

- Tool resultペアリング修復とsynthetic tool results。
- Turn検証（厳格な交互性を満たすため、連続するuser turnsをマージ）。

**Mistral（model-idベースの検出を含む）**

- Tool call idサニタイズ: strict9（長さ9の英数字）。

**OpenRouter Gemini**

- Thought signatureクリーンアップ: base64でない `thought_signature` 値を除去（base64は保持）。

**その他すべて**

- Imageサニタイズのみ。

---

## 過去の動作（2026.1.22以前）

2026.1.22リリース以前は、OpenClawは複数層のtranscript hygieneを適用していました:

- **transcript-sanitize extension** がcontext構築時に毎回実行され、次を行うことがありました:
  - Tool use/resultペアリングの修復。
  - Tool call idsのサニタイズ（`_`/`-` を保持する非strictモードを含む）。
- Runnerもprovider固有のサニタイズを行っており、作業が重複していました。
- さらに、provider policyの外側でも追加のmutationが発生していました。たとえば:
  - 永続化前にassistant textから `<final>` tagsを除去。
  - 空のassistant error turnsを削除。
  - Tool calls後のassistant contentをtrim。

この複雑さはprovider間のリグレッションを引き起こしました（特に `openai-responses`
の `call_id|fc_id` ペアリング）。2026.1.22のクリーンアップではextensionが削除され、
ロジックがrunnerに集約され、OpenAIはimageサニタイズ以外では**no-touch**になりました。
