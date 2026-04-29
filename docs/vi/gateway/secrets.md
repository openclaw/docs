---
read_when:
    - Cấu hình SecretRefs cho thông tin xác thực của nhà cung cấp và các tham chiếu `auth-profiles.json`
    - Vận hành việc tải lại, kiểm tra, cấu hình và áp dụng bí mật một cách an toàn trong môi trường sản xuất
    - Tìm hiểu cơ chế lỗi sớm khi khởi động, lọc bề mặt không hoạt động và hành vi tốt gần nhất đã biết
sidebarTitle: Secrets management
summary: 'Quản lý bí mật: hợp đồng SecretRef, hành vi bản chụp nhanh thời gian chạy và quy trình làm sạch một chiều an toàn'
title: Quản lý bí mật
x-i18n:
    generated_at: "2026-04-29T22:46:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 96fddc346e21cab17d978843dc2a482c6faf8f810b3698a97aa88463133eaca5
    source_path: gateway/secrets.md
    workflow: 16
---

OpenClaw hỗ trợ SecretRefs bổ sung để các thông tin xác thực được hỗ trợ không cần được lưu dưới dạng văn bản thuần trong cấu hình.

<Note>
Văn bản thuần vẫn hoạt động. SecretRefs được bật tùy chọn theo từng thông tin xác thực.
</Note>

## Mục tiêu và mô hình thời gian chạy

Secrets được phân giải vào một ảnh chụp nhanh thời gian chạy trong bộ nhớ.

- Việc phân giải diễn ra chủ động trong quá trình kích hoạt, không trì hoãn trên các đường dẫn yêu cầu.
- Khởi động thất bại sớm khi một SecretRef thực sự hoạt động không thể được phân giải.
- Tải lại dùng hoán đổi nguyên tử: thành công hoàn toàn, hoặc giữ ảnh chụp nhanh tốt đã biết gần nhất.
- Vi phạm chính sách SecretRef (ví dụ hồ sơ xác thực ở chế độ OAuth kết hợp với đầu vào SecretRef) làm kích hoạt thất bại trước khi hoán đổi thời gian chạy.
- Yêu cầu thời gian chạy chỉ đọc từ ảnh chụp nhanh trong bộ nhớ đang hoạt động.
- Sau lần kích hoạt/tải cấu hình thành công đầu tiên, các đường dẫn mã thời gian chạy tiếp tục đọc ảnh chụp nhanh trong bộ nhớ đang hoạt động đó cho đến khi một lần tải lại thành công hoán đổi nó.
- Các đường dẫn gửi đi cũng đọc từ ảnh chụp nhanh đang hoạt động đó (ví dụ gửi trả lời/luồng Discord và gửi hành động Telegram); chúng không phân giải lại SecretRefs trên mỗi lần gửi.

Điều này giữ các sự cố ngừng hoạt động của nhà cung cấp secret khỏi các đường dẫn yêu cầu nóng.

## Lọc bề mặt hoạt động

SecretRefs chỉ được xác thực trên các bề mặt thực sự hoạt động.

- Bề mặt đã bật: tham chiếu chưa phân giải chặn khởi động/tải lại.
- Bề mặt không hoạt động: tham chiếu chưa phân giải không chặn khởi động/tải lại.
- Tham chiếu không hoạt động phát ra chẩn đoán không gây lỗi với mã `SECRETS_REF_IGNORED_INACTIVE_SURFACE`.

