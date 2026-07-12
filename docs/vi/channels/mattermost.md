---
read_when:
    - Thiết lập Mattermost
    - Gỡ lỗi định tuyến Mattermost
sidebarTitle: Mattermost
summary: Thiết lập bot Mattermost và cấu hình OpenClaw
title: Mattermost
x-i18n:
    generated_at: "2026-07-12T07:44:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 246535ff433a678624d997db640d2531d6ce434ea064a23b98abe8a9e7e6a117
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
  <Tab title="Bản sao mã nguồn cục bộ">
    ```bash
    openclaw plugins install ./path/to/local/mattermost-plugin
    ```
  </Tab>
</Tabs>

Chi tiết: [Plugin](/vi/tools/plugin)

## Thiết lập nhanh

<Steps>
  <Step title="Đảm bảo plugin khả dụng">
    Cài đặt `@openclaw/mattermost` bằng lệnh ở trên, sau đó khởi động lại Gateway nếu nó đang chạy.
  </Step>
  <Step title="Tạo bot Mattermost">
    Tạo tài khoản bot Mattermost, sao chép **token bot** và thêm bot vào các nhóm và kênh mà bot cần đọc.
  </Step>
  <Step title="Sao chép URL cơ sở">
    Sao chép **URL cơ sở** của Mattermost (ví dụ: `https://chat.example.com`). Phần `/api/v4` ở cuối sẽ tự động bị loại bỏ.
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

    Phương án không tương tác:

    ```bash
    openclaw channels add --channel mattermost --bot-token <token> --http-url https://chat.example.com
    ```

  </Step>
</Steps>

<Note>
Mattermost tự lưu trữ trên địa chỉ riêng tư/LAN/tailnet: các yêu cầu API Mattermost gửi đi sẽ đi qua cơ chế bảo vệ SSRF, mặc định chặn các IP riêng tư và nội bộ. Cho phép bằng `channels.mattermost.network.dangerouslyAllowPrivateNetwork: true` (theo từng tài khoản: `channels.mattermost.accounts.<id>.network.dangerouslyAllowPrivateNetwork`).
</Note>

## Lệnh gạch chéo gốc

Các lệnh gạch chéo gốc phải được chủ động bật. Khi được bật, OpenClaw đăng ký các lệnh gạch chéo `oc_*` trên mọi nhóm mà bot là thành viên và nhận các yêu cầu POST gọi lại trên máy chủ HTTP của Gateway.

```json5
{
  channels: {
    mattermost: {
      commands: {
        native: true,
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // Dùng khi Mattermost không thể truy cập trực tiếp Gateway (proxy ngược/URL công khai).
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
    },
  },
}
```

Các lệnh được đăng ký: `/oc_status`, `/oc_model`, `/oc_models`, `/oc_new`, `/oc_help`, `/oc_think`, `/oc_reasoning`, `/oc_verbose`, `/oc_queue`. Khi đặt `nativeSkills: true`, các lệnh Skills cũng được đăng ký dưới dạng `/oc_<skill>`.

