---
read_when:
    - Giải thích mức sử dụng token, chi phí hoặc cửa sổ ngữ cảnh
    - Gỡ lỗi hành vi tăng kích thước ngữ cảnh hoặc Compaction
summary: Cách OpenClaw xây dựng ngữ cảnh lời nhắc và báo cáo mức sử dụng token cùng chi phí
title: Mức sử dụng token và chi phí
x-i18n:
    generated_at: "2026-07-12T08:25:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 07c79e137d6809ccf8c435ef62641c0cc7579b3ec43acd513e430a7ab91cd47c
    source_path: reference/token-use.md
    workflow: 16
---

OpenClaw theo dõi **token**, không phải ký tự. Token phụ thuộc vào từng mô hình, nhưng hầu hết
các mô hình kiểu OpenAI có trung bình khoảng 4 ký tự cho mỗi token đối với văn bản tiếng Anh.

## Cách xây dựng lời nhắc hệ thống

OpenClaw tự lắp ráp lời nhắc hệ thống trong mỗi lần chạy. Lời nhắc này bao gồm:

- Danh sách công cụ + mô tả ngắn
- Danh sách Skills (chỉ siêu dữ liệu; hướng dẫn được tải theo nhu cầu bằng `read`). Các lượt
  Codex gốc nhận khối Skills thu gọn dưới dạng hướng dẫn dành cho nhà phát triển về cộng tác
  trong phạm vi lượt; các bộ điều phối khác nhận khối này trên bề mặt lời nhắc thông thường.
  Bị giới hạn bởi `skills.limits.maxSkillsPromptChars`, với tùy chọn ghi đè theo từng tác tử
  tại `agents.list[].skillsLimits.maxSkillsPromptChars`.
- Hướng dẫn tự cập nhật
- Không gian làm việc + các tệp khởi tạo (`AGENTS.md`, `SOUL.md`, `TOOLS.md`,
  `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` khi mới tạo, cùng với
  `MEMORY.md` khi có). Các tệp lớn được chèn sẽ bị cắt ngắn theo
  `agents.defaults.bootstrapMaxChars` (mặc định: `20000`); tổng nội dung khởi tạo
  được chèn bị giới hạn bởi `agents.defaults.bootstrapTotalMaxChars` (mặc định:
  `60000`).
  - Các lượt Codex gốc không dán trực tiếp `MEMORY.md` khi công cụ bộ nhớ
    khả dụng cho không gian làm việc đó; thay vào đó, chúng nhận một con trỏ bộ nhớ nhỏ trong
    hướng dẫn dành cho nhà phát triển về cộng tác trong phạm vi lượt và sử dụng công cụ bộ nhớ
    theo nhu cầu. Nếu công cụ bị vô hiệu hóa, tìm kiếm bộ nhớ không khả dụng hoặc
    không gian làm việc đang hoạt động khác với không gian làm việc bộ nhớ của tác tử, `MEMORY.md`
    sẽ quay về đường dẫn ngữ cảnh lượt thông thường có giới hạn.
  - Tệp `memory.md` viết thường ở thư mục gốc không bao giờ được chèn. Đây là đầu vào sửa chữa
    cũ cho `openclaw doctor --fix`, lệnh này di chuyển nội dung vào `MEMORY.md`.
  - Các tệp hằng ngày `memory/*.md` không thuộc lời nhắc khởi tạo thông thường;
    chúng vẫn được truy cập theo nhu cầu qua công cụ bộ nhớ trong các lượt thông thường. Các lần chạy mô hình
    khi đặt lại/khởi động có thể thêm vào đầu một khối ngữ cảnh khởi động dùng một lần với bộ nhớ
    hằng ngày gần đây cho lượt đầu tiên đó, được kiểm soát bởi
    `agents.defaults.startupContext`. Các lệnh trò chuyện thuần túy `/new` và `/reset` được
    xác nhận mà không gọi mô hình.
  - Các đoạn trích `AGENTS.md` sau Compaction là riêng biệt và yêu cầu chủ động bật
    `agents.defaults.compaction.postCompactionSections`.
