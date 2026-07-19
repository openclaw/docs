---
read_when: You hit 'sandbox jail' or see a tool/elevated refusal and want the exact config key to change.
status: active
summary: 'Tại sao một công cụ bị chặn: môi trường chạy sandbox, chính sách cho phép/từ chối công cụ và các cổng kiểm soát thực thi nâng quyền'
title: Sandbox so với chính sách công cụ so với quyền nâng cao
x-i18n:
    generated_at: "2026-07-19T05:45:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 572157b184c48f0ac7f97d3151726f8975b16306261c7209c39c2fdd344efef9
    source_path: gateway/sandbox-vs-tool-policy-vs-elevated.md
    workflow: 16
---

OpenClaw có ba cơ chế kiểm soát có liên quan nhưng khác nhau:

1. **Sandbox** (`agents.defaults.sandbox.*` / `agents.list[].sandbox.*`) quyết định **các công cụ chạy ở đâu** (backend sandbox hay máy chủ).
2. **Chính sách công cụ** (`tools.*`, `tools.sandbox.tools.*`, `agents.list[].tools.*`) quyết định **những công cụ nào khả dụng/được phép**.
3. **Đặc quyền nâng cao** (`tools.elevated.*`, `agents.list[].tools.elevated.*`) là một **lối thoát chỉ dành cho exec** để chạy bên ngoài sandbox khi bạn đang ở trong sandbox (mặc định là `gateway`, hoặc `node` khi đích exec được cấu hình thành `node`).

## Gỡ lỗi nhanh

Sử dụng trình kiểm tra để xem OpenClaw _thực sự_ đang làm gì:

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

Lệnh này in ra:

- chế độ/phạm vi sandbox và quyền truy cập không gian làm việc có hiệu lực
- phiên hiện có đang ở trong sandbox hay không (main so với không phải main)
- quy tắc cho phép/từ chối công cụ trong sandbox có hiệu lực (và quy tắc đó đến từ agent/toàn cục/mặc định)
- các cổng kiểm soát đặc quyền nâng cao và đường dẫn khóa cần sửa

## Sandbox: nơi các công cụ chạy

Sandbox được kiểm soát bởi `agents.defaults.sandbox.mode`:

- `"off"`: mọi thứ chạy trên máy chủ.
- `"non-main"`: chỉ các phiên không phải main mới ở trong sandbox (một điều thường gây "bất ngờ" với nhóm/kênh).
- `"all"`: mọi thứ đều ở trong sandbox.

`agents.defaults.sandbox.workspaceAccess` kiểm soát những gì sandbox có thể thấy: `"none"`, `"ro"` hoặc `"rw"`.

Xem [Sandbox](/vi/gateway/sandboxing) để biết ma trận đầy đủ (phạm vi, các điểm gắn kết không gian làm việc, image).

### Gắn kết bind (kiểm tra bảo mật nhanh)

- `docker.binds` _xuyên qua_ hệ thống tệp sandbox: mọi thứ bạn gắn kết đều hiển thị bên trong container với chế độ bạn đặt (`:ro` hoặc `:rw`).
- Mặc định là đọc-ghi nếu bạn bỏ qua chế độ; ưu tiên `:ro` cho mã nguồn/thông tin bí mật.
- `scope: "shared"` bỏ qua các bind riêng của từng agent (chỉ áp dụng các bind toàn cục).
- OpenClaw xác thực nguồn bind hai lần: đầu tiên trên đường dẫn nguồn đã chuẩn hóa, sau đó xác thực lại sau khi phân giải qua tổ tiên tồn tại sâu nhất. Việc thoát qua thư mục cha là liên kết tượng trưng không thể vượt qua các bước kiểm tra đường dẫn bị chặn hoặc gốc được phép.
- Các đường dẫn lá không tồn tại vẫn được kiểm tra an toàn. Nếu `/workspace/alias-out/new-file` phân giải qua thư mục cha là liên kết tượng trưng đến một đường dẫn bị chặn hoặc ra ngoài các gốc được cấu hình cho phép, bind sẽ bị từ chối.
- Việc bind `/var/run/docker.sock` về cơ bản trao quyền kiểm soát máy chủ cho sandbox; chỉ thực hiện việc này một cách có chủ đích.
- Quyền truy cập không gian làm việc (`workspaceAccess`) độc lập với các chế độ bind.

