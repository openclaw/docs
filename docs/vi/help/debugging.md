---
read_when:
    - Bạn cần kiểm tra đầu ra thô của mô hình để phát hiện rò rỉ nội dung lập luận
    - Bạn muốn chạy Gateway ở chế độ theo dõi trong quá trình phát triển lặp lại
    - Bạn cần một quy trình gỡ lỗi có thể lặp lại
summary: 'Công cụ gỡ lỗi: chế độ theo dõi, luồng thô từ mô hình và truy vết rò rỉ lập luận'
title: Gỡ lỗi
x-i18n:
    generated_at: "2026-05-03T21:33:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7230112013a8db8d6a3853b765f4302a61609051ac4ffaf35a6f09de328deafc
    source_path: help/debugging.md
    workflow: 16
---

Trình trợ giúp gỡ lỗi cho đầu ra phát trực tuyến, đặc biệt khi một nhà cung cấp trộn phần lập luận vào văn bản thông thường.

## Ghi đè gỡ lỗi thời gian chạy

Dùng `/debug` trong chat để đặt các ghi đè cấu hình **chỉ trong thời gian chạy** (trong bộ nhớ, không ghi ra đĩa).
`/debug` bị tắt theo mặc định; bật bằng `commands.debug: true`.
Điều này hữu ích khi bạn cần bật/tắt các thiết lập khó thấy mà không chỉnh sửa `openclaw.json`.

