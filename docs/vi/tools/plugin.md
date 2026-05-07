---
read_when:
    - Cài đặt hoặc cấu hình Plugin
    - Tìm hiểu về cơ chế phát hiện Plugin và quy tắc tải
    - Làm việc với các gói Plugin tương thích với Codex/Claude
sidebarTitle: Install and Configure
summary: Cài đặt, cấu hình và quản lý các Plugin OpenClaw
title: Plugin
x-i18n:
    generated_at: "2026-05-07T01:54:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 91c476a2e3d7078ac3af22767a22afec685a25707b9aebf36e1ed7b3fdc87961
    source_path: tools/plugin.md
    workflow: 16
---

Các Plugin mở rộng OpenClaw với những khả năng mới: kênh, nhà cung cấp mô hình,
bộ khung tác tử, công cụ, Skills, giọng nói, phiên âm thời gian thực, thoại
thời gian thực, hiểu nội dung phương tiện, tạo hình ảnh, tạo video, truy xuất web, tìm
kiếm web, và hơn thế nữa. Một số Plugin là **lõi** (được phát hành kèm OpenClaw), số khác
là **bên ngoài**. Hầu hết Plugin bên ngoài được phát hành và khám phá thông qua
[ClawHub](/vi/tools/clawhub). Npm vẫn được hỗ trợ cho cài đặt trực tiếp và cho một
tập tạm thời các gói Plugin do OpenClaw sở hữu trong khi quá trình di chuyển đó hoàn tất.

## Bắt đầu nhanh

Để xem ví dụ cài đặt, liệt kê, gỡ cài đặt, cập nhật và phát hành có thể sao chép-dán, xem
[Quản lý Plugin](/vi/plugins/manage-plugins).

<Steps>
  <Step title="Xem những gì đã được tải">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="Cài đặt Plugin">
    ```bash
    # Search ClawHub plugins
    openclaw plugins search "calendar"

    # From ClawHub
    openclaw plugins install clawhub:openclaw-codex-app-server

    # From npm
    openclaw plugins install npm:@acme/openclaw-plugin
    openclaw plugins install npm-pack:./openclaw-plugin-1.2.3.tgz

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

  <Step title="Quản lý ngay trong chat">
    Trong một Gateway đang chạy, `/plugins enable` và `/plugins disable` chỉ dành cho chủ sở hữu
    sẽ kích hoạt bộ tải lại cấu hình Gateway. Gateway tải lại các bề mặt runtime của Plugin
    trong tiến trình, và các lượt tác tử mới dựng lại danh sách công cụ từ registry
    đã được làm mới. `/plugins install` thay đổi mã nguồn Plugin, vì vậy
    Gateway yêu cầu khởi động lại thay vì giả vờ rằng tiến trình hiện tại có thể
    tải lại an toàn các mô-đun đã được nhập.

  </Step>

  <Step title="Xác minh Plugin">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json

    # If the plugin registered a CLI root, run one command from that root.
    openclaw <plugin-command> --help
    ```

    Dùng `--runtime` khi bạn cần chứng minh các công cụ, dịch vụ, phương thức Gateway,
    hook, hoặc lệnh CLI do Plugin sở hữu đã được đăng ký. `inspect` thông thường là một phép kiểm tra
    manifest/registry lạnh và có chủ đích tránh nhập runtime của Plugin.

  </Step>
</Steps>

Nếu bạn muốn điều khiển ngay trong chat, hãy bật `commands.plugins: true` và dùng:

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

Đường dẫn cài đặt dùng cùng bộ phân giải như CLI: đường dẫn/kho lưu trữ cục bộ, rõ ràng
`clawhub:<pkg>`, rõ ràng `npm:<pkg>`, rõ ràng `npm-pack:<path.tgz>`,
rõ ràng `git:<repo>`, hoặc đặc tả gói trần thông qua npm.

Nếu cấu hình không hợp lệ, cài đặt thường thất bại đóng và chỉ bạn tới
`openclaw doctor --fix`. Ngoại lệ khôi phục duy nhất là một đường dẫn cài đặt lại
Plugin tích hợp hẹp cho các Plugin chọn tham gia
`openclaw.install.allowInvalidConfigRecovery`.
Trong khi Gateway khởi động, cấu hình Plugin không hợp lệ thất bại đóng như mọi cấu hình không hợp lệ khác.
Chạy `openclaw doctor --fix` để cách ly cấu hình Plugin lỗi bằng cách
vô hiệu hóa mục nhập Plugin đó và xóa payload cấu hình không hợp lệ của nó; bản sao lưu
cấu hình thông thường giữ lại các giá trị trước đó.
Khi cấu hình kênh tham chiếu tới một Plugin không còn có thể khám phá nhưng cùng
id Plugin cũ vẫn còn trong cấu hình Plugin hoặc bản ghi cài đặt, quá trình khởi động Gateway
ghi cảnh báo và bỏ qua kênh đó thay vì chặn mọi kênh khác.
Chạy `openclaw doctor --fix` để xóa các mục nhập kênh/Plugin cũ; các khóa
kênh không xác định không có bằng chứng Plugin cũ vẫn thất bại xác thực để lỗi gõ nhầm
vẫn hiển thị.
Nếu đặt `plugins.enabled: false`, các tham chiếu Plugin cũ được coi là bất hoạt:
quá trình khởi động Gateway bỏ qua việc khám phá/tải Plugin và `openclaw doctor` giữ nguyên
cấu hình Plugin đã tắt thay vì tự động xóa nó. Bật lại Plugin trước khi
chạy dọn dẹp doctor nếu bạn muốn xóa các id Plugin cũ.

