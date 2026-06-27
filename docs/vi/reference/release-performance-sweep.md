---
read_when:
    - Bạn đang xác thực đợt dọn dẹp hiệu năng và kích thước gói tháng 5 năm 2026
    - Bạn cần các số liệu đằng sau bài đăng blog về hiệu năng và phụ thuộc của OpenClaw
    - Bạn đang thay đổi các cổng phát hành, package shrinkwrap hoặc ranh giới phụ thuộc của Plugin
summary: Tóm tắt trực quan và bằng chứng kỹ thuật cho đợt dọn dẹp hiệu năng, kích thước gói, phụ thuộc và shrinkwrap tháng 5 năm 2026
title: Quét hiệu năng phát hành
x-i18n:
    generated_at: "2026-06-27T18:08:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 93438b8037a40ed9e5590854926badfe943d440e4c585e6290d29b54764e861b
    source_path: reference/release-performance-sweep.md
    workflow: 16
---

Trang này ghi lại bằng chứng đằng sau đợt dọn dẹp hiệu năng, kích thước gói,
phụ thuộc và shrinkwrap của OpenClaw vào tháng 5 năm 2026. Đây là tài liệu kỹ
thuật đi kèm với bài blog công khai.

Hai cuộc kiểm toán được kết hợp ở đây:

- **Đợt rà soát hiệu năng phát hành:** GitHub Releases từ `v2026.5.28` quay lại
  đến bản ổn định `v2026.4.23`, sử dụng workflow `OpenClaw Performance`,
  `profile=smoke`, luồng mock-provider. Hầu hết các hàng thẻ là một mẫu; các
  hàng `v2026.5.27` và `v2026.5.28` sử dụng các artifact nhánh phát hành
  repeat-3 mới nhất.
- **Bối cảnh tháng 4 trước đó:** các baseline mock-provider `clawgrit-reports`
  đã xuất bản từ `v2026.4.1` đến `v2026.5.2`, chỉ dùng để tránh coi các bản phát
  hành lỗi vào cuối tháng 4 là baseline hiệu năng công khai.
- **Đợt rà soát dung lượng cài đặt:** các lượt cài đặt mới
  `npm install --ignore-scripts` vào các gói tạm thời, với `du -sk node_modules`
  để đo kích thước và một lượt duyệt `node_modules` để đếm số phiên bản gói.
- **Đợt rà soát kích thước gói npm:** `npm pack openclaw@<version> --dry-run --json`
  cho các bản phát hành đã xuất bản, ghi lại kích thước tarball nén, kích thước
  sau khi giải nén và số lượng tệp.

<Warning>
Đợt rà soát hiệu năng chính dùng một mẫu smoke cho mỗi thẻ, ngoại trừ các hàng
`v2026.5.27` và `v2026.5.28`, vốn dùng các artifact nhánh phát hành repeat-3
mới nhất. Bối cảnh tháng 4 trước đó dùng các trung vị repeat-3 đã xuất bản từ
`clawgrit-reports`. Hãy xem các con số là bằng chứng xu hướng và tín hiệu săn
hồi quy, không phải là thống kê cổng phát hành.
</Warning>

## Ảnh chụp nhanh

Phạm vi hiệu năng: **77 bản phát hành được yêu cầu**, **74 điểm có artifact hỗ trợ**,
và **3 lượt chạy CI không khả dụng**. Điểm đo bản ổn định mới nhất: `v2026.5.28`.

