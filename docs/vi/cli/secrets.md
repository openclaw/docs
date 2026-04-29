---
read_when:
    - Tái phân giải các tham chiếu bí mật trong thời gian chạy
    - Kiểm tra các phần còn sót lại dạng văn bản thuần và các tham chiếu chưa được giải quyết
    - Cấu hình SecretRefs và áp dụng các thay đổi xóa sạch một chiều
summary: Tham chiếu CLI cho `openclaw secrets` (reload, audit, configure, apply)
title: Bí mật
x-i18n:
    generated_at: "2026-04-29T22:34:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6fe1933ca6a9f2a24fbbe20fa3b83bf8f6493ea6c94061e135b4e1b48c33d62c
    source_path: cli/secrets.md
    workflow: 16
---

# `openclaw secrets`

Sử dụng `openclaw secrets` để quản lý SecretRefs và giữ cho bản chụp runtime đang hoạt động luôn ổn định.

Vai trò của lệnh:

- `reload`: RPC Gateway (`secrets.reload`) phân giải lại refs và chỉ hoán đổi bản chụp runtime khi thành công hoàn toàn (không ghi cấu hình).
- `audit`: quét chỉ đọc các kho cấu hình/xác thực/mô hình đã tạo và phần tồn dư cũ để tìm plaintext, refs chưa được phân giải và sai lệch thứ tự ưu tiên (refs exec được bỏ qua trừ khi đặt `--allow-exec`).
- `configure`: bộ lập kế hoạch tương tác cho thiết lập nhà cung cấp, ánh xạ đích và kiểm tra trước (yêu cầu TTY).
- `apply`: thực thi một kế hoạch đã lưu (`--dry-run` chỉ để xác thực; dry-run mặc định bỏ qua kiểm tra exec, và chế độ ghi từ chối các kế hoạch chứa exec trừ khi đặt `--allow-exec`), sau đó xóa các phần tồn dư plaintext được nhắm mục tiêu.

