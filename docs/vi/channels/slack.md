---
read_when:
    - Thiết lập Slack hoặc gỡ lỗi chế độ socket, HTTP hay chuyển tiếp của Slack
summary: Thiết lập Slack và hành vi thời gian chạy (Socket Mode, URL yêu cầu HTTP và chế độ chuyển tiếp)
title: Slack
x-i18n:
    generated_at: "2026-07-16T14:05:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: b0b3c4ddcd4ea46448bf4fcba4713a92cd487a3ab69077f6b808fbcc65608c7f
    source_path: channels/slack.md
    workflow: 16
---

Hỗ trợ Slack bao gồm tin nhắn trực tiếp và kênh thông qua các tích hợp ứng dụng Slack. Phương thức truyền tải mặc định là Socket Mode; HTTP Request URLs cũng được hỗ trợ. Chế độ chuyển tiếp dành cho các triển khai được quản lý, trong đó một bộ định tuyến đáng tin cậy sở hữu luồng dữ liệu Slack đi vào.

<CardGroup cols={3}>
  <Card title="Ghép nối" icon="link" href="/vi/channels/pairing">
    Tin nhắn trực tiếp trên Slack mặc định sử dụng chế độ ghép nối.
  </Card>
  <Card title="Lệnh gạch chéo" icon="terminal" href="/vi/tools/slash-commands">
    Hành vi lệnh gốc và danh mục lệnh.
  </Card>
  <Card title="Khắc phục sự cố kênh" icon="wrench" href="/vi/channels/troubleshooting">
    Quy trình chẩn đoán và sửa chữa trên nhiều kênh.
  </Card>
</CardGroup>

## Chọn phương thức truyền tải

Socket Mode và HTTP Request URLs có mức độ hỗ trợ tính năng tương đương đối với nhắn tin, lệnh gạch chéo, App Home và tính năng tương tác. Hãy chọn theo mô hình triển khai, không phải theo tính năng.

| Yếu tố cần cân nhắc          | Socket Mode (mặc định)                                                                                                                               | HTTP Request URLs                                                                                              |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| URL Gateway công khai        | Không bắt buộc                                                                                                                                       | Bắt buộc (DNS, TLS, proxy ngược hoặc đường hầm)                                                                |
| Mạng đi                      | Phải có thể truy cập WSS đi tới `wss-primary.slack.com`                                                                                                   | Không có WS đi; chỉ có HTTPS vào                                                                               |
| Token cần thiết              | Token bot + App-Level Token có `connections:write`                                                                                                    | Token bot + Signing Secret                                                                                     |
| Laptop phát triển / sau tường lửa | Hoạt động ngay                                                                                                                                    | Cần đường hầm công khai (ngrok, Cloudflare Tunnel, Tailscale Funnel) hoặc Gateway thử nghiệm                   |
| Mở rộng theo chiều ngang     | Một phiên Socket Mode cho mỗi ứng dụng trên mỗi máy chủ; nhiều Gateway cần các ứng dụng Slack riêng biệt                                             | Trình xử lý POST không trạng thái; nhiều bản sao Gateway có thể dùng chung một ứng dụng phía sau bộ cân bằng tải |
| Nhiều tài khoản trên một Gateway | Được hỗ trợ; mỗi tài khoản mở WS riêng                                                                                                           | Được hỗ trợ; mỗi tài khoản cần một `webhookPath` duy nhất (mặc định `/slack/events`) để các đăng ký không xung đột |
| Phương thức truyền tải lệnh gạch chéo | Được gửi qua kết nối WS; `slash_commands[].url` bị bỏ qua                                                                                         | Slack gửi POST tới `slash_commands[].url`; trường này là bắt buộc để chuyển lệnh                                  |
| Ký yêu cầu                   | Không sử dụng (xác thực bằng App-Level Token)                                                                                                        | Slack ký mọi yêu cầu; OpenClaw xác minh bằng `signingSecret`                                               |
| Khôi phục khi mất kết nối    | Tự động kết nối lại của Slack SDK được bật; OpenClaw cũng khởi động lại các phiên Socket Mode bị lỗi với thời gian chờ tăng dần có giới hạn. Áp dụng điều chỉnh phương thức truyền tải theo thời gian chờ pong. | Không có kết nối liên tục để bị ngắt; Slack thử lại theo từng yêu cầu                                         |

<Note>
  **Chọn Socket Mode** cho các máy chủ chạy một Gateway, laptop phát triển và mạng tại chỗ có thể truy cập `*.slack.com` theo chiều đi nhưng không thể nhận HTTPS vào.

**Chọn HTTP Request URLs** khi chạy nhiều bản sao Gateway phía sau bộ cân bằng tải, khi WSS đi bị chặn nhưng HTTPS vào được phép, hoặc khi bạn đã kết thúc webhook Slack tại một proxy ngược.
</Note>

<Warning>
  Slack có thể duy trì nhiều kết nối Socket Mode cho một ứng dụng và có thể gửi từng tải trọng đến bất kỳ kết nối nào. Do đó, các Gateway OpenClaw riêng biệt dùng chung một ứng dụng Slack cần có cấu hình định tuyến và ủy quyền tương đương. Nếu không, hãy dùng một ứng dụng Slack riêng cho mỗi Gateway, một điểm tiếp nhận chuyển tiếp duy nhất hoặc HTTP Request URLs phía sau bộ cân bằng tải. Xem [Sử dụng Socket Mode](https://docs.slack.dev/apis/events-api/using-socket-mode#using-multiple-connections).
</Warning>

### Chế độ chuyển tiếp

Chế độ chuyển tiếp tách luồng dữ liệu Slack đi vào khỏi Gateway OpenClaw. Một bộ định tuyến đáng tin cậy sở hữu kết nối Slack Socket Mode duy nhất, chọn Gateway đích và chuyển tiếp một sự kiện có kiểu qua websocket đã xác thực. Gateway vẫn sử dụng token bot riêng cho các lệnh gọi Slack Web API đi.

```json5
{
  channels: {
    slack: {
      mode: "relay",
      botToken: { source: "env", provider: "default", id: "SLACK_BOT_TOKEN" },
      relay: {
        url: "wss://router.example.com/gateway/ws",
        authToken: { source: "env", provider: "default", id: "SLACK_RELAY_AUTH_TOKEN" },
        gatewayId: "team-gateway",
      },
    },
  },
}
```

URL chuyển tiếp phải sử dụng `wss://` trừ khi trỏ đến localhost. Hãy coi bearer token và bảng định tuyến của bộ định tuyến là một phần của ranh giới ủy quyền Slack: các sự kiện được định tuyến đi vào trình xử lý tin nhắn Slack thông thường dưới dạng các kích hoạt đã được ủy quyền. `slack_identity` do bộ định tuyến cung cấp trong khung websocket `hello` có thể đặt tên người dùng và biểu tượng đi mặc định; danh tính tường minh do bên gọi cung cấp vẫn được ưu tiên. Kết nối chuyển tiếp kết nối lại với cùng thời gian chờ tăng dần có giới hạn như Socket Mode và xóa danh tính do bộ định tuyến cung cấp mỗi khi ngắt kết nối.

### Cài đặt trên toàn tổ chức Enterprise Grid

Một tài khoản Slack có thể nhận tin nhắn từ mọi không gian làm việc thuộc phạm vi
cài đặt trên toàn tổ chức Enterprise Grid. Chọn Socket Mode trực tiếp hoặc HTTP
Request URLs; chế độ chuyển tiếp không được hỗ trợ cho tài khoản doanh nghiệp. Cả hai
manifest đặc quyền tối thiểu bên dưới chỉ bật đường dẫn sự kiện V1 `message` và `app_mention`,
phản hồi tức thì và phản ứng trạng thái do trình lắng nghe sở hữu.

#### Socket Mode

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Trình kết nối Slack cho OpenClaw"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true }
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "app_mentions:read",
        "channels:history",
        "channels:read",
        "chat:write",
        "files:read",
        "files:write",
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "mpim:history",
        "mpim:read",
        "reactions:write",
        "users:read"
      ]
    }
  },
  "settings": {
    "org_deploy_enabled": true,
    "socket_mode_enabled": true,
    "event_subscriptions": {
      "bot_events": [
        "app_mention",
        "message.channels",
        "message.groups",
        "message.im",
        "message.mpim"
      ]
    }
  }
}
```

Yêu cầu Enterprise Grid Org Admin hoặc Org Owner phê duyệt ứng dụng, cài đặt ứng dụng ở
cấp tổ chức và chọn các không gian làm việc thuộc phạm vi cài đặt.
Xác nhận ứng dụng có sẵn trong mọi không gian làm việc dự kiến trước khi khởi động
OpenClaw. Tạo token cấp ứng dụng có `connections:write` cho Socket Mode,
sau đó sao chép token bot từ bản cài đặt của tổ chức. Cấu hình tài khoản
sử dụng token bot được cài đặt cho tổ chức:

```json5
{
  channels: {
    slack: {
      enabled: true,
      mode: "socket",
      enterpriseOrgInstall: true,
      appToken: { source: "env", provider: "default", id: "SLACK_APP_TOKEN" },
      botToken: { source: "env", provider: "default", id: "SLACK_BOT_TOKEN" },
      dmPolicy: "open",
      allowFrom: ["*"],
      groupPolicy: "allowlist",
      channels: {
        C0123456789: { requireMention: true },
      },
    },
  },
}
```

#### HTTP Request URLs

Sử dụng chế độ HTTP khi Gateway có điểm cuối HTTPS công khai và không mở
kết nối Socket Mode. Thay URL ví dụ bằng URL `webhookPath` công khai
của Gateway (mặc định `/slack/events`):

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Trình kết nối Slack cho OpenClaw"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true }
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "app_mentions:read",
        "channels:history",
        "channels:read",
        "chat:write",
        "files:read",
        "files:write",
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "mpim:history",
        "mpim:read",
        "reactions:write",
        "users:read"
      ]
    }
  },
  "settings": {
    "org_deploy_enabled": true,
    "event_subscriptions": {
      "request_url": "https://gateway-host.example.com/slack/events",
      "bot_events": [
        "app_mention",
        "message.channels",
        "message.groups",
        "message.im",
        "message.mpim"
      ]
    }
  }
}
```

Yêu cầu Enterprise Grid Org Admin hoặc Org Owner phê duyệt ứng dụng, cài đặt ứng dụng ở
cấp tổ chức và chọn các không gian làm việc thuộc phạm vi cài đặt.
Sau khi Slack xác minh Request URL, hãy sao chép token bot của bản cài đặt tổ chức và
**Basic Information -> App Credentials -> Signing Secret** của ứng dụng. Cấu hình
tài khoản doanh nghiệp với cùng đường dẫn Request URL:

```json5
{
  channels: {
    slack: {
      enabled: true,
      mode: "http",
      enterpriseOrgInstall: true,
      botToken: { source: "env", provider: "default", id: "SLACK_BOT_TOKEN" },
      signingSecret: {
        source: "env",
        provider: "default",
        id: "SLACK_SIGNING_SECRET",
      },
      webhookPath: "/slack/events",
      dmPolicy: "open",
      allowFrom: ["*"],
      groupPolicy: "allowlist",
      channels: {
        C0123456789: { requireMention: true },
      },
    },
  },
}
```

Khi khởi động, OpenClaw xác minh `enterpriseOrgInstall` bằng `auth.test` của Slack.
Token được cài đặt cho tổ chức nhưng không có cờ, hoặc token không gian làm việc có cờ,
sẽ khiến quá trình khởi động thất bại. Slack vẫn là nguồn dữ liệu chuẩn xác định những không gian làm việc nào đã
cấp quyền cho bản cài đặt; sau đó OpenClaw áp dụng các chính sách kênh, người dùng,
tin nhắn trực tiếp và lượt đề cập đã cấu hình cho từng sự kiện được gửi đến. Enterprise V1 từ chối mọi
sự kiện `message` và `app_mention` do bot tạo trước khi chuyển đi, bất kể
`allowBots`, vì các bản cài đặt tổ chức không cung cấp danh tính bot ổn định
kèm định danh không gian làm việc để ngăn vòng lặp.

Hỗ trợ doanh nghiệp được chủ ý giới hạn ở Socket Mode trực tiếp hoặc các sự kiện HTTP
`message` và `app_mention` cùng phản hồi tức thì của chúng. Chế độ chuyển tiếp,
lệnh gạch chéo, tương tác, App Home, trình lắng nghe sự kiện phản ứng, ghim, công cụ hành động Slack,
phê duyệt gốc của Slack, liên kết, gửi theo hàng đợi hoặc lịch biểu,
và gửi chủ động đều không khả dụng cho tài khoản doanh nghiệp. Các phản ứng
xác nhận, đang nhập và trạng thái đi được hỗ trợ thông qua ứng dụng Slack
do trình lắng nghe sở hữu và yêu cầu `reactions:write`; thông báo phản ứng
đi vào và công cụ hành động phản ứng vẫn không khả dụng.

Các phản hồi tức thời tái sử dụng hành vi gửi Slack tiêu chuẩn cho các phần,
phương tiện, siêu dữ liệu, phương án dự phòng danh tính, bản xem trước liên kết và biên nhận, nhưng chỉ khi
client do trình lắng nghe đã xác thực sở hữu vẫn còn trong lượt sự kiện đang hoạt động. Hàng đợi gửi
trong bộ nhớ và các bản ghi tham gia luồng được phân vùng theo workspace của
sự kiện đó; bản thân client không bao giờ được tuần tự hóa hoặc lưu bền vững.

