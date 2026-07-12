---
read_when:
    - Bạn muốn chuyển đổi giữa stable/extended-stable/beta/dev
    - Bạn muốn cố định một phiên bản, thẻ hoặc SHA cụ thể
    - Bạn đang gắn thẻ hoặc phát hành các bản phát hành trước chính thức
sidebarTitle: Release Channels
summary: 'Các kênh ổn định, ổn định mở rộng, beta và phát triển: ngữ nghĩa, chuyển đổi, ghim phiên bản và gắn thẻ'
title: Kênh phát hành
x-i18n:
    generated_at: "2026-07-12T08:02:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a99e31f5121c0ab8696e638cb10a7ce16e8f32c81e4b2bef1f703eef71191494
    source_path: install/development-channels.md
    workflow: 16
---

OpenClaw cung cấp bốn kênh cập nhật:

- **ổn định**: dist-tag npm `latest`. Được khuyến nghị cho hầu hết người dùng.
- **ổn định mở rộng**: dist-tag npm `extended-stable`. Một kênh gói mới hoàn toàn,
  theo sau tháng được hỗ trợ. Kênh này chỉ dành cho gói và chỉ cho phép cài đặt
  ở foreground. Một lựa chọn đã lưu sẽ nhận gợi ý cập nhật chỉ đọc khi
  `update.checkOnStart` được bật, nhưng không bao giờ tự động áp dụng.
- **beta**: dist-tag npm `beta`. Chuyển dự phòng sang `latest` khi thiếu `beta`
  hoặc phiên bản này cũ hơn bản phát hành ổn định hiện tại.
- **phát triển**: đầu nhánh thay đổi liên tục của `main` (git). dist-tag npm `dev`
  khi được phát hành. `main` dành cho thử nghiệm và phát triển tích cực; có thể
  chứa các tính năng chưa hoàn chỉnh hoặc thay đổi gây phá vỡ tương thích.
  Không chạy kênh này cho các Gateway sản xuất.

Các bản dựng ổn định thường được phát hành lên **beta** trước, được kiểm chứng
tại đó, rồi được nâng lên **latest** mà không tăng phiên bản. Người bảo trì cũng
có thể phát hành trực tiếp lên `latest`. Dist-tag là nguồn thông tin chuẩn xác
cho các lượt cài đặt npm.

## Chuyển đổi kênh

```bash
openclaw update --channel stable
openclaw update --channel extended-stable
openclaw update --channel beta
openclaw update --channel dev
```

`--channel` lưu lựa chọn vào `update.channel` trong cấu hình và điều khiển cả
hai phương thức cài đặt:

| Kênh              | Cài đặt npm/gói                                                                                                                                                                                                         | Cài đặt git                                                                                                                                                                       |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `stable`          | dist-tag `latest`                                                                                                                                                                                                       | thẻ git ổn định mới nhất (loại trừ `-alpha.N`, `-beta.N`, `-rc.N`, `-dev.N`, `-next.N`, `-preview.N`, `-canary.N`, `-nightly.N` và các hậu tố tiền phát hành có tên khác)          |
| `extended-stable` | phân giải bộ chọn npm công khai `extended-stable`, xác minh chính xác gói đã chọn và cài đặt đúng phiên bản đó. Dừng an toàn khi lỗi, không chuyển dự phòng sang `latest`, `beta` hoặc `dev`.                            | không được hỗ trợ: OpenClaw giữ nguyên bản sao làm việc và yêu cầu bạn sử dụng phương thức cài đặt gói                                                                             |
| `beta`            | dist-tag `beta`, chuyển dự phòng sang `latest` khi thiếu `beta` hoặc phiên bản này cũ hơn                                                                                                                                | thẻ git beta mới nhất, chuyển dự phòng sang thẻ git ổn định mới nhất khi thiếu beta hoặc phiên bản beta cũ hơn                                                                     |
| `dev`             | dist-tag `dev` (hiếm dùng; hầu hết người dùng kênh phát triển chạy bản cài đặt git)                                                                                                                                      | tìm nạp, rebase bản sao làm việc lên nhánh `main` thượng nguồn, dựng và cài đặt lại CLI toàn cục                                                                                   |

Đối với bản cài đặt git `dev`, bản sao làm việc mặc định là `~/openclaw` (hoặc
`$OPENCLAW_HOME/openclaw` khi đã đặt `OPENCLAW_HOME`); ghi đè bằng
`OPENCLAW_GIT_DIR`.

<Tip>
Để duy trì song song bản ổn định và bản phát triển, hãy sử dụng hai bản sao làm việc riêng biệt và trỏ từng Gateway đến bản tương ứng.
</Tip>

## Nhắm đến phiên bản hoặc thẻ dùng một lần

Dùng `--tag` để nhắm đến một dist-tag, phiên bản hoặc đặc tả gói cụ thể cho một
lần cập nhật **mà không** thay đổi kênh đã lưu:

```bash
# Cài đặt một phiên bản cụ thể
openclaw update --tag 2026.4.1-beta.1

# Cài đặt từ dist-tag beta (một lần, không lưu)
openclaw update --tag beta

# Chuyển sang bản sao làm việc GitHub main thay đổi liên tục (được lưu)
openclaw update --channel dev

# Cài đặt một đặc tả gói npm cụ thể
openclaw update --tag openclaw@2026.4.1-beta.1

# Cài đặt từ GitHub main một lần mà không lưu kênh
openclaw update --tag main
```

