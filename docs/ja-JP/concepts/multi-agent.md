---
read_when: You want multiple isolated agents (workspaces + auth) in one gateway process.
sidebarTitle: Multi-agent routing
status: active
summary: 'マルチエージェントルーティング: 分離されたエージェント、チャネルアカウント、バインディング'
title: マルチエージェントルーティング
x-i18n:
    generated_at: "2026-07-05T11:14:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 48e32d9e8ac2b68fdceb9a84d95bae2a73ab10f9c5fd177b72e8e452954329e9
    source_path: concepts/multi-agent.md
    workflow: 16
---

1つの Gateway プロセスで複数の_分離された_エージェントを実行します。各エージェントは専用のワークスペース、状態ディレクトリ（`agentDir`）、セッションストアを持ち、さらに複数のチャンネルアカウント（例: 2つの WhatsApp 番号）も扱えます。受信メッセージは **bindings** を通じて適切なエージェントへルーティングされます。

**エージェント**とは、ペルソナごとの完全なスコープです。ワークスペースファイル、認証プロファイル、モデルレジストリ、セッションストアを含みます。**binding** はチャンネルアカウント（Slack ワークスペース、WhatsApp 番号など）をそれらのエージェントの1つに対応付けます。

## 1つのエージェントとは

各エージェントは専用の次のものを持ちます。

- **ワークスペース**: ファイル、`AGENTS.md`/`SOUL.md`/`USER.md`、ローカルノート、ペルソナルール。
- **状態ディレクトリ**（`agentDir`）: 認証プロファイル、モデルレジストリ、エージェントごとの設定。
- **セッションストア**: `~/.openclaw/agents/<agentId>/sessions` 配下のチャット履歴とルーティング状態。

認証プロファイルはエージェントごとで、次から読み込まれます。

```text
~/.openclaw/agents/<agentId>/agent/auth-profiles.json
```

<Note>
`sessions_history` はより安全なクロスセッション想起パスです。生のトランスクリプトダンプではなく、範囲が制限され、リダクトされたビューを返します。thinking-block シグネチャ、ツール結果ペイロードの詳細、`<relevant-memories>` の足場、ツール呼び出し XML タグ（`<tool_call>`、`<function_call>`、およびそれらの複数形/ダウングレード形式）、MiniMax ツール呼び出し XML を取り除き、その後バイトサイズで出力を切り詰め、上限を適用します。
</Note>

<Warning>
エージェント間で `agentDir` を再利用しないでください。認証/セッション状態の衝突が発生します。セカンダリエージェントのローカル OAuth 資格情報が期限切れ、または更新に失敗した場合、OpenClaw は同じプロファイル ID についてデフォルト/メインエージェントの資格情報を読み抜き、最も新しいトークンを採用します。ただし、更新トークンはセカンダリエージェントのストアにはコピーしません。完全に独立した OAuth アカウントが必要な場合は、そのエージェントからサインインしてください。資格情報を手動でコピーする場合は、ポータブルな静的 `api_key` または `token` プロファイルだけをコピーしてください。OAuth 更新素材はデフォルトではポータブルではありません（`copyToAgents` でプロファイルを明示的にオプトインできます）。
</Warning>

