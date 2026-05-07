---
read_when:
    - Bạn đang xây dựng một Plugin backend AI cục bộ cho CLI
    - Bạn muốn đăng ký một phần phụ trợ cho các tham chiếu mô hình như acme-cli/model
    - Bạn cần ánh xạ một CLI của bên thứ ba vào trình chạy dự phòng dạng văn bản của OpenClaw
sidebarTitle: CLI backend plugins
summary: Xây dựng Plugin đăng ký phần phụ trợ CLI trí tuệ nhân tạo cục bộ
title: Xây dựng các Plugin phần phụ trợ CLI
x-i18n:
    generated_at: "2026-05-07T13:22:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9fcd604d35eb20d91350d5201236f22edfe7bb7e52eb19e89bceb8025dd3a29b
    source_path: plugins/cli-backend-plugins.md
    workflow: 16
---

Plugin backend CLI cho phép OpenClaw gọi một CLI AI cục bộ làm backend suy luận văn bản. Backend này xuất hiện như một tiền tố nhà cung cấp trong tham chiếu mô hình:

```text
acme-cli/acme-large
```

Dùng backend CLI khi tích hợp thượng nguồn đã được cung cấp dưới dạng lệnh cục bộ, khi CLI sở hữu trạng thái đăng nhập cục bộ, hoặc khi CLI là phương án dự phòng hữu ích nếu các nhà cung cấp API không khả dụng.

<Info>
  Nếu dịch vụ thượng nguồn cung cấp API mô hình HTTP thông thường, hãy viết một
  [Plugin nhà cung cấp](/vi/plugins/sdk-provider-plugins) thay thế. Nếu runtime thượng nguồn sở hữu toàn bộ phiên agent, sự kiện công cụ, Compaction, hoặc trạng thái tác vụ nền, hãy dùng một [agent harness](/vi/plugins/sdk-agent-harness).
</Info>

## Plugin sở hữu những gì

Một Plugin backend CLI có ba hợp đồng:

| Hợp đồng             | Tệp                    | Mục đích                                                  |
| -------------------- | ---------------------- | --------------------------------------------------------- |
| Điểm vào gói         | `package.json`         | Trỏ OpenClaw tới mô-đun runtime của Plugin                |
| Quyền sở hữu manifest | `openclaw.plugin.json` | Khai báo id backend trước khi runtime tải                 |
| Đăng ký runtime      | `index.ts`             | Gọi `api.registerCliBackend(...)` với mặc định lệnh       |

Manifest là siêu dữ liệu khám phá. Nó không thực thi CLI và không đăng ký hành vi runtime. Hành vi runtime bắt đầu khi điểm vào Plugin gọi `api.registerCliBackend(...)`.

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

    Các gói đã phát hành phải phân phối tệp runtime JavaScript đã build. Nếu điểm vào nguồn của bạn là `./src/index.ts`, hãy thêm `openclaw.runtimeExtensions` trỏ tới tệp JavaScript ngang hàng đã build. Xem [Điểm vào](/vi/plugins/sdk-entrypoints).

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

    `cliBackends` là danh sách quyền sở hữu runtime. Nó cho phép OpenClaw tự động tải Plugin khi cấu hình hoặc lựa chọn mô hình nhắc tới `acme-cli/...`.

    `setup.cliBackends` là bề mặt thiết lập ưu tiên descriptor. Thêm nó khi khám phá mô hình, onboarding, hoặc trạng thái cần nhận diện backend mà không tải runtime của Plugin. Chỉ dùng `requiresRuntime: false` khi các descriptor tĩnh đó đã đủ cho thiết lập.

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

    Id backend phải khớp với mục `cliBackends` trong manifest. `config` đã đăng ký chỉ là mặc định; cấu hình người dùng dưới `agents.defaults.cliBackends.acme-cli` sẽ được hợp nhất đè lên nó ở runtime.

  </Step>
</Steps>

## Hình dạng cấu hình

`CliBackendConfig` mô tả cách OpenClaw nên khởi chạy và phân tích CLI:

| Trường                                    | Cách dùng                                                   |
| ----------------------------------------- | ----------------------------------------------------------- |
| `command`                                 | Tên binary hoặc đường dẫn lệnh tuyệt đối                    |
| `args`                                    | argv cơ sở cho lượt chạy mới                                |
| `resumeArgs`                              | argv thay thế cho phiên được tiếp tục; hỗ trợ `{sessionId}` |
| `output` / `resumeOutput`                 | Bộ phân tích: `json`, `jsonl`, hoặc `text`                  |
| `input`                                   | Truyền prompt: `arg` hoặc `stdin`                           |
| `modelArg`                                | Cờ dùng trước id mô hình                                    |
| `modelAliases`                            | Ánh xạ id mô hình OpenClaw sang id gốc của CLI              |
| `sessionArg` / `sessionArgs`              | Cách truyền id phiên                                        |
| `sessionMode`                             | `always`, `existing`, hoặc `none`                           |
| `sessionIdFields`                         | Các trường JSON OpenClaw đọc từ đầu ra CLI                  |
| `systemPromptArg` / `systemPromptFileArg` | Truyền system prompt                                        |
| `systemPromptWhen`                        | `first`, `always`, hoặc `never`                             |
| `imageArg` / `imageMode`                  | Hỗ trợ đường dẫn ảnh                                        |
| `serialize`                               | Giữ thứ tự các lượt chạy cùng backend                       |
| `reliability.watchdog`                    | Tinh chỉnh thời gian chờ khi không có đầu ra                |

