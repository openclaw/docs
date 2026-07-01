---
read_when:
    - Cấu hình nhóm phát sóng
    - Gỡ lỗi phản hồi đa tác nhân trong WhatsApp
sidebarTitle: Broadcast groups
status: experimental
summary: Gửi một tin nhắn WhatsApp đến nhiều tác nhân
title: Nhóm phát sóng
x-i18n:
    generated_at: "2026-07-01T08:12:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 97e8c2ade5d12a437864e6aca0d475e586289f71155188afed216881ebf89f88
    source_path: channels/broadcast-groups.md
    workflow: 16
---

<Note>
**Trạng thái:** Thử nghiệm. Đã thêm trong 2026.1.9.
</Note>

## Tổng quan

Nhóm phát sóng cho phép nhiều agent xử lý và phản hồi cùng một thông điệp đồng thời. Điều này cho phép bạn tạo các đội agent chuyên biệt cùng làm việc trong một nhóm WhatsApp hoặc DM duy nhất — tất cả chỉ dùng một số điện thoại.

Phạm vi hiện tại: **Chỉ WhatsApp** (kênh web).

Nhóm phát sóng được đánh giá sau danh sách cho phép của kênh và quy tắc kích hoạt nhóm. Trong các nhóm WhatsApp, điều này nghĩa là phát sóng xảy ra khi OpenClaw thông thường sẽ phản hồi (ví dụ: khi được nhắc đến, tùy theo cài đặt nhóm của bạn).

Lane QA WhatsApp trực tiếp bao gồm `whatsapp-broadcast-group-fanout`, xác minh rằng một thông điệp nhóm có nhắc đến có thể tạo ra các phản hồi hiển thị riêng biệt từ hai agent đã cấu hình.

## Trường hợp sử dụng

<AccordionGroup>
  <Accordion title="1. Đội agent chuyên biệt">
    Triển khai nhiều agent với trách nhiệm tập trung, nguyên tử:

    ```
    Group: "Development Team"
    Agents:
      - CodeReviewer (reviews code snippets)
      - DocumentationBot (generates docs)
      - SecurityAuditor (checks for vulnerabilities)
      - TestGenerator (suggests test cases)
    ```

    Mỗi agent xử lý cùng một thông điệp và cung cấp góc nhìn chuyên biệt của nó.

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

Thêm một phần `broadcast` cấp cao nhất (bên cạnh `bindings`). Khóa là WhatsApp peer id:

- cuộc trò chuyện nhóm: JID nhóm (ví dụ `120363403215116621@g.us`)
- DM: số điện thoại E.164 (ví dụ `+15551234567`)

```json
{
  "broadcast": {
    "120363403215116621@g.us": ["alfred", "baerbel", "assistant3"]
  }
}
```

**Kết quả:** Khi OpenClaw sẽ phản hồi trong cuộc trò chuyện này, nó sẽ chạy cả ba agent.

### Chiến lược xử lý

Kiểm soát cách agent xử lý thông điệp:

<Tabs>
  <Tab title="parallel (mặc định)">
    Tất cả agent xử lý đồng thời:

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
    Agent xử lý theo thứ tự (một agent đợi agent trước đó hoàn tất):

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

### Luồng thông điệp

<Steps>
  <Step title="Thông điệp đến">
    Một thông điệp nhóm WhatsApp hoặc DM đến.
  </Step>
  <Step title="Định tuyến và tiếp nhận">
    OpenClaw áp dụng danh sách cho phép của kênh, quy tắc kích hoạt nhóm và quyền sở hữu binding ACP đã cấu hình.
  </Step>
  <Step title="Kiểm tra phát sóng">
    Nếu không có binding ACP đã cấu hình nào sở hữu tuyến, OpenClaw kiểm tra xem peer ID có trong `broadcast` hay không.
  </Step>
  <Step title="Nếu áp dụng phát sóng">
    - Tất cả agent được liệt kê sẽ xử lý thông điệp.
    - Mỗi agent có khóa phiên và ngữ cảnh cô lập riêng.
    - Agent xử lý song song (mặc định) hoặc tuần tự.

  </Step>
  <Step title="Nếu không áp dụng phát sóng">
    OpenClaw chuyển tiếp tuyến thông thường hoặc tuyến phiên ACP đã cấu hình được chọn trong quá trình định tuyến.
  </Step>
