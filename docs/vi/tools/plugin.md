---
read_when:
    - Cài đặt hoặc cấu hình Plugin
    - Tìm hiểu quy tắc phát hiện và tải Plugin
    - Làm việc với các gói Plugin tương thích với Codex/Claude
sidebarTitle: Install and Configure
summary: Cài đặt, cấu hình và quản lý các Plugin OpenClaw
title: Plugin
x-i18n:
    generated_at: "2026-05-05T01:51:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1de640f7766a6b312a2385075ae1abdb19f5c2afcb0e7063eba0d3edde697004
    source_path: tools/plugin.md
    workflow: 16
---

Các Plugin mở rộng OpenClaw bằng những khả năng mới: kênh, nhà cung cấp mô hình,
bộ khung agent, công cụ, Skills, giọng nói, phiên âm thời gian thực, thoại thời
gian thực, hiểu phương tiện, tạo ảnh, tạo video, tìm nạp web, tìm kiếm web, và
nhiều khả năng khác. Một số Plugin là **lõi** (được phát hành cùng OpenClaw),
những Plugin khác là **bên ngoài**. Hầu hết Plugin bên ngoài được phát hành và
khám phá thông qua [ClawHub](/vi/tools/clawhub). Npm vẫn được hỗ trợ cho cài đặt
trực tiếp và cho một tập tạm thời các gói Plugin do OpenClaw sở hữu trong khi
quá trình di chuyển đó hoàn tất.

## Bắt đầu nhanh

