---
read_when:
    - Cài đặt hoặc cấu hình Plugin
    - Tìm hiểu về các quy tắc phát hiện và tải Plugin
    - Làm việc với các gói Plugin tương thích với Codex/Claude
sidebarTitle: Install and Configure
summary: Cài đặt, cấu hình và quản lý các Plugin OpenClaw
title: Plugin
x-i18n:
    generated_at: "2026-05-12T08:46:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: e8773fc3feb19c867b1978f21d83f1cad1752d5a2572ad607d481539ad7471df
    source_path: tools/plugin.md
    workflow: 16
---

Plugin mở rộng OpenClaw với các khả năng mới: kênh, nhà cung cấp mô hình,
agent harness, công cụ, Skills, giọng nói, phiên âm thời gian thực, giọng nói
thời gian thực, hiểu phương tiện, tạo ảnh, tạo video, lấy nội dung web, tìm
kiếm web và nhiều khả năng khác. Một số plugin là **lõi** (được phát hành cùng
OpenClaw), số khác là **bên ngoài**. Hầu hết plugin bên ngoài được phát hành và
khám phá thông qua [ClawHub](/vi/clawhub). Npm vẫn được hỗ trợ cho cài đặt trực
tiếp và cho một nhóm tạm thời các gói plugin do OpenClaw sở hữu trong khi quá
trình di chuyển đó hoàn tất.

## Bắt đầu nhanh

Để xem ví dụ cài đặt, liệt kê, gỡ cài đặt, cập nhật và phát hành có thể sao
chép-dán, hãy xem [Quản lý plugin](/vi/plugins/manage-plugins).

<Steps>
  <Step title="Xem những gì đã được tải">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="Cài đặt plugin">
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

  <Step title="Quản lý trực tiếp trong trò chuyện">
    Trong một Gateway đang chạy, `/plugins enable` và `/plugins disable` chỉ dành
    cho chủ sở hữu sẽ kích hoạt bộ nạp lại cấu hình Gateway. Gateway nạp lại các
    bề mặt runtime của plugin trong tiến trình, và các lượt agent mới xây dựng
    lại danh sách công cụ của chúng từ registry đã được làm mới. `/plugins install`
    thay đổi mã nguồn plugin, vì vậy Gateway yêu cầu khởi động lại thay vì giả
    vờ rằng tiến trình hiện tại có thể nạp lại an toàn các mô-đun đã được nhập.

  </Step>

  <Step title="Xác minh plugin">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json

    # If the plugin registered a CLI root, run one command from that root.
    openclaw <plugin-command> --help
    ```

    Dùng `--runtime` khi bạn cần chứng minh các công cụ, dịch vụ, phương thức
    gateway, hook hoặc lệnh CLI do plugin sở hữu đã được đăng ký. `inspect` thuần
    là một kiểm tra manifest/registry nguội và cố ý tránh nhập runtime của plugin.

  </Step>
</Steps>

Nếu bạn thích điều khiển trực tiếp trong trò chuyện, hãy bật `commands.plugins: true` và dùng:

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

Đường dẫn cài đặt dùng cùng bộ phân giải như CLI: đường dẫn/kho lưu trữ cục bộ,
`clawhub:<pkg>` tường minh, `npm:<pkg>` tường minh, `npm-pack:<path.tgz>` tường
minh, `git:<repo>` tường minh, hoặc đặc tả gói trần thông qua npm.

Nếu cấu hình không hợp lệ, cài đặt thường sẽ thất bại đóng và chỉ bạn đến
`openclaw doctor --fix`. Ngoại lệ khôi phục duy nhất là một đường dẫn cài đặt lại
hẹp cho plugin đi kèm dành cho các plugin chọn tham gia
`openclaw.install.allowInvalidConfigRecovery`.
Trong quá trình khởi động Gateway, cấu hình plugin không hợp lệ sẽ thất bại đóng
như mọi cấu hình không hợp lệ khác. Chạy `openclaw doctor --fix` để cách ly cấu
hình plugin lỗi bằng cách tắt mục plugin đó và xóa payload cấu hình không hợp lệ
của nó; bản sao lưu cấu hình thông thường giữ lại các giá trị trước đó.
Khi cấu hình kênh tham chiếu một plugin không còn khám phá được nhưng cùng id
plugin cũ vẫn còn trong cấu hình plugin hoặc bản ghi cài đặt, quá trình khởi
động Gateway ghi cảnh báo và bỏ qua kênh đó thay vì chặn mọi kênh khác.
Chạy `openclaw doctor --fix` để xóa các mục kênh/plugin cũ; các khóa kênh không
xác định mà không có bằng chứng plugin cũ vẫn không vượt qua xác thực để lỗi gõ
nhầm vẫn hiển thị.
Nếu đặt `plugins.enabled: false`, các tham chiếu plugin cũ được coi là bất hoạt:
quá trình khởi động Gateway bỏ qua công việc khám phá/tải plugin và
`openclaw doctor` giữ nguyên cấu hình plugin đã tắt thay vì tự động xóa nó. Bật
lại plugin trước khi chạy dọn dẹp doctor nếu bạn muốn xóa các id plugin cũ.

Việc cài đặt phụ thuộc plugin chỉ diễn ra trong các luồng cài đặt/cập nhật tường
minh hoặc sửa chữa bằng doctor. Khởi động Gateway, nạp lại cấu hình và kiểm tra
runtime không chạy trình quản lý gói hoặc sửa cây phụ thuộc. Plugin cục bộ phải
đã cài đặt sẵn các phụ thuộc của chúng, còn plugin npm, git và ClawHub được cài
đặt dưới các gốc plugin do OpenClaw quản lý. Phụ thuộc npm có thể được hoist
trong gốc npm do OpenClaw quản lý; cài đặt/cập nhật quét gốc được quản lý đó
trước khi tin cậy, và gỡ cài đặt xóa các gói do npm quản lý thông qua npm.
Plugin bên ngoài và đường dẫn tải tùy chỉnh vẫn phải được cài đặt thông qua
`openclaw plugins install`.
Dùng `openclaw plugins list --json` để xem `dependencyStatus` tĩnh cho từng
plugin hiển thị mà không nhập mã runtime hoặc sửa phụ thuộc.
Xem [Phân giải phụ thuộc plugin](/vi/plugins/dependency-resolution) để biết vòng
đời tại thời điểm cài đặt.

### Quyền sở hữu đường dẫn plugin bị chặn

Nếu chẩn đoán plugin báo
`blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
và xác thực cấu hình tiếp theo bằng `plugin present but blocked`, OpenClaw đã tìm
thấy các tệp plugin thuộc sở hữu của một người dùng Unix khác với tiến trình
đang tải chúng. Giữ nguyên cấu hình plugin; sửa quyền sở hữu hệ thống tệp hoặc
chạy OpenClaw bằng cùng người dùng sở hữu thư mục trạng thái.

