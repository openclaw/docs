---
read_when:
    - Chẩn đoán hành vi luân phiên hồ sơ xác thực, thời gian chờ hoặc chuyển sang mô hình dự phòng
    - Cập nhật quy tắc chuyển đổi dự phòng cho hồ sơ xác thực hoặc mô hình
    - Tìm hiểu cách các tùy chọn ghi đè mô hình của phiên tương tác với các lần thử lại bằng mô hình dự phòng
sidebarTitle: Model failover
summary: Cách OpenClaw luân chuyển các hồ sơ xác thực và chuyển sang mô hình dự phòng
title: Chuyển đổi dự phòng mô hình
x-i18n:
    generated_at: "2026-07-20T04:21:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: e520ed160969b57bd50c2ed647ff7c0e60ec19ab983db226241b6301dafb503d
    source_path: concepts/model-failover.md
    workflow: 16
---

OpenClaw xử lý lỗi theo hai giai đoạn:

1. **Luân chuyển hồ sơ xác thực** trong nhà cung cấp hiện tại.
2. **Chuyển sang mô hình dự phòng** tiếp theo trong `agents.defaults.model.fallbacks`.

## Luồng thực thi

<Steps>
  <Step title="Phân giải trạng thái phiên">
    Phân giải mô hình của phiên đang hoạt động và tùy chọn ưu tiên hồ sơ xác thực.
  </Step>
  <Step title="Xây dựng chuỗi ứng viên">
    Xây dựng chuỗi ứng viên mô hình từ lựa chọn mô hình hiện tại và chính sách dự phòng dành cho nguồn lựa chọn đó. Các giá trị mặc định đã cấu hình, mô hình chính của tác vụ cron và mô hình dự phòng được tự động chọn có thể sử dụng các mô hình dự phòng đã cấu hình; lựa chọn phiên rõ ràng của người dùng được áp dụng nghiêm ngặt.
  </Step>
  <Step title="Thử nhà cung cấp hiện tại">
    Thử nhà cung cấp hiện tại theo các quy tắc luân chuyển/thời gian chờ của hồ sơ xác thực.
  </Step>
  <Step title="Chuyển tiếp khi gặp lỗi phù hợp để chuyển đổi dự phòng">
    Nếu nhà cung cấp đó đã hết lựa chọn và gặp lỗi phù hợp để chuyển đổi dự phòng, hãy chuyển sang ứng viên mô hình tiếp theo.
  </Step>
  <Step title="Sử dụng mô hình dự phòng cho lượt hiện tại">
    Chạy ứng viên dự phòng thành công mà không thay đổi nhà cung cấp/mô hình đã chọn của phiên.
  </Step>
  <Step title="Thử lại an toàn khi chỉ cạn kiệt do quá tải">
    Nếu mọi ứng viên đều chỉ thất bại vì các nhà cung cấp bị quá tải, hãy thử lại toàn bộ chuỗi cục bộ của lượt tối đa 10 lần với thời gian chờ tăng theo cấp số nhân, miễn là chưa bắt đầu thực thi công cụ hoặc xuất phản hồi của trợ lý. Sau 30 giây, gửi một thông báo trạng thái để người dùng không phải âm thầm chờ đợi.
  </Step>
  <Step title="Ném FallbackSummaryError nếu đã cạn kiệt">
    Nếu mọi ứng viên đều thất bại, hãy ném một `FallbackSummaryError` chứa chi tiết của từng lần thử và thời điểm kết thúc thời gian chờ sớm nhất nếu xác định được.
  </Step>
</Steps>

Việc thực thi dự phòng chỉ áp dụng cục bộ cho từng lượt. Trình chạy phản hồi chỉ lưu trạng thái thông báo dự phòng để `/status` và các thông báo chuyển tiếp có thể phân biệt mô hình đã chọn với mô hình đã trả lời; trình chạy không lưu mô hình dự phòng làm lựa chọn mô hình cho lượt tiếp theo.

## Chính sách nguồn lựa chọn

Nguồn lựa chọn kiểm soát việc có cho phép chuỗi dự phòng hay không:

- **Giá trị mặc định đã cấu hình**: `agents.defaults.model.primary` sử dụng `agents.defaults.model.fallbacks`.
- **Mô hình chính của tác nhân**: `agents.list[].model` được áp dụng nghiêm ngặt trừ khi đối tượng mô hình của tác nhân đó chứa `fallbacks` riêng. Sử dụng `fallbacks: []` để thể hiện rõ hành vi nghiêm ngặt, hoặc một danh sách không rỗng để cho phép tác nhân đó sử dụng mô hình dự phòng.
- **Mô hình dự phòng khi thực thi**: ứng viên dự phòng chỉ áp dụng cho lượt hiện tại. Lượt tiếp theo lại bắt đầu từ mô hình chính đã chọn. OpenClaw vẫn nhận diện các mục `modelOverrideSource: "auto"` đã lưu trước đó, thăm dò nguồn gốc đã cấu hình của chúng mỗi 5 phút và xóa chúng sau khi nguồn gốc khôi phục. `/new`, `/reset` và `sessions.reset` cũng xóa các mục đó.
- **Ghi đè phiên của người dùng**: `/model`, trình chọn mô hình, `session_status(model=...)` và `sessions.patch` ghi `modelOverrideSource: "user"`. Đây là lựa chọn chính xác cho phiên. Nếu nhà cung cấp/mô hình đã chọn thất bại trước khi tạo phản hồi, OpenClaw báo lỗi thay vì trả lời bằng một mô hình dự phòng đã cấu hình không liên quan.
- **Ghi đè phiên cũ**: các mục phiên cũ hơn có thể chứa `modelOverride` nhưng không có `modelOverrideSource`. OpenClaw coi chúng là ghi đè của người dùng để một lựa chọn cũ rõ ràng không bị âm thầm chuyển thành hành vi dự phòng.
- **Mô hình trong tải Cron**: `payload.model` / `--model` của một tác vụ cron là mô hình chính của tác vụ, không phải ghi đè phiên của người dùng. Nó sử dụng các mô hình dự phòng đã cấu hình trừ khi tác vụ cung cấp `payload.fallbacks`; `payload.fallbacks: []` khiến lần chạy cron được áp dụng nghiêm ngặt.

OpenClaw gửi một thông báo hiển thị khi một lượt chuyển sang mô hình dự phòng và một thông báo khác khi lượt sau thành công trên mô hình chính đã chọn. Trạng thái thông báo đã lưu ngăn thông báo lặp lại khi các lượt liên tiếp sử dụng cùng một cặp đã chọn/đang hoạt động, trong khi bản thân lựa chọn mô hình vẫn không thay đổi.

## Bộ nhớ đệm bỏ qua lỗi xác thực

Theo mặc định, mỗi lượt mới giữ nguyên hành vi thử lại dự phòng hiện có: OpenClaw thử lại từng ứng viên dự phòng đã cấu hình, bao gồm cả các ứng viên không phải mô hình chính vừa gặp lỗi `auth` hoặc `auth_permanent`.

Bật tính năng ngăn lặp lại lỗi xác thực bằng:

```bash
OPENCLAW_FALLBACK_SKIP_TTL_MS=60000
```

Khi được bật, sau một lỗi thuộc nhóm xác thực, OpenClaw ghi một dấu bỏ qua trong bộ nhớ, giới hạn theo phiên, cho ứng viên dự phòng không phải mô hình chính, với khóa gồm mã phiên, nhà cung cấp và mô hình. Các ứng viên chính không bao giờ bị bỏ qua, vì vậy lựa chọn mô hình rõ ràng của người dùng vẫn hiển thị lỗi xác thực thực tế. Bộ nhớ đệm chỉ tồn tại trong tiến trình và bị xóa khi Gateway khởi động lại.

Giá trị này là TTL tính bằng mili giây. `0` hoặc không thiết lập sẽ vô hiệu hóa bộ nhớ đệm. Các giá trị dương được giới hạn trong khoảng từ 1 giây đến 10 phút.

## Thông báo dự phòng hiển thị cho người dùng

Khi một phiên chuyển sang mô hình dự phòng được tự động chọn, OpenClaw gửi thông báo trạng thái trên cùng bề mặt phản hồi:

```text
↪️ Mô hình dự phòng: <fallback> (đã chọn <primary>; <reason>)
```

Khi lần thăm dò sau thành công và phiên quay lại mô hình chính đã chọn, OpenClaw gửi:

```text
↪️ Đã xóa mô hình dự phòng: <primary> (trước đó là <fallback>)
```

Các thông báo này là thông báo vận hành, không phải nội dung của trợ lý. Chúng được gửi một lần cho mỗi thay đổi trạng thái, bao gồm cả các lượt chỉ có hiệu ứng phụ khi khả thi, nhưng các lần chuyển sang dự phòng cục bộ theo lượt lặp lại sẽ không gửi chúng lần nữa. Việc gửi bỏ qua cơ chế ngăn phản hồi nguồn thông thường, không chiếm vị trí phản hồi đầu tiên của trợ lý đối với các kênh theo luồng và được loại khỏi tính năng chuyển văn bản thành giọng nói cũng như trích xuất cam kết.

