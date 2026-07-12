---
read_when:
    - Bạn đang xác thực việc tối ưu hiệu năng và tinh gọn kích thước gói vào tháng 5 năm 2026
    - Bạn cần các số liệu đằng sau bài blog về hiệu năng và phần phụ thuộc của OpenClaw
    - Bạn đang thay đổi các cổng kiểm soát phát hành, tệp shrinkwrap của gói hoặc ranh giới phụ thuộc của plugin
summary: Tóm tắt trực quan và bằng chứng kỹ thuật cho đợt dọn dẹp về hiệu năng, kích thước gói, phần phụ thuộc và shrinkwrap vào tháng 5 năm 2026
title: Rà soát hiệu năng bản phát hành
x-i18n:
    generated_at: "2026-07-12T08:23:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9e98ffc9d63e14e078a19368917eb4278695e1426048dc21942f928af145d5e1
    source_path: reference/release-performance-sweep.md
    workflow: 16
---

Trang này ghi lại bằng chứng đằng sau đợt dọn dẹp về hiệu năng, kích thước gói,
phụ thuộc và shrinkwrap của OpenClaw vào tháng 5 năm 2026. Đây là tài liệu kỹ thuật
đi kèm bài đăng blog công khai.

Hai đợt kiểm tra được kết hợp tại đây:

- **Rà soát hiệu năng bản phát hành:** các GitHub Releases từ `v2026.5.28` trở về
  bản ổn định `v2026.4.23`, sử dụng quy trình `OpenClaw Performance`,
  `profile=smoke`, luồng nhà cung cấp mô phỏng. Hầu hết các hàng thẻ phiên bản dùng một mẫu;
  các hàng `v2026.5.27` và `v2026.5.28` sử dụng những hiện vật nhánh phát hành
  lặp lại 3 lần mới nhất.
- **Bối cảnh đầu tháng 4:** các đường cơ sở nhà cung cấp mô phỏng
  `clawgrit-reports` đã công bố từ `v2026.4.1` đến `v2026.5.2`, chỉ được dùng để tránh coi
  các bản phát hành bị lỗi vào cuối tháng 4 là đường cơ sở hiệu năng công khai.
- **Rà soát dung lượng cài đặt:** chạy `npm install --ignore-scripts` mới
  vào các gói tạm thời, dùng `du -sk node_modules` để đo kích thước và duyệt
  `node_modules` để đếm số phiên bản gói.
- **Rà soát kích thước gói npm:** chạy `npm pack openclaw@<version> --dry-run --json`
  cho các bản phát hành đã công bố, ghi lại kích thước tarball nén, kích thước sau khi giải nén và
  số lượng tệp.

<Warning>
Đợt rà soát hiệu năng chính sử dụng một mẫu smoke cho mỗi thẻ phiên bản, ngoại trừ các hàng
`v2026.5.27` và `v2026.5.28`, vốn sử dụng những hiện vật nhánh phát hành
lặp lại 3 lần mới nhất. Bối cảnh đầu tháng 4 sử dụng các giá trị trung vị lặp lại 3 lần đã công bố
từ `clawgrit-reports`. Hãy coi các con số là bằng chứng xu hướng và tín hiệu
tìm kiếm hồi quy, không phải số liệu thống kê cho cổng phát hành.
</Warning>

## Ảnh chụp tổng quan

Phạm vi hiệu năng: **77 bản phát hành được yêu cầu**, **74 điểm có hiện vật hỗ trợ**,
và **3 lượt chạy CI không khả dụng**. Điểm đo bản ổn định mới nhất: `v2026.5.28`.

