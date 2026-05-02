---
read_when:
    - Cài đặt hoặc cấu hình Plugin
    - Tìm hiểu các quy tắc phát hiện và nạp Plugin
    - Làm việc với các gói Plugin tương thích với Codex/Claude
sidebarTitle: Install and Configure
summary: Cài đặt, cấu hình và quản lý các Plugin OpenClaw
title: Plugin
x-i18n:
    generated_at: "2026-05-02T10:55:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: c9378ef4a6aef26949148702f2f6d8537811869511e8830ae5c3d560ff06d98b
    source_path: tools/plugin.md
    workflow: 16
---

Các Plugin mở rộng OpenClaw với các khả năng mới: kênh, nhà cung cấp mô hình,
bộ khung agent, công cụ, Skills, lời nói, phiên âm thời gian thực, giọng nói
thời gian thực, hiểu nội dung phương tiện, tạo hình ảnh, tạo video, tìm nạp web,
tìm kiếm web, và nhiều hơn nữa. Một số Plugin là **lõi** (được phát hành kèm
OpenClaw), số khác là **bên ngoài**. Hầu hết Plugin bên ngoài được phát hành và
khám phá thông qua [ClawHub](/vi/tools/clawhub). Npm vẫn được hỗ trợ cho cài đặt
trực tiếp và cho một tập hợp tạm thời các gói Plugin do OpenClaw sở hữu trong khi
quá trình di chuyển đó hoàn tất.

## Bắt đầu nhanh

