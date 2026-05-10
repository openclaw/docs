---
read_when:
    - Bạn đang gỡ lỗi các trường hợp từ chối yêu cầu của nhà cung cấp liên quan đến cấu trúc bản ghi hội thoại
    - Bạn đang thay đổi logic làm sạch bản ghi hoặc sửa chữa lệnh gọi công cụ
    - Bạn đang điều tra các điểm không khớp ID lệnh gọi công cụ giữa các nhà cung cấp
summary: 'Tham chiếu: các quy tắc làm sạch và sửa chữa bản ghi hội thoại dành riêng cho nhà cung cấp'
title: Giữ sạch bản ghi hội thoại
x-i18n:
    generated_at: "2026-05-10T19:51:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 197081fe829cf6463e84c5ead9b4c631a8088e771e68163a35ed39d9efbdbf6a
    source_path: reference/transcript-hygiene.md
    workflow: 16
---

OpenClaw áp dụng **các bản sửa dành riêng cho nhà cung cấp** vào transcript trước một lần chạy (khi xây dựng ngữ cảnh mô hình). Hầu hết các bản sửa này là các điều chỉnh **trong bộ nhớ** dùng để đáp ứng những yêu cầu nghiêm ngặt của nhà cung cấp. Một lượt sửa chữa tệp phiên riêng cũng có thể ghi lại JSONL đã lưu trước khi phiên được tải, nhưng chỉ dành cho các dòng sai định dạng hoặc các lượt đã lưu không phải là bản ghi bền vững hợp lệ. Các phản hồi assistant đã gửi được giữ nguyên trên đĩa; việc loại bỏ phần assistant-prefill dành riêng cho nhà cung cấp chỉ xảy ra khi xây dựng payload gửi đi. Khi có sửa chữa, tệp gốc được sao lưu cạnh tệp phiên.

Phạm vi bao gồm:

- Ngữ cảnh prompt chỉ dùng lúc chạy không xuất hiện trong các lượt transcript hiển thị với người dùng
- Làm sạch id lệnh gọi công cụ
- Xác thực đầu vào lệnh gọi công cụ
- Sửa ghép cặp kết quả công cụ
- Xác thực / sắp xếp lượt
- Dọn dẹp chữ ký suy nghĩ
- Dọn dẹp chữ ký thinking
- Làm sạch payload hình ảnh
- Dọn dẹp khối văn bản trống trước khi phát lại cho nhà cung cấp
- Gắn nhãn nguồn gốc đầu vào người dùng (cho các prompt được định tuyến giữa các phiên)
- Sửa lượt lỗi assistant rỗng cho phát lại Bedrock Converse

Nếu bạn cần chi tiết về lưu trữ transcript, xem:

- [Phân tích chuyên sâu về quản lý phiên](/vi/reference/session-management-compaction)

---

## Quy tắc toàn cục: ngữ cảnh lúc chạy không phải là transcript người dùng

Ngữ cảnh runtime/system có thể được thêm vào prompt mô hình cho một lượt, nhưng đó
không phải là nội dung do người dùng cuối soạn. OpenClaw giữ một thân prompt
riêng dành cho transcript cho các phản hồi Gateway, followup xếp hàng, ACP, CLI,
và các lần chạy Pi nhúng. Các lượt người dùng hiển thị được lưu dùng thân transcript đó thay vì
prompt đã được làm giàu bằng ngữ cảnh lúc chạy.

Đối với các phiên cũ đã lưu các wrapper lúc chạy, các bề mặt lịch sử Gateway
áp dụng một phép chiếu hiển thị trước khi trả thông điệp về WebChat,
TUI, REST, hoặc các client SSE.

---

## Nơi phần này chạy

Toàn bộ vệ sinh transcript được tập trung trong runner nhúng:

- Chọn chính sách: `src/agents/transcript-policy.ts`
- Áp dụng làm sạch/sửa chữa: `sanitizeSessionHistory` trong `src/agents/pi-embedded-runner/replay-history.ts`

Chính sách dùng `provider`, `modelApi`, và `modelId` để quyết định áp dụng gì.

Tách biệt với vệ sinh transcript, các tệp phiên được sửa chữa (nếu cần) trước khi tải:

- `repairSessionFileIfNeeded` trong `src/agents/session-file-repair.ts`
- Được gọi từ `run/attempt.ts` và `compact.ts` (runner nhúng)

---

## Quy tắc toàn cục: làm sạch hình ảnh

Payload hình ảnh luôn được làm sạch để tránh bị nhà cung cấp từ chối do giới hạn
kích thước (thu nhỏ/nén lại hình ảnh base64 quá lớn).

Điều này cũng giúp kiểm soát áp lực token do hình ảnh gây ra cho các mô hình hỗ trợ thị giác.
Kích thước tối đa thấp hơn thường giảm mức dùng token; kích thước cao hơn giữ được chi tiết.

Triển khai:

- `sanitizeSessionMessagesImages` trong `src/agents/pi-embedded-helpers/images.ts`
- `sanitizeContentBlocksImages` trong `src/agents/tool-images.ts`
- Cạnh hình ảnh tối đa có thể cấu hình qua `agents.defaults.imageMaxDimensionPx` (mặc định: `1200`).
- Các khối văn bản trống bị loại bỏ khi lượt này duyệt qua nội dung phát lại. Các lượt assistant
  trở thành rỗng sẽ bị bỏ khỏi bản sao phát lại; các lượt người dùng và kết quả công cụ
  trở thành rỗng sẽ nhận một placeholder nội dung bị bỏ qua nhưng không rỗng.

---

## Quy tắc toàn cục: lệnh gọi công cụ sai định dạng

Các khối lệnh gọi công cụ của assistant thiếu cả `input` lẫn `arguments` sẽ bị bỏ
trước khi ngữ cảnh mô hình được xây dựng. Điều này ngăn nhà cung cấp từ chối do các
lệnh gọi công cụ được lưu một phần (ví dụ, sau lỗi giới hạn tốc độ).

Triển khai:

- `sanitizeToolCallInputs` trong `src/agents/session-transcript-repair.ts`
- Được áp dụng trong `sanitizeSessionHistory` trong `src/agents/pi-embedded-runner/replay-history.ts`

---

## Quy tắc toàn cục: nguồn gốc đầu vào giữa các phiên

Khi một agent gửi prompt vào phiên khác qua `sessions_send` (bao gồm
các bước phản hồi/thông báo giữa agent với agent), OpenClaw lưu lượt người dùng đã tạo với:

- `message.provenance.kind = "inter_session"`

OpenClaw cũng thêm trước văn bản prompt được định tuyến một marker cùng lượt `[Inter-session message ... isUser=false]`
để lệnh gọi mô hình đang hoạt động có thể phân biệt
đầu ra từ phiên bên ngoài với chỉ dẫn của người dùng cuối bên ngoài. Marker này bao gồm
phiên nguồn, kênh, và công cụ khi có. Transcript vẫn dùng
`role: "user"` để tương thích với nhà cung cấp, nhưng cả văn bản hiển thị và siêu dữ liệu
nguồn gốc đều đánh dấu lượt này là dữ liệu giữa các phiên.

Trong quá trình xây dựng lại ngữ cảnh, OpenClaw áp dụng cùng marker đó cho các lượt người dùng
giữa các phiên đã lưu cũ hơn chỉ có siêu dữ liệu nguồn gốc.

---

## Ma trận nhà cung cấp (hành vi hiện tại)

**OpenAI / OpenAI Codex**

- Chỉ làm sạch hình ảnh.
- Bỏ các chữ ký suy luận mồ côi (các mục suy luận độc lập không có khối nội dung theo sau) đối với transcript OpenAI Responses/Codex, và bỏ suy luận OpenAI có thể phát lại sau khi đổi tuyến mô hình.
- Giữ nguyên các payload mục suy luận OpenAI Responses có thể phát lại, bao gồm các mục tóm tắt rỗng đã mã hóa, để phát lại thủ công/WebSocket vẫn giữ trạng thái `rs_*` bắt buộc được ghép với các mục đầu ra assistant.
- Native ChatGPT Codex Responses tuân theo tính tương đồng giao thức Codex bằng cách phát lại các payload suy luận/thông điệp/hàm Responses trước đó mà không có id mục trước đó, đồng thời giữ nguyên `prompt_cache_key` của phiên.
- Không làm sạch id lệnh gọi công cụ.
- Sửa ghép cặp kết quả công cụ có thể di chuyển các đầu ra thật đã khớp và tổng hợp các đầu ra `aborted` kiểu Codex cho các lệnh gọi công cụ bị thiếu.
- Không xác thực hoặc sắp xếp lại lượt.
- Các đầu ra công cụ bị thiếu thuộc họ OpenAI Responses được tổng hợp thành `aborted` để khớp với chuẩn hóa phát lại Codex.
- Không loại bỏ chữ ký suy nghĩ.

**OpenAI-compatible Chat Completions**

- Các khối thinking/reasoning assistant trong lịch sử bị loại bỏ trước khi phát lại để
  máy chủ cục bộ và máy chủ tương thích OpenAI kiểu proxy không nhận các trường suy luận
  của lượt trước như `reasoning` hoặc `reasoning_content`.
- Các phần tiếp nối lệnh gọi công cụ trong cùng lượt hiện tại giữ khối suy luận assistant
  gắn với lệnh gọi công cụ cho đến khi kết quả công cụ đã được phát lại.
- Các ngoại lệ do nhà cung cấp sở hữu có thể chọn không áp dụng khi giao thức truyền của họ yêu cầu
  siêu dữ liệu suy luận được phát lại.

**Google (Generative AI / Gemini CLI / Antigravity)**

