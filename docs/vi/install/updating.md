---
read_when:
    - Cập nhật OpenClaw
    - Có lỗi xảy ra sau khi cập nhật
summary: Cập nhật OpenClaw an toàn (cài đặt toàn cục hoặc từ mã nguồn), cùng chiến lược quay lui
title: Cập nhật
x-i18n:
    generated_at: "2026-05-04T07:05:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3c9ff1d70d74f45efea3c148718e5cbc74001ce3d924b760edc4d68622d23714
    source_path: install/updating.md
    workflow: 16
---

Luôn cập nhật OpenClaw.

## Khuyến nghị: `openclaw update`

Cách cập nhật nhanh nhất. Lệnh này phát hiện kiểu cài đặt của bạn (npm hoặc git), lấy phiên bản mới nhất, chạy `openclaw doctor`, và khởi động lại Gateway.

```bash
openclaw update
```

Để chuyển kênh hoặc nhắm đến một phiên bản cụ thể:

```bash
openclaw update --channel beta
openclaw update --channel dev
openclaw update --tag main
openclaw update --dry-run   # preview without applying
```

`openclaw update` không chấp nhận `--verbose`. Để chẩn đoán cập nhật, hãy dùng
`--dry-run` để xem trước các hành động dự kiến, `--json` để có kết quả có cấu trúc, hoặc
`openclaw update status --json` để kiểm tra trạng thái kênh và tính khả dụng. Trình
cài đặt có cờ `--verbose` riêng, nhưng cờ đó không thuộc
`openclaw update`.

`--channel beta` ưu tiên beta, nhưng runtime sẽ quay về stable/latest khi
thẻ beta bị thiếu hoặc cũ hơn bản phát hành stable mới nhất. Dùng `--tag beta`
nếu bạn muốn dist-tag beta npm thô cho một lần cập nhật gói riêng lẻ.

Xem [Kênh phát triển](/vi/install/development-channels) để biết ngữ nghĩa của kênh.

## Chuyển giữa cài đặt npm và git

Dùng kênh khi bạn muốn thay đổi kiểu cài đặt. Trình cập nhật giữ nguyên
trạng thái, cấu hình, thông tin xác thực, và workspace của bạn trong `~/.openclaw`; nó chỉ thay đổi
bản cài đặt mã OpenClaw mà CLI và Gateway sử dụng.

```bash
# npm package install -> editable git checkout
openclaw update --channel dev

# git checkout -> npm package install
openclaw update --channel stable
```

Chạy với `--dry-run` trước để xem trước chính xác việc chuyển chế độ cài đặt:

```bash
openclaw update --channel dev --dry-run
openclaw update --channel stable --dry-run
```

Kênh `dev` bảo đảm có một git checkout, build nó, và cài đặt CLI toàn cục
từ checkout đó. Các kênh `stable` và `beta` dùng cài đặt gói. Nếu
Gateway đã được cài đặt, `openclaw update` làm mới metadata của dịch vụ
và khởi động lại dịch vụ trừ khi bạn truyền `--no-restart`.

## Cách thay thế: chạy lại trình cài đặt

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

Thêm `--no-onboard` để bỏ qua onboarding. Để ép một kiểu cài đặt cụ thể thông qua
trình cài đặt, truyền `--install-method git --no-onboard` hoặc
`--install-method npm --no-onboard`.

Nếu `openclaw update` thất bại sau giai đoạn cài đặt gói npm, hãy chạy lại
trình cài đặt. Trình cài đặt không gọi trình cập nhật cũ; nó chạy trực tiếp
cài đặt gói toàn cục và có thể khôi phục một bản cài đặt npm đã cập nhật một phần.

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
```

Để ghim khôi phục vào một phiên bản hoặc dist-tag cụ thể, thêm `--version`:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm --version <version-or-dist-tag>
```

## Cách thay thế: npm, pnpm, hoặc bun thủ công

```bash
npm i -g openclaw@latest
```

Ưu tiên `openclaw update` cho các bản cài đặt được giám sát vì nó có thể phối hợp việc
thay gói với dịch vụ Gateway đang chạy. Nếu bạn cập nhật thủ công trong khi một
Gateway được quản lý đang chạy, hãy khởi động lại Gateway ngay sau khi trình quản lý
gói hoàn tất để tiến trình cũ không tiếp tục phục vụ từ các tệp gói đã bị thay thế.

Khi `openclaw update` quản lý một bản cài đặt npm toàn cục, nó cài đặt mục tiêu vào
một tiền tố npm tạm thời trước, xác minh inventory `dist` đã đóng gói, rồi hoán đổi
cây gói sạch vào tiền tố toàn cục thật. Điều đó tránh việc npm phủ một
gói mới lên các tệp cũ còn sót lại từ gói cũ. Nếu lệnh cài đặt thất bại,
OpenClaw thử lại một lần với `--omit=optional`. Lần thử lại đó giúp các máy chủ nơi các
phụ thuộc optional native không thể biên dịch, đồng thời vẫn giữ lỗi ban đầu hiển thị
nếu fallback cũng thất bại.

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

### Chủ đề nâng cao về cài đặt npm

