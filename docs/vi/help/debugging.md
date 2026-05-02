---
read_when:
    - Bạn cần kiểm tra đầu ra thô của mô hình để phát hiện rò rỉ phần lập luận
    - Bạn muốn chạy Gateway ở chế độ theo dõi trong quá trình lặp lại chỉnh sửa
    - Bạn cần một quy trình gỡ lỗi có thể lặp lại
summary: 'Công cụ gỡ lỗi: chế độ theo dõi, luồng mô hình thô và truy vết rò rỉ lập luận'
title: Gỡ lỗi
x-i18n:
    generated_at: "2026-05-02T22:19:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7a72a1508915e37ffdc5317889cdfde7024de3f5702739640abc2f03c3abadb7
    source_path: help/debugging.md
    workflow: 16
---

Trình trợ giúp gỡ lỗi cho đầu ra phát trực tuyến, đặc biệt khi nhà cung cấp trộn phần suy luận vào văn bản thông thường.

## Ghi đè gỡ lỗi lúc chạy

Dùng `/debug` trong cuộc trò chuyện để đặt các ghi đè cấu hình **chỉ lúc chạy** (trong bộ nhớ, không ghi ra đĩa).
`/debug` bị tắt theo mặc định; bật bằng `commands.debug: true`.
Điều này hữu ích khi bạn cần bật/tắt các thiết lập ít dùng mà không chỉnh sửa `openclaw.json`.

