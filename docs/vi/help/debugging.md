---
read_when:
    - Bạn cần kiểm tra đầu ra thô của mô hình để phát hiện việc rò rỉ nội dung suy luận
    - Bạn muốn chạy Gateway ở chế độ theo dõi trong khi liên tục chỉnh sửa
    - Bạn cần một quy trình gỡ lỗi có thể lặp lại
summary: 'Công cụ gỡ lỗi: chế độ theo dõi, luồng mô hình thô và truy vết rò rỉ nội dung suy luận'
title: Gỡ lỗi
x-i18n:
    generated_at: "2026-07-12T07:58:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a7723dfffdcd74e8e6b7bdec2507f9b008f5e0e8f82295a4e687f3b84f142df9
    source_path: help/debugging.md
    workflow: 16
---

Các tiện ích gỡ lỗi cho đầu ra truyền trực tiếp, quá trình lặp Gateway và lập hồ sơ khởi động.

## Ghi đè gỡ lỗi thời gian chạy

`/debug` đặt các giá trị ghi đè cấu hình **chỉ dành cho thời gian chạy** (trong bộ nhớ, không phải trên đĩa). Mặc định bị tắt; bật bằng `commands.debug: true`.

```text
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset` xóa tất cả giá trị ghi đè và trở về cấu hình trên đĩa.

## Đầu ra truy vết phiên

`/trace` hiển thị các dòng truy vết/gỡ lỗi do plugin sở hữu cho một phiên mà không bật toàn bộ chế độ chi tiết. Dùng lệnh này để chẩn đoán plugin, chẳng hạn như bản tóm tắt gỡ lỗi Active Memory; dùng `/verbose` cho đầu ra trạng thái/công cụ thông thường.

```text
/trace
/trace on
/trace off
```

## Truy vết vòng đời Plugin

Đặt `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` để xem phân tích theo từng giai đoạn về siêu dữ liệu plugin, khám phá, sổ đăng ký, bản sao thời gian chạy, thay đổi cấu hình và công việc làm mới. Kết quả được ghi vào stderr, vì vậy đầu ra lệnh JSON vẫn có thể phân tích cú pháp.

```bash
OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1 openclaw plugins install tokenjuice --force
```

```text
[plugins:lifecycle] phase="config read" ms=6.83 status=ok command="install"
[plugins:lifecycle] phase="slot selection" ms=94.31 status=ok command="install" pluginId="tokenjuice"
[plugins:lifecycle] phase="registry refresh" ms=51.56 status=ok command="install" reason="source-changed"
```

Hãy dùng cách này trước khi dùng đến trình lập hồ sơ CPU. Từ bản checkout mã nguồn, đo thời gian chạy đã xây dựng bằng `node dist/entry.js ...` sau `pnpm build`; `pnpm openclaw ...` cũng đo cả chi phí bổ sung của trình chạy mã nguồn.

## Lập hồ sơ khởi động và lệnh CLI

Các phép đo hiệu năng khởi động được lưu trong kho mã:

```bash
pnpm test:startup:bench:smoke
pnpm tsx scripts/bench-cli-startup.ts --preset real --case status --runs 3
pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu
```

Để lập hồ sơ một lần thông qua trình chạy mã nguồn thông thường, hãy đặt `OPENCLAW_RUN_NODE_CPU_PROF_DIR`:

```bash
OPENCLAW_RUN_NODE_CPU_PROF_DIR=.artifacts/cli-cpu pnpm openclaw status
```

Trình chạy mã nguồn thêm các cờ lập hồ sơ CPU của Node và ghi tệp `.cpuprofile` cho lệnh. Hãy dùng cách này trước khi thêm công cụ đo tạm thời vào mã lệnh.

Đối với tình trạng khởi động bị treo có vẻ do thao tác hệ thống tệp đồng bộ hoặc bộ nạp mô-đun, hãy thêm cờ truy vết I/O đồng bộ của Node thông qua trình chạy mã nguồn:

```bash
OPENCLAW_TRACE_SYNC_IO=1 pnpm openclaw gateway --force
```

`pnpm gateway:watch` mặc định để cờ này ở trạng thái tắt cho tiến trình Gateway con đang được theo dõi; hãy đặt `OPENCLAW_TRACE_SYNC_IO=1` khi bạn cũng muốn có đầu ra truy vết I/O đồng bộ trong chế độ theo dõi.

## Chế độ theo dõi Gateway

```bash
pnpm gateway:watch
```

Theo mặc định, lệnh này khởi động hoặc khởi động lại một phiên tmux có tên `openclaw-gateway-watch-<profile>` (ví dụ `openclaw-gateway-watch-main`), với hậu tố cổng như `openclaw-gateway-watch-dev-19001` chỉ được thêm khi `OPENCLAW_GATEWAY_PORT` khác cổng mặc định `18789`. Lệnh tự động đính kèm từ các terminal tương tác; các shell không tương tác, CI và lệnh thực thi của tác nhân vẫn ở trạng thái tách rời và thay vào đó in hướng dẫn đính kèm:

```bash
tmux attach -t openclaw-gateway-watch-main
```

Khung tmux chạy trình theo dõi thô:

```bash
node scripts/watch-node.mjs gateway --force
```

Dừng dịch vụ Gateway đã cài đặt trước khi theo dõi cùng một cổng:

```bash
pnpm openclaw gateway stop
```

Cờ `--force` của trình theo dõi xóa trình lắng nghe hiện tại, nhưng không vô hiệu hóa dịch vụ được giám sát. Nếu không, dịch vụ launchd, systemd hoặc Scheduled Task có thể tái khởi chạy và thay thế Gateway đang được theo dõi.

Chế độ chạy nền trước không dùng tmux:

```bash
pnpm gateway:watch:raw
# hoặc
OPENCLAW_GATEWAY_WATCH_TMUX=0 pnpm gateway:watch
```

Giữ chức năng quản lý tmux nhưng tắt tự động đính kèm:

```bash
OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch
```

Lập hồ sơ thời gian CPU của Gateway đang được theo dõi khi gỡ lỗi các điểm nóng trong quá trình khởi động/thời gian chạy:

```bash
pnpm gateway:watch --benchmark
```

Trình bao theo dõi sử dụng `--benchmark` trước khi gọi Gateway và ghi một tệp V8 `.cpuprofile` cho mỗi lần tiến trình Gateway con thoát trong `.artifacts/gateway-watch-profiles/`. Dừng hoặc khởi động lại gateway đang được theo dõi để ghi hoàn tất hồ sơ hiện tại, sau đó mở bằng Chrome DevTools hoặc Speedscope:

```bash
npx speedscope .artifacts/gateway-watch-profiles/*.cpuprofile
```

- `--benchmark-dir <path>`: ghi hồ sơ vào vị trí khác.
- `--benchmark-no-force`: bỏ qua thao tác dọn dẹp cổng mặc định bằng `--force` và thất bại ngay nếu cổng Gateway đã được sử dụng.

Chế độ đo hiệu năng mặc định ngăn lượng lớn thông báo truy vết I/O đồng bộ. Đặt `OPENCLAW_TRACE_SYNC_IO=1` cùng `--benchmark` để nhận cả hồ sơ CPU và truy vết ngăn xếp I/O đồng bộ; trong chế độ đo hiệu năng, các khối truy vết đó được ghi vào `gateway-watch-output.log` trong thư mục đo hiệu năng (được lọc khỏi khung terminal), trong khi nhật ký Gateway thông thường vẫn hiển thị.

