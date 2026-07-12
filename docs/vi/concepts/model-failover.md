---
read_when:
    - Chẩn đoán hành vi luân chuyển hồ sơ xác thực, thời gian chờ hoặc chuyển sang mô hình dự phòng
    - Cập nhật các quy tắc chuyển đổi dự phòng cho hồ sơ xác thực hoặc mô hình
    - Tìm hiểu cách các giá trị ghi đè mô hình của phiên tương tác với các lần thử lại dự phòng
sidebarTitle: Model failover
summary: Cách OpenClaw luân phiên các hồ sơ xác thực và chuyển sang mô hình dự phòng
title: Chuyển đổi dự phòng mô hình
x-i18n:
    generated_at: "2026-07-12T07:48:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2da6399c8f5c6d9ab40486b553a41600a3c8eb64efa09e72784b81e42edbba61
    source_path: concepts/model-failover.md
    workflow: 16
---

OpenClaw xử lý lỗi theo hai giai đoạn:

1. **Luân chuyển hồ sơ xác thực** trong nhà cung cấp hiện tại.
2. **Chuyển sang mô hình dự phòng** tiếp theo trong `agents.defaults.model.fallbacks`.

## Luồng thời gian chạy

<Steps>
  <Step title="Phân giải trạng thái phiên">
    Phân giải mô hình của phiên đang hoạt động và tùy chọn ưu tiên hồ sơ xác thực.
  </Step>
  <Step title="Xây dựng chuỗi ứng viên">
    Xây dựng chuỗi mô hình ứng viên từ lựa chọn mô hình hiện tại và chính sách dự phòng dành cho nguồn lựa chọn đó. Các giá trị mặc định đã cấu hình, mô hình chính của tác vụ cron và mô hình dự phòng được tự động chọn có thể sử dụng các phương án dự phòng đã cấu hình; lựa chọn phiên rõ ràng của người dùng được áp dụng nghiêm ngặt.
  </Step>
  <Step title="Thử nhà cung cấp hiện tại">
    Thử nhà cung cấp hiện tại theo các quy tắc luân chuyển/thời gian chờ hồ sơ xác thực.
  </Step>
  <Step title="Chuyển tiếp khi gặp lỗi đủ điều kiện chuyển đổi dự phòng">
    Nếu nhà cung cấp đó đã hết phương án với một lỗi đủ điều kiện chuyển đổi dự phòng, hãy chuyển sang ứng viên mô hình tiếp theo.
  </Step>
  <Step title="Lưu đè lựa chọn dự phòng">
    Lưu đè lựa chọn dự phòng đã chọn trước khi bắt đầu thử lại để các trình đọc phiên khác thấy cùng nhà cung cấp/mô hình mà trình chạy sắp sử dụng. Giá trị đè mô hình đã lưu được đánh dấu là `modelOverrideSource: "auto"`.
  </Step>
  <Step title="Chỉ hoàn tác phạm vi hẹp khi thất bại">
    Nếu ứng viên dự phòng thất bại, chỉ hoàn tác các trường đè phiên thuộc quyền sở hữu của cơ chế dự phòng khi chúng vẫn khớp với ứng viên thất bại đó.
  </Step>
  <Step title="Ném FallbackSummaryError nếu hết mọi phương án">
    Nếu mọi ứng viên đều thất bại, ném `FallbackSummaryError` kèm thông tin chi tiết cho từng lần thử và thời điểm kết thúc thời gian chờ sớm nhất nếu xác định được.
  </Step>
</Steps>

Phạm vi này được chủ ý thu hẹp hơn so với “lưu và khôi phục toàn bộ phiên”. Trình chạy phản hồi chỉ lưu các trường lựa chọn mô hình mà nó sở hữu cho cơ chế dự phòng: `providerOverride`, `modelOverride`, `modelOverrideSource`, `authProfileOverride`, `authProfileOverrideSource`, `authProfileOverrideCompactionCount`. Điều này ngăn một lần thử lại bằng mô hình dự phòng bị thất bại ghi đè các thay đổi phiên mới hơn và không liên quan, chẳng hạn như thay đổi `/model` thủ công hoặc cập nhật luân chuyển phiên xảy ra trong khi lần thử đang chạy.

## Chính sách nguồn lựa chọn

Nguồn lựa chọn kiểm soát việc có cho phép chuỗi dự phòng hay không:

- **Giá trị mặc định đã cấu hình**: `agents.defaults.model.primary` sử dụng `agents.defaults.model.fallbacks`.
- **Mô hình chính của tác nhân**: `agents.list[].model` được áp dụng nghiêm ngặt trừ khi đối tượng mô hình của tác nhân đó chứa `fallbacks` riêng. Dùng `fallbacks: []` để thể hiện rõ hành vi nghiêm ngặt hoặc danh sách không rỗng để cho phép tác nhân đó sử dụng mô hình dự phòng.
- **Đè lựa chọn dự phòng tự động**: cơ chế dự phòng thời gian chạy ghi `providerOverride`, `modelOverride`, `modelOverrideSource: "auto"` và mô hình nguồn đã chọn trước khi thử lại. Giá trị đè này tiếp tục đi qua chuỗi dự phòng đã cấu hình mà không thăm dò mô hình chính ở mỗi tin nhắn, nhưng OpenClaw thăm dò mô hình nguồn đã cấu hình mỗi 5 phút (không thể cấu hình) và xóa giá trị đè khi mô hình đó phục hồi. `/new`, `/reset` và `sessions.reset` cũng xóa các giá trị đè có nguồn tự động. Các lần chạy Heartbeat không có `heartbeat.model` rõ ràng sẽ xóa giá trị đè tự động trực tiếp khi mô hình nguồn của chúng không còn khớp với giá trị mặc định hiện được cấu hình.
- **Đè lựa chọn phiên của người dùng**: `/model`, trình chọn mô hình, `session_status(model=...)` và `sessions.patch` ghi `modelOverrideSource: "user"`. Đây là lựa chọn phiên chính xác. Nếu nhà cung cấp/mô hình được chọn thất bại trước khi tạo phản hồi, OpenClaw báo lỗi thay vì trả lời bằng một mô hình dự phòng đã cấu hình nhưng không liên quan.
- **Đè lựa chọn phiên cũ**: các mục phiên cũ có thể có `modelOverride` nhưng không có `modelOverrideSource`. OpenClaw xem chúng là giá trị đè của người dùng để lựa chọn cũ rõ ràng không bị âm thầm chuyển thành hành vi dự phòng.
- **Mô hình trong tải trọng Cron**: `payload.model` / `--model` của tác vụ cron là mô hình chính của tác vụ, không phải giá trị đè phiên của người dùng. Nó sử dụng các phương án dự phòng đã cấu hình trừ khi tác vụ cung cấp `payload.fallbacks`; `payload.fallbacks: []` khiến lần chạy cron được áp dụng nghiêm ngặt.

OpenClaw ghi nhớ các lần thăm dò mô hình chính gần đây theo từng phiên và mô hình chính để không thử lại mô hình chính đang lỗi ở mỗi lượt. Hệ thống gửi một thông báo hiển thị khi phiên chuyển sang mô hình dự phòng và một thông báo khác khi quay lại mô hình chính đã chọn; hệ thống không lặp lại thông báo ở mỗi lượt tiếp tục dùng mô hình dự phòng.

## Bộ nhớ đệm bỏ qua lỗi xác thực

Theo mặc định, mỗi lượt mới giữ nguyên hành vi thử lại dự phòng hiện có: OpenClaw thử lại từng ứng viên dự phòng đã cấu hình, bao gồm các ứng viên không phải mô hình chính gần đây đã thất bại với `auth` hoặc `auth_permanent`.

Bật tùy chọn ngăn lặp lại lỗi xác thực bằng:

```bash
OPENCLAW_FALLBACK_SKIP_TTL_MS=60000
```

Khi được bật, OpenClaw ghi một dấu bỏ qua trong bộ nhớ và có phạm vi theo phiên cho ứng viên dự phòng không phải mô hình chính sau một lỗi thuộc lớp xác thực, được định danh theo mã phiên, nhà cung cấp và mô hình. Các ứng viên chính không bao giờ bị bỏ qua, vì vậy lựa chọn mô hình rõ ràng của người dùng vẫn hiển thị lỗi xác thực thực tế. Bộ nhớ đệm chỉ tồn tại cục bộ trong tiến trình và bị xóa khi Gateway khởi động lại.

Giá trị này là TTL tính bằng mili giây. `0` hoặc không đặt sẽ tắt bộ nhớ đệm. Các giá trị dương được giới hạn trong khoảng từ 1 giây đến 10 phút.

## Thông báo dự phòng hiển thị cho người dùng

Khi một phiên chuyển sang mô hình dự phòng được tự động chọn, OpenClaw gửi thông báo trạng thái trên cùng bề mặt phản hồi:

```text
↪️ Mô hình dự phòng: <fallback> (đã chọn <primary>; <reason>)
```

Khi một lần thăm dò sau đó thành công và phiên quay lại mô hình chính đã chọn, OpenClaw gửi:

```text
↪️ Đã xóa mô hình dự phòng: <primary> (trước đó là <fallback>)
```

Các thông báo này là thông điệp vận hành, không phải nội dung của trợ lý. Chúng được gửi một lần cho mỗi thay đổi trạng thái, bao gồm cả các lượt chỉ có hiệu ứng phụ khi khả thi, nhưng các lượt tiếp tục dùng mô hình dự phòng không lặp lại chúng. Việc gửi bỏ qua cơ chế chặn phản hồi nguồn thông thường, không chiếm vị trí phản hồi đầu tiên của trợ lý đối với các kênh theo luồng và không được đưa vào quá trình chuyển văn bản thành giọng nói hoặc trích xuất cam kết.

