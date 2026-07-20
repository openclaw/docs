---
read_when:
    - Cấu hình SecretRefs cho thông tin xác thực của nhà cung cấp và các tham chiếu `auth-profiles.json`
    - Vận hành việc tải lại, kiểm tra, cấu hình và áp dụng bí mật một cách an toàn trong môi trường production
    - Tìm hiểu về cơ chế dừng ngay khi khởi động thất bại, lọc các bề mặt không hoạt động và hành vi sử dụng trạng thái tốt gần nhất đã biết
sidebarTitle: Secrets management
summary: 'Quản lý bí mật: hợp đồng SecretRef, hành vi ảnh chụp nhanh khi chạy và cơ chế xóa một chiều an toàn'
title: Quản lý bí mật
x-i18n:
    generated_at: "2026-07-20T04:24:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: bbc7d006384ab6518daadc9f9283e15954a76f95307a09b73b053017a53b112c
    source_path: gateway/secrets.md
    workflow: 16
---

OpenClaw hỗ trợ SecretRef bổ sung để các thông tin xác thực được hỗ trợ không cần tồn tại dưới dạng văn bản thuần trong cấu hình.

<Note>
Văn bản thuần vẫn hoạt động. SecretRef được bật theo lựa chọn cho từng thông tin xác thực.
</Note>

<Warning>
Thông tin xác thực dạng văn bản thuần vẫn có thể bị tác tử đọc nếu nằm trong các tệp mà tác tử có thể kiểm tra, bao gồm `openclaw.json`, `auth-profiles.json`, `.env` hoặc các tệp `agents/*/agent/models.json` được tạo. SecretRef chỉ giảm phạm vi ảnh hưởng cục bộ đó sau khi mọi thông tin xác thực được hỗ trợ đã được di chuyển và `openclaw secrets audit --check` báo cáo không còn dấu vết văn bản thuần.
</Warning>

## Mô hình thời gian chạy

- Các bí mật được phân giải vào một ảnh chụp nhanh thời gian chạy trong bộ nhớ, theo cách chủ động trong quá trình kích hoạt, không phải theo cách trì hoãn trên các đường dẫn yêu cầu.
- Khi khởi động nguội Gateway, lỗi SecretRef có thể thử lại được sẽ được cô lập cho một chủ sở hữu không phải Gateway đã biết khi chủ sở hữu đó hỗ trợ khả năng cô lập. Các lớp chủ sở hữu được ánh xạ bao gồm nhà cung cấp mô hình và Skills, nhà cung cấp phương tiện/TTS/cron, hồ sơ xác thực đủ điều kiện, bộ nhớ theo tác tử, SSH hộp cát, tài khoản kênh và các tuyến Plugin được khai báo trong manifest. Gateway khởi động, ghi nhận chủ sở hữu là đã cấu hình nhưng không khả dụng và phát cảnh báo suy giảm đã được che thông tin nhạy cảm. Xác thực đầu vào Gateway, các tham chiếu hoặc giá trị đã phân giải không hợp lệ về cấu trúc, chủ sở hữu đóng khi lỗi và các tham chiếu có chủ sở hữu thời gian chạy chưa được ánh xạ vẫn khiến quá trình khởi động thất bại.
- Quá trình tải lại xác thực từng chủ sở hữu được ánh xạ một cách độc lập, sau đó công bố một ảnh chụp nhanh nguyên tử duy nhất. Các chủ sở hữu khỏe mạnh được làm mới. Một chủ sở hữu đủ điều kiện nhưng gặp lỗi giữ lại giá trị tốt gần nhất đã biết và chỉ trở nên lỗi thời khi danh tính tham chiếu, định nghĩa nhà cung cấp và toàn bộ hợp đồng không chứa bí mật của chủ sở hữu không thay đổi; một chủ sở hữu mới hoặc đã thay đổi nhưng gặp lỗi sẽ trở thành nguội. Lỗi nghiêm ngặt từ chối quá trình tải lại và giữ nguyên ảnh chụp nhanh đang hoạt động.
- Vi phạm chính sách (ví dụ: hồ sơ xác thực ở chế độ OAuth kết hợp với đầu vào SecretRef) khiến quá trình kích hoạt thất bại trước khi hoán đổi thời gian chạy.
- Các yêu cầu thời gian chạy chỉ đọc ảnh chụp nhanh đang hoạt động trong bộ nhớ. Thông tin xác thực SecretRef của nhà cung cấp mô hình đi qua kho lưu trữ xác thực và các tùy chọn luồng dưới dạng giá trị canh gác cục bộ của tiến trình cho đến khi đi ra ngoài. Các đường dẫn gửi đi (gửi phản hồi/luồng Discord, gửi hành động Telegram) cũng đọc ảnh chụp nhanh đó và không phân giải lại tham chiếu cho mỗi lần gửi.

Điều này giúp sự cố ngừng hoạt động của nhà cung cấp bí mật không ảnh hưởng đến các đường dẫn yêu cầu nóng.

