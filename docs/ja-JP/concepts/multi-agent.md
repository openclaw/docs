---
read_when: You want multiple isolated agents (workspaces + auth) in one gateway process.
status: active
summary: 'マルチエージェントルーティング: 分離されたエージェント、チャネルアカウント、bindings'
title: マルチエージェントルーティング
x-i18n:
    generated_at: "2026-04-24T04:53:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: ef6f91c53a14bf92427f08243930e4aab50ac7853c9b22b0dbdbb853ea1a93d2
    source_path: concepts/multi-agent.md
    workflow: 15
---

複数の**分離された**エージェントを実行できます。各エージェントはそれぞれ独自のworkspace、state directory（`agentDir`）、session historyを持ち、さらに複数のチャネルアカウント（たとえば2つのWhatsApp）を1つの実行中のGatewayで扱えます。受信メッセージはbindingsを通じて適切なエージェントにルーティングされます。

ここでの **agent** とは、personaごとの完全なスコープを指します。workspace files、auth profiles、model registry、session storeが含まれます。`agentDir` は、`~/.openclaw/agents/<agentId>/` にある、このエージェントごとの設定を保持するディスク上のstate directoryです。**binding** は、チャネルアカウント（たとえばSlack workspaceやWhatsApp番号）を、それらのエージェントのいずれかに対応付けます。

## 「1つのエージェント」とは何か

**agent** は、次をそれぞれ独立して持つ、完全にスコープされたbrainです。

- **Workspace**（ファイル、`AGENTS.md` / `SOUL.md` / `USER.md`、ローカルメモ、personaルール）。
- auth profiles、model registry、エージェントごとの設定のための**State directory**（`agentDir`）。
- `~/.openclaw/agents/<agentId>/sessions` 配下の**Session store**（チャット履歴 + ルーティング状態）。

auth profilesは**エージェントごと**です。各エージェントは次から読み取ります。

```text
~/.openclaw/agents/<agentId>/agent/auth-profiles.json
```

`sessions_history` は、ここでもより安全なセッション横断の想起経路です。これは生のトランスクリプトのダンプではなく、制限付きかつサニタイズされたビューを返します。assistantの想起では、thinking tags、`<relevant-memories>` の足場、プレーンテキストのツール呼び出しXMLペイロード（`<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>`、および切り詰められたツール呼び出しブロックを含む）、格下げされたツール呼び出し足場、漏えいしたASCII/全角のモデル制御トークン、不正なMiniMaxツール呼び出しXMLが、redaction/truncationの前に除去されます。

mainエージェントの認証情報は**自動では共有されません**。エージェント間で `agentDir` を再利用しないでください（auth/sessionの衝突を引き起こします）。認証情報を共有したい場合は、`auth-profiles.json` を他のエージェントの `agentDir` にコピーしてください。

