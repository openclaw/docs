---
read_when:
    - Phân giải lại các tham chiếu bí mật trong thời gian chạy
    - Kiểm tra phần văn bản thuần còn sót lại và các tham chiếu chưa được phân giải
    - Cấu hình SecretRefs và áp dụng các thay đổi xóa một chiều
summary: Tài liệu tham khảo CLI cho `openclaw secrets` (tải lại, kiểm tra, cấu hình, áp dụng)
title: Bí mật
x-i18n:
    generated_at: "2026-07-19T05:40:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 61f6f81e358ca2e6a97ac9498186b32f7a74d16052d226c398dad0030d47211e
    source_path: cli/secrets.md
    workflow: 16
---

# `openclaw secrets`

Quản lý SecretRef và duy trì trạng thái ổn định của bản chụp runtime đang hoạt động.

| Lệnh        | Vai trò                                                                                                                                                                                                                     |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `reload`    | RPC Gateway (`secrets.reload`): phân giải lại các tham chiếu và phát hành nguyên tử bản chụp runtime có nhận biết chủ sở hữu (không ghi cấu hình); lỗi của chủ sở hữu đủ điều kiện có thể được phát hành dưới dạng cảnh báo lạnh hoặc cũ |
| `audit`     | Quét chỉ đọc các kho cấu hình/xác thực/mô hình được tạo và phần dư cũ để tìm văn bản thuần, tham chiếu chưa phân giải và sai lệch thứ tự ưu tiên (bỏ qua tham chiếu exec trừ khi `--allow-exec`)                                  |
| `configure` | Trình lập kế hoạch tương tác để thiết lập nhà cung cấp, ánh xạ đích và kiểm tra trước (yêu cầu TTY)                                                                                                                          |
| `apply`     | Thực thi kế hoạch đã lưu (`--dry-run` chỉ xác thực và mặc định bỏ qua kiểm tra exec; chế độ ghi từ chối kế hoạch chứa exec trừ khi `--allow-exec`), sau đó xóa sạch phần dư văn bản thuần được nhắm mục tiêu              |

