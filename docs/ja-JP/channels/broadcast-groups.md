---
read_when:
    - ブロードキャストグループの設定
    - WhatsApp でのマルチエージェント返信のデバッグ
sidebarTitle: Broadcast groups
status: experimental
summary: 複数のエージェントに WhatsApp メッセージをブロードキャストする
title: ブロードキャストグループ
x-i18n:
    generated_at: "2026-06-27T10:32:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a89b936322baf0fea7b487cb5354b9fad3fc021abb2970f7cd934b1880da2a0e
    source_path: channels/broadcast-groups.md
    workflow: 16
---

<Note>
**ステータス:** 実験的。2026.1.9で追加。
</Note>

## 概要

ブロードキャストグループを使うと、複数のエージェントが同じメッセージを同時に処理して応答できます。これにより、1つの電話番号だけを使って、単一の WhatsApp グループまたはDM内で連携して動作する専門エージェントチームを作成できます。

現在の対象範囲: **WhatsApp のみ**（Webチャネル）。

ブロードキャストグループは、チャネルの許可リストとグループ有効化ルールの後に評価されます。WhatsApp グループでは、これは OpenClaw が通常返信するタイミングでブロードキャストが発生することを意味します（例: グループ設定に応じてメンション時など）。

## ユースケース

<AccordionGroup>
  <Accordion title="1. 専門エージェントチーム">
    原子的で焦点の絞られた責任を持つ複数のエージェントをデプロイします:

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

### 基本セットアップ

トップレベルの `broadcast` セクションを追加します（`bindings` の隣）。キーは WhatsApp のピアIDです:

- グループチャット: グループJID（例: `120363403215116621@g.us`）
- DM: E.164電話番号（例: `+15551234567`）

```json
{
  "broadcast": {
    "120363403215116621@g.us": ["alfred", "baerbel", "assistant3"]
  }
}
```

**結果:** OpenClaw がこのチャットで返信する場合、3つのエージェントすべてを実行します。

### 処理戦略

エージェントがメッセージを処理する方法を制御します:

<Tabs>
  <Tab title="parallel（デフォルト）">
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
    エージェントが順番に処理します（1つ前の完了を待ちます）:

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
  <Step title="受信メッセージが到着">
    WhatsApp グループまたはDMメッセージが到着します。
  </Step>
  <Step title="ルーティングと許可">
    OpenClaw はチャネルの許可リスト、グループ有効化ルール、設定済みACPバインディングの所有権を適用します。
  </Step>
  <Step title="ブロードキャストチェック">
    設定済みACPバインディングがルートを所有していない場合、OpenClaw はピアIDが `broadcast` に含まれているか確認します。
  </Step>
  <Step title="ブロードキャストが適用される場合">
    - リストされたすべてのエージェントがメッセージを処理します。
    - 各エージェントは独自のセッションキーと分離されたコンテキストを持ちます。
    - エージェントは並列（デフォルト）または順次で処理します。

  </Step>
  <Step title="ブロードキャストが適用されない場合">
    OpenClaw は通常のルート、またはルーティング中に選択された設定済みACPセッションルートへディスパッチします。
  </Step>
</Steps>

<Note>
ブロードキャストグループは、チャネルの許可リストやグループ有効化ルール（メンション/コマンドなど）を迂回しません。処理対象のメッセージに対して、_どのエージェントを実行するか_ だけを変更します。
</Note>

### セッション分離

ブロードキャストグループ内の各エージェントは、次を完全に分離して保持します:

- **セッションキー**（`agent:alfred:whatsapp:group:120363...` と `agent:baerbel:whatsapp:group:120363...`）
- **会話履歴**（エージェントは他のエージェントのメッセージを見ません）
- **ワークスペース**（設定されている場合は別々のサンドボックス）
- **ツールアクセス**（異なる許可/拒否リスト）
- **メモリ/コンテキスト**（別々の IDENTITY.md、SOUL.md など）
- **グループコンテキストバッファ**（コンテキストに使われる最近のグループメッセージ）はピアごとに共有されるため、トリガーされたすべてのブロードキャストエージェントは同じコンテキストを参照します

これにより、各エージェントは次を持てます:

- 異なる人格
- 異なるツールアクセス（例: 読み取り専用と読み書き）
- 異なるモデル（例: opus と sonnet）
- 異なる Skills のインストール

### 例: 分離されたセッション