Lưu ý:

- `--tag` **chỉ** áp dụng cho các bản cài đặt gói (npm); các bản cài đặt git bỏ qua
  tùy chọn này.
- Thẻ không được lưu; lần chạy `openclaw update` tiếp theo sẽ sử dụng kênh đã
  cấu hình.
- `--tag main` ánh xạ đến đặc tả tương thích với npm
  `github:openclaw/openclaw#main` cho lần chạy đó. Để cài đặt `main` thay đổi
  liên tục và được lưu, hãy dùng `openclaw update --channel dev` (các bản cài
  đặt gói sẽ chuyển sang bản sao làm việc git) hoặc cài đặt lại bằng phương thức
  git của trình cài đặt:
  `curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git --version main`.
  Phương thức cài đặt npm từ chối hoàn toàn các đích nguồn GitHub/git và thay
  vào đó hướng bạn đến phương thức git.
- Bảo vệ chống hạ cấp: nếu phiên bản đích cũ hơn phiên bản hiện tại, OpenClaw
  sẽ yêu cầu xác nhận (bỏ qua bằng `--yes`).
- Kênh ổn định mở rộng luôn sử dụng chính xác đích gói đã xác minh. Đây không
  phải là bí danh dùng một lần cho `--tag extended-stable`, và không thể kết hợp
  `--tag` với một kênh ổn định mở rộng có hiệu lực.
- `--channel beta` khác với `--tag beta`: luồng kênh có thể chuyển dự phòng sang
  stable/latest khi thiếu beta hoặc phiên bản beta cũ hơn, còn `--tag beta` luôn
  nhắm trực tiếp đến dist-tag `beta` cho lần chạy đó.

## Chạy thử

Xem trước những gì `openclaw update` sẽ thực hiện mà không tạo thay đổi:

```bash
openclaw update --dry-run
openclaw update --channel beta --dry-run
openclaw update --tag 2026.4.1-beta.1 --dry-run
openclaw update --dry-run --json
```

Lần chạy thử báo cáo kênh có hiệu lực, phiên bản đích, các hành động dự kiến và
việc có cần xác nhận hạ cấp hay không.

## Plugin và kênh

Chuyển đổi kênh bằng `openclaw update` cũng đồng bộ các nguồn Plugin:

- `dev` chuyển các Plugin đã cài đặt có bản tương ứng đi kèm trở lại nguồn đi
  kèm của chúng (bản sao làm việc git).
- `stable` và `beta` khôi phục các gói Plugin được cài đặt từ npm hoặc ClawHub.
- `extended-stable` phân giải các Plugin npm chính thức đủ điều kiện có ý định
  để trống/mặc định hoặc `latest` thành đúng phiên bản lõi đã cài đặt. Kênh này
  không truy vấn các thẻ Plugin `@extended-stable` trong thời gian chạy.
- Các Plugin được cài đặt từ npm sẽ được cập nhật sau khi hoàn tất cập nhật lõi.

## Kiểm tra trạng thái hiện tại

```bash
openclaw update status
```

Hiển thị kênh đang hoạt động (cùng nguồn quyết định kênh đó: cấu hình, thẻ git,
nhánh git, phiên bản đã cài đặt hoặc giá trị mặc định), loại cài đặt (git hoặc
gói), phiên bản hiện tại và trạng thái có bản cập nhật.

## Các phương pháp hay nhất khi gắn thẻ

- Gắn thẻ các bản phát hành mà bạn muốn các bản sao làm việc git chuyển đến:
  `vYYYY.M.PATCH` cho bản ổn định, `vYYYY.M.PATCH-beta.N` cho bản beta. Các hậu
  tố tiền phát hành có tên như `-alpha.N`, `-rc.N` và `-next.N` không phải là
  đích ổn định hoặc beta.
- Các thẻ ổn định dạng số cũ như `vYYYY.M.PATCH-1` và `v1.0.1-1` vẫn được nhận
  dạng là thẻ git ổn định để đảm bảo tương thích.
- `vYYYY.M.PATCH.beta.N` (phân tách bằng dấu chấm) cũng được nhận dạng để đảm
  bảo tương thích; nên ưu tiên `-beta.N`.
- Giữ các thẻ bất biến: không bao giờ di chuyển hoặc tái sử dụng thẻ.
- Các dist-tag npm vẫn là nguồn thông tin chuẩn xác cho các bản cài đặt npm:
  - `latest` -> ổn định
  - `extended-stable` -> bản phát hành gói theo sau tháng được hỗ trợ
  - `beta` -> bản dựng ứng viên hoặc bản dựng ổn định được phát hành lên beta trước
  - `dev` -> ảnh chụp nhanh của main (tùy chọn)

## Tính khả dụng của ứng dụng macOS

Các bản dựng beta và phát triển có thể **không** bao gồm bản phát hành ứng dụng
macOS. Điều này không có vấn đề gì:

- Thẻ git và dist-tag npm vẫn có thể được phát hành độc lập.
- Nêu rõ "không có bản dựng macOS cho bản beta này" trong ghi chú phát hành
  hoặc nhật ký thay đổi.

## Liên quan

- [Cập nhật](/vi/install/updating)
- [Nội bộ trình cài đặt](/vi/install/installer)
