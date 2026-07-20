---
read_when:
    - Bạn đang xây dựng một Plugin backend CLI AI cục bộ
    - Bạn muốn đăng ký một backend cho các tham chiếu mô hình như acme-cli/model
    - Bạn cần ánh xạ một CLI của bên thứ ba vào trình chạy dự phòng văn bản của OpenClaw
sidebarTitle: CLI backend plugins
summary: Xây dựng một plugin đăng ký backend CLI AI cục bộ
title: Xây dựng các plugin backend CLI
x-i18n:
    generated_at: "2026-07-20T04:28:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 08edceae9afd133684094b6febc6ca9b0ab89ce1168474f0a4fabd15b5ac4200
    source_path: plugins/cli-backend-plugins.md
    workflow: 16
---

Các plugin backend CLI cho phép OpenClaw gọi một CLI AI cục bộ làm backend suy luận
văn bản. Backend xuất hiện dưới dạng tiền tố provider trong tham chiếu model:

```text
acme-cli/acme-large
```

Sử dụng backend CLI khi tích hợp thượng nguồn đã được cung cấp dưới dạng lệnh
cục bộ, khi CLI quản lý trạng thái đăng nhập cục bộ hoặc làm phương án dự phòng khi các
provider API không khả dụng.

<Info>
  Nếu dịch vụ thượng nguồn cung cấp API model HTTP thông thường, hãy viết một
  [plugin provider](/vi/plugins/sdk-provider-plugins) thay thế. Nếu runtime thượng nguồn
  quản lý toàn bộ phiên agent, sự kiện công cụ, compaction hoặc trạng thái tác vụ
  nền, hãy sử dụng một [agent harness](/vi/plugins/sdk-agent-harness).
</Info>

## Những gì plugin quản lý

Một plugin backend CLI có ba hợp đồng:

| Hợp đồng             | Tệp                    | Mục đích                                                   |
| -------------------- | ---------------------- | --------------------------------------------------------- |
| Điểm vào gói        | `package.json`         | Trỏ OpenClaw đến mô-đun runtime của plugin              |
| Quyền sở hữu manifest   | `openclaw.plugin.json` | Khai báo id backend trước khi runtime tải              |
| Đăng ký runtime | `index.ts`             | Gọi `api.registerCliBackend(...)` với các giá trị mặc định của lệnh |

Manifest là siêu dữ liệu khám phá: nó không thực thi CLI hoặc đăng ký
hành vi runtime. Hành vi runtime bắt đầu khi điểm vào plugin gọi
`api.registerCliBackend(...)`.

## Plugin backend tối thiểu

