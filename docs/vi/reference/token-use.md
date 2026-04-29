---
read_when:
    - Giải thích mức sử dụng token, chi phí hoặc cửa sổ ngữ cảnh
    - Gỡ lỗi sự gia tăng ngữ cảnh hoặc hành vi Compaction
summary: Cách OpenClaw xây dựng ngữ cảnh lời nhắc và báo cáo mức sử dụng mã thông báo + chi phí
title: Mức sử dụng token và chi phí
x-i18n:
    generated_at: "2026-04-29T23:13:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: a3807ccae3313a731c2673edace8a5b37dc22259d436a67b4d787e45682dad3c
    source_path: reference/token-use.md
    workflow: 16
---

# Mức dùng token & chi phí

OpenClaw theo dõi **token**, không phải ký tự. Token phụ thuộc vào mô hình, nhưng hầu hết các mô hình kiểu OpenAI trung bình khoảng ~4 ký tự mỗi token đối với văn bản tiếng Anh.

## Cách lời nhắc hệ thống được xây dựng

OpenClaw lắp ráp lời nhắc hệ thống riêng trong mỗi lần chạy. Nó bao gồm:

- Danh sách công cụ + mô tả ngắn
- Danh sách Skills (chỉ siêu dữ liệu; hướng dẫn được tải theo yêu cầu bằng `read`).
  Khối skills rút gọn bị giới hạn bởi `skills.limits.maxSkillsPromptChars`,
  với ghi đè tùy chọn theo từng agent tại
  `agents.list[].skillsLimits.maxSkillsPromptChars`.
