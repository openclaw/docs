---
read_when: You want per-agent sandboxing or per-agent tool allow/deny policies in a multi-agent gateway.
sidebarTitle: Multi-agent sandbox and tools
status: active
summary: Sandbox + hạn chế công cụ theo từng tác nhân, thứ tự ưu tiên và ví dụ
title: Môi trường cách ly và công cụ đa tác nhân
x-i18n:
    generated_at: "2026-05-11T20:37:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8d11af55e30996a89e665b258604108a93f4c4271fbe4edfd1caf54864e40f01
    source_path: tools/multi-agent-sandbox-tools.md
    workflow: 16
---

Mỗi agent trong một thiết lập đa agent có thể ghi đè sandbox và chính sách công cụ toàn cục. Trang này trình bày cấu hình theo từng agent, quy tắc ưu tiên và ví dụ.

<CardGroup cols={3}>
  <Card title="Sandboxing" href="/vi/gateway/sandboxing">
    Backend và chế độ — tài liệu tham chiếu đầy đủ về sandbox.
  </Card>
  <Card title="Sandbox vs tool policy vs elevated" href="/vi/gateway/sandbox-vs-tool-policy-vs-elevated">
    Gỡ lỗi "tại sao nội dung này bị chặn?"
  </Card>
  <Card title="Elevated mode" href="/vi/tools/elevated">
    Exec nâng quyền cho người gửi đáng tin cậy.
  </Card>
</CardGroup>

<Warning>
Xác thực được giới hạn theo agent: mỗi agent có kho xác thực `agentDir` riêng tại `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`. Không bao giờ dùng lại `agentDir` giữa các agent. Agent có thể đọc xuyên tới hồ sơ xác thực của agent mặc định/chính khi chúng không có hồ sơ cục bộ, nhưng token làm mới OAuth không được sao chép vào kho agent phụ. Nếu bạn sao chép thông tin xác thực thủ công, chỉ sao chép các hồ sơ `api_key` hoặc `token` tĩnh có tính di động.
</Warning>

---

## Ví dụ cấu hình

<AccordionGroup>
  <Accordion title="Example 1: Personal + restricted family agent">
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
    - Agent `family`: chạy trong Docker (một container cho mỗi agent), chỉ có `read` và gửi tin nhắn trong cuộc trò chuyện hiện tại.

  </Accordion>
  <Accordion title="Example 2: Work agent with shared sandbox">
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
  <Accordion title="Example 2b: Global coding profile + messaging-only agent">
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

    - agent mặc định nhận các công cụ lập trình.
    - agent `support` chỉ dành cho nhắn tin (+ công cụ Slack).

  </Accordion>
  <Accordion title="Example 3: Different sandbox modes per agent">
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

Khi cả cấu hình toàn cục (`agents.defaults.*`) và cấu hình riêng cho agent (`agents.list[].*`) cùng tồn tại:

### Cấu hình sandbox

Thiết lập riêng cho agent ghi đè thiết lập toàn cục:

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
`agents.list[].sandbox.{docker,browser,prune}.*` ghi đè `agents.defaults.sandbox.{docker,browser,prune}.*` cho agent đó (bị bỏ qua khi phạm vi sandbox được phân giải thành `"shared"`).
</Note>

### Hạn chế công cụ

Thứ tự lọc là:

<Steps>
  <Step title="Tool profile">
    `tools.profile` hoặc `agents.list[].tools.profile`.
  </Step>
  <Step title="Provider tool profile">
    `tools.byProvider[provider].profile` hoặc `agents.list[].tools.byProvider[provider].profile`.
  </Step>
  <Step title="Global tool policy">
    `tools.allow` / `tools.deny`.
  </Step>
  <Step title="Provider tool policy">
    `tools.byProvider[provider].allow/deny`.
  </Step>
  <Step title="Agent-specific tool policy">
    `agents.list[].tools.allow/deny`.
  </Step>
  <Step title="Agent provider policy">
    `agents.list[].tools.byProvider[provider].allow/deny`.
  </Step>
  <Step title="Sandbox tool policy">
    `tools.sandbox.tools` hoặc `agents.list[].tools.sandbox.tools`.
  </Step>
  <Step title="Subagent tool policy">
    `tools.subagents.tools`, nếu áp dụng.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Precedence rules">
    - Mỗi cấp có thể hạn chế thêm công cụ, nhưng không thể cấp lại các công cụ đã bị từ chối ở các cấp trước.
    - Nếu `agents.list[].tools.sandbox.tools` được đặt, nó sẽ thay thế `tools.sandbox.tools` cho agent đó.
    - Nếu `agents.list[].tools.profile` được đặt, nó sẽ ghi đè `tools.profile` cho agent đó.
    - Khóa công cụ của provider chấp nhận `provider` (ví dụ `google-antigravity`) hoặc `provider/model` (ví dụ `openai/gpt-5.4`).

  </Accordion>
  <Accordion title="Empty allowlist behavior">
    Nếu bất kỳ allowlist rõ ràng nào trong chuỗi đó khiến lượt chạy không còn công cụ nào có thể gọi, OpenClaw sẽ dừng trước khi gửi prompt cho model. Đây là hành vi có chủ đích: một agent được cấu hình với công cụ bị thiếu như `agents.list[].tools.allow: ["query_db"]` nên thất bại rõ ràng cho đến khi Plugin đăng ký `query_db` được bật, thay vì tiếp tục như một agent chỉ dùng văn bản.
  </Accordion>
</AccordionGroup>