Ví dụ:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset` xóa tất cả ghi đè và quay lại cấu hình trên đĩa.

## Đầu ra theo dõi phiên

Dùng `/trace` khi bạn muốn xem các dòng theo dõi/gỡ lỗi do plugin sở hữu trong một phiên
mà không bật chế độ chi tiết đầy đủ.

Ví dụ:

```text
/trace
/trace on
/trace off
```

Dùng `/trace` cho chẩn đoán plugin, chẳng hạn như tóm tắt gỡ lỗi Active Memory.
Tiếp tục dùng `/verbose` cho đầu ra trạng thái/công cụ chi tiết thông thường, và tiếp tục dùng
`/debug` cho các ghi đè cấu hình chỉ lúc chạy.

## Theo dõi vòng đời Plugin

Dùng `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` khi các lệnh vòng đời plugin có vẻ chậm
và bạn cần phân tích từng pha có sẵn cho metadata plugin, khám phá, registry,
runtime mirror, thay đổi cấu hình và công việc làm mới. Theo dõi này là tùy chọn và ghi
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

Dùng cách này để điều tra vòng đời plugin trước khi dùng trình phân tích CPU.
Nếu lệnh đang chạy từ checkout mã nguồn, nên đo runtime đã build bằng
`node dist/entry.js ...` sau `pnpm build`; `pnpm openclaw ...`
cũng đo cả chi phí của source runner.

## Khởi động CLI và phân tích hiệu năng lệnh

Dùng benchmark khởi động đã lưu trong repo khi một lệnh có vẻ chậm:

```bash
pnpm test:startup:bench:smoke
pnpm tsx scripts/bench-cli-startup.ts --preset real --case status --runs 3
pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu
```

Để phân tích hiệu năng một lần qua source runner thông thường, đặt
`OPENCLAW_RUN_NODE_CPU_PROF_DIR`:

```bash
OPENCLAW_RUN_NODE_CPU_PROF_DIR=.artifacts/cli-cpu pnpm openclaw status
```

Source runner thêm các cờ hồ sơ CPU của Node và ghi một `.cpuprofile` cho
lệnh. Dùng cách này trước khi thêm instrumentation tạm thời vào mã lệnh.

## Chế độ theo dõi Gateway

Để lặp nhanh, chạy gateway dưới trình theo dõi tệp:

```bash
pnpm gateway:watch
```

Theo mặc định, lệnh này khởi động hoặc khởi động lại một phiên tmux tên là
`openclaw-gateway-watch-main` (hoặc một biến thể theo profile/port như
`openclaw-gateway-watch-dev-19001`) và tự động attach từ các terminal tương tác.
Shell không tương tác, CI và các lệnh exec của agent sẽ tiếp tục detached và in
hướng dẫn attach thay vào đó. Attach thủ công khi cần:

```bash
tmux attach -t openclaw-gateway-watch-main
```

Pane tmux chạy trình theo dõi thô:

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

Lập hồ sơ thời gian CPU của Gateway được theo dõi khi gỡ lỗi các điểm nóng khởi động/runtime:

```bash
pnpm gateway:watch --benchmark
```

Watch wrapper tiêu thụ `--benchmark` trước khi gọi Gateway và ghi
một `.cpuprofile` V8 cho mỗi lần tiến trình con Gateway thoát dưới
`.artifacts/gateway-watch-profiles/`. Dừng hoặc khởi động lại gateway đang được theo dõi để
flush hồ sơ hiện tại, rồi mở bằng Chrome DevTools hoặc Speedscope:

```bash
npx speedscope .artifacts/gateway-watch-profiles/*.cpuprofile
```

Dùng `--benchmark-dir <path>` khi bạn muốn lưu hồ sơ ở nơi khác.

Tmux wrapper đưa các bộ chọn runtime không bí mật thường dùng như
`OPENCLAW_PROFILE`, `OPENCLAW_CONFIG_PATH`, `OPENCLAW_STATE_DIR`,
`OPENCLAW_GATEWAY_PORT`, và `OPENCLAW_SKIP_CHANNELS` vào pane. Đặt
thông tin xác thực của nhà cung cấp trong profile/cấu hình thông thường của bạn, hoặc dùng chế độ foreground thô
cho các bí mật tạm thời dùng một lần.
Pane tmux được quản lý cũng mặc định dùng log Gateway có màu để dễ đọc;
đặt `FORCE_COLOR=0` khi khởi động `pnpm gateway:watch` để tắt đầu ra ANSI.

Trình theo dõi khởi động lại khi có các tệp liên quan đến build dưới `src/`, tệp mã nguồn extension,
metadata `package.json` và `openclaw.plugin.json` của extension, `tsconfig.json`,
`package.json`, và `tsdown.config.ts`. Thay đổi metadata extension khởi động lại
gateway mà không buộc rebuild `tsdown`; thay đổi mã nguồn và cấu hình vẫn
rebuild `dist` trước.

Thêm bất kỳ cờ CLI nào của gateway sau `gateway:watch` và chúng sẽ được truyền qua trong
mỗi lần khởi động lại. Chạy lại cùng lệnh watch sẽ respawn pane tmux đã đặt tên, và
trình theo dõi thô vẫn giữ khóa một trình theo dõi duy nhất để các tiến trình cha watcher trùng lặp
được thay thế thay vì chồng chất.

## Profile dev + gateway dev (--dev)

Dùng profile dev để cô lập trạng thái và dựng một thiết lập an toàn, dùng xong bỏ cho
gỡ lỗi. Có **hai** cờ `--dev`:

- **`--dev` toàn cục (profile):** cô lập trạng thái dưới `~/.openclaw-dev` và
  đặt port gateway mặc định thành `19001` (các port dẫn xuất dịch chuyển theo).
- **`gateway --dev`: báo cho Gateway tự tạo cấu hình + workspace mặc định** khi thiếu (và bỏ qua BOOTSTRAP.md).

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
   - `OPENCLAW_GATEWAY_PORT=19001` (browser/canvas dịch chuyển tương ứng)

2. **Bootstrap dev** (`gateway --dev`)
   - Ghi cấu hình tối thiểu nếu thiếu (`gateway.mode=local`, bind loopback).
   - Đặt `agent.workspace` thành workspace dev.
   - Đặt `agent.skipBootstrap=true` (không có BOOTSTRAP.md).
   - Khởi tạo các tệp workspace nếu thiếu:
     `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`.
   - Danh tính mặc định: **C3‑PO** (droid giao thức).
   - Bỏ qua nhà cung cấp kênh trong chế độ dev (`OPENCLAW_SKIP_CHANNELS=1`).

Luồng đặt lại (khởi đầu mới):

```bash
pnpm gateway:dev:reset
```

<Note>
`--dev` là cờ profile **toàn cục** và bị một số runner nuốt mất. Nếu bạn cần viết rõ, dùng dạng biến môi trường:

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

</Note>

`--reset` xóa cấu hình, thông tin xác thực, phiên và workspace dev (dùng
`trash`, không phải `rm`), rồi tạo lại thiết lập dev mặc định.

<Tip>
Nếu một gateway không phải dev đang chạy (launchd hoặc systemd), hãy dừng nó trước:

```bash
openclaw gateway stop
```

</Tip>

## Ghi log luồng thô (OpenClaw)

OpenClaw có thể ghi log **luồng assistant thô** trước mọi bước lọc/định dạng.
Đây là cách tốt nhất để xem liệu phần suy luận có đến dưới dạng các delta văn bản thuần
(hay dưới dạng các khối suy nghĩ riêng biệt) hay không.

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

## Ghi log chunk thô (pi-mono)

Để thu **các chunk OpenAI-compat thô** trước khi chúng được phân tích thành khối,
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

- Log luồng thô có thể bao gồm toàn bộ prompt, đầu ra công cụ và dữ liệu người dùng.
- Giữ log cục bộ và xóa chúng sau khi gỡ lỗi.
- Nếu bạn chia sẻ log, hãy loại bỏ bí mật và PII trước.

## Liên quan

- [Khắc phục sự cố](/vi/help/troubleshooting)
- [FAQ](/vi/help/faq)
