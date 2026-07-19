---
read_when:
    - Bạn muốn một tác nhân đặt cho người dùng một câu hỏi có cấu trúc
    - Bạn đang trả lời hoặc gỡ lỗi một lời nhắc ask_user
    - Bạn cần schema `ask_user`, thời gian chờ hoặc hành vi của kênh
summary: Cách ask_user tạm dừng một lượt của agent để chờ quyết định có cấu trúc từ con người
title: Hỏi người dùng
x-i18n:
    generated_at: "2026-07-19T06:02:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f8753f5b164a3656774c2f6133022eaaedb12b2e2d513d9c84279c6ba0e6f870
    source_path: tools/ask-user.md
    workflow: 16
---

`ask_user` cho phép tác nhân đặt cho người dùng từ một đến ba câu hỏi có cấu trúc và
chờ câu trả lời. Công cụ này dành cho những quyết định thực sự thuộc về người dùng,
không phải xác nhận thông thường hoặc thông tin mà tác nhân có thể suy ra từ yêu cầu,
mã hoặc một giá trị mặc định hợp lý.

Công cụ chỉ khả dụng trong phiên chính. Các tác nhân phụ và những lượt chạy không phải chính
không nhận được công cụ này.

## Trả lời câu hỏi

Bạn có thể trả lời từ bất kỳ giao diện hội thoại nào được hỗ trợ:

- Control UI trên web neo một bảng câu hỏi ngay phía trên trình soạn thảo. Với
  lời nhắc có nhiều câu hỏi, bảng hiển thị từng câu hỏi một và chuyển tiếp
  qua một trình hướng dẫn ngắn theo từng bước. Sau khi có kết quả, bảng đóng lại và cuộc trò chuyện
  chỉ giữ lại bản tóm tắt câu trả lời ngắn gọn.
- Telegram, Discord và Slack hiển thị các nút gốc cho lời nhắc
  gồm một câu hỏi, cho phép chọn một phương án.
- Câu trả lời dạng văn bản thuần túy hoạt động trên mọi kênh. Hãy trả lời bằng một số, nhãn phương án
  hoặc câu trả lời của riêng bạn.

OpenClaw luôn bật câu trả lời dạng văn bản tự do **Khác**. Tác nhân không được thêm phương án
`Other` vào danh sách phương án được soạn.

## Hành vi trên nền tảng

Câu trả lời hoạt động trên mọi giao diện hội thoại được hỗ trợ. Control UI trên web sử dụng
một trình hướng dẫn theo từng bước được neo, thay thế trình soạn thảo khi mở rộng; thu gọn trình này sẽ khôi phục
trình soạn thảo đầy đủ bên dưới một thanh câu hỏi mảnh. iOS, macOS và Android hiển thị
các thẻ nội tuyến; nhiều câu hỏi vẫn được xếp chồng như một cách trình bày có chủ đích, thân thiện với thao tác cảm ứng.
Mọi nền tảng đều giữ phần tóm tắt câu hỏi và câu trả lời trong dòng thời gian của cuộc trò chuyện đang hoạt động
mà không tự động xóa theo thời gian, đồng thời **Bỏ qua** khả dụng ở mọi nơi.

Các lời nhắc không thể sử dụng nút gốc, bao gồm lời nhắc có nhiều câu hỏi và
lời nhắc cho phép chọn nhiều phương án, sẽ chuyển thành văn bản dễ đọc trên các kênh. Control UI
vẫn giữ nguyên trình hướng dẫn có cấu trúc đầy đủ.

## Hết thời gian chờ và không có câu trả lời

Thời gian chờ mặc định là 900 giây. `timeoutSeconds` được giới hạn trong khoảng
từ 30 đến 3600 giây.

Nếu câu hỏi hết hạn hoặc bị hủy trước khi nhận được câu trả lời, công cụ
trả về `status: "no_answer"`. Sau đó, tác nhân tiếp tục theo phán đoán tốt nhất.
Một lượt chạy tác nhân bị hủy sẽ hủy câu hỏi Gateway đang chờ tương ứng.

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
  timeoutSeconds?: number; // số nguyên; mặc định 900, được giới hạn trong khoảng 30-3600
}
```

Với `multiSelect: true`, người dùng có thể chọn nhiều hơn một phương án. Giá trị
câu trả lời được trả về dưới dạng một mảng cho mỗi câu hỏi.

Ví dụ về kết quả đã trả lời:

```json
{
  "status": "answered",
  "answers": {
    "answers": {
      "deploy_target": {
        "answers": ["Staging (Recommended)"]
      }
    }
  }
}
```

## Hướng dẫn cho mô hình

Hợp đồng dành cho mô hình yêu cầu tác nhân:

- chỉ hỏi khi bị chặn bởi một quyết định thực sự thuộc về người dùng;
- ưu tiên một câu hỏi và không sử dụng quá ba câu hỏi;
- đặt phương án được đề xuất ở đầu tiên và thêm `(Recommended)` vào cuối nhãn của phương án đó;
- không đưa phương án `Other` vào nội dung được soạn vì văn bản tự do được tự động thêm;
- tiếp tục theo phán đoán tốt nhất sau `no_answer`.

Tác nhân không nên sử dụng `ask_user` để hỏi liệu mình có thể tiếp tục hay để xác nhận
kế hoạch của chính mình.
