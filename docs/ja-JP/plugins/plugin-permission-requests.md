---
read_when:
    - 副作用が実行される前に確認するには、Plugin フックまたはツールが必要です
    - Plugin の承認プロンプトの配信先を設定する必要があります
    - オプションのツール、exec の承認、Plugin の承認のいずれを使用するかを決定しています
sidebarTitle: Permission requests
summary: Plugin のツール呼び出しと Plugin が管理する権限プロンプトについてユーザーに承認を求める
title: Plugin の権限リクエスト
x-i18n:
    generated_at: "2026-07-12T14:41:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 675534212e70cc7b2e7bdc801955929c6a8156b08d620483edf0133afc3bfdaa
    source_path: plugins/plugin-permission-requests.md
    workflow: 16
---

Plugin 権限リクエストを使用すると、ユーザーが許可または拒否するまで、Plugin コードがツール呼び出しや Plugin 所有の操作を一時停止できます。これは Gateway の `plugin.approval.*` フローと、チャットの承認ボタンや `/approve` コマンドを処理するものと同じ承認 UI サーフェスを使用します。

Plugin/App の権限には、Plugin 権限リクエストを使用してください。これはホストの実行承認、任意ツールの許可リスト、Codex ネイティブの権限レビューに代わるものではありません。

## 適切なゲートを選択する

必要な判断ポイントに対応するゲートを選択してください。

| ゲート                           | 使用する状況                                                             | 制御対象                                                                                                                   |
| -------------------------------- | ------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| 任意ツール                       | ユーザーがオプトインするまで、ツールをモデルに表示すべきでない場合。     | `tools.allow` を介したツールの公開。                                                                                       |
| Plugin 権限リクエスト            | Plugin フックや Plugin 所有の操作が、1 つのアクションの実行前に確認を求める必要がある場合。 | `plugin.approval.*` を介したランタイム承認。                                                                               |
| 実行承認                         | ホストコマンドやシェルに似たツールにオペレーターの承認が必要な場合。     | ホストの実行ポリシーと永続的な実行許可リスト。                                                                             |
| Codex ネイティブ権限リクエスト   | Codex がネイティブシェル、ファイル、MCP、または App Server のアクション前に確認を求める場合。 | Codex App Server またはネイティブフックの承認処理。OpenClaw がプロンプトを所有する場合は Plugin 承認を介してルーティングされます。 |
| MCP 承認要請                     | Codex MCP サーバーがツール呼び出しの承認をリクエストする場合。            | OpenClaw の Plugin 承認を介して橋渡しされる MCP 承認応答。                                                                 |

任意ツールは検出時のゲートです。Plugin 権限リクエストは呼び出しごとのゲートです。機密性の高いツールについて、モデルに表示する前の明示的なオプトインと、アクションの実行前の承認の両方が必要な場合は、両方を使用してください。

## ツール呼び出し前に承認をリクエストする

