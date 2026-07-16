---
read_when: You want multiple agents with separate workspaces, auth, and sessions in one Gateway process.
sidebarTitle: Multi-agent routing
status: active
summary: 'Định tuyến đa tác tử: ranh giới tác tử, tài khoản kênh và liên kết'
title: Định tuyến đa tác nhân
x-i18n:
    generated_at: "2026-07-16T14:21:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 265a1f3d9d9b4957c99c71f391ce4f5abba6b70561570f8bbe8cb9964ece1cfc
    source_path: concepts/multi-agent.md
    workflow: 16
---

Chạy nhiều tác nhân _cô lập_ trong một tiến trình Gateway, mỗi tác nhân có không gian làm việc, thư mục trạng thái (`agentDir`) và lịch sử phiên dựa trên SQLite riêng, cùng với nhiều tài khoản kênh (ví dụ: hai số WhatsApp). Tin nhắn đến được định tuyến đến đúng tác nhân thông qua **liên kết**.

Một **tác nhân** là toàn bộ phạm vi của từng persona: các tệp trong không gian làm việc, hồ sơ xác thực, sổ đăng ký mô hình và kho phiên. Một **liên kết** ánh xạ một tài khoản kênh (một không gian làm việc Slack, một số WhatsApp, v.v.) tới một trong các tác nhân đó.

## Một tác nhân là gì

Mỗi tác nhân có riêng:

- **Không gian làm việc**: các tệp, `AGENTS.md`/`SOUL.md`/`USER.md`, ghi chú cục bộ, quy tắc persona.
- **Thư mục trạng thái** (`agentDir`): hồ sơ xác thực, sổ đăng ký mô hình, cấu hình theo tác nhân.
- **Kho phiên**: lịch sử trò chuyện và trạng thái định tuyến trong `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`.

Hồ sơ xác thực được lưu riêng theo tác nhân và được đọc từ:

```text
~/.openclaw/agents/<agentId>/agent/auth-profiles.json
```

<Note>
`sessions_history` là đường dẫn truy hồi giữa các phiên an toàn hơn: nó trả về một chế độ xem có giới hạn và đã biên tập, thay vì kết xuất bản ghi thô. Nó loại bỏ chữ ký khối suy luận, chi tiết tải trọng kết quả công cụ, cấu trúc `<relevant-memories>`, các thẻ XML gọi công cụ (`<tool_call>`, `<function_call>` và các dạng số nhiều/hạ cấp của chúng), cùng XML gọi công cụ MiniMax, sau đó cắt ngắn và giới hạn đầu ra theo kích thước byte.
</Note>

<Warning>
Không bao giờ dùng lại `agentDir` giữa các tác nhân — điều này gây xung đột trạng thái xác thực/phiên. Khi thông tin xác thực OAuth cục bộ của một tác nhân phụ hết hạn hoặc việc làm mới thất bại, OpenClaw đọc xuyên sang thông tin xác thực của tác nhân mặc định/chính cho cùng một mã hồ sơ và sử dụng token mới nhất, nhưng không sao chép refresh token vào kho của tác nhân phụ. Nếu muốn có một tài khoản OAuth hoàn toàn độc lập, hãy đăng nhập từ tác nhân đó. Nếu sao chép thông tin xác thực theo cách thủ công, chỉ sao chép các hồ sơ `api_key` hoặc `token` tĩnh có thể di chuyển — dữ liệu làm mới OAuth mặc định không thể di chuyển (`copyToAgents` có thể cho phép rõ ràng một hồ sơ tham gia).
</Warning>

