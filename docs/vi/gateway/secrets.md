---
read_when:
    - Cấu hình SecretRefs cho thông tin xác thực nhà cung cấp và `auth-profiles.json` refs
    - Vận hành việc tải lại, kiểm toán, cấu hình và áp dụng bí mật một cách an toàn trong production
    - Hiểu về fail-fast khi khởi động, lọc bề mặt không hoạt động và hành vi tốt-gần-nhất đã biết
sidebarTitle: Secrets management
summary: 'Quản lý bí mật: hợp đồng SecretRef, hành vi snapshot thời gian chạy và xóa sạch một chiều an toàn'
title: Quản lý bí mật
x-i18n:
    generated_at: "2026-06-27T17:32:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6d90346b1e4abc39cf1ab314c242f0b976aa83ee06f6dfeb787aafb19fa90de9
    source_path: gateway/secrets.md
    workflow: 16
---

OpenClaw hỗ trợ SecretRefs cộng thêm để các thông tin xác thực được hỗ trợ không cần được lưu dưới dạng văn bản thuần trong cấu hình.

<Note>
Văn bản thuần vẫn hoạt động. SecretRefs được bật tùy chọn cho từng thông tin xác thực.
</Note>

<Warning>
Thông tin xác thực dạng văn bản thuần vẫn có thể bị tác nhân đọc nếu chúng được lưu trong các tệp mà
tác nhân có thể kiểm tra, bao gồm `openclaw.json`, `auth-profiles.json`, `.env`, hoặc
các tệp `agents/*/agent/models.json` được tạo. SecretRefs chỉ giảm phạm vi tác động
cục bộ đó sau khi mọi thông tin xác thực được hỗ trợ đã được di chuyển và
`openclaw secrets audit --check` báo cáo không còn phần dư bí mật dạng văn bản thuần.
</Warning>

## Mục tiêu và mô hình runtime

Bí mật được phân giải vào một ảnh chụp runtime trong bộ nhớ.

- Quá trình phân giải diễn ra sớm trong lúc kích hoạt, không trì hoãn trên các đường dẫn yêu cầu.
- Khởi động thất bại nhanh khi một SecretRef thực sự đang hoạt động không thể được phân giải.
- Tải lại dùng hoán đổi nguyên tử: thành công hoàn toàn, hoặc giữ ảnh chụp tốt gần nhất.
- Vi phạm chính sách SecretRef (ví dụ hồ sơ xác thực ở chế độ OAuth kết hợp với đầu vào SecretRef) làm quá trình kích hoạt thất bại trước khi hoán đổi runtime.
- Yêu cầu runtime chỉ đọc từ ảnh chụp đang hoạt động trong bộ nhớ.
- Sau lần kích hoạt/tải cấu hình thành công đầu tiên, các đường dẫn mã runtime tiếp tục đọc ảnh chụp đang hoạt động trong bộ nhớ đó cho đến khi một lần tải lại thành công hoán đổi nó.
- Các đường dẫn gửi đi cũng đọc từ ảnh chụp đang hoạt động đó (ví dụ gửi trả lời/luồng Discord và gửi hành động Telegram); chúng không phân giải lại SecretRefs trong mỗi lần gửi.

Điều này giữ các sự cố nhà cung cấp bí mật tránh khỏi các đường dẫn yêu cầu nóng.

## Ranh giới truy cập của tác nhân

SecretRefs bảo vệ thông tin xác thực khỏi việc được lưu lâu dài trong cấu hình được hỗ trợ và
các bề mặt mô hình được tạo, nhưng chúng không phải là ranh giới cách ly tiến trình. Nếu một
thông tin xác thực dạng văn bản thuần vẫn còn trên đĩa ở một đường dẫn mà tác nhân có thể đọc, tác nhân có thể
vượt qua cơ chế biên tập ở cấp API bằng cách dùng công cụ tệp hoặc shell để kiểm tra tệp đó.

Đối với triển khai production nơi các tệp mà tác nhân có thể truy cập nằm trong phạm vi, hãy xem
việc di chuyển SecretRef là hoàn tất chỉ khi tất cả điều kiện sau đều đúng:

- thông tin xác thực được hỗ trợ dùng SecretRefs thay cho giá trị văn bản thuần
- phần dư văn bản thuần cũ đã được xóa khỏi `openclaw.json`,
  `auth-profiles.json`, `.env`, và các tệp `models.json` được tạo
- `openclaw secrets audit --check` sạch sau khi di chuyển
- mọi thông tin xác thực còn lại không được hỗ trợ hoặc đang luân phiên được bảo vệ bằng cách ly hệ điều hành,
  cách ly container, hoặc proxy thông tin xác thực bên ngoài

Đây là lý do quy trình audit/configure/apply là một cổng di chuyển bảo mật, không
chỉ là một tiện ích hỗ trợ.

