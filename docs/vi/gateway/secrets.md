---
read_when:
    - Cấu hình SecretRefs cho thông tin xác thực của nhà cung cấp và các tham chiếu `auth-profiles.json`
    - Vận hành việc tải lại, kiểm tra, cấu hình và áp dụng bí mật một cách an toàn trong môi trường sản xuất
    - Tìm hiểu cơ chế dừng ngay khi khởi động thất bại, lọc các bề mặt không hoạt động và hành vi sử dụng trạng thái tốt gần nhất đã biết
sidebarTitle: Secrets management
summary: 'Quản lý bí mật: hợp đồng SecretRef, hành vi ảnh chụp nhanh khi chạy và việc xóa an toàn một chiều'
title: Quản lý bí mật
x-i18n:
    generated_at: "2026-07-16T14:33:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 9fbcac081a7b9bd8bc298b9fb2b7437f3bea4dad85338eed7db4cb4db051cfc7
    source_path: gateway/secrets.md
    workflow: 16
---

OpenClaw hỗ trợ SecretRef theo cơ chế bổ sung để thông tin xác thực được hỗ trợ không cần tồn tại dưới dạng văn bản thuần trong cấu hình.

<Note>
Văn bản thuần vẫn hoạt động. SecretRef là tùy chọn cho từng thông tin xác thực.
</Note>

<Warning>
Thông tin xác thực dạng văn bản thuần vẫn có thể được tác nhân đọc nếu nằm trong các tệp mà tác nhân có thể kiểm tra, bao gồm `openclaw.json`, `auth-profiles.json`, `.env` hoặc các tệp `agents/*/agent/models.json` được tạo. SecretRef chỉ giảm phạm vi ảnh hưởng cục bộ đó sau khi mọi thông tin xác thực được hỗ trợ đã được di chuyển và `openclaw secrets audit --check` báo cáo không còn dấu vết văn bản thuần.
</Warning>

## Mô hình thời gian chạy

- Bí mật được phân giải vào một ảnh chụp nhanh thời gian chạy trong bộ nhớ, theo cách chủ động trong quá trình kích hoạt, không phải theo cách trì hoãn trên các đường dẫn yêu cầu.
- Quá trình khởi động thất bại ngay lập tức khi không thể phân giải một SecretRef thực sự đang hoạt động.
- Tải lại là một thao tác hoán đổi nguyên tử: thành công hoàn toàn hoặc giữ lại ảnh chụp nhanh hoạt động tốt gần nhất.
- Các vi phạm chính sách (ví dụ: hồ sơ xác thực ở chế độ OAuth được kết hợp với đầu vào SecretRef) khiến quá trình kích hoạt thất bại trước khi hoán đổi thời gian chạy.
- Các yêu cầu thời gian chạy chỉ đọc ảnh chụp nhanh đang hoạt động trong bộ nhớ. Thông tin xác thực SecretRef của nhà cung cấp mô hình đi qua kho lưu trữ xác thực và các tùy chọn luồng dưới dạng giá trị canh gác cục bộ theo tiến trình cho đến khi truyền ra ngoài. Các đường dẫn phân phối ra ngoài (phân phối phản hồi/luồng Discord, gửi hành động Telegram) cũng đọc ảnh chụp nhanh đó và không phân giải lại tham chiếu cho mỗi lần gửi.

Điều này giúp sự cố ngừng hoạt động của nhà cung cấp bí mật không ảnh hưởng đến các đường dẫn yêu cầu nóng.

## Chèn tại thời điểm truyền ra ngoài (giá trị canh gác)

Đối với thông tin xác thực của nhà cung cấp mô hình được hỗ trợ bởi SecretRef, OpenClaw tạo một giá trị canh gác mờ đục, cục bộ theo tiến trình trong quá trình phân giải xác thực mô hình. Do đó, kho lưu trữ xác thực, các tùy chọn luồng, cấu hình SDK, nhật ký, đối tượng lỗi và phần lớn hoạt động kiểm tra nội bộ thời gian chạy sẽ thấy một giá trị như `oc-sent-v1-...`, chứ không phải thông tin xác thực của nhà cung cấp. Lệnh tìm nạp mô hình được bảo vệ và các phép dò tình trạng của nhà cung cấp cục bộ được quản lý sẽ thay thế các giá trị canh gác đã biết trong URL và giá trị tiêu đề ngay trước khi mỗi yêu cầu rời khỏi tiến trình.

Các giá trị có hình dạng giá trị canh gác nhưng không xác định sẽ bị từ chối an toàn trước khi có hoạt động mạng. OpenClaw từ chối gửi yêu cầu thay vì chuyển tiếp một giá trị canh gác chưa được phân giải đến nhà cung cấp. Các giá trị bí mật đã phân giải cũng được đăng ký để che thông tin trong nhật ký theo giá trị khớp chính xác như một biện pháp phòng vệ nhiều lớp.