Trình bao tmux chuyển các bộ chọn thời gian chạy phổ biến không chứa bí mật vào khung, bao gồm `OPENCLAW_PROFILE`, `OPENCLAW_CONFIG_PATH`, `OPENCLAW_STATE_DIR`, `OPENCLAW_GATEWAY_PORT` và `OPENCLAW_SKIP_CHANNELS`. Đặt thông tin xác thực của nhà cung cấp trong hồ sơ/cấu hình thông thường hoặc dùng chế độ nền trước thô cho các bí mật tạm thời chỉ dùng một lần.

Nếu Gateway đang được theo dõi thoát trong khi khởi động, trình theo dõi chạy `openclaw doctor --fix --non-interactive` một lần rồi khởi động lại tiến trình Gateway con. Đặt `OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0` để xem lỗi khởi động ban đầu mà không có lượt sửa chữa chỉ dành cho môi trường phát triển.

Khung tmux được quản lý mặc định hiển thị nhật ký Gateway có màu; đặt `FORCE_COLOR=0` khi khởi động `pnpm gateway:watch` để tắt đầu ra ANSI.

Trình theo dõi khởi động lại khi các tệp liên quan đến bản dựng trong `src/`, các tệp mã nguồn tiện ích mở rộng, siêu dữ liệu `package.json` và `openclaw.plugin.json` của tiện ích mở rộng, `tsconfig.json`, `package.json` và `tsdown.config.ts` thay đổi. Các thay đổi siêu dữ liệu tiện ích mở rộng khởi động lại gateway mà không buộc xây dựng lại; thay đổi mã nguồn và cấu hình vẫn xây dựng lại `dist` trước.

Thêm các cờ CLI của gateway sau `gateway:watch` và chúng sẽ được chuyển tiếp trong mỗi lần khởi động lại. Chạy lại cùng một lệnh theo dõi sẽ tái tạo khung tmux có tên tương ứng; trình theo dõi thô duy trì khóa trình theo dõi duy nhất để các tiến trình cha trùng lặp được thay thế thay vì tích tụ.

## Hồ sơ phát triển + gateway phát triển (--dev)

Có hai cờ `--dev` **riêng biệt**:

- **`--dev` toàn cục (hồ sơ):** cô lập trạng thái trong `~/.openclaw-dev` và đặt cổng gateway mặc định thành `19001` (các cổng dẫn xuất cũng thay đổi theo).
- **`gateway --dev`:** yêu cầu Gateway tự động tạo cấu hình + không gian làm việc mặc định khi chưa có (và bỏ qua quá trình bootstrap).

Quy trình được khuyến nghị (hồ sơ phát triển + bootstrap phát triển):

```bash
pnpm gateway:dev
OPENCLAW_PROFILE=dev openclaw tui
```

Nếu không cài đặt toàn cục, hãy chạy CLI qua `pnpm openclaw ...`.

Các tác vụ được thực hiện:

1. **Cô lập hồ sơ** (`--dev` toàn cục)
   - `OPENCLAW_PROFILE=dev`
   - `OPENCLAW_STATE_DIR=~/.openclaw-dev`
   - `OPENCLAW_CONFIG_PATH=~/.openclaw-dev/openclaw.json`
   - `OPENCLAW_GATEWAY_PORT=19001` (các cổng trình duyệt/canvas thay đổi tương ứng)

2. **Bootstrap phát triển** (`gateway --dev`)
   - Ghi cấu hình tối thiểu nếu chưa có (`gateway.mode=local`, liên kết với local loopback).
   - Đặt `agents.defaults.workspace` thành không gian làm việc phát triển và `agents.defaults.skipBootstrap=true`.
   - Khởi tạo các tệp không gian làm việc nếu chưa có: `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`.
   - Danh tính mặc định: **C3-PO** (người máy giao thức).
   - `pnpm gateway:dev` cũng đặt `OPENCLAW_SKIP_CHANNELS=1` để bỏ qua các nhà cung cấp kênh.

Quy trình đặt lại (khởi đầu mới):

```bash
pnpm gateway:dev:reset
```