<AccordionGroup>
  <Accordion title="Ví dụ về bề mặt không hoạt động">
    - Các mục kênh/tài khoản đã tắt.
    - Thông tin xác thực kênh cấp cao nhất mà không tài khoản đã bật nào kế thừa.
    - Các bề mặt công cụ/tính năng đã tắt.
    - Khóa dành riêng cho nhà cung cấp tìm kiếm web không được chọn bởi `tools.web.search.provider`. Ở chế độ tự động (chưa đặt nhà cung cấp), các khóa được kiểm tra theo thứ tự ưu tiên để tự động phát hiện nhà cung cấp cho đến khi một khóa phân giải thành công. Sau khi chọn, khóa của nhà cung cấp không được chọn được coi là không hoạt động cho đến khi được chọn.
    - Dữ liệu xác thực SSH của môi trường cách ly (`agents.defaults.sandbox.ssh.identityData`, `certificateData`, `knownHostsData`, cùng với ghi đè theo từng tác nhân) chỉ hoạt động khi phần phụ trợ môi trường cách ly hiệu dụng là `ssh` cho tác nhân mặc định hoặc một tác nhân đã bật.
    - SecretRefs `gateway.remote.token` / `gateway.remote.password` hoạt động nếu một trong các điều kiện sau đúng:
      - `gateway.mode=remote`
      - `gateway.remote.url` được cấu hình
      - `gateway.tailscale.mode` là `serve` hoặc `funnel`
      - Ở chế độ cục bộ khi không có các bề mặt từ xa đó:
        - `gateway.remote.token` hoạt động khi xác thực bằng token có thể thắng và không có token từ biến môi trường/xác thực nào được cấu hình.
        - `gateway.remote.password` chỉ hoạt động khi xác thực bằng mật khẩu có thể thắng và không có mật khẩu từ biến môi trường/xác thực nào được cấu hình.
    - SecretRef `gateway.auth.token` không hoạt động cho phân giải xác thực khởi động khi `OPENCLAW_GATEWAY_TOKEN` được đặt, vì đầu vào token từ biến môi trường thắng cho thời gian chạy đó.

  </Accordion>
</AccordionGroup>

## Chẩn đoán bề mặt xác thực Gateway

Khi một SecretRef được cấu hình trên `gateway.auth.token`, `gateway.auth.password`, `gateway.remote.token`, hoặc `gateway.remote.password`, khởi động/tải lại Gateway ghi nhật ký trạng thái bề mặt một cách rõ ràng:

- `active`: SecretRef là một phần của bề mặt xác thực hiệu dụng và phải phân giải được.
- `inactive`: SecretRef bị bỏ qua cho thời gian chạy này vì một bề mặt xác thực khác thắng, hoặc vì xác thực từ xa bị tắt/không hoạt động.

Các mục này được ghi nhật ký với `SECRETS_GATEWAY_AUTH_SURFACE` và bao gồm lý do được chính sách bề mặt hoạt động sử dụng, để bạn có thể thấy vì sao một thông tin xác thực được coi là hoạt động hoặc không hoạt động.

## Kiểm tra sơ bộ tham chiếu khi thiết lập ban đầu

Khi thiết lập ban đầu chạy ở chế độ tương tác và bạn chọn lưu trữ SecretRef, OpenClaw chạy xác thực sơ bộ trước khi lưu:

- Tham chiếu biến môi trường: xác thực tên biến môi trường và xác nhận có thể thấy một giá trị không rỗng trong quá trình thiết lập.
- Tham chiếu nhà cung cấp (`file` hoặc `exec`): xác thực lựa chọn nhà cung cấp, phân giải `id`, và kiểm tra kiểu giá trị đã phân giải.
- Đường dẫn tái sử dụng khởi động nhanh: khi `gateway.auth.token` đã là một SecretRef, thiết lập ban đầu phân giải nó trước khi khởi động probe/dashboard (cho tham chiếu `env`, `file`, và `exec`) bằng cùng cổng thất bại sớm.

Nếu xác thực thất bại, thiết lập ban đầu hiển thị lỗi và cho phép bạn thử lại.

## Hợp đồng SecretRef

Dùng một dạng đối tượng ở mọi nơi:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

