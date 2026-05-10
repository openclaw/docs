---
read_when: You want multiple isolated agents (workspaces + auth) in one gateway process.
sidebarTitle: Multi-agent routing
status: active
summary: 'Định tuyến đa tác tử: tác tử cô lập, tài khoản kênh và liên kết'
title: Định tuyến đa tác tử
x-i18n:
    generated_at: "2026-05-10T19:31:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7fd194cbe0938cc6ef6dd9b9803d2b1fe6f3e0777f4df7c407c692fd9f743c59
    source_path: concepts/multi-agent.md
    workflow: 16
---

Chạy nhiều tác nhân _cô lập_ — mỗi tác nhân có workspace, thư mục trạng thái (`agentDir`) và lịch sử phiên riêng — cùng nhiều tài khoản kênh (ví dụ: hai WhatsApp) trong một Gateway đang chạy. Tin nhắn đến được định tuyến đến đúng tác nhân thông qua các binding.

Ở đây, **tác nhân** là toàn bộ phạm vi theo từng persona: tệp workspace, hồ sơ xác thực, registry mô hình và kho phiên. `agentDir` là thư mục trạng thái trên đĩa chứa cấu hình theo từng tác nhân này tại `~/.openclaw/agents/<agentId>/`. **Binding** ánh xạ một tài khoản kênh (ví dụ: một Slack workspace hoặc một số WhatsApp) đến một trong các tác nhân đó.

## "Một tác nhân" là gì?

**Tác nhân** là một bộ não được phân phạm vi đầy đủ với riêng:

- **Workspace** (tệp, AGENTS.md/SOUL.md/USER.md, ghi chú cục bộ, quy tắc persona).
- **Thư mục trạng thái** (`agentDir`) cho hồ sơ xác thực, registry mô hình và cấu hình theo từng tác nhân.
- **Kho phiên** (lịch sử chat + trạng thái định tuyến) trong `~/.openclaw/agents/<agentId>/sessions`.

Hồ sơ xác thực là **theo từng tác nhân**. Mỗi tác nhân đọc từ tệp riêng của nó:

```text
~/.openclaw/agents/<agentId>/agent/auth-profiles.json
```

<Note>
`sessions_history` cũng là đường dẫn nhớ lại liên phiên an toàn hơn ở đây: nó trả về một chế độ xem có giới hạn và đã được làm sạch, không phải bản dump transcript thô. Việc nhớ lại của trợ lý loại bỏ thẻ suy nghĩ, khung `<relevant-memories>`, payload XML gọi công cụ dạng văn bản thuần (bao gồm `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` và các khối gọi công cụ bị cắt ngắn), khung gọi công cụ đã hạ cấp, token điều khiển mô hình ASCII/full-width bị rò rỉ và XML gọi công cụ MiniMax không đúng định dạng trước khi biên tập/cắt ngắn.
</Note>

<Warning>
Không bao giờ tái sử dụng `agentDir` giữa các tác nhân (việc này gây xung đột xác thực/phiên). Tác nhân
có thể đọc xuyên qua hồ sơ xác thực của tác nhân mặc định/chính khi chúng không có
hồ sơ cục bộ, nhưng OpenClaw không sao chép token làm mới OAuth vào kho
tác nhân phụ. Nếu bạn muốn một tài khoản OAuth độc lập, hãy đăng nhập từ
tác nhân đó; nếu bạn sao chép thông tin xác thực thủ công, chỉ sao chép các hồ sơ
`api_key` hoặc `token` tĩnh có tính di động.
</Warning>

