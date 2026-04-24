---
read_when:
    - セッション ID、トランスクリプト JSONL、または sessions.json フィールドをデバッグする必要がある場合
    - 自動 Compaction の動作を変更している場合、または「pre-compaction」ハウスキーピングを追加している場合
    - メモリ flush またはサイレントシステムターンを実装したい場合
summary: '詳細解説: セッションストアとトランスクリプト、ライフサイクル、および（自動）Compaction の内部構造'
title: セッション管理詳細解説
x-i18n:
    generated_at: "2026-04-24T05:19:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9e236840ebf9d4980339c801c1ecb70a7f413ea18987400ac47db0818b5cab8c
    source_path: reference/session-management-compaction.md
    workflow: 15
---

# セッション管理と Compaction（詳細解説）

このドキュメントでは、OpenClaw がセッションを end-to-end でどのように管理するかを説明します:

- **セッションルーティング**（受信メッセージがどう `sessionKey` に対応付けられるか）
- **セッションストア**（`sessions.json`）と、そこで追跡される内容
- **トランスクリプト永続化**（`*.jsonl`）とその構造
- **トランスクリプト hygiene**（実行前の provider 固有 fixup）
- **コンテキスト制限**（コンテキストウィンドウと追跡トークン数）
- **Compaction**（手動 + 自動 Compaction）と pre-compaction 作業を hook すべき場所
- **サイレントハウスキーピング**（例: ユーザーに見せるべきでないメモリ書き込み）

まず高レベルの概要が欲しい場合は、次から始めてください:

- [/concepts/session](/ja-JP/concepts/session)
- [/concepts/compaction](/ja-JP/concepts/compaction)
- [/concepts/memory](/ja-JP/concepts/memory)
- [/concepts/memory-search](/ja-JP/concepts/memory-search)
- [/concepts/session-pruning](/ja-JP/concepts/session-pruning)
- [/reference/transcript-hygiene](/ja-JP/reference/transcript-hygiene)

---

## ソースオブトゥルース: Gateway

OpenClaw は、セッション状態を所有する単一の **Gateway process** を中心に設計されています。

- UI（macOS app、web Control UI、TUI）は、セッション一覧や token 数を Gateway に問い合わせるべきです。
- リモートモードではセッションファイルはリモートホスト上にあるため、「ローカル Mac 上のファイルを確認」しても、Gateway が実際に使っている内容は反映されません。

---

## 2 層の永続化

OpenClaw はセッションを 2 つの層で永続化します:

1. **セッションストア（`sessions.json`）**
   - キー / 値マップ: `sessionKey -> SessionEntry`
   - 小さく、可変で、編集しても安全（エントリ削除も可）
   - セッションメタデータ（現在の session id、最終アクティビティ、各種トグル、token カウンタなど）を追跡

2. **トランスクリプト（`<sessionId>.jsonl`）**
   - append-only のトランスクリプトで、tree 構造を持つ（エントリは `id` + `parentId` を持つ）
   - 実際の会話 + tool call + compaction summary を保存
   - 将来のターンでモデルコンテキストを再構築するために使われる

---

## ディスク上の場所

Gateway ホスト上で、エージェントごとに:

- ストア: `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- トランスクリプト: `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Telegram トピックセッション: `.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw はこれらを `src/config/sessions.ts` で解決します。

---

## ストア保守とディスク制御

セッション永続化には、`sessions.json` とトランスクリプト artifact 向けの自動保守制御（`session.maintenance`）があります:

- `mode`: `warn`（デフォルト）または `enforce`
- `pruneAfter`: 古いエントリの年齢カットオフ（デフォルト `30d`）
- `maxEntries`: `sessions.json` 内エントリ上限（デフォルト `500`）
- `rotateBytes`: 大きくなりすぎた `sessions.json` をローテートする閾値（デフォルト `10mb`）
- `resetArchiveRetention`: `*.reset.<timestamp>` トランスクリプトアーカイブの保持期間（デフォルト: `pruneAfter` と同じ。`false` でクリーンアップ無効）
- `maxDiskBytes`: 任意の sessions ディレクトリ総量予算
- `highWaterBytes`: クリーンアップ後の目標値（デフォルト `maxDiskBytes` の `80%`）

ディスク予算クリーンアップの enforce 順序（`mode: "enforce"`）:

1. 最初に、もっとも古い archived または orphan transcript artifact を削除する。
2. それでも目標を超えている場合は、もっとも古いセッションエントリとそのトランスクリプトファイルを退避 / 削除する。
3. 使用量が `highWaterBytes` 以下になるまで続ける。

`mode: "warn"` では、OpenClaw は起こり得る退避を報告しますが、ストア / ファイルは変更しません。

必要に応じて保守を実行:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Cron セッションと実行ログ

分離された cron 実行もセッションエントリ / トランスクリプトを作成し、それ専用の保持制御があります:

- `cron.sessionRetention`（デフォルト `24h`）は古い分離 cron 実行セッションをセッションストアから削除する（`false` で無効）。
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` は `~/.openclaw/cron/runs/<jobId>.jsonl` ファイルを削除する（デフォルト: `2_000_000` bytes と `2000` lines）。

