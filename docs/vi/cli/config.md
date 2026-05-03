---
read_when:
    - Bạn muốn đọc hoặc chỉnh sửa cấu hình theo cách không tương tác
sidebarTitle: Config
summary: Tài liệu tham khảo CLI cho `openclaw config` (get/set/patch/unset/file/schema/validate)
title: Cấu hình
x-i18n:
    generated_at: "2026-05-03T21:27:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7be6a2ff8474fe78deb1d32dd822a4cf8a2b420dfb45306be5d7c5a1d54f0b4d
    source_path: cli/config.md
    workflow: 16
---

Trình trợ giúp cấu hình cho các chỉnh sửa không tương tác trong `openclaw.json`: get/set/patch/unset/file/schema/validate giá trị theo đường dẫn và in tệp cấu hình đang hoạt động. Chạy không kèm lệnh con để mở trình hướng dẫn cấu hình (giống `openclaw configure`).

## Tùy chọn gốc

<ParamField path="--section <section>" type="string">
  Bộ lọc phần thiết lập có hướng dẫn có thể lặp lại khi bạn chạy `openclaw config` không kèm lệnh con.
</ParamField>

Các phần được hỗ trợ trong thiết lập có hướng dẫn: `workspace`, `model`, `web`, `gateway`, `daemon`, `channels`, `plugins`, `skills`, `health`.

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
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
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

In schema JSON được tạo cho `openclaw.json` ra stdout dưới dạng JSON.

<AccordionGroup>
  <Accordion title="What it includes">
    - Schema cấu hình gốc hiện tại, cộng với trường chuỗi `$schema` ở gốc cho công cụ biên tập.
    - Siêu dữ liệu tài liệu `title` và `description` của trường được Control UI sử dụng.
    - Các nút đối tượng lồng nhau, ký tự đại diện (`*`) và mục mảng (`[]`) kế thừa cùng siêu dữ liệu `title` / `description` khi có tài liệu trường khớp.
    - Các nhánh `anyOf` / `oneOf` / `allOf` cũng kế thừa cùng siêu dữ liệu tài liệu khi có tài liệu trường khớp.
    - Siêu dữ liệu schema Plugin + kênh trực tiếp theo khả năng tốt nhất khi có thể tải manifest runtime.
    - Schema dự phòng sạch ngay cả khi cấu hình hiện tại không hợp lệ.

  </Accordion>
  <Accordion title="Related runtime RPC">
    `config.schema.lookup` trả về một đường dẫn cấu hình đã chuẩn hóa với nút schema nông (`title`, `description`, `type`, `enum`, `const`, các giới hạn phổ biến), siêu dữ liệu gợi ý UI khớp, và tóm tắt con trực tiếp. Dùng nó để đi sâu theo phạm vi đường dẫn trong Control UI hoặc các client tùy chỉnh.
  </Accordion>
</AccordionGroup>

```bash
openclaw config schema
```

Pipe nó vào một tệp khi bạn muốn kiểm tra hoặc xác thực nó bằng công cụ khác:

```bash
openclaw config schema > openclaw.schema.json
```

### Đường dẫn

Đường dẫn dùng ký hiệu dấu chấm hoặc ngoặc vuông:

```bash
openclaw config get agents.defaults.workspace
openclaw config get agents.list[0].id
```

Dùng chỉ mục danh sách tác nhân để nhắm tới một tác nhân cụ thể:

```bash
openclaw config get agents.list
openclaw config set agents.list[1].tools.exec.node "node-id-or-name"
```

## Giá trị

Giá trị được phân tích cú pháp dưới dạng JSON5 khi có thể; nếu không, chúng được xử lý như chuỗi. Dùng `--strict-json` để yêu cầu phân tích cú pháp JSON5. `--json` vẫn được hỗ trợ như bí danh cũ.

```bash
openclaw config set agents.defaults.heartbeat.every "0m"
openclaw config set gateway.port 19001 --strict-json
openclaw config set channels.whatsapp.groups '["*"]' --strict-json
```

