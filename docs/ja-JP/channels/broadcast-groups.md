---
read_when:
    - ブロードキャストグループの設定
    - WhatsAppでの複数エージェント返信のデバッグ
status: experimental
summary: 複数のエージェントにWhatsAppメッセージをブロードキャストする
title: ブロードキャストグループ
x-i18n:
    generated_at: "2026-04-24T04:45:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: d1f3991348570170855158e82089fa073ca62b98855f443d4a227829d7c945ee
    source_path: channels/broadcast-groups.md
    workflow: 15
---

**ステータス:** 実験的  
**バージョン:** 2026.1.9で追加

## 概要

ブロードキャストグループを使用すると、複数のエージェントが同じメッセージを同時に処理して応答できます。これにより、1つのWhatsAppグループまたはDM内で連携して動作する、専門化されたエージェントチームを作成できます。しかも使用する電話番号は1つだけです。

現在の対象範囲: **WhatsAppのみ**（webチャネル）。

ブロードキャストグループは、チャネル許可リストとグループ有効化ルールの後に評価されます。WhatsAppグループでは、これはOpenClawが通常返信する場合にブロードキャストが発生することを意味します（たとえば、グループ設定に応じてメンション時など）。

## ユースケース

### 1. 専門化されたエージェントチーム

明確に役割を分けた、専門特化のエージェントを複数配置します。

```
Group: "Development Team"
Agents:
  - CodeReviewer (reviews code snippets)
  - DocumentationBot (generates docs)
  - SecurityAuditor (checks for vulnerabilities)
  - TestGenerator (suggests test cases)
```

各エージェントは同じメッセージを処理し、それぞれの専門的な観点から応答します。

### 2. 多言語サポート

```
Group: "International Support"
Agents:
  - Agent_EN (responds in English)
  - Agent_DE (responds in German)
  - Agent_ES (responds in Spanish)
```

### 3. 品質保証ワークフロー

```
Group: "Customer Support"
Agents:
  - SupportAgent (provides answer)
  - QAAgent (reviews quality, only responds if issues found)
```

### 4. タスク自動化

```
Group: "Project Management"
Agents:
  - TaskTracker (updates task database)
  - TimeLogger (logs time spent)
  - ReportGenerator (creates summaries)
```

## 設定

### 基本設定

トップレベルの`broadcast`セクション（`bindings`と同じ階層）を追加します。キーはWhatsAppのpeer IDです。

- グループチャット: グループJID（例: `120363403215116621@g.us`）
- DM: E.164電話番号（例: `+15551234567`）

```json
{
  "broadcast": {
    "120363403215116621@g.us": ["alfred", "baerbel", "assistant3"]
  }
}
```

**結果:** OpenClawがこのチャットで返信する場合、3つのエージェントすべてを実行します。

### 処理戦略

エージェントがメッセージをどのように処理するかを制御します。

#### 並列（デフォルト）

すべてのエージェントが同時に処理します。

```json
{
  "broadcast": {
    "strategy": "parallel",
    "120363403215116621@g.us": ["alfred", "baerbel"]
  }
}
```

#### 順次

エージェントが順番に処理します（前の処理が終わるまで次は待機します）。

```json
{
  "broadcast": {
    "strategy": "sequential",
    "120363403215116621@g.us": ["alfred", "baerbel"]
  }
}
```

### 完全な例

```json
{
  "agents": {
    "list": [
      {
        "id": "code-reviewer",
        "name": "Code Reviewer",
        "workspace": "/path/to/code-reviewer",
        "sandbox": { "mode": "all" }
      },
      {
        "id": "security-auditor",
        "name": "Security Auditor",
        "workspace": "/path/to/security-auditor",
        "sandbox": { "mode": "all" }
      },
      {
        "id": "docs-generator",
        "name": "Documentation Generator",
        "workspace": "/path/to/docs-generator",
        "sandbox": { "mode": "all" }
      }
    ]
  },
  "broadcast": {
    "strategy": "parallel",
    "120363403215116621@g.us": ["code-reviewer", "security-auditor", "docs-generator"],
    "120363424282127706@g.us": ["support-en", "support-de"],
    "+15555550123": ["assistant", "logger"]
  }
}
```

## 仕組み

### メッセージフロー