Quy trình vận hành được khuyến nghị:

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets audit --check
openclaw secrets reload
```

Nếu kế hoạch chứa SecretRef/nhà cung cấp `exec`, hãy truyền `--allow-exec` cho cả lệnh `apply` chạy thử và ghi.

Mã thoát cho CI/cổng kiểm tra:

- `audit --check` trả về `1` khi có phát hiện.
- Tham chiếu chưa phân giải trả về `2` (bất kể `--check`).

Liên quan: [Quản lý bí mật](/vi/gateway/secrets) · [Bề mặt thông tin xác thực SecretRef](/vi/reference/secretref-credential-surface) · [Bảo mật](/vi/gateway/security)

## Tải lại bản chụp runtime

```bash
openclaw secrets reload
openclaw secrets reload --json
openclaw secrets reload --url ws://127.0.0.1:18789 --token <token>
```

Sử dụng phương thức RPC Gateway `secrets.reload`. Các chủ sở hữu ổn định được làm mới độc lập. Chủ sở hữu bị lỗi đủ điều kiện chỉ trở thành cũ khi danh tính tham chiếu, định nghĩa nhà cung cấp và toàn bộ hợp đồng chủ sở hữu không chứa bí mật của chúng không thay đổi; lỗi mới hoặc đã thay đổi trở thành lạnh. Quá trình kích hoạt suy giảm này thành công và báo cáo `warningCount`. Lỗi nghiêm ngặt hoặc chưa được ánh xạ trả về lỗi và giữ nguyên bản chụp đang hoạt động trước đó.

Tùy chọn: `--url <url>`, `--token <token>`, `--timeout <ms>`, `--json`.

## Kiểm tra

Quét trạng thái OpenClaw để tìm:

- lưu trữ bí mật dưới dạng văn bản thuần
- tham chiếu chưa phân giải
- sai lệch thứ tự ưu tiên (thông tin xác thực `auth-profiles.json` che khuất tham chiếu `openclaw.json`)
- phần dư `agents/*/agent/models.json` được tạo (giá trị `apiKey` của nhà cung cấp và tiêu đề nhạy cảm của nhà cung cấp)
- phần dư cũ (mục nhập kho xác thực cũ, lời nhắc OAuth)

Quá trình quét `.env` bao gồm thư mục trạng thái có hiệu lực và thư mục chứa cấu hình đang hoạt động. Khi cả hai đường dẫn chỉ đến cùng một tệp, tệp đó chỉ được quét một lần.

Việc phát hiện tiêu đề nhạy cảm của nhà cung cấp dựa trên phương pháp phỏng đoán theo tên: đánh dấu các tiêu đề có tên khớp với những đoạn thường gặp liên quan đến xác thực/thông tin xác thực (`authorization`, `x-api-key`, `token`, `secret`, `password`, `credential`).

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

## Cấu hình (trình trợ giúp tương tác)

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

Luồng: trước tiên thiết lập nhà cung cấp (thêm/sửa/xóa bí danh `secrets.providers`), sau đó ánh xạ thông tin xác thực (chọn trường, gán tham chiếu `{source, provider, id}`), rồi kiểm tra trước và tùy chọn áp dụng.

Cờ:

- `--providers-only`: chỉ cấu hình `secrets.providers`, bỏ qua ánh xạ thông tin xác thực
- `--skip-provider-setup`: bỏ qua thiết lập nhà cung cấp, ánh xạ thông tin xác thực tới các nhà cung cấp hiện có
- `--agent <id>`: giới hạn việc khám phá và ghi đích `auth-profiles.json` trong một kho tác tử
- `--allow-exec`: cho phép kiểm tra SecretRef exec trong quá trình kiểm tra trước/áp dụng (có thể thực thi lệnh của nhà cung cấp)

Không thể kết hợp `--providers-only` và `--skip-provider-setup`.

Lưu ý:

- Yêu cầu TTY tương tác.
- Nhắm tới các trường chứa bí mật trong `openclaw.json` cùng với `auth-profiles.json` cho phạm vi tác tử đã chọn; bề mặt được hỗ trợ chính thức: [Bề mặt thông tin xác thực SecretRef](/vi/reference/secretref-credential-surface).
- Hỗ trợ tạo ánh xạ `auth-profiles.json` mới trực tiếp trong luồng chọn.
- Chạy phân giải kiểm tra trước trước khi áp dụng.
- Theo mặc định, các kế hoạch được tạo sẽ bật các tùy chọn xóa sạch (`scrubEnv`, `scrubAuthProfilesForProviderTargets`, `scrubLegacyAuthJson`). Việc áp dụng là một chiều đối với các giá trị văn bản thuần đã bị xóa sạch.
- `--plan-out` từ chối tạo kế hoạch có dạng tuần tự hóa UTF-8 vượt quá 16 MiB (16,777,216 byte), khớp với giới hạn đầu vào `apply --from`.
- Nếu không có `--apply`, CLI vẫn nhắc `Apply this plan now?` sau khi kiểm tra trước.
- Với `--apply` (và không có `--yes`), CLI yêu cầu thêm một xác nhận về quá trình di chuyển không thể đảo ngược.
- `--json` in kế hoạch + báo cáo kiểm tra trước, nhưng vẫn yêu cầu TTY tương tác.

### An toàn của nhà cung cấp exec

Các bản cài đặt Homebrew thường cung cấp tệp nhị phân qua liên kết tượng trưng trong `/opt/homebrew/bin/*`. Chỉ đặt `allowSymlinkCommand: true` khi cần cho các đường dẫn trình quản lý gói đáng tin cậy, kết hợp với `trustedDirs` (ví dụ `["/opt/homebrew"]`). Trên Windows, nếu không thể xác minh ACL cho đường dẫn nhà cung cấp, OpenClaw sẽ từ chối theo nguyên tắc an toàn; chỉ với các đường dẫn đáng tin cậy, hãy đặt `allowInsecurePath: true` trên nhà cung cấp đó để bỏ qua kiểm tra bảo mật đường dẫn.

## Áp dụng kế hoạch đã lưu

```bash
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --json
```

`--dry-run` xác thực kiểm tra trước mà không ghi tệp; kiểm tra SecretRef exec mặc định bị bỏ qua khi chạy thử. Chế độ ghi từ chối các kế hoạch chứa SecretRef/nhà cung cấp exec trừ khi `--allow-exec`. Sử dụng `--allow-exec` để chủ động cho phép kiểm tra/thực thi nhà cung cấp exec trong cả hai chế độ.

`--from` phải trỏ đến một tệp thông thường không lớn hơn 16 MiB (16,777,216 byte). Giới hạn byte áp dụng cho toàn bộ tệp được tuần tự hóa, bao gồm cả khoảng trắng.

Những nội dung `apply` có thể cập nhật:

- `openclaw.json` (đích SecretRef + chèn mới/cập nhật/xóa nhà cung cấp)
- `auth-profiles.json` (xóa sạch đích của nhà cung cấp)
- phần dư `auth.json` cũ
- các tệp `.env` trong thư mục trạng thái có hiệu lực và thư mục cấu hình đang hoạt động, đối với các khóa bí mật đã biết có giá trị đã được di chuyển

Chi tiết hợp đồng kế hoạch (đường dẫn đích được phép, quy tắc xác thực, ngữ nghĩa lỗi): [Hợp đồng kế hoạch áp dụng bí mật](/vi/gateway/secrets-plan-contract).

### Tại sao không có bản sao lưu hoàn tác

`secrets apply` chủ ý không ghi các bản sao lưu hoàn tác chứa giá trị văn bản thuần cũ. Độ an toàn đến từ quá trình kiểm tra trước nghiêm ngặt kết hợp với áp dụng gần như nguyên tử, cùng khả năng khôi phục trong bộ nhớ theo nỗ lực tốt nhất khi xảy ra lỗi.

## Ví dụ

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets audit --check
```

Nếu `audit --check` vẫn báo cáo các phát hiện văn bản thuần, hãy cập nhật những đường dẫn đích còn lại được báo cáo và chạy lại kiểm tra.

## Liên quan

- [Tài liệu tham khảo CLI](/vi/cli)
- [Quản lý bí mật](/vi/gateway/secrets)
- [SecretRef của Vault](/vi/plugins/vault)
