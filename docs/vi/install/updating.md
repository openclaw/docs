---
read_when:
    - Cập nhật OpenClaw
    - Có sự cố sau khi cập nhật
summary: Cập nhật OpenClaw an toàn (cài đặt toàn cục hoặc từ mã nguồn), cùng chiến lược hoàn nguyên
title: Cập nhật
x-i18n:
    generated_at: "2026-05-01T10:49:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: b6ee340af569dde3a6cf61fff26d2a0ab8c8ec882b652f41d6ac8e22ddc5fed1
    source_path: install/updating.md
    workflow: 16
---

Giữ OpenClaw luôn cập nhật.

## Khuyến nghị: `openclaw update`

Cách nhanh nhất để cập nhật. Lệnh này phát hiện kiểu cài đặt của bạn (npm hoặc git), lấy phiên bản mới nhất, chạy `openclaw doctor`, rồi khởi động lại Gateway.

```bash
openclaw update
```

Để chuyển kênh hoặc nhắm đến một phiên bản cụ thể:

```bash
openclaw update --channel beta
openclaw update --channel dev
openclaw update --tag main
openclaw update --dry-run   # xem trước mà không áp dụng
```

`--channel beta` ưu tiên beta, nhưng runtime sẽ quay về stable/latest khi
thẻ beta bị thiếu hoặc cũ hơn bản phát hành stable mới nhất. Dùng `--tag beta`
nếu bạn muốn dist-tag beta npm thô cho một lần cập nhật gói riêng lẻ.

Xem [Kênh phát triển](/vi/install/development-channels) để biết ngữ nghĩa của kênh.

## Chuyển đổi giữa cài đặt npm và git

Dùng kênh khi bạn muốn thay đổi kiểu cài đặt. Trình cập nhật giữ nguyên
trạng thái, cấu hình, thông tin xác thực và workspace của bạn trong `~/.openclaw`; nó chỉ thay đổi
bản cài đặt mã OpenClaw mà CLI và Gateway sử dụng.

```bash
# cài đặt gói npm -> checkout git có thể chỉnh sửa
openclaw update --channel dev

# checkout git -> cài đặt gói npm
openclaw update --channel stable
```

Chạy với `--dry-run` trước để xem trước chính xác việc chuyển đổi chế độ cài đặt:

```bash
openclaw update --channel dev --dry-run
openclaw update --channel stable --dry-run
```

Kênh `dev` bảo đảm có checkout git, build nó và cài đặt CLI toàn cục
từ checkout đó. Các kênh `stable` và `beta` dùng cài đặt gói. Nếu
Gateway đã được cài đặt, `openclaw update` làm mới siêu dữ liệu dịch vụ
và khởi động lại, trừ khi bạn truyền `--no-restart`.

## Cách khác: chạy lại trình cài đặt

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

## Cách khác: npm, pnpm hoặc bun thủ công

```bash
npm i -g openclaw@latest
```

