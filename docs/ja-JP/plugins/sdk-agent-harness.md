---
read_when:
    - 埋め込みagentランタイムまたはハーネスレジストリを変更している
    - バンドル済みまたは信頼されたPluginからagentハーネスを登録している
    - Codex Pluginがモデルプロバイダとどう関係するかを理解する必要がある
sidebarTitle: Agent Harness
summary: 低レベルの埋め込みagent executorを置き換えるPlugin向けの実験的SDKサーフェス
title: agentハーネスPlugin
x-i18n:
    generated_at: "2026-04-24T05:10:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: af76c2a3ebe54c87920954b58126ee59538c0e6d3d1b4ba44890c1f5079fabc2
    source_path: plugins/sdk-agent-harness.md
    workflow: 15
---

**agentハーネス** は、準備済みの1回分のOpenClaw agentターンに対する低レベルexecutorです。これはモデルプロバイダでも、チャネルでも、ツールレジストリでもありません。

このサーフェスは、バンドル済みまたは信頼されたネイティブPluginにのみ使ってください。パラメータ型が意図的に現在の埋め込みrunnerを反映しているため、この契約はまだ実験的です。

## ハーネスを使うべき場面

あるモデルファミリが独自のネイティブセッションランタイムを持っていて、通常のOpenClawプロバイダトランスポートが誤った抽象化である場合に、agentハーネスを登録します。

例:

- スレッドとCompactionを所有するネイティブcoding-agentサーバー
- ネイティブのplan/reasoning/toolイベントをストリーミングしなければならないローカルCLIまたはデーモン
- OpenClawセッショントランスクリプトに加えて独自のresume idを必要とするモデルランタイム

単に新しいLLM APIを追加するためにハーネスを登録してはなりません。通常のHTTPまたはWebSocketモデルAPIには、[プロバイダPlugin](/ja-JP/plugins/sdk-provider-plugins) を作成してください。

## コアが引き続き所有するもの

ハーネスが選択される前に、OpenClawはすでに次を解決しています:

- プロバイダとモデル
- ランタイムauth状態
- thinking levelとcontext budget
- OpenClawトランスクリプト/session file
- workspace、sandbox、tool policy
- チャネル返信コールバックとストリーミングコールバック
- モデルフォールバックとライブモデル切り替えポリシー

この分離は意図的です。ハーネスは準備済みattemptを実行するものであり、プロバイダを選んだり、チャネル配信を置き換えたり、黙ってモデルを切り替えたりはしません。

## ハーネスを登録する

**import:** `openclaw/plugin-sdk/agent-harness`

```typescript
import type { AgentHarness } from "openclaw/plugin-sdk/agent-harness";
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

const myHarness: AgentHarness = {
  id: "my-harness",
  label: "My native agent harness",

  supports(ctx) {
    return ctx.provider === "my-provider"
      ? { supported: true, priority: 100 }
      : { supported: false };
  },

  async runAttempt(params) {
    // Start or resume your native thread.
    // Use params.prompt, params.tools, params.images, params.onPartialReply,
    // params.onAgentEvent, and the other prepared attempt fields.
    return await runMyNativeTurn(params);
  },
};

export default definePluginEntry({
  id: "my-native-agent",
  name: "My Native Agent",
  description: "Runs selected models through a native agent daemon.",
  register(api) {
    api.registerAgentHarness(myHarness);
  },
});
```

## 選択ポリシー

OpenClawは、プロバイダ/モデル解決後にハーネスを選択します:

1. 既存セッションに記録されたハーネスidが優先される。これにより、config/env変更でそのトランスクリプトが別ランタイムへホットスイッチされない。
2. `OPENCLAW_AGENT_RUNTIME=<id>` は、まだ固定されていないセッションに対して、そのidの登録済みハーネスを強制する。
3. `OPENCLAW_AGENT_RUNTIME=pi` は、組み込みPIハーネスを強制する。
4. `OPENCLAW_AGENT_RUNTIME=auto` は、登録済みハーネスに対して、解決済みprovider/modelをサポートするかどうかを問い合わせる。
5. 一致する登録済みハーネスがない場合、PIフォールバックが無効でなければOpenClawはPIを使う。

Pluginハーネスの失敗は実行失敗として表面化します。`auto` モードでは、PIフォールバックは、解決済みprovider/modelをサポートする登録済みPluginハーネスが存在しない場合にのみ使われます。いったんPluginハーネスが実行をclaimした後は、OpenClawは同じターンをPI経由で再実行しません。そうするとauth/runtimeセマンティクスが変わったり、副作用が重複したりするためです。