- Thời gian (UTC + múi giờ của người dùng)
- Thẻ phản hồi + hành vi Heartbeat
- Siêu dữ liệu thời gian chạy (máy chủ/HĐH/mô hình/chế độ suy luận)

Xem phân tích đầy đủ trong [Lời nhắc hệ thống](/vi/concepts/system-prompt).

Khi ghi tài liệu về thông tin xác thực hoặc các đoạn mã xác thực, hãy sử dụng
[Quy ước phần giữ chỗ cho bí mật](/vi/reference/secret-placeholder-conventions) để
tránh cảnh báo dương tính giả từ trình quét bí mật trong các thay đổi chỉ liên quan đến tài liệu.

## Những gì được tính vào cửa sổ ngữ cảnh

Mọi thứ mô hình nhận được đều được tính vào giới hạn ngữ cảnh:

- Lời nhắc hệ thống (tất cả các phần ở trên)
- Lịch sử hội thoại (tin nhắn của người dùng + trợ lý)
- Lệnh gọi công cụ và kết quả công cụ
- Tệp đính kèm/bản chép lời (hình ảnh, âm thanh, tệp)
- Bản tóm tắt Compaction và các tạo tác cắt tỉa
- Lớp bọc của nhà cung cấp hoặc tiêu đề an toàn (không hiển thị nhưng vẫn được tính)

Các bề mặt sử dụng nhiều tài nguyên thời gian chạy có giới hạn rõ ràng riêng trong
`agents.defaults.contextLimits` (ghi đè theo từng tác tử trong
`agents.list[].contextLimits`):

| Khóa                     | Mục đích                                                                  |
| ------------------------ | ------------------------------------------------------------------------- |
| `memoryGetMaxChars`      | Số ký tự tối đa mà `memory_get` trả về trước khi bị cắt ngắn.             |
| `memoryGetDefaultLines`  | Cửa sổ dòng mặc định của `memory_get` khi yêu cầu bỏ qua `lines`.         |
| `toolResultMaxChars`     | Mức trần nâng cao cho một kết quả công cụ trực tiếp (tối đa `1000000` ký tự). |
| `postCompactionMaxChars` | Số ký tự tối đa được giữ lại từ `AGENTS.md` khi làm mới sau Compaction.    |

Đây là các đoạn trích thời gian chạy có giới hạn và các khối do thời gian chạy sở hữu được chèn,
tách biệt với giới hạn khởi tạo, giới hạn ngữ cảnh khởi động và giới hạn lời nhắc
Skills.

Theo mặc định, `toolResultMaxChars` không được đặt, vì vậy OpenClaw suy ra giới hạn
kết quả công cụ trực tiếp từ cửa sổ ngữ cảnh hiệu dụng của mô hình: `16000` ký tự khi dưới
100K token, `32000` ký tự khi từ 100K token trở lên, `64000` ký tự khi từ 200K token trở lên.
Cơ chế bảo vệ tỷ lệ ngữ cảnh thời gian chạy vẫn giới hạn một kết quả công cụ ở mức 30% cửa sổ
ngữ cảnh ngay cả khi đã cấu hình mức trần rõ ràng lớn hơn.

Đối với hình ảnh, OpenClaw giảm kích thước tải trọng hình ảnh trong bản chép lời/kết quả công cụ trước khi
gọi nhà cung cấp. Điều chỉnh bằng `agents.defaults.imageMaxDimensionPx` (mặc định:
`1200`):

- Giá trị thấp hơn làm giảm mức sử dụng token thị giác và kích thước tải trọng.
- Giá trị cao hơn giữ lại nhiều chi tiết hình ảnh hơn cho ảnh chụp màn hình có nhiều nội dung OCR/giao diện.

Để xem phân tích thực tế (theo từng tệp được chèn, công cụ, Skills và kích thước
lời nhắc hệ thống), hãy dùng `/context list` hoặc `/context detail`. Xem
[Ngữ cảnh](/vi/concepts/context).

## Cách xem mức sử dụng token hiện tại

Trong trò chuyện:

- `/status` -> thẻ trạng thái nhiều biểu tượng cảm xúc với mô hình của phiên, mức sử dụng ngữ cảnh,
  số token đầu vào/đầu ra của phản hồi gần nhất và chi phí ước tính khi giá cục bộ được
  cấu hình cho mô hình đang hoạt động.
- `/usage off|tokens|full` -> thêm chân trang mức sử dụng theo từng phản hồi vào mọi
  câu trả lời. Được duy trì theo từng phiên (lưu dưới dạng `responseUsage`).
  - `/usage reset` (bí danh: `inherit`, `clear`, `default`) xóa phần
    ghi đè của phiên để phiên kế thừa lại giá trị mặc định đã cấu hình.
  - `/usage tokens` hiển thị chi tiết token/bộ nhớ đệm của lượt.
  - `/usage full` hiển thị chi tiết thu gọn về mô hình/ngữ cảnh/chi phí; chi phí ước tính
    chỉ xuất hiện khi OpenClaw có siêu dữ liệu mức sử dụng và giá cục bộ cho
    mô hình đang hoạt động. Bố cục `messages.usageTemplate` tùy chỉnh có thể bao gồm
    các trường token/bộ nhớ đệm.
- `/usage cost` -> bản tóm tắt chi phí cục bộ từ nhật ký phiên OpenClaw.

Các bề mặt khác:

- **TUI/Web TUI:** hỗ trợ `/status` và `/usage`.
- **CLI:** `openclaw status --usage` và `openclaw channels list` hiển thị
  các cửa sổ hạn mức nhà cung cấp đã chuẩn hóa (`X% left`, không phải chi phí theo từng phản hồi).
  Các nhà cung cấp cửa sổ mức sử dụng hiện tại: Claude (Anthropic), ClawRouter, Copilot
  (GitHub), DeepSeek, Gemini (Google Gemini CLI), MiniMax, OpenAI, Xiaomi,
  Xiaomi Token Plan và z.ai.

Các bề mặt mức sử dụng chuẩn hóa những bí danh trường gốc phổ biến của nhà cung cấp trước khi
hiển thị. Đối với lưu lượng Responses thuộc họ OpenAI, điều này bao gồm cả
`input_tokens`/`output_tokens` và `prompt_tokens`/`completion_tokens`, vì vậy
tên trường riêng theo phương thức truyền tải không làm thay đổi `/status`, `/usage` hoặc bản
tóm tắt phiên. Mức sử dụng Gemini CLI cũng được chuẩn hóa: trình phân tích `stream-json`
mặc định đọc các sự kiện `message` của trợ lý và `stats.cached` ánh xạ thành
`cacheRead`, với `stats.input_tokens - stats.cached` được sử dụng khi CLI bỏ qua
trường `stats.input` rõ ràng. Các ghi đè JSON cũ vẫn đọc văn bản phản hồi
từ `response`.

Đối với lưu lượng Responses gốc thuộc họ OpenAI, các bí danh mức sử dụng WebSocket/SSE
được chuẩn hóa theo cùng cách và tổng số sẽ dự phòng bằng đầu vào + đầu ra đã chuẩn hóa
khi `total_tokens` bị thiếu hoặc bằng `0`.

Khi ảnh chụp trạng thái phiên hiện tại thiếu dữ liệu, `/status` và `session_status`
có thể khôi phục bộ đếm token/bộ nhớ đệm và nhãn mô hình thời gian chạy đang hoạt động từ
nhật ký mức sử dụng gần nhất trong bản chép lời. Các giá trị trực tiếp khác không đang bằng không vẫn được
ưu tiên hơn các giá trị dự phòng từ bản chép lời, và tổng số theo hướng lời nhắc lớn hơn
trong bản chép lời có thể được chọn khi tổng số đã lưu bị thiếu hoặc nhỏ hơn.

Thông tin xác thực mức sử dụng cho cửa sổ hạn mức nhà cung cấp trước hết đến từ các hook
riêng của nhà cung cấp; nếu nhà cung cấp không có hook (hoặc hook không phân giải được token),
OpenClaw sẽ dự phòng bằng thông tin xác thực OAuth/khóa API tương ứng từ hồ sơ
xác thực, biến môi trường hoặc cấu hình.

