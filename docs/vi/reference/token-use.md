---
read_when:
    - Giải thích mức sử dụng token, chi phí hoặc cửa sổ ngữ cảnh
    - Gỡ lỗi sự tăng trưởng ngữ cảnh hoặc hành vi Compaction
summary: Cách OpenClaw xây dựng ngữ cảnh prompt và báo cáo mức sử dụng token + chi phí
title: Mức sử dụng token và chi phí
x-i18n:
    generated_at: "2026-07-01T18:14:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 99e3de70aeb447bb58ae414c2c5908945e8173b9b8f2bf7e4c2eb9781657c44c
    source_path: reference/token-use.md
    workflow: 16
---

OpenClaw theo dõi **token**, không phải ký tự. Token phụ thuộc vào từng mô hình, nhưng hầu hết các mô hình kiểu OpenAI trung bình khoảng ~4 ký tự mỗi token đối với văn bản tiếng Anh.

## Cách system prompt được xây dựng

OpenClaw lắp ráp system prompt riêng ở mỗi lần chạy. Nó bao gồm:

- Danh sách công cụ + mô tả ngắn
- Danh sách Skills (chỉ siêu dữ liệu; hướng dẫn được tải theo yêu cầu bằng `read`).
  Các lượt Codex gốc nhận khối skills gọn nhẹ dưới dạng hướng dẫn developer cộng tác theo phạm vi lượt; các harness khác nhận nó trong bề mặt prompt thông thường. Nó được giới hạn bởi `skills.limits.maxSkillsPromptChars`, với tùy chọn ghi đè theo từng agent tại `agents.list[].skillsLimits.maxSkillsPromptChars`.
