---
read_when:
    - Cập nhật OpenClaw
    - Có lỗi xảy ra sau khi cập nhật
summary: Cập nhật OpenClaw an toàn (cài đặt toàn cục hoặc từ mã nguồn), cùng chiến lược khôi phục
title: Đang cập nhật
x-i18n:
    generated_at: "2026-06-27T17:38:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a96c5b9b12040fe9bb8b1623c88a9c305d58dc6fcee7003f500e897ded9e7b4a
    source_path: install/updating.md
    workflow: 16
---

Luôn cập nhật OpenClaw.

## Khuyến nghị: `openclaw update`

Cách nhanh nhất để cập nhật. Lệnh này phát hiện kiểu cài đặt của bạn (npm hoặc git), tải phiên bản mới nhất, chạy `openclaw doctor`, và khởi động lại Gateway.

```bash
openclaw update
```

Để chuyển kênh hoặc nhắm đến một phiên bản cụ thể:

```bash
openclaw update --channel beta
openclaw update --channel dev
openclaw update --dry-run   # preview without applying
```

`openclaw update` không chấp nhận `--verbose`. Để chẩn đoán cập nhật, dùng
`--dry-run` để xem trước các hành động dự kiến, `--json` để nhận kết quả có cấu trúc, hoặc
`openclaw update status --json` để kiểm tra trạng thái kênh và tính khả dụng. Trình cài đặt
có cờ `--verbose` riêng, nhưng cờ đó không thuộc
`openclaw update`.

`--channel beta` ưu tiên beta, nhưng runtime sẽ quay về stable/latest khi
thẻ beta bị thiếu hoặc cũ hơn bản phát hành stable mới nhất. Dùng `--tag beta`
nếu bạn muốn dist-tag npm beta thô cho một lần cập nhật gói duy nhất.

Dùng `--channel dev` cho một checkout GitHub `main` di động và bền vững. Với các bản
cập nhật gói, `--tag main` ánh xạ tới `github:openclaw/openclaw#main` cho một lần chạy, và
các đặc tả nguồn GitHub/git được đóng gói vào một tarball tạm thời trước khi thực hiện
cài đặt npm theo giai đoạn.

Với các Plugin được quản lý, cơ chế quay về của kênh beta là một cảnh báo: bản cập nhật lõi
vẫn có thể thành công trong khi một Plugin dùng bản phát hành mặc định/mới nhất đã ghi lại vì
không có bản beta Plugin nào khả dụng.

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

Chạy với `--dry-run` trước để xem trước chính xác việc chuyển đổi chế độ cài đặt:

```bash
openclaw update --channel dev --dry-run
openclaw update --channel stable --dry-run
```

Kênh `dev` bảo đảm có một git checkout, build nó, và cài đặt CLI toàn cục
từ checkout đó. Các kênh `stable` và `beta` dùng cài đặt gói. Nếu
Gateway đã được cài đặt, `openclaw update` làm mới metadata của dịch vụ
và khởi động lại dịch vụ trừ khi bạn truyền `--no-restart`.

Với cài đặt gói có dịch vụ Gateway được quản lý, `openclaw update` nhắm đến
gốc gói mà dịch vụ đó dùng. Nếu lệnh shell `openclaw` đến
từ một bản cài đặt khác, trình cập nhật in ra cả hai gốc và đường dẫn Node của dịch vụ
được quản lý. Bản cập nhật gói dùng trình quản lý gói sở hữu gốc
dịch vụ và kiểm tra Node của dịch vụ được quản lý so với engine của bản phát hành đích
trước khi thay thế gói.

## Phương án thay thế: chạy lại trình cài đặt

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

## Phương án thay thế: npm, pnpm, hoặc bun thủ công

```bash
npm i -g openclaw@latest
```