Việc cài đặt phụ thuộc Plugin chỉ xảy ra trong các luồng cài đặt/cập nhật rõ ràng hoặc
sửa chữa bằng doctor. Khởi động Gateway, tải lại cấu hình, và kiểm tra runtime
không chạy trình quản lý gói hoặc sửa cây phụ thuộc. Plugin cục bộ phải đã
cài đặt sẵn phụ thuộc của chúng, còn Plugin npm, git, và ClawHub được
cài đặt dưới các gốc Plugin do OpenClaw quản lý. Phụ thuộc npm có thể được hoist
trong gốc npm do OpenClaw quản lý; cài đặt/cập nhật quét gốc được quản lý đó trước
khi tin cậy và gỡ cài đặt xóa các gói do npm quản lý thông qua npm. Plugin bên ngoài
và đường dẫn tải tùy chỉnh vẫn phải được cài đặt qua `openclaw plugins install`.
Dùng `openclaw plugins list --json` để xem `dependencyStatus` tĩnh cho từng
Plugin hiển thị mà không nhập mã runtime hoặc sửa phụ thuộc.
Xem [Phân giải phụ thuộc Plugin](/vi/plugins/dependency-resolution) để biết vòng đời
khi cài đặt.

### Quyền sở hữu đường dẫn Plugin bị chặn