<CardGroup cols={2}>
  <Card title="Lượt chạy tác tử ổn định" icon="gauge">
    **Lượt chạy nguội nhanh hơn 5,1 lần**

    - `v2026.4.14`: 9,8 giây
    - `v2026.5.28`: 1,9 giây

  </Card>
  <Card title="Gói đã công bố" icon="package">
    **Tarball 17,9MB**

    Gói ổn định mới nhất, giảm từ đỉnh kích thước gói 43,3MB vào tháng 3.

  </Card>
  <Card title="Bản cài đặt ổn định mới nhất" icon="hard-drive">
    **Bản cài đặt mới 361,7MiB**

    Giảm mạnh cây phụ thuộc OpenClaw lồng nhau so với đỉnh khi đưa shrinkwrap vào
    ở `2026.5.22`, dù trong lần kiểm tra cài đặt cục bộ vẫn còn
    một cây lồng nhau nhỏ hơn với kích thước 259,7MiB.

  </Card>
  <Card title="Đồ thị phụ thuộc" icon="boxes">
    **300 gói đã cài đặt**

    Được đo dưới dạng các gốc tên/phiên bản gói duy nhất trong một bản cài đặt mới với
    tập lệnh bị tắt; ít hơn bản phát hành ổn định trước 71 gốc.

  </Card>
</CardGroup>

## Những thay đổi trong 5.28

Đợt dọn dẹp từ `v2026.5.27` đến `v2026.5.28` đã giảm đồ thị
cài đặt mặc định thay vì loại bỏ chính các khả năng.

<CardGroup cols={2}>
  <Card title="Đồ thị mặc định gốc" icon="git-branch">
    Số gốc tên/phiên bản gói duy nhất giảm từ **371** xuống **300**. Số phiên bản
    gói giảm từ **372** xuống **301**.
  </Card>
  <Card title="Cây lồng nhau" icon="unplug">
    `openclaw/node_modules` lồng nhau giảm từ **656,1MiB** xuống **259,7MiB** trong
    cùng lần kiểm tra cài đặt cục bộ.
  </Card>
  <Card title="Các nhánh phụ thuộc native tùy chọn" icon="cpu">
    Nhánh gói native `@napi-rs/canvas` cho tất cả nền tảng không còn được đưa vào
    bản cài đặt mặc định.
  </Card>
  <Card title="Bề mặt chuỗi cung ứng" icon="shield">
    Ít gói mặc định hơn đồng nghĩa với ít tarball, người bảo trì, tệp nhị phân native,
    hành vi khi cài đặt và đường dẫn cập nhật bắc cầu phải mặc định tin cậy hơn.
  </Card>
</CardGroup>

<Tip>
Bản thân shrinkwrap không phải là vấn đề. Cấu trúc gói không phù hợp mới là vấn đề.
`v2026.5.28` vẫn cung cấp shrinkwrap, nhưng cây phụ thuộc lồng nhau nhỏ hơn nhiều
và sự phân nhánh canvas cho tất cả nền tảng đã biến mất trong lần kiểm tra cục bộ.
</Tip>

## Các số liệu nổi bật

Không sử dụng các hàng bị lỗi vào cuối tháng 4 làm đường cơ sở hiệu năng công khai.
`v2026.4.23` và `v2026.4.29` là bằng chứng hồi quy hữu ích, nhưng các mức chênh lệch lớn
kiểu `14x` chủ yếu mô tả sự phục hồi từ một dòng bản phát hành kém.

Đối với nội dung blog, hãy dùng đường cơ sở đã công bố từ đầu tháng 4 để thể hiện quy mô.
Đường cơ sở là `v2026.4.14` từ lượt chạy nhà cung cấp mô phỏng
`clawgrit-reports` đã công bố (lặp lại 3 lần; lượt chạy đó chỉ thất bại vì
dòng thời gian chẩn đoán không được phát ra, nên các giá trị trung vị nguội, ấm và RSS
vẫn hữu ích để ước lượng quy mô). Hãy coi đây là bối cảnh tường thuật,
không phải số liệu thống kê cho cổng phát hành.

