---
read_when:
    - Nâng cấp bản cài đặt Matrix hiện có
    - Di chuyển lịch sử Matrix được mã hóa và trạng thái thiết bị
summary: Cách OpenClaw nâng cấp Plugin Matrix trước đó tại chỗ, bao gồm các giới hạn khôi phục trạng thái mã hóa và các bước khôi phục thủ công.
title: Di chuyển Matrix
x-i18n:
    generated_at: "2026-07-16T14:05:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 33d5ac134338c8032ca1507ceee6eade2d37b3c86f0045fb883304ad208cd5e5
    source_path: channels/matrix-migration.md
    workflow: 16
---

Nâng cấp từ plugin `matrix` công khai trước đây lên bản triển khai hiện tại.

Đối với hầu hết người dùng, quá trình nâng cấp được thực hiện tại chỗ:

- plugin vẫn là `@openclaw/matrix`
- kênh vẫn là `matrix`
- cấu hình của bạn vẫn nằm trong `channels.matrix`
- thông tin xác thực được lưu vào bộ nhớ đệm vẫn nằm trong `~/.openclaw/credentials/matrix/`
- trạng thái thời gian chạy vẫn nằm trong `~/.openclaw/matrix/`

Bạn không cần đổi tên các khóa cấu hình hoặc cài đặt lại plugin với tên mới.
Gói `openclaw` gốc không còn đóng gói mã thời gian chạy Matrix hoặc các phần phụ thuộc Matrix SDK. Nếu `openclaw channels status` cho biết Matrix đã được cấu hình nhưng
plugin chưa được cài đặt, hãy chạy `openclaw doctor --fix` hoặc
`openclaw plugins install @openclaw/matrix`; không cài đặt các gói Matrix SDK
vào gói OpenClaw gốc.

## Quá trình di chuyển tự động thực hiện những gì

Quá trình di chuyển Matrix chạy khi bạn chạy [`openclaw doctor --fix`](/vi/gateway/doctor), và đóng vai trò dự phòng khi ứng dụng khách Matrix khởi động mà vẫn tìm thấy trạng thái sidecar dựa trên tệp bên cạnh kho SQLite của nó.

Quá trình di chuyển tự động bao gồm:

- tái sử dụng thông tin xác thực Matrix đã lưu vào bộ nhớ đệm
- giữ nguyên lựa chọn tài khoản và cấu hình `channels.matrix`
- nhập trạng thái sidecar dựa trên tệp (bộ nhớ đệm đồng bộ `bot-storage.json`, `recovery-key.json`, `legacy-crypto-migration.json`, ảnh chụp nhanh IndexedDB) vào trạng thái SQLite của Matrix; các tệp đã di chuyển được lưu trữ với hậu tố `.migrated`
- tái sử dụng thư mục gốc lưu trữ hàm băm token đầy đủ nhất hiện có cho cùng tài khoản Matrix, homeserver, người dùng và thiết bị khi token truy cập thay đổi sau này

## Nâng cấp từ các bản phát hành OpenClaw cũ hơn 2026.4

Các bản phát hành đến hết dòng 2026.6 cũng đã di chuyển bố cục Matrix một kho phẳng ban đầu
(`~/.openclaw/matrix/bot-storage.json` cùng với
`~/.openclaw/matrix/crypto/`) và chuẩn bị khôi phục trạng thái được mã hóa từ
kho mật mã rust cũ. Các bản phát hành hiện tại không còn bao gồm quá trình di chuyển đó.

Nếu bạn đang nâng cấp một bản cài đặt vẫn sử dụng bố cục phẳng, trước tiên hãy
nâng cấp lên một bản phát hành 2026.6, chạy `openclaw doctor --fix`, rồi khởi động Gateway
một lần để kho phẳng và mọi khóa phòng có thể khôi phục được di chuyển. Sau đó cập nhật
lên bản phát hành mới nhất.

Plugin Matrix công khai trước đây **không** tự động tạo bản sao lưu khóa phòng Matrix. Nếu bản cài đặt cũ của bạn có lịch sử mã hóa chỉ lưu cục bộ và chưa từng được sao lưu, một số tin nhắn mã hóa cũ có thể vẫn không đọc được sau khi nâng cấp, bất kể đường dẫn di chuyển nào được sử dụng.

## Quy trình nâng cấp được khuyến nghị

1. Cập nhật OpenClaw và plugin Matrix như bình thường.
2. Chạy:

   ```bash
   openclaw doctor --fix
   ```

3. Khởi động hoặc khởi động lại Gateway.
4. Kiểm tra trạng thái xác minh và sao lưu hiện tại:

   ```bash
   openclaw matrix verify status
   openclaw matrix verify backup status
   ```

