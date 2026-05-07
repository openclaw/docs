---
read_when:
    - Bạn muốn chuyển đổi giữa stable/beta/dev
    - Bạn muốn ghim một phiên bản, tag hoặc SHA cụ thể
    - Bạn đang gắn thẻ hoặc xuất bản các bản phát hành trước
sidebarTitle: Release Channels
summary: 'Các kênh ổn định, beta và phát triển: ngữ nghĩa, chuyển đổi, ghim và gắn thẻ'
title: Kênh phát hành
x-i18n:
    generated_at: "2026-05-07T01:52:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6579110cc5c0e62ef238d7e4200db5fea188f35dc9366a17b3cf92a58c8935cc
    source_path: install/development-channels.md
    workflow: 16
---

OpenClaw phát hành ba kênh cập nhật:

- **stable**: npm dist-tag `latest`. Khuyến nghị cho hầu hết người dùng.
- **beta**: npm dist-tag `beta` khi kênh này đang hiện hành; nếu beta bị thiếu hoặc cũ hơn
  bản phát hành ổn định mới nhất, luồng cập nhật sẽ chuyển dự phòng sang `latest`.
- **dev**: đầu nhánh thay đổi liên tục của `main` (git). npm dist-tag: `dev` (khi được phát hành).
  Nhánh `main` dành cho thử nghiệm và phát triển tích cực. Nhánh này có thể chứa
  tính năng chưa hoàn chỉnh hoặc thay đổi phá vỡ tương thích. Không dùng nhánh này cho Gateway sản xuất.

Chúng tôi thường phát hành các bản dựng ổn định lên **beta** trước, kiểm thử ở đó, rồi chạy một
bước thăng cấp rõ ràng để chuyển bản dựng đã được thẩm định sang `latest` mà không
thay đổi số phiên bản. Maintainer cũng có thể phát hành trực tiếp một bản ổn định
lên `latest` khi cần. Dist-tag là nguồn sự thật cho các bản cài đặt npm.

## Các dòng hỗ trợ hằng tháng dự kiến

OpenClaw chưa phát hành kênh LTS hoặc kênh hỗ trợ hằng tháng. Chúng tôi đang hướng
tới các dòng hỗ trợ hằng tháng tương thích SemVer để người dùng có thể ở trên một
dòng ít thay đổi hơn trong khi `latest` vẫn di chuyển nhanh.

Dạng phiên bản dự kiến là `YYYY.M.PATCH`:

- `YYYY` là năm.
- `M` là dòng phát hành theo tháng, không có số 0 ở đầu.
- `PATCH` tăng trong dòng hằng tháng đó và có thể vượt quá 100 nếu cần.

Ví dụ thẻ trong tương lai:

- `v2026.6.0`, `v2026.6.1`, `v2026.6.2` cho dòng tháng Sáu.
- `v2026.6.3-beta.1` cho một bản phát hành thử trên tuyến nhanh/latest.
- Một dist-tag dòng hỗ trợ trong tương lai như `stable-2026-6` hoặc `lts-2026-6` có thể
  trỏ tới một dòng hằng tháng, nhưng hiện nay chưa có kênh nào như vậy.

Cho đến khi quá trình di chuyển đó hoàn tất, các kênh cập nhật công khai vẫn là `stable`, `beta`,
và `dev`.

## Chuyển kênh

```bash
openclaw update --channel stable
openclaw update --channel beta
openclaw update --channel dev
```

`--channel` lưu lựa chọn của bạn trong cấu hình (`update.channel`) và căn chỉnh
phương thức cài đặt:

- **`stable`** (bản cài đặt gói): cập nhật qua npm dist-tag `latest`.
- **`beta`** (bản cài đặt gói): ưu tiên npm dist-tag `beta`, nhưng chuyển dự phòng sang
  `latest` khi `beta` bị thiếu hoặc cũ hơn thẻ ổn định hiện tại.
- **`stable`** (bản cài đặt git): checkout thẻ git ổn định mới nhất.
- **`beta`** (bản cài đặt git): ưu tiên thẻ git beta mới nhất, nhưng chuyển dự phòng sang
  thẻ git ổn định mới nhất khi beta bị thiếu hoặc cũ hơn.
- **`dev`**: bảo đảm có một git checkout (mặc định `~/openclaw`, ghi đè bằng
  `OPENCLAW_GIT_DIR`), chuyển sang `main`, rebase trên upstream, build, và
  cài CLI toàn cục từ checkout đó.

