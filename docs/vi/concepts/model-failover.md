---
read_when:
    - Chẩn đoán việc xoay vòng hồ sơ xác thực, thời gian chờ, hoặc hành vi dự phòng mô hình
    - Cập nhật quy tắc chuyển đổi dự phòng cho hồ sơ xác thực hoặc mô hình
    - Hiểu cách ghi đè mô hình phiên tương tác với các lần thử lại dự phòng
sidebarTitle: Model failover
summary: Cách OpenClaw xoay vòng hồ sơ xác thực và dự phòng giữa các mô hình
title: Chuyển đổi dự phòng mô hình
x-i18n:
    generated_at: "2026-06-27T17:24:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7be9b2ee7c2c6de42d454248a51219c1917ce9a3a93630dad0af6f67ec030de3
    source_path: concepts/model-failover.md
    workflow: 16
---

OpenClaw xử lý lỗi theo hai giai đoạn:

1. **Luân phiên hồ sơ xác thực** trong provider hiện tại.
2. **Dự phòng mô hình** sang mô hình tiếp theo trong `agents.defaults.model.fallbacks`.

Tài liệu này giải thích các quy tắc runtime và dữ liệu hỗ trợ chúng.

## Luồng runtime

Với một lượt chạy văn bản thông thường, OpenClaw đánh giá các ứng viên theo thứ tự này:

<Steps>
  <Step title="Phân giải trạng thái phiên">
    Phân giải mô hình phiên đang hoạt động và tùy chọn hồ sơ xác thực.
  </Step>
  <Step title="Xây dựng chuỗi ứng viên">
    Xây dựng chuỗi ứng viên mô hình từ lựa chọn mô hình hiện tại và chính sách dự phòng cho nguồn lựa chọn đó. Giá trị mặc định đã cấu hình, mô hình chính của tác vụ cron và mô hình dự phòng được chọn tự động có thể dùng các dự phòng đã cấu hình; lựa chọn phiên rõ ràng của người dùng là nghiêm ngặt.
  </Step>
  <Step title="Thử provider hiện tại">
    Thử provider hiện tại với các quy tắc luân phiên/cooldown hồ sơ xác thực.
  </Step>
  <Step title="Chuyển tiếp khi gặp lỗi đáng chuyển dự phòng">
    Nếu provider đó đã hết lựa chọn với một lỗi đáng chuyển dự phòng, chuyển sang ứng viên mô hình tiếp theo.
  </Step>
  <Step title="Lưu override dự phòng">
    Lưu override dự phòng đã chọn trước khi lượt thử lại bắt đầu để các trình đọc phiên khác thấy cùng provider/mô hình mà runner sắp dùng. Override mô hình đã lưu được đánh dấu `modelOverrideSource: "auto"`.
  </Step>
  <Step title="Hoàn tác hẹp khi thất bại">
    Nếu ứng viên dự phòng thất bại, chỉ hoàn tác các trường override phiên thuộc về dự phòng khi chúng vẫn khớp với ứng viên thất bại đó.
  </Step>
  <Step title="Ném FallbackSummaryError nếu cạn lựa chọn">
    Nếu mọi ứng viên đều thất bại, ném `FallbackSummaryError` với chi tiết theo từng lần thử và thời điểm hết cooldown sớm nhất khi biết được.
  </Step>
</Steps>

Cách này cố ý hẹp hơn "lưu và khôi phục toàn bộ phiên". Reply runner chỉ lưu các trường chọn mô hình mà nó sở hữu cho dự phòng:

- `providerOverride`
- `modelOverride`
- `modelOverrideSource`
- `authProfileOverride`
- `authProfileOverrideSource`
- `authProfileOverrideCompactionCount`

Điều đó ngăn một lượt thử lại dự phòng thất bại ghi đè các đột biến phiên mới hơn không liên quan, chẳng hạn thay đổi `/model` thủ công hoặc cập nhật luân phiên phiên xảy ra trong khi lần thử đang chạy.

## Chính sách nguồn lựa chọn

OpenClaw tách provider/mô hình đã chọn khỏi lý do nó được chọn. Nguồn đó kiểm soát việc chuỗi dự phòng có được phép dùng hay không:

- **Mặc định đã cấu hình**: `agents.defaults.model.primary` dùng `agents.defaults.model.fallbacks`.
- **Mô hình chính của agent**: `agents.list[].model` là nghiêm ngặt trừ khi đối tượng mô hình của agent đó có `fallbacks` riêng. Dùng `fallbacks: []` để làm rõ hành vi nghiêm ngặt, hoặc cung cấp danh sách không rỗng để bật dự phòng mô hình cho agent đó.
- **Override dự phòng tự động**: một dự phòng runtime ghi `providerOverride`, `modelOverride`, `modelOverrideSource: "auto"` và mô hình gốc đã chọn trước khi thử lại. Override tự động đó có thể tiếp tục đi theo chuỗi dự phòng đã cấu hình mà không thăm dò mô hình chính ở mọi tin nhắn, nhưng OpenClaw định kỳ thăm dò lại mô hình gốc đã cấu hình và xóa override tự động khi mô hình đó khôi phục. `/new`, `/reset` và `sessions.reset` cũng xóa các override có nguồn tự động. Heartbeat chạy mà không có `heartbeat.model` rõ ràng sẽ xóa các override tự động trực tiếp khi nguồn gốc của chúng không còn khớp với mặc định hiện tại đã cấu hình.
- **Override phiên của người dùng**: `/model`, trình chọn mô hình, `session_status(model=...)` và `sessions.patch` ghi `modelOverrideSource: "user"`. Đó là lựa chọn phiên chính xác. Nếu provider/mô hình đã chọn thất bại trước khi tạo phản hồi, OpenClaw báo lỗi thay vì trả lời từ một dự phòng đã cấu hình không liên quan.
- **Override phiên cũ**: các mục phiên cũ hơn có thể có `modelOverride` mà không có `modelOverrideSource`. OpenClaw coi chúng là override của người dùng để một lựa chọn cũ rõ ràng không bị âm thầm chuyển thành hành vi dự phòng.
- **Mô hình payload Cron**: `payload.model` / `--model` của một tác vụ cron là mô hình chính của tác vụ, không phải override phiên của người dùng. Nó dùng các dự phòng đã cấu hình trừ khi tác vụ cung cấp `payload.fallbacks`; `payload.fallbacks: []` làm cho lượt chạy cron nghiêm ngặt.

Khoảng thăm dò mô hình chính cho dự phòng tự động là năm phút và không thể cấu hình. OpenClaw ghi nhớ các lần thăm dò gần đây theo phiên và mô hình chính để mô hình chính đang lỗi không bị thử lại ở mọi lượt. OpenClaw gửi thông báo hiển thị khi một phiên chuyển sang dự phòng và một thông báo khác khi phiên trở lại mô hình chính đã chọn; nó không lặp lại thông báo ở mọi lượt dự phòng bám dính.

## Bộ nhớ đệm bỏ qua lỗi xác thực

Theo mặc định, mỗi lượt mới giữ hành vi thử lại dự phòng hiện có: OpenClaw
sẽ thử lại từng ứng viên dự phòng đã cấu hình, bao gồm các ứng viên không phải mô hình chính
vừa thất bại gần đây với `auth` hoặc `auth_permanent`.

Người vận hành muốn chặn các lỗi xác thực lặp lại đó có thể bật bằng:

```bash
OPENCLAW_FALLBACK_SKIP_TTL_MS=60000
```

Khi bật, OpenClaw ghi một dấu bỏ qua trong bộ nhớ, theo phạm vi phiên, cho một
ứng viên dự phòng không phải mô hình chính sau lỗi thuộc lớp xác thực. Dấu này được định khóa
theo id phiên, provider và mô hình. Ứng viên mô hình chính không bao giờ bị bỏ qua, nên một
lựa chọn mô hình rõ ràng của người dùng vẫn hiển thị lỗi xác thực thật. Bộ nhớ đệm này
cục bộ theo tiến trình và bị xóa khi Gateway khởi động lại.

Giá trị là TTL tính bằng mili giây. `0` hoặc giá trị chưa đặt sẽ tắt bộ nhớ đệm.
Giá trị dương được kẹp trong khoảng từ 1 giây đến 10 phút.

## Thông báo dự phòng hiển thị cho người dùng

