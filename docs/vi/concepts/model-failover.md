---
read_when:
    - Chẩn đoán việc xoay vòng hồ sơ xác thực, thời gian chờ, hoặc hành vi chuyển dự phòng của mô hình
    - Cập nhật các quy tắc chuyển đổi dự phòng cho hồ sơ xác thực hoặc mô hình
    - Hiểu cách các ghi đè mô hình phiên tương tác với các lần thử lại dự phòng
sidebarTitle: Model failover
summary: Cách OpenClaw xoay vòng hồ sơ xác thực và chuyển dự phòng giữa các mô hình
title: Chuyển đổi dự phòng mô hình
x-i18n:
    generated_at: "2026-05-10T19:31:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 65de51fd4916aac8183a10afdfe3e0259cb85442de39e6d50fddf8a95bd420ae
    source_path: concepts/model-failover.md
    workflow: 16
---

OpenClaw xử lý lỗi theo hai giai đoạn:

1. **Luân chuyển hồ sơ xác thực** trong nhà cung cấp hiện tại.
2. **Dự phòng mô hình** sang mô hình tiếp theo trong `agents.defaults.model.fallbacks`.

Tài liệu này giải thích các quy tắc thời gian chạy và dữ liệu hỗ trợ chúng.

## Luồng thời gian chạy

Với một lần chạy văn bản thông thường, OpenClaw đánh giá các ứng viên theo thứ tự này:

<Steps>
  <Step title="Resolve session state">
    Phân giải mô hình phiên đang hoạt động và tùy chọn hồ sơ xác thực.
  </Step>
  <Step title="Build candidate chain">
    Xây dựng chuỗi ứng viên mô hình từ lựa chọn mô hình hiện tại và chính sách dự phòng cho nguồn lựa chọn đó. Các mặc định đã cấu hình, mô hình chính của công việc cron, và các mô hình dự phòng được tự động chọn có thể dùng các dự phòng đã cấu hình; các lựa chọn phiên rõ ràng của người dùng là nghiêm ngặt.
  </Step>
  <Step title="Try the current provider">
    Thử nhà cung cấp hiện tại với các quy tắc luân chuyển/thời gian chờ hồi phục của hồ sơ xác thực.
  </Step>
  <Step title="Advance on failover-worthy errors">
    Nếu nhà cung cấp đó đã cạn lựa chọn với một lỗi đáng chuyển đổi dự phòng, chuyển sang ứng viên mô hình tiếp theo.
  </Step>
  <Step title="Persist fallback override">
    Lưu ghi đè dự phòng đã chọn trước khi bắt đầu thử lại để các trình đọc phiên khác thấy cùng nhà cung cấp/mô hình mà trình chạy sắp dùng. Ghi đè mô hình đã lưu được đánh dấu `modelOverrideSource: "auto"`.
  </Step>
  <Step title="Roll back narrowly on failure">
    Nếu ứng viên dự phòng thất bại, chỉ khôi phục các trường ghi đè phiên do dự phòng sở hữu khi chúng vẫn khớp với ứng viên đã thất bại đó.
  </Step>
  <Step title="Throw FallbackSummaryError if exhausted">
    Nếu mọi ứng viên đều thất bại, ném một `FallbackSummaryError` với chi tiết từng lần thử và thời điểm hết thời gian chờ hồi phục sớm nhất khi biết được.
  </Step>
</Steps>

Điều này cố ý hẹp hơn so với "lưu và khôi phục toàn bộ phiên". Trình chạy phản hồi chỉ lưu các trường chọn mô hình mà nó sở hữu cho dự phòng:

- `providerOverride`
- `modelOverride`
- `modelOverrideSource`
- `authProfileOverride`
- `authProfileOverrideSource`
- `authProfileOverrideCompactionCount`

Điều đó ngăn một lần thử lại dự phòng thất bại ghi đè các thay đổi phiên mới hơn không liên quan, chẳng hạn như thay đổi `/model` thủ công hoặc cập nhật luân chuyển phiên xảy ra trong khi lần thử đang chạy.

## Chính sách nguồn lựa chọn