Các mục bản chép lời của trợ lý lưu giữ cùng một cấu trúc mức sử dụng đã chuẩn hóa,
bao gồm `usage.cost` khi mô hình đang hoạt động đã được cấu hình giá và nhà cung cấp
trả về siêu dữ liệu mức sử dụng. Điều này cung cấp cho `/usage cost` và trạng thái phiên
dựa trên bản chép lời một nguồn ổn định ngay cả sau khi trạng thái thời gian chạy trực tiếp
không còn tồn tại.

OpenClaw tách biệt việc hạch toán mức sử dụng của nhà cung cấp khỏi ảnh chụp ngữ cảnh
hiện tại. `usage.total` của nhà cung cấp có thể bao gồm đầu vào được lưu trong bộ nhớ đệm, đầu ra và
nhiều lệnh gọi mô hình trong vòng lặp công cụ, vì vậy nó hữu ích cho chi phí và đo từ xa nhưng
có thể phóng đại cửa sổ ngữ cảnh trực tiếp. Màn hình ngữ cảnh và chẩn đoán sử dụng
ảnh chụp lời nhắc mới nhất (`promptTokens`, hoặc lệnh gọi mô hình cuối cùng khi không có
ảnh chụp lời nhắc) cho `context.used`.

## Ước tính chi phí (khi hiển thị)

Chi phí được ước tính từ cấu hình giá mô hình của bạn:

```text
models.providers.<provider>.models[].cost
```

Đây là **USD trên mỗi 1 triệu token** cho `input`, `output`, `cacheRead` và
`cacheWrite`. Nếu thiếu giá, `/usage full` sẽ bỏ qua chi phí; hãy dùng
`/usage tokens` hoặc `messages.usageTemplate` tùy chỉnh khi bạn cần
chi tiết token/bộ nhớ đệm trong mọi câu trả lời. Việc hiển thị chi phí không chỉ giới hạn ở
xác thực bằng khóa API: các nhà cung cấp không dùng khóa API như `aws-sdk` có thể hiển thị
chi phí ước tính khi mục mô hình đã cấu hình của họ bao gồm giá cục bộ và nhà cung cấp
trả về siêu dữ liệu mức sử dụng.

Sau khi các tiến trình phụ và kênh đi đến đường dẫn sẵn sàng của Gateway, OpenClaw khởi chạy
quá trình khởi tạo giá nền tùy chọn cho các tham chiếu mô hình đã cấu hình chưa
có giá cục bộ. Quá trình khởi tạo đó tải danh mục giá từ xa của OpenRouter và
LiteLLM. Đặt `models.pricing.enabled: false` để bỏ qua việc tải các danh mục đó
trên mạng ngoại tuyến hoặc bị hạn chế; các mục
`models.providers.*.models[].cost` rõ ràng vẫn dùng để ước tính chi phí cục bộ.

## Ảnh hưởng của TTL bộ nhớ đệm và việc cắt tỉa

Bộ nhớ đệm lời nhắc của nhà cung cấp chỉ áp dụng trong cửa sổ TTL của bộ nhớ đệm. OpenClaw
có thể tùy chọn chạy **cắt tỉa theo TTL bộ nhớ đệm**: hệ thống cắt tỉa phiên sau khi
TTL bộ nhớ đệm hết hạn, rồi đặt lại cửa sổ bộ nhớ đệm để các yêu cầu tiếp theo
tái sử dụng ngữ cảnh vừa được lưu trong bộ nhớ đệm thay vì lưu lại toàn bộ lịch sử.
Điều này giúp giảm chi phí ghi bộ nhớ đệm khi phiên không hoạt động quá thời hạn TTL.

Cấu hình trong [Cấu hình Gateway](/vi/gateway/configuration) và xem chi tiết
hành vi trong [Cắt tỉa phiên](/vi/concepts/session-pruning).

