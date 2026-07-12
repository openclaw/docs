---
read_when:
    - Cấu hình nhóm phát sóng
    - Gỡ lỗi phản hồi đa tác nhân trong WhatsApp
sidebarTitle: Broadcast groups
status: experimental
summary: Phát một tin nhắn WhatsApp đến nhiều tác nhân
title: Nhóm phát sóng
x-i18n:
    generated_at: "2026-07-12T07:42:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2771c15b31592f11293385498b9c89decf84747a9172caafb994a5dca4bbdc06
    source_path: channels/broadcast-groups.md
    workflow: 16
---

<Note>
**Trạng thái:** Thử nghiệm. Được thêm vào phiên bản 2026.1.9. Chỉ dành cho WhatsApp (kênh web).
</Note>

## Tổng quan

Nhóm phát rộng chạy **nhiều tác tử** trên cùng một tin nhắn đến. Mỗi tác tử xử lý tin nhắn trong phiên cô lập riêng và đăng phản hồi riêng, nhờ đó một số WhatsApp có thể lưu trữ một nhóm tác tử chuyên biệt trong một cuộc trò chuyện nhóm hoặc tin nhắn trực tiếp duy nhất.

Nhóm phát rộng được đánh giá sau danh sách cho phép của kênh và quy tắc kích hoạt nhóm. Trong nhóm WhatsApp, việc phát rộng xảy ra khi OpenClaw thông thường sẽ phản hồi (ví dụ: khi được nhắc đến, tùy thuộc vào cài đặt nhóm của bạn). Chúng chỉ thay đổi **tác tử nào chạy**, không bao giờ thay đổi việc một tin nhắn có đủ điều kiện để được xử lý hay không.

Luồng QA WhatsApp trực tiếp bao gồm `whatsapp-broadcast-group-fanout`, xác minh rằng một tin nhắn nhóm có nhắc đến có thể tạo ra các phản hồi hiển thị riêng biệt từ hai tác tử đã cấu hình.

## Cấu hình

### Thiết lập cơ bản

Thêm phần `broadcast` ở cấp cao nhất (bên cạnh `bindings`). Khóa là mã định danh đối tác WhatsApp, giá trị là mảng mã định danh tác tử:

- cuộc trò chuyện nhóm: JID nhóm (ví dụ: `120363403215116621@g.us`)
- tin nhắn trực tiếp: số điện thoại E.164 của người gửi (ví dụ: `+15551234567`)

```json
{
  "broadcast": {
    "120363403215116621@g.us": ["alfred", "baerbel", "assistant3"]
  }
}
```

**Kết quả:** khi OpenClaw thông thường sẽ phản hồi trong cuộc trò chuyện này, hệ thống chạy cả ba tác tử.

Mọi mã định danh tác tử được liệt kê đều phải tồn tại trong `agents.list`: quy trình xác thực cấu hình sẽ báo cáo các mã định danh không xác định và môi trường chạy sẽ bỏ qua chúng với cảnh báo `Broadcast agent <id> not found in agents.list; skipping`.

### Chiến lược xử lý

`broadcast.strategy` thiết lập cách các tác tử xử lý tin nhắn:

| Chiến lược            | Hành vi                                                                |
| -------------------- | --------------------------------------------------------------------- |
| `parallel` (mặc định) | Tất cả tác tử xử lý đồng thời; phản hồi có thể đến theo bất kỳ thứ tự nào. |
| `sequential`         | Các tác tử xử lý theo thứ tự trong mảng; mỗi tác tử chờ tác tử trước hoàn tất. |

```json
{
  "broadcast": {
    "strategy": "sequential",
    "120363403215116621@g.us": ["alfred", "baerbel"]
  }
}
```

### Ví dụ hoàn chỉnh

```json
{
  "agents": {
    "list": [
      {
        "id": "code-reviewer",
        "name": "Code Reviewer",
        "workspace": "/path/to/code-reviewer",
        "sandbox": { "mode": "all" }
      },
      {
        "id": "security-auditor",
        "name": "Security Auditor",
        "workspace": "/path/to/security-auditor",
        "sandbox": { "mode": "all" }
      },
      {
        "id": "docs-generator",
        "name": "Documentation Generator",
        "workspace": "/path/to/docs-generator",
        "sandbox": { "mode": "all" }
      }
    ]
  },
  "broadcast": {
    "strategy": "parallel",
    "120363403215116621@g.us": ["code-reviewer", "security-auditor", "docs-generator"],
    "120363424282127706@g.us": ["support-en", "support-de"],
    "+15555550123": ["assistant", "logger"]
  }
}
```

