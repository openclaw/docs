---
read_when:
    - Bạn đang tích hợp các bề mặt về mức sử dụng/hạn mức của nhà cung cấp
    - Bạn cần giải thích hành vi theo dõi mức sử dụng hoặc các yêu cầu xác thực
summary: Các bề mặt theo dõi mức sử dụng và yêu cầu về thông tin xác thực
title: Theo dõi mức sử dụng
x-i18n:
    generated_at: "2026-04-29T22:40:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 21c2ae0c32d9f28b301abed22d6edcb423d46831cb1d78f4c2908df0ecf82854
    source_path: concepts/usage-tracking.md
    workflow: 16
---

## Đó là gì

- Kéo mức sử dụng/hạn mức của nhà cung cấp trực tiếp từ các điểm cuối sử dụng của họ.
- Không có chi phí ước tính; chỉ có các khoảng thời gian do nhà cung cấp báo cáo.
- Đầu ra trạng thái dễ đọc được chuẩn hóa thành `X% left`, ngay cả khi một
  API thượng nguồn báo cáo hạn mức đã dùng, hạn mức còn lại, hoặc chỉ số đếm thô.
- `/status` cấp phiên và `session_status` có thể dùng mục sử dụng transcript
  mới nhất làm dự phòng khi ảnh chụp nhanh phiên trực tiếp còn thưa thớt. Cơ chế
  dự phòng đó điền các bộ đếm token/cache còn thiếu, có thể khôi phục nhãn mô hình
  runtime đang hoạt động, và ưu tiên tổng lớn hơn theo hướng prompt khi metadata
  phiên bị thiếu hoặc nhỏ hơn. Các giá trị trực tiếp khác 0 hiện có vẫn được ưu tiên.

## Xuất hiện ở đâu

- `/status` trong chat: thẻ trạng thái nhiều emoji với token phiên + chi phí ước tính (chỉ khóa API). Mức sử dụng nhà cung cấp hiển thị cho **nhà cung cấp mô hình hiện tại** khi có sẵn dưới dạng khoảng `X% left` đã chuẩn hóa.
- `/usage off|tokens|full` trong chat: chân trang mức sử dụng theo từng phản hồi (OAuth chỉ hiển thị token).
- `/usage cost` trong chat: tóm tắt chi phí cục bộ được tổng hợp từ nhật ký phiên OpenClaw.
- CLI: `openclaw status --usage` in bảng phân tích đầy đủ theo từng nhà cung cấp.
- CLI: `openclaw channels list` in cùng ảnh chụp nhanh mức sử dụng bên cạnh cấu hình nhà cung cấp (dùng `--no-usage` để bỏ qua).
- Thanh menu macOS: mục “Mức sử dụng” trong Context (chỉ khi có sẵn).

## Nhà cung cấp + thông tin xác thực

- **Anthropic (Claude)**: token OAuth trong hồ sơ xác thực.
- **GitHub Copilot**: token OAuth trong hồ sơ xác thực.
- **Gemini CLI**: token OAuth trong hồ sơ xác thực.
  - Mức sử dụng JSON dự phòng sang `stats`; `stats.cached` được chuẩn hóa thành
    `cacheRead`.
- **OpenAI Codex**: token OAuth trong hồ sơ xác thực (dùng accountId khi có).
- **MiniMax**: khóa API hoặc hồ sơ xác thực OAuth MiniMax. OpenClaw xem
  `minimax`, `minimax-cn`, và `minimax-portal` là cùng một bề mặt hạn mức MiniMax,
  ưu tiên OAuth MiniMax đã lưu khi có, và nếu không thì dự phòng sang
  `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`, hoặc `MINIMAX_API_KEY`.
  Các trường thô `usage_percent` / `usagePercent` của MiniMax có nghĩa là hạn mức
  **còn lại**, nên OpenClaw đảo chúng trước khi hiển thị; các trường dựa trên số
  đếm được ưu tiên khi có.
  - Nhãn khoảng coding-plan lấy từ các trường giờ/phút của nhà cung cấp khi
    có, rồi dự phòng sang khoảng `start_time` / `end_time`.
  - Nếu điểm cuối coding-plan trả về `model_remains`, OpenClaw ưu tiên mục
    mô hình chat, suy ra nhãn khoảng từ dấu thời gian khi không có các trường
    `window_hours` / `window_minutes` rõ ràng, và đưa tên mô hình vào nhãn gói.
- **Xiaomi MiMo**: khóa API qua biến môi trường/cấu hình/kho xác thực (`XIAOMI_API_KEY`).
- **z.ai**: khóa API qua biến môi trường/cấu hình/kho xác thực.

Mức sử dụng bị ẩn khi không thể phân giải thông tin xác thực mức sử dụng nhà cung cấp có thể dùng. Các nhà cung cấp
có thể cung cấp logic xác thực mức sử dụng riêng cho plugin; nếu không, OpenClaw dự phòng sang
thông tin xác thực OAuth/khóa API khớp từ hồ sơ xác thực, biến môi trường,
hoặc cấu hình.

## Liên quan

- [Mức dùng token và chi phí](/vi/reference/token-use)
- [Mức sử dụng API và chi phí](/vi/reference/api-usage-costs)
- [Bộ nhớ đệm prompt](/vi/reference/prompt-caching)
