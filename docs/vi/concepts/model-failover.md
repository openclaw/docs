---
read_when:
    - Chẩn đoán việc xoay vòng hồ sơ xác thực, thời gian chờ hồi hoặc hành vi chuyển sang mô hình dự phòng
    - Cập nhật quy tắc chuyển đổi dự phòng cho hồ sơ xác thực hoặc mô hình
    - Tìm hiểu cách các ghi đè mô hình phiên tương tác với các lần thử lại dự phòng
sidebarTitle: Model failover
summary: Cách OpenClaw xoay vòng hồ sơ xác thực và chuyển dự phòng giữa các mô hình
title: Chuyển đổi dự phòng mô hình
x-i18n:
    generated_at: "2026-04-29T22:38:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: af8c343186105256cb2e1a65cdfc3e0042ce8d3d14d21cd007d90174e35b98e7
    source_path: concepts/model-failover.md
    workflow: 16
---

OpenClaw xử lý lỗi theo hai giai đoạn:

1. **Luân phiên hồ sơ xác thực** trong nhà cung cấp hiện tại.
2. **Dự phòng mô hình** sang mô hình tiếp theo trong `agents.defaults.model.fallbacks`.

Tài liệu này giải thích các quy tắc runtime và dữ liệu hỗ trợ chúng.

## Luồng runtime

Đối với một lần chạy văn bản thông thường, OpenClaw đánh giá các ứng viên theo thứ tự này:

<Steps>
  <Step title="Phân giải trạng thái phiên">
    Phân giải mô hình phiên đang hoạt động và tùy chọn ưu tiên hồ sơ xác thực.
  </Step>
  <Step title="Xây dựng chuỗi ứng viên">
    Xây dựng chuỗi ứng viên mô hình từ lựa chọn mô hình hiện tại và chính sách dự phòng cho nguồn lựa chọn đó. Mặc định đã cấu hình, mô hình chính của cron job, và mô hình dự phòng được tự động chọn có thể dùng các dự phòng đã cấu hình; lựa chọn phiên rõ ràng của người dùng là nghiêm ngặt.
  </Step>
  <Step title="Thử nhà cung cấp hiện tại">
    Thử nhà cung cấp hiện tại với các quy tắc luân phiên/cooldown hồ sơ xác thực.
  </Step>
  <Step title="Chuyển tiếp khi gặp lỗi đủ điều kiện failover">
    Nếu nhà cung cấp đó đã cạn lựa chọn với một lỗi đủ điều kiện failover, chuyển sang ứng viên mô hình tiếp theo.
  </Step>
  <Step title="Lưu override dự phòng">
    Lưu override dự phòng đã chọn trước khi bắt đầu thử lại để các bộ đọc phiên khác thấy cùng nhà cung cấp/mô hình mà runner sắp dùng. Override mô hình đã lưu được đánh dấu `modelOverrideSource: "auto"`.
  </Step>
  <Step title="Rollback hẹp khi lỗi">
    Nếu ứng viên dự phòng lỗi, chỉ rollback các trường override phiên thuộc sở hữu dự phòng khi chúng vẫn khớp với ứng viên lỗi đó.
  </Step>
  <Step title="Ném FallbackSummaryError nếu cạn lựa chọn">
    Nếu mọi ứng viên đều lỗi, ném `FallbackSummaryError` với chi tiết từng lần thử và thời điểm cooldown hết hạn sớm nhất khi biết được.
  </Step>
</Steps>

Cách này chủ ý hẹp hơn "lưu và khôi phục toàn bộ phiên". Reply runner chỉ lưu các trường lựa chọn mô hình mà nó sở hữu cho dự phòng:

- `providerOverride`
- `modelOverride`
- `modelOverrideSource`
- `authProfileOverride`
- `authProfileOverrideSource`
- `authProfileOverrideCompactionCount`

Điều đó ngăn một lần thử lại dự phòng bị lỗi ghi đè các thay đổi phiên mới hơn không liên quan, chẳng hạn như thay đổi `/model` thủ công hoặc cập nhật luân phiên phiên xảy ra trong khi lần thử đang chạy.

## Chính sách nguồn lựa chọn

OpenClaw tách riêng nhà cung cấp/mô hình đã chọn khỏi lý do nó được chọn. Nguồn đó kiểm soát việc chuỗi dự phòng có được phép dùng hay không:

- **Mặc định đã cấu hình**: `agents.defaults.model.primary` dùng `agents.defaults.model.fallbacks`.
- **Mô hình chính của agent**: `agents.list[].model` là nghiêm ngặt trừ khi đối tượng mô hình của agent đó có `fallbacks` riêng. Dùng `fallbacks: []` để biểu thị rõ hành vi nghiêm ngặt, hoặc cung cấp một danh sách không rỗng để bật dự phòng mô hình cho agent đó.
- **Override dự phòng tự động**: một dự phòng runtime ghi `providerOverride`, `modelOverride`, và `modelOverrideSource: "auto"` trước khi thử lại. Override tự động đó có thể tiếp tục đi qua chuỗi dự phòng đã cấu hình và được xóa bởi `/new`, `/reset`, và `sessions.reset`.
- **Override phiên của người dùng**: `/model`, bộ chọn mô hình, `session_status(model=...)`, và `sessions.patch` ghi `modelOverrideSource: "user"`. Đó là một lựa chọn phiên chính xác. Nếu nhà cung cấp/mô hình đã chọn lỗi trước khi tạo phản hồi, OpenClaw báo lỗi thay vì trả lời từ một dự phòng đã cấu hình không liên quan.
- **Override phiên cũ**: các mục phiên cũ hơn có thể có `modelOverride` mà không có `modelOverrideSource`. OpenClaw xem chúng là override của người dùng để một lựa chọn cũ rõ ràng không bị âm thầm chuyển thành hành vi dự phòng.
- **Mô hình payload Cron**: `payload.model` / `--model` của một cron job là mô hình chính của job, không phải override phiên của người dùng. Nó dùng các dự phòng đã cấu hình trừ khi job cung cấp `payload.fallbacks`; `payload.fallbacks: []` làm cho lần chạy cron trở nên nghiêm ngặt.

## Lưu trữ xác thực (khóa + OAuth)

OpenClaw dùng **hồ sơ xác thực** cho cả API key và token OAuth.

