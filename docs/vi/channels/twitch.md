---
read_when:
    - Thiết lập tích hợp trò chuyện Twitch cho OpenClaw
sidebarTitle: Twitch
summary: 'Bot trò chuyện Twitch: cài đặt, thông tin xác thực, kiểm soát truy cập, làm mới token'
title: Twitch
x-i18n:
    generated_at: "2026-07-19T05:36:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: d827c742ded5fd0b071443dead27b975e2414419b0facb486d7f9c0c9800b060
    source_path: channels/twitch.md
    workflow: 16
---

Hỗ trợ trò chuyện Twitch qua giao diện trò chuyện (IRC) của Twitch bằng ứng dụng khách Twurple. OpenClaw đăng nhập bằng tài khoản bot Twitch, tham gia một kênh cho mỗi tài khoản được cấu hình và trả lời trong kênh đó.

## Cài đặt

Twitch được phân phối dưới dạng plugin chính thức; plugin này không thuộc bản cài đặt lõi.

<Tabs>
  <Tab title="npm registry">
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

`plugins install` đăng ký và bật plugin. Việc chọn Twitch trong `openclaw onboard` hoặc `openclaw channels add` sẽ cài đặt plugin khi cần. Dùng tên gói trần để theo bản phát hành hiện tại; chỉ ghim một phiên bản chính xác khi cần các bản cài đặt có thể tái tạo. Yêu cầu OpenClaw 2026.4.10 trở lên.

Chi tiết: [Plugin](/vi/tools/plugin)

## Thiết lập nhanh