Nếu chẩn đoán Plugin báo
`blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
và xác thực cấu hình tiếp theo với `plugin present but blocked`, OpenClaw đã tìm thấy
các tệp Plugin thuộc sở hữu của một người dùng Unix khác với tiến trình đang tải
chúng. Giữ nguyên cấu hình Plugin; sửa quyền sở hữu hệ thống tệp hoặc chạy
OpenClaw bằng cùng người dùng sở hữu thư mục trạng thái.

Đối với cài đặt Docker, image chính thức chạy dưới `node` (uid `1000`), vì vậy
các thư mục cấu hình và workspace OpenClaw được bind mount từ host thường nên
thuộc sở hữu uid `1000`:

```bash
sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
```

Nếu bạn cố ý chạy OpenClaw dưới root, hãy sửa gốc Plugin được quản lý thành
quyền sở hữu root thay vào đó:

```bash
sudo chown -R root:root /path/to/openclaw-config/npm
```

Sau khi sửa quyền sở hữu, chạy lại `openclaw doctor --fix` hoặc
`openclaw plugins registry --refresh` để registry Plugin đã lưu khớp với
các tệp đã sửa.

Đối với cài đặt npm, các selector có thể thay đổi như `latest` hoặc dist-tag được phân giải
trước khi cài đặt rồi được ghim vào phiên bản chính xác đã xác minh trong gốc npm
do OpenClaw quản lý. Sau khi npm hoàn tất, OpenClaw xác minh mục
`package-lock.json` đã cài đặt vẫn khớp với phiên bản và tính toàn vẹn đã phân giải. Nếu
npm ghi metadata gói khác, quá trình cài đặt thất bại và gói được quản lý
được rollback thay vì chấp nhận một artifact Plugin khác.
Các gốc npm được quản lý cũng kế thừa `overrides` npm cấp gói của OpenClaw, vì vậy
các pin bảo mật bảo vệ host đóng gói cũng áp dụng cho phụ thuộc Plugin bên ngoài
được hoist.

Checkout nguồn là các workspace pnpm. Nếu bạn clone OpenClaw để chỉnh sửa Plugin
tích hợp, hãy chạy `pnpm install`; sau đó OpenClaw tải Plugin tích hợp từ
`extensions/<id>` để các chỉnh sửa và phụ thuộc cục bộ theo gói được dùng trực tiếp.
Cài đặt gốc npm thông thường dành cho OpenClaw đóng gói, không phải phát triển
bằng checkout nguồn.

## Các loại Plugin

OpenClaw nhận diện hai định dạng Plugin:

| Định dạng  | Cách hoạt động                                                   | Ví dụ                                                  |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + mô-đun runtime; thực thi trong tiến trình | Plugin chính thức, gói npm cộng đồng                   |
| **Bundle** | Bố cục tương thích Codex/Claude/Cursor; ánh xạ sang tính năng OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Cả hai đều xuất hiện dưới `openclaw plugins list`. Xem [Plugin Bundles](/vi/plugins/bundles) để biết chi tiết về bundle.

Nếu bạn đang viết một Plugin native, hãy bắt đầu với [Xây dựng Plugin](/vi/plugins/building-plugins)
và [Tổng quan Plugin SDK](/vi/plugins/sdk-overview).

## Điểm vào gói

Các gói npm Plugin native phải khai báo `openclaw.extensions` trong `package.json`.
Mỗi mục phải nằm bên trong thư mục gói và phân giải tới một tệp
runtime có thể đọc, hoặc tới một tệp nguồn TypeScript có peer JavaScript đã build
được suy luận, chẳng hạn `src/index.ts` tới `dist/index.js`.
Cài đặt đóng gói phải phát hành đầu ra runtime JavaScript đó. Phương án dự phòng
nguồn TypeScript dành cho checkout nguồn và đường dẫn phát triển cục bộ, không dành cho
gói npm được cài đặt vào gốc Plugin do OpenClaw quản lý.

Nếu cảnh báo gói được quản lý nói rằng nó `requires compiled runtime output for
TypeScript entry ...`, gói đã được phát hành mà không có các tệp JavaScript
OpenClaw cần ở runtime. Đó là vấn đề đóng gói Plugin, không phải vấn đề cấu hình
cục bộ. Cập nhật hoặc cài đặt lại Plugin sau khi nhà phát hành phát hành lại JavaScript
đã biên dịch, hoặc tắt/gỡ cài đặt Plugin đó cho tới khi có gói đã sửa.

Dùng `openclaw.runtimeExtensions` khi các tệp runtime đã phát hành không nằm ở
cùng đường dẫn với các mục nguồn. Khi có mặt, `runtimeExtensions` phải chứa
chính xác một mục cho mỗi mục `extensions`. Danh sách không khớp sẽ làm cài đặt và
khám phá Plugin thất bại thay vì âm thầm quay về đường dẫn nguồn. Nếu bạn cũng
phát hành `openclaw.setupEntry`, hãy dùng `openclaw.runtimeSetupEntry` cho peer
JavaScript đã build của nó; tệp đó là bắt buộc khi đã khai báo.

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
OpenClaw đóng gói hiện tại đã tích hợp nhiều Plugin chính thức, nên chúng không cần
cài đặt npm riêng trong thiết lập thông thường. Cho tới khi mọi Plugin do OpenClaw sở hữu
đã chuyển sang ClawHub, OpenClaw vẫn phát hành một số gói Plugin `@openclaw/*` trên
npm cho cài đặt cũ/tùy chỉnh và quy trình npm trực tiếp.

Nếu npm báo một gói Plugin `@openclaw/*` là deprecated, phiên bản gói đó
thuộc một tuyến gói bên ngoài cũ hơn. Dùng Plugin tích hợp từ
OpenClaw hiện tại hoặc một checkout cục bộ cho tới khi gói npm mới hơn được phát hành.

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

  <Accordion title="Memory plugins">
    - `memory-core` - tìm kiếm bộ nhớ đi kèm (mặc định qua `plugins.slots.memory`)
    - `memory-lancedb` - bộ nhớ dài hạn dựa trên LanceDB với tự động gọi lại/ghi nhận (đặt `plugins.slots.memory = "memory-lancedb"`)

    Xem [Memory LanceDB](/vi/plugins/memory-lancedb) để biết cách thiết lập embedding tương thích OpenAI, ví dụ Ollama, giới hạn gọi lại và khắc phục sự cố.

  </Accordion>

  <Accordion title="Speech providers (enabled by default)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Other">
    - `browser` - plugin trình duyệt đi kèm cho công cụ trình duyệt, CLI `openclaw browser`, phương thức gateway `browser.request`, runtime trình duyệt và dịch vụ điều khiển trình duyệt mặc định (được bật theo mặc định; hãy tắt trước khi thay thế)
    - `copilot-proxy` - cầu nối VS Code Copilot Proxy (bị tắt theo mặc định)

  </Accordion>
</AccordionGroup>

Đang tìm plugin của bên thứ ba? Xem [Plugin cộng đồng](/vi/plugins/community).

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

| Trường            | Mô tả                                                      |
| ------------------ | --------------------------------------------------------- |
| `enabled`          | Công tắc chính (mặc định: `true`)                         |
| `allow`            | Danh sách cho phép plugin (tùy chọn)                      |
| `bundledDiscovery` | Chế độ khám phá plugin đi kèm (mặc định là `allowlist`)   |
| `deny`             | Danh sách chặn plugin (tùy chọn; chặn được ưu tiên)       |
| `load.paths`       | Tệp/thư mục plugin bổ sung                                |
| `slots`            | Bộ chọn slot độc quyền (ví dụ: `memory`, `contextEngine`) |
| `entries.\<id\>`   | Bật/tắt + cấu hình theo từng plugin                       |

`plugins.allow` có tính loại trừ. Khi không rỗng, chỉ các plugin được liệt kê mới có thể tải hoặc hiển thị công cụ, ngay cả khi `tools.allow` chứa `"*"` hoặc tên công cụ cụ thể thuộc sở hữu của plugin. Nếu danh sách cho phép công cụ tham chiếu các công cụ plugin, hãy thêm id plugin sở hữu vào `plugins.allow` hoặc xóa `plugins.allow`; `openclaw doctor` sẽ cảnh báo về dạng này.

`plugins.bundledDiscovery` mặc định là `"allowlist"` cho cấu hình mới, nên một danh mục `plugins.allow` hạn chế cũng chặn các plugin nhà cung cấp đi kèm bị bỏ sót, bao gồm cả khám phá nhà cung cấp tìm kiếm web runtime. Doctor đóng dấu các cấu hình allowlist hạn chế cũ bằng `"compat"` trong quá trình di chuyển để các bản nâng cấp giữ hành vi nhà cung cấp đi kèm cũ cho đến khi người vận hành chọn dùng chế độ nghiêm ngặt hơn. `plugins.allow` rỗng vẫn được xem là chưa đặt/mở.

Các thay đổi cấu hình được thực hiện qua `/plugins enable` hoặc `/plugins disable` sẽ kích hoạt tải lại plugin Gateway trong tiến trình. Các lượt agent mới xây dựng lại danh sách công cụ từ sổ đăng ký plugin đã được làm mới. Các thao tác thay đổi nguồn như cài đặt, cập nhật và gỡ cài đặt vẫn khởi động lại tiến trình Gateway vì các mô-đun plugin đã được import không thể được thay thế tại chỗ một cách an toàn.

`openclaw plugins list` là ảnh chụp cục bộ của sổ đăng ký/cấu hình plugin. Một plugin `enabled` ở đó nghĩa là sổ đăng ký đã lưu và cấu hình hiện tại cho phép plugin tham gia. Điều đó không chứng minh rằng một Gateway từ xa đang chạy đã tải lại hoặc khởi động lại vào cùng mã plugin. Trên thiết lập VPS/container có tiến trình wrapper, hãy gửi lệnh khởi động lại hoặc ghi kích hoạt tải lại tới đúng tiến trình `openclaw gateway run`, hoặc dùng `openclaw gateway restart` với Gateway đang chạy khi báo cáo tải lại cho biết lỗi.

<Accordion title="Plugin states: disabled vs missing vs invalid">
  - **Đã tắt**: plugin tồn tại nhưng các quy tắc bật đã tắt nó. Cấu hình được giữ nguyên.
  - **Thiếu**: cấu hình tham chiếu một id plugin mà quá trình khám phá không tìm thấy.
  - **Không hợp lệ**: plugin tồn tại nhưng cấu hình của nó không khớp với schema đã khai báo. Khởi động Gateway chỉ bỏ qua plugin đó; `openclaw doctor --fix` có thể cách ly mục không hợp lệ bằng cách tắt nó và xóa payload cấu hình của nó.

</Accordion>

## Khám phá và thứ tự ưu tiên

OpenClaw quét plugin theo thứ tự này (kết quả khớp đầu tiên được dùng):

<Steps>
  <Step title="Config paths">
    `plugins.load.paths` - đường dẫn tệp hoặc thư mục rõ ràng. Các đường dẫn trỏ ngược về thư mục plugin đi kèm đã đóng gói của chính OpenClaw sẽ bị bỏ qua; chạy `openclaw doctor --fix` để xóa các bí danh cũ đó.
  </Step>

  <Step title="Workspace plugins">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` và `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Global plugins">
    `~/.openclaw/<plugin-root>/*.ts` và `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Bundled plugins">
    Được phát hành cùng OpenClaw. Nhiều plugin được bật theo mặc định (nhà cung cấp mô hình, giọng nói). Những plugin khác cần được bật rõ ràng.
  </Step>
</Steps>

Các bản cài đặt đóng gói và image Docker thường phân giải plugin đi kèm từ cây `dist/extensions` đã biên dịch. Nếu một thư mục nguồn plugin đi kèm được bind-mount đè lên đường dẫn nguồn đóng gói tương ứng, ví dụ `/app/extensions/synology-chat`, OpenClaw xem thư mục nguồn được mount đó là một lớp phủ nguồn đi kèm và khám phá nó trước bundle `/app/dist/extensions/synology-chat` đã đóng gói. Điều này giữ cho các vòng lặp container của maintainer hoạt động mà không cần chuyển mọi plugin đi kèm về nguồn TypeScript. Đặt `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1` để buộc dùng các bundle dist đã đóng gói ngay cả khi có mount lớp phủ nguồn.

### Quy tắc bật

- `plugins.enabled: false` tắt tất cả plugin và bỏ qua công việc khám phá/tải plugin
- `plugins.deny` luôn được ưu tiên hơn allow
- `plugins.entries.\<id\>.enabled: false` tắt plugin đó
- Plugin có nguồn gốc workspace bị **tắt theo mặc định** (phải được bật rõ ràng)
- Plugin đi kèm tuân theo tập mặc định bật sẵn tích hợp trừ khi bị ghi đè
- Các slot độc quyền có thể buộc bật plugin được chọn cho slot đó
- Một số plugin đi kèm dạng chọn tham gia được bật tự động khi cấu hình nêu tên một bề mặt thuộc sở hữu plugin, chẳng hạn như tham chiếu mô hình nhà cung cấp, cấu hình kênh hoặc runtime harness
- Cấu hình plugin cũ được giữ lại khi `plugins.enabled: false` đang hoạt động; bật lại plugin trước khi chạy dọn dẹp bằng doctor nếu bạn muốn xóa các id cũ
- Các tuyến Codex thuộc họ OpenAI giữ ranh giới plugin riêng:
  `openai-codex/*` thuộc về plugin OpenAI, trong khi plugin app-server Codex đi kèm được chọn bằng `agentRuntime.id: "codex"` hoặc các tham chiếu mô hình `codex/*` cũ

## Khắc phục sự cố hook runtime

Nếu một plugin xuất hiện trong `plugins list` nhưng hiệu ứng phụ hoặc hook `register(api)` không chạy trong lưu lượng trò chuyện trực tiếp, hãy kiểm tra những mục này trước:

- Chạy `openclaw gateway status --deep --require-rpc` và xác nhận URL Gateway, hồ sơ, đường dẫn cấu hình và tiến trình đang hoạt động đúng là những thứ bạn đang chỉnh sửa.
- Khởi động lại Gateway trực tiếp sau các thay đổi cài đặt/cấu hình/mã plugin. Trong container wrapper, PID 1 có thể chỉ là supervisor; hãy khởi động lại hoặc gửi tín hiệu tới tiến trình con `openclaw gateway run`.
- Dùng `openclaw plugins inspect <id> --runtime --json` để xác nhận các đăng ký hook và chẩn đoán. Các hook hội thoại không đi kèm như `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `llm_input`, `llm_output`, `before_agent_finalize` và `agent_end` cần `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- Để chuyển đổi mô hình, ưu tiên `before_model_resolve`. Nó chạy trước bước phân giải mô hình cho các lượt agent; `llm_output` chỉ chạy sau khi một lần thử mô hình tạo ra đầu ra assistant.
- Để chứng minh mô hình phiên hiệu dụng, hãy dùng `openclaw sessions` hoặc các bề mặt phiên/trạng thái Gateway và, khi gỡ lỗi payload nhà cung cấp, khởi động Gateway với `--raw-stream --raw-stream-path <path>`.

### Thiết lập công cụ plugin chậm

Nếu các lượt agent có vẻ bị khựng khi chuẩn bị công cụ, hãy bật ghi log trace và kiểm tra các dòng thời gian của factory công cụ plugin:

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

Tìm:

```text
[trace:plugin-tools] factory timings ...
```

Tóm tắt liệt kê tổng thời gian factory và các factory công cụ plugin chậm nhất, bao gồm id plugin, tên công cụ đã khai báo, dạng kết quả và công cụ có tùy chọn hay không. Các dòng chậm được nâng thành cảnh báo khi một factory đơn lẻ mất ít nhất 1 giây hoặc tổng thời gian chuẩn bị factory công cụ plugin mất ít nhất 5 giây.

OpenClaw lưu cache các kết quả factory công cụ plugin thành công cho các lần phân giải lặp lại với cùng ngữ cảnh yêu cầu hiệu dụng. Khóa cache bao gồm cấu hình runtime hiệu dụng, workspace, id agent/phiên, chính sách sandbox, cài đặt trình duyệt, ngữ cảnh phân phối, danh tính requester và trạng thái sở hữu, nên các factory phụ thuộc vào những trường đáng tin cậy đó sẽ được chạy lại khi ngữ cảnh thay đổi.

Nếu một plugin chiếm phần lớn thời gian, hãy kiểm tra các đăng ký runtime của nó:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

Sau đó cập nhật, cài đặt lại hoặc tắt plugin đó. Tác giả plugin nên chuyển việc tải dependency tốn kém ra sau đường dẫn thực thi công cụ thay vì thực hiện bên trong factory công cụ.

### Trùng quyền sở hữu kênh hoặc công cụ

Triệu chứng:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

Những thông báo này nghĩa là có nhiều hơn một plugin đã bật đang cố sở hữu cùng một kênh, luồng thiết lập hoặc tên công cụ. Nguyên nhân phổ biến nhất là một plugin kênh bên ngoài được cài đặt cạnh một plugin đi kèm hiện cung cấp cùng id kênh.

Các bước gỡ lỗi:

- Chạy `openclaw plugins list --enabled --verbose` để xem mọi plugin đã bật và nguồn gốc.
- Chạy `openclaw plugins inspect <id> --runtime --json` cho từng plugin nghi ngờ và so sánh `channels`, `channelConfigs`, `tools` và chẩn đoán.
- Chạy `openclaw plugins registry --refresh` sau khi cài đặt hoặc gỡ bỏ các gói plugin để metadata đã lưu phản ánh bản cài đặt hiện tại.
- Khởi động lại Gateway sau các thay đổi cài đặt, sổ đăng ký hoặc cấu hình.

Tùy chọn sửa:

- Nếu một plugin cố ý thay thế plugin khác cho cùng id kênh, plugin được ưu tiên nên khai báo `channelConfigs.<channel-id>.preferOver` với id plugin có độ ưu tiên thấp hơn. Xem [/plugins/manifest#replacing-another-channel-plugin](/vi/plugins/manifest#replacing-another-channel-plugin).
- Nếu trùng lặp là ngoài ý muốn, hãy tắt một bên bằng `plugins.entries.<plugin-id>.enabled: false` hoặc xóa bản cài đặt plugin cũ.
- Nếu bạn đã bật rõ ràng cả hai plugin, OpenClaw giữ yêu cầu đó và báo cáo xung đột. Chọn một chủ sở hữu cho kênh hoặc đổi tên các công cụ thuộc sở hữu plugin để bề mặt runtime rõ ràng.

## Slot plugin (danh mục độc quyền)

Một số danh mục là độc quyền (mỗi lần chỉ một danh mục hoạt động):

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

| Slot            | Nội dung điều khiển      | Mặc định            |
| --------------- | ------------------------ | ------------------- |
| `memory`        | Plugin bộ nhớ hoạt động  | `memory-core`       |
| `contextEngine` | Công cụ ngữ cảnh hoạt động | `legacy` (tích hợp) |

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

Các Plugin đi kèm được phát hành cùng OpenClaw. Nhiều Plugin được bật theo mặc định (ví dụ như các trình cung cấp mô hình đi kèm, trình cung cấp giọng nói đi kèm và Plugin trình duyệt đi kèm). Các Plugin đi kèm khác vẫn cần `openclaw plugins enable <id>`.

`--force` ghi đè Plugin hoặc gói hook đã cài đặt hiện có ngay tại chỗ. Dùng `openclaw plugins update <id-or-npm-spec>` cho các lần nâng cấp thường kỳ của các Plugin npm đang được theo dõi. Tùy chọn này không được hỗ trợ với `--link`, vì tùy chọn đó tái sử dụng đường dẫn nguồn thay vì sao chép lên đích cài đặt được quản lý.

Khi `plugins.allow` đã được đặt, `openclaw plugins install` thêm id Plugin đã cài đặt vào danh sách cho phép đó trước khi bật Plugin. Nếu cùng id Plugin đó có trong `plugins.deny`, lệnh cài đặt sẽ xóa mục từ chối đã cũ đó để lượt cài đặt tường minh có thể được tải ngay sau khi khởi động lại.

OpenClaw giữ một registry Plugin cục bộ được lưu bền vững làm mô hình đọc lạnh cho kiểm kê Plugin, quyền sở hữu đóng góp và lập kế hoạch khởi động. Các luồng cài đặt, cập nhật, gỡ cài đặt, bật và tắt sẽ làm mới registry đó sau khi thay đổi trạng thái Plugin. Cùng tệp `plugins/installs.json` giữ metadata cài đặt bền vững trong `installRecords` cấp cao nhất và metadata manifest có thể xây dựng lại trong `plugins`. Nếu registry bị thiếu, cũ hoặc không hợp lệ, `openclaw plugins registry --refresh` xây dựng lại chế độ xem manifest của nó từ các bản ghi cài đặt, chính sách cấu hình và metadata manifest/package mà không tải các module runtime của Plugin.

Trong chế độ Nix (`OPENCLAW_NIX_MODE=1`), các thao tác thay đổi vòng đời Plugin bị tắt. Thay vào đó, hãy quản lý lựa chọn package Plugin và cấu hình thông qua nguồn Nix cho bản cài đặt; với nix-openclaw, hãy bắt đầu bằng [Khởi động nhanh](https://github.com/openclaw/nix-openclaw#quick-start) theo hướng agent-first.
`openclaw plugins update <id-or-npm-spec>` áp dụng cho các bản cài đặt đang được theo dõi. Truyền một spec package npm với dist-tag hoặc phiên bản chính xác sẽ phân giải tên package trở lại bản ghi Plugin đang được theo dõi và ghi lại spec mới cho các lần cập nhật trong tương lai. Truyền tên package không kèm phiên bản sẽ đưa một bản cài đặt được ghim chính xác trở lại dòng phát hành mặc định của registry. Nếu Plugin npm đã cài đặt đã khớp với phiên bản đã phân giải và định danh artifact đã ghi, OpenClaw sẽ bỏ qua cập nhật mà không tải xuống, cài đặt lại hoặc ghi lại cấu hình.
Khi `openclaw update` chạy trên kênh beta, các bản ghi Plugin npm và ClawHub thuộc dòng mặc định sẽ thử `@beta` trước và quay về default/latest khi không có bản phát hành beta của Plugin. Các phiên bản chính xác và tag tường minh vẫn được ghim.

OpenClaw chưa cung cấp các kênh Plugin hỗ trợ LTS hoặc hằng tháng. Công việc theo kế hoạch cho dòng hỗ trợ hằng tháng sẽ cần các tag npm và ClawHub của Plugin đi theo cùng dòng hỗ trợ với package lõi thay vì âm thầm dùng `latest`.

`--pin` chỉ dành cho npm. Tùy chọn này không được hỗ trợ với `--marketplace`, vì các bản cài đặt marketplace lưu metadata nguồn marketplace thay vì spec npm.

`--dangerously-force-unsafe-install` là tùy chọn ghi đè khẩn cấp cho các cảnh báo dương tính giả từ trình quét mã nguy hiểm tích hợp. Tùy chọn này cho phép các lượt cài đặt Plugin và cập nhật Plugin tiếp tục vượt qua các phát hiện `critical` tích hợp, nhưng vẫn không bỏ qua các chặn chính sách `before_install` của Plugin hoặc việc chặn khi quét thất bại. Các lượt quét cài đặt bỏ qua những tệp và thư mục kiểm thử phổ biến như `tests/`, `__tests__/`, `*.test.*` và `*.spec.*` để tránh chặn các mock kiểm thử đã được đóng gói; các entrypoint runtime đã khai báo của Plugin vẫn được quét ngay cả khi chúng dùng một trong các tên đó.

Cờ CLI này chỉ áp dụng cho các luồng cài đặt/cập nhật Plugin. Các lượt cài đặt phụ thuộc Skills dựa trên Gateway dùng tùy chọn ghi đè yêu cầu `dangerouslyForceUnsafeInstall` tương ứng, trong khi `openclaw skills install` vẫn là luồng tải xuống/cài đặt Skills ClawHub riêng biệt.

Nếu một Plugin bạn đã phát hành trên ClawHub bị ẩn hoặc bị chặn bởi lượt quét, hãy mở bảng điều khiển ClawHub hoặc chạy `clawhub package rescan <name>` để yêu cầu ClawHub kiểm tra lại. `--dangerously-force-unsafe-install` chỉ ảnh hưởng đến các lượt cài đặt trên máy của bạn; nó không yêu cầu ClawHub quét lại Plugin hoặc công khai một bản phát hành bị chặn.

Các bundle tương thích tham gia cùng luồng liệt kê/inspect/bật/tắt Plugin. Hỗ trợ runtime hiện tại bao gồm Skills trong bundle, command-skills của Claude, mặc định `settings.json` của Claude, mặc định `.lsp.json` của Claude và `lspServers` khai báo trong manifest, command-skills của Cursor và các thư mục hook Codex tương thích.

`openclaw plugins inspect <id>` cũng báo cáo các khả năng bundle đã phát hiện cùng các mục máy chủ MCP và LSP được hỗ trợ hoặc không được hỗ trợ cho các Plugin dựa trên bundle.

Nguồn marketplace có thể là tên marketplace đã biết của Claude từ `~/.claude/plugins/known_marketplaces.json`, một gốc marketplace cục bộ hoặc đường dẫn `marketplace.json`, cách viết tắt GitHub như `owner/repo`, URL repo GitHub hoặc URL git. Với marketplace từ xa, các mục Plugin phải nằm trong repo marketplace đã clone và chỉ dùng nguồn đường dẫn tương đối.

Xem [tham chiếu CLI `openclaw plugins`](/vi/cli/plugins) để biết đầy đủ chi tiết.

## Tổng quan API Plugin

Các Plugin gốc xuất một đối tượng entry cung cấp `register(api)`. Các Plugin cũ hơn vẫn có thể dùng `activate(api)` làm alias kế thừa, nhưng Plugin mới nên dùng `register`.

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

OpenClaw tải đối tượng entry và gọi `register(api)` trong quá trình kích hoạt Plugin. Loader vẫn quay về `activate(api)` cho các Plugin cũ hơn, nhưng các Plugin đi kèm và Plugin bên ngoài mới nên xem `register` là hợp đồng công khai.

`api.registrationMode` cho Plugin biết lý do entry của nó đang được tải:

| Chế độ          | Ý nghĩa                                                                                                                          |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | Kích hoạt runtime. Đăng ký công cụ, hook, dịch vụ, lệnh, route và các hiệu ứng phụ live khác.                                    |
| `discovery`     | Khám phá khả năng chỉ đọc. Đăng ký trình cung cấp và metadata; mã entry Plugin đáng tin cậy có thể tải, nhưng bỏ qua hiệu ứng phụ live. |
| `setup-only`    | Tải metadata thiết lập kênh thông qua entry thiết lập nhẹ.                                                                       |
| `setup-runtime` | Tải thiết lập kênh cũng cần entry runtime.                                                                                       |
| `cli-metadata`  | Chỉ thu thập metadata lệnh CLI.                                                                                                  |

Các entry Plugin mở socket, cơ sở dữ liệu, worker nền hoặc client tồn tại lâu nên bảo vệ các hiệu ứng phụ đó bằng `api.registrationMode === "full"`. Các lượt tải khám phá được cache riêng với lượt tải kích hoạt và không thay thế registry Gateway đang chạy. Khám phá là không kích hoạt, không phải không import: OpenClaw có thể đánh giá entry Plugin đáng tin cậy hoặc module Plugin kênh để xây dựng snapshot. Giữ cấp cao nhất của module nhẹ và không có hiệu ứng phụ, đồng thời chuyển client mạng, subprocess, listener, lượt đọc credential và khởi động dịch vụ vào sau các đường dẫn full-runtime.

Các phương thức đăng ký thường dùng:

| Phương thức                             | Nội dung đăng ký              |
| --------------------------------------- | ----------------------------- |
| `registerProvider`                      | Trình cung cấp mô hình (LLM)  |
| `registerChannel`                       | Kênh trò chuyện               |
| `registerTool`                          | Công cụ agent                 |
| `registerHook` / `on(...)`              | Hook vòng đời                 |
| `registerSpeechProvider`                | Text-to-speech / STT          |
| `registerRealtimeTranscriptionProvider` | STT phát trực tuyến           |
| `registerRealtimeVoiceProvider`         | Giọng nói realtime hai chiều  |
| `registerMediaUnderstandingProvider`    | Phân tích hình ảnh/âm thanh   |
| `registerImageGenerationProvider`       | Tạo hình ảnh                  |
| `registerMusicGenerationProvider`       | Tạo nhạc                      |
| `registerVideoGenerationProvider`       | Tạo video                     |
| `registerWebFetchProvider`              | Trình cung cấp fetch / scrape web |
| `registerWebSearchProvider`             | Tìm kiếm web                  |
| `registerHttpRoute`                     | Endpoint HTTP                 |
| `registerCommand` / `registerCli`       | Lệnh CLI                      |
| `registerContextEngine`                 | Context engine                |
| `registerService`                       | Dịch vụ nền                   |

Hành vi guard hook cho các hook vòng đời có kiểu:

- `before_tool_call`: `{ block: true }` là kết thúc; các handler có mức ưu tiên thấp hơn bị bỏ qua.
- `before_tool_call`: `{ block: false }` là no-op và không xóa một block trước đó.
- `before_install`: `{ block: true }` là kết thúc; các handler có mức ưu tiên thấp hơn bị bỏ qua.
- `before_install`: `{ block: false }` là no-op và không xóa một block trước đó.
- `message_sending`: `{ cancel: true }` là kết thúc; các handler có mức ưu tiên thấp hơn bị bỏ qua.
- `message_sending`: `{ cancel: false }` là no-op và không xóa một cancel trước đó.

Native Codex app-server chạy các sự kiện công cụ gốc của Codex qua cầu nối trở lại bề mặt hook này. Các Plugin có thể chặn công cụ gốc của Codex thông qua `before_tool_call`, quan sát kết quả thông qua `after_tool_call`, và tham gia phê duyệt `PermissionRequest` của Codex. Cầu nối hiện chưa viết lại các đối số công cụ gốc của Codex. Ranh giới hỗ trợ runtime Codex chính xác nằm trong [hợp đồng hỗ trợ Codex harness v1](/vi/plugins/codex-harness#v1-support-contract).

Để xem đầy đủ hành vi hook có kiểu, hãy xem [tổng quan SDK](/vi/plugins/sdk-overview#hook-decision-semantics).

## Liên quan

- [Xây dựng Plugin](/vi/plugins/building-plugins) - tạo Plugin của riêng bạn
- [Gói Plugin](/vi/plugins/bundles) - khả năng tương thích gói Codex/Claude/Cursor
- [Manifest Plugin](/vi/plugins/manifest) - schema manifest
- [Đăng ký công cụ](/vi/plugins/building-plugins#registering-agent-tools) - thêm công cụ agent trong Plugin
- [Nội bộ Plugin](/vi/plugins/architecture) - mô hình capability và pipeline tải
- [Plugin cộng đồng](/vi/plugins/community) - danh sách bên thứ ba