- Hướng dẫn tự cập nhật
- Workspace + tệp bootstrap (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` khi mới, cộng với `MEMORY.md` khi có). Các lượt Codex gốc không dán `MEMORY.md` thô từ workspace agent đã cấu hình khi công cụ bộ nhớ có sẵn cho workspace đó; chúng bao gồm một con trỏ bộ nhớ nhỏ trong hướng dẫn developer cộng tác theo phạm vi lượt và dùng công cụ bộ nhớ theo yêu cầu. Nếu công cụ bị tắt, tìm kiếm bộ nhớ không khả dụng, hoặc workspace đang hoạt động khác với workspace bộ nhớ của agent, `MEMORY.md` dùng đường dẫn ngữ cảnh lượt có giới hạn thông thường. `memory.md` viết thường ở root không được chèn; nó là đầu vào sửa chữa legacy cho `openclaw doctor --fix` khi đi kèm với `MEMORY.md`. Các tệp lớn được chèn sẽ bị cắt ngắn theo `agents.defaults.bootstrapMaxChars` (mặc định: 20000), và tổng phần chèn bootstrap bị giới hạn bởi `agents.defaults.bootstrapTotalMaxChars` (mặc định: 60000). Các tệp hằng ngày `memory/*.md` không phải là một phần của bootstrap prompt thông thường; chúng vẫn có sẵn theo yêu cầu qua công cụ bộ nhớ trong các lượt bình thường, nhưng các lần chạy mô hình reset/startup có thể thêm trước một khối startup-context dùng một lần với bộ nhớ hằng ngày gần đây cho lượt đầu tiên đó. Các lệnh chat trần `/new` và `/reset` được xác nhận mà không gọi mô hình. Phần mở đầu startup được điều khiển bởi `agents.defaults.startupContext`. Các đoạn trích AGENTS.md sau Compaction là riêng biệt và yêu cầu bật rõ ràng `agents.defaults.compaction.postCompactionSections`.
- Thời gian (UTC + múi giờ người dùng)
- Thẻ trả lời + hành vi Heartbeat
- Siêu dữ liệu runtime (host/OS/model/thinking)

Xem phân tích đầy đủ trong [System Prompt](/vi/concepts/system-prompt).

Khi viết tài liệu về thông tin xác thực hoặc đoạn mã auth, hãy dùng
[Quy ước placeholder bí mật](/vi/reference/secret-placeholder-conventions) để
tránh cảnh báo dương tính giả từ secret-scanner trong các thay đổi chỉ liên quan đến tài liệu.

## Những gì được tính trong cửa sổ ngữ cảnh

Mọi thứ mô hình nhận đều được tính vào giới hạn ngữ cảnh:

- System prompt (tất cả các phần được liệt kê ở trên)
- Lịch sử hội thoại (tin nhắn người dùng + assistant)
- Lệnh gọi công cụ và kết quả công cụ
- Tệp đính kèm/bản ghi (hình ảnh, âm thanh, tệp)
- Tóm tắt Compaction và artifact cắt tỉa
- Wrapper của provider hoặc header an toàn (không hiển thị, nhưng vẫn được tính)

Một số bề mặt runtime nặng có giới hạn rõ ràng riêng:

- `agents.defaults.contextLimits.memoryGetMaxChars`
- `agents.defaults.contextLimits.memoryGetDefaultLines`
- `agents.defaults.contextLimits.toolResultMaxChars`
- `agents.defaults.contextLimits.postCompactionMaxChars`

Ghi đè theo từng agent nằm dưới `agents.list[].contextLimits`. Các núm này dùng cho các đoạn trích runtime có giới hạn và các khối được chèn do runtime sở hữu. Chúng tách biệt với giới hạn bootstrap, giới hạn startup-context, và giới hạn skills prompt.

`toolResultMaxChars` là một ngưỡng nâng cao (tối đa `1000000` ký tự). Khi chưa đặt, OpenClaw chọn giới hạn kết quả công cụ trực tiếp từ cửa sổ ngữ cảnh hiệu lực của mô hình: `16000` ký tự dưới 100K token, `32000` ký tự ở mức 100K+ token, và `64000` ký tự ở mức 200K+ token, vẫn bị giới hạn bởi bộ bảo vệ chia sẻ ngữ cảnh runtime.

Đối với hình ảnh, OpenClaw thu nhỏ tải trọng hình ảnh transcript/công cụ trước khi gọi provider.
Dùng `agents.defaults.imageMaxDimensionPx` (mặc định: `1200`) để tinh chỉnh:

- Giá trị thấp hơn thường giảm mức dùng vision-token và kích thước tải trọng.
- Giá trị cao hơn giữ lại nhiều chi tiết trực quan hơn cho ảnh chụp màn hình nhiều OCR/UI.

Để xem phân tích thực tế (theo từng tệp được chèn, công cụ, skills, và kích thước system prompt), dùng `/context list` hoặc `/context detail`. Xem [Ngữ cảnh](/vi/concepts/context).

## Cách xem mức sử dụng token hiện tại

Dùng các lệnh này trong chat:

- `/status` → **thẻ trạng thái giàu emoji** với mô hình phiên, mức sử dụng ngữ cảnh,
  token đầu vào/đầu ra của phản hồi gần nhất, và **chi phí ước tính** khi giá cục bộ được cấu hình cho mô hình đang hoạt động.
- `/usage off|tokens|full` → thêm **chân trang mức sử dụng theo từng phản hồi** vào mỗi câu trả lời.
  - Duy trì theo từng phiên (được lưu dưới dạng `responseUsage`).
  - `/usage reset` (bí danh: `inherit`, `clear`, `default`) — xóa ghi đè của phiên
    để phiên kế thừa lại mặc định đã cấu hình.
  - `/usage tokens` hiển thị chi tiết token/cache của lượt.
  - `/usage full` hiển thị chi tiết gọn về mô hình/ngữ cảnh/chi phí; chi phí ước tính chỉ xuất hiện
    khi OpenClaw có siêu dữ liệu mức sử dụng và giá cục bộ cho mô hình đang hoạt động.
    Bố cục `messages.usageTemplate` tùy chỉnh có thể bao gồm các trường token/cache.
- `/usage cost` → hiển thị tóm tắt chi phí cục bộ từ nhật ký phiên OpenClaw.

Các bề mặt khác:

- **TUI/Web TUI:** hỗ trợ `/status` + `/usage`.
- **CLI:** `openclaw status --usage` và `openclaw channels list` hiển thị
  cửa sổ hạn ngạch provider đã chuẩn hóa (`X% left`, không phải chi phí theo từng phản hồi).
  Các provider cửa sổ sử dụng hiện tại: Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi, và z.ai.

Các bề mặt mức sử dụng chuẩn hóa những bí danh trường gốc của provider phổ biến trước khi hiển thị.
Đối với lưu lượng Responses thuộc họ OpenAI, điều đó bao gồm cả `input_tokens` /
`output_tokens` và `prompt_tokens` / `completion_tokens`, nên tên trường theo từng transport
không làm thay đổi `/status`, `/usage`, hoặc tóm tắt phiên.
Mức sử dụng Gemini CLI cũng được chuẩn hóa: parser `stream-json` mặc định đọc
sự kiện `message` của assistant, và `stats.cached` ánh xạ thành `cacheRead` với
`stats.input_tokens - stats.cached` được dùng khi CLI bỏ qua trường `stats.input` rõ ràng. Các ghi đè JSON legacy vẫn đọc văn bản trả lời từ
`response`.
Đối với lưu lượng Responses gốc thuộc họ OpenAI, bí danh mức sử dụng WebSocket/SSE được
chuẩn hóa theo cùng cách, và tổng số fallback về đầu vào + đầu ra đã chuẩn hóa khi
`total_tokens` bị thiếu hoặc là `0`.
Khi snapshot phiên hiện tại thưa thớt, `/status` và `session_status` cũng có thể
khôi phục bộ đếm token/cache và nhãn mô hình runtime đang hoạt động từ nhật ký mức sử dụng transcript gần đây nhất. Các giá trị trực tiếp khác 0 hiện có vẫn được ưu tiên hơn giá trị fallback từ transcript, và tổng transcript thiên về prompt lớn hơn có thể thắng khi tổng đã lưu bị thiếu hoặc nhỏ hơn.
Auth mức sử dụng cho cửa sổ hạn ngạch provider đến từ các hook theo từng provider khi có; nếu không, OpenClaw fallback sang thông tin xác thực OAuth/API-key khớp từ hồ sơ auth, env, hoặc cấu hình.
Các mục transcript của assistant duy trì cùng hình dạng mức sử dụng đã chuẩn hóa, bao gồm
`usage.cost` khi mô hình đang hoạt động có giá được cấu hình và provider
trả về siêu dữ liệu mức sử dụng. Điều này cho `/usage cost` và trạng thái phiên dựa trên transcript một nguồn ổn định ngay cả sau khi trạng thái runtime trực tiếp không còn.

OpenClaw giữ kế toán mức sử dụng provider tách biệt với snapshot ngữ cảnh hiện tại. `usage.total` của provider có thể bao gồm đầu vào được cache, đầu ra, và nhiều lệnh gọi mô hình trong vòng lặp công cụ, nên nó hữu ích cho chi phí và telemetry nhưng có thể phóng đại cửa sổ ngữ cảnh trực tiếp. Hiển thị ngữ cảnh và chẩn đoán dùng snapshot prompt mới nhất (`promptTokens`, hoặc lệnh gọi mô hình cuối cùng khi không có snapshot prompt) cho `context.used`.

## Ước tính chi phí (khi hiển thị)

Chi phí được ước tính từ cấu hình giá mô hình của bạn:

```
models.providers.<provider>.models[].cost
```

Đây là **USD trên 1M token** cho `input`, `output`, `cacheRead`, và
`cacheWrite`. Nếu thiếu giá, `/usage full` bỏ qua chi phí; dùng `/usage tokens`
hoặc `messages.usageTemplate` tùy chỉnh khi bạn cần chi tiết token/cache trong mỗi
câu trả lời. Hiển thị chi phí không bị giới hạn ở auth bằng API-key: các provider không dùng API-key như `aws-sdk` có thể hiển thị chi phí ước tính khi mục mô hình đã cấu hình của chúng bao gồm giá cục bộ và provider trả về siêu dữ liệu mức sử dụng.

Sau khi sidecar và kênh đi đến đường dẫn Gateway sẵn sàng, OpenClaw khởi động
bootstrap giá nền tùy chọn cho các ref mô hình đã cấu hình chưa có giá cục bộ. Bootstrap đó lấy catalog giá từ xa của OpenRouter và LiteLLM. Đặt `models.pricing.enabled: false` để bỏ qua các lần lấy catalog đó trên mạng offline hoặc bị hạn chế; các mục `models.providers.*.models[].cost` rõ ràng tiếp tục điều khiển ước tính chi phí cục bộ.

## TTL cache và tác động cắt tỉa

Cache prompt của provider chỉ áp dụng trong cửa sổ TTL cache. OpenClaw có thể
tùy chọn chạy **cắt tỉa cache-ttl**: nó cắt tỉa phiên khi TTL cache
đã hết hạn, sau đó reset cửa sổ cache để các yêu cầu tiếp theo có thể tái sử dụng
ngữ cảnh mới được cache thay vì cache lại toàn bộ lịch sử. Điều này giữ chi phí ghi cache thấp hơn khi một phiên rỗi quá TTL.

Cấu hình trong [Cấu hình Gateway](/vi/gateway/configuration) và xem
chi tiết hành vi trong [Cắt tỉa phiên](/vi/concepts/session-pruning).

Heartbeat có thể giữ cache **ấm** qua các khoảng rỗi. Nếu TTL cache mô hình của bạn
là `1h`, đặt khoảng Heartbeat ngay dưới mức đó (ví dụ, `55m`) có thể tránh
cache lại toàn bộ prompt, giảm chi phí ghi cache.

Trong thiết lập nhiều agent, bạn có thể giữ một cấu hình mô hình dùng chung và tinh chỉnh hành vi cache
theo từng agent bằng `agents.list[].params.cacheRetention`.

Để xem hướng dẫn đầy đủ theo từng núm, xem [Prompt Caching](/vi/reference/prompt-caching).

Đối với giá Anthropic API, lượt đọc cache rẻ hơn đáng kể so với token đầu vào,
trong khi lượt ghi cache được tính phí với hệ số cao hơn. Xem giá prompt caching của Anthropic để biết mức giá và hệ số TTL mới nhất:
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
chỉ ghi đè `cacheRetention` và kế thừa nguyên vẹn các mặc định khác của mô hình.

### Ngữ cảnh 1M của Anthropic

OpenClaw định cỡ các mô hình Claude 4.x có khả năng GA như Opus 4.8, Opus 4.7, Opus 4.6, và
Sonnet 4.6 với cửa sổ ngữ cảnh 1M của Anthropic. Bạn không cần
`params.context1m: true` cho các mô hình đó.

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        alias: opus
```

Các cấu hình cũ hơn có thể giữ `context1m: true`, nhưng OpenClaw không còn gửi
header beta `context-1m-2025-08-07` đã ngừng dùng của Anthropic cho thiết lập này và
không mở rộng các mô hình Claude cũ hơn không được hỗ trợ lên 1M.

Yêu cầu: thông tin xác thực phải đủ điều kiện cho mức sử dụng ngữ cảnh dài. Nếu không,
Anthropic phản hồi bằng lỗi giới hạn tốc độ phía provider cho yêu cầu đó.

Nếu bạn xác thực Anthropic bằng token OAuth/subscription (`sk-ant-oat-*`),
OpenClaw giữ lại các header beta Anthropic bắt buộc cho OAuth trong khi loại bỏ
beta `context-1m-*` đã ngừng dùng nếu nó vẫn còn trong cấu hình cũ hơn.

## Mẹo giảm áp lực token

- Dùng `/compact` để tóm tắt các phiên dài.
- Cắt gọn đầu ra công cụ lớn trong quy trình làm việc của bạn.
- Giảm `agents.defaults.imageMaxDimensionPx` cho các phiên có nhiều ảnh chụp màn hình.
- Giữ mô tả Skills ngắn gọn (danh sách Skills được chèn vào lời nhắc).
- Ưu tiên các mô hình nhỏ hơn cho công việc thăm dò, nhiều nội dung.

Xem [Skills](/vi/tools/skills) để biết công thức chính xác về phần nội dung phụ thêm của danh sách Skills.

## Liên quan

- [Mức sử dụng API và chi phí](/vi/reference/api-usage-costs)
- [Lưu lời nhắc vào bộ nhớ đệm](/vi/reference/prompt-caching)
- [Theo dõi mức sử dụng](/vi/concepts/usage-tracking)
