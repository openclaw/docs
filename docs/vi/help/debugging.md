---
read_when:
    - Bạn cần kiểm tra đầu ra thô của mô hình để phát hiện rò rỉ lập luận
    - Bạn muốn chạy Gateway ở chế độ theo dõi trong khi lặp chỉnh sửa
    - Bạn cần một quy trình gỡ lỗi có thể lặp lại
summary: 'Công cụ gỡ lỗi: chế độ theo dõi, luồng thô từ mô hình và truy vết rò rỉ suy luận'
title: Gỡ lỗi
x-i18n:
    generated_at: "2026-05-02T20:44:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: de4bd994079f5463f4734404d1ba0768cb003609e16113f5f8f14179a190e917
    source_path: help/debugging.md
    workflow: 16
---

Trình trợ giúp gỡ lỗi cho đầu ra phát trực tuyến, đặc biệt khi một nhà cung cấp trộn phần suy luận vào văn bản thông thường.

## Ghi đè gỡ lỗi lúc chạy

Dùng `/debug` trong chat để đặt các ghi đè cấu hình **chỉ lúc chạy** (bộ nhớ, không phải đĩa).
`/debug` bị tắt theo mặc định; bật bằng `commands.debug: true`.
Điều này hữu ích khi bạn cần bật/tắt các thiết lập khó thấy mà không sửa `openclaw.json`.

Ví dụ:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset` xóa mọi ghi đè và trở về cấu hình trên đĩa.

## Đầu ra trace phiên

Dùng `/trace` khi bạn muốn xem các dòng trace/gỡ lỗi do Plugin sở hữu trong một phiên
mà không bật chế độ chi tiết đầy đủ.

Ví dụ:

```text
/trace
/trace on
/trace off
```

Dùng `/trace` cho chẩn đoán Plugin, chẳng hạn như tóm tắt gỡ lỗi Active Memory.
Tiếp tục dùng `/verbose` cho đầu ra trạng thái/công cụ chi tiết thông thường, và tiếp tục dùng
`/debug` cho các ghi đè cấu hình chỉ lúc chạy.

## Trace vòng đời Plugin

Dùng `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` khi các lệnh vòng đời Plugin có vẻ chậm
và bạn cần bản phân tích pha tích hợp sẵn cho siêu dữ liệu Plugin, khám phá, registry,
bản sao runtime, đột biến cấu hình, và công việc làm mới. Trace là tùy chọn bật và ghi
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

Dùng cách này để điều tra vòng đời Plugin trước khi dùng trình phân tích CPU.
Nếu lệnh đang chạy từ một checkout mã nguồn, ưu tiên đo runtime đã build
bằng `node dist/entry.js ...` sau `pnpm build`; `pnpm openclaw ...`
cũng đo phần chi phí của source-runner.

## Đo thời gian gỡ lỗi CLI tạm thời

OpenClaw giữ `src/cli/debug-timing.ts` làm một trình trợ giúp nhỏ cho điều tra
cục bộ. Nó cố ý không được nối vào khởi động CLI, định tuyến lệnh,
hoặc bất kỳ lệnh nào theo mặc định. Chỉ dùng nó khi gỡ lỗi một lệnh chậm, rồi
xóa import và các span trước khi đưa thay đổi hành vi vào nhánh chính.

Dùng cách này khi một lệnh chậm và bạn cần bản phân tích pha nhanh trước khi
quyết định dùng trình phân tích CPU hay sửa một hệ con cụ thể.

### Thêm span tạm thời

Thêm trình trợ giúp gần đoạn mã bạn đang điều tra. Ví dụ, khi gỡ lỗi
`openclaw models list`, một bản vá tạm thời trong
`src/commands/models/list.list-command.ts` có thể trông như sau:

```ts
// Temporary debugging only. Remove before landing.
import { createCliDebugTiming } from "../../cli/debug-timing.js";

const timing = createCliDebugTiming({ command: "models list" });

const authStore = timing.time("debug:models:list:auth_store", () => ensureAuthProfileStore());

