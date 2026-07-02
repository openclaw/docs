---
read_when:
    - Bạn cần ngữ nghĩa cấu hình hoặc giá trị mặc định chính xác ở cấp trường
    - Bạn đang xác thực các khối cấu hình kênh, mô hình, gateway hoặc công cụ
summary: Tài liệu tham chiếu cấu hình Gateway cho các khóa lõi của OpenClaw, giá trị mặc định và liên kết đến các tài liệu tham chiếu chuyên biệt cho hệ thống con
title: Tham chiếu cấu hình
x-i18n:
    generated_at: "2026-07-02T08:28:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b1d31c4c35f216480f4536a57bca50558a8d19dcf57dcf30be9033555c019d72
    source_path: gateway/configuration-reference.md
    workflow: 16
---

Tham chiếu cấu hình lõi cho `~/.openclaw/openclaw.json`. Để xem tổng quan theo tác vụ, hãy xem [Cấu hình](/vi/gateway/configuration).

Bao quát các bề mặt cấu hình chính của OpenClaw và liên kết ra ngoài khi một hệ thống con có tham chiếu chuyên sâu riêng. Danh mục lệnh do kênh và Plugin sở hữu, cùng các tùy chọn chuyên sâu về bộ nhớ/QMD, nằm trên các trang riêng thay vì trang này.

Sự thật từ mã nguồn:

- `openclaw config schema` in JSON Schema trực tiếp dùng cho xác thực và Control UI, với siêu dữ liệu đi kèm/Plugin/kênh được hợp nhất khi có
- `config.schema.lookup` trả về một nút schema theo phạm vi đường dẫn cho công cụ đi sâu
- `pnpm config:docs:check` / `pnpm config:docs:gen` xác thực hàm băm đường cơ sở tài liệu cấu hình so với bề mặt schema hiện tại

Đường dẫn tra cứu của agent: dùng thao tác công cụ `gateway` `config.schema.lookup` để
lấy tài liệu và ràng buộc chính xác ở cấp trường trước khi chỉnh sửa. Dùng
[Cấu hình](/vi/gateway/configuration) để xem hướng dẫn theo tác vụ và trang này
để xem bản đồ trường rộng hơn, giá trị mặc định và liên kết đến tham chiếu hệ thống con.

Các tham chiếu chuyên sâu riêng:

- [Tham chiếu cấu hình bộ nhớ](/vi/reference/memory-config) cho `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations`, và cấu hình dreaming trong `plugins.entries.memory-core.config.dreaming`
- [Lệnh gạch chéo](/vi/tools/slash-commands) cho danh mục lệnh tích hợp + đi kèm hiện tại
- các trang kênh/Plugin sở hữu cho bề mặt lệnh theo kênh

Định dạng cấu hình là **JSON5** (cho phép chú thích + dấu phẩy cuối). Tất cả trường đều là tùy chọn - OpenClaw dùng giá trị mặc định an toàn khi bỏ qua.

---

## Kênh

Các khóa cấu hình theo kênh đã chuyển sang một trang riêng - xem
[Cấu hình - kênh](/vi/gateway/config-channels) cho `channels.*`,
bao gồm Slack, Discord, Telegram, WhatsApp, Matrix, iMessage, và các kênh
đi kèm khác (xác thực, kiểm soát truy cập, đa tài khoản, cổng mention).

## Giá trị mặc định của agent, đa agent, phiên và tin nhắn

Đã chuyển sang một trang riêng - xem
[Cấu hình - agent](/vi/gateway/config-agents) cho:

- `agents.defaults.*` (workspace, model, thinking, heartbeat, bộ nhớ, phương tiện, skills, sandbox)
- `multiAgent.*` (định tuyến và liên kết đa agent)
- `session.*` (vòng đời phiên, compaction, cắt tỉa)
- `messages.*` (phân phối tin nhắn, TTS, kết xuất markdown)
- `talk.*` (chế độ Talk)
  - `talk.consultThinkingLevel`: ghi đè mức thinking cho toàn bộ lượt chạy agent OpenClaw phía sau các phiên tư vấn thời gian thực của Control UI Talk
  - `talk.consultFastMode`: ghi đè chế độ nhanh một lần cho các phiên tư vấn thời gian thực của Control UI Talk
  - `talk.speechLocale`: id locale BCP 47 tùy chọn cho nhận dạng giọng nói Talk trên iOS/macOS
  - `talk.silenceTimeoutMs`: khi chưa đặt, Talk giữ cửa sổ tạm dừng mặc định của nền tảng trước khi gửi transcript (`700 ms on macOS and Android, 900 ms on iOS`)
  - `talk.realtime.consultRouting`: phương án dự phòng chuyển tiếp Gateway cho transcript Talk thời gian thực đã hoàn tất và bỏ qua `openclaw_agent_consult`

## Công cụ và nhà cung cấp tùy chỉnh

Chính sách công cụ, công tắc thử nghiệm, cấu hình công cụ dựa trên nhà cung cấp, và thiết lập nhà cung cấp tùy chỉnh / base-URL
đã chuyển sang một trang riêng - xem
[Cấu hình - công cụ và nhà cung cấp tùy chỉnh](/vi/gateway/config-tools).

## Mô hình

