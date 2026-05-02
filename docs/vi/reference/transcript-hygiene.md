---
read_when:
    - Bạn đang gỡ lỗi các lần nhà cung cấp từ chối yêu cầu liên quan đến cấu trúc bản ghi hội thoại
    - Bạn đang thay đổi logic làm sạch bản ghi hội thoại hoặc sửa chữa lệnh gọi công cụ
    - Bạn đang điều tra tình trạng không khớp ID lệnh gọi công cụ giữa các nhà cung cấp
summary: 'Tham chiếu: quy tắc làm sạch và sửa chữa bản ghi hội thoại dành riêng cho nhà cung cấp'
title: Vệ sinh bản ghi hội thoại
x-i18n:
    generated_at: "2026-05-02T10:53:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6976d4349e47954f49c9dbf300822013851b604ed665f4ab647c62025760a96c
    source_path: reference/transcript-hygiene.md
    workflow: 16
---

OpenClaw áp dụng **các bản sửa riêng theo nhà cung cấp** cho bản ghi hội thoại trước một lần chạy (xây dựng ngữ cảnh mô hình). Hầu hết các điều chỉnh này là điều chỉnh **trong bộ nhớ** dùng để đáp ứng các yêu cầu nghiêm ngặt của nhà cung cấp. Một lượt sửa chữa tệp phiên riêng biệt cũng có thể ghi lại JSONL đã lưu trước khi phiên được tải, bằng cách loại bỏ các dòng JSONL sai định dạng hoặc sửa các lượt đã lưu hợp lệ về cú pháp nhưng được biết là sẽ bị một
nhà cung cấp từ chối trong quá trình phát lại. Khi có sửa chữa, tệp gốc được sao lưu bên cạnh
tệp phiên.

Phạm vi bao gồm:

- Ngữ cảnh prompt chỉ dùng khi chạy không xuất hiện trong các lượt bản ghi hội thoại mà người dùng nhìn thấy
- Làm sạch id lệnh gọi công cụ
- Xác thực đầu vào lệnh gọi công cụ
- Sửa ghép cặp kết quả công cụ
- Xác thực / sắp xếp lượt
- Dọn dẹp chữ ký suy nghĩ
- Dọn dẹp chữ ký thinking
- Làm sạch tải trọng hình ảnh
- Dọn dẹp khối văn bản trống trước khi phát lại cho nhà cung cấp
- Gắn thẻ nguồn gốc đầu vào người dùng (cho các prompt được định tuyến liên phiên)
- Sửa lượt lỗi assistant rỗng cho phát lại Bedrock Converse

Nếu bạn cần chi tiết về lưu trữ bản ghi hội thoại, xem:

- [Phân tích sâu về quản lý phiên](/vi/reference/session-management-compaction)

---

## Quy tắc toàn cục: ngữ cảnh runtime không phải là bản ghi hội thoại của người dùng

Ngữ cảnh runtime/hệ thống có thể được thêm vào prompt mô hình cho một lượt, nhưng nó
không phải là nội dung do người dùng cuối soạn. OpenClaw giữ một nội dung prompt
hướng tới bản ghi hội thoại riêng cho phản hồi Gateway, followup đã xếp hàng, ACP, CLI, và các lần chạy Pi
nhúng. Các lượt người dùng hiển thị đã lưu dùng nội dung bản ghi hội thoại đó thay vì
prompt đã được bổ sung ngữ cảnh runtime.

Đối với các phiên cũ đã lưu wrapper runtime, các bề mặt lịch sử Gateway
áp dụng một phép chiếu hiển thị trước khi trả về thông báo cho WebChat,
TUI, REST, hoặc client SSE.

---

## Nơi quy trình này chạy

Toàn bộ vệ sinh bản ghi hội thoại được tập trung trong runner nhúng:

- Chọn chính sách: `src/agents/transcript-policy.ts`
- Áp dụng làm sạch/sửa chữa: `sanitizeSessionHistory` trong `src/agents/pi-embedded-runner/replay-history.ts`

Chính sách dùng `provider`, `modelApi`, và `modelId` để quyết định áp dụng những gì.

Tách biệt với vệ sinh bản ghi hội thoại, các tệp phiên được sửa (nếu cần) trước khi tải:

- `repairSessionFileIfNeeded` trong `src/agents/session-file-repair.ts`
- Được gọi từ `run/attempt.ts` và `compact.ts` (runner nhúng)

---

## Quy tắc toàn cục: làm sạch hình ảnh

