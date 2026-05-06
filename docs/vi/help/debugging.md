---
read_when:
    - Bạn cần kiểm tra đầu ra thô của mô hình để phát hiện rò rỉ lập luận
    - Bạn muốn chạy Gateway ở chế độ theo dõi trong khi lặp lại quá trình phát triển
    - Bạn cần một quy trình gỡ lỗi có thể lặp lại
summary: 'Công cụ gỡ lỗi: chế độ theo dõi, luồng mô hình thô và truy vết rò rỉ lập luận'
title: Gỡ lỗi
x-i18n:
    generated_at: "2026-05-06T09:15:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6b59845244a1e2920ca15b9b85ce5b29424e3a1528eece8c18ddeab69feaf86f
    source_path: help/debugging.md
    workflow: 16
---

Trình trợ giúp gỡ lỗi cho đầu ra truyền phát, đặc biệt khi một nhà cung cấp trộn phần suy luận vào văn bản thông thường.

## Ghi đè gỡ lỗi lúc chạy

Dùng `/debug` trong chat để đặt các ghi đè cấu hình **chỉ lúc chạy** (bộ nhớ, không ghi ra đĩa).
`/debug` mặc định bị tắt; bật bằng `commands.debug: true`.
Điều này hữu ích khi bạn cần bật/tắt các thiết lập ít dùng mà không chỉnh sửa `openclaw.json`.

Ví dụ:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset` xóa toàn bộ ghi đè và quay lại cấu hình trên đĩa.

## Đầu ra theo dõi phiên

Dùng `/trace` khi bạn muốn xem các dòng theo dõi/gỡ lỗi do Plugin sở hữu trong một phiên
mà không bật toàn bộ chế độ chi tiết.

Ví dụ:

```text
/trace
/trace on
/trace off
```

Dùng `/trace` cho chẩn đoán Plugin như bản tóm tắt gỡ lỗi Active Memory.
Tiếp tục dùng `/verbose` cho đầu ra trạng thái/công cụ chi tiết thông thường, và tiếp tục dùng
`/debug` cho các ghi đè cấu hình chỉ lúc chạy.

## Theo dõi vòng đời Plugin

Dùng `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` khi các lệnh vòng đời Plugin có vẻ chậm
và bạn cần bản phân tích giai đoạn tích hợp sẵn cho siêu dữ liệu Plugin, khám phá, registry,
bản sao runtime, đột biến cấu hình và công việc làm mới. Theo dõi này là tùy chọn và ghi
ra stderr, vì vậy đầu ra lệnh JSON vẫn phân tích được.

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

Dùng mục này để điều tra vòng đời Plugin trước khi dùng trình phân tích CPU.
Nếu lệnh chạy từ một source checkout, nên đo runtime đã build
bằng `node dist/entry.js ...` sau `pnpm build`; `pnpm openclaw ...`
cũng đo phần overhead của source-runner.

## Khởi động CLI và lập hồ sơ lệnh

Dùng benchmark khởi động đã được commit khi một lệnh có vẻ chậm:

```bash
pnpm test:startup:bench:smoke
pnpm tsx scripts/bench-cli-startup.ts --preset real --case status --runs 3
pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu
```

Để lập hồ sơ một lần qua source runner thông thường, đặt
`OPENCLAW_RUN_NODE_CPU_PROF_DIR`:

```bash
OPENCLAW_RUN_NODE_CPU_PROF_DIR=.artifacts/cli-cpu pnpm openclaw status
```

Source runner thêm các cờ hồ sơ CPU của Node và ghi một `.cpuprofile` cho
lệnh. Dùng cách này trước khi thêm instrumentation tạm thời vào mã lệnh.

Với các điểm kẹt khởi động trông giống công việc hệ thống tệp đồng bộ hoặc module-loader,
thêm cờ theo dõi I/O đồng bộ của Node qua source runner:

```bash
OPENCLAW_TRACE_SYNC_IO=1 pnpm openclaw gateway --force
```

`pnpm gateway:watch` bật cờ này theo mặc định cho tiến trình con Gateway được theo dõi.
Đặt `OPENCLAW_TRACE_SYNC_IO=0` để tắt đầu ra theo dõi I/O đồng bộ của Node trong chế độ watch.

## Chế độ watch của Gateway

Để lặp nhanh, chạy gateway dưới trình theo dõi tệp:

```bash
pnpm gateway:watch
```

Theo mặc định, lệnh này khởi động hoặc khởi động lại một phiên tmux tên là
`openclaw-gateway-watch-main` (hoặc biến thể theo profile/cổng cụ thể như
`openclaw-gateway-watch-dev-19001`) và tự động attach từ terminal tương tác.
Shell không tương tác, CI, và các lệnh agent exec vẫn ở chế độ detach và in hướng dẫn attach
thay vào đó. Attach thủ công khi cần:

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
# or
OPENCLAW_GATEWAY_WATCH_TMUX=0 pnpm gateway:watch
```

