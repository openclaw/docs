---
read_when:
    - Bạn muốn nhanh chóng kiểm tra tình trạng của Gateway đang chạy
summary: Tài liệu tham khảo CLI cho `openclaw health` (ảnh chụp nhanh tình trạng Gateway qua RPC)
title: Sức khỏe
x-i18n:
    generated_at: "2026-07-19T05:41:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 51cc0e3dd61af3e6fa460dd646bfa1c3e5bd1a52da860eac26c12101151d081d
    source_path: cli/health.md
    workflow: 16
---

# `openclaw health`

Lấy ảnh chụp nhanh tình trạng hoạt động từ Gateway đang chạy qua RPC WebSocket (CLI không kết nối trực tiếp đến socket của kênh).

## Tùy chọn

| Cờ               | Mặc định | Mô tả                                                                                                  |
| ---------------- | -------- | ------------------------------------------------------------------------------------------------------ |
| `--json`         | `false` | In JSON có thể đọc bằng máy thay vì văn bản.                                                           |
| `--timeout <ms>` | `10000` | Thời gian chờ kết nối tính bằng mili giây.                                                             |
| `--verbose`      | `false` | Buộc thăm dò trực tiếp và mở rộng đầu ra cho tất cả tài khoản và tác tử đã cấu hình.                   |
| `--debug`        | `false` | Bí danh của `--verbose`.                                                                        |

Ví dụ:

```bash
openclaw health
openclaw health --json
openclaw health --timeout 2500
openclaw health --verbose
openclaw health --debug
```

## Hành vi

- Khi không có `--verbose`, Gateway có thể trả về ảnh chụp nhanh được lưu vào bộ nhớ đệm (mới trong tối đa 60 giây và không thay đổi so với trạng thái thời gian chạy trực tiếp của kênh), đồng thời làm mới ảnh đó trong nền cho bên gọi tiếp theo.
- `--verbose` buộc thăm dò trực tiếp (thăm dò tài khoản theo từng kênh), in chi tiết kết nối Gateway và mở rộng đầu ra mà con người có thể đọc cho tất cả tài khoản và tác tử đã cấu hình thay vì chỉ tác tử mặc định.
- `--json` luôn trả về ảnh chụp nhanh đầy đủ: các kênh, kết quả thăm dò theo từng tài khoản, trạng thái tải Plugin, trạng thái cách ly của công cụ ngữ cảnh, trạng thái bộ nhớ đệm giá mô hình, tình trạng vòng lặp sự kiện, thư chết trong hàng đợi phân phối và kho phiên theo từng tác tử.
- Khi các lượt phân phối đi hoặc sự kiện kênh đến được chuyển vào hàng đợi thư chết, đầu ra văn bản sẽ báo cáo số lượng và thời gian kể từ lỗi cũ nhất. Số lượng sự kiện đến được nhóm theo tài khoản kênh; kiểm tra hoặc khôi phục từng sự kiện bằng [`openclaw channels dead-letters`](/vi/cli/channels#inbound-dead-letters).

## Liên quan

- [Tài liệu tham khảo CLI](/vi/cli)
- [`openclaw status`](/vi/cli/status) — chẩn đoán cục bộ và thăm dò kênh mà không cần ảnh chụp nhanh đầy đủ về tình trạng hoạt động
- [Tình trạng Gateway](/vi/gateway/health)