Tải trọng hình ảnh luôn được làm sạch để tránh bị nhà cung cấp từ chối do giới hạn
kích thước (giảm tỷ lệ/nén lại hình ảnh base64 quá lớn).

Việc này cũng giúp kiểm soát áp lực token do hình ảnh tạo ra cho các mô hình hỗ trợ thị giác.
Kích thước tối đa thấp hơn thường giảm mức sử dụng token; kích thước cao hơn giữ lại chi tiết.

Triển khai:

- `sanitizeSessionMessagesImages` trong `src/agents/pi-embedded-helpers/images.ts`
- `sanitizeContentBlocksImages` trong `src/agents/tool-images.ts`
- Cạnh hình ảnh tối đa có thể cấu hình qua `agents.defaults.imageMaxDimensionPx` (mặc định: `1200`).
- Các khối văn bản trống bị xóa trong khi lượt này duyệt nội dung phát lại. Các lượt assistant
  trở nên rỗng sẽ bị loại khỏi bản sao phát lại; lượt người dùng và kết quả công cụ
  trở nên rỗng sẽ nhận một placeholder nội dung đã lược bỏ không rỗng.

---

## Quy tắc toàn cục: lệnh gọi công cụ sai định dạng

Các khối lệnh gọi công cụ của assistant thiếu cả `input` và `arguments` sẽ bị loại bỏ
trước khi ngữ cảnh mô hình được xây dựng. Điều này ngăn việc nhà cung cấp từ chối các
lệnh gọi công cụ được lưu một phần (ví dụ, sau lỗi giới hạn tốc độ).

Triển khai:

- `sanitizeToolCallInputs` trong `src/agents/session-transcript-repair.ts`
- Áp dụng trong `sanitizeSessionHistory` trong `src/agents/pi-embedded-runner/replay-history.ts`

---

## Quy tắc toàn cục: nguồn gốc đầu vào liên phiên

Khi một agent gửi prompt vào một phiên khác qua `sessions_send` (bao gồm
các bước trả lời/thông báo agent-to-agent), OpenClaw lưu lượt người dùng đã tạo với:

- `message.provenance.kind = "inter_session"`

OpenClaw cũng thêm trước văn bản prompt được định tuyến một marker cùng lượt `[Inter-session message ... isUser=false]`
để lệnh gọi mô hình đang hoạt động có thể phân biệt đầu ra của phiên khác
với hướng dẫn bên ngoài từ người dùng cuối. Marker này bao gồm
phiên nguồn, kênh, và công cụ khi có. Bản ghi hội thoại vẫn dùng
`role: "user"` để tương thích với nhà cung cấp, nhưng cả văn bản hiển thị và siêu dữ liệu
nguồn gốc đều đánh dấu lượt đó là dữ liệu liên phiên.

Trong quá trình xây dựng lại ngữ cảnh, OpenClaw áp dụng cùng marker cho các lượt người dùng
liên phiên cũ hơn chỉ có siêu dữ liệu nguồn gốc.

---

## Ma trận nhà cung cấp (hành vi hiện tại)

**OpenAI / OpenAI Codex**

- Chỉ làm sạch hình ảnh.
- Loại bỏ các chữ ký reasoning mồ côi (mục reasoning độc lập không có khối nội dung theo sau) cho bản ghi hội thoại OpenAI Responses/Codex, và loại bỏ reasoning OpenAI có thể phát lại sau khi chuyển tuyến mô hình.
- Giữ nguyên tải trọng mục reasoning OpenAI Responses có thể phát lại, bao gồm các mục tóm tắt rỗng đã mã hóa, để phát lại thủ công/WebSocket giữ trạng thái `rs_*` bắt buộc được ghép với các mục đầu ra assistant.
- Không làm sạch id lệnh gọi công cụ.
- Sửa ghép cặp kết quả công cụ có thể di chuyển các đầu ra thật khớp nhau và tổng hợp đầu ra `aborted` kiểu Codex cho các lệnh gọi công cụ bị thiếu.
- Không xác thực hoặc sắp xếp lại lượt.
- Các đầu ra công cụ họ OpenAI Responses bị thiếu được tổng hợp thành `aborted` để khớp với chuẩn hóa phát lại Codex.
- Không loại bỏ chữ ký suy nghĩ.

**Gemma 4 tương thích OpenAI**

- Các khối thinking/reasoning assistant lịch sử được loại bỏ trước khi phát lại để các máy chủ
  Gemma 4 tương thích OpenAI cục bộ không nhận nội dung reasoning của lượt trước.