Định nghĩa nhà cung cấp, danh sách cho phép mô hình, và thiết lập nhà cung cấp tùy chỉnh nằm trong
[Cấu hình - công cụ và nhà cung cấp tùy chỉnh](/vi/gateway/config-tools#custom-providers-and-base-urls).
Gốc `models` cũng sở hữu hành vi danh mục mô hình toàn cục.

```json5
{
  models: {
    // Optional. Default: true. Requires a Gateway restart when changed.
    pricing: { enabled: false },
  },
}
```

- `models.mode`: hành vi danh mục nhà cung cấp (`merge` hoặc `replace`).
- `models.providers`: bản đồ nhà cung cấp tùy chỉnh được khóa theo provider id.
- `models.providers.*.localService`: trình quản lý tiến trình theo yêu cầu tùy chọn cho
  máy chủ mô hình cục bộ. OpenClaw thăm dò endpoint health đã cấu hình, khởi động
  `command` tuyệt đối khi cần, chờ sẵn sàng, rồi gửi yêu cầu mô hình.
  Xem [Dịch vụ mô hình cục bộ](/vi/gateway/local-model-services).
- `models.pricing.enabled`: kiểm soát bootstrap định giá nền
  bắt đầu sau khi sidecar và kênh đạt đường dẫn sẵn sàng của Gateway. Khi là `false`,
  Gateway bỏ qua các lần fetch danh mục định giá OpenRouter và LiteLLM; các giá trị
  `models.providers.*.models[].cost` đã cấu hình vẫn hoạt động cho ước tính chi phí cục bộ.

## MCP

Định nghĩa máy chủ MCP do OpenClaw quản lý nằm trong `mcp.servers` và được
OpenClaw nhúng cùng các adapter runtime khác sử dụng. Các lệnh `openclaw mcp list`,
`show`, `set`, và `unset` quản lý khối này mà không kết nối đến
máy chủ đích trong lúc chỉnh sửa cấu hình.

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
        timeout: 20,
        connectTimeout: 5,
        supportsParallelToolCalls: true,
        headers: {
          Authorization: "Bearer ${MCP_REMOTE_TOKEN}",
        },
        auth: "oauth",
        oauth: {
          scope: "docs.read",
        },
        sslVerify: true,
        clientCert: "/path/to/client.crt",
        clientKey: "/path/to/client.key",
        toolFilter: {
          include: ["search_*"],
          exclude: ["admin_*"],
        },
        // Optional Codex app-server projection controls.
        codex: {
          agents: ["main"],
          defaultToolsApprovalMode: "approve", // auto | prompt | approve
        },
      },
    },
  },
}
```

- `mcp.servers`: định nghĩa máy chủ MCP stdio hoặc từ xa có tên cho runtime
  phơi bày các công cụ MCP đã cấu hình.
  Mục từ xa dùng `transport: "streamable-http"` hoặc `transport: "sse"`;
  `type: "http"` là bí danh gốc CLI mà `openclaw mcp set` và
  `openclaw doctor --fix` chuẩn hóa vào trường `transport` chuẩn.
- `mcp.servers.<name>.enabled`: đặt `false` để giữ định nghĩa máy chủ đã lưu
  trong khi loại nó khỏi khám phá MCP nhúng của OpenClaw và phép chiếu công cụ.
- `mcp.servers.<name>.timeout` / `requestTimeoutMs`: thời gian chờ yêu cầu MCP
  theo máy chủ, tính bằng giây hoặc mili giây.
- `mcp.servers.<name>.connectTimeout` / `connectionTimeoutMs`: thời gian chờ
  kết nối theo máy chủ, tính bằng giây hoặc mili giây.
- `mcp.servers.<name>.supportsParallelToolCalls`: gợi ý đồng thời tùy chọn cho
  adapter có thể chọn có phát lệnh gọi công cụ MCP song song hay không.
- `mcp.servers.<name>.auth`: đặt `"oauth"` cho máy chủ MCP HTTP yêu cầu
  OAuth. Chạy `openclaw mcp login <name>` để lưu token dưới trạng thái OpenClaw.
- `mcp.servers.<name>.oauth`: ghi đè tùy chọn cho scope OAuth, URL chuyển hướng, và
  URL siêu dữ liệu client.
- `mcp.servers.<name>.sslVerify`, `clientCert`, `clientKey`: điều khiển TLS HTTP
  cho endpoint riêng tư và mutual TLS.
- `mcp.servers.<name>.toolFilter`: lựa chọn công cụ theo máy chủ tùy chọn. `include`
  giới hạn các công cụ MCP được khám phá theo tên khớp; `exclude` ẩn các tên khớp.
  Mục là tên công cụ MCP chính xác hoặc glob `*` đơn giản. Máy chủ có
  tài nguyên hoặc prompt cũng tạo tên công cụ tiện ích (`resources_list`,
  `resources_read`, `prompts_list`, `prompts_get`), và các tên đó dùng cùng
  bộ lọc.
- `mcp.servers.<name>.codex`: điều khiển phép chiếu app-server Codex tùy chọn.
  Khối này là siêu dữ liệu OpenClaw chỉ dành cho luồng app-server Codex; nó không
  ảnh hưởng đến phiên ACP, cấu hình harness Codex chung, hoặc adapter runtime khác.
  `codex.agents` không rỗng giới hạn máy chủ cho các id agent OpenClaw đã liệt kê.
  Danh sách agent theo phạm vi rỗng, trống, hoặc không hợp lệ bị xác thực cấu hình
  từ chối và bị đường dẫn phép chiếu runtime bỏ qua thay vì trở thành toàn cục.
  `codex.defaultToolsApprovalMode` phát ra
  `default_tools_approval_mode` gốc của Codex cho máy chủ đó. OpenClaw loại bỏ khối `codex`
  trước khi chuyển cấu hình `mcp_servers` gốc cho Codex. Bỏ qua khối này để
  giữ máy chủ được chiếu cho mọi agent app-server Codex với hành vi phê duyệt MCP
  mặc định của Codex.
- `mcp.sessionIdleTtlMs`: TTL nhàn rỗi cho runtime MCP đi kèm theo phạm vi phiên.
  Các lượt chạy nhúng một lần yêu cầu dọn dẹp khi kết thúc lượt chạy; TTL này là chốt chặn cho
  các phiên dài hạn và caller tương lai.
- Thay đổi trong `mcp.*` được áp dụng nóng bằng cách hủy các runtime MCP phiên đã cache.
  Lần khám phá/sử dụng công cụ kế tiếp tạo lại chúng từ cấu hình mới, nên các mục
  `mcp.servers` đã bị xóa được thu dọn ngay thay vì chờ TTL nhàn rỗi.
- Khám phá runtime cũng tôn trọng thông báo thay đổi danh sách công cụ MCP bằng cách bỏ
  danh mục đã cache cho phiên đó. Máy chủ quảng bá tài nguyên hoặc
  prompt nhận các công cụ tiện ích để liệt kê/đọc tài nguyên và liệt kê/lấy
  prompt. Các lỗi gọi công cụ lặp lại tạm dừng máy chủ bị ảnh hưởng trong thời gian ngắn trước khi
  thử một lệnh gọi khác.

Xem [MCP](/vi/cli/mcp#openclaw-as-an-mcp-client-registry) và
[Backend CLI](/vi/gateway/cli-backends#bundle-mcp-overlays) để biết hành vi runtime.

## Skills

```json5
{
  skills: {
    allowBundled: ["gemini", "peekaboo"],
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills"],
      allowSymlinkTargets: ["~/Projects/manager/skills"],
    },
    install: {
      preferBrew: true,
      nodeManager: "npm", // npm | pnpm | yarn | bun
      allowUploadedArchives: false,
    },
    workshop: {
      allowSymlinkTargetWrites: false,
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

- `allowBundled`: danh sách cho phép tùy chọn chỉ dành cho Skills đi kèm (Skills được quản lý/workspace không bị ảnh hưởng).
- `load.extraDirs`: các gốc skill chia sẻ bổ sung (độ ưu tiên thấp nhất).
- `load.allowSymlinkTargets`: các gốc đích thực đáng tin cậy mà symlink skill có thể
  phân giải vào khi liên kết nằm ngoài gốc nguồn đã cấu hình.
- `workshop.allowSymlinkTargetWrites`: cho phép Skill Workshop apply ghi
  xuyên qua các đích symlink đã đáng tin cậy (mặc định: false).
- `install.preferBrew`: khi đúng, ưu tiên trình cài đặt Homebrew khi `brew` có
  sẵn trước khi quay về các loại trình cài đặt khác.
- `install.nodeManager`: tùy chọn trình cài đặt node cho thông số `metadata.openclaw.install`
  (`npm` | `pnpm` | `yarn` | `bun`).
- `install.allowUploadedArchives`: cho phép client Gateway `operator.admin`
  đáng tin cậy cài đặt kho lưu trữ zip riêng tư được staging qua `skills.upload.*`
  (mặc định: false). Điều này chỉ bật đường dẫn kho lưu trữ đã tải lên; cài đặt ClawHub
  thông thường không yêu cầu nó.
- `entries.<skillKey>.enabled: false` tắt một skill ngay cả khi đi kèm/đã cài đặt.
- `entries.<skillKey>.apiKey`: tiện ích cho Skills khai báo biến môi trường chính (chuỗi plaintext hoặc đối tượng SecretRef).

---

## Plugin

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
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

- Được tải từ các thư mục gói hoặc bundle dưới `~/.openclaw/extensions` và `<workspace>/.openclaw/extensions`, cùng với các tệp hoặc thư mục được liệt kê trong `plugins.load.paths`.
- Đặt các tệp Plugin độc lập trong `plugins.load.paths`; các gốc tiện ích mở rộng được tự động phát hiện sẽ bỏ qua các tệp `.js`, `.mjs` và `.ts` cấp cao nhất để các script trợ giúp trong những gốc đó không chặn quá trình khởi động.
- Discovery chấp nhận các Plugin OpenClaw gốc cùng với các bundle Codex và bundle Claude tương thích, bao gồm cả các bundle bố cục mặc định Claude không có manifest.
- **Các thay đổi cấu hình yêu cầu khởi động lại gateway.**
- `allow`: danh sách cho phép tùy chọn (chỉ các Plugin được liệt kê mới tải). `deny` được ưu tiên.
- `plugins.entries.<id>.apiKey`: trường tiện ích khóa API ở cấp Plugin (khi được Plugin hỗ trợ).
- `plugins.entries.<id>.env`: bản đồ biến môi trường trong phạm vi Plugin.
- `plugins.entries.<id>.hooks.allowPromptInjection`: khi là `false`, lõi chặn `before_prompt_build` và bỏ qua các trường sửa đổi prompt từ `before_agent_start` cũ, trong khi vẫn giữ `modelOverride` và `providerOverride` cũ. Áp dụng cho hook Plugin gốc và các thư mục hook do bundle được hỗ trợ cung cấp.
- `plugins.entries.<id>.hooks.allowConversationAccess`: khi là `true`, các Plugin đáng tin cậy không đi kèm bundle có thể đọc nội dung hội thoại thô từ các hook đã định kiểu như `llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize` và `agent_end`.
- `plugins.entries.<id>.subagent.allowModelOverride`: tin cậy rõ ràng Plugin này để yêu cầu ghi đè `provider` và `model` theo từng lần chạy cho các lần chạy subagent nền.
- `plugins.entries.<id>.subagent.allowedModels`: danh sách cho phép tùy chọn gồm các đích `provider/model` chuẩn cho các ghi đè subagent đáng tin cậy. Chỉ dùng `"*"` khi bạn cố ý muốn cho phép mọi model.
- `plugins.entries.<id>.llm.allowModelOverride`: tin cậy rõ ràng Plugin này để yêu cầu ghi đè model cho `api.runtime.llm.complete`.
- `plugins.entries.<id>.llm.allowedModels`: danh sách cho phép tùy chọn gồm các đích `provider/model` chuẩn cho các ghi đè hoàn tất LLM của Plugin đáng tin cậy. Chỉ dùng `"*"` khi bạn cố ý muốn cho phép mọi model.
- `plugins.entries.<id>.llm.allowAgentIdOverride`: tin cậy rõ ràng Plugin này để chạy `api.runtime.llm.complete` với một id agent không mặc định.
- `plugins.entries.<id>.config`: đối tượng cấu hình do Plugin định nghĩa (được xác thực bằng schema Plugin OpenClaw gốc khi có).
- Thiết lập tài khoản/runtime của Plugin kênh nằm dưới `channels.<id>` và nên được mô tả bằng metadata `channelConfigs` trong manifest của Plugin sở hữu, không phải bằng một registry tùy chọn OpenClaw trung tâm.

### Cấu hình Plugin harness Codex

Plugin `codex` đi kèm sở hữu các thiết lập harness app-server Codex gốc dưới
`plugins.entries.codex.config`. Xem
[Tham chiếu harness Codex](/vi/plugins/codex-harness-reference) để biết toàn bộ bề mặt cấu hình
và [harness Codex](/vi/plugins/codex-harness) để biết mô hình runtime.

`codexPlugins` chỉ áp dụng cho các phiên chọn harness Codex gốc.
Nó không bật Plugin Codex cho các lần chạy provider OpenClaw, các binding hội thoại
ACP, hoặc bất kỳ harness không phải Codex nào.

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          codexPlugins: {
            enabled: true,
            allow_destructive_actions: true,
            plugins: {
              "google-calendar": {
                enabled: true,
                marketplaceName: "openai-curated",
                pluginName: "google-calendar",
                allow_destructive_actions: false,
              },
            },
          },
        },
      },
    },
  },
}
```

- `plugins.entries.codex.config.codexPlugins.enabled`: bật hỗ trợ
  Plugin/app Codex gốc cho harness Codex. Mặc định: `false`.
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions`:
  chính sách hành động phá hủy mặc định cho các lời gọi app Plugin đã migrate.
  Dùng `true` để chấp nhận các schema phê duyệt Codex an toàn mà không nhắc, `false`
  để từ chối chúng, `"auto"` để định tuyến các phê duyệt bắt buộc của Codex qua
  phê duyệt Plugin OpenClaw, hoặc `"ask"` để nhắc cho mọi hành động ghi/phá hủy
  của Plugin mà không có phê duyệt bền vững. Chế độ `"ask"` xóa các ghi đè phê duyệt
  theo công cụ bền vững của Codex cho app bị ảnh hưởng và chọn người đánh giá
  phê duyệt là con người cho app đó trước khi luồng Codex bắt đầu.
  Mặc định: `true`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.enabled`: bật một
  mục Plugin đã migrate khi `codexPlugins.enabled` toàn cục cũng là true.
  Mặc định: `true` cho các mục rõ ràng.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.marketplaceName`:
  danh tính marketplace ổn định. V1 chỉ hỗ trợ `"openai-curated"`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.pluginName`: danh tính
  Plugin Codex ổn định từ migration, ví dụ `"google-calendar"`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.allow_destructive_actions`:
  ghi đè hành động phá hủy theo từng Plugin. Khi bỏ qua, giá trị
  `allow_destructive_actions` toàn cục được dùng. Giá trị theo từng Plugin chấp nhận
  cùng các chính sách `true`, `false`, `"auto"` hoặc `"ask"`.