Để xem các ví dụ có thể sao chép-dán về cài đặt, liệt kê, gỡ cài đặt, cập nhật
và phát hành, xem [Quản lý Plugin](/vi/plugins/manage-plugins).

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

  <Step title="Quản lý trực tiếp trong chat">
    Trong một Gateway đang chạy, `/plugins enable` và `/plugins disable` chỉ dành
    cho chủ sở hữu sẽ kích hoạt trình tải lại cấu hình Gateway. Gateway tải lại
    các bề mặt runtime của Plugin ngay trong tiến trình, và các lượt agent mới
    xây dựng lại danh sách công cụ của chúng từ registry đã được làm mới.
    `/plugins install` thay đổi mã nguồn Plugin, vì vậy Gateway yêu cầu khởi
    động lại thay vì giả vờ rằng tiến trình hiện tại có thể tải lại an toàn các
    module đã được nhập.

  </Step>

  <Step title="Xác minh Plugin">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json

    # If the plugin registered a CLI root, run one command from that root.
    openclaw <plugin-command> --help
    ```

    Dùng `--runtime` khi bạn cần chứng minh các công cụ, dịch vụ, phương thức
    gateway, hook, hoặc lệnh CLI do Plugin sở hữu đã được đăng ký. `inspect`
    thông thường là kiểm tra manifest/registry lạnh và cố ý tránh nhập runtime
    của Plugin.

  </Step>
</Steps>

Nếu bạn thích điều khiển trực tiếp trong chat, bật `commands.plugins: true` và dùng:

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

Đường dẫn cài đặt dùng cùng bộ phân giải như CLI: đường dẫn/kho lưu trữ cục bộ,
`clawhub:<pkg>` tường minh, `npm:<pkg>` tường minh, `git:<repo>` tường minh,
hoặc đặc tả gói trần thông qua npm.

Nếu cấu hình không hợp lệ, cài đặt thường sẽ fail closed và chỉ bạn đến
`openclaw doctor --fix`. Ngoại lệ khôi phục duy nhất là một đường dẫn cài đặt
lại hẹp cho Plugin được đóng gói sẵn đối với các Plugin chọn tham gia
`openclaw.install.allowInvalidConfigRecovery`.
Trong quá trình khởi động Gateway, cấu hình Plugin không hợp lệ fail closed như
mọi cấu hình không hợp lệ khác. Chạy `openclaw doctor --fix` để cách ly cấu hình
Plugin lỗi bằng cách vô hiệu hóa mục Plugin đó và loại bỏ payload cấu hình không
hợp lệ của nó; bản sao lưu cấu hình thông thường giữ lại các giá trị trước đó.
Khi cấu hình kênh tham chiếu một Plugin không còn có thể khám phá nhưng cùng id
Plugin cũ vẫn còn trong cấu hình Plugin hoặc bản ghi cài đặt, quá trình khởi động
Gateway ghi cảnh báo và bỏ qua kênh đó thay vì chặn mọi kênh khác. Chạy
`openclaw doctor --fix` để loại bỏ các mục kênh/Plugin cũ; các khóa kênh không
xác định không có bằng chứng Plugin cũ vẫn fail validation để lỗi gõ sai vẫn hiển
thị.
Nếu đặt `plugins.enabled: false`, các tham chiếu Plugin cũ được xem là bất hoạt:
quá trình khởi động Gateway bỏ qua công việc khám phá/tải Plugin và
`openclaw doctor` giữ nguyên cấu hình Plugin đã tắt thay vì tự động loại bỏ nó.
Bật lại Plugin trước khi chạy dọn dẹp bằng doctor nếu bạn muốn loại bỏ các id
Plugin cũ.

Việc cài đặt phần phụ thuộc của Plugin chỉ diễn ra trong các luồng cài đặt/cập
nhật tường minh hoặc sửa chữa bằng doctor. Khởi động Gateway, tải lại cấu hình
và kiểm tra runtime không chạy trình quản lý gói hay sửa cây phụ thuộc. Plugin
cục bộ phải đã có phần phụ thuộc được cài đặt, trong khi Plugin npm, git và
ClawHub được cài đặt dưới các gốc Plugin do OpenClaw quản lý. Phần phụ thuộc npm
có thể được hoist trong gốc npm do OpenClaw quản lý; cài đặt/cập nhật quét gốc
được quản lý đó trước khi tin cậy và gỡ cài đặt sẽ loại bỏ các gói do npm quản
lý thông qua npm. Plugin bên ngoài và đường dẫn tải tùy chỉnh vẫn phải được cài
đặt thông qua `openclaw plugins install`. Dùng `openclaw plugins list --json` để
xem `dependencyStatus` tĩnh cho từng Plugin hiển thị mà không nhập mã runtime hay
sửa phần phụ thuộc. Xem [Phân giải phần phụ thuộc Plugin](/vi/plugins/dependency-resolution)
để biết vòng đời tại thời điểm cài đặt.

Với cài đặt npm, các selector có thể thay đổi như `latest` hoặc dist-tag được
phân giải trước khi cài đặt và sau đó được ghim vào đúng phiên bản đã xác minh
trong gốc npm do OpenClaw quản lý. Sau khi npm hoàn tất, OpenClaw xác minh mục
`package-lock.json` đã cài đặt vẫn khớp với phiên bản đã phân giải và integrity.
Nếu npm ghi siêu dữ liệu gói khác, quá trình cài đặt thất bại và gói được quản
lý sẽ được rollback thay vì chấp nhận một artifact Plugin khác.

Các checkout nguồn là pnpm workspace. Nếu bạn clone OpenClaw để chỉnh sửa các
Plugin được đóng gói sẵn, chạy `pnpm install`; sau đó OpenClaw tải các Plugin
được đóng gói sẵn từ `extensions/<id>` để các chỉnh sửa và phần phụ thuộc cục bộ
của gói được dùng trực tiếp. Cài đặt gốc npm thông thường dành cho OpenClaw đã
đóng gói, không dành cho phát triển checkout nguồn.

## Loại Plugin

OpenClaw nhận diện hai định dạng Plugin:

| Định dạng | Cách hoạt động | Ví dụ |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + module runtime; thực thi trong tiến trình | Plugin chính thức, gói npm cộng đồng |
| **Bundle** | Bố cục tương thích Codex/Claude/Cursor; được ánh xạ sang tính năng OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Cả hai đều xuất hiện trong `openclaw plugins list`. Xem [Plugin Bundle](/vi/plugins/bundles) để biết chi tiết về bundle.

Nếu bạn đang viết một Plugin native, hãy bắt đầu với [Xây dựng Plugin](/vi/plugins/building-plugins)
và [Tổng quan Plugin SDK](/vi/plugins/sdk-overview).

## Entry point của gói

Các gói npm Plugin native phải khai báo `openclaw.extensions` trong `package.json`.
Mỗi mục phải ở trong thư mục gói và phân giải đến một tệp runtime đọc được, hoặc
đến một tệp nguồn TypeScript với một peer JavaScript đã build được suy luận như
`src/index.ts` đến `dist/index.js`.
Cài đặt đã đóng gói phải phát hành output runtime JavaScript đó. Fallback nguồn
TypeScript dành cho checkout nguồn và đường dẫn phát triển cục bộ, không dành
cho các gói npm được cài vào gốc Plugin do OpenClaw quản lý.

Dùng `openclaw.runtimeExtensions` khi các tệp runtime đã phát hành không nằm ở
cùng đường dẫn với các mục nguồn. Khi có mặt, `runtimeExtensions` phải chứa đúng
một mục cho mỗi mục `extensions`. Danh sách không khớp sẽ làm cài đặt và khám phá
Plugin thất bại thay vì âm thầm fallback về đường dẫn nguồn. Nếu bạn cũng phát
hành `openclaw.setupEntry`, hãy dùng `openclaw.runtimeSetupEntry` cho peer
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

### Các gói npm do OpenClaw sở hữu trong quá trình di chuyển

ClawHub là đường dẫn phân phối chính cho hầu hết Plugin. Các bản phát hành
OpenClaw đã đóng gói hiện tại đã bundle nhiều Plugin chính thức, nên các Plugin
đó không cần cài đặt npm riêng trong thiết lập thông thường. Cho đến khi mọi
Plugin do OpenClaw sở hữu đã di chuyển sang ClawHub, OpenClaw vẫn phát hành một
số gói Plugin `@openclaw/*` trên npm cho cài đặt cũ/tùy chỉnh và quy trình npm
trực tiếp.

Nếu npm báo một gói Plugin `@openclaw/*` là deprecated, phiên bản gói đó đến từ
một tuyến gói bên ngoài cũ hơn. Dùng Plugin được bundle từ OpenClaw hiện tại
hoặc checkout cục bộ cho đến khi một gói npm mới hơn được phát hành.

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

### Lõi (được phát hành cùng OpenClaw)

<AccordionGroup>
  <Accordion title="Nhà cung cấp mô hình (bật theo mặc định)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Plugin bộ nhớ">
    - `memory-core` — tìm kiếm bộ nhớ được bundle (mặc định qua `plugins.slots.memory`)
    - `memory-lancedb` — bộ nhớ dài hạn dựa trên LanceDB với tự động recall/capture (đặt `plugins.slots.memory = "memory-lancedb"`)

    Xem [Memory LanceDB](/vi/plugins/memory-lancedb) để biết thiết lập embedding
    tương thích OpenAI, ví dụ Ollama, giới hạn recall và khắc phục sự cố.

  </Accordion>

  <Accordion title="Nhà cung cấp giọng nói (bật theo mặc định)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Khác">
    - `browser` — Plugin trình duyệt được bundle cho công cụ trình duyệt, CLI `openclaw browser`, phương thức gateway `browser.request`, runtime trình duyệt và dịch vụ điều khiển trình duyệt mặc định (bật theo mặc định; tắt trước khi thay thế)
    - `copilot-proxy` — cầu nối VS Code Copilot Proxy (tắt theo mặc định)

  </Accordion>
</AccordionGroup>

Bạn đang tìm Plugin bên thứ ba? Xem [Plugin cộng đồng](/vi/plugins/community).

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

| Trường              | Mô tả                                               |
| ------------------ | --------------------------------------------------------- |
| `enabled`          | Công tắc chính (mặc định: `true`)                           |
| `allow`            | Danh sách cho phép Plugin (không bắt buộc)                               |
| `bundledDiscovery` | Chế độ phát hiện Plugin đóng gói sẵn (mặc định là `allowlist`)    |
| `deny`             | Danh sách chặn Plugin (không bắt buộc; chặn được ưu tiên)                     |
| `load.paths`       | Tệp/thư mục Plugin bổ sung                            |
| `slots`            | Bộ chọn vị trí độc quyền (ví dụ: `memory`, `contextEngine`) |
| `entries.\<id\>`   | Công tắc + cấu hình theo từng Plugin                               |

`plugins.allow` là độc quyền. Khi không rỗng, chỉ các Plugin được liệt kê mới có thể tải
hoặc hiển thị công cụ, ngay cả khi `tools.allow` chứa `"*"` hoặc một tên công cụ cụ thể
do Plugin sở hữu. Nếu danh sách cho phép công cụ tham chiếu các công cụ Plugin, hãy thêm id Plugin sở hữu
vào `plugins.allow` hoặc xóa `plugins.allow`; `openclaw doctor` sẽ cảnh báo về
dạng cấu hình này.

`plugins.bundledDiscovery` mặc định là `"allowlist"` đối với cấu hình mới, vì vậy một
kho `plugins.allow` hạn chế cũng chặn các Plugin nhà cung cấp đóng gói sẵn bị bỏ qua,
bao gồm cả phát hiện nhà cung cấp tìm kiếm web trong runtime. Doctor đóng dấu các cấu hình
danh sách cho phép hạn chế cũ bằng `"compat"` trong quá trình di chuyển để các bản nâng cấp giữ
hành vi nhà cung cấp đóng gói sẵn kế thừa cho đến khi người vận hành chọn chế độ nghiêm ngặt hơn.
`plugins.allow` rỗng vẫn được coi là chưa đặt/mở.

Các thay đổi cấu hình được thực hiện qua `/plugins enable` hoặc `/plugins disable` sẽ kích hoạt
tải lại Plugin Gateway trong cùng tiến trình. Các lượt agent mới dựng lại danh sách công cụ từ
sổ đăng ký Plugin đã làm mới. Các thao tác thay đổi nguồn như cài đặt,
cập nhật và gỡ cài đặt vẫn khởi động lại tiến trình Gateway vì các mô-đun Plugin đã được nhập
không thể được thay thế an toàn tại chỗ.

`openclaw plugins list` là ảnh chụp nhanh sổ đăng ký/cấu hình Plugin cục bộ. Một Plugin
`enabled` ở đó nghĩa là sổ đăng ký đã lưu và cấu hình hiện tại cho phép
Plugin tham gia. Điều đó không chứng minh rằng một Gateway từ xa đang chạy
đã tải lại hoặc khởi động lại vào cùng mã Plugin. Trên thiết lập VPS/container
có các tiến trình wrapper, hãy gửi lệnh khởi động lại hoặc các thao tác ghi kích hoạt tải lại đến đúng
tiến trình `openclaw gateway run`, hoặc dùng `openclaw gateway restart` đối với
Gateway đang chạy khi báo cáo tải lại thất bại.

<Accordion title="Plugin states: disabled vs missing vs invalid">
  - **Đã tắt**: Plugin tồn tại nhưng các quy tắc bật đã tắt nó. Cấu hình được giữ nguyên.
  - **Thiếu**: cấu hình tham chiếu một id Plugin mà quá trình phát hiện không tìm thấy.
  - **Không hợp lệ**: Plugin tồn tại nhưng cấu hình của nó không khớp với schema đã khai báo. Khởi động Gateway chỉ bỏ qua Plugin đó; `openclaw doctor --fix` có thể cách ly mục không hợp lệ bằng cách tắt nó và xóa payload cấu hình của nó.

</Accordion>

## Phát hiện và thứ tự ưu tiên

OpenClaw quét Plugin theo thứ tự này (kết quả khớp đầu tiên được ưu tiên):

<Steps>
  <Step title="Config paths">
    `plugins.load.paths` — đường dẫn tệp hoặc thư mục rõ ràng. Các đường dẫn trỏ
    ngược về các thư mục Plugin đóng gói sẵn của chính OpenClaw sẽ bị bỏ qua;
    chạy `openclaw doctor --fix` để xóa các bí danh cũ đó.
  </Step>

  <Step title="Workspace plugins">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` và `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Global plugins">
    `~/.openclaw/<plugin-root>/*.ts` và `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Bundled plugins">
    Được phát hành cùng OpenClaw. Nhiều Plugin được bật mặc định (nhà cung cấp mô hình, giọng nói).
    Các Plugin khác cần được bật rõ ràng.
  </Step>
</Steps>

Các bản cài đặt đóng gói và ảnh Docker thường phân giải Plugin đóng gói sẵn từ
cây `dist/extensions` đã biên dịch. Nếu một thư mục nguồn Plugin đóng gói sẵn được
bind-mount đè lên đường dẫn nguồn đóng gói tương ứng, ví dụ
`/app/extensions/synology-chat`, OpenClaw coi thư mục nguồn đã mount đó
là lớp phủ nguồn đóng gói sẵn và phát hiện nó trước gói
`/app/dist/extensions/synology-chat` đã đóng gói. Điều này giúp các vòng lặp container
của maintainer hoạt động mà không cần chuyển mọi Plugin đóng gói sẵn về nguồn TypeScript.
Đặt `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1` để buộc dùng các gói dist đã đóng gói
ngay cả khi có mount lớp phủ nguồn.

### Quy tắc bật

- `plugins.enabled: false` tắt tất cả Plugin và bỏ qua việc phát hiện/tải Plugin
- `plugins.deny` luôn thắng `allow`
- `plugins.entries.\<id\>.enabled: false` tắt Plugin đó
- Plugin có nguồn gốc từ workspace **mặc định bị tắt** (phải được bật rõ ràng)
- Plugin đóng gói sẵn tuân theo tập bật mặc định tích hợp trừ khi bị ghi đè
- Các vị trí độc quyền có thể buộc bật Plugin đã chọn cho vị trí đó
- Một số Plugin đóng gói sẵn dạng chọn tham gia được bật tự động khi cấu hình nêu tên một
  bề mặt do Plugin sở hữu, chẳng hạn ref mô hình nhà cung cấp, cấu hình kênh hoặc runtime
  harness
- Cấu hình Plugin cũ được giữ nguyên khi `plugins.enabled: false` đang hoạt động;
  bật lại Plugin trước khi chạy dọn dẹp doctor nếu bạn muốn xóa các id cũ
- Các tuyến Codex thuộc họ OpenAI giữ ranh giới Plugin riêng:
  `openai-codex/*` thuộc về Plugin OpenAI, trong khi Plugin app-server Codex đóng gói sẵn
  được chọn bằng `agentRuntime.id: "codex"` hoặc các ref mô hình
  `codex/*` kế thừa

## Khắc phục sự cố hook runtime

Nếu một Plugin xuất hiện trong `plugins list` nhưng hiệu ứng phụ hoặc hook
`register(api)` không chạy trong lưu lượng trò chuyện trực tiếp, hãy kiểm tra các điểm này trước:

- Chạy `openclaw gateway status --deep --require-rpc` và xác nhận URL
  Gateway đang hoạt động, profile, đường dẫn cấu hình và tiến trình là những mục bạn đang chỉnh sửa.
- Khởi động lại Gateway trực tiếp sau khi thay đổi cài đặt/cấu hình/mã Plugin. Trong container
  wrapper, PID 1 có thể chỉ là supervisor; hãy khởi động lại hoặc gửi tín hiệu tới tiến trình con
  `openclaw gateway run`.
- Dùng `openclaw plugins inspect <id> --runtime --json` để xác nhận đăng ký hook và
  chẩn đoán. Các hook hội thoại không đóng gói sẵn như `llm_input`,
  `llm_output`, `before_agent_finalize`, và `agent_end` cần
  `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- Để chuyển đổi mô hình, ưu tiên `before_model_resolve`. Nó chạy trước khi phân giải mô hình
  cho các lượt agent; `llm_output` chỉ chạy sau khi một lần thử mô hình
  tạo ra đầu ra assistant.
- Để chứng minh mô hình phiên hiệu dụng, dùng `openclaw sessions` hoặc các bề mặt
  phiên/trạng thái Gateway và, khi gỡ lỗi payload nhà cung cấp, khởi động
  Gateway với `--raw-stream --raw-stream-path <path>`.

### Thiết lập công cụ Plugin chậm

Nếu các lượt agent có vẻ bị khựng khi chuẩn bị công cụ, hãy bật ghi log trace và
kiểm tra các dòng thời gian factory công cụ Plugin:

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

Tìm:

```text
[trace:plugin-tools] factory timings ...
```

Phần tóm tắt liệt kê tổng thời gian factory và các factory công cụ Plugin chậm nhất,
bao gồm id Plugin, tên công cụ đã khai báo, dạng kết quả và công cụ đó có
không bắt buộc hay không. Các dòng chậm được nâng thành cảnh báo khi một factory riêng lẻ mất
ít nhất 1 giây hoặc tổng thời gian chuẩn bị factory công cụ Plugin mất ít nhất 5 giây.

OpenClaw lưu cache các kết quả factory công cụ Plugin thành công cho các lần phân giải lặp lại
với cùng ngữ cảnh yêu cầu hiệu dụng. Khóa cache bao gồm cấu hình
runtime hiệu dụng, workspace, id agent/phiên, chính sách sandbox, cài đặt trình duyệt,
ngữ cảnh phân phối, danh tính người yêu cầu và trạng thái sở hữu, vì vậy các factory
phụ thuộc vào các trường tin cậy đó sẽ được chạy lại khi ngữ cảnh thay đổi.

Nếu một Plugin chiếm phần lớn thời gian, hãy kiểm tra các đăng ký runtime của nó:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

Sau đó cập nhật, cài đặt lại hoặc tắt Plugin đó. Tác giả Plugin nên chuyển
việc tải phụ thuộc tốn kém vào sau đường dẫn thực thi công cụ thay vì làm việc đó
bên trong factory công cụ.

### Trùng quyền sở hữu kênh hoặc công cụ

Triệu chứng:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

Những thông báo này nghĩa là có hơn một Plugin đã bật đang cố sở hữu cùng một kênh,
luồng thiết lập hoặc tên công cụ. Nguyên nhân phổ biến nhất là một Plugin kênh bên ngoài
được cài cạnh một Plugin đóng gói sẵn hiện cung cấp cùng id kênh.

Các bước gỡ lỗi:

- Chạy `openclaw plugins list --enabled --verbose` để xem mọi Plugin đã bật
  và nguồn gốc.
- Chạy `openclaw plugins inspect <id> --runtime --json` cho từng Plugin nghi ngờ và
  so sánh `channels`, `channelConfigs`, `tools`, và chẩn đoán.
- Chạy `openclaw plugins registry --refresh` sau khi cài đặt hoặc xóa
  gói Plugin để siêu dữ liệu đã lưu phản ánh bản cài đặt hiện tại.
- Khởi động lại Gateway sau các thay đổi cài đặt, sổ đăng ký hoặc cấu hình.

Các tùy chọn sửa:

- Nếu một Plugin cố ý thay thế Plugin khác cho cùng id kênh, Plugin
  được ưu tiên nên khai báo `channelConfigs.<channel-id>.preferOver` với
  id Plugin có mức ưu tiên thấp hơn. Xem [/plugins/manifest#replacing-another-channel-plugin](/vi/plugins/manifest#replacing-another-channel-plugin).
- Nếu trùng lặp là ngoài ý muốn, hãy tắt một bên bằng
  `plugins.entries.<plugin-id>.enabled: false` hoặc xóa bản cài đặt Plugin
  cũ.
- Nếu bạn đã bật rõ ràng cả hai Plugin, OpenClaw giữ yêu cầu đó và
  báo cáo xung đột. Hãy chọn một chủ sở hữu cho kênh hoặc đổi tên các công cụ
  do Plugin sở hữu để bề mặt runtime không mơ hồ.

## Vị trí Plugin (danh mục độc quyền)

Một số danh mục là độc quyền (mỗi lần chỉ có một mục hoạt động):

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

| Vị trí            | Nội dung kiểm soát      | Mặc định             |
| --------------- | --------------------- | ------------------- |
| `memory`        | Plugin Active Memory  | `memory-core`       |
| `contextEngine` | Công cụ ngữ cảnh đang hoạt động | `legacy` (tích hợp sẵn) |

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

Các Plugin đi kèm được phân phối cùng OpenClaw. Nhiều Plugin được bật theo mặc định (ví dụ: các nhà cung cấp mô hình đi kèm, các nhà cung cấp giọng nói đi kèm và Plugin trình duyệt đi kèm). Các Plugin đi kèm khác vẫn cần `openclaw plugins enable <id>`.

`--force` ghi đè một Plugin đã cài đặt hoặc gói hook hiện có tại chỗ. Dùng `openclaw plugins update <id-or-npm-spec>` để nâng cấp định kỳ các Plugin npm đang được theo dõi. Tùy chọn này không được hỗ trợ cùng `--link`, vốn tái sử dụng đường dẫn nguồn thay vì sao chép lên một đích cài đặt được quản lý.

Khi `plugins.allow` đã được đặt, `openclaw plugins install` thêm id Plugin đã cài đặt vào danh sách cho phép đó trước khi bật Plugin. Nếu cùng id Plugin đó có trong `plugins.deny`, lệnh cài đặt sẽ xóa mục từ chối cũ đó để lần cài đặt rõ ràng có thể được tải ngay sau khi khởi động lại.

OpenClaw duy trì một registry Plugin cục bộ bền vững làm mô hình đọc nguội cho kiểm kê Plugin, quyền sở hữu đóng góp và lập kế hoạch khởi động. Các luồng cài đặt, cập nhật, gỡ cài đặt, bật và tắt sẽ làm mới registry đó sau khi thay đổi trạng thái Plugin. Cùng tệp `plugins/installs.json` lưu siêu dữ liệu cài đặt bền vững trong `installRecords` cấp cao nhất và siêu dữ liệu manifest có thể dựng lại trong `plugins`. Nếu registry bị thiếu, lỗi thời hoặc không hợp lệ, `openclaw plugins registry --refresh` sẽ dựng lại chế độ xem manifest từ bản ghi cài đặt, chính sách cấu hình và siêu dữ liệu manifest/package mà không tải các mô-đun runtime của Plugin.
`openclaw plugins update <id-or-npm-spec>` áp dụng cho các bản cài đặt đang được theo dõi. Truyền một đặc tả package npm có dist-tag hoặc phiên bản chính xác sẽ phân giải tên package ngược về bản ghi Plugin được theo dõi và ghi lại đặc tả mới cho các lần cập nhật sau. Truyền tên package không kèm phiên bản sẽ chuyển một bản cài đặt được ghim chính xác về dòng phát hành mặc định của registry. Nếu Plugin npm đã cài đặt đã khớp với phiên bản đã phân giải và danh tính artifact đã ghi, OpenClaw bỏ qua bản cập nhật mà không tải xuống, cài đặt lại hoặc ghi lại cấu hình.
Khi `openclaw update` chạy trên kênh beta, các bản ghi Plugin npm và ClawHub ở dòng mặc định sẽ thử `@beta` trước và quay lại mặc định/mới nhất khi không có bản phát hành beta của Plugin. Các phiên bản chính xác và tag rõ ràng vẫn được ghim.

`--pin` chỉ dành cho npm. Tùy chọn này không được hỗ trợ cùng `--marketplace`, vì các bản cài đặt marketplace lưu siêu dữ liệu nguồn marketplace thay vì một đặc tả npm.

`--dangerously-force-unsafe-install` là tùy chọn phá kính khẩn cấp cho các cảnh báo dương tính giả từ trình quét mã nguy hiểm tích hợp. Tùy chọn này cho phép cài đặt Plugin và cập nhật Plugin tiếp tục vượt qua các phát hiện `critical` tích hợp, nhưng vẫn không bỏ qua các chặn chính sách `before_install` của Plugin hoặc chặn do lỗi quét. Quá trình quét cài đặt bỏ qua các tệp và thư mục kiểm thử phổ biến như `tests/`, `__tests__/`, `*.test.*` và `*.spec.*` để tránh chặn các mock kiểm thử đã đóng gói; các entrypoint runtime đã khai báo của Plugin vẫn được quét ngay cả khi chúng dùng một trong các tên đó.

Cờ CLI này chỉ áp dụng cho các luồng cài đặt/cập nhật Plugin. Các bản cài đặt dependency của Skills được Gateway hỗ trợ dùng override yêu cầu `dangerouslyForceUnsafeInstall` tương ứng, trong khi `openclaw skills install` vẫn là luồng tải xuống/cài đặt Skills ClawHub riêng biệt.

Nếu một Plugin bạn đã xuất bản trên ClawHub bị ẩn hoặc bị chặn bởi một lần quét, hãy mở bảng điều khiển ClawHub hoặc chạy `clawhub package rescan <name>` để yêu cầu ClawHub kiểm tra lại. `--dangerously-force-unsafe-install` chỉ ảnh hưởng đến các bản cài đặt trên máy của bạn; nó không yêu cầu ClawHub quét lại Plugin hoặc công khai một bản phát hành bị chặn.

Các bundle tương thích tham gia cùng luồng liệt kê/kiểm tra/bật/tắt Plugin. Hỗ trợ runtime hiện tại bao gồm Skills trong bundle, command-skills của Claude, mặc định `settings.json` của Claude, mặc định `.lsp.json` của Claude và `lspServers` do manifest khai báo, command-skills của Cursor và các thư mục hook Codex tương thích.

`openclaw plugins inspect <id>` cũng báo cáo các khả năng bundle đã phát hiện cùng các mục máy chủ MCP và LSP được hỗ trợ hoặc không được hỗ trợ cho các Plugin dựa trên bundle.

Nguồn marketplace có thể là tên marketplace đã biết của Claude từ `~/.claude/plugins/known_marketplaces.json`, một gốc marketplace cục bộ hoặc đường dẫn `marketplace.json`, một cách viết tắt GitHub như `owner/repo`, URL repo GitHub hoặc URL git. Với marketplace từ xa, các mục Plugin phải nằm bên trong repo marketplace đã clone và chỉ dùng nguồn đường dẫn tương đối.

Xem [tham chiếu CLI `openclaw plugins`](/vi/cli/plugins) để biết đầy đủ chi tiết.

## Tổng quan Plugin API

Các Plugin native xuất một đối tượng entry cung cấp `register(api)`. Các Plugin cũ hơn vẫn có thể dùng `activate(api)` làm alias kế thừa, nhưng Plugin mới nên dùng `register`.

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

OpenClaw tải đối tượng entry và gọi `register(api)` trong quá trình kích hoạt Plugin. Loader vẫn fallback về `activate(api)` cho các Plugin cũ hơn, nhưng các Plugin đi kèm và Plugin bên ngoài mới nên xem `register` là hợp đồng công khai.

`api.registrationMode` cho Plugin biết vì sao entry của nó đang được tải:

| Chế độ          | Ý nghĩa                                                                                                                          |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | Kích hoạt runtime. Đăng ký công cụ, hook, dịch vụ, lệnh, route và các hiệu ứng phụ đang chạy khác.                              |
| `discovery`     | Khám phá khả năng chỉ đọc. Đăng ký nhà cung cấp và siêu dữ liệu; mã entry Plugin đáng tin cậy có thể tải, nhưng bỏ qua hiệu ứng phụ đang chạy. |
| `setup-only`    | Tải siêu dữ liệu thiết lập kênh thông qua một entry thiết lập nhẹ.                                                                |
| `setup-runtime` | Tải thiết lập kênh cũng cần entry runtime.                                                                         |
| `cli-metadata`  | Chỉ thu thập siêu dữ liệu lệnh CLI.                                                                                            |

Các entry Plugin mở socket, cơ sở dữ liệu, worker nền hoặc client sống lâu nên bảo vệ các hiệu ứng phụ đó bằng `api.registrationMode === "full"`. Các lần tải khám phá được cache riêng với các lần tải kích hoạt và không thay thế registry Gateway đang chạy. Khám phá là không kích hoạt, không phải không import: OpenClaw có thể đánh giá entry Plugin đáng tin cậy hoặc mô-đun Plugin kênh để xây dựng snapshot. Giữ cấp cao nhất của mô-đun nhẹ và không có hiệu ứng phụ, đồng thời chuyển client mạng, tiến trình con, listener, đọc thông tin xác thực và khởi động dịch vụ vào sau các đường dẫn full-runtime.

Các phương thức đăng ký phổ biến:

| Phương thức                             | Nội dung đăng ký             |
| --------------------------------------- | ---------------------------- |
| `registerProvider`                      | Nhà cung cấp mô hình (LLM)   |
| `registerChannel`                       | Kênh trò chuyện              |
| `registerTool`                          | Công cụ agent                |
| `registerHook` / `on(...)`              | Hook vòng đời                |
| `registerSpeechProvider`                | Chuyển văn bản thành giọng nói / STT |
| `registerRealtimeTranscriptionProvider` | STT truyền phát              |
| `registerRealtimeVoiceProvider`         | Giọng nói realtime hai chiều |
| `registerMediaUnderstandingProvider`    | Phân tích hình ảnh/âm thanh  |
| `registerImageGenerationProvider`       | Tạo hình ảnh                 |
| `registerMusicGenerationProvider`       | Tạo nhạc                     |
| `registerVideoGenerationProvider`       | Tạo video                    |
| `registerWebFetchProvider`              | Nhà cung cấp fetch / scrape web |
| `registerWebSearchProvider`             | Tìm kiếm web                 |
| `registerHttpRoute`                     | Endpoint HTTP                |
| `registerCommand` / `registerCli`       | Lệnh CLI                     |
| `registerContextEngine`                 | Context engine               |
| `registerService`                       | Dịch vụ nền                  |

Hành vi guard hook cho các hook vòng đời có kiểu:

- `before_tool_call`: `{ block: true }` là điểm kết thúc; các handler có mức ưu tiên thấp hơn bị bỏ qua.
- `before_tool_call`: `{ block: false }` là no-op và không xóa một chặn trước đó.
- `before_install`: `{ block: true }` là điểm kết thúc; các handler có mức ưu tiên thấp hơn bị bỏ qua.
- `before_install`: `{ block: false }` là no-op và không xóa một chặn trước đó.
- `message_sending`: `{ cancel: true }` là điểm kết thúc; các handler có mức ưu tiên thấp hơn bị bỏ qua.
- `message_sending`: `{ cancel: false }` là no-op và không xóa một hủy trước đó.

App-server Codex native nối cầu các sự kiện công cụ Codex-native trở lại bề mặt hook này. Plugin có thể chặn các công cụ Codex native thông qua `before_tool_call`, quan sát kết quả thông qua `after_tool_call` và tham gia phê duyệt `PermissionRequest` của Codex. Cầu nối chưa ghi lại đối số công cụ Codex-native. Ranh giới hỗ trợ runtime Codex chính xác nằm trong [hợp đồng hỗ trợ Codex harness v1](/vi/plugins/codex-harness#v1-support-contract).

Để xem đầy đủ hành vi hook có kiểu, xem [tổng quan SDK](/vi/plugins/sdk-overview#hook-decision-semantics).

## Liên quan

- [Xây dựng Plugin](/vi/plugins/building-plugins) — tạo Plugin của riêng bạn
- [Gói Plugin](/vi/plugins/bundles) — khả năng tương thích gói Codex/Claude/Cursor
- [Bản kê khai Plugin](/vi/plugins/manifest) — lược đồ bản kê khai
- [Đăng ký công cụ](/vi/plugins/building-plugins#registering-agent-tools) — thêm công cụ agent trong Plugin
- [Nội bộ Plugin](/vi/plugins/architecture) — mô hình capability và pipeline tải
- [Plugin cộng đồng](/vi/plugins/community) — danh sách của bên thứ ba
