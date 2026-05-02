---
read_when:
    - Bạn muốn cập nhật bản checkout mã nguồn một cách an toàn
    - Bạn cần hiểu hành vi của cú pháp viết tắt `--update`
summary: Tài liệu tham chiếu CLI cho `openclaw update` (cập nhật nguồn tương đối an toàn + tự động khởi động lại Gateway)
title: Cập nhật
x-i18n:
    generated_at: "2026-05-02T10:38:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: cc88dc7963f1ae7d847a573924e9af7ede207f2f20028a18808116de4912d24e
    source_path: cli/update.md
    workflow: 16
---

# `openclaw update`

Cập nhật OpenClaw an toàn và chuyển đổi giữa các kênh stable/beta/dev.

Nếu bạn đã cài đặt qua **npm/pnpm/bun** (cài đặt toàn cục, không có siêu dữ liệu git),
quá trình cập nhật diễn ra qua luồng trình quản lý gói trong [Cập nhật](/vi/install/updating).

## Cách sử dụng

```bash
openclaw update
openclaw update status
openclaw update wizard
openclaw update --channel beta
openclaw update --channel dev
openclaw update --tag beta
openclaw update --tag main
openclaw update --dry-run
openclaw update --no-restart
openclaw update --yes
openclaw update --json
openclaw --update
```

## Tùy chọn

- `--no-restart`: bỏ qua việc khởi động lại dịch vụ Gateway sau khi cập nhật thành công. Các bản cập nhật qua trình quản lý gói có khởi động lại Gateway sẽ xác minh rằng dịch vụ đã khởi động lại báo cáo phiên bản đã cập nhật như mong đợi trước khi lệnh thành công.
- `--channel <stable|beta|dev>`: đặt kênh cập nhật (git + npm; được lưu trong cấu hình).
- `--tag <dist-tag|version|spec>`: ghi đè mục tiêu gói chỉ cho lần cập nhật này. Với cài đặt theo gói, `main` ánh xạ tới `github:openclaw/openclaw#main`.
- `--dry-run`: xem trước các hành động cập nhật dự kiến (luồng channel/tag/target/restart) mà không ghi cấu hình, cài đặt, đồng bộ plugin hoặc khởi động lại.
- `--json`: in JSON `UpdateRunResult` mà máy có thể đọc, bao gồm
  `postUpdate.plugins.integrityDrifts` khi phát hiện lệch tính toàn vẹn của hiện vật plugin npm
  trong quá trình đồng bộ plugin sau cập nhật.
- `--timeout <seconds>`: thời gian chờ cho từng bước (mặc định là 1800 giây).
- `--yes`: bỏ qua lời nhắc xác nhận (ví dụ xác nhận hạ cấp).

<Warning>
Hạ cấp yêu cầu xác nhận vì các phiên bản cũ hơn có thể làm hỏng cấu hình.
</Warning>

## `update status`

Hiển thị kênh cập nhật đang hoạt động + thẻ/nhánh/SHA git (đối với bản lấy về từ mã nguồn), cùng với tình trạng có bản cập nhật hay không.

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

Tùy chọn:

- `--json`: in JSON trạng thái mà máy có thể đọc.
- `--timeout <seconds>`: thời gian chờ cho các lần kiểm tra (mặc định là 3 giây).

## `update wizard`

Luồng tương tác để chọn kênh cập nhật và xác nhận có khởi động lại Gateway
sau khi cập nhật hay không (mặc định là khởi động lại). Nếu bạn chọn `dev` mà không có bản lấy về bằng git, nó
sẽ đề nghị tạo một bản.

Tùy chọn:

- `--timeout <seconds>`: thời gian chờ cho mỗi bước cập nhật (mặc định `1800`)

## Hoạt động

Khi bạn chuyển kênh một cách rõ ràng (`--channel ...`), OpenClaw cũng giữ cho
phương thức cài đặt được đồng bộ:

- `dev` → đảm bảo có một bản lấy về bằng git (mặc định: `~/openclaw`, ghi đè bằng `OPENCLAW_GIT_DIR`),
  cập nhật bản đó và cài đặt CLI toàn cục từ bản lấy về đó.
- `stable` → cài đặt từ npm bằng `latest`.
- `beta` → ưu tiên dist-tag npm `beta`, nhưng quay về `latest` khi beta
  bị thiếu hoặc cũ hơn bản phát hành stable hiện tại.

Trình tự động cập nhật lõi Gateway (khi được bật qua cấu hình) khởi chạy đường dẫn cập nhật CLI
bên ngoài trình xử lý yêu cầu Gateway đang chạy. Các bản cập nhật trình quản lý gói
`update.run` của mặt phẳng điều khiển buộc khởi động lại cập nhật không trì hoãn, không có thời gian hồi sau khi hoán đổi gói,
vì tiến trình Gateway cũ vẫn có thể còn các đoạn trong bộ nhớ trỏ tới
những tệp đã bị gói mới xóa.

