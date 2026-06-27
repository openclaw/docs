---
read_when:
    - Bạn đang cài đặt, cấu hình hoặc kiểm tra plugin anthropic-vertex
summary: Plugin nhà cung cấp Anthropic Vertex của OpenClaw dành cho các mô hình Claude trên Google Vertex AI.
title: Plugin Anthropic Vertex
x-i18n:
    generated_at: "2026-06-27T17:50:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f772c9a5bf1edd6a270b7ba5e6d695290fe96648c9ac38d0bc90bb1504f50cd7
    source_path: plugins/reference/anthropic-vertex.md
    workflow: 16
---

# Plugin Anthropic Vertex

Plugin nhà cung cấp OpenClaw Anthropic Vertex cho các mô hình Claude trên Google Vertex AI.

## Phân phối

- Gói: `@openclaw/anthropic-vertex-provider`
- Tuyến cài đặt: npm; ClawHub

## Bề mặt

providers: anthropic-vertex

<!-- openclaw-plugin-reference:manual-start -->

## Claude Fable 5

Sử dụng `anthropic-vertex/claude-fable-5` ở nơi mô hình có sẵn trong khu vực Google Cloud của bạn.
Fable 5 luôn dùng suy nghĩ thích ứng và mặc định là mức nỗ lực `high`. `/think off` và
`/think minimal` dùng mức nỗ lực `low` vì mô hình không hỗ trợ tắt suy nghĩ.

<!-- openclaw-plugin-reference:manual-end -->