<Steps>
  <Step title="Tạo siêu dữ liệu gói">
    ```json package.json
    {
      "name": "@acme/openclaw-acme-cli",
      "version": "1.0.0",
      "type": "module",
      "openclaw": {
        "extensions": ["./index.ts"],
        "compat": {
          "pluginApi": ">=2026.3.24-beta.2",
          "minGatewayVersion": "2026.3.24-beta.2"
        },
        "build": {
          "openclawVersion": "2026.3.24-beta.2",
          "pluginSdkVersion": "2026.3.24-beta.2"
        }
      },
      "dependencies": {
        "openclaw": "^2026.3.24"
      },
      "devDependencies": {
        "typescript": "^5.9.0"
      }
    }
    ```

    Các gói đã phát hành phải chứa các tệp runtime JavaScript đã được build. Nếu điểm vào
    mã nguồn của bạn là `./src/index.ts`, hãy thêm `openclaw.runtimeExtensions` trỏ đến tệp JavaScript
    đã build tương ứng. Xem [Điểm vào](/vi/plugins/sdk-entrypoints).

  </Step>

  <Step title="Khai báo quyền sở hữu backend">
    ```json openclaw.plugin.json
    {
      "id": "acme-cli",
      "name": "Acme CLI",
      "description": "Run Acme's local AI CLI through OpenClaw",
      "cliBackends": ["acme-cli"],
      "setup": {
        "cliBackends": ["acme-cli"],
        "requiresRuntime": false
      },
      "activation": {
        "onStartup": false
      },
      "configSchema": {
        "type": "object",
        "additionalProperties": false
      }
    }
    ```

    `cliBackends` là danh sách quyền sở hữu runtime; nó cho phép OpenClaw tự động tải
    plugin khi cấu hình hoặc lựa chọn model đề cập đến `acme-cli/...`.

    `setup.cliBackends` là bề mặt thiết lập ưu tiên descriptor. Hãy thêm nó khi
    việc khám phá model, onboarding hoặc trạng thái cần nhận diện backend
    mà không tải runtime của plugin. Chỉ sử dụng `requiresRuntime: false` khi
    các descriptor tĩnh đó đủ cho việc thiết lập.

  </Step>

  <Step title="Đăng ký backend">
    ```typescript index.ts
    import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
    import {
      CLI_FRESH_WATCHDOG_DEFAULTS,
      CLI_RESUME_WATCHDOG_DEFAULTS,
      type CliBackendPlugin,
    } from "openclaw/plugin-sdk/cli-backend";

    function buildAcmeCliBackend(): CliBackendPlugin {
      return {
        id: "acme-cli",
        liveTest: {
          defaultModelRef: "acme-cli/acme-large",
          defaultImageProbe: false,
          defaultMcpProbe: false,
          docker: {
            npmPackage: "@acme/acme-cli",
            binaryName: "acme",
          },
        },
        config: {
          command: "acme",
          args: ["chat", "--json"],
          output: "json",
          input: "stdin",
          modelArg: "--model",
          sessionArg: "--session",
          sessionMode: "existing",
          sessionIdFields: ["session_id", "conversation_id"],
          systemPromptFileArg: "--system-file",
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
          reliability: {
            watchdog: {
              fresh: { ...CLI_FRESH_WATCHDOG_DEFAULTS },
              resume: { ...CLI_RESUME_WATCHDOG_DEFAULTS },
            },
          },
          serialize: true,
        },
      };
    }

    export default definePluginEntry({
      id: "acme-cli",
      name: "Acme CLI",
      description: "Run Acme's local AI CLI through OpenClaw",
      register(api) {
        api.registerCliBackend(buildAcmeCliBackend());
      },
    });
    ```

    Id backend phải khớp với mục manifest `cliBackends`. 
    `config` đã đăng ký chỉ là giá trị mặc định; cấu hình người dùng trong
    `agents.defaults.cliBackends.acme-cli` sẽ được hợp nhất và ghi đè lên nó tại runtime.

  </Step>
</Steps>

## Cấu trúc cấu hình

`CliBackendConfig` mô tả cách OpenClaw khởi chạy và phân tích CLI:

| Trường                                                     | Công dụng                                                                               |
| --------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `command`                                                 | Tên tệp nhị phân hoặc đường dẫn lệnh tuyệt đối                                              |
| `args`                                                    | argv cơ sở cho các lần chạy mới                                                          |
| `resumeArgs`                                              | argv thay thế cho các phiên được tiếp tục; hỗ trợ `{sessionId}`                       |
| `output` / `resumeOutput`                                 | Trình phân tích: `json`, `jsonl` hoặc `text`                                                |
| `jsonlDialect`                                            | Phương ngữ sự kiện JSONL: `claude-stream-json` hoặc `gemini-stream-json`                 |
| `liveSession`                                             | Chế độ tiến trình CLI tồn tại lâu (`claude-stdio`)                                      |
| `input`                                                   | Phương thức truyền prompt: `arg` hoặc `stdin`                                                |
| `maxPromptArgChars`                                       | Độ dài prompt tối đa cho chế độ `arg` trước khi chuyển sang stdin                     |
| `env` / `clearEnv`                                        | Các biến môi trường bổ sung cần chèn hoặc các tên cần loại bỏ trước khi khởi chạy                         |
| `modelArg`                                                | Cờ được dùng trước id model                                                     |
| `modelAliases`                                            | Ánh xạ id model OpenClaw sang id gốc của CLI                                          |
| `sessionArg` / `sessionArgs`                              | Cách truyền id phiên                                                          |
| `sessionMode`                                             | `always`, `existing` hoặc `none`                                                   |
| `sessionIdFields`                                         | Các trường JSON mà OpenClaw đọc từ đầu ra CLI                                        |
| `systemPromptArg` / `systemPromptFileArg`                 | Phương thức truyền prompt hệ thống                                                           |
| `systemPromptFileConfigArg` / `systemPromptFileConfigKey` | Phương thức truyền ghi đè cấu hình cho tệp prompt hệ thống (ví dụ `-c`)             |
| `systemPromptMode`                                        | `append` hoặc `replace`                                                             |
| `systemPromptWhen`                                        | `first`, `always` hoặc `never`                                                     |
| `imageArg` / `imageMode`                                  | Cờ đường dẫn hình ảnh và cách truyền nhiều hình ảnh (`repeat` hoặc `list`)              |
| `imagePathScope`                                          | Nơi lưu các tệp hình ảnh tạm trước khi bàn giao: `temp` hoặc `workspace`               |
| `serialize`                                               | Duy trì thứ tự các lần chạy cùng backend                                                    |
| `reseedFromRawTranscriptWhenUncompacted`                  | Cho phép tùy chọn gieo lại bản ghi thô có giới hạn trước compaction để đặt lại phiên an toàn |
| `reliability.watchdog`                                    | Tinh chỉnh thời gian chờ khi không có đầu ra, riêng biệt cho lần chạy mới và lần chạy tiếp tục                      |

