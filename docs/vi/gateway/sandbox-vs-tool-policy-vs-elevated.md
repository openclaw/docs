---
read_when: You hit 'sandbox jail' or see a tool/elevated refusal and want the exact config key to change.
status: active
summary: 'Tại sao một công cụ bị chặn: môi trường thực thi sandbox, chính sách cho phép/từ chối công cụ và các cổng kiểm soát exec nâng quyền'
title: Hộp cát so với chính sách công cụ so với quyền nâng cao
x-i18n:
    generated_at: "2026-05-10T19:36:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9d670aa4f2e0f2265590e0de6198de841e744d210bbc54d291cb448d368e63b6
    source_path: gateway/sandbox-vs-tool-policy-vs-elevated.md
    workflow: 16
---

OpenClaw có ba cơ chế kiểm soát liên quan (nhưng khác nhau):

1. **Sandbox** (`agents.defaults.sandbox.*` / `agents.list[].sandbox.*`) quyết định **công cụ chạy ở đâu** (backend sandbox hay máy chủ).
2. **Chính sách công cụ** (`tools.*`, `tools.sandbox.tools.*`, `agents.list[].tools.*`) quyết định **công cụ nào có sẵn/được phép**.
3. **Nâng quyền** (`tools.elevated.*`, `agents.list[].tools.elevated.*`) là một **lối thoát chỉ dành cho exec** để chạy bên ngoài sandbox khi bạn đang ở trong sandbox (`gateway` theo mặc định, hoặc `node` khi đích exec được cấu hình là `node`).

## Gỡ lỗi nhanh

Dùng trình kiểm tra để xem OpenClaw _thực sự_ đang làm gì:

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

Nó in ra:

- chế độ/phạm vi/truy cập không gian làm việc sandbox hiệu lực
- phiên hiện có đang ở trong sandbox hay không (main so với non-main)
- allow/deny công cụ sandbox hiệu lực (và nguồn là agent/global/default)
- các cổng nâng quyền và đường dẫn khóa để sửa lỗi

## Sandbox: công cụ chạy ở đâu

Sandboxing được kiểm soát bằng `agents.defaults.sandbox.mode`:

- `"off"`: mọi thứ chạy trên máy chủ.
- `"non-main"`: chỉ các phiên non-main được đưa vào sandbox (điểm "bất ngờ" thường gặp với nhóm/kênh).
- `"all"`: mọi thứ được đưa vào sandbox.

Xem [Sandboxing](/vi/gateway/sandboxing) để biết ma trận đầy đủ (phạm vi, mount không gian làm việc, image).

### Bind mount (kiểm tra nhanh về bảo mật)

- `docker.binds` _xuyên qua_ hệ thống tệp sandbox: bất cứ thứ gì bạn mount đều hiển thị bên trong container với chế độ bạn đặt (`:ro` hoặc `:rw`).
- Mặc định là đọc-ghi nếu bạn bỏ qua chế độ; ưu tiên `:ro` cho mã nguồn/bí mật.
- `scope: "shared"` bỏ qua bind theo từng agent (chỉ áp dụng bind toàn cục).
- OpenClaw xác thực nguồn bind hai lần: lần đầu trên đường dẫn nguồn đã chuẩn hóa, sau đó xác thực lại sau khi phân giải qua tổ tiên tồn tại sâu nhất. Việc thoát qua symlink-parent không vượt qua được kiểm tra đường dẫn bị chặn hoặc gốc được phép.
- Các đường dẫn lá không tồn tại vẫn được kiểm tra an toàn. Nếu `/workspace/alias-out/new-file` phân giải qua thư mục cha là symlink đến một đường dẫn bị chặn hoặc nằm ngoài các gốc được phép đã cấu hình, bind sẽ bị từ chối.
- Bind `/var/run/docker.sock` thực chất trao quyền kiểm soát máy chủ cho sandbox; chỉ làm việc này khi có chủ ý.
- Truy cập không gian làm việc (`workspaceAccess: "ro"`/`"rw"`) độc lập với chế độ bind.

## Chính sách công cụ: công cụ nào tồn tại/có thể gọi

Có hai lớp quan trọng:

- **Hồ sơ công cụ**: `tools.profile` và `agents.list[].tools.profile` (danh sách cho phép cơ sở)
- **Hồ sơ công cụ của provider**: `tools.byProvider[provider].profile` và `agents.list[].tools.byProvider[provider].profile`
- **Chính sách công cụ toàn cục/theo agent**: `tools.allow`/`tools.deny` và `agents.list[].tools.allow`/`agents.list[].tools.deny`
- **Chính sách công cụ của provider**: `tools.byProvider[provider].allow/deny` và `agents.list[].tools.byProvider[provider].allow/deny`
- **Chính sách công cụ sandbox** (chỉ áp dụng khi ở trong sandbox): `tools.sandbox.tools.allow`/`tools.sandbox.tools.deny` và `agents.list[].tools.sandbox.tools.*`

