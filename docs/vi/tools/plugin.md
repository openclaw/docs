---
read_when:
    - Cài đặt hoặc cấu hình Plugin
    - Tìm hiểu về quy tắc phát hiện và nạp Plugin
    - Làm việc với các gói Plugin tương thích với Codex/Claude
sidebarTitle: Install and Configure
summary: Cài đặt, cấu hình và quản lý các Plugin OpenClaw
title: Plugin
x-i18n:
    generated_at: "2026-04-29T23:20:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7a12d158053c13b47a56d8d6b382818962e9b5109fdf8ededd3ecf92b83089e6
    source_path: tools/plugin.md
    workflow: 16
---

Các plugin mở rộng OpenClaw với các khả năng mới: kênh, nhà cung cấp mô hình,
bộ khung tác tử, công cụ, skills, giọng nói, phiên âm realtime, thoại realtime,
hiểu phương tiện, tạo hình ảnh, tạo video, truy xuất web, tìm kiếm web,
và hơn thế nữa. Một số plugin là **cốt lõi** (được phát hành cùng OpenClaw), số khác
là **bên ngoài**. Hầu hết plugin bên ngoài được phát hành và khám phá thông qua
[ClawHub](/vi/tools/clawhub). Npm vẫn được hỗ trợ cho cài đặt trực tiếp và cho một
tập hợp tạm thời các gói plugin do OpenClaw sở hữu trong khi quá trình di chuyển đó hoàn tất.

## Bắt đầu nhanh

