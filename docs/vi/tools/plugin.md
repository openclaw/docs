---
read_when:
    - Cài đặt hoặc cấu hình Plugin
    - Tìm hiểu về quy tắc phát hiện và tải Plugin
    - Làm việc với các gói Plugin tương thích với Codex/Claude
sidebarTitle: Install and Configure
summary: Cài đặt, cấu hình và quản lý các Plugin OpenClaw
title: Plugin
x-i18n:
    generated_at: "2026-05-01T10:53:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1efa91ac4d78c6707a1e9e5cd5a5958642128a61b5873e169f66c7c2b954adb9
    source_path: tools/plugin.md
    workflow: 16
---

Các Plugin mở rộng OpenClaw với những khả năng mới: kênh, nhà cung cấp mô hình,
bộ khung agent, công cụ, Skills, giọng nói, phiên âm thời gian thực, giọng nói
thời gian thực, hiểu phương tiện, tạo hình ảnh, tạo video, tìm nạp web, tìm kiếm
web và nhiều khả năng khác. Một số Plugin là **lõi** (được phát hành kèm OpenClaw), số khác
là **bên ngoài**. Hầu hết Plugin bên ngoài được phát hành và khám phá thông qua
[ClawHub](/vi/tools/clawhub). Npm vẫn được hỗ trợ cho cài đặt trực tiếp và cho một
tập hợp tạm thời các gói Plugin do OpenClaw sở hữu trong khi quá trình di chuyển đó hoàn tất.

## Bắt đầu nhanh