Khi một phiên chuyển sang dự phòng được chọn tự động, OpenClaw gửi một thông báo trạng thái trong cùng bề mặt phản hồi:

```text
↪️ Model Fallback: <fallback> (selected <primary>; <reason>)
```

Khi một lần thăm dò sau đó thành công và phiên quay lại mô hình chính đã chọn, OpenClaw gửi:

```text
↪️ Model Fallback cleared: <primary> (was <fallback>)
```

Các thông báo này là thông điệp vận hành, không phải nội dung assistant. Chúng được gửi một lần cho mỗi thay đổi trạng thái, bao gồm các lượt chỉ có tác dụng phụ khi khả thi, nhưng các lượt dự phòng bám dính không lặp lại chúng. Việc gửi bỏ qua cơ chế chặn phản hồi theo nguồn thông thường, thông báo không chiếm ô phản hồi assistant đầu tiên cho các kênh theo luồng, và nó bị loại khỏi chuyển văn bản thành giọng nói cũng như trích xuất cam kết.

## Lưu trữ xác thực (khóa + OAuth)

OpenClaw dùng **hồ sơ xác thực** cho cả khóa API và token OAuth.

- Bí mật và trạng thái định tuyến xác thực runtime nằm trong `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`.
- Cấu hình `auth.profiles` / `auth.order` chỉ là **siêu dữ liệu + định tuyến** (không có bí mật).
- Tệp OAuth cũ chỉ để nhập: `~/.openclaw/credentials/oauth.json` (được nhập vào kho xác thực theo agent trong lần dùng đầu tiên).
- Các tệp cũ `auth-profiles.json`, `auth-state.json` và `auth.json` theo agent được nhập bởi `openclaw doctor --fix`.

Chi tiết hơn: [OAuth](/vi/concepts/oauth)

