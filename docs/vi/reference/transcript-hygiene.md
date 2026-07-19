---
read_when:
    - Bạn đang gỡ lỗi các yêu cầu bị nhà cung cấp từ chối do cấu trúc bản ghi hội thoại
    - Bạn đang thay đổi logic làm sạch bản ghi hội thoại hoặc sửa chữa lệnh gọi công cụ
    - Bạn đang điều tra tình trạng mã định danh lệnh gọi công cụ không khớp giữa các nhà cung cấp
summary: 'Tham khảo: các quy tắc làm sạch và sửa chữa bản ghi hội thoại dành riêng cho từng nhà cung cấp'
title: Vệ sinh bản ghi hội thoại
x-i18n:
    generated_at: "2026-07-19T05:57:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 7b64deba757d0eb3fd2cd177b6b16f4e071abbf8965a05ac087dddf086fdc920
    source_path: reference/transcript-hygiene.md
    workflow: 16
---

OpenClaw áp dụng **các bản sửa lỗi dành riêng cho từng nhà cung cấp** cho bản ghi trước một lượt chạy
(khi xây dựng ngữ cảnh mô hình). Hầu hết các điều chỉnh này được thực hiện **trong bộ nhớ** để
đáp ứng các yêu cầu nghiêm ngặt của nhà cung cấp. Một lượt sửa chữa tệp phiên riêng biệt cũng có thể
ghi lại JSONL đã lưu trước khi phiên được tải, nhưng chỉ đối với
các dòng sai định dạng hoặc các lượt đã lưu không hợp lệ dưới dạng bản ghi bền vững.
Các phản hồi của trợ lý đã được gửi vẫn được giữ nguyên trên đĩa; việc loại bỏ phần điền trước của
trợ lý dành riêng cho nhà cung cấp chỉ diễn ra khi xây dựng
payload gửi đi.

Khi có sửa chữa, tệp gốc được ghi vào một tệp ngang hàng tạm thời
`*.bak-<pid>-<ts>` trước khi thay thế nguyên tử, rồi bị xóa sau khi
thay thế thành công. Bản sao lưu chỉ được giữ lại nếu chính quá trình dọn dẹp thất bại; trong
trường hợp đó, đường dẫn được báo lại.

Phạm vi bao gồm:

- Ngữ cảnh lời nhắc chỉ dành cho thời gian chạy không xuất hiện trong các lượt bản ghi mà người dùng nhìn thấy
- Làm sạch id lệnh gọi công cụ
- Xác thực đầu vào lệnh gọi công cụ
- Sửa chữa ghép cặp kết quả công cụ
- Xác thực / sắp xếp thứ tự lượt
- Dọn dẹp chữ ký suy nghĩ
- Dọn dẹp chữ ký tư duy
- Làm sạch payload hình ảnh
- Dọn dẹp khối văn bản trống trước khi phát lại cho nhà cung cấp
- Dọn dẹp lượt chưa hoàn chỉnh chỉ có suy luận do giới hạn độ dài trước khi phát lại cho nhà cung cấp
- Gắn thẻ nguồn gốc đầu vào của người dùng (cho lời nhắc được định tuyến giữa các phiên)
- Sửa chữa lượt lỗi trợ lý trống để phát lại Bedrock Converse

Nếu cần thông tin chi tiết về lưu trữ bản ghi, hãy xem
[Phân tích chuyên sâu về quản lý phiên](/vi/reference/session-management-compaction).

---

## Quy tắc toàn cục: ngữ cảnh thời gian chạy không phải là bản ghi người dùng

Ngữ cảnh thời gian chạy/hệ thống có thể được thêm vào lời nhắc mô hình cho một lượt, nhưng đó
không phải là nội dung do người dùng cuối soạn. OpenClaw duy trì riêng một
phần thân lời nhắc dành cho bản ghi đối với phản hồi Gateway, các lượt theo sau trong hàng đợi, ACP, CLI và các
lượt chạy OpenClaw nhúng. Các lượt người dùng hiển thị được lưu trữ sử dụng phần thân bản ghi đó thay vì
lời nhắc đã được bổ sung ngữ cảnh thời gian chạy.

