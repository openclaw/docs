---
read_when: You want per-agent sandboxing or per-agent tool allow/deny policies in a multi-agent gateway.
sidebarTitle: Multi-agent sandbox and tools
status: active
summary: Sandbox theo từng tác nhân + hạn chế công cụ, thứ tự ưu tiên và ví dụ
title: Môi trường cách ly và công cụ đa tác tử
x-i18n:
    generated_at: "2026-04-29T23:19:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: eedb36301f670bcd8956dbeb81788acfc96627e39401e34434c2348fcb10f155
    source_path: tools/multi-agent-sandbox-tools.md
    workflow: 16
---

Mỗi tác nhân trong một thiết lập đa tác nhân có thể ghi đè chính sách hộp cát và công cụ toàn cục. Trang này trình bày cấu hình theo từng tác nhân, quy tắc ưu tiên và ví dụ.

<CardGroup cols={3}>
  <Card title="Cơ chế hộp cát" href="/vi/gateway/sandboxing">
    Phần phụ trợ và chế độ — tài liệu tham khảo đầy đủ về hộp cát.
  </Card>
  <Card title="Hộp cát so với chính sách công cụ so với nâng quyền" href="/vi/gateway/sandbox-vs-tool-policy-vs-elevated">
    Gỡ lỗi "tại sao việc này bị chặn?"
  </Card>
  <Card title="Chế độ nâng quyền" href="/vi/tools/elevated">
    Thực thi nâng quyền cho người gửi đáng tin cậy.
  </Card>
</CardGroup>

<Warning>
Xác thực được giới hạn theo tác nhân: mỗi tác nhân có kho xác thực `agentDir` riêng tại `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`. Không bao giờ dùng lại `agentDir` giữa các tác nhân. Tác nhân có thể đọc xuyên tới hồ sơ xác thực của tác nhân mặc định/chính khi chúng không có hồ sơ cục bộ, nhưng mã làm mới OAuth không được sao chép vào kho của tác nhân phụ. Nếu bạn sao chép thông tin xác thực theo cách thủ công, chỉ sao chép các hồ sơ `api_key` hoặc `token` tĩnh có thể di chuyển.
</Warning>

---

## Ví dụ cấu hình

<AccordionGroup>
  <Accordion title="Ví dụ 1: Tác nhân cá nhân + tác nhân gia đình bị hạn chế">
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
              "allow": ["read"],
              "deny": ["exec", "write", "edit", "apply_patch", "process", "browser"]
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

    - Tác nhân `main`: chạy trên máy chủ, có quyền truy cập đầy đủ vào công cụ.
    - Tác nhân `family`: chạy trong Docker (một vùng chứa cho mỗi tác nhân), chỉ có công cụ `read`.

  </Accordion>
  <Accordion title="Ví dụ 2: Tác nhân công việc với hộp cát dùng chung">
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
  <Accordion title="Ví dụ 2b: Hồ sơ lập trình toàn cục + tác nhân chỉ nhắn tin">
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

    - Các tác nhân mặc định nhận công cụ lập trình.
    - Tác nhân `support` chỉ dành cho nhắn tin (+ công cụ Slack).

  </Accordion>
  <Accordion title="Ví dụ 3: Các chế độ hộp cát khác nhau theo từng tác nhân">
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

Khi cả cấu hình toàn cục (`agents.defaults.*`) và cấu hình riêng cho tác nhân (`agents.list[].*`) đều tồn tại:

### Cấu hình hộp cát

Các thiết lập riêng cho tác nhân ghi đè thiết lập toàn cục:

```
agents.list[].sandbox.mode > agents.defaults.sandbox.mode
agents.list[].sandbox.scope > agents.defaults.sandbox.scope
agents.list[].sandbox.workspaceRoot > agents.defaults.sandbox.workspaceRoot
agents.list[].sandbox.workspaceAccess > agents.defaults.sandbox.workspaceAccess
agents.list[].sandbox.docker.* > agents.defaults.sandbox.docker.*
agents.list[].sandbox.browser.* > agents.defaults.sandbox.browser.*
agents.list[].sandbox.prune.* > agents.defaults.sandbox.prune.*
```

