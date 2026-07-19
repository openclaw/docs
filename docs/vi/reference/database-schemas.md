---
read_when:
    - Chẩn đoán lỗi lược đồ cơ sở dữ liệu mới hơn
    - Kiểm tra tính tương thích của cơ sở dữ liệu trước khi cập nhật hoặc hạ cấp
    - Khôi phục cơ sở dữ liệu cho một bản phát hành OpenClaw cũ hơn
summary: Vị trí cơ sở dữ liệu SQLite của OpenClaw, phiên bản lược đồ, kiểm tra tính toàn vẹn và khôi phục khi hạ cấp
title: Lược đồ cơ sở dữ liệu
x-i18n:
    generated_at: "2026-07-19T06:01:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 73993e2c593ba460784108aedef70bbfb499e525c709d6d6bdd956ccf93e0ddc
    source_path: reference/database-schemas.md
    workflow: 16
---

OpenClaw lưu trạng thái mặt phẳng điều khiển trong một cơ sở dữ liệu SQLite toàn cục và dữ liệu tác nhân trong một cơ sở dữ liệu SQLite cho mỗi tác nhân. Quá trình di chuyển lược đồ tiến về phía trước khi cơ sở dữ liệu được mở. Các bản dựng OpenClaw cũ hơn từ chối cơ sở dữ liệu do lược đồ mới hơn ghi.

## Bố cục cơ sở dữ liệu

| Phạm vi               | Đường dẫn mặc định                                        | Nội dung                                                                                                      |
| --------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Mặt phẳng điều khiển toàn cục | `~/.openclaw/state/openclaw.sqlite`                        | Trạng thái cấu hình dùng chung, sổ đăng ký, phê duyệt, trạng thái plugin và trạng thái thời gian chạy dùng chung |
| Mặt phẳng dữ liệu cho mỗi tác nhân | `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite` | Phiên, bản ghi hội thoại, chỉ mục bộ nhớ, trạng thái xác thực, trạng thái cuộc trò chuyện và trạng thái thời gian chạy thuộc phạm vi tác nhân |

Một số tính năng có khối lượng lớn hoặc vòng đời riêng sử dụng các kho SQLite chuyên dụng, bao gồm sổ đăng ký tác vụ và dữ liệu quỹ đạo.

## Hợp đồng lập phiên bản

Mỗi cơ sở dữ liệu ghi lại lược đồ của mình ở hai nơi:

- `PRAGMA user_version` là phiên bản lược đồ SQLite.
- Hàng `schema_meta` chính ghi lại `role`, `agent_id`, `schema_version` và `app_version`. `app_version` là bản dựng OpenClaw gần nhất đã ghi siêu dữ liệu lược đồ.

OpenClaw áp dụng các quá trình di chuyển chỉ tiến khi mở một cơ sở dữ liệu cũ hơn còn được hỗ trợ. Nó từ chối cơ sở dữ liệu có `user_version` mới hơn bản dựng đang chạy và báo lỗi `newer schema version`. Gateway kiểm tra tất cả cơ sở dữ liệu đã đăng ký trước khi khởi động. `openclaw update` cũng từ chối một gói hoặc đích nguồn có mức hỗ trợ lược đồ được khai báo cũ hơn cơ sở dữ liệu trên đĩa. Không thể kiểm tra trước các gói đích được phát hành trước khi siêu dữ liệu lược đồ được bổ sung.

Cài đặt OpenClaw thủ công qua npm sẽ bỏ qua cơ chế bảo vệ của trình cập nhật. Các bước kiểm tra khi mở cơ sở dữ liệu vẫn từ chối bản dựng không tương thích.

## Lịch sử lược đồ tác nhân

