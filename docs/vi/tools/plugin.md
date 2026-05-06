---
read_when:
    - Cài đặt hoặc cấu hình Plugin
    - Tìm hiểu về quy tắc phát hiện và tải Plugin
    - Làm việc với các gói plugin tương thích với Codex/Claude
sidebarTitle: Install and Configure
summary: Cài đặt, cấu hình và quản lý các Plugin OpenClaw
title: Plugin
x-i18n:
    generated_at: "2026-05-06T10:57:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: ad3000dbd6dd660f4dbab9a25c476e4c4e3fba0a9781ae344ea3cc147598d0b0
    source_path: tools/plugin.md
    workflow: 16
---

Plugins mở rộng OpenClaw bằng các khả năng mới: kênh, nhà cung cấp mô hình,
bộ khung agent, công cụ, Skills, giọng nói, phiên âm thời gian thực, thoại thời
gian thực, hiểu phương tiện, tạo ảnh, tạo video, truy xuất web, tìm kiếm web,
và nhiều hơn nữa. Một số Plugin là **lõi** (được phát hành kèm OpenClaw), số khác
là **bên ngoài**. Hầu hết Plugin bên ngoài được phát hành và khám phá thông qua
[ClawHub](/vi/tools/clawhub). Npm vẫn được hỗ trợ cho cài đặt trực tiếp và cho một
tập tạm thời các gói Plugin do OpenClaw sở hữu trong khi quá trình di chuyển đó hoàn tất.

## Bắt đầu nhanh

Để xem các ví dụ cài đặt, liệt kê, gỡ cài đặt, cập nhật và phát hành có thể sao chép-dán, hãy xem
[Quản lý Plugin](/vi/plugins/manage-plugins).

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

    Sau đó cấu hình trong `plugins.entries.\<id\>.config` trong tệp cấu hình của bạn.

  </Step>

  <Step title="Quản lý nguyên bản trong trò chuyện">
    Trong một Gateway đang chạy, `/plugins enable` và `/plugins disable` chỉ dành cho chủ sở hữu
    sẽ kích hoạt bộ tải lại cấu hình Gateway. Gateway tải lại các bề mặt runtime
    của Plugin ngay trong tiến trình, và các lượt agent mới xây dựng lại danh sách công cụ từ
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
    hook, hoặc lệnh CLI do Plugin sở hữu đã được đăng ký. `inspect` thông thường là một kiểm tra
    manifest/registry lạnh và cố ý tránh import runtime của Plugin.

  </Step>
</Steps>

Nếu bạn thích điều khiển nguyên bản trong trò chuyện, hãy bật `commands.plugins: true` và dùng:

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

Đường dẫn cài đặt dùng cùng bộ phân giải như CLI: đường dẫn/kho lưu trữ cục bộ, rõ ràng
`clawhub:<pkg>`, rõ ràng `npm:<pkg>`, rõ ràng `npm-pack:<path.tgz>`,
rõ ràng `git:<repo>`, hoặc đặc tả gói trần thông qua npm.

Nếu cấu hình không hợp lệ, quá trình cài đặt thường thất bại đóng và chỉ bạn tới
`openclaw doctor --fix`. Ngoại lệ khôi phục duy nhất là một đường dẫn cài đặt lại
Plugin đi kèm phạm vi hẹp cho các Plugin chọn tham gia
`openclaw.install.allowInvalidConfigRecovery`.
Trong khi Gateway khởi động, cấu hình Plugin không hợp lệ thất bại đóng như mọi cấu hình không hợp lệ khác.
Chạy `openclaw doctor --fix` để cách ly cấu hình Plugin lỗi bằng cách
tắt mục Plugin đó và xóa payload cấu hình không hợp lệ của nó; bản sao lưu
cấu hình thông thường giữ lại các giá trị trước đó.
Khi cấu hình kênh tham chiếu một Plugin không còn khám phá được nhưng cùng
id Plugin cũ vẫn còn trong cấu hình Plugin hoặc bản ghi cài đặt, quá trình khởi động Gateway
ghi cảnh báo và bỏ qua kênh đó thay vì chặn mọi kênh khác.
Chạy `openclaw doctor --fix` để xóa các mục kênh/Plugin cũ; các khóa
kênh không xác định không có bằng chứng Plugin cũ vẫn thất bại xác thực để lỗi gõ
vẫn hiển thị.
Nếu `plugins.enabled: false` được đặt, các tham chiếu Plugin cũ được xem là bất hoạt:
quá trình khởi động Gateway bỏ qua việc khám phá/tải Plugin và `openclaw doctor` giữ lại
cấu hình Plugin đã tắt thay vì tự động xóa nó. Bật lại Plugin trước khi
chạy dọn dẹp doctor nếu bạn muốn xóa các id Plugin cũ.

