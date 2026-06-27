---
read_when:
    - Làm việc trên mã hoặc bài kiểm thử runtime agent của OpenClaw
    - Đang chạy các luồng lint, kiểm tra kiểu và kiểm thử trực tiếp của agent-runtime
summary: 'Quy trình làm việc dành cho nhà phát triển cho runtime tác nhân OpenClaw: xây dựng, kiểm thử và xác thực trực tiếp'
title: Quy trình làm việc của runtime tác tử OpenClaw
x-i18n:
    generated_at: "2026-06-27T17:40:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fbe2a192ff7954577f8cbeae33676cbfd330f297d31c1917d2ab52898c2c5064
    source_path: openclaw-agent-runtime.md
    workflow: 16
---

Một quy trình hợp lý để làm việc trên thời gian chạy agent OpenClaw trong OpenClaw.

## Kiểm tra kiểu và lint

- Cổng kiểm tra cục bộ mặc định: `pnpm check`
- Cổng build: `pnpm build` khi thay đổi có thể ảnh hưởng đến đầu ra build, đóng gói, hoặc ranh giới lazy-loading/module
- Cổng đầy đủ trước khi land cho thay đổi thời gian chạy agent: `pnpm check && pnpm test`

## Chạy kiểm thử thời gian chạy agent

Chạy trực tiếp bộ kiểm thử thời gian chạy agent bằng Vitest:

```bash
pnpm test \
  "src/agents/agent-*.test.ts" \
  "src/agents/embedded-agent-*.test.ts" \
  "src/agents/agent-tools*.test.ts" \
  "src/agents/agent-settings.test.ts" \
  "src/agents/agent-tool-definition-adapter*.test.ts" \
  "src/agents/agent-hooks/**/*.test.ts"
```

Để bao gồm bài kiểm tra nhà cung cấp trực tiếp:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test src/agents/embedded-agent-runner-extraparams.live.test.ts
```

Phần này bao phủ các bộ kiểm thử đơn vị chính của thời gian chạy agent:

- `src/agents/agent-*.test.ts`
- `src/agents/embedded-agent-*.test.ts`
- `src/agents/agent-tools*.test.ts`
- `src/agents/agent-settings.test.ts`
- `src/agents/agent-tool-definition-adapter.test.ts`
- `src/agents/agent-hooks/*.test.ts`

## Kiểm thử thủ công

Luồng được khuyến nghị:

- Chạy Gateway ở chế độ dev:
  - `pnpm gateway:dev`
- Kích hoạt agent trực tiếp:
  - `pnpm openclaw agent --message "Hello" --thinking low`
- Dùng TUI để gỡ lỗi tương tác:
  - `pnpm tui`

Đối với hành vi gọi công cụ, hãy yêu cầu một hành động `read` hoặc `exec` để bạn có thể thấy quá trình truyền công cụ và xử lý payload.

## Đặt lại từ đầu

Trạng thái nằm trong thư mục trạng thái OpenClaw. Mặc định là `~/.openclaw`. Nếu `OPENCLAW_STATE_DIR` được đặt, hãy dùng thư mục đó thay thế.

Để đặt lại mọi thứ:

- `openclaw.json` cho cấu hình
- `agents/<agentId>/agent/auth-profiles.json` cho hồ sơ xác thực mô hình (khóa API + OAuth)
- `credentials/` cho trạng thái nhà cung cấp/kênh vẫn còn nằm ngoài kho hồ sơ xác thực
- `agents/<agentId>/sessions/` cho lịch sử phiên agent
- `agents/<agentId>/sessions/sessions.json` cho chỉ mục phiên
- `sessions/` nếu các đường dẫn legacy tồn tại
- `workspace/` nếu bạn muốn một workspace trống

Nếu bạn chỉ muốn đặt lại phiên, hãy xóa `agents/<agentId>/sessions/` cho agent đó. Nếu bạn muốn giữ xác thực, hãy giữ nguyên `agents/<agentId>/agent/auth-profiles.json` và mọi trạng thái nhà cung cấp trong `credentials/`.

## Tham khảo

- [Kiểm thử](/vi/help/testing)
- [Bắt đầu](/vi/start/getting-started)

## Liên quan

- [Kiến trúc thời gian chạy agent OpenClaw](/vi/agent-runtime-architecture)
