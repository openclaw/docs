---
read_when:
    - Thiết lập quy trình làm việc của tác nhân tự động hoạt động mà không cần lời nhắc cho từng tác vụ
    - Xác định những việc tác nhân có thể tự thực hiện và những việc cần con người phê duyệt
    - Cấu trúc các tác tử đa chương trình với ranh giới và quy tắc chuyển cấp rõ ràng
summary: Xác định quyền vận hành thường trực cho các chương trình tác tử tự chủ
title: Chỉ thị thường trực
x-i18n:
    generated_at: "2026-07-12T07:41:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9e7ad622efe734facc9dc3716f5ee7f57ed3923499db78730bda234a5c62ad80
    source_path: automation/standing-orders.md
    workflow: 16
---

Chỉ thị thường trực trao cho tác tử của bạn **quyền vận hành lâu dài** đối với các chương trình đã xác định. Thay vì nhắc tác tử cho từng nhiệm vụ, bạn xác định các chương trình với phạm vi, điều kiện kích hoạt và quy tắc chuyển cấp rõ ràng; tác tử sẽ tự chủ thực thi trong các ranh giới đó: "Bạn chịu trách nhiệm về báo cáo hằng tuần. Hãy tổng hợp báo cáo vào mỗi thứ Sáu, gửi đi và chỉ chuyển cấp nếu có điều gì đó bất thường."

## Tại sao cần chỉ thị thường trực

**Khi không có chỉ thị thường trực:** bạn phải nhắc tác tử cho từng nhiệm vụ, công việc thường lệ dễ bị quên hoặc trì hoãn và bạn trở thành nút thắt cổ chai.

**Khi có chỉ thị thường trực:** tác tử tự chủ thực thi trong các ranh giới đã xác định, công việc thường lệ diễn ra đúng lịch và bạn chỉ cần tham gia khi có ngoại lệ hoặc cần phê duyệt.

## Cách thức hoạt động

Chỉ thị thường trực được xác định trong các tệp thuộc [không gian làm việc của tác tử](/vi/concepts/agent-workspace). Cách tiếp cận được khuyến nghị là đưa chúng trực tiếp vào `AGENTS.md` (tệp này được tự động chèn vào mỗi phiên) để tác tử luôn có chúng trong ngữ cảnh. Với cấu hình lớn hơn, bạn cũng có thể đặt chúng trong một tệp riêng như `standing-orders.md` và tham chiếu tệp đó từ `AGENTS.md`.

Mỗi chương trình chỉ định:

1. **Phạm vi** - tác tử được phép làm gì
2. **Điều kiện kích hoạt** - khi nào thực thi (theo lịch, sự kiện hoặc điều kiện)
3. **Cổng phê duyệt** - việc gì cần con người phê duyệt trước khi thực hiện
4. **Quy tắc chuyển cấp** - khi nào phải dừng lại và yêu cầu trợ giúp

Tác tử nạp các hướng dẫn này trong mỗi phiên thông qua các tệp khởi tạo không gian làm việc (xem [Không gian làm việc của tác tử](/vi/concepts/agent-workspace) để biết danh sách đầy đủ các tệp được tự động chèn) và thực thi theo chúng, kết hợp với [tác vụ Cron](/vi/automation/cron-jobs) để bảo đảm thực hiện theo thời gian.

<Tip>
Đặt chỉ thị thường trực trong `AGENTS.md` để bảo đảm chúng được nạp trong mọi phiên. Quá trình khởi tạo không gian làm việc tự động chèn `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` và `MEMORY.md` - nhưng không chèn các tệp tùy ý trong thư mục con.
</Tip>

## Cấu trúc của một chỉ thị thường trực

```markdown
## Chương trình: Báo cáo trạng thái hằng tuần

**Quyền hạn:** Tổng hợp dữ liệu, tạo báo cáo, gửi đến các bên liên quan
**Điều kiện kích hoạt:** Mỗi thứ Sáu lúc 4 giờ chiều (được bảo đảm bằng tác vụ cron)
**Cổng phê duyệt:** Không cần đối với báo cáo tiêu chuẩn. Đánh dấu các bất thường để con người xem xét.
**Chuyển cấp:** Nếu nguồn dữ liệu không khả dụng hoặc các chỉ số có vẻ bất thường (>2σ so với mức chuẩn)

### Các bước thực thi

1. Lấy các chỉ số từ những nguồn đã cấu hình
2. So sánh với tuần trước và các mục tiêu
3. Tạo báo cáo tại Reports/weekly/YYYY-MM-DD.md
4. Gửi bản tóm tắt qua kênh đã cấu hình
5. Ghi nhận hoàn tất vào Agent/Logs/

### Những điều KHÔNG được làm

- Không gửi báo cáo cho các bên bên ngoài
- Không sửa đổi dữ liệu nguồn
- Không bỏ qua việc gửi báo cáo nếu các chỉ số xấu - hãy báo cáo chính xác
```

## Chỉ thị thường trực kết hợp với tác vụ Cron

Chỉ thị thường trực xác định tác tử được phép làm **việc gì**. [Tác vụ Cron](/vi/automation/cron-jobs) xác định việc đó diễn ra **khi nào**. Chúng phối hợp với nhau:

```text
Chỉ thị thường trực: "Bạn chịu trách nhiệm phân loại hộp thư đến hằng ngày"
    ↓
Tác vụ Cron (8 giờ sáng hằng ngày): "Thực hiện phân loại hộp thư đến theo chỉ thị thường trực"
    ↓
Tác tử: Đọc chỉ thị thường trực → thực hiện các bước → báo cáo kết quả
```

Lời nhắc của tác vụ cron nên tham chiếu chỉ thị thường trực thay vì lặp lại nội dung:

```bash
openclaw cron add \
  --name daily-inbox-triage \
  --cron "0 8 * * 1-5" \
  --tz America/New_York \
  --timeout-seconds 300 \
  --announce \
  --channel imessage \
  --to "+1XXXXXXXXXX" \
  --message "Thực hiện phân loại hộp thư đến hằng ngày theo chỉ thị thường trực. Kiểm tra thư để tìm cảnh báo mới. Phân tích, phân loại và lưu từng mục. Báo cáo bản tóm tắt cho chủ sở hữu. Chuyển cấp các trường hợp chưa xác định."
```

## Ví dụ

### Ví dụ 1: nội dung và mạng xã hội (chu kỳ hằng tuần)

```markdown
## Chương trình: Nội dung và mạng xã hội

**Quyền hạn:** Soạn thảo nội dung, lên lịch bài đăng, tổng hợp báo cáo mức độ tương tác
**Cổng phê duyệt:** Mọi bài đăng đều cần chủ sở hữu xem xét trong 30 ngày đầu, sau đó áp dụng phê duyệt thường trực
**Điều kiện kích hoạt:** Chu kỳ hằng tuần (xem xét vào thứ Hai → bản nháp giữa tuần → bản tóm lược thứ Sáu)

### Chu kỳ hằng tuần

- **Thứ Hai:** Xem xét các chỉ số nền tảng và mức độ tương tác của đối tượng
- **Thứ Ba-Thứ Năm:** Soạn bài đăng mạng xã hội, tạo nội dung blog
- **Thứ Sáu:** Tổng hợp bản tóm lược tiếp thị hằng tuần → gửi cho chủ sở hữu

### Quy tắc nội dung

- Giọng điệu phải phù hợp với thương hiệu (xem SOUL.md hoặc hướng dẫn giọng điệu thương hiệu)
- Không bao giờ tự nhận là AI trong nội dung công khai
- Đưa vào các chỉ số khi có
- Tập trung vào giá trị cho đối tượng, không tự quảng bá
```

### Ví dụ 2: hoạt động tài chính (được kích hoạt bởi sự kiện)

```markdown
## Chương trình: Xử lý tài chính

**Quyền hạn:** Xử lý dữ liệu giao dịch, tạo báo cáo, gửi bản tóm tắt
**Cổng phê duyệt:** Không cần đối với phân tích. Các đề xuất cần chủ sở hữu phê duyệt.
**Điều kiện kích hoạt:** Phát hiện tệp dữ liệu mới HOẶC theo chu kỳ hằng tháng đã lên lịch

### Khi có dữ liệu mới

1. Phát hiện tệp mới trong thư mục đầu vào được chỉ định
2. Phân tích và phân loại tất cả giao dịch
3. So sánh với các mục tiêu ngân sách
4. Đánh dấu: các mục bất thường, trường hợp vượt ngưỡng, khoản phí định kỳ mới
5. Tạo báo cáo trong thư mục đầu ra được chỉ định
6. Gửi bản tóm tắt cho chủ sở hữu qua kênh đã cấu hình

### Quy tắc chuyển cấp

- Một mục > $500: cảnh báo ngay lập tức
- Một danh mục vượt ngân sách 20%: đánh dấu trong báo cáo
- Giao dịch không nhận diện được: hỏi chủ sở hữu để phân loại
- Xử lý thất bại sau 2 lần thử lại: báo cáo lỗi, không phỏng đoán
```

### Ví dụ 3: giám sát và cảnh báo (liên tục)

```markdown
## Chương trình: Giám sát hệ thống

**Quyền hạn:** Kiểm tra tình trạng hệ thống, khởi động lại dịch vụ, gửi cảnh báo
**Cổng phê duyệt:** Tự động khởi động lại dịch vụ. Chuyển cấp nếu khởi động lại thất bại hai lần.
**Điều kiện kích hoạt:** Mỗi chu kỳ Heartbeat

### Kiểm tra

- Các điểm cuối kiểm tra tình trạng dịch vụ có phản hồi
- Dung lượng đĩa cao hơn ngưỡng
- Các nhiệm vụ đang chờ không bị quá hạn (>24 giờ)
- Các kênh gửi đang hoạt động

### Ma trận phản hồi

| Điều kiện            | Hành động                         | Chuyển cấp?                         |
| -------------------- | --------------------------------- | ----------------------------------- |
| Dịch vụ ngừng hoạt động | Tự động khởi động lại          | Chỉ khi khởi động lại thất bại 2 lần |
| Dung lượng đĩa < 10% | Cảnh báo chủ sở hữu                | Có                                  |
| Nhiệm vụ quá hạn > 24 giờ | Nhắc chủ sở hữu              | Không                               |
| Kênh ngoại tuyến     | Ghi nhật ký và thử lại ở chu kỳ sau | Nếu ngoại tuyến > 2 giờ           |
```