Skillsは各エージェントworkspaceに加えて、`~/.openclaw/skills` のような共有ルートから読み込まれ、その後、設定されている場合は有効なエージェントskill allowlistでフィルタされます。共有ベースラインには `agents.defaults.skills` を使い、エージェントごとの置き換えには `agents.list[].skills` を使います。[Skills: per-agent vs shared](/ja-JP/tools/skills#per-agent-vs-shared-skills) と [Skills: agent skill allowlists](/ja-JP/tools/skills#agent-skill-allowlists) を参照してください。

Gatewayは、**1つのエージェント**（デフォルト）または**複数のエージェント**を並列にホストできます。

**Workspaceに関する注記:** 各エージェントのworkspaceは厳格なサンドボックスではなく、**デフォルトのcwd**です。相対パスはworkspace内で解決されますが、サンドボックス化が有効でなければ絶対パスは他のホスト上の場所にも到達できます。[サンドボックス化](/ja-JP/gateway/sandboxing)を参照してください。

## パス（クイックマップ）

- Config: `~/.openclaw/openclaw.json`（または `OPENCLAW_CONFIG_PATH`）
- State dir: `~/.openclaw`（または `OPENCLAW_STATE_DIR`）
- Workspace: `~/.openclaw/workspace`（または `~/.openclaw/workspace-<agentId>`）
- Agent dir: `~/.openclaw/agents/<agentId>/agent`（または `agents.list[].agentDir`）
- Sessions: `~/.openclaw/agents/<agentId>/sessions`

### 単一エージェントモード（デフォルト）

何も設定しなければ、OpenClawは単一エージェントで動作します。

- `agentId` のデフォルトは **`main`** です。
- セッションキーは `agent:main:<mainKey>` です。
- Workspaceのデフォルトは `~/.openclaw/workspace` です（`OPENCLAW_PROFILE` が設定されている場合は `~/.openclaw/workspace-<profile>`）。
- Stateのデフォルトは `~/.openclaw/agents/main/agent` です。

## エージェントヘルパー

agentウィザードを使って、新しい分離されたエージェントを追加します。

```bash
openclaw agents add work
```

その後、受信メッセージをルーティングするために `bindings` を追加します（またはウィザードに任せます）。

確認するには:

```bash
openclaw agents list --bindings
```

## クイックスタート

<Steps>
  <Step title="各エージェントworkspaceを作成する">

ウィザードを使うか、手動でworkspaceを作成します。

```bash
openclaw agents add coding
openclaw agents add social
```

各エージェントには、`SOUL.md`、`AGENTS.md`、オプションの `USER.md` を含む独自のworkspaceが作成され、さらに専用の `agentDir` と `~/.openclaw/agents/<agentId>` 配下のsession storeが作られます。

  </Step>

  <Step title="チャネルアカウントを作成する">

使いたいチャネルごとに、エージェントごと1アカウントを作成します。

- Discord: エージェントごとに1つのボットを作成し、Message Content Intentを有効にして、各トークンをコピーします。
- Telegram: BotFather経由でエージェントごとに1つのボットを作成し、各トークンをコピーします。
- WhatsApp: アカウントごとに各電話番号をリンクします。

```bash
openclaw channels login --channel whatsapp --account work
```

チャネルガイドを参照: [Discord](/ja-JP/channels/discord)、[Telegram](/ja-JP/channels/telegram)、[WhatsApp](/ja-JP/channels/whatsapp)。

  </Step>

  <Step title="エージェント、アカウント、bindingsを追加する">

`agents.list` の下にエージェント、`channels.<channel>.accounts` の下にチャネルアカウントを追加し、`bindings` でそれらを接続します（例は下記）。

  </Step>

  <Step title="再起動して確認する">

```bash
openclaw gateway restart
openclaw agents list --bindings
openclaw channels status --probe
```

  </Step>
</Steps>

## 複数エージェント = 複数人、複数の人格

**複数エージェント**では、各 `agentId` が**完全に分離されたpersona**になります。

- **異なる電話番号/アカウント**（チャネルごとの `accountId`）。
- **異なる人格**（`AGENTS.md` や `SOUL.md` のようなエージェントごとのworkspace files）。
- **分離されたauth + sessions**（明示的に有効化しない限り相互干渉なし）。

これにより、**複数人**が1つのGatewayサーバーを共有しつつ、自分たちのAI「brains」とデータを分離したままにできます。

## エージェント間のQMDメモリ検索

あるエージェントが別のエージェントのQMDセッショントランスクリプトを検索できるようにするには、`agents.list[].memorySearch.qmd.extraCollections` の下に追加コレクションを加えます。すべてのエージェントが同じ共有トランスクリプトコレクションを継承すべき場合にのみ、`agents.defaults.memorySearch.qmd.extraCollections` を使ってください。

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

追加コレクションのパスはエージェント間で共有できますが、パスがエージェントworkspace外にある場合、コレクション名は明示的なまま維持されます。workspace内のパスは引き続きエージェントスコープのままなので、各エージェントは独自のトランスクリプト検索セットを保持します。

## 1つのWhatsApp番号、複数人（DM分割）

**1つのWhatsAppアカウント**のまま、**異なるWhatsApp DM** を異なるエージェントにルーティングできます。`peer.kind: "direct"` で送信者E.164（例 `+15551234567`）に一致させます。返信は引き続き同じWhatsApp番号から送られます（エージェントごとの送信者identityはありません）。

重要な詳細: ダイレクトチャットはエージェントの**main session key**に集約されるため、真の分離には**1人につき1エージェント**が必要です。

例:

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

注記:

- DMアクセス制御は**WhatsAppアカウントごとのグローバル**（pairing/allowlist）であり、エージェントごとではありません。
- 共有グループについては、そのグループを1つのエージェントにバインドするか、[ブロードキャストグループ](/ja-JP/channels/broadcast-groups) を使ってください。

## ルーティングルール（メッセージがどのようにエージェントを選ぶか）

bindingsは**決定的**で、**より具体的なものが優先**されます。

1. `peer` 一致（正確なDM/グループ/チャネルID）
2. `parentPeer` 一致（スレッド継承）
3. `guildId + roles`（Discordのroleルーティング）
4. `guildId`（Discord）
5. `teamId`（Slack）
6. チャネルの `accountId` 一致
7. チャネルレベル一致（`accountId: "*"`）
8. デフォルトエージェントへのフォールバック（`agents.list[].default`、なければ最初のリストエントリ、デフォルト: `main`）

同じtierで複数のbindingが一致した場合、設定順で最初のものが優先されます。
bindingが複数の一致フィールド（たとえば `peer` + `guildId`）を設定している場合、指定されたすべてのフィールドが必要です（`AND` セマンティクス）。

重要なアカウントスコープの詳細:

- `accountId` を省略したbindingは、デフォルトアカウントにのみ一致します。
- 全アカウントに対するチャネル全体のフォールバックには `accountId: "*"` を使います。
- 後から同じエージェントに対して同じbindingを明示的なaccount id付きで追加した場合、OpenClawは既存のチャネルのみbindingを複製する代わりにアカウントスコープ付きへアップグレードします。

## 複数アカウント / 複数電話番号

**複数アカウント**をサポートするチャネル（例: WhatsApp）では、各ログインを識別するために `accountId` を使います。各 `accountId` は異なるエージェントにルーティングできるため、1台のサーバーで複数の電話番号をホストしつつ、セッションを混在させずに済みます。

`accountId` 省略時にチャネル全体のデフォルトアカウントを使いたい場合は、`channels.<channel>.defaultAccount` を設定します（任意）。未設定の場合、OpenClawは `default` があればそこにフォールバックし、なければ最初に設定されたアカウントid（ソート済み）を使います。

このパターンをサポートする一般的なチャネルには次が含まれます。

- `whatsapp`、`telegram`、`discord`、`slack`、`signal`、`imessage`
- `irc`、`line`、`googlechat`、`mattermost`、`matrix`、`nextcloud-talk`
- `bluebubbles`、`zalo`、`zalouser`、`nostr`、`feishu`

## 概念

- `agentId`: 1つの「brain」（workspace、エージェントごとのauth、エージェントごとのsession store）。
- `accountId`: 1つのチャネルアカウントインスタンス（たとえばWhatsAppアカウント `"personal"` と `"biz"`）。
- `binding`: `(channel, accountId, peer)` と、必要に応じて guild/team ids によって受信メッセージを `agentId` へルーティングします。
- ダイレクトチャットは `agent:<agentId>:<mainKey>`（エージェントごとの「main」。`session.mainKey`）に集約されます。

## プラットフォーム例

### エージェントごとのDiscordボット

各Discordボットアカウントは一意の `accountId` に対応します。各アカウントをエージェントにバインドし、ボットごとにallowlistを維持します。

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

注記:

- 各ボットをguildに招待し、Message Content Intentを有効にしてください。
- トークンは `channels.discord.accounts.<id>.token` に置きます（デフォルトアカウントでは `DISCORD_BOT_TOKEN` が使えます）。

### エージェントごとのTelegramボット

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

注記:

- BotFatherでエージェントごとに1つのボットを作成し、各トークンをコピーします。
- トークンは `channels.telegram.accounts.<id>.botToken` に置きます（デフォルトアカウントでは `TELEGRAM_BOT_TOKEN` が使えます）。

### エージェントごとのWhatsApp番号

gatewayを起動する前に、各アカウントをリンクします:

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

## 例: WhatsAppの日常チャット + Telegramの集中作業

チャネルで分割します。WhatsAppは高速な日常用エージェントへ、TelegramはOpusエージェントへルーティングします。

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
    { agentId: "chat", match: { channel: "whatsapp" } },
    { agentId: "opus", match: { channel: "telegram" } },
  ],
}
```

注記:

- 1つのチャネルに複数アカウントがある場合は、bindingに `accountId` を追加します（たとえば `{ channel: "whatsapp", accountId: "personal" }`）。
- 残りはchatのままにして、単一のDM/グループだけをOpusにルーティングしたい場合は、そのpeerに対する `match.peer` bindingを追加します。peer一致は常にチャネル全体のルールより優先されます。

## 例: 同じチャネルで、1つのpeerだけをOpusへ

WhatsAppは高速エージェントのままにして、1つのDMだけをOpusへルーティングします:

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
      match: { channel: "whatsapp", peer: { kind: "direct", id: "+15551234567" } },
    },
    { agentId: "chat", match: { channel: "whatsapp" } },
  ],
}
```

