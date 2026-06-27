---
read_when:
    - Trung tâm khắc phục sự cố đã dẫn bạn đến đây để chẩn đoán sâu hơn
    - Bạn cần các mục runbook ổn định dựa trên triệu chứng với các lệnh chính xác
sidebarTitle: Troubleshooting
summary: Sổ tay xử lý sự cố chuyên sâu cho gateway, kênh, tự động hóa, node và trình duyệt
title: Khắc phục sự cố
x-i18n:
    generated_at: "2026-06-27T17:33:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4ce8e8aed5c3e00be5b093875222962c22883472802e164534dae32adc5365c5
    source_path: gateway/troubleshooting.md
    workflow: 16
---

Trang này là runbook chuyên sâu. Bắt đầu tại [/help/troubleshooting](/vi/help/troubleshooting) nếu bạn muốn luồng phân loại nhanh trước.

## Bậc thang lệnh

Chạy các lệnh này trước, theo thứ tự này:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Tín hiệu khỏe mạnh dự kiến:

- `openclaw gateway status` hiển thị `Runtime: running`, `Connectivity probe: ok`, và một dòng `Capability: ...`.
- `openclaw doctor` báo cáo không có sự cố cấu hình/dịch vụ gây chặn.
- `openclaw channels status --probe` hiển thị trạng thái truyền tải trực tiếp theo từng tài khoản và, ở nơi được hỗ trợ, kết quả thăm dò/kiểm tra như `works` hoặc `audit ok`.

## Sau một bản cập nhật

Dùng phần này khi một bản cập nhật hoàn tất nhưng Gateway bị tắt, kênh trống, hoặc
lệnh gọi mô hình bắt đầu lỗi với 401.

```bash
openclaw status --all
openclaw update status --json
openclaw gateway status --deep
openclaw doctor --fix
openclaw gateway restart
```

Tìm:

- `Update restart` trong `openclaw status` / `openclaw status --all`. Các bàn giao đang chờ xử lý hoặc
  thất bại bao gồm lệnh tiếp theo cần chạy.
- `plugin load failed: dependency tree corrupted; run openclaw doctor --fix`
  dưới Channels. Điều đó nghĩa là cấu hình kênh vẫn tồn tại, nhưng đăng ký plugin
  thất bại trước khi kênh có thể tải.
- provider 401s sau khi xác thực lại. `openclaw doctor --fix` kiểm tra các bóng xác thực OAuth
  theo từng agent đã cũ và xóa các bản sao cũ để tất cả agent phân giải
  hồ sơ dùng chung hiện tại.

## Cài đặt split brain và chốt chặn cấu hình mới hơn

Dùng phần này khi một dịch vụ gateway dừng bất ngờ sau một bản cập nhật, hoặc nhật ký cho thấy một binary `openclaw` cũ hơn phiên bản đã ghi `openclaw.json` lần cuối.

OpenClaw đóng dấu các lần ghi cấu hình bằng `meta.lastTouchedVersion`. Các lệnh chỉ đọc vẫn có thể kiểm tra cấu hình được ghi bởi OpenClaw mới hơn, nhưng các thay đổi tiến trình và dịch vụ từ chối tiếp tục từ một binary cũ hơn. Các hành động bị chặn bao gồm khởi động, dừng, khởi động lại, gỡ cài đặt dịch vụ gateway, cài đặt lại dịch vụ cưỡng bức, khởi động gateway ở chế độ dịch vụ, và dọn dẹp cổng `gateway --force`.

```bash
which openclaw
openclaw --version
openclaw gateway status --deep
openclaw config get meta.lastTouchedVersion
```

<Steps>
  <Step title="Sửa PATH">
    Sửa `PATH` để `openclaw` phân giải tới bản cài đặt mới hơn, rồi chạy lại hành động.
  </Step>
  <Step title="Cài đặt lại dịch vụ gateway">
    Cài đặt lại dịch vụ gateway dự kiến từ bản cài đặt mới hơn:

    ```bash
    openclaw gateway install --force
    openclaw gateway restart
    ```

  </Step>
  <Step title="Xóa các wrapper cũ">
    Xóa gói hệ thống cũ hoặc các mục wrapper cũ vẫn trỏ tới binary `openclaw` cũ.
  </Step>
</Steps>

<Warning>
Chỉ dành cho hạ cấp có chủ ý hoặc khôi phục khẩn cấp, đặt `OPENCLAW_ALLOW_OLDER_BINARY_DESTRUCTIVE_ACTIONS=1` cho một lệnh duy nhất. Để không đặt biến này trong vận hành bình thường.
</Warning>

## Không khớp giao thức sau khi rollback

Dùng phần này khi nhật ký liên tục in `protocol mismatch` sau khi bạn hạ cấp hoặc rollback OpenClaw. Điều này nghĩa là một Gateway cũ hơn đang chạy, nhưng một tiến trình client cục bộ mới hơn vẫn đang cố kết nối lại bằng một dải giao thức mà Gateway cũ hơn không nói được.

```bash
openclaw --version
which -a openclaw
openclaw gateway status --deep
openclaw doctor --deep
openclaw logs --follow
```

Tìm:

- `protocol mismatch ... client=... v<version> min=<n> max=<n> expected=<n>` trong nhật ký Gateway.
- `Established clients:` trong `openclaw gateway status --deep` hoặc `Gateway clients` trong `openclaw doctor --deep`. Phần này liệt kê các client TCP đang hoạt động được kết nối với cổng Gateway, bao gồm PID và dòng lệnh khi hệ điều hành cho phép.
- Một tiến trình client có dòng lệnh trỏ tới bản cài đặt OpenClaw hoặc wrapper mới hơn mà bạn đã rollback khỏi.

Cách khắc phục:

1. Dừng hoặc khởi động lại tiến trình client OpenClaw cũ hiển thị bởi `gateway status --deep`.
2. Khởi động lại ứng dụng hoặc wrapper nhúng OpenClaw, chẳng hạn như dashboard cục bộ, trình biên tập, helper máy chủ ứng dụng, hoặc các shell `openclaw logs --follow` chạy lâu.
3. Chạy lại `openclaw gateway status --deep` hoặc `openclaw doctor --deep` và xác nhận PID client cũ đã biến mất.

Đừng khiến Gateway cũ hơn chấp nhận một giao thức mới hơn không tương thích. Các lần tăng phiên bản giao thức bảo vệ hợp đồng đường truyền; khôi phục rollback là vấn đề dọn dẹp tiến trình/phiên bản.

## Symlink Skill bị bỏ qua vì thoát khỏi đường dẫn

Dùng phần này khi nhật ký bao gồm:

```text
Skipping escaped skill path outside its configured root: ... reason=symlink-escape
```

OpenClaw coi mọi gốc skill là một ranh giới bao chứa. Một symlink dưới
`~/.agents/skills`, `<workspace>/.agents/skills`, `<workspace>/skills`, hoặc
`~/.openclaw/skills` sẽ bị bỏ qua khi đích thực của nó phân giải ra ngoài gốc đó
trừ khi đích được tin cậy rõ ràng.

