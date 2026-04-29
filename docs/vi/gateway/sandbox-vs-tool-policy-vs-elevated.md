---
read_when: You hit 'sandbox jail' or see a tool/elevated refusal and want the exact config key to change.
status: active
summary: 'Vì sao một công cụ bị chặn: môi trường chạy sandbox, chính sách cho phép/từ chối công cụ và các cổng kiểm soát thực thi nâng quyền'
title: Môi trường hộp cát so với chính sách công cụ so với quyền nâng cao
x-i18n:
    generated_at: "2026-04-29T22:46:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 74bb73023a3f7a85a0c020b2e8df69610ab8f8e60f8ab6142f8da7810dc08429
    source_path: gateway/sandbox-vs-tool-policy-vs-elevated.md
    workflow: 16
---

OpenClaw có ba cơ chế kiểm soát liên quan (nhưng khác nhau):

1. **Môi trường cách ly** (`agents.defaults.sandbox.*` / `agents.list[].sandbox.*`) quyết định **công cụ chạy ở đâu** (backend cách ly hay máy chủ).
2. **Chính sách công cụ** (`tools.*`, `tools.sandbox.tools.*`, `agents.list[].tools.*`) quyết định **công cụ nào có sẵn/được phép dùng**.
3. **Nâng quyền** (`tools.elevated.*`, `agents.list[].tools.elevated.*`) là **lối thoát chỉ dành cho exec** để chạy bên ngoài môi trường cách ly khi bạn đang bị cách ly (`gateway` theo mặc định, hoặc `node` khi đích exec được cấu hình là `node`).

## Gỡ lỗi nhanh

Dùng trình kiểm tra để xem OpenClaw _thực sự_ đang làm gì:

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

Lệnh này in ra:

- chế độ/phạm vi/quyền truy cập workspace cách ly hiệu dụng
- phiên hiện có đang bị cách ly hay không (main so với non-main)
- allow/deny công cụ trong môi trường cách ly hiệu dụng (và đến từ agent/global/default hay không)
- các cổng nâng quyền và đường dẫn khóa để sửa

## Môi trường cách ly: nơi công cụ chạy

Cách ly được kiểm soát bởi `agents.defaults.sandbox.mode`:

- `"off"`: mọi thứ chạy trên máy chủ.
- `"non-main"`: chỉ các phiên non-main bị cách ly (điểm “bất ngờ” thường gặp với nhóm/kênh).
- `"all"`: mọi thứ đều bị cách ly.

Xem [Cách ly bằng sandbox](/vi/gateway/sandboxing) để biết ma trận đầy đủ (phạm vi, mount workspace, image).

### Bind mount (kiểm tra nhanh về bảo mật)

- `docker.binds` _xuyên qua_ hệ thống tệp của môi trường cách ly: bất cứ thứ gì bạn mount đều hiển thị bên trong container với chế độ bạn đặt (`:ro` hoặc `:rw`).
- Mặc định là đọc-ghi nếu bạn bỏ qua chế độ; ưu tiên `:ro` cho mã nguồn/bí mật.
- `scope: "shared"` bỏ qua bind theo từng agent (chỉ áp dụng bind toàn cục).
- OpenClaw xác thực nguồn bind hai lần: trước tiên trên đường dẫn nguồn đã chuẩn hóa, sau đó xác thực lại sau khi phân giải qua tổ tiên sâu nhất đang tồn tại. Việc thoát qua symlink ở thư mục cha không vượt qua được kiểm tra đường dẫn bị chặn hoặc gốc được phép.
- Các đường dẫn lá không tồn tại vẫn được kiểm tra an toàn. Nếu `/workspace/alias-out/new-file` phân giải qua một thư mục cha là symlink tới đường dẫn bị chặn hoặc nằm ngoài các gốc được phép đã cấu hình, bind sẽ bị từ chối.
- Bind `/var/run/docker.sock` về thực chất trao quyền điều khiển máy chủ cho môi trường cách ly; chỉ làm việc này khi có chủ ý.
- Quyền truy cập workspace (`workspaceAccess: "ro"`/`"rw"`) độc lập với chế độ bind.

## Chính sách công cụ: công cụ nào tồn tại/có thể được gọi

Có hai lớp quan trọng:

- **Hồ sơ công cụ**: `tools.profile` và `agents.list[].tools.profile` (allowlist nền)
- **Hồ sơ công cụ của nhà cung cấp**: `tools.byProvider[provider].profile` và `agents.list[].tools.byProvider[provider].profile`
- **Chính sách công cụ toàn cục/theo agent**: `tools.allow`/`tools.deny` và `agents.list[].tools.allow`/`agents.list[].tools.deny`
- **Chính sách công cụ của nhà cung cấp**: `tools.byProvider[provider].allow/deny` và `agents.list[].tools.byProvider[provider].allow/deny`
- **Chính sách công cụ trong môi trường cách ly** (chỉ áp dụng khi bị cách ly): `tools.sandbox.tools.allow`/`tools.sandbox.tools.deny` và `agents.list[].tools.sandbox.tools.*`

