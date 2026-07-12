---
read_when:
    - ブロードキャストグループの設定
    - WhatsApp でのマルチエージェント返信のデバッグ
sidebarTitle: Broadcast groups
status: experimental
summary: WhatsAppメッセージを複数のエージェントに一斉送信する
title: ブロードキャストグループ
x-i18n:
    generated_at: "2026-07-11T21:59:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2771c15b31592f11293385498b9c89decf84747a9172caafb994a5dca4bbdc06
    source_path: channels/broadcast-groups.md
    workflow: 16
---

<Note>
**ステータス:** 実験的機能。2026.1.9 で追加。WhatsApp（Web チャネル）のみ。
</Note>

## 概要

ブロードキャストグループは、同じ受信メッセージに対して**複数のエージェント**を実行します。各エージェントはそれぞれ独立したセッションでメッセージを処理し、個別に返信を投稿します。そのため、1 つの WhatsApp 番号で、単一のグループチャットまたは DM 内に専門エージェントのチームを構成できます。

ブロードキャストグループは、チャネルの許可リストとグループのアクティベーションルールの適用後に評価されます。WhatsApp グループでは、通常なら OpenClaw が返信する場合（たとえば、グループ設定に応じてメンションされた場合）にブロードキャストが行われます。変更されるのは**どのエージェントが実行されるか**だけであり、メッセージが処理対象になるかどうかは変わりません。

稼働中の WhatsApp QA レーンには `whatsapp-broadcast-group-fanout` が含まれており、メンションを含む 1 件のグループメッセージから、設定された 2 つのエージェントによる別々の返信が表示されることを検証します。

## 設定

### 基本設定

トップレベルに `broadcast` セクションを追加します（`bindings` と同じ階層）。キーは WhatsApp のピア ID、値はエージェント ID の配列です。

- グループチャット: グループ JID（例: `120363403215116621@g.us`）
- DM: 送信者の E.164 電話番号（例: `+15551234567`）

```json
{
  "broadcast": {
    "120363403215116621@g.us": ["alfred", "baerbel", "assistant3"]
  }
}
```

**結果:** このチャットで通常なら OpenClaw が返信する場合、3 つのエージェントがすべて実行されます。

指定するすべてのエージェント ID は `agents.list` に存在する必要があります。設定検証で不明な ID が報告され、実行時には `Broadcast agent <id> not found in agents.list; skipping` という警告とともにスキップされます。

### 処理戦略

`broadcast.strategy` は、エージェントがメッセージを処理する方法を設定します。

| 戦略                   | 動作                                                               |
| -------------------- | --------------------------------------------------------------------- |
| `parallel`（デフォルト） | すべてのエージェントが同時に処理し、返信は任意の順序で届きます。       |
| `sequential`         | エージェントは配列順に処理し、それぞれ前の処理の完了を待ちます。 |

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
  <Step title="受信メッセージの到着">
    WhatsApp のグループまたは DM のメッセージが到着します。
  </Step>
  <Step title="ルーティングと受け入れ判定">
    OpenClaw はチャネルの許可リスト、グループのアクティベーションルール、設定された ACP バインディングの所有権を適用します。
  </Step>
  <Step title="ブロードキャストの確認">
    設定された ACP バインディングがルートを所有していない場合、OpenClaw はピア ID が `broadcast` に含まれているかを確認します。
  </Step>
  <Step title="ブロードキャストが適用される場合">
    - 指定されたすべてのエージェントがメッセージを処理します。
    - 各エージェントは独自のセッションキーと分離されたコンテキストを持ちます。
    - エージェントは並列（デフォルト）または逐次的に処理します。
    - 音声添付ファイルはファンアウト前に一度だけ文字起こしされるため、エージェントごとに個別の STT 呼び出しを行わず、1 つの文字起こし結果を共有します。

  </Step>
  <Step title="ブロードキャストが適用されない場合">
    OpenClaw は通常のルート、またはルーティング中に選択された設定済み ACP セッションルートにディスパッチします。
  </Step>
</Steps>

<Note>
ブロードキャストグループは、チャネルの許可リストやグループのアクティベーションルール（メンション、コマンドなど）を迂回しません。メッセージが処理対象となった場合に、_どのエージェントが実行されるか_だけを変更します。
</Note>

### セッションの分離

ブロードキャストグループ内の各エージェントは、以下を完全に分離して保持します。

- **セッションキー**（`agent:alfred:whatsapp:group:120363...` と `agent:baerbel:whatsapp:group:120363...`）
- **会話履歴**（エージェントは他のエージェントの返信を参照しません）
- **ワークスペース**（設定されている場合は個別のサンドボックス）
- **ツールアクセス**（異なる許可リストと拒否リスト）
- **メモリ／コンテキスト**（個別の `IDENTITY.md`、`SOUL.md` など）

意図的に共有される例外が 1 つあります。**グループコンテキストバッファー**（コンテキストに使用する最近のグループメッセージ）はピアごとに共有されるため、トリガーされたすべてのブロードキャストエージェントが同じコンテキストを参照します。ファンアウトの完了後に一度だけクリアされます。