Các khóa chính sách kênh và mục nhập `dm.groupChannels` phải sử dụng ID kênh Slack ổn định dạng thô hoặc
dạng `channel:<id>`. OpenClaw chuẩn hóa cả hai dạng thành ID kênh dạng thô để
đối sánh khi chạy; các tiền tố `slack:`, `group:` và `mpim:` khiến quá trình khởi động thất bại.
Các mục nhập chính sách người dùng phải sử dụng ID người dùng Slack ổn định; tên, slug, tên hiển thị
và địa chỉ email khiến quá trình khởi động thất bại. ID phải sử dụng tiền tố viết hoa và
phần thân chuẩn của Slack (ví dụ: `C0123456789` hoặc `U0123456789`); dạng viết thường và
các dạng tương tự nhưng ngắn hơn khiến quá trình khởi động thất bại. Tài khoản Enterprise không thể bật
`dangerouslyAllowNameMatching`. Tài khoản Enterprise có thể đặt
`mentionPatterns.mode` toàn cục, nhưng `mentionPatterns.allowIn` và
`mentionPatterns.denyIn` khiến quá trình khởi động thất bại vì ID kênh Slack trần không
được định danh theo workspace và có thể được tái sử dụng giữa các workspace. Các bản cài đặt theo workspace
giữ nguyên hành vi mẫu đề cập có phạm vi hiện có. Mỗi workspace được chấp nhận
có danh tính riêng biệt cho định tuyến, phiên, bản chép lời, khử trùng lặp, lịch sử và bộ nhớ đệm,
ngay cả khi các ID Slack trùng nhau. Trong luồng `message`, các tin nhắn người dùng thông thường
và sự kiện `file_share` do người dùng tạo được hỗ trợ; các kiểu con tin nhắn khác bị
từ chối trước khi xử lý ủy quyền hoặc sự kiện hệ thống.

DM Enterprise phải được vô hiệu hóa (`dm.enabled=false` hoặc
`dmPolicy="disabled"`) hoặc được mở rõ ràng bằng `dmPolicy="open"` và
một `allowFrom` tài khoản có hiệu lực chứa giá trị chữ `"*"`. Danh sách cho phép trống
hoặc các ID dành riêng cho người dùng không có `"*"` sẽ khiến quá trình khởi động thất bại. Việc ghép nối và
danh sách cho phép DM theo người dùng bị từ chối vì ID người dùng Slack không
được định danh theo workspace trong các kho lưu trữ ủy quyền đó. Chính sách kênh và người gửi
tiếp tục áp dụng cho tin nhắn kênh.

## Cài đặt

```bash
openclaw plugins install @openclaw/slack
```

`plugins install` đăng ký và bật plugin. Lệnh này không thực hiện thêm hành động nào cho đến khi bạn định cấu hình ứng dụng Slack và cài đặt kênh bên dưới. Xem [Plugin](/vi/tools/plugin) để biết các quy tắc cài đặt plugin chung.

## Thiết lập nhanh

