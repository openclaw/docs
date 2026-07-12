---
read_when:
    - Điều chỉnh việc phân tích hoặc giá trị mặc định của chỉ thị về mức độ suy luận, chế độ nhanh hoặc chế độ chi tiết
summary: Cú pháp chỉ thị cho /think, /fast, /verbose, /trace và khả năng hiển thị quá trình suy luận
title: Mức độ suy luận
x-i18n:
    generated_at: "2026-07-12T08:31:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 75170dd48f83dcb3ebb70eea2b37160208618d0aae23253c82fe88ce3afbc0e2
    source_path: tools/thinking.md
    workflow: 16
---

## Chức năng

- Chỉ thị nội tuyến trong nội dung của bất kỳ tin nhắn đến nào: `/t <level>`, `/think:<level>` hoặc `/thinking <level>`.
- Các mức (bí danh): `off | minimal | low | medium | high | xhigh | adaptive | max | ultra`, gần tương ứng với thang từ khóa đặc biệt kinh điển "think" < "think hard" < "think harder" < "ultrathink" của Anthropic:
  - minimal ~ "suy nghĩ"
  - low ~ "suy nghĩ kỹ"
  - medium ~ "suy nghĩ kỹ hơn"
  - high ~ "suy nghĩ tối đa" (ngân sách tối đa)
  - xhigh ~ "suy nghĩ tối đa+" (các mô hình GPT-5.2+ và Codex, cùng mức nỗ lực của Anthropic Claude Opus 4.7+)
  - adaptive → suy nghĩ thích ứng do nhà cung cấp quản lý (được hỗ trợ cho Claude 4.6 trên Anthropic/Bedrock, Anthropic Claude Opus 4.7+ và khả năng suy nghĩ động của Google Gemini)
  - max → suy luận tối đa của nhà cung cấp (Anthropic Claude Opus 4.7+; Ollama ánh xạ mức này sang nỗ lực `think` gốc cao nhất)
  - ultra → suy luận tối đa của nhà cung cấp cộng với cơ chế chủ động điều phối tác tử phụ khi mô hình/môi trường thực thi đã chọn hỗ trợ
  - `x-high`, `x_high`, `extra-high`, `extra high` và `extra_high` ánh xạ thành `xhigh`.
  - `highest` ánh xạ thành `high`.
