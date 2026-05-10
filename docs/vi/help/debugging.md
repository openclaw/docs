---
read_when:
    - Bạn cần kiểm tra đầu ra thô của mô hình để phát hiện rò rỉ phần suy luận
    - Bạn muốn chạy Gateway ở chế độ theo dõi trong khi tinh chỉnh lặp lại
    - Bạn cần một quy trình gỡ lỗi có thể lặp lại
summary: 'Công cụ gỡ lỗi: chế độ theo dõi, luồng thô từ mô hình và truy vết rò rỉ suy luận'
title: Gỡ lỗi
x-i18n:
    generated_at: "2026-05-10T19:37:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: adee3f6e81af12c73e7e8126111f5c4bcba1a5014f4d0d0714ae67b45db93cb0
    source_path: help/debugging.md
    workflow: 16
---

Trình trợ giúp gỡ lỗi cho đầu ra phát trực tuyến, đặc biệt khi một nhà cung cấp trộn phần suy luận vào văn bản thông thường.

## Ghi đè gỡ lỗi runtime

Sử dụng `/debug` trong trò chuyện để đặt ghi đè cấu hình **chỉ runtime** (bộ nhớ, không phải đĩa).
`/debug` bị tắt theo mặc định; bật bằng `commands.debug: true`.
Điều này hữu ích khi bạn cần bật/tắt các cài đặt khó thấy mà không chỉnh sửa `openclaw.json`.