Tắt tự động attach trong khi vẫn giữ quản lý tmux:

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
Dùng `--benchmark-no-force` khi bạn muốn tiến trình con được benchmark bỏ qua
dọn dẹp cổng `--force` mặc định và lỗi nhanh nếu cổng Gateway đã được dùng.
Chế độ benchmark mặc định chặn spam theo dõi sync-I/O. Đặt
`OPENCLAW_TRACE_SYNC_IO=1` với `--benchmark` khi bạn chủ đích muốn cả hồ sơ CPU
và stack trace sync-I/O của Node. Trong chế độ benchmark, các khối theo dõi đó
được ghi vào `gateway-watch-output.log` dưới thư mục benchmark và
được lọc khỏi pane terminal; log Gateway thông thường vẫn hiển thị.

Wrapper tmux mang các selector runtime không bí mật phổ biến như
`OPENCLAW_PROFILE`, `OPENCLAW_CONFIG_PATH`, `OPENCLAW_STATE_DIR`,
`OPENCLAW_GATEWAY_PORT`, và `OPENCLAW_SKIP_CHANNELS` vào pane. Đặt
thông tin xác thực nhà cung cấp trong profile/cấu hình thông thường của bạn, hoặc dùng chế độ foreground thô
cho bí mật tạm thời một lần.
Nếu Gateway được watch thoát trong lúc khởi động, watcher chạy
`openclaw doctor --fix --non-interactive` một lần và khởi động lại tiến trình con Gateway.
Dùng `OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0` khi bạn muốn lỗi khởi động gốc
mà không có lượt sửa chữa chỉ dành cho dev.
Pane tmux được quản lý cũng mặc định dùng log Gateway có màu để dễ đọc;
đặt `FORCE_COLOR=0` khi khởi động `pnpm gateway:watch` để tắt đầu ra ANSI.

Watcher khởi động lại khi có tệp liên quan đến build dưới `src/`, tệp nguồn extension,
siêu dữ liệu `package.json` và `openclaw.plugin.json` của extension, `tsconfig.json`,
`package.json`, và `tsdown.config.ts`. Thay đổi siêu dữ liệu extension khởi động lại
gateway mà không ép rebuild `tsdown`; thay đổi nguồn và cấu hình vẫn
rebuild `dist` trước.

Thêm bất kỳ cờ CLI gateway nào sau `gateway:watch` và chúng sẽ được truyền qua trong
mỗi lần khởi động lại. Chạy lại cùng lệnh watch sẽ respawn pane tmux đã đặt tên, và
watcher thô vẫn giữ khóa một watcher duy nhất để các tiến trình watcher cha trùng lặp
được thay thế thay vì chồng chất.

## Profile dev + gateway dev (--dev)

Dùng profile dev để cô lập trạng thái và dựng một thiết lập an toàn, dùng xong bỏ để
gỡ lỗi. Có **hai** cờ `--dev`:

- **`--dev` toàn cục (profile):** cô lập trạng thái dưới `~/.openclaw-dev` và
  đặt mặc định cổng gateway thành `19001` (các cổng suy ra sẽ dịch theo).
- **`gateway --dev`: báo Gateway tự động tạo cấu hình mặc định +
  workspace** khi thiếu (và bỏ qua BOOTSTRAP.md).

Luồng khuyến nghị (profile dev + bootstrap dev):

```bash
pnpm gateway:dev
OPENCLAW_PROFILE=dev openclaw tui
```

Nếu bạn chưa có bản cài đặt toàn cục, chạy CLI qua `pnpm openclaw ...`.

Việc này thực hiện:

1. **Cô lập profile** (`--dev` toàn cục)
   - `OPENCLAW_PROFILE=dev`
   - `OPENCLAW_STATE_DIR=~/.openclaw-dev`
   - `OPENCLAW_CONFIG_PATH=~/.openclaw-dev/openclaw.json`
   - `OPENCLAW_GATEWAY_PORT=19001` (browser/canvas dịch tương ứng)

2. **Bootstrap dev** (`gateway --dev`)
   - Ghi một cấu hình tối thiểu nếu thiếu (`gateway.mode=local`, bind loopback).
   - Đặt `agent.workspace` thành workspace dev.
   - Đặt `agent.skipBootstrap=true` (không có BOOTSTRAP.md).
   - Seed các tệp workspace nếu thiếu:
     `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`.
   - Danh tính mặc định: **C3-PO** (protocol droid).
   - Bỏ qua nhà cung cấp kênh trong chế độ dev (`OPENCLAW_SKIP_CHANNELS=1`).

