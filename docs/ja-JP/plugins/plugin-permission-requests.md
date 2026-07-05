---
read_when:
    - 副作用を実行する前に確認するための Plugin フックまたはツールが必要です
    - Plugin の承認プロンプトの配信先を設定する必要があります
    - 任意ツール、exec 承認、Plugin 承認のどれを使うかを判断しています
sidebarTitle: Permission requests
summary: ユーザーにPluginツール呼び出しとPlugin所有の権限プロンプトを承認してもらう
title: Plugin 権限リクエスト
x-i18n:
    generated_at: "2026-07-05T11:40:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: aa8c26d84aef6518186e55674171bb46b3fa8710333c0da6ac16c01a78f678a7
    source_path: plugins/plugin-permission-requests.md
    workflow: 16
---

Plugin 権限リクエストにより、Plugin コードはユーザーが承認または拒否するまで、ツール呼び出しや Plugin 所有の操作を一時停止できます。これらは Gateway の `plugin.approval.*` フローと、チャット承認ボタンや `/approve` コマンドを処理する同じ承認 UI サーフェスを使用します。

Plugin/アプリ権限には Plugin 権限リクエストを使用します。これらは、ホスト exec 承認、任意ツールの許可リスト、Codex のネイティブ権限レビューを置き換えるものではありません。

## 適切なゲートを選択する

必要な判断ポイントに合うゲートを選びます。

| ゲート                           | 使用する場合                                                             | 制御する内容                                                                                                      |
| -------------------------------- | ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| 任意ツール                       | ユーザーがオプトインするまで、ツールをモデルに表示すべきでない場合。    | `tools.allow` を通じたツール公開。                                                                                |
| Plugin 権限リクエスト            | Plugin フックまたは Plugin 所有の操作が、1 回のアクション実行前に確認を求める必要がある場合。 | `plugin.approval.*` を通じたランタイム承認。                                                                      |
| Exec 承認                        | ホストコマンドまたはシェル風ツールにオペレーター承認が必要な場合。      | ホスト exec ポリシーと永続的な exec 許可リスト。                                                                  |
| Codex ネイティブ権限リクエスト   | Codex がネイティブのシェル、ファイル、MCP、または app-server アクションの前に確認を求める場合。 | Codex app-server またはネイティブフックの承認処理。OpenClaw がプロンプトを所有する場合は Plugin 承認経由でルーティングされます。 |
| MCP 承認 elicitation             | Codex MCP サーバーがツール呼び出しの承認をリクエストする場合。          | OpenClaw Plugin 承認経由でブリッジされる MCP 承認レスポンス。                                                     |

任意ツールは検出時のゲートです。Plugin 権限リクエストは呼び出しごとのゲートです。機密性の高いツールで、モデルが参照できるようになる前の明示的なオプトインと、アクション実行前の承認の両方が必要な場合は、両方を使用します。

## ツール呼び出し前に承認をリクエストする

Plugin 作成のプロンプトの多くは `before_tool_call` フックで開始するべきです。このフックは、モデルがツールを選択した後、OpenClaw がそれを実行する前に実行されます。

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

アクションを承認する人に向けてプロンプト文を書きます。

- `title` は短く、アクション中心にします。Gateway は 80 文字で上限を設けます。
- `description` は具体的で範囲を絞ります。Gateway は 256 文字で上限を設けます。
- アクション、対象、リスクを含めます。チャット承認サーフェスに表示すべきでないシークレット、トークン、またはプライベートペイロードを含めないでください。
- `severity` は省略時に `"warning"` になります。誤った判断が本番環境の損害やデータ損失を引き起こす可能性があるアクションにのみ `"critical"` を使用します。
- `allowedDecisions` は省略時に `["allow-once", "allow-always", "deny"]` になります。そのアクションで永続的な信頼が安全でない場合は `["allow-once", "deny"]` を渡します。
- `timeoutMs` はデフォルトで 120000（2 分）で、リクエストされた値にかかわらず 600000（10 分）が上限です。

## 判断の動作

OpenClaw は `plugin:` ID の保留中承認を作成し、利用可能な承認サーフェスに配信し、判断を待ちます。