<Steps>
  <Step title="Cài đặt plugin">
    Xem phần [Cài đặt](#install) ở trên.
  </Step>
  <Step title="Tạo tài khoản bot Twitch">
    Tạo một tài khoản Twitch riêng cho bot (hoặc dùng tài khoản hiện có).
  </Step>
  <Step title="Tạo thông tin xác thực">
    Dùng [Twitch Token Generator](https://twitchtokengenerator.com/):

    - Chọn **Bot Token**
    - Xác minh rằng các phạm vi `chat:read` và `chat:write` đã được chọn
    - Sao chép **Client ID** và **Access Token**

  </Step>
  <Step title="Tìm ID người dùng Twitch của bạn">
    Dùng [https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/) để chuyển đổi tên người dùng thành ID người dùng Twitch.
  </Step>
  <Step title="Cấu hình token">
    - Biến môi trường: `OPENCLAW_TWITCH_ACCESS_TOKEN=...` (chỉ tài khoản mặc định)
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
      accessToken: "oauth:abc123...", // Token truy cập OAuth (hoặc dùng biến môi trường OPENCLAW_TWITCH_ACCESS_TOKEN)
      clientId: "xyz789...", // ID ứng dụng khách từ Token Generator
      channel: "yourchannel", // Kênh trò chuyện Twitch cần tham gia (bắt buộc)
      allowFrom: ["123456789"], // (khuyến nghị) Chỉ ID người dùng Twitch của bạn
    },
  },
}
```

## Đây là gì

- Một kênh Twitch do Gateway sở hữu.
- Định tuyến xác định: phản hồi luôn được gửi lại kênh Twitch nơi tin nhắn bắt nguồn.
- Mỗi kênh đã tham gia ánh xạ tới một khóa phiên nhóm biệt lập `agent:<agentId>:twitch:group:<channel>`.
- `username` là tài khoản của bot (tài khoản xác thực), còn `channel` là phòng trò chuyện cần tham gia. Mỗi mục tài khoản tham gia đúng một kênh.
- Token hoạt động dù có hay không có tiền tố `oauth:`; OpenClaw chuẩn hóa cả hai dạng (trình hướng dẫn thiết lập yêu cầu dạng `oauth:`).

## Độ bền của dữ liệu đến

OpenClaw đưa từng tin nhắn trò chuyện Twitch được chấp nhận vào hàng đợi bền vững trước khi điều phối thông thường. Các tin nhắn đang chờ hoặc có thể thử lại vẫn tồn tại sau khi Gateway khởi động lại, được xử lý tuần tự cho kênh đã cấu hình và dùng ID tin nhắn của Twitch để ngăn các mục hàng đợi trùng lặp trong khi bản ghi hoàn tất đang hoạt động hoặc được lưu giữ vẫn tồn tại.

Trò chuyện Twitch không phát lại một `PRIVMSG` sau khi ứng dụng khách đã chấp nhận nó. Cơ chế này bảo vệ khoảng thời gian có thể xảy ra sự cố từ lúc chấp nhận cục bộ đến lúc điều phối, nhưng không thể khôi phục các tin nhắn bị bỏ lỡ trước khi được tiếp nhận bền vững. Nếu thao tác thêm vào hàng đợi thất bại, OpenClaw ghi lại lỗi; việc kết nối lại không yêu cầu Twitch gửi lại tin nhắn đó.

## Làm mới token (không bắt buộc)

OpenClaw không thể làm mới các token từ [Twitch Token Generator](https://twitchtokengenerator.com/) — hãy tạo lại khi hết hạn (chúng tồn tại vài giờ; không cần đăng ký ứng dụng).

Để tự động làm mới, hãy tạo ứng dụng riêng tại [Twitch Developer Console](https://dev.twitch.tv/console) và thêm:

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

Khi cả hai đều được đặt, plugin dùng nhà cung cấp xác thực có khả năng làm mới để gia hạn token trước khi hết hạn và ghi nhật ký mỗi lần làm mới. Nếu thiếu `refreshToken`, plugin ghi nhật ký `token refresh disabled (no refresh token)`; nếu thiếu `clientSecret`, plugin quay về dùng token tĩnh (không làm mới).

## Hỗ trợ nhiều tài khoản

Dùng `channels.twitch.accounts` với thông tin xác thực riêng cho từng tài khoản. Xem [Cấu hình](/vi/gateway/configuration) để biết mẫu dùng chung.

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
Mỗi mục tài khoản cần `accessToken` riêng (biến môi trường chỉ áp dụng cho tài khoản mặc định). Một tài khoản tham gia đúng một kênh, vì vậy việc tham gia hai kênh cần hai tài khoản. `channels.twitch.defaultAccount` chọn tài khoản mặc định.
</Note>

## Kiểm soát truy cập

`allowFrom` là danh sách cho phép nghiêm ngặt gồm các ID người dùng Twitch. Khi được đặt, `allowedRoles` bị bỏ qua; không đặt `allowFrom` để thay vào đó dùng quyền truy cập dựa trên vai trò.

**Các vai trò có sẵn:** `"moderator"`, `"owner"`, `"vip"`, `"subscriber"`, `"all"`.

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
**Tại sao dùng ID người dùng?** Tên người dùng có thể thay đổi, tạo điều kiện cho việc mạo danh. ID người dùng là vĩnh viễn.

Tìm ID của bạn bằng [công cụ chuyển đổi tên người dùng sang ID](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/).
</Note>

## Khắc phục sự cố

Trước tiên, chạy các lệnh chẩn đoán:

```bash
openclaw doctor
openclaw channels status --probe
```

<AccordionGroup>
  <Accordion title="Bot không phản hồi tin nhắn">
    - **Kiểm tra kiểm soát truy cập:** Đảm bảo ID người dùng của bạn có trong `allowFrom`, hoặc tạm thời xóa `allowFrom` và đặt `allowedRoles: ["all"]` để kiểm thử.
    - **Kiểm tra cổng đề cập:** Khi dùng `requireMention: true` (mặc định), tin nhắn phải @đề cập tên người dùng của bot.
    - **Kiểm tra bot có trong kênh:** Bot chỉ tham gia kênh được đặt tên trong `channel`.

  </Accordion>
  <Accordion title="Sự cố token">
    Lỗi "Failed to connect" hoặc lỗi xác thực:

    - Xác minh `accessToken` là giá trị token truy cập OAuth (tiền tố `oauth:` không bắt buộc)
    - Kiểm tra token có các phạm vi `chat:read` và `chat:write`
    - Nếu dùng tính năng làm mới token, hãy xác minh `clientSecret` và `refreshToken` đã được đặt

  </Accordion>
  <Accordion title="Tính năng làm mới token không hoạt động">
    Kiểm tra nhật ký để tìm các sự kiện làm mới:

    ```text
    Đang dùng nguồn token từ biến môi trường cho mybot
    Token truy cập đã được làm mới cho người dùng 123456 (hết hạn sau 14400s)
    ```

    Nếu bạn thấy `token refresh disabled (no refresh token)`:

    - Đảm bảo đã cung cấp `clientSecret`
    - Đảm bảo đã cung cấp `refreshToken`

  </Accordion>
</AccordionGroup>

## Cấu hình

### Cấu hình tài khoản

<ParamField path="username" type="string" required>
  Tên người dùng bot (tài khoản xác thực).
</ParamField>
<ParamField path="accessToken" type="string" required>
  Token truy cập OAuth có `chat:read` và `chat:write` (cấu hình hoặc biến môi trường cho tài khoản mặc định).
</ParamField>
<ParamField path="clientId" type="string" required>
  Twitch Client ID (từ Token Generator hoặc ứng dụng của bạn). Không bắt buộc trong lược đồ nhưng cần thiết để kết nối.
</ParamField>
<ParamField path="channel" type="string" required>
  Kênh cần tham gia.
</ParamField>
<ParamField path="enabled" type="boolean" default="true">
  Bật tài khoản này.
</ParamField>
<ParamField path="clientSecret" type="string">
  Không bắt buộc: dùng để tự động làm mới token.
</ParamField>
<ParamField path="refreshToken" type="string">
  Không bắt buộc: dùng để tự động làm mới token.
</ParamField>
<ParamField path="expiresIn" type="number">
  Thời gian hết hạn token tính bằng giây (theo dõi làm mới).
</ParamField>
<ParamField path="obtainmentTimestamp" type="number">
  Dấu thời gian khi nhận được token (theo dõi làm mới).
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

### Tùy chọn nhà cung cấp

- `channels.twitch.enabled` - Bật/tắt khởi động kênh
- `channels.twitch.username` / `accessToken` / `clientId` / `channel` - Cấu hình một tài khoản đơn giản hóa (tài khoản `default` ngầm định; được ưu tiên hơn `accounts.default`)
- `channels.twitch.accounts.<accountName>` - Cấu hình nhiều tài khoản (tất cả các trường tài khoản ở trên)
- `channels.twitch.defaultAccount` - Tên tài khoản nào là mặc định
- `channels.twitch.markdown.tables` - Chế độ kết xuất bảng Markdown (`off` | `bullets` | `code` | `block`)

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

Tác tử có thể gửi tin nhắn Twitch thông qua thao tác `send` của công cụ nhắn tin:

```json5
{
  channel: "twitch",
  action: "send",
  to: "#mychannel",
  message: "Xin chào Twitch!",
}
```

`to` không bắt buộc và mặc định là `channel` được cấu hình của tài khoản.

## An toàn và vận hành

- **Xử lý token như mật khẩu** - tuyệt đối không commit token vào git.
- **Sử dụng cơ chế tự động làm mới token** cho các bot chạy lâu dài.
- **Sử dụng danh sách cho phép theo ID người dùng** thay vì tên người dùng để kiểm soát quyền truy cập.
- **Theo dõi nhật ký** để kiểm tra các sự kiện làm mới token và trạng thái kết nối.
- **Giới hạn phạm vi token ở mức tối thiểu** - chỉ yêu cầu `chat:read` và `chat:write`.
- **Nếu gặp bế tắc**: khởi động lại Gateway sau khi xác nhận không có tiến trình nào khác sở hữu phiên.

## Giới hạn

- **500 ký tự** cho mỗi tin nhắn; các phản hồi dài hơn được chia thành nhiều phần tại ranh giới giữa các từ.
- Markdown bị loại bỏ trước khi gửi (trò chuyện Twitch sử dụng văn bản thuần túy; các ký tự xuống dòng được chuyển thành dấu cách).
- OpenClaw không tự áp dụng giới hạn tốc độ; ứng dụng trò chuyện Twurple xử lý các giới hạn tốc độ của Twitch.

## Liên quan

- [Định tuyến kênh](/vi/channels/channel-routing) — định tuyến phiên cho tin nhắn
- [Tổng quan về các kênh](/vi/channels) — tất cả các kênh được hỗ trợ
- [Nhóm](/vi/channels/groups) — hành vi trò chuyện nhóm và cơ chế kiểm soát bằng lượt đề cập
- [Ghép nối](/vi/channels/pairing) — xác thực tin nhắn trực tiếp và luồng ghép nối
- [Bảo mật](/vi/gateway/security) — mô hình truy cập và tăng cường bảo mật