Chính sách công cụ hỗ trợ các dạng viết tắt `group:*` mở rộng thành nhiều công cụ. Xem [Nhóm công cụ](/vi/gateway/sandbox-vs-tool-policy-vs-elevated#tool-groups-shorthands) để biết danh sách đầy đủ.

Ghi đè nâng quyền theo từng agent (`agents.list[].tools.elevated`) có thể hạn chế thêm exec nâng quyền cho các agent cụ thể. Xem [Chế độ nâng quyền](/vi/tools/elevated) để biết chi tiết.

---

## Di chuyển từ một tác tử

<Tabs>
  <Tab title="Trước (một tác tử)">
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
  <Tab title="Sau (đa tác tử)">
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
Các cấu hình `agent.*` cũ được di chuyển bằng `openclaw doctor`; từ nay nên dùng `agents.defaults` + `agents.list`.
</Note>

---

## Ví dụ về hạn chế công cụ

<Tabs>
  <Tab title="Tác tử chỉ đọc">
    ```json
    {
      "tools": {
        "allow": ["read"],
        "deny": ["exec", "write", "edit", "apply_patch", "process"]
      }
    }
    ```
  </Tab>
  <Tab title="Thực thi shell khi công cụ hệ thống tệp bị tắt">
    ```json
    {
      "tools": {
        "allow": ["read", "exec", "process"],
        "deny": ["write", "edit", "apply_patch", "browser", "gateway"]
      }
    }
    ```

    <Warning>
    Chính sách này tắt các công cụ hệ thống tệp của OpenClaw, nhưng `exec` vẫn là một shell và có thể ghi tệp ở bất cứ nơi nào máy chủ đã chọn hoặc hệ thống tệp sandbox cho phép. Với tác tử chỉ đọc, hãy từ chối `exec` và `process`, hoặc kết hợp quyền truy cập shell với các kiểm soát hệ thống tệp sandbox như `agents.defaults.sandbox.workspaceAccess: "ro"` hoặc `"none"`.
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

    `sessions_history` trong hồ sơ này vẫn trả về một chế độ xem nhớ lại có giới hạn và đã được làm sạch, thay vì bản đổ transcript thô. Việc nhớ lại của trợ lý loại bỏ các thẻ suy nghĩ, khung `<relevant-memories>`, payload XML gọi công cụ dạng văn bản thuần (bao gồm `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>`, và các khối gọi công cụ đã bị cắt ngắn), khung gọi công cụ bị hạ cấp, token điều khiển mô hình ASCII/toàn chiều rộng bị rò rỉ, và XML gọi công cụ MiniMax sai định dạng trước khi biên tập/cắt ngắn.

  </Tab>
</Tabs>

---

## Lỗi thường gặp: "non-main"

<Warning>
`agents.defaults.sandbox.mode: "non-main"` dựa trên `session.mainKey` (mặc định `"main"`), không phải id của tác tử. Các phiên nhóm/kênh luôn nhận khóa riêng, nên chúng được xem là non-main và sẽ bị sandbox. Nếu bạn muốn một tác tử không bao giờ bị sandbox, hãy đặt `agents.list[].sandbox.mode: "off"`.
</Warning>

---

## Kiểm thử

Sau khi cấu hình sandbox và công cụ đa tác tử:

<Steps>
  <Step title="Kiểm tra phân giải tác tử">
    ```bash
    openclaw agents list --bindings
    ```
  </Step>
  <Step title="Xác minh container sandbox">
    ```bash
    docker ps --filter "name=openclaw-sbx-"
    ```
  </Step>
  <Step title="Kiểm tra hạn chế công cụ">
    - Gửi một tin nhắn yêu cầu các công cụ bị hạn chế.
    - Xác minh tác tử không thể dùng các công cụ bị từ chối.

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
  <Accordion title="Tác tử không bị sandbox dù có `mode: 'all'`">
    - Kiểm tra xem có `agents.defaults.sandbox.mode` toàn cục ghi đè nó không.
    - Cấu hình riêng của tác tử được ưu tiên, nên hãy đặt `agents.list[].sandbox.mode: "all"`.

  </Accordion>
  <Accordion title="Công cụ vẫn khả dụng dù có danh sách từ chối">
    - Kiểm tra thứ tự lọc công cụ: toàn cục → tác tử → sandbox → tác tử con.
    - Mỗi cấp chỉ có thể hạn chế thêm, không thể cấp lại.
    - Xác minh bằng log: `[tools] filtering tools for agent:${agentId}`.

  </Accordion>
  <Accordion title="Container không được cô lập theo từng tác tử">
    - Đặt `scope: "agent"` trong cấu hình sandbox riêng của tác tử.
    - Mặc định là `"session"`, tạo một container cho mỗi phiên.

  </Accordion>
</AccordionGroup>

---

## Liên quan

- [Chế độ nâng quyền](/vi/tools/elevated)
- [Định tuyến đa tác nhân](/vi/concepts/multi-agent)
- [Cấu hình hộp cát](/vi/gateway/config-agents#agentsdefaultssandbox)
- [Hộp cát so với chính sách công cụ so với nâng quyền](/vi/gateway/sandbox-vs-tool-policy-vs-elevated) — gỡ lỗi "tại sao điều này bị chặn?"
- [Cơ chế hộp cát](/vi/gateway/sandboxing) — tài liệu tham chiếu đầy đủ về hộp cát (chế độ, phạm vi, phần phụ trợ, ảnh)
- [Quản lý phiên](/vi/concepts/session)
