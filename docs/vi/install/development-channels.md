---
read_when:
    - Bạn muốn chuyển đổi giữa ổn định/beta/phát triển
    - Bạn muốn ghim một phiên bản, thẻ hoặc SHA cụ thể
    - Bạn đang gắn thẻ hoặc xuất bản các bản phát hành trước
sidebarTitle: Release Channels
summary: 'Các kênh stable, beta và dev: ngữ nghĩa, chuyển đổi, ghim và gắn thẻ'
title: Kênh phát hành
x-i18n:
    generated_at: "2026-04-29T22:51:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 741d8ed2a1599264e1b41a99e81fac4b06d14cb026aa945a8757b15e5733f682
    source_path: install/development-channels.md
    workflow: 16
---

# Kênh phát triển

OpenClaw phát hành ba kênh cập nhật:

- **stable**: npm dist-tag `latest`. Được khuyến nghị cho hầu hết người dùng.
- **beta**: npm dist-tag `beta` khi kênh này là hiện hành; nếu beta bị thiếu hoặc cũ hơn
  bản phát hành stable mới nhất, luồng cập nhật sẽ quay về `latest`.
- **dev**: đầu nhánh đang dịch chuyển của `main` (git). npm dist-tag: `dev` (khi được phát hành).
  Nhánh `main` dành cho thử nghiệm và phát triển chủ động. Nhánh này có thể chứa
  các tính năng chưa hoàn thiện hoặc thay đổi phá vỡ tương thích. Không dùng nhánh này cho các Gateway production.

Chúng tôi thường phát hành bản dựng stable lên **beta** trước, kiểm thử ở đó, rồi chạy một
bước quảng bá rõ ràng để chuyển bản dựng đã được thẩm định sang `latest` mà không
thay đổi số phiên bản. Maintainer cũng có thể phát hành bản stable
trực tiếp lên `latest` khi cần. Dist-tags là nguồn sự thật cho các bản cài đặt npm.

## Chuyển kênh

```bash
openclaw update --channel stable
openclaw update --channel beta
openclaw update --channel dev
```

`--channel` lưu lựa chọn của bạn trong cấu hình (`update.channel`) và căn chỉnh
phương thức cài đặt:

- **`stable`** (cài đặt bằng package): cập nhật qua npm dist-tag `latest`.
- **`beta`** (cài đặt bằng package): ưu tiên npm dist-tag `beta`, nhưng quay về
  `latest` khi `beta` bị thiếu hoặc cũ hơn thẻ stable hiện tại.
- **`stable`** (cài đặt bằng git): checkout thẻ git stable mới nhất.
- **`beta`** (cài đặt bằng git): ưu tiên thẻ git beta mới nhất, nhưng quay về
  thẻ git stable mới nhất khi beta bị thiếu hoặc cũ hơn.
- **`dev`**: bảo đảm có một git checkout (mặc định `~/openclaw`, ghi đè bằng
  `OPENCLAW_GIT_DIR`), chuyển sang `main`, rebase lên upstream, build, và
  cài đặt CLI toàn cục từ checkout đó.

<Tip>
Nếu bạn muốn chạy stable và dev song song, hãy giữ hai bản clone và trỏ gateway của bạn vào bản stable.
</Tip>

## Nhắm mục tiêu phiên bản hoặc thẻ dùng một lần

Dùng `--tag` để nhắm mục tiêu một dist-tag, phiên bản, hoặc package spec cụ thể cho một lần
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

- `--tag` chỉ áp dụng cho **các bản cài đặt package (npm)**. Cài đặt bằng git sẽ bỏ qua tùy chọn này.
- Thẻ không được lưu lại. Lần chạy `openclaw update` tiếp theo sẽ dùng kênh đã cấu hình của bạn
  như thường lệ.
- Bảo vệ chống hạ cấp: nếu phiên bản mục tiêu cũ hơn phiên bản hiện tại của bạn,
  OpenClaw sẽ nhắc xác nhận (bỏ qua bằng `--yes`).
- `--channel beta` khác với `--tag beta`: luồng kênh có thể quay về
  stable/latest khi beta bị thiếu hoặc cũ hơn, trong khi `--tag beta` nhắm mục tiêu
  trực tiếp dist-tag `beta` thô cho lần chạy đó.

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

Khi bạn chuyển kênh bằng `openclaw update`, OpenClaw cũng đồng bộ nguồn Plugin:

- `dev` ưu tiên Plugin đi kèm từ git checkout.
- `stable` và `beta` khôi phục các package Plugin đã cài bằng npm.
- Plugin đã cài bằng npm được cập nhật sau khi cập nhật lõi hoàn tất.

## Kiểm tra trạng thái hiện tại

```bash
openclaw update status
```

Hiển thị kênh đang hoạt động, kiểu cài đặt (git hoặc package), phiên bản hiện tại, và
nguồn (cấu hình, thẻ git, nhánh git, hoặc mặc định).

## Thực hành tốt nhất khi gắn thẻ

- Gắn thẻ các bản phát hành mà bạn muốn git checkout hạ cánh vào (`vYYYY.M.D` cho stable,
  `vYYYY.M.D-beta.N` cho beta).
- `vYYYY.M.D.beta.N` cũng được nhận diện để tương thích, nhưng nên dùng `-beta.N`.
- Các thẻ legacy `vYYYY.M.D-<patch>` vẫn được nhận diện là stable (không phải beta).
- Giữ thẻ bất biến: không bao giờ di chuyển hoặc tái sử dụng thẻ.
- npm dist-tags vẫn là nguồn sự thật cho các bản cài đặt npm:
  - `latest` -> stable
  - `beta` -> bản dựng ứng viên hoặc bản dựng stable phát hành beta trước
  - `dev` -> snapshot main (tùy chọn)

## Tính khả dụng của ứng dụng macOS

Bản dựng beta và dev có thể **không** bao gồm bản phát hành ứng dụng macOS. Điều đó không sao:

- Thẻ git và npm dist-tag vẫn có thể được phát hành.
- Nêu rõ "không có bản dựng macOS cho beta này" trong ghi chú phát hành hoặc changelog.

## Liên quan

- [Cập nhật](/vi/install/updating)
- [Nội bộ trình cài đặt](/vi/install/installer)