Các manifest trong phần này tạo một bản cài đặt có phạm vi workspace. Đối với
bản cài đặt trên toàn tổ chức Enterprise Grid, hãy sử dụng
[manifest và quy trình làm việc trên toàn tổ chức](#enterprise-grid-org-wide-installs) chuyên biệt.

<Tabs>
  <Tab title="Socket Mode (mặc định)">
    <Steps>
      <Step title="Tạo ứng dụng Slack mới">
        Mở [api.slack.com/apps](https://api.slack.com/apps/new) → **Create New App** → **From a manifest** → chọn workspace của bạn → dán một trong các manifest bên dưới → **Next** → **Create**.

        <CodeGroup>

```json Recommended
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Trình kết nối Slack cho OpenClaw"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "assistant_view": {
      "assistant_description": "OpenClaw kết nối các luồng trợ lý Slack với các tác tử OpenClaw.",
      "suggested_prompts": [
        { "title": "Bạn có thể làm gì?", "message": "Bạn có thể giúp tôi việc gì?" },
        {
          "title": "Tóm tắt kênh này",
          "message": "Tóm tắt hoạt động gần đây trong kênh này."
        },
        { "title": "Soạn phản hồi", "message": "Giúp tôi soạn phản hồi." }
      ]
    },
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "Gửi tin nhắn đến OpenClaw",
        "should_escape": false
      }
    ]
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "app_mentions:read",
        "assistant:write",
        "channels:history",
        "channels:read",
        "chat:write",
        "commands",
        "emoji:read",
        "files:read",
        "files:write",
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "im:write",
        "mpim:history",
        "mpim:read",
        "mpim:write",
        "pins:read",
        "pins:write",
        "reactions:read",
        "reactions:write",
        "usergroups:read",
        "users:read"
      ]
    }
  },
  "settings": {
    "socket_mode_enabled": true,
    "event_subscriptions": {
      "bot_events": [
        "app_home_opened",
        "app_mention",
        "assistant_thread_context_changed",
        "assistant_thread_started",
        "channel_rename",
        "member_joined_channel",
        "member_left_channel",
        "message.channels",
        "message.groups",
        "message.im",
        "message.mpim",
        "pin_added",
        "pin_removed",
        "reaction_added",
        "reaction_removed"
      ]
    }
  }
}
```

```json Minimal
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Trình kết nối Slack cho OpenClaw"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "assistant_view": {
      "assistant_description": "OpenClaw kết nối các luồng trợ lý Slack với các tác tử OpenClaw.",
      "suggested_prompts": [
        { "title": "Bạn có thể làm gì?", "message": "Bạn có thể giúp tôi việc gì?" },
        {
          "title": "Tóm tắt kênh này",
          "message": "Tóm tắt hoạt động gần đây trong kênh này."
        },
        { "title": "Soạn phản hồi", "message": "Giúp tôi soạn phản hồi." }
      ]
    },
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "Gửi tin nhắn đến OpenClaw",
        "should_escape": false
      }
    ]
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "app_mentions:read",
        "assistant:write",
        "channels:history",
        "channels:read",
        "chat:write",
        "commands",
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "im:write",
        "users:read"
      ]
    }
  },
  "settings": {
    "socket_mode_enabled": true,
    "event_subscriptions": {
      "bot_events": [
        "app_home_opened",
        "app_mention",
        "assistant_thread_context_changed",
        "assistant_thread_started",
        "message.channels",
        "message.groups",
        "message.im"
      ]
    }
  }
}
```

        </CodeGroup>

        <Note>
          **Recommended** tương ứng với toàn bộ bộ tính năng của plugin Slack: App Home, lệnh gạch chéo, tệp, phản ứng, ghim, DM nhóm và quyền đọc emoji/nhóm người dùng. Chọn **Minimal** khi chính sách workspace hạn chế phạm vi — tùy chọn này hỗ trợ DM, lịch sử kênh/nhóm, lượt đề cập và lệnh gạch chéo nhưng loại bỏ tệp, phản ứng, ghim, DM nhóm (`mpim:*`), `emoji:read` và `usergroups:read`. Xem [Danh sách kiểm tra manifest và phạm vi](#manifest-and-scope-checklist) để biết lý do cho từng phạm vi và các tùy chọn bổ sung như lệnh gạch chéo bổ sung.
        </Note>

        Sau khi Slack tạo ứng dụng:

        - **Basic Information -> App-Level Tokens -> Generate Token and Scopes**: thêm `connections:write`, lưu rồi sao chép App-Level Token.
        - **Install App -> Install to Workspace**: sao chép Bot User OAuth Token.

      </Step>

      <Step title="Định cấu hình OpenClaw">

        Thiết lập SecretRef được khuyến nghị:

```bash
export SLACK_APP_TOKEN=slack-app-token-example
export SLACK_BOT_TOKEN=slack-bot-token-example
cat > slack.socket.patch.json5 <<'JSON5'
{
  channels: {
    slack: {
      enabled: true,
      mode: "socket",
      appToken: { source: "env", provider: "default", id: "SLACK_APP_TOKEN" },
      botToken: { source: "env", provider: "default", id: "SLACK_BOT_TOKEN" },
    },
  },
}
JSON5
openclaw config patch --file ./slack.socket.patch.json5 --dry-run
openclaw config patch --file ./slack.socket.patch.json5
```

        Phương án dự phòng bằng biến môi trường (chỉ tài khoản mặc định):

```bash
SLACK_APP_TOKEN=slack-app-token-example
SLACK_BOT_TOKEN=slack-bot-token-example
```

      </Step>

      <Step title="Khởi động Gateway">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>

  <Tab title="URL yêu cầu HTTP">
    <Steps>
      <Step title="Tạo ứng dụng Slack mới">
        Mở [api.slack.com/apps](https://api.slack.com/apps/new) → **Create New App** → **From a manifest** → chọn workspace của bạn → dán một trong các manifest bên dưới → thay `https://gateway-host.example.com/slack/events` bằng URL Gateway công khai của bạn → **Next** → **Create**.

        <CodeGroup>

```json Recommended
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Trình kết nối Slack cho OpenClaw"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "assistant_view": {
      "assistant_description": "OpenClaw kết nối các luồng trợ lý Slack với các tác tử OpenClaw.",
      "suggested_prompts": [
        { "title": "Bạn có thể làm gì?", "message": "Bạn có thể giúp tôi việc gì?" },
        {
          "title": "Tóm tắt kênh này",
          "message": "Tóm tắt hoạt động gần đây trong kênh này."
        },
        { "title": "Soạn phản hồi", "message": "Giúp tôi soạn phản hồi." }
      ]
    },
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "Gửi tin nhắn đến OpenClaw",
        "should_escape": false,
        "url": "https://gateway-host.example.com/slack/events"
      }
    ]
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "app_mentions:read",
        "assistant:write",
        "channels:history",
        "channels:read",
        "chat:write",
        "commands",
        "emoji:read",
        "files:read",
        "files:write",
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "im:write",
        "mpim:history",
        "mpim:read",
        "mpim:write",
        "pins:read",
        "pins:write",
        "reactions:read",
        "reactions:write",
        "usergroups:read",
        "users:read"
      ]
    }
  },
  "settings": {
    "event_subscriptions": {
      "request_url": "https://gateway-host.example.com/slack/events",
      "bot_events": [
        "app_home_opened",
        "app_mention",
        "assistant_thread_context_changed",
        "assistant_thread_started",
        "channel_rename",
        "member_joined_channel",
        "member_left_channel",
        "message.channels",
        "message.groups",
        "message.im",
        "message.mpim",
        "pin_added",
        "pin_removed",
        "reaction_added",
        "reaction_removed"
      ]
    },
    "interactivity": {
      "is_enabled": true,
      "request_url": "https://gateway-host.example.com/slack/events",
      "message_menu_options_url": "https://gateway-host.example.com/slack/events"
    }
  }
}
```

```json Minimal
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Trình kết nối Slack cho OpenClaw"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "assistant_view": {
      "assistant_description": "OpenClaw kết nối các luồng trợ lý Slack với các tác nhân OpenClaw.",
      "suggested_prompts": [
        { "title": "Bạn có thể làm gì?", "message": "Bạn có thể giúp tôi việc gì?" },
        {
          "title": "Tóm tắt kênh này",
          "message": "Tóm tắt hoạt động gần đây trong kênh này."
        },
        { "title": "Soạn câu trả lời", "message": "Giúp tôi soạn câu trả lời." }
      ]
    },
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "Gửi tin nhắn đến OpenClaw",
        "should_escape": false,
        "url": "https://gateway-host.example.com/slack/events"
      }
    ]
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "app_mentions:read",
        "assistant:write",
        "channels:history",
        "channels:read",
        "chat:write",
        "commands",
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "im:write",
        "users:read"
      ]
    }
  },
  "settings": {
    "event_subscriptions": {
      "request_url": "https://gateway-host.example.com/slack/events",
      "bot_events": [
        "app_home_opened",
        "app_mention",
        "assistant_thread_context_changed",
        "assistant_thread_started",
        "message.channels",
        "message.groups",
        "message.im"
      ]
    },
    "interactivity": {
      "is_enabled": true,
      "request_url": "https://gateway-host.example.com/slack/events",
      "message_menu_options_url": "https://gateway-host.example.com/slack/events"
    }
  }
}
```

        </CodeGroup>

        <Note>
          **Khuyến nghị** phù hợp với bộ tính năng đầy đủ của plugin Slack; **Tối thiểu** loại bỏ tệp, phản ứng, ghim, DM nhóm (`mpim:*`), `emoji:read` và `usergroups:read` cho các không gian làm việc bị hạn chế. Xem [Danh sách kiểm tra manifest và phạm vi](#manifest-and-scope-checklist) để biết lý do của từng phạm vi.
        </Note>

        <Info>
          Ba trường URL (`slash_commands[].url`, `event_subscriptions.request_url` và `interactivity.request_url` / `message_menu_options_url`) đều trỏ đến cùng một điểm cuối OpenClaw. Lược đồ manifest của Slack yêu cầu đặt tên riêng cho chúng, nhưng OpenClaw định tuyến theo loại payload nên chỉ cần một `webhookPath` (mặc định `/slack/events`). Các lệnh gạch chéo không có `slash_commands[].url` sẽ âm thầm không thực hiện gì trong chế độ HTTP.
        </Info>

        Sau khi Slack tạo ứng dụng:

        - **Basic Information → App Credentials**: sao chép **Signing Secret** để xác minh yêu cầu.
        - **Install App -> Install to Workspace**: sao chép Bot User OAuth Token.

      </Step>

      <Step title="Cấu hình OpenClaw">

        Thiết lập SecretRef được khuyến nghị:

```bash
export SLACK_BOT_TOKEN=slack-bot-token-example
export SLACK_SIGNING_SECRET=...
cat > slack.http.patch.json5 <<'JSON5'
{
  channels: {
    slack: {
      enabled: true,
      mode: "http",
      botToken: { source: "env", provider: "default", id: "SLACK_BOT_TOKEN" },
      signingSecret: { source: "env", provider: "default", id: "SLACK_SIGNING_SECRET" },
      webhookPath: "/slack/events",
    },
  },
}
JSON5
openclaw config patch --file ./slack.http.patch.json5 --dry-run
openclaw config patch --file ./slack.http.patch.json5
```

        <Note>
        Sử dụng các đường dẫn webhook duy nhất cho HTTP nhiều tài khoản

        Cấp cho mỗi tài khoản một `webhookPath` riêng biệt (mặc định `/slack/events`) để các đăng ký không xung đột.
        </Note>

      </Step>

      <Step title="Khởi động Gateway">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>
</Tabs>

## Điều chỉnh phương thức truyền tải Socket Mode

Theo mặc định, OpenClaw đặt thời gian chờ pong của máy khách Slack SDK thành 15 giây cho Socket Mode. Chỉ ghi đè các cài đặt phương thức truyền tải khi cần điều chỉnh riêng cho không gian làm việc hoặc máy chủ:

```json5
{
  channels: {
    slack: {
      mode: "socket",
      socketMode: {
        clientPingTimeout: 20000,
        serverPingTimeout: 30000,
        pingPongLoggingEnabled: false,
      },
    },
  },
}
```

Chỉ sử dụng tùy chọn này cho các không gian làm việc Socket Mode ghi nhật ký thời gian chờ pong/server-ping của websocket Slack hoặc chạy trên các máy chủ đã biết có tình trạng vòng lặp sự kiện bị thiếu tài nguyên. `clientPingTimeout` là thời gian chờ pong sau khi SDK gửi ping từ máy khách; `serverPingTimeout` là thời gian chờ ping từ máy chủ Slack. Tin nhắn và sự kiện của ứng dụng vẫn là trạng thái ứng dụng, không phải tín hiệu hoạt động của phương thức truyền tải.

Ghi chú:

- `socketMode` bị bỏ qua trong chế độ HTTP Request URL.
- Các cài đặt `channels.slack.socketMode` cơ sở áp dụng cho mọi tài khoản Slack trừ khi bị ghi đè. Các ghi đè theo tài khoản sử dụng `channels.slack.accounts.<accountId>.socketMode`; vì đây là ghi đè đối tượng, hãy bao gồm mọi trường điều chỉnh socket mà bạn muốn dùng cho tài khoản đó.
- Chỉ `clientPingTimeout` có giá trị mặc định của OpenClaw (`15000`). `serverPingTimeout` và `pingPongLoggingEnabled` chỉ được chuyển đến Slack SDK khi đã cấu hình.
- Khoảng lùi khi khởi động lại Socket Mode bắt đầu ở khoảng 2 giây và đạt giới hạn tối đa ở khoảng 30 giây. Các lỗi có thể phục hồi khi khởi động, chờ khởi động và ngắt kết nối sẽ được thử lại cho đến khi kênh dừng. Các lỗi tài khoản và thông tin xác thực vĩnh viễn, chẳng hạn như xác thực không hợp lệ, token bị thu hồi hoặc thiếu phạm vi, sẽ thất bại ngay thay vì thử lại mãi mãi.

## Danh sách kiểm tra manifest và phạm vi

Manifest ứng dụng Slack cơ sở giống nhau cho Socket Mode và HTTP Request URL. Chỉ khối `settings` (và `url` của lệnh gạch chéo) là khác nhau.

Manifest cơ sở (Socket Mode mặc định):

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Trình kết nối Slack cho OpenClaw"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "assistant_view": {
      "assistant_description": "OpenClaw kết nối các luồng trợ lý Slack với các tác nhân OpenClaw.",
      "suggested_prompts": [
        { "title": "Bạn có thể làm gì?", "message": "Bạn có thể giúp tôi việc gì?" },
        {
          "title": "Tóm tắt kênh này",
          "message": "Tóm tắt hoạt động gần đây trong kênh này."
        },
        { "title": "Soạn câu trả lời", "message": "Giúp tôi soạn câu trả lời." }
      ]
    },
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "Gửi tin nhắn đến OpenClaw",
        "should_escape": false
      }
    ]
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "app_mentions:read",
        "assistant:write",
        "channels:history",
        "channels:read",
        "chat:write",
        "commands",
        "emoji:read",
        "files:read",
        "files:write",
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "im:write",
        "mpim:history",
        "mpim:read",
        "mpim:write",
        "pins:read",
        "pins:write",
        "reactions:read",
        "reactions:write",
        "usergroups:read",
        "users:read"
      ]
    }
  },
  "settings": {
    "socket_mode_enabled": true,
    "event_subscriptions": {
      "bot_events": [
        "app_home_opened",
        "app_mention",
        "assistant_thread_context_changed",
        "assistant_thread_started",
        "channel_rename",
        "member_joined_channel",
        "member_left_channel",
        "message.channels",
        "message.groups",
        "message.im",
        "message.mpim",
        "pin_added",
        "pin_removed",
        "reaction_added",
        "reaction_removed"
      ]
    }
  }
}
```

Đối với **chế độ HTTP Request URL**, hãy thay `settings` bằng biến thể HTTP và thêm `url` vào từng lệnh gạch chéo. Yêu cầu URL công khai:

```json
{
  "features": {
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "Gửi tin nhắn đến OpenClaw",
        "should_escape": false,
        "url": "https://gateway-host.example.com/slack/events"
      }
    ]
  },
  "settings": {
    "event_subscriptions": {
      "request_url": "https://gateway-host.example.com/slack/events",
      "bot_events": [
        "app_home_opened",
        "app_mention",
        "assistant_thread_context_changed",
        "assistant_thread_started",
        "channel_rename",
        "member_joined_channel",
        "member_left_channel",
        "message.channels",
        "message.groups",
        "message.im",
        "message.mpim",
        "pin_added",
        "pin_removed",
        "reaction_added",
        "reaction_removed"
      ]
    },
    "interactivity": {
      "is_enabled": true,
      "request_url": "https://gateway-host.example.com/slack/events",
      "message_menu_options_url": "https://gateway-host.example.com/slack/events"
    }
  }
}
```

### Các cài đặt manifest bổ sung

Hiển thị các tính năng khác nhau mở rộng những giá trị mặc định ở trên.

Manifest mặc định bật thẻ **Home** trong Slack App Home và đăng ký `app_home_opened`. Khi một thành viên không gian làm việc mở thẻ Home, OpenClaw xuất bản chế độ xem Home mặc định an toàn bằng `views.publish`; không bao gồm payload cuộc trò chuyện hoặc cấu hình riêng tư. Khi bật chế độ một lệnh gạch chéo, gợi ý lệnh sử dụng `channels.slack.slashCommand.name`; các bản cài đặt dùng lệnh gốc hoặc không dùng lệnh gạch chéo sẽ bỏ qua gợi ý đó. Thẻ **Messages** vẫn được bật cho DM Slack. Manifest cũng bật các luồng trợ lý Slack bằng `features.assistant_view`, `assistant:write`, `assistant_thread_started` và `assistant_thread_context_changed`; các luồng trợ lý được định tuyến đến phiên luồng OpenClaw riêng và giữ ngữ cảnh luồng do Slack cung cấp ở trạng thái sẵn dùng cho tác nhân.

<AccordionGroup>
  <Accordion title="Các lệnh gạch chéo gốc tùy chọn">

    Có thể dùng nhiều [lệnh gạch chéo gốc](#commands-and-slash-behavior) thay cho một lệnh được cấu hình, với một số lưu ý:

    - Sử dụng `/agentstatus` thay cho `/status` vì lệnh `/status` được dành riêng.
    - Không thể đăng ký đồng thời quá 25 lệnh gạch chéo trên một ứng dụng Slack (giới hạn của nền tảng Slack).

    Thay phần `features.slash_commands` hiện có bằng một tập con của [các lệnh có sẵn](/vi/tools/slash-commands#command-list):

    <Tabs>
      <Tab title="Socket Mode (mặc định)">

```json
{
  "slash_commands": [
    {
      "command": "/new",
      "description": "Bắt đầu một phiên mới",
      "usage_hint": "[model]"
    },
    {
      "command": "/reset",
      "description": "Đặt lại phiên hiện tại"
    },
    {
      "command": "/compact",
      "description": "Thu gọn ngữ cảnh phiên",
      "usage_hint": "[instructions]"
    },
    {
      "command": "/stop",
      "description": "Dừng lượt chạy hiện tại"
    },
    {
      "command": "/session",
      "description": "Quản lý thời hạn liên kết luồng",
      "usage_hint": "không hoạt động <duration|off> hoặc tuổi tối đa <duration|off>"
    },
    {
      "command": "/think",
      "description": "Đặt mức độ suy nghĩ",
      "usage_hint": "<level>"
    },
    {
      "command": "/verbose",
      "description": "Bật hoặc tắt đầu ra chi tiết",
      "usage_hint": "on|off|full"
    },
    {
      "command": "/fast",
      "description": "Hiển thị hoặc đặt chế độ nhanh",
      "usage_hint": "[status|on|off]"
    },
    {
      "command": "/reasoning",
      "description": "Bật hoặc tắt khả năng hiển thị suy luận",
      "usage_hint": "[on|off|stream]"
    },
    {
      "command": "/elevated",
      "description": "Bật hoặc tắt chế độ nâng cao",
      "usage_hint": "[on|off|ask|full]"
    },
    {
      "command": "/exec",
      "description": "Hiển thị hoặc đặt giá trị mặc định khi thực thi",
      "usage_hint": "host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>"
    },
    {
      "command": "/approve",
      "description": "Phê duyệt hoặc từ chối các yêu cầu phê duyệt đang chờ",
      "usage_hint": "<id> <decision>"
    },
    {
      "command": "/model",
      "description": "Hiển thị hoặc đặt mô hình",
      "usage_hint": "[name|#|status]"
    },
    {
      "command": "/models",
      "description": "Liệt kê nhà cung cấp/mô hình",
      "usage_hint": "[provider] [page] [limit=<n>|size=<n>|all]"
    },
    {
      "command": "/help",
      "description": "Hiển thị bản tóm tắt trợ giúp ngắn"
    },
    {
      "command": "/commands",
      "description": "Hiển thị danh mục lệnh đã tạo"
    },
    {
      "command": "/tools",
      "description": "Hiển thị những gì tác tử hiện tại có thể sử dụng ngay lúc này",
      "usage_hint": "[compact|verbose]"
    },
    {
      "command": "/agentstatus",
      "description": "Hiển thị trạng thái thời gian chạy, bao gồm mức sử dụng/hạn mức của nhà cung cấp khi có"
    },
    {
      "command": "/tasks",
      "description": "Liệt kê các tác vụ nền đang hoạt động/gần đây cho phiên hiện tại"
    },
    {
      "command": "/context",
      "description": "Giải thích cách ngữ cảnh được tập hợp",
      "usage_hint": "[list|detail|json]"
    },
    {
      "command": "/whoami",
      "description": "Hiển thị danh tính người gửi của bạn"
    },
    {
      "command": "/skill",
      "description": "Chạy một kỹ năng theo tên",
      "usage_hint": "<name> [input]"
    },
    {
      "command": "/btw",
      "description": "Đặt một câu hỏi phụ mà không thay đổi ngữ cảnh phiên",
      "usage_hint": "<question>"
    },
    {
      "command": "/side",
      "description": "Đặt một câu hỏi phụ mà không thay đổi ngữ cảnh phiên",
      "usage_hint": "<question>"
    },
    {
      "command": "/usage",
      "description": "Kiểm soát chân trang mức sử dụng hoặc hiển thị bản tóm tắt chi phí",
      "usage_hint": "off|tokens|full|cost"
    }
  ]
}
```

      </Tab>
      <Tab title="URL yêu cầu HTTP">
        Sử dụng cùng danh sách `slash_commands` như chế độ Socket ở trên và thêm `"url": "https://gateway-host.example.com/slack/events"` vào mọi mục. Ví dụ:

```json
{
  "slash_commands": [
    {
      "command": "/new",
      "description": "Bắt đầu một phiên mới",
      "usage_hint": "[model]",
      "url": "https://gateway-host.example.com/slack/events"
    },
    {
      "command": "/help",
      "description": "Hiển thị bản tóm tắt trợ giúp ngắn",
      "url": "https://gateway-host.example.com/slack/events"
    }
  ]
}
```

        Lặp lại giá trị `url` đó trên mọi lệnh trong danh sách.

      </Tab>
    </Tabs>

  </Accordion>
  <Accordion title="Phạm vi quyền tác giả tùy chọn (thao tác ghi)">
    Thêm phạm vi bot `chat:write.customize` nếu bạn muốn tin nhắn gửi đi sử dụng danh tính tác tử đang hoạt động (tên người dùng và biểu tượng tùy chỉnh) thay vì danh tính ứng dụng Slack mặc định.

    Nếu sử dụng biểu tượng emoji, Slack yêu cầu cú pháp `:emoji_name:`.

  </Accordion>
  <Accordion title="Phạm vi token người dùng tùy chọn (thao tác đọc)">
    Nếu bạn cấu hình `channels.slack.userToken`, các phạm vi đọc điển hình là:

    - `channels:history`, `groups:history`, `im:history`, `mpim:history`
    - `channels:read`, `groups:read`, `im:read`, `mpim:read`
    - `users:read`
    - `reactions:read`
    - `pins:read`
    - `emoji:read`
    - `search:read` (nếu bạn phụ thuộc vào thao tác đọc tìm kiếm của Slack)

  </Accordion>
</AccordionGroup>

## Mô hình token

- `botToken` + `appToken` là bắt buộc đối với chế độ Socket.
- Chế độ HTTP yêu cầu `botToken` + `signingSecret`.
- Chế độ chuyển tiếp yêu cầu `botToken` cùng với `relay.url`, `relay.authToken` và `relay.gatewayId`; chế độ này không sử dụng token ứng dụng hoặc bí mật ký.
- `botToken`, `appToken`, `signingSecret`, `relay.authToken` và `userToken` chấp nhận chuỗi
  văn bản thuần hoặc đối tượng SecretRef.
- Token cấu hình ghi đè giá trị dự phòng từ môi trường.
- Giá trị dự phòng môi trường `SLACK_BOT_TOKEN`, `SLACK_APP_TOKEN` và `SLACK_USER_TOKEN` chỉ áp dụng cho tài khoản mặc định.
- `userToken` mặc định ở chế độ chỉ đọc (`userTokenReadOnly: true`).

Hành vi của ảnh chụp trạng thái:

- Việc kiểm tra tài khoản Slack theo dõi các trường `*Source` và `*Status` cho từng thông tin xác thực
  (`botToken`, `appToken`, `signingSecret`, `userToken`).
- Trạng thái là `available`, `configured_unavailable` hoặc `missing`.
- `configured_unavailable` có nghĩa là tài khoản được cấu hình thông qua SecretRef
  hoặc một nguồn bí mật không nội tuyến khác, nhưng đường dẫn lệnh/thời gian chạy hiện tại
  không thể phân giải giá trị thực tế.
- Trong chế độ HTTP, `signingSecretStatus` được bao gồm; trong chế độ Socket, cặp
  bắt buộc là `botTokenStatus` + `appTokenStatus`.

<Tip>
Đối với các thao tác/đọc thư mục, token người dùng có thể được ưu tiên khi đã cấu hình. Đối với thao tác ghi, token bot vẫn được ưu tiên; thao tác ghi bằng token người dùng chỉ được phép khi `userTokenReadOnly: false` và không có token bot.
</Tip>

## Thao tác và cổng kiểm soát

Các thao tác Slack được kiểm soát bởi `channels.slack.actions.*`.

Các nhóm thao tác có sẵn trong công cụ Slack hiện tại:

| Nhóm       | Mặc định |
| ---------- | ------- |
| messages   | được bật |
| reactions  | được bật |
| pins       | được bật |
| memberInfo | được bật |
| emojiList  | được bật |

Các thao tác tin nhắn Slack hiện tại bao gồm `send`, `upload-file`, `download-file`, `read`, `edit`, `delete`, `pin`, `unpin`, `list-pins`, `member-info` và `emoji-list`. `download-file` chấp nhận ID tệp Slack được hiển thị trong phần giữ chỗ tệp đến và trả về bản xem trước đối với hình ảnh hoặc siêu dữ liệu tệp cục bộ đối với các loại tệp khác.

## Kiểm soát truy cập và định tuyến

<Tabs>
  <Tab title="Chính sách tin nhắn trực tiếp">
    `channels.slack.dmPolicy` kiểm soát quyền truy cập tin nhắn trực tiếp. `channels.slack.allowFrom` là danh sách cho phép tin nhắn trực tiếp chuẩn.

    - `pairing` (mặc định)
    - `allowlist`
    - `open` (yêu cầu `channels.slack.allowFrom` bao gồm `"*"`)
    - `disabled`

    Cờ tin nhắn trực tiếp:

    - `dm.enabled` (mặc định là true)
    - `channels.slack.allowFrom`
    - `dm.allowFrom` (cũ)
    - `dm.groupEnabled` (tin nhắn trực tiếp nhóm mặc định là false)
    - `dm.groupChannels` (danh sách cho phép MPIM tùy chọn)

    Thứ tự ưu tiên nhiều tài khoản:

    - `channels.slack.accounts.default.allowFrom` chỉ áp dụng cho tài khoản `default`.
    - Các tài khoản có tên kế thừa `channels.slack.allowFrom` khi `allowFrom` riêng của chúng chưa được đặt.
    - Các tài khoản có tên không kế thừa `channels.slack.accounts.default.allowFrom`.

    `channels.slack.dm.policy` và `channels.slack.dm.allowFrom` cũ vẫn được đọc để đảm bảo khả năng tương thích. `openclaw doctor --fix` di chuyển chúng sang `dmPolicy` và `allowFrom` khi có thể thực hiện mà không thay đổi quyền truy cập.

    Việc ghép nối trong tin nhắn trực tiếp sử dụng `openclaw pairing approve slack <code>`.

  </Tab>

  <Tab title="Chính sách kênh">
    `channels.slack.groupPolicy` kiểm soát việc xử lý kênh:

    - `open`
    - `allowlist`
    - `disabled`

    Danh sách cho phép kênh nằm trong `channels.slack.channels` và **phải sử dụng ID kênh Slack ổn định** (ví dụ `C12345678`) làm khóa cấu hình.

    Lưu ý về thời gian chạy: nếu hoàn toàn thiếu `channels.slack` (thiết lập chỉ dùng môi trường), thời gian chạy sẽ quay về `groupPolicy="allowlist"` và ghi cảnh báo vào nhật ký (ngay cả khi `channels.defaults.groupPolicy` được đặt).

    Phân giải tên/ID:

    - các mục trong danh sách cho phép kênh và danh sách cho phép tin nhắn trực tiếp được phân giải khi khởi động nếu quyền truy cập token cho phép
    - các mục tên kênh chưa phân giải được giữ nguyên theo cấu hình nhưng mặc định bị bỏ qua khi định tuyến
    - việc cấp quyền đầu vào và định tuyến kênh mặc định ưu tiên ID; đối sánh trực tiếp tên người dùng/slug yêu cầu `channels.slack.dangerouslyAllowNameMatching: true`

    <Warning>
    Các khóa dựa trên tên (`#channel-name` hoặc `channel-name`) **không** khớp trong `groupPolicy: "allowlist"`. Tra cứu kênh mặc định ưu tiên ID, vì vậy khóa dựa trên tên sẽ không bao giờ định tuyến thành công và mọi tin nhắn trong kênh đó sẽ bị chặn mà không có thông báo. Điều này khác với `groupPolicy: "open"`, nơi khóa kênh không bắt buộc để định tuyến và khóa dựa trên tên có vẻ hoạt động.

    Luôn sử dụng ID kênh Slack làm khóa. Để tìm ID: nhấp chuột phải vào kênh trong Slack → **Copy link** — ID (`C...`) xuất hiện ở cuối URL.

    Đúng:

    ```json5
    {
      channels: {
        slack: {
          groupPolicy: "allowlist",
          channels: {
            C12345678: { enabled: true, requireMention: true },
          },
        },
      },
    }
    ```

    Sai (bị chặn mà không có thông báo trong `groupPolicy: "allowlist"`):

    ```json5
    {
      channels: {
        slack: {
          groupPolicy: "allowlist",
          channels: {
            "#eng-my-channel": { enabled: true, requireMention: true },
          },
        },
      },
    }
    ```
    </Warning>

  </Tab>

  <Tab title="Lượt đề cập và người dùng kênh">
    Theo mặc định, tin nhắn kênh yêu cầu có lượt đề cập.

    Nguồn lượt đề cập:

    - lượt đề cập ứng dụng rõ ràng (`<@botId>`)
    - lượt đề cập nhóm người dùng Slack (`<!subteam^S...>`) khi người dùng bot là thành viên của nhóm người dùng đó; yêu cầu `usergroups:read`
    - các mẫu biểu thức chính quy cho lượt đề cập (`agents.list[].groupChat.mentionPatterns`, dự phòng `messages.groupChat.mentionPatterns`)
    - hành vi ngầm định trả lời luồng của bot (bị tắt khi `thread.requireExplicitMention` là `true`)

    Các tùy chọn kiểm soát theo kênh (`channels.slack.channels.<id>`; chỉ dùng tên thông qua phân giải khi khởi động hoặc `dangerouslyAllowNameMatching`):

    - `requireMention`
    - `ignoreOtherMentions`
    - `replyToMode` (`off|first|all|batched`; ghi đè chế độ trả lời theo tài khoản/loại trò chuyện cho kênh này)
    - `users` (danh sách cho phép)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - định dạng khóa `toolsBySender`: `channel:`, `id:`, `e164:`, `username:`, `name:` hoặc ký tự đại diện `"*"`
      (các khóa cũ không có tiền tố vẫn chỉ ánh xạ tới `id:`)

    `ignoreOtherMentions` (mặc định `false`) loại bỏ các tin nhắn kênh có đề cập đến người dùng hoặc nhóm người dùng khác nhưng không đề cập đến bot này. Tin nhắn trực tiếp và tin nhắn trực tiếp nhóm (MPIM) không bị ảnh hưởng. Bộ lọc yêu cầu ID người dùng bot đã được phân giải từ `auth.test`; nếu danh tính đó không khả dụng (ví dụ: danh tính chỉ có token người dùng), cổng sẽ mở khi gặp lỗi và các tin nhắn được chuyển tiếp mà không thay đổi.

    `allowBots` áp dụng thận trọng cho các kênh và kênh riêng tư: tin nhắn trong phòng do bot gửi chỉ được chấp nhận khi bot gửi được liệt kê rõ ràng trong danh sách cho phép `users` của phòng đó, hoặc khi ít nhất một ID chủ sở hữu Slack rõ ràng từ `channels.slack.allowFrom` hiện là thành viên của phòng. Ký tự đại diện và các mục chủ sở hữu bằng tên hiển thị không đáp ứng điều kiện hiện diện của chủ sở hữu. Việc xác định sự hiện diện của chủ sở hữu sử dụng `conversations.members` của Slack; hãy bảo đảm ứng dụng có phạm vi đọc tương ứng với loại phòng (`channels:read` cho kênh công khai, `groups:read` cho kênh riêng tư). Nếu không thể tra cứu thành viên, OpenClaw sẽ loại bỏ tin nhắn trong phòng do bot gửi.

    Các tin nhắn Slack do bot gửi được chấp nhận sử dụng cơ chế [bảo vệ vòng lặp bot](/vi/channels/bot-loop-protection) dùng chung. Cấu hình `channels.defaults.botLoopProtection` cho hạn mức mặc định, sau đó ghi đè bằng `channels.slack.botLoopProtection` hoặc `channels.slack.channels.<id>.botLoopProtection` khi một không gian làm việc hoặc kênh cần giới hạn khác.

  </Tab>
