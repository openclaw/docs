---
read_when:
    - ブロードキャストグループを設定する
    - WhatsApp で複数エージェントの返信をデバッグする
sidebarTitle: Broadcast groups
status: experimental
summary: 複数のエージェントに WhatsApp メッセージをブロードキャストする
title: ブロードキャストグループ
x-i18n:
  refreshed_at: '2026-04-28T05:14:37Z'
    generated_at: "2026-04-26T11:23:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: b7b36710d9cc3eb4e2b8ba3d57031bd020aedbb6a502b400ec02a835a320d609
    source_path: channels/broadcast-groups.md
    workflow: 15
---

<Note>
**ステータス:** 実験的。2026.1.9 で追加。
</Note>

## 概要

ブロードキャストグループを使うと、複数のエージェントが同じメッセージを同時に処理して応答できます。これにより、1つの WhatsApp グループまたは DM で連携して動作する、専門化されたエージェントチームを作成できます — しかも電話番号は1つだけで済みます。

現在の対象範囲: **WhatsApp のみ**（web channel）。

ブロードキャストグループは、チャネルの許可リストとグループ有効化ルールの後に評価されます。WhatsApp グループでは、これは OpenClaw が通常応答するタイミングでブロードキャストが発生することを意味します（たとえば、グループ設定によってはメンション時）。

## ユースケース

<AccordionGroup>
  <Accordion title="1. 専門化されたエージェントチーム">
    原子的で、焦点を絞った責務を持つ複数のエージェントをデプロイします:

    ```
    Group: "Development Team"
    Agents:
      - CodeReviewer (reviews code snippets)
      - DocumentationBot (generates docs)
      - SecurityAuditor (checks for vulnerabilities)
      - TestGenerator (suggests test cases)
    ```

    各エージェントは同じメッセージを処理し、それぞれの専門的な観点を提供します。

  </Accordion>
  <Accordion title="2. 多言語サポート">
    ```
    Group: "International Support"
    Agents:
      - Agent_EN (responds in English)
      - Agent_DE (responds in German)
      - Agent_ES (responds in Spanish)
    ```
  </Accordion>
  <Accordion title="3. 品質保証ワークフロー">
    ```
    Group: "Customer Support"
    Agents:
      - SupportAgent (provides answer)
      - QAAgent (reviews quality, only responds if issues found)
    ```
  </Accordion>
  <Accordion title="4. タスク自動化">
    ```
    Group: "Project Management"
    Agents:
      - TaskTracker (updates task database)
      - TimeLogger (logs time spent)
      - ReportGenerator (creates summaries)
    ```
  </Accordion>
</AccordionGroup>

## 設定

### 基本設定

トップレベルの `broadcast` セクションを追加します（`bindings` と同じ階層）。キーは WhatsApp の peer id です:

- グループチャット: グループ JID（例: `120363403215116621@g.us`）
- DM: E.164 電話番号（例: `+15551234567`）

```json
{
  "broadcast": {
    "120363403215116621@g.us": ["alfred", "baerbel", "assistant3"]
  }
}
```

**結果:** OpenClaw がこのチャットで応答する場合、3つのエージェントすべてを実行します。

### 処理戦略

エージェントがメッセージをどのように処理するかを制御します:

<Tabs>
  <Tab title="parallel (default)">
    すべてのエージェントが同時に処理します:

    ```json
    {
      "broadcast": {
        "strategy": "parallel",
        "120363403215116621@g.us": ["alfred", "baerbel"]
      }
    }
    ```

  </Tab>
  <Tab title="sequential">
    エージェントは順番に処理します（前のエージェントが完了するまで次は待機）:

    ```json
    {
      "broadcast": {
        "strategy": "sequential",
        "120363403215116621@g.us": ["alfred", "baerbel"]
      }
    }
    ```

  </Tab>
</Tabs>

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

