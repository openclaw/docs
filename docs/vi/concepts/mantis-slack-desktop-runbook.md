---
read_when:
    - Chạy QA desktop Slack Mantis từ GitHub hoặc cục bộ
    - Gỡ lỗi các lượt chạy Mantis chậm trên Slack desktop
    - Chọn chế độ nguồn, tiền nạp sẵn hoặc thuê ấm
    - Đăng bằng chứng ảnh chụp màn hình và video lên PR
summary: 'Sổ tay vận hành cho QA desktop Mantis Slack: GitHub dispatch, CLI cục bộ, lease VNC đã làm nóng, chế độ hydrate, diễn giải thời gian, artifact và xử lý lỗi.'
title: Sổ tay vận hành Slack trên máy tính để bàn cho Mantis
x-i18n:
    generated_at: "2026-06-27T17:23:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d9310b460a4da84afab72f9e5b5515a94e74b4f4a5030332bd2021d60deb07cc
    source_path: concepts/mantis-slack-desktop-runbook.md
    workflow: 16
---

QA desktop Mantis Slack là luồng giao diện thật cho các lỗi kiểu Slack cần
desktop Linux, cứu hộ VNC, Slack Web, Gateway OpenClaw thật, ảnh chụp màn hình,
video và bình luận bằng chứng trên PR.

Dùng luồng này khi kiểm thử đơn vị hoặc luồng Slack live headless không thể chứng minh lỗi.

## Mô hình lưu trữ

Mantis dùng ba lớp lưu trữ khác nhau:

- Ảnh provider: do Crabbox sở hữu và được lưu trong tài khoản nhà cung cấp cloud.
  Ảnh này chứa các năng lực của máy như Chrome/Chromium, ffmpeg, scrot,
  Node/corepack/pnpm, công cụ build native và các thư mục cache trống.
- Trạng thái lease ấm: do phiên operator hiện tại sở hữu. Nó có thể chứa một
  hồ sơ trình duyệt đã đăng nhập, `/var/cache/crabbox/pnpm` và một checkout
  nguồn đã chuẩn bị trong khi lease còn sống.
- Artifact Mantis: do lần chạy OpenClaw sở hữu. Chúng nằm dưới
  `.artifacts/qa-e2e/mantis/...`, sau đó GitHub Actions tải chúng lên và
  Mantis GitHub App bình luận bằng chứng inline trên PR.

Không bao giờ đưa bí mật, cookie trình duyệt, trạng thái đăng nhập Slack, checkout repository,
`node_modules` hoặc `dist/` vào ảnh provider dựng sẵn.

## Dispatch GitHub

Chạy workflow từ `main`:

```bash
gh workflow run mantis-slack-desktop-smoke.yml \
  --ref main \
  -f candidate_ref=<trusted-ref-or-sha> \
  -f pr_number=<pr-number> \
  -f scenario_id=slack-canary \
  -f crabbox_provider=aws \
  -f keep_vm=false \
  -f hydrate_mode=source
```

Các giá trị `candidate_ref` được phép được cố ý giới hạn hẹp vì workflow
dùng thông tin xác thực live: tổ tiên của `main` hiện tại, tag phát hành hoặc head của PR đang mở
từ `openclaw/openclaw`.

Workflow ghi:

- artifact đã tải lên: `mantis-slack-desktop-smoke-<run-id>-<attempt>`;
- bình luận PR inline từ Mantis GitHub App;
- `slack-desktop-smoke.png`;
- `slack-desktop-smoke.mp4`;
- `slack-desktop-smoke-preview.gif`;
- `slack-desktop-smoke-change.mp4`;
- `mantis-slack-desktop-smoke-summary.json`;
- `mantis-slack-desktop-smoke-report.md`;
- log từ xa như `slack-desktop-command.log`, `openclaw-gateway.log`,
  `chrome.log` và `ffmpeg.log`.

Bình luận PR được cập nhật tại chỗ bằng marker ẩn
`<!-- mantis-slack-desktop-smoke -->`.

## CLI cục bộ

Bằng chứng nguồn lạnh:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --provider aws \
  --class standard \
  --gateway-setup \
  --credential-source convex \
  --credential-role maintainer \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --scenario slack-canary \
  --hydrate-mode source
```

Giữ VM để cứu hộ VNC:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --provider aws \
  --class standard \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Mở VNC:

```bash
crabbox vnc --provider aws --id <cbx_id> --open
```

Tái sử dụng lease ấm:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --provider aws \
  --lease-id <cbx_id-or-slug> \
  --gateway-setup \
  --scenario slack-canary \
  --hydrate-mode source
```

Chỉ dùng `--hydrate-mode prehydrated` khi workspace từ xa được tái sử dụng đã
có `node_modules` và `dist/` đã build. Mantis fail-closed nếu thiếu các mục đó.

Chứng minh UI phê duyệt Slack native:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --provider aws \
  --class standard \
  --approval-checkpoints \
  --credential-source convex \
  --credential-role maintainer \
  --hydrate-mode source