</Tabs>

## Luồng thảo luận, phiên và thẻ trả lời

- Tin nhắn trực tiếp được định tuyến dưới dạng `direct`; kênh dưới dạng `channel`; MPIM dưới dạng `group`.
- Các liên kết định tuyến Slack chấp nhận ID đối tượng ngang hàng thô cùng các dạng đích Slack như `channel:C12345678`, `user:U12345678` và `<@U12345678>`.
- Với `session.dmScope=main` mặc định, các tin nhắn trực tiếp Slack được gộp vào phiên chính của tác tử.
- Phiên kênh: `agent:<agentId>:slack:channel:<channelId>`.
- Các tin nhắn cấp cao nhất thông thường trong kênh vẫn nằm trong phiên riêng của từng kênh, ngay cả khi `replyToMode` không phải là `off`.
- Các câu trả lời trong luồng Slack sử dụng `thread_ts` của tin nhắn Slack cha làm hậu tố phiên (`:thread:<threadTs>`), ngay cả khi tính năng trả lời theo luồng ở đầu ra bị tắt bằng `replyToMode="off"`.
- OpenClaw đưa một tin nhắn gốc cấp cao nhất đủ điều kiện trong kênh vào `agent:<agentId>:slack:channel:<channelId>:thread:<rootTs>` khi tin nhắn gốc đó dự kiến sẽ bắt đầu một luồng Slack hiển thị, để tin nhắn gốc và các câu trả lời sau đó trong luồng dùng chung một phiên OpenClaw. Điều này áp dụng cho các sự kiện `app_mention`, các kết quả khớp rõ ràng với bot hoặc mẫu đề cập đã cấu hình, và các kênh `requireMention: false` có `replyToMode` không phải `off`.
- `channels.slack.thread.historyScope` mặc định là `thread`; `thread.inheritParent` mặc định là `false`.
- `channels.slack.thread.initialHistoryLimit` kiểm soát số lượng tin nhắn hiện có trong luồng được tải khi một phiên luồng mới bắt đầu (mặc định `20`; đặt thành `0` để tắt).
- `channels.slack.thread.requireExplicitMention` (mặc định `false`): khi là `true`, loại bỏ các lượt đề cập ngầm định trong luồng để bot chỉ phản hồi các lượt đề cập `@bot` rõ ràng bên trong luồng, ngay cả khi bot đã tham gia luồng đó. Nếu không có thiết lập này, các câu trả lời trong luồng mà bot đã tham gia sẽ bỏ qua cổng `requireMention`.

Các tùy chọn điều khiển trả lời theo luồng:

- `channels.slack.channels.<id>.replyToMode`: ghi đè theo từng kênh cho tin nhắn trong kênh/kênh riêng tư Slack
- `channels.slack.replyToMode`: `off|first|all|batched` (mặc định `off`)
- `channels.slack.replyToModeByChatType`: theo từng `direct|group|channel`
- phương án dự phòng cũ cho cuộc trò chuyện trực tiếp: `channels.slack.dm.replyToMode`