Plugin が作成するプロンプトの多くは、`before_tool_call` フックから開始する必要があります。このフックは、モデルがツールを選択した後、OpenClaw がそれを実行する前に動作します。

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
          onResolution(decision) {
            console.log(`deploy approval resolved: ${decision}`);
          },
        },
      };
    });
  },
});
```

アクションを承認する人に向けてプロンプトのテキストを記述してください。

- `title` は短く、アクションを明確に示すものにしてください。Gateway では 80 文字に制限されます。
- `description` は具体的で範囲を限定したものにしてください。Gateway では 512 文字に制限されます。
- アクション、対象、リスクを含めてください。チャットの承認サーフェスに表示すべきでないシークレット、トークン、非公開ペイロードは含めないでください。
- `severity` を省略した場合のデフォルトは `"warning"` です。誤った判断によって本番環境の損害やデータ損失が発生する可能性があるアクションに限り、`"critical"` を使用してください。
- `allowedDecisions` を省略した場合のデフォルトは `["allow-once", "allow-always", "deny"]` です。そのアクションに対する永続的な信頼が安全でない場合は、`["allow-once", "deny"]` を渡してください。
- `timeoutMs` のデフォルトは 120000（2 分）で、リクエストされた値にかかわらず上限は 600000（10 分）です。

## 判断の動作

OpenClaw は `plugin:` ID を持つ保留中の承認を作成し、利用可能な承認サーフェスに配信して、判断を待ちます。

| 判断              | 結果                                                                      |
| ----------------- | ------------------------------------------------------------------------- |
| `allow-once`      | 現在の呼び出しを続行します。                                              |
| `allow-always`    | 現在の呼び出しを続行し、判断を Plugin に渡します。                        |
| `deny`            | 拒否されたツール結果によって呼び出しをブロックします。                    |
| タイムアウト      | 呼び出しをブロックします。                                                |
| キャンセル        | 実行が中止された場合、呼び出しをブロックします。                          |
| 承認ルートなし    | 解決できる接続済み承認サーフェスがないため、呼び出しをブロックします。    |

リクエストで許可された、正確な `allow-once` と `allow-always` の判断だけが実行を許可します。不明、不正な形式、不一致、欠落、タイムアウトした判断は、すべて安全側に倒して拒否されます。従来の `timeoutBehavior` フィールドは Plugin との互換性のため引き続き受け付けられますが、非推奨で無視されます。新しいフックでは設定しないでください。

`allow-always` が永続化されるのは、リクエスト元の Plugin またはランタイムがその永続化を実装している場合に限られます。通常の `before_tool_call.requireApproval` フックでは、OpenClaw は `allow-once` と `allow-always` を現在の呼び出しに対する承認判断として扱い、解決された値を `onResolution` に渡します。Plugin で `allow-always` を提供する場合は、どの将来の呼び出しを信頼するのかを正確に文書化し、実装してください。

フックが `params` も返す場合、OpenClaw は承認が成功した後にのみ、それらのパラメーター変更を適用します。優先度の高いフックが承認をリクエストした後でも、優先度の低いフックがブロックすることがあります。

`allowedDecisions` は、ユーザーに表示されるボタンとコマンドを制限します。Gateway は、リクエストで提示されなかった判断による解決の試行を拒否します。

## 承認プロンプトをルーティングする

承認プロンプトは、ローカル UI サーフェス、または承認処理をサポートするチャットチャネルで解決できます。Plugin 承認プロンプトを明示的なチャット対象に転送するには、`approvals.plugin` を設定します。

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

`approvals.plugin` は `approvals.exec` から独立しています。実行承認の転送を有効にしても Plugin 承認プロンプトはルーティングされず、Plugin 承認の転送を有効にしてもホストの実行ポリシーは変更されません。

プロンプトに手動承認用のテキストが含まれている場合は、提示された判断のいずれかで解決してください。

```text
/approve <id> allow-once
/approve <id> allow-always
/approve <id> deny
```

転送モデル全体、同一チャット内での承認動作、ネイティブチャネル配信、チャネル固有の承認者ルールについては、[高度な実行承認](/ja-JP/tools/exec-approvals-advanced#plugin-approval-forwarding)を参照してください。

## Codex ネイティブ権限

Codex ネイティブ権限プロンプトも Plugin 承認を介して処理できますが、Plugin が作成するフックとは所有主体が異なります。

- Codex App Server の承認リクエストは、Codex のレビュー後に OpenClaw を介してルーティングされます。
- ネイティブフック `permission_request` のリレーは、そのリレーが有効な場合、`plugin.approval.request` を介して確認できます。
- Codex が `_meta.codex_approval_kind` を `"mcp_tool_call"` としてマークした場合、MCP ツール承認要請は Plugin 承認を介してルーティングされます。

Codex 固有の動作とフォールバックルールについては、[Codex ハーネスランタイム](/ja-JP/plugins/codex-harness-runtime#native-permissions-and-mcp-elicitations)を参照してください。

## トラブルシューティング

**ツールに Plugin 承認を利用できないと表示される。** リクエストを受け付けた承認 UI または設定済みの承認ルートがありません。承認に対応したクライアントを接続するか、同一チャット内の `/approve` をサポートするチャネルを使用するか、`approvals.plugin` を設定してください。

**`allow-always` が表示されるが、次の呼び出しでも再び確認される。** 汎用的な Plugin 承認フローでは、任意のフックに対する信頼は自動的に永続化されません。`onResolution("allow-always")` の後に Plugin 所有の信頼を Plugin 内で永続化するか、`allow-once` と `deny` のみを提示してください。

**`/approve` が判断を拒否する。** リクエストによって `allowedDecisions` が制限されています。プロンプトに表示された判断のいずれかを使用してください。

**Discord、Matrix、Slack、または Telegram のプロンプトが実行承認とは異なる方法でルーティングされる。** Plugin 承認と実行承認は別々の設定を使用し、異なる認可チェックを使用する場合があります。`approvals.exec` だけを確認するのではなく、`approvals.plugin` と、そのチャネルの Plugin 承認サポートを確認してください。

## 関連項目

- [Plugin フック](/ja-JP/plugins/hooks#tool-call-policy)
- [Plugin の構築](/ja-JP/plugins/building-plugins#registering-tools)
- [高度な実行承認](/ja-JP/tools/exec-approvals-advanced#plugin-approval-forwarding)
- [Gateway プロトコル](/ja-JP/gateway/protocol)
- [Codex ハーネスランタイム](/ja-JP/plugins/codex-harness-runtime#native-permissions-and-mcp-elicitations)