Đối với các phiên cũ đã lưu các trình bao bọc thời gian chạy, các bề mặt lịch sử Gateway
áp dụng phép chiếu hiển thị trước khi trả thông báo cho các máy khách WebChat,
TUI, REST hoặc SSE.

---

## Nơi quy trình này chạy

Toàn bộ hoạt động vệ sinh bản ghi được tập trung trong trình chạy nhúng:

- Lựa chọn chính sách: `src/agents/transcript-policy.ts`
  (`resolveTranscriptPolicy`, được xác định theo `provider`, `modelApi` và `modelId`)
- Áp dụng làm sạch/sửa chữa: `sanitizeSessionHistory` trong
  `src/agents/embedded-agent-runner/replay-history.ts`

Tách biệt với việc vệ sinh bản ghi, các tệp phiên được sửa chữa (nếu cần)
trước khi tải:

- `repairSessionFileIfNeeded` trong `src/agents/session-file-repair.ts`
- Được gọi từ `src/agents/embedded-agent-runner/run/attempt.ts` và
  `src/agents/embedded-agent-runner/compact.ts`

---

## Quy tắc toàn cục: làm sạch hình ảnh

Payload hình ảnh luôn được làm sạch để ngăn nhà cung cấp từ chối do
giới hạn kích thước (giảm kích thước/nén lại các hình ảnh base64 quá lớn). Điều này cũng giúp
kiểm soát áp lực token do hình ảnh gây ra đối với các mô hình có khả năng thị giác: kích thước tối đa
nhỏ hơn giúp giảm mức sử dụng token, còn kích thước lớn hơn giúp bảo toàn chi tiết.

Triển khai:

- `sanitizeSessionMessagesImages` trong
  `src/agents/embedded-agent-helpers/images.ts`
- `sanitizeContentBlocksImages` trong `src/agents/tool-images.ts`
- Cạnh tối đa của hình ảnh có thể cấu hình qua `agents.defaults.imageMaxDimensionPx`
  (mặc định: `1200`)
- Các khối văn bản trống bị xóa khi lượt xử lý này duyệt qua nội dung phát lại.
  Các lượt trợ lý trở thành trống sẽ bị loại khỏi bản sao phát lại; các lượt người dùng
  và kết quả công cụ trở thành trống sẽ nhận một phần giữ chỗ
  nội dung-bị-lược-bỏ không trống.

---

## Quy tắc toàn cục: lệnh gọi công cụ sai định dạng

Các khối lệnh gọi công cụ của trợ lý thiếu cả `input` và `arguments` sẽ bị loại bỏ
trước khi ngữ cảnh mô hình được xây dựng. Điều này ngăn nhà cung cấp từ chối
các lệnh gọi công cụ chỉ được lưu một phần (ví dụ: sau khi gặp lỗi giới hạn tốc độ).

Triển khai:

- `sanitizeToolCallInputs` trong `src/agents/session-transcript-repair.ts`
- Được áp dụng trong `sanitizeSessionHistory`
  (`src/agents/embedded-agent-runner/replay-history.ts`)

---

## Quy tắc toàn cục: ghép cặp kết quả công cụ

Kết quả công cụ được ghép với từng lần xuất hiện của lệnh gọi công cụ trong mỗi lượt trợ lý trước khi
các ID lệnh gọi dành riêng cho nhà cung cấp được ghi lại. ID do nhà cung cấp tạo có thể lặp lại ở các
lượt sau, vì vậy một kết quả nằm liền kề lệnh gọi lặp lại sẽ vẫn thuộc về lần xuất hiện đó. Một kết quả
bị lệch vị trí chỉ được di chuyển khi chính xác một lần xuất hiện chưa được giải quyết có thể sở hữu nó; các
kết quả thừa không rõ ràng bị loại bỏ và các lần xuất hiện bị thiếu sẽ nhận kết quả lỗi tổng hợp.