</Steps>

<Note>
Nhóm phát sóng không bỏ qua danh sách cho phép của kênh hoặc quy tắc kích hoạt nhóm (nhắc đến/lệnh/v.v.). Chúng chỉ thay đổi _agent nào chạy_ khi một thông điệp đủ điều kiện để xử lý.
</Note>

### Cô lập phiên

Mỗi agent trong một nhóm phát sóng duy trì hoàn toàn riêng biệt:

- **Khóa phiên** (`agent:alfred:whatsapp:group:120363...` so với `agent:baerbel:whatsapp:group:120363...`)
- **Lịch sử hội thoại** (agent không thấy thông điệp của các agent khác)
- **Workspace** (sandbox riêng nếu được cấu hình)
- **Quyền truy cập công cụ** (các danh sách cho phép/từ chối khác nhau)
- **Bộ nhớ/ngữ cảnh** (IDENTITY.md, SOUL.md, v.v. riêng)
- **Bộ đệm ngữ cảnh nhóm** (các thông điệp nhóm gần đây dùng làm ngữ cảnh) được chia sẻ theo từng peer, vì vậy tất cả agent phát sóng thấy cùng ngữ cảnh khi được kích hoạt

Điều này cho phép mỗi agent có:

- Tính cách khác nhau
- Quyền truy cập công cụ khác nhau (ví dụ: chỉ đọc so với đọc-ghi)
- Mô hình khác nhau (ví dụ: opus so với sonnet)
- Skills khác nhau đã cài đặt

### Ví dụ: phiên cô lập

Trong nhóm `120363403215116621@g.us` với các agent `["alfred", "baerbel"]`:

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

## Thực hành tốt nhất

<AccordionGroup>
  <Accordion title="1. Giữ agent tập trung">
    Thiết kế mỗi agent với một trách nhiệm duy nhất, rõ ràng:

    ```json
    {
      "broadcast": {
        "DEV_GROUP": ["formatter", "linter", "tester"]
      }
    }
    ```

    ✅ **Tốt:** Mỗi agent có một việc. ❌ **Không tốt:** Một agent "dev-helper" chung chung.

  </Accordion>
  <Accordion title="2. Dùng tên mô tả rõ">
    Làm rõ mỗi agent làm gì:

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
    Chỉ cấp cho agent các công cụ chúng cần:

    ```json
    {
      "agents": {
        "reviewer": {
          "tools": { "allow": ["read", "exec"] }
        },
        "fixer": {
          "tools": { "allow": ["read", "write", "edit", "exec"] }
        }
      }
    }
    ```

    `reviewer` là chỉ đọc. `fixer` có thể đọc và ghi.

  </Accordion>
  <Accordion title="4. Theo dõi hiệu năng">
    Với nhiều agent, hãy cân nhắc:

    - Dùng `"strategy": "parallel"` (mặc định) để tăng tốc độ
    - Giới hạn nhóm phát sóng ở 5-10 agent
    - Dùng mô hình nhanh hơn cho các agent đơn giản hơn

  </Accordion>
  <Accordion title="5. Xử lý lỗi một cách mềm dẻo">
    Agent lỗi độc lập. Lỗi của một agent không chặn các agent khác:

    ```
    Message → [Agent A ✓, Agent B ✗ error, Agent C ✓]
    Result: Agent A and C respond, Agent B logs error
    ```

  </Accordion>
</AccordionGroup>

## Tương thích

### Provider

Nhóm phát sóng hiện hoạt động với:

- ✅ WhatsApp (đã triển khai)
- 🚧 Telegram (đã lên kế hoạch)
- 🚧 Discord (đã lên kế hoạch)
- 🚧 Slack (đã lên kế hoạch)