<Steps>
  <Step title="See what is loaded">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="Install a plugin">
    ```bash
    # From npm
    openclaw plugins install npm:@acme/openclaw-plugin

    # From git
    openclaw plugins install git:github.com/acme/openclaw-plugin@v1.0.0

    # From a local directory or archive
    openclaw plugins install ./my-plugin
    openclaw plugins install ./my-plugin.tgz
    ```

  </Step>

  <Step title="Restart the Gateway">
    ```bash
    openclaw gateway restart
    ```

    Sau đó cấu hình trong `plugins.entries.\<id\>.config` trong tệp cấu hình của bạn.

  </Step>

  <Step title="Verify the plugin">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json

    # If the plugin registered a CLI root, run one command from that root.
    openclaw <plugin-command> --help
    ```

    Dùng `--runtime` khi bạn cần chứng minh các công cụ, dịch vụ, phương thức Gateway,
    hook hoặc lệnh CLI do Plugin sở hữu đã được đăng ký. `inspect` thuần túy là một kiểm tra
    manifest/registry lạnh và cố ý tránh nhập runtime của Plugin.

  </Step>
</Steps>

Nếu bạn thích điều khiển ngay trong chat, hãy bật `commands.plugins: true` và dùng:

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

Đường dẫn cài đặt dùng cùng trình phân giải như CLI: đường dẫn/kho lưu trữ cục bộ, rõ ràng
`clawhub:<pkg>`, rõ ràng `npm:<pkg>`, rõ ràng `git:<repo>`, hoặc đặc tả gói trần
(ClawHub trước, rồi đến npm dự phòng).

Nếu cấu hình không hợp lệ, cài đặt thường sẽ fail closed và chỉ bạn đến
`openclaw doctor --fix`. Ngoại lệ khôi phục duy nhất là một đường dẫn cài đặt lại hẹp cho Plugin
được đóng gói kèm, dành cho các Plugin chọn tham gia
`openclaw.install.allowInvalidConfigRecovery`.
Trong quá trình khởi động Gateway, cấu hình không hợp lệ của một Plugin được cô lập vào chính Plugin đó:
quá trình khởi động ghi log vấn đề `plugins.entries.<id>.config`, bỏ qua Plugin đó trong lúc
tải và giữ các Plugin cùng kênh khác trực tuyến. Chạy `openclaw doctor --fix`
để cách ly cấu hình Plugin lỗi bằng cách tắt mục Plugin đó và xóa
payload cấu hình không hợp lệ của nó; bản sao lưu cấu hình thông thường giữ lại các giá trị trước đó.
Khi cấu hình kênh tham chiếu đến một Plugin không còn khám phá được nhưng cùng
id Plugin cũ vẫn còn trong cấu hình Plugin hoặc bản ghi cài đặt, quá trình khởi động Gateway
ghi cảnh báo và bỏ qua kênh đó thay vì chặn mọi kênh khác.
Chạy `openclaw doctor --fix` để xóa các mục kênh/Plugin cũ; các khóa
kênh không xác định không có bằng chứng Plugin cũ vẫn fail validation để lỗi gõ nhầm vẫn
hiển thị.
Nếu đặt `plugins.enabled: false`, các tham chiếu Plugin cũ được xem là bất hoạt:
quá trình khởi động Gateway bỏ qua công việc khám phá/tải Plugin và `openclaw doctor` giữ lại
cấu hình Plugin đã tắt thay vì tự động xóa nó. Bật lại Plugin trước khi
chạy dọn dẹp bằng doctor nếu bạn muốn xóa các id Plugin cũ.

Các bản cài đặt OpenClaw đóng gói không háo hức cài đặt toàn bộ cây phụ thuộc
runtime của mọi Plugin được đóng gói kèm. Khi một Plugin do OpenClaw sở hữu được đóng gói kèm đang hoạt động từ
cấu hình Plugin, cấu hình kênh legacy hoặc manifest bật mặc định, quá trình khởi động
chỉ sửa các phụ thuộc runtime đã khai báo của Plugin đó trước khi nhập nó.
Chỉ riêng trạng thái xác thực kênh đã lưu không kích hoạt một kênh đóng gói kèm cho
việc sửa phụ thuộc runtime khi khởi động Gateway.
Việc tắt rõ ràng vẫn thắng: `plugins.entries.<id>.enabled: false`,
`plugins.deny`, `plugins.enabled: false` và `channels.<id>.enabled: false`
ngăn việc tự động sửa phụ thuộc runtime được đóng gói kèm cho Plugin/kênh đó.
`plugins.allow` không rỗng cũng giới hạn việc sửa phụ thuộc runtime được đóng gói kèm và bật mặc định;
việc bật rõ ràng kênh đóng gói kèm (`channels.<id>.enabled: true`) vẫn có thể
sửa các phụ thuộc Plugin của kênh đó.
Plugin bên ngoài và đường dẫn tải tùy chỉnh vẫn phải được cài đặt qua
`openclaw plugins install`.
Xem [Phân giải phụ thuộc Plugin](/vi/plugins/dependency-resolution) để biết đầy đủ
vòng đời lập kế hoạch và staging.

## Loại Plugin

OpenClaw nhận diện hai định dạng Plugin:

| Định dạng | Cách hoạt động | Ví dụ |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + mô-đun runtime; thực thi trong cùng tiến trình | Plugin chính thức, gói npm cộng đồng |
| **Bundle** | Bố cục tương thích Codex/Claude/Cursor; được ánh xạ sang tính năng OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Cả hai đều xuất hiện trong `openclaw plugins list`. Xem [Plugin Bundles](/vi/plugins/bundles) để biết chi tiết về bundle.

Nếu bạn đang viết một Plugin native, hãy bắt đầu với [Xây dựng Plugin](/vi/plugins/building-plugins)
và [Tổng quan Plugin SDK](/vi/plugins/sdk-overview).

## Điểm vào gói

Các gói npm Plugin native phải khai báo `openclaw.extensions` trong `package.json`.
Mỗi mục phải nằm trong thư mục gói và phân giải đến một tệp runtime có thể đọc,
hoặc đến một tệp nguồn TypeScript có tệp JavaScript đã build tương ứng được suy luận
chẳng hạn như `src/index.ts` đến `dist/index.js`.

Dùng `openclaw.runtimeExtensions` khi các tệp runtime đã phát hành không nằm ở
cùng đường dẫn với các mục nguồn. Khi có mặt, `runtimeExtensions` phải chứa
chính xác một mục cho mỗi mục `extensions`. Danh sách không khớp sẽ khiến cài đặt và
khám phá Plugin thất bại thay vì âm thầm quay về đường dẫn nguồn.

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
đóng gói hiện tại đã đóng gói kèm nhiều Plugin chính thức, vì vậy chúng không cần
cài đặt npm riêng trong thiết lập thông thường. Cho đến khi mọi Plugin do OpenClaw sở hữu
đã di chuyển sang ClawHub, OpenClaw vẫn phát hành một số gói Plugin `@openclaw/*` trên
npm cho các bản cài đặt cũ/tùy chỉnh và workflow npm trực tiếp.

Nếu npm báo một gói Plugin `@openclaw/*` là deprecated, phiên bản gói đó
thuộc một luồng gói bên ngoài cũ hơn. Dùng Plugin được đóng gói kèm từ
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

### Lõi (được phát hành kèm OpenClaw)

<AccordionGroup>
  <Accordion title="Model providers (enabled by default)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Memory plugins">
    - `memory-core` — tìm kiếm bộ nhớ đóng gói kèm (mặc định qua `plugins.slots.memory`)
    - `memory-lancedb` — bộ nhớ dài hạn cài đặt theo nhu cầu với tự động truy hồi/ghi nhận (đặt `plugins.slots.memory = "memory-lancedb"`)

    Xem [Memory LanceDB](/vi/plugins/memory-lancedb) để biết thiết lập embedding tương thích OpenAI,
    ví dụ Ollama, giới hạn truy hồi và xử lý sự cố.

  </Accordion>

  <Accordion title="Speech providers (enabled by default)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Other">
    - `browser` — Plugin trình duyệt đóng gói kèm cho công cụ trình duyệt, CLI `openclaw browser`, phương thức Gateway `browser.request`, runtime trình duyệt và dịch vụ điều khiển trình duyệt mặc định (bật mặc định; tắt trước khi thay thế)
    - `copilot-proxy` — cầu nối VS Code Copilot Proxy (tắt mặc định)

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
| `deny` | Danh sách chặn Plugin (tùy chọn; deny thắng) |
| `load.paths` | Tệp/thư mục Plugin bổ sung |
| `slots` | Bộ chọn slot độc quyền (ví dụ `memory`, `contextEngine`) |
| `entries.\<id\>` | Công tắc + cấu hình theo từng Plugin |

`plugins.allow` là độc quyền. Khi nó không rỗng, chỉ các Plugin được liệt kê mới có thể tải
hoặc phơi bày công cụ, ngay cả khi `tools.allow` chứa `"*"` hoặc tên công cụ
do một Plugin cụ thể sở hữu. Nếu danh sách cho phép công cụ tham chiếu đến công cụ Plugin, hãy thêm các id Plugin sở hữu
vào `plugins.allow` hoặc xóa `plugins.allow`; `openclaw doctor` cảnh báo về
hình dạng này.

Thay đổi cấu hình **yêu cầu khởi động lại Gateway**. Nếu Gateway đang chạy với config
watch + khởi động lại trong tiến trình được bật (đường dẫn `openclaw gateway` mặc định), việc
khởi động lại đó thường được thực hiện tự động một lúc sau khi ghi cấu hình hoàn tất.
Không có đường dẫn hot-reload được hỗ trợ cho mã runtime Plugin native hoặc hook vòng đời;
hãy khởi động lại tiến trình Gateway đang phục vụ kênh live trước khi
mong đợi mã `register(api)` đã cập nhật, hook `api.on(...)`, công cụ, dịch vụ hoặc
hook provider/runtime chạy.

`openclaw plugins list` là ảnh chụp nhanh registry/cấu hình Plugin cục bộ. Một Plugin
`enabled` ở đó nghĩa là registry đã lưu và cấu hình hiện tại cho phép
Plugin tham gia. Điều đó không chứng minh rằng một tiến trình con Gateway từ xa đang chạy
đã khởi động lại vào cùng mã Plugin. Trên các thiết lập VPS/container có
tiến trình wrapper, hãy gửi lệnh khởi động lại đến đúng tiến trình `openclaw gateway run`,
hoặc dùng `openclaw gateway restart` đối với Gateway đang chạy.

<Accordion title="Trạng thái Plugin: đã tắt vs thiếu vs không hợp lệ">
  - **Đã tắt**: plugin tồn tại nhưng các quy tắc bật đã tắt nó. Cấu hình được giữ nguyên.
  - **Thiếu**: cấu hình tham chiếu đến một plugin id mà quá trình khám phá không tìm thấy.
  - **Không hợp lệ**: plugin tồn tại nhưng cấu hình của nó không khớp với schema đã khai báo. Khởi động Gateway chỉ bỏ qua plugin đó; `openclaw doctor --fix` có thể cách ly mục không hợp lệ bằng cách tắt nó và xóa payload cấu hình của nó.

</Accordion>

## Khám phá và thứ tự ưu tiên

OpenClaw quét plugin theo thứ tự này (kết quả khớp đầu tiên sẽ thắng):

<Steps>
  <Step title="Đường dẫn cấu hình">
    `plugins.load.paths` — đường dẫn tệp hoặc thư mục rõ ràng. Các đường dẫn trỏ
    ngược về thư mục plugin đóng gói kèm theo của chính OpenClaw sẽ bị bỏ qua;
    chạy `openclaw doctor --fix` để xóa các bí danh cũ đó.
  </Step>

  <Step title="Plugin trong workspace">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` và `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Plugin toàn cục">
    `~/.openclaw/<plugin-root>/*.ts` và `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Plugin đi kèm">
    Được phát hành cùng OpenClaw. Nhiều plugin được bật theo mặc định (nhà cung cấp mô hình, giọng nói).
    Các plugin khác cần được bật rõ ràng.
  </Step>
</Steps>

Các bản cài đặt đóng gói và image Docker thường phân giải plugin đi kèm từ cây
`dist/extensions` đã biên dịch. Nếu một thư mục nguồn plugin đi kèm được
bind-mount đè lên đường dẫn nguồn đóng gói tương ứng, ví dụ
`/app/extensions/synology-chat`, OpenClaw xem thư mục nguồn đã mount đó
như một lớp phủ nguồn đi kèm và khám phá nó trước bundle
`/app/dist/extensions/synology-chat` đã đóng gói. Điều này giữ cho vòng lặp container
của maintainer hoạt động mà không cần chuyển mọi plugin đi kèm về nguồn TypeScript.
Đặt `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1` để buộc dùng bundle dist đã đóng gói
ngay cả khi có mount lớp phủ nguồn.

### Quy tắc bật

- `plugins.enabled: false` tắt tất cả plugin và bỏ qua công việc khám phá/tải plugin
- `plugins.deny` luôn ưu tiên hơn allow
- `plugins.entries.\<id\>.enabled: false` tắt plugin đó
- Plugin có nguồn gốc từ workspace **bị tắt theo mặc định** (phải được bật rõ ràng)
- Plugin đi kèm tuân theo tập mặc định bật sẵn tích hợp trừ khi bị ghi đè
- Các slot độc quyền có thể buộc bật plugin đã chọn cho slot đó
- Một số plugin đi kèm dạng opt-in được bật tự động khi cấu hình đặt tên một
  bề mặt thuộc sở hữu plugin, chẳng hạn như tham chiếu mô hình nhà cung cấp, cấu hình kênh, hoặc runtime
  harness
- Cấu hình plugin cũ được giữ nguyên khi `plugins.enabled: false` đang hoạt động;
  bật lại plugin trước khi chạy dọn dẹp doctor nếu bạn muốn xóa các id cũ
- Các route Codex thuộc họ OpenAI giữ ranh giới plugin riêng:
  `openai-codex/*` thuộc về plugin OpenAI, trong khi plugin app-server Codex
  đi kèm được chọn bằng `agentRuntime.id: "codex"` hoặc các tham chiếu mô hình
  `codex/*` cũ

## Khắc phục sự cố runtime hook

Nếu một plugin xuất hiện trong `plugins list` nhưng side effect hoặc hook
`register(api)` không chạy trong lưu lượng chat trực tiếp, hãy kiểm tra những mục này trước:

- Chạy `openclaw gateway status --deep --require-rpc` và xác nhận URL
  Gateway, profile, đường dẫn cấu hình, và process đang hoạt động là những thứ bạn đang chỉnh sửa.
- Khởi động lại Gateway trực tiếp sau khi thay đổi cài đặt/cấu hình/mã plugin. Trong wrapper
  container, PID 1 có thể chỉ là supervisor; hãy khởi động lại hoặc gửi tín hiệu cho process con
  `openclaw gateway run`.
- Dùng `openclaw plugins inspect <id> --runtime --json` để xác nhận đăng ký hook và
  chẩn đoán. Các conversation hook không đi kèm như `llm_input`,
  `llm_output`, `before_agent_finalize`, và `agent_end` cần
  `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- Với việc chuyển mô hình, ưu tiên `before_model_resolve`. Nó chạy trước bước
  phân giải mô hình cho lượt agent; `llm_output` chỉ chạy sau khi một lần thử mô hình
  tạo ra output của assistant.
- Để chứng minh mô hình session hiệu lực, dùng `openclaw sessions` hoặc các bề mặt
  session/status của Gateway và, khi gỡ lỗi payload nhà cung cấp, khởi động
  Gateway với `--raw-stream --raw-stream-path <path>`.

### Quyền sở hữu kênh hoặc công cụ bị trùng

Triệu chứng:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

Những thông báo này có nghĩa là có nhiều hơn một plugin được bật đang cố sở hữu cùng một kênh,
luồng thiết lập, hoặc tên công cụ. Nguyên nhân phổ biến nhất là một plugin kênh bên ngoài
được cài cạnh một plugin đi kèm hiện cung cấp cùng channel id.

Các bước gỡ lỗi:

- Chạy `openclaw plugins list --enabled --verbose` để xem mọi plugin được bật
  và nguồn gốc.
- Chạy `openclaw plugins inspect <id> --runtime --json` cho từng plugin nghi ngờ và
  so sánh `channels`, `channelConfigs`, `tools`, và chẩn đoán.
- Chạy `openclaw plugins registry --refresh` sau khi cài đặt hoặc gỡ bỏ
  gói plugin để metadata được lưu phản ánh bản cài đặt hiện tại.
- Khởi động lại Gateway sau khi thay đổi cài đặt, registry, hoặc cấu hình.

Tùy chọn sửa:

- Nếu một plugin cố ý thay thế plugin khác cho cùng channel id, plugin
  được ưu tiên nên khai báo `channelConfigs.<channel-id>.preferOver` với
  plugin id có độ ưu tiên thấp hơn. Xem [/plugins/manifest#replacing-another-channel-plugin](/vi/plugins/manifest#replacing-another-channel-plugin).
- Nếu việc trùng lặp là ngoài ý muốn, hãy tắt một bên bằng
  `plugins.entries.<plugin-id>.enabled: false` hoặc xóa bản cài plugin cũ.
- Nếu bạn đã bật rõ ràng cả hai plugin, OpenClaw giữ yêu cầu đó và
  báo cáo xung đột. Chọn một chủ sở hữu cho kênh hoặc đổi tên các công cụ
  thuộc sở hữu plugin để bề mặt runtime không mơ hồ.

## Slot plugin (danh mục độc quyền)

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

| Slot            | Nó kiểm soát gì              | Mặc định             |
| --------------- | ---------------------------- | ------------------- |
| `memory`        | Plugin Active Memory đang hoạt động | `memory-core`       |
| `contextEngine` | Công cụ ngữ cảnh đang hoạt động | `legacy` (tích hợp) |

## Tham chiếu CLI

```bash
openclaw plugins list                       # compact inventory
openclaw plugins list --enabled            # only enabled plugins
openclaw plugins list --verbose            # per-plugin detail lines
openclaw plugins list --json               # machine-readable inventory
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

Plugin đi kèm được phát hành cùng OpenClaw. Nhiều plugin được bật theo mặc định (ví dụ
nhà cung cấp mô hình đi kèm, nhà cung cấp giọng nói đi kèm, và plugin trình duyệt
đi kèm). Các plugin đi kèm khác vẫn cần `openclaw plugins enable <id>`.

`--force` ghi đè một plugin đã cài hoặc hook pack hiện có tại chỗ. Dùng
`openclaw plugins update <id-or-npm-spec>` cho các lần nâng cấp thường lệ của plugin npm
được theo dõi. Tùy chọn này không được hỗ trợ với `--link`, vốn tái sử dụng đường dẫn nguồn thay vì
sao chép đè lên mục tiêu cài đặt được quản lý.

Khi `plugins.allow` đã được đặt, `openclaw plugins install` thêm
plugin id đã cài vào allowlist đó trước khi bật nó. Nếu cùng plugin id
có trong `plugins.deny`, quá trình cài đặt sẽ xóa mục deny cũ đó để
bản cài đặt rõ ràng có thể được tải ngay sau khi khởi động lại.

OpenClaw giữ một registry plugin cục bộ được lưu bền vững làm mô hình đọc nguội cho
kiểm kê plugin, quyền sở hữu đóng góp, và lập kế hoạch khởi động. Các luồng cài đặt, cập nhật,
gỡ cài đặt, bật, và tắt làm mới registry đó sau khi thay đổi trạng thái plugin.
Cùng tệp `plugins/installs.json` giữ metadata cài đặt bền vững trong
`installRecords` cấp cao nhất và metadata manifest có thể dựng lại trong `plugins`. Nếu
registry bị thiếu, cũ, hoặc không hợp lệ, `openclaw plugins registry
--refresh` dựng lại chế độ xem manifest của nó từ install record, chính sách cấu hình, và
metadata manifest/package mà không tải các module runtime plugin.
`openclaw plugins update <id-or-npm-spec>` áp dụng cho các bản cài được theo dõi. Truyền
một npm package spec với dist-tag hoặc phiên bản chính xác sẽ phân giải tên gói
trở lại bản ghi plugin được theo dõi và ghi lại spec mới cho các lần cập nhật sau.
Truyền tên gói không kèm phiên bản sẽ chuyển một bản cài được pin chính xác trở lại
dòng phát hành mặc định của registry. Nếu plugin npm đã cài đã khớp với
phiên bản được phân giải và danh tính artifact đã ghi, OpenClaw bỏ qua bản cập nhật
mà không tải xuống, cài đặt lại, hoặc ghi lại cấu hình.

`--pin` chỉ dành cho npm. Nó không được hỗ trợ với `--marketplace`, vì
các bản cài từ marketplace lưu metadata nguồn marketplace thay vì npm spec.

`--dangerously-force-unsafe-install` là tùy chọn ghi đè khẩn cấp cho các kết quả
dương tính giả từ trình quét mã nguy hiểm tích hợp. Nó cho phép cài đặt plugin
và cập nhật plugin tiếp tục vượt qua các phát hiện `critical` tích hợp, nhưng vẫn
không bỏ qua các chặn chính sách `before_install` của plugin hoặc chặn do lỗi quét.
Quét cài đặt bỏ qua các tệp và thư mục kiểm thử phổ biến như `tests/`,
`__tests__/`, `*.test.*`, và `*.spec.*` để tránh chặn mock kiểm thử đã đóng gói;
các entrypoint runtime plugin đã khai báo vẫn được quét ngay cả khi chúng dùng một trong
những tên đó.

Cờ CLI này chỉ áp dụng cho các luồng cài đặt/cập nhật plugin. Các bản cài đặt phụ thuộc skill
được Gateway hậu thuẫn dùng tùy chọn ghi đè yêu cầu `dangerouslyForceUnsafeInstall`
tương ứng, trong khi `openclaw skills install` vẫn là luồng tải xuống/cài đặt skill ClawHub
riêng biệt.

Nếu một plugin bạn đã phát hành trên ClawHub bị ẩn hoặc bị chặn bởi một lần quét, hãy mở
bảng điều khiển ClawHub hoặc chạy `clawhub package rescan <name>` để yêu cầu ClawHub kiểm tra
lại. `--dangerously-force-unsafe-install` chỉ ảnh hưởng đến các bản cài trên máy của chính bạn;
nó không yêu cầu ClawHub quét lại plugin hoặc công khai một bản phát hành bị chặn.

Các gói tương thích tham gia vào cùng luồng liệt kê/kiểm tra/bật/tắt Plugin. Hỗ trợ runtime hiện tại bao gồm Skills dạng gói, command-skills của Claude, mặc định `settings.json` của Claude, mặc định `.lsp.json` và `lspServers` do manifest khai báo của Claude, command-skills của Cursor và các thư mục hook Codex tương thích.

`openclaw plugins inspect <id>` cũng báo cáo các khả năng gói đã phát hiện, cùng các mục máy chủ MCP và LSP được hỗ trợ hoặc không được hỗ trợ cho các Plugin dựa trên gói.

Nguồn marketplace có thể là tên known-marketplace của Claude từ `~/.claude/plugins/known_marketplaces.json`, root marketplace cục bộ hoặc đường dẫn `marketplace.json`, dạng viết tắt GitHub như `owner/repo`, URL repo GitHub, hoặc URL git. Với marketplace từ xa, các mục Plugin phải nằm trong repo marketplace đã clone và chỉ dùng nguồn đường dẫn tương đối.

Xem [tham chiếu CLI `openclaw plugins`](/vi/cli/plugins) để biết đầy đủ chi tiết.

## Tổng quan API Plugin

Plugin gốc xuất một đối tượng entry cung cấp `register(api)`. Các Plugin cũ vẫn có thể dùng `activate(api)` như bí danh kế thừa, nhưng Plugin mới nên dùng `register`.

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

OpenClaw tải đối tượng entry và gọi `register(api)` trong quá trình kích hoạt Plugin. Loader vẫn fallback sang `activate(api)` cho các Plugin cũ, nhưng các Plugin được bundle và Plugin bên ngoài mới nên xem `register` là hợp đồng công khai.

`api.registrationMode` cho Plugin biết lý do entry của nó đang được tải:

| Chế độ          | Ý nghĩa                                                                                                                          |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | Kích hoạt runtime. Đăng ký công cụ, hook, dịch vụ, lệnh, route và các hiệu ứng phụ trực tiếp khác.                               |
| `discovery`     | Khám phá khả năng chỉ đọc. Đăng ký provider và metadata; mã entry Plugin tin cậy có thể tải, nhưng bỏ qua hiệu ứng phụ trực tiếp. |
| `setup-only`    | Tải metadata thiết lập kênh thông qua một entry thiết lập nhẹ.                                                                   |
| `setup-runtime` | Tải thiết lập kênh cũng cần entry runtime.                                                                                       |
| `cli-metadata`  | Chỉ thu thập metadata lệnh CLI.                                                                                                  |

Các entry Plugin mở socket, cơ sở dữ liệu, worker nền hoặc client tồn tại lâu nên bảo vệ các hiệu ứng phụ đó bằng `api.registrationMode === "full"`. Các lần tải discovery được lưu cache riêng với các lần tải kích hoạt và không thay thế registry Gateway đang chạy. Discovery là không kích hoạt, không phải không import: OpenClaw có thể đánh giá entry Plugin tin cậy hoặc module Plugin kênh để xây dựng snapshot. Giữ cấp top-level của module nhẹ và không có hiệu ứng phụ, đồng thời chuyển client mạng, subprocess, listener, đọc credential và khởi động dịch vụ vào sau các đường dẫn full-runtime.

Các phương thức đăng ký phổ biến:

| Phương thức                             | Nội dung đăng ký             |
| --------------------------------------- | ---------------------------- |
| `registerProvider`                      | Model provider (LLM)         |
| `registerChannel`                       | Kênh chat                    |
| `registerTool`                          | Công cụ agent                |
| `registerHook` / `on(...)`              | Hook vòng đời                |
| `registerSpeechProvider`                | Text-to-speech / STT         |
| `registerRealtimeTranscriptionProvider` | STT streaming                |
| `registerRealtimeVoiceProvider`         | Giọng nói realtime song công |
| `registerMediaUnderstandingProvider`    | Phân tích hình ảnh/âm thanh  |
| `registerImageGenerationProvider`       | Tạo hình ảnh                 |
| `registerMusicGenerationProvider`       | Tạo nhạc                     |
| `registerVideoGenerationProvider`       | Tạo video                    |
| `registerWebFetchProvider`              | Provider fetch / scrape web  |
| `registerWebSearchProvider`             | Tìm kiếm web                 |
| `registerHttpRoute`                     | Endpoint HTTP                |
| `registerCommand` / `registerCli`       | Lệnh CLI                     |
| `registerContextEngine`                 | Context engine               |
| `registerService`                       | Dịch vụ nền                  |

Hành vi guard hook cho hook vòng đời có kiểu:

- `before_tool_call`: `{ block: true }` là trạng thái kết thúc; các handler có độ ưu tiên thấp hơn bị bỏ qua.
- `before_tool_call`: `{ block: false }` là no-op và không xóa block trước đó.
- `before_install`: `{ block: true }` là trạng thái kết thúc; các handler có độ ưu tiên thấp hơn bị bỏ qua.
- `before_install`: `{ block: false }` là no-op và không xóa block trước đó.
- `message_sending`: `{ cancel: true }` là trạng thái kết thúc; các handler có độ ưu tiên thấp hơn bị bỏ qua.
- `message_sending`: `{ cancel: false }` là no-op và không xóa cancel trước đó.

App-server Codex gốc bắc cầu các sự kiện công cụ Codex-native trở lại bề mặt hook này. Plugin có thể chặn công cụ Codex gốc thông qua `before_tool_call`, quan sát kết quả thông qua `after_tool_call`, và tham gia phê duyệt `PermissionRequest` của Codex. Cầu nối chưa viết lại đối số công cụ Codex-native. Ranh giới hỗ trợ runtime Codex chính xác nằm trong [hợp đồng hỗ trợ Codex harness v1](/vi/plugins/codex-harness#v1-support-contract).

Để biết đầy đủ hành vi hook có kiểu, xem [tổng quan SDK](/vi/plugins/sdk-overview#hook-decision-semantics).

## Liên quan

- [Xây dựng Plugin](/vi/plugins/building-plugins) — tạo Plugin của riêng bạn
- [Gói Plugin](/vi/plugins/bundles) — khả năng tương thích gói Codex/Claude/Cursor
- [Manifest Plugin](/vi/plugins/manifest) — schema manifest
- [Đăng ký công cụ](/vi/plugins/building-plugins#registering-agent-tools) — thêm công cụ agent trong Plugin
- [Nội bộ Plugin](/vi/plugins/architecture) — mô hình khả năng và pipeline tải
- [Plugin cộng đồng](/vi/plugins/community) — danh sách bên thứ ba
