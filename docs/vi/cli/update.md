---
read_when:
    - Bạn muốn cập nhật một bản sao mã nguồn một cách an toàn
    - Bạn cần hiểu cách hoạt động của cú pháp viết tắt `--update`
summary: Tham chiếu CLI cho `openclaw update` (cập nhật nguồn tương đối an toàn + tự động khởi động lại Gateway)
title: Cập nhật
x-i18n:
    generated_at: "2026-04-29T22:35:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9cd4be6be8f6ae7df501f8bce3d208dd507ae5a1539f9772101cd844dcd93976
    source_path: cli/update.md
    workflow: 16
---

# `openclaw update`

Cập nhật OpenClaw một cách an toàn và chuyển đổi giữa các kênh stable/beta/dev.

Nếu bạn cài đặt qua **npm/pnpm/bun** (cài đặt global, không có siêu dữ liệu git),
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

- `--no-restart`: bỏ qua việc khởi động lại dịch vụ Gateway sau khi cập nhật thành công. Các bản cập nhật bằng trình quản lý gói có khởi động lại Gateway sẽ xác minh rằng dịch vụ đã khởi động lại báo cáo phiên bản đã cập nhật như mong đợi trước khi lệnh thành công.
- `--channel <stable|beta|dev>`: đặt kênh cập nhật (git + npm; được lưu trong cấu hình).
- `--tag <dist-tag|version|spec>`: ghi đè mục tiêu gói chỉ cho lần cập nhật này. Với các bản cài đặt gói, `main` ánh xạ tới `github:openclaw/openclaw#main`.
- `--dry-run`: xem trước các hành động cập nhật dự kiến (kênh/thẻ/mục tiêu/luồng khởi động lại) mà không ghi cấu hình, cài đặt, đồng bộ Plugin, hoặc khởi động lại.
- `--json`: in JSON `UpdateRunResult` mà máy có thể đọc, bao gồm
  `postUpdate.plugins.integrityDrifts` khi phát hiện sai lệch artifact Plugin npm
  trong quá trình đồng bộ Plugin sau cập nhật.
- `--timeout <seconds>`: thời gian chờ cho mỗi bước (mặc định là 1800 giây).
- `--yes`: bỏ qua lời nhắc xác nhận (ví dụ xác nhận hạ cấp).

<Warning>
Hạ cấp cần xác nhận vì các phiên bản cũ hơn có thể làm hỏng cấu hình.
</Warning>

## `update status`

Hiển thị kênh cập nhật đang hoạt động + thẻ/nhánh/SHA git (đối với checkout từ mã nguồn), cùng với trạng thái có bản cập nhật hay không.

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

Tùy chọn:

- `--json`: in JSON trạng thái mà máy có thể đọc.
- `--timeout <seconds>`: thời gian chờ cho các bước kiểm tra (mặc định là 3 giây).

## `update wizard`

Luồng tương tác để chọn một kênh cập nhật và xác nhận có khởi động lại Gateway
sau khi cập nhật hay không (mặc định là khởi động lại). Nếu bạn chọn `dev` mà không có checkout git, luồng này
sẽ đề xuất tạo một checkout.

Tùy chọn:

- `--timeout <seconds>`: thời gian chờ cho mỗi bước cập nhật (mặc định `1800`)

## Chức năng

Khi bạn chuyển kênh một cách rõ ràng (`--channel ...`), OpenClaw cũng giữ cho
phương thức cài đặt được căn chỉnh:

- `dev` → đảm bảo có checkout git (mặc định: `~/openclaw`, ghi đè bằng `OPENCLAW_GIT_DIR`),
  cập nhật checkout đó, rồi cài đặt CLI global từ checkout đó.
- `stable` → cài đặt từ npm bằng `latest`.
- `beta` → ưu tiên dist-tag npm `beta`, nhưng quay về `latest` khi beta bị
  thiếu hoặc cũ hơn bản phát hành stable hiện tại.

Trình tự động cập nhật lõi Gateway (khi được bật qua cấu hình) dùng lại cùng đường dẫn cập nhật này.

Với các bản cài đặt bằng trình quản lý gói, `openclaw update` phân giải phiên bản gói
mục tiêu trước khi gọi trình quản lý gói. Các bản cài đặt npm global sử dụng cài đặt theo giai đoạn:
OpenClaw cài đặt gói mới vào một tiền tố npm tạm thời, xác minh
inventory `dist` đã đóng gói ở đó, rồi hoán đổi cây gói sạch đó vào
tiền tố global thật. Nếu xác minh thất bại, doctor sau cập nhật, đồng bộ Plugin và
việc khởi động lại sẽ không chạy từ cây đáng nghi đó. Ngay cả khi phiên bản đã cài đặt
đã khớp với mục tiêu, lệnh vẫn làm mới bản cài đặt gói global,
sau đó chạy đồng bộ Plugin, làm mới hoàn tất lệnh lõi, và khởi động lại. Điều này
giữ cho các sidecar đã đóng gói và bản ghi Plugin do kênh sở hữu được căn chỉnh với
bản dựng OpenClaw đã cài đặt, đồng thời để các lần dựng lại hoàn tất lệnh Plugin đầy đủ cho
các lần chạy `openclaw completion --write-state` rõ ràng.

