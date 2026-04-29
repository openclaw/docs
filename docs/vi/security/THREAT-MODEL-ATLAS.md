---
read_when:
    - Đánh giá hiện trạng bảo mật hoặc các kịch bản đe dọa
    - Làm việc với các tính năng bảo mật hoặc phản hồi kiểm toán
summary: Mô hình mối đe dọa của OpenClaw được ánh xạ theo khung MITRE ATLAS
title: Mô hình đe dọa (MITRE ATLAS)
x-i18n:
    generated_at: "2026-04-29T23:13:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: d929addb829b92d650ef6caecb267fb154f6f9f7d28be7aa87851569931f5228
    source_path: security/THREAT-MODEL-ATLAS.md
    workflow: 16
---

# Mô hình mối đe dọa OpenClaw v1.0

## Khung MITRE ATLAS

**Phiên bản:** 1.0-draft
**Cập nhật lần cuối:** 2026-02-04
**Phương pháp luận:** MITRE ATLAS + Sơ đồ luồng dữ liệu
**Khung:** [MITRE ATLAS](https://atlas.mitre.org/) (Bối cảnh mối đe dọa đối kháng đối với hệ thống AI)

### Ghi nhận nguồn khung

Mô hình mối đe dọa này được xây dựng dựa trên [MITRE ATLAS](https://atlas.mitre.org/), khung tiêu chuẩn ngành để lập tài liệu về các mối đe dọa đối kháng đối với hệ thống AI/ML. ATLAS do [MITRE](https://www.mitre.org/) duy trì với sự cộng tác của cộng đồng bảo mật AI.

**Tài nguyên ATLAS chính:**

- [Kỹ thuật ATLAS](https://atlas.mitre.org/techniques/)
- [Chiến thuật ATLAS](https://atlas.mitre.org/tactics/)
- [Nghiên cứu tình huống ATLAS](https://atlas.mitre.org/studies/)
- [ATLAS GitHub](https://github.com/mitre-atlas/atlas-data)
- [Đóng góp cho ATLAS](https://atlas.mitre.org/resources/contribute)

### Đóng góp cho mô hình mối đe dọa này

Đây là tài liệu sống do cộng đồng OpenClaw duy trì. Xem [CONTRIBUTING-THREAT-MODEL.md](/vi/security/CONTRIBUTING-THREAT-MODEL) để biết hướng dẫn đóng góp:

- Báo cáo mối đe dọa mới
- Cập nhật mối đe dọa hiện có
- Đề xuất chuỗi tấn công
- Đề xuất biện pháp giảm thiểu

---

## 1. Giới thiệu

### 1.1 Mục đích

Mô hình mối đe dọa này lập tài liệu các mối đe dọa đối kháng đối với nền tảng tác tử AI OpenClaw và chợ Skills ClawHub, sử dụng khung MITRE ATLAS được thiết kế riêng cho hệ thống AI/ML.

### 1.2 Phạm vi

| Thành phần             | Bao gồm | Ghi chú                                                |
| ---------------------- | ------- | ------------------------------------------------------ |
| Runtime tác tử OpenClaw | Có      | Thực thi tác tử lõi, lệnh gọi công cụ, phiên           |
| Gateway                | Có      | Xác thực, định tuyến, tích hợp kênh                    |
| Tích hợp kênh          | Có      | WhatsApp, Telegram, Discord, Signal, Slack, v.v.       |
| Chợ ClawHub            | Có      | Xuất bản Skills, kiểm duyệt, phân phối                 |
| Máy chủ MCP            | Có      | Nhà cung cấp công cụ bên ngoài                         |
| Thiết bị người dùng    | Một phần | Ứng dụng di động, máy khách máy tính để bàn            |

### 1.3 Ngoài phạm vi

Không có gì được loại trừ rõ ràng khỏi phạm vi của mô hình mối đe dọa này.

---

## 2. Kiến trúc hệ thống

### 2.1 Ranh giới tin cậy

```
┌─────────────────────────────────────────────────────────────────┐
│                    UNTRUSTED ZONE                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │  WhatsApp   │  │  Telegram   │  │   Discord   │  ...         │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘              │
│         │                │                │                      │
└─────────┼────────────────┼────────────────┼──────────────────────┘
          │                │                │
          ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────────┐
│                 TRUST BOUNDARY 1: Channel Access                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                      GATEWAY                              │   │
│  │  • Device Pairing (1h DM / 5m node grace period)           │   │
│  │  • AllowFrom / AllowList validation                       │   │
│  │  • Token/Password/Tailscale auth                          │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                 TRUST BOUNDARY 2: Session Isolation              │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   AGENT SESSIONS                          │   │
│  │  • Session key = agent:channel:peer                       │   │
│  │  • Tool policies per agent                                │   │
│  │  • Transcript logging                                     │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                 TRUST BOUNDARY 3: Tool Execution                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                  EXECUTION SANDBOX                        │   │
│  │  • Docker sandbox OR Host (exec-approvals)                │   │
│  │  • Node remote execution                                  │   │
│  │  • SSRF protection (DNS pinning + IP blocking)            │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                 TRUST BOUNDARY 4: External Content               │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              FETCHED URLs / EMAILS / WEBHOOKS             │   │
│  │  • External content wrapping (XML tags)                   │   │
│  │  • Security notice injection                              │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                 TRUST BOUNDARY 5: Supply Chain                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                      CLAWHUB                              │   │
│  │  • Skill publishing (semver, SKILL.md required)           │   │
│  │  • Pattern-based moderation flags                         │   │
│  │  • VirusTotal scanning (coming soon)                      │   │
│  │  • GitHub account age verification                        │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Luồng dữ liệu

| Luồng | Nguồn   | Đích        | Dữ liệu             | Bảo vệ               |
| ----- | ------- | ----------- | ------------------- | -------------------- |
| F1    | Kênh    | Gateway     | Tin nhắn người dùng | TLS, AllowFrom       |
| F2    | Gateway | Tác tử      | Tin nhắn được định tuyến | Cô lập phiên    |
| F3    | Tác tử  | Công cụ     | Lệnh gọi công cụ    | Thực thi chính sách  |
| F4    | Tác tử  | Bên ngoài   | Yêu cầu web_fetch   | Chặn SSRF            |
| F5    | ClawHub | Tác tử      | Mã Skills           | Kiểm duyệt, quét     |
| F6    | Tác tử  | Kênh        | Phản hồi            | Lọc đầu ra           |

---

## 3. Phân tích mối đe dọa theo chiến thuật ATLAS

### 3.1 Trinh sát (AML.TA0002)

#### T-RECON-001: Phát hiện điểm cuối tác tử

| Thuộc tính              | Giá trị                                                              |
| ----------------------- | -------------------------------------------------------------------- |
| **ID ATLAS**            | AML.T0006 - Quét chủ động                                            |
| **Mô tả**               | Kẻ tấn công quét các điểm cuối Gateway OpenClaw bị lộ                |
| **Vector tấn công**     | Quét mạng, truy vấn shodan, liệt kê DNS                              |
| **Thành phần bị ảnh hưởng** | Gateway, các điểm cuối API bị lộ                                 |
| **Biện pháp giảm thiểu hiện tại** | Tùy chọn xác thực Tailscale, mặc định bind vào loopback      |
| **Rủi ro còn lại**      | Trung bình - Gateway công khai có thể bị phát hiện                   |
| **Khuyến nghị**         | Lập tài liệu triển khai bảo mật, thêm giới hạn tốc độ trên các điểm cuối phát hiện |

#### T-RECON-002: Thăm dò tích hợp kênh

| Thuộc tính               | Giá trị                                                              |
| ----------------------- | ------------------------------------------------------------------ |
| **Mã ATLAS**            | AML.T0006 - Quét chủ động                                        |
| **Mô tả**         | Kẻ tấn công thăm dò các kênh nhắn tin để xác định các tài khoản do AI quản lý |
| **Vector tấn công**       | Gửi tin nhắn thử nghiệm, quan sát mẫu phản hồi                 |
| **Thành phần bị ảnh hưởng** | Tất cả tích hợp kênh                                           |
| **Biện pháp giảm thiểu hiện tại** | Không có biện pháp cụ thể                                                      |
| **Rủi ro còn lại**       | Thấp - Chỉ riêng việc phát hiện có giá trị hạn chế                           |
| **Khuyến nghị**     | Cân nhắc ngẫu nhiên hóa thời điểm phản hồi                             |

---

### 3.2 Truy cập ban đầu (AML.TA0004)

#### T-ACCESS-001: Chặn mã ghép nối

| Thuộc tính               | Giá trị                                                                                                         |
| ----------------------- | ------------------------------------------------------------------------------------------------------------- |
| **Mã ATLAS**            | AML.T0040 - Truy cập API suy luận mô hình AI                                                                     |
| **Mô tả**         | Kẻ tấn công chặn mã ghép nối trong thời gian gia hạn ghép nối (1 giờ cho ghép nối kênh DM, 5 phút cho ghép nối node) |
| **Vector tấn công**       | Nhìn trộm qua vai, nghe lén mạng, kỹ nghệ xã hội                                                        |
| **Thành phần bị ảnh hưởng** | Hệ thống ghép nối thiết bị                                                                                         |
| **Biện pháp giảm thiểu hiện tại** | Hết hạn sau 1 giờ (ghép nối DM) / hết hạn sau 5 phút (ghép nối node), mã được gửi qua kênh hiện có                            |
| **Rủi ro còn lại**       | Trung bình - Thời gian gia hạn có thể bị khai thác                                                                             |
| **Khuyến nghị**     | Giảm thời gian gia hạn, thêm bước xác nhận                                                                    |

#### T-ACCESS-002: Giả mạo AllowFrom

| Thuộc tính               | Giá trị                                                                          |
| ----------------------- | ------------------------------------------------------------------------------ |
| **Mã ATLAS**            | AML.T0040 - Truy cập API suy luận mô hình AI                                      |
| **Mô tả**         | Kẻ tấn công giả mạo danh tính người gửi được phép trong kênh                             |
| **Vector tấn công**       | Tùy thuộc vào kênh - giả mạo số điện thoại, mạo danh tên người dùng             |
| **Thành phần bị ảnh hưởng** | Xác thực AllowFrom theo từng kênh                                               |
| **Biện pháp giảm thiểu hiện tại** | Xác minh danh tính theo từng kênh                                         |
| **Rủi ro còn lại**       | Trung bình - Một số kênh dễ bị giả mạo                                  |
| **Khuyến nghị**     | Ghi tài liệu về rủi ro theo từng kênh, thêm xác minh mật mã khi có thể |

#### T-ACCESS-003: Đánh cắp token

| Thuộc tính               | Giá trị                                                       |
| ----------------------- | ----------------------------------------------------------- |
| **Mã ATLAS**            | AML.T0040 - Truy cập API suy luận mô hình AI                   |
| **Mô tả**         | Kẻ tấn công đánh cắp token xác thực từ các tệp cấu hình     |
| **Vector tấn công**       | Phần mềm độc hại, truy cập thiết bị trái phép, lộ bản sao lưu cấu hình |
| **Thành phần bị ảnh hưởng** | ~/.openclaw/credentials/, lưu trữ cấu hình                    |
| **Biện pháp giảm thiểu hiện tại** | Quyền tệp                                            |
| **Rủi ro còn lại**       | Cao - Token được lưu ở dạng văn bản thuần                           |
| **Khuyến nghị**     | Triển khai mã hóa token khi lưu trữ, thêm xoay vòng token      |

---

### 3.3 Thực thi (AML.TA0005)

#### T-EXEC-001: Tiêm prompt trực tiếp

| Thuộc tính               | Giá trị                                                                                     |
| ----------------------- | ----------------------------------------------------------------------------------------- |
| **Mã ATLAS**            | AML.T0051.000 - Tiêm prompt LLM: Trực tiếp                                              |
| **Mô tả**         | Kẻ tấn công gửi các prompt được tạo có chủ đích để thao túng hành vi của agent                               |
| **Vector tấn công**       | Tin nhắn kênh chứa chỉ dẫn đối kháng                                      |
| **Thành phần bị ảnh hưởng** | Agent LLM, tất cả bề mặt đầu vào                                                             |
| **Biện pháp giảm thiểu hiện tại** | Phát hiện mẫu, bọc nội dung bên ngoài                                              |
| **Rủi ro còn lại**       | Nghiêm trọng - Chỉ phát hiện, không chặn; các cuộc tấn công tinh vi có thể vượt qua                      |
| **Khuyến nghị**     | Triển khai phòng thủ nhiều lớp, xác thực đầu ra, xác nhận của người dùng cho các hành động nhạy cảm |

#### T-EXEC-002: Tiêm prompt gián tiếp

| Thuộc tính               | Giá trị                                                       |
| ----------------------- | ----------------------------------------------------------- |
| **Mã ATLAS**            | AML.T0051.001 - Tiêm prompt LLM: Gián tiếp              |
| **Mô tả**         | Kẻ tấn công nhúng chỉ dẫn độc hại vào nội dung được truy xuất   |
| **Vector tấn công**       | URL độc hại, email bị cài cắm, webhook bị xâm phạm       |
| **Thành phần bị ảnh hưởng** | web_fetch, nạp email, nguồn dữ liệu bên ngoài           |
| **Biện pháp giảm thiểu hiện tại** | Bọc nội dung bằng thẻ XML và thông báo bảo mật          |
| **Rủi ro còn lại**       | Cao - LLM có thể bỏ qua chỉ dẫn trong lớp bọc                  |
| **Khuyến nghị**     | Triển khai làm sạch nội dung, tách riêng các ngữ cảnh thực thi |

#### T-EXEC-003: Tiêm đối số công cụ

| Thuộc tính               | Giá trị                                                        |
| ----------------------- | ------------------------------------------------------------ |
| **Mã ATLAS**            | AML.T0051.000 - Tiêm prompt LLM: Trực tiếp                 |
| **Mô tả**         | Kẻ tấn công thao túng đối số công cụ thông qua tiêm prompt |
| **Vector tấn công**       | Prompt được tạo có chủ đích ảnh hưởng đến giá trị tham số công cụ         |
| **Thành phần bị ảnh hưởng** | Tất cả lệnh gọi công cụ                                         |
| **Biện pháp giảm thiểu hiện tại** | Phê duyệt exec cho các lệnh nguy hiểm                        |
| **Rủi ro còn lại**       | Cao - Phụ thuộc vào phán đoán của người dùng                               |
| **Khuyến nghị**     | Triển khai xác thực đối số, lệnh gọi công cụ được tham số hóa      |

#### T-EXEC-004: Vượt qua phê duyệt exec

| Thuộc tính               | Giá trị                                                      |
| ----------------------- | ---------------------------------------------------------- |
| **Mã ATLAS**            | AML.T0043 - Tạo dữ liệu đối kháng                         |
| **Mô tả**         | Kẻ tấn công tạo các lệnh vượt qua allowlist phê duyệt    |
| **Vector tấn công**       | Làm rối lệnh, khai thác bí danh, thao túng đường dẫn |
| **Thành phần bị ảnh hưởng** | exec-approvals.ts, allowlist lệnh                       |
| **Biện pháp giảm thiểu hiện tại** | Allowlist + chế độ hỏi                                       |
| **Rủi ro còn lại**       | Cao - Không làm sạch lệnh                             |
| **Khuyến nghị**     | Triển khai chuẩn hóa lệnh, mở rộng blocklist          |

---

### 3.4 Duy trì hiện diện (AML.TA0006)

#### T-PERSIST-001: Cài đặt Skill độc hại

| Thuộc tính               | Giá trị                                                                    |
| ----------------------- | ------------------------------------------------------------------------ |
| **Mã ATLAS**            | AML.T0010.001 - Xâm phạm chuỗi cung ứng: Phần mềm AI                     |
| **Mô tả**         | Kẻ tấn công xuất bản Skill độc hại lên ClawHub                            |
| **Vector tấn công**       | Tạo tài khoản, xuất bản Skill có mã độc hại ẩn                 |
| **Thành phần bị ảnh hưởng** | ClawHub, tải Skill, thực thi agent                                  |
| **Biện pháp giảm thiểu hiện tại** | Xác minh tuổi tài khoản GitHub, cờ kiểm duyệt dựa trên mẫu          |
| **Rủi ro còn lại**       | Nghiêm trọng - Không có sandboxing, đánh giá hạn chế                                 |
| **Khuyến nghị**     | Tích hợp VirusTotal (đang thực hiện), sandboxing Skill, đánh giá cộng đồng |

#### T-PERSIST-002: Đầu độc bản cập nhật Skill

| Thuộc tính               | Giá trị                                                          |
| ----------------------- | -------------------------------------------------------------- |
| **Mã ATLAS**            | AML.T0010.001 - Xâm phạm chuỗi cung ứng: Phần mềm AI           |
| **Mô tả**         | Kẻ tấn công xâm phạm Skill phổ biến và đẩy bản cập nhật độc hại |
| **Vector tấn công**       | Xâm phạm tài khoản, kỹ nghệ xã hội với chủ sở hữu Skill          |
| **Thành phần bị ảnh hưởng** | Đánh phiên bản ClawHub, luồng tự động cập nhật                          |
| **Biện pháp giảm thiểu hiện tại** | Lấy dấu vân tay phiên bản                                         |
| **Rủi ro còn lại**       | Cao - Tự động cập nhật có thể kéo về phiên bản độc hại                |
| **Khuyến nghị**     | Triển khai ký bản cập nhật, khả năng rollback, ghim phiên bản |

#### T-PERSIST-003: Can thiệp cấu hình agent

| Thuộc tính               | Giá trị                                                           |
| ----------------------- | --------------------------------------------------------------- |
| **Mã ATLAS**            | AML.T0010.002 - Xâm phạm chuỗi cung ứng: Dữ liệu                   |
| **Mô tả**         | Kẻ tấn công sửa đổi cấu hình agent để duy trì quyền truy cập         |
| **Vector tấn công**       | Sửa đổi tệp cấu hình, tiêm cài đặt                    |
| **Thành phần bị ảnh hưởng** | Cấu hình agent, chính sách công cụ                                     |
| **Biện pháp giảm thiểu hiện tại** | Quyền tệp                                                |
| **Rủi ro còn lại**       | Trung bình - Yêu cầu truy cập cục bộ                                  |
| **Khuyến nghị**     | Xác minh tính toàn vẹn cấu hình, ghi log kiểm toán cho thay đổi cấu hình |

---

### 3.5 Né tránh phòng thủ (AML.TA0007)

#### T-EVADE-001: Vượt qua mẫu kiểm duyệt

| Thuộc tính               | Giá trị                                                                  |
| ----------------------- | ---------------------------------------------------------------------- |
| **Mã ATLAS**            | AML.T0043 - Tạo dữ liệu đối kháng                                     |
| **Mô tả**         | Kẻ tấn công tạo nội dung Skill để né tránh các mẫu kiểm duyệt             |
| **Vector tấn công**       | Ký tự Unicode đồng hình, thủ thuật mã hóa, tải động                   |
| **Thành phần bị ảnh hưởng** | ClawHub moderation.ts                                                  |
| **Biện pháp giảm thiểu hiện tại** | FLAG_RULES dựa trên mẫu                                               |
| **Rủi ro còn lại**       | Cao - Regex đơn giản dễ bị vượt qua                                    |
| **Khuyến nghị**     | Thêm phân tích hành vi (VirusTotal Code Insight), phát hiện dựa trên AST |

#### T-EVADE-002: Thoát khỏi lớp bọc nội dung

| Thuộc tính             | Giá trị                                                   |
| ---------------------- | --------------------------------------------------------- |
| **ATLAS ID**           | AML.T0043 - Tạo dữ liệu đối kháng                         |
| **Mô tả**              | Kẻ tấn công tạo nội dung thoát khỏi ngữ cảnh bọc XML      |
| **Vector tấn công**    | Thao túng thẻ, nhầm lẫn ngữ cảnh, ghi đè chỉ dẫn          |
| **Thành phần bị ảnh hưởng** | Bọc nội dung bên ngoài                              |
| **Biện pháp giảm thiểu hiện tại** | Thẻ XML + thông báo bảo mật                  |
| **Rủi ro còn lại**     | Trung bình - Các cách thoát mới được phát hiện thường xuyên |
| **Khuyến nghị**        | Nhiều lớp bọc, xác thực phía đầu ra                       |

---

### 3.6 Khám phá (AML.TA0008)

#### T-DISC-001: Liệt kê công cụ

| Thuộc tính             | Giá trị                                               |
| ---------------------- | ----------------------------------------------------- |
| **ATLAS ID**           | AML.T0040 - Truy cập API suy luận mô hình AI          |
| **Mô tả**              | Kẻ tấn công liệt kê các công cụ sẵn có thông qua prompt |
| **Vector tấn công**    | Các truy vấn kiểu "Bạn có những công cụ nào?"         |
| **Thành phần bị ảnh hưởng** | Sổ đăng ký công cụ của agent                    |
| **Biện pháp giảm thiểu hiện tại** | Không có biện pháp cụ thể                 |
| **Rủi ro còn lại**     | Thấp - Công cụ thường được ghi lại trong tài liệu     |
| **Khuyến nghị**        | Cân nhắc các cơ chế kiểm soát khả năng hiển thị công cụ |

#### T-DISC-002: Trích xuất dữ liệu phiên

| Thuộc tính             | Giá trị                                               |
| ---------------------- | ----------------------------------------------------- |
| **ATLAS ID**           | AML.T0040 - Truy cập API suy luận mô hình AI          |
| **Mô tả**              | Kẻ tấn công trích xuất dữ liệu nhạy cảm từ ngữ cảnh phiên |
| **Vector tấn công**    | Truy vấn "Chúng ta đã thảo luận gì?", thăm dò ngữ cảnh |
| **Thành phần bị ảnh hưởng** | Bản ghi phiên, cửa sổ ngữ cảnh                  |
| **Biện pháp giảm thiểu hiện tại** | Cô lập phiên theo từng người gửi          |
| **Rủi ro còn lại**     | Trung bình - Dữ liệu trong phiên có thể truy cập được |
| **Khuyến nghị**        | Triển khai che giấu dữ liệu nhạy cảm trong ngữ cảnh   |

---

### 3.7 Thu thập & rò rỉ dữ liệu (AML.TA0009, AML.TA0010)

#### T-EXFIL-001: Đánh cắp dữ liệu qua web_fetch

| Thuộc tính             | Giá trị                                                                  |
| ---------------------- | ------------------------------------------------------------------------ |
| **ATLAS ID**           | AML.T0009 - Thu thập                                                      |
| **Mô tả**              | Kẻ tấn công rò rỉ dữ liệu bằng cách chỉ dẫn agent gửi đến URL bên ngoài  |
| **Vector tấn công**    | Tiêm prompt khiến agent POST dữ liệu đến máy chủ của kẻ tấn công          |
| **Thành phần bị ảnh hưởng** | Công cụ web_fetch                                                  |
| **Biện pháp giảm thiểu hiện tại** | Chặn SSRF đối với mạng nội bộ                              |
| **Rủi ro còn lại**     | Cao - URL bên ngoài được cho phép                                         |
| **Khuyến nghị**        | Triển khai danh sách cho phép URL, nhận thức phân loại dữ liệu            |

#### T-EXFIL-002: Gửi tin nhắn trái phép

| Thuộc tính             | Giá trị                                                            |
| ---------------------- | ------------------------------------------------------------------ |
| **ATLAS ID**           | AML.T0009 - Thu thập                                                |
| **Mô tả**              | Kẻ tấn công khiến agent gửi tin nhắn chứa dữ liệu nhạy cảm          |
| **Vector tấn công**    | Tiêm prompt khiến agent nhắn tin cho kẻ tấn công                    |
| **Thành phần bị ảnh hưởng** | Công cụ nhắn tin, tích hợp kênh                              |
| **Biện pháp giảm thiểu hiện tại** | Kiểm soát nhắn tin gửi ra                            |
| **Rủi ro còn lại**     | Trung bình - Cơ chế kiểm soát có thể bị vượt qua                    |
| **Khuyến nghị**        | Yêu cầu xác nhận rõ ràng đối với người nhận mới                     |

#### T-EXFIL-003: Thu thập thông tin xác thực

| Thuộc tính             | Giá trị                                                   |
| ---------------------- | --------------------------------------------------------- |
| **ATLAS ID**           | AML.T0009 - Thu thập                                      |
| **Mô tả**              | Skill độc hại thu thập thông tin xác thực từ ngữ cảnh agent |
| **Vector tấn công**    | Mã Skill đọc biến môi trường, tệp cấu hình                |
| **Thành phần bị ảnh hưởng** | Môi trường thực thi Skill                         |
| **Biện pháp giảm thiểu hiện tại** | Không có biện pháp cụ thể cho Skills          |
| **Rủi ro còn lại**     | Nghiêm trọng - Skills chạy với đặc quyền của agent         |
| **Khuyến nghị**        | Cách ly Skill bằng sandbox, cô lập thông tin xác thực      |

---

### 3.8 Tác động (AML.TA0011)

#### T-IMPACT-001: Thực thi lệnh trái phép

| Thuộc tính             | Giá trị                                               |
| ---------------------- | ----------------------------------------------------- |
| **ATLAS ID**           | AML.T0031 - Làm xói mòn tính toàn vẹn của mô hình AI  |
| **Mô tả**              | Kẻ tấn công thực thi lệnh tùy ý trên hệ thống người dùng |
| **Vector tấn công**    | Tiêm prompt kết hợp với vượt qua phê duyệt exec       |
| **Thành phần bị ảnh hưởng** | Công cụ Bash, thực thi lệnh                     |
| **Biện pháp giảm thiểu hiện tại** | Phê duyệt exec, tùy chọn sandbox Docker   |
| **Rủi ro còn lại**     | Nghiêm trọng - Thực thi trên máy chủ không có sandbox |
| **Khuyến nghị**        | Mặc định dùng sandbox, cải thiện UX phê duyệt         |

#### T-IMPACT-002: Cạn kiệt tài nguyên (DoS)

| Thuộc tính             | Giá trị                                              |
| ---------------------- | ---------------------------------------------------- |
| **ATLAS ID**           | AML.T0031 - Làm xói mòn tính toàn vẹn của mô hình AI |
| **Mô tả**              | Kẻ tấn công làm cạn kiệt tín dụng API hoặc tài nguyên tính toán |
| **Vector tấn công**    | Gửi tin nhắn tự động ồ ạt, gọi công cụ tốn kém        |
| **Thành phần bị ảnh hưởng** | Gateway, phiên agent, nhà cung cấp API        |
| **Biện pháp giảm thiểu hiện tại** | Không có                              |
| **Rủi ro còn lại**     | Cao - Không có giới hạn tốc độ                        |
| **Khuyến nghị**        | Triển khai giới hạn tốc độ theo người gửi, ngân sách chi phí |

#### T-IMPACT-003: Thiệt hại danh tiếng

| Thuộc tính             | Giá trị                                                   |
| ---------------------- | --------------------------------------------------------- |
| **ATLAS ID**           | AML.T0031 - Làm xói mòn tính toàn vẹn của mô hình AI      |
| **Mô tả**              | Kẻ tấn công khiến agent gửi nội dung gây hại/xúc phạm     |
| **Vector tấn công**    | Tiêm prompt gây ra phản hồi không phù hợp                 |
| **Thành phần bị ảnh hưởng** | Sinh đầu ra, nhắn tin qua kênh                    |
| **Biện pháp giảm thiểu hiện tại** | Chính sách nội dung của nhà cung cấp LLM      |
| **Rủi ro còn lại**     | Trung bình - Bộ lọc của nhà cung cấp chưa hoàn hảo        |
| **Khuyến nghị**        | Lớp lọc đầu ra, kiểm soát của người dùng                  |

---

## 4. Phân tích chuỗi cung ứng ClawHub

### 4.1 Kiểm soát bảo mật hiện tại

| Kiểm soát            | Triển khai                  | Hiệu quả                                             |
| -------------------- | --------------------------- | ---------------------------------------------------- |
| Tuổi tài khoản GitHub | `requireGitHubAccountAge()` | Trung bình - Tăng rào cản cho kẻ tấn công mới        |
| Làm sạch đường dẫn   | `sanitizePath()`            | Cao - Ngăn chặn duyệt đường dẫn                      |
| Xác thực loại tệp    | `isTextFile()`              | Trung bình - Chỉ tệp văn bản, nhưng vẫn có thể độc hại |
| Giới hạn kích thước  | Tổng gói 50MB               | Cao - Ngăn cạn kiệt tài nguyên                       |
| SKILL.md bắt buộc    | Readme bắt buộc             | Giá trị bảo mật thấp - Chỉ mang tính thông tin       |
| Kiểm duyệt mẫu       | FLAG_RULES trong moderation.ts | Thấp - Dễ bị vượt qua                             |
| Trạng thái kiểm duyệt | Trường `moderationStatus`  | Trung bình - Có thể đánh giá thủ công                |

### 4.2 Mẫu cờ kiểm duyệt

Các mẫu hiện tại trong `moderation.ts`:

```javascript
// Known-bad identifiers
/(keepcold131\/ClawdAuthenticatorTool|ClawdAuthenticatorTool)/i

// Suspicious keywords
/(malware|stealer|phish|phishing|keylogger)/i
/(api[-_ ]?key|token|password|private key|secret)/i
/(wallet|seed phrase|mnemonic|crypto)/i
/(discord\.gg|webhook|hooks\.slack)/i
/(curl[^\n]+\|\s*(sh|bash))/i
/(bit\.ly|tinyurl\.com|t\.co|goo\.gl|is\.gd)/i
```

**Hạn chế:**

- Chỉ kiểm tra slug, displayName, tóm tắt, frontmatter, metadata, đường dẫn tệp
- Không phân tích nội dung mã Skill thực tế
- Regex đơn giản dễ bị vượt qua bằng kỹ thuật làm rối
- Không có phân tích hành vi

### 4.3 Cải tiến đã lên kế hoạch

| Cải tiến               | Trạng thái                            | Tác động                                                              |
| ---------------------- | ------------------------------------- | --------------------------------------------------------------------- |
| Tích hợp VirusTotal    | Đang triển khai                       | Cao - Phân tích hành vi Code Insight                                  |
| Báo cáo cộng đồng      | Một phần (bảng `skillReports` đã tồn tại) | Trung bình                                                        |
| Ghi nhật ký kiểm toán  | Một phần (bảng `auditLogs` đã tồn tại) | Trung bình                                                          |
| Hệ thống huy hiệu      | Đã triển khai                         | Trung bình - `highlighted`, `official`, `deprecated`, `redactionApproved` |

---

## 5. Ma trận rủi ro

### 5.1 Khả năng xảy ra so với tác động

| ID mối đe dọa | Khả năng xảy ra | Tác động    | Mức rủi ro       | Ưu tiên |
| ------------- | --------------- | ----------- | ---------------- | ------- |
| T-EXEC-001    | Cao             | Nghiêm trọng | **Nghiêm trọng** | P0      |
| T-PERSIST-001 | Cao             | Nghiêm trọng | **Nghiêm trọng** | P0      |
| T-EXFIL-003   | Trung bình      | Nghiêm trọng | **Nghiêm trọng** | P0      |
| T-IMPACT-001  | Trung bình      | Nghiêm trọng | **Cao**          | P1      |
| T-EXEC-002    | Cao             | Cao         | **Cao**          | P1      |
| T-EXEC-004    | Trung bình      | Cao         | **Cao**          | P1      |
| T-ACCESS-003  | Trung bình      | Cao         | **Cao**          | P1      |
| T-EXFIL-001   | Trung bình      | Cao         | **Cao**          | P1      |
| T-IMPACT-002  | Cao             | Trung bình  | **Cao**          | P1      |
| T-EVADE-001   | Cao             | Trung bình  | **Trung bình**   | P2      |
| T-ACCESS-001  | Thấp            | Cao         | **Trung bình**   | P2      |
| T-ACCESS-002  | Thấp            | Cao         | **Trung bình**   | P2      |
| T-PERSIST-002 | Thấp            | Cao         | **Trung bình**   | P2      |

### 5.2 Chuỗi tấn công đường tới hạn

**Chuỗi tấn công 1: Đánh cắp dữ liệu dựa trên Skill**

```
T-PERSIST-001 → T-EVADE-001 → T-EXFIL-003
(Publish malicious skill) → (Evade moderation) → (Harvest credentials)
```

**Chuỗi tấn công 2: Tiêm prompt dẫn đến RCE**

```
T-EXEC-001 → T-EXEC-004 → T-IMPACT-001
(Inject prompt) → (Bypass exec approval) → (Execute commands)
```

**Chuỗi tấn công 3: Tiêm gián tiếp qua nội dung đã fetch**

```
T-EXEC-002 → T-EXFIL-001 → External exfiltration
(Poison URL content) → (Agent fetches & follows instructions) → (Data sent to attacker)
```

---

## 6. Tóm tắt khuyến nghị

### 6.1 Ngay lập tức (P0)

| ID    | Khuyến nghị                              | Giải quyết                  |
| ----- | ------------------------------------------- | -------------------------- |
| R-001 | Hoàn thiện tích hợp VirusTotal             | T-PERSIST-001, T-EVADE-001 |
| R-002 | Triển khai sandboxing cho skill             | T-PERSIST-001, T-EXFIL-003 |
| R-003 | Thêm xác thực đầu ra cho các hành động nhạy cảm | T-EXEC-001, T-EXEC-002     |

### 6.2 Ngắn hạn (P1)

| ID    | Khuyến nghị                           | Giải quyết    |
| ----- | ---------------------------------------- | ------------ |
| R-004 | Triển khai giới hạn tốc độ                  | T-IMPACT-002 |
| R-005 | Thêm mã hóa token khi lưu trữ             | T-ACCESS-003 |
| R-006 | Cải thiện UX phê duyệt exec và xác thực  | T-EXEC-004   |
| R-007 | Triển khai danh sách URL được phép cho web_fetch | T-EXFIL-001  |

### 6.3 Trung hạn (P2)

| ID    | Khuyến nghị                                        | Giải quyết     |
| ----- | ----------------------------------------------------- | ------------- |
| R-008 | Thêm xác minh kênh bằng mật mã khi có thể | T-ACCESS-002  |
| R-009 | Triển khai xác minh tính toàn vẹn của cấu hình               | T-PERSIST-003 |
| R-010 | Thêm ký bản cập nhật và ghim phiên bản                | T-PERSIST-002 |

---

## 7. Phụ lục

### 7.1 Ánh xạ kỹ thuật ATLAS

| ID ATLAS      | Tên kỹ thuật                 | Mối đe dọa OpenClaw                                                 |
| ------------- | ------------------------------ | ---------------------------------------------------------------- |
| AML.T0006     | Quét chủ động                | T-RECON-001, T-RECON-002                                         |
| AML.T0009     | Thu thập                     | T-EXFIL-001, T-EXFIL-002, T-EXFIL-003                            |
| AML.T0010.001 | Chuỗi cung ứng: Phần mềm AI      | T-PERSIST-001, T-PERSIST-002                                     |
| AML.T0010.002 | Chuỗi cung ứng: Dữ liệu             | T-PERSIST-003                                                    |
| AML.T0031     | Làm suy yếu tính toàn vẹn của mô hình AI       | T-IMPACT-001, T-IMPACT-002, T-IMPACT-003                         |
| AML.T0040     | Truy cập API suy luận mô hình AI  | T-ACCESS-001, T-ACCESS-002, T-ACCESS-003, T-DISC-001, T-DISC-002 |
| AML.T0043     | Tạo dữ liệu đối kháng         | T-EXEC-004, T-EVADE-001, T-EVADE-002                             |
| AML.T0051.000 | Chèn prompt LLM: Trực tiếp   | T-EXEC-001, T-EXEC-003                                           |
| AML.T0051.001 | Chèn prompt LLM: Gián tiếp | T-EXEC-002                                                       |

### 7.2 Các tệp bảo mật chính

| Đường dẫn                                | Mục đích                     | Mức độ rủi ro   |
| ----------------------------------- | --------------------------- | ------------ |
| `src/infra/exec-approvals.ts`       | Logic phê duyệt lệnh      | **Nghiêm trọng** |
| `src/gateway/auth.ts`               | Xác thực Gateway      | **Nghiêm trọng** |
| `src/infra/net/ssrf.ts`             | Bảo vệ SSRF             | **Nghiêm trọng** |
| `src/security/external-content.ts`  | Giảm thiểu chèn prompt | **Nghiêm trọng** |
| `src/agents/sandbox/tool-policy.ts` | Thực thi chính sách công cụ     | **Nghiêm trọng** |
| `src/routing/resolve-route.ts`      | Cách ly phiên           | **Trung bình**   |

### 7.3 Bảng thuật ngữ

| Thuật ngữ                 | Định nghĩa                                                |
| -------------------- | --------------------------------------------------------- |
| **ATLAS**            | Adversarial Threat Landscape for AI Systems của MITRE       |
| **ClawHub**          | Chợ skill của OpenClaw                              |
| **Gateway**          | Lớp định tuyến tin nhắn và xác thực của OpenClaw       |
| **MCP**              | Model Context Protocol - giao diện nhà cung cấp công cụ          |
| **Chèn prompt** | Cuộc tấn công trong đó các chỉ dẫn độc hại được nhúng vào đầu vào |
| **Skill**            | Phần mở rộng có thể tải xuống cho các tác nhân OpenClaw                |
| **SSRF**             | Giả mạo yêu cầu phía máy chủ                               |

---

_Mô hình mối đe dọa này là một tài liệu sống. Báo cáo vấn đề bảo mật tới security@openclaw.ai_

## Liên quan

- [Xác minh hình thức](/vi/security/formal-verification)
- [Đóng góp cho mô hình mối đe dọa](/vi/security/CONTRIBUTING-THREAT-MODEL)