| Phiên bản | Thay đổi                                                                                                                                                                                                                                                       | Bản phát hành đầu tiên                          |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| 1         | Kho cho mỗi tác nhân ban đầu ([#88349](https://github.com/openclaw/openclaw/pull/88349))                                                                                                                                                                       | `v2026.5.30-beta.1`, ổn định đến `v2026.7.1` |
| 2         | Định danh chỉ mục bộ nhớ ([#104449](https://github.com/openclaw/openclaw/pull/104449))                                                                                                                                                                         | `v2026.7.2-beta.1`                             |
| 4         | Phiên và bản ghi hội thoại được chuyển vào SQLite ([#98236](https://github.com/openclaw/openclaw/pull/98236))                                                                                                                                                   | `v2026.7.2-beta.1`                             |
| 5-6       | Độ mới của trạng thái kết thúc và vòng đời trạng thái ([#104859](https://github.com/openclaw/openclaw/pull/104859))                                                                                                                                             | `v2026.7.2-beta.1`                             |
| 7         | Phép chiếu trạng thái vòng đời cho từng mục ([#106151](https://github.com/openclaw/openclaw/pull/106151))                                                                                                                                                       | `v2026.7.2-beta.1`                             |
| 8         | Nguồn gốc phiên cho từng bản ghi hội thoại ([#106766](https://github.com/openclaw/openclaw/pull/106766))                                                                                                                                                        | `v2026.7.2-beta.2`                             |
| 9         | Các bảng `STRICT` ([#108663](https://github.com/openclaw/openclaw/pull/108663))                                                                                                                                                                      | `v2026.7.2-beta.2`                             |
| 10        | Các đường dẫn bản ghi hội thoại đang hoạt động được hiện thực hóa ([#108851](https://github.com/openclaw/openclaw/pull/108851))                                                                                                                                | Chưa phát hành                                 |
| 11        | Hợp đồng thuê, phân phối bền vững, địa chỉ cuộc trò chuyện và kết quả heartbeat ([#109636](https://github.com/openclaw/openclaw/pull/109636), [#95838](https://github.com/openclaw/openclaw/pull/95838), [#109999](https://github.com/openclaw/openclaw/pull/109999)) | Chưa phát hành                                 |

Phiên bản 3 là một bước phát triển chưa được phát hành, được gộp vào phiên bản 4.

## Lịch sử lược đồ trạng thái

| Phiên bản | Thay đổi                                                                                                         | Bản phát hành đầu tiên |
| --------- | ---------------------------------------------------------------------------------------------------------------- | ---------------------- |
| 1         | Cơ sở dữ liệu trạng thái dùng chung ban đầu                                                                       | `v2026.5.30-beta.1`     |
| 2         | Các sự kiện kiểm toán tin nhắn chỉ chứa siêu dữ liệu ([#103903](https://github.com/openclaw/openclaw/pull/103903)) | `v2026.7.2-beta.1`     |
| 3         | Các bảng `STRICT` và tăng cường khả năng chống sai lệch lược đồ ([#108663](https://github.com/openclaw/openclaw/pull/108663)) | `v2026.7.2-beta.2`     |
| 4         | Nguồn gốc theo dõi phiên thay thế các hàng sentinel được mã hóa                                                   | Chưa phát hành         |

## Kiểm tra tính toàn vẹn

| Thời điểm                                   | Kiểm tra                                                                 |
| ------------------------------------------- | ------------------------------------------------------------------------ |
| Mỗi lần mở                                  | Xác thực bảng `schema_meta` và hàng siêu dữ liệu chính              |
| Trước một quá trình di chuyển đang chờ      | Chạy quét toàn bộ về tính toàn vẹn, khóa ngoại, vai trò, lược đồ và chỉ mục |
| Trình xác minh nền của Gateway              | Chạy quét toàn bộ khoảng một lần mỗi ngày và ghi nhật ký kết quả         |
| Doctor, xác minh bản sao lưu và Compaction  | Chạy quét toàn bộ trước khi chấp nhận hoặc ghi lại cơ sở dữ liệu         |

Bước kiểm tra trước của Gateway chỉ đọc các tiêu đề lược đồ. Trình xác minh nền đảm nhiệm quá trình quét toàn bộ chậm hơn đối với những cơ sở dữ liệu không cần di chuyển.
Các quyết định cách ly chỉ nằm trong một kho `openclaw-quarantine.sqlite` chuyên dụng, nhờ đó chúng vẫn tồn tại khi các cơ sở dữ liệu đang bị cách ly bị hỏng. Kết quả xác minh được ghi vào nhật ký.

## Khắc phục sự cố

### Tại sao không thể quay lại sau khi cập nhật lên 2026.7.2

Mọi bản phát hành đến hết `v2026.7.1` đều sử dụng lược đồ tác nhân 1 và lược đồ trạng thái 1. Chuỗi phát hành 2026.7.2 (bắt đầu với `v2026.7.2-beta.1`) di chuyển cơ sở dữ liệu của bạn về phía trước trong lần khởi động đầu tiên. Quá trình di chuyển đó chỉ theo một chiều: dữ liệu được ghi lại theo lược đồ mới hơn, và việc cài đặt một OpenClaw cũ hơn sau đó không hoàn tác quá trình này. Bản dựng cũ hơn từ chối khởi động với lỗi `newer schema version` nêu tên bản dựng sở hữu cơ sở dữ liệu.

Hạ cấp tệp nhị phân không bao giờ hạ cấp dữ liệu. Nếu phải chạy một bản phát hành cũ hơn 2026.7.2 sau khi cập nhật, bạn có ba lựa chọn:

1. Khôi phục bản sao lưu được tạo trước khi cập nhật. [Tạo và xác minh bản sao lưu](/vi/cli/backup) trước các bản cập nhật lớn.
2. Chạy bản dựng cũ hơn với một thư mục trạng thái riêng (`OPENCLAW_STATE_DIR`). Nó sẽ khởi động mới hoàn toàn; dữ liệu đã di chuyển của bạn vẫn nguyên vẹn để dùng khi quay lại bản dựng mới hơn.
3. Làm theo quy trình hạ cấp thủ công bên dưới. Quy trình này không được hỗ trợ và có nguy cơ mất dữ liệu nếu không có bản sao lưu đã được xác minh.

Kể từ 2026.7.2, `openclaw update` từ chối cài đặt bản phát hành không thể mở các cơ sở dữ liệu hiện tại của bạn, vì vậy trình cập nhật sẽ không đẩy bạn vào tình huống này. Cài đặt thủ công một phiên bản cũ hơn qua npm sẽ bỏ qua cơ chế bảo vệ đó; các cơ sở dữ liệu vẫn từ chối tệp nhị phân cũ, nhưng chỉ sau khi nó được cài đặt.

### Gateway từ chối khởi động với lỗi phiên bản lược đồ mới hơn

Một bản dựng OpenClaw mới hơn đã ghi các cơ sở dữ liệu của bạn, còn bản dựng đang chạy thì cũ hơn. Lỗi và nhật ký khởi động Gateway nêu tên bản dựng sở hữu cơ sở dữ liệu (`app_version`). Hãy cài đặt phiên bản đó hoặc mới hơn, hoặc sử dụng một trong các lựa chọn ở trên. Không chỉnh sửa cơ sở dữ liệu để che giấu lỗi.

### Cơ sở dữ liệu bị cách ly sau khi xác minh tính toàn vẹn thất bại

Trình xác minh nền đã chứng minh tệp bị hỏng, và mọi lần mở hiện đều thất bại ngay thay vì quét lại. Khôi phục cơ sở dữ liệu từ bản sao lưu hoặc sửa chữa nó, sau đó chạy `openclaw doctor --fix` để xóa bản ghi cách ly. Doctor báo lỗi rõ ràng nếu không thể xóa chính bản ghi cách ly; hãy chạy lại cho đến khi Doctor báo trạng thái sạch.

## Không hỗ trợ hạ cấp

Việc hạ cấp lược đồ thủ công dành cho các tác nhân và người vận hành chấp nhận rủi ro. [Tạo và xác minh bản sao lưu](/vi/cli/backup) trước khi chỉnh sửa bất kỳ cơ sở dữ liệu nào. Dừng Gateway và mọi tiến trình có thể mở cơ sở dữ liệu.

Quy trình chung như sau:

1. Đọc lược đồ và các quá trình di chuyển của bản phát hành đích.
2. Trong một giao dịch, xóa mọi bảng, chỉ mục, trình kích hoạt và cột được bổ sung sau phiên bản đích.
3. Đặt `PRAGMA user_version` và `schema_meta.schema_version` thành phiên bản đích.
4. Chạy quy trình xác minh toàn bộ cơ sở dữ liệu của bản phát hành đích trước khi khởi động Gateway.

### Ví dụ: lược đồ tác nhân 11 xuống 9

Lược đồ 10 bổ sung phép chiếu bản ghi hội thoại đang hoạt động. Lược đồ 11 bổ sung hợp đồng thuê, phân phối bền vững, trạng thái địa chỉ cuộc trò chuyện và kết quả heartbeat. Cơ chế phối hợp QMD sử dụng các hàng trong `state_leases`; không có bảng QMD riêng cần bảo toàn.

Chạy SQL tương đương đối với từng cơ sở dữ liệu cho mỗi tác nhân bị ảnh hưởng sau khi kiểm tra chính xác lược đồ đã ghi cơ sở dữ liệu đó:

```sql
BEGIN IMMEDIATE;

DROP TABLE IF EXISTS heartbeat_outcomes;
DROP TABLE IF EXISTS conversation_deliveries;
DROP TABLE IF EXISTS state_leases;
DROP TABLE IF EXISTS session_transcript_active_events;

ALTER TABLE session_transcript_index_state DROP COLUMN active_event_count;
ALTER TABLE session_transcript_index_state DROP COLUMN active_message_count;
ALTER TABLE conversations DROP COLUMN delivery_target;

PRAGMA user_version = 9;
UPDATE schema_meta
SET schema_version = 9,
    updated_at = unixepoch('now') * 1000
WHERE meta_key = 'primary';

COMMIT;
```

Thao tác này loại bỏ trạng thái của phiên bản 10-11, bao gồm các hoạt động phân phối đang diễn ra, hợp đồng thuê, kết quả heartbeat và phép chiếu bản ghi hội thoại đang hoạt động được suy ra. Nếu hạ cấp sai, hãy khôi phục từ bản sao lưu đã được xác minh.
