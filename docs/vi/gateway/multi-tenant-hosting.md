---
doc-schema-version: 1
read_when:
    - Bạn đang lưu trữ OpenClaw cho nhiều người dùng hoặc tổ chức
    - Bạn cần chọn một ranh giới cô lập cho khối lượng công việc của từng đối tượng thuê
summary: Lưu trữ nhiều miền tin cậy của đối tượng thuê dưới dạng một cell Gateway OpenClaw cô lập cho mỗi đối tượng thuê
title: Lưu trữ đa đối tượng thuê
x-i18n:
    generated_at: "2026-07-16T14:31:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 383d32331b45d40db6fb4ff8242dd9a3cf8898a3ccab19f0372cd06bbd83fc05
    source_path: gateway/multi-tenant-hosting.md
    workflow: 16
---

# Lưu trữ đa đối tượng thuê

Mô hình bảo mật mặc định của OpenClaw là một ranh giới nhà vận hành đáng tin cậy cho mỗi Gateway, chứ không phải sự cô lập giữa các đối tượng thuê không tin cậy bên trong một Gateway dùng chung. Vì vậy, việc lưu trữ người dùng hoặc tổ chức không cùng chung một ranh giới tin cậy đòi hỏi phải chạy một phiên bản OpenClaw hoàn chỉnh riêng biệt cho từng đối tượng thuê.

`openclaw fleet` gọi mỗi phiên bản được cô lập là một **ô**. Một ô là một Gateway đầy đủ trong vùng chứa được tăng cường bảo mật, có trạng thái, thông tin xác thực, không gian làm việc, tài khoản kênh, token và cổng máy chủ chỉ dành cho loopback riêng.

Fleet đang ở trạng thái **thử nghiệm**: các lệnh, cờ và hồ sơ vùng chứa của Fleet có thể thay đổi giữa các bản phát hành mà không có giai đoạn ngừng hỗ trợ.

Fleet được kiểm thử trên máy chủ Linux và macOS. Máy chủ Windows hiện chưa được kiểm thử.

## Tại sao mỗi đối tượng thuê cần một ô

Một nhà vận hành đã xác thực bên trong Gateway có vai trò đáng tin cậy trong mặt phẳng điều khiển. ID phiên chọn định tuyến; chúng không cấp quyền cho đối tượng thuê này đối với đối tượng thuê khác. Việc tạo sandbox cho tác nhân có thể giảm tác động của nội dung không đáng tin cậy và hoạt động thực thi công cụ, nhưng không biến một Gateway dùng chung thành ranh giới phân quyền giữa các đối tượng thuê.

Sử dụng một ô cho mỗi đối tượng thuê để mỗi miền tin cậy có một tiến trình Gateway, vùng chứa, cây trạng thái bền vững và thông tin xác thực Gateway riêng biệt. Cách này tuân theo [mô hình bảo mật Gateway](/vi/gateway/security): không đặt những người dùng không tin cậy lẫn nhau trong cùng một tiến trình OpenClaw hoặc cùng một người dùng hệ điều hành.

## Kiến trúc

CLI Fleet là trình giám sát vòng đời phía máy chủ. Công cụ này ghi lại các ô trong cơ sở dữ liệu trạng thái OpenClaw và yêu cầu môi trường chạy Docker hoặc Podman cục bộ tạo, kiểm tra, khởi động, dừng, thay thế và xóa các vùng chứa của chúng. Các điểm cuối môi trường chạy từ xa không được hỗ trợ vì đường dẫn liên kết và URL loopback của Fleet thuộc về máy chủ cục bộ. Fleet không ủy nhiệm thông điệp của đối tượng thuê và không thêm đường dẫn dữ liệu cấp ứng dụng dùng chung giữa các ô.