Cơ chế bảo vệ đầu vào Gateway, cấu hình hoặc giá trị đã phân giải không hợp lệ về cấu trúc, vi phạm chính sách và quyền sở hữu không xác định vẫn đóng khi lỗi. Các chủ sở hữu bị cô lập không bao giờ chuyển sang nguồn thông tin xác thực có độ ưu tiên thấp hơn.

## Chèn tại thời điểm đi ra ngoài (giá trị canh gác)

Đối với thông tin xác thực của nhà cung cấp mô hình được SecretRef hỗ trợ, OpenClaw tạo một giá trị canh gác mờ, cục bộ của tiến trình trong quá trình phân giải xác thực mô hình. Do đó, kho lưu trữ xác thực, các tùy chọn luồng, cấu hình SDK, nhật ký, đối tượng lỗi và hầu hết hoạt động kiểm tra nội bộ thời gian chạy sẽ thấy một giá trị như `oc-sent-v1-...`, thay vì thông tin xác thực của nhà cung cấp. Lệnh fetch mô hình được bảo vệ và các phép thăm dò tình trạng nhà cung cấp cục bộ được quản lý thay thế các giá trị canh gác đã biết trong giá trị URL và tiêu đề ngay trước khi mỗi yêu cầu rời khỏi tiến trình.

Các giá trị có hình dạng giống giá trị canh gác nhưng không xác định sẽ đóng khi lỗi trước khi có hoạt động mạng. OpenClaw từ chối gửi yêu cầu thay vì chuyển tiếp một giá trị canh gác chưa được phân giải đến nhà cung cấp. Các giá trị bí mật đã phân giải cũng được đăng ký để che chính xác giá trị trong nhật ký như một biện pháp phòng thủ nhiều lớp.

Bộ điều hợp nhà cung cấp sử dụng điểm chèn muộn nhất mà SDK của chúng hỗ trợ:

- Các SDK có tùy chọn fetch tùy chỉnh nhận lệnh fetch được bảo vệ của OpenClaw, vì vậy SDK giữ lại giá trị canh gác.
- Các SDK không có tùy chọn fetch tùy chỉnh sẽ mở gói giá trị canh gác ngay trước khi tạo ứng dụng khách. Các luồng nhà cung cấp do Plugin sở hữu và bộ khung tác tử mở gói tại điểm bàn giao cuối cùng do lõi sở hữu vì các phương thức vận chuyển đó không dùng chung lệnh fetch được bảo vệ của OpenClaw.

Giá trị canh gác giảm mức độ lộ văn bản thuần trên toàn bộ chuỗi gọi mô hình, nhưng chúng không phải là cơ chế cô lập tiến trình. Giá trị thực vẫn tồn tại trong bộ nhớ của cùng tiến trình và xuất hiện tại ranh giới bộ điều hợp cuối cùng. Thông tin xác thực môi trường dạng văn bản thuần không được cấu hình thông qua SecretRef vẫn ở dạng văn bản thuần và nằm ngoài cơ chế này.

Đặt `OPENCLAW_SECRET_SENTINELS=off` (cũng chấp nhận `0` hoặc `false`, không phân biệt chữ hoa chữ thường) để tắt việc tạo giá trị canh gác trong quá trình ứng phó sự cố hoặc khắc phục sự cố tương thích. Công tắc ngắt không tắt việc đăng ký che chính xác giá trị.

## Ranh giới truy cập của tác tử

SecretRef ngăn thông tin xác thực được lưu cố định trong cấu hình và các tệp mô hình được tạo, nhưng chúng không phải là ranh giới cô lập tiến trình. Thông tin xác thực dạng văn bản thuần còn lại trên ổ đĩa trong đường dẫn mà tác tử có thể đọc vẫn có thể bị đọc qua công cụ tệp hoặc shell, bỏ qua cơ chế che ở cấp API.

Đối với các triển khai sản xuất có tệp mà tác tử có thể truy cập thuộc phạm vi xem xét, chỉ coi quá trình di chuyển là hoàn tất khi tất cả các điều sau đều đúng:

- Thông tin xác thực được hỗ trợ sử dụng SecretRef thay cho giá trị văn bản thuần.
- Dấu vết văn bản thuần cũ được xóa khỏi `openclaw.json`, `auth-profiles.json`, `.env` và các tệp `models.json` được tạo.
- `openclaw secrets audit --check` không phát hiện vấn đề sau khi di chuyển.
- Mọi thông tin xác thực còn lại chưa được hỗ trợ hoặc đang luân phiên đều được bảo vệ bằng cơ chế cô lập của hệ điều hành, cô lập vùng chứa hoặc proxy thông tin xác thực bên ngoài.

Đây là lý do quy trình kiểm tra/cấu hình/áp dụng là một cổng di chuyển bảo mật, không chỉ là công cụ hỗ trợ tiện lợi.

<Warning>
SecretRef không làm cho các tệp tùy ý có thể đọc trở nên an toàn. Bản sao lưu, cấu hình đã sao chép, danh mục mô hình cũ được tạo và các lớp thông tin xác thực chưa được hỗ trợ vẫn là bí mật sản xuất cho đến khi bị xóa, di chuyển ra ngoài ranh giới tin cậy của tác tử hoặc được cô lập riêng.
</Warning>

