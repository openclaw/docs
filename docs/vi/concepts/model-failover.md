---
read_when:
    - Chẩn đoán hành vi luân phiên hồ sơ xác thực, thời gian chờ hoặc chuyển sang mô hình dự phòng
    - Cập nhật quy tắc chuyển đổi dự phòng cho hồ sơ xác thực hoặc mô hình
    - Hiểu cách các ghi đè mô hình trong phiên tương tác với các lần thử lại dự phòng
sidebarTitle: Model failover
summary: Cách OpenClaw xoay vòng hồ sơ xác thực và chuyển dự phòng giữa các mô hình
title: Chuyển đổi dự phòng mô hình
x-i18n:
    generated_at: "2026-05-11T20:27:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: d3983218c9de67bbd100eab655c319ed97350d43e00c826febd47cb014cbe6cf
    source_path: concepts/model-failover.md
    workflow: 16
---

OpenClaw xử lý lỗi theo hai giai đoạn:

1. **Luân chuyển hồ sơ xác thực** trong provider hiện tại.
2. **Dự phòng mô hình** sang mô hình tiếp theo trong `agents.defaults.model.fallbacks`.

Tài liệu này giải thích các quy tắc runtime và dữ liệu hỗ trợ chúng.

## Luồng runtime

Đối với một lần chạy văn bản thông thường, OpenClaw đánh giá các ứng viên theo thứ tự này:

<Steps>
  <Step title="Resolve session state">
    Phân giải mô hình phiên đang hoạt động và tùy chọn hồ sơ xác thực.
  </Step>
  <Step title="Build candidate chain">
    Xây dựng chuỗi ứng viên mô hình từ lựa chọn mô hình hiện tại và chính sách dự phòng cho nguồn lựa chọn đó. Các giá trị mặc định đã cấu hình, mô hình chính của tác vụ cron và các mô hình dự phòng được tự động chọn có thể dùng các dự phòng đã cấu hình; các lựa chọn phiên rõ ràng của người dùng thì nghiêm ngặt.
  </Step>
  <Step title="Try the current provider">
    Thử provider hiện tại với các quy tắc luân chuyển/thời gian chờ hồ sơ xác thực.
  </Step>
  <Step title="Advance on failover-worthy errors">
    Nếu provider đó cạn kiệt với một lỗi đáng chuyển dự phòng, chuyển sang ứng viên mô hình tiếp theo.
  </Step>
  <Step title="Persist fallback override">
    Lưu ghi đè dự phòng đã chọn trước khi lần thử lại bắt đầu để các trình đọc phiên khác thấy cùng provider/mô hình mà runner sắp dùng. Ghi đè mô hình đã lưu được đánh dấu `modelOverrideSource: "auto"`.
  </Step>
  <Step title="Roll back narrowly on failure">
    Nếu ứng viên dự phòng thất bại, chỉ hoàn tác các trường ghi đè phiên thuộc sở hữu của dự phòng khi chúng vẫn khớp với ứng viên thất bại đó.
  </Step>
  <Step title="Throw FallbackSummaryError if exhausted">
    Nếu mọi ứng viên đều thất bại, ném `FallbackSummaryError` với chi tiết từng lần thử và thời điểm hết thời gian chờ sớm nhất khi biết được.
  </Step>
</Steps>

Điều này cố ý hẹp hơn so với "lưu và khôi phục toàn bộ phiên". Reply runner chỉ lưu các trường lựa chọn mô hình mà nó sở hữu cho dự phòng:

- `providerOverride`
- `modelOverride`
- `modelOverrideSource`
- `authProfileOverride`
- `authProfileOverrideSource`
- `authProfileOverrideCompactionCount`

Điều đó ngăn một lần thử lại dự phòng thất bại ghi đè các thay đổi phiên không liên quan mới hơn, chẳng hạn như thay đổi `/model` thủ công hoặc cập nhật luân chuyển phiên đã xảy ra trong khi lần thử đang chạy.

