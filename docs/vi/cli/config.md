---
read_when:
    - Bạn muốn đọc hoặc chỉnh sửa cấu hình theo cách không tương tác
sidebarTitle: Config
summary: Tài liệu tham chiếu CLI cho `openclaw config` (get/set/patch/unset/file/schema/validate)
title: Cấu hình
x-i18n:
    generated_at: "2026-06-28T22:33:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 92878977e8fb6670f12c0a77937a7c41f9230da82e20ec7690731bbda1e910ca
    source_path: cli/config.md
    workflow: 16
---

Trình hỗ trợ cấu hình cho các chỉnh sửa không tương tác trong `openclaw.json`: lấy/đặt/vá/bỏ đặt/tệp/lược đồ/xác thực giá trị theo đường dẫn và in tệp cấu hình đang hoạt động. Chạy không có lệnh con để mở trình hướng dẫn cấu hình (giống như `openclaw configure`).

<Note>
Khi `OPENCLAW_NIX_MODE=1`, OpenClaw xem `openclaw.json` là bất biến. Các lệnh chỉ đọc như `config get`, `config file`, `config schema` và `config validate` vẫn hoạt động, nhưng các lệnh ghi cấu hình sẽ từ chối. Thay vào đó, agent nên chỉnh sửa nguồn Nix cho bản cài đặt; với bản phân phối nix-openclaw chính thức, hãy dùng [nix-openclaw Quick Start](https://github.com/openclaw/nix-openclaw#quick-start) và đặt giá trị trong `programs.openclaw.config` hoặc `instances.<name>.config`.
</Note>

## Tùy chọn gốc

<ParamField path="--section <section>" type="string">
  Bộ lọc phần thiết lập có hướng dẫn, có thể lặp lại, khi bạn chạy `openclaw config` không có lệnh con.
</ParamField>

Các phần có hướng dẫn được hỗ trợ: `workspace`, `model`, `web`, `gateway`, `daemon`, `channels`, `plugins`, `skills`, `health`.

## Ví dụ

```bash
openclaw config file
openclaw config --section model
openclaw config --section gateway --section daemon
openclaw config schema
openclaw config get browser.executablePath
openclaw config set browser.executablePath "/usr/bin/google-chrome"
openclaw config set browser.profiles.work.executablePath "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
openclaw config set agents.defaults.heartbeat.every "2h"
openclaw config set 'agents.list[0].tools.exec.node' "node-id-or-name"
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN
openclaw config set secrets.providers.vaultfile --provider-source file --provider-path /etc/openclaw/secrets.json --provider-mode json
openclaw config patch --file ./openclaw.patch.json5 --dry-run
openclaw config unset plugins.entries.brave.config.webSearch.apiKey
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN --dry-run
openclaw config validate
openclaw config validate --json
```

### `config schema`

In lược đồ JSON được tạo cho `openclaw.json` ra stdout dưới dạng JSON.

<AccordionGroup>
  <Accordion title="Nội dung bao gồm">
    - Lược đồ cấu hình gốc hiện tại, cộng thêm một trường chuỗi `$schema` ở gốc cho công cụ biên tập.
    - Siêu dữ liệu tài liệu `title` và `description` của trường được Control UI sử dụng.
    - Các nút đối tượng lồng nhau, ký tự đại diện (`*`) và mục mảng (`[]`) kế thừa cùng siêu dữ liệu `title` / `description` khi có tài liệu trường khớp.
    - Các nhánh `anyOf` / `oneOf` / `allOf` cũng kế thừa cùng siêu dữ liệu tài liệu khi có tài liệu trường khớp.
    - Siêu dữ liệu lược đồ Plugin + kênh trực tiếp theo nỗ lực tốt nhất khi có thể tải manifest runtime.
    - Lược đồ dự phòng sạch ngay cả khi cấu hình hiện tại không hợp lệ.

  </Accordion>
  <Accordion title="RPC runtime liên quan">
    `config.schema.lookup` trả về một đường dẫn cấu hình đã chuẩn hóa với một nút lược đồ nông (`title`, `description`, `type`, `enum`, `const`, các giới hạn phổ biến), siêu dữ liệu gợi ý UI khớp, và tóm tắt các con trực tiếp. Dùng nó để đi sâu theo đường dẫn trong Control UI hoặc client tùy chỉnh.
  </Accordion>
</AccordionGroup>

```bash
openclaw config schema
```

Chuyển nó vào một tệp khi bạn muốn kiểm tra hoặc xác thực bằng công cụ khác:

```bash
openclaw config schema > openclaw.schema.json
```

### Đường dẫn

Đường dẫn dùng ký hiệu dấu chấm hoặc dấu ngoặc. Hãy đặt đường dẫn dạng dấu ngoặc trong dấu nháy ở các ví dụ shell để các shell như zsh không mở rộng `[0]` thành glob trước khi OpenClaw nhận đường dẫn:

```bash
openclaw config get agents.defaults.workspace
openclaw config get 'agents.list[0].id'
```

Dùng chỉ mục danh sách agent để nhắm đến một agent cụ thể:

```bash
openclaw config get agents.list
openclaw config set 'agents.list[1].tools.exec.node' "node-id-or-name"
```

## Giá trị

Giá trị được phân tích cú pháp dưới dạng JSON5 khi có thể; nếu không, chúng được xem là chuỗi. Dùng `--strict-json` để yêu cầu phân tích cú pháp JSON chuẩn mà không có dự phòng chuỗi. `--json` vẫn được hỗ trợ như bí danh kế thừa cho `--strict-json`.

```bash
openclaw config set agents.defaults.heartbeat.every "0m"
openclaw config set gateway.port 19001 --strict-json
openclaw config set channels.whatsapp.groups '["*"]' --strict-json
```

Khi bật `--strict-json`, cú pháp chỉ có trong JSON5 như chú thích, dấu phẩy cuối, hoặc khóa đối tượng không đặt trong dấu nháy sẽ bị từ chối. Bỏ `--strict-json` để phân tích cú pháp giá trị JSON5 với dự phòng chuỗi thô.

`config get <path> --json` in giá trị thô dưới dạng JSON thay vì văn bản được định dạng cho terminal.

<Note>
Theo mặc định, phép gán đối tượng thay thế đường dẫn đích. Các đường dẫn map/list được bảo vệ thường chứa mục do người dùng thêm, như `agents.defaults.models`, `models.providers`, `models.providers.<id>.models`, `plugins.entries` và `auth.profiles`, sẽ từ chối các phép thay thế làm mất mục hiện có trừ khi bạn truyền `--replace`.
</Note>

Dùng `--merge` khi thêm mục vào các map đó:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
openclaw config set models.providers.ollama.models '[{"id":"llama3.2","name":"Llama 3.2"}]' --strict-json --merge
```

Chỉ dùng `--replace` khi bạn cố ý muốn giá trị đã cung cấp trở thành toàn bộ giá trị đích.

## Chế độ `config set`

`openclaw config set` hỗ trợ bốn kiểu gán:

<Tabs>
  <Tab title="Chế độ giá trị">
    ```bash
    openclaw config set <path> <value>
    ```
  </Tab>
  <Tab title="Chế độ trình dựng SecretRef">
    ```bash
    openclaw config set channels.discord.token \
      --ref-provider default \
      --ref-source env \
      --ref-id DISCORD_BOT_TOKEN
    ```
  </Tab>
  <Tab title="Chế độ trình dựng nhà cung cấp">
    Chế độ trình dựng nhà cung cấp chỉ nhắm đến các đường dẫn `secrets.providers.<alias>`:

    ```bash
    openclaw config set secrets.providers.vault \
      --provider-source exec \
      --provider-command /usr/local/bin/openclaw-vault \
      --provider-arg read \
      --provider-arg openai/api-key \
      --provider-timeout-ms 5000
    ```

  </Tab>
  <Tab title="Chế độ hàng loạt">
    ```bash
    openclaw config set --batch-json '[
      {
        "path": "secrets.providers.default",
        "provider": { "source": "env" }
      },
      {
        "path": "channels.discord.token",
        "ref": { "source": "env", "provider": "default", "id": "DISCORD_BOT_TOKEN" }
      }
    ]'
    ```

    ```bash
    openclaw config set --batch-file ./config-set.batch.json --dry-run
    ```

  </Tab>
</Tabs>

<Warning>
Các phép gán SecretRef bị từ chối trên những bề mặt có thể thay đổi ở runtime không được hỗ trợ (ví dụ `hooks.token`, `commands.ownerDisplaySecret`, token Webhook gắn luồng Discord, và JSON thông tin xác thực WhatsApp). Xem [Bề mặt thông tin xác thực SecretRef](/vi/reference/secretref-credential-surface).
</Warning>

Phân tích cú pháp hàng loạt luôn dùng payload hàng loạt (`--batch-json`/`--batch-file`) làm nguồn sự thật. `--strict-json` / `--json` không thay đổi hành vi phân tích cú pháp hàng loạt.

## `config patch`

Dùng `config patch` khi bạn muốn dán hoặc pipe một bản vá có hình dạng cấu hình thay vì chạy nhiều lệnh `config set` dựa trên đường dẫn. Đầu vào là một đối tượng JSON5. Đối tượng được hợp nhất đệ quy, mảng và giá trị vô hướng thay thế giá trị đích, và `null` xóa đường dẫn đích.

```bash
openclaw config patch --file ./openclaw.patch.json5 --dry-run
openclaw config patch --file ./openclaw.patch.json5
```

Bạn cũng có thể pipe một bản vá qua stdin, hữu ích cho script thiết lập từ xa:

```bash
ssh openclaw-host 'openclaw config patch --stdin --dry-run' < ./openclaw.patch.json5
ssh openclaw-host 'openclaw config patch --stdin' < ./openclaw.patch.json5
```

Bản vá ví dụ:

```json5
{
  channels: {
    slack: {
      enabled: true,
      mode: "socket",
      botToken: { source: "env", provider: "default", id: "SLACK_BOT_TOKEN" },
      appToken: { source: "env", provider: "default", id: "SLACK_APP_TOKEN" },
      groupPolicy: "open",
      requireMention: false,
    },
    discord: {
      enabled: true,
      token: { source: "env", provider: "default", id: "DISCORD_BOT_TOKEN" },
      dmPolicy: "disabled",
      dm: { enabled: false },
      groupPolicy: "allowlist",
    },
  },
  agents: {
    defaults: {
      model: { primary: "openai/gpt-5.5" },
      models: {
        "openai/gpt-5.5": { params: { fastMode: true } },
      },
    },
  },
}
```

Dùng `--replace-path <path>` khi một đối tượng hoặc mảng phải trở thành chính xác giá trị đã cung cấp thay vì được vá đệ quy:

```bash
openclaw config patch --file ./discord.patch.json5 --replace-path 'channels.discord.guilds["123"].channels'
```

`--dry-run` chạy kiểm tra lược đồ và khả năng phân giải SecretRef mà không ghi. SecretRef dựa trên exec mặc định được bỏ qua trong dry-run; thêm `--allow-exec` khi bạn cố ý muốn dry-run thực thi lệnh nhà cung cấp.

Chế độ đường dẫn/giá trị JSON vẫn được hỗ trợ cho cả SecretRef và nhà cung cấp:

```bash
openclaw config set channels.discord.token \
  '{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}' \
  --strict-json