Ưu tiên `openclaw update` cho các bản cài đặt được giám sát vì nó có thể phối hợp việc
hoán đổi gói với dịch vụ Gateway đang chạy. Nếu bạn cập nhật thủ công trên một
bản cài đặt được giám sát, hãy dừng Gateway được quản lý trước khi trình quản lý gói bắt đầu.
Trình quản lý gói thay thế tệp tại chỗ, và một Gateway đang chạy nếu không có thể cố gắng
tải các tệp lõi hoặc Plugin trong khi cây gói tạm thời mới chỉ được hoán đổi một nửa.
Khởi động lại Gateway sau khi trình quản lý gói hoàn tất để dịch vụ nhận
bản cài đặt mới.

Với bản cài đặt toàn cục trên hệ thống Linux do root sở hữu, nếu `openclaw update` thất bại với
`EACCES` và bạn khôi phục bằng npm hệ thống, hãy giữ Gateway dừng trong suốt quá trình
thay thế gói thủ công. Dùng cùng các cờ hồ sơ `openclaw` hoặc môi trường
mà bạn thường dùng cho Gateway đó. Thay `/usr/bin/npm` bằng npm hệ thống
sở hữu tiền tố toàn cục do root sở hữu trên máy chủ của bạn:

```bash
openclaw gateway stop
sudo /usr/bin/npm i -g openclaw@latest
openclaw gateway install --force
openclaw gateway restart
```

Sau đó xác minh dịch vụ:

```bash
openclaw --version
curl -fsS http://127.0.0.1:18789/readyz
openclaw plugins list --json
openclaw gateway status --deep --json
openclaw doctor --lint --json
```

Khi `openclaw update` quản lý một bản cài đặt npm toàn cục, trước tiên nó cài đặt mục tiêu vào
một tiền tố npm tạm thời, xác minh inventory `dist` đã đóng gói, rồi hoán đổi
cây gói sạch vào tiền tố toàn cục thực. Điều đó tránh việc npm phủ một
gói mới lên các tệp cũ còn sót lại từ gói trước. Nếu lệnh cài đặt thất bại,
OpenClaw thử lại một lần với `--omit=optional`. Lần thử lại đó giúp các máy chủ nơi
dependency tùy chọn native không thể biên dịch, trong khi vẫn giữ lỗi gốc hiển thị
nếu fallback cũng thất bại.

Các lệnh cập nhật npm và cập nhật Plugin do OpenClaw quản lý cũng xóa vùng cách ly
`min-release-age` của npm cho tiến trình npm con. npm có thể báo cáo
chính sách đó dưới dạng ngưỡng `before` được suy ra; cả hai đều hữu ích cho các chính sách cách ly
chuỗi cung ứng nói chung, nhưng một bản cập nhật OpenClaw rõ ràng có nghĩa là "cài đặt bản phát hành
OpenClaw đã chọn ngay bây giờ."

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

### Chủ đề cài đặt npm nâng cao

