---
read_when:
    - Bạn đang xây dựng một Plugin phụ trợ CLI AI cục bộ
    - Bạn muốn đăng ký một backend cho các tham chiếu mô hình như acme-cli/model
    - Bạn cần ánh xạ một CLI của bên thứ ba vào trình chạy dự phòng văn bản của OpenClaw
sidebarTitle: CLI backend plugins
summary: Xây dựng một plugin đăng ký một backend CLI AI cục bộ
title: Xây dựng Plugin backend CLI
x-i18n:
    generated_at: "2026-06-27T17:44:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d91c2b712a821005303c6cbb0ccbd8f263c8c30c5dbd6ed05b842c47c63f0542
    source_path: plugins/cli-backend-plugins.md
    workflow: 16
---

Các Plugin phần phụ trợ CLI cho phép OpenClaw gọi một CLI AI cục bộ làm phần phụ trợ suy luận văn bản
. Phần phụ trợ xuất hiện dưới dạng tiền tố nhà cung cấp trong tham chiếu mô hình:

```text
acme-cli/acme-large
```

Dùng phần phụ trợ CLI khi tích hợp thượng nguồn đã được cung cấp dưới dạng một
lệnh cục bộ, khi CLI sở hữu trạng thái đăng nhập cục bộ, hoặc khi CLI là một
phương án dự phòng hữu ích nếu các nhà cung cấp API không khả dụng.

<Info>
  Nếu dịch vụ thượng nguồn cung cấp API mô hình HTTP thông thường, hãy viết một
  [Plugin nhà cung cấp](/vi/plugins/sdk-provider-plugins) thay thế. Nếu runtime thượng nguồn
  sở hữu toàn bộ phiên tác nhân, sự kiện công cụ, Compaction, hoặc trạng thái
  tác vụ nền, hãy dùng một [bộ khai thác tác nhân](/vi/plugins/sdk-agent-harness).
</Info>

## Plugin sở hữu những gì

Một Plugin phần phụ trợ CLI có ba hợp đồng:

| Hợp đồng             | Tệp                    | Mục đích                                                  |
| -------------------- | ---------------------- | --------------------------------------------------------- |
| Điểm vào gói         | `package.json`         | Trỏ OpenClaw đến mô-đun runtime của Plugin                |
| Quyền sở hữu manifest | `openclaw.plugin.json` | Khai báo id phần phụ trợ trước khi runtime tải            |
| Đăng ký runtime      | `index.ts`             | Gọi `api.registerCliBackend(...)` với mặc định lệnh       |

Manifest là siêu dữ liệu khám phá. Nó không thực thi CLI và không
đăng ký hành vi runtime. Hành vi runtime bắt đầu khi điểm vào Plugin gọi
`api.registerCliBackend(...)`.

## Plugin phần phụ trợ tối thiểu

<Steps>
  <Step title="Create package metadata">
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

    Các gói đã phát hành phải đi kèm tệp runtime JavaScript đã build. Nếu điểm vào
    nguồn của bạn là `./src/index.ts`, hãy thêm `openclaw.runtimeExtensions` trỏ đến
    tệp JavaScript đã build tương ứng. Xem [Điểm vào](/vi/plugins/sdk-entrypoints).

  </Step>

  <Step title="Declare backend ownership">
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

    `cliBackends` là danh sách quyền sở hữu runtime. Nó cho phép OpenClaw tự động tải
    Plugin khi cấu hình hoặc lựa chọn mô hình nhắc đến `acme-cli/...`.

    `setup.cliBackends` là bề mặt thiết lập ưu tiên bộ mô tả. Thêm nó khi
    khám phá mô hình, onboarding, hoặc trạng thái cần nhận diện phần phụ trợ mà không
    tải runtime của Plugin. Chỉ dùng `requiresRuntime: false` khi các bộ mô tả tĩnh đó
    là đủ cho thiết lập.

  </Step>

  <Step title="Register the backend">
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

    Id phần phụ trợ phải khớp với mục `cliBackends` trong manifest. `config` đã đăng ký
    chỉ là mặc định; cấu hình người dùng dưới
    `agents.defaults.cliBackends.acme-cli` được hợp nhất đè lên nó lúc runtime.

  </Step>
</Steps>

## Hình dạng cấu hình

`CliBackendConfig` mô tả cách OpenClaw nên khởi chạy và phân tích CLI:

| Trường                                    | Cách dùng                                                   |
| ----------------------------------------- | ----------------------------------------------------------- |
| `command`                                 | Tên binary hoặc đường dẫn lệnh tuyệt đối                    |
| `args`                                    | argv cơ sở cho các lần chạy mới                             |
| `resumeArgs`                              | argv thay thế cho phiên được tiếp tục; hỗ trợ `{sessionId}` |
| `output` / `resumeOutput`                 | Bộ phân tích: `json`, `jsonl`, hoặc `text`                  |
| `input`                                   | Truyền prompt: `arg` hoặc `stdin`                           |
| `modelArg`                                | Cờ dùng trước id mô hình                                    |
| `modelAliases`                            | Ánh xạ id mô hình OpenClaw sang id gốc của CLI              |
| `sessionArg` / `sessionArgs`              | Cách truyền id phiên                                        |
| `sessionMode`                             | `always`, `existing`, hoặc `none`                           |
| `sessionIdFields`                         | Các trường JSON mà OpenClaw đọc từ đầu ra CLI               |
| `systemPromptArg` / `systemPromptFileArg` | Truyền system prompt                                        |
| `systemPromptWhen`                        | `first`, `always`, hoặc `never`                             |
| `imageArg` / `imageMode`                  | Hỗ trợ đường dẫn hình ảnh                                   |
| `serialize`                               | Giữ các lần chạy cùng phần phụ trợ theo đúng thứ tự         |
| `reliability.watchdog`                    | Tinh chỉnh thời gian chờ khi không có đầu ra                |

Ưu tiên cấu hình tĩnh nhỏ nhất khớp với CLI. Chỉ thêm callback Plugin
cho hành vi thực sự thuộc về phần phụ trợ.

## Hook phần phụ trợ nâng cao

`CliBackendPlugin` cũng có thể định nghĩa:

| Hook                               | Cách dùng                                                                    |
| ---------------------------------- | --------------------------------------------------------------------------- |
| `normalizeConfig(config, context)` | Viết lại cấu hình người dùng cũ sau khi hợp nhất                            |
| `resolveExecutionArgs(ctx)`        | Thêm cờ theo phạm vi yêu cầu, như mức nỗ lực suy nghĩ hoặc cô lập câu hỏi phụ |
| `prepareExecution(ctx)`            | Tạo cầu nối xác thực hoặc cấu hình tạm thời trước khi khởi chạy             |
| `transformSystemPrompt(ctx)`       | Áp dụng phép biến đổi system prompt cuối cùng dành riêng cho CLI            |
| `textTransforms`                   | Thay thế prompt/đầu ra hai chiều                                             |
| `defaultAuthProfileId`             | Ưu tiên một hồ sơ xác thực OpenClaw cụ thể                                  |
| `authEpochMode`                    | Quyết định cách thay đổi xác thực làm mất hiệu lực các phiên CLI đã lưu     |
| `nativeToolMode`                   | Khai báo CLI có công cụ gốc luôn bật hay không                              |
| `sideQuestionToolMode`             | Khai báo công cụ gốc bị tắt cho câu hỏi phụ `/btw`                          |
| `bundleMcp` / `bundleMcpMode`      | Chọn dùng cầu nối công cụ MCP local loopback của OpenClaw                   |
| `ownsNativeCompaction`             | Phần phụ trợ sở hữu Compaction riêng - OpenClaw trì hoãn                    |

Giữ các hook này thuộc sở hữu nhà cung cấp. Không thêm nhánh riêng cho CLI vào lõi khi
hook phần phụ trợ có thể biểu đạt hành vi đó.

`ctx.executionMode` là `"agent"` cho các lượt thông thường và `"side-question"` cho
các lệnh gọi `/btw` tạm thời. Dùng nó khi CLI cần các cờ một lần khác nhau, chẳng hạn
tắt công cụ gốc, lưu phiên, hoặc hành vi tiếp tục cho BTW. Nếu một
phần phụ trợ thường có `nativeToolMode: "always-on"` nhưng argv câu hỏi phụ của nó
tắt các công cụ đó một cách đáng tin cậy, cũng đặt `sideQuestionToolMode: "disabled"`;
nếu không OpenClaw sẽ đóng an toàn khi BTW yêu cầu một lần chạy CLI không có công cụ.

### `ownsNativeCompaction`: không dùng Compaction của OpenClaw

Nếu phần phụ trợ của bạn chạy một tác nhân tự compact bản ghi **riêng** của nó, hãy đặt
`ownsNativeCompaction: true` để bộ tóm tắt bảo vệ của OpenClaw không bao giờ chạy trên các
phiên của nó - vòng đời Compaction của CLI trả về no-op và lượt chạy tiếp tục. `claude-cli`
khai báo điều này vì Claude Code compact nội bộ mà không có endpoint bộ khai thác. Các phiên
bộ khai thác gốc như Codex vẫn định tuyến đến endpoint Compaction của bộ khai thác thay thế.

