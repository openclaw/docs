---
read_when:
    - Bạn đang xây dựng một plugin backend CLI AI cục bộ
    - Bạn muốn đăng ký một backend cho các tham chiếu mô hình như acme-cli/model
    - Bạn cần ánh xạ một CLI của bên thứ ba vào trình chạy dự phòng dạng văn bản của OpenClaw
sidebarTitle: CLI backend plugins
summary: Xây dựng một plugin đăng ký backend CLI AI cục bộ
title: Xây dựng các Plugin backend CLI
x-i18n:
    generated_at: "2026-07-12T08:05:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6448cdac02a03e5fdf0d802a54189998d97c08769b1b85c8d9963301fa2c5b79
    source_path: plugins/cli-backend-plugins.md
    workflow: 16
---

Plugin backend CLI cho phép OpenClaw gọi một CLI AI cục bộ làm backend suy luận
văn bản. Backend xuất hiện dưới dạng tiền tố nhà cung cấp trong tham chiếu mô hình:

```text
acme-cli/acme-large
```

Sử dụng backend CLI khi tích hợp thượng nguồn đã được cung cấp dưới dạng lệnh
cục bộ, khi CLI quản lý trạng thái đăng nhập cục bộ hoặc làm phương án dự phòng
khi các nhà cung cấp API không khả dụng.

<Info>
  Nếu dịch vụ thượng nguồn cung cấp API mô hình HTTP thông thường, hãy viết một
  [Plugin nhà cung cấp](/vi/plugins/sdk-provider-plugins) thay thế. Nếu runtime
  thượng nguồn quản lý toàn bộ phiên tác tử, sự kiện công cụ, Compaction hoặc
  trạng thái tác vụ nền, hãy sử dụng một [bộ khung tác tử](/vi/plugins/sdk-agent-harness).
</Info>

## Phạm vi quản lý của Plugin

Một Plugin backend CLI có ba giao ước:

| Giao ước             | Tệp                    | Mục đích                                                   |
| -------------------- | ---------------------- | --------------------------------------------------------- |
| Điểm vào gói         | `package.json`         | Trỏ OpenClaw đến mô-đun runtime của Plugin                |
| Quyền sở hữu manifest | `openclaw.plugin.json` | Khai báo mã định danh backend trước khi runtime tải       |
| Đăng ký runtime      | `index.ts`             | Gọi `api.registerCliBackend(...)` với các giá trị mặc định của lệnh |

Manifest là siêu dữ liệu khám phá: nó không thực thi CLI hoặc đăng ký hành vi
runtime. Hành vi runtime bắt đầu khi điểm vào của Plugin gọi
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

    Các gói đã xuất bản phải phân phối các tệp runtime JavaScript đã được biên dịch.
    Nếu điểm vào mã nguồn của bạn là `./src/index.ts`, hãy thêm
    `openclaw.runtimeExtensions` trỏ đến tệp JavaScript tương ứng đã được biên dịch.
    Xem [Điểm vào](/vi/plugins/sdk-entrypoints).

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

    `cliBackends` là danh sách quyền sở hữu runtime; danh sách này cho phép
    OpenClaw tự động tải Plugin khi cấu hình hoặc lựa chọn mô hình đề cập đến
    `acme-cli/...`.

    `setup.cliBackends` là bề mặt thiết lập ưu tiên bộ mô tả. Hãy thêm trường này
    khi quá trình khám phá mô hình, hướng dẫn thiết lập ban đầu hoặc trạng thái
    cần nhận diện backend mà không tải runtime của Plugin. Chỉ sử dụng
    `requiresRuntime: false` khi các bộ mô tả tĩnh đó đã đủ cho quá trình thiết lập.

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

    Mã định danh backend phải khớp với mục `cliBackends` trong manifest.
    `config` đã đăng ký chỉ là giá trị mặc định; cấu hình người dùng tại
    `agents.defaults.cliBackends.acme-cli` sẽ được hợp nhất và ghi đè lên nó
    trong runtime.

  </Step>
</Steps>

## Cấu trúc cấu hình

`CliBackendConfig` mô tả cách OpenClaw khởi chạy và phân tích cú pháp CLI:

| Trường                                                    | Công dụng                                                                          |
| --------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `command`                                                 | Tên tệp nhị phân hoặc đường dẫn tuyệt đối đến lệnh                                 |
| `args`                                                    | argv cơ sở cho các lần chạy mới                                                    |
| `resumeArgs`                                              | argv thay thế cho các phiên được tiếp tục; hỗ trợ `{sessionId}`                    |
| `output` / `resumeOutput`                                 | Bộ phân tích cú pháp: `json`, `jsonl` hoặc `text`                                  |
| `jsonlDialect`                                            | Phương ngữ sự kiện JSONL: `claude-stream-json` hoặc `gemini-stream-json`           |
| `liveSession`                                             | Chế độ tiến trình CLI tồn tại lâu dài (`claude-stdio`)                             |
| `input`                                                   | Cách truyền lời nhắc: `arg` hoặc `stdin`                                           |
| `maxPromptArgChars`                                       | Độ dài tối đa của lời nhắc ở chế độ `arg` trước khi chuyển sang stdin              |
| `env` / `clearEnv`                                        | Các biến môi trường bổ sung cần chèn hoặc tên cần loại bỏ trước khi khởi chạy      |
| `modelArg`                                                | Cờ được dùng trước mã định danh mô hình                                            |
| `modelAliases`                                            | Ánh xạ mã định danh mô hình OpenClaw sang mã định danh gốc của CLI                 |
| `sessionArg` / `sessionArgs`                              | Cách truyền mã định danh phiên                                                     |
| `sessionMode`                                             | `always`, `existing` hoặc `none`                                                   |
| `sessionIdFields`                                         | Các trường JSON mà OpenClaw đọc từ đầu ra CLI                                      |
| `systemPromptArg` / `systemPromptFileArg`                 | Cách truyền lời nhắc hệ thống                                                      |
| `systemPromptFileConfigArg` / `systemPromptFileConfigKey` | Cách truyền ghi đè cấu hình cho tệp lời nhắc hệ thống (ví dụ `-c`)                 |
| `systemPromptMode`                                        | `append` hoặc `replace`                                                            |
| `systemPromptWhen`                                        | `first`, `always` hoặc `never`                                                     |
| `imageArg` / `imageMode`                                  | Cờ đường dẫn hình ảnh và cách truyền nhiều hình ảnh (`repeat` hoặc `list`)         |
| `imagePathScope`                                          | Nơi lưu các tệp hình ảnh trung gian trước khi bàn giao: `temp` hoặc `workspace`    |
| `serialize`                                               | Duy trì thứ tự các lần chạy trên cùng backend                                      |
| `reseedFromRawTranscriptWhenUncompacted`                  | Chủ động tái khởi tạo có giới hạn từ bản chép lời thô trước Compaction để đặt lại phiên an toàn |
| `reliability.outputLimits`                                | Số ký tự/dòng JSONL thô tối đa được giữ lại cho một lượt CLI trực tiếp (backend phiên trực tiếp) |
| `reliability.watchdog`                                    | Điều chỉnh thời gian chờ khi không có đầu ra, tách biệt giữa lần chạy mới và lần chạy tiếp tục |

Ưu tiên cấu hình tĩnh nhỏ nhất phù hợp với CLI. Chỉ thêm callback của Plugin
cho hành vi thực sự thuộc về backend.

## Hook backend nâng cao

`CliBackendPlugin` cũng có thể định nghĩa:

| Hook                               | Công dụng                                                                    |
| ---------------------------------- | --------------------------------------------------------------------------- |
| `normalizeConfig(config, context)` | Viết lại cấu hình người dùng cũ sau khi hợp nhất                             |
| `resolveExecutionArgs(ctx)`        | Thêm các cờ theo phạm vi yêu cầu, chẳng hạn như mức độ suy luận hoặc cô lập câu hỏi phụ |
| `prepareExecution(ctx)`            | Tạo cầu nối xác thực hoặc cấu hình tạm thời trước khi khởi chạy              |
| `transformSystemPrompt(ctx)`       | Áp dụng phép biến đổi cuối cùng dành riêng cho CLI lên lời nhắc hệ thống     |
| `textTransforms`                   | Các phép thay thế hai chiều cho lời nhắc/đầu ra                              |
| `defaultAuthProfileId`             | Ưu tiên một hồ sơ xác thực OpenClaw cụ thể                                   |
| `authEpochMode`                    | Quyết định cách thay đổi xác thực làm mất hiệu lực các phiên CLI đã lưu      |
| `nativeToolMode`                   | Khai báo công cụ gốc không tồn tại, luôn bật hay có thể được máy chủ chọn    |
| `sideQuestionToolMode`             | Khai báo các công cụ gốc bị vô hiệu hóa cho câu hỏi phụ `/btw`              |
| `bundleMcp` / `bundleMcpMode`      | Chủ động sử dụng cầu nối công cụ MCP local loopback của OpenClaw             |
| `ownsNativeCompaction`             | Backend tự quản lý Compaction của mình — OpenClaw sẽ trì hoãn                |
| `runtimeArtifact`                  | Ràng buộc trình khởi chạy tập lệnh với toàn bộ cây gói đi kèm của nó         |

