---
read_when:
    - Cài đặt hoặc cấu hình Plugin
    - Tìm hiểu quy tắc phát hiện và tải Plugin
    - Làm việc với các gói Plugin tương thích với Codex/Claude
sidebarTitle: Install and Configure
summary: Cài đặt, cấu hình và quản lý các Plugin OpenClaw
title: Plugin
x-i18n:
    generated_at: "2026-05-02T20:58:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: d553c917d9054f4cb5a244ffd0d749c37f6dde230a5887b6b71ba7cf39fcefe5
    source_path: tools/plugin.md
    workflow: 16
---

Các Plugin mở rộng OpenClaw bằng các năng lực mới: kênh, nhà cung cấp mô hình,
bộ khung agent, công cụ, Skills, giọng nói, phiên âm thời gian thực, thoại thời
gian thực, hiểu nội dung đa phương tiện, tạo hình ảnh, tạo video, fetch web, tìm
kiếm web, và nhiều hơn nữa. Một số Plugin là **cốt lõi** (được phát hành cùng OpenClaw), các Plugin khác
là **bên ngoài**. Hầu hết Plugin bên ngoài được phát hành và khám phá thông qua
[ClawHub](/vi/tools/clawhub). Npm vẫn được hỗ trợ cho cài đặt trực tiếp và cho một
tập tạm thời các gói Plugin do OpenClaw sở hữu trong khi quá trình di chuyển đó hoàn tất.

## Bắt đầu nhanh

Để xem ví dụ cài đặt, liệt kê, gỡ cài đặt, cập nhật và phát hành có thể sao chép-dán, hãy xem
[Quản lý Plugin](/vi/plugins/manage-plugins).

<Steps>
  <Step title="Xem những gì đang được tải">
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

  <Step title="Quản lý trực tiếp qua chat">
    Trong một Gateway đang chạy, `/plugins enable` và `/plugins disable` chỉ dành cho chủ sở hữu
    sẽ kích hoạt trình tải lại cấu hình Gateway. Gateway tải lại các bề mặt runtime
    của Plugin trong tiến trình, và các lượt agent mới dựng lại danh sách công cụ từ
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

    Dùng `--runtime` khi bạn cần chứng minh các công cụ, dịch vụ, phương thức Gateway,
    hook hoặc lệnh CLI do Plugin sở hữu đã được đăng ký. `inspect` thông thường là một
    kiểm tra manifest/registry lạnh và cố ý tránh import runtime của Plugin.

  </Step>
</Steps>

Nếu bạn thích điều khiển trực tiếp qua chat, hãy bật `commands.plugins: true` và dùng:

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

Đường dẫn cài đặt dùng cùng resolver như CLI: đường dẫn/archive cục bộ, `clawhub:<pkg>`
tường minh, `npm:<pkg>` tường minh, `git:<repo>` tường minh, hoặc đặc tả gói trần
thông qua npm.

Nếu cấu hình không hợp lệ, quá trình cài đặt thường sẽ fail closed và chỉ bạn đến
`openclaw doctor --fix`. Ngoại lệ khôi phục duy nhất là một đường dẫn cài đặt lại
Plugin được đóng gói kèm có phạm vi hẹp cho các Plugin chọn tham gia
`openclaw.install.allowInvalidConfigRecovery`.
Trong khi khởi động Gateway, cấu hình không hợp lệ của một Plugin được cô lập trong chính Plugin đó:
quá trình khởi động ghi log vấn đề `plugins.entries.<id>.config`, bỏ qua Plugin đó trong khi
tải, và giữ các Plugin cũng như kênh khác online. Chạy `openclaw doctor --fix`
để cách ly cấu hình Plugin lỗi bằng cách vô hiệu hóa mục Plugin đó và xóa
payload cấu hình không hợp lệ của nó; bản sao lưu cấu hình thông thường giữ lại các giá trị trước đó.
Khi cấu hình kênh tham chiếu đến một Plugin không còn có thể khám phá nhưng
cùng id Plugin cũ vẫn còn trong cấu hình Plugin hoặc bản ghi cài đặt, quá trình khởi động Gateway
ghi log cảnh báo và bỏ qua kênh đó thay vì chặn mọi kênh khác.
Chạy `openclaw doctor --fix` để xóa các mục kênh/Plugin cũ; các khóa
kênh không xác định không có bằng chứng Plugin cũ vẫn fail validation để lỗi gõ nhầm vẫn
hiển thị.
Nếu `plugins.enabled: false` được đặt, các tham chiếu Plugin cũ được xem là bất hoạt:
quá trình khởi động Gateway bỏ qua công việc khám phá/tải Plugin và `openclaw doctor` giữ lại
cấu hình Plugin đã tắt thay vì tự động xóa nó. Hãy bật lại Plugin trước khi
chạy dọn dẹp doctor nếu bạn muốn xóa các id Plugin cũ.