Ví dụ:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset` xóa toàn bộ ghi đè và quay lại cấu hình trên đĩa.

## Đầu ra trace phiên

Dùng `/trace` khi bạn muốn xem các dòng trace/gỡ lỗi do Plugin sở hữu trong một phiên
mà không bật toàn bộ chế độ verbose.

Ví dụ:

```text
/trace
/trace on
/trace off
```

Dùng `/trace` cho chẩn đoán Plugin, chẳng hạn như tóm tắt gỡ lỗi Active Memory.
Tiếp tục dùng `/verbose` cho đầu ra trạng thái/công cụ verbose thông thường, và tiếp tục dùng
`/debug` cho ghi đè cấu hình chỉ trong thời gian chạy.

## Trace vòng đời Plugin

Dùng `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` khi các lệnh vòng đời Plugin có vẻ chậm
và bạn cần phần phân tích pha tích hợp sẵn cho siêu dữ liệu Plugin, khám phá, registry,
runtime mirror, thay đổi cấu hình, và công việc làm mới. Trace là tùy chọn bật và ghi
vào stderr, nên đầu ra lệnh JSON vẫn có thể phân tích được.

Ví dụ:

```bash
OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1 openclaw plugins install tokenjuice --force
```

Đầu ra ví dụ:

```text
[plugins:lifecycle] phase="config read" ms=6.83 status=ok command="install"
[plugins:lifecycle] phase="slot selection" ms=94.31 status=ok command="install" pluginId="tokenjuice"
[plugins:lifecycle] phase="registry refresh" ms=51.56 status=ok command="install" reason="source-changed"
```

Dùng mục này để điều tra vòng đời Plugin trước khi dùng tới trình phân tích CPU.
Nếu lệnh đang chạy từ một checkout mã nguồn, nên đo runtime đã build
bằng `node dist/entry.js ...` sau `pnpm build`; `pnpm openclaw ...`
cũng đo cả chi phí phụ của trình chạy mã nguồn.

## Khởi động CLI và lập hồ sơ lệnh

Dùng benchmark khởi động đã được đưa vào kho khi một lệnh có vẻ chậm:

```bash
pnpm test:startup:bench:smoke
pnpm tsx scripts/bench-cli-startup.ts --preset real --case status --runs 3
pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu
```

Để lập hồ sơ một lần thông qua trình chạy mã nguồn thông thường, đặt
`OPENCLAW_RUN_NODE_CPU_PROF_DIR`:

```bash
OPENCLAW_RUN_NODE_CPU_PROF_DIR=.artifacts/cli-cpu pnpm openclaw status
```

Trình chạy mã nguồn thêm các cờ hồ sơ CPU của Node và ghi một `.cpuprofile` cho
lệnh. Dùng cách này trước khi thêm công cụ đo tạm thời vào mã lệnh.

## Chế độ watch của Gateway

Để lặp nhanh, chạy gateway dưới trình theo dõi tệp:

```bash
pnpm gateway:watch
```

Theo mặc định, lệnh này khởi động hoặc khởi động lại một phiên tmux tên là
`openclaw-gateway-watch-main` (hoặc một biến thể theo hồ sơ/cổng như
`openclaw-gateway-watch-dev-19001`) và tự động attach từ terminal tương tác.
Shell không tương tác, CI, và các lệnh thực thi của agent sẽ tiếp tục tách rời và in
hướng dẫn attach thay thế. Attach thủ công khi cần:

```bash
tmux attach -t openclaw-gateway-watch-main
```

Pane tmux chạy trình watch thô:

```bash
node scripts/watch-node.mjs gateway --force
```

Dùng chế độ foreground khi không muốn dùng tmux:

```bash
pnpm gateway:watch:raw
# or
OPENCLAW_GATEWAY_WATCH_TMUX=0 pnpm gateway:watch
```

Tắt auto-attach trong khi vẫn giữ quản lý tmux:

```bash
OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch
```

Lập hồ sơ thời gian CPU của Gateway được watch khi gỡ lỗi các điểm nóng khởi động/runtime:

```bash
pnpm gateway:watch --benchmark
```

Wrapper watch tiêu thụ `--benchmark` trước khi gọi Gateway và ghi
một `.cpuprofile` V8 cho mỗi lần tiến trình con Gateway thoát dưới
`.artifacts/gateway-watch-profiles/`. Dừng hoặc khởi động lại gateway được watch để
flush hồ sơ hiện tại, rồi mở bằng Chrome DevTools hoặc Speedscope:

```bash
npx speedscope .artifacts/gateway-watch-profiles/*.cpuprofile
```

Dùng `--benchmark-dir <path>` khi bạn muốn đặt hồ sơ ở nơi khác.
Dùng `--benchmark-no-force` khi bạn muốn tiến trình con được benchmark bỏ qua thao tác dọn cổng `--force` mặc định và thất bại nhanh nếu cổng Gateway đã được dùng.

Wrapper tmux mang các bộ chọn runtime phổ biến không phải bí mật như
`OPENCLAW_PROFILE`, `OPENCLAW_CONFIG_PATH`, `OPENCLAW_STATE_DIR`,
`OPENCLAW_GATEWAY_PORT`, và `OPENCLAW_SKIP_CHANNELS` vào pane. Đặt
thông tin xác thực nhà cung cấp trong hồ sơ/cấu hình thông thường của bạn, hoặc dùng chế độ foreground thô
cho bí mật tạm thời dùng một lần.
Nếu Gateway được watch thoát trong khi khởi động, trình watch chạy
`openclaw doctor --fix --non-interactive` một lần và khởi động lại tiến trình con Gateway.
Dùng `OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0` khi bạn muốn lỗi khởi động ban đầu
mà không có lượt sửa chữa chỉ dành cho dev.
Pane tmux được quản lý cũng mặc định dùng log Gateway có màu để dễ đọc;
đặt `FORCE_COLOR=0` khi khởi động `pnpm gateway:watch` để tắt đầu ra ANSI.

Trình watch khởi động lại khi có các tệp liên quan đến build trong `src/`, tệp nguồn phần mở rộng,
siêu dữ liệu `package.json` và `openclaw.plugin.json` của phần mở rộng, `tsconfig.json`,
`package.json`, và `tsdown.config.ts`. Thay đổi siêu dữ liệu phần mở rộng khởi động lại
gateway mà không buộc rebuild `tsdown`; thay đổi nguồn và cấu hình vẫn
rebuild `dist` trước.

Thêm bất kỳ cờ CLI gateway nào sau `gateway:watch` và chúng sẽ được truyền tiếp trong
mỗi lần khởi động lại. Chạy lại cùng lệnh watch sẽ respawn pane tmux đã đặt tên, và
trình watch thô vẫn giữ khóa một trình watch duy nhất nên các tiến trình cha watch trùng lặp
sẽ được thay thế thay vì chồng chất.

## Hồ sơ dev + gateway dev (--dev)

Dùng hồ sơ dev để cô lập trạng thái và dựng một thiết lập an toàn, dùng xong bỏ để
gỡ lỗi. Có **hai** cờ `--dev`:

- **`--dev` toàn cục (hồ sơ):** cô lập trạng thái dưới `~/.openclaw-dev` và
  đặt cổng gateway mặc định là `19001` (các cổng dẫn xuất dịch chuyển theo).
- **`gateway --dev`: báo cho Gateway tự tạo cấu hình mặc định +
  workspace** khi thiếu (và bỏ qua BOOTSTRAP.md).

Luồng khuyến nghị (hồ sơ dev + bootstrap dev):

```bash
pnpm gateway:dev
OPENCLAW_PROFILE=dev openclaw tui
```

Nếu bạn chưa có bản cài đặt toàn cục, chạy CLI qua `pnpm openclaw ...`.

Việc này thực hiện:

1. **Cô lập hồ sơ** (`--dev` toàn cục)
   - `OPENCLAW_PROFILE=dev`
   - `OPENCLAW_STATE_DIR=~/.openclaw-dev`
   - `OPENCLAW_CONFIG_PATH=~/.openclaw-dev/openclaw.json`
   - `OPENCLAW_GATEWAY_PORT=19001` (trình duyệt/canvas dịch chuyển tương ứng)

2. **Bootstrap dev** (`gateway --dev`)
   - Ghi một cấu hình tối thiểu nếu thiếu (`gateway.mode=local`, bind loopback).
   - Đặt `agent.workspace` thành workspace dev.
   - Đặt `agent.skipBootstrap=true` (không có BOOTSTRAP.md).
   - Seed các tệp workspace nếu thiếu:
     `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`.
   - Danh tính mặc định: **C3‑PO** (droid giao thức).
   - Bỏ qua nhà cung cấp kênh trong chế độ dev (`OPENCLAW_SKIP_CHANNELS=1`).

Luồng đặt lại (bắt đầu mới):

```bash
pnpm gateway:dev:reset
```

<Note>
`--dev` là cờ hồ sơ **toàn cục** và bị một số trình chạy tiêu thụ. Nếu bạn cần viết rõ ra, dùng dạng biến môi trường:

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

</Note>

`--reset` xóa cấu hình, thông tin xác thực, phiên, và workspace dev (dùng
`trash`, không dùng `rm`), rồi tạo lại thiết lập dev mặc định.

<Tip>
Nếu một gateway không phải dev đã chạy (launchd hoặc systemd), hãy dừng nó trước:

```bash
openclaw gateway stop
```

</Tip>

## Ghi log luồng thô (OpenClaw)

OpenClaw có thể ghi log **luồng assistant thô** trước mọi bước lọc/định dạng.
Đây là cách tốt nhất để xem liệu phần lập luận có đang đến dưới dạng delta văn bản thuần
(hay dưới dạng các khối suy nghĩ riêng biệt) hay không.

Bật qua CLI:

```bash
pnpm gateway:watch --raw-stream
```

Ghi đè đường dẫn tùy chọn:

```bash
pnpm gateway:watch --raw-stream --raw-stream-path ~/.openclaw/logs/raw-stream.jsonl
```

Biến môi trường tương đương:

```bash
OPENCLAW_RAW_STREAM=1
OPENCLAW_RAW_STREAM_PATH=~/.openclaw/logs/raw-stream.jsonl
```

Tệp mặc định:

`~/.openclaw/logs/raw-stream.jsonl`

## Ghi log chunk thô (pi-mono)

Để thu thập **chunk tương thích OpenAI thô** trước khi chúng được phân tích thành khối,
pi-mono cung cấp một logger riêng:

```bash
PI_RAW_STREAM=1
```

Đường dẫn tùy chọn:

```bash
PI_RAW_STREAM_PATH=~/.pi-mono/logs/raw-openai-completions.jsonl
```

Tệp mặc định:

`~/.pi-mono/logs/raw-openai-completions.jsonl`

> Lưu ý: mục này chỉ được phát ra bởi các tiến trình dùng nhà cung cấp
> `openai-completions` của pi-mono.

## Ghi chú an toàn

- Log luồng thô có thể bao gồm toàn bộ prompt, đầu ra công cụ, và dữ liệu người dùng.
- Giữ log ở máy cục bộ và xóa chúng sau khi gỡ lỗi.
- Nếu bạn chia sẻ log, hãy xóa bí mật và PII trước.

## Liên quan

- [Khắc phục sự cố](/vi/help/troubleshooting)
- [Câu hỏi thường gặp](/vi/help/faq)
