---
read_when: You want per-agent sandboxing or per-agent tool allow/deny policies in a multi-agent gateway.
sidebarTitle: Multi-agent sandbox and tools
status: active
summary: Hộp cát theo từng tác tử + các hạn chế về công cụ, thứ tự ưu tiên và ví dụ
title: Hộp cát và công cụ đa tác nhân
x-i18n:
    generated_at: "2026-07-12T08:30:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fada3672a0a7ce6eac2a8bffee8329afcd893d97e33d8e9842cb12079397efa6
    source_path: tools/multi-agent-sandbox-tools.md
    workflow: 16
---

Mỗi agent trong cấu hình đa agent có thể ghi đè chính sách sandbox và công cụ toàn cục. Trang này trình bày cấu hình theo từng agent, quy tắc ưu tiên và các ví dụ.

<CardGroup cols={3}>
  <Card title="Sandbox" href="/vi/gateway/sandboxing">
    Backend và chế độ — tài liệu tham khảo đầy đủ về sandbox.
  </Card>
  <Card title="Sandbox so với chính sách công cụ so với chế độ nâng quyền" href="/vi/gateway/sandbox-vs-tool-policy-vs-elevated">
    Gỡ lỗi "tại sao thao tác này bị chặn?"
  </Card>
  <Card title="Chế độ nâng quyền" href="/vi/tools/elevated">
    Thực thi nâng quyền cho người gửi đáng tin cậy.
  </Card>
</CardGroup>

<Warning>
Xác thực được giới hạn theo agent: mỗi agent có kho lưu trữ xác thực `agentDir` riêng tại `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`. Tuyệt đối không dùng lại `agentDir` cho nhiều agent. Agent có thể đọc các hồ sơ xác thực của agent mặc định/chính khi không có hồ sơ cục bộ, nhưng token làm mới OAuth không được sao chép vào kho lưu trữ của agent phụ. Nếu sao chép thông tin xác thực theo cách thủ công, chỉ sao chép các hồ sơ `api_key` hoặc `token` tĩnh có tính di động.
</Warning>

---

## Ví dụ cấu hình

<AccordionGroup>
  <Accordion title="Ví dụ 1: Agent cá nhân + agent gia đình bị hạn chế">
    ```json
    {
      "agents": {
        "list": [
          {
            "id": "main",
            "default": true,
            "name": "Personal Assistant",
            "workspace": "~/.openclaw/workspace",
            "sandbox": { "mode": "off" }
          },
          {
            "id": "family",
            "name": "Family Bot",
            "workspace": "~/.openclaw/workspace-family",
            "sandbox": {
              "mode": "all",
              "scope": "agent"
            },
            "tools": {
              "allow": ["read", "message"],
              "deny": ["exec", "write", "edit", "apply_patch", "process", "browser"],
              "message": {
                "crossContext": {
                  "allowWithinProvider": false,
                  "allowAcrossProviders": false
                }
              }
            }
          }
        ]
      },
      "bindings": [
        {
          "agentId": "family",
          "match": {
            "provider": "whatsapp",
            "accountId": "*",
            "peer": {
              "kind": "group",
              "id": "120363424282127706@g.us"
            }
          }
        }
      ]
    }
    ```

    **Kết quả:**

    - Agent `main`: chạy trên máy chủ, có toàn quyền truy cập công cụ.
    - Agent `family`: chạy trong Docker (mỗi agent một container), chỉ có thể dùng `read` và gửi tin nhắn trong cuộc trò chuyện hiện tại.

  </Accordion>
  <Accordion title="Ví dụ 2: Agent công việc dùng sandbox chung">
    ```json
    {
      "agents": {
        "list": [
          {
            "id": "personal",
            "workspace": "~/.openclaw/workspace-personal",
            "sandbox": { "mode": "off" }
          },
          {
            "id": "work",
            "workspace": "~/.openclaw/workspace-work",
            "sandbox": {
              "mode": "all",
              "scope": "shared",
              "workspaceRoot": "/tmp/work-sandboxes"
            },
            "tools": {
              "allow": ["read", "write", "apply_patch", "exec"],
              "deny": ["browser", "gateway", "discord"]
            }
          }
        ]
      }
    }
    ```
  </Accordion>
  <Accordion title="Ví dụ 2b: Hồ sơ lập trình toàn cục + agent chỉ nhắn tin">
    ```json
    {
      "tools": { "profile": "coding" },
      "agents": {
        "list": [
          {
            "id": "support",
            "tools": { "profile": "messaging", "allow": ["slack"] }
          }
        ]
      }
    }
    ```

    **Kết quả:**

    - Các agent mặc định nhận công cụ lập trình.
    - Agent `support` chỉ có thể nhắn tin (+ công cụ Slack).

  </Accordion>
  <Accordion title="Ví dụ 3: Chế độ sandbox khác nhau cho từng agent">
    ```json
    {
      "agents": {
        "defaults": {
          "sandbox": {
            "mode": "non-main",
            "scope": "session"
          }
        },
        "list": [
          {
            "id": "main",
            "workspace": "~/.openclaw/workspace",
            "sandbox": {
              "mode": "off"
            }
          },
          {
            "id": "public",
            "workspace": "~/.openclaw/workspace-public",
            "sandbox": {
              "mode": "all",
              "scope": "agent"
            },
            "tools": {
              "allow": ["read"],
              "deny": ["exec", "write", "edit", "apply_patch"]
            }
          }
        ]
      }
    }
    ```
  </Accordion>