Bộ điều hợp nhà cung cấp sử dụng điểm chèn muộn nhất mà SDK của chúng hỗ trợ:

- Các SDK có tùy chọn tìm nạp tùy chỉnh nhận lệnh tìm nạp được bảo vệ của OpenClaw, vì vậy SDK giữ lại giá trị canh gác.
- Các SDK không có tùy chọn tìm nạp tùy chỉnh sẽ mở gói giá trị canh gác ngay trước khi khởi tạo máy khách. Các luồng nhà cung cấp do Plugin sở hữu và bộ khung tác nhân mở gói tại điểm bàn giao cuối cùng do lõi sở hữu vì các phương thức truyền tải đó không dùng chung lệnh tìm nạp được bảo vệ của OpenClaw.

Giá trị canh gác làm giảm mức độ lộ văn bản thuần trong chuỗi gọi mô hình, nhưng không tạo ra sự cô lập tiến trình. Giá trị thực vẫn tồn tại trong bộ nhớ của cùng tiến trình và xuất hiện tại ranh giới bộ điều hợp cuối cùng. Thông tin xác thực môi trường dạng thuần không được cấu hình thông qua SecretRef vẫn ở dạng văn bản thuần và nằm ngoài cơ chế này.

Đặt `OPENCLAW_SECRET_SENTINELS=off` (cũng chấp nhận `0` hoặc `false`, không phân biệt chữ hoa chữ thường) để vô hiệu hóa việc tạo giá trị canh gác trong quá trình ứng phó sự cố hoặc khắc phục sự cố tương thích. Công tắc ngắt không vô hiệu hóa việc đăng ký che thông tin theo giá trị khớp chính xác.

## Ranh giới truy cập của tác nhân

SecretRef ngăn thông tin xác thực được lưu cố định trong cấu hình và các tệp mô hình được tạo, nhưng không phải là ranh giới cô lập tiến trình. Thông tin xác thực dạng văn bản thuần còn lại trên đĩa tại một đường dẫn mà tác nhân có thể đọc vẫn có thể được đọc qua công cụ tệp hoặc shell, qua đó bỏ qua việc che thông tin ở cấp API.

Đối với các bản triển khai sản xuất có bao gồm các tệp mà tác nhân có thể truy cập, chỉ coi quá trình di chuyển là hoàn tất khi tất cả các điều sau đều đúng:

- Thông tin xác thực được hỗ trợ sử dụng SecretRef thay cho giá trị văn bản thuần.
- Dấu vết văn bản thuần cũ được xóa khỏi `openclaw.json`, `auth-profiles.json`, `.env` và các tệp `models.json` được tạo.
- `openclaw secrets audit --check` không phát hiện vấn đề sau khi di chuyển.
- Mọi thông tin xác thực còn lại chưa được hỗ trợ hoặc đang luân chuyển đều được bảo vệ bằng cơ chế cô lập của hệ điều hành, cô lập vùng chứa hoặc proxy thông tin xác thực bên ngoài.

Đây là lý do quy trình kiểm tra/cấu hình/áp dụng là một cổng kiểm soát di chuyển bảo mật, không chỉ là một trình trợ giúp tiện lợi.

<Warning>
SecretRef không làm cho các tệp tùy ý có thể đọc trở nên an toàn. Các bản sao lưu, cấu hình đã sao chép, danh mục mô hình cũ được tạo và các lớp thông tin xác thực chưa được hỗ trợ vẫn là bí mật sản xuất cho đến khi bị xóa, chuyển ra ngoài ranh giới tin cậy của tác nhân hoặc được cô lập riêng.
</Warning>

## Lọc bề mặt đang hoạt động

SecretRef chỉ được xác thực trên các bề mặt thực sự đang hoạt động:

- **Bề mặt đã bật**: tham chiếu chưa được phân giải sẽ chặn quá trình khởi động/tải lại.
- **Bề mặt không hoạt động**: tham chiếu chưa được phân giải không chặn quá trình khởi động/tải lại; chúng phát ra chẩn đoán `SECRETS_REF_IGNORED_INACTIVE_SURFACE` không nghiêm trọng.