選択されたハーネスidは、埋め込み実行後にsession idとともに永続化されます。ハーネス固定より前に作成されたlegacyセッションは、トランスクリプト履歴を持つとPI固定として扱われます。PIとネイティブPluginハーネスの間で切り替えるときは、新しい/リセットしたセッションを使ってください。`/status` には、`Fast` の横に `codex` のような非デフォルトハーネスidが表示されます。PIはデフォルト互換経路なので表示されません。選択されたハーネスが意外なら、`agents/harness` のデバッグログを有効にし、gatewayの構造化 `agent harness selected` レコードを確認してください。ここには、選択されたハーネスid、選択理由、runtime/fallbackポリシー、および `auto` モードでは各Plugin候補のsupport結果が含まれます。

バンドル済みCodex Pluginは、ハーネスidとして `codex` を登録します。コアはこれを通常のPluginハーネスidとして扱います。Codex固有のエイリアスは、共有ランタイムセレクタではなく、Pluginまたはoperator設定に属します。

## プロバイダとハーネスの組み合わせ

ほとんどのハーネスは、プロバイダも登録するべきです。プロバイダにより、モデルref、auth状態、モデルメタデータ、`/model` 選択がOpenClawの他の部分から見えるようになります。その後、ハーネスは `supports(...)` でそのプロバイダをclaimします。

バンドル済みCodex Pluginはこのパターンに従います:

- provider id: `codex`
- ユーザーモデルref: `openai/gpt-5.5` と `embeddedHarness.runtime: "codex"`。従来の `codex/gpt-*` refも互換性のため引き続き受理される
- harness id: `codex`
- auth: 合成されたプロバイダ可用性。CodexハーネスがネイティブCodex login/sessionを所有するため
- app-server request: OpenClawは生のモデルidをCodexへ送り、ハーネスにネイティブapp-serverプロトコルと通信させる

Codex Pluginは加算的です。プレーンな `openai/gpt-*` refは、`embeddedHarness.runtime: "codex"` でCodexハーネスを強制しない限り、引き続き通常のOpenClawプロバイダ経路を使います。古い `codex/gpt-*` refは、互換性のため引き続きCodex providerとハーネスを選択します。

operator設定、モデルprefix例、Codex専用設定については
[Codexハーネス](/ja-JP/plugins/codex-harness) を参照してください。

OpenClawは、Codex app-server `0.118.0` 以降を必要とします。Codex Pluginはapp-serverのinitialize handshakeをチェックし、古い、またはバージョンなしのサーバーをブロックすることで、OpenClawがテスト済みのプロトコルサーフェスに対してのみ動作するようにします。

### Codex app-server tool-result middleware

バンドル済みPluginは、manifestで `contracts.embeddedExtensionFactories: ["codex-app-server"]` を宣言している場合、`api.registerCodexAppServerExtensionFactory(...)` を通じてCodex app-server固有の `tool_result` middlewareも追加できます。これは、ツール出力がOpenClawトランスクリプトに投影される前に、ネイティブCodexハーネス内で実行する必要がある非同期tool-result変換のための、信頼済みPlugin seamです。

### ネイティブCodexハーネスモード

バンドル済み `codex` ハーネスは、埋め込みOpenClaw agentターン用のネイティブCodexモードです。まずバンドル済み `codex` Pluginを有効にし、設定で制限付きallowlistを使っている場合は `plugins.allow` に `codex` を含めてください。ネイティブapp-server設定では `embeddedHarness.runtime: "codex"` とともに `openai/gpt-*` を使ってください。PI経由でCodex OAuthを使うには、代わりに `openai-codex/*` を使います。従来の `codex/*` モデルrefは、ネイティブハーネス向けの互換エイリアスとして残ります。

このモードが動作しているとき、Codexはネイティブthread id、resume動作、Compaction、app-server実行を所有します。OpenClawは引き続き、チャットチャネル、可視トランスクリプトミラー、tool policy、approvals、メディア配信、session選択を所有します。実行をclaimできるのがCodex app-server経路だけであることを証明する必要がある場合は、`embeddedHarness.runtime: "codex"` と
`embeddedHarness.fallback: "none"` を使ってください。この設定は選択ガードにすぎません。Codex app-serverの失敗は、そもそもPI経由で再試行されず、そのまま失敗します。

## PIフォールバックを無効にする