Mỗi app Plugin được chấp nhận dùng `"ask"` sẽ định tuyến các yêu cầu phê duyệt của app đó
đến người đánh giá là con người. Các app khác và phê duyệt luồng không phải app vẫn giữ
người đánh giá đã cấu hình, nên các chính sách Plugin hỗn hợp không kế thừa hành vi `"ask"`.

`codexPlugins.enabled` là chỉ thị bật toàn cục. Các mục Plugin rõ ràng
được migration ghi ra là tập hợp đủ điều kiện cài đặt bền vững và sửa chữa.
`plugins["*"]` không được hỗ trợ, không có công tắc `install`, và các giá trị
`marketplacePath` cục bộ cố ý không phải là trường cấu hình vì chúng
phụ thuộc vào host.

Các kiểm tra sẵn sàng `app/list` được cache trong một giờ và được làm mới
bất đồng bộ khi đã cũ. Cấu hình app luồng Codex được tính khi thiết lập phiên
harness Codex, không phải ở mỗi lượt; dùng `/new`, `/reset`, hoặc khởi động lại gateway
sau khi thay đổi cấu hình Plugin gốc.

- `plugins.entries.firecrawl.config.webFetch`: thiết lập provider tìm nạp web Firecrawl.
  - `apiKey`: Khóa API Firecrawl tùy chọn để có giới hạn cao hơn (chấp nhận SecretRef). Dự phòng về `plugins.entries.firecrawl.config.webSearch.apiKey`, `tools.web.fetch.firecrawl.apiKey` cũ, hoặc biến môi trường `FIRECRAWL_API_KEY`.
  - `baseUrl`: URL cơ sở API Firecrawl (mặc định: `https://api.firecrawl.dev`; các ghi đè tự host phải trỏ tới endpoint riêng tư/nội bộ).
  - `onlyMainContent`: chỉ trích xuất nội dung chính từ các trang (mặc định: `true`).
  - `maxAgeMs`: tuổi cache tối đa tính bằng mili giây (mặc định: `172800000` / 2 ngày).
  - `timeoutSeconds`: thời gian chờ yêu cầu scrape tính bằng giây (mặc định: `60`).
- `plugins.entries.xai.config.xSearch`: thiết lập xAI X Search (tìm kiếm web Grok).
  - `enabled`: bật provider X Search.
  - `model`: model Grok dùng cho tìm kiếm (ví dụ `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: thiết lập memory dreaming. Xem [Dreaming](/vi/concepts/dreaming) để biết các pha và ngưỡng.
  - `enabled`: công tắc dreaming chính (mặc định `false`).
  - `frequency`: nhịp cron cho mỗi lượt quét dreaming đầy đủ (`"0 3 * * *"` theo mặc định).
  - `model`: ghi đè model subagent Dream Diary tùy chọn. Yêu cầu `plugins.entries.memory-core.subagent.allowModelOverride: true`; ghép với `allowedModels` để giới hạn đích. Lỗi model không khả dụng sẽ thử lại một lần với model mặc định của phiên; lỗi tin cậy hoặc danh sách cho phép sẽ không dự phòng âm thầm.
  - chính sách pha và ngưỡng là chi tiết triển khai (không phải khóa cấu hình hướng tới người dùng).
- Cấu hình bộ nhớ đầy đủ nằm trong [Tham chiếu cấu hình bộ nhớ](/vi/reference/memory-config):
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Các Plugin bundle Claude đã bật cũng có thể đóng góp mặc định OpenClaw nhúng từ `settings.json`; OpenClaw áp dụng chúng như các thiết lập agent đã làm sạch, không phải như các bản vá cấu hình OpenClaw thô.
- `plugins.slots.memory`: chọn id Plugin bộ nhớ đang hoạt động, hoặc `"none"` để tắt các Plugin bộ nhớ.
- `plugins.slots.contextEngine`: chọn id Plugin context engine đang hoạt động; mặc định là `"legacy"` trừ khi bạn cài đặt và chọn một engine khác.

Xem [Plugins](/vi/tools/plugin).

---

## Cam kết

`commitments` kiểm soát bộ nhớ theo dõi suy luận: OpenClaw có thể phát hiện các lần check-in từ lượt hội thoại và phân phối chúng qua các lần chạy Heartbeat.

- `commitments.enabled`: bật trích xuất LLM ẩn, lưu trữ và phân phối Heartbeat cho các cam kết theo dõi được suy luận. Mặc định: `false`.
- `commitments.maxPerDay`: số cam kết theo dõi được suy luận tối đa được phân phối cho mỗi phiên agent trong một ngày cuốn chiếu. Mặc định: `3`.

Xem [Cam kết được suy luận](/vi/concepts/commitments).

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
- `tabCleanup` thu hồi các tab tác nhân chính được theo dõi sau thời gian nhàn rỗi hoặc khi một
  phiên vượt quá giới hạn của nó. Đặt `idleMinutes: 0` hoặc `maxTabsPerSession: 0` để
  vô hiệu hóa từng chế độ dọn dẹp riêng lẻ đó.
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` bị vô hiệu hóa khi chưa đặt, vì vậy điều hướng trình duyệt vẫn nghiêm ngặt theo mặc định.
- Chỉ đặt `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` khi bạn cố ý tin cậy điều hướng trình duyệt qua mạng riêng.
- Ở chế độ nghiêm ngặt, các điểm cuối hồ sơ CDP từ xa (`profiles.*.cdpUrl`) chịu cùng cơ chế chặn mạng riêng trong các bước kiểm tra khả năng truy cập/phát hiện.
- `ssrfPolicy.allowPrivateNetwork` vẫn được hỗ trợ như một bí danh kế thừa.
- Ở chế độ nghiêm ngặt, dùng `ssrfPolicy.hostnameAllowlist` và `ssrfPolicy.allowedHostnames` cho các ngoại lệ rõ ràng.
- Hồ sơ từ xa chỉ cho phép gắn kết (vô hiệu hóa start/stop/reset).
- `profiles.*.cdpUrl` chấp nhận `http://`, `https://`, `ws://`, và `wss://`.
  Dùng HTTP(S) khi bạn muốn OpenClaw phát hiện `/json/version`; dùng WS(S)
  khi nhà cung cấp của bạn cung cấp URL DevTools WebSocket trực tiếp.
- `remoteCdpTimeoutMs` và `remoteCdpHandshakeTimeoutMs` áp dụng cho khả năng truy cập CDP từ xa và
  `attachOnly` cùng các yêu cầu mở tab. Các hồ sơ local loopback được quản lý
  giữ nguyên mặc định CDP cục bộ.
- Nếu một dịch vụ CDP được quản lý bên ngoài có thể truy cập qua loopback, hãy đặt
  `attachOnly: true` cho hồ sơ đó; nếu không OpenClaw sẽ coi cổng loopback là một
  hồ sơ trình duyệt cục bộ được quản lý và có thể báo lỗi quyền sở hữu cổng cục bộ.
- Hồ sơ `existing-session` dùng Chrome MCP thay vì CDP và có thể gắn kết trên
  máy chủ đã chọn hoặc thông qua một nút trình duyệt đã kết nối.
- Hồ sơ `existing-session` có thể đặt `userDataDir` để nhắm tới một
  hồ sơ trình duyệt dựa trên Chromium cụ thể như Brave hoặc Edge.
- Hồ sơ `existing-session` có thể đặt `cdpUrl` khi Chrome đã chạy
  phía sau một điểm cuối phát hiện HTTP(S) DevTools hoặc điểm cuối WS(S) trực tiếp. Trong
  chế độ đó, OpenClaw chuyển điểm cuối cho Chrome MCP thay vì dùng tự động kết nối;
  `userDataDir` bị bỏ qua đối với tham số khởi chạy Chrome MCP.
- Hồ sơ `existing-session` giữ các giới hạn tuyến Chrome MCP hiện tại:
  hành động dựa trên snapshot/ref thay vì nhắm mục tiêu bằng bộ chọn CSS, hook tải lên
  một tệp, không ghi đè thời gian chờ hộp thoại, không có `wait --load networkidle`, và không có
  `responsebody`, xuất PDF, chặn tải xuống, hoặc hành động hàng loạt.
- Hồ sơ `openclaw` cục bộ được quản lý tự động gán `cdpPort` và `cdpUrl`; chỉ đặt
  `cdpUrl` rõ ràng cho hồ sơ CDP từ xa hoặc gắn kết điểm cuối existing-session.
- Hồ sơ cục bộ được quản lý có thể đặt `executablePath` để ghi đè
  `browser.executablePath` toàn cục cho hồ sơ đó. Dùng tùy chọn này để chạy một hồ sơ trong
  Chrome và một hồ sơ khác trong Brave.
- Hồ sơ cục bộ được quản lý dùng `browser.localLaunchTimeoutMs` cho quá trình phát hiện HTTP Chrome CDP
  sau khi tiến trình khởi động và `browser.localCdpReadyTimeoutMs` cho
  trạng thái sẵn sàng websocket CDP sau khi khởi chạy. Tăng các giá trị này trên máy chủ chậm hơn nơi Chrome
  khởi động thành công nhưng kiểm tra sẵn sàng bị đua với quá trình khởi động. Cả hai giá trị phải là
  số nguyên dương tối đa `120000` ms; giá trị cấu hình không hợp lệ sẽ bị từ chối.
- Thứ tự tự động phát hiện: trình duyệt mặc định nếu dựa trên Chromium → Chrome → Brave → Edge → Chromium → Chrome Canary.
- `browser.executablePath` và `browser.profiles.<name>.executablePath` đều
  chấp nhận `~` và `~/...` cho thư mục home của hệ điều hành trước khi khởi chạy Chromium.
  `userDataDir` theo hồ sơ trên hồ sơ `existing-session` cũng được mở rộng dấu ngã.
- Dịch vụ điều khiển: chỉ loopback (cổng được suy ra từ `gateway.port`, mặc định `18791`).
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

- `seamColor`: màu nhấn cho chrome giao diện ứng dụng gốc (sắc thái bong bóng Talk Mode, v.v.).
- `assistant`: ghi đè định danh Control UI. Dự phòng về định danh tác nhân đang hoạt động.

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
      url: "ws://127.0.0.1:18789",
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
      // Remove tools from the default HTTP deny list for owner/admin callers
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

<Accordion title="Chi tiết trường Gateway">

- `mode`: `local` (chạy gateway) hoặc `remote` (kết nối tới gateway từ xa). Gateway từ chối khởi động trừ khi là `local`.
- `port`: cổng ghép kênh duy nhất cho WS + HTTP. Thứ tự ưu tiên: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto`, `loopback` (mặc định), `lan` (`0.0.0.0`), `tailnet` (chỉ IP Tailscale), hoặc `custom`.
- **Bí danh bind cũ**: dùng các giá trị chế độ bind trong `gateway.bind` (`auto`, `loopback`, `lan`, `tailnet`, `custom`), không dùng bí danh host (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`).
- **Ghi chú Docker**: bind `loopback` mặc định lắng nghe trên `127.0.0.1` bên trong container. Với mạng cầu nối Docker (`-p 18789:18789`), lưu lượng đi vào trên `eth0`, nên gateway không thể truy cập được. Dùng `--network host`, hoặc đặt `bind: "lan"` (hoặc `bind: "custom"` với `customBindHost: "0.0.0.0"`) để lắng nghe trên tất cả giao diện mạng.
- **Xác thực**: mặc định là bắt buộc. Các bind không phải loopback yêu cầu xác thực gateway. Trong thực tế, điều đó nghĩa là token/mật khẩu dùng chung hoặc reverse proxy nhận biết danh tính với `gateway.auth.mode: "trusted-proxy"`. Trình hướng dẫn onboarding mặc định tạo token.
- Nếu cả `gateway.auth.token` và `gateway.auth.password` được cấu hình (bao gồm SecretRefs), hãy đặt rõ `gateway.auth.mode` thành `token` hoặc `password`. Các luồng khởi động và cài đặt/sửa chữa dịch vụ sẽ thất bại khi cả hai được cấu hình và mode chưa được đặt.
- `gateway.auth.mode: "none"`: chế độ không xác thực rõ ràng. Chỉ dùng cho các thiết lập local loopback đáng tin cậy; chế độ này cố ý không được cung cấp trong lời nhắc onboarding.
- `gateway.auth.mode: "trusted-proxy"`: ủy quyền xác thực trình duyệt/người dùng cho reverse proxy nhận biết danh tính và tin cậy các header danh tính từ `gateway.trustedProxies` (xem [Xác thực Trusted Proxy](/vi/gateway/trusted-proxy-auth)). Chế độ này mặc định yêu cầu nguồn proxy **không phải loopback**; reverse proxy loopback cùng host yêu cầu đặt rõ `gateway.auth.trustedProxy.allowLoopback = true`. Các caller nội bộ cùng host có thể dùng `gateway.auth.password` làm fallback trực tiếp cục bộ; `gateway.auth.token` vẫn loại trừ lẫn nhau với chế độ trusted-proxy.
- `gateway.auth.allowTailscale`: khi là `true`, các header danh tính Tailscale Serve có thể đáp ứng xác thực Control UI/WebSocket (được xác minh qua `tailscale whois`). Các endpoint HTTP API **không** dùng xác thực header Tailscale đó; thay vào đó chúng tuân theo chế độ xác thực HTTP bình thường của gateway. Luồng không cần token này giả định host gateway là đáng tin cậy. Mặc định là `true` khi `tailscale.mode = "serve"`.
- `gateway.auth.rateLimit`: bộ giới hạn xác thực thất bại tùy chọn. Áp dụng theo từng IP client và từng phạm vi xác thực (shared-secret và device-token được theo dõi độc lập). Các lần thử bị chặn trả về `429` + `Retry-After`.
  - Trên đường dẫn Control UI Tailscale Serve bất đồng bộ, các lần thử thất bại cho cùng `{scope, clientIp}` được tuần tự hóa trước khi ghi thất bại. Vì vậy, các lần thử sai đồng thời từ cùng client có thể kích hoạt bộ giới hạn ở yêu cầu thứ hai thay vì cả hai cùng chạy qua như các lần không khớp thông thường.
  - `gateway.auth.rateLimit.exemptLoopback` mặc định là `true`; đặt `false` khi bạn cố ý muốn lưu lượng localhost cũng bị giới hạn tần suất (cho thiết lập kiểm thử hoặc triển khai proxy nghiêm ngặt).
