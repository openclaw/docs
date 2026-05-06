---
read_when:
    - Chẩn đoán việc luân phiên hồ sơ xác thực, thời gian chờ hồi hoặc hành vi dự phòng mô hình
    - Cập nhật quy tắc chuyển đổi dự phòng cho hồ sơ xác thực hoặc mô hình
    - Tìm hiểu cách các ghi đè mô hình theo phiên tương tác với các lần thử lại dự phòng
sidebarTitle: Model failover
summary: Cách OpenClaw luân phiên hồ sơ xác thực và chuyển dự phòng giữa các mô hình
title: Chuyển đổi dự phòng mô hình
x-i18n:
    generated_at: "2026-05-06T09:08:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: f9a77ec2bd4a959db5a56e53b002b8bc5ea9a2efe3c914da61ac8d25de41d6c1
    source_path: concepts/model-failover.md
    workflow: 16
---

OpenClaw xử lý lỗi theo hai giai đoạn:

1. **Luân phiên hồ sơ xác thực** trong nhà cung cấp hiện tại.
2. **Dự phòng mô hình** sang mô hình tiếp theo trong `agents.defaults.model.fallbacks`.

Tài liệu này giải thích các quy tắc thời gian chạy và dữ liệu hỗ trợ chúng.

## Luồng thời gian chạy

Với một lượt chạy văn bản thông thường, OpenClaw đánh giá các ứng viên theo thứ tự này:

<Steps>
  <Step title="Phân giải trạng thái phiên">
    Phân giải mô hình phiên đang hoạt động và tùy chọn hồ sơ xác thực.
  </Step>
  <Step title="Xây dựng chuỗi ứng viên">
    Xây dựng chuỗi ứng viên mô hình từ lựa chọn mô hình hiện tại và chính sách dự phòng cho nguồn lựa chọn đó. Các mặc định đã cấu hình, mô hình chính của tác vụ cron và mô hình dự phòng được tự động chọn có thể dùng các dự phòng đã cấu hình; lựa chọn phiên rõ ràng của người dùng thì nghiêm ngặt.
  </Step>
  <Step title="Thử nhà cung cấp hiện tại">
    Thử nhà cung cấp hiện tại với các quy tắc luân phiên/tạm ngưng hồ sơ xác thực.
  </Step>
  <Step title="Chuyển tiếp khi gặp lỗi đủ điều kiện chuyển dự phòng">
    Nếu nhà cung cấp đó đã cạn lựa chọn với một lỗi đủ điều kiện chuyển dự phòng, chuyển sang ứng viên mô hình tiếp theo.
  </Step>
  <Step title="Lưu ghi đè dự phòng">
    Lưu ghi đè dự phòng đã chọn trước khi bắt đầu thử lại để các trình đọc phiên khác thấy cùng nhà cung cấp/mô hình mà trình chạy sắp dùng. Ghi đè mô hình đã lưu được đánh dấu `modelOverrideSource: "auto"`.
  </Step>
  <Step title="Khôi phục hẹp khi thất bại">
    Nếu ứng viên dự phòng thất bại, chỉ khôi phục các trường ghi đè phiên thuộc sở hữu của dự phòng khi chúng vẫn khớp với ứng viên đã thất bại đó.
  </Step>
  <Step title="Ném FallbackSummaryError nếu cạn lựa chọn">
    Nếu mọi ứng viên đều thất bại, ném `FallbackSummaryError` với chi tiết theo từng lần thử và thời điểm hết tạm ngưng sớm nhất khi biết được.
  </Step>
</Steps>

Điều này cố ý hẹp hơn so với "lưu và khôi phục toàn bộ phiên". Trình chạy trả lời chỉ lưu các trường lựa chọn mô hình mà nó sở hữu cho dự phòng:

- `providerOverride`
- `modelOverride`
- `modelOverrideSource`
- `authProfileOverride`
- `authProfileOverrideSource`
- `authProfileOverrideCompactionCount`

Điều đó ngăn một lần thử lại dự phòng thất bại ghi đè các thay đổi phiên không liên quan mới hơn, chẳng hạn như thay đổi `/model` thủ công hoặc cập nhật luân phiên phiên xảy ra trong khi lần thử đang chạy.