Triển khai: `sanitizeToolUseResultPairing` trong
`src/agents/session-transcript-repair.ts`

---

## Quy tắc toàn cục: các lượt chưa hoàn chỉnh chỉ có suy luận

Các lượt trợ lý chạm giới hạn đầu ra của nhà cung cấp mà chỉ có nội dung tư duy hoặc
tư duy đã biên tập sẽ bị loại khỏi bản sao phát lại trong bộ nhớ. Những
lượt này chứa trạng thái nhà cung cấp chưa hoàn chỉnh và có thể mang một phần chữ ký
tư duy.

Các lượt giới hạn độ dài trống vẫn không thay đổi, cũng như các lượt giới hạn độ dài có văn bản hiển thị,
lệnh gọi công cụ hoặc khối nội dung không xác định. Bản ghi đã lưu không bị ghi lại.

Triển khai: `normalizeAssistantReplayContent` trong
`src/agents/embedded-agent-runner/replay-history.ts`

---

## Quy tắc toàn cục: nguồn gốc đầu vào giữa các phiên

Khi một tác tử gửi lời nhắc vào một phiên khác qua `sessions_send`
(bao gồm các bước phản hồi/thông báo giữa các tác tử), OpenClaw lưu
lượt người dùng được tạo với `message.provenance.kind = "inter_session"`.

OpenClaw cũng thêm vào trước một dấu hiệu cùng lượt `[Inter-session message] ... isUser=false`
trước văn bản lời nhắc được định tuyến để lệnh gọi mô hình đang hoạt động có thể
phân biệt đầu ra từ phiên khác với chỉ dẫn bên ngoài của người dùng cuối. Dấu hiệu này
bao gồm phiên nguồn, kênh và công cụ khi có. Bản ghi vẫn sử dụng
`role: "user"` để tương thích với nhà cung cấp, nhưng cả văn bản hiển thị và siêu dữ liệu nguồn gốc
đều đánh dấu lượt này là dữ liệu giữa các phiên.

Trong quá trình xây dựng lại ngữ cảnh, OpenClaw áp dụng cùng dấu hiệu cho các lượt người dùng
giữa các phiên cũ đã lưu mà chỉ có siêu dữ liệu nguồn gốc.

---

## Ma trận nhà cung cấp (hành vi hiện tại)

**OpenAI / OpenAI Codex**

- Chỉ làm sạch hình ảnh.
- Loại bỏ các chữ ký suy luận mồ côi (các mục suy luận độc lập không có
  khối nội dung theo sau) khỏi bản ghi OpenAI Responses/Codex, đồng thời loại bỏ
  suy luận OpenAI có thể phát lại sau khi chuyển tuyến mô hình.
- Bảo toàn payload mục suy luận OpenAI Responses có thể phát lại, bao gồm
  các mục bản tóm tắt trống được mã hóa, để việc phát lại thủ công/WebSocket duy trì
  trạng thái `rs_*` bắt buộc được ghép với các mục đầu ra của trợ lý.
- ChatGPT Codex Responses gốc tuân theo tính tương đồng trên dây của Codex bằng cách phát lại
  các payload suy luận/thông báo/hàm Responses trước đó mà không có ID mục
  trước đó, đồng thời bảo toàn `prompt_cache_key` của phiên.
- Việc phát lại thuộc họ OpenAI Responses bảo toàn các cặp suy luận cùng mô hình
  `call_*|fc_*` chuẩn, nhưng chuẩn hóa một cách xác định các id mục
  `call_id`/lệnh gọi hàm sai định dạng hoặc quá dài trước khi chuyển đổi payload pi-ai.
