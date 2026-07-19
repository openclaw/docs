---
read_when:
    - Điều chỉnh cách phân tích cú pháp hoặc giá trị mặc định của các chỉ thị về chế độ suy luận, chế độ nhanh hoặc chế độ chi tiết
summary: Cú pháp chỉ thị cho /think, /fast, /verbose, /trace và khả năng hiển thị quá trình suy luận
title: Các mức độ suy luận
x-i18n:
    generated_at: "2026-07-19T06:24:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: bb2a4ed4179e115c184d89ecf3a0a22379d3d0dad4a4838d9c5db851e1334728
    source_path: tools/thinking.md
    workflow: 16
---

## Chức năng

- Chỉ thị nội tuyến trong nội dung của bất kỳ tin nhắn đến nào: `/t <level>`, `/think:<level>` hoặc `/thinking <level>`.
- Các mức (bí danh): `off | minimal | low | medium | high | xhigh | adaptive | max | ultra`, gần tương ứng với thang từ khóa đặc biệt kinh điển của Anthropic: "think" < "think hard" < "think harder" < "ultrathink":
  - minimal ~ "think"
  - low ~ "think hard"
  - medium ~ "think harder"
  - high ~ "ultrathink" (ngân sách tối đa)
  - xhigh ~ "ultrathink+" (các mô hình GPT-5.2+ và Codex, cùng mức nỗ lực của Anthropic Claude Opus 4.7+)
  - adaptive → tư duy thích ứng do nhà cung cấp quản lý (được hỗ trợ cho Claude 4.6 trên Anthropic/Bedrock, Anthropic Claude Opus 4.7+ và tư duy động của Google Gemini)
  - max → suy luận tối đa của nhà cung cấp (Anthropic Claude Opus 4.7+; Ollama ánh xạ mức này sang nỗ lực `think` gốc cao nhất)
  - ultra → suy luận tối đa của nhà cung cấp cộng với điều phối chủ động các tác nhân phụ khi mô hình/môi trường chạy đã chọn hỗ trợ
  - `x-high`, `x_high`, `extra-high`, `extra high` và `extra_high` ánh xạ sang `xhigh`.
  - `highest` ánh xạ sang `high`.
