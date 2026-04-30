---
read_when: You want multiple isolated agents (workspaces + auth) in one gateway process.
sidebarTitle: Multi-agent routing
status: active
summary: 'マルチエージェントルーティング: 分離されたエージェント、チャネルアカウント、バインディング'
title: マルチエージェントルーティング
x-i18n:
    generated_at: "2026-04-30T05:08:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 67adea74d5f97feff3f816cc4c34c9429e7659289013e5a7c7623bd185a50a31
    source_path: concepts/multi-agent.md
    workflow: 16
---

複数の_分離された_エージェントを実行します。各エージェントは独自のワークスペース、状態ディレクトリ (`agentDir`)、セッション履歴を持ち、さらに 1 つの実行中の Gateway 内で複数のチャネルアカウント（例: 2 つの WhatsApp）を扱えます。受信メッセージはバインディングを通じて適切なエージェントにルーティングされます。

ここでの**エージェント**とは、ワークスペースファイル、認証プロファイル、モデルレジストリ、セッションストアを含む、ペルソナごとの完全なスコープです。`agentDir` は、このエージェントごとの設定を `~/.openclaw/agents/<agentId>/` に保持するオンディスクの状態ディレクトリです。**バインディング**は、チャネルアカウント（例: Slack ワークスペースや WhatsApp 番号）をそれらのエージェントのいずれかに対応付けます。

## 「1 つのエージェント」とは？

**エージェント**は、独自の次のものを持つ完全にスコープ化された頭脳です。

- **ワークスペース**（ファイル、AGENTS.md/SOUL.md/USER.md、ローカルノート、ペルソナルール）。
- **状態ディレクトリ** (`agentDir`)。認証プロファイル、モデルレジストリ、エージェントごとの設定を保持します。
- `~/.openclaw/agents/<agentId>/sessions` 配下の**セッションストア**（チャット履歴 + ルーティング状態）。

認証プロファイルは**エージェントごと**です。各エージェントは独自の次の場所から読み取ります。

```text
~/.openclaw/agents/<agentId>/agent/auth-profiles.json
```

<Note>
ここでも `sessions_history` は、より安全なクロスセッションの想起パスです。生のトランスクリプトダンプではなく、範囲が制限されサニタイズされたビューを返します。アシスタントの想起では、思考タグ、`<relevant-memories>` の足場、プレーンテキストのツール呼び出し XML ペイロード（`<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>`、および切り詰められたツール呼び出しブロックを含む）、ダウングレードされたツール呼び出しの足場、漏えいした ASCII/全角のモデル制御トークン、不正な形式の MiniMax ツール呼び出し XML が、秘匿化/切り詰めの前に除去されます。
</Note>

<Warning>
エージェント間で `agentDir` を再利用しないでください（認証/セッションの衝突が発生します）。エージェントにローカルプロファイルがない場合、デフォルト/メインエージェントの認証プロファイルを読み通せますが、OpenClaw は OAuth 更新トークンをセカンダリエージェントストアへ複製しません。独立した OAuth アカウントが必要な場合は、そのエージェントからサインインしてください。認証情報を手動でコピーする場合は、移植可能な静的な `api_key` または `token` プロファイルのみをコピーしてください。
</Warning>