Khi `openclaw update` quản lý một bản cài đặt npm toàn cục, trước tiên nó cài đặt mục tiêu vào
một tiền tố npm tạm thời, xác minh inventory `dist` đã đóng gói, rồi hoán đổi
cây gói sạch vào tiền tố toàn cục thật. Việc này tránh để npm phủ một
gói mới lên các tệp cũ còn sót lại từ gói cũ. Nếu lệnh cài đặt thất bại,
OpenClaw thử lại một lần với `--omit=optional`. Lần thử lại đó giúp các máy chủ nơi
các dependency optional native không thể biên dịch, đồng thời vẫn giữ lỗi ban đầu hiển thị
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
    OpenClaw coi các bản cài đặt toàn cục đã đóng gói là chỉ đọc tại runtime, ngay cả khi thư mục gói toàn cục có thể ghi bởi người dùng hiện tại. Các dependency runtime của Plugin đi kèm được staging vào một thư mục runtime có thể ghi thay vì thay đổi cây gói. Điều này giúp `openclaw update` không chạy đua với một Gateway hoặc tác nhân cục bộ đang chạy và đang sửa các dependency của Plugin trong cùng lần cài đặt.

    Một số thiết lập npm trên Linux cài đặt các gói toàn cục dưới các thư mục thuộc sở hữu root như `/usr/lib/node_modules/openclaw`. OpenClaw hỗ trợ bố cục đó thông qua cùng đường dẫn staging bên ngoài.

  </Accordion>
  <Accordion title="Unit systemd được gia cố">
    Đặt một thư mục stage có thể ghi được đưa vào `ReadWritePaths`:

    ```ini
    Environment=OPENCLAW_PLUGIN_STAGE_DIR=/var/lib/openclaw/plugin-runtime-deps
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

    `OPENCLAW_PLUGIN_STAGE_DIR` cũng chấp nhận danh sách đường dẫn. OpenClaw phân giải các dependency runtime của Plugin đi kèm từ trái sang phải trên các root được liệt kê, coi các root trước đó là các lớp cài đặt sẵn chỉ đọc, và chỉ cài đặt hoặc sửa vào root có thể ghi cuối cùng:

    ```ini
    Environment=OPENCLAW_PLUGIN_STAGE_DIR=/opt/openclaw/plugin-runtime-deps:/var/lib/openclaw/plugin-runtime-deps
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

    Nếu `OPENCLAW_PLUGIN_STAGE_DIR` chưa được đặt, OpenClaw dùng `$STATE_DIRECTORY` khi systemd cung cấp, rồi fallback về `~/.openclaw/plugin-runtime-deps`. Bước sửa coi stage đó là một root gói cục bộ thuộc sở hữu OpenClaw và bỏ qua tiền tố npm người dùng cùng các thiết lập toàn cục, nên cấu hình npm cài đặt toàn cục không chuyển hướng dependency của Plugin đi kèm vào `~/node_modules` hoặc cây gói toàn cục.

  </Accordion>
  <Accordion title="Kiểm tra trước dung lượng đĩa">
    Trước các cập nhật gói và sửa dependency runtime đi kèm, OpenClaw cố gắng kiểm tra dung lượng đĩa theo best-effort cho volume mục tiêu. Dung lượng thấp tạo cảnh báo kèm đường dẫn đã kiểm tra, nhưng không chặn cập nhật vì quota hệ thống tệp, snapshot và volume mạng có thể thay đổi sau khi kiểm tra. Việc cài đặt npm, sao chép và xác minh sau cài đặt thực tế vẫn là nguồn có thẩm quyền.
  </Accordion>
  <Accordion title="Dependency runtime của Plugin đi kèm">
    Các bản cài đặt đã đóng gói giữ dependency runtime của Plugin đi kèm bên ngoài cây gói chỉ đọc. Khi khởi động và trong `openclaw doctor --fix`, OpenClaw chỉ sửa dependency runtime cho các Plugin đi kèm đang hoạt động trong cấu hình, hoạt động thông qua cấu hình kênh legacy, hoặc được bật bởi mặc định manifest đi kèm của chúng. Chỉ riêng trạng thái xác thực kênh đã lưu không kích hoạt sửa dependency runtime khi Gateway khởi động.

    Việc vô hiệu hóa tường minh được ưu tiên. Một Plugin hoặc kênh đã tắt sẽ không được sửa dependency runtime chỉ vì nó tồn tại trong gói. Plugin bên ngoài và đường dẫn tải tùy chỉnh vẫn dùng `openclaw plugins install` hoặc `openclaw plugins update`.

  </Accordion>
</AccordionGroup>

## Trình tự cập nhật tự động

Trình tự cập nhật tự động tắt theo mặc định. Bật nó trong `~/.openclaw/openclaw.json`:

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
| `stable` | Chờ `stableDelayHours`, rồi áp dụng với jitter xác định trên `stableJitterHours` (triển khai phân tán). |
| `beta`   | Kiểm tra mỗi `betaCheckIntervalHours` (mặc định: hằng giờ) và áp dụng ngay.                              |
| `dev`    | Không tự động áp dụng. Dùng `openclaw update` thủ công.                                                           |

Gateway cũng ghi log gợi ý cập nhật khi khởi động (tắt bằng `update.checkOnStart: false`).
Để hạ phiên bản hoặc khôi phục sự cố, đặt `OPENCLAW_NO_AUTO_UPDATE=1` trong môi trường Gateway để chặn áp dụng tự động ngay cả khi `update.auto.enabled` đã được cấu hình. Gợi ý cập nhật khi khởi động vẫn có thể chạy trừ khi `update.checkOnStart` cũng bị tắt.

Các cập nhật trình quản lý gói được yêu cầu qua handler control-plane Gateway trực tiếp
ép khởi động lại cập nhật không trì hoãn, không cooldown sau khi hoán đổi gói. Điều đó
tránh để một tiến trình cũ trong bộ nhớ tồn tại đủ lâu để lazy-load các chunk
từ một cây gói đã bị thay thế. Shell `openclaw update`
vẫn là đường dẫn ưu tiên cho các bản cài đặt được giám sát vì nó có thể dừng và
khởi động lại dịch vụ quanh quá trình cập nhật.

## Sau khi cập nhật

<Steps>

### Chạy doctor

```bash
openclaw doctor
```

Di chuyển cấu hình, audit chính sách DM và kiểm tra sức khỏe Gateway. Chi tiết: [Doctor](/vi/gateway/doctor)

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
- Với `openclaw update --channel dev` trên checkout nguồn, trình cập nhật tự động bootstrap `pnpm` khi cần. Nếu bạn thấy lỗi bootstrap pnpm/corepack, hãy cài đặt `pnpm` thủ công (hoặc bật lại `corepack`) rồi chạy lại cập nhật.
- Kiểm tra: [Khắc phục sự cố](/vi/gateway/troubleshooting)
- Hỏi trong Discord: [https://discord.gg/clawd](https://discord.gg/clawd)

## Liên quan

- [Tổng quan cài đặt](/vi/install): tất cả phương thức cài đặt.
- [Doctor](/vi/gateway/doctor): kiểm tra sức khỏe sau cập nhật.
- [Di chuyển](/vi/install/migrating): hướng dẫn di chuyển phiên bản lớn.
