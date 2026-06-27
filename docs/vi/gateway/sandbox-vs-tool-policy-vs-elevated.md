---
read_when: You hit 'sandbox jail' or see a tool/elevated refusal and want the exact config key to change.
status: active
summary: 'Vì sao một công cụ bị chặn: thời gian chạy sandbox, chính sách cho phép/từ chối công cụ và các chốt chặn thực thi nâng quyền'
title: Sandbox so với chính sách công cụ so với quyền nâng cao
x-i18n:
    generated_at: "2026-06-27T17:31:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f4156cc494a6aff4fb9c44cbca8fdfde10a3343dde624c485833dd7508e4c4d6
    source_path: gateway/sandbox-vs-tool-policy-vs-elevated.md
    workflow: 16
---

OpenClaw có ba cơ chế điều khiển liên quan (nhưng khác nhau):

1. **Môi trường cách ly** (`agents.defaults.sandbox.*` / `agents.list[].sandbox.*`) quyết định **công cụ chạy ở đâu** (phần nền môi trường cách ly hay host).
2. **Chính sách công cụ** (`tools.*`, `tools.sandbox.tools.*`, `agents.list[].tools.*`) quyết định **công cụ nào có sẵn/được phép dùng**.
3. **Elevated** (`tools.elevated.*`, `agents.list[].tools.elevated.*`) là một **lối thoát chỉ dành cho exec** để chạy bên ngoài môi trường cách ly khi bạn đang bị cách ly (`gateway` theo mặc định, hoặc `node` khi đích exec được cấu hình là `node`).

## Gỡ lỗi nhanh

Dùng trình kiểm tra để xem OpenClaw _thực sự_ đang làm gì:

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

Nó in ra:

- chế độ/phạm vi/truy cập workspace hiệu lực của môi trường cách ly
- phiên hiện có đang bị cách ly hay không (main so với không phải main)
- allow/deny công cụ trong môi trường cách ly hiệu lực (và nó đến từ agent/global/default hay không)
- các cổng elevated và đường dẫn khóa để sửa

## Môi trường cách ly: công cụ chạy ở đâu

Cơ chế cách ly được điều khiển bởi `agents.defaults.sandbox.mode`:

- `"off"`: mọi thứ chạy trên host.
- `"non-main"`: chỉ các phiên không phải main bị cách ly (điểm thường gây “bất ngờ” cho nhóm/kênh).
- `"all"`: mọi thứ đều bị cách ly.

Xem [Cơ chế cách ly](/vi/gateway/sandboxing) để biết ma trận đầy đủ (phạm vi, mount workspace, image).

### Bind mount (kiểm tra nhanh về bảo mật)

- `docker.binds` _xuyên qua_ hệ thống tệp của môi trường cách ly: bất cứ thứ gì bạn mount đều hiển thị bên trong container với chế độ bạn đặt (`:ro` hoặc `:rw`).
- Mặc định là đọc-ghi nếu bạn bỏ qua chế độ; ưu tiên `:ro` cho mã nguồn/bí mật.
- `scope: "shared"` bỏ qua bind theo từng agent (chỉ áp dụng bind toàn cục).
- OpenClaw xác thực nguồn bind hai lần: đầu tiên trên đường dẫn nguồn đã chuẩn hóa, sau đó lần nữa sau khi phân giải qua tổ tiên sâu nhất đang tồn tại. Việc thoát qua cha là symlink không vượt qua được kiểm tra đường dẫn bị chặn hoặc gốc được phép.
- Các đường dẫn lá không tồn tại vẫn được kiểm tra an toàn. Nếu `/workspace/alias-out/new-file` phân giải qua một cha là symlink tới đường dẫn bị chặn hoặc ra ngoài các gốc được phép đã cấu hình, bind sẽ bị từ chối.
- Bind `/var/run/docker.sock` thực chất trao quyền kiểm soát host cho môi trường cách ly; chỉ làm việc này một cách có chủ đích.
- Quyền truy cập workspace (`workspaceAccess: "ro"`/`"rw"`) độc lập với chế độ bind.