openclaw config set secrets.providers.vaultfile \
  '{"source":"file","path":"/etc/openclaw/secrets.json","mode":"json"}' \
  --strict-json
```

## Cờ trình dựng nhà cung cấp

Đích trình dựng nhà cung cấp phải dùng `secrets.providers.<alias>` làm đường dẫn.

<AccordionGroup>
  <Accordion title="Cờ phổ biến">
    - `--provider-source <env|file|exec>`
    - `--provider-timeout-ms <ms>` (`file`, `exec`)

  </Accordion>
  <Accordion title="Nhà cung cấp env (--provider-source env)">
    - `--provider-allowlist <ENV_VAR>` (có thể lặp lại)

  </Accordion>
  <Accordion title="Nhà cung cấp tệp (--provider-source file)">
    - `--provider-path <path>` (bắt buộc)
    - `--provider-mode <singleValue|json>`
    - `--provider-max-bytes <bytes>`
    - `--provider-allow-insecure-path`

  </Accordion>
  <Accordion title="Nhà cung cấp exec (--provider-source exec)">
    - `--provider-command <path>` (bắt buộc)
    - `--provider-arg <arg>` (có thể lặp lại)
    - `--provider-no-output-timeout-ms <ms>`
    - `--provider-max-output-bytes <bytes>`
    - `--provider-json-only`
    - `--provider-env <KEY=VALUE>` (có thể lặp lại)
    - `--provider-pass-env <ENV_VAR>` (có thể lặp lại)
    - `--provider-trusted-dir <path>` (có thể lặp lại)
    - `--provider-allow-insecure-path`
    - `--provider-allow-symlink-command`

  </Accordion>
</AccordionGroup>

Ví dụ nhà cung cấp exec được gia cố:

```bash
openclaw config set secrets.providers.vault \
  --provider-source exec \
  --provider-command /usr/local/bin/openclaw-vault \
  --provider-arg read \
  --provider-arg openai/api-key \
  --provider-json-only \
  --provider-pass-env VAULT_TOKEN \
  --provider-trusted-dir /usr/local/bin \
  --provider-timeout-ms 5000
