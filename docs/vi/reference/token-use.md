---
read_when:
    - Giải thích việc sử dụng token, chi phí hoặc cửa sổ ngữ cảnh
    - Gỡ lỗi sự tăng trưởng ngữ cảnh hoặc hành vi Compaction
summary: Cách OpenClaw xây dựng ngữ cảnh prompt và báo cáo mức sử dụng token + chi phí
title: Mức sử dụng token và chi phí
x-i18n:
    generated_at: "2026-06-27T18:11:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0035ec9cf8d97aa6e78b9d95549cfb458af3bc2b5a4e2db83708281465c7e1af
    source_path: reference/token-use.md
    workflow: 16
---

OpenClaw theo dõi **token**, không phải ký tự. Token phụ thuộc vào từng model, nhưng hầu hết
các model kiểu OpenAI trung bình khoảng ~4 ký tự mỗi token đối với văn bản tiếng Anh.

## Cách system prompt được xây dựng

OpenClaw tự lắp ráp system prompt của riêng nó trong mỗi lần chạy. Nó bao gồm:

- Danh sách công cụ + mô tả ngắn
- Danh sách Skills (chỉ metadata; hướng dẫn được tải theo yêu cầu bằng `read`).
  Các lượt Codex native nhận khối skills gọn dưới dạng hướng dẫn developer cộng tác
  theo phạm vi lượt; các harness khác nhận nó trên bề mặt prompt thông thường.
  Nó bị giới hạn bởi `skills.limits.maxSkillsPromptChars`, với tùy chọn ghi đè theo agent
  tại `agents.list[].skillsLimits.maxSkillsPromptChars`.