## Chính sách công cụ: công cụ nào tồn tại/có thể gọi

Có hai lớp quan trọng:

- **Hồ sơ công cụ**: `tools.profile` và `agents.list[].tools.profile` (allowlist cơ sở)
- **Hồ sơ công cụ theo provider**: `tools.byProvider[provider].profile` và `agents.list[].tools.byProvider[provider].profile`
- **Chính sách công cụ toàn cục/theo agent**: `tools.allow`/`tools.deny` và `agents.list[].tools.allow`/`agents.list[].tools.deny`
- **Chính sách công cụ theo provider**: `tools.byProvider[provider].allow/deny` và `agents.list[].tools.byProvider[provider].allow/deny`
- **Chính sách công cụ trong môi trường cách ly** (chỉ áp dụng khi bị cách ly): `tools.sandbox.tools.allow`/`tools.sandbox.tools.deny` và `agents.list[].tools.sandbox.tools.*`

Quy tắc kinh nghiệm:

- `deny` luôn thắng.
- Nếu `allow` không rỗng, mọi thứ khác được xem là bị chặn.
- Chính sách công cụ là điểm chặn cứng: `/exec` không thể ghi đè một công cụ `exec` đã bị từ chối.
- Chính sách công cụ lọc khả dụng của công cụ theo tên; nó không kiểm tra tác dụng phụ bên trong `exec`. Nếu `exec` được phép, việc từ chối `write`, `edit`, hoặc `apply_patch` không làm cho lệnh shell trở thành chỉ đọc.
- `/exec` chỉ thay đổi mặc định của phiên cho người gửi được ủy quyền; nó không cấp quyền truy cập công cụ.
  Khóa công cụ theo provider chấp nhận `provider` (ví dụ `google-antigravity`) hoặc `provider/model` (ví dụ `openai/gpt-5.4`).
- Nhật ký Gateway bao gồm các mục kiểm toán `agents/tool-policy` khi một bước chính sách công cụ loại bỏ công cụ hoặc một chính sách công cụ trong môi trường cách ly chặn một lệnh gọi. Dùng `openclaw logs` để xem nhãn quy tắc, khóa cấu hình và tên công cụ bị ảnh hưởng.

### Nhóm công cụ (dạng viết tắt)

Các chính sách công cụ (toàn cục, agent, môi trường cách ly) hỗ trợ mục `group:*` mở rộng thành nhiều công cụ:

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
  Với agent chỉ đọc, hãy từ chối `group:runtime` cũng như các công cụ hệ thống tệp có thể thay đổi dữ liệu, trừ khi chính sách hệ thống tệp của môi trường cách ly hoặc một ranh giới host riêng thực thi ràng buộc chỉ đọc.
- `group:sessions`: `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status`
- `group:memory`: `memory_search`, `memory_get`
- `group:web`: `web_search`, `x_search`, `web_fetch`
- `group:ui`: `browser`, `canvas`
- `group:automation`: `heartbeat_respond`, `cron`, `gateway`
- `group:messaging`: `message`
- `group:nodes`: `nodes`
- `group:agents`: `agents_list`, `update_plan`
- `group:media`: `image`, `image_generate`, `music_generate`, `video_generate`, `tts`
- `group:openclaw`: tất cả công cụ OpenClaw tích hợp sẵn (không bao gồm Plugin provider)
- `group:plugins`: tất cả công cụ thuộc Plugin đã tải, bao gồm các máy chủ MCP đã cấu hình được phơi bày qua `bundle-mcp`

