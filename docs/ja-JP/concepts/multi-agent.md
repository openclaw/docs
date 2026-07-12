---
read_when: You want multiple agents with separate workspaces, auth, and sessions in one Gateway process.
sidebarTitle: Multi-agent routing
status: active
summary: マルチエージェントルーティング：エージェントの境界、チャネルアカウント、バインディング
title: マルチエージェントルーティング
x-i18n:
    generated_at: "2026-07-12T14:29:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 265a1f3d9d9b4957c99c71f391ce4f5abba6b70561570f8bbe8cb9964ece1cfc
    source_path: concepts/multi-agent.md
    workflow: 16
---

1 つの Gateway プロセスで複数の_分離された_エージェントを実行します。各エージェントは独自のワークスペース、状態ディレクトリ（`agentDir`）、SQLite ベースのセッション履歴を持ち、さらに複数のチャネルアカウント（例: 2 つの WhatsApp 番号）を使用できます。受信メッセージは、**バインディング**を通じて適切なエージェントにルーティングされます。

**エージェント**とは、ペルソナごとの完全なスコープです。これには、ワークスペースファイル、認証プロファイル、モデルレジストリ、セッションストアが含まれます。**バインディング**は、チャネルアカウント（Slack ワークスペース、WhatsApp 番号など）をいずれかのエージェントにマッピングします。

## 1 つのエージェントとは

各エージェントには、以下がそれぞれ用意されます。

- **ワークスペース**: ファイル、`AGENTS.md`/`SOUL.md`/`USER.md`、ローカルノート、ペルソナルール。
- **状態ディレクトリ**（`agentDir`）: 認証プロファイル、モデルレジストリ、エージェントごとの設定。
- **セッションストア**: `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite` に保存されるチャット履歴とルーティング状態。

認証プロファイルはエージェントごとに管理され、以下から読み込まれます。

```text
~/.openclaw/agents/<agentId>/agent/auth-profiles.json
```

<Note>
`sessions_history` は、セッションをまたいで履歴を参照するためのより安全な方法です。未加工のトランスクリプトをそのまま出力するのではなく、範囲が制限され、機密情報が除去されたビューを返します。思考ブロックの署名、ツール結果ペイロードの詳細、`<relevant-memories>` の足場、ツール呼び出し XML タグ（`<tool_call>`、`<function_call>`、およびそれらの複数形やダウングレード形式）、MiniMax のツール呼び出し XML を除去したうえで、出力を切り詰め、バイトサイズで上限を設定します。
</Note>

<Warning>
複数のエージェントで `agentDir` を再利用しないでください。認証状態やセッション状態が衝突します。セカンダリエージェントのローカル OAuth 認証情報が期限切れになった場合、または更新に失敗した場合、OpenClaw は同じプロファイル ID を持つデフォルト／メインエージェントの認証情報を参照し、より新しい方のトークンを採用します。このとき、更新トークンはセカンダリエージェントのストアにコピーされません。完全に独立した OAuth アカウントを使用する場合は、そのエージェントからサインインしてください。認証情報を手動でコピーする場合は、移植可能な静的 `api_key` または `token` プロファイルだけをコピーしてください。OAuth 更新情報はデフォルトでは移植できません（`copyToAgents` を使用すると、プロファイルを明示的に対象に含められます）。
</Warning>

