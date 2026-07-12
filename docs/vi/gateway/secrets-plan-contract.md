---
read_when:
    - Tạo hoặc xem xét các kế hoạch `openclaw secrets apply`
    - Gỡ lỗi các lỗi `Invalid plan target path`
    - Tìm hiểu hành vi xác thực loại đích và đường dẫn
summary: 'Hợp đồng cho các kế hoạch `secrets apply`: xác thực đích, đối sánh đường dẫn và phạm vi đích `auth-profiles.json`'
title: Hợp đồng kế hoạch áp dụng bí mật
x-i18n:
    generated_at: "2026-07-12T07:56:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ddaf3df7f0be326fa1c8dc8c360b03697fb58329d03c4eb8106a8740ddf6c47a
    source_path: gateway/secrets-plan-contract.md
    workflow: 16
---

Trang này định nghĩa hợp đồng nghiêm ngặt được `openclaw secrets apply` thực thi. Nếu một đích không khớp với các quy tắc này, thao tác áp dụng sẽ thất bại trước khi sửa đổi bất kỳ tệp nào.

## Cấu trúc tệp kế hoạch

`openclaw secrets apply --from <plan.json>` yêu cầu một mảng `targets` gồm các đích trong kế hoạch:

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

`openclaw secrets configure` tạo các kế hoạch theo cấu trúc này. Bạn cũng có thể tự viết hoặc chỉnh sửa một kế hoạch.

## Thêm mới hoặc cập nhật và xóa nhà cung cấp

Kế hoạch cũng có thể bao gồm hai trường cấp cao nhất tùy chọn để sửa đổi ánh xạ `secrets.providers` cùng với các thao tác ghi cho từng đích:

- `providerUpserts` -- một đối tượng được lập chỉ mục theo bí danh nhà cung cấp. Mỗi giá trị là một định nghĩa nhà cung cấp (có cùng cấu trúc được chấp nhận tại `secrets.providers.<alias>` trong `openclaw.json`, ví dụ nhà cung cấp `exec` hoặc `file`).
- `providerDeletes` -- một mảng các bí danh nhà cung cấp cần xóa.

`providerUpserts` chạy trước `targets`, vì vậy `target.ref.provider` có thể tham chiếu đến một bí danh nhà cung cấp mà chính kế hoạch đó đưa vào trong `providerUpserts`. Nếu không có thứ tự này, các kế hoạch tham chiếu đến một bí danh chưa được cấu hình trong `openclaw.json` sẽ thất bại với lỗi `provider "<alias>" is not configured`.

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

