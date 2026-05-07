---
read_when:
    - Cập nhật OpenClaw
    - Có sự cố sau khi cập nhật
summary: Cập nhật OpenClaw an toàn (cài đặt toàn cục hoặc từ mã nguồn), cùng chiến lược hoàn nguyên
title: Cập nhật
x-i18n:
    generated_at: "2026-05-07T01:52:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 520f30980c56b9bcfc78bb2e916df812b2770a88c663140eeee3e9697bf58ee6
    source_path: install/updating.md
    workflow: 16
---

Luôn cập nhật OpenClaw.

## Khuyến nghị: `openclaw update`

Cách cập nhật nhanh nhất. Lệnh này phát hiện kiểu cài đặt của bạn (npm hoặc git), tải phiên bản mới nhất, chạy `openclaw doctor`, rồi khởi động lại Gateway.

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

`openclaw update` không chấp nhận `--verbose`. Để chẩn đoán cập nhật, hãy dùng
`--dry-run` để xem trước các hành động dự kiến, `--json` để nhận kết quả có cấu trúc, hoặc
`openclaw update status --json` để kiểm tra trạng thái kênh và khả dụng. Trình cài đặt
có cờ `--verbose` riêng, nhưng cờ đó không thuộc về
`openclaw update`.

`--channel beta` ưu tiên beta, nhưng runtime sẽ quay về stable/latest khi
thẻ beta bị thiếu hoặc cũ hơn bản phát hành stable mới nhất. Dùng `--tag beta`
nếu bạn muốn dist-tag beta thô của npm cho một lần cập nhật gói riêng lẻ.

OpenClaw hiện chưa cung cấp kênh cập nhật hỗ trợ LTS hoặc hằng tháng. Chúng tôi đang
hướng tới các dòng hỗ trợ hằng tháng tương thích SemVer, nhưng hiện tại các kênh được hỗ trợ
vẫn là `stable`, `beta`, và `dev`.

Xem [Kênh phát triển](/vi/install/development-channels) để biết ngữ nghĩa của kênh.

## Chuyển đổi giữa cài đặt npm và git

Dùng kênh khi bạn muốn thay đổi kiểu cài đặt. Trình cập nhật giữ nguyên
trạng thái, cấu hình, thông tin xác thực, và workspace của bạn trong `~/.openclaw`; nó chỉ thay đổi
bản cài đặt mã OpenClaw mà CLI và Gateway sử dụng.

```bash
# npm package install -> editable git checkout
openclaw update --channel dev

# git checkout -> npm package install
openclaw update --channel stable
```

Chạy với `--dry-run` trước để xem trước chính xác thao tác chuyển chế độ cài đặt:

```bash
openclaw update --channel dev --dry-run
openclaw update --channel stable --dry-run
```

Kênh `dev` đảm bảo có một bản checkout git, build bản đó, và cài CLI toàn cục
từ checkout đó. Các kênh `stable` và `beta` dùng cài đặt gói. Nếu
Gateway đã được cài đặt, `openclaw update` làm mới metadata của dịch vụ
và khởi động lại dịch vụ, trừ khi bạn truyền `--no-restart`.

## Cách khác: chạy lại trình cài đặt

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

Thêm `--no-onboard` để bỏ qua onboarding. Để buộc một kiểu cài đặt cụ thể thông qua
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

## Cách khác: npm, pnpm, hoặc bun thủ công

```bash
npm i -g openclaw@latest
```

Nên dùng `openclaw update` cho các bản cài đặt được giám sát vì lệnh này có thể phối hợp
việc hoán đổi gói với dịch vụ Gateway đang chạy. Nếu bạn cập nhật thủ công trong khi một
Gateway được quản lý đang chạy, hãy khởi động lại Gateway ngay sau khi trình quản lý gói
hoàn tất để tiến trình cũ không tiếp tục phục vụ từ các tệp gói đã bị thay thế.

