---
read_when:
    - Bạn muốn chạy hoặc viết các tệp quy trình làm việc `.prose`
    - Bạn muốn bật Plugin OpenProse
    - Bạn cần hiểu cách OpenProse ánh xạ tới các thành phần nguyên thủy của OpenClaw
sidebarTitle: OpenProse
summary: OpenProse là một định dạng quy trình làm việc ưu tiên Markdown dành cho các phiên AI đa tác nhân. Trong OpenClaw, định dạng này được phân phối dưới dạng Plugin kèm theo lệnh gạch chéo `/prose` và một bộ Skills.
title: OpenProse
x-i18n:
    generated_at: "2026-07-12T08:19:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8b04eb23bf827fbec6db11c1e95993e7f6c617451c5f4fda771ad078674c12bc
    source_path: prose.md
    workflow: 16
---

OpenProse là một định dạng quy trình làm việc di động, ưu tiên Markdown để điều phối các phiên AI. Trong OpenClaw, định dạng này được cung cấp dưới dạng một Plugin cài đặt gói Skills OpenProse và lệnh gạch chéo `/prose`. Các chương trình nằm trong tệp `.prose` và có thể khởi tạo nhiều tác tử con với luồng điều khiển tường minh.

<CardGroup cols={3}>
  <Card title="Cài đặt" icon="download" href="#install">
    Bật Plugin OpenProse và khởi động lại Gateway.
  </Card>
  <Card title="Chạy chương trình" icon="play" href="#slash-command">
    Dùng `/prose run` để thực thi tệp `.prose` hoặc chương trình từ xa.
  </Card>
  <Card title="Viết chương trình" icon="pencil" href="#example-parallel-research-and-synthesis">
    Xây dựng quy trình làm việc đa tác tử với các bước song song và tuần tự.
  </Card>
</CardGroup>

## Cài đặt

<Steps>
  <Step title="Bật Plugin">
    OpenProse được đóng gói sẵn nhưng mặc định bị tắt. Bật Plugin này:

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

    Bạn sẽ thấy `open-prose` đã được bật. Lệnh Skills `/prose` hiện đã khả dụng trong cuộc trò chuyện.

  </Step>
</Steps>

Từ một bản sao làm việc của kho mã, bạn có thể cài đặt trực tiếp Plugin:
`openclaw plugins install ./extensions/open-prose`

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

`/prose run <handle/slug>` được phân giải thành `https://p.prose.md/<handle>/<slug>`.
Các URL trực tiếp được truy xuất nguyên trạng bằng công cụ `web_fetch`.

Các lần chạy từ xa ở cấp cao nhất phải được chỉ định tường minh. Các lệnh nhập từ xa bên trong chương trình `.prose` là những phần phụ thuộc mã có tính bắc cầu: trước khi OpenProse truy xuất bất kỳ đích `use` từ xa nào, hệ thống sẽ hiển thị danh sách lệnh nhập đã phân giải và yêu cầu người vận hành trả lời chính xác `approve remote prose imports` cho lần chạy đó.

## Khả năng

- Nghiên cứu và tổng hợp đa tác tử với cơ chế song song tường minh.
- Quy trình làm việc có thể lặp lại và an toàn nhờ cơ chế phê duyệt (đánh giá mã, phân loại sự cố, quy trình nội dung).
- Các chương trình `.prose` có thể tái sử dụng và chạy trên nhiều môi trường thực thi tác tử được hỗ trợ.

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

## Ánh xạ môi trường thực thi OpenClaw

Các chương trình OpenProse ánh xạ tới những thành phần cơ bản của OpenClaw:

| Khái niệm OpenProse       | Công cụ OpenClaw                                 |
| ------------------------- | ----------------------------------------------- |
| Khởi tạo phiên / Công cụ tác vụ | `sessions_spawn`                           |
| Đọc / ghi tệp             | `read` / `write`                                |
| Truy xuất web             | `web_fetch` (`exec` + curl khi cần POST)        |

