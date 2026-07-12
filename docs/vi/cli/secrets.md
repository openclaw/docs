---
read_when:
    - Phân giải lại các tham chiếu bí mật trong thời gian chạy
    - Kiểm tra các phần văn bản thuần còn sót lại và các tham chiếu chưa được xử lý
    - Cấu hình SecretRefs và áp dụng các thay đổi xóa một chiều
summary: Tài liệu tham khảo CLI cho `openclaw secrets` (tải lại, kiểm tra, cấu hình, áp dụng)
title: Bí mật
x-i18n:
    generated_at: "2026-07-12T07:46:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d1ac0d0f6e29ae52d9dd03e3333665062ccd961ed22a2b06ca7fa7fde128e177
    source_path: cli/secrets.md
    workflow: 16
---

# `openclaw secrets`

Quản lý SecretRef và duy trì trạng thái ổn định của bản chụp runtime đang hoạt động.

| Lệnh        | Vai trò                                                                                                                                                                                                                       |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `reload`    | RPC của Gateway (`secrets.reload`): phân giải lại các tham chiếu và chỉ hoán đổi bản chụp runtime khi thành công hoàn toàn (không ghi cấu hình)                                                                                |
| `audit`     | Quét chỉ đọc các kho cấu hình/xác thực/mô hình đã tạo và phần dư cũ để tìm văn bản thuần, tham chiếu chưa phân giải và sai lệch thứ tự ưu tiên (bỏ qua tham chiếu exec trừ khi có `--allow-exec`)                               |
| `configure` | Trình lập kế hoạch tương tác để thiết lập nhà cung cấp, ánh xạ đích và kiểm tra trước (yêu cầu TTY)                                                                                                                            |
| `apply`     | Thực thi kế hoạch đã lưu (`--dry-run` chỉ xác thực và mặc định bỏ qua kiểm tra exec; chế độ ghi từ chối kế hoạch chứa exec trừ khi có `--allow-exec`), sau đó xóa sạch phần dư văn bản thuần tại các đích được chỉ định |