## Chính sách nguồn lựa chọn

OpenClaw tách provider/mô hình đã chọn khỏi lý do nó được chọn. Nguồn đó kiểm soát việc chuỗi dự phòng có được phép hay không:

- **Mặc định đã cấu hình**: `agents.defaults.model.primary` sử dụng `agents.defaults.model.fallbacks`.
- **Mô hình chính của agent**: `agents.list[].model` nghiêm ngặt trừ khi đối tượng mô hình của agent đó bao gồm `fallbacks` riêng. Dùng `fallbacks: []` để thể hiện rõ hành vi nghiêm ngặt, hoặc cung cấp một danh sách không rỗng để cho phép agent đó dùng dự phòng mô hình.
- **Ghi đè dự phòng tự động**: một dự phòng runtime ghi `providerOverride`, `modelOverride`, `modelOverrideSource: "auto"` và mô hình gốc đã chọn trước khi thử lại. Ghi đè tự động đó có thể tiếp tục đi theo chuỗi dự phòng đã cấu hình và được xóa bởi `/new`, `/reset` và `sessions.reset`. Các lần chạy Heartbeat không có `heartbeat.model` rõ ràng cũng xóa một ghi đè tự động trực tiếp khi nguồn gốc của nó không còn khớp với mặc định hiện được cấu hình.
- **Ghi đè phiên của người dùng**: `/model`, bộ chọn mô hình, `session_status(model=...)` và `sessions.patch` ghi `modelOverrideSource: "user"`. Đó là lựa chọn phiên chính xác. Nếu provider/mô hình đã chọn thất bại trước khi tạo phản hồi, OpenClaw báo cáo lỗi thay vì trả lời từ một dự phòng đã cấu hình không liên quan.
- **Ghi đè phiên cũ**: các mục phiên cũ hơn có thể có `modelOverride` mà không có `modelOverrideSource`. OpenClaw xem chúng là ghi đè của người dùng để một lựa chọn cũ rõ ràng không bị âm thầm chuyển thành hành vi dự phòng.
- **Mô hình payload Cron**: `payload.model` / `--model` của một tác vụ cron là mô hình chính của tác vụ, không phải ghi đè phiên của người dùng. Nó sử dụng các dự phòng đã cấu hình trừ khi tác vụ cung cấp `payload.fallbacks`; `payload.fallbacks: []` làm cho lần chạy cron trở nên nghiêm ngặt.

## Lưu trữ xác thực (khóa + OAuth)

OpenClaw sử dụng **hồ sơ xác thực** cho cả khóa API và token OAuth.

- Secrets nằm trong `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (cũ: `~/.openclaw/agent/auth-profiles.json`).
- Trạng thái định tuyến xác thực runtime nằm trong `~/.openclaw/agents/<agentId>/agent/auth-state.json`.
- Cấu hình `auth.profiles` / `auth.order` chỉ là **siêu dữ liệu + định tuyến** (không có secret).
- Tệp OAuth cũ chỉ dùng để nhập: `~/.openclaw/credentials/oauth.json` (được nhập vào `auth-profiles.json` ở lần sử dụng đầu tiên).

Chi tiết thêm: [OAuth](/vi/concepts/oauth)

Các loại thông tin xác thực:

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }` (+ `projectId`/`enterpriseUrl` cho một số provider)

## ID hồ sơ

Đăng nhập OAuth tạo các hồ sơ riêng biệt để nhiều tài khoản có thể cùng tồn tại.

- Mặc định: `provider:default` khi không có email.
- OAuth có email: `provider:<email>` (ví dụ `google-antigravity:user@gmail.com`).

Hồ sơ nằm trong `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` dưới `profiles`.

## Thứ tự luân chuyển

Khi một provider có nhiều hồ sơ, OpenClaw chọn thứ tự như sau:

<Steps>
  <Step title="Explicit config">
    `auth.order[provider]` (nếu được đặt).
  </Step>
  <Step title="Configured profiles">
    `auth.profiles` được lọc theo provider.
  </Step>
  <Step title="Stored profiles">
    Các mục trong `auth-profiles.json` cho provider.
  </Step>
</Steps>

Nếu không có thứ tự rõ ràng được cấu hình, OpenClaw sử dụng thứ tự xoay vòng:

- **Khóa chính:** loại hồ sơ (**OAuth trước khóa API**).
- **Khóa phụ:** `usageStats.lastUsed` (cũ nhất trước, trong từng loại).
- **Hồ sơ đang trong thời gian chờ/bị tắt** được chuyển xuống cuối, sắp xếp theo thời điểm hết hạn sớm nhất.

### Tính bám dính phiên (thân thiện với bộ nhớ đệm)

OpenClaw **ghim hồ sơ xác thực đã chọn theo từng phiên** để giữ bộ nhớ đệm của nhà cung cấp luôn sẵn sàng. Nó **không** xoay vòng ở mọi yêu cầu. Hồ sơ đã ghim được dùng lại cho đến khi:

- phiên được đặt lại (`/new` / `/reset`)
- một Compaction hoàn tất (số lần compaction tăng)
- hồ sơ đang trong thời gian chờ/hay đã bị tắt

Việc chọn thủ công qua `/model …@<profileId>` đặt một **ghi đè của người dùng** cho phiên đó và sẽ không được tự động xoay vòng cho đến khi một phiên mới bắt đầu.

<Note>
Các hồ sơ được tự động ghim (do bộ định tuyến phiên chọn) được xem là một **ưu tiên**: chúng được thử trước, nhưng OpenClaw có thể xoay vòng sang hồ sơ khác khi gặp giới hạn tốc độ/hết thời gian chờ. Khi hồ sơ ban đầu khả dụng trở lại, các lần chạy mới có thể ưu tiên lại hồ sơ đó mà không thay đổi mô hình hoặc runtime đã chọn. Các hồ sơ do người dùng ghim vẫn bị khóa vào hồ sơ đó; nếu hồ sơ này thất bại và các fallback mô hình đã được cấu hình, OpenClaw sẽ chuyển sang mô hình tiếp theo thay vì chuyển hồ sơ.
</Note>

### Đăng ký OpenAI Codex cùng dự phòng bằng API key

Đối với các mô hình tác tử OpenAI, xác thực và runtime là riêng biệt. `openai/gpt-*` vẫn nằm trên
harness Codex trong khi xác thực có thể xoay vòng giữa hồ sơ đăng ký Codex và
một dự phòng bằng API key OpenAI.

Dùng `auth.order.openai` cho thứ tự hiển thị với người dùng:

```json5
{
  auth: {
    order: {
      openai: ["openai-codex:user@example.com", "openai:api-key-backup"],
    },
  },
}
```

Các hồ sơ đăng ký Codex hiện có vẫn có thể dùng id hồ sơ cũ
`openai-codex:*`. Dự phòng bằng API key đã sắp thứ tự có thể là một hồ sơ API key
`openai:*` thông thường. Khi đăng ký chạm giới hạn sử dụng Codex,
OpenClaw ghi lại thời điểm đặt lại chính xác khi Codex cung cấp, thử hồ sơ
xác thực tiếp theo theo thứ tự, và giữ lần chạy bên trong harness Codex. Khi thời điểm đặt lại
đã qua, hồ sơ đăng ký đủ điều kiện trở lại và lần chọn tự động tiếp theo
có thể quay lại hồ sơ đó.

Chỉ dùng hồ sơ do người dùng ghim khi bạn muốn buộc dùng một tài khoản/khóa cho
phiên đó. Các hồ sơ do người dùng ghim được cố ý giữ nghiêm ngặt và không âm thầm nhảy
sang hồ sơ khác.