`config get <path> --json` in giá trị thô dưới dạng JSON thay vì văn bản định dạng cho terminal.

<Note>
Gán đối tượng mặc định sẽ thay thế đường dẫn đích. Các đường dẫn map/list được bảo vệ thường chứa mục do người dùng thêm, chẳng hạn `agents.defaults.models`, `models.providers`, `models.providers.<id>.models`, `plugins.entries`, và `auth.profiles`, sẽ từ chối các thay thế có thể xóa mục hiện có trừ khi bạn truyền `--replace`.
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
  <Tab title="Value mode">
    ```bash
    openclaw config set <path> <value>
    ```
  </Tab>
  <Tab title="SecretRef builder mode">
    ```bash
    openclaw config set channels.discord.token \
      --ref-provider default \
      --ref-source env \
      --ref-id DISCORD_BOT_TOKEN
    ```
  </Tab>
  <Tab title="Provider builder mode">
    Chế độ dựng provider chỉ nhắm tới các đường dẫn `secrets.providers.<alias>`:

    ```bash
    openclaw config set secrets.providers.vault \
      --provider-source exec \
      --provider-command /usr/local/bin/openclaw-vault \
      --provider-arg read \
      --provider-arg openai/api-key \
      --provider-timeout-ms 5000
    ```

  </Tab>
  <Tab title="Batch mode">
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
Các phép gán SecretRef bị từ chối trên các bề mặt có thể thay đổi khi chạy không được hỗ trợ (ví dụ `hooks.token`, `commands.ownerDisplaySecret`, token Webhook gắn kết luồng Discord, và JSON thông tin xác thực WhatsApp). Xem [Bề mặt thông tin xác thực SecretRef](/vi/reference/secretref-credential-surface).
</Warning>

Phân tích cú pháp batch luôn dùng payload batch (`--batch-json`/`--batch-file`) làm nguồn chân lý. `--strict-json` / `--json` không thay đổi hành vi phân tích cú pháp batch.

## `config patch`

Dùng `config patch` khi bạn muốn dán hoặc pipe một bản vá có hình dạng cấu hình thay vì chạy nhiều lệnh `config set` dựa trên đường dẫn. Đầu vào là một đối tượng JSON5. Các đối tượng được hợp nhất đệ quy, mảng và giá trị vô hướng thay thế giá trị đích, và `null` xóa đường dẫn đích.

```bash
openclaw config patch --file ./openclaw.patch.json5 --dry-run
openclaw config patch --file ./openclaw.patch.json5
```

Bạn cũng có thể pipe một bản vá qua stdin, hữu ích cho các script thiết lập từ xa:

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

Dùng `--replace-path <path>` khi một đối tượng hoặc mảng phải trở thành đúng giá trị đã cung cấp thay vì được vá đệ quy:

```bash
openclaw config patch --file ./discord.patch.json5 --replace-path 'channels.discord.guilds["123"].channels'
```

`--dry-run` chạy các kiểm tra schema và khả năng phân giải SecretRef mà không ghi. SecretRef dựa trên exec bị bỏ qua theo mặc định trong dry-run; thêm `--allow-exec` khi bạn cố ý muốn dry-run thực thi lệnh provider.

Chế độ đường dẫn/giá trị JSON vẫn được hỗ trợ cho cả SecretRef và provider:

```bash
openclaw config set channels.discord.token \
  '{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}' \
  --strict-json

openclaw config set secrets.providers.vaultfile \
  '{"source":"file","path":"/etc/openclaw/secrets.json","mode":"json"}' \
  --strict-json
```

## Cờ trình dựng provider

Đích của trình dựng provider phải dùng `secrets.providers.<alias>` làm đường dẫn.

