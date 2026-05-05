---
read_when:
    - Bạn đang gỡ lỗi các trường hợp nhà cung cấp từ chối yêu cầu liên quan đến cấu trúc bản ghi hội thoại
    - Bạn đang thay đổi logic làm sạch bản ghi hội thoại hoặc sửa chữa lệnh gọi công cụ
    - Bạn đang điều tra các trường hợp ID lệnh gọi công cụ không khớp giữa các nhà cung cấp
summary: 'Tham chiếu: các quy tắc làm sạch và sửa chữa bản ghi dành riêng cho từng nhà cung cấp'
title: Vệ sinh bản ghi hội thoại
x-i18n:
    generated_at: "2026-05-05T01:50:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9441494f3e8bb18d1648acc789a40bf9501fe3f2d32b6293792e6a24710675d0
    source_path: reference/transcript-hygiene.md
    workflow: 16
---

OpenClaw áp dụng **các bản sửa dành riêng cho nhà cung cấp** cho bản ghi hội thoại trước khi chạy (xây dựng ngữ cảnh mô hình). Hầu hết đây là các điều chỉnh **trong bộ nhớ** dùng để đáp ứng các yêu cầu nghiêm ngặt của nhà cung cấp. Một lượt sửa chữa tệp phiên riêng biệt cũng có thể ghi lại JSONL đã lưu trước khi phiên được tải, nhưng chỉ đối với các dòng sai định dạng hoặc các lượt đã lưu không phải là bản ghi bền hợp lệ. Các phản hồi assistant đã được chuyển phát được giữ nguyên trên đĩa; việc loại bỏ assistant-prefill dành riêng cho nhà cung cấp chỉ diễn ra khi xây dựng payload gửi đi. Khi có sửa chữa, tệp gốc được sao lưu bên cạnh tệp phiên.

Phạm vi bao gồm:

- Ngữ cảnh prompt chỉ dùng khi chạy không xuất hiện trong các lượt bản ghi hội thoại người dùng có thể thấy
- Làm sạch id lệnh gọi công cụ
- Xác thực đầu vào lệnh gọi công cụ
- Sửa chữa ghép cặp kết quả công cụ
- Xác thực / sắp xếp lượt
- Dọn dẹp chữ ký suy nghĩ
- Dọn dẹp chữ ký thinking
- Làm sạch payload hình ảnh
- Dọn dẹp khối văn bản trống trước khi phát lại qua nhà cung cấp
- Gắn thẻ nguồn gốc đầu vào người dùng (cho prompt được định tuyến giữa các phiên)
- Sửa chữa lượt lỗi assistant trống cho phát lại Bedrock Converse

Nếu bạn cần chi tiết lưu trữ bản ghi hội thoại, xem:

- [Phân tích sâu về quản lý phiên](/vi/reference/session-management-compaction)

---

## Quy tắc toàn cục: ngữ cảnh khi chạy không phải là bản ghi hội thoại người dùng

Ngữ cảnh runtime/system có thể được thêm vào prompt mô hình cho một lượt, nhưng đó
không phải là nội dung do người dùng cuối soạn. OpenClaw giữ một phần thân prompt
riêng hướng tới bản ghi hội thoại cho phản hồi Gateway, các followup xếp hàng, ACP, CLI, và các lần chạy Pi
được nhúng. Các lượt người dùng hiển thị đã lưu dùng phần thân bản ghi hội thoại đó thay vì
prompt đã được bổ sung ngữ cảnh khi chạy.

Đối với các phiên cũ đã lưu các lớp bọc runtime, các bề mặt lịch sử Gateway
áp dụng một phép chiếu hiển thị trước khi trả về thông điệp cho WebChat,
TUI, REST, hoặc máy khách SSE.

---

## Nơi phần này chạy

Toàn bộ vệ sinh bản ghi hội thoại được tập trung trong runner nhúng:

- Chọn chính sách: `src/agents/transcript-policy.ts`
- Áp dụng làm sạch/sửa chữa: `sanitizeSessionHistory` trong `src/agents/pi-embedded-runner/replay-history.ts`

Chính sách dùng `provider`, `modelApi`, và `modelId` để quyết định cần áp dụng gì.

Tách biệt với vệ sinh bản ghi hội thoại, các tệp phiên được sửa chữa (nếu cần) trước khi tải:

- `repairSessionFileIfNeeded` trong `src/agents/session-file-repair.ts`
- Được gọi từ `run/attempt.ts` và `compact.ts` (runner nhúng)

---

## Quy tắc toàn cục: làm sạch hình ảnh

Payload hình ảnh luôn được làm sạch để ngăn nhà cung cấp từ chối do giới hạn
kích thước (thu nhỏ/nén lại ảnh base64 quá lớn).

Điều này cũng giúp kiểm soát áp lực token do hình ảnh gây ra cho các mô hình hỗ trợ vision.
Kích thước tối đa thấp hơn thường giảm mức sử dụng token; kích thước cao hơn giữ được chi tiết.

