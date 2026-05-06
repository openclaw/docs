---
read_when:
    - Cài đặt hoặc cấu hình Plugin
    - Tìm hiểu về quy tắc phát hiện và nạp Plugin
    - Làm việc với các gói Plugin tương thích với Codex/Claude
sidebarTitle: Install and Configure
summary: Cài đặt, cấu hình và quản lý các Plugin OpenClaw
title: Plugin
x-i18n:
    generated_at: "2026-05-06T09:34:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0d68ad3cbd040d3f973d219cf273a792f11df382f6c4ccbf80c07acb0d26c658
    source_path: tools/plugin.md
    workflow: 16
---

Plugins mở rộng OpenClaw với các khả năng mới: kênh, nhà cung cấp mô hình,
khung agent, công cụ, Skills, giọng nói, phiên âm thời gian thực, thoại thời
gian thực, hiểu phương tiện, tạo hình ảnh, tạo video, tìm nạp web, tìm kiếm web
và nhiều tính năng khác. Một số Plugin là **lõi** (được phát hành kèm OpenClaw),
các Plugin khác là **bên ngoài**. Hầu hết Plugin bên ngoài được phát hành và
khám phá thông qua [ClawHub](/vi/tools/clawhub). Npm vẫn được hỗ trợ cho cài đặt
trực tiếp và cho một tập hợp tạm thời các gói Plugin do OpenClaw sở hữu trong
khi quá trình di chuyển đó hoàn tất.

## Bắt đầu nhanh

Để xem ví dụ cài đặt, liệt kê, gỡ cài đặt, cập nhật và phát hành có thể sao
chép-dán, hãy xem [Quản lý Plugin](/vi/plugins/manage-plugins).

<Steps>
  <Step title="Xem nội dung đã được tải">
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

  <Step title="Quản lý ngay trong trò chuyện">
    Trong một Gateway đang chạy, `/plugins enable` và `/plugins disable` chỉ
    dành cho chủ sở hữu sẽ kích hoạt bộ tải lại cấu hình Gateway. Gateway tải
    lại các bề mặt runtime của Plugin trong tiến trình, và các lượt agent mới
    dựng lại danh sách công cụ từ registry đã được làm mới. `/plugins install`
    thay đổi mã nguồn Plugin, nên Gateway yêu cầu khởi động lại thay vì giả vờ
    rằng tiến trình hiện tại có thể tải lại an toàn các module đã được import.

  </Step>

  <Step title="Xác minh Plugin">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json

    # If the plugin registered a CLI root, run one command from that root.
    openclaw <plugin-command> --help
    ```

    Dùng `--runtime` khi bạn cần chứng minh các công cụ, dịch vụ, phương thức
    Gateway, hook hoặc lệnh CLI do Plugin sở hữu đã được đăng ký. `inspect`
    thuần túy là kiểm tra manifest/registry lạnh và cố ý tránh import runtime
    của Plugin.

  </Step>
</Steps>

Nếu bạn ưu tiên điều khiển ngay trong trò chuyện, hãy bật `commands.plugins: true` và dùng:

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

Đường dẫn cài đặt dùng cùng bộ phân giải như CLI: đường dẫn/kho lưu trữ cục bộ,
`clawhub:<pkg>` tường minh, `npm:<pkg>` tường minh, `npm-pack:<path.tgz>` tường minh,
`git:<repo>` tường minh, hoặc đặc tả gói trần thông qua npm.

Nếu cấu hình không hợp lệ, quá trình cài đặt thường fail đóng và chỉ bạn tới
`openclaw doctor --fix`. Ngoại lệ phục hồi duy nhất là một đường dẫn cài đặt lại
Plugin đóng gói hẹp cho các Plugin chọn tham gia
`openclaw.install.allowInvalidConfigRecovery`.
Trong quá trình khởi động Gateway, cấu hình Plugin không hợp lệ fail đóng như
mọi cấu hình không hợp lệ khác. Chạy `openclaw doctor --fix` để cách ly cấu hình
Plugin lỗi bằng cách tắt mục Plugin đó và xóa payload cấu hình không hợp lệ của
nó; bản sao lưu cấu hình thông thường giữ lại các giá trị trước đó.
Khi cấu hình kênh tham chiếu tới một Plugin không còn có thể khám phá nhưng cùng
id Plugin cũ vẫn còn trong cấu hình Plugin hoặc bản ghi cài đặt, quá trình khởi
động Gateway ghi cảnh báo và bỏ qua kênh đó thay vì chặn mọi kênh khác.
Chạy `openclaw doctor --fix` để xóa các mục kênh/Plugin cũ; các khóa kênh không
xác định không có bằng chứng Plugin cũ vẫn fail xác thực để lỗi gõ nhầm vẫn hiển
thị rõ.
Nếu đặt `plugins.enabled: false`, các tham chiếu Plugin cũ được xem là bất hoạt:
quá trình khởi động Gateway bỏ qua công việc khám phá/tải Plugin và
`openclaw doctor` giữ nguyên cấu hình Plugin đã tắt thay vì tự động xóa. Bật lại
Plugin trước khi chạy dọn dẹp doctor nếu bạn muốn xóa các id Plugin cũ.

Việc cài đặt phụ thuộc của Plugin chỉ diễn ra trong các luồng cài đặt/cập nhật
tường minh hoặc sửa chữa bằng doctor. Khởi động Gateway, tải lại cấu hình và
kiểm tra runtime không chạy trình quản lý gói hoặc sửa cây phụ thuộc. Plugin cục
bộ phải đã cài đặt sẵn các phụ thuộc, trong khi các Plugin npm, git và ClawHub
được cài đặt dưới các gốc Plugin do OpenClaw quản lý. Phụ thuộc npm có thể được
hoist trong gốc npm do OpenClaw quản lý; cài đặt/cập nhật quét gốc được quản lý
đó trước khi tin cậy và gỡ cài đặt xóa các gói do npm quản lý thông qua npm.
Plugin bên ngoài và đường dẫn tải tùy chỉnh vẫn phải được cài đặt thông qua
`openclaw plugins install`. Dùng `openclaw plugins list --json` để xem
`dependencyStatus` tĩnh cho từng Plugin hiển thị mà không import mã runtime hay
sửa phụ thuộc. Xem [Phân giải phụ thuộc Plugin](/vi/plugins/dependency-resolution)
để biết vòng đời tại thời điểm cài đặt.

### Quyền sở hữu đường dẫn Plugin bị chặn

Nếu chẩn đoán Plugin báo
`blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
và xác thực cấu hình tiếp theo với `plugin present but blocked`, OpenClaw đã tìm
thấy tệp Plugin thuộc sở hữu của một người dùng Unix khác với tiến trình đang
tải chúng. Giữ nguyên cấu hình Plugin; sửa quyền sở hữu hệ thống tệp hoặc chạy
OpenClaw bằng cùng người dùng sở hữu thư mục trạng thái.

