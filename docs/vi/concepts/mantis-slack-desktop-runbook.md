---
read_when:
    - Chạy kiểm thử chất lượng cho ứng dụng máy tính để bàn Mantis Slack từ GitHub hoặc cục bộ
    - Gỡ lỗi các lần chạy Mantis Slack trên máy tính để bàn bị chậm
    - Chọn chế độ source, prehydrated hoặc warm-lease
    - Đăng bằng chứng ảnh chụp màn hình và video lên một yêu cầu kéo
summary: 'Sổ tay vận hành dành cho QA máy tính để bàn Mantis Slack: điều phối GitHub, CLI cục bộ, lease VNC đã khởi động sẵn, chế độ hydrate, diễn giải thời gian, artifact và xử lý lỗi.'
title: Sổ tay vận hành Slack trên máy tính để bàn của Mantis
x-i18n:
    generated_at: "2026-05-06T09:08:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 83ca8792b53e5b14e592c2cbec6f6adfc936834e19f340f8e5eb3d467ecd3209
    source_path: concepts/mantis-slack-desktop-runbook.md
    workflow: 16
---

Mantis Slack desktop QA là luồng UI thực cho các lỗi cùng loại Slack cần một
máy tính để bàn Linux, cứu hộ VNC, Slack Web, Gateway OpenClaw thật, ảnh chụp màn hình,
video và bình luận bằng chứng trên PR.

Dùng luồng này khi kiểm thử đơn vị hoặc luồng Slack live không giao diện không thể chứng minh lỗi.

## Mô hình lưu trữ

Mantis dùng ba lớp lưu trữ khác nhau:

- Image nhà cung cấp: do Crabbox sở hữu và được lưu trong tài khoản nhà cung cấp đám mây.
  Nó chứa các khả năng của máy như Chrome/Chromium, ffmpeg, scrot,
  Node/corepack/pnpm, công cụ build native và các thư mục cache trống.
- Trạng thái lease đã làm ấm: do phiên vận hành hiện tại sở hữu. Nó có thể chứa
  hồ sơ trình duyệt đã đăng nhập, `/var/cache/crabbox/pnpm` và checkout mã nguồn
  đã chuẩn bị trong khi lease còn sống.
- Artifact Mantis: do lần chạy OpenClaw sở hữu. Chúng nằm dưới
  `.artifacts/qa-e2e/mantis/...`, sau đó GitHub Actions tải chúng lên và
  Mantis GitHub App bình luận bằng chứng nội tuyến trên PR.

Không bao giờ đưa bí mật, cookie trình duyệt, trạng thái đăng nhập Slack, checkout repository,
`node_modules` hoặc `dist/` vào image nhà cung cấp được prebake.

## Kích hoạt GitHub

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

Các giá trị `candidate_ref` được cho phép được cố ý thu hẹp vì workflow
dùng thông tin đăng nhập live: ancestry của `main` hiện tại, tag phát hành hoặc head của PR đang mở
từ `openclaw/openclaw`.

Workflow ghi:

- artifact đã tải lên: `mantis-slack-desktop-smoke-<run-id>-<attempt>`;
- bình luận PR nội tuyến từ Mantis GitHub App;
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

Tái sử dụng lease đã làm ấm:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --provider aws \
  --lease-id <cbx_id-or-slug> \
  --gateway-setup \
  --scenario slack-canary \
  --hydrate-mode source
