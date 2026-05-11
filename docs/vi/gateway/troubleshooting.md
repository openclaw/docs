---
read_when:
    - Trung tâm khắc phục sự cố đã dẫn bạn đến đây để chẩn đoán chuyên sâu hơn
    - Bạn cần các mục sổ tay vận hành ổn định, dựa trên triệu chứng, kèm theo các lệnh chính xác.
sidebarTitle: Troubleshooting
summary: Sổ tay xử lý sự cố chuyên sâu cho Gateway, các kênh, tự động hóa, các Node và trình duyệt
title: Khắc phục sự cố
x-i18n:
    generated_at: "2026-05-11T20:30:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 146a593493ce265da9a24660e8a9fc2effa25cae16cf00bf77cc1f2fec84275d
    source_path: gateway/troubleshooting.md
    workflow: 16
---

Trang này là runbook chuyên sâu. Bắt đầu tại [/help/troubleshooting](/vi/help/troubleshooting) nếu bạn muốn dùng luồng phân loại nhanh trước.

## Bậc thang lệnh

Chạy các lệnh này trước, theo thứ tự này:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Các tín hiệu khỏe mạnh dự kiến:

- `openclaw gateway status` hiển thị `Runtime: running`, `Connectivity probe: ok`, và một dòng `Capability: ...`.
- `openclaw doctor` không báo cáo vấn đề cấu hình/dịch vụ nào mang tính chặn.
- `openclaw channels status --probe` hiển thị trạng thái truyền tải trực tiếp theo từng tài khoản và, ở nơi được hỗ trợ, kết quả probe/audit như `works` hoặc `audit ok`.

## Cài đặt split brain và chốt bảo vệ cấu hình mới hơn

Dùng mục này khi một dịch vụ Gateway bất ngờ dừng sau khi cập nhật, hoặc log cho thấy một binary `openclaw` cũ hơn phiên bản đã ghi `openclaw.json` lần gần nhất.

OpenClaw đóng dấu các lần ghi cấu hình bằng `meta.lastTouchedVersion`. Các lệnh chỉ đọc vẫn có thể kiểm tra cấu hình được ghi bởi OpenClaw mới hơn, nhưng các thay đổi tiến trình và dịch vụ sẽ từ chối tiếp tục từ một binary cũ hơn. Các hành động bị chặn gồm khởi động, dừng, khởi động lại, gỡ cài đặt dịch vụ Gateway, cài đặt lại dịch vụ bắt buộc, khởi động Gateway ở chế độ dịch vụ, và dọn dẹp cổng bằng `gateway --force`.

```bash
which openclaw
openclaw --version
openclaw gateway status --deep
openclaw config get meta.lastTouchedVersion
```

<Steps>
  <Step title="Fix PATH">
    Sửa `PATH` để `openclaw` phân giải tới bản cài đặt mới hơn, rồi chạy lại hành động.
  </Step>
  <Step title="Reinstall the gateway service">
    Cài đặt lại dịch vụ Gateway mong muốn từ bản cài đặt mới hơn:

    ```bash
    openclaw gateway install --force
    openclaw gateway restart
    ```

  </Step>
  <Step title="Remove stale wrappers">
    Gỡ các gói hệ thống cũ hoặc mục wrapper cũ vẫn trỏ tới binary `openclaw` cũ.
  </Step>
</Steps>

<Warning>
Chỉ dùng cho hạ cấp có chủ ý hoặc khôi phục khẩn cấp: đặt `OPENCLAW_ALLOW_OLDER_BINARY_DESTRUCTIVE_ACTIONS=1` cho lệnh duy nhất đó. Để biến này không được đặt trong vận hành bình thường.
</Warning>

## Symlink Skills bị bỏ qua do thoát khỏi đường dẫn

Dùng mục này khi log có:

```text
Skipping escaped skill path outside its configured root: ... reason=symlink-escape
```

OpenClaw xem mỗi thư mục gốc skill là một ranh giới chứa. Một symlink dưới
`~/.agents/skills`, `<workspace>/.agents/skills`, `<workspace>/skills`, hoặc
`~/.openclaw/skills` sẽ bị bỏ qua khi đích thật của nó phân giải ra ngoài thư mục gốc đó
trừ khi đích được tin cậy rõ ràng.

Kiểm tra liên kết:

```bash
ls -l ~/.agents/skills/<name>
realpath ~/.agents/skills/<name>
openclaw config get skills.load
```

Nếu đích là có chủ ý, hãy cấu hình cả thư mục gốc skill trực tiếp và
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

Sau đó bắt đầu một phiên mới hoặc chờ trình theo dõi Skills làm mới. Khởi động lại
Gateway nếu tiến trình đang chạy có trước thay đổi cấu hình.

Không dùng các đích quá rộng như `~`, `/`, hoặc toàn bộ thư mục dự án đã đồng bộ.
Giữ `allowSymlinkTargets` được giới hạn trong thư mục gốc skill thật có chứa các thư mục
`SKILL.md` đáng tin cậy.

Liên quan:

- [Cấu hình Skills](/vi/tools/skills-config#symlinked-sibling-repos)
- [Ví dụ cấu hình](/vi/gateway/configuration-examples#symlinked-sibling-skill-repo)

## Anthropic 429 yêu cầu mức sử dụng bổ sung cho ngữ cảnh dài

Dùng mục này khi log/lỗi có: `HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

Tìm:

- Mô hình Anthropic Opus/Sonnet đã chọn có `params.context1m: true`.
- Thông tin xác thực Anthropic hiện tại không đủ điều kiện sử dụng ngữ cảnh dài.
- Yêu cầu chỉ thất bại trên các phiên/lần chạy mô hình dài cần đường dẫn beta 1M.

Tùy chọn sửa:

<Steps>
  <Step title="Disable context1m">
    Tắt `context1m` cho mô hình đó để quay về cửa sổ ngữ cảnh bình thường.
  </Step>
  <Step title="Use an eligible credential">
    Dùng thông tin xác thực Anthropic đủ điều kiện cho yêu cầu ngữ cảnh dài, hoặc chuyển sang khóa API Anthropic.
  </Step>
  <Step title="Configure fallback models">
    Cấu hình mô hình dự phòng để các lần chạy tiếp tục khi yêu cầu ngữ cảnh dài Anthropic bị từ chối.
  </Step>
</Steps>

Liên quan:

- [Anthropic](/vi/providers/anthropic)
- [Mức dùng token và chi phí](/vi/reference/token-use)
- [Vì sao tôi thấy HTTP 429 từ Anthropic?](/vi/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## Backend cục bộ tương thích OpenAI vượt qua probe trực tiếp nhưng lần chạy agent thất bại

Dùng mục này khi:

- `curl ... /v1/models` hoạt động
- các lệnh gọi trực tiếp nhỏ tới `/v1/chat/completions` hoạt động
- các lần chạy mô hình OpenClaw chỉ thất bại trong lượt agent bình thường

```bash
curl http://127.0.0.1:1234/v1/models
curl http://127.0.0.1:1234/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"<id>","messages":[{"role":"user","content":"hi"}],"stream":false}'
openclaw infer model run --model <provider/model> --prompt "hi" --json
openclaw logs --follow
```

Tìm:

- các lệnh gọi trực tiếp nhỏ thành công, nhưng lần chạy OpenClaw chỉ thất bại với prompt lớn hơn
- lỗi `model_not_found` hoặc 404 dù `/v1/chat/completions` trực tiếp
  hoạt động với cùng id mô hình trần
- lỗi backend về việc `messages[].content` mong đợi một chuỗi
- cảnh báo ngắt quãng `incomplete turn detected ... stopReason=stop payloads=0` với backend cục bộ tương thích OpenAI
- backend sập chỉ xuất hiện với số lượng token prompt lớn hơn hoặc prompt runtime agent đầy đủ

<AccordionGroup>
  <Accordion title="Common signatures">
    - `model_not_found` với máy chủ cục bộ kiểu MLX/vLLM → xác minh `baseUrl` có bao gồm `/v1`, `api` là `"openai-completions"` cho các backend `/v1/chat/completions`, và `models.providers.<provider>.models[].id` là id cục bộ của provider ở dạng trần. Chọn nó với tiền tố provider một lần, ví dụ `mlx/mlx-community/Qwen3-30B-A3B-6bit`; giữ mục catalog là `mlx-community/Qwen3-30B-A3B-6bit`.
    - `messages[...].content: invalid type: sequence, expected a string` → backend từ chối các phần nội dung Chat Completions có cấu trúc. Cách sửa: đặt `models.providers.<provider>.models[].compat.requiresStringContent: true`.
    - `validation.keys` hoặc các khóa thông điệp được phép như `["role","content"]` → backend từ chối metadata phát lại kiểu OpenAI trên thông điệp Chat Completions. Cách sửa: đặt `models.providers.<provider>.models[].compat.strictMessageKeys: true`.
    - `incomplete turn detected ... stopReason=stop payloads=0` → backend đã hoàn tất yêu cầu Chat Completions nhưng không trả về văn bản assistant hiển thị cho người dùng cho lượt đó. OpenClaw thử lại một lần các lượt trống tương thích OpenAI có thể phát lại an toàn; lỗi dai dẳng thường có nghĩa là backend đang phát nội dung trống/không phải văn bản hoặc đang chặn văn bản câu trả lời cuối.
    - các yêu cầu trực tiếp nhỏ thành công, nhưng lần chạy agent OpenClaw thất bại do backend/mô hình sập (ví dụ Gemma trên một số bản dựng `inferrs`) → khả năng cao transport OpenClaw đã đúng; backend đang thất bại trên dạng prompt runtime agent lớn hơn.
    - lỗi giảm sau khi tắt công cụ nhưng không biến mất → schema công cụ là một phần áp lực, nhưng vấn đề còn lại vẫn là dung lượng mô hình/máy chủ upstream hoặc lỗi backend.

  </Accordion>
  <Accordion title="Fix options">
    1. Đặt `compat.requiresStringContent: true` cho các backend Chat Completions chỉ nhận chuỗi.
    2. Đặt `compat.strictMessageKeys: true` cho các backend Chat Completions nghiêm ngặt chỉ chấp nhận `role` và `content` trên mỗi thông điệp.
    3. Đặt `compat.supportsTools: false` cho các mô hình/backend không thể xử lý bề mặt schema công cụ của OpenClaw một cách đáng tin cậy.
    4. Giảm áp lực prompt khi có thể: bootstrap workspace nhỏ hơn, lịch sử phiên ngắn hơn, mô hình cục bộ nhẹ hơn, hoặc backend có hỗ trợ ngữ cảnh dài mạnh hơn.
    5. Nếu các yêu cầu trực tiếp nhỏ vẫn thành công trong khi lượt agent OpenClaw vẫn sập bên trong backend, hãy xem đó là giới hạn máy chủ/mô hình upstream và gửi repro ở đó với dạng payload được chấp nhận.
  </Accordion>
</AccordionGroup>

Liên quan:

- [Cấu hình](/vi/gateway/configuration)
- [Mô hình cục bộ](/vi/gateway/local-models)
- [Endpoint tương thích OpenAI](/vi/gateway/configuration-reference#openai-compatible-endpoints)

## Không có phản hồi

Nếu các kênh đang hoạt động nhưng không có gì trả lời, hãy kiểm tra định tuyến và chính sách trước khi kết nối lại bất cứ thứ gì.

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

Tìm:

- Ghép cặp đang chờ cho người gửi DM.
- Chặn theo lượt nhắc trong nhóm (`requireMention`, `mentionPatterns`).
- Allowlist kênh/nhóm không khớp.

Chữ ký thường gặp:

- `drop guild message (mention required` → tin nhắn nhóm bị bỏ qua cho đến khi được nhắc.
- `pairing request` → người gửi cần được phê duyệt.
- `blocked` / `allowlist` → người gửi/kênh đã bị chính sách lọc.

Liên quan:

- [Khắc phục sự cố kênh](/vi/channels/troubleshooting)
- [Nhóm](/vi/channels/groups)
- [Ghép cặp](/vi/channels/pairing)

## Kết nối giao diện điều khiển dashboard

Khi giao diện dashboard/điều khiển không kết nối được, hãy xác thực URL, chế độ xác thực và giả định ngữ cảnh bảo mật.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

Tìm:

- URL probe và URL dashboard đúng.
- Chế độ xác thực/token không khớp giữa client và Gateway.
- Dùng HTTP ở nơi yêu cầu danh tính thiết bị.

<AccordionGroup>
  <Accordion title="Connect / auth signatures">
    - `device identity required` → ngữ cảnh không bảo mật hoặc thiếu xác thực thiết bị.
    - `origin not allowed` → `Origin` của trình duyệt không nằm trong `gateway.controlUi.allowedOrigins` (hoặc bạn đang kết nối từ origin trình duyệt không phải loopback mà không có allowlist rõ ràng).
    - `device nonce required` / `device nonce mismatch` → client không hoàn tất luồng xác thực thiết bị dựa trên thử thách (`connect.challenge` + `device.nonce`).
    - `device signature invalid` / `device signature expired` → client đã ký sai payload (hoặc timestamp cũ) cho handshake hiện tại.
    - `AUTH_TOKEN_MISMATCH` với `canRetryWithDeviceToken=true` → client có thể thực hiện một lần thử lại đáng tin cậy bằng token thiết bị đã lưu cache.
    - Lần thử lại bằng token đã lưu cache đó tái sử dụng tập phạm vi đã lưu trong cache cùng với token thiết bị đã ghép cặp. Các caller `deviceToken` rõ ràng / `scopes` rõ ràng vẫn giữ tập phạm vi đã yêu cầu.
    - `AUTH_SCOPE_MISMATCH` → token thiết bị đã được nhận diện, nhưng các phạm vi đã phê duyệt của nó không bao phủ yêu cầu kết nối này; hãy ghép cặp lại hoặc phê duyệt hợp đồng phạm vi được yêu cầu thay vì xoay vòng token Gateway dùng chung.
    - Ngoài đường dẫn thử lại đó, thứ tự ưu tiên xác thực kết nối là token dùng chung/mật khẩu rõ ràng trước, rồi `deviceToken` rõ ràng, rồi token thiết bị đã lưu, rồi token bootstrap.
    - Trên đường dẫn giao diện điều khiển Tailscale Serve bất đồng bộ, các lần thử thất bại cho cùng `{scope, ip}` được tuần tự hóa trước khi bộ giới hạn ghi nhận thất bại. Vì vậy hai lần thử lại sai đồng thời từ cùng client có thể hiển thị `retry later` ở lần thử thứ hai thay vì hai lỗi không khớp thông thường.
    - `too many failed authentication attempts (retry later)` từ client loopback có origin trình duyệt → các lỗi lặp lại từ cùng `Origin` đã chuẩn hóa đó bị khóa tạm thời; một origin localhost khác dùng bucket riêng.
    - `unauthorized` lặp lại sau lần thử lại đó → token dùng chung/token thiết bị bị lệch; làm mới cấu hình token và phê duyệt lại/xoay vòng token thiết bị nếu cần.
    - `gateway connect failed:` → sai host/cổng/đích URL.

  </Accordion>
</AccordionGroup>

### Bản đồ nhanh mã chi tiết xác thực

Dùng `error.details.code` từ phản hồi `connect` thất bại để chọn hành động tiếp theo:

| Mã chi tiết                 | Ý nghĩa                                                                                                                                                                                      | Hành động được khuyến nghị                                                                                                                                                                                                                                                               |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | Máy khách không gửi token dùng chung bắt buộc.                                                                                                                                               | Dán/đặt token trong máy khách rồi thử lại. Với các đường dẫn bảng điều khiển: `openclaw config get gateway.auth.token`, sau đó dán vào phần cài đặt giao diện Control.                                                                                                                   |
| `AUTH_TOKEN_MISMATCH`        | Token dùng chung không khớp với token xác thực Gateway.                                                                                                                                      | Nếu `canRetryWithDeviceToken=true`, cho phép một lần thử lại đáng tin cậy. Các lần thử lại bằng token đã lưu trong bộ nhớ đệm dùng lại phạm vi đã được phê duyệt đã lưu; bên gọi `deviceToken` / `scopes` rõ ràng giữ nguyên phạm vi được yêu cầu. Nếu vẫn lỗi, chạy [danh sách kiểm tra khôi phục lệch token](/vi/cli/devices#token-drift-recovery-checklist). |
| `AUTH_DEVICE_TOKEN_MISMATCH` | Token theo thiết bị đã lưu trong bộ nhớ đệm đã cũ hoặc bị thu hồi.                                                                                                                           | Xoay vòng/phê duyệt lại token thiết bị bằng [CLI thiết bị](/vi/cli/devices), rồi kết nối lại.                                                                                                                                                                                               |
| `AUTH_SCOPE_MISMATCH`        | Token thiết bị hợp lệ, nhưng vai trò/phạm vi đã được phê duyệt của nó không bao phủ yêu cầu kết nối này.                                                                                    | Ghép đôi lại thiết bị hoặc phê duyệt hợp đồng phạm vi được yêu cầu; không xem đây là lệch token dùng chung.                                                                                                                                                                              |
| `PAIRING_REQUIRED`           | Danh tính thiết bị cần được phê duyệt. Kiểm tra `error.details.reason` để biết `not-paired`, `scope-upgrade`, `role-upgrade` hoặc `metadata-upgrade`, và dùng `requestId` / `remediationHint` khi có. | Phê duyệt yêu cầu đang chờ: `openclaw devices list` rồi `openclaw devices approve <requestId>`. Việc nâng cấp phạm vi/vai trò dùng cùng luồng sau khi bạn xem xét quyền truy cập được yêu cầu.                                                                                         |

<Note>
Các RPC backend loopback trực tiếp được xác thực bằng token/mật khẩu Gateway dùng chung không nên phụ thuộc vào đường cơ sở phạm vi thiết bị đã ghép đôi của CLI. Nếu subagent hoặc các lệnh gọi nội bộ khác vẫn lỗi với `scope-upgrade`, hãy xác minh bên gọi đang dùng `client.id: "gateway-client"` và `client.mode: "backend"` và không ép một `deviceIdentity` rõ ràng hoặc token thiết bị.
</Note>

Kiểm tra di chuyển xác thực thiết bị v2:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

Nếu nhật ký hiển thị lỗi nonce/chữ ký, hãy cập nhật máy khách đang kết nối và xác minh:

<Steps>
  <Step title="Wait for connect.challenge">
    Máy khách chờ `connect.challenge` do Gateway cấp.
  </Step>
  <Step title="Sign the payload">
    Máy khách ký payload gắn với challenge.
  </Step>
  <Step title="Send the device nonce">
    Máy khách gửi `connect.params.device.nonce` với cùng nonce của challenge.
  </Step>
</Steps>

Nếu `openclaw devices rotate` / `revoke` / `remove` bị từ chối ngoài dự kiến:

- các phiên token thiết bị đã ghép đôi chỉ có thể quản lý thiết bị **của chính chúng**, trừ khi bên gọi cũng có `operator.admin`
- `openclaw devices rotate --scope ...` chỉ có thể yêu cầu các phạm vi operator mà phiên của bên gọi đã có

Liên quan:

- [Cấu hình](/vi/gateway/configuration) (chế độ xác thực Gateway)
- [Giao diện Control](/vi/web/control-ui)
- [Thiết bị](/vi/cli/devices)
- [Truy cập từ xa](/vi/gateway/remote)
- [Xác thực proxy đáng tin cậy](/vi/gateway/trusted-proxy-auth)

## Dịch vụ Gateway không chạy

Dùng mục này khi dịch vụ đã được cài đặt nhưng tiến trình không duy trì hoạt động.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # also scan system-level services
```

Tìm:

- `Runtime: stopped` kèm gợi ý mã thoát.
- Sai khớp cấu hình dịch vụ (`Config (cli)` so với `Config (service)`).
- Xung đột cổng/listener.
- Các cài đặt launchd/systemd/schtasks bổ sung khi dùng `--deep`.
- Gợi ý dọn dẹp `Other gateway-like services detected (best effort)`.

<AccordionGroup>
  <Accordion title="Common signatures">
    - `Gateway start blocked: set gateway.mode=local` hoặc `existing config is missing gateway.mode` → chế độ Gateway cục bộ chưa được bật, hoặc tệp cấu hình đã bị ghi đè và mất `gateway.mode`. Cách sửa: đặt `gateway.mode="local"` trong cấu hình của bạn, hoặc chạy lại `openclaw onboard --mode local` / `openclaw setup` để đóng dấu lại cấu hình chế độ cục bộ mong đợi. Nếu bạn đang chạy OpenClaw qua Podman, đường dẫn cấu hình mặc định là `~/.openclaw/openclaw.json`.
    - `refusing to bind gateway ... without auth` → bind không phải loopback mà không có đường dẫn xác thực Gateway hợp lệ (token/mật khẩu, hoặc trusted-proxy khi được cấu hình).
    - `another gateway instance is already listening` / `EADDRINUSE` → xung đột cổng.
    - `Other gateway-like services detected (best effort)` → tồn tại các unit launchd/systemd/schtasks cũ hoặc chạy song song. Hầu hết thiết lập nên giữ một Gateway trên mỗi máy; nếu bạn thật sự cần nhiều hơn một, hãy cô lập cổng + cấu hình/trạng thái/workspace. Xem [/gateway#multiple-gateways-same-host](/vi/gateway#multiple-gateways-same-host).
    - `System-level OpenClaw gateway service detected` từ doctor → tồn tại một system unit systemd trong khi dịch vụ cấp người dùng bị thiếu. Gỡ bỏ hoặc vô hiệu hóa bản trùng lặp trước khi cho phép doctor cài đặt dịch vụ người dùng, hoặc đặt `OPENCLAW_SERVICE_REPAIR_POLICY=external` nếu system unit là supervisor mong muốn.
    - `Gateway service port does not match current gateway config` → supervisor đã cài đặt vẫn ghim `--port` cũ. Chạy `openclaw doctor --fix` hoặc `openclaw gateway install --force`, rồi khởi động lại dịch vụ Gateway.

  </Accordion>
</AccordionGroup>

Liên quan:

- [Thực thi nền và công cụ tiến trình](/vi/gateway/background-process)
- [Cấu hình](/vi/gateway/configuration)
- [Doctor](/vi/gateway/doctor)

## Gateway từ chối cấu hình không hợp lệ

Dùng mục này khi Gateway khởi động thất bại với `Invalid config` hoặc nhật ký tải lại nóng cho biết
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
- Một tệp `openclaw.json.rejected.*` có dấu thời gian nằm cạnh cấu hình đang hoạt động
- Một tệp `openclaw.json.clobbered.*` có dấu thời gian nếu `doctor --fix` đã sửa một chỉnh sửa trực tiếp bị hỏng

<AccordionGroup>
  <Accordion title="What happened">
    - Cấu hình không vượt qua xác thực trong khi khởi động, tải lại nóng, hoặc một lần ghi do OpenClaw sở hữu.
    - Gateway khởi động thất bại đóng kín thay vì ghi lại `openclaw.json`.
    - Tải lại nóng bỏ qua các chỉnh sửa bên ngoài không hợp lệ và giữ cấu hình runtime hiện tại đang hoạt động.
    - Các lần ghi do OpenClaw sở hữu từ chối payload không hợp lệ/phá hủy trước khi commit và lưu `.rejected.*`.
    - `openclaw doctor --fix` sở hữu việc sửa chữa. Nó có thể xóa tiền tố không phải JSON hoặc khôi phục bản sao tốt gần nhất trong khi giữ payload bị từ chối dưới dạng `.clobbered.*`.

  </Accordion>
  <Accordion title="Inspect and repair">
    ```bash
    CONFIG="$(openclaw config file)"
    ls -lt "$CONFIG".clobbered.* "$CONFIG".rejected.* 2>/dev/null | head
    diff -u "$CONFIG" "$(ls -t "$CONFIG".clobbered.* 2>/dev/null | head -n 1)"
    openclaw config validate
    openclaw doctor
    ```
  </Accordion>
  <Accordion title="Common signatures">
    - `.clobbered.*` tồn tại → doctor đã giữ lại một chỉnh sửa bên ngoài bị hỏng trong khi sửa cấu hình đang hoạt động.
    - `.rejected.*` tồn tại → một lần ghi cấu hình do OpenClaw sở hữu đã thất bại ở kiểm tra schema hoặc kiểm tra ghi đè trước khi commit.
    - `Config write rejected:` → lần ghi đã cố loại bỏ hình dạng bắt buộc, thu nhỏ tệp quá mạnh, hoặc lưu cấu hình không hợp lệ.
    - `config reload skipped (invalid config):` → một chỉnh sửa trực tiếp thất bại xác thực và đã bị Gateway đang chạy bỏ qua.
    - `Invalid config at ...` → khởi động thất bại trước khi các dịch vụ Gateway boot.
    - `missing-meta-vs-last-good`, `gateway-mode-missing-vs-last-good` hoặc `size-drop-vs-last-good:*` → một lần ghi do OpenClaw sở hữu đã bị từ chối vì mất trường hoặc kích thước so với bản sao lưu tốt gần nhất.
    - `Config last-known-good promotion skipped` → ứng viên chứa các placeholder bí mật đã được biên tập như `***`.

  </Accordion>
  <Accordion title="Fix options">
    1. Chạy `openclaw doctor --fix` để doctor sửa cấu hình có tiền tố/bị ghi đè hoặc khôi phục bản tốt gần nhất.
    2. Chỉ sao chép các khóa mong muốn từ `.clobbered.*` hoặc `.rejected.*`, rồi áp dụng chúng bằng `openclaw config set` hoặc `config.patch`.
    3. Chạy `openclaw config validate` trước khi khởi động lại.
    4. Nếu bạn chỉnh sửa thủ công, hãy giữ cấu hình JSON5 đầy đủ, không chỉ đối tượng một phần mà bạn muốn thay đổi.
  </Accordion>
</AccordionGroup>

Liên quan:

- [Config](/vi/cli/config)
- [Cấu hình: tải lại nóng](/vi/gateway/configuration#config-hot-reload)
- [Cấu hình: xác thực nghiêm ngặt](/vi/gateway/configuration#strict-validation)
- [Doctor](/vi/gateway/doctor)

## Cảnh báo probe Gateway

Dùng mục này khi `openclaw gateway probe` chạm tới một thứ gì đó, nhưng vẫn in ra một khối cảnh báo.

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

Tìm:

- `warnings[].code` và `primaryTargetId` trong đầu ra JSON.
- Cảnh báo có liên quan đến SSH fallback, nhiều Gateway, thiếu phạm vi, hay auth refs chưa phân giải hay không.

Dấu hiệu phổ biến:

- `SSH tunnel failed to start; falling back to direct probes.` → thiết lập SSH thất bại, nhưng lệnh vẫn thử các mục tiêu trực tiếp đã cấu hình/loopback.
- `multiple reachable gateways detected` → nhiều hơn một mục tiêu đã trả lời. Thường điều này nghĩa là một thiết lập nhiều Gateway có chủ đích hoặc listener cũ/trùng lặp.
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → kết nối hoạt động, nhưng RPC chi tiết bị giới hạn phạm vi; hãy ghép đôi danh tính thiết bị hoặc dùng thông tin xác thực có `operator.read`.
- `Gateway accepted the WebSocket connection, but follow-up read diagnostics failed` → kết nối hoạt động, nhưng toàn bộ tập RPC chẩn đoán đã hết thời gian chờ hoặc thất bại. Xem đây là một Gateway có thể truy cập với chẩn đoán bị suy giảm; so sánh `connect.ok` và `connect.rpcOk` trong đầu ra `--json`.
- `Capability: pairing-pending` hoặc `gateway closed (1008): pairing required` → Gateway đã trả lời, nhưng máy khách này vẫn cần ghép đôi/phê duyệt trước khi có quyền truy cập operator thông thường.
- văn bản cảnh báo SecretRef `gateway.auth.*` / `gateway.remote.*` chưa phân giải → vật liệu xác thực không khả dụng trong đường dẫn lệnh này cho mục tiêu đã thất bại.

Liên quan:

- [Gateway](/vi/cli/gateway)
- [Nhiều gateway trên cùng một máy chủ](/vi/gateway#multiple-gateways-same-host)
- [Truy cập từ xa](/vi/gateway/remote)

## Kênh đã kết nối, tin nhắn không lưu chuyển

Nếu trạng thái kênh là đã kết nối nhưng luồng tin nhắn bị dừng, hãy tập trung vào chính sách, quyền và các quy tắc phân phối riêng của kênh.

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

Tìm:

- Chính sách DM (`pairing`, `allowlist`, `open`, `disabled`).
- Danh sách cho phép nhóm và yêu cầu nhắc tên.
- Thiếu quyền/phạm vi API của kênh.

Dấu hiệu thường gặp:

- `mention required` → tin nhắn bị chính sách nhắc tên trong nhóm bỏ qua.
- Dấu vết `pairing` / đang chờ phê duyệt → người gửi chưa được phê duyệt.
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → vấn đề xác thực/quyền của kênh.

Liên quan:

- [Khắc phục sự cố kênh](/vi/channels/troubleshooting)
- [Discord](/vi/channels/discord)
- [Telegram](/vi/channels/telegram)
- [WhatsApp](/vi/channels/whatsapp)

## Phân phối Cron và Heartbeat

Nếu cron hoặc heartbeat không chạy hoặc không phân phối, trước tiên hãy xác minh trạng thái bộ lập lịch, sau đó đến đích phân phối.

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

Tìm:

- Cron được bật và có lần đánh thức tiếp theo.
- Trạng thái lịch sử chạy tác vụ (`ok`, `skipped`, `error`).
- Lý do bỏ qua Heartbeat (`quiet-hours`, `requests-in-flight`, `cron-in-progress`, `lanes-busy`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`).

<AccordionGroup>
  <Accordion title="Dấu hiệu thường gặp">
    - `cron: scheduler disabled; jobs will not run automatically` → cron bị tắt.
    - `cron: timer tick failed` → nhịp bộ lập lịch thất bại; kiểm tra lỗi tệp/nhật ký/runtime.
    - `heartbeat skipped` với `reason=quiet-hours` → nằm ngoài khung giờ hoạt động.
    - `heartbeat skipped` với `reason=empty-heartbeat-file` → `HEARTBEAT.md` tồn tại nhưng chỉ chứa dòng trống / tiêu đề markdown, nên OpenClaw bỏ qua lệnh gọi mô hình.
    - `heartbeat skipped` với `reason=no-tasks-due` → `HEARTBEAT.md` chứa một khối `tasks:`, nhưng không có tác vụ nào đến hạn trong nhịp này.
    - `heartbeat: unknown accountId` → id tài khoản không hợp lệ cho đích phân phối heartbeat.
    - `heartbeat skipped` với `reason=dm-blocked` → đích heartbeat được phân giải thành đích kiểu DM trong khi `agents.defaults.heartbeat.directPolicy` (hoặc ghi đè theo agent) được đặt thành `block`.

  </Accordion>
</AccordionGroup>

Liên quan:

- [Heartbeat](/vi/gateway/heartbeat)
- [Tác vụ đã lên lịch](/vi/automation/cron-jobs)
- [Tác vụ đã lên lịch: khắc phục sự cố](/vi/automation/cron-jobs#troubleshooting)

## Node đã ghép đôi, công cụ bị lỗi

Nếu một Node đã được ghép đôi nhưng công cụ bị lỗi, hãy cô lập trạng thái tiền cảnh, quyền và phê duyệt.

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

Tìm:

- Node trực tuyến với các khả năng mong đợi.
- Cấp quyền hệ điều hành cho camera/mic/vị trí/màn hình.
- Trạng thái phê duyệt exec và danh sách cho phép.

Dấu hiệu thường gặp:

- `NODE_BACKGROUND_UNAVAILABLE` → ứng dụng Node phải ở tiền cảnh.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → thiếu quyền hệ điều hành.
- `SYSTEM_RUN_DENIED: approval required` → đang chờ phê duyệt exec.
- `SYSTEM_RUN_DENIED: allowlist miss` → lệnh bị danh sách cho phép chặn.

Liên quan:

- [Phê duyệt exec](/vi/tools/exec-approvals)
- [Khắc phục sự cố Node](/vi/nodes/troubleshooting)
- [Node](/vi/nodes/index)

## Công cụ trình duyệt bị lỗi

Dùng mục này khi các thao tác của công cụ trình duyệt thất bại dù bản thân gateway vẫn khỏe mạnh.

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

Tìm:

- `plugins.allow` có được đặt và bao gồm `browser` hay không.
- Đường dẫn thực thi trình duyệt hợp lệ.
- Khả năng truy cập hồ sơ CDP.
- Tính khả dụng của Chrome cục bộ cho hồ sơ `existing-session` / `user`.

<AccordionGroup>
  <Accordion title="Dấu hiệu Plugin / tệp thực thi">
    - `unknown command "browser"` hoặc `unknown command 'browser'` → Plugin trình duyệt đi kèm bị `plugins.allow` loại trừ.
    - thiếu / không có công cụ trình duyệt trong khi `browser.enabled=true` → `plugins.allow` loại trừ `browser`, nên Plugin không bao giờ được tải.
    - `Failed to start Chrome CDP on port` → tiến trình trình duyệt không khởi chạy được.
    - `browser.executablePath not found` → đường dẫn đã cấu hình không hợp lệ.
    - `browser.cdpUrl must be http(s) or ws(s)` → URL CDP đã cấu hình dùng scheme không được hỗ trợ như `file:` hoặc `ftp:`.
    - `browser.cdpUrl has invalid port` → URL CDP đã cấu hình có cổng sai hoặc nằm ngoài phạm vi.
    - `Playwright is not available in this gateway build; '<feature>' is unsupported.` → bản cài đặt gateway hiện tại thiếu phụ thuộc runtime trình duyệt lõi; cài đặt lại hoặc cập nhật OpenClaw, rồi khởi động lại gateway. Ảnh chụp nhanh ARIA và ảnh chụp màn hình trang cơ bản vẫn có thể hoạt động, nhưng điều hướng, ảnh chụp nhanh AI, ảnh chụp phần tử bằng CSS-selector và xuất PDF vẫn không khả dụng.

  </Accordion>
  <Accordion title="Dấu hiệu Chrome MCP / phiên hiện có">
    - `Could not find DevToolsActivePort for chrome` → phiên hiện có của Chrome MCP chưa thể gắn vào thư mục dữ liệu trình duyệt đã chọn. Mở trang kiểm tra trình duyệt, bật gỡ lỗi từ xa, giữ trình duyệt mở, phê duyệt lời nhắc gắn đầu tiên, rồi thử lại. Nếu không cần trạng thái đã đăng nhập, hãy ưu tiên hồ sơ `openclaw` được quản lý.
    - `No Chrome tabs found for profile="user"` → hồ sơ gắn Chrome MCP không có tab Chrome cục bộ nào đang mở.
    - `Remote CDP for profile "<name>" is not reachable` → endpoint CDP từ xa đã cấu hình không thể truy cập từ máy chủ gateway.
    - `Browser attachOnly is enabled ... not reachable` hoặc `Browser attachOnly is enabled and CDP websocket ... is not reachable` → hồ sơ chỉ gắn không có đích có thể truy cập, hoặc endpoint HTTP đã phản hồi nhưng CDP WebSocket vẫn không mở được.

  </Accordion>
  <Accordion title="Dấu hiệu phần tử / ảnh chụp màn hình / tải lên">
    - `fullPage is not supported for element screenshots` → yêu cầu ảnh chụp màn hình đã trộn `--full-page` với `--ref` hoặc `--element`.
    - `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → các lệnh gọi ảnh chụp màn hình Chrome MCP / `existing-session` phải dùng chụp trang hoặc `--ref` từ ảnh chụp nhanh, không dùng CSS `--element`.
    - `existing-session file uploads do not support element selectors; use ref/inputRef.` → hook tải lên Chrome MCP cần ref từ ảnh chụp nhanh, không phải CSS selector.
    - `existing-session file uploads currently support one file at a time.` → gửi một tệp tải lên cho mỗi lệnh gọi trên hồ sơ Chrome MCP.
    - `existing-session dialog handling does not support timeoutMs.` → hook hộp thoại trên hồ sơ Chrome MCP không hỗ trợ ghi đè timeout.
    - `existing-session type does not support timeoutMs overrides.` → bỏ qua `timeoutMs` cho `act:type` trên hồ sơ `profile="user"` / phiên hiện có Chrome MCP, hoặc dùng hồ sơ trình duyệt được quản lý/CDP khi cần timeout tùy chỉnh.
    - `existing-session evaluate does not support timeoutMs overrides.` → bỏ qua `timeoutMs` cho `act:evaluate` trên hồ sơ `profile="user"` / phiên hiện có Chrome MCP, hoặc dùng hồ sơ trình duyệt được quản lý/CDP khi cần timeout tùy chỉnh.
    - `response body is not supported for existing-session profiles yet.` → `responsebody` vẫn yêu cầu trình duyệt được quản lý hoặc hồ sơ CDP thô.
    - ghi đè viewport / dark-mode / locale / offline đã cũ trên hồ sơ chỉ gắn hoặc CDP từ xa → chạy `openclaw browser stop --browser-profile <name>` để đóng phiên điều khiển đang hoạt động và giải phóng trạng thái mô phỏng Playwright/CDP mà không cần khởi động lại toàn bộ gateway.

  </Accordion>
</AccordionGroup>

Liên quan:

- [Trình duyệt (do OpenClaw quản lý)](/vi/tools/browser)
- [Khắc phục sự cố trình duyệt](/vi/tools/browser-linux-troubleshooting)

## Nếu bạn đã nâng cấp và thứ gì đó đột ngột hỏng

Phần lớn sự cố sau nâng cấp là do cấu hình lệch hoặc các mặc định nghiêm ngặt hơn hiện đang được thực thi.

<AccordionGroup>
  <Accordion title="1. Hành vi xác thực và ghi đè URL đã thay đổi">
    ```bash
    openclaw gateway status
    openclaw config get gateway.mode
    openclaw config get gateway.remote.url
    openclaw config get gateway.auth.mode
    ```

    Cần kiểm tra:

    - Nếu `gateway.mode=remote`, các lệnh gọi CLI có thể đang nhắm tới máy từ xa trong khi dịch vụ cục bộ của bạn vẫn ổn.
    - Các lệnh gọi `--url` rõ ràng không quay lui về thông tin xác thực đã lưu.

    Dấu hiệu thường gặp:

    - `gateway connect failed:` → sai đích URL.
    - `unauthorized` → endpoint truy cập được nhưng xác thực sai.

  </Accordion>
  <Accordion title="2. Rào chắn bind và xác thực nghiêm ngặt hơn">
    ```bash
    openclaw config get gateway.bind
    openclaw config get gateway.auth.mode
    openclaw config get gateway.auth.token
    openclaw gateway status
    openclaw logs --follow
    ```

    Cần kiểm tra:

    - Bind không phải loopback (`lan`, `tailnet`, `custom`) cần một đường dẫn xác thực gateway hợp lệ: xác thực bằng token/mật khẩu dùng chung, hoặc triển khai `trusted-proxy` không phải loopback được cấu hình đúng.
    - Các khóa cũ như `gateway.token` không thay thế `gateway.auth.token`.

    Dấu hiệu thường gặp:

    - `refusing to bind gateway ... without auth` → bind không phải loopback mà không có đường dẫn xác thực gateway hợp lệ.
    - `Connectivity probe: failed` trong khi runtime đang chạy → gateway còn sống nhưng không truy cập được với xác thực/url hiện tại.

  </Accordion>
  <Accordion title="3. Trạng thái ghép đôi và danh tính thiết bị đã thay đổi">
    ```bash
    openclaw devices list
    openclaw pairing list --channel <channel> [--account <id>]
    openclaw logs --follow
    openclaw doctor
    ```

    Cần kiểm tra:

    - Các phê duyệt thiết bị đang chờ cho bảng điều khiển/Node.
    - Các phê duyệt ghép đôi DM đang chờ sau thay đổi chính sách hoặc danh tính.

    Dấu hiệu thường gặp:

    - `device identity required` → xác thực thiết bị chưa được đáp ứng.
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
- [Ghép đôi do Gateway sở hữu](/vi/gateway/pairing)

## Liên quan

- [Doctor](/vi/gateway/doctor)
- [Câu hỏi thường gặp](/vi/help/faq)
- [Runbook Gateway](/vi/gateway)
