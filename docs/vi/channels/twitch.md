---
read_when:
    - Thiết lập tích hợp trò chuyện Twitch cho OpenClaw
sidebarTitle: Twitch
summary: 'Bot trò chuyện Twitch: cài đặt, thông tin xác thực, kiểm soát truy cập, làm mới token'
title: Twitch
x-i18n:
    generated_at: "2026-07-12T07:46:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 70890c0c6a648a06ad47c35016571a57c3e518296ef95311e75e32c81e60e2db
    source_path: channels/twitch.md
    workflow: 16
---

Hỗ trợ trò chuyện Twitch thông qua giao diện trò chuyện (IRC) của Twitch bằng ứng dụng khách Twurple. OpenClaw đăng nhập bằng tài khoản bot Twitch, tham gia một kênh cho mỗi tài khoản đã cấu hình và trả lời trong kênh đó.

## Cài đặt

Twitch được phân phối dưới dạng Plugin chính thức; thành phần này không nằm trong bản cài đặt lõi.

<Tabs>
  <Tab title="Kho đăng ký npm">
    ```bash
    openclaw plugins install @openclaw/twitch
    ```
  </Tab>
  <Tab title="Bản mã nguồn cục bộ">
    ```bash
    openclaw plugins install ./path/to/local/twitch-plugin
    ```
  </Tab>
</Tabs>

`plugins install` đăng ký và bật Plugin. Việc chọn Twitch trong `openclaw onboard` hoặc `openclaw channels add` sẽ cài đặt Plugin khi cần. Sử dụng tên gói trần để theo dõi bản phát hành hiện tại; chỉ ghim phiên bản chính xác khi cần cài đặt có thể tái lập. Yêu cầu OpenClaw 2026.4.10 trở lên.

Chi tiết: [Plugin](/vi/tools/plugin)

## Thiết lập nhanh