<AccordionGroup>
  <Accordion title="Ghi chú về hành vi">
    - `native` và `nativeSkills` mặc định là `"auto"`, được phân giải thành trạng thái tắt đối với Mattermost. Hãy đặt rõ ràng thành `true`.
    - `callbackPath` mặc định là `/api/channels/mattermost/command`.
    - Nếu bỏ qua `callbackUrl`, OpenClaw suy ra `http://<gateway.customBindHost or localhost>:<gateway.port, default 18789><callbackPath>`. Các máy chủ liên kết ký tự đại diện (`0.0.0.0`, `::`) sẽ dùng `localhost` làm phương án thay thế.
    - Với thiết lập nhiều tài khoản, có thể đặt `commands` ở cấp cao nhất hoặc trong `channels.mattermost.accounts.<id>.commands` (giá trị tài khoản ghi đè các trường cấp cao nhất).
    - Các lệnh gạch chéo hiện có với cùng trình kích hoạt do tích hợp khác tạo ra sẽ được giữ nguyên (quá trình đăng ký bỏ qua chúng); các lệnh do bot tạo sẽ được cập nhật hoặc tạo lại khi URL gọi lại thay đổi.
    - Các yêu cầu gọi lại của lệnh được xác thực bằng token riêng của từng lệnh do Mattermost trả về khi OpenClaw đăng ký các lệnh `oc_*`.
    - OpenClaw làm mới trạng thái đăng ký lệnh Mattermost hiện tại trước khi chấp nhận mỗi yêu cầu gọi lại, vì vậy token cũ của các lệnh gạch chéo đã bị xóa hoặc tạo lại sẽ không còn được chấp nhận mà không cần khởi động lại Gateway.
    - Việc xác thực yêu cầu gọi lại sẽ từ chối theo mặc định nếu API Mattermost không thể xác nhận lệnh vẫn còn hiện hành; các lần xác thực thất bại được lưu đệm trong thời gian ngắn, các lượt tra cứu đồng thời được hợp nhất và việc bắt đầu lượt tra cứu mới được giới hạn tốc độ theo từng lệnh để hạn chế áp lực phát lại.
    - Yêu cầu gọi lại của lệnh gạch chéo sẽ từ chối theo mặc định khi đăng ký thất bại, quá trình khởi động chỉ hoàn tất một phần hoặc token gọi lại không khớp với token đã đăng ký của lệnh được phân giải (token hợp lệ cho một lệnh không thể tiếp cận bước xác thực phía thượng nguồn của một lệnh khác).
    - Các yêu cầu gọi lại được chấp nhận sẽ được xác nhận bằng phản hồi tạm thời "Đang xử lý..."; câu trả lời thực tế sẽ đến dưới dạng tin nhắn thông thường.

  </Accordion>
  <Accordion title="Yêu cầu về khả năng truy cập">
    Điểm cuối gọi lại phải có thể được truy cập từ máy chủ Mattermost.

    - Không đặt `callbackUrl` thành `localhost` trừ khi Mattermost chạy trên cùng máy chủ/không gian tên mạng với OpenClaw.
    - Không đặt `callbackUrl` thành URL cơ sở Mattermost của bạn trừ khi URL đó proxy ngược `/api/channels/mattermost/command` đến OpenClaw.
    - Có thể kiểm tra nhanh bằng `curl https://<gateway-host>/api/channels/mattermost/command`; yêu cầu GET phải trả về `405 Method Not Allowed` từ OpenClaw, không phải `404`.

  </Accordion>
  <Accordion title="Danh sách cho phép lưu lượng đi Mattermost">
    Nếu đích gọi lại của bạn là địa chỉ riêng tư/tailnet/nội bộ, hãy đặt `ServiceSettings.AllowedUntrustedInternalConnections` của Mattermost để bao gồm máy chủ/tên miền gọi lại.

    Sử dụng mục nhập máy chủ/tên miền, không dùng URL đầy đủ.

    - Đúng: `gateway.tailnet-name.ts.net`
    - Sai: `https://gateway.tailnet-name.ts.net`

  </Accordion>
</AccordionGroup>

## Biến môi trường (tài khoản mặc định)

Đặt các biến này trên máy chủ Gateway nếu bạn muốn dùng biến môi trường:

- `MATTERMOST_BOT_TOKEN=...`
- `MATTERMOST_URL=https://chat.example.com`

<Note>
Biến môi trường chỉ áp dụng cho tài khoản **mặc định** (`default`). Các tài khoản khác phải sử dụng giá trị cấu hình.

Không thể đặt `MATTERMOST_URL` từ tệp `.env` của không gian làm việc; xem [Tệp .env của không gian làm việc](/vi/gateway/security).
</Note>

## Chế độ trò chuyện

Mattermost tự động phản hồi DM. Hành vi trong kênh được điều khiển bởi `chatmode`:

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

Ghi chú:

- `onchar` vẫn phản hồi các lượt @đề cập rõ ràng.
- `channels.mattermost.requireMention` vẫn được tuân thủ, nhưng ưu tiên `chatmode`. Các thiết lập `groups.<channelId>.requireMention` theo từng kênh được ưu tiên hơn cả hai.
- Sau khi bot gửi phản hồi hiển thị trong một luồng của kênh, các tin nhắn tiếp theo trong cùng luồng đó sẽ được trả lời mà không cần @đề cập mới hoặc tiền tố `onchar`, nhờ đó cuộc hội thoại nhiều lượt trong luồng tiếp tục liền mạch. Việc tham gia được ghi nhớ trong 7 ngày kể từ lần cuối bot phản hồi trong luồng đó và vẫn được duy trì qua các lần khởi động lại Gateway. Những luồng mà bot chỉ quan sát không bị ảnh hưởng; hãy bắt đầu một tin nhắn cấp cao nhất mới để yêu cầu đề cập rõ ràng trở lại.