Việc cài đặt phụ thuộc Plugin chỉ diễn ra trong các luồng cài đặt/cập nhật hoặc
sửa chữa doctor rõ ràng. Khởi động Gateway, tải lại cấu hình và kiểm tra runtime
không chạy trình quản lý gói hoặc sửa cây phụ thuộc. Plugin cục bộ phải đã
cài đặt sẵn các phụ thuộc, trong khi Plugin npm, git và ClawHub được
cài đặt dưới các gốc Plugin do OpenClaw quản lý. Các phụ thuộc npm có thể được hoist
trong gốc npm do OpenClaw quản lý; cài đặt/cập nhật quét gốc được quản lý đó trước khi
tin cậy và gỡ cài đặt sẽ xóa các gói do npm quản lý thông qua npm. Plugin bên ngoài
và đường dẫn tải tùy chỉnh vẫn phải được cài đặt thông qua `openclaw plugins install`.
Dùng `openclaw plugins list --json` để xem `dependencyStatus` tĩnh cho từng
Plugin hiển thị mà không import mã runtime hoặc sửa phụ thuộc.
Xem [Phân giải phụ thuộc Plugin](/vi/plugins/dependency-resolution) để biết vòng đời
tại thời điểm cài đặt.

### Quyền sở hữu đường dẫn Plugin bị chặn

