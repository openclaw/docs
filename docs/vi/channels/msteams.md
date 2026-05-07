---
read_when:
    - Đang phát triển các tính năng kênh Microsoft Teams
summary: Trạng thái hỗ trợ, khả năng và cấu hình của bot Microsoft Teams
title: Microsoft Teams
x-i18n:
    generated_at: "2026-05-07T13:13:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2fa2aff4d957a59f694cf37d9a4e5ad6b7ee18004d84cbaf8d7ac1aa16860090
    source_path: channels/msteams.md
    workflow: 16
---

Trạng thái: văn bản + tệp đính kèm trong tin nhắn trực tiếp được hỗ trợ; gửi tệp trong kênh/nhóm yêu cầu `sharePointSiteId` + quyền Graph (xem [Gửi tệp trong cuộc trò chuyện nhóm](#sending-files-in-group-chats)). Các cuộc thăm dò được gửi qua Adaptive Cards. Các hành động tin nhắn hiển thị rõ `upload-file` cho các lần gửi ưu tiên tệp.

## Plugin đi kèm

Microsoft Teams được phân phối dưới dạng Plugin đi kèm trong các bản phát hành OpenClaw hiện tại, nên không cần cài đặt riêng trong bản dựng đóng gói thông thường.

Nếu bạn đang dùng bản dựng cũ hơn hoặc bản cài đặt tùy chỉnh loại trừ Teams đi kèm, hãy cài trực tiếp gói npm:

```bash
openclaw plugins install @openclaw/msteams
```

Dùng tên gói không kèm phiên bản để theo thẻ phát hành chính thức hiện tại. Chỉ ghim phiên bản chính xác khi bạn cần một bản cài đặt có thể tái lập.

Bản mã nguồn cục bộ (khi chạy từ một kho git):

```bash
openclaw plugins install ./path/to/local/msteams-plugin
```

Chi tiết: [Plugin](/vi/tools/plugin)

## Thiết lập nhanh

[`@microsoft/teams.cli`](https://www.npmjs.com/package/@microsoft/teams.cli) xử lý việc đăng ký bot, tạo bản kê khai và tạo thông tin xác thực bằng một lệnh duy nhất.

**1. Cài đặt và đăng nhập**

```bash
npm install -g @microsoft/teams.cli@preview
teams login
teams status   # verify you're logged in and see your tenant info
```

<Note>
Teams CLI hiện đang ở bản xem trước. Lệnh và cờ lệnh có thể thay đổi giữa các bản phát hành.
</Note>

**2. Khởi động một đường hầm** (Teams không thể truy cập localhost)

Cài đặt và xác thực devtunnel CLI nếu bạn chưa làm ([hướng dẫn bắt đầu](https://learn.microsoft.com/en-us/azure/developer/dev-tunnels/get-started)).

```bash
# One-time setup (persistent URL across sessions):
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# Each dev session:
devtunnel host my-openclaw-bot
# Your endpoint: https://<tunnel-id>.devtunnels.ms/api/messages
```

<Note>
`--allow-anonymous` là bắt buộc vì Teams không thể xác thực với devtunnels. Mỗi yêu cầu bot gửi đến vẫn được Teams SDK tự động xác thực.
</Note>

Các lựa chọn thay thế: `ngrok http 3978` hoặc `tailscale funnel 3978` (nhưng các lựa chọn này có thể đổi URL mỗi phiên).

**3. Tạo ứng dụng**

```bash
teams app create \
  --name "OpenClaw" \
  --endpoint "https://<your-tunnel-url>/api/messages"
```

Lệnh duy nhất này:

- Tạo một ứng dụng Entra ID (Azure AD)
- Tạo một mã bí mật máy khách
- Tạo và tải lên bản kê khai ứng dụng Teams (kèm biểu tượng)
- Đăng ký bot (mặc định do Teams quản lý - không cần gói đăng ký Azure)

Đầu ra sẽ hiển thị `CLIENT_ID`, `CLIENT_SECRET`, `TENANT_ID` và một **ID ứng dụng Teams** - hãy ghi lại các giá trị này cho các bước tiếp theo. Lệnh này cũng đề xuất cài đặt ứng dụng trực tiếp trong Teams.

**4. Cấu hình OpenClaw** bằng thông tin xác thực từ đầu ra:

```json5
{
  channels: {
    msteams: {
      enabled: true,
      appId: "<CLIENT_ID>",
      appPassword: "<CLIENT_SECRET>",
      tenantId: "<TENANT_ID>",
      webhook: { port: 3978, path: "/api/messages" },
    },
  },
}
```

Hoặc dùng trực tiếp các biến môi trường: `MSTEAMS_APP_ID`, `MSTEAMS_APP_PASSWORD`, `MSTEAMS_TENANT_ID`.

**5. Cài đặt ứng dụng trong Teams**

`teams app create` sẽ nhắc bạn cài đặt ứng dụng - chọn "Cài đặt trong Teams". Nếu bạn đã bỏ qua, bạn có thể lấy liên kết sau:

```bash
teams app get <teamsAppId> --install-link
```

**6. Xác minh mọi thứ hoạt động**

```bash
teams app doctor <teamsAppId>
```

Lệnh này chạy chẩn đoán trên đăng ký bot, cấu hình ứng dụng AAD, tính hợp lệ của bản kê khai và thiết lập SSO.

Đối với triển khai môi trường sản xuất, hãy cân nhắc dùng [xác thực liên kết](/vi/channels/msteams#federated-authentication-certificate-plus-managed-identity) (chứng chỉ hoặc danh tính được quản lý) thay cho mã bí mật máy khách.

<Note>
Cuộc trò chuyện nhóm bị chặn theo mặc định (`channels.msteams.groupPolicy: "allowlist"`). Để cho phép trả lời nhóm, hãy đặt `channels.msteams.groupAllowFrom`, hoặc dùng `groupPolicy: "open"` để cho phép bất kỳ thành viên nào (được kiểm soát bằng yêu cầu nhắc đến).
</Note>

## Mục tiêu

- Trao đổi với OpenClaw qua tin nhắn trực tiếp Teams, cuộc trò chuyện nhóm hoặc kênh.
- Giữ định tuyến tất định: phản hồi luôn quay lại đúng kênh nơi chúng đến.
- Mặc định dùng hành vi kênh an toàn (yêu cầu nhắc đến trừ khi cấu hình khác).

## Ghi cấu hình

Theo mặc định, Microsoft Teams được phép ghi các cập nhật cấu hình được kích hoạt bởi `/config set|unset` (yêu cầu `commands.config: true`).

Tắt bằng:

```json5
{
  channels: { msteams: { configWrites: false } },
}
```

## Kiểm soát truy cập (tin nhắn trực tiếp + nhóm)

**Truy cập tin nhắn trực tiếp**

- Mặc định: `channels.msteams.dmPolicy = "pairing"`. Người gửi không xác định bị bỏ qua cho đến khi được phê duyệt.
- `channels.msteams.allowFrom` nên dùng ID đối tượng AAD ổn định.
- Không dựa vào khớp UPN/tên hiển thị cho danh sách cho phép - chúng có thể thay đổi. OpenClaw tắt khớp tên trực tiếp theo mặc định; bật rõ ràng bằng `channels.msteams.dangerouslyAllowNameMatching: true`.
- Trình hướng dẫn có thể phân giải tên thành ID qua Microsoft Graph khi thông tin xác thực cho phép.

**Truy cập nhóm**

- Mặc định: `channels.msteams.groupPolicy = "allowlist"` (bị chặn trừ khi bạn thêm `groupAllowFrom`). Dùng `channels.defaults.groupPolicy` để ghi đè mặc định khi chưa đặt.
- `channels.msteams.groupAllowFrom` kiểm soát người gửi nào có thể kích hoạt trong cuộc trò chuyện nhóm/kênh (dự phòng về `channels.msteams.allowFrom`).
- Đặt `groupPolicy: "open"` để cho phép bất kỳ thành viên nào (mặc định vẫn được kiểm soát bằng yêu cầu nhắc đến).
- Để **không cho phép kênh nào**, đặt `channels.msteams.groupPolicy: "disabled"`.

Ví dụ:

```json5
{
  channels: {
    msteams: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["user@org.com"],
    },
  },
}
```

**Danh sách cho phép Teams + kênh**

- Giới hạn phạm vi trả lời nhóm/kênh bằng cách liệt kê nhóm Teams và kênh trong `channels.msteams.teams`.
- Khóa nên dùng ID cuộc hội thoại Teams ổn định từ liên kết Teams, không dùng tên hiển thị có thể thay đổi.
- Khi `groupPolicy="allowlist"` và có danh sách cho phép nhóm Teams, chỉ các nhóm/kênh đã liệt kê mới được chấp nhận (có yêu cầu nhắc đến).
- Trình hướng dẫn cấu hình chấp nhận các mục `Team/Channel` và lưu chúng cho bạn.
- Khi khởi động, OpenClaw phân giải tên nhóm/kênh và tên trong danh sách cho phép người dùng thành ID (khi quyền Graph cho phép)
  và ghi nhật ký ánh xạ; tên nhóm/kênh chưa phân giải được giữ như đã nhập nhưng mặc định bị bỏ qua khi định tuyến trừ khi bật `channels.msteams.dangerouslyAllowNameMatching: true`.

Ví dụ:

```json5
{
  channels: {
    msteams: {
      groupPolicy: "allowlist",
      teams: {
        "My Team": {
          channels: {
            General: { requireMention: true },
          },
        },
      },
    },
  },
}
```

<details>
<summary><strong>Thiết lập thủ công (không dùng Teams CLI)</strong></summary>

Nếu bạn không thể dùng Teams CLI, bạn có thể thiết lập bot thủ công qua Azure Portal.

### Cách hoạt động

1. Đảm bảo Plugin Microsoft Teams có sẵn (được đi kèm trong các bản phát hành hiện tại).
2. Tạo một **Azure Bot** (ID ứng dụng + mã bí mật + ID đối tượng thuê).
3. Tạo một **gói ứng dụng Teams** tham chiếu bot và bao gồm các quyền RSC bên dưới.
4. Tải lên/cài đặt ứng dụng Teams vào một nhóm (hoặc phạm vi cá nhân cho tin nhắn trực tiếp).
5. Cấu hình `msteams` trong `~/.openclaw/openclaw.json` (hoặc biến môi trường) và khởi động Gateway.
6. Gateway lắng nghe lưu lượng Webhook Bot Framework trên `/api/messages` theo mặc định.

### Bước 1: Tạo Azure Bot

1. Đi tới [Tạo Azure Bot](https://portal.azure.com/#create/Microsoft.AzureBot)
2. Điền tab **Cơ bản**:

   | Trường             | Giá trị                                                     |
   | ------------------ | ----------------------------------------------------------- |
   | **Tên định danh bot** | Tên bot của bạn, ví dụ, `openclaw-msteams` (phải duy nhất) |
   | **Gói đăng ký**    | Chọn gói đăng ký Azure của bạn                              |
   | **Nhóm tài nguyên** | Tạo mới hoặc dùng sẵn có                                   |
   | **Bậc giá**        | **Miễn phí** cho phát triển/kiểm thử                        |
   | **Loại ứng dụng**  | **Một đối tượng thuê** (khuyến nghị - xem ghi chú bên dưới) |
   | **Kiểu tạo**       | **Tạo ID ứng dụng Microsoft mới**                           |

<Warning>
Việc tạo bot đa đối tượng thuê mới đã bị ngừng khuyến nghị sau 2025-07-31. Dùng **Một đối tượng thuê** cho bot mới.
</Warning>

3. Nhấp **Xem lại + tạo** → **Tạo** (đợi ~1-2 phút)

### Bước 2: Lấy thông tin xác thực

1. Đi tới tài nguyên Azure Bot của bạn → **Cấu hình**
2. Sao chép **ID ứng dụng Microsoft** → đây là `appId` của bạn
3. Nhấp **Quản lý mật khẩu** → đi tới Đăng ký ứng dụng
4. Trong **Chứng chỉ & mã bí mật** → **Mã bí mật máy khách mới** → sao chép **Giá trị** → đây là `appPassword` của bạn
5. Đi tới **Tổng quan** → sao chép **ID thư mục (đối tượng thuê)** → đây là `tenantId` của bạn

### Bước 3: Cấu hình điểm cuối nhắn tin

1. Trong Azure Bot → **Cấu hình**
2. Đặt **Điểm cuối nhắn tin** thành URL Webhook của bạn:
   - Môi trường sản xuất: `https://your-domain.com/api/messages`
   - Phát triển cục bộ: Dùng một đường hầm (xem [Phát triển cục bộ](#local-development-tunneling) bên dưới)

### Bước 4: Bật kênh Teams

1. Trong Azure Bot → **Kênh**
2. Nhấp **Microsoft Teams** → Cấu hình → Lưu
3. Chấp nhận Điều khoản dịch vụ

### Bước 5: Tạo bản kê khai ứng dụng Teams

- Bao gồm một mục `bot` với `botId = <App ID>`.
- Phạm vi: `personal`, `team`, `groupChat`.
- `supportsFiles: true` (bắt buộc để xử lý tệp trong phạm vi cá nhân).
- Thêm quyền RSC (xem [Quyền RSC](#current-teams-rsc-permissions-manifest)).
- Tạo biểu tượng: `outline.png` (32x32) và `color.png` (192x192).
- Nén cả ba tệp lại với nhau: `manifest.json`, `outline.png`, `color.png`.

### Bước 6: Cấu hình OpenClaw

```json5
{
  channels: {
    msteams: {
      enabled: true,
      appId: "<APP_ID>",
      appPassword: "<APP_PASSWORD>",
      tenantId: "<TENANT_ID>",
      webhook: { port: 3978, path: "/api/messages" },
    },
  },
}
```

Biến môi trường: `MSTEAMS_APP_ID`, `MSTEAMS_APP_PASSWORD`, `MSTEAMS_TENANT_ID`.

### Bước 7: Chạy Gateway

Kênh Teams tự động khởi động khi Plugin có sẵn và cấu hình `msteams` tồn tại với thông tin xác thực.

</details>

## Xác thực liên kết (chứng chỉ cùng danh tính được quản lý)

> Được thêm trong 2026.4.11

Đối với triển khai môi trường sản xuất, OpenClaw hỗ trợ **xác thực liên kết** như một lựa chọn thay thế an toàn hơn cho mã bí mật máy khách. Có hai phương pháp:

### Tùy chọn A: Xác thực dựa trên chứng chỉ

Dùng chứng chỉ PEM đã đăng ký với đăng ký ứng dụng Entra ID của bạn.

**Thiết lập:**

1. Tạo hoặc lấy chứng chỉ (định dạng PEM kèm khóa riêng).
2. Trong Entra ID → Đăng ký ứng dụng → **Chứng chỉ & mã bí mật** → **Chứng chỉ** → Tải lên chứng chỉ công khai.

**Cấu hình:**

```json5
{
  channels: {
    msteams: {
      enabled: true,
      appId: "<APP_ID>",
      tenantId: "<TENANT_ID>",
      authType: "federated",
      certificatePath: "/path/to/cert.pem",
      webhook: { port: 3978, path: "/api/messages" },
    },
  },
}
```

**Biến môi trường:**

- `MSTEAMS_AUTH_TYPE=federated`
- `MSTEAMS_CERTIFICATE_PATH=/path/to/cert.pem`

### Tùy chọn B: Danh tính được quản lý Azure

Dùng Danh tính được quản lý Azure để xác thực không mật khẩu. Điều này lý tưởng cho các triển khai trên hạ tầng Azure (danh tính khối lượng công việc AKS, App Service, máy ảo Azure) nơi có danh tính được quản lý.

**Cách hoạt động:**

1. Pod/VM của bot có danh tính được quản lý (do hệ thống gán hoặc do người dùng gán).
2. Một **thông tin xác thực danh tính liên kết** liên kết danh tính được quản lý với đăng ký ứng dụng Entra ID.
3. Khi chạy, OpenClaw dùng `@azure/identity` để lấy mã thông báo từ điểm cuối Azure IMDS (`169.254.169.254`).
4. Mã thông báo được chuyển cho Teams SDK để xác thực bot.

**Điều kiện tiên quyết:**

- Hạ tầng Azure đã bật danh tính được quản lý (danh tính khối lượng công việc AKS, App Service, VM)
- Đã tạo thông tin xác thực danh tính liên kết trên đăng ký ứng dụng Entra ID
- Quyền truy cập mạng tới IMDS (`169.254.169.254:80`) từ pod/VM

**Cấu hình (danh tính được quản lý do hệ thống gán):**

```json5
{
  channels: {
    msteams: {
      enabled: true,
      appId: "<APP_ID>",
      tenantId: "<TENANT_ID>",
      authType: "federated",
      useManagedIdentity: true,
      webhook: { port: 3978, path: "/api/messages" },
    },
  },
}
```

**Cấu hình (managed identity do người dùng gán):**

```json5
{
  channels: {
    msteams: {
      enabled: true,
      appId: "<APP_ID>",
      tenantId: "<TENANT_ID>",
      authType: "federated",
      useManagedIdentity: true,
      managedIdentityClientId: "<MI_CLIENT_ID>",
      webhook: { port: 3978, path: "/api/messages" },
    },
  },
}
```

**Biến môi trường:**

- `MSTEAMS_AUTH_TYPE=federated`
- `MSTEAMS_USE_MANAGED_IDENTITY=true`
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID=<client-id>` (chỉ dành cho loại do người dùng gán)

### Thiết lập AKS Workload Identity

Đối với các triển khai AKS sử dụng workload identity:

1. **Bật workload identity** trên cụm AKS của bạn.
2. **Tạo thông tin xác thực danh tính liên kết** trên đăng ký ứng dụng Entra ID:

   ```bash
   az ad app federated-credential create --id <APP_OBJECT_ID> --parameters '{
     "name": "my-bot-workload-identity",
     "issuer": "<AKS_OIDC_ISSUER_URL>",
     "subject": "system:serviceaccount:<NAMESPACE>:<SERVICE_ACCOUNT>",
     "audiences": ["api://AzureADTokenExchange"]
   }'
   ```

3. **Chú thích tài khoản dịch vụ Kubernetes** bằng ID máy khách của ứng dụng:

   ```yaml
   apiVersion: v1
   kind: ServiceAccount
   metadata:
     name: my-bot-sa
     annotations:
       azure.workload.identity/client-id: "<APP_CLIENT_ID>"
   ```

4. **Gắn nhãn pod** để chèn workload identity:

   ```yaml
   metadata:
     labels:
       azure.workload.identity/use: "true"
   ```

5. **Đảm bảo quyền truy cập mạng** tới IMDS (`169.254.169.254`) - nếu dùng NetworkPolicy, hãy thêm quy tắc egress cho phép lưu lượng tới `169.254.169.254/32` trên cổng 80.

### So sánh loại xác thực

| Phương thức           | Cấu hình                                       | Ưu điểm                            | Nhược điểm                                      |
| -------------------- | ---------------------------------------------- | ---------------------------------- | ----------------------------------------------- |
| **Client secret**    | `appPassword`                                  | Thiết lập đơn giản                 | Cần xoay vòng bí mật, kém an toàn hơn           |
| **Certificate**      | `authType: "federated"` + `certificatePath`    | Không có bí mật chia sẻ qua mạng   | Tốn công quản lý chứng chỉ                      |
| **Managed Identity** | `authType: "federated"` + `useManagedIdentity` | Không mật khẩu, không cần quản lý bí mật | Cần hạ tầng Azure                         |

**Hành vi mặc định:** Khi `authType` không được đặt, OpenClaw mặc định dùng xác thực client secret. Các cấu hình hiện có tiếp tục hoạt động mà không cần thay đổi.

## Phát triển cục bộ (tunneling)

Teams không thể truy cập `localhost`. Hãy dùng một đường hầm phát triển cố định để URL của bạn giữ nguyên giữa các phiên:

```bash
# One-time setup:
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# Each dev session:
devtunnel host my-openclaw-bot
```

Các lựa chọn thay thế: `ngrok http 3978` hoặc `tailscale funnel 3978` (URL có thể thay đổi ở mỗi phiên).

Nếu URL đường hầm của bạn thay đổi, hãy cập nhật endpoint:

```bash
teams app update <teamsAppId> --endpoint "https://<new-url>/api/messages"
```

## Kiểm thử Bot

**Chạy chẩn đoán:**

```bash
teams app doctor <teamsAppId>
```

Kiểm tra đăng ký bot, ứng dụng AAD, manifest và cấu hình SSO trong một lượt.

**Gửi tin nhắn kiểm thử:**

1. Cài đặt ứng dụng Teams (dùng liên kết cài đặt từ `teams app get <id> --install-link`)
2. Tìm bot trong Teams và gửi DM
3. Kiểm tra nhật ký gateway để xem hoạt động đến

## Biến môi trường

Thay vào đó, tất cả khóa cấu hình có thể được đặt qua biến môi trường:

- `MSTEAMS_APP_ID`
- `MSTEAMS_APP_PASSWORD`
- `MSTEAMS_TENANT_ID`
- `MSTEAMS_AUTH_TYPE` (tùy chọn: `"secret"` hoặc `"federated"`)
- `MSTEAMS_CERTIFICATE_PATH` (federated + certificate)
- `MSTEAMS_CERTIFICATE_THUMBPRINT` (tùy chọn, không bắt buộc để xác thực)
- `MSTEAMS_USE_MANAGED_IDENTITY` (federated + managed identity)
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID` (chỉ MI do người dùng gán)

## Hành động thông tin thành viên

OpenClaw cung cấp hành động `member-info` dựa trên Graph cho Microsoft Teams để agent và tự động hóa có thể phân giải chi tiết thành viên kênh (tên hiển thị, email, vai trò) trực tiếp từ Microsoft Graph.

Yêu cầu:

- Quyền RSC `Member.Read.Group` (đã có trong manifest được khuyến nghị)
- Đối với tra cứu giữa các team: quyền Graph Application `User.Read.All` với sự đồng ý của quản trị viên

Hành động này được kiểm soát bởi `channels.msteams.actions.memberInfo` (mặc định: bật khi có thông tin xác thực Graph).

## Ngữ cảnh lịch sử

- `channels.msteams.historyLimit` kiểm soát số lượng tin nhắn kênh/nhóm gần đây được đưa vào prompt.
- Dự phòng về `messages.groupChat.historyLimit`. Đặt `0` để tắt (mặc định 50).
- Lịch sử chuỗi đã lấy được lọc theo danh sách cho phép người gửi (`allowFrom` / `groupAllowFrom`), nên việc gieo ngữ cảnh chuỗi chỉ bao gồm tin nhắn từ người gửi được cho phép.
- Ngữ cảnh tệp đính kèm được trích dẫn (`ReplyTo*` lấy từ HTML trả lời của Teams) hiện được truyền nguyên như nhận được.
- Nói cách khác, danh sách cho phép kiểm soát ai có thể kích hoạt agent; hiện nay chỉ các đường dẫn ngữ cảnh bổ sung cụ thể được lọc.
- Lịch sử DM có thể được giới hạn bằng `channels.msteams.dmHistoryLimit` (lượt của người dùng). Ghi đè theo từng người dùng: `channels.msteams.dms["<user_id>"].historyLimit`.

## Quyền Teams RSC hiện tại (manifest)

Đây là các **quyền resourceSpecific hiện có** trong manifest ứng dụng Teams của chúng tôi. Chúng chỉ áp dụng bên trong team/chat nơi ứng dụng được cài đặt.

**Đối với kênh (phạm vi team):**

- `ChannelMessage.Read.Group` (Application) - nhận tất cả tin nhắn kênh mà không cần @mention
- `ChannelMessage.Send.Group` (Application)
- `Member.Read.Group` (Application)
- `Owner.Read.Group` (Application)
- `ChannelSettings.Read.Group` (Application)
- `TeamMember.Read.Group` (Application)
- `TeamSettings.Read.Group` (Application)

**Đối với chat nhóm:**

- `ChatMessage.Read.Chat` (Application) - nhận tất cả tin nhắn chat nhóm mà không cần @mention

Để thêm quyền RSC qua Teams CLI:

```bash
teams app rsc add <teamsAppId> ChannelMessage.Read.Group --type Application
```

## Ví dụ manifest Teams (đã biên tập)

Ví dụ tối thiểu, hợp lệ với các trường bắt buộc. Thay ID và URL.

```json5
{
  $schema: "https://developer.microsoft.com/en-us/json-schemas/teams/v1.23/MicrosoftTeams.schema.json",
  manifestVersion: "1.23",
  version: "1.0.0",
  id: "00000000-0000-0000-0000-000000000000",
  name: { short: "OpenClaw" },
  developer: {
    name: "Your Org",
    websiteUrl: "https://example.com",
    privacyUrl: "https://example.com/privacy",
    termsOfUseUrl: "https://example.com/terms",
  },
  description: { short: "OpenClaw in Teams", full: "OpenClaw in Teams" },
  icons: { outline: "outline.png", color: "color.png" },
  accentColor: "#5B6DEF",
  bots: [
    {
      botId: "11111111-1111-1111-1111-111111111111",
      scopes: ["personal", "team", "groupChat"],
      isNotificationOnly: false,
      supportsCalling: false,
      supportsVideo: false,
      supportsFiles: true,
    },
  ],
  webApplicationInfo: {
    id: "11111111-1111-1111-1111-111111111111",
  },
  authorization: {
    permissions: {
      resourceSpecific: [
        { name: "ChannelMessage.Read.Group", type: "Application" },
        { name: "ChannelMessage.Send.Group", type: "Application" },
        { name: "Member.Read.Group", type: "Application" },
        { name: "Owner.Read.Group", type: "Application" },
        { name: "ChannelSettings.Read.Group", type: "Application" },
        { name: "TeamMember.Read.Group", type: "Application" },
        { name: "TeamSettings.Read.Group", type: "Application" },
        { name: "ChatMessage.Read.Chat", type: "Application" },
      ],
    },
  },
}
```

### Lưu ý về manifest (các trường bắt buộc)

- `bots[].botId` **phải** khớp với Azure Bot App ID.
- `webApplicationInfo.id` **phải** khớp với Azure Bot App ID.
- `bots[].scopes` phải bao gồm các bề mặt bạn định sử dụng (`personal`, `team`, `groupChat`).
- `bots[].supportsFiles: true` là bắt buộc để xử lý tệp trong phạm vi cá nhân.
- `authorization.permissions.resourceSpecific` phải bao gồm quyền đọc/gửi kênh nếu bạn muốn lưu lượng kênh.

### Cập nhật ứng dụng hiện có

Để cập nhật một ứng dụng Teams đã được cài đặt (ví dụ: để thêm quyền RSC):

```bash
# Download, edit, and re-upload the manifest
teams app manifest download <teamsAppId> manifest.json
# Edit manifest.json locally...
teams app manifest upload manifest.json <teamsAppId>
# Version is auto-bumped if content changed
```

Sau khi cập nhật, hãy cài đặt lại ứng dụng trong từng team để các quyền mới có hiệu lực, và **thoát hoàn toàn rồi khởi chạy lại Teams** (không chỉ đóng cửa sổ) để xóa siêu dữ liệu ứng dụng đã lưu trong bộ nhớ đệm.

<details>
<summary>Cập nhật manifest thủ công (không dùng CLI)</summary>

1. Cập nhật `manifest.json` của bạn với các thiết lập mới
2. **Tăng trường `version`** (ví dụ: `1.0.0` → `1.1.0`)
3. **Nén lại** manifest cùng với biểu tượng (`manifest.json`, `outline.png`, `color.png`)
4. Tải lên tệp zip mới:
   - **Teams Admin Center:** Ứng dụng Teams → Quản lý ứng dụng → tìm ứng dụng của bạn → Tải lên phiên bản mới
   - **Sideload:** Trong Teams → Ứng dụng → Quản lý ứng dụng của bạn → Tải lên ứng dụng tùy chỉnh

</details>

## Khả năng: chỉ RSC so với Graph

### Với **chỉ Teams RSC** (ứng dụng đã cài đặt, không có quyền Graph API)

Hoạt động:

- Đọc nội dung **văn bản** tin nhắn kênh.
- Gửi nội dung **văn bản** tin nhắn kênh.
- Nhận tệp đính kèm **cá nhân (DM)**.

Không hoạt động:

- **Nội dung hình ảnh hoặc tệp** trong kênh/nhóm (payload chỉ bao gồm HTML stub).
- Tải xuống tệp đính kèm lưu trong SharePoint/OneDrive.
- Đọc lịch sử tin nhắn (ngoài sự kiện Webhook trực tiếp).

### Với **Teams RSC + quyền Microsoft Graph Application**

Bổ sung:

- Tải xuống nội dung được lưu trữ (hình ảnh dán vào tin nhắn).
- Tải xuống tệp đính kèm lưu trong SharePoint/OneDrive.
- Đọc lịch sử tin nhắn kênh/chat qua Graph.

### RSC so với Graph API

| Khả năng                | Quyền RSC            | Graph API                                  |
| ----------------------- | -------------------- | ------------------------------------------ |
| **Tin nhắn thời gian thực** | Có (qua Webhook) | Không (chỉ polling)                        |
| **Tin nhắn lịch sử**    | Không                | Có (có thể truy vấn lịch sử)               |
| **Độ phức tạp thiết lập** | Chỉ manifest ứng dụng | Cần sự đồng ý của quản trị viên + luồng token |
| **Hoạt động ngoại tuyến** | Không (phải đang chạy) | Có (truy vấn bất cứ lúc nào)            |

**Tóm lại:** RSC dùng để lắng nghe theo thời gian thực; Graph API dùng để truy cập lịch sử. Để bắt kịp các tin nhắn bị bỏ lỡ khi ngoại tuyến, bạn cần Graph API với `ChannelMessage.Read.All` (cần sự đồng ý của quản trị viên).

## Media + lịch sử có Graph (bắt buộc cho kênh)

Nếu bạn cần hình ảnh/tệp trong **kênh** hoặc muốn lấy **lịch sử tin nhắn**, bạn phải bật quyền Microsoft Graph và cấp sự đồng ý của quản trị viên.

1. Trong **App Registration** của Entra ID (Azure AD), thêm **quyền Application** của Microsoft Graph:
   - `ChannelMessage.Read.All` (tệp đính kèm kênh + lịch sử)
   - `Chat.Read.All` hoặc `ChatMessage.Read.All` (chat nhóm)
2. **Cấp sự đồng ý của quản trị viên** cho tenant.
3. Tăng **phiên bản manifest** của ứng dụng Teams, tải lên lại và **cài đặt lại ứng dụng trong Teams**.
4. **Thoát hoàn toàn rồi khởi chạy lại Teams** để xóa siêu dữ liệu ứng dụng đã lưu trong bộ nhớ đệm.

**Quyền bổ sung cho đề cập người dùng:** @mentions người dùng hoạt động mặc định cho người dùng trong cuộc hội thoại. Tuy nhiên, nếu bạn muốn tìm kiếm động và đề cập những người dùng **không ở trong cuộc hội thoại hiện tại**, hãy thêm quyền `User.Read.All` (Application) và cấp sự đồng ý của quản trị viên.

## Hạn chế đã biết

### Thời gian chờ Webhook

Teams gửi tin nhắn qua HTTP Webhook. Nếu xử lý mất quá lâu (ví dụ: phản hồi LLM chậm), bạn có thể thấy:

- Gateway hết thời gian chờ
- Teams thử gửi lại tin nhắn (gây trùng lặp)
- Phản hồi bị bỏ

OpenClaw xử lý việc này bằng cách trả về nhanh và chủ động gửi phản hồi, nhưng phản hồi rất chậm vẫn có thể gây ra sự cố.

### Định dạng

Markdown của Teams hạn chế hơn Slack hoặc Discord:

- Định dạng cơ bản hoạt động: **in đậm**, _in nghiêng_, `code`, liên kết
- Markdown phức tạp (bảng, danh sách lồng nhau) có thể không hiển thị đúng
- Adaptive Cards được hỗ trợ cho khảo sát và các lượt gửi trình bày ngữ nghĩa (xem bên dưới)

## Cấu hình

Các thiết lập chính (xem `/gateway/configuration` để biết các mẫu kênh dùng chung):

- `channels.msteams.enabled`: bật/tắt kênh.
- `channels.msteams.appId`, `channels.msteams.appPassword`, `channels.msteams.tenantId`: thông tin xác thực bot.
- `channels.msteams.webhook.port` (mặc định `3978`)
- `channels.msteams.webhook.path` (mặc định `/api/messages`)
- `channels.msteams.dmPolicy`: `pairing | allowlist | open | disabled` (mặc định: ghép đôi)
- `channels.msteams.allowFrom`: danh sách cho phép DM (khuyến nghị dùng ID đối tượng AAD). Trình hướng dẫn phân giải tên thành ID trong quá trình thiết lập khi có quyền truy cập Graph.
- `channels.msteams.dangerouslyAllowNameMatching`: công tắc khẩn cấp để bật lại việc khớp UPN/tên hiển thị có thể thay đổi và định tuyến trực tiếp theo tên nhóm/kênh.
- `channels.msteams.textChunkLimit`: kích thước đoạn văn bản gửi đi.
- `channels.msteams.chunkMode`: `length` (mặc định) hoặc `newline` để tách theo dòng trống (ranh giới đoạn văn) trước khi chia đoạn theo độ dài.
- `channels.msteams.mediaAllowHosts`: danh sách cho phép cho máy chủ tệp đính kèm đến (mặc định là các miền Microsoft/Teams).
- `channels.msteams.mediaAuthAllowHosts`: danh sách cho phép để gắn tiêu đề Authorization khi thử lại media (mặc định là máy chủ Graph + Bot Framework).
- `channels.msteams.requireMention`: yêu cầu @mention trong kênh/nhóm (mặc định true).
- `channels.msteams.replyStyle`: `thread | top-level` (xem [Kiểu trả lời](#reply-style-threads-vs-posts)).
- `channels.msteams.teams.<teamId>.replyStyle`: ghi đè theo từng nhóm.
- `channels.msteams.teams.<teamId>.requireMention`: ghi đè theo từng nhóm.
- `channels.msteams.teams.<teamId>.tools`: các ghi đè chính sách công cụ mặc định theo từng nhóm (`allow`/`deny`/`alsoAllow`) được dùng khi thiếu ghi đè kênh.
- `channels.msteams.teams.<teamId>.toolsBySender`: các ghi đè chính sách công cụ mặc định theo từng người gửi trong từng nhóm (hỗ trợ ký tự đại diện `"*"`).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`: ghi đè theo từng kênh.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.requireMention`: ghi đè theo từng kênh.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.tools`: các ghi đè chính sách công cụ theo từng kênh (`allow`/`deny`/`alsoAllow`).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.toolsBySender`: các ghi đè chính sách công cụ theo từng người gửi trong từng kênh (hỗ trợ ký tự đại diện `"*"`).
- Khóa `toolsBySender` nên dùng tiền tố rõ ràng:
  `id:`, `e164:`, `username:`, `name:` (các khóa cũ không có tiền tố vẫn chỉ ánh xạ tới `id:`).
- `channels.msteams.actions.memberInfo`: bật hoặc tắt hành động thông tin thành viên dựa trên Graph (mặc định: bật khi có thông tin xác thực Graph).
- `channels.msteams.authType`: loại xác thực - `"secret"` (mặc định) hoặc `"federated"`.
- `channels.msteams.certificatePath`: đường dẫn đến tệp chứng chỉ PEM (federated + xác thực bằng chứng chỉ).
- `channels.msteams.certificateThumbprint`: vân tay chứng chỉ (tùy chọn, không bắt buộc để xác thực).
- `channels.msteams.useManagedIdentity`: bật xác thực managed identity (chế độ federated).
- `channels.msteams.managedIdentityClientId`: ID máy khách cho managed identity do người dùng gán.
- `channels.msteams.sharePointSiteId`: ID site SharePoint để tải tệp lên trong trò chuyện nhóm/kênh (xem [Gửi tệp trong trò chuyện nhóm](#sending-files-in-group-chats)).

## Định tuyến và phiên

- Khóa phiên tuân theo định dạng agent tiêu chuẩn (xem [/concepts/session](/vi/concepts/session)):
  - Tin nhắn trực tiếp dùng chung phiên chính (`agent:<agentId>:<mainKey>`).
  - Tin nhắn kênh/nhóm dùng ID cuộc hội thoại:
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## Kiểu trả lời: luồng so với bài đăng

Teams gần đây đã giới thiệu hai kiểu giao diện kênh trên cùng một mô hình dữ liệu nền:

| Kiểu                     | Mô tả                                                     | `replyStyle` khuyến nghị |
| ------------------------ | --------------------------------------------------------- | ------------------------ |
| **Bài đăng** (cổ điển)   | Tin nhắn xuất hiện dưới dạng thẻ với trả lời dạng luồng bên dưới | `thread` (mặc định)      |
| **Luồng** (giống Slack)  | Tin nhắn chạy tuyến tính, giống Slack hơn                 | `top-level`              |

**Vấn đề:** Teams API không cho biết kênh đang dùng kiểu giao diện nào. Nếu bạn dùng sai `replyStyle`:

- `thread` trong kênh kiểu Luồng → trả lời xuất hiện lồng vào nhau một cách khó xử
- `top-level` trong kênh kiểu Bài đăng → trả lời xuất hiện như các bài đăng cấp cao riêng biệt thay vì nằm trong luồng

**Giải pháp:** Cấu hình `replyStyle` theo từng kênh dựa trên cách kênh được thiết lập:

```json5
{
  channels: {
    msteams: {
      replyStyle: "thread",
      teams: {
        "19:abc...@thread.tacv2": {
          channels: {
            "19:xyz...@thread.tacv2": {
              replyStyle: "top-level",
            },
          },
        },
      },
    },
  },
}
```

### Thứ tự ưu tiên phân giải

Khi bot gửi câu trả lời vào một kênh, `replyStyle` được phân giải từ ghi đè cụ thể nhất xuống mặc định. Giá trị đầu tiên không phải `undefined` sẽ được dùng:

1. **Theo từng kênh** — `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`
2. **Theo từng nhóm** — `channels.msteams.teams.<teamId>.replyStyle`
3. **Toàn cục** — `channels.msteams.replyStyle`
4. **Mặc định ngầm định** — suy ra từ `requireMention`:
   - `requireMention: true` → `thread`
   - `requireMention: false` → `top-level`

Nếu bạn đặt `requireMention: false` toàn cục mà không có `replyStyle` rõ ràng, các lượt mention trong kênh kiểu Bài đăng sẽ xuất hiện dưới dạng bài đăng cấp cao ngay cả khi tin nhắn đến là trả lời trong luồng. Ghim `replyStyle: "thread"` ở cấp toàn cục, nhóm hoặc kênh để tránh bất ngờ.

### Bảo toàn ngữ cảnh luồng

Khi `replyStyle: "thread"` có hiệu lực và bot được @mentioned từ bên trong một luồng kênh, OpenClaw gắn lại gốc luồng ban đầu vào tham chiếu cuộc hội thoại gửi đi (`19:…@thread.tacv2;messageid=<root>`) để câu trả lời nằm trong cùng luồng. Điều này áp dụng cho cả lượt gửi trực tiếp (trong lượt xử lý) và lượt gửi chủ động được thực hiện sau khi ngữ cảnh lượt Bot Framework đã hết hạn (ví dụ: agent chạy lâu, trả lời lệnh gọi công cụ được xếp hàng qua `mcp__openclaw__message`).

Gốc luồng được lấy từ `threadId` đã lưu trên tham chiếu cuộc hội thoại. Các tham chiếu đã lưu cũ hơn có trước `threadId` sẽ quay về dùng `activityId` (bất kỳ hoạt động đến nào gần nhất đã khởi tạo cuộc hội thoại), nên các triển khai hiện có vẫn tiếp tục hoạt động mà không cần khởi tạo lại.

Khi `replyStyle: "top-level"` có hiệu lực, các tin nhắn đến từ luồng kênh được cố ý trả lời dưới dạng bài đăng cấp cao mới — không gắn hậu tố luồng. Đây là hành vi đúng cho kênh kiểu Luồng; nếu bạn thấy bài đăng cấp cao ở nơi bạn mong đợi trả lời dạng luồng, `replyStyle` của bạn đang được đặt sai cho kênh đó.

## Tệp đính kèm và hình ảnh

**Các giới hạn hiện tại:**

- **DM:** Hình ảnh và tệp đính kèm hoạt động qua Teams bot file APIs.
- **Kênh/nhóm:** Tệp đính kèm nằm trong bộ nhớ M365 (SharePoint/OneDrive). Payload Webhook chỉ bao gồm một đoạn HTML stub, không phải byte tệp thực tế. **Cần quyền Graph API** để tải xuống tệp đính kèm trong kênh.
- Đối với các lượt gửi ưu tiên tệp rõ ràng, dùng `action=upload-file` với `media` / `filePath` / `path`; `message` tùy chọn trở thành văn bản/bình luận đi kèm, và `filename` ghi đè tên đã tải lên.

Nếu không có quyền Graph, tin nhắn kênh có hình ảnh sẽ được nhận chỉ dưới dạng văn bản (bot không thể truy cập nội dung hình ảnh).
Theo mặc định, OpenClaw chỉ tải media xuống từ tên máy chủ Microsoft/Teams. Ghi đè bằng `channels.msteams.mediaAllowHosts` (dùng `["*"]` để cho phép bất kỳ máy chủ nào).
Tiêu đề Authorization chỉ được gắn cho các máy chủ trong `channels.msteams.mediaAuthAllowHosts` (mặc định là máy chủ Graph + Bot Framework). Giữ danh sách này chặt chẽ (tránh hậu tố đa tenant).

## Gửi tệp trong trò chuyện nhóm

Bot có thể gửi tệp trong DM bằng luồng FileConsentCard (tích hợp sẵn). Tuy nhiên, **gửi tệp trong trò chuyện nhóm/kênh** cần thiết lập bổ sung:

| Ngữ cảnh                 | Cách gửi tệp                                  | Thiết lập cần thiết                              |
| ------------------------ | -------------------------------------------- | ----------------------------------------------- |
| **DM**                   | FileConsentCard → người dùng chấp nhận → bot tải lên | Hoạt động ngay                                  |
| **Trò chuyện nhóm/kênh** | Tải lên SharePoint → chia sẻ liên kết         | Cần `sharePointSiteId` + quyền Graph            |
| **Hình ảnh (mọi ngữ cảnh)** | Nhúng inline được mã hóa Base64             | Hoạt động ngay                                  |

### Vì sao trò chuyện nhóm cần SharePoint

Bot không có ổ OneDrive cá nhân (điểm cuối Graph API `/me/drive` không hoạt động với định danh ứng dụng). Để gửi tệp trong trò chuyện nhóm/kênh, bot tải lên một **site SharePoint** và tạo liên kết chia sẻ.

### Thiết lập

1. **Thêm quyền Graph API** trong Entra ID (Azure AD) → App Registration:
   - `Sites.ReadWrite.All` (Application) - tải tệp lên SharePoint
   - `Chat.Read.All` (Application) - tùy chọn, bật liên kết chia sẻ theo từng người dùng

2. **Cấp sự đồng ý của quản trị viên** cho tenant.

3. **Lấy ID site SharePoint của bạn:**

   ```bash
   # Via Graph Explorer or curl with a valid token:
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/{hostname}:/{site-path}"

   # Example: for a site at "contoso.sharepoint.com/sites/BotFiles"
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com:/sites/BotFiles"

   # Response includes: "id": "contoso.sharepoint.com,guid1,guid2"
   ```

4. **Cấu hình OpenClaw:**

   ```json5
   {
     channels: {
       msteams: {
         // ... other config ...
         sharePointSiteId: "contoso.sharepoint.com,guid1,guid2",
       },
     },
   }
   ```

### Hành vi chia sẻ

| Quyền                                   | Hành vi chia sẻ                                           |
| --------------------------------------- | --------------------------------------------------------- |
| Chỉ `Sites.ReadWrite.All`               | Liên kết chia sẻ toàn tổ chức (bất kỳ ai trong tổ chức đều truy cập được) |
| `Sites.ReadWrite.All` + `Chat.Read.All` | Liên kết chia sẻ theo từng người dùng (chỉ thành viên trò chuyện truy cập được) |

Chia sẻ theo từng người dùng an toàn hơn vì chỉ những người tham gia trò chuyện mới có thể truy cập tệp. Nếu thiếu quyền `Chat.Read.All`, bot sẽ quay về dùng chia sẻ toàn tổ chức.

### Hành vi dự phòng

| Tình huống                                        | Kết quả                                            |
| ------------------------------------------------- | -------------------------------------------------- |
| Trò chuyện nhóm + tệp + đã cấu hình `sharePointSiteId` | Tải lên SharePoint, gửi liên kết chia sẻ           |
| Trò chuyện nhóm + tệp + không có `sharePointSiteId` | Thử tải lên OneDrive (có thể thất bại), chỉ gửi văn bản |
| Trò chuyện cá nhân + tệp                          | Luồng FileConsentCard (hoạt động không cần SharePoint) |
| Mọi ngữ cảnh + hình ảnh                           | Nhúng inline được mã hóa Base64 (hoạt động không cần SharePoint) |

### Vị trí lưu trữ tệp

Các tệp đã tải lên được lưu trong thư mục `/OpenClawShared/` trong thư viện tài liệu mặc định của site SharePoint đã cấu hình.

## Khảo sát (Adaptive Cards)

OpenClaw gửi khảo sát Teams dưới dạng Adaptive Cards (không có API khảo sát Teams gốc).

- CLI: `openclaw message poll --channel msteams --target conversation:<id> ...`
- Phiếu bầu được Gateway ghi vào `~/.openclaw/msteams-polls.json`.
- Gateway phải duy trì trực tuyến để ghi phiếu bầu.
- Khảo sát chưa tự động đăng tóm tắt kết quả (kiểm tra tệp lưu trữ nếu cần).

## Thẻ trình bày

Gửi các payload bản trình bày ngữ nghĩa tới người dùng hoặc cuộc hội thoại Teams bằng công cụ `message` hoặc CLI. OpenClaw hiển thị chúng dưới dạng Teams Adaptive Cards từ hợp đồng bản trình bày chung.

Tham số `presentation` chấp nhận các khối ngữ nghĩa. Khi cung cấp `presentation`, văn bản tin nhắn là tùy chọn.

**Công cụ agent:**

```json5
{
  action: "send",
  channel: "msteams",
  target: "user:<id>",
  presentation: {
    title: "Hello",
    blocks: [{ type: "text", text: "Hello!" }],
  },
}
```

**CLI:**

```bash
openclaw message send --channel msteams \
  --target "conversation:19:abc...@thread.tacv2" \
  --presentation '{"title":"Hello","blocks":[{"type":"text","text":"Hello!"}]}'
```

Để biết chi tiết về định dạng mục tiêu, xem [Định dạng mục tiêu](#target-formats) bên dưới.

## Định dạng mục tiêu

Mục tiêu MSTeams dùng tiền tố để phân biệt giữa người dùng và cuộc hội thoại:

| Loại mục tiêu       | Định dạng                        | Ví dụ                                               |
| ------------------- | -------------------------------- | --------------------------------------------------- |
| Người dùng (theo ID) | `user:<aad-object-id>`           | `user:40a1a0ed-4ff2-4164-a219-55518990c197`         |
| Người dùng (theo tên) | `user:<display-name>`            | `user:John Smith` (yêu cầu Graph API)               |
| Nhóm/kênh           | `conversation:<conversation-id>` | `conversation:19:abc123...@thread.tacv2`            |
| Nhóm/kênh (thô)     | `<conversation-id>`              | `19:abc123...@thread.tacv2` (nếu chứa `@thread`)    |

**Ví dụ CLI:**

```bash
# Send to a user by ID
openclaw message send --channel msteams --target "user:40a1a0ed-..." --message "Hello"

# Send to a user by display name (triggers Graph API lookup)
openclaw message send --channel msteams --target "user:John Smith" --message "Hello"

# Send to a group chat or channel
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" --message "Hello"

# Send a presentation card to a conversation
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" \
  --presentation '{"title":"Hello","blocks":[{"type":"text","text":"Hello"}]}'
```

**Ví dụ công cụ agent:**

```json5
{
  action: "send",
  channel: "msteams",
  target: "user:John Smith",
  message: "Hello!",
}
```

```json5
{
  action: "send",
  channel: "msteams",
  target: "conversation:19:abc...@thread.tacv2",
  presentation: {
    title: "Hello",
    blocks: [{ type: "text", text: "Hello" }],
  },
}
```

<Note>
Nếu không có tiền tố `user:`, tên mặc định sẽ được phân giải như nhóm hoặc đội. Luôn dùng `user:` khi nhắm tới người bằng tên hiển thị.
</Note>

## Nhắn tin chủ động

- Tin nhắn chủ động chỉ có thể gửi **sau khi** người dùng đã tương tác, vì lúc đó chúng tôi mới lưu tham chiếu cuộc hội thoại.
- Xem `/gateway/configuration` để biết `dmPolicy` và cơ chế kiểm soát bằng danh sách cho phép.

## ID đội và kênh (lỗi thường gặp)

Tham số truy vấn `groupId` trong URL Teams **KHÔNG** phải là ID đội dùng cho cấu hình. Thay vào đó, hãy trích xuất ID từ đường dẫn URL:

**URL đội:**

```
https://teams.microsoft.com/l/team/19%3ABk4j...%40thread.tacv2/conversations?groupId=...
                                    └────────────────────────────┘
                                    Team conversation ID (URL-decode this)
```

**URL kênh:**

```
https://teams.microsoft.com/l/channel/19%3A15bc...%40thread.tacv2/ChannelName?groupId=...
                                      └─────────────────────────┘
                                      Channel ID (URL-decode this)
```

**Đối với cấu hình:**

- Khóa đội = đoạn đường dẫn sau `/team/` (đã giải mã URL, ví dụ `19:Bk4j...@thread.tacv2`; tenant cũ hơn có thể hiển thị `@thread.skype`, cũng hợp lệ)
- Khóa kênh = đoạn đường dẫn sau `/channel/` (đã giải mã URL)
- **Bỏ qua** tham số truy vấn `groupId` cho định tuyến OpenClaw. Đó là ID nhóm Microsoft Entra, không phải ID cuộc hội thoại Bot Framework dùng trong các hoạt động Teams đến.

## Kênh riêng tư

Bot có hỗ trợ hạn chế trong kênh riêng tư:

| Tính năng                   | Kênh tiêu chuẩn | Kênh riêng tư           |
| --------------------------- | --------------- | ----------------------- |
| Cài đặt bot                 | Có              | Hạn chế                 |
| Tin nhắn thời gian thực (Webhook) | Có        | Có thể không hoạt động  |
| Quyền RSC                   | Có              | Có thể hoạt động khác   |
| @mentions                   | Có              | Nếu bot có thể truy cập |
| Lịch sử Graph API           | Có              | Có (với quyền phù hợp)  |

**Cách xử lý nếu kênh riêng tư không hoạt động:**

1. Dùng kênh tiêu chuẩn cho tương tác với bot
2. Dùng DM - người dùng luôn có thể nhắn trực tiếp cho bot
3. Dùng Graph API để truy cập lịch sử (yêu cầu `ChannelMessage.Read.All`)

## Khắc phục sự cố

### Sự cố thường gặp

- **Hình ảnh không hiển thị trong kênh:** thiếu quyền Graph hoặc thiếu chấp thuận của quản trị viên. Cài đặt lại ứng dụng Teams và thoát hoàn toàn/mở lại Teams.
- **Không có phản hồi trong kênh:** mặc định yêu cầu mention; đặt `channels.msteams.requireMention=false` hoặc cấu hình theo từng đội/kênh.
- **Không khớp phiên bản (Teams vẫn hiển thị manifest cũ):** gỡ + thêm lại ứng dụng và thoát hoàn toàn Teams để làm mới.
- **401 Unauthorized từ webhook:** Dự kiến xảy ra khi kiểm thử thủ công mà không có Azure JWT - nghĩa là endpoint có thể truy cập nhưng xác thực thất bại. Dùng Azure Web Chat để kiểm thử đúng cách.

### Lỗi tải manifest lên

- **"Tệp biểu tượng không được để trống":** manifest tham chiếu tới các tệp biểu tượng có kích thước 0 byte. Tạo biểu tượng PNG hợp lệ (32x32 cho `outline.png`, 192x192 cho `color.png`).
- **"webApplicationInfo.Id đã được sử dụng":** ứng dụng vẫn đang được cài đặt trong đội/cuộc trò chuyện khác. Tìm và gỡ cài đặt ứng dụng đó trước, hoặc chờ 5-10 phút để thay đổi lan truyền.
- **"Đã xảy ra lỗi" khi tải lên:** Thay vào đó, tải lên qua [https://admin.teams.microsoft.com](https://admin.teams.microsoft.com), mở DevTools của trình duyệt (F12) → thẻ Network, rồi kiểm tra phần thân phản hồi để biết lỗi thực tế.
- **Tải ngoài không thành công:** Thử "Tải ứng dụng lên danh mục ứng dụng của tổ chức bạn" thay vì "Tải ứng dụng tùy chỉnh lên" - cách này thường vượt qua các hạn chế tải ngoài.

### Quyền RSC không hoạt động

1. Xác minh `webApplicationInfo.id` khớp chính xác với App ID của bot
2. Tải lại ứng dụng lên và cài đặt lại trong đội/cuộc trò chuyện
3. Kiểm tra xem quản trị viên tổ chức của bạn có chặn quyền RSC không
4. Xác nhận bạn đang dùng đúng phạm vi: `ChannelMessage.Read.Group` cho đội, `ChatMessage.Read.Chat` cho cuộc trò chuyện nhóm

## Tham khảo

- [Tạo Azure Bot](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) - hướng dẫn thiết lập Azure Bot
- [Teams Developer Portal](https://dev.teams.microsoft.com/apps) - tạo/quản lý ứng dụng Teams
- [Lược đồ manifest ứng dụng Teams](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [Nhận tin nhắn kênh bằng RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/channel-messages-with-rsc)
- [Tham chiếu quyền RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)
- [Xử lý tệp của bot Teams](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bots-filesv4) (kênh/nhóm yêu cầu Graph)
- [Nhắn tin chủ động](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)
- [@microsoft/teams.cli](https://www.npmjs.com/package/@microsoft/teams.cli) - Teams CLI để quản lý bot

## Liên quan

- [Tổng quan về kênh](/vi/channels) - tất cả kênh được hỗ trợ
- [Ghép nối](/vi/channels/pairing) - xác thực DM và luồng ghép nối
- [Nhóm](/vi/channels/groups) - hành vi cuộc trò chuyện nhóm và kiểm soát mention
- [Định tuyến kênh](/vi/channels/channel-routing) - định tuyến phiên cho tin nhắn
- [Bảo mật](/vi/gateway/security) - mô hình truy cập và gia cố