## Lọc bề mặt đang hoạt động

SecretRef chỉ được xác thực trên các bề mặt thực sự đang hoạt động:

- **Bề mặt được bật**: lỗi có thể thử lại đối với chủ sở hữu đã được ánh xạ và có thể cô lập sẽ chuyển sang trạng thái suy giảm nguội hoặc lỗi thời. Lỗi nghiêm ngặt, đóng khi lỗi, bắt buộc với Gateway hoặc chưa được ánh xạ sẽ chặn quá trình khởi động/tải lại.
- **Bề mặt không hoạt động**: các tham chiếu chưa phân giải không chặn quá trình khởi động/tải lại; chúng phát một chẩn đoán `SECRETS_REF_IGNORED_INACTIVE_SURFACE` không gây lỗi nghiêm trọng.

<Accordion title="Ví dụ về các bề mặt không hoạt động">
- Các mục kênh/tài khoản đã tắt.
- Thông tin xác thực kênh cấp cao nhất mà không tài khoản nào được bật kế thừa.
- Các bề mặt công cụ/tính năng đã tắt.
- Các khóa dành riêng cho nhà cung cấp tìm kiếm web không được `tools.web.search.provider` chọn. Ở chế độ tự động (không đặt nhà cung cấp), các khóa được xét theo thứ tự ưu tiên để tự động phát hiện cho đến khi một khóa phân giải thành công; sau khi lựa chọn, khóa của các nhà cung cấp không được chọn sẽ không hoạt động.
- Tài liệu xác thực SSH hộp cát (`agents.defaults.sandbox.ssh.identityData`, `certificateData`, `knownHostsData`, cùng các giá trị ghi đè theo tác tử) chỉ hoạt động khi phần phụ trợ hộp cát hiệu dụng là `ssh` và chế độ hộp cát không phải `off`, đối với tác tử mặc định hoặc một tác tử đã bật.
- SecretRef `gateway.remote.token` / `gateway.remote.password` hoạt động nếu bất kỳ điều kiện nào sau đây đúng:
  - `gateway.mode=remote`
  - `gateway.remote.url` đã được cấu hình
  - `gateway.tailscale.mode` là `serve` hoặc `funnel`
  - Ở chế độ cục bộ không có các bề mặt từ xa đó: `gateway.remote.token` hoạt động khi xác thực bằng mã thông báo có thể được ưu tiên và không có mã thông báo môi trường/xác thực nào được cấu hình; `gateway.remote.password` chỉ hoạt động khi xác thực bằng mật khẩu có thể được ưu tiên và không có mật khẩu môi trường/xác thực nào được cấu hình.
- SecretRef `gateway.auth.token` không hoạt động đối với quá trình phân giải xác thực khi khởi động nếu `OPENCLAW_GATEWAY_TOKEN` được đặt, vì đầu vào mã thông báo môi trường được ưu tiên cho thời gian chạy đó.

</Accordion>

## Chẩn đoán bề mặt xác thực Gateway

Khi SecretRef được đặt trên `gateway.auth.token`, `gateway.auth.password`, `gateway.remote.token` hoặc `gateway.remote.password`, quá trình khởi động/tải lại gateway ghi trạng thái bề mặt dưới mã `SECRETS_GATEWAY_AUTH_SURFACE`:

- `active`: SecretRef là một phần của bề mặt xác thực hiệu dụng và phải phân giải được.
- `inactive`: một bề mặt xác thực khác được ưu tiên, hoặc xác thực từ xa đã bị tắt/không hoạt động.

Mục nhật ký bao gồm lý do mà chính sách bề mặt đang hoạt động đã sử dụng.

## Kiểm tra trước tham chiếu khi tiếp nhận ban đầu

Trong quá trình tiếp nhận ban đầu tương tác, việc chọn lưu trữ SecretRef sẽ chạy xác thực trước khi lưu:

- Tham chiếu môi trường: xác thực tên biến môi trường và xác nhận rằng một giá trị không rỗng có thể được thấy trong quá trình thiết lập.
- Tham chiếu nhà cung cấp (`file` hoặc `exec`): xác thực lựa chọn nhà cung cấp, phân giải `id` và kiểm tra kiểu của giá trị đã phân giải.
- Luồng bắt đầu nhanh: khi `gateway.auth.token` đã là một SecretRef, quá trình tiếp nhận ban đầu sẽ phân giải nó trước khi thăm dò/khởi tạo bảng điều khiển (đối với các tham chiếu `env`, `file` và `exec`) bằng cùng một cổng dừng ngay khi lỗi.

Khi xác thực thất bại, lỗi sẽ được hiển thị và bạn có thể thử lại.

## Hợp đồng SecretRef

Một hình dạng đối tượng duy nhất ở mọi nơi:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

