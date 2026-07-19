---
read_when:
    - Tạo hoặc review các kế hoạch `openclaw secrets apply`
    - Gỡ lỗi các lỗi `Invalid plan target path`
    - Tìm hiểu hành vi xác thực loại đích và đường dẫn
summary: 'Hợp đồng cho các kế hoạch `secrets apply`: xác thực mục tiêu, khớp đường dẫn và phạm vi mục tiêu `auth-profiles.json`'
title: Hợp đồng kế hoạch áp dụng bí mật
x-i18n:
    generated_at: "2026-07-19T05:54:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 71ee8afd958646930af4db3bbad08e033ff79da48890a989d72b361abcbda3bb
    source_path: gateway/secrets-plan-contract.md
    workflow: 16
---

Trang này xác định hợp đồng nghiêm ngặt được `openclaw secrets apply` thực thi. Nếu một mục tiêu không khớp với các quy tắc này, thao tác áp dụng sẽ thất bại trước khi sửa đổi bất kỳ tệp nào.

## Yêu cầu đối với tệp kế hoạch

`openclaw secrets apply --from <plan.json>` chấp nhận các tệp thông thường có kích thước tối đa 16 MiB (16,777,216 byte). Giới hạn này áp dụng cho toàn bộ tệp đã tuần tự hóa, bao gồm cả khoảng trắng. Thư mục, FIFO, tệp thiết bị và các tệp lớn hơn giới hạn sẽ bị từ chối trước khi phân tích cú pháp JSON hoặc xác thực mục tiêu.

`openclaw secrets configure --plan-out <plan.json>` áp dụng cùng giới hạn cho đầu ra UTF-8 đã tuần tự hóa trước khi tạo tệp. Các kế hoạch viết thủ công và trình tạo kế hoạch bên ngoài cũng phải giữ tệp đã tuần tự hóa trong giới hạn này.

## Cấu trúc tệp kế hoạch

`openclaw secrets apply --from <plan.json>` yêu cầu một mảng `targets` gồm các mục tiêu kế hoạch:

```json5
{
  version: 1,
  protocolVersion: 1,
  targets: [
    {
      type: "models.providers.apiKey",
      path: "models.providers.openai.apiKey",
      pathSegments: ["models", "providers", "openai", "apiKey"],
      providerId: "openai",
      ref: { source: "env", provider: "default", id: "OPENAI_API_KEY" },
    },
    {
      type: "auth-profiles.api_key.key",
      path: "profiles.openai:default.key",
      pathSegments: ["profiles", "openai:default", "key"],
      agentId: "main",
      ref: { source: "env", provider: "default", id: "OPENAI_API_KEY" },
    },
  ],
}
```

`openclaw secrets configure` tạo kế hoạch theo cấu trúc này. Bạn cũng có thể viết hoặc chỉnh sửa thủ công.

## Thêm hoặc cập nhật và xóa nhà cung cấp

Kế hoạch cũng có thể bao gồm hai trường cấp cao nhất tùy chọn để sửa đổi ánh xạ `secrets.providers` cùng với các thao tác ghi cho từng mục tiêu:

- `providerUpserts` -- một đối tượng được định danh theo bí danh nhà cung cấp. Mỗi giá trị là một định nghĩa nhà cung cấp (cùng cấu trúc được chấp nhận trong `secrets.providers.<alias>` thuộc `openclaw.json`, ví dụ như nhà cung cấp `exec` hoặc `file`).
- `providerDeletes` -- một mảng các bí danh nhà cung cấp cần xóa.

`providerUpserts` chạy trước `targets`, vì vậy một `target.ref.provider` có thể tham chiếu đến bí danh nhà cung cấp mà chính kế hoạch đó thêm vào trong `providerUpserts`. Nếu không có thứ tự này, các kế hoạch tham chiếu đến bí danh chưa được cấu hình trong `openclaw.json` sẽ thất bại với `provider "<alias>" is not configured`.

```json5
{
  version: 1,
  protocolVersion: 1,
  providerUpserts: {
    onepassword_anthropic: {
      source: "exec",
      command: "/usr/bin/op",
      args: ["read", "op://Vault/Anthropic/credential"],
    },
  },
  providerDeletes: ["legacy_unused_alias"],
  targets: [
    {
      type: "models.providers.apiKey",
      path: "models.providers.anthropic.apiKey",
      pathSegments: ["models", "providers", "anthropic", "apiKey"],
      providerId: "anthropic",
      ref: { source: "exec", provider: "onepassword_anthropic", id: "credential" },
    },
  ],
}
```