## Cách hoạt động

### Luồng tin nhắn

<Steps>
  <Step title="Tin nhắn đến">
    Một tin nhắn nhóm hoặc tin nhắn trực tiếp trên WhatsApp được gửi đến.
  </Step>
  <Step title="Định tuyến và tiếp nhận">
    OpenClaw áp dụng danh sách cho phép của kênh, quy tắc kích hoạt nhóm và quyền sở hữu liên kết ACP đã cấu hình.
  </Step>
  <Step title="Kiểm tra phát rộng">
    Nếu không có liên kết ACP đã cấu hình nào sở hữu tuyến, OpenClaw kiểm tra xem mã định danh đối tác có nằm trong `broadcast` hay không.
  </Step>
  <Step title="Nếu áp dụng phát rộng">
    - Tất cả tác tử được liệt kê đều xử lý tin nhắn.
    - Mỗi tác tử có khóa phiên và ngữ cảnh cô lập riêng.
    - Các tác tử xử lý song song (mặc định) hoặc tuần tự.
    - Tệp đính kèm âm thanh được chuyển thành văn bản một lần trước khi phân phối, nhờ đó các tác tử dùng chung một bản chép lời thay vì thực hiện các lệnh gọi STT riêng biệt.

  </Step>
  <Step title="Nếu không áp dụng phát rộng">
    OpenClaw phân phối đến tuyến thông thường hoặc tuyến phiên ACP đã cấu hình được chọn trong quá trình định tuyến.
  </Step>
</Steps>

<Note>
Nhóm phát rộng không bỏ qua danh sách cho phép của kênh hoặc quy tắc kích hoạt nhóm (lượt nhắc/lệnh/v.v.). Chúng chỉ thay đổi _tác tử nào chạy_ khi một tin nhắn đủ điều kiện để được xử lý.
</Note>

### Cô lập phiên

Mỗi tác tử trong một nhóm phát rộng duy trì hoàn toàn riêng biệt:

- **Khóa phiên** (`agent:alfred:whatsapp:group:120363...` so với `agent:baerbel:whatsapp:group:120363...`)
- **Lịch sử hội thoại** (một tác tử không thấy phản hồi của các tác tử khác)
- **Không gian làm việc** (các sandbox riêng nếu được cấu hình)
- **Quyền truy cập công cụ** (các danh sách cho phép/từ chối khác nhau)
- **Bộ nhớ/ngữ cảnh** (`IDENTITY.md`, `SOUL.md`, v.v. riêng biệt)

Có một ngoại lệ được chủ ý chia sẻ: **bộ đệm ngữ cảnh nhóm** (các tin nhắn nhóm gần đây dùng làm ngữ cảnh) được chia sẻ theo từng đối tác, vì vậy tất cả tác tử phát rộng nhìn thấy cùng một ngữ cảnh khi được kích hoạt. Bộ đệm được xóa một lần sau khi quá trình phân phối hoàn tất.

Điều này cho phép mỗi tác tử có tính cách, mô hình, Skills và quyền truy cập công cụ khác nhau (ví dụ: chỉ đọc so với đọc-ghi).

### Ví dụ: các phiên cô lập

Trong nhóm `120363403215116621@g.us` với các tác tử `["alfred", "baerbel"]`:

<Tabs>
  <Tab title="Ngữ cảnh của Alfred">
    ```text
    Session: agent:alfred:whatsapp:group:120363403215116621@g.us
    History: [user message, alfred's previous responses]
    Workspace: ~/openclaw-alfred/
    Tools: read, write, exec
    ```
  </Tab>
  <Tab title="Ngữ cảnh của Baerbel">
    ```text
    Session: agent:baerbel:whatsapp:group:120363403215116621@g.us
    History: [user message, baerbel's previous responses]
    Workspace: ~/openclaw-baerbel/
    Tools: read only
    ```
  </Tab>
</Tabs>

## Trường hợp sử dụng