OpenClaw tách nhà cung cấp/mô hình đã chọn khỏi lý do nó được chọn. Nguồn đó kiểm soát việc chuỗi dự phòng có được phép hay không:

- **Mặc định đã cấu hình**: `agents.defaults.model.primary` dùng `agents.defaults.model.fallbacks`.
- **Mô hình chính của tác nhân**: `agents.list[].model` là nghiêm ngặt trừ khi đối tượng mô hình tác nhân đó có `fallbacks` riêng. Dùng `fallbacks: []` để làm rõ hành vi nghiêm ngặt, hoặc cung cấp một danh sách không rỗng để cho tác nhân đó tham gia dự phòng mô hình.
- **Ghi đè dự phòng tự động**: dự phòng thời gian chạy ghi `providerOverride`, `modelOverride`, `modelOverrideSource: "auto"`, và mô hình gốc đã chọn trước khi thử lại. Ghi đè tự động đó có thể tiếp tục đi theo chuỗi dự phòng đã cấu hình và được xóa bởi `/new`, `/reset`, và `sessions.reset`. Các lần chạy Heartbeat không có `heartbeat.model` rõ ràng cũng xóa một ghi đè tự động trực tiếp khi nguồn gốc của nó không còn khớp với mặc định đã cấu hình hiện tại.
- **Ghi đè phiên của người dùng**: `/model`, bộ chọn mô hình, `session_status(model=...)`, và `sessions.patch` ghi `modelOverrideSource: "user"`. Đó là một lựa chọn phiên chính xác. Nếu nhà cung cấp/mô hình đã chọn thất bại trước khi tạo phản hồi, OpenClaw báo lỗi thay vì trả lời từ một dự phòng đã cấu hình không liên quan.
- **Ghi đè phiên cũ**: các mục phiên cũ hơn có thể có `modelOverride` mà không có `modelOverrideSource`. OpenClaw xem chúng là ghi đè của người dùng để một lựa chọn cũ rõ ràng không bị âm thầm chuyển thành hành vi dự phòng.
- **Mô hình tải trọng Cron**: một công việc cron `payload.model` / `--model` là mô hình chính của công việc, không phải ghi đè phiên của người dùng. Nó dùng các dự phòng đã cấu hình trừ khi công việc cung cấp `payload.fallbacks`; `payload.fallbacks: []` làm cho lần chạy cron nghiêm ngặt.

## Lưu trữ xác thực (khóa + OAuth)

OpenClaw dùng **hồ sơ xác thực** cho cả khóa API và token OAuth.

- Bí mật nằm trong `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (cũ: `~/.openclaw/agent/auth-profiles.json`).
- Trạng thái định tuyến xác thực thời gian chạy nằm trong `~/.openclaw/agents/<agentId>/agent/auth-state.json`.
- Cấu hình `auth.profiles` / `auth.order` chỉ là **siêu dữ liệu + định tuyến** (không có bí mật).
- Tệp OAuth cũ chỉ dùng để nhập: `~/.openclaw/credentials/oauth.json` (được nhập vào `auth-profiles.json` ở lần dùng đầu tiên).

Chi tiết hơn: [OAuth](/vi/concepts/oauth)

Loại thông tin xác thực:

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }` (+ `projectId`/`enterpriseUrl` cho một số nhà cung cấp)

## ID hồ sơ

Các lần đăng nhập OAuth tạo hồ sơ riêng để nhiều tài khoản có thể cùng tồn tại.

- Mặc định: `provider:default` khi không có email.
- OAuth có email: `provider:<email>` (ví dụ `google-antigravity:user@gmail.com`).

Hồ sơ nằm trong `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` dưới `profiles`.

## Thứ tự luân chuyển

Khi một nhà cung cấp có nhiều hồ sơ, OpenClaw chọn thứ tự như sau:

<Steps>
  <Step title="Explicit config">
    `auth.order[provider]` (nếu được đặt).
  </Step>
  <Step title="Configured profiles">
    `auth.profiles` được lọc theo nhà cung cấp.
  </Step>
  <Step title="Stored profiles">
    Các mục trong `auth-profiles.json` cho nhà cung cấp.
  </Step>
