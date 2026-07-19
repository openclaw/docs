---
read_when:
    - Thiết lập Mattermost
    - Gỡ lỗi định tuyến Mattermost
sidebarTitle: Mattermost
summary: Thiết lập bot Mattermost và cấu hình OpenClaw
title: Mattermost
x-i18n:
    generated_at: "2026-07-19T05:42:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: ea41fb9a7e4e9ea6bd8d04a4f2c6d2d7f2e43cf71830e445f1e28e2e8737f3cb
    source_path: channels/mattermost.md
    workflow: 16
---

Trạng thái: plugin có thể tải xuống (token bot + sự kiện WebSocket). Hỗ trợ các kênh, kênh riêng tư, DM nhóm và DM. Mattermost là nền tảng nhắn tin nhóm có thể tự lưu trữ ([mattermost.com](https://mattermost.com)).

## Cài đặt

<Tabs>
  <Tab title="Kho đăng ký npm">
    ```bash
    openclaw plugins install @openclaw/mattermost
    ```
  </Tab>
  <Tab title="Bản checkout cục bộ">
    ```bash
    openclaw plugins install ./path/to/local/mattermost-plugin
    ```
  </Tab>
</Tabs>

Chi tiết: [Plugin](/vi/tools/plugin)

## Thiết lập nhanh

<Steps>
  <Step title="Đảm bảo plugin khả dụng">
    Cài đặt `@openclaw/mattermost` bằng lệnh ở trên, sau đó khởi động lại Gateway nếu Gateway đang chạy.
  </Step>
  <Step title="Tạo bot Mattermost">
    Tạo tài khoản bot Mattermost, sao chép **token bot** và thêm bot vào các nhóm và kênh mà bot cần đọc.
  </Step>
  <Step title="Sao chép URL cơ sở">
    Sao chép **URL cơ sở** của Mattermost (ví dụ: `https://chat.example.com`). Ký tự `/api/v4` ở cuối sẽ tự động bị loại bỏ.
  </Step>
  <Step title="Cấu hình OpenClaw và khởi động Gateway">
    Cấu hình tối thiểu:

    ```json5
    {
      channels: {
        mattermost: {
          enabled: true,
          botToken: "mm-token",
          baseUrl: "https://chat.example.com",
          dmPolicy: "pairing",
        },
      },
    }
    ```

    Phương án thay thế không tương tác:

    ```bash
    openclaw channels add --channel mattermost --bot-token <token> --http-url https://chat.example.com
    ```

  </Step>
</Steps>

<Note>
Mattermost tự lưu trữ tại địa chỉ riêng tư/LAN/tailnet: các yêu cầu API Mattermost gửi đi sẽ đi qua cơ chế bảo vệ SSRF, mặc định chặn các IP riêng tư và nội bộ. Cho phép bằng `channels.mattermost.network.dangerouslyAllowPrivateNetwork: true` (theo từng tài khoản: `channels.mattermost.accounts.<id>.network.dangerouslyAllowPrivateNetwork`).
</Note>

## Lệnh gạch chéo nguyên bản

Các lệnh gạch chéo nguyên bản là tính năng cần chủ động bật. Khi được bật, OpenClaw đăng ký các lệnh gạch chéo `oc_*` trên mọi nhóm mà bot là thành viên và nhận các yêu cầu POST gọi lại trên máy chủ HTTP của Gateway.

```json5
{
  channels: {
    mattermost: {
      commands: {
        native: true,
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // Sử dụng khi Mattermost không thể truy cập trực tiếp Gateway (proxy ngược/URL công khai).
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
    },
  },
}
```

Các lệnh đã đăng ký: `/oc_status`, `/oc_model`, `/oc_models`, `/oc_new`, `/oc_help`, `/oc_think`, `/oc_reasoning`, `/oc_verbose`, `/oc_queue`. Với `nativeSkills: true`, các lệnh Skills cũng được đăng ký dưới dạng `/oc_<skill>`.

<AccordionGroup>
  <Accordion title="Ghi chú về hành vi">
    - `native` và `nativeSkills` mặc định là `"auto"`, được phân giải thành trạng thái tắt đối với Mattermost. Hãy đặt chúng thành `true` một cách rõ ràng.
    - `callbackPath` mặc định là `/api/channels/mattermost/command`.
    - Nếu bỏ qua `callbackUrl`, OpenClaw sẽ suy ra `http://<gateway.customBindHost or localhost>:<gateway.port, default 18789><callbackPath>`. Các máy chủ liên kết bằng ký tự đại diện (`0.0.0.0`, `::`) sẽ dùng `localhost` làm phương án dự phòng.
    - Đối với thiết lập nhiều tài khoản, có thể đặt `commands` ở cấp cao nhất hoặc bên dưới `channels.mattermost.accounts.<id>.commands` (giá trị tài khoản ghi đè các trường cấp cao nhất).
    - Các lệnh gạch chéo hiện có với cùng trình kích hoạt do tích hợp khác tạo ra sẽ được giữ nguyên (quá trình đăng ký bỏ qua chúng); các lệnh do bot tạo sẽ được cập nhật hoặc tạo lại khi URL gọi lại thay đổi.
    - Các lệnh gọi lại được xác thực bằng token riêng của từng lệnh do Mattermost trả về khi OpenClaw đăng ký các lệnh `oc_*`.
    - OpenClaw làm mới thông tin đăng ký lệnh Mattermost hiện tại trước khi chấp nhận mỗi lệnh gọi lại, vì vậy các token cũ từ những lệnh gạch chéo đã bị xóa hoặc tạo lại sẽ không còn được chấp nhận mà không cần khởi động lại Gateway.
    - Quá trình xác thực lệnh gọi lại sẽ từ chối theo chế độ đóng nếu API Mattermost không thể xác nhận rằng lệnh vẫn còn hiện hành; các lần xác thực thất bại được lưu vào bộ nhớ đệm trong thời gian ngắn, các lượt tra cứu đồng thời được hợp nhất và số lượt bắt đầu tra cứu mới được giới hạn theo từng lệnh để hạn chế áp lực phát lại.
    - Lệnh gọi lại gạch chéo sẽ từ chối theo chế độ đóng khi đăng ký thất bại, quá trình khởi động chỉ hoàn tất một phần hoặc token gọi lại không khớp với token đã đăng ký của lệnh được phân giải (token hợp lệ cho một lệnh không thể đi đến bước xác thực ngược dòng của một lệnh khác).
    - Các lệnh gọi lại được chấp nhận sẽ được xác nhận bằng phản hồi tạm thời "Đang xử lý..."; câu trả lời thực tế sẽ đến dưới dạng tin nhắn thông thường.

  </Accordion>
  <Accordion title="Yêu cầu về khả năng truy cập">
    Điểm cuối gọi lại phải có thể được máy chủ Mattermost truy cập.

    - Không đặt `callbackUrl` thành `localhost` trừ khi Mattermost chạy trên cùng máy chủ/không gian tên mạng với OpenClaw.
    - Không đặt `callbackUrl` thành URL cơ sở Mattermost của bạn, trừ khi URL đó dùng proxy ngược để chuyển `/api/channels/mattermost/command` đến OpenClaw.
    - Có thể kiểm tra nhanh bằng `curl https://<gateway-host>/api/channels/mattermost/command`; yêu cầu GET phải trả về `405 Method Not Allowed` từ OpenClaw, không phải `404`.

  </Accordion>
  <Accordion title="Danh sách cho phép lưu lượng đi của Mattermost">
    Nếu đích gọi lại của bạn là các địa chỉ riêng tư/tailnet/nội bộ, hãy đặt `ServiceSettings.AllowedUntrustedInternalConnections` của Mattermost để bao gồm máy chủ/miền gọi lại.

    Sử dụng mục máy chủ/miền, không sử dụng URL đầy đủ.

    - Đúng: `gateway.tailnet-name.ts.net`
    - Sai: `https://gateway.tailnet-name.ts.net`

  </Accordion>
</AccordionGroup>

## Biến môi trường (tài khoản mặc định)

Đặt các biến sau trên máy chủ Gateway nếu bạn muốn dùng biến môi trường:

- `MATTERMOST_BOT_TOKEN=...`
- `MATTERMOST_URL=https://chat.example.com`

<Note>
Các biến môi trường chỉ áp dụng cho tài khoản **mặc định** (`default`). Các tài khoản khác phải sử dụng giá trị cấu hình.

Không thể đặt `MATTERMOST_URL` từ tệp `.env` của workspace; xem [Tệp .env của workspace](/vi/gateway/security).
</Note>

## Chế độ trò chuyện

Mattermost tự động phản hồi tin nhắn trực tiếp. Hành vi trong kênh được kiểm soát bởi `chatmode`:

<Tabs>
  <Tab title="oncall (mặc định)">
    Chỉ phản hồi khi được @đề cập trong các kênh.
  </Tab>
  <Tab title="onmessage">
    Phản hồi mọi tin nhắn trong kênh.
  </Tab>
  <Tab title="onchar">
    Phản hồi khi tin nhắn bắt đầu bằng tiền tố kích hoạt.
  </Tab>
</Tabs>

Ví dụ cấu hình:

```json5
{
  channels: {
    mattermost: {
      chatmode: "onchar",
      oncharPrefixes: [">", "!"], // mặc định
    },
  },
}
```

Lưu ý:

- `onchar` vẫn phản hồi các lượt @đề cập tường minh.
- `channels.mattermost.requireMention` vẫn được áp dụng, nhưng ưu tiên `chatmode`. Các cài đặt `groups.<channelId>.requireMention` theo từng kênh được ưu tiên hơn cả hai.
- Sau khi bot gửi phản hồi hiển thị trong một luồng của kênh, các tin nhắn tiếp theo trong cùng luồng đó sẽ được trả lời mà không cần @đề cập mới hoặc tiền tố `onchar`, nhờ đó cuộc trò chuyện nhiều lượt trong luồng tiếp tục liền mạch. Trạng thái tham gia được ghi nhớ trong 7 ngày kể từ lần cuối bot phản hồi trong luồng đó và vẫn tồn tại sau khi Gateway khởi động lại. Các luồng mà bot chỉ quan sát không bị ảnh hưởng; hãy bắt đầu một tin nhắn cấp cao nhất mới để yêu cầu đề cập tường minh trở lại.
- Đặt `channels.mattermost.implicitMentions.threadParticipation: false` để ngăn các phản hồi tiếp nối trong luồng đã tham gia bỏ qua điều kiện đề cập. Giá trị ghi đè cho tài khoản sử dụng `channels.mattermost.accounts.<id>.implicitMentions`. Mattermost hiện không tạo các dữ kiện `replyToBot` hoặc `quotedBot`, vì vậy các cờ đó không có tác dụng ở đây.

## Luồng và phiên

Sử dụng `channels.mattermost.replyToMode` để kiểm soát việc phản hồi trong kênh và nhóm tiếp tục ở kênh chính hay bắt đầu một luồng bên dưới bài đăng kích hoạt.

- `off` (mặc định): chỉ phản hồi trong luồng khi bài đăng đến đã nằm trong một luồng.
- `first`: đối với bài đăng cấp cao nhất trong kênh/nhóm, bắt đầu một luồng bên dưới bài đăng đó và định tuyến cuộc trò chuyện đến một phiên có phạm vi luồng.
- `all` và `batched`: hiện có cùng hành vi với `first` trên Mattermost, vì sau khi Mattermost có bài đăng gốc của luồng, các phần tin nhắn và nội dung đa phương tiện tiếp theo vẫn tiếp tục trong cùng luồng đó.
- Tin nhắn trực tiếp mặc định sử dụng `off` ngay cả khi `replyToMode` được đặt.

Sử dụng `channels.mattermost.replyToModeByChatType` để ghi đè chế độ cho các cuộc trò chuyện `direct`, `group` hoặc `channel`. Đặt `direct` để bật luồng cho tin nhắn trực tiếp:

- `off` (mặc định): tin nhắn trực tiếp không sử dụng luồng và nằm trong một phiên liên tục.
- `first`, `all` hoặc `batched`: mỗi tin nhắn trực tiếp cấp cao nhất bắt đầu một luồng Mattermost được hỗ trợ bởi một phiên mới, độc lập.

```json5
{
  channels: {
    mattermost: {
      replyToMode: "all",
      replyToModeByChatType: {
        direct: "first",
      },
    },
  },
}
```

Lưu ý:

- Các phiên có phạm vi luồng sử dụng ID của bài đăng kích hoạt làm bài đăng gốc của luồng.
- `first` và `all` hiện tương đương nhau vì sau khi Mattermost có bài đăng gốc của luồng, các phần tin nhắn và nội dung đa phương tiện tiếp theo vẫn tiếp tục trong cùng luồng đó.
- Các giá trị ghi đè theo loại trò chuyện được ưu tiên hơn `replyToMode`. Nếu không có giá trị ghi đè `direct`, các bản triển khai hiện có vẫn giữ tin nhắn trực tiếp dạng phẳng, không sử dụng luồng.

## Kiểm soát truy cập (tin nhắn trực tiếp)

- Mặc định: `channels.mattermost.dmPolicy = "pairing"` (người gửi không xác định nhận được mã ghép nối). Các giá trị khác: `allowlist`, `open`, `disabled`.
- Phê duyệt qua:
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- Tin nhắn trực tiếp công khai: `channels.mattermost.dmPolicy="open"` cùng với `channels.mattermost.allowFrom=["*"]` (lược đồ cấu hình bắt buộc ký tự đại diện).
- `channels.mattermost.allowFrom` chấp nhận ID người dùng (khuyến nghị) và các mục `accessGroup:<name>`. Xem [Nhóm truy cập](/vi/channels/access-groups).

## Kênh (nhóm)

- Mặc định: `channels.mattermost.groupPolicy = "allowlist"` (yêu cầu đề cập).
- Cho phép người gửi bằng `channels.mattermost.groupAllowFrom` (khuyến nghị dùng ID người dùng).
- `channels.mattermost.groupAllowFrom` chấp nhận các mục `accessGroup:<name>`. Xem [Nhóm truy cập](/vi/channels/access-groups).
- Các giá trị ghi đè yêu cầu đề cập theo từng kênh nằm trong `channels.mattermost.groups.<channelId>.requireMention` hoặc `channels.mattermost.groups["*"].requireMention` cho giá trị mặc định.
- Việc đối chiếu `@username` có thể thay đổi và chỉ được bật khi `channels.mattermost.dangerouslyAllowNameMatching: true`.
- Kênh mở: `channels.mattermost.groupPolicy="open"` (yêu cầu đề cập).
- Thứ tự phân giải: `channels.mattermost.groupPolicy`, sau đó `channels.defaults.groupPolicy`, rồi `"allowlist"`.
- Lưu ý về runtime: nếu phần `channels.mattermost` hoàn toàn không tồn tại, runtime sẽ đóng an toàn về `groupPolicy="allowlist"` khi kiểm tra nhóm (ngay cả khi `channels.defaults.groupPolicy` được đặt) và ghi nhật ký cảnh báo một lần.

Ví dụ:

```json5
{
  channels: {
    mattermost: {
      groupPolicy: "open",
      groups: {
        "*": { requireMention: true },
        "team-channel-id": { requireMention: false },
      },
    },
  },
}
```

## Đích gửi đi

Sử dụng các định dạng đích này với `openclaw message send` hoặc cron/webhook:

| Đích                                | Gửi đến                                                       |
| ----------------------------------- | ------------------------------------------------------------- |
| `channel:<id>`                      | Kênh theo ID                                                  |
| `channel:<name>` hoặc `#channel-name` | Kênh theo tên, được tìm kiếm trong các nhóm mà bot tham gia   |
| `user:<id>` hoặc `mattermost:<id>`    | Tin nhắn trực tiếp với người dùng đó                          |
| `@username`                         | Tin nhắn trực tiếp (tên người dùng được phân giải qua API Mattermost) |

Mỗi lần gửi đi hỗ trợ tối đa một tệp đính kèm cho mỗi tin nhắn; hãy chia nhiều tệp thành các lần gửi riêng biệt.

<Warning>
Các ID không có ngữ cảnh (như `64ifufp...`) **không rõ nghĩa** trong Mattermost (ID người dùng hay ID kênh).

OpenClaw phân giải chúng theo thứ tự **người dùng trước**:

- Nếu ID tồn tại dưới dạng người dùng (`GET /api/v4/users/<id>` thành công), OpenClaw sẽ gửi **tin nhắn trực tiếp** bằng cách phân giải kênh trực tiếp qua `/api/v4/channels/direct`.
- Nếu không, ID được coi là **ID kênh**.

Nếu cần hành vi xác định, hãy luôn sử dụng các tiền tố tường minh (`user:<id>` / `channel:<id>`).
</Warning>

## Thử lại kênh tin nhắn trực tiếp

Khi OpenClaw gửi đến một đích tin nhắn trực tiếp Mattermost và trước tiên cần phân giải kênh trực tiếp, theo mặc định, hệ thống sẽ thử lại các lỗi tạm thời khi tạo kênh trực tiếp.

Sử dụng `channels.mattermost.dmChannelRetry` để điều chỉnh hành vi đó trên toàn cục cho plugin Mattermost hoặc `channels.mattermost.accounts.<id>.dmChannelRetry` cho một tài khoản. Giá trị mặc định:

```json5
{
  channels: {
    mattermost: {
      dmChannelRetry: {
        maxRetries: 3,
        initialDelayMs: 1000,
        maxDelayMs: 10000,
        timeoutMs: 30000,
      },
    },
  },
}
```

Lưu ý:

- Điều này chỉ áp dụng cho việc tạo kênh tin nhắn trực tiếp (`/api/v4/channels/direct`), không áp dụng cho mọi lệnh gọi API Mattermost.
- Các lần thử lại sử dụng thời gian chờ tăng theo cấp số nhân kèm độ dao động và áp dụng cho các lỗi tạm thời như giới hạn tốc độ, phản hồi 5xx và lỗi mạng hoặc hết thời gian chờ.
- Các lỗi máy khách 4xx ngoài `429` được coi là vĩnh viễn và không được thử lại.

## Truyền trực tiếp bản xem trước

Mattermost truyền trực tiếp quá trình suy nghĩ, hoạt động của công cụ và văn bản trả lời từng phần vào một **bài đăng xem trước dạng bản nháp**, bài đăng này được hoàn tất tại chỗ khi câu trả lời cuối cùng đã an toàn để gửi. Ở chế độ `partial`, bản xem trước được cập nhật trên cùng một ID bài đăng thay vì làm ngập kênh bằng tin nhắn cho từng đoạn. Ở chế độ `block`, bản xem trước luân phiên giữa văn bản đã hoàn tất và các khối hoạt động của công cụ, vì vậy các khối trước đó vẫn hiển thị dưới dạng bài đăng riêng thay vì bị khối tiếp theo ghi đè. Kết quả cuối chứa nội dung đa phương tiện/lỗi sẽ hủy các chỉnh sửa bản xem trước đang chờ và sử dụng cơ chế gửi thông thường thay vì hoàn tất một bài đăng xem trước dùng rồi bỏ.

Truyền trực tiếp bản xem trước được **bật theo mặc định** ở chế độ `partial`. Cấu hình qua `channels.mattermost.streaming.mode` (các giá trị vô hướng/boolean cũ `streaming` được `openclaw doctor --fix` di chuyển):

```json5
{
  channels: {
    mattermost: {
      streaming: { mode: "partial" }, // off | partial | block | progress
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Các chế độ truyền trực tiếp">
    - `partial` (mặc định): một bài đăng xem trước được chỉnh sửa khi câu trả lời dài thêm, sau đó được hoàn tất bằng câu trả lời đầy đủ.
    - `block` luân phiên bản xem trước giữa văn bản đã hoàn tất và các khối hoạt động của công cụ, vì vậy mỗi khối vẫn hiển thị dưới dạng bài đăng riêng thay vì bị ghi đè tại chỗ. Các bản cập nhật công cụ song song và liên tiếp dùng chung bài đăng hoạt động công cụ hiện tại.
    - `progress` hiển thị bản xem trước trạng thái trong khi tạo và chỉ đăng câu trả lời cuối cùng khi hoàn tất.
    - `off` tắt truyền trực tiếp bản xem trước. Với `streaming.block.enabled: true`, các khối trợ lý đã hoàn tất vẫn được gửi dưới dạng câu trả lời theo khối thông thường (các bài đăng riêng biệt), thay vì một bài đăng cuối duy nhất đã được hợp nhất.

  </Accordion>
  <Accordion title="Lưu ý về hành vi truyền trực tiếp">
    - Nếu không thể hoàn tất luồng tại chỗ (ví dụ: bài đăng bị xóa giữa chừng), OpenClaw sẽ chuyển sang gửi một bài đăng cuối mới để câu trả lời không bao giờ bị mất.
    - Các tải trọng chỉ chứa quá trình suy nghĩ bị loại khỏi bài đăng trên kênh, bao gồm văn bản đến dưới dạng trích dẫn khối `> Thinking`. Đặt `/reasoning on` để xem quá trình suy nghĩ trên các bề mặt khác; bài đăng Mattermost cuối cùng chỉ giữ lại câu trả lời.
    - Xem [Truyền trực tiếp](/vi/concepts/streaming#preview-streaming-modes) để biết ma trận ánh xạ kênh.

  </Accordion>
</AccordionGroup>

## Phản ứng (công cụ tin nhắn)

- Sử dụng `message action=react` với `channel=mattermost`.
- `messageId` là ID bài đăng Mattermost.
- `emoji` chấp nhận các tên như `thumbsup` hoặc `:+1:` (dấu hai chấm là tùy chọn).
- Đặt `remove=true` (boolean) để xóa phản ứng.
- Các sự kiện thêm/xóa phản ứng được chuyển tiếp dưới dạng sự kiện hệ thống đến phiên tác tử được định tuyến, tuân theo cùng các bước kiểm tra chính sách tin nhắn trực tiếp/nhóm như tin nhắn.

Ví dụ:

```text
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup remove=true
```

Cấu hình:

- `channels.mattermost.actions.reactions`: bật/tắt các thao tác phản ứng (mặc định là true).
- Ghi đè theo tài khoản: `channels.mattermost.accounts.<id>.actions.reactions`.

## Nút tương tác (công cụ tin nhắn)

Gửi tin nhắn có các nút có thể nhấp. Khi người dùng nhấp vào một nút, tác tử sẽ nhận được lựa chọn và có thể phản hồi.

Các nút đến từ tải trọng ngữ nghĩa `presentation` (trong các câu trả lời thông thường của tác tử và trong `message action=send`). OpenClaw kết xuất các nút giá trị dưới dạng nút tương tác Mattermost, giữ các nút URL hiển thị trong văn bản tin nhắn và hạ cấp menu chọn thành văn bản dễ đọc.

```text
message action=send channel=mattermost target=channel:<channelId> presentation={"blocks":[{"type":"buttons","buttons":[{"label":"Yes","value":"yes"},{"label":"No","value":"no"}]}]}
```

Các trường của nút trình bày:

<ParamField path="label" type="string" required>
  Nhãn hiển thị (bí danh: `text`).
</ParamField>
<ParamField path="value" type="string">
  Giá trị được gửi lại khi nhấp, dùng làm ID thao tác (các bí danh: `callback_data`, `callbackData`). Bắt buộc đối với nút có thể nhấp, trừ khi đặt `url`.
</ParamField>
<ParamField path="url" type="string">
  Nút liên kết; được kết xuất dưới dạng văn bản `label: url` trong nội dung tin nhắn thay vì nút tương tác.
</ParamField>
<ParamField path="style" type='"primary" | "secondary" | "success" | "danger"'>
  Kiểu nút. Mattermost áp dụng kiểu mặc định cho các giá trị mà nền tảng không hỗ trợ.
</ParamField>

Để thông báo khả năng hỗ trợ nút trong lời nhắc hệ thống của tác tử, hãy thêm `inlineButtons` vào các khả năng của kênh:

```json5
{
  channels: {
    mattermost: {
      capabilities: ["inlineButtons"],
    },
  },
}
```

Khi người dùng nhấp vào một nút:

<Steps>
  <Step title="Kiểm tra quyền truy cập">
    Người nhấp phải vượt qua cùng các bước kiểm tra chính sách tin nhắn trực tiếp/nhóm như người gửi tin nhắn; các lần nhấp không được phép sẽ nhận thông báo tạm thời và bị bỏ qua.
  </Step>
  <Step title="Các nút được thay bằng xác nhận">
    Tất cả các nút được thay bằng một dòng xác nhận (ví dụ: "✓ **Yes** được @user chọn").
  </Step>
  <Step title="Tác tử nhận lựa chọn">
    Tác tử nhận lựa chọn dưới dạng tin nhắn đến (cùng một sự kiện hệ thống) và phản hồi.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Lưu ý triển khai">
    - Các lệnh gọi lại của nút sử dụng xác minh HMAC-SHA256 (tự động, không cần cấu hình).
    - Toàn bộ khối tệp đính kèm được thay thế khi nhấp, vì vậy tất cả các nút bị xóa cùng nhau - không thể xóa một phần.
    - Các ID thao tác chứa dấu gạch nối hoặc dấu gạch dưới được tự động làm sạch (hạn chế định tuyến của Mattermost).
    - Các lần nhấp có `action_id` không khớp với một thao tác trên bài đăng gốc sẽ bị từ chối với `403` ("Thao tác không xác định").

  </Accordion>
  <Accordion title="Cấu hình và khả năng truy cập">
    - `channels.mattermost.capabilities`: mảng các chuỗi khả năng. Thêm `"inlineButtons"` để bật mô tả công cụ nút trong lời nhắc hệ thống của tác tử.
    - `channels.mattermost.interactions.callbackBaseUrl`: URL cơ sở bên ngoài tùy chọn cho các lệnh gọi lại của nút (ví dụ: `https://gateway.example.com`). Sử dụng tùy chọn này khi Mattermost không thể truy cập trực tiếp Gateway tại máy chủ liên kết của Gateway.
    - Trong thiết lập nhiều tài khoản, bạn cũng có thể đặt cùng trường đó trong `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl`.
    - Nếu bỏ qua `interactions.callbackBaseUrl`, OpenClaw sẽ suy ra URL gọi lại từ `gateway.customBindHost` + `gateway.port` (mặc định là 18789), sau đó chuyển sang `http://localhost:<port>`. Đường dẫn gọi lại là `/mattermost/interactions/<accountId>`.
    - Quy tắc về khả năng truy cập: máy chủ Mattermost phải truy cập được URL gọi lại của nút. `localhost` chỉ hoạt động khi Mattermost và OpenClaw chạy trên cùng một máy chủ/không gian tên mạng.
    - `channels.mattermost.interactions.allowedSourceIps`: danh sách cho phép IP nguồn cho các lệnh gọi lại của nút. Nếu không có, chỉ các nguồn loopback (`127.0.0.1`, `::1`) được chấp nhận, vì vậy máy chủ Mattermost từ xa phải được thêm vào danh sách cho phép tại đây, nếu không các lần nhấp của máy chủ sẽ bị từ chối với `403`. Khi ở sau proxy ngược, cũng đặt `gateway.trustedProxies` để IP máy khách thực được suy ra từ các tiêu đề chuyển tiếp.
    - Nếu đích gọi lại của bạn là riêng tư/tailnet/nội bộ, hãy thêm máy chủ/miền của đích vào `ServiceSettings.AllowedUntrustedInternalConnections` của Mattermost.

  </Accordion>
</AccordionGroup>

### Tích hợp API trực tiếp (tập lệnh bên ngoài)

Các tập lệnh và Webhook bên ngoài có thể đăng nút trực tiếp qua API REST Mattermost thay vì đi qua công cụ `message` của tác tử. Nên ưu tiên công cụ `message` của OpenClaw. Đối với tích hợp trực tiếp, hãy nhập `buildButtonAttachments` từ `@openclaw/mattermost/api.js`; nếu đăng JSON thô, hãy tuân theo các quy tắc sau:

**Cấu trúc tải trọng:**

```json5
{
  channel_id: "<channelId>",
  message: "Chọn một tùy chọn:",
  props: {
    attachments: [
      {
        actions: [
          {
            id: "mybutton01", // chỉ ký tự chữ và số - xem bên dưới
            type: "button", // bắt buộc, nếu không các lần nhấp sẽ bị bỏ qua mà không có thông báo
            name: "Phê duyệt", // nhãn hiển thị
            style: "primary", // tùy chọn: "default", "primary", "danger"
            integration: {
              url: "https://gateway.example.com/mattermost/interactions/default",
              context: {
                action_id: "mybutton01", // phải khớp với ID nút
                action: "approve",
                // ... các trường tùy chỉnh bất kỳ ...
                _token: "<hmac>", // xem phần HMAC bên dưới
              },
            },
          },
        ],
      },
    ],
  },
}
```

<Warning>
**Các quy tắc quan trọng**

1. Các tệp đính kèm nằm trong `props.attachments`, không phải `attachments` cấp cao nhất (bị bỏ qua mà không có thông báo).
2. Mỗi thao tác cần `type: "button"` - nếu không, các lần nhấp sẽ bị bỏ qua mà không có thông báo.
3. Mỗi thao tác cần một trường `id` - Mattermost bỏ qua các thao tác không có ID.
4. `id` của thao tác phải **chỉ gồm ký tự chữ và số** (`[a-zA-Z0-9]`). Dấu gạch nối và dấu gạch dưới làm hỏng định tuyến thao tác phía máy chủ của Mattermost (trả về 404). Hãy loại bỏ chúng trước khi sử dụng.
5. `context.action_id` phải khớp với `id` của nút; Gateway từ chối các lần nhấp có `action_id` không tồn tại trên bài đăng.
6. Bắt buộc có `context.action_id` - trình xử lý tương tác trả về 400 nếu thiếu trường này.
7. IP nguồn gọi lại phải được cho phép (xem `interactions.allowedSourceIps` ở trên).

</Warning>

**Tạo token HMAC**

Gateway xác minh các lần nhấp vào nút bằng HMAC-SHA256. Các tập lệnh bên ngoài phải tạo token khớp với logic xác minh của Gateway:

<Steps>
  <Step title="Dẫn xuất bí mật từ token bot">
    `HMAC-SHA256(key="openclaw-mattermost-interactions", data=botToken)`, được mã hóa hex.
  </Step>
  <Step title="Tạo đối tượng ngữ cảnh">
    Tạo đối tượng ngữ cảnh với tất cả các trường **ngoại trừ** `_token`.
  </Step>
  <Step title="Tuần tự hóa với các khóa đã sắp xếp">
    Tuần tự hóa với **các khóa được sắp xếp đệ quy** và **không có khoảng trắng** (Gateway cũng chuẩn hóa các đối tượng lồng nhau và tạo JSON thu gọn).
  </Step>
  <Step title="Ký tải trọng">
    `HMAC-SHA256(key=secret, data=serializedContext)`
  </Step>
  <Step title="Thêm token">
    Thêm giá trị băm hex thu được dưới dạng `_token` vào ngữ cảnh.
  </Step>
</Steps>

Ví dụ Python:

```python
import hmac, hashlib, json

secret = hmac.new(
    b"openclaw-mattermost-interactions",
    bot_token.encode(), hashlib.sha256
).hexdigest()

ctx = {"action_id": "mybutton01", "action": "approve"}
payload = json.dumps(ctx, sort_keys=True, separators=(",", ":"))
token = hmac.new(secret.encode(), payload.encode(), hashlib.sha256).hexdigest()

context = {**ctx, "_token": token}
```

<AccordionGroup>
  <Accordion title="Các lỗi HMAC thường gặp">
    - `json.dumps` của Python mặc định thêm khoảng trắng (`{"key": "val"}`). Hãy dùng `separators=(",", ":")` để khớp với đầu ra rút gọn của JavaScript (`{"key":"val"}`).
    - Luôn ký **tất cả** các trường ngữ cảnh (trừ `_token`). Gateway loại bỏ `_token`, sau đó ký mọi trường còn lại. Chỉ ký một tập hợp con sẽ khiến quá trình xác minh âm thầm thất bại.
    - Dùng `sort_keys=True` — Gateway sắp xếp các khóa trước khi ký và Mattermost có thể sắp xếp lại các trường ngữ cảnh khi lưu tải trọng.
    - Tạo khóa bí mật từ token bot (mang tính xác định), không dùng các byte ngẫu nhiên. Khóa bí mật phải giống nhau giữa tiến trình tạo nút và Gateway thực hiện xác minh.

  </Accordion>
</AccordionGroup>

## Bộ điều hợp thư mục

Plugin Mattermost bao gồm một bộ điều hợp thư mục phân giải tên kênh và người dùng thông qua API Mattermost. Điều này cho phép sử dụng các đích `#channel-name` và `@username` trong `openclaw message send` cũng như trong các lượt gửi cron/webhook.

Không cần cấu hình — bộ điều hợp sử dụng token bot từ cấu hình tài khoản.

## Nhiều tài khoản

Mattermost hỗ trợ nhiều tài khoản trong `channels.mattermost.accounts`:

```json5
{
  channels: {
    mattermost: {
      accounts: {
        default: { name: "Primary", botToken: "mm-token", baseUrl: "https://chat.example.com" },
        alerts: { name: "Alerts", botToken: "mm-token-2", baseUrl: "https://alerts.example.com" },
      },
    },
  },
}
```

Các giá trị tài khoản ghi đè các trường cấp cao nhất; `channels.mattermost.defaultAccount` chọn tài khoản được sử dụng khi không chỉ định tài khoản nào.

## Khắc phục sự cố

<AccordionGroup>
  <Accordion title="Không có phản hồi trong các kênh">
    Đảm bảo bot có trong kênh và đề cập đến bot (oncall), dùng tiền tố kích hoạt (onchar) hoặc đặt `chatmode: "onmessage"`.
  </Accordion>
  <Accordion title="Lỗi xác thực hoặc nhiều tài khoản">
    - Kiểm tra token bot, URL cơ sở và tài khoản có được bật hay không.
    - Sự cố nhiều tài khoản: các biến môi trường chỉ áp dụng cho tài khoản `default`.
    - Các máy chủ Mattermost riêng tư/LAN cần `network.dangerouslyAllowPrivateNetwork: true` (cơ chế bảo vệ SSRF mặc định chặn các IP riêng tư).

  </Accordion>
  <Accordion title="Lệnh slash gốc không hoạt động">
    - `Unauthorized: invalid command token.`: OpenClaw không chấp nhận token callback. Các nguyên nhân thường gặp:
      - quá trình đăng ký lệnh slash thất bại hoặc chỉ hoàn tất một phần khi khởi động
      - callback đang được gửi đến sai Gateway/tài khoản
      - Mattermost vẫn còn các lệnh cũ trỏ đến một đích callback trước đó
      - Gateway đã khởi động lại nhưng không kích hoạt lại các lệnh slash
    - Nếu các lệnh slash gốc ngừng hoạt động, hãy kiểm tra nhật ký để tìm `mattermost: failed to register slash commands` hoặc `mattermost: native slash commands enabled but no commands could be registered`.
    - Nếu bỏ qua `callbackUrl` và nhật ký cảnh báo rằng callback được phân giải thành một URL loopback như `http://localhost:18789/...`, URL đó có thể chỉ truy cập được khi Mattermost chạy trên cùng máy chủ/không gian tên mạng với OpenClaw. Thay vào đó, hãy đặt một `commands.callbackUrl` rõ ràng có thể truy cập từ bên ngoài.

  </Accordion>
  <Accordion title="Sự cố với nút">
    - Các nút xuất hiện dưới dạng ô trắng hoặc hoàn toàn không xuất hiện: dữ liệu nút không đúng định dạng. Mỗi nút trình bày cần có `label` và `value` (các nút thiếu một trong hai sẽ bị loại bỏ).
    - Các nút hiển thị nhưng thao tác nhấp không có tác dụng: hãy xác minh rằng có thể truy cập Gateway từ máy chủ Mattermost, IP máy chủ Mattermost có trong `channels.mattermost.interactions.allowedSourceIps` (nếu không có cấu hình này thì chỉ loopback được chấp nhận) và `ServiceSettings.AllowedUntrustedInternalConnections` chứa máy chủ callback cho các đích riêng tư.
    - Các nút trả về 404 khi nhấp: `id` của nút có thể chứa dấu gạch nối hoặc dấu gạch dưới. Bộ định tuyến hành động của Mattermost không hoạt động với ID chứa ký tự không phải chữ và số. Chỉ dùng `[a-zA-Z0-9]`.
    - Gateway ghi nhật ký `rejected callback source`: thao tác nhấp đến từ một IP bên ngoài `interactions.allowedSourceIps`. Hãy thêm máy chủ Mattermost hoặc điểm truy cập đầu vào của bạn vào danh sách cho phép và đặt `gateway.trustedProxies` khi ở sau proxy ngược.
    - Gateway ghi nhật ký `invalid _token`: HMAC không khớp. Hãy kiểm tra rằng bạn ký tất cả các trường ngữ cảnh (không phải một tập hợp con), dùng các khóa đã sắp xếp và dùng JSON rút gọn (không có khoảng trắng). Xem phần HMAC ở trên.
    - Gateway ghi nhật ký `missing _token in context`: trường `_token` không có trong ngữ cảnh của nút. Đảm bảo trường này được bao gồm khi tạo tải trọng tích hợp.
    - Gateway từ chối thao tác nhấp với `Unknown action`: `context.action_id` không khớp với bất kỳ `id` hành động nào trên bài đăng. Đặt cả hai thành cùng một giá trị đã được làm sạch.
    - Agent không cung cấp các nút: thêm `capabilities: ["inlineButtons"]` vào cấu hình kênh Mattermost.

  </Accordion>
</AccordionGroup>

## Liên quan

- [Định tuyến kênh](/vi/channels/channel-routing) — định tuyến phiên cho tin nhắn
- [Tổng quan về các kênh](/vi/channels) — tất cả các kênh được hỗ trợ
- [Nhóm](/vi/channels/groups) — hành vi trò chuyện nhóm và kiểm soát bằng lượt đề cập
- [Ghép nối](/vi/channels/pairing) — luồng xác thực DM và ghép nối
- [Bảo mật](/vi/gateway/security) — mô hình truy cập và tăng cường bảo mật