Skills được tải từ workspace của từng tác nhân cùng các gốc dùng chung như `~/.openclaw/skills`, rồi được lọc theo danh sách cho phép Skills hiệu lực của tác nhân khi được cấu hình. Dùng `agents.defaults.skills` cho baseline dùng chung và `agents.list[].skills` để thay thế theo từng tác nhân. Xem [Skills: theo từng tác nhân so với dùng chung](/vi/tools/skills#per-agent-vs-shared-skills) và [Skills: danh sách cho phép Skills của tác nhân](/vi/tools/skills#agent-skill-allowlists).

Gateway có thể lưu trữ **một tác nhân** (mặc định) hoặc **nhiều tác nhân** chạy song song.

<Note>
**Ghi chú về workspace:** workspace của từng tác nhân là **cwd mặc định**, không phải sandbox cứng. Đường dẫn tương đối được phân giải bên trong workspace, nhưng đường dẫn tuyệt đối có thể truy cập các vị trí khác trên máy chủ trừ khi sandboxing được bật. Xem [Sandboxing](/vi/gateway/sandboxing).
</Note>

## Đường dẫn (bản đồ nhanh)

- Cấu hình: `~/.openclaw/openclaw.json` (hoặc `OPENCLAW_CONFIG_PATH`)
- Thư mục trạng thái: `~/.openclaw` (hoặc `OPENCLAW_STATE_DIR`)
- Workspace: `~/.openclaw/workspace` (hoặc `~/.openclaw/workspace-<agentId>`)
- Thư mục tác nhân: `~/.openclaw/agents/<agentId>/agent` (hoặc `agents.list[].agentDir`)
- Phiên: `~/.openclaw/agents/<agentId>/sessions`

### Chế độ một tác nhân (mặc định)

Nếu bạn không làm gì, OpenClaw chạy một tác nhân duy nhất:

- `agentId` mặc định là **`main`**.
- Phiên được khóa theo dạng `agent:main:<mainKey>`.
- Workspace mặc định là `~/.openclaw/workspace` (hoặc `~/.openclaw/workspace-<profile>` khi `OPENCLAW_PROFILE` được đặt).
- Trạng thái mặc định là `~/.openclaw/agents/main/agent`.

## Trình trợ giúp tác nhân

Dùng trình hướng dẫn tác nhân để thêm một tác nhân cô lập mới:

```bash
openclaw agents add work
```

Sau đó thêm `bindings` (hoặc để trình hướng dẫn làm việc đó) để định tuyến tin nhắn đến.

Xác minh bằng:

```bash
openclaw agents list --bindings
```

## Bắt đầu nhanh

<Steps>
  <Step title="Create each agent workspace">
    Dùng trình hướng dẫn hoặc tạo workspace thủ công:

    ```bash
    openclaw agents add coding
    openclaw agents add social
    ```

    Mỗi tác nhân có workspace riêng với `SOUL.md`, `AGENTS.md` và `USER.md` tùy chọn, cùng một `agentDir` chuyên biệt và kho phiên trong `~/.openclaw/agents/<agentId>`.

  </Step>
  <Step title="Create channel accounts">
    Tạo một tài khoản cho mỗi tác nhân trên các kênh bạn ưu tiên:

    - Discord: một bot cho mỗi tác nhân, bật Message Content Intent, sao chép từng token.
    - Telegram: một bot cho mỗi tác nhân qua BotFather, sao chép từng token.
    - WhatsApp: liên kết từng số điện thoại cho mỗi tài khoản.

    ```bash
    openclaw channels login --channel whatsapp --account work
    ```

    Xem hướng dẫn kênh: [Discord](/vi/channels/discord), [Telegram](/vi/channels/telegram), [WhatsApp](/vi/channels/whatsapp).

  </Step>
  <Step title="Add agents, accounts, and bindings">
    Thêm tác nhân trong `agents.list`, tài khoản kênh trong `channels.<channel>.accounts`, rồi kết nối chúng bằng `bindings` (ví dụ bên dưới).
  </Step>
  <Step title="Restart and verify">
    ```bash
    openclaw gateway restart
    openclaw agents list --bindings
    openclaw channels status --probe
    ```
  </Step>
</Steps>

## Nhiều tác nhân = nhiều người, nhiều cá tính

Với **nhiều tác nhân**, mỗi `agentId` trở thành một **persona được cô lập hoàn toàn**:

- **Số điện thoại/tài khoản khác nhau** (theo `accountId` của từng kênh).
- **Cá tính khác nhau** (các tệp workspace theo từng tác nhân như `AGENTS.md` và `SOUL.md`).
- **Xác thực + phiên riêng biệt** (không trao đổi chéo trừ khi được bật rõ ràng).

Điều này cho phép **nhiều người** dùng chung một máy chủ Gateway trong khi vẫn giữ các "bộ não" AI và dữ liệu của họ được cô lập.

## Tìm kiếm bộ nhớ QMD liên tác nhân

Nếu một tác nhân cần tìm kiếm transcript phiên QMD của tác nhân khác, hãy thêm các collection bổ sung trong `agents.list[].memorySearch.qmd.extraCollections`. Chỉ dùng `agents.defaults.memorySearch.qmd.extraCollections` khi mọi tác nhân đều nên kế thừa cùng các collection transcript dùng chung.

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

Đường dẫn collection bổ sung có thể được dùng chung giữa các tác nhân, nhưng tên collection vẫn tường minh khi đường dẫn nằm ngoài workspace của tác nhân. Các đường dẫn bên trong workspace vẫn được phân phạm vi theo tác nhân để mỗi tác nhân giữ bộ tìm kiếm transcript riêng.

## Một số WhatsApp, nhiều người (tách DM)

Bạn có thể định tuyến **các DM WhatsApp khác nhau** đến các tác nhân khác nhau trong khi vẫn dùng **một tài khoản WhatsApp**. Khớp theo E.164 của người gửi (như `+15551234567`) với `peer.kind: "direct"`. Trả lời vẫn đến từ cùng một số WhatsApp (không có danh tính người gửi theo từng tác nhân).

<Note>
Chat trực tiếp thu gọn về **khóa phiên chính** của tác nhân, vì vậy cô lập thật sự cần **một tác nhân cho mỗi người**.
</Note>

Ví dụ:

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

Ghi chú:

- Kiểm soát truy cập DM là **toàn cục theo từng tài khoản WhatsApp** (pairing/allowlist), không phải theo từng tác nhân.
- Với nhóm dùng chung, bind nhóm đó với một tác nhân hoặc dùng [Nhóm phát sóng](/vi/channels/broadcast-groups).

## Quy tắc định tuyến (cách tin nhắn chọn tác nhân)

Binding là **xác định** và **cụ thể nhất thắng**:

<Steps>
  <Step title="peer match">
    ID DM/nhóm/kênh chính xác.
  </Step>
  <Step title="parentPeer match">
    Kế thừa luồng.
  </Step>
  <Step title="guildId + roles">
    Định tuyến theo vai trò Discord.
  </Step>
  <Step title="guildId">
    Discord.
  </Step>
  <Step title="teamId">
    Slack.
  </Step>
  <Step title="accountId match for a channel">
    Fallback theo từng tài khoản.
  </Step>
  <Step title="Channel-level match">
    `accountId: "*"`.
  </Step>
  <Step title="Default agent">
    Fallback về `agents.list[].default`, nếu không thì mục đầu tiên trong danh sách, mặc định: `main`.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Tie-breaking and AND semantics">
    - Nếu nhiều binding khớp trong cùng một cấp, binding đầu tiên theo thứ tự cấu hình thắng.
    - Nếu một binding đặt nhiều trường khớp (ví dụ `peer` + `guildId`), tất cả các trường đã chỉ định đều bắt buộc (ngữ nghĩa `AND`).

  </Accordion>
  <Accordion title="Account-scope detail">
    - Binding bỏ qua `accountId` chỉ khớp tài khoản mặc định.
    - Dùng `accountId: "*"` làm fallback toàn kênh trên tất cả tài khoản.
    - Nếu sau đó bạn thêm cùng binding cho cùng tác nhân với ID tài khoản tường minh, OpenClaw nâng cấp binding chỉ theo kênh hiện có thành binding theo phạm vi tài khoản thay vì nhân đôi nó.

  </Accordion>
</AccordionGroup>

## Nhiều tài khoản / số điện thoại

Các kênh hỗ trợ **nhiều tài khoản** (ví dụ: WhatsApp) dùng `accountId` để định danh từng lần đăng nhập. Mỗi `accountId` có thể được định tuyến đến một tác nhân khác nhau, vì vậy một máy chủ có thể lưu trữ nhiều số điện thoại mà không trộn lẫn phiên.

Nếu bạn muốn một tài khoản mặc định toàn kênh khi `accountId` bị bỏ qua, hãy đặt `channels.<channel>.defaultAccount` (tùy chọn). Khi không đặt, OpenClaw fallback về `default` nếu có, nếu không thì dùng ID tài khoản được cấu hình đầu tiên (đã sắp xếp).

Các kênh phổ biến hỗ trợ mẫu này gồm:

- `whatsapp`, `telegram`, `discord`, `slack`, `signal`, `imessage`
- `irc`, `line`, `googlechat`, `mattermost`, `matrix`, `nextcloud-talk`
- `zalo`, `zalouser`, `nostr`, `feishu`

## Khái niệm

- `agentId`: một "bộ não" (workspace, xác thực theo từng tác nhân, kho phiên theo từng tác nhân).
- `accountId`: một phiên bản tài khoản kênh (ví dụ: tài khoản WhatsApp `"personal"` so với `"biz"`).
- `binding`: định tuyến tin nhắn đến đến một `agentId` theo `(channel, accountId, peer)` và tùy chọn ID guild/team.
- Chat trực tiếp thu gọn về `agent:<agentId>:<mainKey>` ("main" theo từng tác nhân; `session.mainKey`).

## Ví dụ nền tảng

<AccordionGroup>
  <Accordion title="Discord bots per agent">
    Mỗi tài khoản bot Discord ánh xạ đến một `accountId` duy nhất. Bind từng tài khoản với một tác nhân và giữ allowlist theo từng bot.

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

    - Mời từng bot vào guild và bật Message Content Intent.
    - Token nằm trong `channels.discord.accounts.<id>.token` (tài khoản mặc định có thể dùng `DISCORD_BOT_TOKEN`).

  </Accordion>
  <Accordion title="Bot Telegram cho từng agent">
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

    - Tạo một bot cho mỗi agent bằng BotFather và sao chép từng token.
    - Token nằm trong `channels.telegram.accounts.<id>.botToken` (tài khoản mặc định có thể dùng `TELEGRAM_BOT_TOKEN`).

  </Accordion>
  <Accordion title="Số WhatsApp cho từng agent">
    Liên kết từng tài khoản trước khi khởi động Gateway:

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

## Mẫu phổ biến

<Tabs>
  <Tab title="WhatsApp hằng ngày + Telegram cho công việc chuyên sâu">
    Chia theo kênh: định tuyến WhatsApp đến một agent nhanh cho việc hằng ngày và Telegram đến một agent Opus.

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

    Ghi chú:

    - Nếu bạn có nhiều tài khoản cho một kênh, hãy thêm `accountId` vào binding (ví dụ `{ channel: "whatsapp", accountId: "personal" }`).
    - Để định tuyến một DM/nhóm riêng lẻ đến Opus trong khi giữ phần còn lại trên chat, hãy thêm binding `match.peer` cho peer đó; khớp peer luôn thắng các quy tắc trên toàn kênh.

  </Tab>
  <Tab title="Cùng kênh, một peer đến Opus">
    Giữ WhatsApp trên agent nhanh, nhưng định tuyến một DM đến Opus:

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

    Binding peer luôn thắng, vì vậy hãy đặt chúng phía trên quy tắc trên toàn kênh.

  </Tab>
  <Tab title="Agent gia đình được gắn với một nhóm WhatsApp">
    Gắn một agent gia đình chuyên dụng với một nhóm WhatsApp duy nhất, có cổng kiểm soát bằng đề cập và chính sách công cụ chặt chẽ hơn:

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

    Ghi chú:

    - Danh sách cho phép/từ chối công cụ là **tools**, không phải skills. Nếu một skill cần chạy một binary, hãy đảm bảo `exec` được cho phép và binary tồn tại trong sandbox.
    - Để kiểm soát chặt chẽ hơn, hãy đặt `agents.list[].groupChat.mentionPatterns` và giữ allowlist nhóm được bật cho kênh.

  </Tab>
</Tabs>

## Cấu hình sandbox và công cụ cho từng agent

Mỗi agent có thể có sandbox và hạn chế công cụ riêng:

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
`setupCommand` nằm dưới `sandbox.docker` và chạy một lần khi tạo container. Các ghi đè `sandbox.docker.*` cho từng agent sẽ bị bỏ qua khi scope đã phân giải là `"shared"`.
</Note>

**Lợi ích:**

- **Cách ly bảo mật**: hạn chế công cụ cho các agent không đáng tin cậy.
- **Kiểm soát tài nguyên**: sandbox các agent cụ thể trong khi giữ các agent khác trên host.
- **Chính sách linh hoạt**: quyền khác nhau cho từng agent.

<Note>
`tools.elevated` là **toàn cục** và dựa trên người gửi; nó không thể cấu hình theo từng agent. Nếu bạn cần ranh giới theo từng agent, hãy dùng `agents.list[].tools` để từ chối `exec`. Để nhắm mục tiêu nhóm, hãy dùng `agents.list[].groupChat.mentionPatterns` để @mentions ánh xạ rõ ràng đến agent dự định.
</Note>

Xem [Sandbox và công cụ đa agent](/vi/tools/multi-agent-sandbox-tools) để biết ví dụ chi tiết.

## Liên quan

- [Agent ACP](/vi/tools/acp-agents) — chạy các harness lập trình bên ngoài
- [Định tuyến kênh](/vi/channels/channel-routing) — cách tin nhắn được định tuyến đến agent
- [Presence](/vi/concepts/presence) — trạng thái hiện diện và khả dụng của agent
- [Session](/vi/concepts/session) — cách ly và định tuyến phiên
- [Sub-agent](/vi/tools/subagents) — sinh các lượt chạy agent nền