Triển khai:

- `sanitizeSessionMessagesImages` trong `src/agents/pi-embedded-helpers/images.ts`
- `sanitizeContentBlocksImages` trong `src/agents/tool-images.ts`
- Cạnh ảnh tối đa có thể cấu hình qua `agents.defaults.imageMaxDimensionPx` (mặc định: `1200`).
- Các khối văn bản trống bị xóa trong khi lượt này duyệt nội dung phát lại. Các lượt assistant
  trở thành trống sẽ bị loại khỏi bản sao phát lại; các lượt người dùng và kết quả công cụ
  trở thành trống nhận một placeholder nội dung bị lược bỏ không trống.

---

## Quy tắc toàn cục: lệnh gọi công cụ sai định dạng

Các khối lệnh gọi công cụ của assistant thiếu cả `input` và `arguments` sẽ bị loại bỏ
trước khi ngữ cảnh mô hình được xây dựng. Điều này ngăn việc nhà cung cấp từ chối từ các
lệnh gọi công cụ được lưu một phần (ví dụ, sau lỗi giới hạn tốc độ).

Triển khai:

- `sanitizeToolCallInputs` trong `src/agents/session-transcript-repair.ts`
- Được áp dụng trong `sanitizeSessionHistory` trong `src/agents/pi-embedded-runner/replay-history.ts`

---

## Quy tắc toàn cục: nguồn gốc đầu vào giữa các phiên

Khi một agent gửi prompt vào một phiên khác qua `sessions_send` (bao gồm
các bước trả lời/thông báo từ agent tới agent), OpenClaw lưu lượt người dùng đã tạo với:

- `message.provenance.kind = "inter_session"`

OpenClaw cũng thêm vào đầu cùng lượt một marker `[Inter-session message ... isUser=false]`
trước văn bản prompt được định tuyến để lời gọi mô hình đang hoạt động có thể phân biệt
đầu ra phiên bên ngoài với chỉ dẫn người dùng cuối bên ngoài. Marker này bao gồm
phiên nguồn, kênh, và công cụ khi có. Bản ghi hội thoại vẫn dùng
`role: "user"` để tương thích với nhà cung cấp, nhưng văn bản hiển thị và siêu dữ liệu nguồn gốc
đều đánh dấu lượt này là dữ liệu giữa các phiên.

Trong quá trình xây dựng lại ngữ cảnh, OpenClaw áp dụng cùng marker cho các lượt người dùng
giữa các phiên đã lưu cũ hơn chỉ có siêu dữ liệu nguồn gốc.

---

## Ma trận nhà cung cấp (hành vi hiện tại)

**OpenAI / OpenAI Codex**

- Chỉ làm sạch hình ảnh.
- Loại bỏ các chữ ký reasoning mồ côi (các mục reasoning độc lập không có khối nội dung theo sau) cho bản ghi hội thoại OpenAI Responses/Codex, và loại bỏ OpenAI reasoning có thể phát lại sau khi chuyển tuyến mô hình.
- Giữ nguyên payload mục reasoning của OpenAI Responses có thể phát lại, bao gồm các mục tóm tắt trống đã mã hóa, để phát lại thủ công/WebSocket giữ trạng thái `rs_*` bắt buộc được ghép với các mục đầu ra assistant.
- Native ChatGPT Codex Responses tuân theo tính tương đương dây Codex bằng cách phát lại payload reasoning/message/function Responses trước đó mà không có ID mục trước đó trong khi vẫn giữ `prompt_cache_key` của phiên.
- Không làm sạch id lệnh gọi công cụ.
- Sửa chữa ghép cặp kết quả công cụ có thể di chuyển các đầu ra khớp thật và tổng hợp đầu ra `aborted` kiểu Codex cho các lệnh gọi công cụ bị thiếu.
- Không xác thực hoặc sắp xếp lại lượt.
- Đầu ra công cụ bị thiếu thuộc họ OpenAI Responses được tổng hợp thành `aborted` để khớp với chuẩn hóa phát lại Codex.
- Không loại bỏ chữ ký suy nghĩ.

**Gemma 4 tương thích OpenAI**

- Các khối thinking/reasoning lịch sử của assistant bị loại bỏ trước khi phát lại để máy chủ
  Gemma 4 cục bộ tương thích OpenAI không nhận nội dung reasoning của lượt trước.
- Các phần tiếp nối lệnh gọi công cụ cùng lượt hiện tại giữ khối reasoning của assistant
  gắn với lệnh gọi công cụ cho đến khi kết quả công cụ đã được phát lại.

**Google (Generative AI / Gemini CLI / Antigravity)**

