---
read_when:
    - Cài đặt hoặc cấu hình các Plugin
    - Tìm hiểu các quy tắc phát hiện và tải Plugin
    - Làm việc với các gói Plugin tương thích với Codex/Claude
sidebarTitle: Install and Configure
summary: Cài đặt, cấu hình và quản lý các Plugin OpenClaw
title: Plugin
x-i18n:
    generated_at: "2026-05-03T21:37:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 30e3cffc15c5c52dd539e21103c207c9e38955f9fd3acd561a52964eefafb8f0
    source_path: tools/plugin.md
    workflow: 16
---

Các Plugin mở rộng OpenClaw với các khả năng mới: kênh, nhà cung cấp mô hình,
bộ khung agent, công cụ, Skills, giọng nói, phiên âm thời gian thực, giọng nói
thời gian thực, hiểu nội dung phương tiện, tạo hình ảnh, tạo video, truy xuất web,
tìm kiếm web, và nhiều hơn nữa. Một số Plugin là **lõi** (được phân phối cùng OpenClaw),
các Plugin khác là **bên ngoài**. Hầu hết Plugin bên ngoài được xuất bản và khám phá thông qua
[ClawHub](/vi/tools/clawhub). Npm vẫn được hỗ trợ cho cài đặt trực tiếp và cho một
tập hợp tạm thời các gói Plugin do OpenClaw sở hữu trong khi quá trình di chuyển đó hoàn tất.

## Bắt đầu nhanh

Để xem các ví dụ cài đặt, liệt kê, gỡ cài đặt, cập nhật và xuất bản có thể sao chép-dán, hãy xem
[Quản lý Plugin](/vi/plugins/manage-plugins).

