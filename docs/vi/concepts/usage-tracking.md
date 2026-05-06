---
read_when:
    - Bạn đang kết nối các bề mặt sử dụng/hạn mức của nhà cung cấp
    - Bạn cần giải thích hành vi theo dõi mức sử dụng hoặc các yêu cầu xác thực
summary: Các giao diện theo dõi mức sử dụng và yêu cầu về thông tin xác thực
title: Theo dõi mức sử dụng
x-i18n:
    generated_at: "2026-05-06T09:10:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 14210813bf3c078a1323b1560a1a3da586f55880e05a9b310e1b6a2d5490f956
    source_path: concepts/usage-tracking.md
    workflow: 16
---

## Đó là gì

- Kéo mức sử dụng/hạn mức của nhà cung cấp trực tiếp từ các endpoint usage của họ.
- Không có chi phí ước tính; chỉ có các khoảng thời gian do nhà cung cấp báo cáo.
- Đầu ra trạng thái dễ đọc cho người dùng được chuẩn hóa thành `X% left`, ngay cả khi một
  API thượng nguồn báo cáo hạn mức đã tiêu thụ, hạn mức còn lại, hoặc chỉ số đếm thô.
- `/status` cấp phiên và `session_status` có thể dùng dự phòng mục sử dụng
  transcript mới nhất khi ảnh chụp nhanh phiên trực tiếp còn thưa. Cơ chế
  dự phòng đó điền các bộ đếm token/cache còn thiếu, có thể khôi phục nhãn mô hình
  runtime đang hoạt động, và ưu tiên tổng lớn hơn theo hướng prompt khi siêu dữ liệu
  phiên bị thiếu hoặc nhỏ hơn. Các giá trị trực tiếp khác 0 hiện có vẫn được ưu tiên.

## Nơi hiển thị

- `/status` trong cuộc trò chuyện: thẻ trạng thái nhiều biểu tượng cảm xúc với token phiên + chi phí ước tính (chỉ khóa API). Mức sử dụng của nhà cung cấp hiển thị cho **nhà cung cấp mô hình hiện tại** khi có sẵn dưới dạng khoảng thời gian `X% left` đã chuẩn hóa.
- `/usage off|tokens|full` trong cuộc trò chuyện: chân trang mức sử dụng theo từng phản hồi (OAuth chỉ hiển thị token).
- `/usage cost` trong cuộc trò chuyện: tóm tắt chi phí cục bộ được tổng hợp từ nhật ký phiên OpenClaw.
- CLI: `openclaw status --usage` in ra phân tích đầy đủ theo từng nhà cung cấp.
- CLI: `openclaw channels list` in cùng ảnh chụp nhanh mức sử dụng bên cạnh cấu hình nhà cung cấp (dùng `--no-usage` để bỏ qua).
- Thanh menu macOS: mục "Mức sử dụng" trong Ngữ cảnh (chỉ khi có sẵn).

## Nhà cung cấp + thông tin xác thực

- **Anthropic (Claude)**: token OAuth trong hồ sơ xác thực.
- **GitHub Copilot**: token OAuth trong hồ sơ xác thực.
- **Gemini CLI**: token OAuth trong hồ sơ xác thực.
  - Mức sử dụng JSON dùng dự phòng `stats`; `stats.cached` được chuẩn hóa thành
    `cacheRead`.
- **OpenAI Codex**: token OAuth trong hồ sơ xác thực (`accountId` được dùng khi có).
- **MiniMax**: khóa API hoặc hồ sơ xác thực OAuth MiniMax. OpenClaw xem
  `minimax`, `minimax-cn`, và `minimax-portal` là cùng một bề mặt hạn mức MiniMax,
  ưu tiên OAuth MiniMax đã lưu khi có, và nếu không thì dùng dự phòng
  `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`, hoặc `MINIMAX_API_KEY`.
  Việc thăm dò mức sử dụng suy ra máy chủ Coding Plan từ `models.providers.minimax-portal.baseUrl`
  hoặc `models.providers.minimax.baseUrl` khi được cấu hình, và nếu không thì dùng
  máy chủ MiniMax CN.
  Các trường thô `usage_percent` / `usagePercent` của MiniMax có nghĩa là hạn mức
  **còn lại**, nên OpenClaw đảo ngược chúng trước khi hiển thị; các trường dựa trên số đếm được ưu tiên khi
  có.
  - Nhãn khoảng thời gian coding-plan lấy từ các trường giờ/phút của nhà cung cấp khi
    có, sau đó dùng dự phòng khoảng `start_time` / `end_time`.
  - Nếu endpoint coding-plan trả về `model_remains`, OpenClaw ưu tiên mục
    mô hình chat, suy ra nhãn khoảng thời gian từ dấu thời gian khi các trường
    `window_hours` / `window_minutes` rõ ràng không có, và bao gồm tên mô hình
    trong nhãn gói.
- **Xiaomi MiMo**: khóa API qua env/cấu hình/kho xác thực (`XIAOMI_API_KEY`).
- **z.ai**: khóa API qua env/cấu hình/kho xác thực.

Mức sử dụng bị ẩn khi không thể phân giải thông tin xác thực mức sử dụng nhà cung cấp khả dụng. Nhà cung cấp
có thể cung cấp logic xác thực mức sử dụng riêng cho Plugin; nếu không, OpenClaw dùng dự phòng bằng cách
khớp thông tin xác thực OAuth/khóa API từ hồ sơ xác thực, biến môi trường,
hoặc cấu hình.

## Liên quan

- [Mức sử dụng token và chi phí](/vi/reference/token-use)
- [Mức sử dụng API và chi phí](/vi/reference/api-usage-costs)
- [Bộ nhớ đệm prompt](/vi/reference/prompt-caching)