<Tabs>
  <Tab title="env">
    ```json5
    { source: "env", provider: "default", id: "OPENAI_API_KEY" }
    ```

    Các chuỗi dạng rút gọn cũng được chấp nhận trong các trường SecretInput:

    ```json5
    "${OPENAI_API_KEY}"
    "$OPENAI_API_KEY"
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
    - `id` phải là một con trỏ JSON tuyệt đối (`/...`), hoặc giá trị chữ `value` đối với các nhà cung cấp `singleValue`
    - Cách thoát RFC 6901 trong các phân đoạn: `~` trở thành `~0`, `/` trở thành `~1`

  </Tab>
  <Tab title="exec">
    ```json5
    { source: "exec", provider: "vault", id: "providers/openai/apiKey#value" }
    ```

    Xác thực:

    - `provider` phải khớp với `^[a-z][a-z0-9_-]{0,63}$`
    - `id` phải khớp với `^[A-Za-z0-9][A-Za-z0-9._:/#-]{0,255}$` (hỗ trợ các bộ chọn như `secret#json_key`)
    - `id` không được chứa `.` hoặc `..` dưới dạng các phân đoạn đường dẫn được phân tách bằng dấu gạch chéo (ví dụ: `a/../b` bị từ chối)

  </Tab>
</Tabs>

## Cấu hình nhà cung cấp

Định nghĩa các nhà cung cấp trong `secrets.providers`:

```json5
{
  secrets: {
    providers: {
      default: { source: "env" },
      filemain: {
        source: "file",
        path: "~/.openclaw/secrets.json",
        mode: "json", // hoặc "singleValue"
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
  },
}
```

<Accordion title="Nhà cung cấp môi trường">
- Danh sách cho phép tên chính xác tùy chọn thông qua `allowlist`.
- Giá trị môi trường bị thiếu hoặc rỗng khiến quá trình phân giải thất bại.

</Accordion>

<Accordion title="Nhà cung cấp tệp">
- Đọc tệp cục bộ tại `path`.
- `mode: "json"` (mặc định) yêu cầu một tải trọng đối tượng JSON và phân giải `id` dưới dạng con trỏ JSON.
- `mode: "singleValue"` yêu cầu mã định danh tham chiếu `"value"` và trả về nội dung tệp thô (đã loại bỏ ký tự xuống dòng ở cuối).
- Đường dẫn phải vượt qua các kiểm tra quyền sở hữu/quyền truy cập; `timeoutMs` (mặc định 5000) và `maxBytes` (mặc định 1 MiB) giới hạn thao tác đọc.
- Windows đóng khi lỗi: nếu không thể xác minh ACL cho đường dẫn, quá trình phân giải sẽ thất bại. Chỉ đối với các đường dẫn đáng tin cậy, hãy đặt `allowInsecurePath: true` trên nhà cung cấp đó để bỏ qua kiểm tra.

</Accordion>

<Accordion title="Nhà cung cấp thực thi">
- Chạy trực tiếp đường dẫn tuyệt đối của tệp nhị phân đã cấu hình, không qua shell.
- Theo mặc định, `command` phải là một tệp thông thường, không phải liên kết tượng trưng. Đặt `allowSymlinkCommand: true` để cho phép đường dẫn lệnh là liên kết tượng trưng (ví dụ: các shim của Homebrew), đồng thời kết hợp với `trustedDirs` (ví dụ: `["/opt/homebrew"]`) để chỉ các đường dẫn của trình quản lý gói mới đủ điều kiện.
- Hỗ trợ `timeoutMs` (mặc định 5000), `noOutputTimeoutMs` (mặc định bằng `timeoutMs`), `maxOutputBytes` (mặc định 1 MiB), danh sách cho phép `env`/`passEnv` và `trustedDirs`.
- `jsonOnly` mặc định là `true`. Khi dùng `jsonOnly: false` và chỉ yêu cầu một id, stdout thuần không phải JSON được chấp nhận làm giá trị của id đó.
- Windows đóng khi lỗi: nếu không thể xác minh ACL cho đường dẫn lệnh, quá trình phân giải sẽ thất bại. Chỉ với các đường dẫn đáng tin cậy, hãy đặt `allowInsecurePath: true` trên nhà cung cấp đó để bỏ qua bước kiểm tra.
- Các nhà cung cấp thực thi do Plugin quản lý có thể dùng `pluginIntegration` thay cho `command`/`args` đã sao chép. OpenClaw phân giải thông tin chi tiết hiện tại của lệnh từ manifest Plugin đã cài đặt trong lúc khởi động/tải lại; nếu Plugin bị vô hiệu hóa, gỡ bỏ, không đáng tin cậy hoặc không còn khai báo tích hợp, các SecretRef đang hoạt động trên nhà cung cấp đó sẽ đóng khi lỗi.

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

`code` là thông tin chẩn đoán tùy chọn mà máy có thể đọc được. OpenClaw hiển thị các mã được nhận dạng
`NOT_FOUND` và `AMBIGUOUS_DUPLICATE_KEY` cùng với nhà cung cấp và id tham chiếu. Các mã khác
và trường dạng tự do như `message` được chấp nhận để tương thích với giao thức v1
nhưng không được hiển thị vì đầu ra của trình phân giải có thể chứa dữ liệu thông tin xác thực.

</Accordion>

## Khóa API dựa trên tệp

Không đặt các chuỗi `file:...` trong khối `env` của cấu hình. Khối đó là giá trị nguyên văn và không ghi đè, vì vậy `file:...` không bao giờ được phân giải tại đó.

Thay vào đó, hãy dùng SecretRef tệp trên một trường thông tin xác thực được hỗ trợ:

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

## Ví dụ tích hợp thực thi

Để xem hướng dẫn riêng về 1Password bao gồm tài khoản dịch vụ, skill tác nhân đi kèm và cách khắc phục sự cố, hãy xem [1Password](/vi/gateway/1password).

<AccordionGroup>
  <Accordion title="CLI 1Password">
    ```json5
    {
      secrets: {
        providers: {
          onepassword_openai: {
            source: "exec",
            command: "/opt/homebrew/bin/op",
            allowSymlinkCommand: true, // bắt buộc đối với tệp nhị phân được liên kết tượng trưng của Homebrew
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
    Dùng trình bao bọc trình phân giải để ánh xạ các id SecretRef tới khóa mục của Bitwarden Secrets Manager. Kho lưu trữ bao gồm `scripts/secrets/openclaw-bws-resolver.mjs`; hãy cài đặt hoặc sao chép tệp này vào một đường dẫn tuyệt đối đáng tin cậy trên máy chủ chạy Gateway.

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

    Trình phân giải xử lý theo lô các id được yêu cầu, chạy `bws secret list` và trả về giá trị cho các trường `key` của bí mật khớp. Dùng các khóa đáp ứng hợp đồng id SecretRef thực thi, chẳng hạn như `openclaw/providers/openai/apiKey`; các khóa kiểu biến môi trường có dấu gạch dưới sẽ bị từ chối trước khi trình phân giải chạy. Nếu có nhiều hơn một bí mật Bitwarden hiển thị cùng dùng khóa được yêu cầu, trình phân giải sẽ báo id đó là không rõ ràng thay vì phỏng đoán. Sau khi cập nhật cấu hình, hãy xác minh đường dẫn trình phân giải:

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
            allowSymlinkCommand: true, // bắt buộc đối với tệp nhị phân được liên kết tượng trưng của Homebrew
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
    Dùng một trình bao bọc trình phân giải nhỏ để ánh xạ trực tiếp các id SecretRef tới các mục `pass`. Lưu tệp này dưới dạng tệp thực thi tại một đường dẫn tuyệt đối đáp ứng các bước kiểm tra đường dẫn của nhà cung cấp thực thi, ví dụ `/usr/local/bin/openclaw-pass-resolver`. Dòng shebang `#!/usr/bin/env node` phân giải `node` từ `PATH` của tiến trình trình phân giải, vì vậy hãy đưa `PATH` vào `passEnv`. Nếu `pass` không nằm trên `PATH` đó, hãy đặt `PASS_BIN` trong môi trường cha và cũng đưa biến này vào `passEnv`:

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

    Sau đó, hãy cấu hình nhà cung cấp thực thi và trỏ `apiKey` tới đường dẫn mục `pass`:

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

    Giữ bí mật ở dòng đầu tiên của mục `pass`, hoặc tùy chỉnh trình bao bọc để trả về toàn bộ đầu ra `pass show`. Sau khi cập nhật cấu hình, hãy xác minh cả quy trình kiểm tra tĩnh và đường dẫn trình phân giải thực thi:

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
            allowSymlinkCommand: true, // bắt buộc đối với tệp nhị phân được liên kết tượng trưng của Homebrew
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

Các biến môi trường máy chủ MCP được cấu hình qua `plugins.entries.acpx.config.mcpServers` chấp nhận SecretInput, giúp loại bỏ khóa API và token khỏi cấu hình văn bản thuần:

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

Các giá trị chuỗi văn bản thuần vẫn hoạt động. Các tham chiếu mẫu môi trường như `${MCP_SERVER_API_KEY}` và đối tượng SecretRef được phân giải trong quá trình kích hoạt Gateway, trước khi tiến trình máy chủ MCP được khởi chạy. Tương tự các bề mặt SecretRef khác, tham chiếu chưa phân giải chỉ chặn quá trình kích hoạt khi Plugin `acpx` thực sự đang hoạt động.

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

Hành vi thời gian chạy:

- OpenClaw phân giải các tham chiếu này trong quá trình kích hoạt sandbox, không phân giải trì hoãn ở mỗi lần gọi SSH.
- Các giá trị đã phân giải được ghi vào một thư mục tạm với quyền truy cập tệp hạn chế (`0o600`) và được dùng trong cấu hình SSH được tạo.
- Nếu backend sandbox có hiệu lực không phải là `ssh` (hoặc chế độ sandbox là `off`), các tham chiếu này vẫn không hoạt động và không chặn quá trình khởi động.

## Phạm vi thông tin xác thực được hỗ trợ

Các thông tin xác thực chính tắc được hỗ trợ và không được hỗ trợ được liệt kê trong [Phạm vi thông tin xác thực SecretRef](/vi/reference/secretref-credential-surface).

<Note>
Thông tin xác thực được tạo trong thời gian chạy hoặc luân phiên và dữ liệu làm mới OAuth được chủ ý loại trừ khỏi quá trình phân giải SecretRef chỉ đọc.
</Note>

## Hành vi bắt buộc và thứ tự ưu tiên

- Trường không có tham chiếu: không thay đổi.
- Trường có tham chiếu: bắt buộc trên các bề mặt đang hoạt động trong quá trình kích hoạt.
- Nếu có cả văn bản thuần và tham chiếu, tham chiếu được ưu tiên trên các đường dẫn ưu tiên được hỗ trợ.
- Giá trị đánh dấu biên tập `__OPENCLAW_REDACTED__` được dành riêng cho việc biên tập/khôi phục cấu hình nội bộ và bị từ chối nếu được gửi dưới dạng dữ liệu cấu hình nguyên văn.

Tín hiệu cảnh báo và kiểm tra:

- `SECRETS_REF_OVERRIDES_PLAINTEXT` (cảnh báo thời gian chạy)
- `REF_SHADOWED` (phát hiện kiểm tra khi thông tin xác thực `auth-profiles.json` được ưu tiên hơn tham chiếu `openclaw.json`)

Khả năng tương thích với Google Chat: `serviceAccountRef` được ưu tiên hơn `serviceAccount` dạng văn bản thuần; giá trị văn bản thuần bị bỏ qua sau khi tham chiếu cùng cấp được đặt.

## Điều kiện kích hoạt

Quá trình kích hoạt bí mật chạy khi:

- Khởi động (kiểm tra sơ bộ cùng với kích hoạt cuối cùng)
- Đường dẫn áp dụng nóng khi tải lại cấu hình
- Đường dẫn kiểm tra khởi động lại khi tải lại cấu hình
- Tải lại thủ công qua `secrets.reload`
- Kiểm tra sơ bộ RPC ghi cấu hình Gateway (`config.set` / `config.apply` / `config.patch`), xác thực SecretRef trên bề mặt đang hoạt động trong tải trọng cấu hình được gửi trước khi lưu các chỉnh sửa

Hợp đồng kích hoạt:

- Khi thành công, ảnh chụp nhanh được hoán đổi nguyên tử.
- Lỗi khởi động nghiêm ngặt sẽ hủy quá trình khởi động Gateway.
- Trong quá trình khởi động nguội, lỗi phân giải có thể thử lại đối với chủ sở hữu không thuộc Gateway đã được ánh xạ và có thể cô lập có thể công bố ảnh chụp nhanh trong đó chính xác chủ sở hữu đó được cấu hình là không khả dụng. Yêu cầu dành cho chủ sở hữu này sẽ thất bại với `SECRET_SURFACE_UNAVAILABLE`; chủ sở hữu nhà cung cấp mô hình không dự phòng về thông tin xác thực từ môi trường hoặc hồ sơ xác thực sau khi một tham chiếu rõ ràng thất bại.
- Quá trình tải lại và kiểm tra khởi động lại sẽ cô lập các chủ sở hữu được ánh xạ đủ điều kiện. Các danh tính tham chiếu không đổi với định nghĩa nhà cung cấp không đổi và hợp đồng chủ sở hữu hoàn chỉnh không chứa bí mật không đổi sẽ giữ lại chính xác các giá trị tốt đã biết gần nhất dưới dạng cũ; các tham chiếu chưa phân giải đã thay đổi hoặc mới được cấu hình chỉ được công bố ở trạng thái nguội cho chủ sở hữu đó. Lỗi tải lại nghiêm ngặt sẽ giữ nguyên ảnh chụp nhanh đang hoạt động trước đó.
- `config.set`, `config.apply` và `config.patch` chấp nhận các tham chiếu chưa phân giải hợp lệ về cú pháp dành cho chủ sở hữu có thể cô lập và trả về báo cáo `degradedSecretOwners` đã biên tập. Xác thực đầu vào Gateway, cấu hình hoặc giá trị đã phân giải không hợp lệ về cấu trúc, vi phạm chính sách và chủ sở hữu không xác định vẫn bị từ chối trước khi thay đổi đĩa.
- Các chủ sở hữu cùng cấp lành mạnh vẫn được phân giải và công bố bình thường ngay cả khi một chủ sở hữu khác ở trạng thái nguội hoặc cũ.
- Việc cung cấp mã thông báo kênh rõ ràng cho từng lần gọi đến một lệnh gọi trình trợ giúp/công cụ gửi đi không kích hoạt SecretRef; các điểm kích hoạt vẫn là khởi động, tải lại và `secrets.reload` rõ ràng.

## Tín hiệu suy giảm và khôi phục

Khi kích hoạt trong lúc tải lại thất bại sau một trạng thái lành mạnh, OpenClaw chuyển sang trạng thái bí mật bị suy giảm, phát ra các sự kiện hệ thống một lần và mã nhật ký:

- `SECRETS_RELOADER_DEGRADED`
- `SECRETS_RELOADER_RECOVERED`

Hành vi:

- Suy giảm: các chủ sở hữu lành mạnh được làm mới, các chủ sở hữu cũ giữ lại giá trị tốt đã biết gần nhất và các chủ sở hữu nguội vẫn không khả dụng.
- Đã khôi phục: được phát một lần sau lần kích hoạt thành công tiếp theo.
- Các lỗi lặp lại khi đã ở trạng thái suy giảm sẽ ghi cảnh báo nhưng không phát lại sự kiện.
- Lỗi khởi động nghiêm ngặt không bao giờ phát sự kiện suy giảm vì thời gian chạy chưa từng hoạt động. Một lần khởi động thành công với các chủ sở hữu nguội sẽ ghi nhật ký tình trạng suy giảm của chủ sở hữu nhưng không phát sự kiện của trình tải lại.
- Lỗi khởi động và tải lại theo phạm vi tham chiếu phát cảnh báo `SECRETS_DEGRADED` có cấu trúc cho từng chủ sở hữu bị ảnh hưởng. Sự cố ngừng hoạt động theo phạm vi nhà cung cấp phát một cảnh báo `SECRETS_PROVIDER_DEGRADED` cùng nhà cung cấp và danh sách đầy đủ các chủ sở hữu bị ảnh hưởng thay vì lặp lại lỗi nhà cung cấp cho từng chủ sở hữu. Cảnh báo bao gồm lý do đã biên tập, trạng thái chủ sở hữu `cold` hoặc `stale` và gợi ý thử lại `openclaw secrets reload`. Chúng không bao giờ bao gồm giá trị đã phân giải hoặc mã định danh SecretRef.
- `openclaw doctor` liệt kê các chủ sở hữu nguội và cũ cùng với đường dẫn cấu hình bị ảnh hưởng, lý do đã biên tập và hướng dẫn thử lại.

## Phân giải đường dẫn lệnh

Các đường dẫn lệnh có thể chọn sử dụng quá trình phân giải SecretRef được hỗ trợ thông qua RPC ảnh chụp nhanh của Gateway. Có hai nhóm hành vi chính:

<Tabs>
  <Tab title="Đường dẫn lệnh nghiêm ngặt">
    Ví dụ: các đường dẫn bộ nhớ từ xa `openclaw memory` và `openclaw qr --remote` khi cần tham chiếu bí mật dùng chung từ xa. Chúng đọc từ ảnh chụp nhanh đang hoạt động và thất bại ngay khi SecretRef bắt buộc không khả dụng.
  </Tab>
  <Tab title="Đường dẫn lệnh chỉ đọc">
    Ví dụ: `openclaw status`, `openclaw status --all`, `openclaw channels status`, `openclaw channels resolve`, `openclaw security audit` và các luồng sửa chữa doctor/cấu hình chỉ đọc. Chúng cũng ưu tiên ảnh chụp nhanh đang hoạt động nhưng chuyển sang trạng thái suy giảm thay vì hủy khi SecretRef mục tiêu không khả dụng.

    Hành vi chỉ đọc:

    - Khi Gateway đang chạy, các lệnh này đọc từ ảnh chụp nhanh đang hoạt động trước.
    - Nếu quá trình phân giải Gateway chưa hoàn tất hoặc Gateway không khả dụng, chúng sẽ thử phương án dự phòng cục bộ có mục tiêu cho bề mặt lệnh đó.
    - Nếu SecretRef mục tiêu vẫn không khả dụng, lệnh tiếp tục với đầu ra chỉ đọc bị suy giảm và thông báo chẩn đoán rõ ràng rằng tham chiếu đã được cấu hình nhưng không khả dụng trong đường dẫn lệnh này.
    - Hành vi suy giảm này chỉ áp dụng cục bộ cho lệnh; nó không làm suy yếu các đường dẫn khởi động thời gian chạy, tải lại hoặc gửi/xác thực.

  </Tab>
</Tabs>

Ghi chú khác:

- Việc làm mới ảnh chụp nhanh sau khi bí mật backend được luân phiên do `openclaw secrets reload` xử lý.
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

Không coi quá trình di chuyển là hoàn tất cho đến khi lần kiểm tra lại không còn vấn đề. Nếu kiểm tra vẫn báo cáo các giá trị văn bản thuần được lưu trữ, rủi ro truy cập của tác nhân vẫn còn ngay cả khi API thời gian chạy trả về các giá trị đã biên tập.

Nếu bạn lưu một kế hoạch thay vì áp dụng trong `configure`, hãy áp dụng kế hoạch đã lưu đó bằng `openclaw secrets apply --from <plan-path>` trước khi kiểm tra lại.

<AccordionGroup>
  <Accordion title="secrets audit">
    Các phát hiện bao gồm:

    - Các giá trị văn bản thuần được lưu trữ (`openclaw.json`, `auth-profiles.json`, `.env` và `agents/*/agent/models.json` được tạo).
    - Dữ liệu sót lại của tiêu đề nhà cung cấp nhạy cảm dạng văn bản thuần trong các mục `models.json` được tạo.
    - Các tham chiếu chưa phân giải.
    - Che khuất do thứ tự ưu tiên (`auth-profiles.json` được ưu tiên hơn các tham chiếu `openclaw.json`).
    - Dữ liệu cũ còn sót lại (`auth.json`, lời nhắc OAuth).

    Ghi chú về exec: theo mặc định, quá trình kiểm tra bỏ qua việc kiểm tra khả năng phân giải SecretRef của exec để tránh tác dụng phụ của lệnh. Dùng `openclaw secrets audit --allow-exec` để thực thi các nhà cung cấp exec trong quá trình kiểm tra.

    Ghi chú về dữ liệu tiêu đề còn sót lại: việc phát hiện tiêu đề nhạy cảm của nhà cung cấp dựa trên phương pháp phỏng đoán theo tên (các tên tiêu đề xác thực/thông tin xác thực phổ biến và các đoạn như `authorization`, `x-api-key`, `token`, `secret`, `password` và `credential`).

  </Accordion>
  <Accordion title="secrets configure">
    Trình trợ giúp tương tác:

    - Cấu hình `secrets.providers` trước (`env`/`file`/`exec`, thêm/chỉnh sửa/xóa).
    - Cho phép bạn chọn các trường chứa bí mật được hỗ trợ trong `openclaw.json` cùng với `auth-profiles.json` cho một phạm vi tác nhân.
    - Có thể tạo ánh xạ `auth-profiles.json` mới trực tiếp trong bộ chọn mục tiêu.
    - Thu thập chi tiết SecretRef (`source`, `provider`, `id`).
    - Chạy quá trình phân giải sơ bộ và có thể áp dụng ngay lập tức.

    Ghi chú về exec: quá trình kiểm tra sơ bộ bỏ qua kiểm tra SecretRef của exec trừ khi `--allow-exec` được đặt. Nếu bạn áp dụng trực tiếp từ `configure --apply` và kế hoạch bao gồm các tham chiếu/nhà cung cấp exec, hãy tiếp tục đặt `--allow-exec` cho bước áp dụng.

    Các chế độ hữu ích:

    - `openclaw secrets configure --providers-only`
    - `openclaw secrets configure --skip-provider-setup`
    - `openclaw secrets configure --agent <id>`

    Giá trị mặc định khi áp dụng `configure`:

    - Xóa thông tin xác thực tĩnh khớp khỏi `auth-profiles.json` đối với các nhà cung cấp mục tiêu.
    - Xóa các mục `api_key` tĩnh cũ khỏi `auth.json`.
    - Xóa các dòng bí mật đã biết khớp khỏi trạng thái có hiệu lực và các tệp `.env` của cấu hình đang hoạt động (loại bỏ trùng lặp khi cả hai đường dẫn khớp).

  </Accordion>
  <Accordion title="secrets apply">
    Áp dụng một kế hoạch đã lưu:

    ```bash
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
    ```

    Ghi chú về exec: chạy thử bỏ qua kiểm tra exec trừ khi `--allow-exec` được đặt; chế độ ghi từ chối các kế hoạch chứa SecretRef/nhà cung cấp exec trừ khi `--allow-exec` được đặt.

    Để biết chi tiết về hợp đồng mục tiêu/đường dẫn nghiêm ngặt và các quy tắc từ chối chính xác, hãy xem [Hợp đồng kế hoạch áp dụng bí mật](/vi/gateway/secrets-plan-contract).

  </Accordion>
</AccordionGroup>

## Chính sách an toàn một chiều

<Warning>
OpenClaw chủ ý không ghi các bản sao lưu hoàn tác chứa giá trị bí mật dạng văn bản thuần trong quá khứ.
</Warning>

Mô hình an toàn:

- Kiểm tra sơ bộ phải thành công trước chế độ ghi.
- Quá trình kích hoạt thời gian chạy được xác thực trước khi commit.
- Quá trình áp dụng cập nhật các tệp bằng thao tác thay thế tệp nguyên tử và cố gắng khôi phục trong khả năng tốt nhất khi thất bại.

## Ghi chú về khả năng tương thích xác thực cũ

Đối với thông tin xác thực tĩnh, thời gian chạy không còn phụ thuộc vào kho lưu trữ xác thực cũ dạng văn bản thuần.

- Nguồn thông tin xác thực thời gian chạy là ảnh chụp nhanh trong bộ nhớ đã phân giải.
- Các mục `api_key` tĩnh cũ được xóa khi phát hiện.
- Hành vi tương thích liên quan đến OAuth vẫn được xử lý riêng.

## Ghi chú về giao diện web

Một số union SecretInput dễ cấu hình trong chế độ trình chỉnh sửa thô hơn so với chế độ biểu mẫu.

## Liên quan

- [Xác thực](/vi/gateway/authentication) - thiết lập xác thực
- [CLI: bí mật](/vi/cli/secrets) - các lệnh CLI
- [SecretRef của Vault](/vi/plugins/vault) - thiết lập nhà cung cấp HashiCorp Vault
- [Biến môi trường](/vi/help/environment) - thứ tự ưu tiên của môi trường
- [Bề mặt thông tin xác thực SecretRef](/vi/reference/secretref-credential-surface) - bề mặt thông tin xác thực
- [Hợp đồng kế hoạch áp dụng bí mật](/vi/gateway/secrets-plan-contract) - chi tiết hợp đồng kế hoạch
- [Bảo mật](/vi/gateway/security) - trạng thái bảo mật