## Thời gian chờ

Khi một hồ sơ thất bại do lỗi xác thực/giới hạn tốc độ (hoặc hết thời gian chờ trông giống giới hạn tốc độ), OpenClaw đánh dấu hồ sơ đó đang trong thời gian chờ và chuyển sang hồ sơ tiếp theo.

<AccordionGroup>
  <Accordion title="Nội dung được xếp vào nhóm giới hạn tốc độ / hết thời gian chờ">
    Nhóm giới hạn tốc độ đó rộng hơn `429` thông thường: nó cũng bao gồm các thông báo từ nhà cung cấp như `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded`, `throttled`, `resource exhausted`, và các giới hạn theo cửa sổ sử dụng định kỳ như `weekly/monthly limit reached`.

    Lỗi định dạng/yêu cầu không hợp lệ thường là lỗi kết thúc vì thử lại cùng một payload sẽ thất bại theo cùng cách, nên OpenClaw hiển thị chúng thay vì xoay vòng hồ sơ xác thực. Các đường dẫn thử lại-sửa chữa đã biết có thể chọn tham gia rõ ràng: ví dụ, lỗi xác thực ID lệnh gọi công cụ Cloud Code Assist được làm sạch và thử lại một lần thông qua chính sách `allowFormatRetry`. Các lỗi lý do dừng tương thích với OpenAI như `Unhandled stop reason: error`, `stop reason: error`, và `reason: error` được phân loại là tín hiệu hết thời gian chờ/chuyển đổi dự phòng.

    Văn bản máy chủ chung cũng có thể được xếp vào nhóm hết thời gian chờ đó khi nguồn khớp với một mẫu tạm thời đã biết. Ví dụ, thông báo stream-wrapper pi-ai trần `An unknown error occurred` được coi là đáng chuyển đổi dự phòng đối với mọi nhà cung cấp vì pi-ai phát ra thông báo này khi luồng của nhà cung cấp kết thúc với `stopReason: "aborted"` hoặc `stopReason: "error"` mà không có chi tiết cụ thể. Các payload JSON `api_error` có văn bản máy chủ tạm thời như `internal server error`, `unknown error, 520`, `upstream error`, hoặc `backend error` cũng được coi là các lỗi hết thời gian chờ đáng chuyển đổi dự phòng.

    Văn bản upstream chung riêng cho OpenRouter như `Provider returned error` trần chỉ được coi là hết thời gian chờ khi ngữ cảnh nhà cung cấp thực sự là OpenRouter. Văn bản dự phòng nội bộ chung như `LLM request failed with an unknown error.` vẫn được xử lý thận trọng và tự nó không kích hoạt chuyển đổi dự phòng.

  </Accordion>
  <Accordion title="Giới hạn retry-after của SDK">
    Một số SDK của nhà cung cấp nếu không có thể ngủ trong một cửa sổ `Retry-After` dài trước khi trả quyền điều khiển về cho OpenClaw. Đối với các SDK dựa trên Stainless như Anthropic và OpenAI, theo mặc định OpenClaw giới hạn các lần chờ `retry-after-ms` / `retry-after` nội bộ SDK ở 60 giây và hiển thị ngay các phản hồi có thể thử lại lâu hơn để đường dẫn chuyển đổi dự phòng này có thể chạy. Điều chỉnh hoặc tắt giới hạn bằng `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS`; xem [Hành vi thử lại](/vi/concepts/retry).
  </Accordion>
  <Accordion title="Cooldown theo phạm vi mô hình">
    Cooldown giới hạn tốc độ cũng có thể theo phạm vi mô hình:

    - OpenClaw ghi lại `cooldownModel` cho các lỗi giới hạn tốc độ khi biết id mô hình bị lỗi.
    - Một mô hình cùng cấp trên cùng nhà cung cấp vẫn có thể được thử khi cooldown được giới hạn cho một mô hình khác.
    - Các cửa sổ thanh toán/bị tắt vẫn chặn toàn bộ hồ sơ trên các mô hình.

  </Accordion>