Các nhà cung cấp thực thi được thêm qua `providerUpserts` vẫn phải tuân theo quy tắc đồng ý thực thi trong [Hành vi đồng ý đối với nhà cung cấp thực thi](#exec-provider-consent-behavior): các kế hoạch chứa nhà cung cấp thực thi yêu cầu `--allow-exec` trong chế độ ghi.

## Phạm vi mục tiêu được hỗ trợ

Các mục tiêu kế hoạch được chấp nhận cho những đường dẫn thông tin xác thực được hỗ trợ trong [Bề mặt thông tin xác thực SecretRef](/vi/reference/secretref-credential-surface).

## Hành vi của loại mục tiêu

`target.type` phải là một loại mục tiêu được nhận dạng và `target.path` đã chuẩn hóa phải khớp với cấu trúc đường dẫn đã đăng ký của loại đó.

Ngoài tên loại chính tắc, một số loại mục tiêu còn chấp nhận bí danh tương thích làm `target.type` cho các kế hoạch hiện có:

| Loại chính tắc                       | Bí danh được chấp nhận                           |
| ------------------------------------ | ----------------------------------------------- |
| `models.providers.apiKey`            | `models.providers.*.apiKey`                     |
| `skills.entries.apiKey`              | `skills.entries.*.apiKey`                       |
| `channels.googlechat.serviceAccount` | `channels.googlechat.accounts.*.serviceAccount` |

## Quy tắc xác thực đường dẫn

Mỗi mục tiêu được xác thực theo tất cả các điều kiện sau:

- `type` phải là một loại mục tiêu được nhận dạng.
- `path` phải là một đường dẫn dấu chấm không rỗng.
- `pathSegments` có thể được bỏ qua. Nếu được cung cấp, giá trị này phải được chuẩn hóa thành chính xác cùng đường dẫn với `path`.
- Các phân đoạn bị cấm sẽ bị từ chối: `__proto__`, `prototype`, `constructor`.
- Đường dẫn đã chuẩn hóa phải khớp với cấu trúc đường dẫn đã đăng ký cho loại mục tiêu.
- Nếu `providerId` hoặc `accountId` được đặt, giá trị đó phải khớp với mã định danh được mã hóa trong đường dẫn.
- Các mục tiêu `auth-profiles.json` yêu cầu `agentId`.
- Khi tạo ánh xạ `auth-profiles.json` mới, hãy bao gồm `authProfileProvider`.

## Hành vi khi thất bại

Nếu một mục tiêu không vượt qua xác thực, thao tác áp dụng sẽ thoát với lỗi như:

```text
Đường dẫn mục tiêu kế hoạch không hợp lệ cho models.providers.apiKey: models.providers.openai.baseUrl
```

Không thao tác ghi nào được xác nhận cho một kế hoạch không hợp lệ: quá trình phân giải mục tiêu và xác thực đường dẫn chạy trước khi bất kỳ tệp nào bị tác động. Ngoài ra, sau khi một kế hoạch hợp lệ bắt đầu ghi, thao tác áp dụng sẽ tạo ảnh chụp nhanh của mọi tệp bị tác động trước, rồi khôi phục các ảnh chụp nhanh đó nếu một thao tác ghi sau đó trong cùng lần chạy thất bại, nhờ đó thao tác ghi một phần không bao giờ khiến trạng thái cấu hình, hồ sơ xác thực hoặc môi trường mất đồng bộ.

## Hành vi đồng ý đối với nhà cung cấp thực thi

- `--dry-run` mặc định bỏ qua việc kiểm tra SecretRef thực thi.
- Các kế hoạch chứa SecretRef/nhà cung cấp thực thi sẽ bị từ chối trong chế độ ghi trừ khi `--allow-exec` được đặt.
- Khi xác thực/áp dụng các kế hoạch chứa nội dung thực thi, hãy truyền `--allow-exec` trong cả lệnh chạy thử và lệnh ghi.

## Ghi chú về phạm vi thời gian chạy và kiểm tra

- Các mục `auth-profiles.json` chỉ chứa tham chiếu (`keyRef`/`tokenRef`) được đưa vào quá trình phân giải thông tin xác thực trong thời gian chạy và phạm vi kiểm tra.
- `secrets apply` ghi các mục tiêu `openclaw.json` được hỗ trợ, các mục tiêu `auth-profiles.json` được hỗ trợ và ba lượt xóa sạch tùy chọn, mỗi lượt đều được bật theo mặc định: `scrubEnv` (xóa các giá trị văn bản thuần đã di chuyển khỏi các tệp `.env` trong thư mục trạng thái hiệu lực và cấu hình đang hoạt động), `scrubAuthProfilesForProviderTargets` (xóa phần dư văn bản thuần/tham chiếu không dùng đến trong `auth-profiles.json` đối với các nhà cung cấp mà kế hoạch vừa di chuyển) và `scrubLegacyAuthJson` (loại bỏ các mục `api_key` đã di chuyển khỏi kho `auth.json` cũ). Đặt bất kỳ giá trị nào trong `options.scrubEnv`, `options.scrubAuthProfilesForProviderTargets`, `options.scrubLegacyAuthJson` thành `false` trong kế hoạch để bỏ qua lượt tương ứng.

## Kiểm tra dành cho người vận hành

```bash
# Xác thực kế hoạch mà không ghi
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run

# Sau đó áp dụng thực sự
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json

# Đối với kế hoạch chứa nội dung thực thi, chủ động cho phép trong cả hai chế độ
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
```

Nếu thao tác áp dụng thất bại với thông báo đường dẫn mục tiêu không hợp lệ, hãy tạo lại kế hoạch bằng `openclaw secrets configure` hoặc sửa đường dẫn mục tiêu thành một cấu trúc được hỗ trợ ở trên.

## Tài liệu liên quan

- [Quản lý bí mật](/vi/gateway/secrets)
- [CLI `secrets`](/vi/cli/secrets)
- [Bề mặt thông tin xác thực SecretRef](/vi/reference/secretref-credential-surface)
- [Tài liệu tham khảo cấu hình](/vi/gateway/configuration-reference)