<Steps>
  <Step title="受信メッセージの到着">
    WhatsApp グループまたは DM のメッセージが到着します。
  </Step>
  <Step title="ブロードキャスト確認">
    システムが、peer ID が `broadcast` に含まれているかを確認します。
  </Step>
  <Step title="ブロードキャストリストに含まれている場合">
    - 一覧にあるすべてのエージェントがメッセージを処理します。
    - 各エージェントは独自のセッションキーと分離されたコンテキストを持ちます。
    - エージェントは並列（デフォルト）または順次で処理します。
  </Step>
  <Step title="ブロードキャストリストに含まれていない場合">
    通常のルーティングが適用されます（最初に一致した binding）。
  </Step>
</Steps>

<Note>
ブロードキャストグループは、チャネルの許可リストやグループ有効化ルール（メンション/コマンドなど）を回避しません。変更されるのは、メッセージが処理対象となったときに _どのエージェントを実行するか_ だけです。
</Note>

### セッション分離

ブロードキャストグループ内の各エージェントは、完全に分離された以下を維持します:

- **セッションキー**（`agent:alfred:whatsapp:group:120363...` と `agent:baerbel:whatsapp:group:120363...`）
- **会話履歴**（エージェントは他のエージェントのメッセージを見ません）
- **Workspace**（設定されていれば個別のサンドボックス）
- **ツールアクセス**（異なる allow/deny リスト）
- **メモリ/コンテキスト**（個別の IDENTITY.md、SOUL.md など）
- **グループコンテキストバッファー**（コンテキスト用に使われる最近のグループメッセージ）は peer ごとに共有されるため、トリガー時にはすべてのブロードキャストエージェントが同じコンテキストを見ます

これにより、各エージェントに次のような違いを持たせられます:

- 異なる個性
- 異なるツールアクセス（例: read-only と read-write）
- 異なるモデル（例: opus と sonnet）
- インストールされている異なる Skills

### 例: 分離されたセッション

グループ `120363403215116621@g.us` にエージェント `["alfred", "baerbel"]` がいる場合:

<Tabs>
  <Tab title="Alfred's context">
    ```
    Session: agent:alfred:whatsapp:group:120363403215116621@g.us
    History: [user message, alfred's previous responses]
    Workspace: /Users/user/openclaw-alfred/
    Tools: read, write, exec
    ```
  </Tab>
  <Tab title="Bärbel's context">
    ```
    Session: agent:baerbel:whatsapp:group:120363403215116621@g.us
    History: [user message, baerbel's previous responses]
    Workspace: /Users/user/openclaw-baerbel/
    Tools: read only
    ```
  </Tab>
</Tabs>

## ベストプラクティス

<AccordionGroup>
  <Accordion title="1. エージェントの責務を絞る">
    各エージェントは、単一で明確な責務を持つように設計します:

    ```json
    {
      "broadcast": {
        "DEV_GROUP": ["formatter", "linter", "tester"]
      }
    }
    ```

    ✅ **良い例:** 各エージェントに1つの役割がある。 ❌ **悪い例:** 汎用的な「dev-helper」エージェント1つだけ。

  </Accordion>
  <Accordion title="2. 説明的な名前を使う">
    各エージェントが何をするのかを明確にします:

    ```json
    {
      "agents": {
        "security-scanner": { "name": "Security Scanner" },
        "code-formatter": { "name": "Code Formatter" },
        "test-generator": { "name": "Test Generator" }
      }
    }
    ```

  </Accordion>
  <Accordion title="3. 異なるツールアクセスを設定する">
    各エージェントには必要なツールだけを与えます:

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

  </Accordion>
  <Accordion title="4. パフォーマンスを監視する">
    多数のエージェントを使う場合は、次を検討してください:

    - 速度のために `"strategy": "parallel"`（デフォルト）を使う
    - ブロードキャストグループを 5〜10 エージェントに制限する
    - より単純なエージェントには高速なモデルを使う

  </Accordion>
  <Accordion title="5. 障害を適切に扱う">
    エージェントは独立して失敗します。1つのエージェントのエラーが他をブロックすることはありません:

    ```
    Message → [Agent A ✓, Agent B ✗ error, Agent C ✓]
    Result: Agent A and C respond, Agent B logs error
    ```

  </Accordion>