<Note>
`agents.list[].sandbox.{docker,browser,prune}.*` ghi đè `agents.defaults.sandbox.{docker,browser,prune}.*` cho tác nhân đó (bị bỏ qua khi phạm vi hộp cát phân giải thành `"shared"`).
</Note>

### Hạn chế công cụ

Thứ tự lọc là:

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
  <Step title="Chính sách công cụ riêng cho tác nhân">
    `agents.list[].tools.allow/deny`.
  </Step>
  <Step title="Chính sách nhà cung cấp của tác nhân">
    `agents.list[].tools.byProvider[provider].allow/deny`.
  </Step>
  <Step title="Chính sách công cụ hộp cát">
    `tools.sandbox.tools` hoặc `agents.list[].tools.sandbox.tools`.
  </Step>
  <Step title="Chính sách công cụ của tác nhân con">
    `tools.subagents.tools`, nếu áp dụng.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Quy tắc ưu tiên">
    - Mỗi cấp có thể tiếp tục hạn chế công cụ, nhưng không thể cấp lại các công cụ đã bị từ chối ở cấp trước.
    - Nếu `agents.list[].tools.sandbox.tools` được đặt, nó thay thế `tools.sandbox.tools` cho tác nhân đó.
    - Nếu `agents.list[].tools.profile` được đặt, nó ghi đè `tools.profile` cho tác nhân đó.
    - Khóa công cụ của nhà cung cấp chấp nhận `provider` (ví dụ `google-antigravity`) hoặc `provider/model` (ví dụ `openai/gpt-5.4`).

  </Accordion>
  <Accordion title="Hành vi danh sách cho phép trống">
    Nếu bất kỳ danh sách cho phép tường minh nào trong chuỗi đó khiến lần chạy không còn công cụ nào có thể gọi, OpenClaw sẽ dừng trước khi gửi lời nhắc tới mô hình. Đây là chủ ý: một tác nhân được cấu hình với công cụ còn thiếu như `agents.list[].tools.allow: ["query_db"]` phải thất bại rõ ràng cho đến khi Plugin đăng ký `query_db` được bật, thay vì tiếp tục như một tác nhân chỉ văn bản.
  </Accordion>
</AccordionGroup>