Hỗ trợ các thẻ trả lời thủ công:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

Đối với câu trả lời rõ ràng trong luồng Slack từ công cụ `message`, hãy đặt `replyBroadcast: true` cùng với `action: "send"` và `threadId` hoặc `replyTo` để yêu cầu Slack đồng thời phát câu trả lời trong luồng tới kênh cha. Thiết lập này ánh xạ đến cờ `reply_broadcast` của `chat.postMessage` trong Slack và chỉ được hỗ trợ khi gửi văn bản hoặc Block Kit, không hỗ trợ tải phương tiện lên.

Khi một lệnh gọi công cụ `message` chạy bên trong một luồng Slack và nhắm đến cùng kênh, OpenClaw thường kế thừa luồng Slack hiện tại theo `replyToMode` có hiệu lực của tài khoản, loại trò chuyện hoặc từng kênh. Các câu trả lời tự động và lệnh gọi `send` hoặc `upload-file` trong cùng kênh sử dụng cùng tùy chọn ghi đè theo từng kênh. Đặt `topLevel: true` trên `action: "send"` hoặc `action: "upload-file"` để buộc tạo một tin nhắn mới trong kênh cha. `threadId: null` được chấp nhận như cùng một tùy chọn không tham gia ở cấp cao nhất.

<Note>
`replyToMode="off"` tắt tính năng trả lời theo luồng Slack ở đầu ra, bao gồm cả các thẻ `[[reply_to_*]]` rõ ràng. Thiết lập này không hợp nhất các phiên luồng Slack đầu vào: những tin nhắn đã được đăng bên trong một luồng Slack vẫn được định tuyến đến phiên `:thread:<threadTs>`. Điều này khác với Telegram, nơi các thẻ rõ ràng vẫn được tuân theo trong chế độ `"off"`. Các luồng Slack ẩn tin nhắn khỏi kênh, trong khi các câu trả lời Telegram vẫn hiển thị nội tuyến.
</Note>

## Phản ứng xác nhận

`ackReaction` gửi một emoji xác nhận trong khi OpenClaw đang xử lý tin nhắn đầu vào. `ackReactionScope` quyết định _khi nào_ emoji đó thực sự được gửi.

Theo mặc định, phản ứng xác nhận giữ nguyên trong khi trạng thái luồng trợ lý gốc của Slack hiển thị tiến trình bằng các thông báo tải luân phiên. Đặt `messages.statusReactions.enabled: true` để chọn sử dụng vòng đời phản ứng đang chờ/suy nghĩ/công cụ/hoàn tất/lỗi.

### Emoji (`ackReaction`)

Thứ tự phân giải:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- phương án dự phòng bằng emoji danh tính tác tử (`agents.list[].identity.emoji`, nếu không thì `"eyes"` / 👀)

Ghi chú:

- Slack yêu cầu mã ngắn (ví dụ `"eyes"`).
- Sử dụng `""` để tắt phản ứng cho tài khoản Slack hoặc trên toàn cục.

### Phạm vi (`messages.ackReactionScope`)

Nhà cung cấp Slack đọc phạm vi từ `messages.ackReactionScope` (mặc định `"group-mentions"`). Hiện không có tùy chọn ghi đè ở cấp tài khoản Slack hoặc kênh Slack; giá trị này áp dụng toàn cục cho Gateway.

Các giá trị:

- `"all"`: phản ứng trong tin nhắn trực tiếp và nhóm, bao gồm các sự kiện phòng nền.
- `"direct"`: chỉ phản ứng trong tin nhắn trực tiếp.
- `"group-all"`: phản ứng với mọi tin nhắn nhóm ngoại trừ các sự kiện phòng nền (không áp dụng cho tin nhắn trực tiếp).
- `"group-mentions"` (mặc định): phản ứng trong nhóm, nhưng chỉ khi bot được đề cập (hoặc trong các đối tượng có thể đề cập theo nhóm đã chọn tham gia). **Không bao gồm tin nhắn trực tiếp.**
- `"off"` / `"none"`: không bao giờ phản ứng.

<Note>
Phạm vi mặc định (`"group-mentions"`) không kích hoạt phản ứng xác nhận trong tin nhắn trực tiếp hoặc các sự kiện phòng nền. Để thấy `ackReaction` đã cấu hình (ví dụ `"eyes"`) trên các tin nhắn trực tiếp Slack đầu vào và sự kiện phòng yên lặng, hãy đặt `messages.ackReactionScope` thành `"all"`. `messages.ackReactionScope` được đọc khi nhà cung cấp Slack khởi động, vì vậy cần khởi động lại Gateway để thay đổi có hiệu lực.
</Note>

```json5
{
  messages: {
    ackReaction: "eyes",
    ackReactionScope: "all", // phản ứng trong tin nhắn trực tiếp và nhóm
  },
}
```

## Truyền phát văn bản

`channels.slack.streaming` kiểm soát hành vi xem trước trực tiếp:

- `off`: tắt truyền phát xem trước trực tiếp.
- `partial` (mặc định): thay thế văn bản xem trước bằng đầu ra từng phần mới nhất.
- `block`: nối thêm các bản cập nhật xem trước theo khối.
- `progress`: hiển thị văn bản trạng thái tiến trình trong khi tạo, sau đó gửi văn bản cuối cùng.
- `streaming.preview.toolProgress`: khi chế độ xem trước bản nháp đang hoạt động, định tuyến các bản cập nhật công cụ/tiến trình vào cùng tin nhắn xem trước đã chỉnh sửa (mặc định: `true`). Đặt `false` để giữ riêng các tin nhắn công cụ/tiến trình.
- `streaming.preview.commandText` / `streaming.progress.commandText`: đặt thành `status` để giữ các dòng tiến trình công cụ cô đọng trong khi ẩn văn bản lệnh/thực thi thô (mặc định: `raw`).

Ẩn văn bản lệnh/thực thi thô trong khi vẫn giữ các dòng tiến trình cô đọng:

```json
{
  "channels": {
    "slack": {
      "streaming": {
        "mode": "progress",
        "progress": {
          "toolProgress": true,
          "commandText": "status"
        }
      }
    }
  }
}
```

`channels.slack.streaming.nativeTransport` kiểm soát tính năng truyền phát văn bản gốc của Slack khi `channels.slack.streaming.mode` là `partial` (mặc định: `true`).

Thẻ tác vụ tiến trình gốc của Slack là tính năng tùy chọn trong chế độ tiến trình. Đặt `channels.slack.streaming.progress.nativeTaskCards` thành `true` cùng với `channels.slack.streaming.mode="progress"` để gửi một thẻ kế hoạch/tác vụ gốc của Slack trong khi công việc đang chạy, sau đó cập nhật chính thẻ tác vụ đó khi hoàn tất. Nếu không có cờ này, chế độ tiến trình tiếp tục sử dụng hành vi xem trước bản nháp di động.

- Phải có luồng trả lời để tính năng truyền phát văn bản gốc và trạng thái luồng trợ lý của Slack xuất hiện. Việc chọn luồng vẫn tuân theo `replyToMode`.
- Các tin nhắn gốc trong kênh, trò chuyện nhóm và tin nhắn trực tiếp cấp cao nhất vẫn có thể sử dụng chế độ xem trước bản nháp thông thường khi tính năng truyền phát gốc không khả dụng hoặc không có luồng trả lời.
- Tin nhắn trực tiếp Slack cấp cao nhất mặc định nằm ngoài luồng, vì vậy chúng không hiển thị chế độ xem trước truyền phát/trạng thái gốc theo kiểu luồng của Slack; thay vào đó, OpenClaw đăng và chỉnh sửa một bản xem trước nháp trong tin nhắn trực tiếp.
- Phương tiện và tải trọng không phải văn bản dùng phương án dự phòng là phân phối thông thường.
- Kết quả cuối cùng dạng phương tiện/lỗi hủy các chỉnh sửa xem trước đang chờ; kết quả cuối cùng dạng văn bản/khối đủ điều kiện chỉ được gửi hết khi có thể chỉnh sửa bản xem trước tại chỗ.
- Nếu truyền phát gặp lỗi giữa chừng khi trả lời, OpenClaw dùng phương án dự phòng là phân phối thông thường cho các tải trọng còn lại.

Sử dụng chế độ xem trước bản nháp thay cho tính năng truyền phát văn bản gốc của Slack:

```json5
{
  channels: {
    slack: {
      streaming: {
        mode: "partial",
        nativeTransport: false,
      },
    },
  },
}
```

Chọn sử dụng thẻ tác vụ tiến trình gốc của Slack:

```json5
{
  channels: {
    slack: {
      streaming: {
        mode: "progress",
        progress: {
          nativeTaskCards: true,
          render: "rich",
        },
      },
    },
  },
}
```

Các khóa cũ:

- `channels.slack.streamMode` (`replace | status_final | append`) là bí danh cũ của `channels.slack.streaming.mode`.
- `channels.slack.streaming` kiểu boolean là bí danh cũ của `channels.slack.streaming.mode` và `channels.slack.streaming.nativeTransport`.
- `channels.slack.chunkMode` và `channels.slack.nativeStreaming` cấp cao nhất là các bí danh cũ của `channels.slack.streaming.chunkMode` và `channels.slack.streaming.nativeTransport`.
- Các bí danh cũ không được đọc trong thời gian chạy; hãy chạy `openclaw doctor --fix` để ghi lại cấu hình truyền phát Slack đã lưu bằng các khóa chuẩn.

## Phương án dự phòng bằng phản ứng nhập liệu

`typingReaction` thêm một phản ứng tạm thời vào tin nhắn Slack đầu vào trong khi OpenClaw đang xử lý câu trả lời, sau đó xóa phản ứng đó khi lượt chạy kết thúc. Tính năng này hữu ích nhất bên ngoài các câu trả lời trong luồng, vốn sử dụng chỉ báo trạng thái "đang nhập..." mặc định.

Thứ tự phân giải:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

Ghi chú:

- Slack yêu cầu mã ngắn (ví dụ `"hourglass_flowing_sand"`).
- Phản ứng được thực hiện theo khả năng tốt nhất và hệ thống tự động cố gắng dọn dẹp sau khi hoàn tất câu trả lời hoặc luồng xử lý lỗi.

## Đầu vào bằng giọng nói

Để nói chuyện với OpenClaw trong Slack hiện nay, hãy gửi một đoạn âm thanh Slack đến ứng dụng OpenClaw. Micrô đọc chính tả của Slackbot là một tính năng riêng thuộc sở hữu của Slack, không phải API ứng dụng.

