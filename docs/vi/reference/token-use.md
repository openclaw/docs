---
read_when:
    - Giải thích mức sử dụng token, chi phí hoặc cửa sổ ngữ cảnh
    - Gỡ lỗi sự tăng trưởng ngữ cảnh hoặc hành vi Compaction
summary: Cách OpenClaw xây dựng ngữ cảnh lời nhắc và báo cáo mức sử dụng token + chi phí
title: Mức sử dụng token và chi phí
x-i18n:
    generated_at: "2026-05-06T09:29:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 51c0fc6bdfb32edc1908d0a25ddbc0e90d745ef38fede02fbeca612ca1a5f59e
    source_path: reference/token-use.md
    workflow: 16
---

OpenClaw theo dõi **token**, không phải ký tự. Token phụ thuộc vào từng mô hình, nhưng hầu hết các mô hình kiểu OpenAI trung bình khoảng 4 ký tự mỗi token đối với văn bản tiếng Anh.

## Cách xây dựng prompt hệ thống

OpenClaw tự lắp ráp prompt hệ thống của nó trong mỗi lần chạy. Prompt này bao gồm:

- Danh sách công cụ + mô tả ngắn
- Danh sách Skills (chỉ siêu dữ liệu; hướng dẫn được tải theo nhu cầu bằng `read`).
  Khối Skills rút gọn được giới hạn bởi `skills.limits.maxSkillsPromptChars`,
  với ghi đè tùy chọn cho từng agent tại
  `agents.list[].skillsLimits.maxSkillsPromptChars`.
