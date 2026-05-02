---
read_when:
    - Bạn muốn cập nhật một bản checkout mã nguồn một cách an toàn
    - Bạn cần hiểu cách hoạt động của dạng viết tắt `--update`
summary: Tham chiếu CLI cho `openclaw update` (cập nhật mã nguồn tương đối an toàn + tự động khởi động lại Gateway)
title: Cập nhật
x-i18n:
    generated_at: "2026-05-02T20:43:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 35df8c6d8b1adb9597377f6e2b4844352577992c12636a88b3f3c1854dc0666b
    source_path: cli/update.md
    workflow: 16
---

# `openclaw update`

Cập nhật OpenClaw một cách an toàn và chuyển đổi giữa các kênh stable/beta/dev.

Nếu bạn đã cài đặt qua **npm/pnpm/bun** (cài đặt toàn cục, không có siêu dữ liệu git),
các bản cập nhật sẽ diễn ra qua luồng trình quản lý gói trong [Cập nhật](/vi/install/updating).

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
- `--tag <dist-tag|version|spec>`: ghi đè mục tiêu gói chỉ cho lần cập nhật này. Với các bản cài đặt qua gói, `main` ánh xạ tới `github:openclaw/openclaw#main`.
- `--dry-run`: xem trước các hành động cập nhật đã lên kế hoạch (luồng kênh/thẻ/mục tiêu/khởi động lại) mà không ghi cấu hình, cài đặt, đồng bộ Plugin hoặc khởi động lại.
- `--json`: in JSON `UpdateRunResult` mà máy có thể đọc, bao gồm
  `postUpdate.plugins.integrityDrifts` khi phát hiện sai lệch tạo tác Plugin npm
  trong quá trình đồng bộ Plugin sau cập nhật.
- `--timeout <seconds>`: thời gian chờ cho từng bước (mặc định là 1800 giây).
- `--yes`: bỏ qua các lời nhắc xác nhận (ví dụ xác nhận hạ cấp).

<Warning>
Hạ cấp yêu cầu xác nhận vì các phiên bản cũ hơn có thể làm hỏng cấu hình.
</Warning>

## `update status`

Hiển thị kênh cập nhật đang hoạt động + thẻ/nhánh/SHA git (đối với bản checkout mã nguồn), cùng với trạng thái có bản cập nhật hay không.

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

Tùy chọn:

- `--json`: in JSON trạng thái mà máy có thể đọc.
- `--timeout <seconds>`: thời gian chờ cho các kiểm tra (mặc định là 3 giây).

## `update wizard`

Luồng tương tác để chọn kênh cập nhật và xác nhận có khởi động lại Gateway
sau khi cập nhật hay không (mặc định là khởi động lại). Nếu bạn chọn `dev` mà không có bản checkout git, luồng này
sẽ đề nghị tạo một bản.

Tùy chọn:

- `--timeout <seconds>`: thời gian chờ cho mỗi bước cập nhật (mặc định `1800`)

## Chức năng

Khi bạn chuyển kênh một cách tường minh (`--channel ...`), OpenClaw cũng giữ cho
phương thức cài đặt được căn chỉnh:

- `dev` → bảo đảm có một bản checkout git (mặc định: `~/openclaw`, ghi đè bằng `OPENCLAW_GIT_DIR`),
  cập nhật bản đó, và cài đặt CLI toàn cục từ bản checkout đó.
- `stable` → cài đặt từ npm bằng `latest`.
- `beta` → ưu tiên thẻ phân phối npm `beta`, nhưng quay về `latest` khi beta
  bị thiếu hoặc cũ hơn bản phát hành ổn định hiện tại.

Trình tự động cập nhật lõi Gateway (khi được bật qua cấu hình) khởi chạy đường dẫn cập nhật CLI
bên ngoài trình xử lý yêu cầu Gateway trực tiếp. Các bản cập nhật qua trình quản lý gói
`update.run` của mặt phẳng điều khiển buộc một lần khởi động lại cập nhật không trì hoãn, không có thời gian chờ sau khi thay gói,
vì tiến trình Gateway cũ có thể vẫn còn các đoạn trong bộ nhớ trỏ tới
các tệp đã bị gói mới xóa.

Đối với các bản cài đặt qua trình quản lý gói, `openclaw update` phân giải phiên bản gói
mục tiêu trước khi gọi trình quản lý gói. Các bản cài đặt npm toàn cục dùng cơ chế cài đặt theo giai đoạn:
OpenClaw cài đặt gói mới vào một tiền tố npm tạm thời, xác minh
kho `dist` đã đóng gói tại đó, rồi hoán đổi cây gói sạch đó vào
tiền tố toàn cục thật. Nếu xác minh thất bại, doctor sau cập nhật, đồng bộ Plugin và
công việc khởi động lại sẽ không chạy từ cây đáng ngờ đó. Ngay cả khi phiên bản đã cài đặt
đã khớp với mục tiêu, lệnh vẫn làm mới bản cài đặt gói toàn cục,
rồi chạy đồng bộ Plugin, làm mới hoàn tất lệnh lõi, và công việc khởi động lại. Điều này
giữ các sidecar đã đóng gói và bản ghi Plugin do kênh sở hữu được căn chỉnh với
bản dựng OpenClaw đã cài đặt, đồng thời để các lần dựng lại hoàn tất lệnh Plugin đầy đủ cho
các lần chạy `openclaw completion --write-state` tường minh.

