---
read_when:
    - Cấu hình các nhóm phát sóng
    - Gỡ lỗi phản hồi đa tác nhân trong WhatsApp
sidebarTitle: Broadcast groups
status: experimental
summary: Gửi tin nhắn WhatsApp đồng loạt tới nhiều tác nhân
title: Nhóm phát sóng
x-i18n:
    generated_at: "2026-04-29T22:24:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: b0de4ccc85bf79e2ceb1dddd60db067309b15b7f876c92e7d591ff0b4b4315ec
    source_path: channels/broadcast-groups.md
    workflow: 16
---

<Note>
**Trạng thái:** Thử nghiệm. Được thêm vào 2026.1.9.
</Note>

## Tổng quan

Nhóm phát sóng cho phép nhiều tác nhân xử lý và phản hồi cùng một tin nhắn đồng thời. Điều này cho phép bạn tạo các nhóm tác nhân chuyên biệt làm việc cùng nhau trong một nhóm WhatsApp hoặc DM duy nhất — tất cả chỉ dùng một số điện thoại.

Phạm vi hiện tại: **chỉ WhatsApp** (kênh web).

Nhóm phát sóng được đánh giá sau danh sách cho phép của kênh và các quy tắc kích hoạt nhóm. Trong các nhóm WhatsApp, điều này có nghĩa là phát sóng xảy ra khi OpenClaw thường sẽ phản hồi (ví dụ: khi được nhắc đến, tùy theo cài đặt nhóm của bạn).

## Trường hợp sử dụng

<AccordionGroup>
  <Accordion title="1. Nhóm tác nhân chuyên biệt">
    Triển khai nhiều tác nhân với trách nhiệm nguyên tử, tập trung:

    ```
    Group: "Development Team"
    Agents:
      - CodeReviewer (reviews code snippets)
      - DocumentationBot (generates docs)
      - SecurityAuditor (checks for vulnerabilities)
      - TestGenerator (suggests test cases)
    ```

    Mỗi tác nhân xử lý cùng một tin nhắn và cung cấp góc nhìn chuyên biệt của mình.

  </Accordion>
  <Accordion title="2. Hỗ trợ đa ngôn ngữ">
    ```
    Group: "International Support"
    Agents:
      - Agent_EN (responds in English)
      - Agent_DE (responds in German)
      - Agent_ES (responds in Spanish)
    ```
  </Accordion>
  <Accordion title="3. Quy trình đảm bảo chất lượng">
    ```
    Group: "Customer Support"
    Agents:
      - SupportAgent (provides answer)
      - QAAgent (reviews quality, only responds if issues found)
    ```
  </Accordion>
  <Accordion title="4. Tự động hóa tác vụ">
    ```
    Group: "Project Management"
    Agents:
      - TaskTracker (updates task database)
      - TimeLogger (logs time spent)
      - ReportGenerator (creates summaries)
    ```
  </Accordion>
</AccordionGroup>

## Cấu hình

### Thiết lập cơ bản

Thêm một phần `broadcast` cấp cao nhất (bên cạnh `bindings`). Khóa là ID ngang hàng của WhatsApp:

- cuộc trò chuyện nhóm: JID nhóm (ví dụ: `120363403215116621@g.us`)
- DM: số điện thoại E.164 (ví dụ: `+15551234567`)

```json
{
  "broadcast": {
    "120363403215116621@g.us": ["alfred", "baerbel", "assistant3"]
  }
}
```

**Kết quả:** Khi OpenClaw sẽ phản hồi trong cuộc trò chuyện này, nó sẽ chạy cả ba tác nhân.

### Chiến lược xử lý

Kiểm soát cách tác nhân xử lý tin nhắn:

<Tabs>
  <Tab title="parallel (mặc định)">
    Tất cả tác nhân xử lý đồng thời:

    ```json
    {
      "broadcast": {
        "strategy": "parallel",
        "120363403215116621@g.us": ["alfred", "baerbel"]
      }
    }
    ```

  </Tab>
  <Tab title="sequential">
    Tác nhân xử lý theo thứ tự (một tác nhân chờ tác nhân trước hoàn tất):

    ```json
    {
      "broadcast": {
        "strategy": "sequential",
        "120363403215116621@g.us": ["alfred", "baerbel"]
      }
    }
    ```

  </Tab>