## Luồng và phiên

Sử dụng `channels.mattermost.replyToMode` để kiểm soát việc phản hồi trong kênh và nhóm sẽ ở lại kênh chính hay bắt đầu một luồng bên dưới bài đăng kích hoạt.

- `off` (mặc định): chỉ phản hồi trong luồng khi bài đăng gửi đến vốn đã nằm trong một luồng.
- `first`: đối với bài đăng cấp cao nhất trong kênh/nhóm, bắt đầu một luồng bên dưới bài đăng đó và định tuyến cuộc hội thoại đến một phiên theo phạm vi luồng.
- `all` và `batched`: hiện có cùng hành vi như `first` đối với Mattermost, vì sau khi Mattermost có bài đăng gốc của luồng, các phần nội dung và phương tiện tiếp theo sẽ tiếp tục trong cùng luồng đó.
- Tin nhắn trực tiếp mặc định là `off` ngay cả khi đã đặt `replyToMode`.

Sử dụng `channels.mattermost.replyToModeByChatType` để ghi đè chế độ cho các cuộc trò chuyện `direct`, `group` hoặc `channel`. Đặt `direct` để bật luồng cho tin nhắn trực tiếp:

- `off` (mặc định): tin nhắn trực tiếp không dùng luồng và nằm trong một phiên liên tục.
- `first`, `all` hoặc `batched`: mỗi tin nhắn trực tiếp cấp cao nhất sẽ bắt đầu một luồng Mattermost được hỗ trợ bởi một phiên mới, độc lập.

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

Ghi chú:

- Các phiên theo phạm vi luồng sử dụng ID bài đăng kích hoạt làm bài đăng gốc của luồng.
- `first` và `all` hiện tương đương nhau vì sau khi Mattermost có bài đăng gốc của luồng, các phần nội dung và phương tiện tiếp theo sẽ tiếp tục trong cùng luồng đó.
- Ghi đè theo loại trò chuyện được ưu tiên hơn `replyToMode`. Nếu không có ghi đè `direct`, các triển khai hiện có tiếp tục giữ DM phẳng, không dùng luồng.

## Kiểm soát truy cập (DM)

- Mặc định: `channels.mattermost.dmPolicy = "pairing"` (người gửi không xác định nhận được mã ghép nối). Các giá trị khác: `allowlist`, `open`, `disabled`.
- Phê duyệt bằng:
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- DM công khai: `channels.mattermost.dmPolicy="open"` cùng với `channels.mattermost.allowFrom=["*"]` (lược đồ cấu hình bắt buộc ký tự đại diện).
- `channels.mattermost.allowFrom` chấp nhận ID người dùng (khuyến nghị) và các mục nhập `accessGroup:<name>`. Xem [Nhóm truy cập](/vi/channels/access-groups).

## Kênh (nhóm)

- Mặc định: `channels.mattermost.groupPolicy = "allowlist"` (bắt buộc đề cập).
- Cho phép người gửi bằng `channels.mattermost.groupAllowFrom` (khuyến nghị dùng ID người dùng).
- `channels.mattermost.groupAllowFrom` chấp nhận các mục nhập `accessGroup:<name>`. Xem [Nhóm truy cập](/vi/channels/access-groups).
- Các ghi đè yêu cầu đề cập theo từng kênh nằm trong `channels.mattermost.groups.<channelId>.requireMention` hoặc `channels.mattermost.groups["*"].requireMention` cho giá trị mặc định.
- Việc khớp `@username` có thể thay đổi và chỉ được bật khi `channels.mattermost.dangerouslyAllowNameMatching: true`.
- Kênh mở: `channels.mattermost.groupPolicy="open"` (bắt buộc đề cập).
- Thứ tự phân giải: `channels.mattermost.groupPolicy`, sau đó `channels.defaults.groupPolicy`, rồi `"allowlist"`.
- Ghi chú về thời gian chạy: nếu phần `channels.mattermost` hoàn toàn không tồn tại, thời gian chạy sẽ từ chối theo mặc định với `groupPolicy="allowlist"` khi kiểm tra nhóm (ngay cả khi đã đặt `channels.defaults.groupPolicy`) và ghi cảnh báo một lần.

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