Quy trình vận hành được khuyến nghị:

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets audit --check
openclaw secrets reload
```

Nếu kế hoạch của bạn bao gồm SecretRef/nhà cung cấp `exec`, hãy truyền `--allow-exec` cho cả lệnh `apply` chạy thử và lệnh ghi.

Mã thoát dành cho CI/cổng kiểm tra:

- `audit --check` trả về `1` khi phát hiện vấn đề.
- Tham chiếu chưa phân giải trả về `2` (bất kể có `--check` hay không).

Liên quan: [Quản lý bí mật](/vi/gateway/secrets) · [Bề mặt thông tin xác thực SecretRef](/vi/reference/secretref-credential-surface) · [Bảo mật](/vi/gateway/security)

## Tải lại bản chụp runtime

```bash
openclaw secrets reload
openclaw secrets reload --json
openclaw secrets reload --url ws://127.0.0.1:18789 --token <token>
```

Sử dụng phương thức RPC `secrets.reload` của Gateway. Nếu phân giải thất bại, Gateway giữ lại bản chụp hợp lệ gần nhất và trả về lỗi (không kích hoạt một phần). Phản hồi JSON bao gồm `warningCount`.

Tùy chọn: `--url <url>`, `--token <token>`, `--timeout <ms>`, `--json`.

## Kiểm tra

Quét trạng thái OpenClaw để tìm:

- bí mật được lưu dưới dạng văn bản thuần
- tham chiếu chưa phân giải
- sai lệch thứ tự ưu tiên (thông tin xác thực trong `auth-profiles.json` che khuất các tham chiếu trong `openclaw.json`)
- phần dư trong `agents/*/agent/models.json` đã tạo (giá trị `apiKey` của nhà cung cấp và các tiêu đề nhạy cảm của nhà cung cấp)
- phần dư cũ (mục trong kho xác thực cũ, lời nhắc OAuth)

Việc phát hiện tiêu đề nhạy cảm của nhà cung cấp dựa trên phương pháp suy đoán theo tên: hệ thống đánh dấu các tiêu đề có tên khớp với những thành phần xác thực/thông tin xác thực phổ biến (`authorization`, `x-api-key`, `token`, `secret`, `password`, `credential`).

```bash
openclaw secrets audit
openclaw secrets audit --check
openclaw secrets audit --json
openclaw secrets audit --allow-exec
```

Cấu trúc báo cáo:

- `status`: `clean | findings | unresolved`
- `resolution`: `refsChecked`, `skippedExecRefs`, `resolvabilityComplete`
- `summary`: `plaintextCount`, `unresolvedRefCount`, `shadowedRefCount`, `legacyResidueCount`
- mã phát hiện: `PLAINTEXT_FOUND`, `REF_UNRESOLVED`, `REF_SHADOWED`, `LEGACY_RESIDUE`

## Cấu hình (trợ giúp tương tác)

Tạo các thay đổi cho nhà cung cấp và SecretRef theo cách tương tác, chạy kiểm tra trước và tùy chọn áp dụng:

```bash
openclaw secrets configure
openclaw secrets configure --plan-out /tmp/openclaw-secrets-plan.json
openclaw secrets configure --apply --yes
openclaw secrets configure --providers-only
openclaw secrets configure --skip-provider-setup
openclaw secrets configure --agent ops
openclaw secrets configure --json
```

Quy trình: trước tiên thiết lập nhà cung cấp (thêm/sửa/xóa bí danh `secrets.providers`), sau đó ánh xạ thông tin xác thực (chọn trường, gán tham chiếu `{source, provider, id}`), rồi kiểm tra trước và tùy chọn áp dụng.

Cờ:

- `--providers-only`: chỉ cấu hình `secrets.providers`, bỏ qua ánh xạ thông tin xác thực
- `--skip-provider-setup`: bỏ qua thiết lập nhà cung cấp, ánh xạ thông tin xác thực đến các nhà cung cấp hiện có
- `--agent <id>`: giới hạn việc phát hiện đích và ghi `auth-profiles.json` vào kho của một tác nhân
- `--allow-exec`: cho phép kiểm tra SecretRef exec trong quá trình kiểm tra trước/áp dụng (có thể thực thi lệnh của nhà cung cấp)

Không thể kết hợp `--providers-only` và `--skip-provider-setup`.

Lưu ý:

- Yêu cầu TTY tương tác.
- Nhắm đến các trường chứa bí mật trong `openclaw.json` cùng với `auth-profiles.json` cho phạm vi tác nhân đã chọn; bề mặt được hỗ trợ chính thức: [Bề mặt thông tin xác thực SecretRef](/vi/reference/secretref-credential-surface).
- Hỗ trợ tạo trực tiếp ánh xạ `auth-profiles.json` mới trong quy trình chọn.
- Chạy phân giải kiểm tra trước trước khi áp dụng.
- Các kế hoạch được tạo mặc định bật các tùy chọn xóa sạch (`scrubEnv`, `scrubAuthProfilesForProviderTargets`, `scrubLegacyAuthJson`). Việc áp dụng là một chiều đối với các giá trị văn bản thuần đã bị xóa sạch.
- Khi không có `--apply`, CLI vẫn hỏi `Apply this plan now?` sau khi kiểm tra trước.
- Khi có `--apply` (và không có `--yes`), CLI yêu cầu thêm một xác nhận về quá trình di chuyển không thể đảo ngược.
- `--json` in kế hoạch cùng báo cáo kiểm tra trước, nhưng vẫn yêu cầu TTY tương tác.

### An toàn cho nhà cung cấp exec

Các bản cài đặt Homebrew thường cung cấp tệp nhị phân qua liên kết tượng trưng trong `/opt/homebrew/bin/*`. Chỉ đặt `allowSymlinkCommand: true` khi cần cho các đường dẫn trình quản lý gói đáng tin cậy, kết hợp với `trustedDirs` (ví dụ `["/opt/homebrew"]`). Trên Windows, nếu không thể xác minh ACL cho đường dẫn của nhà cung cấp, OpenClaw sẽ từ chối theo mặc định; chỉ với các đường dẫn đáng tin cậy, hãy đặt `allowInsecurePath: true` cho nhà cung cấp đó để bỏ qua kiểm tra bảo mật đường dẫn.

## Áp dụng kế hoạch đã lưu

```bash
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --json
```

`--dry-run` xác thực bước kiểm tra trước mà không ghi tệp; các kiểm tra SecretRef exec mặc định bị bỏ qua khi chạy thử. Chế độ ghi từ chối kế hoạch chứa SecretRef/nhà cung cấp exec trừ khi có `--allow-exec`. Dùng `--allow-exec` để chủ động cho phép kiểm tra/thực thi nhà cung cấp exec trong cả hai chế độ.

Những nội dung `apply` có thể cập nhật:

- `openclaw.json` (đích SecretRef + cập nhật hoặc xóa nhà cung cấp)
- `auth-profiles.json` (xóa sạch đích nhà cung cấp)
- phần dư trong `auth.json` cũ
- các khóa bí mật đã biết trong `~/.openclaw/.env` có giá trị đã được di chuyển

Chi tiết hợp đồng kế hoạch (đường dẫn đích được phép, quy tắc xác thực, ngữ nghĩa khi thất bại): [Hợp đồng kế hoạch áp dụng bí mật](/vi/gateway/secrets-plan-contract).

### Vì sao không có bản sao lưu để hoàn tác

`secrets apply` chủ ý không ghi bản sao lưu hoàn tác chứa các giá trị văn bản thuần cũ. Mức độ an toàn đến từ bước kiểm tra trước nghiêm ngặt kết hợp với quá trình áp dụng gần như nguyên tử, cùng nỗ lực khôi phục trong bộ nhớ khi xảy ra lỗi.

## Ví dụ

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets audit --check
```

Nếu `audit --check` vẫn báo cáo các phát hiện văn bản thuần, hãy cập nhật những đường dẫn đích còn lại được báo cáo rồi chạy lại kiểm tra.

## Liên quan

- [Tham chiếu CLI](/vi/cli)
- [Quản lý bí mật](/vi/gateway/secrets)
- [SecretRef của Vault](/plugins/vault)
