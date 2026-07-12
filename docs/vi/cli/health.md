---
read_when:
    - Bạn muốn nhanh chóng kiểm tra tình trạng hoạt động của Gateway đang chạy
summary: Tài liệu tham khảo CLI cho `openclaw health` (ảnh chụp nhanh tình trạng Gateway qua RPC)
title: Sức khỏe
x-i18n:
    generated_at: "2026-07-12T07:48:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a26ce5ade9ab56c9751c3dde814c38a1e01e74d91c2fd57e56d3c44ca529d0d8
    source_path: cli/health.md
    workflow: 16
---

# `openclaw health`

Tìm nạp ảnh chụp nhanh tình trạng từ Gateway đang chạy qua WebSocket RPC (CLI không kết nối trực tiếp đến socket của kênh).

## Tùy chọn

| Cờ               | Mặc định | Mô tả                                                                                                        |
| ---------------- | -------- | ------------------------------------------------------------------------------------------------------------ |
| `--json`         | `false`  | In JSON mà máy có thể đọc thay vì văn bản.                                                                   |
| `--timeout <ms>` | `10000`  | Thời gian chờ kết nối tính bằng mili giây.                                                                    |
| `--verbose`      | `false`  | Buộc thực hiện phép thăm dò trực tiếp và mở rộng đầu ra cho tất cả tài khoản và tác tử đã được cấu hình.      |
| `--debug`        | `false`  | Bí danh của `--verbose`.                                                                                      |

Ví dụ:

```bash
openclaw health
openclaw health --json
openclaw health --timeout 2500
openclaw health --verbose
openclaw health --debug
```

## Hành vi

- Khi không có `--verbose`, Gateway có thể trả về ảnh chụp nhanh được lưu trong bộ nhớ đệm (có hiệu lực tối đa 60 giây và không khác trạng thái thời gian chạy trực tiếp của kênh), đồng thời làm mới ảnh này trong nền cho lời gọi tiếp theo.
- `--verbose` buộc thực hiện phép thăm dò trực tiếp (thăm dò tài khoản theo từng kênh), in chi tiết kết nối Gateway và mở rộng đầu ra dễ đọc cho tất cả tài khoản và tác tử đã được cấu hình thay vì chỉ tác tử mặc định.
- `--json` luôn trả về ảnh chụp nhanh đầy đủ: các kênh, phép thăm dò theo từng tài khoản, trạng thái tải Plugin, trạng thái cách ly của công cụ ngữ cảnh, trạng thái bộ nhớ đệm giá mô hình, tình trạng vòng lặp sự kiện và kho phiên theo từng tác tử.

## Liên quan

- [Tài liệu tham khảo CLI](/vi/cli)
- [`openclaw status`](/vi/cli/status) — chẩn đoán cục bộ và thăm dò kênh mà không cần ảnh chụp nhanh tình trạng đầy đủ
- [Tình trạng Gateway](/vi/gateway/health)
