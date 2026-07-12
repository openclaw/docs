---
read_when:
    - Bạn đang gỡ lỗi các yêu cầu của nhà cung cấp bị từ chối do cấu trúc bản ghi hội thoại
    - Bạn đang thay đổi logic làm sạch bản chép lời hoặc sửa chữa lệnh gọi công cụ
    - Bạn đang điều tra sự không khớp ID lệnh gọi công cụ giữa các nhà cung cấp
summary: 'Tham khảo: các quy tắc làm sạch và sửa chữa bản ghi hội thoại dành riêng cho từng nhà cung cấp'
title: Vệ sinh bản ghi hội thoại
x-i18n:
    generated_at: "2026-07-12T08:22:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4c78d718106498e92c34e3ad6af452a340f230fa88fbf3da36a568e9814ec759
    source_path: reference/transcript-hygiene.md
    workflow: 16
---

OpenClaw áp dụng **các bản sửa lỗi riêng cho từng nhà cung cấp** đối với bản ghi hội thoại trước một lượt chạy
(khi xây dựng ngữ cảnh mô hình). Hầu hết đây là các điều chỉnh **trong bộ nhớ** dùng để
đáp ứng những yêu cầu nghiêm ngặt của nhà cung cấp. Một lượt sửa chữa tệp phiên riêng biệt
cũng có thể ghi lại JSONL đã lưu trước khi phiên được tải, nhưng chỉ đối với
các dòng sai định dạng hoặc các lượt đã lưu không phải là bản ghi bền vững hợp lệ.
Các phản hồi của trợ lý đã được gửi vẫn được giữ nguyên trên đĩa; việc loại bỏ
nội dung điền sẵn của trợ lý theo từng nhà cung cấp chỉ diễn ra khi xây dựng
payload gửi đi.

Khi có sửa chữa, tệp gốc được ghi vào một tệp cùng cấp tạm thời
`*.bak-<pid>-<ts>` trước khi thay thế nguyên tử, rồi bị xóa sau khi
thay thế thành công. Bản sao lưu chỉ được giữ lại nếu chính quá trình dọn dẹp thất bại,
trong trường hợp đó đường dẫn sẽ được báo lại.

Phạm vi bao gồm:

- Giữ ngữ cảnh lời nhắc chỉ dành cho thời gian chạy khỏi các lượt bản ghi hội thoại hiển thị cho người dùng
- Làm sạch mã định danh lệnh gọi công cụ
- Xác thực đầu vào lệnh gọi công cụ
- Sửa chữa việc ghép cặp kết quả công cụ
- Xác thực / sắp xếp lượt
- Dọn dẹp chữ ký suy nghĩ
- Dọn dẹp chữ ký tư duy
- Làm sạch payload hình ảnh
- Dọn dẹp khối văn bản trống trước khi phát lại cho nhà cung cấp
- Dọn dẹp các lượt chỉ có suy luận chưa hoàn tất do đạt giới hạn độ dài trước khi phát lại cho nhà cung cấp
- Gắn thẻ nguồn gốc đầu vào của người dùng (cho các lời nhắc được định tuyến giữa các phiên)
- Sửa chữa lượt lỗi trống của trợ lý khi phát lại Bedrock Converse

Nếu cần chi tiết về lưu trữ bản ghi hội thoại, hãy xem
[Phân tích chuyên sâu về quản lý phiên](/vi/reference/session-management-compaction).

---

## Quy tắc chung: ngữ cảnh thời gian chạy không phải là bản ghi hội thoại của người dùng

Ngữ cảnh thời gian chạy/hệ thống có thể được thêm vào lời nhắc mô hình cho một lượt, nhưng đó
không phải là nội dung do người dùng cuối soạn. OpenClaw duy trì một phần nội dung lời nhắc
riêng dành cho bản ghi hội thoại để dùng cho phản hồi của Gateway, các lượt theo sau trong hàng đợi, ACP, CLI và các lượt chạy
OpenClaw nhúng. Các lượt người dùng hiển thị được lưu sử dụng phần nội dung bản ghi hội thoại đó thay vì
lời nhắc đã được bổ sung ngữ cảnh thời gian chạy.

Đối với các phiên cũ đã lưu các lớp bọc thời gian chạy, các bề mặt lịch sử của Gateway
áp dụng phép chiếu hiển thị trước khi trả về thông báo cho các máy khách WebChat,
TUI, REST hoặc SSE.

---

## Nơi quy trình này chạy

Toàn bộ việc bảo đảm tính sạch của bản ghi hội thoại được tập trung trong trình chạy nhúng:

- Lựa chọn chính sách: `src/agents/transcript-policy.ts`
  (`resolveTranscriptPolicy`, được xác định theo `provider`, `modelApi` và `modelId`)
