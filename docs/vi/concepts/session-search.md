---
read_when:
    - Bạn cần tìm nội dung đã được thảo luận trong một phiên trước đó
    - Bạn muốn tìm hiểu về quyền riêng tư hoặc việc lập chỉ mục khi tìm kiếm phiên làm việc
summary: Tìm kiếm trong bản ghi các phiên trước và mở lại ngữ cảnh phù hợp
title: Tìm kiếm phiên làm việc
x-i18n:
    generated_at: "2026-07-16T14:20:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 3e9cda6b656b689eef0636592914f4890a64dca5e955aa03908377903aaa29c9
    source_path: concepts/session-search.md
    workflow: 16
---

# Tìm kiếm phiên

`sessions_search` tìm kiếm văn bản của người dùng và trợ lý trong các phiên trước đây của chính bạn. Mỗi kết quả
bao gồm một `sessionKey`, dấu thời gian, vai trò và một đoạn trích ngắn khớp với nội dung tìm kiếm. Truyền
`sessionKey` được trả về cho `sessions_history` khi bạn cần xem cuộc hội thoại xung quanh.

## Khả năng hiển thị và đầu ra

Tìm kiếm sử dụng các quy tắc về khả năng hiển thị phiên giống như `sessions_history`. Các kết quả nằm ngoài
cây phiên mà bên gọi có thể xem sẽ bị loại bỏ trước khi áp dụng giới hạn kết quả. Các tác nhân trong sandbox vẫn chỉ
được giới hạn ở những phiên do chúng tạo ra khi khả năng hiển thị phiên đã tạo được bật.

Các đoạn trích được biên tập để ẩn thông tin nhạy cảm trước khi trả về cho mô hình. Kết quả cũng bị giới hạn theo số lượng, độ dài
đoạn trích và tổng kích thước phản hồi.

## Vòng đời chỉ mục

OpenClaw lưu trữ một chỉ mục toàn văn bên cạnh các hàng bản chép lời trong cơ sở dữ liệu SQLite của mỗi tác nhân.
Các tin nhắn mới của người dùng và trợ lý được lập chỉ mục trong cùng giao dịch lưu trữ chúng, vì vậy
chỉ mục không bao giờ chậm hơn các cuộc hội thoại trực tiếp; kết quả công cụ, khối suy luận và hình ảnh bị loại trừ.
Chỉ nhánh đang hoạt động của bản chép lời mới có thể được tìm kiếm.

Các bản chép lời có trước chỉ mục (ví dụ: các phiên được nhập bằng `openclaw doctor`) và
các phiên có nhánh đang hoạt động đã bị tua lại sẽ được lập chỉ mục lại bằng quy trình đối soát nền bắt đầu
từ lần tìm kiếm tiếp theo. Vì vậy, phản hồi có `indexing: true` có thể không đầy đủ; hãy thử lại sau khi
quá trình lập chỉ mục hoàn tất. Việc xóa một phiên sẽ xóa các mục chỉ mục của phiên đó trong cùng giao dịch.

Hiện tại, tính năng tìm kiếm sử dụng bộ tách từ Unicode của SQLite với chức năng loại bỏ dấu phụ. Việc tách thành trigram
để khớp chuỗi con CJK là một cải tiến trong tương lai.

## Tìm kiếm phiên so với tìm kiếm bộ nhớ

Sử dụng `sessions_search` cho các từ hoặc cụm từ chính xác trong bản chép lời phiên thô. Sử dụng
[`memory_search`](/vi/concepts/memory-search) cho các tệp bộ nhớ bền vững và khả năng truy hồi ngữ nghĩa. Kho ngữ liệu
bộ nhớ phiên thử nghiệm là phần bổ sung ngữ nghĩa cho tính năng tìm kiếm chính xác trong bản chép lời này.
