---
read_when:
    - Bạn muốn chuyển đổi giữa ổn định/beta/phát triển
    - Bạn muốn cố định một phiên bản, thẻ hoặc SHA cụ thể
    - Bạn đang gắn thẻ hoặc xuất bản các bản phát hành trước chính thức
sidebarTitle: Release Channels
summary: 'Các kênh ổn định, beta và dev: ngữ nghĩa, chuyển đổi, ghim và gắn thẻ'
title: Kênh phát hành
x-i18n:
    generated_at: "2026-05-07T13:20:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: d2516165635eb8fbaddf19e07fbb591b659479b5226c2bf467e29247552ababb
    source_path: install/development-channels.md
    workflow: 16
---

OpenClaw cung cấp ba kênh cập nhật:

- **stable**: npm dist-tag `latest`. Được khuyến nghị cho hầu hết người dùng.
- **beta**: npm dist-tag `beta` khi kênh này còn hiện hành; nếu beta bị thiếu hoặc cũ hơn
  bản phát hành stable mới nhất, luồng cập nhật sẽ chuyển về `latest`.
- **dev**: đầu di chuyển của `main` (git). npm dist-tag: `dev` (khi được phát hành).
  Nhánh `main` dành cho thử nghiệm và phát triển đang hoạt động. Nhánh này có thể chứa
  các tính năng chưa hoàn chỉnh hoặc thay đổi phá vỡ tương thích. Không dùng nhánh này cho Gateway sản xuất.

Chúng tôi thường phát hành các bản dựng stable lên **beta** trước, kiểm thử ở đó, rồi chạy một
bước thăng hạng rõ ràng để chuyển bản dựng đã được kiểm chứng sang `latest` mà không
thay đổi số phiên bản. Maintainer cũng có thể phát hành bản stable
trực tiếp lên `latest` khi cần. Dist-tag là nguồn sự thật cho các lượt cài đặt npm.

## Chuyển đổi kênh

```bash
openclaw update --channel stable
openclaw update --channel beta
openclaw update --channel dev
```

`--channel` lưu lựa chọn của bạn trong cấu hình (`update.channel`) và căn chỉnh
phương thức cài đặt:

- **`stable`** (cài đặt bằng package): cập nhật qua npm dist-tag `latest`.
- **`beta`** (cài đặt bằng package): ưu tiên npm dist-tag `beta`, nhưng chuyển về
  `latest` khi `beta` bị thiếu hoặc cũ hơn tag stable hiện tại.
- **`stable`** (cài đặt bằng git): checkout tag git stable mới nhất.
- **`beta`** (cài đặt bằng git): ưu tiên tag git beta mới nhất, nhưng chuyển về
  tag git stable mới nhất khi beta bị thiếu hoặc cũ hơn.
- **`dev`**: bảo đảm có một git checkout (mặc định `~/openclaw`, ghi đè bằng
  `OPENCLAW_GIT_DIR`), chuyển sang `main`, rebase trên upstream, build, và
  cài đặt CLI toàn cục từ checkout đó.

<Tip>
Nếu bạn muốn chạy stable và dev song song, hãy giữ hai clone và trỏ Gateway của bạn tới bản stable.
</Tip>

## Nhắm tới phiên bản hoặc tag một lần

Dùng `--tag` để nhắm tới một dist-tag, phiên bản hoặc package spec cụ thể cho một lần
cập nhật **mà không** thay đổi kênh đã lưu của bạn:

```bash
# Install a specific version
openclaw update --tag 2026.4.1-beta.1

# Install from the beta dist-tag (one-off, does not persist)
openclaw update --tag beta

# Install from GitHub main branch (npm tarball)
openclaw update --tag main

# Install a specific npm package spec
openclaw update --tag openclaw@2026.4.1-beta.1
```

Ghi chú:

- `--tag` chỉ áp dụng cho **cài đặt bằng package (npm)**. Cài đặt bằng git sẽ bỏ qua tùy chọn này.
- Tag không được lưu lại. Lần chạy `openclaw update` tiếp theo của bạn sẽ dùng
  kênh đã cấu hình như thường lệ.
- Bảo vệ hạ cấp: nếu phiên bản đích cũ hơn phiên bản hiện tại của bạn,
  OpenClaw sẽ yêu cầu xác nhận (bỏ qua bằng `--yes`).
- `--channel beta` khác với `--tag beta`: luồng kênh có thể chuyển về
  stable/latest khi beta bị thiếu hoặc cũ hơn, trong khi `--tag beta` nhắm tới
  dist-tag `beta` thô cho một lần chạy đó.

## Chạy thử

Xem trước `openclaw update` sẽ làm gì mà không thực hiện thay đổi:

```bash
openclaw update --dry-run
openclaw update --channel beta --dry-run
openclaw update --tag 2026.4.1-beta.1 --dry-run
openclaw update --dry-run --json
```

Chạy thử hiển thị kênh hiệu lực, phiên bản đích, các hành động dự kiến, và
liệu có cần xác nhận hạ cấp hay không.

## Plugin và kênh

Khi bạn chuyển đổi kênh bằng `openclaw update`, OpenClaw cũng đồng bộ các nguồn Plugin:

- `dev` ưu tiên các Plugin đi kèm từ git checkout.
- `stable` và `beta` khôi phục các package Plugin đã cài qua npm.
- Các Plugin đã cài qua npm được cập nhật sau khi bản cập nhật lõi hoàn tất.

## Kiểm tra trạng thái hiện tại

```bash
openclaw update status
```

Hiển thị kênh đang hoạt động, kiểu cài đặt (git hoặc package), phiên bản hiện tại, và
nguồn (cấu hình, tag git, nhánh git, hoặc mặc định).

## Thực hành tốt nhất khi gắn tag

- Gắn tag các bản phát hành mà bạn muốn git checkout sẽ đáp xuống (`vYYYY.M.D` cho stable,
  `vYYYY.M.D-beta.N` cho beta).
- `vYYYY.M.D.beta.N` cũng được nhận diện để tương thích, nhưng nên dùng `-beta.N`.
- Các tag cũ dạng `vYYYY.M.D-<patch>` vẫn được nhận diện là stable (không phải beta).
- Giữ tag bất biến: không bao giờ di chuyển hoặc tái sử dụng tag.
- npm dist-tag vẫn là nguồn sự thật cho các lượt cài đặt npm:
  - `latest` -> stable
  - `beta` -> bản dựng ứng viên hoặc bản dựng stable phát hành qua beta trước
  - `dev` -> ảnh chụp nhanh main (tùy chọn)

## Khả dụng của ứng dụng macOS

Các bản dựng beta và dev có thể **không** bao gồm bản phát hành ứng dụng macOS. Điều đó không sao:

- Tag git và npm dist-tag vẫn có thể được phát hành.
- Nêu rõ "không có bản dựng macOS cho beta này" trong ghi chú phát hành hoặc changelog.

## Liên quan

- [Cập nhật](/vi/install/updating)
- [Nội bộ trình cài đặt](/vi/install/installer)