</AccordionGroup>

Thời gian chờ sử dụng backoff theo cấp số nhân:

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

Lỗi thanh toán/tín dụng (ví dụ "insufficient credits" / "credit balance too low") được xem là đủ điều kiện để chuyển đổi dự phòng, nhưng thường không mang tính tạm thời. Thay vì một thời gian chờ ngắn, OpenClaw đánh dấu hồ sơ là **bị vô hiệu hóa** (với backoff dài hơn) và luân chuyển sang hồ sơ/nhà cung cấp tiếp theo.

<Note>
Không phải mọi phản hồi có dạng liên quan đến thanh toán đều là `402`, và không phải mọi HTTP `402` đều đi vào đây. OpenClaw vẫn giữ văn bản thanh toán rõ ràng trong luồng thanh toán ngay cả khi nhà cung cấp trả về `401` hoặc `403` thay vào đó, nhưng các bộ khớp theo từng nhà cung cấp vẫn chỉ giới hạn trong phạm vi nhà cung cấp sở hữu chúng (ví dụ OpenRouter `403 Key limit exceeded`).

Trong khi đó, các lỗi tạm thời `402` về khung thời gian sử dụng và giới hạn chi tiêu của tổ chức/không gian làm việc được phân loại là `rate_limit` khi thông báo có vẻ có thể thử lại (ví dụ `weekly usage limit exhausted`, `daily limit reached, resets tomorrow`, hoặc `organization spending limit exceeded`). Các lỗi đó vẫn đi theo đường dẫn hồi chiêu/chuyển đổi dự phòng ngắn thay vì đường dẫn vô hiệu hóa thanh toán dài.
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

- Thời gian chờ lùi do thanh toán bắt đầu ở **5 giờ**, tăng gấp đôi sau mỗi lỗi thanh toán, và giới hạn ở **24 giờ**.
- Bộ đếm thời gian chờ lùi được đặt lại nếu hồ sơ không lỗi trong **24 giờ** (có thể cấu hình).
- Các lần thử lại do quá tải cho phép **1 lần xoay vòng hồ sơ cùng nhà cung cấp** trước khi chuyển đổi dự phòng mô hình.
- Các lần thử lại do quá tải mặc định dùng **0 ms thời gian chờ lùi**.

## Chuyển đổi dự phòng mô hình

Nếu tất cả hồ sơ của một nhà cung cấp đều lỗi, OpenClaw chuyển sang mô hình tiếp theo trong `agents.defaults.model.fallbacks`. Điều này áp dụng cho lỗi xác thực, giới hạn tốc độ, và thời gian chờ đã dùng hết xoay vòng hồ sơ (các lỗi khác không kích hoạt chuyển đổi dự phòng). Các lỗi nhà cung cấp không bộc lộ đủ chi tiết vẫn được gắn nhãn chính xác trong trạng thái chuyển đổi dự phòng: `empty_response` nghĩa là nhà cung cấp không trả về thông báo hoặc trạng thái có thể dùng, `no_error_details` nghĩa là nhà cung cấp trả về rõ ràng `Unknown error (no error details in response)`, và `unclassified` nghĩa là OpenClaw đã giữ bản xem trước thô nhưng chưa có bộ phân loại nào khớp.

Các lỗi quá tải và giới hạn tốc độ được xử lý quyết liệt hơn so với hồi chiêu thanh toán. Theo mặc định, OpenClaw cho phép một lần thử lại hồ sơ xác thực cùng nhà cung cấp, rồi chuyển sang mô hình dự phòng được cấu hình tiếp theo mà không chờ. Các tín hiệu nhà cung cấp đang bận như `ModelNotReadyException` rơi vào nhóm quá tải đó. Điều chỉnh bằng `auth.cooldowns.overloadedProfileRotations`, `auth.cooldowns.overloadedBackoffMs`, và `auth.cooldowns.rateLimitedProfileRotations`.