<Warning>
SecretRefs không làm cho các tệp có thể đọc tùy ý trở nên an toàn. Bản sao lưu, cấu hình đã sao chép,
catalog mô hình cũ được tạo, và các lớp thông tin xác thực không được hỗ trợ phải được xem
như bí mật production cho đến khi chúng bị xóa, được chuyển ra ngoài ranh giới tin cậy của tác nhân,
hoặc được bảo vệ bằng một lớp cách ly riêng.
</Warning>

## Lọc bề mặt đang hoạt động

SecretRefs chỉ được xác thực trên các bề mặt thực sự đang hoạt động.

- Bề mặt đã bật: ref chưa phân giải chặn khởi động/tải lại.
- Bề mặt không hoạt động: ref chưa phân giải không chặn khởi động/tải lại.
- Ref không hoạt động phát ra chẩn đoán không gây lỗi với mã `SECRETS_REF_IGNORED_INACTIVE_SURFACE`.

<AccordionGroup>
  <Accordion title="Ví dụ về bề mặt không hoạt động">
    - Mục kênh/tài khoản đã tắt.
    - Thông tin xác thực kênh cấp cao nhất mà không tài khoản đã bật nào kế thừa.
    - Bề mặt công cụ/tính năng đã tắt.
    - Khóa dành riêng cho nhà cung cấp tìm kiếm web không được chọn bởi `tools.web.search.provider`. Ở chế độ tự động (chưa đặt nhà cung cấp), các khóa được tham chiếu theo thứ tự ưu tiên để tự động phát hiện nhà cung cấp cho đến khi một khóa phân giải được. Sau khi chọn, khóa của nhà cung cấp không được chọn được xem là không hoạt động cho đến khi được chọn.
    - Vật liệu xác thực SSH sandbox (`agents.defaults.sandbox.ssh.identityData`, `certificateData`, `knownHostsData`, cộng với ghi đè theo từng tác nhân) chỉ hoạt động khi backend sandbox hiệu lực là `ssh` cho tác nhân mặc định hoặc một tác nhân đã bật.
    - SecretRefs `gateway.remote.token` / `gateway.remote.password` hoạt động nếu một trong các điều kiện sau đúng:
      - `gateway.mode=remote`
      - `gateway.remote.url` được cấu hình
      - `gateway.tailscale.mode` là `serve` hoặc `funnel`
      - Ở chế độ cục bộ không có các bề mặt từ xa đó:
        - `gateway.remote.token` hoạt động khi xác thực bằng token có thể thắng và không có token env/auth nào được cấu hình.
        - `gateway.remote.password` chỉ hoạt động khi xác thực bằng mật khẩu có thể thắng và không có mật khẩu env/auth nào được cấu hình.
    - SecretRef `gateway.auth.token` không hoạt động cho phân giải xác thực khi khởi động khi `OPENCLAW_GATEWAY_TOKEN` được đặt, vì đầu vào token env thắng cho runtime đó.

  </Accordion>
</AccordionGroup>

## Chẩn đoán bề mặt xác thực Gateway

Khi một SecretRef được cấu hình trên `gateway.auth.token`, `gateway.auth.password`, `gateway.remote.token`, hoặc `gateway.remote.password`, quá trình khởi động/tải lại Gateway ghi nhật ký trạng thái bề mặt một cách rõ ràng:

- `active`: SecretRef là một phần của bề mặt xác thực hiệu lực và phải phân giải được.
- `inactive`: SecretRef bị bỏ qua cho runtime này vì một bề mặt xác thực khác thắng, hoặc vì xác thực từ xa bị tắt/không hoạt động.

Các mục này được ghi nhật ký với `SECRETS_GATEWAY_AUTH_SURFACE` và bao gồm lý do được chính sách bề mặt đang hoạt động sử dụng, để bạn có thể thấy vì sao một thông tin xác thực được xem là hoạt động hoặc không hoạt động.

## Kiểm tra trước tham chiếu khi onboarding

Khi onboarding chạy ở chế độ tương tác và bạn chọn lưu trữ SecretRef, OpenClaw chạy xác thực kiểm tra trước trước khi lưu:

- Ref env: xác thực tên biến env và xác nhận có thể thấy một giá trị không rỗng trong lúc thiết lập.
- Ref nhà cung cấp (`file` hoặc `exec`): xác thực lựa chọn nhà cung cấp, phân giải `id`, và kiểm tra kiểu giá trị đã phân giải.
- Đường dẫn tái sử dụng quickstart: khi `gateway.auth.token` đã là SecretRef, onboarding phân giải nó trước khi khởi tạo probe/dashboard (đối với ref `env`, `file`, và `exec`) bằng cùng cổng thất bại nhanh.

Nếu xác thực thất bại, onboarding hiển thị lỗi và cho phép bạn thử lại.

## Hợp đồng SecretRef

Dùng một hình dạng đối tượng ở mọi nơi:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