- Lưu ý về nhà cung cấp:
  - Các trình đơn và bộ chọn tư duy được điều khiển bởi hồ sơ nhà cung cấp. Plugin của nhà cung cấp khai báo chính xác tập hợp mức cho mô hình đã chọn, bao gồm các nhãn như `on` nhị phân.
  - `adaptive`, `xhigh`, `max` và `ultra` chỉ được công bố cho các hồ sơ nhà cung cấp/mô hình/môi trường chạy hỗ trợ chúng. Các chỉ thị có kiểu cho mức không được hỗ trợ sẽ bị từ chối kèm theo những tùy chọn hợp lệ của mô hình đó.
  - Các mức không được hỗ trợ đã lưu trước đó được ánh xạ lại theo thứ hạng hồ sơ nhà cung cấp. `adaptive` chuyển về `medium` trên các mô hình không thích ứng, còn `xhigh` và `max` chuyển về mức khác tắt lớn nhất được hỗ trợ cho mô hình đã chọn.
  - Các mô hình Anthropic Claude 4.6 mặc định dùng `adaptive` khi không đặt mức tư duy rõ ràng.
  - Anthropic Claude Opus 4.8 và Opus 4.7 giữ tư duy ở trạng thái tắt trừ khi bạn đặt rõ ràng một mức tư duy. Mức nỗ lực mặc định do nhà cung cấp sở hữu của Opus 4.8 là `high` sau khi bật tư duy thích ứng.
  - Anthropic Claude Opus 4.7+ ánh xạ `/think xhigh` sang tư duy thích ứng cộng với `output_config.effort: "xhigh"`, vì `/think` là chỉ thị tư duy còn `xhigh` là thiết lập nỗ lực của Opus.
  - Anthropic Claude Opus 4.7+ cũng cung cấp `/think max`; mức này ánh xạ sang cùng đường dẫn nỗ lực tối đa do nhà cung cấp sở hữu.
  - Các mô hình DeepSeek V4 trực tiếp cung cấp `/think xhigh|max`; cả hai đều ánh xạ sang `reasoning_effort: "max"` của DeepSeek, còn các mức thấp hơn nhưng không tắt ánh xạ sang `high`.
  - Các mô hình DeepSeek V4 được định tuyến qua OpenRouter cung cấp `/think xhigh` và gửi các giá trị `reasoning.effort` được OpenRouter hỗ trợ thay vì `reasoning_effort` cấp cao nhất gốc của DeepSeek. Các mức thấp hơn nhưng không tắt ánh xạ sang `high`, còn các giá trị ghi đè `max` đã lưu chuyển về `xhigh`.
  - Các mô hình Ollama có khả năng tư duy cung cấp `/think low|medium|high|max`; `max` ánh xạ sang `think: "high"` gốc vì API gốc của Ollama chấp nhận các chuỗi nỗ lực `low`, `medium` và `high`.
  - Các mô hình OpenAI GPT ánh xạ `/think` thông qua khả năng hỗ trợ nỗ lực riêng theo mô hình của Responses API. `/think off` chỉ gửi `reasoning.effort: "none"` khi mô hình đích hỗ trợ; nếu không, OpenClaw bỏ qua tải suy luận đã tắt thay vì gửi một giá trị không được hỗ trợ.
  - GPT-5.6 Sol và Terra cung cấp `/think ultra` gốc thông qua môi trường chạy Codex. GPT-5.6 Luna cung cấp các mức đến `max` vì danh mục Codex của nó không công bố Ultra.
  - Môi trường chạy OpenClaw nhúng cung cấp `/think ultra` logic cho GPT-5.6 Sol, Terra và Luna. Môi trường này gửi nỗ lực tối đa của nhà cung cấp và thêm hướng dẫn điều phối chủ động các tác nhân phụ trong phạm vi lượt chạy.
  - Các mục danh mục tùy chỉnh tương thích với OpenAI có thể chọn dùng `/think xhigh` bằng cách đặt `models.providers.<provider>.models[].compat.supportedReasoningEfforts` để bao gồm `"xhigh"`. Cơ chế này sử dụng cùng siêu dữ liệu tương thích để ánh xạ tải nỗ lực suy luận OpenAI gửi đi, nhờ đó các trình đơn, xác thực phiên, CLI của tác nhân và `llm-task` nhất quán với hành vi truyền tải.
  - Các tham chiếu OpenRouter Hunter Alpha đã ngừng hoạt động nhưng vẫn còn trong cấu hình sẽ bỏ qua việc chèn suy luận proxy vì tuyến đã ngừng này có thể trả về văn bản câu trả lời cuối cùng qua các trường suy luận.
  - Google Gemini ánh xạ `/think adaptive` sang tư duy động do nhà cung cấp sở hữu của Gemini. Các yêu cầu Gemini 3 bỏ qua `thinkingLevel` cố định, còn các yêu cầu Gemini 2.5 gửi `thinkingBudget: -1`; các mức cố định vẫn ánh xạ sang `thinkingLevel` hoặc ngân sách Gemini gần nhất cho dòng mô hình đó.
  - MiniMax M2.x (`minimax/MiniMax-M2*`) trên đường dẫn truyền phát tương thích với Anthropic mặc định dùng `thinking: { type: "disabled" }` trừ khi bạn đặt rõ ràng tư duy trong tham số mô hình hoặc tham số yêu cầu. Điều này tránh để lộ các delta `reasoning_content` từ định dạng luồng Anthropic không gốc của M2.x. MiniMax-M3 (và M3.x) được miễn: M3 phát ra các khối tư duy Anthropic đúng chuẩn và trả về nội dung trống khi tư duy bị tắt, vì vậy OpenClaw giữ M3 trên đường dẫn tư duy bị bỏ qua/thích ứng của nhà cung cấp.
  - Z.AI (`zai/*`) là dạng nhị phân (`on`/`off`) đối với hầu hết các mô hình GLM. GLM-5.2 là ngoại lệ: mô hình này cung cấp `/think off|low|high|max`, ánh xạ `low` và `high` sang `reasoning_effort: "high"` của Z.AI, đồng thời ánh xạ `max` sang `reasoning_effort: "max"`.
  - Kimi K3 của Moonshot API (`moonshot/kimi-k3`) luôn tư duy ở mức `max`, gửi `reasoning_effort: "max"`, bỏ qua trường `thinking` của K2 và các giá trị ghi đè lấy mẫu cố định, đồng thời giữ nguyên các lựa chọn công cụ được K3 hỗ trợ. Kimi Code K3 (`kimi/k3` và `kimi/k3[1m]`) cung cấp `/think off|max`: trạng thái tắt gửi `thinking.type: "disabled"`, còn mức tối đa gửi tư duy thích ứng với nỗ lực tối đa. Các tham chiếu Kimi Code hiện tại cũng bao gồm `kimi/kimi-for-coding` và `kimi/kimi-for-coding-highspeed`. Kimi K2.7 Code (`moonshot/kimi-k2.7-code` và `moonshot/kimi-k2.7-code-highspeed`) luôn tư duy, chỉ cung cấp `on`, đồng thời bỏ qua cả `thinking` và `reasoning_effort` gửi đi. Các mô hình `moonshot/*` khác ánh xạ `/think off` sang `thinking: { type: "disabled" }` và mọi mức không phải `off` sang `thinking: { type: "enabled" }`. Khi bật tư duy K2, Moonshot chỉ chấp nhận `tool_choice` `auto|none`; OpenClaw chuẩn hóa các giá trị không tương thích thành `auto`.

