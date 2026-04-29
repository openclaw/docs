---
read_when:
    - Cập nhật OpenClaw
    - Có sự cố sau khi cập nhật
summary: Cập nhật OpenClaw an toàn (cài đặt toàn cục hoặc từ mã nguồn), cùng với chiến lược quay lui
title: Cập nhật
x-i18n:
    generated_at: "2026-04-29T22:54:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 17d4839002b153976e014e0eefcb44f92dcb9bb45b81bf30efb1e8e8c0f30ec3
    source_path: install/updating.md
    workflow: 16
---

Duy trì OpenClaw luôn cập nhật.

## Khuyến nghị: `openclaw update`

Cách cập nhật nhanh nhất. Lệnh này phát hiện kiểu cài đặt của bạn (npm hoặc git), tải phiên bản mới nhất, chạy `openclaw doctor`, và khởi động lại gateway.

```bash
openclaw update
```

Để chuyển kênh hoặc nhắm tới một phiên bản cụ thể:

```bash
openclaw update --channel beta
openclaw update --channel dev
openclaw update --tag main
openclaw update --dry-run   # preview without applying
```

`--channel beta` ưu tiên beta, nhưng runtime sẽ quay về stable/latest khi
thẻ beta bị thiếu hoặc cũ hơn bản phát hành ổn định mới nhất. Dùng `--tag beta`
nếu bạn muốn dist-tag beta npm thô cho một lần cập nhật gói.

Xem [Kênh phát triển](/vi/install/development-channels) để biết ngữ nghĩa của kênh.

## Chuyển đổi giữa cài đặt npm và git

Dùng các kênh khi bạn muốn thay đổi kiểu cài đặt. Trình cập nhật giữ nguyên
trạng thái, cấu hình, thông tin xác thực, và workspace của bạn trong `~/.openclaw`; nó chỉ thay đổi
bản cài đặt mã OpenClaw mà CLI và gateway sử dụng.

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

Kênh `dev` bảo đảm có một checkout git, build nó, và cài CLI toàn cục
từ checkout đó. Các kênh `stable` và `beta` dùng cài đặt gói. Nếu
gateway đã được cài đặt, `openclaw update` làm mới metadata dịch vụ
và khởi động lại nó trừ khi bạn truyền `--no-restart`.

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

