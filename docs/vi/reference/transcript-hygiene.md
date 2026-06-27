---
read_when:
    - Bạn đang gỡ lỗi các yêu cầu provider bị từ chối liên quan đến hình dạng transcript
    - Bạn đang thay đổi logic làm sạch bản ghi hoặc sửa lệnh gọi công cụ
    - Bạn đang điều tra các trường hợp không khớp id lệnh gọi công cụ giữa các nhà cung cấp
summary: 'Tham khảo: quy tắc làm sạch bản ghi và sửa chữa dành riêng cho nhà cung cấp'
title: Vệ sinh bản ghi cuộc trò chuyện
x-i18n:
    generated_at: "2026-06-27T18:11:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ca1c747b33dc0d6730281d6c91d28a0f8a85bcc5e5cb00dbdebdb55157871a7d
    source_path: reference/transcript-hygiene.md
    workflow: 16
---

OpenClaw áp dụng **các bản sửa riêng theo nhà cung cấp** cho bản ghi trước khi chạy (xây dựng ngữ cảnh mô hình). Phần lớn đây là các điều chỉnh **trong bộ nhớ** dùng để đáp ứng những yêu cầu nghiêm ngặt của nhà cung cấp. Một lượt sửa tệp phiên riêng cũng có thể ghi lại JSONL đã lưu trước khi phiên được tải, nhưng chỉ cho các dòng sai định dạng hoặc các lượt đã lưu không phải là bản ghi bền vững hợp lệ. Các phản hồi assistant đã gửi được giữ nguyên trên đĩa; việc loại bỏ assistant-prefill riêng theo nhà cung cấp chỉ diễn ra khi tạo payload gửi đi. Khi có sửa chữa, tệp gốc được ghi vào một tệp anh em tạm thời `*.bak-<pid>-<ts>` trước thao tác thay thế nguyên tử và bị xóa sau khi thay thế thành công; bản sao lưu chỉ được giữ lại nếu chính bước dọn dẹp thất bại (trong trường hợp đó, đường dẫn sẽ được báo lại).

Phạm vi bao gồm:

- Ngữ cảnh prompt chỉ dùng lúc chạy không xuất hiện trong các lượt bản ghi mà người dùng nhìn thấy
- Làm sạch id lệnh gọi công cụ
- Xác thực đầu vào lệnh gọi công cụ
- Sửa ghép cặp kết quả công cụ
- Xác thực / sắp xếp lượt
- Dọn dẹp chữ ký suy nghĩ
- Dọn dẹp chữ ký thinking
- Làm sạch payload hình ảnh
- Dọn dẹp khối văn bản trống trước khi phát lại cho nhà cung cấp
- Dọn dẹp lượt chỉ có suy luận chưa hoàn tất do giới hạn độ dài trước khi phát lại cho nhà cung cấp
- Gắn thẻ nguồn gốc đầu vào người dùng (cho prompt được định tuyến giữa các phiên)
- Sửa lượt lỗi assistant trống cho phát lại Bedrock Converse

Nếu bạn cần chi tiết về lưu trữ bản ghi, xem:

- [Phân tích chuyên sâu về quản lý phiên](/vi/reference/session-management-compaction)

---

## Quy tắc toàn cục: ngữ cảnh runtime không phải là bản ghi người dùng

Ngữ cảnh runtime/hệ thống có thể được thêm vào prompt mô hình cho một lượt, nhưng đó
không phải là nội dung do người dùng cuối viết. OpenClaw giữ một phần thân prompt
riêng dành cho bản ghi để dùng cho phản hồi Gateway, lượt followup được xếp hàng, ACP, CLI, và các lần chạy OpenClaw nhúng.
Các lượt người dùng hiển thị đã lưu dùng phần thân bản ghi đó thay vì prompt
được làm giàu bằng runtime.

Đối với các phiên cũ đã lưu các wrapper runtime, các bề mặt lịch sử Gateway
áp dụng một phép chiếu hiển thị trước khi trả thông điệp về cho WebChat,
TUI, REST, hoặc client SSE.

---

## Nơi cơ chế này chạy

Toàn bộ vệ sinh bản ghi được tập trung trong runner nhúng:

- Chọn chính sách: `src/agents/transcript-policy.ts`
- Áp dụng làm sạch/sửa chữa: `sanitizeSessionHistory` trong `src/agents/embedded-agent-runner/replay-history.ts`

