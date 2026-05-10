---
read_when:
    - Cài đặt hoặc cấu hình Plugin
    - Tìm hiểu các quy tắc phát hiện và nạp Plugin
    - Làm việc với các gói Plugin tương thích với Codex/Claude
sidebarTitle: Install and Configure
summary: Cài đặt, cấu hình và quản lý các Plugin OpenClaw
title: Plugin
x-i18n:
    generated_at: "2026-05-10T19:54:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: dd1b80ba25fdb0b108c4899e1ad8e2e2bea30cc04076fb79a9416e043922f964
    source_path: tools/plugin.md
    workflow: 16
---

Plugin mở rộng OpenClaw bằng các khả năng mới: kênh, nhà cung cấp mô hình,
bộ điều khiển agent, công cụ, Skills, giọng nói, phiên âm thời gian thực, thoại
thời gian thực, hiểu phương tiện, tạo hình ảnh, tạo video, tìm nạp web, tìm
kiếm web, v.v. Một số Plugin là **core** (được phát hành cùng OpenClaw), số khác
là **external**. Hầu hết Plugin external được phát hành và khám phá thông qua
[ClawHub](/vi/clawhub). Npm vẫn được hỗ trợ cho cài đặt trực tiếp và cho một
nhóm tạm thời các gói Plugin do OpenClaw sở hữu trong khi quá trình di chuyển
đó hoàn tất.

## Bắt đầu nhanh

Để xem ví dụ sao chép-dán về cài đặt, liệt kê, gỡ cài đặt, cập nhật và phát
hành, xem [Quản lý Plugin](/vi/plugins/manage-plugins).

<Steps>
  <Step title="Xem những gì đang được tải">
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

  <Step title="Quản lý gốc chat">
    Trong một Gateway đang chạy, `/plugins enable` và `/plugins disable` chỉ dành
    cho chủ sở hữu sẽ kích hoạt trình tải lại cấu hình Gateway. Gateway tải lại
    các bề mặt runtime của Plugin trong tiến trình, và các lượt agent mới dựng
    lại danh sách công cụ từ registry đã làm mới. `/plugins install` thay đổi
    mã nguồn Plugin, vì vậy Gateway yêu cầu khởi động lại thay vì giả vờ rằng
    tiến trình hiện tại có thể tải lại an toàn các mô-đun đã được import.

  </Step>

  <Step title="Xác minh Plugin">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json

    # If the plugin registered a CLI root, run one command from that root.
    openclaw <plugin-command> --help
    ```

    Dùng `--runtime` khi bạn cần chứng minh các công cụ, dịch vụ, phương thức
    gateway, hook hoặc lệnh CLI do Plugin sở hữu đã được đăng ký. `inspect`
    thuần là kiểm tra manifest/registry lạnh và có chủ đích tránh import runtime
    của Plugin.

  </Step>
</Steps>

Nếu bạn thích điều khiển gốc chat, bật `commands.plugins: true` và dùng:

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

Đường dẫn cài đặt dùng cùng bộ phân giải như CLI: đường dẫn/kho lưu trữ cục bộ,
`clawhub:<pkg>` rõ ràng, `npm:<pkg>` rõ ràng, `npm-pack:<path.tgz>` rõ ràng,
`git:<repo>` rõ ràng, hoặc đặc tả gói trần thông qua npm.

Nếu cấu hình không hợp lệ, cài đặt thường sẽ fail closed và trỏ bạn đến
`openclaw doctor --fix`. Ngoại lệ khôi phục duy nhất là một đường dẫn cài đặt
lại Plugin bundled hẹp cho các Plugin chọn tham gia
`openclaw.install.allowInvalidConfigRecovery`.
Trong quá trình khởi động Gateway, cấu hình Plugin không hợp lệ fail closed như
bất kỳ cấu hình không hợp lệ nào khác. Chạy `openclaw doctor --fix` để cách ly
cấu hình Plugin lỗi bằng cách tắt mục Plugin đó và xóa payload cấu hình không
hợp lệ của nó; bản sao lưu cấu hình bình thường giữ lại các giá trị trước đó.
Khi một cấu hình kênh tham chiếu một Plugin không còn khám phá được nhưng cùng
ID Plugin cũ vẫn còn trong cấu hình Plugin hoặc bản ghi cài đặt, quá trình khởi
động Gateway ghi cảnh báo và bỏ qua kênh đó thay vì chặn mọi kênh khác.
Chạy `openclaw doctor --fix` để xóa các mục kênh/Plugin cũ; các khóa kênh không
xác định mà không có bằng chứng Plugin cũ vẫn fail validation để lỗi gõ nhầm vẫn
hiển thị.
Nếu đặt `plugins.enabled: false`, tham chiếu Plugin cũ được xem là bất hoạt:
khởi động Gateway bỏ qua công việc khám phá/tải Plugin và `openclaw doctor` giữ
nguyên cấu hình Plugin đã tắt thay vì tự động xóa nó. Bật lại Plugin trước khi
chạy dọn dẹp doctor nếu bạn muốn xóa các ID Plugin cũ.

Việc cài đặt phụ thuộc của Plugin chỉ diễn ra trong các luồng cài đặt/cập nhật
rõ ràng hoặc sửa chữa bằng doctor. Khởi động Gateway, tải lại cấu hình và kiểm
tra runtime không chạy trình quản lý gói hoặc sửa cây phụ thuộc. Plugin cục bộ
phải đã cài sẵn các phụ thuộc, trong khi Plugin npm, git và ClawHub được cài
dưới các gốc Plugin do OpenClaw quản lý. Phụ thuộc npm có thể được hoist trong
gốc npm do OpenClaw quản lý; cài đặt/cập nhật quét gốc được quản lý đó trước khi
tin cậy và gỡ cài đặt sẽ xóa các gói do npm quản lý thông qua npm. Plugin
external và đường dẫn tải tùy chỉnh vẫn phải được cài thông qua
`openclaw plugins install`. Dùng `openclaw plugins list --json` để xem
`dependencyStatus` tĩnh cho từng Plugin hiển thị mà không import mã runtime hoặc
sửa phụ thuộc.
Xem [Phân giải phụ thuộc Plugin](/vi/plugins/dependency-resolution) để biết vòng
đời tại thời điểm cài đặt.

### Quyền sở hữu đường dẫn Plugin bị chặn

Nếu chẩn đoán Plugin báo
`blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
và xác thực cấu hình tiếp theo với `plugin present but blocked`, OpenClaw đã tìm
thấy các tệp Plugin thuộc sở hữu của một người dùng Unix khác với tiến trình
đang tải chúng. Giữ nguyên cấu hình Plugin; sửa quyền sở hữu hệ thống tệp hoặc
chạy OpenClaw bằng cùng người dùng sở hữu thư mục trạng thái.