<Note>
`--dev` là cờ hồ sơ **toàn cục** và bị một số trình chạy sử dụng mất. Nếu cần chỉ định rõ, hãy dùng dạng biến môi trường:

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

</Note>

`--reset` xóa sạch cấu hình, thông tin xác thực, phiên và không gian làm việc phát triển (chuyển vào thùng rác, không xóa vĩnh viễn), sau đó tạo lại thiết lập phát triển mặc định.

<Tip>
Nếu một gateway không dành cho phát triển đang chạy (launchd hoặc systemd), hãy dừng nó trước:

```bash
openclaw gateway stop
```

</Tip>

## Ghi nhật ký luồng thô

OpenClaw có thể ghi nhật ký **luồng thô của trợ lý** trước mọi bước lọc/định dạng. Đây là cách tốt nhất để xem liệu nội dung suy luận có đến dưới dạng các phần chênh lệch văn bản thuần túy (hay dưới dạng các khối suy nghĩ riêng biệt).

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

Tệp mặc định: `~/.openclaw/logs/raw-stream.jsonl`

## Lưu ý an toàn

- Nhật ký luồng thô có thể chứa toàn bộ lời nhắc, đầu ra công cụ và dữ liệu người dùng.
- Giữ nhật ký cục bộ và xóa chúng sau khi gỡ lỗi.
- Nếu chia sẻ nhật ký, trước tiên hãy loại bỏ bí mật và thông tin nhận dạng cá nhân.

## Gỡ lỗi trong VSCode

Cần có bản đồ mã nguồn vì quá trình xây dựng tạo mã băm cho tên tệp được sinh ra. Tệp `launch.json` đi kèm nhắm đến dịch vụ Gateway:

1. **Rebuild and Debug Gateway** - xóa `/dist` và xây dựng lại với chế độ gỡ lỗi được bật trước khi khởi động Gateway.
2. **Debug Gateway** - gỡ lỗi bản dựng hiện có mà không thay đổi `/dist`.

### Thiết lập

1. Mở **Run and Debug** (Thanh Hoạt động hoặc `Ctrl`+`Shift`+`D`).
2. Chọn **Rebuild and Debug Gateway** rồi nhấn **Start Debugging**.

Để quản lý thủ công chu kỳ xây dựng/gỡ lỗi:

1. Bật bản đồ mã nguồn trong terminal:
   - **Linux/macOS**: `export OUTPUT_SOURCE_MAPS=1`
   - **Windows (PowerShell)**: `$env:OUTPUT_SOURCE_MAPS="1"`
   - **Windows (CMD)**: `set OUTPUT_SOURCE_MAPS=1`
2. Xây dựng lại: `pnpm clean:dist && pnpm build`
3. Chọn **Debug Gateway** rồi nhấn **Start Debugging**.

Đặt điểm ngắt trong các tệp TypeScript thuộc `src/`; trình gỡ lỗi ánh xạ chúng tới JavaScript đã biên dịch thông qua bản đồ mã nguồn.

### Lưu ý

- **Rebuild and Debug Gateway** xóa `/dist` và chạy toàn bộ `pnpm build` với bản đồ mã nguồn trong mỗi lần khởi chạy.
- **Debug Gateway** có thể khởi động/dừng mà không ảnh hưởng đến `/dist`, nhưng bạn quản lý chu kỳ xây dựng trong một terminal riêng.
- Chỉnh sửa `args` trong `launch.json` để gỡ lỗi các lệnh con CLI khác.
- Để dùng CLI đã xây dựng cho các tác vụ khác (ví dụ `dashboard --no-open` nếu phiên gỡ lỗi của bạn tạo mã thông báo xác thực mới), hãy chạy từ một terminal khác: `node ./openclaw.mjs` hoặc một bí danh như `alias openclaw-build="node $(pwd)/openclaw.mjs"`.

## Liên quan

- [Khắc phục sự cố](/vi/help/troubleshooting)
- [Câu hỏi thường gặp](/vi/help/faq)
