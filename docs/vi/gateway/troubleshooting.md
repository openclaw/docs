---
read_when:
    - Trung tâm khắc phục sự cố đã hướng bạn đến đây để chẩn đoán chuyên sâu hơn
    - Bạn cần các phần runbook ổn định dựa trên triệu chứng, kèm theo các lệnh chính xác
sidebarTitle: Troubleshooting
summary: Cẩm nang khắc phục sự cố chuyên sâu cho Gateway, các kênh, tự động hóa, các Node và trình duyệt
title: Khắc phục sự cố
x-i18n:
    generated_at: "2026-07-16T15:18:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f53064a0d42e601ec1a1904fc9d0e8ebb9def7a2fb9d2579c7f10ca675b8f7fd
    source_path: gateway/troubleshooting.md
    workflow: 16
---

Đây là runbook chuyên sâu. Trước tiên, hãy bắt đầu tại [/help/troubleshooting](/vi/help/troubleshooting) để thực hiện quy trình phân loại nhanh.

## Thứ tự lệnh

Chạy theo thứ tự sau:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Các dấu hiệu bình thường:

- `openclaw gateway status` hiển thị `Runtime: running`, `Connectivity probe: ok` và một dòng `Capability: ...`.
- `openclaw doctor` báo cáo không có vấn đề cấu hình/dịch vụ nào gây cản trở.
- `openclaw channels status --probe` hiển thị trạng thái truyền tải trực tiếp theo từng tài khoản và, khi được hỗ trợ, `works` hoặc `audit ok`.

## Sau khi cập nhật

Sử dụng khi quá trình cập nhật đã hoàn tất nhưng Gateway không hoạt động, danh sách kênh trống hoặc các lệnh gọi mô hình thất bại với mã 401.

```bash
openclaw status --all
openclaw update status --json
openclaw gateway status --deep
openclaw doctor --fix
openclaw gateway restart
```

Hãy tìm:

- `Update restart` trong `openclaw status` / `openclaw status --all`. Các lần bàn giao đang chờ xử lý hoặc thất bại có kèm lệnh tiếp theo cần chạy.
- `plugin load failed: dependency tree corrupted; run openclaw doctor --fix` trong Channels: cấu hình kênh vẫn tồn tại, nhưng việc đăng ký plugin đã thất bại trước khi kênh có thể tải.
- Lỗi 401 từ nhà cung cấp sau khi xác thực lại: `openclaw doctor --fix` kiểm tra các bản sao phủ xác thực OAuth cũ theo từng tác nhân và xóa chúng để tất cả tác nhân phân giải về hồ sơ dùng chung hiện tại.

## Các bản cài đặt không đồng nhất và cơ chế bảo vệ cấu hình mới hơn

Sử dụng khi dịch vụ Gateway dừng ngoài dự kiến sau một bản cập nhật hoặc nhật ký cho thấy một tệp nhị phân `openclaw` cũ hơn phiên bản đã ghi `openclaw.json` gần nhất.

OpenClaw đóng dấu các lần ghi cấu hình bằng `meta.lastTouchedVersion`. Các lệnh chỉ đọc có thể kiểm tra cấu hình do phiên bản OpenClaw mới hơn ghi, nhưng các thao tác làm thay đổi tiến trình và dịch vụ sẽ từ chối chạy từ tệp nhị phân cũ hơn. Các thao tác bị chặn gồm: khởi động/dừng/khởi động lại/gỡ cài đặt dịch vụ Gateway, buộc cài đặt lại dịch vụ, khởi động Gateway ở chế độ dịch vụ và dọn dẹp cổng `gateway --force`.

```bash
which openclaw
openclaw --version
openclaw gateway status --deep
openclaw config get meta.lastTouchedVersion
```

<Steps>
  <Step title="Sửa PATH">
    Sửa `PATH` để `openclaw` phân giải đến bản cài đặt mới hơn, sau đó chạy lại thao tác.
  </Step>
  <Step title="Cài đặt lại dịch vụ Gateway">
    Cài đặt lại dịch vụ Gateway dự kiến từ bản cài đặt mới hơn:

    ```bash
    openclaw gateway install --force
    openclaw gateway restart
    ```

  </Step>
  <Step title="Xóa các trình bao bọc cũ">
    Xóa các mục gói hệ thống cũ hoặc trình bao bọc cũ vẫn trỏ đến tệp nhị phân `openclaw` cũ.
  </Step>
</Steps>

<Warning>
Chỉ khi cố ý hạ cấp hoặc khôi phục khẩn cấp, hãy đặt `OPENCLAW_ALLOW_OLDER_BINARY_DESTRUCTIVE_ACTIONS=1` cho riêng lệnh đó. Không đặt biến này trong quá trình vận hành bình thường.
</Warning>

## Giao thức không khớp sau khi hoàn tác

Sử dụng khi nhật ký liên tục in `protocol mismatch` sau khi hạ cấp hoặc hoàn tác. Một Gateway cũ đang chạy, nhưng một tiến trình máy khách cục bộ mới hơn vẫn đang kết nối lại bằng một dải giao thức mà Gateway cũ không thể sử dụng.

```bash
openclaw --version
which -a openclaw
openclaw gateway status --deep
openclaw doctor --deep
openclaw logs --follow
```

Hãy tìm:

- `protocol mismatch ... client=... v<version> min=<n> max=<n> expected=<n>` trong nhật ký Gateway.
- `Established clients:` trong `openclaw gateway status --deep` hoặc `Gateway clients` trong `openclaw doctor --deep`: các máy khách TCP đang hoạt động và kết nối với cổng Gateway, kèm theo PID và dòng lệnh khi hệ điều hành cho phép.
- Một tiến trình máy khách có dòng lệnh trỏ đến bản cài đặt hoặc trình bao bọc OpenClaw mới hơn mà bạn đã hoàn tác.

Cách khắc phục:

1. Dừng hoặc khởi động lại tiến trình máy khách OpenClaw cũ được `gateway status --deep` hiển thị.
2. Khởi động lại các ứng dụng hoặc trình bao bọc nhúng OpenClaw: bảng điều khiển cục bộ, trình chỉnh sửa, trình trợ giúp máy chủ ứng dụng hoặc các shell `openclaw logs --follow` chạy lâu.
3. Chạy lại `openclaw gateway status --deep` hoặc `openclaw doctor --deep` và xác nhận PID của máy khách cũ đã biến mất.

Không làm cho Gateway cũ chấp nhận giao thức mới hơn không tương thích. Việc nâng phiên bản giao thức bảo vệ hợp đồng truyền dẫn; khôi phục sau hoàn tác là vấn đề dọn dẹp tiến trình/phiên bản.

## Bỏ qua liên kết tượng trưng của Skill vì thoát khỏi đường dẫn

Sử dụng khi nhật ký có nội dung:

```text
Bỏ qua đường dẫn skill đã thoát ra ngoài thư mục gốc được cấu hình: ... reason=symlink-escape
```

Mỗi thư mục gốc của skill là một ranh giới chứa. Một liên kết tượng trưng trong `~/.agents/skills`, `<workspace>/.agents/skills`, `<workspace>/skills` hoặc `~/.openclaw/skills` sẽ bị bỏ qua khi đích thực của nó phân giải ra ngoài thư mục gốc đó, trừ khi đích được tin cậy rõ ràng.

Kiểm tra liên kết:

```bash
ls -l ~/.agents/skills/<name>
realpath ~/.agents/skills/<name>
openclaw config get skills.load
```

Nếu đích là có chủ ý, hãy cấu hình cả thư mục gốc trực tiếp của skill và đích liên kết tượng trưng được phép:

```json5
{
  skills: {
    load: {
      extraDirs: ["~/Projects/manager/skills"],
      allowSymlinkTargets: ["~/Projects/manager/skills"],
    },
  },
}
```

Sau đó bắt đầu một phiên mới hoặc chờ trình theo dõi skill làm mới. Khởi động lại Gateway nếu tiến trình đang chạy có từ trước thay đổi cấu hình.

Không sử dụng các đích quá rộng như `~`, `/` hoặc toàn bộ thư mục dự án được đồng bộ. Giới hạn phạm vi `allowSymlinkTargets` ở thư mục gốc thực của skill có chứa các thư mục `SKILL.md` đáng tin cậy.