- Bí mật nằm trong `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (cũ: `~/.openclaw/agent/auth-profiles.json`).
- Trạng thái định tuyến xác thực runtime nằm trong `~/.openclaw/agents/<agentId>/agent/auth-state.json`.
- Cấu hình `auth.profiles` / `auth.order` chỉ là **metadata + định tuyến** (không có bí mật).
- Tệp OAuth cũ chỉ dùng để import: `~/.openclaw/credentials/oauth.json` (được import vào `auth-profiles.json` khi dùng lần đầu).

Chi tiết thêm: [OAuth](/vi/concepts/oauth)

Các loại thông tin xác thực:

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
    `auth.order[provider]` (nếu đã đặt).
  </Step>
  <Step title="Hồ sơ đã cấu hình">
    `auth.profiles` được lọc theo nhà cung cấp.
  </Step>
  <Step title="Hồ sơ đã lưu">
    Các mục trong `auth-profiles.json` cho nhà cung cấp.
  </Step>
</Steps>

Nếu không cấu hình thứ tự rõ ràng, OpenClaw dùng thứ tự vòng tròn:

- **Khóa chính:** loại hồ sơ (**OAuth trước API key**).
- **Khóa phụ:** `usageStats.lastUsed` (cũ nhất trước, trong từng loại).
- **Hồ sơ đang cooldown/bị vô hiệu hóa** được chuyển xuống cuối, sắp xếp theo thời điểm hết hạn sớm nhất.

### Độ bám phiên (thân thiện với cache)

OpenClaw **ghim hồ sơ xác thực đã chọn theo phiên** để giữ cache của nhà cung cấp ấm. Nó **không** luân phiên trên mọi yêu cầu. Hồ sơ đã ghim được dùng lại cho đến khi:

- phiên được đặt lại (`/new` / `/reset`)
- một Compaction hoàn tất (số đếm compaction tăng)
- hồ sơ đang cooldown/bị vô hiệu hóa

Lựa chọn thủ công qua `/model …@<profileId>` đặt một **override của người dùng** cho phiên đó và không được tự động luân phiên cho đến khi phiên mới bắt đầu.

<Note>
Hồ sơ tự động ghim (do bộ định tuyến phiên chọn) được xem là một **ưu tiên**: chúng được thử trước, nhưng OpenClaw có thể luân phiên sang hồ sơ khác khi gặp giới hạn tốc độ/timeout. Hồ sơ do người dùng ghim vẫn khóa vào hồ sơ đó; nếu nó lỗi và dự phòng mô hình đã được cấu hình, OpenClaw chuyển sang mô hình tiếp theo thay vì đổi hồ sơ.
</Note>

### Vì sao OAuth có thể "trông như bị mất"

Nếu bạn có cả hồ sơ OAuth và hồ sơ API key cho cùng một nhà cung cấp, vòng tròn có thể chuyển đổi giữa chúng qua các tin nhắn trừ khi được ghim. Để buộc dùng một hồ sơ duy nhất:

- Ghim bằng `auth.order[provider] = ["provider:profileId"]`, hoặc
- Dùng override theo phiên qua `/model …` với override hồ sơ (khi UI/bề mặt chat của bạn hỗ trợ).

## Cooldown

Khi một hồ sơ lỗi do lỗi xác thực/giới hạn tốc độ (hoặc một timeout trông giống giới hạn tốc độ), OpenClaw đánh dấu hồ sơ đó đang cooldown và chuyển sang hồ sơ tiếp theo.

<AccordionGroup>
  <Accordion title="Những gì được đưa vào nhóm giới hạn tốc độ / timeout">
    Nhóm giới hạn tốc độ đó rộng hơn `429` đơn thuần: nó cũng bao gồm thông báo từ nhà cung cấp như `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded`, `throttled`, `resource exhausted`, và các giới hạn cửa sổ sử dụng định kỳ như `weekly/monthly limit reached`.

    Lỗi định dạng/yêu cầu không hợp lệ (ví dụ lỗi xác thực ID lệnh gọi công cụ Cloud Code Assist) được xem là đủ điều kiện failover và dùng cùng các cooldown. Lỗi lý do dừng tương thích OpenAI như `Unhandled stop reason: error`, `stop reason: error`, và `reason: error` được phân loại là tín hiệu timeout/failover.

    Văn bản máy chủ chung cũng có thể rơi vào nhóm timeout đó khi nguồn khớp với một mẫu tạm thời đã biết. Ví dụ, thông báo stream-wrapper pi-ai trần `An unknown error occurred` được xem là đủ điều kiện failover cho mọi nhà cung cấp vì pi-ai phát ra nó khi luồng nhà cung cấp kết thúc với `stopReason: "aborted"` hoặc `stopReason: "error"` mà không có chi tiết cụ thể. Payload JSON `api_error` với văn bản máy chủ tạm thời như `internal server error`, `unknown error, 520`, `upstream error`, hoặc `backend error` cũng được xem là timeout đủ điều kiện failover.

    Văn bản upstream chung dành riêng cho OpenRouter như `Provider returned error` trần chỉ được xem là timeout khi ngữ cảnh nhà cung cấp thực sự là OpenRouter. Văn bản dự phòng nội bộ chung như `LLM request failed with an unknown error.` vẫn được xử lý thận trọng và tự nó không kích hoạt failover.

  </Accordion>
  <Accordion title="Giới hạn retry-after của SDK">
    Một số SDK nhà cung cấp có thể ngủ trong một cửa sổ `Retry-After` dài trước khi trả quyền điều khiển về OpenClaw. Với các SDK dựa trên Stainless như Anthropic và OpenAI, OpenClaw mặc định giới hạn thời gian chờ `retry-after-ms` / `retry-after` nội bộ SDK ở 60 giây và trả về ngay các phản hồi có thể thử lại lâu hơn để đường failover này có thể chạy. Điều chỉnh hoặc tắt giới hạn bằng `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS`; xem [Hành vi thử lại](/vi/concepts/retry).
  </Accordion>
  <Accordion title="Cooldown theo phạm vi mô hình">
    Cooldown giới hạn tốc độ cũng có thể theo phạm vi mô hình:

    - OpenClaw ghi `cooldownModel` cho lỗi giới hạn tốc độ khi biết ID mô hình bị lỗi.
    - Một mô hình cùng cấp trên cùng nhà cung cấp vẫn có thể được thử khi cooldown được giới hạn ở một mô hình khác.
    - Cửa sổ billing/bị vô hiệu hóa vẫn chặn toàn bộ hồ sơ trên các mô hình.

  </Accordion>
</AccordionGroup>

Cooldown dùng backoff hàm mũ:

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

## Vô hiệu hóa do billing

Lỗi billing/tín dụng (ví dụ "insufficient credits" / "credit balance too low") được xem là đủ điều kiện failover, nhưng thường không phải tạm thời. Thay vì một cooldown ngắn, OpenClaw đánh dấu hồ sơ là **bị vô hiệu hóa** (với backoff dài hơn) và luân phiên sang hồ sơ/nhà cung cấp tiếp theo.

<Note>
Không phải mọi phản hồi có dạng billing đều là `402`, và không phải mọi HTTP `402` đều rơi vào đây. OpenClaw giữ văn bản billing rõ ràng trong làn billing ngay cả khi nhà cung cấp trả về `401` hoặc `403` thay vào đó, nhưng các matcher dành riêng cho nhà cung cấp vẫn được giới hạn trong nhà cung cấp sở hữu chúng (ví dụ OpenRouter `403 Key limit exceeded`).

Trong khi đó, lỗi `402` tạm thời về cửa sổ sử dụng và giới hạn chi tiêu của tổ chức/workspace được phân loại là `rate_limit` khi thông báo trông có thể thử lại (ví dụ `weekly usage limit exhausted`, `daily limit reached, resets tomorrow`, hoặc `organization spending limit exceeded`). Chúng vẫn nằm trên đường cooldown/failover ngắn thay vì đường vô hiệu hóa billing dài.
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

- Backoff billing bắt đầu ở **5 giờ**, tăng gấp đôi theo mỗi lỗi billing, và giới hạn ở **24 giờ**.
- Bộ đếm backoff đặt lại nếu hồ sơ không lỗi trong **24 giờ** (có thể cấu hình).
- Thử lại quá tải cho phép **1 lần luân phiên hồ sơ cùng nhà cung cấp** trước khi dự phòng mô hình.
- Thử lại quá tải mặc định dùng **0 ms backoff**.

## Dự phòng mô hình

Nếu tất cả hồ sơ cho một nhà cung cấp đều lỗi, OpenClaw chuyển sang mô hình tiếp theo trong `agents.defaults.model.fallbacks`. Điều này áp dụng cho lỗi xác thực, giới hạn tốc độ, và timeout đã cạn luân phiên hồ sơ (các lỗi khác không chuyển tiếp dự phòng). Lỗi nhà cung cấp không phơi bày đủ chi tiết vẫn được gắn nhãn chính xác trong trạng thái dự phòng: `empty_response` nghĩa là nhà cung cấp không trả về thông báo hoặc trạng thái dùng được, `no_error_details` nghĩa là nhà cung cấp trả về rõ ràng `Unknown error (no error details in response)`, và `unclassified` nghĩa là OpenClaw đã giữ bản xem trước thô nhưng chưa có bộ phân loại nào khớp.

Lỗi quá tải và lỗi giới hạn tốc độ được xử lý quyết liệt hơn thời gian chờ do thanh toán. Theo mặc định, OpenClaw cho phép thử lại một auth-profile cùng nhà cung cấp, rồi chuyển sang fallback mô hình đã cấu hình tiếp theo mà không chờ. Các tín hiệu nhà cung cấp đang bận như `ModelNotReadyException` được xếp vào nhóm quá tải đó. Điều chỉnh hành vi này bằng `auth.cooldowns.overloadedProfileRotations`, `auth.cooldowns.overloadedBackoffMs`, và `auth.cooldowns.rateLimitedProfileRotations`.

Khi một lượt chạy bắt đầu từ primary mặc định đã cấu hình, primary của cron job, primary của agent có fallback rõ ràng, hoặc override fallback được tự động chọn, OpenClaw có thể đi theo chuỗi fallback đã cấu hình tương ứng. Primary của agent không có fallback rõ ràng và các lựa chọn rõ ràng của người dùng (ví dụ `/model ollama/qwen3.5:27b`, bộ chọn mô hình, `sessions.patch`, hoặc override provider/model một lần từ CLI) là nghiêm ngặt: nếu provider/model đó không truy cập được hoặc lỗi trước khi tạo phản hồi, OpenClaw báo lỗi thay vì trả lời từ một fallback không liên quan.

### Quy tắc chuỗi ứng viên

OpenClaw xây dựng danh sách ứng viên từ `provider/model` đang được yêu cầu cùng với các fallback đã cấu hình.

<AccordionGroup>
  <Accordion title="Quy tắc">
    - Mô hình được yêu cầu luôn đứng đầu.
    - Các fallback đã cấu hình rõ ràng được loại trùng lặp nhưng không bị lọc theo danh sách cho phép mô hình. Chúng được xem là ý định rõ ràng của người vận hành.
    - Nếu lượt chạy hiện tại đã ở trên một fallback đã cấu hình trong cùng họ provider, OpenClaw tiếp tục dùng toàn bộ chuỗi đã cấu hình.
    - Nếu lượt chạy hiện tại dùng provider khác với cấu hình và mô hình hiện tại đó chưa nằm trong chuỗi fallback đã cấu hình, OpenClaw không thêm các fallback đã cấu hình không liên quan từ provider khác.
    - Khi không cung cấp override fallback rõ ràng cho runner fallback, primary đã cấu hình được thêm vào cuối để chuỗi có thể ổn định lại về mặc định bình thường sau khi các ứng viên trước đó đã cạn.
    - Khi caller cung cấp `fallbacksOverride`, runner dùng đúng mô hình được yêu cầu cộng với danh sách override đó. Danh sách rỗng tắt fallback mô hình và ngăn primary đã cấu hình được thêm vào như một mục tiêu thử lại ẩn.

  </Accordion>
</AccordionGroup>

### Những lỗi làm fallback tiến tiếp

<Tabs>
  <Tab title="Tiếp tục khi">
    - lỗi auth
    - giới hạn tốc độ và cạn thời gian chờ
    - lỗi quá tải/provider đang bận
    - lỗi failover dạng timeout
    - bị tắt do thanh toán
    - `LiveSessionModelSwitchError`, được chuẩn hóa vào đường dẫn failover để một mô hình đã lưu lỗi thời không tạo vòng lặp thử lại bên ngoài
    - các lỗi không nhận diện khác khi vẫn còn ứng viên

  </Tab>
  <Tab title="Không tiếp tục khi">
    - các lần hủy rõ ràng không có dạng timeout/failover
    - lỗi tràn ngữ cảnh cần ở lại trong logic compaction/thử lại (ví dụ `request_too_large`, `INVALID_ARGUMENT: input exceeds the maximum number of tokens`, `input token count exceeds the maximum number of input tokens`, `The input is too long for the model`, hoặc `ollama error: context length exceeded`)
    - lỗi không xác định cuối cùng khi không còn ứng viên nào

  </Tab>
</Tabs>

### Hành vi bỏ qua cooldown so với thăm dò

Khi mọi auth profile của một provider đều đang trong cooldown, OpenClaw không tự động bỏ qua provider đó mãi mãi. Nó đưa ra quyết định theo từng ứng viên:

<AccordionGroup>
  <Accordion title="Quyết định theo từng ứng viên">
    - Lỗi auth kéo dài bỏ qua toàn bộ provider ngay lập tức.
    - Việc tắt do thanh toán thường bị bỏ qua, nhưng ứng viên primary vẫn có thể được thăm dò theo throttle để có thể phục hồi mà không cần khởi động lại.
    - Ứng viên primary có thể được thăm dò gần thời điểm cooldown hết hạn, với throttle theo từng provider.
    - Các fallback cùng provider có thể được thử bất chấp cooldown khi lỗi có vẻ tạm thời (`rate_limit`, `overloaded`, hoặc không xác định). Điều này đặc biệt liên quan khi giới hạn tốc độ theo phạm vi mô hình và một mô hình cùng cấp vẫn có thể phục hồi ngay.
    - Các lần thăm dò cooldown tạm thời bị giới hạn ở một lần trên mỗi provider cho mỗi lượt chạy fallback để một provider đơn lẻ không làm đình trệ fallback liên provider.

  </Accordion>
</AccordionGroup>

## Override phiên và chuyển mô hình trực tiếp

Thay đổi mô hình phiên là trạng thái dùng chung. Runner đang hoạt động, lệnh `/model`, các cập nhật compaction/phiên, và hòa giải phiên trực tiếp đều đọc hoặc ghi các phần của cùng một mục phiên.

Điều đó có nghĩa là các lần thử lại fallback phải phối hợp với chuyển mô hình trực tiếp:

- Chỉ các thay đổi mô hình rõ ràng do người dùng điều khiển mới đánh dấu một chuyển đổi trực tiếp đang chờ. Điều đó bao gồm `/model`, `session_status(model=...)`, và `sessions.patch`.
- Các thay đổi mô hình do hệ thống điều khiển như xoay vòng fallback, override heartbeat, hoặc compaction không bao giờ tự đánh dấu một chuyển đổi trực tiếp đang chờ.
- Override mô hình do người dùng điều khiển được xem là lựa chọn chính xác cho chính sách fallback, nên một provider đã chọn nhưng không truy cập được sẽ hiện ra dưới dạng lỗi thay vì bị che bởi `agents.defaults.model.fallbacks`.
- Trước khi một lần thử lại fallback bắt đầu, runner phản hồi lưu các trường override fallback đã chọn vào mục phiên.
- Override fallback tự động vẫn được chọn ở các lượt sau để OpenClaw không thăm dò primary đã biết là lỗi ở mọi tin nhắn. `/new`, `/reset`, và `sessions.reset` xóa các override có nguồn gốc tự động và đưa phiên về mặc định đã cấu hình.
- `/status` hiển thị mô hình đã chọn và, khi trạng thái fallback khác đi, mô hình fallback đang hoạt động cùng lý do.
- Hòa giải phiên trực tiếp ưu tiên override phiên đã lưu hơn các trường mô hình runtime lỗi thời.
- Nếu lỗi chuyển trực tiếp trỏ tới một ứng viên sau trong chuỗi fallback đang hoạt động, OpenClaw nhảy thẳng tới mô hình đã chọn đó thay vì đi qua các ứng viên không liên quan trước.
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
  <Step title="Hòa giải trực tiếp đọc trạng thái lỗi thời">
    Hòa giải phiên trực tiếp đọc trạng thái phiên lỗi thời.
  </Step>
  <Step title="Thử lại bị kéo về">
    Lần thử lại bị kéo về mô hình cũ trước khi lần thử fallback bắt đầu.
  </Step>
</Steps>

Override fallback đã lưu đóng khoảng trống đó, và việc rollback hẹp giữ nguyên các thay đổi phiên thủ công hoặc runtime mới hơn.

## Khả năng quan sát và tóm tắt lỗi

`runWithModelFallback(...)` ghi lại chi tiết theo từng lần thử để cấp dữ liệu cho log và thông báo cooldown hướng tới người dùng:

- provider/model đã thử
- lý do (`rate_limit`, `overloaded`, `billing`, `auth`, `model_not_found`, và các lý do failover tương tự)
- status/code tùy chọn
- tóm tắt lỗi dễ đọc cho con người

Log `model_fallback_decision` có cấu trúc cũng bao gồm các trường phẳng `fallbackStep*` khi một ứng viên thất bại, bị bỏ qua, hoặc một fallback sau thành công. Các trường này làm rõ lần chuyển tiếp đã thử (`fallbackStepFromModel`, `fallbackStepToModel`, `fallbackStepFromFailureReason`, `fallbackStepFromFailureDetail`, `fallbackStepFinalOutcome`) để log và trình xuất chẩn đoán có thể tái dựng lỗi primary ngay cả khi fallback cuối cùng cũng thất bại.

Khi mọi ứng viên đều thất bại, OpenClaw ném `FallbackSummaryError`. Runner phản hồi bên ngoài có thể dùng lỗi đó để xây dựng thông báo cụ thể hơn, chẳng hạn như "tất cả mô hình đang tạm thời bị giới hạn tốc độ" và bao gồm thời điểm cooldown sớm nhất hết hạn khi biết được.

Tóm tắt cooldown đó có nhận biết mô hình:

- các giới hạn tốc độ theo phạm vi mô hình không liên quan bị bỏ qua đối với chuỗi provider/model đã thử
- nếu phần chặn còn lại là một giới hạn tốc độ theo phạm vi mô hình khớp, OpenClaw báo thời điểm hết hạn khớp cuối cùng vẫn đang chặn mô hình đó

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