Luồng đặt lại (khởi đầu mới):

```bash
pnpm gateway:dev:reset
```

<Note>
`--dev` là cờ profile **toàn cục** và bị một số runner nuốt. Nếu bạn cần viết rõ, dùng dạng biến môi trường:

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

</Note>

`--reset` xóa cấu hình, thông tin xác thực, phiên, và workspace dev (dùng
`trash`, không phải `rm`), rồi tạo lại thiết lập dev mặc định.

<Tip>
Nếu gateway không phải dev đã chạy (launchd hoặc systemd), dừng nó trước:

```bash
openclaw gateway stop
```

</Tip>

## Ghi log stream thô (OpenClaw)

OpenClaw có thể ghi log **stream assistant thô** trước mọi bước lọc/định dạng.
Đây là cách tốt nhất để xem phần suy luận đang đến dưới dạng delta văn bản thuần
(hay dưới dạng các khối suy nghĩ riêng).

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

Để thu thập **raw OpenAI-compat chunks** trước khi chúng được phân tích thành block,
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

- Log stream thô có thể chứa đầy đủ prompt, đầu ra công cụ, và dữ liệu người dùng.
- Giữ log cục bộ và xóa chúng sau khi gỡ lỗi.
- Nếu bạn chia sẻ log, hãy loại bỏ bí mật và PII trước.

## Gỡ lỗi trong VSCode

Source map là bắt buộc để bật gỡ lỗi trong IDE dựa trên VSCode vì nhiều tệp được tạo cuối cùng có tên dạng hash như một phần của quy trình build. Các cấu hình `launch.json` đi kèm nhắm đến dịch vụ Gateway, nhưng có thể nhanh chóng điều chỉnh cho mục đích khác:

1. **Rebuild and Debug Gateway** - Gỡ lỗi dịch vụ Gateway sau khi tạo một bản build mới
2. **Debug Gateway** - Gỡ lỗi dịch vụ Gateway của một bản build đã có

### Thiết lập

Cấu hình **Rebuild and Debug Gateway** mặc định bao gồm đầy đủ, nó sẽ tự động xóa thư mục `/dist` và rebuild dự án với gỡ lỗi được bật:

1. Mở panel **Run and Debug** từ Activity Bar hoặc nhấn `Ctrl`+`Shift`+`D`
2. Trong IDE, bảo đảm **Rebuild and Debug Gateway** được chọn trong menu thả xuống cấu hình rồi nhấn nút **Start Debugging**

Hoặc, nếu bạn muốn tự quản lý quy trình build và gỡ lỗi:

1. Mở terminal và bật source map:
   - **Linux/macOS**: `export OUTPUT_SOURCE_MAPS=1`
   - **Windows (PowerShell)**: `$env:OUTPUT_SOURCE_MAPS="1"`
   - **Windows (CMD)**: `set OUTPUT_SOURCE_MAPS=1`
2. Trong cùng terminal, rebuild dự án: `pnpm clean:dist && pnpm build`
3. Trong IDE, chọn tùy chọn **Debug Gateway** trong menu thả xuống cấu hình **Run and Debug** rồi nhấn nút **Start Debugging**

Bây giờ bạn có thể đặt breakpoint trong các tệp nguồn TypeScript của mình (thư mục `src/`) và debugger sẽ ánh xạ đúng breakpoint sang JavaScript đã biên dịch thông qua source map. Bạn sẽ có thể kiểm tra biến, bước qua mã, và xem call stack như mong đợi.

### Ghi chú

- Nếu dùng tùy chọn **"Rebuild and Debug Gateway"** - mỗi lần debugger được khởi chạy, nó sẽ xóa hoàn toàn thư mục `/dist` và chạy đầy đủ `pnpm build` với source map được bật trước khi khởi động Gateway
- Nếu dùng tùy chọn **"Debug Gateway"** - các phiên gỡ lỗi có thể được bắt đầu và dừng bất kỳ lúc nào mà không ảnh hưởng đến thư mục `/dist`, nhưng bạn phải dùng một tiến trình terminal riêng để vừa bật gỡ lỗi vừa quản lý chu kỳ build
- Sửa thiết lập `launch.json` cho `args` để gỡ lỗi các phần khác của dự án
- Nếu bạn cần dùng OpenClaw CLI đã build cho các tác vụ khác (ví dụ `dashboard --no-open` nếu phiên gỡ lỗi của bạn tạo token xác thực mới), bạn có thể thực thi nó trong terminal khác dưới dạng `node ./openclaw.mjs` hoặc tạo shell alias như `alias openclaw-build="node $(pwd)/openclaw.mjs"`

## Liên quan

- [Khắc phục sự cố](/vi/help/troubleshooting)
- [Câu hỏi thường gặp](/vi/help/faq)
