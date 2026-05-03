---
read_when:
    - Bạn đang gỡ lỗi các lỗi từ chối yêu cầu của nhà cung cấp liên quan đến cấu trúc bản ghi hội thoại
    - Bạn đang thay đổi logic làm sạch bản ghi hội thoại hoặc sửa chữa lệnh gọi công cụ
    - Bạn đang điều tra các điểm không khớp về mã định danh lệnh gọi công cụ giữa các nhà cung cấp
summary: 'Tham khảo: các quy tắc làm sạch và sửa chữa bản ghi dành riêng cho nhà cung cấp'
title: Vệ sinh bản ghi hội thoại
x-i18n:
    generated_at: "2026-05-03T10:43:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: ff3a364a4c4d1c0d1e03b2860396c2d7e32c554d7acd0791ed2eaadae06d35ab
    source_path: reference/transcript-hygiene.md
    workflow: 16
---

OpenClaw áp dụng **các bản sửa lỗi dành riêng cho nhà cung cấp** cho bản ghi hội thoại trước một lần chạy (xây dựng ngữ cảnh mô hình). Hầu hết các điều chỉnh này là điều chỉnh **trong bộ nhớ** dùng để đáp ứng các yêu cầu nghiêm ngặt của nhà cung cấp. Một lượt sửa chữa tệp phiên riêng biệt cũng có thể ghi lại JSONL đã lưu trữ trước khi phiên được tải, nhưng chỉ đối với các dòng sai định dạng hoặc các lượt đã lưu không phải là bản ghi bền hợp lệ. Các phản hồi trợ lý đã được gửi được giữ nguyên trên đĩa; việc loại bỏ phần điền sẵn dành riêng cho nhà cung cấp của trợ lý chỉ diễn ra khi xây dựng payload gửi đi. Khi có sửa chữa, tệp gốc được sao lưu cạnh tệp phiên.

Phạm vi bao gồm:

- Ngữ cảnh lời nhắc chỉ dùng lúc chạy không xuất hiện trong các lượt bản ghi hội thoại hiển thị với người dùng
- Làm sạch id lệnh gọi công cụ
- Xác thực đầu vào lệnh gọi công cụ
- Sửa chữa ghép cặp kết quả công cụ
- Xác thực / sắp xếp lượt
- Dọn dẹp chữ ký suy nghĩ
- Dọn dẹp chữ ký thinking
- Làm sạch payload hình ảnh
- Dọn dẹp khối văn bản trống trước khi phát lại cho nhà cung cấp
- Gắn thẻ nguồn gốc đầu vào của người dùng (cho lời nhắc được định tuyến liên phiên)
- Sửa chữa lượt lỗi trợ lý trống cho phát lại Bedrock Converse

Nếu bạn cần chi tiết về lưu trữ bản ghi hội thoại, xem:

- [Phân tích chuyên sâu về quản lý phiên](/vi/reference/session-management-compaction)

---

## Quy tắc toàn cục: ngữ cảnh lúc chạy không phải là bản ghi hội thoại của người dùng

Ngữ cảnh lúc chạy/hệ thống có thể được thêm vào lời nhắc mô hình cho một lượt, nhưng đó
không phải là nội dung do người dùng cuối soạn. OpenClaw giữ một phần thân lời nhắc
riêng hướng tới bản ghi hội thoại cho các phản hồi Gateway, followup được xếp hàng, ACP, CLI và các lần chạy Pi
nhúng. Các lượt người dùng hiển thị đã lưu dùng phần thân bản ghi hội thoại đó thay vì
lời nhắc được làm giàu bằng ngữ cảnh lúc chạy.

Đối với các phiên cũ đã lưu các wrapper lúc chạy, các bề mặt lịch sử Gateway
áp dụng một phép chiếu hiển thị trước khi trả về thông báo cho WebChat,
TUI, REST hoặc máy khách SSE.

---

## Nơi cơ chế này chạy

Toàn bộ vệ sinh bản ghi hội thoại được tập trung trong runner nhúng:

- Chọn chính sách: `src/agents/transcript-policy.ts`
- Áp dụng làm sạch/sửa chữa: `sanitizeSessionHistory` trong `src/agents/pi-embedded-runner/replay-history.ts`

Chính sách dùng `provider`, `modelApi` và `modelId` để quyết định áp dụng những gì.

Tách biệt với vệ sinh bản ghi hội thoại, các tệp phiên được sửa chữa (nếu cần) trước khi tải:

- `repairSessionFileIfNeeded` trong `src/agents/session-file-repair.ts`
- Được gọi từ `run/attempt.ts` và `compact.ts` (runner nhúng)

---

## Quy tắc toàn cục: làm sạch hình ảnh

Payload hình ảnh luôn được làm sạch để ngăn việc bị nhà cung cấp từ chối do giới hạn
kích thước (giảm tỷ lệ/nén lại hình ảnh base64 quá lớn).