<Steps>
  <Step title="Xem những gì đã được tải">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="Cài đặt plugin">
    ```bash
    # From npm
    openclaw plugins install npm:@acme/openclaw-plugin

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
</Steps>

Nếu bạn thích điều khiển ngay trong trò chuyện, hãy bật `commands.plugins: true` và dùng:

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

Đường dẫn cài đặt dùng cùng bộ phân giải như CLI: đường dẫn/tệp lưu trữ cục bộ, chỉ định rõ
`clawhub:<pkg>`, chỉ định rõ `npm:<pkg>`, hoặc đặc tả gói trần (ClawHub trước, rồi
dự phòng sang npm).

Nếu cấu hình không hợp lệ, quá trình cài đặt thường sẽ đóng an toàn và chỉ bạn đến
`openclaw doctor --fix`. Ngoại lệ phục hồi duy nhất là một đường dẫn cài đặt lại
plugin đi kèm có phạm vi hẹp cho các plugin chọn dùng
`openclaw.install.allowInvalidConfigRecovery`.
Trong khi Gateway khởi động, cấu hình không hợp lệ của một plugin được cô lập trong plugin đó:
khởi động ghi nhật ký sự cố `plugins.entries.<id>.config`, bỏ qua plugin đó trong khi
tải, và giữ các plugin cùng kênh khác trực tuyến. Chạy `openclaw doctor --fix`
để cách ly cấu hình plugin lỗi bằng cách tắt mục plugin đó và xóa
payload cấu hình không hợp lệ của nó; bản sao lưu cấu hình thông thường giữ lại các giá trị trước đó.
Khi cấu hình kênh tham chiếu đến một plugin không còn khám phá được nhưng
cùng id plugin cũ vẫn còn trong cấu hình plugin hoặc bản ghi cài đặt, Gateway startup
ghi nhật ký cảnh báo và bỏ qua kênh đó thay vì chặn mọi kênh khác.
Chạy `openclaw doctor --fix` để xóa các mục kênh/plugin cũ; các khóa
kênh không xác định mà không có bằng chứng plugin cũ vẫn không vượt qua xác thực để lỗi gõ vẫn
hiển thị.
Nếu đặt `plugins.enabled: false`, các tham chiếu plugin cũ được xem là bất hoạt:
Gateway startup bỏ qua công việc khám phá/tải plugin và `openclaw doctor` giữ nguyên
cấu hình plugin đã tắt thay vì tự động xóa nó. Bật lại plugin trước khi
chạy dọn dẹp bằng doctor nếu bạn muốn xóa các id plugin cũ.

Các bản cài OpenClaw đóng gói không cài đặt háo hức toàn bộ cây phụ thuộc runtime
của mọi plugin đi kèm. Khi một plugin do OpenClaw sở hữu đi kèm được kích hoạt từ
cấu hình plugin, cấu hình kênh cũ, hoặc manifest bật mặc định, startup
chỉ sửa chữa các phụ thuộc runtime đã khai báo của plugin đó trước khi nhập nó.
Chỉ riêng trạng thái xác thực kênh đã lưu không kích hoạt một kênh đi kèm cho
sửa chữa phụ thuộc runtime khi Gateway startup.
Việc tắt rõ ràng vẫn thắng: `plugins.entries.<id>.enabled: false`,
`plugins.deny`, `plugins.enabled: false`, và `channels.<id>.enabled: false`
ngăn sửa chữa phụ thuộc runtime đi kèm tự động cho plugin/kênh đó.
`plugins.allow` không rỗng cũng giới hạn sửa chữa phụ thuộc runtime đi kèm bật mặc định;
việc bật kênh đi kèm rõ ràng (`channels.<id>.enabled: true`) vẫn có thể
sửa chữa các phụ thuộc plugin của kênh đó.
Plugin bên ngoài và đường dẫn tải tùy chỉnh vẫn phải được cài đặt thông qua
`openclaw plugins install`.

## Loại plugin

OpenClaw nhận diện hai định dạng plugin:

| Định dạng | Cách hoạt động | Ví dụ |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **Gốc** | `openclaw.plugin.json` + mô-đun runtime; thực thi trong tiến trình | Plugin chính thức, gói npm cộng đồng |
| **Gói** | Bố cục tương thích Codex/Claude/Cursor; ánh xạ sang tính năng OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Cả hai đều xuất hiện trong `openclaw plugins list`. Xem [Gói Plugin](/vi/plugins/bundles) để biết chi tiết về gói.

Nếu bạn đang viết plugin gốc, hãy bắt đầu với [Xây dựng Plugin](/vi/plugins/building-plugins)
và [Tổng quan Plugin SDK](/vi/plugins/sdk-overview).

## Điểm vào gói

Các gói npm plugin gốc phải khai báo `openclaw.extensions` trong `package.json`.
Mỗi mục phải nằm bên trong thư mục gói và phân giải tới một tệp
runtime có thể đọc, hoặc tới một tệp nguồn TypeScript có peer JavaScript đã xây dựng
được suy luận, chẳng hạn `src/index.ts` thành `dist/index.js`.

Dùng `openclaw.runtimeExtensions` khi các tệp runtime đã phát hành không nằm ở
cùng đường dẫn với các mục nguồn. Khi có mặt, `runtimeExtensions` phải chứa
đúng một mục cho mỗi mục `extensions`. Danh sách không khớp sẽ làm cài đặt và
khám phá plugin thất bại thay vì âm thầm dự phòng về đường dẫn nguồn.

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

ClawHub là đường phân phối chính cho hầu hết plugin. Các bản phát hành OpenClaw
đóng gói hiện tại đã đóng gói sẵn nhiều plugin chính thức, nên trong thiết lập
thông thường chúng không cần cài đặt npm riêng. Cho đến khi mọi plugin do OpenClaw sở hữu
đã di chuyển sang ClawHub, OpenClaw vẫn phát hành một số gói plugin `@openclaw/*`
trên npm cho các bản cài cũ/tùy chỉnh và quy trình npm trực tiếp.

Nếu npm báo một gói plugin `@openclaw/*` là đã ngừng khuyến nghị, phiên bản gói đó
đến từ một tuyến gói bên ngoài cũ hơn. Dùng plugin đi kèm từ OpenClaw hiện tại
hoặc một checkout cục bộ cho đến khi gói npm mới hơn được phát hành.

| Plugin          | Gói                    | Tài liệu                                       |
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
    - `memory-core` — tìm kiếm bộ nhớ đi kèm (mặc định qua `plugins.slots.memory`)
    - `memory-lancedb` — bộ nhớ dài hạn cài khi cần với tự động gọi lại/thu thập (đặt `plugins.slots.memory = "memory-lancedb"`)

    Xem [Memory LanceDB](/vi/plugins/memory-lancedb) để biết thiết lập embedding tương thích OpenAI,
    ví dụ Ollama, giới hạn gọi lại, và xử lý sự cố.

  </Accordion>

  <Accordion title="Nhà cung cấp giọng nói (được bật theo mặc định)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Khác">
    - `browser` — plugin trình duyệt đi kèm cho công cụ trình duyệt, CLI `openclaw browser`, phương thức gateway `browser.request`, runtime trình duyệt, và dịch vụ điều khiển trình duyệt mặc định (được bật theo mặc định; tắt trước khi thay thế nó)
    - `copilot-proxy` — cầu nối VS Code Copilot Proxy (tắt theo mặc định)

  </Accordion>
</AccordionGroup>

Bạn đang tìm plugin bên thứ ba? Xem [Plugin cộng đồng](/vi/plugins/community).

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
| `allow`          | Danh sách cho phép plugin (tùy chọn)                               |
| `deny`           | Danh sách chặn plugin (tùy chọn; chặn sẽ thắng)                     |
| `load.paths`     | Tệp/thư mục plugin bổ sung                            |
| `slots`          | Bộ chọn slot độc quyền (ví dụ `memory`, `contextEngine`) |
| `entries.\<id\>` | Công tắc + cấu hình theo từng plugin                               |

Thay đổi cấu hình **yêu cầu khởi động lại gateway**. Nếu Gateway đang chạy với theo dõi cấu hình
+ khởi động lại trong tiến trình được bật (đường dẫn `openclaw gateway` mặc định), thao tác
khởi động lại đó thường được thực hiện tự động một lúc sau khi cấu hình được ghi.
Không có đường dẫn hot-reload được hỗ trợ cho mã runtime plugin gốc hoặc hook vòng đời;
hãy khởi động lại tiến trình Gateway đang phục vụ kênh trực tiếp trước khi
mong đợi mã `register(api)` đã cập nhật, hook `api.on(...)`, công cụ, dịch vụ, hoặc
hook provider/runtime chạy.

`openclaw plugins list` là ảnh chụp nhanh cấu hình/registry plugin cục bộ. Một
plugin `enabled` ở đó nghĩa là registry đã lưu và cấu hình hiện tại cho phép
plugin tham gia. Điều đó không chứng minh rằng một tiến trình con Gateway từ xa
đang chạy đã khởi động lại vào cùng mã plugin. Trên thiết lập VPS/container với
tiến trình wrapper, hãy gửi khởi động lại tới tiến trình `openclaw gateway run` thực tế,
hoặc dùng `openclaw gateway restart` với Gateway đang chạy.

<Accordion title="Trạng thái plugin: đã tắt so với thiếu so với không hợp lệ">
  - **Đã tắt**: plugin tồn tại nhưng quy tắc bật đã tắt nó. Cấu hình được giữ nguyên.
  - **Thiếu**: cấu hình tham chiếu một id plugin mà khám phá không tìm thấy.
  - **Không hợp lệ**: plugin tồn tại nhưng cấu hình của nó không khớp schema đã khai báo. Gateway startup chỉ bỏ qua plugin đó; `openclaw doctor --fix` có thể cách ly mục không hợp lệ bằng cách tắt nó và xóa payload cấu hình của nó.

</Accordion>

## Khám phá và thứ tự ưu tiên

OpenClaw quét plugin theo thứ tự này (kết quả khớp đầu tiên thắng):

<Steps>
  <Step title="Đường dẫn cấu hình">
    `plugins.load.paths` — đường dẫn tệp hoặc thư mục rõ ràng. Các đường dẫn trỏ
    ngược về thư mục plugin đi kèm đã đóng gói của chính OpenClaw sẽ bị bỏ qua;
    chạy `openclaw doctor --fix` để xóa các bí danh cũ đó.
  </Step>

  <Step title="Plugin trong workspace">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` và `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Plugin toàn cục">
    `~/.openclaw/<plugin-root>/*.ts` và `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Bundled plugins">
    Được phát hành kèm OpenClaw. Nhiều Plugin được bật theo mặc định (nhà cung cấp mô hình, giọng nói).
    Các Plugin khác yêu cầu bật rõ ràng.
  </Step>
</Steps>

Các bản cài đặt đóng gói và Docker image thường phân giải các Plugin đi kèm từ cây
`dist/extensions` đã biên dịch. Nếu một thư mục nguồn Plugin đi kèm được
bind mount đè lên đường dẫn nguồn đóng gói tương ứng, ví dụ
`/app/extensions/synology-chat`, OpenClaw xem thư mục nguồn được mount đó
như một lớp phủ nguồn đi kèm và phát hiện nó trước bundle
`/app/dist/extensions/synology-chat` đã đóng gói. Điều này giữ cho các vòng lặp container
của maintainer hoạt động mà không cần chuyển mọi Plugin đi kèm về nguồn TypeScript.
Đặt `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1` để buộc dùng các dist bundle đã đóng gói
ngay cả khi có các mount lớp phủ nguồn.

### Quy tắc bật

- `plugins.enabled: false` tắt tất cả Plugin và bỏ qua công việc phát hiện/tải Plugin
- `plugins.deny` luôn được ưu tiên hơn allow
- `plugins.entries.\<id\>.enabled: false` tắt Plugin đó
- Các Plugin có nguồn gốc từ workspace **bị tắt theo mặc định** (phải được bật rõ ràng)
- Các Plugin đi kèm tuân theo tập mặc định bật sẵn tích hợp trừ khi bị ghi đè
- Các slot độc quyền có thể buộc bật Plugin được chọn cho slot đó
- Một số Plugin đi kèm dạng opt-in được bật tự động khi cấu hình nêu tên một
  bề mặt do Plugin sở hữu, chẳng hạn như tham chiếu mô hình nhà cung cấp, cấu hình kênh, hoặc runtime harness
- Cấu hình Plugin cũ được giữ lại trong khi `plugins.enabled: false` đang hoạt động;
  hãy bật lại Plugin trước khi chạy dọn dẹp doctor nếu bạn muốn xóa các id cũ
- Các route Codex thuộc họ OpenAI giữ ranh giới Plugin riêng:
  `openai-codex/*` thuộc về Plugin OpenAI, trong khi Plugin app-server Codex
  đi kèm được chọn bằng `agentRuntime.id: "codex"` hoặc các tham chiếu mô hình
  `codex/*` cũ

## Khắc phục sự cố runtime hook

Nếu một Plugin xuất hiện trong `plugins list` nhưng các hiệu ứng phụ hoặc hook
`register(api)` không chạy trong lưu lượng chat trực tiếp, hãy kiểm tra các mục này trước:

- Chạy `openclaw gateway status --deep --require-rpc` và xác nhận URL
  Gateway đang hoạt động, profile, đường dẫn cấu hình, và tiến trình là những thứ bạn đang chỉnh sửa.
- Khởi động lại Gateway trực tiếp sau khi thay đổi cài đặt/cấu hình/mã Plugin. Trong các container wrapper,
  PID 1 có thể chỉ là supervisor; hãy khởi động lại hoặc gửi tín hiệu cho tiến trình con
  `openclaw gateway run`.
- Dùng `openclaw plugins inspect <id> --json` để xác nhận đăng ký hook và
  chẩn đoán. Các hook hội thoại không đi kèm như `llm_input`,
  `llm_output`, `before_agent_finalize`, và `agent_end` cần
  `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- Đối với chuyển đổi mô hình, ưu tiên `before_model_resolve`. Nó chạy trước khi phân giải mô hình
  cho lượt tác tử; `llm_output` chỉ chạy sau khi một lần thử mô hình
  tạo ra đầu ra assistant.
- Để chứng minh mô hình phiên hiệu lực, dùng `openclaw sessions` hoặc các bề mặt
  phiên/trạng thái Gateway và, khi gỡ lỗi payload nhà cung cấp, khởi động
  Gateway với `--raw-stream --raw-stream-path <path>`.

### Trùng quyền sở hữu kênh hoặc công cụ

Triệu chứng:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

Những thông báo này nghĩa là có hơn một Plugin đã bật đang cố sở hữu cùng một kênh,
luồng thiết lập, hoặc tên công cụ. Nguyên nhân phổ biến nhất là một Plugin kênh bên ngoài
được cài cạnh một Plugin đi kèm hiện cung cấp cùng id kênh.

Các bước gỡ lỗi:

- Chạy `openclaw plugins list --enabled --verbose` để xem mọi Plugin đã bật
  và nguồn gốc.
- Chạy `openclaw plugins inspect <id> --json` cho từng Plugin nghi ngờ và
  so sánh `channels`, `channelConfigs`, `tools`, và chẩn đoán.
- Chạy `openclaw plugins registry --refresh` sau khi cài đặt hoặc gỡ bỏ
  các gói Plugin để metadata đã lưu phản ánh bản cài đặt hiện tại.
- Khởi động lại Gateway sau các thay đổi cài đặt, registry, hoặc cấu hình.

Tùy chọn sửa:

- Nếu một Plugin cố ý thay thế Plugin khác cho cùng id kênh, Plugin
  được ưu tiên nên khai báo `channelConfigs.<channel-id>.preferOver` với
  id Plugin có độ ưu tiên thấp hơn. Xem [/plugins/manifest#replacing-another-channel-plugin](/vi/plugins/manifest#replacing-another-channel-plugin).
- Nếu trùng lặp là ngoài ý muốn, tắt một bên bằng
  `plugins.entries.<plugin-id>.enabled: false` hoặc gỡ bản cài đặt Plugin
  cũ.
- Nếu bạn đã bật rõ ràng cả hai Plugin, OpenClaw giữ yêu cầu đó và
  báo cáo xung đột. Chọn một chủ sở hữu cho kênh hoặc đổi tên các công cụ do Plugin sở hữu
  để bề mặt runtime không mơ hồ.

## Slot Plugin (danh mục độc quyền)

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

| Slot            | Nội dung kiểm soát       | Mặc định            |
| --------------- | ------------------------ | ------------------- |
| `memory`        | Plugin bộ nhớ chủ động   | `memory-core`       |
| `contextEngine` | Công cụ ngữ cảnh chủ động | `legacy` (tích hợp) |

## Tham chiếu CLI

```bash
openclaw plugins list                       # compact inventory
openclaw plugins list --enabled            # only enabled plugins
openclaw plugins list --verbose            # per-plugin detail lines
openclaw plugins list --json               # machine-readable inventory
openclaw plugins inspect <id>              # deep detail
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

openclaw plugins enable <id>
openclaw plugins disable <id>
```

Các Plugin đi kèm được phát hành cùng OpenClaw. Nhiều Plugin được bật theo mặc định (ví dụ
các nhà cung cấp mô hình đi kèm, các nhà cung cấp giọng nói đi kèm, và Plugin trình duyệt
đi kèm). Các Plugin đi kèm khác vẫn cần `openclaw plugins enable <id>`.

`--force` ghi đè tại chỗ một Plugin đã cài hoặc hook pack hiện có. Dùng
`openclaw plugins update <id-or-npm-spec>` cho các nâng cấp thường lệ của các Plugin npm
được theo dõi. Tùy chọn này không được hỗ trợ với `--link`, vì `--link` dùng lại đường dẫn nguồn thay
vì sao chép đè lên một đích cài đặt được quản lý.

Khi `plugins.allow` đã được đặt, `openclaw plugins install` thêm id Plugin
đã cài vào allowlist đó trước khi bật nó. Nếu cùng id Plugin
có trong `plugins.deny`, install xóa mục deny cũ đó để bản cài đặt
rõ ràng có thể tải ngay sau khi khởi động lại.

OpenClaw giữ một registry Plugin cục bộ đã lưu làm mô hình đọc lạnh cho
kho Plugin, quyền sở hữu đóng góp, và lập kế hoạch khởi động. Các luồng install, update,
uninstall, enable, và disable làm mới registry đó sau khi thay đổi trạng thái Plugin.
Cùng tệp `plugins/installs.json` giữ metadata cài đặt bền vững trong
`installRecords` cấp cao nhất và metadata manifest có thể xây dựng lại trong `plugins`. Nếu
registry bị thiếu, cũ, hoặc không hợp lệ, `openclaw plugins registry
--refresh` xây dựng lại chế độ xem manifest từ bản ghi cài đặt, chính sách cấu hình, và
metadata manifest/package mà không tải các module runtime Plugin.
`openclaw plugins update <id-or-npm-spec>` áp dụng cho các bản cài đặt được theo dõi. Truyền
một spec gói npm có dist-tag hoặc phiên bản chính xác sẽ phân giải tên gói
về bản ghi Plugin được theo dõi và ghi lại spec mới cho các lần cập nhật sau.
Truyền tên gói không có phiên bản sẽ chuyển một bản cài đặt ghim chính xác trở lại
dòng phát hành mặc định của registry. Nếu Plugin npm đã cài đã khớp
phiên bản đã phân giải và danh tính artifact đã ghi, OpenClaw bỏ qua cập nhật
mà không tải xuống, cài đặt lại, hoặc ghi lại cấu hình.

`--pin` chỉ dành cho npm. Nó không được hỗ trợ với `--marketplace`, vì
các bản cài đặt marketplace lưu metadata nguồn marketplace thay vì spec npm.

`--dangerously-force-unsafe-install` là ghi đè khẩn cấp cho các kết quả dương tính giả
từ trình quét mã nguy hiểm tích hợp. Nó cho phép cài đặt Plugin
và cập nhật Plugin tiếp tục vượt qua các phát hiện `critical` tích hợp, nhưng vẫn
không bỏ qua các chặn chính sách `before_install` của Plugin hoặc chặn do lỗi quét.
Các lần quét cài đặt bỏ qua các tệp và thư mục kiểm thử phổ biến như `tests/`,
`__tests__/`, `*.test.*`, và `*.spec.*` để tránh chặn các mock kiểm thử đã đóng gói;
các entrypoint runtime Plugin đã khai báo vẫn được quét ngay cả khi chúng dùng một trong
các tên đó.

Cờ CLI này chỉ áp dụng cho các luồng cài đặt/cập nhật Plugin. Các bản cài đặt phụ thuộc Skills
dựa trên Gateway dùng ghi đè yêu cầu `dangerouslyForceUnsafeInstall` tương ứng
thay vào đó, trong khi `openclaw skills install` vẫn là luồng tải xuống/cài đặt Skills
ClawHub riêng biệt.

Nếu một Plugin bạn đã xuất bản trên ClawHub bị ẩn hoặc bị chặn bởi một lần quét, hãy mở
bảng điều khiển ClawHub hoặc chạy `clawhub package rescan <name>` để yêu cầu ClawHub kiểm tra
lại. `--dangerously-force-unsafe-install` chỉ ảnh hưởng đến các bản cài đặt trên máy của bạn;
nó không yêu cầu ClawHub quét lại Plugin hoặc công khai một bản phát hành bị chặn.

Các bundle tương thích tham gia cùng luồng liệt kê/kiểm tra/bật/tắt Plugin.
Hỗ trợ runtime hiện tại bao gồm bundle Skills, Claude command-skills,
mặc định `settings.json` của Claude, mặc định Claude `.lsp.json` và
`lspServers` do manifest khai báo, Cursor command-skills, và các thư mục hook
Codex tương thích.

`openclaw plugins inspect <id>` cũng báo cáo các khả năng bundle đã phát hiện cùng
các mục máy chủ MCP và LSP được hỗ trợ hoặc không được hỗ trợ cho các Plugin dựa trên bundle.

Nguồn marketplace có thể là tên marketplace đã biết của Claude từ
`~/.claude/plugins/known_marketplaces.json`, một root marketplace cục bộ hoặc
đường dẫn `marketplace.json`, dạng viết tắt GitHub như `owner/repo`, URL repo
GitHub, hoặc URL git. Đối với marketplace từ xa, các mục Plugin phải nằm trong
repo marketplace đã clone và chỉ dùng nguồn đường dẫn tương đối.

Xem [tham chiếu CLI `openclaw plugins`](/vi/cli/plugins) để biết đầy đủ chi tiết.

## Tổng quan API Plugin

Các Plugin native export một đối tượng entry cung cấp `register(api)`. Các Plugin
cũ hơn vẫn có thể dùng `activate(api)` như alias cũ, nhưng Plugin mới nên
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
Loader vẫn fallback sang `activate(api)` cho các Plugin cũ hơn,
nhưng các Plugin đi kèm và Plugin bên ngoài mới nên xem `register` là
hợp đồng công khai.

`api.registrationMode` cho Plugin biết lý do entry của nó đang được tải:

| Chế độ          | Ý nghĩa                                                                                                                                        |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | Kích hoạt khi chạy. Đăng ký công cụ, hook, dịch vụ, lệnh, route và các hiệu ứng phụ đang hoạt động khác.                                       |
| `discovery`     | Khám phá khả năng chỉ đọc. Đăng ký nhà cung cấp và siêu dữ liệu; mã điểm vào Plugin đáng tin cậy có thể tải, nhưng bỏ qua hiệu ứng phụ sống. |
| `setup-only`    | Tải siêu dữ liệu thiết lập kênh thông qua một điểm vào thiết lập nhẹ.                                                                          |
| `setup-runtime` | Tải thiết lập kênh cũng cần điểm vào thời gian chạy.                                                                                           |
| `cli-metadata`  | Chỉ thu thập siêu dữ liệu lệnh CLI.                                                                                                            |

Các điểm vào Plugin mở socket, cơ sở dữ liệu, tiến trình nền hoặc client tồn tại lâu
nên bảo vệ các hiệu ứng phụ đó bằng `api.registrationMode === "full"`.
Các lần tải khám phá được lưu vào bộ nhớ đệm tách biệt với các lần tải kích hoạt và không thay thế
registry Gateway đang chạy. Khám phá không kích hoạt, không phải là không nhập:
OpenClaw có thể đánh giá điểm vào Plugin đáng tin cậy hoặc module Plugin kênh để xây dựng
ảnh chụp. Giữ cấp cao nhất của module nhẹ và không có hiệu ứng phụ, đồng thời chuyển
client mạng, tiến trình con, trình lắng nghe, đọc thông tin xác thực và khởi động dịch vụ
phía sau các đường dẫn thời gian chạy đầy đủ.

Các phương thức đăng ký phổ biến:

| Phương thức                             | Nội dung đăng ký                         |
| --------------------------------------- | ---------------------------------------- |
| `registerProvider`                      | Nhà cung cấp mô hình (LLM)               |
| `registerChannel`                       | Kênh chat                                |
| `registerTool`                          | Công cụ agent                            |
| `registerHook` / `on(...)`              | Hook vòng đời                            |
| `registerSpeechProvider`                | Chuyển văn bản thành giọng nói / STT     |
| `registerRealtimeTranscriptionProvider` | STT truyền phát                          |
| `registerRealtimeVoiceProvider`         | Giọng nói thời gian thực song công       |
| `registerMediaUnderstandingProvider`    | Phân tích hình ảnh/âm thanh              |
| `registerImageGenerationProvider`       | Tạo hình ảnh                             |
| `registerMusicGenerationProvider`       | Tạo nhạc                                 |
| `registerVideoGenerationProvider`       | Tạo video                                |
| `registerWebFetchProvider`              | Nhà cung cấp tìm nạp / thu thập web      |
| `registerWebSearchProvider`             | Tìm kiếm web                             |
| `registerHttpRoute`                     | Điểm cuối HTTP                           |
| `registerCommand` / `registerCli`       | Lệnh CLI                                 |
| `registerContextEngine`                 | Bộ máy ngữ cảnh                          |
| `registerService`                       | Dịch vụ nền                              |

Hành vi bảo vệ hook cho các hook vòng đời có kiểu:

- `before_tool_call`: `{ block: true }` là trạng thái kết thúc; các handler có mức ưu tiên thấp hơn bị bỏ qua.
- `before_tool_call`: `{ block: false }` là không thao tác và không xóa một chặn trước đó.
- `before_install`: `{ block: true }` là trạng thái kết thúc; các handler có mức ưu tiên thấp hơn bị bỏ qua.
- `before_install`: `{ block: false }` là không thao tác và không xóa một chặn trước đó.
- `message_sending`: `{ cancel: true }` là trạng thái kết thúc; các handler có mức ưu tiên thấp hơn bị bỏ qua.
- `message_sending`: `{ cancel: false }` là không thao tác và không xóa một hủy trước đó.

Các lần chạy máy chủ ứng dụng Codex gốc nối các sự kiện công cụ gốc Codex trở lại
bề mặt hook này. Plugin có thể chặn công cụ gốc Codex thông qua `before_tool_call`,
quan sát kết quả thông qua `after_tool_call` và tham gia phê duyệt
`PermissionRequest` của Codex. Cầu nối chưa viết lại đối số công cụ gốc Codex.
Ranh giới hỗ trợ thời gian chạy Codex chính xác nằm trong
[hợp đồng hỗ trợ Codex harness v1](/vi/plugins/codex-harness#v1-support-contract).

Để xem đầy đủ hành vi hook có kiểu, hãy xem [tổng quan SDK](/vi/plugins/sdk-overview#hook-decision-semantics).

## Liên quan

- [Xây dựng Plugin](/vi/plugins/building-plugins) — tạo Plugin của riêng bạn
- [Gói Plugin](/vi/plugins/bundles) — khả năng tương thích gói Codex/Claude/Cursor
- [Manifest Plugin](/vi/plugins/manifest) — schema manifest
- [Đăng ký công cụ](/vi/plugins/building-plugins#registering-agent-tools) — thêm công cụ agent trong một Plugin
- [Nội bộ Plugin](/vi/plugins/architecture) — mô hình khả năng và pipeline tải
- [Plugin cộng đồng](/vi/plugins/community) — danh sách bên thứ ba
