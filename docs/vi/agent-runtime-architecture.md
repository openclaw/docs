---
summary: 'Cách OpenClaw cấu trúc môi trường chạy tác nhân tích hợp sẵn: bố cục mã, ranh giới, tệp kê khai tài nguyên và lựa chọn môi trường chạy.'
title: Kiến trúc runtime của tác tử
x-i18n:
    generated_at: "2026-07-19T16:52:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 3e09ff21b4369a7c102db51e4458ad3ba1e86c9fe43a3a8bff72eef1713d2d51
    source_path: agent-runtime-architecture.md
    workflow: 16
---

OpenClaw sở hữu runtime agent tích hợp sẵn. Mã runtime nằm trong `src/agents/`, cơ chế truyền tải mô hình/nhà cung cấp nằm trong `src/llm/`, và các hợp đồng dành cho plugin được cung cấp qua các barrel `openclaw/plugin-sdk/*`.

## Bố cục Runtime

| Đường dẫn                          | Phạm vi phụ trách                                                                                                                                                                                                          |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/agents/embedded-agent-runner/` | Vòng lặp thử tích hợp sẵn (`run.ts`, `run/`), lựa chọn mô hình và chuẩn hóa nhà cung cấp (`model*.ts`), tham số yêu cầu theo từng nhà cung cấp (`extra-params.*`), Compaction, kết nối bản chép lời và phiên.                            |
| `src/agents/sessions/`              | Duy trì phiên (`session-manager.ts`), khám phá tài nguyên (`package-manager.ts`, `resource-loader.ts`), tải `extensions` trong phiên, mẫu prompt, Skills, chủ đề và trình kết xuất công cụ dựa trên TUI (`tools/`). |
| `packages/agent-core/`              | Lõi agent có thể tái sử dụng (`@openclaw/agent-core`): vòng lặp agent, kiểu harness, thông điệp, trình trợ giúp Compaction, mẫu prompt, Skills và hợp đồng lưu trữ phiên.                                                           |
| `src/agents/runtime/`               | Facade OpenClaw kết nối `@openclaw/agent-core` với runtime LLM của SDK plugin, đồng thời tái xuất runtime này cùng các tiện ích proxy cục bộ.                                                                                             |
| `src/agents/agent-tools*.ts`        | Định nghĩa công cụ do OpenClaw sở hữu, schema tham số, chính sách công cụ, adapter trước/sau lệnh gọi công cụ và công cụ chỉnh sửa máy chủ/sandbox.                                                                                            |
| `src/agents/agent-hooks/`           | Hook runtime tích hợp sẵn: biện pháp bảo vệ Compaction, hướng dẫn Compaction, lược bớt ngữ cảnh.                                                                                                                                   |
| `src/agents/harness/`               | Registry harness, chính sách lựa chọn và vòng đời cho các harness tích hợp sẵn và do plugin đăng ký.                                                                                                                       |
| `src/llm/`                          | Registry mô hình/nhà cung cấp, trình trợ giúp truyền tải và các triển khai luồng dành riêng cho nhà cung cấp (`src/llm/providers/`).                                                                                                          |

## Ranh giới

Lõi gọi runtime tích hợp sẵn thông qua các mô-đun OpenClaw và barrel SDK; không còn gói framework agent bên ngoài nào. Plugin sử dụng các điểm vào `openclaw/plugin-sdk/*` đã được lập tài liệu và không nhập các thành phần nội bộ của `src/**`.

`@earendil-works/pi-tui` vẫn là một phần phụ thuộc bên thứ ba: bộ công cụ thành phần terminal được TUI cục bộ và trình kết xuất công cụ phiên sử dụng. Việc nội bộ hóa bộ công cụ này sẽ là một nỗ lực đưa mã nguồn bên ngoài vào dự án riêng biệt.

## Manifest

Các gói tài nguyên khai báo tài nguyên OpenClaw trong siêu dữ liệu `package.json`. Các mục là đường dẫn tệp hoặc glob tương đối so với thư mục gốc của gói:

```json
{
  "openclaw": {
    "extensions": ["extensions/index.ts"],
    "skills": ["skills/*.md"],
    "prompts": ["prompts/*.md"],
    "themes": ["themes/*.json"]
  }
}
```

Các loại tài nguyên không được liệt kê trong manifest sẽ dùng cơ chế dự phòng là khám phá các thư mục quy ước `extensions/`, `skills/`, `prompts/` và `themes/`.

## Lựa chọn Runtime

- ID runtime tích hợp sẵn là `openclaw`. Bí danh cũ `pi` được chuẩn hóa thành `openclaw`; `codex-app-server` được chuẩn hóa thành `codex`.
- Các harness plugin đăng ký thêm ID runtime (ví dụ: `codex`).
- Chính sách runtime là cấu hình `agentRuntime.id` theo phạm vi mô hình/nhà cung cấp (mục mô hình được ưu tiên hơn mục nhà cung cấp). Giá trị chưa đặt hoặc `default` được phân giải thành `auto`.
- `auto` chọn một harness plugin đã đăng ký có hỗ trợ tuyến nhà cung cấp hiệu lực; nếu không, runtime OpenClaw tích hợp sẵn sẽ được chọn. Chỉ riêng tiền tố nhà cung cấp hoặc mô hình không bao giờ chọn harness.
- OpenAI chỉ có thể ngầm chọn `codex` cho một tuyến HTTPS chính thức khớp chính xác của Platform Responses hoặc ChatGPT Responses và không có ghi đè yêu cầu do người dùng định nghĩa. Các adapter Completions, điểm cuối tùy chỉnh và tuyến có hành vi yêu cầu do người dùng định nghĩa vẫn dùng `openclaw`; các điểm cuối HTTP văn bản thuần chính thức bị từ chối. Xem [runtime agent ngầm định của OpenAI](/vi/providers/openai#implicit-agent-runtime).

## Các thế hệ Runtime mô hình

Quá trình khởi động Gateway và việc công bố cấu hình, plugin hoặc xác thực tạo một thế hệ runtime mô hình đã chuẩn bị cho mỗi agent được cấu hình. Mỗi thế hệ sở hữu mẫu xác thực đã khám phá, registry mô hình và danh mục mô hình đã chiếu dưới dạng một ảnh chụp nhanh nguyên tử duy nhất. Các lần chạy agent tạo bản sao kho xác thực và registry có thể thay đổi từ ảnh chụp nhanh đó; các đường dẫn duyệt, trạng thái, Cron, doctor, TUI, PDF và hình ảnh đọc danh mục đã công bố thay vì lặp lại việc khám phá hệ thống tệp.

Các runtime nhúng độc lập công bố cùng một dạng ảnh chụp nhanh tại ranh giới kích hoạt của chúng. Một thế hệ lỗi hoặc cũ không bao giờ được phục vụ cùng với một thế hệ mới hơn nhưng chưa hoàn chỉnh; chủ sở hữu vòng đời phải công bố một bản thay thế hoàn chỉnh trước.

## Liên quan

- [Quy trình runtime agent OpenClaw](/vi/openclaw-agent-runtime)
- [Các runtime agent](/vi/concepts/agent-runtimes)