| Đích                                | Gửi đến                                                        |
| ----------------------------------- | -------------------------------------------------------------- |
| `channel:<id>`                      | Kênh theo ID                                                   |
| `channel:<name>` hoặc `#channel-name` | Kênh theo tên, được tìm kiếm trong các nhóm mà bot tham gia     |
| `user:<id>` hoặc `mattermost:<id>`  | DM với người dùng đó                                           |
| `@username`                         | DM (tên người dùng được phân giải qua API Mattermost)           |

Mỗi tin nhắn gửi đi hỗ trợ tối đa một tệp đính kèm; hãy chia nhiều tệp thành các lượt gửi riêng biệt.

<Warning>
Các ID trần khó nhận biết (như `64ifufp...`) **không rõ nghĩa** trong Mattermost (ID người dùng hay ID kênh).

OpenClaw phân giải chúng với **ưu tiên người dùng**:

- Nếu ID tồn tại dưới dạng người dùng (`GET /api/v4/users/<id>` thành công), OpenClaw gửi **DM** bằng cách phân giải kênh trực tiếp qua `/api/v4/channels/direct`.
- Nếu không, ID được coi là **ID kênh**.

Nếu cần hành vi xác định, hãy luôn sử dụng các tiền tố rõ ràng (`user:<id>` / `channel:<id>`).
</Warning>

## Thử lại kênh DM

Khi OpenClaw gửi đến một đích DM Mattermost và trước tiên cần phân giải kênh trực tiếp, theo mặc định nó sẽ thử lại các lỗi tạm thời khi tạo kênh trực tiếp.

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

- Cấu hình này chỉ áp dụng cho việc tạo kênh tin nhắn trực tiếp (`/api/v4/channels/direct`), không áp dụng cho mọi lệnh gọi API Mattermost.
- Các lần thử lại sử dụng cơ chế lùi theo cấp số nhân có thêm độ trễ ngẫu nhiên và áp dụng cho các lỗi tạm thời như giới hạn tốc độ, phản hồi 5xx và lỗi mạng hoặc hết thời gian chờ.
- Các lỗi máy khách 4xx ngoài `429` được coi là vĩnh viễn và không được thử lại.

## Truyền phát bản xem trước

Mattermost truyền phát quá trình suy luận, hoạt động của công cụ và nội dung trả lời từng phần vào một **bài đăng xem trước dạng bản nháp**, bài đăng này được hoàn thiện tại chỗ khi câu trả lời cuối cùng đã an toàn để gửi. Ở chế độ `partial`, bản xem trước được cập nhật trên cùng một mã định danh bài đăng thay vì làm tràn kênh bằng các tin nhắn cho từng đoạn. Ở chế độ `block`, bản xem trước luân phiên giữa văn bản đã hoàn thành và các khối hoạt động của công cụ, vì vậy các khối trước đó vẫn hiển thị dưới dạng bài đăng riêng thay vì bị khối tiếp theo ghi đè. Kết quả cuối có nội dung đa phương tiện/lỗi sẽ hủy các chỉnh sửa bản xem trước đang chờ và sử dụng phương thức gửi thông thường thay vì hoàn tất một bài đăng xem trước dùng tạm.

Tính năng truyền phát bản xem trước **được bật theo mặc định** ở chế độ `partial`. Cấu hình qua `channels.mattermost.streaming` (một chuỗi chế độ, giá trị boolean hoặc một đối tượng như `{ mode: "progress" }`):