<Steps>
  <Step title="Xem những gì đã được tải">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="Cài đặt một Plugin">
    ```bash
    # Search ClawHub plugins
    openclaw plugins search "calendar"

    # From ClawHub
    openclaw plugins install clawhub:openclaw-codex-app-server

    # From npm
    openclaw plugins install npm:@acme/openclaw-plugin

    # From git
    openclaw plugins install git:github.com/acme/openclaw-plugin@v1.0.0

    # From a local directory or archive
    openclaw plugins install ./my-plugin
    openclaw plugins install ./my-plugin.tgz
    ```

  </Step>

  <Step title="Khởi động lại Gateway">
    ```bash
    openclaw gateway restart
    ```

    Sau đó cấu hình trong `plugins.entries.\<id\>.config` trong tệp cấu hình của bạn.

  </Step>

  <Step title="Xác minh Plugin">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json

    # If the plugin registered a CLI root, run one command from that root.
    openclaw <plugin-command> --help
    ```

    Dùng `--runtime` khi bạn cần chứng minh các công cụ, dịch vụ, phương thức gateway,
    hook, hoặc lệnh CLI do Plugin sở hữu đã được đăng ký. `inspect` thuần túy là một
    kiểm tra manifest/registry lạnh và cố ý tránh nhập runtime của Plugin.

  </Step>
</Steps>

Nếu bạn thích điều khiển gốc trong chat, hãy bật `commands.plugins: true` và dùng:

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

Đường dẫn cài đặt dùng cùng bộ phân giải như CLI: đường dẫn/kho lưu trữ cục bộ, `clawhub:<pkg>`
tường minh, `npm:<pkg>` tường minh, `git:<repo>` tường minh, hoặc spec gói thuần
(ClawHub trước, rồi fallback sang npm).

Nếu cấu hình không hợp lệ, quá trình cài đặt thường thất bại đóng và chỉ bạn đến
`openclaw doctor --fix`. Ngoại lệ khôi phục duy nhất là một đường dẫn cài đặt lại
Plugin tích hợp hẹp cho các Plugin chọn tham gia
`openclaw.install.allowInvalidConfigRecovery`.
Trong lúc Gateway khởi động, cấu hình không hợp lệ của một Plugin được cô lập trong Plugin đó:
quá trình khởi động ghi log vấn đề `plugins.entries.<id>.config`, bỏ qua Plugin đó khi
tải, và giữ các Plugin cũng như kênh khác trực tuyến. Chạy `openclaw doctor --fix`
để cách ly cấu hình Plugin lỗi bằng cách tắt mục Plugin đó và xóa payload cấu hình
không hợp lệ của nó; bản sao lưu cấu hình thông thường giữ lại các giá trị trước đó.
Khi cấu hình kênh tham chiếu một Plugin không còn có thể khám phá nhưng cùng id Plugin
cũ vẫn còn trong cấu hình Plugin hoặc bản ghi cài đặt, Gateway startup ghi log cảnh báo
và bỏ qua kênh đó thay vì chặn mọi kênh khác. Chạy `openclaw doctor --fix` để xóa
các mục kênh/Plugin cũ; các khóa kênh không xác định không có bằng chứng Plugin cũ
vẫn thất bại khi xác thực để lỗi gõ sai vẫn hiển thị.
Nếu đặt `plugins.enabled: false`, các tham chiếu Plugin cũ được xem là bất hoạt:
Gateway startup bỏ qua công việc khám phá/tải Plugin và `openclaw doctor` giữ nguyên
cấu hình Plugin bị tắt thay vì tự động xóa nó. Bật lại Plugin trước khi chạy dọn dẹp
doctor nếu bạn muốn xóa các id Plugin cũ.

Việc cài đặt phụ thuộc Plugin chỉ diễn ra trong các luồng cài đặt/cập nhật tường minh
hoặc sửa chữa bằng doctor. Gateway startup, tải lại cấu hình, và kiểm tra runtime không
chạy trình quản lý gói hoặc sửa cây phụ thuộc. Plugin cục bộ phải đã cài đặt sẵn các
phụ thuộc của chúng, trong khi Plugin npm, git, và ClawHub được cài dưới các gốc Plugin
do OpenClaw quản lý. Phụ thuộc npm có thể được hoist trong gốc npm do OpenClaw quản lý;
cài đặt/cập nhật quét gốc được quản lý đó trước khi tin cậy và gỡ cài đặt sẽ xóa các
gói do npm quản lý thông qua npm. Plugin bên ngoài và đường dẫn tải tùy chỉnh vẫn phải
được cài đặt thông qua `openclaw plugins install`.
Xem [Phân giải phụ thuộc Plugin](/vi/plugins/dependency-resolution) để biết vòng đời tại thời điểm cài đặt.

Các checkout nguồn là pnpm workspaces. Nếu bạn clone OpenClaw để chỉnh sửa Plugin tích hợp,
hãy chạy `pnpm install`; OpenClaw sau đó tải Plugin tích hợp từ `extensions/<id>` để các chỉnh sửa
và phụ thuộc cục bộ của gói được dùng trực tiếp. Cài đặt gốc npm thuần túy dành cho OpenClaw
đóng gói, không phải phát triển từ checkout nguồn.

## Loại Plugin

OpenClaw nhận diện hai định dạng Plugin:

| Định dạng  | Cách hoạt động                                                     | Ví dụ                                                  |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + module runtime; thực thi trong tiến trình | Plugin chính thức, gói npm cộng đồng                   |
| **Bundle** | Bố cục tương thích Codex/Claude/Cursor; ánh xạ sang tính năng OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Cả hai đều xuất hiện trong `openclaw plugins list`. Xem [Plugin Bundles](/vi/plugins/bundles) để biết chi tiết về bundle.

Nếu bạn đang viết một Plugin native, hãy bắt đầu với [Xây dựng Plugin](/vi/plugins/building-plugins)
và [Tổng quan Plugin SDK](/vi/plugins/sdk-overview).

## Điểm vào gói

Các gói npm Plugin native phải khai báo `openclaw.extensions` trong `package.json`.
Mỗi mục phải nằm trong thư mục gói và phân giải tới một tệp runtime có thể đọc,
hoặc tới một tệp nguồn TypeScript có peer JavaScript đã build được suy luận,
chẳng hạn `src/index.ts` tới `dist/index.js`.

Dùng `openclaw.runtimeExtensions` khi các tệp runtime đã phát hành không nằm ở cùng
đường dẫn với các mục nguồn. Khi có mặt, `runtimeExtensions` phải chứa chính xác
một mục cho mỗi mục `extensions`. Danh sách không khớp sẽ làm cài đặt và khám phá
Plugin thất bại thay vì âm thầm fallback về đường dẫn nguồn. Nếu bạn cũng phát hành
`openclaw.setupEntry`, hãy dùng `openclaw.runtimeSetupEntry` cho peer JavaScript đã build
của nó; tệp đó là bắt buộc khi được khai báo.

```json
{
  "name": "@acme/openclaw-plugin",
  "openclaw": {
    "extensions": ["./src/index.ts"],
    "runtimeExtensions": ["./dist/index.js"]
  }
}
```

## Plugin chính thức

### Các gói npm do OpenClaw sở hữu trong quá trình di chuyển

ClawHub là đường dẫn phân phối chính cho hầu hết Plugin. Các bản phát hành OpenClaw
đóng gói hiện tại đã tích hợp nhiều Plugin chính thức, vì vậy các Plugin đó không cần
cài đặt npm riêng trong thiết lập thông thường. Cho đến khi mọi Plugin do OpenClaw sở hữu
đã di chuyển sang ClawHub, OpenClaw vẫn phát hành một số gói Plugin `@openclaw/*` trên
npm cho các cài đặt cũ/tùy chỉnh và quy trình npm trực tiếp.

Nếu npm báo một gói Plugin `@openclaw/*` là deprecated, phiên bản gói đó thuộc một
dòng gói bên ngoài cũ hơn. Dùng Plugin tích hợp từ OpenClaw hiện tại hoặc một checkout
cục bộ cho đến khi gói npm mới hơn được phát hành.

| Plugin          | Gói                        | Tài liệu                                   |
| --------------- | -------------------------- | ------------------------------------------ |
| BlueBubbles     | `@openclaw/bluebubbles`    | [BlueBubbles](/vi/channels/bluebubbles)       |
| Discord         | `@openclaw/discord`        | [Discord](/vi/channels/discord)               |
| Feishu          | `@openclaw/feishu`         | [Feishu](/vi/channels/feishu)                 |
| Matrix          | `@openclaw/matrix`         | [Matrix](/vi/channels/matrix)                 |
| Mattermost      | `@openclaw/mattermost`     | [Mattermost](/vi/channels/mattermost)         |
| Microsoft Teams | `@openclaw/msteams`        | [Microsoft Teams](/vi/channels/msteams)       |
| Nextcloud Talk  | `@openclaw/nextcloud-talk` | [Nextcloud Talk](/vi/channels/nextcloud-talk) |
| Nostr           | `@openclaw/nostr`          | [Nostr](/vi/channels/nostr)                   |
| Synology Chat   | `@openclaw/synology-chat`  | [Synology Chat](/vi/channels/synology-chat)   |
| Tlon            | `@openclaw/tlon`           | [Tlon](/vi/channels/tlon)                     |
| WhatsApp        | `@openclaw/whatsapp`       | [WhatsApp](/vi/channels/whatsapp)             |
| Zalo            | `@openclaw/zalo`           | [Zalo](/vi/channels/zalo)                     |
| Zalo Personal   | `@openclaw/zalouser`       | [Zalo Personal](/vi/plugins/zalouser)         |

### Lõi (được phát hành kèm OpenClaw)

<AccordionGroup>
  <Accordion title="Nhà cung cấp mô hình (được bật theo mặc định)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Plugin bộ nhớ">
    - `memory-core` — tìm kiếm bộ nhớ tích hợp (mặc định qua `plugins.slots.memory`)
    - `memory-lancedb` — bộ nhớ dài hạn dựa trên LanceDB với tự động nhớ lại/ghi nhận (đặt `plugins.slots.memory = "memory-lancedb"`)

    Xem [Memory LanceDB](/vi/plugins/memory-lancedb) để biết thiết lập embedding tương thích OpenAI,
    ví dụ Ollama, giới hạn nhớ lại, và khắc phục sự cố.

  </Accordion>

  <Accordion title="Nhà cung cấp lời nói (được bật theo mặc định)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Khác">
    - `browser` — Plugin trình duyệt tích hợp cho công cụ trình duyệt, CLI `openclaw browser`, phương thức gateway `browser.request`, runtime trình duyệt, và dịch vụ điều khiển trình duyệt mặc định (được bật theo mặc định; hãy tắt trước khi thay thế)
    - `copilot-proxy` — cầu nối VS Code Copilot Proxy (bị tắt theo mặc định)

  </Accordion>
</AccordionGroup>

Đang tìm Plugin bên thứ ba? Xem [Plugin cộng đồng](/vi/plugins/community).

## Cấu hình

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    deny: ["untrusted-plugin"],
    load: { paths: ["~/Projects/oss/voice-call-plugin"] },
    entries: {
      "voice-call": { enabled: true, config: { provider: "twilio" } },
    },
  },
}
```

| Trường           | Mô tả                                                     |
| ---------------- | --------------------------------------------------------- |
| `enabled`        | Công tắc chính (mặc định: `true`)                         |
| `allow`          | Danh sách cho phép Plugin (tùy chọn)                      |
| `deny`           | Danh sách chặn Plugin (tùy chọn; chặn thắng)              |
| `load.paths`     | Tệp/thư mục Plugin bổ sung                                |
| `slots`          | Bộ chọn slot độc quyền (ví dụ `memory`, `contextEngine`)  |
| `entries.\<id\>` | Công tắc + cấu hình theo từng Plugin                      |

`plugins.allow` có tính loại trừ. Khi nó không rỗng, chỉ các Plugin được liệt kê mới có thể tải
hoặc lộ công cụ, ngay cả khi `tools.allow` chứa `"*"` hoặc một tên công cụ cụ thể
do Plugin sở hữu. Nếu một danh sách cho phép công cụ tham chiếu các công cụ Plugin,
hãy thêm id Plugin sở hữu vào `plugins.allow` hoặc xóa `plugins.allow`; `openclaw doctor`
cảnh báo về dạng này.

Thay đổi cấu hình **yêu cầu khởi động lại gateway**. Nếu Gateway đang chạy với theo dõi
cấu hình + khởi động lại trong tiến trình được bật (đường dẫn `openclaw gateway` mặc định),
lần khởi động lại đó thường được thực hiện tự động sau một lúc khi ghi cấu hình hoàn tất.
Không có đường dẫn hot-reload được hỗ trợ cho mã runtime Plugin native hoặc hook vòng đời;
hãy khởi động lại tiến trình Gateway đang phục vụ kênh live trước khi kỳ vọng mã
`register(api)` đã cập nhật, hook `api.on(...)`, công cụ, dịch vụ, hoặc hook provider/runtime chạy.

`openclaw plugins list` là ảnh chụp cục bộ của registry/cấu hình Plugin. Một Plugin
`enabled` ở đó nghĩa là registry đã lưu và cấu hình hiện tại cho phép Plugin
tham gia. Điều đó không chứng minh rằng một tiến trình con Gateway từ xa đang
chạy đã được khởi động lại vào cùng mã Plugin. Trên các thiết lập VPS/container
có tiến trình bọc, hãy gửi lệnh khởi động lại đến đúng tiến trình `openclaw gateway run`,
hoặc dùng `openclaw gateway restart` đối với Gateway đang chạy.

<Accordion title="Trạng thái Plugin: bị tắt, bị thiếu và không hợp lệ">
  - **Bị tắt**: Plugin tồn tại nhưng các quy tắc bật đã tắt nó. Cấu hình được giữ nguyên.
  - **Bị thiếu**: cấu hình tham chiếu đến một id Plugin mà quá trình khám phá không tìm thấy.
  - **Không hợp lệ**: Plugin tồn tại nhưng cấu hình của nó không khớp với schema đã khai báo. Quá trình khởi động Gateway chỉ bỏ qua Plugin đó; `openclaw doctor --fix` có thể cách ly mục không hợp lệ bằng cách tắt nó và xóa payload cấu hình của nó.

</Accordion>

## Khám phá và thứ tự ưu tiên

OpenClaw quét Plugin theo thứ tự này (kết quả khớp đầu tiên sẽ thắng):

<Steps>
  <Step title="Đường dẫn cấu hình">
    `plugins.load.paths` — đường dẫn tệp hoặc thư mục tường minh. Các đường dẫn trỏ
    ngược về những thư mục Plugin đóng gói đi kèm của chính OpenClaw sẽ bị bỏ qua;
    chạy `openclaw doctor --fix` để xóa các bí danh cũ đó.
  </Step>

  <Step title="Plugin workspace">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` và `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Plugin toàn cục">
    `~/.openclaw/<plugin-root>/*.ts` và `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Plugin đi kèm">
    Được phát hành cùng OpenClaw. Nhiều Plugin được bật mặc định (nhà cung cấp mô hình, giọng nói).
    Những Plugin khác cần được bật tường minh.
  </Step>
</Steps>

Các bản cài đặt đóng gói và ảnh Docker thường phân giải Plugin đi kèm từ cây
`dist/extensions` đã biên dịch. Nếu một thư mục nguồn Plugin đi kèm được
bind mount đè lên đường dẫn nguồn đóng gói tương ứng, ví dụ
`/app/extensions/synology-chat`, OpenClaw coi thư mục nguồn đã mount đó
là một lớp phủ nguồn đi kèm và khám phá nó trước gói
`/app/dist/extensions/synology-chat` đã đóng gói. Điều này giữ cho các vòng lặp
container của maintainer hoạt động mà không cần chuyển mọi Plugin đi kèm trở lại
nguồn TypeScript. Đặt `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1` để buộc dùng
các gói dist đã đóng gói ngay cả khi có mount lớp phủ nguồn.

### Quy tắc bật

- `plugins.enabled: false` tắt tất cả Plugin và bỏ qua công việc khám phá/tải Plugin
- `plugins.deny` luôn thắng `allow`
- `plugins.entries.\<id\>.enabled: false` tắt Plugin đó
- Plugin có nguồn gốc từ workspace **bị tắt theo mặc định** (phải được bật tường minh)
- Plugin đi kèm tuân theo tập mặc định bật sẵn tích hợp, trừ khi bị ghi đè
- Slot độc quyền có thể buộc bật Plugin được chọn cho slot đó
- Một số Plugin đi kèm dạng chọn tham gia được bật tự động khi cấu hình nêu tên
  một bề mặt do Plugin sở hữu, chẳng hạn ref mô hình nhà cung cấp, cấu hình kênh, hoặc runtime
  harness
- Cấu hình Plugin cũ được giữ nguyên khi `plugins.enabled: false` đang hoạt động;
  hãy bật lại Plugin trước khi chạy dọn dẹp doctor nếu bạn muốn xóa các id cũ
- Các tuyến Codex thuộc họ OpenAI giữ ranh giới Plugin riêng:
  `openai-codex/*` thuộc về Plugin OpenAI, trong khi Plugin app-server Codex
  đi kèm được chọn bởi `agentRuntime.id: "codex"` hoặc các ref mô hình
  `codex/*` cũ

## Khắc phục sự cố hook runtime

Nếu một Plugin xuất hiện trong `plugins list` nhưng hiệu ứng phụ hoặc hook
`register(api)` không chạy trong lưu lượng trò chuyện trực tiếp, hãy kiểm tra những mục này trước:

- Chạy `openclaw gateway status --deep --require-rpc` và xác nhận URL Gateway,
  profile, đường dẫn cấu hình và tiến trình đang hoạt động đúng là những thứ bạn đang chỉnh sửa.
- Khởi động lại Gateway trực tiếp sau khi thay đổi cài đặt/cấu hình/mã Plugin. Trong các container
  có tiến trình bọc, PID 1 có thể chỉ là một supervisor; hãy khởi động lại hoặc gửi tín hiệu đến tiến trình con
  `openclaw gateway run`.
- Dùng `openclaw plugins inspect <id> --runtime --json` để xác nhận các đăng ký hook và
  chẩn đoán. Các hook hội thoại không đi kèm như `llm_input`,
  `llm_output`, `before_agent_finalize`, và `agent_end` cần
  `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- Để chuyển đổi mô hình, ưu tiên `before_model_resolve`. Nó chạy trước khi phân giải mô hình
  cho lượt agent; `llm_output` chỉ chạy sau khi một lần thử mô hình
  tạo ra đầu ra assistant.
- Để chứng minh mô hình phiên có hiệu lực, dùng `openclaw sessions` hoặc các bề mặt
  phiên/trạng thái Gateway và, khi gỡ lỗi payload nhà cung cấp, khởi động
  Gateway với `--raw-stream --raw-stream-path <path>`.

### Thiết lập công cụ Plugin chậm

Nếu các lượt agent có vẻ bị khựng trong khi chuẩn bị công cụ, hãy bật ghi log trace và
kiểm tra các dòng thời gian của factory công cụ Plugin:

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

Tìm:

```text
[trace:plugin-tools] factory timings ...
```

Phần tóm tắt liệt kê tổng thời gian factory và các factory công cụ Plugin chậm nhất,
bao gồm id Plugin, tên công cụ đã khai báo, hình dạng kết quả và công cụ đó có
tùy chọn hay không. Các dòng chậm được nâng lên thành cảnh báo khi một factory đơn lẻ mất
ít nhất 1 giây hoặc tổng thời gian chuẩn bị factory công cụ Plugin mất ít nhất 5 giây.

Nếu một Plugin chiếm phần lớn thời gian, hãy kiểm tra các đăng ký runtime của nó:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

Sau đó cập nhật, cài đặt lại hoặc tắt Plugin đó. Tác giả Plugin nên chuyển
việc tải dependency tốn kém vào sau đường dẫn thực thi công cụ thay vì thực hiện
bên trong factory công cụ.

### Quyền sở hữu kênh hoặc công cụ bị trùng lặp

Triệu chứng:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

Những thông báo này nghĩa là nhiều hơn một Plugin đang bật đang cố sở hữu cùng một kênh,
luồng thiết lập hoặc tên công cụ. Nguyên nhân phổ biến nhất là một Plugin kênh bên ngoài
được cài đặt bên cạnh một Plugin đi kèm hiện cũng cung cấp cùng id kênh.

Các bước gỡ lỗi:

- Chạy `openclaw plugins list --enabled --verbose` để xem mọi Plugin đang bật
  và nguồn gốc.
- Chạy `openclaw plugins inspect <id> --runtime --json` cho từng Plugin bị nghi ngờ và
  so sánh `channels`, `channelConfigs`, `tools`, và chẩn đoán.
- Chạy `openclaw plugins registry --refresh` sau khi cài đặt hoặc gỡ bỏ
  gói Plugin để metadata đã lưu phản ánh bản cài đặt hiện tại.
- Khởi động lại Gateway sau các thay đổi cài đặt, registry hoặc cấu hình.

Tùy chọn sửa:

- Nếu một Plugin cố ý thay thế Plugin khác cho cùng id kênh, Plugin
  được ưu tiên nên khai báo `channelConfigs.<channel-id>.preferOver` với
  id Plugin có mức ưu tiên thấp hơn. Xem [/plugins/manifest#replacing-another-channel-plugin](/vi/plugins/manifest#replacing-another-channel-plugin).
- Nếu trùng lặp là vô tình, hãy tắt một bên bằng
  `plugins.entries.<plugin-id>.enabled: false` hoặc gỡ bản cài đặt Plugin
  cũ.
- Nếu bạn đã bật tường minh cả hai Plugin, OpenClaw giữ yêu cầu đó và
  báo cáo xung đột. Chọn một chủ sở hữu cho kênh hoặc đổi tên các công cụ do Plugin sở hữu
  để bề mặt runtime rõ ràng.

## Slot Plugin (danh mục độc quyền)

Một số danh mục là độc quyền (mỗi thời điểm chỉ một mục hoạt động):

```json5
{
  plugins: {
    slots: {
      memory: "memory-core", // or "none" to disable
      contextEngine: "legacy", // or a plugin id
    },
  },
}
```

| Slot            | Nội dung kiểm soát      | Mặc định             |
| --------------- | ----------------------- | -------------------- |
| `memory`        | Plugin bộ nhớ đang hoạt động | `memory-core`       |
| `contextEngine` | Công cụ ngữ cảnh đang hoạt động | `legacy` (tích hợp) |

## Tham chiếu CLI

```bash
openclaw plugins list                       # compact inventory
openclaw plugins list --enabled            # only enabled plugins
openclaw plugins list --verbose            # per-plugin detail lines
openclaw plugins list --json               # machine-readable inventory
openclaw plugins search <query>            # search ClawHub plugin catalog
openclaw plugins inspect <id>              # static detail
openclaw plugins inspect <id> --runtime    # registered hooks/tools/CLI/gateway methods
openclaw plugins inspect <id> --json       # machine-readable
openclaw plugins inspect --all             # fleet-wide table
openclaw plugins info <id>                 # inspect alias
openclaw plugins doctor                    # diagnostics
openclaw plugins registry                  # inspect persisted registry state
openclaw plugins registry --refresh        # rebuild persisted registry
openclaw doctor --fix                      # repair plugin registry state

openclaw plugins install <package>         # install (ClawHub first, then npm)
openclaw plugins install clawhub:<pkg>     # install from ClawHub only
openclaw plugins install npm:<pkg>         # install from npm only
openclaw plugins install git:<repo>        # install from git
openclaw plugins install git:<repo>@<ref>  # install from git ref
openclaw plugins install <spec> --force    # overwrite existing install
openclaw plugins install <path>            # install from local path
openclaw plugins install -l <path>         # link (no copy) for dev
openclaw plugins install <plugin> --marketplace <source>
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <spec> --pin      # record exact resolved npm spec
openclaw plugins install <spec> --dangerously-force-unsafe-install
openclaw plugins update <id-or-npm-spec> # update one plugin
openclaw plugins update <id-or-npm-spec> --dangerously-force-unsafe-install
openclaw plugins update --all            # update all
openclaw plugins uninstall <id>          # remove config and plugin index records
openclaw plugins uninstall <id> --keep-files
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json

# Verify runtime registrations after install.
openclaw plugins inspect <id> --runtime --json

# Run plugin-owned CLI commands directly from the OpenClaw root CLI.
openclaw <plugin-command> --help

openclaw plugins enable <id>
openclaw plugins disable <id>
```

Plugin đi kèm được phát hành cùng OpenClaw. Nhiều Plugin được bật theo mặc định (ví dụ
nhà cung cấp mô hình đi kèm, nhà cung cấp giọng nói đi kèm và Plugin trình duyệt
đi kèm). Các Plugin đi kèm khác vẫn cần `openclaw plugins enable <id>`.

`--force` ghi đè một Plugin đã cài đặt hoặc gói hook hiện có tại chỗ. Dùng
`openclaw plugins update <id-or-npm-spec>` cho các nâng cấp thường lệ của những Plugin npm
được theo dõi. Tùy chọn này không được hỗ trợ với `--link`, vốn tái sử dụng đường dẫn nguồn thay vì
sao chép đè lên mục tiêu cài đặt do hệ thống quản lý.

Khi `plugins.allow` đã được đặt, `openclaw plugins install` thêm id Plugin
đã cài đặt vào allowlist đó trước khi bật nó. Nếu cùng id Plugin
có trong `plugins.deny`, quá trình cài đặt sẽ xóa mục deny cũ đó để
bản cài đặt tường minh có thể tải ngay sau khi khởi động lại.

OpenClaw giữ một registry Plugin cục bộ đã lưu làm mô hình đọc lạnh cho
kiểm kê Plugin, quyền sở hữu đóng góp và lập kế hoạch khởi động. Các luồng cài đặt, cập nhật,
gỡ cài đặt, bật và tắt làm mới registry đó sau khi thay đổi trạng thái Plugin.
Cùng tệp `plugins/installs.json` giữ metadata cài đặt bền vững trong
`installRecords` cấp cao nhất và metadata manifest có thể xây dựng lại trong `plugins`. Nếu
registry bị thiếu, cũ hoặc không hợp lệ, `openclaw plugins registry
--refresh` xây dựng lại góc nhìn manifest của nó từ bản ghi cài đặt, chính sách cấu hình và
metadata manifest/package mà không tải các mô-đun runtime Plugin.
`openclaw plugins update <id-or-npm-spec>` áp dụng cho các bản cài đặt được theo dõi. Truyền
một spec gói npm có dist-tag hoặc phiên bản chính xác sẽ phân giải tên gói
ngược về bản ghi Plugin được theo dõi và ghi lại spec mới cho các lần cập nhật trong tương lai.
Truyền tên gói không có phiên bản sẽ chuyển một bản cài đặt đã ghim chính xác trở lại
dòng phát hành mặc định của registry. Nếu Plugin npm đã cài đặt đã khớp
phiên bản đã phân giải và định danh artifact đã ghi lại, OpenClaw bỏ qua bản cập nhật
mà không tải xuống, cài đặt lại hoặc ghi lại cấu hình.

`--pin` chỉ dành cho npm. Nó không được hỗ trợ với `--marketplace`, vì các lượt cài đặt marketplace lưu giữ siêu dữ liệu nguồn marketplace thay vì một npm spec.

`--dangerously-force-unsafe-install` là tùy chọn ghi đè khẩn cấp cho các cảnh báo dương tính giả từ trình quét mã nguy hiểm tích hợp sẵn. Nó cho phép cài đặt Plugin và cập nhật Plugin tiếp tục vượt qua các phát hiện `critical` tích hợp sẵn, nhưng vẫn không bỏ qua các chặn chính sách `before_install` của Plugin hoặc chặn do quét thất bại. Các lần quét cài đặt bỏ qua những tệp và thư mục kiểm thử phổ biến như `tests/`, `__tests__/`, `*.test.*`, và `*.spec.*` để tránh chặn các mock kiểm thử đã được đóng gói; các entrypoint runtime đã khai báo của Plugin vẫn được quét ngay cả khi chúng dùng một trong những tên đó.

Cờ CLI này chỉ áp dụng cho các luồng cài đặt/cập nhật Plugin. Các lượt cài đặt phụ thuộc Skills dựa trên Gateway dùng tùy chọn ghi đè yêu cầu `dangerouslyForceUnsafeInstall` tương ứng, trong khi `openclaw skills install` vẫn là luồng tải xuống/cài đặt Skills riêng của ClawHub.

Nếu một Plugin bạn đã xuất bản trên ClawHub bị ẩn hoặc bị chặn bởi một lần quét, hãy mở bảng điều khiển ClawHub hoặc chạy `clawhub package rescan <name>` để yêu cầu ClawHub kiểm tra lại. `--dangerously-force-unsafe-install` chỉ ảnh hưởng đến các lượt cài đặt trên máy của bạn; nó không yêu cầu ClawHub quét lại Plugin hoặc công khai một bản phát hành bị chặn.

Các bundle tương thích tham gia cùng luồng liệt kê/kiểm tra/bật/tắt Plugin. Hỗ trợ runtime hiện tại bao gồm bundle skills, command-skills của Claude, mặc định `settings.json` của Claude, mặc định `.lsp.json` của Claude và `lspServers` được khai báo trong manifest, command-skills của Cursor, và các thư mục hook Codex tương thích.

`openclaw plugins inspect <id>` cũng báo cáo các khả năng bundle đã phát hiện cùng với các mục máy chủ MCP và LSP được hỗ trợ hoặc không được hỗ trợ cho Plugin dựa trên bundle.

Nguồn marketplace có thể là tên known-marketplace của Claude từ `~/.claude/plugins/known_marketplaces.json`, một gốc marketplace cục bộ hoặc đường dẫn `marketplace.json`, dạng viết tắt GitHub như `owner/repo`, URL repo GitHub, hoặc URL git. Với marketplace từ xa, các mục Plugin phải ở bên trong repo marketplace đã clone và chỉ dùng nguồn đường dẫn tương đối.

Xem [tham chiếu CLI `openclaw plugins`](/vi/cli/plugins) để biết đầy đủ chi tiết.

## Tổng quan API Plugin

Plugin native xuất một đối tượng entry cung cấp `register(api)`. Plugin cũ hơn vẫn có thể dùng `activate(api)` làm alias kế thừa, nhưng Plugin mới nên dùng `register`.

```typescript
export default definePluginEntry({
  id: "my-plugin",
  name: "My Plugin",
  register(api) {
    api.registerProvider({
      /* ... */
    });
    api.registerTool({
      /* ... */
    });
    api.registerChannel({
      /* ... */
    });
  },
});
```

OpenClaw tải đối tượng entry và gọi `register(api)` trong quá trình kích hoạt Plugin. Loader vẫn fallback về `activate(api)` cho Plugin cũ hơn, nhưng Plugin đóng gói và Plugin bên ngoài mới nên xem `register` là hợp đồng công khai.

`api.registrationMode` cho Plugin biết vì sao entry của nó đang được tải:

| Chế độ          | Ý nghĩa                                                                                                                          |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | Kích hoạt runtime. Đăng ký công cụ, hook, dịch vụ, lệnh, route và các hiệu ứng phụ đang chạy khác.                              |
| `discovery`     | Khám phá khả năng chỉ đọc. Đăng ký provider và siêu dữ liệu; mã entry Plugin đáng tin cậy có thể tải, nhưng bỏ qua hiệu ứng phụ đang chạy. |
| `setup-only`    | Tải siêu dữ liệu thiết lập kênh thông qua một entry thiết lập nhẹ.                                                                |
| `setup-runtime` | Tải thiết lập kênh cũng cần entry runtime.                                                                         |
| `cli-metadata`  | Chỉ thu thập siêu dữ liệu lệnh CLI.                                                                                            |

Các entry Plugin mở socket, cơ sở dữ liệu, worker nền, hoặc client sống lâu nên bảo vệ các hiệu ứng phụ đó bằng `api.registrationMode === "full"`. Các lần tải khám phá được lưu cache riêng với các lần tải kích hoạt và không thay thế registry Gateway đang chạy. Khám phá là không kích hoạt, không phải không import: OpenClaw có thể đánh giá entry Plugin đáng tin cậy hoặc module Plugin kênh để xây dựng snapshot. Giữ cấp cao nhất của module nhẹ và không có hiệu ứng phụ, rồi chuyển network client, subprocess, listener, lượt đọc thông tin xác thực, và khởi động dịch vụ ra sau các đường dẫn full-runtime.

Các phương thức đăng ký phổ biến:

| Phương thức                             | Nội dung nó đăng ký          |
| --------------------------------------- | --------------------------- |
| `registerProvider`                      | Provider mô hình (LLM)      |
| `registerChannel`                       | Kênh trò chuyện             |
| `registerTool`                          | Công cụ agent               |
| `registerHook` / `on(...)`              | Hook vòng đời               |
| `registerSpeechProvider`                | Text-to-speech / STT        |
| `registerRealtimeTranscriptionProvider` | STT phát trực tuyến         |
| `registerRealtimeVoiceProvider`         | Giọng nói realtime song công |
| `registerMediaUnderstandingProvider`    | Phân tích hình ảnh/âm thanh |
| `registerImageGenerationProvider`       | Tạo hình ảnh                |
| `registerMusicGenerationProvider`       | Tạo nhạc                    |
| `registerVideoGenerationProvider`       | Tạo video                   |
| `registerWebFetchProvider`              | Provider web fetch / scrape |
| `registerWebSearchProvider`             | Tìm kiếm web                |
| `registerHttpRoute`                     | Endpoint HTTP               |
| `registerCommand` / `registerCli`       | Lệnh CLI                    |
| `registerContextEngine`                 | Context engine              |
| `registerService`                       | Dịch vụ nền                 |

Hành vi guard của hook cho các hook vòng đời có kiểu:

- `before_tool_call`: `{ block: true }` là kết thúc; các handler có độ ưu tiên thấp hơn bị bỏ qua.
- `before_tool_call`: `{ block: false }` là no-op và không xóa một block trước đó.
- `before_install`: `{ block: true }` là kết thúc; các handler có độ ưu tiên thấp hơn bị bỏ qua.
- `before_install`: `{ block: false }` là no-op và không xóa một block trước đó.
- `message_sending`: `{ cancel: true }` là kết thúc; các handler có độ ưu tiên thấp hơn bị bỏ qua.
- `message_sending`: `{ cancel: false }` là no-op và không xóa một cancel trước đó.

App-server Codex native bridge các sự kiện công cụ Codex-native trở lại bề mặt hook này. Plugin có thể chặn công cụ Codex native thông qua `before_tool_call`, quan sát kết quả thông qua `after_tool_call`, và tham gia phê duyệt `PermissionRequest` của Codex. Bridge hiện chưa ghi lại đối số công cụ Codex-native. Ranh giới hỗ trợ runtime Codex chính xác nằm trong [hợp đồng hỗ trợ Codex harness v1](/vi/plugins/codex-harness#v1-support-contract).

Để biết đầy đủ hành vi hook có kiểu, xem [tổng quan SDK](/vi/plugins/sdk-overview#hook-decision-semantics).

## Liên quan

- [Xây dựng Plugin](/vi/plugins/building-plugins) — tạo Plugin của riêng bạn
- [Bundle Plugin](/vi/plugins/bundles) — khả năng tương thích bundle Codex/Claude/Cursor
- [Manifest Plugin](/vi/plugins/manifest) — schema manifest
- [Đăng ký công cụ](/vi/plugins/building-plugins#registering-agent-tools) — thêm công cụ agent trong một Plugin
- [Nội bộ Plugin](/vi/plugins/architecture) — mô hình khả năng và pipeline tải
- [Plugin cộng đồng](/vi/plugins/community) — danh sách bên thứ ba
