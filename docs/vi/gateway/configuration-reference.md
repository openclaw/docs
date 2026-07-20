---
read_when:
    - Bạn cần ngữ nghĩa cấu hình hoặc giá trị mặc định chính xác ở cấp trường dữ liệu
    - Bạn đang xác thực các khối cấu hình kênh, mô hình, Gateway hoặc công cụ
summary: Tham chiếu cấu hình Gateway cho các khóa OpenClaw cốt lõi, giá trị mặc định và liên kết đến tài liệu tham chiếu dành riêng cho từng hệ thống con
title: Tham chiếu cấu hình
x-i18n:
    generated_at: "2026-07-20T14:40:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: fc847d29653f3457b44ba6d3b7059329ac760e039f858ef7df5e081586b2e6f6
    source_path: gateway/configuration-reference.md
    workflow: 16
---

Tham chiếu cấp trường cho `~/.openclaw/openclaw.json`: các khóa, giá trị mặc định và liên kết đến các trang chuyên sâu hơn về hệ thống con. Để xem hướng dẫn thiết lập theo tác vụ, hãy xem [Cấu hình](/vi/gateway/configuration). Danh mục lệnh do kênh và plugin sở hữu cùng các tùy chọn chuyên sâu về bộ nhớ/QMD nằm trên các trang riêng, không phải ở đây.

Định dạng cấu hình là **JSON5** (cho phép chú thích + dấu phẩy cuối). Tất cả các trường đều là tùy chọn; OpenClaw sử dụng các giá trị mặc định an toàn khi chúng bị bỏ qua.

Mã nguồn là căn cứ chính xác hơn trang này:

- `openclaw config schema` in JSON Schema trực tiếp được dùng để xác thực và cho Control UI, trong đó siêu dữ liệu của gói tích hợp/plugin/kênh được hợp nhất.
- Agent nên gọi hành động công cụ `gateway` `config.schema.lookup` cho đúng một nút schema có phạm vi theo đường dẫn trước khi chỉnh sửa cấu hình.
- `pnpm config:docs:check` / `pnpm config:docs:gen` xác thực hàm băm cơ sở của tài liệu này dựa trên bề mặt schema hiện tại.

Các tài liệu tham chiếu chuyên sâu:

- [Tham chiếu cấu hình bộ nhớ](/vi/reference/memory-config) cho `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations` và cấu hình dreaming trong `plugins.entries.memory-core.config.dreaming`.
- [Lệnh gạch chéo](/vi/tools/slash-commands) cho danh mục lệnh tích hợp sẵn + đi kèm hiện tại.
- Các trang của kênh/plugin sở hữu bề mặt lệnh dành riêng cho từng kênh.

---

## Kênh

Các khóa cấu hình theo từng kênh nằm trong [Cấu hình - kênh](/vi/gateway/config-channels): `channels.*` cho Slack, Discord, Telegram, WhatsApp, Matrix, iMessage và các kênh đi kèm khác (xác thực, kiểm soát truy cập, nhiều tài khoản, kiểm soát đề cập).

## Giá trị mặc định của agent, nhiều agent, phiên và tin nhắn

Xem [Cấu hình - agent](/vi/gateway/config-agents) để biết:

- `agents.defaults.*` (không gian làm việc, mô hình, suy luận, Heartbeat, bộ nhớ, phương tiện, Skills, sandbox)
- `multiAgent.*` (định tuyến và liên kết nhiều agent)
- `session.*` (vòng đời phiên, Compaction, cắt tỉa)
- `messages.*` (phân phối tin nhắn, TTS, kết xuất markdown)
- `talk.*` (chế độ Talk)
  - `talk.consultThinkingLevel`: ghi đè mức suy luận cho toàn bộ lượt chạy agent OpenClaw đằng sau các phiên tư vấn thời gian thực Talk của Control UI
  - `talk.consultFastMode`: ghi đè chế độ nhanh một lần cho các phiên tư vấn thời gian thực Talk của Control UI
  - `talk.speechLocale`: mã định danh locale BCP 47 tùy chọn cho nhận dạng giọng nói Talk trên Android, iOS và macOS
  - `talk.silenceTimeoutMs`: khi chưa đặt, Talk giữ khoảng tạm dừng mặc định của nền tảng trước khi gửi bản chép lời (`700 ms on macOS and Android, 900 ms on iOS`)
  - `talk.realtime.consultRouting`: phương án dự phòng chuyển tiếp qua Gateway cho các bản chép lời Talk thời gian thực đã hoàn tất nhưng bỏ qua `openclaw_agent_consult`

## Công cụ và nhà cung cấp tùy chỉnh

Chính sách công cụ, các tùy chọn thử nghiệm, cấu hình công cụ dựa trên nhà cung cấp và thiết lập
nhà cung cấp / URL cơ sở tùy chỉnh nằm trong
[Cấu hình - công cụ và nhà cung cấp tùy chỉnh](/vi/gateway/config-tools).

## Mô hình