<Steps>
  <Step title="Cài đặt Plugin">
    Xem phần [Cài đặt](#install) ở trên.
  </Step>
  <Step title="Tạo tài khoản bot Twitch">
    Tạo một tài khoản Twitch riêng cho bot (hoặc sử dụng tài khoản hiện có).
  </Step>
  <Step title="Tạo thông tin xác thực">
    Sử dụng [Trình tạo token Twitch](https://twitchtokengenerator.com/):

    - Chọn **Bot Token**
    - Xác minh rằng các phạm vi `chat:read` và `chat:write` đã được chọn
    - Sao chép **Client ID** và **Access Token**

  </Step>
  <Step title="Tìm ID người dùng Twitch của bạn">
    Sử dụng [https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/) để chuyển đổi tên người dùng thành ID người dùng Twitch.
  </Step>
  <Step title="Cấu hình token">
    - Biến môi trường: `OPENCLAW_TWITCH_ACCESS_TOKEN=...` (chỉ dành cho tài khoản mặc định)
    - Hoặc cấu hình: `channels.twitch.accessToken`

    Nếu cả hai đều được đặt, cấu hình được ưu tiên (biến môi trường chỉ là phương án dự phòng cho tài khoản mặc định).

  </Step>
  <Step title="Khởi động Gateway">
    ```bash
    openclaw gateway run
    ```
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
      username: "openclaw", // Tài khoản Twitch của bot (dùng để xác thực)
      accessToken: "oauth:abc123...", // Token truy cập OAuth (hoặc sử dụng biến môi trường OPENCLAW_TWITCH_ACCESS_TOKEN)
      clientId: "xyz789...", // Client ID từ Trình tạo token
      channel: "yourchannel", // Kênh trò chuyện Twitch cần tham gia (bắt buộc)
      allowFrom: ["123456789"], // (khuyến nghị) Chỉ ID người dùng Twitch của bạn
    },
  },
}
```

## Đây là gì

- Một kênh Twitch do Gateway sở hữu.
- Định tuyến xác định: câu trả lời luôn được gửi trở lại kênh Twitch nơi tin nhắn bắt nguồn.
- Mỗi kênh đã tham gia ánh xạ tới một khóa phiên nhóm biệt lập `agent:<agentId>:twitch:group:<channel>`.
- `username` là tài khoản của bot (tài khoản xác thực), còn `channel` là phòng trò chuyện cần tham gia. Mỗi mục tài khoản tham gia đúng một kênh.
- Token hoạt động dù có hoặc không có tiền tố `oauth:`; OpenClaw chuẩn hóa cả hai dạng (trình hướng dẫn thiết lập yêu cầu dạng `oauth:`).

## Làm mới token (tùy chọn)

OpenClaw không thể làm mới token từ [Trình tạo token Twitch](https://twitchtokengenerator.com/) — hãy tạo lại khi token hết hạn (token có hiệu lực trong vài giờ; không cần đăng ký ứng dụng).

Để tự động làm mới, hãy tạo ứng dụng riêng tại [Bảng điều khiển dành cho nhà phát triển Twitch](https://dev.twitch.tv/console) và thêm:

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

Khi cả hai đều được đặt, Plugin sử dụng trình cung cấp xác thực có khả năng làm mới để gia hạn token trước khi hết hạn và ghi nhật ký mỗi lần làm mới. Nếu không có `refreshToken`, Plugin ghi nhật ký `token refresh disabled (no refresh token)`; nếu không có `clientSecret`, Plugin chuyển sang sử dụng token tĩnh (không làm mới).

## Hỗ trợ nhiều tài khoản

Sử dụng `channels.twitch.accounts` với thông tin xác thực riêng cho từng tài khoản. Xem [Cấu hình](/vi/gateway/configuration) để biết mẫu dùng chung.

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
          channel: "yourchannel",
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
Mỗi mục tài khoản cần có `accessToken` riêng (biến môi trường chỉ áp dụng cho tài khoản mặc định). Một tài khoản tham gia đúng một kênh, vì vậy việc tham gia hai kênh cần hai tài khoản. `channels.twitch.defaultAccount` chọn tài khoản mặc định.
</Note>

## Kiểm soát truy cập

`allowFrom` là danh sách cho phép cứng gồm các ID người dùng Twitch. Khi được đặt, `allowedRoles` bị bỏ qua; không đặt `allowFrom` nếu muốn sử dụng quyền truy cập dựa trên vai trò.

**Các vai trò khả dụng:** `"moderator"`, `"owner"`, `"vip"`, `"subscriber"`, `"all"`.

<Tabs>
  <Tab title="Danh sách cho phép theo ID người dùng (an toàn nhất)">
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
  <Tab title="Dựa trên vai trò">
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
  </Tab>
  <Tab title="Tắt yêu cầu @đề cập">
    Theo mặc định, `requireMention` là `true`. Để phản hồi tất cả tin nhắn được phép:

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

<Note>
**Tại sao dùng ID người dùng?** Tên người dùng có thể thay đổi, cho phép mạo danh. ID người dùng là vĩnh viễn.

Tìm ID của bạn bằng [trình chuyển đổi tên người dùng sang ID](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/).
</Note>

## Khắc phục sự cố

Trước tiên, chạy các lệnh chẩn đoán:

```bash
openclaw doctor
openclaw channels status --probe
```

<AccordionGroup>
  <Accordion title="Bot không phản hồi tin nhắn">
    - **Kiểm tra kiểm soát truy cập:** Đảm bảo ID người dùng của bạn nằm trong `allowFrom`, hoặc tạm thời xóa `allowFrom` và đặt `allowedRoles: ["all"]` để kiểm tra.
    - **Kiểm tra cổng đề cập:** Khi `requireMention: true` (mặc định), tin nhắn phải @đề cập tên người dùng của bot.
    - **Kiểm tra bot có ở trong kênh hay không:** Bot chỉ tham gia kênh được đặt tên trong `channel`.

  </Accordion>
  <Accordion title="Sự cố token">
    Lỗi "Không thể kết nối" hoặc lỗi xác thực:

    - Xác minh `accessToken` là giá trị token truy cập OAuth (tiền tố `oauth:` là tùy chọn)
    - Kiểm tra token có các phạm vi `chat:read` và `chat:write`
    - Nếu sử dụng tính năng làm mới token, hãy xác minh `clientSecret` và `refreshToken` đã được đặt

  </Accordion>
  <Accordion title="Tính năng làm mới token không hoạt động">
    Kiểm tra nhật ký để tìm các sự kiện làm mới:

    ```text
    Using env token source for mybot
    Access token refreshed for user 123456 (expires in 14400s)
    ```

    Nếu bạn thấy `token refresh disabled (no refresh token)`:

    - Đảm bảo đã cung cấp `clientSecret`
    - Đảm bảo đã cung cấp `refreshToken`

  </Accordion>
</AccordionGroup>

## Cấu hình

### Cấu hình tài khoản

<ParamField path="username" type="string" required>
  Tên người dùng của bot (tài khoản dùng để xác thực).
</ParamField>
<ParamField path="accessToken" type="string" required>
  Token truy cập OAuth có `chat:read` và `chat:write` (cấu hình hoặc biến môi trường cho tài khoản mặc định).
</ParamField>
<ParamField path="clientId" type="string" required>
  Client ID Twitch (từ Trình tạo token hoặc ứng dụng của bạn). Tùy chọn trong lược đồ nhưng bắt buộc để kết nối.
</ParamField>
<ParamField path="channel" type="string" required>
  Kênh cần tham gia.
</ParamField>
<ParamField path="enabled" type="boolean" default="true">
  Bật tài khoản này.
</ParamField>
<ParamField path="clientSecret" type="string">
  Tùy chọn: dùng để tự động làm mới token.
</ParamField>
<ParamField path="refreshToken" type="string">
  Tùy chọn: dùng để tự động làm mới token.
</ParamField>
<ParamField path="expiresIn" type="number">
  Thời gian hết hạn của token tính bằng giây (theo dõi việc làm mới).
</ParamField>
<ParamField path="obtainmentTimestamp" type="number">
  Dấu thời gian khi nhận được token (theo dõi việc làm mới).
</ParamField>
<ParamField path="allowFrom" type="string[]">
  Danh sách cho phép theo ID người dùng. Khi được đặt, các vai trò bị bỏ qua.
</ParamField>
<ParamField path="allowedRoles" type='Array<"moderator" | "owner" | "vip" | "subscriber" | "all">'>
  Kiểm soát truy cập dựa trên vai trò.
</ParamField>
<ParamField path="requireMention" type="boolean" default="true">
  Yêu cầu @đề cập để kích hoạt bot.
</ParamField>
<ParamField path="responsePrefix" type="string">
  Ghi đè tiền tố phản hồi gửi đi cho tài khoản này.
</ParamField>

### Tùy chọn trình cung cấp

- `channels.twitch.enabled` - Bật/tắt việc khởi động kênh
- `channels.twitch.username` / `accessToken` / `clientId` / `channel` - Cấu hình một tài khoản đơn giản hóa (tài khoản `default` ngầm định; được ưu tiên hơn `accounts.default`)
- `channels.twitch.accounts.<accountName>` - Cấu hình nhiều tài khoản (tất cả các trường tài khoản ở trên)
- `channels.twitch.defaultAccount` - Tên tài khoản nào là mặc định
- `channels.twitch.markdown.tables` - Chế độ hiển thị bảng Markdown (`off` | `bullets` | `code` | `block`)

Ví dụ đầy đủ:

```json5
{
  channels: {
    twitch: {
      enabled: true,
      username: "openclaw",
      accessToken: "oauth:abc123...",
      clientId: "xyz789...",
      channel: "yourchannel",
      clientSecret: "secret123...",
      refreshToken: "refresh456...",
      allowFrom: ["123456789"],
      accounts: {
        second: {
          username: "mybot",
          accessToken: "oauth:def456...",
          clientId: "uvw012...",
          channel: "your_channel",
          enabled: true,
          expiresIn: 14400,
          obtainmentTimestamp: 1706092800000,
          allowedRoles: ["moderator"],
        },
      },
    },
  },
}
```

## Thao tác công cụ

Tác tử có thể gửi tin nhắn Twitch thông qua thao tác `send` của công cụ tin nhắn:

```json5
{
  channel: "twitch",
  action: "send",
  to: "#mychannel",
  message: "Hello Twitch!",
}
```

`to` là tùy chọn và mặc định sử dụng `channel` đã cấu hình của tài khoản.

## An toàn và vận hành

- **Coi token như mật khẩu** — không bao giờ cam kết token vào git.
- **Sử dụng tính năng tự động làm mới token** cho các bot chạy lâu dài.
- **Sử dụng danh sách cho phép theo ID người dùng** thay vì tên người dùng để kiểm soát truy cập.
- **Theo dõi nhật ký** để kiểm tra các sự kiện làm mới token và trạng thái kết nối.
- **Giới hạn phạm vi token ở mức tối thiểu** — chỉ yêu cầu `chat:read` và `chat:write`.
- **Nếu gặp bế tắc**: khởi động lại Gateway sau khi xác nhận không có tiến trình nào khác sở hữu phiên.

## Giới hạn

- **500 ký tự** cho mỗi tin nhắn; các câu trả lời dài hơn được chia nhỏ tại ranh giới từ.
- Markdown được loại bỏ trước khi gửi (trò chuyện Twitch là văn bản thuần túy; các dòng mới được chuyển thành dấu cách).
- OpenClaw không tự thêm giới hạn tốc độ; ứng dụng khách trò chuyện Twurple xử lý các giới hạn tốc độ của Twitch.

## Liên quan

- [Định tuyến kênh](/vi/channels/channel-routing) — định tuyến phiên cho tin nhắn
- [Tổng quan về kênh](/vi/channels) — tất cả các kênh được hỗ trợ
- [Nhóm](/vi/channels/groups) — hành vi trò chuyện nhóm và cổng đề cập
- [Ghép nối](/vi/channels/pairing) — quy trình xác thực tin nhắn trực tiếp và ghép nối
- [Bảo mật](/vi/gateway/security) — mô hình truy cập và tăng cường bảo mật