---

## セッションキー（`sessionKey`）

`sessionKey` は、_どの会話バケットにいるか_（ルーティング + 分離）を識別します。

よくあるパターン:

- メイン / ダイレクトチャット（エージェント単位）: `agent:<agentId>:<mainKey>`（デフォルト `main`）
- グループ: `agent:<agentId>:<channel>:group:<id>`
- ルーム / チャネル（Discord / Slack）: `agent:<agentId>:<channel>:channel:<id>` または `...:room:<id>`
- Cron: `cron:<job.id>`
- Webhook: `hook:<uuid>`（上書きされない限り）

正式ルールは [/concepts/session](/ja-JP/concepts/session) に記載されています。

---

## セッション ID（`sessionId`）

各 `sessionKey` は現在の `sessionId` を指します（会話を継続するトランスクリプトファイル）。

経験則:

- **Reset**（`/new`, `/reset`）は、その `sessionKey` に対して新しい `sessionId` を作ります。
- **Daily reset**（デフォルトでは gateway ホストのローカル時刻で午前 4:00）では、リセット境界を越えた後の次のメッセージで新しい `sessionId` が作られます。
- **Idle expiry**（`session.reset.idleMinutes` または旧来の `session.idleMinutes`）では、アイドルウィンドウ後にメッセージが来ると新しい `sessionId` が作られます。daily と idle の両方が設定されている場合は、先に期限切れになった方が優先されます。
- **Thread parent fork guard**（`session.parentForkMaxTokens`, デフォルト `100000`）では、親セッションがすでに大きすぎる場合、親トランスクリプトの fork をスキップし、新しい thread は fresh に開始されます。無効にするには `0` を設定してください。

実装詳細: 判定は `src/auto-reply/reply/session.ts` 内の `initSessionState()` で行われます。

---

## セッションストア schema（`sessions.json`）

ストアの値型は `src/config/sessions.ts` の `SessionEntry` です。

主なフィールド（網羅ではありません）:

- `sessionId`: 現在のトランスクリプト id（`sessionFile` が設定されていない限りファイル名はここから導出）
- `updatedAt`: 最終アクティビティ timestamp
- `sessionFile`: 任意の明示的トランスクリプトパス上書き
- `chatType`: `direct | group | room`（UI や送信ポリシー判断を助ける）
- `provider`, `subject`, `room`, `space`, `displayName`: group / channel ラベル用メタデータ
- トグル:
  - `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`
  - `sendPolicy`（セッション単位上書き）
- モデル選択:
  - `providerOverride`, `modelOverride`, `authProfileOverride`
