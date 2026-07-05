---
read_when:
    - ブロードキャストグループの設定
    - WhatsApp でのマルチエージェント返信のデバッグ
sidebarTitle: Broadcast groups
status: experimental
summary: 複数のエージェントに WhatsApp メッセージをブロードキャストする
title: ブロードキャストグループ
x-i18n:
    generated_at: "2026-07-05T11:01:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2771c15b31592f11293385498b9c89decf84747a9172caafb994a5dca4bbdc06
    source_path: channels/broadcast-groups.md
    workflow: 16
---

<Note>
**ステータス:** 実験的。2026.1.9 で追加。WhatsApp（Webチャネル）のみ。
</Note>

## 概要

ブロードキャストグループは、同じ受信メッセージに対して**複数のエージェント**を実行します。各エージェントは独自の分離されたセッションでメッセージを処理し、独自の返信を投稿するため、1つの WhatsApp 番号で、1つのグループチャットまたは DM 内に専門化されたエージェントのチームをホストできます。

ブロードキャストグループは、チャネル許可リストとグループ有効化ルールの後に評価されます。WhatsApp グループでは、OpenClaw が通常返信する場面（例: メンション時。グループ設定に依存）でブロードキャストが発生します。これは**どのエージェントが実行されるか**だけを変更し、メッセージが処理対象になるかどうかは変更しません。

ライブ WhatsApp QA レーンには `whatsapp-broadcast-group-fanout` が含まれており、メンションされた1つのグループメッセージから、設定された2つのエージェントによる異なる可視返信が生成されることを検証します。

## 設定

### 基本設定

トップレベルの `broadcast` セクションを追加します（`bindings` の隣）。キーは WhatsApp ピア ID、値はエージェント ID の配列です。

- グループチャット: グループ JID（例: `120363403215116621@g.us`）
- DM: 送信者の E.164 電話番号（例: `+15551234567`）

```json
{
  "broadcast": {
    "120363403215116621@g.us": ["alfred", "baerbel", "assistant3"]
  }
}
```

**結果:** このチャットで OpenClaw が返信する場合、3つすべてのエージェントを実行します。

一覧に含まれるすべてのエージェント ID は `agents.list` に存在している必要があります。設定検証は不明な ID を報告し、ランタイムは `Broadcast agent <id> not found in agents.list; skipping` 警告とともにそれらをスキップします。

### 処理戦略

`broadcast.strategy` は、エージェントがメッセージを処理する方法を設定します。

| 戦略                 | 動作                                                                  |
| -------------------- | --------------------------------------------------------------------- |
| `parallel`（デフォルト） | すべてのエージェントが同時に処理します。返信は任意の順序で到着します。 |
| `sequential`         | エージェントは配列順に処理します。それぞれ前の処理完了を待ちます。    |

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

<Steps>
  <Step title="受信メッセージが到着">
    WhatsApp グループまたは DM メッセージが到着します。
  </Step>
  <Step title="ルートと受け入れ">
    OpenClaw はチャネル許可リスト、グループ有効化ルール、設定済み ACP バインディング所有権を適用します。
  </Step>
  <Step title="ブロードキャスト確認">
    設定済み ACP バインディングがルートを所有していない場合、OpenClaw はピア ID が `broadcast` に含まれているかを確認します。
  </Step>
  <Step title="ブロードキャストが適用される場合">
    - 一覧に含まれるすべてのエージェントがメッセージを処理します。
    - 各エージェントには独自のセッションキーと分離されたコンテキストがあります。
    - エージェントは並列（デフォルト）または逐次で処理します。
    - 音声添付はファンアウト前に一度だけ文字起こしされるため、エージェントは個別に STT 呼び出しを行う代わりに1つのトランスクリプトを共有します。

  </Step>
  <Step title="ブロードキャストが適用されない場合">
    OpenClaw は通常のルート、またはルーティング中に選択された設定済み ACP セッションルートへディスパッチします。
  </Step>
</Steps>

<Note>
ブロードキャストグループは、チャネル許可リストやグループ有効化ルール（メンション、コマンドなど）をバイパスしません。メッセージが処理対象になったときに、_どのエージェントが実行されるか_ だけを変更します。
</Note>

### セッション分離

ブロードキャストグループ内の各エージェントは、以下を完全に別々に保持します。

- **セッションキー**（`agent:alfred:whatsapp:group:120363...` と `agent:baerbel:whatsapp:group:120363...`）
- **会話履歴**（エージェントは他のエージェントの返信を見ません）
- **ワークスペース**（設定されている場合は別々のサンドボックス）
- **ツールアクセス**（異なる許可/拒否リスト）
- **メモリ/コンテキスト**（別々の `IDENTITY.md`、`SOUL.md` など）

意図的に共有される例外が1つあります。**グループコンテキストバッファ**（コンテキストに使われる最近のグループメッセージ）はピアごとに共有されるため、トリガーされたすべてのブロードキャストエージェントが同じコンテキストを参照します。これはファンアウト完了後に一度だけクリアされます。

これにより、各エージェントに異なる人格、モデル、Skills、ツールアクセス（たとえば読み取り専用と読み書き可能）を持たせることができます。

### 例: 分離されたセッション

エージェント `["alfred", "baerbel"]` を持つグループ `120363403215116621@g.us` では次のようになります。

<Tabs>
  <Tab title="Alfred のコンテキスト">
    ```text
    Session: agent:alfred:whatsapp:group:120363403215116621@g.us
    History: [user message, alfred's previous responses]
    Workspace: ~/openclaw-alfred/
    Tools: read, write, exec
    ```
  </Tab>
  <Tab title="Baerbel のコンテキスト">
    ```text
    Session: agent:baerbel:whatsapp:group:120363403215116621@g.us
    History: [user message, baerbel's previous responses]
    Workspace: ~/openclaw-baerbel/
    Tools: read only
    ```
  </Tab>