Việc cài đặt dependency của Plugin chỉ diễn ra trong các luồng cài đặt/cập nhật rõ ràng hoặc
sửa chữa bằng doctor. Khởi động Gateway, tải lại cấu hình, và kiểm tra runtime không
chạy trình quản lý gói hay sửa cây dependency. Plugin cục bộ phải đã
cài đặt sẵn các dependency của chúng, trong khi Plugin npm, git và ClawHub được
cài dưới các gốc Plugin do OpenClaw quản lý. Dependency npm có thể được hoist
trong gốc npm do OpenClaw quản lý; cài đặt/cập nhật quét gốc được quản lý đó trước
khi tin cậy và gỡ cài đặt sẽ xóa các gói do npm quản lý thông qua npm. Plugin bên ngoài
và đường dẫn tải tùy chỉnh vẫn phải được cài qua `openclaw plugins install`.
Dùng `openclaw plugins list --json` để xem `dependencyStatus` tĩnh cho từng
Plugin hiển thị mà không import mã runtime hay sửa dependency.
Xem [Phân giải dependency của Plugin](/vi/plugins/dependency-resolution) để biết vòng đời
tại thời điểm cài đặt.

Các checkout mã nguồn là pnpm workspaces. Nếu bạn clone OpenClaw để chỉnh sửa các
Plugin được đóng gói kèm, hãy chạy `pnpm install`; sau đó OpenClaw tải các Plugin được đóng gói kèm từ
`extensions/<id>` để các chỉnh sửa và dependency cục bộ của gói được dùng trực tiếp.
Cài đặt gốc npm thông thường dành cho OpenClaw đã đóng gói, không phải phát triển
trên checkout mã nguồn.

## Loại Plugin

OpenClaw nhận diện hai định dạng Plugin:

| Định dạng | Cách hoạt động | Ví dụ |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **Gốc** | `openclaw.plugin.json` + mô-đun runtime; thực thi trong cùng tiến trình | Plugin chính thức, gói npm cộng đồng |
| **Gói** | Bố cục tương thích Codex/Claude/Cursor; được ánh xạ sang tính năng OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Cả hai đều xuất hiện trong `openclaw plugins list`. Xem [Gói Plugin](/vi/plugins/bundles) để biết chi tiết về gói.

Nếu bạn đang viết một Plugin gốc, hãy bắt đầu với [Xây dựng Plugin](/vi/plugins/building-plugins)
và [Tổng quan Plugin SDK](/vi/plugins/sdk-overview).

## Entry point của gói

Các gói npm Plugin gốc phải khai báo `openclaw.extensions` trong `package.json`.
Mỗi mục phải nằm bên trong thư mục gói và phân giải tới một tệp runtime có thể đọc,
hoặc tới một tệp nguồn TypeScript với tệp JavaScript đã build ngang hàng được suy luận
chẳng hạn như `src/index.ts` tới `dist/index.js`.

Dùng `openclaw.runtimeExtensions` khi các tệp runtime đã phát hành không nằm ở
cùng đường dẫn với các mục nguồn. Khi có mặt, `runtimeExtensions` phải chứa
chính xác một mục cho mỗi mục `extensions`. Danh sách không khớp sẽ làm fail cài đặt và
khám phá Plugin thay vì âm thầm fallback về đường dẫn nguồn. Nếu bạn cũng
phát hành `openclaw.setupEntry`, hãy dùng `openclaw.runtimeSetupEntry` cho tệp
JavaScript đã build ngang hàng của nó; tệp đó là bắt buộc khi được khai báo.

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
đã đóng gói hiện tại đã gói kèm nhiều Plugin chính thức, vì vậy chúng không cần
cài npm riêng trong các thiết lập thông thường. Cho đến khi mọi Plugin do OpenClaw sở hữu đã
di chuyển sang ClawHub, OpenClaw vẫn phát hành một số gói Plugin `@openclaw/*` trên
npm cho các cài đặt cũ/tùy chỉnh và quy trình npm trực tiếp.