Đối với cài đặt Docker, image chính thức chạy dưới dạng `node` (uid `1000`), vì
vậy các thư mục cấu hình OpenClaw và workspace được bind-mount từ host thông
thường nên thuộc sở hữu của uid `1000`:

```bash
sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
```

Nếu bạn cố ý chạy OpenClaw dưới quyền root, hãy sửa gốc Plugin được quản lý
thành quyền sở hữu root thay vào đó:

```bash
sudo chown -R root:root /path/to/openclaw-config/npm
```

Sau khi sửa quyền sở hữu, chạy lại `openclaw doctor --fix` hoặc
`openclaw plugins registry --refresh` để registry Plugin đã lưu khớp với các tệp
đã sửa.

Đối với cài đặt npm, các selector có thể thay đổi như `latest` hoặc dist-tag
được phân giải trước khi cài đặt rồi được ghim vào đúng phiên bản đã xác minh
trong gốc npm do OpenClaw quản lý. Sau khi npm hoàn tất, OpenClaw xác minh mục
`package-lock.json` đã cài vẫn khớp với phiên bản và integrity đã phân giải. Nếu
npm ghi metadata gói khác, quá trình cài đặt thất bại và gói được quản lý được
rollback thay vì chấp nhận một artifact Plugin khác.
Các gốc npm được quản lý cũng kế thừa `overrides` npm cấp gói của OpenClaw, nên
các pin bảo mật bảo vệ host đã đóng gói cũng áp dụng cho các phụ thuộc Plugin
external được hoist.

Source checkout là pnpm workspace. Nếu bạn clone OpenClaw để chỉnh sửa Plugin
bundled, chạy `pnpm install`; sau đó OpenClaw tải Plugin bundled từ
`extensions/<id>` để các chỉnh sửa và phụ thuộc cục bộ của gói được dùng trực
tiếp. Cài đặt gốc npm thuần dành cho OpenClaw đã đóng gói, không dành cho phát
triển source checkout.

## Loại Plugin

OpenClaw nhận diện hai định dạng Plugin:

| Định dạng  | Cách hoạt động                                                   | Ví dụ                                                  |
| ---------- | ---------------------------------------------------------------- | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + mô-đun runtime; thực thi trong tiến trình | Plugin chính thức, gói npm cộng đồng                   |
| **Bundle** | Bố cục tương thích Codex/Claude/Cursor; ánh xạ sang tính năng OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Cả hai đều xuất hiện trong `openclaw plugins list`. Xem [Plugin Bundle](/vi/plugins/bundles) để biết chi tiết về bundle.