5. Đặt khóa khôi phục cho tài khoản Matrix mà bạn đang sửa chữa trong một biến môi trường dành riêng cho tài khoản. Với một tài khoản mặc định duy nhất, `MATRIX_RECOVERY_KEY` là phù hợp. Với nhiều tài khoản, hãy dùng một biến cho mỗi tài khoản, ví dụ `MATRIX_RECOVERY_KEY_ASSISTANT`, và thêm `--account assistant` vào lệnh.

6. Nếu OpenClaw thông báo cần khóa khôi phục, hãy chạy lệnh cho tài khoản tương ứng:

   ```bash
   printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
   printf '%s\n' "$MATRIX_RECOVERY_KEY_ASSISTANT" | openclaw matrix verify backup restore --recovery-key-stdin --account assistant
   ```

7. Nếu thiết bị này vẫn chưa được xác minh, hãy chạy lệnh cho tài khoản tương ứng:

   ```bash
   printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
   printf '%s\n' "$MATRIX_RECOVERY_KEY_ASSISTANT" | openclaw matrix verify device --recovery-key-stdin --account assistant
   ```

   Nếu khóa khôi phục được chấp nhận và bản sao lưu có thể sử dụng được, nhưng `Cross-signing verified`
   vẫn là `no`, hãy hoàn tất quá trình tự xác minh từ một ứng dụng khách Matrix khác:

   ```bash
   openclaw matrix verify self
   ```

   Chấp nhận yêu cầu trong một ứng dụng khách Matrix khác, so sánh biểu tượng cảm xúc hoặc số thập phân,
   và chỉ nhập `yes` khi chúng khớp nhau. Lệnh sẽ chờ đến khi danh tính Matrix
   được tin cậy hoàn toàn rồi mới báo thành công.

8. Nếu bạn chủ ý từ bỏ lịch sử cũ không thể khôi phục và muốn có một mốc sao lưu mới cho các tin nhắn trong tương lai, hãy chạy:

   ```bash
   openclaw matrix verify backup reset --yes
   ```

   Chỉ thêm `--rotate-recovery-key` khi khóa khôi phục cũ không còn được phép mở khóa bản sao lưu mới.

9. Nếu chưa có bản sao lưu khóa phía máy chủ, hãy tạo một bản để phục vụ việc khôi phục trong tương lai:

   ```bash
   openclaw matrix verify bootstrap
   ```

## Các thông báo thường gặp và ý nghĩa

`Failed migrating legacy Matrix client storage: ...`

- Ý nghĩa: cơ chế dự phòng phía ứng dụng khách Matrix đã tìm thấy trạng thái sidecar dựa trên tệp, nhưng không thể nhập vào SQLite. OpenClaw hoàn tác các thao tác di chuyển đã hoàn tất và hủy cơ chế dự phòng đó thay vì âm thầm khởi động với một kho mới.
- Cách xử lý: kiểm tra quyền hệ thống tệp hoặc xung đột, giữ nguyên trạng thái cũ và thử lại sau khi sửa lỗi.

`Matrix is installed from a custom path: ...`

- Ý nghĩa: Matrix được ghim vào một bản cài đặt theo đường dẫn, vì vậy các bản cập nhật dòng chính không tự động thay thế nó bằng gói Matrix mặc định.
- Cách xử lý: cài đặt lại bằng `openclaw plugins install @openclaw/matrix` khi bạn muốn quay lại plugin Matrix mặc định.

`Matrix is installed from a custom path that no longer exists: ...`

- Ý nghĩa: bản ghi cài đặt plugin của bạn trỏ đến một đường dẫn cục bộ không còn tồn tại.
- Cách xử lý: cài đặt lại bằng `openclaw plugins install @openclaw/matrix`, hoặc nếu bạn đang chạy từ một bản checkout của kho mã nguồn, hãy dùng `openclaw plugins install ./path/to/local/matrix-plugin`. `openclaw doctor --fix` cũng có thể xóa các tham chiếu plugin Matrix đã lỗi thời.

### Thông báo khôi phục thủ công

`openclaw matrix verify status` và `openclaw matrix verify backup status` in một dòng `Backup issue:` cùng hướng dẫn `Next steps:` khi bản sao lưu khóa phòng không hoạt động bình thường trên thiết bị này:

| Sự cố sao lưu                                                        | Ý nghĩa                                            | Cách khắc phục                                                                                                                             |
| --------------------------------------------------------------------- | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `no room-key backup exists on the homeserver`                         | không có dữ liệu để khôi phục                      | `openclaw matrix verify bootstrap` để tạo bản sao lưu khóa phòng                                                                            |
| `backup decryption key is not loaded on this device`                  | khóa tồn tại nhưng không hoạt động tại đây         | `openclaw matrix verify backup restore`; nếu vẫn không thể tải khóa, hãy chuyển khóa khôi phục qua pipe bằng `--recovery-key-stdin`                |
| `backup decryption key could not be loaded from secret storage (...)` | không thể tải kho bí mật hoặc tính năng này không được hỗ trợ | chuyển khóa khôi phục qua pipe: `printf '%s\n' "$MATRIX_RECOVERY_KEY" \| openclaw matrix verify backup restore --recovery-key-stdin`               |
| `backup key mismatch (...)`                                           | khóa đã lưu không khớp với bản sao lưu đang hoạt động trên máy chủ | chạy lại `verify backup restore --recovery-key-stdin` với khóa bản sao lưu đang hoạt động trên máy chủ, hoặc `verify backup reset --yes` để tạo mốc mới |
| `backup signature chain is not trusted by this device`                | thiết bị chưa tin cậy chuỗi ký chéo                | `verify device --recovery-key-stdin`, sau đó chạy `verify self` từ một ứng dụng khách đã xác minh khác nếu mức tin cậy vẫn chưa đầy đủ                        |
| `backup exists but is not active on this device`                      | có bản sao lưu trên máy chủ nhưng phiên cục bộ không hoạt động | xác minh thiết bị trước, sau đó kiểm tra lại bằng `openclaw matrix verify backup status`                                                         |
| `backup trust state could not be fully determined`                    | kết quả chẩn đoán chưa thể kết luận                 | `openclaw matrix verify status --verbose`                                                                                                 |

Các lỗi khôi phục khác:

`Matrix recovery key is required`

- Ý nghĩa: bạn đã thử một bước khôi phục mà không cung cấp khóa khôi phục khi khóa này là bắt buộc.
- Cách xử lý: chạy lại lệnh với `--recovery-key-stdin`, ví dụ `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`.

`Invalid Matrix recovery key: ...`

- Ý nghĩa: không thể phân tích cú pháp khóa được cung cấp hoặc khóa không khớp với định dạng dự kiến.
- Cách xử lý: thử lại bằng khóa khôi phục chính xác từ ứng dụng khách Matrix hoặc bản xuất khóa khôi phục của bạn.

`Matrix recovery key was applied, but this device still lacks full Matrix identity trust.`

- Ý nghĩa: khóa khôi phục đã mở khóa dữ liệu sao lưu có thể sử dụng, nhưng Matrix chưa thiết lập mức tin cậy danh tính ký chéo đầy đủ cho thiết bị này. Kiểm tra đầu ra của lệnh để tìm `Recovery key accepted`, `Backup usable`, `Cross-signing verified` và `Device verified by owner`.
- Cách xử lý: chạy `openclaw matrix verify self`, chấp nhận yêu cầu trong một ứng dụng khách Matrix khác, so sánh SAS và chỉ nhập `yes` khi SAS khớp. Chỉ dùng `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify bootstrap --recovery-key-stdin --force-reset-cross-signing` khi bạn chủ ý muốn thay thế danh tính ký chéo hiện tại.

Nếu bạn chấp nhận mất lịch sử mã hóa cũ không thể khôi phục, thay vào đó bạn có thể đặt lại
mốc sao lưu hiện tại bằng `openclaw matrix verify backup reset --yes`. Khi
bí mật sao lưu đã lưu bị hỏng, thao tác đặt lại đó cũng sửa kho bí mật để
khóa sao lưu mới có thể tải chính xác sau khi khởi động lại.

## Nếu lịch sử mã hóa vẫn không xuất hiện trở lại

Chạy các bước kiểm tra sau theo thứ tự:

```bash
openclaw matrix verify status --verbose
openclaw matrix verify backup status --verbose
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin --verbose
```

Nếu bản sao lưu được khôi phục thành công nhưng một số phòng cũ vẫn thiếu lịch sử, có thể các khóa bị thiếu đó chưa từng được plugin trước đây sao lưu.

## Nếu bạn muốn bắt đầu lại từ đầu cho các tin nhắn trong tương lai

Nếu bạn chấp nhận mất lịch sử mã hóa cũ không thể khôi phục và chỉ muốn có một mốc sao lưu sạch từ thời điểm này trở đi, hãy chạy các lệnh sau theo thứ tự:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

Nếu thiết bị vẫn chưa được xác minh sau đó, hãy hoàn tất quá trình xác minh từ ứng dụng khách Matrix bằng cách so sánh biểu tượng cảm xúc SAS hoặc mã thập phân và xác nhận rằng chúng khớp nhau.

## Liên quan

- [Matrix](/vi/channels/matrix): thiết lập và cấu hình kênh.
- [Quy tắc đẩy Matrix](/vi/channels/matrix-push-rules): định tuyến thông báo.
- [Doctor](/vi/gateway/doctor): kiểm tra tình trạng và trình kích hoạt di chuyển tự động.
- [Hướng dẫn di chuyển](/vi/install/migrating): tất cả các đường dẫn di chuyển (chuyển máy, nhập giữa các hệ thống).
- [Plugin](/vi/tools/plugin): cài đặt và đăng ký plugin.