Nguyên tắc thực hành:

- `deny` luôn thắng.
- Nếu `allow` không rỗng, mọi thứ khác được xem là bị chặn.
- Chính sách công cụ là điểm dừng cứng: `/exec` không thể ghi đè một công cụ `exec` đã bị từ chối.
- Chính sách công cụ lọc khả năng có sẵn của công cụ theo tên; nó không kiểm tra tác dụng phụ bên trong `exec`. Nếu `exec` được phép, việc từ chối `write`, `edit`, hoặc `apply_patch` không làm cho lệnh shell trở thành chỉ đọc.
- `/exec` chỉ thay đổi mặc định phiên cho người gửi được ủy quyền; nó không cấp quyền truy cập công cụ.
  Khóa công cụ provider chấp nhận `provider` (ví dụ `google-antigravity`) hoặc `provider/model` (ví dụ `openai/gpt-5.4`).

### Nhóm công cụ (viết tắt)

Chính sách công cụ (toàn cục, agent, sandbox) hỗ trợ các mục `group:*` mở rộng thành nhiều công cụ:

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
  Với agent chỉ đọc, hãy từ chối `group:runtime` cũng như các công cụ hệ thống tệp có thể thay đổi dữ liệu, trừ khi chính sách hệ thống tệp sandbox hoặc một ranh giới máy chủ riêng biệt thực thi ràng buộc chỉ đọc.
- `group:sessions`: `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status`
- `group:memory`: `memory_search`, `memory_get`
- `group:web`: `web_search`, `x_search`, `web_fetch`
- `group:ui`: `browser`, `canvas`
- `group:automation`: `heartbeat_respond`, `cron`, `gateway`
- `group:messaging`: `message`
- `group:nodes`: `nodes`
- `group:agents`: `agents_list`, `update_plan`
- `group:media`: `image`, `image_generate`, `music_generate`, `video_generate`, `tts`
- `group:openclaw`: tất cả công cụ OpenClaw tích hợp sẵn (không bao gồm Plugin của provider)

## Nâng quyền: "chạy trên máy chủ" chỉ dành cho exec

Nâng quyền **không** cấp thêm công cụ; nó chỉ ảnh hưởng đến `exec`.

- Nếu bạn đang ở trong sandbox, `/elevated on` (hoặc `exec` với `elevated: true`) chạy bên ngoài sandbox (phê duyệt vẫn có thể áp dụng).
- Dùng `/elevated full` để bỏ qua phê duyệt exec cho phiên.
- Nếu bạn đã chạy trực tiếp, nâng quyền về cơ bản là không có tác dụng (vẫn bị kiểm soát bằng cổng).
- Nâng quyền **không** theo phạm vi skill và **không** ghi đè allow/deny công cụ.
- Nâng quyền không cấp quyền ghi đè tùy ý xuyên máy chủ từ `host=auto`; nó tuân theo các quy tắc đích exec thông thường và chỉ giữ `node` khi đích đã cấu hình/đích phiên đã là `node`.
- `/exec` tách biệt với nâng quyền. Nó chỉ điều chỉnh mặc định exec theo từng phiên cho người gửi được ủy quyền.

Các cổng:

- Bật tính năng: `tools.elevated.enabled` (và tùy chọn `agents.list[].tools.elevated.enabled`)
- Danh sách cho phép người gửi: `tools.elevated.allowFrom.<provider>` (và tùy chọn `agents.list[].tools.elevated.allowFrom.<provider>`)

Xem [Chế độ nâng quyền](/vi/tools/elevated).

## Các cách sửa lỗi "giam trong sandbox" thường gặp

### "Công cụ X bị chặn bởi chính sách công cụ sandbox"

Khóa sửa lỗi (chọn một):

- Tắt sandbox: `agents.defaults.sandbox.mode=off` (hoặc theo từng agent `agents.list[].sandbox.mode=off`)
- Cho phép công cụ bên trong sandbox:
  - xóa nó khỏi `tools.sandbox.tools.deny` (hoặc theo từng agent `agents.list[].tools.sandbox.tools.deny`)
  - hoặc thêm nó vào `tools.sandbox.tools.allow` (hoặc allow theo từng agent)

### "Tôi tưởng đây là main, tại sao nó lại ở trong sandbox?"

Ở chế độ `"non-main"`, khóa nhóm/kênh _không_ phải là main. Dùng khóa phiên main (hiển thị bởi `sandbox explain`) hoặc chuyển chế độ sang `"off"`.

## Liên quan

- [Sandboxing](/vi/gateway/sandboxing) -- tham chiếu sandbox đầy đủ (chế độ, phạm vi, backend, image)
- [Sandbox & Công cụ đa agent](/vi/tools/multi-agent-sandbox-tools) -- ghi đè và thứ tự ưu tiên theo từng agent
- [Chế độ nâng quyền](/vi/tools/elevated)