- Áp dụng làm sạch/sửa chữa: `sanitizeSessionHistory` trong
  `src/agents/embedded-agent-runner/replay-history.ts`

Tách biệt với việc bảo đảm tính sạch của bản ghi hội thoại, các tệp phiên được sửa chữa (nếu cần)
trước khi tải:

- `repairSessionFileIfNeeded` trong `src/agents/session-file-repair.ts`
- Được gọi từ `src/agents/embedded-agent-runner/run/attempt.ts` và
  `src/agents/embedded-agent-runner/compact.ts`

---

## Quy tắc chung: làm sạch hình ảnh

Payload hình ảnh luôn được làm sạch để ngăn nhà cung cấp từ chối do
giới hạn kích thước (giảm tỷ lệ/nén lại các hình ảnh base64 quá lớn). Việc này cũng giúp
kiểm soát áp lực token do hình ảnh gây ra đối với các mô hình có khả năng thị giác: kích thước tối đa
thấp hơn giúp giảm mức sử dụng token, còn kích thước cao hơn bảo toàn chi tiết.

Cách triển khai:

- `sanitizeSessionMessagesImages` trong
  `src/agents/embedded-agent-helpers/images.ts`
- `sanitizeContentBlocksImages` trong `src/agents/tool-images.ts`
- Cạnh tối đa của hình ảnh có thể được cấu hình qua `agents.defaults.imageMaxDimensionPx`
  (mặc định: `1200`)
- Các khối văn bản trống được xóa khi lượt xử lý này duyệt nội dung phát lại.
  Các lượt trợ lý trở thành trống sẽ bị loại khỏi bản sao phát lại; các lượt người dùng
  và kết quả công cụ trở thành trống sẽ nhận một phần giữ chỗ không trống
  cho nội dung bị lược bỏ.

---

## Quy tắc chung: lệnh gọi công cụ sai định dạng

Các khối lệnh gọi công cụ của trợ lý thiếu cả `input` lẫn `arguments` sẽ bị loại bỏ
trước khi xây dựng ngữ cảnh mô hình. Điều này ngăn nhà cung cấp từ chối
các lệnh gọi công cụ được lưu chưa đầy đủ (ví dụ sau khi gặp lỗi giới hạn tốc độ).

Cách triển khai:

- `sanitizeToolCallInputs` trong `src/agents/session-transcript-repair.ts`
- Được áp dụng trong `sanitizeSessionHistory`
  (`src/agents/embedded-agent-runner/replay-history.ts`)

---

## Quy tắc chung: các lượt chỉ có suy luận chưa hoàn tất

Các lượt trợ lý đạt giới hạn đầu ra của nhà cung cấp mà chỉ có nội dung tư duy hoặc
tư duy đã biên tập sẽ bị loại khỏi bản sao phát lại trong bộ nhớ. Những
lượt này chứa trạng thái nhà cung cấp chưa hoàn tất và có thể mang chữ ký tư duy
không đầy đủ.

Các lượt đạt giới hạn độ dài nhưng trống vẫn giữ nguyên, cũng như các lượt đạt giới hạn độ dài có văn bản hiển thị,
lệnh gọi công cụ hoặc khối nội dung không xác định. Các bản ghi hội thoại đã lưu không bị ghi lại.

Cách triển khai: `normalizeAssistantReplayContent` trong
`src/agents/embedded-agent-runner/replay-history.ts`

---

## Quy tắc chung: nguồn gốc đầu vào giữa các phiên

Khi một tác tử gửi lời nhắc vào một phiên khác qua `sessions_send`
(bao gồm các bước phản hồi/thông báo giữa các tác tử), OpenClaw lưu
lượt người dùng được tạo với `message.provenance.kind = "inter_session"`.

OpenClaw cũng thêm vào đầu cùng lượt một dấu mốc `[Inter-session message] ... isUser=false`
trước văn bản lời nhắc được định tuyến để lệnh gọi mô hình đang hoạt động có thể
phân biệt đầu ra từ phiên khác với chỉ dẫn của người dùng cuối bên ngoài. Dấu mốc này
bao gồm phiên nguồn, kênh và công cụ nếu có. Bản ghi hội thoại vẫn sử dụng
`role: "user"` để tương thích với nhà cung cấp, nhưng cả văn bản hiển thị lẫn siêu dữ liệu
nguồn gốc đều đánh dấu lượt này là dữ liệu giữa các phiên.

Trong khi xây dựng lại ngữ cảnh, OpenClaw áp dụng cùng dấu mốc cho các lượt người dùng
giữa các phiên cũ đã lưu nhưng chỉ có siêu dữ liệu nguồn gốc.