<AccordionGroup>
  <Accordion title="Common flags">
    - `--provider-source <env|file|exec>`
    - `--provider-timeout-ms <ms>` (`file`, `exec`)

  </Accordion>
  <Accordion title="Env provider (--provider-source env)">
    - `--provider-allowlist <ENV_VAR>` (có thể lặp lại)

  </Accordion>
  <Accordion title="File provider (--provider-source file)">
    - `--provider-path <path>` (bắt buộc)
    - `--provider-mode <singleValue|json>`
    - `--provider-max-bytes <bytes>`
    - `--provider-allow-insecure-path`

  </Accordion>
  <Accordion title="Exec provider (--provider-source exec)">
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

Ví dụ provider exec được gia cố:

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
  <Accordion title="Dry-run behavior">
    - Chế độ dựng: chạy kiểm tra khả năng phân giải SecretRef cho các ref/provider đã thay đổi.
    - Chế độ JSON (`--strict-json`, `--json`, hoặc chế độ batch): chạy xác thực schema cộng với kiểm tra khả năng phân giải SecretRef.
    - Xác thực chính sách cũng chạy cho các bề mặt đích SecretRef không được hỗ trợ đã biết.
    - Kiểm tra chính sách đánh giá toàn bộ cấu hình sau thay đổi, nên các lần ghi đối tượng cha (ví dụ đặt `hooks` làm một đối tượng) không thể bỏ qua xác thực bề mặt không được hỗ trợ.
    - Kiểm tra SecretRef exec bị bỏ qua theo mặc định trong dry-run để tránh tác dụng phụ từ lệnh.
    - Dùng `--allow-exec` với `--dry-run` để chọn tham gia kiểm tra SecretRef exec (điều này có thể thực thi lệnh provider).
    - `--allow-exec` chỉ dành cho dry-run và báo lỗi nếu dùng không kèm `--dry-run`.

  </Accordion>
  <Accordion title="--dry-run --json fields">
    `--dry-run --json` in một báo cáo máy có thể đọc:

    - `ok`: dry-run có vượt qua hay không
    - `operations`: số phép gán đã đánh giá
    - `checks`: kiểm tra schema/khả năng phân giải có chạy hay không
    - `checks.resolvabilityComplete`: kiểm tra khả năng phân giải có chạy đến hoàn tất hay không (false khi exec refs bị bỏ qua)
    - `refsChecked`: số ref thực sự được phân giải trong dry-run
    - `skippedExecRefs`: số exec ref bị bỏ qua vì chưa đặt `--allow-exec`
    - `errors`: lỗi schema/khả năng phân giải có cấu trúc khi `ok=false`

  </Accordion>
</AccordionGroup>

### Hình dạng đầu ra JSON

```json5
{
  ok: boolean,
  operations: number,
  configPath: string,
  inputModes: ["value" | "json" | "builder", ...],
  checks: {
    schema: boolean,
    resolvability: boolean,
    resolvabilityComplete: boolean,
  },
  refsChecked: number,
  skippedExecRefs: number,
  errors?: [
    {
      kind: "schema" | "resolvability",
      message: string,
      ref?: string, // có trong lỗi resolvability
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
  <Accordion title="Nếu dry-run thất bại">
    - `config schema validation failed`: hình dạng cấu hình sau thay đổi của bạn không hợp lệ; sửa đường dẫn/giá trị hoặc hình dạng đối tượng provider/ref.
    - `Config policy validation failed: unsupported SecretRef usage`: chuyển thông tin xác thực đó về đầu vào plaintext/string và chỉ giữ SecretRefs trên các bề mặt được hỗ trợ.
    - `SecretRef assignment(s) could not be resolved`: provider/ref được tham chiếu hiện không thể phân giải (thiếu biến môi trường, con trỏ tệp không hợp lệ, lỗi exec provider, hoặc provider/source không khớp).
    - `Dry run note: skipped <n> exec SecretRef resolvability check(s)`: dry-run đã bỏ qua exec refs; chạy lại với `--allow-exec` nếu bạn cần xác thực khả năng phân giải exec.
    - Đối với chế độ batch, sửa các mục thất bại và chạy lại `--dry-run` trước khi ghi.

  </Accordion>
</AccordionGroup>

## An toàn khi ghi

`openclaw config set` và các trình ghi cấu hình khác do OpenClaw sở hữu xác thực toàn bộ cấu hình sau thay đổi trước khi ghi cấu hình đó vào đĩa. Nếu payload mới không vượt qua xác thực schema hoặc trông giống như một thao tác ghi đè phá hủy, cấu hình đang hoạt động sẽ được giữ nguyên và payload bị từ chối được lưu bên cạnh dưới dạng `openclaw.json.rejected.*`.

<Warning>
Đường dẫn cấu hình đang hoạt động phải là một tệp thông thường. Các bố cục `openclaw.json` dùng symlink không được hỗ trợ để ghi; hãy dùng `OPENCLAW_CONFIG_PATH` để trỏ trực tiếp tới tệp thật thay vào đó.
</Warning>

Ưu tiên ghi bằng CLI cho các chỉnh sửa nhỏ:

```bash
openclaw config set gateway.reload.mode hybrid --dry-run
openclaw config set gateway.reload.mode hybrid
openclaw config validate
```

Nếu một thao tác ghi bị từ chối, hãy kiểm tra payload đã lưu và sửa hình dạng cấu hình đầy đủ:

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".rejected.* 2>/dev/null | head
openclaw config validate
```

