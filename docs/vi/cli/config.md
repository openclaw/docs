---
read_when:
    - Bạn muốn đọc hoặc chỉnh sửa cấu hình mà không cần tương tác
sidebarTitle: Config
summary: Tài liệu tham khảo CLI cho `openclaw config` (get/set/patch/unset/file/schema/validate)
title: Cấu hình
x-i18n:
    generated_at: "2026-05-06T17:52:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: e4e0d580347e162278277ddb33eed0e42105c5e85bac4325c07fa2cd700b831d
    source_path: cli/config.md
    workflow: 16
---

Trình trợ giúp cấu hình cho các chỉnh sửa không tương tác trong `openclaw.json`: get/set/patch/unset/file/schema/validate các giá trị theo đường dẫn và in tệp cấu hình đang hoạt động. Chạy không có lệnh con để mở trình hướng dẫn cấu hình (giống như `openclaw configure`).

<Note>
Khi `OPENCLAW_NIX_MODE=1`, OpenClaw xem `openclaw.json` là bất biến. Các lệnh chỉ đọc như `config get`, `config file`, `config schema`, và `config validate` vẫn hoạt động, nhưng các lệnh ghi cấu hình sẽ từ chối. Thay vào đó, agent nên chỉnh sửa nguồn Nix cho bản cài đặt; với bản phân phối nix-openclaw chính thức, hãy dùng [Khởi động nhanh nix-openclaw](https://github.com/openclaw/nix-openclaw#quick-start) và đặt giá trị trong `programs.openclaw.config` hoặc `instances.<name>.config`.
</Note>

## Tùy chọn gốc

<ParamField path="--section <section>" type="string">
  Bộ lọc phần thiết lập có hướng dẫn có thể lặp lại khi bạn chạy `openclaw config` mà không có lệnh con.
</ParamField>

Các phần hướng dẫn được hỗ trợ: `workspace`, `model`, `web`, `gateway`, `daemon`, `channels`, `plugins`, `skills`, `health`.

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

In schema JSON đã tạo cho `openclaw.json` ra stdout dưới dạng JSON.

<AccordionGroup>
  <Accordion title="Nội dung bao gồm">
    - Schema cấu hình gốc hiện tại, cùng với trường chuỗi `$schema` ở gốc cho công cụ biên tập.
    - Siêu dữ liệu tài liệu `title` và `description` của trường được Control UI sử dụng.
    - Các nút đối tượng lồng nhau, ký tự đại diện (`*`), và mục mảng (`[]`) kế thừa cùng siêu dữ liệu `title` / `description` khi có tài liệu trường khớp.
    - Các nhánh `anyOf` / `oneOf` / `allOf` cũng kế thừa cùng siêu dữ liệu tài liệu khi có tài liệu trường khớp.
    - Siêu dữ liệu schema Plugin + kênh trực tiếp theo nỗ lực tốt nhất khi có thể tải manifest runtime.
    - Schema dự phòng sạch ngay cả khi cấu hình hiện tại không hợp lệ.

  </Accordion>
  <Accordion title="RPC runtime liên quan">
    `config.schema.lookup` trả về một đường dẫn cấu hình đã chuẩn hóa với nút schema nông (`title`, `description`, `type`, `enum`, `const`, các giới hạn phổ biến), siêu dữ liệu gợi ý UI khớp, và tóm tắt các con trực tiếp. Dùng nó để đi sâu theo phạm vi đường dẫn trong Control UI hoặc client tùy chỉnh.
  </Accordion>
</AccordionGroup>

```bash
openclaw config schema
```

Chuyển nó vào tệp khi bạn muốn kiểm tra hoặc xác thực bằng công cụ khác:

```bash
openclaw config schema > openclaw.schema.json
```

### Đường dẫn

Đường dẫn dùng ký hiệu dấu chấm hoặc ngoặc vuông:

```bash
openclaw config get agents.defaults.workspace
openclaw config get agents.list[0].id
```

Dùng chỉ mục danh sách agent để nhắm tới một agent cụ thể:

```bash
openclaw config get agents.list
openclaw config set agents.list[1].tools.exec.node "node-id-or-name"
```

## Giá trị

Giá trị được phân tích dưới dạng JSON5 khi có thể; nếu không, chúng được xử lý như chuỗi. Dùng `--strict-json` để yêu cầu phân tích JSON5. `--json` vẫn được hỗ trợ như bí danh cũ.

```bash
openclaw config set agents.defaults.heartbeat.every "0m"
openclaw config set gateway.port 19001 --strict-json
openclaw config set channels.whatsapp.groups '["*"]' --strict-json
```

`config get <path> --json` in giá trị thô dưới dạng JSON thay vì văn bản được định dạng cho terminal.

<Note>
Gán đối tượng mặc định sẽ thay thế đường dẫn đích. Các đường dẫn map/list được bảo vệ thường chứa mục do người dùng thêm, như `agents.defaults.models`, `models.providers`, `models.providers.<id>.models`, `plugins.entries`, và `auth.profiles`, sẽ từ chối các thay thế làm xóa mục hiện có trừ khi bạn truyền `--replace`.
</Note>

Dùng `--merge` khi thêm mục vào các map đó:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
openclaw config set models.providers.ollama.models '[{"id":"llama3.2","name":"Llama 3.2"}]' --strict-json --merge
```

Chỉ dùng `--replace` khi bạn chủ ý muốn giá trị đã cung cấp trở thành giá trị đích hoàn chỉnh.

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
    Chế độ trình dựng nhà cung cấp chỉ nhắm tới các đường dẫn `secrets.providers.<alias>`:

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
Các gán SecretRef bị từ chối trên những bề mặt có thể thay đổi trong runtime không được hỗ trợ (ví dụ `hooks.token`, `commands.ownerDisplaySecret`, token webhook ràng buộc luồng Discord, và JSON thông tin đăng nhập WhatsApp). Xem [Bề mặt thông tin đăng nhập SecretRef](/vi/reference/secretref-credential-surface).
</Warning>

Phân tích hàng loạt luôn dùng payload hàng loạt (`--batch-json`/`--batch-file`) làm nguồn sự thật. `--strict-json` / `--json` không thay đổi hành vi phân tích hàng loạt.

## `config patch`

Dùng `config patch` khi bạn muốn dán hoặc pipe một bản vá có dạng cấu hình thay vì chạy nhiều lệnh `config set` dựa trên đường dẫn. Đầu vào là một đối tượng JSON5. Các đối tượng được hợp nhất đệ quy, mảng và giá trị vô hướng thay thế giá trị đích, và `null` xóa đường dẫn đích.

```bash
openclaw config patch --file ./openclaw.patch.json5 --dry-run
openclaw config patch --file ./openclaw.patch.json5
```

Bạn cũng có thể pipe một bản vá qua stdin, hữu ích cho script thiết lập từ xa:

```bash
ssh openclaw-host 'openclaw config patch --stdin --dry-run' < ./openclaw.patch.json5
ssh openclaw-host 'openclaw config patch --stdin' < ./openclaw.patch.json5
```

Ví dụ bản vá:

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

Dùng `--replace-path <path>` khi một đối tượng hoặc mảng phải trở thành đúng chính xác giá trị đã cung cấp thay vì được vá đệ quy:

```bash
openclaw config patch --file ./discord.patch.json5 --replace-path 'channels.discord.guilds["123"].channels'
```

`--dry-run` chạy các kiểm tra schema và khả năng phân giải SecretRef mà không ghi. SecretRef dựa trên exec mặc định được bỏ qua trong dry-run; thêm `--allow-exec` khi bạn chủ ý muốn dry-run thực thi lệnh nhà cung cấp.

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

Mục tiêu trình dựng nhà cung cấp phải dùng `secrets.providers.<alias>` làm đường dẫn.

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
  <Accordion title="Hành vi dry-run">
    - Chế độ trình dựng: chạy kiểm tra khả năng phân giải SecretRef cho các ref/nhà cung cấp đã thay đổi.
    - Chế độ JSON (`--strict-json`, `--json`, hoặc chế độ hàng loạt): chạy xác thực schema cùng với kiểm tra khả năng phân giải SecretRef.
    - Xác thực chính sách cũng chạy cho các bề mặt mục tiêu SecretRef không được hỗ trợ đã biết.
    - Kiểm tra chính sách đánh giá toàn bộ cấu hình sau thay đổi, nên các lần ghi đối tượng cha (ví dụ đặt `hooks` làm một đối tượng) không thể vượt qua xác thực bề mặt không được hỗ trợ.
    - Kiểm tra SecretRef exec mặc định được bỏ qua trong dry-run để tránh tác dụng phụ của lệnh.
    - Dùng `--allow-exec` với `--dry-run` để chọn tham gia kiểm tra SecretRef exec (việc này có thể thực thi lệnh nhà cung cấp).
    - `--allow-exec` chỉ dành cho dry-run và báo lỗi nếu được dùng mà không có `--dry-run`.

  </Accordion>
  <Accordion title="Các trường --dry-run --json">
    `--dry-run --json` in một báo cáo máy đọc được:

    - `ok`: liệu dry-run đã thành công hay chưa
    - `operations`: số lượng phép gán đã được đánh giá
    - `checks`: liệu các kiểm tra schema/khả năng phân giải đã chạy hay chưa
    - `checks.resolvabilityComplete`: liệu các kiểm tra khả năng phân giải đã chạy đến khi hoàn tất hay chưa (false khi exec refs bị bỏ qua)
    - `refsChecked`: số lượng refs thực sự được phân giải trong dry-run
    - `skippedExecRefs`: số lượng exec refs bị bỏ qua vì `--allow-exec` chưa được đặt
    - `errors`: các lỗi schema/khả năng phân giải có cấu trúc khi `ok=false`

  </Accordion>
</AccordionGroup>

### Dạng đầu ra JSON

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
  <Accordion title="Nếu dry-run thất bại">
    - `config schema validation failed`: hình dạng config sau thay đổi của bạn không hợp lệ; sửa path/value hoặc hình dạng đối tượng provider/ref.
    - `Config policy validation failed: unsupported SecretRef usage`: chuyển credential đó về đầu vào plaintext/string và chỉ giữ SecretRefs trên các bề mặt được hỗ trợ.
    - `SecretRef assignment(s) could not be resolved`: provider/ref được tham chiếu hiện không thể phân giải (thiếu env var, con trỏ file không hợp lệ, lỗi exec provider, hoặc provider/source không khớp).
    - `Dry run note: skipped <n> exec SecretRef resolvability check(s)`: dry-run đã bỏ qua exec refs; chạy lại với `--allow-exec` nếu bạn cần xác thực khả năng phân giải exec.
    - Với chế độ batch, hãy sửa các mục lỗi và chạy lại `--dry-run` trước khi ghi.

  </Accordion>
</AccordionGroup>

## An toàn ghi

`openclaw config set` và các trình ghi config khác do OpenClaw sở hữu sẽ xác thực toàn bộ config sau thay đổi trước khi commit config đó vào đĩa. Nếu payload mới không vượt qua xác thực schema hoặc trông giống một thao tác ghi đè phá hủy, config đang hoạt động sẽ được giữ nguyên và payload bị từ chối được lưu bên cạnh dưới dạng `openclaw.json.rejected.*`.

<Warning>
Đường dẫn config đang hoạt động phải là một file thông thường. Các bố cục `openclaw.json` dạng symlink không được hỗ trợ cho thao tác ghi; thay vào đó, hãy dùng `OPENCLAW_CONFIG_PATH` để trỏ trực tiếp tới file thật.
</Warning>

Ưu tiên ghi bằng CLI cho các chỉnh sửa nhỏ:

```bash
openclaw config set gateway.reload.mode hybrid --dry-run
openclaw config set gateway.reload.mode hybrid
openclaw config validate
```

Nếu một thao tác ghi bị từ chối, hãy kiểm tra payload đã lưu và sửa toàn bộ hình dạng config:

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".rejected.* 2>/dev/null | head
openclaw config validate
```

Ghi trực tiếp bằng trình soạn thảo vẫn được cho phép, nhưng Gateway đang chạy sẽ xem chúng là không đáng tin cậy cho đến khi chúng được xác thực. Các chỉnh sửa trực tiếp không hợp lệ sẽ làm khởi động thất bại hoặc bị hot reload bỏ qua; Gateway không ghi lại `openclaw.json`. Chạy `openclaw doctor --fix` để sửa config bị thêm tiền tố/bị ghi đè hoặc khôi phục bản sao tốt gần nhất. Xem [Khắc phục sự cố Gateway](/vi/gateway/troubleshooting#gateway-rejected-invalid-config).

Khôi phục toàn bộ file được dành riêng cho sửa chữa bằng doctor. Các thay đổi schema Plugin hoặc lệch `minHostVersion` sẽ được báo lỗi rõ ràng thay vì rollback các thiết lập người dùng không liên quan như models, providers, auth profiles, channels, gateway exposure, tools, memory, browser, hoặc cron config.

## Lệnh con

- `config file`: In đường dẫn file config đang hoạt động (được phân giải từ `OPENCLAW_CONFIG_PATH` hoặc vị trí mặc định). Đường dẫn nên là một file thông thường, không phải symlink.

Khởi động lại gateway sau khi chỉnh sửa.

## Xác thực

Xác thực config hiện tại theo schema đang hoạt động mà không khởi động gateway.

```bash
openclaw config validate
openclaw config validate --json
```

Sau khi `openclaw config validate` chạy thành công, bạn có thể dùng TUI cục bộ để một agent nhúng so sánh config đang hoạt động với tài liệu trong khi bạn xác thực từng thay đổi từ cùng terminal:

<Note>
Nếu xác thực đã thất bại, hãy bắt đầu với `openclaw configure` hoặc `openclaw doctor --fix`. `openclaw chat` không bỏ qua cơ chế bảo vệ config không hợp lệ.
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
    Yêu cầu agent so sánh config hiện tại của bạn với trang tài liệu liên quan và đề xuất bản sửa nhỏ nhất.
  </Step>
  <Step title="Áp dụng chỉnh sửa có mục tiêu">
    Áp dụng chỉnh sửa có mục tiêu bằng `openclaw config set` hoặc `openclaw configure`.
  </Step>
  <Step title="Xác thực lại">
    Chạy lại `openclaw config validate` sau mỗi thay đổi.
  </Step>
  <Step title="Doctor cho các vấn đề runtime">
    Nếu xác thực thành công nhưng runtime vẫn không khỏe mạnh, hãy chạy `openclaw doctor` hoặc `openclaw doctor --fix` để được hỗ trợ migration và sửa chữa.
  </Step>
</Steps>

## Liên quan

- [Tham chiếu CLI](/vi/cli)
- [Cấu hình](/vi/gateway/configuration)