<AccordionGroup>
  <Accordion title="Cây gói chỉ đọc">
    OpenClaw xem các bản cài đặt toàn cục đã đóng gói là chỉ đọc ở runtime, ngay cả khi thư mục gói toàn cục có thể ghi bởi người dùng hiện tại. Các bản cài đặt gói Plugin nằm trong các gốc npm/git do OpenClaw sở hữu dưới thư mục cấu hình người dùng, và quá trình khởi động Gateway không thay đổi cây gói OpenClaw.

    Một số thiết lập npm trên Linux cài đặt gói toàn cục dưới các thư mục do root sở hữu, chẳng hạn như `/usr/lib/node_modules/openclaw`. OpenClaw hỗ trợ bố cục đó vì các lệnh cài đặt/cập nhật Plugin ghi bên ngoài thư mục gói toàn cục đó.

  </Accordion>
  <Accordion title="Đơn vị systemd được gia cố">
    Cấp quyền ghi cho OpenClaw vào các gốc cấu hình/trạng thái của nó để các thao tác cài đặt Plugin rõ ràng, cập nhật Plugin, và dọn dẹp doctor có thể lưu thay đổi:

    ```ini
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

  </Accordion>
  <Accordion title="Kiểm tra trước dung lượng đĩa">
    Trước các bản cập nhật gói và các lần cài đặt Plugin rõ ràng, OpenClaw cố gắng kiểm tra dung lượng đĩa theo best-effort cho volume mục tiêu. Dung lượng thấp tạo ra cảnh báo kèm đường dẫn đã kiểm tra, nhưng không chặn cập nhật vì hạn ngạch hệ thống tệp, snapshot, và volume mạng có thể thay đổi sau khi kiểm tra. Việc cài đặt bằng trình quản lý gói thực tế và xác minh sau cài đặt vẫn là nguồn có thẩm quyền.
  </Accordion>
</AccordionGroup>

## Trình tự động cập nhật

Trình tự động cập nhật mặc định tắt. Bật nó trong `~/.openclaw/openclaw.json`:

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

| Kênh     | Hành vi                                                                                                      |
| -------- | ------------------------------------------------------------------------------------------------------------- |
| `stable` | Chờ `stableDelayHours`, rồi áp dụng với độ lệch xác định trên `stableJitterHours` (triển khai phân tán). |
| `beta`   | Kiểm tra mỗi `betaCheckIntervalHours` (mặc định: mỗi giờ) và áp dụng ngay lập tức.                              |
| `dev`    | Không tự động áp dụng. Dùng `openclaw update` thủ công.                                                           |

Gateway cũng ghi log một gợi ý cập nhật khi khởi động (tắt bằng `update.checkOnStart: false`).
Để hạ cấp hoặc khôi phục sau sự cố, đặt `OPENCLAW_NO_AUTO_UPDATE=1` trong môi trường Gateway để chặn các lần áp dụng tự động ngay cả khi `update.auto.enabled` đã được cấu hình. Gợi ý cập nhật khi khởi động vẫn có thể chạy trừ khi `update.checkOnStart` cũng bị tắt.

Các bản cập nhật bằng trình quản lý gói được yêu cầu thông qua handler control-plane Gateway trực tiếp
buộc một lần khởi động lại cập nhật không trì hoãn, không cooldown sau khi hoán đổi gói. Điều đó
tránh để một tiến trình cũ trong bộ nhớ tồn tại đủ lâu để lazy-load các chunk
từ một cây gói đã bị thay thế. Lệnh shell `openclaw update`
vẫn là đường dẫn ưu tiên cho các bản cài đặt được giám sát vì nó có thể dừng và
khởi động lại dịch vụ quanh quá trình cập nhật.

## Sau khi cập nhật

<Steps>

### Chạy doctor

```bash
openclaw doctor
```

Di chuyển cấu hình, kiểm tra chính sách DM, và kiểm tra sức khỏe Gateway. Chi tiết: [Doctor](/vi/gateway/doctor)

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

### Ghim một commit (source)

```bash
git fetch origin
git checkout "$(git rev-list -n 1 --before=\"2026-01-01\" origin/main)"
pnpm install && pnpm build
openclaw gateway restart
```

Để quay lại mới nhất: `git checkout main && git pull`.

## Nếu bạn bị kẹt

- Chạy lại `openclaw doctor` và đọc kỹ output.
- Với `openclaw update --channel dev` trên source checkout, trình cập nhật tự động bootstrap `pnpm` khi cần. Nếu bạn thấy lỗi bootstrap pnpm/corepack, hãy cài đặt `pnpm` thủ công (hoặc bật lại `corepack`) và chạy lại bản cập nhật.
- Kiểm tra: [Khắc phục sự cố](/vi/gateway/troubleshooting)
- Hỏi trong Discord: [https://discord.gg/clawd](https://discord.gg/clawd)

## Liên quan

- [Tổng quan cài đặt](/vi/install): tất cả phương thức cài đặt.
- [Doctor](/vi/gateway/doctor): kiểm tra sức khỏe sau khi cập nhật.
- [Di chuyển](/vi/install/migrating): hướng dẫn di chuyển phiên bản lớn.
