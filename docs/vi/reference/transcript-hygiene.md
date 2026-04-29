---
read_when:
    - Bạn đang gỡ lỗi các trường hợp yêu cầu gửi đến nhà cung cấp bị từ chối liên quan đến cấu trúc bản ghi hội thoại
    - Bạn đang thay đổi logic làm sạch bản ghi hội thoại hoặc sửa chữa lệnh gọi công cụ
    - Bạn đang điều tra các trường hợp không khớp mã định danh lệnh gọi công cụ giữa các nhà cung cấp
summary: 'Tham khảo: các quy tắc làm sạch và sửa chữa bản ghi dành riêng cho nhà cung cấp'
title: Vệ sinh bản ghi hội thoại
x-i18n:
    generated_at: "2026-04-29T23:13:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: d95f065d87ce58019ff2e6cdd6801879404d3b4fa402d26fc6fed9d51966b0a1
    source_path: reference/transcript-hygiene.md
    workflow: 16
---

OpenClaw áp dụng **các bản sửa dành riêng cho provider** cho transcript trước khi chạy (xây dựng ngữ cảnh mô hình). Phần lớn các điều chỉnh này là điều chỉnh **trong bộ nhớ** dùng để đáp ứng các yêu cầu nghiêm ngặt của provider. Một lượt sửa chữa tệp phiên riêng cũng có thể ghi lại JSONL đã lưu trước khi phiên được tải, bằng cách loại bỏ các dòng JSONL sai định dạng hoặc sửa các lượt đã lưu hợp lệ về cú pháp nhưng được biết là sẽ bị
provider từ chối trong quá trình phát lại. Khi có sửa chữa, tệp gốc được sao lưu cùng vị trí
với tệp phiên.

Phạm vi bao gồm:

- Ngữ cảnh prompt chỉ dùng khi chạy không xuất hiện trong các lượt transcript người dùng có thể thấy
- Làm sạch id lệnh gọi công cụ
- Xác thực đầu vào lệnh gọi công cụ
- Sửa ghép cặp kết quả công cụ
- Xác thực / sắp xếp lượt
- Dọn dẹp chữ ký suy nghĩ
- Dọn dẹp chữ ký thinking
- Làm sạch payload hình ảnh
- Dọn dẹp khối văn bản trống trước khi provider phát lại
- Gắn thẻ nguồn gốc đầu vào người dùng (cho các prompt được định tuyến giữa các phiên)
- Sửa lượt lỗi assistant trống cho phát lại Bedrock Converse

Nếu bạn cần chi tiết về lưu trữ transcript, xem:

- [Phân tích chuyên sâu về quản lý phiên](/vi/reference/session-management-compaction)

---

## Quy tắc toàn cục: ngữ cảnh runtime không phải là transcript người dùng

Ngữ cảnh runtime/hệ thống có thể được thêm vào prompt mô hình cho một lượt, nhưng đó
không phải là nội dung do người dùng cuối viết. OpenClaw giữ một thân prompt riêng
dành cho transcript cho các phản hồi Gateway, followup được xếp hàng, ACP, CLI và các lần chạy Pi
được nhúng. Các lượt người dùng hiển thị đã lưu dùng thân transcript đó thay vì
prompt đã được bổ sung ngữ cảnh runtime.

Đối với các phiên cũ đã lưu các wrapper runtime, các bề mặt lịch sử Gateway
áp dụng một projection hiển thị trước khi trả về thông điệp cho các client WebChat,
TUI, REST hoặc SSE.

---

## Nơi chạy

Toàn bộ vệ sinh transcript được tập trung trong runner nhúng:

- Chọn chính sách: `src/agents/transcript-policy.ts`
- Áp dụng làm sạch/sửa chữa: `sanitizeSessionHistory` trong `src/agents/pi-embedded-runner/replay-history.ts`

Chính sách dùng `provider`, `modelApi` và `modelId` để quyết định nội dung cần áp dụng.

Tách biệt với vệ sinh transcript, các tệp phiên được sửa chữa (nếu cần) trước khi tải:

- `repairSessionFileIfNeeded` trong `src/agents/session-file-repair.ts`
- Được gọi từ `run/attempt.ts` và `compact.ts` (runner nhúng)

---

## Quy tắc toàn cục: làm sạch hình ảnh

Payload hình ảnh luôn được làm sạch để tránh bị provider từ chối do giới hạn
kích thước (thu nhỏ/nén lại hình ảnh base64 quá lớn).