Chính sách dùng `provider`, `modelApi`, và `modelId` để quyết định áp dụng gì.

Tách biệt với vệ sinh bản ghi, các tệp phiên được sửa (nếu cần) trước khi tải:

- `repairSessionFileIfNeeded` trong `src/agents/session-file-repair.ts`
- Được gọi từ `run/attempt.ts` và `compact.ts` (runner nhúng)

---

## Quy tắc toàn cục: làm sạch hình ảnh

Payload hình ảnh luôn được làm sạch để ngăn bị nhà cung cấp từ chối do giới hạn
kích thước (giảm tỷ lệ/nén lại hình ảnh base64 quá lớn).

Điều này cũng giúp kiểm soát áp lực token do hình ảnh gây ra cho các mô hình hỗ trợ vision.
Kích thước tối đa thấp hơn thường giảm mức dùng token; kích thước cao hơn giữ được chi tiết.

Triển khai:

- `sanitizeSessionMessagesImages` trong `src/agents/embedded-agent-helpers/images.ts`
- `sanitizeContentBlocksImages` trong `src/agents/tool-images.ts`
- Cạnh hình ảnh tối đa có thể cấu hình qua `agents.defaults.imageMaxDimensionPx` (mặc định: `1200`).
- Các khối văn bản trống bị xóa trong khi lượt này duyệt nội dung phát lại. Các
  lượt assistant trở thành trống sẽ bị loại khỏi bản sao phát lại; các lượt người dùng và kết quả công cụ
  trở thành trống sẽ nhận một placeholder nội dung bị lược bỏ nhưng không trống.

---

## Quy tắc toàn cục: lệnh gọi công cụ sai định dạng

Các khối lệnh gọi công cụ của assistant thiếu cả `input` lẫn `arguments` sẽ bị loại
trước khi ngữ cảnh mô hình được xây dựng. Điều này ngăn nhà cung cấp từ chối do các
lệnh gọi công cụ được lưu một phần (ví dụ, sau lỗi giới hạn tốc độ).

Triển khai:

- `sanitizeToolCallInputs` trong `src/agents/session-transcript-repair.ts`
- Được áp dụng trong `sanitizeSessionHistory` trong `src/agents/embedded-agent-runner/replay-history.ts`

---

## Quy tắc toàn cục: lượt chỉ có suy luận chưa hoàn tất

Các lượt assistant chạm giới hạn đầu ra của nhà cung cấp mà chỉ có nội dung thinking hoặc
redacted-thinking sẽ bị lược bỏ khỏi bản sao phát lại trong bộ nhớ. Những lượt như vậy
chứa trạng thái nhà cung cấp chưa hoàn tất và có thể mang một chữ ký thinking một phần.

Các lượt độ dài trống vẫn giữ nguyên, cũng như các lượt độ dài có văn bản hiển thị, lệnh gọi công cụ,
hoặc khối nội dung không xác định. Bản ghi đã lưu không bị ghi lại.

Triển khai:

- `normalizeAssistantReplayContent` trong `src/agents/embedded-agent-runner/replay-history.ts`

---

## Quy tắc toàn cục: nguồn gốc đầu vào giữa các phiên

Khi một agent gửi prompt vào phiên khác qua `sessions_send` (bao gồm
các bước trả lời/thông báo agent-đến-agent), OpenClaw lưu lượt người dùng được tạo với:

- `message.provenance.kind = "inter_session"`

OpenClaw cũng thêm trước văn bản prompt được định tuyến một marker cùng lượt `[Inter-session message ... isUser=false]`
để lệnh gọi mô hình đang hoạt động có thể phân biệt đầu ra từ phiên khác
với chỉ dẫn bên ngoài của người dùng cuối. Marker này bao gồm
phiên nguồn, kênh, và công cụ khi có. Bản ghi vẫn dùng
`role: "user"` để tương thích với nhà cung cấp, nhưng cả văn bản hiển thị lẫn metadata nguồn gốc
đều đánh dấu lượt này là dữ liệu giữa các phiên.

Trong quá trình dựng lại ngữ cảnh, OpenClaw áp dụng cùng marker đó cho các lượt người dùng
giữa các phiên đã lưu cũ hơn chỉ có metadata nguồn gốc.