</Tabs>

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
    Một tin nhắn nhóm WhatsApp hoặc DM đến.
  </Step>
  <Step title="Kiểm tra phát sóng">
    Hệ thống kiểm tra xem ID ngang hàng có trong `broadcast` hay không.
  </Step>
  <Step title="Nếu nằm trong danh sách phát sóng">
    - Tất cả tác nhân được liệt kê xử lý tin nhắn.
    - Mỗi tác nhân có khóa phiên và ngữ cảnh cô lập riêng.
    - Tác nhân xử lý song song (mặc định) hoặc tuần tự.

  </Step>
  <Step title="Nếu không nằm trong danh sách phát sóng">
    Áp dụng định tuyến bình thường (binding khớp đầu tiên).
  </Step>
</Steps>

<Note>
Nhóm phát sóng không bỏ qua danh sách cho phép của kênh hoặc các quy tắc kích hoạt nhóm (nhắc đến/lệnh/v.v.). Chúng chỉ thay đổi _tác nhân nào chạy_ khi một tin nhắn đủ điều kiện để xử lý.
</Note>

### Cô lập phiên

Mỗi tác nhân trong một nhóm phát sóng duy trì hoàn toàn riêng biệt:

- **Khóa phiên** (`agent:alfred:whatsapp:group:120363...` so với `agent:baerbel:whatsapp:group:120363...`)
- **Lịch sử hội thoại** (tác nhân không thấy tin nhắn của các tác nhân khác)
- **Workspace** (sandbox riêng nếu được cấu hình)
- **Quyền truy cập công cụ** (danh sách cho phép/từ chối khác nhau)
- **Bộ nhớ/ngữ cảnh** (`IDENTITY.md`, `SOUL.md` riêng, v.v.)
- **Bộ đệm ngữ cảnh nhóm** (các tin nhắn nhóm gần đây dùng làm ngữ cảnh) được chia sẻ theo từng ngang hàng, nên tất cả tác nhân phát sóng thấy cùng một ngữ cảnh khi được kích hoạt

Điều này cho phép mỗi tác nhân có:

- Tính cách khác nhau
- Quyền truy cập công cụ khác nhau (ví dụ: chỉ đọc so với đọc-ghi)
- Mô hình khác nhau (ví dụ: opus so với sonnet)
- Các Skills khác nhau đã cài đặt

### Ví dụ: phiên cô lập

Trong nhóm `120363403215116621@g.us` với các tác nhân `["alfred", "baerbel"]`:

<Tabs>
  <Tab title="Ngữ cảnh của Alfred">
    ```
    Session: agent:alfred:whatsapp:group:120363403215116621@g.us
    History: [user message, alfred's previous responses]
    Workspace: /Users/user/openclaw-alfred/
    Tools: read, write, exec
    ```
  </Tab>
  <Tab title="Ngữ cảnh của Bärbel">
    ```
    Session: agent:baerbel:whatsapp:group:120363403215116621@g.us
    History: [user message, baerbel's previous responses]
    Workspace: /Users/user/openclaw-baerbel/
    Tools: read only
    ```
  </Tab>
</Tabs>

## Phương pháp hay nhất

<AccordionGroup>
  <Accordion title="1. Giữ tác nhân tập trung">
    Thiết kế mỗi tác nhân với một trách nhiệm rõ ràng, duy nhất:

    ```json
    {
      "broadcast": {
        "DEV_GROUP": ["formatter", "linter", "tester"]
      }
    }
    ```

    ✅ **Tốt:** Mỗi tác nhân có một nhiệm vụ. ❌ **Không tốt:** Một tác nhân "dev-helper" chung chung.

  </Accordion>
  <Accordion title="2. Dùng tên mô tả rõ ràng">
    Làm rõ mỗi tác nhân làm gì:

    ```json
    {
      "agents": {
        "security-scanner": { "name": "Security Scanner" },
        "code-formatter": { "name": "Code Formatter" },
        "test-generator": { "name": "Test Generator" }
      }
    }
    ```

  </Accordion>
  <Accordion title="3. Cấu hình quyền truy cập công cụ khác nhau">
    Chỉ cấp cho tác nhân những công cụ chúng cần:

    ```json
    {
      "agents": {
        "reviewer": {
          "tools": { "allow": ["read", "exec"] } // Read-only
        },
        "fixer": {
          "tools": { "allow": ["read", "write", "edit", "exec"] } // Read-write
        }
      }
    }
    ```

  </Accordion>
  <Accordion title="4. Theo dõi hiệu năng">
    Với nhiều tác nhân, hãy cân nhắc:

    - Dùng `"strategy": "parallel"` (mặc định) để tăng tốc
    - Giới hạn nhóm phát sóng ở 5-10 tác nhân
    - Dùng mô hình nhanh hơn cho các tác nhân đơn giản hơn

  </Accordion>
  <Accordion title="5. Xử lý lỗi một cách nhẹ nhàng">
    Tác nhân lỗi độc lập. Lỗi của một tác nhân không chặn các tác nhân khác:

    ```
    Message → [Agent A ✓, Agent B ✗ error, Agent C ✓]
    Result: Agent A and C respond, Agent B logs error
    ```

  </Accordion>