<Tabs>
  <Tab title="env">
    ```json5
    { source: "env", provider: "default", id: "OPENAI_API_KEY" }
    ```

    Các trường SecretInput được hỗ trợ cũng chấp nhận dạng viết tắt chuỗi chính xác:

    ```json5
    "${OPENAI_API_KEY}"
    "$OPENAI_API_KEY"
    ```

    Xác thực:

    - `provider` phải khớp `^[a-z][a-z0-9_-]{0,63}$`
    - `id` phải khớp `^[A-Z][A-Z0-9_]{0,127}$`

  </Tab>
  <Tab title="file">
    ```json5
    { source: "file", provider: "filemain", id: "/providers/openai/apiKey" }
    ```

    Xác thực:

    - `provider` phải khớp `^[a-z][a-z0-9_-]{0,63}$`
    - `id` phải là một con trỏ JSON tuyệt đối (`/...`)
    - Thoát RFC6901 trong các phân đoạn: `~` => `~0`, `/` => `~1`

  </Tab>
  <Tab title="exec">
    ```json5
    { source: "exec", provider: "vault", id: "providers/openai/apiKey#value" }
    ```

    Xác thực:

    - `provider` phải khớp `^[a-z][a-z0-9_-]{0,63}$`
    - `id` phải khớp `^[A-Za-z0-9][A-Za-z0-9._:/#-]{0,255}$` (hỗ trợ selector như `secret#json_key`)
    - `id` không được chứa `.` hoặc `..` dưới dạng phân đoạn đường dẫn được phân tách bằng dấu gạch chéo (ví dụ `a/../b` bị từ chối)

  </Tab>
</Tabs>

## Cấu hình nhà cung cấp

Định nghĩa nhà cung cấp dưới `secrets.providers`:

```json5
{
  secrets: {
    providers: {
      default: { source: "env" },
      filemain: {
        source: "file",
        path: "~/.openclaw/secrets.json",
        mode: "json", // or "singleValue"
      },
      vault: {
        source: "exec",
        command: "/usr/local/bin/openclaw-vault-resolver",
        args: ["--profile", "prod"],
        passEnv: ["PATH", "VAULT_ADDR"],
        jsonOnly: true,
      },
      "team-secrets": {
        source: "exec",
        pluginIntegration: {
          pluginId: "acme-secrets",
          integrationId: "secret-store",
        },
      },
    },
    defaults: {
      env: "default",
      file: "filemain",
      exec: "vault",
    },
    resolution: {
      maxProviderConcurrency: 4,
      maxRefsPerProvider: 512,
      maxBatchBytes: 262144,
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Nhà cung cấp env">
    - Danh sách cho phép tùy chọn qua `allowlist`.
    - Giá trị env bị thiếu/rỗng làm phân giải thất bại.

  </Accordion>
  <Accordion title="Nhà cung cấp file">
    - Đọc tệp cục bộ từ `path`.
    - `mode: "json"` kỳ vọng payload đối tượng JSON và phân giải `id` như con trỏ.
    - `mode: "singleValue"` kỳ vọng id ref `"value"` và trả về nội dung tệp.
    - Đường dẫn phải vượt qua kiểm tra quyền sở hữu/quyền truy cập.
    - Ghi chú từ chối an toàn trên Windows: nếu không thể xác minh ACL cho một đường dẫn, quá trình phân giải thất bại. Chỉ với đường dẫn đáng tin cậy, đặt `allowInsecurePath: true` trên nhà cung cấp đó để bỏ qua kiểm tra bảo mật đường dẫn.

  </Accordion>
  <Accordion title="Nhà cung cấp exec">
    - Chạy đường dẫn binary tuyệt đối đã cấu hình, không dùng shell.
    - Theo mặc định, `command` phải trỏ đến một tệp thông thường (không phải symlink).
    - Đặt `allowSymlinkCommand: true` để cho phép đường dẫn lệnh symlink (ví dụ shim Homebrew). OpenClaw xác thực đường dẫn đích đã phân giải.
    - Kết hợp `allowSymlinkCommand` với `trustedDirs` cho đường dẫn của trình quản lý gói (ví dụ `["/opt/homebrew"]`).
    - Hỗ trợ timeout, timeout khi không có đầu ra, giới hạn byte đầu ra, danh sách cho phép env, và thư mục tin cậy.
    - Ghi chú từ chối an toàn trên Windows: nếu không thể xác minh ACL cho đường dẫn lệnh, quá trình phân giải thất bại. Chỉ với đường dẫn đáng tin cậy, đặt `allowInsecurePath: true` trên nhà cung cấp đó để bỏ qua kiểm tra bảo mật đường dẫn.
    - Nhà cung cấp exec do Plugin quản lý có thể dùng `pluginIntegration` thay vì
      sao chép `command`/`args`. OpenClaw phân giải chi tiết lệnh hiện tại
      từ manifest Plugin đã cài đặt trong lúc khởi động/tải lại. Nếu Plugin bị
      tắt, bị gỡ bỏ, không đáng tin cậy, hoặc không còn khai báo tích hợp,
      SecretRefs đang hoạt động dùng nhà cung cấp đó sẽ bị từ chối an toàn.

    Payload yêu cầu (stdin):

    ```json
    { "protocolVersion": 1, "provider": "vault", "ids": ["providers/openai/apiKey"] }
    ```

    Payload phản hồi (stdout):

    ```jsonc
    { "protocolVersion": 1, "values": { "providers/openai/apiKey": "<openai-api-key>" } } // pragma: allowlist secret
    ```

    Lỗi tùy chọn theo từng id:

    ```json
    {
      "protocolVersion": 1,
      "values": {},
      "errors": { "providers/openai/apiKey": { "message": "not found" } }
    }
    ```

  </Accordion>
</AccordionGroup>

## Khóa API dựa trên tệp

Không đặt chuỗi `file:...` trong khối `env` của cấu hình. Khối `env` là
nghĩa đen và không ghi đè, nên `file:...` không được phân giải.

Thay vào đó, hãy dùng SecretRef file trên một trường thông tin xác thực được hỗ trợ:

```json5
{
  secrets: {
    providers: {
      xai_key_file: {
        source: "file",
        path: "~/.openclaw/secrets/xai-api-key.txt",
        mode: "singleValue",
      },
    },
  },
  models: {
    providers: {
      xai: {
        apiKey: { source: "file", provider: "xai_key_file", id: "value" },
      },
    },
  },
}
```

Đối với `mode: "singleValue"`, SecretRef `id` là `"value"`. Đối với
`mode: "json"`, dùng một con trỏ JSON tuyệt đối như
`"/providers/xai/apiKey"`.

Xem [bề mặt thông tin xác thực SecretRef](/vi/reference/secretref-credential-surface) để biết
các trường cấu hình chấp nhận SecretRefs.

## Ví dụ tích hợp exec

<AccordionGroup>
  <Accordion title="1Password CLI">
    ```json5
    {
      secrets: {
        providers: {
          onepassword_openai: {
            source: "exec",
            command: "/opt/homebrew/bin/op",
            allowSymlinkCommand: true, // required for Homebrew symlinked binaries
            trustedDirs: ["/opt/homebrew"],
            args: ["read", "op://Personal/OpenClaw QA API Key/password"],
            passEnv: ["HOME"],
            jsonOnly: false,
          },
        },
      },
      models: {
        providers: {
          openai: {
            baseUrl: "https://api.openai.com/v1",
            models: [{ id: "gpt-5", name: "gpt-5" }],
            apiKey: { source: "exec", provider: "onepassword_openai", id: "value" },
          },
        },
      },
    }
    ```
  </Accordion>
  <Accordion title="Bitwarden Secrets Manager (`bws`)">
    Dùng một trình bao bọc phân giải khi bạn muốn các id SecretRef ánh xạ tới khóa mục
    Bitwarden Secrets Manager. Kho lưu trữ bao gồm
    `scripts/secrets/openclaw-bws-resolver.mjs`; hãy cài đặt hoặc sao chép nó vào một đường dẫn
    tuyệt đối đáng tin cậy trên máy chủ chạy Gateway.

    Yêu cầu:

    - Bitwarden Secrets Manager CLI (`bws`) được cài đặt trên máy chủ Gateway.
    - `BWS_ACCESS_TOKEN` khả dụng cho dịch vụ Gateway.
    - `PATH` được truyền cho trình phân giải, hoặc `BWS_BIN` được đặt thành đường dẫn nhị phân
      `bws` tuyệt đối.
    - `BWS_SERVER_URL` phải được đặt trong môi trường khi dùng một phiên bản Bitwarden
      tự lưu trữ.

    ```json5
    {
      secrets: {
        providers: {
          bws: {
            source: "exec",
            command: "/usr/local/bin/openclaw-bws-resolver.mjs",
            passEnv: ["BWS_ACCESS_TOKEN", "BWS_SERVER_URL", "PATH", "BWS_BIN"],
            jsonOnly: true,
          },
        },
      },
      models: {
        providers: {
          openai: {
            baseUrl: "https://api.openai.com/v1",
            models: [{ id: "gpt-5", name: "gpt-5" }],
            apiKey: {
              source: "exec",
              provider: "bws",
              id: "openclaw/providers/openai/apiKey",
            },
          },
        },
      },
    }
    ```

    Trình phân giải gom nhóm các id được yêu cầu, chạy `bws secret list`, rồi trả về
    các giá trị cho những trường `key` bí mật khớp. Dùng các khóa đáp ứng hợp đồng id
    SecretRef exec, chẳng hạn `openclaw/providers/openai/apiKey`; các khóa kiểu biến môi trường
    có dấu gạch dưới sẽ bị từ chối trước khi trình phân giải chạy. Nếu nhiều hơn
    một bí mật Bitwarden hiển thị có cùng khóa được yêu cầu, trình phân giải
    báo id đó là mơ hồ thay vì chọn một mục. Sau khi cập nhật cấu hình,
    xác minh đường dẫn trình phân giải:

    ```bash
    openclaw secrets audit --allow-exec
    ```

  </Accordion>
  <Accordion title="HashiCorp Vault CLI">
    ```json5
    {
      secrets: {
        providers: {
          vault_openai: {
            source: "exec",
            command: "/opt/homebrew/bin/vault",
            allowSymlinkCommand: true, // required for Homebrew symlinked binaries
            trustedDirs: ["/opt/homebrew"],
            args: ["kv", "get", "-field=OPENAI_API_KEY", "secret/openclaw"],
            passEnv: ["VAULT_ADDR", "VAULT_TOKEN"],
            jsonOnly: false,
          },
        },
      },
      models: {
        providers: {
          openai: {
            baseUrl: "https://api.openai.com/v1",
            models: [{ id: "gpt-5", name: "gpt-5" }],
            apiKey: { source: "exec", provider: "vault_openai", id: "value" },
          },
        },
      },
    }
    ```
  </Accordion>
  <Accordion title="password-store (`pass`)">
    Dùng một trình bao bọc phân giải nhỏ khi bạn muốn các id SecretRef ánh xạ trực tiếp tới
    mục `pass`. Lưu tệp này dưới dạng tệp thực thi trong một đường dẫn tuyệt đối vượt qua
    các kiểm tra đường dẫn exec-provider của bạn, ví dụ
    `/usr/local/bin/openclaw-pass-resolver`. Shebang `#!/usr/bin/env node`
    phân giải `node` từ `PATH` của tiến trình trình phân giải, vì vậy hãy đưa `PATH` vào
    `passEnv`. Nếu `pass` không nằm trên `PATH` đó, hãy đặt `PASS_BIN` trong môi trường
    cha và cũng đưa nó vào `passEnv`:

    ```js
    #!/usr/bin/env node
    const { spawnSync } = require("node:child_process");

    let stdin = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => {
      stdin += chunk;
    });
    process.stdin.on("error", (err) => {
      process.stderr.write(`${err.message}\n`);
      process.exit(1);
    });
    process.stdin.on("end", () => {
      let request;
      try {
        request = JSON.parse(stdin || "{}");
      } catch (err) {
        process.stderr.write(`Failed to parse request: ${err.message}\n`);
        process.exit(1);
      }

      const passBin = process.env.PASS_BIN || "pass";
      const values = {};
      const errors = {};

      for (const id of request.ids ?? []) {
        const result = spawnSync(passBin, ["show", id], { encoding: "utf8" });
        if (result.status === 0) {
          values[id] = result.stdout.split(/\r?\n/, 1)[0] ?? "";
        } else {
          errors[id] = { message: (result.stderr || `pass exited ${result.status}`).trim() };
        }
      }

      process.stdout.write(JSON.stringify({ protocolVersion: 1, values, errors }));
    });
    ```

    Sau đó cấu hình exec provider và trỏ `apiKey` tới đường dẫn mục `pass`:

    ```json5
    {
      secrets: {
        providers: {
          pass_store: {
            source: "exec",
            command: "/usr/local/bin/openclaw-pass-resolver",
            passEnv: ["PATH", "HOME", "GNUPGHOME", "GPG_TTY", "PASSWORD_STORE_DIR", "PASS_BIN"],
            jsonOnly: true,
          },
        },
      },
      models: {
        providers: {
          openai: {
            baseUrl: "https://api.openai.com/v1",
            models: [{ id: "gpt-5", name: "gpt-5" }],
            apiKey: {
              source: "exec",
              provider: "pass_store",
              id: "openclaw/providers/openai/apiKey",
            },
          },
        },
      },
    }
    ```

    Giữ bí mật ở dòng đầu tiên của mục `pass`, hoặc tùy chỉnh
    trình bao bọc nếu bạn muốn trả về toàn bộ đầu ra `pass show`. Sau khi
    cập nhật cấu hình, xác minh cả kiểm tra tĩnh và đường dẫn trình phân giải exec:

    ```bash
    openclaw secrets audit --check
    openclaw secrets audit --allow-exec
    ```

  </Accordion>
  <Accordion title="sops">
    ```json5
    {
      secrets: {
        providers: {
          sops_openai: {
            source: "exec",
            command: "/opt/homebrew/bin/sops",
            allowSymlinkCommand: true, // required for Homebrew symlinked binaries
            trustedDirs: ["/opt/homebrew"],
            args: ["-d", "--extract", '["providers"]["openai"]["apiKey"]', "/path/to/secrets.enc.json"],
            passEnv: ["SOPS_AGE_KEY_FILE"],
            jsonOnly: false,
          },
        },
      },
      models: {
        providers: {
          openai: {
            baseUrl: "https://api.openai.com/v1",
            models: [{ id: "gpt-5", name: "gpt-5" }],
            apiKey: { source: "exec", provider: "sops_openai", id: "value" },
          },
        },
      },
    }
    ```
  </Accordion>