<Tabs>
  <Tab title="env">
    ```json5
    { source: "env", provider: "default", id: "OPENAI_API_KEY" }
    ```

    Xác thực:

    - `provider` phải khớp với `^[a-z][a-z0-9_-]{0,63}$`
    - `id` phải khớp với `^[A-Z][A-Z0-9_]{0,127}$`

  </Tab>
  <Tab title="file">
    ```json5
    { source: "file", provider: "filemain", id: "/providers/openai/apiKey" }
    ```

    Xác thực:

    - `provider` phải khớp với `^[a-z][a-z0-9_-]{0,63}$`
    - `id` phải là một JSON pointer tuyệt đối (`/...`)
    - Escape theo RFC6901 trong các phân đoạn: `~` => `~0`, `/` => `~1`

  </Tab>
  <Tab title="exec">
    ```json5
    { source: "exec", provider: "vault", id: "providers/openai/apiKey" }
    ```

    Xác thực:

    - `provider` phải khớp với `^[a-z][a-z0-9_-]{0,63}$`
    - `id` phải khớp với `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
    - `id` không được chứa `.` hoặc `..` dưới dạng các phân đoạn đường dẫn được phân tách bằng dấu gạch chéo (ví dụ `a/../b` bị từ chối)

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
  <Accordion title="Nhà cung cấp biến môi trường">
    - Danh sách cho phép tùy chọn qua `allowlist`.
    - Giá trị biến môi trường thiếu/rỗng khiến phân giải thất bại.

  </Accordion>
  <Accordion title="Nhà cung cấp tệp">
    - Đọc tệp cục bộ từ `path`.
    - `mode: "json"` mong đợi payload đối tượng JSON và phân giải `id` như một pointer.
    - `mode: "singleValue"` mong đợi ref id `"value"` và trả về nội dung tệp.
    - Đường dẫn phải vượt qua kiểm tra quyền sở hữu/quyền truy cập.
    - Lưu ý đóng khi lỗi trên Windows: nếu không thể xác minh ACL cho một đường dẫn, phân giải sẽ thất bại. Chỉ với các đường dẫn đáng tin cậy, đặt `allowInsecurePath: true` trên nhà cung cấp đó để bỏ qua kiểm tra bảo mật đường dẫn.

  </Accordion>
  <Accordion title="Nhà cung cấp thực thi">
    - Chạy đường dẫn nhị phân tuyệt đối đã cấu hình, không dùng shell.
    - Theo mặc định, `command` phải trỏ đến một tệp thông thường (không phải liên kết tượng trưng).
    - Đặt `allowSymlinkCommand: true` để cho phép đường dẫn lệnh là liên kết tượng trưng (ví dụ shim Homebrew). OpenClaw xác thực đường dẫn đích đã phân giải.
    - Ghép `allowSymlinkCommand` với `trustedDirs` cho các đường dẫn của trình quản lý gói (ví dụ `["/opt/homebrew"]`).
    - Hỗ trợ thời gian chờ, thời gian chờ khi không có đầu ra, giới hạn byte đầu ra, danh sách cho phép biến môi trường, và thư mục đáng tin cậy.
    - Lưu ý đóng khi lỗi trên Windows: nếu không thể xác minh ACL cho đường dẫn lệnh, phân giải sẽ thất bại. Chỉ với các đường dẫn đáng tin cậy, đặt `allowInsecurePath: true` trên nhà cung cấp đó để bỏ qua kiểm tra bảo mật đường dẫn.

    Nội dung yêu cầu (stdin):

    ```json
    { "protocolVersion": 1, "provider": "vault", "ids": ["providers/openai/apiKey"] }
    ```

    Nội dung phản hồi (stdout):

    ```jsonc
    { "protocolVersion": 1, "values": { "providers/openai/apiKey": "<openai-api-key>" } } // pragma: allowlist secret
    ```

    Lỗi tùy chọn theo từng `id`:

    ```json
    {
      "protocolVersion": 1,
      "values": {},
      "errors": { "providers/openai/apiKey": { "message": "not found" } }
    }
    ```

  </Accordion>
</AccordionGroup>

## Ví dụ tích hợp thực thi

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

Các biến môi trường máy chủ MCP được cấu hình qua `plugins.entries.acpx.config.mcpServers` hỗ trợ SecretInput. Điều này giữ khóa API và token không nằm trong cấu hình văn bản thuần:

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

Giá trị chuỗi văn bản thuần vẫn hoạt động. Tham chiếu mẫu biến môi trường như `${MCP_SERVER_API_KEY}` và đối tượng SecretRef được phân giải trong quá trình kích hoạt Gateway trước khi tiến trình máy chủ MCP được sinh ra. Như với các bề mặt SecretRef khác, tham chiếu chưa phân giải chỉ chặn kích hoạt khi Plugin `acpx` thực sự hoạt động.

## Dữ liệu xác thực SSH cho môi trường cách ly

Phần phụ trợ môi trường cách ly lõi `ssh` cũng hỗ trợ SecretRefs cho dữ liệu xác thực SSH:

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

- OpenClaw phân giải các tham chiếu này trong khi kích hoạt sandbox, không phân giải lười trong từng lệnh gọi SSH.
- Các giá trị đã phân giải được ghi vào tệp tạm với quyền hạn chế và được dùng trong cấu hình SSH đã tạo.
- Nếu backend sandbox hiệu lực không phải là `ssh`, các tham chiếu này vẫn không hoạt động và không chặn khởi động.

## Bề mặt thông tin xác thực được hỗ trợ

Thông tin xác thực được hỗ trợ và không được hỗ trợ chính thức được liệt kê tại:

- [Bề mặt thông tin xác thực SecretRef](/vi/reference/secretref-credential-surface)

<Note>
Thông tin xác thực được tạo trong thời gian chạy hoặc xoay vòng và dữ liệu làm mới OAuth được chủ ý loại khỏi cơ chế phân giải SecretRef chỉ đọc.
</Note>

## Hành vi bắt buộc và thứ tự ưu tiên

- Trường không có tham chiếu: không đổi.
- Trường có tham chiếu: bắt buộc trên các bề mặt đang hoạt động trong khi kích hoạt.
- Nếu có cả văn bản thuần và tham chiếu, tham chiếu được ưu tiên trên các đường dẫn ưu tiên được hỗ trợ.
- Chỉ báo biên tập lại `__OPENCLAW_REDACTED__` được dành riêng cho biên tập lại/khôi phục cấu hình nội bộ và bị từ chối nếu được gửi làm dữ liệu cấu hình dạng literal.

Tín hiệu cảnh báo và kiểm toán:

- `SECRETS_REF_OVERRIDES_PLAINTEXT` (cảnh báo thời gian chạy)
- `REF_SHADOWED` (phát hiện kiểm toán khi thông tin xác thực trong `auth-profiles.json` được ưu tiên hơn tham chiếu trong `openclaw.json`)

Hành vi tương thích Google Chat:

- `serviceAccountRef` được ưu tiên hơn `serviceAccount` dạng văn bản thuần.
- Giá trị văn bản thuần bị bỏ qua khi tham chiếu cùng cấp được đặt.

## Bộ kích hoạt kích hoạt

Kích hoạt bí mật chạy khi:

- Khởi động (kiểm tra trước cộng với kích hoạt cuối cùng)
- Đường dẫn áp dụng nóng khi tải lại cấu hình
- Đường dẫn kiểm tra khởi động lại khi tải lại cấu hình
- Tải lại thủ công qua `secrets.reload`
- Kiểm tra trước RPC ghi cấu hình Gateway (`config.set` / `config.apply` / `config.patch`) để đảm bảo SecretRef trên bề mặt hoạt động có thể phân giải trong tải trọng cấu hình đã gửi trước khi lưu các chỉnh sửa

Hợp đồng kích hoạt:

- Thành công sẽ hoán đổi snapshot một cách nguyên tử.
- Lỗi khởi động sẽ hủy khởi động gateway.
- Lỗi tải lại trong thời gian chạy giữ snapshot tốt đã biết gần nhất.
- Lỗi kiểm tra trước write-RPC từ chối cấu hình đã gửi và giữ nguyên cả cấu hình trên đĩa lẫn snapshot thời gian chạy đang hoạt động.
- Việc cung cấp token kênh theo từng lệnh gọi rõ ràng cho một lệnh gọi helper/công cụ gửi đi không kích hoạt SecretRef; các điểm kích hoạt vẫn là khởi động, tải lại và `secrets.reload` rõ ràng.

## Tín hiệu suy giảm và phục hồi

Khi kích hoạt lúc tải lại thất bại sau một trạng thái khỏe mạnh, OpenClaw đi vào trạng thái bí mật suy giảm.

Sự kiện hệ thống một lần và mã nhật ký:

- `SECRETS_RELOADER_DEGRADED`
- `SECRETS_RELOADER_RECOVERED`

Hành vi:

- Suy giảm: thời gian chạy giữ snapshot tốt đã biết gần nhất.
- Phục hồi: được phát một lần sau lần kích hoạt thành công tiếp theo.
- Các lỗi lặp lại khi đã suy giảm sẽ ghi cảnh báo nhưng không gửi sự kiện dồn dập.
- Khởi động thất bại nhanh không phát sự kiện suy giảm vì thời gian chạy chưa từng trở nên hoạt động.

## Phân giải đường dẫn lệnh

Đường dẫn lệnh có thể chọn dùng cơ chế phân giải SecretRef được hỗ trợ qua RPC snapshot gateway.

Có hai nhóm hành vi rộng:

<Tabs>
  <Tab title="Đường dẫn lệnh nghiêm ngặt">
    Ví dụ các đường dẫn bộ nhớ từ xa `openclaw memory` và `openclaw qr --remote` khi cần tham chiếu shared-secret từ xa. Chúng đọc từ snapshot đang hoạt động và thất bại nhanh khi SecretRef bắt buộc không khả dụng.
  </Tab>
  <Tab title="Đường dẫn lệnh chỉ đọc">
    Ví dụ `openclaw status`, `openclaw status --all`, `openclaw channels status`, `openclaw channels resolve`, `openclaw security audit`, và các luồng sửa chữa doctor/cấu hình chỉ đọc. Chúng cũng ưu tiên snapshot đang hoạt động, nhưng suy giảm thay vì hủy khi một SecretRef được nhắm mục tiêu không khả dụng trong đường dẫn lệnh đó.

    Hành vi chỉ đọc:

    - Khi gateway đang chạy, các lệnh này đọc từ snapshot đang hoạt động trước.
    - Nếu phân giải Gateway không hoàn chỉnh hoặc Gateway không khả dụng, chúng thử fallback cục bộ được nhắm mục tiêu cho bề mặt lệnh cụ thể.
    - Nếu một SecretRef được nhắm mục tiêu vẫn không khả dụng, lệnh tiếp tục với đầu ra chỉ đọc suy giảm và chẩn đoán rõ ràng như "đã cấu hình nhưng không khả dụng trong đường dẫn lệnh này".
    - Hành vi suy giảm này chỉ cục bộ theo lệnh. Nó không làm yếu các đường dẫn khởi động, tải lại, hoặc gửi/xác thực trong thời gian chạy.

  </Tab>
</Tabs>

Ghi chú khác:

- Làm mới snapshot sau khi bí mật backend xoay vòng được xử lý bằng `openclaw secrets reload`.
- Phương thức RPC Gateway được các đường dẫn lệnh này dùng: `secrets.resolve`.

## Quy trình kiểm toán và cấu hình

Luồng mặc định cho toán tử:

<Steps>
  <Step title="Kiểm toán trạng thái hiện tại">
    ```bash
    openclaw secrets audit --check
    ```
  </Step>
  <Step title="Cấu hình SecretRef">
    ```bash
    openclaw secrets configure
    ```
  </Step>
  <Step title="Kiểm toán lại">
    ```bash
    openclaw secrets audit --check
    ```
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="secrets audit">
    Các phát hiện bao gồm:

    - giá trị văn bản thuần khi lưu trữ (`openclaw.json`, `auth-profiles.json`, `.env`, và `agents/*/agent/models.json` đã tạo)
    - phần dư header nhà cung cấp nhạy cảm dạng văn bản thuần trong các mục `models.json` đã tạo
    - tham chiếu chưa phân giải
    - che khuất ưu tiên (`auth-profiles.json` được ưu tiên hơn tham chiếu trong `openclaw.json`)
    - phần dư cũ (`auth.json`, nhắc nhở OAuth)

    Ghi chú exec:

    - Theo mặc định, kiểm toán bỏ qua các kiểm tra khả năng phân giải SecretRef exec để tránh tác dụng phụ của lệnh.
    - Dùng `openclaw secrets audit --allow-exec` để thực thi nhà cung cấp exec trong khi kiểm toán.

    Ghi chú phần dư header:

    - Phát hiện header nhà cung cấp nhạy cảm dựa trên heuristic tên (tên header xác thực/thông tin xác thực phổ biến và các đoạn như `authorization`, `x-api-key`, `token`, `secret`, `password`, và `credential`).

  </Accordion>
  <Accordion title="secrets configure">
    Helper tương tác có chức năng:

    - cấu hình `secrets.providers` trước (`env`/`file`/`exec`, thêm/sửa/xóa)
    - cho phép bạn chọn các trường mang bí mật được hỗ trợ trong `openclaw.json` cộng với `auth-profiles.json` cho một phạm vi agent
    - có thể tạo ánh xạ `auth-profiles.json` mới trực tiếp trong bộ chọn mục tiêu
    - thu thập chi tiết SecretRef (`source`, `provider`, `id`)
    - chạy phân giải kiểm tra trước
    - có thể áp dụng ngay lập tức

    Ghi chú exec:

    - Kiểm tra trước bỏ qua các kiểm tra SecretRef exec trừ khi `--allow-exec` được đặt.
    - Nếu bạn áp dụng trực tiếp từ `configure --apply` và kế hoạch có tham chiếu/nhà cung cấp exec, hãy giữ `--allow-exec` được đặt cho cả bước áp dụng.

    Chế độ hữu ích:

    - `openclaw secrets configure --providers-only`
    - `openclaw secrets configure --skip-provider-setup`
    - `openclaw secrets configure --agent <id>`

    Mặc định áp dụng của `configure`:

    - loại bỏ thông tin xác thực tĩnh khớp khỏi `auth-profiles.json` cho các nhà cung cấp được nhắm mục tiêu
    - loại bỏ các mục `api_key` tĩnh cũ khỏi `auth.json`
    - loại bỏ các dòng bí mật đã biết khớp khỏi `<config-dir>/.env`

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

    - dry-run bỏ qua kiểm tra exec trừ khi `--allow-exec` được đặt.
    - chế độ ghi từ chối các kế hoạch chứa SecretRef/nhà cung cấp exec trừ khi `--allow-exec` được đặt.

    Để biết chi tiết hợp đồng mục tiêu/đường dẫn nghiêm ngặt và quy tắc từ chối chính xác, xem [Hợp đồng kế hoạch áp dụng bí mật](/vi/gateway/secrets-plan-contract).

  </Accordion>
</AccordionGroup>

## Chính sách an toàn một chiều

<Warning>
OpenClaw chủ ý không ghi bản sao lưu rollback chứa giá trị bí mật văn bản thuần trong lịch sử.
</Warning>

Mô hình an toàn:

- kiểm tra trước phải thành công trước chế độ ghi
- kích hoạt thời gian chạy được xác thực trước khi commit
- apply cập nhật tệp bằng thay thế tệp nguyên tử và khôi phục nỗ lực tối đa khi thất bại

## Ghi chú tương thích xác thực cũ

Đối với thông tin xác thực tĩnh, thời gian chạy không còn phụ thuộc vào lưu trữ xác thực cũ dạng văn bản thuần.

- Nguồn thông tin xác thực thời gian chạy là snapshot trong bộ nhớ đã phân giải.
- Các mục `api_key` tĩnh cũ được loại bỏ khi được phát hiện.
- Hành vi tương thích liên quan đến OAuth vẫn tách biệt.

## Ghi chú giao diện web

Một số union SecretInput dễ cấu hình trong chế độ trình chỉnh sửa thô hơn chế độ biểu mẫu.

## Liên quan

- [Xác thực](/vi/gateway/authentication) — thiết lập xác thực
- [CLI: secrets](/vi/cli/secrets) — lệnh CLI
- [Biến môi trường](/vi/help/environment) — thứ tự ưu tiên môi trường
- [Bề mặt thông tin xác thực SecretRef](/vi/reference/secretref-credential-surface) — bề mặt thông tin xác thực
- [Hợp đồng kế hoạch áp dụng bí mật](/vi/gateway/secrets-plan-contract) — chi tiết hợp đồng kế hoạch
- [Bảo mật](/vi/gateway/security) — tư thế bảo mật