<Tip>
Nếu bạn muốn chạy stable và dev song song, hãy giữ hai clone và trỏ gateway của bạn tới bản stable.
</Tip>

## Nhắm mục tiêu phiên bản hoặc thẻ một lần

Dùng `--tag` để nhắm tới một dist-tag, phiên bản, hoặc package spec cụ thể cho một lần
cập nhật **mà không** thay đổi kênh đã lưu của bạn:

```bash
# Cài đặt một phiên bản cụ thể
openclaw update --tag 2026.4.1-beta.1

# Cài đặt từ beta dist-tag (một lần, không lưu)
openclaw update --tag beta

# Cài đặt từ nhánh main của GitHub (npm tarball)
openclaw update --tag main

# Cài đặt một npm package spec cụ thể
openclaw update --tag openclaw@2026.4.1-beta.1
```

Ghi chú:

- `--tag` chỉ áp dụng cho **bản cài đặt gói (npm)**. Bản cài đặt git bỏ qua tùy chọn này.
- Thẻ không được lưu. Lần `openclaw update` tiếp theo sẽ dùng kênh đã cấu hình của bạn
  như thường lệ.
- Bảo vệ hạ cấp: nếu phiên bản mục tiêu cũ hơn phiên bản hiện tại của bạn,
  OpenClaw sẽ yêu cầu xác nhận (bỏ qua bằng `--yes`).
- `--channel beta` khác với `--tag beta`: luồng kênh có thể chuyển dự phòng
  sang stable/latest khi beta bị thiếu hoặc cũ hơn, trong khi `--tag beta` nhắm tới
  dist-tag `beta` thô cho lần chạy đó.

## Chạy thử

Xem trước `openclaw update` sẽ làm gì mà không thực hiện thay đổi:

```bash
openclaw update --dry-run
openclaw update --channel beta --dry-run
openclaw update --tag 2026.4.1-beta.1 --dry-run
openclaw update --dry-run --json
```

Chạy thử hiển thị kênh hiệu lực, phiên bản mục tiêu, các hành động dự kiến, và
liệu có cần xác nhận hạ cấp hay không.

## Plugin và kênh

Khi bạn chuyển kênh bằng `openclaw update`, OpenClaw cũng đồng bộ các nguồn Plugin:

- `dev` ưu tiên Plugin đi kèm từ git checkout.
- `stable` và `beta` khôi phục các gói Plugin đã cài bằng npm.
- Plugin đã cài bằng npm được cập nhật sau khi cập nhật lõi hoàn tất.

## Kiểm tra trạng thái hiện tại

```bash
openclaw update status
```

Hiển thị kênh đang hoạt động, loại cài đặt (git hoặc gói), phiên bản hiện tại, và
nguồn (cấu hình, thẻ git, nhánh git, hoặc mặc định).

## Thực hành tốt nhất khi gắn thẻ

- Gắn thẻ các bản phát hành mà bạn muốn git checkout đặt vào (`vYYYY.M.D` cho các
  bản phát hành ổn định hiện tại, `vYYYY.M.D-beta.N` cho các bản phát hành beta hiện tại).
- `vYYYY.M.D.beta.N` cũng được nhận diện để tương thích, nhưng nên dùng `-beta.N`.
- Các thẻ cũ `vYYYY.M.D-<patch>` vẫn được nhận diện là ổn định (không phải beta),
  nhưng mô hình hỗ trợ hằng tháng dự kiến sẽ dùng số patch bình thường
  (`vYYYY.M.PATCH`) thay vì hậu tố sửa bằng dấu gạch nối.
- Giữ thẻ bất biến: không bao giờ di chuyển hoặc tái sử dụng thẻ.
- npm dist-tag vẫn là nguồn sự thật cho các bản cài đặt npm:
  - `latest` -> stable
  - `beta` -> bản dựng ứng viên hoặc bản dựng ổn định theo hướng beta trước
  - `dev` -> ảnh chụp nhanh main (tùy chọn)

## Tính sẵn có của ứng dụng macOS

Bản dựng beta và dev có thể **không** bao gồm bản phát hành ứng dụng macOS. Điều đó không sao:

- Thẻ git và npm dist-tag vẫn có thể được phát hành.
- Nêu rõ "không có bản dựng macOS cho beta này" trong ghi chú phát hành hoặc changelog.

## Liên quan

- [Cập nhật](/vi/install/updating)
- [Nội bộ trình cài đặt](/vi/install/installer)