<Accordion title="Ví dụ về các bề mặt không hoạt động">
- Các mục kênh/tài khoản đã bị vô hiệu hóa.
- Thông tin xác thực kênh cấp cao nhất không được bất kỳ tài khoản đã bật nào kế thừa.
- Các bề mặt công cụ/tính năng đã bị vô hiệu hóa.
- Các khóa dành riêng cho nhà cung cấp tìm kiếm web không được `tools.web.search.provider` chọn. Ở chế độ tự động (chưa đặt nhà cung cấp), các khóa được kiểm tra theo thứ tự ưu tiên để tự động phát hiện cho đến khi phân giải được một khóa; sau khi lựa chọn, khóa của các nhà cung cấp không được chọn sẽ không hoạt động.
- Tài liệu xác thực SSH của hộp cát (`agents.defaults.sandbox.ssh.identityData`, `certificateData`, `knownHostsData`, cùng các giá trị ghi đè theo tác nhân) chỉ hoạt động khi phần phụ trợ hộp cát có hiệu lực là `ssh` và chế độ hộp cát không phải `off`, đối với tác nhân mặc định hoặc một tác nhân đã bật.
- SecretRef `gateway.remote.token` / `gateway.remote.password` hoạt động nếu bất kỳ điều kiện nào sau đây đúng:
  - `gateway.mode=remote`
  - `gateway.remote.url` đã được cấu hình
  - `gateway.tailscale.mode` là `serve` hoặc `funnel`
  - Ở chế độ cục bộ không có các bề mặt từ xa đó: `gateway.remote.token` hoạt động khi xác thực bằng token có thể được ưu tiên và chưa cấu hình token môi trường/xác thực; `gateway.remote.password` chỉ hoạt động khi xác thực bằng mật khẩu có thể được ưu tiên và chưa cấu hình mật khẩu môi trường/xác thực.
- SecretRef `gateway.auth.token` không hoạt động đối với việc phân giải xác thực khi khởi động nếu đã đặt `OPENCLAW_GATEWAY_TOKEN`, vì đầu vào token môi trường được ưu tiên cho thời gian chạy đó.

</Accordion>

## Chẩn đoán bề mặt xác thực Gateway

Khi SecretRef được đặt trên `gateway.auth.token`, `gateway.auth.password`, `gateway.remote.token` hoặc `gateway.remote.password`, quá trình khởi động/tải lại Gateway ghi lại trạng thái bề mặt dưới mã `SECRETS_GATEWAY_AUTH_SURFACE`:

- `active`: SecretRef là một phần của bề mặt xác thực có hiệu lực và phải được phân giải.
- `inactive`: một bề mặt xác thực khác được ưu tiên hoặc xác thực từ xa bị vô hiệu hóa/không hoạt động.

Mục nhật ký bao gồm lý do mà chính sách bề mặt hoạt động đã sử dụng.

## Kiểm tra trước tham chiếu khi thiết lập ban đầu

Trong quá trình thiết lập ban đầu tương tác, việc chọn lưu trữ SecretRef sẽ chạy quy trình xác thực trước khi lưu:

- Tham chiếu môi trường: xác thực tên biến môi trường và xác nhận rằng một giá trị không rỗng hiển thị trong quá trình thiết lập.
- Tham chiếu nhà cung cấp (`file` hoặc `exec`): xác thực lựa chọn nhà cung cấp, phân giải `id` và kiểm tra kiểu của giá trị đã phân giải.
- Luồng bắt đầu nhanh: khi `gateway.auth.token` đã là một SecretRef, quá trình thiết lập ban đầu sẽ phân giải nó trước khi khởi tạo phép dò/bảng điều khiển (đối với các tham chiếu `env`, `file` và `exec`) bằng cùng cổng kiểm soát thất bại nhanh.

Khi xác thực thất bại, lỗi sẽ được hiển thị và bạn có thể thử lại.

## Hợp đồng SecretRef

Một dạng đối tượng duy nhất ở mọi nơi:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

<Tabs>
  <Tab title="env">
    ```json5
    { source: "env", provider: "default", id: "OPENAI_API_KEY" }
    ```

    Các chuỗi viết tắt cũng được chấp nhận trong các trường SecretInput:

    ```json5
    "${OPENAI_API_KEY}"
    "$OPENAI_API_KEY"
    ```

    Quy tắc xác thực:

    - `provider` phải khớp với `^[a-z][a-z0-9_-]{0,63}$`
    - `id` phải khớp với `^[A-Z][A-Z0-9_]{0,127}$`

  </Tab>
  <Tab title="file">
    ```json5
    { source: "file", provider: "filemain", id: "/providers/openai/apiKey" }
    ```

    Quy tắc xác thực:

    - `provider` phải khớp với `^[a-z][a-z0-9_-]{0,63}$`
    - `id` phải là một con trỏ JSON tuyệt đối (`/...`) hoặc giá trị cố định `value` đối với các nhà cung cấp `singleValue`
    - Cách thoát ký tự RFC 6901 trong các phân đoạn: `~` trở thành `~0`, `/` trở thành `~1`

  </Tab>
  <Tab title="exec">
    ```json5
    { source: "exec", provider: "vault", id: "providers/openai/apiKey#value" }
    ```

    Quy tắc xác thực:

    - `provider` phải khớp với `^[a-z][a-z0-9_-]{0,63}$`
    - `id` phải khớp với `^[A-Za-z0-9][A-Za-z0-9._:/#-]{0,255}$` (hỗ trợ các bộ chọn như `secret#json_key`)
    - `id` không được chứa `.` hoặc `..` dưới dạng các phân đoạn đường dẫn được phân tách bằng dấu gạch chéo (ví dụ: `a/../b` bị từ chối)

  </Tab>