- Lưu ý về nhà cung cấp:
  - Các menu và bộ chọn mức suy nghĩ được điều khiển bởi hồ sơ nhà cung cấp. Plugin của nhà cung cấp khai báo chính xác tập hợp mức cho mô hình đã chọn, bao gồm các nhãn nhị phân như `on`.
  - `adaptive`, `xhigh`, `max` và `ultra` chỉ được hiển thị cho các hồ sơ nhà cung cấp/mô hình/môi trường thực thi có hỗ trợ. Chỉ thị được nhập cho mức không được hỗ trợ sẽ bị từ chối và kèm theo các tùy chọn hợp lệ của mô hình đó.
  - Các mức không được hỗ trợ đã lưu trước đó được ánh xạ lại theo thứ hạng trong hồ sơ nhà cung cấp. `adaptive` dự phòng về `medium` trên các mô hình không thích ứng, còn `xhigh` và `max` dự phòng về mức khác `off` lớn nhất mà mô hình đã chọn hỗ trợ.
  - Các mô hình Anthropic Claude 4.6 mặc định dùng `adaptive` khi không đặt mức suy nghĩ rõ ràng.
  - Anthropic Claude Opus 4.8 và Opus 4.7 giữ trạng thái tắt suy nghĩ trừ khi bạn đặt rõ một mức suy nghĩ. Mức nỗ lực mặc định do nhà cung cấp sở hữu của Opus 4.8 là `high` sau khi bật suy nghĩ thích ứng.
  - Anthropic Claude Opus 4.7+ ánh xạ `/think xhigh` thành suy nghĩ thích ứng cộng với `output_config.effort: "xhigh"`, vì `/think` là chỉ thị suy nghĩ và `xhigh` là thiết lập nỗ lực của Opus.
  - Anthropic Claude Opus 4.7+ cũng cung cấp `/think max`; mức này ánh xạ đến cùng đường dẫn nỗ lực tối đa do nhà cung cấp sở hữu.
  - Các mô hình DeepSeek V4 trực tiếp cung cấp `/think xhigh|max`; cả hai đều ánh xạ thành `reasoning_effort: "max"` của DeepSeek, trong khi các mức thấp hơn nhưng khác `off` ánh xạ thành `high`.
  - Các mô hình DeepSeek V4 được định tuyến qua OpenRouter cung cấp `/think xhigh` và gửi các giá trị `reasoning.effort` được OpenRouter hỗ trợ thay vì `reasoning_effort` cấp cao nhất gốc của DeepSeek. Các mức thấp hơn nhưng khác `off` ánh xạ thành `high`, còn giá trị ghi đè `max` đã lưu sẽ dự phòng về `xhigh`.
  - Các mô hình Ollama có khả năng suy nghĩ cung cấp `/think low|medium|high|max`; `max` ánh xạ thành `think: "high"` gốc vì API gốc của Ollama chấp nhận các chuỗi nỗ lực `low`, `medium` và `high`.
  - Các mô hình OpenAI GPT ánh xạ `/think` thông qua khả năng hỗ trợ mức nỗ lực dành riêng cho từng mô hình của Responses API. `/think off` chỉ gửi `reasoning.effort: "none"` khi mô hình đích hỗ trợ; nếu không, OpenClaw bỏ qua tải trọng suy luận đã tắt thay vì gửi một giá trị không được hỗ trợ.
  - GPT-5.6 Sol và Terra cung cấp `/think ultra` gốc thông qua môi trường thực thi Codex. GPT-5.6 Luna cung cấp các mức đến `max` vì danh mục Codex của mô hình này không công bố Ultra.
  - Môi trường thực thi OpenClaw nhúng cung cấp `/think ultra` logic cho GPT-5.6 Sol, Terra và Luna. Nó gửi mức nỗ lực tối đa của nhà cung cấp và bổ sung hướng dẫn điều phối tác tử phụ chủ động theo phạm vi lượt chạy.
  - Các mục danh mục tùy chỉnh tương thích với OpenAI có thể chọn hỗ trợ `/think xhigh` bằng cách đặt `models.providers.<provider>.models[].compat.supportedReasoningEfforts` bao gồm `"xhigh"`. Cơ chế này sử dụng cùng siêu dữ liệu tương thích dùng để ánh xạ tải trọng mức nỗ lực suy luận gửi đi của OpenAI, nhờ đó menu, xác thực phiên, CLI của tác tử và `llm-task` nhất quán với hành vi truyền tải.
  - Các tham chiếu OpenRouter Hunter Alpha đã ngừng hoạt động nhưng vẫn còn trong cấu hình sẽ bỏ qua việc chèn suy luận qua proxy vì tuyến đã ngừng này có thể trả về văn bản câu trả lời cuối cùng qua các trường suy luận.
  - Google Gemini ánh xạ `/think adaptive` thành khả năng suy nghĩ động do nhà cung cấp Gemini sở hữu. Yêu cầu Gemini 3 bỏ qua `thinkingLevel` cố định, còn yêu cầu Gemini 2.5 gửi `thinkingBudget: -1`; các mức cố định vẫn ánh xạ đến `thinkingLevel` hoặc ngân sách Gemini gần nhất cho họ mô hình đó.
  - MiniMax M2.x (`minimax/MiniMax-M2*`) trên đường dẫn truyền phát tương thích với Anthropic mặc định dùng `thinking: { type: "disabled" }` trừ khi bạn đặt rõ mức suy nghĩ trong tham số mô hình hoặc tham số yêu cầu. Điều này tránh làm rò rỉ các delta `reasoning_content` từ định dạng luồng Anthropic không gốc của M2.x. MiniMax-M3 (và M3.x) được miễn trừ: M3 phát ra các khối suy nghĩ Anthropic đúng chuẩn và trả về nội dung rỗng khi suy nghĩ bị tắt, vì vậy OpenClaw giữ M3 trên đường dẫn suy nghĩ bị lược bỏ/thích ứng của nhà cung cấp.
  - Z.AI (`zai/*`) sử dụng chế độ nhị phân (`on`/`off`) cho hầu hết các mô hình GLM. GLM-5.2 là ngoại lệ: mô hình này cung cấp `/think off|low|high|max`, ánh xạ `low` và `high` thành `reasoning_effort: "high"` của Z.AI, đồng thời ánh xạ `max` thành `reasoning_effort: "max"`.
  - Moonshot Kimi K2.7 Code (`moonshot/kimi-k2.7-code`) luôn suy nghĩ. Hồ sơ của mô hình này chỉ cung cấp `on`, và OpenClaw bỏ qua trường `thinking` gửi đi theo yêu cầu của Moonshot. Các mô hình `moonshot/*` khác ánh xạ `/think off` thành `thinking: { type: "disabled" }` và mọi mức khác `off` thành `thinking: { type: "enabled" }`. Khi bật suy nghĩ, Moonshot chỉ chấp nhận `tool_choice` là `auto|none`; OpenClaw chuẩn hóa các giá trị không tương thích thành `auto`.