Ví dụ:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset` xóa tất cả ghi đè và quay lại cấu hình trên đĩa.

## Đầu ra dấu vết phiên

Sử dụng `/trace` khi bạn muốn xem các dòng dấu vết/gỡ lỗi do Plugin sở hữu trong một phiên
mà không bật toàn bộ chế độ chi tiết.

Ví dụ:

```text
/trace
/trace on
/trace off
```

Sử dụng `/trace` cho chẩn đoán Plugin như tóm tắt gỡ lỗi Active Memory.
Tiếp tục dùng `/verbose` cho đầu ra trạng thái/công cụ chi tiết thông thường, và tiếp tục dùng
`/debug` cho ghi đè cấu hình chỉ runtime.

## Dấu vết vòng đời Plugin

Sử dụng `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` khi các lệnh vòng đời Plugin có vẻ chậm
và bạn cần phần phân tích pha tích hợp sẵn cho siêu dữ liệu Plugin, khám phá, sổ đăng ký,
bản sao runtime, đột biến cấu hình và công việc làm mới. Dấu vết là tùy chọn bật và ghi
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

Sử dụng mục này để điều tra vòng đời Plugin trước khi dùng đến bộ định hình CPU.
Nếu lệnh đang chạy từ bản checkout mã nguồn, ưu tiên đo runtime đã build
bằng `node dist/entry.js ...` sau `pnpm build`; `pnpm openclaw ...`
cũng đo cả chi phí của trình chạy mã nguồn.

## Khởi động CLI và định hình lệnh

Sử dụng benchmark khởi động đã được đưa vào repo khi một lệnh có vẻ chậm:

```bash
pnpm test:startup:bench:smoke
pnpm tsx scripts/bench-cli-startup.ts --preset real --case status --runs 3
pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu
```

Để định hình một lần qua trình chạy mã nguồn thông thường, đặt
`OPENCLAW_RUN_NODE_CPU_PROF_DIR`:

```bash
OPENCLAW_RUN_NODE_CPU_PROF_DIR=.artifacts/cli-cpu pnpm openclaw status
```

Trình chạy mã nguồn thêm các cờ hồ sơ CPU của Node và ghi một `.cpuprofile` cho
lệnh. Sử dụng cách này trước khi thêm công cụ đo tạm thời vào mã lệnh.

Đối với các lần khởi động bị kẹt trông giống công việc hệ thống tệp đồng bộ hoặc bộ nạp module,
thêm cờ dấu vết I/O đồng bộ của Node qua trình chạy mã nguồn:

```bash
OPENCLAW_TRACE_SYNC_IO=1 pnpm openclaw gateway --force
```

`pnpm gateway:watch` để cờ này tắt theo mặc định cho tiến trình con Gateway
được theo dõi. Đặt `OPENCLAW_TRACE_SYNC_IO=1` khi bạn muốn rõ ràng đầu ra dấu vết
I/O đồng bộ của Node trong chế độ watch.

## Chế độ watch của Gateway

Để lặp nhanh, chạy gateway dưới trình theo dõi tệp:

```bash
pnpm gateway:watch
```

Theo mặc định, thao tác này khởi động hoặc khởi động lại một phiên tmux tên là
`openclaw-gateway-watch-main` (hoặc một biến thể theo hồ sơ/cổng cụ thể như
`openclaw-gateway-watch-dev-19001`) và tự động gắn vào từ các terminal tương tác.
Shell không tương tác, CI và các lệnh exec của agent vẫn tách rời và in hướng dẫn
gắn vào thay thế. Gắn vào thủ công khi cần:

```bash
tmux attach -t openclaw-gateway-watch-main
```

Ô tmux chạy trình theo dõi thô:

```bash
node scripts/watch-node.mjs gateway --force
```

Sử dụng chế độ foreground khi không muốn dùng tmux:

```bash
pnpm gateway:watch:raw
# or
OPENCLAW_GATEWAY_WATCH_TMUX=0 pnpm gateway:watch
```

Tắt tự động gắn vào nhưng vẫn giữ quản lý tmux:

```bash
OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch
```

Định hình thời gian CPU của Gateway được theo dõi khi gỡ lỗi các điểm nóng khởi động/runtime:

```bash
pnpm gateway:watch --benchmark
```

Wrapper watch tiêu thụ `--benchmark` trước khi gọi Gateway và ghi
một `.cpuprofile` V8 cho mỗi lần thoát của tiến trình con Gateway dưới
`.artifacts/gateway-watch-profiles/`. Dừng hoặc khởi động lại gateway được theo dõi để
xả hồ sơ hiện tại, rồi mở bằng Chrome DevTools hoặc Speedscope:

```bash
npx speedscope .artifacts/gateway-watch-profiles/*.cpuprofile
```

Sử dụng `--benchmark-dir <path>` khi bạn muốn hồ sơ ở nơi khác.
Sử dụng `--benchmark-no-force` khi bạn muốn tiến trình con được benchmark bỏ qua
dọn dẹp cổng `--force` mặc định và thất bại nhanh nếu cổng Gateway đã được sử dụng.
Chế độ benchmark mặc định chặn spam dấu vết sync-I/O. Đặt
`OPENCLAW_TRACE_SYNC_IO=1` cùng với `--benchmark` khi bạn muốn rõ ràng cả hồ sơ CPU
và stack trace sync-I/O của Node. Trong chế độ benchmark, các khối dấu vết đó
được ghi vào `gateway-watch-output.log` dưới thư mục benchmark và được lọc khỏi
ô terminal; nhật ký Gateway thông thường vẫn hiển thị.

Wrapper tmux mang các bộ chọn runtime không bí mật phổ biến như
`OPENCLAW_PROFILE`, `OPENCLAW_CONFIG_PATH`, `OPENCLAW_STATE_DIR`,
`OPENCLAW_GATEWAY_PORT`, và `OPENCLAW_SKIP_CHANNELS` vào ô. Đặt
thông tin xác thực nhà cung cấp trong hồ sơ/cấu hình thông thường của bạn, hoặc dùng chế độ foreground thô
cho các bí mật tạm thời dùng một lần.
Nếu Gateway được theo dõi thoát trong lúc khởi động, trình theo dõi chạy
`openclaw doctor --fix --non-interactive` một lần và khởi động lại tiến trình con Gateway.
Sử dụng `OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0` khi bạn muốn lỗi khởi động ban đầu
mà không có lượt sửa chữa chỉ dành cho dev.
Ô tmux được quản lý cũng mặc định dùng nhật ký Gateway có màu để dễ đọc;
đặt `FORCE_COLOR=0` khi khởi động `pnpm gateway:watch` để tắt đầu ra ANSI.

Trình theo dõi khởi động lại khi có các tệp liên quan đến build dưới `src/`, tệp nguồn extension,
siêu dữ liệu `package.json` và `openclaw.plugin.json` của extension, `tsconfig.json`,
`package.json`, và `tsdown.config.ts`. Thay đổi siêu dữ liệu extension khởi động lại
gateway mà không ép build lại `tsdown`; thay đổi nguồn và cấu hình vẫn
build lại `dist` trước.

Thêm bất kỳ cờ CLI gateway nào sau `gateway:watch` và chúng sẽ được truyền qua trong
mỗi lần khởi động lại. Chạy lại cùng lệnh watch sẽ sinh lại ô tmux đã đặt tên, và
trình theo dõi thô vẫn giữ khóa một-trình-theo-dõi để các tiến trình cha theo dõi trùng lặp
được thay thế thay vì chồng chất.

## Hồ sơ dev + gateway dev (--dev)

Sử dụng hồ sơ dev để cô lập trạng thái và dựng một thiết lập an toàn, có thể bỏ đi cho
gỡ lỗi. Có **hai** cờ `--dev`:

- **`--dev` toàn cục (hồ sơ):** cô lập trạng thái dưới `~/.openclaw-dev` và
  mặc định cổng gateway thành `19001` (các cổng suy ra dịch chuyển theo).
- **`gateway --dev`: yêu cầu Gateway tự tạo cấu hình mặc định +
  workspace** khi thiếu (và bỏ qua BOOTSTRAP.md).

Luồng khuyến nghị (hồ sơ dev + bootstrap dev):

```bash
pnpm gateway:dev
OPENCLAW_PROFILE=dev openclaw tui
```

Nếu bạn chưa có bản cài đặt toàn cục, chạy CLI qua `pnpm openclaw ...`.

Việc này làm gì:

1. **Cô lập hồ sơ** (`--dev` toàn cục)
   - `OPENCLAW_PROFILE=dev`
   - `OPENCLAW_STATE_DIR=~/.openclaw-dev`
   - `OPENCLAW_CONFIG_PATH=~/.openclaw-dev/openclaw.json`
   - `OPENCLAW_GATEWAY_PORT=19001` (trình duyệt/canvas dịch chuyển tương ứng)

2. **Bootstrap dev** (`gateway --dev`)
   - Ghi một cấu hình tối thiểu nếu thiếu (`gateway.mode=local`, bind loopback).
   - Đặt `agent.workspace` thành workspace dev.
   - Đặt `agent.skipBootstrap=true` (không có BOOTSTRAP.md).
   - Tạo sẵn các tệp workspace nếu thiếu:
     `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`.
   - Danh tính mặc định: **C3-PO** (droid giao thức).
   - Bỏ qua các nhà cung cấp kênh trong chế độ dev (`OPENCLAW_SKIP_CHANNELS=1`).

Luồng đặt lại (khởi đầu mới):

```bash
pnpm gateway:dev:reset
```

<Note>
`--dev` là một cờ hồ sơ **toàn cục** và bị một số trình chạy nuốt mất. Nếu bạn cần viết rõ, dùng dạng biến môi trường:

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

</Note>

`--reset` xóa sạch cấu hình, thông tin xác thực, phiên và workspace dev (dùng
`trash`, không phải `rm`), rồi tạo lại thiết lập dev mặc định.

<Tip>
Nếu một gateway không phải dev đang chạy (launchd hoặc systemd), dừng nó trước:

```bash
openclaw gateway stop
```

</Tip>

## Ghi nhật ký stream thô (OpenClaw)

OpenClaw có thể ghi nhật ký **stream trợ lý thô** trước mọi bước lọc/định dạng.
Đây là cách tốt nhất để xem liệu phần suy luận có đang đến dưới dạng delta văn bản thuần
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

## Ghi nhật ký chunk thô (pi-mono)

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

> Lưu ý: mục này chỉ được phát ra bởi các tiến trình sử dụng nhà cung cấp
> `openai-completions` của pi-mono.

## Ghi chú an toàn

- Nhật ký stream thô có thể bao gồm toàn bộ prompt, đầu ra công cụ và dữ liệu người dùng.
- Giữ nhật ký cục bộ và xóa chúng sau khi gỡ lỗi.
- Nếu bạn chia sẻ nhật ký, hãy loại bỏ bí mật và PII trước.

## Gỡ lỗi trong VSCode

Source map là bắt buộc để bật gỡ lỗi trong các IDE dựa trên VSCode vì nhiều tệp được tạo ra có tên đã băm như một phần của quá trình build. Các cấu hình `launch.json` đi kèm nhắm tới dịch vụ Gateway, nhưng có thể được điều chỉnh nhanh cho các mục đích khác:

1. **Build lại và gỡ lỗi Gateway** - Gỡ lỗi dịch vụ Gateway sau khi tạo build mới
2. **Gỡ lỗi Gateway** - Gỡ lỗi dịch vụ Gateway của một build đã có sẵn

### Thiết lập

Cấu hình **Build lại và gỡ lỗi Gateway** mặc định có đủ mọi thứ cần thiết, nó sẽ tự động xóa thư mục `/dist` và build lại dự án với gỡ lỗi được bật:

1. Mở bảng **Run and Debug** từ Activity Bar hoặc nhấn `Ctrl`+`Shift`+`D`
2. Trong IDE, đảm bảo **Build lại và gỡ lỗi Gateway** được chọn trong menu thả xuống cấu hình rồi nhấn nút **Start Debugging**

Hoặc, nếu bạn muốn tự quản lý quá trình build và gỡ lỗi:

1. Mở terminal và bật source map:
   - **Linux/macOS**: `export OUTPUT_SOURCE_MAPS=1`
   - **Windows (PowerShell)**: `$env:OUTPUT_SOURCE_MAPS="1"`
   - **Windows (CMD)**: `set OUTPUT_SOURCE_MAPS=1`
2. Trong cùng terminal, build lại dự án: `pnpm clean:dist && pnpm build`
3. Trong IDE, chọn tùy chọn **Gỡ lỗi Gateway** trong menu thả xuống cấu hình **Run and Debug** rồi nhấn nút **Start Debugging**

Bây giờ bạn có thể đặt breakpoint trong các tệp nguồn TypeScript của mình (thư mục `src/`) và trình gỡ lỗi sẽ ánh xạ đúng các breakpoint tới JavaScript đã biên dịch qua source map. Bạn sẽ có thể kiểm tra biến, bước qua mã và xem call stack như mong đợi.

### Ghi chú

- Nếu dùng tùy chọn **"Build lại và gỡ lỗi Gateway"** - mỗi lần trình gỡ lỗi được khởi chạy, nó sẽ xóa hoàn toàn thư mục `/dist` và chạy một `pnpm build` đầy đủ với source map được bật trước khi khởi động Gateway
- Nếu dùng tùy chọn **"Gỡ lỗi Gateway"** - phiên gỡ lỗi có thể được khởi động và dừng bất cứ lúc nào mà không ảnh hưởng đến thư mục `/dist`, nhưng bạn phải dùng một tiến trình terminal riêng để vừa bật gỡ lỗi vừa quản lý chu kỳ build
- Sửa cài đặt `launch.json` cho `args` để gỡ lỗi các phần khác của dự án
- Nếu bạn cần dùng CLI OpenClaw đã build cho các tác vụ khác (ví dụ `dashboard --no-open` nếu phiên gỡ lỗi của bạn sinh ra token xác thực mới), bạn có thể thực thi nó trong terminal khác bằng `node ./openclaw.mjs` hoặc tạo một alias shell như `alias openclaw-build="node $(pwd)/openclaw.mjs"`

## Liên quan

- [Khắc phục sự cố](/vi/help/troubleshooting)
- [FAQ](/vi/help/faq)
