---
read_when: You want multiple isolated agents (workspaces + auth) in one gateway process.
sidebarTitle: Multi-agent routing
status: active
summary: 'マルチエージェントルーティング: 分離されたエージェント、チャネルアカウント、バインディング'
title: マルチエージェントルーティング
x-i18n:
    generated_at: "2026-04-26T11:28:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 845149ac1076d4746cc5038bd4444c2fc6117710f724b8cabdc31dc9ef6abbe8
    source_path: concepts/multi-agent.md
    workflow: 15
---

複数の _isolated_ エージェントを実行できます。各エージェントはそれぞれ独自の workspace、状態ディレクトリ（`agentDir`）、セッション履歴を持ち、さらに複数のチャネルアカウント（例: 2 つの WhatsApp）も 1 つの実行中 Gateway 上で扱えます。受信メッセージは binding を通じて正しいエージェントにルーティングされます。

ここでいう **agent** とは、完全なペルソナ単位のスコープです。workspace ファイル、認証プロファイル、model レジストリ、セッションストアを含みます。`agentDir` は、このエージェントごとの config を保持するオンディスク状態ディレクトリで、`~/.openclaw/agents/<agentId>/` にあります。**binding** は、チャネルアカウント（例: Slack ワークスペースや WhatsApp 番号）を、それらの agent のいずれかにマッピングします。

## 「1 つの agent」とは何か

**agent** は、次を個別に持つ完全にスコープ化された brain です。

- **Workspace**（ファイル、AGENTS.md/SOUL.md/USER.md、ローカルノート、ペルソナルール）。
- 認証プロファイル、model レジストリ、エージェントごとの config 用の**状態ディレクトリ**（`agentDir`）。
- `~/.openclaw/agents/<agentId>/sessions` 配下の**セッションストア**（チャット履歴 + ルーティング状態）。

認証プロファイルは **agent ごと** です。各 agent はそれぞれ次から読み取ります。

```text
~/.openclaw/agents/<agentId>/agent/auth-profiles.json
```

<Note>
`sessions_history` はここでも、より安全なセッション横断の再呼び出し経路です。これは生の transcript ダンプではなく、制限されサニタイズされたビューを返します。アシスタントの再呼び出しでは、thinking タグ、`<relevant-memories>` スキャフォールディング、プレーンテキストのツール呼び出し XML ペイロード（`<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>`、および切り詰められたツール呼び出しブロックを含む）、格下げされたツール呼び出しスキャフォールディング、漏洩した ASCII/全角の model 制御トークン、不正な MiniMax ツール呼び出し XML が、redaction/truncation の前に取り除かれます。
</Note>

<Warning>
メイン agent の認証情報は自動では**共有されません**。agent 間で `agentDir` を再利用しないでください（認証/セッション衝突の原因になります）。認証情報を共有したい場合は、`auth-profiles.json` を別の agent の `agentDir` にコピーしてください。
</Warning>