```

## Dry run

Dùng `--dry-run` để xác thực thay đổi mà không ghi `openclaw.json`.

```bash
openclaw config set channels.discord.token \
  --ref-provider default \
  --ref-source env \
  --ref-id DISCORD_BOT_TOKEN \
  --dry-run

openclaw config set channels.discord.token \
  --ref-provider default \
  --ref-source env \
  --ref-id DISCORD_BOT_TOKEN \
  --dry-run \
  --json

openclaw config set channels.discord.token \
  --ref-provider vault \
  --ref-source exec \
  --ref-id discord/token \
  --dry-run \
  --allow-exec
```

<AccordionGroup>
  <Accordion title="Hành vi chạy thử">
    - Chế độ Builder: chạy kiểm tra khả năng phân giải SecretRef cho các ref/provider đã thay đổi.
    - Chế độ JSON (`--strict-json`, `--json`, hoặc chế độ hàng loạt): chạy xác thực schema cùng với kiểm tra khả năng phân giải SecretRef.
    - Xác thực chính sách cũng chạy cho các bề mặt đích SecretRef đã biết là không được hỗ trợ.
    - Kiểm tra chính sách đánh giá toàn bộ cấu hình sau thay đổi, nên các lần ghi đối tượng cha (ví dụ đặt `hooks` làm một đối tượng) không thể bỏ qua xác thực bề mặt không được hỗ trợ.
    - Kiểm tra SecretRef exec mặc định bị bỏ qua trong khi chạy thử để tránh tác dụng phụ của lệnh.
    - Dùng `--allow-exec` cùng với `--dry-run` để chủ động bật kiểm tra SecretRef exec (việc này có thể thực thi các lệnh provider).
    - `--allow-exec` chỉ dùng cho chạy thử và sẽ báo lỗi nếu dùng khi không có `--dry-run`.

  </Accordion>
  <Accordion title="Các trường --dry-run --json">
    `--dry-run --json` in một báo cáo máy đọc được:

    - `ok`: chạy thử có thành công hay không
    - `operations`: số lượng phép gán đã được đánh giá
    - `checks`: kiểm tra schema/khả năng phân giải có chạy hay không
    - `checks.resolvabilityComplete`: kiểm tra khả năng phân giải có chạy đến khi hoàn tất hay không (false khi các ref exec bị bỏ qua)
    - `refsChecked`: số lượng ref thực sự được phân giải trong khi chạy thử
    - `skippedExecRefs`: số lượng ref exec bị bỏ qua vì chưa đặt `--allow-exec`
    - `errors`: các lỗi có cấu trúc về đường dẫn bị thiếu, schema, hoặc khả năng phân giải khi `ok=false`

  </Accordion>
</AccordionGroup>

### Hình dạng đầu ra JSON

```json5
{
  ok: boolean,
  operations: number,
  configPath: string,
  inputModes: ["value" | "json" | "builder" | "unset", ...],
  checks: {
    schema: boolean,
    resolvability: boolean,
    resolvabilityComplete: boolean,
  },
  refsChecked: number,
  skippedExecRefs: number,
  errors?: [
    {
      kind: "missing-path" | "schema" | "resolvability",
      message: string,
      ref?: string, // present for resolvability errors
    },
  ],
}
```

<Tabs>
  <Tab title="Ví dụ thành công">
    ```json
    {
      "ok": true,
      "operations": 1,
      "configPath": "~/.openclaw/openclaw.json",
      "inputModes": ["builder"],
      "checks": {
        "schema": false,
        "resolvability": true,
        "resolvabilityComplete": true
      },
      "refsChecked": 1,
      "skippedExecRefs": 0
    }
    ```
  </Tab>
  <Tab title="Ví dụ thất bại">
    ```json
    {
      "ok": false,
      "operations": 1,
      "configPath": "~/.openclaw/openclaw.json",
      "inputModes": ["builder"],
      "checks": {
        "schema": false,
        "resolvability": true,
        "resolvabilityComplete": true
      },
      "refsChecked": 1,
      "skippedExecRefs": 0,
      "errors": [
        {
          "kind": "resolvability",
          "message": "Error: Environment variable \"MISSING_TEST_SECRET\" is not set.",
          "ref": "env:default:MISSING_TEST_SECRET"
        }
      ]
    }
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Nếu chạy thử thất bại">
    - `config schema validation failed`: hình dạng cấu hình sau thay đổi của bạn không hợp lệ; sửa đường dẫn/giá trị hoặc hình dạng đối tượng provider/ref.
    - `Config policy validation failed: unsupported SecretRef usage`: chuyển thông tin xác thực đó trở lại dạng nhập plaintext/string và chỉ giữ SecretRef trên các bề mặt được hỗ trợ.
    - `SecretRef assignment(s) could not be resolved`: provider/ref được tham chiếu hiện không thể phân giải (thiếu biến môi trường, con trỏ tệp không hợp lệ, lỗi provider exec, hoặc provider/source không khớp).
    - `Dry run note: skipped <n> exec SecretRef resolvability check(s)`: chạy thử đã bỏ qua các ref exec; chạy lại với `--allow-exec` nếu bạn cần xác thực khả năng phân giải exec.
    - Với chế độ hàng loạt, sửa các mục lỗi rồi chạy lại `--dry-run` trước khi ghi.

  </Accordion>