| Chỉ số          | Đường cơ sở đầu tháng 4 | `v2026.5.28` |                    Chênh lệch |
| --------------- | ----------------------: | -----------: | -----------------------------: |
| Lượt chạy nguội của tác tử |                9.819ms |      1.908ms | giảm 80,6%, nhanh hơn 5,1 lần |
| Lượt chạy ấm của tác tử |                7.458ms |      1.870ms | giảm 74,9%, nhanh hơn 4,0 lần |
| RSS đỉnh của tác tử  |                686,2MB |      581,0MB |                    giảm 15,3% |

Trong đợt rà soát tháng 5, hàng nhánh phát hành mới nhất đã thay đổi đáng kể so với
`v2026.5.2`:

| Chỉ số          | `v2026.5.2` | `v2026.5.28` | Chênh lệch |
| --------------- | ----------: | -----------: | ---------: |
| Lượt chạy nguội của tác tử |     3.897ms |      1.908ms | giảm 51,0% |
| Lượt chạy ấm của tác tử |     3.610ms |      1.870ms | giảm 48,2% |
| RSS đỉnh của tác tử  |     613,7MB |      581,0MB |  giảm 5,3% |

So với bản phát hành ổn định trước:

| Chỉ số          | `v2026.5.27` | `v2026.5.28` | Chênh lệch |
| --------------- | -----------: | -----------: | ---------: |
| Lượt chạy nguội của tác tử |      2.231ms |      1.908ms | giảm 14,5% |
| Lượt chạy ấm của tác tử |      2.226ms |      1.870ms | giảm 16,0% |
| RSS đỉnh của tác tử  |      649,0MB |      581,0MB | giảm 10,5% |

### Dung lượng cài đặt

| Chỉ số                                          |  Đường cơ sở | `v2026.5.28` | Chênh lệch |
| ----------------------------------------------- | -----------: | -----------: | ---------: |
| Kích thước cài đặt so với đỉnh `2026.5.22`              | 1.020,6MB |     361,7MiB | giảm 64,6% |
| Kích thước cài đặt so với bản phát hành mới nhất `2026.5.27`    |  767,1MiB |     361,7MiB | giảm 52,8% |
| Số phụ thuộc so với mức cao nhất tháng `2026.2.26`      |       645 |          300 | giảm 53,5% |
| Số phụ thuộc so với bản phát hành mới nhất `2026.5.27`    |       371 |          300 | giảm 19,1% |
| `openclaw/node_modules` lồng nhau so với `2026.5.22` |   911,8MB |     259,7MiB | giảm 71,5% |
| `openclaw/node_modules` lồng nhau so với `2026.5.27` |  656,1MiB |     259,7MiB | giảm 60,4% |

### Kích thước gói npm

| Phiên bản     | Tarball nén | Gói sau khi giải nén |  Tệp | Ghi chú                             |
| ----------- | ----------: | -------------------: | ---: | ----------------------------------- |
| `2026.1.30` |      12,8MB |               33,5MB |  4.607 | gói đổi thương hiệu giai đoạn đầu           |
| `2026.2.26` |      23,6MB |               82,9MB | 10.125 | tăng trưởng tính năng                    |
| `2026.3.31` |      43,3MB |              182,6MB | 21.037 | đỉnh kích thước gói           |
| `2026.4.29` |      22,9MB |               74,6MB |  9.309 | thể hiện rõ việc tinh gọn gói           |
| `2026.5.12` |      23,4MB |               80,1MB | 12.035 | tách Plugin bên ngoài quy mô lớn       |
| `2026.5.22` |      17,2MB |               76,9MB | 12.386 | tài liệu/tài nguyên bị loại khỏi gói |
| `2026.5.27` |      17,8MB |               79,0MB | 12.509 | gói ổn định trước           |
| `2026.5.28` |      17,9MB |               81,0MB |  9.082 | gói ổn định mới nhất             |