- **Nhóm tác tử chuyên biệt**: một nhóm phát triển nơi `code-reviewer`, `security-auditor`, `test-generator` và `docs-checker` cùng trả lời một tin nhắn từ góc nhìn riêng.
- **Hỗ trợ đa ngôn ngữ**: một cuộc trò chuyện hỗ trợ với `support-en`, `support-de`, `support-es` phản hồi bằng ngôn ngữ tương ứng.
- **Đảm bảo chất lượng**: `support-agent` trả lời trong khi `qa-agent` đánh giá và chỉ phản hồi khi phát hiện vấn đề.
- **Tự động hóa tác vụ**: `task-tracker`, `time-logger` và `report-generator` cùng tiếp nhận một bản cập nhật trạng thái.

## Phương pháp hay nhất

<AccordionGroup>
  <Accordion title="1. Giữ cho tác tử tập trung">
    Giao cho mỗi tác tử một trách nhiệm duy nhất, rõ ràng (`formatter`, `linter`, `tester`) thay vì một tác tử "dev-helper" chung chung.
  </Accordion>
  <Accordion title="2. Sử dụng mã định danh và tên có tính mô tả">
    ```json
    {
      "agents": {
        "list": [
          { "id": "security-scanner", "name": "Security Scanner" },
          { "id": "code-formatter", "name": "Code Formatter" },
          { "id": "test-generator", "name": "Test Generator" }
        ]
      }
    }
    ```
  </Accordion>
  <Accordion title="3. Cấu hình quyền truy cập công cụ khác nhau">
    ```json
    {
      "agents": {
        "list": [
          { "id": "reviewer", "tools": { "allow": ["read", "exec"] } },
          { "id": "fixer", "tools": { "allow": ["read", "write", "edit", "exec"] } }
        ]
      }
    }
    ```

    `reviewer` chỉ có quyền đọc. `fixer` có thể đọc và ghi.

  </Accordion>
  <Accordion title="4. Theo dõi hiệu năng">
    Khi có nhiều tác tử, hãy ưu tiên `"strategy": "parallel"` (mặc định), giới hạn mỗi nhóm phát rộng ở một số ít tác tử và sử dụng các mô hình nhanh hơn cho những tác tử đơn giản hơn.
  </Accordion>
  <Accordion title="5. Lỗi được duy trì cô lập">
    Các tác tử gặp lỗi độc lập. Lỗi của một tác tử được ghi nhật ký (`Broadcast agent <id> failed: ...`) và không chặn các tác tử khác.
  </Accordion>
</AccordionGroup>

## Khả năng tương thích

### Nhà cung cấp

Nhóm phát rộng hiện chỉ được triển khai cho WhatsApp (kênh web). Các kênh khác bỏ qua cấu hình `broadcast`.

### Định tuyến

Nhóm phát rộng hoạt động cùng với cơ chế định tuyến hiện có:

```json
{
  "bindings": [
    {
      "match": { "channel": "whatsapp", "peer": { "kind": "group", "id": "GROUP_A" } },
      "agentId": "alfred"
    }
  ],
  "broadcast": {
    "GROUP_B": ["agent1", "agent2"]
  }
}
```

- `GROUP_A`: chỉ alfred phản hồi (định tuyến thông thường).
- `GROUP_B`: agent1 VÀ agent2 phản hồi (phát rộng).

<Note>
**Thứ tự ưu tiên:** `broadcast` được ưu tiên hơn các liên kết tuyến thông thường. Các liên kết ACP đã cấu hình (`bindings[].type="acp"`) có tính độc quyền: khi một liên kết khớp, OpenClaw phân phối đến phiên ACP đã cấu hình thay vì phát rộng phân phối.
</Note>

## Khắc phục sự cố