---

## Ma trận nhà cung cấp (hành vi hiện tại)

**OpenAI / OpenAI Codex**

- Chỉ làm sạch hình ảnh.
- Loại bỏ chữ ký suy luận mồ côi (mục suy luận độc lập không có khối nội dung theo sau) cho bản ghi OpenAI Responses/Codex, và loại bỏ suy luận OpenAI có thể phát lại sau khi chuyển tuyến mô hình.
- Giữ nguyên payload mục suy luận OpenAI Responses có thể phát lại, bao gồm các mục tóm tắt rỗng đã mã hóa, để phát lại thủ công/WebSocket giữ trạng thái `rs_*` bắt buộc được ghép với các mục đầu ra assistant.
- Native ChatGPT Codex Responses tuân theo tương đồng wire của Codex bằng cách phát lại các payload suy luận/thông điệp/hàm Responses trước đó mà không có ID mục trước đó, đồng thời giữ `prompt_cache_key` của phiên.
- Phát lại họ OpenAI Responses giữ nguyên các cặp suy luận cùng mô hình chuẩn `call_*|fc_*`, nhưng chuẩn hóa xác định các `call_id` / id mục function-call sai định dạng hoặc quá dài trước khi chuyển đổi payload pi-ai.
- Sửa ghép cặp kết quả công cụ có thể di chuyển các đầu ra khớp thật và tổng hợp đầu ra kiểu Codex `aborted` cho các lệnh gọi công cụ bị thiếu.
- Không xác thực hoặc sắp xếp lại lượt.
- Các đầu ra công cụ bị thiếu trong họ OpenAI Responses được tổng hợp thành `aborted` để khớp với chuẩn hóa phát lại Codex.
- Không loại bỏ chữ ký suy nghĩ.

**OpenAI-compatible Chat Completions**

- Các khối thinking/reasoning lịch sử của assistant bị loại bỏ trước khi phát lại để
  các máy chủ OpenAI-compatible cục bộ và kiểu proxy không nhận các trường
  reasoning của lượt trước như `reasoning` hoặc `reasoning_content`.
- Các phần tiếp diễn lệnh gọi công cụ cùng lượt hiện tại giữ khối suy luận của assistant
  gắn với lệnh gọi công cụ cho đến khi kết quả công cụ đã được phát lại.
- Các mục mô hình tùy chỉnh/tự lưu trữ có `reasoning: true` giữ metadata
  suy luận đã phát lại.
- Các ngoại lệ do nhà cung cấp sở hữu có thể chọn không áp dụng khi giao thức wire của họ yêu cầu
  metadata suy luận đã phát lại.

**Google (Generative AI / Gemini CLI / Antigravity)**

- Làm sạch id lệnh gọi công cụ: chỉ chữ và số nghiêm ngặt.
- Sửa ghép cặp kết quả công cụ và kết quả công cụ tổng hợp.
- Xác thực lượt (luân phiên lượt kiểu Gemini).
- Sửa thứ tự lượt Google (thêm một bootstrap người dùng rất nhỏ ở đầu nếu lịch sử bắt đầu bằng assistant).
- Antigravity Claude: chuẩn hóa chữ ký thinking; loại bỏ các khối thinking không có chữ ký.

**Anthropic / Minimax (Anthropic-compatible)**

- Sửa ghép cặp kết quả công cụ và kết quả công cụ tổng hợp.
- Xác thực lượt (gộp các lượt người dùng liên tiếp để đáp ứng luân phiên nghiêm ngặt).
- Các lượt prefill assistant ở cuối bị loại khỏi payload Anthropic Messages
  gửi đi khi thinking được bật, bao gồm cả các tuyến Cloudflare AI Gateway.
- Các chữ ký thinking của assistant trước Compaction bị loại bỏ trước khi phát lại cho nhà cung cấp
  khi một phiên đã được compact. Chữ ký thinking được
  ràng buộc bằng mật mã với tiền tố hội thoại tại thời điểm tạo; sau
  Compaction, tiền tố thay đổi (nội dung đã tóm tắt được thay bằng một bản tóm tắt compaction),
  nên phát lại các chữ ký gốc khiến Anthropic từ chối
  yêu cầu với "Invalid signature in thinking block". Văn bản thinking được
  giữ dưới dạng khối không có chữ ký và sau đó được xử lý bởi quy tắc bên dưới.
