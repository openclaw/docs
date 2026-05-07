---
read_when:
    - Bạn cần ngữ nghĩa hoặc giá trị mặc định chính xác của cấu hình ở cấp trường
    - Bạn đang xác thực các khối cấu hình kênh, mô hình, Gateway hoặc công cụ
summary: Tài liệu tham chiếu cấu hình Gateway cho các khóa OpenClaw cốt lõi, giá trị mặc định và liên kết đến các tài liệu tham chiếu hệ thống con chuyên biệt
title: Tham chiếu cấu hình
x-i18n:
    generated_at: "2026-05-07T13:16:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5b279c3e74fd6f7de01d63b642ab17aaaac65c39b855efc745eadc121adbf1fb
    source_path: gateway/configuration-reference.md
    workflow: 16
---

Tham chiếu cấu hình lõi cho `~/.openclaw/openclaw.json`. Để xem tổng quan theo tác vụ, xem [Cấu hình](/vi/gateway/configuration).

Bao quát các bề mặt cấu hình OpenClaw chính và liên kết ra ngoài khi một hệ con có tham chiếu sâu hơn riêng. Các danh mục lệnh do kênh và plugin sở hữu cùng các núm điều chỉnh bộ nhớ sâu/QMD nằm trên các trang riêng thay vì trang này.

Nguồn đúng theo mã:

- `openclaw config schema` in JSON Schema đang chạy được dùng để xác thực và Control UI, với metadata bundled/plugin/channel được hợp nhất khi có
- `config.schema.lookup` trả về một nút schema theo phạm vi đường dẫn cho công cụ đi sâu
- `pnpm config:docs:check` / `pnpm config:docs:gen` xác thực hash baseline tài liệu cấu hình so với bề mặt schema hiện tại

Đường dẫn tra cứu agent: dùng hành động công cụ `gateway` `config.schema.lookup` để có tài liệu và ràng buộc chính xác ở cấp trường trước khi chỉnh sửa. Dùng [Cấu hình](/vi/gateway/configuration) để có hướng dẫn theo tác vụ và trang này cho bản đồ trường rộng hơn, giá trị mặc định, và liên kết đến tham chiếu hệ con.

Tham chiếu sâu chuyên biệt:

- [Tham chiếu cấu hình bộ nhớ](/vi/reference/memory-config) cho `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations`, và cấu hình dreaming dưới `plugins.entries.memory-core.config.dreaming`
- [Lệnh slash](/vi/tools/slash-commands) cho danh mục lệnh tích hợp + bundled hiện tại
- các trang kênh/plugin sở hữu cho bề mặt lệnh theo kênh

Định dạng cấu hình là **JSON5** (cho phép comment + dấu phẩy cuối). Tất cả trường đều không bắt buộc - OpenClaw dùng mặc định an toàn khi bị bỏ qua.

---

## Kênh

Các khóa cấu hình theo kênh đã chuyển sang một trang chuyên dụng - xem [Cấu hình - kênh](/vi/gateway/config-channels) cho `channels.*`, bao gồm Slack, Discord, Telegram, WhatsApp, Matrix, iMessage, và các kênh bundled khác (xác thực, kiểm soát truy cập, nhiều tài khoản, cổng mention).

## Mặc định agent, đa agent, phiên, và tin nhắn

Đã chuyển sang một trang chuyên dụng - xem [Cấu hình - agent](/vi/gateway/config-agents) cho:

- `agents.defaults.*` (workspace, model, thinking, heartbeat, memory, media, skills, sandbox)
- `multiAgent.*` (định tuyến và binding đa agent)
- `session.*` (vòng đời phiên, Compaction, cắt tỉa)
- `messages.*` (gửi tin nhắn, TTS, render markdown)
- `talk.*` (chế độ Talk)
  - `talk.speechLocale`: id locale BCP 47 tùy chọn cho nhận dạng giọng nói Talk trên iOS/macOS
  - `talk.silenceTimeoutMs`: khi chưa đặt, Talk giữ cửa sổ tạm dừng mặc định của nền tảng trước khi gửi transcript (`700 ms on macOS and Android, 900 ms on iOS`)

## Công cụ và provider tùy chỉnh

Chính sách công cụ, bật/tắt thử nghiệm, cấu hình công cụ dựa trên provider, và thiết lập provider / base-URL tùy chỉnh đã chuyển sang một trang chuyên dụng - xem [Cấu hình - công cụ và provider tùy chỉnh](/vi/gateway/config-tools).

## Model

