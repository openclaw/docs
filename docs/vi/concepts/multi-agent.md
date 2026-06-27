---
read_when: You want multiple isolated agents (workspaces + auth) in one gateway process.
sidebarTitle: Multi-agent routing
status: active
summary: 'Định tuyến đa tác nhân: tác nhân tách biệt, tài khoản kênh và liên kết'
title: Định tuyến đa tác tử
x-i18n:
    generated_at: "2026-06-27T17:24:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4c1c55188cd27ea786cf65dcabd356a602e1e6da5f842532b189df59195274db
    source_path: concepts/multi-agent.md
    workflow: 16
---

Chạy nhiều tác tử _cô lập_ — mỗi tác tử có workspace, thư mục trạng thái (`agentDir`) và lịch sử phiên riêng — cộng với nhiều tài khoản kênh (ví dụ: hai WhatsApp) trong một Gateway đang chạy. Tin nhắn đến được định tuyến đến đúng tác tử thông qua các liên kết.

Một **tác tử** ở đây là phạm vi đầy đủ theo từng persona: tệp workspace, hồ sơ xác thực, registry mô hình và kho phiên. `agentDir` là thư mục trạng thái trên đĩa chứa cấu hình theo từng tác tử này tại `~/.openclaw/agents/<agentId>/`. Một **liên kết** ánh xạ một tài khoản kênh (ví dụ: một workspace Slack hoặc một số WhatsApp) tới một trong các tác tử đó.

## "Một tác tử" là gì?

Một **tác tử** là một bộ não có phạm vi đầy đủ với riêng:

- **Workspace** (tệp, AGENTS.md/SOUL.md/USER.md, ghi chú cục bộ, quy tắc persona).
- **Thư mục trạng thái** (`agentDir`) cho hồ sơ xác thực, registry mô hình và cấu hình theo từng tác tử.
- **Kho phiên** (lịch sử trò chuyện + trạng thái định tuyến) dưới `~/.openclaw/agents/<agentId>/sessions`.

Hồ sơ xác thực là **theo từng tác tử**. Mỗi tác tử đọc từ tệp riêng của nó:

```text
~/.openclaw/agents/<agentId>/agent/auth-profiles.json
```

<Note>
`sessions_history` cũng là đường dẫn nhớ lại xuyên phiên an toàn hơn ở đây: nó trả về một dạng xem có giới hạn và đã được làm sạch, không phải bản dump transcript thô. Việc nhớ lại của assistant loại bỏ thẻ suy nghĩ, khung `<relevant-memories>`, payload XML tool-call dạng văn bản thuần (bao gồm `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` và các khối tool-call bị cắt ngắn), khung tool-call đã hạ cấp, token điều khiển mô hình ASCII/toàn chiều bị rò rỉ và XML tool-call MiniMax sai định dạng trước khi biên tập/cắt ngắn.
</Note>

<Warning>
Không bao giờ dùng lại `agentDir` giữa các tác tử (việc này gây xung đột xác thực/phiên). Tác tử
có thể đọc xuyên tới hồ sơ xác thực của tác tử mặc định/chính khi chúng không có
hồ sơ cục bộ, nhưng OpenClaw không sao chép token làm mới OAuth vào
kho tác tử phụ. Nếu bạn muốn một tài khoản OAuth độc lập, hãy đăng nhập từ
tác tử đó; nếu bạn sao chép thông tin xác thực thủ công, chỉ sao chép các hồ sơ
`api_key` hoặc `token` tĩnh có thể di chuyển.
</Warning>