</Steps>

Nếu không có thứ tự rõ ràng được cấu hình, OpenClaw dùng thứ tự vòng tròn:

- **Khóa chính:** loại hồ sơ (**OAuth trước khóa API**).
- **Khóa phụ:** `usageStats.lastUsed` (cũ nhất trước, trong từng loại).
- **Hồ sơ đang chờ hồi phục/bị vô hiệu hóa** được chuyển xuống cuối, sắp xếp theo thời điểm hết hạn sớm nhất.

### Độ bám phiên (thân thiện với bộ nhớ đệm)

OpenClaw **ghim hồ sơ xác thực đã chọn theo phiên** để giữ ấm bộ nhớ đệm của nhà cung cấp. Nó **không** luân chuyển ở mọi yêu cầu. Hồ sơ đã ghim được dùng lại cho đến khi:

- phiên được đặt lại (`/new` / `/reset`)
- một lần Compaction hoàn tất (số đếm compaction tăng)
- hồ sơ đang trong thời gian chờ hồi phục/bị vô hiệu hóa

Lựa chọn thủ công qua `/model …@<profileId>` đặt một **ghi đè của người dùng** cho phiên đó và không được tự động luân chuyển cho đến khi một phiên mới bắt đầu.

<Note>
Các hồ sơ được tự động ghim (do bộ định tuyến phiên chọn) được xem là một **tùy chọn ưu tiên**: chúng được thử trước, nhưng OpenClaw có thể luân chuyển sang hồ sơ khác khi gặp giới hạn tốc độ/hết thời gian chờ. Các hồ sơ do người dùng ghim vẫn bị khóa vào hồ sơ đó; nếu nó thất bại và các dự phòng mô hình được cấu hình, OpenClaw chuyển sang mô hình tiếp theo thay vì đổi hồ sơ.
</Note>

### Vì sao OAuth có thể "trông như bị mất"

Nếu bạn có cả hồ sơ OAuth và hồ sơ khóa API cho cùng một nhà cung cấp, vòng tròn có thể chuyển đổi giữa chúng qua các tin nhắn trừ khi được ghim. Để buộc dùng một hồ sơ duy nhất:

- Ghim bằng `auth.order[provider] = ["provider:profileId"]`, hoặc
- Dùng ghi đè theo phiên qua `/model …` với một ghi đè hồ sơ (khi bề mặt UI/chat của bạn hỗ trợ).

## Thời gian chờ hồi phục

Khi một hồ sơ thất bại do lỗi xác thực/giới hạn tốc độ (hoặc một lần hết thời gian chờ trông giống giới hạn tốc độ), OpenClaw đánh dấu nó vào thời gian chờ hồi phục và chuyển sang hồ sơ tiếp theo.