Khi một lượt chạy bắt đầu từ mô hình chính mặc định đã cấu hình, mô hình chính của tác vụ cron, mô hình chính của agent có dự phòng tường minh, hoặc một ghi đè dự phòng được tự động chọn, OpenClaw có thể đi qua chuỗi dự phòng đã cấu hình tương ứng. Các mô hình chính của agent không có dự phòng tường minh và các lựa chọn người dùng tường minh (ví dụ `/model ollama/qwen3.5:27b`, bộ chọn mô hình, `sessions.patch`, hoặc ghi đè nhà cung cấp/mô hình CLI một lần) là nghiêm ngặt: nếu nhà cung cấp/mô hình đó không thể truy cập hoặc lỗi trước khi tạo phản hồi, OpenClaw báo lỗi thay vì trả lời từ một dự phòng không liên quan.

### Quy tắc chuỗi ứng viên

OpenClaw xây dựng danh sách ứng viên từ `provider/model` hiện được yêu cầu cộng với các dự phòng đã cấu hình.

<AccordionGroup>
  <Accordion title="Quy tắc">
    - Mô hình được yêu cầu luôn đứng đầu.
    - Các dự phòng được cấu hình tường minh được loại trùng lặp nhưng không bị lọc bởi danh sách cho phép mô hình. Chúng được xem là ý định tường minh của người vận hành.
    - Nếu lượt chạy hiện tại đã ở trên một dự phòng đã cấu hình trong cùng họ nhà cung cấp, OpenClaw tiếp tục dùng toàn bộ chuỗi đã cấu hình.
    - Khi không cung cấp ghi đè dự phòng tường minh, các dự phòng đã cấu hình được thử trước mô hình chính đã cấu hình ngay cả khi mô hình được yêu cầu dùng một nhà cung cấp khác.
    - Khi không cung cấp ghi đè dự phòng tường minh cho trình chạy dự phòng, mô hình chính đã cấu hình được thêm vào cuối để chuỗi có thể quay lại mặc định bình thường sau khi các ứng viên trước đó đã cạn.
    - Khi bên gọi cung cấp `fallbacksOverride`, trình chạy dùng chính xác mô hình được yêu cầu cộng với danh sách ghi đè đó. Danh sách rỗng tắt chuyển đổi dự phòng mô hình và ngăn mô hình chính đã cấu hình được thêm vào như một mục tiêu thử lại ẩn.

  </Accordion>
</AccordionGroup>

### Những lỗi kích hoạt chuyển đổi dự phòng

<Tabs>
  <Tab title="Tiếp tục khi">
    - lỗi xác thực
    - giới hạn tốc độ và cạn hồi chiêu
    - lỗi quá tải/nhà cung cấp đang bận
    - lỗi chuyển đổi dự phòng có dạng thời gian chờ
    - vô hiệu hóa thanh toán
    - `LiveSessionModelSwitchError`, được chuẩn hóa thành đường dẫn chuyển đổi dự phòng để một mô hình đã lưu cũ không tạo vòng lặp thử lại bên ngoài
    - các lỗi không nhận diện khác khi vẫn còn ứng viên

  </Tab>
  <Tab title="Không tiếp tục khi">
    - các lệnh hủy tường minh không có dạng thời gian chờ/chuyển đổi dự phòng
    - lỗi tràn ngữ cảnh nên ở lại trong logic Compaction/thử lại (ví dụ `request_too_large`, `INVALID_ARGUMENT: input exceeds the maximum number of tokens`, `input token count exceeds the maximum number of input tokens`, `The input is too long for the model`, hoặc `ollama error: context length exceeded`)
    - lỗi không xác định cuối cùng khi không còn ứng viên

  </Tab>
</Tabs>

### Hành vi bỏ qua hồi chiêu so với thăm dò