Ưu tiên cấu hình tĩnh nhỏ nhất khớp với CLI. Chỉ thêm callback của Plugin cho hành vi thật sự thuộc về backend.

## Hook backend nâng cao

`CliBackendPlugin` cũng có thể định nghĩa:

| Hook                               | Cách dùng                                                    |
| ---------------------------------- | ------------------------------------------------------------ |
| `normalizeConfig(config, context)` | Viết lại cấu hình người dùng cũ sau khi hợp nhất             |
| `resolveExecutionArgs(ctx)`        | Thêm cờ theo phạm vi yêu cầu, chẳng hạn như mức effort suy nghĩ |
| `prepareExecution(ctx)`            | Tạo cầu nối xác thực hoặc cấu hình tạm thời trước khi khởi chạy |
| `transformSystemPrompt(ctx)`       | Áp dụng biến đổi system prompt cuối cùng dành riêng cho CLI  |
| `textTransforms`                   | Thay thế prompt/đầu ra hai chiều                             |
| `defaultAuthProfileId`             | Ưu tiên một hồ sơ xác thực OpenClaw cụ thể                   |
| `authEpochMode`                    | Quyết định cách thay đổi xác thực làm mất hiệu lực phiên CLI đã lưu |
| `nativeToolMode`                   | Khai báo liệu CLI có công cụ gốc luôn bật hay không          |
| `bundleMcp` / `bundleMcpMode`      | Chọn tham gia cầu nối công cụ MCP loopback của OpenClaw      |

Giữ các hook này thuộc sở hữu của nhà cung cấp. Không thêm nhánh dành riêng cho CLI vào core khi hook backend có thể biểu đạt hành vi đó.

## Cầu nối công cụ MCP

Backend CLI mặc định không nhận công cụ OpenClaw. Nếu CLI có thể tiêu thụ cấu hình MCP, hãy chọn tham gia rõ ràng:

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

Chỉ bật cầu nối khi CLI thật sự có thể tiêu thụ nó. Nếu CLI có lớp công cụ tích hợp riêng không thể tắt, hãy đặt `nativeToolMode:
"always-on"` để OpenClaw có thể fail closed khi bên gọi yêu cầu không có công cụ gốc.

## Cấu hình người dùng

Người dùng có thể ghi đè bất kỳ mặc định backend nào:

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

Ghi tài liệu về ghi đè tối thiểu mà người dùng nhiều khả năng cần. Thường đó chỉ là `command` khi binary nằm ngoài `PATH`.

## Xác minh

Đối với Plugin đi kèm, hãy thêm một kiểm thử tập trung quanh builder và đăng ký thiết lập, rồi chạy lane kiểm thử mục tiêu của Plugin:

```bash
pnpm test extensions/acme-cli
```

Đối với Plugin cục bộ hoặc đã cài đặt, hãy xác minh khám phá và một lượt chạy mô hình thật:

```bash
openclaw plugins inspect acme-cli --runtime --json
openclaw agent --message "reply exactly: backend ok" --model acme-cli/acme-large
```

Nếu backend hỗ trợ ảnh hoặc MCP, hãy thêm smoke live chứng minh các đường dẫn đó với CLI thật. Không dựa vào kiểm tra tĩnh cho hành vi prompt, ảnh, MCP, hoặc tiếp tục phiên.

## Danh sách kiểm tra

<Check>`package.json` có `openclaw.extensions` và các điểm vào runtime đã build cho gói phát hành</Check>
<Check>`openclaw.plugin.json` khai báo `cliBackends` và `activation.onStartup` có chủ đích</Check>
<Check>`setup.cliBackends` có mặt khi thiết lập/khám phá mô hình cần thấy backend ở trạng thái lạnh</Check>
<Check>`api.registerCliBackend(...)` dùng cùng id backend với manifest</Check>
<Check>Ghi đè người dùng dưới `agents.defaults.cliBackends.<id>` vẫn thắng</Check>
<Check>Thiết lập phiên, system prompt, ảnh, và bộ phân tích đầu ra khớp với hợp đồng CLI thật</Check>
<Check>Kiểm thử mục tiêu và ít nhất một smoke CLI live chứng minh đường dẫn backend</Check>

## Liên quan

- [Backend CLI](/vi/gateway/cli-backends) - cấu hình người dùng và hành vi runtime
- [Xây dựng Plugin](/vi/plugins/building-plugins) - cơ bản về gói và manifest
- [Tổng quan Plugin SDK](/vi/plugins/sdk-overview) - tham chiếu API đăng ký
- [Manifest Plugin](/vi/plugins/manifest) - `cliBackends` và descriptor thiết lập
- [Agent harness](/vi/plugins/sdk-agent-harness) - runtime agent bên ngoài đầy đủ