- Các lần thử xác thực WS từ origin trình duyệt luôn bị điều tiết với miễn trừ loopback bị tắt (phòng thủ chiều sâu chống brute force localhost dựa trên trình duyệt).
- Trên loopback, các lockout từ origin trình duyệt đó được cô lập theo từng giá trị `Origin`
  đã chuẩn hóa, nên các thất bại lặp lại từ một origin localhost không tự động
  khóa một origin khác.
- `tailscale.mode`: `serve` (chỉ tailnet, bind loopback) hoặc `funnel` (công khai, yêu cầu xác thực).
- `tailscale.serviceName`: tên Tailscale Service tùy chọn cho chế độ Serve, chẳng
  hạn `svc:openclaw`. Khi được đặt, OpenClaw truyền nó cho `tailscale serve
--service` để Control UI có thể được hiển thị qua một Service có tên thay vì
  hostname thiết bị. Giá trị phải dùng định dạng tên Service `svc:<dns-label>`
  của Tailscale; khi khởi động sẽ báo cáo URL Service được suy ra.
- `tailscale.preserveFunnel`: khi là `true` và `tailscale.mode = "serve"`, OpenClaw
  kiểm tra `tailscale funnel status` trước khi áp dụng lại Serve lúc khởi động và bỏ qua
  nếu một route Funnel được cấu hình bên ngoài đã bao phủ cổng gateway.
  Mặc định `false`.
