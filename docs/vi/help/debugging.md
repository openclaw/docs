---
read_when:
    - Bạn cần kiểm tra đầu ra thô của mô hình để phát hiện việc rò rỉ nội dung suy luận
    - Bạn muốn chạy Gateway ở chế độ theo dõi trong khi lặp lại quá trình phát triển
    - Bạn cần một quy trình gỡ lỗi có thể lặp lại
summary: 'Công cụ gỡ lỗi: chế độ theo dõi, luồng mô hình thô và truy vết rò rỉ quá trình suy luận'
title: Gỡ lỗi
x-i18n:
    generated_at: "2026-07-21T13:41:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 651976deb52841711f6c29be0a36359d5d05ef0b0bd21bba6f89620b5b024487
    source_path: help/debugging.md
    workflow: 16
---

Các tiện ích hỗ trợ gỡ lỗi cho đầu ra phát trực tuyến, quá trình lặp Gateway và lập hồ sơ khởi động.

## Ghi đè gỡ lỗi thời gian chạy

`/debug` đặt các giá trị ghi đè cấu hình **chỉ dành cho thời gian chạy** (trong bộ nhớ, không phải trên đĩa). Mặc định bị tắt; bật bằng `commands.debug: true`.

```text
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset` xóa tất cả giá trị ghi đè và quay lại cấu hình trên đĩa.

## Đầu ra dấu vết phiên

`/trace` hiển thị các dòng dấu vết/gỡ lỗi do plugin sở hữu cho một phiên mà không bật chế độ chi tiết đầy đủ. Dùng lệnh này cho hoạt động chẩn đoán plugin, chẳng hạn như bản tóm tắt gỡ lỗi Active Memory; dùng `/verbose` cho đầu ra trạng thái/công cụ thông thường.

```text
/trace
/trace on
/trace off
```

## Dấu vết vòng đời plugin

Đặt `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` để xem phân tích theo từng giai đoạn về siêu dữ liệu plugin, khám phá, registry, bản sao thời gian chạy, thay đổi cấu hình và công việc làm mới. Nội dung được ghi vào stderr, vì vậy đầu ra lệnh JSON vẫn có thể phân tích được.
Các lỗi tải plugin bao gồm dấu vết ngăn xếp khi dấu vết này được bật.

```bash
OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1 openclaw plugins install tokenjuice --force
```

```text
[plugins:lifecycle] phase="config read" ms=6.83 status=ok command="install"
[plugins:lifecycle] phase="slot selection" ms=94.31 status=ok command="install" pluginId="tokenjuice"
[plugins:lifecycle] phase="registry refresh" ms=51.56 status=ok command="install" reason="source-changed"
```

Hãy dùng cách này trước khi chuyển sang trình lập hồ sơ CPU. Từ bản checkout mã nguồn, đo thời gian chạy đã dựng bằng `node dist/entry.js ...` sau `pnpm build`; `pnpm openclaw ...` cũng đo mức chi phí bổ sung của trình chạy mã nguồn.

Đối với thời gian tải mô-đun đồng bộ, hãy dùng bề mặt chẩn đoán dùng chung thay vì một công tắc môi trường riêng chỉ dành cho plugin:

```bash
OPENCLAW_DIAGNOSTICS=plugin.load-profile openclaw plugins list
```

## Lập hồ sơ khởi động CLI và lệnh

Các bài đo chuẩn khởi động được lưu trong kho mã:

```bash
pnpm test:startup:bench:smoke
pnpm tsx scripts/bench-cli-startup.ts --preset real --case status --runs 3
pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu
```

Để lập hồ sơ một lần thông qua trình chạy mã nguồn thông thường, hãy đặt `OPENCLAW_RUN_NODE_CPU_PROF_DIR`:

```bash
OPENCLAW_RUN_NODE_CPU_PROF_DIR=.artifacts/cli-cpu pnpm openclaw status
```

Trình chạy mã nguồn thêm các cờ hồ sơ CPU của Node và ghi một `.cpuprofile` cho lệnh. Hãy dùng cách này trước khi thêm mã đo tạm thời vào mã lệnh.

Đối với tình trạng khựng khi khởi động có vẻ do hệ thống tệp đồng bộ hoặc trình tải mô-đun, hãy thêm cờ dấu vết I/O đồng bộ của Node thông qua trình chạy mã nguồn:

```bash
OPENCLAW_TRACE_SYNC_IO=1 pnpm openclaw gateway --force
```