`2026.5.12` là cột mốc tách Plugin dễ thấy trong nhật ký thay đổi:
Amazon Bedrock, Bedrock Mantle, Slack, môi trường cách ly OpenShell, Anthropic Vertex,
Matrix và WhatsApp đã được chuyển ra khỏi đường dẫn phụ thuộc lõi để các nhánh phụ thuộc
của chúng được cài đặt cùng các Plugin đó thay vì trong mọi bản cài đặt lõi.

## Tóm tắt lượt chạy tác tử Kova

Dòng ổn định tháng 4 chứa hai câu chuyện khác nhau. Đầu tháng 4 chậm
nhưng vẫn có thể nhận diện. Cuối tháng 4 trở thành một vực hồi quy. `v2026.5.2` là thời điểm
luồng nhà cung cấp mô phỏng lần đầu giảm xuống khoảng 3–5 giây và bắt đầu đạt yêu cầu
ổn định trong đợt rà soát được cung cấp.

Bối cảnh đã công bố trước đó:

| Bản phát hành      | Kova | Lượt chạy nguội | Lượt chạy ấm | RSS đỉnh của tác tử |
| ------------ | ---- | --------------: | -----------: | ------------------: |
| `v2026.4.10` | THẤT BẠI |  11.031ms |   7.962ms |        679,0MB |
| `v2026.4.12` | THẤT BẠI |  11.965ms |   8.289ms |        713,5MB |
| `v2026.4.14` | THẤT BẠI |   9.819ms |   7.458ms |        686,2MB |
| `v2026.4.20` | THẤT BẠI |  22.314ms |  18.811ms |        810,8MB |
| `v2026.4.22` | THẤT BẠI |   9.630ms |   7.459ms |        743,0MB |

Đợt rà soát được cung cấp:

| Bản phát hành             | Kova | Lượt chạy nguội | Lượt chạy ấm | RSS đỉnh của tác tử |
| ------------------- | ---- | --------------: | -----------: | ------------------: |
| `v2026.4.23`        | THẤT BẠI |  47.847ms |   8.010ms |      1.082,7MB |
| `v2026.4.24`        | THẤT BẠI |  48.264ms |  25.483ms |        996,0MB |
| `v2026.4.25`        | THẤT BẠI |  81.080ms |  59.172ms |      1.113,9MB |
| `v2026.4.26`        | THẤT BẠI |  76.771ms |  54.941ms |      1.140,8MB |
| `v2026.4.27`        | THẤT BẠI |  60.902ms |  33.699ms |      1.156,0MB |
| `v2026.4.29`        | THẤT BẠI |  94.031ms |  57.334ms |      3.613,7MB |
| `v2026.5.2`         | ĐẠT |   3.897ms |   3.610ms |        613,7MB |
| `v2026.5.7`         | ĐẠT |   3.923ms |   3.693ms |        654,1MB |
| `v2026.5.12`        | ĐẠT |   7.248ms |   6.629ms |        834,8MB |
| `v2026.5.18`        | ĐẠT |   3.301ms |   2.913ms |        630,3MB |
| `v2026.5.20`        | ĐẠT |   3.413ms |   2.952ms |        643,2MB |
| `v2026.5.22`        | ĐẠT |   4.494ms |   4.093ms |        654,3MB |
| `v2026.5.26`        | ĐẠT |   2.626ms |   2.282ms |        660,4MB |
| `v2026.5.27-beta.1` | ĐẠT |   2.575ms |   2.217ms |        635,3MB |
| `v2026.5.27`        | ĐẠT |   2.231ms |   2.226ms |        649,0MB |
| `v2026.5.28`        | ĐẠT |   1.908ms |   1.870ms |        581,0MB |

## Các phép dò mã nguồn

Các phép dò mã nguồn đã được bỏ qua đối với 17 tham chiếu cũ thành công vì các cây mã nguồn
đó chưa có những điểm vào cần thiết cho phép dò. Các chỉ số lượt chạy tác tử vẫn
tồn tại cho những tham chiếu đó.

