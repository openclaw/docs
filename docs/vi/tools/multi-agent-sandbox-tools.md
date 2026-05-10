---
read_when: You want per-agent sandboxing or per-agent tool allow/deny policies in a multi-agent gateway.
sidebarTitle: Multi-agent sandbox and tools
status: active
summary: Môi trường cách ly theo từng tác nhân + hạn chế công cụ, thứ tự ưu tiên và ví dụ
title: Môi trường cách ly và công cụ đa tác nhân
x-i18n:
    generated_at: "2026-05-10T19:54:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: c988613438f2d179b859902d3f7a39a1e29b60a0e2ae6ed598bb5f5881cf0b9f
    source_path: tools/multi-agent-sandbox-tools.md
    workflow: 16
---

Mỗi tác nhân trong thiết lập đa tác nhân có thể ghi đè sandbox toàn cục và chính sách công cụ. Trang này trình bày cấu hình theo từng tác nhân, quy tắc ưu tiên và ví dụ.

<CardGroup cols={3}>
  <Card title="Sandbox" href="/vi/gateway/sandboxing">
    Backend và chế độ — tài liệu tham chiếu đầy đủ về sandbox.
  </Card>
  <Card title="Sandbox so với chính sách công cụ so với nâng quyền" href="/vi/gateway/sandbox-vs-tool-policy-vs-elevated">
    Gỡ lỗi "tại sao thao tác này bị chặn?"
  </Card>
  <Card title="Chế độ nâng quyền" href="/vi/tools/elevated">
    Exec nâng quyền cho người gửi đáng tin cậy.
  </Card>
</CardGroup>

<Warning>
Xác thực được giới hạn theo tác nhân: mỗi tác nhân có kho xác thực `agentDir` riêng tại `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`. Không bao giờ dùng lại `agentDir` giữa các tác nhân. Tác nhân có thể đọc xuyên qua hồ sơ xác thực của tác nhân mặc định/chính khi chúng không có hồ sơ cục bộ, nhưng token làm mới OAuth không được sao chép vào kho tác nhân phụ. Nếu bạn sao chép thông tin xác thực thủ công, chỉ sao chép các hồ sơ `api_key` hoặc `token` tĩnh có thể di chuyển.
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

    - Tác nhân `main`: chạy trên host, quyền truy cập công cụ đầy đủ.
    - Tác nhân `family`: chạy trong Docker (một container cho mỗi tác nhân), chỉ có công cụ `read`.

  </Accordion>
  <Accordion title="Ví dụ 2: Tác nhân công việc với sandbox dùng chung">
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

    - các tác nhân mặc định nhận công cụ lập trình.
    - tác nhân `support` chỉ dùng cho nhắn tin (+ công cụ Slack).

  </Accordion>
  <Accordion title="Ví dụ 3: Các chế độ sandbox khác nhau theo từng tác nhân">
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

Khi tồn tại cả cấu hình toàn cục (`agents.defaults.*`) và cấu hình riêng cho tác nhân (`agents.list[].*`):

### Cấu hình sandbox

Thiết lập riêng cho tác nhân ghi đè toàn cục:

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
`agents.list[].sandbox.{docker,browser,prune}.*` ghi đè `agents.defaults.sandbox.{docker,browser,prune}.*` cho tác nhân đó (bị bỏ qua khi phạm vi sandbox phân giải thành `"shared"`).
</Note>

### Hạn chế công cụ

Thứ tự lọc là:

<Steps>
  <Step title="Hồ sơ công cụ">
    `tools.profile` hoặc `agents.list[].tools.profile`.
  </Step>
  <Step title="Hồ sơ công cụ theo provider">
    `tools.byProvider[provider].profile` hoặc `agents.list[].tools.byProvider[provider].profile`.
  </Step>
  <Step title="Chính sách công cụ toàn cục">
    `tools.allow` / `tools.deny`.
  </Step>
  <Step title="Chính sách công cụ theo provider">
    `tools.byProvider[provider].allow/deny`.
  </Step>
  <Step title="Chính sách công cụ riêng cho tác nhân">
    `agents.list[].tools.allow/deny`.
  </Step>
  <Step title="Chính sách provider của tác nhân">
    `agents.list[].tools.byProvider[provider].allow/deny`.
  </Step>
  <Step title="Chính sách công cụ sandbox">
    `tools.sandbox.tools` hoặc `agents.list[].tools.sandbox.tools`.
  </Step>
  <Step title="Chính sách công cụ tác nhân con">
    `tools.subagents.tools`, nếu áp dụng.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Quy tắc ưu tiên">
    - Mỗi cấp có thể hạn chế công cụ thêm, nhưng không thể cấp lại các công cụ đã bị từ chối ở cấp trước.
    - Nếu `agents.list[].tools.sandbox.tools` được đặt, nó thay thế `tools.sandbox.tools` cho tác nhân đó.
    - Nếu `agents.list[].tools.profile` được đặt, nó ghi đè `tools.profile` cho tác nhân đó.
    - Khóa công cụ theo provider chấp nhận `provider` (ví dụ `google-antigravity`) hoặc `provider/model` (ví dụ `openai/gpt-5.4`).

  </Accordion>
  <Accordion title="Hành vi allowlist rỗng">
    Nếu bất kỳ allowlist tường minh nào trong chuỗi đó khiến lượt chạy không còn công cụ nào có thể gọi, OpenClaw dừng trước khi gửi prompt tới mô hình. Điều này là có chủ ý: một tác nhân được cấu hình với công cụ bị thiếu như `agents.list[].tools.allow: ["query_db"]` nên thất bại rõ ràng cho đến khi Plugin đăng ký `query_db` được bật, thay vì tiếp tục như một tác nhân chỉ văn bản.
  </Accordion>