Skills được tải từ không gian làm việc của từng tác nhân cùng các gốc dùng chung như `~/.openclaw/skills`, sau đó được lọc theo danh sách cho phép Skills có hiệu lực của tác nhân. Dùng `agents.defaults.skills` làm đường cơ sở dùng chung và `agents.list[].skills` làm phần thay thế theo tác nhân (các mục được chỉ định rõ sẽ thay thế mặc định, không hợp nhất). Xem [Skills: theo tác nhân so với dùng chung](/vi/tools/skills#per-agent-vs-shared-skills) và [Skills: danh sách cho phép của tác nhân](/vi/tools/skills#agent-allowlists).

Bộ nhớ do Plugin sở hữu tuân theo cấu hình của Plugin đó; việc thêm tác nhân thứ hai
không tự động chia tách mọi kho Plugin toàn cục. Ví dụ, hãy cấu hình
[kho Memory Wiki theo tác nhân](/vi/concepts/multi-agent#per-agent-memory-wiki-vaults)
khi các persona không được dùng chung kiến thức wiki đã biên soạn.

<Note>
**Lưu ý về không gian làm việc:** không gian làm việc của mỗi tác nhân là **cwd mặc định**, không phải sandbox nghiêm ngặt. Đường dẫn tương đối được phân giải trong không gian làm việc, nhưng đường dẫn tuyệt đối có thể truy cập các vị trí khác trên máy chủ trừ khi bật sandbox. Xem [Sandbox](/vi/gateway/sandboxing).
</Note>

## Đường dẫn

| Nội dung                         | Mặc định                                                                               | Ghi đè                                                                                  |
| -------------------------------- | -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Cấu hình                         | `~/.openclaw/openclaw.json`                                                            | `OPENCLAW_CONFIG_PATH`                                                                   |
| Thư mục trạng thái               | `~/.openclaw`                                                                          | `OPENCLAW_STATE_DIR`                                                                     |
| Không gian làm việc của tác nhân mặc định | `~/.openclaw/workspace` (hoặc `workspace-<profile>` khi đặt `OPENCLAW_PROFILE`)      | `agents.list[].workspace`, sau đó `agents.defaults.workspace`, hoặc `OPENCLAW_WORKSPACE_DIR` |
| Không gian làm việc của các tác nhân khác | `<stateDir>/workspace-<agentId>` (hoặc `<agents.defaults.workspace>/<agentId>` khi được đặt) | `agents.list[].workspace`                                                                |
| Thư mục tác nhân                 | `~/.openclaw/agents/<agentId>/agent`                                                   | `agents.list[].agentDir`                                                                 |
| Phiên và bản ghi                 | `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`                             | —                                                                                        |
| Hiện vật phiên cũ/lưu trữ        | `~/.openclaw/agents/<agentId>/sessions`                                                | —                                                                                        |

### Chế độ một tác nhân (mặc định)

Nếu không cấu hình gì, OpenClaw chạy một tác nhân:

- `agentId` mặc định là `main`.
- Khóa phiên là `agent:main:<mainKey>` (`mainKey` mặc định là `main`).
- Không gian làm việc mặc định là `~/.openclaw/workspace` (hoặc `workspace-<profile>` khi `OPENCLAW_PROFILE` được đặt thành giá trị khác `default`).
- Trạng thái mặc định là `~/.openclaw/agents/main/agent`.

## Trình trợ giúp tác nhân

Thêm một tác nhân cô lập mới:

```bash
openclaw agents add work
```

Cờ: `--workspace <dir>`, `--model <id>`, `--agent-dir <dir>`, `--bind <channel[:accountId]>` (có thể lặp lại), `--non-interactive` (yêu cầu `--workspace`).

Thêm `bindings` để định tuyến tin nhắn đến (trình hướng dẫn sẽ đề nghị thực hiện việc này), sau đó xác minh:

```bash
openclaw agents list --bindings
```

## Bắt đầu nhanh

<Steps>
  <Step title="Tạo không gian làm việc cho từng tác nhân">
    ```bash
    openclaw agents add coding
    openclaw agents add social
    ```

    Mỗi tác nhân có không gian làm việc riêng với `SOUL.md`, `AGENTS.md` và `USER.md` tùy chọn, cùng một `agentDir` chuyên biệt và kho phiên trong `~/.openclaw/agents/<agentId>`.

  </Step>
  <Step title="Tạo tài khoản kênh">
    Tạo một tài khoản cho mỗi tác nhân trên các kênh bạn muốn:

    - Discord: một bot cho mỗi tác nhân, bật Message Content Intent, sao chép từng token.
    - Telegram: một bot cho mỗi tác nhân thông qua BotFather, sao chép từng token.
    - WhatsApp: liên kết từng số điện thoại cho mỗi tài khoản.

    ```bash
    openclaw channels login --channel whatsapp --account work
    ```

    Xem hướng dẫn về kênh: [Discord](/vi/channels/discord), [Telegram](/vi/channels/telegram), [WhatsApp](/vi/channels/whatsapp).

  </Step>
  <Step title="Thêm tác nhân, tài khoản và liên kết">
    Thêm tác nhân trong `agents.list`, tài khoản kênh trong `channels.<channel>.accounts` và kết nối chúng bằng `bindings` (các ví dụ bên dưới).
  </Step>
  <Step title="Khởi động lại và xác minh">
    ```bash
    openclaw gateway restart
    openclaw agents list --bindings
    openclaw channels status --probe
    ```
  </Step>
</Steps>

## Nhiều tác nhân, nhiều persona

Mỗi `agentId` được cấu hình là một ranh giới persona riêng biệt cho trạng thái cốt lõi của tác nhân:

- Các tài khoản khác nhau cho mỗi kênh (theo `accountId`).
- Các tính cách khác nhau (`AGENTS.md`/`SOUL.md` theo tác nhân).
- Xác thực và phiên riêng biệt; quyền truy cập giữa các tác nhân chỉ được bật thông qua các tính năng hoặc cấu hình Plugin rõ ràng.

Điều này cho phép nhiều người dùng chung một Gateway trong khi vẫn tách biệt trạng thái cốt lõi của tác nhân.

## Kho Memory Wiki theo tác nhân

Theo mặc định, Memory Wiki dùng một kho toàn cục. Để giữ kiến thức đã biên soạn
của tác nhân hỗ trợ tách biệt với kiến thức của tác nhân tiếp thị, hãy đặt
`plugins.entries.memory-wiki.config.vault.scope` thành `agent`:

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

Đường dẫn được cấu hình là thư mục cha. OpenClaw nối thêm mã tác nhân đã chuẩn hóa,
tạo ra các đường dẫn như `~/.openclaw/wiki/support` và
`~/.openclaw/wiki/marketing`. Các thao tác CLI và Gateway theo phạm vi tác nhân yêu cầu
chỉ định rõ tác nhân khi cấu hình nhiều tác nhân. Xem
[kho Memory Wiki theo tác nhân](/vi/plugins/memory-wiki#per-agent-vaults) để biết chi tiết về
lọc cầu nối, di chuyển và ranh giới tin cậy.

## Tìm kiếm bộ nhớ QMD giữa các tác nhân

Để cho phép một tác nhân tìm kiếm bản ghi phiên QMD của tác nhân khác, hãy thêm các bộ sưu tập bổ sung trong `agents.list[].memorySearch.qmd.extraCollections`. Dùng `agents.defaults.memorySearch.qmd.extraCollections` khi mọi tác nhân cần dùng chung các bộ sưu tập giống nhau.

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
            extraCollections: [{ path: "notes" }], // được phân giải trong không gian làm việc -> bộ sưu tập có tên "notes-main"
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

Đường dẫn của bộ sưu tập bổ sung có thể được dùng chung giữa các tác nhân, nhưng `name` của nó vẫn phải được chỉ định rõ khi đường dẫn nằm ngoài không gian làm việc của tác nhân. Các đường dẫn bên trong không gian làm việc vẫn thuộc phạm vi tác nhân, để mỗi tác nhân giữ bộ tìm kiếm bản ghi riêng.

## Một số WhatsApp, nhiều người (tách DM)

Định tuyến các DM WhatsApp khác nhau đến các tác nhân khác nhau trên **một** tài khoản WhatsApp bằng cách khớp E.164 của người gửi (`+15551234567`) với `peer.kind: "direct"`. Phản hồi vẫn được gửi từ cùng một số WhatsApp — không có danh tính người gửi riêng theo tác nhân.

<Note>
Theo mặc định, các cuộc trò chuyện trực tiếp được hợp nhất vào khóa phiên chính của tác nhân, vì vậy để cô lập thực sự, mỗi người cần một tác nhân riêng.
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

Kiểm soát truy cập DM (ghép nối/danh sách cho phép) là toàn cục theo tài khoản WhatsApp, không phải theo tác nhân. Đối với các nhóm dùng chung, hãy liên kết nhóm với một tác nhân hoặc dùng [Nhóm phát sóng](/vi/channels/broadcast-groups).

## Quy tắc định tuyến

Các liên kết có tính xác định và liên kết cụ thể nhất sẽ thắng. Xem [Định tuyến kênh](/vi/channels/channel-routing#routing-rules-how-an-agent-is-chosen) để biết thứ tự tầng đầy đủ (đối tượng ngang hàng chính xác, đối tượng ngang hàng cha, ký tự đại diện đối tượng ngang hàng, guild+vai trò, guild, nhóm, tài khoản, kênh, tác nhân mặc định). Một số quy tắc đáng lưu ý tại đây:

- Nếu nhiều liên kết khớp trong cùng một tầng, liên kết xuất hiện đầu tiên theo thứ tự cấu hình sẽ thắng.
- Nếu một liên kết đặt nhiều trường khớp (ví dụ: `peer` + `guildId`), tất cả các trường được chỉ định phải khớp (ngữ nghĩa `AND`).
- Một liên kết bỏ qua `accountId` chỉ khớp tài khoản mặc định, không phải mọi tài khoản. Dùng `accountId: "*"` làm phương án dự phòng trên toàn kênh hoặc `accountId: "<name>"` cho một tài khoản. Việc thêm lại cùng một liên kết với mã tài khoản rõ ràng sẽ nâng cấp liên kết chỉ theo kênh hiện có thay vì tạo bản sao.

## Nhiều tài khoản/số điện thoại

Các kênh hỗ trợ nhiều tài khoản (ví dụ: WhatsApp) dùng `accountId` để xác định từng lần đăng nhập. Mỗi `accountId` định tuyến đến tác nhân riêng, vì vậy một máy chủ có thể lưu trữ nhiều số điện thoại mà không trộn lẫn các phiên.

Đặt `channels.<channel>.defaultAccount` để chọn tài khoản được sử dụng khi `accountId` bị bỏ qua. Khi chưa đặt, OpenClaw sẽ dùng `default` nếu có; nếu không, sẽ dùng id tài khoản đầu tiên đã cấu hình (sau khi sắp xếp).

Các kênh hỗ trợ nhiều tài khoản: `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `mattermost`, `matrix`, `nextcloud-talk`, `nostr`, `signal`, `slack`, `telegram`, `whatsapp`, `zalo`, `zalouser`.

## Khái niệm

- `agentId`: một "bộ não" (không gian làm việc, xác thực riêng cho từng tác tử, kho phiên riêng cho từng tác tử).
- `accountId`: một phiên bản tài khoản kênh (ví dụ: tài khoản WhatsApp `personal` so với `biz`).
- `binding`: định tuyến tin nhắn đến tới một `agentId` theo `(channel, accountId, peer)` và, nếu cần, theo id bang hội/nhóm.
- Các cuộc trò chuyện trực tiếp được quy về `agent:<agentId>:<mainKey>` ("main" của từng tác tử; xem `session.mainKey`).

## Ví dụ theo nền tảng

<AccordionGroup>
  <Accordion title="Bot Discord cho từng tác tử">
    Mỗi tài khoản bot Discord ánh xạ tới một `accountId` duy nhất. Liên kết từng tài khoản với một tác tử và duy trì danh sách cho phép riêng cho từng bot.

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

    - Mời từng bot vào bang hội và bật Message Content Intent.
    - Các token nằm trong `channels.discord.accounts.<id>.token` (tài khoản mặc định có thể sử dụng `DISCORD_BOT_TOKEN`).

  </Accordion>
  <Accordion title="Bot Telegram cho từng tác tử">
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

    - Tạo một bot cho mỗi tác tử bằng BotFather và sao chép từng token.
    - Các token nằm trong `channels.telegram.accounts.<id>.botToken` (tài khoản mặc định có thể sử dụng `TELEGRAM_BOT_TOKEN`).
    - Đối với nhiều bot trong cùng một nhóm Telegram, hãy mời từng bot và nhắc đến bot cần trả lời.
    - Tắt Privacy Mode của BotFather cho từng bot nhóm (`/setprivacy` -> Disable), sau đó xóa và thêm lại bot để Telegram áp dụng cài đặt.
    - Cho phép các nhóm bằng `channels.telegram.groups`, hoặc chỉ sử dụng `groupPolicy: "open"` cho các hoạt động triển khai nhóm đáng tin cậy.
    - Đặt ID người dùng của người gửi vào `groupAllowFrom`. ID nhóm và siêu nhóm phải nằm trong `channels.telegram.groups`, không phải `groupAllowFrom`.
    - Liên kết theo `accountId` để mỗi bot định tuyến tới tác tử riêng.

  </Accordion>
  <Accordion title="Số WhatsApp cho từng tác tử">
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

      // Định tuyến xác định: kết quả khớp đầu tiên được dùng (cụ thể nhất trước).
      bindings: [
        { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
        { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },

        // Ghi đè tùy chọn theo từng bên ngang hàng (ví dụ: gửi một nhóm cụ thể tới tác tử công việc).
        {
          agentId: "work",
          match: {
            channel: "whatsapp",
            accountId: "personal",
            peer: { kind: "group", id: "1203630...@g.us" },
          },
        },
      ],

      // Mặc định tắt: phải bật rõ ràng và đưa vào danh sách cho phép để nhắn tin giữa các tác tử.
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
              // Ghi đè tùy chọn. Mặc định: ~/.openclaw/credentials/whatsapp/personal
              // authDir: "~/.openclaw/credentials/whatsapp/personal",
            },
            biz: {
              // Ghi đè tùy chọn. Mặc định: ~/.openclaw/credentials/whatsapp/biz
              // authDir: "~/.openclaw/credentials/whatsapp/biz",
            },
          },
        },
      },
    }
    ```

  </Accordion>
</AccordionGroup>

## Các mẫu phổ biến

<Tabs>
  <Tab title="WhatsApp hằng ngày + làm việc chuyên sâu trên Telegram">
    Chia theo kênh: định tuyến WhatsApp tới một tác tử nhanh dùng hằng ngày và Telegram tới một tác tử Opus.

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

    Các ví dụ này sử dụng `accountId: "*"` để các liên kết tiếp tục hoạt động nếu bạn thêm tài khoản sau này. Để định tuyến một DM/nhóm riêng lẻ tới Opus trong khi vẫn giữ phần còn lại trên chat, hãy thêm một liên kết `match.peer` cho bên ngang hàng đó — kết quả khớp bên ngang hàng luôn được ưu tiên hơn các quy tắc áp dụng cho toàn kênh.

  </Tab>
  <Tab title="Cùng một kênh, định tuyến một bên ngang hàng tới Opus">
    Giữ WhatsApp trên tác tử nhanh nhưng định tuyến một DM tới Opus:

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

    Các liên kết bên ngang hàng luôn được ưu tiên, vì vậy hãy đặt chúng phía trên quy tắc áp dụng cho toàn kênh.

  </Tab>
  <Tab title="Tác tử gia đình liên kết với một nhóm WhatsApp">
    Liên kết một tác tử chuyên biệt cho gia đình với một nhóm WhatsApp duy nhất, kèm điều kiện nhắc tên và chính sách công cụ chặt chẽ hơn:

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

    Danh sách cho phép/từ chối công cụ là **công cụ**, không phải kỹ năng. Nếu một kỹ năng cần chạy tệp nhị phân, hãy bảo đảm `exec` được cho phép và tệp nhị phân tồn tại trong sandbox. Để kiểm soát chặt chẽ hơn, hãy đặt `agents.list[].groupChat.mentionPatterns` và duy trì danh sách cho phép nhóm cho kênh.

  </Tab>
</Tabs>

## Cấu hình sandbox và công cụ theo từng tác tử

Mỗi tác tử có thể có các hạn chế riêng về sandbox và công cụ:

```js
{
  agents: {
    list: [
      {
        id: "personal",
        workspace: "~/.openclaw/workspace-personal",
        sandbox: {
          mode: "off",  // Không dùng sandbox cho tác tử cá nhân
        },
        // Không hạn chế công cụ - tất cả công cụ đều khả dụng
      },
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        sandbox: {
          mode: "all",     // Luôn chạy trong sandbox
          scope: "agent",  // Một container cho mỗi tác tử
          docker: {
            // Thiết lập một lần tùy chọn sau khi tạo container
            setupCommand: "apt-get update && apt-get install -y git curl",
          },
        },
        tools: {
          allow: ["read"],                    // Chỉ công cụ đọc
          deny: ["exec", "write", "edit", "apply_patch"],    // Từ chối các công cụ khác
        },
      },
    ],
  },
}
```

<Note>
`setupCommand` nằm trong `sandbox.docker` và chạy một lần khi tạo container. Các giá trị ghi đè `sandbox.docker.*` theo từng tác tử sẽ bị bỏ qua khi phạm vi đã phân giải là `"shared"`.
</Note>

Cấu hình này mang lại:

- **Cách ly bảo mật**: hạn chế công cụ cho các tác tử không đáng tin cậy.
- **Kiểm soát tài nguyên**: chạy các tác tử cụ thể trong sandbox trong khi giữ các tác tử khác trên máy chủ.
- **Chính sách linh hoạt**: quyền khác nhau cho từng tác tử.

<Note>
`tools.elevated` có cả cổng kiểm soát toàn cục (`tools.elevated.enabled`/`allowFrom`) và cổng kiểm soát theo từng tác tử (`agents.list[].tools.elevated.enabled`/`allowFrom`). Cổng kiểm soát theo từng tác tử chỉ có thể hạn chế thêm so với cổng toàn cục — cả hai đều phải cho phép một người gửi thì các lệnh nâng cao mới chạy được. Để nhắm mục tiêu trong nhóm, hãy sử dụng `agents.list[].groupChat.mentionPatterns` để các lượt @nhắc tên ánh xạ chính xác tới tác tử dự kiến.
</Note>

Xem [Sandbox và công cụ cho nhiều tác tử](/vi/tools/multi-agent-sandbox-tools) để biết các ví dụ chi tiết.

## Liên quan

- [Tác tử ACP](/vi/tools/acp-agents) — chạy các bộ điều phối lập trình bên ngoài
- [Định tuyến kênh](/vi/channels/channel-routing) — cách thông điệp được định tuyến đến các tác tử
- [Trạng thái hiện diện](/vi/concepts/presence) — trạng thái hiện diện và khả năng sẵn sàng của tác tử
- [Phiên](/vi/concepts/session) — cô lập và định tuyến phiên
- [Tác tử con](/vi/tools/subagents) — khởi tạo các lượt chạy tác tử trong nền
