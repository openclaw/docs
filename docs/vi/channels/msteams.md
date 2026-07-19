---
read_when:
    - Phát triển các tính năng của kênh Microsoft Teams
summary: Trạng thái hỗ trợ, khả năng và cấu hình bot Microsoft Teams
title: Microsoft Teams
x-i18n:
    generated_at: "2026-07-19T05:34:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 5a4cf686da27e28b58f7afaad8cc837dbddb93219cde0c37285f9f6895f6fb8c
    source_path: channels/msteams.md
    workflow: 16
---

Trạng thái: hỗ trợ văn bản + tệp đính kèm trong DM; gửi tệp trong kênh/nhóm yêu cầu `sharePointSiteId` + quyền Graph (xem [Gửi tệp trong cuộc trò chuyện nhóm](#sending-files-in-group-chats)). Cuộc thăm dò được gửi qua Adaptive Cards. Các hành động tin nhắn cung cấp `upload-file` rõ ràng cho các lượt gửi ưu tiên tệp.

## Plugin đi kèm

Microsoft Teams được cung cấp dưới dạng Plugin đi kèm trong các bản phát hành OpenClaw hiện tại; bản dựng đóng gói thông thường không yêu cầu cài đặt riêng.

Trên bản dựng cũ hơn hoặc bản cài đặt tùy chỉnh không bao gồm Teams đi kèm, hãy cài đặt trực tiếp gói npm:

```bash
openclaw plugins install @openclaw/msteams
```

Sử dụng gói không chỉ định phiên bản để theo thẻ phát hành chính thức hiện tại. Chỉ ghim một phiên bản chính xác khi cần bản cài đặt có thể tái lập.

Bản checkout cục bộ (chạy từ kho git):

```bash
openclaw plugins install ./path/to/local/msteams-plugin
```

Chi tiết: [Plugin](/vi/tools/plugin)

## Thiết lập nhanh

[`@microsoft/teams.cli`](https://www.npmjs.com/package/@microsoft/teams.cli) xử lý việc đăng ký bot, tạo manifest và tạo thông tin xác thực bằng một lệnh.

**1. Cài đặt và đăng nhập**

```bash
npm install -g @microsoft/teams.cli@preview
teams login
teams status   # xác minh bạn đã đăng nhập và xem thông tin tenant
```

<Note>
Teams CLI hiện đang ở giai đoạn xem trước. Các lệnh và cờ có thể thay đổi giữa các bản phát hành.
</Note>

**2. Khởi động đường hầm** (Teams không thể truy cập localhost)

Cài đặt và xác thực devtunnel CLI nếu cần ([hướng dẫn bắt đầu](https://learn.microsoft.com/en-us/azure/developer/dev-tunnels/get-started)).

```bash
# Thiết lập một lần (URL duy trì qua các phiên):
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# Mỗi phiên phát triển:
devtunnel host my-openclaw-bot
# Điểm cuối của bạn: https://<tunnel-id>.devtunnels.ms/api/messages
```

<Note>
`--allow-anonymous` là bắt buộc vì Teams không thể xác thực với devtunnels. Mỗi yêu cầu bot đến vẫn được Teams SDK xác thực.
</Note>

Các lựa chọn thay thế: `ngrok http 3978` hoặc `tailscale funnel 3978` (URL có thể thay đổi trong mỗi phiên).

**3. Tạo ứng dụng**

```bash
teams app create \
  --name "OpenClaw" \
  --endpoint "https://<your-tunnel-url>/api/messages"
```

Thao tác này tạo một ứng dụng Entra ID (Azure AD), tạo khóa bí mật máy khách, xây dựng và tải lên manifest ứng dụng Teams (kèm biểu tượng), đồng thời đăng ký một bot do Teams quản lý (không cần gói đăng ký Azure). Đầu ra bao gồm `CLIENT_ID`, `CLIENT_SECRET`, `TENANT_ID` và **Teams App ID**; đồng thời cung cấp tùy chọn cài đặt ứng dụng trực tiếp trong Teams.

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

Hoặc sử dụng trực tiếp các biến môi trường: `MSTEAMS_APP_ID`, `MSTEAMS_APP_PASSWORD`, `MSTEAMS_TENANT_ID`.

**5. Cài đặt ứng dụng trong Teams**

`teams app create` nhắc bạn cài đặt ứng dụng; chọn "Install in Teams". Để lấy liên kết cài đặt sau:

```bash
teams app get <teamsAppId> --install-link
```

**6. Xác minh mọi thứ hoạt động**

```bash
teams app doctor <teamsAppId>
```

Chạy chẩn đoán cho việc đăng ký bot, cấu hình ứng dụng AAD, tính hợp lệ của manifest và thiết lập SSO.

Đối với môi trường production, hãy cân nhắc [xác thực liên kết](#federated-authentication-certificate-plus-managed-identity) (chứng chỉ hoặc danh tính được quản lý) thay cho khóa bí mật máy khách.

<Note>
Cuộc trò chuyện nhóm bị chặn theo mặc định (`channels.msteams.groupPolicy: "allowlist"`). Để cho phép trả lời trong nhóm, hãy đặt `channels.msteams.groupAllowFrom`, hoặc sử dụng `groupPolicy: "open"` để cho phép bất kỳ thành viên nào (vẫn yêu cầu đề cập).
</Note>

## Mục tiêu

- Trò chuyện với OpenClaw qua DM, cuộc trò chuyện nhóm hoặc kênh Teams.
- Duy trì định tuyến xác định: câu trả lời luôn quay về kênh nơi chúng được nhận.
- Mặc định sử dụng hành vi kênh an toàn (yêu cầu đề cập trừ khi được cấu hình khác).

## Ghi cấu hình

Theo mặc định, Microsoft Teams có thể ghi các cập nhật cấu hình do `/config set|unset` kích hoạt (yêu cầu `commands.config: true`).

Vô hiệu hóa bằng:

```json5
{
  channels: { msteams: { configWrites: false } },
}
```

## Kiểm soát quyền truy cập (DM + nhóm)

**Quyền truy cập DM**

- Mặc định: `channels.msteams.dmPolicy = "pairing"`. Người gửi không xác định bị bỏ qua cho đến khi được phê duyệt.
- `channels.msteams.allowFrom` nên sử dụng ID đối tượng AAD ổn định hoặc các nhóm truy cập người gửi tĩnh như `accessGroup:core-team`.
- Không dựa vào việc khớp UPN/tên hiển thị cho danh sách cho phép; chúng có thể thay đổi. OpenClaw vô hiệu hóa tính năng khớp tên trực tiếp theo mặc định; bật tính năng này bằng `channels.msteams.dangerouslyAllowNameMatching: true`.
- Trình hướng dẫn có thể phân giải tên thành ID qua Microsoft Graph khi thông tin xác thực cho phép.

**Quyền truy cập nhóm**

- Mặc định: `channels.msteams.groupPolicy = "allowlist"` (bị chặn trừ khi bạn thêm `groupAllowFrom`). `channels.defaults.groupPolicy` có thể ghi đè mặc định dùng chung khi chưa đặt `channels.msteams.groupPolicy`.
- `channels.msteams.groupAllowFrom` kiểm soát người gửi hoặc nhóm truy cập người gửi tĩnh nào có thể kích hoạt trong cuộc trò chuyện nhóm/kênh (nếu không có thì dùng `channels.msteams.allowFrom`).
- Đặt `groupPolicy: "open"` để cho phép bất kỳ thành viên nào (theo mặc định vẫn yêu cầu đề cập).
- Để chặn **tất cả** các kênh, hãy đặt `channels.msteams.groupPolicy: "disabled"`.

Ví dụ:

```json5
{
  channels: {
    msteams: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["00000000-0000-0000-0000-000000000000", "accessGroup:core-team"],
    },
  },
}
```

**Danh sách cho phép nhóm + kênh**

- Giới hạn phạm vi trả lời nhóm/kênh bằng cách liệt kê các nhóm và kênh trong `channels.msteams.teams`.
- Sử dụng ID cuộc hội thoại Teams ổn định từ các liên kết Teams làm khóa, không dùng tên hiển thị có thể thay đổi (xem [ID nhóm và kênh](#team-and-channel-ids-common-gotcha)).
- Khi có `groupPolicy="allowlist"` và danh sách cho phép nhóm, chỉ các nhóm/kênh được liệt kê mới được chấp nhận (yêu cầu đề cập).
- Trình hướng dẫn cấu hình chấp nhận các mục `Team/Channel` và lưu chúng cho bạn.
- Khi khởi động, OpenClaw phân giải tên nhóm/kênh và tên trong danh sách cho phép người dùng thành ID (khi quyền Graph cho phép) và ghi ánh xạ vào nhật ký. Các tên không phân giải được vẫn được giữ nguyên như đã nhập nhưng bị bỏ qua khi định tuyến trừ khi đặt `channels.msteams.dangerouslyAllowNameMatching: true`.

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

### Cách hoạt động

1. Đảm bảo Plugin Microsoft Teams khả dụng (đi kèm trong các bản phát hành hiện tại).
2. Tạo một **Azure Bot** (App ID + khóa bí mật + tenant ID).
3. Xây dựng một **gói ứng dụng Teams** tham chiếu đến bot, bao gồm các quyền RSC bên dưới.
4. Tải lên/cài đặt ứng dụng Teams vào một nhóm (hoặc phạm vi cá nhân cho DM).
5. Cấu hình `msteams` trong `~/.openclaw/openclaw.json` (hoặc các biến môi trường) và khởi động Gateway.
6. Gateway lắng nghe lưu lượng Webhook Bot Framework trên `/api/messages` theo mặc định.

### Bước 1: Tạo Azure Bot

1. Đi tới [Create Azure Bot](https://portal.azure.com/#create/Microsoft.AzureBot)
2. Điền vào thẻ **Basics**:

   | Trường             | Giá trị                                                    |
   | ------------------ | ---------------------------------------------------------- |
   | **Bot handle**     | Tên bot của bạn, ví dụ: `openclaw-msteams` (phải là duy nhất) |
   | **Subscription**   | Chọn gói đăng ký Azure của bạn                              |
   | **Resource group** | Tạo mới hoặc sử dụng nhóm hiện có                           |
   | **Pricing tier**   | **Free** cho phát triển/kiểm thử                            |
   | **Type of App**    | **Single Tenant** (khuyến nghị; xem ghi chú bên dưới)       |
   | **Creation type**  | **Create new Microsoft App ID**                             |

<Warning>
Việc tạo bot đa tenant mới đã ngừng được hỗ trợ sau 2025-07-31. Sử dụng **Single Tenant** cho bot mới.
</Warning>

3. Nhấp vào **Review + create**, sau đó nhấp vào **Create** (~1-2 phút).

### Bước 2: Lấy thông tin xác thực

1. Tài nguyên Azure Bot → **Configuration** → sao chép **Microsoft App ID** (`appId` của bạn).
2. **Manage Password** → App Registration → **Certificates & secrets** → **New client secret** → sao chép **Value** (`appPassword` của bạn).
3. **Overview** → sao chép **Directory (tenant) ID** (`tenantId` của bạn).

### Bước 3: Cấu hình điểm cuối nhắn tin

1. Azure Bot → **Configuration**.
2. Đặt **Messaging endpoint**:
   - Production: `https://your-domain.com/api/messages`
   - Phát triển cục bộ: sử dụng đường hầm (xem [Phát triển cục bộ](#local-development-tunneling))

### Bước 4: Bật kênh Teams

1. Azure Bot → **Channels**.
2. Nhấp vào **Microsoft Teams** → Configure → Save.
3. Chấp nhận Điều khoản dịch vụ.

### Bước 5: Xây dựng manifest ứng dụng Teams

- Bao gồm một mục `bot` với `botId = <App ID>`.
- Phạm vi: `personal`, `team`, `groupChat`.
- `supportsFiles: true` (bắt buộc để xử lý tệp trong phạm vi cá nhân).
- Thêm quyền RSC (xem [Quyền RSC](#current-teams-rsc-permissions-manifest)).
- Tạo biểu tượng: `outline.png` (32x32) và `color.png` (192x192).
- Nén `manifest.json`, `outline.png` và `color.png` cùng nhau.

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

Kênh Teams tự động khởi động khi Plugin khả dụng và cấu hình `msteams` có thông tin xác thực.

</details>

## Xác thực liên kết (chứng chỉ kết hợp danh tính được quản lý)

Đối với môi trường production, OpenClaw hỗ trợ **xác thực liên kết** qua `channels.msteams.authType: "federated"` như một lựa chọn thay thế cho khóa bí mật máy khách. Có hai phương thức:

### Tùy chọn A: Xác thực dựa trên chứng chỉ

Sử dụng chứng chỉ PEM đã đăng ký với bản đăng ký ứng dụng Entra ID của bạn.

**Thiết lập:**

1. Tạo hoặc lấy chứng chỉ (định dạng PEM kèm khóa riêng tư).
2. Entra ID → App Registration → **Certificates & secrets** → **Certificates** → tải chứng chỉ công khai lên.

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

### Tùy chọn B: Azure Managed Identity

Sử dụng Azure Managed Identity để xác thực không cần mật khẩu trên cơ sở hạ tầng Azure (AKS, App Service, máy ảo Azure).

**Cách hoạt động:**

1. Pod/VM của bot có một danh tính được quản lý (do hệ thống hoặc người dùng gán).
2. Thông tin xác thực danh tính liên kết kết nối danh tính được quản lý với bản đăng ký ứng dụng Entra ID.
3. Trong thời gian chạy, OpenClaw sử dụng `@azure/identity` để lấy token từ điểm cuối Azure IMDS.
4. Token được chuyển cho Teams SDK để xác thực bot.

**Điều kiện tiên quyết:**

- Hạ tầng Azure đã bật danh tính được quản lý (danh tính khối lượng công việc AKS, App Service, VM).
- Thông tin xác thực danh tính liên kết đã được tạo trên đăng ký ứng dụng Entra ID.
- Quyền truy cập mạng tới IMDS (`169.254.169.254:80`) từ pod/VM.

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

**Cấu hình (danh tính được quản lý do người dùng gán):** thêm `managedIdentityClientId: "<MI_CLIENT_ID>"` vào khối trên.

**Biến môi trường:**

- `MSTEAMS_AUTH_TYPE=federated`
- `MSTEAMS_USE_MANAGED_IDENTITY=true`
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID=<client-id>` (chỉ dành cho danh tính do người dùng gán)

### Thiết lập danh tính khối lượng công việc AKS

Đối với các bản triển khai AKS sử dụng danh tính khối lượng công việc:

1. **Bật danh tính khối lượng công việc** trên cụm AKS.
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

4. **Gắn nhãn pod** để chèn danh tính khối lượng công việc:

   ```yaml
   metadata:
     labels:
       azure.workload.identity/use: "true"
   ```

5. **Cho phép truy cập mạng** tới IMDS (`169.254.169.254`): nếu sử dụng NetworkPolicy, hãy thêm quy tắc lưu lượng đi ra cho `169.254.169.254/32` trên cổng 80.

### So sánh loại xác thực

| Phương thức                    | Cấu hình                                       | Ưu điểm                                  | Nhược điểm                                      |
| ----------------------------- | ---------------------------------------------- | ---------------------------------------- | ----------------------------------------------- |
| **Bí mật máy khách**          | `appPassword`                             | Thiết lập đơn giản                       | Phải xoay vòng bí mật, kém an toàn hơn           |
| **Chứng chỉ**                 | `authType: "federated"` + `certificatePath`        | Không truyền bí mật dùng chung qua mạng  | Tốn công quản lý chứng chỉ                       |
| **Danh tính được quản lý**    | `authType: "federated"` + `useManagedIdentity`        | Không mật khẩu, không cần quản lý bí mật | Yêu cầu hạ tầng Azure                            |

Có thể đặt `certificateThumbprint` cùng với `certificatePath`, nhưng hiện tại đường dẫn xác thực không đọc giá trị này; giá trị chỉ được chấp nhận để đảm bảo khả năng tương thích trong tương lai.

**Mặc định:** khi chưa đặt `authType`, OpenClaw sử dụng xác thực bằng bí mật máy khách (`appPassword`). Các cấu hình hiện có tiếp tục hoạt động mà không cần thay đổi.

## Phát triển cục bộ (tạo đường hầm)

Teams không thể truy cập `localhost`. Hãy sử dụng đường hầm phát triển cố định để URL duy trì ổn định giữa các phiên:

```bash
# Thiết lập một lần:
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# Mỗi phiên phát triển:
devtunnel host my-openclaw-bot
```

Các lựa chọn thay thế: `ngrok http 3978` hoặc `tailscale funnel 3978` (URL có thể thay đổi sau mỗi phiên).

Nếu URL đường hầm thay đổi, hãy cập nhật điểm cuối:

```bash
teams app update <teamsAppId> --endpoint "https://<new-url>/api/messages"
```

## Kiểm thử bot

**Chạy chẩn đoán:**

```bash
teams app doctor <teamsAppId>
```

Kiểm tra đăng ký bot, ứng dụng AAD, tệp kê khai và cấu hình SSO trong một lượt.

**Gửi tin nhắn kiểm thử:**

1. Cài đặt ứng dụng Teams (liên kết cài đặt từ `teams app get <id> --install-link`).
2. Tìm bot trong Teams và gửi tin nhắn trực tiếp.
3. Kiểm tra nhật ký Gateway để xem hoạt động đến.

## Biến môi trường

Có thể đặt các khóa cấu hình liên quan đến xác thực này qua biến môi trường thay vì `openclaw.json` (các khóa cấu hình khác, chẳng hạn như `groupPolicy` hoặc `historyLimit`, chỉ có thể đặt trong cấu hình):

| Biến môi trường                      | Khóa cấu hình              | Ghi chú                                      |
| ------------------------------------ | ------------------------- | -------------------------------------------- |
| `MSTEAMS_APP_ID`                   | `appId`        |                                              |
| `MSTEAMS_APP_PASSWORD`                   | `appPassword`        |                                              |
| `MSTEAMS_TENANT_ID`                   | `tenantId`        |                                              |
| `MSTEAMS_AUTH_TYPE`                   | `authType`        | `"secret"` hoặc `"federated"`   |
| `MSTEAMS_CERTIFICATE_PATH`                   | `certificatePath`        | liên kết + chứng chỉ                          |
| `MSTEAMS_CERTIFICATE_THUMBPRINT`                   | `certificateThumbprint`        | được chấp nhận, không bắt buộc để xác thực    |
| `MSTEAMS_USE_MANAGED_IDENTITY`                   | `useManagedIdentity`        | liên kết + danh tính được quản lý             |
| `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID`                   | `managedIdentityClientId`        | chỉ dành cho danh tính do người dùng gán      |

## Thao tác thông tin thành viên

OpenClaw cung cấp thao tác `member-info` dựa trên Graph cho Microsoft Teams, để các tác nhân và quy trình tự động hóa có thể phân giải thông tin danh sách thành viên đã xác minh cho một cuộc hội thoại được cấu hình.

Yêu cầu:

- Quyền RSC `ChannelSettings.Read.Group` và `TeamMember.Read.Group` (đã có trong tệp kê khai được khuyến nghị).

Thao tác này khả dụng bất cứ khi nào thông tin xác thực Graph được cấu hình; không có nút bật/tắt `channels.msteams.actions.memberInfo` riêng.
Tra cứu kênh tiêu chuẩn trả về danh tính tương ứng trong danh sách thành viên nhóm, tên hiển thị, email và vai trò.
Trong tin nhắn trực tiếp hoặc cuộc trò chuyện nhóm hiện tại, thao tác có thể trả về ID người dùng ổn định của người gửi đáng tin cậy.
Tra cứu thành viên trong kênh riêng tư/dùng chung và cuộc trò chuyện không phải hiện tại yêu cầu thêm quyền truy cập danh sách thành viên
và bị đường cơ sở quyền mặc định từ chối.

## Ngữ cảnh lịch sử

- `channels.msteams.historyLimit` kiểm soát số lượng tin nhắn kênh/nhóm gần đây được đưa vào lời nhắc. Giá trị dự phòng là `messages.groupChat.historyLimit`, sau đó mặc định là 50. Đặt `0` để tắt.
- Lịch sử luồng đã tìm nạp được lọc theo danh sách người gửi được phép (`allowFrom` / `groupAllowFrom`), vì vậy việc khởi tạo ngữ cảnh luồng chỉ bao gồm tin nhắn từ những người gửi được phép.
- Ngữ cảnh tệp đính kèm được trích dẫn (được phân tích từ HTML theo lược đồ Skype Reply trong chính các tệp đính kèm của thư trả lời) được truyền qua mà không lọc; hiện tại chỉ việc khởi tạo lịch sử luồng áp dụng bộ lọc danh sách người gửi được phép.
- Có thể giới hạn lịch sử tin nhắn trực tiếp bằng `channels.msteams.dmHistoryLimit` (lượt của người dùng). Ghi đè theo từng người dùng: `channels.msteams.dms["<user_id>"].historyLimit`.

## Quyền RSC Teams hiện tại (tệp kê khai)

Đây là các **quyền resourceSpecific hiện có** trong tệp kê khai ứng dụng Teams. Chúng chỉ áp dụng trong nhóm/cuộc trò chuyện nơi ứng dụng được cài đặt.

**Đối với kênh (phạm vi nhóm):**

- `ChannelMessage.Read.Group` (Ứng dụng) - nhận tất cả tin nhắn kênh mà không cần @đề cập
- `ChannelMessage.Send.Group` (Ứng dụng)
- `Member.Read.Group` (Ứng dụng)
- `Owner.Read.Group` (Ứng dụng)
- `ChannelSettings.Read.Group` (Ứng dụng)
- `TeamMember.Read.Group` (Ứng dụng)
- `TeamSettings.Read.Group` (Ứng dụng)

**Đối với cuộc trò chuyện nhóm:**

- `ChatMessage.Read.Chat` (Ứng dụng) - nhận tất cả tin nhắn trò chuyện nhóm mà không cần @đề cập

Thêm quyền RSC qua CLI Teams:

```bash
teams app rsc add <teamsAppId> ChannelMessage.Read.Group --type Application
```

## Tệp kê khai Teams mẫu (đã biên tập)

Ví dụ tối thiểu, hợp lệ với các trường bắt buộc. Thay thế ID và URL.

```json5
{
  $schema: "https://developer.microsoft.com/en-us/json-schemas/teams/v1.23/MicrosoftTeams.schema.json",
  manifestVersion: "1.23",
  version: "1.0.0",
  id: "00000000-0000-0000-0000-000000000000",
  name: { short: "OpenClaw" },
  developer: {
    name: "Tổ chức của bạn",
    websiteUrl: "https://example.com",
    privacyUrl: "https://example.com/privacy",
    termsOfUseUrl: "https://example.com/terms",
  },
  description: { short: "OpenClaw trong Teams", full: "OpenClaw trong Teams" },
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

### Lưu ý về tệp kê khai (các trường bắt buộc)

- `bots[].botId` **phải** khớp với ID ứng dụng Azure Bot.
- `webApplicationInfo.id` **phải** khớp với ID ứng dụng Azure Bot.
- `bots[].scopes` phải bao gồm các bề mặt bạn dự định sử dụng (`personal`, `team`, `groupChat`).
- `bots[].supportsFiles: true` là bắt buộc để xử lý tệp trong phạm vi cá nhân.
- `authorization.permissions.resourceSpecific` phải bao gồm quyền đọc/gửi kênh cho lưu lượng kênh.

### Cập nhật ứng dụng hiện có

```bash
# Tải xuống, chỉnh sửa và tải lại tệp kê khai
teams app manifest download <teamsAppId> manifest.json
# Chỉnh sửa manifest.json cục bộ...
teams app manifest upload manifest.json <teamsAppId>
# Phiên bản được tự động tăng nếu nội dung thay đổi
```

Sau khi cập nhật, hãy cài đặt lại ứng dụng trong từng nhóm và **thoát hoàn toàn rồi khởi chạy lại Teams** (không chỉ đóng cửa sổ) để xóa siêu dữ liệu ứng dụng đã lưu vào bộ nhớ đệm.

<details>
<summary>Cập nhật tệp kê khai thủ công (không dùng CLI)</summary>

1. Cập nhật `manifest.json` với các thiết lập mới.
2. **Tăng trường `version`** (ví dụ: `1.0.0` → `1.1.0`).
3. **Nén lại thành tệp zip** tệp kê khai cùng các biểu tượng (`manifest.json`, `outline.png`, `color.png`).
4. Tải tệp zip mới lên:
   - **Teams Admin Center:** Teams apps → Manage apps → tìm ứng dụng của bạn → Upload new version.
   - **Sideload:** Teams → Apps → Manage your apps → Upload a custom app.

</details>

## Khả năng: chỉ RSC so với Graph

### Với **chỉ Teams RSC** (ứng dụng đã cài đặt, không có quyền Graph API)

Hoạt động:

- Đọc nội dung **văn bản** của tin nhắn kênh.
- Gửi nội dung **văn bản** của tin nhắn kênh.
- Nhận tệp đính kèm trong phạm vi **cá nhân (tin nhắn trực tiếp)**.

KHÔNG hoạt động:

- **Nội dung hình ảnh hoặc tệp** của kênh/nhóm (tải trọng chỉ bao gồm một đoạn HTML giữ chỗ).
- Tải xuống tệp đính kèm được lưu trữ trong SharePoint/OneDrive.
- Đọc lịch sử tin nhắn ngoài sự kiện Webhook trực tiếp.

### Với **Teams RSC + quyền ứng dụng Microsoft Graph**

Bổ sung:

- Tải xuống nội dung được lưu trữ (hình ảnh được dán vào tin nhắn).
- Tải xuống tệp đính kèm được lưu trữ trong SharePoint/OneDrive.
- Đọc lịch sử tin nhắn kênh/cuộc trò chuyện qua Graph.

### RSC so với Graph API

| Khả năng                 | Quyền RSC               | Graph API                                      |
| ------------------------ | ----------------------- | ---------------------------------------------- |
| **Tin nhắn theo thời gian thực** | Có (qua webhook)        | Không (chỉ thăm dò)                            |
| **Tin nhắn lịch sử**     | Không                   | Có (có thể truy vấn lịch sử)                   |
| **Độ phức tạp khi thiết lập** | Chỉ cần manifest ứng dụng | Yêu cầu sự đồng ý của quản trị viên + luồng token |
| **Hoạt động khi ngoại tuyến** | Không (phải đang chạy)  | Có (truy vấn bất cứ lúc nào)                   |

**Kết luận:** RSC dùng để lắng nghe theo thời gian thực; Graph API dùng để truy cập lịch sử. Để truy xuất các tin nhắn bị bỏ lỡ khi ngoại tuyến, bạn cần Graph API với `ChannelMessage.Read.All` (yêu cầu sự đồng ý của quản trị viên).

## Phương tiện + lịch sử hỗ trợ Graph

Chỉ bật các quyền ứng dụng Microsoft Graph cần thiết cho phạm vi Teams và dữ liệu bạn sử dụng:

1. Entra ID (Azure AD) **App Registration** → thêm **Application permissions** của Graph:
   - `ChannelMessage.Read.All` cho tệp đính kèm và lịch sử kênh.
   - `Chat.Read.All` cho tệp đính kèm và lịch sử trò chuyện nhóm.
   - `Files.Read.All` khi phải tải byte của tệp đính kèm xuống từ bộ nhớ SharePoint/OneDrive; các thiết lập chỉ dùng lịch sử không cần quyền này.
2. **Grant admin consent** cho đối tượng thuê.
3. Tăng **manifest version** của ứng dụng Teams, tải lên lại và **cài đặt lại ứng dụng trong Teams**.
4. **Thoát hoàn toàn và khởi chạy lại Teams** để xóa siêu dữ liệu ứng dụng đã lưu trong bộ nhớ đệm.

### Khôi phục tệp kênh/nhóm (`graphMediaFallback`)

Teams có thể xóa các dấu hiệu tệp khỏi hoạt động HTML được gửi đến bot. Trong trường hợp đó, hoạt động Bot Framework không thể phân biệt với một tin nhắn HTML thông thường; tham chiếu tệp đính kèm đầy đủ chỉ tồn tại trong bản sao tin nhắn trên Graph.

Bật phương án dự phòng sau khi cấp các quyền ở trên:

```json5
{
  channels: {
    msteams: {
      graphMediaFallback: true,
    },
  },
}
```

Điều này chỉ áp dụng cho các kênh và cuộc trò chuyện nhóm. Nó thêm một lần tra cứu tin nhắn Graph mỗi khi một hoạt động HTML không tạo ra phương tiện có thể tải xuống trực tiếp, bao gồm cả tin nhắn thông thường hoặc tin nhắn chỉ chứa lượt đề cập. Giá trị mặc định là `false` để các bản cài đặt hiện có không tự động phát sinh thêm lưu lượng Graph hoặc lỗi quyền.

**Đề cập người dùng:** @mentions hoạt động ngay lập tức với những người dùng đã có trong cuộc trò chuyện. Để tự động tìm kiếm và đề cập những người dùng **không có trong cuộc trò chuyện hiện tại**, hãy thêm quyền `User.Read.All` (Application) và cấp sự đồng ý của quản trị viên.

## Các hạn chế đã biết

### Thời gian chờ webhook

Teams gửi tin nhắn qua webhook HTTP. OpenClaw áp dụng thời gian chờ máy chủ HTTP
cố định cho trình lắng nghe webhook đó: 30 giây không hoạt động, tổng thời gian yêu cầu là 30 giây và 15 giây
để nhận tiêu đề. Việc làm giàu ngữ cảnh và phương tiện đầu vào tùy chọn dùng chung
ngân sách 10 giây. SDK trả về sau khi hoạt động thô được nối thêm một cách bền vững;
lượt chạy của tác nhân được xử lý độc lập và chủ động gửi phản hồi. Nếu quá trình
xử lý yêu cầu hoặc tiếp nhận bền vững vượt quá cửa sổ vận chuyển, Teams có thể thử gửi lại
hoạt động và dấu mốc loại bỏ ở đầu vào sẽ từ chối ID sự kiện bị lặp lại.

### Hỗ trợ đám mây Teams và URL dịch vụ

Đường dẫn Teams dựa trên SDK này được xác thực trực tiếp cho đám mây công cộng Microsoft Teams.

Các phản hồi đầu vào sử dụng ngữ cảnh lượt chạy SDK Teams của tin nhắn đến. Các thao tác chủ động ngoài ngữ cảnh — gửi, chỉnh sửa, xóa, thẻ, cuộc thăm dò, tin nhắn đồng ý nhận tệp và phản hồi chạy dài trong hàng đợi — sử dụng tham chiếu cuộc trò chuyện đã lưu `serviceUrl`. Đám mây công cộng mặc định dùng môi trường đám mây công cộng của SDK Teams và cho phép các tham chiếu đã lưu trên máy chủ Teams Connector công cộng: `https://smba.trafficmanager.net/`.

Đám mây công cộng là mặc định. Bạn không cần đặt `channels.msteams.cloud` hoặc `channels.msteams.serviceUrl` cho các bot đám mây công cộng thông thường.

Đối với các đám mây Teams không công khai, hãy đặt `cloud` và ranh giới chủ động tương ứng khi Microsoft công bố:

- `channels.msteams.cloud` chọn cấu hình đặt sẵn đám mây SDK Teams cho việc xác thực, xác thực JWT, dịch vụ token và phạm vi Graph.
- `channels.msteams.serviceUrl` chọn ranh giới điểm cuối Bot Connector dùng để xác thực các tham chiếu cuộc trò chuyện đã lưu trước khi thực hiện các thao tác chủ động như gửi, chỉnh sửa, xóa, thẻ, cuộc thăm dò, tin nhắn đồng ý nhận tệp và phản hồi chạy dài trong hàng đợi. Thiết lập này là bắt buộc đối với các đám mây SDK USGov và DoD. Đối với China/21Vianet, OpenClaw sử dụng cấu hình đặt sẵn `China` của SDK và chỉ chấp nhận URL dịch vụ đã lưu/được cấu hình trên các máy chủ kênh Azure China Bot Framework.

Microsoft công bố các điểm cuối Bot Connector chủ động toàn cầu trong phần [Tạo cuộc trò chuyện](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages?tabs=dotnet#create-the-conversation) của tài liệu nhắn tin chủ động Teams. Sử dụng `serviceUrl` của hoạt động đến khi có; nếu không, hãy sử dụng bảng của Microsoft bên dưới.

| Môi trường Teams | Cấu hình OpenClaw                                             | `serviceUrl` chủ động                             |
| ---------------- | ------------------------------------------------------------- | ------------------------------------------------------- |
| Công cộng        | không cần cấu hình cloud/serviceUrl                           | `https://smba.trafficmanager.net/teams`                                      |
| GCC              | đặt `serviceUrl`; không có cấu hình đặt sẵn đám mây SDK Teams riêng | `https://smba.infra.gcc.teams.microsoft.com/teams` |
| GCC High         | `cloud: "USGov"` + `serviceUrl`                      | `https://smba.infra.gov.teams.microsoft.us/teams`                                      |
| DoD              | `cloud: "USGovDoD"` + `serviceUrl`                      | `https://smba.infra.dod.teams.microsoft.us/teams`                                      |
| China/21Vianet   | `cloud: "China"`                                            | sử dụng `serviceUrl` của hoạt động đến            |

Ví dụ cho GCC, nơi Microsoft ghi nhận một URL dịch vụ chủ động riêng nhưng SDK Teams không cung cấp cấu hình đặt sẵn đám mây GCC riêng:

```json
{
  "channels": {
    "msteams": {
      "serviceUrl": "https://smba.infra.gcc.teams.microsoft.com/teams"
    }
  }
}
```

Ví dụ cho GCC High:

```json
{
  "channels": {
    "msteams": {
      "cloud": "USGov",
      "serviceUrl": "https://smba.infra.gov.teams.microsoft.us/teams"
    }
  }
}
```

`channels.msteams.serviceUrl` bị giới hạn ở các máy chủ Microsoft Teams Bot Connector được hỗ trợ. Khi URL dịch vụ được cấu hình, OpenClaw kiểm tra rằng `serviceUrl` của cuộc trò chuyện đã lưu sử dụng cùng một máy chủ trước khi thực hiện các thao tác chủ động như gửi, chỉnh sửa, xóa, thẻ, cuộc thăm dò hoặc phản hồi chạy dài trong hàng đợi. Với cấu hình đám mây công cộng mặc định, OpenClaw sẽ đóng an toàn nếu một cuộc trò chuyện đã lưu trỏ ra ngoài máy chủ Teams Connector công cộng. Hãy nhận một tin nhắn mới từ cuộc trò chuyện sau khi thay đổi cài đặt đám mây/URL dịch vụ để tham chiếu cuộc trò chuyện đã lưu được cập nhật.

China/21Vianet không có URL `smba` chủ động toàn cầu riêng trong bảng điểm cuối chủ động Teams của Microsoft. Cấu hình `cloud: "China"` để SDK Teams sử dụng các điểm cuối xác thực, token và JWT của Azure China. Sau đó, các thao tác gửi chủ động yêu cầu một tham chiếu cuộc trò chuyện đã lưu từ hoạt động China Teams đến hoặc một URL dịch vụ được cấu hình rõ ràng trên ranh giới kênh Azure China Bot Framework (`*.botframework.azure.cn`). Các trình trợ giúp Teams dựa trên Graph bị vô hiệu hóa đối với `cloud: "China"` cho đến khi OpenClaw định tuyến các yêu cầu Graph qua điểm cuối Azure China Graph.

### Định dạng

Markdown của Teams bị hạn chế hơn Slack hoặc Discord:

- Định dạng cơ bản hoạt động: **in đậm**, _in nghiêng_, `code`, liên kết.
- Markdown phức tạp (bảng, danh sách lồng nhau) có thể không hiển thị chính xác.
- Adaptive Cards được hỗ trợ cho các cuộc thăm dò và thao tác gửi trình bày ngữ nghĩa (xem bên dưới).

## Cấu hình

Các cài đặt chính (xem [/gateway/configuration](/vi/gateway/configuration) để biết các mẫu kênh dùng chung):

- `channels.msteams.enabled`: bật/tắt kênh.
- `channels.msteams.appId`, `channels.msteams.appPassword`, `channels.msteams.tenantId`: thông tin xác thực của bot.
- `channels.msteams.cloud`: môi trường đám mây của Teams SDK (`Public`, `USGov`, `USGovDoD` hoặc `China`; mặc định `Public`). Đặt bằng `serviceUrl` cho các đám mây SDK USGov/DoD; Trung Quốc sử dụng cấu hình đặt sẵn của SDK và các tham chiếu hội thoại Azure China Bot Framework đã lưu, trong đó các trình trợ giúp dựa trên Graph bị tắt cho đến khi tính năng định tuyến Azure China Graph được phát hành.
- `channels.msteams.serviceUrl`: ranh giới URL dịch vụ Bot Connector cho các thao tác chủ động của SDK. Đám mây công cộng sử dụng giá trị mặc định của SDK; hãy đặt cho GCC (`https://smba.infra.gcc.teams.microsoft.com/teams`), GCC High hoặc DoD. Trung Quốc chấp nhận các máy chủ kênh Azure China Bot Framework khi tham chiếu hội thoại đã lưu đến từ Teams do 21Vianet vận hành.
- `channels.msteams.webhook.port` (mặc định `3978`).
- `channels.msteams.webhook.path` (mặc định `/api/messages`).
- `channels.msteams.dmPolicy`: `pairing | allowlist | open | disabled` (mặc định `pairing`).
- `channels.msteams.allowFrom`: danh sách cho phép DM (khuyến nghị dùng ID đối tượng AAD). Trình hướng dẫn phân giải tên thành ID trong quá trình thiết lập khi có quyền truy cập Graph.
- `channels.msteams.dangerouslyAllowNameMatching`: nút chuyển khẩn cấp để bật lại việc đối sánh UPN/tên hiển thị có thể thay đổi và định tuyến trực tiếp theo tên nhóm/kênh.
- `channels.msteams.textChunkLimit`: kích thước đoạn văn bản gửi đi tính bằng ký tự (mặc định `4000` và bị giới hạn cứng ở `4000` bất kể giá trị cấu hình cao hơn).
- `channels.msteams.streaming.chunkMode`: `length` (mặc định) hoặc `newline` để tách tại các dòng trống (ranh giới đoạn văn) trước khi chia đoạn theo độ dài.
- `channels.msteams.mediaAllowHosts`: danh sách cho phép các máy chủ tệp đính kèm gửi đến (mặc định là các miền Microsoft/Teams: Graph, SharePoint/OneDrive, Teams CDN, Bot Framework, Azure Media Services).
- `channels.msteams.mediaAuthAllowHosts`: danh sách cho phép đính kèm tiêu đề Authorization khi thử tải lại phương tiện (mặc định là các máy chủ Graph + Bot Framework).
- `channels.msteams.graphMediaFallback`: chọn sử dụng tính năng tra cứu tin nhắn Graph khi HTML của kênh/nhóm không có dấu tệp (mặc định `false`; xem [Khôi phục tệp của kênh/nhóm](#channelgroup-file-recovery-graphmediafallback)).
- `channels.msteams.mediaMaxMb`: ghi đè giới hạn kích thước phương tiện theo từng kênh, tính bằng MB. Dùng giá trị dự phòng `agents.defaults.mediaMaxMb` khi chưa đặt.
- `channels.msteams.requireMention`: yêu cầu @đề cập trong kênh/nhóm (mặc định `true`).
- `channels.msteams.replyStyle`: `thread | top-level` (xem [Kiểu trả lời](#reply-style-threads-vs-posts)).
- `channels.msteams.teams.<teamId>.replyStyle`: ghi đè theo từng nhóm.
- `channels.msteams.teams.<teamId>.requireMention`: ghi đè theo từng nhóm.
- `channels.msteams.teams.<teamId>.tools`: các ghi đè chính sách công cụ mặc định theo từng nhóm (`allow`/`deny`/`alsoAllow`) được dùng khi thiếu ghi đè cho kênh.
- `channels.msteams.teams.<teamId>.toolsBySender`: các ghi đè chính sách công cụ mặc định theo từng nhóm và từng người gửi (hỗ trợ ký tự đại diện `"*"`).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`: ghi đè theo từng kênh.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.requireMention`: ghi đè theo từng kênh.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.tools`: các ghi đè chính sách công cụ theo từng kênh (`allow`/`deny`/`alsoAllow`).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.toolsBySender`: các ghi đè chính sách công cụ theo từng kênh và từng người gửi (hỗ trợ ký tự đại diện `"*"`).
- `toolsBySender` nên sử dụng các tiền tố rõ ràng cho khóa: `channel:`, `id:`, `e164:`, `username:`, `name:` (các khóa cũ không có tiền tố vẫn chỉ ánh xạ tới `id:`).
- `channels.msteams.authType`: loại xác thực - `"secret"` (mặc định) hoặc `"federated"`.
- `channels.msteams.certificatePath`: đường dẫn tới tệp chứng chỉ PEM (xác thực liên kết + chứng chỉ).
- `channels.msteams.certificateThumbprint`: dấu vân tay chứng chỉ; được chấp nhận nhưng không bắt buộc để xác thực.
- `channels.msteams.useManagedIdentity`: bật xác thực danh tính được quản lý (chế độ liên kết).
- `channels.msteams.managedIdentityClientId`: ID máy khách cho danh tính được quản lý do người dùng gán.
- `channels.msteams.sharePointSiteId`: ID site SharePoint để tải tệp lên trong cuộc trò chuyện nhóm/kênh (xem [Gửi tệp trong cuộc trò chuyện nhóm](#sending-files-in-group-chats)).
- `channels.msteams.welcomeCard`, `channels.msteams.groupWelcomeCard`, `channels.msteams.promptStarters`: Adaptive Card chào mừng được hiển thị trong lần liên hệ DM/nhóm đầu tiên và các nút lời nhắc đề xuất của thẻ.
- `channels.msteams.responsePrefix`: văn bản được thêm vào đầu các câu trả lời gửi đi.
- `channels.msteams.feedbackEnabled` (mặc định `true`), `channels.msteams.feedbackReflection` (mặc định `true`), `channels.msteams.feedbackReflectionCooldownMs`: phản hồi thích/không thích đối với câu trả lời và bước tiếp nối tự đánh giá khi nhận phản hồi tiêu cực.
- `channels.msteams.sso`, `channels.msteams.delegatedAuth`: kết nối OAuth của Bot Framework và các phạm vi Graph được ủy quyền cho luồng dựa trên SSO; `sso.enabled: true` yêu cầu `sso.connectionName`.

## Định tuyến và phiên

- Khóa phiên tuân theo định dạng tác nhân tiêu chuẩn (xem [/concepts/session](/vi/concepts/session)):
  - Tin nhắn trực tiếp dùng chung phiên chính (`agent:<agentId>:<mainKey>`).
  - Tin nhắn kênh/nhóm sử dụng ID hội thoại:
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## Kiểu trả lời: luồng so với bài đăng

Teams có hai kiểu giao diện người dùng cho kênh trên cùng một mô hình dữ liệu nền tảng:

| Kiểu                     | Mô tả                                                      | `replyStyle` được khuyến nghị |
| ------------------------ | ---------------------------------------------------------- | ------------------------ |
| **Bài đăng** (cổ điển)   | Tin nhắn xuất hiện dưới dạng thẻ với các câu trả lời theo luồng bên dưới | `thread` (mặc định)       |
| **Luồng** (giống Slack)  | Tin nhắn chạy tuyến tính, tương tự Slack hơn                | `top-level`              |

**Vấn đề:** API Teams không cho biết kênh sử dụng kiểu giao diện người dùng nào. Nếu sử dụng sai `replyStyle`:

- `thread` trong kênh kiểu Luồng → câu trả lời bị lồng vào nhau một cách vụng về.
- `top-level` trong kênh kiểu Bài đăng → câu trả lời xuất hiện dưới dạng các bài đăng cấp cao nhất riêng biệt thay vì nằm trong luồng.

**Giải pháp:** cấu hình `replyStyle` theo từng kênh dựa trên cách thiết lập kênh:

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

Khi bot gửi câu trả lời vào một kênh, `replyStyle` được phân giải từ ghi đè cụ thể nhất xuống giá trị mặc định. Giá trị đầu tiên không phải `undefined` sẽ được sử dụng:

1. **Theo từng kênh** - `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`
2. **Theo từng nhóm** - `channels.msteams.teams.<teamId>.replyStyle`
3. **Toàn cục** - `channels.msteams.replyStyle`
4. **Mặc định ngầm định** - được suy ra từ `requireMention`:
   - `requireMention: true` → `thread`
   - `requireMention: false` → `top-level`

Nếu đặt `requireMention: false` toàn cục mà không có `replyStyle` rõ ràng, các lượt đề cập trong kênh kiểu Bài đăng sẽ xuất hiện dưới dạng bài đăng cấp cao nhất ngay cả khi tin nhắn gửi đến là câu trả lời trong luồng. Cố định `replyStyle: "thread"` ở cấp toàn cục, nhóm hoặc kênh để tránh kết quả ngoài dự kiến.

Đối với lượt gửi chủ động vào hội thoại kênh đã lưu (câu trả lời cho lệnh gọi công cụ trong hàng đợi, tác nhân chạy lâu), quy tắc phân giải nhóm/kênh tương tự được áp dụng; các cuộc trò chuyện nhóm và hội thoại cá nhân (DM) luôn được phân giải thành `top-level` cho lượt gửi chủ động, bất kể `replyStyle`.

### Bảo toàn ngữ cảnh luồng

Khi `replyStyle: "thread"` có hiệu lực và bot được @đề cập từ bên trong một luồng của kênh, OpenClaw gắn lại gốc luồng ban đầu vào tham chiếu hội thoại gửi đi (`19:...@thread.tacv2;messageid=<root>`) để câu trả lời được đưa vào cùng luồng. Điều này áp dụng cho cả lượt gửi trực tiếp (trong lượt) và lượt gửi chủ động được thực hiện sau khi ngữ cảnh lượt của Bot Framework đã hết hạn (ví dụ: tác nhân chạy lâu, câu trả lời cho lệnh gọi công cụ trong hàng đợi qua `mcp__openclaw__message`).

Gốc luồng được lấy từ `threadId` đã lưu trên tham chiếu hội thoại. Các tham chiếu cũ được lưu trước khi có `threadId` sẽ dùng giá trị dự phòng `activityId` (hoạt động gửi đến gần nhất đã khởi tạo hội thoại), nhờ đó các bản triển khai hiện có tiếp tục hoạt động mà không cần khởi tạo lại.

Khi `replyStyle: "top-level"` có hiệu lực, các tin nhắn gửi đến trong luồng của kênh được chủ ý trả lời dưới dạng bài đăng cấp cao nhất mới; không có hậu tố luồng nào được đính kèm. Đây là hành vi chính xác đối với kênh kiểu Luồng; nếu xuất hiện bài đăng cấp cao nhất trong khi mong đợi câu trả lời theo luồng, thì `replyStyle` đã được đặt không chính xác cho kênh đó.

## Tệp đính kèm và hình ảnh

**Các hạn chế hiện tại:**

- **DM:** hình ảnh và tệp đính kèm hoạt động thông qua API tệp bot của Teams.
- **Kênh/nhóm:** tệp đính kèm nằm trong bộ nhớ M365 (SharePoint/OneDrive). Tải trọng Webhook chỉ chứa một phần giữ chỗ HTML, không chứa byte thực tế của tệp. **Cần có quyền API Graph** để tải tệp đính kèm của kênh xuống.
- Đối với lượt gửi ưu tiên tệp một cách rõ ràng, hãy sử dụng `action=upload-file` với `media` / `filePath` / `path`; `message` tùy chọn trở thành văn bản/nhận xét đi kèm và `filename` (hoặc `title`) ghi đè tên tệp đã tải lên.

Nếu không có quyền Graph, tin nhắn kênh chứa hình ảnh sẽ chỉ đến dưới dạng văn bản (bot không thể truy cập nội dung hình ảnh).
Theo mặc định, OpenClaw chỉ tải phương tiện xuống từ tên máy chủ Microsoft/Teams. Ghi đè bằng `channels.msteams.mediaAllowHosts` (sử dụng `["*"]` để cho phép mọi máy chủ).
Tiêu đề Authorization chỉ được đính kèm cho các máy chủ trong `channels.msteams.mediaAuthAllowHosts` (mặc định là các máy chủ Graph + Bot Framework). Giữ danh sách này nghiêm ngặt (tránh các hậu tố đa đối tượng thuê).

## Gửi tệp trong cuộc trò chuyện nhóm

Bot có thể gửi tệp trong DM bằng luồng FileConsentCard tích hợp sẵn. **Gửi tệp trong cuộc trò chuyện nhóm/kênh** yêu cầu thiết lập bổ sung:

| Ngữ cảnh                 | Cách gửi tệp                                  | Thiết lập cần thiết                              |
| ------------------------ | --------------------------------------------- | ------------------------------------------------ |
| **DM**                   | FileConsentCard → người dùng chấp nhận → bot tải lên | Hoạt động ngay mà không cần thiết lập thêm       |
| **Cuộc trò chuyện nhóm/kênh** | Tải lên SharePoint → thẻ tệp gốc          | Yêu cầu `sharePointSiteId` + quyền Graph         |
| **Hình ảnh (mọi ngữ cảnh)** | Nội tuyến được mã hóa Base64                | Hoạt động ngay mà không cần thiết lập thêm       |

### Tại sao cuộc trò chuyện nhóm cần SharePoint

Bot sử dụng danh tính ứng dụng, trong khi tài nguyên `/me` của Microsoft Graph [yêu cầu người dùng đã đăng nhập](https://learn.microsoft.com/en-us/graph/api/user-get?view=graph-rest-1.0). Để gửi tệp trong cuộc trò chuyện nhóm/kênh, bot tải tệp lên một **site SharePoint** và tạo liên kết chia sẻ.

### Thiết lập

1. **Thêm quyền API Graph** trong Entra ID (Azure AD) → App Registration:
   - `Sites.ReadWrite.All` (Application) - tải tệp lên SharePoint.
   - `ChatMember.Read.All` (Application) - quyền tối thiểu trên toàn đối tượng thuê để gửi tệp trong cuộc trò chuyện nhóm. `Chat.Read.All` cũng hoạt động và đã bao gồm chức năng này khi lịch sử trò chuyện nhóm được bật. Để thay thế theo từng cuộc trò chuyện, hãy sử dụng [quyền chấp thuận dành riêng cho tài nguyên](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent) `ChatMember.Read.Chat`.
2. **Cấp sự chấp thuận của quản trị viên** cho đối tượng thuê.
3. **Lấy ID site SharePoint:**

   ```bash
   # Qua Graph Explorer hoặc curl với token hợp lệ:
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/{hostname}:/{site-path}"

   # Ví dụ: đối với một site tại "contoso.sharepoint.com/sites/BotFiles"
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com:/sites/BotFiles"

   # Phản hồi bao gồm: "id": "contoso.sharepoint.com,guid1,guid2"
   ```

4. **Cấu hình OpenClaw:**

   ```json5
   {
     channels: {
       msteams: {
         // ... cấu hình khác ...
         sharePointSiteId: "contoso.sharepoint.com,guid1,guid2",
       },
     },
   }
   ```

### Hành vi chia sẻ

| Ngữ cảnh và quyền                                                        | Hành vi chia sẻ                                                   |
| ----------------------------------------------------------------------- | ---------------------------------------------------------------- |
| Kênh + `Sites.ReadWrite.All`                                              | Liên kết chia sẻ trong toàn tổ chức (mọi người trong tổ chức đều có thể truy cập) |
| Trò chuyện nhóm + `Sites.ReadWrite.All` + quyền đọc thành viên trò chuyện được hỗ trợ | Liên kết chia sẻ theo người dùng (chỉ thành viên trò chuyện có thể truy cập) |
| Trò chuyện nhóm không có quyền đọc thành viên trò chuyện được hỗ trợ     | Gửi thất bại theo cơ chế đóng an toàn                             |

Chia sẻ theo người dùng an toàn hơn vì chỉ những người tham gia trò chuyện mới có thể truy cập tệp. OpenClaw yêu cầu tra cứu thành viên thành công đối với trò chuyện nhóm; khi hết thời gian chờ, xảy ra lỗi truyền tải, kết quả trống hoặc Graph API từ chối, thao tác gửi sẽ thất bại thay vì mở rộng quyền truy cập cho toàn tổ chức.

### Hành vi dự phòng

| Tình huống                                                       | Kết quả                                          |
| ---------------------------------------------------------------- | ------------------------------------------------ |
| Trò chuyện nhóm + tệp + đã cấu hình quyền SharePoint và thành viên | Tải lên SharePoint, gửi thẻ tệp gốc              |
| Trò chuyện nhóm + tệp + thiếu quyền SharePoint hoặc thành viên   | Thất bại với lỗi cấu hình có hướng dẫn xử lý     |
| Kênh + tệp + đã cấu hình `sharePointSiteId`                      | Tải lên SharePoint, gửi thẻ tệp gốc              |
| Trò chuyện cá nhân + tệp                                         | Luồng FileConsentCard (hoạt động không cần SharePoint) |
| Mọi ngữ cảnh + hình ảnh                                          | Nội tuyến được mã hóa Base64 (hoạt động không cần SharePoint) |

### Vị trí lưu trữ tệp

Các tệp đã tải lên được lưu trong thư mục `/OpenClawShared/` thuộc thư viện tài liệu mặc định của site SharePoint đã cấu hình.

## Cuộc thăm dò ý kiến (Adaptive Cards)

OpenClaw gửi các cuộc thăm dò ý kiến trên Teams dưới dạng Adaptive Cards (Teams không có API thăm dò ý kiến gốc).

- CLI: `openclaw message poll --channel msteams --target conversation:<id> --poll-question "..." --poll-option "..." --poll-option "..."`.
- Gateway ghi nhận phiếu bầu trong SQLite trạng thái Plugin của OpenClaw tại `state/openclaw.sqlite`.
- Các tệp `msteams-polls.json` hiện có được nhập bởi `openclaw doctor --fix`, không phải bởi Plugin đang chạy.
- Gateway phải duy trì trực tuyến để ghi nhận phiếu bầu.
- Các cuộc thăm dò ý kiến không tự động đăng bản tóm tắt kết quả và hiện chưa có CLI kết quả thăm dò ý kiến.

## Thẻ trình bày

Gửi payload trình bày ngữ nghĩa đến người dùng hoặc cuộc trò chuyện Teams bằng công cụ `message`, CLI hoặc cơ chế gửi phản hồi thông thường. OpenClaw kết xuất chúng thành Teams Adaptive Cards từ hợp đồng trình bày chung.

Tham số `presentation` chấp nhận các khối ngữ nghĩa. Khi cung cấp `presentation`, văn bản tin nhắn là tùy chọn. Các nút được kết xuất thành hành động gửi hoặc URL của Adaptive Card. Menu chọn không phải thành phần gốc trong bộ kết xuất Teams, vì vậy OpenClaw chuyển chúng thành văn bản dễ đọc trước khi gửi.

**Công cụ agent:**

```json5
{
  action: "send",
  channel: "msteams",
  target: "user:<id>",
  presentation: {
    title: "Xin chào",
    blocks: [{ type: "text", text: "Xin chào!" }],
  },
}
```

**CLI:**

```bash
openclaw message send --channel msteams \
  --target "conversation:19:abc...@thread.tacv2" \
  --presentation '{"title":"Xin chào","blocks":[{"type":"text","text":"Xin chào!"}]}'
```

Để biết chi tiết về định dạng đích, xem [Định dạng đích](#target-formats) bên dưới.

## Định dạng đích

Các đích MSTeams sử dụng tiền tố để phân biệt người dùng và cuộc trò chuyện:

| Loại đích           | Định dạng                        | Ví dụ                                                                                                  |
| ------------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Người dùng (theo ID) | `user:<aad-object-id>`              | `user:40a1a0ed-4ff2-4164-a219-55518990c197`                                                                                     |
| Người dùng (theo tên) | `user:<display-name>`             | `user:John Smith` (yêu cầu Graph API)                                                                 |
| Nhóm/kênh           | `conversation:<conversation-id>`               | `conversation:19:abc123...@thread.tacv2`                                                                                     |
| Nhóm/kênh (thô)     | `<conversation-id>`               | `19:abc123...@thread.tacv2`, `19:...@unq.gbl.spaces`, hoặc một id Bot Framework `a:`/`8:orgid:`/`29:` thuần túy |

**Ví dụ CLI:**

```bash
# Gửi đến người dùng theo ID
openclaw message send --channel msteams --target "user:40a1a0ed-..." --message "Xin chào"

# Gửi đến người dùng theo tên hiển thị (kích hoạt tra cứu Graph API)
openclaw message send --channel msteams --target "user:John Smith" --message "Xin chào"

# Gửi đến trò chuyện nhóm hoặc kênh
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" --message "Xin chào"

# Gửi thẻ trình bày đến một cuộc trò chuyện
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" \
  --presentation '{"title":"Xin chào","blocks":[{"type":"text","text":"Xin chào"}]}'
```

**Ví dụ công cụ agent:**

```json5
{
  action: "send",
  channel: "msteams",
  target: "user:John Smith",
  message: "Xin chào!",
}
```

```json5
{
  action: "send",
  channel: "msteams",
  target: "conversation:19:abc...@thread.tacv2",
  presentation: {
    title: "Xin chào",
    blocks: [{ type: "text", text: "Xin chào" }],
  },
}
```

<Note>
Nếu không có tiền tố `user:`, tên sẽ mặc định được phân giải thành nhóm hoặc nhóm Teams. Luôn sử dụng `user:` khi nhắm đến người dùng theo tên hiển thị.
</Note>

## Nhắn tin chủ động

- Chỉ có thể gửi tin nhắn chủ động **sau khi** người dùng đã tương tác, vì OpenClaw lưu tham chiếu cuộc trò chuyện tại thời điểm đó.
- Xem [/gateway/configuration](/vi/gateway/configuration) để biết `dmPolicy` và cơ chế kiểm soát bằng danh sách cho phép.

## ID nhóm Teams và kênh (Lỗi thường gặp)

Tham số truy vấn `groupId` trong URL Teams **KHÔNG** phải là ID nhóm Teams dùng để cấu hình. Thay vào đó, hãy trích xuất ID từ đường dẫn URL:

**URL nhóm Teams:**

```text
https://teams.microsoft.com/l/team/19%3ABk4j...%40thread.tacv2/conversations?groupId=...
                                    └────────────────────────────┘
                                    ID cuộc trò chuyện nhóm Teams (giải mã URL giá trị này)
```

**URL kênh:**

```text
https://teams.microsoft.com/l/channel/19%3A15bc...%40thread.tacv2/ChannelName?groupId=...
                                      └─────────────────────────┘
                                      ID kênh (giải mã URL giá trị này)
```

**Đối với cấu hình:**

- Khóa nhóm Teams = phân đoạn đường dẫn sau `/team/` (đã giải mã URL, ví dụ: `19:Bk4j...@thread.tacv2`; các tenant cũ hơn có thể hiển thị `@thread.skype`, giá trị này cũng hợp lệ).
- Khóa kênh = phân đoạn đường dẫn sau `/channel/` (đã giải mã URL).
- **Bỏ qua** tham số truy vấn `groupId` khi định tuyến OpenClaw. Đây là ID nhóm Microsoft Entra, không phải ID cuộc trò chuyện Bot Framework được sử dụng trong các hoạt động Teams đến.

## Kênh riêng tư

Bot chỉ được hỗ trợ hạn chế trong các kênh riêng tư:

| Tính năng                    | Kênh tiêu chuẩn     | Kênh riêng tư          |
| ---------------------------- | ------------------- | ---------------------- |
| Cài đặt bot                  | Có                  | Hạn chế                |
| Tin nhắn thời gian thực (webhook) | Có             | Có thể không hoạt động |
| Quyền RSC                    | Có                  | Có thể hoạt động khác  |
| @lượt đề cập                 | Có                  | Nếu có thể truy cập bot |
| Lịch sử Graph API            | Có                  | Có (khi có quyền)      |

**Giải pháp thay thế nếu kênh riêng tư không hoạt động:**

1. Sử dụng kênh tiêu chuẩn để tương tác với bot.
2. Sử dụng tin nhắn trực tiếp; người dùng luôn có thể nhắn tin trực tiếp cho bot.
3. Sử dụng Graph API để truy cập lịch sử (yêu cầu `ChannelMessage.Read.All`).

## Khắc phục sự cố

### Các sự cố thường gặp

- **Hình ảnh không hiển thị trong kênh:** thiếu quyền Graph hoặc sự đồng ý của quản trị viên. Cài đặt lại ứng dụng Teams, sau đó thoát hoàn toàn và mở lại Teams.
- **Không có phản hồi trong kênh:** theo mặc định, bắt buộc phải đề cập; đặt `channels.msteams.requireMention=false` hoặc cấu hình theo từng nhóm Teams/kênh.
- **Phiên bản không khớp (Teams vẫn hiển thị manifest cũ):** xóa rồi thêm lại ứng dụng và thoát hoàn toàn khỏi Teams để làm mới.
- **Webhook trả về 401 Unauthorized:** đây là hành vi dự kiến khi kiểm thử thủ công mà không có Azure JWT; điều đó có nghĩa là có thể truy cập endpoint nhưng xác thực thất bại. Sử dụng Azure Web Chat để kiểm thử đúng cách.

### Lỗi tải manifest lên

- **"Icon file cannot be empty":** manifest tham chiếu đến các tệp biểu tượng có kích thước 0 byte. Tạo các biểu tượng PNG hợp lệ (32x32 cho `outline.png`, 192x192 cho `color.png`).
- **"webApplicationInfo.Id already in use":** ứng dụng vẫn được cài đặt trong một nhóm Teams/cuộc trò chuyện khác. Trước tiên, hãy tìm và gỡ cài đặt ứng dụng đó hoặc chờ 5-10 phút để thay đổi được truyền bá.
- **"Something went wrong" khi tải lên:** thay vào đó, hãy tải lên qua [https://admin.teams.microsoft.com](https://admin.teams.microsoft.com), mở DevTools của trình duyệt (F12) → thẻ Network và kiểm tra nội dung phản hồi để xem lỗi thực tế.
- **Tải ngoài thất bại:** thử "Upload an app to your org's app catalog" thay vì "Upload a custom app"; cách này thường bỏ qua các hạn chế tải ngoài.

### Quyền RSC không hoạt động

1. Xác minh `webApplicationInfo.id` khớp chính xác với App ID của bot.
2. Tải lại ứng dụng lên và cài đặt lại trong nhóm Teams/cuộc trò chuyện.
3. Kiểm tra xem quản trị viên tổ chức có chặn quyền RSC hay không.
4. Xác nhận bạn đang sử dụng đúng phạm vi: `ChannelMessage.Read.Group` cho nhóm Teams, `ChatMessage.Read.Chat` cho trò chuyện nhóm.

## Tài liệu tham khảo

- [Tạo Azure Bot](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) - hướng dẫn thiết lập Azure Bot
- [Teams Developer Portal](https://dev.teams.microsoft.com/apps) - tạo/quản lý ứng dụng Teams
- [Lược đồ manifest ứng dụng Teams](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [Nhận tin nhắn kênh bằng RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/channel-messages-with-rsc)
- [Tài liệu tham khảo về quyền RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)
- [Xử lý tệp của bot Teams](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bots-filesv4) (kênh/nhóm yêu cầu Graph)
- [Nhắn tin chủ động](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)
- [@microsoft/teams.cli](https://www.npmjs.com/package/@microsoft/teams.cli) - CLI Teams để quản lý bot

## Liên quan

- [Tổng quan về kênh](/vi/channels) - tất cả các kênh được hỗ trợ
- [Ghép nối](/vi/channels/pairing) - xác thực DM và luồng ghép nối
- [Nhóm](/vi/channels/groups) - hành vi trò chuyện nhóm và cơ chế kiểm soát bằng lượt đề cập
- [Định tuyến kênh](/vi/channels/channel-routing) - định tuyến phiên cho tin nhắn
- [Bảo mật](/vi/gateway/security) - mô hình truy cập và tăng cường bảo mật