- `controlUi.allowedOrigins`: danh sách cho phép origin trình duyệt rõ ràng cho các kết nối Gateway WebSocket. Bắt buộc cho origin trình duyệt công khai không phải loopback. Các lần tải UI LAN/Tailnet riêng tư cùng origin từ loopback, RFC1918/link-local, `.local`, `.ts.net`, hoặc host Tailscale CGNAT được chấp nhận mà không cần bật fallback Host-header.
- `controlUi.chatMessageMaxWidth`: chiều rộng tối đa tùy chọn cho các tin nhắn chat Control UI được nhóm. Chấp nhận các giá trị chiều rộng CSS có ràng buộc như `960px`, `82%`, `min(1280px, 82%)`, và `calc(100% - 2rem)`.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: chế độ nguy hiểm bật fallback origin Host-header cho các triển khai cố ý dựa vào chính sách origin Host-header.
- `remote.transport`: `ssh` (mặc định) hoặc `direct` (ws/wss). Với `direct`, `remote.url` phải là `wss://` cho host công khai; plaintext `ws://` chỉ được chấp nhận cho loopback, LAN, link-local, `.local`, `.ts.net`, và host Tailscale CGNAT.
- `remote.remotePort`: cổng gateway trên host SSH từ xa. Mặc định là `18789`; dùng trường này khi cổng tunnel cục bộ khác với cổng gateway từ xa.
- `gateway.remote.token` / `.password` là các trường thông tin xác thực client từ xa. Tự chúng không cấu hình xác thực gateway.
- `gateway.push.apns.relay.baseUrl`: URL HTTPS cơ sở cho APNs relay bên ngoài được dùng sau khi các bản dựng iOS dựa trên relay công bố đăng ký tới gateway. Các bản dựng App Store công khai dùng relay OpenClaw được lưu trữ sẵn. URL relay tùy chỉnh phải khớp với một đường dẫn bản dựng/triển khai iOS tách biệt có chủ ý, trong đó URL relay trỏ tới relay đó.
- `gateway.push.apns.relay.timeoutMs`: thời gian chờ gửi từ gateway tới relay tính bằng mili giây. Mặc định là `10000`.
- Các đăng ký dựa trên relay được ủy quyền cho một danh tính gateway cụ thể. Ứng dụng iOS đã ghép đôi lấy `gateway.identity.get`, bao gồm danh tính đó trong đăng ký relay, và chuyển tiếp một quyền gửi theo phạm vi đăng ký tới gateway. Gateway khác không thể tái sử dụng đăng ký đã lưu đó.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: ghi đè env tạm thời cho cấu hình relay ở trên.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: lối thoát chỉ dành cho phát triển cho các URL relay HTTP loopback. URL relay production nên giữ trên HTTPS.
- `gateway.handshakeTimeoutMs`: thời gian chờ handshake Gateway WebSocket trước xác thực tính bằng mili giây. Mặc định: `15000`. `OPENCLAW_HANDSHAKE_TIMEOUT_MS` có ưu tiên khi được đặt. Tăng giá trị này trên các host tải nặng hoặc công suất thấp, nơi client cục bộ có thể kết nối trong khi khởi động vẫn đang ổn định sau warmup.
- `gateway.channelHealthCheckMinutes`: khoảng thời gian monitor sức khỏe kênh tính bằng phút. Đặt `0` để tắt restart bởi monitor sức khỏe trên toàn cục. Mặc định: `5`.
- `gateway.channelStaleEventThresholdMinutes`: ngưỡng stale-socket tính bằng phút. Giữ giá trị này lớn hơn hoặc bằng `gateway.channelHealthCheckMinutes`. Mặc định: `30`.
- `gateway.channelMaxRestartsPerHour`: số lần restart tối đa bởi monitor sức khỏe cho mỗi kênh/tài khoản trong một giờ trượt. Mặc định: `10`.
- `channels.<provider>.healthMonitor.enabled`: tùy chọn không tham gia theo từng kênh cho restart bởi monitor sức khỏe trong khi vẫn bật monitor toàn cục.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: ghi đè theo từng tài khoản cho các kênh nhiều tài khoản. Khi được đặt, nó có ưu tiên hơn ghi đè cấp kênh.
- Các đường dẫn gọi gateway cục bộ chỉ có thể dùng `gateway.remote.*` làm fallback khi `gateway.auth.*` chưa được đặt.
- Nếu `gateway.auth.token` / `gateway.auth.password` được cấu hình rõ ràng qua SecretRef và không phân giải được, quá trình phân giải sẽ fail closed (không bị fallback từ xa che lấp).
- `trustedProxies`: IP reverse proxy kết thúc TLS hoặc chèn header forwarded-client. Chỉ liệt kê các proxy bạn kiểm soát. Các mục loopback vẫn hợp lệ cho thiết lập proxy/phát hiện cục bộ cùng host (ví dụ Tailscale Serve hoặc reverse proxy cục bộ), nhưng chúng **không** làm cho yêu cầu loopback đủ điều kiện cho `gateway.auth.mode: "trusted-proxy"`.
- `allowRealIpFallback`: khi là `true`, gateway chấp nhận `X-Real-IP` nếu thiếu `X-Forwarded-For`. Mặc định `false` cho hành vi fail-closed.
- `gateway.nodes.pairing.autoApproveCidrs`: danh sách cho phép CIDR/IP tùy chọn để tự động phê duyệt ghép đôi thiết bị node lần đầu khi không yêu cầu scope. Bị tắt khi chưa đặt. Điều này không tự động phê duyệt ghép đôi operator/trình duyệt/Control UI/WebChat, và không tự động phê duyệt nâng cấp vai trò, scope, metadata, hoặc public-key.
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: định hình allow/deny toàn cục cho các lệnh node đã khai báo sau khi ghép đôi và đánh giá danh sách cho phép của nền tảng. Dùng `allowCommands` để chọn tham gia các lệnh node nguy hiểm như `camera.snap`, `camera.clip`, và `screen.record`; `denyCommands` loại bỏ một lệnh ngay cả khi mặc định nền tảng hoặc allow rõ ràng đáng lẽ bao gồm lệnh đó. Sau khi một node thay đổi danh sách lệnh đã khai báo, hãy từ chối và phê duyệt lại ghép đôi thiết bị đó để gateway lưu snapshot lệnh đã cập nhật.
- `gateway.tools.deny`: tên công cụ bổ sung bị chặn cho HTTP `POST /tools/invoke` (mở rộng danh sách deny mặc định).
- `gateway.tools.allow`: loại bỏ tên công cụ khỏi danh sách deny HTTP mặc định cho
  caller owner/admin. Điều này không nâng cấp các caller `operator.write` có danh tính
  thành quyền owner/admin; `cron`, `gateway`, và `nodes` vẫn
  không khả dụng cho caller không phải owner ngay cả khi được đưa vào allowlist.

</Accordion>

### Endpoint tương thích OpenAI

- Admin HTTP RPC: mặc định tắt dưới dạng Plugin `admin-http-rpc`. Bật Plugin để đăng ký `POST /api/v1/admin/rpc`. Xem [Admin HTTP RPC](/vi/plugins/admin-http-rpc).
- Chat Completions: mặc định tắt. Bật bằng `gateway.http.endpoints.chatCompletions.enabled: true`.
- Responses API: `gateway.http.endpoints.responses.enabled`.
- Gia cố đầu vào URL cho Responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    Danh sách cho phép rỗng được xem như chưa đặt; dùng `gateway.http.endpoints.responses.files.allowUrl=false`
    và/hoặc `gateway.http.endpoints.responses.images.allowUrl=false` để tắt việc tải URL.
