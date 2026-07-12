---
read_when: You hit 'sandbox jail' or see a tool/elevated refusal and want the exact config key to change.
status: active
summary: 'Lý do một công cụ bị chặn: môi trường chạy sandbox, chính sách cho phép/từ chối công cụ và các cổng kiểm soát thực thi nâng cao đặc quyền'
title: Hộp cát so với chính sách công cụ và chế độ đặc quyền cao
x-i18n:
    generated_at: "2026-07-12T07:59:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2fce3dab337e89fc2b196f59e763a169d76206ce2695744e00252c158b161260
    source_path: gateway/sandbox-vs-tool-policy-vs-elevated.md
    workflow: 16
---

OpenClaw có ba cơ chế kiểm soát có liên quan nhưng khác nhau:

1. **Sandbox** (`agents.defaults.sandbox.*` / `agents.list[].sandbox.*`) quyết định **công cụ chạy ở đâu** (phần phụ trợ sandbox hay máy chủ).
2. **Chính sách công cụ** (`tools.*`, `tools.sandbox.tools.*`, `agents.list[].tools.*`) quyết định **công cụ nào khả dụng/được phép**.
3. **Elevated** (`tools.elevated.*`, `agents.list[].tools.elevated.*`) là một **lối thoát chỉ dành cho `exec`** để chạy bên ngoài sandbox khi bạn đang ở trong sandbox (mặc định là `gateway`, hoặc `node` khi đích thực thi được cấu hình thành `node`).

## Gỡ lỗi nhanh

Dùng trình kiểm tra để xem OpenClaw _thực sự_ đang làm gì:

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

Lệnh này in ra:

- chế độ/phạm vi sandbox và quyền truy cập không gian làm việc có hiệu lực
- phiên hiện tại có đang ở trong sandbox hay không (chính hay không chính)
- danh sách cho phép/từ chối công cụ sandbox có hiệu lực (và bắt nguồn từ tác tử/toàn cục/mặc định)
- các cổng kiểm soát elevated và đường dẫn khóa cần sửa

## Sandbox: nơi công cụ chạy

Việc sử dụng sandbox được kiểm soát bằng `agents.defaults.sandbox.mode`:

- `"off"`: mọi thứ chạy trên máy chủ.
- `"non-main"`: chỉ các phiên không chính chạy trong sandbox (một tình huống "bất ngờ" thường gặp đối với nhóm/kênh).
- `"all"`: mọi thứ chạy trong sandbox.

`agents.defaults.sandbox.workspaceAccess` kiểm soát nội dung mà sandbox có thể thấy: `"none"`, `"ro"` hoặc `"rw"`.

Xem [Cơ chế sandbox](/vi/gateway/sandboxing) để biết ma trận đầy đủ (phạm vi, điểm gắn không gian làm việc, ảnh).

### Điểm gắn bind (kiểm tra bảo mật nhanh)

- `docker.binds` _xuyên qua_ hệ thống tệp sandbox: mọi thứ bạn gắn đều hiển thị bên trong vùng chứa với chế độ bạn đặt (`:ro` hoặc `:rw`).
- Mặc định là đọc-ghi nếu bạn bỏ qua chế độ; nên dùng `:ro` cho mã nguồn/thông tin bí mật.
- `scope: "shared"` bỏ qua các điểm gắn riêng cho từng tác tử (chỉ áp dụng điểm gắn toàn cục).
- OpenClaw xác thực nguồn bind hai lần: lần đầu trên đường dẫn nguồn đã chuẩn hóa, sau đó xác thực lại sau khi phân giải qua tổ tiên tồn tại sâu nhất. Việc thoát qua thư mục cha là liên kết tượng trưng không thể vượt qua các bước kiểm tra đường dẫn bị chặn hoặc gốc được phép.
- Các đường dẫn lá không tồn tại vẫn được kiểm tra an toàn. Nếu `/workspace/alias-out/new-file` được phân giải qua một thư mục cha là liên kết tượng trưng tới đường dẫn bị chặn hoặc ra ngoài các gốc được phép đã cấu hình, bind sẽ bị từ chối.
- Việc bind `/var/run/docker.sock` về cơ bản trao quyền kiểm soát máy chủ cho sandbox; chỉ thực hiện việc này khi có chủ đích.
- Quyền truy cập không gian làm việc (`workspaceAccess`) độc lập với các chế độ bind.

## Chính sách công cụ: công cụ nào tồn tại/có thể được gọi

Có các lớp quan trọng sau:

- **Hồ sơ công cụ**: `tools.profile` và `agents.list[].tools.profile` (danh sách cho phép cơ sở)
- **Hồ sơ công cụ của nhà cung cấp**: `tools.byProvider[provider].profile` và `agents.list[].tools.byProvider[provider].profile`
- **Chính sách công cụ toàn cục/cho từng tác tử**: `tools.allow`/`tools.deny` và `agents.list[].tools.allow`/`agents.list[].tools.deny`
- **Chính sách công cụ của nhà cung cấp**: `tools.byProvider[provider].allow/deny` và `agents.list[].tools.byProvider[provider].allow/deny`
- **Chính sách công cụ sandbox** (chỉ áp dụng khi ở trong sandbox): `tools.sandbox.tools.allow`/`tools.sandbox.tools.deny` và `agents.list[].tools.sandbox.tools.*`

Quy tắc kinh nghiệm:

- `deny` luôn được ưu tiên.
- Nếu `allow` không rỗng, mọi thứ khác đều được xem là bị chặn.
- Chính sách công cụ là điểm chặn tuyệt đối: `/exec` không thể ghi đè một công cụ `exec` bị từ chối.
- Chính sách công cụ lọc tính khả dụng của công cụ theo tên; chính sách này không kiểm tra các tác dụng phụ bên trong `exec`. Nếu `exec` được phép, việc từ chối `write`, `edit` hoặc `apply_patch` không khiến các lệnh shell trở thành chỉ đọc.
- `/exec` chỉ thay đổi giá trị mặc định của phiên đối với người gửi được ủy quyền; lệnh này không cấp quyền truy cập công cụ.
- Khóa công cụ của nhà cung cấp chấp nhận `provider` (ví dụ: `google-antigravity`) hoặc `provider/model` (ví dụ: `openai/gpt-5.4`).
- Nhật ký Gateway chứa các mục kiểm tra `agents/tool-policy` khi một bước của chính sách công cụ loại bỏ công cụ hoặc chính sách công cụ sandbox chặn một lệnh gọi. Dùng `openclaw logs` để xem nhãn quy tắc, khóa cấu hình và tên công cụ bị ảnh hưởng.

### Nhóm công cụ (dạng viết tắt)

Các chính sách công cụ (toàn cục, tác tử, sandbox) hỗ trợ các mục `group:*` được mở rộng thành nhiều công cụ:

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

| Nhóm               | Công cụ                                                                                                                                                    |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | `exec`, `process`, `code_execution` (`bash` được chấp nhận làm bí danh cho `exec`)                                                                          |
| `group:fs`         | `read`, `write`, `edit`, `apply_patch`                                                                                                                     |
| `group:sessions`   | `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status`                                    |
| `group:memory`     | `memory_search`, `memory_get`                                                                                                                              |
| `group:web`        | `web_search`, `x_search`, `web_fetch`                                                                                                                      |
| `group:ui`         | `browser`, `canvas`                                                                                                                                        |
| `group:automation` | `heartbeat_respond`, `cron`, `gateway`                                                                                                                     |
| `group:messaging`  | `message`                                                                                                                                                  |
| `group:nodes`      | `nodes`, `computer`                                                                                                                                        |
| `group:agents`     | `agents_list`, `get_goal`, `create_goal`, `update_goal`, `update_plan`, `skill_workshop`                                                                   |
| `group:media`      | `image`, `image_generate`, `music_generate`, `video_generate`, `tts`                                                                                       |
| `group:openclaw`   | hầu hết các công cụ tích hợp sẵn của OpenClaw (không bao gồm các thành phần cơ bản của hệ thống tệp và thời gian chạy `read`/`write`/`edit`/`apply_patch`/`exec`/`process`, `canvas` và các plugin của nhà cung cấp) |
| `group:plugins`    | tất cả công cụ thuộc sở hữu của plugin đã được tải, bao gồm các máy chủ MCP được cấu hình và cung cấp qua `bundle-mcp`                                      |

Đối với tác tử chỉ đọc, hãy từ chối `group:runtime` cũng như các công cụ hệ thống tệp có khả năng thay đổi dữ liệu, trừ khi chính sách hệ thống tệp sandbox hoặc một ranh giới máy chủ riêng biệt thực thi ràng buộc chỉ đọc.