Đối với cài đặt Docker, image chính thức chạy dưới người dùng `node` (uid
`1000`), nên các thư mục cấu hình OpenClaw và workspace được bind mount từ host
thường nên thuộc sở hữu của uid `1000`:

```bash
sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
```

Nếu bạn cố ý chạy OpenClaw với quyền root, hãy sửa gốc Plugin được quản lý về
quyền sở hữu root thay vào đó:

```bash
sudo chown -R root:root /path/to/openclaw-config/npm
```

Sau khi sửa quyền sở hữu, chạy lại `openclaw doctor --fix` hoặc
`openclaw plugins registry --refresh` để registry Plugin đã lưu khớp với các tệp
đã sửa.

Đối với cài đặt npm, các selector có thể thay đổi như `latest` hoặc dist-tag
được phân giải trước khi cài đặt rồi được ghim vào đúng phiên bản đã xác minh
trong gốc npm do OpenClaw quản lý. Sau khi npm hoàn tất, OpenClaw xác minh mục
`package-lock.json` đã cài đặt vẫn khớp với phiên bản và integrity đã phân giải.
Nếu npm ghi metadata gói khác, quá trình cài đặt fail và gói được quản lý được
rollback thay vì chấp nhận một artifact Plugin khác.

Checkout nguồn là pnpm workspace. Nếu bạn clone OpenClaw để chỉnh sửa các
Plugin đóng gói, hãy chạy `pnpm install`; OpenClaw sau đó tải các Plugin đóng
gói từ `extensions/<id>` để các chỉnh sửa và phụ thuộc cục bộ theo gói được dùng
trực tiếp. Cài đặt gốc npm thuần túy dành cho OpenClaw đã đóng gói, không phải
phát triển trên checkout nguồn.

## Loại Plugin

OpenClaw nhận diện hai định dạng Plugin:

| Định dạng  | Cách hoạt động                                                    | Ví dụ                                                  |
| ---------- | ----------------------------------------------------------------- | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + module runtime; thực thi trong tiến trình | Plugin chính thức, gói npm cộng đồng                  |
| **Bundle** | Bố cục tương thích Codex/Claude/Cursor; ánh xạ tới tính năng OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Cả hai đều xuất hiện dưới `openclaw plugins list`. Xem [Plugin Bundles](/vi/plugins/bundles) để biết chi tiết về bundle.