- Header gia cố phản hồi tùy chọn:
  - `gateway.http.securityHeaders.strictTransportSecurity` (chỉ đặt cho các origin HTTPS bạn kiểm soát; xem [Xác thực Trusted Proxy](/vi/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### Cô lập nhiều instance

Chạy nhiều gateway trên một host với các cổng và thư mục trạng thái riêng:

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

- `enabled`: bật kết thúc TLS tại listener gateway (HTTPS/WSS) (mặc định: `false`).
- `autoGenerate`: tự động tạo cặp chứng chỉ/khóa tự ký cục bộ khi các tệp rõ ràng chưa được cấu hình; chỉ dùng cho local/dev.
- `certPath`: đường dẫn hệ thống tệp tới tệp chứng chỉ TLS.
- `keyPath`: đường dẫn hệ thống tệp tới tệp khóa riêng TLS; giữ quyền truy cập bị giới hạn.
- `caPath`: đường dẫn CA bundle tùy chọn cho xác minh client hoặc chuỗi tin cậy tùy chỉnh.

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

- `mode`: kiểm soát cách các chỉnh sửa cấu hình được áp dụng lúc chạy.
  - `"off"`: bỏ qua chỉnh sửa trực tiếp; thay đổi yêu cầu khởi động lại rõ ràng.
  - `"restart"`: luôn khởi động lại tiến trình Gateway khi cấu hình thay đổi.
  - `"hot"`: áp dụng thay đổi trong tiến trình mà không khởi động lại.
  - `"hybrid"` (mặc định): thử tải lại nóng trước; quay về khởi động lại nếu cần.
- `debounceMs`: cửa sổ debounce tính bằng ms trước khi thay đổi cấu hình được áp dụng (số nguyên không âm).
- `deferralTimeoutMs`: thời gian tối đa tùy chọn tính bằng ms để chờ các thao tác đang chạy trước khi buộc khởi động lại hoặc tải lại nóng kênh. Bỏ qua để dùng thời gian chờ có giới hạn mặc định (`300000`); đặt `0` để chờ vô thời hạn và ghi log cảnh báo định kỳ rằng vẫn còn tác vụ đang chờ.

---

## Hook

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
Token hook trong query string bị từ chối.

Ghi chú về xác thực và an toàn:

- `hooks.enabled=true` yêu cầu `hooks.token` không rỗng.
- `hooks.token` nên khác với xác thực shared-secret Gateway đang hoạt động (`gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` hoặc `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`); khi phát hiện dùng lại, khởi động sẽ ghi log cảnh báo bảo mật không gây lỗi nghiêm trọng.
- `openclaw security audit` đánh dấu việc dùng lại xác thực hook/Gateway là phát hiện nghiêm trọng, bao gồm xác thực mật khẩu Gateway chỉ được cung cấp tại thời điểm audit (`--auth password --password <password>`). Chạy `openclaw doctor --fix` để xoay vòng `hooks.token` đã được lưu bền nếu bị dùng lại, rồi cập nhật các bộ gửi hook bên ngoài để dùng token hook mới.
- `hooks.path` không thể là `/`; hãy dùng một đường dẫn con riêng như `/hooks`.
- Nếu `hooks.allowRequestSessionKey=true`, hãy giới hạn `hooks.allowedSessionKeyPrefixes` (ví dụ `["hook:"]`).
- Nếu một mapping hoặc preset dùng `sessionKey` dạng template, hãy đặt `hooks.allowedSessionKeyPrefixes` và `hooks.allowRequestSessionKey=true`. Các khóa mapping tĩnh không yêu cầu bật tùy chọn đó.

**Endpoint:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - `sessionKey` từ payload yêu cầu chỉ được chấp nhận khi `hooks.allowRequestSessionKey=true` (mặc định: `false`).
- `POST /hooks/<name>` → được phân giải qua `hooks.mappings`
  - Các giá trị `sessionKey` của mapping được render từ template được xem là do bên ngoài cung cấp và cũng yêu cầu `hooks.allowRequestSessionKey=true`.

<Accordion title="Chi tiết mapping">

- `match.path` khớp với đường dẫn con sau `/hooks` (ví dụ `/hooks/gmail` → `gmail`).
- `match.source` khớp với một trường payload cho các đường dẫn chung.
- Template như `{{messages[0].subject}}` đọc từ payload.
- `transform` có thể trỏ tới một module JS/TS trả về một hành động hook.
  - `transform.module` phải là đường dẫn tương đối và nằm trong `hooks.transformsDir` (đường dẫn tuyệt đối và traversal bị từ chối).
  - Giữ `hooks.transformsDir` dưới `~/.openclaw/hooks/transforms`; các thư mục skill trong workspace bị từ chối. Nếu `openclaw doctor` báo đường dẫn này không hợp lệ, hãy chuyển module transform vào thư mục hooks transforms hoặc xóa `hooks.transformsDir`.
- `agentId` định tuyến tới một agent cụ thể; ID không xác định quay về agent mặc định.
- `allowedAgentIds`: giới hạn định tuyến agent hiệu lực, bao gồm đường dẫn agent mặc định khi bỏ qua `agentId` (`*` hoặc bỏ qua = cho phép tất cả, `[]` = từ chối tất cả).
- `defaultSessionKey`: khóa phiên cố định tùy chọn cho các lần chạy hook agent không có `sessionKey` rõ ràng.
- `allowRequestSessionKey`: cho phép caller `/hooks/agent` và khóa phiên mapping dựa trên template đặt `sessionKey` (mặc định: `false`).
- `allowedSessionKeyPrefixes`: danh sách cho phép tiền tố tùy chọn cho các giá trị `sessionKey` rõ ràng (yêu cầu + mapping), ví dụ `["hook:"]`. Nó trở thành bắt buộc khi bất kỳ mapping hoặc preset nào dùng `sessionKey` dạng template.
- `deliver: true` gửi phản hồi cuối cùng tới một kênh; `channel` mặc định là `last`.
- `model` ghi đè LLM cho lần chạy hook này (phải được cho phép nếu catalog model được đặt).

</Accordion>

### Tích hợp Gmail

- Preset Gmail tích hợp sẵn dùng `sessionKey: "hook:gmail:{{messages[0].id}}"`.
- Nếu bạn giữ định tuyến theo từng tin nhắn đó, hãy đặt `hooks.allowRequestSessionKey: true` và giới hạn `hooks.allowedSessionKeyPrefixes` để khớp với namespace Gmail, ví dụ `["hook:", "hook:gmail:"]`.
- Nếu bạn cần `hooks.allowRequestSessionKey: false`, hãy ghi đè preset bằng một `sessionKey` tĩnh thay vì mặc định dạng template.

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

- Gateway tự động khởi động `gog gmail watch serve` khi boot nếu được cấu hình. Đặt `OPENCLAW_SKIP_GMAIL_WATCHER=1` để tắt.
- Đừng chạy một `gog gmail watch serve` riêng cùng với Gateway.

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

- Phục vụ HTML/CSS/JS và A2UI mà agent có thể chỉnh sửa qua HTTP dưới cổng Gateway:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- Chỉ cục bộ: giữ `gateway.bind: "loopback"` (mặc định).
- Các bind không phải loopback: route canvas yêu cầu xác thực Gateway (token/mật khẩu/trusted-proxy), giống như các bề mặt HTTP Gateway khác.
- WebView của Node thường không gửi header xác thực; sau khi một node được ghép đôi và kết nối, Gateway quảng bá URL capability theo phạm vi node để truy cập canvas/A2UI.
- URL capability được ràng buộc với phiên WS node đang hoạt động và hết hạn nhanh. Không dùng fallback dựa trên IP.
- Chèn client tải lại trực tiếp vào HTML được phục vụ.
- Tự động tạo `index.html` khởi đầu khi trống.
- Cũng phục vụ A2UI tại `/__openclaw__/a2ui/`.
- Thay đổi yêu cầu khởi động lại Gateway.
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
- Hostname mặc định là hostname hệ thống khi đó là nhãn DNS hợp lệ, quay về `openclaw` nếu không hợp lệ. Ghi đè bằng `OPENCLAW_MDNS_HOSTNAME`.

### Diện rộng (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

Ghi một vùng unicast DNS-SD trong `~/.openclaw/dns/`. Để khám phá qua nhiều mạng, ghép với máy chủ DNS (khuyến nghị CoreDNS) + Tailscale split DNS.

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

- Biến môi trường nội tuyến chỉ được áp dụng nếu môi trường tiến trình thiếu khóa đó.
- Tệp `.env`: `.env` trong CWD + `~/.openclaw/.env` (không tệp nào ghi đè biến hiện có).
- `shellEnv`: nhập các khóa dự kiến còn thiếu từ hồ sơ shell đăng nhập của bạn.
- Xem [Môi trường](/vi/help/environment) để biết toàn bộ thứ tự ưu tiên.

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
- Biến thiếu/rỗng sẽ gây lỗi khi tải cấu hình.
- Thoát bằng `$${VAR}` để lấy literal `${VAR}`.
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
- Mẫu id `source: "exec"`: `^[A-Za-z0-9][A-Za-z0-9._:/#-]{0,255}$` (hỗ trợ bộ chọn kiểu AWS `secret#json_key`)
- id `source: "exec"` không được chứa các đoạn đường dẫn phân tách bằng dấu gạch chéo là `.` hoặc `..` (ví dụ `a/../b` bị từ chối)

### Bề mặt thông tin xác thực được hỗ trợ

- Ma trận chuẩn: [Bề mặt thông tin xác thực SecretRef](/vi/reference/secretref-credential-surface)
- `secrets apply` nhắm tới các đường dẫn thông tin xác thực `openclaw.json` được hỗ trợ.
- Tham chiếu `auth-profiles.json` được đưa vào quá trình phân giải runtime và phạm vi kiểm toán.

### Cấu hình nhà cung cấp bí mật

```json5
{
  secrets: {
    providers: {
      default: { source: "env" }, // optional explicit env provider
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

- Nhà cung cấp `file` hỗ trợ `mode: "json"` và `mode: "singleValue"` (`id` phải là `"value"` ở chế độ singleValue).
- Đường dẫn của nhà cung cấp file và exec sẽ đóng an toàn khi không thể xác minh Windows ACL. Chỉ đặt `allowInsecurePath: true` cho các đường dẫn tin cậy không thể xác minh.
- Nhà cung cấp `exec` yêu cầu đường dẫn `command` tuyệt đối và dùng payload giao thức trên stdin/stdout.
- Theo mặc định, đường dẫn lệnh symlink bị từ chối. Đặt `allowSymlinkCommand: true` để cho phép đường dẫn symlink trong khi xác thực đường dẫn đích đã phân giải.
- Nếu cấu hình `trustedDirs`, kiểm tra thư mục tin cậy sẽ áp dụng cho đường dẫn đích đã phân giải.
- Theo mặc định, môi trường con `exec` là tối thiểu; truyền tường minh các biến bắt buộc bằng `passEnv`.
- Tham chiếu bí mật được phân giải tại thời điểm kích hoạt thành một snapshot trong bộ nhớ, sau đó các đường dẫn yêu cầu chỉ đọc snapshot đó.
- Lọc bề mặt hoạt động được áp dụng trong khi kích hoạt: tham chiếu chưa phân giải trên các bề mặt đã bật sẽ làm khởi động/tải lại thất bại, còn các bề mặt không hoạt động được bỏ qua kèm chẩn đoán.

---

## Lưu trữ xác thực

```json5
{
  auth: {
    profiles: {
      "anthropic:default": { provider: "anthropic", mode: "api_key" },
      "anthropic:work": { provider: "anthropic", mode: "api_key" },
      "openai:personal": { provider: "openai", mode: "oauth" },
    },
    order: {
      anthropic: ["anthropic:default", "anthropic:work"],
      openai: ["openai:personal"],
    },
  },
}
```

- Hồ sơ theo từng tác nhân được lưu tại `<agentDir>/auth-profiles.json`.
- `auth-profiles.json` hỗ trợ tham chiếu ở cấp giá trị (`keyRef` cho `api_key`, `tokenRef` cho `token`) cho các chế độ thông tin xác thực tĩnh.
- Các ánh xạ `auth-profiles.json` phẳng cũ như `{ "provider": { "apiKey": "..." } }` không phải là định dạng runtime; `openclaw doctor --fix` ghi lại chúng thành hồ sơ khóa API `provider:default` chuẩn, kèm bản sao lưu `.legacy-flat.*.bak`.
- Hồ sơ chế độ OAuth (`auth.profiles.<id>.mode = "oauth"`) không hỗ trợ thông tin xác thực hồ sơ xác thực dựa trên SecretRef.
- Thông tin xác thực runtime tĩnh đến từ các snapshot đã phân giải trong bộ nhớ; các mục `auth.json` tĩnh cũ sẽ bị xóa sạch khi được phát hiện.
- Các bản nhập OAuth cũ đến từ `~/.openclaw/credentials/oauth.json`.
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

- `billingBackoffHours`: thời gian chờ lùi cơ sở tính bằng giờ khi hồ sơ thất bại do lỗi thanh toán/không đủ tín dụng thực sự (mặc định: `5`). Văn bản thanh toán tường minh vẫn có thể rơi vào đây ngay cả với phản hồi `401`/`403`, nhưng các bộ khớp văn bản dành riêng cho nhà cung cấp vẫn chỉ nằm trong phạm vi nhà cung cấp sở hữu chúng (ví dụ OpenRouter `Key limit exceeded`). Các thông báo HTTP `402` có thể thử lại về cửa sổ sử dụng hoặc giới hạn chi tiêu của tổ chức/không gian làm việc vẫn đi theo đường `rate_limit`.
- `billingBackoffHoursByProvider`: các ghi đè tùy chọn theo từng nhà cung cấp cho số giờ chờ lùi thanh toán.
- `billingMaxHours`: giới hạn tính bằng giờ cho tăng trưởng lũy thừa của chờ lùi thanh toán (mặc định: `24`).
- `authPermanentBackoffMinutes`: thời gian chờ lùi cơ sở tính bằng phút cho các lỗi `auth_permanent` có độ tin cậy cao (mặc định: `10`).
- `authPermanentMaxMinutes`: giới hạn tính bằng phút cho tăng trưởng chờ lùi `auth_permanent` (mặc định: `60`).
- `failureWindowHours`: cửa sổ cuộn tính bằng giờ dùng cho bộ đếm chờ lùi (mặc định: `24`).
- `overloadedProfileRotations`: số lần xoay vòng hồ sơ xác thực tối đa trong cùng nhà cung cấp cho lỗi quá tải trước khi chuyển sang phương án dự phòng mô hình (mặc định: `1`). Các dạng nhà cung cấp bận như `ModelNotReadyException` rơi vào đây.
- `overloadedBackoffMs`: độ trễ cố định trước khi thử lại một lần xoay vòng nhà cung cấp/hồ sơ bị quá tải (mặc định: `0`).
- `rateLimitedProfileRotations`: số lần xoay vòng hồ sơ xác thực tối đa trong cùng nhà cung cấp cho lỗi giới hạn tốc độ trước khi chuyển sang phương án dự phòng mô hình (mặc định: `1`). Nhóm giới hạn tốc độ đó bao gồm văn bản theo dạng nhà cung cấp như `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` và `resource exhausted`.

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
- Đặt `logging.file` để dùng một đường dẫn ổn định.
- `consoleLevel` tăng lên `debug` khi có `--verbose`.
- `maxFileBytes`: kích thước tệp nhật ký đang hoạt động tối đa tính bằng byte trước khi xoay vòng (số nguyên dương; mặc định: `104857600` = 100 MB). OpenClaw giữ tối đa năm kho lưu trữ được đánh số bên cạnh tệp đang hoạt động.
- `redactSensitive` / `redactPatterns`: che dữ liệu theo nỗ lực tốt nhất cho đầu ra console, nhật ký tệp, bản ghi nhật ký OTLP và văn bản bản ghi phiên được lưu bền vững. `redactSensitive: "off"` chỉ tắt chính sách nhật ký/bản ghi chung này; các bề mặt an toàn UI/công cụ/chẩn đoán vẫn biên tập bí mật trước khi phát ra.

---

## Chẩn đoán

```json5
{
  diagnostics: {
    enabled: true,
    flags: ["telegram.*"],
    stuckSessionWarnMs: 30000,
    stuckSessionAbortMs: 300000,
    memoryPressureSnapshot: false,

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
      logsExporter: "otlp",
      sampleRate: 1.0,
      flushIntervalMs: 5000,
      captureContent: {
        enabled: false,
        inputMessages: false,
        outputMessages: false,
        toolInputs: false,
        toolOutputs: false,
        systemPrompt: false,
        toolDefinitions: false,
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

- `enabled`: công tắc chính cho đầu ra instrumentation (mặc định: `true`).
- `flags`: mảng chuỗi cờ bật đầu ra nhật ký có mục tiêu (hỗ trợ ký tự đại diện như `"telegram.*"` hoặc `"*"`).
- `stuckSessionWarnMs`: ngưỡng tuổi không có tiến triển tính bằng ms để phân loại các phiên xử lý chạy lâu là `session.long_running`, `session.stalled` hoặc `session.stuck`. Phản hồi, công cụ, trạng thái, khối và tiến triển ACP đặt lại bộ hẹn giờ; các chẩn đoán `session.stuck` lặp lại sẽ chờ lùi khi không thay đổi.
- `stuckSessionAbortMs`: ngưỡng tuổi không có tiến triển tính bằng ms trước khi công việc đang hoạt động bị kẹt đủ điều kiện có thể được hủy và xả để khôi phục. Khi chưa đặt, OpenClaw dùng cửa sổ chạy nhúng mở rộng an toàn hơn, tối thiểu 5 phút và 3 lần `stuckSessionWarnMs`.
- `memoryPressureSnapshot`: chụp một snapshot ổn định trước OOM đã biên tập khi áp lực bộ nhớ đạt `critical` (mặc định: `false`). Đặt thành `true` để thêm thao tác quét/ghi tệp gói ổn định trong khi vẫn giữ các sự kiện áp lực bộ nhớ bình thường.
- `otel.enabled`: bật pipeline xuất OpenTelemetry (mặc định: `false`). Để xem cấu hình đầy đủ, danh mục tín hiệu và mô hình quyền riêng tư, xem [Xuất OpenTelemetry](/vi/gateway/opentelemetry).
- `otel.endpoint`: URL collector cho xuất OTel.
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`: các endpoint OTLP tùy chọn dành riêng cho tín hiệu. Khi được đặt, chúng chỉ ghi đè `otel.endpoint` cho tín hiệu đó.
- `otel.protocol`: `"http/protobuf"` (mặc định) hoặc `"grpc"`.
- `otel.headers`: các header metadata HTTP/gRPC bổ sung được gửi cùng yêu cầu xuất OTel.
- `otel.serviceName`: tên dịch vụ cho thuộc tính tài nguyên.
- `otel.traces` / `otel.metrics` / `otel.logs`: bật xuất trace, metric hoặc nhật ký.
- `otel.logsExporter`: đích xuất nhật ký: `"otlp"` (mặc định), `"stdout"` cho một đối tượng JSON trên mỗi dòng stdout, hoặc `"both"`.
- `otel.sampleRate`: tỷ lệ lấy mẫu trace `0`-`1`.
- `otel.flushIntervalMs`: khoảng thời gian flush telemetry định kỳ tính bằng ms.
- `otel.captureContent`: tùy chọn bật ghi nội dung thô cho thuộc tính span OTEL. Mặc định là tắt. Boolean `true` ghi lại nội dung thông điệp/công cụ không thuộc hệ thống; dạng đối tượng cho phép bạn bật rõ ràng `inputMessages`, `outputMessages`, `toolInputs`, `toolOutputs`, `systemPrompt` và `toolDefinitions`.
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`: công tắc môi trường cho dạng span suy luận GenAI thử nghiệm mới nhất, bao gồm tên span `{gen_ai.operation.name} {gen_ai.request.model}`, loại span `CLIENT` và `gen_ai.provider.name` thay cho `gen_ai.system` cũ. Theo mặc định, span giữ `openclaw.model.call` và `gen_ai.system` để tương thích; metric GenAI dùng các thuộc tính ngữ nghĩa có giới hạn.
- `OPENCLAW_OTEL_PRELOADED=1`: công tắc môi trường cho các host đã đăng ký OpenTelemetry SDK toàn cục. Khi đó OpenClaw bỏ qua khởi động/tắt SDK do Plugin sở hữu trong khi vẫn giữ trình lắng nghe chẩn đoán hoạt động.
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`, `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` và `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`: biến môi trường endpoint dành riêng cho tín hiệu, được dùng khi khóa cấu hình tương ứng chưa được đặt.
- `cacheTrace.enabled`: ghi nhật ký các snapshot trace cache cho các lần chạy nhúng (mặc định: `false`).
- `cacheTrace.filePath`: đường dẫn đầu ra cho JSONL trace cache (mặc định: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`).
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: kiểm soát nội dung được đưa vào đầu ra trace cache (tất cả mặc định: `true`).

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

- `channel`: kênh phát hành cho bản cài npm/git - `"stable"`, `"beta"` hoặc `"dev"`.
- `checkOnStart`: kiểm tra cập nhật npm khi Gateway khởi động (mặc định: `true`).
- `auto.enabled`: bật tự động cập nhật nền cho bản cài gói (mặc định: `false`).
- `auto.stableDelayHours`: độ trễ tối thiểu tính bằng giờ trước khi tự động áp dụng kênh stable (mặc định: `6`; tối đa: `168`).
- `auto.stableJitterHours`: cửa sổ phân tán rollout bổ sung của kênh stable tính bằng giờ (mặc định: `12`; tối đa: `168`).
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

- `enabled`: cổng tính năng ACP toàn cục (mặc định: `true`; đặt `false` để ẩn điều phối ACP và các tiện ích spawn).
- `dispatch.enabled`: cổng độc lập cho điều phối lượt phiên ACP (mặc định: `true`). Đặt `false` để giữ các lệnh ACP khả dụng trong khi chặn thực thi.
- `backend`: id backend runtime ACP mặc định (phải khớp với một Plugin runtime ACP đã đăng ký).
  Cài đặt Plugin backend trước, và nếu `plugins.allow` được đặt, hãy bao gồm id Plugin backend (ví dụ `acpx`) nếu không backend ACP sẽ không tải.
- `defaultAgent`: id tác nhân ACP dự phòng khi các spawn không chỉ định mục tiêu rõ ràng.
- `allowedAgents`: danh sách cho phép các id tác nhân được phép dùng cho phiên runtime ACP; rỗng nghĩa là không có hạn chế bổ sung.
- `maxConcurrentSessions`: số phiên ACP đang hoạt động đồng thời tối đa.
- `stream.coalesceIdleMs`: cửa sổ flush khi nhàn rỗi tính bằng ms cho văn bản được stream.
- `stream.maxChunkChars`: kích thước chunk tối đa trước khi tách projection khối được stream.
- `stream.repeatSuppression`: chặn các dòng trạng thái/công cụ lặp lại theo từng lượt (mặc định: `true`).
- `stream.deliveryMode`: `"live"` stream tăng dần; `"final_only"` đệm cho đến khi có sự kiện kết thúc lượt.
- `stream.hiddenBoundarySeparator`: dấu phân tách trước văn bản hiển thị sau các sự kiện công cụ ẩn (mặc định: `"paragraph"`).
- `stream.maxOutputChars`: số ký tự đầu ra trợ lý tối đa được projection cho mỗi lượt ACP.
- `stream.maxSessionUpdateChars`: số ký tự tối đa cho các dòng trạng thái/cập nhật ACP được projection.
- `stream.tagVisibility`: bản ghi tên thẻ tới các ghi đè khả năng hiển thị boolean cho sự kiện được stream.
- `runtime.ttlMinutes`: TTL nhàn rỗi tính bằng phút cho worker phiên ACP trước khi đủ điều kiện dọn dẹp.
- `runtime.installCommand`: lệnh cài đặt tùy chọn để chạy khi bootstrap môi trường runtime ACP.

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

- `cli.banner.taglineMode` kiểm soát kiểu dòng giới thiệu của banner:
  - `"random"` (mặc định): các dòng giới thiệu hài hước/theo mùa được luân phiên.
  - `"default"`: dòng giới thiệu trung tính cố định (`All your chats, one OpenClaw.`).
  - `"off"`: không có văn bản dòng giới thiệu (tiêu đề/phiên bản banner vẫn hiển thị).
- Để ẩn toàn bộ banner (không chỉ các dòng giới thiệu), đặt env `OPENCLAW_HIDE_BANNER=1`.

---

## Trình hướng dẫn

Siêu dữ liệu được ghi bởi các luồng thiết lập có hướng dẫn của CLI (`onboard`, `configure`, `doctor`):

```json5
{
  wizard: {
    lastRunAt: "2026-01-01T00:00:00.000Z",
    lastRunVersion: "2026.1.4",
    lastRunCommit: "abc1234",
    lastRunCommand: "configure",
    lastRunMode: "local",
    securityAcknowledgedAt: "2026-01-01T00:00:00.000Z",
  },
}
```

---

## Danh tính

Xem các trường danh tính `agents.list` trong [Mặc định tác nhân](/vi/gateway/config-agents#agent-defaults).

---

## Cầu nối (cũ, đã bị loại bỏ)

Các bản dựng hiện tại không còn bao gồm cầu nối TCP. Các nút kết nối qua Gateway WebSocket. Các khóa `bridge.*` không còn là một phần của lược đồ cấu hình (xác thực sẽ thất bại cho đến khi chúng được loại bỏ; `openclaw doctor --fix` có thể loại bỏ các khóa không xác định).

<Accordion title="Cấu hình cầu nối cũ (tham khảo lịch sử)">

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
    maxConcurrentRuns: 8, // default; cron dispatch + isolated cron agent-turn execution
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

- `sessionRetention`: thời gian giữ các phiên chạy cron cô lập đã hoàn tất trước khi dọn khỏi `sessions.json`. Cũng kiểm soát việc dọn dẹp các transcript cron đã xóa được lưu trữ. Mặc định: `24h`; đặt `false` để tắt.
- `runLog.maxBytes`: được chấp nhận để tương thích với các nhật ký chạy cron cũ dựa trên tệp. Mặc định: `2_000_000` byte.
- `runLog.keepLines`: các hàng lịch sử chạy SQLite mới nhất được giữ lại cho mỗi job. Mặc định: `2000`.
- `webhookToken`: token bearer dùng để gửi cron webhook POST (`delivery.mode = "webhook"`), nếu bỏ qua thì không gửi header xác thực.
- `webhook`: URL Webhook dự phòng cũ đã ngừng khuyến nghị (http/https), được `openclaw doctor --fix` dùng để di chuyển các job đã lưu vẫn có `notify: true`; khi chạy, việc gửi sử dụng `delivery.mode="webhook"` theo từng job cùng với `delivery.to`, hoặc `delivery.completionDestination` khi giữ lại gửi thông báo.

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

- `maxAttempts`: số lần thử lại tối đa cho các cron job khi gặp lỗi tạm thời (mặc định: `3`; phạm vi: `0`-`10`).
- `backoffMs`: mảng độ trễ backoff tính bằng ms cho mỗi lần thử lại (mặc định: `[30000, 60000, 300000]`; 1-10 mục).
- `retryOn`: các loại lỗi kích hoạt thử lại - `"rate_limit"`, `"overloaded"`, `"network"`, `"timeout"`, `"server_error"`. Bỏ qua để thử lại tất cả các loại tạm thời.

Các job chạy một lần vẫn được bật cho đến khi hết số lần thử lại, sau đó bị tắt trong khi vẫn giữ trạng thái lỗi cuối cùng. Các job định kỳ dùng cùng chính sách thử lại lỗi tạm thời để chạy lại sau backoff trước mốc lên lịch tiếp theo; lỗi vĩnh viễn hoặc hết số lần thử lại lỗi tạm thời sẽ quay về lịch định kỳ bình thường với backoff lỗi.

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

- `enabled`: bật cảnh báo lỗi cho các cron job (mặc định: `false`).
- `after`: số lỗi liên tiếp trước khi một cảnh báo được kích hoạt (số nguyên dương, tối thiểu: `1`).
- `cooldownMs`: số mili giây tối thiểu giữa các cảnh báo lặp lại cho cùng một job (số nguyên không âm).
- `includeSkipped`: tính các lần chạy bị bỏ qua liên tiếp vào ngưỡng cảnh báo (mặc định: `false`). Các lần chạy bị bỏ qua được theo dõi riêng và không ảnh hưởng đến backoff lỗi thực thi.
- `mode`: chế độ gửi - `"announce"` gửi qua tin nhắn kênh; `"webhook"` đăng tới Webhook đã cấu hình.
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
- `channel`: ghi đè kênh cho gửi thông báo. `"last"` tái sử dụng kênh gửi đã biết gần nhất.
- `to`: đích thông báo rõ ràng hoặc URL Webhook. Bắt buộc cho chế độ Webhook.
- `accountId`: ghi đè tài khoản tùy chọn cho việc gửi.
- `delivery.failureDestination` theo từng job ghi đè mặc định toàn cục này.
- Khi không đặt đích lỗi toàn cục lẫn theo từng job, các job đã gửi qua `announce` sẽ quay về đích thông báo chính đó khi lỗi.
- `delivery.failureDestination` chỉ được hỗ trợ cho các job `sessionTarget="isolated"` trừ khi `delivery.mode` chính của job là `"webhook"`.

Xem [Cron Jobs](/vi/automation/cron-jobs). Các lần thực thi cron cô lập được theo dõi như [tác vụ nền](/vi/automation/tasks).

---

## Biến mẫu mô hình phương tiện

Các placeholder mẫu được mở rộng trong `tools.media.models[].args`:

| Biến               | Mô tả                                             |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | Toàn bộ nội dung tin nhắn đến                     |
| `{{RawBody}}`      | Nội dung thô (không có wrapper lịch sử/người gửi) |
| `{{BodyStripped}}` | Nội dung đã loại bỏ các đề cập nhóm               |
| `{{From}}`         | Định danh người gửi                               |
| `{{To}}`           | Định danh đích                                    |
| `{{MessageSid}}`   | id tin nhắn kênh                                  |
| `{{SessionId}}`    | UUID phiên hiện tại                               |
| `{{IsNewSession}}` | `"true"` khi phiên mới được tạo                   |
| `{{MediaUrl}}`     | Pseudo-URL phương tiện đến                        |
| `{{MediaPath}}`    | Đường dẫn phương tiện cục bộ                      |
| `{{MediaType}}`    | Loại phương tiện (hình ảnh/âm thanh/tài liệu/…)   |
| `{{Transcript}}`   | Transcript âm thanh                               |
| `{{Prompt}}`       | Prompt phương tiện đã phân giải cho các mục CLI   |
| `{{MaxChars}}`     | Số ký tự đầu ra tối đa đã phân giải cho các mục CLI |
| `{{ChatType}}`     | `"direct"` hoặc `"group"`                         |
| `{{GroupSubject}}` | Chủ đề nhóm (cố gắng tốt nhất)                    |
| `{{GroupMembers}}` | Xem trước thành viên nhóm (cố gắng tốt nhất)      |
| `{{SenderName}}`   | Tên hiển thị của người gửi (cố gắng tốt nhất)     |
| `{{SenderE164}}`   | Số điện thoại người gửi (cố gắng tốt nhất)        |
| `{{Provider}}`     | Gợi ý nhà cung cấp (whatsapp, telegram, discord, v.v.) |

---

## Bao gồm cấu hình (`$include`)

Tách cấu hình thành nhiều tệp:

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

**Hành vi hợp nhất:**

- Một tệp: thay thế đối tượng chứa nó.
- Mảng tệp: được hợp nhất sâu theo thứ tự (mục sau ghi đè mục trước).
- Khóa cùng cấp: được hợp nhất sau include (ghi đè các giá trị được include).
- Include lồng nhau: sâu tối đa 10 cấp.
- Đường dẫn: được phân giải tương đối với tệp đang include, nhưng phải nằm trong thư mục cấu hình cấp cao nhất (`dirname` của `openclaw.json`). Dạng tuyệt đối/`../` chỉ được phép khi sau khi phân giải vẫn nằm trong ranh giới đó. Đường dẫn không được chứa byte null và phải ngắn hơn nghiêm ngặt 4096 ký tự trước và sau khi phân giải.
- Các thao tác ghi do OpenClaw sở hữu chỉ thay đổi một phần cấp cao nhất được hỗ trợ bởi include một tệp sẽ ghi xuyên qua tệp được include đó. Ví dụ, `plugins install` cập nhật `plugins: { $include: "./plugins.json5" }` trong `plugins.json5` và giữ nguyên `openclaw.json`.
- Include gốc, mảng include, và include có ghi đè cùng cấp là chỉ đọc đối với các thao tác ghi do OpenClaw sở hữu; các thao tác ghi đó thất bại đóng thay vì làm phẳng cấu hình.
- Lỗi: thông báo rõ ràng cho tệp bị thiếu, lỗi phân tích cú pháp, include vòng, định dạng đường dẫn không hợp lệ, và độ dài quá mức.

---

_Liên quan: [Cấu hình](/vi/gateway/configuration) · [Ví dụ cấu hình](/vi/gateway/configuration-examples) · [Doctor](/vi/gateway/doctor)_

## Liên quan

- [Cấu hình](/vi/gateway/configuration)
- [Ví dụ cấu hình](/vi/gateway/configuration-examples)