Đối với các máy chủ MCP chạy trong sandbox, chính sách công cụ sandbox là cổng cho phép thứ hai. Nếu `mcp.servers` đã được cấu hình nhưng các lượt chạy trong sandbox chỉ hiển thị công cụ tích hợp sẵn, hãy thêm `bundle-mcp`, `group:plugins` hoặc tên/mẫu glob công cụ MCP có tiền tố máy chủ như `outlook__send_mail` hoặc `outlook__*` vào `tools.sandbox.tools.alsoAllow`, sau đó khởi động lại/tải lại Gateway và thu thập lại danh sách công cụ. Mẫu glob máy chủ sử dụng tiền tố máy chủ MCP an toàn cho nhà cung cấp: các ký tự không thuộc `[A-Za-z0-9_-]` được chuyển thành `-`, tên không bắt đầu bằng chữ cái được thêm tiền tố `mcp-`, còn các tiền tố dài hoặc trùng lặp có thể bị cắt ngắn hoặc thêm hậu tố.

`openclaw doctor` hiện kiểm tra cấu trúc này đối với các máy chủ do OpenClaw quản lý trong `mcp.servers`. Các máy chủ MCP được tải từ tệp kê khai plugin đi kèm hoặc `.mcp.json` của Claude sử dụng cùng cổng sandbox, nhưng chẩn đoán này chưa liệt kê các nguồn đó; hãy dùng cùng các mục trong danh sách cho phép nếu công cụ của chúng biến mất trong các lượt chạy trong sandbox.

## Elevated: chỉ `exec` để "chạy trên máy chủ"

Elevated **không** cấp thêm công cụ; nó chỉ ảnh hưởng đến `exec`.

- Nếu bạn đang ở trong sandbox, `/elevated on` (hoặc `exec` với `elevated: true`) sẽ chạy bên ngoài sandbox (có thể vẫn phải phê duyệt).
- Dùng `/elevated full` để bỏ qua phê duyệt `exec` cho phiên.
- Nếu bạn đã chạy trực tiếp, elevated về cơ bản không có tác dụng (vẫn chịu kiểm soát).
- Elevated **không** giới hạn theo skill và **không** ghi đè danh sách cho phép/từ chối công cụ.
- Elevated không cấp quyền ghi đè tùy ý giữa các máy chủ từ `host=auto`; nó tuân theo các quy tắc đích `exec` thông thường và chỉ giữ nguyên `node` khi đích được cấu hình/đích của phiên đã là `node`.
- `/exec` tách biệt với elevated. Nó chỉ điều chỉnh các giá trị mặc định của `exec` theo từng phiên cho người gửi được ủy quyền.

Các cổng kiểm soát:

- Kích hoạt: `tools.elevated.enabled` (và tùy chọn `agents.list[].tools.elevated.enabled`)
- Danh sách cho phép người gửi: `tools.elevated.allowFrom.<provider>` (và tùy chọn `agents.list[].tools.elevated.allowFrom.<provider>`)

Xem [Chế độ Elevated](/vi/tools/elevated).

## Các cách khắc phục thường gặp khi bị "giam trong sandbox"

### "Công cụ X bị chính sách công cụ sandbox chặn"

Các khóa cần sửa (chọn một):

- Tắt sandbox: `agents.defaults.sandbox.mode=off` (hoặc theo từng tác tử: `agents.list[].sandbox.mode=off`)
- Cho phép công cụ bên trong sandbox:
  - xóa công cụ khỏi `tools.sandbox.tools.deny` (hoặc `agents.list[].tools.sandbox.tools.deny` theo từng tác tử)
  - hoặc thêm công cụ vào `tools.sandbox.tools.allow` (hoặc danh sách cho phép theo từng tác tử)
- Kiểm tra `openclaw logs` để tìm mục `agents/tool-policy`. Mục này ghi lại chế độ sandbox và quy tắc cho phép hay từ chối đã chặn công cụ.

### "Tôi tưởng đây là phiên chính, tại sao nó lại ở trong sandbox?"

Trong chế độ `"non-main"`, các khóa nhóm/kênh _không_ phải là khóa chính. Hãy dùng khóa phiên chính (được hiển thị bởi `sandbox explain`) hoặc chuyển chế độ thành `"off"`.

## Liên quan

- [Cơ chế sandbox](/vi/gateway/sandboxing) -- tài liệu tham khảo đầy đủ về sandbox (chế độ, phạm vi, phần phụ trợ, ảnh)
- [Sandbox và công cụ đa tác tử](/vi/tools/multi-agent-sandbox-tools) -- ghi đè và thứ tự ưu tiên theo từng tác tử
- [Chế độ Elevated](/vi/tools/elevated)
