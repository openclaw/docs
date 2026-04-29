---
read_when:
    - Điều chỉnh giá trị mặc định của chế độ nâng quyền, danh sách cho phép hoặc hành vi của lệnh slash
    - Tìm hiểu cách các tác tử trong môi trường cách ly có thể truy cập máy chủ
summary: 'Chế độ thực thi nâng quyền: chạy các lệnh bên ngoài môi trường cách ly từ một tác nhân đang ở trong môi trường cách ly'
title: Chế độ nâng quyền
x-i18n:
    generated_at: "2026-04-29T23:17:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5b91b4af36f9485695f2afebe9bf8d7274d7aad6d0d88e762e581b0d091e04f7
    source_path: tools/elevated.md
    workflow: 16
---

Khi một agent chạy bên trong sandbox, các lệnh `exec` của nó bị giới hạn trong
môi trường sandbox. **Chế độ nâng quyền** cho phép agent thoát ra và chạy lệnh
bên ngoài sandbox, với các cổng phê duyệt có thể cấu hình.

<Info>
  Chế độ nâng quyền chỉ thay đổi hành vi khi agent được **sandbox**. Với các
  agent không dùng sandbox, exec vốn đã chạy trên máy chủ.
</Info>

## Chỉ thị

Điều khiển chế độ nâng quyền theo từng phiên bằng các lệnh slash:

| Chỉ thị          | Tác dụng                                                               |
| ---------------- | ---------------------------------------------------------------------- |
| `/elevated on`   | Chạy bên ngoài sandbox trên đường dẫn máy chủ đã cấu hình, giữ phê duyệt |
| `/elevated ask`  | Giống `on` (bí danh)                                                   |
| `/elevated full` | Chạy bên ngoài sandbox trên đường dẫn máy chủ đã cấu hình và bỏ qua phê duyệt |
| `/elevated off`  | Quay lại thực thi bị giới hạn trong sandbox                            |

Cũng có thể dùng dưới dạng `/elev on|off|ask|full`.

Gửi `/elevated` không có đối số để xem mức hiện tại.

## Cách hoạt động

<Steps>
  <Step title="Check availability">
    Chế độ nâng quyền phải được bật trong cấu hình và người gửi phải nằm trong danh sách cho phép:

    ```json5
    {
      tools: {
        elevated: {
          enabled: true,
          allowFrom: {
            discord: ["user-id-123"],
            whatsapp: ["+15555550123"],
          },
        },
      },
    }
    ```

  </Step>

  <Step title="Set the level">
    Gửi một tin nhắn chỉ chứa chỉ thị để đặt mặc định của phiên:

    ```
    /elevated full
    ```

    Hoặc dùng nội tuyến (chỉ áp dụng cho tin nhắn đó):

    ```
    /elevated on run the deployment script
    ```

  </Step>

  <Step title="Commands run outside the sandbox">
    Khi nâng quyền đang hoạt động, các lời gọi `exec` sẽ rời khỏi sandbox. Máy chủ hiệu lực mặc định là
    `gateway`, hoặc `node` khi mục tiêu exec đã cấu hình/theo phiên là
    `node`. Ở chế độ `full`, phê duyệt exec được bỏ qua. Ở chế độ `on`/`ask`,
    các quy tắc phê duyệt đã cấu hình vẫn được áp dụng.
  </Step>
</Steps>

## Thứ tự phân giải

1. **Chỉ thị nội tuyến** trong tin nhắn (chỉ áp dụng cho tin nhắn đó)
2. **Ghi đè phiên** (được đặt bằng cách gửi tin nhắn chỉ chứa chỉ thị)
3. **Mặc định toàn cục** (`agents.defaults.elevatedDefault` trong cấu hình)

## Tính khả dụng và danh sách cho phép

- **Cổng toàn cục**: `tools.elevated.enabled` (phải là `true`)
- **Danh sách cho phép người gửi**: `tools.elevated.allowFrom` với danh sách theo từng kênh
- **Cổng theo agent**: `agents.list[].tools.elevated.enabled` (chỉ có thể hạn chế thêm)
- **Danh sách cho phép theo agent**: `agents.list[].tools.elevated.allowFrom` (người gửi phải khớp cả toàn cục + theo agent)
- **Dự phòng Discord**: nếu bỏ qua `tools.elevated.allowFrom.discord`, `channels.discord.allowFrom` sẽ được dùng làm dự phòng
- **Tất cả các cổng phải đạt**; nếu không, chế độ nâng quyền được xem là không khả dụng

Định dạng mục nhập danh sách cho phép:

| Tiền tố                 | Khớp với                        |
| ----------------------- | ------------------------------- |
| (không có)              | ID người gửi, E.164, hoặc trường From |
| `name:`                 | Tên hiển thị của người gửi      |
| `username:`             | Tên người dùng của người gửi    |
| `tag:`                  | Thẻ của người gửi               |
| `id:`, `from:`, `e164:` | Nhắm mục tiêu danh tính rõ ràng |

## Những gì chế độ nâng quyền không kiểm soát

- **Chính sách công cụ**: nếu `exec` bị chính sách công cụ từ chối, chế độ nâng quyền không thể ghi đè
- **Chính sách chọn máy chủ**: chế độ nâng quyền không biến `auto` thành quyền ghi đè tự do giữa các máy chủ. Nó dùng các quy tắc mục tiêu exec đã cấu hình/theo phiên, chỉ chọn `node` khi mục tiêu vốn đã là `node`.
- **Tách biệt với `/exec`**: chỉ thị `/exec` điều chỉnh mặc định exec theo phiên cho người gửi được ủy quyền và không yêu cầu chế độ nâng quyền

## Liên quan

- [Công cụ Exec](/vi/tools/exec) — thực thi lệnh shell
- [Phê duyệt Exec](/vi/tools/exec-approvals) — hệ thống phê duyệt và danh sách cho phép
- [Sandboxing](/vi/gateway/sandboxing) — cấu hình sandbox
- [Sandbox so với Chính sách công cụ so với Nâng quyền](/vi/gateway/sandbox-vs-tool-policy-vs-elevated)