</AccordionGroup>

## 互換性

### プロバイダー

ブロードキャストグループは現在、次で動作します:

- ✅ WhatsApp（実装済み）
- 🚧 Telegram（予定）
- 🚧 Discord（予定）
- 🚧 Slack（予定）

### ルーティング

ブロードキャストグループは既存のルーティングと併用できます:

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

- `GROUP_A`: alfred のみが応答します（通常のルーティング）。
- `GROUP_B`: agent1 と agent2 の両方が応答します（ブロードキャスト）。

<Note>
**優先順位:** `broadcast` は `bindings` より優先されます。
</Note>

## トラブルシューティング

<AccordionGroup>
  <Accordion title="エージェントが応答しない">
    **確認事項:**

    1. エージェント ID が `agents.list` に存在する。
    2. Peer ID の形式が正しい（例: `120363403215116621@g.us`）。
    3. エージェントが deny リストに入っていない。

    **デバッグ:**

    ```bash
    tail -f ~/.openclaw/logs/gateway.log | grep broadcast
    ```

  </Accordion>
  <Accordion title="1つのエージェントしか応答しない">
    **原因:** Peer ID が `bindings` にはあるが、`broadcast` にはない可能性があります。

    **対処:** ブロードキャスト設定に追加するか、bindings から削除します。

  </Accordion>
  <Accordion title="パフォーマンスの問題">
    多数のエージェントで遅い場合:

    - グループあたりのエージェント数を減らす。
    - 軽量なモデルを使う（opus ではなく sonnet）。
    - サンドボックスの起動時間を確認する。

  </Accordion>
</AccordionGroup>

## 例

<AccordionGroup>
  <Accordion title="例 1: コードレビューチーム">
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

    **ユーザー送信:** コードスニペット。

    **応答:**

    - code-formatter: 「インデントを修正し、型ヒントを追加しました」
    - security-scanner: 「⚠️ 12行目に SQL インジェクション脆弱性があります」
    - test-coverage: 「カバレッジは 45% で、エラーケースのテストが不足しています」
    - docs-checker: 「関数 `process_data` の docstring がありません」

  </Accordion>
  <Accordion title="例 2: 多言語サポート">
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
  </Accordion>
</AccordionGroup>

## API リファレンス

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

<ParamField path="strategy" type='"parallel" | "sequential"' default='"parallel"'>
  エージェントの処理方法。`parallel` はすべてのエージェントを同時に実行し、`sequential` は配列順に実行します。
</ParamField>
<ParamField path="[peerId]" type="string[]">
  WhatsApp グループ JID、E.164 番号、またはその他の peer ID。値は、メッセージを処理するエージェント ID の配列です。
</ParamField>

## 制限事項

1. **最大エージェント数:** ハードリミットはありませんが、10+ エージェントでは遅くなる可能性があります。
2. **共有コンテキスト:** エージェントは互いの応答を見ません（設計どおり）。
3. **メッセージ順序:** 並列応答は任意の順序で届く可能性があります。
4. **レート制限:** すべてのエージェントが WhatsApp のレート制限の対象になります。

## 今後の機能拡張

予定されている機能:

- [ ] 共有コンテキストモード（エージェントが互いの応答を見られる）
- [ ] エージェント連携（エージェント同士がシグナルを送れる）
- [ ] 動的なエージェント選択（メッセージ内容に基づいてエージェントを選ぶ）
- [ ] エージェント優先度（一部のエージェントが他より先に応答する）

## 関連

- [チャネルルーティング](/ja-JP/channels/channel-routing)
- [グループ](/ja-JP/channels/groups)
- [マルチエージェントサンドボックスツール](/ja-JP/tools/multi-agent-sandbox-tools)
- [ペアリング](/ja-JP/channels/pairing)
- [セッション管理](/ja-JP/concepts/session)