- token カウンタ（ベストエフォート / provider 依存）:
  - `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: このセッションキーで自動 Compaction が完了した回数
- `memoryFlushAt`: 最後の pre-compaction メモリ flush の timestamp
- `memoryFlushCompactionCount`: 最後の flush 実行時の compaction count

ストアは編集しても安全ですが、権威は Gateway にあります。セッション実行中にエントリを再書き込み / 再水和することがあります。

---

## トランスクリプト構造（`*.jsonl`）

トランスクリプトは `@mariozechner/pi-coding-agent` の `SessionManager` により管理されます。

ファイルは JSONL です:

- 1 行目: セッションヘッダ（`type: "session"`。`id`, `cwd`, `timestamp`, 任意で `parentSession` を含む）
- 以降: `id` + `parentId` を持つセッションエントリ（tree）

主なエントリ型:

- `message`: user / assistant / toolResult メッセージ
- `custom_message`: 拡張が注入したメッセージで、_モデルコンテキストには入る_（UI では非表示にできる）
- `custom`: モデルコンテキストには入らない拡張状態
- `compaction`: `firstKeptEntryId` と `tokensBefore` を持つ永続 compaction summary
- `branch_summary`: tree branch を移動するときの永続 summary

OpenClaw は意図的にトランスクリプトを “fix up” しません。Gateway は
`SessionManager` を使ってそれらを読み書きします。

---

## コンテキストウィンドウと追跡 token の違い

重要なのは 2 つの別概念です:

1. **モデルコンテキストウィンドウ**: モデルが見られる token の hard cap
2. **セッションストアカウンタ**: `sessions.json` に書かれる rolling stats（`/status` や dashboard に使われる）

制限を調整している場合:

- コンテキストウィンドウはモデルカタログから来ます（config による上書きも可能）。
- ストア内の `contextTokens` はランタイム推定 / レポート値です。厳密な保証とは見なさないでください。

詳細は [/token-use](/ja-JP/reference/token-use) を参照してください。

---

## Compaction とは何か

Compaction は古い会話を要約し、その結果をトランスクリプト内の永続 `compaction` エントリとして保存し、最近のメッセージはそのまま保ちます。

Compaction 後の将来ターンで見えるもの:

- compaction summary
- `firstKeptEntryId` 以降のメッセージ

Compaction は **永続的** です（session pruning とは異なる）。[/concepts/session-pruning](/ja-JP/concepts/session-pruning) を参照してください。

## Compaction chunk 境界と tool pairing

OpenClaw が長いトランスクリプトを compaction chunk に分割する際には、
assistant の tool call と対応する `toolResult` エントリを対のまま保ちます。

- token 共有分割が tool call とその result の間に落ちる場合、OpenClaw は
  対を分離する代わりに、境界を assistant tool-call message 側へ移動します。
- 末尾の tool-result block を保持すると chunk が目標サイズを超えてしまう場合は、
  その保留中 tool block を保持し、未要約の tail をそのまま残します。
- 中断 / エラーした tool-call block は、保留中 split を維持しません。

---

## 自動 Compaction が発生するタイミング（Pi runtime）

埋め込み Pi agent では、自動 Compaction は 2 つの場合に発生します:

1. **Overflow recovery**: モデルが context overflow エラー
   （`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model`, `ollama error: context length