Khi mọi hồ sơ xác thực của một nhà cung cấp đã ở trạng thái hồi chiêu, OpenClaw không tự động bỏ qua nhà cung cấp đó mãi mãi. Nó đưa ra quyết định theo từng ứng viên:

<AccordionGroup>
  <Accordion title="Quyết định theo từng ứng viên">
    - Lỗi xác thực dai dẳng bỏ qua toàn bộ nhà cung cấp ngay lập tức.
    - Vô hiệu hóa thanh toán thường bị bỏ qua, nhưng ứng viên chính vẫn có thể được thăm dò theo điều tiết để có thể khôi phục mà không cần khởi động lại.
    - Ứng viên chính có thể được thăm dò gần thời điểm hết hồi chiêu, với điều tiết theo từng nhà cung cấp.
    - Các dự phòng anh em cùng nhà cung cấp có thể được thử bất chấp hồi chiêu khi lỗi có vẻ tạm thời (`rate_limit`, `overloaded`, hoặc không xác định). Điều này đặc biệt liên quan khi giới hạn tốc độ có phạm vi theo mô hình và một mô hình anh em vẫn có thể khôi phục ngay.
    - Các thăm dò hồi chiêu tạm thời bị giới hạn ở một lần cho mỗi nhà cung cấp trên mỗi lượt chạy dự phòng để một nhà cung cấp đơn lẻ không làm đình trệ chuyển đổi dự phòng sang nhà cung cấp khác.

  </Accordion>
</AccordionGroup>

## Ghi đè phiên và chuyển đổi mô hình trực tiếp

Các thay đổi mô hình phiên là trạng thái chia sẻ. Trình chạy đang hoạt động, lệnh `/model`, cập nhật Compaction/phiên, và đối soát phiên trực tiếp đều đọc hoặc ghi các phần của cùng một mục phiên.

Điều đó nghĩa là các lần thử lại dự phòng phải phối hợp với chuyển đổi mô hình trực tiếp:

- Chỉ các thay đổi mô hình do người dùng điều khiển tường minh mới đánh dấu một chuyển đổi trực tiếp đang chờ. Điều đó bao gồm `/model`, `session_status(model=...)`, và `sessions.patch`.
- Các thay đổi mô hình do hệ thống điều khiển như xoay vòng dự phòng, ghi đè Heartbeat, hoặc Compaction không tự đánh dấu một chuyển đổi trực tiếp đang chờ.
- Các ghi đè mô hình do người dùng điều khiển được xem là lựa chọn chính xác cho chính sách dự phòng, nên một nhà cung cấp đã chọn nhưng không thể truy cập sẽ hiển thị thành lỗi thay vì bị che bởi `agents.defaults.model.fallbacks`.
- Trước khi một lần thử lại dự phòng bắt đầu, trình chạy phản hồi lưu các trường ghi đè dự phòng đã chọn vào mục phiên.
- Các ghi đè dự phòng tự động vẫn được chọn trong các lượt tiếp theo để OpenClaw không thăm dò một mô hình chính đã biết là lỗi ở mọi tin nhắn. `/new`, `/reset`, và `sessions.reset` xóa các ghi đè có nguồn gốc tự động và đưa phiên về mặc định đã cấu hình.
- `/status` hiển thị mô hình đã chọn và, khi trạng thái dự phòng khác nhau, mô hình dự phòng đang hoạt động cùng lý do.
- Đối soát phiên trực tiếp ưu tiên các ghi đè phiên đã lưu hơn các trường mô hình runtime cũ.
- Nếu lỗi chuyển đổi trực tiếp trỏ tới một ứng viên sau trong chuỗi dự phòng đang hoạt động, OpenClaw nhảy trực tiếp tới mô hình đã chọn đó thay vì đi qua các ứng viên không liên quan trước.
- Nếu lần thử dự phòng lỗi, trình chạy chỉ khôi phục các trường ghi đè mà nó đã ghi, và chỉ khi chúng vẫn khớp với ứng viên lỗi đó.