- Các tiếp diễn lệnh gọi công cụ cùng lượt hiện tại giữ khối reasoning assistant
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
- Các lượt prefill assistant ở cuối bị loại khỏi tải trọng Anthropic Messages
  gửi đi khi thinking được bật, bao gồm các tuyến Cloudflare AI Gateway.
- Các khối thinking thiếu, rỗng, hoặc có chữ ký phát lại trống bị loại bỏ
  trước khi chuyển đổi cho nhà cung cấp. Nếu việc đó làm rỗng một lượt assistant, OpenClaw giữ
  hình dạng lượt bằng văn bản omitted-reasoning không rỗng.
- Các lượt assistant chỉ có thinking cũ hơn phải bị loại bỏ được thay thế bằng
  văn bản omitted-reasoning không rỗng để adapter nhà cung cấp không loại bỏ lượt
  phát lại.

**Amazon Bedrock (Converse API)**

- Các lượt lỗi luồng assistant rỗng được sửa thành một khối văn bản dự phòng không rỗng
  trước khi phát lại. Bedrock Converse từ chối thông báo assistant có `content: []`, nên
  các lượt assistant đã lưu với `stopReason: "error"` và nội dung rỗng cũng
  được sửa trên đĩa trước khi tải.
- Các lượt lỗi luồng assistant chỉ chứa khối văn bản trống bị loại bỏ
  khỏi bản sao phát lại trong bộ nhớ thay vì phát lại một khối trống không hợp lệ.
- Các khối thinking Claude thiếu, rỗng, hoặc có chữ ký phát lại trống
  bị loại bỏ trước khi phát lại Converse. Nếu việc đó làm rỗng một lượt assistant, OpenClaw
  giữ hình dạng lượt bằng văn bản omitted-reasoning không rỗng.
- Các lượt assistant chỉ có thinking cũ hơn phải bị loại bỏ được thay thế bằng
  văn bản omitted-reasoning không rỗng để phát lại Converse giữ hình dạng lượt nghiêm ngặt.
- Phát lại lọc các lượt assistant delivery-mirror của OpenClaw và các lượt assistant do Gateway chèn.
- Làm sạch hình ảnh được áp dụng thông qua quy tắc toàn cục.

**Mistral (bao gồm phát hiện dựa trên model-id)**

- Làm sạch id lệnh gọi công cụ: strict9 (chữ và số dài 9).

**OpenRouter Gemini**

- Dọn dẹp chữ ký suy nghĩ: loại bỏ các giá trị `thought_signature` không phải base64 (giữ base64).

**OpenRouter Anthropic**

- Các lượt prefill assistant ở cuối bị loại khỏi tải trọng mô hình Anthropic
  tương thích OpenAI đã xác minh của OpenRouter khi reasoning được bật, khớp với
  hành vi phát lại Anthropic trực tiếp và Cloudflare Anthropic.

**Mọi thứ khác**

- Chỉ làm sạch hình ảnh.

---

## Hành vi lịch sử (trước 2026.1.22)

Trước bản phát hành 2026.1.22, OpenClaw áp dụng nhiều lớp vệ sinh bản ghi hội thoại:

- Một **Plugin transcript-sanitize** chạy trên mỗi lần xây dựng ngữ cảnh và có thể:
  - Sửa ghép cặp tool use/result.
  - Làm sạch id lệnh gọi công cụ (bao gồm chế độ không nghiêm ngặt giữ lại `_`/`-`).
- Runner cũng thực hiện làm sạch riêng theo nhà cung cấp, dẫn đến trùng lặp công việc.
- Các đột biến bổ sung xảy ra bên ngoài chính sách nhà cung cấp, bao gồm:
  - Loại bỏ thẻ `<final>` khỏi văn bản assistant trước khi lưu.
  - Loại bỏ các lượt lỗi assistant rỗng.
  - Cắt bớt nội dung assistant sau các lệnh gọi công cụ.

Độ phức tạp này gây ra hồi quy giữa các nhà cung cấp (đáng chú ý là ghép cặp `openai-responses`
`call_id|fc_id`). Lần dọn dẹp 2026.1.22 đã gỡ bỏ Plugin, tập trung
logic trong runner, và khiến OpenAI **không chạm tới** ngoài việc làm sạch hình ảnh.

## Liên quan

- [Quản lý phiên](/vi/concepts/session)
- [Cắt tỉa phiên](/vi/concepts/session-pruning)