---

## Ma trận nhà cung cấp (hành vi hiện tại)

**OpenAI / OpenAI Codex**

- Chỉ làm sạch hình ảnh.
- Loại bỏ các chữ ký suy luận mồ côi (các mục suy luận độc lập không có
  khối nội dung theo sau) khỏi bản ghi hội thoại OpenAI Responses/Codex, đồng thời loại bỏ
  suy luận OpenAI có thể phát lại sau khi chuyển tuyến mô hình.
- Giữ nguyên payload của các mục suy luận OpenAI Responses có thể phát lại, bao gồm
  các mục tóm tắt trống đã mã hóa, để việc phát lại thủ công/WebSocket giữ trạng thái
  `rs_*` bắt buộc được ghép cặp với các mục đầu ra của trợ lý.
- ChatGPT Codex Responses gốc tuân theo tính tương đương giao thức của Codex bằng cách phát lại
  các payload suy luận/thông báo/hàm Responses trước đó mà không có mã định danh mục trước đó,
  đồng thời giữ nguyên `prompt_cache_key` của phiên.
- Việc phát lại thuộc họ OpenAI Responses giữ nguyên các cặp suy luận cùng mô hình
  `call_*|fc_*` chuẩn, nhưng chuẩn hóa một cách xác định các `call_id`/mã định danh mục lệnh gọi hàm
  sai định dạng hoặc quá dài trước khi chuyển đổi payload pi-ai.
- Sửa chữa ghép cặp kết quả công cụ có thể di chuyển các đầu ra thực sự khớp và tổng hợp
  các đầu ra `aborted` theo kiểu Codex cho các lệnh gọi công cụ bị thiếu.
- Không xác thực hoặc sắp xếp lại lượt; không loại bỏ chữ ký suy nghĩ.

**Chat Completions tương thích với OpenAI**

- Các khối tư duy/suy luận lịch sử của trợ lý bị loại bỏ trước khi phát lại
  để các máy chủ cục bộ và máy chủ qua proxy tương thích với OpenAI không nhận
  các trường suy luận của lượt trước như `reasoning` hoặc `reasoning_content`.
- Các lượt tiếp tục lệnh gọi công cụ trong cùng lượt hiện tại giữ khối suy luận của trợ lý
  gắn với lệnh gọi công cụ cho đến khi kết quả công cụ được phát lại.
- Các mục mô hình tùy chỉnh/tự lưu trữ có `reasoning: true` giữ nguyên
  siêu dữ liệu suy luận được phát lại.
- Các ngoại lệ do nhà cung cấp sở hữu có thể chọn không áp dụng khi giao thức truyền tải của họ yêu cầu
  siêu dữ liệu suy luận được phát lại.

**Google (Generative AI / Gemini CLI / Antigravity)**

- Làm sạch mã định danh lệnh gọi công cụ: chỉ cho phép chữ và số nghiêm ngặt.
- Sửa chữa ghép cặp kết quả công cụ và tạo kết quả công cụ tổng hợp.
- Xác thực lượt (luân phiên lượt theo kiểu Gemini).
- Sửa thứ tự lượt của Google (thêm trước một lượt khởi động người dùng nhỏ nếu lịch sử
  bắt đầu bằng trợ lý).
- Antigravity Claude: chuẩn hóa chữ ký tư duy; loại bỏ các khối tư duy
  không có chữ ký.

**Anthropic / Minimax (tương thích với Anthropic)**

- Sửa chữa ghép cặp kết quả công cụ và tạo kết quả công cụ tổng hợp.
- Xác thực lượt (hợp nhất các lượt người dùng liên tiếp để đáp ứng yêu cầu
  luân phiên nghiêm ngặt).
- Các lượt điền sẵn của trợ lý ở cuối bị loại khỏi payload Anthropic
  Messages gửi đi khi tư duy được bật, bao gồm các tuyến Cloudflare AI
  Gateway.
- Các chữ ký tư duy của trợ lý trước Compaction bị loại bỏ trước khi phát lại cho nhà cung cấp
  khi một phiên đã được Compaction. Chữ ký tư duy được
  ràng buộc bằng mật mã với tiền tố hội thoại tại thời điểm tạo;
  sau Compaction, tiền tố thay đổi (nội dung tóm tắt thay thế
  nội dung gốc), vì vậy việc phát lại các chữ ký gốc khiến Anthropic
  từ chối yêu cầu với thông báo "Invalid signature in thinking block". Văn bản
  tư duy được giữ nguyên dưới dạng khối không có chữ ký rồi được xử lý theo
  quy tắc bên dưới.