## Lưu trữ xác thực (khóa + OAuth)

OpenClaw sử dụng **hồ sơ xác thực** cho cả khóa API và token OAuth.

- Bí mật và trạng thái định tuyến xác thực thời gian chạy nằm trong `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`.
- Cấu hình `auth.profiles` / `auth.order` **chỉ chứa siêu dữ liệu + thông tin định tuyến** (không chứa bí mật).
- Tệp OAuth cũ chỉ dùng để nhập: `~/.openclaw/credentials/oauth.json` (được nhập vào kho xác thực theo từng tác nhân trong lần sử dụng đầu tiên).
- Các tệp cũ `auth-profiles.json`, `auth-state.json` và `auth.json` theo từng tác nhân được nhập bằng `openclaw doctor --fix`.

Chi tiết thêm: [OAuth](/vi/concepts/oauth)

Các loại thông tin xác thực:

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }` (+ `projectId`/`enterpriseUrl` đối với một số nhà cung cấp)
- `type: "token"` → token tĩnh kiểu bearer, có thể có thời hạn; OpenClaw không làm mới token này (được dùng cho `aws-sdk` và các chế độ xác thực theo chuỗi thông tin xác thực khác)

## Mã hồ sơ

Các lần đăng nhập OAuth tạo những hồ sơ riêng biệt để nhiều tài khoản có thể cùng tồn tại.

- Mặc định: `provider:default` khi không có email.
- OAuth có email: `provider:<email>` (ví dụ `google-antigravity:user@gmail.com`).

Các hồ sơ nằm trong kho hồ sơ xác thực `openclaw-agent.sqlite` theo từng tác nhân.

## Thứ tự luân chuyển

Khi một nhà cung cấp có nhiều hồ sơ, OpenClaw chọn thứ tự như sau:

<Steps>
  <Step title="Cấu hình rõ ràng">
    `auth.order[provider]` (nếu được đặt).
  </Step>
  <Step title="Hồ sơ đã cấu hình">
    `auth.profiles` được lọc theo nhà cung cấp.
  </Step>
  <Step title="Hồ sơ đã lưu">
    Các mục hồ sơ xác thực SQLite theo từng tác nhân dành cho nhà cung cấp.
  </Step>
</Steps>

Nếu không có thứ tự rõ ràng được cấu hình, OpenClaw sử dụng thứ tự xoay vòng:

- **Khóa chính:** loại hồ sơ (**OAuth, sau đó là token tĩnh, rồi khóa API**).
- **Khóa phụ:** `usageStats.lastUsed` (cũ nhất trước trong từng loại).
- **Các hồ sơ đang trong thời gian chờ/bị vô hiệu hóa** được chuyển xuống cuối và sắp xếp theo thời điểm hết hạn sớm nhất.

### Gắn kết với phiên (thân thiện với bộ nhớ đệm)

OpenClaw **ghim hồ sơ xác thực đã chọn theo từng phiên** để giữ ấm bộ nhớ đệm của nhà cung cấp. Hệ thống **không** luân chuyển ở mỗi yêu cầu. Hồ sơ đã ghim được tái sử dụng cho đến khi:

- phiên được đặt lại (`/new` / `/reset`)
- một lần Compaction hoàn tất (số lần Compaction tăng)
- hồ sơ đang trong thời gian chờ/bị vô hiệu hóa

Lựa chọn thủ công qua `/model …@<profileId>` đặt một **giá trị đè của người dùng** cho phiên đó và không được tự động luân chuyển cho đến khi bắt đầu phiên mới.

<Note>
Các hồ sơ được tự động ghim (do bộ định tuyến phiên chọn) được xem là một **tùy chọn ưu tiên**: chúng được thử trước, nhưng OpenClaw có thể luân chuyển sang hồ sơ khác khi gặp giới hạn tốc độ/hết thời gian chờ. Khi hồ sơ ban đầu khả dụng trở lại, các lần chạy mới có thể tiếp tục ưu tiên hồ sơ đó mà không thay đổi mô hình hoặc thời gian chạy đã chọn. Hồ sơ do người dùng ghim vẫn bị khóa vào hồ sơ đó; nếu hồ sơ thất bại và đã cấu hình mô hình dự phòng, OpenClaw chuyển sang mô hình tiếp theo thay vì đổi hồ sơ.
</Note>

### Gói đăng ký OpenAI Codex cùng khóa API dự phòng

Đối với các mô hình tác nhân OpenAI, xác thực và thời gian chạy là riêng biệt. `openai/gpt-*` vẫn dùng bộ khung Codex trong khi cơ chế xác thực có thể luân chuyển giữa hồ sơ đăng ký Codex và khóa API OpenAI dự phòng.

Dùng `auth.order.openai` để thiết lập thứ tự hiển thị cho người dùng:

```json5
{
  auth: {
    order: {
      openai: ["openai:user@example.com", "openai:api-key-backup"],
    },
  },
}
```

Dùng `openai:*` cho cả hồ sơ OAuth ChatGPT/Codex và hồ sơ khóa API OpenAI. Khi gói đăng ký đạt giới hạn sử dụng Codex, OpenClaw ghi lại thời điểm đặt lại chính xác nếu Codex cung cấp, thử hồ sơ xác thực tiếp theo theo thứ tự và giữ lần chạy trong bộ khung Codex. Sau khi thời điểm đặt lại trôi qua, hồ sơ đăng ký lại đủ điều kiện sử dụng và lần lựa chọn tự động tiếp theo có thể quay lại hồ sơ đó.

Chỉ dùng hồ sơ do người dùng ghim khi bạn muốn bắt buộc sử dụng một tài khoản/khóa cho phiên đó. Các hồ sơ do người dùng ghim được chủ ý áp dụng nghiêm ngặt và không âm thầm chuyển sang hồ sơ khác.

## Thời gian chờ

Khi một hồ sơ thất bại do lỗi xác thực/giới hạn tốc độ (hoặc lỗi hết thời gian có biểu hiện giống giới hạn tốc độ), OpenClaw đánh dấu hồ sơ đó đang trong thời gian chờ và chuyển sang hồ sơ tiếp theo.

<AccordionGroup>
  <Accordion title="Những lỗi được xếp vào nhóm giới hạn tốc độ / hết thời gian chờ">
    Nhóm giới hạn tốc độ đó rộng hơn mã `429` thông thường: nó cũng bao gồm các thông báo từ nhà cung cấp như `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded`, `throttled`, `resource exhausted` và các giới hạn cửa sổ sử dụng định kỳ như `weekly limit reached` hoặc `monthly limit exhausted`.

    Lỗi định dạng/yêu cầu không hợp lệ thường là lỗi kết thúc vì việc thử lại cùng tải trọng sẽ thất bại theo cùng cách, nên OpenClaw hiển thị chúng thay vì luân chuyển hồ sơ xác thực. Các đường dẫn sửa chữa rồi thử lại đã biết có thể được bật rõ ràng: ví dụ lỗi xác thực mã lệnh gọi công cụ Cloud Code Assist được làm sạch và thử lại một lần theo chính sách `allowFormatRetry`. Các lỗi lý do dừng tương thích với OpenAI như `Unhandled stop reason: error`, `stop reason: error` và `reason: error` được phân loại là tín hiệu hết thời gian chờ/chuyển đổi dự phòng.

    Văn bản lỗi máy chủ chung cũng có thể được xếp vào nhóm hết thời gian chờ đó khi nguồn khớp với một mẫu lỗi tạm thời đã biết. Ví dụ, thông báo thuần túy từ trình bọc luồng thời gian chạy mô hình `An unknown error occurred` được xem là đủ điều kiện chuyển đổi dự phòng đối với mọi nhà cung cấp vì thời gian chạy mô hình dùng chung phát thông báo này khi luồng nhà cung cấp kết thúc với `stopReason: "aborted"` hoặc `stopReason: "error"` mà không có chi tiết cụ thể. Tải trọng JSON `api_error` chứa văn bản lỗi máy chủ tạm thời như `internal server error`, `unknown error, 520`, `upstream error` hoặc `backend error` cũng được xem là lỗi hết thời gian chờ đủ điều kiện chuyển đổi dự phòng.

    Văn bản lỗi thượng nguồn chung dành riêng cho OpenRouter như `Provider returned error` chỉ được xem là lỗi hết thời gian chờ khi ngữ cảnh nhà cung cấp thực sự là OpenRouter. Văn bản dự phòng nội bộ chung như `LLM request failed with an unknown error.` được xử lý thận trọng và không tự kích hoạt chuyển đổi dự phòng.

  </Accordion>
  <Accordion title="Giới hạn retry-after của SDK">
    Nếu không, một số SDK của nhà cung cấp có thể tạm dừng trong khoảng thời gian `Retry-After` dài trước khi trả lại quyền điều khiển cho OpenClaw. Đối với các SDK dựa trên Stainless như Anthropic và OpenAI, theo mặc định OpenClaw giới hạn thời gian chờ `retry-after-ms` / `retry-after` nội bộ của SDK ở mức 60 giây và lập tức đưa ra các phản hồi có thể thử lại với thời gian chờ dài hơn để đường chuyển đổi dự phòng này có thể chạy. Điều chỉnh hoặc vô hiệu hóa giới hạn bằng `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS`; xem [Hành vi thử lại](/vi/concepts/retry).
  </Accordion>
  <Accordion title="Thời gian tạm ngưng theo mô hình">
    Thời gian tạm ngưng do giới hạn tốc độ cũng có thể áp dụng theo từng mô hình:

    - OpenClaw ghi lại `cooldownModel` cho các lỗi giới hạn tốc độ khi biết mã định danh của mô hình gặp lỗi.
    - Vẫn có thể thử một mô hình cùng cấp trên cùng nhà cung cấp khi thời gian tạm ngưng được giới hạn cho một mô hình khác.
    - Các khoảng thời gian liên quan đến thanh toán hoặc bị vô hiệu hóa vẫn chặn toàn bộ hồ sơ trên mọi mô hình.

  </Accordion>
</AccordionGroup>

Thời gian tạm ngưng thông thường (không liên quan đến thanh toán, không phải lỗi xác thực vĩnh viễn) tăng theo số lỗi gần đây của hồ sơ:

- Lần lỗi thứ 1: 30 giây
- Lần lỗi thứ 2: 1 phút
- Từ lần lỗi thứ 3 trở đi: 5 phút (giới hạn tối đa)

Bộ đếm được đặt lại sau khi khoảng thời gian lỗi của hồ sơ kết thúc (`auth.cooldowns.failureWindowHours`, mặc định là 24).

Trạng thái được lưu trong trạng thái xác thực SQLite theo từng tác nhân, dưới `usageStats`:

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

Các lỗi thanh toán/tín dụng (ví dụ: "không đủ tín dụng" / "số dư tín dụng quá thấp") được coi là đủ điều kiện để chuyển đổi dự phòng, nhưng thường không phải lỗi tạm thời. Thay vì áp dụng thời gian tạm ngưng ngắn, OpenClaw đánh dấu hồ sơ là **đã bị vô hiệu hóa** (với thời gian chờ lùi dài hơn) và chuyển sang hồ sơ/nhà cung cấp tiếp theo.

<Note>
Không phải mọi phản hồi có dạng lỗi thanh toán đều là `402`, và không phải mọi phản hồi HTTP `402` đều được xử lý tại đây. OpenClaw vẫn xếp nội dung thanh toán rõ ràng vào luồng thanh toán ngay cả khi nhà cung cấp trả về `401` hoặc `403`, nhưng các bộ so khớp dành riêng cho nhà cung cấp vẫn chỉ áp dụng cho nhà cung cấp sở hữu chúng (ví dụ: OpenRouter `403 Key limit exceeded`).

Trong khi đó, các lỗi `402` tạm thời về cửa sổ sử dụng và giới hạn chi tiêu của tổ chức/không gian làm việc được phân loại là `rate_limit` khi thông báo có vẻ cho phép thử lại (ví dụ: `weekly usage limit exhausted`, `daily limit reached, resets tomorrow` hoặc `organization spending limit exceeded`). Các lỗi này vẫn đi theo đường thời gian tạm ngưng ngắn/chuyển đổi dự phòng thay vì đường vô hiệu hóa dài hạn do thanh toán.
</Note>

Các lỗi xác thực vĩnh viễn có độ tin cậy cao (khóa đã bị thu hồi/vô hiệu hóa, không gian làm việc đã bị vô hiệu hóa) được đưa vào một luồng vô hiệu hóa tương tự, nhưng phục hồi sớm hơn nhiều so với lỗi thanh toán vì một số nhà cung cấp có thể tạm thời trả về tải trọng trông giống lỗi xác thực trong thời gian xảy ra sự cố.

Trạng thái được lưu trong trạng thái xác thực SQLite theo từng tác nhân:

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

Giá trị mặc định (`auth.cooldowns.*`):

| Khóa                          | Mặc định | Mục đích                                                                                  |
| ----------------------------- | -------- | ----------------------------------------------------------------------------------------- |
| `billingBackoffHours`         | 5        | Thời gian chờ lùi cơ sở cho thanh toán, tăng gấp đôi sau mỗi lỗi thanh toán               |
| `billingMaxHours`             | 24       | Giới hạn tối đa của thời gian chờ lùi do thanh toán                                       |
| `authPermanentBackoffMinutes` | 10       | Thời gian chờ lùi cơ sở cho các lỗi xác thực vĩnh viễn có độ tin cậy cao                  |
| `authPermanentMaxMinutes`     | 60       | Giới hạn tối đa cho thời gian chờ lùi đó                                                  |
| `failureWindowHours`          | 24       | Bộ đếm lỗi được đặt lại nếu không có lỗi nào xảy ra trong khoảng thời gian này            |
| `overloadedProfileRotations`  | 1        | Số lần được phép chuyển hồ sơ cùng nhà cung cấp trước khi dự phòng mô hình khi quá tải     |
| `overloadedBackoffMs`         | 0        | Độ trễ cố định trước khi thử lại một lần chuyển đổi do quá tải                            |
| `rateLimitedProfileRotations` | 1        | Số lần được phép chuyển hồ sơ cùng nhà cung cấp trước khi dự phòng mô hình khi bị giới hạn tốc độ |

Các lỗi quá tải và giới hạn tốc độ được xử lý quyết liệt hơn thời gian tạm ngưng do thanh toán: theo mặc định, OpenClaw cho phép thử lại một hồ sơ xác thực của cùng nhà cung cấp, sau đó chuyển sang mô hình dự phòng được cấu hình tiếp theo mà không chờ đợi.

## Dự phòng mô hình

Nếu tất cả hồ sơ của một nhà cung cấp đều gặp lỗi, OpenClaw chuyển sang mô hình tiếp theo trong `agents.defaults.model.fallbacks`. Điều này áp dụng cho lỗi xác thực, giới hạn tốc độ và thời gian chờ đã dùng hết các lượt chuyển hồ sơ (các lỗi khác không chuyển sang dự phòng). Các lỗi nhà cung cấp không cung cấp đủ chi tiết vẫn được gắn nhãn chính xác trong trạng thái dự phòng: `empty_response` nghĩa là nhà cung cấp không trả về thông báo hoặc trạng thái có thể sử dụng, `no_error_details` nghĩa là nhà cung cấp trả về rõ ràng `Unknown error (no error details in response)`, và `unclassified` nghĩa là OpenClaw đã giữ nguyên bản xem trước thô nhưng chưa có bộ phân loại nào khớp.

Các tín hiệu nhà cung cấp đang bận như `ModelNotReadyException` được đưa vào nhóm quá tải và tuân theo cùng chính sách chuyển một lần rồi dự phòng như giới hạn tốc độ (xem bảng giá trị mặc định ở trên).

Khi một lượt chạy bắt đầu từ mô hình chính mặc định đã cấu hình, mô hình chính của một tác vụ Cron, mô hình chính của tác nhân có các phương án dự phòng rõ ràng hoặc một giá trị ghi đè dự phòng được chọn tự động, OpenClaw có thể duyệt chuỗi dự phòng được cấu hình tương ứng. Các mô hình chính của tác nhân không có phương án dự phòng rõ ràng và các lựa chọn trực tiếp của người dùng (ví dụ: `/model ollama/qwen3.5:27b`, bộ chọn mô hình, `sessions.patch` hoặc giá trị ghi đè nhà cung cấp/mô hình dùng một lần của CLI) đều nghiêm ngặt: nếu không thể truy cập nhà cung cấp/mô hình đó hoặc nó gặp lỗi trước khi tạo ra phản hồi, OpenClaw báo cáo lỗi thay vì trả lời bằng một phương án dự phòng không liên quan.

### Quy tắc chuỗi ứng viên

OpenClaw xây dựng danh sách ứng viên từ `provider/model` đang được yêu cầu cùng các phương án dự phòng đã cấu hình.

<AccordionGroup>
  <Accordion title="Quy tắc">
    - Mô hình được yêu cầu luôn đứng đầu.
    - Các phương án dự phòng được cấu hình rõ ràng được loại bỏ mục trùng lặp nhưng không bị lọc theo danh sách mô hình cho phép. Chúng được coi là ý định rõ ràng của người vận hành.
    - Nếu lượt chạy hiện tại đã sử dụng một phương án dự phòng được cấu hình trong cùng họ nhà cung cấp, OpenClaw tiếp tục sử dụng toàn bộ chuỗi đã cấu hình.
    - Khi không cung cấp giá trị ghi đè dự phòng rõ ràng, các phương án dự phòng đã cấu hình được thử trước mô hình chính đã cấu hình, ngay cả khi mô hình được yêu cầu sử dụng một nhà cung cấp khác.
    - Khi không cung cấp giá trị ghi đè dự phòng rõ ràng cho trình chạy dự phòng, mô hình chính đã cấu hình được thêm vào cuối để chuỗi có thể quay lại giá trị mặc định thông thường sau khi các ứng viên trước đó đã cạn.
    - Khi bên gọi cung cấp `fallbacksOverride`, trình chạy chỉ sử dụng chính xác mô hình được yêu cầu cộng với danh sách ghi đè đó. Danh sách rỗng sẽ vô hiệu hóa dự phòng mô hình và ngăn mô hình chính đã cấu hình được thêm vào như một mục tiêu thử lại ẩn.

  </Accordion>
</AccordionGroup>

### Những lỗi nào chuyển sang dự phòng

<Tabs>
  <Tab title="Tiếp tục khi">
    - lỗi xác thực
    - giới hạn tốc độ và hết thời gian tạm ngưng
    - lỗi quá tải/nhà cung cấp đang bận
    - lỗi chuyển đổi dự phòng có dạng hết thời gian chờ
    - vô hiệu hóa do thanh toán
    - `LiveSessionModelSwitchError`, được chuẩn hóa thành đường chuyển đổi dự phòng để một mô hình cũ được lưu bền vững không tạo ra vòng lặp thử lại bên ngoài
    - các lỗi không được nhận diện khác khi vẫn còn ứng viên

  </Tab>
  <Tab title="Không tiếp tục khi">
    - thao tác hủy rõ ràng không có dạng hết thời gian chờ/chuyển đổi dự phòng
    - lỗi tràn ngữ cảnh phải được giữ trong logic Compaction/thử lại (ví dụ: `request_too_large`, `input token count exceeds the maximum number of input tokens`, `input exceeds the maximum number of tokens`, `input too long for the model` hoặc `ollama error: context length exceeded`)
    - lỗi cuối cùng không xác định khi không còn ứng viên
    - yêu cầu bị từ chối vì an toàn của Claude Fable 5; thay vào đó, các yêu cầu trực tiếp bằng khóa API xử lý trường hợp này ở cấp nhà cung cấp thông qua cơ chế dự phòng phía máy chủ của Anthropic sang `claude-opus-4-8` (xem [Anthropic](/vi/providers/anthropic#safety-refusal-fallback-claude-fable-5))

  </Tab>
</Tabs>

### Hành vi bỏ qua thời gian tạm ngưng so với thăm dò

Khi mọi hồ sơ xác thực của một nhà cung cấp đều đang trong thời gian tạm ngưng, OpenClaw không tự động bỏ qua nhà cung cấp đó mãi mãi. Hệ thống đưa ra quyết định theo từng ứng viên:

<AccordionGroup>
  <Accordion title="Quyết định theo từng ứng viên">
    - Lỗi xác thực dai dẳng khiến toàn bộ nhà cung cấp bị bỏ qua ngay lập tức.
    - Việc vô hiệu hóa do thanh toán thường khiến ứng viên bị bỏ qua, nhưng ứng viên chính vẫn có thể được thăm dò theo cơ chế điều tiết để có thể phục hồi mà không cần khởi động lại.
    - Ứng viên chính có thể được thăm dò khi gần hết thời gian tạm ngưng, với cơ chế điều tiết theo từng nhà cung cấp.
    - Có thể thử các mô hình dự phòng cùng cấp của cùng nhà cung cấp bất chấp thời gian tạm ngưng khi lỗi có vẻ tạm thời (`rate_limit`, `overloaded` hoặc không xác định). Điều này đặc biệt hữu ích khi giới hạn tốc độ chỉ áp dụng cho một mô hình và mô hình cùng cấp có thể phục hồi ngay lập tức.
    - Mỗi lượt chạy dự phòng chỉ cho phép một lần thăm dò thời gian tạm ngưng tạm thời cho mỗi nhà cung cấp, để một nhà cung cấp duy nhất không làm đình trệ quá trình dự phòng giữa các nhà cung cấp.

  </Accordion>
</AccordionGroup>

## Giá trị ghi đè phiên và chuyển đổi mô hình trực tiếp

Các thay đổi mô hình của phiên là trạng thái dùng chung. Trình chạy đang hoạt động, lệnh `/model`, các bản cập nhật Compaction/phiên và quá trình đối soát phiên trực tiếp đều đọc hoặc ghi các phần của cùng một mục phiên.

Điều đó có nghĩa là các lần thử lại dự phòng phải phối hợp với việc chuyển đổi mô hình trực tiếp:

- Chỉ các thay đổi mô hình rõ ràng do người dùng thực hiện mới đánh dấu một lượt chuyển đổi trực tiếp đang chờ xử lý. Các thay đổi này bao gồm `/model`, `session_status(model=...)` và `sessions.patch`.
- Các thay đổi mô hình do hệ thống thực hiện như chuyển đổi dự phòng, giá trị ghi đè Heartbeat hoặc Compaction không bao giờ tự đánh dấu một lượt chuyển đổi trực tiếp đang chờ xử lý.
- Các giá trị ghi đè mô hình do người dùng thực hiện được coi là lựa chọn chính xác cho chính sách dự phòng, vì vậy một nhà cung cấp được chọn nhưng không thể truy cập sẽ hiển thị dưới dạng lỗi thay vì bị che khuất bởi `agents.defaults.model.fallbacks`.
- Trước khi bắt đầu một lần thử lại dự phòng, trình chạy phản hồi lưu bền vững các trường ghi đè dự phòng đã chọn vào mục phiên.
- Các giá trị ghi đè dự phòng tự động tiếp tục được chọn trong các lượt tiếp theo để OpenClaw không thăm dò một mô hình chính đã biết là lỗi trong mọi tin nhắn. OpenClaw định kỳ thăm dò lại nguồn gốc đã cấu hình và xóa giá trị ghi đè tự động khi nguồn đó phục hồi; `/new`, `/reset` và `sessions.reset` xóa ngay các giá trị ghi đè có nguồn tự động.
- Phản hồi cho người dùng thông báo các lần chuyển sang dự phòng và phục hồi sau khi xóa dự phòng một lần cho mỗi thay đổi trạng thái. Các lượt tiếp tục dùng dự phòng cố định không lặp lại thông báo.
- `/status` hiển thị mô hình đã chọn và, khi trạng thái dự phòng khác biệt, mô hình dự phòng đang hoạt động cùng lý do.
- Quá trình đối soát phiên trực tiếp ưu tiên các giá trị ghi đè phiên đã lưu bền vững hơn các trường mô hình thời gian chạy đã cũ.
- Nếu lỗi chuyển đổi trực tiếp trỏ đến một ứng viên phía sau trong chuỗi dự phòng đang hoạt động, OpenClaw chuyển thẳng đến mô hình đã chọn đó thay vì duyệt các ứng viên không liên quan trước.
- Nếu lần thử dự phòng thất bại, trình chạy chỉ khôi phục các trường ghi đè mà nó đã ghi và chỉ khi chúng vẫn khớp với ứng viên thất bại đó.

Điều này ngăn chặn tình trạng tranh chấp kinh điển:

<Steps>
  <Step title="Mô hình chính gặp lỗi">
    Mô hình chính đã chọn gặp lỗi.
  </Step>
  <Step title="Phương án dự phòng được chọn trong bộ nhớ">
    Ứng viên dự phòng được chọn trong bộ nhớ.
  </Step>
  <Step title="Kho phiên vẫn ghi mô hình chính cũ">
    Kho phiên vẫn phản ánh mô hình chính cũ.
  </Step>
  <Step title="Quá trình đối soát trực tiếp đọc trạng thái cũ">
    Quá trình đối soát phiên trực tiếp đọc trạng thái phiên đã cũ.
  </Step>
  <Step title="Lần thử lại bị chuyển ngược">
    Lần thử lại bị chuyển ngược về mô hình cũ trước khi lần thử dự phòng bắt đầu.
  </Step>
</Steps>

Giá trị ghi đè dự phòng được lưu bền vững sẽ khép lại khoảng trống đó, còn cơ chế khôi phục có phạm vi hẹp sẽ giữ nguyên các thay đổi phiên thủ công hoặc thời gian chạy mới hơn.

## Khả năng quan sát và bản tóm tắt lỗi

`runWithModelFallback(...)` ghi lại chi tiết theo từng lần thử để cung cấp dữ liệu cho nhật ký và thông báo thời gian tạm ngưng hiển thị cho người dùng:

- nhà cung cấp/mô hình đã thử
- lý do (`rate_limit`, `overloaded`, `billing`, `auth`, `model_not_found` và các lý do chuyển đổi dự phòng tương tự)
- trạng thái/mã tùy chọn
- bản tóm tắt lỗi dễ hiểu

Nhật ký `model_fallback_decision` có cấu trúc cũng bao gồm các trường phẳng `fallbackStep*` khi một ứng viên thất bại, bị bỏ qua hoặc một phương án dự phòng sau đó thành công. Các trường này biểu thị rõ quá trình chuyển đổi đã thử (`fallbackStepFromModel`, `fallbackStepToModel`, `fallbackStepFromFailureReason`, `fallbackStepFromFailureDetail`, `fallbackStepFinalOutcome`) để các trình xuất nhật ký và chẩn đoán có thể tái dựng lỗi ban đầu ngay cả khi phương án dự phòng cuối cùng cũng thất bại.

Khi tất cả ứng viên đều thất bại, OpenClaw ném `FallbackSummaryError`. Trình chạy phản hồi bên ngoài có thể dùng lỗi này để tạo thông báo cụ thể hơn, chẳng hạn như "tất cả các mô hình hiện đang tạm thời bị giới hạn tốc độ", đồng thời cung cấp thời điểm hết hạn chờ sớm nhất nếu xác định được.

Bản tóm tắt thời gian chờ đó nhận biết mô hình:

- bỏ qua các giới hạn tốc độ theo phạm vi mô hình không liên quan đối với chuỗi nhà cung cấp/mô hình đã thử
- nếu hạn chế còn lại là giới hạn tốc độ theo phạm vi mô hình phù hợp, OpenClaw báo cáo thời điểm hết hạn phù hợp cuối cùng vẫn đang chặn mô hình đó

## Cấu hình liên quan

Xem [Cấu hình Gateway](/vi/gateway/configuration) để biết:

- `auth.profiles` / `auth.order`
- `auth.cooldowns.billingBackoffHours` / `auth.cooldowns.billingBackoffHoursByProvider`
- `auth.cooldowns.billingMaxHours` / `auth.cooldowns.failureWindowHours`
- `auth.cooldowns.authPermanentBackoffMinutes` / `auth.cooldowns.authPermanentMaxMinutes`
- `auth.cooldowns.overloadedProfileRotations` / `auth.cooldowns.overloadedBackoffMs`
- `auth.cooldowns.rateLimitedProfileRotations`
- `agents.defaults.model.primary` / `agents.defaults.model.fallbacks`
- định tuyến `agents.defaults.imageModel`

Xem [Mô hình](/vi/concepts/models) để biết tổng quan rộng hơn về việc lựa chọn mô hình và chuyển đổi dự phòng.