<CardGroup cols={2}>
  <Card title="Stable agent turn" icon="gauge">
    **Lượt agent lạnh nhanh hơn 5,1 lần**

    - `v2026.4.14`: 9,8 giây
    - `v2026.5.28`: 1,9 giây

  </Card>
  <Card title="Published package" icon="package">
    **Tarball 17,9MB**

    Gói ổn định mới nhất, giảm từ đỉnh kích thước gói 43,3MB vào tháng 3.

  </Card>
  <Card title="Latest stable install" icon="hard-drive">
    **Cài đặt mới 361,7MiB**

    `v2026.5.28` cắt giảm mạnh cây phụ thuộc OpenClaw lồng nhau, nhưng một cây
    lồng nhau nhỏ hơn 259,7MiB vẫn còn trong kiểm toán cài đặt cục bộ.

  </Card>
  <Card title="Dependency graph" icon="boxes">
    **300 gói đã cài đặt**

    Bản phát hành ổn định mới nhất, được đo dưới dạng các gốc tên/phiên bản gói
    duy nhất trong một lượt cài đặt mới khi script bị tắt.

  </Card>
</CardGroup>

## Dòng thời gian dung lượng cài đặt

<CardGroup cols={2}>
  <Card title="Monthly high" icon="triangle-alert">
    **645 phụ thuộc**

    `2026.2.26` là mức cao nhất theo tháng về số lượng phụ thuộc trong mẫu này.

  </Card>
  <Card title="Shrinkwrap introduced" icon="lock">
    **Cài đặt 1.020,6MB**

    `2026.5.22` đã thêm shrinkwrap gốc và làm lộ một vấn đề về hình dạng gói:
    911,8MB nằm dưới `openclaw/node_modules` lồng nhau.

  </Card>
  <Card title="Latest stable" icon="tag">
    **Cài đặt 361,7MiB**

    `2026.5.28` giảm kích thước cài đặt mới 52,8% so với `2026.5.27`, nhưng vẫn
    cài một cây OpenClaw lồng nhau 259,7MiB.

  </Card>
  <Card title="Dependency graph" icon="scissors">
    **300 gốc gói**

    `2026.5.28` cài ít hơn `2026.5.27` 71 gốc tên/phiên bản gói duy nhất.

  </Card>
</CardGroup>

<Tip>
Bản thân shrinkwrap không phải là vấn đề. Hình dạng gói xấu mới là vấn đề.
`v2026.5.28` vẫn phát hành kèm shrinkwrap, nhưng cây phụ thuộc lồng nhau nhỏ hơn
nhiều và fanout canvas cho mọi nền tảng đã biến mất trong kiểm toán cục bộ.
</Tip>

## Có Gì Thay Đổi Trong 5.28

Đợt dọn dẹp giữa `v2026.5.27` và `v2026.5.28` đã giảm đồ thị cài đặt mặc định
thay vì loại bỏ chính các năng lực đó.

<CardGroup cols={2}>
  <Card title="Đồ thị mặc định gốc" icon="git-branch">
    Các gốc tên/phiên bản gói duy nhất giảm từ **371** xuống **300**. Số thực thể
    gói giảm từ **372** xuống **301**.
  </Card>
  <Card title="Cây lồng nhau" icon="unplug">
    `openclaw/node_modules` lồng nhau giảm từ **656.1MiB** xuống **259.7MiB** trong
    cùng đợt kiểm tra cài đặt cục bộ.
  </Card>
  <Card title="Các nhánh native tùy chọn" icon="cpu">
    Nhánh gói native đa nền tảng `@napi-rs/canvas` không còn được đưa vào
    cài đặt mặc định.
  </Card>
  <Card title="Bề mặt chuỗi cung ứng" icon="shield">
    Ít gói mặc định hơn đồng nghĩa với ít tarball, maintainer, binary native,
    hành vi tại thời điểm cài đặt và đường cập nhật bắc cầu cần tin cậy theo mặc định hơn.
  </Card>
</CardGroup>

## Các Con Số Chính

Không dùng các hàng bị lỗi cuối tháng Tư làm mốc hiệu năng công khai.
`v2026.4.23` và `v2026.4.29` là bằng chứng hồi quy hữu ích, nhưng các chênh lệch lớn
kiểu `14x` chủ yếu mô tả quá trình phục hồi từ một dòng phát hành lỗi.

Đối với câu chuyện trên blog, hãy dùng mốc đã phát hành đầu tháng Tư làm thang đo:

| Chỉ số          | Mốc đầu tháng Tư | `v2026.5.28` |                    Chênh lệch |
| --------------- | ---------------: | -----------: | ----------------------------: |
| Lượt agent lạnh |          9,819ms |      1,908ms | thấp hơn 80.6%, nhanh hơn 5.1x |
| Lượt agent ấm   |          7,458ms |      1,870ms | thấp hơn 74.9%, nhanh hơn 4.0x |
| RSS đỉnh agent  |          686.2MB |      581.0MB |                 thấp hơn 15.3% |

Mốc đầu tháng Tư là `v2026.4.14` từ lượt chạy mock-provider
`clawgrit-reports` đã phát hành. Lượt chạy đó dùng repeat 3 và chỉ thất bại
vì timeline chẩn đoán không được phát ra; các trung vị lạnh, ấm và RSS
vẫn hữu ích như một thang đo gần đúng. Hãy xem đây là ngữ cảnh tường thuật, không phải
thống kê cổng phát hành.

Trong đợt rà soát tháng Năm, hàng nhánh phát hành mới nhất đã thay đổi đáng kể so với
`v2026.5.2`:

| Chỉ số          | `v2026.5.2` | `v2026.5.28` |    Chênh lệch |
| --------------- | ----------: | -----------: | ------------: |
| Lượt agent lạnh |     3,897ms |      1,908ms | thấp hơn 51.0% |
| Lượt agent ấm   |     3,610ms |      1,870ms | thấp hơn 48.2% |
| RSS đỉnh agent  |     613.7MB |      581.0MB |  thấp hơn 5.3% |

So với bản phát hành ổn định trước đó:

| Chỉ số          | `v2026.5.27` | `v2026.5.28` |    Chênh lệch |
| --------------- | -----------: | -----------: | ------------: |
| Lượt agent lạnh |      2,231ms |      1,908ms | thấp hơn 14.5% |
| Lượt agent ấm   |      2,226ms |      1,870ms | thấp hơn 16.0% |
| RSS đỉnh agent  |      649.0MB |      581.0MB | thấp hơn 10.5% |

### Dung lượng cài đặt

| Chỉ số                                          |  Mốc cơ sở | `v2026.5.28` |       Chênh lệch |
| ----------------------------------------------- | --------: | -----------: | ----------: |
| Kích thước cài đặt từ đỉnh `2026.5.22`          | 1,020.6MB |     361.7MiB | thấp hơn 64.6% |
| Kích thước cài đặt từ bản phát hành mới nhất `2026.5.27` |  767.1MiB |     361.7MiB | thấp hơn 52.8% |
| Phụ thuộc từ mức cao hằng tháng `2026.2.26`     |       645 |          300 | thấp hơn 53.5% |
| Phụ thuộc từ bản phát hành mới nhất `2026.5.27` |       371 |          300 | thấp hơn 19.1% |
| `openclaw/node_modules` lồng nhau từ `2026.5.22` |   911.8MB |     259.7MiB | thấp hơn 71.5% |
| `openclaw/node_modules` lồng nhau từ `2026.5.27` |  656.1MiB |     259.7MiB | thấp hơn 60.4% |

### Kích thước gói npm

| Phiên bản    | Tarball nén | Gói đã giải nén |  Tệp | Ghi chú                           |
| ----------- | -----------------: | ---------------: | -----: | --------------------------------- |
| `2026.1.30` |             12.8MB |           33.5MB |  4,607 | gói được đổi thương hiệu giai đoạn đầu |
| `2026.2.26` |             23.6MB |           82.9MB | 10,125 | tăng trưởng tính năng             |
| `2026.3.31` |             43.3MB |          182.6MB | 21,037 | điểm cao nhất về kích thước gói   |
| `2026.4.29` |             22.9MB |           74.6MB |  9,309 | có thể thấy việc tinh giản gói    |
| `2026.5.12` |             23.4MB |           80.1MB | 12,035 | tách Plugin bên ngoài lớn         |
| `2026.5.22` |             17.2MB |           76.9MB | 12,386 | tài liệu/tài nguyên bị loại khỏi gói |
| `2026.5.27` |             17.8MB |           79.0MB | 12,509 | gói ổn định trước đó              |
| `2026.5.28` |             17.9MB |           81.0MB |  9,082 | gói ổn định mới nhất              |