## Chính sách nguồn lựa chọn

OpenClaw tách nhà cung cấp/mô hình đã chọn khỏi lý do nó được chọn. Nguồn đó kiểm soát việc chuỗi dự phòng có được phép dùng hay không:

- **Mặc định đã cấu hình**: `agents.defaults.model.primary` dùng `agents.defaults.model.fallbacks`.
- **Mô hình chính của tác nhân**: `agents.list[].model` nghiêm ngặt trừ khi đối tượng mô hình của tác nhân đó bao gồm `fallbacks` riêng. Dùng `fallbacks: []` để làm rõ hành vi nghiêm ngặt, hoặc cung cấp danh sách không rỗng để bật dự phòng mô hình cho tác nhân đó.
- **Ghi đè dự phòng tự động**: một dự phòng thời gian chạy ghi `providerOverride`, `modelOverride`, và `modelOverrideSource: "auto"` trước khi thử lại. Ghi đè tự động đó có thể tiếp tục đi theo chuỗi dự phòng đã cấu hình và được xóa bởi `/new`, `/reset`, và `sessions.reset`.
- **Ghi đè phiên của người dùng**: `/model`, bộ chọn mô hình, `session_status(model=...)`, và `sessions.patch` ghi `modelOverrideSource: "user"`. Đó là lựa chọn phiên chính xác. Nếu nhà cung cấp/mô hình đã chọn thất bại trước khi tạo câu trả lời, OpenClaw báo lỗi thay vì trả lời từ một dự phòng đã cấu hình không liên quan.
- **Ghi đè phiên cũ**: các mục phiên cũ hơn có thể có `modelOverride` mà không có `modelOverrideSource`. OpenClaw xem chúng là ghi đè của người dùng để một lựa chọn cũ rõ ràng không bị âm thầm chuyển thành hành vi dự phòng.
- **Mô hình trong tải trọng Cron**: `payload.model` / `--model` của một tác vụ cron là mô hình chính của tác vụ, không phải ghi đè phiên của người dùng. Nó dùng các dự phòng đã cấu hình trừ khi tác vụ cung cấp `payload.fallbacks`; `payload.fallbacks: []` làm cho lượt chạy cron nghiêm ngặt.

## Lưu trữ xác thực (khóa + OAuth)

OpenClaw dùng **hồ sơ xác thực** cho cả khóa API và token OAuth.

- Bí mật nằm trong `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (cũ: `~/.openclaw/agent/auth-profiles.json`).
- Trạng thái định tuyến xác thực thời gian chạy nằm trong `~/.openclaw/agents/<agentId>/agent/auth-state.json`.
- Cấu hình `auth.profiles` / `auth.order` chỉ là **siêu dữ liệu + định tuyến** (không có bí mật).
- Tệp OAuth cũ chỉ để nhập: `~/.openclaw/credentials/oauth.json` (được nhập vào `auth-profiles.json` trong lần dùng đầu tiên).

Chi tiết hơn: [OAuth](/vi/concepts/oauth)

Loại thông tin xác thực:

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }` (+ `projectId`/`enterpriseUrl` cho một số nhà cung cấp)

## ID hồ sơ

Đăng nhập OAuth tạo các hồ sơ riêng biệt để nhiều tài khoản có thể cùng tồn tại.

- Mặc định: `provider:default` khi không có email.
- OAuth có email: `provider:<email>` (ví dụ `google-antigravity:user@gmail.com`).

Hồ sơ nằm trong `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` dưới `profiles`.

## Thứ tự luân phiên

Khi một nhà cung cấp có nhiều hồ sơ, OpenClaw chọn thứ tự như sau:

<Steps>
  <Step title="Cấu hình rõ ràng">
    `auth.order[provider]` (nếu được đặt).
  </Step>
  <Step title="Hồ sơ đã cấu hình">
    `auth.profiles` được lọc theo nhà cung cấp.
  </Step>
  <Step title="Hồ sơ đã lưu">
    Các mục trong `auth-profiles.json` cho nhà cung cấp.
  </Step>
</Steps>

Nếu không có thứ tự rõ ràng được cấu hình, OpenClaw dùng thứ tự vòng tròn:

- **Khóa chính:** loại hồ sơ (**OAuth trước khóa API**).
- **Khóa phụ:** `usageStats.lastUsed` (cũ nhất trước, trong từng loại).
- **Hồ sơ đang tạm ngưng/bị vô hiệu hóa** được chuyển xuống cuối, sắp xếp theo thời điểm hết hạn sớm nhất.

### Tính bám dính của phiên (thân thiện với bộ đệm)

OpenClaw **ghim hồ sơ xác thực đã chọn theo từng phiên** để giữ ấm bộ đệm của nhà cung cấp. Nó **không** luân phiên trên mọi yêu cầu. Hồ sơ đã ghim được dùng lại cho đến khi:

- phiên được đặt lại (`/new` / `/reset`)
- một lần Compaction hoàn tất (số đếm Compaction tăng)
- hồ sơ đang tạm ngưng/bị vô hiệu hóa

Lựa chọn thủ công qua `/model …@<profileId>` đặt một **ghi đè của người dùng** cho phiên đó và không được tự động luân phiên cho đến khi phiên mới bắt đầu.

<Note>
Hồ sơ được tự động ghim (do bộ định tuyến phiên chọn) được xem là một **tùy chọn ưu tiên**: chúng được thử trước, nhưng OpenClaw có thể luân phiên sang hồ sơ khác khi gặp giới hạn tốc độ/hết thời gian chờ. Hồ sơ do người dùng ghim vẫn khóa vào hồ sơ đó; nếu nó thất bại và dự phòng mô hình đã được cấu hình, OpenClaw chuyển sang mô hình tiếp theo thay vì đổi hồ sơ.
</Note>

### Vì sao OAuth có thể "trông như bị mất"

Nếu bạn có cả hồ sơ OAuth và hồ sơ khóa API cho cùng một nhà cung cấp, vòng tròn có thể chuyển đổi giữa chúng qua các tin nhắn trừ khi đã ghim. Để buộc dùng một hồ sơ duy nhất:

- Ghim bằng `auth.order[provider] = ["provider:profileId"]`, hoặc
- Dùng ghi đè theo phiên qua `/model …` với ghi đè hồ sơ (khi bề mặt UI/chat của bạn hỗ trợ).

## Tạm ngưng

Khi một hồ sơ thất bại do lỗi xác thực/giới hạn tốc độ (hoặc hết thời gian chờ trông giống giới hạn tốc độ), OpenClaw đánh dấu hồ sơ đó là đang tạm ngưng và chuyển sang hồ sơ tiếp theo.

<AccordionGroup>
  <Accordion title="Nội dung được xếp vào nhóm giới hạn tốc độ / hết thời gian chờ">
    Nhóm giới hạn tốc độ đó rộng hơn `429` thông thường: nó cũng bao gồm các thông báo nhà cung cấp như `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded`, `throttled`, `resource exhausted`, và các giới hạn cửa sổ sử dụng định kỳ như `weekly/monthly limit reached`.

    Lỗi định dạng/yêu cầu không hợp lệ (ví dụ lỗi xác thực ID lệnh gọi công cụ của Cloud Code Assist) được xem là đủ điều kiện chuyển dự phòng và dùng cùng các khoảng tạm ngưng. Lỗi lý do dừng tương thích OpenAI như `Unhandled stop reason: error`, `stop reason: error`, và `reason: error` được phân loại là tín hiệu hết thời gian chờ/chuyển dự phòng.

    Văn bản máy chủ chung cũng có thể rơi vào nhóm hết thời gian chờ đó khi nguồn khớp với một mẫu tạm thời đã biết. Ví dụ, thông báo trình bọc luồng pi-ai trần `An unknown error occurred` được xem là đủ điều kiện chuyển dự phòng cho mọi nhà cung cấp vì pi-ai phát ra thông báo đó khi luồng nhà cung cấp kết thúc với `stopReason: "aborted"` hoặc `stopReason: "error"` mà không có chi tiết cụ thể. Tải trọng JSON `api_error` với văn bản máy chủ tạm thời như `internal server error`, `unknown error, 520`, `upstream error`, hoặc `backend error` cũng được xem là hết thời gian chờ đủ điều kiện chuyển dự phòng.

    Văn bản thượng nguồn chung riêng của OpenRouter như `Provider returned error` trần chỉ được xem là hết thời gian chờ khi ngữ cảnh nhà cung cấp thực sự là OpenRouter. Văn bản dự phòng nội bộ chung như `LLM request failed with an unknown error.` vẫn thận trọng và tự nó không kích hoạt chuyển dự phòng.

  </Accordion>
  <Accordion title="Giới hạn retry-after của SDK">
    Một số SDK của nhà cung cấp có thể ngủ trong một khoảng `Retry-After` dài trước khi trả quyền điều khiển về OpenClaw. Với các SDK dựa trên Stainless như Anthropic và OpenAI, OpenClaw mặc định giới hạn thời gian chờ `retry-after-ms` / `retry-after` nội bộ SDK ở 60 giây và hiển thị ngay các phản hồi có thể thử lại dài hơn để đường dẫn chuyển dự phòng này có thể chạy. Điều chỉnh hoặc tắt giới hạn bằng `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS`; xem [Hành vi thử lại](/vi/concepts/retry).
  </Accordion>
  <Accordion title="Tạm ngưng theo phạm vi mô hình">
    Tạm ngưng giới hạn tốc độ cũng có thể theo phạm vi mô hình:

    - OpenClaw ghi `cooldownModel` cho lỗi giới hạn tốc độ khi biết ID mô hình thất bại.
    - Một mô hình cùng cấp trên cùng nhà cung cấp vẫn có thể được thử khi tạm ngưng được giới hạn trong phạm vi một mô hình khác.
    - Cửa sổ thanh toán/bị vô hiệu hóa vẫn chặn toàn bộ hồ sơ trên các mô hình.

  </Accordion>