Skills は各エージェントのワークスペースと `~/.openclaw/skills` などの共有ルートから読み込まれ、その後、有効なエージェントの Skills 許可リストによってフィルタリングされます。共有ベースラインには `agents.defaults.skills` を使用し、エージェントごとの置き換えには `agents.list[].skills` を使用します（明示的なエントリはデフォルトを置き換え、マージはされません）。[Skills: エージェントごとと共有の違い](/ja-JP/tools/skills#per-agent-vs-shared-skills)および[Skills: エージェント許可リスト](/ja-JP/tools/skills#agent-allowlists)を参照してください。

Plugin が所有するストレージは、その Plugin の設定に従います。2 つ目のエージェントを追加しても、
すべてのグローバル Plugin ストアが自動的に分割されるわけではありません。たとえば、ペルソナ間で
コンパイル済み Wiki ナレッジを共有してはならない場合は、
[エージェントごとの Memory Wiki ボールト](/ja-JP/concepts/multi-agent#per-agent-memory-wiki-vaults)
を設定してください。

<Note>
**ワークスペースに関する注意:** 各エージェントのワークスペースは**デフォルトの cwd**であり、厳密なサンドボックスではありません。相対パスはワークスペース内で解決されますが、サンドボックスが有効でない限り、絶対パスを使用するとホスト上の別の場所にアクセスできます。[サンドボックス化](/ja-JP/gateway/sandboxing)を参照してください。
</Note>

## パス

| 対象                             | デフォルト                                                                                | 上書き                                                                                 |
| -------------------------------- | -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| 設定                           | `~/.openclaw/openclaw.json`                                                            | `OPENCLAW_CONFIG_PATH`                                                                   |
| 状態ディレクトリ                        | `~/.openclaw`                                                                          | `OPENCLAW_STATE_DIR`                                                                     |
| デフォルトエージェントのワークスペース        | `~/.openclaw/workspace`（`OPENCLAW_PROFILE` が設定されている場合は `workspace-<profile>`）      | `agents.list[].workspace`、次に `agents.defaults.workspace`、または `OPENCLAW_WORKSPACE_DIR` |
| その他のエージェントのワークスペース          | `<stateDir>/workspace-<agentId>`（設定されている場合は `<agents.defaults.workspace>/<agentId>`） | `agents.list[].workspace`                                                                |
| エージェントディレクトリ                        | `~/.openclaw/agents/<agentId>/agent`                                                   | `agents.list[].agentDir`                                                                 |
| セッションとトランスクリプト         | `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`                             | —                                                                                        |
| レガシー／アーカイブセッション成果物 | `~/.openclaw/agents/<agentId>/sessions`                                                | —                                                                                        |

### 単一エージェントモード（デフォルト）

何も設定しない場合、OpenClaw は 1 つのエージェントを実行します。

- `agentId` のデフォルトは `main` です。
- セッションキーは `agent:main:<mainKey>` です（`mainKey` のデフォルトは `main`）。
- ワークスペースのデフォルトは `~/.openclaw/workspace` です（`OPENCLAW_PROFILE` が `default` 以外に設定されている場合は `workspace-<profile>`）。
- 状態のデフォルトは `~/.openclaw/agents/main/agent` です。

## エージェントヘルパー

新しい分離エージェントを追加します。

```bash
openclaw agents add work
```

フラグ: `--workspace <dir>`、`--model <id>`、`--agent-dir <dir>`、`--bind <channel[:accountId]>`（繰り返し指定可能）、`--non-interactive`（`--workspace` が必要）。

受信メッセージをルーティングするために `bindings` を追加し（ウィザードからも設定できます）、次に確認します。

```bash
openclaw agents list --bindings
```

## クイックスタート

<Steps>
  <Step title="各エージェントのワークスペースを作成する">
    ```bash
    openclaw agents add coding
    openclaw agents add social
    ```

    各エージェントには、`SOUL.md`、`AGENTS.md`、およびオプションの `USER.md` を含む独自のワークスペースに加えて、専用の `agentDir` と `~/.openclaw/agents/<agentId>` 配下のセッションストアが作成されます。

  </Step>
  <Step title="チャネルアカウントを作成する">
    使用するチャネルで、エージェントごとに 1 つのアカウントを作成します。

    - Discord: エージェントごとに 1 つのボットを作成し、Message Content Intent を有効にして、各トークンをコピーします。
    - Telegram: BotFather を使用してエージェントごとに 1 つのボットを作成し、各トークンをコピーします。
    - WhatsApp: アカウントごとに各電話番号をリンクします。

    ```bash
    openclaw channels login --channel whatsapp --account work
    ```

    チャネルガイドを参照してください: [Discord](/ja-JP/channels/discord)、[Telegram](/ja-JP/channels/telegram)、[WhatsApp](/ja-JP/channels/whatsapp)。

  </Step>
  <Step title="エージェント、アカウント、バインディングを追加する">
    `agents.list` にエージェントを、`channels.<channel>.accounts` にチャネルアカウントを追加し、`bindings` で接続します（以下に例を示します）。
  </Step>
  <Step title="再起動して確認する">
    ```bash
    openclaw gateway restart
    openclaw agents list --bindings
    openclaw channels status --probe
    ```
  </Step>
</Steps>

## 複数のエージェント、複数のペルソナ

設定された各 `agentId` は、コアエージェント状態に対する個別のペルソナ境界になります。

- チャネルごとに異なるアカウント（`accountId` ごと）。
- 異なるパーソナリティ（エージェントごとの `AGENTS.md`/`SOUL.md`）。
- 認証とセッションを分離し、エージェント間のアクセスは明示的な機能または Plugin 設定を通じてのみ有効化。

これにより、コアエージェント状態を分離したまま、複数のユーザーが 1 つの Gateway を共有できます。

## エージェントごとの Memory Wiki ボールト

Memory Wiki はデフォルトで 1 つのグローバルボールトを使用します。サポートエージェントの
コンパイル済みナレッジをマーケティングエージェントのものと分離するには、
`plugins.entries.memory-wiki.config.vault.scope` を `agent` に設定します。

```json5
{
  plugins: {
    entries: {
      "memory-wiki": {
        enabled: true,
        config: {
          vault: {
            scope: "agent",
            path: "~/.openclaw/wiki",
          },
        },
      },
    },
  },
}
```

設定されたパスは親ディレクトリです。OpenClaw は正規化された
エージェント ID を追加し、`~/.openclaw/wiki/support` や
`~/.openclaw/wiki/marketing` などのパスを生成します。複数のエージェントが設定されている場合、
エージェントスコープの CLI および Gateway 操作ではエージェントを明示的に指定する必要があります。
ブリッジのフィルタリング、移行、信頼境界の詳細については、
[エージェントごとの Memory Wiki ボールト](/ja-JP/plugins/memory-wiki#per-agent-vaults)を参照してください。

## エージェント間の QMD メモリ検索

あるエージェントが別のエージェントの QMD セッショントランスクリプトを検索できるようにするには、`agents.list[].memorySearch.qmd.extraCollections` に追加コレクションを設定します。すべてのエージェントで同じコレクションを共有する場合は、`agents.defaults.memorySearch.qmd.extraCollections` を使用します。

```json5
{
  agents: {
    defaults: {
      workspace: "~/workspaces/main",
      memorySearch: {
        qmd: {
          extraCollections: [{ path: "~/agents/family/sessions", name: "family-sessions" }],
        },
      },
    },
    list: [
      {
        id: "main",
        workspace: "~/workspaces/main",
        memorySearch: {
          qmd: {
            extraCollections: [{ path: "notes" }], // ワークスペース内で解決される -> "notes-main" という名前のコレクション
          },
        },
      },
      { id: "family", workspace: "~/workspaces/family" },
    ],
  },
  memory: {
    backend: "qmd",
    qmd: { includeDefaultMemory: false },
  },
}
```

追加コレクションのパスはエージェント間で共有できますが、パスがエージェントのワークスペース外にある場合、その `name` は引き続き明示的に指定します。ワークスペース内のパスはエージェントスコープのままとなるため、各エージェントは独自のトランスクリプト検索セットを維持できます。

## 1 つの WhatsApp 番号を複数人で使用する（DM の分割）

**1 つ**の WhatsApp アカウント上で、送信者の E.164（`+15551234567`）を `peer.kind: "direct"` と照合することで、異なる WhatsApp DM を異なるエージェントにルーティングします。返信は引き続き同じ WhatsApp 番号から送信され、エージェントごとの送信者 ID はありません。

<Note>
ダイレクトチャットはデフォルトでエージェントのメインセッションキーに集約されるため、完全に分離するには 1 人につき 1 つのエージェントが必要です。
</Note>

```json5
{
  agents: {
    list: [
      { id: "alex", workspace: "~/.openclaw/workspace-alex" },
      { id: "mia", workspace: "~/.openclaw/workspace-mia" },
    ],
  },
  bindings: [
    {
      agentId: "alex",
      match: { channel: "whatsapp", peer: { kind: "direct", id: "+15551230001" } },
    },
    {
      agentId: "mia",
      match: { channel: "whatsapp", peer: { kind: "direct", id: "+15551230002" } },
    },
  ],
  channels: {
    whatsapp: {
      dmPolicy: "allowlist",
      allowFrom: ["+15551230001", "+15551230002"],
    },
  },
}
```

DM アクセス制御（ペアリング／許可リスト）は、エージェントごとではなく WhatsApp アカウントごとにグローバルです。共有グループの場合は、グループを 1 つのエージェントにバインドするか、[ブロードキャストグループ](/ja-JP/channels/broadcast-groups)を使用してください。

## ルーティングルール

バインディングは決定的であり、最も具体的なものが優先されます。完全な階層順序（完全一致するピア、親ピア、ピアワイルドカード、ギルド＋ロール、ギルド、チーム、アカウント、チャネル、デフォルトエージェント）については、[チャネルルーティング](/ja-JP/channels/channel-routing#routing-rules-how-an-agent-is-chosen)を参照してください。ここでは、特に重要なルールをいくつか示します。

- 同じ階層内で複数のバインディングが一致した場合、設定順で最初のものが優先されます。
- バインディングに複数の照合フィールド（たとえば `peer` + `guildId`）が設定されている場合、指定されたすべてのフィールドが一致する必要があります（`AND` セマンティクス）。
- `accountId` を省略したバインディングは、すべてのアカウントではなくデフォルトアカウントのみに一致します。チャネル全体のフォールバックには `accountId: "*"` を使用し、1 つのアカウントには `accountId: "<name>"` を使用します。同じバインディングを明示的なアカウント ID とともに再度追加すると、重複するのではなく、既存のチャネルのみのバインディングが更新されます。

## 複数のアカウント／電話番号

複数のアカウントをサポートするチャネル（WhatsApp など）は、各ログインを識別するために `accountId` を使用します。各 `accountId` はそれぞれのエージェントにルーティングされるため、1 つのサーバーでセッションを混在させずに複数の電話番号をホストできます。

`accountId` が省略された場合に使用するアカウントを選択するには、`channels.<channel>.defaultAccount` を設定します。未設定の場合、OpenClaw は `default` が存在すればそれを使用し、存在しなければ設定済みのアカウント ID を並べ替えたうえで最初のものを使用します。

複数アカウントをサポートするチャネル: `discord`、`feishu`、`googlechat`、`imessage`、`irc`、`line`、`mattermost`、`matrix`、`nextcloud-talk`、`nostr`、`signal`、`slack`、`telegram`、`whatsapp`、`zalo`、`zalouser`。

## 概念

- `agentId`: 1 つの「頭脳」（ワークスペース、エージェント単位の認証、エージェント単位のセッションストア）。
- `accountId`: 1 つのチャネルアカウントインスタンス（例: WhatsApp アカウントの `personal` と `biz`）。
- `binding`: `(channel, accountId, peer)` に基づいて受信メッセージを `agentId` にルーティングし、必要に応じてギルド ID やチーム ID も使用します。
- ダイレクトチャットは `agent:<agentId>:<mainKey>` に集約されます（エージェント単位の「メイン」。`session.mainKey` を参照）。

## プラットフォーム別の例

<AccordionGroup>
  <Accordion title="エージェントごとの Discord ボット">
    各 Discord ボットアカウントは一意の `accountId` に対応します。各アカウントをエージェントにバインドし、ボットごとに許可リストを設定します。

    ```json5
    {
      agents: {
        list: [
          { id: "main", workspace: "~/.openclaw/workspace-main" },
          { id: "coding", workspace: "~/.openclaw/workspace-coding" },
        ],
      },
      bindings: [
        { agentId: "main", match: { channel: "discord", accountId: "default" } },
        { agentId: "coding", match: { channel: "discord", accountId: "coding" } },
      ],
      channels: {
        discord: {
          groupPolicy: "allowlist",
          accounts: {
            default: {
              token: "DISCORD_BOT_TOKEN_MAIN",
              guilds: {
                "123456789012345678": {
                  channels: {
                    "222222222222222222": { allow: true, requireMention: false },
                  },
                },
              },
            },
            coding: {
              token: "DISCORD_BOT_TOKEN_CODING",
              guilds: {
                "123456789012345678": {
                  channels: {
                    "333333333333333333": { allow: true, requireMention: false },
                  },
                },
              },
            },
          },
        },
      },
    }
    ```

    - 各ボットをギルドに招待し、Message Content Intent を有効にします。
    - トークンは `channels.discord.accounts.<id>.token` に保存します（デフォルトアカウントでは `DISCORD_BOT_TOKEN` を使用できます）。

  </Accordion>
  <Accordion title="エージェントごとの Telegram ボット">
    ```json5
    {
      agents: {
        list: [
          { id: "main", workspace: "~/.openclaw/workspace-main" },
          { id: "alerts", workspace: "~/.openclaw/workspace-alerts" },
        ],
      },
      bindings: [
        { agentId: "main", match: { channel: "telegram", accountId: "default" } },
        { agentId: "alerts", match: { channel: "telegram", accountId: "alerts" } },
      ],
      channels: {
        telegram: {
          accounts: {
            default: {
              botToken: "123456:ABC...",
              dmPolicy: "pairing",
            },
            alerts: {
              botToken: "987654:XYZ...",
              dmPolicy: "allowlist",
              allowFrom: ["tg:123456789"],
            },
          },
        },
      },
    }
    ```

    - BotFather でエージェントごとに 1 つのボットを作成し、それぞれのトークンをコピーします。
    - トークンは `channels.telegram.accounts.<id>.botToken` に保存します（デフォルトアカウントでは `TELEGRAM_BOT_TOKEN` を使用できます）。
    - 同じ Telegram グループで複数のボットを使用する場合は、各ボットを招待し、応答させるボットをメンションします。
    - 各グループボットで BotFather の Privacy Mode を無効にし（`/setprivacy` -> Disable）、Telegram が設定を適用できるようにボットを一度削除してから再追加します。
    - `channels.telegram.groups` でグループを許可するか、信頼できるグループ環境でのみ `groupPolicy: "open"` を使用します。
    - 送信者のユーザー ID は `groupAllowFrom` に指定します。グループ ID とスーパーグループ ID は `groupAllowFrom` ではなく `channels.telegram.groups` に指定します。
    - 各ボットが専用のエージェントにルーティングされるよう、`accountId` でバインドします。

  </Accordion>
  <Accordion title="エージェントごとの WhatsApp 番号">
    Gateway を起動する前に各アカウントをリンクします。

    ```bash
    openclaw channels login --channel whatsapp --account personal
    openclaw channels login --channel whatsapp --account biz
    ```

    `~/.openclaw/openclaw.json`（JSON5）:

    ```js
    {
      agents: {
        list: [
          {
            id: "home",
            default: true,
            name: "Home",
            workspace: "~/.openclaw/workspace-home",
            agentDir: "~/.openclaw/agents/home/agent",
          },
          {
            id: "work",
            name: "Work",
            workspace: "~/.openclaw/workspace-work",
            agentDir: "~/.openclaw/agents/work/agent",
          },
        ],
      },

      // 決定論的ルーティング: 最初に一致したものが優先されます（具体性の高いものを先に配置）。
      bindings: [
        { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
        { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },

        // ピア単位の上書き（任意。例: 特定のグループを仕事用エージェントに送信）。
        {
          agentId: "work",
          match: {
            channel: "whatsapp",
            accountId: "personal",
            peer: { kind: "group", id: "1203630...@g.us" },
          },
        },
      ],

      // デフォルトでは無効: エージェント間メッセージングは明示的に有効化し、許可リストに登録する必要があります。
      tools: {
        agentToAgent: {
          enabled: false,
          allow: ["home", "work"],
        },
      },

      channels: {
        whatsapp: {
          accounts: {
            personal: {
              // 任意の上書き。デフォルト: ~/.openclaw/credentials/whatsapp/personal
              // authDir: "~/.openclaw/credentials/whatsapp/personal",
            },
            biz: {
              // 任意の上書き。デフォルト: ~/.openclaw/credentials/whatsapp/biz
              // authDir: "~/.openclaw/credentials/whatsapp/biz",
            },
          },
        },
      },
    }
    ```

  </Accordion>
</AccordionGroup>

## 一般的なパターン

<Tabs>
  <Tab title="日常用の WhatsApp + 集中作業用の Telegram">
    チャネル別に分割します。WhatsApp は高速な日常用エージェントに、Telegram は Opus エージェントにルーティングします。

    ```json5
    {
      agents: {
        list: [
          {
            id: "chat",
            name: "Everyday",
            workspace: "~/.openclaw/workspace-chat",
            model: "anthropic/claude-sonnet-4-6",
          },
          {
            id: "opus",
            name: "Deep Work",
            workspace: "~/.openclaw/workspace-opus",
            model: "anthropic/claude-opus-4-6",
          },
        ],
      },
      bindings: [
        { agentId: "chat", match: { channel: "whatsapp", accountId: "*" } },
        { agentId: "opus", match: { channel: "telegram", accountId: "*" } },
      ],
    }
    ```

    これらの例では `accountId: "*"` を使用しているため、後からアカウントを追加してもバインディングは引き続き機能します。その他を chat に維持したまま、1 つの DM またはグループだけを Opus にルーティングするには、そのピア用の `match.peer` バインディングを追加します。ピアの一致は常にチャネル全体のルールより優先されます。

  </Tab>
  <Tab title="同じチャネルで 1 つのピアだけを Opus に">
    WhatsApp は高速なエージェントに維持しつつ、1 つの DM だけを Opus にルーティングします。

    ```json5
    {
      agents: {
        list: [
          {
            id: "chat",
            name: "Everyday",
            workspace: "~/.openclaw/workspace-chat",
            model: "anthropic/claude-sonnet-4-6",
          },
          {
            id: "opus",
            name: "Deep Work",
            workspace: "~/.openclaw/workspace-opus",
            model: "anthropic/claude-opus-4-6",
          },
        ],
      },
      bindings: [
        {
          agentId: "opus",
          match: { channel: "whatsapp", accountId: "*", peer: { kind: "direct", id: "+15551234567" } },
        },
        { agentId: "chat", match: { channel: "whatsapp", accountId: "*" } },
      ],
    }
    ```

    ピアのバインディングは常に優先されるため、チャネル全体のルールより上に配置します。

  </Tab>
  <Tab title="WhatsApp グループにバインドされた家族用エージェント">
    専用の家族用エージェントを 1 つの WhatsApp グループにバインドし、メンションによる制御と、より厳格なツールポリシーを設定します。

    ```json5
    {
      agents: {
        list: [
          {
            id: "family",
            name: "Family",
            workspace: "~/.openclaw/workspace-family",
            identity: { name: "Family Bot" },
            groupChat: {
              mentionPatterns: ["@family", "@familybot", "@Family Bot"],
            },
            sandbox: {
              mode: "all",
              scope: "agent",
            },
            tools: {
              allow: [
                "exec",
                "read",
                "sessions_list",
                "sessions_history",
                "sessions_send",
                "sessions_spawn",
                "session_status",
              ],
              deny: ["write", "edit", "apply_patch", "browser", "canvas", "nodes", "cron"],
            },
          },
        ],
      },
      bindings: [
        {
          agentId: "family",
          match: {
            channel: "whatsapp",
            peer: { kind: "group", id: "120363999999999999@g.us" },
          },
        },
      ],
    }
    ```

    ツールの許可/拒否リストは Skills ではなく、**ツール**を指定します。スキルがバイナリを実行する必要がある場合は、`exec` が許可され、そのバイナリがサンドボックス内に存在することを確認してください。より厳格に制御するには、`agents.list[].groupChat.mentionPatterns` を設定し、チャネルのグループ許可リストを有効なままにします。

  </Tab>
</Tabs>

## エージェント単位のサンドボックスとツール設定

各エージェントに固有のサンドボックスとツール制限を設定できます。

```js
{
  agents: {
    list: [
      {
        id: "personal",
        workspace: "~/.openclaw/workspace-personal",
        sandbox: {
          mode: "off",  // 個人用エージェントにはサンドボックスを使用しない
        },
        // ツール制限なし - すべてのツールを使用可能
      },
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        sandbox: {
          mode: "all",     // 常にサンドボックス化
          scope: "agent",  // エージェントごとに 1 つのコンテナ
          docker: {
            // コンテナ作成後に行う任意の 1 回限りのセットアップ
            setupCommand: "apt-get update && apt-get install -y git curl",
          },
        },
        tools: {
          allow: ["read"],                    // read ツールのみ
          deny: ["exec", "write", "edit", "apply_patch"],    // その他を拒否
        },
      },
    ],
  },
}
```

<Note>
`setupCommand` は `sandbox.docker` 内にあり、コンテナ作成時に 1 回だけ実行されます。解決後のスコープが `"shared"` の場合、エージェント単位の `sandbox.docker.*` の上書きは無視されます。
</Note>

これにより、次のことが可能になります。

- **セキュリティ分離**: 信頼できないエージェントのツールを制限します。
- **リソース制御**: 特定のエージェントをサンドボックス化しつつ、その他はホスト上で実行します。
- **柔軟なポリシー**: エージェントごとに異なる権限を設定します。

<Note>
`tools.elevated` には、グローバルゲート（`tools.elevated.enabled`/`allowFrom`）とエージェント単位のゲート（`agents.list[].tools.elevated.enabled`/`allowFrom`）の両方があります。エージェント単位のゲートはグローバルゲートをさらに制限することしかできません。昇格コマンドを実行するには、両方が送信者を許可している必要があります。グループを対象にする場合は、`agents.list[].groupChat.mentionPatterns` を使用して、@メンションが対象のエージェントに明確に対応するようにします。
</Note>

詳細な例については、[マルチエージェントのサンドボックスとツール](/ja-JP/tools/multi-agent-sandbox-tools)を参照してください。

## 関連項目

- [ACP エージェント](/ja-JP/tools/acp-agents) — 外部のコーディングハーネスを実行する
- [チャネルルーティング](/ja-JP/channels/channel-routing) — メッセージをエージェントにルーティングする仕組み
- [プレゼンス](/ja-JP/concepts/presence) — エージェントのプレゼンスと可用性
- [セッション](/ja-JP/concepts/session) — セッションの分離とルーティング
- [サブエージェント](/ja-JP/tools/subagents) — バックグラウンドでのエージェント実行を生成する