Quy tắc kinh nghiệm:

- `deny` luôn thắng.
- Nếu `allow` không rỗng, mọi thứ khác được xem là bị chặn.
- Chính sách công cụ là điểm chặn cứng: `/exec` không thể ghi đè một công cụ `exec` đã bị từ chối.
- `/exec` chỉ thay đổi mặc định phiên cho người gửi được ủy quyền; nó không cấp quyền truy cập công cụ.
  Khóa công cụ của nhà cung cấp chấp nhận `provider` (ví dụ `google-antigravity`) hoặc `provider/model` (ví dụ `openai/gpt-5.4`).

### Nhóm công cụ (viết tắt)

Chính sách công cụ (toàn cục, agent, môi trường cách ly) hỗ trợ các mục `group:*` mở rộng thành nhiều công cụ:

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

Các nhóm có sẵn:

- `group:runtime`: `exec`, `process`, `code_execution` (`bash` được chấp nhận làm
  bí danh cho `exec`)
- `group:fs`: `read`, `write`, `edit`, `apply_patch`
- `group:sessions`: `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status`
- `group:memory`: `memory_search`, `memory_get`
- `group:web`: `web_search`, `x_search`, `web_fetch`
- `group:ui`: `browser`, `canvas`
- `group:automation`: `cron`, `gateway`
- `group:messaging`: `message`
- `group:nodes`: `nodes`
- `group:agents`: `agents_list`
- `group:media`: `image`, `image_generate`, `video_generate`, `tts`
- `group:openclaw`: tất cả công cụ tích hợp sẵn của OpenClaw (không bao gồm Plugin của nhà cung cấp)

## Nâng quyền: "chạy trên máy chủ" chỉ dành cho exec

Nâng quyền **không** cấp thêm công cụ; nó chỉ ảnh hưởng đến `exec`.

- Nếu bạn đang bị cách ly, `/elevated on` (hoặc `exec` với `elevated: true`) chạy bên ngoài môi trường cách ly (phê duyệt vẫn có thể được áp dụng).
- Dùng `/elevated full` để bỏ qua phê duyệt exec cho phiên.
- Nếu bạn đã chạy trực tiếp, nâng quyền về thực chất không làm gì (vẫn bị chặn bởi cổng).
- Nâng quyền **không** theo phạm vi skill và **không** ghi đè allow/deny công cụ.
- Nâng quyền không cấp quyền ghi đè xuyên máy chủ tùy ý từ `host=auto`; nó tuân theo các quy tắc đích exec thông thường và chỉ giữ nguyên `node` khi đích đã cấu hình/đích của phiên đã là `node`.
- `/exec` tách biệt với nâng quyền. Nó chỉ điều chỉnh mặc định exec theo từng phiên cho người gửi được ủy quyền.

Các cổng:

- Bật tính năng: `tools.elevated.enabled` (và tùy chọn `agents.list[].tools.elevated.enabled`)
- Allowlist người gửi: `tools.elevated.allowFrom.<provider>` (và tùy chọn `agents.list[].tools.elevated.allowFrom.<provider>`)

Xem [Chế độ nâng quyền](/vi/tools/elevated).

## Các cách sửa lỗi “bị nhốt trong môi trường cách ly” thường gặp

### "Tool X blocked by sandbox tool policy"

Khóa để sửa (chọn một):

- Tắt môi trường cách ly: `agents.defaults.sandbox.mode=off` (hoặc theo từng agent `agents.list[].sandbox.mode=off`)
- Cho phép công cụ bên trong môi trường cách ly:
  - xóa công cụ khỏi `tools.sandbox.tools.deny` (hoặc theo từng agent `agents.list[].tools.sandbox.tools.deny`)
  - hoặc thêm công cụ vào `tools.sandbox.tools.allow` (hoặc allow theo từng agent)

### "I thought this was main, why is it sandboxed?"

Trong chế độ `"non-main"`, khóa nhóm/kênh _không_ phải là main. Dùng khóa phiên main (được hiển thị bởi `sandbox explain`) hoặc chuyển chế độ sang `"off"`.

## Liên quan

- [Cách ly bằng sandbox](/vi/gateway/sandboxing) -- tham chiếu đầy đủ về môi trường cách ly (chế độ, phạm vi, backend, image)
- [Môi trường cách ly & công cụ đa agent](/vi/tools/multi-agent-sandbox-tools) -- ghi đè và thứ tự ưu tiên theo từng agent
- [Chế độ nâng quyền](/vi/tools/elevated)