`pnpm gateway:watch` mặc định để cờ này ở trạng thái tắt cho tiến trình con Gateway đang được theo dõi; đặt `OPENCLAW_TRACE_SYNC_IO=1` khi bạn cũng muốn có đầu ra dấu vết I/O đồng bộ trong chế độ theo dõi.

## Chế độ theo dõi Gateway

```bash
pnpm gateway:watch
```

Theo mặc định, lệnh này khởi động hoặc khởi động lại một phiên tmux có tên `openclaw-gateway-watch-<profile>` (ví dụ: `openclaw-gateway-watch-main`), với hậu tố cổng như `openclaw-gateway-watch-dev-19001` chỉ được thêm khi `OPENCLAW_GATEWAY_PORT` khác với cổng mặc định `18789`. Lệnh tự động đính kèm từ terminal tương tác; shell không tương tác, CI và các lệnh thực thi của tác nhân vẫn ở trạng thái tách rời và thay vào đó in hướng dẫn đính kèm:

```bash
tmux attach -t openclaw-gateway-watch-main
# Đọc đầu ra gần đây mà không đính kèm
tmux capture-pane -ep -t openclaw-gateway-watch-main -S -200
```

Khung dùng `remain-on-exit` của tmux, vì vậy lỗi khởi động vẫn khả dụng để đính kèm hoặc thu thập thay vì xóa phiên. Chạy lại `pnpm gateway:watch` sẽ tạo lại khung đó.

Khung tmux chạy trình theo dõi thô:

```bash
node scripts/watch-node.mjs gateway --force
```

Trước khi theo dõi cổng đã cấu hình/mặc định, trình bao tmux dừng dịch vụ Gateway đã cài đặt của hồ sơ đang hoạt động. Thao tác này bàn giao cổng cho trình theo dõi mã nguồn mà không để launchd, systemd hoặc Scheduled Task tái tạo tiến trình và thay thế nó. Dịch vụ vẫn được cài đặt; khôi phục dịch vụ sau phiên theo dõi bằng:

```bash
pnpm openclaw gateway start
```

Khi `--port` hoặc `OPENCLAW_GATEWAY_PORT` được chỉ định rõ ràng khác với cổng hiệu lực của dịch vụ đã cài đặt, trình bao để dịch vụ tiếp tục chạy để cả hai Gateway có thể chạy song song.

Chế độ tiền cảnh không dùng tmux:

```bash
pnpm gateway:watch:raw
# hoặc
OPENCLAW_GATEWAY_WATCH_TMUX=0 pnpm gateway:watch
```

Chế độ thô không quản lý dịch vụ đã cài đặt. Trước tiên, hãy chạy `pnpm openclaw gateway stop` khi dịch vụ dùng cùng một cổng.

Giữ việc quản lý tmux nhưng tắt tự động đính kèm:

```bash
OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch
```

Lập hồ sơ thời gian CPU của Gateway đang được theo dõi khi gỡ lỗi các điểm nóng trong quá trình khởi động/thời gian chạy:

```bash
pnpm gateway:watch --benchmark
```

Trình bao theo dõi sử dụng `--benchmark` trước khi gọi Gateway và ghi một `.cpuprofile` V8 cho mỗi lần tiến trình con Gateway thoát vào `.artifacts/gateway-watch-profiles/`. Dừng hoặc khởi động lại Gateway đang được theo dõi để ghi hoàn tất hồ sơ hiện tại, sau đó mở hồ sơ bằng Chrome DevTools hoặc Speedscope:

```bash
npx speedscope .artifacts/gateway-watch-profiles/*.cpuprofile
```

- `--benchmark-dir <path>`: ghi hồ sơ vào vị trí khác.
- `--benchmark-no-force`: bỏ qua việc dọn dẹp cổng mặc định `--force` và dừng ngay nếu cổng Gateway đã được sử dụng.

Chế độ đo chuẩn mặc định chặn các thông báo dấu vết I/O đồng bộ dồn dập. Đặt `OPENCLAW_TRACE_SYNC_IO=1` cùng `--benchmark` để nhận cả hồ sơ CPU và dấu vết ngăn xếp I/O đồng bộ; trong chế độ đo chuẩn, các khối dấu vết đó được ghi vào `gateway-watch-output.log` trong thư mục đo chuẩn (được lọc khỏi khung terminal), trong khi nhật ký Gateway thông thường vẫn hiển thị.