グループ `120363403215116621@g.us` にエージェント `["alfred", "baerbel"]` がある場合:

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
    各エージェントを、単一で明確な責任を持つように設計します:

    ```json
    {
      "broadcast": {
        "DEV_GROUP": ["formatter", "linter", "tester"]
      }
    }
    ```

    ✅ **良い例:** 各エージェントに1つの仕事があります。❌ **悪い例:** 1つの汎用的な "dev-helper" エージェント。

  </Accordion>
  <Accordion title="2. 説明的な名前を使う">
    各エージェントが何をするのか明確にします:

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
    エージェントには必要なツールだけを与えます:

    ```json
    {
      "agents": {
        "reviewer": {
          "tools": { "allow": ["read", "exec"] }
        },
        "fixer": {
          "tools": { "allow": ["read", "write", "edit", "exec"] }
        }
      }
    }
    ```

    `reviewer` は読み取り専用です。`fixer` は読み書きできます。

  </Accordion>
  <Accordion title="4. パフォーマンスを監視する">
    多数のエージェントを使う場合は、次を検討してください:

    - 速度のために `"strategy": "parallel"`（デフォルト）を使用する
    - ブロードキャストグループを5〜10エージェントに制限する
    - より単純なエージェントには高速なモデルを使用する

  </Accordion>
  <Accordion title="5. 失敗を適切に処理する">
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

- `GROUP_A`: alfred だけが応答します（通常のルーティング）。
- `GROUP_B`: agent1 と agent2 が応答します（ブロードキャスト）。

<Note>
**優先順位:** `broadcast` は通常のルートバインディングより優先されます。設定済みACPバインディング（`bindings[].type="acp"`）は排他的です。一致すると、OpenClaw はfan-outブロードキャストではなく、設定済みACPセッションにディスパッチします。
</Note>

## トラブルシューティング

<AccordionGroup>
  <Accordion title="エージェントが応答しない">
    **確認:**

    1. エージェントIDが `agents.list` に存在する。
    2. ピアIDの形式が正しい（例: `120363403215116621@g.us`）。
    3. エージェントが拒否リストに入っていない。

    **デバッグ:**

    ```bash
    tail -f ~/.openclaw/logs/gateway.log | grep broadcast
    ```

  </Accordion>
  <Accordion title="1つのエージェントだけが応答する">
    **原因:** ピアIDが通常のルートバインディングには含まれているが `broadcast` には含まれていない、または排他的な設定済みACPバインディングに一致している可能性があります。

    **修正:** fan-outブロードキャストが必要な場合は、通常ルートにバインドされたピアをブロードキャスト設定に追加するか、設定済みACPバインディングを削除/変更します。

  </Accordion>
  <Accordion title="パフォーマンスの問題">
    多数のエージェントで遅い場合:

    - グループあたりのエージェント数を減らします。
    - 軽量なモデルを使用します（opus ではなく sonnet）。
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

    **ユーザーが送信:** コードスニペット。

    **応答:**

    - code-formatter: "Fixed indentation and added type hints"
    - security-scanner: "⚠️ SQL injection vulnerability in line 12"
    - test-coverage: "Coverage is 45%, missing tests for error cases"
    - docs-checker: "Missing docstring for function `process_data`"

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
  エージェントの処理方法です。`parallel` はすべてのエージェントを同時に実行します。`sequential` は配列の順序で実行します。
</ParamField>
<ParamField path="[peerId]" type="string[]">
  WhatsApp グループJID、E.164番号、またはその他のピアIDです。値は、メッセージを処理するエージェントIDの配列です。
</ParamField>

## 制限事項

1. **最大エージェント数:** 厳密な上限はありませんが、10 以上のエージェントでは遅くなる場合があります。
2. **共有コンテキスト:** エージェントは互いの応答を見ません（仕様）。
3. **メッセージ順序:** 並列応答は任意の順序で到着する場合があります。
4. **レート制限:** すべてのエージェントが WhatsApp のレート制限にカウントされます。

## 今後の拡張

予定されている機能:

- [ ] 共有コンテキストモード（エージェントが互いの応答を見る）
- [ ] エージェント連携（エージェントが互いにシグナルを送れる）
- [ ] 動的なエージェント選択（メッセージ内容に基づいてエージェントを選択）
- [ ] エージェント優先度（一部のエージェントが他より先に応答）

## 関連

- [チャネルルーティング](/ja-JP/channels/channel-routing)
- [グループ](/ja-JP/channels/groups)
- [マルチエージェントサンドボックスツール](/ja-JP/tools/multi-agent-sandbox-tools)
- [ペアリング](/ja-JP/channels/pairing)
- [セッション管理](/ja-JP/concepts/session)