Vòng lặp vận hành được khuyến nghị:

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets audit --check
openclaw secrets reload
```

Nếu kế hoạch của bạn bao gồm SecretRefs/nhà cung cấp `exec`, hãy truyền `--allow-exec` cho cả lệnh apply dry-run và apply ghi.

Ghi chú về mã thoát cho CI/cổng kiểm tra:

- `audit --check` trả về `1` khi có phát hiện.
- refs chưa được phân giải trả về `2`.

Liên quan:

- Hướng dẫn bí mật: [Quản lý bí mật](/vi/gateway/secrets)
- Bề mặt thông tin xác thực: [Bề mặt thông tin xác thực SecretRef](/vi/reference/secretref-credential-surface)
- Hướng dẫn bảo mật: [Bảo mật](/vi/gateway/security)

## Tải lại bản chụp runtime

Phân giải lại các ref bí mật và hoán đổi nguyên tử bản chụp runtime.

```bash
openclaw secrets reload
openclaw secrets reload --json
openclaw secrets reload --url ws://127.0.0.1:18789 --token <token>
```

Ghi chú:

- Sử dụng phương thức RPC Gateway `secrets.reload`.
- Nếu phân giải thất bại, Gateway giữ bản chụp tốt đã biết gần nhất và trả về lỗi (không kích hoạt một phần).
- Phản hồi JSON bao gồm `warningCount`.

Tùy chọn:

- `--url <url>`
- `--token <token>`
- `--timeout <ms>`
- `--json`

## Kiểm tra

Quét trạng thái OpenClaw để tìm:

- lưu trữ bí mật plaintext
- refs chưa được phân giải
- sai lệch thứ tự ưu tiên (thông tin xác thực trong `auth-profiles.json` che khuất refs trong `openclaw.json`)
- phần tồn dư `agents/*/agent/models.json` đã tạo (giá trị `apiKey` của nhà cung cấp và header nhà cung cấp nhạy cảm)
- phần tồn dư cũ (mục kho xác thực cũ, lời nhắc OAuth)

Ghi chú về phần tồn dư header:

- Việc phát hiện header nhà cung cấp nhạy cảm dựa trên heuristic tên (tên header xác thực/thông tin xác thực phổ biến và các đoạn như `authorization`, `x-api-key`, `token`, `secret`, `password` và `credential`).

```bash
openclaw secrets audit
openclaw secrets audit --check
openclaw secrets audit --json
openclaw secrets audit --allow-exec
```

Hành vi thoát:

- `--check` thoát khác không khi có phát hiện.
- refs chưa được phân giải thoát với mã khác không có mức ưu tiên cao hơn.

Điểm nổi bật về hình dạng báo cáo:

- `status`: `clean | findings | unresolved`
- `resolution`: `refsChecked`, `skippedExecRefs`, `resolvabilityComplete`
- `summary`: `plaintextCount`, `unresolvedRefCount`, `shadowedRefCount`, `legacyResidueCount`
- mã phát hiện:
  - `PLAINTEXT_FOUND`
  - `REF_UNRESOLVED`
  - `REF_SHADOWED`
  - `LEGACY_RESIDUE`

## Cấu hình (trợ lý tương tác)

Xây dựng thay đổi nhà cung cấp và SecretRef theo cách tương tác, chạy kiểm tra trước và tùy chọn áp dụng:

```bash
openclaw secrets configure
openclaw secrets configure --plan-out /tmp/openclaw-secrets-plan.json
openclaw secrets configure --apply --yes
openclaw secrets configure --providers-only
openclaw secrets configure --skip-provider-setup
openclaw secrets configure --agent ops
openclaw secrets configure --json
```

Luồng:

- Thiết lập nhà cung cấp trước (`add/edit/remove` cho bí danh `secrets.providers`).
- Ánh xạ thông tin xác thực thứ hai (chọn trường và gán refs `{source, provider, id}`).
- Kiểm tra trước và tùy chọn áp dụng sau cùng.

Cờ:

- `--providers-only`: chỉ cấu hình `secrets.providers`, bỏ qua ánh xạ thông tin xác thực.
- `--skip-provider-setup`: bỏ qua thiết lập nhà cung cấp và ánh xạ thông tin xác thực tới nhà cung cấp hiện có.
- `--agent <id>`: giới hạn phạm vi phát hiện đích và ghi `auth-profiles.json` vào một kho tác tử.
- `--allow-exec`: cho phép kiểm tra SecretRef exec trong khi kiểm tra trước/áp dụng (có thể thực thi lệnh nhà cung cấp).

Ghi chú:

- Yêu cầu TTY tương tác.
- Bạn không thể kết hợp `--providers-only` với `--skip-provider-setup`.
- `configure` nhắm tới các trường chứa bí mật trong `openclaw.json` cùng với `auth-profiles.json` cho phạm vi tác tử đã chọn.
- `configure` hỗ trợ tạo trực tiếp các ánh xạ `auth-profiles.json` mới trong luồng bộ chọn.
- Bề mặt được hỗ trợ chính thức: [Bề mặt thông tin xác thực SecretRef](/vi/reference/secretref-credential-surface).
- Lệnh thực hiện phân giải kiểm tra trước trước khi áp dụng.
- Nếu kiểm tra trước/áp dụng bao gồm refs exec, hãy giữ `--allow-exec` được đặt cho cả hai bước.
- Kế hoạch đã tạo mặc định bật các tùy chọn xóa (`scrubEnv`, `scrubAuthProfilesForProviderTargets`, `scrubLegacyAuthJson` đều được bật).
- Đường dẫn áp dụng là một chiều đối với các giá trị plaintext đã bị xóa.
- Nếu không có `--apply`, CLI vẫn nhắc `Apply this plan now?` sau kiểm tra trước.
- Với `--apply` (và không có `--yes`), CLI nhắc thêm một xác nhận không thể đảo ngược.
- `--json` in kế hoạch + báo cáo kiểm tra trước, nhưng lệnh vẫn yêu cầu TTY tương tác.

Ghi chú an toàn cho nhà cung cấp exec:

- Các bản cài đặt Homebrew thường hiển thị binary được liên kết tượng trưng dưới `/opt/homebrew/bin/*`.
- Chỉ đặt `allowSymlinkCommand: true` khi cần cho các đường dẫn trình quản lý gói đáng tin cậy, và ghép với `trustedDirs` (ví dụ `["/opt/homebrew"]`).
- Trên Windows, nếu không thể xác minh ACL cho đường dẫn nhà cung cấp, OpenClaw sẽ đóng an toàn. Chỉ với các đường dẫn đáng tin cậy, đặt `allowInsecurePath: true` trên nhà cung cấp đó để bỏ qua kiểm tra bảo mật đường dẫn.

## Áp dụng kế hoạch đã lưu

Áp dụng hoặc kiểm tra trước một kế hoạch đã tạo trước đó:

```bash
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --json
```

Hành vi exec:

- `--dry-run` xác thực kiểm tra trước mà không ghi tệp.
- kiểm tra SecretRef exec mặc định bị bỏ qua trong dry-run.
- chế độ ghi từ chối các kế hoạch chứa SecretRefs/nhà cung cấp exec trừ khi đặt `--allow-exec`.
- Sử dụng `--allow-exec` để chọn tham gia kiểm tra/thực thi nhà cung cấp exec ở một trong hai chế độ.

Chi tiết hợp đồng kế hoạch (đường dẫn đích được phép, quy tắc xác thực và ngữ nghĩa lỗi):

- [Hợp đồng kế hoạch áp dụng bí mật](/vi/gateway/secrets-plan-contract)

Những gì `apply` có thể cập nhật:

- `openclaw.json` (đích SecretRef + upsert/xóa nhà cung cấp)
- `auth-profiles.json` (xóa theo đích nhà cung cấp)
- phần tồn dư `auth.json` cũ
- khóa bí mật đã biết trong `~/.openclaw/.env` có giá trị đã được di chuyển

## Tại sao không có bản sao lưu rollback

`secrets apply` cố ý không ghi bản sao lưu rollback chứa các giá trị plaintext cũ.

Sự an toàn đến từ kiểm tra trước nghiêm ngặt + áp dụng gần như nguyên tử với khôi phục trong bộ nhớ theo nỗ lực tốt nhất khi thất bại.

## Ví dụ

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets audit --check
```

Nếu `audit --check` vẫn báo cáo các phát hiện plaintext, hãy cập nhật các đường dẫn đích còn lại được báo cáo và chạy lại kiểm tra.

## Liên quan

- [Tham chiếu CLI](/vi/cli)
- [Quản lý bí mật](/vi/gateway/secrets)