<AccordionGroup>
  <Accordion title="What lands in the rate-limit / timeout bucket">
    Nhóm giới hạn tốc độ đó rộng hơn `429` đơn thuần: nó cũng bao gồm các thông báo nhà cung cấp như `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded`, `throttled`, `resource exhausted`, và các giới hạn cửa sổ sử dụng định kỳ như `weekly/monthly limit reached`.

    Lỗi định dạng/yêu cầu không hợp lệ thường là lỗi kết thúc vì thử lại cùng tải trọng sẽ thất bại theo cùng cách, nên OpenClaw hiển thị chúng thay vì luân chuyển hồ sơ xác thực. Các đường dẫn thử lại-sửa chữa đã biết có thể chọn tham gia rõ ràng: ví dụ các lỗi xác thực ID lệnh gọi công cụ Cloud Code Assist được làm sạch và thử lại một lần thông qua chính sách `allowFormatRetry`. Các lỗi lý do dừng tương thích OpenAI như `Unhandled stop reason: error`, `stop reason: error`, và `reason: error` được phân loại là tín hiệu hết thời gian chờ/chuyển đổi dự phòng.

    Văn bản máy chủ chung cũng có thể rơi vào nhóm hết thời gian chờ đó khi nguồn khớp với một mẫu tạm thời đã biết. Ví dụ, thông báo stream-wrapper trần của pi-ai `An unknown error occurred` được xem là đáng chuyển đổi dự phòng cho mọi nhà cung cấp vì pi-ai phát ra nó khi luồng nhà cung cấp kết thúc với `stopReason: "aborted"` hoặc `stopReason: "error"` mà không có chi tiết cụ thể. Các tải trọng JSON `api_error` với văn bản máy chủ tạm thời như `internal server error`, `unknown error, 520`, `upstream error`, hoặc `backend error` cũng được xem là hết thời gian chờ đáng chuyển đổi dự phòng.

    Văn bản upstream chung dành riêng cho OpenRouter như `Provider returned error` trần chỉ được xem là hết thời gian chờ khi ngữ cảnh nhà cung cấp thực sự là OpenRouter. Văn bản dự phòng nội bộ chung như `LLM request failed with an unknown error.` vẫn thận trọng và không tự nó kích hoạt chuyển đổi dự phòng.

  </Accordion>
  <Accordion title="SDK retry-after caps">
    Một số SDK nhà cung cấp có thể sẽ ngủ trong một cửa sổ `Retry-After` dài trước khi trả quyền điều khiển cho OpenClaw. Với các SDK dựa trên Stainless như Anthropic và OpenAI, OpenClaw mặc định giới hạn các khoảng chờ `retry-after-ms` / `retry-after` nội bộ SDK ở 60 giây và hiển thị ngay các phản hồi có thể thử lại dài hơn để đường dẫn chuyển đổi dự phòng này có thể chạy. Điều chỉnh hoặc vô hiệu hóa giới hạn bằng `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS`; xem [Hành vi thử lại](/vi/concepts/retry).
  </Accordion>
  <Accordion title="Model-scoped cooldowns">
    Thời gian chờ hồi phục do giới hạn tốc độ cũng có thể được phạm vi theo mô hình:

    - OpenClaw ghi `cooldownModel` cho các lỗi giới hạn tốc độ khi biết ID mô hình thất bại.
    - Một mô hình anh em trên cùng nhà cung cấp vẫn có thể được thử khi thời gian chờ hồi phục được phạm vi tới một mô hình khác.
    - Các cửa sổ thanh toán/bị vô hiệu hóa vẫn chặn toàn bộ hồ sơ trên các mô hình.

  </Accordion>
</AccordionGroup>

Thời gian chờ hồi phục dùng backoff lũy thừa:

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

Lỗi thanh toán/tín dụng (ví dụ "không đủ tín dụng" / "số dư tín dụng quá thấp") được xem là đáng chuyển đổi dự phòng, nhưng thường không phải tạm thời. Thay vì một thời gian chờ hồi phục ngắn, OpenClaw đánh dấu hồ sơ là **bị vô hiệu hóa** (với backoff dài hơn) và luân chuyển sang hồ sơ/nhà cung cấp tiếp theo.

<Note>
Không phải mọi phản hồi có dạng thanh toán đều là `402`, và không phải mọi HTTP `402` đều vào đây. OpenClaw giữ văn bản thanh toán rõ ràng trong làn thanh toán ngay cả khi nhà cung cấp trả về `401` hoặc `403` thay vào đó, nhưng các bộ khớp dành riêng cho nhà cung cấp vẫn được giới hạn trong nhà cung cấp sở hữu chúng (ví dụ OpenRouter `403 Key limit exceeded`).

Trong khi đó, các lỗi `402` tạm thời về cửa sổ sử dụng và giới hạn chi tiêu tổ chức/không gian làm việc được phân loại là `rate_limit` khi thông báo trông có thể thử lại (ví dụ `weekly usage limit exhausted`, `daily limit reached, resets tomorrow`, hoặc `organization spending limit exceeded`). Chúng vẫn ở đường dẫn thời gian chờ hồi phục ngắn/chuyển đổi dự phòng thay vì đường dẫn vô hiệu hóa do thanh toán dài.
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