Các nhà cung cấp exec được đưa vào qua `providerUpserts` vẫn phải tuân theo các quy tắc chấp thuận exec trong [Hành vi chấp thuận nhà cung cấp exec](#exec-provider-consent-behavior): các kế hoạch chứa nhà cung cấp exec yêu cầu `--allow-exec` ở chế độ ghi.

## Phạm vi đích được hỗ trợ

Các đích trong kế hoạch được chấp nhận đối với những đường dẫn thông tin xác thực được hỗ trợ trong [Bề mặt thông tin xác thực SecretRef](/vi/reference/secretref-credential-surface).

## Hành vi của loại đích

`target.type` phải là một loại đích được nhận dạng và `target.path` đã chuẩn hóa phải khớp với cấu trúc đường dẫn đã đăng ký của loại đó.

Ngoài tên loại chính tắc, một số loại đích chấp nhận bí danh tương thích làm `target.type` cho các kế hoạch hiện có:

| Loại chính tắc                        | Bí danh được chấp nhận                           |
| ------------------------------------- | ----------------------------------------------- |
| `models.providers.apiKey`             | `models.providers.*.apiKey`                     |
| `skills.entries.apiKey`               | `skills.entries.*.apiKey`                       |
| `channels.googlechat.serviceAccount`  | `channels.googlechat.accounts.*.serviceAccount` |

## Quy tắc xác thực đường dẫn

Mỗi đích được xác thực theo tất cả các quy tắc sau:

- `type` phải là một loại đích được nhận dạng.
- `path` phải là một đường dẫn dấu chấm không rỗng.
- Có thể bỏ qua `pathSegments`. Nếu được cung cấp, giá trị này sau khi chuẩn hóa phải tạo ra chính xác cùng đường dẫn với `path`.
- Các đoạn bị cấm sẽ bị từ chối: `__proto__`, `prototype`, `constructor`.
- Đường dẫn đã chuẩn hóa phải khớp với cấu trúc đường dẫn đã đăng ký cho loại đích.
- Nếu `providerId` hoặc `accountId` được đặt, giá trị đó phải khớp với mã định danh được mã hóa trong đường dẫn.
- Các đích trong `auth-profiles.json` yêu cầu `agentId`.
- Khi tạo một ánh xạ `auth-profiles.json` mới, hãy bao gồm `authProfileProvider`.

## Hành vi khi thất bại

Nếu một đích không vượt qua bước xác thực, thao tác áp dụng sẽ thoát với lỗi như:

```text
Invalid plan target path for models.providers.apiKey: models.providers.openai.baseUrl
```

Không có thao tác ghi nào được xác nhận đối với một kế hoạch không hợp lệ: quá trình phân giải đích và xác thực đường dẫn diễn ra trước khi bất kỳ tệp nào bị tác động. Ngoài ra, sau khi một kế hoạch hợp lệ bắt đầu ghi, thao tác áp dụng sẽ tạo ảnh chụp nhanh của mọi tệp bị tác động trước, rồi khôi phục các ảnh chụp nhanh đó nếu một thao tác ghi sau đó trong cùng lần chạy thất bại. Nhờ vậy, thao tác ghi một phần không bao giờ khiến trạng thái cấu hình, hồ sơ xác thực hoặc biến môi trường mất đồng bộ.

## Hành vi chấp thuận nhà cung cấp exec

- Theo mặc định, `--dry-run` bỏ qua các bước kiểm tra SecretRef dạng exec.
- Các kế hoạch chứa SecretRef/nhà cung cấp dạng exec sẽ bị từ chối ở chế độ ghi trừ khi đặt `--allow-exec`.
- Khi xác thực hoặc áp dụng các kế hoạch chứa exec, hãy truyền `--allow-exec` trong cả lệnh chạy thử và lệnh ghi.

## Ghi chú về phạm vi thời gian chạy và kiểm tra

- Các mục chỉ chứa tham chiếu trong `auth-profiles.json` (`keyRef`/`tokenRef`) được đưa vào quá trình phân giải thông tin xác thực khi chạy và phạm vi kiểm tra.
- `secrets apply` ghi các đích `openclaw.json` được hỗ trợ, các đích `auth-profiles.json` được hỗ trợ và ba lượt xóa dữ liệu tùy chọn, mỗi lượt đều được bật theo mặc định: `scrubEnv` (xóa các giá trị văn bản thuần đã di chuyển khỏi `.env`), `scrubAuthProfilesForProviderTargets` (xóa phần dư văn bản thuần hoặc tham chiếu không dùng trong `auth-profiles.json` đối với các nhà cung cấp mà kế hoạch vừa di chuyển) và `scrubLegacyAuthJson` (loại bỏ các mục `api_key` đã di chuyển khỏi các kho `auth.json` cũ). Đặt bất kỳ giá trị nào trong `options.scrubEnv`, `options.scrubAuthProfilesForProviderTargets`, `options.scrubLegacyAuthJson` thành `false` trong kế hoạch để bỏ qua lượt tương ứng.

## Kiểm tra dành cho người vận hành

```bash
# Xác thực kế hoạch mà không ghi
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run

# Sau đó áp dụng thực tế
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json

# Với các kế hoạch chứa exec, hãy cho phép rõ ràng trong cả hai chế độ
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
```

Nếu thao tác áp dụng thất bại với thông báo đường dẫn đích không hợp lệ, hãy tạo lại kế hoạch bằng `openclaw secrets configure` hoặc sửa đường dẫn đích thành một cấu trúc được hỗ trợ ở trên.

## Tài liệu liên quan

- [Quản lý bí mật](/vi/gateway/secrets)
- [CLI `secrets`](/vi/cli/secrets)
- [Bề mặt thông tin xác thực SecretRef](/vi/reference/secretref-credential-surface)
- [Tham chiếu cấu hình](/vi/gateway/configuration-reference)
