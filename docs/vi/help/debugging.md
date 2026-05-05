---
read_when:
    - Bạn cần kiểm tra đầu ra thô của mô hình để phát hiện rò rỉ nội dung suy luận
    - Bạn muốn chạy Gateway ở chế độ theo dõi trong khi liên tục chỉnh sửa
    - Bạn cần một quy trình gỡ lỗi có thể lặp lại
summary: 'Công cụ gỡ lỗi: chế độ theo dõi, luồng mô hình thô và truy vết rò rỉ suy luận'
title: Gỡ lỗi
x-i18n:
    generated_at: "2026-05-05T01:47:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9d86bd9b5dd08615d3c283f3fcb2a885f5134fa7e1cdece86b6a796d08a659ec
    source_path: help/debugging.md
    workflow: 16
---

Các trình trợ giúp gỡ lỗi cho đầu ra phát trực tuyến, đặc biệt khi một nhà cung cấp trộn phần suy luận vào văn bản thông thường.

## Ghi đè gỡ lỗi runtime

Dùng `/debug` trong cuộc trò chuyện để đặt ghi đè cấu hình **chỉ runtime** (bộ nhớ, không ghi ra ổ đĩa).
`/debug` bị tắt theo mặc định; bật bằng `commands.debug: true`.
Điều này hữu ích khi bạn cần bật/tắt các thiết lập ít gặp mà không chỉnh sửa `openclaw.json`.

