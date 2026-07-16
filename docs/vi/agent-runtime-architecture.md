---
summary: 'Cách OpenClaw tổ chức runtime tác nhân tích hợp sẵn: bố cục mã, ranh giới, tệp kê khai tài nguyên và lựa chọn runtime.'
title: Kiến trúc môi trường thực thi của tác tử
x-i18n:
    generated_at: "2026-07-16T14:00:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 071a0cb076230ce02f2c2c1c21971379cf617f24faa8a9733570aae30a062019
    source_path: agent-runtime-architecture.md
    workflow: 16
---

OpenClaw sở hữu runtime tác nhân tích hợp sẵn. Mã runtime nằm trong `src/agents/`, cơ chế truyền tải mô hình/nhà cung cấp nằm trong `src/llm/`, và các hợp đồng dành cho plugin được cung cấp thông qua các barrel `openclaw/plugin-sdk/*`.

## Bố cục runtime

| Đường dẫn                          | Phụ trách                                                                                                                                                                                                                 |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/agents/embedded-agent-runner/` | Vòng lặp thử tích hợp sẵn (`run.ts`, `run/`), lựa chọn mô hình và chuẩn hóa nhà cung cấp (`model*.ts`), tham số yêu cầu theo từng nhà cung cấp (`extra-params.*`), Compaction, cùng cơ chế kết nối bản ghi hội thoại và phiên.                            |
| `src/agents/sessions/`              | Lưu bền phiên (`session-manager.ts`), khám phá tài nguyên (`package-manager.ts`, `resource-loader.ts`), tải `extensions` trong phiên, mẫu lời nhắc, Skills, chủ đề và trình kết xuất công cụ dựa trên TUI (`tools/`). |
| `packages/agent-core/`              | Lõi tác nhân có thể tái sử dụng (`@openclaw/agent-core`): vòng lặp tác nhân, kiểu harness, thông điệp, trình trợ giúp Compaction, mẫu lời nhắc, Skills và hợp đồng lưu trữ phiên.                                                           |
| `src/agents/runtime/`               | Facade OpenClaw kết nối `@openclaw/agent-core` với runtime LLM của SDK plugin, đồng thời tái xuất runtime này cùng các tiện ích proxy cục bộ.                                                                                             |
| `src/agents/agent-tools*.ts`        | Định nghĩa công cụ do OpenClaw sở hữu, lược đồ tham số, chính sách công cụ, bộ điều hợp trước/sau lệnh gọi công cụ và công cụ chỉnh sửa máy chủ/sandbox.                                                                                            |
| `src/agents/agent-hooks/`           | Các hook runtime tích hợp sẵn: biện pháp bảo vệ Compaction, hướng dẫn Compaction, cắt tỉa ngữ cảnh.                                                                                                                                   |
| `src/agents/harness/`               | Sổ đăng ký harness, chính sách lựa chọn và vòng đời dành cho harness tích hợp sẵn cũng như harness do plugin đăng ký.                                                                                                                       |
| `src/llm/`                          | Sổ đăng ký mô hình/nhà cung cấp, trình trợ giúp truyền tải và các triển khai luồng dành riêng cho nhà cung cấp (`src/llm/providers/`).                                                                                                          |

## Ranh giới

Lõi gọi runtime tích hợp sẵn thông qua các mô-đun OpenClaw và barrel SDK; không còn gói framework tác nhân bên ngoài nào. Plugin sử dụng các điểm vào `openclaw/plugin-sdk/*` đã được lập tài liệu và không nhập các thành phần nội bộ của `src/**`.

`@earendil-works/pi-tui` vẫn là một phần phụ thuộc bên thứ ba: bộ công cụ thành phần terminal được TUI cục bộ và các trình kết xuất công cụ phiên sử dụng. Việc nội bộ hóa phần phụ thuộc này sẽ là một nỗ lực đưa mã nguồn bên thứ ba vào dự án riêng biệt.

## Manifest

Các gói tài nguyên khai báo tài nguyên OpenClaw trong metadata `package.json`. Các mục là đường dẫn tệp hoặc mẫu glob tương đối so với thư mục gốc của gói:

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

Các loại tài nguyên không được liệt kê trong manifest sẽ chuyển về cơ chế khám phá các thư mục quy ước `extensions/`, `skills/`, `prompts/` và `themes/`.

## Lựa chọn runtime

- ID runtime tích hợp sẵn là `openclaw`. Bí danh cũ `pi` được chuẩn hóa thành `openclaw`; `codex-app-server` được chuẩn hóa thành `codex`.
- Các harness plugin đăng ký thêm ID runtime (ví dụ: `codex`).
- Chính sách runtime là cấu hình `agentRuntime.id` theo phạm vi mô hình/nhà cung cấp (mục mô hình được ưu tiên hơn mục nhà cung cấp). Giá trị chưa đặt hoặc `default` được phân giải thành `auto`.
- `auto` chọn một harness plugin đã đăng ký có hỗ trợ tuyến nhà cung cấp hiệu lực; nếu không, runtime OpenClaw tích hợp sẵn sẽ được chọn. Chỉ riêng tiền tố nhà cung cấp hoặc mô hình không bao giờ chọn harness.
- OpenAI chỉ có thể ngầm chọn `codex` cho một tuyến HTTPS chính thức khớp chính xác của Platform Responses hoặc ChatGPT Responses và không có tùy chỉnh yêu cầu do tác giả chỉ định. Các bộ điều hợp Completions, điểm cuối tùy chỉnh và tuyến có hành vi yêu cầu do tác giả chỉ định vẫn sử dụng `openclaw`; các điểm cuối HTTP văn bản thuần chính thức bị từ chối. Xem [runtime tác nhân ngầm định của OpenAI](/vi/providers/openai#implicit-agent-runtime).

## Liên quan

- [Quy trình runtime tác nhân OpenClaw](/vi/openclaw-agent-runtime)
- [Các runtime tác nhân](/vi/concepts/agent-runtimes)