Loại thông tin xác thực:

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }` (+ `projectId`/`enterpriseUrl` cho một số provider)

## ID hồ sơ

Đăng nhập OAuth tạo các hồ sơ riêng biệt để nhiều tài khoản có thể cùng tồn tại.

- Mặc định: `provider:default` khi không có email.
- OAuth có email: `provider:<email>` (ví dụ `google-antigravity:user@gmail.com`).

Hồ sơ nằm trong kho hồ sơ xác thực `openclaw-agent.sqlite` theo agent.

## Thứ tự luân phiên

Khi một provider có nhiều hồ sơ, OpenClaw chọn thứ tự như sau:

<Steps>
  <Step title="Cấu hình rõ ràng">
    `auth.order[provider]` (nếu được đặt).
  </Step>
  <Step title="Hồ sơ đã cấu hình">
    `auth.profiles` được lọc theo provider.
  </Step>
  <Step title="Hồ sơ đã lưu">
    Các mục hồ sơ xác thực SQLite theo agent cho provider.
  </Step>
</Steps>

Nếu không cấu hình thứ tự rõ ràng, OpenClaw dùng thứ tự round-robin:

- **Khóa chính:** loại hồ sơ (**OAuth trước khóa API**).
- **Khóa phụ:** `usageStats.lastUsed` (cũ nhất trước, trong từng loại).
- **Hồ sơ cooldown/bị tắt** được chuyển xuống cuối, sắp xếp theo thời điểm hết hạn sớm nhất.

### Độ bám dính phiên (thân thiện với bộ nhớ đệm)

OpenClaw **ghim hồ sơ xác thực đã chọn theo phiên** để giữ ấm bộ nhớ đệm của provider. Nó **không** luân phiên ở mọi yêu cầu. Hồ sơ đã ghim được tái sử dụng cho đến khi:

- phiên được đặt lại (`/new` / `/reset`)
- một Compaction hoàn tất (số đếm Compaction tăng)
- hồ sơ đang cooldown/bị tắt

Lựa chọn thủ công qua `/model …@<profileId>` đặt một **override của người dùng** cho phiên đó và không được tự động luân phiên cho đến khi phiên mới bắt đầu.

<Note>
Hồ sơ được tự động ghim (do bộ định tuyến phiên chọn) được xem là một **tùy chọn ưu tiên**: chúng được thử trước, nhưng OpenClaw có thể luân phiên sang hồ sơ khác khi gặp giới hạn tốc độ/hết thời gian. Khi hồ sơ ban đầu khả dụng trở lại, các lượt chạy mới có thể ưu tiên nó lại mà không thay đổi mô hình đã chọn hoặc runtime. Hồ sơ do người dùng ghim vẫn khóa vào hồ sơ đó; nếu nó thất bại và đã cấu hình dự phòng mô hình, OpenClaw chuyển sang mô hình tiếp theo thay vì đổi hồ sơ.
</Note>

### Gói đăng ký OpenAI Codex cộng với dự phòng khóa API

Với mô hình agent OpenAI, xác thực và runtime là riêng biệt. `openai/gpt-*` vẫn ở trên
harness Codex trong khi xác thực có thể luân phiên giữa hồ sơ đăng ký Codex và
dự phòng khóa API OpenAI.

Dùng `auth.order.openai` cho thứ tự hướng tới người dùng:

```json5
{
  auth: {
    order: {
      openai: ["openai:user@example.com", "openai:api-key-backup"],
    },
  },
}
```

Dùng `openai:*` cho cả hồ sơ OAuth ChatGPT/Codex và hồ sơ khóa API
OpenAI. Khi gói đăng ký chạm giới hạn sử dụng Codex,
OpenClaw ghi lại thời điểm đặt lại chính xác khi Codex cung cấp, thử hồ sơ xác thực
theo thứ tự tiếp theo, và giữ lượt chạy bên trong harness Codex. Khi thời điểm đặt lại
đã qua, hồ sơ đăng ký đủ điều kiện trở lại và lựa chọn tự động tiếp theo
có thể quay lại hồ sơ đó.

Chỉ dùng hồ sơ do người dùng ghim khi bạn muốn ép một tài khoản/khóa cho
phiên đó. Hồ sơ do người dùng ghim cố ý nghiêm ngặt và không âm thầm nhảy
sang hồ sơ khác.

## Cooldown

Khi một hồ sơ thất bại do lỗi xác thực/giới hạn tốc độ (hoặc timeout trông giống giới hạn tốc độ), OpenClaw đánh dấu nó đang cooldown và chuyển sang hồ sơ tiếp theo.

<AccordionGroup>
  <Accordion title="Những gì rơi vào nhóm giới hạn tốc độ / timeout">
    Nhóm giới hạn tốc độ đó rộng hơn `429` thuần túy: nó cũng bao gồm thông điệp provider như `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded`, `throttled`, `resource exhausted`, và các giới hạn cửa sổ sử dụng định kỳ như `weekly/monthly limit reached`.

    Lỗi định dạng/yêu cầu không hợp lệ thường là lỗi kết thúc vì thử lại cùng payload sẽ thất bại theo cùng cách, nên OpenClaw hiển thị chúng thay vì luân phiên hồ sơ xác thực. Các đường sửa rồi thử lại đã biết có thể bật rõ ràng: ví dụ lỗi xác thực ID lệnh gọi công cụ Cloud Code Assist được làm sạch và thử lại một lần qua chính sách `allowFormatRetry`. Lỗi lý do dừng tương thích OpenAI như `Unhandled stop reason: error`, `stop reason: error` và `reason: error` được phân loại là tín hiệu timeout/chuyển dự phòng.

    Văn bản máy chủ chung cũng có thể rơi vào nhóm timeout đó khi nguồn khớp với một mẫu tạm thời đã biết. Ví dụ, thông điệp stream-wrapper runtime mô hình trần `An unknown error occurred` được xem là đáng chuyển dự phòng cho mọi provider vì runtime mô hình dùng chung phát ra thông điệp đó khi luồng provider kết thúc với `stopReason: "aborted"` hoặc `stopReason: "error"` mà không có chi tiết cụ thể. Payload JSON `api_error` với văn bản máy chủ tạm thời như `internal server error`, `unknown error, 520`, `upstream error` hoặc `backend error` cũng được xem là timeout đáng chuyển dự phòng.

    Văn bản upstream chung riêng của OpenRouter, chẳng hạn `Provider returned error` trần, chỉ được xem là timeout khi ngữ cảnh provider thực sự là OpenRouter. Văn bản dự phòng nội bộ chung như `LLM request failed with an unknown error.` vẫn được xử lý thận trọng và tự nó không kích hoạt chuyển dự phòng.

  </Accordion>
  <Accordion title="Giới hạn retry-after của SDK">
    Một số SDK của nhà cung cấp có thể ngủ trong một khoảng `Retry-After` dài trước khi trả quyền điều khiển về cho OpenClaw. Với các SDK dựa trên Stainless như Anthropic và OpenAI, mặc định OpenClaw giới hạn thời gian chờ `retry-after-ms` / `retry-after` nội bộ SDK ở 60 giây và hiển thị ngay các phản hồi có thể thử lại dài hơn để đường dẫn chuyển dự phòng này có thể chạy. Điều chỉnh hoặc tắt giới hạn bằng `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS`; xem [Hành vi thử lại](/vi/concepts/retry).
  </Accordion>
  <Accordion title="Thời gian chờ hồi theo phạm vi mô hình">
    Thời gian chờ hồi do giới hạn tốc độ cũng có thể được giới hạn theo phạm vi mô hình:

    - OpenClaw ghi lại `cooldownModel` cho các lỗi giới hạn tốc độ khi biết id mô hình bị lỗi.
    - Một mô hình cùng cấp trên cùng nhà cung cấp vẫn có thể được thử khi thời gian chờ hồi được giới hạn cho một mô hình khác.
    - Các khoảng liên quan đến thanh toán/bị tắt vẫn chặn toàn bộ hồ sơ trên mọi mô hình.

  </Accordion>
</AccordionGroup>

Thời gian chờ hồi dùng backoff lũy thừa:

- 1 phút
- 5 phút
- 25 phút
- 1 giờ (giới hạn)

Trạng thái được lưu trong trạng thái xác thực SQLite theo từng tác tử dưới `usageStats`:

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

Các lỗi thanh toán/tín dụng (ví dụ "insufficient credits" / "credit balance too low") được xem là đáng để chuyển dự phòng, nhưng thường không phải là lỗi tạm thời. Thay vì một thời gian chờ hồi ngắn, OpenClaw đánh dấu hồ sơ là **bị vô hiệu hóa** (với backoff dài hơn) và luân chuyển sang hồ sơ/nhà cung cấp tiếp theo.

<Note>
Không phải mọi phản hồi có dạng thanh toán đều là `402`, và không phải mọi HTTP `402` đều đi vào đây. OpenClaw giữ văn bản thanh toán rõ ràng trong nhánh thanh toán ngay cả khi nhà cung cấp trả về `401` hoặc `403`, nhưng các bộ khớp dành riêng cho nhà cung cấp vẫn chỉ nằm trong phạm vi nhà cung cấp sở hữu chúng (ví dụ OpenRouter `403 Key limit exceeded`).

Trong khi đó, các lỗi tạm thời `402` về cửa sổ sử dụng và giới hạn chi tiêu của tổ chức/không gian làm việc được phân loại là `rate_limit` khi thông báo có vẻ có thể thử lại (ví dụ `weekly usage limit exhausted`, `daily limit reached, resets tomorrow`, hoặc `organization spending limit exceeded`). Chúng ở lại đường dẫn thời gian chờ hồi ngắn/chuyển dự phòng thay vì đường dẫn vô hiệu hóa thanh toán dài.
</Note>

Trạng thái được lưu trong trạng thái xác thực SQLite theo từng tác tử:

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

- Backoff thanh toán bắt đầu ở **5 giờ**, tăng gấp đôi theo mỗi lần lỗi thanh toán, và giới hạn ở **24 giờ**.
- Bộ đếm backoff đặt lại nếu hồ sơ không lỗi trong **24 giờ** (có thể cấu hình).
- Các lần thử lại do quá tải cho phép **1 lần luân chuyển hồ sơ cùng nhà cung cấp** trước khi fallback mô hình.
- Các lần thử lại do quá tải mặc định dùng **backoff 0 ms**.

## Fallback mô hình

Nếu tất cả hồ sơ cho một nhà cung cấp đều lỗi, OpenClaw chuyển sang mô hình tiếp theo trong `agents.defaults.model.fallbacks`. Điều này áp dụng cho lỗi xác thực, giới hạn tốc độ, và timeout đã dùng hết luân chuyển hồ sơ (các lỗi khác không tiến sang fallback). Các lỗi nhà cung cấp không bộc lộ đủ chi tiết vẫn được gắn nhãn chính xác trong trạng thái fallback: `empty_response` nghĩa là nhà cung cấp không trả về thông báo hoặc trạng thái dùng được, `no_error_details` nghĩa là nhà cung cấp trả về rõ ràng `Unknown error (no error details in response)`, và `unclassified` nghĩa là OpenClaw đã giữ bản xem trước thô nhưng chưa có bộ phân loại nào khớp.

Các lỗi quá tải và giới hạn tốc độ được xử lý quyết liệt hơn so với thời gian chờ hồi thanh toán. Mặc định, OpenClaw cho phép một lần thử lại hồ sơ xác thực cùng nhà cung cấp, rồi chuyển sang fallback mô hình đã cấu hình tiếp theo mà không chờ. Các tín hiệu nhà cung cấp bận như `ModelNotReadyException` đi vào nhóm quá tải đó. Điều chỉnh bằng `auth.cooldowns.overloadedProfileRotations`, `auth.cooldowns.overloadedBackoffMs`, và `auth.cooldowns.rateLimitedProfileRotations`.

Khi một lượt chạy bắt đầu từ chính mặc định đã cấu hình, chính của cron job, chính của tác tử có fallback rõ ràng, hoặc ghi đè fallback được tự động chọn, OpenClaw có thể đi qua chuỗi fallback đã cấu hình tương ứng. Các chính của tác tử không có fallback rõ ràng và các lựa chọn người dùng rõ ràng (ví dụ `/model ollama/qwen3.5:27b`, bộ chọn mô hình, `sessions.patch`, hoặc ghi đè nhà cung cấp/mô hình một lần từ CLI) là nghiêm ngặt: nếu nhà cung cấp/mô hình đó không thể truy cập hoặc lỗi trước khi tạo phản hồi, OpenClaw báo cáo lỗi thay vì trả lời từ một fallback không liên quan.

### Quy tắc chuỗi ứng viên

OpenClaw xây dựng danh sách ứng viên từ `provider/model` hiện đang được yêu cầu cộng với các fallback đã cấu hình.

<AccordionGroup>
  <Accordion title="Quy tắc">
    - Mô hình được yêu cầu luôn đứng đầu.
    - Các fallback được cấu hình rõ ràng được loại trùng lặp nhưng không bị lọc theo danh sách cho phép mô hình. Chúng được xem là ý định rõ ràng của người vận hành.
    - Nếu lượt chạy hiện tại đã ở trên một fallback đã cấu hình trong cùng họ nhà cung cấp, OpenClaw tiếp tục dùng toàn bộ chuỗi đã cấu hình.
    - Khi không cung cấp ghi đè fallback rõ ràng, các fallback đã cấu hình được thử trước chính đã cấu hình ngay cả khi mô hình được yêu cầu dùng nhà cung cấp khác.
    - Khi không cung cấp ghi đè fallback rõ ràng cho runner fallback, chính đã cấu hình được nối vào cuối để chuỗi có thể quay lại mặc định bình thường sau khi các ứng viên trước đó đã cạn.
    - Khi caller cung cấp `fallbacksOverride`, runner dùng đúng mô hình được yêu cầu cộng với danh sách ghi đè đó. Danh sách rỗng tắt fallback mô hình và ngăn chính đã cấu hình được nối thêm như một mục tiêu thử lại ẩn.

  </Accordion>
</AccordionGroup>

### Lỗi nào tiến fallback

<Tabs>
  <Tab title="Tiếp tục khi">
    - lỗi xác thực
    - giới hạn tốc độ và cạn thời gian chờ hồi
    - lỗi quá tải/nhà cung cấp bận
    - lỗi chuyển dự phòng có dạng timeout
    - vô hiệu hóa do thanh toán
    - `LiveSessionModelSwitchError`, được chuẩn hóa thành đường dẫn chuyển dự phòng để một mô hình đã lưu cũ không tạo vòng lặp thử lại bên ngoài
    - các lỗi không nhận diện khác khi vẫn còn ứng viên

  </Tab>
  <Tab title="Không tiếp tục khi">
    - hủy rõ ràng không có dạng timeout/chuyển dự phòng
    - lỗi tràn ngữ cảnh nên ở lại trong logic Compaction/thử lại (ví dụ `request_too_large`, `INVALID_ARGUMENT: input exceeds the maximum number of tokens`, `input token count exceeds the maximum number of input tokens`, `The input is too long for the model`, hoặc `ollama error: context length exceeded`)
    - lỗi không xác định cuối cùng khi không còn ứng viên nào

  </Tab>
</Tabs>

### Hành vi bỏ qua thời gian chờ hồi và thăm dò

Khi mọi hồ sơ xác thực cho một nhà cung cấp đều đang trong thời gian chờ hồi, OpenClaw không tự động bỏ qua nhà cung cấp đó mãi mãi. Nó đưa ra quyết định theo từng ứng viên:

<AccordionGroup>
  <Accordion title="Quyết định theo từng ứng viên">
    - Lỗi xác thực dai dẳng bỏ qua toàn bộ nhà cung cấp ngay lập tức.
    - Vô hiệu hóa do thanh toán thường bị bỏ qua, nhưng ứng viên chính vẫn có thể được thăm dò theo tiết lưu để có thể phục hồi mà không cần khởi động lại.
    - Ứng viên chính có thể được thăm dò gần lúc hết thời gian chờ hồi, với tiết lưu theo từng nhà cung cấp.
    - Các fallback cùng cấp cùng nhà cung cấp có thể được thử bất chấp thời gian chờ hồi khi lỗi có vẻ tạm thời (`rate_limit`, `overloaded`, hoặc không xác định). Điều này đặc biệt liên quan khi giới hạn tốc độ theo phạm vi mô hình và một mô hình cùng cấp vẫn có thể phục hồi ngay.
    - Các lần thăm dò thời gian chờ hồi tạm thời bị giới hạn ở một lần cho mỗi nhà cung cấp trong mỗi lượt chạy fallback để một nhà cung cấp đơn lẻ không làm kẹt fallback xuyên nhà cung cấp.

  </Accordion>
</AccordionGroup>

## Ghi đè phiên và chuyển đổi mô hình trực tiếp

Thay đổi mô hình phiên là trạng thái dùng chung. Runner đang hoạt động, lệnh `/model`, cập nhật Compaction/phiên, và đối soát phiên trực tiếp đều đọc hoặc ghi các phần của cùng một mục phiên.

Điều đó nghĩa là các lần thử lại fallback phải phối hợp với chuyển đổi mô hình trực tiếp:

- Chỉ các thay đổi mô hình do người dùng rõ ràng thúc đẩy mới đánh dấu một chuyển đổi trực tiếp đang chờ. Điều đó bao gồm `/model`, `session_status(model=...)`, và `sessions.patch`.
- Các thay đổi mô hình do hệ thống thúc đẩy như luân chuyển fallback, ghi đè Heartbeat, hoặc Compaction không bao giờ tự đánh dấu một chuyển đổi trực tiếp đang chờ.
- Ghi đè mô hình do người dùng thúc đẩy được xem là lựa chọn chính xác cho chính sách fallback, nên một nhà cung cấp được chọn nhưng không thể truy cập sẽ hiện lỗi thay vì bị che bởi `agents.defaults.model.fallbacks`.
- Trước khi một lần thử lại fallback bắt đầu, reply runner lưu các trường ghi đè fallback đã chọn vào mục phiên.
- Ghi đè fallback tự động vẫn được chọn ở các lượt tiếp theo để OpenClaw không thăm dò một chính đã biết là lỗi trên mọi tin nhắn. OpenClaw định kỳ thăm dò lại origin đã cấu hình và xóa ghi đè tự động khi nó phục hồi; `/new`, `/reset`, và `sessions.reset` xóa ngay các ghi đè có nguồn tự động.
- Phản hồi cho người dùng thông báo các chuyển tiếp fallback và phục hồi khi fallback được xóa một lần cho mỗi thay đổi trạng thái. Các lượt fallback bám dính không lặp lại thông báo.
- `/status` hiển thị mô hình đã chọn và, khi trạng thái fallback khác, mô hình fallback đang hoạt động cùng lý do.
- Đối soát phiên trực tiếp ưu tiên ghi đè phiên đã lưu hơn các trường mô hình runtime cũ.
- Nếu lỗi chuyển đổi trực tiếp trỏ tới một ứng viên sau trong chuỗi fallback đang hoạt động, OpenClaw nhảy thẳng đến mô hình đã chọn đó thay vì đi qua các ứng viên không liên quan trước.
- Nếu lần thử fallback thất bại, runner chỉ rollback các trường ghi đè mà nó đã ghi, và chỉ khi chúng vẫn khớp với ứng viên đã thất bại đó.

Điều này ngăn cuộc đua cổ điển:

<Steps>
  <Step title="Chính lỗi">
    Mô hình chính đã chọn bị lỗi.
  </Step>
  <Step title="Fallback được chọn trong bộ nhớ">
    Ứng viên fallback được chọn trong bộ nhớ.
  </Step>
  <Step title="Kho phiên vẫn nói chính cũ">
    Kho phiên vẫn phản ánh chính cũ.
  </Step>
  <Step title="Đối soát trực tiếp đọc trạng thái cũ">
    Đối soát phiên trực tiếp đọc trạng thái phiên cũ.
  </Step>
  <Step title="Thử lại bị kéo về">
    Lần thử lại bị kéo về mô hình cũ trước khi lần thử fallback bắt đầu.
  </Step>
</Steps>

Ghi đè fallback đã lưu đóng cửa sổ đó, và rollback hẹp giữ nguyên các thay đổi phiên thủ công hoặc runtime mới hơn.

## Khả năng quan sát và tóm tắt lỗi

`runWithModelFallback(...)` ghi lại chi tiết theo từng lần thử để đưa vào log và thông báo thời gian chờ hồi hiển thị cho người dùng:

- nhà cung cấp/mô hình đã thử
- lý do (`rate_limit`, `overloaded`, `billing`, `auth`, `model_not_found`, và các lý do chuyển dự phòng tương tự)
- trạng thái/mã tùy chọn
- tóm tắt lỗi dễ đọc cho người dùng

Các log có cấu trúc `model_fallback_decision` cũng bao gồm các trường phẳng `fallbackStep*` khi một ứng viên lỗi, bị bỏ qua, hoặc một fallback sau đó thành công. Các trường này làm rõ chuyển tiếp đã thử (`fallbackStepFromModel`, `fallbackStepToModel`, `fallbackStepFromFailureReason`, `fallbackStepFromFailureDetail`, `fallbackStepFinalOutcome`) để các bộ xuất log và chẩn đoán có thể tái dựng lỗi chính ngay cả khi fallback cuối cùng cũng lỗi.

Khi mọi ứng viên đều lỗi, OpenClaw ném `FallbackSummaryError`. Reply runner bên ngoài có thể dùng lỗi đó để xây dựng một thông báo cụ thể hơn, chẳng hạn "all models are temporarily rate-limited", và bao gồm thời điểm hết thời gian chờ hồi sớm nhất khi biết được.

Tóm tắt thời gian chờ hồi đó có nhận biết mô hình:

- các giới hạn tốc độ theo phạm vi mô hình không liên quan bị bỏ qua đối với chuỗi nhà cung cấp/mô hình đã thử
- nếu phần chặn còn lại là giới hạn tốc độ theo phạm vi mô hình khớp, OpenClaw báo cáo thời điểm hết hạn khớp cuối cùng vẫn còn chặn mô hình đó

## Cấu hình liên quan

Xem [Cấu hình Gateway](/vi/gateway/configuration) để biết:

- `auth.profiles` / `auth.order`
- `auth.cooldowns.billingBackoffHours` / `auth.cooldowns.billingBackoffHoursByProvider`
- `auth.cooldowns.billingMaxHours` / `auth.cooldowns.failureWindowHours`
- `auth.cooldowns.overloadedProfileRotations` / `auth.cooldowns.overloadedBackoffMs`
- `auth.cooldowns.rateLimitedProfileRotations`
- `agents.defaults.model.primary` / `agents.defaults.model.fallbacks`
- định tuyến `agents.defaults.imageModel`

Xem [Mô hình](/vi/concepts/models) để biết tổng quan rộng hơn về lựa chọn mô hình và dự phòng.
