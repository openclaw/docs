---
read_when:
    - Làm việc với mã runtime hoặc các bài kiểm thử của tác tử OpenClaw
    - Chạy các quy trình lint, kiểm tra kiểu và kiểm thử trực tiếp cho môi trường chạy tác tử
summary: 'Quy trình làm việc dành cho nhà phát triển đối với môi trường chạy tác nhân OpenClaw: xây dựng, kiểm thử và xác thực trực tiếp'
title: Quy trình runtime của tác tử OpenClaw
x-i18n:
    generated_at: "2026-07-16T14:37:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 044f05779bef4ad18478081ba44d84356723c8a0be764440aa9d2b976d167324
    source_path: openclaw-agent-runtime.md
    workflow: 16
---

Quy trình làm việc dành cho nhà phát triển đối với runtime của agent (`src/agents/`) trong kho lưu trữ OpenClaw.

## Kiểm tra kiểu và lint

- Cổng kiểm tra cục bộ mặc định: `pnpm check` (kiểm tra kiểu, lint, các biện pháp bảo vệ chính sách)
- Cổng kiểm tra bản dựng: `pnpm build` khi thay đổi có thể ảnh hưởng đến đầu ra bản dựng, việc đóng gói hoặc các ranh giới tải lười/mô-đun
- Cổng kiểm tra đầy đủ trước khi đẩy lên: `pnpm build && pnpm check && pnpm check:test-types && pnpm test`

## Chạy các bài kiểm thử runtime của agent

Chạy các bộ kiểm thử đơn vị cho runtime của agent:

```bash
pnpm test \
  "src/agents/agent-*.test.ts" \
  "src/agents/embedded-agent-*.test.ts" \
  "src/agents/agent-hooks/**/*.test.ts"
```

Mẫu glob đầu tiên cũng bao gồm các bộ kiểm thử `agent-tools*`, `agent-settings` và
`agent-tool-definition-adapter*`.

Các bài kiểm thử trực tiếp bị loại khỏi cấu hình kiểm thử đơn vị; hãy chạy chúng thông qua
trình bao kiểm thử trực tiếp (thiết lập `OPENCLAW_LIVE_TEST=1` và yêu cầu thông tin xác thực của nhà cung cấp):

```bash
pnpm test:live src/agents/embedded-agent-runner-extraparams.live.test.ts
```

## Kiểm thử thủ công

- Chạy Gateway ở chế độ phát triển (bỏ qua kết nối kênh thông qua `OPENCLAW_SKIP_CHANNELS=1`): `pnpm gateway:dev`
- Kích hoạt một lượt agent thông qua Gateway: `pnpm openclaw agent --message "Hello" --thinking low`
- Sử dụng TUI để gỡ lỗi tương tác: `pnpm tui`

Để kiểm tra hành vi gọi công cụ, hãy yêu cầu một thao tác `read` hoặc `exec` để có thể theo dõi
việc truyền trực tuyến từ công cụ và xử lý tải trọng.

## Đặt lại về trạng thái sạch

Trạng thái nằm trong thư mục trạng thái của OpenClaw: mặc định là `~/.openclaw`, hoặc
`$OPENCLAW_STATE_DIR` khi được thiết lập. Các đường dẫn tương đối với thư mục đó:

| Đường dẫn                                      | Nội dung lưu trữ                                                    |
| ---------------------------------------------- | ------------------------------------------------------------------ |
| `openclaw.json`                                | Cấu hình                                                            |
| `state/openclaw.sqlite`                        | Cơ sở dữ liệu trạng thái runtime dùng chung                         |
| `agents/<agentId>/agent/openclaw-agent.sqlite` | Hồ sơ xác thực mô hình theo từng agent (khóa API + OAuth) và trạng thái runtime |
| `credentials/`                                 | Thông tin xác thực của nhà cung cấp/kênh nằm ngoài kho hồ sơ xác thực |
| `agents/<agentId>/sessions/`                   | Lịch sử bản chép lời và nguồn di chuyển phiên cũ                    |
| `sessions/`                                    | Kho phiên một agent cũ (chỉ dành cho các bản cài đặt cũ)           |
| `workspace/`                                   | Không gian làm việc mặc định của agent (các agent bổ sung sử dụng `workspace-<agentId>`)   |

Xóa các đường dẫn đó để đặt lại hoàn toàn. Các tùy chọn đặt lại có phạm vi hẹp hơn:

- Chỉ phiên: không xóa `agents/<agentId>/agent/openclaw-agent.sqlite`; các hàng phiên nằm ở đó cùng với trạng thái khác theo từng agent. Sử dụng `/new` hoặc `/reset` để bắt đầu một phiên mới cho một cuộc trò chuyện và `openclaw sessions cleanup` để bảo trì phiên.
- Giữ lại xác thực: giữ nguyên `agents/<agentId>/agent/openclaw-agent.sqlite` và `credentials/`.

Các tệp `auth-profiles.json` cũ không còn được đọc trong thời gian chạy;
`openclaw doctor --fix` nhập chúng vào kho SQLite.

## Tài liệu tham khảo

- [Kiểm thử](/vi/help/testing)
- [Bắt đầu](/vi/start/getting-started)

## Liên quan

- [Kiến trúc runtime của agent OpenClaw](/vi/agent-runtime-architecture)