Chính sách công cụ hỗ trợ các dạng viết tắt `group:*` mở rộng thành nhiều công cụ. Xem [Nhóm công cụ](/vi/gateway/sandbox-vs-tool-policy-vs-elevated#tool-groups-shorthands) để biết danh sách đầy đủ.

Các ghi đè nâng quyền theo từng tác nhân (`agents.list[].tools.elevated`) có thể hạn chế thêm thực thi nâng quyền cho các tác nhân cụ thể. Xem [Chế độ nâng quyền](/vi/tools/elevated) để biết chi tiết.

---

## Di chuyển từ tác nhân đơn

<Tabs>
  <Tab title="Trước (tác nhân đơn)">
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
  <Tab title="Sau (đa tác nhân)">
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
Các cấu hình `agent.*` cũ được di chuyển bởi `openclaw doctor`; từ nay trở đi nên dùng `agents.defaults` + `agents.list`.
</Note>

---

## Ví dụ hạn chế công cụ

<Tabs>
  <Tab title="Tác nhân chỉ đọc">
    ```json
    {
      "tools": {
        "allow": ["read"],
        "deny": ["exec", "write", "edit", "apply_patch", "process"]
      }
    }
    ```
  </Tab>
  <Tab title="Thực thi an toàn (không sửa đổi tệp)">
    ```json
    {
      "tools": {
        "allow": ["read", "exec", "process"],
        "deny": ["write", "edit", "apply_patch", "browser", "gateway"]
      }
    }
    ```
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

    `sessions_history` trong hồ sơ này vẫn trả về một khung xem truy hồi có giới hạn và đã được làm sạch, thay vì bản đổ bản ghi thô. Truy hồi của trợ lý loại bỏ các thẻ suy luận, khung dựng `<relevant-memories>`, nội dung XML gọi công cụ dạng văn bản thuần (bao gồm `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>`, và các khối gọi công cụ bị cắt ngắn), khung gọi công cụ bị hạ cấp, mã thông báo điều khiển mô hình dạng ASCII/toàn chiều rộng bị rò rỉ, và XML gọi công cụ MiniMax sai định dạng trước khi ẩn bớt/cắt ngắn.

  </Tab>
</Tabs>

---

## Lỗi thường gặp: "non-main"

<Warning>
`agents.defaults.sandbox.mode: "non-main"` dựa trên `session.mainKey` (mặc định `"main"`), không phải id của tác nhân. Các phiên nhóm/kênh luôn nhận khóa riêng, nên chúng được coi là không phải main và sẽ được chạy trong hộp cát. Nếu bạn muốn một tác nhân không bao giờ chạy trong hộp cát, hãy đặt `agents.list[].sandbox.mode: "off"`.
</Warning>

---

## Kiểm thử

Sau khi cấu hình hộp cát và công cụ đa tác nhân:

<Steps>
  <Step title="Kiểm tra cách phân giải tác nhân">
    ```bash
    openclaw agents list --bindings
    ```
  </Step>
  <Step title="Xác minh các vùng chứa hộp cát">
    ```bash
    docker ps --filter "name=openclaw-sbx-"
    ```
  </Step>
  <Step title="Kiểm thử hạn chế công cụ">
    - Gửi một tin nhắn yêu cầu các công cụ bị hạn chế.
    - Xác minh tác nhân không thể dùng các công cụ bị từ chối.

  </Step>
  <Step title="Theo dõi nhật ký">
    ```bash
    tail -f "${OPENCLAW_STATE_DIR:-$HOME/.openclaw}/logs/gateway.log" | grep -E "routing|sandbox|tools"
    ```
  </Step>
</Steps>

---

## Khắc phục sự cố

<AccordionGroup>
  <Accordion title="Tác nhân không được chạy trong hộp cát dù có `mode: 'all'`">
    - Kiểm tra liệu có `agents.defaults.sandbox.mode` toàn cục ghi đè nó hay không.
    - Cấu hình riêng cho tác nhân có độ ưu tiên cao hơn, nên hãy đặt `agents.list[].sandbox.mode: "all"`.

  </Accordion>
  <Accordion title="Công cụ vẫn khả dụng dù có danh sách từ chối">
    - Kiểm tra thứ tự lọc công cụ: toàn cục → tác nhân → hộp cát → tác nhân con.
    - Mỗi cấp chỉ có thể hạn chế thêm, không thể cấp lại.
    - Xác minh bằng nhật ký: `[tools] filtering tools for agent:${agentId}`.

  </Accordion>
  <Accordion title="Vùng chứa không được cô lập theo từng tác nhân">
    - Đặt `scope: "agent"` trong cấu hình hộp cát riêng cho tác nhân.
    - Mặc định là `"session"`, tạo một vùng chứa cho mỗi phiên.

  </Accordion>
</AccordionGroup>

---

## Liên quan

- [Chế độ nâng quyền](/vi/tools/elevated)
- [Định tuyến đa tác nhân](/vi/concepts/multi-agent)
- [Cấu hình hộp cát](/vi/gateway/config-agents#agentsdefaultssandbox)
- [Hộp cát so với chính sách công cụ so với nâng quyền](/vi/gateway/sandbox-vs-tool-policy-vs-elevated) — gỡ lỗi "tại sao việc này bị chặn?"
- [Cơ chế hộp cát](/vi/gateway/sandboxing) — tài liệu tham khảo đầy đủ về hộp cát (chế độ, phạm vi, phần phụ trợ, ảnh)
- [Quản lý phiên](/vi/concepts/session)
