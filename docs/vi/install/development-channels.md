---
read_when:
    - Bạn muốn chuyển đổi giữa stable/beta/dev
    - Bạn muốn ghim một phiên bản, thẻ hoặc SHA cụ thể
    - Bạn đang gắn thẻ hoặc phát hành bản tiền phát hành
sidebarTitle: Release Channels
summary: 'Kênh stable, beta và dev: ngữ nghĩa, chuyển đổi, ghim phiên bản và gắn thẻ'
title: Kênh phát hành
x-i18n:
    generated_at: "2026-06-27T17:37:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7b5b0b8b43dd15b3fdd83d28c5d0292d260594325ad6e6e95533720ba3e59277
    source_path: install/development-channels.md
    workflow: 16
---

OpenClaw phát hành ba kênh cập nhật:

- **stable**: npm dist-tag `latest`. Được khuyến nghị cho hầu hết người dùng.
- **beta**: npm dist-tag `beta` khi còn hiện hành; nếu beta bị thiếu hoặc cũ hơn
  bản phát hành stable mới nhất, luồng cập nhật sẽ quay về `latest`.
- **dev**: đầu nhánh đang thay đổi của `main` (git). npm dist-tag: `dev` (khi được phát hành).
  Nhánh `main` dành cho thử nghiệm và phát triển chủ động. Nhánh này có thể chứa
  các tính năng chưa hoàn thiện hoặc thay đổi phá vỡ tương thích. Không dùng cho Gateway sản xuất.

Chúng tôi thường phát hành các bản dựng stable lên **beta** trước, kiểm thử ở đó, rồi chạy một
bước thăng cấp rõ ràng để chuyển bản dựng đã được kiểm định sang `latest` mà không
thay đổi số phiên bản. Maintainer cũng có thể phát hành bản stable
trực tiếp lên `latest` khi cần. Dist-tag là nguồn sự thật cho các bản cài đặt npm.

## Chuyển kênh

```bash
openclaw update --channel stable
openclaw update --channel beta
openclaw update --channel dev
```

`--channel` lưu lựa chọn của bạn trong cấu hình (`update.channel`) và căn chỉnh
phương thức cài đặt:

- **`stable`** (cài đặt package): cập nhật qua npm dist-tag `latest`.
- **`beta`** (cài đặt package): ưu tiên npm dist-tag `beta`, nhưng quay về
  `latest` khi `beta` bị thiếu hoặc cũ hơn tag stable hiện tại.
- **`stable`** (cài đặt git): checkout tag git stable mới nhất, loại trừ
  các tag semver prerelease như `-alpha.N`, `-beta.N`, `-rc.N`, `-dev.N`,
  `-next.N`, `-preview.N`, `-canary.N`, `-nightly.N`, và các hậu tố prerelease
  khác.
- **`beta`** (cài đặt git): ưu tiên tag git beta mới nhất, nhưng quay về
  tag git stable mới nhất khi beta bị thiếu hoặc cũ hơn.
- **`dev`**: bảo đảm có một checkout git (mặc định `~/openclaw`, hoặc
  `$OPENCLAW_HOME/openclaw` khi `OPENCLAW_HOME` được đặt; ghi đè bằng
  `OPENCLAW_GIT_DIR`), chuyển sang `main`, rebase lên upstream, build, và
  cài đặt CLI toàn cục từ checkout đó.

<Tip>
Nếu bạn muốn chạy stable và dev song song, hãy giữ hai clone và trỏ Gateway của bạn vào bản stable.
</Tip>

## Nhắm tới phiên bản hoặc tag một lần

Dùng `--tag` để nhắm tới một dist-tag, phiên bản, hoặc package spec cụ thể cho một lần
cập nhật **mà không** thay đổi kênh đã lưu của bạn:

```bash
# Install a specific version
openclaw update --tag 2026.4.1-beta.1

# Install from the beta dist-tag (one-off, does not persist)
openclaw update --tag beta

# Switch to the moving GitHub main checkout
openclaw update --channel dev

# Install a specific npm package spec
openclaw update --tag openclaw@2026.4.1-beta.1

# Install from GitHub main once without persisting the channel
openclaw update --tag main
```

Ghi chú:

- `--tag` chỉ áp dụng cho **cài đặt package (npm)**. Cài đặt git bỏ qua tùy chọn này.
- Tag không được lưu. Lần chạy `openclaw update` tiếp theo sẽ dùng kênh đã cấu hình của bạn
  như thường lệ.
- Với cài đặt package, OpenClaw đóng gói trước các GitHub/git source spec thành một
  tarball tạm thời trước bước cài đặt npm theo giai đoạn. Dùng `--channel dev` hoặc
  `--install-method git --version main` khi bạn muốn checkout `main`
  đang thay đổi làm bản cài đặt lâu dài.
- Bảo vệ chống hạ cấp: nếu phiên bản đích cũ hơn phiên bản hiện tại của bạn,
  OpenClaw sẽ yêu cầu xác nhận (bỏ qua bằng `--yes`).
- `--channel beta` khác với `--tag beta`: luồng kênh có thể quay về
  stable/latest khi beta bị thiếu hoặc cũ hơn, còn `--tag beta` nhắm tới
  dist-tag `beta` thô cho lần chạy đó.

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

Khi bạn chuyển kênh bằng `openclaw update`, OpenClaw cũng đồng bộ nguồn Plugin:

- `dev` ưu tiên các Plugin được bundle từ checkout git.
- `stable` và `beta` khôi phục các package Plugin được cài qua npm.
- Các Plugin được cài qua npm sẽ được cập nhật sau khi cập nhật lõi hoàn tất.

## Kiểm tra trạng thái hiện tại

```bash
openclaw update status
```

Hiển thị kênh đang hoạt động, kiểu cài đặt (git hoặc package), phiên bản hiện tại, và
nguồn (cấu hình, tag git, nhánh git, hoặc mặc định).

## Thực hành tốt nhất khi gắn tag

- Gắn tag cho các bản phát hành mà bạn muốn checkout git trỏ tới (`vYYYY.M.PATCH` cho stable,
  `vYYYY.M.PATCH-beta.N` cho beta; các hậu tố semver prerelease có tên như
  `-alpha.N`, `-rc.N`, và `-next.N` không phải là đích stable).
- Các tag stable dạng số cũ như `vYYYY.M.PATCH-1` và `v1.0.1-1` vẫn
  được nhận diện là tag git stable để tương thích.
- `vYYYY.M.PATCH.beta.N` cũng được nhận diện để tương thích, nhưng nên dùng `-beta.N`.
- Giữ tag bất biến: không bao giờ di chuyển hoặc tái sử dụng tag.
- npm dist-tag vẫn là nguồn sự thật cho các bản cài đặt npm:
  - `latest` -> stable
  - `beta` -> bản dựng ứng viên hoặc bản dựng stable phát hành qua beta trước
  - `dev` -> snapshot main (tùy chọn)

## Tính khả dụng của ứng dụng macOS

Các bản dựng beta và dev có thể **không** bao gồm bản phát hành ứng dụng macOS. Điều đó không sao:

- Tag git và npm dist-tag vẫn có thể được phát hành.
- Nêu rõ "không có bản dựng macOS cho beta này" trong ghi chú phát hành hoặc changelog.

## Liên quan

- [Cập nhật](/vi/install/updating)
- [Nội bộ trình cài đặt](/vi/install/installer)