- Sửa chữa ghép cặp kết quả công cụ có thể di chuyển các đầu ra thực đã khớp và tổng hợp
  đầu ra `aborted` kiểu Codex cho các lệnh gọi công cụ bị thiếu.
- Không xác thực hoặc sắp xếp lại lượt; không loại bỏ chữ ký suy nghĩ.

**Chat Completions tương thích OpenAI**

- Các khối tư duy/suy luận trước đây của trợ lý bị loại bỏ trước khi phát lại
  để các máy chủ tương thích OpenAI cục bộ và kiểu proxy không nhận được
  các trường suy luận từ lượt trước như `reasoning` hoặc `reasoning_content`.
- Các lượt tiếp nối lệnh gọi công cụ trong cùng lượt hiện tại giữ khối suy luận của trợ lý
  gắn với lệnh gọi công cụ cho đến khi kết quả công cụ được phát lại.
- Các mục mô hình tùy chỉnh/tự lưu trữ có `reasoning: true` bảo toàn
  siêu dữ liệu suy luận được phát lại.
- Các ngoại lệ do nhà cung cấp sở hữu có thể chọn không áp dụng khi giao thức trên dây của họ yêu cầu
  siêu dữ liệu suy luận được phát lại.

**Google (Generative AI / Gemini CLI / Antigravity)**

- Làm sạch id lệnh gọi công cụ: chỉ chữ và số nghiêm ngặt.
- Sửa chữa ghép cặp kết quả công cụ và tổng hợp kết quả công cụ.
- Xác thực lượt (luân phiên lượt kiểu Gemini).
- Sửa thứ tự lượt của Google (thêm vào trước một lượt khởi động người dùng nhỏ nếu lịch sử
  bắt đầu bằng trợ lý).
- Antigravity Claude: chuẩn hóa chữ ký tư duy; loại bỏ các khối tư duy
  không có chữ ký.

**Anthropic / Minimax (tương thích Anthropic)**

- Sửa chữa ghép cặp kết quả công cụ và tổng hợp kết quả công cụ.
- Xác thực lượt (hợp nhất các lượt người dùng liên tiếp để đáp ứng yêu cầu
  luân phiên nghiêm ngặt).
- Các lượt điền trước cuối của trợ lý bị loại khỏi payload Anthropic
  Messages gửi đi khi tư duy được bật, bao gồm các tuyến Cloudflare AI
  Gateway.
- Các chữ ký tư duy của trợ lý trước Compaction bị loại bỏ trước khi phát lại cho nhà cung cấp
  khi một phiên đã được Compaction. Các chữ ký tư duy được
  ràng buộc bằng mật mã với tiền tố hội thoại tại thời điểm tạo;
  sau Compaction, tiền tố thay đổi (nội dung tóm tắt thay thế
  nội dung gốc), vì vậy việc phát lại chữ ký gốc khiến Anthropic
  từ chối yêu cầu với "Chữ ký không hợp lệ trong khối tư duy". Văn bản
  tư duy được bảo toàn dưới dạng khối không có chữ ký rồi được xử lý theo
  quy tắc bên dưới.
- Các khối tư duy có chữ ký phát lại bị thiếu, trống hoặc chỉ chứa khoảng trắng sẽ
  bị loại bỏ trước khi chuyển đổi cho nhà cung cấp. Nếu điều đó làm trống một lượt trợ lý,
  OpenClaw giữ nguyên hình dạng lượt bằng văn bản suy-luận-bị-lược-bỏ không trống.
- Các lượt trợ lý cũ chỉ có tư duy cần bị loại bỏ sẽ được thay thế
  bằng văn bản suy-luận-bị-lược-bỏ không trống để các bộ điều hợp nhà cung cấp không loại bỏ
  lượt phát lại.

**Amazon Bedrock (Converse API)**

