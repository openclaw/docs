---
read_when:
    - Thiết lập tích hợp trò chuyện Twitch cho OpenClaw
sidebarTitle: Twitch
summary: Cấu hình và thiết lập bot trò chuyện Twitch
title: Twitch
x-i18n:
    generated_at: "2026-04-29T22:28:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 897079687a243c9c2ce2be63167e59f4413bbd89735fb79f03928547023bd787
    source_path: channels/twitch.md
    workflow: 16
---

Hỗ trợ chat Twitch qua kết nối IRC. OpenClaw kết nối dưới dạng người dùng Twitch (tài khoản bot) để nhận và gửi tin nhắn trong các kênh.

## Plugin đi kèm

<Note>
Twitch được phát hành dưới dạng Plugin đi kèm trong các bản phát hành OpenClaw hiện tại, nên các bản dựng đóng gói thông thường không cần cài đặt riêng.
</Note>

Nếu bạn đang dùng bản dựng cũ hơn hoặc bản cài đặt tùy chỉnh loại trừ Twitch, hãy cài đặt gói npm hiện tại khi gói đó được phát hành:

<Tabs>
  <Tab title="npm registry">
    ```bash
    openclaw plugins install @openclaw/twitch
    ```
  </Tab>
  <Tab title="Local checkout">
    ```bash
    openclaw plugins install ./path/to/local/twitch-plugin
    ```
  </Tab>
</Tabs>

Nếu npm báo gói do OpenClaw sở hữu là đã lỗi thời, hãy dùng bản dựng OpenClaw được đóng gói hiện tại hoặc đường dẫn checkout cục bộ cho đến khi gói npm mới hơn được phát hành.

Chi tiết: [Plugins](/vi/tools/plugin)

## Thiết lập nhanh (người mới bắt đầu)