これにより、エージェントごとに異なる人格、モデル、スキル、ツールアクセス（たとえば読み取り専用と読み書き可能）を設定できます。

### 例: 分離されたセッション

エージェント `["alfred", "baerbel"]` を持つグループ `120363403215116621@g.us` の場合:

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

- **専門エージェントチーム**: `code-reviewer`、`security-auditor`、`test-generator`、`docs-checker` が、それぞれ独自の観点から同じメッセージに回答する開発グループ。
- **多言語サポート**: `support-en`、`support-de`、`support-es` がそれぞれの言語で応答する単一のサポートチャット。
- **品質保証**: `support-agent` が回答し、`qa-agent` がレビューして問題を発見した場合にのみ応答します。
- **タスク自動化**: `task-tracker`、`time-logger`、`report-generator` がすべて同じステータス更新を処理します。

## ベストプラクティス

<AccordionGroup>
  <Accordion title="1. エージェントの役割を絞る">
    汎用的な「dev-helper」エージェントを 1 つ用意するのではなく、各エージェントに単一で明確な責任（`formatter`、`linter`、`tester`）を割り当てます。
  </Accordion>
  <Accordion title="2. 説明的な ID と名前を使用する">
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

    `reviewer` は読み取り専用です。`fixer` は読み書きできます。

  </Accordion>
  <Accordion title="4. パフォーマンスを監視する">
    エージェントが多い場合は `"strategy": "parallel"`（デフォルト）を優先し、ブロードキャストグループ内のエージェント数を少数に抑え、単純なエージェントにはより高速なモデルを使用します。
  </Accordion>
  <Accordion title="5. 障害を分離する">
    エージェントは独立して失敗します。1 つのエージェントのエラーはログに記録され（`Broadcast agent <id> failed: ...`）、他のエージェントを妨げません。
  </Accordion>
</AccordionGroup>

## 互換性

### プロバイダー

ブロードキャストグループは現在、WhatsApp（Web チャネル）でのみ実装されています。他のチャネルは `broadcast` 設定を無視します。

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

- `GROUP_A`: alfred のみが応答します（通常のルーティング）。
- `GROUP_B`: agent1 と agent2 の両方が応答します（ブロードキャスト）。

<Note>
**優先順位:** `broadcast` は通常のルートバインディングより優先されます。設定された ACP バインディング（`bindings[].type="acp"`）は排他的です。一致するバインディングがある場合、OpenClaw はファンアウトブロードキャストではなく、設定された ACP セッションにディスパッチします。
</Note>

## トラブルシューティング

<AccordionGroup>
  <Accordion title="エージェントが応答しない">
    **確認事項:**

    1. エージェント ID が `agents.list` に存在すること（設定検証で不明な ID は拒否されます）。
    2. ピア ID の形式が正しいこと（グループの場合は `120363403215116621@g.us` のような JID、DM の場合は `+15551234567` のような E.164）。
    3. メッセージが通常のゲート判定を通過していること（メンション／アクティベーションルールは引き続き適用されます）。

    **デバッグ:**

    ```bash
    openclaw logs --follow | grep -i broadcast
    ```

    ファンアウトに成功すると、`Broadcasting message to <n> agents (<strategy>)` がログに記録されます。

  </Accordion>
  <Accordion title="1 つのエージェントしか応答しない">
    **原因:** ピア ID が通常のルートバインディングには含まれているものの `broadcast` には含まれていないか、排他的な設定済み ACP バインディングに一致している可能性があります。

    **修正:** 通常のルートにバインドされているピアをブロードキャスト設定に追加するか、ファンアウトブロードキャストを使用する場合は設定済み ACP バインディングを削除または変更します。

  </Accordion>
  <Accordion title="パフォーマンスの問題">
    多数のエージェントで処理が遅い場合は、グループあたりのエージェント数を減らし、軽量なモデルを使用し、サンドボックスの起動時間を確認してください。
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

    グループ内の 1 つのコードスニペットに対して、フォーマット修正、セキュリティ上の指摘、カバレッジの不足、ドキュメント上の軽微な指摘という 4 つの返信が生成されます。

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
  WhatsApp グループ JID または E.164 電話番号です。値は、そのピアからのメッセージをすべて処理するエージェント ID の配列です。
</ParamField>

## 制限事項

1. **最大エージェント数:** ハードリミットはありませんが、多数のエージェント（10 以上）では処理が遅くなる可能性があります。
2. **共有コンテキスト:** 設計上、エージェントは互いの応答を参照しません。
3. **メッセージの順序:** 並列処理の応答は任意の順序で届く可能性があります。
4. **レート制限:** すべての返信は 1 つの WhatsApp アカウントから送信されるため、各エージェントの返信は同じ WhatsApp のレート制限に算入されます。

## 関連項目

- [チャネルルーティング](/ja-JP/channels/channel-routing)
- [グループ](/ja-JP/channels/groups)
- [マルチエージェントサンドボックスツール](/ja-JP/tools/multi-agent-sandbox-tools)
- [ペアリング](/ja-JP/channels/pairing)
- [セッション管理](/ja-JP/concepts/session)