Skills được tải từ workspace của từng tác tử cộng với các gốc dùng chung như `~/.openclaw/skills`, rồi được lọc theo allowlist Skills hiệu lực của tác tử khi được cấu hình. Dùng `agents.defaults.skills` làm baseline dùng chung và `agents.list[].skills` để thay thế theo từng tác tử. Xem [Skills: theo từng tác tử so với dùng chung](/vi/tools/skills#per-agent-vs-shared-skills) và [Skills: allowlist Skills của tác tử](/vi/tools/skills#agent-allowlists).

Gateway có thể lưu trữ **một tác tử** (mặc định) hoặc **nhiều tác tử** song song.

<Note>
**Ghi chú workspace:** workspace của mỗi tác tử là **cwd mặc định**, không phải sandbox cứng. Đường dẫn tương đối phân giải bên trong workspace, nhưng đường dẫn tuyệt đối có thể truy cập các vị trí host khác trừ khi bật sandboxing. Xem [Sandboxing](/vi/gateway/sandboxing).
</Note>

## Đường dẫn (bản đồ nhanh)

- Cấu hình: `~/.openclaw/openclaw.json` (hoặc `OPENCLAW_CONFIG_PATH`)
- Thư mục trạng thái: `~/.openclaw` (hoặc `OPENCLAW_STATE_DIR`)
- Workspace: `~/.openclaw/workspace` (hoặc `~/.openclaw/workspace-<agentId>`)
- Thư mục tác tử: `~/.openclaw/agents/<agentId>/agent` (hoặc `agents.list[].agentDir`)
- Phiên: `~/.openclaw/agents/<agentId>/sessions`

### Chế độ một tác tử (mặc định)

Nếu bạn không làm gì, OpenClaw chạy một tác tử duy nhất:

- `agentId` mặc định là **`main`**.
- Phiên được khóa theo dạng `agent:main:<mainKey>`.
- Workspace mặc định là `~/.openclaw/workspace` (hoặc `~/.openclaw/workspace-<profile>` khi đặt `OPENCLAW_PROFILE`).
- Trạng thái mặc định là `~/.openclaw/agents/main/agent`.

## Trình hỗ trợ tác tử

Dùng wizard tác tử để thêm một tác tử cô lập mới:

```bash
openclaw agents add work
```

Sau đó thêm `bindings` (hoặc để wizard làm việc đó) để định tuyến tin nhắn đến.

Xác minh bằng:

```bash
openclaw agents list --bindings
```

## Bắt đầu nhanh

<Steps>
  <Step title="Tạo workspace cho từng tác tử">
    Dùng wizard hoặc tạo workspace thủ công:

    ```bash
    openclaw agents add coding
    openclaw agents add social
    ```

    Mỗi tác tử có workspace riêng với `SOUL.md`, `AGENTS.md` và `USER.md` tùy chọn, cùng một `agentDir` chuyên dụng và kho phiên dưới `~/.openclaw/agents/<agentId>`.

  </Step>
  <Step title="Tạo tài khoản kênh">
    Tạo một tài khoản cho mỗi tác tử trên các kênh bạn ưu tiên:

    - Discord: một bot cho mỗi tác tử, bật Message Content Intent, sao chép từng token.
    - Telegram: một bot cho mỗi tác tử qua BotFather, sao chép từng token.
    - WhatsApp: liên kết từng số điện thoại theo mỗi tài khoản.

    ```bash
    openclaw channels login --channel whatsapp --account work
    ```

    Xem hướng dẫn kênh: [Discord](/vi/channels/discord), [Telegram](/vi/channels/telegram), [WhatsApp](/vi/channels/whatsapp).

  </Step>
  <Step title="Thêm tác tử, tài khoản và liên kết">
    Thêm tác tử dưới `agents.list`, tài khoản kênh dưới `channels.<channel>.accounts`, và kết nối chúng bằng `bindings` (ví dụ bên dưới).
  </Step>
  <Step title="Khởi động lại và xác minh">
    ```bash
    openclaw gateway restart
    openclaw agents list --bindings
    openclaw channels status --probe
    ```
  </Step>
</Steps>

## Nhiều tác tử = nhiều người, nhiều tính cách

Với **nhiều tác tử**, mỗi `agentId` trở thành một **persona được cô lập hoàn toàn**:

- **Số điện thoại/tài khoản khác nhau** (theo `accountId` của từng kênh).
- **Tính cách khác nhau** (các tệp workspace theo từng tác tử như `AGENTS.md` và `SOUL.md`).
- **Xác thực + phiên riêng biệt** (không lẫn chéo trừ khi được bật rõ ràng).

Điều này cho phép **nhiều người** chia sẻ một máy chủ Gateway trong khi vẫn giữ "bộ não" AI và dữ liệu của họ được cô lập.

## Tìm kiếm bộ nhớ QMD xuyên tác tử

Nếu một tác tử cần tìm kiếm transcript phiên QMD của tác tử khác, hãy thêm các collection bổ sung dưới `agents.list[].memorySearch.qmd.extraCollections`. Chỉ dùng `agents.defaults.memorySearch.qmd.extraCollections` khi mọi tác tử đều nên kế thừa cùng các collection transcript dùng chung.

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

Đường dẫn collection bổ sung có thể được dùng chung giữa các tác tử, nhưng tên collection vẫn là tường minh khi đường dẫn nằm ngoài workspace của tác tử. Đường dẫn bên trong workspace vẫn được giới hạn theo tác tử để mỗi tác tử giữ bộ tìm kiếm transcript riêng.

## Một số WhatsApp, nhiều người (tách DM)

Bạn có thể định tuyến **các DM WhatsApp khác nhau** tới các tác tử khác nhau trong khi vẫn dùng **một tài khoản WhatsApp**. Khớp theo người gửi E.164 (như `+15551234567`) với `peer.kind: "direct"`. Phản hồi vẫn đến từ cùng số WhatsApp (không có danh tính người gửi theo từng tác tử).

<Note>
Trò chuyện trực tiếp gộp về **khóa phiên chính** của tác tử, vì vậy cách ly thực sự cần **một tác tử cho mỗi người**.
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

- Kiểm soát truy cập DM là **toàn cục theo tài khoản WhatsApp** (ghép nối/allowlist), không phải theo tác tử.
- Với nhóm dùng chung, liên kết nhóm với một tác tử hoặc dùng [nhóm phát sóng](/vi/channels/broadcast-groups).

## Quy tắc định tuyến (cách tin nhắn chọn tác tử)

Liên kết là **xác định** và **cụ thể nhất thắng**:

<Steps>
  <Step title="khớp peer">
    ID DM/nhóm/kênh chính xác.
  </Step>
  <Step title="khớp parentPeer">
    Kế thừa luồng.
  </Step>
  <Step title="guildId + vai trò">
    Định tuyến vai trò Discord.
  </Step>
  <Step title="guildId">
    Discord.
  </Step>
  <Step title="teamId">
    Slack.
  </Step>
  <Step title="khớp accountId cho một kênh">
    Fallback theo từng tài khoản.
  </Step>
  <Step title="Khớp cấp kênh">
    `accountId: "*"`.
  </Step>
  <Step title="Tác tử mặc định">
    Fallback về `agents.list[].default`, nếu không thì mục đầu tiên trong danh sách, mặc định: `main`.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Phân xử hòa và ngữ nghĩa AND">
    - Nếu nhiều liên kết khớp trong cùng một tầng, liên kết đầu tiên theo thứ tự cấu hình sẽ thắng.
    - Nếu một liên kết đặt nhiều trường khớp (ví dụ `peer` + `guildId`), tất cả các trường đã chỉ định đều bắt buộc (ngữ nghĩa `AND`).

  </Accordion>
  <Accordion title="Chi tiết phạm vi tài khoản">
    - Một liên kết bỏ qua `accountId` chỉ khớp tài khoản mặc định. Nó không khớp tất cả tài khoản.
    - Dùng `accountId: "*"` làm fallback toàn kênh trên mọi tài khoản.
    - Dùng `accountId: "<name>"` để khớp một tài khoản.
    - Nếu sau này bạn thêm cùng liên kết cho cùng tác tử với ID tài khoản tường minh, OpenClaw nâng cấp liên kết chỉ theo kênh hiện có thành liên kết có phạm vi tài khoản thay vì nhân đôi nó.

  </Accordion>
</AccordionGroup>

## Nhiều tài khoản / số điện thoại

Các kênh hỗ trợ **nhiều tài khoản** (ví dụ: WhatsApp) dùng `accountId` để nhận diện từng lần đăng nhập. Mỗi `accountId` có thể được định tuyến tới một tác tử khác nhau, vì vậy một máy chủ có thể lưu trữ nhiều số điện thoại mà không trộn lẫn phiên.

Nếu bạn muốn một tài khoản mặc định toàn kênh khi bỏ qua `accountId`, hãy đặt `channels.<channel>.defaultAccount` (tùy chọn). Khi không đặt, OpenClaw fallback về `default` nếu có, nếu không thì ID tài khoản được cấu hình đầu tiên (đã sắp xếp).

Các kênh phổ biến hỗ trợ mẫu này gồm:

- `whatsapp`, `telegram`, `discord`, `slack`, `signal`, `imessage`
- `irc`, `line`, `googlechat`, `mattermost`, `matrix`, `nextcloud-talk`
- `zalo`, `zalouser`, `nostr`, `feishu`

## Khái niệm

- `agentId`: một "bộ não" (workspace, xác thực theo từng tác tử, kho phiên theo từng tác tử).
- `accountId`: một thực thể tài khoản kênh (ví dụ tài khoản WhatsApp `"personal"` so với `"biz"`).
- `binding`: định tuyến tin nhắn đến tới một `agentId` theo `(channel, accountId, peer)` và tùy chọn ID guild/team.
- Trò chuyện trực tiếp gộp về `agent:<agentId>:<mainKey>` ("main" theo từng tác tử; `session.mainKey`).

## Ví dụ nền tảng

<AccordionGroup>
  <Accordion title="Bot Discord theo từng tác tử">
    Mỗi tài khoản bot Discord ánh xạ tới một `accountId` duy nhất. Liên kết từng tài khoản với một tác tử và giữ allowlist theo từng bot.

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
  <Accordion title="Bot Telegram cho từng tác nhân">
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

    - Tạo một bot cho mỗi tác nhân bằng BotFather và sao chép từng token.
    - Token nằm trong `channels.telegram.accounts.<id>.botToken` (tài khoản mặc định có thể dùng `TELEGRAM_BOT_TOKEN`).
    - Với nhiều bot trong cùng một nhóm Telegram, hãy mời từng bot và nhắc đến bot cần trả lời.
    - Tắt BotFather Privacy Mode cho từng bot nhóm, rồi thêm lại bot để Telegram áp dụng cài đặt.
    - Cho phép nhóm bằng `channels.telegram.groups`, hoặc chỉ dùng `groupPolicy: "open"` cho các triển khai nhóm đáng tin cậy.
    - Đặt ID người dùng của người gửi trong `groupAllowFrom`. ID nhóm và siêu nhóm thuộc về `channels.telegram.groups`, không phải `groupAllowFrom`.
    - Liên kết bằng `accountId` để mỗi bot định tuyến đến tác nhân riêng của nó.

  </Accordion>
  <Accordion title="Số WhatsApp cho từng tác nhân">
    Liên kết từng tài khoản trước khi khởi động gateway:

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
    Chia theo kênh: định tuyến WhatsApp đến một tác nhân nhanh cho hằng ngày và Telegram đến một tác nhân Opus.

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

    Ghi chú:

    - Các ví dụ này dùng `accountId: "*"` để các liên kết tiếp tục hoạt động nếu bạn thêm tài khoản sau này.
    - Để định tuyến một DM/nhóm duy nhất đến Opus trong khi giữ phần còn lại ở chat, hãy thêm liên kết `match.peer` cho peer đó; khớp peer luôn thắng các quy tắc toàn kênh.

  </Tab>
  <Tab title="Cùng kênh, một peer đến Opus">
    Giữ WhatsApp trên tác nhân nhanh, nhưng định tuyến một DM đến Opus:

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

    Liên kết peer luôn thắng, vì vậy hãy giữ chúng phía trên quy tắc toàn kênh.

  </Tab>
  <Tab title="Tác nhân gia đình được liên kết với một nhóm WhatsApp">
    Liên kết một tác nhân gia đình chuyên dụng với một nhóm WhatsApp duy nhất, có kiểm soát bằng nhắc đến và chính sách công cụ chặt chẽ hơn:

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

    - Danh sách cho phép/từ chối công cụ là **công cụ**, không phải Skills. Nếu một Skill cần chạy binary, hãy đảm bảo `exec` được cho phép và binary tồn tại trong sandbox.
    - Để kiểm soát chặt chẽ hơn, đặt `agents.list[].groupChat.mentionPatterns` và giữ danh sách cho phép nhóm được bật cho kênh.

  </Tab>
</Tabs>

## Cấu hình sandbox và công cụ cho từng tác nhân

Mỗi tác nhân có thể có sandbox và hạn chế công cụ riêng:

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
`setupCommand` nằm dưới `sandbox.docker` và chạy một lần khi tạo container. Các ghi đè `sandbox.docker.*` cho từng tác nhân bị bỏ qua khi phạm vi đã phân giải là `"shared"`.
</Note>

**Lợi ích:**

- **Cách ly bảo mật**: hạn chế công cụ cho các tác nhân không đáng tin cậy.
- **Kiểm soát tài nguyên**: đặt sandbox cho các tác nhân cụ thể trong khi giữ những tác nhân khác trên máy chủ.
- **Chính sách linh hoạt**: quyền khác nhau cho từng tác nhân.

<Note>
`tools.elevated` là **toàn cục** và dựa trên người gửi; nó không thể cấu hình theo từng tác nhân. Nếu bạn cần ranh giới theo từng tác nhân, hãy dùng `agents.list[].tools` để từ chối `exec`. Để nhắm mục tiêu nhóm, hãy dùng `agents.list[].groupChat.mentionPatterns` để @mention ánh xạ rõ ràng đến tác nhân dự định.
</Note>

Xem [Sandbox và công cụ đa tác nhân](/vi/tools/multi-agent-sandbox-tools) để biết ví dụ chi tiết.

## Liên quan

- [Tác nhân ACP](/vi/tools/acp-agents) — chạy các harness lập trình bên ngoài
- [Định tuyến kênh](/vi/channels/channel-routing) — cách tin nhắn định tuyến đến tác nhân
- [Hiện diện](/vi/concepts/presence) — trạng thái hiện diện và khả dụng của tác nhân
- [Phiên](/vi/concepts/session) — cách ly và định tuyến phiên
- [Tác nhân con](/vi/tools/subagents) — sinh các lượt chạy tác nhân nền
