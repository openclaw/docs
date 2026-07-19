---
read_when:
    - Bạn đang xây dựng một plugin backend CLI AI cục bộ
    - Bạn muốn đăng ký một backend cho các tham chiếu mô hình như acme-cli/model
    - Bạn cần ánh xạ một CLI của bên thứ ba vào trình chạy dự phòng văn bản của OpenClaw
sidebarTitle: CLI backend plugins
summary: Xây dựng một plugin đăng ký backend CLI AI cục bộ
title: Xây dựng các plugin backend CLI
x-i18n:
    generated_at: "2026-07-19T05:51:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: e5bce682ad5ea64c11e4447f51c0f6cb083a0f6f4b88864792b82d8ef89fa64f
    source_path: plugins/cli-backend-plugins.md
    workflow: 16
---

Plugin backend CLI cho phép OpenClaw gọi một CLI AI cục bộ làm backend suy luận
văn bản. Backend xuất hiện dưới dạng tiền tố nhà cung cấp trong tham chiếu mô hình:

```text
acme-cli/acme-large
```

Sử dụng backend CLI khi tích hợp thượng nguồn đã được cung cấp dưới dạng lệnh
cục bộ, khi CLI quản lý trạng thái đăng nhập cục bộ, hoặc làm phương án dự phòng khi các
nhà cung cấp API không khả dụng.

<Info>
  Nếu dịch vụ thượng nguồn cung cấp API mô hình HTTP thông thường, hãy viết một
  [Plugin nhà cung cấp](/vi/plugins/sdk-provider-plugins) thay thế. Nếu runtime thượng nguồn
  quản lý toàn bộ phiên tác nhân, sự kiện công cụ, Compaction hoặc trạng thái tác vụ
  nền, hãy sử dụng một [bộ khung tác nhân](/vi/plugins/sdk-agent-harness).
</Info>

## Những gì Plugin quản lý

Một Plugin backend CLI có ba hợp đồng:

| Hợp đồng             | Tệp                   | Mục đích                                                   |
| -------------------- | ---------------------- | --------------------------------------------------------- |
| Điểm vào gói        | `package.json`         | Trỏ OpenClaw đến mô-đun runtime của Plugin              |
| Quyền sở hữu manifest   | `openclaw.plugin.json` | Khai báo id backend trước khi runtime tải              |
| Đăng ký runtime | `index.ts`             | Gọi `api.registerCliBackend(...)` với các giá trị mặc định của lệnh |

Manifest là siêu dữ liệu khám phá: nó không thực thi CLI hoặc đăng ký
hành vi runtime. Hành vi runtime bắt đầu khi điểm vào Plugin gọi
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

    Các gói đã xuất bản phải phân phối các tệp runtime JavaScript đã được biên dịch. Nếu điểm vào
    nguồn của bạn là `./src/index.ts`, hãy thêm `openclaw.runtimeExtensions` trỏ đến tệp JavaScript
    đã biên dịch tương ứng. Xem [Điểm vào](/vi/plugins/sdk-entrypoints).

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
    Plugin khi cấu hình hoặc lựa chọn mô hình đề cập đến `acme-cli/...`.

    `setup.cliBackends` là bề mặt thiết lập ưu tiên bộ mô tả. Hãy thêm nó khi
    việc khám phá mô hình, quy trình làm quen hoặc trạng thái cần nhận diện backend
    mà không tải runtime của Plugin. Chỉ sử dụng `requiresRuntime: false` khi
    các bộ mô tả tĩnh đó đủ cho việc thiết lập.

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

    Id backend phải khớp với mục `cliBackends` trong manifest. `config`
    đã đăng ký chỉ là giá trị mặc định; cấu hình người dùng trong
    `agents.defaults.cliBackends.acme-cli` sẽ được hợp nhất ghi đè lên nó trong runtime.

  </Step>
</Steps>

## Hình dạng cấu hình

`CliBackendConfig` mô tả cách OpenClaw khởi chạy và phân tích cú pháp CLI:

| Trường                                                     | Công dụng                                                                               |
| --------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `command`                                                 | Tên tệp nhị phân hoặc đường dẫn lệnh tuyệt đối                                              |
| `args`                                                    | argv cơ sở cho các lần chạy mới                                                          |
| `resumeArgs`                                              | argv thay thế cho các phiên được tiếp tục; hỗ trợ `{sessionId}`                       |
| `output` / `resumeOutput`                                 | Bộ phân tích cú pháp: `json`, `jsonl` hoặc `text`                                                |
| `jsonlDialect`                                            | Phương ngữ sự kiện JSONL: `claude-stream-json` hoặc `gemini-stream-json`                 |
| `liveSession`                                             | Chế độ tiến trình CLI tồn tại lâu dài (`claude-stdio`)                                      |
| `input`                                                   | Phương thức truyền lời nhắc: `arg` hoặc `stdin`                                                |
| `maxPromptArgChars`                                       | Độ dài lời nhắc tối đa cho chế độ `arg` trước khi chuyển sang stdin                     |
| `env` / `clearEnv`                                        | Các biến môi trường bổ sung để chèn vào hoặc tên cần loại bỏ trước khi khởi chạy                         |
| `modelArg`                                                | Cờ được sử dụng trước id mô hình                                                     |
| `modelAliases`                                            | Ánh xạ id mô hình OpenClaw sang id gốc của CLI                                          |
| `sessionArg` / `sessionArgs`                              | Cách truyền id phiên                                                          |
| `sessionMode`                                             | `always`, `existing` hoặc `none`                                                   |
| `sessionIdFields`                                         | Các trường JSON mà OpenClaw đọc từ đầu ra CLI                                        |
| `systemPromptArg` / `systemPromptFileArg`                 | Phương thức truyền lời nhắc hệ thống                                                           |
| `systemPromptFileConfigArg` / `systemPromptFileConfigKey` | Phương thức truyền ghi đè cấu hình cho tệp lời nhắc hệ thống (ví dụ `-c`)             |
| `systemPromptMode`                                        | `append` hoặc `replace`                                                             |
| `systemPromptWhen`                                        | `first`, `always` hoặc `never`                                                     |
| `imageArg` / `imageMode`                                  | Cờ đường dẫn hình ảnh và cách truyền nhiều hình ảnh (`repeat` hoặc `list`)              |
| `imagePathScope`                                          | Nơi lưu các tệp hình ảnh đã chuẩn bị trước khi bàn giao: `temp` hoặc `workspace`               |
| `serialize`                                               | Giữ thứ tự các lần chạy trên cùng một backend                                                    |
| `reseedFromRawTranscriptWhenUncompacted`                  | Chủ động bật tái khởi tạo bản chép lời thô có giới hạn trước Compaction để đặt lại phiên an toàn |
| `reliability.outputLimits`                                | Số ký tự/dòng JSONL thô tối đa được giữ lại cho một lượt CLI trực tiếp (backend phiên trực tiếp)  |
| `reliability.watchdog`                                    | Tinh chỉnh thời gian chờ khi không có đầu ra, tách biệt cho lần chạy mới và lần chạy tiếp tục                      |

Ưu tiên cấu hình tĩnh nhỏ nhất phù hợp với CLI. Chỉ thêm callback của Plugin
cho hành vi thực sự thuộc về backend.

## Hook backend nâng cao

`CliBackendPlugin` cũng có thể định nghĩa:

| Hook                               | Công dụng                                                                         |
| ---------------------------------- | --------------------------------------------------------------------------- |
| `normalizeConfig(config, context)` | Viết lại cấu hình người dùng cũ sau khi hợp nhất                                      |
| `resolveExecutionArgs(ctx)`        | Thêm các cờ theo phạm vi yêu cầu, chẳng hạn như mức độ suy luận hoặc cô lập câu hỏi phụ |
| `prepareExecution(ctx)`            | Tạo cầu nối xác thực, cấu hình hoặc môi trường tạm thời trước khi khởi chạy         |
| `transformSystemPrompt(ctx)`       | Áp dụng phép biến đổi lời nhắc hệ thống dành riêng cho CLI ở bước cuối                          |
| `textTransforms`                   | Thay thế hai chiều giữa lời nhắc và đầu ra                                    |
| `defaultAuthProfileId`             | Ưu tiên một hồ sơ xác thực OpenClaw cụ thể                                     |
| `authEpochMode`                    | Quyết định cách các thay đổi xác thực làm mất hiệu lực các phiên CLI đã lưu                      |
| `nativeToolMode`                   | Khai báo công cụ gốc không tồn tại, luôn bật hay có thể được máy chủ lựa chọn      |
| `sideQuestionToolMode`             | Khai báo các công cụ gốc bị vô hiệu hóa cho câu hỏi phụ `/btw`                     |
| `bundleMcp` / `bundleMcpMode`      | Chủ động bật cầu nối công cụ MCP loopback của OpenClaw                                |
| `ownsNativeCompaction`             | Backend tự quản lý Compaction — OpenClaw trì hoãn                           |
| `subscriptionAuthDispatch`         | Các lần chạy nhúng đã chủ động bật trên thông tin xác thực thuê bao được thực thi qua backend này |
| `runtimeArtifact`                  | Giới hạn trình khởi chạy tập lệnh trong toàn bộ cây gói được đóng gói của nó                |

