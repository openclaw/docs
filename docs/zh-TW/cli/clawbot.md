---
read_when:
    - 你維護使用 `openclaw clawbot ...` 的舊版指令碼
    - 你需要目前命令的遷移指引
summary: '`openclaw clawbot` 的命令列介面參考（舊版別名命名空間）'
title: Clawbot
x-i18n:
    generated_at: "2026-07-05T11:06:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6baf9b4e9bbe8bb31cdc4923c38cd45a883b6e5be921a403335e257dacdc2cd5
    source_path: cli/clawbot.md
    workflow: 16
---

# `openclaw clawbot`

為了向後相容而保留的舊版別名命名空間。它會註冊與頂層命令列介面相同的 QR 指令，因此 `openclaw clawbot qr` 可接受每個 [`openclaw qr`](/zh-TW/cli/qr) 旗標。

## 遷移

建議使用現代的頂層指令：

- `openclaw clawbot qr` -> `openclaw qr`

## 相關

- [命令列介面參考](/zh-TW/cli)