- Các khối thinking có chữ ký phát lại bị thiếu, rỗng, hoặc chỉ có khoảng trắng sẽ bị loại bỏ
  trước khi chuyển đổi cho nhà cung cấp. Nếu điều đó làm trống một lượt assistant, OpenClaw giữ
  hình dạng lượt với văn bản omitted-reasoning không trống.
- Các lượt assistant cũ chỉ có thinking phải bị loại bỏ được thay bằng
  văn bản omitted-reasoning không trống để adapter nhà cung cấp không loại lượt phát lại.

**Amazon Bedrock (Converse API)**

- Các lượt lỗi luồng assistant trống được sửa thành một khối văn bản fallback không trống
  trước khi phát lại. Bedrock Converse từ chối thông điệp assistant có `content: []`, nên
  các lượt assistant đã lưu có `stopReason: "error"` và nội dung trống cũng
  được sửa trên đĩa trước khi tải.
- Các lượt lỗi luồng assistant chỉ chứa các khối văn bản trống bị loại
  khỏi bản sao phát lại trong bộ nhớ thay vì phát lại một khối trống không hợp lệ.
- Các chữ ký thinking của assistant trước Compaction bị loại bỏ trước khi phát lại Converse
  khi một phiên đã được compact, vì cùng lý do như Anthropic
  ở trên.
- Các khối thinking Claude có chữ ký phát lại bị thiếu, rỗng, hoặc chỉ có khoảng trắng
  bị loại bỏ trước khi phát lại Converse. Nếu điều đó làm trống một lượt assistant, OpenClaw
  giữ hình dạng lượt với văn bản omitted-reasoning không trống.
- Các lượt assistant cũ chỉ có thinking phải bị loại bỏ được thay bằng
  văn bản omitted-reasoning không trống để phát lại Converse giữ hình dạng lượt nghiêm ngặt.
- Phát lại lọc các lượt assistant delivery-mirror của OpenClaw và do gateway chèn.
- Làm sạch hình ảnh áp dụng qua quy tắc toàn cục.

**Mistral (bao gồm phát hiện dựa trên model-id)**

- Làm sạch id lệnh gọi công cụ: strict9 (chữ và số, độ dài 9).

**OpenRouter Gemini**

- Dọn dẹp chữ ký suy nghĩ: loại bỏ các giá trị `thought_signature` không phải base64 (giữ base64).

**OpenRouter Anthropic**

- Các lượt prefill assistant ở cuối bị loại khỏi payload mô hình Anthropic
  OpenAI-compatible đã xác minh của OpenRouter khi reasoning được bật, khớp với
  hành vi phát lại Anthropic trực tiếp và Cloudflare Anthropic.

**Tất cả trường hợp khác**

- Chỉ làm sạch hình ảnh.

---

## Hành vi lịch sử (trước 2026.1.22)

Trước bản phát hành 2026.1.22, OpenClaw áp dụng nhiều lớp vệ sinh bản ghi:

- Một **transcript-sanitize extension** chạy trên mọi lần xây dựng ngữ cảnh và có thể:
  - Sửa ghép cặp tool use/result.
  - Làm sạch id lệnh gọi công cụ (bao gồm một chế độ không nghiêm ngặt giữ lại `_`/`-`).
- Runner cũng thực hiện làm sạch riêng theo nhà cung cấp, tạo ra công việc trùng lặp.
- Các đột biến bổ sung xảy ra bên ngoài chính sách nhà cung cấp, bao gồm:
  - Loại bỏ thẻ `<final>` khỏi văn bản assistant trước khi lưu.
  - Loại bỏ các lượt lỗi assistant trống.
  - Cắt ngắn nội dung assistant sau các lệnh gọi công cụ.

Sự phức tạp này gây ra các hồi quy giữa các nhà cung cấp (đáng chú ý là ghép cặp
`call_id|fc_id` của `openai-responses`). Đợt dọn dẹp 2026.1.22 đã loại bỏ extension, tập trung hóa
logic trong runner, và khiến OpenAI **không đụng chạm** ngoài làm sạch hình ảnh.

## Liên quan

- [Quản lý phiên](/vi/concepts/session)
- [Cắt tỉa phiên](/vi/concepts/session-pruning)
