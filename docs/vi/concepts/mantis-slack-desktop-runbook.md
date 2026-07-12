---
read_when:
    - Chạy kiểm thử chất lượng ứng dụng Slack trên máy tính bằng Mantis từ GitHub hoặc cục bộ
    - Gỡ lỗi các lượt chạy Mantis chậm trên ứng dụng Slack dành cho máy tính để bàn
    - Lựa chọn chế độ nguồn, tiền nạp hoặc phiên thuê đã khởi động sẵn
    - Đăng bằng chứng ảnh chụp màn hình và video lên một PR
summary: 'Cẩm nang vận hành QA ứng dụng Slack trên máy tính cho Mantis: kích hoạt qua GitHub, CLI cục bộ, phiên thuê VNC được khởi động sẵn, chế độ cấp dữ liệu, diễn giải thời gian, hiện vật và xử lý lỗi.'
title: Sổ tay vận hành Mantis trên Slack dành cho máy tính để bàn
x-i18n:
    generated_at: "2026-07-12T07:51:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b3e956d99fc43a7b6fe65e2e820812b0e0e8b9e32badd25be27c74d302ab30dc
    source_path: concepts/mantis-slack-desktop-runbook.md
    workflow: 16
---

Mantis Slack desktop QA là luồng giao diện người dùng thực dành cho các lỗi thuộc nhóm Slack cần
môi trường desktop Linux, khả năng khôi phục qua VNC, Slack Web, một Gateway OpenClaw thực, ảnh chụp màn hình,
video và bình luận bằng chứng trên PR. Hãy sử dụng luồng này khi kiểm thử đơn vị hoặc
luồng Slack trực tiếp không giao diện không thể chứng minh lỗi.

## Mô hình lưu trữ

Mantis sử dụng ba lớp lưu trữ:

- **Ảnh nhà cung cấp** - thuộc quyền quản lý của Crabbox, được lưu trong tài khoản nhà cung cấp đám mây.
  Chứa các khả năng của máy (Chrome/Chromium, ffmpeg, scrot,
  Node/corepack/pnpm, công cụ dựng mã gốc) và các thư mục bộ nhớ đệm trống.
- **Trạng thái phiên thuê đã làm nóng** - thuộc quyền quản lý của phiên vận hành hiện tại. Có thể chứa
  hồ sơ trình duyệt đã đăng nhập, `/var/cache/crabbox/pnpm` và bản lấy mã nguồn đã chuẩn bị
  trong thời gian phiên thuê còn hoạt động.
- **Tạo tác Mantis** - thuộc quyền quản lý của lượt chạy OpenClaw. Nằm trong
  `.artifacts/qa-e2e/mantis/...`; GitHub Actions tải chúng lên và Ứng dụng GitHub Mantis
  bình luận bằng chứng nội tuyến trên PR.

Tuyệt đối không đưa bí mật, cookie trình duyệt, trạng thái đăng nhập Slack, bản lấy kho lưu trữ,
`node_modules` hoặc `dist/` vào ảnh nhà cung cấp.

## Kích hoạt GitHub

Chạy quy trình làm việc từ `main`:

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

`candidate_ref` bị hạn chế vì quy trình làm việc sử dụng thông tin xác thực trực tiếp: giá trị này
phải phân giải thành một phần lịch sử của `main` hiện tại, một thẻ phát hành hoặc đầu nhánh của một PR đang mở trong
`openclaw/openclaw`.

Quy trình làm việc tạo ra:

- tạo tác được tải lên `mantis-slack-desktop-smoke-<run-id>-<attempt>`
- bình luận nội tuyến trên PR từ Ứng dụng GitHub Mantis
- `slack-desktop-smoke.png`, `slack-desktop-smoke.mp4`
- `slack-desktop-smoke-preview.gif`, `slack-desktop-smoke-change.mp4`
- `mantis-slack-desktop-smoke-summary.json`, `mantis-slack-desktop-smoke-report.md`
- nhật ký từ xa: `slack-desktop-command.log`, `openclaw-gateway.log`, `chrome.log`, `ffmpeg.log`