デフォルトでは、OpenClawは `agents.defaults.embeddedHarness`
を `{ runtime: "auto", fallback: "pi" }` にして埋め込みagentを実行します。`auto` モードでは、登録済みPluginハーネスがprovider/modelペアをclaimできます。一致するものがなければ、OpenClawはPIへフォールバックします。

Pluginハーネス選択がPIを使わずに失敗すべき場面では、`fallback: "none"` を設定してください。選択済みPluginハーネスの失敗は、すでにそのままハード失敗します。これは明示的な `runtime: "pi"` や `OPENCLAW_AGENT_RUNTIME=pi` を妨げません。

Codex専用の埋め込み実行では:

```json
{
  "agents": {
    "defaults": {
      "model": "openai/gpt-5.5",
      "embeddedHarness": {
        "runtime": "codex",
        "fallback": "none"
      }
    }
  }
}
```

一致するモデルを任意の登録済みPluginハーネスにclaimさせたいが、OpenClawが黙ってPIへフォールバックするのは望まない場合は、`runtime: "auto"` のままフォールバックを無効にします:

```json
{
  "agents": {
    "defaults": {
      "embeddedHarness": {
        "runtime": "auto",
        "fallback": "none"
      }
    }
  }
}
```

エージェントごとの上書きも同じ形を使います:

```json
{
  "agents": {
    "defaults": {
      "embeddedHarness": {
        "runtime": "auto",
        "fallback": "pi"
      }
    },
    "list": [
      {
        "id": "codex-only",
        "model": "openai/gpt-5.5",
        "embeddedHarness": {
          "runtime": "codex",
          "fallback": "none"
        }
      }
    ]
  }
}
```

`OPENCLAW_AGENT_RUNTIME` は、引き続き設定済みruntimeを上書きします。環境変数からPIフォールバックを無効にするには `OPENCLAW_AGENT_HARNESS_FALLBACK=none` を使います。

```bash
OPENCLAW_AGENT_RUNTIME=codex \
OPENCLAW_AGENT_HARNESS_FALLBACK=none \
openclaw gateway run
```

フォールバック無効時には、要求されたハーネスが登録されていない、解決済みprovider/modelをサポートしない、またはターン副作用を生成する前に失敗した場合、セッションは早期に失敗します。これはCodex専用デプロイや、Codex app-server経路が実際に使用されていることを証明しなければならないライブテストでは意図された動作です。

この設定が制御するのは埋め込みagentハーネスだけです。画像、動画、音楽、TTS、PDF、その他のプロバイダ固有モデルルーティングは無効になりません。

## ネイティブセッションとトランスクリプトミラー

ハーネスは、ネイティブsession id、thread id、またはdaemon側resume tokenを保持してもよい。そのbindingはOpenClawセッションに明示的に関連付けたままにし、ユーザーに見えるassistant/tool出力はOpenClawトランスクリプトへミラーし続けてください。

OpenClawトランスクリプトは、引き続き次の互換レイヤーです:

- チャネル可視のsession history
- トランスクリプト検索とインデックス化
- 後のターンで組み込みPIハーネスへ戻すこと
- 汎用の `/new`、`/reset`、session削除動作

ハーネスがsidecar bindingを保存する場合、所有するOpenClawセッションがリセットされたときにOpenClawがそれをクリアできるよう、`reset(...)` を実装してください。

## ツールとメディア結果

コアはOpenClawツールリストを構築し、それを準備済みattemptに渡します。ハーネスが動的ツール呼び出しを実行する場合、チャネルメディアを自分で送るのではなく、ハーネス結果形状を通じてツール結果を返してください。

これにより、テキスト、画像、動画、音楽、TTS、approval、messaging-tool出力がPIバックエンド実行と同じ配信経路に保たれます。

## 現在の制限

- 公開import pathは汎用ですが、一部のattempt/result型エイリアスは互換性のために依然として `Pi` という名前を持っています。
- サードパーティハーネスのインストールは実験的です。ネイティブセッションランタイムが必要になるまでは、プロバイダPluginを優先してください。
- ハーネス切り替えはターン間ではサポートされています。ネイティブツール、approvals、assistant text、またはmessage sendが開始した後のターン途中ではハーネスを切り替えないでください。

## 関連

- [SDK概要](/ja-JP/plugins/sdk-overview)
- [ランタイムヘルパー](/ja-JP/plugins/sdk-runtime)
- [プロバイダPlugin](/ja-JP/plugins/sdk-provider-plugins)
- [Codexハーネス](/ja-JP/plugins/codex-harness)
- [モデルプロバイダ](/ja-JP/concepts/model-providers)