</AccordionGroup>

---

## Thứ tự ưu tiên cấu hình

Khi đồng thời tồn tại cấu hình toàn cục (`agents.defaults.*`) và cấu hình riêng cho agent (`agents.list[].*`):

### Cấu hình sandbox

Thiết lập riêng cho agent ghi đè thiết lập toàn cục:

```text
agents.list[].sandbox.mode > agents.defaults.sandbox.mode
agents.list[].sandbox.scope > agents.defaults.sandbox.scope
agents.list[].sandbox.workspaceRoot > agents.defaults.sandbox.workspaceRoot
agents.list[].sandbox.workspaceAccess > agents.defaults.sandbox.workspaceAccess
agents.list[].sandbox.docker.* > agents.defaults.sandbox.docker.*
agents.list[].sandbox.browser.* > agents.defaults.sandbox.browser.*
agents.list[].sandbox.prune.* > agents.defaults.sandbox.prune.*
```

<Note>
`agents.list[].sandbox.{docker,browser,prune}.*` ghi đè `agents.defaults.sandbox.{docker,browser,prune}.*` cho agent đó (bị bỏ qua khi phạm vi sandbox được xác định là `"shared"`).
</Note>

### Hạn chế công cụ

Thứ tự lọc như sau:

<Steps>
  <Step title="Hồ sơ công cụ">
    `tools.profile` hoặc `agents.list[].tools.profile`.
  </Step>
  <Step title="Hồ sơ công cụ của nhà cung cấp">
    `tools.byProvider[provider].profile` hoặc `agents.list[].tools.byProvider[provider].profile`.
  </Step>
  <Step title="Chính sách công cụ toàn cục">
    `tools.allow` / `tools.deny`.
  </Step>
  <Step title="Chính sách công cụ của nhà cung cấp">
    `tools.byProvider[provider].allow/deny`.
  </Step>
  <Step title="Chính sách công cụ riêng cho agent">
    `agents.list[].tools.allow/deny`.
  </Step>
  <Step title="Chính sách nhà cung cấp của agent">
    `agents.list[].tools.byProvider[provider].allow/deny`.
  </Step>
  <Step title="Chính sách công cụ sandbox">
    `tools.sandbox.tools` hoặc `agents.list[].tools.sandbox.tools`.
  </Step>
  <Step title="Chính sách công cụ của agent phụ">
    `tools.subagents.tools`, nếu áp dụng.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Quy tắc ưu tiên">
    - Mỗi cấp có thể hạn chế thêm các công cụ, nhưng không thể cấp lại những công cụ đã bị từ chối ở các cấp trước.
    - Nếu đặt `agents.list[].tools.sandbox.tools`, giá trị này sẽ thay thế `tools.sandbox.tools` cho agent đó.
    - Nếu đặt `agents.list[].tools.profile`, giá trị này sẽ ghi đè `tools.profile` cho agent đó.
    - Khóa công cụ của nhà cung cấp chấp nhận cả `provider` (ví dụ: `google-antigravity`) hoặc `provider/model` (ví dụ: `openai/gpt-5.4`).

  </Accordion>
  <Accordion title="Hành vi khi danh sách cho phép trống">
    Nếu bất kỳ danh sách cho phép tường minh nào trong chuỗi đó khiến lượt chạy không còn công cụ nào có thể gọi, OpenClaw sẽ dừng trước khi gửi lời nhắc đến mô hình. Đây là hành vi có chủ đích: một agent được cấu hình với công cụ không tồn tại, chẳng hạn `agents.list[].tools.allow: ["query_db"]`, phải báo lỗi rõ ràng cho đến khi Plugin đăng ký `query_db` được bật, thay vì tiếp tục hoạt động như một agent chỉ xử lý văn bản.
  </Accordion>