Đối với cài đặt qua trình quản lý gói, `openclaw update` phân giải phiên bản gói
mục tiêu trước khi gọi trình quản lý gói. Cài đặt npm toàn cục dùng cài đặt theo giai đoạn:
OpenClaw cài đặt gói mới vào một tiền tố npm tạm thời, xác minh
bảng kiểm kê `dist` đã đóng gói tại đó, rồi hoán đổi cây gói sạch đó vào
tiền tố toàn cục thật. Nếu xác minh thất bại, doctor sau cập nhật, đồng bộ plugin và
công việc khởi động lại sẽ không chạy từ cây đáng ngờ đó. Ngay cả khi phiên bản đã cài đặt
đã khớp mục tiêu, lệnh vẫn làm mới bản cài đặt gói toàn cục,
sau đó chạy đồng bộ plugin, làm mới hoàn tất lệnh lõi và công việc khởi động lại. Điều này
giữ cho các sidecar đã đóng gói và bản ghi plugin do kênh sở hữu đồng bộ với bản dựng
OpenClaw đã cài đặt, đồng thời để các lần dựng lại hoàn tất lệnh plugin đầy đủ cho
các lần chạy `openclaw completion --write-state` rõ ràng.

Khi dịch vụ Gateway được quản lý cục bộ đã được cài đặt và tính năng khởi động lại được bật,
các bản cập nhật qua trình quản lý gói dừng dịch vụ đang chạy trước khi thay thế cây gói,
sau đó làm mới siêu dữ liệu dịch vụ từ bản cài đặt đã cập nhật, khởi động lại
dịch vụ và xác minh Gateway đã khởi động lại báo cáo phiên bản mong đợi. Với
`--no-restart`, việc thay thế gói vẫn chạy nhưng dịch vụ được quản lý không bị
dừng hoặc khởi động lại, vì vậy Gateway đang chạy có thể tiếp tục dùng mã cũ cho đến khi bạn khởi động lại
theo cách thủ công.

## Luồng bản lấy về bằng git

### Chọn kênh

- `stable`: chuyển sang thẻ không phải beta mới nhất, sau đó build và chạy doctor.
- `beta`: ưu tiên thẻ `-beta` mới nhất, nhưng quay về thẻ stable mới nhất khi beta bị thiếu hoặc cũ hơn.
- `dev`: chuyển sang `main`, sau đó fetch và rebase.

### Các bước cập nhật

<Steps>
  <Step title="Xác minh cây làm việc sạch">
    Yêu cầu không có thay đổi chưa commit.
  </Step>
  <Step title="Chuyển kênh">
    Chuyển sang kênh đã chọn (thẻ hoặc nhánh).
  </Step>
  <Step title="Fetch upstream">
    Chỉ dành cho dev.
  </Step>
  <Step title="Build kiểm tra trước (chỉ dev)">
    Chạy lint và build TypeScript trong một cây làm việc tạm thời. Nếu đầu nhánh thất bại, lùi lại tối đa 10 commit để tìm bản build sạch mới nhất.
  </Step>
  <Step title="Rebase">
    Rebase lên commit đã chọn (chỉ dev).
  </Step>
  <Step title="Cài đặt phụ thuộc">
    Sử dụng trình quản lý gói của repo. Với các bản lấy về dùng pnpm, trình cập nhật khởi tạo `pnpm` theo nhu cầu (trước tiên qua `corepack`, sau đó dùng phương án dự phòng `npm install pnpm@10` tạm thời) thay vì chạy `npm run build` bên trong workspace pnpm.
  </Step>
  <Step title="Build Control UI">
    Build gateway và Control UI.
  </Step>
  <Step title="Chạy doctor">
    `openclaw doctor` chạy như bước kiểm tra cập nhật an toàn cuối cùng.
  </Step>
  <Step title="Đồng bộ plugin">
    Đồng bộ plugin với kênh đang hoạt động. Dev dùng plugin đi kèm; stable và beta dùng npm. Cập nhật các plugin đã cài bằng npm.
  </Step>
</Steps>

<Warning>
Nếu một bản cập nhật plugin npm được ghim chính xác phân giải tới một hiện vật có tính toàn vẹn khác với bản ghi cài đặt đã lưu, `openclaw update` sẽ hủy bản cập nhật hiện vật plugin đó thay vì cài đặt nó. Chỉ cài đặt lại hoặc cập nhật plugin một cách rõ ràng sau khi xác minh rằng bạn tin cậy hiện vật mới.
</Warning>

<Note>
Lỗi đồng bộ plugin sau cập nhật làm kết quả cập nhật thất bại và dừng công việc khởi động lại tiếp theo. Hãy sửa lỗi cài đặt hoặc cập nhật plugin, rồi chạy lại `openclaw update`.

Khi Gateway đã cập nhật khởi động, việc tải plugin chỉ ở chế độ xác minh: quá trình khởi động không chạy trình quản lý gói hoặc biến đổi cây phụ thuộc. Các lần khởi động lại `update.run` qua trình quản lý gói bỏ qua trì hoãn nhàn rỗi thông thường và thời gian hồi khởi động lại sau khi cây gói đã được hoán đổi, để tiến trình cũ không thể tiếp tục tải lười các đoạn đã bị xóa.

Nếu khởi tạo pnpm vẫn thất bại, trình cập nhật dừng sớm với lỗi dành riêng cho trình quản lý gói thay vì thử `npm run build` bên trong bản lấy về.
</Note>

## Viết tắt `--update`

`openclaw --update` được viết lại thành `openclaw update` (hữu ích cho shell và script khởi chạy).

## Liên quan

- `openclaw doctor` (đề nghị chạy update trước trên các bản lấy về bằng git)
- [Kênh phát triển](/vi/install/development-channels)
- [Cập nhật](/vi/install/updating)
- [Tham chiếu CLI](/vi/cli)