## Thứ tự phân giải

1. Chỉ thị nội tuyến trên tin nhắn (chỉ áp dụng cho tin nhắn đó).
2. Giá trị ghi đè của phiên (được đặt bằng cách gửi một tin nhắn chỉ chứa chỉ thị).
3. Giá trị mặc định theo tác nhân (`agents.list[].thinkingDefault` trong cấu hình).
4. Giá trị mặc định toàn cục (`agents.defaults.thinkingDefault` trong cấu hình).
5. Dự phòng: giá trị mặc định do nhà cung cấp khai báo nếu có; nếu không, các mô hình có khả năng suy luận phân giải thành `medium` hoặc mức không phải `off` gần nhất được hỗ trợ cho mô hình đó, còn các mô hình không suy luận vẫn ở `off`.

## Đặt giá trị mặc định cho phiên

- Gửi một tin nhắn **chỉ** chứa chỉ thị (cho phép khoảng trắng), ví dụ: `/think:medium` hoặc `/t high`.
- Thiết lập đó được duy trì trong phiên hiện tại (mặc định theo từng người gửi). Dùng `/think default` để xóa giá trị ghi đè của phiên và kế thừa giá trị mặc định của cấu hình/nhà cung cấp; các bí danh bao gồm `inherit`, `clear`, `reset` và `unpin`.
- `/think off` lưu một giá trị ghi đè tắt rõ ràng. Thiết lập này vô hiệu hóa tư duy cho đến khi bạn thay đổi hoặc xóa giá trị ghi đè của phiên.
- Một phản hồi xác nhận sẽ được gửi (`Thinking level set to high.` / `Thinking disabled.`). Nếu mức không hợp lệ (ví dụ: `/thinking big`), lệnh sẽ bị từ chối kèm gợi ý và trạng thái phiên không thay đổi.
- Gửi `/think` (hoặc `/think:`) mà không có đối số để xem mức tư duy hiện tại.

## Áp dụng theo tác nhân

- **OpenClaw nhúng**: mức đã phân giải được truyền tới môi trường chạy tác nhân OpenClaw trong tiến trình.
- **Phần phụ trợ Claude CLI**: các mức cụ thể không phải tắt được truyền tới Claude Code dưới dạng `--effort` khi dùng `claude-cli`; `adaptive` loại bỏ các cờ nỗ lực đã cấu hình và giao mức nỗ lực thực tế cho môi trường, thiết lập và giá trị mặc định của mô hình trong Claude Code. Xem [các phần phụ trợ CLI](/vi/gateway/cli-backends).

## Chế độ nhanh (/fast)

- Các mức: `auto|on|off|default`.
- Tin nhắn chỉ chứa chỉ thị sẽ chuyển đổi giá trị ghi đè chế độ nhanh của phiên và phản hồi `Fast mode set to auto.`, `Fast mode enabled.` hoặc `Fast mode disabled.`. Dùng `/fast default` để xóa giá trị ghi đè của phiên và kế thừa giá trị mặc định đã cấu hình; các bí danh bao gồm `inherit`, `clear`, `reset` và `unpin`.
- Gửi `/fast` (hoặc `/fast status`) mà không có chế độ để xem trạng thái chế độ nhanh hiệu lực hiện tại.
- OpenClaw phân giải chế độ nhanh theo thứ tự sau:
  1. Giá trị ghi đè `/fast auto|on|off` nội tuyến/chỉ chứa chỉ thị (`/fast default` xóa lớp này)
  2. Giá trị ghi đè của phiên
  3. Giá trị mặc định theo tác nhân (`agents.list[].fastModeDefault`)
  4. Cấu hình theo mô hình: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Dự phòng: `off`