- Hướng dẫn tự cập nhật
- Workspace + các tệp bootstrap (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` khi mới, cộng với `MEMORY.md` khi có). Root `memory.md` viết thường không được chèn; nó là đầu vào sửa chữa kế thừa cho `openclaw doctor --fix` khi đi kèm với `MEMORY.md`. Các tệp lớn được cắt ngắn bởi `agents.defaults.bootstrapMaxChars` (mặc định: 12000), và tổng lượng chèn bootstrap được giới hạn bởi `agents.defaults.bootstrapTotalMaxChars` (mặc định: 60000). Các tệp hằng ngày `memory/*.md` không thuộc prompt bootstrap thông thường; chúng vẫn được truy cập theo nhu cầu thông qua công cụ bộ nhớ trong các lượt bình thường, nhưng các lần chạy mô hình reset/khởi động có thể thêm trước một khối ngữ cảnh khởi động dùng một lần với bộ nhớ hằng ngày gần đây cho lượt đầu tiên đó. Các lệnh chat trần `/new` và `/reset` được xác nhận mà không gọi mô hình. Phần mở đầu khởi động được kiểm soát bởi `agents.defaults.startupContext`.
- Thời gian (UTC + múi giờ người dùng)
- Thẻ trả lời + hành vi Heartbeat
- Siêu dữ liệu runtime (host/OS/mô hình/thinking)

Xem phân tích đầy đủ trong [Prompt hệ thống](/vi/concepts/system-prompt).

## Những gì được tính trong cửa sổ ngữ cảnh

Mọi thứ mô hình nhận được đều được tính vào giới hạn ngữ cảnh:

- Prompt hệ thống (tất cả các phần được liệt kê ở trên)
- Lịch sử hội thoại (tin nhắn người dùng + assistant)
- Lệnh gọi công cụ và kết quả công cụ
- Tệp đính kèm/bản ghi (hình ảnh, âm thanh, tệp)
- Tóm tắt Compaction và các tạo tác cắt tỉa
- Wrapper của nhà cung cấp hoặc header an toàn (không hiển thị, nhưng vẫn được tính)

Một số bề mặt nặng về runtime có giới hạn rõ ràng riêng:

- `agents.defaults.contextLimits.memoryGetMaxChars`
- `agents.defaults.contextLimits.memoryGetDefaultLines`
- `agents.defaults.contextLimits.toolResultMaxChars`
- `agents.defaults.contextLimits.postCompactionMaxChars`

Ghi đè theo từng agent nằm dưới `agents.list[].contextLimits`. Các núm điều chỉnh này dành cho đoạn trích runtime có giới hạn và các khối do runtime sở hữu được chèn vào. Chúng tách biệt với giới hạn bootstrap, giới hạn ngữ cảnh khởi động và giới hạn prompt Skills.

Đối với hình ảnh, OpenClaw giảm kích thước payload hình ảnh trong bản ghi/công cụ trước khi gọi nhà cung cấp.
Dùng `agents.defaults.imageMaxDimensionPx` (mặc định: `1200`) để tinh chỉnh:

- Giá trị thấp hơn thường giảm mức dùng token thị giác và kích thước payload.
- Giá trị cao hơn giữ lại nhiều chi tiết hình ảnh hơn cho ảnh chụp màn hình nặng OCR/UI.

Để có phân tích thực tế (theo từng tệp được chèn, công cụ, Skills và kích thước prompt hệ thống), dùng `/context list` hoặc `/context detail`. Xem [Ngữ cảnh](/vi/concepts/context).

## Cách xem mức dùng token hiện tại

Dùng các lệnh này trong chat:

- `/status` → **thẻ trạng thái nhiều emoji** với mô hình phiên, mức dùng ngữ cảnh,
  token đầu vào/đầu ra của phản hồi gần nhất và **chi phí ước tính** (chỉ API key).
- `/usage off|tokens|full` → thêm **footer mức dùng theo từng phản hồi** vào mọi câu trả lời.
  - Duy trì theo từng phiên (được lưu dưới dạng `responseUsage`).
  - Xác thực OAuth **ẩn chi phí** (chỉ token).
- `/usage cost` → hiển thị tóm tắt chi phí cục bộ từ nhật ký phiên OpenClaw.

Các bề mặt khác:

- **TUI/Web TUI:** hỗ trợ `/status` + `/usage`.
- **CLI:** `openclaw status --usage` và `openclaw channels list` hiển thị
  các cửa sổ hạn mức nhà cung cấp đã chuẩn hóa (`X% left`, không phải chi phí theo từng phản hồi).
  Các nhà cung cấp có cửa sổ mức dùng hiện tại: Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi và z.ai.

Các bề mặt mức dùng chuẩn hóa những bí danh trường gốc phổ biến của nhà cung cấp trước khi hiển thị.
Đối với lưu lượng Responses thuộc họ OpenAI, điều đó bao gồm cả `input_tokens` /
`output_tokens` và `prompt_tokens` / `completion_tokens`, nên tên trường đặc thù theo transport
không làm thay đổi `/status`, `/usage` hoặc tóm tắt phiên.
Mức dùng JSON của Gemini CLI cũng được chuẩn hóa: văn bản trả lời lấy từ `response`, và
`stats.cached` ánh xạ sang `cacheRead` với `stats.input_tokens - stats.cached`
được dùng khi CLI bỏ qua trường `stats.input` rõ ràng.
Đối với lưu lượng Responses gốc thuộc họ OpenAI, bí danh mức dùng WebSocket/SSE được
chuẩn hóa theo cùng cách, và tổng sẽ dự phòng về đầu vào + đầu ra đã chuẩn hóa khi
`total_tokens` bị thiếu hoặc là `0`.
Khi snapshot phiên hiện tại thưa dữ liệu, `/status` và `session_status` cũng có thể
khôi phục bộ đếm token/cache và nhãn mô hình runtime đang hoạt động từ nhật ký mức dùng bản ghi gần nhất. Các giá trị live khác 0 hiện có vẫn được ưu tiên hơn
giá trị dự phòng từ bản ghi, và tổng bản ghi thiên về prompt lớn hơn có thể thắng khi tổng đã lưu bị thiếu hoặc nhỏ hơn.
Xác thực mức dùng cho cửa sổ hạn mức nhà cung cấp đến từ các hook dành riêng cho nhà cung cấp khi
có sẵn; nếu không OpenClaw dự phòng bằng cách khớp thông tin xác thực OAuth/API-key
từ hồ sơ xác thực, env hoặc cấu hình.
Các mục bản ghi assistant lưu cùng một hình dạng mức dùng đã chuẩn hóa, bao gồm
`usage.cost` khi mô hình đang hoạt động có cấu hình giá và nhà cung cấp
trả về siêu dữ liệu mức dùng. Điều này cho `/usage cost` và trạng thái phiên dựa trên bản ghi
một nguồn ổn định ngay cả sau khi trạng thái runtime live không còn.

OpenClaw giữ phần hạch toán mức dùng nhà cung cấp tách biệt với snapshot ngữ cảnh hiện tại. `usage.total` của nhà cung cấp có thể bao gồm đầu vào đã lưu cache, đầu ra và nhiều
lệnh gọi mô hình trong vòng lặp công cụ, nên nó hữu ích cho chi phí và telemetry nhưng có thể phóng đại
cửa sổ ngữ cảnh live. Hiển thị ngữ cảnh và chẩn đoán dùng snapshot prompt mới nhất
(`promptTokens`, hoặc lệnh gọi mô hình cuối cùng khi không có snapshot prompt)
cho `context.used`.

## Ước tính chi phí (khi hiển thị)

Chi phí được ước tính từ cấu hình giá mô hình của bạn:

```
models.providers.<provider>.models[].cost
```

Đây là **USD trên 1 triệu token** cho `input`, `output`, `cacheRead` và
`cacheWrite`. Nếu thiếu giá, OpenClaw chỉ hiển thị token. Token OAuth
không bao giờ hiển thị chi phí bằng đô la.

Sau khi sidecar và kênh đi tới đường dẫn sẵn sàng của Gateway, OpenClaw bắt đầu
một bootstrap giá nền tùy chọn cho các ref mô hình đã cấu hình nhưng chưa
có giá cục bộ. Bootstrap đó lấy catalog giá OpenRouter và LiteLLM từ xa. Đặt `models.pricing.enabled: false` để bỏ qua các lần lấy catalog đó
trên mạng ngoại tuyến hoặc bị hạn chế; các mục
`models.providers.*.models[].cost` rõ ràng tiếp tục điều khiển ước tính chi phí
cục bộ.

## TTL cache và tác động cắt tỉa

Bộ nhớ đệm prompt của nhà cung cấp chỉ áp dụng trong cửa sổ TTL cache. OpenClaw có thể
tùy chọn chạy **cắt tỉa cache-ttl**: nó cắt tỉa phiên sau khi TTL cache
hết hạn, rồi đặt lại cửa sổ cache để các yêu cầu tiếp theo có thể dùng lại
ngữ cảnh mới được cache thay vì cache lại toàn bộ lịch sử. Điều này giúp giữ
chi phí ghi cache thấp hơn khi một phiên rảnh quá TTL.

Cấu hình trong [Cấu hình Gateway](/vi/gateway/configuration) và xem
chi tiết hành vi trong [Cắt tỉa phiên](/vi/concepts/session-pruning).

Heartbeat có thể giữ cache **ấm** qua các khoảng rảnh. Nếu TTL cache của mô hình là
`1h`, đặt khoảng Heartbeat ngay dưới mức đó (ví dụ: `55m`) có thể tránh
cache lại toàn bộ prompt, giảm chi phí ghi cache.

Trong thiết lập nhiều agent, bạn có thể giữ một cấu hình mô hình dùng chung và tinh chỉnh hành vi cache
theo từng agent bằng `agents.list[].params.cacheRetention`.

Để có hướng dẫn đầy đủ theo từng núm điều chỉnh, xem [Bộ nhớ đệm prompt](/vi/reference/prompt-caching).

Đối với giá Anthropic API, lượt đọc cache rẻ hơn đáng kể so với token đầu vào,
trong khi lượt ghi cache được tính phí với hệ số cao hơn. Xem giá bộ nhớ đệm prompt của Anthropic để biết mức giá và hệ số TTL mới nhất:
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

`agents.list[].params` được hợp nhất lên trên `params` của mô hình đã chọn, nên bạn có thể
chỉ ghi đè `cacheRetention` và kế thừa các mặc định mô hình khác không đổi.

### Ví dụ: bật header beta ngữ cảnh 1 triệu của Anthropic

Cửa sổ ngữ cảnh 1 triệu của Anthropic hiện được kiểm soát bằng beta. OpenClaw có thể chèn
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

Điều này ánh xạ tới header beta `context-1m-2025-08-07` của Anthropic.

Điều này chỉ áp dụng khi `context1m: true` được đặt trên mục mô hình đó.

Yêu cầu: thông tin xác thực phải đủ điều kiện dùng ngữ cảnh dài. Nếu không,
Anthropic phản hồi bằng lỗi giới hạn tốc độ phía nhà cung cấp cho yêu cầu đó.

Nếu bạn xác thực Anthropic bằng token OAuth/gói đăng ký (`sk-ant-oat-*`),
OpenClaw bỏ qua header beta `context-1m-*` vì Anthropic hiện
từ chối tổ hợp đó bằng HTTP 401.

## Mẹo giảm áp lực token

- Dùng `/compact` để tóm tắt các phiên dài.
- Cắt bớt đầu ra công cụ lớn trong workflow của bạn.
- Giảm `agents.defaults.imageMaxDimensionPx` cho các phiên nhiều ảnh chụp màn hình.
- Giữ mô tả Skills ngắn (danh sách Skills được chèn vào prompt).
- Ưu tiên mô hình nhỏ hơn cho công việc thăm dò, nhiều lời.

Xem [Skills](/vi/tools/skills) để biết công thức chính xác về phần phát sinh của danh sách Skills.

## Liên quan

- [Mức dùng API và chi phí](/vi/reference/api-usage-costs)
- [Bộ nhớ đệm prompt](/vi/reference/prompt-caching)
- [Theo dõi mức dùng](/vi/concepts/usage-tracking)
