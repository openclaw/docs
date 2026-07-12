---
read_when:
    - Đánh giá mức độ bảo mật hoặc các kịch bản đe dọa
    - Làm việc về các tính năng bảo mật hoặc phản hồi kiểm toán
summary: Mô hình mối đe dọa của OpenClaw được ánh xạ tới khung MITRE ATLAS
title: Mô hình mối đe dọa (MITRE ATLAS)
x-i18n:
    generated_at: "2026-07-12T08:26:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c88ffdef850bd2afaf835baab2555304c914a0be1df6b6b9109e0f55d1448392
    source_path: security/THREAT-MODEL-ATLAS.md
    workflow: 16
---

**Phiên bản:** 1.0-bản nháp | **Khung:** [MITRE ATLAS](https://atlas.mitre.org/) (Bối cảnh mối đe dọa đối nghịch dành cho hệ thống AI) + sơ đồ luồng dữ liệu

Mô hình mối đe dọa này ghi lại các mối đe dọa đối nghịch đối với nền tảng tác nhân AI OpenClaw và chợ Skills ClawHub. Đây là tài liệu được cộng đồng OpenClaw liên tục duy trì và cập nhật. Xem [Đóng góp cho mô hình mối đe dọa](/vi/security/CONTRIBUTING-THREAT-MODEL) để biết cách báo cáo mối đe dọa mới, đề xuất chuỗi tấn công hoặc đề xuất biện pháp giảm thiểu.

**Các tài nguyên ATLAS chính:** [Kỹ thuật](https://atlas.mitre.org/techniques/) | [Chiến thuật](https://atlas.mitre.org/tactics/) | [Nghiên cứu tình huống](https://atlas.mitre.org/studies/) | [ATLAS GitHub](https://github.com/mitre-atlas/atlas-data) | [Đóng góp cho ATLAS](https://atlas.mitre.org/resources/contribute)

---

## 1. Phạm vi

| Thành phần                   | Bao gồm     | Ghi chú                                                    |
| ---------------------------- | ----------- | ---------------------------------------------------------- |
| Môi trường thực thi tác nhân OpenClaw | Có | Thực thi tác nhân cốt lõi, lệnh gọi công cụ, phiên          |
| Gateway                      | Có          | Xác thực, định tuyến, tích hợp kênh                         |
| Tích hợp kênh                | Có          | WhatsApp, Telegram, Discord, Signal, Slack, v.v.            |
| Chợ ClawHub                  | Có          | Phát hành, kiểm duyệt và phân phối Skills                   |
| Máy chủ MCP                  | Có          | Nhà cung cấp công cụ bên ngoài                              |
| Thiết bị người dùng          | Một phần    | Ứng dụng di động, ứng dụng máy tính                         |

Các báo cáo ngoài phạm vi và mẫu dương tính giả (phơi bày trên internet công cộng, chuỗi chỉ có chèn lệnh nhắc mà không vượt qua ranh giới, các bên vận hành không tin cậy lẫn nhau dùng chung một máy chủ Gateway và những trường hợp khác) được liệt kê trong [`SECURITY.md`](https://github.com/openclaw/openclaw/blob/main/SECURITY.md); tệp đó là nguồn thông tin chính xác hiện hành về phạm vi báo cáo lỗ hổng, không phải trang này.

## 2. Kiến trúc hệ thống

### 2.1 Ranh giới tin cậy

```text
┌─────────────────────────────────────────────────────────────────┐
│                    VÙNG KHÔNG TIN CẬY                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │  WhatsApp   │  │  Telegram   │  │   Discord   │  ...         │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘              │
│         │                │                │                      │
└─────────┼────────────────┼────────────────┼──────────────────────┘
          │                │                │
          ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────────┐
│                 RANH GIỚI TIN CẬY 1: Truy cập kênh              │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                      GATEWAY                              │   │
│  │  • Ghép cặp thiết bị (TTL ghép cặp DM 1 giờ / Node 5 phút)│   │
│  │  • Xác thực AllowFrom / danh sách cho phép                │   │
│  │  • Xác thực bằng token / mật khẩu / Tailscale             │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                 RANH GIỚI TIN CẬY 2: Cô lập phiên               │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   CÁC PHIÊN TÁC NHÂN                      │   │
│  │  • Khóa phiên = agent:channel:peer                        │   │
│  │  • Chính sách công cụ cho từng tác nhân                   │   │
│  │  • Ghi nhật ký bản chép lời                               │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                 RANH GIỚI TIN CẬY 3: Thực thi công cụ           │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                  HỘP CÁT THỰC THI                         │   │
│  │  • Hộp cát Docker (mặc định) hoặc máy chủ (phê duyệt exec)│   │
│  │  • Thực thi từ xa trên Node                               │   │
│  │  • Bảo vệ SSRF (ghim DNS + chặn IP)                       │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                 RANH GIỚI TIN CẬY 4: Nội dung bên ngoài         │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              URL / EMAIL / WEBHOOK ĐÃ TẢI                 │   │
│  │  • Bao bọc nội dung bên ngoài (thẻ XML ranh giới ngẫu nhiên)│  │
│  │  • Chèn thông báo bảo mật                                 │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                 RANH GIỚI TIN CẬY 5: Chuỗi cung ứng             │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                      CLAWHUB                              │   │
│  │  • Phát hành Skills (semver, bắt buộc có SKILL.md)        │   │
│  │  • Quét kiểm duyệt bằng mẫu tĩnh + phân tích gần với AST  │   │
│  │  • Đánh giá rủi ro tác nhân bằng LLM + quét VirusTotal    │   │
│  │  • Xác minh tuổi tài khoản GitHub (14 ngày)               │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Luồng dữ liệu

| Luồng | Nguồn   | Đích       | Dữ liệu                  | Biện pháp bảo vệ             |
| ----- | ------- | ---------- | ------------------------ | ---------------------------- |
| F1    | Kênh    | Gateway    | Tin nhắn người dùng      | TLS, AllowFrom               |
| F2    | Gateway | Tác nhân   | Tin nhắn đã định tuyến   | Cô lập phiên                 |
| F3    | Tác nhân| Công cụ    | Lệnh gọi công cụ         | Thực thi chính sách          |
| F4    | Tác nhân| Bên ngoài  | Yêu cầu `web_fetch`      | Chặn SSRF                    |
| F5    | ClawHub | Tác nhân   | Mã Skills                | Kiểm duyệt, quét             |
| F6    | Tác nhân| Kênh       | Phản hồi                 | Lọc đầu ra                   |

---

## 3. Phân tích mối đe dọa theo chiến thuật ATLAS

### 3.1 Trinh sát (AML.TA0002)

#### T-RECON-001: Phát hiện điểm cuối của tác nhân

| Thuộc tính                    | Giá trị                                                                    |
| ----------------------------- | -------------------------------------------------------------------------- |
| **ID ATLAS**                  | AML.T0006 - Quét chủ động                                                  |
| **Mô tả**                     | Kẻ tấn công quét tìm các điểm cuối Gateway OpenClaw bị phơi bày            |
| **Vector tấn công**           | Quét mạng, truy vấn Shodan, liệt kê DNS                                    |
| **Thành phần bị ảnh hưởng**   | Gateway, các điểm cuối API bị phơi bày                                     |
| **Biện pháp giảm thiểu hiện tại** | Tùy chọn xác thực Tailscale, mặc định liên kết với local loopback       |
| **Rủi ro còn lại**            | Trung bình - có thể phát hiện các Gateway công khai                        |
| **Khuyến nghị**               | Ghi tài liệu triển khai an toàn, thêm giới hạn tốc độ cho các điểm cuối phát hiện |

#### T-RECON-002: Thăm dò tích hợp kênh

| Thuộc tính                    | Giá trị                                                               |
| ----------------------------- | --------------------------------------------------------------------- |
| **ID ATLAS**                  | AML.T0006 - Quét chủ động                                             |
| **Mô tả**                     | Kẻ tấn công thăm dò các kênh nhắn tin để xác định tài khoản do AI quản lý |
| **Vector tấn công**           | Gửi tin nhắn thử nghiệm, quan sát mẫu phản hồi                         |
| **Thành phần bị ảnh hưởng**   | Tất cả các tích hợp kênh                                               |
| **Biện pháp giảm thiểu hiện tại** | Không có biện pháp cụ thể                                          |
| **Rủi ro còn lại**            | Thấp - chỉ riêng việc phát hiện mang lại giá trị hạn chế               |
| **Khuyến nghị**               | Cân nhắc ngẫu nhiên hóa thời gian phản hồi                             |

---

### 3.2 Truy cập ban đầu (AML.TA0004)

#### T-ACCESS-001: Chặn bắt mã ghép cặp

| Thuộc tính                 | Giá trị                                                                                                                                         |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| **ATLAS ID**               | AML.T0040 - Quyền truy cập API suy luận mô hình AI                                                                                              |
| **Mô tả**                  | Kẻ tấn công chặn mã ghép nối trong khoảng thời gian ghép nối (1 giờ đối với ghép nối qua DM/chung, 5 phút đối với ghép nối Node)                 |
| **Vectơ tấn công**         | Nhìn trộm qua vai, nghe lén mạng, kỹ nghệ xã hội                                                                                                |
| **Thành phần bị ảnh hưởng** | Hệ thống ghép nối thiết bị                                                                                                                       |
| **Biện pháp giảm thiểu hiện tại** | TTL 1 giờ (ghép nối qua DM/chung), TTL 5 phút (ghép nối Node); mã được gửi qua kênh hiện có                                                |
| **Rủi ro còn lại**         | Trung bình - khoảng thời gian ghép nối có thể bị khai thác                                                                                       |
| **Khuyến nghị**            | Rút ngắn khoảng thời gian ghép nối, thêm bước xác nhận                                                                                           |

#### T-ACCESS-002: Giả mạo AllowFrom

| Thuộc tính                 | Giá trị                                                                                     |
| -------------------------- | ------------------------------------------------------------------------------------------- |
| **ATLAS ID**               | AML.T0040 - Quyền truy cập API suy luận mô hình AI                                          |
| **Mô tả**                  | Kẻ tấn công giả mạo danh tính người gửi được phép trên một kênh                             |
| **Vectơ tấn công**         | Tùy thuộc vào kênh - giả mạo số điện thoại, mạo danh tên người dùng                         |
| **Thành phần bị ảnh hưởng** | Hoạt động xác thực AllowFrom theo từng kênh                                                  |
| **Biện pháp giảm thiểu hiện tại** | Xác minh danh tính dành riêng cho từng kênh                                           |
| **Rủi ro còn lại**         | Trung bình - một số kênh vẫn dễ bị giả mạo                                                   |
| **Khuyến nghị**            | Ghi lại rủi ro dành riêng cho từng kênh, thêm xác minh bằng mật mã khi có thể                |

#### T-ACCESS-003: Đánh cắp mã thông báo

| Thuộc tính                 | Giá trị                                                                         |
| -------------------------- | ------------------------------------------------------------------------------- |
| **ATLAS ID**               | AML.T0040 - Quyền truy cập API suy luận mô hình AI                              |
| **Mô tả**                  | Kẻ tấn công đánh cắp mã thông báo xác thực từ các tệp cấu hình/thông tin xác thực |
| **Vectơ tấn công**         | Phần mềm độc hại, truy cập thiết bị trái phép, lộ bản sao lưu cấu hình           |
| **Thành phần bị ảnh hưởng** | Kho lưu trữ thông tin xác thực của kênh/nhà cung cấp, kho lưu trữ cấu hình       |
| **Biện pháp giảm thiểu hiện tại** | Quyền truy cập tệp                                                       |
| **Rủi ro còn lại**         | Cao - mã thông báo được lưu dưới dạng văn bản thuần túy trên đĩa                 |
| **Khuyến nghị**            | Triển khai mã hóa mã thông báo khi lưu trữ, bổ sung cơ chế luân chuyển mã thông báo |

---

### 3.3 Thực thi (AML.TA0005)

#### T-EXEC-001: Tiêm câu lệnh trực tiếp

| Thuộc tính                 | Giá trị                                                                                                                                                         |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ATLAS ID**               | AML.T0051.000 - Tiêm câu lệnh LLM: Trực tiếp                                                                                                                    |
| **Mô tả**                  | Kẻ tấn công gửi các câu lệnh được tạo có chủ đích để thao túng hành vi của tác tử                                                                                |
| **Vectơ tấn công**         | Tin nhắn trên kênh chứa các chỉ dẫn đối kháng                                                                                                                    |
| **Thành phần bị ảnh hưởng** | LLM của tác tử, tất cả các bề mặt đầu vào                                                                                                                        |
| **Biện pháp giảm thiểu hiện tại** | Phát hiện mẫu, bao bọc nội dung bên ngoài; được coi là ngoài phạm vi báo cáo lỗ hổng nếu không có hành vi vượt qua ranh giới (xem `SECURITY.md`)            |
| **Rủi ro còn lại**         | Nghiêm trọng - chỉ phát hiện, không chặn; các cuộc tấn công tinh vi có thể vượt qua                                                                               |
| **Khuyến nghị**            | Xác thực đầu ra và yêu cầu người dùng xác nhận đối với các hành động nhạy cảm, được phân lớp bên trên cơ chế phát hiện hiện có                                   |

#### T-EXEC-002: Tiêm câu lệnh gián tiếp

| Thuộc tính                 | Giá trị                                                                                                                                |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| **ATLAS ID**               | AML.T0051.001 - Tiêm câu lệnh LLM: Gián tiếp                                                                                           |
| **Mô tả**                  | Kẻ tấn công nhúng chỉ dẫn độc hại vào nội dung được truy xuất                                                                           |
| **Vectơ tấn công**         | URL độc hại, email bị đầu độc, webhook bị xâm phạm                                                                                       |
| **Thành phần bị ảnh hưởng** | `web_fetch`, quá trình nhập email, nguồn dữ liệu bên ngoài                                                                               |
| **Biện pháp giảm thiểu hiện tại** | Bao bọc nội dung bằng các dấu phân cách kiểu XML có ranh giới ngẫu nhiên, chuẩn hóa ký tự đồng hình/mã thông báo đặc biệt và thông báo bảo mật |
| **Rủi ro còn lại**         | Cao - LLM vẫn có thể bỏ qua các chỉ dẫn của lớp bao bọc                                                                                  |
| **Khuyến nghị**            | Tách riêng ngữ cảnh thực thi cho nội dung được bao bọc                                                                                   |

#### T-EXEC-003: Tiêm đối số công cụ

| Thuộc tính                 | Giá trị                                                               |
| -------------------------- | --------------------------------------------------------------------- |
| **ATLAS ID**               | AML.T0051.000 - Tiêm câu lệnh LLM: Trực tiếp                          |
| **Mô tả**                  | Kẻ tấn công thao túng các đối số công cụ thông qua việc tiêm câu lệnh |
| **Vectơ tấn công**         | Các câu lệnh được tạo có chủ đích nhằm tác động đến giá trị tham số công cụ |
| **Thành phần bị ảnh hưởng** | Tất cả các lệnh gọi công cụ                                            |
| **Biện pháp giảm thiểu hiện tại** | Yêu cầu phê duyệt thực thi đối với các lệnh nguy hiểm           |
| **Rủi ro còn lại**         | Cao - phụ thuộc vào phán đoán của người dùng                           |
| **Khuyến nghị**            | Xác thực đối số, tham số hóa các lệnh gọi công cụ                      |

#### T-EXEC-004: Vượt qua phê duyệt thực thi

| Thuộc tính                 | Giá trị                                                                                                                                                                                                   |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ATLAS ID**               | AML.T0043 - Tạo dữ liệu đối kháng                                                                                                                                                                         |
| **Mô tả**                  | Kẻ tấn công tạo các lệnh có thể vượt qua danh sách cho phép phê duyệt                                                                                                                                     |
| **Vectơ tấn công**         | Làm rối lệnh, khai thác bí danh, thao túng đường dẫn                                                                                                                                                       |
| **Thành phần bị ảnh hưởng** | `src/infra/exec-approvals*.ts`, danh sách lệnh cho phép                                                                                                                                                    |
| **Biện pháp giảm thiểu hiện tại** | Danh sách cho phép + chế độ hỏi, cùng với chuẩn hóa lệnh (gỡ lớp trình bao điều phối, phát hiện đánh giá nội tuyến, phân tích chuỗi lệnh shell)                                                       |
| **Rủi ro còn lại**         | Cao - chuẩn hóa thu hẹp nhưng không loại bỏ khả năng vượt qua bằng kỹ thuật làm rối; các phát hiện chỉ liên quan đến tính tương đương giữa các đường dẫn thực thi được coi là tăng cường bảo mật, không phải lỗ hổng (xem `SECURITY.md`) |
| **Khuyến nghị**            | Tiếp tục mở rộng phạm vi chuẩn hóa lệnh để đối phó với các kỹ thuật làm rối mới                                                                                                                           |

---

### 3.4 Duy trì quyền truy cập (AML.TA0006)

#### T-PERSIST-001: Cài đặt Skills độc hại

| Thuộc tính                 | Giá trị                                                                                                                             |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| **ATLAS ID**               | AML.T0010.001 - Xâm phạm chuỗi cung ứng: Phần mềm AI                                                                                |
| **Mô tả**                  | Kẻ tấn công xuất bản một Skill độc hại lên ClawHub                                                                                  |
| **Vectơ tấn công**         | Tạo tài khoản, xuất bản Skill có mã độc được ẩn giấu                                                                                |
| **Thành phần bị ảnh hưởng** | ClawHub, quá trình tải Skill, hoạt động thực thi của tác tử                                                                         |
| **Biện pháp giảm thiểu hiện tại** | Xác minh tuổi tài khoản GitHub, quét mẫu tĩnh/gần với AST, đánh giá rủi ro theo cơ chế tác tử dựa trên LLM, quét bằng VirusTotal |
| **Rủi ro còn lại**         | Cao - có các lớp phát hiện nhưng Skills vẫn chạy với đặc quyền của tác tử và không có cơ chế cô lập thực thi                         |
| **Khuyến nghị**            | Cô lập hoạt động thực thi Skill, mở rộng hoạt động đánh giá của cộng đồng                                                            |

#### T-PERSIST-002: Đầu độc bản cập nhật Skill

| Thuộc tính                 | Giá trị                                                                              |
| -------------------------- | ------------------------------------------------------------------------------------ |
| **ATLAS ID**               | AML.T0010.001 - Xâm phạm chuỗi cung ứng: Phần mềm AI                                 |
| **Mô tả**                  | Kẻ tấn công xâm phạm một Skill phổ biến và đẩy lên bản cập nhật độc hại              |
| **Vectơ tấn công**         | Xâm phạm tài khoản, dùng kỹ nghệ xã hội với chủ sở hữu Skill                         |
| **Thành phần bị ảnh hưởng** | Quản lý phiên bản ClawHub, các luồng tự động cập nhật                                 |
| **Biện pháp giảm thiểu hiện tại** | Lập dấu vân tay phiên bản, chạy lại quy trình kiểm duyệt/quét đối với phiên bản mới |
| **Rủi ro còn lại**         | Cao - cơ chế tự động cập nhật có thể tải phiên bản độc hại trước khi hoàn tất đánh giá |
| **Khuyến nghị**            | Ký bản cập nhật, khả năng khôi phục phiên bản, ghim phiên bản                        |

#### T-PERSIST-003: Can thiệp cấu hình tác tử

| Thuộc tính              | Giá trị                                                                 |
| ----------------------- | ----------------------------------------------------------------------- |
| **ID ATLAS**            | AML.T0010.002 - Xâm phạm chuỗi cung ứng: Dữ liệu                         |
| **Mô tả**               | Kẻ tấn công sửa đổi cấu hình tác tử để duy trì quyền truy cập            |
| **Véc-tơ tấn công**     | Sửa đổi tệp cấu hình, chèn thiết lập                                     |
| **Thành phần bị ảnh hưởng** | Cấu hình tác tử, chính sách công cụ                                  |
| **Biện pháp giảm thiểu hiện tại** | Quyền truy cập tệp                                              |
| **Rủi ro còn lại**      | Trung bình - yêu cầu quyền truy cập cục bộ                               |
| **Khuyến nghị**         | Xác minh tính toàn vẹn cấu hình, ghi nhật ký kiểm toán các thay đổi cấu hình |

---

### 3.5 Né tránh phòng thủ (AML.TA0007)

#### T-EVADE-001: Vượt qua mẫu kiểm duyệt

| Thuộc tính              | Giá trị                                                                                         |
| ----------------------- | ----------------------------------------------------------------------------------------------- |
| **ID ATLAS**            | AML.T0043 - Tạo dữ liệu đối kháng                                                               |
| **Mô tả**               | Kẻ tấn công tạo nội dung skill để né tránh các bước kiểm tra kiểm duyệt của ClawHub              |
| **Véc-tơ tấn công**     | Ký tự Unicode đồng hình, thủ thuật mã hóa, tải động                                              |
| **Thành phần bị ảnh hưởng** | Quy trình kiểm duyệt/quét của ClawHub                                                        |
| **Biện pháp giảm thiểu hiện tại** | Quy tắc mẫu tĩnh, quét mã gần AST, đánh giá rủi ro tác tử bằng LLM, VirusTotal          |
| **Rủi ro còn lại**      | Trung bình - kỹ thuật làm rối mới vẫn có thể lọt qua các phương pháp phỏng đoán nhiều lớp         |
| **Khuyến nghị**         | Tiếp tục mở rộng tập mẫu/hành vi khi phát hiện các kỹ thuật né tránh mới                          |

#### T-EVADE-002: Thoát khỏi trình bao bọc nội dung

| Thuộc tính              | Giá trị                                                                                                                  |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| **ID ATLAS**            | AML.T0043 - Tạo dữ liệu đối kháng                                                                                        |
| **Mô tả**               | Kẻ tấn công tạo nội dung thoát khỏi ngữ cảnh của trình bao bọc nội dung bên ngoài                                        |
| **Véc-tơ tấn công**     | Thao túng thẻ, gây nhầm lẫn ngữ cảnh, ghi đè chỉ dẫn                                                                     |
| **Thành phần bị ảnh hưởng** | Cơ chế bao bọc nội dung bên ngoài                                                                                     |
| **Biện pháp giảm thiểu hiện tại** | Dấu mốc kiểu XML với ranh giới ngẫu nhiên + thông báo bảo mật, cùng khả năng phát hiện giả mạo dấu mốc bằng ký tự đồng hình/biến thể khoảng trắng |
| **Rủi ro còn lại**      | Trung bình - các kỹ thuật thoát mới thường xuyên được phát hiện                                                          |
| **Khuyến nghị**         | Xác thực phía đầu ra bên cạnh việc bao bọc phía đầu vào                                                                  |

---

### 3.6 Khám phá (AML.TA0008)

#### T-DISC-001: Liệt kê công cụ

| Thuộc tính              | Giá trị                                                       |
| ----------------------- | ------------------------------------------------------------- |
| **ID ATLAS**            | AML.T0040 - Truy cập API suy luận mô hình AI                   |
| **Mô tả**               | Kẻ tấn công liệt kê các công cụ khả dụng thông qua câu lệnh nhắc |
| **Véc-tơ tấn công**     | Các truy vấn kiểu "Bạn có những công cụ nào?"                 |
| **Thành phần bị ảnh hưởng** | Sổ đăng ký công cụ của tác tử                              |
| **Biện pháp giảm thiểu hiện tại** | Không có biện pháp cụ thể                           |
| **Rủi ro còn lại**      | Thấp - các công cụ nhìn chung đã được ghi trong tài liệu       |
| **Khuyến nghị**         | Cân nhắc các biện pháp kiểm soát khả năng hiển thị công cụ     |

#### T-DISC-002: Trích xuất dữ liệu phiên

| Thuộc tính              | Giá trị                                                        |
| ----------------------- | -------------------------------------------------------------- |
| **ID ATLAS**            | AML.T0040 - Truy cập API suy luận mô hình AI                    |
| **Mô tả**               | Kẻ tấn công trích xuất dữ liệu nhạy cảm từ ngữ cảnh phiên       |
| **Véc-tơ tấn công**     | Các truy vấn "Chúng ta đã thảo luận gì?", thăm dò ngữ cảnh      |
| **Thành phần bị ảnh hưởng** | Bản ghi phiên, cửa sổ ngữ cảnh                              |
| **Biện pháp giảm thiểu hiện tại** | Cô lập phiên theo từng người gửi (khóa `agent:channel:peer`) |
| **Rủi ro còn lại**      | Trung bình - dữ liệu trong phiên có thể truy cập được theo thiết kế |
| **Khuyến nghị**         | Biên tập dữ liệu nhạy cảm trong ngữ cảnh                        |

---

### 3.7 Thu thập và trích xuất dữ liệu (AML.TA0009, AML.TA0010)

#### T-EXFIL-001: Đánh cắp dữ liệu qua web_fetch

| Thuộc tính              | Giá trị                                                                                         |
| ----------------------- | ----------------------------------------------------------------------------------------------- |
| **ID ATLAS**            | AML.T0009 - Thu thập                                                                            |
| **Mô tả**               | Kẻ tấn công trích xuất dữ liệu bằng cách chỉ thị tác tử gửi dữ liệu đến một URL bên ngoài        |
| **Véc-tơ tấn công**     | Chèn câu lệnh nhắc khiến tác tử POST dữ liệu đến máy chủ của kẻ tấn công                          |
| **Thành phần bị ảnh hưởng** | Công cụ `web_fetch`                                                                         |
| **Biện pháp giảm thiểu hiện tại** | Chặn SSRF đối với mạng nội bộ/riêng tư (ghim DNS + chặn IP)                          |
| **Rủi ro còn lại**      | Cao - các URL bên ngoài tùy ý vẫn được cho phép                                                  |
| **Khuyến nghị**         | Danh sách cho phép URL, nhận biết phân loại dữ liệu                                               |

#### T-EXFIL-002: Gửi tin nhắn trái phép

| Thuộc tính              | Giá trị                                                                      |
| ----------------------- | ---------------------------------------------------------------------------- |
| **ID ATLAS**            | AML.T0009 - Thu thập                                                         |
| **Mô tả**               | Kẻ tấn công khiến tác tử gửi tin nhắn chứa dữ liệu nhạy cảm                   |
| **Véc-tơ tấn công**     | Chèn câu lệnh nhắc khiến tác tử nhắn tin cho kẻ tấn công                      |
| **Thành phần bị ảnh hưởng** | Công cụ nhắn tin, tích hợp kênh                                           |
| **Biện pháp giảm thiểu hiện tại** | Cơ chế kiểm soát gửi tin nhắn ra ngoài                           |
| **Rủi ro còn lại**      | Trung bình - cơ chế kiểm soát có thể bị vượt qua                              |
| **Khuyến nghị**         | Yêu cầu xác nhận rõ ràng đối với người nhận mới                               |

#### T-EXFIL-003: Thu thập thông tin xác thực

| Thuộc tính              | Giá trị                                                                                                                                                                        |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **ID ATLAS**            | AML.T0009 - Thu thập                                                                                                                                                            |
| **Mô tả**               | Skill độc hại thu thập thông tin xác thực từ ngữ cảnh tác tử                                                                                                                    |
| **Véc-tơ tấn công**     | Mã skill đọc các biến môi trường và tệp cấu hình                                                                                                                               |
| **Thành phần bị ảnh hưởng** | Môi trường thực thi skill                                                                                                                                                   |
| **Biện pháp giảm thiểu hiện tại** | ClawHub quét mẫu thông tin xác thực (bí mật mã hóa cứng, truy cập biến môi trường chứa thông tin xác thực đi kèm hoạt động gửi qua mạng); không có cơ chế hộp cát thực thi cho các skill trong thời gian chạy |
| **Rủi ro còn lại**      | Nghiêm trọng - các skill chạy với đặc quyền của tác tử                                                                                                                         |
| **Khuyến nghị**         | Thực thi skill trong hộp cát, cô lập thông tin xác thực                                                                                                                        |

---

### 3.8 Tác động (AML.TA0011)

#### T-IMPACT-001: Thực thi lệnh trái phép

| Thuộc tính              | Giá trị                                                                                                                |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| **ID ATLAS**            | AML.T0031 - Làm suy giảm tính toàn vẹn của mô hình AI                                                                  |
| **Mô tả**               | Kẻ tấn công thực thi các lệnh tùy ý trên hệ thống của người dùng                                                       |
| **Véc-tơ tấn công**     | Chèn câu lệnh nhắc kết hợp với việc vượt qua phê duyệt thực thi                                                        |
| **Thành phần bị ảnh hưởng** | Công cụ Bash, thực thi lệnh                                                                                         |
| **Biện pháp giảm thiểu hiện tại** | Phê duyệt thực thi, tùy chọn hộp cát Docker (phần phụ trợ thời gian chạy mặc định)                          |
| **Rủi ro còn lại**      | Nghiêm trọng - có thể thực thi trên máy chủ khi hộp cát bị tắt                                                         |
| **Khuyến nghị**         | Cải thiện trải nghiệm người dùng khi phê duyệt; việc triển khai với hộp cát bị tắt vẫn là lựa chọn có chủ đích của người vận hành và được ghi rõ trong tài liệu |

#### T-IMPACT-002: Cạn kiệt tài nguyên (DoS)

| Thuộc tính              | Giá trị                                                  |
| ----------------------- | -------------------------------------------------------- |
| **ID ATLAS**            | AML.T0031 - Làm suy giảm tính toàn vẹn của mô hình AI     |
| **Mô tả**               | Kẻ tấn công làm cạn kiệt hạn mức API hoặc tài nguyên tính toán |
| **Véc-tơ tấn công**     | Gửi tin nhắn tự động dồn dập, gọi công cụ tốn kém         |
| **Thành phần bị ảnh hưởng** | Gateway, phiên tác tử, nhà cung cấp API                |
| **Biện pháp giảm thiểu hiện tại** | Không có                                        |
| **Rủi ro còn lại**      | Cao - không giới hạn tốc độ theo từng người gửi           |
| **Khuyến nghị**         | Giới hạn tốc độ theo từng người gửi, ngân sách chi phí    |

#### T-IMPACT-003: Tổn hại danh tiếng

| Thuộc tính              | Giá trị                                                             |
| ----------------------- | ------------------------------------------------------------------- |
| **ID ATLAS**            | AML.T0031 - Làm suy giảm tính toàn vẹn của mô hình AI                |
| **Mô tả**               | Kẻ tấn công khiến tác tử gửi nội dung có hại/xúc phạm                 |
| **Véc-tơ tấn công**     | Chèn câu lệnh nhắc gây ra phản hồi không phù hợp                      |
| **Thành phần bị ảnh hưởng** | Tạo đầu ra, nhắn tin qua kênh                                    |
| **Biện pháp giảm thiểu hiện tại** | Chính sách nội dung của nhà cung cấp LLM                |
| **Rủi ro còn lại**      | Trung bình - bộ lọc của nhà cung cấp không hoàn hảo                   |
| **Khuyến nghị**         | Lớp lọc đầu ra, biện pháp kiểm soát dành cho người dùng               |

---

## 4. Phân tích chuỗi cung ứng ClawHub

### 4.1 Các biện pháp kiểm soát bảo mật hiện tại

| Biện pháp kiểm soát             | Cách triển khai                                                                         | Hiệu quả                                                                       |
| ------------------------------ | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Tuổi tài khoản GitHub          | `requireGitHubAccountAge()` (tối thiểu 14 ngày)                                        | Trung bình - nâng cao rào cản đối với kẻ tấn công mới                          |
| Làm sạch đường dẫn             | `sanitizePath()`                                                                       | Cao - ngăn chặn duyệt xuyên đường dẫn                                          |
| Xác thực loại tệp              | `isTextFile()`                                                                         | Trung bình - chỉ quét tệp văn bản, nhưng vẫn có thể bị khai thác               |
| Giới hạn kích thước            | Tổng gói 50 MB (`MAX_PUBLISH_TOTAL_BYTES`)                                              | Cao - ngăn cạn kiệt tài nguyên                                                 |
| Bắt buộc có SKILL.md           | Tệp hướng dẫn bắt buộc khi phát hành                                                   | Giá trị bảo mật thấp - chỉ mang tính thông tin                                 |
| Quét tĩnh + gần với AST        | Công cụ mẫu bao quát việc thực thi, rò rỉ dữ liệu, thu thập thông tin xác thực, làm rối mã và nhiều hành vi khác | Trung bình-Cao - bao quát nhiều mẫu lạm dụng đã biết, nhưng vẫn dựa trên mẫu |
| Đánh giá rủi ro tác tử dựa trên LLM | Phán quyết dựa trên lời nhắc bảo mật khi phát hành                                | Trung bình-Cao - phát hiện hành vi mà các mẫu tĩnh bỏ sót                      |
| Quét VirusTotal                | Được tích hợp vào luồng phát hành/quét lại Skills và gói, yêu cầu khóa API của đơn vị vận hành | Cao khi được bật - phát hiện bằng công cụ tĩnh                          |
| Trạng thái kiểm duyệt          | Trường `moderationStatus`                                                              | Trung bình - cho phép đánh giá thủ công                                         |

### 4.2 Hạn chế của hoạt động kiểm duyệt

Cơ chế quét tĩnh của ClawHub kiểm tra trực tiếp nội dung mã Skills (không chỉ slug/siêu dữ liệu/frontmatter), bao quát các lệnh thực thi nguy hiểm, thực thi mã động, thu thập thông tin xác thực, các mẫu rò rỉ dữ liệu, tải trọng bị làm rối và nhiều nội dung khác. Các hạn chế đã biết:

- Cơ chế phát hiện dựa trên mẫu vẫn có thể bị vượt qua bằng các kỹ thuật làm rối đủ mới.
- Hoạt động đánh giá dựa trên LLM và quét VirusTotal phụ thuộc vào việc khóa API/cấu hình phía đơn vị vận hành đã được bật.
- Không có sandbox thực thi thời gian chạy nào cô lập Skills khỏi các đặc quyền của chính tác tử sau khi được cài đặt.

### 4.3 Huy hiệu

Skills và các gói mang những huy hiệu do kiểm duyệt viên gán: `highlighted`, `official`, `deprecated`, `redactionApproved` (chỉ dành cho Skills). Báo cáo cộng đồng (`skillReports`) và nhật ký kiểm toán (`auditLogs`) hỗ trợ các quy trình kiểm duyệt.

---

## 5. Ma trận rủi ro

### 5.1 Khả năng xảy ra so với tác động

| ID mối đe dọa | Khả năng xảy ra | Tác động  | Mức rủi ro      | Mức ưu tiên |
| -------------- | --------------- | --------- | --------------- | ----------- |
| T-EXEC-001     | Cao             | Nghiêm trọng | **Nghiêm trọng** | P0       |
| T-PERSIST-001  | Cao             | Nghiêm trọng | **Nghiêm trọng** | P0       |
| T-EXFIL-003    | Trung bình      | Nghiêm trọng | **Nghiêm trọng** | P0       |
| T-IMPACT-001   | Trung bình      | Nghiêm trọng | **Cao**          | P1       |
| T-EXEC-002     | Cao             | Cao       | **Cao**         | P1          |
| T-EXEC-004     | Trung bình      | Cao       | **Cao**         | P1          |
| T-ACCESS-003   | Trung bình      | Cao       | **Cao**         | P1          |
| T-EXFIL-001    | Trung bình      | Cao       | **Cao**         | P1          |
| T-IMPACT-002   | Cao             | Trung bình | **Cao**        | P1          |
| T-EVADE-001    | Cao             | Trung bình | **Trung bình** | P2          |
| T-ACCESS-001   | Thấp            | Cao       | **Trung bình**  | P2          |
| T-ACCESS-002   | Thấp            | Cao       | **Trung bình**  | P2          |
| T-PERSIST-002  | Thấp            | Cao       | **Trung bình**  | P2          |

### 5.2 Chuỗi tấn công theo đường dẫn trọng yếu

**Chuỗi 1: Đánh cắp dữ liệu dựa trên Skills**

```text
T-PERSIST-001 → T-EVADE-001 → T-EXFIL-003
(Phát hành Skills độc hại) → (Né tránh kiểm duyệt) → (Thu thập thông tin xác thực)
```

**Chuỗi 2: Chèn lời nhắc dẫn đến RCE**

```text
T-EXEC-001 → T-EXEC-004 → T-IMPACT-001
(Chèn lời nhắc) → (Vượt qua phê duyệt thực thi) → (Thực thi lệnh)
```

**Chuỗi 3: Chèn gián tiếp qua nội dung được truy xuất**

```text
T-EXEC-002 → T-EXFIL-001 → Rò rỉ dữ liệu ra bên ngoài
(Đầu độc nội dung URL) → (Tác tử truy xuất và làm theo hướng dẫn) → (Dữ liệu được gửi cho kẻ tấn công)
```

---

## 6. Tóm tắt khuyến nghị

### 6.1 Ngay lập tức (P0)

| ID    | Khuyến nghị                                          | Giải quyết                  |
| ----- | ---------------------------------------------------- | --------------------------- |
| R-002 | Triển khai sandbox thực thi Skills                   | T-PERSIST-001, T-EXFIL-003  |
| R-003 | Thêm cơ chế xác thực đầu ra cho các hành động nhạy cảm | T-EXEC-001, T-EXEC-002    |

### 6.2 Ngắn hạn (P1)

| ID    | Khuyến nghị                                                               | Giải quyết   |
| ----- | ------------------------------------------------------------------------- | ------------ |
| R-004 | Triển khai giới hạn tốc độ theo từng người gửi                            | T-IMPACT-002 |
| R-005 | Thêm mã hóa token khi lưu trữ                                             | T-ACCESS-003 |
| R-006 | Cải thiện trải nghiệm người dùng khi phê duyệt thực thi và tiếp tục mở rộng việc chuẩn hóa lệnh | T-EXEC-004 |
| R-007 | Triển khai danh sách URL được phép cho `web_fetch`                        | T-EXFIL-001  |

### 6.3 Trung hạn (P2)

| ID    | Khuyến nghị                                                   | Giải quyết    |
| ----- | ------------------------------------------------------------- | ------------- |
| R-008 | Thêm xác minh kênh bằng mật mã khi có thể                     | T-ACCESS-002  |
| R-009 | Triển khai xác minh tính toàn vẹn của cấu hình                | T-PERSIST-003 |
| R-010 | Thêm ký bản cập nhật và ghim phiên bản                        | T-PERSIST-002 |

---

## 7. Phụ lục

### 7.1 Ánh xạ kỹ thuật ATLAS

| ID ATLAS      | Tên kỹ thuật                         | Các mối đe dọa đối với OpenClaw                                   |
| ------------- | ------------------------------------ | ------------------------------------------------------------------ |
| AML.T0006     | Quét chủ động                        | T-RECON-001, T-RECON-002                                           |
| AML.T0009     | Thu thập                             | T-EXFIL-001, T-EXFIL-002, T-EXFIL-003                              |
| AML.T0010.001 | Chuỗi cung ứng: Phần mềm AI          | T-PERSIST-001, T-PERSIST-002                                       |
| AML.T0010.002 | Chuỗi cung ứng: Dữ liệu              | T-PERSIST-003                                                      |
| AML.T0031     | Làm suy giảm tính toàn vẹn của mô hình AI | T-IMPACT-001, T-IMPACT-002, T-IMPACT-003                      |
| AML.T0040     | Truy cập API suy luận mô hình AI     | T-ACCESS-001, T-ACCESS-002, T-ACCESS-003, T-DISC-001, T-DISC-002   |
| AML.T0043     | Tạo dữ liệu đối kháng                | T-EXEC-004, T-EVADE-001, T-EVADE-002                               |
| AML.T0051.000 | Chèn lời nhắc LLM: Trực tiếp         | T-EXEC-001, T-EXEC-003                                             |
| AML.T0051.001 | Chèn lời nhắc LLM: Gián tiếp         | T-EXEC-002                                                         |

### 7.2 Các tệp bảo mật chính

| Đường dẫn                          | Mục đích                                  | Mức rủi ro      |
| ---------------------------------- | ----------------------------------------- | --------------- |
| `src/infra/exec-approvals.ts`      | Logic phê duyệt lệnh                      | **Nghiêm trọng** |
| `src/gateway/auth.ts`              | Xác thực Gateway                          | **Nghiêm trọng** |
| `src/infra/net/ssrf.ts`            | Bảo vệ chống SSRF                         | **Nghiêm trọng** |
| `src/security/external-content.ts` | Giảm thiểu chèn lời nhắc                  | **Nghiêm trọng** |
| `src/agents/sandbox/tool-policy.ts` | Chính sách cho phép/từ chối công cụ trong sandbox | **Nghiêm trọng** |
| `src/routing/resolve-route.ts`     | Cô lập phiên / định tuyến                 | **Trung bình**   |

### 7.3 Bảng thuật ngữ

| Thuật ngữ          | Định nghĩa                                                       |
| ------------------ | ---------------------------------------------------------------- |
| **ATLAS**          | Bức tranh toàn cảnh về các mối đe dọa đối kháng đối với hệ thống AI của MITRE |
| **ClawHub**        | Chợ Skills của OpenClaw                                          |
| **Gateway**        | Lớp định tuyến tin nhắn và xác thực của OpenClaw                 |
| **MCP**            | Giao thức ngữ cảnh mô hình - giao diện dành cho nhà cung cấp công cụ |
| **Chèn lời nhắc**  | Cuộc tấn công trong đó các chỉ dẫn độc hại được nhúng vào đầu vào |
| **Skills**         | Tiện ích mở rộng có thể tải xuống dành cho các tác tử OpenClaw   |
| **SSRF**           | Giả mạo yêu cầu phía máy chủ                                     |

---

_Mô hình mối đe dọa này là một tài liệu liên tục được cập nhật. Hãy báo cáo các vấn đề bảo mật tới `security@openclaw.ai` hoặc xem [trang Tin cậy](https://trust.openclaw.ai)._

## Liên quan

- [Đóng góp cho mô hình mối đe dọa](/vi/security/CONTRIBUTING-THREAT-MODEL)
- [Ứng phó sự cố](/vi/security/incident-response)
- [Proxy mạng](/vi/security/network-proxy)
- [Xác minh hình thức](/vi/security/formal-verification)