Ưu tiên cấu hình tĩnh nhỏ nhất phù hợp với CLI. Chỉ thêm callback của plugin
cho hành vi thực sự thuộc về backend.

## Hook backend nâng cao

`CliBackendPlugin` cũng có thể định nghĩa:

| Hook                               | Công dụng                                                                         |
| ---------------------------------- | --------------------------------------------------------------------------- |
| `normalizeConfig(config, context)` | Viết lại cấu hình người dùng cũ sau khi hợp nhất                                      |
| `resolveExecutionArgs(ctx)`        | Thêm các cờ theo phạm vi yêu cầu, chẳng hạn như mức độ suy luận hoặc cô lập câu hỏi phụ |
| `prepareExecution(ctx)`            | Tạo cầu nối xác thực, cấu hình hoặc môi trường tạm thời trước khi khởi chạy         |
| `transformSystemPrompt(ctx)`       | Áp dụng phép biến đổi prompt hệ thống cuối cùng dành riêng cho CLI                          |
| `textTransforms`                   | Các phép thay thế prompt/đầu ra hai chiều                                    |
| `defaultAuthProfileId`             | Ưu tiên một hồ sơ xác thực OpenClaw cụ thể                                     |
| `authEpochMode`                    | Quyết định cách thay đổi xác thực làm mất hiệu lực các phiên CLI đã lưu                      |
| `nativeToolMode`                   | Khai báo công cụ gốc không tồn tại, luôn bật hoặc có thể được host lựa chọn      |
| `sideQuestionToolMode`             | Khai báo các công cụ gốc bị vô hiệu hóa cho câu hỏi phụ `/btw`                     |
| `bundleMcp` / `bundleMcpMode`      | Cho phép sử dụng cầu nối công cụ MCP loopback của OpenClaw                                |
| `ownsNativeCompaction`             | Backend tự quản lý compaction — OpenClaw trì hoãn                           |
| `subscriptionAuthDispatch`         | Các lần chạy nhúng đã chọn tham gia bằng thông tin xác thực thuê bao được thực thi qua backend này |
| `runtimeArtifact`                  | Giới hạn trình khởi chạy script trong toàn bộ cây gói đi kèm của nó                |

Giữ các hook này thuộc quyền quản lý của provider. Không thêm các nhánh dành riêng cho CLI vào lõi khi
một hook backend có thể biểu đạt hành vi đó.

`prepareExecution(ctx)` nhận `ctx.contextTokenBudget`, giới hạn token hiệu dụng
được chọn cho lần chạy. Các backend tự quản lý compaction gốc có thể ánh xạ
ngân sách đó vào hợp đồng khởi chạy dành riêng cho CLI của chúng.