1. **受信メッセージ**がWhatsAppグループに到着する
2. **ブロードキャスト確認**: システムがpeer IDが`broadcast`内にあるかを確認する
3. **ブロードキャストリスト内にある場合**:
   - リスト内のすべてのエージェントがメッセージを処理する
   - 各エージェントは独自のセッションキーと分離されたコンテキストを持つ
   - エージェントは並列（デフォルト）または順次で処理する
4. **ブロードキャストリスト内にない場合**:
   - 通常のルーティングが適用される（最初に一致したbinding）

注意: ブロードキャストグループは、チャネル許可リストやグループ有効化ルール（メンション/コマンドなど）をバイパスしません。変更されるのは、メッセージが処理対象となったときに_どのエージェントが実行されるか_だけです。

### セッション分離

ブロードキャストグループ内の各エージェントは、以下を完全に分離して維持します。

- **セッションキー**（`agent:alfred:whatsapp:group:120363...` と `agent:baerbel:whatsapp:group:120363...`）
- **会話履歴**（エージェントは他のエージェントのメッセージを見ません）
- **ワークスペース**（設定されている場合は別々のサンドボックス）
- **ツールアクセス**（異なる許可/拒否リスト）
- **メモリ/コンテキスト**（別々のIDENTITY.md、SOUL.mdなど）
- **グループコンテキストバッファ**（コンテキストとして使われる最近のグループメッセージ）はpeerごとに共有されるため、トリガー時にはすべてのブロードキャストエージェントが同じコンテキストを参照します

これにより、各エージェントは以下を持てます。

- 異なる個性
- 異なるツールアクセス（例: 読み取り専用と読み書き可）
- 異なるモデル（例: opus と sonnet）
- インストールされている異なるSkills

### 例: 分離されたセッション

グループ`120363403215116621@g.us`にエージェント`["alfred", "baerbel"]`がいる場合:

**Alfredのコンテキスト:**

```
Session: agent:alfred:whatsapp:group:120363403215116621@g.us
History: [user message, alfred's previous responses]
Workspace: /Users/user/openclaw-alfred/
Tools: read, write, exec
```

**Bärbelのコンテキスト:**

```
Session: agent:baerbel:whatsapp:group:120363403215116621@g.us
History: [user message, baerbel's previous responses]
Workspace: /Users/user/openclaw-baerbel/
Tools: read only
```

## ベストプラクティス

### 1. エージェントの役割を明確に絞る

各エージェントは、単一で明確な責務を持つように設計します。

```json
{
  "broadcast": {
    "DEV_GROUP": ["formatter", "linter", "tester"]
  }
}
```

✅ **良い例:** 各エージェントに1つの仕事がある  
❌ **悪い例:** 汎用的な「dev-helper」エージェントが1つだけある

### 2. 説明的な名前を使う

各エージェントの役割が明確に分かる名前にします。

```json
{
  "agents": {
    "security-scanner": { "name": "Security Scanner" },
    "code-formatter": { "name": "Code Formatter" },
    "test-generator": { "name": "Test Generator" }
  }
}
```

### 3. 異なるツールアクセスを設定する

各エージェントには必要なツールだけを与えます。

```json
{
  "agents": {
    "reviewer": {
      "tools": { "allow": ["read", "exec"] } // Read-only
    },
    "fixer": {
      "tools": { "allow": ["read", "write", "edit", "exec"] } // Read-write
    }
  }
}
```

### 4. パフォーマンスを監視する

エージェント数が多い場合は、次を検討してください。

- 速度のために`"strategy": "parallel"`（デフォルト）を使う
- ブロードキャストグループを5～10エージェントに制限する
- 単純なエージェントにはより高速なモデルを使う

### 5. 失敗を適切に処理する

エージェントは独立して失敗します。1つのエージェントのエラーが他をブロックすることはありません。

```
Message → [Agent A ✓, Agent B ✗ error, Agent C ✓]
Result: Agent A and C respond, Agent B logs error
```

## 互換性

### プロバイダー

ブロードキャストグループは現在、以下で動作します。

- ✅ WhatsApp（実装済み）
- 🚧 Telegram（計画中）
- 🚧 Discord（計画中）
- 🚧 Slack（計画中）

### ルーティング

ブロードキャストグループは既存のルーティングと併用できます。

```json
{
  "bindings": [
    {
      "match": { "channel": "whatsapp", "peer": { "kind": "group", "id": "GROUP_A" } },
      "agentId": "alfred"
    }
  ],
  "broadcast": {
    "GROUP_B": ["agent1", "agent2"]
  }
}
```