Các điểm dò mã nguồn tiêu biểu:

| Bản phát hành             | p50 `readyz` mặc định | p50 `readyz` với 50 Plugin | p50 tình trạng CLI | RSS tối đa của Plugin |
| ------------------- | ---------------------: | --------------------------: | --------------------: | --------------------: |
| `v2026.4.29`        |              2.819ms |                 2.618ms |        1.679ms |        389,0MB |
| `v2026.5.2`         |              2.324ms |                 2.013ms |        1.384ms |        377,2MB |
| `v2026.5.7`         |              1.649ms |                 1.540ms |        1.175ms |        387,6MB |
| `v2026.5.18`        |              1.942ms |                 1.927ms |          607ms |        426,5MB |
| `v2026.5.20`        |              1.966ms |                 1.987ms |          621ms |        455,0MB |
| `v2026.5.22`        |              2.081ms |                 1.884ms |        5.095ms |        444,2MB |
| `v2026.5.26`        |              1.546ms |                 1.634ms |          656ms |        400,4MB |
| `v2026.5.27-beta.1` |              1.462ms |                 1.548ms |          548ms |        394,0MB |
| `v2026.5.27`        |              1.491ms |                 1.571ms |          553ms |        401,5MB |
| `v2026.5.28`        |              1.457ms |                 1.474ms |          623ms |        386,1MB |

Mức tăng đột biến về tình trạng CLI của `v2026.5.22` thể hiện rõ trong bảng này dù
luồng lượt chạy tác tử vẫn đạt yêu cầu. Hãy giữ lại các phép dò mã nguồn khi điều tra
các hồi quy CLI hoặc Gateway có mục tiêu cụ thể.

## Kiểm tra dung lượng cài đặt

Các mẫu phụ thuộc sử dụng một bản phát hành ổn định mỗi tháng, cộng thêm sự kiện
đưa shrinkwrap vào ở `2026.5.22` và bản phát hành `2026.5.28` mới nhất.

| Mốc                | Phụ thuộc đã cài đặt | Cài đặt mới | Gói OpenClaw | `openclaw/node_modules` lồng nhau | Shrinkwrap gốc | Hành vi cài đặt Canvas                         |
| ------------------ | --------------------: | ------------: | ------------: | ---------------------------------: | -------------- | ---------------------------------------------- |
| Tháng 1 `2026.1.30` |                   605 |       438.4MB |        45.8MB |                              2.4MB | không          | trình bao cấp cao nhất + `darwin-arm64`        |
| Tháng 2 `2026.2.26` |                   645 |       575.7MB |       110.1MB |                              3.5MB | không          | trình bao cấp cao nhất + `darwin-arm64`        |
| Tháng 3 `2026.3.31` |                   438 |       584.1MB |       234.8MB |                                0MB | không          | trình bao cấp cao nhất + `darwin-arm64`        |
| Tháng 4 `2026.4.29` |                   392 |       335.0MB |        97.4MB |                                0MB | không          | không cài đặt gì                               |
| `2026.5.22`         |                   401 |     1,020.6MB |     1,020.4MB |                            911.8MB | có             | lồng nhau: cả 12 gói `@napi-rs/canvas`         |
| Tháng 5 `2026.5.26` |                   371 |       767.5MB |       767.4MB |                            656.4MB | có             | lồng nhau: cả 12 gói `@napi-rs/canvas`         |
| `2026.5.27`         |                   371 |      767.1MiB |      766.9MiB |                           656.1MiB | có             | lồng nhau: cả 12 gói `@napi-rs/canvas`         |
| Mới nhất `2026.5.28` |                   300 |      361.7MiB |      361.6MiB |                           259.7MiB | có             | không cài đặt gì                               |

### Ranh giới shrinkwrap