Trình bao tmux chuyển các bộ chọn thời gian chạy không bí mật phổ biến vào khung, bao gồm `OPENCLAW_PROFILE`, `OPENCLAW_CONFIG_PATH`, `OPENCLAW_STATE_DIR`, `OPENCLAW_GATEWAY_PORT` và `OPENCLAW_SKIP_CHANNELS`. Đặt thông tin xác thực của nhà cung cấp trong hồ sơ/cấu hình thông thường, hoặc dùng chế độ tiền cảnh thô cho các bí mật tạm thời dùng một lần.

Nếu Gateway đang được theo dõi thoát trong lúc khởi động, trình theo dõi chạy `openclaw doctor --fix --non-interactive` một lần và khởi động lại tiến trình con Gateway. Đặt `OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0` để xem lỗi khởi động ban đầu mà không qua lượt sửa chữa chỉ dành cho phát triển.

Khung tmux được quản lý mặc định dùng nhật ký Gateway có màu; đặt `FORCE_COLOR=0` khi khởi động `pnpm gateway:watch` để tắt đầu ra ANSI.

Trình theo dõi khởi động lại khi các tệp liên quan đến bản dựng trong `src/`, các tệp mã nguồn tiện ích mở rộng, siêu dữ liệu `package.json` và `openclaw.plugin.json` của tiện ích mở rộng, `tsconfig.json`, `package.json` và `tsdown.config.ts` thay đổi. Thay đổi siêu dữ liệu tiện ích mở rộng sẽ khởi động lại Gateway mà không buộc dựng lại; thay đổi mã nguồn và cấu hình vẫn dựng lại `dist` trước.

Thêm các cờ CLI của Gateway sau `gateway:watch` và chúng sẽ được chuyển tiếp trong mỗi lần khởi động lại. Chạy lại cùng một lệnh theo dõi sẽ tạo lại khung tmux có tên đó; trình theo dõi thô giữ khóa một trình theo dõi duy nhất để thay thế các tiến trình cha theo dõi trùng lặp thay vì để chúng chồng chất.

## Hồ sơ phát triển + Gateway phát triển (--dev)

Hai cờ `--dev` **riêng biệt**:

- **`--dev` toàn cục (hồ sơ):** cô lập trạng thái trong `~/.openclaw-dev` và mặc định cổng Gateway là `19001` (các cổng dẫn xuất dịch chuyển theo).
- **`gateway --dev`:** yêu cầu Gateway tự động tạo cấu hình + không gian làm việc mặc định khi bị thiếu (và bỏ qua bước khởi tạo).

Luồng được khuyến nghị (hồ sơ phát triển + khởi tạo phát triển):

```bash
pnpm gateway:dev
OPENCLAW_PROFILE=dev openclaw tui
```

Nếu không cài đặt toàn cục, hãy chạy CLI qua `pnpm openclaw ...`.

Các thao tác được thực hiện:

1. **Cô lập hồ sơ** (`--dev` toàn cục)
   - `OPENCLAW_PROFILE=dev`
   - `OPENCLAW_STATE_DIR=~/.openclaw-dev`
   - `OPENCLAW_CONFIG_PATH=~/.openclaw-dev/openclaw.json`
   - `OPENCLAW_GATEWAY_PORT=19001` (các cổng trình duyệt/canvas dịch chuyển tương ứng)

2. **Khởi tạo phát triển** (`gateway --dev`)
   - Ghi cấu hình tối thiểu nếu bị thiếu (`gateway.mode=local`, liên kết loopback).
   - Đặt `agents.defaults.workspace` thành không gian làm việc phát triển và `agents.defaults.skipBootstrap=true`.
   - Tạo sẵn các tệp không gian làm việc nếu bị thiếu: `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`.
   - Danh tính mặc định: **C3-PO** (người máy giao thức).
   - `pnpm gateway:dev` cũng đặt `OPENCLAW_SKIP_CHANNELS=1` để bỏ qua các nhà cung cấp kênh.

Theo mặc định, các Gateway phát triển bỏ qua tác nhân kích hoạt kênh từ môi trường xung quanh, vì vậy thông tin xác thực kế thừa từ shell không kết nối phiên bản phát triển với các dịch vụ kênh thực. Cấu hình `channels.<id>` rõ ràng vẫn hoạt động. Truyền `--dev-ambient-channels` cùng `--dev` để khôi phục cấu hình tự động kênh từ môi trường xung quanh cho lần chạy đó.

Luồng đặt lại (khởi đầu mới):