`2026.5.12` là mốc tách plugin hiển thị trong nhật ký thay đổi:
Amazon Bedrock, Bedrock Mantle, Slack, OpenShell sandbox, Anthropic Vertex,
Matrix và WhatsApp đã được chuyển ra khỏi đường dẫn phụ thuộc lõi, để các nhánh
phụ thuộc của chúng được cài cùng các plugin đó thay vì mọi lần cài đặt lõi.

## Tóm tắt lượt agent Kova

Dòng ổn định tháng Tư chứa hai câu chuyện khác nhau. Đầu tháng Tư chậm
nhưng vẫn nhận diện được. Cuối tháng Tư trở thành một vách suy giảm hồi quy. `v2026.5.2` là nơi
lane mock-provider lần đầu giảm xuống phạm vi 3-5 giây và bắt đầu vượt qua
ổn định trong đợt quét được cung cấp.

Ngữ cảnh đã công bố trước đó:

| Bản phát hành | Kova | Lượt lạnh | Lượt ấm | RSS đỉnh của agent |
| ------------ | ---- | --------: | --------: | -------------: |
| `v2026.4.10` | FAIL |  11,031ms |   7,962ms |        679.0MB |
| `v2026.4.12` | FAIL |  11,965ms |   8,289ms |        713.5MB |
| `v2026.4.14` | FAIL |   9,819ms |   7,458ms |        686.2MB |
| `v2026.4.20` | FAIL |  22,314ms |  18,811ms |        810.8MB |
| `v2026.4.22` | FAIL |   9,630ms |   7,459ms |        743.0MB |

Đợt quét được cung cấp:

| Bản phát hành      | Kova | Lượt lạnh | Lượt ấm | RSS đỉnh của agent |
| ------------------- | ---- | --------: | --------: | -------------: |
| `v2026.4.23`        | FAIL |  47,847ms |   8,010ms |      1,082.7MB |
| `v2026.4.24`        | FAIL |  48,264ms |  25,483ms |        996.0MB |
| `v2026.4.25`        | FAIL |  81,080ms |  59,172ms |      1,113.9MB |
| `v2026.4.26`        | FAIL |  76,771ms |  54,941ms |      1,140.8MB |
| `v2026.4.27`        | FAIL |  60,902ms |  33,699ms |      1,156.0MB |
| `v2026.4.29`        | FAIL |  94,031ms |  57,334ms |      3,613.7MB |
| `v2026.5.2`         | PASS |   3,897ms |   3,610ms |        613.7MB |
| `v2026.5.7`         | PASS |   3,923ms |   3,693ms |        654.1MB |
| `v2026.5.12`        | PASS |   7,248ms |   6,629ms |        834.8MB |
| `v2026.5.18`        | PASS |   3,301ms |   2,913ms |        630.3MB |
| `v2026.5.20`        | PASS |   3,413ms |   2,952ms |        643.2MB |
| `v2026.5.22`        | PASS |   4,494ms |   4,093ms |        654.3MB |
| `v2026.5.26`        | PASS |   2,626ms |   2,282ms |        660.4MB |
| `v2026.5.27-beta.1` | PASS |   2,575ms |   2,217ms |        635.3MB |
| `v2026.5.27`        | PASS |   2,231ms |   2,226ms |        649.0MB |
| `v2026.5.28`        | PASS |   1,908ms |   1,870ms |        581.0MB |

## Probe nguồn

Các probe nguồn đã bị bỏ qua cho 17 ref cũ thành công vì các cây nguồn đó
chưa có các điểm vào probe bắt buộc. Chỉ số lượt agent vẫn
tồn tại cho các ref đó.