<AccordionGroup>
  <Accordion title="Cây gói chỉ đọc">
    OpenClaw xem các bản cài đặt toàn cục đã đóng gói là chỉ đọc khi chạy, ngay cả khi thư mục gói toàn cục có thể ghi bởi người dùng hiện tại. Các bản cài đặt gói Plugin nằm trong các gốc npm/git do OpenClaw sở hữu dưới thư mục cấu hình người dùng, và quá trình khởi động Gateway không sửa đổi cây gói OpenClaw.

    Một số thiết lập npm trên Linux cài đặt gói toàn cục dưới các thư mục do root sở hữu như `/usr/lib/node_modules/openclaw`. OpenClaw hỗ trợ bố cục đó vì các lệnh cài đặt/cập nhật Plugin ghi ra ngoài thư mục gói toàn cục đó.

  </Accordion>
  <Accordion title="Đơn vị systemd được gia cố">
    Cấp quyền ghi cho OpenClaw vào các gốc cấu hình/trạng thái của nó để các bản cài đặt Plugin rõ ràng, cập nhật Plugin, và dọn dẹp doctor có thể lưu các thay đổi của chúng:

    ```ini
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

  </Accordion>
  <Accordion title="Kiểm tra trước dung lượng đĩa">
    Trước các bản cập nhật gói và cài đặt Plugin rõ ràng, OpenClaw cố gắng thực hiện kiểm tra dung lượng đĩa tốt nhất có thể cho volume đích. Dung lượng thấp tạo ra cảnh báo với đường dẫn đã kiểm tra, nhưng không chặn cập nhật vì quota hệ thống tệp, snapshot, và volume mạng có thể thay đổi sau bước kiểm tra. Việc cài đặt thực tế bằng trình quản lý gói và xác minh sau cài đặt vẫn là nguồn có thẩm quyền.
  </Accordion>
</AccordionGroup>

## Trình tự cập nhật

Trình tự cập nhật bị tắt theo mặc định. Bật nó trong `~/.openclaw/openclaw.json`:

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

| Kênh     | Hành vi                                                                                                       |
| -------- | ------------------------------------------------------------------------------------------------------------- |
| `stable` | Chờ `stableDelayHours`, rồi áp dụng với jitter xác định trên `stableJitterHours` (triển khai rải đều).        |
| `beta`   | Kiểm tra mỗi `betaCheckIntervalHours` (mặc định: hằng giờ) và áp dụng ngay lập tức.                           |
| `dev`    | Không áp dụng tự động. Dùng `openclaw update` thủ công.                                                       |

Gateway cũng ghi log gợi ý cập nhật khi khởi động (tắt bằng `update.checkOnStart: false`).
Để hạ cấp hoặc khôi phục sau sự cố, đặt `OPENCLAW_NO_AUTO_UPDATE=1` trong môi trường Gateway để chặn áp dụng tự động ngay cả khi `update.auto.enabled` đã được cấu hình. Gợi ý cập nhật lúc khởi động vẫn có thể chạy trừ khi `update.checkOnStart` cũng bị tắt.

Các bản cập nhật trình quản lý gói được yêu cầu thông qua handler control-plane của Gateway đang chạy
không thay thế cây gói bên trong tiến trình Gateway đang chạy. Trên các bản cài đặt
dịch vụ được quản lý, Gateway bắt đầu một handoff tách rời, thoát, và để
đường dẫn CLI `openclaw update --yes --json` bình thường dừng dịch vụ, thay thế
gói, làm mới metadata dịch vụ, khởi động lại, xác minh phiên bản Gateway và
khả năng truy cập, rồi khôi phục macOS LaunchAgent đã cài đặt nhưng chưa được nạp khi
có thể. Nếu Gateway không thể thực hiện handoff đó một cách an toàn, `update.run` báo cáo một
lệnh shell an toàn thay vì chạy trình quản lý gói trong tiến trình.

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

## Quay lại phiên bản trước

### Ghim một phiên bản (npm)

```bash
npm i -g openclaw@<version>
openclaw doctor
openclaw gateway restart
```

<Tip>
`npm view openclaw version` hiển thị phiên bản hiện đã phát hành.
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
- Với `openclaw update --channel dev` trên source checkout, trình cập nhật tự động bootstrap `pnpm` khi cần. Nếu bạn thấy lỗi bootstrap pnpm/corepack, hãy cài đặt `pnpm` thủ công (hoặc bật lại `corepack`) và chạy lại cập nhật.
- Kiểm tra: [Khắc phục sự cố](/vi/gateway/troubleshooting)
- Hỏi trên Discord: [https://discord.gg/clawd](https://discord.gg/clawd)

## Liên quan

- [Tổng quan cài đặt](/vi/install): tất cả phương thức cài đặt.
- [Doctor](/vi/gateway/doctor): kiểm tra sức khỏe sau cập nhật.
- [Di chuyển](/vi/install/migrating): hướng dẫn di chuyển phiên bản lớn.