- Backoff thanh toán bắt đầu ở **5 giờ**, nhân đôi theo mỗi lỗi thanh toán, và giới hạn ở **24 giờ**.
- Bộ đếm backoff đặt lại nếu hồ sơ không thất bại trong **24 giờ** (có thể cấu hình).
- Các lần thử lại quá tải cho phép **1 lần luân chuyển hồ sơ cùng nhà cung cấp** trước khi dự phòng mô hình.
- Các lần thử lại quá tải mặc định dùng **backoff 0 ms**.

## Dự phòng mô hình

If all profiles for a provider fail, OpenClaw moves to the next model in `agents.defaults.model.fallbacks`. This applies to auth failures, rate limits, and timeouts that exhausted profile rotation (other errors do not advance fallback). Provider errors that do not expose enough detail are still labeled precisely in fallback state: `empty_response` means the provider returned no usable message or status, `no_error_details` means the provider explicitly returned `Unknown error (no error details in response)`, and `unclassified` means OpenClaw preserved the raw preview but no classifier matched it yet.

Overloaded and rate-limit errors are handled more aggressively than billing cooldowns. By default, OpenClaw allows one same-provider auth-profile retry, then switches to the next configured model fallback without waiting. Provider-busy signals such as `ModelNotReadyException` land in that overloaded bucket. Tune this with `auth.cooldowns.overloadedProfileRotations`, `auth.cooldowns.overloadedBackoffMs`, and `auth.cooldowns.rateLimitedProfileRotations`.

When a run starts from the configured default primary, a cron job primary, an agent primary with explicit fallbacks, or an auto-selected fallback override, OpenClaw can walk the matching configured fallback chain. Agent primaries without explicit fallbacks and explicit user selections (for example `/model ollama/qwen3.5:27b`, the model picker, `sessions.patch`, or one-off CLI provider/model overrides) are strict: if that provider/model is unreachable or fails before producing a reply, OpenClaw reports the failure instead of answering from an unrelated fallback.

### Candidate chain rules

OpenClaw builds the candidate list from the currently requested `provider/model` plus configured fallbacks.

<AccordionGroup>
  <Accordion title="Rules">
    - The requested model is always first.
    - Explicit configured fallbacks are deduplicated but not filtered by the model allowlist. They are treated as explicit operator intent.
    - If the current run is already on a configured fallback in the same provider family, OpenClaw keeps using the full configured chain.
    - If the current run is on a different provider than config and that current model is not already part of the configured fallback chain, OpenClaw does not append unrelated configured fallbacks from another provider.
    - When no explicit fallback override is supplied to the fallback runner, the configured primary is appended at the end so the chain can settle back onto the normal default once earlier candidates are exhausted.
    - When a caller supplies `fallbacksOverride`, the runner uses exactly the requested model plus that override list. An empty list disables model fallback and prevents the configured primary from being appended as a hidden retry target.

  </Accordion>
</AccordionGroup>

### Which errors advance fallback

<Tabs>
  <Tab title="Continues on">
    - auth failures
    - rate limits and cooldown exhaustion
    - overloaded/provider-busy errors
    - timeout-shaped failover errors
    - billing disables
    - `LiveSessionModelSwitchError`, which is normalized into a failover path so a stale persisted model does not create an outer retry loop
    - other unrecognized errors when there are still remaining candidates

  </Tab>
  <Tab title="Does not continue on">
    - explicit aborts that are not timeout/failover-shaped
    - context overflow errors that should stay inside compaction/retry logic (for example `request_too_large`, `INVALID_ARGUMENT: input exceeds the maximum number of tokens`, `input token count exceeds the maximum number of input tokens`, `The input is too long for the model`, or `ollama error: context length exceeded`)
    - a final unknown error when there are no candidates left

  </Tab>
</Tabs>

### Cooldown skip vs probe behavior

When every auth profile for a provider is already in cooldown, OpenClaw does not automatically skip that provider forever. It makes a per-candidate decision:

<AccordionGroup>
  <Accordion title="Per-candidate decisions">
    - Persistent auth failures skip the whole provider immediately.
    - Billing disables usually skip, but the primary candidate can still be probed on a throttle so recovery is possible without restarting.
    - The primary candidate may be probed near cooldown expiry, with a per-provider throttle.
    - Same-provider fallback siblings can be attempted despite cooldown when the failure looks transient (`rate_limit`, `overloaded`, or unknown). This is especially relevant when a rate limit is model-scoped and a sibling model may still recover immediately.
    - Transient cooldown probes are limited to one per provider per fallback run so a single provider does not stall cross-provider fallback.

  </Accordion>