</AccordionGroup>

Tạm ngưng dùng lùi theo hàm mũ:

- 1 phút
- 5 phút
- 25 phút
- 1 giờ (giới hạn)

Trạng thái được lưu trong `auth-state.json` dưới `usageStats`:

```json
{
  "usageStats": {
    "provider:profile": {
      "lastUsed": 1736160000000,
      "cooldownUntil": 1736160600000,
      "errorCount": 2
    }
  }
}
```

## Vô hiệu hóa do thanh toán

Lỗi thanh toán/tín dụng (ví dụ "insufficient credits" / "credit balance too low") được xem là đủ điều kiện chuyển dự phòng, nhưng thường không phải tạm thời. Thay vì tạm ngưng ngắn, OpenClaw đánh dấu hồ sơ là **bị vô hiệu hóa** (với lùi lâu hơn) và luân phiên sang hồ sơ/nhà cung cấp tiếp theo.

<Note>
Không phải mọi phản hồi có dạng thanh toán đều là `402`, và không phải mọi HTTP `402` đều rơi vào đây. OpenClaw giữ văn bản thanh toán rõ ràng trong làn thanh toán ngay cả khi nhà cung cấp trả về `401` hoặc `403`, nhưng các bộ khớp riêng của nhà cung cấp vẫn được giới hạn trong phạm vi nhà cung cấp sở hữu chúng (ví dụ OpenRouter `403 Key limit exceeded`).

Trong khi đó, lỗi `402` tạm thời về cửa sổ sử dụng và giới hạn chi tiêu tổ chức/không gian làm việc được phân loại là `rate_limit` khi thông báo trông có thể thử lại (ví dụ `weekly usage limit exhausted`, `daily limit reached, resets tomorrow`, hoặc `organization spending limit exceeded`). Chúng vẫn đi trên đường dẫn tạm ngưng/chuyển dự phòng ngắn thay vì đường dẫn vô hiệu hóa do thanh toán dài.
</Note>

Trạng thái được lưu trong `auth-state.json`:

```json
{
  "usageStats": {
    "provider:profile": {
      "disabledUntil": 1736178000000,
      "disabledReason": "billing"
    }
  }
}
```

Mặc định:

- Lùi do thanh toán bắt đầu ở **5 giờ**, tăng gấp đôi theo mỗi lỗi thanh toán, và giới hạn ở **24 giờ**.
- Bộ đếm lùi được đặt lại nếu hồ sơ không thất bại trong **24 giờ** (có thể cấu hình).
- Thử lại do quá tải cho phép **1 lần luân phiên hồ sơ cùng nhà cung cấp** trước khi dự phòng mô hình.
- Thử lại do quá tải mặc định dùng **0 ms lùi**.