### Định tuyến

Nhóm phát sóng hoạt động cùng định tuyến hiện có:

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

- `GROUP_A`: Chỉ alfred phản hồi (định tuyến thông thường).
- `GROUP_B`: agent1 VÀ agent2 phản hồi (phát sóng).

<Note>
**Thứ tự ưu tiên:** `broadcast` được ưu tiên hơn các binding tuyến thông thường. Các binding ACP đã cấu hình (`bindings[].type="acp"`) là độc quyền: khi một binding khớp, OpenClaw chuyển tiếp đến phiên ACP đã cấu hình thay vì phát sóng phân nhánh.
</Note>

## Khắc phục sự cố

<AccordionGroup>
  <Accordion title="Agent không phản hồi">
    **Kiểm tra:**

    1. Agent ID tồn tại trong `agents.list`.
    2. Định dạng peer ID đúng (ví dụ `120363403215116621@g.us`).
    3. Agent không nằm trong danh sách từ chối.

    **Gỡ lỗi:**

    ```bash
    tail -f ~/.openclaw/logs/gateway.log | grep broadcast
    ```

  </Accordion>
  <Accordion title="Chỉ một agent phản hồi">
    **Nguyên nhân:** Peer ID có thể nằm trong các binding tuyến thông thường nhưng không nằm trong `broadcast`, hoặc có thể khớp với một binding ACP đã cấu hình độc quyền.

    **Cách sửa:** Thêm các peer ràng buộc tuyến thông thường vào cấu hình phát sóng, hoặc xóa/thay đổi binding ACP đã cấu hình nếu muốn phát sóng phân nhánh.

  </Accordion>
  <Accordion title="Vấn đề hiệu năng">
    Nếu chậm khi có nhiều agent:

    - Giảm số lượng agent trong mỗi nhóm.
    - Dùng mô hình nhẹ hơn (sonnet thay vì opus).
    - Kiểm tra thời gian khởi động sandbox.

  </Accordion>
</AccordionGroup>

## Ví dụ

<AccordionGroup>
  <Accordion title="Ví dụ 1: Đội đánh giá mã">
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
    - test-coverage: "Coverage là 45%, thiếu kiểm thử cho các trường hợp lỗi"
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

### Schema cấu hình

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
  Cách xử lý các agent. `parallel` chạy tất cả agent đồng thời; `sequential` chạy chúng theo thứ tự trong mảng.
</ParamField>
<ParamField path="[peerId]" type="string[]">
  JID nhóm WhatsApp, số E.164 hoặc ID ngang hàng khác. Giá trị là mảng các ID agent nên xử lý tin nhắn.
</ParamField>

## Hạn chế

1. **Số agent tối đa:** Không có giới hạn cứng, nhưng từ 10 agent trở lên có thể chậm.
2. **Ngữ cảnh dùng chung:** Các agent không thấy phản hồi của nhau (theo thiết kế).
3. **Thứ tự tin nhắn:** Phản hồi song song có thể đến theo bất kỳ thứ tự nào.
4. **Giới hạn tốc độ:** Tất cả agent đều được tính vào giới hạn tốc độ của WhatsApp.

## Cải tiến trong tương lai

Các tính năng đã lên kế hoạch:

- [ ] Chế độ ngữ cảnh dùng chung (các agent thấy phản hồi của nhau)
- [ ] Điều phối agent (các agent có thể gửi tín hiệu cho nhau)
- [ ] Chọn agent động (chọn agent dựa trên nội dung tin nhắn)
- [ ] Ưu tiên agent (một số agent phản hồi trước các agent khác)

## Liên quan

- [Định tuyến kênh](/vi/channels/channel-routing)
- [Nhóm](/vi/channels/groups)
- [Công cụ sandbox đa agent](/vi/tools/multi-agent-sandbox-tools)
- [Ghép nối](/vi/channels/pairing)
- [Quản lý phiên](/vi/concepts/session)