- Hướng dẫn tự cập nhật
- Không gian làm việc + tệp khởi động (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` khi mới, cộng với `MEMORY.md` khi có). Gốc chữ thường `memory.md` không được chèn; đó là đầu vào sửa chữa cũ cho `openclaw doctor --fix` khi đi kèm với `MEMORY.md`. Các tệp lớn bị cắt ngắn bởi `agents.defaults.bootstrapMaxChars` (mặc định: 12000), và tổng nội dung khởi động được chèn bị giới hạn bởi `agents.defaults.bootstrapTotalMaxChars` (mặc định: 60000). Các tệp hằng ngày `memory/*.md` không thuộc lời nhắc khởi động thông thường; chúng vẫn được truy xuất theo yêu cầu qua công cụ bộ nhớ trong các lượt bình thường, nhưng các lần chạy mô hình khi đặt lại/khởi động có thể thêm trước một khối ngữ cảnh khởi động một lần với bộ nhớ hằng ngày gần đây cho lượt đầu tiên đó. Các lệnh chat thuần `/new` và `/reset` được xác nhận mà không gọi mô hình. Phần mở đầu khởi động được điều khiển bởi `agents.defaults.startupContext`.
- Thời gian (UTC + múi giờ người dùng)
- Thẻ trả lời + hành vi Heartbeat
- Siêu dữ liệu thời gian chạy (máy chủ/HĐH/mô hình/suy nghĩ)

Xem phân tích đầy đủ trong [Lời nhắc hệ thống](/vi/concepts/system-prompt).

## Những gì được tính trong cửa sổ ngữ cảnh

Mọi thứ mô hình nhận được đều được tính vào giới hạn ngữ cảnh:

- Lời nhắc hệ thống (tất cả các phần được liệt kê ở trên)
- Lịch sử hội thoại (tin nhắn người dùng + trợ lý)
- Lệnh gọi công cụ và kết quả công cụ
- Tệp đính kèm/bản ghi (hình ảnh, âm thanh, tệp)
- Tóm tắt Compaction và hiện vật cắt tỉa
- Lớp bọc của nhà cung cấp hoặc tiêu đề an toàn (không hiển thị, nhưng vẫn được tính)

Một số bề mặt nặng về thời gian chạy có các giới hạn rõ ràng riêng:

- `agents.defaults.contextLimits.memoryGetMaxChars`
- `agents.defaults.contextLimits.memoryGetDefaultLines`
- `agents.defaults.contextLimits.toolResultMaxChars`
- `agents.defaults.contextLimits.postCompactionMaxChars`

Ghi đè theo từng agent nằm dưới `agents.list[].contextLimits`. Các núm này dành cho các đoạn trích thời gian chạy có giới hạn và các khối do thời gian chạy sở hữu được chèn vào. Chúng tách biệt với giới hạn khởi động, giới hạn ngữ cảnh khởi động và giới hạn lời nhắc skills.

Đối với hình ảnh, OpenClaw thu nhỏ payload hình ảnh bản ghi/công cụ trước khi gọi nhà cung cấp.
Dùng `agents.defaults.imageMaxDimensionPx` (mặc định: `1200`) để điều chỉnh:

- Giá trị thấp hơn thường giảm mức dùng token thị giác và kích thước payload.
- Giá trị cao hơn giữ lại nhiều chi tiết hình ảnh hơn cho ảnh chụp màn hình nặng về OCR/UI.

Để có phân tích thực tế (theo từng tệp được chèn, công cụ, Skills và kích thước lời nhắc hệ thống), dùng `/context list` hoặc `/context detail`. Xem [Ngữ cảnh](/vi/concepts/context).

## Cách xem mức dùng token hiện tại

Dùng các lệnh này trong chat:

- `/status` → **thẻ trạng thái nhiều emoji** với mô hình phiên, mức dùng ngữ cảnh,
  token đầu vào/đầu ra của phản hồi cuối, và **chi phí ước tính** (chỉ khóa API).
- `/usage off|tokens|full` → thêm **chân trang mức dùng theo từng phản hồi** vào mọi câu trả lời.
  - Duy trì theo phiên (được lưu dưới dạng `responseUsage`).
  - Xác thực OAuth **ẩn chi phí** (chỉ token).
- `/usage cost` → hiển thị tóm tắt chi phí cục bộ từ nhật ký phiên OpenClaw.

Các bề mặt khác:

- **TUI/Web TUI:** `/status` + `/usage` được hỗ trợ.
- **CLI:** `openclaw status --usage` và `openclaw channels list` hiển thị
  cửa sổ hạn mức nhà cung cấp đã chuẩn hóa (`X% left`, không phải chi phí theo từng phản hồi).
  Các nhà cung cấp cửa sổ mức dùng hiện tại: Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi, và z.ai.

Các bề mặt mức dùng chuẩn hóa các bí danh trường gốc phổ biến của nhà cung cấp trước khi hiển thị.
Đối với lưu lượng Responses thuộc họ OpenAI, điều đó bao gồm cả `input_tokens` /
`output_tokens` và `prompt_tokens` / `completion_tokens`, nên tên trường theo từng transport
không làm thay đổi `/status`, `/usage`, hoặc tóm tắt phiên.
Mức dùng JSON của Gemini CLI cũng được chuẩn hóa: văn bản trả lời đến từ `response`, và
`stats.cached` ánh xạ thành `cacheRead` với `stats.input_tokens - stats.cached`
được dùng khi CLI bỏ qua trường `stats.input` rõ ràng.
Đối với lưu lượng Responses gốc thuộc họ OpenAI, bí danh mức dùng WebSocket/SSE được
chuẩn hóa theo cùng cách, và tổng số rơi về đầu vào + đầu ra đã chuẩn hóa khi
`total_tokens` bị thiếu hoặc bằng `0`.
Khi snapshot phiên hiện tại thưa dữ liệu, `/status` và `session_status` cũng có thể
khôi phục bộ đếm token/cache và nhãn mô hình thời gian chạy đang hoạt động từ
nhật ký mức dùng bản ghi gần nhất. Các giá trị trực tiếp khác không hiện bằng 0 vẫn
được ưu tiên hơn giá trị dự phòng từ bản ghi, và tổng bản ghi lớn hơn theo hướng lời nhắc
có thể thắng khi tổng đã lưu bị thiếu hoặc nhỏ hơn.
Xác thực mức dùng cho cửa sổ hạn mức nhà cung cấp đến từ hook riêng của nhà cung cấp khi
có; nếu không, OpenClaw rơi về thông tin xác thực OAuth/khóa API khớp
từ hồ sơ xác thực, env, hoặc cấu hình.
Các mục bản ghi của trợ lý duy trì cùng dạng mức dùng đã chuẩn hóa, bao gồm
`usage.cost` khi mô hình đang hoạt động có cấu hình giá và nhà cung cấp
trả về siêu dữ liệu mức dùng. Điều này cho `/usage cost` và trạng thái phiên dựa trên bản ghi
một nguồn ổn định ngay cả sau khi trạng thái thời gian chạy trực tiếp không còn.

OpenClaw giữ hạch toán mức dùng của nhà cung cấp tách biệt với snapshot ngữ cảnh hiện tại.
`usage.total` của nhà cung cấp có thể bao gồm đầu vào đã cache, đầu ra, và nhiều
lệnh gọi mô hình trong vòng lặp công cụ, nên nó hữu ích cho chi phí và đo lường từ xa nhưng có thể phóng đại
cửa sổ ngữ cảnh trực tiếp. Hiển thị ngữ cảnh và chẩn đoán dùng snapshot lời nhắc mới nhất
(`promptTokens`, hoặc lệnh gọi mô hình cuối khi không có snapshot lời nhắc
khả dụng) cho `context.used`.

## Ước tính chi phí (khi hiển thị)

Chi phí được ước tính từ cấu hình giá mô hình của bạn:

```
models.providers.<provider>.models[].cost
```

Đây là **USD trên 1M token** cho `input`, `output`, `cacheRead`, và
`cacheWrite`. Nếu thiếu giá, OpenClaw chỉ hiển thị token. Token OAuth
không bao giờ hiển thị chi phí đô la.

Khởi động Gateway cũng thực hiện một bước khởi động giá tùy chọn trong nền cho
các ref mô hình đã cấu hình nhưng chưa có giá cục bộ. Bước khởi động đó
tải các danh mục giá OpenRouter và LiteLLM từ xa. Đặt
`models.pricing.enabled: false` để bỏ qua các lần tải danh mục khởi động đó trên mạng ngoại tuyến
hoặc bị hạn chế; các mục `models.providers.*.models[].cost` rõ ràng
vẫn tiếp tục điều khiển ước tính chi phí cục bộ.

## TTL cache và tác động cắt tỉa

Cache lời nhắc của nhà cung cấp chỉ áp dụng trong cửa sổ TTL cache. OpenClaw có thể
tùy chọn chạy **cắt tỉa cache-ttl**: nó cắt tỉa phiên sau khi TTL cache
hết hạn, rồi đặt lại cửa sổ cache để các yêu cầu sau có thể dùng lại
ngữ cảnh vừa được cache thay vì cache lại toàn bộ lịch sử. Điều này giữ
chi phí ghi cache thấp hơn khi một phiên rảnh quá TTL.

Cấu hình trong [Cấu hình Gateway](/vi/gateway/configuration) và xem
chi tiết hành vi trong [Cắt tỉa phiên](/vi/concepts/session-pruning).

Heartbeat có thể giữ cache **ấm** qua các khoảng rảnh. Nếu TTL cache mô hình của bạn
là `1h`, đặt khoảng Heartbeat ngay dưới mức đó (ví dụ: `55m`) có thể tránh
cache lại toàn bộ lời nhắc, giảm chi phí ghi cache.

Trong thiết lập đa agent, bạn có thể giữ một cấu hình mô hình dùng chung và tinh chỉnh hành vi cache
theo từng agent bằng `agents.list[].params.cacheRetention`.

Để xem hướng dẫn đầy đủ theo từng núm, xem [Cache lời nhắc](/vi/reference/prompt-caching).

Đối với giá API Anthropic, đọc cache rẻ hơn đáng kể so với token đầu vào,
trong khi ghi cache được tính phí với hệ số cao hơn. Xem giá cache lời nhắc của Anthropic
để biết mức giá và hệ số TTL mới nhất:
[https://docs.anthropic.com/docs/build-with-claude/prompt-caching](https://docs.anthropic.com/docs/build-with-claude/prompt-caching)

### Ví dụ: giữ ấm cache 1h bằng heartbeat

```yaml
agents:
  defaults:
    model:
      primary: "anthropic/claude-opus-4-6"
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "long"
    heartbeat:
      every: "55m"
```

### Ví dụ: lưu lượng hỗn hợp với chiến lược cache theo từng agent

```yaml
agents:
  defaults:
    model:
      primary: "anthropic/claude-opus-4-6"
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "long" # default baseline for most agents
  list:
    - id: "research"
      default: true
      heartbeat:
        every: "55m" # keep long cache warm for deep sessions
    - id: "alerts"
      params:
        cacheRetention: "none" # avoid cache writes for bursty notifications
```

`agents.list[].params` hợp nhất lên trên `params` của mô hình đã chọn, nên bạn có thể
chỉ ghi đè `cacheRetention` và kế thừa các mặc định mô hình khác mà không đổi.

### Ví dụ: bật tiêu đề beta ngữ cảnh 1M của Anthropic

Cửa sổ ngữ cảnh 1M của Anthropic hiện đang bị giới hạn bởi beta. OpenClaw có thể chèn
giá trị `anthropic-beta` bắt buộc khi bạn bật `context1m` trên các mô hình Opus
hoặc Sonnet được hỗ trợ.

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        params:
          context1m: true
```

Điều này ánh xạ tới tiêu đề beta `context-1m-2025-08-07` của Anthropic.

Điều này chỉ áp dụng khi `context1m: true` được đặt trên mục mô hình đó.

Yêu cầu: thông tin xác thực phải đủ điều kiện dùng ngữ cảnh dài. Nếu không,
Anthropic phản hồi bằng lỗi giới hạn tốc độ phía nhà cung cấp cho yêu cầu đó.

Nếu bạn xác thực Anthropic bằng token OAuth/gói đăng ký (`sk-ant-oat-*`),
OpenClaw bỏ qua tiêu đề beta `context-1m-*` vì Anthropic hiện
từ chối tổ hợp đó bằng HTTP 401.

## Mẹo giảm áp lực token

- Dùng `/compact` để tóm tắt các phiên dài.
- Cắt bớt đầu ra công cụ lớn trong quy trình làm việc của bạn.
- Hạ `agents.defaults.imageMaxDimensionPx` cho các phiên nhiều ảnh chụp màn hình.
- Giữ mô tả skill ngắn (danh sách skill được chèn vào lời nhắc).
- Ưu tiên mô hình nhỏ hơn cho công việc dài dòng, thăm dò.

Xem [Skills](/vi/tools/skills) để biết công thức chi phí phụ trội chính xác của danh sách skill.

## Liên quan

- [Mức dùng API và chi phí](/vi/reference/api-usage-costs)
- [Cache lời nhắc](/vi/reference/prompt-caching)
- [Theo dõi mức dùng](/vi/concepts/usage-tracking)