const loaded = await timing.timeAsync(
  "debug:models:list:registry",
  () => loadListModelRegistry(cfg, { sourceConfig }),
  (result) => ({
    models: result.models.length,
    discoveredKeys: result.discoveredKeys.size,
  }),
);
```

Hướng dẫn:

- Thêm tiền tố `debug:` cho tên pha tạm thời.
- Chỉ thêm vài span quanh các phần nghi là chậm.
- Ưu tiên các pha rộng như `registry`, `auth_store`, hoặc `rows` thay vì tên
  trình trợ giúp.
- Dùng `time()` cho công việc đồng bộ và `timeAsync()` cho promise.
- Giữ stdout sạch. Trình trợ giúp ghi vào stderr, nên đầu ra JSON của lệnh vẫn
  có thể phân tích được.
- Xóa các import và span tạm thời trước khi mở PR sửa lỗi cuối cùng.
- Đưa đầu ra đo thời gian hoặc một bản tóm tắt ngắn vào issue hoặc PR để giải thích
  phần tối ưu hóa.

### Chạy với đầu ra dễ đọc

Chế độ dễ đọc phù hợp nhất cho gỡ lỗi trực tiếp:

```bash
OPENCLAW_DEBUG_TIMING=1 pnpm openclaw models list --all --provider moonshot
```

Đầu ra ví dụ từ một lần điều tra `models list` tạm thời:

```text
OpenClaw CLI debug timing: models list
     0ms     +0ms start all=true json=false local=false plain=false provider="moonshot"
     2ms     +2ms debug:models:list:import_runtime duration=2ms
    17ms    +14ms debug:models:list:load_config duration=14ms sourceConfig=true
  20.3s  +20.3s debug:models:list:auth_store duration=20.3s
  20.3s     +0ms debug:models:list:resolve_agent_dir duration=0ms agentDir=true
  20.3s     +0ms debug:models:list:resolve_provider_filter duration=0ms
  25.3s   +5.0s debug:models:list:ensure_models_json duration=5.0s
  31.2s   +5.9s debug:models:list:load_model_registry duration=5.9s models=869 availableKeys=38 discoveredKeys=868 availabilityError=false
  31.2s     +0ms debug:models:list:resolve_configured_entries duration=0ms entries=1
  31.2s     +0ms debug:models:list:build_configured_lookup duration=0ms entries=1
  33.6s   +2.4s debug:models:list:read_registry_models duration=2.4s models=871
  35.2s   +1.5s debug:models:list:append_discovered_rows duration=1.5s seenKeys=0 rows=0
  36.9s   +1.7s debug:models:list:append_catalog_supplement_rows duration=1.7s seenKeys=5 rows=5

Model                                      Input       Ctx   Local Auth  Tags
moonshot/kimi-k2-thinking                  text        256k  no    no
moonshot/kimi-k2-thinking-turbo            text        256k  no    no
moonshot/kimi-k2-turbo                     text        250k  no    no
moonshot/kimi-k2.5                         text+image  256k  no    no
moonshot/kimi-k2.6                         text+image  256k  no    no

  36.9s     +0ms debug:models:list:print_model_table duration=0ms rows=5
  36.9s     +0ms complete rows=5
```

Phát hiện từ đầu ra này:

| Pha                                      | Thời gian  | Ý nghĩa                                                                                                  |
| ---------------------------------------- | ---------: | -------------------------------------------------------------------------------------------------------- |
| `debug:models:list:auth_store`           |      20.3s | Việc tải kho auth-profile là chi phí lớn nhất và nên được điều tra trước.                                |
| `debug:models:list:ensure_models_json`   |       5.0s | Đồng bộ `models.json` đủ tốn kém để cần kiểm tra điều kiện cache hoặc bỏ qua.                            |
| `debug:models:list:load_model_registry`  |       5.9s | Việc dựng registry và kiểm tra tính khả dụng của nhà cung cấp cũng là các chi phí đáng kể.               |
| `debug:models:list:read_registry_models` |       2.4s | Đọc tất cả model trong registry không miễn phí và có thể quan trọng với `--all`.                         |
| các pha thêm hàng                        | tổng 3.2s  | Việc dựng năm hàng hiển thị vẫn mất vài giây, nên đường dẫn lọc cần được xem xét kỹ hơn.                 |
| `debug:models:list:print_model_table`    |        0ms | Render không phải là điểm nghẽn.                                                                         |

Những phát hiện đó đủ để định hướng bản vá tiếp theo mà không giữ mã đo thời gian trong
các đường dẫn production.

### Chạy với đầu ra JSON

Dùng chế độ JSON khi bạn muốn lưu hoặc so sánh dữ liệu đo thời gian:

```bash
OPENCLAW_DEBUG_TIMING=json pnpm openclaw models list --all --provider moonshot \
  2> .artifacts/models-list-timing.jsonl
