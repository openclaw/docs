---
read_when:
    - Tạo hoặc rà soát kế hoạch `openclaw secrets apply`
    - Gỡ lỗi các lỗi `Invalid plan target path`
    - Tìm hiểu hành vi xác thực loại đích và đường dẫn
summary: 'Hợp đồng cho các kế hoạch `secrets apply`: xác thực đích, khớp đường dẫn và phạm vi đích `auth-profiles.json`'
title: Hợp đồng kế hoạch áp dụng bí mật
x-i18n:
    generated_at: "2026-06-27T17:32:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 03f0ca9b433553a2f6d86d01b8c227a24b6f53ef7034a94bd648fbf04c81f13e
    source_path: gateway/secrets-plan-contract.md
    workflow: 16
---

Trang này định nghĩa hợp đồng nghiêm ngặt được `openclaw secrets apply` thực thi.

Nếu một đích không khớp các quy tắc này, thao tác áp dụng sẽ thất bại trước khi thay đổi cấu hình.

## Hình dạng tệp kế hoạch

`openclaw secrets apply --from <plan.json>` kỳ vọng một mảng `targets` gồm các đích kế hoạch:

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

## Chèn mới/cập nhật và xóa provider

Kế hoạch cũng có thể bao gồm hai trường cấp cao nhất tùy chọn để thay đổi
ánh xạ `secrets.providers` cùng với các lần ghi theo từng đích:

- `providerUpserts` — một đối tượng được đánh khóa theo bí danh provider. Mỗi giá trị là một
  định nghĩa provider (cùng hình dạng được chấp nhận trong
  `secrets.providers.<alias>` của `openclaw.json`, ví dụ một provider `exec` hoặc `file`).
- `providerDeletes` — một mảng các bí danh provider cần xóa.

`providerUpserts` chạy trước `targets`, nên một `target.ref.provider` có thể
tham chiếu đến bí danh provider mà chính kế hoạch đó đưa vào trong
`providerUpserts`. Nếu không có điều này, các kế hoạch tham chiếu đến một bí danh chưa được
cấu hình trong `openclaw.json` sẽ thất bại với thông báo `provider "<alias>" is not
configured`.

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

Các provider exec được đưa vào thông qua `providerUpserts` vẫn chịu sự chi phối của
các quy tắc đồng ý exec trong [Hành vi đồng ý provider exec](#exec-provider-consent-behavior):
các kế hoạch chứa provider exec yêu cầu `--allow-exec` ở chế độ ghi.

## Phạm vi đích được hỗ trợ

Các đích kế hoạch được chấp nhận cho các đường dẫn thông tin xác thực được hỗ trợ trong:

- [Bề mặt thông tin xác thực SecretRef](/vi/reference/secretref-credential-surface)

## Hành vi của loại đích

Quy tắc chung:

- `target.type` phải được nhận diện và phải khớp với hình dạng `target.path` đã chuẩn hóa.

Các bí danh tương thích vẫn được chấp nhận cho các kế hoạch hiện có:

- `models.providers.apiKey`
- `skills.entries.apiKey`
- `channels.googlechat.serviceAccount`

## Quy tắc xác thực đường dẫn

Mỗi đích được xác thực theo tất cả các điều sau:

- `type` phải là một loại đích được nhận diện.
- `path` phải là một đường dẫn dấu chấm không rỗng.
- Có thể bỏ qua `pathSegments`. Nếu được cung cấp, nó phải chuẩn hóa thành đúng cùng một đường dẫn như `path`.
- Các đoạn bị cấm sẽ bị từ chối: `__proto__`, `prototype`, `constructor`.
- Đường dẫn đã chuẩn hóa phải khớp với hình dạng đường dẫn đã đăng ký cho loại đích.
- Nếu `providerId` hoặc `accountId` được đặt, nó phải khớp với id được mã hóa trong đường dẫn.
- Các đích `auth-profiles.json` yêu cầu `agentId`.
- Khi tạo một ánh xạ `auth-profiles.json` mới, hãy bao gồm `authProfileProvider`.

## Hành vi khi thất bại

Nếu một đích không vượt qua xác thực, thao tác áp dụng thoát với lỗi như:

```text
Invalid plan target path for models.providers.apiKey: models.providers.openai.baseUrl
```

Không có lần ghi nào được commit cho một kế hoạch không hợp lệ.

## Hành vi đồng ý provider exec

- `--dry-run` mặc định bỏ qua các kiểm tra SecretRef exec.
- Các kế hoạch chứa SecretRef/provider exec bị từ chối ở chế độ ghi trừ khi `--allow-exec` được đặt.
- Khi xác thực/áp dụng các kế hoạch chứa exec, hãy truyền `--allow-exec` trong cả lệnh dry-run và lệnh ghi.

## Ghi chú về phạm vi runtime và kiểm toán

- Các mục `auth-profiles.json` chỉ có ref (`keyRef`/`tokenRef`) được đưa vào phạm vi phân giải runtime và kiểm toán.
- `secrets apply` ghi các đích `openclaw.json` được hỗ trợ, các đích `auth-profiles.json` được hỗ trợ và các đích scrub tùy chọn.

## Kiểm tra cho operator

```bash
# Validate plan without writes
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run

# Then apply for real
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json

# For exec-containing plans, opt in explicitly in both modes
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
```

Nếu thao tác áp dụng thất bại với thông báo đường dẫn đích không hợp lệ, hãy tạo lại kế hoạch bằng `openclaw secrets configure` hoặc sửa đường dẫn đích thành một hình dạng được hỗ trợ ở trên.

## Tài liệu liên quan

- [Quản lý secrets](/vi/gateway/secrets)
- [CLI `secrets`](/vi/cli/secrets)
- [Bề mặt thông tin xác thực SecretRef](/vi/reference/secretref-credential-surface)
- [Tham chiếu cấu hình](/vi/gateway/configuration-reference)