</AccordionGroup>

## Session overrides and live model switching

Session model changes are shared state. The active runner, `/model` command, compaction/session updates, and live-session reconciliation all read or write parts of the same session entry.

That means fallback retries have to coordinate with live model switching:

- Only explicit user-driven model changes mark a pending live switch. That includes `/model`, `session_status(model=...)`, and `sessions.patch`.
- System-driven model changes such as fallback rotation, heartbeat overrides, or compaction never mark a pending live switch on their own.
- User-driven model overrides are treated as exact selections for fallback policy, so an unreachable selected provider surfaces as a failure instead of being masked by `agents.defaults.model.fallbacks`.
- Before a fallback retry starts, the reply runner persists the selected fallback override fields to the session entry.
- Auto fallback overrides remain selected on subsequent turns so OpenClaw does not probe a known-bad primary on every message. `/new`, `/reset`, and `sessions.reset` clear auto-sourced overrides and return the session to the configured default.
- `/status` shows the selected model and, when fallback state differs, the active fallback model and reason.
- Live-session reconciliation prefers persisted session overrides over stale runtime model fields.
- If a live-switch error points at a later candidate in the active fallback chain, OpenClaw jumps directly to that selected model instead of walking unrelated candidates first.
- If the fallback attempt fails, the runner rolls back only the override fields it wrote, and only if they still match that failed candidate.

This prevents the classic race:

<Steps>
  <Step title="Primary fails">
    The selected primary model fails.
  </Step>
  <Step title="Fallback chosen in memory">
    Fallback candidate is chosen in memory.
  </Step>
  <Step title="Session store still says old primary">
    Session store still reflects the old primary.
  </Step>
  <Step title="Live reconciliation reads stale state">
    Live-session reconciliation reads the stale session state.
  </Step>
  <Step title="Retry snapped back">
    The retry gets snapped back to the old model before the fallback attempt starts.
  </Step>
</Steps>

The persisted fallback override closes that window, and the narrow rollback keeps newer manual or runtime session changes intact.

## Observability and failure summaries

`runWithModelFallback(...)` records per-attempt details that feed logs and user-facing cooldown messaging:

- provider/model attempted
- reason (`rate_limit`, `overloaded`, `billing`, `auth`, `model_not_found`, and similar failover reasons)
- optional status/code
- human-readable error summary

Structured `model_fallback_decision` logs also include flat `fallbackStep*` fields when a candidate fails, is skipped, or a later fallback succeeds. These fields make the attempted transition explicit (`fallbackStepFromModel`, `fallbackStepToModel`, `fallbackStepFromFailureReason`, `fallbackStepFromFailureDetail`, `fallbackStepFinalOutcome`) so log and diagnostic exporters can reconstruct the primary failure even when the terminal fallback also fails.

When every candidate fails, OpenClaw throws `FallbackSummaryError`. The outer reply runner can use that to build a more specific message such as "all models are temporarily rate-limited" and include the soonest cooldown expiry when one is known.

That cooldown summary is model-aware:

- unrelated model-scoped rate limits are ignored for the attempted provider/model chain
- if the remaining block is a matching model-scoped rate limit, OpenClaw reports the last matching expiry that still blocks that model

## Related config

See [Gateway configuration](/vi/gateway/configuration) for:

- `auth.profiles` / `auth.order`
- `auth.cooldowns.billingBackoffHours` / `auth.cooldowns.billingBackoffHoursByProvider`
- `auth.cooldowns.billingMaxHours` / `auth.cooldowns.failureWindowHours`
- `auth.cooldowns.overloadedProfileRotations` / `auth.cooldowns.overloadedBackoffMs`
- `auth.cooldowns.rateLimitedProfileRotations`
- `agents.defaults.model.primary` / `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel` routing

See [Models](/vi/concepts/models) for the broader model selection and fallback overview.