- `auto` giữ chế độ phiên/cấu hình ở trạng thái tự động nhưng phân giải độc lập từng lệnh gọi mô hình mới. Các lệnh gọi bắt đầu trước thời điểm giới hạn tự động sẽ bật chế độ nhanh; các lệnh gọi thử lại, dự phòng, kết quả công cụ hoặc tiếp tục về sau sẽ bắt đầu với chế độ nhanh bị tắt. Thời điểm giới hạn mặc định là 60 giây; đặt `agents.defaults.models["<provider>/<model>"].params.fastAutoOnSeconds` trên mô hình đang hoạt động để thay đổi.
- Đối với `openai/*`, chế độ nhanh ánh xạ sang xử lý ưu tiên của OpenAI bằng cách gửi `service_tier=priority` trong các yêu cầu Responses được hỗ trợ.
- Đối với các mô hình `openai/*` / `openai-codex/*` dựa trên Codex, chế độ nhanh gửi cùng cờ `service_tier=priority` trong Codex Responses. Các lượt app-server Codex gốc chỉ nhận cấp dịch vụ tại `turn/start` hoặc khi bắt đầu/tiếp tục luồng, vì vậy `auto` không thể thay đổi cấp dịch vụ của một lượt app-server đang chạy; thiết lập này áp dụng cho lượt mô hình tiếp theo do OpenClaw khởi chạy.
- Đối với các yêu cầu công khai trực tiếp `anthropic/*`, bao gồm lưu lượng được xác thực bằng OAuth gửi tới `api.anthropic.com`, chế độ nhanh ánh xạ sang các cấp dịch vụ Anthropic: `/fast on` đặt `service_tier=auto`, `/fast off` đặt `service_tier=standard_only`.
- Đối với `minimax/*` trên đường dẫn tương thích với Anthropic, `/fast on` (hoặc `params.fastMode: true`) ghi lại `MiniMax-M2.7` thành `MiniMax-M2.7-highspeed`.
- Các tham số mô hình Anthropic `serviceTier` / `service_tier` được đặt rõ ràng sẽ ghi đè giá trị mặc định của chế độ nhanh khi cả hai cùng được đặt. OpenClaw vẫn bỏ qua việc chèn cấp dịch vụ Anthropic đối với các URL cơ sở proxy không phải Anthropic.
- `/status` hiển thị `Fast` khi chế độ nhanh được bật và `Fast:auto` khi chế độ đã cấu hình là tự động.

## Chỉ thị chi tiết (/verbose hoặc /v)

- Các mức: `on` (tối thiểu) | `full` | `off` (mặc định).
- Tin nhắn chỉ chứa chỉ thị sẽ chuyển đổi chế độ chi tiết của phiên và phản hồi `Verbose logging enabled.` / `Verbose logging disabled.`; mức không hợp lệ sẽ trả về gợi ý mà không thay đổi trạng thái.
- `/verbose off` lưu một giá trị ghi đè phiên tường minh; xóa giá trị này qua giao diện Sessions bằng cách chọn `inherit`.
- Người gửi được ủy quyền trên kênh bên ngoài có thể duy trì giá trị ghi đè chế độ chi tiết của phiên. Các máy khách gateway/webchat nội bộ cần `operator.admin` để duy trì giá trị này.
- Chỉ thị nội tuyến chỉ ảnh hưởng đến tin nhắn đó; nếu không, các giá trị mặc định của phiên/toàn cục sẽ được áp dụng.
- Gửi `/verbose` (hoặc `/verbose:`) mà không có đối số để xem mức chi tiết hiện tại.
- Khi bật chế độ chi tiết, các tác nhân phát ra kết quả công cụ có cấu trúc sẽ gửi lại từng lệnh gọi công cụ dưới dạng một tin nhắn riêng chỉ chứa siêu dữ liệu, với tiền tố `<emoji> <tool-name>: <arg>` khi có. Các bản tóm tắt công cụ này được gửi ngay khi từng công cụ bắt đầu (trong các bong bóng riêng), không phải dưới dạng các phần chênh lệch được truyền trực tiếp.
- Bản tóm tắt lỗi công cụ vẫn hiển thị trong chế độ thông thường, nhưng các hậu tố chi tiết lỗi thô sẽ bị ẩn trừ khi chế độ chi tiết là `full`.
- Khi chế độ chi tiết là `full`, đầu ra của công cụ cũng được chuyển tiếp sau khi hoàn tất (trong bong bóng riêng, được cắt ngắn đến độ dài an toàn). Nếu bạn chuyển đổi `/verbose on|full|off` trong khi một lượt chạy đang diễn ra, các bong bóng công cụ tiếp theo sẽ tuân theo thiết lập mới.
- `agents.defaults.toolProgressDetail` kiểm soát hình thức của các bản tóm tắt công cụ `/verbose` và các dòng công cụ trong bản nháp tiến trình. Dùng `"explain"` (mặc định) cho các nhãn ngắn gọn, dễ hiểu như `🛠️ Exec: checking JS syntax`; dùng `"raw"` khi bạn cũng muốn nối thêm lệnh/chi tiết thô để gỡ lỗi. `agents.list[].toolProgressDetail` theo từng tác nhân sẽ ghi đè giá trị mặc định.
  - `explain`: `🛠️ Exec: check JS syntax for /tmp/app.js`
  - `raw`: `🛠️ Exec: check JS syntax for /tmp/app.js, node --check /tmp/app.js`

