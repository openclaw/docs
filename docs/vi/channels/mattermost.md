---
read_when:
    - Thiết lập Mattermost
    - Gỡ lỗi định tuyến Mattermost
sidebarTitle: Mattermost
summary: Thiết lập bot Mattermost và cấu hình OpenClaw
title: Mattermost
x-i18n:
    generated_at: "2026-07-16T14:06:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: e7d2233e26c6c0a510a264001a1e0d3e528d8645ffbe2affa3f1672304185ef5
    source_path: channels/mattermost.md
    workflow: 16
---

Trạng thái: plugin có thể tải xuống (token bot + sự kiện WebSocket). Hỗ trợ kênh, kênh riêng tư, DM nhóm và DM. Mattermost là nền tảng nhắn tin nhóm có thể tự lưu trữ ([mattermost.com](https://mattermost.com)).

## Cài đặt

<Tabs>
  <Tab title="npm registry">
    ```bash
    openclaw plugins install @openclaw/mattermost
    ```
  </Tab>
  <Tab title="Bản sao cục bộ">
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
    Sao chép **URL cơ sở** của Mattermost (ví dụ: `https://chat.example.com`). Dấu `/api/v4` ở cuối sẽ tự động bị loại bỏ.
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
Với Mattermost tự lưu trữ tại địa chỉ riêng tư/LAN/tailnet: các yêu cầu API Mattermost gửi đi đi qua cơ chế bảo vệ SSRF, mặc định chặn IP riêng tư và nội bộ. Cho phép bằng `channels.mattermost.network.dangerouslyAllowPrivateNetwork: true` (theo từng tài khoản: `channels.mattermost.accounts.<id>.network.dangerouslyAllowPrivateNetwork`).
</Note>

## Lệnh dấu gạch chéo gốc

Các lệnh dấu gạch chéo gốc là tính năng cần chủ động bật. Khi được bật, OpenClaw đăng ký các lệnh dấu gạch chéo `oc_*` trên mọi nhóm mà bot là thành viên và nhận các yêu cầu POST gọi lại trên máy chủ HTTP của Gateway.

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

Các lệnh đã đăng ký: `/oc_status`, `/oc_model`, `/oc_models`, `/oc_new`, `/oc_help`, `/oc_think`, `/oc_reasoning`, `/oc_verbose`, `/oc_queue`. Với `nativeSkills: true`, các lệnh Skills cũng được đăng ký dưới dạng `/oc_<skill>`.

<AccordionGroup>
  <Accordion title="Ghi chú về hành vi">
    - `native` và `nativeSkills` mặc định là `"auto"`, giá trị này được phân giải thành trạng thái tắt đối với Mattermost. Hãy đặt chúng thành `true` một cách tường minh.
    - `callbackPath` mặc định là `/api/channels/mattermost/command`.
    - Nếu bỏ qua `callbackUrl`, OpenClaw sẽ suy ra `http://<gateway.customBindHost or localhost>:<gateway.port, default 18789><callbackPath>`. Các máy chủ liên kết ký tự đại diện (`0.0.0.0`, `::`) sẽ dùng dự phòng `localhost`.
    - Đối với thiết lập nhiều tài khoản, có thể đặt `commands` ở cấp cao nhất hoặc bên dưới `channels.mattermost.accounts.<id>.commands` (giá trị tài khoản ghi đè các trường cấp cao nhất).
    - Các lệnh dấu gạch chéo hiện có với cùng trình kích hoạt do tích hợp khác tạo ra sẽ được giữ nguyên (quá trình đăng ký bỏ qua chúng); các lệnh do bot tạo sẽ được cập nhật hoặc tạo lại khi URL gọi lại thay đổi.
    - Các lệnh gọi lại được xác thực bằng token riêng cho từng lệnh do Mattermost trả về khi OpenClaw đăng ký các lệnh `oc_*`.
    - OpenClaw làm mới trạng thái đăng ký lệnh Mattermost hiện tại trước khi chấp nhận mỗi lệnh gọi lại, vì vậy các token cũ từ lệnh dấu gạch chéo đã bị xóa hoặc tạo lại sẽ không còn được chấp nhận mà không cần khởi động lại Gateway.
    - Quá trình xác thực lệnh gọi lại sẽ từ chối theo cơ chế đóng an toàn nếu API Mattermost không thể xác nhận lệnh vẫn còn hiện hành; các lần xác thực thất bại được lưu vào bộ nhớ đệm trong thời gian ngắn, các lượt tra cứu đồng thời được hợp nhất và việc bắt đầu tra cứu mới bị giới hạn tốc độ theo từng lệnh để hạn chế áp lực phát lại.
    - Các lệnh gọi lại dấu gạch chéo sẽ từ chối theo cơ chế đóng an toàn khi đăng ký thất bại, quá trình khởi động chỉ hoàn tất một phần hoặc token gọi lại không khớp với token đã đăng ký của lệnh được phân giải (token hợp lệ cho một lệnh không thể tiếp cận bước xác thực thượng nguồn của lệnh khác).
    - Các lệnh gọi lại được chấp nhận sẽ được xác nhận bằng phản hồi tạm thời "Đang xử lý..."; câu trả lời thực tế sẽ đến dưới dạng tin nhắn thông thường.

  </Accordion>
  <Accordion title="Yêu cầu về khả năng truy cập">
    Điểm cuối gọi lại phải có thể được truy cập từ máy chủ Mattermost.

    - Không đặt `callbackUrl` thành `localhost` trừ khi Mattermost chạy trên cùng máy chủ/không gian tên mạng với OpenClaw.
    - Không đặt `callbackUrl` thành URL cơ sở Mattermost trừ khi URL đó dùng proxy ngược chuyển tiếp `/api/channels/mattermost/command` đến OpenClaw.
    - Có thể kiểm tra nhanh bằng `curl https://<gateway-host>/api/channels/mattermost/command`; yêu cầu GET phải trả về `405 Method Not Allowed` từ OpenClaw, không phải `404`.

  </Accordion>
  <Accordion title="Danh sách cho phép lưu lượng đi Mattermost">
    Nếu đích gọi lại sử dụng địa chỉ riêng tư/tailnet/nội bộ, hãy đặt `ServiceSettings.AllowedUntrustedInternalConnections` của Mattermost để bao gồm máy chủ/tên miền gọi lại.

    Sử dụng mục máy chủ/tên miền, không sử dụng URL đầy đủ.

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

Không thể đặt `MATTERMOST_URL` từ `.env` của không gian làm việc; xem [Tệp .env của không gian làm việc](/vi/gateway/security).
</Note>

## Chế độ trò chuyện

Mattermost tự động phản hồi DM. Hành vi trong kênh do `chatmode` kiểm soát:

<Tabs>
  <Tab title="oncall (mặc định)">
    Chỉ phản hồi khi được @đề cập trong kênh.
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

- `onchar` vẫn phản hồi các lượt @đề cập tường minh.
- `channels.mattermost.requireMention` vẫn được áp dụng, nhưng ưu tiên `chatmode`. Thiết lập `groups.<channelId>.requireMention` theo từng kênh được ưu tiên hơn cả hai.
- Sau khi bot gửi phản hồi hiển thị trong một luồng của kênh, các tin nhắn sau đó trong cùng luồng sẽ được trả lời mà không cần lượt @đề cập mới hoặc tiền tố `onchar`, nhờ đó cuộc hội thoại nhiều lượt trong luồng tiếp tục liền mạch. Trạng thái tham gia được ghi nhớ trong 7 ngày kể từ lần cuối bot phản hồi trong luồng đó và được duy trì qua các lần khởi động lại Gateway. Những luồng mà bot chỉ quan sát sẽ không bị ảnh hưởng; hãy bắt đầu một tin nhắn cấp cao nhất mới để yêu cầu lượt đề cập tường minh trở lại.

## Phân luồng và phiên

Sử dụng `channels.mattermost.replyToMode` để kiểm soát việc phản hồi trong kênh và nhóm sẽ nằm ở kênh chính hay bắt đầu một luồng bên dưới bài đăng kích hoạt.

- `off` (mặc định): chỉ phản hồi trong luồng khi bài đăng gửi đến đã nằm trong một luồng.
- `first`: đối với bài đăng cấp cao nhất trong kênh/nhóm, bắt đầu một luồng bên dưới bài đăng đó và định tuyến cuộc hội thoại đến một phiên có phạm vi luồng.
- `all` và `batched`: hiện có cùng hành vi với `first` đối với Mattermost, vì sau khi Mattermost có gốc luồng, các phần tiếp theo và nội dung đa phương tiện sẽ tiếp tục trong cùng luồng đó.
- Tin nhắn trực tiếp mặc định là `off` ngay cả khi đặt `replyToMode`.

Sử dụng `channels.mattermost.replyToModeByChatType` để ghi đè chế độ cho các cuộc trò chuyện `direct`, `group` hoặc `channel`. Đặt `direct` để bật phân luồng cho tin nhắn trực tiếp:

- `off` (mặc định): tin nhắn trực tiếp không phân luồng và nằm trong một phiên cuốn chiếu duy nhất.
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

Ghi chú:

- Các phiên có phạm vi luồng sử dụng ID bài đăng kích hoạt làm gốc luồng.
- `first` và `all` hiện tương đương vì sau khi Mattermost có gốc luồng, các phần tiếp theo và nội dung đa phương tiện sẽ tiếp tục trong cùng luồng đó.
- Các ghi đè theo loại trò chuyện được ưu tiên hơn `replyToMode`. Nếu không có ghi đè `direct`, các bản triển khai hiện có sẽ giữ nguyên DM phẳng, không phân luồng.

## Kiểm soát truy cập (DM)

- Mặc định: `channels.mattermost.dmPolicy = "pairing"` (người gửi không xác định nhận mã ghép nối). Các giá trị khác: `allowlist`, `open`, `disabled`.
- Phê duyệt qua:
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- DM công khai: `channels.mattermost.dmPolicy="open"` cộng với `channels.mattermost.allowFrom=["*"]` (lược đồ cấu hình bắt buộc sử dụng ký tự đại diện).
- `channels.mattermost.allowFrom` chấp nhận ID người dùng (khuyến nghị) và các mục `accessGroup:<name>`. Xem [Nhóm truy cập](/vi/channels/access-groups).

## Kênh (nhóm)

- Mặc định: `channels.mattermost.groupPolicy = "allowlist"` (yêu cầu đề cập).
- Cho phép người gửi bằng `channels.mattermost.groupAllowFrom` (khuyến nghị dùng ID người dùng).
- `channels.mattermost.groupAllowFrom` chấp nhận các mục `accessGroup:<name>`. Xem [Nhóm truy cập](/vi/channels/access-groups).
- Các ghi đè đề cập theo từng kênh nằm dưới `channels.mattermost.groups.<channelId>.requireMention` hoặc `channels.mattermost.groups["*"].requireMention` làm giá trị mặc định.
- Khớp `@username` có thể thay đổi và chỉ được bật khi `channels.mattermost.dangerouslyAllowNameMatching: true`.
- Kênh mở: `channels.mattermost.groupPolicy="open"` (yêu cầu đề cập).
- Thứ tự phân giải: `channels.mattermost.groupPolicy`, sau đó `channels.defaults.groupPolicy`, rồi `"allowlist"`.
- Ghi chú thời gian chạy: nếu hoàn toàn thiếu phần `channels.mattermost`, thời gian chạy sẽ từ chối theo cơ chế đóng an toàn thành `groupPolicy="allowlist"` cho các lần kiểm tra nhóm (ngay cả khi đã đặt `channels.defaults.groupPolicy`) và ghi cảnh báo một lần.

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
| `channel:<name>` hoặc `#channel-name` | Kênh theo tên, được tìm kiếm trong các nhóm mà bot tham gia    |
| `user:<id>` hoặc `mattermost:<id>`    | DM với người dùng đó                                          |
| `@username`                         | DM (tên người dùng được phân giải qua API Mattermost)         |

Mỗi lần gửi đi hỗ trợ tối đa một tệp đính kèm cho mỗi tin nhắn; hãy chia nhiều tệp thành các lần gửi riêng biệt.

<Warning>
Các ID mờ không có tiền tố (như `64ifufp...`) là **mơ hồ** trong Mattermost (ID người dùng hay ID kênh).

OpenClaw phân giải chúng bằng cách **ưu tiên người dùng**:

- Nếu ID tồn tại dưới dạng người dùng (`GET /api/v4/users/<id>` thành công), OpenClaw gửi **DM** bằng cách phân giải kênh trực tiếp qua `/api/v4/channels/direct`.
- Nếu không, ID được coi là **ID kênh**.

Nếu cần hành vi xác định, luôn sử dụng các tiền tố tường minh (`user:<id>` / `channel:<id>`).
</Warning>

## Thử lại kênh DM

Khi OpenClaw gửi đến đích tin nhắn trực tiếp (DM) trên Mattermost và trước tiên cần phân giải kênh trực tiếp, theo mặc định, hệ thống sẽ thử lại các lỗi tạm thời khi tạo kênh trực tiếp.

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

- Điều này chỉ áp dụng cho việc tạo kênh DM (`/api/v4/channels/direct`), không áp dụng cho mọi lệnh gọi API Mattermost.
- Các lần thử lại sử dụng cơ chế lùi theo cấp số nhân kèm độ trễ ngẫu nhiên và áp dụng cho các lỗi tạm thời như giới hạn tốc độ, phản hồi 5xx và lỗi mạng hoặc hết thời gian chờ.
- Các lỗi máy khách 4xx ngoài `429` được coi là vĩnh viễn và không được thử lại.

## Phát trực tiếp bản xem trước

Mattermost phát trực tiếp quá trình suy luận, hoạt động của công cụ và nội dung trả lời từng phần vào một **bài đăng xem trước dạng bản nháp**, được hoàn tất tại chỗ khi câu trả lời cuối cùng đủ an toàn để gửi. Trong chế độ `partial`, bản xem trước được cập nhật trên cùng một ID bài đăng thay vì làm tràn kênh bằng một tin nhắn cho mỗi đoạn. Trong chế độ `block`, bản xem trước luân chuyển giữa văn bản đã hoàn thành và các khối hoạt động của công cụ, nhờ đó các khối trước đó vẫn hiển thị dưới dạng bài đăng riêng thay vì bị khối tiếp theo ghi đè. Kết quả cuối có nội dung đa phương tiện/lỗi sẽ hủy các chỉnh sửa bản xem trước đang chờ và sử dụng cơ chế gửi thông thường thay vì hoàn tất một bài đăng xem trước dùng một lần.

Phát trực tiếp bản xem trước được **bật theo mặc định** ở chế độ `partial`. Cấu hình qua `channels.mattermost.streaming.mode` (các giá trị vô hướng/boolean cũ `streaming` được `openclaw doctor --fix` di chuyển):

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
  <Accordion title="Các chế độ phát trực tiếp">
    - `partial` (mặc định): một bài đăng xem trước được chỉnh sửa khi câu trả lời dài thêm, sau đó được hoàn tất bằng câu trả lời đầy đủ.
    - `block` luân chuyển bản xem trước giữa văn bản đã hoàn thành và các khối hoạt động của công cụ, nhờ đó mỗi khối vẫn hiển thị dưới dạng bài đăng riêng thay vì bị ghi đè tại chỗ. Các cập nhật công cụ song song và liên tiếp dùng chung bài đăng hoạt động công cụ hiện tại.
    - `progress` hiển thị bản xem trước trạng thái trong khi tạo nội dung và chỉ đăng câu trả lời cuối cùng khi hoàn tất.
    - `off` tắt tính năng phát trực tiếp bản xem trước. Với `streaming.block.enabled: true`, các khối trợ lý đã hoàn thành vẫn được gửi dưới dạng câu trả lời khối thông thường (các bài đăng riêng biệt) thay vì một bài đăng cuối cùng được hợp nhất.

  </Accordion>
  <Accordion title="Lưu ý về hành vi phát trực tiếp">
    - Nếu không thể hoàn tất luồng tại chỗ (ví dụ: bài đăng bị xóa giữa chừng), OpenClaw sẽ chuyển sang gửi một bài đăng cuối cùng mới để câu trả lời không bao giờ bị mất.
    - Các tải trọng chỉ chứa quá trình suy luận sẽ bị loại khỏi bài đăng trên kênh, bao gồm cả văn bản đến dưới dạng trích dẫn khối `> Thinking`. Đặt `/reasoning on` để xem quá trình suy luận trên các bề mặt khác; bài đăng Mattermost cuối cùng chỉ giữ lại câu trả lời.
    - Xem [Phát trực tiếp](/vi/concepts/streaming#preview-streaming-modes) để biết ma trận ánh xạ kênh.

  </Accordion>
</AccordionGroup>

## Cảm xúc (công cụ tin nhắn)

- Sử dụng `message action=react` với `channel=mattermost`.
- `messageId` là ID bài đăng Mattermost.
- `emoji` chấp nhận các tên như `thumbsup` hoặc `:+1:` (dấu hai chấm là tùy chọn).
- Đặt `remove=true` (boolean) để xóa một cảm xúc.
- Các sự kiện thêm/xóa cảm xúc được chuyển tiếp dưới dạng sự kiện hệ thống đến phiên tác nhân đã định tuyến, tuân theo cùng các kiểm tra chính sách DM/nhóm như tin nhắn.

Ví dụ:

```text
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup remove=true
```

Cấu hình:

- `channels.mattermost.actions.reactions`: bật/tắt các hành động cảm xúc (mặc định là true).
- Ghi đè theo tài khoản: `channels.mattermost.accounts.<id>.actions.reactions`.

## Nút tương tác (công cụ tin nhắn)

Gửi tin nhắn có các nút có thể nhấp. Khi người dùng nhấp vào một nút, tác nhân nhận được lựa chọn và có thể phản hồi.

Các nút đến từ tải trọng ngữ nghĩa `presentation` (trong câu trả lời thông thường của tác nhân và trong `message action=send`). OpenClaw kết xuất các nút giá trị thành nút tương tác Mattermost, giữ các nút URL hiển thị trong văn bản tin nhắn và chuyển các menu lựa chọn xuống dạng văn bản dễ đọc.

```text
message action=send channel=mattermost target=channel:<channelId> presentation={"blocks":[{"type":"buttons","buttons":[{"label":"Yes","value":"yes"},{"label":"No","value":"no"}]}]}
```

Các trường của nút trình bày:

<ParamField path="label" type="string" required>
  Nhãn hiển thị (bí danh: `text`).
</ParamField>
<ParamField path="value" type="string">
  Giá trị được gửi lại khi nhấp, dùng làm ID hành động (các bí danh: `callback_data`, `callbackData`). Bắt buộc đối với nút có thể nhấp trừ khi `url` được đặt.
</ParamField>
<ParamField path="url" type="string">
  Nút liên kết; được kết xuất dưới dạng văn bản `label: url` trong nội dung tin nhắn thay vì nút tương tác.
</ParamField>
<ParamField path="style" type='"primary" | "secondary" | "success" | "danger"'>
  Kiểu nút. Mattermost áp dụng kiểu mặc định cho các giá trị mà hệ thống không hỗ trợ.
</ParamField>

Để thông báo khả năng hỗ trợ nút trong lời nhắc hệ thống của tác nhân, hãy thêm `inlineButtons` vào các khả năng của kênh:

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
    Người nhấp phải vượt qua cùng các kiểm tra chính sách DM/nhóm như người gửi tin nhắn; các lượt nhấp trái phép sẽ nhận được thông báo tạm thời và bị bỏ qua.
  </Step>
  <Step title="Các nút được thay thế bằng xác nhận">
    Tất cả các nút được thay thế bằng một dòng xác nhận (ví dụ: "✓ **Yes** được @user chọn").
  </Step>
  <Step title="Tác nhân nhận lựa chọn">
    Tác nhân nhận lựa chọn dưới dạng tin nhắn đến (cùng một sự kiện hệ thống) và phản hồi.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Lưu ý triển khai">
    - Các lệnh gọi lại của nút sử dụng xác minh HMAC-SHA256 (tự động, không cần cấu hình).
    - Toàn bộ khối tệp đính kèm được thay thế khi nhấp, vì vậy tất cả các nút đều bị xóa cùng nhau — không thể xóa một phần.
    - Các ID hành động chứa dấu gạch nối hoặc dấu gạch dưới được tự động làm sạch (hạn chế định tuyến của Mattermost).
    - Các lượt nhấp có `action_id` không khớp với một hành động trên bài đăng gốc sẽ bị từ chối với `403` ("Hành động không xác định").

  </Accordion>
  <Accordion title="Cấu hình và khả năng truy cập">
    - `channels.mattermost.capabilities`: mảng các chuỗi khả năng. Thêm `"inlineButtons"` để bật mô tả công cụ nút trong lời nhắc hệ thống của tác nhân.
    - `channels.mattermost.interactions.callbackBaseUrl`: URL cơ sở bên ngoài tùy chọn cho các lệnh gọi lại của nút (ví dụ: `https://gateway.example.com`). Sử dụng tùy chọn này khi Mattermost không thể truy cập trực tiếp Gateway tại máy chủ liên kết của Gateway.
    - Trong các thiết lập nhiều tài khoản, bạn cũng có thể đặt cùng trường đó dưới `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl`.
    - Nếu bỏ qua `interactions.callbackBaseUrl`, OpenClaw suy ra URL gọi lại từ `gateway.customBindHost` + `gateway.port` (mặc định 18789), sau đó chuyển sang `http://localhost:<port>`. Đường dẫn gọi lại là `/mattermost/interactions/<accountId>`.
    - Quy tắc khả năng truy cập: máy chủ Mattermost phải truy cập được URL gọi lại của nút. `localhost` chỉ hoạt động khi Mattermost và OpenClaw chạy trên cùng một máy chủ/không gian tên mạng.
    - `channels.mattermost.interactions.allowedSourceIps`: danh sách cho phép IP nguồn cho các lệnh gọi lại của nút. Nếu không có danh sách này, chỉ các nguồn loopback (`127.0.0.1`, `::1`) được chấp nhận, vì vậy máy chủ Mattermost từ xa phải được thêm vào danh sách cho phép tại đây, nếu không các lượt nhấp của máy chủ sẽ bị từ chối với `403`. Khi ở sau proxy ngược, cũng đặt `gateway.trustedProxies` để IP thực của máy khách được suy ra từ các tiêu đề chuyển tiếp.
    - Nếu đích gọi lại của bạn là riêng tư/tailnet/nội bộ, hãy thêm máy chủ/miền của đích vào `ServiceSettings.AllowedUntrustedInternalConnections` của Mattermost.

  </Accordion>
</AccordionGroup>

### Tích hợp API trực tiếp (tập lệnh bên ngoài)

Các tập lệnh và webhook bên ngoài có thể đăng nút trực tiếp qua API REST Mattermost thay vì đi qua công cụ `message` của tác nhân. Nên ưu tiên công cụ `message` của OpenClaw. Đối với các tích hợp trực tiếp, hãy nhập `buildButtonAttachments` từ `@openclaw/mattermost/api.js`; nếu đăng JSON thô, hãy tuân theo các quy tắc sau:

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
**Quy tắc quan trọng**

1. Các tệp đính kèm nằm trong `props.attachments`, không phải `attachments` cấp cao nhất (sẽ bị bỏ qua mà không có thông báo).
2. Mỗi hành động cần có `type: "button"` — nếu không, các lượt nhấp sẽ bị bỏ qua mà không có thông báo.
3. Mỗi hành động cần có trường `id` — Mattermost bỏ qua các hành động không có ID.
4. `id` của hành động phải **chỉ gồm chữ và số** (`[a-zA-Z0-9]`). Dấu gạch nối và dấu gạch dưới làm hỏng cơ chế định tuyến hành động phía máy chủ của Mattermost (trả về 404). Hãy loại bỏ chúng trước khi sử dụng.
5. `context.action_id` phải khớp với `id` của nút; Gateway từ chối các lượt nhấp có `action_id` không tồn tại trên bài đăng.
6. `context.action_id` là bắt buộc — trình xử lý tương tác trả về 400 nếu thiếu trường này.
7. IP nguồn gọi lại phải được cho phép (xem `interactions.allowedSourceIps` ở trên).

</Warning>

**Tạo token HMAC**

Gateway xác minh các lượt nhấp nút bằng HMAC-SHA256. Các tập lệnh bên ngoài phải tạo token khớp với logic xác minh của Gateway:

<Steps>
  <Step title="Suy ra khóa bí mật từ token bot">
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
    Thêm giá trị băm hex thu được dưới dạng `_token` trong ngữ cảnh.
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
    - `json.dumps` của Python mặc định thêm khoảng trắng (`{"key": "val"}`). Sử dụng `separators=(",", ":")` để khớp với đầu ra thu gọn của JavaScript (`{"key":"val"}`).
    - Luôn ký **tất cả** các trường ngữ cảnh (trừ `_token`). Gateway loại bỏ `_token` rồi ký mọi trường còn lại. Chỉ ký một tập hợp con sẽ khiến quá trình xác minh âm thầm thất bại.
    - Sử dụng `sort_keys=True` — Gateway sắp xếp các khóa trước khi ký và Mattermost có thể sắp xếp lại các trường ngữ cảnh khi lưu tải trọng.
    - Dẫn xuất bí mật từ token bot (theo cách xác định), không dùng các byte ngẫu nhiên. Bí mật phải giống nhau giữa tiến trình tạo nút và Gateway thực hiện xác minh.

  </Accordion>
</AccordionGroup>

## Bộ điều hợp thư mục

Plugin Mattermost bao gồm một bộ điều hợp thư mục phân giải tên kênh và tên người dùng thông qua API Mattermost. Điều này cho phép sử dụng các đích `#channel-name` và `@username` trong `openclaw message send` cũng như các lượt gửi cron/webhook.

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
  <Accordion title="Không có phản hồi trong kênh">
    Đảm bảo bot có trong kênh và đề cập đến bot (oncall), sử dụng tiền tố kích hoạt (onchar) hoặc đặt `chatmode: "onmessage"`.
  </Accordion>
  <Accordion title="Lỗi xác thực hoặc nhiều tài khoản">
    - Kiểm tra token bot, URL cơ sở và tài khoản có được bật hay không.
    - Sự cố nhiều tài khoản: các biến môi trường chỉ áp dụng cho tài khoản `default`.
    - Các máy chủ Mattermost riêng tư/LAN cần `network.dangerouslyAllowPrivateNetwork: true` (cơ chế bảo vệ SSRF mặc định chặn các IP riêng tư).

  </Accordion>
  <Accordion title="Lệnh gạch chéo gốc không hoạt động">
    - `Unauthorized: invalid command token.`: OpenClaw không chấp nhận token gọi lại. Các nguyên nhân thường gặp:
      - đăng ký lệnh gạch chéo thất bại hoặc chỉ hoàn tất một phần khi khởi động
      - lệnh gọi lại đang đến sai Gateway/tài khoản
      - Mattermost vẫn còn các lệnh cũ trỏ đến đích gọi lại trước đó
      - Gateway đã khởi động lại mà không kích hoạt lại các lệnh gạch chéo
    - Nếu các lệnh gạch chéo gốc ngừng hoạt động, hãy kiểm tra nhật ký để tìm `mattermost: failed to register slash commands` hoặc `mattermost: native slash commands enabled but no commands could be registered`.
    - Nếu bỏ qua `callbackUrl` và nhật ký cảnh báo rằng lệnh gọi lại được phân giải thành URL loopback như `http://localhost:18789/...`, URL đó có thể chỉ truy cập được khi Mattermost chạy trên cùng máy chủ/không gian tên mạng với OpenClaw. Thay vào đó, hãy đặt một `commands.callbackUrl` có thể truy cập rõ ràng từ bên ngoài.

  </Accordion>
  <Accordion title="Sự cố với nút">
    - Các nút xuất hiện dưới dạng ô màu trắng hoặc hoàn toàn không xuất hiện: dữ liệu nút không đúng định dạng. Mỗi nút trình bày cần một `label` và một `value` (các nút thiếu một trong hai sẽ bị loại bỏ).
    - Các nút hiển thị nhưng thao tác nhấp không có tác dụng: xác minh rằng có thể truy cập Gateway từ máy chủ Mattermost, IP máy chủ Mattermost được đưa vào `channels.mattermost.interactions.allowedSourceIps` (nếu không có, chỉ loopback được chấp nhận) và `ServiceSettings.AllowedUntrustedInternalConnections` bao gồm máy chủ gọi lại cho các đích riêng tư.
    - Các nút trả về 404 khi nhấp: `id` của nút có thể chứa dấu gạch nối hoặc dấu gạch dưới. Bộ định tuyến hành động của Mattermost không hoạt động với ID chứa ký tự không phải chữ và số. Chỉ sử dụng `[a-zA-Z0-9]`.
    - Gateway ghi nhật ký `rejected callback source`: lượt nhấp đến từ một IP nằm ngoài `interactions.allowedSourceIps`. Thêm máy chủ Mattermost hoặc ingress của bạn vào danh sách cho phép và đặt `gateway.trustedProxies` khi dùng phía sau proxy ngược.
    - Gateway ghi nhật ký `invalid _token`: HMAC không khớp. Kiểm tra rằng bạn ký tất cả các trường ngữ cảnh (không phải một tập hợp con), sử dụng các khóa đã sắp xếp và sử dụng JSON thu gọn (không có khoảng trắng). Xem phần HMAC ở trên.
    - Gateway ghi nhật ký `missing _token in context`: trường `_token` không có trong ngữ cảnh của nút. Đảm bảo trường này được bao gồm khi tạo tải trọng tích hợp.
    - Gateway từ chối lượt nhấp với `Unknown action`: `context.action_id` không khớp với bất kỳ `id` hành động nào trên bài đăng. Đặt cả hai thành cùng một giá trị đã được làm sạch.
    - Tác nhân không cung cấp nút: thêm `capabilities: ["inlineButtons"]` vào cấu hình kênh Mattermost.

  </Accordion>
</AccordionGroup>

## Liên quan

- [Định tuyến kênh](/vi/channels/channel-routing) — định tuyến phiên cho tin nhắn
- [Tổng quan về kênh](/vi/channels) — tất cả các kênh được hỗ trợ
- [Nhóm](/vi/channels/groups) — hành vi trò chuyện nhóm và kiểm soát bằng lượt đề cập
- [Ghép nối](/vi/channels/pairing) — quy trình xác thực DM và ghép nối
- [Bảo mật](/vi/gateway/security) — mô hình truy cập và tăng cường bảo mật