exceeded`、および類似する provider 依存の亜種）を返した場合 → compact → retry。
2. **Threshold maintenance**: 成功ターン後に、

`contextTokens > contextWindow - reserveTokens`

となった場合。

ここで:

- `contextWindow` はモデルのコンテキストウィンドウ
- `reserveTokens` は、プロンプト + 次のモデル出力のために予約する headroom

これらは Pi runtime の意味論です（OpenClaw はイベントを消費しますが、compact のタイミングを決めるのは Pi です）。

---

## Compaction 設定（`reserveTokens`, `keepRecentTokens`）

Pi の compaction 設定は Pi settings 内にあります:

```json5
{
  compaction: {
    enabled: true,
    reserveTokens: 16384,
    keepRecentTokens: 20000,
  },
}
```

OpenClaw は埋め込み実行に対して安全下限も適用します:

- `compaction.reserveTokens < reserveTokensFloor` の場合、OpenClaw はそれを引き上げます。
- デフォルト下限は `20000` token です。
- 下限を無効にするには `agents.defaults.compaction.reserveTokensFloor: 0` を設定してください。
- すでにそれ以上であれば、OpenClaw はそのままにします。

理由: Compaction が避けられなくなる前に、メモリ書き込みのような複数ターンの「housekeeping」を行うための十分な headroom を残すためです。

実装: `src/agents/pi-settings.ts` の `ensurePiCompactionReserveTokens()`
（`src/agents/pi-embedded-runner.ts` から呼び出される）。

---

## プラガブルな compaction provider

Plugin は plugin API の `registerCompactionProvider()` を通じて compaction provider を登録できます。`agents.defaults.compaction.provider` が登録済み provider id に設定されている場合、safeguard extension は組み込みの `summarizeInStages` パイプラインの代わりに、その provider へ要約を委譲します。

- `provider`: 登録済み compaction provider Plugin の id。デフォルトの LLM 要約を使う場合は未設定にする。
- `provider` を設定すると `mode: "safeguard"` が強制される。
- provider は、組み込み経路と同じ compaction 指示および identifier-preservation policy を受け取る。
- safeguard は provider 出力後も recent-turn と split-turn の suffix context を保持する。
- provider が失敗した、または空結果を返した場合、OpenClaw は自動的に組み込み LLM 要約へフォールバックする。
- abort / timeout signal は caller の cancellation を尊重するため、握りつぶさず再送出される。

ソース: `src/plugins/compaction-provider.ts`, `src/agents/pi-hooks/compaction-safeguard.ts`。

---

## ユーザー可視 surface

Compaction とセッション状態は次で観察できます:

- `/status`（任意のチャットセッション内）
- `openclaw status`（CLI）
- `openclaw sessions` / `sessions --json`
- verbose mode: `🧹 Auto-compaction complete` + compaction count

---

## サイレントハウスキーピング（`NO_REPLY`）

OpenClaw は、ユーザーに中間出力を見せるべきでないバックグラウンドタスク向けに「サイレント」ターンをサポートしています。

慣例:

- アシスタントは出力の先頭を、正確なサイレントトークン `NO_REPLY` /
  `no_reply` で始めることで、「ユーザーに返信を配信しない」ことを示します。
- OpenClaw は配信レイヤーでこれを取り除き / 抑制します。
- 正確なサイレントトークンの抑制は大文字小文字を区別しないため、ペイロード全体がそのサイレントトークンだけである場合、`NO_REPLY` と
  `no_reply` の両方が有効です。
- これは、本当にバックグラウンド / 配信不要のターン専用です。通常の実行可能なユーザー要求の近道ではありません。

`2026.1.10` 以降、OpenClaw は
partial chunk が `NO_REPLY` で始まる場合、**draft / typing ストリーミング** も抑制するため、
サイレント操作がターン途中で部分出力を漏らすことはありません。

---

## pre-compaction「memory flush」（実装済み）

目標: 自動 Compaction が起こる前に、耐久性のある state をディスクへ書き込む
サイレント agentic ターンを実行する（たとえばエージェント workspace の `memory/YYYY-MM-DD.md`）ことで、Compaction が重要コンテキストを
消してしまわないようにする。

OpenClaw は **pre-threshold flush** アプローチを使います:

1. セッションコンテキスト使用量を監視する。
2. それが「soft threshold」（Pi の compaction threshold より下）を超えたら、サイレントな
   「今すぐメモリを書け」ディレクティブをエージェントへ実行する。
3. ユーザーには何も見せないよう、正確なサイレントトークン `NO_REPLY` / `no_reply` を使う。

設定（`agents.defaults.compaction.memoryFlush`）:

- `enabled`（デフォルト: `true`）
- `softThresholdTokens`（デフォルト: `4000`）
- `prompt`（flush ターン用 user message）
- `systemPrompt`（flush ターン用に追加される extra system prompt）

注記:

- デフォルトの prompt / system prompt には、配信を抑制する `NO_REPLY` ヒントが含まれています。
- flush は compaction cycle ごとに 1 回だけ実行されます（`sessions.json` で追跡）。
- flush は埋め込み Pi セッションでのみ実行されます（CLI バックエンドではスキップ）。
- セッション workspace が読み取り専用（`workspaceAccess: "ro"` または `"none"`）の場合、flush はスキップされます。
- workspace ファイルレイアウトと書き込みパターンは [Memory](/ja-JP/concepts/memory) を参照してください。

Pi も extension API に `session_before_compact` hook を公開していますが、OpenClaw の
flush ロジックは現在 Gateway 側にあります。

---

## トラブルシューティングチェックリスト

- Session key が間違っている？ まず [/concepts/session](/ja-JP/concepts/session) を見て、`/status` の `sessionKey` を確認してください。
- Store と transcript が一致しない？ `openclaw status` から Gateway ホストとストアパスを確認してください。
- Compaction が多すぎる？ 次を確認してください:
  - モデルのコンテキストウィンドウ（小さすぎる）
  - compaction 設定（モデルウィンドウに対して `reserveTokens` が高すぎると、より早く Compaction が起こる）
  - tool-result の肥大化: session pruning を有効化 / 調整する
- サイレントターンが漏れる？ 返信が `NO_REPLY` で始まっていること（大文字小文字を区別しない正確トークン）と、ストリーミング抑制修正を含むビルドを使っていることを確認してください。

## 関連

- [Session management](/ja-JP/concepts/session)
- [Session pruning](/ja-JP/concepts/session-pruning)
- [Context engine](/ja-JP/concepts/context-engine)
