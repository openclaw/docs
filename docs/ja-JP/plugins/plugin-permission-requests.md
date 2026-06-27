---
read_when:
    - 副作用が実行される前に確認するためのPluginフックまたはツールが必要です
    - Plugin 承認プロンプトの配信先を設定する必要があります
    - 任意のツール、exec 承認、Plugin 承認のどれを使うかを判断しています
sidebarTitle: Permission requests
summary: Plugin ツール呼び出しと Plugin 所有の権限プロンプトについてユーザーに承認を求める
title: Plugin 権限リクエスト
x-i18n:
    generated_at: "2026-06-27T12:20:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 72b860e9f8ddef80c70e943ec05353cbc0a917577382289649432a58c3ce6bd0
    source_path: plugins/plugin-permission-requests.md
    workflow: 16
---

Plugin 権限リクエストにより、Plugin コードはユーザーが承認または拒否するまで、ツール呼び出しや Plugin 所有の操作を一時停止できます。これらは Gateway の `plugin.approval.*` フローと、チャットの承認ボタンや `/approve` コマンドを処理する同じ承認 UI サーフェスを使用します。

Plugin 権限リクエストは、Plugin/app 権限に使用します。これらはホスト exec 承認、任意ツールの許可リスト、または Codex のネイティブ権限レビューを置き換えるものではありません。

## 適切なゲートを選ぶ

必要な判断ポイントに一致するゲートを選びます。

| ゲート                           | 使用する場面                                                             | 制御するもの                                                                                                      |
| -------------------------------- | ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| 任意ツール                       | ユーザーがオプトインするまで、ツールをモデルに見せるべきではない場合。 | `tools.allow` を通じたツール公開。                                                                               |
| Plugin 権限リクエスト            | Plugin フックや Plugin 所有の操作が、1 つのアクション実行前に確認を求める必要がある場合。 | `plugin.approval.*` を通じたランタイム承認。                                                                     |
| Exec 承認                        | ホストコマンドやシェルに似たツールにオペレーター承認が必要な場合。     | ホスト exec ポリシーと永続的な exec 許可リスト。                                                                 |
| Codex ネイティブ権限リクエスト   | Codex がネイティブのシェル、ファイル、MCP、または app-server アクションの前に確認を求める場合。 | Codex app-server またはネイティブフックの承認処理。OpenClaw がプロンプトを所有する場合は Plugin 承認経由でルーティングされます。 |
| MCP 承認要請                     | Codex MCP サーバーがツール呼び出しの承認をリクエストする場合。          | OpenClaw Plugin 承認経由でブリッジされる MCP 承認レスポンス。                                                     |

任意ツールは検出時のゲートです。Plugin 権限リクエストは呼び出しごとのゲートです。機密性の高いツールで、モデルがそれを見られるようになる前に明示的なオプトインが必要で、さらにアクション実行前に承認が必要な場合は、両方を使用します。

## ツール呼び出し前に承認をリクエストする

ほとんどの Plugin 作成プロンプトは `before_tool_call` フックで開始する必要があります。このフックは、モデルがツールを選択した後、OpenClaw がそれを実行する前に実行されます。

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