Nếu npm báo một gói Plugin `@openclaw/*` là deprecated, phiên bản gói đó
đến từ một chuỗi gói bên ngoài cũ hơn. Dùng Plugin được đóng gói kèm từ
OpenClaw hiện tại hoặc một checkout cục bộ cho đến khi gói npm mới hơn được phát hành.

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

### Cốt lõi (được phát hành cùng OpenClaw)

<AccordionGroup>
  <Accordion title="Nhà cung cấp mô hình (được bật theo mặc định)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Plugin bộ nhớ">
    - `memory-core` — tìm kiếm bộ nhớ được đóng gói kèm (mặc định qua `plugins.slots.memory`)
    - `memory-lancedb` — bộ nhớ dài hạn dựa trên LanceDB với tự động recall/capture (đặt `plugins.slots.memory = "memory-lancedb"`)

    Xem [Memory LanceDB](/vi/plugins/memory-lancedb) để biết thiết lập embedding tương thích OpenAI,
    ví dụ Ollama, giới hạn recall, và khắc phục sự cố.

  </Accordion>

  <Accordion title="Nhà cung cấp giọng nói (được bật theo mặc định)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Khác">
    - `browser` — Plugin trình duyệt được đóng gói kèm cho công cụ trình duyệt, CLI `openclaw browser`, phương thức Gateway `browser.request`, runtime trình duyệt, và dịch vụ điều khiển trình duyệt mặc định (được bật theo mặc định; tắt trước khi thay thế)
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

| Trường | Mô tả |
| ---------------- | --------------------------------------------------------- |
| `enabled` | Công tắc chính (mặc định: `true`) |
| `allow` | Danh sách cho phép Plugin (tùy chọn) |
| `deny` | Danh sách chặn Plugin (tùy chọn; chặn được ưu tiên) |
| `load.paths` | Tệp/thư mục Plugin bổ sung |
| `slots` | Bộ chọn slot độc quyền (ví dụ `memory`, `contextEngine`) |
| `entries.\<id\>` | Bật/tắt + cấu hình theo từng Plugin |

`plugins.allow` là độc quyền. Khi nó không rỗng, chỉ các Plugin được liệt kê mới có thể tải
hoặc expose công cụ, ngay cả khi `tools.allow` chứa `"*"` hoặc một tên công cụ cụ thể
do Plugin sở hữu. Nếu danh sách cho phép công cụ tham chiếu tới công cụ của Plugin, hãy thêm các id Plugin sở hữu
vào `plugins.allow` hoặc xóa `plugins.allow`; `openclaw doctor` cảnh báo về
hình dạng này.

Các thay đổi cấu hình được thực hiện qua `/plugins enable` hoặc `/plugins disable` kích hoạt tải lại plugin Gateway ngay trong tiến trình. Các lượt tác nhân mới xây dựng lại danh sách công cụ của chúng từ registry plugin đã được làm mới. Các thao tác thay đổi nguồn như cài đặt, cập nhật và gỡ cài đặt vẫn khởi động lại tiến trình Gateway vì các mô-đun plugin đã được nhập không thể được thay thế tại chỗ một cách an toàn.

`openclaw plugins list` là ảnh chụp registry/cấu hình plugin cục bộ. Một plugin `enabled` ở đó có nghĩa là registry đã lưu và cấu hình hiện tại cho phép plugin tham gia. Điều đó không chứng minh rằng một Gateway từ xa đang chạy đã tải lại hoặc khởi động lại vào cùng mã plugin. Trên các thiết lập VPS/container có tiến trình wrapper, hãy gửi lệnh khởi động lại hoặc các ghi cấu hình kích hoạt tải lại đến đúng tiến trình `openclaw gateway run`, hoặc dùng `openclaw gateway restart` với Gateway đang chạy khi báo cáo tải lại cho biết có lỗi.