Nếu bạn đang viết Plugin native, hãy bắt đầu với [Xây dựng Plugin](/vi/plugins/building-plugins)
và [Tổng quan Plugin SDK](/vi/plugins/sdk-overview).

## Điểm vào gói

Các gói npm Plugin native phải khai báo `openclaw.extensions` trong `package.json`.
Mỗi mục phải nằm bên trong thư mục gói và phân giải tới một tệp runtime có thể
đọc được, hoặc tới tệp nguồn TypeScript với một tệp JavaScript đã build được suy
luận tương ứng, chẳng hạn `src/index.ts` tới `dist/index.js`.
Cài đặt đã đóng gói phải phát hành đầu ra runtime JavaScript đó. Fallback nguồn
TypeScript dành cho checkout nguồn và đường dẫn phát triển cục bộ, không dành
cho các gói npm được cài vào gốc Plugin do OpenClaw quản lý.

Nếu cảnh báo gói được quản lý nói rằng nó `requires compiled runtime output for
TypeScript entry ...`, gói đó đã được phát hành mà không có các tệp JavaScript
OpenClaw cần lúc runtime. Đây là vấn đề đóng gói Plugin, không phải vấn đề cấu
hình cục bộ. Cập nhật hoặc cài đặt lại Plugin sau khi nhà phát hành phát hành
lại JavaScript đã biên dịch, hoặc tắt/gỡ cài đặt Plugin đó cho đến khi có gói đã
sửa.

Dùng `openclaw.runtimeExtensions` khi các tệp runtime đã phát hành không nằm
cùng đường dẫn với các mục nguồn. Khi có mặt, `runtimeExtensions` phải chứa đúng
một mục cho mỗi mục `extensions`. Danh sách không khớp sẽ làm cài đặt và khám
phá Plugin fail thay vì âm thầm fallback về đường dẫn nguồn. Nếu bạn cũng phát
hành `openclaw.setupEntry`, hãy dùng `openclaw.runtimeSetupEntry` cho tệp
JavaScript đã build tương ứng; tệp đó là bắt buộc khi được khai báo.

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
OpenClaw đã đóng gói hiện tại đã đóng gói sẵn nhiều Plugin chính thức, nên các
Plugin đó không cần cài đặt npm riêng trong thiết lập thông thường. Cho đến khi
mọi Plugin do OpenClaw sở hữu đã di chuyển sang ClawHub, OpenClaw vẫn phát hành
một số gói Plugin `@openclaw/*` trên npm cho các cài đặt cũ/tùy chỉnh và các
quy trình npm trực tiếp.

Nếu npm báo một gói Plugin `@openclaw/*` là deprecated, phiên bản gói đó thuộc
dòng gói bên ngoài cũ hơn. Dùng Plugin đóng gói từ OpenClaw hiện tại hoặc một
checkout cục bộ cho đến khi gói npm mới hơn được phát hành.

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
  <Accordion title="Nhà cung cấp mô hình (bật mặc định)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Plugin bộ nhớ">
    - `memory-core` - tìm kiếm bộ nhớ đóng gói (mặc định qua `plugins.slots.memory`)
    - `memory-lancedb` - bộ nhớ dài hạn dựa trên LanceDB với tự động recall/capture (đặt `plugins.slots.memory = "memory-lancedb"`)

    Xem [Memory LanceDB](/vi/plugins/memory-lancedb) để biết cách thiết lập embedding tương thích OpenAI, ví dụ Ollama, giới hạn truy hồi và khắc phục sự cố.

  </Accordion>

  <Accordion title="Nhà cung cấp giọng nói (bật theo mặc định)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Khác">
    - `browser` - plugin trình duyệt đi kèm cho công cụ trình duyệt, CLI `openclaw browser`, phương thức gateway `browser.request`, runtime trình duyệt và dịch vụ điều khiển trình duyệt mặc định (bật theo mặc định; tắt trước khi thay thế)
    - `copilot-proxy` - cầu nối VS Code Copilot Proxy (tắt theo mặc định)

  </Accordion>
</AccordionGroup>

Đang tìm plugin bên thứ ba? Xem [Plugin cộng đồng](/vi/plugins/community).

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

| Trường            | Mô tả                                                          |
| ----------------- | -------------------------------------------------------------- |
| `enabled`         | Công tắc chính (mặc định: `true`)                              |
| `allow`           | Danh sách cho phép plugin (tùy chọn)                           |
| `bundledDiscovery` | Chế độ khám phá plugin đi kèm (mặc định là `allowlist`)       |
| `deny`            | Danh sách chặn plugin (tùy chọn; chặn được ưu tiên)            |
| `load.paths`      | Tệp/thư mục plugin bổ sung                                     |
| `slots`           | Bộ chọn slot độc quyền (ví dụ: `memory`, `contextEngine`)      |
| `entries.\<id\>`  | Công tắc + cấu hình theo từng plugin                           |