## Dự phòng mô hình

Nếu tất cả hồ sơ cho một nhà cung cấp đều thất bại, OpenClaw chuyển sang mô hình tiếp theo trong `agents.defaults.model.fallbacks`. Điều này áp dụng cho lỗi xác thực, giới hạn tốc độ và hết thời gian chờ đã cạn luân phiên hồ sơ (các lỗi khác không chuyển tiếp dự phòng). Lỗi nhà cung cấp không lộ đủ chi tiết vẫn được gắn nhãn chính xác trong trạng thái dự phòng: `empty_response` nghĩa là nhà cung cấp không trả về thông điệp hoặc trạng thái dùng được, `no_error_details` nghĩa là nhà cung cấp trả về rõ ràng `Unknown error (no error details in response)`, và `unclassified` nghĩa là OpenClaw đã giữ lại bản xem trước thô nhưng chưa có bộ phân loại nào khớp.

Các lỗi quá tải và giới hạn tốc độ được xử lý quyết liệt hơn so với thời gian chờ do thanh toán. Theo mặc định, OpenClaw cho phép thử lại một lần với auth-profile cùng nhà cung cấp, rồi chuyển sang fallback mô hình đã cấu hình tiếp theo mà không chờ. Các tín hiệu nhà cung cấp đang bận như `ModelNotReadyException` được xếp vào nhóm quá tải đó. Điều chỉnh hành vi này bằng `auth.cooldowns.overloadedProfileRotations`, `auth.cooldowns.overloadedBackoffMs` và `auth.cooldowns.rateLimitedProfileRotations`.

Khi một lượt chạy bắt đầu từ primary mặc định đã cấu hình, primary của cron job, primary của agent có fallback tường minh, hoặc override fallback được tự động chọn, OpenClaw có thể đi theo chuỗi fallback đã cấu hình tương ứng. Primary của agent không có fallback tường minh và các lựa chọn người dùng tường minh (ví dụ `/model ollama/qwen3.5:27b`, bộ chọn mô hình, `sessions.patch`, hoặc override nhà cung cấp/mô hình CLI dùng một lần) là nghiêm ngặt: nếu nhà cung cấp/mô hình đó không thể truy cập hoặc lỗi trước khi tạo phản hồi, OpenClaw báo lỗi thay vì trả lời từ một fallback không liên quan.

### Quy tắc chuỗi ứng viên

OpenClaw xây dựng danh sách ứng viên từ `provider/model` hiện được yêu cầu cộng với các fallback đã cấu hình.

<AccordionGroup>
  <Accordion title="Quy tắc">
    - Mô hình được yêu cầu luôn đứng đầu.
    - Các fallback đã cấu hình tường minh được loại trùng lặp nhưng không bị lọc theo allowlist mô hình. Chúng được xem là chủ ý tường minh của operator.
    - Nếu lượt chạy hiện tại đã ở trên một fallback đã cấu hình trong cùng họ nhà cung cấp, OpenClaw tiếp tục dùng toàn bộ chuỗi đã cấu hình.
    - Nếu lượt chạy hiện tại ở trên nhà cung cấp khác với cấu hình và mô hình hiện tại đó chưa là một phần của chuỗi fallback đã cấu hình, OpenClaw không nối thêm các fallback đã cấu hình không liên quan từ nhà cung cấp khác.
    - Khi không cung cấp override fallback tường minh cho fallback runner, primary đã cấu hình được nối vào cuối để chuỗi có thể ổn định trở lại mặc định bình thường sau khi các ứng viên trước đó đã cạn.
    - Khi caller cung cấp `fallbacksOverride`, runner dùng chính xác mô hình được yêu cầu cộng với danh sách override đó. Danh sách rỗng sẽ tắt fallback mô hình và ngăn primary đã cấu hình được nối thêm dưới dạng mục tiêu thử lại ẩn.

  </Accordion>
</AccordionGroup>

### Những lỗi làm fallback tiến tiếp