## Thứ tự phân giải

1. Chỉ thị nội tuyến trong tin nhắn (chỉ áp dụng cho tin nhắn đó).
2. Giá trị ghi đè của phiên (được đặt bằng cách gửi một tin nhắn chỉ chứa chỉ thị).
3. Giá trị mặc định theo tác tử (`agents.list[].thinkingDefault` trong cấu hình).
4. Giá trị mặc định toàn cục (`agents.defaults.thinkingDefault` trong cấu hình).
5. Dự phòng: giá trị mặc định do nhà cung cấp khai báo nếu có; nếu không, các mô hình có khả năng suy luận sẽ phân giải thành `medium` hoặc mức khác `off` gần nhất mà mô hình đó hỗ trợ, còn các mô hình không có khả năng suy luận vẫn ở `off`.

## Đặt giá trị mặc định cho phiên

- Gửi một tin nhắn **chỉ** chứa chỉ thị (cho phép khoảng trắng), ví dụ `/think:medium` hoặc `/t high`.
- Thiết lập đó được giữ cho phiên hiện tại (mặc định theo từng người gửi). Dùng `/think default` để xóa giá trị ghi đè của phiên và kế thừa giá trị mặc định trong cấu hình/của nhà cung cấp; các bí danh gồm `inherit`, `clear`, `reset` và `unpin`.
- `/think off` lưu một giá trị ghi đè tắt rõ ràng. Nó tắt suy nghĩ cho đến khi bạn thay đổi hoặc xóa giá trị ghi đè của phiên.
- Một phản hồi xác nhận sẽ được gửi (`Đã đặt mức suy nghĩ thành cao.` / `Đã tắt suy nghĩ.`). Nếu mức không hợp lệ (ví dụ `/thinking big`), lệnh sẽ bị từ chối kèm gợi ý và trạng thái phiên không thay đổi.
- Gửi `/think` (hoặc `/think:`) không kèm đối số để xem mức suy nghĩ hiện tại.

## Cách tác tử áp dụng

- **OpenClaw nhúng**: mức đã phân giải được chuyển đến môi trường thực thi tác tử OpenClaw trong tiến trình.
- **Phần phụ trợ Claude CLI**: khi dùng `claude-cli`, các mức cụ thể khác `off` được chuyển đến Claude Code dưới dạng `--effort`; `adaptive` loại bỏ các cờ mức nỗ lực đã cấu hình và giao mức nỗ lực thực tế cho môi trường, thiết lập và giá trị mặc định của mô hình trong Claude Code. Xem [các phần phụ trợ CLI](/vi/gateway/cli-backends).

## Chế độ nhanh (/fast)

- Các mức: `auto|on|off|default`.
- Tin nhắn chỉ chứa chỉ thị sẽ chuyển đổi giá trị ghi đè chế độ nhanh của phiên và phản hồi `Đã đặt chế độ nhanh thành tự động.`, `Đã bật chế độ nhanh.` hoặc `Đã tắt chế độ nhanh.`. Dùng `/fast default` để xóa giá trị ghi đè của phiên và kế thừa giá trị mặc định trong cấu hình; các bí danh gồm `inherit`, `clear`, `reset` và `unpin`.
- Gửi `/fast` (hoặc `/fast status`) không kèm chế độ để xem trạng thái chế độ nhanh có hiệu lực hiện tại.
- OpenClaw phân giải chế độ nhanh theo thứ tự sau:
  1. Giá trị ghi đè `/fast auto|on|off` nội tuyến/chỉ chứa chỉ thị (`/fast default` xóa lớp này)
  2. Giá trị ghi đè của phiên
  3. Giá trị mặc định theo tác tử (`agents.list[].fastModeDefault`)
  4. Cấu hình theo mô hình: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Dự phòng: `off`