`2026.5.20` được phát hành không có shrinkwrap gốc và không có cây phụ thuộc OpenClaw
lồng nhau lớn. `2026.5.22` đưa shrinkwrap gốc vào và cài đặt 911.8MB
trong `openclaw/node_modules` lồng nhau. `2026.5.28` vẫn giữ shrinkwrap và vẫn
cài đặt 259.7MiB trong `openclaw/node_modules` lồng nhau, nhưng không còn cài đặt
bất kỳ gói `@napi-rs/canvas` nào trong đợt kiểm tra cài đặt mới cục bộ.

Việc kiểm tra tarball đã xuất bản xác nhận ranh giới này:

| Phiên bản   | Đã xuất bản ổn định? | `npm-shrinkwrap.json` gốc | Ghi chú                                      |
| ----------- | --------------------- | ------------------------- | -------------------------------------------- |
| `2026.5.20` | có                    | không                     | bản phát hành ổn định cuối trước shrinkwrap  |
| `2026.5.21` | không                 | không áp dụng              | không có bản phát hành npm ổn định           |
| `2026.5.22` | có                    | có                        | đưa shrinkwrap vào                           |
| `2026.5.23` | không                 | không áp dụng              | không có bản phát hành npm ổn định           |
| `2026.5.24` | không                 | không áp dụng              | không có bản phát hành npm ổn định           |
| `2026.5.25` | không                 | không áp dụng              | không có bản phát hành npm ổn định           |
| `2026.5.26` | có                    | có                        | cây phụ thuộc lồng nhau vẫn còn               |
| `2026.5.27` | có                    | có                        | cây phụ thuộc lồng nhau vẫn còn               |
| `2026.5.28` | có                    | có                        | cây phụ thuộc lồng nhau nhỏ hơn nhiều         |

Điểm phân biệt quan trọng: **bản thân shrinkwrap không phải là vấn đề**.
`v2026.5.28` vẫn phát hành kèm shrinkwrap gốc. Vấn đề nằm ở cấu trúc gói
khiến npm hiện thực hóa một cây phụ thuộc OpenClaw lồng nhau lớn và cả 12
gói nền tảng `@napi-rs/canvas`. Cây lồng nhau nhỏ hơn trong `v2026.5.28`,
và nhóm gói nền tảng Canvas không còn xuất hiện trong đợt kiểm tra cục bộ.

Để xem phần giải thích bằng ngôn ngữ thông thường về shrinkwrap và các bước kiểm tra gói
ở cấp độ người bảo trì, hãy xem [npm shrinkwrap](/vi/gateway/security/shrinkwrap).

## Diễn giải về chuỗi cung ứng

Số lượng phụ thuộc là một chỉ số bảo mật vận hành, không chỉ là chỉ số
kích thước cài đặt. Mỗi gói đều mở rộng tập hợp người bảo trì, tarball, bản cập nhật
bắc cầu, tệp nhị phân gốc tùy chọn và hành vi trong lúc cài đặt mà người vận hành
phải tin cậy.

Hướng dọn dẹp là:

- giữ các khả năng nặng và tùy chọn bên ngoài bản cài đặt lõi mặc định
- để các gói Plugin sở hữu đồ thị phụ thuộc thời gian chạy của chúng
- tránh việc trình quản lý gói sửa chữa trong thời gian chạy khi Gateway khởi động
- duy trì cài đặt xác định mà không khiến các gói gốc cho mọi nền tảng
  được hiện thực hóa
- tiếp tục vô hiệu hóa các tập lệnh cài đặt trong các quy trình chấp nhận và đo lường gói
- phát hiện cây phụ thuộc lồng nhau và sự bùng nổ phụ thuộc gốc tùy chọn trước khi
  xuất bản

Tài liệu liên quan:

- [Phân giải phụ thuộc của Plugin](/vi/plugins/dependency-resolution)
- [Danh mục Plugin](/vi/plugins/plugin-inventory)
- [Xác thực đầy đủ bản phát hành](/vi/reference/full-release-validation)
