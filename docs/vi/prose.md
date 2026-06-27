---
read_when:
    - Bạn muốn chạy hoặc viết các tệp quy trình làm việc .prose
    - Bạn muốn bật Plugin OpenProse
    - Bạn cần hiểu cách OpenProse ánh xạ tới các nguyên thủy của OpenClaw
sidebarTitle: OpenProse
summary: OpenProse là định dạng quy trình làm việc ưu tiên Markdown cho các phiên AI đa tác nhân. Trong OpenClaw, nó được phát hành dưới dạng Plugin với lệnh gạch chéo /prose và một gói kỹ năng.
title: OpenProse
x-i18n:
    generated_at: "2026-06-27T18:00:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dde819215f99055c2a83ec32ed6e0700994654ca2d1d9c9dda98b71545f8a012
    source_path: prose.md
    workflow: 16
---

OpenProse là một định dạng quy trình làm việc di động, đặt Markdown làm trung tâm để điều phối các phiên AI. Trong OpenClaw, nó được phân phối dưới dạng một Plugin cài đặt gói Skills OpenProse và lệnh gạch chéo `/prose`. Các chương trình nằm trong tệp `.prose` và có thể sinh nhiều sub-agent với luồng điều khiển rõ ràng.

<CardGroup cols={3}>
  <Card title="Cài đặt" icon="download" href="#install">
    Bật Plugin OpenProse và khởi động lại Gateway.
  </Card>
  <Card title="Chạy chương trình" icon="play" href="#slash-command">
    Dùng `/prose run` để thực thi một tệp `.prose` hoặc chương trình từ xa.
  </Card>
  <Card title="Viết chương trình" icon="pencil" href="#example">
    Tạo quy trình làm việc đa agent với các bước song song và tuần tự.
  </Card>
</CardGroup>

## Cài đặt

<Steps>
  <Step title="Bật Plugin">
    Các Plugin được đóng gói sẵn bị tắt theo mặc định. Bật OpenProse:

    ```bash
    openclaw plugins enable open-prose
    ```

  </Step>
  <Step title="Khởi động lại Gateway">
    ```bash
    openclaw gateway restart
    ```
  </Step>
  <Step title="Xác minh">
    ```bash
    openclaw plugins list | grep prose
    ```

    Bạn sẽ thấy `open-prose` đã được bật. Lệnh Skills `/prose` hiện có sẵn
    trong chat.

  </Step>
</Steps>

Với một bản checkout cục bộ: `openclaw plugins install ./path/to/local/open-prose-plugin`

## Lệnh gạch chéo

OpenProse đăng ký `/prose` làm lệnh Skills mà người dùng có thể gọi:

```text
/prose help
/prose run <file.prose>
/prose run <handle/slug>
/prose run <https://example.com/file.prose>
/prose compile <file.prose>
/prose examples
/prose update
```

`/prose run <handle/slug>` phân giải thành `https://p.prose.md/<handle>/<slug>`.
URL trực tiếp được tìm nạp nguyên trạng bằng công cụ `web_fetch`.

Các lần chạy từ xa cấp cao nhất là rõ ràng. Các import từ xa bên trong một chương trình `.prose` là các phụ thuộc mã bắc cầu: trước khi OpenProse tìm nạp bất kỳ mục tiêu `use` từ xa nào, nó hiển thị danh sách import đã phân giải và yêu cầu người vận hành trả lời chính xác
`approve remote prose imports` cho lần chạy đó.

## Nó có thể làm gì

- Nghiên cứu và tổng hợp đa agent với tính song song rõ ràng.
- Quy trình làm việc lặp lại được và an toàn nhờ phê duyệt (review mã, phân loại sự cố, pipeline nội dung).
- Các chương trình `.prose` có thể tái sử dụng mà bạn có thể chạy trên các runtime agent được hỗ trợ.

## Ví dụ: nghiên cứu và tổng hợp song song

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

## Ánh xạ runtime OpenClaw

Các chương trình OpenProse ánh xạ tới các primitive của OpenClaw:

| Khái niệm OpenProse       | Công cụ OpenClaw |
| ------------------------- | ---------------- |
| Sinh phiên / công cụ Task | `sessions_spawn` |
| Đọc / ghi tệp             | `read` / `write` |
| Tìm nạp web               | `web_fetch`      |

<Warning>
  Nếu danh sách cho phép công cụ của bạn chặn `sessions_spawn`, `read`, `write`, hoặc
  `web_fetch`, các chương trình OpenProse sẽ thất bại. Kiểm tra
  [cấu hình danh sách cho phép công cụ](/vi/gateway/config-tools) của bạn.
</Warning>

## Vị trí tệp

OpenProse giữ trạng thái trong `.prose/` ở workspace của bạn:

```text
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

Các agent bền vững cấp người dùng nằm tại:

```text
~/.prose/agents/
```

## Backend trạng thái

<AccordionGroup>
  <Accordion title="hệ thống tệp (mặc định)">
    Trạng thái được ghi vào `.prose/runs/...` trong workspace. Không cần
    phụ thuộc bổ sung.
  </Accordion>
  <Accordion title="trong ngữ cảnh">
    Trạng thái tạm thời được giữ trong cửa sổ ngữ cảnh. Phù hợp với các
    chương trình nhỏ, tồn tại ngắn hạn.
  </Accordion>
  <Accordion title="sqlite (thử nghiệm)">
    Yêu cầu binary `sqlite3` trên `PATH`.
  </Accordion>
  <Accordion title="postgres (thử nghiệm)">
    Yêu cầu `psql` và chuỗi kết nối.

    <Warning>
      Thông tin xác thực Postgres đi vào log của sub-agent. Hãy dùng một
      cơ sở dữ liệu chuyên dụng, có đặc quyền tối thiểu.
    </Warning>

  </Accordion>
</AccordionGroup>

## Bảo mật

Hãy xem các tệp `.prose` như mã. Review chúng trước khi chạy, bao gồm các import
`use` từ xa. Các yêu cầu `/prose run https://...` cấp cao nhất là rõ ràng, nhưng
các import từ xa bắc cầu yêu cầu phê duyệt theo từng lần chạy trước khi chúng được
tìm nạp hoặc thực thi. Dùng danh sách cho phép công cụ và cổng phê duyệt của OpenClaw
để kiểm soát tác dụng phụ. Với các quy trình làm việc tất định, có cổng phê duyệt,
hãy so sánh với [Lobster](/vi/tools/lobster).

## Liên quan

<CardGroup cols={2}>
  <Card title="Tham chiếu Skills" href="/vi/tools/skills" icon="puzzle-piece">
    Cách gói Skills của OpenProse được tải và các cổng nào được áp dụng.
  </Card>
  <Card title="Subagents" href="/vi/tools/subagents" icon="users">
    Lớp điều phối đa agent gốc của OpenClaw.
  </Card>
  <Card title="Chuyển văn bản thành giọng nói" href="/vi/tools/tts" icon="volume-high">
    Thêm đầu ra âm thanh vào quy trình làm việc của bạn.
  </Card>
  <Card title="Lệnh gạch chéo" href="/vi/tools/slash-commands" icon="terminal">
    Tất cả lệnh chat có sẵn, bao gồm /prose.
  </Card>
</CardGroup>

Trang chính thức: [https://www.prose.md](https://www.prose.md)