</Tabs>

## Cấu hình nhà cung cấp

Định nghĩa nhà cung cấp trong `secrets.providers`:

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

<Accordion title="Nhà cung cấp môi trường">
- Danh sách cho phép tùy chọn gồm các tên khớp chính xác thông qua `allowlist`.
- Giá trị môi trường bị thiếu hoặc rỗng khiến quá trình phân giải thất bại.

</Accordion>

<Accordion title="Nhà cung cấp tệp">
- Đọc tệp cục bộ tại `path`.
- `mode: "json"` (mặc định) yêu cầu tải trọng là đối tượng JSON và phân giải `id` dưới dạng con trỏ JSON.
- `mode: "singleValue"` yêu cầu mã định danh tham chiếu `"value"` và trả về nội dung tệp thô (đã loại bỏ ký tự xuống dòng ở cuối).
- Đường dẫn phải vượt qua các bước kiểm tra quyền sở hữu/quyền truy cập; `timeoutMs` (mặc định 5000) và `maxBytes` (mặc định 1 MiB) giới hạn thao tác đọc.
- Từ chối an toàn trên Windows: nếu không thể xác minh ACL cho đường dẫn, quá trình phân giải sẽ thất bại. Chỉ đối với các đường dẫn đáng tin cậy, hãy đặt `allowInsecurePath: true` trên nhà cung cấp đó để bỏ qua bước kiểm tra.

</Accordion>

<Accordion title="Nhà cung cấp exec">
- Chạy trực tiếp đường dẫn tuyệt đối của tệp nhị phân đã cấu hình, không qua shell.
- Theo mặc định, `command` phải là tệp thông thường, không phải liên kết tượng trưng. Đặt `allowSymlinkCommand: true` để cho phép đường dẫn lệnh là liên kết tượng trưng (ví dụ: shim của Homebrew), đồng thời kết hợp với `trustedDirs` (ví dụ: `["/opt/homebrew"]`) để chỉ các đường dẫn của trình quản lý gói mới đủ điều kiện.
- Hỗ trợ `timeoutMs` (mặc định 5000), `noOutputTimeoutMs` (mặc định bằng `timeoutMs`), `maxOutputBytes` (mặc định 1 MiB), danh sách cho phép `env`/`passEnv` và `trustedDirs`.
- `jsonOnly` mặc định là `true`. Khi có `jsonOnly: false` và chỉ yêu cầu một id, stdout thuần không phải JSON được chấp nhận làm giá trị của id đó.
- Windows đóng khi lỗi: nếu không thể xác minh ACL cho đường dẫn lệnh, quá trình phân giải sẽ thất bại. Chỉ với các đường dẫn đáng tin cậy, hãy đặt `allowInsecurePath: true` trên nhà cung cấp đó để bỏ qua bước kiểm tra.
- Các nhà cung cấp exec do Plugin quản lý có thể dùng `pluginIntegration` thay cho bản sao `command`/`args`. OpenClaw phân giải thông tin chi tiết hiện tại của lệnh từ manifest Plugin đã cài đặt trong lúc khởi động/tải lại; nếu Plugin bị vô hiệu hóa, gỡ bỏ, không đáng tin cậy hoặc không còn khai báo tích hợp, các SecretRef đang hoạt động trên nhà cung cấp đó sẽ đóng khi lỗi.

Payload yêu cầu (stdin):

```json
{ "protocolVersion": 1, "provider": "vault", "ids": ["providers/openai/apiKey"] }
```

Payload phản hồi (stdout):

```jsonc
{ "protocolVersion": 1, "values": { "providers/openai/apiKey": "<openai-api-key>" } } // pragma: bí mật trong danh sách cho phép
```

Lỗi tùy chọn theo từng id:

```json
{
  "protocolVersion": 1,
  "values": {},
  "errors": { "providers/openai/apiKey": { "code": "NOT_FOUND" } }
}
```

`code` là thông tin chẩn đoán tùy chọn mà máy có thể đọc được. OpenClaw hiển thị các
mã được nhận dạng `NOT_FOUND` và `AMBIGUOUS_DUPLICATE_KEY` cùng với nhà cung cấp và id tham chiếu. Các
mã khác và trường dạng tự do như `message` được chấp nhận để tương thích với giao thức v1
nhưng không được hiển thị vì đầu ra của trình phân giải có thể chứa dữ liệu thông tin xác thực.

</Accordion>

## Khóa API được lưu trong tệp

Không đặt chuỗi `file:...` trong khối `env` của cấu hình. Khối đó là giá trị nguyên văn và không ghi đè, vì vậy `file:...` không bao giờ được phân giải tại đó.

Thay vào đó, hãy dùng SecretRef dạng tệp trên một trường thông tin xác thực được hỗ trợ:

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