Mỗi ô chạy image `ghcr.io/openclaw/openclaw` chính thức trên mạng cầu nối do người dùng định nghĩa riêng. Các cầu nối riêng biệt ngăn lưu lượng truy cập trực tiếp qua IP vùng chứa giữa các ô, đồng thời vẫn duy trì quyền truy cập NAT đi ra cho nhà cung cấp và kênh. Lưu lượng đi ra mặc định không bị hạn chế. Các ô Podman có thể sử dụng `--network internal` để chặn lưu lượng đi ra trong khi vẫn duy trì cổng Gateway loopback đã công bố. Mạng nội bộ Docker làm hỏng cổng đã công bố đó, vì vậy Fleet từ chối tổ hợp này; thay vào đó, hãy thực thi chính sách lưu lượng đi ra của Docker bằng các quy tắc tường lửa máy chủ như chuỗi `DOCKER-USER`. Gateway của ô lắng nghe trên cổng `18789` bên trong vùng chứa, còn môi trường chạy chỉ công bố cổng đó đến `127.0.0.1:<allocated-port>` trên máy chủ. Khi cần truy cập từ xa, nhà vận hành có thể đặt proxy ngược đã được phê duyệt, đường hầm SSH hoặc tailnet phía trước điểm cuối loopback đó.