Skills は各 agent workspace と、`~/.openclaw/skills` のような共有ルートから読み込まれ、その後、設定されている場合は有効な agent skill allowlist によってフィルタされます。共有ベースラインには `agents.defaults.skills` を、agent ごとの置き換えには `agents.list[].skills` を使用してください。[Skills: per-agent vs shared](/ja-JP/tools/skills#per-agent-vs-shared-skills) および [Skills: agent skill allowlists](/ja-JP/tools/skills#agent-skill-allowlists) を参照してください。

Gateway は **1 つの agent**（デフォルト）または**複数の agent** を並列でホストできます。

<Note>
**Workspace に関する注記:** 各 agent の workspace はハードなサンドボックスではなく、**デフォルトの cwd** です。相対パスは workspace 内で解決されますが、絶対パスはサンドボックスが有効でない限りホスト上の他の場所にも到達できます。[サンドボックス化](/ja-JP/gateway/sandboxing) を参照してください。
</Note>

## パス（簡易マップ）

- Config: `~/.openclaw/openclaw.json`（または `OPENCLAW_CONFIG_PATH`）
- 状態ディレクトリ: `~/.openclaw`（または `OPENCLAW_STATE_DIR`）
- Workspace: `~/.openclaw/workspace`（または `~/.openclaw/workspace-<agentId>`）
- Agent ディレクトリ: `~/.openclaw/agents/<agentId>/agent`（または `agents.list[].agentDir`）
- Sessions: `~/.openclaw/agents/<agentId>/sessions`

### 単一 agent モード（デフォルト）

何もしなければ、OpenClaw は単一 agent を実行します。

- `agentId` のデフォルトは **`main`** です。
- Sessions は `agent:main:<mainKey>` としてキー付けされます。
- Workspace のデフォルトは `~/.openclaw/workspace` です（`OPENCLAW_PROFILE` が設定されている場合は `~/.openclaw/workspace-<profile>`）。
- 状態のデフォルトは `~/.openclaw/agents/main/agent` です。

## Agent ヘルパー

agent ウィザードを使って新しい isolated agent を追加します。

```bash
openclaw agents add work
```

その後、受信メッセージをルーティングするために `bindings` を追加します（またはウィザードに任せます）。

次で確認します。

```bash
openclaw agents list --bindings
```

## クイックスタート

<Steps>
  <Step title="各 agent の workspace を作成する">
    ウィザードを使うか、手動で workspace を作成します。

    ```bash
    openclaw agents add coding
    openclaw agents add social
    ```

    各 agent には、`SOUL.md`、`AGENTS.md`、任意の `USER.md` を含む専用 workspace と、専用の `agentDir`、さらに `~/.openclaw/agents/<agentId>` 配下のセッションストアが作成されます。

  </Step>
  <Step title="チャネルアカウントを作成する">
    使用したいチャネルごとに、agent ごとに 1 つのアカウントを作成します。

    - Discord: agent ごとに 1 bot。Message Content Intent を有効化し、各トークンをコピーします。
    - Telegram: BotFather 経由で agent ごとに 1 bot を作成し、各トークンをコピーします。
    - WhatsApp: アカウントごとに各電話番号をリンクします。

    ```bash
    openclaw channels login --channel whatsapp --account work
    ```

    チャネルガイドを参照してください: [Discord](/ja-JP/channels/discord)、[Telegram](/ja-JP/channels/telegram)、[WhatsApp](/ja-JP/channels/whatsapp)。

  </Step>
  <Step title="agent、account、binding を追加する">
    `agents.list` に agent、`channels.<channel>.accounts` にチャネルアカウントを追加し、`bindings` でそれらを接続します（例は下記）。
  </Step>
  <Step title="再起動して確認する">
    ```bash
    openclaw gateway restart
    openclaw agents list --bindings
    openclaw channels status --probe
    ```
  </Step>
</Steps>

## 複数 agent = 複数人、複数の個性

**複数 agent** を使うと、各 `agentId` が**完全に分離された persona** になります。

- **異なる電話番号/アカウント**（チャネルごとの `accountId`）。
- **異なる個性**（`AGENTS.md` や `SOUL.md` などの agent ごとの workspace ファイル）。
- **分離された認証 + セッション**（明示的に有効化しない限り相互干渉なし）。

これにより、**複数の人** が 1 つの Gateway サーバーを共有しつつ、それぞれの AI の「brain」とデータを分離して保てます。

## agent 間の QMD memory 検索

ある agent から別の agent の QMD セッショントランスクリプトを検索したい場合は、`agents.list[].memorySearch.qmd.extraCollections` に追加コレクションを加えてください。すべての agent が同じ共有 transcript コレクションを継承すべき場合にのみ、`agents.defaults.memorySearch.qmd.extraCollections` を使います。

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
            extraCollections: [{ path: "notes" }], // workspace 内で解決 -> "notes-main" という名前の collection
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

追加コレクションのパスは agent 間で共有できますが、そのパスが agent workspace の外にある場合、collection 名は明示的なままです。workspace 内のパスは agent スコープのままなので、各 agent は自分専用の transcript 検索セットを保持できます。

## 1 つの WhatsApp 番号、複数人（DM 分割）

**1 つの WhatsApp アカウント**のまま、**異なる WhatsApp DM** を別々の agent にルーティングできます。送信者の E.164（`+15551234567` のような形式）を `peer.kind: "direct"` でマッチさせます。返信は同じ WhatsApp 番号から送られます（agent ごとの送信者アイデンティティはありません）。

<Note>
ダイレクトチャットは agent の**メインセッションキー**に集約されるため、真の分離には**人ごとに 1 agent** が必要です。
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

注記:

- DM アクセス制御は **WhatsApp アカウントごとにグローバル**（pairing/allowlist）であり、agent ごとではありません。
- 共有グループについては、そのグループを 1 つの agent にバインドするか、[Broadcast groups](/ja-JP/channels/broadcast-groups) を使用してください。

## ルーティングルール（メッセージがどのように agent を選ぶか）

binding は**決定的**で、**最も具体的なものが優先**されます。

<Steps>
  <Step title="peer match">
    正確な DM/group/channel id。
  </Step>
  <Step title="parentPeer match">
    スレッド継承。
  </Step>
  <Step title="guildId + roles">
    Discord のロールルーティング。
  </Step>
  <Step title="guildId">
    Discord。
  </Step>
  <Step title="teamId">
    Slack。
  </Step>
  <Step title="チャネルの accountId match">
    アカウントごとのフォールバック。
  </Step>
  <Step title="チャネルレベルの match">
    `accountId: "*"`。
  </Step>
  <Step title="デフォルト agent">
    `agents.list[].default` にフォールバックし、なければ list の先頭エントリ、デフォルトは `main`。
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="タイブレークと AND セマンティクス">
    - 同じ階層で複数の binding が一致する場合、config 上で最初のものが優先されます。
    - binding に複数の match フィールド（例: `peer` + `guildId`）がある場合、指定されたフィールドはすべて必須です（`AND` セマンティクス）。

  </Accordion>
  <Accordion title="アカウントスコープの詳細">
    - `accountId` を省略した binding は、デフォルトアカウントにのみ一致します。
    - すべてのアカウントにまたがるチャネル全体のフォールバックには `accountId: "*"` を使用します。
    - 後から同じ agent 用に明示的な account id 付きで同じ binding を追加した場合、OpenClaw は既存のチャネルのみ binding を複製せず、アカウントスコープ付きにアップグレードします。

  </Accordion>
</AccordionGroup>

## 複数アカウント / 複数電話番号

**複数アカウント** をサポートするチャネル（例: WhatsApp）では、各ログインを識別するために `accountId` を使います。各 `accountId` を異なる agent にルーティングできるため、1 台のサーバーで複数の電話番号をホストしてもセッションは混ざりません。

`accountId` が省略されたときのチャネル全体のデフォルトアカウントを設定したい場合は、`channels.<channel>.defaultAccount` を設定してください（任意）。未設定の場合、OpenClaw は `default` が存在すればそれにフォールバックし、なければ最初に設定されたアカウント id（ソート順）にフォールバックします。

このパターンをサポートする一般的なチャネルには次があります。

- `whatsapp`、`telegram`、`discord`、`slack`、`signal`、`imessage`
- `irc`、`line`、`googlechat`、`mattermost`、`matrix`、`nextcloud-talk`
- `bluebubbles`、`zalo`、`zalouser`、`nostr`、`feishu`

## 概念

- `agentId`: 1 つの「brain」（workspace、agent ごとの認証、agent ごとのセッションストア）。
- `accountId`: 1 つのチャネルアカウントインスタンス（例: WhatsApp アカウント `"personal"` と `"biz"`）。
- `binding`: `(channel, accountId, peer)` と、必要に応じて guild/team id によって受信メッセージを `agentId` にルーティングします。
- ダイレクトチャットは `agent:<agentId>:<mainKey>` に集約されます（agent ごとの「main」、`session.mainKey`）。

## プラットフォーム例

<AccordionGroup>
  <Accordion title="agent ごとの Discord bot">
    各 Discord bot アカウントは一意の `accountId` に対応します。各アカウントを agent にバインドし、bot ごとに allowlist を維持します。

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

    - 各 bot を guild に招待し、Message Content Intent を有効にしてください。
    - トークンは `channels.discord.accounts.<id>.token` に保存されます（デフォルトアカウントでは `DISCORD_BOT_TOKEN` を使用できます）。

  </Accordion>
  <Accordion title="agent ごとの Telegram bot">
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

    - BotFather で agent ごとに 1 つの bot を作成し、各トークンをコピーします。
    - トークンは `channels.telegram.accounts.<id>.botToken` に保存されます（デフォルトアカウントでは `TELEGRAM_BOT_TOKEN` を使用できます）。

  </Accordion>
  <Accordion title="agent ごとの WhatsApp 番号">
    Gateway を起動する前に各アカウントをリンクしてください。

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

      // 決定的ルーティング: 最初の一致が優先（最も具体的なものを先頭に）。
      bindings: [
        { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
        { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },

        // 任意の peer 単位オーバーライド（例: 特定のグループを work agent に送る）。
        {
          agentId: "work",
          match: {
            channel: "whatsapp",
            accountId: "personal",
            peer: { kind: "group", id: "1203630...@g.us" },
          },
        },
      ],

      // デフォルトでは無効: agent 間メッセージングは明示的に有効化し、allowlist 化する必要があります。
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
              // 任意のオーバーライド。デフォルト: ~/.openclaw/credentials/whatsapp/personal
              // authDir: "~/.openclaw/credentials/whatsapp/personal",
            },
            biz: {
              // 任意のオーバーライド。デフォルト: ~/.openclaw/credentials/whatsapp/biz
              // authDir: "~/.openclaw/credentials/whatsapp/biz",
            },
          },
        },
      },
    }
    ```

  </Accordion>
</AccordionGroup>

## よくあるパターン

<Tabs>
  <Tab title="WhatsApp は日常用 + Telegram は深い作業用">
    チャネルで分割します。WhatsApp は高速な日常用 agent に、Telegram は Opus agent にルーティングします。

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

    - チャネルに複数アカウントがある場合は、binding に `accountId` を追加してください（例: `{ channel: "whatsapp", accountId: "personal" }`）。
    - 1 つの DM/group だけを Opus にルーティングし、それ以外を chat のままにしたい場合は、その peer に対する `match.peer` binding を追加してください。peer マッチは常にチャネル全体のルールより優先されます。

  </Tab>
  <Tab title="同じチャネルで、1 つの peer だけ Opus にする">
    WhatsApp は高速 agent のままにしつつ、1 つの DM だけ Opus にルーティングします。

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

    peer binding は常に優先されるため、チャネル全体のルールより上に置いてください。

  </Tab>
  <Tab title="WhatsApp グループにバインドされた family agent">
    専用の family agent を 1 つの WhatsApp グループにバインドし、メンションゲートとより厳しいツールポリシーを設定します。

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

    - ツールの allow/deny リストは **tools** であり、skills ではありません。skill がバイナリを実行する必要がある場合は、`exec` が許可されており、そのバイナリがサンドボックス内に存在することを確認してください。
    - より厳密なゲートが必要な場合は、`agents.list[].groupChat.mentionPatterns` を設定し、チャネルのグループ allowlist を有効なままにしてください。

  </Tab>
</Tabs>

## agent ごとの sandbox とツール設定

各 agent はそれぞれ独自の sandbox とツール制限を持てます。

```js
{
  agents: {
    list: [
      {
        id: "personal",
        workspace: "~/.openclaw/workspace-personal",
        sandbox: {
          mode: "off",  // personal agent では sandbox なし
        },
        // ツール制限なし - すべてのツールが利用可能
      },
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        sandbox: {
          mode: "all",     // 常に sandbox 化
          scope: "agent",  // agent ごとに 1 コンテナ
          docker: {
            // コンテナ作成後の任意の一回限りセットアップ
            setupCommand: "apt-get update && apt-get install -y git curl",
          },
        },
        tools: {
          allow: ["read"],                    // read ツールのみ
          deny: ["exec", "write", "edit", "apply_patch"],    // 他を拒否
        },
      },
    ],
  },
}
```

<Note>
`setupCommand` は `sandbox.docker` 配下にあり、コンテナ作成時に一度だけ実行されます。解決された scope が `"shared"` の場合、agent ごとの `sandbox.docker.*` オーバーライドは無視されます。
</Note>

**利点:**

- **セキュリティ分離**: 信頼できない agent に対してツールを制限できます。
- **リソース制御**: 一部の agent だけを sandbox 化し、他はホスト上で実行できます。
- **柔軟なポリシー**: agent ごとに異なる権限を設定できます。

<Note>
`tools.elevated` は**グローバル**かつ送信者ベースであり、agent ごとには設定できません。agent ごとの境界が必要な場合は、`exec` を拒否するために `agents.list[].tools` を使ってください。グループ対象指定には、@メンションが意図した agent にきれいに対応するよう `agents.list[].groupChat.mentionPatterns` を使ってください。
</Note>

詳細な例については [マルチエージェント sandbox とツール](/ja-JP/tools/multi-agent-sandbox-tools) を参照してください。

## 関連

- [ACP agents](/ja-JP/tools/acp-agents) — 外部コーディングハーネスの実行
- [チャネルルーティング](/ja-JP/channels/channel-routing) — メッセージが agent にルーティングされる仕組み
- [Presence](/ja-JP/concepts/presence) — agent の Presence と可用性
- [セッション](/ja-JP/concepts/session) — セッション分離とルーティング
- [サブエージェント](/ja-JP/tools/subagents) — バックグラウンド agent 実行の起動