<AccordionGroup>
  <Accordion title="Tác tử không phản hồi">
    **Kiểm tra:**

    1. Mã định danh tác tử tồn tại trong `agents.list` (quy trình xác thực cấu hình từ chối các mã định danh không xác định).
    2. Định dạng mã định danh đối tác chính xác (JID nhóm như `120363403215116621@g.us`, hoặc E.164 như `+15551234567` cho tin nhắn trực tiếp).
    3. Tin nhắn đã vượt qua quy trình kiểm soát thông thường (các quy tắc nhắc đến/kích hoạt vẫn được áp dụng).

    **Gỡ lỗi:**

    ```bash
    openclaw logs --follow | grep -i broadcast
    ```

    Một lần phân phối thành công sẽ ghi nhật ký `Broadcasting message to <n> agents (<strategy>)`.

  </Accordion>
  <Accordion title="Chỉ một tác tử phản hồi">
    **Nguyên nhân:** mã định danh đối tác có thể nằm trong các liên kết tuyến thông thường nhưng không nằm trong `broadcast`, hoặc có thể khớp với một liên kết ACP độc quyền đã cấu hình.

    **Cách khắc phục:** thêm các đối tác được liên kết với tuyến thông thường vào cấu hình phát rộng, hoặc xóa/thay đổi liên kết ACP đã cấu hình nếu muốn phát rộng phân phối.

  </Accordion>
  <Accordion title="Vấn đề hiệu năng">
    Nếu hệ thống chậm khi có nhiều tác tử: giảm số lượng tác tử trong mỗi nhóm, sử dụng các mô hình nhẹ hơn và kiểm tra thời gian khởi động sandbox.
  </Accordion>
</AccordionGroup>

## Ví dụ

<AccordionGroup>
  <Accordion title="Ví dụ 1: Nhóm đánh giá mã">
    ```json
    {
      "broadcast": {
        "strategy": "parallel",
        "120363403215116621@g.us": [
          "code-formatter",
          "security-scanner",
          "test-coverage",
          "docs-checker"
        ]
      },
      "agents": {
        "list": [
          {
            "id": "code-formatter",
            "workspace": "~/agents/formatter",
            "tools": { "allow": ["read", "write"] }
          },
          {
            "id": "security-scanner",
            "workspace": "~/agents/security",
            "tools": { "allow": ["read", "exec"] }
          },
          {
            "id": "test-coverage",
            "workspace": "~/agents/testing",
            "tools": { "allow": ["read", "exec"] }
          },
          { "id": "docs-checker", "workspace": "~/agents/docs", "tools": { "allow": ["read"] } }
        ]
      }
    }
    ```

    Một đoạn mã trong nhóm tạo ra bốn phản hồi: các bản sửa định dạng, một phát hiện bảo mật, một khoảng trống về độ bao phủ và một góp ý nhỏ về tài liệu.

  </Accordion>
  <Accordion title="Ví dụ 2: Quy trình đa ngôn ngữ">
    ```json
    {
      "broadcast": {
        "strategy": "sequential",
        "+15555550123": ["detect-language", "translator-en", "translator-de"]
      },
      "agents": {
        "list": [
          { "id": "detect-language", "workspace": "~/agents/lang-detect" },
          { "id": "translator-en", "workspace": "~/agents/translate-en" },
          { "id": "translator-de", "workspace": "~/agents/translate-de" }
        ]
      }
    }
    ```
  </Accordion>
</AccordionGroup>

## Tham chiếu API

### Lược đồ cấu hình

```typescript
interface OpenClawConfig {
  broadcast?: {
    strategy?: "parallel" | "sequential";
    [peerId: string]: string[];
  };
}
```

### Trường

<ParamField path="strategy" type='"parallel" | "sequential"' default='"parallel"'>
  Cách xử lý các tác tử. `parallel` chạy đồng thời tất cả tác tử; `sequential` chạy chúng theo thứ tự trong mảng.
</ParamField>
<ParamField path="[peerId]" type="string[]">
  JID nhóm WhatsApp hoặc số điện thoại E.164. Giá trị là mảng mã định danh của các tác tử đều phải xử lý tin nhắn từ đối tác đó.
</ParamField>

## Giới hạn

1. **Số tác tử tối đa:** không có giới hạn cứng, nhưng nhiều tác tử (10+) có thể làm hệ thống chậm.
2. **Ngữ cảnh dùng chung:** các tác tử không thấy phản hồi của nhau (theo thiết kế).
3. **Thứ tự tin nhắn:** các phản hồi song song có thể đến theo bất kỳ thứ tự nào.
4. **Giới hạn tốc độ:** tất cả phản hồi đều đến từ một tài khoản WhatsApp, vì vậy phản hồi của mỗi tác tử đều được tính vào cùng giới hạn tốc độ của WhatsApp.

## Liên quan

- [Định tuyến kênh](/vi/channels/channel-routing)
- [Nhóm](/vi/channels/groups)
- [Công cụ sandbox đa tác tử](/vi/tools/multi-agent-sandbox-tools)
- [Ghép đôi](/vi/channels/pairing)
- [Quản lý phiên](/vi/concepts/session)