Skills は各エージェントワークスペースと `~/.openclaw/skills` などの共有ルートから読み込まれ、その後、有効なエージェント Skills 許可リストでフィルタリングされます。共有ベースラインには `agents.defaults.skills` を、エージェントごとの置き換えには `agents.list[].skills` を使用してください（明示的なエントリはデフォルトを置き換え、マージしません）。[Skills: エージェントごと vs 共有](/ja-JP/tools/skills#per-agent-vs-shared-skills) と [Skills: エージェント許可リスト](/ja-JP/tools/skills#agent-allowlists) を参照してください。

<Note>
**ワークスペース注記:** 各エージェントのワークスペースは **デフォルト cwd** であり、強制的なサンドボックスではありません。相対パスはワークスペース内で解決されますが、サンドボックス化が有効でない限り、絶対パスはホスト上の他の場所に到達できます。[サンドボックス化](/ja-JP/gateway/sandboxing) を参照してください。
</Note>

## パス

| 対象                      | デフォルト                                                                                | 上書き                                                                                 |
| ------------------------- | -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| 設定                    | `~/.openclaw/openclaw.json`                                                            | `OPENCLAW_CONFIG_PATH`                                                                   |
| 状態ディレクトリ                 | `~/.openclaw`                                                                          | `OPENCLAW_STATE_DIR`                                                                     |
| デフォルトエージェントのワークスペース | `~/.openclaw/workspace`（または `OPENCLAW_PROFILE` が設定されている場合は `workspace-<profile>`）      | `agents.list[].workspace`、次に `agents.defaults.workspace`、または `OPENCLAW_WORKSPACE_DIR` |
| その他のエージェントのワークスペース   | `<stateDir>/workspace-<agentId>`（または設定時は `<agents.defaults.workspace>/<agentId>`） | `agents.list[].workspace`                                                                |
| エージェントディレクトリ                 | `~/.openclaw/agents/<agentId>/agent`                                                   | `agents.list[].agentDir`                                                                 |
| セッション                  | `~/.openclaw/agents/<agentId>/sessions`                                                | —                                                                                        |

### 単一エージェントモード（デフォルト）

何も設定しない場合、OpenClaw は1つのエージェントを実行します。

- `agentId` のデフォルトは `main` です。
- セッションは `agent:main:<mainKey>` をキーにします（デフォルトの `mainKey` は `main`）。
- ワークスペースのデフォルトは `~/.openclaw/workspace` です（または `OPENCLAW_PROFILE` が `default` 以外に設定されている場合は `workspace-<profile>`）。
- 状態のデフォルトは `~/.openclaw/agents/main/agent` です。

## エージェントヘルパー

新しい分離エージェントを追加します。

```bash
openclaw agents add work
```

フラグ: `--workspace <dir>`、`--model <id>`、`--agent-dir <dir>`、`--bind <channel[:accountId]>`（繰り返し可能）、`--non-interactive`（`--workspace` が必要）。

受信メッセージをルーティングするために `bindings` を追加し（ウィザードがこれを行うか提案します）、その後検証します。

```bash
openclaw agents list --bindings
```

## クイックスタート

<Steps>
  <Step title="各エージェントワークスペースを作成">
    ```bash
    openclaw agents add coding
    openclaw agents add social
    ```

    各エージェントには、`SOUL.md`、`AGENTS.md`、任意の `USER.md` を含む専用ワークスペースに加え、専用の `agentDir` と `~/.openclaw/agents/<agentId>` 配下のセッションストアが割り当てられます。

  </Step>
  <Step title="チャンネルアカウントを作成">
    使用したいチャンネルで、エージェントごとに1つのアカウントを作成します。

    - Discord: エージェントごとに1つのボットを作成し、Message Content Intent を有効化して、各トークンをコピーします。
    - Telegram: BotFather 経由でエージェントごとに1つのボットを作成し、各トークンをコピーします。
    - WhatsApp: アカウントごとに各電話番号をリンクします。

    ```bash
    openclaw channels login --channel whatsapp --account work
    ```

    チャンネルガイドを参照してください: [Discord](/ja-JP/channels/discord)、[Telegram](/ja-JP/channels/telegram)、[WhatsApp](/ja-JP/channels/whatsapp)。

  </Step>
  <Step title="エージェント、アカウント、bindings を追加">
    `agents.list` 配下にエージェントを、`channels.<channel>.accounts` 配下にチャンネルアカウントを追加し、`bindings` で接続します（例は下記）。
  </Step>
  <Step title="再起動して検証">
    ```bash
    openclaw gateway restart
    openclaw agents list --bindings
    openclaw channels status --probe
    ```
  </Step>
</Steps>

## 複数のエージェント、複数のペルソナ

設定された各 `agentId` は、完全に分離されたペルソナです。

- チャンネルごとの異なるアカウント（`accountId` ごと）。
- 異なる人格（エージェントごとの `AGENTS.md`/`SOUL.md`）。
- 明示的に有効化しない限りクロストークのない、分離された認証とセッション。

これにより、複数の人が1つの Gateway を共有しつつ、各自のエージェント状態を分離できます。

## クロスエージェント QMD メモリ検索

1つのエージェントが別のエージェントの QMD セッショントランスクリプトを検索できるようにするには、`agents.list[].memorySearch.qmd.extraCollections` 配下に追加コレクションを追加します。すべてのエージェントが同じコレクションを共有する必要がある場合は、`agents.defaults.memorySearch.qmd.extraCollections` を使用します。

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
            extraCollections: [{ path: "notes" }], // resolves inside workspace -> collection named "notes-main"
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

追加コレクションのパスはエージェント間で共有できますが、そのパスがエージェントワークスペースの外にある場合、`name` は明示的なままです。ワークスペース内のパスはエージェントスコープのままなので、各エージェントは専用のトランスクリプト検索セットを保持します。

## 1つの WhatsApp 番号、複数の人（DM 分割）

送信者 E.164（`+15551234567`）を `peer.kind: "direct"` で照合することで、**1つ**の WhatsApp アカウント上の異なる WhatsApp DM を別々のエージェントにルーティングします。返信は引き続き同じ WhatsApp 番号から送信されます。エージェントごとの送信者 ID はありません。

<Note>
ダイレクトチャットはデフォルトでエージェントのメインセッションキーに折りたたまれるため、真の分離には人ごとに1つのエージェントが必要です。
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

DM アクセス制御（ペアリング/許可リスト）は WhatsApp アカウントごとにグローバルであり、エージェントごとではありません。共有グループの場合は、グループを1つのエージェントにバインドするか、[ブロードキャストグループ](/ja-JP/channels/broadcast-groups) を使用してください。

## ルーティングルール

Bindings は決定的で、最も具体的なものが優先されます。完全なティア順序（正確なピア、親ピア、ピアワイルドカード、guild+roles、guild、team、account、channel、デフォルトエージェント）については、[チャンネルルーティング](/ja-JP/channels/channel-routing#routing-rules-how-an-agent-is-chosen) を参照してください。ここで取り上げる価値のあるルールがいくつかあります。

- 同じティア内で複数の bindings が一致する場合、設定順で最初のものが優先されます。
- binding が複数の match フィールド（例: `peer` + `guildId`）を設定している場合、指定されたすべてのフィールドが一致する必要があります（`AND` セマンティクス）。
- `accountId` を省略した binding は、すべてのアカウントではなくデフォルトアカウントのみに一致します。チャンネル全体のフォールバックには `accountId: "*"` を、1つのアカウントには `accountId: "<name>"` を使用してください。同じ binding を明示的なアカウント ID 付きでもう一度追加すると、既存のチャンネルのみの binding を複製するのではなくアップグレードします。

## 複数アカウント / 電話番号

複数アカウントをサポートするチャンネル（例: WhatsApp）は、各ログインを識別するために `accountId` を使用します。各 `accountId` は専用のエージェントにルーティングされるため、1つのサーバーでセッションを混在させずに複数の電話番号をホストできます。

`accountId` が省略された場合に使用するアカウントを選ぶには、`channels.<channel>.defaultAccount` を設定します。未設定の場合、OpenClaw は存在すれば `default` にフォールバックし、それ以外の場合は最初に設定されたアカウント ID（ソート済み）にフォールバックします。

複数アカウントをサポートするチャンネル: `discord`、`feishu`、`googlechat`、`imessage`、`irc`、`line`、`mattermost`、`matrix`、`nextcloud-talk`、`nostr`、`signal`、`slack`、`telegram`、`whatsapp`、`zalo`、`zalouser`。

## 概念

- `agentId`: 1つの「頭脳」（ワークスペース、エージェントごとの認証、エージェントごとのセッションストア）。
- `accountId`: 1つのチャンネルアカウントインスタンス（例: WhatsApp アカウント `personal` と `biz`）。
- `binding`: `(channel, accountId, peer)` と、任意で guild/team ID によって、受信メッセージを `agentId` にルーティングします。
- ダイレクトチャットは `agent:<agentId>:<mainKey>` に折りたたまれます（エージェントごとの「main」。`session.mainKey` を参照）。

## プラットフォーム例

<AccordionGroup>
  <Accordion title="エージェントごとの Discord ボット">
    各 Discord ボットアカウントは一意の `accountId` に対応します。各アカウントをエージェントにバインドし、ボットごとに許可リストを維持してください。

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
    - トークンは `channels.discord.accounts.<id>.token` に置きます（デフォルトアカウントは `DISCORD_BOT_TOKEN` を使用できます）。

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
    - トークンは `channels.telegram.accounts.<id>.botToken` に置きます（デフォルトアカウントは `TELEGRAM_BOT_TOKEN` を使用できます）。
    - 同じ Telegram グループで複数のボットを使う場合は、各ボットを招待し、応答すべきボットにメンションします。
    - 各グループボットで BotFather Privacy Mode を無効にし（`/setprivacy` -> Disable）、その後ボットを削除して再追加し、Telegram に設定を適用させます。
    - `channels.telegram.groups` でグループを許可するか、信頼済みのグループデプロイでのみ `groupPolicy: "open"` を使用します。
    - 送信者のユーザー ID は `groupAllowFrom` に入れます。グループ ID とスーパーグループ ID は `groupAllowFrom` ではなく `channels.telegram.groups` に属します。
    - 各ボットが自分のエージェントにルーティングされるよう、`accountId` でバインドします。

  </Accordion>
  <Accordion title="エージェントごとの WhatsApp 番号">
    Gateway を起動する前に各アカウントをリンクします。

    ```bash
    openclaw channels login --channel whatsapp --account personal
    openclaw channels login --channel whatsapp --account biz
    ```

    `~/.openclaw/openclaw.json` (JSON5):

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

      // Deterministic routing: first match wins (most-specific first).
      bindings: [
        { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
        { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },

        // Optional per-peer override (example: send a specific group to work agent).
        {
          agentId: "work",
          match: {
            channel: "whatsapp",
            accountId: "personal",
            peer: { kind: "group", id: "1203630...@g.us" },
          },
        },
      ],

      // Off by default: agent-to-agent messaging must be explicitly enabled + allowlisted.
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
              // Optional override. Default: ~/.openclaw/credentials/whatsapp/personal
              // authDir: "~/.openclaw/credentials/whatsapp/personal",
            },
            biz: {
              // Optional override. Default: ~/.openclaw/credentials/whatsapp/biz
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
  <Tab title="WhatsApp の日常利用 + Telegram のディープワーク">
    チャンネルで分割します。WhatsApp は高速な日常用エージェントに、Telegram は Opus エージェントにルーティングします。

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

    これらの例では `accountId: "*"` を使用しているため、後でアカウントを追加してもバインディングは動作し続けます。残りをチャットに保持したまま単一の DM/グループを Opus にルーティングするには、そのピアの `match.peer` バインディングを追加します。ピア一致は常にチャンネル全体のルールより優先されます。

  </Tab>
  <Tab title="同じチャンネルで 1 つのピアを Opus へ">
    WhatsApp は高速なエージェントのままにし、1 つの DM だけを Opus にルーティングします。

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

    ピアバインディングは常に優先されるため、チャンネル全体のルールより上に置いてください。

  </Tab>
  <Tab title="WhatsApp グループにバインドされたファミリーエージェント">
    専用のファミリーエージェントを単一の WhatsApp グループにバインドし、メンションゲートとより厳格なツールポリシーを設定します。

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

    ツールの許可/拒否リストは**ツール**であり、スキルではありません。スキルがバイナリを実行する必要がある場合は、`exec` が許可されていて、そのバイナリがサンドボックス内に存在することを確認してください。より厳格にゲートするには、`agents.list[].groupChat.mentionPatterns` を設定し、チャンネルでグループの許可リストを有効にしたままにします。

  </Tab>
</Tabs>

## エージェントごとのサンドボックスとツール設定

各エージェントは独自のサンドボックスとツール制限を持つことができます。

```js
{
  agents: {
    list: [
      {
        id: "personal",
        workspace: "~/.openclaw/workspace-personal",
        sandbox: {
          mode: "off",  // No sandbox for personal agent
        },
        // No tool restrictions - all tools available
      },
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        sandbox: {
          mode: "all",     // Always sandboxed
          scope: "agent",  // One container per agent
          docker: {
            // Optional one-time setup after container creation
            setupCommand: "apt-get update && apt-get install -y git curl",
          },
        },
        tools: {
          allow: ["read"],                    // Only read tool
          deny: ["exec", "write", "edit", "apply_patch"],    // Deny others
        },
      },
    ],
  },
}
```

<Note>
`setupCommand` は `sandbox.docker` の下にあり、コンテナ作成時に 1 回実行されます。解決後のスコープが `"shared"` の場合、エージェントごとの `sandbox.docker.*` オーバーライドは無視されます。
</Note>

これにより、次のことが可能になります。

- **セキュリティ分離**: 信頼できないエージェントのツールを制限します。
- **リソース制御**: 特定のエージェントをサンドボックス化し、他のエージェントはホスト上に保持します。
- **柔軟なポリシー**: エージェントごとに異なる権限を設定します。

<Note>
`tools.elevated` にはグローバルゲート（`tools.elevated.enabled`/`allowFrom`）とエージェントごとのゲート（`agents.list[].tools.elevated.enabled`/`allowFrom`）の両方があります。エージェントごとのゲートはグローバルゲートをさらに制限することしかできません。昇格コマンドを実行するには、両方が送信者を許可している必要があります。グループを対象にする場合は、@mentions が意図したエージェントに明確に対応するよう、`agents.list[].groupChat.mentionPatterns` を使用してください。
</Note>

詳細な例については、[マルチエージェントのサンドボックスとツール](/ja-JP/tools/multi-agent-sandbox-tools)を参照してください。

## 関連

- [ACP エージェント](/ja-JP/tools/acp-agents) — 外部コーディングハーネスの実行
- [チャンネルルーティング](/ja-JP/channels/channel-routing) — メッセージがエージェントにルーティングされる仕組み
- [プレゼンス](/ja-JP/concepts/presence) — エージェントのプレゼンスと可用性
- [セッション](/ja-JP/concepts/session) — セッション分離とルーティング
- [サブエージェント](/ja-JP/tools/subagents) — バックグラウンドエージェント実行の生成