Các điểm probe nguồn đại diện:

| Bản phát hành      | `readyz` p50 mặc định | `readyz` p50 với 50 plugin | CLI health p50 | RSS tối đa của plugin |
| ------------------- | -------------------: | ----------------------: | -------------: | -------------: |
| `v2026.4.29`        |              2,819ms |                 2,618ms |        1,679ms |        389.0MB |
| `v2026.5.2`         |              2,324ms |                 2,013ms |        1,384ms |        377.2MB |
| `v2026.5.7`         |              1,649ms |                 1,540ms |        1,175ms |        387.6MB |
| `v2026.5.18`        |              1,942ms |                 1,927ms |          607ms |        426.5MB |
| `v2026.5.20`        |              1,966ms |                 1,987ms |          621ms |        455.0MB |
| `v2026.5.22`        |              2,081ms |                 1,884ms |        5,095ms |        444.2MB |
| `v2026.5.26`        |              1,546ms |                 1,634ms |          656ms |        400.4MB |
| `v2026.5.27-beta.1` |              1,462ms |                 1,548ms |          548ms |        394.0MB |
| `v2026.5.27`        |              1,491ms |                 1,571ms |          553ms |        401.5MB |
| `v2026.5.28`        |              1,457ms |                 1,474ms |          623ms |        386.1MB |

Đợt tăng đột biến về health của CLI `v2026.5.22` hiển thị trong bảng này dù
làn agent-turn vẫn vượt qua. Giữ lại các phép thăm dò nguồn khi điều tra các
hồi quy CLI hoặc Gateway có mục tiêu.

## Kiểm tra footprint cài đặt

Các mẫu phụ thuộc sử dụng một bản phát hành ổn định mỗi tháng, cộng với sự kiện
giới thiệu shrinkwrap `2026.5.22` và bản phát hành `2026.5.28` mới nhất.

| Điểm               | Phụ thuộc đã cài | Cài đặt mới | Gói OpenClaw | `openclaw/node_modules` lồng nhau | Shrinkwrap gốc | Hành vi cài đặt Canvas                    |
| ------------------ | ---------------: | ----------: | -----------: | --------------------------------: | -------------- | ----------------------------------------- |
| Thg 1 `2026.1.30`  |              605 |     438.4MB |       45.8MB |                             2.4MB | không          | wrapper cấp cao nhất + `darwin-arm64`     |
| Thg 2 `2026.2.26`  |              645 |     575.7MB |      110.1MB |                             3.5MB | không          | wrapper cấp cao nhất + `darwin-arm64`     |
| Thg 3 `2026.3.31`  |              438 |     584.1MB |      234.8MB |                               0MB | không          | wrapper cấp cao nhất + `darwin-arm64`     |
| Thg 4 `2026.4.29`  |              392 |     335.0MB |       97.4MB |                               0MB | không          | không cài gì                              |
| `2026.5.22`        |              401 |   1,020.6MB |    1,020.4MB |                           911.8MB | có             | lồng nhau: tất cả 12 gói `@napi-rs/canvas` |
| Thg 5 `2026.5.26`  |              371 |     767.5MB |      767.4MB |                           656.4MB | có             | lồng nhau: tất cả 12 gói `@napi-rs/canvas` |
| `2026.5.27`        |              371 |    767.1MiB |     766.9MiB |                          656.1MiB | có             | lồng nhau: tất cả 12 gói `@napi-rs/canvas` |
| Mới nhất `2026.5.28` |            300 |    361.7MiB |     361.6MiB |                          259.7MiB | có             | không cài gì                              |

### Ranh giới shrinkwrap