Định nghĩa nhà cung cấp, danh sách mô hình được phép và thiết lập nhà cung cấp tùy chỉnh nằm trong
[Cấu hình - công cụ và nhà cung cấp tùy chỉnh](/vi/gateway/config-tools#custom-providers-and-base-urls).
Gốc `models` cũng quản lý hành vi toàn cục của danh mục mô hình.

```json5
{
  models: {
    // Tùy chọn. Mặc định: true. Cần khởi động lại Gateway khi thay đổi.
    pricing: { enabled: false },
  },
}
```

- `models.mode`: hành vi danh mục nhà cung cấp (`merge` hoặc `replace`).
- `models.providers`: ánh xạ nhà cung cấp tùy chỉnh được lập chỉ mục theo mã định danh nhà cung cấp.
- `models.providers.*.localService`: trình quản lý tiến trình theo nhu cầu tùy chọn cho
  các máy chủ mô hình cục bộ. OpenClaw thăm dò điểm cuối kiểm tra tình trạng đã cấu hình, khởi chạy
  `command` tuyệt đối khi cần, chờ trạng thái sẵn sàng rồi gửi yêu cầu
  mô hình. Xem [Dịch vụ mô hình cục bộ](/vi/gateway/local-model-services).
- `models.pricing.enabled`: kiểm soát quá trình khởi tạo giá nền
  bắt đầu sau khi các sidecar và kênh đi đến đường dẫn sẵn sàng của Gateway. Khi `false`,
  Gateway bỏ qua việc tìm nạp danh mục giá của OpenRouter và LiteLLM; các giá trị
  `models.providers.*.models[].cost` đã cấu hình vẫn hoạt động cho ước tính chi phí cục bộ.

## MCP

Các định nghĩa máy chủ MCP do OpenClaw quản lý nằm trong `mcp.servers` và được
OpenClaw nhúng cùng các bộ điều hợp thời gian chạy khác sử dụng. Các lệnh `openclaw mcp list`,
`show`, `set` và `unset` quản lý khối này mà không kết nối đến
máy chủ đích trong khi chỉnh sửa cấu hình.

```json5
{
  mcp: {
    servers: {
      docs: {
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-fetch"],
      },
      remote: {
        url: "https://example.com/mcp",
        transport: "streamable-http", // streamable-http | sse
        requestTimeoutMs: 20000,
        connectionTimeoutMs: 5000,
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
        // Các tùy chọn kiểm soát ánh xạ Codex app-server tùy chọn.
        codex: {
          agents: ["main"],
          defaultToolsApprovalMode: "approve", // auto | prompt | approve
        },
      },
    },
  },
}
```

- `mcp.servers`: các định nghĩa máy chủ MCP stdio hoặc từ xa có tên dành cho những thời gian chạy
  cung cấp các công cụ MCP đã cấu hình.
  Các mục từ xa sử dụng `transport: "streamable-http"` hoặc `transport: "sse"`;
  `type: "http"` là bí danh dành riêng cho CLI mà `openclaw mcp set` và
  `openclaw doctor --fix` chuẩn hóa thành trường chính tắc `transport`.
- `mcp.servers.<name>.enabled`: đặt `false` để giữ định nghĩa máy chủ đã lưu
  nhưng loại máy chủ đó khỏi quá trình khám phá MCP và ánh xạ công cụ của OpenClaw nhúng.
- `mcp.servers.<name>.requestTimeoutMs`: thời gian chờ yêu cầu MCP theo từng máy chủ, tính bằng mili giây.
- `mcp.servers.<name>.connectionTimeoutMs`: thời gian chờ kết nối theo từng máy chủ, tính bằng mili giây.
- `mcp.servers.<name>.supportsParallelToolCalls`: gợi ý đồng thời tùy chọn cho
  các bộ điều hợp có thể chọn có thực hiện song song các lệnh gọi công cụ MCP hay không.
- `mcp.servers.<name>.auth`: đặt `"oauth"` cho các máy chủ MCP HTTP yêu cầu
  OAuth. Chạy `openclaw mcp login <name>` để lưu token trong trạng thái OpenClaw.
- `mcp.servers.<name>.oauth`: các ghi đè tùy chọn cho phạm vi OAuth, URL chuyển hướng và URL
  siêu dữ liệu máy khách.
- `mcp.servers.<name>.sslVerify`, `clientCert`, `clientKey`: các tùy chọn kiểm soát TLS HTTP
  cho điểm cuối riêng tư và TLS hai chiều.
- `mcp.servers.<name>.toolFilter`: lựa chọn công cụ tùy chọn theo từng máy chủ. `include`
  giới hạn các công cụ MCP được khám phá ở những tên khớp; `exclude` ẩn những
  tên khớp. Các mục là tên công cụ MCP chính xác hoặc mẫu glob `*` đơn giản. Máy chủ có
  tài nguyên hoặc prompt cũng tạo tên công cụ tiện ích (`resources_list`,
  `resources_read`, `prompts_list`, `prompts_get`) và các tên đó sử dụng cùng
  bộ lọc.
- `mcp.servers.<name>.codex`: các tùy chọn kiểm soát ánh xạ Codex app-server tùy chọn.
  Khối này chỉ là siêu dữ liệu OpenClaw cho các luồng Codex app-server; nó không
  ảnh hưởng đến phiên ACP, cấu hình harness Codex chung hoặc các bộ điều hợp thời gian chạy khác.
  `codex.agents` không rỗng giới hạn máy chủ ở các mã định danh agent OpenClaw được liệt kê.
  Danh sách agent có phạm vi rỗng, chỉ chứa khoảng trắng hoặc không hợp lệ sẽ bị quá trình xác thực cấu hình
  từ chối và bị đường dẫn ánh xạ thời gian chạy bỏ qua thay vì trở thành toàn cục.
  `codex.defaultToolsApprovalMode` phát ra
  `default_tools_approval_mode` gốc của Codex cho máy chủ đó. OpenClaw loại bỏ khối `codex`
  trước khi chuyển cấu hình `mcp_servers` gốc cho Codex. Bỏ qua khối này để
  máy chủ tiếp tục được ánh xạ cho mọi agent Codex app-server với hành vi
  phê duyệt MCP mặc định của Codex.
- Các thời gian chạy MCP đi kèm có phạm vi theo phiên sử dụng TTL nhàn rỗi tích hợp là 10 phút.
  Các lượt chạy nhúng một lần yêu cầu dọn dẹp khi kết thúc lượt chạy; TTL là cơ chế dự phòng cho các phiên tồn tại lâu và bên gọi trong tương lai.
- Các thay đổi trong `mcp.*` được áp dụng nóng bằng cách loại bỏ các thời gian chạy MCP theo phiên đã lưu đệm.
  Lần khám phá/sử dụng công cụ tiếp theo sẽ tạo lại chúng từ cấu hình mới, vì vậy các mục
  `mcp.servers` đã bị xóa được thu hồi ngay thay vì chờ TTL nhàn rỗi.
- Quá trình khám phá thời gian chạy cũng tuân theo thông báo thay đổi danh sách công cụ MCP bằng cách loại bỏ
  danh mục đã lưu đệm cho phiên đó. Máy chủ quảng bá tài nguyên hoặc
  prompt sẽ nhận các công cụ tiện ích để liệt kê/đọc tài nguyên và liệt kê/tìm nạp
  prompt. Khi lệnh gọi công cụ liên tục thất bại, máy chủ bị ảnh hưởng sẽ tạm dừng trong thời gian ngắn trước khi
  thử một lệnh gọi khác.

Xem [MCP](/vi/cli/mcp#openclaw-as-an-mcp-client-registry) và
[Backend CLI](/vi/gateway/cli-backends#bundle-mcp-overlays) để biết hành vi thời gian chạy.

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
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // hoặc chuỗi văn bản thuần túy
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

- `allowBundled`: danh sách cho phép tùy chọn chỉ dành cho các skill đi kèm (không ảnh hưởng đến skill được quản lý/trong không gian làm việc).
- `load.extraDirs`: các thư mục gốc skill dùng chung bổ sung (độ ưu tiên thấp nhất).
- `load.allowSymlinkTargets`: các thư mục gốc đích thực đáng tin cậy mà liên kết tượng trưng của skill có thể
  phân giải đến khi liên kết nằm ngoài thư mục gốc nguồn đã cấu hình.
- `workshop.allowSymlinkTargetWrites`: cho phép thao tác áp dụng của Skill Workshop ghi
  thông qua các đích liên kết tượng trưng đã đáng tin cậy (mặc định: false).
- `install.preferBrew`: khi là true, ưu tiên trình cài đặt Homebrew nếu `brew`
  khả dụng trước khi chuyển sang các loại trình cài đặt khác.
- `install.nodeManager`: tùy chọn ưu tiên trình cài đặt Node cho các đặc tả `metadata.openclaw.install`
  (`npm` | `pnpm` | `yarn` | `bun`).
- `install.allowUploadedArchives`: cho phép các máy khách Gateway `operator.admin` đáng tin cậy
  cài đặt kho lưu trữ zip riêng tư được chuẩn bị qua `skills.upload.*`
  (mặc định: false). Tùy chọn này chỉ bật đường dẫn kho lưu trữ đã tải lên; các lượt cài đặt ClawHub
  thông thường không yêu cầu tùy chọn này.
- `entries.<skillKey>.enabled: false` vô hiệu hóa một skill ngay cả khi skill đó đi kèm/đã được cài đặt.
- `entries.<skillKey>.apiKey`: tiện ích cho các skill khai báo biến môi trường chính (chuỗi văn bản thuần túy hoặc đối tượng SecretRef).
- `limits.maxCandidatesPerRoot`, `limits.maxSkillsLoadedPerSource`, `limits.maxSkillsInPrompt`, `limits.maxSkillsPromptChars`, `limits.maxSkillFileBytes`: giới hạn quá trình khám phá skill và prompt Skills hướng đến mô hình.
- Các thiết lập quyền tự chủ/phê duyệt của Skill Workshop (`workshop.autonomous.enabled`, `workshop.approvalPolicy`, `workshop.maxPending`, `workshop.maxSkillBytes`) được ghi lại trong [Cấu hình Skills](/vi/tools/skills-config).

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

- Được tải từ các thư mục gói hoặc bundle bên dưới `~/.openclaw/extensions` và `<workspace>/.openclaw/extensions`, cùng với các tệp hoặc thư mục được liệt kê trong `plugins.load.paths`.
- Đặt các tệp plugin độc lập trong `plugins.load.paths`; các thư mục gốc tiện ích mở rộng được tự động phát hiện sẽ bỏ qua các tệp `.js`, `.mjs` và `.ts` ở cấp cao nhất để các tập lệnh trợ giúp trong những thư mục gốc đó không chặn quá trình khởi động.
- Cơ chế khám phá chấp nhận các plugin OpenClaw gốc cùng các bundle Codex và bundle Claude tương thích, bao gồm cả bundle bố cục mặc định của Claude không có manifest.
- **Các thay đổi cấu hình yêu cầu khởi động lại Gateway.**
- `allow`: danh sách cho phép tùy chọn (chỉ các plugin được liệt kê mới tải). `deny` được ưu tiên.
- `plugins.entries.<id>.apiKey`: trường tiện ích khóa API cấp plugin (khi plugin hỗ trợ).
- `plugins.entries.<id>.env`: ánh xạ biến môi trường theo phạm vi plugin.
- `plugins.entries.<id>.hooks.allowPromptInjection`: khi `false`, lõi sẽ chặn các hook sửa đổi prompt như `before_prompt_build`. Áp dụng cho các hook plugin gốc và các thư mục hook do bundle cung cấp được hỗ trợ.
- `plugins.entries.<id>.hooks.allowConversationAccess`: khi `true`, các plugin không đi kèm nhưng đáng tin cậy có thể đọc nội dung hội thoại thô từ các hook có kiểu như `llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize` và `agent_end`.
- `plugins.entries.<id>.subagent.allowModelOverride`: tin cậy rõ ràng plugin này để yêu cầu ghi đè `provider` và `model` theo từng lượt chạy cho các lượt chạy tác tử con trong nền.
- `plugins.entries.<id>.subagent.allowedModels`: danh sách cho phép tùy chọn gồm các đích `provider/model` chuẩn hóa dành cho ghi đè tác tử con đáng tin cậy. Chỉ sử dụng `"*"` khi bạn chủ ý muốn cho phép bất kỳ mô hình nào.
- `plugins.entries.<id>.llm.allowModelOverride`: tin cậy rõ ràng plugin này để yêu cầu ghi đè mô hình cho `api.runtime.llm.complete`.
- `plugins.entries.<id>.llm.allowedModels`: danh sách cho phép tùy chọn gồm các đích `provider/model` chuẩn hóa dành cho ghi đè hoàn thành LLM của plugin đáng tin cậy. Chỉ sử dụng `"*"` khi bạn chủ ý muốn cho phép bất kỳ mô hình nào.
- `plugins.entries.<id>.llm.allowAgentIdOverride`: tin cậy rõ ràng plugin này để chạy `api.runtime.llm.complete` với một mã định danh tác tử không mặc định.
- `plugins.entries.<id>.config`: đối tượng cấu hình do plugin định nghĩa (được xác thực bằng lược đồ plugin OpenClaw gốc khi có).
- Các thiết lập tài khoản/thời gian chạy của plugin kênh nằm bên dưới `channels.<id>` và phải được mô tả bằng siêu dữ liệu `channelConfigs` trong manifest của plugin sở hữu, thay vì bằng một sổ đăng ký tùy chọn OpenClaw tập trung.

### Cấu hình plugin bộ khung Codex

Plugin `codex` đi kèm sở hữu các thiết lập bộ khung app-server Codex gốc bên dưới
`plugins.entries.codex.config`. Xem
[tài liệu tham khảo bộ khung Codex](/vi/plugins/codex-harness-reference) để biết toàn bộ bề mặt cấu hình
và [bộ khung Codex](/vi/plugins/codex-harness) để biết mô hình thời gian chạy.

`codexPlugins` chỉ áp dụng cho các phiên chọn bộ khung Codex gốc.
Nó không bật plugin Codex cho các lượt chạy nhà cung cấp OpenClaw, liên kết hội thoại
ACP hoặc bất kỳ bộ khung nào không phải Codex.

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          codexPlugins: {
            enabled: true,
            allow_all_plugins: true,
            allow_destructive_actions: "auto",
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

- `plugins.entries.codex.config.codexPlugins.enabled`: bật khả năng hỗ trợ
  plugin/ứng dụng Codex gốc cho bộ khung Codex. Mặc định: `false`.
- `plugins.entries.codex.config.codexPlugins.allow_all_plugins`: đưa mọi
  ứng dụng hiện có thể truy cập được kết nối với tài khoản Codex đã xác thực vào
  từng luồng Codex gốc mới. Mặc định: `false`.
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions`:
  chính sách hành động phá hủy mặc định cho các yêu cầu tương tác của ứng dụng plugin đã cấu hình.
  Sử dụng `true` để chấp nhận các lược đồ phê duyệt Codex an toàn mà không nhắc, `false`
  để từ chối chúng, `"auto"` để định tuyến các phê duyệt mà Codex yêu cầu thông qua
  phê duyệt plugin OpenClaw, hoặc `"ask"` để nhắc cho mọi hành động ghi/phá hủy
  của plugin mà không có phê duyệt lâu dài. Chế độ `"ask"` xóa các ghi đè phê duyệt Codex
  lâu dài theo từng công cụ cho ứng dụng bị ảnh hưởng và chọn người review
  phê duyệt là con người cho ứng dụng đó trước khi luồng Codex bắt đầu.
  Mặc định: `true`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.enabled`: bật một
  mục plugin đã cấu hình khi `codexPlugins.enabled` toàn cục cũng là true.
  Mặc định: `true` cho các mục khai báo rõ ràng.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.marketplaceName`:
  danh tính marketplace ổn định, bắt buộc cùng với `pluginName` cho mọi
  mục đã phân giải. Hỗ trợ `"openai-curated"` và `"workspace-directory"`. Các mục
  thiếu một trong hai trường danh tính sẽ bị bỏ qua.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.pluginName`: danh tính
  plugin Codex ổn định, bắt buộc cùng với `marketplaceName`. Một
  mục `workspace-directory` phải sử dụng chính xác `summary.id`
  có định danh marketplace do `plugin/list` trả về, ví dụ
  `"example-plugin@workspace-directory"`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.allow_destructive_actions`:
  ghi đè hành động phá hủy theo từng plugin. Khi bị lược bỏ, giá trị
  `allow_destructive_actions` toàn cục sẽ được sử dụng. Giá trị theo từng plugin chấp nhận
  cùng các chính sách `true`, `false`, `"auto"` hoặc `"ask"`.

Mỗi ứng dụng plugin được chấp nhận sử dụng `"ask"` sẽ định tuyến các yêu cầu phê duyệt
của ứng dụng đó đến người review là con người. Các ứng dụng khác và những phê duyệt luồng không thuộc ứng dụng
vẫn giữ người review đã cấu hình, vì vậy các chính sách plugin hỗn hợp không kế thừa
hành vi `"ask"`.

`codexPlugins.enabled` là chỉ thị bật toàn cục. Các mục plugin khai báo rõ ràng
do quá trình di chuyển ghi lại là tập hợp đủ điều kiện cài đặt và sửa chữa được tuyển chọn lâu dài.
Các mục `workspace-directory` được cấu hình thủ công phải đã được
cài đặt và bật, đồng thời các ứng dụng thuộc sở hữu của chúng phải có thể truy cập được; OpenClaw
không cài đặt hoặc xác thực chúng. Nếu Codex từ chối yêu cầu danh mục không gian làm việc rõ ràng,
các mục không gian làm việc đã bật sẽ đóng khi lỗi với
`marketplace_missing`, trong khi các mục được tuyển chọn từ danh mục mặc định vẫn
khả dụng. `plugins["*"]` không được hỗ trợ, không có công tắc `install`, và
các giá trị `marketplacePath` cục bộ chủ ý không phải là trường cấu hình vì chúng
phụ thuộc vào máy chủ. Xem
[Plugin Codex gốc](/vi/plugins/codex-native-plugins) để biết các yêu cầu về phiên bản app-server và
mức độ sẵn sàng.

Các bước kiểm tra mức độ sẵn sàng `app/list` được lưu vào bộ nhớ đệm trong một giờ và được làm mới
bất đồng bộ khi đã cũ. Cấu hình ứng dụng luồng Codex được tính toán khi thiết lập phiên
bộ khung Codex, không phải ở mỗi lượt; hãy sử dụng `/new`, `/reset` hoặc khởi động lại Gateway
sau khi thay đổi cấu hình plugin gốc.

`codexPlugins.allow_all_plugins` chụp nhanh mọi ứng dụng tài khoản hiện có thể truy cập
vào từng luồng Codex gốc mới. Nó không cài đặt plugin hoặc ứng dụng, và
các ứng dụng không thể truy cập vẫn bị loại trừ. Các ứng dụng tài khoản sử dụng chính sách
`codexPlugins.allow_destructive_actions` toàn cục. Các mục plugin khai báo rõ ràng được
ưu tiên khi cùng một ứng dụng xuất hiện ở cả hai đường dẫn. Nếu không thể đọc
`app/list`, việc hiển thị trên toàn tài khoản sẽ đóng khi lỗi.

- `plugins.entries.firecrawl.config.webFetch`: thiết lập nhà cung cấp tìm nạp web Firecrawl.
  - `apiKey`: Khóa API Firecrawl tùy chọn để có hạn mức cao hơn (chấp nhận SecretRef). Dự phòng sang biến môi trường `plugins.entries.firecrawl.config.webSearch.apiKey` hoặc `FIRECRAWL_API_KEY`.
  - `baseUrl`: URL cơ sở API Firecrawl (mặc định: `https://api.firecrawl.dev`; các ghi đè tự lưu trữ phải trỏ đến điểm cuối riêng tư/nội bộ).
  - `onlyMainContent`: chỉ trích xuất nội dung chính từ các trang (mặc định: `true`).
  - `maxAgeMs`: tuổi tối đa của bộ nhớ đệm tính bằng mili giây (mặc định: `172800000` / 2 ngày).
  - `timeoutSeconds`: thời gian chờ yêu cầu thu thập dữ liệu tính bằng giây (mặc định: `60`).
- `plugins.entries.xai.config.xSearch`: thiết lập xAI X Search (tìm kiếm web Grok).
  - `enabled`: bật nhà cung cấp X Search.
  - `model`: mô hình Grok dùng để tìm kiếm (ví dụ: `"grok-4.3"`).
- `plugins.entries.memory-core.config.dreaming`: thiết lập Dreaming cho bộ nhớ. Xem [Dreaming](/vi/concepts/dreaming) để biết các giai đoạn và ngưỡng.
  - `enabled`: công tắc Dreaming chính (mặc định `false`).
  - `frequency`: nhịp Cron cho mỗi lượt quét Dreaming đầy đủ (mặc định là `"0 3 * * *"`).
  - `model`: ghi đè mô hình tác tử con Dream Diary tùy chọn. Yêu cầu `plugins.entries.memory-core.subagent.allowModelOverride: true`; kết hợp với `allowedModels` để giới hạn các đích. Lỗi mô hình không khả dụng sẽ thử lại một lần bằng mô hình mặc định của phiên; lỗi tin cậy hoặc danh sách cho phép không âm thầm dự phòng.
  - chính sách giai đoạn và các ngưỡng là chi tiết triển khai (không phải khóa cấu hình dành cho người dùng).
- Cấu hình bộ nhớ đầy đủ nằm trong [tài liệu tham khảo cấu hình bộ nhớ](/vi/reference/memory-config):
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Các plugin bundle Claude đã bật cũng có thể đóng góp các giá trị mặc định OpenClaw nhúng từ `settings.json`; OpenClaw áp dụng chúng dưới dạng thiết lập tác tử đã được làm sạch, không phải bản vá cấu hình OpenClaw thô.
- `plugins.slots.memory`: chọn mã định danh plugin bộ nhớ đang hoạt động hoặc `"none"` để tắt các plugin bộ nhớ.
- `plugins.slots.contextEngine`: chọn mã định danh plugin công cụ ngữ cảnh đang hoạt động; mặc định là `"legacy"` trừ khi bạn cài đặt và chọn một công cụ khác.

Xem [Plugin](/vi/tools/plugin).

---

## Cam kết

`commitments` kiểm soát bộ nhớ theo dõi tiếp được suy luận: OpenClaw có thể phát hiện các lần kiểm tra lại từ các lượt hội thoại và chuyển chúng qua các lượt chạy Heartbeat.

- `commitments.enabled`: bật tính năng trích xuất LLM ẩn, lưu trữ và phân phối qua Heartbeat cho các cam kết theo dõi tiếp được suy luận. Mặc định: `false`.
- `commitments.maxPerDay`: số cam kết theo dõi tiếp được suy luận tối đa được phân phối trong mỗi phiên tác tử trong một ngày luân phiên. Mặc định: `3`.

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
      // dangerouslyAllowPrivateNetwork: true, // chỉ chọn tham gia khi truy cập mạng riêng đáng tin cậy
      // allowPrivateNetwork: true, // bí danh cũ
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
- `tabCleanup` kiểm soát việc dọn dẹp định kỳ theo cơ chế nỗ lực tối đa đối với các tab của tác nhân chính đang được theo dõi
  sau thời gian không hoạt động hoặc khi một phiên vượt quá giới hạn. Việc theo dõi chỉ áp dụng
  cho các tab do công cụ trình duyệt `action: "open"` tạo; các tab do người dùng mở hoặc
  không xác định được chủ sở hữu sẽ không bao giờ được tiếp quản. Việc vô hiệu hóa `tabCleanup` không vô hiệu hóa thao tác dọn dẹp vòng đời phiên rõ ràng.
- Các lần mở cục bộ trên máy chủ với đích CDP gốc ổn định và danh tính trình duyệt
  được lưu trong trạng thái SQLite dùng chung và vẫn đủ điều kiện qua các lần khởi động lại Gateway để
  `/new` và dọn dẹp vòng đời phiên. Các đích CDP gốc hướng đến công cụ cũng
  vẫn đủ điều kiện để dọn dẹp theo thời gian không hoạt động và giới hạn sau khi khởi động lại. Chrome MCP sử dụng
  các handle đích cục bộ theo tiến trình, vì vậy các bản ghi phiên hiện có ở trạng thái nguội sẽ chờ
  dọn dẹp vòng đời thay vì có nguy cơ bị quét do không hoạt động đối với hoạt động sau khi khởi động lại
  không thể quy thuộc. OpenClaw xác minh hồ sơ và phiên bản trình duyệt
  trước khi đóng. Tính năng tự động kết nối của Chrome MCP, danh tính trình duyệt `/json/version`
  bị thiếu và các đích gốc chưa phân giải vẫn hoàn toàn cục bộ theo tiến trình, vì vậy chúng
  không tự động bị đóng sau khi khởi động lại. Các tab cũ không được theo dõi cần
  được đóng thủ công. Các lỗi tạm thời vẫn ở trạng thái chờ để thử lại sau. Xem
  [Quyền sở hữu việc dọn dẹp tab](/vi/tools/browser#tab-cleanup-ownership).
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` bị vô hiệu hóa khi không được đặt, vì vậy điều hướng trình duyệt vẫn nghiêm ngặt theo mặc định.
- Chỉ đặt `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` khi bạn chủ động tin tưởng việc điều hướng trình duyệt trong mạng riêng.
- Ở chế độ nghiêm ngặt, các điểm cuối hồ sơ CDP từ xa (`profiles.*.cdpUrl`) chịu cùng cơ chế chặn mạng riêng trong quá trình kiểm tra khả năng truy cập/phát hiện.
- `ssrfPolicy.allowPrivateNetwork` vẫn được hỗ trợ dưới dạng bí danh cũ.
- Ở chế độ nghiêm ngặt, hãy dùng `ssrfPolicy.hostnameAllowlist` và `ssrfPolicy.allowedHostnames` cho các ngoại lệ rõ ràng.
- Các hồ sơ từ xa chỉ cho phép đính kèm (khởi động/dừng/đặt lại bị vô hiệu hóa).
- `profiles.*.cdpUrl` chấp nhận `http://`, `https://`, `ws://` và `wss://`.
  Sử dụng HTTP(S) khi bạn muốn OpenClaw phát hiện `/json/version`; sử dụng WS(S)
  khi nhà cung cấp cung cấp cho bạn URL WebSocket DevTools trực tiếp.
- Nếu có thể truy cập một dịch vụ CDP được quản lý bên ngoài qua loopback, hãy đặt
  `attachOnly: true` của hồ sơ đó; nếu không, OpenClaw coi cổng loopback là một
  hồ sơ trình duyệt được quản lý cục bộ và có thể báo lỗi quyền sở hữu cổng cục bộ.
- Các hồ sơ `existing-session` sử dụng Chrome MCP thay vì CDP và có thể đính kèm trên
  máy chủ đã chọn hoặc thông qua một Node trình duyệt đã kết nối.
- Các hồ sơ `existing-session` có thể đặt `userDataDir` để nhắm đến một
  hồ sơ trình duyệt dựa trên Chromium cụ thể như Brave hoặc Edge.
- Các hồ sơ `existing-session` có thể đặt `cdpUrl` khi Chrome đang chạy
  phía sau một điểm cuối khám phá HTTP(S) DevTools hoặc điểm cuối WS(S) trực tiếp. Trong chế độ đó,
  OpenClaw chuyển điểm cuối cho Chrome MCP thay vì sử dụng tính năng tự động kết nối;
  `userDataDir` bị bỏ qua đối với các đối số khởi chạy Chrome MCP.
- Các hồ sơ `existing-session` duy trì các giới hạn định tuyến Chrome MCP hiện tại:
  các hành động dựa trên ảnh chụp/tham chiếu thay vì nhắm mục tiêu bằng bộ chọn CSS, hook tải lên
  một tệp, không ghi đè thời gian chờ hộp thoại, không có `wait --load networkidle`, và không có
  `responsebody`, xuất PDF, chặn tải xuống hoặc hành động hàng loạt.
- Các hồ sơ `openclaw` được quản lý cục bộ tự động gán `cdpPort` và `cdpUrl`; chỉ đặt
  `cdpUrl` một cách rõ ràng cho hồ sơ CDP từ xa hoặc thao tác đính kèm điểm cuối
  của phiên hiện có.
- Các hồ sơ được quản lý cục bộ có thể đặt `executablePath` để ghi đè
  `browser.executablePath` toàn cục cho hồ sơ đó. Hãy dùng tính năng này để chạy một hồ sơ trong
  Chrome và một hồ sơ khác trong Brave.
- Thứ tự tự động phát hiện: trình duyệt mặc định nếu dựa trên Chromium → Chrome → Brave → Edge → Chromium → Chrome Canary.
- Cả `browser.executablePath` và `browser.profiles.<name>.executablePath`
  đều chấp nhận `~` và `~/...` cho thư mục chính của hệ điều hành trước khi khởi chạy Chromium.
  `userDataDir` theo từng hồ sơ trên các hồ sơ `existing-session` cũng được mở rộng dấu ngã.
- Dịch vụ điều khiển: chỉ loopback (cổng được suy ra từ `gateway.port`, mặc định `18791`).
- `extraArgs` nối thêm các cờ khởi chạy bổ sung khi khởi động Chromium cục bộ (ví dụ
  `--disable-gpu`, định kích thước cửa sổ hoặc cờ gỡ lỗi).

---

## Giao diện người dùng

```json5
{
  ui: {
    seamColor: "#FF4500",
    assistant: {
      name: "OpenClaw",
      avatar: "CB", // emoji, văn bản ngắn, URL hình ảnh hoặc URI dữ liệu
    },
    prefs: {
      theme: "claw", // claw | knot | dash | custom
      themeMode: "system", // light | dark | system
      textScale: 100, // 90 | 100 | 110 | 125 | 140
      locale: "en",
      chatShowThinking: true,
      chatShowToolCalls: true,
      chatPersistCommentary: true, // Giữ phần bình luận sau các lượt chạy trong giao diện điều khiển; không gửi phần này đến các kênh
      chatSendShortcut: "enter", // enter | modifier-enter
      chatFollowUpMode: "steer", // steer | queue; bỏ qua để sử dụng chế độ hàng đợi của máy chủ
    },
  },
}
```

- `seamColor`: màu nhấn cho phần khung giao diện người dùng của ứng dụng gốc (sắc màu bong bóng Chế độ trò chuyện, v.v.).
- `assistant`: ghi đè danh tính giao diện điều khiển. Dự phòng về danh tính tác nhân đang hoạt động.
- `prefs`: tùy chọn hiển thị của người vận hành. Đây là nơi lưu trữ chuẩn để các tác nhân có thể
  thay đổi chúng thông qua cổng phê duyệt và mọi máy khách giao diện điều khiển luôn được
  đồng bộ; trình duyệt phản chiếu các giá trị vào bộ nhớ cục bộ để khởi động tức thì và giữ
  một bản sao cục bộ trên thiết bị khi không thể ghi cấu hình (phạm vi người xem, ngoại tuyến).
  `chatPersistCommentary` mặc định là `true`. Đặt thành `false` sẽ giữ phần
  bình luận trực tiếp hiển thị trong một lượt chạy nhưng xóa phần này khi hoàn tất và ngăn phần
  bình luận Codex mới đi vào bản phản chiếu bản chép lời bền vững. Việc gửi qua kênh nhắn tin
  vẫn tách biệt và không thay đổi.
  Các máy khách đã kết nối áp dụng trực tiếp các thay đổi phía máy chủ: Gateway phát một
  sự kiện `config.changed` chỉ chứa hàm băm sau mỗi lần ghi cấu hình được duy trì và
  các máy khách làm mới ảnh chụp trạng thái của mình (bỏ qua khi bản nháp cài đặt cục bộ có
  các chỉnh sửa chưa lưu). Các máy khách kết nối lại sẽ đối soát khi kết nối.

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
      // password: "your-password", // hoặc OPENCLAW_GATEWAY_PASSWORD
      // trustedProxy: { userHeader: "x-forwarded-user" }, // dành cho mode=trusted-proxy; xem /gateway/trusted-proxy-auth
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
      // toolTitles: false, // chọn tham gia tiêu đề mục đích do AI tạo cho các lệnh gọi công cụ (tiêu tốn token của mô hình tiện ích)
      // embedSandbox: "scripts", // strict | scripts | trusted
      // allowExternalEmbedUrls: false, // nguy hiểm: cho phép URL nhúng http(s) tuyệt đối bên ngoài
      // chatMessageMaxWidth: "min(1280px, 82%)", // chiều rộng tối đa tùy chọn của bản chép lời trò chuyện được căn giữa
      // allowedOrigins: ["https://control.example.com"], // bắt buộc đối với giao diện điều khiển không dùng loopback
      // dangerouslyAllowHostHeaderOriginFallback: false, // chế độ dự phòng nguồn gốc theo tiêu đề Host nguy hiểm
      // allowInsecureAuth: false,
      // dangerouslyDisableDeviceAuth: false,
    },
    terminal: {
      enabled: false,
      // shell: "/bin/zsh",
    },
    remote: {
      url: "ws://127.0.0.1:18789",
      transport: "ssh", // ssh | direct
      token: "your-token",
      // password: "your-password",
    },
    trustedProxies: ["10.0.0.1"],
    // Tùy chọn. Mặc định là false.
    allowRealIpFallback: false,
    nodes: {
      pairing: {
        // Tùy chọn. Mặc định không được đặt/bị vô hiệu hóa.
        autoApproveCidrs: ["192.168.1.0/24", "fd00:1234:5678::/64"],
        // Tự động phê duyệt được xác minh qua SSH. Mặc định: được bật (true).
        // Đặt thành false để chỉ vô hiệu hóa xác minh SSH; điều này không ảnh hưởng đến
        // autoApproveCidrs ở trên. Để chỉ ghép cặp Node thủ công, hãy đặt false VÀ
        // bỏ đặt autoApproveCidrs. Truyền một đối tượng để tinh chỉnh: { user, identity,
        // timeoutMs, cidrs }.
        sshVerify: true,
      },
      allowCommands: ["canvas.navigate"],
      denyCommands: ["system.run"],
    },
    tools: {
      // Các lệnh từ chối HTTP /tools/invoke bổ sung
      deny: ["browser"],
      // Xóa công cụ khỏi danh sách từ chối HTTP mặc định đối với bên gọi là chủ sở hữu/quản trị viên
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

<Accordion title="Chi tiết các trường Gateway">

- `mode`: `local` (chạy gateway) hoặc `remote` (kết nối với gateway từ xa). Gateway từ chối khởi động trừ khi `local`.
- `port`: một cổng ghép kênh duy nhất cho WS + HTTP. Thứ tự ưu tiên: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto`, `loopback` (mặc định), `lan` (`0.0.0.0`), `tailnet` (IPv4 Tailscale khi khả dụng, nếu không thì loopback), hoặc `custom` (một địa chỉ IPv4). Địa chỉ `tailnet` đã được phân giải và mọi địa chỉ `custom` khác `127.0.0.1` hoặc `0.0.0.0` đều yêu cầu `127.0.0.1` trên cùng cổng cho các máy khách cùng máy chủ; quá trình khởi động thất bại nếu một trong hai trình lắng nghe không thể bind. Việc mở ra ngoài loopback vẫn chỉ giới hạn ở giao diện đã chọn.
- **Bí danh bind cũ**: sử dụng các giá trị chế độ bind trong `gateway.bind` (`auto`, `loopback`, `lan`, `tailnet`, `custom`), không sử dụng bí danh máy chủ (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`).
- **Lưu ý về Docker**: bind `loopback` mặc định lắng nghe trên `127.0.0.1` bên trong container. Với mạng bridge của Docker (`-p 18789:18789`), lưu lượng đến trên `eth0`, nên không thể truy cập gateway. Sử dụng `--network host`, hoặc đặt `bind: "lan"` (hoặc `bind: "custom"` với `customBindHost: "0.0.0.0"`) để lắng nghe trên mọi giao diện.
- **Xác thực**: bắt buộc theo mặc định. Các bind không phải loopback yêu cầu xác thực gateway. Trong thực tế, điều đó có nghĩa là token/mật khẩu dùng chung hoặc proxy ngược nhận biết danh tính với `gateway.auth.mode: "trusted-proxy"`. Trình hướng dẫn thiết lập ban đầu tạo token theo mặc định.
- Nếu cả `gateway.auth.token` và `gateway.auth.password` đều được cấu hình (bao gồm SecretRefs), hãy đặt rõ `gateway.auth.mode` thành `token` hoặc `password`. Các luồng khởi động và cài đặt/sửa chữa dịch vụ thất bại khi cả hai đều được cấu hình nhưng chưa đặt chế độ.
- `gateway.auth.mode: "none"`: chế độ không xác thực được chỉ định rõ. Chỉ sử dụng cho các thiết lập loopback cục bộ đáng tin cậy; tùy chọn này cố ý không xuất hiện trong lời nhắc thiết lập ban đầu.
- `gateway.auth.mode: "trusted-proxy"`: ủy quyền việc xác thực trình duyệt/người dùng cho proxy ngược nhận biết danh tính và tin cậy các header danh tính từ `gateway.trustedProxies` (xem [Xác thực proxy đáng tin cậy](/vi/gateway/trusted-proxy-auth)). Theo mặc định, chế độ này yêu cầu nguồn proxy **không phải loopback**; proxy ngược loopback trên cùng máy chủ yêu cầu chỉ định rõ `gateway.auth.trustedProxy.allowLoopback = true`. Các trình gọi nội bộ trên cùng máy chủ có thể sử dụng `gateway.auth.password` làm phương án dự phòng trực tiếp cục bộ; `gateway.auth.token` vẫn loại trừ lẫn nhau với chế độ proxy đáng tin cậy.
- `gateway.auth.allowTailscale`: khi `true`, các header danh tính Tailscale Serve có thể đáp ứng yêu cầu xác thực Control UI/WebSocket (được xác minh qua `tailscale whois`). Các endpoint API HTTP **không** sử dụng cơ chế xác thực bằng header Tailscale đó; thay vào đó, chúng tuân theo chế độ xác thực HTTP thông thường của gateway. Luồng không dùng token này giả định rằng máy chủ gateway là đáng tin cậy. Mặc định là `true` khi `tailscale.mode = "serve"`.
- `gateway.auth.rateLimit`: bộ giới hạn tùy chọn cho các lần xác thực thất bại. Áp dụng theo từng IP máy khách và từng phạm vi xác thực (khóa bí mật dùng chung và token thiết bị được theo dõi độc lập). Các lần thử bị chặn trả về `429` + `Retry-After`.
  - Trên đường dẫn Control UI Tailscale Serve bất đồng bộ, các lần thử thất bại cho cùng một `{scope, clientIp}` được tuần tự hóa trước khi ghi lỗi. Do đó, các lần thử sai đồng thời từ cùng một máy khách có thể kích hoạt bộ giới hạn ở yêu cầu thứ hai thay vì cả hai cùng vượt qua do tranh chấp như các trường hợp không khớp thông thường.
  - `gateway.auth.rateLimit.exemptLoopback` mặc định là `true`; đặt `false` khi bạn chủ ý muốn giới hạn tốc độ cả lưu lượng localhost (cho thiết lập kiểm thử hoặc triển khai proxy nghiêm ngặt).
- Các lần thử xác thực WS bắt nguồn từ trình duyệt luôn bị giới hạn tốc độ và không áp dụng miễn trừ loopback (phòng thủ nhiều lớp chống dò mật khẩu localhost qua trình duyệt).
- Trên loopback, các lần khóa bắt nguồn từ trình duyệt đó được cô lập theo từng giá trị `Origin`
  đã chuẩn hóa, vì vậy lỗi lặp lại từ một origin localhost không tự động
  khóa một origin khác.
- `tailscale.mode`: `serve` (chỉ tailnet, bind loopback) hoặc `funnel` (công khai, yêu cầu xác thực).
- `tailscale.serviceName`: tên Tailscale Service tùy chọn cho chế độ Serve, chẳng hạn
  như `svc:openclaw`. Khi được đặt, OpenClaw truyền tên này cho `tailscale serve
--service` để Control UI có thể được cung cấp qua một Service có tên thay
  vì tên máy chủ của thiết bị. Giá trị phải sử dụng định dạng tên Service `svc:<dns-label>`
  của Tailscale; quá trình khởi động báo cáo URL Service được suy ra.
- `tailscale.preserveFunnel`: khi `true` và `tailscale.mode = "serve"`, OpenClaw
  kiểm tra `tailscale funnel status` trước khi áp dụng lại Serve lúc khởi động và bỏ qua
  nếu một tuyến Funnel được cấu hình bên ngoài đã bao phủ cổng gateway.
  Mặc định `false`.
- `controlUi.allowedOrigins`: danh sách cho phép origin trình duyệt được chỉ định rõ cho các kết nối Gateway WebSocket. Bắt buộc đối với các origin trình duyệt công khai không phải loopback. Các lượt tải UI LAN/Tailnet riêng tư cùng origin từ loopback, RFC1918/link-local, `.local`, `.ts.net` hoặc máy chủ Tailscale CGNAT được chấp nhận mà không cần bật phương án dự phòng bằng header Host.
- `controlUi.toolTitles`: chọn sử dụng tiêu đề mục đích do AI tạo cho các lệnh gọi công cụ trong cuộc trò chuyện Control UI. Mặc định: `false` (việc hiển thị công cụ vẫn hoàn toàn xác định và không có lệnh gọi mô hình nền). Khi được bật, phương thức `chat.toolTitles` gắn nhãn các lệnh gọi phức tạp thông qua định tuyến mô hình tiện ích tiêu chuẩn — `utilityModel` của tác nhân (một quyết định của người vận hành có thể gửi các đối số công cụ có giới hạn đến nhà cung cấp đã chọn, giống như mọi tác vụ tiện ích), hoặc mô hình nhỏ mặc định do nhà cung cấp phiên khai báo (OpenAI → `gpt-5.6-luna`, Anthropic → `claude-haiku-4-5`) — và lưu kết quả vào cơ sở dữ liệu trạng thái theo từng tác nhân để các lượt xem lại không bao giờ bị tính phí lần nữa. `utilityModel: \"\"` vô hiệu hóa tiêu đề giống như mọi tác vụ tiện ích khác; tiêu đề không bao giờ chuyển sang dùng mô hình chính làm phương án dự phòng.
- `controlUi.chatMessageMaxWidth`: chiều rộng tối đa tùy chọn cho bản ghi cuộc trò chuyện Control UI được căn giữa. Chấp nhận các giá trị chiều rộng CSS bị giới hạn như `960px`, `82%`, `min(1280px, 82%)` và `calc(100% - 2rem)`.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: chế độ nguy hiểm bật phương án dự phòng origin bằng header Host cho các triển khai chủ ý dựa vào chính sách origin của header Host.
- `terminal.enabled`: chọn sử dụng terminal của người vận hành có phạm vi quản trị. Mặc định: `false`. Terminal khởi chạy một PTY máy chủ trong không gian làm việc của tác nhân đã chọn, kế thừa môi trường tiến trình Gateway và bị từ chối đối với các tác nhân có `sandbox.mode: "all"`. Chỉ bật tính năng này cho các triển khai dành cho người vận hành đáng tin cậy; việc thay đổi tính năng sẽ khởi động lại Gateway và cập nhật chính sách bảo mật nội dung của Control UI.
- `terminal.shell`: tệp thực thi shell tùy chọn. Khi chưa đặt, OpenClaw sử dụng `$SHELL` trên Unix và `%ComSpec%` trên Windows.
- `terminal.detachedSessionTimeoutSeconds`: khoảng thời gian một phiên terminal tiếp tục tồn tại sau khi mất kết nối (tải lại trang, máy tính xách tay chuyển sang chế độ ngủ), vẫn có thể kết nối lại qua `terminal.attach` và phát lại đầu ra gần đây. Mặc định: `300`. Đặt `0` để kết thúc phiên ngay khi mất kết nối. Các phiên đã ngắt kết nối vẫn tiếp tục chạy lệnh, vì vậy hãy rút ngắn khoảng thời gian này trên các máy chủ dùng chung hoặc được mở ra bên ngoài.
- `remote.transport`: `ssh` (mặc định) hoặc `direct` (ws/wss). Đối với `direct`, `remote.url` phải là `wss://` cho các máy chủ công khai; `ws://` dạng văn bản thuần chỉ được chấp nhận cho loopback, LAN, link-local, `.local`, `.ts.net` và các máy chủ Tailscale CGNAT.
- `remote.remotePort`: cổng gateway trên máy chủ SSH từ xa. Mặc định là `18789`; sử dụng tùy chọn này khi cổng đường hầm cục bộ khác với cổng gateway từ xa.
- `remote.sshHostKeyPolicy`: chính sách khóa máy chủ của đường hầm SSH trên macOS. `strict` là mặc định và yêu cầu khóa đã được tin cậy. `openssh` là lựa chọn tham gia rõ ràng vào cấu hình OpenSSH có hiệu lực cho các bí danh được quản lý; hãy xem xét các thiết lập SSH tương ứng của người dùng và hệ thống trước khi sử dụng. Ứng dụng macOS và `configure-remote` đặt lại chính sách này thành `strict` khi thay đổi đích, trừ khi được chỉ định tham gia lại.
- `gateway.remote.token` / `.password` là các trường thông tin xác thực của máy khách từ xa. Chúng không tự cấu hình xác thực gateway.
- `gateway.push.apns.relay.baseUrl`: URL HTTPS cơ sở cho relay APNs bên ngoài được sử dụng sau khi các bản dựng iOS dựa trên relay công bố thông tin đăng ký lên gateway. Các bản dựng App Store công khai sử dụng relay OpenClaw được lưu trữ. URL relay tùy chỉnh phải tương ứng với một đường dẫn xây dựng/triển khai iOS riêng biệt có chủ ý, trong đó URL relay trỏ đến relay đó.
- `gateway.push.apns.relay.timeoutMs`: thời gian chờ gửi từ gateway đến relay tính bằng mili giây. Mặc định là `10000`.
- Các thông tin đăng ký dựa trên relay được ủy quyền cho một danh tính gateway cụ thể. Ứng dụng iOS đã ghép đôi truy xuất `gateway.identity.get`, đưa danh tính đó vào thông tin đăng ký relay và chuyển tiếp quyền gửi có phạm vi đăng ký đến gateway. Gateway khác không thể tái sử dụng thông tin đăng ký đã lưu đó.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: các giá trị ghi đè môi trường tạm thời cho cấu hình relay ở trên.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: lối thoát chỉ dành cho phát triển đối với URL relay HTTP loopback. URL relay sản xuất nên tiếp tục sử dụng HTTPS.
- `OPENCLAW_HANDSHAKE_TIMEOUT_MS`: giá trị ghi đè môi trường tùy chọn cho thời gian chờ tích hợp sẵn của quá trình bắt tay Gateway WebSocket trước xác thực.
- `channels.<provider>.healthMonitor.enabled`: tùy chọn từ chối khởi động lại của trình giám sát tình trạng theo từng kênh trong khi vẫn bật trình giám sát toàn cục.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: giá trị ghi đè theo từng tài khoản cho các kênh nhiều tài khoản. Khi được đặt, giá trị này được ưu tiên hơn giá trị ghi đè cấp kênh.
- Các đường dẫn gọi gateway cục bộ chỉ có thể sử dụng `gateway.remote.*` làm phương án dự phòng khi `gateway.auth.*` chưa được đặt.
- Nếu `gateway.auth.token` / `gateway.auth.password` được cấu hình rõ ràng qua SecretRef nhưng không phân giải được, quá trình phân giải sẽ thất bại theo cơ chế đóng an toàn (không có phương án dự phòng từ xa để che giấu lỗi).
- `trustedProxies`: các IP proxy ngược kết thúc TLS hoặc chèn header máy khách được chuyển tiếp. Chỉ liệt kê các proxy bạn kiểm soát. Các mục loopback vẫn hợp lệ cho thiết lập proxy/phát hiện cục bộ trên cùng máy chủ (ví dụ: Tailscale Serve hoặc proxy ngược cục bộ), nhưng chúng **không** làm cho các yêu cầu loopback đủ điều kiện sử dụng `gateway.auth.mode: "trusted-proxy"`.
- `allowRealIpFallback`: khi `true`, gateway chấp nhận `X-Real-IP` nếu thiếu `X-Forwarded-For`. Mặc định `false` để có hành vi đóng an toàn.
- `gateway.nodes.pairing.autoApproveCidrs`: danh sách CIDR/IP cho phép tùy chọn để tự động phê duyệt việc ghép đôi thiết bị node lần đầu khi không yêu cầu phạm vi nào. Tính năng này bị vô hiệu hóa khi chưa đặt. Tính năng này không tự động phê duyệt việc ghép đôi của người vận hành/trình duyệt/Control UI/WebChat và không tự động phê duyệt các nâng cấp về vai trò, phạm vi, siêu dữ liệu hoặc khóa công khai.
- `gateway.nodes.pairing.sshVerify`: tự động phê duyệt được xác minh bằng SSH cho việc ghép đôi thiết bị node lần đầu (mặc định: bật). Gateway SSH ngược về máy chủ ghép đôi (BatchMode, khóa máy chủ nghiêm ngặt) và chỉ phê duyệt khi khóa thiết bị `openclaw node identity` khớp chính xác. Ngưỡng đủ điều kiện giống `autoApproveCidrs`; các lượt thăm dò được giới hạn ở địa chỉ nguồn riêng tư/CGNAT trừ khi `cidrs` ghi đè chúng. Đặt `false` để vô hiệu hóa hoặc `{ user, identity, timeoutMs, cidrs }` để tinh chỉnh. Xem [Ghép đôi Node](/vi/gateway/pairing#ssh-verified-device-auto-approval-default).
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: định hình cho phép/từ chối toàn cục đối với các lệnh Node đã khai báo sau khi đánh giá việc ghép đôi và danh sách cho phép của nền tảng. Dùng `allowCommands` để chủ động cho phép các lệnh Node nguy hiểm như `camera.snap`, `camera.clip`, `screen.record`, `health.summary`, `sms.search` và `sms.send`; `denyCommands` loại bỏ một lệnh ngay cả khi giá trị mặc định của nền tảng hoặc quyền cho phép rõ ràng đáng lẽ sẽ bao gồm lệnh đó. Quyền truy cập Health của iOS, quyền SMS của Android và việc cấp quyền lệnh Gateway độc lập với nhau. Sau khi một Node thay đổi danh sách lệnh đã khai báo, hãy từ chối rồi phê duyệt lại việc ghép đôi thiết bị đó để Gateway lưu ảnh chụp nhanh danh sách lệnh đã cập nhật.
- `gateway.tools.deny`: các tên công cụ bổ sung bị chặn đối với HTTP `POST /tools/invoke` (mở rộng danh sách từ chối mặc định).
- `gateway.tools.allow`: loại bỏ tên công cụ khỏi danh sách từ chối HTTP mặc định dành cho
  bên gọi là chủ sở hữu/quản trị viên. Điều này không nâng cấp các bên gọi `operator.write`
  mang thông tin định danh thành quyền truy cập của chủ sở hữu/quản trị viên; `cron`, `gateway` và `nodes` vẫn
  không khả dụng đối với bên gọi không phải chủ sở hữu, ngay cả khi được đưa vào danh sách cho phép.

</Accordion>

### Các endpoint tương thích với OpenAI

- RPC HTTP quản trị: mặc định tắt dưới dạng plugin `admin-http-rpc`. Bật plugin để đăng ký `POST /api/v1/admin/rpc`. Xem [RPC HTTP quản trị](/vi/plugins/admin-http-rpc).
- Chat Completions: mặc định bị tắt. Bật bằng `gateway.http.endpoints.chatCompletions.enabled: true`.
- Responses API: `gateway.http.endpoints.responses.enabled`.
- Tăng cường bảo mật đầu vào URL của Responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    Danh sách cho phép trống được xem là chưa đặt; dùng `gateway.http.endpoints.responses.files.allowUrl=false`
    và/hoặc `gateway.http.endpoints.responses.images.allowUrl=false` để tắt việc tìm nạp URL.
- Header tăng cường bảo mật phản hồi tùy chọn:
  - `gateway.http.securityHeaders.strictTransportSecurity` (chỉ đặt cho các nguồn HTTPS do bạn kiểm soát; xem [Xác thực proxy tin cậy](/vi/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### Cách ly nhiều phiên bản

Chạy nhiều Gateway trên một máy chủ với các cổng và thư mục trạng thái riêng biệt:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

Các cờ tiện dụng: `--dev` (dùng `~/.openclaw-dev` + cổng `19001`), `--profile <name>` (dùng `~/.openclaw-<name>`).

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

- `enabled`: bật kết thúc TLS tại trình lắng nghe Gateway (HTTPS/WSS) (mặc định: `false`).
- `autoGenerate`: tự động tạo một cặp chứng chỉ/khóa tự ký cục bộ khi không cấu hình tệp cụ thể; chỉ dùng cho môi trường cục bộ/phát triển.
- `certPath`: đường dẫn hệ thống tệp đến tệp chứng chỉ TLS.
- `keyPath`: đường dẫn hệ thống tệp đến tệp khóa riêng TLS; duy trì quyền truy cập hạn chế.
- `caPath`: đường dẫn gói CA tùy chọn để xác minh máy khách hoặc sử dụng các chuỗi tin cậy tùy chỉnh.

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

- `mode`: kiểm soát cách áp dụng các chỉnh sửa cấu hình trong thời gian chạy.
  - `"off"`: bỏ qua các chỉnh sửa trực tiếp; thay đổi yêu cầu khởi động lại rõ ràng.
  - `"restart"`: luôn khởi động lại tiến trình Gateway khi cấu hình thay đổi.
  - `"hot"`: áp dụng thay đổi ngay trong tiến trình mà không cần khởi động lại.
  - `"hybrid"` (mặc định): thử tải lại nóng trước; chuyển sang khởi động lại nếu cần.
- `debounceMs`: khoảng thời gian chống dội tính bằng mili giây trước khi áp dụng thay đổi cấu hình (số nguyên không âm; mặc định: `300`).
- `deferralTimeoutMs`: thời gian tối đa tùy chọn tính bằng mili giây để chờ các thao tác đang diễn ra trước khi buộc khởi động lại hoặc tải lại nóng kênh. Bỏ qua để dùng thời gian chờ hữu hạn mặc định (`300000`); đặt `0` để chờ vô thời hạn và định kỳ ghi nhật ký cảnh báo vẫn còn thao tác chờ xử lý.

---

## Môi trường worker đám mây

Worker đám mây là tính năng chọn tham gia. Nếu không có `cloudWorkers` hoặc `profiles` trống, OpenClaw không chấp nhận việc tạo worker mới. Các bản ghi bền vững đã tạo trước đó vẫn được đối soát và duy trì hiển thị; phép chiếu Gateway/Node hiện có không thay đổi.

Mỗi nhà cung cấp worker phải trả về một `hostKey` SSH từ đầu ra cấp phát đáng tin cậy, chính xác dưới dạng `algorithm base64`, không có tên máy chủ hoặc chú thích. Quy trình bootstrap ghi khóa đó vào một tệp `known_hosts` biệt lập, dùng `StrictHostKeyChecking=yes`, và thất bại trước khi mở kết nối nếu nhà cung cấp bỏ qua khóa này. Không có phương án dự phòng tin cậy trong lần sử dụng đầu tiên.

Đường hầm được thiết lập theo nhu cầu thay vì là một phần của quá trình cấp phát. Khi bắt đầu, Gateway chuyển tiếp ngược một socket Unix cục bộ của worker đến endpoint WebSocket loopback của nó. Socket nằm trong một thư mục từ xa được cấp phát ngẫu nhiên và chỉ chủ sở hữu có quyền truy cập; không giống cổng TCP loopback, các tài khoản khác trên worker nhiều người dùng không thể truy cập socket này và socket không thể xung đột với cổng của môi trường khác. Các keepalive SSH và cơ chế chờ kết nối lại có giới hạn chỉ chạy khi chủ sở hữu đường hầm vẫn là chủ sở hữu hiện tại. Việc dừng đường hầm sẽ chặn các lần kết nối lại trước khi đóng tiến trình SSH.

Lưu lượng điều khiển và việc truyền không gian làm việc sử dụng các kết nối SSH riêng biệt. Cả hai tái sử dụng cùng danh tính đã phân giải và tệp `known_hosts` được ghim biệt lập, nhưng việc truyền không gian làm việc không dùng chung cơ chế ghép kênh kết nối SSH với đường hầm tồn tại lâu dài, vì vậy rsync không thể chặn lưu lượng điều khiển.

### Hồ sơ Crabbox

Nhà cung cấp `crabbox` đi kèm sẽ cấp phát một hợp đồng thuê hỗ trợ SSH thông qua CLI Crabbox cục bộ. `settings.provider` bên trong chọn backend Crabbox; giá trị này tách biệt với ID nhà cung cấp OpenClaw bên ngoài.

```json5
{
  cloudWorkers: {
    profiles: {
      production: {
        provider: "crabbox",
        install: "bundle", // Mặc định; chỉ dùng "npm" cho phiên bản Gateway đã phát hành.
        settings: {
          provider: "aws",
          class: "standard",
          ttl: "24h",
          idleTimeout: "60m",
          // Đường dẫn tuyệt đối tùy chọn. Mặc định: ../crabbox/bin/crabbox cùng cấp, sau đó là PATH.
          binary: "/usr/local/bin/crabbox",
        },
        lifetime: {
          idleTimeoutMinutes: 60,
          maxLifetimeMinutes: 1440,
        },
      },
    },
  },
}
```

- `settings.provider` (bắt buộc): backend Crabbox được chuyển qua `--provider`. Dùng backend có đầu ra kiểm tra chứa endpoint SSH; `aws` chọn backend AWS trực tiếp.
- `settings.class` (bắt buộc): lớp máy Crabbox được truyền đến `--class`.
- `settings.ttl` và `settings.idleTimeout` (bắt buộc): các chuỗi thời lượng Go dương được truyền đến `--ttl` và `--idle-timeout`. Các cơ chế an toàn phía nhà cung cấp này tách biệt với chính sách `lifetime` được OpenClaw lưu trữ bên dưới.
- `settings.binary`: đường dẫn tuyệt đối tùy chọn đến tệp thực thi Crabbox. Nếu không có, OpenClaw kiểm tra bản checkout Crabbox cùng cấp, sau đó các mục có thể thực thi trên `PATH`, và cuối cùng gọi `crabbox` để CLI bị thiếu vẫn xuất hiện dưới dạng lỗi nhà cung cấp rõ ràng.

Các thiết lập không xác định sẽ bị từ chối. Thông tin xác thực Crabbox và cấu hình tài khoản dành riêng cho backend vẫn do Crabbox sở hữu; không đặt chúng trong `settings`. OpenClaw chỉ gọi CLI cục bộ và không thực hiện lệnh gọi mạng nào đến nhà cung cấp từ plugin này. Quá trình cấp phát luôn truyền `--keep=true`; OpenClaw sở hữu vòng đời bên ngoài và hủy hợp đồng thuê bằng `crabbox stop`.

<Note>
  OpenClaw phân giải đường dẫn `sshKey` cục bộ của hợp đồng thuê Crabbox thông qua trình phân giải bí mật do nhà cung cấp sở hữu và ghim `sshHostKey` có thẩm quyền do `crabbox inspect --json` trả về. Việc tiếp nhận AWS cũng yêu cầu `providerMetadata.instanceProfileAttached`. Cài đặt Crabbox 0.38.1 trở lên để sử dụng hợp đồng kiểm tra khép kín này.
</Note>

### Hồ sơ phát triển SSH tĩnh

```json5
{
  cloudWorkers: {
    profiles: {
      development: {
        provider: "static-ssh",
        settings: {
          host: "worker.example.test",
          port: 22,
          user: "openclaw",
          hostKey: "ssh-ed25519 <base64-public-host-key>",
          keyRef: {
            source: "env",
            provider: "default",
            id: "OPENCLAW_WORKER_SSH_KEY",
          },
        },
        lifetime: {
          idleTimeoutMinutes: 60,
          maxLifetimeMinutes: 1440,
        },
      },
    },
  },
}
```

- `profiles`: các hồ sơ worker được đặt tên với ID không trống và đã loại bỏ khoảng trắng ở hai đầu. Mỗi hồ sơ chọn một nhà cung cấp được Plugin đăng ký.
- `provider`: ID nhà cung cấp worker không trống. Các ví dụ sử dụng nhà cung cấp `crabbox` đi kèm và nhà cung cấp QA Lab `static-ssh`.
- `install`: phương thức cài đặt worker. `"bundle"` (mặc định) truyền một gói có hàm băm nội dung của bản dựng đã cài đặt trên Gateway và hỗ trợ các phiên bản đã phát hành, đang phát triển và chưa phát hành. `"npm"` là một tối ưu hóa chọn tham gia dành cho bản phát hành đóng gói chưa sửa đổi; phương thức này cài đặt `openclaw@<exact gateway version>` từ registry npm công khai và không bao giờ cài đặt `latest`.
- Các plugin nhà cung cấp đi kèm được tự động chọn khi được cấu hình, nhưng các thao tác tắt rõ ràng và `plugins.allow` vẫn được áp dụng. Bao gồm ID nhà cung cấp (ví dụ: `crabbox`) khi cấu hình danh sách cho phép. Các plugin nhà cung cấp bên ngoài cũng phải được cài đặt và bật rõ ràng.
- `settings`: JSON hữu hạn do nhà cung cấp sở hữu. Plugin được chọn định nghĩa và xác thực các khóa của nó; dùng [đối tượng SecretRef](/vi/gateway/secrets) cho các giá trị chứa bí mật. Nhà cung cấp SSH tĩnh yêu cầu `host`, `user`, `hostKey` và `keyRef`; `port` mặc định là `22`. `hostKey` phải là một dòng khóa máy chủ công khai OpenSSH (`algorithm base64`) lấy từ máy chủ đã biết hoặc một kênh đáng tin cậy khác, không có tiền tố tùy chọn.
- `lifetime.idleTimeoutMinutes`: số phút nguyên dương được lưu để dùng cho chính sách thu hồi khi không hoạt động sau này.
- `lifetime.maxLifetimeMinutes`: số phút nguyên dương được lưu để dùng cho chính sách vòng đời sau này.

Một môi trường chạy Node được hỗ trợ (22.22.3+, 24.15+ hoặc 25.9+) với SQLite an toàn khi đặt lại WAL phải được cài đặt sẵn trên worker. Phương thức chọn tham gia `"npm"` cũng yêu cầu `npm` và quyền truy cập HTTPS đi ra đến registry npm công khai. Việc thiết lập chuỗi công cụ qua mạng thuộc chính sách của nhà cung cấp; bootstrap báo cáo lỗi có thể xử lý thay vì tự cài đặt chuỗi công cụ.

Nền tảng này cài đặt và xác minh bản dựng Gateway, đồng thời cung cấp vòng đời bắt đầu/dừng đường hầm, nhưng không khởi chạy CLI OpenClaw tổng quát. Điểm vào worker độc lập và vòng lặp sẽ được triển khai trong cột mốc worker đám mây tiếp theo.

Mỗi bản ghi môi trường bền vững giữ lại thiết lập nhà cung cấp đã xác thực, phương thức cài đặt đã phân giải và chính sách vòng đời trong ảnh chụp hồ sơ tại thời điểm tạo. Việc thay đổi hoặc xóa một hồ sơ được đặt tên ảnh hưởng đến các lần tạo mới; các bản ghi hiện có tiếp tục đối soát vòng đời bằng ảnh chụp đó, miễn là Plugin sở hữu vẫn khả dụng.

Các giá trị vòng đời chỉ là dữ liệu trong bản phát hành worker đám mây đầu tiên; việc thực thi tự động sẽ được triển khai trong công việc vòng đời sau này. Các thay đổi hồ sơ yêu cầu khởi động lại Gateway.

<Warning>
  Nhà cung cấp `static-ssh` là một bộ kiểm thử phát triển QA Lab trên cây mã nguồn và không được đưa vào các bản phân phối đóng gói. Worker chạy trên máy chủ dùng chung của nó có thể đọc dữ liệu không liên quan trên máy chủ, vì vậy không dùng nhà cung cấp này làm ranh giới cách ly sản xuất.
  Người vận hành phải cung cấp `hostKey` dự kiến; OpenClaw sẽ không học hoặc chấp nhận khóa từ kết nối đầu tiên.
  Việc hủy hợp đồng thuê chỉ giải phóng bản ghi logic của OpenClaw; thao tác này không dừng hoặc dọn dẹp máy chủ.
</Warning>

---

## Hook

```json5
{
  hooks: {
    enabled: true,
    token: "shared-secret",
    path: "/hooks",
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
        messageTemplate: "Từ: {{messages[0].from}}\nChủ đề: {{messages[0].subject}}\n{{messages[0].snippet}}",
        deliver: true,
        channel: "last",
        model: "openai/gpt-5.6-sol",
      },
    ],
  },
}
```

Xác thực: `Authorization: Bearer <token>` hoặc `x-openclaw-token: <token>`.
Token hook trong chuỗi truy vấn sẽ bị từ chối.

Ghi chú về xác thực và an toàn:

- `hooks.enabled=true` yêu cầu `hooks.token` không được để trống.
- `hooks.token` phải khác với xác thực bằng bí mật dùng chung đang hoạt động của Gateway (`gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` hoặc `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`); khi phát hiện tái sử dụng, quá trình khởi động sẽ ghi nhật ký cảnh báo bảo mật không nghiêm trọng.
- `openclaw security audit` đánh dấu việc tái sử dụng xác thực hook/Gateway là một phát hiện nghiêm trọng, bao gồm xác thực bằng mật khẩu Gateway chỉ được cung cấp tại thời điểm kiểm tra (`--auth password --password <password>`). Chạy `openclaw doctor --fix` để xoay vòng `hooks.token` đã lưu và bị tái sử dụng, sau đó cập nhật các bên gửi hook bên ngoài để sử dụng token hook mới.
- `hooks.path` không thể là `/`; hãy sử dụng một đường dẫn con chuyên biệt như `/hooks`.
- Nếu `hooks.allowRequestSessionKey=true`, hãy giới hạn `hooks.allowedSessionKeyPrefixes` (ví dụ `["hook:"]`).
- Nếu một ánh xạ hoặc giá trị đặt sẵn sử dụng `sessionKey` theo mẫu, hãy đặt `hooks.allowedSessionKeyPrefixes` và `hooks.allowRequestSessionKey=true`. Các khóa ánh xạ tĩnh không yêu cầu lựa chọn tham gia đó.

**Điểm cuối:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - `sessionKey` từ tải trọng yêu cầu chỉ được chấp nhận khi `hooks.allowRequestSessionKey=true` (mặc định: `false`).
- `POST /hooks/<name>` → được phân giải qua `hooks.mappings`
  - Các giá trị `sessionKey` của ánh xạ được kết xuất từ mẫu được coi là do bên ngoài cung cấp và cũng yêu cầu `hooks.allowRequestSessionKey=true`.

<Accordion title="Chi tiết ánh xạ">

- `match.path` khớp với đường dẫn con sau `/hooks` (ví dụ `/hooks/gmail` → `gmail`).
- `match.source` khớp với một trường tải trọng cho các đường dẫn chung.
- Các mẫu như `{{messages[0].subject}}` đọc dữ liệu từ tải trọng.
- `transform` có thể trỏ đến một mô-đun JS/TS trả về một hành động hook.
  - `transform.module` phải là đường dẫn tương đối và nằm trong `hooks.transformsDir` (đường dẫn tuyệt đối và việc duyệt vượt thư mục bị từ chối).
  - Giữ `hooks.transformsDir` trong `~/.openclaw/hooks/transforms`; các thư mục skill trong không gian làm việc bị từ chối. Nếu `openclaw doctor` báo cáo đường dẫn này không hợp lệ, hãy di chuyển mô-đun chuyển đổi vào thư mục chuyển đổi hook hoặc xóa `hooks.transformsDir`.
- `agentId` định tuyến đến một tác tử cụ thể; các ID không xác định sẽ quay về tác tử mặc định.
- `allowedAgentIds`: giới hạn việc định tuyến tác tử có hiệu lực, bao gồm đường dẫn tác tử mặc định khi bỏ qua `agentId` (`*` hoặc bỏ qua = cho phép tất cả, `[]` = từ chối tất cả).
- `defaultSessionKey`: khóa phiên cố định tùy chọn cho các lần chạy tác tử hook không có `sessionKey` tường minh.
- `allowRequestSessionKey`: cho phép bên gọi `/hooks/agent` và các khóa phiên ánh xạ dựa trên mẫu đặt `sessionKey` (mặc định: `false`).
- `allowedSessionKeyPrefixes`: danh sách cho phép tiền tố tùy chọn dành cho các giá trị `sessionKey` tường minh (yêu cầu + ánh xạ), ví dụ `["hook:"]`. Trường này trở thành bắt buộc khi bất kỳ ánh xạ hoặc giá trị đặt sẵn nào sử dụng `sessionKey` theo mẫu.
- `deliver: true` gửi phản hồi cuối cùng đến một kênh; `channel` mặc định là `last`.
- `model` ghi đè LLM cho lần chạy hook này (phải được cho phép nếu danh mục mô hình đã được đặt).

</Accordion>

### Tích hợp Gmail

- Giá trị đặt sẵn Gmail tích hợp sẵn sử dụng `sessionKey: "hook:gmail:{{messages[0].id}}"`.
- Khóa riêng cho từng thư này cô lập ngữ cảnh hội thoại, không cô lập công cụ hoặc quyền truy cập không gian làm việc. Nếu không có ánh xạ tùy chỉnh đặt `agentId`, giá trị đặt sẵn sẽ sử dụng tác tử mặc định.
- Đối với hộp thư đến không đáng tin cậy, hãy định tuyến Gmail đến một tác tử đọc chuyên biệt và giới hạn tác tử đó bằng [chính sách sandbox và công cụ theo từng tác tử](/vi/tools/multi-agent-sandbox-tools). Nếu tác tử đọc phải thông báo cho tác tử chính, hãy giới hạn việc chuyển giao bằng [`tools.agentToAgent`](/vi/gateway/config-tools#toolsagenttoagent). Xem [Chèn prompt](/vi/gateway/security#prompt-injection) để biết mô hình mối đe dọa và cấp mô hình được khuyến nghị.
- Nếu bạn giữ nguyên cách định tuyến theo từng thư đó, hãy đặt `hooks.allowRequestSessionKey: true` và giới hạn `hooks.allowedSessionKeyPrefixes` để khớp với không gian tên Gmail, ví dụ `["hook:", "hook:gmail:"]`.
- Nếu bạn cần `hooks.allowRequestSessionKey: false`, hãy ghi đè giá trị đặt sẵn bằng `sessionKey` tĩnh thay vì giá trị mặc định theo mẫu.

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
      model: "openai/gpt-5.6-sol",
      thinking: "high",
    },
  },
}
```

- Gateway tự động khởi động `gog gmail watch serve` khi khởi động nếu đã được cấu hình. Đặt `OPENCLAW_SKIP_GMAIL_WATCHER=1` để tắt.
- Không chạy một `gog gmail watch serve` riêng biệt cùng với Gateway.

---

## Máy chủ Plugin canvas

```json5
{
  plugins: {
    entries: {
      canvas: {
        config: {
          host: {
            root: "~/.openclaw/workspace/canvas",
            liveReload: true,
            // enabled: false, // hoặc OPENCLAW_SKIP_CANVAS_HOST=1
          },
        },
      },
    },
  },
}
```

- Phục vụ HTML/CSS/JS mà tác tử có thể chỉnh sửa và A2UI qua HTTP dưới cổng Gateway:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- Chỉ cục bộ: giữ `gateway.bind: "loopback"` (mặc định).
- Liên kết không phải loopback: các tuyến canvas yêu cầu xác thực Gateway (token/mật khẩu/proxy đáng tin cậy), giống như các bề mặt HTTP khác của Gateway.
- WebView của Node thường không gửi tiêu đề xác thực; sau khi một node được ghép cặp và kết nối, Gateway sẽ quảng bá các URL khả năng trong phạm vi node để truy cập canvas/A2UI.
- Các URL khả năng được liên kết với phiên WS hiện hoạt của node và hết hạn nhanh chóng. Không sử dụng phương án dự phòng dựa trên IP.
- Chèn ứng dụng khách tải lại trực tiếp vào HTML được phục vụ.
- Tự động tạo `index.html` khởi đầu khi trống.
- Đồng thời phục vụ A2UI tại `/__openclaw__/a2ui/`.
- Các thay đổi yêu cầu khởi động lại Gateway.
- Tắt tải lại trực tiếp đối với các thư mục lớn hoặc khi có lỗi `EMFILE`.

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

- `minimal` (mặc định): bỏ `cliPath` + `sshPort` khỏi các bản ghi TXT.
- `full`: bao gồm `cliPath` + `sshPort`; việc quảng bá multicast LAN vẫn yêu cầu bật Plugin `bonjour` đi kèm.
- `off`: ngăn quảng bá multicast LAN mà không thay đổi trạng thái bật của Plugin.
- Plugin `bonjour` đi kèm tự động khởi động trên các máy chủ macOS và cần chủ động bật trên Linux, Windows cũng như các triển khai Gateway trong vùng chứa.
- Tên máy chủ mặc định là tên máy chủ hệ thống khi đó là một nhãn DNS hợp lệ, nếu không sẽ dùng `openclaw`. Ghi đè bằng `OPENCLAW_MDNS_HOSTNAME`.
- `OPENCLAW_DISABLE_BONJOUR=1` tắt hoàn toàn việc quảng bá mDNS, ghi đè `discovery.mdns.mode`.

### Diện rộng (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

Ghi một vùng DNS-SD unicast trong `~/.openclaw/dns/`. Để khám phá xuyên mạng, hãy kết hợp với máy chủ DNS (khuyến nghị CoreDNS) + DNS phân tách của Tailscale.

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

- Các biến môi trường nội tuyến chỉ được áp dụng nếu môi trường tiến trình thiếu khóa đó.
- Các tệp `.env`: `.env` trong CWD + `~/.openclaw/.env` (không tệp nào ghi đè các biến hiện có).
- `shellEnv`: nhập các khóa dự kiến còn thiếu từ hồ sơ shell đăng nhập của bạn.
- Xem [Môi trường](/vi/help/environment) để biết đầy đủ thứ tự ưu tiên.

### Thay thế biến môi trường

Tham chiếu các biến môi trường trong bất kỳ chuỗi cấu hình nào bằng `${VAR_NAME}`:

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- Chỉ khớp các tên viết hoa: `[A-Z_][A-Z0-9_]*`.
- Các biến thiếu/trống gây ra lỗi khi tải cấu hình.
- Thoát bằng `$${VAR}` để biểu diễn `${VAR}` theo nghĩa đen.
- Hoạt động với `$include`.

---

## Bí mật

Các tham chiếu bí mật có tính bổ sung: giá trị văn bản thuần vẫn hoạt động.

### `SecretRef`

Sử dụng một dạng đối tượng:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

Xác thực:

- Mẫu `provider`: `^[a-z][a-z0-9_-]{0,63}$`
- Mẫu ID `source: "env"`: `^[A-Z][A-Z0-9_]{0,127}$`
- ID `source: "file"`: con trỏ JSON tuyệt đối (ví dụ `"/providers/openai/apiKey"`)
- Mẫu ID `source: "exec"`: `^[A-Za-z0-9][A-Za-z0-9._:/#-]{0,255}$` (hỗ trợ bộ chọn `secret#json_key` kiểu AWS)
- ID `source: "exec"` không được chứa các phân đoạn đường dẫn phân cách bằng dấu gạch chéo `.` hoặc `..` (ví dụ `a/../b` bị từ chối)

### Bề mặt thông tin xác thực được hỗ trợ

- Ma trận chuẩn: [Bề mặt thông tin xác thực SecretRef](/vi/reference/secretref-credential-surface)
- `secrets apply` nhắm đến các đường dẫn thông tin xác thực `openclaw.json` được hỗ trợ.
- Các tham chiếu `auth-profiles.json` được đưa vào quá trình phân giải thời gian chạy và phạm vi kiểm tra.

### Cấu hình nhà cung cấp bí mật

```json5
{
  secrets: {
    providers: {
      default: { source: "env" }, // nhà cung cấp env tường minh tùy chọn
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
- Đường dẫn của nhà cung cấp tệp và exec sẽ đóng khi lỗi nếu không thể xác minh ACL của Windows. Chỉ đặt `allowInsecurePath: true` cho các đường dẫn đáng tin cậy không thể xác minh.
- Nhà cung cấp `exec` yêu cầu đường dẫn `command` tuyệt đối và sử dụng tải trọng giao thức trên stdin/stdout.
- Theo mặc định, đường dẫn lệnh liên kết tượng trưng bị từ chối. Đặt `allowSymlinkCommand: true` để cho phép đường dẫn liên kết tượng trưng trong khi xác thực đường dẫn đích đã phân giải.
- Nếu `trustedDirs` được cấu hình, việc kiểm tra thư mục đáng tin cậy áp dụng cho đường dẫn đích đã phân giải.
- Môi trường tiến trình con `exec` mặc định là tối thiểu; truyền tường minh các biến bắt buộc bằng `passEnv`.
- Các tham chiếu bí mật được phân giải tại thời điểm kích hoạt thành một ảnh chụp nhanh trong bộ nhớ, sau đó các đường dẫn yêu cầu chỉ đọc ảnh chụp nhanh đó.
- Việc lọc bề mặt đang hoạt động được áp dụng trong quá trình kích hoạt: các tham chiếu chưa phân giải trên bề mặt đã bật khiến quá trình khởi động/tải lại thất bại, còn các bề mặt không hoạt động được bỏ qua kèm thông tin chẩn đoán.

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

- Hồ sơ riêng của từng agent được lưu tại `<agentDir>/auth-profiles.json`.
- `auth-profiles.json` hỗ trợ tham chiếu ở cấp giá trị (`keyRef` cho `api_key`, `tokenRef` cho `token`) đối với các chế độ thông tin xác thực tĩnh.
- Các ánh xạ `auth-profiles.json` phẳng cũ như `{ "provider": { "apiKey": "..." } }` không phải là định dạng thời gian chạy; `openclaw doctor --fix` ghi lại chúng thành các hồ sơ khóa API `provider:default` chuẩn hóa, kèm bản sao lưu `.legacy-flat.*.bak`.
- Các hồ sơ ở chế độ OAuth (`auth.profiles.<id>.mode = "oauth"`) không hỗ trợ thông tin xác thực của hồ sơ xác thực dựa trên SecretRef.
- Thông tin xác thực tĩnh khi chạy đến từ các ảnh chụp nhanh đã phân giải trong bộ nhớ; các mục `auth.json` tĩnh cũ sẽ bị xóa khi được phát hiện.
- Các bản nhập OAuth cũ từ `~/.openclaw/credentials/oauth.json`.
- Xem [OAuth](/vi/concepts/oauth).
- Hành vi của bí mật khi chạy và công cụ `audit/configure/apply`: [Quản lý bí mật](/vi/gateway/secrets).

---

## Kiểm toán

```json5
{
  audit: {
    enabled: true,
    messages: "off", // off | direct | all
  },
}
```

Gateway ghi lại các sự kiện kiểm toán **chỉ chứa siêu dữ liệu** cho các lần chạy agent và
thao tác công cụ vào cơ sở dữ liệu trạng thái dùng chung. Siêu dữ liệu vòng đời tin nhắn là một
tùy chọn bật riêng. Sổ cái lưu danh tính, thời gian, tên công cụ và các kết quả
đã chuẩn hóa, nhưng không bao giờ lưu prompt, nội dung tin nhắn, đối số công cụ, kết quả hoặc
văn bản lỗi thô. Các hàng tin nhắn không lưu tài khoản nền tảng, cuộc hội thoại,
tin nhắn và ID đích ở dạng thô. Khóa phiên chạy/công cụ vẫn khả dụng để đối chiếu
và bản thân chúng có thể chứa tài khoản nền tảng hoặc ID đối tác. Bản ghi
hết hạn sau 30 ngày và sổ cái được giới hạn ở 100.000 hàng. Truy vấn chúng bằng
[`openclaw audit`](/vi/cli/audit) hoặc RPC Gateway
[`audit.activity.list`](/vi/gateway/protocol#audit-ledger-rpc). Xem
[Lịch sử kiểm toán](/vi/gateway/audit) để biết mô hình dữ liệu đầy đủ, ngữ nghĩa quyền riêng tư
và các giới hạn phạm vi bao phủ.

- `enabled`: ghi lại các sự kiện kiểm toán mới (mặc định: `true`). Sổ cái được bật
  theo mặc định vì dấu vết kiểm toán chỉ được bật sau sự cố không thể giải thích
  sự cố đó. Đặt `false` sẽ dừng chèn sự kiện mới sau khi Gateway khởi động lại;
  các bản ghi hiện có vẫn có thể đọc được cho đến khi hết hạn. Bật lại sẽ tiếp tục
  ghi từ thời điểm đó — khoảng trống không được bổ sung hồi tố.
- `messages`: phạm vi siêu dữ liệu tin nhắn (mặc định: `"off"`). `"direct"` chỉ ghi lại
  các cuộc hội thoại trực tiếp đã biết. `"all"` cũng ghi lại các loại cuộc hội thoại nhóm, kênh và
  không xác định. Cả hai chế độ đều không chứa nội dung và thay thế các định danh thô
  bằng bút danh có khóa cục bộ theo bản cài đặt ở nơi có thể đối chiếu.
  Đây là công cụ hỗ trợ đối chiếu chứ không phải ẩn danh hóa; cơ sở dữ liệu trạng thái
  lưu khóa dẫn xuất, nhưng các bản xuất RPC và CLI thì không.

Gateway đang chạy ghi nhận `audit.enabled` và `audit.messages` khi khởi động;
hãy khởi động lại sau khi thay đổi một trong hai thiết lập. Phạm vi tin nhắn hiện bao gồm
các tin nhắn đến được chấp nhận và tới bước điều phối lõi, cùng một hàng kết thúc cho mỗi
payload phản hồi đi logic ban đầu tới cơ chế gửi bền vững dùng chung.
Các đường dẫn cục bộ của Plugin và gửi trực tiếp bỏ qua các ranh giới dùng chung đó
hiện chưa được bao phủ. Trình ghi nền có giới hạn
hoạt động theo nỗ lực tối đa, không phải kho lưu trữ tuân thủ không mất dữ liệu.

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
- Đặt `logging.file` để dùng đường dẫn ổn định.
- `consoleLevel` tăng lên `debug` khi `--verbose`.
- `maxFileBytes`: kích thước tối đa của tệp nhật ký đang hoạt động, tính bằng byte, trước khi xoay vòng (số nguyên dương; mặc định: `104857600` = 100 MB). OpenClaw giữ tối đa năm bản lưu trữ được đánh số bên cạnh tệp đang hoạt động.
- `redactSensitive` / `redactPatterns`: che dữ liệu theo nỗ lực tối đa cho đầu ra bảng điều khiển, nhật ký tệp, bản ghi nhật ký OTLP và văn bản bản ghi phiên được lưu. `redactSensitive: "off"` chỉ tắt chính sách chung này đối với nhật ký/bản ghi; các bề mặt an toàn UI/công cụ/chẩn đoán vẫn che bí mật trước khi xuất.

---

## Chẩn đoán

```json5
{
  diagnostics: {
    enabled: true,
    flags: ["telegram.*"],

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

- `enabled`: công tắc chính cho đầu ra đo lường (mặc định: `true`).
- `flags`: mảng chuỗi cờ bật đầu ra nhật ký có mục tiêu (hỗ trợ ký tự đại diện như `"telegram.*"` hoặc `"*"`).
- `otel.enabled`: bật pipeline xuất OpenTelemetry (mặc định: `false`). Để biết cấu hình đầy đủ, danh mục tín hiệu và mô hình quyền riêng tư, xem [Xuất OpenTelemetry](/vi/gateway/opentelemetry).
- `otel.endpoint`: URL bộ thu cho hoạt động xuất OTel.
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`: các điểm cuối OTLP tùy chọn dành riêng cho từng tín hiệu. Khi được đặt, chúng chỉ ghi đè `otel.endpoint` cho tín hiệu đó.
- `otel.protocol`: `"http/protobuf"` (mặc định) hoặc `"grpc"`.
- `otel.headers`: các header siêu dữ liệu HTTP/gRPC bổ sung được gửi cùng yêu cầu xuất OTel.
- `otel.serviceName`: tên dịch vụ cho các thuộc tính tài nguyên.
- `otel.traces` / `otel.metrics` / `otel.logs`: bật xuất dấu vết, chỉ số hoặc nhật ký.
- `otel.logsExporter`: đích xuất nhật ký: `"otlp"` (mặc định), `"stdout"` để xuất một đối tượng JSON trên mỗi dòng stdout, hoặc `"both"`.
- `otel.sampleRate`: tỷ lệ lấy mẫu dấu vết `0`-`1`.
- `otel.flushIntervalMs`: khoảng thời gian xả dữ liệu đo từ xa định kỳ, tính bằng ms.
- `otel.captureContent`: tùy chọn bật thu thập nội dung thô cho các thuộc tính span OTEL. Mặc định tắt. Giá trị Boolean `true` thu thập nội dung tin nhắn/công cụ không thuộc hệ thống; dạng đối tượng cho phép bật rõ ràng `inputMessages`, `outputMessages`, `toolInputs`, `toolOutputs`, `systemPrompt` và `toolDefinitions`.
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`: công tắc môi trường cho cấu trúc span suy luận GenAI thử nghiệm mới nhất, bao gồm tên span `{gen_ai.operation.name} {gen_ai.request.model}`, loại span `CLIENT` và `gen_ai.provider.name` thay cho `gen_ai.system` cũ. Theo mặc định, các span giữ `openclaw.model.call` và `gen_ai.system` để tương thích; các chỉ số GenAI sử dụng thuộc tính ngữ nghĩa có giới hạn.
- `OPENCLAW_OTEL_PRELOADED=1`: công tắc môi trường cho các máy chủ đã đăng ký SDK OpenTelemetry toàn cục. Khi đó, OpenClaw bỏ qua quá trình khởi động/tắt SDK do Plugin sở hữu nhưng vẫn duy trì các trình lắng nghe chẩn đoán.
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`, `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` và `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`: các biến môi trường điểm cuối dành riêng cho tín hiệu, được dùng khi khóa cấu hình tương ứng chưa được đặt.
- `cacheTrace.enabled`: ghi nhật ký các ảnh chụp nhanh dấu vết bộ nhớ đệm cho các lần chạy nhúng (mặc định: `false`).
- `cacheTrace.filePath`: đường dẫn đầu ra cho JSONL dấu vết bộ nhớ đệm (mặc định: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`).
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: kiểm soát nội dung được đưa vào đầu ra dấu vết bộ nhớ đệm (tất cả mặc định: `true`).

---

## Cập nhật

```json5
{
  update: {
    channel: "stable", // stable | extended-stable | beta | dev
    checkOnStart: true,

    auto: {
      enabled: false,
    },
  },
}
```

- `channel`: kênh phát hành - `"stable"`, `"extended-stable"`, `"beta"` hoặc `"dev"`. Extended-stable chỉ dành cho gói: các lệnh chạy ở tiền cảnh quản lý việc cài đặt, còn Gateway có thể phát các gợi ý cập nhật chỉ đọc.
- `checkOnStart`: kiểm tra bản cập nhật npm khi Gateway khởi động (mặc định: `true`). Các lựa chọn extended-stable đã lưu sử dụng cùng gợi ý chỉ đọc và lịch gợi ý 24 giờ.
- `auto.enabled`: bật tự động cập nhật trong nền cho các bản cài đặt gói stable và beta (mặc định: `false`). Extended-stable không bao giờ được áp dụng tự động.

---

## ACP

```json5
{
  acp: {
    enabled: true,
    dispatch: { enabled: true },
    backend: "acpx",
    fallbacks: ["acpx-secondary"],
    defaultAgent: "main",
    allowedAgents: ["main", "ops"],
    stream: {
      repeatSuppression: true,
      deliveryMode: "live", // live | final_only
    },
  },
}
```

- `enabled`: cổng tính năng ACP toàn cục (mặc định: `true`; đặt `false` để ẩn các khả năng điều phối và tạo ACP).
- `dispatch.enabled`: cổng độc lập cho việc điều phối lượt phiên ACP (mặc định: `true`). Đặt `false` để giữ các lệnh ACP khả dụng nhưng chặn thực thi.
- `backend`: ID backend thời gian chạy ACP mặc định (phải khớp với một Plugin thời gian chạy ACP đã đăng ký).
  Trước tiên hãy cài đặt Plugin backend, và nếu `plugins.allow` được đặt, hãy bao gồm ID Plugin backend (ví dụ `acpx`), nếu không backend ACP sẽ không tải.
- `fallbacks`: danh sách có thứ tự các ID backend ACP dự phòng được thử khi backend chính gặp lỗi sớm có vẻ tạm thời (không khả dụng, bị giới hạn tốc độ, hết hạn ngạch hoặc quá tải) trước khi tạo ra bất kỳ đầu ra nào. Mỗi mục phải khớp với một backend Plugin thời gian chạy ACP đã đăng ký.
- `defaultAgent`: ID agent đích ACP dự phòng khi thao tác tạo không chỉ định đích rõ ràng.
- `allowedAgents`: danh sách cho phép các ID agent được phép dùng cho phiên thời gian chạy ACP; để trống nghĩa là không có hạn chế bổ sung.
- `stream.repeatSuppression`: chặn các dòng trạng thái/công cụ lặp lại trong mỗi lượt (mặc định: `true`).
- `stream.deliveryMode`: `"live"` truyền phát tăng dần; `"final_only"` lưu vào bộ đệm cho đến khi có sự kiện kết thúc lượt.
- `stream.tagVisibility`: bản ghi tên thẻ ánh xạ tới các giá trị ghi đè khả năng hiển thị Boolean cho sự kiện được truyền phát.
- `runtime.installCommand`: lệnh cài đặt tùy chọn để chạy khi khởi tạo môi trường thời gian chạy ACP.

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

- `cli.banner.taglineMode` kiểm soát kiểu khẩu hiệu của biểu ngữ:
  - `"random"` (mặc định): luân phiên các khẩu hiệu hài hước/theo mùa.
  - `"default"`: khẩu hiệu trung lập cố định (`All your chats, one OpenClaw.`).
  - `"off"`: không có văn bản khẩu hiệu (tiêu đề/phiên bản của biểu ngữ vẫn hiển thị).
- Để ẩn toàn bộ biểu ngữ (không chỉ các khẩu hiệu), hãy đặt biến môi trường `OPENCLAW_HIDE_BANNER=1`.

---

## Trình hướng dẫn

Hành vi và siêu dữ liệu cho các luồng thiết lập có hướng dẫn của CLI (`onboard`, `configure`, `doctor`):

```json5
{
  wizard: {
    accessMode: "full",
    appRecommendations: true,
    lastRunAt: "2026-01-01T00:00:00.000Z",
    lastRunVersion: "2026.1.4",
    lastRunCommit: "abc1234",
    lastRunCommand: "configure",
    lastRunMode: "local",
    securityAcknowledgedAt: "2026-01-01T00:00:00.000Z",
  },
}
```

- `wizard.accessMode`: lựa chọn đồng ý cho phép khám phá được đưa ra khi bắt đầu quy trình làm quen có hướng dẫn. `"full"` (khuyến nghị) cho phép quy trình thiết lập tự động tìm kiếm các ứng dụng AI, khóa và runtime cục bộ; `"guarded"` khiến quy trình thiết lập hỏi một lần trước khi tìm kiếm và cung cấp tùy chọn cấu hình thủ công thay thế.

- `wizard.appRecommendations` mặc định là `true`. Đặt thành `false` để tắt các đề xuất ứng dụng đã cài đặt trong quy trình làm quen có hướng dẫn hoặc cổ điển và chặn quyền truy cập `device.apps` của Gateway. Các máy chủ Node vẫn yêu cầu cờ chia sẻ ứng dụng đã cài đặt riêng biệt, mặc định tắt, trước khi quảng bá lệnh này.

---

## Danh tính

Xem các trường danh tính `agents.list` trong [Giá trị mặc định của tác tử](/vi/gateway/config-agents#agent-defaults).

---

## Cầu nối (cũ, đã loại bỏ)

Các bản dựng hiện tại không còn bao gồm cầu nối TCP. Các Node kết nối qua WebSocket của Gateway. Các khóa `bridge.*` không còn thuộc lược đồ cấu hình (quá trình xác thực sẽ thất bại cho đến khi chúng được loại bỏ; `openclaw doctor --fix` có thể loại bỏ các khóa không xác định).

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
    webhook: "https://example.invalid/legacy", // phương án dự phòng đã ngừng dùng cho các tác vụ notify:true được lưu trữ
    webhookToken: "replace-with-dedicated-token", // mã thông báo bearer tùy chọn để xác thực webhook gửi đi
    sessionRetention: "24h", // chuỗi thời lượng hoặc false
  },
}
```

- `sessionRetention`: khoảng thời gian giữ lại các phiên chạy Cron cô lập đã hoàn tất trước khi cắt bỏ các hàng phiên SQLite. Đồng thời kiểm soát việc dọn dẹp các bản ghi Cron đã xóa và được lưu trữ. Mặc định: `24h`; đặt `false` để tắt.
- Lịch sử chạy tự động giữ lại 2000 hàng trạng thái cuối mới nhất cho mỗi tác vụ. Các hàng bị mất vẫn giữ khoảng thời gian dọn dẹp 24 giờ.
- `webhookToken`: mã thông báo bearer dùng để gửi yêu cầu POST đến webhook Cron (`delivery.mode = "webhook"`); nếu bỏ qua, không tiêu đề xác thực nào được gửi.
- `webhook`: URL webhook dự phòng cũ đã ngừng dùng (http/https), được `openclaw doctor --fix` sử dụng để di chuyển các tác vụ đã lưu vẫn có `notify: true`; việc phân phối khi chạy sử dụng `delivery.mode="webhook"` theo từng tác vụ cùng với `delivery.to`, hoặc `delivery.completionDestination` khi giữ nguyên phương thức phân phối thông báo.

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

- `enabled`: bật cảnh báo lỗi cho các tác vụ Cron (mặc định: `false`).
- `after`: số lần lỗi liên tiếp trước khi cảnh báo được kích hoạt (số nguyên dương, tối thiểu: `1`).
- `cooldownMs`: số mili giây tối thiểu giữa các cảnh báo lặp lại cho cùng một tác vụ (số nguyên không âm).
- `includeSkipped`: tính các lần chạy bị bỏ qua liên tiếp vào ngưỡng cảnh báo (mặc định: `false`). Các lần chạy bị bỏ qua được theo dõi riêng và không ảnh hưởng đến thời gian chờ tăng dần do lỗi thực thi.
- `mode`: chế độ phân phối - `"announce"` gửi qua tin nhắn kênh; `"webhook"` gửi đến webhook đã cấu hình.
- `accountId`: mã định danh tài khoản hoặc kênh tùy chọn để giới hạn phạm vi phân phối cảnh báo.

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

- Đích mặc định cho thông báo lỗi Cron trên tất cả tác vụ.
- `mode`: `"announce"` hoặc `"webhook"`; mặc định là `"announce"` khi có đủ dữ liệu đích.
- `channel`: ghi đè kênh để phân phối thông báo. `"last"` tái sử dụng kênh phân phối đã biết gần nhất.
- `to`: đích thông báo tường minh hoặc URL webhook. Bắt buộc đối với chế độ webhook.
- `accountId`: ghi đè tài khoản tùy chọn để phân phối.
- `delivery.failureDestination` theo từng tác vụ ghi đè giá trị mặc định toàn cục này.
- Khi không đặt đích lỗi toàn cục hoặc theo từng tác vụ, các tác vụ vốn đã phân phối qua `announce` sẽ dùng đích thông báo chính đó làm phương án dự phòng khi xảy ra lỗi.
- `delivery.failureDestination` chỉ được hỗ trợ cho các tác vụ `sessionTarget="isolated"`, trừ khi `delivery.mode` chính của tác vụ là `"webhook"`.

Xem [Tác vụ Cron](/vi/automation/cron-jobs). Các lần thực thi Cron cô lập được theo dõi dưới dạng [tác vụ nền](/vi/automation/tasks).

## Biến mẫu của mô hình phương tiện

Các phần giữ chỗ trong mẫu được mở rộng trong `tools.media.models[].args`:

| Biến               | Mô tả                                              |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | Toàn bộ nội dung tin nhắn đến                     |
| `{{RawBody}}`      | Nội dung thô (không có lớp bọc lịch sử/người gửi) |
| `{{BodyStripped}}` | Nội dung đã loại bỏ lượt đề cập nhóm              |
| `{{From}}`         | Mã định danh người gửi                            |
| `{{To}}`           | Mã định danh đích                                 |
| `{{MessageSid}}`   | Mã định danh tin nhắn kênh                        |
| `{{SessionId}}`    | UUID phiên hiện tại                               |
| `{{IsNewSession}}` | `"true"` khi phiên mới được tạo                   |
| `{{MediaUrl}}`     | URL giả của phương tiện đến                       |
| `{{MediaPath}}`    | Đường dẫn phương tiện cục bộ                      |
| `{{MediaType}}`    | Loại phương tiện (hình ảnh/âm thanh/tài liệu/…)   |
| `{{Transcript}}`   | Bản chép lời âm thanh                             |
| `{{Prompt}}`       | Lời nhắc phương tiện đã phân giải cho mục CLI     |
| `{{MaxChars}}`     | Số ký tự đầu ra tối đa đã phân giải cho mục CLI   |
| `{{ChatType}}`     | `"direct"` hoặc `"group"`                          |
| `{{GroupSubject}}` | Chủ đề nhóm (nỗ lực tối đa)                       |
| `{{GroupMembers}}` | Bản xem trước thành viên nhóm (nỗ lực tối đa)     |
| `{{SenderName}}`   | Tên hiển thị của người gửi (nỗ lực tối đa)        |
| `{{SenderE164}}`   | Số điện thoại của người gửi (nỗ lực tối đa)       |
| `{{Provider}}`     | Gợi ý nhà cung cấp (whatsapp, telegram, discord, v.v.) |

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

**Hành vi hợp nhất:**

- Một tệp: thay thế đối tượng chứa nó.
- Mảng tệp: được hợp nhất sâu theo thứ tự (tệp sau ghi đè tệp trước).
- Các khóa cùng cấp: được hợp nhất sau các phần bao gồm (ghi đè các giá trị được bao gồm).
- Các phần bao gồm lồng nhau: sâu tối đa 10 cấp.
- Đường dẫn: được phân giải tương đối với tệp chứa phần bao gồm, nhưng phải nằm trong thư mục cấu hình cấp cao nhất (`dirname` của `openclaw.json`). Các dạng tuyệt đối/`../` chỉ được phép khi vẫn phân giải bên trong ranh giới đó. Đặt `OPENCLAW_INCLUDE_ROOTS` (đường dẫn tuyệt đối) để cho phép thêm các thư mục gốc bên ngoài thư mục cấu hình.
- Giới hạn: đường dẫn không được chứa byte null và phải ngắn hơn 4096 ký tự một cách nghiêm ngặt cả trước và sau khi phân giải; mỗi tệp được bao gồm bị giới hạn ở 2 MB.
- Các thao tác ghi do OpenClaw sở hữu chỉ thay đổi một phần cấp cao nhất được hỗ trợ bởi phần bao gồm một tệp sẽ ghi xuyên đến tệp được bao gồm đó. Ví dụ: `plugins install` cập nhật `plugins: { $include: "./plugins.json5" }` trong `plugins.json5` và giữ nguyên `openclaw.json`.
- Các phần bao gồm ở gốc, mảng phần bao gồm và phần bao gồm có ghi đè cùng cấp là chỉ đọc đối với các thao tác ghi do OpenClaw sở hữu; các thao tác ghi đó sẽ từ chối an toàn thay vì làm phẳng cấu hình.
- Lỗi: thông báo rõ ràng đối với tệp bị thiếu, lỗi phân tích cú pháp, phần bao gồm vòng tròn, định dạng đường dẫn không hợp lệ và độ dài quá mức.

---

## Liên quan

- [Cấu hình](/vi/gateway/configuration)
- [Ví dụ cấu hình](/vi/gateway/configuration-examples)
- [Doctor](/vi/gateway/doctor)