```json5
{
  channels: {
    mattermost: {
      streaming: "partial", // off | partial | block | progress
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Các chế độ truyền phát">
    - `partial` (mặc định): một bài đăng xem trước được chỉnh sửa khi nội dung trả lời dài thêm, sau đó được hoàn thiện bằng câu trả lời đầy đủ.
    - `block` luân phiên bản xem trước giữa văn bản đã hoàn thành và các khối hoạt động của công cụ, vì vậy mỗi khối vẫn hiển thị dưới dạng bài đăng riêng thay vì bị ghi đè tại chỗ. Các cập nhật công cụ song song và liên tiếp dùng chung bài đăng hoạt động công cụ hiện tại.
    - `progress` hiển thị bản xem trước trạng thái trong khi tạo nội dung và chỉ đăng câu trả lời cuối cùng khi hoàn tất.
    - `off` tắt truyền phát bản xem trước. Khi `blockStreaming: true`, các khối trợ lý đã hoàn thành vẫn được gửi dưới dạng câu trả lời theo khối thông thường (các bài đăng riêng biệt), thay vì một bài đăng cuối duy nhất đã được hợp nhất.

  </Accordion>
  <Accordion title="Lưu ý về hành vi truyền phát">
    - Nếu luồng không thể được hoàn thiện tại chỗ (ví dụ: bài đăng bị xóa giữa chừng), OpenClaw sẽ chuyển sang gửi một bài đăng cuối mới để câu trả lời không bao giờ bị mất.
    - Các tải trọng chỉ chứa quá trình suy luận không được đăng lên kênh, bao gồm cả văn bản đến dưới dạng khối trích dẫn `> Thinking`. Đặt `/reasoning on` để xem quá trình suy luận trên các bề mặt khác; bài đăng cuối trên Mattermost chỉ giữ lại câu trả lời.
    - Xem [Truyền phát](/vi/concepts/streaming#preview-streaming-modes) để biết ma trận ánh xạ kênh.

  </Accordion>
</AccordionGroup>

## Phản ứng (công cụ tin nhắn)

- Sử dụng `message action=react` với `channel=mattermost`.
- `messageId` là mã định danh bài đăng Mattermost.
- `emoji` chấp nhận các tên như `thumbsup` hoặc `:+1:` (dấu hai chấm là tùy chọn).
- Đặt `remove=true` (boolean) để xóa một phản ứng.
- Các sự kiện thêm/xóa phản ứng được chuyển tiếp dưới dạng sự kiện hệ thống đến phiên tác tử đã định tuyến, chịu cùng các kiểm tra chính sách tin nhắn trực tiếp/nhóm như tin nhắn.

Ví dụ:

```text
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup remove=true
```

Cấu hình:

- `channels.mattermost.actions.reactions`: bật/tắt các hành động phản ứng (mặc định là true).
- Ghi đè theo tài khoản: `channels.mattermost.accounts.<id>.actions.reactions`.

## Nút tương tác (công cụ tin nhắn)

Gửi tin nhắn có các nút có thể nhấp. Khi người dùng nhấp vào một nút, tác tử nhận lựa chọn và có thể phản hồi.

Các nút đến từ tải trọng ngữ nghĩa `presentation` (trong các câu trả lời thông thường của tác tử và trong `message action=send`). OpenClaw hiển thị các nút giá trị dưới dạng nút tương tác Mattermost, giữ các nút URL hiển thị trong nội dung tin nhắn và hạ cấp các trình đơn chọn thành văn bản dễ đọc.

```text
message action=send channel=mattermost target=channel:<channelId> presentation={"blocks":[{"type":"buttons","buttons":[{"label":"Yes","value":"yes"},{"label":"No","value":"no"}]}]}
```

Các trường của nút trình bày:

<ParamField path="label" type="string" required>
  Nhãn hiển thị (bí danh: `text`).
</ParamField>
<ParamField path="value" type="string">
  Giá trị được gửi lại khi nhấp, dùng làm mã định danh hành động (các bí danh: `callback_data`, `callbackData`). Bắt buộc đối với nút có thể nhấp trừ khi đã đặt `url`.
</ParamField>
<ParamField path="url" type="string">
  Nút liên kết; được hiển thị dưới dạng văn bản `label: url` trong nội dung tin nhắn thay vì một nút tương tác.
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
    Người nhấp phải vượt qua cùng các kiểm tra chính sách tin nhắn trực tiếp/nhóm như người gửi tin nhắn; các lượt nhấp không được phép sẽ nhận thông báo tạm thời và bị bỏ qua.
  </Step>
  <Step title="Các nút được thay bằng xác nhận">
    Tất cả các nút được thay bằng một dòng xác nhận (ví dụ: "✓ **Có** được @user chọn").
  </Step>
  <Step title="Tác tử nhận lựa chọn">
    Tác tử nhận lựa chọn dưới dạng tin nhắn đến (cùng với một sự kiện hệ thống) và phản hồi.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Lưu ý triển khai">
    - Các lệnh gọi lại của nút sử dụng xác minh HMAC-SHA256 (tự động, không cần cấu hình).
    - Toàn bộ khối tệp đính kèm được thay thế khi nhấp, vì vậy tất cả các nút được xóa cùng lúc — không thể xóa một phần.
    - Các mã định danh hành động chứa dấu gạch nối hoặc dấu gạch dưới được tự động làm sạch (giới hạn định tuyến của Mattermost).
    - Các lượt nhấp có `action_id` không khớp với một hành động trên bài đăng gốc sẽ bị từ chối với `403` ("Hành động không xác định").

  </Accordion>
  <Accordion title="Cấu hình và khả năng truy cập">
    - `channels.mattermost.capabilities`: mảng các chuỗi khả năng. Thêm `"inlineButtons"` để bật phần mô tả công cụ nút trong lời nhắc hệ thống của tác tử.
    - `channels.mattermost.interactions.callbackBaseUrl`: URL cơ sở bên ngoài tùy chọn cho các lệnh gọi lại của nút (ví dụ: `https://gateway.example.com`). Sử dụng cấu hình này khi Mattermost không thể truy cập trực tiếp Gateway tại máy chủ liên kết của nó.
    - Trong các thiết lập nhiều tài khoản, bạn cũng có thể đặt cùng trường này tại `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl`.
    - Nếu bỏ qua `interactions.callbackBaseUrl`, OpenClaw suy ra URL gọi lại từ `gateway.customBindHost` + `gateway.port` (mặc định là 18789), sau đó chuyển sang `http://localhost:<port>` nếu cần. Đường dẫn gọi lại là `/mattermost/interactions/<accountId>`.
    - Quy tắc về khả năng truy cập: máy chủ Mattermost phải truy cập được URL gọi lại của nút. `localhost` chỉ hoạt động khi Mattermost và OpenClaw chạy trên cùng máy chủ/không gian tên mạng.
    - `channels.mattermost.interactions.allowedSourceIps`: danh sách cho phép địa chỉ IP nguồn cho các lệnh gọi lại của nút. Nếu không có cấu hình này, chỉ các nguồn loopback (`127.0.0.1`, `::1`) được chấp nhận, vì vậy máy chủ Mattermost từ xa phải được thêm vào danh sách cho phép tại đây, nếu không các lượt nhấp của nó sẽ bị từ chối với `403`. Khi ở sau proxy ngược, hãy đặt thêm `gateway.trustedProxies` để địa chỉ IP máy khách thực được suy ra từ các tiêu đề chuyển tiếp.
    - Nếu đích gọi lại của bạn là riêng tư/tailnet/nội bộ, hãy thêm máy chủ/tên miền của nó vào `ServiceSettings.AllowedUntrustedInternalConnections` của Mattermost.

  </Accordion>
