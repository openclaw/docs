---
read_when:
    - Điều chỉnh các giá trị mặc định của chế độ đặc quyền, danh sách cho phép hoặc hành vi của lệnh dấu gạch chéo
    - Tìm hiểu cách các tác tử trong sandbox có thể truy cập máy chủ lưu trữ
summary: 'Chế độ thực thi nâng cao: chạy lệnh bên ngoài sandbox từ một tác nhân trong sandbox'
title: Chế độ đặc quyền cao
x-i18n:
    generated_at: "2026-07-12T08:25:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ab035f2f0d0074da4e7661d9d690d89aa5eea25b7920ce48a2a03dffccded85b
    source_path: tools/elevated.md
    workflow: 16
---

Khi một tác nhân chạy bên trong sandbox, các lệnh `exec` của tác nhân bị giới hạn trong môi trường sandbox. **Chế độ nâng quyền** cho phép tác nhân thoát ra và chạy lệnh bên ngoài sandbox, với các cổng phê duyệt có thể cấu hình.

<Info>
  Chế độ nâng quyền chỉ thay đổi hành vi khi tác nhân **đang chạy trong sandbox**. Đối với tác nhân không chạy trong sandbox, exec vốn đã chạy trên máy chủ.
</Info>

## Chỉ thị

Kiểm soát chế độ nâng quyền cho từng phiên bằng các lệnh gạch chéo:

| Chỉ thị          | Tác dụng                                                                                                                                                |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/elevated on`   | Chạy bên ngoài sandbox trên đường dẫn máy chủ đã cấu hình, vẫn giữ yêu cầu phê duyệt                                                                     |
| `/elevated ask`  | Giống `on` (bí danh)                                                                                                                                    |
| `/elevated full` | Chạy bên ngoài sandbox trên đường dẫn máy chủ đã cấu hình và bỏ qua phê duyệt khi chính sách phê duyệt của chế độ/máy chủ đã cho phép đầy đủ             |
| `/elevated off`  | Quay lại thực thi bị giới hạn trong sandbox                                                                                                              |

Cũng có thể dùng dưới dạng `/elev on|off|ask|full`.

Gửi `/elevated` không có đối số để xem cấp độ hiện tại.

## Cách hoạt động

<Steps>
  <Step title="Kiểm tra tính khả dụng">
    Chế độ nâng quyền phải được bật trong cấu hình và người gửi phải có trong danh sách cho phép:

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

  <Step title="Đặt cấp độ">
    Gửi một tin nhắn chỉ chứa chỉ thị để đặt giá trị mặc định cho phiên:

    ```
    /elevated full
    ```

    Hoặc dùng trực tiếp trong tin nhắn (chỉ áp dụng cho tin nhắn đó):

    ```
    /elevated on run the deployment script
    ```

  </Step>

  <Step title="Các lệnh chạy bên ngoài sandbox">
    Khi chế độ nâng quyền đang hoạt động, các lệnh gọi `exec` sẽ thoát khỏi sandbox. Máy chủ thực thi có hiệu lực mặc định là
    `gateway`, hoặc là `node` khi đích exec đã cấu hình/đích exec của phiên là
    `node`. Trong chế độ `full`, phê duyệt exec được bỏ qua khi chính sách phê duyệt
    chế độ/máy chủ sau khi phân giải đã cho phép hoàn toàn (security `full`,
    ask `off`); nếu không, chính sách phê duyệt thông thường vẫn áp dụng. Trong
    chế độ `on`/`ask`, các quy tắc phê duyệt đã cấu hình luôn áp dụng.
  </Step>
</Steps>

## Thứ tự phân giải

1. **Chỉ thị trực tiếp** trong tin nhắn (chỉ áp dụng cho tin nhắn đó)
2. **Ghi đè của phiên** (được đặt bằng cách gửi một tin nhắn chỉ chứa chỉ thị)
3. **Giá trị mặc định toàn cục** (`agents.defaults.elevatedDefault` trong cấu hình)

## Tính khả dụng và danh sách cho phép

- **Cổng toàn cục**: `tools.elevated.enabled` (phải là `true`)
- **Danh sách người gửi được phép**: `tools.elevated.allowFrom` với danh sách riêng cho từng kênh
- **Cổng cho từng tác nhân**: `agents.list[].tools.elevated.enabled` (chỉ có thể hạn chế thêm; cả cổng toàn cục và cổng cho từng tác nhân đều phải là `true`)
- **Danh sách cho phép theo tác nhân**: `agents.list[].tools.elevated.allowFrom` (người gửi phải khớp cả danh sách toàn cục và danh sách theo tác nhân)
- **Danh sách cho phép dự phòng do kênh cung cấp**: các Plugin kênh có thể tùy chọn cung cấp danh sách cho phép dự phòng thông qua hook bộ điều hợp SDK, được dùng khi `tools.elevated.allowFrom.<provider>` chưa được cấu hình. Hiện không có kênh đi kèm nào triển khai hook này, nên trên thực tế hiện nay mỗi nhà cung cấp đều cần một mục `tools.elevated.allowFrom.<provider>` rõ ràng.
- **Tất cả các cổng đều phải được thông qua**; nếu không, chế độ nâng quyền được xem là không khả dụng

Định dạng mục trong danh sách cho phép:

| Tiền tố                  | Khớp với                                  |
| ------------------------ | ----------------------------------------- |
| (không có)               | ID người gửi, E.164 hoặc trường From      |
| `name:`                  | Tên hiển thị của người gửi                |
| `username:`              | Tên người dùng của người gửi              |
| `tag:`                   | Thẻ của người gửi                         |
| `id:`, `from:`, `e164:`  | Nhắm mục tiêu danh tính một cách rõ ràng  |

## Những gì chế độ nâng quyền không kiểm soát

- **Chính sách công cụ**: nếu `exec` bị chính sách công cụ từ chối, chế độ nâng quyền không thể ghi đè.
- **Chính sách chọn máy chủ**: chế độ nâng quyền không biến `auto` thành quyền ghi đè liên máy chủ tự do. Chế độ này sử dụng các quy tắc đích exec đã cấu hình/của phiên và chỉ chọn `node` khi đích vốn đã là `node`.
- **Tách biệt với `/exec`**: chỉ thị `/exec` điều chỉnh các giá trị exec mặc định theo phiên (máy chủ, bảo mật, yêu cầu phê duyệt, Node) cho người gửi được ủy quyền và không yêu cầu chế độ nâng quyền.

<Note>
  Lệnh trò chuyện bash (tiền tố `!`; bí danh `/bash`) là một cổng riêng, yêu cầu bật `tools.elevated` ngoài cờ `tools.bash.enabled` của chính nó. Việc tắt chế độ nâng quyền cũng khóa các lệnh shell `!`.
</Note>

## Liên quan

<CardGroup cols={2}>
  <Card title="Công cụ exec" href="/vi/tools/exec" icon="terminal">
    Thực thi lệnh shell từ tác nhân.
  </Card>
  <Card title="Phê duyệt exec" href="/vi/tools/exec-approvals" icon="shield">
    Hệ thống phê duyệt và danh sách cho phép dành cho `exec`.
  </Card>
  <Card title="Cơ chế sandbox" href="/vi/gateway/sandboxing" icon="box">
    Cấu hình sandbox ở cấp Gateway.
  </Card>
  <Card title="Sandbox so với chính sách công cụ so với chế độ nâng quyền" href="/vi/gateway/sandbox-vs-tool-policy-vs-elevated" icon="scale-balanced">
    Cách ba cổng phối hợp trong một lệnh gọi công cụ.
  </Card>
</CardGroup>