Giữ các hook này thuộc quyền quản lý của nhà cung cấp. Không thêm các nhánh
dành riêng cho CLI vào lõi khi một hook backend có thể biểu đạt hành vi đó.

`runtimeArtifact` thuộc quyền quản lý của Plugin và người dùng không thể ghi đè.
Nó chỉ được tham chiếu khi một lượt suy luận trực tiếp cấp mới hoặc xác thực lại
quyền thiết lập đã được xác minh; các lần chạy CLI thông thường không yêu cầu nó.
Một backend không có khai báo này không thể cấp quyền thiết lập CLI đã được xác minh.
Khai báo `bundled-package-tree` chỉ định chính xác chủ sở hữu `package.json` và
yêu cầu điểm vào của gói phải là lệnh. OpenClaw băm toàn bộ cây gói đã cài đặt
được giới hạn, bao gồm cả các phần phụ thuộc lồng nhau, và từ chối an toàn đối với
các liên kết tượng trưng chuyển hướng, trình khởi chạy nằm ngoài gói đã khai báo,
các khai báo phần phụ thuộc bên ngoài bắt buộc, cây quá lớn và tập lệnh không xác định.
Chỉ khai báo mục này khi cây đó chứa toàn bộ phần triển khai suy luận; các tích hợp
công cụ tùy chọn không khiến một đồ thị triển khai bên ngoài trở nên an toàn.

Nếu cùng một backend cũng cung cấp tệp thực thi gốc độc lập, hãy liệt kê các tên
cơ sở chuẩn của tệp đó trong `nativeExecutableNames`. Các lệnh gốc khác vẫn chưa
được xác minh ngay cả khi người dùng ghi đè lệnh backend.

`ctx.executionMode` là `"agent"` cho các lượt thông thường và `"side-question"` cho
các lệnh gọi `/btw` tạm thời. Hãy dùng thuộc tính này khi CLI cần các cờ chạy một lần khác nhau,
chẳng hạn như tắt công cụ gốc, khả năng duy trì phiên hoặc hành vi tiếp tục cho
BTW. Nếu một phần phụ trợ thường có `nativeToolMode: "always-on"` nhưng argv
cho câu hỏi phụ của nó tắt các công cụ đó một cách đáng tin cậy, hãy đặt thêm
`sideQuestionToolMode: "disabled"`; nếu không, OpenClaw sẽ từ chối an toàn khi BTW
yêu cầu chạy CLI không có công cụ.

Chỉ đặt `nativeToolMode: "selectable"` khi `resolveExecutionArgs` có thể tắt
mọi công cụ gốc của phần phụ trợ cho từng lần chạy riêng lẻ. Đối với các lần chạy bị hạn chế đó,
`ctx.toolAvailability.native` là một tuple rỗng và
`ctx.toolAvailability.mcp` là danh sách cho phép MCP chính xác được cô lập bởi máy chủ. Hook
phải thay thế các cờ công cụ xung đột và trả về argv thực thi cả hai giá trị;
OpenClaw gọi hook này một lần với argv mới hoặc tiếp tục cuối cùng và từ chối an toàn khi
phần phụ trợ không thể thực thi hạn chế. Tên MCP trong ngữ cảnh này chỉ an toàn
để tự động phê duyệt vì máy chủ đã giới hạn cấu hình MCP được tạo
ở các máy chủ và công cụ đó.

### `ownsNativeCompaction`: không sử dụng Compaction của OpenClaw

Nếu phần phụ trợ của bạn chạy một tác tử tự Compaction bản chép lời **của chính nó**, hãy đặt
`ownsNativeCompaction: true` để trình tóm tắt bảo vệ của OpenClaw không bao giờ chạy
trên các phiên của nó - vòng đời Compaction của CLI không thực hiện thao tác nào và
lượt tiếp tục. `claude-cli` khai báo thuộc tính này vì Claude Code thực hiện Compaction
nội bộ mà không có điểm cuối của bộ điều phối. Thay vào đó, các phiên bộ điều phối gốc như Codex
tiếp tục được định tuyến đến điểm cuối Compaction của bộ điều phối tương ứng.

**Chỉ khai báo thuộc tính này khi đáp ứng tất cả các điều kiện sau**, nếu không, một phiên
vượt ngân sách bị trì hoãn có thể tiếp tục vượt ngân sách hoặc trở nên lỗi thời (OpenClaw không còn
giải cứu phiên đó):

- phần phụ trợ thực hiện Compaction hoặc giới hạn bản chép lời của chính nó một cách đáng tin cậy khi gần đạt
  cửa sổ;