Skills は、各エージェントのワークスペースと `~/.openclaw/skills` などの共有ルートから読み込まれ、設定されている場合は有効なエージェント Skills 許可リストでフィルタリングされます。共有ベースラインには `agents.defaults.skills` を、エージェントごとの置き換えには `agents.list[].skills` を使用します。[Skills: エージェントごと vs 共有](/ja-JP/tools/skills#per-agent-vs-shared-skills) と [Skills: エージェント Skills 許可リスト](/ja-JP/tools/skills#agent-skill-allowlists) を参照してください。

Gateway は**1 つのエージェント**（デフォルト）または**多数のエージェント**を並べてホストできます。

<Note>
**ワークスペースに関する注意:** 各エージェントのワークスペースは**デフォルト cwd** であり、強制的なサンドボックスではありません。相対パスはワークスペース内で解決されますが、サンドボックス化が有効でない限り、絶対パスはホスト上の他の場所に到達できます。[サンドボックス化](/ja-JP/gateway/sandboxing)を参照してください。
</Note>

## パス（クイックマップ）

- 設定: `~/.openclaw/openclaw.json`（または `OPENCLAW_CONFIG_PATH`）
- 状態ディレクトリ: `~/.openclaw`（または `OPENCLAW_STATE_DIR`）
- ワークスペース: `~/.openclaw/workspace`（または `~/.openclaw/workspace-<agentId>`）
- エージェントディレクトリ: `~/.openclaw/agents/<agentId>/agent`（または `agents.list[].agentDir`）
- セッション: `~/.openclaw/agents/<agentId>/sessions`

### 単一エージェントモード（デフォルト）

何もしない場合、OpenClaw は単一のエージェントを実行します。

- `agentId` のデフォルトは **`main`** です。
- セッションは `agent:main:<mainKey>` としてキー付けされます。
- ワークスペースのデフォルトは `~/.openclaw/workspace` です（`OPENCLAW_PROFILE` が設定されている場合は `~/.openclaw/workspace-<profile>`）。
- 状態のデフォルトは `~/.openclaw/agents/main/agent` です。

## エージェントヘルパー

エージェントウィザードを使用して、新しい分離エージェントを追加します。

```bash
openclaw agents add work
```

次に、受信メッセージをルーティングするために `bindings` を追加します（またはウィザードに任せます）。

次で確認します。

```bash
openclaw agents list --bindings
```

## クイックスタート

<Steps>
  <Step title="各エージェントワークスペースを作成する">
    ウィザードを使用するか、ワークスペースを手動で作成します。

    ```bash
    openclaw agents add coding
    openclaw agents add social
    ```

    各エージェントには、`SOUL.md`、`AGENTS.md`、任意の `USER.md` を含む独自のワークスペースに加え、専用の `agentDir` と `~/.openclaw/agents/<agentId>` 配下のセッションストアが割り当てられます。

  </Step>
  <Step title="チャネルアカウントを作成する">
    利用するチャネルごとに、エージェントごとのアカウントを 1 つ作成します。

    - Discord: エージェントごとに 1 つのボットを作成し、Message Content Intent を有効化して、各トークンをコピーします。
    - Telegram: BotFather 経由でエージェントごとに 1 つのボットを作成し、各トークンをコピーします。
    - WhatsApp: アカウントごとに各電話番号をリンクします。

    ```bash
    openclaw channels login --channel whatsapp --account work
    ```

    チャネルガイドを参照してください: [Discord](/ja-JP/channels/discord)、[Telegram](/ja-JP/channels/telegram)、[WhatsApp](/ja-JP/channels/whatsapp)。

  </Step>
  <Step title="エージェント、アカウント、バインディングを追加する">
    `agents.list` 配下にエージェントを、`channels.<channel>.accounts` 配下にチャネルアカウントを追加し、`bindings` で接続します（下記の例を参照）。
  </Step>
  <Step title="再起動して確認する">
    ```bash
    openclaw gateway restart
    openclaw agents list --bindings
    openclaw channels status --probe
    ```
  </Step>
</Steps>

## 複数のエージェント = 複数の人、複数の人格

**複数のエージェント**を使用すると、各 `agentId` は**完全に分離されたペルソナ**になります。

- **異なる電話番号/アカウント**（チャネルごとの `accountId`）。
- **異なる人格**（`AGENTS.md` や `SOUL.md` などのエージェントごとのワークスペースファイル）。
- **分離された認証 + セッション**（明示的に有効化しない限り、相互混在なし）。

これにより、**複数の人**が 1 つの Gateway サーバーを共有しながら、それぞれの AI 「頭脳」とデータを分離できます。

## クロスエージェント QMD メモリ検索

あるエージェントが別のエージェントの QMD セッショントランスクリプトを検索する必要がある場合は、`agents.list[].memorySearch.qmd.extraCollections` 配下に追加コレクションを追加します。すべてのエージェントが同じ共有トランスクリプトコレクションを継承する必要がある場合にのみ、`agents.defaults.memorySearch.qmd.extraCollections` を使用してください。

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

追加コレクションのパスはエージェント間で共有できますが、パスがエージェントワークスペース外にある場合、コレクション名は明示的なままです。ワークスペース内のパスはエージェントスコープのままなので、各エージェントは独自のトランスクリプト検索セットを保持します。

## 1 つの WhatsApp 番号、複数の人（DM 分割）

**1 つの WhatsApp アカウント**のまま、**異なる WhatsApp DM** を異なるエージェントにルーティングできます。送信者 E.164（`+15551234567` など）を `peer.kind: "direct"` で照合します。返信は引き続き同じ WhatsApp 番号から送信されます（エージェントごとの送信者 ID はありません）。

<Note>
ダイレクトチャットはエージェントの**メインセッションキー**に集約されるため、真の分離には**人ごとに 1 つのエージェント**が必要です。
</Note>

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

注:

- DM アクセス制御は、エージェントごとではなく、**WhatsApp アカウントごとにグローバル**です（ペアリング/許可リスト）。
- 共有グループでは、グループを 1 つのエージェントにバインドするか、[ブロードキャストグループ](/ja-JP/channels/broadcast-groups)を使用します。

## ルーティングルール（メッセージがエージェントを選ぶ仕組み）

バインディングは**決定的**で、**最も具体的なものが優先**されます。

<Steps>
  <Step title="peer 照合">
    正確な DM/グループ/チャネル ID。
  </Step>
  <Step title="parentPeer 照合">
    スレッド継承。
  </Step>
  <Step title="guildId + roles">
    Discord ロールルーティング。
  </Step>
  <Step title="guildId">
    Discord。
  </Step>
  <Step title="teamId">
    Slack。
  </Step>
  <Step title="チャネルの accountId 照合">
    アカウントごとのフォールバック。
  </Step>
  <Step title="チャネルレベルの照合">
    `accountId: "*"`.
  </Step>
  <Step title="デフォルトエージェント">
    `agents.list[].default` にフォールバックし、それがなければ最初のリストエントリ、デフォルトは `main`。
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="同順位の解決と AND セマンティクス">
    - 同じ階層で複数のバインディングが一致する場合、設定順で最初のものが優先されます。
    - バインディングに複数の照合フィールド（例: `peer` + `guildId`）が設定されている場合、指定されたすべてのフィールドが必要です（`AND` セマンティクス）。

  </Accordion>
  <Accordion title="アカウントスコープの詳細">
    - `accountId` を省略したバインディングは、デフォルトアカウントのみに一致します。
    - すべてのアカウントにまたがるチャネル全体のフォールバックには `accountId: "*"` を使用します。
    - 後で同じエージェントに同じバインディングを明示的なアカウント ID 付きで追加すると、OpenClaw は既存のチャネルのみのバインディングを複製せず、アカウントスコープにアップグレードします。

  </Accordion>
</AccordionGroup>

## 複数のアカウント / 電話番号

**複数のアカウント**をサポートするチャネル（例: WhatsApp）は、各ログインを識別するために `accountId` を使用します。各 `accountId` は異なるエージェントにルーティングできるため、1 つのサーバーでセッションを混在させずに複数の電話番号をホストできます。

`accountId` が省略されたときにチャネル全体のデフォルトアカウントを使いたい場合は、`channels.<channel>.defaultAccount` を設定します（任意）。未設定の場合、OpenClaw は `default` があればそれにフォールバックし、なければ最初に設定されたアカウント ID（ソート済み）にフォールバックします。

このパターンをサポートする一般的なチャネルには次が含まれます。

- `whatsapp`, `telegram`, `discord`, `slack`, `signal`, `imessage`
- `irc`, `line`, `googlechat`, `mattermost`, `matrix`, `nextcloud-talk`
- `bluebubbles`, `zalo`, `zalouser`, `nostr`, `feishu`

## 概念

- `agentId`: 1 つの「頭脳」（ワークスペース、エージェントごとの認証、エージェントごとのセッションストア）。
- `accountId`: 1 つのチャネルアカウントインスタンス（例: WhatsApp アカウント `"personal"` と `"biz"`）。
- `binding`: `(channel, accountId, peer)` と任意の guild/team ID によって、受信メッセージを `agentId` にルーティングします。
- ダイレクトチャットは `agent:<agentId>:<mainKey>` に集約されます（エージェントごとの「メイン」、`session.mainKey`）。

## プラットフォーム例

<AccordionGroup>
  <Accordion title="エージェントごとの Discord ボット">
    各 Discord ボットアカウントは一意の `accountId` に対応します。各アカウントをエージェントにバインドし、ボットごとに許可リストを保持します。

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

    - 各 bot をギルドに招待し、Message Content Intent を有効にします。
    - トークンは `channels.discord.accounts.<id>.token` にあります（デフォルトアカウントでは `DISCORD_BOT_TOKEN` を使用できます）。

  </Accordion>
  <Accordion title="エージェントごとの Telegram bot">
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

    - BotFather でエージェントごとに 1 つ bot を作成し、それぞれのトークンをコピーします。
    - トークンは `channels.telegram.accounts.<id>.botToken` にあります（デフォルトアカウントでは `TELEGRAM_BOT_TOKEN` を使用できます）。

  </Accordion>
  <Accordion title="エージェントごとの WhatsApp 番号">
    Gateway を開始する前に各アカウントをリンクします。

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
  <Tab title="WhatsApp の日常利用 + Telegram の深い作業">
    チャンネルで分割します。WhatsApp は高速な日常用エージェントへ、Telegram は Opus エージェントへルーティングします。

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

    - 1 つのチャンネルに複数のアカウントがある場合は、バインディングに `accountId` を追加します（例: `{ channel: "whatsapp", accountId: "personal" }`）。
    - 他を chat に残したまま、単一の DM/グループを Opus にルーティングするには、そのピア向けの `match.peer` バインディングを追加します。ピアの一致は常にチャンネル全体のルールより優先されます。

  </Tab>
  <Tab title="同じチャンネルで、1 つのピアを Opus へ">
    WhatsApp は高速なエージェントに残しつつ、1 つの DM を Opus にルーティングします。

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

    ピアバインディングは常に優先されるため、チャンネル全体のルールより上に置いてください。

  </Tab>
  <Tab title="WhatsApp グループにバインドされた家族用エージェント">
    専用の家族用エージェントを単一の WhatsApp グループにバインドし、メンションによるゲートとより厳密なツールポリシーを設定します。

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

    - ツールの許可/拒否リストは **tools** であり、Skills ではありません。Skill がバイナリを実行する必要がある場合は、`exec` が許可されており、そのバイナリがサンドボックス内に存在することを確認してください。
    - ゲートをより厳密にするには、`agents.list[].groupChat.mentionPatterns` を設定し、チャンネルでグループ許可リストを有効にしたままにします。

  </Tab>
</Tabs>

## エージェントごとのサンドボックスとツール設定

各エージェントは、独自のサンドボックスとツール制限を持てます。

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
`setupCommand` は `sandbox.docker` の下にあり、コンテナ作成時に 1 回実行されます。解決されたスコープが `"shared"` の場合、エージェントごとの `sandbox.docker.*` オーバーライドは無視されます。
</Note>

**利点:**

- **セキュリティ分離**: 信頼できないエージェントのツールを制限します。
- **リソース制御**: 特定のエージェントをサンドボックス化し、他はホスト上に残します。
- **柔軟なポリシー**: エージェントごとに異なる権限を設定できます。

<Note>
`tools.elevated` は**グローバル**であり、送信者ベースです。エージェントごとには設定できません。エージェントごとの境界が必要な場合は、`agents.list[].tools` を使用して `exec` を拒否します。グループのターゲット指定には、@メンションが意図したエージェントに明確に対応するように `agents.list[].groupChat.mentionPatterns` を使用します。
</Note>

詳細な例については、[マルチエージェントのサンドボックスとツール](/ja-JP/tools/multi-agent-sandbox-tools) を参照してください。

## 関連項目

- [ACP エージェント](/ja-JP/tools/acp-agents) — 外部コーディングハーネスの実行
- [チャンネルルーティング](/ja-JP/channels/channel-routing) — メッセージがエージェントにルーティングされる仕組み
- [プレゼンス](/ja-JP/concepts/presence) — エージェントのプレゼンスと可用性
- [セッション](/ja-JP/concepts/session) — セッション分離とルーティング
- [サブエージェント](/ja-JP/tools/subagents) — バックグラウンドのエージェント実行を生成する