</AccordionGroup>

## Khả năng tương thích

### Nhà cung cấp

Nhóm phát sóng hiện hoạt động với:

- ✅ WhatsApp (đã triển khai)
- 🚧 Telegram (đã lên kế hoạch)
- 🚧 Discord (đã lên kế hoạch)
- 🚧 Slack (đã lên kế hoạch)

### Định tuyến

Nhóm phát sóng hoạt động cùng với định tuyến hiện có:

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

- `GROUP_A`: Chỉ alfred phản hồi (định tuyến bình thường).
- `GROUP_B`: agent1 VÀ agent2 phản hồi (phát sóng).

<Note>
**Độ ưu tiên:** `broadcast` được ưu tiên hơn `bindings`.
</Note>

## Khắc phục sự cố

<AccordionGroup>
  <Accordion title="Tác nhân không phản hồi">
    **Kiểm tra:**

    1. ID tác nhân tồn tại trong `agents.list`.
    2. Định dạng ID ngang hàng chính xác (ví dụ: `120363403215116621@g.us`).
    3. Tác nhân không nằm trong danh sách từ chối.

    **Gỡ lỗi:**

    ```bash
    tail -f ~/.openclaw/logs/gateway.log | grep broadcast
    ```

  </Accordion>
  <Accordion title="Chỉ một tác nhân phản hồi">
    **Nguyên nhân:** ID ngang hàng có thể nằm trong `bindings` nhưng không nằm trong `broadcast`.

    **Cách khắc phục:** Thêm vào cấu hình phát sóng hoặc xóa khỏi bindings.

  </Accordion>
  <Accordion title="Vấn đề hiệu năng">
    Nếu chậm với nhiều tác nhân:

    - Giảm số lượng tác nhân trên mỗi nhóm.
    - Dùng mô hình nhẹ hơn (sonnet thay vì opus).
    - Kiểm tra thời gian khởi động sandbox.

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

    **Người dùng gửi:** Đoạn mã.

    **Phản hồi:**

    - code-formatter: "Đã sửa thụt lề và thêm gợi ý kiểu"
    - security-scanner: "⚠️ Lỗ hổng SQL injection ở dòng 12"
    - test-coverage: "Độ phủ là 45%, thiếu kiểm thử cho các trường hợp lỗi"
    - docs-checker: "Thiếu docstring cho hàm `process_data`"

  </Accordion>
  <Accordion title="Ví dụ 2: Hỗ trợ đa ngôn ngữ">
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
  Cách xử lý tác nhân. `parallel` chạy tất cả tác nhân đồng thời; `sequential` chạy chúng theo thứ tự mảng.
</ParamField>
<ParamField path="[peerId]" type="string[]">
  JID nhóm WhatsApp, số E.164 hoặc ID ngang hàng khác. Giá trị là mảng ID tác nhân nên xử lý tin nhắn.
</ParamField>

## Giới hạn

1. **Số tác nhân tối đa:** Không có giới hạn cứng, nhưng hơn 10 tác nhân có thể chậm.
2. **Ngữ cảnh dùng chung:** Tác nhân không thấy phản hồi của nhau (theo thiết kế).
3. **Thứ tự tin nhắn:** Phản hồi song song có thể đến theo bất kỳ thứ tự nào.
4. **Giới hạn tốc độ:** Tất cả tác nhân đều được tính vào giới hạn tốc độ của WhatsApp.

## Cải tiến trong tương lai

Các tính năng đã lên kế hoạch:

- [ ] Chế độ ngữ cảnh dùng chung (tác nhân thấy phản hồi của nhau)
- [ ] Điều phối tác nhân (tác nhân có thể báo hiệu cho nhau)
- [ ] Chọn tác nhân động (chọn tác nhân dựa trên nội dung tin nhắn)
- [ ] Độ ưu tiên của tác nhân (một số tác nhân phản hồi trước các tác nhân khác)

## Liên quan

- [Định tuyến kênh](/vi/channels/channel-routing)
- [Nhóm](/vi/channels/groups)
- [Công cụ môi trường cô lập đa tác nhân](/vi/tools/multi-agent-sandbox-tools)
- [Ghép nối](/vi/channels/pairing)
- [Quản lý phiên](/vi/concepts/session)