```

Chỉ dùng `--hydrate-mode prehydrated` khi workspace từ xa được tái sử dụng đã
có `node_modules` và `dist/` đã build. Mantis fail đóng nếu thiếu các mục đó.

## Chế độ hydrate

| Chế độ        | Dùng khi                                   | Hành vi từ xa                                                                         | Đánh đổi                                                 |
| ------------- | ------------------------------------------ | ------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| `source`      | Bằng chứng PR thông thường, máy lạnh, CI   | Chạy `pnpm install --frozen-lockfile --prefer-offline` và `pnpm build` bên trong VM   | Chậm nhất, bằng chứng checkout nguồn mạnh nhất           |
| `prehydrated` | Bạn cố ý chuẩn bị một lease được tái sử dụng | Yêu cầu `node_modules` và `dist/` hiện có; bỏ qua install/build                       | Nhanh, nhưng chỉ hợp lệ cho lease ấm do người vận hành kiểm soát |

GitHub Actions luôn chuẩn bị checkout ứng viên trước lần chạy VM. Store
pnpm của nó được cache theo OS, phiên bản Node và lockfile. Lần chạy nguồn trên VM cũng
dùng `/var/cache/crabbox/pnpm` khi có.

## Diễn giải thời gian

`mantis-slack-desktop-smoke-report.md` bao gồm thời gian từng pha:

- `crabbox.warmup`: khởi động nhà cung cấp đám mây, độ sẵn sàng của desktop/trình duyệt và SSH.
- `crabbox.inspect`: tra cứu metadata lease.
- `credentials.prepare`: lấy lease thông tin đăng nhập Convex.
- `crabbox.remote_run`: đồng bộ, khởi chạy trình duyệt, cài đặt/build OpenClaw hoặc
  xác thực hydrate, khởi động Gateway, chụp màn hình và quay video.
- `artifacts.copy`: rsync ngược từ VM.

`crabbox.remote_run` có thể được đánh dấu là `accepted` khi Crabbox trả về trạng thái từ xa khác 0
sau khi Mantis đã sao chép metadata chứng minh rằng Gateway OpenClaw
đang hoạt động và phần thiết lập đã hoàn tất. Hãy xem `accepted` là đạt kèm giải thích,
không phải một scenario thất bại.

Nếu lần chạy chậm:

- warmup chiếm phần lớn: prebake hoặc nâng cấp image nhà cung cấp Crabbox tốt hơn;
- remote_run chiếm phần lớn trong `source`: dùng lease ấm, cải thiện việc tái sử dụng store pnpm,
  hoặc chuyển các điều kiện tiên quyết của máy vào image nhà cung cấp;
- remote_run chiếm phần lớn trong `prehydrated`: workspace từ xa thực ra chưa
  sẵn sàng, hoặc quá trình thiết lập Gateway/trình duyệt/Slack chậm;
- copy artifact chiếm phần lớn: kiểm tra kích thước video và nội dung thư mục artifact.

## Danh sách kiểm tra bằng chứng

Một bình luận PR tốt nên hiển thị:

- id scenario và SHA ứng viên;
- URL lần chạy GitHub Actions;
- URL artifact;
- ảnh chụp màn hình nội tuyến;
- bản xem trước động nội tuyến khi có;
- liên kết MP4 đầy đủ và MP4 đã cắt;
- trạng thái đạt/không đạt;
- tóm tắt thời gian trong báo cáo đính kèm.

Không commit ảnh chụp màn hình hoặc video vào repository. Giữ chúng trong artifact
GitHub Actions hoặc bình luận PR.

## Xử lý lỗi

Nếu workflow thất bại trước lần chạy VM, trước tiên hãy kiểm tra job Actions. Nguyên nhân thường gặp
là `candidate_ref` không đáng tin cậy, thiếu secret môi trường hoặc lỗi install/build ứng viên.

Nếu lần chạy VM thất bại nhưng ảnh chụp màn hình đã được sao chép về, hãy kiểm tra:

```bash
cat mantis-slack-desktop-smoke-report.md
cat mantis-slack-desktop-smoke-summary.json
cat slack-desktop-command.log
cat openclaw-gateway.log
cat chrome.log
cat ffmpeg.log
```

Nếu lần chạy đã giữ lease, mở VNC bằng lệnh `crabbox vnc ...` trong báo cáo.
Dừng lease khi hoàn tất:

```bash
crabbox stop --provider aws <cbx_id-or-slug>
```

Nếu đăng nhập Slack hết hạn, sửa trong VNC trên một lease được giữ lại và chạy lại với
`--lease-id`. Không bake hồ sơ trình duyệt đó vào image nhà cung cấp.

## Liên quan

- [Tổng quan QA](/vi/concepts/qa-e2e-automation)
- [Kênh Slack](/vi/channels/slack)
- [Kiểm thử](/vi/help/testing)