Đối với cài đặt Docker, image chính thức chạy dưới dạng `node` (uid `1000`), vì
vậy các thư mục cấu hình và workspace OpenClaw được bind-mount từ host thường nên
thuộc sở hữu của uid `1000`:

```bash
sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
```

Nếu bạn cố ý chạy OpenClaw với quyền root, hãy sửa gốc plugin được quản lý về
quyền sở hữu root thay vào đó:

```bash
sudo chown -R root:root /path/to/openclaw-config/npm
```

Sau khi sửa quyền sở hữu, chạy lại `openclaw doctor --fix` hoặc
`openclaw plugins registry --refresh` để registry plugin đã lưu khớp với các tệp
đã được sửa.

Đối với cài đặt npm, các selector có thể thay đổi như `latest` hoặc dist-tag
được phân giải trước khi cài đặt rồi được ghim vào đúng phiên bản đã xác minh
trong gốc npm do OpenClaw quản lý. Sau khi npm hoàn tất, OpenClaw xác minh mục
`package-lock.json` đã cài đặt vẫn khớp với phiên bản đã phân giải và integrity.
Nếu npm ghi metadata gói khác, quá trình cài đặt thất bại và gói được quản lý sẽ
được rollback thay vì chấp nhận một artifact plugin khác.
Các gốc npm được quản lý cũng kế thừa npm `overrides` ở cấp gói của OpenClaw, vì
vậy các ghim bảo mật bảo vệ host đã đóng gói cũng áp dụng cho phụ thuộc plugin
bên ngoài được hoist.

Các checkout nguồn là pnpm workspace. Nếu bạn clone OpenClaw để sửa các plugin
đi kèm, hãy chạy `pnpm install`; sau đó OpenClaw tải plugin đi kèm từ
`extensions/<id>` để các chỉnh sửa và phụ thuộc cục bộ theo gói được dùng trực
tiếp. Cài đặt gốc npm thuần dành cho OpenClaw đã đóng gói, không dành cho phát
triển từ checkout nguồn.

## Loại plugin

OpenClaw nhận diện hai định dạng plugin:

| Định dạng  | Cách hoạt động                                                     | Ví dụ                                                  |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + mô-đun runtime; thực thi trong tiến trình | Plugin chính thức, gói npm cộng đồng                  |
| **Bundle** | Bố cục tương thích Codex/Claude/Cursor; ánh xạ tới tính năng OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Cả hai đều xuất hiện trong `openclaw plugins list`. Xem [Plugin Bundles](/vi/plugins/bundles) để biết chi tiết về bundle.

Nếu bạn đang viết plugin native, hãy bắt đầu với [Xây dựng Plugin](/vi/plugins/building-plugins)
và [Tổng quan Plugin SDK](/vi/plugins/sdk-overview).