- Làm sạch id lệnh gọi công cụ: chữ và số nghiêm ngặt.
- Sửa chữa ghép cặp kết quả công cụ và kết quả công cụ tổng hợp.
- Xác thực lượt (luân phiên lượt kiểu Gemini).
- Sửa thứ tự lượt Google (thêm một bootstrap người dùng rất nhỏ ở đầu nếu lịch sử bắt đầu bằng assistant).
- Antigravity Claude: chuẩn hóa chữ ký thinking; loại bỏ các khối thinking không có chữ ký.

**Anthropic / Minimax (tương thích Anthropic)**

- Sửa chữa ghép cặp kết quả công cụ và kết quả công cụ tổng hợp.
- Xác thực lượt (gộp các lượt người dùng liên tiếp để đáp ứng luân phiên nghiêm ngặt).
- Các lượt assistant prefill ở cuối bị loại khỏi payload Anthropic Messages gửi đi
  khi thinking được bật, bao gồm các tuyến Cloudflare AI Gateway.
- Các khối thinking bị thiếu, trống, hoặc có chữ ký phát lại chỉ gồm khoảng trắng sẽ bị loại bỏ
  trước khi chuyển đổi nhà cung cấp. Nếu việc đó làm trống một lượt assistant, OpenClaw giữ
  hình dạng lượt với văn bản reasoning bị lược bỏ không trống.
- Các lượt assistant chỉ có thinking cũ hơn phải bị loại bỏ được thay bằng
  văn bản reasoning bị lược bỏ không trống để adapter nhà cung cấp không loại lượt
  phát lại.

**Amazon Bedrock (Converse API)**

- Các lượt lỗi luồng assistant trống được sửa thành một khối văn bản fallback không trống
  trước khi phát lại. Bedrock Converse từ chối thông điệp assistant với `content: []`, vì vậy
  các lượt assistant đã lưu có `stopReason: "error"` và nội dung trống cũng
  được sửa trên đĩa trước khi tải.
- Các lượt lỗi luồng assistant chỉ chứa các khối văn bản trống sẽ bị loại
  khỏi bản sao phát lại trong bộ nhớ thay vì phát lại một khối trống không hợp lệ.
- Các khối thinking Claude bị thiếu, trống, hoặc có chữ ký phát lại chỉ gồm khoảng trắng sẽ
  bị loại bỏ trước khi phát lại Converse. Nếu việc đó làm trống một lượt assistant, OpenClaw
  giữ hình dạng lượt với văn bản reasoning bị lược bỏ không trống.
- Các lượt assistant chỉ có thinking cũ hơn phải bị loại bỏ được thay bằng
  văn bản reasoning bị lược bỏ không trống để phát lại Converse giữ hình dạng lượt nghiêm ngặt.
- Phát lại lọc các lượt assistant delivery-mirror và do gateway chèn của OpenClaw.
- Làm sạch hình ảnh áp dụng qua quy tắc toàn cục.

**Mistral (bao gồm phát hiện dựa trên model-id)**

- Làm sạch id lệnh gọi công cụ: strict9 (chữ và số độ dài 9).

**OpenRouter Gemini**

- Dọn dẹp chữ ký suy nghĩ: loại bỏ các giá trị `thought_signature` không phải base64 (giữ base64).

**OpenRouter Anthropic**

- Các lượt assistant prefill ở cuối bị loại khỏi payload mô hình Anthropic tương thích OpenAI
  đã xác minh của OpenRouter khi reasoning được bật, khớp với hành vi phát lại
  Anthropic trực tiếp và Cloudflare Anthropic.

**Mọi thứ khác**

- Chỉ làm sạch hình ảnh.

---

## Hành vi lịch sử (trước 2026.1.22)

Trước bản phát hành 2026.1.22, OpenClaw áp dụng nhiều lớp vệ sinh bản ghi hội thoại:

- Một **transcript-sanitize extension** chạy trên mọi lần xây dựng ngữ cảnh và có thể:
  - Sửa chữa ghép cặp sử dụng/kết quả công cụ.
  - Làm sạch id lệnh gọi công cụ (bao gồm chế độ không nghiêm ngặt giữ lại `_`/`-`).
- Runner cũng thực hiện làm sạch dành riêng cho nhà cung cấp, dẫn đến trùng lặp công việc.
- Các đột biến bổ sung xảy ra bên ngoài chính sách nhà cung cấp, bao gồm:
  - Loại bỏ thẻ `<final>` khỏi văn bản assistant trước khi lưu.
  - Loại bỏ các lượt lỗi assistant trống.
  - Cắt bớt nội dung assistant sau các lệnh gọi công cụ.

Độ phức tạp này gây ra hồi quy giữa các nhà cung cấp (đáng chú ý là ghép cặp `call_id|fc_id`
của `openai-responses`). Đợt dọn dẹp 2026.1.22 đã loại bỏ extension, tập trung hóa
logic trong runner, và khiến OpenAI **không bị chạm tới** ngoài việc làm sạch hình ảnh.

## Liên quan

- [Quản lý phiên](/vi/concepts/session)
- [Cắt tỉa phiên](/vi/concepts/session-pruning)