<Tabs>
  <Tab title="Tiếp tục khi">
    - lỗi xác thực
    - giới hạn tốc độ và cạn thời gian chờ
    - lỗi quá tải/nhà cung cấp đang bận
    - lỗi failover có dạng timeout
    - thanh toán bị tắt
    - `LiveSessionModelSwitchError`, được chuẩn hóa vào đường dẫn failover để mô hình đã lưu cũ không tạo vòng lặp thử lại bên ngoài
    - các lỗi không nhận diện khác khi vẫn còn ứng viên

  </Tab>
  <Tab title="Không tiếp tục khi">
    - các lần hủy tường minh không có dạng timeout/failover
    - lỗi tràn ngữ cảnh nên ở lại trong logic compaction/thử lại (ví dụ `request_too_large`, `INVALID_ARGUMENT: input exceeds the maximum number of tokens`, `input token count exceeds the maximum number of input tokens`, `The input is too long for the model`, hoặc `ollama error: context length exceeded`)
    - lỗi không xác định cuối cùng khi không còn ứng viên nào

  </Tab>
</Tabs>

### Hành vi bỏ qua cooldown so với thăm dò

Khi mọi auth profile của một nhà cung cấp đều đã trong cooldown, OpenClaw không tự động bỏ qua nhà cung cấp đó mãi mãi. Nó đưa ra quyết định theo từng ứng viên:

<AccordionGroup>
  <Accordion title="Quyết định theo từng ứng viên">
    - Lỗi xác thực dai dẳng bỏ qua toàn bộ nhà cung cấp ngay lập tức.
    - Thanh toán bị tắt thường bị bỏ qua, nhưng ứng viên primary vẫn có thể được thăm dò theo throttle để có thể phục hồi mà không cần khởi động lại.
    - Ứng viên primary có thể được thăm dò gần thời điểm cooldown hết hạn, với throttle theo từng nhà cung cấp.
    - Các fallback cùng nhà cung cấp có thể được thử bất chấp cooldown khi lỗi có vẻ tạm thời (`rate_limit`, `overloaded`, hoặc không xác định). Điều này đặc biệt liên quan khi giới hạn tốc độ có phạm vi theo mô hình và một mô hình cùng cấp có thể vẫn phục hồi ngay lập tức.
    - Các lần thăm dò cooldown tạm thời bị giới hạn ở một lần cho mỗi nhà cung cấp trong mỗi lượt chạy fallback để một nhà cung cấp đơn lẻ không làm đình trệ fallback sang nhà cung cấp khác.

  </Accordion>
</AccordionGroup>

## Override phiên và chuyển mô hình trực tiếp

Các thay đổi mô hình phiên là trạng thái dùng chung. Runner đang hoạt động, lệnh `/model`, các cập nhật compaction/phiên, và đối soát phiên trực tiếp đều đọc hoặc ghi các phần của cùng một mục phiên.

Điều đó có nghĩa là các lần thử lại fallback phải phối hợp với chuyển mô hình trực tiếp:

- Chỉ các thay đổi mô hình do người dùng chủ động tường minh mới đánh dấu một lần chuyển trực tiếp đang chờ. Điều này bao gồm `/model`, `session_status(model=...)` và `sessions.patch`.
- Các thay đổi mô hình do hệ thống điều khiển như xoay vòng fallback, override heartbeat, hoặc compaction không tự đánh dấu một lần chuyển trực tiếp đang chờ.
- Override mô hình do người dùng điều khiển được xem là lựa chọn chính xác cho chính sách fallback, vì vậy một nhà cung cấp đã chọn nhưng không thể truy cập sẽ hiển thị lỗi thay vì bị che bởi `agents.defaults.model.fallbacks`.
- Trước khi một lần thử lại fallback bắt đầu, reply runner lưu các trường override fallback đã chọn vào mục phiên.
- Override fallback tự động vẫn được chọn trong các lượt tiếp theo để OpenClaw không thăm dò một primary đã biết là lỗi trên mọi tin nhắn. `/new`, `/reset` và `sessions.reset` xóa các override có nguồn tự động và đưa phiên về mặc định đã cấu hình.
- `/status` hiển thị mô hình đã chọn và, khi trạng thái fallback khác đi, mô hình fallback đang hoạt động cùng lý do.
- Đối soát phiên trực tiếp ưu tiên override phiên đã lưu hơn các trường mô hình runtime cũ.
- Nếu lỗi chuyển trực tiếp trỏ đến một ứng viên sau trong chuỗi fallback đang hoạt động, OpenClaw nhảy thẳng đến mô hình đã chọn đó thay vì đi qua các ứng viên không liên quan trước.
- Nếu lần thử fallback thất bại, runner chỉ khôi phục các trường override mà nó đã ghi, và chỉ khi chúng vẫn khớp với ứng viên thất bại đó.