Để xem cấu hình riêng cho từng agent với nhiều thư mục máy chủ, chế độ truy cập và tùy chọn chủ động chấp nhận rủi ro an toàn của nguồn bên ngoài, hãy xem [Nhiều thư mục cho một agent](/vi/gateway/sandboxing#multiple-folders-for-one-agent).

## Chính sách công cụ: những công cụ nào tồn tại/có thể được gọi

Có hai lớp quan trọng:

- **Hồ sơ công cụ**: `tools.profile` và `agents.list[].tools.profile` (danh sách cho phép cơ sở)
- **Hồ sơ công cụ của nhà cung cấp**: `tools.byProvider[provider].profile` và `agents.list[].tools.byProvider[provider].profile`
- **Chính sách công cụ toàn cục/riêng cho từng agent**: `tools.allow`/`tools.deny` và `agents.list[].tools.allow`/`agents.list[].tools.deny`
- **Chính sách công cụ của nhà cung cấp**: `tools.byProvider[provider].allow/deny` và `agents.list[].tools.byProvider[provider].allow/deny`
- **Chính sách công cụ sandbox** (chỉ áp dụng khi ở trong sandbox): `tools.sandbox.tools.allow`/`tools.sandbox.tools.deny` và `agents.list[].tools.sandbox.tools.*`

Quy tắc kinh nghiệm:

- `deny` luôn được ưu tiên.
- Nếu `allow` không trống, mọi thứ khác đều được coi là bị chặn.
- Chính sách công cụ là điểm chặn tuyệt đối: `/exec` không thể ghi đè một công cụ `exec` đã bị từ chối.
- Chính sách công cụ lọc tính khả dụng của công cụ theo tên; chính sách này không kiểm tra các tác dụng phụ bên trong `exec`. Nếu `exec` được cho phép, việc từ chối `write`, `edit` hoặc `apply_patch` không biến các lệnh shell thành chỉ đọc.
- `/exec` chỉ thay đổi các giá trị mặc định của phiên đối với người gửi được ủy quyền; nó không cấp quyền truy cập công cụ.
- Khóa công cụ của nhà cung cấp chấp nhận `provider` (ví dụ: `google-antigravity`) hoặc `provider/model` (ví dụ: `openai/gpt-5.4`).
- Nhật ký Gateway bao gồm các mục kiểm tra `agents/tool-policy` khi một bước trong chính sách công cụ loại bỏ công cụ hoặc khi chính sách công cụ sandbox chặn một lệnh gọi. Sử dụng `openclaw logs` để xem nhãn quy tắc, khóa cấu hình và tên các công cụ bị ảnh hưởng.

### Nhóm công cụ (cách viết tắt)

Các chính sách công cụ (toàn cục, agent, sandbox) hỗ trợ các mục `group:*` được mở rộng thành nhiều công cụ:

```json5
{
  tools: {
    sandbox: {
      tools: {
        allow: ["group:runtime", "group:fs", "group:sessions", "group:memory"],
      },
    },
  },
}
```

Các nhóm khả dụng:

| Nhóm               | Công cụ                                                                                                                                                                                                                                                |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `group:runtime`    | `exec`, `process`, `code_execution` (`bash` được chấp nhận làm bí danh cho `exec`)                                                                                                                                                                        |
| `group:fs`         | `read`, `write`, `edit`, `apply_patch`                                                                                                                                                                                                                 |
| `group:sessions`   | `sessions`, `sessions_list`, `sessions_history`, `sessions_search`, `conversations_list`, `conversations_send`, `conversations_turn`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status`, `spawn_task`, `dismiss_task` |
| `group:memory`     | `memory_search`, `memory_get`                                                                                                                                                                                                                          |
| `group:web`        | `web_search`, `x_search`, `web_fetch`                                                                                                                                                                                                                  |
| `group:ui`         | `browser`, `screen`, `terminal`, `canvas`, `show_widget`                                                                                                                                                                                               |
| `group:automation` | `heartbeat_respond`, `cron`, `gateway`                                                                                                                                                                                                                 |
| `group:messaging`  | `message`                                                                                                                                                                                                                                              |
| `group:nodes`      | `nodes`, `computer`                                                                                                                                                                                                                                    |
| `group:agents`     | `agents_list`, `get_goal`, `create_goal`, `update_goal`, `update_plan`, `ask_user`, `skill_workshop`                                                                                                                                                   |
| `group:media`      | `image`, `image_generate`, `music_generate`, `video_generate`, `tts`                                                                                                                                                                                   |
| `group:openclaw`   | hầu hết các công cụ tích hợp sẵn của OpenClaw (không bao gồm các thành phần nguyên thủy hệ thống tệp và runtime `read`/`write`/`edit`/`apply_patch`/`exec`/`process`, `canvas` và các plugin của nhà cung cấp)                                                                                             |
| `group:plugins`    | tất cả công cụ thuộc sở hữu của plugin đã tải, bao gồm các máy chủ MCP đã cấu hình được cung cấp qua `bundle-mcp`                                                                                                                                                           |

Đối với các agent chỉ đọc, hãy từ chối `group:runtime` cũng như các công cụ sửa đổi hệ thống tệp, trừ khi chính sách hệ thống tệp sandbox hoặc một ranh giới máy chủ riêng biệt thực thi ràng buộc chỉ đọc.

Đối với các máy chủ MCP ở trong sandbox, chính sách công cụ sandbox là cổng cho phép thứ hai. Nếu `mcp.servers` đã được cấu hình nhưng các lượt ở trong sandbox chỉ hiển thị công cụ tích hợp sẵn, hãy thêm `bundle-mcp`, `group:plugins` hoặc tên/glob công cụ MCP có tiền tố máy chủ như `outlook__send_mail` hoặc `outlook__*` vào `tools.sandbox.tools.alsoAllow`, sau đó khởi động lại/tải lại Gateway và thu thập lại danh sách công cụ. Glob máy chủ sử dụng tiền tố máy chủ MCP an toàn cho nhà cung cấp: các ký tự không phải `[A-Za-z0-9_-]` trở thành `-`, các tên không bắt đầu bằng chữ cái nhận tiền tố `mcp-`, còn các tiền tố dài hoặc trùng lặp có thể bị cắt ngắn hoặc thêm hậu tố.

`openclaw doctor` hiện kiểm tra cấu trúc này cho các máy chủ do OpenClaw quản lý trong `mcp.servers`. Các máy chủ MCP được tải từ manifest plugin đi kèm hoặc Claude `.mcp.json` sử dụng cùng cổng sandbox, nhưng chẩn đoán này chưa liệt kê các nguồn đó; hãy sử dụng cùng các mục trong danh sách cho phép nếu công cụ của chúng biến mất trong các lượt ở trong sandbox.

## Đặc quyền nâng cao: chỉ dành cho exec để "chạy trên máy chủ"

Đặc quyền nâng cao **không** cấp thêm công cụ; nó chỉ ảnh hưởng đến `exec`.

- Nếu bạn đang ở trong sandbox, `/elevated on` (hoặc `exec` với `elevated: true`) sẽ chạy bên ngoài sandbox (có thể vẫn cần phê duyệt).
- Sử dụng `/elevated full` để bỏ qua phê duyệt exec cho phiên.
- Nếu bạn đã chạy trực tiếp, đặc quyền nâng cao thực tế không có tác dụng (vẫn chịu sự kiểm soát của các cổng).
- Đặc quyền nâng cao **không** có phạm vi theo skill và **không** ghi đè quy tắc cho phép/từ chối công cụ.
- Đặc quyền nâng cao không cấp quyền ghi đè tùy ý giữa các máy chủ từ `host=auto`; nó tuân theo các quy tắc đích exec thông thường và chỉ giữ nguyên `node` khi đích đã cấu hình/đích của phiên vốn đã là `node`.
- `/exec` tách biệt với đặc quyền nâng cao. Nó chỉ điều chỉnh các giá trị mặc định của exec theo từng phiên đối với người gửi được ủy quyền.

Các cổng kiểm soát:

- Kích hoạt: `tools.elevated.enabled` (và tùy chọn `agents.list[].tools.elevated.enabled`)
- Danh sách người gửi được phép: `tools.elevated.allowFrom.<provider>` (và tùy chọn `agents.list[].tools.elevated.allowFrom.<provider>`)

Xem [Chế độ đặc quyền nâng cao](/vi/tools/elevated).

## Các cách khắc phục phổ biến khi "bị giam trong sandbox"

### "Công cụ X bị chính sách công cụ sandbox chặn"

Các khóa cần sửa (chọn một):

- Tắt sandbox: `agents.defaults.sandbox.mode=off` (hoặc `agents.list[].sandbox.mode=off` theo từng tác nhân)
- Cho phép công cụ bên trong sandbox:
  - xóa công cụ khỏi `tools.sandbox.tools.deny` (hoặc `agents.list[].tools.sandbox.tools.deny` theo từng tác nhân)
  - hoặc thêm công cụ vào `tools.sandbox.tools.allow` (hoặc danh sách cho phép theo từng tác nhân)
- Kiểm tra mục `agents/tool-policy` trong `openclaw logs`. Mục này ghi lại chế độ sandbox và liệu quy tắc cho phép hay từ chối đã chặn công cụ hay không.

### "Tôi nghĩ đây là phiên chính, tại sao nó lại bị cách ly trong sandbox?"

Trong chế độ `"non-main"`, các khóa nhóm/kênh _không_ phải là khóa chính. Hãy sử dụng khóa phiên chính (được hiển thị bởi `sandbox explain`) hoặc chuyển chế độ sang `"off"`.

## Liên quan

- [Sandbox](/vi/gateway/sandboxing) -- tài liệu tham khảo đầy đủ về sandbox (chế độ, phạm vi, backend, image)
- [Sandbox và công cụ đa tác nhân](/vi/tools/multi-agent-sandbox-tools) -- các giá trị ghi đè theo từng tác nhân và thứ tự ưu tiên
- [Chế độ nâng cao](/vi/tools/elevated)