Đối với `mode: "singleValue"`, `id` của SecretRef là `"value"`. Đối với `mode: "json"`, hãy dùng con trỏ JSON tuyệt đối như `"/providers/xai/apiKey"`.

Xem [Bề mặt thông tin xác thực SecretRef](/vi/reference/secretref-credential-surface) để biết các trường chấp nhận SecretRef.

## Ví dụ tích hợp exec

Để xem hướng dẫn riêng về 1Password, bao gồm tài khoản dịch vụ, skill tác nhân đi kèm và cách khắc phục sự cố, hãy xem [1Password](/gateway/1password).

<AccordionGroup>
  <Accordion title="CLI 1Password">
    ```json5
    {
      secrets: {
        providers: {
          onepassword_openai: {
            source: "exec",
            command: "/opt/homebrew/bin/op",
            allowSymlinkCommand: true, // bắt buộc đối với tệp nhị phân được Homebrew liên kết tượng trưng
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
    Dùng trình bao bọc trình phân giải để ánh xạ các id SecretRef tới khóa mục của Bitwarden Secrets Manager. Kho mã nguồn có kèm `scripts/secrets/openclaw-bws-resolver.mjs`; hãy cài đặt hoặc sao chép tệp này tới một đường dẫn tuyệt đối đáng tin cậy trên máy chủ chạy Gateway.

    Yêu cầu:

    - CLI Bitwarden Secrets Manager (`bws`) được cài đặt trên máy chủ Gateway.
    - `BWS_ACCESS_TOKEN` khả dụng cho dịch vụ Gateway.
    - `PATH` được truyền cho trình phân giải, hoặc `BWS_BIN` được đặt thành đường dẫn tuyệt đối của tệp nhị phân `bws`.
    - `BWS_SERVER_URL` được đặt trong môi trường khi dùng phiên bản Bitwarden tự lưu trữ.

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

    Trình phân giải xử lý hàng loạt các id được yêu cầu, chạy `bws secret list` và trả về giá trị cho các trường `key` của bí mật khớp. Hãy dùng khóa đáp ứng hợp đồng id SecretRef exec, chẳng hạn như `openclaw/providers/openai/apiKey`; các khóa kiểu biến môi trường có dấu gạch dưới sẽ bị từ chối trước khi trình phân giải chạy. Nếu có nhiều bí mật Bitwarden hiển thị cùng dùng khóa được yêu cầu, trình phân giải sẽ báo id đó là không rõ ràng thay vì phỏng đoán. Sau khi cập nhật cấu hình, hãy xác minh đường dẫn trình phân giải:

    ```bash
    openclaw secrets audit --allow-exec
    ```

  </Accordion>
  <Accordion title="CLI HashiCorp Vault">
    ```json5
    {
      secrets: {
        providers: {
          vault_openai: {
            source: "exec",
            command: "/opt/homebrew/bin/vault",
            allowSymlinkCommand: true, // bắt buộc đối với tệp nhị phân được Homebrew liên kết tượng trưng
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
    Dùng một trình bao bọc trình phân giải nhỏ để ánh xạ trực tiếp các id SecretRef tới mục `pass`. Lưu tệp này dưới dạng tệp thực thi tại một đường dẫn tuyệt đối vượt qua các bước kiểm tra đường dẫn của nhà cung cấp exec, ví dụ `/usr/local/bin/openclaw-pass-resolver`. Dòng shebang `#!/usr/bin/env node` phân giải `node` từ `PATH` của tiến trình trình phân giải, vì vậy hãy đưa `PATH` vào `passEnv`. Nếu `pass` không nằm trên `PATH` đó, hãy đặt `PASS_BIN` trong môi trường cha và cũng đưa nó vào `passEnv`:

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
        process.stderr.write(`Không thể phân tích cú pháp yêu cầu: ${err.message}\n`);
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
          errors[id] = { message: (result.stderr || `pass đã thoát với trạng thái ${result.status}`).trim() };
        }
      }

      process.stdout.write(JSON.stringify({ protocolVersion: 1, values, errors }));
    });
    ```

    Sau đó, hãy cấu hình nhà cung cấp exec và trỏ `apiKey` tới đường dẫn mục `pass`:

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

    Giữ bí mật ở dòng đầu tiên của mục `pass`, hoặc tùy chỉnh trình bao bọc để trả về toàn bộ đầu ra `pass show`. Sau khi cập nhật cấu hình, hãy xác minh cả quá trình kiểm tra tĩnh và đường dẫn trình phân giải exec:

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
            allowSymlinkCommand: true, // bắt buộc đối với tệp nhị phân được Homebrew liên kết tượng trưng
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

## Biến môi trường của máy chủ MCP

Các biến môi trường của máy chủ MCP được cấu hình qua `plugins.entries.acpx.config.mcpServers` chấp nhận SecretInput, giúp khóa API và token không xuất hiện trong cấu hình văn bản thuần:

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

Các giá trị chuỗi văn bản thuần vẫn hoạt động. Các tham chiếu mẫu môi trường như `${MCP_SERVER_API_KEY}` và đối tượng SecretRef được phân giải trong quá trình kích hoạt Gateway, trước khi tiến trình máy chủ MCP được khởi chạy. Tương tự các bề mặt SecretRef khác, tham chiếu chưa phân giải chỉ chặn việc kích hoạt khi Plugin `acpx` thực sự đang hoạt động.

## Dữ liệu xác thực SSH của sandbox

Phần phụ trợ sandbox `ssh` cốt lõi cũng hỗ trợ SecretRef cho dữ liệu xác thực SSH:

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

Hành vi khi chạy:

- OpenClaw phân giải các tham chiếu này trong quá trình kích hoạt sandbox, không phân giải trì hoãn trên mỗi lệnh gọi SSH.
- Các giá trị đã phân giải được ghi vào một thư mục tạm với quyền truy cập tệp hạn chế (`0o600`) và được dùng trong cấu hình SSH đã tạo.
- Nếu phần phụ trợ sandbox có hiệu lực không phải là `ssh` (hoặc chế độ sandbox là `off`), các tham chiếu này vẫn ở trạng thái không hoạt động và không cản trở quá trình khởi động.

## Phạm vi thông tin xác thực được hỗ trợ

Các thông tin xác thực chính tắc được hỗ trợ và không được hỗ trợ được liệt kê trong [Phạm vi thông tin xác thực SecretRef](/vi/reference/secretref-credential-surface).

<Note>
Thông tin xác thực được tạo trong thời gian chạy hoặc được luân phiên, cùng dữ liệu làm mới OAuth, được chủ ý loại trừ khỏi quá trình phân giải SecretRef chỉ đọc.
</Note>

## Hành vi bắt buộc và thứ tự ưu tiên

- Trường không có tham chiếu: không thay đổi.
- Trường có tham chiếu: bắt buộc trên các bề mặt đang hoạt động trong quá trình kích hoạt.
- Nếu có cả văn bản thuần và tham chiếu, tham chiếu được ưu tiên trên các đường dẫn ưu tiên được hỗ trợ.
- Giá trị đánh dấu biên tập `__OPENCLAW_REDACTED__` được dành riêng cho việc biên tập/khôi phục cấu hình nội bộ và bị từ chối nếu được gửi dưới dạng dữ liệu cấu hình theo nghĩa đen.

Các tín hiệu cảnh báo và kiểm tra:

- `SECRETS_REF_OVERRIDES_PLAINTEXT` (cảnh báo khi chạy)
- `REF_SHADOWED` (phát hiện kiểm tra khi thông tin xác thực `auth-profiles.json` được ưu tiên hơn các tham chiếu `openclaw.json`)

Khả năng tương thích với Google Chat: `serviceAccountRef` được ưu tiên hơn `serviceAccount` dạng văn bản thuần; giá trị văn bản thuần bị bỏ qua sau khi tham chiếu cùng cấp được đặt.

## Các tác nhân kích hoạt

Việc kích hoạt bí mật chạy khi:

- Khởi động (kiểm tra sơ bộ cộng với kích hoạt cuối cùng)
- Đường dẫn áp dụng nóng khi tải lại cấu hình
- Đường dẫn kiểm tra khởi động lại khi tải lại cấu hình
- Tải lại thủ công qua `secrets.reload`
- Kiểm tra sơ bộ RPC ghi cấu hình Gateway (`config.set` / `config.apply` / `config.patch`), kiểm tra khả năng phân giải SecretRef trên bề mặt đang hoạt động trong tải trọng cấu hình được gửi trước khi lưu các chỉnh sửa

Hợp đồng kích hoạt:

- Khi thành công, ảnh chụp nhanh được thay thế nguyên tử.
- Lỗi khởi động sẽ hủy quá trình khởi động Gateway.
- Lỗi tải lại khi chạy sẽ giữ lại ảnh chụp nhanh tốt gần nhất đã biết.
- Lỗi kiểm tra sơ bộ RPC ghi sẽ từ chối cấu hình được gửi; cả cấu hình trên đĩa và ảnh chụp nhanh đang hoạt động khi chạy đều không thay đổi.
- Việc cung cấp mã thông báo kênh rõ ràng cho từng lệnh gọi đến một lệnh gọi trình trợ giúp/công cụ gửi đi không kích hoạt SecretRef; các điểm kích hoạt vẫn là khởi động, tải lại và `secrets.reload` rõ ràng.

## Tín hiệu suy giảm và phục hồi

Khi kích hoạt trong lúc tải lại thất bại sau một trạng thái bình thường, OpenClaw chuyển sang trạng thái bí mật suy giảm, phát ra các sự kiện hệ thống một lần và mã nhật ký:

- `SECRETS_RELOADER_DEGRADED`
- `SECRETS_RELOADER_RECOVERED`

Hành vi:

- Suy giảm: thời gian chạy giữ lại ảnh chụp nhanh tốt gần nhất đã biết.
- Phục hồi: được phát một lần sau lần kích hoạt thành công tiếp theo.
- Các lỗi lặp lại khi đã ở trạng thái suy giảm sẽ ghi cảnh báo nhưng không phát lại sự kiện.
- Khởi động thất bại nhanh không bao giờ phát sự kiện suy giảm vì thời gian chạy chưa từng trở thành hoạt động.

## Phân giải đường dẫn lệnh

Các đường dẫn lệnh có thể chọn sử dụng khả năng phân giải SecretRef được hỗ trợ thông qua RPC ảnh chụp nhanh Gateway. Có hai hành vi tổng quát:

<Tabs>
  <Tab title="Đường dẫn lệnh nghiêm ngặt">
    Ví dụ: các đường dẫn bộ nhớ từ xa `openclaw memory` và `openclaw qr --remote` khi cần các tham chiếu bí mật dùng chung từ xa. Chúng đọc từ ảnh chụp nhanh đang hoạt động và thất bại nhanh khi SecretRef bắt buộc không khả dụng.
  </Tab>
  <Tab title="Đường dẫn lệnh chỉ đọc">
    Ví dụ: `openclaw status`, `openclaw status --all`, `openclaw channels status`, `openclaw channels resolve`, `openclaw security audit` và các luồng sửa chữa doctor/cấu hình chỉ đọc. Chúng cũng ưu tiên ảnh chụp nhanh đang hoạt động nhưng chuyển sang trạng thái suy giảm thay vì hủy bỏ khi SecretRef mục tiêu không khả dụng.

    Hành vi chỉ đọc:

    - Khi Gateway đang chạy, các lệnh này đọc từ ảnh chụp nhanh đang hoạt động trước tiên.
    - Nếu quá trình phân giải Gateway không hoàn tất hoặc Gateway không khả dụng, chúng thử phương án dự phòng cục bộ có mục tiêu cho bề mặt lệnh đó.
    - Nếu SecretRef mục tiêu vẫn không khả dụng, lệnh tiếp tục với đầu ra chỉ đọc bị suy giảm và thông báo chẩn đoán rõ ràng rằng tham chiếu đã được cấu hình nhưng không khả dụng trong đường dẫn lệnh này.
    - Hành vi suy giảm này chỉ áp dụng cục bộ cho lệnh; nó không làm suy yếu các đường dẫn khởi động, tải lại hoặc gửi/xác thực khi chạy.

  </Tab>
</Tabs>

Các lưu ý khác:

- Việc làm mới ảnh chụp nhanh sau khi luân phiên bí mật ở phần phụ trợ được xử lý bởi `openclaw secrets reload`.
- Phương thức RPC Gateway được các đường dẫn lệnh này sử dụng: `secrets.resolve`.

## Quy trình kiểm tra và cấu hình

Luồng mặc định dành cho người vận hành:

<Steps>
  <Step title="Kiểm tra trạng thái hiện tại">
    ```bash
    openclaw secrets audit --check
    ```
  </Step>
  <Step title="Cấu hình và áp dụng SecretRef">
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

Không coi quá trình di chuyển là hoàn tất cho đến khi lần kiểm tra lại không còn vấn đề. Nếu quá trình kiểm tra vẫn báo cáo các giá trị văn bản thuần trong dữ liệu lưu trữ, rủi ro truy cập của tác nhân vẫn tồn tại ngay cả khi các API thời gian chạy trả về các giá trị đã được biên tập.

Nếu bạn lưu một kế hoạch thay vì áp dụng trong `configure`, hãy áp dụng kế hoạch đã lưu đó bằng `openclaw secrets apply --from <plan-path>` trước khi kiểm tra lại.

<AccordionGroup>
  <Accordion title="kiểm tra bí mật">
    Các phát hiện bao gồm:

    - Các giá trị văn bản thuần trong dữ liệu lưu trữ (`openclaw.json`, `auth-profiles.json`, `.env` và `agents/*/agent/models.json` đã tạo).
    - Dấu vết tiêu đề nhạy cảm của nhà cung cấp ở dạng văn bản thuần trong các mục `models.json` đã tạo.
    - Các tham chiếu chưa được phân giải.
    - Che khuất do thứ tự ưu tiên (`auth-profiles.json` được ưu tiên hơn các tham chiếu `openclaw.json`).
    - Dấu vết cũ (`auth.json`, lời nhắc OAuth).

    Lưu ý về exec: theo mặc định, quá trình kiểm tra bỏ qua việc kiểm tra khả năng phân giải SecretRef exec để tránh tác dụng phụ của lệnh. Sử dụng `openclaw secrets audit --allow-exec` để thực thi các nhà cung cấp exec trong quá trình kiểm tra.

    Lưu ý về dấu vết tiêu đề: việc phát hiện tiêu đề nhạy cảm của nhà cung cấp dựa trên suy nghiệm tên (các tên tiêu đề xác thực/thông tin xác thực phổ biến và các đoạn như `authorization`, `x-api-key`, `token`, `secret`, `password` và `credential`).

  </Accordion>
  <Accordion title="cấu hình bí mật">
    Trình trợ giúp tương tác:

    - Cấu hình `secrets.providers` trước tiên (`env`/`file`/`exec`, thêm/chỉnh sửa/xóa).
    - Cho phép bạn chọn các trường chứa bí mật được hỗ trợ trong `openclaw.json`, cộng với `auth-profiles.json` cho một phạm vi tác nhân.
    - Có thể tạo ánh xạ `auth-profiles.json` mới trực tiếp trong bộ chọn mục tiêu.
    - Thu thập thông tin chi tiết SecretRef (`source`, `provider`, `id`).
    - Chạy quá trình phân giải sơ bộ và có thể áp dụng ngay lập tức.

    Lưu ý về exec: quá trình kiểm tra sơ bộ bỏ qua các kiểm tra SecretRef exec trừ khi `--allow-exec` được đặt. Nếu bạn áp dụng trực tiếp từ `configure --apply` và kế hoạch bao gồm các tham chiếu/nhà cung cấp exec, hãy tiếp tục đặt `--allow-exec` cho cả bước áp dụng.

    Các chế độ hữu ích:

    - `openclaw secrets configure --providers-only`
    - `openclaw secrets configure --skip-provider-setup`
    - `openclaw secrets configure --agent <id>`

    Giá trị mặc định khi áp dụng `configure`:

    - Xóa các thông tin xác thực tĩnh khớp khỏi `auth-profiles.json` đối với các nhà cung cấp mục tiêu.
    - Xóa các mục `api_key` tĩnh cũ khỏi `auth.json`.
    - Xóa các dòng bí mật đã biết khớp khỏi `<config-dir>/.env`.

  </Accordion>
  <Accordion title="áp dụng bí mật">
    Áp dụng một kế hoạch đã lưu:

    ```bash
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
    ```

    Lưu ý về exec: chạy thử bỏ qua các kiểm tra exec trừ khi `--allow-exec` được đặt; chế độ ghi từ chối các kế hoạch chứa SecretRef/nhà cung cấp exec trừ khi `--allow-exec` được đặt.

    Để biết chi tiết về hợp đồng mục tiêu/đường dẫn nghiêm ngặt và các quy tắc từ chối chính xác, hãy xem [Hợp đồng kế hoạch áp dụng bí mật](/vi/gateway/secrets-plan-contract).

  </Accordion>
</AccordionGroup>

## Chính sách an toàn một chiều

<Warning>
OpenClaw chủ ý không ghi các bản sao lưu hoàn tác chứa những giá trị bí mật dạng văn bản thuần trước đây.
</Warning>

Mô hình an toàn:

- Kiểm tra sơ bộ phải thành công trước chế độ ghi.
- Việc kích hoạt khi chạy được xác thực trước khi cam kết.
- Quá trình áp dụng cập nhật các tệp bằng cách thay thế tệp nguyên tử và cố gắng khôi phục trong khả năng tốt nhất khi xảy ra lỗi.

## Lưu ý về khả năng tương thích xác thực cũ

Đối với thông tin xác thực tĩnh, thời gian chạy không còn phụ thuộc vào kho lưu trữ xác thực cũ dạng văn bản thuần.

- Nguồn thông tin xác thực khi chạy là ảnh chụp nhanh trong bộ nhớ đã được phân giải.
- Các mục `api_key` tĩnh cũ sẽ bị xóa khi được phát hiện.
- Hành vi tương thích liên quan đến OAuth vẫn được xử lý riêng.

## Lưu ý về giao diện web

Một số kiểu hợp SecretInput dễ cấu hình trong chế độ trình chỉnh sửa thô hơn so với chế độ biểu mẫu.

## Liên quan

- [Xác thực](/vi/gateway/authentication) - thiết lập xác thực
- [CLI: bí mật](/vi/cli/secrets) - các lệnh CLI
- [SecretRef Vault](/vi/plugins/vault) - thiết lập nhà cung cấp HashiCorp Vault
- [Biến môi trường](/vi/help/environment) - thứ tự ưu tiên của môi trường
- [Phạm vi thông tin xác thực SecretRef](/vi/reference/secretref-credential-surface) - phạm vi thông tin xác thực
- [Hợp đồng kế hoạch áp dụng bí mật](/vi/gateway/secrets-plan-contract) - chi tiết hợp đồng kế hoạch
- [Bảo mật](/vi/gateway/security) - trạng thái bảo mật
