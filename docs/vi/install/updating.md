---
read_when:
    - Cập nhật OpenClaw
    - Có sự cố sau khi cập nhật
summary: Cập nhật OpenClaw an toàn (cài đặt toàn cục hoặc từ mã nguồn), kèm chiến lược khôi phục về phiên bản trước
title: Cập nhật
x-i18n:
    generated_at: "2026-05-03T21:33:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: f9e26ea71748dfd1573cdca01126bf29ebc56be56eac604e2b6a009b463820d1
    source_path: install/updating.md
    workflow: 16
---

Luôn cập nhật OpenClaw.

## Khuyến nghị: `openclaw update`

Cách nhanh nhất để cập nhật. Lệnh này phát hiện kiểu cài đặt của bạn (npm hoặc git), tải phiên bản mới nhất, chạy `openclaw doctor` và khởi động lại Gateway.

```bash
openclaw update
```

Để chuyển kênh hoặc nhắm tới một phiên bản cụ thể:

```bash
openclaw update --channel beta
openclaw update --channel dev
openclaw update --tag main
openclaw update --dry-run   # xem trước mà không áp dụng
```

`openclaw update` không nhận `--verbose`. Để chẩn đoán cập nhật, hãy dùng
`--dry-run` để xem trước các hành động dự kiến, `--json` để nhận kết quả có cấu trúc, hoặc
`openclaw update status --json` để kiểm tra trạng thái kênh và tính khả dụng. Trình
cài đặt có cờ `--verbose` riêng, nhưng cờ đó không phải là một phần của
`openclaw update`.

`--channel beta` ưu tiên beta, nhưng runtime sẽ quay về stable/latest khi
thẻ beta bị thiếu hoặc cũ hơn bản phát hành stable mới nhất. Dùng `--tag beta`
nếu bạn muốn dist-tag beta npm thô cho một lần cập nhật package riêng lẻ.

Xem [Kênh phát triển](/vi/install/development-channels) để biết ngữ nghĩa của kênh.

## Chuyển đổi giữa cài đặt npm và git

Dùng kênh khi bạn muốn thay đổi kiểu cài đặt. Bộ cập nhật giữ nguyên
trạng thái, cấu hình, thông tin xác thực và workspace của bạn trong `~/.openclaw`; nó chỉ thay đổi
bản cài đặt mã OpenClaw mà CLI và Gateway sử dụng.

```bash
# cài đặt package npm -> checkout git có thể chỉnh sửa
openclaw update --channel dev

# checkout git -> cài đặt package npm
openclaw update --channel stable
```

Chạy với `--dry-run` trước để xem trước chính xác việc chuyển chế độ cài đặt:

```bash
openclaw update --channel dev --dry-run
openclaw update --channel stable --dry-run
```

Kênh `dev` bảo đảm có một checkout git, build nó và cài đặt CLI toàn cục
từ checkout đó. Các kênh `stable` và `beta` dùng cài đặt package. Nếu
Gateway đã được cài đặt, `openclaw update` làm mới siêu dữ liệu dịch vụ
và khởi động lại dịch vụ trừ khi bạn truyền `--no-restart`.

## Phương án khác: chạy lại trình cài đặt

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

Thêm `--no-onboard` để bỏ qua onboarding. Để ép một kiểu cài đặt cụ thể thông qua
trình cài đặt, truyền `--install-method git --no-onboard` hoặc
`--install-method npm --no-onboard`.

Nếu `openclaw update` thất bại sau giai đoạn cài đặt package npm, hãy chạy lại
trình cài đặt. Trình cài đặt không gọi bộ cập nhật cũ; nó chạy trực tiếp việc cài đặt
package toàn cục và có thể khôi phục một bản cài đặt npm đã cập nhật dở dang.

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
```

Để ghim quá trình khôi phục vào một phiên bản hoặc dist-tag cụ thể, thêm `--version`:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm --version <version-or-dist-tag>
```

## Phương án khác: npm, pnpm hoặc bun thủ công

```bash
npm i -g openclaw@latest
```

Khi `openclaw update` quản lý một bản cài đặt npm toàn cục, trước tiên nó cài đặt mục tiêu vào
một tiền tố npm tạm thời, xác minh inventory `dist` đã đóng gói, rồi hoán đổi
cây package sạch vào tiền tố toàn cục thật. Điều đó tránh việc npm phủ một
package mới lên các tệp cũ còn sót lại từ package trước. Nếu lệnh cài đặt thất bại,
OpenClaw thử lại một lần với `--omit=optional`. Lần thử lại đó giúp các máy chủ nơi
dependency tùy chọn native không thể biên dịch, đồng thời vẫn giữ lỗi ban đầu hiển thị
nếu phương án dự phòng cũng thất bại.

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

### Chủ đề cài đặt npm nâng cao