`runtimeArtifact` thuộc quyền sở hữu của plugin và người dùng không thể ghi đè. Giá trị này chỉ được tham chiếu
khi một lượt suy luận trực tiếp tạo mới hoặc xác thực lại quyền thiết lập đã xác minh;
các lần chạy CLI thông thường không yêu cầu giá trị này. Backend không có khai báo này không thể
tạo quyền thiết lập CLI đã xác minh. Khai báo `bundled-package-tree` chỉ định
chính xác chủ sở hữu `package.json` và yêu cầu entrypoint của gói phải là
lệnh đó. OpenClaw băm toàn bộ cây gói đã cài đặt trong giới hạn, bao gồm
các phần phụ thuộc lồng nhau, và dừng an toàn đối với symlink chuyển hướng,
trình khởi chạy nằm ngoài gói đã khai báo, các khai báo phần phụ thuộc bên ngoài
bắt buộc, cây quá lớn và tập lệnh không xác định. Chỉ khai báo giá trị này khi
cây đó chứa toàn bộ phần triển khai suy luận; các tích hợp công cụ tùy chọn
không khiến biểu đồ triển khai bên ngoài trở nên an toàn.

Nếu cùng backend đó cũng cung cấp một tệp thực thi gốc độc lập, hãy liệt kê các
basename chuẩn của tệp trong `nativeExecutableNames`. Các lệnh gốc khác vẫn
không được xác minh ngay cả khi người dùng ghi đè lệnh backend.

`ctx.executionMode` là `"agent"` cho các lượt thông thường và `"side-question"` cho
các lệnh gọi `/btw` tạm thời. Sử dụng giá trị này khi CLI cần các cờ dùng một lần khác,
chẳng hạn như tắt công cụ gốc, khả năng duy trì phiên hoặc hành vi tiếp tục cho
BTW. Nếu backend thường có `nativeToolMode: "always-on"` nhưng argv cho câu hỏi phụ
của backend tắt các công cụ đó một cách đáng tin cậy, hãy đặt thêm
`sideQuestionToolMode: "disabled"`; nếu không, OpenClaw sẽ dừng an toàn khi BTW
yêu cầu một lần chạy CLI không có công cụ.

Chỉ đặt `nativeToolMode: "selectable"` khi `resolveExecutionArgs` có thể tắt
mọi công cụ gốc của backend cho từng lần chạy riêng lẻ. Đối với các lần chạy bị hạn chế đó,
`ctx.toolAvailability.native` là một tuple rỗng và
`ctx.toolAvailability.mcp` là danh sách cho phép MCP chính xác được cô lập bởi máy chủ. Hook
phải thay thế các cờ công cụ xung đột và trả về argv thực thi cả hai giá trị;
OpenClaw gọi hook này một lần với argv cuối cùng cho lượt mới hoặc tiếp tục và dừng an toàn khi
backend không thể thực thi hạn chế. Tên MCP trong ngữ cảnh này chỉ an toàn
để tự động phê duyệt vì máy chủ đã giới hạn cấu hình MCP được tạo
ở các máy chủ và công cụ đó.

### `ownsNativeCompaction`: chọn không sử dụng Compaction của OpenClaw

Nếu backend của bạn chạy một tác nhân tự Compaction bản chép lời **của chính nó**, hãy đặt
`ownsNativeCompaction: true` để trình tóm tắt bảo vệ của OpenClaw không bao giờ chạy
trên các phiên của tác nhân đó — vòng đời Compaction CLI trả về trạng thái không làm gì và
lượt tiếp tục. `claude-cli` khai báo giá trị này vì Claude Code thực hiện Compaction
nội bộ mà không có endpoint harness. Thay vào đó, các phiên harness gốc như Codex
tiếp tục được định tuyến đến endpoint Compaction của harness.

**Chỉ khai báo giá trị này khi đáp ứng tất cả các điều kiện sau**, nếu không một phiên
vượt ngân sách bị hoãn có thể tiếp tục vượt ngân sách hoặc trở nên lỗi thời (OpenClaw không còn
khắc phục phiên đó):

- backend thực hiện Compaction hoặc giới hạn bản chép lời của chính nó một cách đáng tin cậy khi gần đạt
  giới hạn cửa sổ;
- backend duy trì một phiên có thể tiếp tục để trạng thái đã Compaction tồn tại qua các lượt
  (ví dụ: `--resume` / `--session-id`);
- đây không phải là phiên Compaction bằng harness gốc — các phiên khớp với `agentHarnessId`
  được định tuyến đến endpoint harness thay thế.

## Cầu nối công cụ MCP

Các backend CLI không nhận công cụ OpenClaw theo mặc định. Nếu CLI có thể sử dụng
cấu hình MCP, hãy chọn tham gia một cách rõ ràng:

```typescript
return {
  id: "acme-cli",
  bundleMcp: true,
  bundleMcpMode: "codex-config-overrides",
  config: {
    command: "acme",
    args: ["chat", "--json"],
    output: "json",
  },
};
```

Các chế độ cầu nối được hỗ trợ:

| Chế độ                     | Cách sử dụng                                                              |
| ------------------------ | ---------------------------------------------------------------- |
| `claude-config-file`     | CLI chấp nhận tệp cấu hình MCP                              |
| `codex-config-overrides` | CLI chấp nhận các giá trị ghi đè cấu hình trong argv                        |
| `gemini-system-settings` | CLI đọc cài đặt MCP từ thư mục cài đặt hệ thống của chúng |

Chỉ bật cầu nối khi CLI thực sự có thể sử dụng nó. Nếu CLI có
lớp công cụ tích hợp riêng không thể tắt, hãy đặt `nativeToolMode:
"always-on"` để OpenClaw có thể dừng an toàn khi bên gọi yêu cầu không có công cụ gốc.
Nếu CLI có thể tắt mọi công cụ gốc theo từng lần chạy, hãy sử dụng `"selectable"` với
hợp đồng `resolveExecutionArgs` ở trên.

## Cấu hình người dùng

Người dùng có thể ghi đè mọi giá trị mặc định của backend:

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "acme-cli": {
          command: "/opt/acme/bin/acme",
          args: ["chat", "--json", "--profile", "work"],
          modelAliases: {
            large: "acme-large-2026",
          },
        },
      },
      model: {
        primary: "openai/gpt-5.6-sol",
        fallbacks: ["acme-cli/large"],
      },
    },
  },
}
```

Ghi lại giá trị ghi đè tối thiểu mà người dùng có thể cần — thường chỉ là
`command` khi tệp nhị phân nằm ngoài `PATH`.

## Xác minh

Đối với các plugin đi kèm, hãy thêm một kiểm thử tập trung cho trình dựng và việc đăng ký
thiết lập, sau đó chạy lane kiểm thử mục tiêu của plugin:

```bash
pnpm test extensions/acme-cli
```

Đối với các plugin cục bộ hoặc đã cài đặt, hãy xác minh khả năng khám phá và một lần chạy mô hình thực:

```bash
openclaw plugins inspect acme-cli --runtime --json
openclaw agent --message "chỉ trả lời chính xác: backend ok" --model acme-cli/acme-large
```

Nếu backend hỗ trợ hình ảnh hoặc MCP, hãy thêm một smoke test trực tiếp để chứng minh các
đường dẫn đó bằng CLI thực. Không dựa vào việc kiểm tra tĩnh đối với hành vi của prompt, hình ảnh,
MCP hoặc tiếp tục phiên.

## Danh sách kiểm tra

<Check>`package.json` có `openclaw.extensions` và các mục runtime đã dựng cho những gói được phát hành</Check>
<Check>`openclaw.plugin.json` khai báo `cliBackends` và `activation.onStartup` có chủ đích</Check>
<Check>`setup.cliBackends` hiện diện khi quá trình thiết lập/khám phá mô hình cần thấy backend ở trạng thái nguội</Check>
<Check>`api.registerCliBackend(...)` sử dụng cùng id backend với manifest</Check>
<Check>Các giá trị ghi đè của người dùng trong `agents.defaults.cliBackends.<id>` vẫn được ưu tiên</Check>
<Check>Cài đặt phiên, prompt hệ thống, hình ảnh và trình phân tích cú pháp đầu ra khớp với hợp đồng CLI thực</Check>
<Check>Các kiểm thử mục tiêu và ít nhất một smoke test CLI trực tiếp chứng minh đường dẫn backend</Check>

## Liên quan

- [Backend CLI](/vi/gateway/cli-backends) — cấu hình người dùng và hành vi runtime
- [Xây dựng plugin](/vi/plugins/building-plugins) — kiến thức cơ bản về gói và manifest
- [Tổng quan SDK Plugin](/vi/plugins/sdk-overview) — tài liệu tham khảo API đăng ký
- [Manifest plugin](/vi/plugins/manifest) — `cliBackends` và các bộ mô tả thiết lập
- [Harness tác nhân](/vi/plugins/sdk-agent-harness) — các runtime tác nhân bên ngoài đầy đủ