Định nghĩa provider, allowlist model, và thiết lập provider tùy chỉnh nằm trong [Cấu hình - công cụ và provider tùy chỉnh](/vi/gateway/config-tools#custom-providers-and-base-urls). Gốc `models` cũng sở hữu hành vi catalog model toàn cục.

```json5
{
  models: {
    // Optional. Default: true. Requires a Gateway restart when changed.
    pricing: { enabled: false },
  },
}
```

- `models.mode`: hành vi catalog provider (`merge` hoặc `replace`).
- `models.providers`: map provider tùy chỉnh được khóa theo id provider.
- `models.pricing.enabled`: kiểm soát bootstrap pricing nền khởi động sau khi sidecar và kênh đi tới đường dẫn Gateway ready. Khi `false`, Gateway bỏ qua các lần fetch catalog pricing OpenRouter và LiteLLM; các giá trị `models.providers.*.models[].cost` đã cấu hình vẫn hoạt động cho ước tính chi phí cục bộ.

## MCP

Định nghĩa máy chủ MCP do OpenClaw quản lý nằm dưới `mcp.servers` và được Pi nhúng cùng các runtime adapter khác tiêu thụ. Các lệnh `openclaw mcp list`, `show`, `set`, và `unset` quản lý khối này mà không kết nối đến máy chủ đích trong lúc chỉnh sửa cấu hình.

```json5
{
  mcp: {
    // Optional. Default: 600000 ms (10 minutes). Set 0 to disable idle eviction.
    sessionIdleTtlMs: 600000,
    servers: {
      docs: {
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-fetch"],
      },
      remote: {
        url: "https://example.com/mcp",
        transport: "streamable-http", // streamable-http | sse
        headers: {
          Authorization: "Bearer ${MCP_REMOTE_TOKEN}",
        },
      },
    },
  },
}
```

- `mcp.servers`: định nghĩa máy chủ MCP stdio hoặc từ xa có tên cho các runtime phơi bày công cụ MCP đã cấu hình. Các mục từ xa dùng `transport: "streamable-http"` hoặc `transport: "sse"`; `type: "http"` là alias gốc CLI mà `openclaw mcp set` và `openclaw doctor --fix` chuẩn hóa thành trường `transport` chính tắc.
- `mcp.sessionIdleTtlMs`: TTL nhàn rỗi cho runtime MCP bundled theo phạm vi phiên. Các lần chạy nhúng một lần yêu cầu dọn dẹp khi kết thúc chạy; TTL này là điểm dự phòng cho phiên sống lâu và caller trong tương lai.
- Thay đổi dưới `mcp.*` được áp dụng nóng bằng cách dispose runtime MCP phiên đã cache. Lần khám phá/dùng công cụ tiếp theo tạo lại chúng từ cấu hình mới, nên các mục `mcp.servers` bị xóa được thu dọn ngay thay vì chờ TTL nhàn rỗi.

Xem [MCP](/vi/cli/mcp#openclaw-as-an-mcp-client-registry) và [backend CLI](/vi/gateway/cli-backends#bundle-mcp-overlays) để biết hành vi runtime.

## Skills

```json5
{
  skills: {
    allowBundled: ["gemini", "peekaboo"],
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills"],
    },
    install: {
      preferBrew: true,
      nodeManager: "npm", // npm | pnpm | yarn | bun
    },
    entries: {
      "image-lab": {
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // or plaintext string
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

- `allowBundled`: allowlist tùy chọn chỉ cho bundled skills (không ảnh hưởng đến managed/workspace skills).
- `load.extraDirs`: các gốc skill dùng chung bổ sung (mức ưu tiên thấp nhất).
- `install.preferBrew`: khi true, ưu tiên trình cài đặt Homebrew khi `brew` có sẵn trước khi fallback sang các loại trình cài đặt khác.
- `install.nodeManager`: tùy chọn trình cài đặt node cho thông số `metadata.openclaw.install` (`npm` | `pnpm` | `yarn` | `bun`).
- `entries.<skillKey>.enabled: false` tắt một skill ngay cả khi bundled/đã cài đặt.
- `entries.<skillKey>.apiKey`: tiện ích cho skills khai báo một biến env chính (chuỗi plaintext hoặc đối tượng SecretRef).

---

## Plugin

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    bundledDiscovery: "allowlist",
    deny: [],
    load: {
      paths: ["~/Projects/oss/voice-call-plugin"],
    },
    entries: {
      "voice-call": {
        enabled: true,
        hooks: {
          allowPromptInjection: false,
        },
        config: { provider: "twilio" },
      },
    },
  },
}
```

- Được tải từ `~/.openclaw/extensions`, `<workspace>/.openclaw/extensions`, cộng với `plugins.load.paths`.
- Discovery chấp nhận Plugin OpenClaw native cùng các bundle Codex tương thích và bundle Claude, bao gồm bundle bố cục mặc định Claude không có manifest.
- **Thay đổi cấu hình yêu cầu khởi động lại gateway.**
- `allow`: allowlist tùy chọn (chỉ tải các plugin được liệt kê). `deny` thắng.
- `bundledDiscovery`: mặc định là `"allowlist"` cho cấu hình mới, nên `plugins.allow` không rỗng cũng chặn/cấp quyền các Plugin provider bundled, bao gồm provider runtime web-search. Doctor ghi `"compat"` cho cấu hình allowlist legacy đã migrate để giữ hành vi provider bundled hiện có cho đến khi bạn chọn tham gia.
- `plugins.entries.<id>.apiKey`: trường tiện ích khóa API cấp plugin (khi plugin hỗ trợ).
- `plugins.entries.<id>.env`: map biến env theo phạm vi plugin.
- `plugins.entries.<id>.hooks.allowPromptInjection`: khi `false`, core chặn `before_prompt_build` và bỏ qua các trường sửa prompt từ `before_agent_start` legacy, trong khi vẫn giữ `modelOverride` và `providerOverride` legacy. Áp dụng cho hook plugin native và thư mục hook do bundle cung cấp được hỗ trợ.
- `plugins.entries.<id>.hooks.allowConversationAccess`: khi `true`, plugin không bundled đáng tin cậy có thể đọc nội dung hội thoại thô từ các hook typed như `llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize`, và `agent_end`.
- `plugins.entries.<id>.subagent.allowModelOverride`: tin cậy rõ ràng plugin này để yêu cầu override `provider` và `model` theo từng lần chạy cho các lần chạy subagent nền.
- `plugins.entries.<id>.subagent.allowedModels`: allowlist tùy chọn của các đích `provider/model` chính tắc cho override subagent đáng tin cậy. Chỉ dùng `"*"` khi bạn cố ý muốn cho phép mọi model.
- `plugins.entries.<id>.config`: đối tượng cấu hình do plugin định nghĩa (được xác thực bởi schema Plugin OpenClaw native khi có).
- Thiết lập tài khoản/runtime Plugin kênh nằm dưới `channels.<id>` và nên được mô tả bằng metadata `channelConfigs` trong manifest của plugin sở hữu, không phải bằng registry tùy chọn OpenClaw trung tâm.
- `plugins.entries.firecrawl.config.webFetch`: thiết lập provider web-fetch Firecrawl.
  - `apiKey`: khóa API Firecrawl (chấp nhận SecretRef). Fallback sang `plugins.entries.firecrawl.config.webSearch.apiKey`, `tools.web.fetch.firecrawl.apiKey` legacy, hoặc biến env `FIRECRAWL_API_KEY`.
  - `baseUrl`: URL gốc API Firecrawl (mặc định: `https://api.firecrawl.dev`; override self-hosted phải trỏ đến endpoint private/internal).
  - `onlyMainContent`: chỉ trích xuất nội dung chính từ trang (mặc định: `true`).
  - `maxAgeMs`: tuổi cache tối đa tính bằng mili giây (mặc định: `172800000` / 2 ngày).
  - `timeoutSeconds`: thời gian chờ yêu cầu scrape tính bằng giây (mặc định: `60`).
- `plugins.entries.xai.config.xSearch`: thiết lập xAI X Search (tìm kiếm web Grok).
  - `enabled`: bật provider X Search.
  - `model`: model Grok dùng cho tìm kiếm (ví dụ `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: thiết lập memory dreaming. Xem [Dreaming](/vi/concepts/dreaming) để biết các pha và ngưỡng.
  - `enabled`: công tắc dreaming chính (mặc định `false`).
  - `frequency`: nhịp cron cho mỗi lượt quét dreaming đầy đủ (mặc định `"0 3 * * *"`).
  - `model`: override model subagent Dream Diary tùy chọn. Yêu cầu `plugins.entries.memory-core.subagent.allowModelOverride: true`; ghép với `allowedModels` để giới hạn đích. Lỗi model không khả dụng thử lại một lần với model mặc định của phiên; lỗi tin cậy hoặc allowlist không fallback âm thầm.
  - chính sách pha và ngưỡng là chi tiết triển khai (không phải khóa cấu hình hướng người dùng).
- Cấu hình bộ nhớ đầy đủ nằm trong [Tham chiếu cấu hình bộ nhớ](/vi/reference/memory-config):
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Plugin bundle Claude đã bật cũng có thể đóng góp mặc định Pi nhúng từ `settings.json`; OpenClaw áp dụng chúng như thiết lập agent đã làm sạch, không phải patch cấu hình OpenClaw thô.
- `plugins.slots.memory`: chọn id plugin bộ nhớ đang hoạt động, hoặc `"none"` để tắt plugin bộ nhớ.
- `plugins.slots.contextEngine`: chọn id plugin context engine đang hoạt động; mặc định là `"legacy"` trừ khi bạn cài đặt và chọn engine khác.

Xem [Plugin](/vi/tools/plugin).

---

## Cam kết

`commitments` kiểm soát bộ nhớ theo dõi suy luận: OpenClaw có thể phát hiện lượt check-in từ các lượt hội thoại và gửi chúng qua các lần chạy heartbeat.

- `commitments.enabled`: bật trích xuất LLM ẩn, lưu trữ, và gửi heartbeat cho các cam kết theo dõi được suy luận. Mặc định: `false`.
- `commitments.maxPerDay`: số cam kết theo dõi suy luận tối đa được gửi cho mỗi phiên agent trong một ngày trượt. Mặc định: `3`.

Xem [Cam kết suy luận](/vi/concepts/commitments).

---

## Trình duyệt

```json5
{
  browser: {
    enabled: true,
    evaluateEnabled: true,
    defaultProfile: "user",
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // opt in only for trusted private-network access
      // allowPrivateNetwork: true, // legacy alias
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    tabCleanup: {
      enabled: true,
      idleMinutes: 120,
      maxTabsPerSession: 8,
      sweepMinutes: 5,
    },
    profiles: {
      openclaw: { cdpPort: 18800, color: "#FF4500" },
      work: {
        cdpPort: 18801,
        color: "#0066CC",
        executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      },
      user: { driver: "existing-session", attachOnly: true, color: "#00AA00" },
      brave: {
        driver: "existing-session",
        attachOnly: true,
        userDataDir: "~/Library/Application Support/BraveSoftware/Brave-Browser",
        color: "#FB542B",
      },
      remote: { cdpUrl: "http://10.0.0.42:9222", color: "#00AA00" },
    },
    color: "#FF4500",
    // headless: false,
    // noSandbox: false,
    // extraArgs: [],
    // executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    // attachOnly: false,
  },
}
```

- `evaluateEnabled: false` vô hiệu hóa `act:evaluate` và `wait --fn`.
- `tabCleanup` thu hồi các tab tác tử chính được theo dõi sau thời gian nhàn rỗi hoặc khi một
  phiên vượt quá giới hạn. Đặt `idleMinutes: 0` hoặc `maxTabsPerSession: 0` để
  vô hiệu hóa từng chế độ dọn dẹp riêng lẻ đó.
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` bị vô hiệu hóa khi chưa đặt, nên điều hướng trình duyệt mặc định vẫn nghiêm ngặt.
- Chỉ đặt `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` khi bạn cố ý tin cậy điều hướng trình duyệt mạng riêng.
- Ở chế độ nghiêm ngặt, các điểm cuối hồ sơ CDP từ xa (`profiles.*.cdpUrl`) chịu cùng cơ chế chặn mạng riêng trong quá trình kiểm tra khả năng truy cập/phát hiện.
- `ssrfPolicy.allowPrivateNetwork` vẫn được hỗ trợ dưới dạng bí danh kế thừa.
- Ở chế độ nghiêm ngặt, dùng `ssrfPolicy.hostnameAllowlist` và `ssrfPolicy.allowedHostnames` cho các ngoại lệ tường minh.
- Hồ sơ từ xa chỉ đính kèm (vô hiệu hóa khởi động/dừng/đặt lại).
- `profiles.*.cdpUrl` chấp nhận `http://`, `https://`, `ws://`, và `wss://`.
  Dùng HTTP(S) khi bạn muốn OpenClaw phát hiện `/json/version`; dùng WS(S)
  khi nhà cung cấp cung cấp cho bạn URL DevTools WebSocket trực tiếp.
- `remoteCdpTimeoutMs` và `remoteCdpHandshakeTimeoutMs` áp dụng cho khả năng truy cập CDP từ xa và
  `attachOnly` cùng các yêu cầu mở tab. Các hồ sơ local loopback được quản lý
  giữ mặc định CDP cục bộ.
- Nếu một dịch vụ CDP được quản lý bên ngoài có thể truy cập qua loopback, hãy đặt
  `attachOnly: true` cho hồ sơ đó; nếu không OpenClaw xử lý cổng loopback như một
  hồ sơ trình duyệt cục bộ được quản lý và có thể báo lỗi quyền sở hữu cổng cục bộ.
- Hồ sơ `existing-session` dùng Chrome MCP thay vì CDP và có thể đính kèm trên
  máy chủ đã chọn hoặc thông qua một nút trình duyệt đã kết nối.
- Hồ sơ `existing-session` có thể đặt `userDataDir` để nhắm tới một
  hồ sơ trình duyệt dựa trên Chromium cụ thể như Brave hoặc Edge.
- Hồ sơ `existing-session` giữ các giới hạn tuyến Chrome MCP hiện tại:
  hành động dựa trên snapshot/ref thay vì nhắm mục tiêu bằng CSS selector, hook tải lên một tệp,
  không có ghi đè thời gian chờ hộp thoại, không có `wait --load networkidle`, và không có
  `responsebody`, xuất PDF, chặn tải xuống, hoặc hành động theo lô.
- Hồ sơ `openclaw` cục bộ được quản lý tự động gán `cdpPort` và `cdpUrl`; chỉ
  đặt `cdpUrl` tường minh cho CDP từ xa.
- Hồ sơ cục bộ được quản lý có thể đặt `executablePath` để ghi đè
  `browser.executablePath` toàn cục cho hồ sơ đó. Dùng tùy chọn này để chạy một hồ sơ trong
  Chrome và một hồ sơ khác trong Brave.
- Hồ sơ cục bộ được quản lý dùng `browser.localLaunchTimeoutMs` cho việc phát hiện Chrome CDP HTTP
  sau khi tiến trình khởi động và `browser.localCdpReadyTimeoutMs` cho
  trạng thái sẵn sàng websocket CDP sau khi khởi chạy. Tăng các giá trị này trên máy chủ chậm hơn nơi Chrome
  khởi động thành công nhưng kiểm tra trạng thái sẵn sàng bị chạy đua với khởi động. Cả hai giá trị phải là
  số nguyên dương tối đa `120000` ms; các giá trị cấu hình không hợp lệ sẽ bị từ chối.
- Thứ tự tự động phát hiện: trình duyệt mặc định nếu dựa trên Chromium → Chrome → Brave → Edge → Chromium → Chrome Canary.
- `browser.executablePath` và `browser.profiles.<name>.executablePath` đều
  chấp nhận `~` và `~/...` cho thư mục chính của hệ điều hành của bạn trước khi khởi chạy Chromium.
  `userDataDir` theo từng hồ sơ trên hồ sơ `existing-session` cũng được mở rộng dấu ngã.
- Dịch vụ điều khiển: chỉ loopback (cổng được dẫn xuất từ `gateway.port`, mặc định `18791`).
- `extraArgs` nối thêm các cờ khởi chạy bổ sung vào quá trình khởi động Chromium cục bộ (ví dụ
  `--disable-gpu`, kích thước cửa sổ, hoặc cờ gỡ lỗi).

---

## Giao diện người dùng

```json5
{
  ui: {
    seamColor: "#FF4500",
    assistant: {
      name: "OpenClaw",
      avatar: "CB", // emoji, short text, image URL, or data URI
    },
  },
}
```

- `seamColor`: màu nhấn cho chrome giao diện người dùng ứng dụng gốc (màu bong bóng Talk Mode, v.v.).
- `assistant`: ghi đè danh tính Giao diện điều khiển. Dự phòng về danh tính tác tử đang hoạt động.

---

## Gateway

```json5
{
  gateway: {
    mode: "local", // local | remote
    port: 18789,
    bind: "loopback",
    auth: {
      mode: "token", // none | token | password | trusted-proxy
      token: "your-token",
      // password: "your-password", // or OPENCLAW_GATEWAY_PASSWORD
      // trustedProxy: { userHeader: "x-forwarded-user" }, // for mode=trusted-proxy; see /gateway/trusted-proxy-auth
      allowTailscale: true,
      rateLimit: {
        maxAttempts: 10,
        windowMs: 60000,
        lockoutMs: 300000,
        exemptLoopback: true,
      },
    },
    tailscale: {
      mode: "off", // off | serve | funnel
      resetOnExit: false,
    },
    controlUi: {
      enabled: true,
      basePath: "/openclaw",
      // root: "dist/control-ui",
      // embedSandbox: "scripts", // strict | scripts | trusted
      // allowExternalEmbedUrls: false, // dangerous: allow absolute external http(s) embed URLs
      // chatMessageMaxWidth: "min(1280px, 82%)", // optional grouped chat message max-width
      // allowedOrigins: ["https://control.example.com"], // required for non-loopback Control UI
      // dangerouslyAllowHostHeaderOriginFallback: false, // dangerous Host-header origin fallback mode
      // allowInsecureAuth: false,
      // dangerouslyDisableDeviceAuth: false,
    },
    remote: {
      url: "ws://gateway.tailnet:18789",
      transport: "ssh", // ssh | direct
      token: "your-token",
      // password: "your-password",
    },
    trustedProxies: ["10.0.0.1"],
    // Optional. Default false.
    allowRealIpFallback: false,
    nodes: {
      pairing: {
        // Optional. Default unset/disabled.
        autoApproveCidrs: ["192.168.1.0/24", "fd00:1234:5678::/64"],
      },
      allowCommands: ["canvas.navigate"],
      denyCommands: ["system.run"],
    },
    tools: {
      // Additional /tools/invoke HTTP denies
      deny: ["browser"],
      // Remove tools from the default HTTP deny list
      allow: ["gateway"],
    },
    push: {
      apns: {
        relay: {
          baseUrl: "https://relay.example.com",
          timeoutMs: 10000,
        },
      },
    },
  },
}
```

<Accordion title="Gateway field details">

- `mode`: `local` (chạy Gateway) hoặc `remote` (kết nối tới Gateway từ xa). Gateway từ chối khởi động trừ khi là `local`.
- `port`: cổng ghép kênh duy nhất cho WS + HTTP. Thứ tự ưu tiên: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto`, `loopback` (mặc định), `lan` (`0.0.0.0`), `tailnet` (chỉ IP Tailscale), hoặc `custom`.
- **Bí danh bind cũ**: dùng các giá trị chế độ bind trong `gateway.bind` (`auto`, `loopback`, `lan`, `tailnet`, `custom`), không dùng bí danh host (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`).
- **Ghi chú Docker**: bind `loopback` mặc định lắng nghe trên `127.0.0.1` bên trong container. Với mạng Docker bridge (`-p 18789:18789`), lưu lượng đi vào qua `eth0`, nên Gateway không thể truy cập được. Dùng `--network host`, hoặc đặt `bind: "lan"` (hoặc `bind: "custom"` với `customBindHost: "0.0.0.0"`) để lắng nghe trên tất cả giao diện mạng.
- **Xác thực**: mặc định là bắt buộc. Các bind không phải loopback yêu cầu xác thực Gateway. Trên thực tế, điều đó nghĩa là token/mật khẩu dùng chung hoặc reverse proxy nhận biết danh tính với `gateway.auth.mode: "trusted-proxy"`. Trình hướng dẫn onboarding tạo token theo mặc định.
- Nếu cả `gateway.auth.token` và `gateway.auth.password` đều được cấu hình (bao gồm SecretRefs), hãy đặt rõ `gateway.auth.mode` thành `token` hoặc `password`. Các luồng khởi động và cài đặt/sửa dịch vụ sẽ thất bại khi cả hai được cấu hình mà mode chưa được đặt.
- `gateway.auth.mode: "none"`: chế độ không xác thực rõ ràng. Chỉ dùng cho các thiết lập local loopback đáng tin cậy; chế độ này chủ ý không được cung cấp trong các lời nhắc onboarding.
- `gateway.auth.mode: "trusted-proxy"`: ủy quyền xác thực trình duyệt/người dùng cho reverse proxy nhận biết danh tính và tin cậy các header danh tính từ `gateway.trustedProxies` (xem [Xác thực Trusted Proxy](/vi/gateway/trusted-proxy-auth)). Chế độ này mặc định kỳ vọng nguồn proxy **không phải loopback**; các reverse proxy loopback cùng host cần đặt rõ `gateway.auth.trustedProxy.allowLoopback = true`. Các caller nội bộ cùng host có thể dùng `gateway.auth.password` làm phương án dự phòng trực tiếp cục bộ; `gateway.auth.token` vẫn loại trừ lẫn nhau với chế độ trusted-proxy.
- `gateway.auth.allowTailscale`: khi là `true`, các header danh tính Tailscale Serve có thể đáp ứng xác thực Control UI/WebSocket (được xác minh qua `tailscale whois`). Các endpoint HTTP API **không** dùng xác thực header Tailscale đó; thay vào đó chúng tuân theo chế độ xác thực HTTP thông thường của Gateway. Luồng không token này giả định host Gateway là đáng tin cậy. Mặc định là `true` khi `tailscale.mode = "serve"`.
- `gateway.auth.rateLimit`: bộ giới hạn xác thực thất bại tùy chọn. Áp dụng theo từng IP client và từng phạm vi xác thực (shared-secret và device-token được theo dõi độc lập). Các lần thử bị chặn trả về `429` + `Retry-After`.
  - Trên đường dẫn Control UI Tailscale Serve bất đồng bộ, các lần thử thất bại cho cùng `{scope, clientIp}` được tuần tự hóa trước khi ghi thất bại. Vì vậy, các lần thử sai đồng thời từ cùng client có thể kích hoạt bộ giới hạn ở yêu cầu thứ hai thay vì cả hai cùng vượt qua như các lần không khớp thông thường.
  - `gateway.auth.rateLimit.exemptLoopback` mặc định là `true`; đặt `false` khi bạn chủ ý muốn lưu lượng localhost cũng bị giới hạn tốc độ (cho thiết lập kiểm thử hoặc triển khai proxy nghiêm ngặt).
- Các lần thử xác thực WS có nguồn gốc trình duyệt luôn bị throttle với miễn trừ loopback bị tắt (phòng vệ nhiều lớp chống brute force localhost dựa trên trình duyệt).
- Trên loopback, các lockout có nguồn gốc trình duyệt đó được cô lập theo từng giá trị `Origin`
  đã chuẩn hóa, nên các lần thất bại lặp lại từ một origin localhost sẽ không tự động
  khóa một origin khác.
- `tailscale.mode`: `serve` (chỉ tailnet, bind loopback) hoặc `funnel` (công khai, yêu cầu xác thực).
- `controlUi.allowedOrigins`: allowlist nguồn gốc trình duyệt rõ ràng cho các kết nối WebSocket Gateway. Bắt buộc khi client trình duyệt được kỳ vọng đến từ các origin không phải loopback.
- `controlUi.chatMessageMaxWidth`: max-width tùy chọn cho các tin nhắn chat Control UI đã nhóm. Chấp nhận các giá trị chiều rộng CSS có ràng buộc như `960px`, `82%`, `min(1280px, 82%)`, và `calc(100% - 2rem)`.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: chế độ nguy hiểm bật fallback origin từ Host-header cho các triển khai chủ ý dựa vào chính sách origin Host-header.
- `remote.transport`: `ssh` (mặc định) hoặc `direct` (ws/wss). Với `direct`, `remote.url` phải là `ws://` hoặc `wss://`.
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: override khẩn cấp từ môi trường tiến trình phía client
  cho phép `ws://` dạng plaintext tới các IP mạng riêng đáng tin cậy;
  mặc định vẫn chỉ cho phép plaintext trên loopback. Không có cấu hình tương đương trong `openclaw.json`,
  và cấu hình mạng riêng của trình duyệt như
  `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` không ảnh hưởng đến các client WebSocket
  Gateway.
- `gateway.remote.token` / `.password` là các trường thông tin xác thực remote-client. Tự chúng không cấu hình xác thực Gateway.
- `gateway.push.apns.relay.baseUrl`: URL HTTPS cơ sở cho relay APNs bên ngoài được các bản dựng iOS chính thức/TestFlight sử dụng sau khi chúng công bố các đăng ký có relay hỗ trợ lên Gateway. URL này phải khớp với URL relay được biên dịch vào bản dựng iOS.
- `gateway.push.apns.relay.timeoutMs`: timeout gửi từ Gateway tới relay tính bằng mili giây. Mặc định là `10000`.
- Các đăng ký có relay hỗ trợ được ủy quyền cho một danh tính Gateway cụ thể. Ứng dụng iOS đã ghép đôi lấy `gateway.identity.get`, bao gồm danh tính đó trong đăng ký relay, và chuyển tiếp một quyền gửi có phạm vi theo đăng ký tới Gateway. Gateway khác không thể tái sử dụng đăng ký đã lưu đó.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: override env tạm thời cho cấu hình relay ở trên.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: lối thoát chỉ dành cho phát triển với các URL relay HTTP loopback. URL relay production nên giữ HTTPS.
- `gateway.handshakeTimeoutMs`: timeout bắt tay WebSocket Gateway trước xác thực tính bằng mili giây. Mặc định: `15000`. `OPENCLAW_HANDSHAKE_TIMEOUT_MS` được ưu tiên khi được đặt. Tăng giá trị này trên các host tải cao hoặc công suất thấp, nơi client cục bộ có thể kết nối trong khi warmup khởi động vẫn đang ổn định.
- `gateway.channelHealthCheckMinutes`: khoảng thời gian health-monitor của kênh tính bằng phút. Đặt `0` để tắt khởi động lại health-monitor trên toàn cục. Mặc định: `5`.
- `gateway.channelStaleEventThresholdMinutes`: ngưỡng stale-socket tính bằng phút. Giữ giá trị này lớn hơn hoặc bằng `gateway.channelHealthCheckMinutes`. Mặc định: `30`.
- `gateway.channelMaxRestartsPerHour`: số lần khởi động lại health-monitor tối đa trên mỗi kênh/tài khoản trong một giờ trượt. Mặc định: `10`.
- `channels.<provider>.healthMonitor.enabled`: tùy chọn tắt theo từng kênh cho các lần khởi động lại health-monitor trong khi vẫn bật monitor toàn cục.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: override theo từng tài khoản cho các kênh nhiều tài khoản. Khi được đặt, nó được ưu tiên hơn override cấp kênh.
- Các đường dẫn gọi Gateway cục bộ chỉ có thể dùng `gateway.remote.*` làm fallback khi `gateway.auth.*` chưa được đặt.
- Nếu `gateway.auth.token` / `gateway.auth.password` được cấu hình rõ qua SecretRef và không phân giải được, quá trình phân giải sẽ thất bại đóng (không có fallback từ xa che lấp).
- `trustedProxies`: IP reverse proxy kết thúc TLS hoặc chèn header forwarded-client. Chỉ liệt kê các proxy bạn kiểm soát. Các mục loopback vẫn hợp lệ cho thiết lập proxy/phát hiện cục bộ cùng host (ví dụ Tailscale Serve hoặc reverse proxy cục bộ), nhưng chúng **không** làm cho các yêu cầu loopback đủ điều kiện cho `gateway.auth.mode: "trusted-proxy"`.
- `allowRealIpFallback`: khi là `true`, Gateway chấp nhận `X-Real-IP` nếu thiếu `X-Forwarded-For`. Mặc định `false` để có hành vi thất bại đóng.
- `gateway.nodes.pairing.autoApproveCidrs`: allowlist CIDR/IP tùy chọn để tự động phê duyệt ghép đôi thiết bị node lần đầu khi không có scope được yêu cầu. Nó bị tắt khi chưa đặt. Cấu hình này không tự động phê duyệt ghép đôi operator/trình duyệt/Control UI/WebChat, và không tự động phê duyệt nâng cấp vai trò, scope, metadata, hoặc public-key.
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: định hình allow/deny toàn cục cho các lệnh node đã khai báo sau khi ghép đôi và đánh giá allowlist nền tảng. Dùng `allowCommands` để chọn tham gia các lệnh node nguy hiểm như `camera.snap`, `camera.clip`, và `screen.record`; `denyCommands` loại bỏ một lệnh ngay cả khi mặc định nền tảng hoặc allow rõ ràng nếu không thì sẽ bao gồm nó. Sau khi một node thay đổi danh sách lệnh đã khai báo, hãy từ chối và phê duyệt lại ghép đôi thiết bị đó để Gateway lưu snapshot lệnh đã cập nhật.
- `gateway.tools.deny`: tên công cụ bổ sung bị chặn cho HTTP `POST /tools/invoke` (mở rộng danh sách deny mặc định).
- `gateway.tools.allow`: xóa tên công cụ khỏi danh sách deny HTTP mặc định.

</Accordion>

### Các endpoint tương thích với OpenAI

- Chat Completions: mặc định bị tắt. Bật bằng `gateway.http.endpoints.chatCompletions.enabled: true`.
- Responses API: `gateway.http.endpoints.responses.enabled`.
- Gia cố đầu vào URL cho Responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    Allowlist rỗng được xem như chưa đặt; dùng `gateway.http.endpoints.responses.files.allowUrl=false`
    và/hoặc `gateway.http.endpoints.responses.images.allowUrl=false` để tắt lấy nội dung từ URL.
- Header gia cố response tùy chọn:
  - `gateway.http.securityHeaders.strictTransportSecurity` (chỉ đặt cho các origin HTTPS bạn kiểm soát; xem [Xác thực Trusted Proxy](/vi/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### Cô lập nhiều instance

Chạy nhiều Gateway trên một host với các cổng và thư mục trạng thái riêng:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

Cờ tiện ích: `--dev` (dùng `~/.openclaw-dev` + cổng `19001`), `--profile <name>` (dùng `~/.openclaw-<name>`).

Xem [Nhiều Gateway](/vi/gateway/multiple-gateways).

### `gateway.tls`

```json5
{
  gateway: {
    tls: {
      enabled: false,
      autoGenerate: false,
      certPath: "/etc/openclaw/tls/server.crt",
      keyPath: "/etc/openclaw/tls/server.key",
      caPath: "/etc/openclaw/tls/ca-bundle.crt",
    },
  },
}
```

- `enabled`: bật kết thúc TLS tại listener Gateway (HTTPS/WSS) (mặc định: `false`).
- `autoGenerate`: tự động tạo cặp chứng chỉ/khóa tự ký cục bộ khi chưa cấu hình file rõ ràng; chỉ dùng cho cục bộ/dev.
- `certPath`: đường dẫn hệ thống file tới file chứng chỉ TLS.
- `keyPath`: đường dẫn hệ thống file tới file khóa riêng TLS; giữ hạn chế quyền truy cập.
- `caPath`: đường dẫn bundle CA tùy chọn để xác minh client hoặc chuỗi tin cậy tùy chỉnh.

### `gateway.reload`

```json5
{
  gateway: {
    reload: {
      mode: "hybrid", // off | restart | hot | hybrid
      debounceMs: 500,
      deferralTimeoutMs: 300000,
    },
  },
}
```

- `mode`: kiểm soát cách áp dụng chỉnh sửa config lúc runtime.
  - `"off"`: bỏ qua chỉnh sửa trực tiếp; thay đổi yêu cầu restart rõ ràng.
  - `"restart"`: luôn restart tiến trình Gateway khi config thay đổi.
  - `"hot"`: áp dụng thay đổi trong tiến trình mà không restart.
  - `"hybrid"` (mặc định): thử hot reload trước; fallback sang restart nếu cần.
- `debounceMs`: cửa sổ debounce tính bằng ms trước khi áp dụng thay đổi config (số nguyên không âm).
- `deferralTimeoutMs`: thời gian tối đa tùy chọn tính bằng ms để chờ các thao tác đang chạy trước khi buộc restart hoặc hot reload kênh. Bỏ qua để dùng thời gian chờ có giới hạn mặc định (`300000`); đặt `0` để chờ vô thời hạn và ghi log cảnh báo vẫn còn pending định kỳ.

---

## Các hook

```json5
{
  hooks: {
    enabled: true,
    token: "shared-secret",
    path: "/hooks",
    maxBodyBytes: 262144,
    defaultSessionKey: "hook:ingress",
    allowRequestSessionKey: true,
    allowedSessionKeyPrefixes: ["hook:", "hook:gmail:"],
    allowedAgentIds: ["hooks", "main"],
    presets: ["gmail"],
    transformsDir: "~/.openclaw/hooks/transforms",
    mappings: [
      {
        match: { path: "gmail" },
        action: "agent",
        agentId: "hooks",
        wakeMode: "now",
        name: "Gmail",
        sessionKey: "hook:gmail:{{messages[0].id}}",
        messageTemplate: "From: {{messages[0].from}}\nSubject: {{messages[0].subject}}\n{{messages[0].snippet}}",
        deliver: true,
        channel: "last",
        model: "openai/gpt-5.4-mini",
      },
    ],
  },
}
```

Xác thực: `Authorization: Bearer <token>` hoặc `x-openclaw-token: <token>`.
Token hook trong chuỗi truy vấn bị từ chối.

Ghi chú về kiểm tra hợp lệ và an toàn:

- `hooks.enabled=true` yêu cầu `hooks.token` không rỗng.
- `hooks.token` phải **khác** với `gateway.auth.token`; việc dùng lại token Gateway bị từ chối.
- `hooks.path` không được là `/`; hãy dùng một đường dẫn con chuyên dụng như `/hooks`.
- Nếu `hooks.allowRequestSessionKey=true`, hãy giới hạn `hooks.allowedSessionKeyPrefixes` (ví dụ `["hook:"]`).
- Nếu một ánh xạ hoặc preset dùng `sessionKey` dạng mẫu, hãy đặt `hooks.allowedSessionKeyPrefixes` và `hooks.allowRequestSessionKey=true`. Các khóa ánh xạ tĩnh không yêu cầu lựa chọn tham gia đó.

**Điểm cuối:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - `sessionKey` từ payload yêu cầu chỉ được chấp nhận khi `hooks.allowRequestSessionKey=true` (mặc định: `false`).
- `POST /hooks/<name>` → được phân giải qua `hooks.mappings`
  - Các giá trị `sessionKey` của ánh xạ được render từ mẫu được xem là do bên ngoài cung cấp và cũng yêu cầu `hooks.allowRequestSessionKey=true`.

<Accordion title="Chi tiết ánh xạ">

- `match.path` khớp đường dẫn con sau `/hooks` (ví dụ `/hooks/gmail` → `gmail`).
- `match.source` khớp một trường payload cho các đường dẫn chung.
- Các mẫu như `{{messages[0].subject}}` đọc từ payload.
- `transform` có thể trỏ đến một mô-đun JS/TS trả về một hành động hook.
  - `transform.module` phải là đường dẫn tương đối và nằm trong `hooks.transformsDir` (đường dẫn tuyệt đối và duyệt vượt thư mục bị từ chối).
  - Giữ `hooks.transformsDir` trong `~/.openclaw/hooks/transforms`; các thư mục Skills trong workspace bị từ chối. Nếu `openclaw doctor` báo đường dẫn này không hợp lệ, hãy di chuyển mô-đun transform vào thư mục transforms của hooks hoặc xóa `hooks.transformsDir`.
- `agentId` định tuyến đến một agent cụ thể; ID không xác định sẽ quay về mặc định.
- `allowedAgentIds`: hạn chế định tuyến tường minh (`*` hoặc bỏ qua = cho phép tất cả, `[]` = từ chối tất cả).
- `defaultSessionKey`: khóa phiên cố định tùy chọn cho các lần chạy agent hook không có `sessionKey` tường minh.
- `allowRequestSessionKey`: cho phép bên gọi `/hooks/agent` và các khóa phiên ánh xạ theo mẫu đặt `sessionKey` (mặc định: `false`).
- `allowedSessionKeyPrefixes`: danh sách cho phép tiền tố tùy chọn cho các giá trị `sessionKey` tường minh (yêu cầu + ánh xạ), ví dụ `["hook:"]`. Trường này trở thành bắt buộc khi bất kỳ ánh xạ hoặc preset nào dùng `sessionKey` dạng mẫu.
- `deliver: true` gửi phản hồi cuối cùng đến một kênh; `channel` mặc định là `last`.
- `model` ghi đè LLM cho lần chạy hook này (phải được cho phép nếu danh mục model được đặt).

</Accordion>

### Tích hợp Gmail

- Preset Gmail tích hợp sẵn dùng `sessionKey: "hook:gmail:{{messages[0].id}}"`.
- Nếu bạn giữ định tuyến theo từng tin nhắn đó, hãy đặt `hooks.allowRequestSessionKey: true` và giới hạn `hooks.allowedSessionKeyPrefixes` để khớp namespace Gmail, ví dụ `["hook:", "hook:gmail:"]`.
- Nếu bạn cần `hooks.allowRequestSessionKey: false`, hãy ghi đè preset bằng một `sessionKey` tĩnh thay vì mặc định dạng mẫu.

```json5
{
  hooks: {
    gmail: {
      account: "openclaw@gmail.com",
      topic: "projects/<project-id>/topics/gog-gmail-watch",
      subscription: "gog-gmail-watch-push",
      pushToken: "shared-push-token",
      hookUrl: "http://127.0.0.1:18789/hooks/gmail",
      includeBody: true,
      maxBytes: 20000,
      renewEveryMinutes: 720,
      serve: { bind: "127.0.0.1", port: 8788, path: "/" },
      tailscale: { mode: "funnel", path: "/gmail-pubsub" },
      model: "openrouter/meta-llama/llama-3.3-70b-instruct:free",
      thinking: "off",
    },
  },
}
```

- Gateway tự động khởi động `gog gmail watch serve` khi khởi động nếu đã được cấu hình. Đặt `OPENCLAW_SKIP_GMAIL_WATCHER=1` để tắt.
- Đừng chạy một `gog gmail watch serve` riêng biệt cùng với Gateway.

---

## Máy chủ Plugin Canvas

```json5
{
  plugins: {
    entries: {
      canvas: {
        config: {
          host: {
            root: "~/.openclaw/workspace/canvas",
            liveReload: true,
            // enabled: false, // or OPENCLAW_SKIP_CANVAS_HOST=1
          },
        },
      },
    },
  },
}
```

- Phục vụ HTML/CSS/JS mà agent có thể chỉnh sửa và A2UI qua HTTP dưới cổng Gateway:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- Chỉ cục bộ: giữ `gateway.bind: "loopback"` (mặc định).
- Các bind không phải loopback: tuyến canvas yêu cầu xác thực Gateway (token/password/trusted-proxy), giống như các bề mặt HTTP Gateway khác.
- Node WebViews thường không gửi header xác thực; sau khi một node được ghép đôi và kết nối, Gateway quảng bá các URL capability theo phạm vi node để truy cập canvas/A2UI.
- URL capability được ràng buộc với phiên WS node đang hoạt động và hết hạn nhanh. Không dùng fallback dựa trên IP.
- Chèn client tải lại trực tiếp vào HTML được phục vụ.
- Tự động tạo `index.html` khởi đầu khi trống.
- Cũng phục vụ A2UI tại `/__openclaw__/a2ui/`.
- Các thay đổi yêu cầu khởi động lại gateway.
- Tắt tải lại trực tiếp cho thư mục lớn hoặc lỗi `EMFILE`.

---

## Khám phá

### mDNS (Bonjour)

```json5
{
  discovery: {
    mdns: {
      mode: "minimal", // minimal | full | off
    },
  },
}
```

- `minimal` (mặc định khi Plugin `bonjour` đi kèm được bật): bỏ qua `cliPath` + `sshPort` khỏi bản ghi TXT.
- `full`: bao gồm `cliPath` + `sshPort`; quảng bá multicast LAN vẫn yêu cầu Plugin `bonjour` đi kèm được bật.
- `off`: tắt quảng bá multicast LAN mà không thay đổi trạng thái bật Plugin.
- Plugin `bonjour` đi kèm tự động khởi động trên máy chủ macOS và là tùy chọn bật trên Linux, Windows, và các triển khai Gateway trong container.
- Tên máy chủ mặc định là hostname của hệ thống khi đó là nhãn DNS hợp lệ, nếu không thì dùng `openclaw`. Ghi đè bằng `OPENCLAW_MDNS_HOSTNAME`.

### Diện rộng (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

Ghi một vùng DNS-SD unicast trong `~/.openclaw/dns/`. Để khám phá xuyên mạng, hãy ghép với một máy chủ DNS (khuyến nghị CoreDNS) + DNS phân tách Tailscale.

Thiết lập: `openclaw dns setup --apply`.

---

## Môi trường

### `env` (biến môi trường nội tuyến)

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: {
      GROQ_API_KEY: "gsk-...",
    },
    shellEnv: {
      enabled: true,
      timeoutMs: 15000,
    },
  },
}
```

- Biến môi trường nội tuyến chỉ được áp dụng nếu env của tiến trình thiếu khóa đó.
- Tệp `.env`: CWD `.env` + `~/.openclaw/.env` (không tệp nào ghi đè các biến hiện có).
- `shellEnv`: nhập các khóa dự kiến còn thiếu từ hồ sơ shell đăng nhập của bạn.
- Xem [Môi trường](/vi/help/environment) để biết đầy đủ thứ tự ưu tiên.

### Thay thế biến môi trường

Tham chiếu biến môi trường trong bất kỳ chuỗi cấu hình nào bằng `${VAR_NAME}`:

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- Chỉ khớp tên viết hoa: `[A-Z_][A-Z0-9_]*`.
- Biến bị thiếu/rỗng sẽ phát sinh lỗi khi tải cấu hình.
- Thoát bằng `$${VAR}` để biểu diễn nguyên văn `${VAR}`.
- Hoạt động với `$include`.

---

## Bí mật

Tham chiếu bí mật có tính bổ sung: giá trị văn bản thuần vẫn hoạt động.

### `SecretRef`

Dùng một dạng đối tượng:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

Xác thực:

- Mẫu `provider`: `^[a-z][a-z0-9_-]{0,63}$`
- Mẫu id `source: "env"`: `^[A-Z][A-Z0-9_]{0,127}$`
- id `source: "file"`: con trỏ JSON tuyệt đối (ví dụ `"/providers/openai/apiKey"`)
- Mẫu id `source: "exec"`: `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- id `source: "exec"` không được chứa các đoạn đường dẫn phân tách bằng dấu gạch chéo là `.` hoặc `..` (ví dụ `a/../b` bị từ chối)

### Bề mặt thông tin xác thực được hỗ trợ

- Ma trận chuẩn: [Bề mặt thông tin xác thực SecretRef](/vi/reference/secretref-credential-surface)
- `secrets apply` nhắm đến các đường dẫn thông tin xác thực `openclaw.json` được hỗ trợ.
- Tham chiếu `auth-profiles.json` được bao gồm trong quá trình phân giải runtime và phạm vi kiểm toán.

### Cấu hình nhà cung cấp bí mật

```json5
{
  secrets: {
    providers: {
      default: { source: "env" }, // nhà cung cấp env rõ ràng tùy chọn
      filemain: {
        source: "file",
        path: "~/.openclaw/secrets.json",
        mode: "json",
        timeoutMs: 5000,
      },
      vault: {
        source: "exec",
        command: "/usr/local/bin/openclaw-vault-resolver",
        passEnv: ["PATH", "VAULT_ADDR"],
      },
    },
    defaults: {
      env: "default",
      file: "filemain",
      exec: "vault",
    },
  },
}
```

Ghi chú:

- Nhà cung cấp `file` hỗ trợ `mode: "json"` và `mode: "singleValue"` (`id` phải là `"value"` trong chế độ singleValue).
- Đường dẫn của nhà cung cấp file và exec sẽ đóng an toàn khi không thể xác minh ACL Windows. Chỉ đặt `allowInsecurePath: true` cho các đường dẫn đáng tin cậy nhưng không thể xác minh.
- Nhà cung cấp `exec` yêu cầu đường dẫn `command` tuyệt đối và dùng payload giao thức trên stdin/stdout.
- Theo mặc định, đường dẫn lệnh symlink bị từ chối. Đặt `allowSymlinkCommand: true` để cho phép đường dẫn symlink trong khi vẫn xác thực đường dẫn đích đã phân giải.
- Nếu `trustedDirs` được cấu hình, kiểm tra thư mục đáng tin cậy áp dụng cho đường dẫn đích đã phân giải.
- Môi trường tiến trình con `exec` mặc định là tối thiểu; truyền rõ ràng các biến bắt buộc bằng `passEnv`.
- Tham chiếu bí mật được phân giải tại thời điểm kích hoạt thành một ảnh chụp nhanh trong bộ nhớ, sau đó các đường dẫn yêu cầu chỉ đọc ảnh chụp nhanh đó.
- Lọc bề mặt đang hoạt động áp dụng trong quá trình kích hoạt: tham chiếu chưa phân giải trên các bề mặt đã bật khiến khởi động/tải lại thất bại, còn các bề mặt không hoạt động được bỏ qua kèm chẩn đoán.

---

## Lưu trữ xác thực

```json5
{
  auth: {
    profiles: {
      "anthropic:default": { provider: "anthropic", mode: "api_key" },
      "anthropic:work": { provider: "anthropic", mode: "api_key" },
      "openai-codex:personal": { provider: "openai-codex", mode: "oauth" },
    },
    order: {
      anthropic: ["anthropic:default", "anthropic:work"],
      "openai-codex": ["openai-codex:personal"],
    },
  },
}
```

- Hồ sơ theo tác tử được lưu tại `<agentDir>/auth-profiles.json`.
- `auth-profiles.json` hỗ trợ tham chiếu cấp giá trị (`keyRef` cho `api_key`, `tokenRef` cho `token`) đối với các chế độ thông tin xác thực tĩnh.
- Các ánh xạ phẳng `auth-profiles.json` cũ như `{ "provider": { "apiKey": "..." } }` không phải là định dạng runtime; `openclaw doctor --fix` viết lại chúng thành hồ sơ khóa API `provider:default` chuẩn với bản sao lưu `.legacy-flat.*.bak`.
- Hồ sơ chế độ OAuth (`auth.profiles.<id>.mode = "oauth"`) không hỗ trợ thông tin xác thực hồ sơ xác thực được hậu thuẫn bởi SecretRef.
- Thông tin xác thực runtime tĩnh đến từ các ảnh chụp nhanh đã phân giải trong bộ nhớ; các mục `auth.json` tĩnh cũ sẽ được dọn sạch khi được phát hiện.
- Nhập OAuth cũ từ `~/.openclaw/credentials/oauth.json`.
- Xem [OAuth](/vi/concepts/oauth).
- Hành vi runtime của bí mật và công cụ `audit/configure/apply`: [Quản lý bí mật](/vi/gateway/secrets).

### `auth.cooldowns`

```json5
{
  auth: {
    cooldowns: {
      billingBackoffHours: 5,
      billingBackoffHoursByProvider: { anthropic: 3, openai: 8 },
      billingMaxHours: 24,
      authPermanentBackoffMinutes: 10,
      authPermanentMaxMinutes: 60,
      failureWindowHours: 24,
      overloadedProfileRotations: 1,
      overloadedBackoffMs: 0,
      rateLimitedProfileRotations: 1,
    },
  },
}
```

- `billingBackoffHours`: thời gian lùi cơ sở tính bằng giờ khi một hồ sơ thất bại do lỗi thanh toán/không đủ tín dụng thực sự (mặc định: `5`). Văn bản thanh toán rõ ràng vẫn có thể được xếp vào đây ngay cả trên phản hồi `401`/`403`, nhưng các bộ khớp văn bản theo từng nhà cung cấp vẫn chỉ nằm trong phạm vi nhà cung cấp sở hữu chúng (ví dụ OpenRouter `Key limit exceeded`). Các thông báo HTTP `402` có thể thử lại về cửa sổ sử dụng hoặc giới hạn chi tiêu của tổ chức/không gian làm việc vẫn đi theo đường dẫn `rate_limit`.
- `billingBackoffHoursByProvider`: ghi đè tùy chọn theo từng nhà cung cấp cho số giờ lùi thanh toán.
- `billingMaxHours`: giới hạn tính bằng giờ cho tăng trưởng lũy thừa của lùi thanh toán (mặc định: `24`).
- `authPermanentBackoffMinutes`: thời gian lùi cơ sở tính bằng phút cho các lỗi `auth_permanent` có độ tin cậy cao (mặc định: `10`).
- `authPermanentMaxMinutes`: giới hạn tính bằng phút cho tăng trưởng lùi `auth_permanent` (mặc định: `60`).
- `failureWindowHours`: cửa sổ trượt tính bằng giờ dùng cho bộ đếm lùi (mặc định: `24`).
- `overloadedProfileRotations`: số lần xoay vòng hồ sơ xác thực cùng nhà cung cấp tối đa cho lỗi quá tải trước khi chuyển sang dự phòng mô hình (mặc định: `1`). Các dạng nhà cung cấp bận như `ModelNotReadyException` được xếp vào đây.
- `overloadedBackoffMs`: độ trễ cố định trước khi thử lại một lần xoay vòng nhà cung cấp/hồ sơ bị quá tải (mặc định: `0`).
- `rateLimitedProfileRotations`: số lần xoay vòng hồ sơ xác thực cùng nhà cung cấp tối đa cho lỗi giới hạn tốc độ trước khi chuyển sang dự phòng mô hình (mặc định: `1`). Nhóm giới hạn tốc độ đó bao gồm văn bản theo dạng nhà cung cấp như `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded`, và `resource exhausted`.

---

## Ghi nhật ký

```json5
{
  logging: {
    level: "info",
    file: "/tmp/openclaw/openclaw.log",
    consoleLevel: "info",
    consoleStyle: "pretty", // pretty | compact | json
    redactSensitive: "tools", // off | tools
    redactPatterns: ["\\bTOKEN\\b\\s*[=:]\\s*([\"']?)([^\\s\"']+)\\1"],
  },
}
```

- Tệp nhật ký mặc định: `/tmp/openclaw/openclaw-YYYY-MM-DD.log`.
- Đặt `logging.file` để có đường dẫn ổn định.
- `consoleLevel` tăng lên `debug` khi có `--verbose`.
- `maxFileBytes`: kích thước tệp nhật ký đang hoạt động tối đa tính bằng byte trước khi xoay vòng (số nguyên dương; mặc định: `104857600` = 100 MB). OpenClaw giữ tối đa năm bản lưu trữ được đánh số bên cạnh tệp đang hoạt động.
- `redactSensitive` / `redactPatterns`: che giấu theo khả năng tốt nhất cho đầu ra bảng điều khiển, nhật ký tệp, bản ghi nhật ký OTLP và văn bản bản ghi phiên được lưu. `redactSensitive: "off"` chỉ tắt chính sách nhật ký/bản ghi chung này; các bề mặt an toàn UI/công cụ/chẩn đoán vẫn biên tập bí mật trước khi phát ra.

---

## Chẩn đoán

```json5
{
  diagnostics: {
    enabled: true,
    flags: ["telegram.*"],
    stuckSessionWarnMs: 30000,
    stuckSessionAbortMs: 600000,

    otel: {
      enabled: false,
      endpoint: "https://otel-collector.example.com:4318",
      tracesEndpoint: "https://traces.example.com/v1/traces",
      metricsEndpoint: "https://metrics.example.com/v1/metrics",
      logsEndpoint: "https://logs.example.com/v1/logs",
      protocol: "http/protobuf", // http/protobuf | grpc
      headers: { "x-tenant-id": "my-org" },
      serviceName: "openclaw-gateway",
      traces: true,
      metrics: true,
      logs: false,
      sampleRate: 1.0,
      flushIntervalMs: 5000,
      captureContent: {
        enabled: false,
        inputMessages: false,
        outputMessages: false,
        toolInputs: false,
        toolOutputs: false,
        systemPrompt: false,
      },
    },

    cacheTrace: {
      enabled: false,
      filePath: "~/.openclaw/logs/cache-trace.jsonl",
      includeMessages: true,
      includePrompt: true,
      includeSystem: true,
    },
  },
}
```

- `enabled`: công tắc chính cho đầu ra đo lường (mặc định: `true`).
- `flags`: mảng chuỗi cờ bật đầu ra nhật ký có mục tiêu (hỗ trợ ký tự đại diện như `"telegram.*"` hoặc `"*"`).
- `stuckSessionWarnMs`: ngưỡng tuổi không có tiến triển tính bằng ms để phân loại các phiên xử lý chạy lâu là `session.long_running`, `session.stalled`, hoặc `session.stuck`. Phản hồi, công cụ, trạng thái, khối và tiến trình ACP đặt lại bộ hẹn giờ; chẩn đoán `session.stuck` lặp lại sẽ lùi lại khi không thay đổi.
- `stuckSessionAbortMs`: ngưỡng tuổi không có tiến triển tính bằng ms trước khi công việc đang hoạt động bị kẹt đủ điều kiện có thể được hủy và xả để khôi phục. Khi chưa đặt, OpenClaw dùng cửa sổ chạy nhúng mở rộng an toàn hơn, ít nhất 10 phút và 5x `stuckSessionWarnMs`.
- `otel.enabled`: bật pipeline xuất OpenTelemetry (mặc định: `false`). Để xem cấu hình đầy đủ, danh mục tín hiệu và mô hình quyền riêng tư, xem [xuất OpenTelemetry](/vi/gateway/opentelemetry).
- `otel.endpoint`: URL collector cho xuất OTel.
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`: các endpoint OTLP tùy chọn theo từng tín hiệu. Khi được đặt, chúng ghi đè `otel.endpoint` chỉ cho tín hiệu đó.
- `otel.protocol`: `"http/protobuf"` (mặc định) hoặc `"grpc"`.
- `otel.headers`: các header metadata HTTP/gRPC bổ sung được gửi cùng yêu cầu xuất OTel.
- `otel.serviceName`: tên dịch vụ cho thuộc tính tài nguyên.
- `otel.traces` / `otel.metrics` / `otel.logs`: bật xuất trace, metrics hoặc log.
- `otel.sampleRate`: tỷ lệ lấy mẫu trace `0`-`1`.
- `otel.flushIntervalMs`: khoảng thời gian xả telemetry định kỳ tính bằng ms.
- `otel.captureContent`: bật tùy chọn thu thập nội dung thô cho thuộc tính span OTEL. Mặc định là tắt. Boolean `true` thu thập nội dung tin nhắn/công cụ không thuộc hệ thống; dạng đối tượng cho phép bạn bật rõ ràng `inputMessages`, `outputMessages`, `toolInputs`, `toolOutputs`, và `systemPrompt`.
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`: công tắc môi trường cho các thuộc tính nhà cung cấp span GenAI thử nghiệm mới nhất. Theo mặc định, span giữ thuộc tính `gen_ai.system` cũ để tương thích; metrics GenAI dùng các thuộc tính ngữ nghĩa có giới hạn.
- `OPENCLAW_OTEL_PRELOADED=1`: công tắc môi trường cho host đã đăng ký SDK OpenTelemetry toàn cục. Khi đó OpenClaw bỏ qua khởi động/tắt SDK do Plugin sở hữu trong khi vẫn giữ các listener chẩn đoán hoạt động.
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`, `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT`, và `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`: biến môi trường endpoint theo từng tín hiệu được dùng khi khóa cấu hình tương ứng chưa được đặt.
- `cacheTrace.enabled`: ghi nhật ký snapshot trace bộ nhớ đệm cho các lần chạy nhúng (mặc định: `false`).
- `cacheTrace.filePath`: đường dẫn đầu ra cho cache trace JSONL (mặc định: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`).
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: kiểm soát nội dung được đưa vào đầu ra cache trace (tất cả mặc định: `true`).

---

## Cập nhật

```json5
{
  update: {
    channel: "stable", // stable | beta | dev
    checkOnStart: true,

    auto: {
      enabled: false,
      stableDelayHours: 6,
      stableJitterHours: 12,
      betaCheckIntervalHours: 1,
    },
  },
}
```

- `channel`: kênh phát hành cho cài đặt npm/git - `"stable"`, `"beta"`, hoặc `"dev"`.
- `checkOnStart`: kiểm tra cập nhật npm khi gateway khởi động (mặc định: `true`).
- `auto.enabled`: bật tự động cập nhật nền cho cài đặt gói (mặc định: `false`).
- `auto.stableDelayHours`: độ trễ tối thiểu tính bằng giờ trước khi tự động áp dụng kênh stable (mặc định: `6`; tối đa: `168`).
- `auto.stableJitterHours`: cửa sổ phân bổ triển khai bổ sung của kênh stable tính bằng giờ (mặc định: `12`; tối đa: `168`).
- `auto.betaCheckIntervalHours`: tần suất chạy kiểm tra kênh beta tính bằng giờ (mặc định: `1`; tối đa: `24`).

---

## ACP

```json5
{
  acp: {
    enabled: true,
    dispatch: { enabled: true },
    backend: "acpx",
    defaultAgent: "main",
    allowedAgents: ["main", "ops"],
    maxConcurrentSessions: 10,

    stream: {
      coalesceIdleMs: 50,
      maxChunkChars: 1000,
      repeatSuppression: true,
      deliveryMode: "live", // live | final_only
      hiddenBoundarySeparator: "paragraph", // none | space | newline | paragraph
      maxOutputChars: 50000,
      maxSessionUpdateChars: 500,
    },

    runtime: {
      ttlMinutes: 30,
    },
  },
}
```

- `enabled`: cổng tính năng ACP toàn cục (mặc định: `true`; đặt `false` để ẩn dispatch ACP và các khả năng spawn).
- `dispatch.enabled`: cổng độc lập cho dispatch lượt phiên ACP (mặc định: `true`). Đặt `false` để giữ lệnh ACP khả dụng trong khi chặn thực thi.
- `backend`: id backend runtime ACP mặc định (phải khớp với một Plugin runtime ACP đã đăng ký).
  Cài đặt Plugin backend trước, và nếu `plugins.allow` được đặt, hãy bao gồm id Plugin backend (ví dụ `acpx`) nếu không backend ACP sẽ không tải.
- `defaultAgent`: id agent mục tiêu ACP dự phòng khi spawn không chỉ định mục tiêu rõ ràng.
- `allowedAgents`: danh sách cho phép các id agent được phép dùng cho phiên runtime ACP; rỗng nghĩa là không có hạn chế bổ sung.
- `maxConcurrentSessions`: số phiên ACP đang hoạt động đồng thời tối đa.
- `stream.coalesceIdleMs`: cửa sổ xả khi nhàn rỗi tính bằng ms cho văn bản được stream.
- `stream.maxChunkChars`: kích thước chunk tối đa trước khi chia projection khối được stream.
- `stream.repeatSuppression`: chặn các dòng trạng thái/công cụ lặp lại trên mỗi lượt (mặc định: `true`).
- `stream.deliveryMode`: `"live"` stream tăng dần; `"final_only"` đệm cho đến các sự kiện kết thúc lượt.
- `stream.hiddenBoundarySeparator`: dấu phân cách trước văn bản hiển thị sau các sự kiện công cụ ẩn (mặc định: `"paragraph"`).
- `stream.maxOutputChars`: số ký tự đầu ra assistant tối đa được chiếu mỗi lượt ACP.
- `stream.maxSessionUpdateChars`: số ký tự tối đa cho các dòng trạng thái/cập nhật ACP được chiếu.
- `stream.tagVisibility`: bản ghi tên tag tới các ghi đè hiển thị boolean cho sự kiện được stream.
- `runtime.ttlMinutes`: TTL nhàn rỗi tính bằng phút cho worker phiên ACP trước khi đủ điều kiện dọn dẹp.
- `runtime.installCommand`: lệnh cài đặt tùy chọn để chạy khi khởi tạo môi trường runtime ACP.

---

## CLI

```json5
{
  cli: {
    banner: {
      taglineMode: "off", // random | default | off
    },
  },
}
```

- `cli.banner.taglineMode` kiểm soát kiểu tagline của banner:
  - `"random"` (mặc định): các tagline hài hước/theo mùa luân phiên.
  - `"default"`: tagline trung tính cố định (`All your chats, one OpenClaw.`).
  - `"off"`: không có văn bản tagline (tiêu đề/phiên bản banner vẫn hiển thị).
- Để ẩn toàn bộ banner (không chỉ tagline), đặt env `OPENCLAW_HIDE_BANNER=1`.

---

## Trình hướng dẫn

Metadata do các luồng thiết lập có hướng dẫn của CLI ghi (`onboard`, `configure`, `doctor`):

```json5
{
  wizard: {
    lastRunAt: "2026-01-01T00:00:00.000Z",
    lastRunVersion: "2026.1.4",
    lastRunCommit: "abc1234",
    lastRunCommand: "configure",
    lastRunMode: "local",
  },
}
```

---

## Danh tính

Xem các trường danh tính `agents.list` trong [Mặc định của agent](/vi/gateway/config-agents#agent-defaults).

---

## Bridge (cũ, đã gỡ bỏ)

Các bản dựng hiện tại không còn bao gồm TCP bridge. Node kết nối qua Gateway WebSocket. Các khóa `bridge.*` không còn là một phần của schema cấu hình (xác thực thất bại cho đến khi bị gỡ bỏ; `openclaw doctor --fix` có thể loại bỏ các khóa không xác định).

<Accordion title="Cấu hình bridge cũ (tham chiếu lịch sử)">

```json
{
  "bridge": {
    "enabled": true,
    "port": 18790,
    "bind": "tailnet",
    "tls": {
      "enabled": true,
      "autoGenerate": true
    }
  }
}
```

</Accordion>

---

## Cron

```json5
{
  cron: {
    enabled: true,
    maxConcurrentRuns: 2, // cron dispatch + isolated cron agent-turn execution
    webhook: "https://example.invalid/legacy", // deprecated fallback for stored notify:true jobs
    webhookToken: "replace-with-dedicated-token", // optional bearer token for outbound webhook auth
    sessionRetention: "24h", // duration string or false
    runLog: {
      maxBytes: "2mb", // default 2_000_000 bytes
      keepLines: 2000, // default 2000
    },
  },
}
```

- `sessionRetention`: thời gian giữ các phiên chạy cron cô lập đã hoàn tất trước khi cắt tỉa khỏi `sessions.json`. Cũng kiểm soát việc dọn dẹp bản ghi cron đã lưu trữ bị xóa. Mặc định: `24h`; đặt `false` để tắt.
- `runLog.maxBytes`: kích thước tối đa cho mỗi tệp nhật ký chạy (`cron/runs/<jobId>.jsonl`) trước khi cắt tỉa. Mặc định: `2_000_000` byte.
- `runLog.keepLines`: các dòng mới nhất được giữ lại khi kích hoạt cắt tỉa nhật ký chạy. Mặc định: `2000`.
- `webhookToken`: bearer token dùng cho việc gửi POST Webhook cron (`delivery.mode = "webhook"`), nếu bỏ qua thì không gửi header xác thực.
- `webhook`: URL Webhook dự phòng cũ đã ngừng khuyến nghị (http/https), chỉ dùng cho các job đã lưu vẫn có `notify: true`.

### `cron.retry`

```json5
{
  cron: {
    retry: {
      maxAttempts: 3,
      backoffMs: [30000, 60000, 300000],
      retryOn: ["rate_limit", "overloaded", "network", "timeout", "server_error"],
    },
  },
}
```

- `maxAttempts`: số lần thử lại tối đa cho job chạy một lần khi gặp lỗi tạm thời (mặc định: `3`; phạm vi: `0`-`10`).
- `backoffMs`: mảng độ trễ backoff tính bằng ms cho mỗi lần thử lại (mặc định: `[30000, 60000, 300000]`; 1-10 mục).
- `retryOn`: các loại lỗi kích hoạt thử lại - `"rate_limit"`, `"overloaded"`, `"network"`, `"timeout"`, `"server_error"`. Bỏ qua để thử lại tất cả các loại tạm thời.

Chỉ áp dụng cho job cron chạy một lần. Job định kỳ dùng cơ chế xử lý lỗi riêng.

### `cron.failureAlert`

```json5
{
  cron: {
    failureAlert: {
      enabled: false,
      after: 3,
      cooldownMs: 3600000,
      includeSkipped: false,
      mode: "announce",
      accountId: "main",
    },
  },
}
```

- `enabled`: bật cảnh báo lỗi cho job cron (mặc định: `false`).
- `after`: số lỗi liên tiếp trước khi phát cảnh báo (số nguyên dương, tối thiểu: `1`).
- `cooldownMs`: số mili giây tối thiểu giữa các cảnh báo lặp lại cho cùng một job (số nguyên không âm).
- `includeSkipped`: tính các lần chạy bị bỏ qua liên tiếp vào ngưỡng cảnh báo (mặc định: `false`). Các lần chạy bị bỏ qua được theo dõi riêng và không ảnh hưởng đến backoff lỗi thực thi.
- `mode`: chế độ gửi - `"announce"` gửi qua tin nhắn kênh; `"webhook"` đăng lên Webhook đã cấu hình.
- `accountId`: tài khoản hoặc id kênh tùy chọn để giới hạn phạm vi gửi cảnh báo.

### `cron.failureDestination`

```json5
{
  cron: {
    failureDestination: {
      mode: "announce",
      channel: "last",
      to: "channel:C1234567890",
      accountId: "main",
    },
  },
}
```

- Đích mặc định cho thông báo lỗi cron trên tất cả job.
- `mode`: `"announce"` hoặc `"webhook"`; mặc định là `"announce"` khi có đủ dữ liệu đích.
- `channel`: ghi đè kênh cho việc gửi announce. `"last"` dùng lại kênh gửi đã biết gần nhất.
- `to`: đích announce rõ ràng hoặc URL Webhook. Bắt buộc cho chế độ Webhook.
- `accountId`: ghi đè tài khoản tùy chọn cho việc gửi.
- `delivery.failureDestination` theo từng job ghi đè mặc định toàn cục này.
- Khi không đặt đích lỗi toàn cục hoặc theo job, các job đã gửi qua `announce` sẽ dùng lại đích announce chính đó khi lỗi.
- `delivery.failureDestination` chỉ được hỗ trợ cho job `sessionTarget="isolated"` trừ khi `delivery.mode` chính của job là `"webhook"`.

Xem [Job Cron](/vi/automation/cron-jobs). Các lần thực thi cron cô lập được theo dõi như [tác vụ nền](/vi/automation/tasks).

---

## Biến mẫu mô hình phương tiện

Các placeholder mẫu được mở rộng trong `tools.media.models[].args`:

| Biến               | Mô tả                                             |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | Nội dung đầy đủ của tin nhắn đến                  |
| `{{RawBody}}`      | Nội dung thô (không có wrapper lịch sử/người gửi) |
| `{{BodyStripped}}` | Nội dung đã loại bỏ nhắc đến nhóm                 |
| `{{From}}`         | Định danh người gửi                               |
| `{{To}}`           | Định danh đích                                    |
| `{{MessageSid}}`   | id tin nhắn kênh                                  |
| `{{SessionId}}`    | UUID phiên hiện tại                               |
| `{{IsNewSession}}` | `"true"` khi tạo phiên mới                        |
| `{{MediaUrl}}`     | pseudo-URL phương tiện đến                        |
| `{{MediaPath}}`    | đường dẫn phương tiện cục bộ                      |
| `{{MediaType}}`    | loại phương tiện (hình ảnh/âm thanh/tài liệu/…)   |
| `{{Transcript}}`   | bản chép lời âm thanh                             |
| `{{Prompt}}`       | prompt phương tiện đã phân giải cho mục CLI       |
| `{{MaxChars}}`     | số ký tự đầu ra tối đa đã phân giải cho mục CLI   |
| `{{ChatType}}`     | `"direct"` hoặc `"group"`                         |
| `{{GroupSubject}}` | chủ đề nhóm (nỗ lực tối đa)                       |
| `{{GroupMembers}}` | bản xem trước thành viên nhóm (nỗ lực tối đa)     |
| `{{SenderName}}`   | tên hiển thị của người gửi (nỗ lực tối đa)        |
| `{{SenderE164}}`   | số điện thoại người gửi (nỗ lực tối đa)           |
| `{{Provider}}`     | gợi ý nhà cung cấp (whatsapp, telegram, discord, v.v.) |

---

## Bao gồm cấu hình (`$include`)

Chia cấu hình thành nhiều tệp:

```json5
// ~/.openclaw/openclaw.json
{
  gateway: { port: 18789 },
  agents: { $include: "./agents.json5" },
  broadcast: {
    $include: ["./clients/mueller.json5", "./clients/schmidt.json5"],
  },
}
```

**Hành vi gộp:**

- Một tệp: thay thế đối tượng chứa nó.
- Mảng tệp: deep-merge theo thứ tự (mục sau ghi đè mục trước).
- Khóa ngang hàng: được gộp sau các include (ghi đè giá trị được include).
- Include lồng nhau: sâu tối đa 10 cấp.
- Đường dẫn: được phân giải tương đối với tệp đang include, nhưng phải nằm trong thư mục cấu hình cấp cao nhất (`dirname` của `openclaw.json`). Dạng tuyệt đối/`../` chỉ được phép khi vẫn phân giải vào bên trong ranh giới đó.
- Các thao tác ghi do OpenClaw sở hữu chỉ thay đổi một phần cấp cao nhất được hỗ trợ bởi include một tệp sẽ ghi xuyên qua tệp được include đó. Ví dụ, `plugins install` cập nhật `plugins: { $include: "./plugins.json5" }` trong `plugins.json5` và giữ nguyên `openclaw.json`.
- Include gốc, mảng include, và include có ghi đè khóa ngang hàng là chỉ đọc đối với các thao tác ghi do OpenClaw sở hữu; các thao tác ghi đó thất bại đóng thay vì làm phẳng cấu hình.
- Lỗi: thông báo rõ ràng cho tệp bị thiếu, lỗi phân tích cú pháp, và include vòng.

---

_Liên quan: [Cấu hình](/vi/gateway/configuration) · [Ví dụ cấu hình](/vi/gateway/configuration-examples) · [Doctor](/vi/gateway/doctor)_

## Liên quan

- [Cấu hình](/vi/gateway/configuration)
- [Ví dụ cấu hình](/vi/gateway/configuration-examples)