Điều này cũng giúp kiểm soát áp lực token do hình ảnh gây ra cho các mô hình hỗ trợ thị giác.
Kích thước tối đa thấp hơn thường giảm mức dùng token; kích thước cao hơn giữ lại chi tiết.

Triển khai:

- `sanitizeSessionMessagesImages` trong `src/agents/pi-embedded-helpers/images.ts`
- `sanitizeContentBlocksImages` trong `src/agents/tool-images.ts`
- Cạnh tối đa của hình ảnh có thể cấu hình qua `agents.defaults.imageMaxDimensionPx` (mặc định: `1200`).
- Các khối văn bản trống bị xóa khi lượt này duyệt nội dung phát lại. Các lượt trợ lý
  trở nên trống sẽ bị loại khỏi bản sao phát lại; các lượt người dùng và kết quả công cụ
  trở nên trống sẽ nhận một placeholder nội dung bị bỏ qua không rỗng.

---

## Quy tắc toàn cục: lệnh gọi công cụ sai định dạng

Các khối lệnh gọi công cụ của trợ lý thiếu cả `input` lẫn `arguments` sẽ bị loại bỏ
trước khi ngữ cảnh mô hình được xây dựng. Điều này ngăn việc nhà cung cấp từ chối do các
lệnh gọi công cụ được lưu một phần (ví dụ, sau lỗi giới hạn tốc độ).

Triển khai:

- `sanitizeToolCallInputs` trong `src/agents/session-transcript-repair.ts`
- Được áp dụng trong `sanitizeSessionHistory` trong `src/agents/pi-embedded-runner/replay-history.ts`

---

## Quy tắc toàn cục: nguồn gốc đầu vào liên phiên

Khi một tác nhân gửi lời nhắc vào một phiên khác qua `sessions_send` (bao gồm
các bước trả lời/thông báo giữa các tác nhân), OpenClaw lưu lượt người dùng được tạo với:

- `message.provenance.kind = "inter_session"`

OpenClaw cũng thêm một marker cùng lượt `[Inter-session message ... isUser=false]`
trước văn bản lời nhắc được định tuyến để lệnh gọi mô hình đang hoạt động có thể phân biệt
đầu ra từ phiên bên ngoài với chỉ dẫn của người dùng cuối bên ngoài. Marker này bao gồm
phiên nguồn, kênh và công cụ khi có. Bản ghi hội thoại vẫn dùng
`role: "user"` để tương thích với nhà cung cấp, nhưng cả văn bản hiển thị và siêu dữ liệu
nguồn gốc đều đánh dấu lượt đó là dữ liệu liên phiên.

Trong quá trình dựng lại ngữ cảnh, OpenClaw áp dụng cùng marker cho các lượt người dùng
liên phiên đã lưu cũ hơn chỉ có siêu dữ liệu nguồn gốc.

---

## Ma trận nhà cung cấp (hành vi hiện tại)

**OpenAI / OpenAI Codex**

- Chỉ làm sạch hình ảnh.
- Loại bỏ các chữ ký reasoning mồ côi (mục reasoning độc lập không có khối nội dung theo sau) cho bản ghi hội thoại OpenAI Responses/Codex, và loại bỏ reasoning OpenAI có thể phát lại sau khi chuyển tuyến mô hình.
- Giữ lại các payload mục reasoning của OpenAI Responses có thể phát lại, bao gồm các mục tóm tắt trống đã mã hóa, để phát lại thủ công/WebSocket giữ trạng thái `rs_*` bắt buộc được ghép với các mục đầu ra của trợ lý.
- Không làm sạch id lệnh gọi công cụ.
- Sửa chữa ghép cặp kết quả công cụ có thể di chuyển các đầu ra thực đã khớp và tổng hợp các đầu ra `aborted` kiểu Codex cho các lệnh gọi công cụ bị thiếu.
- Không xác thực hoặc sắp xếp lại lượt.
- Các đầu ra công cụ thuộc họ OpenAI Responses bị thiếu được tổng hợp thành `aborted` để khớp với chuẩn hóa phát lại Codex.
- Không loại bỏ chữ ký suy nghĩ.

**Gemma 4 tương thích OpenAI**

- Các khối thinking/reasoning lịch sử của trợ lý bị loại bỏ trước khi phát lại để máy chủ Gemma 4
  cục bộ tương thích OpenAI không nhận nội dung reasoning của lượt trước.
- Các phần tiếp nối lệnh gọi công cụ cùng lượt hiện tại giữ khối reasoning của trợ lý
  gắn với lệnh gọi công cụ cho đến khi kết quả công cụ đã được phát lại.

**Google (Generative AI / Gemini CLI / Antigravity)**