Kiểm tra liên kết:

```bash
ls -l ~/.agents/skills/<name>
realpath ~/.agents/skills/<name>
openclaw config get skills.load
```

Nếu đích là có chủ ý, hãy cấu hình cả gốc skill trực tiếp và
đích symlink được cho phép:

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

Sau đó bắt đầu một phiên mới hoặc chờ trình theo dõi skills làm mới. Khởi động lại
gateway nếu tiến trình đang chạy có trước thay đổi cấu hình.

Đừng dùng các đích rộng như `~`, `/`, hoặc toàn bộ thư mục dự án được đồng bộ.
Giữ `allowSymlinkTargets` giới hạn trong gốc skill thực chứa các thư mục
`SKILL.md` đáng tin cậy.

Nếu thao tác áp dụng của Skill Workshop cũng cần ghi xuyên qua các đường dẫn skill workspace
symlink đáng tin cậy đó, hãy bật `skills.workshop.allowSymlinkTargetWrites`. Giữ
nó tắt cho các gốc skill dùng chung chỉ đọc.

Liên quan:

- [Cấu hình Skills](/vi/tools/skills-config#symlinked-skill-roots)
- [Ví dụ cấu hình](/vi/gateway/configuration-examples#symlinked-sibling-skill-repo)

## Anthropic 429 yêu cầu mức sử dụng bổ sung cho ngữ cảnh dài

Dùng phần này khi nhật ký/lỗi bao gồm: `HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

Tìm:

- Mô hình Anthropic được chọn là một mô hình Claude 4.x 1M có khả năng GA, hoặc mô hình có `params.context1m: true` kế thừa.
- Thông tin xác thực Anthropic hiện tại không đủ điều kiện cho sử dụng ngữ cảnh dài.
- Yêu cầu chỉ thất bại trên các phiên/lần chạy mô hình dài cần đường dẫn ngữ cảnh 1M.

Tùy chọn khắc phục:

<Steps>
  <Step title="Dùng cửa sổ ngữ cảnh tiêu chuẩn">
    Chuyển sang mô hình cửa sổ tiêu chuẩn, hoặc xóa `context1m` kế thừa khỏi cấu hình
    mô hình cũ hơn không có khả năng GA cho ngữ cảnh 1M.
  </Step>
  <Step title="Dùng thông tin xác thực đủ điều kiện">
    Dùng thông tin xác thực Anthropic đủ điều kiện cho yêu cầu ngữ cảnh dài, hoặc chuyển sang khóa API Anthropic.
  </Step>
  <Step title="Cấu hình mô hình fallback">
    Cấu hình mô hình fallback để các lần chạy tiếp tục khi yêu cầu ngữ cảnh dài của Anthropic bị từ chối.
  </Step>
</Steps>

Liên quan:

- [Anthropic](/vi/providers/anthropic)
- [Mức dùng token và chi phí](/vi/reference/token-use)
- [Vì sao tôi thấy HTTP 429 từ Anthropic?](/vi/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## Phản hồi 403 bị chặn từ upstream

Dùng phần này khi một provider LLM upstream trả về `403` chung như
`Your request was blocked`.

Đừng giả định đây luôn là vấn đề cấu hình OpenClaw. Phản hồi có thể
đến từ một lớp bảo mật upstream như CDN, WAF, quy tắc quản lý bot, hoặc
reverse proxy phía trước một endpoint tương thích OpenAI.

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
```

Tìm:

- nhiều mô hình dưới cùng một provider thất bại theo cùng một cách
- HTML hoặc văn bản bảo mật chung thay vì lỗi API provider bình thường
- sự kiện bảo mật phía provider cho cùng thời điểm yêu cầu
- một thăm dò `curl` trực tiếp rất nhỏ thành công trong khi các yêu cầu dạng SDK bình thường thất bại

Khắc phục lọc phía provider trước khi bằng chứng chỉ ra một chặn WAF/CDN.
Ưu tiên quy tắc cho phép hoặc bỏ qua có phạm vi hẹp cho đường dẫn API mà OpenClaw
dùng, và tránh tắt bảo vệ cho toàn bộ site.

<Warning>
Một `curl` tối thiểu thành công không đảm bảo các yêu cầu kiểu SDK thực tế sẽ
đi qua cùng lớp bảo mật upstream.
</Warning>

Liên quan:

- [Endpoint tương thích OpenAI](/vi/gateway/configuration-reference#openai-compatible-endpoints)
- [Cấu hình provider](/vi/providers)
- [Nhật ký](/vi/logging)

## Backend cục bộ tương thích OpenAI vượt qua thăm dò trực tiếp nhưng lần chạy agent thất bại

Dùng phần này khi:

- `curl ... /v1/models` hoạt động
- lệnh gọi trực tiếp nhỏ `/v1/chat/completions` hoạt động
- Lần chạy mô hình OpenClaw chỉ thất bại trên lượt agent bình thường

```bash
curl http://127.0.0.1:1234/v1/models
curl http://127.0.0.1:1234/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"<id>","messages":[{"role":"user","content":"hi"}],"stream":false}'
openclaw infer model run --model <provider/model> --prompt "hi" --json
openclaw logs --follow
```

Tìm:

- các lệnh gọi nhỏ trực tiếp thành công, nhưng lần chạy OpenClaw chỉ thất bại trên prompt lớn hơn
- lỗi `model_not_found` hoặc 404 dù `/v1/chat/completions` trực tiếp
  hoạt động với cùng id mô hình trần
- lỗi backend về việc `messages[].content` mong đợi một chuỗi
- cảnh báo `incomplete turn detected ... stopReason=stop payloads=0` ngắt quãng với backend cục bộ tương thích OpenAI
- backend crash chỉ xuất hiện với số lượng token prompt lớn hơn hoặc prompt runtime agent đầy đủ

<AccordionGroup>
  <Accordion title="Dấu hiệu thường gặp">
    - `model_not_found` với máy chủ kiểu MLX/vLLM cục bộ → xác minh `baseUrl` bao gồm `/v1`, `api` là `"openai-completions"` cho backend `/v1/chat/completions`, và `models.providers.<provider>.models[].id` là id cục bộ của provider dạng trần. Chọn nó với tiền tố provider một lần, ví dụ `mlx/mlx-community/Qwen3-30B-A3B-6bit`; giữ mục catalog là `mlx-community/Qwen3-30B-A3B-6bit`.
    - `messages[...].content: invalid type: sequence, expected a string` → backend từ chối các phần nội dung Chat Completions có cấu trúc. Cách khắc phục: đặt `models.providers.<provider>.models[].compat.requiresStringContent: true`.
    - `validation.keys` hoặc các khóa tin nhắn được phép như `["role","content"]` → backend từ chối metadata phát lại kiểu OpenAI trên tin nhắn Chat Completions. Cách khắc phục: đặt `models.providers.<provider>.models[].compat.strictMessageKeys: true`.
    - `incomplete turn detected ... stopReason=stop payloads=0` → backend đã hoàn tất yêu cầu Chat Completions nhưng không trả về văn bản trợ lý hiển thị cho người dùng cho lượt đó. OpenClaw thử lại các lượt trống tương thích OpenAI an toàn khi phát lại một lần; lỗi dai dẳng thường nghĩa là backend đang phát nội dung trống/không phải văn bản hoặc chặn văn bản câu trả lời cuối cùng.
    - yêu cầu nhỏ trực tiếp thành công, nhưng lần chạy agent OpenClaw thất bại với crash backend/mô hình (ví dụ Gemma trên một số bản dựng `inferrs`) → truyền tải OpenClaw có khả năng đã đúng; backend đang thất bại trên dạng prompt runtime agent lớn hơn.
    - lỗi giảm sau khi tắt công cụ nhưng không biến mất → schema công cụ là một phần áp lực, nhưng vấn đề còn lại vẫn là năng lực mô hình/máy chủ upstream hoặc lỗi backend.

  </Accordion>
  <Accordion title="Tùy chọn khắc phục">
    1. Đặt `compat.requiresStringContent: true` cho backend Chat Completions chỉ nhận chuỗi.
    2. Đặt `compat.strictMessageKeys: true` cho backend Chat Completions nghiêm ngặt chỉ chấp nhận `role` và `content` trên mỗi tin nhắn.
    3. Đặt `compat.supportsTools: false` cho các mô hình/backend không thể xử lý đáng tin cậy bề mặt schema công cụ của OpenClaw.
    4. Giảm áp lực prompt khi có thể: bootstrap workspace nhỏ hơn, lịch sử phiên ngắn hơn, mô hình cục bộ nhẹ hơn, hoặc backend có hỗ trợ ngữ cảnh dài mạnh hơn.
    5. Nếu các yêu cầu nhỏ trực tiếp vẫn thành công trong khi lượt agent OpenClaw vẫn crash bên trong backend, hãy xem đây là giới hạn upstream của máy chủ/mô hình và gửi repro ở đó với dạng payload được chấp nhận.
  </Accordion>
</AccordionGroup>

Liên quan:

- [Cấu hình](/vi/gateway/configuration)
- [Mô hình cục bộ](/vi/gateway/local-models)
- [Điểm cuối tương thích OpenAI](/vi/gateway/configuration-reference#openai-compatible-endpoints)

## Không có phản hồi

Nếu các kênh đang hoạt động nhưng không có gì trả lời, hãy kiểm tra định tuyến và chính sách trước khi kết nối lại bất kỳ thứ gì.

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

Tìm:

- Ghép cặp đang chờ xử lý đối với người gửi DM.
- Chặn theo lượt nhắc trong nhóm (`requireMention`, `mentionPatterns`).
- Không khớp danh sách cho phép của kênh/nhóm.

Dấu hiệu thường gặp:

- `drop guild message (mention required` → tin nhắn nhóm bị bỏ qua cho đến khi có lượt nhắc.
- `pairing request` → người gửi cần được phê duyệt.
- `blocked` / `allowlist` → người gửi/kênh đã bị chính sách lọc.

Liên quan:

- [Khắc phục sự cố kênh](/vi/channels/troubleshooting)
- [Nhóm](/vi/channels/groups)
- [Ghép cặp](/vi/channels/pairing)

## Kết nối giao diện điều khiển bảng điều khiển

Khi bảng điều khiển/giao diện điều khiển không kết nối được, hãy xác thực URL, chế độ xác thực và các giả định về ngữ cảnh an toàn.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

Tìm:

- URL thăm dò và URL bảng điều khiển đúng.
- Không khớp chế độ xác thực/token giữa máy khách và gateway.
- Dùng HTTP ở nơi yêu cầu danh tính thiết bị.

Nếu trình duyệt cục bộ không thể kết nối tới `127.0.0.1:18789` sau khi cập nhật, trước tiên
hãy khôi phục dịch vụ Gateway cục bộ và xác nhận dịch vụ đang phục vụ bảng điều khiển:

```bash
openclaw gateway restart
lsof -i :18789
curl http://127.0.0.1:18789
```

Nếu `curl` trả về HTML của OpenClaw, Gateway đang hoạt động và vấn đề còn lại
có thể là bộ nhớ đệm trình duyệt, liên kết sâu cũ hoặc trạng thái tab lỗi thời. Mở
`http://127.0.0.1:18789` trực tiếp và điều hướng từ bảng điều khiển. Nếu khởi động lại
không giữ dịch vụ tiếp tục chạy, hãy chạy `openclaw gateway start` và kiểm tra lại
`openclaw gateway status`.

<AccordionGroup>
  <Accordion title="Dấu hiệu kết nối / xác thực">
    - `device identity required` → ngữ cảnh không an toàn hoặc thiếu xác thực thiết bị.
    - `origin not allowed` → `Origin` của trình duyệt không nằm trong `gateway.controlUi.allowedOrigins` (hoặc bạn đang kết nối từ origin trình duyệt không phải loopback mà không có danh sách cho phép rõ ràng).
    - `device nonce required` / `device nonce mismatch` → máy khách chưa hoàn tất luồng xác thực thiết bị dựa trên thử thách (`connect.challenge` + `device.nonce`).
    - `device signature invalid` / `device signature expired` → máy khách đã ký sai payload (hoặc dấu thời gian lỗi thời) cho bắt tay hiện tại.
    - `AUTH_TOKEN_MISMATCH` với `canRetryWithDeviceToken=true` → máy khách có thể thực hiện một lần thử lại đáng tin cậy bằng token thiết bị đã lưu trong bộ nhớ đệm.
    - Lần thử lại bằng token đã lưu đó tái sử dụng tập phạm vi đã lưu cùng với token thiết bị đã ghép cặp. Các caller dùng `deviceToken` rõ ràng / `scopes` rõ ràng vẫn giữ tập phạm vi đã yêu cầu của chúng.
    - `AUTH_SCOPE_MISMATCH` → token thiết bị đã được nhận diện, nhưng các phạm vi đã phê duyệt của nó không bao phủ yêu cầu kết nối này; hãy ghép cặp lại hoặc phê duyệt hợp đồng phạm vi được yêu cầu thay vì xoay token gateway dùng chung.
    - Ngoài đường dẫn thử lại đó, thứ tự ưu tiên xác thực kết nối là token/mật khẩu dùng chung rõ ràng trước, sau đó là `deviceToken` rõ ràng, rồi token thiết bị đã lưu, rồi token bootstrap.
    - Trên đường dẫn giao diện điều khiển Tailscale Serve bất đồng bộ, các lần thử thất bại cho cùng `{scope, ip}` được tuần tự hóa trước khi bộ giới hạn ghi nhận lỗi. Vì vậy hai lần thử lại đồng thời không hợp lệ từ cùng máy khách có thể hiển thị `retry later` ở lần thử thứ hai thay vì hai lỗi không khớp thông thường.
    - `too many failed authentication attempts (retry later)` từ máy khách loopback có origin trình duyệt → các lỗi lặp lại từ cùng `Origin` đã chuẩn hóa đó bị khóa tạm thời; origin localhost khác dùng một bucket riêng.
    - lặp lại `unauthorized` sau lần thử lại đó → token dùng chung/token thiết bị bị lệch; làm mới cấu hình token và phê duyệt lại/xoay token thiết bị nếu cần.
    - `gateway connect failed:` → sai đích host/port/url.

  </Accordion>
</AccordionGroup>

### Bản đồ nhanh mã chi tiết xác thực

Dùng `error.details.code` từ phản hồi `connect` thất bại để chọn hành động tiếp theo:

| Mã chi tiết                  | Ý nghĩa                                                                                                                                                                                      | Hành động được khuyến nghị                                                                                                                                                                                                                                                                       |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | Máy khách không gửi token dùng chung bắt buộc.                                                                                                                                                 | Dán/đặt token trong máy khách và thử lại. Với đường dẫn bảng điều khiển: `openclaw config get gateway.auth.token` rồi dán vào cài đặt giao diện điều khiển.                                                                                                                                              |
| `AUTH_TOKEN_MISMATCH`        | Token dùng chung không khớp với token xác thực gateway.                                                                                                                                               | Nếu `canRetryWithDeviceToken=true`, cho phép một lần thử lại đáng tin cậy. Các lần thử lại bằng token đã lưu tái sử dụng phạm vi đã phê duyệt đã lưu; các caller dùng `deviceToken` / `scopes` rõ ràng vẫn giữ phạm vi đã yêu cầu. Nếu vẫn thất bại, chạy [danh sách kiểm tra khôi phục lệch token](/vi/cli/devices#token-drift-recovery-checklist). |
| `AUTH_DEVICE_TOKEN_MISMATCH` | Token theo thiết bị đã lưu bị lỗi thời hoặc đã bị thu hồi.                                                                                                                                                 | Xoay/phê duyệt lại token thiết bị bằng [CLI thiết bị](/vi/cli/devices), rồi kết nối lại.                                                                                                                                                                                                        |
| `AUTH_SCOPE_MISMATCH`        | Token thiết bị hợp lệ, nhưng vai trò/phạm vi đã phê duyệt của nó không bao phủ yêu cầu kết nối này.                                                                                                       | Ghép cặp lại thiết bị hoặc phê duyệt hợp đồng phạm vi được yêu cầu; đừng xử lý việc này như lệch token dùng chung.                                                                                                                                                                                     |
| `PAIRING_REQUIRED`           | Danh tính thiết bị cần được phê duyệt. Kiểm tra `error.details.reason` để biết `not-paired`, `scope-upgrade`, `role-upgrade`, hoặc `metadata-upgrade`, và dùng `requestId` / `remediationHint` khi có. | Phê duyệt yêu cầu đang chờ: `openclaw devices list` rồi `openclaw devices approve <requestId>`. Nâng cấp phạm vi/vai trò dùng cùng luồng sau khi bạn xem xét quyền truy cập được yêu cầu.                                                                                                               |

<Note>
Các RPC backend loopback trực tiếp được xác thực bằng token/mật khẩu gateway dùng chung không nên phụ thuộc vào baseline phạm vi thiết bị đã ghép cặp của CLI. Nếu subagent hoặc các lệnh gọi nội bộ khác vẫn thất bại với `scope-upgrade`, hãy xác minh caller đang dùng `client.id: "gateway-client"` và `client.mode: "backend"` và không ép buộc `deviceIdentity` hoặc token thiết bị rõ ràng.
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
  <Step title="Ký payload">
    Máy khách ký payload gắn với thử thách.
  </Step>
  <Step title="Gửi nonce thiết bị">
    Máy khách gửi `connect.params.device.nonce` với cùng nonce thử thách.
  </Step>
</Steps>

Nếu `openclaw devices rotate` / `revoke` / `remove` bị từ chối ngoài dự kiến:

- các phiên token thiết bị đã ghép cặp chỉ có thể quản lý thiết bị **của chính chúng** trừ khi caller cũng có `operator.admin`
- `openclaw devices rotate --scope ...` chỉ có thể yêu cầu các phạm vi operator mà phiên caller đã có

Liên quan:

- [Cấu hình](/vi/gateway/configuration) (chế độ xác thực gateway)
- [Giao diện điều khiển](/vi/web/control-ui)
- [Thiết bị](/vi/cli/devices)
- [Truy cập từ xa](/vi/gateway/remote)
- [Xác thực proxy tin cậy](/vi/gateway/trusted-proxy-auth)

## Dịch vụ Gateway không chạy

Dùng phần này khi dịch vụ đã được cài đặt nhưng tiến trình không duy trì hoạt động.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # also scan system-level services
```

Tìm:

- `Runtime: stopped` với gợi ý mã thoát.
- Không khớp cấu hình dịch vụ (`Config (cli)` so với `Config (service)`).
- Xung đột cổng/listener.
- Cài đặt launchd/systemd/schtasks bổ sung khi dùng `--deep`.
- Gợi ý dọn dẹp `Other gateway-like services detected (best effort)`.

<AccordionGroup>
  <Accordion title="Dấu hiệu thường gặp">
    - `Gateway start blocked: set gateway.mode=local` hoặc `existing config is missing gateway.mode` → chế độ gateway cục bộ chưa được bật, hoặc tệp cấu hình đã bị ghi đè và mất `gateway.mode`. Cách sửa: đặt `gateway.mode="local"` trong cấu hình của bạn, hoặc chạy lại `openclaw onboard --mode local` / `openclaw setup` để đóng dấu lại cấu hình chế độ cục bộ mong đợi. Nếu bạn đang chạy OpenClaw qua Podman, đường dẫn cấu hình mặc định là `~/.openclaw/openclaw.json`.
    - `refusing to bind gateway ... without auth` → bind không phải loopback mà không có đường dẫn xác thực gateway hợp lệ (token/mật khẩu, hoặc trusted-proxy khi đã cấu hình).
    - `another gateway instance is already listening` / `EADDRINUSE` → xung đột cổng.
    - `Other gateway-like services detected (best effort)` → tồn tại các đơn vị launchd/systemd/schtasks lỗi thời hoặc chạy song song. Hầu hết thiết lập nên giữ một gateway trên mỗi máy; nếu bạn cần nhiều hơn một, hãy cô lập cổng + cấu hình/trạng thái/workspace. Xem [/gateway#multiple-gateways-same-host](/vi/gateway#multiple-gateways-same-host).
    - `System-level OpenClaw gateway service detected` từ doctor → tồn tại một đơn vị hệ thống systemd trong khi dịch vụ cấp người dùng bị thiếu. Gỡ bỏ hoặc vô hiệu hóa bản trùng lặp trước khi cho phép doctor cài đặt dịch vụ người dùng, hoặc đặt `OPENCLAW_SERVICE_REPAIR_POLICY=external` nếu đơn vị hệ thống là supervisor dự kiến.
    - `Gateway service port does not match current gateway config` → supervisor đã cài đặt vẫn ghim `--port` cũ. Chạy `openclaw doctor --fix` hoặc `openclaw gateway install --force`, rồi khởi động lại dịch vụ gateway.

  </Accordion>
</AccordionGroup>

Liên quan:

- [Exec nền và công cụ tiến trình](/vi/gateway/background-process)
- [Cấu hình](/vi/gateway/configuration)
- [Doctor](/vi/gateway/doctor)

## Gateway macOS âm thầm ngừng phản hồi, rồi tiếp tục khi bạn chạm vào bảng điều khiển

Dùng phần này khi các kênh (Telegram, WhatsApp, v.v.) trên máy chủ macOS im lặng trong vài phút đến vài giờ mỗi lần, và gateway có vẻ hoạt động trở lại ngay khi bạn mở giao diện điều khiển, SSH vào, hoặc tương tác với máy chủ theo cách khác. Thường không có triệu chứng rõ ràng trong `openclaw status` vì đến lúc bạn kiểm tra thì gateway đã hoạt động lại.

```bash
ls ~/.openclaw/logs/stability/ | tail -5
openclaw gateway stability --bundle latest
pmset -g log | grep -iE "sleep|wake|maintenance" | tail -50
launchctl print gui/$UID/ai.openclaw.gateway | grep -E "state|last exit|runs"
```

Tìm:

- Một hoặc nhiều gói `*-uncaught_exception.json` trong `~/.openclaw/logs/stability/` có `error.code` được đặt thành mã mạng tạm thời như `ENETDOWN`, `ENETUNREACH`, `EHOSTUNREACH`, hoặc `ECONNREFUSED`.
- Các dòng `pmset -g log` như `Entering Sleep state due to 'Maintenance Sleep'` hoặc `en0 driver is slow (msg: WillChangeState to 0)` khớp với dấu thời gian sự cố. Power Nap / Maintenance Sleep tạm thời đưa trình điều khiển Wi-Fi về trạng thái 0; bất kỳ `connect()` đi ra nào rơi vào khoảng thời gian đó đều có thể lỗi với `ENETDOWN`, ngay cả trên máy chủ vốn có kết nối mạng đầy đủ.
- Đầu ra `launchctl print` hiển thị `state = not running` với nhiều `runs` gần đây và mã thoát, đặc biệt khi khoảng cách giữa sự cố và lần khởi chạy tiếp theo tính bằng khoảng một giờ thay vì vài giây. macOS launchd áp dụng một cổng bảo vệ hồi sinh không được tài liệu hóa sau một loạt sự cố, có thể ngừng tôn trọng `KeepAlive=true` cho đến khi một tác nhân bên ngoài như đăng nhập tương tác, kết nối bảng điều khiển, hoặc `launchctl kickstart` kích hoạt lại nó.

Dấu hiệu thường gặp:

- Một gói ổn định có `error.code` là `ENETDOWN` hoặc mã cùng nhóm, với call stack trỏ vào Node `net` `lookupAndConnect` / `Socket.connect`. OpenClaw `2026.5.26` và mới hơn phân loại các lỗi này là lỗi mạng tạm thời vô hại, nên chúng không còn lan tới trình xử lý uncaught cấp cao nhất; nếu bạn đang dùng bản phát hành cũ hơn, hãy nâng cấp trước.
- Những khoảng lặng dài kết thúc ngay khi bạn kết nối tới Control UI hoặc SSH vào máy chủ: hoạt động người dùng nhìn thấy là thứ kích hoạt lại cổng hồi sinh của launchd, không phải bất kỳ việc gì bảng điều khiển làm với gateway.
- Số `runs` tăng trong ngày mà không có dòng `received SIG*; shutting down` tương ứng trong `~/Library/Logs/openclaw/gateway.log`: tắt sạch sẽ ghi log một tín hiệu; sự cố tạm thời thì không.

Việc cần làm:

1. **Nâng cấp gateway** nếu bạn đang chạy bản phát hành trước `2026.5.26`. Sau khi nâng cấp, các lỗi `ENETDOWN` trong tương lai sẽ được ghi log dưới dạng cảnh báo thay vì chấm dứt tiến trình.
2. **Giảm hoạt động maintenance sleep** trên máy chủ Mac mini / desktop được dùng như máy chủ luôn bật:

   ```bash
   sudo pmset -a sleep 0 disksleep 0 standby 0 powernap 0
   ```

   Điều này giảm đáng kể, nhưng không loại bỏ hoàn toàn, tình trạng driver dao động bên dưới. Hệ thống vẫn có thể thực hiện một số maintenance sleep để duy trì TCP keepalive và mDNS bất kể các cờ này.

3. **Thêm watchdog kiểm tra liveness** để một loạt sự cố trong tương lai nếu bị launchd giữ lại sẽ được phát hiện nhanh:

   ```bash
   # Example launchd-aware liveness check, suitable for a 5-minute cron or LaunchAgent
   state=$(launchctl print gui/$UID/ai.openclaw.gateway 2>/dev/null | awk -F'= ' '/state =/ {print $2; exit}')
   if [ "$state" != "running" ]; then
     launchctl kickstart -k gui/$UID/ai.openclaw.gateway
   fi
   ```

   Mục tiêu là kích hoạt lại cổng hồi sinh từ bên ngoài; chỉ `KeepAlive=true` là không đủ trên macOS sau một loạt sự cố.

Liên quan:

- [Ghi chú nền tảng macOS](/vi/platforms/macos)
- [Ghi log](/vi/logging)
- [Doctor](/vi/gateway/doctor)

## Gateway thoát khi sử dụng nhiều bộ nhớ

Dùng phần này khi Gateway biến mất dưới tải, supervisor báo khởi động lại kiểu OOM, hoặc log nhắc tới `critical memory pressure bundle written`.

```bash
openclaw gateway status --deep
openclaw logs --follow
openclaw gateway stability --bundle latest
openclaw gateway diagnostics export
```

Tìm:

- `Reason: diagnostic.memory.pressure.critical` trong gói ổn định mới nhất.
- `Memory pressure:` với `critical/rss_threshold`, `critical/heap_threshold`, hoặc `critical/rss_growth`.
- Các giá trị `V8 heap:` gần giới hạn heap.
- Các mục `Largest session files:` như `agents/<agent>/sessions/<session>.jsonl` hoặc `sessions/<session>.jsonl`.
- Bộ đếm bộ nhớ cgroup của Linux khi gateway chạy trong container hoặc dịch vụ bị giới hạn bộ nhớ.

Dấu hiệu thường gặp:

- `critical memory pressure bundle written` xuất hiện ngay trước khi khởi động lại → OpenClaw đã thu thập một gói ổn định trước OOM. Kiểm tra bằng `openclaw gateway stability --bundle latest`.
- `memory pressure: level=critical ... memoryPressureSnapshot=disabled` xuất hiện trong log gateway → OpenClaw đã phát hiện áp lực bộ nhớ nghiêm trọng, nhưng ảnh chụp ổn định trước OOM đang tắt.
- `Largest session files:` trỏ tới một đường dẫn bản ghi đã biên tập rất lớn → giảm lịch sử phiên được giữ lại, kiểm tra mức tăng phiên, hoặc chuyển các bản ghi cũ ra khỏi kho hoạt động trước khi khởi động lại.
- Số byte đã dùng trong `V8 heap:` gần giới hạn heap → giảm áp lực prompt/phiên, giảm công việc đồng thời, hoặc chỉ tăng giới hạn heap của Node sau khi xác nhận workload là dự kiến.
- `Memory pressure: critical/rss_growth` → bộ nhớ tăng nhanh trong một cửa sổ lấy mẫu. Kiểm tra log mới nhất để tìm import lớn, đầu ra công cụ mất kiểm soát, retry lặp lại, hoặc một lô công việc agent đang xếp hàng.
- Áp lực bộ nhớ nghiêm trọng xuất hiện trong log nhưng không có gói nào → đây là mặc định. Đặt `diagnostics.memoryPressureSnapshot: true` để thu thập gói ổn định trước OOM trong các sự kiện áp lực bộ nhớ nghiêm trọng sau này.

Gói ổn định không chứa payload. Nó bao gồm bằng chứng bộ nhớ vận hành và đường dẫn tệp tương đối đã biên tập, không gồm nội dung tin nhắn, body Webhook, thông tin xác thực, token, cookie, hoặc id phiên thô. Đính kèm bản xuất chẩn đoán vào báo cáo lỗi thay vì sao chép log thô.

Liên quan:

- [Sức khỏe Gateway](/vi/gateway/health)
- [Xuất chẩn đoán](/vi/gateway/diagnostics)
- [Phiên](/vi/cli/sessions)

## Gateway từ chối cấu hình không hợp lệ

Dùng phần này khi khởi động Gateway lỗi với `Invalid config` hoặc log hot reload cho biết
nó đã bỏ qua một chỉnh sửa không hợp lệ.

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
- Một tệp `openclaw.json.rejected.*` có dấu thời gian bên cạnh cấu hình đang hoạt động
- Một tệp `openclaw.json.clobbered.*` có dấu thời gian nếu `doctor --fix` đã sửa một chỉnh sửa trực tiếp bị hỏng
- OpenClaw giữ 32 tệp `.clobbered.*` mới nhất cho mỗi đường dẫn cấu hình và xoay vòng các tệp cũ hơn

<AccordionGroup>
  <Accordion title="Điều gì đã xảy ra">
    - Cấu hình không vượt qua xác thực trong lúc khởi động, hot reload, hoặc một lần ghi do OpenClaw sở hữu.
    - Khởi động Gateway fail-closed thay vì ghi lại `openclaw.json`.
    - Hot reload bỏ qua các chỉnh sửa bên ngoài không hợp lệ và giữ cấu hình runtime hiện tại hoạt động.
    - Các lần ghi do OpenClaw sở hữu từ chối payload không hợp lệ/phá hoại trước khi commit và lưu `.rejected.*`.
    - `openclaw doctor --fix` sở hữu việc sửa chữa. Nó có thể xóa tiền tố không phải JSON hoặc khôi phục bản sao last-known-good trong khi vẫn giữ payload bị từ chối dưới dạng `.clobbered.*`.
    - Khi có nhiều lần sửa cho một đường dẫn cấu hình, OpenClaw xoay vòng các tệp `.clobbered.*` cũ hơn để payload đã sửa mới nhất vẫn có sẵn.

  </Accordion>
  <Accordion title="Kiểm tra và sửa">
    ```bash
    CONFIG="$(openclaw config file)"
    ls -lt "$CONFIG".clobbered.* "$CONFIG".rejected.* 2>/dev/null | head
    diff -u "$CONFIG" "$(ls -t "$CONFIG".clobbered.* 2>/dev/null | head -n 1)"
    openclaw config validate
    openclaw doctor
    ```
  </Accordion>
  <Accordion title="Dấu hiệu thường gặp">
    - `.clobbered.*` tồn tại → doctor đã giữ lại một chỉnh sửa bên ngoài bị hỏng trong khi sửa cấu hình đang hoạt động.
    - `.rejected.*` tồn tại → một lần ghi cấu hình do OpenClaw sở hữu đã lỗi kiểm tra schema hoặc clobber trước khi commit.
    - `Config write rejected:` → lần ghi đã cố bỏ mất hình dạng bắt buộc, làm tệp nhỏ đi mạnh, hoặc lưu cấu hình không hợp lệ.
    - `config reload skipped (invalid config):` → một chỉnh sửa trực tiếp lỗi xác thực và bị Gateway đang chạy bỏ qua.
    - `Invalid config at ...` → khởi động lỗi trước khi các dịch vụ Gateway boot.
    - `missing-meta-vs-last-good`, `gateway-mode-missing-vs-last-good`, hoặc `size-drop-vs-last-good:*` → một lần ghi do OpenClaw sở hữu bị từ chối vì mất trường hoặc kích thước so với bản sao lưu last-known-good.
    - `Config last-known-good promotion skipped` → ứng viên chứa placeholder bí mật đã biên tập như `***`.

  </Accordion>
  <Accordion title="Tùy chọn sửa">
    1. Chạy `openclaw doctor --fix` để doctor sửa cấu hình có tiền tố/bị ghi đè hoặc khôi phục last-known-good.
    2. Chỉ sao chép các khóa bạn định dùng từ `.clobbered.*` hoặc `.rejected.*`, rồi áp dụng chúng bằng `openclaw config set` hoặc `config.patch`.
    3. Chạy `openclaw config validate` trước khi khởi động lại.
    4. Nếu bạn chỉnh sửa thủ công, hãy giữ cấu hình JSON5 đầy đủ, không chỉ object một phần mà bạn muốn thay đổi.
  </Accordion>
</AccordionGroup>

Liên quan:

- [Cấu hình](/vi/cli/config)
- [Cấu hình: hot reload](/vi/gateway/configuration#config-hot-reload)
- [Cấu hình: xác thực nghiêm ngặt](/vi/gateway/configuration#strict-validation)
- [Doctor](/vi/gateway/doctor)

## Cảnh báo probe Gateway

Dùng phần này khi `openclaw gateway probe` truy cập được thứ gì đó, nhưng vẫn in một khối cảnh báo.

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

Tìm:

- `warnings[].code` và `primaryTargetId` trong đầu ra JSON.
- Cảnh báo liên quan đến SSH fallback, nhiều gateway, thiếu scope, hay auth ref chưa phân giải.

Dấu hiệu thường gặp:

- `SSH tunnel failed to start; falling back to direct probes.` → thiết lập SSH thất bại, nhưng lệnh vẫn thử các mục tiêu được cấu hình/local loopback trực tiếp.
- `multiple reachable gateway identities detected` → các gateway khác nhau đã trả lời, hoặc OpenClaw không thể chứng minh các mục tiêu truy cập được là cùng một gateway. Một SSH tunnel, URL proxy, hoặc URL từ xa được cấu hình tới cùng gateway được xem là một gateway với nhiều transport, ngay cả khi các cổng transport khác nhau.
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → kết nối hoạt động, nhưng detail RPC bị giới hạn scope; ghép cặp danh tính thiết bị hoặc dùng thông tin xác thực có `operator.read`.
- `Gateway accepted the WebSocket connection, but follow-up read diagnostics failed` → kết nối hoạt động, nhưng toàn bộ tập RPC chẩn đoán đã timeout hoặc thất bại. Xem đây là một Gateway truy cập được với chẩn đoán suy giảm; so sánh `connect.ok` và `connect.rpcOk` trong đầu ra `--json`.
- `Capability: pairing-pending` hoặc `gateway closed (1008): pairing required` → gateway đã trả lời, nhưng client này vẫn cần ghép cặp/phê duyệt trước khi có quyền truy cập operator bình thường.
- văn bản cảnh báo SecretRef `gateway.auth.*` / `gateway.remote.*` chưa phân giải → vật liệu auth không có sẵn trong đường dẫn lệnh này cho mục tiêu thất bại.

Liên quan:

- [Gateway](/vi/cli/gateway)
- [Nhiều gateway trên cùng một máy chủ](/vi/gateway#multiple-gateways-same-host)
- [Truy cập từ xa](/vi/gateway/remote)

## Kênh đã kết nối, tin nhắn không lưu thông

Nếu trạng thái kênh là đã kết nối nhưng luồng tin nhắn bị chết, hãy tập trung vào chính sách, quyền, và quy tắc phân phối riêng của kênh.

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

Tìm:

- Chính sách DM (`pairing`, `allowlist`, `open`, `disabled`).
- Allowlist nhóm và yêu cầu nhắc tên.
- Thiếu quyền/scope API của kênh.

Dấu hiệu thường gặp:

- `mention required` → tin nhắn bị chính sách nhắc tên trong nhóm bỏ qua.
- Dấu vết `pairing` / pending approval → người gửi chưa được phê duyệt.
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → vấn đề auth/quyền của kênh.

Liên quan:

- [Khắc phục sự cố kênh](/vi/channels/troubleshooting)
- [Discord](/vi/channels/discord)
- [Telegram](/vi/channels/telegram)
- [WhatsApp](/vi/channels/whatsapp)

## Phân phối Cron và Heartbeat

Nếu Cron hoặc Heartbeat không chạy hoặc không phân phối, hãy xác minh trạng thái scheduler trước, rồi đến mục tiêu phân phối.

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

Tìm:

- Cron đã bật và có thời điểm đánh thức tiếp theo.
- Trạng thái lịch sử chạy tác vụ (`ok`, `skipped`, `error`).
- Lý do bỏ qua Heartbeat (`quiet-hours`, `requests-in-flight`, `cron-in-progress`, `lanes-busy`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`).

<AccordionGroup>
  <Accordion title="Dấu hiệu thường gặp">
    - `cron: scheduler disabled; jobs will not run automatically` → cron bị tắt.
    - `cron: timer tick failed` → tick của bộ lập lịch thất bại; kiểm tra lỗi tệp/nhật ký/runtime.
    - `heartbeat skipped` với `reason=quiet-hours` → ngoài khung giờ hoạt động.
    - `heartbeat skipped` với `reason=empty-heartbeat-file` → `HEARTBEAT.md` tồn tại nhưng chỉ chứa dòng trống, chú thích, tiêu đề, fence hoặc khung checklist rỗng, nên OpenClaw bỏ qua lệnh gọi mô hình.
    - `heartbeat skipped` với `reason=no-tasks-due` → `HEARTBEAT.md` chứa một khối `tasks:`, nhưng không có tác vụ nào đến hạn trong tick này.
    - `heartbeat: unknown accountId` → id tài khoản không hợp lệ cho đích gửi Heartbeat.
    - `heartbeat skipped` với `reason=dm-blocked` → đích Heartbeat được phân giải thành đích kiểu DM trong khi `agents.defaults.heartbeat.directPolicy` (hoặc ghi đè theo agent) được đặt thành `block`.

  </Accordion>
</AccordionGroup>

Liên quan:

- [Heartbeat](/vi/gateway/heartbeat)
- [Tác vụ đã lên lịch](/vi/automation/cron-jobs)
- [Tác vụ đã lên lịch: khắc phục sự cố](/vi/automation/cron-jobs#troubleshooting)

## Node đã ghép nối, công cụ lỗi

Nếu một node đã ghép nối nhưng công cụ lỗi, hãy cô lập trạng thái foreground, quyền và phê duyệt.

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

Tìm:

- Node trực tuyến với các khả năng mong đợi.
- Các quyền OS đã cấp cho camera/mic/vị trí/màn hình.
- Trạng thái phê duyệt exec và allowlist.

Dấu hiệu thường gặp:

- `NODE_BACKGROUND_UNAVAILABLE` → ứng dụng node phải ở foreground.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → thiếu quyền OS.
- `SYSTEM_RUN_DENIED: approval required` → đang chờ phê duyệt exec.
- `SYSTEM_RUN_DENIED: allowlist miss` → lệnh bị allowlist chặn.

Liên quan:

- [Phê duyệt exec](/vi/tools/exec-approvals)
- [Khắc phục sự cố Node](/vi/nodes/troubleshooting)
- [Node](/vi/nodes/index)

## Công cụ trình duyệt lỗi

Dùng mục này khi thao tác của công cụ trình duyệt thất bại dù bản thân gateway vẫn khỏe.

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

Tìm:

- `plugins.allow` có được đặt và có bao gồm `browser` hay không.
- Đường dẫn thực thi trình duyệt hợp lệ.
- Khả năng truy cập hồ sơ CDP.
- Tính sẵn có của Chrome cục bộ cho các hồ sơ `existing-session` / `user`.

<AccordionGroup>
  <Accordion title="Dấu hiệu Plugin / tệp thực thi">
    - `unknown command "browser"` hoặc `unknown command 'browser'` → Plugin trình duyệt đi kèm bị `plugins.allow` loại trừ.
    - công cụ trình duyệt bị thiếu / không khả dụng trong khi `browser.enabled=true` → `plugins.allow` loại trừ `browser`, nên Plugin không bao giờ được tải.
    - `Failed to start Chrome CDP on port` → tiến trình trình duyệt không khởi chạy được.
    - `browser.executablePath not found` → đường dẫn đã cấu hình không hợp lệ.
    - `browser.cdpUrl must be http(s) or ws(s)` → URL CDP đã cấu hình dùng scheme không được hỗ trợ như `file:` hoặc `ftp:`.
    - `browser.cdpUrl has invalid port` → URL CDP đã cấu hình có cổng sai hoặc nằm ngoài phạm vi.
    - `Playwright is not available in this gateway build; '<feature>' is unsupported.` → bản cài gateway hiện tại thiếu dependency runtime trình duyệt lõi; cài đặt lại hoặc cập nhật OpenClaw, rồi khởi động lại gateway. Ảnh chụp nhanh ARIA và ảnh chụp trang cơ bản vẫn có thể hoạt động, nhưng điều hướng, ảnh chụp nhanh AI, ảnh chụp phần tử bằng CSS selector và xuất PDF vẫn không khả dụng.

  </Accordion>
  <Accordion title="Dấu hiệu Chrome MCP / existing-session">
    - `Could not find DevToolsActivePort for chrome` → Chrome MCP existing-session chưa thể gắn vào thư mục dữ liệu trình duyệt đã chọn. Mở trang inspect của trình duyệt, bật gỡ lỗi từ xa, giữ trình duyệt mở, phê duyệt lời nhắc gắn đầu tiên, rồi thử lại. Nếu không cần trạng thái đã đăng nhập, nên dùng hồ sơ `openclaw` được quản lý.
    - `No Chrome tabs found for profile="user"` → hồ sơ gắn Chrome MCP không có tab Chrome cục bộ nào đang mở.
    - `Remote CDP for profile "<name>" is not reachable` → endpoint CDP từ xa đã cấu hình không truy cập được từ máy chủ gateway.
    - `Browser attachOnly is enabled ... not reachable` hoặc `Browser attachOnly is enabled and CDP websocket ... is not reachable` → hồ sơ chỉ gắn không có đích có thể truy cập, hoặc endpoint HTTP đã phản hồi nhưng CDP WebSocket vẫn không mở được.

  </Accordion>
  <Accordion title="Dấu hiệu phần tử / ảnh chụp màn hình / tải lên">
    - `fullPage is not supported for element screenshots` → yêu cầu ảnh chụp màn hình trộn `--full-page` với `--ref` hoặc `--element`.
    - `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → các lệnh gọi ảnh chụp màn hình Chrome MCP / `existing-session` phải dùng chụp trang hoặc `--ref` từ ảnh chụp nhanh, không dùng CSS `--element`.
    - `existing-session file uploads do not support element selectors; use ref/inputRef.` → hook tải lên Chrome MCP cần ref ảnh chụp nhanh, không phải CSS selector.
    - `existing-session file uploads currently support one file at a time.` → gửi một tệp tải lên mỗi lệnh gọi trên hồ sơ Chrome MCP.
    - `existing-session dialog handling does not support timeoutMs.` → hook hộp thoại trên hồ sơ Chrome MCP không hỗ trợ ghi đè timeout.
    - `existing-session type does not support timeoutMs overrides.` → bỏ `timeoutMs` cho `act:type` trên hồ sơ `profile="user"` / Chrome MCP existing-session, hoặc dùng hồ sơ trình duyệt managed/CDP khi cần timeout tùy chỉnh.
    - `existing-session evaluate does not support timeoutMs overrides.` → bỏ `timeoutMs` cho `act:evaluate` trên hồ sơ `profile="user"` / Chrome MCP existing-session, hoặc dùng hồ sơ trình duyệt managed/CDP khi cần timeout tùy chỉnh.
    - `response body is not supported for existing-session profiles yet.` → `responsebody` vẫn yêu cầu trình duyệt được quản lý hoặc hồ sơ CDP thô.
    - viewport / dark-mode / locale / override offline cũ trên hồ sơ attach-only hoặc CDP từ xa → chạy `openclaw browser stop --browser-profile <name>` để đóng phiên điều khiển đang hoạt động và giải phóng trạng thái mô phỏng Playwright/CDP mà không cần khởi động lại toàn bộ gateway.

  </Accordion>
</AccordionGroup>

Liên quan:

- [Trình duyệt (do OpenClaw quản lý)](/vi/tools/browser)
- [Khắc phục sự cố trình duyệt](/vi/tools/browser-linux-troubleshooting)

## Nếu bạn đã nâng cấp và có thứ đột ngột hỏng

Hầu hết sự cố sau nâng cấp là do drift cấu hình hoặc các mặc định nghiêm ngặt hơn hiện đang được thực thi.

<AccordionGroup>
  <Accordion title="1. Hành vi ghi đè auth và URL đã thay đổi">
    ```bash
    openclaw gateway status
    openclaw config get gateway.mode
    openclaw config get gateway.remote.url
    openclaw config get gateway.auth.mode
    ```

    Cần kiểm tra:

    - Nếu `gateway.mode=remote`, các lệnh gọi CLI có thể đang nhắm tới remote trong khi dịch vụ cục bộ của bạn vẫn ổn.
    - Các lệnh gọi `--url` rõ ràng không fallback về thông tin xác thực đã lưu.

    Dấu hiệu thường gặp:

    - `gateway connect failed:` → sai đích URL.
    - `unauthorized` → endpoint truy cập được nhưng auth sai.

  </Accordion>
  <Accordion title="2. Ràng buộc bind và auth nghiêm ngặt hơn">
    ```bash
    openclaw config get gateway.bind
    openclaw config get gateway.auth.mode
    openclaw config get gateway.auth.token
    openclaw gateway status
    openclaw logs --follow
    ```

    Cần kiểm tra:

    - Bind không phải local loopback (`lan`, `tailnet`, `custom`) cần đường dẫn auth gateway hợp lệ: auth token/mật khẩu dùng chung, hoặc triển khai `trusted-proxy` không phải local loopback được cấu hình đúng.
    - Các khóa cũ như `gateway.token` không thay thế `gateway.auth.token`.

    Dấu hiệu thường gặp:

    - `refusing to bind gateway ... without auth` → bind không phải local loopback nhưng không có đường dẫn auth gateway hợp lệ.
    - `Connectivity probe: failed` trong khi runtime đang chạy → gateway còn sống nhưng không truy cập được với auth/url hiện tại.

  </Accordion>
  <Accordion title="3. Trạng thái ghép nối và định danh thiết bị đã thay đổi">
    ```bash
    openclaw devices list
    openclaw pairing list --channel <channel> [--account <id>]
    openclaw logs --follow
    openclaw doctor
    ```

    Cần kiểm tra:

    - Các phê duyệt thiết bị đang chờ cho dashboard/node.
    - Các phê duyệt ghép nối DM đang chờ sau thay đổi chính sách hoặc định danh.

    Dấu hiệu thường gặp:

    - `device identity required` → chưa thỏa mãn auth thiết bị.
    - `pairing required` → người gửi/thiết bị phải được phê duyệt.

  </Accordion>
</AccordionGroup>

Nếu cấu hình dịch vụ và runtime vẫn không khớp sau khi kiểm tra, hãy cài đặt lại metadata dịch vụ từ cùng thư mục hồ sơ/trạng thái:

```bash
openclaw gateway install --force
openclaw gateway restart
```

Liên quan:

- [Xác thực](/vi/gateway/authentication)
- [Exec nền và công cụ tiến trình](/vi/gateway/background-process)
- [Ghép nối do Gateway sở hữu](/vi/gateway/pairing)

## Liên quan

- [Doctor](/vi/gateway/doctor)
- [FAQ](/vi/help/faq)
- [Runbook Gateway](/vi/gateway)