- `auto` giữ chế độ phiên/cấu hình ở trạng thái tự động nhưng phân giải độc lập từng lần gọi mô hình mới. Các lần gọi bắt đầu trước ngưỡng thời gian tự động sẽ bật chế độ nhanh; các lần gọi thử lại, dự phòng, nhận kết quả công cụ hoặc tiếp tục sau đó sẽ bắt đầu với chế độ nhanh bị tắt. Ngưỡng mặc định là 60 giây; đặt `agents.defaults.models["<provider>/<model>"].params.fastAutoOnSeconds` trên mô hình đang hoạt động để thay đổi.
- Với `openai/*`, chế độ nhanh ánh xạ sang xử lý ưu tiên của OpenAI bằng cách gửi `service_tier=priority` trên các yêu cầu Responses được hỗ trợ.
- Với các mô hình `openai/*` / `openai-codex/*` dùng Codex làm phần phụ trợ, chế độ nhanh gửi cùng cờ `service_tier=priority` trên Codex Responses. Các lượt app-server Codex gốc chỉ nhận cấp dịch vụ tại `turn/start` hoặc khi bắt đầu/tiếp tục luồng, vì vậy `auto` không thể thay đổi cấp của một lượt app-server đang chạy; nó áp dụng cho lượt mô hình tiếp theo mà OpenClaw bắt đầu.
- Với các yêu cầu công khai trực tiếp `anthropic/*`, bao gồm lưu lượng đã xác thực bằng OAuth gửi đến `api.anthropic.com`, chế độ nhanh ánh xạ sang các cấp dịch vụ Anthropic: `/fast on` đặt `service_tier=auto`, `/fast off` đặt `service_tier=standard_only`.
- Với `minimax/*` trên đường dẫn tương thích với Anthropic, `/fast on` (hoặc `params.fastMode: true`) viết lại `MiniMax-M2.7` thành `MiniMax-M2.7-highspeed`.
- Các tham số mô hình Anthropic `serviceTier` / `service_tier` được đặt rõ ràng sẽ ghi đè giá trị mặc định của chế độ nhanh khi cả hai cùng được đặt. OpenClaw vẫn bỏ qua việc chèn cấp dịch vụ Anthropic cho các URL cơ sở proxy không thuộc Anthropic.
- `/status` hiển thị `Nhanh` khi chế độ nhanh được bật và `Nhanh:tự động` khi chế độ đã cấu hình là tự động.

## Chỉ thị chi tiết (/verbose hoặc /v)

- Các mức: `on` (tối thiểu) | `full` | `off` (mặc định).
- Tin nhắn chỉ chứa chỉ thị sẽ chuyển đổi chế độ chi tiết của phiên và phản hồi `Đã bật ghi nhật ký chi tiết.` / `Đã tắt ghi nhật ký chi tiết.`; mức không hợp lệ sẽ trả về gợi ý mà không thay đổi trạng thái.
- `/verbose off` lưu một giá trị ghi đè phiên rõ ràng; xóa giá trị này qua giao diện Phiên bằng cách chọn `inherit`.
- Người gửi qua kênh bên ngoài được cấp quyền có thể duy trì giá trị ghi đè chế độ chi tiết của phiên. Các máy khách gateway/webchat nội bộ cần `operator.admin` để duy trì giá trị này.
- Chỉ thị nội tuyến chỉ ảnh hưởng đến tin nhắn đó; nếu không, các giá trị mặc định của phiên/toàn cục sẽ được áp dụng.
- Gửi `/verbose` (hoặc `/verbose:`) không kèm đối số để xem mức chi tiết hiện tại.
- Khi bật chế độ chi tiết, các tác tử phát ra kết quả công cụ có cấu trúc sẽ gửi lại mỗi lần gọi công cụ dưới dạng một tin nhắn riêng chỉ chứa siêu dữ liệu, với tiền tố `<emoji> <tool-name>: <arg>` nếu có. Các bản tóm tắt công cụ này được gửi ngay khi từng công cụ bắt đầu (các bong bóng riêng biệt), không phải dưới dạng delta truyền phát.
- Bản tóm tắt lỗi công cụ vẫn hiển thị ở chế độ bình thường, nhưng hậu tố chi tiết lỗi thô bị ẩn trừ khi chế độ chi tiết là `full`.
- Khi chế độ chi tiết là `full`, đầu ra công cụ cũng được chuyển tiếp sau khi hoàn tất (bong bóng riêng biệt, được cắt ngắn đến độ dài an toàn). Nếu bạn chuyển đổi `/verbose on|full|off` trong khi một lượt chạy đang diễn ra, các bong bóng công cụ tiếp theo sẽ tuân theo thiết lập mới.
- `agents.defaults.toolProgressDetail` kiểm soát hình thức của bản tóm tắt công cụ `/verbose` và các dòng công cụ trong bản nháp tiến trình. Dùng `"explain"` (mặc định) để có các nhãn ngắn gọn, dễ hiểu như `🛠️ Thực thi: đang kiểm tra cú pháp JS`; dùng `"raw"` khi bạn cũng muốn nối thêm lệnh/chi tiết thô để gỡ lỗi. `agents.list[].toolProgressDetail` theo từng tác tử sẽ ghi đè giá trị mặc định.
  - `explain`: `🛠️ Thực thi: kiểm tra cú pháp JS cho /tmp/app.js`
  - `raw`: `🛠️ Thực thi: kiểm tra cú pháp JS cho /tmp/app.js, node --check /tmp/app.js`