Trạng thái Gateway bền vững lấy từ `<state-dir>/fleet/cells/<tenant>/` và được gắn kết tại `/home/node/.openclaw`. Khóa mã hóa hồ sơ xác thực lấy từ đường dẫn máy chủ `<state-dir>/fleet/auth-profile-secrets/<tenant>/` riêng biệt và được gắn kết tại `/home/node/.config/openclaw`, khớp với [bố cục lưu trữ bền vững của Docker](/vi/install/docker#storage-and-persistence) chính thức. Khóa không nằm lồng bên dưới điểm gắn kết trạng thái thông thường. Tài khoản kênh của từng đối tượng thuê kết thúc bên trong ô sở hữu chúng; Fleet không cung cấp tài khoản kênh dùng chung hoặc bộ định tuyến thông điệp đến.

Image chính thức mặc định sử dụng người dùng không phải root `node` với UID 1000. Fleet sử dụng ánh xạ người dùng tương thích với máy chủ để các điểm gắn kết liên kết riêng tư vẫn có thể ghi: Podman sử dụng `keep-id`, Docker chạy với quyền root sử dụng danh tính không phải root đã gọi lệnh, còn Docker không root ánh xạ root trong vùng chứa đến người dùng daemon không đặc quyền. Docker và Podman áp dụng việc gán lại nhãn `:Z` riêng tư khi SELinux trên máy chủ đang hoạt động. Hồ sơ vùng chứa tránh các tính năng máy chủ có đặc quyền và thân thiện với chế độ không root, nhưng hoạt động không root là lựa chọn và điều kiện tiên quyết của môi trường chạy trên máy chủ, không phải tính năng mà Fleet tự động bật.

## Ranh giới tin cậy

Mô hình đa đối tượng thuê bảo vệ các đối tượng thuê khỏi nhau. Nhà vận hành Fleet và máy chủ được mọi đối tượng thuê tin cậy. Khả năng chống lại máy chủ bị xâm nhập không phải là mục tiêu.

Điều này có nghĩa là quản trị viên máy chủ có thể kiểm tra cấu hình và môi trường vùng chứa, đọc dữ liệu ô được gắn kết, thay thế image hoặc truy cập vào vùng chứa. Token Gateway và các giá trị được truyền bằng `--env` hiển thị với quản trị viên thông qua hoạt động kiểm tra Docker hoặc Podman. Vì vậy, hãy sử dụng các biện pháp kiểm soát máy chủ, chính sách truy cập quản trị, giám sát, sao lưu và trình quản lý bí mật đã được phê duyệt.

Cấu hình cơ sở ngăn việc vô tình phơi bày mạng bằng ký tự đại diện và loại bỏ các cơ chế leo thang đặc quyền vùng chứa phổ biến, nhưng không làm cho máy chủ không đáng tin cậy trở nên an toàn.

## Các cấp độ cô lập

Chọn ranh giới phù hợp với các đối tượng thuê mà bạn lưu trữ:

1. **Cấu hình cơ sở vùng chứa được tăng cường bảo mật.** Fleet loại bỏ mọi capability của Linux, bật `no-new-privileges`, áp dụng giới hạn PID, bộ nhớ, CPU và giới hạn đĩa tùy chọn cho lớp có thể ghi, sử dụng các điểm gắn kết bền vững riêng biệt và mạng riêng cho từng ô, đồng thời chỉ công bố đến loopback của máy chủ. Mạng cầu nối không hạn chế lưu lượng đi ra; hãy sử dụng `--network internal` của Podman hoặc chính sách tường lửa máy chủ Docker khi một ô không được phép khởi tạo kết nối đi ra. Đây là hồ sơ mặc định dành cho các đối tượng thuê tin cậy nhà vận hành và máy chủ.
2. **Khả năng cô lập vùng chứa hoặc máy ảo mạnh hơn.** Đối với khối lượng công việc có rủi ro cao hơn, hãy cấu hình Docker hoặc Podman để sử dụng môi trường chạy cô lập OCI mạnh hơn như gVisor hoặc Kata Containers, hoặc đặt các ô trong microVM. Đây là cấu hình môi trường chạy hoặc cơ sở hạ tầng; tùy chọn `--runtime docker|podman` của Fleet chọn CLI vùng chứa, không chọn phần phụ trợ cô lập OCI. Xem [các môi trường chạy vùng chứa thay thế](https://docs.docker.com/engine/daemon/alternative-runtimes/) của Docker và [hướng dẫn môi trường chạy máy ảo Docker](/vi/install/docker-vm-runtime).
3. **Máy riêng biệt cho các đối tượng thuê không tin cậy.** Không đặt các đối tượng thuê không tin cậy trong cùng một tiến trình OpenClaw hoặc cùng một người dùng hệ điều hành. Khi các đối tượng thuê không tin tưởng cùng một nhà vận hành máy chủ hoặc cần ranh giới quản trị mạnh hơn, hãy sử dụng máy ảo hoặc máy chủ vật lý riêng biệt với cơ chế quản trị môi trường chạy riêng.

Không cấp độ nào trong thang này thay đổi mô hình tin cậy ứng dụng OpenClaw: một Gateway vẫn là một miền nhà vận hành đáng tin cậy.

## Bắt đầu nhanh

Tạo một ô. Lệnh chỉ in token Gateway được tạo một lần, vì vậy hãy lưu token đó ngay lập tức:

```bash
openclaw fleet create acme
```

Mở URL `http://127.0.0.1:<port>` được báo cáo trên máy chủ Fleet, xác thực bằng token của đối tượng thuê đó, rồi cấu hình thông tin xác thực của nhà cung cấp và tài khoản kênh bên trong ô.

Kiểm tra trạng thái vùng chứa và khả năng hoạt động của Gateway:

```bash
openclaw fleet status acme
```

Nâng cấp trong khi vẫn giữ nguyên cổng máy chủ, dữ liệu được gắn kết, hồ sơ tài nguyên, môi trường do người dùng cung cấp và token Gateway:

```bash
openclaw fleet upgrade acme
```

Xóa vùng chứa và hàng trong sổ đăng ký nhưng vẫn giữ lại dữ liệu của đối tượng thuê:

```bash
openclaw fleet rm acme --force
```

Để xóa cả dữ liệu bền vững của đối tượng thuê, hãy thêm `--purge-data`. Việc xóa sạch yêu cầu `--force`, không thể hoàn tác và thực hiện kiểm tra giới hạn đường dẫn đã phân giải trước khi xóa bất kỳ nội dung nào:

```bash
openclaw fleet rm acme --purge-data --force
```

Xem [tài liệu tham khảo CLI `openclaw fleet`](/cli/fleet) để biết mọi lệnh và tùy chọn.

## Phạm vi hiện tại

Fleet không cung cấp các bề mặt sau:

- Tài khoản kênh dùng chung hoặc bộ định tuyến lưu lượng vào dùng chung
- Các tiến trình máy chủ được tinh gọn cho từng đối tượng thuê thay vì các phiên bản OpenClaw hoàn chỉnh
- Các máy chủ ô từ xa do một trình giám sát quản lý
- Cổng tự phục vụ cho đối tượng thuê, mặt phẳng thanh toán hoặc giao diện người dùng quản trị được ủy quyền

Các khả năng này cần hợp đồng rõ ràng về danh tính, định tuyến, phân quyền và miền lỗi. Không mô phỏng chúng bằng cách chia sẻ một Gateway hoặc thông tin xác thực của Gateway đó giữa các đối tượng thuê. Fleet là trình giám sát vòng đời trên một máy chủ; các đội Fleet trên nhiều máy, được quản trị bằng danh tính, cần một lớp mặt phẳng điều khiển riêng biệt.

## Liên quan

- [`openclaw fleet`](/cli/fleet)
- [Bảo mật Gateway](/vi/gateway/security)
- [Nhiều Gateway](/vi/gateway/multiple-gateways)
- [Docker](/vi/install/docker)
- [Podman](/vi/install/podman)