<CardGroup cols={2}>
  <Card title="Before shrinkwrap" icon="unlock">
    `2026.5.20` không có shrinkwrap gốc và không có cây phụ thuộc OpenClaw lồng
    nhau lớn.
  </Card>
  <Card title="Introduced" icon="lock">
    `2026.5.22` thêm shrinkwrap gốc và cài đặt 911.8MB dưới
    `openclaw/node_modules` lồng nhau.
  </Card>
  <Card title="Latest stable" icon="tag">
    `2026.5.28` giữ shrinkwrap và vẫn cài đặt 259.7MiB dưới
    `openclaw/node_modules` lồng nhau.
  </Card>
  <Card title="Canvas fanout fixed" icon="check">
    `2026.5.28` không còn cài đặt bất kỳ gói `@napi-rs/canvas` nào trong đợt
    kiểm tra cài đặt mới cục bộ.
  </Card>
</CardGroup>

Kiểm tra tarball đã phát hành xác minh ranh giới:

| Phiên bản   | Đã phát hành ổn định? | `npm-shrinkwrap.json` gốc | Ghi chú                                      |
| ----------- | --------------------- | -------------------------- | -------------------------------------------- |
| `2026.5.20` | có                    | không                      | bản phát hành ổn định cuối trước shrinkwrap  |
| `2026.5.21` | không                 | n/a                        | không có bản phát hành npm ổn định           |
| `2026.5.22` | có                    | có                         | shrinkwrap được giới thiệu                   |
| `2026.5.23` | không                 | n/a                        | không có bản phát hành npm ổn định           |
| `2026.5.24` | không                 | n/a                        | không có bản phát hành npm ổn định           |
| `2026.5.25` | không                 | n/a                        | không có bản phát hành npm ổn định           |
| `2026.5.26` | có                    | có                         | cây phụ thuộc lồng nhau vẫn còn              |
| `2026.5.27` | có                    | có                         | cây phụ thuộc lồng nhau vẫn còn              |
| `2026.5.28` | có                    | có                         | cây phụ thuộc lồng nhau nhỏ hơn nhiều        |

Điểm khác biệt quan trọng: **bản thân shrinkwrap không phải là vấn đề**.
`v2026.5.28` vẫn phát hành kèm shrinkwrap gốc. Vấn đề là hình dạng gói khiến npm
hiện thực hóa một cây phụ thuộc OpenClaw lồng nhau lớn và tất cả 12 gói nền tảng
`@napi-rs/canvas`. Cây lồng nhau nhỏ hơn trong `v2026.5.28`, và fanout nền tảng
canvas không còn xuất hiện trong kiểm tra cục bộ.

Để xem phần giải thích bằng ngôn ngữ dễ hiểu về shrinkwrap và các kiểm tra gói
ở cấp maintainer, hãy xem [npm shrinkwrap](/vi/gateway/security/shrinkwrap).

## Diễn giải chuỗi cung ứng

Số lượng phụ thuộc là một chỉ số bảo mật vận hành, không chỉ là chỉ số kích
thước cài đặt. Mỗi gói mở rộng tập hợp maintainer, tarball, bản cập nhật bắc
cầu, binary native tùy chọn và hành vi trong lúc cài đặt mà operator phải tin
cậy.

Hướng dọn dẹp là:

- giữ các capability nặng và tùy chọn bên ngoài bản cài đặt core mặc định
- để các gói Plugin sở hữu đồ thị phụ thuộc runtime của chúng
- tránh sửa chữa bằng package manager trong runtime khi Gateway khởi động
- giữ cài đặt xác định mà không khiến các gói native cho mọi nền tảng bị hiện
  thực hóa
- giữ script cài đặt bị tắt trong các đường chấp nhận và đo lường gói
- phát hiện cây phụ thuộc lồng nhau và các vụ bùng nổ phụ thuộc tùy chọn native
  trước khi phát hành

Tài liệu liên quan:

- [Phân giải phụ thuộc Plugin](/vi/plugins/dependency-resolution)
- [Kho Plugin](/vi/plugins/plugin-inventory)
- [Xác thực bản phát hành đầy đủ](/vi/reference/full-release-validation)