## Lưu trữ xác thực (khóa + OAuth)

OpenClaw sử dụng **hồ sơ xác thực** cho cả khóa API và token OAuth.

- Bí mật và trạng thái định tuyến xác thực khi thực thi nằm trong `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`.
- Cấu hình `auth.profiles` / `auth.order` **chỉ chứa siêu dữ liệu + định tuyến** (không chứa bí mật).
- Tệp OAuth cũ chỉ dùng để nhập: `~/.openclaw/credentials/oauth.json` (được nhập vào kho xác thực theo tác nhân trong lần sử dụng đầu tiên).
- Các tệp `auth-profiles.json`, `auth-state.json` cũ và tệp `auth.json` theo tác nhân được `openclaw doctor --fix` nhập.

Chi tiết hơn: [OAuth](/vi/concepts/oauth)

Các loại thông tin xác thực:

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }` (+ `projectId`/`enterpriseUrl` đối với một số nhà cung cấp)
- `type: "token"` → token tĩnh kiểu bearer, có thể có thời hạn; OpenClaw không làm mới token này (được dùng cho `aws-sdk` và các chế độ xác thực theo chuỗi thông tin xác thực khác)

## Mã hồ sơ

Các lần đăng nhập OAuth tạo hồ sơ riêng biệt để nhiều tài khoản có thể cùng tồn tại.

- Mặc định: `provider:default` khi không có email.
- OAuth có email: `provider:<email>` (ví dụ `google-antigravity:user@gmail.com`).

Các hồ sơ nằm trong kho hồ sơ xác thực `openclaw-agent.sqlite` theo tác nhân.

## Thứ tự luân chuyển

Khi một nhà cung cấp có nhiều hồ sơ, OpenClaw chọn thứ tự như sau:

<Steps>
  <Step title="Cấu hình rõ ràng">
    `auth.order[provider]` (nếu được thiết lập).
  </Step>
  <Step title="Hồ sơ đã cấu hình">
    `auth.profiles` được lọc theo nhà cung cấp.
  </Step>
  <Step title="Hồ sơ đã lưu">
    Các mục hồ sơ xác thực SQLite theo tác nhân dành cho nhà cung cấp.
  </Step>
</Steps>

Nếu không cấu hình thứ tự rõ ràng, OpenClaw sử dụng thứ tự luân phiên:

- **Khóa chính:** loại hồ sơ (**OAuth, sau đó là token tĩnh, rồi đến khóa API**).
- **Khóa phụ cho OAuth:** hồ sơ có token truy cập hiện đang sử dụng được được xếp trước
  hồ sơ có token truy cập đã hết hạn. Hồ sơ OAuth đã hết hạn vẫn đủ điều kiện để
  môi trường thực thi có thể làm mới chúng khi không có hồ sơ ngang hàng nào sử dụng được.
- **Khóa tiếp theo:** `usageStats.lastUsed` (cũ nhất trước, trong từng tầng loại/trạng thái).
- **Hồ sơ đang trong thời gian chờ/bị vô hiệu hóa** được chuyển xuống cuối, sắp xếp theo thời điểm hết hạn sớm nhất.

### Gắn cố định theo phiên (thân thiện với bộ nhớ đệm)

OpenClaw **gắn cố định hồ sơ xác thực đã chọn cho từng phiên** để giữ ấm bộ nhớ đệm của nhà cung cấp. OpenClaw **không** luân chuyển sau mỗi yêu cầu. Hồ sơ đã gắn cố định được tái sử dụng cho đến khi:

- phiên được đặt lại (`/new` / `/reset`)
- một lần Compaction hoàn tất (số lần Compaction tăng)
- hồ sơ đang trong thời gian chờ/bị vô hiệu hóa

Việc chọn thủ công qua `/model …@<profileId>` đặt một **ghi đè của người dùng** cho phiên đó và không được tự động luân chuyển cho đến khi một phiên mới bắt đầu.

<Note>
Các hồ sơ được tự động gắn cố định (do bộ định tuyến phiên chọn) được coi là một **tùy chọn ưu tiên**: chúng được thử trước, nhưng OpenClaw có thể luân chuyển sang hồ sơ khác khi gặp giới hạn tốc độ/hết thời gian chờ. Khi hồ sơ ban đầu khả dụng trở lại, các lần chạy mới có thể tiếp tục ưu tiên hồ sơ đó mà không thay đổi mô hình hoặc môi trường thực thi đã chọn. Hồ sơ do người dùng gắn cố định vẫn bị khóa vào hồ sơ đó; nếu hồ sơ thất bại và đã cấu hình mô hình dự phòng, OpenClaw chuyển sang mô hình tiếp theo thay vì chuyển đổi hồ sơ.
</Note>

### Gói đăng ký OpenAI Codex cùng khóa API dự phòng

Đối với các mô hình tác nhân OpenAI, xác thực và môi trường thực thi là riêng biệt. `openai/gpt-*` vẫn chạy trên bộ khung Codex trong khi xác thực có thể luân chuyển giữa hồ sơ đăng ký Codex và khóa API OpenAI dự phòng.

Sử dụng `auth.order.openai` cho thứ tự hiển thị với người dùng:

```json5
{
  auth: {
    order: {
      openai: ["openai:user@example.com", "openai:api-key-backup"],
    },
  },
}
```

Sử dụng `openai:*` cho cả hồ sơ OAuth ChatGPT/Codex và hồ sơ khóa API OpenAI. Khi gói đăng ký đạt giới hạn sử dụng Codex, OpenClaw ghi lại chính xác thời điểm đặt lại nếu Codex cung cấp, thử hồ sơ xác thực tiếp theo theo thứ tự và giữ lần chạy bên trong bộ khung Codex. Sau khi thời điểm đặt lại trôi qua, hồ sơ đăng ký lại đủ điều kiện và lần chọn tự động tiếp theo có thể quay lại hồ sơ đó.

Chỉ sử dụng hồ sơ do người dùng gắn cố định khi muốn buộc phiên đó dùng một tài khoản/khóa. Hồ sơ do người dùng gắn cố định được áp dụng nghiêm ngặt theo chủ đích và không âm thầm chuyển sang hồ sơ khác.

## Thời gian chờ

Khi một hồ sơ thất bại do lỗi xác thực/giới hạn tốc độ (hoặc hết thời gian chờ có dấu hiệu giống giới hạn tốc độ), OpenClaw đánh dấu hồ sơ đó đang trong thời gian chờ và chuyển sang hồ sơ tiếp theo.

<AccordionGroup>
  <Accordion title="Những trường hợp được xếp vào nhóm giới hạn tốc độ / hết thời gian chờ">
    Nhóm giới hạn tốc độ này rộng hơn `429` thông thường: nó cũng bao gồm các thông báo của nhà cung cấp như `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded`, `throttled`, `resource exhausted` và các giới hạn cửa sổ sử dụng định kỳ như `weekly limit reached` hoặc `monthly limit exhausted`.

    Các lỗi định dạng/yêu cầu không hợp lệ thường là lỗi kết thúc vì việc thử lại cùng một tải sẽ thất bại theo cùng một cách, vì vậy OpenClaw hiển thị chúng thay vì luân chuyển hồ sơ xác thực. Các lộ trình sửa chữa bằng cách thử lại đã biết có thể được bật rõ ràng: ví dụ, lỗi xác thực mã lệnh gọi công cụ Cloud Code Assist được làm sạch và thử lại một lần thông qua chính sách `allowFormatRetry`. Các lỗi lý do dừng tương thích với OpenAI như `Unhandled stop reason: error`, `stop reason: error` và `reason: error` được phân loại là tín hiệu hết thời gian chờ/chuyển đổi dự phòng.

    Văn bản máy chủ chung cũng có thể được xếp vào nhóm hết thời gian chờ đó khi nguồn khớp với một mẫu tạm thời đã biết. Ví dụ, thông báo trình bao bọc luồng của môi trường thực thi mô hình độc lập `An unknown error occurred` được coi là phù hợp để chuyển đổi dự phòng đối với mọi nhà cung cấp vì môi trường thực thi mô hình dùng chung phát thông báo này khi luồng của nhà cung cấp kết thúc bằng `stopReason: "aborted"` hoặc `stopReason: "error"` mà không có chi tiết cụ thể. Các tải JSON `api_error` có văn bản máy chủ tạm thời như `internal server error`, `unknown error, 520`, `upstream error` hoặc `backend error` cũng được coi là lỗi hết thời gian chờ phù hợp để chuyển đổi dự phòng.

    Văn bản nguồn ngược chung dành riêng cho OpenRouter như `Provider returned error` độc lập chỉ được coi là lỗi hết thời gian chờ khi ngữ cảnh nhà cung cấp thực sự là OpenRouter. Văn bản dự phòng nội bộ chung như `LLM request failed with an unknown error.` vẫn được xử lý thận trọng và không tự kích hoạt chuyển đổi dự phòng.

  </Accordion>
  <Accordion title="Giới hạn retry-after của SDK">
    Nếu không, một số SDK của nhà cung cấp có thể tạm dừng trong một khoảng `Retry-After` dài trước khi trả quyền điều khiển về OpenClaw. Đối với các SDK dựa trên Stainless như Anthropic và OpenAI, theo mặc định OpenClaw giới hạn thời gian chờ `retry-after-ms` / `retry-after` nội bộ của SDK ở mức 60 giây và ngay lập tức đưa ra các phản hồi có thể thử lại với thời gian chờ dài hơn để đường dẫn chuyển đổi dự phòng này có thể chạy. Điều chỉnh hoặc tắt giới hạn bằng `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS`; xem [Hành vi thử lại](/vi/concepts/retry).
  </Accordion>
  <Accordion title="Thời gian tạm ngưng theo từng mô hình">
    Thời gian tạm ngưng do giới hạn tốc độ cũng có thể áp dụng theo từng mô hình:

    - OpenClaw ghi lại `cooldownModel` cho các lỗi giới hạn tốc độ khi biết id của mô hình gặp lỗi.
    - Vẫn có thể thử một mô hình cùng cấp trên cùng nhà cung cấp khi thời gian tạm ngưng áp dụng cho một mô hình khác.
    - Các khoảng vô hiệu hóa/do thanh toán vẫn chặn toàn bộ hồ sơ trên tất cả mô hình.

  </Accordion>
</AccordionGroup>

Thời gian tạm ngưng thông thường (không phải do thanh toán hay xác thực vĩnh viễn) tăng theo số lỗi gần đây của hồ sơ:

- Lỗi lần 1: 30 giây
- Lỗi lần 2: 1 phút
- Lỗi lần 3 trở đi: 5 phút (giới hạn tối đa)

Bộ đếm được đặt lại sau khi khoảng thời gian lỗi tích hợp của hồ sơ đã trôi qua.

Trạng thái được lưu trong trạng thái xác thực SQLite theo từng tác nhân tại `usageStats`:

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

Các lỗi thanh toán/tín dụng (ví dụ: "không đủ tín dụng" / "số dư tín dụng quá thấp") được xem là lý do để chuyển đổi dự phòng, nhưng thường không mang tính tạm thời. Thay vì áp dụng thời gian tạm ngưng ngắn, OpenClaw đánh dấu hồ sơ là **đã vô hiệu hóa** (với thời gian chờ lâu hơn) và chuyển sang hồ sơ/nhà cung cấp tiếp theo.

<Note>
Không phải mọi phản hồi có dạng lỗi thanh toán đều là `402`, và không phải mọi HTTP `402` đều được xử lý tại đây. OpenClaw vẫn giữ nội dung thanh toán rõ ràng trong luồng thanh toán ngay cả khi nhà cung cấp trả về `401` hoặc `403`, nhưng các bộ so khớp dành riêng cho nhà cung cấp vẫn chỉ áp dụng cho nhà cung cấp sở hữu chúng (ví dụ: OpenRouter `403 Key limit exceeded`).

Trong khi đó, các lỗi tạm thời về cửa sổ sử dụng `402` và giới hạn chi tiêu của tổ chức/không gian làm việc được phân loại là `rate_limit` khi thông báo cho thấy có thể thử lại (ví dụ: `weekly usage limit exhausted`, `daily limit reached, resets tomorrow` hoặc `organization spending limit exceeded`). Các lỗi này vẫn đi theo đường dẫn tạm ngưng ngắn/chuyển đổi dự phòng thay vì đường dẫn vô hiệu hóa dài hạn do thanh toán.
</Note>

Các lỗi xác thực vĩnh viễn có độ tin cậy cao (khóa bị thu hồi/vô hiệu hóa, không gian làm việc bị vô hiệu hóa) được đưa vào một luồng vô hiệu hóa tương tự, nhưng phục hồi sớm hơn nhiều so với lỗi thanh toán vì một số nhà cung cấp có thể tạm thời trả về tải trọng trông giống lỗi xác thực trong thời gian xảy ra sự cố.

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

Lỗi quá tải và giới hạn tốc độ được xử lý quyết liệt hơn thời gian tạm ngưng do thanh toán: theo mặc định, OpenClaw cho phép thử lại một hồ sơ xác thực khác của cùng nhà cung cấp, sau đó chuyển sang mô hình dự phòng được cấu hình tiếp theo mà không chờ đợi.

## Mô hình dự phòng

Nếu tất cả hồ sơ của một nhà cung cấp đều thất bại, OpenClaw chuyển sang mô hình tiếp theo trong `agents.defaults.model.fallbacks`. Điều này áp dụng cho lỗi xác thực, giới hạn tốc độ và thời gian chờ đã dùng hết vòng xoay hồ sơ (các lỗi khác không chuyển tiếp chuỗi dự phòng). Các lỗi của nhà cung cấp không cung cấp đủ chi tiết vẫn được gắn nhãn chính xác trong trạng thái dự phòng: `empty_response` nghĩa là nhà cung cấp không trả về thông báo hoặc trạng thái có thể sử dụng, `no_error_details` nghĩa là nhà cung cấp đã trả về `Unknown error (no error details in response)` một cách rõ ràng, và `unclassified` nghĩa là OpenClaw đã giữ lại bản xem trước thô nhưng chưa có bộ phân loại nào khớp với nó.

Các tín hiệu nhà cung cấp đang bận như `ModelNotReadyException` được đưa vào nhóm quá tải và tuân theo cùng chính sách xoay một lần rồi chuyển sang dự phòng như giới hạn tốc độ (xem bảng mặc định ở trên).

Nếu toàn bộ chuỗi ứng viên chỉ cạn kiệt do lỗi quá tải, trình chạy phản hồi sẽ thử lại chuỗi tối đa 10 lần trong cùng lượt. Chỉ được phép thử lại toàn bộ lượt trước khi bắt đầu thực thi công cụ hoặc xuất phản hồi của trợ lý, nhằm tránh thao tác hoặc thông báo trùng lặp nếu tình trạng quá tải xảy ra sau khi đã có công việc quan sát được. Thời gian chờ bắt đầu từ 2.5 giây và tăng gấp đôi đến giới hạn tối đa 30 giây. Sau khi lượt đã chờ 30 giây, OpenClaw gửi một thông báo trạng thái tạm thời duy nhất: `The AI service is temporarily overloaded. I’m still retrying; this may take a few minutes.` Lần thử lại và mô hình dự phòng thành công, nếu có, chỉ có hiệu lực trong lượt; các lỗi máy chủ tạm thời thông thường vẫn giữ chính sách thử lại một lần riêng biệt.

Khi một lượt chạy bắt đầu từ mô hình chính mặc định đã cấu hình, mô hình chính của tác vụ Cron, mô hình chính của tác nhân có mô hình dự phòng rõ ràng hoặc một ghi đè dự phòng được chọn tự động, OpenClaw có thể duyệt chuỗi dự phòng được cấu hình tương ứng. Các mô hình chính của tác nhân không có mô hình dự phòng rõ ràng và các lựa chọn rõ ràng của người dùng (ví dụ: `/model ollama/qwen3.5:27b`, trình chọn mô hình, `sessions.patch` hoặc ghi đè nhà cung cấp/mô hình dùng một lần qua CLI) đều được áp dụng nghiêm ngặt: nếu không thể truy cập nhà cung cấp/mô hình đó hoặc nó thất bại trước khi tạo phản hồi, OpenClaw báo lỗi thay vì trả lời bằng một mô hình dự phòng không liên quan.

### Quy tắc chuỗi ứng viên

OpenClaw tạo danh sách ứng viên từ `provider/model` đang được yêu cầu cùng các mô hình dự phòng đã cấu hình.

<AccordionGroup>
  <Accordion title="Quy tắc">
    - Mô hình được yêu cầu luôn đứng đầu.
    - Các mô hình dự phòng được cấu hình rõ ràng được loại bỏ trùng lặp nhưng không bị lọc theo danh sách mô hình được phép. Chúng được xem là ý định rõ ràng của người vận hành.
    - Nếu lượt chạy hiện tại đã sử dụng một mô hình dự phòng được cấu hình trong cùng họ nhà cung cấp, OpenClaw tiếp tục sử dụng toàn bộ chuỗi đã cấu hình.
    - Khi không cung cấp ghi đè dự phòng rõ ràng, các mô hình dự phòng đã cấu hình được thử trước mô hình chính đã cấu hình, ngay cả khi mô hình được yêu cầu sử dụng một nhà cung cấp khác.
    - Khi không cung cấp ghi đè dự phòng rõ ràng cho trình chạy dự phòng, mô hình chính đã cấu hình được thêm vào cuối để chuỗi có thể quay về mặc định thông thường sau khi các ứng viên trước đó đã cạn kiệt.
    - Khi bên gọi cung cấp `fallbacksOverride`, trình chạy chỉ sử dụng chính xác mô hình được yêu cầu cùng danh sách ghi đè đó. Danh sách trống sẽ tắt mô hình dự phòng và ngăn mô hình chính đã cấu hình được thêm vào như một mục tiêu thử lại ẩn.

  </Accordion>
</AccordionGroup>

### Những lỗi nào chuyển sang mô hình dự phòng

<Tabs>
  <Tab title="Tiếp tục khi">
    - lỗi xác thực
    - giới hạn tốc độ và hết thời gian tạm ngưng
    - lỗi quá tải/nhà cung cấp đang bận
    - lỗi chuyển đổi dự phòng có dạng hết thời gian chờ
    - vô hiệu hóa do thanh toán
    - `LiveSessionModelSwitchError`, được chuẩn hóa thành đường dẫn chuyển đổi dự phòng để một mô hình đã lưu nhưng lỗi thời không tạo ra vòng lặp thử lại bên ngoài
    - các lỗi không nhận diện được khác khi vẫn còn ứng viên

  </Tab>
  <Tab title="Không tiếp tục khi">
    - các thao tác hủy rõ ràng không có dạng hết thời gian chờ/chuyển đổi dự phòng
    - các lỗi tràn ngữ cảnh cần được giữ trong logic Compaction/thử lại (ví dụ: `request_too_large`, `input token count exceeds the maximum number of input tokens`, `input exceeds the maximum number of tokens`, `input too long for the model` hoặc `ollama error: context length exceeded`)
    - lỗi không xác định cuối cùng khi không còn ứng viên
    - các trường hợp Claude Fable 5 từ chối vì lý do an toàn; thay vào đó, các yêu cầu trực tiếp bằng khóa API xử lý chúng ở cấp nhà cung cấp thông qua cơ chế dự phòng phía máy chủ của Anthropic sang `claude-opus-4-8` (xem [Anthropic](/vi/providers/anthropic#safety-refusal-fallback-claude-fable-5))

  </Tab>
</Tabs>

### Hành vi bỏ qua thời gian tạm ngưng và thăm dò

Khi mọi hồ sơ xác thực của một nhà cung cấp đều đang trong thời gian tạm ngưng, OpenClaw không tự động bỏ qua nhà cung cấp đó vĩnh viễn. Hệ thống đưa ra quyết định theo từng ứng viên:

<AccordionGroup>
  <Accordion title="Quyết định theo từng ứng viên">
    - Lỗi xác thực vĩnh viễn sẽ bỏ qua toàn bộ nhà cung cấp ngay lập tức.
    - Trạng thái vô hiệu hóa do thanh toán thường bị bỏ qua, nhưng ứng viên chính vẫn có thể được thăm dò theo nhịp giới hạn để có thể phục hồi mà không cần khởi động lại.
    - Ứng viên chính có thể được thăm dò khi gần hết thời gian tạm ngưng, với nhịp giới hạn riêng cho từng nhà cung cấp.
    - Có thể thử các mô hình dự phòng cùng cấp thuộc cùng nhà cung cấp bất chấp thời gian tạm ngưng khi lỗi có vẻ tạm thời (`rate_limit`, `overloaded` hoặc không xác định). Điều này đặc biệt phù hợp khi giới hạn tốc độ áp dụng theo từng mô hình và một mô hình cùng cấp vẫn có thể phục hồi ngay lập tức.
    - Các lần thăm dò thời gian tạm ngưng tạm thời được giới hạn ở một lần cho mỗi nhà cung cấp trong mỗi lượt chạy dự phòng để một nhà cung cấp duy nhất không làm đình trệ quá trình chuyển đổi dự phòng giữa các nhà cung cấp.

  </Accordion>
</AccordionGroup>

## Ghi đè phiên và chuyển đổi mô hình trực tiếp

Các thay đổi mô hình của phiên là trạng thái dùng chung. Trình chạy đang hoạt động, lệnh `/model`, các bản cập nhật Compaction/phiên và quá trình đối soát phiên trực tiếp đều đọc hoặc ghi các phần của cùng một mục phiên. Việc thực thi dự phòng không ghi các trường lựa chọn mô hình, vì vậy không thể thay thế một lựa chọn thủ công mới hơn trong khi thử lại.

Việc chuyển đổi mô hình trực tiếp tuân theo các quy tắc sau:

- Chỉ những thay đổi mô hình rõ ràng do người dùng thực hiện mới đánh dấu một chuyển đổi trực tiếp đang chờ xử lý. Điều này bao gồm `/model`, `session_status(model=...)` và `sessions.patch`.
- Các thay đổi mô hình do hệ thống thực hiện như xoay vòng dự phòng, ghi đè Heartbeat hoặc Compaction không bao giờ tự đánh dấu một chuyển đổi trực tiếp đang chờ xử lý.
- Các ghi đè mô hình do người dùng thực hiện được xem là lựa chọn chính xác cho chính sách dự phòng, vì vậy một nhà cung cấp đã chọn nhưng không thể truy cập sẽ được hiển thị dưới dạng lỗi thay vì bị che khuất bởi `agents.defaults.model.fallbacks`.
- Các ứng viên dự phòng trong thời gian chạy chỉ có hiệu lực trong lượt. Lượt tiếp theo bắt đầu từ mô hình hiện được chọn, bao gồm lựa chọn thủ công được thực hiện trong lượt chạy trước.
- Các ghi đè dự phòng tự động đã lưu trước đó vẫn được hỗ trợ: OpenClaw định kỳ thăm dò nguồn gốc đã cấu hình của chúng và xóa ghi đè khi nguồn gốc phục hồi; `/new`, `/reset` và `sessions.reset` xóa ngay các ghi đè có nguồn tự động.
- Phản hồi cho người dùng thông báo quá trình chuyển sang dự phòng và phục hồi sau khi xóa dự phòng một lần cho mỗi thay đổi trạng thái. Các lượt lặp lại có cùng cặp mô hình được chọn/đang hoạt động sẽ không lặp lại thông báo.
- `/status` hiển thị mô hình được chọn và, khi trạng thái dự phòng khác biệt, mô hình dự phòng đang hoạt động cùng lý do.
- Quá trình đối soát phiên trực tiếp ưu tiên các ghi đè phiên đã lưu hơn các trường mô hình lỗi thời trong thời gian chạy.
- Nếu lỗi chuyển đổi trực tiếp trỏ đến một ứng viên phía sau trong chuỗi dự phòng đang hoạt động, OpenClaw chuyển thẳng đến mô hình đã chọn đó thay vì duyệt các ứng viên không liên quan trước.

Lượt chạy đang hoạt động mang trực tiếp ứng viên đã chọn. Quá trình đối soát trực tiếp chỉ thay đổi ứng viên đó khi có một chuyển đổi rõ ràng do người dùng yêu cầu đang chờ xử lý, vì vậy không cần ghi đè dự phòng tạm thời hoặc hoàn tác.

## Khả năng quan sát và tóm tắt lỗi

`runWithModelFallback(...)` ghi lại chi tiết theo từng lần thử để cung cấp dữ liệu cho nhật ký và thông báo thời gian tạm ngưng hướng đến người dùng:

- nhà cung cấp/mô hình đã thử
- lý do (`rate_limit`, `overloaded`, `billing`, `auth`, `model_not_found` và các lý do chuyển đổi dự phòng tương tự)
- trạng thái/mã tùy chọn
- tóm tắt lỗi dễ đọc

Nhật ký `model_fallback_decision` có cấu trúc cũng bao gồm các trường `fallbackStep*` phẳng khi một ứng viên thất bại, bị bỏ qua hoặc một mô hình dự phòng phía sau thành công. Các trường này thể hiện rõ quá trình chuyển đổi đã thử (`fallbackStepFromModel`, `fallbackStepToModel`, `fallbackStepFromFailureReason`, `fallbackStepFromFailureDetail`, `fallbackStepFinalOutcome`) để trình xuất nhật ký và chẩn đoán có thể tái dựng lỗi chính ngay cả khi mô hình dự phòng cuối cùng cũng thất bại.

Khi mọi ứng viên đều thất bại, OpenClaw ném `FallbackSummaryError`. Trình chạy phản hồi bên ngoài có thể sử dụng thông tin đó để tạo một thông báo cụ thể hơn, chẳng hạn như "tất cả mô hình đang tạm thời bị giới hạn tốc độ", đồng thời bao gồm thời điểm kết thúc thời gian tạm ngưng sớm nhất nếu biết.

Bản tóm tắt thời gian tạm ngưng đó nhận biết từng mô hình:

- các giới hạn tốc độ theo phạm vi mô hình không liên quan sẽ bị bỏ qua đối với chuỗi nhà cung cấp/mô hình đang được thử
- nếu khối chặn còn lại là giới hạn tốc độ theo phạm vi mô hình phù hợp, OpenClaw sẽ báo cáo thời điểm hết hạn phù hợp cuối cùng vẫn đang chặn mô hình đó

## Cấu hình liên quan

Xem [Cấu hình Gateway](/vi/gateway/configuration) để biết:

- `auth.profiles` / `auth.order`
- `agents.defaults.model.primary` / `agents.defaults.model.fallbacks`
- định tuyến `agents.defaults.imageModel`

Xem [Mô hình](/vi/concepts/models) để biết tổng quan rộng hơn về việc lựa chọn mô hình và cơ chế dự phòng.