Đối với máy chủ MCP bị cách ly, chính sách công cụ trong môi trường cách ly là một cổng cho phép thứ hai. Nếu `mcp.servers` đã được cấu hình nhưng các lượt bị cách ly chỉ hiển thị công cụ tích hợp sẵn, hãy thêm `bundle-mcp`, `group:plugins`, hoặc tên/glob công cụ MCP có tiền tố máy chủ như `outlook__send_mail` hoặc `outlook__*` vào `tools.sandbox.tools.alsoAllow`, rồi khởi động lại/tải lại gateway và ghi lại danh sách công cụ. Glob máy chủ dùng tiền tố máy chủ MCP an toàn cho provider: ký tự không thuộc `[A-Za-z0-9_-]` trở thành `-`, tên không bắt đầu bằng chữ cái nhận tiền tố `mcp-`, và tiền tố dài hoặc trùng lặp có thể bị cắt ngắn hoặc thêm hậu tố.

`openclaw doctor` hiện kiểm tra hình dạng này cho các máy chủ do OpenClaw quản lý trong `mcp.servers`. Máy chủ MCP được tải từ manifest Plugin đi kèm hoặc `.mcp.json` của Claude dùng cùng cổng môi trường cách ly, nhưng chẩn đoán này chưa liệt kê các nguồn đó; dùng cùng các mục allowlist nếu công cụ của chúng biến mất trong các lượt bị cách ly.

## Elevated: “chạy trên host” chỉ dành cho exec

Elevated **không** cấp thêm công cụ; nó chỉ ảnh hưởng đến `exec`.

- Nếu bạn đang bị cách ly, `/elevated on` (hoặc `exec` với `elevated: true`) chạy bên ngoài môi trường cách ly (phê duyệt vẫn có thể áp dụng).
- Dùng `/elevated full` để bỏ qua phê duyệt exec cho phiên.
- Nếu bạn đã chạy trực tiếp, elevated thực tế là không có tác dụng (vẫn bị kiểm soát bởi cổng).
- Elevated **không** bị giới hạn theo Skills và **không** ghi đè allow/deny của công cụ.
- Elevated không cấp quyền ghi đè xuyên host tùy ý từ `host=auto`; nó tuân theo các quy tắc đích exec thông thường và chỉ giữ `node` khi đích đã cấu hình/của phiên đã là `node`.
- `/exec` tách biệt với elevated. Nó chỉ điều chỉnh mặc định exec theo từng phiên cho người gửi được ủy quyền.

Các cổng:

- Bật tính năng: `tools.elevated.enabled` (và tùy chọn `agents.list[].tools.elevated.enabled`)
- Allowlist người gửi: `tools.elevated.allowFrom.<provider>` (và tùy chọn `agents.list[].tools.elevated.allowFrom.<provider>`)

Xem [Chế độ Elevated](/vi/tools/elevated).

## Các cách sửa “kẹt trong môi trường cách ly” thường gặp

### “Công cụ X bị chặn bởi chính sách công cụ trong môi trường cách ly”

Khóa sửa lỗi (chọn một):

- Tắt môi trường cách ly: `agents.defaults.sandbox.mode=off` (hoặc theo từng agent `agents.list[].sandbox.mode=off`)
- Cho phép công cụ bên trong môi trường cách ly:
  - xóa nó khỏi `tools.sandbox.tools.deny` (hoặc theo từng agent `agents.list[].tools.sandbox.tools.deny`)
  - hoặc thêm nó vào `tools.sandbox.tools.allow` (hoặc allow theo từng agent)
- Kiểm tra `openclaw logs` để tìm mục `agents/tool-policy`. Nó ghi lại chế độ môi trường cách ly và quy tắc allow hay deny đã chặn công cụ.

### “Tôi nghĩ đây là main, tại sao nó lại bị cách ly?”

Ở chế độ `"non-main"`, khóa nhóm/kênh _không_ phải main. Dùng khóa phiên main (được hiển thị bởi `sandbox explain`) hoặc chuyển chế độ sang `"off"`.

## Liên quan

- [Cơ chế cách ly](/vi/gateway/sandboxing) -- tài liệu tham chiếu đầy đủ về môi trường cách ly (chế độ, phạm vi, phần nền, image)
- [Môi trường cách ly & Công cụ đa agent](/vi/tools/multi-agent-sandbox-tools) -- ghi đè và thứ tự ưu tiên theo từng agent
- [Chế độ Elevated](/vi/tools/elevated)
