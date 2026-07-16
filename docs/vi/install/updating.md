---
read_when:
    - Cập nhật OpenClaw
    - Có sự cố xảy ra sau khi cập nhật
summary: Cập nhật OpenClaw an toàn (cài đặt toàn cục hoặc từ mã nguồn), cùng chiến lược hoàn tác
title: Đang cập nhật
x-i18n:
    generated_at: "2026-07-16T14:42:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: baf849d27fd1132833832734ff5b1648b7401d53925a624176832bca614d1160
    source_path: install/updating.md
    workflow: 16
---

Luôn cập nhật OpenClaw.

Để thay thế image Docker, Podman và Kubernetes, hãy xem
[Nâng cấp image container](/vi/install/docker#upgrading-container-images). Gateway
thực hiện công việc nâng cấp an toàn khi khởi động trước khi sẵn sàng và thoát nếu
trạng thái được gắn kết cần sửa chữa thủ công.

## Khuyến nghị: `openclaw update`

Phát hiện loại cài đặt của bạn (npm, pnpm, Bun hoặc git), tải phiên bản mới nhất, chạy `openclaw doctor` và khởi động lại Gateway.

```bash
openclaw update
```

Chuyển kênh hoặc nhắm đến một phiên bản cụ thể:

```bash
openclaw update --channel beta
openclaw update --channel extended-stable
openclaw update --channel dev
openclaw update --dry-run   # xem trước mà không áp dụng
```

`openclaw update` không có cờ `--verbose` (trình cài đặt thì có). Để chẩn đoán, hãy dùng
`--dry-run` để xem trước các hành động dự kiến, `--json` để nhận kết quả có cấu trúc hoặc
`openclaw update status --json` để kiểm tra trạng thái kênh và tính khả dụng.

`--channel beta` ưu tiên dist-tag beta của npm, nhưng quay về stable/latest
khi không có thẻ beta hoặc phiên bản của thẻ này cũ hơn bản phát hành stable
mới nhất. Thay vào đó, hãy dùng `--tag beta` để cập nhật gói một lần, được ghim trực tiếp vào
dist-tag beta thô của npm.

`--channel extended-stable` chỉ dành cho gói và quá trình cài đặt vẫn
chỉ chạy ở foreground. OpenClaw đọc bộ chọn `extended-stable` công khai của npm,
xác minh chính xác gói đã chọn và cài đặt đúng phiên bản đó. Dữ liệu registry bị thiếu
hoặc không nhất quán sẽ khiến thao tác đóng an toàn; hệ thống không bao giờ quay về `latest`.
Nếu phiên bản đã chọn cũ hơn phiên bản đang cài đặt, yêu cầu xác nhận
hạ cấp thông thường vẫn được áp dụng. CLI lưu kênh sau khi
cập nhật lõi thành công; thao tác trực tiếp `npm install -g openclaw@extended-stable`
không cập nhật `update.channel`.
Sau khi thay lõi, các plugin npm chính thức đủ điều kiện có ý định bare/default hoặc
`latest` sẽ hội tụ về đúng phiên bản lõi đó. Các phiên bản ghim chính xác và thẻ
không phải `latest` được chỉ định rõ, plugin của bên thứ ba và nguồn không phải npm vẫn không thay đổi.
Các bản cài đặt từ catalog được tạo bởi phiên bản OpenClaw hiện tại sẽ giữ lại ý định
mặc định đó. Những bản ghi cũ chỉ chứa một phiên bản chính xác vẫn được ghim vì
OpenClaw không thể phân biệt an toàn một ghim tự động cũ với ghim của người dùng; hãy chạy
`openclaw plugins update @openclaw/name` một lần trên kênh extended-stable
để cho phép plugin đó quay lại theo dõi chính xác phiên bản lõi.

`--channel dev` cung cấp một checkout GitHub `main` di động và được duy trì lâu dài. Để cập nhật
gói một lần, `--tag main` ánh xạ đến đặc tả gói `github:openclaw/openclaw#main`
và cài đặt trực tiếp qua trình quản lý gói đích (npm/pnpm/bun).

Đối với plugin được quản lý, việc thiếu bản phát hành beta chỉ là cảnh báo, không phải lỗi:
bản cập nhật lõi vẫn có thể thành công trong khi plugin quay về
bản phát hành default/latest đã ghi nhận.

Xem [Kênh phát hành](/vi/install/development-channels) để biết ngữ nghĩa của các kênh.

## Chuyển đổi giữa bản cài đặt npm và git

Dùng các kênh để thay đổi loại cài đặt. Trình cập nhật giữ nguyên trạng thái, cấu hình,
thông tin xác thực và workspace của bạn trong `~/.openclaw`; nó chỉ thay đổi bản cài đặt mã
OpenClaw mà CLI và Gateway sử dụng.

```bash
# bản cài đặt gói npm -> checkout git có thể chỉnh sửa
openclaw update --channel dev

# checkout git -> bản cài đặt gói npm
openclaw update --channel stable
```

Trước tiên, hãy xem trước việc chuyển chế độ cài đặt:

```bash
openclaw update --channel dev --dry-run
openclaw update --channel stable --dry-run
```

`dev` đảm bảo có một checkout git, xây dựng checkout đó và cài đặt CLI toàn cục từ
checkout này. Các kênh `stable`, `extended-stable` và `beta` sử dụng bản cài đặt
gói. Extended-stable bị từ chối trên checkout git mà không sửa đổi hoặc
chuyển đổi checkout đó. Nếu Gateway đã được cài đặt, `openclaw update` làm mới
siêu dữ liệu dịch vụ và khởi động lại dịch vụ, trừ khi bạn truyền `--no-restart`.

Đối với bản cài đặt gói có dịch vụ Gateway được quản lý, `openclaw update` nhắm đến
thư mục gốc của gói mà dịch vụ đó sử dụng. Nếu lệnh shell `openclaw` đến
từ một bản cài đặt khác, trình cập nhật sẽ in cả hai thư mục gốc và đường dẫn Node
của dịch vụ được quản lý, đồng thời kiểm tra phiên bản Node đó theo yêu cầu
`engines.node` của bản phát hành đích trước khi thay thế gói.

## Phương án khác: chạy lại trình cài đặt

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

Thêm `--no-onboard` để bỏ qua quá trình thiết lập ban đầu. Để buộc dùng một loại cài đặt cụ thể, hãy truyền
`--install-method git --no-onboard` hoặc `--install-method npm --no-onboard`.

Nếu `openclaw update` thất bại sau giai đoạn cài đặt gói npm, hãy chạy lại
trình cài đặt. Trình này không gọi trình cập nhật; nó chạy trực tiếp quá trình cài đặt gói
toàn cục và có thể khôi phục một bản cài đặt npm chỉ được cập nhật một phần.

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
```

Ghim quá trình khôi phục vào một phiên bản hoặc dist-tag cụ thể bằng `--version`:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm --version <version-or-dist-tag>
```

## Phương án khác: npm, pnpm hoặc bun thủ công

```bash
npm i -g openclaw@latest
```

Nên dùng `openclaw update` cho các bản cài đặt được giám sát: nó có thể phối hợp việc thay
gói với dịch vụ Gateway đang chạy. Nếu cập nhật thủ công trên một bản cài đặt được giám sát,
hãy dừng Gateway được quản lý trước. Trình quản lý gói thay thế tệp ngay tại chỗ,
nếu không, Gateway đang chạy có thể cố tải các tệp lõi hoặc plugin
khi quá trình thay thế đang diễn ra. Khởi động lại Gateway sau khi trình quản lý gói hoàn tất để Gateway nhận
bản cài đặt mới.

Đối với bản cài đặt toàn hệ thống trên Linux do root sở hữu, nếu `openclaw update` thất bại với
`EACCES`, hãy khôi phục bằng npm hệ thống trong khi vẫn giữ Gateway ở trạng thái dừng để
thay thế thủ công. Dùng cùng các cờ profile/môi trường mà bạn thường dùng cho
Gateway đó. Thay `/usr/bin/npm` bằng npm hệ thống sở hữu
tiền tố toàn cục do root sở hữu trên máy chủ của bạn:

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

Khi `openclaw update` quản lý một bản cài đặt npm toàn cục, nó cài đặt đích
vào một tiền tố npm tạm thời trước. Gói ứng viên xác thực phiên bản Node
của máy chủ trong `preinstall`; chỉ sau đó OpenClaw mới xác minh danh mục
`dist` được đóng gói và hoán đổi cây gói sạch vào tiền tố toàn cục thực. Một
chốt bảo vệ hoàn tất đóng gói bị loại khỏi danh mục dự kiến và chỉ được xóa
sau khi `preinstall` thành công, vì vậy các tập lệnh vòng đời bị bỏ qua cũng sẽ gây lỗi trước khi
hoán đổi. Trên npm 12 trở lên, trình cập nhật chỉ phê duyệt vòng đời của OpenClaw
ứng viên; các tập lệnh của phần phụ thuộc bắc cầu vẫn bị chặn. Điều này ngăn npm
ghi đè một gói mới lên các tệp cũ còn sót lại từ gói trước. Nếu lệnh cài đặt
thất bại, OpenClaw thử lại một lần với `--omit=optional`, điều này hữu ích trên các máy chủ
không thể biên dịch phần phụ thuộc tùy chọn native.

Các lệnh cập nhật npm và cập nhật plugin do OpenClaw quản lý cũng xóa vùng
cách ly chuỗi cung ứng `min-release-age` của npm (hoặc khóa cấu hình `before` cũ hơn)
cho tiến trình npm con. Chính sách đó tồn tại để bảo vệ chung, nhưng một
bản cập nhật OpenClaw được yêu cầu rõ ràng có nghĩa là “cài đặt bản phát hành đã chọn ngay bây giờ”.

```bash
pnpm add -g openclaw@latest
```

Nếu pnpm 11 đã cài đặt OpenClaw 2026.7.1, hãy chạy lệnh thủ công đó một lần. Bản
phát hành này có trước bố cục gói toàn cục cô lập của pnpm 11, vì vậy trình cập nhật của nó có thể
nhầm một bản cài đặt npm khác với CLI đang chạy. Các bản phát hành sau này giữ lại
quyền sở hữu của pnpm và đi theo thư mục gốc của gói thay thế trong khi cập nhật. Chúng
cũng sử dụng thư mục bin toàn cục do trình quản lý sở hữu báo cáo và dừng trước khi
sửa đổi nếu lệnh pnpm khả dụng báo cáo một thư mục gốc hoặc phiên bản chính toàn cục khác,
hoặc khi gói gọi bị mồ côi hay không phải là bản cài đặt OpenClaw
hoạt động duy nhất tại đó.

Nếu OpenClaw dùng chung một nhóm cài đặt toàn cục pnpm 11 với gói khác,
trình cập nhật tự động sẽ dừng trước khi thay đổi nhóm. Hãy cập nhật thủ công
nhóm gốc được phân tách bằng dấu phẩy để các gói cùng nhóm và chính sách xây dựng
của nhóm vẫn nguyên vẹn.

```bash
bun add -g openclaw@latest
```

### Chủ đề nâng cao về cài đặt npm

<AccordionGroup>
  <Accordion title="Cây gói chỉ đọc">
    OpenClaw coi các bản cài đặt toàn cục dạng gói là chỉ đọc trong thời gian chạy, ngay cả khi thư mục gói toàn cục có thể được người dùng hiện tại ghi. Các bản cài đặt gói plugin nằm trong các thư mục gốc npm/git do OpenClaw sở hữu bên dưới thư mục cấu hình người dùng và quá trình khởi động Gateway không sửa đổi cây gói OpenClaw.

    Một số thiết lập npm trên Linux cài đặt gói toàn cục trong các thư mục do root sở hữu, chẳng hạn như `/usr/lib/node_modules/openclaw`. OpenClaw hỗ trợ bố cục đó vì các lệnh cài đặt/cập nhật plugin ghi ra ngoài thư mục gói toàn cục này.

  </Accordion>
  <Accordion title="Các đơn vị systemd được tăng cường bảo mật">
    Cấp cho OpenClaw quyền ghi vào các thư mục gốc cấu hình/trạng thái để các thao tác cài đặt plugin, cập nhật plugin và dọn dẹp bằng doctor được yêu cầu rõ ràng có thể lưu các thay đổi:

    ```ini
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

  </Accordion>
  <Accordion title="Kiểm tra trước dung lượng đĩa">
    Trước khi cập nhật gói và cài đặt plugin theo yêu cầu rõ ràng, OpenClaw cố gắng kiểm tra dung lượng đĩa theo cơ chế nỗ lực tối đa cho ổ đĩa đích. Dung lượng thấp tạo ra cảnh báo kèm đường dẫn đã kiểm tra nhưng không chặn việc cập nhật vì hạn ngạch hệ thống tệp, snapshot và ổ đĩa mạng có thể thay đổi sau khi kiểm tra. Quá trình cài đặt thực tế của trình quản lý gói và xác minh sau cài đặt vẫn là căn cứ quyết định.
  </Accordion>
</AccordionGroup>

## Trình tự động cập nhật

Mặc định tắt. Bật trong `~/.openclaw/openclaw.json`:

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

| Kênh              | Hành vi                                                                                                                                       |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `stable`          | Chờ `stableDelayHours` (mặc định: 6), sau đó áp dụng với độ lệch ngẫu nhiên xác định trên `stableJitterHours` (mặc định: 12) để triển khai giãn cách. |
| `extended-stable` | Kiểm tra gợi ý cập nhật chỉ đọc khi khởi động và mỗi 24 giờ khi `checkOnStart` được bật. Không bao giờ tự động áp dụng.                         |
| `beta`            | Kiểm tra mỗi `betaCheckIntervalHours` (mặc định: 1) và áp dụng ngay lập tức.                                                                   |
| `dev`             | Không tự động áp dụng. Dùng `openclaw update` theo cách thủ công.                                                                              |

Gateway cũng ghi một gợi ý cập nhật vào log khi khởi động (tắt bằng
`update.checkOnStart: false`). Các lựa chọn extended-stable đã lưu sử dụng
đường dẫn gợi ý chỉ đọc này và khoảng thời gian gợi ý 24 giờ hiện có, nhưng không bao giờ gọi
quá trình cài đặt tự động, bàn giao, khởi động lại, trì hoãn/độ lệch stable hoặc thăm dò beta.
Để hạ cấp hoặc khôi phục sau sự cố, hãy đặt `OPENCLAW_NO_AUTO_UPDATE=1` trong môi trường Gateway để chặn việc tự động áp dụng ngay cả khi `update.auto.enabled` đã được cấu hình. Gợi ý cập nhật khi khởi động vẫn có thể chạy trừ khi `update.checkOnStart` cũng bị tắt.

Các bản cập nhật qua trình quản lý gói được yêu cầu thông qua mặt phẳng điều khiển Gateway trực tiếp
(`update.run`) không thay thế cây gói bên trong tiến trình Gateway đang chạy.
Trên các bản cài đặt dịch vụ được quản lý, Gateway bắt đầu một quy trình bàn giao tách rời,
thoát và để đường dẫn CLI `openclaw update --yes --json` thông thường dừng
dịch vụ, thay thế gói, làm mới siêu dữ liệu dịch vụ, khởi động lại, xác minh
phiên bản và khả năng truy cập của Gateway, đồng thời khôi phục LaunchAgent macOS
đã cài đặt nhưng chưa được tải khi có thể. Nếu Gateway không thể thực hiện quy trình bàn giao đó một cách an toàn,
`update.run` sẽ báo cáo một lệnh shell an toàn thay vì chạy trình quản lý
gói bên trong tiến trình.

Thẻ cập nhật trong thanh bên của Control UI hiển thị **Cập nhật Gateway** khi thẻ sẽ trực tiếp bắt đầu
luồng `update.run` này. Điều này áp dụng cho Control UI được lưu trữ trên trình duyệt, các
Gateway từ xa và các Gateway cục bộ được quản lý thủ công.

Trong ứng dụng macOS đã ký, Gateway cục bộ do ứng dụng sở hữu sẽ đổi thẻ đó thành
**Cập nhật ứng dụng Mac + Gateway**. Sparkle cập nhật ứng dụng trước; sau khi khởi chạy lại,
ứng dụng chạy `openclaw update --tag <app-version> --json`, khởi động lại Gateway
và xác minh tình trạng trong cửa sổ tiến trình kiểu thiết lập. Cửa sổ chỉ xuất hiện
khi Gateway được quản lý đó cần cập nhật, sửa chữa hoặc cài đặt; các bản cập nhật chỉ dành cho ứng dụng sẽ khởi chạy lại
trực tiếp vào ứng dụng. Chi tiết lỗi vẫn hiển thị cùng các thao tác Thử lại, [Hướng dẫn cập nhật](/vi/install/updating) và
[Discord](https://discord.gg/clawd). Ứng dụng không bao giờ sử dụng quy trình phối hợp này
cho Gateway từ xa hoặc được quản lý bên ngoài, không bao giờ hạ cấp Gateway
mới hơn và không bao giờ ghi đè một ghim kênh `extended-stable`.

Khi cập nhật thành công, ứng dụng xếp hàng một sự kiện chào mừng dùng một lần cho
phiên trực tiếp cấp cao nhất gần đây nhất có tương tác thực sự với người dùng/kênh. Các lần chạy
Cron, heartbeat và cập nhật phiên chỉ chạy nền không làm thay đổi lựa chọn đó. Ở
chế độ từ xa, ứng dụng chỉ cập nhật runtime Node Mac cục bộ và chỉ gửi sự kiện
khi Gateway từ xa đang kết nối có phiên bản ít nhất mới bằng ứng dụng.

## Sau khi cập nhật

<Steps>

### Chạy doctor

```bash
openclaw doctor
```

Di chuyển cấu hình, kiểm tra chính sách DM và kiểm tra tình trạng Gateway. Chi tiết: [Doctor](/vi/gateway/doctor)

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

Khôi phục phiên bản trước có hai lớp:

1. Cài đặt lại mã OpenClaw cũ hơn trong khi giữ nguyên trạng thái hiện tại.
2. Chỉ khôi phục trạng thái trước khi cập nhật khi mã cũ hơn không thể sử dụng cấu hình hoặc cơ sở dữ liệu
   đã được di chuyển.

Hãy bắt đầu bằng cách chỉ khôi phục mã. Việc khôi phục trạng thái sẽ loại bỏ các thay đổi được thực hiện sau
bản sao lưu.

### Trước khi cập nhật: tạo bản sao lưu đã xác minh

`openclaw update` giữ lại một bản sao cấu hình tự động trước khi cập nhật, nhưng không
tạo điểm khôi phục trạng thái đầy đủ. Trước một bản cập nhật quan trọng, hãy tạo một điểm
rõ ràng:

```bash
mkdir -p ~/Backups/openclaw
openclaw backup create --output ~/Backups/openclaw --verify
```

Tệp kê khai của kho lưu trữ ghi lại phiên bản OpenClaw và các đường dẫn nguồn được đưa vào
bản sao lưu. Kho lưu trữ có thể chứa thông tin xác thực, hồ sơ xác thực và trạng thái
kênh, vì vậy hãy lưu trữ với quyền chỉ dành cho chủ sở hữu và mức bảo vệ tương đương
thư mục trạng thái đang hoạt động. Xem [Sao lưu](/vi/cli/backup) để biết các tệp được bao gồm và bị
cố ý bỏ qua.

Để có điểm khôi phục khớp từng byte, bao gồm các thành phần tạm thời bị kho lưu trữ
di động bỏ qua, hãy dừng Gateway và sử dụng ảnh chụp nhanh hệ thống tệp, ổ đĩa hoặc máy ảo
do nền tảng của bạn cung cấp.

### Khôi phục phiên bản trước của bản cài đặt gói

Liệt kê các phiên bản đã phát hành, sau đó xem trước và cài đặt phiên bản đã biết là hoạt động tốt:

```bash
npm view openclaw versions --json
openclaw update --tag <known-good-version> --dry-run
openclaw update --tag <known-good-version>
```

`openclaw update --tag` được ưu tiên hơn so với cài đặt trực tiếp bằng trình quản lý gói. Lệnh này
phát hiện việc hạ cấp, yêu cầu xác nhận, chạy quá trình hội tụ Plugin được quản lý
và kiểm tra khả năng tương thích với đích đã cài đặt, làm mới siêu dữ liệu dịch vụ,
khởi động lại Gateway và xác minh phiên bản đang chạy. Nếu kênh được lưu là
`extended-stable`, hãy sử dụng
`--channel stable --tag <known-good-version>` vì không thể kết hợp thẻ chính xác dùng một lần
với bộ chọn `extended-stable`.

Các bản cập nhật gói chuẩn bị và xác minh ứng viên trước khi kích hoạt. Nếu việc
hoán đổi hệ thống tệp hoặc thay thế shim lệnh thất bại, OpenClaw sẽ tự động khôi phục
gói cũ. Sau khi hoán đổi thành công, nếu kiểm tra tình trạng Gateway sau đó thất bại,
hệ thống sẽ báo cáo phiên bản trước và hướng dẫn khôi phục thủ công thay vì
tự động thay thế lại gói.

Nếu không thể sử dụng quy trình cập nhật CLI, hãy dùng cùng trình quản lý gói và phạm vi
cài đặt đang sở hữu Gateway hiện tại:

```bash
openclaw gateway stop
npm i -g openclaw@<known-good-version>
openclaw gateway install --force
openclaw gateway restart
```

Thay `npm` bằng `pnpm` hoặc `bun` khi trình quản lý đó sở hữu bản cài đặt. Trong
quá trình khôi phục sự cố, hãy ngăn trình tự động cập nhật đang bật áp dụng ngay
một bản phát hành mới hơn bằng cách đặt `OPENCLAW_NO_AUTO_UPDATE=1` trong môi trường Gateway.

### Khôi phục phiên bản trước của bản checkout mã nguồn

Sử dụng một bản checkout sạch và chọn thẻ hoặc commit đã biết là hoạt động tốt:

```bash
git fetch --all --tags
git checkout --detach <known-good-tag-or-commit>
pnpm install && pnpm build
openclaw gateway restart
```

Để quay lại phiên bản mới nhất: `git checkout main && git pull`.

Trình cập nhật tự động đưa bản checkout git trở về nhánh và
SHA trước đó khi quá trình cài đặt phần phụ thuộc, bản dựng, bản dựng UI hoặc doctor thất bại sau khi
bản cập nhật git bắt đầu. Vẫn cần checkout thủ công khi bạn chủ ý chọn
một commit cũ hơn.

### Hạ cấp qua quá trình di chuyển SQLite của phiên

Trước khi khởi động một bản phát hành OpenClaw cũ hơn dựa trên tệp, hãy dùng CLI hiện tại để
khôi phục các thành phần bản chép lời cũ đã lưu trữ:

```bash
openclaw gateway stop
openclaw doctor --session-sqlite restore --session-sqlite-all-agents
```

Thao tác này không xóa dữ liệu SQLite. Các phiên được tạo sau quá trình di chuyển SQLite
chỉ tồn tại trong SQLite và sẽ không xuất hiện trong runtime cũ hơn. Xem
[Hạ cấp sau quá trình di chuyển SQLite của phiên](/vi/cli/doctor#downgrading-after-session-sqlite-migration).

### Chỉ khôi phục trạng thái khi cần thiết

Nếu mã cũ hơn không thể đọc cấu hình hoặc lược đồ cơ sở dữ liệu mới hơn, hãy dừng
Gateway và khôi phục ảnh chụp nhanh hệ thống tệp, ổ đĩa hoặc máy ảo đã xác minh từ trước khi cập nhật.
Hãy lưu riêng trạng thái hiện tại trước khi khôi phục vì thao tác này sẽ xóa
các thay đổi được thực hiện sau ảnh chụp nhanh.

Các kho lưu trữ `openclaw backup create` phạm vi rộng hỗ trợ tạo và xác minh, nhưng
không hỗ trợ kích hoạt toàn bộ kho lưu trữ tại chỗ. Giải nén một kho lưu trữ phạm vi rộng vào thư mục
tạm và sử dụng ánh xạ từ nguồn đến kho lưu trữ `manifest.json` của kho đó để khôi phục
ngoại tuyến. Tương tự, `openclaw backup sqlite restore` ghi một cơ sở dữ liệu đã xác minh
vào một đích mới; việc kích hoạt đích đó vẫn là một bước ngoại tuyến rõ ràng của người vận hành.

### Xác minh việc khôi phục phiên bản trước

```bash
openclaw --version
openclaw health
openclaw plugins list --json
openclaw gateway status --deep --json
openclaw doctor --lint --json
```

## Nếu bạn gặp khó khăn

- Chạy lại `openclaw doctor` và đọc kỹ đầu ra.
- Đối với `openclaw update --channel dev` trên các bản checkout mã nguồn, trình cập nhật tự động khởi tạo `pnpm` khi cần. Nếu bạn thấy lỗi khởi tạo pnpm/corepack, hãy cài đặt `pnpm` thủ công (hoặc bật lại `corepack`) và chạy lại bản cập nhật.
- Kiểm tra: [Khắc phục sự cố](/vi/gateway/troubleshooting)
- Hỏi trên Discord: [https://discord.gg/clawd](https://discord.gg/clawd)

## Liên quan

- [Tổng quan về cài đặt](/vi/install): tất cả phương thức cài đặt.
- [Doctor](/vi/gateway/doctor): kiểm tra tình trạng sau khi cập nhật.
- [Di chuyển](/vi/install/migrating): hướng dẫn di chuyển phiên bản chính.