- Các khối tư duy có chữ ký phát lại bị thiếu, trống hoặc chỉ chứa khoảng trắng sẽ bị
  loại bỏ trước khi chuyển đổi cho nhà cung cấp. Nếu việc đó làm trống một lượt trợ lý,
  OpenClaw giữ nguyên hình dạng lượt bằng văn bản suy luận bị lược bỏ nhưng không trống.
- Các lượt trợ lý cũ chỉ có tư duy và bắt buộc phải loại bỏ được thay thế
  bằng văn bản suy luận bị lược bỏ nhưng không trống để bộ điều hợp nhà cung cấp không loại bỏ
  lượt phát lại.

**Amazon Bedrock (Converse API)**

- Các lượt lỗi luồng trống của trợ lý được sửa thành một khối văn bản dự phòng không trống
  trước khi phát lại. Bedrock Converse từ chối thông báo trợ lý
  có `content: []`, vì vậy các lượt trợ lý đã lưu với `stopReason:
"error"` và nội dung trống cũng được sửa trên đĩa trước khi tải.
- Các lượt lỗi luồng của trợ lý chỉ có khối văn bản trống bị loại khỏi
  bản sao phát lại trong bộ nhớ thay vì phát lại một khối trống không hợp lệ.
- Các chữ ký tư duy của trợ lý trước Compaction bị loại bỏ trước khi phát lại Converse
  khi một phiên đã được Compaction, vì cùng lý do như
  Anthropic ở trên.
- Các khối tư duy Claude có chữ ký phát lại bị thiếu, trống hoặc chỉ chứa khoảng trắng
  sẽ bị loại bỏ trước khi phát lại Converse. Nếu việc đó làm trống một lượt trợ lý,
  OpenClaw giữ nguyên hình dạng lượt bằng văn bản suy luận bị lược bỏ nhưng không trống.
- Các lượt trợ lý cũ chỉ có tư duy và bắt buộc phải loại bỏ được thay thế
  bằng văn bản suy luận bị lược bỏ nhưng không trống để quá trình phát lại Converse giữ
  hình dạng lượt nghiêm ngặt.
- Quá trình phát lại lọc các lượt trợ lý phản chiếu việc gửi và các lượt do Gateway chèn của OpenClaw.
- Việc làm sạch hình ảnh áp dụng theo quy tắc chung.

**Mistral (bao gồm phát hiện dựa trên mã định danh mô hình)**

- Làm sạch mã định danh lệnh gọi công cụ: strict9 (chữ và số, độ dài 9).

**OpenRouter Gemini**

- Dọn dẹp chữ ký suy nghĩ: loại bỏ các giá trị `thought_signature` không phải base64
  (giữ lại base64).

**OpenRouter Anthropic**

- Các lượt điền sẵn của trợ lý ở cuối bị loại khỏi payload của mô hình Anthropic
  tương thích với OpenAI đã xác minh trên OpenRouter khi suy luận được bật,
  khớp với hành vi phát lại trực tiếp của Anthropic và Cloudflare Anthropic.

**Tất cả trường hợp khác**

- Chỉ làm sạch hình ảnh.

---

## Hành vi lịch sử (trước phiên bản 2026.1.22)

Trước bản phát hành 2026.1.22, OpenClaw áp dụng nhiều lớp bảo đảm tính sạch của bản ghi
hội thoại:

- Một **tiện ích mở rộng làm sạch bản ghi hội thoại** chạy mỗi khi xây dựng ngữ cảnh và có thể:
  - Sửa chữa việc ghép cặp sử dụng công cụ/kết quả.
  - Làm sạch mã định danh lệnh gọi công cụ (bao gồm chế độ không nghiêm ngặt giữ nguyên
    `_`/`-`).
- Trình chạy cũng thực hiện làm sạch theo từng nhà cung cấp, gây
  trùng lặp công việc.
- Các thay đổi bổ sung diễn ra bên ngoài chính sách nhà cung cấp, bao gồm
  loại bỏ thẻ `<final>` khỏi văn bản trợ lý trước khi lưu, loại bỏ
  các lượt lỗi trống của trợ lý và cắt bớt nội dung trợ lý sau các lệnh gọi
  công cụ.

Sự phức tạp này gây ra lỗi hồi quy giữa các nhà cung cấp (đáng chú ý là việc ghép cặp
`call_id|fc_id` của `openai-responses`). Đợt dọn dẹp 2026.1.22 đã loại bỏ
tiện ích mở rộng, tập trung logic vào trình chạy và đặt OpenAI ở chế độ **không can thiệp**
ngoài việc làm sạch hình ảnh.

## Liên quan

- [Quản lý phiên](/vi/concepts/session)
- [Cắt tỉa phiên](/vi/concepts/session-pruning)
