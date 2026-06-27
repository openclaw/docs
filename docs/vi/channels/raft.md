---
read_when:
    - Bạn muốn kết nối OpenClaw với một không gian làm việc Raft
    - Bạn đang cấu hình Raft External Agent
    - Bạn đang gỡ lỗi quá trình gửi tín hiệu đánh thức của Raft
sidebarTitle: Raft
summary: Hỗ trợ Raft External Agent thông qua cầu nối đánh thức Raft CLI
title: Raft
x-i18n:
    generated_at: "2026-06-27T17:12:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ef9ebfd27e69575d9a1534b3b31f05036f081c54a2379411d2c7fb6f8165d558
    source_path: channels/raft.md
    workflow: 16
---

Hỗ trợ Raft kết nối một tác nhân OpenClaw với Raft External Agent thông qua
Raft CLI cục bộ. Raft gửi các gợi ý đánh thức đã xác thực đến Gateway. Sau đó
tác nhân dùng Raft CLI để kiểm tra và gửi tin nhắn.

## Cài đặt

Raft là một Plugin bên ngoài chính thức. Cài đặt trên máy chủ Gateway:

```bash
openclaw plugins install @openclaw/raft
openclaw gateway restart
```

Chi tiết: [Plugin](/vi/tools/plugin)

## Điều kiện tiên quyết

- Một không gian làm việc Raft có External Agent.
- Raft CLI được cài đặt trên cùng máy chủ với OpenClaw Gateway.
- Một hồ sơ Raft CLI đã đăng nhập và được liên kết với External Agent đó.

Plugin không lưu trữ thông tin xác thực Raft. Raft CLI giữ xác thực đó
trong hồ sơ riêng của nó.

## Cấu hình

Đặt hồ sơ trong cấu hình:

```json5
{
  channels: {
    raft: {
      enabled: true,
      profile: "openclaw",
    },
  },
}
```

Với tài khoản mặc định, bạn cũng có thể đặt `RAFT_PROFILE` trong môi trường
Gateway:

```bash
RAFT_PROFILE=openclaw
```

Dùng tài khoản có tên khi một Gateway kết nối với nhiều Raft External Agent:

```json5
{
  channels: {
    raft: {
      accounts: {
        support: {
          profile: "support-agent",
        },
        engineering: {
          profile: "engineering-agent",
        },
      },
    },
  },
}
```

Luồng thiết lập tương tác ghi lại cùng hồ sơ:

```bash
openclaw channels setup raft
```

## Cách hoạt động

Khi Gateway khởi động, Plugin:

1. Mở một điểm cuối HTTP đánh thức chỉ cho loopback trên một cổng tạm thời.
2. Khởi động `raft --profile <profile> agent bridge` với điểm cuối đó và một
   token riêng cho từng tiến trình.
3. Chỉ chấp nhận các gợi ý đánh thức đã xác thực, không có nội dung, có định danh chống phát lại từ cầu nối cục bộ.
4. Yêu cầu một trong các giá trị `eventId`, `attemptId`, `messageId`, `delivery_id`, `wake_id`, hoặc `id`.
5. Khử trùng lặp các lượt phân phối đánh thức được thử lại gần đây theo id sự kiện cầu nối, bao gồm cả sau khi Gateway khởi động lại.
6. Trả về một phiên thời gian chạy ổn định cho cầu nối hiện tại và một lô rút hoạt động trống cho giao thức Raft CLI.
7. Khởi động một lượt tác nhân OpenClaw được tuần tự hóa cho mỗi lần đánh thức được chấp nhận.

Cầu nối sở hữu việc thử lại và kết nối lại phân phối của Raft. Lượt OpenClaw chỉ nhận
một thông báo đánh thức, không phải nội dung tin nhắn Raft được sao chép. Nó dùng CLI để đọc
các tin nhắn đang chờ và gửi phản hồi:

```bash
raft --profile openclaw message check
raft --profile openclaw message send
```

<Note>
Raft không phải là một phương tiện truyền tải tin nhắn đẩy thông thường. OpenClaw không tự động
gửi văn bản cuối cùng của mô hình trở lại qua cầu nối, vì vậy tác nhân phải dùng
Raft CLI sau khi xử lý một lần đánh thức.
</Note>

## Xác minh

Kiểm tra rằng OpenClaw có thể tìm thấy CLI và có hồ sơ đã cấu hình:

```bash
openclaw channels status --probe
openclaw plugins inspect raft --runtime --json
```

Sau đó gửi một tin nhắn đến Raft External Agent. Nhật ký Gateway sẽ hiển thị
cầu nối Raft khởi động, tiếp theo là một lần đánh thức đến. Tác nhân nên dùng
hồ sơ Raft đã cấu hình để kiểm tra các tin nhắn đang chờ.

## Khắc phục sự cố

<AccordionGroup>
  <Accordion title="Raft CLI is missing">
    Cài đặt Raft CLI trên máy chủ Gateway và làm cho `raft` khả dụng trên
    `PATH` của dịch vụ. Xác minh bằng `raft --help`, rồi khởi động lại Gateway.
  </Accordion>
  <Accordion title="The bridge exits immediately">
    Xác minh hồ sơ đã cấu hình đã đăng nhập và thuộc về Raft External Agent dự kiến.
    Chạy trực tiếp `raft --profile <profile> agent bridge`
    để xem chẩn đoán của CLI.
  </Accordion>
  <Accordion title="A wake arrives but no Raft response is sent">
    Điều này là dự kiến khi tác nhân không gọi Raft CLI. Cầu nối đánh thức
    không mang nội dung tin nhắn hoặc phản hồi cuối tự động. Kiểm tra chính sách công cụ
    của tác nhân và đảm bảo nó có thể chạy `raft --profile <profile> message
    check` và `message send`.
  </Accordion>
</AccordionGroup>

## Tham khảo

- [Raft](https://raft.build/)
- [Tài liệu Raft](https://docs.raft.build/welcome/)
- [Tích hợp Hermes Raft](https://hermes-agent.nousresearch.com/docs/user-guide/messaging/raft)