## Điểm vào gói

Các gói npm plugin native phải khai báo `openclaw.extensions` trong `package.json`.
Mỗi mục phải nằm bên trong thư mục gói và phân giải đến một tệp runtime có thể
đọc được, hoặc đến một tệp nguồn TypeScript với peer JavaScript đã build được suy
luận, chẳng hạn từ `src/index.ts` đến `dist/index.js`.
Các cài đặt đã đóng gói phải phát hành output runtime JavaScript đó. Fallback
nguồn TypeScript dành cho checkout nguồn và đường dẫn phát triển cục bộ, không
dành cho các gói npm được cài vào gốc plugin do OpenClaw quản lý.

Các thư mục chưa được theo dõi được thả vào gốc extension toàn cục được coi là
checkout nguồn cục bộ và có thể tải trực tiếp các entry TypeScript. Các thư mục
vẫn được đặt tên bởi bản ghi cài đặt, bao gồm `installPath` hoặc `sourcePath`,
vẫn được quản lý và giữ yêu cầu output đã biên dịch ngay cả khi quét toàn cục
nhìn thấy chúng. Nếu bạn cố ý chuyển một cài đặt được quản lý thành checkout cục
bộ chưa được theo dõi, trước tiên hãy xóa bản ghi cài đặt cũ bằng gỡ cài đặt hoặc
dọn dẹp doctor.

Nếu cảnh báo gói được quản lý nói rằng nó `requires compiled runtime output for
TypeScript entry ...`, gói đã được phát hành mà không có các tệp JavaScript
OpenClaw cần ở runtime. Đó là vấn đề đóng gói plugin, không phải vấn đề cấu hình
cục bộ. Cập nhật hoặc cài đặt lại plugin sau khi nhà phát hành phát hành lại
JavaScript đã biên dịch, hoặc tắt/gỡ cài đặt plugin đó cho đến khi có gói đã sửa.

Dùng `openclaw.runtimeExtensions` khi các tệp runtime đã phát hành không nằm ở
cùng đường dẫn với các entry nguồn. Khi có mặt, `runtimeExtensions` phải chứa
đúng một mục cho mỗi mục `extensions`. Danh sách không khớp làm cài đặt và khám
phá plugin thất bại thay vì âm thầm fallback về đường dẫn nguồn. Nếu bạn cũng
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

ClawHub là đường dẫn phân phối chính cho hầu hết plugin. Các bản phát hành
OpenClaw đã đóng gói hiện tại đã gói kèm nhiều plugin chính thức, nên chúng không
cần cài đặt npm riêng trong thiết lập thông thường. Cho đến khi mọi plugin do
OpenClaw sở hữu đã chuyển sang ClawHub, OpenClaw vẫn phát hành một số gói plugin
`@openclaw/*` trên npm cho các cài đặt cũ/tùy chỉnh và luồng npm trực tiếp.

Nếu npm báo một gói plugin `@openclaw/*` là deprecated, phiên bản gói đó đến từ
một nhánh gói bên ngoài cũ hơn. Dùng plugin đi kèm từ OpenClaw hiện tại hoặc
checkout cục bộ cho đến khi có gói npm mới hơn được phát hành.

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

### Lõi (phát hành cùng OpenClaw)

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
    - `memory-lancedb` - bộ nhớ dài hạn dựa trên LanceDB với tự động nhớ lại/ghi nhận (đặt `plugins.slots.memory = "memory-lancedb"`)

    Xem [Memory LanceDB](/vi/plugins/memory-lancedb) để biết cách thiết lập
    embedding tương thích OpenAI, ví dụ Ollama, giới hạn nhớ lại và xử lý sự cố.

  </Accordion>

  <Accordion title="Nhà cung cấp giọng nói (được bật theo mặc định)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Khác">
    - `browser` - Plugin trình duyệt đi kèm cho công cụ trình duyệt, CLI `openclaw browser`, phương thức Gateway `browser.request`, runtime trình duyệt và dịch vụ điều khiển trình duyệt mặc định (được bật theo mặc định; hãy tắt trước khi thay thế)
    - `copilot-proxy` - cầu nối VS Code Copilot Proxy (bị tắt theo mặc định)

  </Accordion>
</AccordionGroup>

Bạn đang tìm Plugin bên thứ ba? Xem [ClawHub](/vi/clawhub).

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
| `allow`            | Danh sách cho phép Plugin (không bắt buộc)                |
| `bundledDiscovery` | Chế độ khám phá Plugin đi kèm (mặc định là `allowlist`)   |
| `deny`             | Danh sách chặn Plugin (không bắt buộc; chặn được ưu tiên) |
| `load.paths`       | Tệp/thư mục Plugin bổ sung                                |
| `slots`            | Bộ chọn khe độc quyền (ví dụ: `memory`, `contextEngine`)  |
| `entries.\<id\>`   | Công tắc + cấu hình theo từng Plugin                      |