</AccordionGroup>

Chính sách công cụ hỗ trợ dạng viết tắt `group:*` mở rộng thành nhiều công cụ. Xem [Nhóm công cụ](/vi/gateway/sandbox-vs-tool-policy-vs-elevated#tool-groups-shorthands) để biết danh sách đầy đủ.

Ghi đè nâng quyền theo từng tác nhân (`agents.list[].tools.elevated`) có thể hạn chế thêm exec nâng quyền cho các tác nhân cụ thể. Xem [Chế độ nâng quyền](/vi/tools/elevated) để biết chi tiết.

---

## Di chuyển từ một tác nhân

<Tabs>
  <Tab title="Trước (một tác nhân)">
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
Các cấu hình `agent.*` cũ được di chuyển bởi `openclaw doctor`; từ nay nên dùng `agents.defaults` + `agents.list`.
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
  <Tab title="Thực thi shell với công cụ hệ thống tệp bị tắt">
    ```json
    {
      "tools": {
        "allow": ["read", "exec", "process"],
        "deny": ["write", "edit", "apply_patch", "browser", "gateway"]
      }
    }
    ```

    <Warning>
    Chính sách này tắt các công cụ hệ thống tệp của OpenClaw, nhưng `exec` vẫn là shell và có thể ghi tệp ở bất cứ nơi nào hệ thống tệp của host hoặc sandbox đã chọn cho phép. Với tác nhân chỉ đọc, hãy từ chối `exec` và `process`, hoặc kết hợp quyền truy cập shell với các kiểm soát hệ thống tệp sandbox như `agents.defaults.sandbox.workspaceAccess: "ro"` hoặc `"none"`.
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

    `sessions_history` trong hồ sơ này vẫn trả về chế độ xem hồi tưởng có giới hạn và đã được làm sạch, thay vì bản dump transcript thô. Hồi tưởng của trợ lý loại bỏ thẻ suy nghĩ, khung `<relevant-memories>`, payload XML lệnh gọi công cụ dạng văn bản thuần (bao gồm `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>`, và các khối lệnh gọi công cụ bị cắt ngắn), khung lệnh gọi công cụ đã hạ cấp, token điều khiển mô hình ASCII/toàn chiều bị rò rỉ, và XML lệnh gọi công cụ MiniMax không đúng định dạng trước khi biên tập/cắt ngắn.

  </Tab>
</Tabs>

---

## Lỗi thường gặp: "non-main"

<Warning>
`agents.defaults.sandbox.mode: "non-main"` dựa trên `session.mainKey` (mặc định `"main"`), không phải id tác nhân. Các phiên nhóm/kênh luôn có khóa riêng, vì vậy chúng được xem là không phải chính và sẽ bị sandbox. Nếu bạn muốn một tác nhân không bao giờ bị sandbox, hãy đặt `agents.list[].sandbox.mode: "off"`.
</Warning>

---

## Kiểm thử

Sau khi cấu hình sandbox và công cụ đa tác nhân:

<Steps>
  <Step title="Kiểm tra phân giải tác nhân">
    ```bash
    openclaw agents list --bindings
    ```
  </Step>
  <Step title="Xác minh container sandbox">
    ```bash
    docker ps --filter "name=openclaw-sbx-"
    ```
  </Step>
  <Step title="Kiểm thử hạn chế công cụ">
    - Gửi một tin nhắn yêu cầu các công cụ bị hạn chế.
    - Xác minh tác nhân không thể dùng các công cụ bị từ chối.

  </Step>
  <Step title="Theo dõi log">
    ```bash
    tail -f "${OPENCLAW_STATE_DIR:-$HOME/.openclaw}/logs/gateway.log" | grep -E "routing|sandbox|tools"
    ```
  </Step>
</Steps>

---

## Khắc phục sự cố

<AccordionGroup>
  <Accordion title="Tác nhân không bị sandbox dù có `mode: 'all'`">
    - Kiểm tra xem có `agents.defaults.sandbox.mode` toàn cục ghi đè nó không.
    - Cấu hình riêng cho tác nhân có độ ưu tiên cao hơn, vì vậy hãy đặt `agents.list[].sandbox.mode: "all"`.

  </Accordion>
  <Accordion title="Công cụ vẫn khả dụng dù có danh sách từ chối">
    - Kiểm tra thứ tự lọc công cụ: toàn cục → tác nhân → sandbox → tác nhân con.
    - Mỗi cấp chỉ có thể hạn chế thêm, không thể cấp lại.
    - Xác minh bằng log: `[tools] filtering tools for agent:${agentId}`.

  </Accordion>
  <Accordion title="Container không được cô lập theo từng tác nhân">
    - Đặt `scope: "agent"` trong cấu hình sandbox riêng cho tác nhân.
    - Mặc định là `"session"`, tạo một container cho mỗi phiên.

  </Accordion>
</AccordionGroup>

---

## Liên quan

- [Chế độ nâng quyền](/vi/tools/elevated)
- [Định tuyến đa tác nhân](/vi/concepts/multi-agent)
- [Cấu hình môi trường cách ly](/vi/gateway/config-agents#agentsdefaultssandbox)
- [Môi trường cách ly so với chính sách công cụ so với chế độ nâng quyền](/vi/gateway/sandbox-vs-tool-policy-vs-elevated) — gỡ lỗi "tại sao việc này bị chặn?"
- [Cách ly môi trường](/vi/gateway/sandboxing) — tài liệu tham chiếu đầy đủ về môi trường cách ly (chế độ, phạm vi, phần phụ trợ, hình ảnh)
- [Quản lý phiên](/vi/concepts/session)