export default definePluginEntry({
  id: "deploy-policy",
  name: "Deploy Policy",
  register(api) {
    api.on("before_tool_call", async (event) => {
      if (event.toolName !== "deploy_service") {
        return;
      }

      const environment =
        typeof event.params.environment === "string" ? event.params.environment : "unknown";

      return {
        requireApproval: {
          title: "Deploy service",
          description: `Deploy service to ${environment}.`,
          severity: environment === "production" ? "critical" : "warning",
          allowedDecisions:
            environment === "production"
              ? ["allow-once", "deny"]
              : ["allow-once", "allow-always", "deny"],
          timeoutMs: 120_000,
          timeoutBehavior: "deny",
          onResolution(decision) {
            console.log(`deploy approval resolved: ${decision}`);
          },
        },
      };
    });
  },
});
```

アクションを承認する人に向けたプロンプト文を書きます。

- `title` は短く、アクションに焦点を当てます。Gateway は最大 80 文字を受け付けます。
- `description` は具体的で範囲を限定します。Gateway は最大 256 文字を受け付けます。
- アクション、対象、リスクを含めます。チャット承認サーフェスに表示すべきでないシークレット、トークン、非公開ペイロードは含めないでください。
- 誤った判断が本番環境の損害やデータ損失を引き起こし得るアクションにのみ、`severity: "critical"` を使用します。
- そのアクションに対して永続的な信頼が安全でない場合は、`allowedDecisions: ["allow-once", "deny"]` を使用します。

## 判断の動作

OpenClaw は `plugin:` ID の保留中承認を作成し、利用可能な承認サーフェスへ配信して、判断を待ちます。

| 判断              | 結果                                                                      |
| ----------------- | ------------------------------------------------------------------------- |
| `allow-once`      | 現在の呼び出しが続行されます。                                            |
| `allow-always`    | 現在の呼び出しが続行され、判断が Plugin に渡されます。                    |
| `deny`            | 呼び出しは拒否されたツール結果としてブロックされます。                    |
| タイムアウト      | `timeoutBehavior` が `"allow"` でない限り、呼び出しはブロックされます。    |
| キャンセル        | 実行が中止されると、呼び出しはブロックされます。                          |
| 承認ルートなし    | 接続済みの承認サーフェスが解決できないため、呼び出しはブロックされます。  |

`allow-always` が永続的になるのは、リクエスト元の Plugin またはランタイムがその永続化を実装している場合のみです。通常の `before_tool_call.requireApproval` フックでは、OpenClaw は `allow-once` と `allow-always` を現在の呼び出しに対する承認判断として扱い、解決された値を `onResolution` に渡します。Plugin が `allow-always` を提供する場合は、将来のどの呼び出しを信頼するのかを正確に文書化して実装してください。

フックが `params` も返す場合、OpenClaw は承認が成功した後にのみ、それらのパラメーター変更を適用します。優先度の低いフックは、優先度の高いフックが承認をリクエストした後でもブロックできます。

`allowedDecisions` は、ユーザーに表示されるボタンとコマンドを制限します。Gateway は、リクエストが提示しなかった判断での解決試行を拒否します。

## 承認プロンプトをルーティングする

承認プロンプトは、ローカル UI サーフェスまたは承認処理をサポートするチャットチャネルで解決できます。Plugin 承認プロンプトを明示的なチャット対象へ転送するには、`approvals.plugin` を設定します。

```json5
{
  approvals: {
    plugin: {
      enabled: true,
      mode: "targets",
      agentFilter: ["main"],
      targets: [{ channel: "slack", to: "U12345678" }],
    },
  },
}
```

`approvals.plugin` は `approvals.exec` から独立しています。exec 承認転送を有効にしても Plugin 承認プロンプトはルーティングされず、Plugin 承認転送を有効にしてもホスト exec ポリシーは変更されません。

プロンプトに手動承認テキストが含まれる場合は、提示された判断のいずれかで解決します。

```text
/approve <id> allow-once
/approve <id> allow-always
/approve <id> deny
```

完全な転送モデル、同一チャット承認の動作、ネイティブチャネル配信、チャネル固有の承認者ルールについては、[高度な exec 承認](/ja-JP/tools/exec-approvals-advanced#plugin-approval-forwarding) を参照してください。

## Codex ネイティブ権限

Codex ネイティブ権限プロンプトも Plugin 承認経由で流せますが、Plugin 作成フックとは所有関係が異なります。

- Codex app-server 承認リクエストは、Codex レビュー後に OpenClaw 経由でルーティングされます。
- ネイティブフック `permission_request` リレーは、そのリレーが有効な場合に `plugin.approval.request` 経由で確認できます。
- MCP ツール承認要請は、Codex が `_meta.codex_approval_kind` を `"mcp_tool_call"` としてマークした場合に Plugin 承認経由でルーティングされます。

Codex 固有の動作とフォールバックルールについては、[Codex ハーネスランタイム](/ja-JP/plugins/codex-harness-runtime#native-permissions-and-mcp-elicitations) を参照してください。

## トラブルシューティング

**ツールが Plugin 承認は利用できないと言う。** 承認 UI または設定済みの承認ルートがリクエストを受け付けていません。承認可能なクライアントを接続するか、同一チャットの `/approve` をサポートするチャネルを使用するか、`approvals.plugin` を設定してください。

**`allow-always` が表示されるが、次の呼び出しで再度プロンプトが出る。** 汎用 Plugin 承認フローは、任意のフックに対して信頼を自動的に永続化しません。`onResolution("allow-always")` の後に Plugin 所有の信頼を Plugin 内で永続化するか、`allow-once` と `deny` のみを提供してください。

**`/approve` が判断を拒否する。** リクエストが `allowedDecisions` を制限しています。プロンプトに表示された判断のいずれかを使用してください。

**Slack、Discord、Telegram、または Matrix のプロンプトが exec 承認とは異なる経路でルーティングされる。** Plugin 承認と exec 承認は別々の設定を使用し、異なる認可チェックを使用する場合があります。`approvals.exec` だけを確認するのではなく、`approvals.plugin` とチャネルの Plugin 承認サポートを確認してください。

## 関連

- [Plugin フック](/ja-JP/plugins/hooks#tool-call-policy)
- [Plugin の構築](/ja-JP/plugins/building-plugins#registering-agent-tools)
- [高度な exec 承認](/ja-JP/tools/exec-approvals-advanced#plugin-approval-forwarding)
- [Gateway プロトコル](/ja-JP/gateway/protocol)
- [Codex ハーネスランタイム](/ja-JP/plugins/codex-harness-runtime#native-permissions-and-mcp-elicitations)