Giữ các hook này thuộc quyền quản lý của nhà cung cấp. Không thêm các nhánh dành riêng cho CLI vào lõi khi
một hook backend có thể biểu đạt hành vi đó.

`prepareExecution(ctx)` nhận `ctx.contextTokenBudget`, giới hạn token hiệu dụng
được chọn cho lần chạy. Các backend tự quản lý Compaction gốc có thể ánh xạ
hạn mức đó vào hợp đồng khởi chạy dành riêng cho CLI của chúng.

`runtimeArtifact` thuộc quyền sở hữu của plugin và người dùng không thể ghi đè. Nó chỉ được tham chiếu
khi một lượt suy luận trực tiếp cấp mới hoặc xác thực lại thẩm quyền thiết lập đã xác minh;
các lần chạy CLI thông thường không yêu cầu nó. Một backend không có khai báo này không thể
cấp thẩm quyền thiết lập CLI đã xác minh. Khai báo `bundled-package-tree` chỉ định
chính xác chủ sở hữu `package.json` và yêu cầu entrypoint của gói phải là
lệnh đó. OpenClaw băm toàn bộ cây gói đã cài đặt trong phạm vi giới hạn, bao gồm
các phần phụ thuộc lồng nhau, và đóng an toàn đối với symlink chuyển hướng,
trình khởi chạy nằm ngoài gói đã khai báo, khai báo phần phụ thuộc bên ngoài
bắt buộc, cây quá lớn và tập lệnh không xác định. Chỉ khai báo điều này khi
cây đó chứa toàn bộ phần triển khai suy luận; các tích hợp công cụ tùy chọn
không làm cho một đồ thị triển khai bên ngoài trở nên an toàn.

Nếu cùng backend đó cũng cung cấp một tệp thực thi gốc độc lập, hãy liệt kê
các tên cơ sở chính tắc của nó trong `nativeExecutableNames`. Các lệnh gốc khác vẫn
chưa được xác minh ngay cả khi người dùng ghi đè lệnh backend.

`ctx.executionMode` là `"agent"` cho các lượt thông thường và `"side-question"` cho
các lệnh gọi `/btw` tạm thời. Sử dụng nó khi CLI cần các cờ dùng một lần khác nhau,
chẳng hạn như vô hiệu hóa công cụ gốc, khả năng duy trì phiên hoặc hành vi tiếp tục cho
BTW. Nếu một backend thường có `nativeToolMode: "always-on"` nhưng argv cho câu hỏi phụ của nó
vô hiệu hóa các công cụ đó một cách đáng tin cậy, hãy đặt cả
`sideQuestionToolMode: "disabled"`; nếu không, OpenClaw sẽ đóng an toàn khi BTW
yêu cầu một lần chạy CLI không có công cụ.

Chỉ đặt `nativeToolMode: "selectable"` khi `resolveExecutionArgs` có thể vô hiệu hóa
mọi công cụ gốc của backend cho một lần chạy riêng lẻ. Đối với các lần chạy bị hạn chế đó,
`ctx.toolAvailability.native` là một tuple rỗng và
`ctx.toolAvailability.mcp` là danh sách cho phép MCP được cô lập với máy chủ chính xác. Hook
phải thay thế các cờ công cụ xung đột và trả về argv thực thi cả hai giá trị;
OpenClaw gọi nó một lần với argv cuối cùng cho lượt mới hoặc tiếp tục và đóng an toàn khi
backend không thể thực thi hạn chế. Tên MCP trong ngữ cảnh này chỉ an toàn để
tự động phê duyệt vì máy chủ đã giới hạn cấu hình MCP được tạo
ở các máy chủ và công cụ đó.

### `ownsNativeCompaction`: không sử dụng Compaction của OpenClaw

Nếu backend của bạn chạy một tác nhân tự nén bản chép lời **của chính nó**, hãy đặt
`ownsNativeCompaction: true` để trình tóm tắt bảo vệ của OpenClaw không bao giờ chạy
trên các phiên của nó - vòng đời Compaction của CLI trả về thao tác không làm gì và
lượt tiếp tục. `claude-cli` khai báo điều này vì Claude Code nén
nội bộ mà không có endpoint của harness. Thay vào đó, các phiên harness gốc như Codex
tiếp tục được định tuyến đến endpoint Compaction của harness.