Nếu chẩn đoán Plugin báo
`blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
và xác thực cấu hình tiếp theo với `plugin present but blocked`, OpenClaw đã tìm thấy
các tệp Plugin thuộc sở hữu của một người dùng Unix khác với tiến trình đang tải
chúng. Giữ nguyên cấu hình Plugin; sửa quyền sở hữu hệ thống tệp hoặc chạy
OpenClaw bằng cùng người dùng sở hữu thư mục trạng thái.

Đối với cài đặt Docker, image chính thức chạy dưới dạng `node` (uid `1000`), vì vậy các
thư mục cấu hình OpenClaw và workspace được bind mount từ host thường nên thuộc
sở hữu uid `1000`:

```bash
sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
```

Nếu bạn cố ý chạy OpenClaw bằng root, hãy sửa gốc Plugin được quản lý sang
quyền sở hữu root thay thế:

```bash
sudo chown -R root:root /path/to/openclaw-config/npm
```

Sau khi sửa quyền sở hữu, chạy lại `openclaw doctor --fix` hoặc
`openclaw plugins registry --refresh` để registry Plugin được lưu khớp với
các tệp đã sửa.

Đối với cài đặt npm, các bộ chọn có thể thay đổi như `latest` hoặc dist-tag được phân giải
trước khi cài đặt rồi được ghim vào phiên bản chính xác đã xác minh trong gốc npm
do OpenClaw quản lý. Sau khi npm hoàn tất, OpenClaw xác minh mục
`package-lock.json` đã cài đặt vẫn khớp với phiên bản và integrity đã phân giải. Nếu
npm ghi siêu dữ liệu gói khác, quá trình cài đặt thất bại và gói được quản lý
được rollback thay vì chấp nhận một artifact Plugin khác.
Các gốc npm được quản lý cũng thừa hưởng npm `overrides` cấp gói của OpenClaw, vì vậy
các ghim bảo mật bảo vệ host đóng gói cũng áp dụng cho các phụ thuộc Plugin
bên ngoài được hoist.

Các checkout nguồn là pnpm workspace. Nếu bạn clone OpenClaw để chỉnh sửa các
Plugin đi kèm, hãy chạy `pnpm install`; sau đó OpenClaw tải các Plugin đi kèm từ
`extensions/<id>` để các chỉnh sửa và phụ thuộc cục bộ theo gói được dùng trực tiếp.
Cài đặt gốc npm thông thường dành cho OpenClaw đã đóng gói, không dành cho
phát triển checkout nguồn.

## Loại Plugin

OpenClaw nhận diện hai định dạng Plugin:

| Định dạng   | Cách hoạt động                                                     | Ví dụ                                                  |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + mô-đun runtime; thực thi trong tiến trình | Plugin chính thức, gói npm cộng đồng                  |
| **Bundle** | Bố cục tương thích Codex/Claude/Cursor; ánh xạ sang tính năng OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Cả hai đều xuất hiện dưới `openclaw plugins list`. Xem [Plugin Bundles](/vi/plugins/bundles) để biết chi tiết về bundle.

Nếu bạn đang viết Plugin native, hãy bắt đầu với [Xây dựng Plugin](/vi/plugins/building-plugins)
và [Tổng quan Plugin SDK](/vi/plugins/sdk-overview).

## Điểm vào gói

Các gói npm Plugin native phải khai báo `openclaw.extensions` trong `package.json`.
Mỗi mục phải nằm trong thư mục gói và phân giải tới một tệp runtime có thể đọc,
hoặc tới một tệp nguồn TypeScript có peer JavaScript đã build được suy luận
chẳng hạn như `src/index.ts` tới `dist/index.js`.
Cài đặt đã đóng gói phải phát hành output runtime JavaScript đó. Fallback nguồn
TypeScript dành cho checkout nguồn và đường dẫn phát triển cục bộ, không dành cho
các gói npm được cài đặt vào gốc Plugin do OpenClaw quản lý.

Nếu một cảnh báo gói được quản lý nói rằng nó `requires compiled runtime output for
TypeScript entry ...`, gói đó đã được phát hành mà không có các tệp JavaScript
OpenClaw cần ở runtime. Đó là vấn đề đóng gói Plugin, không phải vấn đề cấu hình
cục bộ. Cập nhật hoặc cài đặt lại Plugin sau khi nhà phát hành phát hành lại
JavaScript đã biên dịch, hoặc tắt/gỡ cài đặt Plugin đó cho đến khi có gói đã sửa.

Dùng `openclaw.runtimeExtensions` khi các tệp runtime đã phát hành không nằm ở
cùng đường dẫn với các mục nguồn. Khi có mặt, `runtimeExtensions` phải chứa
chính xác một mục cho mỗi mục `extensions`. Danh sách không khớp sẽ làm thất bại cài đặt và
khám phá Plugin thay vì âm thầm fallback sang đường dẫn nguồn. Nếu bạn cũng
phát hành `openclaw.setupEntry`, hãy dùng `openclaw.runtimeSetupEntry` cho peer
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

ClawHub là đường dẫn phân phối chính cho hầu hết Plugin. Các bản phát hành OpenClaw
đóng gói hiện tại đã bundle nhiều Plugin chính thức, nên các Plugin đó không cần
cài đặt npm riêng trong thiết lập thông thường. Cho đến khi mọi Plugin do OpenClaw sở hữu
đã di chuyển sang ClawHub, OpenClaw vẫn phát hành một số gói Plugin `@openclaw/*` trên
npm cho cài đặt cũ/tùy chỉnh và quy trình npm trực tiếp.

Nếu npm báo một gói Plugin `@openclaw/*` là deprecated, phiên bản gói đó
thuộc đợt gói bên ngoài cũ hơn. Dùng Plugin đi kèm từ OpenClaw hiện tại hoặc
checkout cục bộ cho đến khi một gói npm mới hơn được phát hành.

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
  <Accordion title="Nhà cung cấp mô hình (bật theo mặc định)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Plugin bộ nhớ">
    - `memory-core` - tìm kiếm bộ nhớ tích hợp (mặc định qua `plugins.slots.memory`)
    - `memory-lancedb` - bộ nhớ dài hạn dựa trên LanceDB với tự động nhớ lại/ghi nhận (đặt `plugins.slots.memory = "memory-lancedb"`)

    Xem [Memory LanceDB](/vi/plugins/memory-lancedb) để biết cách thiết lập embedding tương thích OpenAI, ví dụ Ollama, giới hạn nhớ lại và khắc phục sự cố.

  </Accordion>

  <Accordion title="Nhà cung cấp giọng nói (được bật theo mặc định)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Khác">
    - `browser` - plugin trình duyệt tích hợp cho công cụ trình duyệt, CLI `openclaw browser`, phương thức gateway `browser.request`, runtime trình duyệt và dịch vụ điều khiển trình duyệt mặc định (được bật theo mặc định; tắt trước khi thay thế)
    - `copilot-proxy` - cầu nối VS Code Copilot Proxy (tắt theo mặc định)

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

| Trường             | Mô tả                                                      |
| ------------------ | --------------------------------------------------------- |
| `enabled`          | Công tắc chính (mặc định: `true`)                         |
| `allow`            | Danh sách cho phép Plugin (tùy chọn)                      |
| `bundledDiscovery` | Chế độ phát hiện plugin tích hợp (mặc định là `allowlist`) |
| `deny`             | Danh sách chặn Plugin (tùy chọn; chặn được ưu tiên)       |
| `load.paths`       | Tệp/thư mục plugin bổ sung                                |
| `slots`            | Bộ chọn vị trí độc quyền (ví dụ: `memory`, `contextEngine`) |
| `entries.\<id\>`   | Công tắc + cấu hình theo từng plugin                      |

`plugins.allow` có tính độc quyền. Khi không rỗng, chỉ các plugin được liệt kê mới có thể tải hoặc hiển thị công cụ, ngay cả khi `tools.allow` chứa `"*"` hoặc tên công cụ cụ thể do plugin sở hữu. Nếu danh sách cho phép công cụ tham chiếu đến công cụ plugin, hãy thêm id của plugin sở hữu vào `plugins.allow` hoặc xóa `plugins.allow`; `openclaw doctor` sẽ cảnh báo về dạng này.

`plugins.bundledDiscovery` mặc định là `"allowlist"` cho cấu hình mới, nên một danh mục `plugins.allow` hạn chế cũng chặn các plugin nhà cung cấp tích hợp bị bỏ qua, bao gồm cả phát hiện nhà cung cấp tìm kiếm web runtime. Doctor đóng dấu các cấu hình danh sách cho phép hạn chế cũ bằng `"compat"` trong quá trình di chuyển để các bản nâng cấp giữ hành vi nhà cung cấp tích hợp cũ cho đến khi người vận hành chọn chế độ nghiêm ngặt hơn. `plugins.allow` rỗng vẫn được xem là chưa đặt/mở.

Các thay đổi cấu hình được thực hiện qua `/plugins enable` hoặc `/plugins disable` sẽ kích hoạt tải lại plugin Gateway trong tiến trình. Các lượt tác nhân mới sẽ dựng lại danh sách công cụ từ registry plugin đã được làm mới. Các thao tác thay đổi nguồn như cài đặt, cập nhật và gỡ cài đặt vẫn khởi động lại tiến trình Gateway vì các mô-đun plugin đã được nhập không thể được thay thế tại chỗ một cách an toàn.

`openclaw plugins list` là ảnh chụp nhanh registry/cấu hình plugin cục bộ. Một plugin `enabled` ở đó nghĩa là registry đã lưu và cấu hình hiện tại cho phép plugin tham gia. Điều đó không chứng minh rằng một Gateway từ xa đang chạy đã tải lại hoặc khởi động lại vào cùng mã plugin. Trên các thiết lập VPS/container có tiến trình wrapper, hãy gửi lệnh khởi động lại hoặc các ghi kích hoạt tải lại đến đúng tiến trình `openclaw gateway run`, hoặc dùng `openclaw gateway restart` với Gateway đang chạy khi thao tác tải lại báo lỗi.

<Accordion title="Trạng thái Plugin: bị tắt, thiếu và không hợp lệ">
  - **Bị tắt**: plugin tồn tại nhưng quy tắc bật đã tắt nó. Cấu hình được giữ nguyên.
  - **Thiếu**: cấu hình tham chiếu đến một id plugin mà quá trình phát hiện không tìm thấy.
  - **Không hợp lệ**: plugin tồn tại nhưng cấu hình của nó không khớp với schema đã khai báo. Khởi động Gateway chỉ bỏ qua plugin đó; `openclaw doctor --fix` có thể cách ly mục không hợp lệ bằng cách tắt nó và xóa payload cấu hình của nó.

</Accordion>

## Phát hiện và thứ tự ưu tiên

OpenClaw quét plugin theo thứ tự này (khớp đầu tiên được ưu tiên):

<Steps>
  <Step title="Đường dẫn cấu hình">
    `plugins.load.paths` - đường dẫn tệp hoặc thư mục rõ ràng. Các đường dẫn trỏ ngược về thư mục plugin tích hợp đã đóng gói của chính OpenClaw sẽ bị bỏ qua; chạy `openclaw doctor --fix` để xóa các bí danh cũ đó.
  </Step>

  <Step title="Plugin workspace">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` và `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Plugin toàn cục">
    `~/.openclaw/<plugin-root>/*.ts` và `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Plugin tích hợp">
    Được phát hành cùng OpenClaw. Nhiều plugin được bật theo mặc định (nhà cung cấp mô hình, giọng nói). Những plugin khác cần được bật rõ ràng.
  </Step>
</Steps>

Các bản cài đặt đóng gói và ảnh Docker thường phân giải plugin tích hợp từ cây `dist/extensions` đã biên dịch. Nếu một thư mục nguồn plugin tích hợp được bind mount đè lên đường dẫn nguồn đóng gói tương ứng, ví dụ `/app/extensions/synology-chat`, OpenClaw xem thư mục nguồn đã mount đó là lớp phủ nguồn tích hợp và phát hiện nó trước bundle `/app/dist/extensions/synology-chat` đã đóng gói. Điều này giữ cho vòng lặp container của maintainer hoạt động mà không phải chuyển mọi plugin tích hợp về nguồn TypeScript. Đặt `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1` để buộc dùng các bundle dist đã đóng gói ngay cả khi có mount lớp phủ nguồn.

### Quy tắc bật

- `plugins.enabled: false` tắt tất cả plugin và bỏ qua công việc phát hiện/tải plugin
- `plugins.deny` luôn được ưu tiên hơn allow
- `plugins.entries.\<id\>.enabled: false` tắt plugin đó
- Plugin có nguồn gốc từ workspace **bị tắt theo mặc định** (phải được bật rõ ràng)
- Plugin tích hợp tuân theo tập bật mặc định dựng sẵn trừ khi bị ghi đè
- Các vị trí độc quyền có thể buộc bật plugin đã chọn cho vị trí đó
- Một số plugin tích hợp cần chọn tham gia được tự động bật khi cấu hình đặt tên cho một bề mặt do plugin sở hữu, chẳng hạn như tham chiếu mô hình nhà cung cấp, cấu hình kênh hoặc runtime harness
- Cấu hình plugin cũ được giữ lại khi `plugins.enabled: false` đang hoạt động; bật lại plugin trước khi chạy dọn dẹp doctor nếu bạn muốn xóa các id cũ
- Các tuyến Codex thuộc họ OpenAI giữ ranh giới plugin riêng:
  `openai-codex/*` thuộc về plugin OpenAI, trong khi plugin app-server Codex tích hợp được chọn bằng `agentRuntime.id: "codex"` hoặc các tham chiếu mô hình `codex/*` cũ

## Khắc phục sự cố hook runtime

Nếu một plugin xuất hiện trong `plugins list` nhưng tác dụng phụ hoặc hook `register(api)` không chạy trong lưu lượng chat trực tiếp, hãy kiểm tra những mục này trước:

- Chạy `openclaw gateway status --deep --require-rpc` và xác nhận URL Gateway, hồ sơ, đường dẫn cấu hình và tiến trình đang hoạt động là những mục bạn đang chỉnh sửa.
- Khởi động lại Gateway trực tiếp sau khi thay đổi cài đặt/cấu hình/mã plugin. Trong container wrapper, PID 1 có thể chỉ là trình giám sát; hãy khởi động lại hoặc gửi tín hiệu đến tiến trình con `openclaw gateway run`.
- Dùng `openclaw plugins inspect <id> --runtime --json` để xác nhận đăng ký hook và chẩn đoán. Các hook hội thoại không tích hợp như `llm_input`, `llm_output`, `before_agent_finalize` và `agent_end` cần `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- Để chuyển đổi mô hình, ưu tiên `before_model_resolve`. Nó chạy trước khi phân giải mô hình cho các lượt tác nhân; `llm_output` chỉ chạy sau khi một lần thử mô hình tạo ra đầu ra trợ lý.
- Để chứng minh mô hình phiên hiệu lực, dùng `openclaw sessions` hoặc các bề mặt phiên/trạng thái Gateway và, khi gỡ lỗi payload nhà cung cấp, khởi động Gateway với `--raw-stream --raw-stream-path <path>`.

### Thiết lập công cụ plugin chậm

Nếu các lượt tác nhân có vẻ bị treo khi chuẩn bị công cụ, hãy bật ghi log trace và kiểm tra các dòng thời gian factory công cụ plugin:

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

Tìm:

```text
[trace:plugin-tools] factory timings ...
```

Bản tóm tắt liệt kê tổng thời gian factory và các factory công cụ plugin chậm nhất, bao gồm id plugin, tên công cụ đã khai báo, dạng kết quả và công cụ đó có tùy chọn hay không. Các dòng chậm được nâng thành cảnh báo khi một factory đơn lẻ mất ít nhất 1 giây hoặc tổng thời gian chuẩn bị factory công cụ plugin mất ít nhất 5 giây.

OpenClaw lưu bộ nhớ đệm các kết quả factory công cụ plugin thành công cho các lần phân giải lặp lại với cùng ngữ cảnh yêu cầu hiệu lực. Khóa bộ nhớ đệm bao gồm cấu hình runtime hiệu lực, workspace, id tác nhân/phiên, chính sách sandbox, cài đặt trình duyệt, ngữ cảnh phân phối, danh tính người yêu cầu và trạng thái sở hữu, nên các factory phụ thuộc vào những trường đáng tin cậy đó sẽ được chạy lại khi ngữ cảnh thay đổi.

Nếu một plugin chiếm phần lớn thời gian, hãy kiểm tra đăng ký runtime của nó:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

Sau đó cập nhật, cài đặt lại hoặc tắt plugin đó. Tác giả plugin nên chuyển việc tải phụ thuộc tốn kém vào sau đường thực thi công cụ thay vì thực hiện bên trong factory công cụ.

### Trùng quyền sở hữu kênh hoặc công cụ

Triệu chứng:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

Các thông báo này nghĩa là có hơn một plugin đang bật cố gắng sở hữu cùng một kênh, luồng thiết lập hoặc tên công cụ. Nguyên nhân phổ biến nhất là một plugin kênh bên ngoài được cài bên cạnh một plugin tích hợp hiện cung cấp cùng id kênh.

Các bước gỡ lỗi:

- Chạy `openclaw plugins list --enabled --verbose` để xem mọi plugin đang bật và nguồn gốc của chúng.
- Chạy `openclaw plugins inspect <id> --runtime --json` cho từng plugin nghi ngờ và so sánh `channels`, `channelConfigs`, `tools` và chẩn đoán.
- Chạy `openclaw plugins registry --refresh` sau khi cài đặt hoặc xóa các gói plugin để metadata đã lưu phản ánh bản cài đặt hiện tại.
- Khởi động lại Gateway sau khi thay đổi cài đặt, registry hoặc cấu hình.

Tùy chọn sửa:

- Nếu một plugin cố ý thay thế plugin khác cho cùng id kênh, plugin được ưu tiên nên khai báo `channelConfigs.<channel-id>.preferOver` với id plugin có mức ưu tiên thấp hơn. Xem [/plugins/manifest#replacing-another-channel-plugin](/vi/plugins/manifest#replacing-another-channel-plugin).
- Nếu trùng lặp là vô tình, hãy tắt một bên bằng `plugins.entries.<plugin-id>.enabled: false` hoặc xóa bản cài đặt plugin cũ.
- Nếu bạn đã bật rõ ràng cả hai plugin, OpenClaw giữ yêu cầu đó và báo cáo xung đột. Chọn một chủ sở hữu cho kênh hoặc đổi tên các công cụ do plugin sở hữu để bề mặt runtime không mơ hồ.

## Vị trí Plugin (danh mục độc quyền)

Một số danh mục là độc quyền (mỗi lần chỉ một mục hoạt động):

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

| Vị trí          | Điều nó điều khiển      | Mặc định              |
| --------------- | ----------------------- | --------------------- |
| `memory`        | Plugin bộ nhớ hoạt động | `memory-core`         |
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

Các plugin đi kèm được phát hành cùng OpenClaw. Nhiều plugin được bật theo mặc định (ví dụ như các nhà cung cấp mô hình đi kèm, các nhà cung cấp giọng nói đi kèm và plugin trình duyệt đi kèm). Các plugin đi kèm khác vẫn cần `openclaw plugins enable <id>`.

`--force` ghi đè một plugin hoặc gói hook đã cài đặt hiện có tại chỗ. Dùng `openclaw plugins update <id-or-npm-spec>` cho các lần nâng cấp thường kỳ của các plugin npm được theo dõi. Tùy chọn này không được hỗ trợ với `--link`, vốn tái sử dụng đường dẫn nguồn thay vì sao chép lên một đích cài đặt được quản lý.

Khi `plugins.allow` đã được đặt, `openclaw plugins install` thêm id plugin đã cài đặt vào danh sách cho phép đó trước khi bật plugin. Nếu cùng id plugin có trong `plugins.deny`, quá trình cài đặt sẽ xóa mục từ chối cũ đó để lần cài đặt tường minh có thể được tải ngay sau khi khởi động lại.

OpenClaw duy trì một registry plugin cục bộ đã lưu làm mô hình đọc lạnh cho kiểm kê plugin, quyền sở hữu đóng góp và lập kế hoạch khởi động. Các luồng cài đặt, cập nhật, gỡ cài đặt, bật và tắt sẽ làm mới registry đó sau khi thay đổi trạng thái plugin. Cùng tệp `plugins/installs.json` giữ siêu dữ liệu cài đặt bền vững trong `installRecords` cấp cao nhất và siêu dữ liệu manifest có thể dựng lại trong `plugins`. Nếu registry bị thiếu, lỗi thời hoặc không hợp lệ, `openclaw plugins registry --refresh` sẽ dựng lại phần xem manifest của nó từ bản ghi cài đặt, chính sách cấu hình và siêu dữ liệu manifest/package mà không tải các mô-đun runtime của plugin.
`openclaw plugins update <id-or-npm-spec>` áp dụng cho các cài đặt được theo dõi. Truyền một đặc tả package npm có dist-tag hoặc phiên bản chính xác sẽ phân giải tên package ngược về bản ghi plugin được theo dõi và ghi lại đặc tả mới cho các lần cập nhật sau. Truyền tên package không kèm phiên bản sẽ chuyển một cài đặt ghim chính xác trở lại dòng phát hành mặc định của registry. Nếu plugin npm đã cài đặt đã khớp với phiên bản đã phân giải và định danh artifact đã ghi, OpenClaw sẽ bỏ qua cập nhật mà không tải xuống, cài đặt lại hoặc ghi lại cấu hình.
Khi `openclaw update` chạy trên kênh beta, các bản ghi plugin npm và ClawHub theo dòng mặc định sẽ thử `@beta` trước và quay về default/latest khi không có bản phát hành beta cho plugin. Các phiên bản chính xác và thẻ tường minh vẫn được ghim.

`--pin` chỉ dành cho npm. Nó không được hỗ trợ với `--marketplace`, vì các cài đặt marketplace lưu siêu dữ liệu nguồn marketplace thay vì một đặc tả npm.

`--dangerously-force-unsafe-install` là tùy chọn phá kính khẩn cấp cho các kết quả dương tính giả từ trình quét mã nguy hiểm tích hợp. Nó cho phép cài đặt plugin và cập nhật plugin tiếp tục vượt qua các phát hiện `critical` tích hợp, nhưng vẫn không bỏ qua các chặn chính sách `before_install` của plugin hoặc chặn do lỗi quét. Quét cài đặt bỏ qua các tệp và thư mục kiểm thử phổ biến như `tests/`, `__tests__/`, `*.test.*` và `*.spec.*` để tránh chặn các mock kiểm thử đã đóng gói; các entrypoint runtime đã khai báo của plugin vẫn được quét ngay cả khi chúng dùng một trong các tên đó.

Cờ CLI này chỉ áp dụng cho các luồng cài đặt/cập nhật plugin. Các cài đặt phụ thuộc Skills dựa trên Gateway dùng override yêu cầu `dangerouslyForceUnsafeInstall` tương ứng, trong khi `openclaw skills install` vẫn là luồng tải xuống/cài đặt Skills ClawHub riêng biệt.

Nếu một plugin bạn đã phát hành trên ClawHub bị ẩn hoặc bị chặn bởi một lần quét, hãy mở bảng điều khiển ClawHub hoặc chạy `clawhub package rescan <name>` để yêu cầu ClawHub kiểm tra lại. `--dangerously-force-unsafe-install` chỉ ảnh hưởng đến các cài đặt trên máy của riêng bạn; nó không yêu cầu ClawHub quét lại plugin hoặc công khai một bản phát hành bị chặn.

Các bundle tương thích tham gia cùng luồng liệt kê/kiểm tra/bật/tắt plugin. Hỗ trợ runtime hiện tại bao gồm bundle Skills, Claude command-skills, mặc định Claude `settings.json`, mặc định Claude `.lsp.json` và `lspServers` do manifest khai báo, Cursor command-skills và các thư mục hook Codex tương thích.

`openclaw plugins inspect <id>` cũng báo cáo các khả năng bundle đã phát hiện cùng các mục máy chủ MCP và LSP được hỗ trợ hoặc không được hỗ trợ cho các plugin dựa trên bundle.

Nguồn marketplace có thể là tên known-marketplace của Claude từ `~/.claude/plugins/known_marketplaces.json`, một gốc marketplace cục bộ hoặc đường dẫn `marketplace.json`, một dạng viết tắt GitHub như `owner/repo`, một URL repo GitHub hoặc một URL git. Với các marketplace từ xa, các mục plugin phải nằm bên trong repo marketplace đã clone và chỉ dùng nguồn đường dẫn tương đối.

Xem [tham chiếu CLI `openclaw plugins`](/vi/cli/plugins) để biết đầy đủ chi tiết.

## Tổng quan API Plugin

Các plugin native xuất một đối tượng entry phơi bày `register(api)`. Các plugin cũ hơn vẫn có thể dùng `activate(api)` như một bí danh legacy, nhưng plugin mới nên dùng `register`.

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

OpenClaw tải đối tượng entry và gọi `register(api)` trong quá trình kích hoạt plugin. Loader vẫn quay về `activate(api)` cho các plugin cũ hơn, nhưng các plugin đi kèm và plugin bên ngoài mới nên xem `register` là hợp đồng công khai.

`api.registrationMode` cho plugin biết vì sao entry của nó đang được tải:

| Chế độ          | Ý nghĩa                                                                                                                          |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | Kích hoạt runtime. Đăng ký công cụ, hook, dịch vụ, lệnh, route và các tác dụng phụ đang hoạt động khác.                              |
| `discovery`     | Khám phá khả năng chỉ đọc. Đăng ký nhà cung cấp và siêu dữ liệu; mã entry plugin tin cậy có thể tải, nhưng bỏ qua tác dụng phụ đang hoạt động. |
| `setup-only`    | Tải siêu dữ liệu thiết lập kênh thông qua một entry thiết lập nhẹ.                                                                |
| `setup-runtime` | Tải thiết lập kênh cũng cần entry runtime.                                                                         |
| `cli-metadata`  | Chỉ thu thập siêu dữ liệu lệnh CLI.                                                                                            |

Các entry plugin mở socket, cơ sở dữ liệu, worker nền hoặc client tồn tại lâu nên bảo vệ các tác dụng phụ đó bằng `api.registrationMode === "full"`. Các lần tải discovery được cache riêng với các lần tải kích hoạt và không thay thế registry Gateway đang chạy. Discovery là không kích hoạt, không phải không import: OpenClaw có thể đánh giá entry plugin tin cậy hoặc mô-đun plugin kênh để dựng snapshot. Giữ cấp cao nhất của mô-đun nhẹ và không có tác dụng phụ, đồng thời chuyển client mạng, subprocess, listener, đọc credential và khởi động dịch vụ ra sau các đường dẫn full-runtime.

Các phương thức đăng ký phổ biến:

| Phương thức                              | Nội dung đăng ký             |
| --------------------------------------- | --------------------------- |
| `registerProvider`                      | Nhà cung cấp mô hình (LLM)  |
| `registerChannel`                       | Kênh trò chuyện             |
| `registerTool`                          | Công cụ agent               |
| `registerHook` / `on(...)`              | Hook vòng đời               |
| `registerSpeechProvider`                | Chuyển văn bản thành giọng nói / STT |
| `registerRealtimeTranscriptionProvider` | STT truyền phát             |
| `registerRealtimeVoiceProvider`         | Giọng nói thời gian thực hai chiều |
| `registerMediaUnderstandingProvider`    | Phân tích hình ảnh/âm thanh |
| `registerImageGenerationProvider`       | Tạo hình ảnh                |
| `registerMusicGenerationProvider`       | Tạo nhạc                    |
| `registerVideoGenerationProvider`       | Tạo video                   |
| `registerWebFetchProvider`              | Nhà cung cấp tìm nạp / scrape web |
| `registerWebSearchProvider`             | Tìm kiếm web                |
| `registerHttpRoute`                     | Endpoint HTTP               |
| `registerCommand` / `registerCli`       | Lệnh CLI                    |
| `registerContextEngine`                 | Engine ngữ cảnh             |
| `registerService`                       | Dịch vụ nền                 |

Hành vi guard hook cho các hook vòng đời có kiểu:

- `before_tool_call`: `{ block: true }` là kết thúc; các handler có độ ưu tiên thấp hơn bị bỏ qua.
- `before_tool_call`: `{ block: false }` là no-op và không xóa một chặn trước đó.
- `before_install`: `{ block: true }` là kết thúc; các handler có độ ưu tiên thấp hơn bị bỏ qua.
- `before_install`: `{ block: false }` là no-op và không xóa một chặn trước đó.
- `message_sending`: `{ cancel: true }` là kết thúc; các handler có độ ưu tiên thấp hơn bị bỏ qua.
- `message_sending`: `{ cancel: false }` là no-op và không xóa một hủy trước đó.

Máy chủ ứng dụng Codex native chạy cầu nối các sự kiện công cụ Codex-native trở lại bề mặt hook này. Plugin có thể chặn công cụ Codex native thông qua `before_tool_call`, quan sát kết quả thông qua `after_tool_call` và tham gia phê duyệt `PermissionRequest` của Codex. Cầu nối chưa ghi lại các đối số công cụ Codex-native. Ranh giới hỗ trợ runtime Codex chính xác nằm trong [hợp đồng hỗ trợ Codex harness v1](/vi/plugins/codex-harness#v1-support-contract).

Để xem đầy đủ hành vi hook có kiểu, hãy xem [tổng quan SDK](/vi/plugins/sdk-overview#hook-decision-semantics).

## Liên quan

- [Xây dựng Plugin](/vi/plugins/building-plugins) - tạo Plugin của riêng bạn
- [Gói Plugin](/vi/plugins/bundles) - khả năng tương thích với gói Codex/Claude/Cursor
- [Manifest Plugin](/vi/plugins/manifest) - lược đồ manifest
- [Đăng ký công cụ](/vi/plugins/building-plugins#registering-agent-tools) - thêm công cụ tác nhân trong một Plugin
- [Nội bộ Plugin](/vi/plugins/architecture) - mô hình năng lực và quy trình tải
- [Plugin cộng đồng](/vi/plugins/community) - danh sách của bên thứ ba