- Hướng dẫn tự cập nhật
- Workspace + các tệp bootstrap (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` khi mới, cộng với `MEMORY.md` khi có). Các lượt Codex native không dán thô `MEMORY.md` từ workspace agent đã cấu hình khi công cụ bộ nhớ có sẵn cho workspace đó; chúng bao gồm một con trỏ bộ nhớ nhỏ trong hướng dẫn developer cộng tác theo phạm vi lượt và dùng công cụ bộ nhớ theo yêu cầu. Nếu công cụ bị tắt, tìm kiếm bộ nhớ không khả dụng, hoặc workspace đang hoạt động khác với workspace bộ nhớ của agent, `MEMORY.md` dùng đường dẫn ngữ cảnh lượt có giới hạn thông thường. Root `memory.md` viết thường không được chèn; nó là đầu vào sửa chữa legacy cho `openclaw doctor --fix` khi đi kèm với `MEMORY.md`. Các tệp được chèn lớn bị cắt ngắn bởi `agents.defaults.bootstrapMaxChars` (mặc định: 20000), và tổng phần chèn bootstrap bị giới hạn bởi `agents.defaults.bootstrapTotalMaxChars` (mặc định: 60000). Các tệp hằng ngày `memory/*.md` không phải là một phần của prompt bootstrap thông thường; chúng vẫn được truy cập theo yêu cầu qua công cụ bộ nhớ trong các lượt thông thường, nhưng các lần chạy model khi reset/khởi động có thể thêm trước một khối ngữ cảnh khởi động một lần với bộ nhớ hằng ngày gần đây cho lượt đầu tiên đó. Các lệnh chat trần `/new` và `/reset` được xác nhận mà không gọi model. Phần mở đầu khởi động được kiểm soát bởi `agents.defaults.startupContext`. Các trích đoạn AGENTS.md sau Compaction là riêng biệt và yêu cầu opt-in rõ ràng bằng `agents.defaults.compaction.postCompactionSections`.
- Thời gian (UTC + múi giờ người dùng)
- Thẻ trả lời + hành vi Heartbeat
- Metadata runtime (host/OS/model/thinking)

Xem phân tích đầy đủ trong [System Prompt](/vi/concepts/system-prompt).

Khi ghi tài liệu về credential hoặc đoạn mã auth, hãy dùng
[Quy ước Placeholder Bí mật](/vi/reference/secret-placeholder-conventions) để
tránh cảnh báo giả của secret-scanner trong các thay đổi chỉ liên quan đến tài liệu.

## Những gì được tính trong cửa sổ ngữ cảnh

Mọi thứ model nhận đều được tính vào giới hạn ngữ cảnh:

- System prompt (tất cả các phần được liệt kê ở trên)
- Lịch sử hội thoại (tin nhắn người dùng + assistant)
- Lệnh gọi công cụ và kết quả công cụ
- Tệp đính kèm/bản ghi (hình ảnh, âm thanh, tệp)
- Tóm tắt Compaction và hiện vật cắt giảm
- Wrapper của provider hoặc header an toàn (không hiển thị, nhưng vẫn được tính)

Một số bề mặt nặng về runtime có các giới hạn rõ ràng riêng:

- `agents.defaults.contextLimits.memoryGetMaxChars`
- `agents.defaults.contextLimits.memoryGetDefaultLines`
- `agents.defaults.contextLimits.toolResultMaxChars`
- `agents.defaults.contextLimits.postCompactionMaxChars`

Ghi đè theo agent nằm dưới `agents.list[].contextLimits`. Các núm chỉnh này
dành cho trích đoạn runtime có giới hạn và các khối do runtime sở hữu được chèn.
Chúng tách biệt với giới hạn bootstrap, giới hạn ngữ cảnh khởi động, và giới hạn
prompt skills.

`toolResultMaxChars` là một trần nâng cao (tối đa `1000000` ký tự). Khi chưa đặt, OpenClaw chọn
giới hạn kết quả công cụ trực tiếp từ cửa sổ ngữ cảnh hiệu dụng của model: `16000` ký tự
dưới 100K token, `32000` ký tự ở 100K+ token, và `64000` ký tự ở 200K+
token, vẫn bị giới hạn bởi guard chia sẻ ngữ cảnh runtime.

Đối với hình ảnh, OpenClaw giảm tỷ lệ payload hình ảnh trong transcript/công cụ trước khi gọi provider.
Dùng `agents.defaults.imageMaxDimensionPx` (mặc định: `1200`) để tinh chỉnh:

- Giá trị thấp hơn thường giảm mức dùng token thị giác và kích thước payload.
- Giá trị cao hơn giữ lại nhiều chi tiết trực quan hơn cho ảnh chụp màn hình nặng về OCR/UI.

Để xem phân tích thực tế (theo từng tệp được chèn, công cụ, skills, và kích thước system prompt), dùng `/context list` hoặc `/context detail`. Xem [Ngữ cảnh](/vi/concepts/context).

## Cách xem mức dùng token hiện tại

Dùng các lệnh này trong chat:

- `/status` → **thẻ trạng thái nhiều emoji** với model của phiên, mức dùng ngữ cảnh,
  token đầu vào/đầu ra của phản hồi cuối, và **chi phí ước tính** khi giá cục bộ
  được cấu hình cho model đang hoạt động.
- `/usage off|tokens|full` → thêm **footer mức dùng theo từng phản hồi** vào mọi câu trả lời.
  - Tồn tại theo phiên (được lưu dưới dạng `responseUsage`).
  - `/usage reset` (bí danh: `inherit`, `clear`, `default`) — xóa ghi đè phiên
    để phiên kế thừa lại mặc định đã cấu hình.
  - `/usage full` chỉ hiển thị chi phí ước tính khi OpenClaw có metadata mức dùng và
    giá cục bộ cho model đang hoạt động. Nếu không, nó chỉ hiển thị token.
- `/usage cost` → hiển thị tóm tắt chi phí cục bộ từ log phiên OpenClaw.

Các bề mặt khác:

- **TUI/Web TUI:** hỗ trợ `/status` + `/usage`.
- **CLI:** `openclaw status --usage` và `openclaw channels list` hiển thị
  các cửa sổ hạn mức provider đã chuẩn hóa (`X% left`, không phải chi phí theo từng phản hồi).
  Các provider cửa sổ mức dùng hiện tại: Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi, và z.ai.

Các bề mặt mức dùng chuẩn hóa các bí danh trường native phổ biến của provider trước khi hiển thị.
Đối với lưu lượng Responses họ OpenAI, điều đó bao gồm cả `input_tokens` /
`output_tokens` và `prompt_tokens` / `completion_tokens`, nên tên trường theo transport
không làm thay đổi `/status`, `/usage`, hoặc tóm tắt phiên.
Mức dùng Gemini CLI cũng được chuẩn hóa: parser `stream-json` mặc định đọc
các sự kiện `message` của assistant, và `stats.cached` ánh xạ thành `cacheRead` với
`stats.input_tokens - stats.cached` được dùng khi CLI bỏ qua trường
`stats.input` rõ ràng. Các ghi đè JSON legacy vẫn đọc văn bản trả lời từ
`response`.
Đối với lưu lượng Responses native họ OpenAI, bí danh mức dùng WebSocket/SSE được
chuẩn hóa theo cùng cách, và tổng số fallback về đầu vào + đầu ra đã chuẩn hóa khi
`total_tokens` bị thiếu hoặc bằng `0`.
Khi snapshot phiên hiện tại thưa dữ liệu, `/status` và `session_status` cũng có thể
khôi phục bộ đếm token/cache và nhãn model runtime đang hoạt động từ log mức dùng transcript
gần nhất. Các giá trị live khác 0 hiện có vẫn được ưu tiên hơn
giá trị fallback từ transcript, và các tổng transcript thiên về prompt lớn hơn
có thể thắng khi tổng đã lưu bị thiếu hoặc nhỏ hơn.
Auth mức dùng cho cửa sổ hạn mức provider đến từ hook riêng của provider khi
có sẵn; nếu không OpenClaw fallback sang credential OAuth/API-key khớp
từ auth profile, env, hoặc config.
Các mục transcript của assistant lưu cùng hình dạng mức dùng đã chuẩn hóa, bao gồm
`usage.cost` khi model đang hoạt động có giá được cấu hình và provider
trả về metadata mức dùng. Điều này cung cấp cho `/usage cost` và trạng thái phiên dựa trên transcript
một nguồn ổn định ngay cả sau khi trạng thái runtime live đã biến mất.

OpenClaw giữ kế toán mức dùng provider tách biệt với snapshot ngữ cảnh hiện tại.
`usage.total` của provider có thể bao gồm đầu vào được cache, đầu ra, và nhiều
lệnh gọi model trong vòng lặp công cụ, nên nó hữu ích cho chi phí và telemetry nhưng có thể phóng đại
cửa sổ ngữ cảnh live. Hiển thị và chẩn đoán ngữ cảnh dùng snapshot prompt mới nhất
(`promptTokens`, hoặc lệnh gọi model cuối cùng khi không có snapshot prompt
khả dụng) cho `context.used`.

## Ước tính chi phí (khi được hiển thị)

Chi phí được ước tính từ config giá model của bạn:

```
models.providers.<provider>.models[].cost
```

Đây là **USD trên 1M token** cho `input`, `output`, `cacheRead`, và
`cacheWrite`. Nếu thiếu giá, OpenClaw chỉ hiển thị token. Hiển thị chi phí
không bị giới hạn ở auth API-key: các provider không dùng API-key như `aws-sdk` có thể hiển thị
chi phí ước tính khi mục model đã cấu hình của chúng bao gồm giá cục bộ và
provider trả về metadata mức dùng.

Sau khi sidecar và kênh đi tới đường dẫn sẵn sàng của Gateway, OpenClaw khởi động một
bootstrap giá nền tùy chọn cho các tham chiếu model đã cấu hình nhưng chưa
có giá cục bộ. Bootstrap đó lấy catalog giá OpenRouter và LiteLLM từ xa.
Đặt `models.pricing.enabled: false` để bỏ qua các lần lấy catalog đó
trên mạng offline hoặc bị hạn chế; các mục
`models.providers.*.models[].cost` rõ ràng tiếp tục điều khiển ước tính chi phí
cục bộ.

## TTL cache và tác động cắt tỉa

Cache prompt của provider chỉ áp dụng trong cửa sổ TTL cache. OpenClaw có thể
tùy chọn chạy **cắt tỉa cache-ttl**: nó cắt tỉa phiên sau khi TTL cache
hết hạn, rồi reset cửa sổ cache để các yêu cầu tiếp theo có thể tái sử dụng
ngữ cảnh vừa được cache mới thay vì cache lại toàn bộ lịch sử. Điều này giữ chi phí
ghi cache thấp hơn khi một phiên nhàn rỗi quá TTL.

Cấu hình nó trong [Cấu hình Gateway](/vi/gateway/configuration) và xem
chi tiết hành vi trong [Cắt tỉa phiên](/vi/concepts/session-pruning).

Heartbeat có thể giữ cache **ấm** qua các khoảng nhàn rỗi. Nếu TTL cache của model là
`1h`, đặt khoảng Heartbeat ngay dưới mức đó (ví dụ, `55m`) có thể tránh
cache lại toàn bộ prompt, giảm chi phí ghi cache.

Trong các thiết lập nhiều agent, bạn có thể giữ một config model dùng chung và tinh chỉnh hành vi cache
theo từng agent bằng `agents.list[].params.cacheRetention`.

Để xem hướng dẫn đầy đủ theo từng núm chỉnh, xem [Prompt Caching](/vi/reference/prompt-caching).

Đối với giá Anthropic API, lượt đọc cache rẻ hơn đáng kể so với token đầu vào,
trong khi lượt ghi cache được tính phí với hệ số cao hơn. Xem giá prompt caching của Anthropic
để biết mức giá và hệ số TTL mới nhất:
[https://docs.anthropic.com/docs/build-with-claude/prompt-caching](https://docs.anthropic.com/docs/build-with-claude/prompt-caching)

### Ví dụ: giữ cache 1h ấm bằng Heartbeat

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

### Ví dụ: lưu lượng hỗn hợp với chiến lược cache theo agent

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

`agents.list[].params` được hợp nhất lên trên `params` của model đã chọn, nên bạn có thể
chỉ ghi đè `cacheRetention` và kế thừa các mặc định model khác mà không đổi.

### Ngữ cảnh Anthropic 1M

OpenClaw định cỡ các model Claude 4.x có khả năng GA như Opus 4.8, Opus 4.7, Opus 4.6, và
Sonnet 4.6 với cửa sổ ngữ cảnh 1M của Anthropic. Bạn không cần
`params.context1m: true` cho các model đó.

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        alias: opus
```

Các config cũ hơn có thể giữ `context1m: true`, nhưng OpenClaw không còn gửi
beta header `context-1m-2025-08-07` đã bị Anthropic ngừng dùng cho thiết lập này và
không mở rộng các model Claude cũ hơn không được hỗ trợ lên 1M.

Yêu cầu: credential phải đủ điều kiện dùng ngữ cảnh dài. Nếu không,
Anthropic phản hồi bằng lỗi giới hạn tốc độ phía provider cho yêu cầu đó.

Nếu bạn xác thực Anthropic bằng token OAuth/subscription (`sk-ant-oat-*`),
OpenClaw giữ các beta header Anthropic bắt buộc cho OAuth trong khi loại bỏ
beta `context-1m-*` đã ngừng dùng nếu nó vẫn còn trong config cũ.

## Mẹo giảm áp lực token

- Dùng `/compact` để tóm tắt các phiên dài.
- Cắt bớt đầu ra công cụ lớn trong workflow của bạn.
- Giảm `agents.defaults.imageMaxDimensionPx` cho các phiên nhiều ảnh chụp màn hình.
- Giữ mô tả skill ngắn (danh sách skill được chèn vào prompt).
- Ưu tiên model nhỏ hơn cho công việc dài dòng, mang tính khám phá.

Xem [Skills](/vi/tools/skills) để biết công thức chính xác về overhead của danh sách skill.

## Liên quan

- [Mức sử dụng API và chi phí](/vi/reference/api-usage-costs)
- [Bộ nhớ đệm prompt](/vi/reference/prompt-caching)
- [Theo dõi mức sử dụng](/vi/concepts/usage-tracking)