peer bindingは常に優先されるため、チャネル全体のルールより上に置いてください。

## WhatsAppグループにバインドされたfamilyエージェント

専用のfamilyエージェントを、メンションゲーティングとより厳しいツールポリシー付きで、単一のWhatsAppグループにバインドします:

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

注記:

- ツールのallow/denyリストは**tools**であり、skillsではありません。skillでバイナリ実行が必要な場合は、`exec` が許可されており、そのバイナリがサンドボックス内に存在することを確認してください。
- より厳格にゲーティングしたい場合は、`agents.list[].groupChat.mentionPatterns` を設定し、チャネルのグループallowlistを有効なままにしてください。

## エージェントごとのサンドボックスとツール設定

各エージェントは独自のサンドボックスとツール制限を持てます:

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

注記: `setupCommand` は `sandbox.docker` の下にあり、コンテナ作成時に1回だけ実行されます。
解決されたscopeが `"shared"` の場合、エージェントごとの `sandbox.docker.*` 上書きは無視されます。

**利点:**

- **セキュリティ分離**: 信頼できないエージェントのツールを制限する
- **リソース制御**: 特定のエージェントだけをサンドボックス化し、他はホスト上に残す
- **柔軟なポリシー**: エージェントごとに異なる権限を設定する

注記: `tools.elevated` は**グローバル**で送信者ベースであり、エージェントごとには設定できません。
エージェントごとの境界が必要な場合は、`agents.list[].tools` を使って `exec` をdenyしてください。
グループを対象にする場合は、`agents.list[].groupChat.mentionPatterns` を使って、`@mention` が意図したエージェントにきれいに対応するようにしてください。

詳細な例については [マルチエージェントのサンドボックスとツール](/ja-JP/tools/multi-agent-sandbox-tools) を参照してください。

## 関連

- [チャネルルーティング](/ja-JP/channels/channel-routing) — メッセージがどのようにエージェントへルーティングされるか
- [サブエージェント](/ja-JP/tools/subagents) — バックグラウンドのエージェント実行を生成する
- [ACPエージェント](/ja-JP/tools/acp-agents) — 外部コーディングハーネスを実行する
- [Presence](/ja-JP/concepts/presence) — エージェントのpresenceと可用性
- [セッション](/ja-JP/concepts/session) — セッション分離とルーティング