Ví dụ:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset` xóa tất cả ghi đè và quay lại cấu hình trên ổ đĩa.

## Đầu ra trace phiên

Dùng `/trace` khi bạn muốn xem các dòng trace/gỡ lỗi do Plugin sở hữu trong một phiên
mà không bật toàn bộ chế độ chi tiết.

Ví dụ:

```text
/trace
/trace on
/trace off
```

Dùng `/trace` cho chẩn đoán Plugin, chẳng hạn như bản tóm tắt gỡ lỗi Active Memory.
Tiếp tục dùng `/verbose` cho đầu ra trạng thái/công cụ chi tiết thông thường, và tiếp tục dùng
`/debug` cho ghi đè cấu hình chỉ runtime.

## Trace vòng đời Plugin

Dùng `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` khi các lệnh vòng đời Plugin có vẻ chậm
và bạn cần phân tích giai đoạn tích hợp sẵn cho siêu dữ liệu Plugin, khám phá, registry,
runtime mirror, biến đổi cấu hình, và công việc làm mới. Trace là tùy chọn bật và ghi
vào stderr, vì vậy đầu ra lệnh JSON vẫn phân tích được.

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

Dùng phần này để điều tra vòng đời Plugin trước khi dùng đến trình định hình CPU.
Nếu lệnh đang chạy từ một checkout mã nguồn, hãy ưu tiên đo runtime đã build
bằng `node dist/entry.js ...` sau `pnpm build`; `pnpm openclaw ...`
cũng đo cả chi phí của source-runner.

## Khởi động CLI và định hình lệnh

Dùng benchmark khởi động đã được đưa vào repo khi một lệnh có vẻ chậm:

```bash
pnpm test:startup:bench:smoke
pnpm tsx scripts/bench-cli-startup.ts --preset real --case status --runs 3
pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu
```

Để định hình một lần qua source runner thông thường, đặt
`OPENCLAW_RUN_NODE_CPU_PROF_DIR`:

```bash
OPENCLAW_RUN_NODE_CPU_PROF_DIR=.artifacts/cli-cpu pnpm openclaw status
```

Source runner thêm các cờ hồ sơ CPU của Node và ghi một `.cpuprofile` cho
lệnh. Dùng cách này trước khi thêm instrumentation tạm thời vào mã lệnh.

Với các điểm nghẽn khởi động trông giống công việc hệ thống tệp đồng bộ hoặc module-loader,
hãy thêm cờ trace I/O đồng bộ của Node thông qua source runner:

```bash
OPENCLAW_TRACE_SYNC_IO=1 pnpm openclaw gateway --force
```

`pnpm gateway:watch` bật cờ này theo mặc định cho tiến trình Gateway con được theo dõi.
Đặt `OPENCLAW_TRACE_SYNC_IO=0` để chặn đầu ra trace I/O đồng bộ của Node ở chế độ watch.

## Chế độ watch của Gateway

Để lặp nhanh, chạy gateway dưới trình theo dõi tệp:

```bash
pnpm gateway:watch
```

Theo mặc định, lệnh này khởi động hoặc khởi động lại một phiên tmux có tên
`openclaw-gateway-watch-main` (hoặc một biến thể theo profile/cổng cụ thể như
`openclaw-gateway-watch-dev-19001`) và tự động đính kèm từ terminal tương tác.
Shell không tương tác, CI, và các lệnh exec của agent vẫn tách rời và in hướng dẫn
đính kèm thay thế. Đính kèm thủ công khi cần:

```bash
tmux attach -t openclaw-gateway-watch-main
```

Pane tmux chạy watcher thô:

```bash
node scripts/watch-node.mjs gateway --force
```

Dùng chế độ foreground khi không muốn dùng tmux:

```bash
pnpm gateway:watch:raw
# hoặc
OPENCLAW_GATEWAY_WATCH_TMUX=0 pnpm gateway:watch
```

Tắt tự động đính kèm trong khi vẫn giữ quản lý tmux:

```bash
OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch
```

Định hình thời gian CPU của Gateway được watch khi gỡ lỗi các điểm nóng khởi động/runtime:

```bash
pnpm gateway:watch --benchmark
```

Watch wrapper tiêu thụ `--benchmark` trước khi gọi Gateway và ghi
một `.cpuprofile` V8 cho mỗi lần tiến trình Gateway con thoát dưới
`.artifacts/gateway-watch-profiles/`. Dừng hoặc khởi động lại gateway được watch để
flush hồ sơ hiện tại, rồi mở bằng Chrome DevTools hoặc Speedscope:

```bash
npx speedscope .artifacts/gateway-watch-profiles/*.cpuprofile
```

Dùng `--benchmark-dir <path>` khi bạn muốn đặt hồ sơ ở nơi khác.
Dùng `--benchmark-no-force` khi bạn muốn tiến trình con được benchmark bỏ qua bước
dọn dẹp cổng `--force` mặc định và lỗi nhanh nếu cổng Gateway đã được sử dụng.
Chế độ benchmark chặn nhiễu trace sync-I/O theo mặc định. Đặt
`OPENCLAW_TRACE_SYNC_IO=1` cùng `--benchmark` khi bạn chủ động muốn cả hồ sơ CPU
và stack trace sync-I/O của Node. Ở chế độ benchmark, các khối trace đó
được ghi vào `gateway-watch-output.log` trong thư mục benchmark và
được lọc khỏi pane terminal; nhật ký Gateway thông thường vẫn hiển thị.

Tmux wrapper mang các bộ chọn runtime không bí mật phổ biến như
`OPENCLAW_PROFILE`, `OPENCLAW_CONFIG_PATH`, `OPENCLAW_STATE_DIR`,
`OPENCLAW_GATEWAY_PORT`, và `OPENCLAW_SKIP_CHANNELS` vào pane. Đặt
thông tin xác thực nhà cung cấp trong profile/cấu hình thông thường của bạn, hoặc dùng chế độ foreground thô
cho các bí mật tạm thời dùng một lần.
Nếu Gateway được watch thoát trong lúc khởi động, watcher chạy
`openclaw doctor --fix --non-interactive` một lần và khởi động lại tiến trình Gateway con.
Dùng `OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0` khi bạn muốn lỗi khởi động ban đầu
mà không có lượt sửa chỉ dành cho dev.
Pane tmux được quản lý cũng mặc định dùng nhật ký Gateway có màu để dễ đọc;
đặt `FORCE_COLOR=0` khi khởi động `pnpm gateway:watch` để tắt đầu ra ANSI.

Watcher khởi động lại khi có thay đổi ở các tệp liên quan đến build trong `src/`, tệp mã nguồn extension,
siêu dữ liệu `package.json` và `openclaw.plugin.json` của extension, `tsconfig.json`,
`package.json`, và `tsdown.config.ts`. Thay đổi siêu dữ liệu extension khởi động lại
gateway mà không ép rebuild `tsdown`; thay đổi mã nguồn và cấu hình vẫn
rebuild `dist` trước.

Thêm bất kỳ cờ CLI gateway nào sau `gateway:watch` và chúng sẽ được truyền qua trong
mỗi lần khởi động lại. Chạy lại cùng lệnh watch sẽ respawn pane tmux đã đặt tên, và
watcher thô vẫn giữ khóa một watcher duy nhất để các watcher parent trùng lặp
được thay thế thay vì tích tụ.

## Profile dev + gateway dev (--dev)

Dùng profile dev để cô lập trạng thái và khởi động một thiết lập an toàn, dùng xong bỏ để
gỡ lỗi. Có **hai** cờ `--dev`:

- **`--dev` toàn cục (profile):** cô lập trạng thái dưới `~/.openclaw-dev` và
  mặc định cổng gateway là `19001` (các cổng dẫn xuất dịch chuyển theo).
- **`gateway --dev`: yêu cầu Gateway tự động tạo cấu hình mặc định +
  workspace** khi thiếu (và bỏ qua BOOTSTRAP.md).

Luồng khuyến nghị (profile dev + bootstrap dev):

```bash
pnpm gateway:dev
OPENCLAW_PROFILE=dev openclaw tui
```

Nếu bạn chưa có bản cài đặt toàn cục, chạy CLI qua `pnpm openclaw ...`.

Những gì thao tác này thực hiện:

1. **Cô lập profile** (`--dev` toàn cục)
   - `OPENCLAW_PROFILE=dev`
   - `OPENCLAW_STATE_DIR=~/.openclaw-dev`
   - `OPENCLAW_CONFIG_PATH=~/.openclaw-dev/openclaw.json`
   - `OPENCLAW_GATEWAY_PORT=19001` (browser/canvas dịch chuyển tương ứng)

2. **Bootstrap dev** (`gateway --dev`)
   - Ghi cấu hình tối thiểu nếu thiếu (`gateway.mode=local`, bind loopback).
   - Đặt `agent.workspace` thành workspace dev.
   - Đặt `agent.skipBootstrap=true` (không có BOOTSTRAP.md).
   - Seed các tệp workspace nếu thiếu:
     `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`.
   - Danh tính mặc định: **C3‑PO** (protocol droid).
   - Bỏ qua các nhà cung cấp kênh ở chế độ dev (`OPENCLAW_SKIP_CHANNELS=1`).

Luồng reset (khởi đầu mới):

```bash
pnpm gateway:dev:reset
```

<Note>
`--dev` là cờ profile **toàn cục** và bị một số runner tiêu thụ. Nếu bạn cần viết rõ ra, hãy dùng dạng biến môi trường:

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

</Note>

`--reset` xóa cấu hình, thông tin xác thực, phiên, và workspace dev (dùng
`trash`, không phải `rm`), rồi tạo lại thiết lập dev mặc định.

<Tip>
Nếu một gateway không phải dev đang chạy (launchd hoặc systemd), hãy dừng nó trước:

```bash
openclaw gateway stop
```

</Tip>

## Ghi nhật ký raw stream (OpenClaw)

OpenClaw có thể ghi nhật ký **raw assistant stream** trước mọi bước lọc/định dạng.
Đây là cách tốt nhất để xem liệu phần suy luận đang đến dưới dạng plain text deltas
(hay dưới dạng các thinking block riêng).

Bật qua CLI:

```bash
pnpm gateway:watch --raw-stream
```

Ghi đè đường dẫn tùy chọn:

```bash
pnpm gateway:watch --raw-stream --raw-stream-path ~/.openclaw/logs/raw-stream.jsonl
```

Các biến môi trường tương đương:

```bash
OPENCLAW_RAW_STREAM=1
OPENCLAW_RAW_STREAM_PATH=~/.openclaw/logs/raw-stream.jsonl
```

Tệp mặc định:

`~/.openclaw/logs/raw-stream.jsonl`

## Ghi nhật ký raw chunk (pi-mono)

Để ghi lại **raw OpenAI-compat chunks** trước khi chúng được phân tích thành các khối,
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

> Lưu ý: phần này chỉ được phát ra bởi các tiến trình dùng nhà cung cấp
> `openai-completions` của pi-mono.

## Ghi chú an toàn

- Nhật ký raw stream có thể bao gồm toàn bộ prompt, đầu ra công cụ, và dữ liệu người dùng.
- Giữ nhật ký cục bộ và xóa chúng sau khi gỡ lỗi.
- Nếu bạn chia sẻ nhật ký, hãy loại bỏ bí mật và PII trước.

## Liên quan

- [Khắc phục sự cố](/vi/help/troubleshooting)
- [Câu hỏi thường gặp](/vi/help/faq)