**Chỉ khai báo khi đáp ứng tất cả các điều kiện sau**, nếu không một phiên vượt ngân sách
bị trì hoãn có thể tiếp tục vượt ngân sách hoặc trở nên lỗi thời (OpenClaw không còn
cứu phiên đó):

- backend nén hoặc giới hạn bản chép lời của chính nó một cách đáng tin cậy khi gần đạt
  giới hạn cửa sổ;
- backend duy trì một phiên có thể tiếp tục để trạng thái đã nén tồn tại qua các lượt
  (ví dụ `--resume` / `--session-id`);
- đó không phải là phiên Compaction của harness gốc - các phiên khớp với `agentHarnessId`
  được định tuyến đến endpoint của harness thay thế.

## Cầu nối công cụ MCP

Các backend CLI không nhận công cụ OpenClaw theo mặc định. Nếu CLI có thể sử dụng
cấu hình MCP, hãy chủ động bật tính năng này:

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

| Chế độ                   | Công dụng                                                        |
| ------------------------ | ---------------------------------------------------------------- |
| `claude-config-file`     | CLI chấp nhận tệp cấu hình MCP                                   |
| `codex-config-overrides` | CLI chấp nhận các giá trị ghi đè cấu hình trên argv              |
| `gemini-system-settings` | CLI đọc cài đặt MCP từ thư mục cài đặt hệ thống của chúng         |

Chỉ bật cầu nối khi CLI thực sự có thể sử dụng nó. Nếu CLI có
lớp công cụ tích hợp riêng không thể vô hiệu hóa, hãy đặt `nativeToolMode:
"always-on"` để OpenClaw có thể đóng an toàn khi bên gọi yêu cầu không có công cụ
gốc. Nếu nó có thể vô hiệu hóa mọi công cụ gốc theo từng lần chạy, hãy sử dụng `"selectable"` với
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

Ghi lại mức ghi đè tối thiểu mà người dùng có khả năng cần - thường chỉ là
`command` khi tệp nhị phân nằm ngoài `PATH`.

## Xác minh

Đối với các plugin đi kèm, hãy thêm một kiểm thử tập trung cho trình dựng và việc
đăng ký thiết lập, sau đó chạy lane kiểm thử mục tiêu của plugin:

```bash
pnpm test extensions/acme-cli
```

Đối với các plugin cục bộ hoặc đã cài đặt, hãy xác minh quá trình khám phá và một lần chạy mô hình thực tế:

```bash
openclaw plugins inspect acme-cli --runtime --json
openclaw agent --message "chỉ trả lời chính xác: backend ok" --model acme-cli/acme-large
```

Nếu backend hỗ trợ hình ảnh hoặc MCP, hãy thêm một kiểm thử khói trực tiếp để chứng minh các
đường dẫn đó bằng CLI thực. Không dựa vào kiểm tra tĩnh cho hành vi của prompt, hình ảnh,
MCP hoặc tiếp tục phiên.

## Danh sách kiểm tra

<Check>`package.json` có `openclaw.extensions` và các mục runtime đã dựng cho các gói đã phát hành</Check>
<Check>`openclaw.plugin.json` khai báo `cliBackends` và `activation.onStartup` có chủ đích</Check>
<Check>`setup.cliBackends` hiện diện khi quá trình thiết lập/khám phá mô hình cần thấy backend ở trạng thái nguội</Check>
<Check>`api.registerCliBackend(...)` sử dụng cùng id backend với manifest</Check>
<Check>Các giá trị ghi đè của người dùng trong `agents.defaults.cliBackends.<id>` vẫn được ưu tiên</Check>
<Check>Các cài đặt phiên, prompt hệ thống, hình ảnh và trình phân tích đầu ra khớp với hợp đồng CLI thực</Check>
<Check>Các kiểm thử mục tiêu và ít nhất một kiểm thử khói CLI trực tiếp chứng minh đường dẫn backend</Check>

## Liên quan

- [Backend CLI](/vi/gateway/cli-backends) - cấu hình người dùng và hành vi runtime
- [Xây dựng plugin](/vi/plugins/building-plugins) - kiến thức cơ bản về gói và manifest
- [Tổng quan về SDK plugin](/vi/plugins/sdk-overview) - tài liệu tham khảo API đăng ký
- [Manifest plugin](/vi/plugins/manifest) - `cliBackends` và các bộ mô tả thiết lập
- [Harness tác nhân](/vi/plugins/sdk-agent-harness) - các runtime tác nhân bên ngoài đầy đủ