Bình luận trên PR được cập nhật tại chỗ thông qua dấu mốc ẩn `<!-- mantis-slack-desktop-smoke -->`.

## CLI cục bộ

Bằng chứng mã nguồn trên máy lạnh:

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

Giữ máy ảo để khôi phục qua VNC:

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

Tái sử dụng phiên thuê đã làm nóng:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --provider aws \
  --lease-id <cbx_id-or-slug> \
  --gateway-setup \
  --scenario slack-canary \
  --hydrate-mode source
```

Chỉ sử dụng `--hydrate-mode prehydrated` khi không gian làm việc từ xa được tái sử dụng đã có
`node_modules` và `dist/` đã được dựng; nếu không, Mantis sẽ từ chối thực thi theo hướng an toàn.

Chứng minh giao diện phê duyệt Slack gốc:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --provider aws \
  --class standard \
  --approval-checkpoints \
  --credential-source convex \
  --credential-role maintainer \
  --hydrate-mode source
```

`--approval-checkpoints` loại trừ lẫn nhau với `--gateway-setup`. Cờ này chạy
các kịch bản chọn tham gia `slack-approval-exec-native` và `slack-approval-plugin-native`,
trừ khi bạn truyền một `--scenario` điểm kiểm tra phê duyệt cụ thể; các kịch bản
Slack khác sẽ bị từ chối trước khi máy ảo khởi động. Trình chạy Slack QA ghi
từng tệp JSON điểm kiểm tra từ thông báo API Slack thực mà nó quan sát được, sau đó
trình theo dõi từ xa kết xuất thông báo đó thành
`approval-checkpoints/<scenario>-pending.png` và
`approval-checkpoints/<scenario>-resolved.png`. Lượt chạy thất bại nếu thiếu hoặc để trống
bất kỳ JSON điểm kiểm tra, bằng chứng thông báo, JSON xác nhận hoặc ảnh chụp màn hình đã kết xuất nào.

Các phiên thuê GitHub Actions lạnh không có cookie Slack Web, vì vậy bản chụp trình duyệt
có thể dừng ở màn hình đăng nhập Slack. Đối với bằng chứng điểm kiểm tra phê duyệt, hãy tin cậy
các ảnh điểm kiểm tra đã kết xuất và tạo tác Slack QA thay vì
`slack-desktop-smoke.png`. Chỉ sử dụng phiên thuê đã làm nóng được giữ lại với hồ sơ
Slack Web đã đăng nhập thủ công khi chính ảnh chụp trình duyệt phải hiển thị
Slack Web.

## Chế độ chuẩn bị

| Chế độ        | Sử dụng khi                                      | Hành vi từ xa                                                                          | Đánh đổi                                                          |
| ------------- | ------------------------------------------------ | -------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `source`      | Bằng chứng PR thông thường, máy lạnh, CI         | Chạy `pnpm install --frozen-lockfile --prefer-offline` và `pnpm build` bên trong máy ảo | Chậm nhất, bằng chứng từ bản lấy mã nguồn mạnh nhất                |
| `prehydrated` | Bạn chủ động chuẩn bị một phiên thuê tái sử dụng | Yêu cầu có sẵn `node_modules` và `dist/`; bỏ qua cài đặt/dựng                           | Nhanh, nhưng chỉ hợp lệ với phiên thuê nóng do người vận hành kiểm soát |

GitHub Actions luôn chuẩn bị bản lấy mã nguồn ứng viên trước khi chạy máy ảo. Kho pnpm của nó
được lưu đệm theo hệ điều hành, phiên bản Node và tệp khóa. Lượt chạy `source` trên máy ảo
cũng tái sử dụng `/var/cache/crabbox/pnpm` khi có.

## Diễn giải thời gian

`mantis-slack-desktop-smoke-report.md` bao gồm thời gian của các giai đoạn:

- `crabbox.warmup` - khởi động nhà cung cấp đám mây, mức sẵn sàng của desktop/trình duyệt, SSH.
- `crabbox.inspect` - tra cứu siêu dữ liệu phiên thuê.
- `credentials.prepare` - nhận phiên thuê thông tin xác thực Convex.
- `crabbox.remote_run` - đồng bộ, khởi chạy trình duyệt, cài đặt/dựng OpenClaw hoặc
  xác thực trạng thái chuẩn bị, khởi động Gateway, chụp ảnh màn hình và quay video.
- `artifacts.copy` - đồng bộ ngược từ máy ảo bằng rsync.

`crabbox.remote_run` có thể hiển thị `accepted` khi Crabbox trả về trạng thái từ xa khác 0
nhưng Mantis đã sao chép siêu dữ liệu chứng minh rằng quá trình thiết lập Gateway OpenClaw
đã hoàn tất hoặc chính lệnh Slack QA đã thoát thành công. Hãy coi
`accepted` là đạt kèm giải thích, không phải kịch bản thất bại.

Nếu lượt chạy chậm:

- Giai đoạn làm nóng chiếm phần lớn thời gian: tạo sẵn hoặc nâng cấp lên ảnh nhà cung cấp Crabbox tốt hơn.
- `remote_run` chiếm phần lớn thời gian ở chế độ `source`: sử dụng phiên thuê đã làm nóng, cải thiện khả năng tái sử dụng
  kho pnpm hoặc chuyển các điều kiện tiên quyết của máy vào ảnh nhà cung cấp.
- `remote_run` chiếm phần lớn thời gian ở chế độ `prehydrated`: không gian làm việc từ xa chưa
  thực sự sẵn sàng hoặc quá trình thiết lập Gateway/trình duyệt/Slack chậm.
- Sao chép tạo tác chiếm phần lớn thời gian: kiểm tra kích thước video và nội dung thư mục tạo tác.

## Danh sách kiểm tra bằng chứng

Một bình luận PR tốt hiển thị:

- mã kịch bản và SHA của ứng viên
- URL lượt chạy GitHub Actions và URL tạo tác
- ảnh chụp màn hình điểm kiểm tra phê duyệt nội tuyến hoặc ảnh chụp Slack Web từ một
  phiên thuê đã làm nóng và đã đăng nhập
- bản xem trước động nội tuyến khi có
- liên kết đến MP4 đầy đủ và MP4 đã cắt gọn
- trạng thái đạt/không đạt và bản tóm tắt thời gian của báo cáo

Không đưa ảnh chụp màn hình hoặc video vào kho lưu trữ. Hãy giữ chúng trong tạo tác
GitHub Actions hoặc bình luận trên PR.

## Xử lý lỗi

Nếu quy trình làm việc thất bại trước khi chạy máy ảo, trước tiên hãy kiểm tra tác vụ Actions.
Nguyên nhân thường gặp: `candidate_ref` không đáng tin cậy, thiếu bí mật môi trường hoặc
cài đặt/dựng ứng viên thất bại.

Nếu lượt chạy máy ảo thất bại nhưng ảnh chụp màn hình đã được sao chép ngược, hãy kiểm tra:

```bash
cat mantis-slack-desktop-smoke-report.md
cat mantis-slack-desktop-smoke-summary.json
cat slack-desktop-command.log
cat openclaw-gateway.log
cat chrome.log
cat ffmpeg.log
```

Nếu lượt chạy đã giữ lại phiên thuê, hãy mở VNC bằng lệnh `crabbox vnc ...`
trong báo cáo, sau đó dừng phiên thuê khi hoàn tất:

```bash
crabbox stop --provider aws <cbx_id-or-slug>
```

Nếu phiên đăng nhập Slack đã hết hạn, hãy khắc phục trong VNC trên phiên thuê được giữ lại rồi chạy lại với
`--lease-id`. Không đưa hồ sơ trình duyệt đó vào ảnh nhà cung cấp.

## Liên quan

- [Tổng quan về QA](/vi/concepts/qa-e2e-automation)
- [Kênh Slack](/vi/channels/slack)
- [Kiểm thử](/vi/help/testing)