</Tabs>

## ユースケース

- **専門化されたエージェントチーム**: `code-reviewer`、`security-auditor`、`test-generator`、`docs-checker` が、それぞれ自分の観点から同じメッセージに回答する開発グループ。
- **多言語サポート**: `support-en`、`support-de`、`support-es` がそれぞれの言語で応答する1つのサポートチャット。
- **品質保証**: `support-agent` が回答し、`qa-agent` はレビューして問題を見つけた場合にのみ応答します。
- **タスク自動化**: `task-tracker`、`time-logger`、`report-generator` が同じステータス更新をすべて処理します。

## ベストプラクティス

<AccordionGroup>
  <Accordion title="1. エージェントの責務を絞る">
    1つの汎用的な「dev-helper」エージェントではなく、各エージェントに単一で明確な責務（`formatter`、`linter`、`tester`）を与えます。
  </Accordion>
  <Accordion title="2. 説明的な ID と名前を使う">
    ```json
    {
      "agents": {
        "list": [
          { "id": "security-scanner", "name": "Security Scanner" },
          { "id": "code-formatter", "name": "Code Formatter" },
          { "id": "test-generator", "name": "Test Generator" }
        ]
      }
    }
    ```
  </Accordion>
  <Accordion title="3. 異なるツールアクセスを設定する">
    ```json
    {
      "agents": {
        "list": [
          { "id": "reviewer", "tools": { "allow": ["read", "exec"] } },
          { "id": "fixer", "tools": { "allow": ["read", "write", "edit", "exec"] } }
        ]
      }
    }
    ```

    `reviewer` は読み取り専用です。`fixer` は読み取りと書き込みができます。

  </Accordion>
  <Accordion title="4. パフォーマンスを監視する">
    エージェントが多い場合は、`"strategy": "parallel"`（デフォルト）を優先し、ブロードキャストグループのエージェント数を少数に抑え、単純なエージェントにはより高速なモデルを使用します。
  </Accordion>
  <Accordion title="5. 失敗は分離されたままにする">
    エージェントは独立して失敗します。あるエージェントのエラーはログに記録され（`Broadcast agent <id> failed: ...`）、他のエージェントをブロックしません。
  </Accordion>
</AccordionGroup>

## 互換性

### プロバイダー

ブロードキャストグループは現在 WhatsApp（Webチャネル）のみに実装されています。他のチャネルは `broadcast` 設定を無視します。

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

- `GROUP_A`: alfred だけが応答します（通常のルーティング）。
- `GROUP_B`: agent1 と agent2 が応答します（ブロードキャスト）。

<Note>
**優先順位:** `broadcast` は通常のルートバインディングより優先されます。設定済み ACP バインディング（`bindings[].type="acp"`）は排他的です。一致した場合、OpenClaw はファンアウトブロードキャストではなく、設定済み ACP セッションにディスパッチします。
</Note>

## トラブルシューティング

<AccordionGroup>
  <Accordion title="エージェントが応答しない">
    **確認:**

    1. エージェント ID が `agents.list` に存在する（設定検証は不明な ID を拒否します）。
    2. ピア ID 形式が正しい（`120363403215116621@g.us` のようなグループ JID、または DM では `+15551234567` のような E.164）。
    3. メッセージが通常のゲートを通過している（メンション/有効化ルールは引き続き適用されます）。

    **デバッグ:**

    ```bash
    openclaw logs --follow | grep -i broadcast
    ```

    ファンアウトが成功すると、`Broadcasting message to <n> agents (<strategy>)` がログに記録されます。

  </Accordion>
  <Accordion title="1つのエージェントだけが応答する">
    **原因:** ピア ID が通常のルートバインディングには含まれているが `broadcast` には含まれていない、または排他的な設定済み ACP バインディングに一致している可能性があります。

    **修正:** 通常ルートにバインドされたピアをブロードキャスト設定に追加するか、ファンアウトブロードキャストが必要な場合は設定済み ACP バインディングを削除または変更します。

  </Accordion>
  <Accordion title="パフォーマンスの問題">
    多数のエージェントで遅い場合は、グループごとのエージェント数を減らし、より軽量なモデルを使い、サンドボックスの起動時間を確認します。
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

    グループ内の1つのコードスニペットから、フォーマット修正、セキュリティ指摘、カバレッジの不足、ドキュメントの細かな指摘という4つの返信が生成されます。

  </Accordion>
  <Accordion title="例 2: 多言語パイプライン">
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
  エージェントを処理する方法です。`parallel` はすべてのエージェントを同時に実行し、`sequential` は配列順に実行します。
</ParamField>
<ParamField path="[peerId]" type="string[]">
  WhatsApp グループ JID または E.164 電話番号です。値は、そのピアからのメッセージをすべて処理するべきエージェント ID の配列です。
</ParamField>

## 制限事項

1. **最大エージェント数:** ハードリミットはありませんが、多数のエージェント（10以上）は遅くなる可能性があります。
2. **共有コンテキスト:** エージェントは互いの応答を見ません（設計上）。
3. **メッセージ順序:** 並列応答は任意の順序で到着する可能性があります。
4. **レート制限:** すべての返信は1つの WhatsApp アカウントから送信されるため、すべてのエージェントの返信が同じ WhatsApp レート制限にカウントされます。

## 関連

- [チャネルルーティング](/ja-JP/channels/channel-routing)
- [グループ](/ja-JP/channels/groups)
- [マルチエージェントサンドボックスツール](/ja-JP/tools/multi-agent-sandbox-tools)
- [ペアリング](/ja-JP/channels/pairing)
- [セッション管理](/ja-JP/concepts/session)