Điều này ngăn cuộc đua kinh điển:

<Steps>
  <Step title="Primary lỗi">
    Mô hình primary đã chọn bị lỗi.
  </Step>
  <Step title="Fallback được chọn trong bộ nhớ">
    Ứng viên fallback được chọn trong bộ nhớ.
  </Step>
  <Step title="Kho phiên vẫn ghi primary cũ">
    Kho phiên vẫn phản ánh primary cũ.
  </Step>
  <Step title="Đối soát trực tiếp đọc trạng thái cũ">
    Đối soát phiên trực tiếp đọc trạng thái phiên cũ.
  </Step>
  <Step title="Lần thử lại bị kéo về">
    Lần thử lại bị kéo về mô hình cũ trước khi lần thử fallback bắt đầu.
  </Step>
</Steps>

Override fallback đã lưu sẽ đóng khoảng hở đó, và rollback hẹp giữ nguyên các thay đổi phiên thủ công hoặc runtime mới hơn.

## Khả năng quan sát và tóm tắt lỗi

`runWithModelFallback(...)` ghi lại chi tiết theo từng lần thử để cung cấp cho nhật ký và thông báo cooldown hướng đến người dùng:

- nhà cung cấp/mô hình đã thử
- lý do (`rate_limit`, `overloaded`, `billing`, `auth`, `model_not_found`, và các lý do failover tương tự)
- trạng thái/mã tùy chọn
- tóm tắt lỗi dễ đọc

Nhật ký có cấu trúc `model_fallback_decision` cũng bao gồm các trường phẳng `fallbackStep*` khi một ứng viên thất bại, bị bỏ qua, hoặc một fallback sau đó thành công. Các trường này làm rõ lần chuyển tiếp đã thử (`fallbackStepFromModel`, `fallbackStepToModel`, `fallbackStepFromFailureReason`, `fallbackStepFromFailureDetail`, `fallbackStepFinalOutcome`) để bộ xuất nhật ký và chẩn đoán có thể dựng lại lỗi primary ngay cả khi fallback cuối cùng cũng thất bại.

Khi mọi ứng viên đều thất bại, OpenClaw ném `FallbackSummaryError`. Reply runner bên ngoài có thể dùng lỗi đó để xây dựng thông báo cụ thể hơn, chẳng hạn như "tất cả mô hình tạm thời đang bị giới hạn tốc độ", và bao gồm thời điểm cooldown sớm nhất kết thúc nếu biết được.

Tóm tắt cooldown đó có nhận biết mô hình:

- các giới hạn tốc độ theo phạm vi mô hình không liên quan bị bỏ qua đối với chuỗi nhà cung cấp/mô hình đã thử
- nếu phần chặn còn lại là giới hạn tốc độ theo phạm vi mô hình khớp, OpenClaw báo thời điểm hết hạn khớp cuối cùng vẫn còn chặn mô hình đó

## Cấu hình liên quan

Xem [Cấu hình Gateway](/vi/gateway/configuration) để biết:

- `auth.profiles` / `auth.order`
- `auth.cooldowns.billingBackoffHours` / `auth.cooldowns.billingBackoffHoursByProvider`
- `auth.cooldowns.billingMaxHours` / `auth.cooldowns.failureWindowHours`
- `auth.cooldowns.overloadedProfileRotations` / `auth.cooldowns.overloadedBackoffMs`
- `auth.cooldowns.rateLimitedProfileRotations`
- `agents.defaults.model.primary` / `agents.defaults.model.fallbacks`
- định tuyến `agents.defaults.imageModel`

Xem [Mô hình](/vi/concepts/models) để biết tổng quan rộng hơn về lựa chọn mô hình và fallback.