<Accordion title="Trạng thái plugin: bị tắt so với thiếu so với không hợp lệ">
  - **Bị tắt**: plugin tồn tại nhưng các quy tắc bật đã tắt nó. Cấu hình được giữ nguyên.
  - **Thiếu**: cấu hình tham chiếu đến một id plugin mà discovery không tìm thấy.
  - **Không hợp lệ**: plugin tồn tại nhưng cấu hình của nó không khớp với schema đã khai báo. Khởi động Gateway chỉ bỏ qua plugin đó; `openclaw doctor --fix` có thể cách ly mục không hợp lệ bằng cách tắt nó và xóa payload cấu hình của nó.

</Accordion>

## Discovery và thứ tự ưu tiên

OpenClaw quét plugin theo thứ tự này (kết quả khớp đầu tiên sẽ thắng):

<Steps>
  <Step title="Đường dẫn cấu hình">
    `plugins.load.paths` — đường dẫn tệp hoặc thư mục tường minh. Các đường dẫn trỏ
    ngược về những thư mục plugin đóng gói đi kèm của chính OpenClaw sẽ bị bỏ qua;
    chạy `openclaw doctor --fix` để xóa các alias lỗi thời đó.
  </Step>

  <Step title="Plugin workspace">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` và `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Plugin toàn cục">
    `~/.openclaw/<plugin-root>/*.ts` và `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Plugin đi kèm">
    Được phát hành cùng OpenClaw. Nhiều plugin được bật theo mặc định (nhà cung cấp mô hình, giọng nói).
    Các plugin khác yêu cầu bật tường minh.
  </Step>
</Steps>

Các bản cài đặt đóng gói và Docker image thường phân giải plugin đi kèm từ cây
`dist/extensions` đã biên dịch. Nếu một thư mục nguồn plugin đi kèm được
bind-mount đè lên đường dẫn nguồn đóng gói tương ứng, ví dụ
`/app/extensions/synology-chat`, OpenClaw coi thư mục nguồn đã mount đó
là một lớp phủ nguồn đi kèm và phát hiện nó trước bundle
`/app/dist/extensions/synology-chat` đã đóng gói. Điều này giúp các vòng lặp
container của maintainer hoạt động mà không phải chuyển mọi plugin đi kèm về lại nguồn TypeScript.
Đặt `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1` để buộc dùng các bundle dist đã đóng gói
ngay cả khi có mount lớp phủ nguồn.

### Quy tắc bật

- `plugins.enabled: false` tắt tất cả plugin và bỏ qua việc discovery/load plugin
- `plugins.deny` luôn thắng allow
- `plugins.entries.\<id\>.enabled: false` tắt plugin đó
- Plugin có nguồn gốc từ workspace **bị tắt theo mặc định** (phải được bật tường minh)
- Plugin đi kèm tuân theo tập mặc định bật sẵn tích hợp, trừ khi bị ghi đè
- Các slot độc quyền có thể buộc bật plugin được chọn cho slot đó
- Một số plugin đi kèm dạng chọn tham gia được bật tự động khi cấu hình đặt tên một
  bề mặt do plugin sở hữu, chẳng hạn như tham chiếu mô hình provider, cấu hình kênh, hoặc runtime
  harness
- Cấu hình plugin lỗi thời được giữ nguyên trong khi `plugins.enabled: false` đang hoạt động;
  hãy bật lại plugin trước khi chạy dọn dẹp doctor nếu bạn muốn xóa các id lỗi thời
- Các tuyến Codex thuộc họ OpenAI giữ ranh giới plugin riêng:
  `openai-codex/*` thuộc về plugin OpenAI, trong khi plugin app-server Codex
  đi kèm được chọn bởi `agentRuntime.id: "codex"` hoặc các tham chiếu mô hình
  `codex/*` cũ

## Khắc phục sự cố runtime hook

Nếu một plugin xuất hiện trong `plugins list` nhưng hiệu ứng phụ hoặc hook
`register(api)` không chạy trong lưu lượng chat trực tiếp, hãy kiểm tra các mục này trước:

- Chạy `openclaw gateway status --deep --require-rpc` và xác nhận URL Gateway,
  profile, đường dẫn cấu hình và tiến trình đang hoạt động là những thứ bạn đang chỉnh sửa.
- Khởi động lại Gateway trực tiếp sau thay đổi cài đặt/cấu hình/mã plugin. Trong các container
  wrapper, PID 1 có thể chỉ là supervisor; hãy khởi động lại hoặc gửi signal cho tiến trình con
  `openclaw gateway run`.
- Dùng `openclaw plugins inspect <id> --runtime --json` để xác nhận các đăng ký hook và
  chẩn đoán. Các hook hội thoại không đi kèm như `llm_input`,
  `llm_output`, `before_agent_finalize` và `agent_end` cần
  `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- Để chuyển mô hình, ưu tiên `before_model_resolve`. Nó chạy trước bước phân giải mô hình
  cho các lượt tác nhân; `llm_output` chỉ chạy sau khi một lần thử mô hình
  tạo ra đầu ra assistant.
- Để chứng minh mô hình phiên hiệu lực, dùng `openclaw sessions` hoặc các bề mặt
  phiên/trạng thái Gateway và, khi gỡ lỗi payload provider, khởi động
  Gateway với `--raw-stream --raw-stream-path <path>`.

### Thiết lập công cụ plugin chậm

Nếu các lượt tác nhân có vẻ bị kẹt khi chuẩn bị công cụ, hãy bật trace logging và
kiểm tra các dòng thời gian factory công cụ plugin:

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

Tìm:

```text
[trace:plugin-tools] factory timings ...
```

Tóm tắt liệt kê tổng thời gian factory và các factory công cụ plugin chậm nhất,
bao gồm id plugin, tên công cụ đã khai báo, hình dạng kết quả và công cụ đó có
tùy chọn hay không. Các dòng chậm được nâng lên thành cảnh báo khi một factory đơn lẻ mất
ít nhất 1s hoặc tổng thời gian chuẩn bị factory công cụ plugin mất ít nhất 5s.

OpenClaw lưu cache các kết quả factory công cụ plugin thành công cho các lần phân giải lặp lại
với cùng ngữ cảnh yêu cầu hiệu lực. Khóa cache bao gồm cấu hình runtime hiệu lực,
workspace, id tác nhân/phiên, chính sách sandbox, cài đặt trình duyệt,
ngữ cảnh phân phối, danh tính requester và trạng thái quyền sở hữu, vì vậy các factory
phụ thuộc vào những trường đáng tin cậy đó sẽ được chạy lại khi ngữ cảnh thay đổi.

Nếu một plugin chiếm phần lớn thời gian, hãy kiểm tra các đăng ký runtime của nó:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

Sau đó cập nhật, cài đặt lại hoặc tắt plugin đó. Tác giả plugin nên chuyển việc
tải dependency tốn kém ra sau đường dẫn thực thi công cụ thay vì thực hiện bên trong
factory công cụ.

### Quyền sở hữu kênh hoặc công cụ trùng lặp

Triệu chứng:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

Những thông báo này có nghĩa là có hơn một plugin đã bật đang cố sở hữu cùng một kênh,
luồng thiết lập hoặc tên công cụ. Nguyên nhân phổ biến nhất là một plugin kênh bên ngoài
được cài cạnh một plugin đi kèm hiện đã cung cấp cùng id kênh.

Các bước gỡ lỗi:

- Chạy `openclaw plugins list --enabled --verbose` để xem mọi plugin đã bật
  và nguồn gốc.
- Chạy `openclaw plugins inspect <id> --runtime --json` cho từng plugin nghi ngờ và
  so sánh `channels`, `channelConfigs`, `tools` và chẩn đoán.
- Chạy `openclaw plugins registry --refresh` sau khi cài đặt hoặc gỡ bỏ
  các gói plugin để metadata đã lưu phản ánh bản cài hiện tại.
- Khởi động lại Gateway sau thay đổi cài đặt, registry hoặc cấu hình.

Tùy chọn sửa:

- Nếu một plugin cố ý thay thế plugin khác cho cùng id kênh, plugin được ưu tiên
  nên khai báo `channelConfigs.<channel-id>.preferOver` với id plugin có mức ưu tiên thấp hơn.
  Xem [/plugins/manifest#replacing-another-channel-plugin](/vi/plugins/manifest#replacing-another-channel-plugin).
- Nếu trùng lặp là ngoài ý muốn, hãy tắt một bên bằng
  `plugins.entries.<plugin-id>.enabled: false` hoặc gỡ bản cài plugin lỗi thời.
- Nếu bạn đã bật tường minh cả hai plugin, OpenClaw giữ yêu cầu đó và
  báo cáo xung đột. Hãy chọn một chủ sở hữu cho kênh hoặc đổi tên các công cụ do plugin sở hữu
  để bề mặt runtime không mơ hồ.

## Slot plugin (danh mục độc quyền)

Một số danh mục là độc quyền (mỗi lần chỉ một cái hoạt động):

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

| Slot            | Nội dung kiểm soát        | Mặc định            |
| --------------- | ------------------------- | ------------------- |
| `memory`        | Plugin active memory      | `memory-core`       |
| `contextEngine` | Context engine hoạt động  | `legacy` (tích hợp) |

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

Plugin đi kèm được phát hành cùng OpenClaw. Nhiều plugin được bật theo mặc định (ví dụ
nhà cung cấp mô hình đi kèm, nhà cung cấp giọng nói đi kèm và plugin trình duyệt
đi kèm). Các plugin đi kèm khác vẫn cần `openclaw plugins enable <id>`.

`--force` ghi đè tại chỗ một plugin đã cài hoặc hook pack hiện có. Dùng
`openclaw plugins update <id-or-npm-spec>` cho các nâng cấp định kỳ của plugin npm
được theo dõi. Lệnh này không được hỗ trợ cùng `--link`, vốn tái sử dụng đường dẫn nguồn thay vì
sao chép đè lên một đích cài đặt được quản lý.

Khi `plugins.allow` đã được đặt, `openclaw plugins install` thêm id plugin
đã cài vào allowlist đó trước khi bật nó. Nếu cùng id plugin đó
có trong `plugins.deny`, thao tác cài đặt sẽ xóa mục deny lỗi thời đó để
bản cài tường minh có thể được tải ngay sau khi khởi động lại.

OpenClaw giữ một registry Plugin cục bộ được lưu bền vững làm mô hình đọc lạnh cho
kho Plugin, quyền sở hữu đóng góp và lập kế hoạch khởi động. Các luồng cài đặt, cập nhật,
gỡ cài đặt, bật và tắt sẽ làm mới registry đó sau khi thay đổi trạng thái Plugin.
Cùng một tệp `plugins/installs.json` giữ siêu dữ liệu cài đặt bền vững trong
`installRecords` cấp cao nhất và siêu dữ liệu manifest có thể dựng lại trong `plugins`. Nếu
registry bị thiếu, lỗi thời hoặc không hợp lệ, `openclaw plugins registry
--refresh` dựng lại phần xem manifest từ bản ghi cài đặt, chính sách cấu hình và
siêu dữ liệu manifest/package mà không tải các mô-đun runtime của Plugin.
`openclaw plugins update <id-or-npm-spec>` áp dụng cho các bản cài đặt được theo dõi. Truyền
một spec package npm có dist-tag hoặc phiên bản chính xác sẽ phân giải tên package
ngược về bản ghi Plugin được theo dõi và ghi lại spec mới cho các lần cập nhật sau.
Truyền tên package không có phiên bản sẽ đưa một bản cài đặt được ghim chính xác
trở lại dòng phát hành mặc định của registry. Nếu Plugin npm đã cài đặt đã khớp
với phiên bản đã phân giải và danh tính artifact đã ghi, OpenClaw bỏ qua bản cập nhật
mà không tải xuống, cài đặt lại hoặc ghi lại cấu hình.
Khi `openclaw update` chạy trên kênh beta, các bản ghi Plugin npm và ClawHub
theo dòng mặc định sẽ thử `@beta` trước và quay lại mặc định/mới nhất khi không có
bản phát hành beta cho Plugin. Các phiên bản chính xác và thẻ tường minh vẫn được ghim.

`--pin` chỉ dành cho npm. Nó không được hỗ trợ với `--marketplace`, vì
các bản cài đặt marketplace lưu bền vững siêu dữ liệu nguồn marketplace thay vì spec npm.

`--dangerously-force-unsafe-install` là một tùy chọn ghi đè khẩn cấp cho các kết quả
dương tính giả từ trình quét mã nguy hiểm tích hợp sẵn. Nó cho phép các bản cài đặt
Plugin và cập nhật Plugin tiếp tục vượt qua các phát hiện `critical` tích hợp sẵn,
nhưng vẫn không bỏ qua các chặn chính sách `before_install` của Plugin hoặc chặn do lỗi quét.
Các lượt quét cài đặt bỏ qua các tệp và thư mục kiểm thử phổ biến như `tests/`,
`__tests__/`, `*.test.*` và `*.spec.*` để tránh chặn các mock kiểm thử đã đóng gói;
các entrypoint runtime đã khai báo của Plugin vẫn được quét ngay cả khi chúng dùng một trong
những tên đó.

Cờ CLI này chỉ áp dụng cho các luồng cài đặt/cập nhật Plugin. Các bản cài đặt phụ thuộc
Skills dựa trên Gateway dùng ghi đè yêu cầu `dangerouslyForceUnsafeInstall` tương ứng
thay vào đó, trong khi `openclaw skills install` vẫn là luồng tải xuống/cài đặt
Skills ClawHub riêng biệt.

Nếu một Plugin bạn đã xuất bản trên ClawHub bị ẩn hoặc bị chặn bởi lượt quét, hãy mở
bảng điều khiển ClawHub hoặc chạy `clawhub package rescan <name>` để yêu cầu ClawHub kiểm tra
lại. `--dangerously-force-unsafe-install` chỉ ảnh hưởng đến các bản cài đặt trên máy của chính bạn;
nó không yêu cầu ClawHub quét lại Plugin hoặc công khai một bản phát hành bị chặn.

Các gói tương thích tham gia cùng một luồng liệt kê/kiểm tra/bật/tắt Plugin. Hỗ trợ runtime
hiện tại bao gồm Skills trong gói, command-skills Claude, mặc định `settings.json` của Claude,
mặc định `.lsp.json` của Claude và `lspServers` do manifest khai báo, command-skills Cursor,
và các thư mục hook Codex tương thích.

`openclaw plugins inspect <id>` cũng báo cáo các khả năng gói đã phát hiện cùng
các mục máy chủ MCP và LSP được hỗ trợ hoặc không được hỗ trợ cho các Plugin dựa trên gói.

Nguồn marketplace có thể là tên known-marketplace của Claude từ
`~/.claude/plugins/known_marketplaces.json`, một thư mục gốc marketplace cục bộ hoặc
đường dẫn `marketplace.json`, dạng viết tắt GitHub như `owner/repo`, URL repo GitHub,
hoặc URL git. Với marketplace từ xa, các mục Plugin phải nằm trong repo marketplace
đã clone và chỉ dùng nguồn đường dẫn tương đối.

Xem [tham chiếu CLI `openclaw plugins`](/vi/cli/plugins) để biết đầy đủ chi tiết.

## Tổng quan API Plugin

Các Plugin gốc export một đối tượng entry phơi bày `register(api)`. Các Plugin cũ hơn
vẫn có thể dùng `activate(api)` làm bí danh kế thừa, nhưng Plugin mới nên dùng
`register`.

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

OpenClaw tải đối tượng entry và gọi `register(api)` trong quá trình kích hoạt Plugin.
Loader vẫn rơi về `activate(api)` cho các Plugin cũ hơn, nhưng các Plugin đi kèm
và Plugin bên ngoài mới nên xem `register` là hợp đồng công khai.

`api.registrationMode` cho Plugin biết vì sao entry của nó đang được tải:

| Chế độ          | Ý nghĩa                                                                                                                          |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | Kích hoạt runtime. Đăng ký công cụ, hook, dịch vụ, lệnh, route và các hiệu ứng phụ đang hoạt động khác.                          |
| `discovery`     | Khám phá khả năng chỉ đọc. Đăng ký provider và siêu dữ liệu; mã entry Plugin tin cậy có thể được tải, nhưng bỏ qua hiệu ứng phụ đang hoạt động. |
| `setup-only`    | Tải siêu dữ liệu thiết lập kênh thông qua một entry thiết lập nhẹ.                                                                |
| `setup-runtime` | Tải thiết lập kênh cũng cần entry runtime.                                                                                       |
| `cli-metadata`  | Chỉ thu thập siêu dữ liệu lệnh CLI.                                                                                              |

Các entry Plugin mở socket, cơ sở dữ liệu, worker nền hoặc client sống lâu
nên bảo vệ các hiệu ứng phụ đó bằng `api.registrationMode === "full"`.
Các lượt tải khám phá được lưu đệm riêng với lượt tải kích hoạt và không thay thế
registry Gateway đang chạy. Khám phá là không kích hoạt, không phải không import:
OpenClaw có thể đánh giá entry Plugin tin cậy hoặc mô-đun Plugin kênh để xây dựng
snapshot. Giữ phần cấp cao nhất của mô-đun nhẹ và không có hiệu ứng phụ, đồng thời chuyển
client mạng, tiến trình con, listener, lượt đọc thông tin xác thực và khởi động dịch vụ
vào sau các đường dẫn full-runtime.

Các phương thức đăng ký phổ biến:

| Phương thức                             | Nội dung đăng ký             |
| --------------------------------------- | ---------------------------- |
| `registerProvider`                      | Provider mô hình (LLM)       |
| `registerChannel`                       | Kênh trò chuyện              |
| `registerTool`                          | Công cụ agent                |
| `registerHook` / `on(...)`              | Hook vòng đời                |
| `registerSpeechProvider`                | Chuyển văn bản thành giọng nói / STT |
| `registerRealtimeTranscriptionProvider` | STT truyền trực tiếp         |
| `registerRealtimeVoiceProvider`         | Giọng nói realtime hai chiều |
| `registerMediaUnderstandingProvider`    | Phân tích hình ảnh/âm thanh  |
| `registerImageGenerationProvider`       | Tạo hình ảnh                 |
| `registerMusicGenerationProvider`       | Tạo nhạc                     |
| `registerVideoGenerationProvider`       | Tạo video                    |
| `registerWebFetchProvider`              | Provider tìm nạp / scrape web |
| `registerWebSearchProvider`             | Tìm kiếm web                 |
| `registerHttpRoute`                     | Endpoint HTTP                |
| `registerCommand` / `registerCli`       | Lệnh CLI                     |
| `registerContextEngine`                 | Công cụ ngữ cảnh             |
| `registerService`                       | Dịch vụ nền                  |

Hành vi guard hook cho các hook vòng đời có kiểu:

- `before_tool_call`: `{ block: true }` là kết thúc; các handler có độ ưu tiên thấp hơn bị bỏ qua.
- `before_tool_call`: `{ block: false }` là không thao tác và không xóa một block trước đó.
- `before_install`: `{ block: true }` là kết thúc; các handler có độ ưu tiên thấp hơn bị bỏ qua.
- `before_install`: `{ block: false }` là không thao tác và không xóa một block trước đó.
- `message_sending`: `{ cancel: true }` là kết thúc; các handler có độ ưu tiên thấp hơn bị bỏ qua.
- `message_sending`: `{ cancel: false }` là không thao tác và không xóa một cancel trước đó.

Máy chủ ứng dụng Codex gốc chạy cầu nối các sự kiện công cụ Codex-native trở lại
bề mặt hook này. Plugin có thể chặn các công cụ Codex gốc thông qua `before_tool_call`,
quan sát kết quả thông qua `after_tool_call` và tham gia phê duyệt
`PermissionRequest` của Codex. Cầu nối chưa viết lại đối số công cụ Codex-native.
Ranh giới hỗ trợ runtime Codex chính xác nằm trong
[hợp đồng hỗ trợ Codex harness v1](/vi/plugins/codex-harness#v1-support-contract).

Để biết đầy đủ hành vi hook có kiểu, xem [tổng quan SDK](/vi/plugins/sdk-overview#hook-decision-semantics).

## Liên quan

- [Xây dựng Plugin](/vi/plugins/building-plugins) — tạo Plugin của riêng bạn
- [Gói Plugin](/vi/plugins/bundles) — khả năng tương thích gói Codex/Claude/Cursor
- [Manifest Plugin](/vi/plugins/manifest) — schema manifest
- [Đăng ký công cụ](/vi/plugins/building-plugins#registering-agent-tools) — thêm công cụ agent trong Plugin
- [Nội bộ Plugin](/vi/plugins/architecture) — mô hình khả năng và pipeline tải
- [Plugin cộng đồng](/vi/plugins/community) — danh sách của bên thứ ba