Nếu bạn đang viết Plugin native, hãy bắt đầu với [Xây dựng Plugin](/vi/plugins/building-plugins)
và [Tổng quan Plugin SDK](/vi/plugins/sdk-overview).

## Entrypoint gói

Các gói npm Plugin native phải khai báo `openclaw.extensions` trong `package.json`.
Mỗi mục phải nằm trong thư mục gói và phân giải tới một tệp runtime có thể đọc,
hoặc tới một tệp nguồn TypeScript với peer JavaScript đã build được suy luận như
`src/index.ts` tới `dist/index.js`.
Cài đặt đã đóng gói phải cung cấp output runtime JavaScript đó. Fallback nguồn
TypeScript dành cho source checkout và đường dẫn phát triển cục bộ, không dành
cho các gói npm được cài vào gốc Plugin do OpenClaw quản lý.

Nếu cảnh báo gói được quản lý nói rằng nó `requires compiled runtime output for
TypeScript entry ...`, gói đã được phát hành mà không có các tệp JavaScript
OpenClaw cần khi chạy. Đó là vấn đề đóng gói Plugin, không phải vấn đề cấu hình
cục bộ. Cập nhật hoặc cài đặt lại Plugin sau khi nhà phát hành phát hành lại
JavaScript đã biên dịch, hoặc tắt/gỡ cài đặt Plugin đó cho đến khi có gói đã sửa.

Dùng `openclaw.runtimeExtensions` khi các tệp runtime đã phát hành không nằm ở
cùng đường dẫn với các mục nguồn. Khi có mặt, `runtimeExtensions` phải chứa đúng
một mục cho mỗi mục `extensions`. Danh sách không khớp sẽ làm cài đặt và khám
phá Plugin thất bại thay vì âm thầm fallback về đường dẫn nguồn. Nếu bạn cũng
phát hành `openclaw.setupEntry`, dùng `openclaw.runtimeSetupEntry` cho peer
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
OpenClaw đã đóng gói hiện tại đã bundle nhiều Plugin chính thức, nên chúng không
cần cài đặt npm riêng trong các thiết lập thông thường. Cho đến khi mọi Plugin
do OpenClaw sở hữu đã di chuyển sang ClawHub, OpenClaw vẫn phát hành một số gói
Plugin `@openclaw/*` trên npm cho các cài đặt cũ/tùy chỉnh và quy trình npm
trực tiếp.

Nếu npm báo một gói Plugin `@openclaw/*` là deprecated, phiên bản gói đó thuộc
một chuỗi gói external cũ hơn. Dùng Plugin bundled từ OpenClaw hiện tại hoặc
một checkout cục bộ cho đến khi gói npm mới hơn được phát hành.

| Plugin          | Gói                        | Tài liệu                                   |
| --------------- | -------------------------- | ------------------------------------------ |
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

### Core (được phát hành cùng OpenClaw)

<AccordionGroup>
  <Accordion title="Nhà cung cấp mô hình (được bật theo mặc định)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Plugin bộ nhớ">
    - `memory-core` - tìm kiếm bộ nhớ đi kèm (mặc định qua `plugins.slots.memory`)
    - `memory-lancedb` - bộ nhớ dài hạn dựa trên LanceDB với tự động truy hồi/ghi nhận (đặt `plugins.slots.memory = "memory-lancedb"`)

    Xem [Memory LanceDB](/vi/plugins/memory-lancedb) để biết cách thiết lập
    embedding tương thích OpenAI, ví dụ Ollama, giới hạn truy hồi và khắc phục sự cố.

  </Accordion>

  <Accordion title="Nhà cung cấp giọng nói (được bật theo mặc định)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Khác">
    - `browser` - Plugin trình duyệt đi kèm cho công cụ trình duyệt, CLI `openclaw browser`, phương thức Gateway `browser.request`, runtime trình duyệt và dịch vụ điều khiển trình duyệt mặc định (được bật theo mặc định; hãy tắt trước khi thay thế)
    - `copilot-proxy` - cầu nối VS Code Copilot Proxy (bị tắt theo mặc định)

  </Accordion>
</AccordionGroup>

Đang tìm Plugin của bên thứ ba? Xem [ClawHub](/vi/clawhub).

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

| Trường             | Mô tả                                                     |
| ------------------ | --------------------------------------------------------- |
| `enabled`          | Công tắc chính (mặc định: `true`)                         |
| `allow`            | Danh sách cho phép Plugin (tùy chọn)                      |
| `bundledDiscovery` | Chế độ khám phá Plugin đi kèm (`allowlist` theo mặc định) |
| `deny`             | Danh sách chặn Plugin (tùy chọn; chặn được ưu tiên)       |
| `load.paths`       | Tệp/thư mục Plugin bổ sung                                |
| `slots`            | Bộ chọn slot độc quyền (ví dụ: `memory`, `contextEngine`) |
| `entries.\<id\>`   | Công tắc + cấu hình theo từng Plugin                      |