- Làm sạch id lệnh gọi công cụ: chữ và số nghiêm ngặt.
- Sửa chữa ghép cặp kết quả công cụ và kết quả công cụ tổng hợp.
- Xác thực lượt (luân phiên lượt kiểu Gemini).
- Sửa thứ tự lượt Google (thêm một bootstrap người dùng rất nhỏ ở đầu nếu lịch sử bắt đầu bằng trợ lý).
- Antigravity Claude: chuẩn hóa chữ ký thinking; loại bỏ các khối thinking không có chữ ký.

**Anthropic / Minimax (tương thích Anthropic)**

- Sửa chữa ghép cặp kết quả công cụ và kết quả công cụ tổng hợp.
- Xác thực lượt (gộp các lượt người dùng liên tiếp để đáp ứng luân phiên nghiêm ngặt).
- Các lượt điền sẵn trợ lý ở cuối bị loại khỏi payload Anthropic Messages
  gửi đi khi thinking được bật, bao gồm các tuyến Cloudflare AI Gateway.
- Các khối thinking thiếu, rỗng hoặc có chữ ký phát lại trống bị loại bỏ
  trước khi chuyển đổi nhà cung cấp. Nếu điều đó làm một lượt trợ lý rỗng, OpenClaw giữ
  hình dạng lượt với văn bản reasoning bị bỏ qua không rỗng.
- Các lượt trợ lý cũ chỉ có thinking phải bị loại bỏ được thay bằng
  văn bản reasoning bị bỏ qua không rỗng để adapter nhà cung cấp không loại bỏ lượt
  phát lại.

**Amazon Bedrock (Converse API)**

- Các lượt lỗi luồng trợ lý trống được sửa thành một khối văn bản dự phòng không rỗng
  trước khi phát lại. Bedrock Converse từ chối thông điệp trợ lý có `content: []`, vì vậy
  các lượt trợ lý đã lưu với `stopReason: "error"` và nội dung trống cũng được
  sửa trên đĩa trước khi tải.
- Các lượt lỗi luồng trợ lý chỉ chứa khối văn bản trống bị loại khỏi
  bản sao phát lại trong bộ nhớ thay vì phát lại một khối trống không hợp lệ.
- Các khối thinking Claude thiếu, rỗng hoặc có chữ ký phát lại trống bị
  loại bỏ trước khi phát lại Converse. Nếu điều đó làm một lượt trợ lý rỗng, OpenClaw
  giữ hình dạng lượt với văn bản reasoning bị bỏ qua không rỗng.
- Các lượt trợ lý cũ chỉ có thinking phải bị loại bỏ được thay bằng
  văn bản reasoning bị bỏ qua không rỗng để phát lại Converse giữ hình dạng lượt nghiêm ngặt.
- Phát lại lọc các lượt trợ lý phản chiếu gửi của OpenClaw và do gateway chèn.
- Làm sạch hình ảnh được áp dụng thông qua quy tắc toàn cục.

**Mistral (bao gồm phát hiện dựa trên model-id)**

- Làm sạch id lệnh gọi công cụ: strict9 (chữ và số dài 9).

**OpenRouter Gemini**

- Dọn dẹp chữ ký suy nghĩ: loại bỏ các giá trị `thought_signature` không phải base64 (giữ lại base64).

**OpenRouter Anthropic**

- Các lượt điền sẵn trợ lý ở cuối bị loại khỏi payload mô hình Anthropic
  tương thích OpenAI của OpenRouter đã được xác minh khi reasoning được bật, khớp với
  hành vi phát lại Anthropic trực tiếp và Cloudflare Anthropic.

**Mọi thứ khác**

- Chỉ làm sạch hình ảnh.

---

## Hành vi lịch sử (trước 2026.1.22)

Trước bản phát hành 2026.1.22, OpenClaw áp dụng nhiều lớp vệ sinh bản ghi hội thoại:

- Một **transcript-sanitize extension** chạy trên mỗi lần xây dựng ngữ cảnh và có thể:
  - Sửa chữa ghép cặp dùng công cụ/kết quả.
  - Làm sạch id lệnh gọi công cụ (bao gồm một chế độ không nghiêm ngặt giữ lại `_`/`-`).
- Runner cũng thực hiện làm sạch dành riêng cho nhà cung cấp, gây trùng lặp công việc.
- Các đột biến bổ sung xảy ra ngoài chính sách nhà cung cấp, bao gồm:
  - Loại bỏ thẻ `<final>` khỏi văn bản trợ lý trước khi lưu.
  - Loại bỏ các lượt lỗi trợ lý trống.
  - Cắt bớt nội dung trợ lý sau lệnh gọi công cụ.

Sự phức tạp này đã gây ra hồi quy xuyên nhà cung cấp (đáng chú ý là ghép cặp `openai-responses`
`call_id|fc_id`). Lần dọn dẹp 2026.1.22 đã loại bỏ extension, tập trung hóa
logic trong runner và khiến OpenAI **không chạm tới** ngoài việc làm sạch hình ảnh.

## Liên quan

- [Quản lý phiên](/vi/concepts/session)
- [Cắt tỉa phiên](/vi/concepts/session-pruning)