<Steps>
  <Step title="Ensure plugin is available">
    Các bản phát hành OpenClaw đóng gói hiện tại đã đi kèm Plugin này. Các bản cài đặt cũ hơn/tùy chỉnh có thể thêm thủ công bằng các lệnh ở trên.
  </Step>
  <Step title="Create a Twitch bot account">
    Tạo một tài khoản Twitch riêng cho bot (hoặc dùng một tài khoản hiện có).
  </Step>
  <Step title="Generate credentials">
    Dùng [Twitch Token Generator](https://twitchtokengenerator.com/):

    - Chọn **Token bot**
    - Xác minh các phạm vi `chat:read` và `chat:write` đã được chọn
    - Sao chép **ID ứng dụng khách** và **Token truy cập**

  </Step>
  <Step title="Find your Twitch user ID">
    Dùng [https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/) để chuyển đổi tên người dùng thành ID người dùng Twitch.
  </Step>
  <Step title="Configure the token">
    - Biến môi trường: `OPENCLAW_TWITCH_ACCESS_TOKEN=...` (chỉ tài khoản mặc định)
    - Hoặc cấu hình: `channels.twitch.accessToken`

    Nếu cả hai đều được đặt, cấu hình được ưu tiên (phương án dự phòng bằng biến môi trường chỉ áp dụng cho tài khoản mặc định).

  </Step>
  <Step title="Start the gateway">
    Khởi động Gateway với kênh đã cấu hình.
  </Step>
</Steps>

<Warning>
Thêm kiểm soát truy cập (`allowFrom` hoặc `allowedRoles`) để ngăn người dùng trái phép kích hoạt bot. `requireMention` mặc định là `true`.
</Warning>

Cấu hình tối thiểu:

```json5
{
  channels: {
    twitch: {
      enabled: true,
      username: "openclaw", // Bot's Twitch account
      accessToken: "oauth:abc123...", // OAuth Access Token (or use OPENCLAW_TWITCH_ACCESS_TOKEN env var)
      clientId: "xyz789...", // Client ID from Token Generator
      channel: "vevisk", // Which Twitch channel's chat to join (required)
      allowFrom: ["123456789"], // (recommended) Your Twitch user ID only - get it from https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/
    },
  },
}
```

## Đây là gì

- Một kênh Twitch do Gateway sở hữu.
- Định tuyến xác định: phản hồi luôn quay lại Twitch.
- Mỗi tài khoản ánh xạ tới một khóa phiên tách biệt `agent:<agentId>:twitch:<accountName>`.
- `username` là tài khoản của bot (dùng để xác thực), `channel` là phòng chat cần tham gia.

## Thiết lập (chi tiết)

### Tạo thông tin xác thực

Dùng [Twitch Token Generator](https://twitchtokengenerator.com/):

- Chọn **Token bot**
- Xác minh các phạm vi `chat:read` và `chat:write` đã được chọn
- Sao chép **ID ứng dụng khách** và **Token truy cập**

<Note>
Không cần đăng ký ứng dụng thủ công. Token hết hạn sau vài giờ.
</Note>

### Cấu hình bot

<Tabs>
  <Tab title="Env var (default account only)">
    ```bash
    OPENCLAW_TWITCH_ACCESS_TOKEN=oauth:abc123...
    ```
  </Tab>
  <Tab title="Config">
    ```json5
    {
      channels: {
        twitch: {
          enabled: true,
          username: "openclaw",
          accessToken: "oauth:abc123...",
          clientId: "xyz789...",
          channel: "vevisk",
        },
      },
    }
    ```
  </Tab>
</Tabs>

Nếu cả biến môi trường và cấu hình đều được đặt, cấu hình được ưu tiên.

### Kiểm soát truy cập (khuyến nghị)

```json5
{
  channels: {
    twitch: {
      allowFrom: ["123456789"], // (recommended) Your Twitch user ID only
    },
  },
}
```

Ưu tiên `allowFrom` để tạo danh sách cho phép cứng. Dùng `allowedRoles` thay thế nếu bạn muốn truy cập dựa trên vai trò.

**Vai trò có sẵn:** `"moderator"`, `"owner"`, `"vip"`, `"subscriber"`, `"all"`.

<Note>
**Vì sao dùng ID người dùng?** Tên người dùng có thể thay đổi, cho phép mạo danh. ID người dùng là vĩnh viễn.

Tìm ID người dùng Twitch của bạn: [https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/) (Chuyển đổi tên người dùng Twitch của bạn thành ID)
</Note>

## Làm mới token (tùy chọn)

Token từ [Twitch Token Generator](https://twitchtokengenerator.com/) không thể được tự động làm mới - hãy tạo lại khi hết hạn.

Để tự động làm mới token, hãy tạo ứng dụng Twitch của riêng bạn tại [Twitch Developer Console](https://dev.twitch.tv/console) và thêm vào cấu hình:

```json5
{
  channels: {
    twitch: {
      clientSecret: "your_client_secret",
      refreshToken: "your_refresh_token",
    },
  },
}
```

Bot tự động làm mới token trước khi hết hạn và ghi nhật ký các sự kiện làm mới.

## Hỗ trợ nhiều tài khoản

Dùng `channels.twitch.accounts` với token riêng cho từng tài khoản. Xem [Cấu hình](/vi/gateway/configuration) để biết mẫu dùng chung.

Ví dụ (một tài khoản bot trong hai kênh):

```json5
{
  channels: {
    twitch: {
      accounts: {
        channel1: {
          username: "openclaw",
          accessToken: "oauth:abc123...",
          clientId: "xyz789...",
          channel: "vevisk",
        },
        channel2: {
          username: "openclaw",
          accessToken: "oauth:def456...",
          clientId: "uvw012...",
          channel: "secondchannel",
        },
      },
    },
  },
}
```

<Note>
Mỗi tài khoản cần token riêng (một token cho mỗi kênh).
</Note>

## Kiểm soát truy cập

<Tabs>
  <Tab title="User ID allowlist (most secure)">
    ```json5
    {
      channels: {
        twitch: {
          accounts: {
            default: {
              allowFrom: ["123456789", "987654321"],
            },
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="Role-based">
    ```json5
    {
      channels: {
        twitch: {
          accounts: {
            default: {
              allowedRoles: ["moderator", "vip"],
            },
          },
        },
      },
    }
    ```

    `allowFrom` là danh sách cho phép cứng. Khi được đặt, chỉ các ID người dùng đó được phép. Nếu bạn muốn truy cập dựa trên vai trò, hãy để trống `allowFrom` và cấu hình `allowedRoles` thay thế.

  </Tab>
  <Tab title="Disable @mention requirement">
    Theo mặc định, `requireMention` là `true`. Để tắt và phản hồi tất cả tin nhắn:

    ```json5
    {
      channels: {
        twitch: {
          accounts: {
            default: {
              requireMention: false,
            },
          },
        },
      },
    }
    ```

  </Tab>
</Tabs>

## Khắc phục sự cố

Trước tiên, chạy các lệnh chẩn đoán:

```bash
openclaw doctor
openclaw channels status --probe
```

<AccordionGroup>
  <Accordion title="Bot does not respond to messages">
    - **Kiểm tra kiểm soát truy cập:** Đảm bảo ID người dùng của bạn có trong `allowFrom`, hoặc tạm thời xóa `allowFrom` và đặt `allowedRoles: ["all"]` để kiểm thử.
    - **Kiểm tra bot đang ở trong kênh:** Bot phải tham gia kênh được chỉ định trong `channel`.

  </Accordion>
  <Accordion title="Token issues">
    "Không thể kết nối" hoặc lỗi xác thực:

    - Xác minh `accessToken` là giá trị token truy cập OAuth (thường bắt đầu bằng tiền tố `oauth:`)
    - Kiểm tra token có các phạm vi `chat:read` và `chat:write`
    - Nếu dùng làm mới token, hãy xác minh `clientSecret` và `refreshToken` đã được đặt

  </Accordion>
  <Accordion title="Token refresh not working">
    Kiểm tra nhật ký để tìm sự kiện làm mới:

    ```
    Using env token source for mybot
    Access token refreshed for user 123456 (expires in 14400s)
    ```

    Nếu bạn thấy "đã tắt làm mới token (không có token làm mới)":

    - Đảm bảo `clientSecret` được cung cấp
    - Đảm bảo `refreshToken` được cung cấp

  </Accordion>
</AccordionGroup>

## Cấu hình

### Cấu hình tài khoản

<ParamField path="username" type="string">
  Tên người dùng bot.
</ParamField>
<ParamField path="accessToken" type="string">
  Token truy cập OAuth với `chat:read` và `chat:write`.
</ParamField>
<ParamField path="clientId" type="string">
  ID ứng dụng khách Twitch (từ Token Generator hoặc ứng dụng của bạn).
</ParamField>
<ParamField path="channel" type="string" required>
  Kênh cần tham gia.
</ParamField>
<ParamField path="enabled" type="boolean" default="true">
  Bật tài khoản này.
</ParamField>
<ParamField path="clientSecret" type="string">
  Tùy chọn: dùng cho làm mới token tự động.
</ParamField>
<ParamField path="refreshToken" type="string">
  Tùy chọn: dùng cho làm mới token tự động.
</ParamField>
<ParamField path="expiresIn" type="number">
  Thời gian hết hạn token tính bằng giây.
</ParamField>
<ParamField path="obtainmentTimestamp" type="number">
  Dấu thời gian lấy token.
</ParamField>
<ParamField path="allowFrom" type="string[]">
  Danh sách cho phép theo ID người dùng.
</ParamField>
<ParamField path="allowedRoles" type='Array<"moderator" | "owner" | "vip" | "subscriber" | "all">'>
  Kiểm soát truy cập dựa trên vai trò.
</ParamField>
<ParamField path="requireMention" type="boolean" default="true">
  Yêu cầu @mention.
</ParamField>

### Tùy chọn nhà cung cấp

- `channels.twitch.enabled` - Bật/tắt khởi động kênh
- `channels.twitch.username` - Tên người dùng bot (cấu hình một tài khoản đơn giản hóa)
- `channels.twitch.accessToken` - Token truy cập OAuth (cấu hình một tài khoản đơn giản hóa)
- `channels.twitch.clientId` - ID ứng dụng khách Twitch (cấu hình một tài khoản đơn giản hóa)
- `channels.twitch.channel` - Kênh cần tham gia (cấu hình một tài khoản đơn giản hóa)
- `channels.twitch.accounts.<accountName>` - Cấu hình nhiều tài khoản (tất cả trường tài khoản ở trên)

Ví dụ đầy đủ:

```json5
{
  channels: {
    twitch: {
      enabled: true,
      username: "openclaw",
      accessToken: "oauth:abc123...",
      clientId: "xyz789...",
      channel: "vevisk",
      clientSecret: "secret123...",
      refreshToken: "refresh456...",
      allowFrom: ["123456789"],
      allowedRoles: ["moderator", "vip"],
      accounts: {
        default: {
          username: "mybot",
          accessToken: "oauth:abc123...",
          clientId: "xyz789...",
          channel: "your_channel",
          enabled: true,
          clientSecret: "secret123...",
          refreshToken: "refresh456...",
          expiresIn: 14400,
          obtainmentTimestamp: 1706092800000,
          allowFrom: ["123456789", "987654321"],
          allowedRoles: ["moderator"],
        },
      },
    },
  },
}
```

## Hành động công cụ

Agent có thể gọi `twitch` với hành động:

- `send` - Gửi tin nhắn tới một kênh

Ví dụ:

```json5
{
  action: "twitch",
  params: {
    message: "Hello Twitch!",
    to: "#mychannel",
  },
}
```

## An toàn và vận hành

- **Xem token như mật khẩu** — Không bao giờ commit token vào git.
- **Dùng làm mới token tự động** cho bot chạy lâu dài.
- **Dùng danh sách cho phép theo ID người dùng** thay vì tên người dùng để kiểm soát truy cập.
- **Giám sát nhật ký** để theo dõi sự kiện làm mới token và trạng thái kết nối.
- **Giới hạn phạm vi token ở mức tối thiểu** — Chỉ yêu cầu `chat:read` và `chat:write`.
- **Nếu bị kẹt**: Khởi động lại Gateway sau khi xác nhận không có tiến trình nào khác sở hữu phiên.

## Giới hạn

- **500 ký tự** mỗi tin nhắn (tự động chia đoạn tại ranh giới từ).
- Markdown bị loại bỏ trước khi chia đoạn.
- Không giới hạn tốc độ (dùng giới hạn tốc độ tích hợp của Twitch).

## Liên quan

- [Định tuyến kênh](/vi/channels/channel-routing) — định tuyến phiên cho tin nhắn
- [Tổng quan về kênh](/vi/channels) — tất cả kênh được hỗ trợ
- [Nhóm](/vi/channels/groups) — hành vi chat nhóm và cổng kiểm tra mention
- [Ghép đôi](/vi/channels/pairing) — xác thực DM và luồng ghép đôi
- [Bảo mật](/vi/gateway/security) — mô hình truy cập và gia cố
