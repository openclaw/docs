---
read_when:
    - Trung tâm khắc phục sự cố đã dẫn bạn đến đây để chẩn đoán chuyên sâu hơn
    - Bạn cần các mục cẩm nang vận hành ổn định, dựa trên triệu chứng, với các lệnh chính xác
sidebarTitle: Troubleshooting
summary: Sổ tay xử lý sự cố chuyên sâu cho Gateway, kênh, tự động hóa, nút và trình duyệt
title: Khắc phục sự cố
x-i18n:
    generated_at: "2026-04-29T22:47:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 48735a68daa92678867a9cafb3ceeb37063bb91dee8c4c94e185f74eb0296fcb
    source_path: gateway/troubleshooting.md
    workflow: 16
---

Trang này là runbook chuyên sâu. Bắt đầu tại [/help/troubleshooting](/vi/help/troubleshooting) nếu trước tiên bạn muốn luồng phân loại nhanh.

## Thang lệnh

Chạy các lệnh này trước, theo thứ tự sau:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Các tín hiệu khỏe mạnh kỳ vọng:

- `openclaw gateway status` hiển thị `Runtime: running`, `Connectivity probe: ok`, và một dòng `Capability: ...`.
- `openclaw doctor` báo cáo không có vấn đề cấu hình/dịch vụ nào gây chặn.
- `openclaw channels status --probe` hiển thị trạng thái truyền tải trực tiếp theo từng tài khoản và, nơi được hỗ trợ, kết quả probe/audit như `works` hoặc `audit ok`.

## Cài đặt split brain và bộ bảo vệ cấu hình mới hơn

Dùng mục này khi dịch vụ Gateway bất ngờ dừng sau khi cập nhật, hoặc log cho thấy một binary `openclaw` cũ hơn phiên bản đã ghi `openclaw.json` gần nhất.

OpenClaw đóng dấu các lần ghi cấu hình bằng `meta.lastTouchedVersion`. Các lệnh chỉ đọc vẫn có thể kiểm tra cấu hình được ghi bởi OpenClaw mới hơn, nhưng các thao tác thay đổi tiến trình và dịch vụ sẽ từ chối tiếp tục từ binary cũ hơn. Các hành động bị chặn bao gồm khởi động, dừng, khởi động lại, gỡ cài đặt dịch vụ Gateway, buộc cài đặt lại dịch vụ, khởi động Gateway ở chế độ dịch vụ, và dọn dẹp cổng bằng `gateway --force`.

```bash
which openclaw
openclaw --version
openclaw gateway status --deep
openclaw config get meta.lastTouchedVersion
```

<Steps>
  <Step title="Fix PATH">
    Sửa `PATH` để `openclaw` trỏ tới bản cài đặt mới hơn, rồi chạy lại hành động.
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
Chỉ dành cho hạ cấp có chủ ý hoặc khôi phục khẩn cấp, đặt `OPENCLAW_ALLOW_OLDER_BINARY_DESTRUCTIVE_ACTIONS=1` cho một lệnh duy nhất. Không đặt biến này trong vận hành bình thường.
</Warning>

## Anthropic 429 yêu cầu mức sử dụng bổ sung cho ngữ cảnh dài