<Warning>
  Nếu danh sách cho phép công cụ của bạn chặn `sessions_spawn`, `read`, `write` hoặc `web_fetch`, các chương trình OpenProse sẽ thất bại. Hãy kiểm tra [cấu hình danh sách cho phép công cụ](/vi/gateway/config-tools).
</Warning>

## Vị trí tệp

OpenProse lưu trạng thái trong `.prose/` thuộc không gian làm việc của bạn:

```text
.prose/
├── .env                      # config (key=value), e.g. OPENPROSE_POSTGRES_URL
├── runs/
│   └── {YYYYMMDD}-{HHMMSS}-{random}/
│       ├── program.prose     # copy of the running program
│       ├── state.md          # execution state
│       ├── bindings/
│       ├── imports/          # nested remote program runs
│       └── agents/
└── agents/                   # project-scoped persistent agents
```

Các tác tử lưu bền ở cấp người dùng (dùng chung giữa các dự án) nằm tại:

```text
~/.prose/agents/
```

## Phần phụ trợ trạng thái

<AccordionGroup>
  <Accordion title="hệ thống tệp (mặc định)">
    Trạng thái được ghi vào `.prose/runs/...` trong không gian làm việc. Không yêu cầu phần phụ thuộc bổ sung.
  </Accordion>
  <Accordion title="trong ngữ cảnh">
    Trạng thái tạm thời được giữ trong cửa sổ ngữ cảnh; chọn bằng `--in-context`.
    Phù hợp với các chương trình nhỏ, thời gian chạy ngắn.
  </Accordion>
  <Accordion title="sqlite (thử nghiệm)">
    Chọn bằng `--state=sqlite`. Yêu cầu tệp nhị phân `sqlite3` có trong `PATH`
    (chuyển về hệ thống tệp khi không tìm thấy); trạng thái được lưu vào
    `.prose/runs/{id}/state.db`.
  </Accordion>
  <Accordion title="postgres (thử nghiệm)">
    Chọn bằng `--state=postgres`. Yêu cầu `psql` và chuỗi kết nối trong
    `OPENPROSE_POSTGRES_URL` (đặt trong `.prose/.env`).

    <Warning>
      Thông tin xác thực Postgres sẽ được truyền vào nhật ký của tác tử con. Hãy dùng cơ sở dữ liệu chuyên dụng với đặc quyền tối thiểu.
    </Warning>

  </Accordion>
</AccordionGroup>

## Bảo mật

Hãy coi các tệp `.prose` như mã nguồn. Xem xét chúng trước khi chạy, bao gồm cả các lệnh nhập `use` từ xa. Các yêu cầu `/prose run https://...` cấp cao nhất phải được chỉ định tường minh, nhưng các lệnh nhập từ xa có tính bắc cầu cần được phê duyệt riêng cho từng lần chạy trước khi được truy xuất hoặc thực thi. Sử dụng danh sách cho phép công cụ và các cổng phê duyệt của OpenClaw để kiểm soát tác dụng phụ. Đối với quy trình làm việc có tính tất định và chịu sự kiểm soát của cơ chế phê duyệt, hãy so sánh với [Lobster](/vi/tools/lobster).

## Liên quan

<CardGroup cols={2}>
  <Card title="Tài liệu tham khảo về Skills" href="/vi/tools/skills" icon="puzzle-piece">
    Cách gói Skills của OpenProse được tải và các cổng kiểm soát được áp dụng.
  </Card>
  <Card title="Tác tử con" href="/vi/tools/subagents" icon="users">
    Lớp điều phối đa tác tử nguyên bản của OpenClaw.
  </Card>
  <Card title="Chuyển văn bản thành giọng nói" href="/vi/tools/tts" icon="volume-high">
    Thêm đầu ra âm thanh vào quy trình làm việc của bạn.
  </Card>
  <Card title="Lệnh gạch chéo" href="/vi/tools/slash-commands" icon="terminal">
    Tất cả lệnh trò chuyện khả dụng, bao gồm /prose.
  </Card>
</CardGroup>

Trang web chính thức: [https://www.prose.md](https://www.prose.md)