Nếu thao tác áp dụng của Skill Workshop cũng cần ghi qua các đường dẫn skill trong không gian làm việc được liên kết tượng trưng và tin cậy đó, hãy bật `skills.workshop.allowSymlinkTargetWrites`. Giữ tùy chọn này ở trạng thái tắt đối với các thư mục gốc skill dùng chung chỉ đọc.

Liên quan:

- [Cấu hình Skills](/vi/tools/skills-config#symlinked-skill-roots)
- [Ví dụ cấu hình](/vi/gateway/configuration-examples#symlinked-sibling-skill-repo)

## Anthropic 429 yêu cầu quyền sử dụng bổ sung cho ngữ cảnh dài

Sử dụng khi nhật ký/lỗi có chứa: `HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

Hãy tìm:

- Mô hình Anthropic được chọn là mô hình Claude 4.x 1M có khả năng GA (Opus 4.6/4.7/4.8, Sonnet 4.6), hoặc cấu hình mô hình vẫn mang `params.context1m: true` cũ.
- Thông tin xác thực Anthropic hiện tại không đủ điều kiện sử dụng ngữ cảnh dài.
- Yêu cầu chỉ thất bại trong các phiên dài/lần chạy mô hình cần đường dẫn ngữ cảnh 1M.

Các phương án khắc phục:

<Steps>
  <Step title="Sử dụng cửa sổ ngữ cảnh tiêu chuẩn">
    Chuyển sang mô hình có cửa sổ tiêu chuẩn hoặc xóa `context1m` cũ khỏi cấu hình
    mô hình cũ không có khả năng GA cho ngữ cảnh 1M.
  </Step>
  <Step title="Sử dụng thông tin xác thực đủ điều kiện">
    Sử dụng thông tin xác thực Anthropic đủ điều kiện cho các yêu cầu ngữ cảnh dài hoặc chuyển sang khóa API Anthropic.
  </Step>
  <Step title="Cấu hình mô hình dự phòng">
    Cấu hình các mô hình dự phòng để lần chạy tiếp tục khi yêu cầu ngữ cảnh dài của Anthropic bị từ chối.
  </Step>
</Steps>

Liên quan:

- [Anthropic](/vi/providers/anthropic)
- [Mức sử dụng token và chi phí](/vi/reference/token-use)
- [Tại sao tôi thấy HTTP 429 từ Anthropic?](/vi/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## Phản hồi 403 bị chặn từ thượng nguồn

Sử dụng khi nhà cung cấp LLM thượng nguồn trả về một `403` chung chung, chẳng hạn như `Your request was blocked`.

Không giả định rằng đây luôn là vấn đề cấu hình OpenClaw. Phản hồi có thể đến từ một lớp bảo mật thượng nguồn như CDN, WAF, quy tắc quản lý bot hoặc proxy ngược đứng trước điểm cuối tương thích với OpenAI.

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
```

Hãy tìm:

- Nhiều mô hình thuộc cùng một nhà cung cấp thất bại theo cùng một cách.
- Nội dung HTML hoặc văn bản bảo mật chung chung thay vì lỗi API thông thường của nhà cung cấp.
- Các sự kiện bảo mật phía nhà cung cấp tại cùng thời điểm yêu cầu.
- Một phép thăm dò `curl` trực tiếp, rất nhỏ thành công trong khi các yêu cầu có cấu trúc kiểu SDK thông thường thất bại.

Trước tiên, hãy khắc phục bộ lọc phía nhà cung cấp khi bằng chứng chỉ ra việc WAF/CDN chặn. Ưu tiên quy tắc cho phép hoặc bỏ qua có phạm vi hẹp cho đường dẫn API mà OpenClaw sử dụng và tránh tắt biện pháp bảo vệ cho toàn bộ trang web.

<Warning>
Một `curl` tối thiểu thành công không đảm bảo rằng các yêu cầu kiểu SDK thực tế sẽ vượt qua cùng một lớp bảo mật thượng nguồn.
</Warning>

Liên quan:

- [Các điểm cuối tương thích với OpenAI](/vi/gateway/configuration-reference#openai-compatible-endpoints)
- [Cấu hình nhà cung cấp](/vi/providers)
- [Nhật ký](/vi/logging)

## Backend cục bộ tương thích với OpenAI vượt qua phép thăm dò trực tiếp nhưng lần chạy tác nhân thất bại

Sử dụng khi:

- `curl ... /v1/models` hoạt động.
- Các lệnh gọi trực tiếp `/v1/chat/completions` nhỏ hoạt động.
- Các lần chạy mô hình OpenClaw chỉ thất bại trong lượt tác nhân thông thường.

```bash
curl http://127.0.0.1:1234/v1/models
curl http://127.0.0.1:1234/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"<id>","messages":[{"role":"user","content":"xin chào"}],"stream":false}'
openclaw infer model run --model <provider/model> --prompt "xin chào" --json
openclaw logs --follow
```

Hãy tìm:

- Các lệnh gọi trực tiếp nhỏ thành công, nhưng lần chạy OpenClaw chỉ thất bại với lời nhắc lớn hơn.
- Lỗi `model_not_found` hoặc 404 mặc dù `/v1/chat/completions` trực tiếp hoạt động với cùng mã định danh mô hình thuần.
- Lỗi backend cho biết `messages[].content` yêu cầu một chuỗi.
- Cảnh báo `incomplete turn detected ... stopReason=stop payloads=0` không liên tục với backend cục bộ tương thích với OpenAI.
- Backend gặp sự cố chỉ xuất hiện với số lượng token lời nhắc lớn hơn hoặc lời nhắc đầy đủ của môi trường chạy tác nhân.

<AccordionGroup>
  <Accordion title="Các dấu hiệu thường gặp">
    - `model_not_found` với máy chủ cục bộ kiểu MLX/vLLM: xác minh `baseUrl` có chứa `/v1`, `api` là `"openai-completions"` đối với backend `/v1/chat/completions` và `models.providers.<provider>.models[].id` là mã định danh cục bộ thuần của nhà cung cấp. Chọn nó một lần với tiền tố nhà cung cấp, ví dụ `mlx/mlx-community/Qwen3-30B-A3B-6bit`; giữ mục danh mục là `mlx-community/Qwen3-30B-A3B-6bit`.
    - `messages[...].content: invalid type: sequence, expected a string`: backend từ chối các phần nội dung Chat Completions có cấu trúc. Cách khắc phục: đặt `models.providers.<provider>.models[].compat.requiresStringContent: true`.
    - `validation.keys` hoặc các khóa tin nhắn được phép như `["role","content"]`: backend từ chối siêu dữ liệu phát lại kiểu OpenAI trên các tin nhắn Chat Completions. Cách khắc phục: đặt `models.providers.<provider>.models[].compat.strictMessageKeys: true`.
    - `incomplete turn detected ... stopReason=stop payloads=0`: backend đã hoàn tất yêu cầu Chat Completions nhưng không trả về văn bản trợ lý hiển thị cho người dùng trong lượt đó. OpenClaw thử lại một lần đối với lượt tương thích với OpenAI trống nhưng an toàn khi phát lại; lỗi kéo dài thường có nghĩa là backend đang phát nội dung trống/không phải văn bản hoặc chặn văn bản câu trả lời cuối cùng.
    - Các yêu cầu trực tiếp nhỏ thành công, nhưng lần chạy tác nhân OpenClaw thất bại do backend/mô hình gặp sự cố (ví dụ Gemma trên một số bản dựng `inferrs`): cơ chế truyền tải của OpenClaw có thể đã chính xác; backend đang thất bại với cấu trúc lời nhắc lớn hơn của môi trường chạy tác nhân.
    - Số lỗi giảm sau khi tắt công cụ nhưng không biến mất: các lược đồ công cụ là một phần nguyên nhân gây áp lực, nhưng vấn đề còn lại vẫn là dung lượng mô hình/máy chủ thượng nguồn hoặc lỗi backend.

  </Accordion>
  <Accordion title="Các phương án khắc phục">
    1. Đặt `compat.requiresStringContent: true` cho các backend Chat Completions chỉ chấp nhận chuỗi.
    2. Đặt `compat.strictMessageKeys: true` cho các backend Chat Completions nghiêm ngặt chỉ chấp nhận `role` và `content` trên mỗi tin nhắn.
    3. Đặt `compat.supportsTools: false` cho các mô hình/backend không thể xử lý ổn định bề mặt lược đồ công cụ của OpenClaw.
    4. Giảm áp lực lời nhắc khi có thể: phần khởi tạo không gian làm việc nhỏ hơn, lịch sử phiên ngắn hơn, mô hình cục bộ nhẹ hơn hoặc backend hỗ trợ ngữ cảnh dài tốt hơn.
    5. Nếu các yêu cầu trực tiếp nhỏ vẫn thành công trong khi lượt tác nhân OpenClaw tiếp tục làm backend gặp sự cố, hãy coi đây là giới hạn của máy chủ/mô hình thượng nguồn và gửi bản tái hiện tại đó kèm cấu trúc tải trọng được chấp nhận.
  </Accordion>
</AccordionGroup>

Liên quan:

- [Cấu hình](/vi/gateway/configuration)
- [Mô hình cục bộ](/vi/gateway/local-models)
- [Điểm cuối tương thích với OpenAI](/vi/gateway/configuration-reference#openai-compatible-endpoints)

## Không có phản hồi

Nếu các kênh đang hoạt động nhưng không có gì phản hồi, hãy kiểm tra định tuyến và chính sách trước khi kết nối lại bất kỳ thứ gì.

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

Kiểm tra:

- Yêu cầu ghép nối đang chờ xử lý đối với người gửi tin nhắn trực tiếp.
- Cơ chế yêu cầu đề cập trong nhóm (`requireMention`, `mentionPatterns`).
- Danh sách cho phép của kênh/nhóm không khớp.

Các dấu hiệu thường gặp:

- `drop guild message (mention required` → tin nhắn nhóm bị bỏ qua cho đến khi có đề cập.
- `pairing request` → người gửi cần được phê duyệt.
- `blocked` / `allowlist` → người gửi/kênh đã bị chính sách lọc.

Liên quan:

- [Khắc phục sự cố kênh](/vi/channels/troubleshooting)
- [Nhóm](/vi/channels/groups)
- [Ghép nối](/vi/channels/pairing)

## Khả năng kết nối của giao diện điều khiển bảng điều khiển

Khi bảng điều khiển/giao diện điều khiển không kết nối được, hãy xác thực URL, chế độ xác thực và các giả định về ngữ cảnh bảo mật.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

Kiểm tra:

- URL thăm dò và URL bảng điều khiển chính xác.
- Chế độ xác thực/token giữa máy khách và gateway không khớp.
- Sử dụng HTTP khi danh tính thiết bị là bắt buộc.

Nếu trình duyệt cục bộ không thể kết nối với `127.0.0.1:18789` sau khi cập nhật, trước tiên hãy khôi phục dịch vụ Gateway cục bộ và xác nhận rằng dịch vụ đang cung cấp bảng điều khiển:

```bash
openclaw gateway restart
lsof -i :18789
curl http://127.0.0.1:18789
```

Nếu `curl` trả về HTML của OpenClaw, Gateway đang hoạt động và vấn đề còn lại có thể là bộ nhớ đệm của trình duyệt, liên kết sâu cũ hoặc trạng thái thẻ đã lỗi thời. Hãy mở trực tiếp `http://127.0.0.1:18789` và điều hướng từ bảng điều khiển. Nếu việc khởi động lại không duy trì dịch vụ hoạt động, hãy chạy `openclaw gateway start` và kiểm tra lại `openclaw gateway status`.

<AccordionGroup>
  <Accordion title="Dấu hiệu kết nối / xác thực">
    - `device identity required` → ngữ cảnh không bảo mật hoặc thiếu xác thực thiết bị.
    - `origin not allowed` → `Origin` của trình duyệt không nằm trong `gateway.controlUi.allowedOrigins` (hoặc bạn đang kết nối từ một nguồn gốc trình duyệt không phải loopback mà không có danh sách cho phép rõ ràng).
    - `device nonce required` / `device nonce mismatch` → máy khách không hoàn tất luồng xác thực thiết bị dựa trên thử thách (`connect.challenge` + `device.nonce`).
    - `device signature invalid` / `device signature expired` → máy khách đã ký sai tải trọng (hoặc dùng dấu thời gian đã lỗi thời) cho quá trình bắt tay hiện tại.
    - `AUTH_TOKEN_MISMATCH` với `canRetryWithDeviceToken=true` → máy khách có thể thực hiện một lần thử lại đáng tin cậy bằng token thiết bị được lưu trong bộ nhớ đệm.
    - Lần thử lại bằng token được lưu trong bộ nhớ đệm đó tái sử dụng tập phạm vi được lưu cùng token của thiết bị đã ghép nối. Thay vào đó, các bên gọi `deviceToken` rõ ràng / `scopes` rõ ràng vẫn giữ tập phạm vi mà họ yêu cầu.
    - `AUTH_SCOPE_MISMATCH` → token thiết bị đã được nhận dạng, nhưng các phạm vi đã phê duyệt không bao phủ yêu cầu kết nối này; hãy ghép nối lại hoặc phê duyệt hợp đồng phạm vi được yêu cầu thay vì luân chuyển token gateway dùng chung.
    - Ngoài đường dẫn thử lại đó, thứ tự ưu tiên xác thực kết nối là token/mật khẩu dùng chung được chỉ định rõ ràng trước, sau đó là `deviceToken` được chỉ định rõ ràng, rồi token thiết bị đã lưu và cuối cùng là token khởi tạo.
    - Trên đường dẫn giao diện điều khiển Tailscale Serve bất đồng bộ, các lần thử thất bại cho cùng một `{scope, ip}` được tuần tự hóa trước khi bộ giới hạn ghi nhận lỗi. Vì vậy, hai lần thử lại không hợp lệ đồng thời từ cùng một máy khách có thể khiến lần thử thứ hai trả về `retry later` thay vì hai lỗi không khớp thông thường.
    - `too many failed authentication attempts (retry later)` từ một máy khách loopback có nguồn gốc trình duyệt → các lần thất bại lặp lại từ cùng một `Origin` đã chuẩn hóa sẽ tạm thời bị khóa; một nguồn gốc localhost khác sử dụng một nhóm giới hạn riêng.
    - `unauthorized` lặp lại sau lần thử đó → token dùng chung và token thiết bị không đồng bộ; hãy làm mới cấu hình token và phê duyệt lại/luân chuyển token thiết bị nếu cần.
    - `gateway connect failed:` → đích máy chủ/cổng/URL không chính xác.

  </Accordion>
</AccordionGroup>

### Bản đồ nhanh mã chi tiết xác thực

Sử dụng `error.details.code` từ phản hồi `connect` thất bại để chọn hành động tiếp theo:

| Mã chi tiết                  | Ý nghĩa                                                                                                                                                                                      | Hành động khuyến nghị                                                                                                                                                                                                                                                                       |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | Máy khách không gửi token dùng chung bắt buộc.                                                                                                                                                 | Dán/đặt token trong máy khách rồi thử lại. Đối với đường dẫn bảng điều khiển: `openclaw config get gateway.auth.token`, sau đó dán vào phần cài đặt của giao diện điều khiển.                                                                                                                                              |
| `AUTH_TOKEN_MISMATCH`        | Token dùng chung không khớp với token xác thực của gateway.                                                                                                                                               | Nếu `canRetryWithDeviceToken=true`, cho phép một lần thử lại đáng tin cậy. Các lần thử lại bằng token được lưu trong bộ nhớ đệm tái sử dụng các phạm vi đã phê duyệt và được lưu; các bên gọi `deviceToken` / `scopes` rõ ràng vẫn giữ phạm vi được yêu cầu. Nếu vẫn thất bại, hãy chạy [danh sách kiểm tra khôi phục tình trạng token không đồng bộ](/vi/cli/devices#token-drift-recovery-checklist). |
| `AUTH_DEVICE_TOKEN_MISMATCH` | Token riêng cho từng thiết bị được lưu trong bộ nhớ đệm đã lỗi thời hoặc bị thu hồi.                                                                                                                                                 | Luân chuyển/phê duyệt lại token thiết bị bằng [CLI thiết bị](/vi/cli/devices), sau đó kết nối lại.                                                                                                                                                                                                        |
| `AUTH_SCOPE_MISMATCH`        | Token thiết bị hợp lệ, nhưng vai trò/phạm vi đã phê duyệt không bao phủ yêu cầu kết nối này.                                                                                                       | Ghép nối lại thiết bị hoặc phê duyệt hợp đồng phạm vi được yêu cầu; không coi đây là tình trạng token dùng chung không đồng bộ.                                                                                                                                                                                     |
| `PAIRING_REQUIRED`           | Danh tính thiết bị cần được phê duyệt. Kiểm tra `error.details.reason` để tìm `not-paired`, `scope-upgrade`, `role-upgrade` hoặc `metadata-upgrade`, và sử dụng `requestId` / `remediationHint` khi có. | Phê duyệt yêu cầu đang chờ xử lý: `openclaw devices list`, sau đó là `openclaw devices approve <requestId>`. Việc nâng cấp phạm vi/vai trò sử dụng cùng một quy trình sau khi bạn xem xét quyền truy cập được yêu cầu.                                                                                                               |

<Note>
Các RPC backend loopback trực tiếp được xác thực bằng token/mật khẩu gateway dùng chung không nên phụ thuộc vào đường cơ sở phạm vi thiết bị đã ghép nối của CLI. Nếu các tác nhân phụ hoặc lệnh gọi nội bộ khác vẫn thất bại với `scope-upgrade`, hãy xác minh rằng bên gọi đang sử dụng `client.id: "gateway-client"` và `client.mode: "backend"`, đồng thời không ép sử dụng `deviceIdentity` rõ ràng hoặc token thiết bị.
</Note>

Kiểm tra di chuyển xác thực thiết bị v2:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

Nếu nhật ký hiển thị lỗi nonce/chữ ký, hãy cập nhật máy khách đang kết nối và xác minh:

<Steps>
  <Step title="Chờ connect.challenge">
    Máy khách chờ `connect.challenge` do gateway cấp.
  </Step>
  <Step title="Ký tải trọng">
    Máy khách ký tải trọng được liên kết với thử thách.
  </Step>
  <Step title="Gửi nonce của thiết bị">
    Máy khách gửi `connect.params.device.nonce` với cùng nonce thử thách.
  </Step>
</Steps>

Nếu `openclaw devices rotate` / `revoke` / `remove` bị từ chối ngoài dự kiến:

- Các phiên token của thiết bị đã ghép nối chỉ có thể quản lý **thiết bị của chính phiên đó**, trừ khi bên gọi cũng có `operator.admin`.
- `openclaw devices rotate --scope ...` chỉ có thể yêu cầu các phạm vi toán tử mà phiên của bên gọi đã có.

Liên quan:

- [Cấu hình](/vi/gateway/configuration) (các chế độ xác thực gateway)
- [Giao diện điều khiển](/vi/web/control-ui)
- [Thiết bị](/vi/cli/devices)
- [Truy cập từ xa](/vi/gateway/remote)
- [Xác thực proxy đáng tin cậy](/vi/gateway/trusted-proxy-auth)

## Dịch vụ Gateway không chạy

Sử dụng khi dịch vụ đã được cài đặt nhưng tiến trình không duy trì hoạt động.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # đồng thời quét các dịch vụ cấp hệ thống
```

Kiểm tra:

- `Runtime: stopped` kèm gợi ý thoát.
- Cấu hình dịch vụ không khớp (`Config (cli)` so với `Config (service)`).
- Xung đột cổng/trình lắng nghe.
- Có thêm các bản cài đặt launchd/systemd/schtasks khi sử dụng `--deep`.
- `Other gateway-like services detected (best effort)` gợi ý dọn dẹp.

<AccordionGroup>
  <Accordion title="Các dấu hiệu thường gặp">
    - `Gateway start blocked: set gateway.mode=local` hoặc `existing config is missing gateway.mode` → chế độ gateway cục bộ chưa được bật hoặc tệp cấu hình đã bị ghi đè và mất `gateway.mode`. Cách khắc phục: đặt `gateway.mode="local"` trong cấu hình hoặc chạy lại `openclaw onboard --mode local` / `openclaw setup` để ghi lại cấu hình chế độ cục bộ dự kiến. Nếu bạn đang chạy OpenClaw qua Podman, đường dẫn cấu hình mặc định là `~/.openclaw/openclaw.json`.
    - `refusing to bind gateway ... without auth` → liên kết không phải loopback nhưng không có đường dẫn xác thực gateway hợp lệ (token/mật khẩu hoặc trusted-proxy khi được cấu hình).
    - `another gateway instance is already listening` / `EADDRINUSE` → xung đột cổng.
    - `Other gateway-like services detected (best effort)` → tồn tại các đơn vị launchd/systemd/schtasks đã lỗi thời hoặc chạy song song. Hầu hết thiết lập chỉ nên duy trì một gateway trên mỗi máy; nếu thực sự cần nhiều hơn một, hãy cô lập các cổng cùng cấu hình/trạng thái/không gian làm việc. Xem [/gateway#multiple-gateways-same-host](/vi/gateway#multiple-gateways-same-host).
    - `System-level OpenClaw gateway service detected` từ doctor → tồn tại một đơn vị hệ thống systemd trong khi dịch vụ cấp người dùng bị thiếu. Hãy xóa hoặc vô hiệu hóa bản trùng lặp trước khi cho phép doctor cài đặt dịch vụ người dùng, hoặc đặt `OPENCLAW_SERVICE_REPAIR_POLICY=external` nếu đơn vị hệ thống là trình giám sát dự kiến.
    - `Gateway service port does not match current gateway config` → trình giám sát đã cài đặt vẫn ghim `--port` cũ. Chạy `openclaw doctor --fix` hoặc `openclaw gateway install --force`, sau đó khởi động lại dịch vụ gateway.

  </Accordion>
</AccordionGroup>

Liên quan:

- [Thực thi nền và công cụ tiến trình](/vi/gateway/background-process)
- [Cấu hình](/vi/gateway/configuration)
- [Doctor](/vi/gateway/doctor)

## Gateway trên macOS âm thầm ngừng phản hồi, sau đó hoạt động trở lại khi bạn tương tác với bảng điều khiển

Dùng khi các kênh (Telegram, WhatsApp, v.v.) trên máy chủ macOS im lặng trong khoảng từ vài phút đến vài giờ, và Gateway dường như hoạt động trở lại ngay khi bạn mở Control UI, đăng nhập qua SSH hoặc tương tác với máy chủ theo cách khác. Thường không có triệu chứng rõ ràng trong `openclaw status` vì đến lúc bạn kiểm tra thì Gateway đã hoạt động trở lại.

```bash
ls ~/.openclaw/logs/stability/ | tail -5
openclaw gateway stability --bundle latest
pmset -g log | grep -iE "sleep|wake|maintenance" | tail -50
launchctl print gui/$UID/ai.openclaw.gateway | grep -E "state|last exit|runs"
```

Tìm:

- Một hoặc nhiều gói `*-uncaught_exception.json` trong `~/.openclaw/logs/stability/` có `error.code` được đặt thành mã mạng tạm thời như `ENETDOWN`, `ENETUNREACH`, `EHOSTUNREACH` hoặc `ECONNREFUSED`.
- Các dòng `pmset -g log` như `Entering Sleep state due to 'Maintenance Sleep'` hoặc `en0 driver is slow (msg: WillChangeState to 0)` trùng với dấu thời gian xảy ra sự cố. Power Nap / Maintenance Sleep tạm thời đưa trình điều khiển Wi-Fi về trạng thái 0; mọi `connect()` gửi đi rơi đúng vào khoảng thời gian đó đều có thể thất bại với `ENETDOWN`, ngay cả trên máy chủ vốn có kết nối mạng đầy đủ.
- Đầu ra `launchctl print` hiển thị `state = not running` cùng nhiều `runs` gần đây và một mã thoát, đặc biệt khi khoảng cách giữa sự cố và lần khởi chạy tiếp theo kéo dài khoảng một giờ thay vì vài giây. launchd của macOS áp dụng một cơ chế bảo vệ chống tái khởi chạy không được tài liệu hóa sau một loạt sự cố, khiến `KeepAlive=true` có thể không còn được tuân thủ cho đến khi một tác nhân bên ngoài như đăng nhập tương tác, kết nối bảng điều khiển hoặc `launchctl kickstart` kích hoạt lại cơ chế này.

Các dấu hiệu thường gặp:

- Một gói ổn định có `error.code` là `ENETDOWN` hoặc mã cùng nhóm, với ngăn xếp lời gọi trỏ vào Node `net` `lookupAndConnect` / `Socket.connect`. OpenClaw `2026.5.26` trở lên phân loại các lỗi này là lỗi mạng tạm thời vô hại, vì vậy chúng không còn lan truyền đến trình xử lý ngoại lệ không được bắt ở cấp cao nhất; nếu đang dùng bản phát hành cũ hơn, hãy nâng cấp trước.
- Các khoảng thời gian im lặng kéo dài kết thúc ngay khi bạn kết nối với Control UI hoặc đăng nhập vào máy chủ qua SSH: hoạt động mà người dùng thấy được chính là yếu tố kích hoạt lại cơ chế tái khởi chạy của launchd, không phải bất kỳ hành động nào của bảng điều khiển đối với Gateway.
- Số đếm `runs` tăng dần trong ngày nhưng không có dòng `received SIG*; shutting down` tương ứng trong `~/Library/Logs/openclaw/gateway.log`: các lần tắt đúng quy trình sẽ ghi tín hiệu vào nhật ký; các sự cố tạm thời thì không.

Cách xử lý:

1. **Nâng cấp Gateway** nếu bạn đang chạy bản phát hành trước `2026.5.26`. Sau khi nâng cấp, các lỗi `ENETDOWN` trong tương lai sẽ được ghi dưới dạng cảnh báo thay vì chấm dứt tiến trình.
2. **Giảm hoạt động ngủ bảo trì** trên các máy Mac mini / máy tính để bàn được dùng làm máy chủ luôn bật:

   ```bash
   sudo pmset -a sleep 0 disksleep 0 standby 0 powernap 0
   ```

   Việc này làm giảm đáng kể nhưng không loại bỏ hoàn toàn tình trạng chập chờn của trình điều khiển bên dưới. Hệ thống vẫn có thể thực hiện một số lần ngủ bảo trì để duy trì TCP keepalive và mDNS bất kể các cờ này.

3. **Thêm trình giám sát trạng thái hoạt động** để nhanh chóng phát hiện một loạt sự cố trong tương lai bị launchd giữ lại:

   ```bash
   # Ví dụ về kiểm tra trạng thái hoạt động có nhận biết launchd, phù hợp với Cron hoặc LaunchAgent chạy mỗi 5 phút
   state=$(launchctl print gui/$UID/ai.openclaw.gateway 2>/dev/null | awk -F'= ' '/state =/ {print $2; exit}')
   if [ "$state" != "running" ]; then
     launchctl kickstart -k gui/$UID/ai.openclaw.gateway
   fi
   ```

   Mục đích là kích hoạt lại cơ chế tái khởi chạy từ bên ngoài; chỉ `KeepAlive=true` là không đủ trên macOS sau một loạt sự cố.

Liên quan:

- [Ghi chú về nền tảng macOS](/vi/platforms/macos)
- [Ghi nhật ký](/vi/logging)
- [Doctor](/vi/gateway/doctor)

## Vòng lặp giám sát launchd trên macOS với các LaunchAgent Gateway/node trùng lặp

Dùng phần này khi một bản cài đặt macOS liên tục khởi động lại sau mỗi vài giây, các lần kiểm tra tình trạng `openclaw`
dao động giữa hoạt động bình thường và không khả dụng, đồng thời việc phân phối qua kênh bị đình trệ
dù dịch vụ có vẻ vẫn đang chạy.

Tình trạng này từng được ghi nhận trên các bản cài đặt cũ, nơi cả LaunchAgent `ai.openclaw.gateway` và
`ai.openclaw.node` đều hoạt động và mỗi LaunchAgent đều chèn
`OPENCLAW_LAUNCHD_LABEL`. Trong trạng thái đó, OpenClaw có thể phát hiện sự
giám sát của launchd, cố gắng chuyển việc khởi động lại về cho launchd và rơi vào vòng lặp
`EADDRINUSE`/tái khởi chạy nhanh thay vì duy trì một tiến trình Gateway ổn định.

```bash
for i in 1 2 3 4; do
  ps aux | grep 'openclaw.*index.js' | grep -v grep | awk '{print $2}'
  sleep 10
done

openclaw gateway status --deep
openclaw node status
launchctl print gui/$UID/ai.openclaw.gateway | grep -E 'state|last exit|runs'
tail -n 80 ~/Library/Logs/openclaw/gateway.log
```

Tìm:

- Nhiều hơn một PID Gateway trong mẫu 30 giây thay vì một
  tiến trình ổn định.
- `EADDRINUSE`, `another gateway instance is already listening` hoặc các dòng
  khởi động lại/chuyển giao lặp lại trong `gateway.log`.
- Cả `~/Library/LaunchAgents/ai.openclaw.gateway.plist` và
  `~/Library/LaunchAgents/ai.openclaw.node.plist` được nạp cùng lúc trên một
  máy chủ đáng lẽ chỉ chạy một dịch vụ Gateway được quản lý.

Cách xử lý:

1. Nếu máy chủ này chỉ nên chạy dịch vụ Gateway, hãy gỡ dịch vụ node
   được quản lý thông qua OpenClaw. **Bỏ qua bước này** nếu bạn đang chủ động phụ thuộc vào dịch vụ node
   cho các tính năng node từ xa; việc gỡ cài đặt sẽ dừng các tính năng đó trên
   máy chủ này:

   ```bash
   openclaw node uninstall
   ```

2. Cài đặt một trình bao bọc Gateway lâu dài để xóa các dấu hiệu launchd
   được kế thừa trước khi khởi động OpenClaw. Hãy dùng tùy chọn `--wrapper` được hỗ trợ; không
   chỉnh sửa tệp được tạo trong `~/.openclaw/service-env/`, vì việc cài đặt lại
   dịch vụ, cập nhật và sửa chữa bằng Doctor sẽ tạo lại tệp đó:

   ```bash
   mkdir -p ~/.local/bin
   cat >~/.local/bin/openclaw-launchd-workaround <<'EOF'
   #!/bin/sh
   set -eu
   unset OPENCLAW_LAUNCHD_LABEL LAUNCH_JOB_LABEL LAUNCH_JOB_NAME XPC_SERVICE_NAME || true
   exec openclaw "$@"
   EOF
   chmod 700 ~/.local/bin/openclaw-launchd-workaround

   openclaw gateway install \
     --wrapper ~/.local/bin/openclaw-launchd-workaround \
     --force
   ```

   `gateway install` duy trì đường dẫn trình bao bọc qua các lần cài đặt lại cưỡng bức,
   cập nhật và sửa chữa bằng Doctor.

3. Xác minh Gateway ổn định và đang phục vụ RPC, không chỉ đơn thuần lắng nghe:

   ```bash
   openclaw gateway status --deep --require-rpc

   for i in 1 2 3 4; do
     ps aux | grep 'openclaw.*index.js' | grep -v grep | awk '{print $2}'
     sleep 10
   done
   ```

   Mẫu PID phải hiển thị một tiến trình ổn định thay vì một tập hợp
   PID luân phiên, và việc phân phối đến qua kênh phải tiếp tục hoạt động.

4. Sau khi nâng cấp lên bản phát hành đã khắc phục vòng lặp hai LaunchAgent
   bên dưới, hãy xóa giải pháp tạm thời và cài đặt lại dịch vụ được quản lý thông thường:

   ```bash
   OPENCLAW_WRAPPER= openclaw gateway install --force
   rm ~/.local/bin/openclaw-launchd-workaround
   ```

Liên quan:

- [Ghi chú về nền tảng macOS](/vi/platforms/mac/bundled-gateway)
- [Doctor](/vi/gateway/doctor)
- [CLI Gateway](/vi/cli/gateway)

## Gateway thoát khi mức sử dụng bộ nhớ cao

Dùng khi Gateway biến mất dưới tải, trình giám sát báo cáo một lần khởi động lại kiểu OOM hoặc nhật ký đề cập đến `critical memory pressure bundle written`.

```bash
openclaw gateway status --deep
openclaw logs --follow
openclaw gateway stability --bundle latest
openclaw gateway diagnostics export
```

Tìm:

- `Reason: diagnostic.memory.pressure.critical` trong gói ổn định mới nhất.
- `Memory pressure:` với `critical/rss_threshold`, `critical/heap_threshold` hoặc `critical/rss_growth`.
- Các giá trị `V8 heap:` gần giới hạn heap.
- Các mục `Largest session files:` như `agents/<agent>/sessions/<session>.jsonl` hoặc `sessions/<session>.jsonl`.
- Các bộ đếm bộ nhớ cgroup của Linux khi Gateway chạy trong vùng chứa hoặc dịch vụ bị giới hạn bộ nhớ.

Các dấu hiệu thường gặp:

- `critical memory pressure bundle written` xuất hiện ngay trước khi khởi động lại → OpenClaw đã thu thập một gói ổn định trước OOM. Kiểm tra gói bằng `openclaw gateway stability --bundle latest`.
- `memory pressure: level=critical ... memoryPressureSnapshot=disabled` xuất hiện trong nhật ký Gateway → OpenClaw đã phát hiện áp lực bộ nhớ nghiêm trọng, nhưng ảnh chụp nhanh ổn định trước OOM đang bị tắt.
- `Largest session files:` trỏ đến một đường dẫn bản chép lời đã biên tập rất lớn → giảm lịch sử phiên được giữ lại, kiểm tra sự tăng trưởng của phiên hoặc chuyển các bản chép lời cũ ra khỏi kho đang hoạt động trước khi khởi động lại.
- Số byte đã dùng trong `V8 heap:` gần bằng giới hạn heap → giảm áp lực từ lời nhắc/phiên, giảm công việc đồng thời hoặc chỉ tăng giới hạn heap của Node sau khi xác nhận khối lượng công việc là dự kiến.
- `Memory pressure: critical/rss_growth` → bộ nhớ tăng nhanh trong một khoảng lấy mẫu. Kiểm tra nhật ký mới nhất để tìm một lần nhập dữ liệu lớn, đầu ra công cụ mất kiểm soát, các lần thử lại lặp đi lặp lại hoặc một lô công việc của tác tử đang chờ.
- Áp lực bộ nhớ nghiêm trọng xuất hiện trong nhật ký nhưng không có gói nào tồn tại → đây là mặc định. Đặt `diagnostics.memoryPressureSnapshot: true` để thu thập gói ổn định trước OOM trong các sự kiện áp lực bộ nhớ nghiêm trọng sau này.

Gói ổn định không chứa tải nội dung. Gói bao gồm bằng chứng vận hành về bộ nhớ và các đường dẫn tệp tương đối đã biên tập, không bao gồm văn bản tin nhắn, nội dung Webhook, thông tin xác thực, token, cookie hoặc mã định danh phiên thô. Hãy đính kèm bản xuất chẩn đoán vào báo cáo lỗi thay vì sao chép nhật ký thô.

Liên quan:

- [Tình trạng Gateway](/vi/gateway/health)
- [Xuất dữ liệu chẩn đoán](/vi/gateway/diagnostics)
- [Phiên](/vi/cli/sessions)

## Gateway từ chối cấu hình không hợp lệ

Dùng khi Gateway không khởi động được với `Invalid config` hoặc nhật ký tải lại nóng cho biết một chỉnh sửa không hợp lệ đã bị bỏ qua.

```bash
openclaw logs --follow
openclaw config file
openclaw config validate
openclaw doctor
```

Tìm:

- `Invalid config at ...`
- `config reload skipped (invalid config): ...`
- `Config write rejected: ...`
- Một tệp `openclaw.json.rejected.*` có dấu thời gian nằm cạnh cấu hình đang hoạt động.
- Một tệp `openclaw.json.clobbered.*` có dấu thời gian nếu `doctor --fix` đã sửa một chỉnh sửa trực tiếp bị hỏng.
- OpenClaw giữ lại 32 tệp `.clobbered.*` mới nhất cho mỗi đường dẫn cấu hình và luân chuyển các tệp cũ hơn.

<AccordionGroup>
  <Accordion title="Điều gì đã xảy ra">
    - Cấu hình không vượt qua bước xác thực trong khi khởi động, tải lại nóng hoặc ghi do OpenClaw sở hữu.
    - Gateway từ chối khởi động thay vì ghi lại `openclaw.json`.
    - Tải lại nóng bỏ qua các chỉnh sửa bên ngoài không hợp lệ và tiếp tục duy trì cấu hình thời gian chạy hiện tại.
    - Các thao tác ghi do OpenClaw sở hữu từ chối tải nội dung không hợp lệ/phá hủy trước khi cam kết và lưu `.rejected.*`.
    - `openclaw doctor --fix` chịu trách nhiệm sửa chữa. Công cụ này có thể xóa các tiền tố không phải JSON hoặc khôi phục bản sao hợp lệ gần nhất trong khi vẫn giữ tải nội dung bị từ chối dưới dạng `.clobbered.*`.
    - Khi có nhiều lần sửa chữa cho một đường dẫn cấu hình, OpenClaw luân chuyển các tệp `.clobbered.*` cũ hơn để tải nội dung được sửa chữa mới nhất vẫn còn khả dụng.

  </Accordion>
  <Accordion title="Kiểm tra và sửa chữa">
    ```bash
    CONFIG="$(openclaw config file)"
    ls -lt "$CONFIG".clobbered.* "$CONFIG".rejected.* 2>/dev/null | head
    diff -u "$CONFIG" "$(ls -t "$CONFIG".clobbered.* 2>/dev/null | head -n 1)"
    openclaw config validate
    openclaw doctor
    ```
  </Accordion>
  <Accordion title="Các dấu hiệu thường gặp">
    - `.clobbered.*` tồn tại → doctor đã giữ lại một chỉnh sửa bên ngoài bị lỗi trong khi sửa cấu hình đang hoạt động.
    - `.rejected.*` tồn tại → một thao tác ghi cấu hình do OpenClaw sở hữu đã không vượt qua bước kiểm tra lược đồ hoặc ghi đè trước khi commit.
    - `Config write rejected:` → thao tác ghi đã cố loại bỏ cấu trúc bắt buộc, làm giảm mạnh kích thước tệp hoặc lưu cấu hình không hợp lệ.
    - `config reload skipped (invalid config):` → một chỉnh sửa trực tiếp đã không vượt qua bước xác thực và bị Gateway đang chạy bỏ qua.
    - `Invalid config at ...` → quá trình khởi động thất bại trước khi các dịch vụ Gateway được khởi chạy.
    - `missing-meta-vs-last-good`, `gateway-mode-missing-vs-last-good` hoặc `size-drop-vs-last-good:*` → một thao tác ghi do OpenClaw sở hữu bị từ chối vì làm mất các trường hoặc giảm kích thước so với bản sao lưu hợp lệ gần nhất.
    - `Config last-known-good promotion skipped` → cấu hình đề xuất chứa các phần giữ chỗ bí mật đã được che, chẳng hạn như `***`.

  </Accordion>
  <Accordion title="Các phương án khắc phục">
    1. Chạy `openclaw doctor --fix` để doctor sửa cấu hình có tiền tố/bị ghi đè hoặc khôi phục bản hợp lệ gần nhất.
    2. Chỉ sao chép các khóa cần thiết từ `.clobbered.*` hoặc `.rejected.*`, sau đó áp dụng chúng bằng `openclaw config set` hoặc `config.patch`.
    3. Chạy `openclaw config validate` trước khi khởi động lại.
    4. Nếu chỉnh sửa thủ công, hãy giữ nguyên toàn bộ cấu hình JSON5, không chỉ đối tượng một phần mà bạn muốn thay đổi.
  </Accordion>
</AccordionGroup>

Liên quan:

- [Cấu hình](/vi/cli/config)
- [Cấu hình: tải lại nóng](/vi/gateway/configuration#config-hot-reload)
- [Cấu hình: xác thực nghiêm ngặt](/vi/gateway/configuration#strict-validation)
- [Doctor](/vi/gateway/doctor)

## Cảnh báo khi thăm dò Gateway

Sử dụng khi `openclaw gateway probe` kết nối được với một đích nào đó nhưng vẫn in ra khối cảnh báo.

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

Tìm:

- `warnings[].code` và `primaryTargetId` trong đầu ra JSON.
- Cảnh báo có liên quan đến phương án dự phòng SSH, nhiều gateway, thiếu phạm vi hay tham chiếu xác thực chưa được phân giải hay không.

Các dấu hiệu thường gặp:

- `SSH tunnel failed to start; falling back to direct probes.` → thiết lập SSH thất bại, nhưng lệnh vẫn thử các đích trực tiếp đã cấu hình/loopback.
- `multiple reachable gateway identities detected` → các gateway riêng biệt đã phản hồi hoặc OpenClaw không thể chứng minh rằng các đích có thể truy cập là cùng một gateway. Đường hầm SSH, URL proxy hoặc URL từ xa đã cấu hình trỏ đến cùng một gateway được xem là một gateway có nhiều phương thức truyền tải, ngay cả khi các cổng truyền tải khác nhau.
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → kết nối thành công nhưng RPC chi tiết bị giới hạn theo phạm vi; hãy ghép cặp danh tính thiết bị hoặc sử dụng thông tin xác thực có `operator.read`.
- `Gateway accepted the WebSocket connection, but follow-up read diagnostics failed` → kết nối thành công nhưng toàn bộ tập RPC chẩn đoán đã hết thời gian chờ hoặc thất bại. Hãy xem đây là một Gateway có thể truy cập nhưng khả năng chẩn đoán bị suy giảm; so sánh `connect.ok` và `connect.rpcOk` trong đầu ra `--json`.
- `Capability: pairing-pending` hoặc `gateway closed (1008): pairing required` → gateway đã phản hồi nhưng máy khách này vẫn cần ghép cặp/phê duyệt trước khi có quyền truy cập thông thường của người vận hành.
- Văn bản cảnh báo SecretRef `gateway.auth.*` / `gateway.remote.*` chưa được phân giải → tài liệu xác thực không khả dụng trong đường dẫn lệnh này đối với đích thất bại.

Liên quan:

- [Gateway](/vi/cli/gateway)
- [Nhiều gateway trên cùng một máy chủ](/vi/gateway#multiple-gateways-same-host)
- [Truy cập từ xa](/vi/gateway/remote)

## Kênh đã kết nối nhưng tin nhắn không lưu chuyển

Nếu trạng thái kênh là đã kết nối nhưng luồng tin nhắn không hoạt động, hãy tập trung vào chính sách, quyền và các quy tắc phân phối dành riêng cho kênh.

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

Tìm:

- Chính sách DM (`pairing`, `allowlist`, `open`, `disabled`).
- Danh sách cho phép của nhóm và yêu cầu đề cập.
- Thiếu quyền/phạm vi API của kênh.

Các dấu hiệu thường gặp:

- `mention required` → tin nhắn bị chính sách đề cập của nhóm bỏ qua.
- `pairing` / dấu vết chờ phê duyệt → người gửi chưa được phê duyệt.
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → sự cố xác thực/quyền của kênh.

Liên quan:

- [Khắc phục sự cố kênh](/vi/channels/troubleshooting)
- [Discord](/vi/channels/discord)
- [Telegram](/vi/channels/telegram)
- [WhatsApp](/vi/channels/whatsapp)

## Phân phối Cron và Heartbeat

Nếu Cron hoặc Heartbeat không chạy hay không phân phối, trước tiên hãy xác minh trạng thái bộ lập lịch, sau đó kiểm tra đích phân phối.

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

Tìm:

- Cron đã bật và có lần đánh thức tiếp theo.
- Trạng thái lịch sử chạy tác vụ (`ok`, `skipped`, `error`).
- Lý do bỏ qua Heartbeat (`quiet-hours`, `requests-in-flight`, `cron-in-progress`, `lanes-busy`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`).

<AccordionGroup>
  <Accordion title="Các dấu hiệu thường gặp">
    - `cron: scheduler disabled; jobs will not run automatically` → Cron bị tắt.
    - `cron: timer tick failed` → nhịp bộ lập lịch thất bại; hãy kiểm tra lỗi tệp/nhật ký/runtime.
    - `heartbeat skipped` cùng `reason=quiet-hours` → nằm ngoài khung giờ hoạt động.
    - `heartbeat skipped` cùng `reason=empty-heartbeat-file` → `HEARTBEAT.md` tồn tại nhưng chỉ chứa phần khung trống, chú thích, tiêu đề, hàng rào hoặc danh sách kiểm tra trống, vì vậy OpenClaw bỏ qua lệnh gọi mô hình.
    - `heartbeat skipped` cùng `reason=no-tasks-due` → `HEARTBEAT.md` chứa một khối `tasks:`, nhưng không có tác vụ nào đến hạn trong nhịp này.
    - `heartbeat: unknown accountId` → ID tài khoản không hợp lệ cho đích phân phối Heartbeat.
    - `heartbeat skipped` cùng `reason=dm-blocked` → đích Heartbeat được phân giải thành một đích kiểu DM trong khi `agents.defaults.heartbeat.directPolicy` (hoặc giá trị ghi đè theo từng tác tử) được đặt thành `block`.

  </Accordion>
</AccordionGroup>

Liên quan:

- [Heartbeat](/vi/gateway/heartbeat)
- [Tác vụ đã lên lịch](/vi/automation/cron-jobs)
- [Tác vụ đã lên lịch: khắc phục sự cố](/vi/automation/cron-jobs#troubleshooting)

## Node đã ghép cặp nhưng công cụ thất bại

Nếu Node đã được ghép cặp nhưng công cụ thất bại, hãy cô lập trạng thái tiền cảnh, quyền và phê duyệt.

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

Tìm:

- Node trực tuyến với các khả năng dự kiến.
- Quyền của hệ điều hành đối với camera/micrô/vị trí/màn hình.
- Trạng thái phê duyệt thực thi và danh sách cho phép.

Các dấu hiệu thường gặp:

- `NODE_BACKGROUND_UNAVAILABLE` → ứng dụng Node phải ở tiền cảnh.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → thiếu quyền của hệ điều hành.
- `SYSTEM_RUN_DENIED: approval required` → phê duyệt thực thi đang chờ xử lý.
- `SYSTEM_RUN_DENIED: allowlist miss` → lệnh bị danh sách cho phép chặn.

Liên quan:

- [Phê duyệt thực thi](/vi/tools/exec-approvals)
- [Khắc phục sự cố Node](/vi/nodes/troubleshooting)
- [Các Node](/vi/nodes/index)

## Công cụ trình duyệt thất bại

Sử dụng khi các thao tác của công cụ trình duyệt thất bại mặc dù bản thân gateway vẫn hoạt động bình thường.

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

Tìm:

- `plugins.allow` có được đặt và chứa `browser` hay không.
- Đường dẫn tệp thực thi trình duyệt hợp lệ.
- Khả năng truy cập hồ sơ CDP.
- Khả năng sử dụng Chrome cục bộ cho các hồ sơ `existing-session` / `user`.

<AccordionGroup>
  <Accordion title="Dấu hiệu về Plugin / tệp thực thi">
    - `unknown command "browser"` hoặc `unknown command 'browser'` → Plugin trình duyệt đi kèm bị `plugins.allow` loại trừ.
    - Công cụ trình duyệt bị thiếu / không khả dụng trong khi `browser.enabled=true` → `plugins.allow` loại trừ `browser`, nên Plugin không bao giờ được tải.
    - `Failed to start Chrome CDP on port` → tiến trình trình duyệt không thể khởi chạy.
    - `browser.executablePath not found` → đường dẫn đã cấu hình không hợp lệ.
    - `browser.cdpUrl must be http(s) or ws(s)` → URL CDP đã cấu hình sử dụng một lược đồ không được hỗ trợ, chẳng hạn như `file:` hoặc `ftp:`.
    - `browser.cdpUrl has invalid port` → URL CDP đã cấu hình có cổng không hợp lệ hoặc nằm ngoài phạm vi.
    - `Playwright is not available in this gateway build; '<feature>' is unsupported.` → bản cài đặt gateway hiện tại thiếu phần phụ thuộc runtime trình duyệt lõi; hãy cài đặt lại hoặc cập nhật OpenClaw, sau đó khởi động lại gateway. Ảnh chụp nhanh ARIA và ảnh chụp màn hình trang cơ bản vẫn có thể hoạt động, nhưng điều hướng, ảnh chụp nhanh AI, ảnh chụp phần tử bằng bộ chọn CSS và xuất PDF vẫn không khả dụng.

  </Accordion>
  <Accordion title="Dấu hiệu về Chrome MCP / phiên hiện có">
    - `Could not find DevToolsActivePort for chrome` → phiên hiện có của Chrome MCP chưa thể đính kèm vào thư mục dữ liệu trình duyệt đã chọn. Hãy mở trang kiểm tra của trình duyệt, bật gỡ lỗi từ xa, giữ trình duyệt mở, phê duyệt lời nhắc đính kèm đầu tiên rồi thử lại. Nếu không cần trạng thái đã đăng nhập, hãy ưu tiên hồ sơ `openclaw` được quản lý.
    - `No browser tabs found for profile="user"` → hồ sơ đính kèm Chrome MCP không có tab Chrome cục bộ nào đang mở.
    - `Remote CDP for profile "<name>" is not reachable` → điểm cuối CDP từ xa đã cấu hình không thể truy cập từ máy chủ gateway.
    - `Browser attachOnly is enabled ... not reachable` hoặc `Browser attachOnly is enabled and CDP websocket ... is not reachable` → hồ sơ chỉ đính kèm không có đích nào có thể truy cập, hoặc điểm cuối HTTP đã phản hồi nhưng WebSocket CDP vẫn không thể mở.

  </Accordion>
  <Accordion title="Dấu hiệu về phần tử / ảnh chụp màn hình / tải lên">
    - `fullPage is not supported for element screenshots` → yêu cầu chụp màn hình đã kết hợp `--full-page` với `--ref` hoặc `--element`.
    - `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → các lệnh gọi chụp màn hình Chrome MCP / `existing-session` phải sử dụng thao tác chụp trang hoặc `--ref` của ảnh chụp nhanh, không phải `--element` CSS.
    - `existing-session file uploads do not support element selectors; use ref/inputRef.` → các hook tải lên Chrome MCP cần tham chiếu ảnh chụp nhanh, không phải bộ chọn CSS.
    - `existing-session file uploads currently support one file at a time.` → gửi một lượt tải lên cho mỗi lệnh gọi trên hồ sơ Chrome MCP.
    - `existing-session dialog handling does not support timeoutMs.` → các hook hộp thoại trên hồ sơ Chrome MCP không hỗ trợ ghi đè thời gian chờ.
    - `existing-session type does not support timeoutMs overrides.` → bỏ qua `timeoutMs` cho `act:type` trên các hồ sơ phiên hiện có `profile="user"` / Chrome MCP, hoặc sử dụng hồ sơ trình duyệt được quản lý/CDP khi cần thời gian chờ tùy chỉnh.
    - `response body is not supported for existing-session profiles yet.` → `responsebody` vẫn yêu cầu trình duyệt được quản lý hoặc hồ sơ CDP thô.
    - Các giá trị ghi đè khung nhìn / chế độ tối / ngôn ngữ / ngoại tuyến đã cũ trên hồ sơ chỉ đính kèm hoặc CDP từ xa → chạy `openclaw browser stop --browser-profile <name>` để đóng phiên điều khiển đang hoạt động và giải phóng trạng thái mô phỏng Playwright/CDP mà không cần khởi động lại toàn bộ gateway.

  </Accordion>
</AccordionGroup>

Liên quan:

- [Trình duyệt (do OpenClaw quản lý)](/vi/tools/browser)
- [Khắc phục sự cố trình duyệt](/vi/tools/browser-linux-troubleshooting)

## Nếu bạn đã nâng cấp và có thứ gì đó đột ngột bị hỏng

Phần lớn sự cố sau khi nâng cấp là do cấu hình bị lệch hoặc các giá trị mặc định nghiêm ngặt hơn hiện đang được thực thi.

<AccordionGroup>
  <Accordion title="1. Hành vi xác thực và ghi đè URL đã thay đổi">
    ```bash
    openclaw gateway status
    openclaw config get gateway.mode
    openclaw config get gateway.remote.url
    openclaw config get gateway.auth.mode
    ```

    Nội dung cần kiểm tra:

    - Nếu `gateway.mode=remote`, các lệnh gọi CLI có thể đang nhắm đến máy chủ từ xa trong khi dịch vụ cục bộ vẫn hoạt động bình thường.
    - Các lệnh gọi `--url` tường minh không chuyển sang dùng thông tin xác thực đã lưu.

    Dấu hiệu thường gặp:

    - `gateway connect failed:` → URL đích không chính xác.
    - `unauthorized` → có thể truy cập điểm cuối nhưng thông tin xác thực không chính xác.

  </Accordion>
  <Accordion title="2. Các biện pháp bảo vệ cho liên kết và xác thực nghiêm ngặt hơn">
    ```bash
    openclaw config get gateway.bind
    openclaw config get gateway.auth.mode
    openclaw config get gateway.auth.token
    openclaw gateway status
    openclaw logs --follow
    ```

    Nội dung cần kiểm tra:

    - Các liên kết không phải loopback (`lan`, `tailnet`, `custom`) cần một đường dẫn xác thực Gateway hợp lệ: xác thực bằng token/mật khẩu dùng chung hoặc một triển khai `trusted-proxy` không phải loopback được cấu hình chính xác.
    - Các khóa cũ như `gateway.token` không thay thế `gateway.auth.token`.

    Dấu hiệu thường gặp:

    - `refusing to bind gateway ... without auth` → liên kết không phải loopback nhưng không có đường dẫn xác thực Gateway hợp lệ.
    - `Connectivity probe: failed` trong khi runtime đang chạy → Gateway đang hoạt động nhưng không thể truy cập bằng cấu hình xác thực/URL hiện tại.

  </Accordion>
  <Accordion title="3. Trạng thái ghép nối và danh tính thiết bị đã thay đổi">
    ```bash
    openclaw devices list
    openclaw pairing list --channel <channel> [--account <id>]
    openclaw logs --follow
    openclaw doctor
    ```

    Nội dung cần kiểm tra:

    - Các phê duyệt thiết bị đang chờ xử lý cho bảng điều khiển/các Node.
    - Các phê duyệt ghép nối tin nhắn trực tiếp đang chờ xử lý sau khi chính sách hoặc danh tính thay đổi.

    Dấu hiệu thường gặp:

    - `device identity required` → chưa đáp ứng yêu cầu xác thực thiết bị.
    - `pairing required` → người gửi/thiết bị phải được phê duyệt.

  </Accordion>
</AccordionGroup>

Nếu cấu hình dịch vụ và runtime vẫn không khớp sau khi kiểm tra, hãy cài đặt lại siêu dữ liệu dịch vụ từ cùng thư mục hồ sơ/trạng thái:

```bash
openclaw gateway install --force
openclaw gateway restart
```

Liên quan:

- [Xác thực](/vi/gateway/authentication)
- [Thực thi nền và công cụ xử lý tiến trình](/vi/gateway/background-process)
- [Ghép nối Node](/vi/gateway/pairing)

## Liên quan

- [Doctor](/vi/gateway/doctor)
- [Câu hỏi thường gặp](/vi/help/faq)
- [Sổ tay vận hành Gateway](/vi/gateway)