Để ghim quá trình khôi phục vào một phiên bản hoặc dist-tag cụ thể, thêm `--version`:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm --version <version-or-dist-tag>
```

## Cách thay thế: npm, pnpm, hoặc bun thủ công

```bash
npm i -g openclaw@latest
```

Khi `openclaw update` quản lý một bản cài đặt npm toàn cục, trước tiên nó cài mục tiêu vào
một tiền tố npm tạm thời, xác minh inventory `dist` đã đóng gói, rồi hoán đổi
cây gói sạch vào tiền tố toàn cục thật. Điều đó tránh việc npm phủ một
gói mới lên các tệp cũ còn sót lại từ gói cũ. Nếu lệnh cài đặt thất bại,
OpenClaw thử lại một lần với `--omit=optional`. Lần thử lại đó giúp các host nơi
phụ thuộc tùy chọn native không thể biên dịch, đồng thời vẫn giữ lỗi ban đầu hiển thị
nếu fallback cũng thất bại.

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

### Chủ đề cài đặt npm nâng cao

<AccordionGroup>
  <Accordion title="Cây gói chỉ đọc">
    OpenClaw coi các bản cài đặt toàn cục đã đóng gói là chỉ đọc lúc runtime, ngay cả khi thư mục gói toàn cục có thể ghi bởi người dùng hiện tại. Các phụ thuộc runtime của Plugin được đóng gói kèm được đặt vào một thư mục runtime có thể ghi thay vì sửa đổi cây gói. Điều này giúp `openclaw update` không tranh chấp với một gateway đang chạy hoặc agent cục bộ đang sửa chữa phụ thuộc Plugin trong cùng lần cài đặt.

    Một số thiết lập npm Linux cài các gói toàn cục dưới các thư mục thuộc sở hữu root như `/usr/lib/node_modules/openclaw`. OpenClaw hỗ trợ bố cục đó thông qua cùng đường dẫn staging bên ngoài.

  </Accordion>
  <Accordion title="Đơn vị systemd được gia cố">
    Đặt một thư mục stage có thể ghi được đưa vào `ReadWritePaths`:

    ```ini
    Environment=OPENCLAW_PLUGIN_STAGE_DIR=/var/lib/openclaw/plugin-runtime-deps
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

    `OPENCLAW_PLUGIN_STAGE_DIR` cũng chấp nhận danh sách đường dẫn. OpenClaw phân giải các phụ thuộc runtime của Plugin được đóng gói kèm từ trái sang phải trên các root đã liệt kê, coi các root trước là các lớp cài sẵn chỉ đọc, và chỉ cài đặt hoặc sửa chữa vào root cuối cùng có thể ghi:

    ```ini
    Environment=OPENCLAW_PLUGIN_STAGE_DIR=/opt/openclaw/plugin-runtime-deps:/var/lib/openclaw/plugin-runtime-deps
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

    Nếu `OPENCLAW_PLUGIN_STAGE_DIR` không được đặt, OpenClaw dùng `$STATE_DIRECTORY` khi systemd cung cấp, rồi fallback về `~/.openclaw/plugin-runtime-deps`. Bước sửa chữa coi stage đó là root gói cục bộ do OpenClaw sở hữu và bỏ qua tiền tố npm của người dùng cùng các thiết lập toàn cục, nên cấu hình npm cài đặt toàn cục không chuyển hướng các phụ thuộc Plugin được đóng gói kèm vào `~/node_modules` hoặc cây gói toàn cục.

  </Accordion>
  <Accordion title="Kiểm tra trước dung lượng đĩa">
    Trước các bản cập nhật gói và sửa chữa phụ thuộc runtime được đóng gói kèm, OpenClaw thử kiểm tra dung lượng đĩa theo khả năng tốt nhất cho volume mục tiêu. Dung lượng thấp tạo cảnh báo kèm đường dẫn đã kiểm tra, nhưng không chặn cập nhật vì quota hệ thống tệp, snapshot, và volume mạng có thể thay đổi sau khi kiểm tra. Quá trình cài npm, sao chép, và xác minh sau cài đặt thực tế vẫn là nguồn quyết định.
  </Accordion>
  <Accordion title="Phụ thuộc runtime của Plugin được đóng gói kèm">
    Các bản cài đặt đã đóng gói giữ phụ thuộc runtime của Plugin được đóng gói kèm bên ngoài cây gói chỉ đọc. Khi khởi động và trong `openclaw doctor --fix`, OpenClaw chỉ sửa chữa phụ thuộc runtime cho các Plugin được đóng gói kèm đang hoạt động trong cấu hình, hoạt động thông qua cấu hình kênh legacy, hoặc được bật bởi mặc định manifest được đóng gói kèm của chúng. Chỉ riêng trạng thái xác thực kênh đã lưu không kích hoạt sửa chữa phụ thuộc runtime khi Gateway khởi động.

    Việc tắt rõ ràng có ưu tiên. Một Plugin hoặc kênh đã tắt sẽ không được sửa chữa phụ thuộc runtime chỉ vì nó tồn tại trong gói. Plugin bên ngoài và đường dẫn tải tùy chỉnh vẫn dùng `openclaw plugins install` hoặc `openclaw plugins update`.

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
| `stable` | Đợi `stableDelayHours`, rồi áp dụng với jitter xác định trên `stableJitterHours` (triển khai phân tán). |
| `beta`   | Kiểm tra mỗi `betaCheckIntervalHours` (mặc định: hằng giờ) và áp dụng ngay lập tức.                              |
| `dev`    | Không áp dụng tự động. Dùng `openclaw update` thủ công.                                                           |

Gateway cũng ghi một gợi ý cập nhật khi khởi động (tắt bằng `update.checkOnStart: false`).
Để hạ cấp hoặc khôi phục sau sự cố, đặt `OPENCLAW_NO_AUTO_UPDATE=1` trong môi trường gateway để chặn áp dụng tự động ngay cả khi `update.auto.enabled` đã được cấu hình. Gợi ý cập nhật khi khởi động vẫn có thể chạy trừ khi `update.checkOnStart` cũng bị tắt.

## Sau khi cập nhật

<Steps>

### Chạy doctor

```bash
openclaw doctor
```

Di chuyển cấu hình, kiểm tra chính sách DM, và kiểm tra sức khỏe gateway. Chi tiết: [Doctor](/vi/gateway/doctor)

### Khởi động lại gateway

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
- Với `openclaw update --channel dev` trên các checkout nguồn, trình cập nhật tự động bootstrap `pnpm` khi cần. Nếu bạn thấy lỗi bootstrap pnpm/corepack, hãy cài `pnpm` thủ công (hoặc bật lại `corepack`) và chạy lại cập nhật.
- Kiểm tra: [Khắc phục sự cố](/vi/gateway/troubleshooting)
- Hỏi trong Discord: [https://discord.gg/clawd](https://discord.gg/clawd)

## Liên quan

- [Tổng quan cài đặt](/vi/install): tất cả phương thức cài đặt.
- [Doctor](/vi/gateway/doctor): kiểm tra sức khỏe sau cập nhật.
- [Di chuyển](/vi/install/migrating): hướng dẫn di chuyển phiên bản lớn.