Điều này cũng giúp kiểm soát áp lực token do hình ảnh gây ra đối với các mô hình có khả năng xử lý thị giác.
Kích thước tối đa thấp hơn thường giảm mức dùng token; kích thước cao hơn giữ được chi tiết.

Triển khai:

- `sanitizeSessionMessagesImages` trong `src/agents/pi-embedded-helpers/images.ts`
- `sanitizeContentBlocksImages` trong `src/agents/tool-images.ts`
- Cạnh hình ảnh tối đa có thể cấu hình qua `agents.defaults.imageMaxDimensionPx` (mặc định: `1200`).
- Các khối văn bản trống được xóa trong khi lượt này duyệt nội dung phát lại. Các lượt assistant
  trở thành trống sẽ bị loại khỏi bản sao phát lại; các lượt user và tool-result
  trở thành trống sẽ nhận một placeholder nội dung bị lược bỏ không rỗng.

---

## Quy tắc toàn cục: lệnh gọi công cụ sai định dạng

Các khối lệnh gọi công cụ của assistant bị thiếu cả `input` lẫn `arguments` sẽ bị loại bỏ
trước khi ngữ cảnh mô hình được xây dựng. Điều này ngăn việc provider từ chối các lệnh gọi công cụ
đã lưu một phần (ví dụ sau lỗi giới hạn tốc độ).

Triển khai:

- `sanitizeToolCallInputs` trong `src/agents/session-transcript-repair.ts`
- Được áp dụng trong `sanitizeSessionHistory` trong `src/agents/pi-embedded-runner/replay-history.ts`

---

## Quy tắc toàn cục: nguồn gốc đầu vào giữa các phiên

Khi một agent gửi prompt vào phiên khác qua `sessions_send` (bao gồm
các bước trả lời/thông báo agent-to-agent), OpenClaw lưu lượt người dùng đã tạo với:

- `message.provenance.kind = "inter_session"`

OpenClaw cũng thêm trước văn bản prompt được định tuyến một marker cùng lượt `[Inter-session message ... isUser=false]`
để lệnh gọi mô hình đang hoạt động có thể phân biệt
đầu ra từ phiên ngoài với chỉ dẫn của người dùng cuối bên ngoài. Marker này bao gồm
phiên nguồn, kênh và công cụ khi có. Transcript vẫn dùng
`role: "user"` để tương thích với provider, nhưng văn bản hiển thị và metadata
nguồn gốc đều đánh dấu lượt này là dữ liệu giữa các phiên.

Trong quá trình dựng lại ngữ cảnh, OpenClaw áp dụng cùng marker đó cho các lượt người dùng
giữa các phiên đã lưu cũ hơn chỉ có metadata nguồn gốc.

---

## Ma trận provider (hành vi hiện tại)

**OpenAI / OpenAI Codex**

- Chỉ làm sạch hình ảnh.
- Loại bỏ các chữ ký reasoning mồ côi (các mục reasoning độc lập không có khối nội dung theo sau) cho transcript OpenAI Responses/Codex, và loại bỏ reasoning OpenAI có thể phát lại sau khi chuyển tuyến mô hình.
- Giữ nguyên các payload mục reasoning OpenAI Responses có thể phát lại, bao gồm các mục tóm tắt trống được mã hóa, để phát lại thủ công/WebSocket vẫn giữ trạng thái `rs_*` bắt buộc ghép với các mục đầu ra assistant.
- Không làm sạch id lệnh gọi công cụ.
- Sửa ghép cặp kết quả công cụ có thể di chuyển các đầu ra thật đã khớp và tổng hợp các đầu ra `aborted` kiểu Codex cho các lệnh gọi công cụ bị thiếu.
- Không xác thực hoặc sắp xếp lại lượt.
- Các đầu ra công cụ thuộc họ OpenAI Responses bị thiếu được tổng hợp thành `aborted` để khớp với chuẩn hóa phát lại Codex.
- Không loại bỏ chữ ký suy nghĩ.

**OpenAI-compatible Gemma 4**

- Các khối thinking/reasoning lịch sử của assistant bị loại bỏ trước khi phát lại để máy chủ Gemma 4
  tương thích OpenAI cục bộ không nhận nội dung reasoning từ lượt trước.
- Các tiếp diễn lệnh gọi công cụ cùng lượt hiện tại giữ khối reasoning của assistant
  gắn với lệnh gọi công cụ cho đến khi kết quả công cụ đã được phát lại.

**Google (Generative AI / Gemini CLI / Antigravity)**