**Chỉ khai báo khi tất cả các điều kiện sau đúng**, nếu không một phiên vượt ngân sách bị trì hoãn có thể
vẫn vượt ngân sách / trở nên lỗi thời (OpenClaw không còn cứu nó):

- phần phụ trợ compact hoặc giới hạn bản ghi của chính nó một cách đáng tin cậy khi gần đến cửa sổ;
- nó lưu một phiên có thể tiếp tục để trạng thái đã compact tồn tại qua các lượt
  (ví dụ `--resume` / `--session-id`);
- nó không phải là phiên Compaction của bộ khai thác gốc - các phiên khớp `agentHarnessId`
  định tuyến đến endpoint bộ khai thác thay thế.

## Cầu nối công cụ MCP

Các phần phụ trợ CLI không nhận công cụ OpenClaw theo mặc định. Nếu CLI có thể tiêu thụ
cấu hình MCP, hãy chọn dùng một cách rõ ràng:

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

Các chế độ cầu nối được hỗ trợ là:

| Chế độ                   | Cách dùng                                                        |
| ------------------------ | ---------------------------------------------------------------- |
| `claude-config-file`     | CLI chấp nhận tệp cấu hình MCP                                   |
| `codex-config-overrides` | CLI chấp nhận ghi đè cấu hình trên argv                          |
| `gemini-system-settings` | CLI đọc thiết lập MCP từ thư mục thiết lập hệ thống của chúng    |

Chỉ bật cầu nối khi CLI thực sự có thể tiêu thụ nó. Nếu CLI có
lớp công cụ tích hợp riêng không thể tắt, hãy đặt `nativeToolMode:
"always-on"` để OpenClaw có thể đóng an toàn khi caller yêu cầu không có công cụ gốc.

## Cấu hình người dùng

Người dùng có thể ghi đè bất kỳ mặc định phần phụ trợ nào:

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
        primary: "openai/gpt-5.5",
        fallbacks: ["acme-cli/large"],
      },
    },
  },
}
```

Tài liệu hóa phần ghi đè tối thiểu mà người dùng có khả năng cần. Thông thường đó chỉ là
`command` khi binary nằm ngoài `PATH`.

## Xác minh

Đối với Plugin đi kèm, hãy thêm một kiểm thử tập trung quanh trình dựng và đăng ký thiết lập, sau đó chạy làn kiểm thử mục tiêu của Plugin:

```bash
pnpm test extensions/acme-cli
```

Đối với Plugin cục bộ hoặc đã cài đặt, hãy xác minh khả năng phát hiện và một lần chạy mô hình thực tế:

```bash
openclaw plugins inspect acme-cli --runtime --json
openclaw agent --message "reply exactly: backend ok" --model acme-cli/acme-large
```

Nếu backend hỗ trợ hình ảnh hoặc MCP, hãy thêm một smoke test trực tiếp để chứng minh các đường dẫn đó bằng CLI thật. Không dựa vào kiểm tra tĩnh cho hành vi prompt, hình ảnh, MCP hoặc tiếp tục phiên.

## Danh sách kiểm tra

<Check>`package.json` có `openclaw.extensions` và các mục runtime đã dựng cho các gói đã phát hành</Check>
<Check>`openclaw.plugin.json` khai báo `cliBackends` và `activation.onStartup` có chủ đích</Check>
<Check>`setup.cliBackends` hiện diện khi thiết lập/phát hiện mô hình cần thấy backend ở trạng thái lạnh</Check>
<Check>`api.registerCliBackend(...)` dùng cùng id backend như manifest</Check>
<Check>Các ghi đè của người dùng trong `agents.defaults.cliBackends.<id>` vẫn được ưu tiên</Check>
<Check>Cài đặt phiên, system prompt, hình ảnh và trình phân tích cú pháp đầu ra khớp với hợp đồng CLI thực tế</Check>
<Check>Các kiểm thử mục tiêu và ít nhất một smoke test CLI trực tiếp chứng minh đường dẫn backend</Check>

## Liên quan

- [Backend CLI](/vi/gateway/cli-backends) - cấu hình của người dùng và hành vi runtime
- [Xây dựng Plugin](/vi/plugins/building-plugins) - kiến thức cơ bản về gói và manifest
- [Tổng quan Plugin SDK](/vi/plugins/sdk-overview) - tham chiếu API đăng ký
- [Manifest Plugin](/vi/plugins/manifest) - `cliBackends` và bộ mô tả thiết lập
- [Agent harness](/vi/plugins/sdk-agent-harness) - runtime agent bên ngoài đầy đủ