Khi dịch vụ Gateway được quản lý cục bộ đã được cài đặt và khởi động lại được bật,
các bản cập nhật bằng trình quản lý gói sẽ dừng dịch vụ đang chạy trước khi thay thế cây gói,
sau đó làm mới siêu dữ liệu dịch vụ từ bản cài đặt đã cập nhật, khởi động lại
dịch vụ, và xác minh Gateway đã khởi động lại báo cáo phiên bản mong đợi. Với
`--no-restart`, việc thay thế gói vẫn chạy nhưng dịch vụ được quản lý không bị
dừng hoặc khởi động lại, nên Gateway đang chạy có thể tiếp tục dùng mã cũ cho đến khi bạn khởi động lại
thủ công.

## Luồng checkout git

### Chọn kênh

- `stable`: checkout thẻ không phải beta mới nhất, rồi build và doctor.
- `beta`: ưu tiên thẻ `-beta` mới nhất, nhưng quay về thẻ stable mới nhất khi beta bị thiếu hoặc cũ hơn.
- `dev`: checkout `main`, rồi fetch và rebase.

### Các bước cập nhật

<Steps>
  <Step title="Verify clean worktree">
    Yêu cầu không có thay đổi chưa commit.
  </Step>
  <Step title="Switch channel">
    Chuyển sang kênh đã chọn (thẻ hoặc nhánh).
  </Step>
  <Step title="Fetch upstream">
    Chỉ dành cho dev.
  </Step>
  <Step title="Preflight build (dev only)">
    Chạy lint và bản dựng TypeScript trong một worktree tạm. Nếu tip thất bại, lùi lại tối đa 10 commit để tìm bản dựng sạch mới nhất.
  </Step>
  <Step title="Rebase">
    Rebase lên commit đã chọn (chỉ dev).
  </Step>
  <Step title="Install dependencies">
    Sử dụng trình quản lý gói của repo. Với các checkout pnpm, trình cập nhật bootstrap `pnpm` theo nhu cầu (qua `corepack` trước, rồi dự phòng bằng `npm install pnpm@10` tạm thời) thay vì chạy `npm run build` bên trong workspace pnpm.
  </Step>
  <Step title="Build Control UI">
    Build Gateway và Control UI.
  </Step>
  <Step title="Run doctor">
    `openclaw doctor` chạy như bước kiểm tra cập nhật an toàn cuối cùng.
  </Step>
  <Step title="Sync plugins">
    Đồng bộ Plugin với kênh đang hoạt động. Dev dùng Plugin đi kèm; stable và beta dùng npm. Cập nhật các Plugin đã cài bằng npm.
  </Step>
</Steps>

<Warning>
Nếu một bản cập nhật Plugin npm được ghim chính xác phân giải tới một artifact có integrity khác với bản ghi cài đặt đã lưu, `openclaw update` sẽ hủy bản cập nhật artifact Plugin đó thay vì cài đặt. Chỉ cài đặt lại hoặc cập nhật Plugin một cách rõ ràng sau khi xác minh rằng bạn tin cậy artifact mới.
</Warning>

<Note>
Lỗi đồng bộ Plugin sau cập nhật làm kết quả cập nhật thất bại và dừng công việc khởi động lại tiếp theo. Hãy sửa lỗi cài đặt hoặc cập nhật Plugin, rồi chạy lại `openclaw update`.

Khi Gateway đã cập nhật khởi động, các phụ thuộc runtime của Plugin đi kèm đã bật sẽ được staged trước khi kích hoạt Plugin. Các lần khởi động lại do cập nhật kích hoạt sẽ hoàn tất mọi staging phụ thuộc runtime đang hoạt động trước khi đóng Gateway, nên các lần khởi động lại của trình quản lý dịch vụ không làm gián đoạn một lượt cài đặt npm đang chạy.

Nếu bootstrap pnpm vẫn thất bại, trình cập nhật sẽ dừng sớm với lỗi dành riêng cho trình quản lý gói thay vì thử `npm run build` bên trong checkout.
</Note>

## Cách viết tắt `--update`

`openclaw --update` được viết lại thành `openclaw update` (hữu ích cho shell và script launcher).

## Liên quan

- `openclaw doctor` (đề xuất chạy cập nhật trước trên các checkout git)
- [Kênh phát triển](/vi/install/development-channels)
- [Cập nhật](/vi/install/updating)
- [Tham chiếu CLI](/vi/cli)