Khi `openclaw update` quản lý một bản cài đặt npm toàn cục, nó cài mục tiêu vào
một prefix npm tạm thời trước, xác minh inventory `dist` đã đóng gói, rồi hoán đổi
cây gói sạch vào prefix toàn cục thật. Điều đó tránh việc npm phủ một
gói mới lên các tệp cũ còn sót từ gói trước. Nếu lệnh cài đặt thất bại,
OpenClaw thử lại một lần với `--omit=optional`. Lần thử lại đó hữu ích cho các máy chủ nơi
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
  <Accordion title="Cây gói chỉ đọc">
    OpenClaw xem các bản cài đặt toàn cục đã đóng gói là chỉ đọc tại runtime, ngay cả khi thư mục gói toàn cục có thể ghi bởi người dùng hiện tại. Các bản cài đặt gói Plugin nằm trong các root npm/git do OpenClaw sở hữu bên dưới thư mục cấu hình người dùng, và quá trình khởi động Gateway không sửa đổi cây gói OpenClaw.

    Một số thiết lập npm trên Linux cài gói toàn cục trong các thư mục do root sở hữu như `/usr/lib/node_modules/openclaw`. OpenClaw hỗ trợ bố cục đó vì các lệnh cài đặt/cập nhật Plugin ghi ra bên ngoài thư mục gói toàn cục đó.

  </Accordion>
  <Accordion title="Đơn vị systemd được gia cố">
    Cấp cho OpenClaw quyền ghi vào các root cấu hình/trạng thái của nó để các thao tác cài đặt Plugin tường minh, cập nhật Plugin, và dọn dẹp doctor có thể lưu lại thay đổi:

    ```ini
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

  </Accordion>
  <Accordion title="Kiểm tra trước dung lượng ổ đĩa">
    Trước khi cập nhật gói và cài đặt Plugin tường minh, OpenClaw cố gắng kiểm tra dung lượng ổ đĩa theo kiểu nỗ lực tối đa cho volume mục tiêu. Dung lượng thấp tạo cảnh báo kèm đường dẫn đã kiểm tra, nhưng không chặn cập nhật vì quota hệ thống tệp, snapshot, và volume mạng có thể thay đổi sau khi kiểm tra. Việc cài đặt bằng trình quản lý gói thực tế và xác minh sau cài đặt vẫn là căn cứ có thẩm quyền.
  </Accordion>
</AccordionGroup>

## Trình tự động cập nhật

Trình tự động cập nhật mặc định bị tắt. Bật nó trong `~/.openclaw/openclaw.json`:

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

| Kênh     | Hành vi                                                                                                                |
| -------- | ---------------------------------------------------------------------------------------------------------------------- |
| `stable` | Chờ `stableDelayHours`, rồi áp dụng với jitter tất định trong `stableJitterHours` (triển khai dàn trải).              |
| `beta`   | Kiểm tra mỗi `betaCheckIntervalHours` (mặc định: hằng giờ) và áp dụng ngay lập tức.                                    |
| `dev`    | Không tự động áp dụng. Dùng `openclaw update` thủ công.                                                                 |

Gateway cũng ghi log gợi ý cập nhật khi khởi động (tắt bằng `update.checkOnStart: false`).
Để hạ cấp hoặc khôi phục sau sự cố, đặt `OPENCLAW_NO_AUTO_UPDATE=1` trong môi trường Gateway để chặn áp dụng tự động ngay cả khi `update.auto.enabled` đã được cấu hình. Gợi ý cập nhật khi khởi động vẫn có thể chạy trừ khi `update.checkOnStart` cũng bị tắt.

Các cập nhật bằng trình quản lý gói được yêu cầu thông qua trình xử lý control-plane Gateway trực tiếp
buộc khởi động lại cập nhật không trì hoãn, không cooldown sau khi hoán đổi gói. Điều đó
tránh để một tiến trình cũ trong bộ nhớ tồn tại đủ lâu để lazy-load các chunk
từ một cây gói đã bị thay thế. Shell `openclaw update`
vẫn là đường dẫn ưu tiên cho các bản cài đặt được giám sát vì nó có thể dừng và
khởi động lại dịch vụ trong quá trình cập nhật.

## Sau khi cập nhật

<Steps>

### Chạy doctor

```bash
openclaw doctor
```

Di chuyển cấu hình, kiểm tra chính sách DM, và kiểm tra tình trạng Gateway. Chi tiết: [Doctor](/vi/gateway/doctor)

### Khởi động lại Gateway

```bash
openclaw gateway restart
```

### Xác minh

```bash
openclaw health
```

</Steps>

## Khôi phục phiên bản trước

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

Để quay lại bản mới nhất: `git checkout main && git pull`.

## Nếu bạn bị kẹt

- Chạy lại `openclaw doctor` và đọc kỹ đầu ra.
- Với `openclaw update --channel dev` trên các source checkout, trình cập nhật tự động bootstrap `pnpm` khi cần. Nếu bạn thấy lỗi bootstrap pnpm/corepack, hãy cài `pnpm` thủ công (hoặc bật lại `corepack`) rồi chạy lại cập nhật.
- Kiểm tra: [Khắc phục sự cố](/vi/gateway/troubleshooting)
- Hỏi trong Discord: [https://discord.gg/clawd](https://discord.gg/clawd)

## Liên quan

- [Tổng quan cài đặt](/vi/install): tất cả phương thức cài đặt.
- [Doctor](/vi/gateway/doctor): kiểm tra tình trạng sau khi cập nhật.
- [Di chuyển](/vi/install/migrating): hướng dẫn di chuyển phiên bản lớn.
