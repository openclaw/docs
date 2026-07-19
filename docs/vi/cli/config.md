---
read_when:
    - Bạn muốn đọc hoặc chỉnh sửa cấu hình theo cách không tương tác
sidebarTitle: Config
summary: Tài liệu tham khảo CLI cho `openclaw config` (get/set/patch/unset/file/schema/validate)
title: Cấu hình
x-i18n:
    generated_at: "2026-07-19T05:46:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: b6339649c229aaf121b753111bd3a7e3bd6837ed133bc38b77e4ff975cc64be0
    source_path: cli/config.md
    workflow: 16
---

Các trợ giúp không tương tác cho `openclaw.json`: lấy/đặt/vá/hủy đặt một giá trị theo đường dẫn, in schema, xác thực hoặc in đường dẫn tệp đang hoạt động. Chạy `openclaw config` mà không có lệnh con để mở cùng trình hướng dẫn có chỉ dẫn như `openclaw configure`.

<Note>
Khi `OPENCLAW_NIX_MODE=1`, OpenClaw coi `openclaw.json` là bất biến. Các lệnh chỉ đọc (`config get`, `config file`, `config schema`, `config validate`) vẫn hoạt động; các lệnh ghi cấu hình sẽ từ chối. Thay vào đó, hãy chỉnh sửa nguồn Nix cho bản cài đặt; đối với bản phân phối nix-openclaw chính chủ, hãy sử dụng [Hướng dẫn bắt đầu nhanh nix-openclaw](https://github.com/openclaw/nix-openclaw#quick-start) và đặt các giá trị bên dưới `programs.openclaw.config` hoặc `instances.<name>.config`.
</Note>

## Tùy chọn cấp gốc

<ParamField path="--section <section>" type="string">
  Bộ lọc phần thiết lập có chỉ dẫn, có thể lặp lại, khi chạy `openclaw config` mà không có lệnh con.
</ParamField>

Các phần có chỉ dẫn: `workspace`, `model`, `web`, `gateway`, `daemon`, `channels`, `plugins`, `skills`, `health`.

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

### Đường dẫn

Ký pháp dấu chấm hoặc dấu ngoặc. Đặt đường dẫn có dấu ngoặc trong dấu nháy ở các ví dụ shell để zsh không mở rộng glob `[0]`:

```bash
openclaw config get agents.defaults.workspace
openclaw config get 'agents.list[0].id'
openclaw config get agents.list
openclaw config set 'agents.list[1].tools.exec.node' "node-id-or-name"
```

### `config get`

Đọc một giá trị từ ảnh chụp nhanh cấu hình đã che thông tin nhạy cảm (các bí mật không bao giờ được in). `--json` in giá trị thô dưới dạng JSON; nếu không, chuỗi/số/giá trị boolean được in trực tiếp còn đối tượng/mảng được in dưới dạng JSON đã định dạng.

Khi đường dẫn không tồn tại, `--json` ghi `{ "error": "Config path not found: <path>" }` vào stdout và thoát với trạng thái 1. Nếu không có `--json`, thông báo chẩn đoán vẫn nằm trên stderr.

```bash
openclaw config get browser.executablePath
openclaw config get agents.defaults.model --json
```

### `config file`

In đường dẫn tệp cấu hình đang hoạt động, được phân giải từ `OPENCLAW_CONFIG_PATH` hoặc vị trí mặc định. Đường dẫn trỏ đến một tệp thông thường, không phải liên kết tượng trưng; xem [An toàn khi ghi](#write-safety).

### `config schema`

In schema JSON được tạo cho `openclaw.json` ra stdout.

<AccordionGroup>
  <Accordion title="Nội dung bao gồm">
    - Schema cấu hình gốc hiện tại, cộng với trường chuỗi `$schema` cấp gốc dành cho công cụ biên tập.
    - Siêu dữ liệu tài liệu của trường `title` / `description` được Control UI sử dụng.
    - Các nút đối tượng lồng nhau, ký tự đại diện (`*`) và phần tử mảng (`[]`) kế thừa cùng siêu dữ liệu `title` / `description` khi có tài liệu trường tương ứng.
    - Các nhánh `anyOf` / `oneOf` / `allOf` cũng kế thừa cùng siêu dữ liệu tài liệu.
    - Siêu dữ liệu schema Plugin + kênh trực tiếp theo cơ chế nỗ lực tối đa khi có thể tải các manifest thời gian chạy.
    - Một schema dự phòng sạch ngay cả khi cấu hình hiện tại không hợp lệ.

  </Accordion>
  <Accordion title="RPC thời gian chạy liên quan">
    `config.schema.lookup` trả về một đường dẫn cấu hình đã chuẩn hóa cùng một nút schema nông (`title`, `description`, `type`, `enum`, `const`, các giới hạn chung), siêu dữ liệu gợi ý UI tương ứng và bản tóm tắt các nút con trực tiếp. Sử dụng nó để xem chi tiết theo phạm vi đường dẫn trong Control UI hoặc các máy khách tùy chỉnh.
  </Accordion>
</AccordionGroup>

```bash
openclaw config schema
openclaw config schema > openclaw.schema.json
```

### `config validate`

Xác thực cấu hình hiện tại theo schema đang hoạt động mà không khởi động Gateway.

```bash
openclaw config validate
openclaw config validate --json
```

<Note>
Nếu quá trình xác thực đã thất bại, hãy bắt đầu với `openclaw configure` hoặc `openclaw doctor --fix`. `openclaw chat` không bỏ qua cơ chế bảo vệ cấu hình không hợp lệ.
</Note>

## Giá trị

Các giá trị được phân tích cú pháp dưới dạng JSON5 khi có thể; nếu không, chúng được coi là chuỗi thô. Sử dụng `--strict-json` để yêu cầu JSON tiêu chuẩn mà không dự phòng về chuỗi (khi đó cú pháp chỉ có trong JSON5 như chú thích, dấu phẩy cuối hoặc khóa không có dấu nháy sẽ bị từ chối). `--json` là bí danh cũ của `--strict-json` trên `config set`.

```bash
openclaw config set agents.defaults.heartbeat.every "0m"
openclaw config set gateway.port 19001 --strict-json
openclaw config set channels.whatsapp.groups '["*"]' --strict-json
```

`config get <path> --json` in giá trị thô dưới dạng JSON thay vì văn bản được định dạng cho terminal.

<Note>
Theo mặc định, việc gán đối tượng sẽ thay thế đường dẫn đích. Những đường dẫn được bảo vệ thường chứa các mục do người dùng thêm sẽ từ chối phép thay thế làm mất các mục hiện có, trừ khi bạn truyền `--replace`: `agents.defaults.models`, `agents.list`, `models.providers`, `models.providers.<id>`, `models.providers.<id>.models`, `plugins.entries` và `auth.profiles`.
</Note>

Sử dụng `--merge` khi thêm mục vào các ánh xạ đó:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
openclaw config set models.providers.ollama.models '[{"id":"llama3.2","name":"Llama 3.2"}]' --strict-json --merge
```

Chỉ sử dụng `--replace` khi giá trị được cung cấp cần chủ ý trở thành toàn bộ giá trị đích.

## Các chế độ `config set`

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
  <Tab title="Chế độ trình tạo nhà cung cấp">
    Chỉ nhắm đến các đường dẫn `secrets.providers.<alias>`:

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

    Các tệp hàng loạt bị giới hạn ở 8 MiB.

  </Tab>
</Tabs>

<Warning>
Các phép gán SecretRef bị từ chối trên những bề mặt có thể thay đổi trong thời gian chạy nhưng không được hỗ trợ (ví dụ: `hooks.token`, `commands.ownerDisplaySecret`, token Webhook liên kết luồng Discord và JSON thông tin xác thực WhatsApp). Xem [Bề mặt thông tin xác thực SecretRef](/vi/reference/secretref-credential-surface).
</Warning>

Quá trình phân tích cú pháp hàng loạt luôn sử dụng tải trọng hàng loạt (`--batch-json`/`--batch-file`) làm nguồn chân lý; `--strict-json` / `--json` không thay đổi hành vi phân tích cú pháp hàng loạt.

Chế độ đường dẫn/giá trị JSON cũng hoạt động trực tiếp với SecretRef và nhà cung cấp:

```bash
openclaw config set channels.discord.token \
  '{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}' \
  --strict-json

openclaw config set secrets.providers.vaultfile \
  '{"source":"file","path":"/etc/openclaw/secrets.json","mode":"json"}' \
  --strict-json
```

### Cờ trình tạo nhà cung cấp

Đích của trình tạo nhà cung cấp phải sử dụng `secrets.providers.<alias>` làm đường dẫn.

<AccordionGroup>
  <Accordion title="Cờ chung">
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
  <Accordion title="Nhà cung cấp thực thi (--provider-source exec)">
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

Ví dụ về nhà cung cấp thực thi được tăng cường bảo mật:

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

## `config patch`

Dán hoặc chuyển qua pipe một bản vá JSON5 có hình dạng cấu hình thay vì chạy nhiều lệnh `config set` dựa trên đường dẫn. Các đối tượng được hợp nhất đệ quy; mảng và giá trị vô hướng thay thế đích; `null` xóa đường dẫn đích.

```bash
openclaw config patch --file ./openclaw.patch.json5 --dry-run
openclaw config patch --file ./openclaw.patch.json5
```

Các tệp bản vá bị giới hạn ở 8 MiB. Các bản vá `--stdin` được chuyển qua pipe bị giới hạn ở 1 MiB.

Chuyển bản vá qua stdin cho các tập lệnh thiết lập từ xa:

```bash
ssh user@gateway-host 'openclaw config patch --stdin --dry-run' < ./openclaw.patch.json5
ssh user@gateway-host 'openclaw config patch --stdin' < ./openclaw.patch.json5
```

Ví dụ về bản vá:

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
      model: { primary: "openai/gpt-5.6-sol" },
      models: {
        "openai/gpt-5.6-sol": { params: { fastMode: true } },
      },
    },
  },
}
```

Sử dụng `--replace-path <path>` khi một đối tượng hoặc mảng phải trở thành chính xác giá trị được cung cấp thay vì được vá đệ quy:

```bash
openclaw config patch --file ./discord.patch.json5 --replace-path 'channels.discord.guilds["123"].channels'
```

`--dry-run` chạy kiểm tra schema và khả năng phân giải SecretRef mà không ghi. Theo mặc định, các SecretRef dựa trên thực thi bị bỏ qua trong quá trình chạy thử; thêm `--allow-exec` khi bạn chủ ý muốn quá trình chạy thử thực thi các lệnh của nhà cung cấp.

## Chạy thử

`--dry-run` xác thực các thay đổi mà không ghi `openclaw.json`. Khả dụng trên `config set`, `config patch` và `config unset`.

```bash
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
  <Accordion title="Hoạt động chạy thử">
    - Chế độ builder: chạy các bước kiểm tra khả năng phân giải SecretRef cho các tham chiếu/nhà cung cấp đã thay đổi.
    - Chế độ JSON (`--strict-json`, `--json` hoặc chế độ hàng loạt): chạy xác thực lược đồ cùng các bước kiểm tra khả năng phân giải SecretRef.
    - Việc xác thực chính sách được thực hiện trên toàn bộ cấu hình sau thay đổi, vì vậy thao tác ghi đối tượng cha (ví dụ: đặt `hooks` làm một đối tượng) không thể bỏ qua bước xác thực bề mặt không được hỗ trợ.
    - Các bước kiểm tra SecretRef dạng exec mặc định bị bỏ qua để tránh tác dụng phụ của lệnh; truyền `--allow-exec` để bật kiểm tra (thao tác này có thể thực thi các lệnh của nhà cung cấp). `--allow-exec` chỉ dành cho chế độ chạy thử và sẽ báo lỗi nếu không có `--dry-run`.

  </Accordion>
  <Accordion title="Các trường của --dry-run --json">
    - `ok`: liệu quá trình chạy thử có thành công hay không
    - `operations`: số lượng phép gán đã được đánh giá
    - `checks`: liệu các bước kiểm tra lược đồ/khả năng phân giải có được chạy hay không
    - `checks.resolvabilityComplete`: liệu các bước kiểm tra khả năng phân giải có chạy đến khi hoàn tất hay không (false khi các tham chiếu exec bị bỏ qua)
    - `refsChecked`: số lượng tham chiếu thực sự được phân giải trong quá trình chạy thử
    - `skippedExecRefs`: số lượng tham chiếu exec bị bỏ qua vì chưa đặt `--allow-exec`
    - `errors`: các lỗi có cấu trúc về đường dẫn bị thiếu, lược đồ hoặc khả năng phân giải khi `ok=false`

  </Accordion>
</AccordionGroup>

### Cấu trúc đầu ra JSON

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
      ref?: string, // có mặt đối với lỗi khả năng phân giải
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
          "message": "Lỗi: Biến môi trường \"MISSING_TEST_SECRET\" chưa được đặt.",
          "ref": "env:default:MISSING_TEST_SECRET"
        }
      ]
    }
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Nếu chạy thử thất bại">
    - `config schema validation failed`: cấu trúc cấu hình sau thay đổi không hợp lệ; hãy sửa đường dẫn/giá trị hoặc cấu trúc đối tượng nhà cung cấp/tham chiếu.
    - `Config policy validation failed: unsupported SecretRef usage`: chuyển thông tin xác thực đó về đầu vào văn bản thuần/chuỗi; chỉ giữ SecretRef trên các bề mặt được hỗ trợ.
    - `SecretRef assignment(s) could not be resolved`: nhà cung cấp/tham chiếu được viện dẫn hiện không thể phân giải (thiếu biến môi trường, con trỏ tệp không hợp lệ, nhà cung cấp exec gặp lỗi hoặc nhà cung cấp/nguồn không khớp).
    - `Dry run note: skipped <n> exec SecretRef resolvability check(s)`: chạy lại với `--allow-exec` nếu cần xác thực khả năng phân giải của exec.
    - Đối với chế độ hàng loạt, hãy sửa các mục bị lỗi và chạy lại `--dry-run` trước khi ghi.

  </Accordion>
</AccordionGroup>

## Áp dụng thay đổi

Sau mỗi lần `config set` / `config patch` / `config unset` thành công, CLI sẽ in một trong ba gợi ý để cho biết Gateway có cần khởi động lại hay không:

| Gợi ý                                                | Ý nghĩa                                |
| --------------------------------------------------- | -------------------------------------- |
| `Restart the gateway to apply.`                     | Đường dẫn đã thay đổi cần khởi động lại hoàn toàn. |
| `Change will apply without restarting the gateway.` | Tải lại nóng sẽ tự động áp dụng thay đổi.  |
| `No gateway restart needed.`                        | Không có nội dung liên quan đến thời gian chạy thay đổi.      |

Các thao tác ghi vào `plugins.entries` (hoặc bất kỳ đường dẫn con nào) luôn yêu cầu khởi động lại, vì CLI không thể chứng minh rằng siêu dữ liệu tải lại của mọi plugin đã được nạp.

## An toàn khi ghi

`openclaw config set` và các trình ghi cấu hình khác do OpenClaw sở hữu sẽ xác thực toàn bộ cấu hình sau thay đổi trước khi ghi vào ổ đĩa. Nếu tải trọng mới không vượt qua bước xác thực lược đồ hoặc có vẻ là thao tác ghi đè phá hủy dữ liệu, cấu hình đang hoạt động sẽ được giữ nguyên và tải trọng bị từ chối sẽ được lưu bên cạnh dưới dạng `openclaw.json.rejected.*`.

Các thao tác ghi do OpenClaw sở hữu sẽ tuần tự hóa lại JSON5 thành JSON tiêu chuẩn. Khi nguồn chứa chú thích, trình ghi sẽ cảnh báo ngay trước khi xóa chúng; hãy dùng trình chỉnh sửa trực tiếp nếu cần giữ lại chú thích.

<Warning>
Đường dẫn cấu hình đang hoạt động phải là một tệp thông thường. Các bố cục `openclaw.json` dùng liên kết tượng trưng không được hỗ trợ khi ghi; thay vào đó, hãy dùng `OPENCLAW_CONFIG_PATH` để trỏ trực tiếp đến tệp thực.
</Warning>

Ưu tiên thao tác ghi bằng CLI cho các chỉnh sửa nhỏ:

```bash
openclaw config set gateway.reload.mode hybrid --dry-run
openclaw config set gateway.reload.mode hybrid
openclaw config validate
```

Nếu thao tác ghi bị từ chối, hãy kiểm tra tải trọng đã lưu và sửa toàn bộ cấu trúc cấu hình:

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".rejected.* 2>/dev/null | head
openclaw config validate
```

Vẫn có thể ghi trực tiếp bằng trình chỉnh sửa, nhưng Gateway đang chạy sẽ coi các thay đổi đó là không đáng tin cậy cho đến khi chúng vượt qua bước xác thực. Các chỉnh sửa trực tiếp không hợp lệ sẽ khiến quá trình khởi động thất bại hoặc bị bỏ qua khi tải lại nóng; Gateway không ghi lại `openclaw.json`. Chạy `openclaw doctor --fix` để sửa cấu hình bị thêm tiền tố/ghi đè hoặc khôi phục bản sao hợp lệ gần nhất. Xem [khắc phục sự cố Gateway](/vi/gateway/troubleshooting#gateway-rejected-invalid-config).

Việc khôi phục toàn bộ tệp chỉ dành cho sửa chữa bằng doctor. Các thay đổi lược đồ Plugin hoặc độ lệch `minHostVersion` sẽ tiếp tục báo lỗi rõ ràng thay vì hoàn nguyên các cài đặt người dùng không liên quan như cấu hình mô hình, nhà cung cấp, hồ sơ xác thực, kênh, mức độ công khai của Gateway, công cụ, bộ nhớ, trình duyệt hoặc cron.

## Vòng lặp sửa chữa

Sau khi `openclaw config validate` thành công, hãy dùng TUI cục bộ để một tác nhân nhúng so sánh cấu hình đang hoạt động với tài liệu trong khi bạn xác thực từng thay đổi từ cùng một terminal:

```bash
openclaw chat
```

Bên trong TUI, ký tự `!` ở đầu sẽ chạy một lệnh shell cục bộ nguyên văn (sau lời nhắc xác nhận một lần cho mỗi phiên):

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

<Steps>
  <Step title="So sánh với tài liệu">
    Yêu cầu tác nhân so sánh cấu hình hiện tại với trang tài liệu liên quan và đề xuất bản sửa đổi nhỏ nhất.
  </Step>
  <Step title="Áp dụng chỉnh sửa có mục tiêu">
    Áp dụng các chỉnh sửa có mục tiêu bằng `openclaw config set` hoặc `openclaw configure`.
  </Step>
  <Step title="Xác thực lại">
    Chạy lại `openclaw config validate` sau mỗi thay đổi.
  </Step>
  <Step title="Dùng doctor cho sự cố thời gian chạy">
    Nếu quá trình xác thực thành công nhưng thời gian chạy vẫn không ổn định, hãy chạy `openclaw doctor` hoặc `openclaw doctor --fix` để được hỗ trợ di chuyển và sửa chữa.
  </Step>
</Steps>

## Liên quan

- [Tài liệu tham khảo CLI](/vi/cli)
- [Cấu hình](/vi/gateway/configuration)
