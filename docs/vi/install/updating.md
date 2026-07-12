---
read_when:
    - Cập nhật OpenClaw
    - Có sự cố xảy ra sau khi cập nhật
summary: Cập nhật OpenClaw an toàn (cài đặt toàn cục hoặc từ mã nguồn), cùng chiến lược hoàn tác
title: Cập nhật
x-i18n:
    generated_at: "2026-07-12T08:04:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 06b475fcd715afa5f4b9fa3fc7d546ba8dc53805c6a29e12fd4706dceb04cb60
    source_path: install/updating.md
    workflow: 16
---

Luôn cập nhật OpenClaw lên phiên bản mới nhất.

Đối với việc thay thế ảnh Docker, Podman và Kubernetes, hãy xem
[Nâng cấp ảnh vùng chứa](/vi/install/docker#upgrading-container-images). Gateway
thực hiện công việc nâng cấp an toàn khi khởi động trước khi chuyển sang trạng
thái sẵn sàng và sẽ thoát nếu trạng thái được gắn kết cần sửa chữa thủ công.

## Khuyến nghị: `openclaw update`

Phát hiện loại cài đặt của bạn (npm hoặc git), tải phiên bản mới nhất, chạy `openclaw doctor` và khởi động lại Gateway.

```bash
openclaw update
```

Chuyển kênh hoặc nhắm đến một phiên bản cụ thể:

```bash
openclaw update --channel beta
openclaw update --channel extended-stable
openclaw update --channel dev
openclaw update --dry-run   # preview without applying
```

`openclaw update` không có cờ `--verbose` (trình cài đặt thì có). Để chẩn đoán, hãy dùng
`--dry-run` để xem trước các hành động dự kiến, `--json` để nhận kết quả có cấu trúc hoặc
`openclaw update status --json` để kiểm tra trạng thái kênh và tính khả dụng.

`--channel beta` ưu tiên dist-tag beta của npm nhưng chuyển về stable/latest
khi thiếu thẻ beta hoặc phiên bản của thẻ này cũ hơn bản phát hành ổn định mới
nhất. Thay vào đó, hãy dùng `--tag beta` để cập nhật gói một lần, được ghim vào
dist-tag beta nguyên bản của npm.

`--channel extended-stable` chỉ dành cho gói và quá trình cài đặt vẫn
chỉ chạy ở tiền cảnh. OpenClaw đọc bộ chọn `extended-stable` công khai của npm,
xác minh chính xác gói được chọn và cài đặt đúng phiên bản đó. Dữ liệu registry
bị thiếu hoặc không nhất quán sẽ khiến thao tác dừng an toàn; hệ thống không bao
giờ chuyển về `latest`. Nếu phiên bản được chọn cũ hơn phiên bản đã cài đặt, yêu
cầu xác nhận hạ cấp thông thường vẫn được áp dụng. CLI lưu kênh sau khi cập nhật
lõi thành công; lệnh trực tiếp `npm install -g openclaw@extended-stable`
không cập nhật `update.channel`.
Sau khi thay lõi, các Plugin npm chính thức đủ điều kiện có chủ đích để trống/mặc
định hoặc `latest` sẽ hội tụ về đúng phiên bản lõi đó. Các phiên bản ghim chính
xác và thẻ khác `latest` được chỉ định rõ ràng, Plugin bên thứ ba và nguồn không
phải npm vẫn giữ nguyên. Các lượt cài đặt từ danh mục được tạo bởi phiên bản
OpenClaw hiện tại sẽ giữ lại chủ đích mặc định đó. Những bản ghi cũ chỉ chứa một
phiên bản chính xác vẫn được ghim vì OpenClaw không thể phân biệt an toàn giữa
một phiên bản ghim tự động cũ và phiên bản do người dùng ghim; hãy chạy
`openclaw plugins update @openclaw/name` một lần trên kênh extended-stable
để đưa Plugin đó trở lại chế độ theo dõi chính xác phiên bản lõi.

`--channel dev` cung cấp một bản checkout GitHub `main` liên tục dịch chuyển và
được duy trì lâu dài. Để cập nhật gói một lần, `--tag main` ánh xạ đến đặc tả gói
`github:openclaw/openclaw#main` và cài đặt trực tiếp thông qua trình quản lý gói
đích (npm/pnpm/bun).

Đối với các Plugin được quản lý, việc thiếu bản phát hành beta chỉ tạo cảnh báo,
không phải lỗi: quá trình cập nhật lõi vẫn có thể thành công trong khi Plugin
chuyển về bản phát hành mặc định/latest đã ghi nhận.

Xem [Các kênh phát hành](/vi/install/development-channels) để biết ngữ nghĩa của từng kênh.

## Chuyển đổi giữa bản cài đặt npm và git

Dùng các kênh để thay đổi loại cài đặt. Trình cập nhật giữ nguyên trạng thái,
cấu hình, thông tin xác thực và không gian làm việc của bạn trong `~/.openclaw`;
nó chỉ thay đổi bản cài đặt mã OpenClaw mà CLI và Gateway sử dụng.

```bash
# npm package install -> editable git checkout
openclaw update --channel dev

# git checkout -> npm package install
openclaw update --channel stable
```

Trước tiên, hãy xem trước việc chuyển đổi chế độ cài đặt:

```bash
openclaw update --channel dev --dry-run
openclaw update --channel stable --dry-run
```

`dev` bảo đảm có một bản checkout git, xây dựng bản đó và cài đặt CLI toàn cục
từ bản checkout này. Các kênh `stable`, `extended-stable` và `beta` sử dụng bản
cài đặt gói. Extended-stable bị từ chối trên bản checkout git mà không sửa đổi
hoặc chuyển đổi bản checkout đó. Nếu Gateway đã được cài đặt, `openclaw update`
làm mới siêu dữ liệu dịch vụ và khởi động lại dịch vụ, trừ khi bạn truyền
`--no-restart`.

Đối với bản cài đặt gói có dịch vụ Gateway được quản lý, `openclaw update` nhắm
đến thư mục gốc của gói mà dịch vụ đó sử dụng. Nếu lệnh `openclaw` trong shell
đến từ một bản cài đặt khác, trình cập nhật sẽ hiển thị cả hai thư mục gốc và
đường dẫn Node của dịch vụ được quản lý, đồng thời kiểm tra phiên bản Node đó
theo yêu cầu `engines.node` của bản phát hành đích trước khi thay thế gói.

## Phương án khác: chạy lại trình cài đặt

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

Thêm `--no-onboard` để bỏ qua quá trình thiết lập ban đầu. Để buộc dùng một loại
cài đặt cụ thể, hãy truyền `--install-method git --no-onboard` hoặc
`--install-method npm --no-onboard`.

Nếu `openclaw update` thất bại sau giai đoạn cài đặt gói npm, hãy chạy lại trình
cài đặt. Trình này không gọi trình cập nhật; nó chạy trực tiếp quá trình cài đặt
gói toàn cục và có thể khôi phục một bản cài đặt npm mới chỉ được cập nhật một phần.

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
```

Ghim quá trình khôi phục vào một phiên bản hoặc dist-tag cụ thể bằng `--version`:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm --version <version-or-dist-tag>
```

## Phương án khác: dùng npm, pnpm hoặc bun thủ công

```bash
npm i -g openclaw@latest
```

Nên dùng `openclaw update` cho các bản cài đặt được giám sát: lệnh này có thể
điều phối việc thay gói với dịch vụ Gateway đang chạy. Nếu bạn cập nhật thủ công
trên một bản cài đặt được giám sát, trước tiên hãy dừng Gateway được quản lý.
Trình quản lý gói thay thế tệp ngay tại chỗ, vì vậy nếu không dừng, Gateway đang
chạy có thể cố tải các tệp lõi hoặc Plugin trong lúc thay thế. Hãy khởi động lại
Gateway sau khi trình quản lý gói hoàn tất để Gateway nhận bản cài đặt mới.

Đối với bản cài đặt toàn hệ thống trên Linux do root sở hữu, nếu
`openclaw update` thất bại với `EACCES`, hãy khôi phục bằng npm hệ thống trong
khi vẫn giữ Gateway ở trạng thái dừng để thay thế thủ công. Sử dụng các cờ hồ sơ
và môi trường giống như bạn thường dùng cho Gateway đó. Thay `/usr/bin/npm`
bằng npm hệ thống sở hữu tiền tố toàn cục do root quản lý trên máy chủ của bạn:

```bash
openclaw gateway stop
sudo /usr/bin/npm i -g openclaw@latest
openclaw gateway install --force
openclaw gateway restart
```

Sau đó xác minh:

```bash
openclaw --version
curl -fsS http://127.0.0.1:18789/readyz
openclaw plugins list --json
openclaw gateway status --deep --json
openclaw doctor --lint --json
```

Khi `openclaw update` quản lý một bản cài đặt npm toàn cục, trước tiên nó cài
đặt đích vào một tiền tố npm tạm thời, xác minh danh mục `dist` đã đóng gói, rồi
thay cây gói sạch vào tiền tố toàn cục thực — tránh việc npm phủ gói mới lên các
tệp cũ còn sót lại từ gói trước. Nếu lệnh cài đặt thất bại, OpenClaw thử lại một
lần với `--omit=optional`, điều này hữu ích trên các máy chủ không thể biên dịch
các phần phụ thuộc tùy chọn gốc.

Các lệnh cập nhật npm và cập nhật Plugin do OpenClaw quản lý cũng xóa vùng cách
ly chuỗi cung ứng `min-release-age` của npm (hoặc khóa cấu hình `before` cũ hơn)
cho tiến trình npm con. Chính sách đó tồn tại để bảo vệ chung, nhưng một yêu cầu
cập nhật OpenClaw rõ ràng có nghĩa là "cài đặt bản phát hành đã chọn ngay bây giờ".

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

### Chủ đề cài đặt npm nâng cao

<AccordionGroup>
  <Accordion title="Cây gói chỉ đọc">
    OpenClaw coi các bản cài đặt toàn cục đã đóng gói là chỉ đọc trong thời gian chạy, ngay cả khi người dùng hiện tại có thể ghi vào thư mục gói toàn cục. Các bản cài đặt gói Plugin nằm trong những thư mục gốc npm/git do OpenClaw sở hữu bên dưới thư mục cấu hình người dùng và quá trình khởi động Gateway không sửa đổi cây gói OpenClaw.

    Một số thiết lập npm trên Linux cài đặt các gói toàn cục trong những thư mục do root sở hữu, chẳng hạn như `/usr/lib/node_modules/openclaw`. OpenClaw hỗ trợ bố cục đó vì các lệnh cài đặt/cập nhật Plugin ghi ra bên ngoài thư mục gói toàn cục đó.

  </Accordion>
  <Accordion title="Các đơn vị systemd được tăng cường bảo mật">
    Cấp cho OpenClaw quyền ghi vào các thư mục gốc cấu hình/trạng thái để các lượt cài đặt Plugin rõ ràng, cập nhật Plugin và dọn dẹp bằng doctor có thể lưu các thay đổi:

    ```ini
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

  </Accordion>
  <Accordion title="Kiểm tra trước dung lượng đĩa">
    Trước khi cập nhật gói và cài đặt Plugin rõ ràng, OpenClaw cố gắng kiểm tra dung lượng đĩa của ổ đĩa đích theo khả năng tốt nhất. Dung lượng thấp sẽ tạo cảnh báo kèm đường dẫn đã kiểm tra nhưng không chặn quá trình cập nhật vì hạn ngạch hệ thống tệp, ảnh chụp nhanh và ổ đĩa mạng có thể thay đổi sau khi kiểm tra. Quá trình cài đặt thực tế của trình quản lý gói và bước xác minh sau cài đặt vẫn là căn cứ quyết định.
  </Accordion>
</AccordionGroup>

## Trình cập nhật tự động

Mặc định bị tắt. Bật trong `~/.openclaw/openclaw.json`:

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

| Kênh              | Hành vi                                                                                                                                                             |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `stable`          | Chờ `stableDelayHours` (mặc định: 6), sau đó áp dụng với độ lệch xác định trong `stableJitterHours` (mặc định: 12) để triển khai phân tán.                           |
| `extended-stable` | Kiểm tra gợi ý cập nhật chỉ đọc khi khởi động và mỗi 24 giờ khi `checkOnStart` được bật. Không bao giờ tự động áp dụng.                                             |
| `beta`            | Kiểm tra mỗi `betaCheckIntervalHours` (mặc định: 1) và áp dụng ngay lập tức.                                                                                         |
| `dev`             | Không tự động áp dụng. Hãy dùng `openclaw update` thủ công.                                                                                                         |

Gateway cũng ghi nhật ký gợi ý cập nhật khi khởi động (tắt bằng
`update.checkOnStart: false`). Các lựa chọn extended-stable đã lưu sử dụng
đường dẫn gợi ý chỉ đọc này và khoảng thời gian gợi ý 24 giờ hiện có, nhưng
không bao giờ kích hoạt quá trình cài đặt tự động, bàn giao, khởi động lại,
độ trễ/độ lệch stable hoặc kiểm tra beta. Để hạ cấp hoặc khôi phục sau sự cố,
hãy đặt `OPENCLAW_NO_AUTO_UPDATE=1` trong môi trường Gateway để chặn việc tự
động áp dụng ngay cả khi `update.auto.enabled` đã được cấu hình. Gợi ý cập nhật
khi khởi động vẫn có thể chạy, trừ khi `update.checkOnStart` cũng bị tắt.

Các bản cập nhật bằng trình quản lý gói được yêu cầu thông qua mặt phẳng điều
khiển Gateway đang hoạt động (`update.run`) không thay thế cây gói bên trong
tiến trình Gateway đang chạy. Trên các bản cài đặt dịch vụ được quản lý, Gateway
khởi chạy một tiến trình bàn giao tách rời, thoát, rồi để luồng CLI
`openclaw update --yes --json` thông thường dừng dịch vụ, thay thế gói, làm mới
siêu dữ liệu dịch vụ, khởi động lại, xác minh phiên bản và khả năng truy cập của
Gateway, đồng thời khôi phục LaunchAgent macOS đã cài đặt nhưng chưa được tải
khi có thể. Nếu Gateway không thể thực hiện việc bàn giao đó một cách an toàn,
`update.run` sẽ báo một lệnh shell an toàn thay vì chạy trình quản lý gói ngay
trong tiến trình.

Thẻ cập nhật ở thanh bên của giao diện điều khiển khởi chạy cùng luồng
`update.run` này. Trong ứng dụng macOS đã ký, trước tiên thẻ cập nhật ứng dụng
thông qua Sparkle; sau khi khởi chạy lại, ứng dụng đưa Gateway cục bộ được quản
lý của mình về phiên bản tương ứng.

## Sau khi cập nhật

<Steps>

### Chạy doctor

```bash
openclaw doctor
```

Di chuyển cấu hình, kiểm tra các chính sách tin nhắn trực tiếp và kiểm tra tình trạng Gateway. Chi tiết: [Doctor](/vi/gateway/doctor)

### Khởi động lại Gateway

```bash
openclaw gateway restart
```

### Xác minh

```bash
openclaw health
```

</Steps>

## Quay lui

### Ghim một phiên bản (npm)

```bash
npm i -g openclaw@<version>
openclaw doctor
openclaw gateway restart
```

<Tip>
`npm view openclaw version` hiển thị phiên bản hiện đang được phát hành.
</Tip>

### Ghim một commit (mã nguồn)

```bash
git fetch origin
git checkout "$(git rev-list -n 1 --before=\"2026-01-01\" origin/main)"
pnpm install && pnpm build
openclaw gateway restart
```

Để trở lại phiên bản mới nhất: `git checkout main && git pull`.

## Nếu bạn gặp khó khăn

- Chạy lại `openclaw doctor` và đọc kỹ đầu ra.
- Đối với `openclaw update --channel dev` trên các bản checkout mã nguồn, trình cập nhật sẽ tự khởi tạo `pnpm` khi cần. Nếu bạn thấy lỗi khởi tạo pnpm/corepack, hãy cài đặt `pnpm` thủ công (hoặc bật lại `corepack`) rồi chạy lại quá trình cập nhật.
- Xem: [Khắc phục sự cố](/vi/gateway/troubleshooting)
- Hỏi trên Discord: [https://discord.gg/clawd](https://discord.gg/clawd)

## Liên quan

- [Tổng quan cài đặt](/vi/install): tất cả phương thức cài đặt.
- [Chẩn đoán](/vi/gateway/doctor): kiểm tra tình trạng hoạt động sau khi cập nhật.
- [Di chuyển](/vi/install/migrating): hướng dẫn di chuyển giữa các phiên bản lớn.
