---
read_when:
    - Bạn đang cài đặt, cấu hình hoặc kiểm tra Plugin anthropic-vertex
summary: Plugin nhà cung cấp Anthropic Vertex của OpenClaw dành cho các mô hình Claude trên Google Vertex AI.
title: Plugin Anthropic Vertex
x-i18n:
    generated_at: "2026-07-16T14:46:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: bd73b80b4e49a85cd6b1d8e47df6bf8d2d791c36a677124112f299027bfd9af5
    source_path: plugins/reference/anthropic-vertex.md
    workflow: 16
---

# Plugin Anthropic Vertex

Plugin nhà cung cấp Anthropic Vertex của OpenClaw dành cho các mô hình Claude trên Google Vertex AI.

## Phân phối

- Gói: `@openclaw/anthropic-vertex-provider`
- Phương thức cài đặt: npm; ClawHub

## Bề mặt

nhà cung cấp: `anthropic-vertex`

<!-- openclaw-plugin-reference:manual-start -->

## Claude Fable 5

Sử dụng `anthropic-vertex/claude-fable-5` tại nơi mô hình khả dụng trong khu vực Google Cloud của bạn.
Fable 5 luôn sử dụng chế độ suy luận thích ứng và mặc định ở mức nỗ lực `high`. `/think off` và
`/think minimal` sử dụng mức nỗ lực `low` vì mô hình không hỗ trợ tắt chế độ suy luận.

## Claude Sonnet 5

Sử dụng `anthropic-vertex/claude-sonnet-5` với điểm cuối `global`, `us` hoặc `eu`
của Vertex. Sonnet 5 mặc định sử dụng chế độ suy luận thích ứng ở mức nỗ lực `high` và hỗ trợ
`/think off` hoặc các mức `/think xhigh|max` gốc. OpenClaw tự động công bố
cửa sổ ngữ cảnh 1.000.000 token và giới hạn đầu ra 128.000 token của mô hình.

Giá trong danh mục tuân theo mức giá toàn cầu ưu đãi ban đầu của Vertex là `$2/$10` cho mỗi
một triệu token đầu vào/đầu ra đến hết ngày 31 tháng 8 năm 2026, sau đó là `$3/$15` kể từ
ngày 1 tháng 9. Các điểm cuối đa khu vực `us` và `eu` áp dụng mức phụ phí
10% theo tài liệu của Vertex.

<!-- openclaw-plugin-reference:manual-end -->