</AccordionGroup>

### Tích hợp API trực tiếp (tập lệnh bên ngoài)

Các tập lệnh và Webhook bên ngoài có thể đăng nút trực tiếp qua API REST Mattermost thay vì thông qua công cụ `message` của tác tử. Hãy sử dụng `buildButtonAttachments()` từ plugin khi có thể; nếu đăng JSON thô, hãy tuân theo các quy tắc sau:

**Cấu trúc tải trọng:**

```json5
{
  channel_id: "<channelId>",
  message: "Choose an option:",
  props: {
    attachments: [
      {
        actions: [
          {
            id: "mybutton01", // alphanumeric only - see below
            type: "button", // required, or clicks are silently ignored
            name: "Approve", // display label
            style: "primary", // optional: "default", "primary", "danger"
            integration: {
              url: "https://gateway.example.com/mattermost/interactions/default",
              context: {
                action_id: "mybutton01", // must match button id
                action: "approve",
                // ... any custom fields ...
                _token: "<hmac>", // see HMAC section below
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

1. Các tệp đính kèm phải nằm trong `props.attachments`, không phải `attachments` ở cấp cao nhất (sẽ bị bỏ qua mà không có thông báo).
2. Mọi hành động đều cần `type: "button"` — nếu thiếu, các lượt nhấp sẽ bị bỏ qua mà không có thông báo.
3. Mọi hành động đều cần trường `id` — Mattermost bỏ qua các hành động không có mã định danh.
4. `id` của hành động phải **chỉ gồm ký tự chữ và số** (`[a-zA-Z0-9]`). Dấu gạch nối và dấu gạch dưới làm hỏng định tuyến hành động phía máy chủ của Mattermost (trả về 404). Hãy loại bỏ chúng trước khi sử dụng.
5. `context.action_id` phải khớp với `id` của nút; Gateway từ chối các lượt nhấp có `action_id` không tồn tại trên bài đăng.
6. `context.action_id` là bắt buộc — trình xử lý tương tác trả về 400 nếu thiếu trường này.
7. Địa chỉ IP nguồn của lệnh gọi lại phải được cho phép (xem `interactions.allowedSourceIps` ở trên).

</Warning>

**Tạo mã thông báo HMAC**

Gateway xác minh các lượt nhấp nút bằng HMAC-SHA256. Các tập lệnh bên ngoài phải tạo mã thông báo khớp với logic xác minh của Gateway:

<Steps>
  <Step title="Dẫn xuất khóa bí mật từ mã thông báo bot">
    `HMAC-SHA256(key="openclaw-mattermost-interactions", data=botToken)`, được mã hóa dạng hex.
  </Step>
  <Step title="Tạo đối tượng ngữ cảnh">
    Tạo đối tượng ngữ cảnh với tất cả các trường **ngoại trừ** `_token`.
  </Step>
  <Step title="Tuần tự hóa với các khóa đã sắp xếp">
    Tuần tự hóa với **các khóa được sắp xếp đệ quy** và **không có khoảng trắng** (Gateway cũng chuẩn hóa các đối tượng lồng nhau và tạo JSON dạng gọn).
  </Step>
  <Step title="Ký tải trọng">
    `HMAC-SHA256(key=secret, data=serializedContext)`
  </Step>
  <Step title="Thêm mã thông báo">
    Thêm chuỗi băm hex thu được vào ngữ cảnh dưới dạng `_token`.
  </Step>
</Steps>

Ví dụ bằng Python:

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
    - Theo mặc định, `json.dumps` của Python thêm khoảng trắng (`{"key": "val"}`). Sử dụng `separators=(",", ":")` để khớp với đầu ra dạng gọn của JavaScript (`{"key":"val"}`).
    - Luôn ký **tất cả** các trường ngữ cảnh (trừ `_token`). Gateway loại bỏ `_token`, sau đó ký mọi trường còn lại. Chỉ ký một tập con sẽ khiến quá trình xác minh thất bại mà không có thông báo.
    - Sử dụng `sort_keys=True` — Gateway sắp xếp các khóa trước khi ký và Mattermost có thể sắp xếp lại các trường ngữ cảnh khi lưu tải trọng.
    - Dẫn xuất khóa bí mật từ mã thông báo bot (theo cách xác định), không dùng các byte ngẫu nhiên. Khóa bí mật phải giống nhau giữa tiến trình tạo nút và Gateway thực hiện xác minh.

  </Accordion>
</AccordionGroup>

## Bộ điều hợp thư mục

Plugin Mattermost bao gồm một bộ điều hợp thư mục phân giải tên kênh và tên người dùng qua API Mattermost. Điều này cho phép sử dụng các đích `#channel-name` và `@username` trong `openclaw message send` cũng như khi gửi qua Cron/Webhook.