Điều này ngăn cuộc đua kinh điển:

<Steps>
  <Step title="Mô hình chính lỗi">
    Mô hình chính đã chọn bị lỗi.
  </Step>
  <Step title="Dự phòng được chọn trong bộ nhớ">
    Ứng viên dự phòng được chọn trong bộ nhớ.
  </Step>
  <Step title="Kho phiên vẫn ghi mô hình chính cũ">
    Kho phiên vẫn phản ánh mô hình chính cũ.
  </Step>
  <Step title="Đối soát trực tiếp đọc trạng thái cũ">
    Đối soát phiên trực tiếp đọc trạng thái phiên cũ.
  </Step>
  <Step title="Thử lại bị kéo về">
    Lần thử lại bị kéo về mô hình cũ trước khi lần thử dự phòng bắt đầu.
  </Step>
</Steps>

Ghi đè dự phòng đã lưu đóng khoảng trống đó, và việc khôi phục hẹp giữ nguyên các thay đổi phiên thủ công hoặc runtime mới hơn.

## Khả năng quan sát và tóm tắt lỗi

`runWithModelFallback(...)` ghi lại chi tiết theo từng lần thử để đưa vào log và thông báo hồi chiêu hiển thị cho người dùng:

- nhà cung cấp/mô hình đã thử
- lý do (`rate_limit`, `overloaded`, `billing`, `auth`, `model_not_found`, và các lý do chuyển đổi dự phòng tương tự)
- trạng thái/mã tùy chọn
- tóm tắt lỗi dễ đọc

Log có cấu trúc `model_fallback_decision` cũng bao gồm các trường phẳng `fallbackStep*` khi một ứng viên lỗi, bị bỏ qua, hoặc một dự phòng sau đó thành công. Các trường này làm rõ quá trình chuyển tiếp đã thử (`fallbackStepFromModel`, `fallbackStepToModel`, `fallbackStepFromFailureReason`, `fallbackStepFromFailureDetail`, `fallbackStepFinalOutcome`) để bộ xuất log và chẩn đoán có thể tái dựng lỗi mô hình chính ngay cả khi dự phòng cuối cùng cũng lỗi.

Khi mọi ứng viên đều lỗi, OpenClaw ném `FallbackSummaryError`. Trình chạy phản hồi bên ngoài có thể dùng lỗi đó để tạo một thông báo cụ thể hơn như "tất cả mô hình hiện đang tạm thời bị giới hạn tốc độ" và bao gồm thời điểm hồi chiêu sớm nhất nếu biết.

Tóm tắt hồi chiêu đó có nhận biết mô hình:

- các giới hạn tốc độ theo phạm vi mô hình không liên quan bị bỏ qua đối với chuỗi nhà cung cấp/mô hình đã thử
- nếu chặn còn lại là một giới hạn tốc độ theo phạm vi mô hình khớp, OpenClaw báo thời điểm hết hạn khớp cuối cùng vẫn còn chặn mô hình đó

## Cấu hình liên quan

Xem [Cấu hình Gateway](/vi/gateway/configuration) để biết:

- `auth.profiles` / `auth.order`
- `auth.cooldowns.billingBackoffHours` / `auth.cooldowns.billingBackoffHoursByProvider`
- `auth.cooldowns.billingMaxHours` / `auth.cooldowns.failureWindowHours`
- `auth.cooldowns.overloadedProfileRotations` / `auth.cooldowns.overloadedBackoffMs`
- `auth.cooldowns.rateLimitedProfileRotations`
- `agents.defaults.model.primary` / `agents.defaults.model.fallbacks`
- định tuyến `agents.defaults.imageModel`

Xem [Mô hình](/vi/concepts/models) để biết tổng quan rộng hơn về lựa chọn mô hình và chuyển đổi dự phòng.