`plugins.allow` có tính loại trừ. Khi không rỗng, chỉ các plugin được liệt kê mới có thể tải hoặc cung cấp công cụ, ngay cả khi `tools.allow` chứa `"*"` hoặc một tên công cụ cụ thể do plugin sở hữu. Nếu một danh sách cho phép công cụ tham chiếu đến công cụ của plugin, hãy thêm id của plugin sở hữu vào `plugins.allow` hoặc gỡ `plugins.allow`; `openclaw doctor` sẽ cảnh báo về dạng cấu hình này.

`plugins.bundledDiscovery` mặc định là `"allowlist"` cho cấu hình mới, vì vậy một danh mục `plugins.allow` hạn chế cũng chặn các plugin nhà cung cấp đi kèm bị bỏ qua, bao gồm khám phá nhà cung cấp tìm kiếm web lúc runtime. Doctor đánh dấu các cấu hình allowlist hạn chế cũ hơn bằng `"compat"` trong quá trình di chuyển để bản nâng cấp giữ hành vi nhà cung cấp đi kèm kế thừa cho đến khi người vận hành chọn chế độ nghiêm ngặt hơn. `plugins.allow` rỗng vẫn được xử lý như chưa đặt/mở.

Các thay đổi cấu hình được thực hiện qua `/plugins enable` hoặc `/plugins disable` sẽ kích hoạt tải lại plugin Gateway trong tiến trình. Các lượt agent mới xây dựng lại danh sách công cụ từ registry plugin đã làm mới. Các thao tác thay đổi nguồn như cài đặt, cập nhật và gỡ cài đặt vẫn khởi động lại tiến trình Gateway vì các mô-đun plugin đã được import không thể được thay thế an toàn tại chỗ.

`openclaw plugins list` là ảnh chụp registry/cấu hình plugin cục bộ. Một plugin `enabled` ở đó nghĩa là registry đã lưu và cấu hình hiện tại cho phép plugin tham gia. Điều đó không chứng minh rằng một Gateway từ xa đang chạy đã tải lại hoặc khởi động lại vào cùng mã plugin. Trên thiết lập VPS/container có tiến trình wrapper, hãy gửi lệnh khởi động lại hoặc các ghi kích hoạt tải lại đến đúng tiến trình `openclaw gateway run`, hoặc dùng `openclaw gateway restart` với Gateway đang chạy khi thao tác tải lại báo lỗi.

<Accordion title="Trạng thái plugin: bị tắt, thiếu và không hợp lệ">
  - **Bị tắt**: plugin tồn tại nhưng quy tắc bật đã tắt nó. Cấu hình được giữ lại.
  - **Thiếu**: cấu hình tham chiếu đến một id plugin mà quá trình khám phá không tìm thấy.
  - **Không hợp lệ**: plugin tồn tại nhưng cấu hình của nó không khớp với schema đã khai báo. Khởi động Gateway chỉ bỏ qua plugin đó; `openclaw doctor --fix` có thể cách ly mục không hợp lệ bằng cách tắt nó và xóa payload cấu hình của nó.

</Accordion>

## Khám phá và thứ tự ưu tiên

OpenClaw quét plugin theo thứ tự này (kết quả khớp đầu tiên thắng):