`plugins.allow` là độc quyền. Khi không rỗng, chỉ các Plugin được liệt kê mới có thể tải
hoặc hiển thị công cụ, ngay cả khi `tools.allow` chứa `"*"` hoặc một tên công cụ
do Plugin cụ thể sở hữu. Nếu danh sách cho phép công cụ tham chiếu đến công cụ Plugin, hãy thêm id Plugin sở hữu
vào `plugins.allow` hoặc xóa `plugins.allow`; `openclaw doctor` cảnh báo về
dạng cấu hình này.

`plugins.bundledDiscovery` mặc định là `"allowlist"` cho cấu hình mới, vì vậy một
kho `plugins.allow` hạn chế cũng chặn các Plugin nhà cung cấp đi kèm bị bỏ qua,
bao gồm cả khám phá nhà cung cấp tìm kiếm web runtime. Doctor đóng dấu các
cấu hình danh sách cho phép hạn chế cũ hơn bằng `"compat"` trong quá trình di chuyển để các bản nâng cấp giữ
hành vi nhà cung cấp đi kèm cũ cho đến khi người vận hành chọn chế độ nghiêm ngặt hơn.
`plugins.allow` rỗng vẫn được xử lý như chưa đặt/mở.

Các thay đổi cấu hình được thực hiện thông qua `/plugins enable` hoặc `/plugins disable` sẽ kích hoạt
tải lại Plugin Gateway trong cùng tiến trình. Các lượt agent mới dựng lại danh sách công cụ từ
registry Plugin đã được làm mới. Các thao tác thay đổi nguồn như cài đặt,
cập nhật và gỡ cài đặt vẫn khởi động lại tiến trình Gateway vì các mô-đun
Plugin đã được import không thể được thay thế tại chỗ một cách an toàn.

`openclaw plugins list` là ảnh chụp nhanh registry/cấu hình Plugin cục bộ. Một Plugin
`enabled` ở đó có nghĩa là registry đã lưu và cấu hình hiện tại cho phép
Plugin tham gia. Điều đó không chứng minh rằng một Gateway từ xa đang chạy
đã tải lại hoặc khởi động lại vào cùng mã Plugin. Trên các thiết lập VPS/container
có tiến trình wrapper, hãy gửi khởi động lại hoặc thao tác ghi kích hoạt tải lại đến đúng
tiến trình `openclaw gateway run`, hoặc dùng `openclaw gateway restart` với
Gateway đang chạy khi báo cáo tải lại thất bại.

<Accordion title="Trạng thái Plugin: bị tắt so với thiếu so với không hợp lệ">
  - **Bị tắt**: Plugin tồn tại nhưng quy tắc bật đã tắt nó. Cấu hình được giữ nguyên.
  - **Thiếu**: cấu hình tham chiếu đến một id Plugin mà khám phá không tìm thấy.
  - **Không hợp lệ**: Plugin tồn tại nhưng cấu hình của nó không khớp với schema đã khai báo. Khởi động Gateway chỉ bỏ qua Plugin đó; `openclaw doctor --fix` có thể cách ly mục không hợp lệ bằng cách tắt nó và xóa payload cấu hình của nó.

</Accordion>

## Khám phá và độ ưu tiên

OpenClaw quét Plugin theo thứ tự sau (kết quả khớp đầu tiên được chọn):