- Làm sạch id lệnh gọi công cụ: chữ và số nghiêm ngặt.
- Sửa ghép cặp kết quả công cụ và kết quả công cụ tổng hợp.
- Xác thực lượt (luân phiên lượt kiểu Gemini).
- Sửa thứ tự lượt Google (thêm một bootstrap người dùng rất nhỏ nếu lịch sử bắt đầu bằng assistant).
- Antigravity Claude: chuẩn hóa chữ ký thinking; loại bỏ các khối thinking không có chữ ký.

**Anthropic / Minimax (tương thích Anthropic)**

- Sửa ghép cặp kết quả công cụ và kết quả công cụ tổng hợp.
- Xác thực lượt (gộp các lượt người dùng liên tiếp để đáp ứng luân phiên nghiêm ngặt).
- Các lượt prefill assistant ở cuối bị loại khỏi payload Anthropic Messages
  gửi đi khi thinking được bật, bao gồm các tuyến Cloudflare AI Gateway.
- Các khối thinking có chữ ký phát lại bị thiếu, rỗng hoặc chỉ có khoảng trắng bị loại bỏ
  trước khi chuyển đổi provider. Nếu điều đó làm rỗng một lượt assistant, OpenClaw giữ
  hình dạng lượt bằng văn bản omitted-reasoning không rỗng.
- Các lượt assistant cũ chỉ có thinking phải bị loại bỏ được thay bằng
  văn bản omitted-reasoning không rỗng để adapter provider không loại bỏ lượt
  phát lại.

**Amazon Bedrock (Converse API)**

- Các lượt lỗi stream assistant trống được sửa thành một khối văn bản dự phòng không rỗng
  trước khi phát lại. Bedrock Converse từ chối thông điệp assistant có `content: []`, nên
  các lượt assistant đã lưu có `stopReason: "error"` và nội dung trống cũng được
  sửa trên đĩa trước khi tải.
- Các lượt lỗi stream assistant chỉ chứa các khối văn bản trống bị loại bỏ
  khỏi bản sao phát lại trong bộ nhớ thay vì phát lại một khối trống không hợp lệ.
- Các khối thinking Claude có chữ ký phát lại bị thiếu, rỗng hoặc chỉ có khoảng trắng bị
  loại bỏ trước khi Converse phát lại. Nếu điều đó làm rỗng một lượt assistant, OpenClaw
  giữ hình dạng lượt bằng văn bản omitted-reasoning không rỗng.
- Các lượt assistant cũ chỉ có thinking phải bị loại bỏ được thay bằng
  văn bản omitted-reasoning không rỗng để phát lại Converse giữ hình dạng lượt nghiêm ngặt.
- Phát lại lọc các lượt assistant delivery-mirror của OpenClaw và do Gateway chèn.
- Làm sạch hình ảnh áp dụng qua quy tắc toàn cục.

**Mistral (bao gồm phát hiện dựa trên model-id)**

- Làm sạch id lệnh gọi công cụ: strict9 (chữ và số, độ dài 9).

**OpenRouter Gemini**

- Dọn dẹp chữ ký suy nghĩ: loại bỏ các giá trị `thought_signature` không phải base64 (giữ base64).

**Mọi thứ khác**

- Chỉ làm sạch hình ảnh.

---

## Hành vi lịch sử (trước 2026.1.22)

Trước bản phát hành 2026.1.22, OpenClaw áp dụng nhiều lớp vệ sinh transcript:

- Một **transcript-sanitize extension** chạy trên mỗi lần xây dựng ngữ cảnh và có thể:
  - Sửa ghép cặp sử dụng/kết quả công cụ.
  - Làm sạch id lệnh gọi công cụ (bao gồm chế độ không nghiêm ngặt giữ lại `_`/`-`).
- Runner cũng thực hiện làm sạch dành riêng cho provider, gây trùng lặp công việc.
- Các đột biến bổ sung xảy ra bên ngoài chính sách provider, bao gồm:
  - Loại bỏ thẻ `<final>` khỏi văn bản assistant trước khi lưu.
  - Loại bỏ các lượt lỗi assistant trống.
  - Cắt bớt nội dung assistant sau các lệnh gọi công cụ.

Độ phức tạp này gây ra hồi quy giữa các provider (đáng chú ý là ghép cặp `call_id|fc_id` của
`openai-responses`). Lượt dọn dẹp 2026.1.22 đã loại bỏ extension, tập trung hóa
logic trong runner và biến OpenAI thành **không đụng chạm** ngoài làm sạch hình ảnh.

## Liên quan

- [Quản lý phiên](/vi/concepts/session)
- [Cắt tỉa phiên](/vi/concepts/session-pruning)