Heartbeat có thể giữ bộ nhớ đệm **luôn sẵn sàng** qua các khoảng thời gian không hoạt động. Nếu TTL bộ nhớ đệm
của mô hình là `1h`, việc đặt khoảng thời gian Heartbeat ngắn hơn một chút (ví dụ: `55m`) có thể
tránh phải lưu lại toàn bộ lời nhắc vào bộ nhớ đệm, từ đó giảm chi phí ghi bộ nhớ đệm.

Trong thiết lập nhiều tác tử, bạn có thể dùng chung một cấu hình mô hình và điều chỉnh hành vi
bộ nhớ đệm theo từng tác tử bằng `agents.list[].params.cacheRetention`.

Để xem hướng dẫn đầy đủ cho từng tùy chọn, hãy xem [Bộ nhớ đệm lời nhắc](/vi/reference/prompt-caching).

Đối với giá API của Anthropic, việc đọc bộ nhớ đệm rẻ hơn đáng kể so với token
đầu vào, trong khi việc ghi bộ nhớ đệm được tính phí với hệ số cao hơn. Xem giá
bộ nhớ đệm lời nhắc của Anthropic để biết mức giá và hệ số TTL mới nhất:
[https://docs.anthropic.com/docs/build-with-claude/prompt-caching](https://docs.anthropic.com/docs/build-with-claude/prompt-caching)

### Ví dụ: giữ bộ nhớ đệm 1h luôn sẵn sàng bằng Heartbeat

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

### Ví dụ: lưu lượng hỗn hợp với chiến lược bộ nhớ đệm theo từng tác tử

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

`agents.list[].params` được hợp nhất trên `params` của mô hình đã chọn, vì vậy bạn
chỉ có thể ghi đè `cacheRetention` và kế thừa nguyên trạng các giá trị mặc định khác
của mô hình.

### Ngữ cảnh 1M của Anthropic

OpenClaw định cỡ các mô hình Claude 4.x hỗ trợ GA như Opus 4.8, Opus 4.7, Opus
4.6 và Sonnet 4.6 với cửa sổ ngữ cảnh 1M của Anthropic. Bạn không cần
`params.context1m: true` cho các mô hình đó.

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        alias: opus
```

Các cấu hình cũ có thể giữ `context1m: true`, nhưng OpenClaw không còn gửi
tiêu đề beta `context-1m-2025-08-07` đã ngừng sử dụng của Anthropic cho thiết lập này và
không mở rộng các mô hình Claude cũ không được hỗ trợ lên 1M.

Yêu cầu: thông tin xác thực phải đủ điều kiện sử dụng ngữ cảnh dài. Nếu không,
Anthropic sẽ phản hồi bằng lỗi giới hạn tốc độ từ phía nhà cung cấp cho yêu cầu đó.

Nếu bạn xác thực Anthropic bằng token OAuth/gói đăng ký
(`sk-ant-oat-*`), OpenClaw sẽ giữ lại các tiêu đề beta Anthropic bắt buộc cho OAuth
đồng thời loại bỏ beta `context-1m-*` đã ngừng hỗ trợ nếu nó vẫn còn trong
cấu hình cũ.

## Mẹo giảm áp lực token

- Sử dụng `/compact` để tóm tắt các phiên dài.
- Cắt bớt đầu ra lớn của công cụ trong quy trình làm việc.
- Giảm `agents.defaults.imageMaxDimensionPx` cho các phiên sử dụng nhiều ảnh chụp màn hình.
- Giữ mô tả skill ngắn gọn (danh sách skill được chèn vào prompt).
- Ưu tiên các mô hình nhỏ hơn cho công việc dài dòng, mang tính khám phá.

Xem [Skills](/vi/tools/skills) để biết công thức chính xác tính phần chi phí token bổ sung của danh sách skill.

## Liên quan

- [Mức sử dụng API và chi phí](/vi/reference/api-usage-costs)
- [Bộ nhớ đệm prompt](/vi/reference/prompt-caching)
- [Theo dõi mức sử dụng](/vi/concepts/usage-tracking)