- `GROUP_A`: alfredのみが応答する（通常のルーティング）
- `GROUP_B`: agent1とagent2の両方が応答する（ブロードキャスト）

**優先順位:** `broadcast`は`bindings`より優先されます。

## トラブルシューティング

### エージェントが応答しない

**確認事項:**

1. エージェントIDが`agents.list`に存在する
2. Peer ID形式が正しい（例: `120363403215116621@g.us`）
3. エージェントが拒否リストに入っていない

**デバッグ:**

```bash
tail -f ~/.openclaw/logs/gateway.log | grep broadcast
```

### 1つのエージェントしか応答しない

**原因:** Peer IDが`bindings`にはあるが、`broadcast`にはない可能性があります。

**修正:** broadcast設定に追加するか、bindingsから削除してください。

### パフォーマンスの問題

**多数のエージェントで遅い場合:**

- グループごとのエージェント数を減らす
- より軽量なモデルを使う（opusではなくsonnet）
- サンドボックス起動時間を確認する

## 例

### 例1: コードレビューチーム

```json
{
  "broadcast": {
    "strategy": "parallel",
    "120363403215116621@g.us": [
      "code-formatter",
      "security-scanner",
      "test-coverage",
      "docs-checker"
    ]
  },
  "agents": {
    "list": [
      {
        "id": "code-formatter",
        "workspace": "~/agents/formatter",
        "tools": { "allow": ["read", "write"] }
      },
      {
        "id": "security-scanner",
        "workspace": "~/agents/security",
        "tools": { "allow": ["read", "exec"] }
      },
      {
        "id": "test-coverage",
        "workspace": "~/agents/testing",
        "tools": { "allow": ["read", "exec"] }
      },
      { "id": "docs-checker", "workspace": "~/agents/docs", "tools": { "allow": ["read"] } }
    ]
  }
}
```

**ユーザーが送信:** コードスニペット  
**応答:**

- code-formatter: 「インデントを修正し、型ヒントを追加しました」
- security-scanner: 「⚠️ 12行目にSQLインジェクション脆弱性があります」
- test-coverage: 「カバレッジは45%で、エラーケースのテストが不足しています」
- docs-checker: 「関数`process_data`のdocstringが不足しています」

### 例2: 多言語サポート

```json
{
  "broadcast": {
    "strategy": "sequential",
    "+15555550123": ["detect-language", "translator-en", "translator-de"]
  },
  "agents": {
    "list": [
      { "id": "detect-language", "workspace": "~/agents/lang-detect" },
      { "id": "translator-en", "workspace": "~/agents/translate-en" },
      { "id": "translator-de", "workspace": "~/agents/translate-de" }
    ]
  }
}
```

## APIリファレンス

### 設定スキーマ

```typescript
interface OpenClawConfig {
  broadcast?: {
    strategy?: "parallel" | "sequential";
    [peerId: string]: string[];
  };
}
```

### フィールド

- `strategy`（省略可能）: エージェントの処理方法
  - `"parallel"`（デフォルト）: すべてのエージェントが同時に処理する
  - `"sequential"`: エージェントが配列順に処理する
- `[peerId]`: WhatsAppグループJID、E.164番号、またはその他のpeer ID
  - 値: メッセージを処理するエージェントIDの配列

## 制限事項

1. **最大エージェント数:** ハード制限はありませんが、10以上のエージェントでは遅くなる場合があります
2. **共有コンテキスト:** エージェントは互いの応答を見ません（設計どおり）
3. **メッセージ順序:** 並列応答は任意の順序で到着する場合があります
4. **レート制限:** すべてのエージェントがWhatsAppのレート制限の対象になります

## 今後の機能強化

計画されている機能:

- [ ] 共有コンテキストモード（エージェントが互いの応答を見られる）
- [ ] エージェント連携（エージェント同士でシグナルを送れる）
- [ ] 動的エージェント選択（メッセージ内容に基づいてエージェントを選択する）
- [ ] エージェント優先順位（一部のエージェントが他より先に応答する）

## 関連

- [グループ](/ja-JP/channels/groups)
- [チャネルルーティング](/ja-JP/channels/channel-routing)
- [ペアリング](/ja-JP/channels/pairing)
- [マルチエージェントサンドボックスツール](/ja-JP/tools/multi-agent-sandbox-tools)
- [セッション管理](/ja-JP/concepts/session)