## Chỉ thị truy vết Plugin (/trace)

- Các mức: `on` | `off` (mặc định).
- Tin nhắn chỉ chứa chỉ thị sẽ chuyển đổi đầu ra truy vết Plugin của phiên và phản hồi `Plugin trace enabled.` / `Plugin trace disabled.`.
- Chỉ thị nội tuyến chỉ ảnh hưởng đến tin nhắn đó; nếu không, các giá trị mặc định của phiên/toàn cục sẽ được áp dụng.
- Gửi `/trace` (hoặc `/trace:`) mà không có đối số để xem mức truy vết hiện tại.
- `/trace` có phạm vi hẹp hơn `/verbose`: nó chỉ hiển thị các dòng truy vết/gỡ lỗi do Plugin sở hữu, chẳng hạn như bản tóm tắt gỡ lỗi Active Memory.
- Các dòng truy vết có thể xuất hiện trong `/status` và dưới dạng một tin nhắn chẩn đoán tiếp theo sau phản hồi thông thường của trợ lý.

## Khả năng hiển thị quá trình suy luận (/reasoning)

- Các mức: `on|off|stream`.
- Tin nhắn chỉ chứa chỉ thị sẽ chuyển đổi việc các khối suy nghĩ có được hiển thị trong phản hồi hay không.
- Khi được bật, quá trình suy luận được gửi dưới dạng **tin nhắn riêng** với tiền tố `Thinking`.
- `stream`: truyền trực tiếp quá trình suy luận trong lúc phản hồi đang được tạo khi kênh đang hoạt động hỗ trợ bản xem trước quá trình suy luận, sau đó gửi câu trả lời cuối cùng không kèm quá trình suy luận.
- Bí danh: `/reason`.
- Gửi `/reasoning` (hoặc `/reasoning:`) mà không có đối số để xem mức suy luận hiện tại.
- Thứ tự phân giải: chỉ thị nội tuyến, sau đó là giá trị ghi đè của phiên, rồi giá trị mặc định theo từng tác nhân (`agents.list[].reasoningDefault`), tiếp theo là giá trị mặc định toàn cục (`agents.defaults.reasoningDefault`), rồi giá trị dự phòng (`off`).

Các thẻ suy luận của mô hình cục bộ bị sai định dạng được xử lý thận trọng. Các khối `<think>...</think>` đã đóng vẫn bị ẩn trong phản hồi thông thường, và phần suy luận chưa đóng xuất hiện sau văn bản đã hiển thị cũng bị ẩn. Nếu một phản hồi được bao bọc hoàn toàn trong một thẻ mở duy nhất chưa đóng và nếu không sẽ được gửi dưới dạng văn bản trống, OpenClaw sẽ xóa thẻ mở sai định dạng và gửi phần văn bản còn lại.

## Liên quan

- Tài liệu về chế độ nâng cao nằm tại [Chế độ nâng cao](/vi/tools/elevated).

## Heartbeat