- Các lượt lỗi luồng trợ lý trống được sửa thành một khối văn bản dự phòng
  không trống trước khi phát lại. Bedrock Converse từ chối thông báo trợ lý
  có `content: []`, vì vậy các lượt trợ lý đã lưu có `stopReason:
"error"` và nội dung trống cũng được sửa trên đĩa trước khi tải.
- Các lượt lỗi luồng trợ lý chỉ có các khối văn bản trống bị loại khỏi
  bản sao phát lại trong bộ nhớ thay vì phát lại một khối trống không hợp lệ.
- Các chữ ký tư duy của trợ lý trước Compaction bị loại bỏ trước khi phát lại Converse
  khi một phiên đã được Compaction, vì cùng lý do như
  Anthropic ở trên.
- Các khối tư duy Claude có chữ ký phát lại bị thiếu, trống hoặc chỉ chứa khoảng trắng
  bị loại bỏ trước khi phát lại Converse. Nếu điều đó làm trống một lượt trợ lý,
  OpenClaw giữ nguyên hình dạng lượt bằng văn bản suy-luận-bị-lược-bỏ không trống.
- Các lượt trợ lý cũ chỉ có tư duy cần bị loại bỏ sẽ được thay thế
  bằng văn bản suy-luận-bị-lược-bỏ không trống để quá trình phát lại Converse giữ
  hình dạng lượt nghiêm ngặt.
- Quá trình phát lại lọc các lượt trợ lý phản chiếu-gửi và do Gateway chèn của OpenClaw.
- Việc làm sạch hình ảnh được áp dụng theo quy tắc toàn cục.

**Mistral (bao gồm phát hiện dựa trên model-id)**

- Làm sạch id lệnh gọi công cụ: strict9 (chữ và số, độ dài 9).

**OpenRouter Gemini**

- Dọn dẹp chữ ký suy nghĩ: loại bỏ các giá trị `thought_signature` không phải base64
  (giữ lại base64).

**OpenRouter Anthropic**

- Các lượt điền trước cuối của trợ lý bị loại khỏi payload mô hình Anthropic
  tương thích OpenAI đã xác minh của OpenRouter khi suy luận được bật,
  khớp với hành vi phát lại trực tiếp của Anthropic và Cloudflare Anthropic.

**Tất cả trường hợp khác**

- Chỉ làm sạch hình ảnh.

---

## Hành vi trước đây (trước 2026.1.22)

Trước bản phát hành 2026.1.22, OpenClaw áp dụng nhiều lớp vệ sinh
bản ghi:

- Một **tiện ích transcript-sanitize** chạy trong mỗi lần dựng ngữ cảnh và có thể:
  - Sửa việc ghép cặp giữa lần sử dụng công cụ và kết quả.
  - Làm sạch id lệnh gọi công cụ (bao gồm chế độ không nghiêm ngặt giữ nguyên
    `_`/`-`).
- Trình chạy cũng thực hiện việc làm sạch dành riêng cho từng nhà cung cấp, dẫn đến
  xử lý trùng lặp.
- Các thay đổi bổ sung diễn ra ngoài chính sách của nhà cung cấp, bao gồm
  loại bỏ thẻ `<final>` khỏi văn bản của trợ lý trước khi lưu trữ, loại bỏ
  các lượt lỗi trống của trợ lý và cắt bớt nội dung của trợ lý sau các lệnh gọi
  công cụ.

Sự phức tạp này gây ra các lỗi hồi quy giữa những nhà cung cấp (đáng chú ý là
việc ghép cặp `openai-responses` `call_id|fc_id`). Đợt dọn dẹp 2026.1.22 đã loại bỏ
tiện ích này, tập trung hóa logic trong trình chạy và đặt OpenAI ở chế độ **không can thiệp**
ngoài việc làm sạch hình ảnh.

## Liên quan

- [Quản lý phiên](/vi/concepts/session)
- [Cắt tỉa phiên](/vi/concepts/session-pruning)