</AccordionGroup>

## Biến môi trường máy chủ MCP

Các biến môi trường máy chủ MCP được cấu hình qua `plugins.entries.acpx.config.mcpServers` hỗ trợ SecretInput. Điều này giữ khóa API và token khỏi cấu hình văn bản thuần:

```json5
{
  plugins: {
    entries: {
      acpx: {
        enabled: true,
        config: {
          mcpServers: {
            github: {
              command: "npx",
              args: ["-y", "@modelcontextprotocol/server-github"],
              env: {
                GITHUB_PERSONAL_ACCESS_TOKEN: {
                  source: "env",
                  provider: "default",
                  id: "MCP_GITHUB_PAT",
                },
              },
            },
          },
        },
      },
    },
  },
}
```

Các giá trị chuỗi văn bản thuần vẫn hoạt động. Tham chiếu mẫu env như `${MCP_SERVER_API_KEY}` và đối tượng SecretRef được phân giải trong quá trình kích hoạt gateway trước khi tiến trình máy chủ MCP được khởi chạy. Như với các bề mặt SecretRef khác, tham chiếu chưa phân giải chỉ chặn kích hoạt khi Plugin `acpx` thực sự hoạt động.

## Vật liệu xác thực SSH sandbox

Backend sandbox `ssh` lõi cũng hỗ trợ SecretRef cho vật liệu xác thực SSH:

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "ssh",
        ssh: {
          target: "user@gateway-host:22",
          identityData: { source: "env", provider: "default", id: "SSH_IDENTITY" },
          certificateData: { source: "env", provider: "default", id: "SSH_CERTIFICATE" },
          knownHostsData: { source: "env", provider: "default", id: "SSH_KNOWN_HOSTS" },
        },
      },
    },
  },
}
```

Hành vi thời gian chạy:

- OpenClaw phân giải các tham chiếu này trong quá trình kích hoạt sandbox, không phân giải lười trong từng lệnh gọi SSH.
- Các giá trị đã phân giải được ghi vào tệp tạm với quyền hạn chế và được dùng trong cấu hình SSH được tạo.
- Nếu backend sandbox hiệu lực không phải là `ssh`, các tham chiếu này vẫn không hoạt động và không chặn khởi động.

## Bề mặt thông tin xác thực được hỗ trợ

Thông tin xác thực được hỗ trợ và không được hỗ trợ theo chuẩn được liệt kê trong:

- [Bề mặt thông tin xác thực SecretRef](/vi/reference/secretref-credential-surface)

<Note>
Thông tin xác thực do runtime cấp phát hoặc xoay vòng và vật liệu làm mới OAuth được cố ý loại trừ khỏi cơ chế phân giải SecretRef chỉ đọc.
</Note>

## Hành vi và thứ tự ưu tiên bắt buộc

- Trường không có tham chiếu: không đổi.
- Trường có tham chiếu: bắt buộc trên các bề mặt đang hoạt động trong quá trình kích hoạt.
- Nếu có cả văn bản thuần và tham chiếu, tham chiếu được ưu tiên trên các đường dẫn ưu tiên được hỗ trợ.
- Sentinel che giấu `__OPENCLAW_REDACTED__` được dành riêng cho việc che giấu/khôi phục cấu hình nội bộ và bị từ chối nếu được gửi dưới dạng dữ liệu cấu hình nguyên văn.

Tín hiệu cảnh báo và kiểm tra:

- `SECRETS_REF_OVERRIDES_PLAINTEXT` (cảnh báo thời gian chạy)
- `REF_SHADOWED` (phát hiện kiểm tra khi thông tin xác thực `auth-profiles.json` được ưu tiên hơn tham chiếu `openclaw.json`)

Hành vi tương thích Google Chat:

- `serviceAccountRef` được ưu tiên hơn `serviceAccount` văn bản thuần.
- Giá trị văn bản thuần bị bỏ qua khi tham chiếu cùng cấp được đặt.

## Trình kích hoạt kích hoạt

Kích hoạt bí mật chạy khi:

- Khởi động (preflight cộng với kích hoạt cuối cùng)
- Đường dẫn áp dụng nóng khi tải lại cấu hình
- Đường dẫn kiểm tra khởi động lại khi tải lại cấu hình
- Tải lại thủ công qua `secrets.reload`
- Preflight RPC ghi cấu hình Gateway (`config.set` / `config.apply` / `config.patch`) để kiểm tra khả năng phân giải SecretRef trên bề mặt đang hoạt động trong payload cấu hình được gửi trước khi lưu chỉnh sửa

Hợp đồng kích hoạt:

- Thành công hoán đổi snapshot một cách nguyên tử.
- Lỗi khởi động hủy khởi động gateway.
- Lỗi tải lại thời gian chạy giữ snapshot tốt gần nhất.
- Lỗi preflight write-RPC từ chối cấu hình được gửi và giữ nguyên cả cấu hình trên đĩa lẫn snapshot runtime đang hoạt động.
- Việc cung cấp token kênh rõ ràng cho từng lệnh gọi đến một helper/tool gửi đi không kích hoạt SecretRef; các điểm kích hoạt vẫn là khởi động, tải lại và `secrets.reload` rõ ràng.

## Tín hiệu suy giảm và khôi phục

Khi kích hoạt trong lúc tải lại thất bại sau một trạng thái khỏe mạnh, OpenClaw chuyển sang trạng thái bí mật suy giảm.

Mã sự kiện hệ thống một lần và mã nhật ký:

- `SECRETS_RELOADER_DEGRADED`
- `SECRETS_RELOADER_RECOVERED`

Hành vi:

- Suy giảm: runtime giữ snapshot tốt gần nhất.
- Khôi phục: phát ra một lần sau lần kích hoạt thành công tiếp theo.
- Các lỗi lặp lại khi đã suy giảm ghi cảnh báo nhưng không spam sự kiện.
- Khởi động fail-fast không phát sự kiện suy giảm vì runtime chưa từng hoạt động.

## Phân giải đường dẫn lệnh

Đường dẫn lệnh có thể chọn tham gia cơ chế phân giải SecretRef được hỗ trợ qua RPC snapshot gateway.

Có hai hành vi tổng quát:

<Tabs>
  <Tab title="Đường dẫn lệnh nghiêm ngặt">
    Ví dụ: các đường dẫn bộ nhớ từ xa của `openclaw memory` và `openclaw qr --remote` khi cần các tham chiếu bí mật chia sẻ từ xa. Chúng đọc từ ảnh chụp nhanh đang hoạt động và thất bại nhanh khi SecretRef bắt buộc không khả dụng.
  </Tab>
  <Tab title="Đường dẫn lệnh chỉ đọc">
    Ví dụ: `openclaw status`, `openclaw status --all`, `openclaw channels status`, `openclaw channels resolve`, `openclaw security audit` và các luồng sửa chữa doctor/config chỉ đọc. Chúng cũng ưu tiên ảnh chụp nhanh đang hoạt động, nhưng hạ cấp thay vì hủy bỏ khi một SecretRef được nhắm mục tiêu không khả dụng trong đường dẫn lệnh đó.

    Hành vi chỉ đọc:

    - Khi gateway đang chạy, các lệnh này đọc từ ảnh chụp nhanh đang hoạt động trước.
    - Nếu việc phân giải gateway chưa hoàn tất hoặc gateway không khả dụng, chúng thử dự phòng cục bộ có nhắm mục tiêu cho bề mặt lệnh cụ thể.
    - Nếu một SecretRef được nhắm mục tiêu vẫn không khả dụng, lệnh tiếp tục với đầu ra chỉ đọc bị hạ cấp và chẩn đoán rõ ràng, chẳng hạn như "đã cấu hình nhưng không khả dụng trong đường dẫn lệnh này".
    - Hành vi bị hạ cấp này chỉ cục bộ trong lệnh. Nó không làm suy yếu các đường dẫn khởi động runtime, tải lại, hoặc gửi/xác thực.

  </Tab>
</Tabs>

Ghi chú khác:

- Việc làm mới ảnh chụp nhanh sau khi xoay vòng bí mật backend được xử lý bởi `openclaw secrets reload`.
- Phương thức RPC Gateway được các đường dẫn lệnh này sử dụng: `secrets.resolve`.

## Quy trình kiểm tra và cấu hình

Luồng thao tác mặc định:

<Steps>
  <Step title="Kiểm tra trạng thái hiện tại">
    ```bash
    openclaw secrets audit --check
    ```
  </Step>
  <Step title="Cấu hình và áp dụng SecretRefs">
    ```bash
    openclaw secrets configure --apply
    ```
  </Step>
  <Step title="Kiểm tra lại">
    ```bash
    openclaw secrets audit --check
    ```
  </Step>
</Steps>

Đừng xem quá trình di chuyển là hoàn tất cho đến khi lần kiểm tra lại sạch. Nếu kiểm tra
vẫn báo cáo các giá trị văn bản thuần được lưu trữ, rủi ro truy cập tác tử vẫn còn
ngay cả khi các API runtime trả về giá trị đã được che.

Nếu bạn lưu một kế hoạch thay vì áp dụng trong `configure`, hãy áp dụng kế hoạch đã lưu đó
bằng `openclaw secrets apply --from <plan-path>` trước khi kiểm tra lại.

<AccordionGroup>
  <Accordion title="secrets audit">
    Các phát hiện bao gồm:

    - giá trị văn bản thuần được lưu trữ (`openclaw.json`, `auth-profiles.json`, `.env`, và `agents/*/agent/models.json` được tạo)
    - phần dư header nhà cung cấp nhạy cảm dạng văn bản thuần trong các mục `models.json` được tạo
    - tham chiếu chưa phân giải
    - che khuất theo thứ tự ưu tiên (`auth-profiles.json` được ưu tiên hơn các tham chiếu trong `openclaw.json`)
    - phần dư cũ (`auth.json`, nhắc nhở OAuth)

    Ghi chú exec:

    - Theo mặc định, kiểm tra bỏ qua các bước kiểm tra khả năng phân giải SecretRef exec để tránh tác dụng phụ của lệnh.
    - Dùng `openclaw secrets audit --allow-exec` để thực thi các nhà cung cấp exec trong khi kiểm tra.

    Ghi chú phần dư header:

    - Việc phát hiện header nhà cung cấp nhạy cảm dựa trên heuristic theo tên (các tên và đoạn header xác thực/thông tin xác thực phổ biến như `authorization`, `x-api-key`, `token`, `secret`, `password`, và `credential`).

  </Accordion>
  <Accordion title="secrets configure">
    Trình trợ giúp tương tác:

    - cấu hình `secrets.providers` trước (`env`/`file`/`exec`, thêm/sửa/xóa)
    - cho phép bạn chọn các trường có chứa bí mật được hỗ trợ trong `openclaw.json` cùng với `auth-profiles.json` cho một phạm vi tác tử
    - có thể tạo ánh xạ `auth-profiles.json` mới trực tiếp trong bộ chọn đích
    - thu thập chi tiết SecretRef (`source`, `provider`, `id`)
    - chạy phân giải preflight
    - có thể áp dụng ngay lập tức

    Ghi chú exec:

    - Preflight bỏ qua các bước kiểm tra SecretRef exec trừ khi `--allow-exec` được đặt.
    - Nếu bạn áp dụng trực tiếp từ `configure --apply` và kế hoạch bao gồm các tham chiếu/nhà cung cấp exec, hãy giữ `--allow-exec` được đặt cho cả bước áp dụng.

    Chế độ hữu ích:

    - `openclaw secrets configure --providers-only`
    - `openclaw secrets configure --skip-provider-setup`
    - `openclaw secrets configure --agent <id>`

    Mặc định áp dụng của `configure`:

    - xóa sạch các thông tin xác thực tĩnh khớp khỏi `auth-profiles.json` cho các nhà cung cấp được nhắm mục tiêu
    - xóa sạch các mục `api_key` tĩnh cũ khỏi `auth.json`
    - xóa sạch các dòng bí mật đã biết khớp khỏi `<config-dir>/.env`

  </Accordion>
  <Accordion title="secrets apply">
    Áp dụng một kế hoạch đã lưu:

    ```bash
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
    ```

    Ghi chú exec:

    - dry-run bỏ qua các bước kiểm tra exec trừ khi `--allow-exec` được đặt.
    - chế độ ghi từ chối các kế hoạch chứa SecretRefs/nhà cung cấp exec trừ khi `--allow-exec` được đặt.

    Để biết chi tiết hợp đồng đích/đường dẫn nghiêm ngặt và các quy tắc từ chối chính xác, xem [Hợp đồng kế hoạch áp dụng bí mật](/vi/gateway/secrets-plan-contract).

  </Accordion>
</AccordionGroup>

## Chính sách an toàn một chiều

<Warning>
OpenClaw cố ý không ghi các bản sao lưu khôi phục chứa giá trị bí mật văn bản thuần trong lịch sử.
</Warning>

Mô hình an toàn:

- preflight phải thành công trước chế độ ghi
- kích hoạt runtime được xác thực trước khi commit
- apply cập nhật tệp bằng cách thay thế tệp nguyên tử và khôi phục best-effort khi thất bại

## Ghi chú tương thích xác thực cũ

Đối với thông tin xác thực tĩnh, runtime không còn phụ thuộc vào kho xác thực cũ dạng văn bản thuần.

- Nguồn thông tin xác thực runtime là ảnh chụp nhanh trong bộ nhớ đã được phân giải.
- Các mục `api_key` tĩnh cũ được xóa sạch khi được phát hiện.
- Hành vi tương thích liên quan đến OAuth vẫn riêng biệt.

## Ghi chú Web UI

Một số union SecretInput dễ cấu hình trong chế độ trình chỉnh sửa thô hơn là trong chế độ biểu mẫu.

## Liên quan

- [Xác thực](/vi/gateway/authentication) — thiết lập xác thực
- [CLI: secrets](/vi/cli/secrets) — lệnh CLI
- [Biến môi trường](/vi/help/environment) — thứ tự ưu tiên môi trường
- [Bề mặt thông tin xác thực SecretRef](/vi/reference/secretref-credential-surface) — bề mặt thông tin xác thực
- [Hợp đồng kế hoạch áp dụng bí mật](/vi/gateway/secrets-plan-contract) — chi tiết hợp đồng kế hoạch
- [Bảo mật](/vi/gateway/security) — tư thế bảo mật
