---
read_when:
    - Bạn muốn một agent đặt cho người dùng một câu hỏi có cấu trúc
    - Bạn đang trả lời hoặc gỡ lỗi một lời nhắc ask_user
    - Bạn cần lược đồ ask_user, thời gian chờ hoặc hành vi của kênh
summary: Cách ask_user tạm dừng một lượt của agent để chờ quyết định có cấu trúc từ con người
title: Hỏi người dùng
x-i18n:
    generated_at: "2026-07-20T04:33:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 32556314a34c26054c3aabfdd8ecc474cf85196e5cc71adb833face596edbd24
    source_path: tools/ask-user.md
    workflow: 16
---

`ask_user` cho phép tác nhân đặt từ một đến ba câu hỏi có cấu trúc cho người dùng và
chờ câu trả lời. Công cụ này dành cho những quyết định thực sự thuộc về người dùng,
không phải việc xác nhận thông thường hoặc thông tin mà tác nhân có thể suy ra từ yêu cầu,
mã nguồn hay một giá trị mặc định hợp lý.

Công cụ này chỉ khả dụng trong phiên chính. Các tác nhân phụ và những lượt chạy không phải chính
không được cung cấp công cụ này.

## Trả lời câu hỏi

Bạn có thể trả lời từ bất kỳ giao diện hội thoại nào được hỗ trợ:

- Control UI trên web neo một bảng câu hỏi ngay phía trên vùng soạn thảo. Với
  lời nhắc có nhiều câu hỏi, bảng này hiển thị từng câu hỏi một và chuyển tiếp
  qua một trình chỉ báo bước ngắn. Sau khi hoàn tất, bảng đóng lại và cuộc trò chuyện
  chỉ giữ lại bản tóm tắt câu trả lời nhỏ gọn.
- Telegram, Discord và Slack hiển thị các nút gốc cho lời nhắc
  gồm một câu hỏi, chọn một phương án.
- Câu trả lời bằng văn bản thuần túy hoạt động trên mọi kênh. Hãy trả lời bằng một số, nhãn phương án
  hoặc câu trả lời của riêng bạn.

OpenClaw luôn bật câu trả lời **Khác** dạng văn bản tự do. Tác nhân không được thêm phương án
`Other` vào danh sách phương án đã soạn.

## Hành vi trên nền tảng

Câu trả lời hoạt động trên mọi giao diện hội thoại được hỗ trợ. Control UI trên web sử dụng
một trình chỉ báo bước được neo, thay thế vùng soạn thảo khi mở rộng; khi thu gọn, vùng soạn thảo
đầy đủ được khôi phục bên dưới một thanh câu hỏi mảnh. iOS, macOS và Android hiển thị
các thẻ nội tuyến; nhiều câu hỏi vẫn được xếp chồng như một kiểu tương tác chủ ý,
thân thiện với thao tác chạm. Mọi nền tảng đều giữ bản tóm tắt từ câu hỏi đến câu trả lời trong dòng thời gian
trò chuyện đang hoạt động mà không tự động loại bỏ theo thời gian, và **Bỏ qua** khả dụng ở mọi nơi.

Các lời nhắc không thể sử dụng nút gốc, bao gồm lời nhắc nhiều câu hỏi và
chọn nhiều phương án, sẽ chuyển thành văn bản dễ đọc trên các kênh. Control UI
giữ nguyên trình chỉ báo bước có cấu trúc đầy đủ.

## Hết thời gian và không có câu trả lời

Thời gian chờ mặc định là 900 giây. `timeoutSeconds` được giới hạn trong khoảng
từ 30 đến 3600 giây.

Nếu câu hỏi hết hạn hoặc bị hủy trước khi có câu trả lời, công cụ
trả về `status: "no_answer"`. Sau đó, tác nhân tiếp tục theo phán đoán tốt nhất.
Một lượt chạy tác nhân bị hủy sẽ hủy câu hỏi Gateway đang chờ xử lý của lượt chạy đó.

## Lược đồ công cụ

```ts
{
  questions: Array<{
    id: string; // khóa câu trả lời snake_case duy nhất
    header: string; // nhãn ngắn; được cắt còn 12 ký tự
    question: string; // một câu
    options: Array<{
      label: string;
      description?: string;
    }>; // 2-4 phương án
    multiSelect?: boolean;
  }>; // 1-3 câu hỏi
  timeoutSeconds?: number; // số nguyên; mặc định 900, giới hạn trong khoảng 30-3600
}
```

Với `multiSelect: true`, người dùng có thể chọn nhiều phương án. Các giá trị
câu trả lời được trả về dưới dạng một mảng cho mỗi câu hỏi.

Ví dụ kết quả đã được trả lời:

```json
{
  "status": "answered",
  "answers": {
    "answers": {
      "deploy_target": ["Staging (Recommended)"]
    }
  }
}
```

## Hướng dẫn cho mô hình

Hợp đồng dành cho mô hình yêu cầu tác nhân:

- chỉ hỏi khi bị chặn bởi một quyết định thực sự thuộc về người dùng;
- ưu tiên một câu hỏi và không dùng quá ba câu;
- đặt phương án được đề xuất ở đầu và thêm `(Recommended)` vào cuối nhãn;
- bỏ qua phương án `Other` do tác nhân soạn vì văn bản tự do được thêm tự động;
- tiếp tục theo phán đoán tốt nhất sau `no_answer`.

Tác nhân không nên sử dụng `ask_user` để hỏi liệu có được phép tiếp tục hay để xác nhận
kế hoạch của chính mình.