| 判断              | 結果                                                                      |
| ----------------- | ------------------------------------------------------------------------- |
| `allow-once`      | 現在の呼び出しが続行されます。                                            |
| `allow-always`    | 現在の呼び出しが続行され、その判断が Plugin に渡されます。                |
| `deny`            | 呼び出しは拒否されたツール結果でブロックされます。                        |
| Timeout           | `timeoutBehavior` が `"allow"` でない限り、呼び出しはブロックされます。   |
| Cancellation      | 実行が中止されると、呼び出しはブロックされます。                          |
| 承認ルートなし    | 接続済みの承認サーフェスで解決できないため、呼び出しはブロックされます。  |

`allow-always` は、リクエスト元の Plugin またはランタイムがその永続化を実装している場合にのみ永続的です。通常の `before_tool_call.requireApproval` フックでは、OpenClaw は `allow-once` と `allow-always` を現在の呼び出しに対する承認判断として扱い、解決された値を `onResolution` に渡します。Plugin が `allow-always` を提供する場合は、今後どの呼び出しを信頼するのかを正確に文書化し、実装してください。

フックが `params` も返す場合、OpenClaw は承認が成功した後にのみ、それらのパラメーター変更を適用します。優先度の低いフックは、優先度の高いフックが承認をリクエストした後でもブロックできます。

`allowedDecisions` はユーザーに表示されるボタンとコマンドを制限します。Gateway は、リクエストが提示していない判断での解決試行を拒否します。

## 承認プロンプトをルーティングする

承認プロンプトは、ローカル UI サーフェスまたは承認処理をサポートするチャットチャンネルで解決できます。Plugin 承認プロンプトを明示的なチャット対象に転送するには、`approvals.plugin` を設定します。

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

完全な転送モデル、同一チャット承認の動作、ネイティブチャンネル配信、チャンネル固有の承認者ルールについては、[高度な exec 承認](/ja-JP/tools/exec-approvals-advanced#plugin-approval-forwarding)を参照してください。

## Codex ネイティブ権限

Codex ネイティブ権限プロンプトも Plugin 承認経由で移動できますが、Plugin 作成フックとは所有権が異なります。

- Codex app-server 承認リクエストは、Codex レビュー後に OpenClaw 経由でルーティングされます。
- ネイティブフック `permission_request` リレーは、そのリレーが有効な場合に `plugin.approval.request` 経由で確認できます。
- MCP ツール承認 elicitation は、Codex が `_meta.codex_approval_kind` を `"mcp_tool_call"` としてマークした場合に Plugin 承認経由でルーティングされます。

Codex 固有の動作とフォールバックルールについては、[Codex ハーネスランタイム](/ja-JP/plugins/codex-harness-runtime#native-permissions-and-mcp-elicitations)を参照してください。

## トラブルシューティング

**ツールが Plugin 承認を利用できないと言います。** 承認 UI または設定済み承認ルートがリクエストを受け入れませんでした。承認可能なクライアントを接続するか、同一チャットの `/approve` をサポートするチャンネルを使用するか、`approvals.plugin` を設定してください。

**`allow-always` が表示されるのに、次の呼び出しで再度プロンプトが出ます。** 汎用 Plugin 承認フローは、任意のフックに対する信頼を自動的には永続化しません。`onResolution("allow-always")` の後に Plugin 所有の信頼を Plugin 内で永続化するか、`allow-once` と `deny` のみを提示してください。

**`/approve` が判断を拒否します。** リクエストが `allowedDecisions` を制限しています。プロンプトに出力された判断のいずれかを使用してください。

**Discord、Matrix、Slack、または Telegram のプロンプトが exec 承認とは異なる方法でルーティングされます。** Plugin 承認と exec 承認は別々の設定を使用し、異なる認可チェックを使用する場合があります。`approvals.exec` だけを確認するのではなく、`approvals.plugin` とチャンネルの Plugin 承認サポートを確認してください。

## 関連

- [Plugin フック](/ja-JP/plugins/hooks#tool-call-policy)
- [Plugin の構築](/ja-JP/plugins/building-plugins#registering-tools)
- [高度な exec 承認](/ja-JP/tools/exec-approvals-advanced#plugin-approval-forwarding)
- [Gateway プロトコル](/ja-JP/gateway/protocol)
- [Codex ハーネスランタイム](/ja-JP/plugins/codex-harness-runtime#native-permissions-and-mcp-elicitations)