</AccordionGroup>

Chính sách công cụ hỗ trợ các dạng viết tắt `group:*`, được mở rộng thành nhiều công cụ. Xem [Nhóm công cụ](/vi/gateway/sandbox-vs-tool-policy-vs-elevated#tool-groups-shorthands) để biết danh sách đầy đủ.

Các ghi đè nâng quyền theo từng agent (`agents.list[].tools.elevated`) có thể hạn chế thêm quyền thực thi nâng quyền cho những agent cụ thể. Xem [Chế độ nâng quyền](/vi/tools/elevated) để biết chi tiết.

---

## Di chuyển từ một agent

<Tabs>
  <Tab title="Trước đây (một agent)">
    ```json
    {
      "agents": {
        "defaults": {
          "workspace": "~/.openclaw/workspace",
          "sandbox": {
            "mode": "non-main"
          }
        }
      },
      "tools": {
        "sandbox": {
          "tools": {
            "allow": ["read", "write", "apply_patch", "exec"],
            "deny": []
          }
        }
      }
    }
    ```
  </Tab>
  <Tab title="Sau khi chuyển đổi (đa agent)">
    ```json
    {
      "agents": {
        "list": [
          {
            "id": "main",
            "default": true,
            "workspace": "~/.openclaw/workspace",
            "sandbox": { "mode": "off" }
          }
        ]
      }
    }
    ```
  </Tab>
</Tabs>

<Note>
Các khóa cấu hình `agents.defaults.*`/`agents.list[].*` cũ (chẳng hạn `sandbox.perSession`, `agentRuntime`, `embeddedPi`) được `openclaw doctor` di chuyển; từ nay nên ưu tiên dùng `agents.defaults` + `agents.list`.
</Note>

---

## Ví dụ hạn chế công cụ

<Tabs>
  <Tab title="Agent chỉ đọc">
    ```json
    {
      "tools": {
        "allow": ["read"],
        "deny": ["exec", "write", "edit", "apply_patch", "process"]
      }
    }
    ```
  </Tab>
  <Tab title="Thực thi shell khi các công cụ hệ thống tệp bị vô hiệu hóa">
    ```json
    {
      "tools": {
        "allow": ["read", "exec", "process"],
        "deny": ["write", "edit", "apply_patch", "browser", "gateway"]
      }
    }
    ```

    <Warning>
    Chính sách này vô hiệu hóa các công cụ hệ thống tệp của OpenClaw, nhưng `exec` vẫn là một shell và có thể ghi tệp ở bất kỳ nơi nào mà hệ thống tệp của máy chủ hoặc sandbox đã chọn cho phép. Đối với agent chỉ đọc, hãy từ chối `exec` và `process`, hoặc kết hợp quyền truy cập shell với các biện pháp kiểm soát hệ thống tệp của sandbox như `agents.defaults.sandbox.workspaceAccess: "ro"` hoặc `"none"`.
    </Warning>

  </Tab>
  <Tab title="Chỉ giao tiếp">
    ```json
    {
      "tools": {
        "sessions": { "visibility": "tree" },
        "allow": ["sessions_list", "sessions_send", "sessions_history", "session_status"],
        "deny": ["exec", "write", "edit", "apply_patch", "read", "browser"]
      }
    }
    ```

    `sessions_history` trong hồ sơ này vẫn trả về chế độ xem truy hồi đã được làm sạch và giới hạn, thay vì kết xuất bản ghi hội thoại thô. Chức năng truy hồi của trợ lý loại bỏ các thẻ suy luận, cấu trúc khung `<relevant-memories>`, tải trọng XML dạng văn bản thuần của lệnh gọi công cụ (bao gồm `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` và các khối lệnh gọi công cụ bị cắt ngắn), cấu trúc khung lệnh gọi công cụ bị hạ cấp, các token điều khiển mô hình ASCII/toàn chiều rộng bị rò rỉ và XML lệnh gọi công cụ MiniMax không đúng định dạng trước khi che thông tin/cắt ngắn.

  </Tab>
</Tabs>

---

## Lỗi thường gặp: "non-main"

<Warning>
`agents.defaults.sandbox.mode: "non-main"` kiểm tra khóa phiên dựa trên khóa phiên chính (luôn là `"main"`; người dùng không thể cấu hình `session.mainKey`, đồng thời OpenClaw sẽ cảnh báo và bỏ qua mọi giá trị khác), chứ không phải mã định danh agent. Các phiên nhóm/kênh luôn có khóa riêng, vì vậy chúng được coi là không phải phiên chính và sẽ chạy trong sandbox. Nếu muốn một agent không bao giờ chạy trong sandbox, hãy đặt `agents.list[].sandbox.mode: "off"`.
</Warning>

---

## Kiểm thử

Sau khi cấu hình sandbox và công cụ cho nhiều agent:

<Steps>
  <Step title="Kiểm tra việc phân giải agent">
    ```bash
    openclaw agents list --bindings
    ```
  </Step>
  <Step title="Xác minh các container sandbox">
    ```bash
    docker ps --filter "name=openclaw-sbx-"
    ```
  </Step>
  <Step title="Kiểm thử các hạn chế công cụ">
    - Gửi một tin nhắn yêu cầu các công cụ bị hạn chế.
    - Xác minh rằng agent không thể sử dụng các công cụ bị từ chối.

  </Step>
  <Step title="Theo dõi nhật ký">
    ```bash
    openclaw logs --follow | grep -E "routing|sandbox|tools"
    ```
  </Step>
</Steps>

---

## Khắc phục sự cố

<AccordionGroup>
  <Accordion title="Agent không chạy trong sandbox dù đã đặt `mode: 'all'`">
    - Kiểm tra xem có `agents.defaults.sandbox.mode` toàn cục ghi đè thiết lập này hay không.
    - Cấu hình riêng cho agent được ưu tiên, vì vậy hãy đặt `agents.list[].sandbox.mode: "all"`.

  </Accordion>
  <Accordion title="Các công cụ vẫn khả dụng dù có trong danh sách từ chối">
    - Kiểm tra [toàn bộ thứ tự lọc](#tool-restrictions): hồ sơ → hồ sơ nhà cung cấp → chính sách toàn cục → chính sách nhà cung cấp → chính sách tác tử → chính sách nhà cung cấp của tác tử → sandbox → tác tử con.
    - Mỗi cấp chỉ có thể hạn chế thêm, không thể cấp lại quyền.
    - Xem [Sandbox so với chính sách công cụ và chế độ đặc quyền](/vi/gateway/sandbox-vs-tool-policy-vs-elevated) để gỡ lỗi từng bước.

  </Accordion>
  <Accordion title="Vùng chứa không được cô lập theo từng tác tử">
    - `scope` mặc định là `"agent"` (mỗi mã định danh tác tử có một vùng chứa).
    - Đặt `scope: "session"` để mỗi phiên có một vùng chứa, hoặc `scope: "shared"` để dùng lại một vùng chứa cho nhiều tác tử.

  </Accordion>
</AccordionGroup>

---

## Liên quan

- [Chế độ đặc quyền](/vi/tools/elevated)
- [Định tuyến đa tác tử](/vi/concepts/multi-agent)
- [Cấu hình sandbox](/vi/gateway/config-agents#agentsdefaultssandbox)
- [Sandbox so với chính sách công cụ và chế độ đặc quyền](/vi/gateway/sandbox-vs-tool-policy-vs-elevated) — gỡ lỗi "tại sao thao tác này bị chặn?"
- [Cơ chế sandbox](/vi/gateway/sandboxing) — tài liệu tham khảo đầy đủ về sandbox (chế độ, phạm vi, phần phụ trợ, ảnh)
- [Quản lý phiên](/vi/concepts/session)
