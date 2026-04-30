---
read_when:
    - ブロードキャストグループの設定
    - WhatsAppでのマルチエージェント返信のデバッグ
sidebarTitle: Broadcast groups
status: experimental
summary: WhatsApp メッセージを複数のエージェントにブロードキャストする
title: ブロードキャストグループ
x-i18n:
    generated_at: "2026-04-30T04:57:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: b0de4ccc85bf79e2ceb1dddd60db067309b15b7f876c92e7d591ff0b4b4315ec
    source_path: channels/broadcast-groups.md
    workflow: 16
---

<Note>
**ステータス:** 実験的。2026.1.9で追加。
</Note>

## 概要

ブロードキャストグループを使うと、複数のエージェントが同じメッセージを同時に処理し、応答できます。これにより、1つの電話番号だけを使って、1つのWhatsAppグループまたはダイレクトメッセージ内で連携する、専門化されたエージェントチームを作成できます。

現在の対象範囲: **WhatsAppのみ**（Webチャネル）。

ブロードキャストグループは、チャネル許可リストとグループ有効化ルールの後に評価されます。WhatsAppグループでは、これはOpenClawが通常応答する場合（例: メンション時。グループ設定による）にブロードキャストが発生することを意味します。

## ユースケース

<AccordionGroup>
  <Accordion title="1. 専門化されたエージェントチーム">
    原子的で焦点を絞った責任を持つ複数のエージェントをデプロイします。

    ```
    Group: "Development Team"
    Agents:
      - CodeReviewer (reviews code snippets)
      - DocumentationBot (generates docs)
      - SecurityAuditor (checks for vulnerabilities)
      - TestGenerator (suggests test cases)
    ```

    各エージェントは同じメッセージを処理し、それぞれの専門的な視点を提供します。

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

### 基本セットアップ

トップレベルの`broadcast`セクションを追加します（`bindings`の隣）。キーはWhatsAppのピアIDです。

- グループチャット: グループJID（例: `120363403215116621@g.us`）
- ダイレクトメッセージ: E.164電話番号（例: `+15551234567`）

```json
{
  "broadcast": {
    "120363403215116621@g.us": ["alfred", "baerbel", "assistant3"]
  }
}
```

**結果:** OpenClawがこのチャットで応答する場合、3つすべてのエージェントを実行します。

### 処理戦略

エージェントがメッセージを処理する方法を制御します。

<Tabs>
  <Tab title="parallel（デフォルト）">
    すべてのエージェントが同時に処理します。

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
    エージェントは順番に処理します（1つ前の完了を待ちます）。

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
  <Step title="受信メッセージが到着する">
    WhatsAppグループまたはダイレクトメッセージが到着します。
  </Step>
  <Step title="ブロードキャストチェック">
    システムはピアIDが`broadcast`に含まれているか確認します。
  </Step>
  <Step title="ブロードキャストリストに含まれる場合">
    - 記載されたすべてのエージェントがメッセージを処理します。
    - 各エージェントは独自のセッションキーと分離されたコンテキストを持ちます。
    - エージェントは並列（デフォルト）または順次に処理します。

  </Step>
  <Step title="ブロードキャストリストに含まれない場合">
    通常のルーティングが適用されます（最初に一致したバインディング）。
  </Step>
</Steps>

<Note>
ブロードキャストグループは、チャネル許可リストやグループ有効化ルール（メンション/コマンドなど）を迂回しません。メッセージが処理対象になったときに、_どのエージェントが実行されるか_だけを変更します。
</Note>

### セッション分離

ブロードキャストグループ内の各エージェントは、次を完全に分離して保持します。

- **セッションキー**（`agent:alfred:whatsapp:group:120363...` と `agent:baerbel:whatsapp:group:120363...`）
- **会話履歴**（エージェントは他のエージェントのメッセージを見ません）
- **ワークスペース**（設定されている場合は別々のサンドボックス）
- **ツールアクセス**（異なる許可/拒否リスト）
- **メモリ/コンテキスト**（別々のIDENTITY.md、SOUL.mdなど）
- **グループコンテキストバッファ**（コンテキストに使われる最近のグループメッセージ）はピアごとに共有されるため、すべてのブロードキャストエージェントはトリガー時に同じコンテキストを参照します

これにより、各エージェントに次を持たせることができます。

- 異なる人格
- 異なるツールアクセス（例: 読み取り専用と読み書き）
- 異なるモデル（例: opusとsonnet）
- インストール済みの異なるSkills

### 例: 分離されたセッション

エージェント`["alfred", "baerbel"]`がいるグループ`120363403215116621@g.us`の場合:

<Tabs>
  <Tab title="Alfredのコンテキスト">
    ```
    Session: agent:alfred:whatsapp:group:120363403215116621@g.us
    History: [user message, alfred's previous responses]
    Workspace: /Users/user/openclaw-alfred/
    Tools: read, write, exec
    ```
  </Tab>
  <Tab title="Bärbelのコンテキスト">
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
  <Accordion title="1. エージェントの焦点を絞る">
    各エージェントは、単一で明確な責任を持つように設計します。

    ```json
    {
      "broadcast": {
        "DEV_GROUP": ["formatter", "linter", "tester"]
      }
    }
    ```

    ✅ **良い例:** 各エージェントに1つの仕事があります。❌ **悪い例:** 1つの汎用的な「dev-helper」エージェント。

  </Accordion>
  <Accordion title="2. 説明的な名前を使う">
    各エージェントが何をするか明確にします。

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
    エージェントには必要なツールだけを与えます。

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
    多数のエージェントがある場合は、次を検討してください。

    - 速度のために`"strategy": "parallel"`（デフォルト）を使用する
    - ブロードキャストグループを5〜10エージェントに制限する
    - より単純なエージェントには高速なモデルを使用する

  </Accordion>
  <Accordion title="5. 障害を適切に処理する">
    エージェントは独立して失敗します。1つのエージェントのエラーが他をブロックすることはありません。

    ```
    Message → [Agent A ✓, Agent B ✗ error, Agent C ✓]
    Result: Agent A and C respond, Agent B logs error
    ```

  </Accordion>
</AccordionGroup>

## 互換性

### プロバイダー

ブロードキャストグループは現在、次で動作します。

- ✅ WhatsApp（実装済み）
- 🚧 Telegram（予定）
- 🚧 Discord（予定）
- 🚧 Slack（予定）

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

- `GROUP_A`: alfredのみが応答します（通常のルーティング）。
- `GROUP_B`: agent1とagent2が応答します（ブロードキャスト）。

<Note>
**優先順位:** `broadcast`は`bindings`より優先されます。
</Note>

## トラブルシューティング

<AccordionGroup>
  <Accordion title="エージェントが応答しない">
    **確認:**

    1. エージェントIDが`agents.list`に存在する。
    2. ピアID形式が正しい（例: `120363403215116621@g.us`）。
    3. エージェントが拒否リストに含まれていない。

    **デバッグ:**

    ```bash
    tail -f ~/.openclaw/logs/gateway.log | grep broadcast
    ```

  </Accordion>
  <Accordion title="1つのエージェントだけが応答する">
    **原因:** ピアIDが`bindings`には含まれているが、`broadcast`には含まれていない可能性があります。

    **修正:** ブロードキャスト設定に追加するか、バインディングから削除します。

  </Accordion>
  <Accordion title="パフォーマンスの問題">
    多数のエージェントで遅い場合:

    - グループあたりのエージェント数を減らします。
    - より軽量なモデルを使用します（opusではなくsonnet）。
    - サンドボックスの起動時間を確認します。

  </Accordion>
</AccordionGroup>

## 例

<AccordionGroup>
  <Accordion title="例1: コードレビューチーム">
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

    **ユーザーの送信内容:** コードスニペット。

    **応答:**

    - code-formatter: 「インデントを修正し、型ヒントを追加しました」
    - security-scanner: 「⚠️ 12行目にSQLインジェクション脆弱性があります」
    - test-coverage: 「カバレッジは45%で、エラーケースのテストが不足しています」
    - docs-checker: 「関数`process_data`のdocstringがありません」

  </Accordion>
  <Accordion title="例2: 多言語サポート">
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

<ParamField path="strategy" type='"parallel" | "sequential"' default='"parallel"'>
  エージェントを処理する方法。`parallel`はすべてのエージェントを同時に実行し、`sequential`は配列の順序で実行します。
</ParamField>
<ParamField path="[peerId]" type="string[]">
  WhatsAppグループJID、E.164番号、またはその他のピアID。値はメッセージを処理するエージェントIDの配列です。
</ParamField>

## 制限事項

1. **最大エージェント数:** ハードリミットはありませんが、10以上のエージェントでは遅くなる可能性があります。
2. **共有コンテキスト:** エージェントは互いの応答を見ません（設計上）。
3. **メッセージ順序:** 並列応答は任意の順序で到着する可能性があります。
4. **レート制限:** すべてのエージェントがWhatsAppのレート制限にカウントされます。

## 今後の拡張

予定されている機能:

- [ ] 共有コンテキストモード（エージェントが互いの応答を見る）
- [ ] エージェント調整（エージェントが互いにシグナルを送れる）
- [ ] 動的なエージェント選択（メッセージ内容に基づいてエージェントを選ぶ）
- [ ] エージェント優先度（一部のエージェントが他より先に応答する）

## 関連

- [チャネルルーティング](/ja-JP/channels/channel-routing)
- [グループ](/ja-JP/channels/groups)
- [マルチエージェントサンドボックスツール](/ja-JP/tools/multi-agent-sandbox-tools)
- [ペアリング](/ja-JP/channels/pairing)
- [セッション管理](/ja-JP/concepts/session)