<Steps>
  <Step title="Đường dẫn cấu hình">
    `plugins.load.paths` - đường dẫn tệp hoặc thư mục rõ ràng. Các đường dẫn trỏ ngược về thư mục plugin đi kèm đã đóng gói của chính OpenClaw sẽ bị bỏ qua; chạy `openclaw doctor --fix` để gỡ các bí danh cũ đó.
  </Step>

  <Step title="Plugin workspace">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` và `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Plugin toàn cục">
    `~/.openclaw/<plugin-root>/*.ts` và `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Plugin đi kèm">
    Được phát hành cùng OpenClaw. Nhiều plugin được bật theo mặc định (nhà cung cấp mô hình, giọng nói). Các plugin khác yêu cầu bật rõ ràng.
  </Step>
</Steps>

Các bản cài đặt đóng gói và image Docker thường phân giải plugin đi kèm từ cây `dist/extensions` đã biên dịch. Nếu một thư mục nguồn plugin đi kèm được bind-mount đè lên đường dẫn nguồn đóng gói tương ứng, ví dụ `/app/extensions/synology-chat`, OpenClaw xử lý thư mục nguồn đã mount đó như một overlay nguồn đi kèm và khám phá nó trước gói `/app/dist/extensions/synology-chat` đã đóng gói. Cách này giữ cho vòng lặp container của maintainer hoạt động mà không cần chuyển mọi plugin đi kèm về nguồn TypeScript. Đặt `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1` để buộc dùng các gói dist đã đóng gói ngay cả khi có mount overlay nguồn.

### Quy tắc bật

- `plugins.enabled: false` tắt toàn bộ plugin và bỏ qua công việc khám phá/tải plugin
- `plugins.deny` luôn thắng `allow`
- `plugins.entries.\<id\>.enabled: false` tắt plugin đó
- Plugin có nguồn gốc từ workspace **bị tắt theo mặc định** (phải được bật rõ ràng)
- Plugin đi kèm tuân theo tập bật mặc định tích hợp, trừ khi bị ghi đè
- Slot độc quyền có thể buộc bật plugin được chọn cho slot đó
- Một số plugin đi kèm dạng opt-in được bật tự động khi cấu hình đặt tên một bề mặt do plugin sở hữu, chẳng hạn như tham chiếu mô hình nhà cung cấp, cấu hình kênh hoặc runtime harness
- Cấu hình plugin cũ được giữ lại trong khi `plugins.enabled: false` đang hoạt động; hãy bật lại plugin trước khi chạy dọn dẹp doctor nếu bạn muốn xóa các id cũ
- Các tuyến Codex thuộc họ OpenAI giữ ranh giới plugin riêng:
  `openai-codex/*` thuộc plugin OpenAI, trong khi plugin app-server Codex đi kèm được chọn bằng `agentRuntime.id: "codex"` hoặc các tham chiếu mô hình `codex/*` kế thừa

## Khắc phục sự cố hook runtime

Nếu một plugin xuất hiện trong `plugins list` nhưng tác dụng phụ hoặc hook của `register(api)` không chạy trong lưu lượng chat trực tiếp, hãy kiểm tra các mục này trước:

- Chạy `openclaw gateway status --deep --require-rpc` và xác nhận URL Gateway, profile, đường dẫn cấu hình và tiến trình đang hoạt động là đúng các mục bạn đang chỉnh sửa.
- Khởi động lại Gateway trực tiếp sau các thay đổi cài đặt/cấu hình/mã plugin. Trong container wrapper, PID 1 có thể chỉ là supervisor; hãy khởi động lại hoặc gửi tín hiệu đến tiến trình con `openclaw gateway run`.
- Dùng `openclaw plugins inspect <id> --runtime --json` để xác nhận đăng ký hook và chẩn đoán. Các hook hội thoại không đi kèm như `llm_input`, `llm_output`, `before_agent_finalize` và `agent_end` cần `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- Để chuyển đổi mô hình, ưu tiên `before_model_resolve`. Nó chạy trước khi phân giải mô hình cho lượt agent; `llm_output` chỉ chạy sau khi một lần thử mô hình tạo ra đầu ra assistant.
- Để chứng minh mô hình phiên thực tế, dùng `openclaw sessions` hoặc các bề mặt phiên/trạng thái của Gateway và, khi gỡ lỗi payload nhà cung cấp, khởi động Gateway với `--raw-stream --raw-stream-path <path>`.

### Thiết lập công cụ plugin chậm

Nếu các lượt agent có vẻ bị treo trong khi chuẩn bị công cụ, hãy bật ghi log trace và kiểm tra các dòng thời gian của factory công cụ plugin:

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

Tìm:

```text
[trace:plugin-tools] factory timings ...
```

Tóm tắt liệt kê tổng thời gian factory và các factory công cụ plugin chậm nhất, bao gồm id plugin, tên công cụ đã khai báo, dạng kết quả và công cụ có phải là tùy chọn hay không. Các dòng chậm được nâng thành cảnh báo khi một factory đơn lẻ mất ít nhất 1 giây hoặc tổng thời gian chuẩn bị factory công cụ plugin mất ít nhất 5 giây.

OpenClaw lưu cache kết quả factory công cụ plugin thành công cho các lần phân giải lặp lại với cùng ngữ cảnh yêu cầu hiệu lực. Khóa cache bao gồm cấu hình runtime hiệu lực, workspace, id agent/phiên, chính sách sandbox, thiết lập trình duyệt, ngữ cảnh phân phối, danh tính requester và trạng thái sở hữu, vì vậy các factory phụ thuộc vào những trường đáng tin cậy đó sẽ được chạy lại khi ngữ cảnh thay đổi.

Nếu một plugin chiếm phần lớn thời gian, hãy kiểm tra các đăng ký runtime của nó:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

Sau đó cập nhật, cài đặt lại hoặc tắt plugin đó. Tác giả plugin nên chuyển việc tải dependency tốn kém vào phía sau đường dẫn thực thi công cụ thay vì thực hiện bên trong factory công cụ.

### Quyền sở hữu kênh hoặc công cụ trùng lặp

Triệu chứng:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

Các thông báo này nghĩa là hơn một plugin đã bật đang cố sở hữu cùng một kênh, luồng thiết lập hoặc tên công cụ. Nguyên nhân phổ biến nhất là một plugin kênh bên ngoài được cài cạnh một plugin đi kèm hiện cung cấp cùng id kênh.

Các bước gỡ lỗi:

- Chạy `openclaw plugins list --enabled --verbose` để xem mọi plugin đã bật và nguồn gốc.
- Chạy `openclaw plugins inspect <id> --runtime --json` cho từng plugin nghi ngờ và so sánh `channels`, `channelConfigs`, `tools` và chẩn đoán.
- Chạy `openclaw plugins registry --refresh` sau khi cài đặt hoặc gỡ bỏ gói plugin để metadata đã lưu phản ánh bản cài đặt hiện tại.
- Khởi động lại Gateway sau các thay đổi cài đặt, registry hoặc cấu hình.

Tùy chọn sửa:

- Nếu một plugin cố ý thay thế plugin khác cho cùng id kênh, plugin được ưu tiên nên khai báo `channelConfigs.<channel-id>.preferOver` với id plugin có mức ưu tiên thấp hơn. Xem [/plugins/manifest#replacing-another-channel-plugin](/vi/plugins/manifest#replacing-another-channel-plugin).
- Nếu trùng lặp là ngoài ý muốn, hãy tắt một bên bằng `plugins.entries.<plugin-id>.enabled: false` hoặc gỡ bản cài đặt plugin cũ.
- Nếu bạn đã bật rõ ràng cả hai plugin, OpenClaw giữ yêu cầu đó và báo cáo xung đột. Hãy chọn một chủ sở hữu cho kênh hoặc đổi tên các công cụ do plugin sở hữu để bề mặt runtime rõ ràng.

## Slot plugin (danh mục độc quyền)

Một số danh mục là độc quyền (chỉ một danh mục hoạt động tại một thời điểm):

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

| Slot            | Nội dung điều khiển        | Mặc định              |
| --------------- | -------------------------- | --------------------- |
| `memory`        | Plugin bộ nhớ chủ động     | `memory-core`         |
| `contextEngine` | Bộ máy ngữ cảnh chủ động   | `legacy` (tích hợp)   |

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

Các Plugin đi kèm được phát hành cùng OpenClaw. Nhiều Plugin được bật theo mặc định (ví dụ như các nhà cung cấp mô hình đi kèm, nhà cung cấp giọng nói đi kèm và Plugin trình duyệt đi kèm). Các Plugin đi kèm khác vẫn cần `openclaw plugins enable <id>`.

`--force` ghi đè một Plugin hoặc hook pack đã cài đặt hiện có tại chỗ. Dùng `openclaw plugins update <id-or-npm-spec>` cho các lần nâng cấp thường lệ của Plugin npm được theo dõi. Tùy chọn này không được hỗ trợ với `--link`, vì `--link` tái sử dụng đường dẫn nguồn thay vì sao chép lên một đích cài đặt được quản lý.

Khi `plugins.allow` đã được đặt, `openclaw plugins install` thêm id Plugin đã cài đặt vào allowlist đó trước khi bật Plugin. Nếu cùng id Plugin đó có trong `plugins.deny`, quá trình cài đặt sẽ xóa mục deny cũ đó để bản cài đặt rõ ràng có thể được tải ngay sau khi khởi động lại.

OpenClaw giữ một registry Plugin cục bộ được lưu bền vững làm mô hình đọc lạnh cho kho Plugin, quyền sở hữu đóng góp và lập kế hoạch khởi động. Các luồng cài đặt, cập nhật, gỡ cài đặt, bật và tắt sẽ làm mới registry đó sau khi thay đổi trạng thái Plugin. Cùng tệp `plugins/installs.json` giữ siêu dữ liệu cài đặt bền vững trong `installRecords` cấp cao nhất và siêu dữ liệu manifest có thể xây dựng lại trong `plugins`. Nếu registry bị thiếu, cũ hoặc không hợp lệ, `openclaw plugins registry --refresh` sẽ xây dựng lại chế độ xem manifest của nó từ bản ghi cài đặt, chính sách cấu hình và siêu dữ liệu manifest/package mà không tải các mô-đun runtime của Plugin.
`openclaw plugins update <id-or-npm-spec>` áp dụng cho các bản cài đặt được theo dõi. Truyền một spec package npm có dist-tag hoặc phiên bản chính xác sẽ phân giải tên package trở lại bản ghi Plugin được theo dõi và ghi lại spec mới cho các bản cập nhật trong tương lai. Truyền tên package không kèm phiên bản sẽ chuyển một bản cài đặt được ghim chính xác trở lại dòng phát hành mặc định của registry. Nếu Plugin npm đã cài đặt đã khớp với phiên bản đã phân giải và danh tính artifact đã ghi, OpenClaw sẽ bỏ qua cập nhật mà không tải xuống, cài đặt lại hoặc ghi lại cấu hình.
Khi `openclaw update` chạy trên kênh beta, các bản ghi Plugin npm dòng mặc định và ClawHub sẽ thử `@beta` trước và quay về mặc định/mới nhất khi không có bản phát hành beta của Plugin. Phiên bản chính xác và tag rõ ràng vẫn được ghim.

`--pin` chỉ dành cho npm. Tùy chọn này không được hỗ trợ với `--marketplace`, vì các bản cài đặt marketplace lưu siêu dữ liệu nguồn marketplace thay vì spec npm.

`--dangerously-force-unsafe-install` là tùy chọn phá kính trong tình huống khẩn cấp cho các báo động sai từ trình quét mã nguy hiểm tích hợp. Nó cho phép cài đặt Plugin và cập nhật Plugin tiếp tục vượt qua các phát hiện `critical` tích hợp, nhưng vẫn không bỏ qua các chặn chính sách `before_install` của Plugin hoặc chặn do lỗi quét. Quét cài đặt bỏ qua các tệp và thư mục kiểm thử phổ biến như `tests/`, `__tests__/`, `*.test.*` và `*.spec.*` để tránh chặn các mock kiểm thử được đóng gói; các entrypoint runtime Plugin đã khai báo vẫn được quét ngay cả khi chúng dùng một trong các tên đó.

Cờ CLI này chỉ áp dụng cho luồng cài đặt/cập nhật Plugin. Các bản cài đặt phụ thuộc Skills dựa trên Gateway dùng override yêu cầu `dangerouslyForceUnsafeInstall` tương ứng, trong khi `openclaw skills install` vẫn là luồng tải xuống/cài đặt Skills ClawHub riêng.

Nếu một Plugin bạn đã xuất bản trên ClawHub bị ẩn hoặc bị chặn bởi quá trình quét, hãy mở bảng điều khiển ClawHub hoặc chạy `clawhub package rescan <name>` để yêu cầu ClawHub kiểm tra lại. `--dangerously-force-unsafe-install` chỉ ảnh hưởng đến các bản cài đặt trên máy của bạn; nó không yêu cầu ClawHub quét lại Plugin hoặc công khai một bản phát hành bị chặn.

Các bundle tương thích tham gia vào cùng luồng liệt kê/kiểm tra/bật/tắt Plugin. Hỗ trợ runtime hiện tại bao gồm Skills trong bundle, command-skills của Claude, mặc định `settings.json` của Claude, mặc định `.lsp.json` của Claude và `lspServers` do manifest khai báo, command-skills của Cursor và các thư mục hook tương thích với Codex.

`openclaw plugins inspect <id>` cũng báo cáo các năng lực bundle được phát hiện cùng các mục máy chủ MCP và LSP được hỗ trợ hoặc không được hỗ trợ cho các Plugin dựa trên bundle.

Nguồn marketplace có thể là tên marketplace đã biết của Claude từ `~/.claude/plugins/known_marketplaces.json`, root marketplace cục bộ hoặc đường dẫn `marketplace.json`, dạng viết tắt GitHub như `owner/repo`, URL repo GitHub hoặc URL git. Với marketplace từ xa, các mục Plugin phải nằm bên trong repo marketplace đã clone và chỉ dùng nguồn đường dẫn tương đối.

Xem [tham chiếu CLI `openclaw plugins`](/vi/cli/plugins) để biết đầy đủ chi tiết.

## Tổng quan API Plugin

Plugin native xuất một đối tượng entry để lộ `register(api)`. Các Plugin cũ hơn vẫn có thể dùng `activate(api)` làm alias legacy, nhưng Plugin mới nên dùng `register`.

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

OpenClaw tải đối tượng entry và gọi `register(api)` trong quá trình kích hoạt Plugin. Loader vẫn quay về `activate(api)` cho Plugin cũ hơn, nhưng các Plugin đi kèm và Plugin bên ngoài mới nên xem `register` là hợp đồng công khai.

`api.registrationMode` cho Plugin biết vì sao entry của nó đang được tải:

| Chế độ          | Ý nghĩa                                                                                                                          |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | Kích hoạt runtime. Đăng ký công cụ, hook, dịch vụ, lệnh, route và các hiệu ứng phụ đang chạy khác.                              |
| `discovery`     | Khám phá năng lực chỉ đọc. Đăng ký nhà cung cấp và siêu dữ liệu; mã entry Plugin đáng tin cậy có thể tải, nhưng bỏ qua hiệu ứng phụ đang chạy. |
| `setup-only`    | Tải siêu dữ liệu thiết lập kênh thông qua entry thiết lập nhẹ.                                                                |
| `setup-runtime` | Tải thiết lập kênh cũng cần entry runtime.                                                                         |
| `cli-metadata`  | Chỉ thu thập siêu dữ liệu lệnh CLI.                                                                                            |

Các entry Plugin mở socket, cơ sở dữ liệu, worker nền hoặc client tồn tại lâu nên bảo vệ các hiệu ứng phụ đó bằng `api.registrationMode === "full"`. Các lần tải discovery được cache tách biệt với các lần tải kích hoạt và không thay thế registry Gateway đang chạy. Discovery là không kích hoạt, không phải không import: OpenClaw có thể đánh giá entry Plugin đáng tin cậy hoặc mô-đun Plugin kênh để xây dựng snapshot. Giữ top level của mô-đun nhẹ và không có hiệu ứng phụ, đồng thời chuyển client mạng, subprocess, listener, đọc credential và khởi động dịch vụ ra sau các đường dẫn full-runtime.

Các phương thức đăng ký phổ biến:

| Phương thức                             | Nội dung được đăng ký       |
| --------------------------------------- | --------------------------- |
| `registerProvider`                      | Nhà cung cấp mô hình (LLM)  |
| `registerChannel`                       | Kênh chat                   |
| `registerTool`                          | Công cụ agent               |
| `registerHook` / `on(...)`              | Hook vòng đời               |
| `registerSpeechProvider`                | Chuyển văn bản thành giọng nói / STT |
| `registerRealtimeTranscriptionProvider` | STT streaming               |
| `registerRealtimeVoiceProvider`         | Giọng nói realtime hai chiều |
| `registerMediaUnderstandingProvider`    | Phân tích hình ảnh/âm thanh |
| `registerImageGenerationProvider`       | Tạo hình ảnh                |
| `registerMusicGenerationProvider`       | Tạo nhạc                    |
| `registerVideoGenerationProvider`       | Tạo video                   |
| `registerWebFetchProvider`              | Nhà cung cấp fetch / scrape web |
| `registerWebSearchProvider`             | Tìm kiếm web                |
| `registerHttpRoute`                     | Endpoint HTTP               |
| `registerCommand` / `registerCli`       | Lệnh CLI                    |
| `registerContextEngine`                 | Context engine              |
| `registerService`                       | Dịch vụ nền                 |

Hành vi guard hook cho hook vòng đời có kiểu:

- `before_tool_call`: `{ block: true }` là kết thúc; các handler có độ ưu tiên thấp hơn bị bỏ qua.
- `before_tool_call`: `{ block: false }` là no-op và không xóa block trước đó.
- `before_install`: `{ block: true }` là kết thúc; các handler có độ ưu tiên thấp hơn bị bỏ qua.
- `before_install`: `{ block: false }` là no-op và không xóa block trước đó.
- `message_sending`: `{ cancel: true }` là kết thúc; các handler có độ ưu tiên thấp hơn bị bỏ qua.
- `message_sending`: `{ cancel: false }` là no-op và không xóa cancel trước đó.

App-server Codex native chạy bridge các sự kiện công cụ native của Codex trở lại bề mặt hook này. Plugin có thể chặn công cụ native của Codex thông qua `before_tool_call`, quan sát kết quả thông qua `after_tool_call` và tham gia phê duyệt `PermissionRequest` của Codex. Bridge chưa ghi lại đối số công cụ native của Codex. Ranh giới hỗ trợ runtime Codex chính xác nằm trong [hợp đồng hỗ trợ Codex harness v1](/vi/plugins/codex-harness#v1-support-contract).

Để biết đầy đủ hành vi hook có kiểu, xem [tổng quan SDK](/vi/plugins/sdk-overview#hook-decision-semantics).

## Liên quan

- [Xây dựng Plugin](/vi/plugins/building-plugins) - tạo Plugin của riêng bạn
- [Gói Plugin](/vi/plugins/bundles) - khả năng tương thích gói Codex/Claude/Cursor
- [Manifest Plugin](/vi/plugins/manifest) - lược đồ manifest
- [Đăng ký công cụ](/vi/plugins/building-plugins#registering-agent-tools) - thêm công cụ agent trong một Plugin
- [Nội bộ Plugin](/vi/plugins/architecture) - mô hình năng lực và quy trình tải
- [Plugin cộng đồng](/vi/plugins/community) - danh sách bên thứ ba