</AccordionGroup>

## An toàn khi ghi

`openclaw config set` và các trình ghi cấu hình khác thuộc OpenClaw xác thực toàn bộ cấu hình sau thay đổi trước khi ghi cấu hình đó vào đĩa. Nếu payload mới không vượt qua xác thực schema hoặc trông giống một lần ghi đè phá hoại, cấu hình đang hoạt động sẽ được giữ nguyên và payload bị từ chối sẽ được lưu bên cạnh dưới dạng `openclaw.json.rejected.*`.

<Warning>
Đường dẫn cấu hình đang hoạt động phải là một tệp thông thường. Các bố cục `openclaw.json` dùng symlink không được hỗ trợ cho thao tác ghi; thay vào đó, hãy dùng `OPENCLAW_CONFIG_PATH` để trỏ trực tiếp đến tệp thật.
</Warning>

Ưu tiên ghi bằng CLI cho các chỉnh sửa nhỏ:

```bash
openclaw config set gateway.reload.mode hybrid --dry-run
openclaw config set gateway.reload.mode hybrid
openclaw config validate
```

Nếu một lần ghi bị từ chối, hãy kiểm tra payload đã lưu và sửa hình dạng cấu hình đầy đủ:

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".rejected.* 2>/dev/null | head
openclaw config validate
```

Vẫn được phép ghi trực tiếp bằng trình soạn thảo, nhưng Gateway đang chạy sẽ xem chúng là không đáng tin cậy cho đến khi chúng được xác thực. Các chỉnh sửa trực tiếp không hợp lệ sẽ làm khởi động thất bại hoặc bị hot reload bỏ qua; Gateway không ghi lại `openclaw.json`. Chạy `openclaw doctor --fix` để sửa cấu hình bị thêm tiền tố/bị ghi đè hoặc khôi phục bản sao tốt gần nhất. Xem [khắc phục sự cố Gateway](/vi/gateway/troubleshooting#gateway-rejected-invalid-config).

Khôi phục toàn bộ tệp chỉ dành cho sửa chữa bằng doctor. Các thay đổi schema Plugin hoặc độ lệch `minHostVersion` vẫn được báo rõ thay vì khôi phục lùi các thiết lập người dùng không liên quan như cấu hình model, provider, hồ sơ xác thực, kênh, mức lộ Gateway, công cụ, bộ nhớ, trình duyệt, hoặc cron.

## Lệnh con

- `config file`: In đường dẫn tệp cấu hình đang hoạt động (được phân giải từ `OPENCLAW_CONFIG_PATH` hoặc vị trí mặc định). Đường dẫn nên trỏ đến một tệp thông thường, không phải symlink.

Khởi động lại gateway sau khi chỉnh sửa.

## Xác thực

Xác thực cấu hình hiện tại với schema đang hoạt động mà không khởi động gateway.

```bash
openclaw config validate
openclaw config validate --json
```

Sau khi `openclaw config validate` vượt qua, bạn có thể dùng TUI cục bộ để một agent nhúng so sánh cấu hình đang hoạt động với tài liệu trong khi bạn xác thực từng thay đổi từ cùng terminal:

<Note>
Nếu xác thực đã thất bại, hãy bắt đầu với `openclaw configure` hoặc `openclaw doctor --fix`. `openclaw chat` không bỏ qua bộ chặn cấu hình không hợp lệ.
</Note>

```bash
openclaw chat
```

Sau đó bên trong TUI:

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

Vòng lặp sửa chữa điển hình:

<Steps>
  <Step title="So sánh với tài liệu">
    Yêu cầu agent so sánh cấu hình hiện tại của bạn với trang tài liệu liên quan và đề xuất bản sửa nhỏ nhất.
  </Step>
  <Step title="Áp dụng chỉnh sửa có mục tiêu">
    Áp dụng chỉnh sửa có mục tiêu bằng `openclaw config set` hoặc `openclaw configure`.
  </Step>
  <Step title="Xác thực lại">
    Chạy lại `openclaw config validate` sau mỗi thay đổi.
  </Step>
  <Step title="Doctor cho vấn đề runtime">
    Nếu xác thực vượt qua nhưng runtime vẫn không khỏe, hãy chạy `openclaw doctor` hoặc `openclaw doctor --fix` để được trợ giúp di chuyển và sửa chữa.
  </Step>
</Steps>

## Liên quan

- [Tham chiếu CLI](/vi/cli)
- [Cấu hình](/vi/gateway/configuration)