## Chỉ thị theo dõi Plugin (/trace)

- Các mức: `on` | `off` (mặc định).
- Tin nhắn chỉ chứa chỉ thị sẽ chuyển đổi đầu ra theo dõi Plugin của phiên và phản hồi `Đã bật theo dõi Plugin.` / `Đã tắt theo dõi Plugin.`.
- Chỉ thị nội tuyến chỉ ảnh hưởng đến tin nhắn đó; nếu không, các giá trị mặc định của phiên/toàn cục sẽ được áp dụng.
- Gửi `/trace` (hoặc `/trace:`) không kèm đối số để xem mức theo dõi hiện tại.
- `/trace` có phạm vi hẹp hơn `/verbose`: nó chỉ hiển thị các dòng theo dõi/gỡ lỗi do Plugin sở hữu, chẳng hạn như bản tóm tắt gỡ lỗi Active Memory.
- Các dòng theo dõi có thể xuất hiện trong `/status` và dưới dạng tin nhắn chẩn đoán tiếp theo sau phản hồi thông thường của trợ lý.

## Khả năng hiển thị suy luận (/reasoning)

- Các mức: `on|off|stream`.
- Tin nhắn chỉ chứa chỉ thị sẽ bật hoặc tắt việc hiển thị các khối suy nghĩ trong câu trả lời.
- Khi được bật, phần lập luận được gửi dưới dạng **một tin nhắn riêng biệt** có tiền tố `Thinking`.
- `stream`: truyền trực tiếp phần lập luận trong khi câu trả lời đang được tạo nếu kênh đang hoạt động hỗ trợ xem trước phần lập luận, sau đó gửi câu trả lời cuối cùng không kèm phần lập luận.
- Bí danh: `/reason`.
- Gửi `/reasoning` (hoặc `/reasoning:`) không kèm đối số để xem mức lập luận hiện tại.
- Thứ tự phân giải: chỉ thị nội tuyến, sau đó là giá trị ghi đè của phiên, rồi giá trị mặc định theo tác nhân (`agents.list[].reasoningDefault`), tiếp theo là giá trị mặc định toàn cục (`agents.defaults.reasoningDefault`), rồi giá trị dự phòng (`off`).

Các thẻ lập luận không đúng định dạng của mô hình cục bộ được xử lý thận trọng. Các khối `<think>...</think>` đã đóng vẫn bị ẩn trong câu trả lời thông thường, và phần lập luận chưa đóng xuất hiện sau văn bản đã hiển thị cũng bị ẩn. Nếu toàn bộ câu trả lời được bọc trong một thẻ mở duy nhất chưa đóng và nếu không thì sẽ được gửi dưới dạng văn bản trống, OpenClaw sẽ xóa thẻ mở không đúng định dạng và gửi phần văn bản còn lại.

## Liên quan

- Tài liệu về chế độ đặc quyền nằm tại [Chế độ đặc quyền](/vi/tools/elevated).

## Heartbeat