`plugins.allow` có tính độc quyền. Khi nó không trống, chỉ các Plugin được liệt kê mới có thể tải
hoặc hiển thị công cụ, ngay cả khi `tools.allow` chứa `"*"` hoặc một tên công cụ
cụ thể do Plugin sở hữu. Nếu danh sách cho phép công cụ tham chiếu đến công cụ của Plugin, hãy thêm id Plugin sở hữu
vào `plugins.allow` hoặc xóa `plugins.allow`; `openclaw doctor` sẽ cảnh báo về
dạng cấu hình này.

`plugins.bundledDiscovery` mặc định là `"allowlist"` cho cấu hình mới, nên một
kho `plugins.allow` hạn chế cũng chặn các Plugin nhà cung cấp đi kèm bị bỏ qua,
bao gồm cả khám phá nhà cung cấp tìm kiếm web runtime. Doctor đóng dấu các
cấu hình danh sách cho phép hạn chế cũ bằng `"compat"` trong quá trình di chuyển để các bản nâng cấp giữ
hành vi nhà cung cấp đi kèm cũ cho đến khi người vận hành chọn chế độ nghiêm ngặt hơn.
`plugins.allow` trống vẫn được xem là chưa đặt/mở.

Các thay đổi cấu hình được thực hiện qua `/plugins enable` hoặc `/plugins disable` sẽ kích hoạt
tải lại Plugin Gateway trong tiến trình. Các lượt agent mới dựng lại danh sách công cụ của chúng từ
registry Plugin đã được làm mới. Các thao tác thay đổi nguồn như cài đặt,
cập nhật và gỡ cài đặt vẫn khởi động lại tiến trình Gateway vì các module
Plugin đã được import không thể được thay thế an toàn tại chỗ.

`openclaw plugins list` là ảnh chụp nhanh registry/cấu hình Plugin cục bộ. Một
Plugin `enabled` ở đó nghĩa là registry đã lưu và cấu hình hiện tại cho phép
Plugin tham gia. Điều đó không chứng minh rằng một Gateway từ xa đang chạy
đã tải lại hoặc khởi động lại vào cùng mã Plugin. Trên các thiết lập VPS/container
có tiến trình wrapper, hãy gửi lệnh khởi động lại hoặc ghi kích hoạt tải lại đến đúng
tiến trình `openclaw gateway run`, hoặc dùng `openclaw gateway restart` với
Gateway đang chạy khi việc tải lại báo lỗi.

<Accordion title="Trạng thái Plugin: bị tắt so với thiếu so với không hợp lệ">
  - **Bị tắt**: Plugin tồn tại nhưng quy tắc bật đã tắt nó. Cấu hình được giữ nguyên.
  - **Thiếu**: cấu hình tham chiếu đến một id Plugin mà quá trình khám phá không tìm thấy.
  - **Không hợp lệ**: Plugin tồn tại nhưng cấu hình của nó không khớp với schema đã khai báo. Khởi động Gateway chỉ bỏ qua Plugin đó; `openclaw doctor --fix` có thể cách ly mục không hợp lệ bằng cách tắt nó và xóa payload cấu hình của nó.

</Accordion>

## Khám phá và thứ tự ưu tiên

OpenClaw quét Plugin theo thứ tự này (kết quả khớp đầu tiên được dùng):