- phần phụ trợ lưu giữ một phiên có thể tiếp tục để trạng thái đã Compaction tồn tại qua các lượt
  (ví dụ: `--resume` / `--session-id`);
- đó không phải là phiên Compaction của bộ điều phối gốc - các phiên khớp với `agentHarnessId`
  được định tuyến đến điểm cuối của bộ điều phối thay thế.

## Cầu nối công cụ MCP

Các phần phụ trợ CLI không nhận công cụ OpenClaw theo mặc định. Nếu CLI có thể sử dụng
cấu hình MCP, hãy chủ động bật:

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

| Chế độ                   | Trường hợp sử dụng                                                 |
| ------------------------ | ------------------------------------------------------------------ |
| `claude-config-file`     | Các CLI chấp nhận tệp cấu hình MCP                                 |
| `codex-config-overrides` | Các CLI chấp nhận ghi đè cấu hình trên argv                        |
| `gemini-system-settings` | Các CLI đọc cài đặt MCP từ thư mục cài đặt hệ thống của chúng      |

Chỉ bật cầu nối khi CLI thực sự có thể sử dụng nó. Nếu CLI có
lớp công cụ tích hợp riêng không thể tắt, hãy đặt `nativeToolMode:
"always-on"` để OpenClaw có thể từ chối an toàn khi bên gọi yêu cầu không có công cụ
gốc. Nếu CLI có thể tắt mọi công cụ gốc theo từng lần chạy, hãy dùng `"selectable"` với
hợp đồng `resolveExecutionArgs` ở trên.

## Cấu hình người dùng

Người dùng có thể ghi đè mọi giá trị mặc định của phần phụ trợ:

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

Ghi lại cấu hình ghi đè tối thiểu mà người dùng có thể cần - thường chỉ là
`command` khi tệp nhị phân nằm ngoài `PATH`.

## Xác minh

Đối với các Plugin đi kèm, hãy thêm một bài kiểm thử tập trung cho trình dựng và quá trình đăng ký
thiết lập, sau đó chạy nhóm kiểm thử mục tiêu của Plugin:

```bash
pnpm test extensions/acme-cli
```

Đối với các Plugin cục bộ hoặc đã cài đặt, hãy xác minh khả năng khám phá và một lần chạy mô hình thực tế:

```bash
openclaw plugins inspect acme-cli --runtime --json
openclaw agent --message "reply exactly: backend ok" --model acme-cli/acme-large
```

Nếu phần phụ trợ hỗ trợ hình ảnh hoặc MCP, hãy thêm một phép kiểm tra nhanh trực tiếp để chứng minh các
đường dẫn đó bằng CLI thực tế. Không dựa vào việc kiểm tra tĩnh đối với hành vi của lời nhắc, hình ảnh,
MCP hoặc tiếp tục phiên.

## Danh sách kiểm tra

<Check>`package.json` có `openclaw.extensions` và các mục nhập thời gian chạy đã dựng cho các gói được phát hành</Check>
<Check>`openclaw.plugin.json` khai báo `cliBackends` và `activation.onStartup` có chủ đích</Check>
<Check>`setup.cliBackends` hiện diện khi quá trình thiết lập/khám phá mô hình cần thấy phần phụ trợ ở trạng thái chưa khởi động</Check>
<Check>`api.registerCliBackend(...)` sử dụng cùng mã định danh phần phụ trợ như bản kê khai</Check>
<Check>Các ghi đè của người dùng trong `agents.defaults.cliBackends.<id>` vẫn được ưu tiên</Check>
<Check>Các cài đặt phiên, lời nhắc hệ thống, hình ảnh và trình phân tích cú pháp đầu ra khớp với hợp đồng CLI thực tế</Check>
<Check>Các bài kiểm thử mục tiêu và ít nhất một phép kiểm tra nhanh CLI trực tiếp chứng minh đường dẫn phần phụ trợ</Check>

## Liên quan

- [Các phần phụ trợ CLI](/vi/gateway/cli-backends) - cấu hình người dùng và hành vi thời gian chạy
- [Xây dựng Plugin](/vi/plugins/building-plugins) - kiến thức cơ bản về gói và bản kê khai
- [Tổng quan SDK Plugin](/vi/plugins/sdk-overview) - tài liệu tham chiếu API đăng ký
- [Bản kê khai Plugin](/vi/plugins/manifest) - `cliBackends` và các bộ mô tả thiết lập
- [Bộ điều phối tác tử](/vi/plugins/sdk-agent-harness) - các môi trường chạy tác tử bên ngoài đầy đủ