- Nội dung thăm dò Heartbeat là lời nhắc Heartbeat đã cấu hình (mặc định: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Các chỉ thị nội tuyến trong tin nhắn Heartbeat được áp dụng như bình thường (nhưng tránh thay đổi giá trị mặc định của phiên từ Heartbeat).
- Theo mặc định, Heartbeat chỉ gửi tải trọng cuối cùng. Để gửi thêm tin nhắn `Thinking` riêng biệt (khi có), hãy đặt `agents.defaults.heartbeat.includeReasoning: true` hoặc `agents.list[].heartbeat.includeReasoning: true` theo từng tác nhân.

## Giao diện trò chuyện web

- Khi trang tải, bộ chọn mức suy nghĩ của trò chuyện web phản ánh mức được lưu của phiên từ kho lưu trữ/cấu hình phiên nhận vào.
- Việc chọn mức khác sẽ ghi ngay giá trị ghi đè của phiên thông qua `sessions.patch`; thao tác này không chờ lần gửi tiếp theo và không phải là giá trị ghi đè `thinkingOnce` chỉ dùng một lần.
- Nếu gửi trong khi các thay đổi đối với bộ chọn mô hình, mức lập luận hoặc tốc độ vẫn đang được áp dụng, hệ thống sẽ chờ mọi bản vá bộ chọn đang chờ xử lý; nếu một thay đổi thất bại, tin nhắn sẽ không được gửi để người dùng xem xét.
- Tùy chọn đầu tiên luôn là lựa chọn xóa giá trị ghi đè. Tùy chọn này hiển thị `Inherited: <resolved level>`, bao gồm `Inherited: Off` khi mức suy nghĩ kế thừa bị tắt.
- Các lựa chọn rõ ràng trong bộ chọn sử dụng trực tiếp nhãn mức tương ứng, đồng thời giữ nguyên nhãn của nhà cung cấp nếu có (ví dụ: `Maximum` cho tùy chọn `max` được nhà cung cấp gắn nhãn).
- Bộ chọn sử dụng `thinkingLevels` do hàng phiên/giá trị mặc định của Gateway trả về, còn `thinkingOptions` được giữ lại làm danh sách nhãn cũ. Giao diện trình duyệt không duy trì danh sách biểu thức chính quy riêng cho nhà cung cấp; các Plugin sở hữu tập hợp mức dành riêng cho mô hình.
- `/think:<level>` vẫn hoạt động và cập nhật cùng mức phiên đã lưu, nhờ đó các chỉ thị trò chuyện và bộ chọn luôn đồng bộ.

## Hồ sơ nhà cung cấp

- Các Plugin nhà cung cấp có thể cung cấp `resolveThinkingProfile(ctx)` để xác định các mức được mô hình hỗ trợ và mức mặc định.
- Các Plugin nhà cung cấp làm proxy cho mô hình Claude nên tái sử dụng `resolveClaudeThinkingProfile(modelId)` từ `openclaw/plugin-sdk/provider-model-shared` để danh mục Anthropic trực tiếp và danh mục proxy luôn đồng nhất.
- Mỗi mức hồ sơ có một `id` chính tắc được lưu (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `adaptive`, `max` hoặc `ultra`) và có thể bao gồm `label` hiển thị. Các nhà cung cấp nhị phân sử dụng `{ id: "low", label: "on" }`.
- Các hook hồ sơ nhận các thông tin danh mục đã hợp nhất khi có, bao gồm `reasoning`, `compat.thinkingFormat` và `compat.supportedReasoningEfforts`. Chỉ sử dụng những thông tin này để cung cấp hồ sơ nhị phân hoặc tùy chỉnh khi hợp đồng yêu cầu đã cấu hình hỗ trợ tải trọng tương ứng.
- Các Plugin công cụ cần xác thực một giá trị ghi đè mức suy nghĩ rõ ràng nên sử dụng `api.runtime.agent.resolveThinkingPolicy({ provider, model, agentRuntime })` cùng với `api.runtime.agent.normalizeThinkingLevel(...)`; chúng không nên duy trì danh sách mức riêng cho nhà cung cấp/mô hình. Hãy truyền `agentRuntime` khi công cụ sở hữu đường dẫn thực thi, chẳng hạn như một lần chạy luôn được nhúng.
- Các Plugin công cụ có quyền truy cập siêu dữ liệu mô hình tùy chỉnh đã cấu hình có thể truyền `catalog` vào `resolveThinkingPolicy` để các tùy chọn tham gia `compat.supportedReasoningEfforts` được phản ánh trong quá trình xác thực phía Plugin.
- Các hook cũ đã phát hành (`supportsXHighThinking`, `isBinaryThinking` và `resolveDefaultThinkingLevel`) vẫn được duy trì dưới dạng bộ điều hợp tương thích, nhưng các tập hợp mức tùy chỉnh mới nên sử dụng `resolveThinkingProfile`.
- Các hàng/giá trị mặc định của Gateway cung cấp `thinkingLevels`, `thinkingOptions` và `thinkingDefault` để các ứng dụng khách ACP/trò chuyện hiển thị cùng các mã định danh và nhãn hồ sơ mà quá trình xác thực thời gian chạy sử dụng.
