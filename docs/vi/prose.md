---
read_when:
    - Bạn muốn chạy hoặc viết các quy trình làm việc .prose
    - Bạn muốn bật Plugin OpenProse
    - Bạn cần hiểu về lưu trữ trạng thái
summary: 'OpenProse: quy trình làm việc .prose, lệnh gạch chéo và trạng thái trong OpenClaw'
title: OpenProse
x-i18n:
    generated_at: "2026-04-29T23:04:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: e1d6f3aa64c403daedaeaa2d7934b8474c0756fe09eed09efd1efeef62413e9e
    source_path: prose.md
    workflow: 16
---

OpenProse là một định dạng quy trình làm việc ưu tiên markdown, có tính di động để điều phối các phiên AI. Trong OpenClaw, nó được cung cấp dưới dạng Plugin cài đặt một gói kỹ năng OpenProse cùng với lệnh slash `/prose`. Các chương trình nằm trong tệp `.prose` và có thể tạo nhiều sub-agent với luồng điều khiển rõ ràng.

Trang chính thức: [https://www.prose.md](https://www.prose.md)

## Những gì nó có thể làm

- Nghiên cứu đa tác nhân + tổng hợp với cơ chế song song rõ ràng.
- Quy trình làm việc lặp lại được và an toàn về phê duyệt (đánh giá mã, phân loại sự cố, pipeline nội dung).
- Các chương trình `.prose` có thể tái sử dụng mà bạn có thể chạy trên các runtime tác nhân được hỗ trợ.

## Cài đặt + bật

Các Plugin đi kèm bị tắt theo mặc định. Bật OpenProse:

```bash
openclaw plugins enable open-prose
```

Khởi động lại Gateway sau khi bật Plugin.

Bản checkout dev/cục bộ: `openclaw plugins install ./path/to/local/open-prose-plugin`

Tài liệu liên quan: [Plugin](/vi/tools/plugin), [Plugin manifest](/vi/plugins/manifest), [Skills](/vi/tools/skills).

## Lệnh slash

OpenProse đăng ký `/prose` làm lệnh kỹ năng mà người dùng có thể gọi. Nó định tuyến đến hướng dẫn VM OpenProse và dùng các công cụ OpenClaw ở bên dưới.

Các lệnh thường dùng:

```
/prose help
/prose run <file.prose>
/prose run <handle/slug>
/prose run <https://example.com/file.prose>
/prose compile <file.prose>
/prose examples
/prose update
```

## Ví dụ: một tệp `.prose` đơn giản

```prose
# Research + synthesis with two agents running in parallel.

input topic: "What should we research?"

agent researcher:
  model: sonnet
  prompt: "You research thoroughly and cite sources."

agent writer:
  model: opus
  prompt: "You write a concise summary."

parallel:
  findings = session: researcher
    prompt: "Research {topic}."
  draft = session: writer
    prompt: "Summarize {topic}."

session "Merge the findings + draft into a final answer."
context: { findings, draft }
```

## Vị trí tệp

OpenProse giữ trạng thái trong `.prose/` ở workspace của bạn:

```
.prose/
├── .env
├── runs/
│   └── {YYYYMMDD}-{HHMMSS}-{random}/
│       ├── program.prose
│       ├── state.md
│       ├── bindings/
│       └── agents/
└── agents/
```

Các tác nhân liên tục ở cấp người dùng nằm tại:

```
~/.prose/agents/
```

## Chế độ trạng thái

OpenProse hỗ trợ nhiều backend trạng thái:

- **filesystem** (mặc định): `.prose/runs/...`
- **in-context**: tạm thời, cho các chương trình nhỏ
- **sqlite** (thử nghiệm): yêu cầu binary `sqlite3`
- **postgres** (thử nghiệm): yêu cầu `psql` và một chuỗi kết nối

Ghi chú:

- sqlite/postgres là tùy chọn bật và đang thử nghiệm.
- thông tin xác thực postgres đi vào nhật ký subagent; hãy dùng một DB chuyên dụng với đặc quyền tối thiểu.

## Chương trình từ xa

`/prose run <handle/slug>` phân giải thành `https://p.prose.md/<handle>/<slug>`.
URL trực tiếp được tải nguyên trạng. Việc này dùng công cụ `web_fetch` (hoặc `exec` cho POST).

## Ánh xạ runtime OpenClaw

Các chương trình OpenProse ánh xạ sang các primitive của OpenClaw:

| Khái niệm OpenProse       | Công cụ OpenClaw |
| ------------------------- | ---------------- |
| Spawn session / Task tool | `sessions_spawn` |
| File read/write           | `read` / `write` |
| Web fetch                 | `web_fetch`      |

Nếu allowlist công cụ của bạn chặn các công cụ này, chương trình OpenProse sẽ thất bại. Xem [Cấu hình Skills](/vi/tools/skills-config).

## Bảo mật + phê duyệt

Hãy xem tệp `.prose` như mã. Xem xét trước khi chạy. Dùng allowlist công cụ và cổng phê duyệt của OpenClaw để kiểm soát tác dụng phụ.

Đối với quy trình làm việc có tính xác định và được kiểm soát bằng phê duyệt, hãy so sánh với [Lobster](/vi/tools/lobster).

## Liên quan

- [Chuyển văn bản thành giọng nói](/vi/tools/tts)
- [Định dạng Markdown](/vi/concepts/markdown-formatting)