```bash
pnpm gateway:dev:reset
```

<Note>
`--dev` là cờ hồ sơ **toàn cục** và bị một số trình chạy sử dụng mất. Nếu cần viết rõ cờ này, hãy dùng dạng biến môi trường:

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

</Note>

`--reset` xóa sạch cấu hình, thông tin xác thực, phiên và không gian làm việc phát triển (chuyển vào thùng rác, không xóa vĩnh viễn), sau đó tạo lại thiết lập phát triển mặc định.

<Tip>
Nếu một Gateway không dành cho phát triển đang chạy (launchd hoặc systemd), hãy dừng nó trước:

```bash
openclaw gateway stop
```

</Tip>

## Ghi nhật ký luồng thô

OpenClaw có thể ghi nhật ký **luồng thô của trợ lý** trước mọi bước lọc/định dạng. Đây là cách tốt nhất để xem phần suy luận có đến dưới dạng các delta văn bản thuần túy (hay dưới dạng các khối suy nghĩ riêng biệt) hay không.

Bật qua CLI:

```bash
pnpm gateway:watch --raw-stream
```

Tùy chọn ghi đè đường dẫn:

```bash
pnpm gateway:watch --raw-stream --raw-stream-path ~/.openclaw/logs/raw-stream.jsonl
```

Các biến môi trường tương đương:

```bash
OPENCLAW_RAW_STREAM=1
OPENCLAW_RAW_STREAM_PATH=~/.openclaw/logs/raw-stream.jsonl
```

Tệp mặc định: `~/.openclaw/logs/raw-stream.jsonl`

## Lưu ý an toàn

- Nhật ký luồng thô có thể bao gồm đầy đủ lời nhắc, đầu ra công cụ và dữ liệu người dùng.
- Giữ nhật ký cục bộ và xóa sau khi gỡ lỗi.
- Nếu chia sẻ nhật ký, trước tiên hãy loại bỏ bí mật và thông tin nhận dạng cá nhân.

## Gỡ lỗi trong VSCode

Cần có bản đồ mã nguồn vì bản dựng băm tên tệp được tạo. `launch.json` đi kèm nhắm đến dịch vụ Gateway:

1. **Dựng lại và gỡ lỗi Gateway** - xóa `/dist` và dựng lại với tính năng gỡ lỗi được bật trước khi khởi động Gateway.
2. **Gỡ lỗi Gateway** - gỡ lỗi bản dựng hiện có mà không thay đổi `/dist`.

### Thiết lập

1. Mở **Run and Debug** (Thanh hoạt động hoặc `Ctrl`+`Shift`+`D`).
2. Chọn **Rebuild and Debug Gateway** rồi nhấn **Start Debugging**.

Để tự quản lý chu kỳ dựng/gỡ lỗi, hãy làm như sau:

1. Bật bản đồ mã nguồn trong terminal:
   - **Linux/macOS**: `export OUTPUT_SOURCE_MAPS=1`
   - **Windows (PowerShell)**: `$env:OUTPUT_SOURCE_MAPS="1"`
   - **Windows (CMD)**: `set OUTPUT_SOURCE_MAPS=1`
2. Dựng lại: `pnpm clean:dist && pnpm build`
3. Chọn **Debug Gateway** rồi nhấn **Start Debugging**.

Đặt điểm ngắt trong các tệp TypeScript `src/`; trình gỡ lỗi ánh xạ chúng tới JavaScript đã biên dịch thông qua bản đồ mã nguồn.

### Lưu ý

- **Rebuild and Debug Gateway** xóa `/dist` và chạy toàn bộ `pnpm build` với bản đồ mã nguồn trong mỗi lần khởi chạy.
- **Debug Gateway** có thể khởi động/dừng mà không ảnh hưởng đến `/dist`, nhưng bạn phải quản lý chu kỳ dựng trong một terminal riêng.
- Chỉnh sửa `launch.json` `args` để gỡ lỗi các lệnh con CLI khác.
- Để dùng CLI đã dựng cho các tác vụ khác (ví dụ: `dashboard --no-open` nếu phiên gỡ lỗi tạo mã thông báo xác thực mới), hãy chạy từ một terminal khác: `node ./openclaw.mjs` hoặc một bí danh như `alias openclaw-build="node $(pwd)/openclaw.mjs"`.

## Liên quan

- [Khắc phục sự cố](/vi/help/troubleshooting)
- [Câu hỏi thường gặp](/vi/help/faq)