Ghi trực tiếp bằng trình soạn thảo vẫn được phép, nhưng Gateway đang chạy coi các thay đổi đó là không đáng tin cậy cho đến khi chúng được xác thực. Các chỉnh sửa trực tiếp không hợp lệ sẽ làm khởi động thất bại hoặc bị hot reload bỏ qua; Gateway không ghi lại `openclaw.json`. Chạy `openclaw doctor --fix` để sửa cấu hình bị thêm tiền tố/bị ghi đè hoặc khôi phục bản sao tốt gần nhất đã biết. Xem [khắc phục sự cố Gateway](/vi/gateway/troubleshooting#gateway-rejected-invalid-config).

Khôi phục toàn bộ tệp chỉ dành cho sửa chữa bằng doctor. Thay đổi schema Plugin hoặc độ lệch `minHostVersion` sẽ vẫn được báo rõ thay vì rollback các thiết lập người dùng không liên quan như cấu hình models, providers, auth profiles, channels, gateway exposure, tools, memory, browser hoặc cron.

## Lệnh con

- `config file`: In đường dẫn tệp cấu hình đang hoạt động (được phân giải từ `OPENCLAW_CONFIG_PATH` hoặc vị trí mặc định). Đường dẫn phải chỉ tới một tệp thông thường, không phải symlink.

Khởi động lại gateway sau khi chỉnh sửa.

## Xác thực

Xác thực cấu hình hiện tại theo schema đang hoạt động mà không khởi động gateway.

```bash
openclaw config validate
openclaw config validate --json
```

Sau khi `openclaw config validate` vượt qua, bạn có thể dùng TUI cục bộ để cho một agent nhúng so sánh cấu hình đang hoạt động với tài liệu trong khi bạn xác thực từng thay đổi từ cùng terminal:

<Note>
Nếu xác thực đang thất bại, hãy bắt đầu với `openclaw configure` hoặc `openclaw doctor --fix`. `openclaw chat` không bỏ qua bộ bảo vệ cấu hình không hợp lệ.
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
    Áp dụng các chỉnh sửa có mục tiêu bằng `openclaw config set` hoặc `openclaw configure`.
  </Step>
  <Step title="Xác thực lại">
    Chạy lại `openclaw config validate` sau mỗi thay đổi.
  </Step>
  <Step title="Doctor cho sự cố runtime">
    Nếu xác thực vượt qua nhưng runtime vẫn không khỏe, hãy chạy `openclaw doctor` hoặc `openclaw doctor --fix` để được trợ giúp về migration và sửa chữa.
  </Step>
</Steps>

## Liên quan

- [Tham chiếu CLI](/vi/cli)
- [Cấu hình](/vi/gateway/configuration)