<AccordionGroup>
  <Accordion title="Cây package chỉ đọc">
    OpenClaw coi các bản cài đặt toàn cục đã đóng gói là chỉ đọc ở runtime, ngay cả khi thư mục package toàn cục có thể ghi bởi người dùng hiện tại. Các bản cài đặt package Plugin nằm trong các gốc npm/git do OpenClaw sở hữu dưới thư mục cấu hình người dùng, và quá trình khởi động Gateway không chỉnh sửa cây package OpenClaw.

    Một số thiết lập npm trên Linux cài đặt package toàn cục dưới các thư mục do root sở hữu như `/usr/lib/node_modules/openclaw`. OpenClaw hỗ trợ bố cục đó vì các lệnh cài đặt/cập nhật Plugin ghi bên ngoài thư mục package toàn cục đó.

  </Accordion>
  <Accordion title="Đơn vị systemd được gia cố">
    Cấp cho OpenClaw quyền ghi vào các gốc cấu hình/trạng thái của nó để các lần cài đặt Plugin tường minh, cập nhật Plugin và dọn dẹp doctor có thể lưu các thay đổi:

    ```ini
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

  </Accordion>
  <Accordion title="Kiểm tra trước dung lượng đĩa">
    Trước các lần cập nhật package và cài đặt Plugin tường minh, OpenClaw cố gắng kiểm tra dung lượng đĩa theo nỗ lực tốt nhất cho volume mục tiêu. Dung lượng thấp tạo ra cảnh báo với đường dẫn đã kiểm tra, nhưng không chặn cập nhật vì hạn mức hệ thống tệp, snapshot và volume mạng có thể thay đổi sau khi kiểm tra. Quá trình cài đặt thực tế của trình quản lý package và xác minh sau cài đặt vẫn là nguồn có thẩm quyền.
  </Accordion>
</AccordionGroup>

## Bộ tự động cập nhật

Bộ tự động cập nhật tắt theo mặc định. Bật nó trong `~/.openclaw/openclaw.json`:

```json5
{
  update: {
    channel: "stable",
    auto: {
      enabled: true,
      stableDelayHours: 6,
      stableJitterHours: 12,
      betaCheckIntervalHours: 1,
    },
  },
}
```

| Kênh     | Hành vi                                                                                                            |
| -------- | ------------------------------------------------------------------------------------------------------------------ |
| `stable` | Chờ `stableDelayHours`, rồi áp dụng với jitter xác định trên `stableJitterHours` (triển khai phân tán).            |
| `beta`   | Kiểm tra mỗi `betaCheckIntervalHours` (mặc định: hằng giờ) và áp dụng ngay lập tức.                                |
| `dev`    | Không áp dụng tự động. Dùng `openclaw update` thủ công.                                                            |

Gateway cũng ghi một gợi ý cập nhật khi khởi động (tắt bằng `update.checkOnStart: false`).
Để hạ cấp hoặc khôi phục sự cố, đặt `OPENCLAW_NO_AUTO_UPDATE=1` trong môi trường Gateway để chặn áp dụng tự động ngay cả khi `update.auto.enabled` đã được cấu hình. Gợi ý cập nhật khi khởi động vẫn có thể chạy trừ khi `update.checkOnStart` cũng bị tắt.

Các cập nhật trình quản lý package được yêu cầu thông qua handler control-plane Gateway trực tiếp
buộc khởi động lại cập nhật không trì hoãn, không cooldown sau khi hoán đổi package. Điều đó
tránh để một tiến trình cũ trong bộ nhớ tồn tại đủ lâu để lazy-load các chunk
từ một cây package đã bị thay thế. Shell `openclaw update`
vẫn là đường dẫn ưu tiên cho các bản cài đặt được giám sát vì nó có thể dừng và
khởi động lại dịch vụ quanh quá trình cập nhật.

## Sau khi cập nhật

<Steps>

### Chạy doctor

```bash
openclaw doctor
```

Di chuyển cấu hình, kiểm tra các chính sách DM và kiểm tra sức khỏe Gateway. Chi tiết: [Doctor](/vi/gateway/doctor)

### Khởi động lại Gateway

```bash
openclaw gateway restart
```

### Xác minh

```bash
openclaw health
```

</Steps>

## Rollback

### Ghim một phiên bản (npm)

```bash
npm i -g openclaw@<version>
openclaw doctor
openclaw gateway restart
```

<Tip>
`npm view openclaw version` hiển thị phiên bản đã phát hành hiện tại.
</Tip>

### Ghim một commit (nguồn)

```bash
git fetch origin
git checkout "$(git rev-list -n 1 --before=\"2026-01-01\" origin/main)"
pnpm install && pnpm build
openclaw gateway restart
```

Để quay lại bản mới nhất: `git checkout main && git pull`.

## Nếu bạn bị kẹt

- Chạy lại `openclaw doctor` và đọc kỹ đầu ra.
- Với `openclaw update --channel dev` trên các checkout nguồn, bộ cập nhật tự động bootstrap `pnpm` khi cần. Nếu bạn thấy lỗi bootstrap pnpm/corepack, hãy cài đặt `pnpm` thủ công (hoặc bật lại `corepack`) và chạy lại cập nhật.
- Kiểm tra: [Khắc phục sự cố](/vi/gateway/troubleshooting)
- Hỏi trong Discord: [https://discord.gg/clawd](https://discord.gg/clawd)

## Liên quan

- [Tổng quan cài đặt](/vi/install): tất cả các phương thức cài đặt.
- [Doctor](/vi/gateway/doctor): kiểm tra sức khỏe sau cập nhật.
- [Di chuyển](/vi/install/migrating): hướng dẫn di chuyển phiên bản lớn.