<Steps>
  <Step title="Đường dẫn cấu hình">
    `plugins.load.paths` - đường dẫn tệp hoặc thư mục rõ ràng. Các đường dẫn trỏ
    ngược về thư mục Plugin đi kèm đã đóng gói của chính OpenClaw sẽ bị bỏ qua;
    chạy `openclaw doctor --fix` để xóa các alias cũ đó.
  </Step>

  <Step title="Plugin workspace">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` và `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Plugin toàn cục">
    `~/.openclaw/<plugin-root>/*.ts` và `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Plugin đi kèm">
    Được phát hành cùng OpenClaw. Nhiều Plugin được bật theo mặc định (nhà cung cấp mô hình, giọng nói).
    Những Plugin khác cần được bật rõ ràng.
  </Step>
</Steps>

Bản cài đặt đóng gói và ảnh Docker thường phân giải Plugin đi kèm từ cây
`dist/extensions` đã biên dịch. Nếu một thư mục nguồn Plugin đi kèm được
bind-mount đè lên đường dẫn nguồn đóng gói tương ứng, ví dụ
`/app/extensions/synology-chat`, OpenClaw xử lý thư mục nguồn đã mount đó
như một lớp phủ nguồn đi kèm và khám phá nó trước bundle
`/app/dist/extensions/synology-chat` đã đóng gói. Điều này giúp các vòng lặp
container của maintainer tiếp tục hoạt động mà không cần chuyển mọi Plugin đi kèm về lại nguồn TypeScript.
Đặt `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1` để buộc dùng các bundle dist đã đóng gói
ngay cả khi có mount lớp phủ nguồn.

### Quy tắc bật

- `plugins.enabled: false` tắt tất cả Plugin và bỏ qua công việc khám phá/tải Plugin
- `plugins.deny` luôn được ưu tiên hơn allow
- `plugins.entries.\<id\>.enabled: false` tắt Plugin đó
- Plugin có nguồn gốc từ workspace **bị tắt theo mặc định** (phải được bật rõ ràng)
- Plugin đi kèm tuân theo tập mặc định bật sẵn tích hợp trừ khi bị ghi đè
- Slot độc quyền có thể ép bật Plugin được chọn cho slot đó
- Một số Plugin đi kèm dạng opt-in được bật tự động khi cấu hình nêu tên một
  bề mặt do Plugin sở hữu, chẳng hạn như ref mô hình nhà cung cấp, cấu hình kênh hoặc runtime
  harness
- Cấu hình Plugin cũ được giữ nguyên khi `plugins.enabled: false` đang hoạt động;
  bật lại Plugin trước khi chạy dọn dẹp bằng doctor nếu bạn muốn xóa các id cũ
- Các tuyến Codex thuộc họ OpenAI giữ ranh giới Plugin riêng:
  `openai-codex/*` thuộc về Plugin OpenAI, trong khi Plugin app-server Codex
  đi kèm được chọn bởi các ref agent `openai/*` chuẩn, provider/model rõ ràng
  `agentRuntime.id: "codex"`, hoặc các ref mô hình `codex/*` cũ

## Khắc phục sự cố hook runtime

Nếu một Plugin xuất hiện trong `plugins list` nhưng tác dụng phụ hoặc hook
`register(api)` không chạy trong lưu lượng trò chuyện trực tiếp, hãy kiểm tra các mục này trước:

- Chạy `openclaw gateway status --deep --require-rpc` và xác nhận URL Gateway
  đang hoạt động, profile, đường dẫn cấu hình và tiến trình là những thứ bạn đang chỉnh sửa.
- Khởi động lại Gateway trực tiếp sau các thay đổi cài đặt/cấu hình/mã Plugin. Trong container
  wrapper, PID 1 có thể chỉ là supervisor; hãy khởi động lại hoặc gửi tín hiệu tới tiến trình con
  `openclaw gateway run`.
- Dùng `openclaw plugins inspect <id> --runtime --json` để xác nhận đăng ký hook và
  chẩn đoán. Các hook hội thoại không đi kèm như `before_model_resolve`,
  `before_agent_reply`, `before_agent_run`, `llm_input`, `llm_output`,
  `before_agent_finalize`, và `agent_end` cần
  `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- Để chuyển mô hình, ưu tiên `before_model_resolve`. Nó chạy trước khi phân giải mô hình
  cho các lượt agent; `llm_output` chỉ chạy sau khi một lần thử mô hình
  tạo ra đầu ra assistant.
- Để chứng minh mô hình phiên hiệu lực, dùng `openclaw sessions` hoặc các bề mặt
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

Tóm tắt liệt kê tổng thời gian factory và các factory công cụ Plugin chậm nhất,
bao gồm id Plugin, tên công cụ đã khai báo, dạng kết quả và công cụ có phải là
tùy chọn hay không. Các dòng chậm được nâng thành cảnh báo khi một factory duy nhất mất
ít nhất 1 giây hoặc tổng thời gian chuẩn bị factory công cụ Plugin mất ít nhất 5 giây.

OpenClaw lưu cache kết quả factory công cụ Plugin thành công cho các lần phân giải lặp lại
với cùng ngữ cảnh yêu cầu hiệu lực. Khóa cache bao gồm cấu hình
runtime hiệu lực, workspace, id agent/phiên, chính sách sandbox, thiết lập trình duyệt,
ngữ cảnh phân phối, danh tính người yêu cầu và trạng thái sở hữu, vì vậy các factory
phụ thuộc vào những trường đáng tin cậy đó sẽ được chạy lại khi ngữ cảnh thay đổi.

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

Những thông báo này có nghĩa là nhiều hơn một Plugin đang bật đang cố sở hữu cùng một kênh,
luồng thiết lập hoặc tên công cụ. Nguyên nhân phổ biến nhất là một Plugin kênh bên ngoài
được cài cạnh một Plugin đi kèm hiện cung cấp cùng id kênh.

Các bước gỡ lỗi:

- Chạy `openclaw plugins list --enabled --verbose` để xem mọi Plugin đang bật
  và nguồn gốc.
- Chạy `openclaw plugins inspect <id> --runtime --json` cho từng Plugin nghi ngờ và
  so sánh `channels`, `channelConfigs`, `tools`, và chẩn đoán.
- Chạy `openclaw plugins registry --refresh` sau khi cài đặt hoặc gỡ bỏ
  gói Plugin để metadata đã lưu phản ánh bản cài hiện tại.
- Khởi động lại Gateway sau các thay đổi cài đặt, registry hoặc cấu hình.

Tùy chọn sửa:

- Nếu một Plugin cố ý thay thế Plugin khác cho cùng id kênh, Plugin
  được ưu tiên nên khai báo `channelConfigs.<channel-id>.preferOver` với
  id Plugin có độ ưu tiên thấp hơn. Xem [/plugins/manifest#replacing-another-channel-plugin](/vi/plugins/manifest#replacing-another-channel-plugin).
- Nếu trùng lặp là ngoài ý muốn, hãy tắt một bên bằng
  `plugins.entries.<plugin-id>.enabled: false` hoặc xóa bản cài Plugin
  cũ.
- Nếu bạn đã bật rõ ràng cả hai Plugin, OpenClaw giữ yêu cầu đó và
  báo cáo xung đột. Hãy chọn một chủ sở hữu cho kênh hoặc đổi tên các công cụ
  do Plugin sở hữu để bề mặt runtime rõ ràng.

## Slot Plugin (danh mục độc quyền)

Một số danh mục là độc quyền (mỗi lúc chỉ một danh mục hoạt động):

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

| Slot            | Nó kiểm soát gì       | Mặc định             |
| --------------- | --------------------- | ------------------- |
| `memory`        | Plugin bộ nhớ hoạt động | `memory-core`       |
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

Các Plugin đi kèm được phát hành cùng OpenClaw. Nhiều Plugin được bật theo mặc định (ví dụ:
các nhà cung cấp mô hình đi kèm, các nhà cung cấp giọng nói đi kèm và Plugin trình duyệt
đi kèm). Các Plugin đi kèm khác vẫn cần `openclaw plugins enable <id>`.

`--force` ghi đè tại chỗ một Plugin hoặc gói hook đã cài đặt hiện có. Dùng
`openclaw plugins update <id-or-npm-spec>` cho các bản nâng cấp thường lệ của các Plugin npm
được theo dõi. Tùy chọn này không được hỗ trợ với `--link`, vốn tái sử dụng đường dẫn nguồn thay vì
sao chép lên một đích cài đặt được quản lý.

Khi `plugins.allow` đã được đặt, `openclaw plugins install` thêm id Plugin
đã cài đặt vào allowlist đó trước khi bật Plugin. Nếu cùng id Plugin
có trong `plugins.deny`, install sẽ xóa mục deny cũ đó để bản cài đặt
tường minh có thể được tải ngay sau khi khởi động lại.

OpenClaw duy trì một registry Plugin cục bộ đã lưu trữ làm mô hình đọc nguội cho
kho Plugin, quyền sở hữu đóng góp và lập kế hoạch khởi động. Các luồng install, update,
uninstall, enable và disable làm mới registry đó sau khi thay đổi trạng thái Plugin.
Cùng tệp `plugins/installs.json` giữ metadata cài đặt bền vững trong
`installRecords` cấp cao nhất và metadata manifest có thể xây dựng lại trong `plugins`. Nếu
registry bị thiếu, cũ hoặc không hợp lệ, `openclaw plugins registry
--refresh` xây dựng lại chế độ xem manifest của nó từ các bản ghi cài đặt, chính sách cấu hình và
metadata manifest/package mà không tải các mô-đun runtime của Plugin.

Trong chế độ Nix (`OPENCLAW_NIX_MODE=1`), các bộ thay đổi vòng đời Plugin bị tắt.
Thay vào đó, hãy quản lý lựa chọn gói Plugin và cấu hình thông qua nguồn Nix cho
bản cài đặt; với nix-openclaw, bắt đầu bằng
[Quick Start](https://github.com/openclaw/nix-openclaw#quick-start) ưu tiên agent.
`openclaw plugins update <id-or-npm-spec>` áp dụng cho các bản cài đặt được theo dõi. Truyền
một spec gói npm với dist-tag hoặc phiên bản chính xác sẽ phân giải tên gói
về bản ghi Plugin được theo dõi và ghi lại spec mới cho các bản cập nhật trong tương lai.
Truyền tên gói không kèm phiên bản sẽ chuyển một bản cài đặt được ghim chính xác trở lại
dòng phát hành mặc định của registry. Nếu Plugin npm đã cài đặt đã khớp
phiên bản được phân giải và danh tính artifact đã ghi, OpenClaw bỏ qua bản cập nhật
mà không tải xuống, cài đặt lại hoặc ghi lại cấu hình.
Khi `openclaw update` chạy trên kênh beta, các bản ghi Plugin npm và ClawHub
thuộc dòng mặc định sẽ thử `@beta` trước và quay về mặc định/latest khi không có
bản phát hành beta Plugin nào. Các phiên bản chính xác và tag tường minh vẫn được ghim.

`--pin` chỉ dành cho npm. Tùy chọn này không được hỗ trợ với `--marketplace`, vì
các bản cài đặt marketplace lưu metadata nguồn marketplace thay vì một spec npm.

`--dangerously-force-unsafe-install` là một ghi đè khẩn cấp cho các kết quả dương tính giả
từ trình quét mã nguy hiểm tích hợp. Nó cho phép các bản cài đặt Plugin
và cập nhật Plugin tiếp tục vượt qua các phát hiện `critical` tích hợp, nhưng vẫn
không bỏ qua các chặn chính sách `before_install` của Plugin hoặc chặn do lỗi quét.
Quét cài đặt bỏ qua các tệp và thư mục kiểm thử phổ biến như `tests/`,
`__tests__/`, `*.test.*` và `*.spec.*` để tránh chặn các mock kiểm thử đã đóng gói;
các entrypoint runtime đã khai báo của Plugin vẫn được quét ngay cả khi chúng dùng một trong
các tên đó.

Cờ CLI này chỉ áp dụng cho các luồng install/update Plugin. Các bản cài đặt phụ thuộc Skills
dựa trên Gateway dùng ghi đè yêu cầu `dangerouslyForceUnsafeInstall` tương ứng
thay vào đó, trong khi `openclaw skills install` vẫn là luồng tải xuống/cài đặt Skills
ClawHub riêng biệt.

Nếu một Plugin bạn đã phát hành trên ClawHub bị ẩn hoặc bị chặn bởi một lần quét, hãy mở
dashboard ClawHub hoặc chạy `clawhub package rescan <name>` để yêu cầu ClawHub kiểm tra
lại. `--dangerously-force-unsafe-install` chỉ ảnh hưởng đến các bản cài đặt trên chính
máy của bạn; nó không yêu cầu ClawHub quét lại Plugin hoặc công khai một bản phát hành
bị chặn.

Các bundle tương thích tham gia cùng luồng list/inspect/enable/disable Plugin.
Hỗ trợ runtime hiện tại bao gồm Skills trong bundle, command-skills Claude,
các mặc định `settings.json` của Claude, các mặc định `lspServers` do manifest khai báo và
`.lsp.json` của Claude, command-skills Cursor và các thư mục hook Codex tương thích.

`openclaw plugins inspect <id>` cũng báo cáo các khả năng bundle được phát hiện cùng
các mục máy chủ MCP và LSP được hỗ trợ hoặc không được hỗ trợ cho các Plugin dựa trên bundle.

Nguồn marketplace có thể là một tên known-marketplace của Claude từ
`~/.claude/plugins/known_marketplaces.json`, một gốc marketplace cục bộ hoặc đường dẫn
`marketplace.json`, một shorthand GitHub như `owner/repo`, một URL repo GitHub,
hoặc một URL git. Với marketplace từ xa, các mục Plugin phải ở bên trong
repo marketplace đã clone và chỉ dùng nguồn đường dẫn tương đối.

Xem [tham chiếu CLI `openclaw plugins`](/vi/cli/plugins) để biết đầy đủ chi tiết.

## Tổng quan API Plugin

Các Plugin native xuất một đối tượng entry phơi bày `register(api)`. Các Plugin cũ hơn
vẫn có thể dùng `activate(api)` làm alias kế thừa, nhưng Plugin mới nên
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

OpenClaw tải đối tượng entry và gọi `register(api)` trong quá trình kích hoạt Plugin.
Loader vẫn fallback về `activate(api)` cho các Plugin cũ hơn,
nhưng các Plugin đi kèm và Plugin bên ngoài mới nên xem `register` là
hợp đồng công khai.

`api.registrationMode` cho Plugin biết lý do entry của nó đang được tải:

| Chế độ          | Ý nghĩa                                                                                                                          |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | Kích hoạt runtime. Đăng ký công cụ, hook, dịch vụ, lệnh, route và các side effect đang chạy khác.                              |
| `discovery`     | Phát hiện khả năng chỉ đọc. Đăng ký provider và metadata; mã entry Plugin đáng tin cậy có thể tải, nhưng bỏ qua side effect đang chạy. |
| `setup-only`    | Tải metadata thiết lập channel thông qua một entry thiết lập nhẹ.                                                                |
| `setup-runtime` | Tải thiết lập channel cũng cần entry runtime.                                                                         |
| `cli-metadata`  | Chỉ thu thập metadata lệnh CLI.                                                                                            |

Các entry Plugin mở socket, cơ sở dữ liệu, worker nền hoặc client tồn tại lâu
nên bảo vệ các side effect đó bằng `api.registrationMode === "full"`.
Các lần tải discovery được cache riêng với các lần tải kích hoạt và không thay thế
registry Gateway đang chạy. Discovery là không kích hoạt, không phải không import:
OpenClaw có thể đánh giá entry Plugin đáng tin cậy hoặc mô-đun Plugin channel để xây dựng
snapshot. Giữ cấp cao nhất của mô-đun nhẹ và không có side effect, đồng thời chuyển
client mạng, tiến trình con, listener, đọc credential và khởi động dịch vụ
ra sau các đường dẫn full-runtime.

Các phương thức đăng ký phổ biến:

| Phương thức                              | Nội dung đăng ký              |
| --------------------------------------- | ----------------------------- |
| `registerProvider`                      | Nhà cung cấp mô hình (LLM)    |
| `registerChannel`                       | Channel chat                  |
| `registerTool`                          | Công cụ agent                 |
| `registerHook` / `on(...)`              | Hook vòng đời                 |
| `registerSpeechProvider`                | Text-to-speech / STT          |
| `registerRealtimeTranscriptionProvider` | STT phát trực tuyến           |
| `registerRealtimeVoiceProvider`         | Giọng nói realtime hai chiều  |
| `registerMediaUnderstandingProvider`    | Phân tích hình ảnh/âm thanh   |
| `registerImageGenerationProvider`       | Tạo hình ảnh                  |
| `registerMusicGenerationProvider`       | Tạo nhạc                      |
| `registerVideoGenerationProvider`       | Tạo video                     |
| `registerWebFetchProvider`              | Nhà cung cấp web fetch / scrape |
| `registerWebSearchProvider`             | Tìm kiếm web                  |
| `registerHttpRoute`                     | Endpoint HTTP                 |
| `registerCommand` / `registerCli`       | Lệnh CLI                      |
| `registerContextEngine`                 | Công cụ ngữ cảnh              |
| `registerService`                       | Dịch vụ nền                   |

Hành vi guard hook cho các hook vòng đời có kiểu:

- `before_tool_call`: `{ block: true }` là kết thúc; các handler có độ ưu tiên thấp hơn bị bỏ qua.
- `before_tool_call`: `{ block: false }` là no-op và không xóa một block trước đó.
- `before_install`: `{ block: true }` là kết thúc; các handler có độ ưu tiên thấp hơn bị bỏ qua.
- `before_install`: `{ block: false }` là no-op và không xóa một block trước đó.
- `message_sending`: `{ cancel: true }` là kết thúc; các handler có độ ưu tiên thấp hơn bị bỏ qua.
- `message_sending`: `{ cancel: false }` là no-op và không xóa một cancel trước đó.

Máy chủ ứng dụng Codex native chạy cầu nối đưa các sự kiện công cụ native của Codex trở lại bề mặt hook này. Plugin có thể chặn các công cụ Codex native thông qua `before_tool_call`, quan sát kết quả thông qua `after_tool_call`, và tham gia phê duyệt `PermissionRequest` của Codex. Cầu nối hiện chưa viết lại các đối số công cụ native của Codex. Ranh giới hỗ trợ chính xác của runtime Codex nằm trong [hợp đồng hỗ trợ Codex harness v1](/vi/plugins/codex-harness-runtime#v1-support-contract).

Để biết đầy đủ hành vi hook có kiểu, hãy xem [tổng quan SDK](/vi/plugins/sdk-overview#hook-decision-semantics).

## Liên quan

- [Xây dựng plugin](/vi/plugins/building-plugins) - tạo plugin của riêng bạn
- [Gói Plugin](/vi/plugins/bundles) - khả năng tương thích gói Codex/Claude/Cursor
- [Manifest Plugin](/vi/plugins/manifest) - lược đồ manifest
- [Đăng ký công cụ](/vi/plugins/building-plugins#registering-agent-tools) - thêm công cụ agent trong một plugin
- [Nội bộ Plugin](/vi/plugins/architecture) - mô hình capability và pipeline tải
- [ClawHub](/vi/clawhub) - khám phá plugin của bên thứ ba