Dùng mục này khi log/lỗi chứa: `HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

Tìm:

- Mô hình Anthropic Opus/Sonnet được chọn có `params.context1m: true`.
- Thông tin xác thực Anthropic hiện tại không đủ điều kiện dùng ngữ cảnh dài.
- Yêu cầu chỉ lỗi trong các phiên/lần chạy mô hình dài cần đường dẫn beta 1M.

Các tùy chọn sửa:

<Steps>
  <Step title="Disable context1m">
    Tắt `context1m` cho mô hình đó để quay về cửa sổ ngữ cảnh thông thường.
  </Step>
  <Step title="Use an eligible credential">
    Dùng thông tin xác thực Anthropic đủ điều kiện cho yêu cầu ngữ cảnh dài, hoặc chuyển sang khóa API Anthropic.
  </Step>
  <Step title="Configure fallback models">
    Cấu hình mô hình dự phòng để các lần chạy tiếp tục khi yêu cầu ngữ cảnh dài của Anthropic bị từ chối.
  </Step>
</Steps>

Liên quan:

- [Anthropic](/vi/providers/anthropic)
- [Mức dùng token và chi phí](/vi/reference/token-use)
- [Tại sao tôi thấy HTTP 429 từ Anthropic?](/vi/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## Backend cục bộ tương thích OpenAI vượt qua probe trực tiếp nhưng lần chạy agent thất bại

Dùng mục này khi:

- `curl ... /v1/models` hoạt động
- các lệnh gọi trực tiếp nhỏ tới `/v1/chat/completions` hoạt động
- các lần chạy mô hình OpenClaw chỉ thất bại ở lượt agent bình thường

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
  hoạt động với cùng bare model id
- lỗi backend về việc `messages[].content` kỳ vọng một chuỗi
- cảnh báo `incomplete turn detected ... stopReason=stop payloads=0` gián đoạn với backend cục bộ tương thích OpenAI
- backend bị crash chỉ xuất hiện với số lượng prompt-token lớn hơn hoặc prompt runtime agent đầy đủ

<AccordionGroup>
  <Accordion title="Common signatures">
    - `model_not_found` với máy chủ cục bộ kiểu MLX/vLLM → xác minh `baseUrl` bao gồm `/v1`, `api` là `"openai-completions"` cho backend `/v1/chat/completions`, và `models.providers.<provider>.models[].id` là bare id cục bộ của provider. Chọn nó với tiền tố provider một lần, ví dụ `mlx/mlx-community/Qwen3-30B-A3B-6bit`; giữ mục danh mục là `mlx-community/Qwen3-30B-A3B-6bit`.
    - `messages[...].content: invalid type: sequence, expected a string` → backend từ chối các phần nội dung Chat Completions có cấu trúc. Cách sửa: đặt `models.providers.<provider>.models[].compat.requiresStringContent: true`.
    - `incomplete turn detected ... stopReason=stop payloads=0` → backend đã hoàn tất yêu cầu Chat Completions nhưng không trả về văn bản assistant hiển thị cho người dùng trong lượt đó. OpenClaw thử lại một lần các lượt trống tương thích OpenAI an toàn khi phát lại; lỗi kéo dài thường nghĩa là backend đang phát nội dung trống/không phải văn bản hoặc chặn văn bản câu trả lời cuối.
    - yêu cầu trực tiếp nhỏ thành công, nhưng lần chạy agent OpenClaw thất bại do crash backend/mô hình (ví dụ Gemma trên một số bản dựng `inferrs`) → khả năng cao transport của OpenClaw đã đúng; backend đang thất bại với hình dạng prompt runtime agent lớn hơn.
    - lỗi giảm sau khi tắt tool nhưng không biến mất → schema tool là một phần áp lực, nhưng vấn đề còn lại vẫn nằm ở dung lượng mô hình/máy chủ upstream hoặc lỗi backend.

  </Accordion>
  <Accordion title="Fix options">
    1. Đặt `compat.requiresStringContent: true` cho backend Chat Completions chỉ nhận chuỗi.
    2. Đặt `compat.supportsTools: false` cho các mô hình/backend không thể xử lý ổn định bề mặt schema tool của OpenClaw.
    3. Giảm áp lực prompt khi có thể: bootstrap workspace nhỏ hơn, lịch sử phiên ngắn hơn, mô hình cục bộ nhẹ hơn, hoặc backend có hỗ trợ ngữ cảnh dài mạnh hơn.
    4. Nếu các yêu cầu trực tiếp nhỏ vẫn vượt qua trong khi lượt agent OpenClaw vẫn crash bên trong backend, hãy xem đó là giới hạn máy chủ/mô hình upstream và gửi repro ở đó với hình dạng payload được chấp nhận.
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

- Pairing đang chờ cho người gửi DM.
- Chặn theo nhắc đến trong nhóm (`requireMention`, `mentionPatterns`).
- Không khớp allowlist kênh/nhóm.

Chữ ký thường gặp:

- `drop guild message (mention required` → tin nhắn nhóm bị bỏ qua cho đến khi có nhắc đến.
- `pairing request` → người gửi cần được phê duyệt.
- `blocked` / `allowlist` → người gửi/kênh đã bị lọc bởi chính sách.

Liên quan:

- [Khắc phục sự cố kênh](/vi/channels/troubleshooting)
- [Nhóm](/vi/channels/groups)
- [Pairing](/vi/channels/pairing)

## Kết nối UI điều khiển dashboard

Khi dashboard/UI điều khiển không kết nối được, hãy xác thực URL, chế độ xác thực, và các giả định về ngữ cảnh bảo mật.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

Tìm:

- URL probe và URL dashboard chính xác.
- Không khớp chế độ xác thực/token giữa client và gateway.
- Sử dụng HTTP ở nơi yêu cầu danh tính thiết bị.

<AccordionGroup>
  <Accordion title="Connect / auth signatures">
    - `device identity required` → ngữ cảnh không bảo mật hoặc thiếu xác thực thiết bị.
    - `origin not allowed` → `Origin` của trình duyệt không nằm trong `gateway.controlUi.allowedOrigins` (hoặc bạn đang kết nối từ origin trình duyệt không phải loopback mà không có allowlist rõ ràng).
    - `device nonce required` / `device nonce mismatch` → client không hoàn tất luồng xác thực thiết bị dựa trên challenge (`connect.challenge` + `device.nonce`).
    - `device signature invalid` / `device signature expired` → client đã ký sai payload (hoặc timestamp cũ) cho handshake hiện tại.
    - `AUTH_TOKEN_MISMATCH` với `canRetryWithDeviceToken=true` → client có thể thực hiện một lần thử lại đáng tin cậy bằng token thiết bị đã cache.
    - Lần thử lại bằng token đã cache đó dùng lại bộ scope đã cache được lưu cùng token thiết bị đã ghép đôi. Caller dùng `deviceToken` rõ ràng / `scopes` rõ ràng sẽ giữ nguyên bộ scope đã yêu cầu.
    - Ngoài đường dẫn thử lại đó, thứ tự ưu tiên xác thực khi connect là token/password chia sẻ rõ ràng trước, rồi `deviceToken` rõ ràng, rồi token thiết bị đã lưu, rồi token bootstrap.
    - Trên đường dẫn UI điều khiển Tailscale Serve bất đồng bộ, các lần thử thất bại cho cùng `{scope, ip}` được tuần tự hóa trước khi limiter ghi nhận lỗi. Vì vậy, hai lần thử lại sai đồng thời từ cùng client có thể làm lần thử thứ hai trả về `retry later` thay vì hai lỗi không khớp thông thường.
    - `too many failed authentication attempts (retry later)` từ client loopback có origin trình duyệt → các lỗi lặp lại từ cùng `Origin` đã chuẩn hóa đó bị khóa tạm thời; một origin localhost khác dùng bucket riêng.
    - `unauthorized` lặp lại sau lần thử lại đó → token chia sẻ/token thiết bị bị lệch; làm mới cấu hình token và phê duyệt lại/xoay vòng token thiết bị nếu cần.
    - `gateway connect failed:` → sai host/cổng/url đích.

  </Accordion>
</AccordionGroup>

### Bản đồ nhanh mã chi tiết xác thực

Dùng `error.details.code` từ phản hồi `connect` thất bại để chọn hành động tiếp theo:

| Mã chi tiết                  | Ý nghĩa                                                                                                                                                                                      | Hành động khuyến nghị                                                                                                                                                                                                                                                                       |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | Máy khách không gửi token dùng chung bắt buộc.                                                                                                                                                 | Dán/thiết lập token trong máy khách rồi thử lại. Đối với các đường dẫn bảng điều khiển: `openclaw config get gateway.auth.token` rồi dán vào phần cài đặt Control UI.                                                                                                                                              |
| `AUTH_TOKEN_MISMATCH`        | Token dùng chung không khớp với token xác thực Gateway.                                                                                                                                               | Nếu `canRetryWithDeviceToken=true`, cho phép một lần thử lại đáng tin cậy. Các lần thử lại bằng token được lưu trong bộ nhớ đệm sẽ tái sử dụng các phạm vi đã được phê duyệt đã lưu; các bên gọi dùng `deviceToken` / `scopes` rõ ràng sẽ giữ các phạm vi đã yêu cầu. Nếu vẫn thất bại, hãy chạy [danh sách kiểm tra khôi phục lệch token](/vi/cli/devices#token-drift-recovery-checklist). |
| `AUTH_DEVICE_TOKEN_MISMATCH` | Token theo thiết bị đã lưu trong bộ nhớ đệm đã cũ hoặc bị thu hồi.                                                                                                                                                 | Xoay vòng/phê duyệt lại token thiết bị bằng [CLI thiết bị](/vi/cli/devices), rồi kết nối lại.                                                                                                                                                                                                        |
| `PAIRING_REQUIRED`           | Danh tính thiết bị cần được phê duyệt. Kiểm tra `error.details.reason` để biết `not-paired`, `scope-upgrade`, `role-upgrade`, hoặc `metadata-upgrade`, và dùng `requestId` / `remediationHint` khi có. | Phê duyệt yêu cầu đang chờ: `openclaw devices list` rồi `openclaw devices approve <requestId>`. Các nâng cấp phạm vi/vai trò dùng cùng quy trình sau khi bạn xem xét quyền truy cập được yêu cầu.                                                                                                               |

<Note>
Các RPC backend loopback trực tiếp được xác thực bằng token/mật khẩu Gateway dùng chung không nên phụ thuộc vào đường cơ sở phạm vi thiết bị đã ghép đôi của CLI. Nếu subagent hoặc các lệnh gọi nội bộ khác vẫn thất bại với `scope-upgrade`, hãy xác minh bên gọi đang dùng `client.id: "gateway-client"` và `client.mode: "backend"` và không ép buộc `deviceIdentity` hoặc token thiết bị rõ ràng.
</Note>

Kiểm tra di chuyển xác thực thiết bị v2:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

Nếu nhật ký hiển thị lỗi nonce/chữ ký, hãy cập nhật máy khách đang kết nối và xác minh nó:

<Steps>
  <Step title="Wait for connect.challenge">
    Máy khách chờ `connect.challenge` do Gateway phát hành.
  </Step>
  <Step title="Sign the payload">
    Máy khách ký payload được ràng buộc với challenge.
  </Step>
  <Step title="Send the device nonce">
    Máy khách gửi `connect.params.device.nonce` với cùng nonce của challenge.
  </Step>
</Steps>

Nếu `openclaw devices rotate` / `revoke` / `remove` bị từ chối ngoài dự kiến:

- các phiên token thiết bị đã ghép đôi chỉ có thể quản lý thiết bị **của chính chúng** trừ khi bên gọi cũng có `operator.admin`
- `openclaw devices rotate --scope ...` chỉ có thể yêu cầu các phạm vi operator mà phiên của bên gọi đã có

Liên quan:

- [Cấu hình](/vi/gateway/configuration) (chế độ xác thực Gateway)
- [Control UI](/vi/web/control-ui)
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
openclaw gateway status --deep   # cũng quét các dịch vụ cấp hệ thống
```

Tìm:

- `Runtime: stopped` kèm gợi ý mã thoát.
- Cấu hình dịch vụ không khớp (`Config (cli)` so với `Config (service)`).
- Xung đột cổng/trình lắng nghe.
- Các bản cài đặt launchd/systemd/schtasks bổ sung khi dùng `--deep`.
- Gợi ý dọn dẹp `Other gateway-like services detected (best effort)`.

<AccordionGroup>
  <Accordion title="Common signatures">
    - `Gateway start blocked: set gateway.mode=local` hoặc `existing config is missing gateway.mode` → chế độ Gateway cục bộ chưa được bật, hoặc tệp cấu hình đã bị ghi đè và mất `gateway.mode`. Cách sửa: đặt `gateway.mode="local"` trong cấu hình của bạn, hoặc chạy lại `openclaw onboard --mode local` / `openclaw setup` để đóng dấu lại cấu hình chế độ cục bộ mong đợi. Nếu bạn đang chạy OpenClaw qua Podman, đường dẫn cấu hình mặc định là `~/.openclaw/openclaw.json`.
    - `refusing to bind gateway ... without auth` → liên kết không phải loopback mà không có đường dẫn xác thực Gateway hợp lệ (token/mật khẩu, hoặc trusted-proxy khi đã cấu hình).
    - `another gateway instance is already listening` / `EADDRINUSE` → xung đột cổng.
    - `Other gateway-like services detected (best effort)` → tồn tại các đơn vị launchd/systemd/schtasks cũ hoặc song song. Hầu hết thiết lập nên giữ một Gateway trên mỗi máy; nếu bạn thật sự cần nhiều hơn một, hãy tách biệt cổng + cấu hình/trạng thái/workspace. Xem [/gateway#multiple-gateways-same-host](/vi/gateway#multiple-gateways-same-host).
    - `System-level OpenClaw gateway service detected` từ doctor → tồn tại một đơn vị hệ thống systemd trong khi dịch vụ cấp người dùng bị thiếu. Gỡ bỏ hoặc vô hiệu hóa bản trùng lặp trước khi cho phép doctor cài đặt dịch vụ người dùng, hoặc đặt `OPENCLAW_SERVICE_REPAIR_POLICY=external` nếu đơn vị hệ thống là supervisor dự định dùng.
    - `Gateway service port does not match current gateway config` → supervisor đã cài đặt vẫn ghim `--port` cũ. Chạy `openclaw doctor --fix` hoặc `openclaw gateway install --force`, rồi khởi động lại dịch vụ Gateway.

  </Accordion>
</AccordionGroup>

Liên quan:

- [Exec nền và công cụ tiến trình](/vi/gateway/background-process)
- [Cấu hình](/vi/gateway/configuration)
- [Doctor](/vi/gateway/doctor)

## Gateway đã khôi phục cấu hình tốt đã biết gần nhất

Dùng mục này khi Gateway khởi động, nhưng nhật ký cho biết nó đã khôi phục `openclaw.json`.

```bash
openclaw logs --follow
openclaw config file
openclaw config validate
openclaw doctor
```

Tìm:

- `Config auto-restored from last-known-good`
- `gateway: invalid config was restored from last-known-good backup`
- `config reload restored last-known-good config after invalid-config`
- Một tệp `openclaw.json.clobbered.*` có dấu thời gian nằm cạnh cấu hình đang hoạt động
- Một sự kiện hệ thống main-agent bắt đầu bằng `Config recovery warning`

<AccordionGroup>
  <Accordion title="What happened">
    - Cấu hình bị từ chối không vượt qua xác thực trong lúc khởi động hoặc tải lại nóng.
    - OpenClaw đã giữ lại payload bị từ chối dưới dạng `.clobbered.*`.
    - Cấu hình đang hoạt động đã được khôi phục từ bản sao tốt đã biết gần nhất đã được xác thực gần nhất.
    - Lượt main-agent tiếp theo được cảnh báo không viết lại cấu hình bị từ chối một cách mù quáng.
    - Nếu tất cả vấn đề xác thực đều nằm dưới `plugins.entries.<id>...`, OpenClaw sẽ không khôi phục toàn bộ tệp. Các lỗi cục bộ của Plugin vẫn được báo rõ trong khi các cài đặt người dùng không liên quan vẫn nằm trong cấu hình đang hoạt động.

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
    - `.clobbered.*` tồn tại → một chỉnh sửa trực tiếp bên ngoài hoặc lần đọc khi khởi động đã được khôi phục.
    - `.rejected.*` tồn tại → một lần ghi cấu hình do OpenClaw sở hữu đã thất bại ở kiểm tra schema hoặc clobber trước khi commit.
    - `Config write rejected:` → lần ghi đã cố làm mất cấu trúc bắt buộc, thu nhỏ tệp quá mạnh, hoặc lưu cấu hình không hợp lệ.
    - `missing-meta-vs-last-good`, `gateway-mode-missing-vs-last-good`, hoặc `size-drop-vs-last-good:*` → lúc khởi động, tệp hiện tại được xem là đã bị clobber vì mất trường hoặc kích thước so với bản sao lưu tốt đã biết gần nhất.
    - `Config last-known-good promotion skipped` → ứng viên chứa các placeholder bí mật đã bị che như `***`.

  </Accordion>
  <Accordion title="Fix options">
    1. Giữ cấu hình đang hoạt động đã khôi phục nếu nó đúng.
    2. Chỉ sao chép các khóa dự định dùng từ `.clobbered.*` hoặc `.rejected.*`, rồi áp dụng chúng bằng `openclaw config set` hoặc `config.patch`.
    3. Chạy `openclaw config validate` trước khi khởi động lại.
    4. Nếu bạn chỉnh sửa thủ công, hãy giữ cấu hình JSON5 đầy đủ, không chỉ đối tượng một phần mà bạn muốn thay đổi.
  </Accordion>
</AccordionGroup>

Liên quan:

- [Config](/vi/cli/config)
- [Cấu hình: tải lại nóng](/vi/gateway/configuration#config-hot-reload)
- [Cấu hình: xác thực nghiêm ngặt](/vi/gateway/configuration#strict-validation)
- [Doctor](/vi/gateway/doctor)

## Cảnh báo thăm dò Gateway

Dùng mục này khi `openclaw gateway probe` truy cập được thứ gì đó, nhưng vẫn in một khối cảnh báo.

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

Tìm:

- `warnings[].code` và `primaryTargetId` trong đầu ra JSON.
- Cảnh báo có liên quan đến phương án dự phòng SSH, nhiều Gateway, thiếu phạm vi, hoặc tham chiếu xác thực chưa phân giải hay không.

Dấu hiệu phổ biến:

- `SSH tunnel failed to start; falling back to direct probes.` → thiết lập SSH thất bại, nhưng lệnh vẫn thử các mục tiêu đã cấu hình/loopback trực tiếp.
- `multiple reachable gateways detected` → nhiều hơn một mục tiêu đã phản hồi. Thường điều này có nghĩa là thiết lập nhiều Gateway có chủ ý hoặc các trình lắng nghe cũ/trùng lặp.
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → kết nối đã hoạt động, nhưng RPC chi tiết bị giới hạn phạm vi; hãy ghép đôi danh tính thiết bị hoặc dùng thông tin xác thực có `operator.read`.
- `Gateway accepted the WebSocket connection, but follow-up read diagnostics failed` → kết nối đã hoạt động, nhưng toàn bộ bộ RPC chẩn đoán đã hết thời gian chờ hoặc thất bại. Hãy xem đây là một Gateway có thể truy cập được với chẩn đoán bị suy giảm; so sánh `connect.ok` và `connect.rpcOk` trong đầu ra `--json`.
- `Capability: pairing-pending` hoặc `gateway closed (1008): pairing required` → Gateway đã phản hồi, nhưng máy khách này vẫn cần ghép đôi/phê duyệt trước khi có quyền truy cập operator bình thường.
- văn bản cảnh báo SecretRef `gateway.auth.*` / `gateway.remote.*` chưa phân giải → vật liệu xác thực không khả dụng trong đường dẫn lệnh này cho mục tiêu thất bại.

Liên quan:

- [Gateway](/vi/cli/gateway)
- [Nhiều Gateway trên cùng một máy chủ](/vi/gateway#multiple-gateways-same-host)
- [Truy cập từ xa](/vi/gateway/remote)

## Kênh đã kết nối, tin nhắn không luân chuyển

Nếu trạng thái kênh là đã kết nối nhưng luồng tin nhắn đã chết, hãy tập trung vào chính sách, quyền và các quy tắc phân phối riêng của kênh.

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

Dấu hiệu phổ biến:

- `mention required` → tin nhắn bị chính sách nhắc đến nhóm bỏ qua.
- `pairing` / dấu vết đang chờ phê duyệt → người gửi chưa được phê duyệt.
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → vấn đề xác thực/quyền của kênh.

Liên quan:

- [Khắc phục sự cố kênh](/vi/channels/troubleshooting)
- [Discord](/vi/channels/discord)
- [Telegram](/vi/channels/telegram)
- [WhatsApp](/vi/channels/whatsapp)

## Phân phối Cron và Heartbeat

Nếu cron hoặc heartbeat không chạy hoặc không phân phối, hãy xác minh trạng thái bộ lập lịch trước, rồi đến đích phân phối.

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

Cần tìm:

- Cron được bật và có lần đánh thức tiếp theo.
- Trạng thái lịch sử chạy tác vụ (`ok`, `skipped`, `error`).
- Lý do bỏ qua Heartbeat (`quiet-hours`, `requests-in-flight`, `cron-in-progress`, `lanes-busy`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`).

<AccordionGroup>
  <Accordion title="Dấu hiệu thường gặp">
    - `cron: scheduler disabled; jobs will not run automatically` → cron bị tắt.
    - `cron: timer tick failed` → nhịp bộ lập lịch thất bại; kiểm tra lỗi tệp/nhật ký/runtime.
    - `heartbeat skipped` với `reason=quiet-hours` → ngoài khung giờ hoạt động.
    - `heartbeat skipped` với `reason=empty-heartbeat-file` → `HEARTBEAT.md` tồn tại nhưng chỉ chứa dòng trống / tiêu đề markdown, nên OpenClaw bỏ qua lệnh gọi mô hình.
    - `heartbeat skipped` với `reason=no-tasks-due` → `HEARTBEAT.md` chứa khối `tasks:`, nhưng không có tác vụ nào đến hạn ở nhịp này.
    - `heartbeat: unknown accountId` → id tài khoản không hợp lệ cho đích phân phối heartbeat.
    - `heartbeat skipped` với `reason=dm-blocked` → đích heartbeat được phân giải thành đích kiểu DM trong khi `agents.defaults.heartbeat.directPolicy` (hoặc ghi đè theo agent) được đặt thành `block`.

  </Accordion>
</AccordionGroup>

Liên quan:

- [Heartbeat](/vi/gateway/heartbeat)
- [Tác vụ đã lên lịch](/vi/automation/cron-jobs)
- [Tác vụ đã lên lịch: khắc phục sự cố](/vi/automation/cron-jobs#troubleshooting)

## Node đã ghép đôi, công cụ thất bại

Nếu một Node đã được ghép đôi nhưng công cụ thất bại, hãy cô lập trạng thái foreground, quyền và phê duyệt.

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

Cần tìm:

- Node trực tuyến với các khả năng mong đợi.
- Cấp quyền hệ điều hành cho camera/mic/vị trí/màn hình.
- Trạng thái phê duyệt exec và allowlist.

Dấu hiệu thường gặp:

- `NODE_BACKGROUND_UNAVAILABLE` → ứng dụng Node phải ở foreground.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → thiếu quyền hệ điều hành.
- `SYSTEM_RUN_DENIED: approval required` → đang chờ phê duyệt exec.
- `SYSTEM_RUN_DENIED: allowlist miss` → lệnh bị allowlist chặn.

Liên quan:

- [Phê duyệt exec](/vi/tools/exec-approvals)
- [Khắc phục sự cố Node](/vi/nodes/troubleshooting)
- [Nodes](/vi/nodes/index)

## Công cụ trình duyệt thất bại

Dùng mục này khi hành động công cụ trình duyệt thất bại dù bản thân Gateway vẫn khỏe mạnh.

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

Cần tìm:

- `plugins.allow` có được đặt và bao gồm `browser` hay không.
- Đường dẫn tệp thực thi trình duyệt hợp lệ.
- Khả năng tiếp cận hồ sơ CDP.
- Chrome cục bộ có sẵn cho hồ sơ `existing-session` / `user`.

<AccordionGroup>
  <Accordion title="Dấu hiệu Plugin / tệp thực thi">
    - `unknown command "browser"` hoặc `unknown command 'browser'` → Plugin trình duyệt đi kèm bị `plugins.allow` loại trừ.
    - thiếu / không có công cụ trình duyệt trong khi `browser.enabled=true` → `plugins.allow` loại trừ `browser`, nên Plugin không bao giờ được tải.
    - `Failed to start Chrome CDP on port` → tiến trình trình duyệt không khởi chạy được.
    - `browser.executablePath not found` → đường dẫn đã cấu hình không hợp lệ.
    - `browser.cdpUrl must be http(s) or ws(s)` → URL CDP đã cấu hình dùng scheme không được hỗ trợ như `file:` hoặc `ftp:`.
    - `browser.cdpUrl has invalid port` → URL CDP đã cấu hình có cổng sai hoặc ngoài phạm vi.
    - `Playwright is not available in this gateway build; '<feature>' is unsupported.` → bản cài Gateway hiện tại thiếu dependency runtime `playwright-core` của Plugin trình duyệt đi kèm; chạy `openclaw doctor --fix`, rồi khởi động lại Gateway. Ảnh chụp ARIA và ảnh chụp trang cơ bản vẫn có thể hoạt động, nhưng điều hướng, ảnh chụp AI, ảnh chụp phần tử bằng bộ chọn CSS và xuất PDF vẫn không khả dụng.

  </Accordion>
  <Accordion title="Dấu hiệu Chrome MCP / existing-session">
    - `Could not find DevToolsActivePort for chrome` → Chrome MCP existing-session chưa thể gắn vào thư mục dữ liệu trình duyệt đã chọn. Mở trang inspect của trình duyệt, bật remote debugging, giữ trình duyệt mở, phê duyệt lời nhắc gắn đầu tiên, rồi thử lại. Nếu không cần trạng thái đã đăng nhập, hãy ưu tiên hồ sơ `openclaw` do hệ thống quản lý.
    - `No Chrome tabs found for profile="user"` → hồ sơ gắn Chrome MCP không có tab Chrome cục bộ nào đang mở.
    - `Remote CDP for profile "<name>" is not reachable` → điểm cuối CDP từ xa đã cấu hình không thể truy cập được từ máy chủ Gateway.
    - `Browser attachOnly is enabled ... not reachable` hoặc `Browser attachOnly is enabled and CDP websocket ... is not reachable` → hồ sơ chỉ gắn không có đích có thể truy cập, hoặc điểm cuối HTTP đã phản hồi nhưng CDP WebSocket vẫn không mở được.

  </Accordion>
  <Accordion title="Dấu hiệu phần tử / ảnh chụp màn hình / tải lên">
    - `fullPage is not supported for element screenshots` → yêu cầu ảnh chụp màn hình trộn `--full-page` với `--ref` hoặc `--element`.
    - `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → lệnh chụp màn hình Chrome MCP / `existing-session` phải dùng chụp trang hoặc `--ref` từ ảnh chụp, không dùng CSS `--element`.
    - `existing-session file uploads do not support element selectors; use ref/inputRef.` → hook tải lên Chrome MCP cần ref ảnh chụp, không phải bộ chọn CSS.
    - `existing-session file uploads currently support one file at a time.` → gửi một tệp tải lên cho mỗi lệnh gọi trên hồ sơ Chrome MCP.
    - `existing-session dialog handling does not support timeoutMs.` → hook hộp thoại trên hồ sơ Chrome MCP không hỗ trợ ghi đè timeout.
    - `existing-session type does not support timeoutMs overrides.` → bỏ `timeoutMs` cho `act:type` trên hồ sơ `profile="user"` / Chrome MCP existing-session, hoặc dùng hồ sơ trình duyệt managed/CDP khi cần timeout tùy chỉnh.
    - `existing-session evaluate does not support timeoutMs overrides.` → bỏ `timeoutMs` cho `act:evaluate` trên hồ sơ `profile="user"` / Chrome MCP existing-session, hoặc dùng hồ sơ trình duyệt managed/CDP khi cần timeout tùy chỉnh.
    - `response body is not supported for existing-session profiles yet.` → `responsebody` vẫn yêu cầu trình duyệt managed hoặc hồ sơ CDP thô.
    - ghi đè viewport / dark-mode / locale / offline cũ trên hồ sơ attach-only hoặc CDP từ xa → chạy `openclaw browser stop --browser-profile <name>` để đóng phiên điều khiển đang hoạt động và giải phóng trạng thái mô phỏng Playwright/CDP mà không cần khởi động lại toàn bộ Gateway.

  </Accordion>
</AccordionGroup>

Liên quan:

- [Trình duyệt (do OpenClaw quản lý)](/vi/tools/browser)
- [Khắc phục sự cố trình duyệt](/vi/tools/browser-linux-troubleshooting)

## Nếu bạn đã nâng cấp và thứ gì đó đột ngột hỏng

Phần lớn sự cố sau nâng cấp là do config bị lệch hoặc các mặc định nghiêm ngặt hơn nay được thực thi.

<AccordionGroup>
  <Accordion title="1. Hành vi ghi đè xác thực và URL đã thay đổi">
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
    - `unauthorized` → điểm cuối truy cập được nhưng xác thực sai.

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

    - Bind không phải loopback (`lan`, `tailnet`, `custom`) cần đường dẫn xác thực Gateway hợp lệ: xác thực bằng token/mật khẩu dùng chung, hoặc triển khai `trusted-proxy` không phải loopback được cấu hình đúng.
    - Các khóa cũ như `gateway.token` không thay thế `gateway.auth.token`.

    Dấu hiệu thường gặp:

    - `refusing to bind gateway ... without auth` → bind không phải loopback mà không có đường dẫn xác thực Gateway hợp lệ.
    - `Connectivity probe: failed` khi runtime đang chạy → Gateway còn sống nhưng không truy cập được với auth/url hiện tại.

  </Accordion>
  <Accordion title="3. Trạng thái ghép đôi và danh tính thiết bị đã thay đổi">
    ```bash
    openclaw devices list
    openclaw pairing list --channel <channel> [--account <id>]
    openclaw logs --follow
    openclaw doctor
    ```

    Cần kiểm tra:

    - Phê duyệt thiết bị đang chờ cho dashboard/nodes.
    - Phê duyệt ghép đôi DM đang chờ sau khi chính sách hoặc danh tính thay đổi.

    Dấu hiệu thường gặp:

    - `device identity required` → chưa thỏa mãn xác thực thiết bị.
    - `pairing required` → người gửi/thiết bị phải được phê duyệt.

  </Accordion>
</AccordionGroup>

Nếu config dịch vụ và runtime vẫn không khớp sau khi kiểm tra, hãy cài đặt lại metadata dịch vụ từ cùng thư mục hồ sơ/trạng thái:

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
- [FAQ](/vi/help/faq)
- [Runbook Gateway](/vi/gateway)
