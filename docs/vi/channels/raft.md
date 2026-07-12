---
read_when:
    - Bạn muốn kết nối OpenClaw với một không gian làm việc Raft
    - Bạn đang cấu hình một tác nhân bên ngoài Raft
    - Bạn đang gỡ lỗi việc chuyển tín hiệu đánh thức Raft
sidebarTitle: Raft
summary: Hỗ trợ Raft External Agent thông qua cầu nối đánh thức của Raft CLI
title: Raft
x-i18n:
    generated_at: "2026-07-12T07:43:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 454d92d764a4ec3b0ec52467cba254dcad795870e04d1d32d4cf65d8b451a0de
    source_path: channels/raft.md
    workflow: 16
---

Raft kết nối một agent OpenClaw với Raft External Agent thông qua Raft CLI cục bộ. Raft gửi các tín hiệu đánh thức đã xác thực đến Gateway; sau đó agent sử dụng Raft CLI để kiểm tra và gửi tin nhắn. Chỉ hỗ trợ trò chuyện trực tiếp (không hỗ trợ nhóm).

## Cài đặt

Raft là một plugin bên ngoài chính thức. Cài đặt plugin này trên máy chủ Gateway:

```bash
openclaw plugins install @openclaw/raft
openclaw gateway restart
```

Chi tiết: [Plugin](/vi/tools/plugin)

## Điều kiện tiên quyết

- Một không gian làm việc Raft có External Agent.
- Raft CLI được cài đặt trên cùng máy chủ với Gateway OpenClaw và có trong `PATH` của dịch vụ.
- Một hồ sơ Raft CLI đã đăng nhập và được liên kết với External Agent đó.

Plugin không lưu thông tin xác thực Raft; Raft CLI lưu thông tin xác thực này trong hồ sơ riêng của nó.

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

Đối với tài khoản mặc định, bạn có thể đặt `RAFT_PROFILE` trong môi trường Gateway:

```bash
RAFT_PROFILE=openclaw
```

Sử dụng tài khoản có tên khi một Gateway kết nối với nhiều Raft External Agent:

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

Quá trình thiết lập tương tác ghi lại cùng hồ sơ đó:

```bash
openclaw channels add --channel raft
```

## Cách hoạt động

Khi Gateway khởi động, plugin sẽ:

1. Mở một điểm cuối HTTP đánh thức chỉ dành cho local loopback trên một cổng tạm thời.
2. Khởi động `raft --profile <profile> agent bridge` với điểm cuối đó và một token riêng cho từng tiến trình.
3. Chỉ chấp nhận các tín hiệu đánh thức đã xác thực, không chứa nội dung và có danh tính chống phát lại từ cầu nối cục bộ.
4. Yêu cầu mỗi tải trọng đánh thức phải có một trong các trường `eventId`, `attemptId`, `messageId`, `delivery_id`, `wake_id` hoặc `id`.
5. Loại bỏ các lần phân phối đánh thức trùng lặp do thử lại theo mã định danh sự kiện của cầu nối trong 24 giờ, kể cả sau khi Gateway khởi động lại.
6. Trả về một phiên thời gian chạy ổn định cho cầu nối hiện tại và một lô rút hoạt động trống cho giao thức Raft CLI.
7. Khởi động một lượt agent OpenClaw được tuần tự hóa cho mỗi tín hiệu đánh thức được chấp nhận.

Cầu nối chịu trách nhiệm thử lại việc phân phối Raft và kết nối lại. Lượt OpenClaw chỉ nhận được thông báo đánh thức, không nhận bản sao nội dung tin nhắn Raft. Lượt này sử dụng CLI để đọc các tin nhắn đang chờ và gửi phản hồi:

```bash
raft --profile openclaw message check
raft --profile openclaw message send
```

<Note>
Raft không phải là phương thức truyền tải tin nhắn đẩy. OpenClaw không tự động gửi văn bản cuối cùng của mô hình trở lại qua cầu nối, vì vậy agent phải sử dụng Raft CLI sau khi xử lý tín hiệu đánh thức.
</Note>

## Xác minh

Kiểm tra xem OpenClaw có thể tìm thấy CLI và đã được cấu hình hồ sơ hay chưa:

```bash
openclaw channels status --probe
openclaw plugins inspect raft --runtime --json
```

Sau đó gửi tin nhắn đến Raft External Agent. Nhật ký Gateway sẽ hiển thị cầu nối Raft khởi động, tiếp theo là một tín hiệu đánh thức đến. Agent phải sử dụng hồ sơ Raft đã cấu hình để kiểm tra các tin nhắn đang chờ.

## Khắc phục sự cố

<AccordionGroup>
  <Accordion title="Thiếu Raft CLI">
    Cài đặt Raft CLI trên máy chủ Gateway và đảm bảo `raft` có trong `PATH` của dịch vụ. Xác minh bằng `raft --help`, sau đó khởi động lại Gateway.
  </Accordion>
  <Accordion title="Cầu nối thoát ngay lập tức">
    Xác minh rằng hồ sơ đã cấu hình đang đăng nhập và thuộc về Raft External Agent mong muốn. Chạy trực tiếp `raft --profile <profile> agent bridge` để xem thông tin chẩn đoán của CLI.
  </Accordion>
  <Accordion title="Có tín hiệu đánh thức đến nhưng không gửi phản hồi Raft">
    Đây là hành vi dự kiến khi agent không gọi Raft CLI. Cầu nối đánh thức không truyền nội dung tin nhắn hoặc phản hồi cuối cùng tự động. Kiểm tra chính sách công cụ của agent và đảm bảo agent có thể chạy `raft --profile <profile>
    message check` và `message send`.
  </Accordion>
</AccordionGroup>

## Tài liệu tham khảo

- [Raft](https://raft.build/)
- [Tài liệu Raft](https://docs.raft.build/welcome/)
- [Tích hợp Raft với Hermes](https://hermes-agent.nousresearch.com/docs/user-guide/messaging/raft)