- Làm sạch id lệnh gọi công cụ: chữ và số nghiêm ngặt.
- Sửa ghép cặp kết quả công cụ và kết quả công cụ tổng hợp.
- Xác thực lượt (luân phiên lượt kiểu Gemini).
- Sửa thứ tự lượt Google (thêm một bootstrap người dùng rất nhỏ ở đầu nếu lịch sử bắt đầu bằng assistant).
- Antigravity Claude: chuẩn hóa chữ ký thinking; bỏ các khối thinking không có chữ ký.

**Anthropic / Minimax (tương thích Anthropic)**

- Sửa ghép cặp kết quả công cụ và kết quả công cụ tổng hợp.
- Xác thực lượt (gộp các lượt người dùng liên tiếp để đáp ứng luân phiên nghiêm ngặt).
- Các lượt prefill assistant ở cuối bị loại khỏi payload Anthropic Messages gửi đi
  khi thinking được bật, bao gồm các tuyến Cloudflare AI Gateway.
- Các khối thinking thiếu chữ ký phát lại, chữ ký rỗng, hoặc chữ ký chỉ có khoảng trắng bị loại bỏ
  trước khi chuyển đổi nhà cung cấp. Nếu điều đó làm rỗng một lượt assistant, OpenClaw giữ
  hình dạng lượt bằng văn bản omitted-reasoning không rỗng.
- Các lượt assistant cũ chỉ có thinking cần bị loại bỏ sẽ được thay bằng
  văn bản omitted-reasoning không rỗng để adapter nhà cung cấp không bỏ lượt
  phát lại.

**Amazon Bedrock (Converse API)**

- Các lượt lỗi luồng assistant rỗng được sửa thành một khối văn bản dự phòng không rỗng
  trước khi phát lại. Bedrock Converse từ chối thông điệp assistant có `content: []`, vì vậy
  các lượt assistant đã lưu có `stopReason: "error"` và nội dung rỗng cũng được
  sửa trên đĩa trước khi tải.
- Các lượt lỗi luồng assistant chỉ chứa khối văn bản trống bị bỏ
  khỏi bản sao phát lại trong bộ nhớ thay vì phát lại một khối trống không hợp lệ.
- Các khối thinking Claude thiếu chữ ký phát lại, chữ ký rỗng, hoặc chữ ký chỉ có khoảng trắng
  bị loại bỏ trước khi phát lại Converse. Nếu điều đó làm rỗng một lượt assistant, OpenClaw
  giữ hình dạng lượt bằng văn bản omitted-reasoning không rỗng.
- Các lượt assistant cũ chỉ có thinking cần bị loại bỏ sẽ được thay bằng
  văn bản omitted-reasoning không rỗng để phát lại Converse giữ hình dạng lượt nghiêm ngặt.
- Phát lại lọc các lượt assistant delivery-mirror của OpenClaw và các lượt assistant do Gateway chèn.
- Làm sạch hình ảnh được áp dụng qua quy tắc toàn cục.

**Mistral (bao gồm phát hiện dựa trên model-id)**

- Làm sạch id lệnh gọi công cụ: strict9 (chữ và số, độ dài 9).

**OpenRouter Gemini**

- Dọn dẹp chữ ký suy nghĩ: loại bỏ các giá trị `thought_signature` không phải base64 (giữ base64).

**OpenRouter Anthropic**

- Các lượt prefill assistant ở cuối bị loại khỏi payload mô hình Anthropic
  tương thích OpenAI của OpenRouter đã xác minh khi suy luận được bật, khớp với
  hành vi phát lại Anthropic trực tiếp và Cloudflare Anthropic.

**Mọi thứ khác**

- Chỉ làm sạch hình ảnh.

---

## Hành vi lịch sử (trước 2026.1.22)

Trước bản phát hành 2026.1.22, OpenClaw áp dụng nhiều lớp vệ sinh transcript:

- Một **transcript-sanitize extension** chạy trên mọi lần xây dựng ngữ cảnh và có thể:
  - Sửa ghép cặp sử dụng/kết quả công cụ.
  - Làm sạch id lệnh gọi công cụ (bao gồm một chế độ không nghiêm ngặt giữ lại `_`/`-`).
- Runner cũng thực hiện làm sạch dành riêng cho nhà cung cấp, gây trùng lặp công việc.
- Các đột biến bổ sung xảy ra bên ngoài chính sách nhà cung cấp, bao gồm:
  - Loại bỏ thẻ `<final>` khỏi văn bản assistant trước khi lưu bền vững.
  - Bỏ các lượt lỗi assistant rỗng.
  - Cắt bớt nội dung assistant sau các lệnh gọi công cụ.

Độ phức tạp này gây ra hồi quy chéo nhà cung cấp (đáng chú ý là ghép cặp `call_id|fc_id`
của `openai-responses`). Lần dọn dẹp 2026.1.22 đã loại bỏ extension, tập trung hóa
logic trong runner, và biến OpenAI thành **không đụng chạm** ngoài làm sạch hình ảnh.

## Liên quan

- [Quản lý phiên](/vi/concepts/session)
- [Cắt tỉa phiên](/vi/concepts/session-pruning)
