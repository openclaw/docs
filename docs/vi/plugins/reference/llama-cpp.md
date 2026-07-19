---
read_when:
    - Bạn đang cài đặt, cấu hình hoặc kiểm tra Plugin llama-cpp
summary: Suy luận văn bản và tạo embedding GGUF cục bộ thông qua node-llama-cpp.
title: Plugin Llama Cpp
x-i18n:
    generated_at: "2026-07-19T05:55:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 2756d4b3e00bbe37b4dedec1d54d28bfe6662e8105504317a402293254ce0240
    source_path: plugins/reference/llama-cpp.md
    workflow: 16
---

# Plugin Llama Cpp

Suy luận văn bản và tạo embedding GGUF cục bộ thông qua node-llama-cpp.

## Phân phối

- Gói: `@openclaw/llama-cpp-provider`
- Đường dẫn cài đặt: npm; ClawHub

## Bề mặt

nhà cung cấp: `llama-cpp`; hợp đồng: `embeddingProviders`

<!-- openclaw-plugin-reference:manual-start -->

## Mô hình văn bản mặc định

Trong quá trình thiết lập tương tác, OpenClaw cung cấp Gemma 4 E4B IT Q4_K_M dưới dạng
bản tải xuống đi kèm có dung lượng khoảng 5.0 GB. Tùy chọn này yêu cầu tổng RAM ít nhất 16 GiB.
Các mô hình đã được lưu vào bộ nhớ đệm vẫn được phát hiện trên những máy có cấu hình thấp hơn.

Để sử dụng mô hình khác, hãy đặt `params.modelPath` thành GGUF tùy chỉnh bất kỳ. Các mô hình tùy chỉnh
không phải tuân theo yêu cầu về RAM của bản tải xuống đi kèm. Trên các máy không đáp ứng
yêu cầu, bạn cũng có thể chạy một mô hình nhỏ hơn thông qua Ollama hoặc LM Studio, hoặc
chọn một nhà cung cấp đám mây.

<!-- openclaw-plugin-reference:manual-end -->

## Tài liệu liên quan

- [llama-cpp](/vi/plugins/llama-cpp)