## Mẫu thực thi-xác minh-báo cáo

Chỉ thị thường trực hoạt động hiệu quả nhất khi kết hợp với kỷ luật thực thi nghiêm ngặt. Mọi nhiệm vụ trong chỉ thị thường trực nên tuân theo vòng lặp này:

1. **Thực thi** - Thực sự làm công việc (không chỉ xác nhận hướng dẫn)
2. **Xác minh** - Xác nhận kết quả chính xác (tệp tồn tại, tin nhắn đã được gửi, dữ liệu đã được phân tích)
3. **Báo cáo** - Cho chủ sở hữu biết những gì đã được thực hiện và xác minh

```markdown
### Quy tắc thực thi

- Mọi nhiệm vụ đều tuân theo Thực thi-Xác minh-Báo cáo. Không có ngoại lệ.
- "Tôi sẽ làm việc đó" không phải là thực thi. Hãy làm rồi mới báo cáo.
- "Đã xong" mà không có xác minh là không thể chấp nhận. Hãy chứng minh.
- Nếu thực thi thất bại: thử lại một lần với cách tiếp cận đã điều chỉnh.
- Nếu vẫn thất bại: báo cáo lỗi kèm chẩn đoán. Không bao giờ âm thầm thất bại.
- Không bao giờ thử lại vô hạn - tối đa 3 lần, sau đó chuyển cấp.
```

Mẫu này ngăn chặn chế độ thất bại phổ biến nhất của tác tử: xác nhận một nhiệm vụ nhưng không hoàn thành nhiệm vụ đó.

## Kiến trúc đa chương trình

Đối với các tác tử quản lý nhiều lĩnh vực, hãy tổ chức chỉ thị thường trực thành các chương trình riêng biệt với ranh giới rõ ràng:

```markdown
## Chương trình 1: [Lĩnh vực A] (Hằng tuần)

...

## Chương trình 2: [Lĩnh vực B] (Hằng tháng + Theo yêu cầu)

...

## Chương trình 3: [Lĩnh vực C] (Khi cần)

...

## Quy tắc chuyển cấp (Tất cả chương trình)

- [Tiêu chí chuyển cấp chung]
- [Các cổng phê duyệt áp dụng cho nhiều chương trình]
```

Mỗi chương trình nên có:

- **Nhịp kích hoạt** riêng (hằng tuần, hằng tháng, theo sự kiện, liên tục)
- **Cổng phê duyệt** riêng (một số chương trình cần được giám sát nhiều hơn các chương trình khác)
- **Ranh giới** rõ ràng (tác tử phải biết một chương trình kết thúc và chương trình khác bắt đầu ở đâu)

## Các phương pháp hay nhất

### Nên làm

- Bắt đầu với quyền hạn hẹp và mở rộng khi mức độ tin cậy tăng lên
- Xác định cổng phê duyệt rõ ràng cho các hành động có rủi ro cao
- Bao gồm các phần "Những điều KHÔNG được làm" - ranh giới quan trọng không kém quyền hạn
- Kết hợp với tác vụ cron để thực thi đáng tin cậy theo thời gian
- Xem xét nhật ký của tác tử hằng tuần để xác minh chỉ thị thường trực đang được tuân thủ
- Cập nhật chỉ thị thường trực khi nhu cầu của bạn thay đổi - chúng là những tài liệu luôn được cập nhật

### Tránh

- Trao quyền hạn rộng ngay từ ngày đầu tiên ("hãy làm bất cứ điều gì bạn cho là tốt nhất")
- Bỏ qua quy tắc chuyển cấp - mọi chương trình đều cần điều khoản "khi nào phải dừng lại và hỏi"
- Cho rằng tác tử sẽ nhớ hướng dẫn bằng lời nói - hãy đưa mọi thứ vào tệp
- Trộn nhiều lĩnh vực trong một chương trình - dùng chương trình riêng cho từng lĩnh vực
- Quên bảo đảm thực thi bằng tác vụ cron - chỉ thị thường trực không có điều kiện kích hoạt sẽ trở thành đề xuất

## Liên quan

- [Tự động hóa](/vi/automation): tổng quan về tất cả cơ chế tự động hóa.
- [Tác vụ Cron](/vi/automation/cron-jobs): bảo đảm thực thi theo lịch cho chỉ thị thường trực.
- [Hook](/vi/automation/hooks): tập lệnh theo sự kiện cho các sự kiện trong vòng đời của tác tử.
- [Webhook](/vi/automation/cron-jobs#webhooks): điều kiện kích hoạt từ sự kiện HTTP đến.
- [Không gian làm việc của tác tử](/vi/concepts/agent-workspace): nơi lưu trữ chỉ thị thường trực, bao gồm danh sách đầy đủ các tệp khởi tạo được tự động chèn (`AGENTS.md`, `SOUL.md`, v.v.).