```

Mỗi dòng stderr là một đối tượng JSON:

```json
{
  "command": "models list",
  "phase": "debug:models:list:registry",
  "elapsedMs": 31200,
  "deltaMs": 5900,
  "durationMs": 5900,
  "models": 869,
  "discoveredKeys": 868
}
```

### Dọn dẹp trước khi đưa vào nhánh chính

Trước khi mở PR cuối cùng:

```bash
rg 'createCliDebugTiming|debug:[a-z0-9_-]+:' src/commands src/cli \
  --glob '!src/cli/debug-timing.*' \
  --glob '!*.test.ts'
```

Lệnh này không nên trả về vị trí gọi instrumentation tạm thời nào trừ khi PR
đang bổ sung một bề mặt chẩn đoán lâu dài một cách rõ ràng. Với các bản sửa
hiệu năng thông thường, chỉ giữ thay đổi hành vi, test, và một ghi chú ngắn kèm
bằng chứng đo thời gian.

Với các điểm nóng CPU sâu hơn, dùng profiling của Node (`--cpu-prof`) hoặc một
trình phân tích bên ngoài thay vì thêm nhiều wrapper đo thời gian hơn.

## Chế độ theo dõi Gateway

Để lặp nhanh, chạy gateway dưới trình theo dõi tệp:

```bash
pnpm gateway:watch
```

Theo mặc định, lệnh này khởi động hoặc khởi động lại một phiên tmux tên là
`openclaw-gateway-watch-main` (hoặc một biến thể theo profile/cổng cụ thể như
`openclaw-gateway-watch-dev-19001`) và tự động attach từ terminal tương tác.
Shell không tương tác, CI, và các lệnh agent exec vẫn ở trạng thái detached và in
hướng dẫn attach thay thế. Attach thủ công khi cần:

```bash
tmux attach -t openclaw-gateway-watch-main
```

Pane tmux chạy watcher thô:

```bash
node scripts/watch-node.mjs gateway --force
```

Dùng chế độ foreground khi không muốn tmux:

```bash
pnpm gateway:watch:raw
# or
OPENCLAW_GATEWAY_WATCH_TMUX=0 pnpm gateway:watch
```

Tắt auto-attach trong khi vẫn giữ quản lý tmux:

```bash
OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch
```

Phân tích thời gian CPU của Gateway được theo dõi khi gỡ lỗi các điểm nóng khởi động/runtime:

```bash
pnpm gateway:watch --benchmark
```

Wrapper watch tiêu thụ `--benchmark` trước khi gọi Gateway và ghi
một tệp V8 `.cpuprofile` cho mỗi lần tiến trình con Gateway thoát trong
`.artifacts/gateway-watch-profiles/`. Dừng hoặc khởi động lại gateway đang được theo dõi để
flush profile hiện tại, rồi mở nó bằng Chrome DevTools hoặc Speedscope:

```bash
npx speedscope .artifacts/gateway-watch-profiles/*.cpuprofile
```

Dùng `--benchmark-dir <path>` khi bạn muốn đặt profile ở nơi khác.

Wrapper tmux chuyển các bộ chọn runtime không bí mật phổ biến như
`OPENCLAW_PROFILE`, `OPENCLAW_CONFIG_PATH`, `OPENCLAW_STATE_DIR`,
`OPENCLAW_GATEWAY_PORT`, và `OPENCLAW_SKIP_CHANNELS` vào pane. Đặt
thông tin xác thực nhà cung cấp trong profile/cấu hình thông thường của bạn, hoặc dùng chế độ foreground thô
cho các bí mật tạm thời dùng một lần.
Pane tmux được quản lý cũng mặc định dùng log Gateway có màu để dễ đọc;
đặt `FORCE_COLOR=0` khi khởi động `pnpm gateway:watch` để tắt đầu ra ANSI.

Watcher khởi động lại khi có tệp liên quan đến build trong `src/`, tệp mã nguồn Plugin,
metadata `package.json` và `openclaw.plugin.json` của Plugin, `tsconfig.json`,
`package.json`, và `tsdown.config.ts`. Thay đổi metadata Plugin khởi động lại
gateway mà không buộc rebuild `tsdown`; thay đổi mã nguồn và cấu hình vẫn
rebuild `dist` trước.

Thêm mọi cờ CLI gateway sau `gateway:watch` và chúng sẽ được truyền qua trong
mỗi lần khởi động lại. Chạy lại cùng lệnh watch sẽ respawn pane tmux đã đặt tên, và
watcher thô vẫn giữ khóa single-watcher để các parent watcher trùng lặp
được thay thế thay vì chồng chất.

## Profile dev + gateway dev (`--dev`)

Dùng profile dev để cô lập trạng thái và khởi tạo một thiết lập an toàn, dùng rồi bỏ cho
gỡ lỗi. Có **hai** cờ `--dev`:

- **`--dev` toàn cục (profile):** cô lập trạng thái trong `~/.openclaw-dev` và
  mặc định cổng gateway là `19001` (các cổng dẫn xuất dịch chuyển theo).
- **`gateway --dev`: yêu cầu Gateway tự động tạo cấu hình mặc định +
  workspace** khi thiếu (và bỏ qua BOOTSTRAP.md).

Luồng khuyến nghị (profile dev + bootstrap dev):

```bash
pnpm gateway:dev
OPENCLAW_PROFILE=dev openclaw tui
```

Nếu bạn chưa có bản cài toàn cục, chạy CLI qua `pnpm openclaw ...`.

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
   - Seed các tệp workspace nếu thiếu:
     `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`.
   - Danh tính mặc định: **C3‑PO** (droid giao thức).
   - Bỏ qua nhà cung cấp kênh trong chế độ dev (`OPENCLAW_SKIP_CHANNELS=1`).

Luồng đặt lại (khởi đầu mới):

```bash
pnpm gateway:dev:reset
```

<Note>
`--dev` là cờ hồ sơ **toàn cục** và bị một số trình chạy xử lý mất. Nếu cần chỉ rõ, hãy dùng dạng biến môi trường:

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

</Note>

`--reset` xóa cấu hình, thông tin xác thực, phiên và không gian làm việc dev (dùng
`trash`, không dùng `rm`), rồi tạo lại thiết lập dev mặc định.

<Tip>
Nếu một gateway không phải dev đang chạy (launchd hoặc systemd), hãy dừng nó trước:

```bash
openclaw gateway stop
```

</Tip>

## Ghi nhật ký luồng thô (OpenClaw)

OpenClaw có thể ghi nhật ký **luồng trợ lý thô** trước mọi bước lọc/định dạng.
Đây là cách tốt nhất để xem liệu reasoning có đến dưới dạng delta văn bản thuần
(hay dưới dạng các khối suy nghĩ riêng biệt).

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

## Ghi nhật ký chunk thô (pi-mono)

Để thu thập **các chunk tương thích OpenAI thô** trước khi chúng được phân tích thành các khối,
pi-mono cung cấp một bộ ghi nhật ký riêng:

```bash
PI_RAW_STREAM=1
```

Đường dẫn tùy chọn:

```bash
PI_RAW_STREAM_PATH=~/.pi-mono/logs/raw-openai-completions.jsonl
```

Tệp mặc định:

`~/.pi-mono/logs/raw-openai-completions.jsonl`

> Lưu ý: mục này chỉ được phát ra bởi các tiến trình dùng provider
> `openai-completions` của pi-mono.

## Lưu ý an toàn

- Nhật ký luồng thô có thể bao gồm đầy đủ prompt, đầu ra công cụ và dữ liệu người dùng.
- Giữ nhật ký cục bộ và xóa chúng sau khi gỡ lỗi.
- Nếu bạn chia sẻ nhật ký, hãy loại bỏ bí mật và PII trước.

## Liên quan

- [Khắc phục sự cố](/vi/help/troubleshooting)
- [Câu hỏi thường gặp](/vi/help/faq)