Không cần cấu hình — bộ điều hợp sử dụng mã thông báo bot từ cấu hình tài khoản.

## Nhiều tài khoản

Mattermost hỗ trợ nhiều tài khoản trong `channels.mattermost.accounts`:

```json5
{
  channels: {
    mattermost: {
      accounts: {
        default: { name: "Chính", botToken: "mm-token", baseUrl: "https://chat.example.com" },
        alerts: { name: "Cảnh báo", botToken: "mm-token-2", baseUrl: "https://alerts.example.com" },
      },
    },
  },
}
```

Các giá trị của tài khoản ghi đè các trường cấp cao nhất; `channels.mattermost.defaultAccount` chọn tài khoản được sử dụng khi không chỉ định tài khoản nào.

## Khắc phục sự cố

<AccordionGroup>
  <Accordion title="Không có phản hồi trong các kênh">
    Đảm bảo bot có trong kênh và đề cập đến bot (oncall), sử dụng tiền tố kích hoạt (onchar) hoặc đặt `chatmode: "onmessage"`.
  </Accordion>
  <Accordion title="Lỗi xác thực hoặc nhiều tài khoản">
    - Kiểm tra token của bot, URL cơ sở và tài khoản có được bật hay không.
    - Sự cố nhiều tài khoản: các biến môi trường chỉ áp dụng cho tài khoản `default`.
    - Các máy chủ Mattermost riêng tư/LAN cần `network.dangerouslyAllowPrivateNetwork: true` (cơ chế bảo vệ SSRF chặn các IP riêng tư theo mặc định).

  </Accordion>
  <Accordion title="Lệnh gạch chéo gốc không hoạt động">
    - `Unauthorized: invalid command token.`: OpenClaw không chấp nhận token gọi lại. Các nguyên nhân thường gặp:
      - việc đăng ký lệnh gạch chéo không thành công hoặc chỉ hoàn tất một phần khi khởi động
      - yêu cầu gọi lại đang được gửi đến sai Gateway/tài khoản
      - Mattermost vẫn còn các lệnh cũ trỏ đến đích gọi lại trước đó
      - Gateway đã khởi động lại mà không kích hoạt lại các lệnh gạch chéo
    - Nếu các lệnh gạch chéo gốc ngừng hoạt động, hãy kiểm tra nhật ký để tìm `mattermost: failed to register slash commands` hoặc `mattermost: native slash commands enabled but no commands could be registered`.
    - Nếu bỏ qua `callbackUrl` và nhật ký cảnh báo rằng địa chỉ gọi lại được phân giải thành một URL loopback như `http://localhost:18789/...`, URL đó có thể chỉ truy cập được khi Mattermost chạy trên cùng máy chủ/không gian tên mạng với OpenClaw. Thay vào đó, hãy đặt `commands.callbackUrl` rõ ràng và có thể truy cập từ bên ngoài.

  </Accordion>
  <Accordion title="Sự cố với nút">
    - Các nút xuất hiện dưới dạng ô trắng hoặc hoàn toàn không xuất hiện: dữ liệu nút không đúng định dạng. Mỗi nút trình bày cần có `label` và `value` (các nút thiếu một trong hai sẽ bị loại bỏ).
    - Các nút được hiển thị nhưng thao tác nhấp không có tác dụng: xác minh rằng có thể truy cập Gateway từ máy chủ Mattermost, IP của máy chủ Mattermost có trong `channels.mattermost.interactions.allowedSourceIps` (nếu không có cấu hình này thì chỉ chấp nhận loopback) và `ServiceSettings.AllowedUntrustedInternalConnections` bao gồm máy chủ gọi lại đối với các đích riêng tư.
    - Các nút trả về 404 khi nhấp: `id` của nút có thể chứa dấu gạch nối hoặc dấu gạch dưới. Bộ định tuyến hành động của Mattermost gặp lỗi với ID chứa ký tự không phải chữ và số. Chỉ sử dụng `[a-zA-Z0-9]`.
    - Nhật ký Gateway hiển thị `rejected callback source`: thao tác nhấp đến từ một IP nằm ngoài `interactions.allowedSourceIps`. Thêm máy chủ Mattermost hoặc ingress của bạn vào danh sách cho phép và đặt `gateway.trustedProxies` khi sử dụng proxy ngược.
    - Nhật ký Gateway hiển thị `invalid _token`: HMAC không khớp. Kiểm tra để đảm bảo bạn ký tất cả các trường ngữ cảnh (không chỉ một tập con), sử dụng các khóa đã sắp xếp và sử dụng JSON thu gọn (không có khoảng trắng). Xem phần HMAC ở trên.
    - Nhật ký Gateway hiển thị `missing _token in context`: trường `_token` không có trong ngữ cảnh của nút. Đảm bảo trường này được bao gồm khi xây dựng tải trọng tích hợp.
    - Gateway từ chối thao tác nhấp với `Unknown action`: `context.action_id` không khớp với bất kỳ `id` hành động nào trên bài đăng. Đặt cả hai thành cùng một giá trị đã được làm sạch.
    - Tác nhân không cung cấp các nút: thêm `capabilities: ["inlineButtons"]` vào cấu hình kênh Mattermost.

  </Accordion>
</AccordionGroup>

## Liên quan

- [Định tuyến kênh](/vi/channels/channel-routing) - định tuyến phiên cho tin nhắn
- [Tổng quan về các kênh](/vi/channels) - tất cả các kênh được hỗ trợ
- [Nhóm](/vi/channels/groups) - hành vi trò chuyện nhóm và cơ chế kiểm soát bằng lượt đề cập
- [Ghép cặp](/vi/channels/pairing) - quy trình xác thực và ghép cặp qua tin nhắn trực tiếp
- [Bảo mật](/vi/gateway/security) - mô hình truy cập và tăng cường bảo mật