```

Chế độ checkpoint phê duyệt loại trừ lẫn nhau với `--gateway-setup`. Nó chạy
các kịch bản opt-in `slack-approval-exec-native` và `slack-approval-plugin-native`
trừ khi bạn truyền các cờ `--scenario` checkpoint phê duyệt rõ ràng; các
kịch bản Slack khác bị từ chối trước khi VM khởi động. Slack QA runner ghi
mỗi tệp JSON checkpoint từ thông điệp Slack API thật mà nó quan sát được, sau đó
watcher từ xa render snapshot thông điệp đó thành
`approval-checkpoints/<scenario>-pending.png` và
`approval-checkpoints/<scenario>-resolved.png`. Lần chạy thất bại nếu bất kỳ
JSON checkpoint, bằng chứng thông điệp, JSON ack hoặc ảnh chụp màn hình đã render nào bị thiếu hoặc trống.

Lease GitHub Actions lạnh không có cookie Slack Web, nên phần capture trình duyệt
của chúng có thể dừng ở trang đăng nhập Slack. Với bằng chứng checkpoint phê duyệt, hãy tin
các ảnh checkpoint đã render và artifact Slack QA thay vì
`slack-desktop-smoke.png`. Chỉ dùng lease ấm được giữ lại với hồ sơ Slack Web
đã đăng nhập thủ công khi chính ảnh chụp trình duyệt phải hiển thị Slack Web.

## Chế độ hydrate

| Chế độ        | Dùng khi                                   | Hành vi từ xa                                                                           | Đánh đổi                                                 |
| ------------- | ------------------------------------------ | --------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| `source`      | Bằng chứng PR thông thường, máy lạnh, CI   | Chạy `pnpm install --frozen-lockfile --prefer-offline` và `pnpm build` trong VM         | Chậm nhất, bằng chứng checkout nguồn mạnh nhất           |
| `prehydrated` | Bạn cố ý chuẩn bị một lease được tái sử dụng | Yêu cầu `node_modules` và `dist/` có sẵn; bỏ qua install/build                          | Nhanh, nhưng chỉ hợp lệ cho lease ấm do operator kiểm soát |

GitHub Actions luôn chuẩn bị checkout candidate trước lần chạy VM. pnpm store của nó
được cache theo hệ điều hành, phiên bản Node và lockfile. Lần chạy nguồn trong VM cũng
dùng `/var/cache/crabbox/pnpm` khi có.

## Diễn giải thời gian

`mantis-slack-desktop-smoke-report.md` bao gồm thời gian theo pha:

- `crabbox.warmup`: khởi động nhà cung cấp cloud, mức sẵn sàng desktop/trình duyệt và SSH.
- `crabbox.inspect`: tra cứu metadata lease.
- `credentials.prepare`: lấy lease thông tin xác thực Convex.
- `crabbox.remote_run`: đồng bộ, khởi chạy trình duyệt, install/build OpenClaw hoặc
  xác thực hydrate, khởi động Gateway, ảnh chụp màn hình và capture video.
- `artifacts.copy`: rsync trở lại từ VM.

`crabbox.remote_run` có thể được đánh dấu `accepted` khi Crabbox trả về trạng thái
từ xa khác không sau khi Mantis đã sao chép metadata chứng minh rằng thiết lập Gateway
OpenClaw đã hoàn tất hoặc chính lệnh Slack QA đã thoát thành công.
Hãy xem `accepted` là đạt kèm giải thích, không phải một kịch bản thất bại.

Nếu lần chạy chậm:

- warmup chiếm ưu thế: prebake hoặc promote ảnh provider Crabbox tốt hơn;
- remote_run chiếm ưu thế trong `source`: dùng lease ấm, cải thiện tái sử dụng pnpm store
  hoặc chuyển các điều kiện tiên quyết của máy vào ảnh provider;
- remote_run chiếm ưu thế trong `prehydrated`: workspace từ xa thực ra chưa
  sẵn sàng, hoặc thiết lập Gateway/trình duyệt/Slack chậm;
- sao chép artifact chiếm ưu thế: kiểm tra kích thước video và nội dung thư mục artifact.

## Checklist bằng chứng

Một bình luận PR tốt nên hiển thị:

- id kịch bản và SHA candidate;
- URL lần chạy GitHub Actions;
- URL artifact;
- ảnh chụp màn hình checkpoint phê duyệt inline, hoặc ảnh chụp Slack Web từ một
  lease ấm đã đăng nhập;
- preview động inline khi có;
- liên kết MP4 đầy đủ và MP4 đã cắt;
- trạng thái đạt/thất bại;
- tóm tắt thời gian trong báo cáo đính kèm.

Không commit ảnh chụp màn hình hoặc video vào repository. Giữ chúng trong artifact
GitHub Actions hoặc bình luận PR.

## Xử lý lỗi

Nếu workflow thất bại trước lần chạy VM, hãy kiểm tra job Actions trước. Nguyên nhân
thường gặp là `candidate_ref` không đáng tin cậy, thiếu secret môi trường hoặc candidate
install/build thất bại.

Nếu lần chạy VM thất bại nhưng ảnh chụp màn hình đã được sao chép lại, hãy kiểm tra:

```bash
cat mantis-slack-desktop-smoke-report.md
cat mantis-slack-desktop-smoke-summary.json
cat slack-desktop-command.log
cat openclaw-gateway.log
cat chrome.log
cat ffmpeg.log
```

Nếu lần chạy giữ lease, mở VNC bằng lệnh `crabbox vnc ...` trong báo cáo.
Dừng lease khi hoàn tất:

```bash
crabbox stop --provider aws <cbx_id-or-slug>
```

Nếu đăng nhập Slack hết hạn, sửa trong VNC trên một lease được giữ lại và chạy lại với
`--lease-id`. Không bake hồ sơ trình duyệt đó vào ảnh provider.

## Liên quan

- [Tổng quan QA](/vi/concepts/qa-e2e-automation)
- [Kênh Slack](/vi/channels/slack)
- [Kiểm thử](/vi/help/testing)