Khi một dịch vụ Gateway cục bộ được quản lý đã được cài đặt và khởi động lại được bật,
các bản cập nhật qua trình quản lý gói sẽ dừng dịch vụ đang chạy trước khi thay thế cây gói,
sau đó làm mới siêu dữ liệu dịch vụ từ bản cài đặt đã cập nhật, khởi động lại
dịch vụ, và xác minh Gateway đã khởi động lại báo cáo phiên bản mong đợi. Với
`--no-restart`, việc thay thế gói vẫn chạy nhưng dịch vụ được quản lý không bị
dừng hoặc khởi động lại, vì vậy Gateway đang chạy có thể tiếp tục dùng mã cũ cho đến khi bạn khởi động lại
thủ công.

## Luồng checkout git

### Chọn kênh

- `stable`: checkout thẻ không phải beta mới nhất, sau đó build và chạy doctor.
- `beta`: ưu tiên thẻ `-beta` mới nhất, nhưng quay về thẻ stable mới nhất khi beta bị thiếu hoặc cũ hơn.
- `dev`: checkout `main`, sau đó fetch và rebase.

### Các bước cập nhật

<Steps>
  <Step title="Xác minh worktree sạch">
    Yêu cầu không có thay đổi chưa commit.
  </Step>
  <Step title="Chuyển kênh">
    Chuyển sang kênh đã chọn (thẻ hoặc nhánh).
  </Step>
  <Step title="Fetch upstream">
    Chỉ dev.
  </Step>
  <Step title="Build kiểm tra trước khi chạy (chỉ dev)">
    Chạy lint và build TypeScript trong một worktree tạm. Nếu tip thất bại, lùi lại tối đa 10 commit để tìm bản build sạch mới nhất.
  </Step>
  <Step title="Rebase">
    Rebase lên commit đã chọn (chỉ dev).
  </Step>
  <Step title="Cài đặt phụ thuộc">
    Dùng trình quản lý gói của repo. Với các bản checkout pnpm, trình cập nhật khởi tạo `pnpm` theo nhu cầu (qua `corepack` trước, sau đó dùng phương án dự phòng tạm thời `npm install pnpm@10`) thay vì chạy `npm run build` bên trong một workspace pnpm.
  </Step>
  <Step title="Build giao diện điều khiển">
    Build gateway và giao diện điều khiển.
  </Step>
  <Step title="Chạy doctor">
    `openclaw doctor` chạy như kiểm tra cập nhật an toàn cuối cùng.
  </Step>
  <Step title="Đồng bộ Plugin">
    Đồng bộ Plugin với kênh đang hoạt động. Dev dùng Plugin đi kèm; stable và beta dùng npm. Cập nhật các bản cài đặt Plugin được theo dõi.
  </Step>
</Steps>

Trên kênh cập nhật beta, các bản cài đặt Plugin npm và ClawHub được theo dõi theo
dòng mặc định/latest sẽ thử bản phát hành Plugin `@beta` trước. Nếu Plugin không có
bản phát hành beta, OpenClaw quay về đặc tả mặc định/latest đã ghi lại. Các
phiên bản chính xác và thẻ tường minh không bị ghi lại.

<Warning>
Nếu một bản cập nhật Plugin npm được ghim chính xác phân giải thành một tạo tác có tính toàn vẹn khác với bản ghi cài đặt đã lưu, `openclaw update` sẽ hủy bản cập nhật tạo tác Plugin đó thay vì cài đặt. Chỉ cài đặt lại hoặc cập nhật Plugin một cách tường minh sau khi xác minh rằng bạn tin cậy tạo tác mới.
</Warning>

<Note>
Lỗi đồng bộ Plugin sau cập nhật làm kết quả cập nhật thất bại và dừng công việc khởi động lại tiếp theo. Hãy sửa lỗi cài đặt hoặc cập nhật Plugin, rồi chạy lại `openclaw update`.

Khi Gateway đã cập nhật khởi động, việc tải Plugin chỉ ở chế độ xác minh: quá trình khởi động không chạy trình quản lý gói hoặc sửa đổi cây phụ thuộc. Các lần khởi động lại `update.run` qua trình quản lý gói bỏ qua cơ chế trì hoãn khi rỗi thông thường và thời gian chờ khởi động lại sau khi cây gói đã được hoán đổi, để tiến trình cũ không thể tiếp tục tải lười các đoạn đã bị xóa.

Nếu khởi tạo pnpm vẫn thất bại, trình cập nhật dừng sớm với lỗi cụ thể của trình quản lý gói thay vì thử `npm run build` bên trong bản checkout.
</Note>

## Viết tắt `--update`

`openclaw --update` được viết lại thành `openclaw update` (hữu ích cho shell và script khởi chạy).

## Liên quan

- `openclaw doctor` (đề nghị chạy cập nhật trước trên các bản checkout git)
- [Kênh phát triển](/vi/install/development-channels)
- [Cập nhật](/vi/install/updating)
- [Tham chiếu CLI](/vi/cli)