- **[Nhập liệu bằng giọng nói với Slackbot](https://slack.com/help/articles/202026038-How-to-use-Slackbot)** nằm trong cuộc trò chuyện Slackbot riêng tư của người dùng. Slack chuyển bản ghi âm thành lời nhắc Slackbot nhưng không phát ra tệp âm thanh, sự kiện nhập liệu bằng giọng nói, lời nhắc hoặc dấu hiệu nguồn đầu vào cho các ứng dụng Slack bên thứ ba thông qua Events API. Plugin Slack của OpenClaw không thể bật hoặc nhận tính năng này.
- **[Đoạn âm thanh Slack](https://slack.com/help/articles/4406235165587-Record-audio-and-video-clips-in-Slack)** là các tệp Slack được lưu trữ và có thể được đăng trong DM, kênh hoặc luồng OpenClaw. OpenClaw tải xuống đoạn âm thanh có thể truy cập bằng token bot, chuẩn hóa siêu dữ liệu MIME của đoạn âm thanh từ Slack và gửi qua [quy trình phiên âm thanh dùng chung](/vi/nodes/audio). Manifest ứng dụng được khuyến nghị bao gồm phạm vi `files:read` bắt buộc.

Đoạn âm thanh và nhập liệu bằng giọng nói với Slackbot có ngữ nghĩa quyền riêng tư khác nhau: đoạn âm thanh tuân theo chính sách lưu giữ tệp của Slack và được OpenClaw tải xuống để phiên âm, trong khi Slack cho biết âm thanh nhập liệu bằng giọng nói không được lưu trữ.

Trong kênh có `requireMention: true`, đoạn âm thanh không có chú thích có thể đáp ứng cổng kiểm tra bằng cách đọc thành tiếng một mẫu đề cập đã cấu hình (`agents.list[].groupChat.mentionPatterns`, dự phòng về `messages.groupChat.mentionPatterns`). OpenClaw cấp quyền cho người gửi trước khi tải xuống hoặc phiên âm đoạn âm thanh, sau đó chỉ tiếp nhận khi bản phiên âm khớp. Bản phiên âm thử nghiệm bị lỗi hoặc không khớp sẽ bị loại bỏ cùng đoạn âm thanh đã tải xuống; nội dung đó không được lưu giữ trong lịch sử kênh. Không thể suy ra danh tính `@bot` gốc của Slack từ lời nói, vì vậy hãy cấu hình mẫu tên được đọc thành tiếng hoặc thêm một đề cập được nhập bằng văn bản. Nếu bật phản chiếu bản phiên âm, nội dung phản chiếu chỉ được gửi sau khi tiếp nhận.

## Phương tiện, chia khúc và phân phối

<AccordionGroup>
  <Accordion title="Tệp đính kèm đến">
    Tệp đính kèm Slack được tải xuống từ các URL riêng tư do Slack lưu trữ (luồng yêu cầu được xác thực bằng token) và ghi vào kho phương tiện khi truy xuất thành công và giới hạn kích thước cho phép. Phần giữ chỗ của tệp bao gồm `fileId` của Slack để tác nhân có thể truy xuất tệp gốc bằng `download-file`.

    Hoạt động tải xuống sử dụng thời gian chờ nhàn rỗi và tổng thời gian chờ có giới hạn. Nếu quá trình truy xuất tệp Slack bị đình trệ hoặc thất bại, OpenClaw vẫn tiếp tục xử lý tin nhắn và dự phòng về phần giữ chỗ của tệp.

    Giới hạn kích thước đầu vào khi chạy mặc định là `20MB` trừ khi bị ghi đè bởi `channels.slack.mediaMaxMb`.

  </Accordion>

  <Accordion title="Văn bản và tệp gửi đi">
    - các khúc văn bản sử dụng `channels.slack.textChunkLimit` (mặc định `8000`, bị giới hạn theo giới hạn độ dài tin nhắn riêng của Slack)
    - `channels.slack.streaming.chunkMode="newline"` bật việc tách theo đoạn văn trước
    - việc gửi tệp sử dụng các API tải lên của Slack và có thể bao gồm câu trả lời trong luồng (`thread_ts`)
    - chú thích tệp dài sử dụng khúc văn bản đầu tiên an toàn với Slack làm bình luận tải lên và gửi các khúc còn lại dưới dạng tin nhắn tiếp theo
    - giới hạn phương tiện gửi đi tuân theo `channels.slack.mediaMaxMb` khi được cấu hình; nếu không, hoạt động gửi qua kênh sử dụng các giá trị mặc định theo loại MIME từ quy trình phương tiện

  </Accordion>

  <Accordion title="Đích phân phối">
    Các đích tường minh được ưu tiên:

    - `user:<id>` cho DM
    - `channel:<id>` cho kênh

    DM Slack chỉ có văn bản/khối có thể đăng trực tiếp đến ID người dùng; hoạt động tải tệp lên và gửi trong luồng sẽ mở DM qua các API cuộc trò chuyện của Slack trước vì những đường dẫn này yêu cầu ID cuộc trò chuyện cụ thể.

  </Accordion>
</AccordionGroup>

## Lệnh và hành vi dấu gạch chéo

Các lệnh dấu gạch chéo xuất hiện trong Slack dưới dạng một lệnh duy nhất được cấu hình hoặc nhiều lệnh gốc. Cấu hình `channels.slack.slashCommand` để thay đổi giá trị mặc định của lệnh:

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

Các lệnh gốc yêu cầu [cài đặt manifest bổ sung](#additional-manifest-settings) trong ứng dụng Slack của bạn và thay vào đó được bật bằng `channels.slack.commands.native: true` hoặc `commands.native: true` trong cấu hình toàn cục.

- Chế độ tự động cho lệnh gốc được **tắt** đối với Slack, vì vậy `commands.native: "auto"` không bật các lệnh gốc của Slack.

```txt
/help
```

Các menu đối số gốc được hiển thị theo một trong các dạng sau, theo thứ tự ưu tiên:

- 3-5 tùy chọn đủ ngắn: menu mục bổ sung ("...")
- hơn 100 tùy chọn, khi có khả năng lọc tùy chọn bất đồng bộ: lựa chọn bên ngoài
- 1-2 tùy chọn hoặc bất kỳ tùy chọn nào có giá trị mã hóa quá dài đối với bộ chọn: các khối nút
- các trường hợp khác (6-100 tùy chọn hoặc hơn 100 tùy chọn nhưng không có bộ lọc bất đồng bộ): menu lựa chọn tĩnh, được chia thành 100 tùy chọn cho mỗi menu

```txt
/think
```

Các phiên dấu gạch chéo sử dụng khóa biệt lập như `agent:<agentId>:slack:slash:<userId>` và vẫn định tuyến việc thực thi lệnh đến phiên cuộc trò chuyện đích bằng `CommandTargetSessionKey`.

## Biểu đồ gốc

[Khối Block Kit `data_visualization`](https://docs.slack.dev/reference/block-kit/blocks/data-visualization-block/) công khai của Slack
hiển thị biểu đồ đường, cột, miền và tròn trong tin nhắn. OpenClaw ánh xạ khối
`presentation` `chart` di động sang dạng gốc đó; không cần thêm phạm vi OAuth,
tải tệp lên, trình kết xuất hình ảnh hoặc cấu hình Slack nào ngoài quyền truy cập tin nhắn
`chat:write` thông thường.

```json
{
  "blocks": [
    {
      "type": "chart",
      "chartType": "bar",
      "title": "Doanh thu hàng quý",
      "categories": ["Q1", "Q2"],
      "series": [{ "name": "Doanh thu", "values": [120, 145] }],
      "xLabel": "Quý"
    }
  ]
}
```

Các giới hạn của Slack được thực thi trước khi hiển thị gốc:

- tiêu đề và nhãn trục tùy chọn: 50 ký tự
- biểu đồ tròn: 1-12 phân đoạn dương
- biểu đồ đường/cột/miền: 1-12 chuỗi có tên duy nhất và 1-20 danh mục dùng chung
- nhãn phân đoạn, danh mục và chuỗi: 20 ký tự
- mỗi chuỗi phải chứa một giá trị hữu hạn cho mỗi danh mục; các giá trị không thuộc biểu đồ tròn
  có thể âm

Mỗi biểu đồ gốc cũng chứa một bản biểu diễn văn bản cấp cao nhất dành cho trình
đọc màn hình, thông báo, phản chiếu phiên và các ứng dụng khách không thể hiển thị
khối. Các lượt gửi bản trình bày tiêu chuẩn đến những kênh OpenClaw khác nhận cùng
dữ liệu biểu đồ xác định đó dưới dạng văn bản, trừ khi chúng công bố hỗ trợ biểu đồ gốc. Nếu
Slack từ chối biểu đồ bằng `invalid_blocks` trong quá trình triển khai theo giai đoạn, OpenClaw
loại bỏ các khối dữ liệu gốc bị từ chối, giữ lại mọi điều khiển cùng cấp và gửi
bản biểu diễn biểu đồ đầy đủ dưới dạng văn bản hiển thị.

Slack hiện chấp nhận tối đa hai khối `data_visualization` trong mỗi tin nhắn. Khi
một bản trình bày chứa hơn hai biểu đồ hợp lệ, OpenClaw giữ nguyên thứ tự
và tiếp tục hiển thị gốc trong các tin nhắn tiếp theo, với không quá hai
biểu đồ trong mỗi tin nhắn.

[Thông báo ra mắt dành cho nhà phát triển](https://docs.slack.dev/changelog/2026/06/16/block-kit-data-visualization-block/)
của Slack mô tả khối này là một tính năng Block Kit dành cho ứng dụng và không công bố
hạn chế nào về gói trả phí. Nội dung về điều kiện Business+/Enterprise áp dụng cho
việc Slackbot tự động tạo biểu đồ bằng AI, tách biệt với việc ứng dụng gửi
một biểu đồ Block Kit đã có cấu trúc. Biểu đồ là các khối chỉ dành cho tin nhắn, không phải nội dung
App Home, cửa sổ phương thức hoặc Canvas.

## Bảng gốc

[Khối Block Kit `data_table`](https://docs.slack.dev/reference/block-kit/blocks/data-table-block/) hiện tại của Slack
hiển thị các hàng và cột có cấu trúc trong tin nhắn. OpenClaw ánh xạ một khối
`presentation` `table` di động tường minh sang `data_table`; nó không sử dụng
[khối `table` cũ](https://docs.slack.dev/reference/block-kit/blocks/table-block/) của Slack.
Không cần thêm phạm vi OAuth hoặc cấu hình Slack nào ngoài quyền truy cập tin nhắn
`chat:write` thông thường.

```json
{
  "blocks": [
    {
      "type": "table",
      "caption": "Quy trình đang mở",
      "headers": ["Tài khoản", "Giai đoạn", "ARR"],
      "rows": [
        ["Acme", "Đã thắng", 125000],
        ["Globex", "Đánh giá", 82000]
      ],
      "rowHeaderColumnIndex": 0
    }
  ]
}
```

OpenClaw ánh xạ ô tiêu đề và ô chuỗi sang các ô `raw_text` của Slack. Ô số
được ánh xạ sang `raw_number`, đồng thời giữ nguyên giá trị số hữu hạn để sắp xếp
và lọc gốc. Khi có, `rowHeaderColumnIndex` đánh dấu cột
có chỉ số bắt đầu từ 0 đó làm tiêu đề hàng của Slack.

Các giới hạn `data_table` được Slack công bố được thực thi trước khi hiển thị gốc:

- 1-20 cột
- 1-100 hàng dữ liệu, cộng thêm hàng tiêu đề
- mọi hàng có cùng số lượng ô
- tối đa tổng cộng 10.000 ký tự trong tất cả ô bảng của một tin nhắn

Nhiều khối bảng hợp lệ có thể hiển thị theo dạng gốc miễn là tin nhắn vẫn
nằm trong giới hạn tổng số ký tự. Bảng không thể hiển thị trong
khung gốc sẽ trở thành văn bản xác định đầy đủ thay vì mất hàng hoặc
ô. Nếu văn bản đó vượt quá một tin nhắn Slack, hoạt động gửi và phản hồi lệnh dấu gạch chéo sử dụng
các khúc văn bản có thứ tự. Việc chỉnh sửa bảng thất bại với lỗi kích thước tường minh thay vì
âm thầm cắt bớt hàng khỏi tin nhắn hiện có.

Mỗi bảng gốc được tạo từ bản trình bày di động cũng chứa một bản biểu diễn
văn bản cấp cao nhất dành cho trình đọc màn hình, thông báo, phản chiếu phiên và
các ứng dụng khách không thể hiển thị khối. Các giá trị biểu đồ và bảng thô được giữ nguyên
trong bản dự phòng, vì vậy dữ liệu ô như `<@U123>` không trở thành đề cập Slack.
Nếu Slack từ chối các khối biểu đồ hoặc bảng gốc bằng `invalid_blocks`, OpenClaw
loại bỏ mọi khối dữ liệu gốc trong một bước khôi phục có giới hạn, giữ lại các
khối cùng cấp hợp lệ như nút và bộ chọn, đồng thời gửi văn bản biểu đồ
và bảng hiển thị đầy đủ khi đã tắt định dạng Slack. Hoạt động phân phối lệnh dấu gạch chéo
theo dõi hạn mức năm lần gọi `response_url` của Slack trong suốt lệnh. Trước mỗi
lô phản hồi, hệ thống chọn một kế hoạch hoàn chỉnh phù hợp với số lượt gọi còn lại hoặc thất bại
trước khi đăng lô đó.

Chỉ các khối bảng `presentation` tường minh mới được nâng cấp thành bảng gốc.
Các bảng Markdown dùng dấu sổ dọc vẫn là văn bản được biên soạn; OpenClaw không suy đoán cấu trúc
bảng hoặc kiểu ô. Các trình tạo nội dung Slack gốc đáng tin cậy hiện có có thể tiếp tục
truyền các khối thô qua `channelData.slack.blocks`; OpenClaw tạo văn bản
dự phòng từ các ô `data_table` thô hợp lệ, trong khi các khối tùy chỉnh không đúng định dạng có thể
suy giảm thành chú thích hoặc nội dung dự phòng Block Kit chung. Đầu ra từ tác nhân, CLI
và plugin di động nên sử dụng `presentation`.

## Phản hồi tương tác

Slack có thể hiển thị các điều khiển phản hồi tương tác do tác nhân tạo, nhưng tính năng này bị tắt theo mặc định.
Đối với đầu ra mới từ tác nhân, CLI và plugin, hãy ưu tiên các nút
hoặc khối lựa chọn `presentation` dùng chung. Chúng sử dụng cùng đường dẫn tương tác
của Slack, đồng thời cũng có thể suy giảm trên các kênh khác.

Bật trên toàn cục:

```json5
{
  channels: {
    slack: {
      capabilities: {
        interactiveReplies: true,
      },
    },
  },
}
```

Hoặc chỉ bật cho một tài khoản Slack:

```json5
{
  channels: {
    slack: {
      accounts: {
        ops: {
          capabilities: {
            interactiveReplies: true,
          },
        },
      },
    },
  },
}
```

Khi được bật, tác nhân vẫn có thể phát ra các chỉ thị phản hồi chỉ dành cho Slack đã ngừng khuyến nghị:

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

Các chỉ thị này được biên dịch thành Slack Block Kit và định tuyến lượt nhấp hoặc lựa chọn
trở lại qua đường dẫn sự kiện tương tác Slack hiện có. Hãy giữ chúng cho các
lời nhắc cũ và các lối thoát dành riêng cho Slack; sử dụng bản trình bày dùng chung cho các
điều khiển di động mới.

Các API trình biên dịch chỉ thị cũng đã ngừng được khuyến nghị cho mã tạo nội dung mới:

- `compileSlackInteractiveReplies(...)`
- `parseSlackOptionsLine(...)`
- `isSlackInteractiveRepliesEnabled(...)`
- `buildSlackInteractiveBlocks(...)`

Sử dụng tải trọng `presentation` và `buildSlackPresentationBlocks(...)` cho các
điều khiển mới được hiển thị trên Slack.

Lưu ý:

- Đây là giao diện người dùng cũ dành riêng cho Slack. Các kênh khác không chuyển đổi chỉ thị Slack Block
  Kit thành hệ thống nút riêng của chúng.
- Các giá trị callback tương tác là token mờ do OpenClaw tạo, không phải giá trị thô do agent tạo.
- Nếu các khối tương tác được tạo vượt quá giới hạn Slack Block Kit, OpenClaw sẽ quay về phản hồi văn bản ban đầu thay vì gửi payload blocks không hợp lệ.

### Gửi biểu mẫu modal do Plugin sở hữu

Các Plugin Slack đăng ký trình xử lý tương tác cũng có thể nhận sự kiện vòng đời modal
`view_submission` và `view_closed` trước khi OpenClaw thu gọn
payload cho sự kiện hệ thống mà agent có thể thấy. Sử dụng một trong các mẫu định tuyến
sau khi mở modal Slack:

- Đặt `callback_id` thành `openclaw:<namespace>:<payload>`.
- Hoặc giữ `callback_id` hiện có và đặt `pluginInteractiveData:
"<namespace>:<payload>"` vào `private_metadata` của modal.

Trình xử lý nhận `ctx.interaction.kind` dưới dạng `view_submission` hoặc
`view_closed`, `inputs` đã chuẩn hóa và đối tượng `stateValues` thô đầy đủ từ
Slack. Chỉ định tuyến theo callback ID là đủ để gọi trình xử lý Plugin; hãy bao gồm
các trường định tuyến người dùng/phiên `private_metadata` hiện có của modal khi
modal cũng cần tạo sự kiện hệ thống mà agent có thể thấy. Agent nhận được một
sự kiện hệ thống `Slack interaction: ...` nhỏ gọn, đã biên tập. Nếu trình xử lý trả về
`systemEvent.summary`, `systemEvent.reference` hoặc `systemEvent.data`, các
trường đó sẽ được đưa vào sự kiện nhỏ gọn này để agent có thể tham chiếu
bộ nhớ do Plugin sở hữu mà không nhìn thấy payload biểu mẫu hoàn chỉnh.

## Phê duyệt gốc trong Slack

Slack có thể hoạt động như một ứng dụng khách phê duyệt gốc với các nút và tương tác, thay vì quay về giao diện web hoặc terminal.

- Phê duyệt thực thi và Plugin có thể hiển thị dưới dạng lời nhắc Block Kit gốc của Slack.
- `channels.slack.execApprovals.*` vẫn là cấu hình bật ứng dụng khách phê duyệt thực thi gốc và định tuyến DM/kênh.
- DM phê duyệt thực thi sử dụng `channels.slack.execApprovals.approvers` hoặc `commands.ownerAllowFrom`.
- Phê duyệt Plugin sử dụng các nút gốc của Slack khi Slack được bật làm ứng dụng khách phê duyệt gốc cho phiên khởi tạo, hoặc khi `approvals.plugin` định tuyến đến phiên Slack khởi tạo hay một đích Slack.
- DM phê duyệt Plugin sử dụng người phê duyệt Plugin Slack từ `channels.slack.allowFrom`, `allowFrom` của tài khoản có tên hoặc tuyến mặc định của tài khoản.
- Việc cấp quyền cho người phê duyệt vẫn được thực thi: người chỉ có quyền phê duyệt thực thi không thể phê duyệt yêu cầu Plugin trừ khi họ cũng là người phê duyệt Plugin.

Tính năng này sử dụng cùng bề mặt nút phê duyệt dùng chung như các kênh khác. Khi `interactivity` được bật trong phần cài đặt ứng dụng Slack, lời nhắc phê duyệt sẽ hiển thị trực tiếp dưới dạng nút Block Kit trong cuộc trò chuyện.
Khi có các nút này, chúng là trải nghiệm phê duyệt chính; OpenClaw
chỉ nên đưa vào lệnh `/approve` thủ công khi kết quả công cụ cho biết
phê duyệt qua trò chuyện không khả dụng hoặc phê duyệt thủ công là cách duy nhất.

Đường dẫn cấu hình:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (tùy chọn; quay về `commands.ownerAllowFrom` khi có thể)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`, mặc định: `dm`)
- `agentFilter`, `sessionFilter`

Slack tự động bật phê duyệt thực thi gốc khi `enabled` chưa được đặt hoặc là `"auto"` và phân giải được ít nhất một
người phê duyệt thực thi. Slack cũng có thể xử lý phê duyệt Plugin gốc thông qua đường dẫn ứng dụng khách gốc này
khi phân giải được người phê duyệt Plugin Slack và yêu cầu khớp với bộ lọc của ứng dụng khách gốc. Đặt
`enabled: false` để vô hiệu hóa rõ ràng Slack với vai trò ứng dụng khách phê duyệt gốc. Đặt `enabled: true` để
buộc bật phê duyệt gốc khi phân giải được người phê duyệt. Việc vô hiệu hóa phê duyệt thực thi Slack không vô hiệu hóa
việc phân phối phê duyệt Plugin Slack gốc được bật thông qua `approvals.plugin`; thay vào đó, việc phân phối phê duyệt Plugin
sử dụng người phê duyệt Plugin Slack.

Hành vi mặc định khi không có cấu hình phê duyệt thực thi Slack rõ ràng:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

Chỉ cần cấu hình gốc của Slack một cách rõ ràng khi bạn muốn ghi đè người phê duyệt, thêm bộ lọc hoặc
chọn nhận phân phối vào cuộc trò chuyện khởi tạo:

```json5
{
  channels: {
    slack: {
      execApprovals: {
        enabled: true,
        approvers: ["U12345678"],
        target: "both",
      },
    },
  },
}
```

Chuyển tiếp `approvals.exec` dùng chung là riêng biệt. Chỉ sử dụng tính năng này khi lời nhắc phê duyệt thực thi cũng phải
định tuyến đến các cuộc trò chuyện khác hoặc các đích ngoài băng được chỉ định rõ ràng. Chuyển tiếp `approvals.plugin` dùng chung cũng
riêng biệt; việc phân phối gốc của Slack chỉ chặn phương án dự phòng đó khi Slack có thể xử lý yêu cầu phê duyệt
Plugin theo cách gốc.

`/approve` trong cùng cuộc trò chuyện cũng hoạt động trong các kênh và DM Slack đã hỗ trợ lệnh. Xem [Phê duyệt thực thi](/vi/tools/exec-approvals) để biết đầy đủ mô hình chuyển tiếp phê duyệt.

## Sự kiện và hành vi vận hành

- Thao tác chỉnh sửa/xóa tin nhắn được ánh xạ thành sự kiện hệ thống.
- Các lượt phát vào kênh từ luồng (phản hồi luồng dùng "Also send to channel") được xử lý như tin nhắn người dùng thông thường.
- Sự kiện thêm/xóa phản ứng được ánh xạ thành sự kiện hệ thống.
- Sự kiện thành viên tham gia/rời đi, kênh được tạo/đổi tên và thêm/xóa ghim được ánh xạ thành sự kiện hệ thống.
- Tính năng thăm dò trạng thái hiện diện tùy chọn có thể ánh xạ chuyển đổi từ `away` sang `active` của một người tham gia được quan sát vào phiên Slack đủ điều kiện hoạt động gần đây nhất của người đó. Theo mặc định, tính năng này tắt.
- `channel_id_changed` có thể di chuyển các khóa cấu hình kênh khi `configWrites` được bật.
- Siêu dữ liệu chủ đề/mục đích của kênh được xem là ngữ cảnh không đáng tin cậy và có thể được chèn vào ngữ cảnh định tuyến.
- Nội dung khởi đầu luồng và việc khởi tạo ngữ cảnh lịch sử ban đầu của luồng được lọc theo danh sách người gửi được phép đã cấu hình khi áp dụng.
- Thao tác khối, lối tắt và tương tác modal phát ra sự kiện hệ thống `Slack interaction: ...` có cấu trúc với các trường payload phong phú:
  - thao tác khối: các giá trị đã chọn, nhãn, giá trị bộ chọn và siêu dữ liệu `workflow_*`
  - lối tắt toàn cục: siêu dữ liệu callback và tác nhân, được định tuyến đến phiên trực tiếp của tác nhân
  - lối tắt tin nhắn: ngữ cảnh callback, tác nhân, kênh, luồng và tin nhắn đã chọn
  - sự kiện modal `view_submission` và `view_closed` với siêu dữ liệu kênh đã định tuyến và dữ liệu nhập biểu mẫu

Định nghĩa lối tắt toàn cục hoặc lối tắt tin nhắn trong cấu hình ứng dụng Slack và sử dụng bất kỳ callback ID không rỗng nào. OpenClaw xác nhận các payload lối tắt khớp, áp dụng cùng chính sách người gửi DM/kênh như các tương tác Slack khác và đưa sự kiện đã làm sạch vào hàng đợi cho phiên agent được định tuyến. ID kích hoạt và URL phản hồi được biên tập khỏi ngữ cảnh agent.

### Sự kiện hiện diện

Slack không gửi thay đổi trạng thái hiện diện thông qua Events API hoặc Socket Mode. Thay vào đó, OpenClaw có thể thăm dò [`users.getPresence`](https://docs.slack.dev/reference/methods/users.getPresence/) đối với những người tham gia là con người có tin nhắn đã vượt qua các bước kiểm tra truy cập và định tuyến Slack thông thường.

```json5
{
  channels: {
    slack: {
      presenceEvents: { mode: "auto" },
      channels: {
        C0123456789: { presenceEvents: { mode: "on" } },
        C0987654321: { presenceEvents: { mode: "off" } },
      },
    },
  },
}
```

- `off` (mặc định): không có bộ hẹn giờ hiện diện hoặc lệnh gọi Slack API.
- `auto`: giám sát DM, MPIM và các luồng Slack hoạt động trong 24 giờ qua, với tối đa 8 người tham gia là con người được quan sát. Các phiên kênh cấp cao nhất bị loại trừ.
- `on`: giám sát cùng các cuộc trò chuyện đó mà không giới hạn số người tham gia và bao gồm các phiên kênh cấp cao nhất. Sử dụng ghi đè theo từng kênh để buộc bật hoặc chặn một kênh.

OpenClaw thăm dò tối đa 45 người dùng riêng biệt mỗi phút cho mỗi tài khoản Slack, khởi tạo kết quả đầu tiên mà không đánh thức agent và chỉ đánh thức khi quan sát thấy chuyển đổi từ `away` sang `active`. Thời gian chờ bền vững 8 giờ được áp dụng cho mỗi tài khoản Slack và người dùng, ngay cả khi người đó tham gia nhiều luồng. Sự kiện chỉ định tuyến đến cuộc trò chuyện đủ điều kiện hoạt động gần đây nhất của người đó và yêu cầu agent tham khảo bộ nhớ/wiki cùng ngữ cảnh múi giờ đã biết trước khi quyết định có gửi một lời chào ngắn hay không. Agent có thể giữ im lặng.

Token bot cần `users:read`, nội dung này đã có trong manifest được đề xuất. Sự kiện hiện diện không khả dụng cho bản cài đặt toàn tổ chức Enterprise Grid.

## Tham chiếu cấu hình

Tham chiếu chính: [Tham chiếu cấu hình - Slack](/vi/gateway/config-channels#slack).

<Accordion title="Các trường Slack quan trọng">

- chế độ/xác thực: `mode`, `enterpriseOrgInstall`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
- quyền truy cập DM: `dm.enabled`, `dmPolicy`, `allowFrom` (cũ: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
- nút bật/tắt tương thích: `dangerouslyAllowNameMatching` (phương án khẩn cấp; giữ tắt trừ khi cần)
- quyền truy cập kênh: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
- luồng/lịch sử: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- đánh thức theo trạng thái hiện diện: `presenceEvents.mode`, `channels.*.presenceEvents.mode` (`off|auto|on`; mặc định `off`)
- phân phối: `textChunkLimit`, `streaming.chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`, `streaming.preview.toolProgress`
- mở rộng xem trước: `unfurlLinks` (mặc định: `false`), `unfurlMedia` để kiểm soát bản xem trước liên kết/phương tiện `chat.postMessage`; đặt `unfurlLinks: true` để bật lại bản xem trước liên kết
- vận hành/tính năng: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

</Accordion>

## Khắc phục sự cố

<AccordionGroup>
  <Accordion title="Không có phản hồi trong kênh">
    Kiểm tra theo thứ tự:

    - `groupPolicy`
    - danh sách kênh được phép (`channels.slack.channels`) — **khóa phải là ID kênh** (`C12345678`), không phải tên (`#channel-name`). Khóa dựa trên tên âm thầm thất bại trong `groupPolicy: "allowlist"` vì theo mặc định, định tuyến kênh ưu tiên ID. Để tìm ID: nhấp chuột phải vào kênh trong Slack → **Copy link** — giá trị `C...` ở cuối URL là ID kênh.
    - `requireMention`
    - danh sách được phép `users` theo từng kênh
    - `messages.groupChat.visibleReplies`: các yêu cầu nhóm/kênh thông thường mặc định là `"automatic"`. Nếu bạn đã chọn dùng `"message_tool"` và nhật ký hiển thị văn bản của trợ lý nhưng không có lệnh gọi `message(action=send)`, mô hình đã bỏ lỡ đường dẫn công cụ tin nhắn hiển thị. Văn bản cuối cùng vẫn ở chế độ riêng tư trong chế độ này; hãy kiểm tra nhật ký chi tiết của Gateway để tìm siêu dữ liệu payload bị chặn, hoặc đặt thành `"automatic"` nếu bạn muốn mọi phản hồi cuối cùng thông thường của trợ lý được đăng qua đường dẫn cũ.
    - `messages.groupChat.unmentionedInbound`: nếu là `"room_event"`, nội dung trò chuyện không đề cập trong kênh được phép là ngữ cảnh xung quanh và sẽ giữ im lặng trừ khi agent gọi công cụ `message`. Xem [Sự kiện phòng xung quanh](/vi/channels/ambient-room-events).

```json5
{
  messages: {
    groupChat: {
      visibleReplies: "automatic",
    },
  },
}
```

    Các lệnh hữu ích:

```bash
openclaw channels status --probe
openclaw logs --follow
openclaw doctor
```

  </Accordion>

  <Accordion title="Tin nhắn DM bị bỏ qua">
    Kiểm tra:

    - `channels.slack.dm.enabled`
    - `channels.slack.dmPolicy` (hoặc `channels.slack.dm.policy` cũ)
    - phê duyệt ghép nối / mục trong danh sách cho phép (`dmPolicy: "open"` vẫn yêu cầu `channels.slack.allowFrom: ["*"]`)
    - DM nhóm sử dụng cơ chế xử lý MPIM; bật `channels.slack.dm.groupEnabled` và, nếu đã cấu hình, đưa MPIM vào `channels.slack.dm.groupChannels`
    - sự kiện DM của Slack Assistant: nhật ký chi tiết đề cập đến `drop message_changed`
      thường có nghĩa là Slack đã gửi một sự kiện luồng Assistant đã chỉnh sửa mà
      không thể khôi phục người gửi là con người từ siêu dữ liệu tin nhắn

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Chế độ Socket không kết nối">
    Xác thực token bot + ứng dụng và việc bật Socket Mode trong phần cài đặt ứng dụng Slack.
    App-Level Token cần `connections:write`, và token bot Bot User OAuth Token
    phải thuộc cùng ứng dụng/không gian làm việc Slack với token ứng dụng.

    Nếu `openclaw channels status --probe --json` hiển thị `botTokenStatus` hoặc
    `appTokenStatus: "configured_unavailable"`, tài khoản Slack đã được
    cấu hình nhưng môi trường thực thi hiện tại không thể phân giải giá trị
    được SecretRef hỗ trợ.

    Các nhật ký như `slack socket mode failed to start; retry ...` là lỗi
    khởi động có thể khôi phục. Thay vào đó, phạm vi bị thiếu, token bị thu hồi và thông tin xác thực không hợp lệ sẽ
    thất bại ngay lập tức. Nhật ký `slack token mismatch ...` có nghĩa là token bot và token ứng dụng
    dường như thuộc các ứng dụng Slack khác nhau; hãy sửa thông tin xác thực của ứng dụng Slack.

  </Accordion>

  <Accordion title="Chế độ HTTP không nhận được sự kiện">
    Xác thực:

    - bí mật ký
    - đường dẫn Webhook
    - URL yêu cầu của Slack (Sự kiện + Tính tương tác + Lệnh gạch chéo)
    - `webhookPath` duy nhất cho mỗi tài khoản HTTP
    - URL công khai kết thúc TLS và chuyển tiếp yêu cầu đến đường dẫn Gateway
    - đường dẫn `request_url` của ứng dụng Slack khớp chính xác với `channels.slack.webhookPath` (mặc định `/slack/events`)

    Nếu `signingSecretStatus: "configured_unavailable"` xuất hiện trong ảnh chụp nhanh
    tài khoản, tài khoản HTTP đã được cấu hình nhưng môi trường thực thi hiện tại không thể
    phân giải bí mật ký được SecretRef hỗ trợ.

    Nhật ký `slack: webhook path ... already registered` lặp lại có nghĩa là hai tài khoản HTTP
    đang sử dụng cùng `webhookPath`; hãy cấp cho mỗi tài khoản một đường dẫn riêng biệt.

  </Accordion>

  <Accordion title="Lệnh gốc/lệnh gạch chéo không được kích hoạt">
    Xác minh xem bạn dự định dùng:

    - chế độ lệnh gốc (`channels.slack.commands.native: true`) với các lệnh gạch chéo tương ứng đã đăng ký trong Slack
    - hoặc chế độ một lệnh gạch chéo (`channels.slack.slashCommand.enabled: true`)

    Slack không tự động tạo hoặc xóa lệnh gạch chéo. `commands.native: "auto"` không bật lệnh gốc của Slack; hãy sử dụng `true` và tạo các lệnh tương ứng trong ứng dụng Slack. Ở chế độ HTTP, mọi lệnh gạch chéo của Slack phải bao gồm URL Gateway. Ở Socket Mode, tải trọng lệnh đến qua websocket và Slack bỏ qua `slash_commands[].url`.

    Đồng thời kiểm tra `commands.useAccessGroups`, quyền DM, danh sách cho phép của kênh
    và danh sách cho phép `users` theo từng kênh. Slack trả về lỗi tạm thời cho
    người gửi lệnh gạch chéo bị chặn, bao gồm:

    - `This channel is not allowed.`
    - `You are not authorized to use this command here.`

  </Accordion>
</AccordionGroup>

## Tham chiếu phương tiện đính kèm

Slack có thể đính kèm phương tiện đã tải xuống vào lượt của tác nhân khi việc tải tệp từ Slack thành công và giới hạn kích thước cho phép. Có thể phiên âm đoạn âm thanh, chuyển tệp hình ảnh qua luồng hiểu phương tiện hoặc trực tiếp đến mô hình trả lời hỗ trợ thị giác, còn các tệp khác vẫn có thể được dùng làm ngữ cảnh tệp có thể tải xuống.

### Các loại phương tiện được hỗ trợ

| Loại phương tiện               | Nguồn                | Hành vi hiện tại                                                                  | Ghi chú                                                                   |
| ------------------------------ | -------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Đoạn âm thanh Slack            | URL tệp Slack        | Được tải xuống và chuyển qua quy trình phiên âm dùng chung                        | Yêu cầu `files:read` và mô hình hoặc CLI `tools.media.audio` hoạt động      |
| Hình ảnh JPEG / PNG / GIF / WebP | URL tệp Slack      | Được tải xuống và đính kèm vào lượt để xử lý bằng khả năng thị giác               | Giới hạn mỗi tệp: `channels.slack.mediaMaxMb` (mặc định 20 MB)                 |
| Tệp PDF                        | URL tệp Slack        | Được tải xuống và cung cấp làm ngữ cảnh tệp cho các công cụ như `download-file` hoặc `pdf` | Đầu vào Slack không tự động chuyển đổi PDF thành đầu vào thị giác hình ảnh |
| Các tệp khác                   | URL tệp Slack        | Được tải xuống khi có thể và cung cấp làm ngữ cảnh tệp                            | Tệp nhị phân không được coi là đầu vào hình ảnh                            |
| Phản hồi trong luồng           | Tệp của tin nhắn mở đầu luồng | Tệp của tin nhắn gốc có thể được nạp làm ngữ cảnh khi phản hồi không có phương tiện trực tiếp | Tin nhắn mở đầu chỉ có tệp sử dụng phần giữ chỗ cho tệp đính kèm |
| Tin nhắn nhiều tệp             | Nhiều tệp Slack      | Mỗi tệp được đánh giá độc lập                                                      | Quy trình xử lý Slack giới hạn ở tám tệp cho mỗi tin nhắn                  |

### Quy trình đầu vào

Khi một tin nhắn Slack có tệp đính kèm đến:

1. OpenClaw tải tệp xuống từ URL riêng tư của Slack bằng token bot.
2. Tệp được ghi vào kho phương tiện khi thành công.
3. Đường dẫn và loại nội dung của phương tiện đã tải xuống được thêm vào ngữ cảnh đầu vào.
4. Đoạn âm thanh được chuyển đến quy trình phiên âm dùng chung; các đường dẫn mô hình/công cụ hỗ trợ hình ảnh có thể sử dụng tệp đính kèm hình ảnh từ cùng ngữ cảnh.
5. Các tệp khác vẫn có thể được dùng dưới dạng siêu dữ liệu tệp hoặc tham chiếu phương tiện cho những công cụ có thể xử lý chúng.

### Kế thừa tệp đính kèm từ gốc luồng

Khi một tin nhắn đến trong luồng (có phần tử cha `thread_ts`):

- Nếu bản thân phản hồi không có phương tiện trực tiếp và tin nhắn gốc được đưa vào có tệp, Slack có thể nạp các tệp gốc làm ngữ cảnh mở đầu luồng.
- Tệp gốc chỉ được nạp khi khởi tạo một phiên luồng mới hoặc đã đặt lại. Các phản hồi chỉ có văn bản sau đó tái sử dụng ngữ cảnh phiên hiện có và không đính kèm lại tệp gốc dưới dạng phương tiện mới.
- Tệp đính kèm trực tiếp của phản hồi được ưu tiên hơn tệp đính kèm của tin nhắn gốc.
- Tin nhắn gốc chỉ có tệp và không có văn bản được biểu diễn bằng phần giữ chỗ cho tệp đính kèm để phương án dự phòng vẫn có thể bao gồm các tệp của tin nhắn đó.

### Xử lý nhiều tệp đính kèm

Khi một tin nhắn Slack chứa nhiều tệp đính kèm:

- Mỗi tệp đính kèm được xử lý độc lập qua quy trình phương tiện.
- Các tham chiếu phương tiện đã tải xuống được tổng hợp vào ngữ cảnh tin nhắn.
- Thứ tự xử lý tuân theo thứ tự tệp của Slack trong tải trọng sự kiện.
- Lỗi tải xuống một tệp đính kèm không chặn các tệp khác.

### Giới hạn kích thước, tải xuống và mô hình

- **Giới hạn kích thước**: Mặc định 20 MB cho mỗi tệp. Có thể cấu hình qua `channels.slack.mediaMaxMb`.
- **Giới hạn phiên âm**: `tools.media.audio.maxBytes` cũng áp dụng khi tệp đã tải xuống được gửi đến nhà cung cấp dịch vụ phiên âm hoặc CLI.
- **Lỗi tải xuống**: Các tệp Slack không thể cung cấp, URL hết hạn, tệp không thể truy cập, tệp quá kích thước và phản hồi HTML xác thực/đăng nhập của Slack sẽ bị bỏ qua thay vì được báo cáo là định dạng không được hỗ trợ.
- **Mô hình thị giác**: Phân tích hình ảnh sử dụng mô hình trả lời đang hoạt động khi mô hình đó hỗ trợ thị giác, hoặc mô hình hình ảnh được cấu hình tại `agents.defaults.imageModel`.

### Giới hạn đã biết

| Tình huống                                    | Hành vi hiện tại                                                                   | Cách khắc phục                                                                 |
| --------------------------------------------- | ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| URL tệp Slack đã hết hạn                      | Tệp bị bỏ qua; không hiển thị lỗi                                                   | Tải lại tệp lên Slack                                                         |
| Không có tính năng phiên âm                   | Đoạn âm thanh vẫn được đính kèm nhưng không tạo bản phiên âm                        | Cấu hình `tools.media.audio` hoặc cài đặt CLI phiên âm cục bộ được hỗ trợ  |
| Đoạn âm thanh không có chú thích không vượt qua cổng đề cập | Bị loại bỏ sau khi phiên âm suy đoán riêng tư; bản phiên âm và tệp tải xuống bị loại bỏ | Cấu hình mẫu đề cập tên được nói, thêm đề cập bot bằng văn bản hoặc sử dụng DM |
| Chưa cấu hình mô hình thị giác                | Tệp đính kèm hình ảnh được lưu dưới dạng tham chiếu phương tiện nhưng không được phân tích như hình ảnh | Cấu hình `agents.defaults.imageModel` hoặc sử dụng mô hình trả lời hỗ trợ thị giác    |
| Hình ảnh rất lớn (> 20 MB theo mặc định)      | Bị bỏ qua theo giới hạn kích thước                                                   | Tăng `channels.slack.mediaMaxMb` nếu Slack cho phép                          |
| Tệp đính kèm được chuyển tiếp/chia sẻ         | Văn bản và phương tiện hình ảnh/tệp do Slack lưu trữ được xử lý theo khả năng tốt nhất | Chia sẻ lại trực tiếp trong luồng OpenClaw                                    |
| Tệp đính kèm PDF                              | Được lưu dưới dạng ngữ cảnh tệp/phương tiện, không tự động chuyển qua thị giác hình ảnh | Sử dụng `download-file` cho siêu dữ liệu tệp hoặc công cụ `pdf` để phân tích PDF      |

### Tài liệu liên quan

- [Quy trình hiểu phương tiện](/vi/nodes/media-understanding)
- [Âm thanh và ghi chú thoại](/vi/nodes/audio)
- [Công cụ PDF](/vi/tools/pdf)

## Liên quan

<CardGroup cols={2}>
  <Card title="Ghép nối" icon="link" href="/vi/channels/pairing">
    Ghép nối người dùng Slack với Gateway.
  </Card>
  <Card title="Nhóm" icon="users" href="/vi/channels/groups">
    Hành vi của kênh và DM nhóm.
  </Card>
  <Card title="Định tuyến kênh" icon="route" href="/vi/channels/channel-routing">
    Định tuyến tin nhắn đầu vào đến các tác nhân.
  </Card>
  <Card title="Bảo mật" icon="shield" href="/vi/gateway/security">
    Mô hình mối đe dọa và tăng cường bảo mật.
  </Card>
  <Card title="Cấu hình" icon="sliders" href="/vi/gateway/configuration">
    Bố cục và thứ tự ưu tiên cấu hình.
  </Card>
  <Card title="Lệnh gạch chéo" icon="terminal" href="/vi/tools/slash-commands">
    Danh mục và hành vi lệnh.
  </Card>
</CardGroup>
