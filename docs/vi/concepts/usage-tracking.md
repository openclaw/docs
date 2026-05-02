---
read_when:
    - Bạn đang tích hợp các giao diện mức sử dụng/hạn ngạch của nhà cung cấp
    - Bạn cần giải thích hành vi theo dõi mức sử dụng hoặc các yêu cầu xác thực
summary: Các bề mặt theo dõi mức sử dụng và yêu cầu về thông tin xác thực
title: Theo dõi mức sử dụng
x-i18n:
    generated_at: "2026-05-02T10:40:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4faa5daff55668a6be73981b730edece51939d99954e784907c99fb101fcaaa7
    source_path: concepts/usage-tracking.md
    workflow: 16
---

## Đây là gì

- Kéo mức sử dụng/hạn mức của nhà cung cấp trực tiếp từ các endpoint sử dụng của họ.
- Không có chi phí ước tính; chỉ có các cửa sổ do nhà cung cấp báo cáo.
- Đầu ra trạng thái dễ đọc cho con người được chuẩn hóa thành `X% left`, ngay cả khi API thượng nguồn báo cáo hạn mức đã dùng, hạn mức còn lại, hoặc chỉ số đếm thô.
- `/status` và `session_status` ở cấp phiên có thể quay về mục sử dụng transcript mới nhất khi snapshot phiên trực tiếp còn thưa dữ liệu. Cơ chế dự phòng đó điền các bộ đếm token/cache còn thiếu, có thể khôi phục nhãn mô hình runtime đang hoạt động, và ưu tiên tổng lớn hơn theo hướng prompt khi metadata phiên bị thiếu hoặc nhỏ hơn. Các giá trị trực tiếp khác 0 hiện có vẫn được ưu tiên.

## Nơi nó xuất hiện

- `/status` trong cuộc trò chuyện: thẻ trạng thái nhiều emoji với token phiên + chi phí ước tính (chỉ API key). Mức sử dụng của nhà cung cấp hiển thị cho **nhà cung cấp mô hình hiện tại** khi có, dưới dạng cửa sổ `X% left` đã chuẩn hóa.
- `/usage off|tokens|full` trong cuộc trò chuyện: chân trang mức sử dụng theo từng phản hồi (OAuth chỉ hiển thị token).
- `/usage cost` trong cuộc trò chuyện: tóm tắt chi phí cục bộ được tổng hợp từ nhật ký phiên OpenClaw.
- CLI: `openclaw status --usage` in bảng phân tích đầy đủ theo từng nhà cung cấp.
- CLI: `openclaw channels list` in cùng snapshot sử dụng bên cạnh cấu hình nhà cung cấp (dùng `--no-usage` để bỏ qua).
- Thanh menu macOS: mục “Mức sử dụng” trong Context (chỉ khi có).

## Nhà cung cấp + thông tin xác thực

- **Anthropic (Claude)**: token OAuth trong hồ sơ xác thực.
- **GitHub Copilot**: token OAuth trong hồ sơ xác thực.
- **Gemini CLI**: token OAuth trong hồ sơ xác thực.
  - Mức sử dụng JSON quay về `stats`; `stats.cached` được chuẩn hóa thành `cacheRead`.
- **OpenAI Codex**: token OAuth trong hồ sơ xác thực (`accountId` được dùng khi có).
- **MiniMax**: API key hoặc hồ sơ xác thực OAuth MiniMax. OpenClaw xem `minimax`, `minimax-cn`, và `minimax-portal` là cùng một bề mặt hạn mức MiniMax, ưu tiên OAuth MiniMax đã lưu khi có, và nếu không thì quay về `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`, hoặc `MINIMAX_API_KEY`.
  Việc thăm dò mức sử dụng suy ra host Coding Plan từ `models.providers.minimax-portal.baseUrl` hoặc `models.providers.minimax.baseUrl` khi được cấu hình, và nếu không thì dùng host MiniMax CN.
  Các trường thô `usage_percent` / `usagePercent` của MiniMax có nghĩa là hạn mức **còn lại**, vì vậy OpenClaw đảo chúng trước khi hiển thị; các trường dựa trên số đếm được ưu tiên khi có.
  - Nhãn cửa sổ coding-plan đến từ các trường giờ/phút của nhà cung cấp khi có, sau đó quay về khoảng `start_time` / `end_time`.
  - Nếu endpoint coding-plan trả về `model_remains`, OpenClaw ưu tiên mục chat-model, suy ra nhãn cửa sổ từ timestamp khi thiếu các trường `window_hours` / `window_minutes` tường minh, và bao gồm tên mô hình trong nhãn gói.
- **Xiaomi MiMo**: API key qua env/config/kho xác thực (`XIAOMI_API_KEY`).
- **z.ai**: API key qua env/config/kho xác thực.

Mức sử dụng bị ẩn khi không thể phân giải xác thực sử dụng nhà cung cấp khả dụng. Nhà cung cấp có thể cung cấp logic xác thực sử dụng riêng cho Plugin; nếu không, OpenClaw quay về thông tin xác thực OAuth/API-key khớp từ hồ sơ xác thực, biến môi trường, hoặc cấu hình.

## Liên quan

- [Mức dùng token và chi phí](/vi/reference/token-use)
- [Mức sử dụng API và chi phí](/vi/reference/api-usage-costs)
- [Prompt caching](/vi/reference/prompt-caching)