- Nội dung thăm dò Heartbeat là lời nhắc Heartbeat đã cấu hình (mặc định: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Các chỉ thị nội tuyến trong tin nhắn Heartbeat được áp dụng như bình thường (nhưng tránh thay đổi giá trị mặc định của phiên từ Heartbeat).
- Theo mặc định, việc gửi Heartbeat chỉ chuyển tải nội dung cuối cùng. Để gửi thêm tin nhắn `Thinking` riêng biệt (khi có), hãy đặt `agents.defaults.heartbeat.includeReasoning: true` hoặc `agents.list[].heartbeat.includeReasoning: true` theo từng tác nhân.

## Giao diện trò chuyện web

- Khi trang tải, bộ chọn mức suy nghĩ của trò chuyện web phản ánh mức đã lưu của phiên từ kho lưu trữ/cấu hình phiên đầu vào.
- Việc chọn một mức khác sẽ ghi ngay giá trị ghi đè của phiên qua `sessions.patch`; thao tác này không chờ đến lần gửi tiếp theo và không phải là giá trị ghi đè `thinkingOnce` chỉ dùng một lần.
- Nếu gửi khi các thay đổi đối với bộ chọn mô hình, quá trình suy luận hoặc tốc độ vẫn đang được áp dụng, hệ thống sẽ chờ mọi bản vá bộ chọn đang chờ xử lý; nếu một thay đổi thất bại, tin nhắn sẽ không được gửi để có thể xem xét.
- Tùy chọn đầu tiên luôn là lựa chọn xóa giá trị ghi đè. Nó hiển thị `Inherited: <resolved level>`, bao gồm `Inherited: Off` khi mức suy nghĩ kế thừa bị tắt.
- Các lựa chọn tường minh trong bộ chọn sử dụng trực tiếp nhãn mức tương ứng, đồng thời giữ nguyên nhãn nhà cung cấp khi có (ví dụ: `Maximum` cho tùy chọn `max` có nhãn nhà cung cấp).
- Bộ chọn sử dụng `thinkingLevels` do hàng phiên/giá trị mặc định của gateway trả về, trong khi `thinkingOptions` được giữ lại dưới dạng danh sách nhãn cũ. Giao diện trình duyệt không duy trì danh sách biểu thức chính quy riêng cho nhà cung cấp; các Plugin sở hữu tập hợp mức dành riêng cho từng mô hình.
- `/think:<level>` vẫn hoạt động và cập nhật cùng một mức phiên đã lưu, vì vậy các chỉ thị trò chuyện và bộ chọn luôn đồng bộ.

## Hồ sơ nhà cung cấp

- Các Plugin nhà cung cấp có thể cung cấp `resolveThinkingProfile(ctx)` để xác định các mức được mô hình hỗ trợ và mức mặc định.
- Các Plugin nhà cung cấp làm proxy cho mô hình Claude nên tái sử dụng `resolveClaudeThinkingProfile(modelId)` từ `openclaw/plugin-sdk/provider-model-shared` để danh mục Anthropic trực tiếp và danh mục proxy luôn đồng bộ.
- Mỗi mức hồ sơ có một `id` chuẩn tắc được lưu (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `adaptive`, `max` hoặc `ultra`) và có thể bao gồm một `label` để hiển thị. Các nhà cung cấp nhị phân sử dụng `{ id: "low", label: "on" }`.
- Các hook hồ sơ nhận những dữ kiện danh mục đã hợp nhất khi có, bao gồm `reasoning`, `compat.thinkingFormat` và `compat.supportedReasoningEfforts`. Chỉ dùng các dữ kiện đó để cung cấp hồ sơ nhị phân hoặc tùy chỉnh khi hợp đồng yêu cầu đã cấu hình hỗ trợ nội dung tương ứng.
- Các Plugin công cụ cần xác thực một giá trị ghi đè suy nghĩ tường minh nên sử dụng `api.runtime.agent.resolveThinkingPolicy({ provider, model, agentRuntime })` cùng với `api.runtime.agent.normalizeThinkingLevel(...)`; chúng không nên duy trì danh sách mức riêng theo nhà cung cấp/mô hình. Truyền `agentRuntime` khi công cụ sở hữu đường dẫn thực thi, chẳng hạn như một lượt chạy luôn được nhúng.
- Các Plugin công cụ có quyền truy cập vào siêu dữ liệu mô hình tùy chỉnh đã cấu hình có thể truyền `catalog` vào `resolveThinkingPolicy` để các lựa chọn tham gia `compat.supportedReasoningEfforts` được phản ánh trong quá trình xác thực phía Plugin.
- Các hook cũ đã phát hành (`supportsXHighThinking`, `isBinaryThinking` và `resolveDefaultThinkingLevel`) vẫn được giữ làm bộ điều hợp tương thích, nhưng các tập hợp mức tùy chỉnh mới nên sử dụng `resolveThinkingProfile`.
- Các hàng/giá trị mặc định của Gateway cung cấp `thinkingLevels`, `thinkingOptions` và `thinkingDefault` để các máy khách ACP/trò chuyện hiển thị cùng ID và nhãn hồ sơ mà quá trình xác thực khi chạy sử dụng.