<Steps>
  <Step title="Xem nội dung đã được tải">
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

    Sau đó cấu hình dưới `plugins.entries.\<id\>.config` trong tệp cấu hình của bạn.

  </Step>

  <Step title="Quản lý ngay trong trò chuyện">
    Trong một Gateway đang chạy, `/plugins enable` và `/plugins disable` chỉ dành cho chủ sở hữu
    sẽ kích hoạt trình tải lại cấu hình Gateway. Gateway tải lại các bề mặt runtime của Plugin
    ngay trong tiến trình, và các lượt agent mới sẽ xây dựng lại danh sách công cụ của chúng từ
    registry đã được làm mới. `/plugins install` thay đổi mã nguồn Plugin, vì vậy
    Gateway yêu cầu khởi động lại thay vì giả vờ rằng tiến trình hiện tại có thể
    tải lại an toàn các mô-đun đã được import.

  </Step>

  <Step title="Xác minh Plugin">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json

    # If the plugin registered a CLI root, run one command from that root.
    openclaw <plugin-command> --help
    ```

    Dùng `--runtime` khi bạn cần chứng minh các công cụ, dịch vụ, phương thức gateway,
    hook hoặc lệnh CLI do Plugin sở hữu đã được đăng ký. `inspect` thông thường là một
    kiểm tra manifest/registry lạnh và cố ý tránh import runtime của Plugin.

  </Step>
</Steps>

Nếu bạn muốn điều khiển ngay trong trò chuyện, hãy bật `commands.plugins: true` và dùng:

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

Đường dẫn cài đặt dùng cùng resolver như CLI: đường dẫn/kho lưu trữ cục bộ, `clawhub:<pkg>` rõ ràng,
`npm:<pkg>` rõ ràng, `git:<repo>` rõ ràng, hoặc đặc tả gói trần qua npm.

Nếu cấu hình không hợp lệ, cài đặt thường sẽ đóng an toàn và chỉ bạn đến
`openclaw doctor --fix`. Ngoại lệ khôi phục duy nhất là đường dẫn cài đặt lại
Plugin đi kèm có phạm vi hẹp cho các Plugin chọn tham gia
`openclaw.install.allowInvalidConfigRecovery`.
Trong khi Gateway khởi động, cấu hình Plugin không hợp lệ sẽ đóng an toàn như mọi cấu hình
không hợp lệ khác. Chạy `openclaw doctor --fix` để cách ly cấu hình Plugin lỗi bằng cách
tắt mục Plugin đó và xóa payload cấu hình không hợp lệ của nó; bản sao lưu cấu hình thông thường
giữ lại các giá trị trước đó.
Khi một cấu hình kênh tham chiếu đến một Plugin không còn có thể khám phá nhưng cùng id Plugin cũ
vẫn còn trong cấu hình Plugin hoặc bản ghi cài đặt, Gateway startup ghi cảnh báo và bỏ qua kênh đó
thay vì chặn mọi kênh khác.
Chạy `openclaw doctor --fix` để xóa các mục kênh/Plugin cũ; các khóa kênh không xác định
không có bằng chứng Plugin cũ vẫn sẽ không vượt qua xác thực để lỗi gõ vẫn hiển thị.
Nếu đặt `plugins.enabled: false`, các tham chiếu Plugin cũ được coi là bất hoạt:
Gateway startup bỏ qua công việc khám phá/tải Plugin và `openclaw doctor` giữ nguyên
cấu hình Plugin đã tắt thay vì tự động xóa nó. Bật lại Plugin trước khi
chạy dọn dẹp doctor nếu bạn muốn xóa các id Plugin cũ.

Việc cài đặt phụ thuộc của Plugin chỉ diễn ra trong các luồng cài đặt/cập nhật rõ ràng hoặc
sửa chữa bằng doctor. Gateway startup, tải lại cấu hình và kiểm tra runtime không
chạy trình quản lý gói hoặc sửa cây phụ thuộc. Plugin cục bộ phải đã có
các phụ thuộc được cài đặt, trong khi các Plugin npm, git và ClawHub được
cài dưới các gốc Plugin do OpenClaw quản lý. Các phụ thuộc npm có thể được hoist
trong gốc npm do OpenClaw quản lý; cài đặt/cập nhật quét gốc được quản lý đó trước khi
tin cậy và gỡ cài đặt sẽ xóa các gói do npm quản lý thông qua npm. Plugin bên ngoài
và đường dẫn tải tùy chỉnh vẫn phải được cài thông qua `openclaw plugins install`.
Dùng `openclaw plugins list --json` để xem `dependencyStatus` tĩnh cho từng
Plugin hiển thị mà không import mã runtime hoặc sửa phụ thuộc.
Xem [Phân giải phụ thuộc Plugin](/vi/plugins/dependency-resolution) để biết vòng đời tại thời điểm cài đặt.

Đối với cài đặt npm, các selector có thể thay đổi như `latest` hoặc dist-tag được phân giải
trước khi cài đặt rồi được ghim vào đúng phiên bản đã xác minh trong gốc npm
do OpenClaw quản lý. Sau khi npm hoàn tất, OpenClaw xác minh mục
`package-lock.json` đã cài vẫn khớp với phiên bản đã phân giải và integrity. Nếu
npm ghi metadata gói khác, quá trình cài đặt thất bại và gói được quản lý
được rollback thay vì chấp nhận một artifact Plugin khác.

Các checkout nguồn là pnpm workspaces. Nếu bạn clone OpenClaw để chỉnh sửa các
Plugin đi kèm, hãy chạy `pnpm install`; sau đó OpenClaw tải các Plugin đi kèm từ
`extensions/<id>` để các chỉnh sửa và phụ thuộc cục bộ của gói được dùng trực tiếp.
Cài đặt gốc npm thông thường dành cho OpenClaw đã đóng gói, không dành cho
phát triển từ checkout nguồn.

## Các loại Plugin

OpenClaw nhận diện hai định dạng Plugin:

| Định dạng | Cách hoạt động | Ví dụ |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + mô-đun runtime; thực thi trong tiến trình | Plugin chính thức, gói npm cộng đồng |
| **Bundle** | Bố cục tương thích Codex/Claude/Cursor; được ánh xạ sang các tính năng OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Cả hai đều xuất hiện trong `openclaw plugins list`. Xem [Plugin Bundles](/vi/plugins/bundles) để biết chi tiết về bundle.

Nếu bạn đang viết một Plugin native, hãy bắt đầu với [Xây dựng Plugin](/vi/plugins/building-plugins)
và [Tổng quan Plugin SDK](/vi/plugins/sdk-overview).

## Entry point của gói

Các gói npm Plugin native phải khai báo `openclaw.extensions` trong `package.json`.
Mỗi entry phải nằm trong thư mục gói và phân giải tới một tệp runtime có thể đọc,
hoặc tới một tệp nguồn TypeScript có peer JavaScript đã build được suy luận
như `src/index.ts` tới `dist/index.js`.
Các bản cài đặt đã đóng gói phải phân phối đầu ra runtime JavaScript đó. Fallback
nguồn TypeScript dành cho checkout nguồn và đường dẫn phát triển cục bộ, không dành cho
gói npm được cài vào gốc Plugin do OpenClaw quản lý.

Dùng `openclaw.runtimeExtensions` khi các tệp runtime đã xuất bản không nằm tại
cùng đường dẫn với các entry nguồn. Khi có mặt, `runtimeExtensions` phải chứa
đúng một entry cho mỗi entry `extensions`. Danh sách không khớp khiến cài đặt và
khám phá Plugin thất bại thay vì âm thầm fallback về đường dẫn nguồn. Nếu bạn cũng
xuất bản `openclaw.setupEntry`, hãy dùng `openclaw.runtimeSetupEntry` cho peer
JavaScript đã build của nó; tệp đó là bắt buộc khi được khai báo.

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

### Gói npm do OpenClaw sở hữu trong quá trình di chuyển

ClawHub là đường dẫn phân phối chính cho hầu hết Plugin. Các bản phát hành OpenClaw
đã đóng gói hiện tại đã kèm sẵn nhiều Plugin chính thức, vì vậy chúng không cần
cài đặt npm riêng trong các thiết lập thông thường. Cho đến khi mọi Plugin do OpenClaw sở hữu
đã chuyển sang ClawHub, OpenClaw vẫn phân phối một số gói Plugin `@openclaw/*` trên
npm cho các bản cài đặt cũ/tùy chỉnh và luồng làm việc npm trực tiếp.

Nếu npm báo một gói Plugin `@openclaw/*` là deprecated, phiên bản gói đó
đến từ một chuỗi gói bên ngoài cũ hơn. Hãy dùng Plugin đi kèm từ
OpenClaw hiện tại hoặc một checkout cục bộ cho đến khi gói npm mới hơn được xuất bản.

| Plugin | Gói | Tài liệu |
| --------------- | -------------------------- | ------------------------------------------ |
| BlueBubbles | `@openclaw/bluebubbles` | [BlueBubbles](/vi/channels/bluebubbles) |
| Discord | `@openclaw/discord` | [Discord](/vi/channels/discord) |
| Feishu | `@openclaw/feishu` | [Feishu](/vi/channels/feishu) |
| Matrix | `@openclaw/matrix` | [Matrix](/vi/channels/matrix) |
| Mattermost | `@openclaw/mattermost` | [Mattermost](/vi/channels/mattermost) |
| Microsoft Teams | `@openclaw/msteams` | [Microsoft Teams](/vi/channels/msteams) |
| Nextcloud Talk | `@openclaw/nextcloud-talk` | [Nextcloud Talk](/vi/channels/nextcloud-talk) |
| Nostr | `@openclaw/nostr` | [Nostr](/vi/channels/nostr) |
| Synology Chat | `@openclaw/synology-chat` | [Synology Chat](/vi/channels/synology-chat) |
| Tlon | `@openclaw/tlon` | [Tlon](/vi/channels/tlon) |
| WhatsApp | `@openclaw/whatsapp` | [WhatsApp](/vi/channels/whatsapp) |
| Zalo | `@openclaw/zalo` | [Zalo](/vi/channels/zalo) |
| Zalo Personal | `@openclaw/zalouser` | [Zalo Personal](/vi/plugins/zalouser) |

### Lõi (phân phối cùng OpenClaw)

<AccordionGroup>
  <Accordion title="Nhà cung cấp mô hình (được bật theo mặc định)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Plugin bộ nhớ">
    - `memory-core` — tìm kiếm bộ nhớ đi kèm (mặc định qua `plugins.slots.memory`)
    - `memory-lancedb` — bộ nhớ dài hạn dựa trên LanceDB với tự động nhớ lại/thu thập (đặt `plugins.slots.memory = "memory-lancedb"`)

    Xem [Memory LanceDB](/vi/plugins/memory-lancedb) để biết thiết lập embedding tương thích OpenAI,
    ví dụ Ollama, giới hạn nhớ lại và xử lý sự cố.

  </Accordion>

  <Accordion title="Nhà cung cấp giọng nói (được bật theo mặc định)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Khác">
    - `browser` — Plugin trình duyệt đi kèm cho công cụ trình duyệt, CLI `openclaw browser`, phương thức gateway `browser.request`, runtime trình duyệt và dịch vụ điều khiển trình duyệt mặc định (được bật theo mặc định; tắt trước khi thay thế)
    - `copilot-proxy` — cầu nối VS Code Copilot Proxy (bị tắt theo mặc định)

  </Accordion>
</AccordionGroup>

Đang tìm Plugin của bên thứ ba? Xem [Plugin cộng đồng](/vi/plugins/community).

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

| Trường            | Mô tả                                               |
| ---------------- | --------------------------------------------------------- |
| `enabled`        | Công tắc chính (mặc định: `true`)                           |
| `allow`          | Danh sách cho phép Plugin (tùy chọn)                               |
| `deny`           | Danh sách từ chối Plugin (tùy chọn; từ chối được ưu tiên)                     |
| `load.paths`     | Tệp/thư mục Plugin bổ sung                            |
| `slots`          | Bộ chọn vị trí độc quyền (ví dụ: `memory`, `contextEngine`) |
| `entries.\<id\>` | Công tắc bật/tắt + cấu hình theo từng Plugin                               |

`plugins.allow` là độc quyền. Khi không rỗng, chỉ các Plugin được liệt kê mới có thể tải
hoặc cung cấp công cụ, ngay cả khi `tools.allow` chứa `"*"` hoặc tên công cụ cụ thể
thuộc sở hữu Plugin. Nếu danh sách cho phép công cụ tham chiếu đến công cụ Plugin, hãy thêm id Plugin sở hữu
vào `plugins.allow` hoặc xóa `plugins.allow`; `openclaw doctor` sẽ cảnh báo về
dạng cấu hình này.

Các thay đổi cấu hình được thực hiện qua `/plugins enable` hoặc `/plugins disable` sẽ kích hoạt
việc tải lại Plugin trong tiến trình Gateway. Các lượt agent mới xây dựng lại danh sách công cụ từ
registry Plugin đã được làm mới. Các thao tác thay đổi nguồn như cài đặt,
cập nhật và gỡ cài đặt vẫn khởi động lại tiến trình Gateway vì các mô-đun Plugin đã được nhập
không thể được thay thế an toàn tại chỗ.

`openclaw plugins list` là snapshot cục bộ của registry/cấu hình Plugin. Một Plugin
`enabled` ở đó có nghĩa là registry đã lưu và cấu hình hiện tại cho phép
Plugin tham gia. Điều đó không chứng minh rằng một Gateway từ xa đang chạy
đã tải lại hoặc khởi động lại vào cùng mã Plugin. Trên các thiết lập VPS/container
có tiến trình wrapper, hãy gửi lệnh khởi động lại hoặc các lần ghi kích hoạt tải lại đến đúng tiến trình
`openclaw gateway run`, hoặc dùng `openclaw gateway restart` với
Gateway đang chạy khi báo cáo tải lại cho biết có lỗi.

<Accordion title="Plugin states: disabled vs missing vs invalid">
  - **Đã tắt**: Plugin tồn tại nhưng các quy tắc bật/tắt đã tắt nó. Cấu hình được giữ nguyên.
  - **Thiếu**: cấu hình tham chiếu đến một id Plugin mà quá trình khám phá không tìm thấy.
  - **Không hợp lệ**: Plugin tồn tại nhưng cấu hình của nó không khớp với schema đã khai báo. Khi khởi động, Gateway chỉ bỏ qua Plugin đó; `openclaw doctor --fix` có thể cách ly mục nhập không hợp lệ bằng cách tắt nó và xóa payload cấu hình của nó.

</Accordion>

## Khám phá và độ ưu tiên

OpenClaw quét Plugin theo thứ tự sau (kết quả khớp đầu tiên được ưu tiên):

<Steps>
  <Step title="Config paths">
    `plugins.load.paths` — đường dẫn tệp hoặc thư mục tường minh. Các đường dẫn trỏ
    ngược về những thư mục Plugin đóng gói đi kèm của chính OpenClaw sẽ bị bỏ qua;
    chạy `openclaw doctor --fix` để xóa các alias cũ đó.
  </Step>

  <Step title="Workspace plugins">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` và `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Global plugins">
    `~/.openclaw/<plugin-root>/*.ts` và `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Bundled plugins">
    Được phát hành cùng OpenClaw. Nhiều Plugin được bật theo mặc định (nhà cung cấp mô hình, giọng nói).
    Các Plugin khác cần được bật tường minh.
  </Step>
</Steps>

Các bản cài đóng gói và image Docker thường phân giải Plugin đóng gói đi kèm từ
cây `dist/extensions` đã biên dịch. Nếu một thư mục nguồn Plugin đóng gói đi kèm được
bind-mount đè lên đường dẫn nguồn đóng gói tương ứng, ví dụ
`/app/extensions/synology-chat`, OpenClaw sẽ xem thư mục nguồn đã mount đó
là overlay nguồn đóng gói đi kèm và khám phá nó trước bundle
`/app/dist/extensions/synology-chat` đã đóng gói. Điều này giữ cho các vòng lặp container
của maintainer hoạt động mà không cần chuyển mọi Plugin đóng gói đi kèm trở lại nguồn TypeScript.
Đặt `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1` để buộc dùng các bundle dist đã đóng gói
ngay cả khi có mount overlay nguồn.

### Quy tắc bật/tắt

- `plugins.enabled: false` tắt tất cả Plugin và bỏ qua công việc khám phá/tải Plugin
- `plugins.deny` luôn được ưu tiên hơn allow
- `plugins.entries.\<id\>.enabled: false` tắt Plugin đó
- Plugin có nguồn gốc từ workspace **bị tắt theo mặc định** (phải được bật tường minh)
- Plugin đóng gói đi kèm tuân theo tập mặc định bật sẵn tích hợp, trừ khi bị ghi đè
- Các vị trí độc quyền có thể buộc bật Plugin được chọn cho vị trí đó
- Một số Plugin đóng gói đi kèm dạng opt-in được bật tự động khi cấu hình nêu tên một
  bề mặt thuộc sở hữu Plugin, chẳng hạn như tham chiếu mô hình nhà cung cấp, cấu hình kênh hoặc runtime
  harness
- Cấu hình Plugin cũ được giữ nguyên khi `plugins.enabled: false` đang hoạt động;
  hãy bật lại Plugin trước khi chạy dọn dẹp bằng doctor nếu bạn muốn xóa các id cũ
- Các tuyến Codex thuộc họ OpenAI giữ ranh giới Plugin riêng:
  `openai-codex/*` thuộc về Plugin OpenAI, còn Plugin app-server Codex đóng gói đi kèm
  được chọn bằng `agentRuntime.id: "codex"` hoặc các tham chiếu mô hình
  `codex/*` cũ

## Khắc phục sự cố hook runtime

Nếu một Plugin xuất hiện trong `plugins list` nhưng hiệu ứng phụ hoặc hook của `register(api)`
không chạy trong lưu lượng chat trực tiếp, hãy kiểm tra các điểm này trước:

- Chạy `openclaw gateway status --deep --require-rpc` và xác nhận URL
  Gateway đang hoạt động, profile, đường dẫn cấu hình và tiến trình đúng là những thứ bạn đang chỉnh sửa.
- Khởi động lại Gateway trực tiếp sau khi thay đổi cài đặt/cấu hình/mã Plugin. Trong các container
  wrapper, PID 1 có thể chỉ là supervisor; hãy khởi động lại hoặc gửi tín hiệu cho tiến trình con
  `openclaw gateway run`.
- Dùng `openclaw plugins inspect <id> --runtime --json` để xác nhận đăng ký hook và
  chẩn đoán. Các hook hội thoại không đóng gói đi kèm như `llm_input`,
  `llm_output`, `before_agent_finalize` và `agent_end` cần
  `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- Với chuyển đổi mô hình, ưu tiên `before_model_resolve`. Nó chạy trước quá trình phân giải mô hình
  cho các lượt agent; `llm_output` chỉ chạy sau khi một lần thử mô hình
  tạo ra đầu ra assistant.
- Để chứng minh mô hình phiên hiệu lực, dùng `openclaw sessions` hoặc các bề mặt
  phiên/trạng thái Gateway và, khi debug payload nhà cung cấp, khởi động
  Gateway với `--raw-stream --raw-stream-path <path>`.

### Thiết lập công cụ Plugin chậm

Nếu các lượt agent có vẻ bị treo khi chuẩn bị công cụ, hãy bật ghi log trace và
kiểm tra các dòng thời gian factory công cụ Plugin:

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

Tìm:

```text
[trace:plugin-tools] factory timings ...
```

Bản tóm tắt liệt kê tổng thời gian factory và các factory công cụ Plugin chậm nhất,
bao gồm id Plugin, tên công cụ đã khai báo, dạng kết quả và liệu công cụ có
tùy chọn hay không. Các dòng chậm được nâng thành cảnh báo khi một factory đơn lẻ mất
ít nhất 1 giây hoặc tổng thời gian chuẩn bị factory công cụ Plugin mất ít nhất 5 giây.

OpenClaw lưu cache các kết quả factory công cụ Plugin thành công cho các lần phân giải lặp lại
với cùng ngữ cảnh yêu cầu hiệu lực. Khóa cache bao gồm cấu hình runtime hiệu lực,
workspace, id agent/phiên, chính sách sandbox, thiết lập trình duyệt,
ngữ cảnh gửi, danh tính requester và trạng thái sở hữu, nên các factory
phụ thuộc vào các trường đáng tin cậy đó sẽ được chạy lại khi ngữ cảnh thay đổi.

Nếu một Plugin chiếm phần lớn thời gian, hãy kiểm tra các đăng ký runtime của nó:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

Sau đó cập nhật, cài đặt lại hoặc tắt Plugin đó. Tác giả Plugin nên chuyển
việc tải phụ thuộc tốn kém ra sau đường dẫn thực thi công cụ thay vì thực hiện
bên trong factory công cụ.

### Trùng quyền sở hữu kênh hoặc công cụ

Triệu chứng:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

Những thông báo này có nghĩa là nhiều hơn một Plugin đã bật đang cố sở hữu cùng một kênh,
luồng thiết lập hoặc tên công cụ. Nguyên nhân phổ biến nhất là một Plugin kênh bên ngoài
được cài đặt bên cạnh một Plugin đóng gói đi kèm hiện cung cấp cùng id kênh.

Các bước debug:

- Chạy `openclaw plugins list --enabled --verbose` để xem mọi Plugin đã bật
  và nguồn gốc.
- Chạy `openclaw plugins inspect <id> --runtime --json` cho từng Plugin nghi ngờ và
  so sánh `channels`, `channelConfigs`, `tools` và chẩn đoán.
- Chạy `openclaw plugins registry --refresh` sau khi cài đặt hoặc xóa
  các package Plugin để metadata đã lưu phản ánh bản cài hiện tại.
- Khởi động lại Gateway sau khi thay đổi cài đặt, registry hoặc cấu hình.

Các lựa chọn khắc phục:

- Nếu một Plugin cố ý thay thế Plugin khác cho cùng id kênh, Plugin
  được ưu tiên nên khai báo `channelConfigs.<channel-id>.preferOver` với
  id Plugin có độ ưu tiên thấp hơn. Xem [/plugins/manifest#replacing-another-channel-plugin](/vi/plugins/manifest#replacing-another-channel-plugin).
- Nếu trùng lặp là vô tình, hãy tắt một bên bằng
  `plugins.entries.<plugin-id>.enabled: false` hoặc xóa bản cài Plugin
  cũ.
- Nếu bạn đã bật tường minh cả hai Plugin, OpenClaw sẽ giữ yêu cầu đó và
  báo cáo xung đột. Chọn một chủ sở hữu cho kênh hoặc đổi tên các công cụ thuộc sở hữu Plugin
  để bề mặt runtime không mơ hồ.

## Vị trí Plugin (danh mục độc quyền)

Một số danh mục là độc quyền (mỗi lần chỉ có một danh mục hoạt động):

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

| Vị trí            | Điều nó kiểm soát      | Mặc định             |
| --------------- | --------------------- | ------------------- |
| `memory`        | Plugin bộ nhớ chủ động  | `memory-core`       |
| `contextEngine` | Công cụ ngữ cảnh chủ động | `legacy` (tích hợp) |

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

openclaw plugins install <package>         # install from npm by default
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

Các plugin đi kèm được phát hành cùng OpenClaw. Nhiều plugin được bật theo mặc định (ví dụ
các nhà cung cấp mô hình đi kèm, các nhà cung cấp giọng nói đi kèm và plugin trình duyệt
đi kèm). Các plugin đi kèm khác vẫn cần `openclaw plugins enable <id>`.

`--force` ghi đè một plugin hoặc gói hook đã cài đặt hiện có ngay tại chỗ. Dùng
`openclaw plugins update <id-or-npm-spec>` cho các lần nâng cấp thường kỳ của các plugin npm
được theo dõi. Tùy chọn này không được hỗ trợ với `--link`, vốn tái sử dụng đường dẫn nguồn thay vì
sao chép đè lên một đích cài đặt được quản lý.

Khi `plugins.allow` đã được đặt, `openclaw plugins install` thêm id plugin
đã cài đặt vào danh sách cho phép đó trước khi bật plugin. Nếu cùng id plugin đó
có trong `plugins.deny`, quá trình cài đặt sẽ xóa mục chặn cũ đó để
lần cài đặt rõ ràng có thể được tải ngay sau khi khởi động lại.

OpenClaw giữ một registry plugin cục bộ được lưu bền vững làm mô hình đọc lạnh cho
kho plugin, quyền sở hữu đóng góp và lập kế hoạch khởi động. Các luồng cài đặt, cập nhật,
gỡ cài đặt, bật và tắt sẽ làm mới registry đó sau khi thay đổi trạng thái plugin. Cùng tệp `plugins/installs.json` lưu metadata cài đặt bền vững trong
`installRecords` cấp cao nhất và metadata manifest có thể dựng lại trong `plugins`. Nếu
registry bị thiếu, cũ hoặc không hợp lệ, `openclaw plugins registry
--refresh` dựng lại góc nhìn manifest của nó từ bản ghi cài đặt, chính sách cấu hình và
metadata manifest/package mà không tải các module runtime của plugin.
`openclaw plugins update <id-or-npm-spec>` áp dụng cho các bản cài đặt được theo dõi. Khi truyền
một spec package npm với dist-tag hoặc phiên bản chính xác, lệnh sẽ phân giải tên package
ngược lại bản ghi plugin được theo dõi và ghi lại spec mới cho các lần cập nhật sau.
Truyền tên package không kèm phiên bản sẽ đưa một bản cài đặt được ghim chính xác trở lại
dòng phát hành mặc định của registry. Nếu plugin npm đã cài đặt đã khớp
phiên bản được phân giải và danh tính artifact đã ghi, OpenClaw bỏ qua cập nhật
mà không tải xuống, cài đặt lại hoặc ghi lại cấu hình.
Khi `openclaw update` chạy trên kênh beta, các bản ghi plugin npm và ClawHub
thuộc dòng mặc định sẽ thử `@beta` trước và quay về default/latest khi không có bản phát hành
beta cho plugin. Các phiên bản chính xác và tag rõ ràng vẫn được ghim.

`--pin` chỉ dành cho npm. Tùy chọn này không được hỗ trợ với `--marketplace`, vì
các bản cài đặt marketplace lưu metadata nguồn marketplace thay vì một spec npm.

`--dangerously-force-unsafe-install` là ghi đè khẩn cấp cho các cảnh báo dương tính giả
từ trình quét mã nguy hiểm tích hợp. Nó cho phép các lượt cài đặt plugin
và cập nhật plugin tiếp tục vượt qua các phát hiện `critical` tích hợp, nhưng vẫn
không bỏ qua các chặn chính sách `before_install` của plugin hoặc chặn do lỗi quét.
Các lượt quét cài đặt bỏ qua các tệp và thư mục kiểm thử phổ biến như `tests/`,
`__tests__/`, `*.test.*` và `*.spec.*` để tránh chặn các mock kiểm thử được đóng gói;
các entrypoint runtime đã khai báo của plugin vẫn được quét ngay cả khi chúng dùng một trong
những tên đó.

Cờ CLI này chỉ áp dụng cho các luồng cài đặt/cập nhật plugin. Các lượt cài đặt
phụ thuộc skill dựa trên Gateway dùng ghi đè yêu cầu `dangerouslyForceUnsafeInstall`
tương ứng, trong khi `openclaw skills install` vẫn là luồng tải xuống/cài đặt
skill ClawHub riêng biệt.

Nếu một plugin bạn đã xuất bản trên ClawHub bị ẩn hoặc bị chặn bởi một lượt quét, hãy mở
bảng điều khiển ClawHub hoặc chạy `clawhub package rescan <name>` để yêu cầu ClawHub kiểm tra
lại. `--dangerously-force-unsafe-install` chỉ ảnh hưởng đến các lượt cài đặt trên máy của bạn;
nó không yêu cầu ClawHub quét lại plugin hoặc công khai một bản phát hành bị chặn.

Các bundle tương thích tham gia cùng luồng liệt kê/kiểm tra/bật/tắt plugin.
Hỗ trợ runtime hiện tại bao gồm Skills trong bundle, command-skills của Claude,
mặc định `settings.json` của Claude, mặc định `lspServers` được khai báo trong
`.lsp.json` và manifest của Claude, command-skills của Cursor và các thư mục hook
Codex tương thích.

`openclaw plugins inspect <id>` cũng báo cáo các khả năng bundle được phát hiện cùng
các mục máy chủ MCP và LSP được hỗ trợ hoặc không được hỗ trợ cho các plugin dựa trên bundle.

Nguồn marketplace có thể là tên marketplace đã biết của Claude từ
`~/.claude/plugins/known_marketplaces.json`, root marketplace cục bộ hoặc đường dẫn
`marketplace.json`, cách viết tắt GitHub như `owner/repo`, URL repo GitHub,
hoặc URL git. Với marketplace từ xa, các mục plugin phải nằm bên trong repo
marketplace đã clone và chỉ dùng nguồn đường dẫn tương đối.

Xem [tham chiếu CLI `openclaw plugins`](/vi/cli/plugins) để biết đầy đủ chi tiết.

## Tổng quan API Plugin

Các plugin native xuất một đối tượng entry cung cấp `register(api)`. Các
plugin cũ hơn vẫn có thể dùng `activate(api)` làm alias kế thừa, nhưng các plugin mới nên
dùng `register`.

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

OpenClaw tải đối tượng entry và gọi `register(api)` trong quá trình kích hoạt plugin.
Loader vẫn quay về `activate(api)` cho các plugin cũ hơn,
nhưng các plugin đi kèm và plugin bên ngoài mới nên xem `register` là
hợp đồng công khai.

`api.registrationMode` cho plugin biết lý do entry của nó đang được tải:

| Chế độ          | Ý nghĩa                                                                                                                          |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | Kích hoạt runtime. Đăng ký công cụ, hook, dịch vụ, lệnh, route và các hiệu ứng phụ sống khác.                              |
| `discovery`     | Khám phá khả năng chỉ đọc. Đăng ký nhà cung cấp và metadata; mã entry plugin đáng tin cậy có thể tải, nhưng bỏ qua các hiệu ứng phụ sống. |
| `setup-only`    | Tải metadata thiết lập kênh thông qua một entry thiết lập nhẹ.                                                                |
| `setup-runtime` | Tải thiết lập kênh cũng cần entry runtime.                                                                         |
| `cli-metadata`  | Chỉ thu thập metadata lệnh CLI.                                                                                            |

Các entry plugin mở socket, cơ sở dữ liệu, worker nền hoặc client sống lâu
nên bảo vệ các hiệu ứng phụ đó bằng `api.registrationMode === "full"`.
Các lượt tải khám phá được lưu cache riêng với các lượt tải kích hoạt và không thay thế
registry Gateway đang chạy. Khám phá là không kích hoạt, không phải không import:
OpenClaw có thể đánh giá entry plugin đáng tin cậy hoặc module plugin kênh để xây dựng
snapshot. Giữ phần cấp cao nhất của module nhẹ và không có hiệu ứng phụ, đồng thời chuyển
client mạng, tiến trình con, listener, lượt đọc credential và khởi động dịch vụ
ra sau các đường dẫn full-runtime.

Các phương thức đăng ký phổ biến:

| Phương thức                              | Nội dung đăng ký              |
| --------------------------------------- | ----------------------------- |
| `registerProvider`                      | Nhà cung cấp mô hình (LLM)    |
| `registerChannel`                       | Kênh chat                     |
| `registerTool`                          | Công cụ agent                 |
| `registerHook` / `on(...)`              | Hook vòng đời                 |
| `registerSpeechProvider`                | Chuyển văn bản thành giọng nói / STT |
| `registerRealtimeTranscriptionProvider` | STT truyền phát               |
| `registerRealtimeVoiceProvider`         | Giọng nói realtime song công  |
| `registerMediaUnderstandingProvider`    | Phân tích hình ảnh/âm thanh   |
| `registerImageGenerationProvider`       | Tạo hình ảnh                  |
| `registerMusicGenerationProvider`       | Tạo nhạc                      |
| `registerVideoGenerationProvider`       | Tạo video                     |
| `registerWebFetchProvider`              | Nhà cung cấp web fetch / scrape |
| `registerWebSearchProvider`             | Tìm kiếm web                  |
| `registerHttpRoute`                     | Endpoint HTTP                 |
| `registerCommand` / `registerCli`       | Lệnh CLI                      |
| `registerContextEngine`                 | Engine ngữ cảnh               |
| `registerService`                       | Dịch vụ nền                   |

Hành vi guard hook cho các hook vòng đời có kiểu:

- `before_tool_call`: `{ block: true }` là kết thúc; các handler có độ ưu tiên thấp hơn bị bỏ qua.
- `before_tool_call`: `{ block: false }` là không thao tác và không xóa một chặn trước đó.
- `before_install`: `{ block: true }` là kết thúc; các handler có độ ưu tiên thấp hơn bị bỏ qua.
- `before_install`: `{ block: false }` là không thao tác và không xóa một chặn trước đó.
- `message_sending`: `{ cancel: true }` là kết thúc; các handler có độ ưu tiên thấp hơn bị bỏ qua.
- `message_sending`: `{ cancel: false }` là không thao tác và không xóa một hủy trước đó.

App-server Codex native nối ngược các sự kiện công cụ Codex-native vào
bề mặt hook này. Plugin có thể chặn các công cụ Codex native thông qua `before_tool_call`,
quan sát kết quả thông qua `after_tool_call` và tham gia phê duyệt
`PermissionRequest` của Codex. Cầu nối chưa ghi lại các đối số công cụ Codex-native.
Ranh giới hỗ trợ runtime Codex chính xác nằm trong
[hợp đồng hỗ trợ Codex harness v1](/vi/plugins/codex-harness#v1-support-contract).

Để biết đầy đủ hành vi hook có kiểu, xem [tổng quan SDK](/vi/plugins/sdk-overview#hook-decision-semantics).

## Liên quan

- [Xây dựng plugin](/vi/plugins/building-plugins) — tạo plugin của riêng bạn
- [Bundle plugin](/vi/plugins/bundles) — khả năng tương thích bundle Codex/Claude/Cursor
- [Manifest plugin](/vi/plugins/manifest) — schema manifest
- [Đăng ký công cụ](/vi/plugins/building-plugins#registering-agent-tools) — thêm công cụ agent trong một plugin
- [Nội bộ plugin](/vi/plugins/architecture) — mô hình khả năng và pipeline tải
- [Plugin cộng đồng](/vi/plugins/community) — danh sách của bên thứ ba
