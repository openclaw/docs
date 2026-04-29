---
read_when:
    - Tạo hoặc rà soát các kế hoạch `openclaw secrets apply`
    - Gỡ lỗi các lỗi `Invalid plan target path`
    - Tìm hiểu hành vi xác thực loại đích và đường dẫn
summary: 'Hợp đồng cho các kế hoạch `secrets apply`: xác thực mục tiêu, khớp đường dẫn và phạm vi mục tiêu `auth-profiles.json`'
title: Hợp đồng kế hoạch áp dụng bí mật
x-i18n:
    generated_at: "2026-04-29T22:46:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 80214353a1368b249784aa084c714e043c2d515706357d4ba1f111a3c68d1a84
    source_path: gateway/secrets-plan-contract.md
    workflow: 16
---

Trang này định nghĩa hợp đồng nghiêm ngặt được `openclaw secrets apply` thực thi.

Nếu một mục tiêu không khớp các quy tắc này, apply sẽ thất bại trước khi thay đổi cấu hình.

## Hình dạng tệp kế hoạch

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

## Phạm vi mục tiêu được hỗ trợ

Các mục tiêu kế hoạch được chấp nhận cho những đường dẫn thông tin xác thực được hỗ trợ trong:

- [Bề mặt thông tin xác thực SecretRef](/vi/reference/secretref-credential-surface)

## Hành vi kiểu mục tiêu

Quy tắc chung:

- `target.type` phải được nhận diện và phải khớp với hình dạng `target.path` đã chuẩn hóa.

Các bí danh tương thích vẫn được chấp nhận cho những kế hoạch hiện có:

- `models.providers.apiKey`
- `skills.entries.apiKey`
- `channels.googlechat.serviceAccount`

## Quy tắc xác thực đường dẫn

Mỗi mục tiêu được xác thực bằng tất cả các điều kiện sau:

- `type` phải là một kiểu mục tiêu được nhận diện.
- `path` phải là một đường dẫn dấu chấm không rỗng.
- Có thể bỏ qua `pathSegments`. Nếu được cung cấp, nó phải chuẩn hóa thành đúng cùng một đường dẫn với `path`.
- Các phân đoạn bị cấm sẽ bị từ chối: `__proto__`, `prototype`, `constructor`.
- Đường dẫn đã chuẩn hóa phải khớp với hình dạng đường dẫn đã đăng ký cho kiểu mục tiêu.
- Nếu `providerId` hoặc `accountId` được đặt, nó phải khớp với mã định danh được mã hóa trong đường dẫn.
- Các mục tiêu `auth-profiles.json` yêu cầu `agentId`.
- Khi tạo một ánh xạ `auth-profiles.json` mới, hãy bao gồm `authProfileProvider`.

## Hành vi thất bại

Nếu một mục tiêu không vượt qua xác thực, apply sẽ thoát với lỗi như:

```text
Invalid plan target path for models.providers.apiKey: models.providers.openai.baseUrl
```

Không có ghi nào được cam kết cho một kế hoạch không hợp lệ.

## Hành vi đồng ý của nhà cung cấp exec

- `--dry-run` bỏ qua các kiểm tra SecretRef exec theo mặc định.
- Các kế hoạch chứa SecretRef/nhà cung cấp exec sẽ bị từ chối ở chế độ ghi trừ khi `--allow-exec` được đặt.
- Khi xác thực/áp dụng các kế hoạch chứa exec, hãy truyền `--allow-exec` trong cả lệnh dry-run và lệnh ghi.

## Ghi chú về phạm vi runtime và kiểm toán

- Các mục nhập `auth-profiles.json` chỉ tham chiếu (`keyRef`/`tokenRef`) được đưa vào quá trình phân giải runtime và phạm vi kiểm toán.
- `secrets apply` ghi các mục tiêu `openclaw.json` được hỗ trợ, các mục tiêu `auth-profiles.json` được hỗ trợ, và các mục tiêu scrub tùy chọn.

## Kiểm tra dành cho người vận hành

```bash
# Validate plan without writes
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run

# Then apply for real
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json

# For exec-containing plans, opt in explicitly in both modes
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
```

Nếu apply thất bại với thông báo đường dẫn mục tiêu không hợp lệ, hãy tạo lại kế hoạch bằng `openclaw secrets configure` hoặc sửa đường dẫn mục tiêu thành một hình dạng được hỗ trợ ở trên.

## Tài liệu liên quan

- [Quản lý bí mật](/vi/gateway/secrets)
- [CLI `secrets`](/vi/cli/secrets)
- [Bề mặt thông tin xác thực SecretRef](/vi/reference/secretref-credential-surface)
- [Tham chiếu cấu hình](/vi/gateway/configuration-reference)
