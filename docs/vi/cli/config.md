---
read_when:
    - Bạn muốn đọc hoặc chỉnh sửa cấu hình không tương tác
sidebarTitle: Config
summary: Tham chiếu CLI cho `openclaw config` (get/set/patch/unset/file/schema/validate)
title: Cấu hình
x-i18n:
    generated_at: "2026-06-27T17:17:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d658c0edbf900565c4645c1d24a9f3e092a3d8a4fec85f7fc7e3989550d13197
    source_path: cli/config.md
    workflow: 16
---

Trình trợ giúp cấu hình cho các chỉnh sửa không tương tác trong `openclaw.json`: get/set/patch/unset/file/schema/validate giá trị theo đường dẫn và in tệp cấu hình đang hoạt động. Chạy không có lệnh con để mở trình hướng dẫn cấu hình (giống như `openclaw configure`).

<Note>
Khi `OPENCLAW_NIX_MODE=1`, OpenClaw xem `openclaw.json` là bất biến. Các lệnh chỉ đọc như `config get`, `config file`, `config schema` và `config validate` vẫn hoạt động, nhưng các lệnh ghi cấu hình sẽ từ chối. Thay vào đó, agent nên chỉnh sửa nguồn Nix cho bản cài đặt; với bản phân phối nix-openclaw chính thức, hãy dùng [nix-openclaw Quick Start](https://github.com/openclaw/nix-openclaw#quick-start) và đặt giá trị trong `programs.openclaw.config` hoặc `instances.<name>.config`.
</Note>

## Tùy chọn gốc

<ParamField path="--section <section>" type="string">
  Bộ lọc phần thiết lập có hướng dẫn có thể lặp lại khi bạn chạy `openclaw config` mà không có lệnh con.
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

In JSON schema đã tạo cho `openclaw.json` ra stdout dưới dạng JSON.

<AccordionGroup>
  <Accordion title="Nội dung bao gồm">
    - Schema cấu hình gốc hiện tại, cộng với trường chuỗi `$schema` ở gốc cho công cụ biên tập.
    - Siêu dữ liệu tài liệu `title` và `description` của trường được Control UI sử dụng.
    - Các nút đối tượng lồng nhau, ký tự đại diện (`*`) và mục mảng (`[]`) kế thừa cùng siêu dữ liệu `title` / `description` khi có tài liệu trường khớp.
    - Các nhánh `anyOf` / `oneOf` / `allOf` cũng kế thừa cùng siêu dữ liệu tài liệu khi có tài liệu trường khớp.
    - Siêu dữ liệu schema Plugin + kênh trực tiếp theo khả năng tốt nhất khi có thể tải runtime manifest.
    - Schema dự phòng sạch ngay cả khi cấu hình hiện tại không hợp lệ.

  </Accordion>
  <Accordion title="RPC runtime liên quan">
    `config.schema.lookup` trả về một đường dẫn cấu hình đã chuẩn hóa với một nút schema nông (`title`, `description`, `type`, `enum`, `const`, các giới hạn thường dùng), siêu dữ liệu gợi ý UI khớp, và tóm tắt con trực tiếp. Dùng nó để đi sâu theo phạm vi đường dẫn trong Control UI hoặc client tùy chỉnh.
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

Đường dẫn dùng ký hiệu dấu chấm hoặc ngoặc vuông. Đặt các đường dẫn dùng ký hiệu ngoặc vuông trong dấu nháy ở ví dụ shell để các shell như zsh không mở rộng `[0]` thành glob trước khi OpenClaw nhận đường dẫn:

```bash
openclaw config get agents.defaults.workspace
openclaw config get 'agents.list[0].id'
```

Dùng chỉ mục danh sách agent để nhắm tới một agent cụ thể:

```bash
openclaw config get agents.list
openclaw config set 'agents.list[1].tools.exec.node' "node-id-or-name"
```

## Giá trị

Giá trị được phân tích cú pháp như JSON5 khi có thể; nếu không, chúng được xem là chuỗi. Dùng `--strict-json` để yêu cầu phân tích cú pháp JSON5. `--json` vẫn được hỗ trợ như bí danh cũ.

```bash
openclaw config set agents.defaults.heartbeat.every "0m"
openclaw config set gateway.port 19001 --strict-json
openclaw config set channels.whatsapp.groups '["*"]' --strict-json
```

`config get <path> --json` in giá trị thô dưới dạng JSON thay vì văn bản được định dạng cho terminal.

<Note>
Gán đối tượng mặc định sẽ thay thế đường dẫn đích. Các đường dẫn map/list được bảo vệ thường chứa mục do người dùng thêm, chẳng hạn như `agents.defaults.models`, `models.providers`, `models.providers.<id>.models`, `plugins.entries`, và `auth.profiles`, sẽ từ chối các thay thế làm xóa mục hiện có trừ khi bạn truyền `--replace`.
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
  <Tab title="Chế độ trình tạo SecretRef">
    ```bash
    openclaw config set channels.discord.token \
      --ref-provider default \
      --ref-source env \
      --ref-id DISCORD_BOT_TOKEN
    ```
  </Tab>
  <Tab title="Chế độ trình tạo provider">
    Chế độ trình tạo provider chỉ nhắm tới các đường dẫn `secrets.providers.<alias>`:

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
Các phép gán SecretRef bị từ chối trên những bề mặt có thể thay đổi lúc runtime nhưng không được hỗ trợ (ví dụ `hooks.token`, `commands.ownerDisplaySecret`, token Webhook ràng buộc luồng Discord, và JSON thông tin xác thực WhatsApp). Xem [Bề mặt thông tin xác thực SecretRef](/vi/reference/secretref-credential-surface).
</Warning>

Phân tích cú pháp hàng loạt luôn dùng payload hàng loạt (`--batch-json`/`--batch-file`) làm nguồn sự thật. `--strict-json` / `--json` không thay đổi hành vi phân tích cú pháp hàng loạt.

## `config patch`

Dùng `config patch` khi bạn muốn dán hoặc pipe một bản vá có dạng cấu hình thay vì chạy nhiều lệnh `config set` theo đường dẫn. Đầu vào là một đối tượng JSON5. Đối tượng được hợp nhất đệ quy, mảng và giá trị vô hướng thay thế giá trị đích, và `null` xóa đường dẫn đích.

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

Dùng `--replace-path <path>` khi một đối tượng hoặc mảng phải trở thành chính xác giá trị đã cung cấp thay vì được vá đệ quy:

```bash
openclaw config patch --file ./discord.patch.json5 --replace-path 'channels.discord.guilds["123"].channels'
```

`--dry-run` chạy các kiểm tra schema và khả năng phân giải SecretRef mà không ghi. SecretRef dựa trên exec mặc định được bỏ qua trong dry-run; thêm `--allow-exec` khi bạn cố ý muốn dry-run thực thi lệnh provider.

Chế độ đường dẫn/giá trị JSON vẫn được hỗ trợ cho cả SecretRef và provider:

```bash
openclaw config set channels.discord.token \
  '{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}' \
  --strict-json

openclaw config set secrets.providers.vaultfile \
  '{"source":"file","path":"/etc/openclaw/secrets.json","mode":"json"}' \
  --strict-json
```

## Cờ trình tạo provider

Đích trình tạo provider phải dùng `secrets.providers.<alias>` làm đường dẫn.

<AccordionGroup>
  <Accordion title="Cờ chung">
    - `--provider-source <env|file|exec>`
    - `--provider-timeout-ms <ms>` (`file`, `exec`)

  </Accordion>
  <Accordion title="Provider env (--provider-source env)">
    - `--provider-allowlist <ENV_VAR>` (có thể lặp lại)

  </Accordion>
  <Accordion title="Provider tệp (--provider-source file)">
    - `--provider-path <path>` (bắt buộc)
    - `--provider-mode <singleValue|json>`
    - `--provider-max-bytes <bytes>`
    - `--provider-allow-insecure-path`

  </Accordion>
  <Accordion title="Provider exec (--provider-source exec)">
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
  <Accordion title="Hành vi dry-run">
    - Chế độ trình tạo: chạy kiểm tra khả năng phân giải SecretRef cho các ref/provider đã thay đổi.
    - Chế độ JSON (`--strict-json`, `--json`, hoặc chế độ hàng loạt): chạy xác thực schema cộng với kiểm tra khả năng phân giải SecretRef.
    - Xác thực chính sách cũng chạy cho các bề mặt đích SecretRef không được hỗ trợ đã biết.
    - Kiểm tra chính sách đánh giá toàn bộ cấu hình sau thay đổi, nên các thao tác ghi đối tượng cha (ví dụ đặt `hooks` làm đối tượng) không thể vượt qua xác thực bề mặt không được hỗ trợ.
    - Kiểm tra SecretRef exec mặc định được bỏ qua trong dry-run để tránh tác dụng phụ từ lệnh.
    - Dùng `--allow-exec` với `--dry-run` để chọn tham gia kiểm tra SecretRef exec (điều này có thể thực thi lệnh provider).
    - `--allow-exec` chỉ dành cho dry-run và báo lỗi nếu dùng không có `--dry-run`.

  </Accordion>
  <Accordion title="Trường --dry-run --json">
    `--dry-run --json` in báo cáo máy có thể đọc:

    - `ok`: liệu dry-run có đạt hay không
    - `operations`: số lượng phép gán đã được đánh giá
    - `checks`: liệu các kiểm tra schema/khả năng phân giải đã chạy hay chưa
    - `checks.resolvabilityComplete`: liệu các kiểm tra khả năng phân giải đã chạy đến khi hoàn tất hay chưa (false khi các exec refs bị bỏ qua)
    - `refsChecked`: số lượng refs thực sự được phân giải trong dry-run
    - `skippedExecRefs`: số lượng exec refs bị bỏ qua vì `--allow-exec` chưa được đặt
    - `errors`: các lỗi thiếu đường dẫn, schema, hoặc khả năng phân giải có cấu trúc khi `ok=false`

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
  <Tab title="Success example">
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
  <Tab title="Failure example">
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
  <Accordion title="If dry-run fails">
    - `config schema validation failed`: hình dạng config sau thay đổi của bạn không hợp lệ; hãy sửa đường dẫn/giá trị hoặc hình dạng đối tượng provider/ref.
    - `Config policy validation failed: unsupported SecretRef usage`: chuyển thông tin xác thực đó trở lại đầu vào plaintext/string và chỉ giữ SecretRefs trên các bề mặt được hỗ trợ.
    - `SecretRef assignment(s) could not be resolved`: provider/ref được tham chiếu hiện không thể phân giải (thiếu biến môi trường, con trỏ tệp không hợp lệ, lỗi exec provider, hoặc provider/source không khớp).
    - `Dry run note: skipped <n> exec SecretRef resolvability check(s)`: dry-run đã bỏ qua exec refs; chạy lại với `--allow-exec` nếu bạn cần xác thực khả năng phân giải exec.
    - Với chế độ batch, hãy sửa các mục lỗi và chạy lại `--dry-run` trước khi ghi.

  </Accordion>
</AccordionGroup>

## An toàn khi ghi

`openclaw config set` và các trình ghi config khác do OpenClaw sở hữu xác thực toàn bộ config sau thay đổi trước khi commit nó vào ổ đĩa. Nếu payload mới không vượt qua xác thực schema hoặc trông giống một thao tác ghi đè phá hủy, config đang hoạt động sẽ được giữ nguyên và payload bị từ chối được lưu bên cạnh dưới dạng `openclaw.json.rejected.*`.

<Warning>
Đường dẫn config đang hoạt động phải là một tệp thông thường. Các bố cục `openclaw.json` dạng symlink không được hỗ trợ cho thao tác ghi; thay vào đó hãy dùng `OPENCLAW_CONFIG_PATH` để trỏ trực tiếp đến tệp thật.
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

Ghi trực tiếp bằng trình chỉnh sửa vẫn được phép, nhưng Gateway đang chạy sẽ xem chúng là không đáng tin cậy cho đến khi chúng được xác thực. Các chỉnh sửa trực tiếp không hợp lệ sẽ làm khởi động thất bại hoặc bị hot reload bỏ qua; Gateway không ghi lại `openclaw.json`. Chạy `openclaw doctor --fix` để sửa config bị thêm tiền tố/ghi đè hỏng hoặc khôi phục bản sao tốt gần nhất. Xem [Khắc phục sự cố Gateway](/vi/gateway/troubleshooting#gateway-rejected-invalid-config).

Khôi phục toàn bộ tệp chỉ dành cho sửa chữa bằng doctor. Các thay đổi schema của Plugin hoặc độ lệch `minHostVersion` vẫn được báo rõ thay vì rollback các thiết đặt người dùng không liên quan như models, providers, auth profiles, channels, gateway exposure, tools, memory, browser, hoặc cron config.

## Lệnh con

- `config file`: In đường dẫn tệp config đang hoạt động (được phân giải từ `OPENCLAW_CONFIG_PATH` hoặc vị trí mặc định). Đường dẫn nên chỉ đến một tệp thông thường, không phải symlink.

Khởi động lại gateway sau khi chỉnh sửa.

## Xác thực

Xác thực config hiện tại với schema đang hoạt động mà không khởi động gateway.

```bash
openclaw config validate
openclaw config validate --json
```

Sau khi `openclaw config validate` đạt, bạn có thể dùng TUI cục bộ để cho một agent nhúng so sánh config đang hoạt động với tài liệu trong khi bạn xác thực từng thay đổi từ cùng terminal:

<Note>
Nếu xác thực đã thất bại, hãy bắt đầu với `openclaw configure` hoặc `openclaw doctor --fix`. `openclaw chat` không bỏ qua chốt chặn config không hợp lệ.
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
  <Step title="Compare with docs">
    Yêu cầu agent so sánh config hiện tại của bạn với trang tài liệu liên quan và đề xuất cách sửa nhỏ nhất.
  </Step>
  <Step title="Apply targeted edits">
    Áp dụng các chỉnh sửa có mục tiêu bằng `openclaw config set` hoặc `openclaw configure`.
  </Step>
  <Step title="Re-validate">
    Chạy lại `openclaw config validate` sau mỗi thay đổi.
  </Step>
  <Step title="Doctor for runtime issues">
    Nếu xác thực đạt nhưng runtime vẫn không khỏe, hãy chạy `openclaw doctor` hoặc `openclaw doctor --fix` để được trợ giúp migration và sửa chữa.
  </Step>
</Steps>

## Liên quan

- [Tham chiếu CLI](/vi/cli)
- [Cấu hình](/vi/gateway/configuration)