<Steps>
  <Step title="Đường dẫn cấu hình">
    `plugins.load.paths` - đường dẫn tệp hoặc thư mục rõ ràng. Các đường dẫn trỏ
    ngược về thư mục Plugin đi kèm đã đóng gói của chính OpenClaw sẽ bị bỏ qua;
    chạy `openclaw doctor --fix` để xóa các bí danh cũ đó.
  </Step>

  <Step title="Plugin trong workspace">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` và `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Plugin toàn cục">
    `~/.openclaw/<plugin-root>/*.ts` và `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Plugin đi kèm">
    Được phát hành cùng OpenClaw. Nhiều Plugin được bật theo mặc định (nhà cung cấp mô hình, giọng nói).
    Những Plugin khác yêu cầu bật rõ ràng.
  </Step>
</Steps>

Các bản cài đặt đóng gói và image Docker thường phân giải Plugin đi kèm từ cây
`dist/extensions` đã biên dịch. Nếu một thư mục nguồn Plugin đi kèm được
bind-mount đè lên đường dẫn nguồn đóng gói tương ứng, ví dụ
`/app/extensions/synology-chat`, OpenClaw xem thư mục nguồn đã mount đó
như một lớp phủ nguồn đi kèm và khám phá nó trước bundle
`/app/dist/extensions/synology-chat` đã đóng gói. Điều này giữ cho các vòng lặp container
của maintainer hoạt động mà không cần chuyển mọi Plugin đi kèm về nguồn TypeScript.
Đặt `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1` để buộc dùng các bundle dist đã đóng gói
ngay cả khi có mount lớp phủ nguồn.

### Quy tắc bật

- `plugins.enabled: false` tắt tất cả Plugin và bỏ qua công việc khám phá/tải Plugin
- `plugins.deny` luôn thắng allow
- `plugins.entries.\<id\>.enabled: false` tắt Plugin đó
- Plugin có nguồn gốc từ workspace **bị tắt theo mặc định** (phải được bật rõ ràng)
- Plugin đi kèm tuân theo tập mặc định bật sẵn tích hợp trừ khi bị ghi đè
- Các khe độc quyền có thể buộc bật Plugin được chọn cho khe đó
- Một số Plugin đi kèm dạng chọn tham gia được bật tự động khi cấu hình nêu tên một
  bề mặt do Plugin sở hữu, chẳng hạn như ref mô hình nhà cung cấp, cấu hình kênh hoặc runtime
  harness
- Cấu hình Plugin cũ được giữ lại trong khi `plugins.enabled: false` đang hoạt động;
  bật lại Plugin trước khi chạy dọn dẹp doctor nếu bạn muốn xóa các id cũ
- Các tuyến Codex thuộc họ OpenAI giữ ranh giới Plugin riêng:
  `openai-codex/*` thuộc về Plugin OpenAI, trong khi Plugin app-server Codex đi kèm
  được chọn bởi các ref agent `openai/*` chuẩn, `agentRuntime.id: "codex"` dạng
  provider/model rõ ràng, hoặc các ref mô hình `codex/*` cũ

## Xử lý sự cố hook runtime

Nếu một Plugin xuất hiện trong `plugins list` nhưng hiệu ứng phụ hoặc hook
`register(api)` không chạy trong lưu lượng chat trực tiếp, hãy kiểm tra các mục này trước:

- Chạy `openclaw gateway status --deep --require-rpc` và xác nhận URL Gateway,
  profile, đường dẫn cấu hình và tiến trình đang hoạt động là những thứ bạn đang chỉnh sửa.
- Khởi động lại Gateway trực tiếp sau các thay đổi cài đặt/cấu hình/mã Plugin. Trong các container
  wrapper, PID 1 có thể chỉ là supervisor; hãy khởi động lại hoặc gửi tín hiệu cho tiến trình con
  `openclaw gateway run`.
- Dùng `openclaw plugins inspect <id> --runtime --json` để xác nhận đăng ký hook và
  chẩn đoán. Các hook hội thoại không đi kèm như `before_model_resolve`,
  `before_agent_reply`, `before_agent_run`, `llm_input`, `llm_output`,
  `before_agent_finalize` và `agent_end` cần
  `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- Với chuyển đổi mô hình, ưu tiên `before_model_resolve`. Nó chạy trước quá trình
  phân giải mô hình cho các lượt agent; `llm_output` chỉ chạy sau khi một lần thử mô hình
  tạo ra đầu ra assistant.
- Để chứng minh mô hình phiên hiệu dụng, hãy dùng `openclaw sessions` hoặc các
  bề mặt phiên/trạng thái Gateway và, khi gỡ lỗi payload nhà cung cấp, khởi động
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

Phần tóm tắt liệt kê tổng thời gian factory và các factory công cụ Plugin chậm nhất,
bao gồm id Plugin, tên công cụ đã khai báo, dạng kết quả và công cụ đó có
không bắt buộc hay không. Các dòng chậm được nâng thành cảnh báo khi một factory đơn lẻ mất
ít nhất 1 giây hoặc tổng chuẩn bị factory công cụ Plugin mất ít nhất 5 giây.

OpenClaw cache kết quả factory công cụ Plugin thành công cho các lần phân giải lặp lại
với cùng ngữ cảnh yêu cầu hiệu dụng. Khóa cache bao gồm cấu hình runtime hiệu dụng,
workspace, id agent/phiên, chính sách sandbox, thiết lập trình duyệt,
ngữ cảnh phân phối, danh tính bên yêu cầu và trạng thái sở hữu, nên các factory
phụ thuộc vào những trường đáng tin cậy đó sẽ được chạy lại khi ngữ cảnh thay đổi.

Nếu một Plugin chiếm phần lớn thời gian, hãy kiểm tra các đăng ký runtime của nó:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

Sau đó cập nhật, cài đặt lại hoặc tắt Plugin đó. Tác giả Plugin nên chuyển
việc tải phụ thuộc tốn kém vào sau đường dẫn thực thi công cụ thay vì làm việc đó
bên trong factory công cụ.

### Quyền sở hữu kênh hoặc công cụ trùng lặp

Triệu chứng:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

Những thông báo này nghĩa là có nhiều hơn một Plugin đã bật đang cố sở hữu cùng một kênh,
luồng thiết lập hoặc tên công cụ. Nguyên nhân phổ biến nhất là một Plugin kênh bên ngoài
được cài bên cạnh một Plugin đi kèm hiện cung cấp cùng id kênh.

Các bước gỡ lỗi:

- Chạy `openclaw plugins list --enabled --verbose` để xem mọi Plugin đã bật
  và nguồn gốc.
- Chạy `openclaw plugins inspect <id> --runtime --json` cho từng Plugin nghi ngờ và
  so sánh `channels`, `channelConfigs`, `tools` và chẩn đoán.
- Chạy `openclaw plugins registry --refresh` sau khi cài đặt hoặc gỡ bỏ
  các gói Plugin để metadata đã lưu phản ánh bản cài đặt hiện tại.
- Khởi động lại Gateway sau các thay đổi cài đặt, registry hoặc cấu hình.

Tùy chọn sửa:

- Nếu một Plugin cố ý thay thế Plugin khác cho cùng id kênh, Plugin
  được ưu tiên nên khai báo `channelConfigs.<channel-id>.preferOver` với
  id Plugin có độ ưu tiên thấp hơn. Xem [/plugins/manifest#replacing-another-channel-plugin](/vi/plugins/manifest#replacing-another-channel-plugin).
- Nếu trùng lặp là vô tình, hãy tắt một bên bằng
  `plugins.entries.<plugin-id>.enabled: false` hoặc gỡ bản cài đặt Plugin
  cũ.
- Nếu bạn đã bật rõ ràng cả hai Plugin, OpenClaw giữ yêu cầu đó và
  báo cáo xung đột. Chọn một chủ sở hữu cho kênh hoặc đổi tên các công cụ do Plugin sở hữu
  để bề mặt runtime không mơ hồ.

## Khe Plugin (danh mục độc quyền)

Một số danh mục là độc quyền (chỉ một mục hoạt động tại một thời điểm):

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

| Khe             | Nội dung kiểm soát       | Mặc định            |
| --------------- | ------------------------ | ------------------- |
| `memory`        | Plugin Active memory     | `memory-core`       |
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

Plugin đi kèm được phát hành cùng OpenClaw. Nhiều Plugin được bật theo mặc định (ví dụ
các nhà cung cấp mô hình đi kèm, các nhà cung cấp giọng nói đi kèm, và Plugin trình duyệt
đi kèm). Các Plugin đi kèm khác vẫn cần `openclaw plugins enable <id>`.

`--force` ghi đè tại chỗ lên một Plugin đã cài đặt hoặc gói hook hiện có. Dùng
`openclaw plugins update <id-or-npm-spec>` cho các nâng cấp thường lệ của Plugin npm
được theo dõi. Tùy chọn này không được hỗ trợ với `--link`, vì tùy chọn đó dùng lại đường dẫn nguồn thay vì
sao chép đè lên mục tiêu cài đặt được quản lý.

Khi `plugins.allow` đã được đặt, `openclaw plugins install` thêm id
Plugin đã cài đặt vào allowlist đó trước khi bật Plugin. Nếu cùng id Plugin
có trong `plugins.deny`, quá trình cài đặt sẽ xóa mục deny đã lỗi thời đó để
lần cài đặt rõ ràng có thể được tải ngay sau khi khởi động lại.

OpenClaw giữ một registry Plugin cục bộ được lưu bền vững làm mô hình đọc nguội cho
kho Plugin, quyền sở hữu đóng góp, và lập kế hoạch khởi động. Các luồng cài đặt, cập nhật,
gỡ cài đặt, bật, và tắt sẽ làm mới registry đó sau khi thay đổi trạng thái Plugin. Cùng tệp
`plugins/installs.json` giữ siêu dữ liệu cài đặt bền vững trong
`installRecords` cấp cao nhất và siêu dữ liệu manifest có thể dựng lại trong `plugins`. Nếu
registry bị thiếu, lỗi thời, hoặc không hợp lệ, `openclaw plugins registry
--refresh` dựng lại góc nhìn manifest của nó từ bản ghi cài đặt, chính sách cấu hình, và
siêu dữ liệu manifest/package mà không tải các module runtime của Plugin.

Ở chế độ Nix (`OPENCLAW_NIX_MODE=1`), các thao tác thay đổi vòng đời Plugin bị tắt.
Thay vào đó, quản lý lựa chọn package Plugin và cấu hình thông qua nguồn Nix cho bản
cài đặt; với nix-openclaw, hãy bắt đầu bằng
[Khởi đầu nhanh](https://github.com/openclaw/nix-openclaw#quick-start) theo hướng agent trước.
`openclaw plugins update <id-or-npm-spec>` áp dụng cho các bản cài đặt được theo dõi. Việc truyền
một spec package npm có dist-tag hoặc phiên bản chính xác sẽ phân giải tên package
về bản ghi Plugin được theo dõi và ghi lại spec mới cho các lần cập nhật sau.
Việc truyền tên package không có phiên bản sẽ chuyển một bản cài đặt được ghim chính xác về lại
dòng phát hành mặc định của registry. Nếu Plugin npm đã cài đặt đã khớp
với phiên bản được phân giải và danh tính artifact đã ghi, OpenClaw bỏ qua cập nhật
mà không tải xuống, cài đặt lại, hoặc ghi lại cấu hình.
Khi `openclaw update` chạy trên kênh beta, các bản ghi Plugin npm và ClawHub
theo dòng mặc định sẽ thử `@beta` trước và quay về mặc định/latest khi không có bản phát hành
beta của Plugin. Các phiên bản chính xác và tag rõ ràng vẫn được ghim.

`--pin` chỉ dành cho npm. Tùy chọn này không được hỗ trợ với `--marketplace`, vì
các bản cài đặt marketplace lưu bền vững siêu dữ liệu nguồn marketplace thay vì một spec npm.

`--dangerously-force-unsafe-install` là ghi đè phá kính cho các kết quả dương tính giả
từ bộ quét mã nguy hiểm tích hợp. Nó cho phép các bản cài đặt Plugin
và cập nhật Plugin tiếp tục sau các phát hiện `critical` tích hợp, nhưng vẫn
không bỏ qua các chặn chính sách `before_install` của Plugin hoặc chặn do lỗi quét.
Các lần quét cài đặt bỏ qua các tệp và thư mục kiểm thử phổ biến như `tests/`,
`__tests__/`, `*.test.*`, và `*.spec.*` để tránh chặn mock kiểm thử đã đóng gói;
các entrypoint runtime Plugin đã khai báo vẫn được quét ngay cả khi chúng dùng một trong
các tên đó.

Cờ CLI này chỉ áp dụng cho các luồng cài đặt/cập nhật Plugin. Các bản cài đặt phụ thuộc
Skills được Gateway hậu thuẫn dùng ghi đè yêu cầu `dangerouslyForceUnsafeInstall`
tương ứng, trong khi `openclaw skills install` vẫn là luồng tải xuống/cài đặt Skills
ClawHub riêng biệt.

Nếu một Plugin bạn đã xuất bản trên ClawHub bị ẩn hoặc bị chặn bởi một lần quét, hãy mở
dashboard ClawHub hoặc chạy `clawhub package rescan <name>` để yêu cầu ClawHub kiểm tra
lại. `--dangerously-force-unsafe-install` chỉ ảnh hưởng đến các bản cài đặt trên máy của bạn;
nó không yêu cầu ClawHub quét lại Plugin hoặc công khai một bản phát hành bị chặn.

Các bundle tương thích tham gia cùng luồng liệt kê/kiểm tra/bật/tắt Plugin.
Hỗ trợ runtime hiện tại bao gồm Skills trong bundle, command-skills của Claude,
mặc định `settings.json` của Claude, mặc định `lspServers` được khai báo trong manifest và
`.lsp.json` của Claude, command-skills của Cursor, và các thư mục hook
Codex tương thích.

`openclaw plugins inspect <id>` cũng báo cáo các khả năng bundle được phát hiện cùng
các mục server MCP và LSP được hỗ trợ hoặc không được hỗ trợ cho Plugin dựa trên bundle.

Nguồn marketplace có thể là tên known-marketplace của Claude từ
`~/.claude/plugins/known_marketplaces.json`, một root marketplace cục bộ hoặc
đường dẫn `marketplace.json`, dạng viết tắt GitHub như `owner/repo`, URL repo
GitHub, hoặc URL git. Với marketplace từ xa, các mục Plugin phải nằm bên trong
repo marketplace đã clone và chỉ dùng nguồn đường dẫn tương đối.

Xem [tham chiếu CLI `openclaw plugins`](/vi/cli/plugins) để biết đầy đủ chi tiết.

## Tổng quan API Plugin

Plugin native xuất một đối tượng entry cung cấp `register(api)`. Các
Plugin cũ hơn vẫn có thể dùng `activate(api)` làm alias cũ, nhưng Plugin mới nên
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

OpenClaw tải đối tượng entry và gọi `register(api)` trong quá trình kích hoạt
Plugin. Loader vẫn quay về `activate(api)` cho các Plugin cũ hơn,
nhưng Plugin đi kèm và Plugin bên ngoài mới nên xem `register` là
hợp đồng công khai.

`api.registrationMode` cho một Plugin biết vì sao entry của nó đang được tải:

| Chế độ          | Ý nghĩa                                                                                                                          |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | Kích hoạt runtime. Đăng ký công cụ, hook, dịch vụ, lệnh, route, và các tác dụng phụ live khác.                              |
| `discovery`     | Khám phá khả năng chỉ đọc. Đăng ký nhà cung cấp và siêu dữ liệu; mã entry Plugin đáng tin cậy có thể tải, nhưng bỏ qua tác dụng phụ live. |
| `setup-only`    | Tải siêu dữ liệu thiết lập kênh thông qua một entry thiết lập nhẹ.                                                                |
| `setup-runtime` | Tải thiết lập kênh cũng cần entry runtime.                                                                         |
| `cli-metadata`  | Chỉ thu thập siêu dữ liệu lệnh CLI.                                                                                            |

Các entry Plugin mở socket, cơ sở dữ liệu, worker nền, hoặc client sống lâu
nên bảo vệ các tác dụng phụ đó bằng `api.registrationMode === "full"`.
Các lần tải khám phá được cache tách biệt khỏi các lần tải kích hoạt và không thay thế
registry Gateway đang chạy. Khám phá là không kích hoạt, không phải không import:
OpenClaw có thể đánh giá entry Plugin đáng tin cậy hoặc module Plugin kênh để xây dựng
snapshot. Giữ phần top level của module nhẹ và không có tác dụng phụ, đồng thời chuyển
client mạng, subprocess, listener, lượt đọc thông tin xác thực, và khởi động dịch vụ
sau các đường dẫn full-runtime.

Các phương thức đăng ký phổ biến:

| Phương thức                             | Nội dung đăng ký             |
| --------------------------------------- | --------------------------- |
| `registerProvider`                      | Nhà cung cấp mô hình (LLM)  |
| `registerChannel`                       | Kênh chat                   |
| `registerTool`                          | Công cụ agent               |
| `registerHook` / `on(...)`              | Hook vòng đời               |
| `registerSpeechProvider`                | Text-to-speech / STT        |
| `registerRealtimeTranscriptionProvider` | STT phát trực tuyến         |
| `registerRealtimeVoiceProvider`         | Giọng nói realtime song công |
| `registerMediaUnderstandingProvider`    | Phân tích hình ảnh/âm thanh |
| `registerImageGenerationProvider`       | Tạo hình ảnh                |
| `registerMusicGenerationProvider`       | Tạo nhạc                    |
| `registerVideoGenerationProvider`       | Tạo video                   |
| `registerWebFetchProvider`              | Nhà cung cấp web fetch / scrape |
| `registerWebSearchProvider`             | Tìm kiếm web                |
| `registerHttpRoute`                     | Endpoint HTTP               |
| `registerCommand` / `registerCli`       | Lệnh CLI                    |
| `registerContextEngine`                 | Công cụ ngữ cảnh            |
| `registerService`                       | Dịch vụ nền                 |

Hành vi guard hook cho hook vòng đời có kiểu:

- `before_tool_call`: `{ block: true }` là kết thúc; các handler có độ ưu tiên thấp hơn bị bỏ qua.
- `before_tool_call`: `{ block: false }` là no-op và không xóa một block trước đó.
- `before_install`: `{ block: true }` là kết thúc; các handler có độ ưu tiên thấp hơn bị bỏ qua.
- `before_install`: `{ block: false }` là no-op và không xóa một block trước đó.
- `message_sending`: `{ cancel: true }` là kết thúc; các handler có độ ưu tiên thấp hơn bị bỏ qua.
- `message_sending`: `{ cancel: false }` là no-op và không xóa một cancel trước đó.

Các lần chạy máy chủ ứng dụng Codex gốc kết nối các sự kiện công cụ gốc của Codex trở lại bề mặt hook này. Plugin có thể chặn các công cụ Codex gốc thông qua `before_tool_call`, quan sát kết quả thông qua `after_tool_call`, và tham gia phê duyệt `PermissionRequest` của Codex. Cầu nối hiện chưa viết lại các đối số công cụ gốc của Codex. Ranh giới hỗ trợ runtime Codex chính xác nằm trong
[hợp đồng hỗ trợ Codex harness v1](/vi/plugins/codex-harness-runtime#v1-support-contract).

Để biết đầy đủ hành vi hook có kiểu, hãy xem [tổng quan SDK](/vi/plugins/sdk-overview#hook-decision-semantics).

## Liên quan

- [Xây dựng Plugin](/vi/plugins/building-plugins) - tạo Plugin của riêng bạn
- [Gói Plugin](/vi/plugins/bundles) - khả năng tương thích gói Codex/Claude/Cursor
- [Manifest Plugin](/vi/plugins/manifest) - schema manifest
- [Đăng ký công cụ](/vi/plugins/building-plugins#registering-agent-tools) - thêm công cụ agent trong một Plugin
- [Nội bộ Plugin](/vi/plugins/architecture) - mô hình capability và pipeline tải
- [ClawHub](/vi/clawhub) - khám phá Plugin bên thứ ba
