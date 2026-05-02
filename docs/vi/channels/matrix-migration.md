---
read_when:
    - Nâng cấp một bản cài đặt Matrix hiện có
    - Di chuyển lịch sử Matrix được mã hóa và trạng thái thiết bị
summary: Cách OpenClaw nâng cấp Plugin Matrix trước đó tại chỗ, bao gồm các giới hạn khôi phục trạng thái đã mã hóa và các bước khôi phục thủ công.
title: Di chuyển Matrix
x-i18n:
    generated_at: "2026-05-02T22:16:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8bc9b875fef0ae08978061a9fc7cbb076617009d79487ca8329e03076103b32c
    source_path: channels/matrix-migration.md
    workflow: 16
---

Nâng cấp từ Plugin `matrix` công khai trước đây lên bản triển khai hiện tại.

Với hầu hết người dùng, việc nâng cấp diễn ra tại chỗ:

- Plugin vẫn là `@openclaw/matrix`
- kênh vẫn là `matrix`
- cấu hình của bạn vẫn nằm trong `channels.matrix`
- thông tin xác thực đã lưu cache vẫn nằm trong `~/.openclaw/credentials/matrix/`
- trạng thái runtime vẫn nằm trong `~/.openclaw/matrix/`

Bạn không cần đổi tên khóa cấu hình hoặc cài đặt lại Plugin dưới tên mới.

## Quá trình di chuyển tự động làm gì

Khi Gateway khởi động, và khi bạn chạy [`openclaw doctor --fix`](/vi/gateway/doctor), OpenClaw cố gắng tự động sửa trạng thái Matrix cũ.
Trước khi bất kỳ bước di chuyển Matrix khả thi nào sửa đổi trạng thái trên đĩa, OpenClaw tạo hoặc tái sử dụng một snapshot khôi phục tập trung.

Khi bạn dùng `openclaw update`, trình kích hoạt chính xác phụ thuộc vào cách OpenClaw được cài đặt:

- bản cài đặt từ mã nguồn chạy `openclaw doctor --fix` trong luồng cập nhật, rồi mặc định khởi động lại Gateway
- bản cài đặt qua trình quản lý gói cập nhật gói, chạy một lượt doctor không tương tác, rồi dựa vào thao tác khởi động lại Gateway mặc định để quá trình khởi động hoàn tất di chuyển Matrix
- nếu bạn dùng `openclaw update --no-restart`, quá trình di chuyển Matrix dựa trên khởi động sẽ bị hoãn cho đến khi sau đó bạn chạy `openclaw doctor --fix` và khởi động lại Gateway

Quá trình di chuyển tự động bao gồm:

- tạo hoặc tái sử dụng snapshot trước di chuyển trong `~/Backups/openclaw-migrations/`
- tái sử dụng thông tin xác thực Matrix đã lưu cache của bạn
- giữ nguyên lựa chọn tài khoản và cấu hình `channels.matrix`
- di chuyển kho đồng bộ Matrix dạng phẳng cũ nhất vào vị trí theo phạm vi tài khoản hiện tại
- di chuyển kho crypto Matrix dạng phẳng cũ nhất vào vị trí theo phạm vi tài khoản hiện tại khi có thể xác định tài khoản đích một cách an toàn
- trích xuất khóa giải mã bản sao lưu khóa phòng Matrix đã lưu trước đó từ kho crypto Rust cũ, khi khóa đó tồn tại cục bộ
- tái sử dụng gốc lưu trữ token-hash đầy đủ nhất hiện có cho cùng tài khoản Matrix, homeserver và người dùng khi access token thay đổi sau này
- quét các gốc lưu trữ token-hash cùng cấp để tìm siêu dữ liệu khôi phục trạng thái mã hóa đang chờ xử lý khi access token Matrix thay đổi nhưng danh tính tài khoản/thiết bị vẫn giữ nguyên
- khôi phục các khóa phòng đã sao lưu vào kho crypto mới trong lần khởi động Matrix tiếp theo

Chi tiết snapshot:

- OpenClaw ghi một tệp đánh dấu tại `~/.openclaw/matrix/migration-snapshot.json` sau khi snapshot thành công để các lượt khởi động và sửa chữa sau này có thể tái sử dụng cùng kho lưu trữ.
- Các snapshot di chuyển Matrix tự động này chỉ sao lưu cấu hình + trạng thái (`includeWorkspace: false`).
- Nếu Matrix chỉ có trạng thái di chuyển dạng cảnh báo, ví dụ vì `userId` hoặc `accessToken` vẫn còn thiếu, OpenClaw chưa tạo snapshot vì chưa có thay đổi Matrix nào khả thi.
- Nếu bước snapshot thất bại, OpenClaw bỏ qua di chuyển Matrix cho lần chạy đó thay vì sửa đổi trạng thái mà không có điểm khôi phục.

Về nâng cấp nhiều tài khoản:

- kho Matrix dạng phẳng cũ nhất (`~/.openclaw/matrix/bot-storage.json` và `~/.openclaw/matrix/crypto/`) đến từ bố cục một kho, nên OpenClaw chỉ có thể di chuyển nó vào một đích tài khoản Matrix đã xác định
- các kho Matrix cũ đã theo phạm vi tài khoản được phát hiện và chuẩn bị cho từng tài khoản Matrix đã cấu hình

## Quá trình di chuyển không thể tự động làm gì

Plugin Matrix công khai trước đây **không** tự động tạo bản sao lưu khóa phòng Matrix. Nó lưu trạng thái crypto cục bộ và yêu cầu xác minh thiết bị, nhưng không đảm bảo rằng khóa phòng của bạn đã được sao lưu lên homeserver.

Điều đó có nghĩa là một số bản cài đặt mã hóa chỉ có thể được di chuyển một phần.

OpenClaw không thể tự động khôi phục:

- các khóa phòng chỉ có cục bộ và chưa từng được sao lưu
- trạng thái mã hóa khi tài khoản Matrix đích chưa thể được xác định vì `homeserver`, `userId`, hoặc `accessToken` vẫn chưa có
- di chuyển tự động một kho Matrix dạng phẳng dùng chung khi có nhiều tài khoản Matrix được cấu hình nhưng `channels.matrix.defaultAccount` chưa được đặt
- các bản cài đặt đường dẫn Plugin tùy chỉnh được ghim vào đường dẫn repo thay vì gói Matrix chuẩn
- khóa khôi phục bị thiếu khi kho cũ có khóa đã sao lưu nhưng không giữ khóa giải mã cục bộ

Phạm vi cảnh báo hiện tại:

- các bản cài đặt đường dẫn Plugin Matrix tùy chỉnh được cả quá trình khởi động Gateway và `openclaw doctor` hiển thị

Nếu bản cài đặt cũ của bạn có lịch sử mã hóa chỉ có cục bộ và chưa từng được sao lưu, một số tin nhắn mã hóa cũ hơn có thể vẫn không đọc được sau khi nâng cấp.

## Luồng nâng cấp được khuyến nghị

1. Cập nhật OpenClaw và Plugin Matrix như bình thường.
   Nên dùng `openclaw update` đơn giản, không có `--no-restart`, để quá trình khởi động có thể hoàn tất di chuyển Matrix ngay lập tức.
2. Chạy:

   ```bash
   openclaw doctor --fix
   ```

   Nếu Matrix có công việc di chuyển khả thi, doctor sẽ tạo hoặc tái sử dụng snapshot trước di chuyển trước và in đường dẫn kho lưu trữ.

3. Khởi động hoặc khởi động lại Gateway.
4. Kiểm tra trạng thái xác minh và sao lưu hiện tại:

   ```bash
   openclaw matrix verify status
   openclaw matrix verify backup status
   ```

5. Đặt khóa khôi phục cho tài khoản Matrix bạn đang sửa vào một biến môi trường riêng cho tài khoản. Với một tài khoản mặc định duy nhất, `MATRIX_RECOVERY_KEY` là được. Với nhiều tài khoản, hãy dùng một biến cho mỗi tài khoản, ví dụ `MATRIX_RECOVERY_KEY_ASSISTANT`, và thêm `--account assistant` vào lệnh.

6. Nếu OpenClaw cho biết cần khóa khôi phục, hãy chạy lệnh cho tài khoản tương ứng:

   ```bash
   printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
   printf '%s\n' "$MATRIX_RECOVERY_KEY_ASSISTANT" | openclaw matrix verify backup restore --recovery-key-stdin --account assistant
   ```

7. Nếu thiết bị này vẫn chưa được xác minh, hãy chạy lệnh cho tài khoản tương ứng:

   ```bash
   printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
   printf '%s\n' "$MATRIX_RECOVERY_KEY_ASSISTANT" | openclaw matrix verify device --recovery-key-stdin --account assistant
   ```

   Nếu khóa khôi phục được chấp nhận và bản sao lưu có thể dùng được, nhưng `Cross-signing verified`
   vẫn là `no`, hãy hoàn tất tự xác minh từ một client Matrix khác:

   ```bash
   openclaw matrix verify self
   ```

   Chấp nhận yêu cầu trong một client Matrix khác, so sánh emoji hoặc số thập phân,
   và chỉ nhập `yes` khi chúng khớp. Lệnh chỉ thoát thành công
   sau khi `Cross-signing verified` trở thành `yes`.

8. Nếu bạn cố ý từ bỏ lịch sử cũ không thể khôi phục và muốn một baseline sao lưu mới cho các tin nhắn trong tương lai, hãy chạy:

   ```bash
   openclaw matrix verify backup reset --yes
   ```

9. Nếu chưa có bản sao lưu khóa phía máy chủ, hãy tạo một bản cho các lần khôi phục trong tương lai:

   ```bash
   openclaw matrix verify bootstrap
   ```

## Cách di chuyển mã hóa hoạt động

Di chuyển mã hóa là một quá trình hai giai đoạn:

1. Khởi động hoặc `openclaw doctor --fix` tạo hoặc tái sử dụng snapshot trước di chuyển nếu di chuyển mã hóa là khả thi.
2. Khởi động hoặc `openclaw doctor --fix` kiểm tra kho crypto Matrix cũ thông qua bản cài đặt Plugin Matrix đang hoạt động.
3. Nếu tìm thấy khóa giải mã bản sao lưu, OpenClaw ghi nó vào luồng khóa khôi phục mới và đánh dấu khôi phục khóa phòng là đang chờ xử lý.
4. Trong lần khởi động Matrix tiếp theo, OpenClaw tự động khôi phục các khóa phòng đã sao lưu vào kho crypto mới.

Nếu kho cũ báo cáo các khóa phòng chưa từng được sao lưu, OpenClaw cảnh báo thay vì giả vờ rằng khôi phục đã thành công.

## Các thông báo thường gặp và ý nghĩa của chúng

### Thông báo nâng cấp và phát hiện

`Matrix plugin upgraded in place.`

- Ý nghĩa: trạng thái Matrix cũ trên đĩa đã được phát hiện và di chuyển vào bố cục hiện tại.
- Cần làm gì: không cần làm gì trừ khi cùng đầu ra cũng bao gồm cảnh báo.

`Matrix migration snapshot created before applying Matrix upgrades.`

- Ý nghĩa: OpenClaw đã tạo kho lưu trữ khôi phục trước khi sửa đổi trạng thái Matrix.
- Cần làm gì: giữ đường dẫn kho lưu trữ đã in cho đến khi bạn xác nhận di chuyển đã thành công.

`Matrix migration snapshot reused before applying Matrix upgrades.`

- Ý nghĩa: OpenClaw đã tìm thấy một dấu snapshot di chuyển Matrix hiện có và tái sử dụng kho lưu trữ đó thay vì tạo bản sao lưu trùng lặp.
- Cần làm gì: giữ đường dẫn kho lưu trữ đã in cho đến khi bạn xác nhận di chuyển đã thành công.

`Legacy Matrix state detected at ... but channels.matrix is not configured yet.`

- Ý nghĩa: trạng thái Matrix cũ tồn tại, nhưng OpenClaw không thể ánh xạ nó tới tài khoản Matrix hiện tại vì Matrix chưa được cấu hình.
- Cần làm gì: cấu hình `channels.matrix`, rồi chạy lại `openclaw doctor --fix` hoặc khởi động lại Gateway.

`Legacy Matrix state detected at ... but the new account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- Ý nghĩa: OpenClaw đã tìm thấy trạng thái cũ, nhưng vẫn không thể xác định chính xác gốc tài khoản/thiết bị hiện tại.
- Cần làm gì: khởi động Gateway một lần với thông tin đăng nhập Matrix hoạt động, hoặc chạy lại `openclaw doctor --fix` sau khi thông tin xác thực đã lưu cache tồn tại.

`Legacy Matrix state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- Ý nghĩa: OpenClaw đã tìm thấy một kho Matrix dạng phẳng dùng chung, nhưng từ chối đoán tài khoản Matrix có tên nào sẽ nhận nó.
- Cần làm gì: đặt `channels.matrix.defaultAccount` thành tài khoản dự định, rồi chạy lại `openclaw doctor --fix` hoặc khởi động lại Gateway.

`Matrix legacy sync store not migrated because the target already exists (...)`

- Ý nghĩa: vị trí theo phạm vi tài khoản mới đã có kho đồng bộ hoặc kho crypto, nên OpenClaw không tự động ghi đè.
- Cần làm gì: xác minh rằng tài khoản hiện tại là tài khoản đúng trước khi xóa hoặc di chuyển đích xung đột theo cách thủ công.

`Failed migrating Matrix legacy sync store (...)` hoặc `Failed migrating Matrix legacy crypto store (...)`

- Ý nghĩa: OpenClaw đã cố di chuyển trạng thái Matrix cũ nhưng thao tác hệ thống tệp thất bại.
- Cần làm gì: kiểm tra quyền hệ thống tệp và trạng thái đĩa, rồi chạy lại `openclaw doctor --fix`.

`Legacy Matrix encrypted state detected at ... but channels.matrix is not configured yet.`

- Ý nghĩa: OpenClaw đã tìm thấy một kho Matrix mã hóa cũ, nhưng không có cấu hình Matrix hiện tại để gắn nó vào.
- Cần làm gì: cấu hình `channels.matrix`, rồi chạy lại `openclaw doctor --fix` hoặc khởi động lại Gateway.

`Legacy Matrix encrypted state detected at ... but the account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- Ý nghĩa: kho mã hóa tồn tại, nhưng OpenClaw không thể quyết định an toàn nó thuộc về tài khoản/thiết bị hiện tại nào.
- Cần làm gì: khởi động Gateway một lần với thông tin đăng nhập Matrix hoạt động, hoặc chạy lại `openclaw doctor --fix` sau khi thông tin xác thực đã lưu cache có sẵn.

`Legacy Matrix encrypted state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- Ý nghĩa: OpenClaw đã tìm thấy một kho crypto cũ dạng phẳng dùng chung, nhưng từ chối đoán tài khoản Matrix có tên nào sẽ nhận nó.
- Cần làm gì: đặt `channels.matrix.defaultAccount` thành tài khoản dự định, rồi chạy lại `openclaw doctor --fix` hoặc khởi động lại Gateway.

`Matrix migration warnings are present, but no on-disk Matrix mutation is actionable yet. No pre-migration snapshot was needed.`

- Ý nghĩa: OpenClaw đã phát hiện trạng thái Matrix cũ, nhưng quá trình di chuyển vẫn bị chặn do thiếu dữ liệu danh tính hoặc thông tin xác thực.
- Cần làm gì: hoàn tất đăng nhập Matrix hoặc thiết lập cấu hình, rồi chạy lại `openclaw doctor --fix` hoặc khởi động lại Gateway.

`Legacy Matrix encrypted state was detected, but the Matrix plugin helper is unavailable. Install or repair @openclaw/matrix so OpenClaw can inspect the old rust crypto store before upgrading.`

- Ý nghĩa: OpenClaw đã tìm thấy trạng thái Matrix mã hóa cũ, nhưng không thể tải entrypoint helper từ Plugin Matrix thường dùng để kiểm tra kho đó.
- Cần làm gì: cài đặt lại hoặc sửa Plugin Matrix (`openclaw plugins install @openclaw/matrix`, hoặc `openclaw plugins install ./path/to/local/matrix-plugin` cho một repo checkout), rồi chạy lại `openclaw doctor --fix` hoặc khởi động lại Gateway.

`Matrix plugin helper path is unsafe: ... Reinstall @openclaw/matrix and try again.`

- Ý nghĩa: OpenClaw đã tìm thấy một đường dẫn tệp helper thoát khỏi gốc Plugin hoặc không vượt qua kiểm tra ranh giới Plugin, nên đã từ chối import tệp đó.
- Việc cần làm: cài đặt lại Plugin Matrix từ một đường dẫn đáng tin cậy, rồi chạy lại `openclaw doctor --fix` hoặc khởi động lại gateway.

`- Failed creating a Matrix migration snapshot before repair: ...`

`- Skipping Matrix migration changes for now. Resolve the snapshot failure, then rerun "openclaw doctor --fix".`

- Ý nghĩa: OpenClaw đã từ chối thay đổi trạng thái Matrix vì trước tiên không thể tạo snapshot khôi phục.
- Việc cần làm: xử lý lỗi sao lưu, rồi chạy lại `openclaw doctor --fix` hoặc khởi động lại gateway.

`Failed migrating legacy Matrix client storage: ...`

- Ý nghĩa: fallback phía client Matrix đã tìm thấy bộ lưu trữ phẳng cũ, nhưng việc di chuyển thất bại. OpenClaw hiện hủy fallback đó thay vì âm thầm khởi động với một store mới.
- Việc cần làm: kiểm tra quyền hoặc xung đột trên hệ thống tệp, giữ nguyên trạng thái cũ và thử lại sau khi sửa lỗi.

`Matrix is installed from a custom path: ...`

- Ý nghĩa: Matrix được ghim vào một bản cài đặt theo đường dẫn, nên các bản cập nhật mainline không tự động thay thế nó bằng gói Matrix chuẩn của repo.
- Việc cần làm: cài đặt lại bằng `openclaw plugins install @openclaw/matrix` khi bạn muốn quay lại Plugin Matrix mặc định.

### Thông báo khôi phục trạng thái được mã hóa

`matrix: restored X/Y room key(s) from legacy encrypted-state backup`

- Ý nghĩa: các room key đã sao lưu được khôi phục thành công vào crypto store mới.
- Việc cần làm: thường không cần làm gì.

`matrix: N legacy local-only room key(s) were never backed up and could not be restored automatically`

- Ý nghĩa: một số room key cũ chỉ tồn tại trong store cục bộ cũ và chưa từng được tải lên bản sao lưu Matrix.
- Việc cần làm: dự kiến một số lịch sử được mã hóa cũ vẫn sẽ không khả dụng, trừ khi bạn có thể khôi phục các key đó thủ công từ một client đã xác minh khác.

`Legacy Matrix encrypted state for account "..." has backed-up room keys, but no local backup decryption key was found. Ask the operator to run "openclaw matrix verify backup restore --recovery-key-stdin" after upgrade if they have the recovery key.`

- Ý nghĩa: bản sao lưu tồn tại, nhưng OpenClaw không thể tự động khôi phục recovery key.
- Việc cần làm: chạy `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin`.

`Failed inspecting legacy Matrix encrypted state for account "..." (...): ...`

- Ý nghĩa: OpenClaw đã tìm thấy store được mã hóa cũ, nhưng không thể kiểm tra nó đủ an toàn để chuẩn bị khôi phục.
- Việc cần làm: chạy lại `openclaw doctor --fix`. Nếu lỗi lặp lại, giữ nguyên thư mục trạng thái cũ và khôi phục bằng một client Matrix đã xác minh khác cùng với `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin`.

`Legacy Matrix backup key was found for account "...", but .../recovery-key.json already contains a different recovery key. Leaving the existing file unchanged.`

- Ý nghĩa: OpenClaw phát hiện xung đột backup key và từ chối tự động ghi đè tệp recovery-key hiện tại.
- Việc cần làm: xác minh recovery key nào là đúng trước khi thử lại bất kỳ lệnh khôi phục nào.

`Legacy Matrix encrypted state for account "..." cannot be fully converted automatically because the old rust crypto store does not expose all local room keys for export.`

- Ý nghĩa: đây là giới hạn cứng của định dạng lưu trữ cũ.
- Việc cần làm: các key đã sao lưu vẫn có thể được khôi phục, nhưng lịch sử được mã hóa chỉ có cục bộ có thể vẫn không khả dụng.

`matrix: failed restoring room keys from legacy encrypted-state backup: ...`

- Ý nghĩa: Plugin mới đã thử khôi phục nhưng Matrix trả về lỗi.
- Việc cần làm: chạy `openclaw matrix verify backup status`, rồi thử lại với `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin` nếu cần.

### Thông báo khôi phục thủ công

`Backup key is not loaded on this device. Run 'openclaw matrix verify backup restore' to load it and restore old room keys.`

- Ý nghĩa: OpenClaw biết bạn cần có backup key, nhưng key đó chưa hoạt động trên thiết bị này.
- Việc cần làm: chạy `openclaw matrix verify backup restore`, hoặc đặt `MATRIX_RECOVERY_KEY` và chạy `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin` nếu cần.

`Store a recovery key with 'openclaw matrix verify device --recovery-key-stdin', then run 'openclaw matrix verify backup restore'.`

- Ý nghĩa: thiết bị này hiện chưa lưu recovery key.
- Việc cần làm: đặt `MATRIX_RECOVERY_KEY`, chạy `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`, rồi khôi phục bản sao lưu.

`Backup key mismatch on this device. Re-run 'openclaw matrix verify device --recovery-key-stdin' with the matching recovery key.`

- Ý nghĩa: key đã lưu không khớp với bản sao lưu Matrix đang hoạt động.
- Việc cần làm: đặt `MATRIX_RECOVERY_KEY` thành key chính xác và chạy `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`.

Nếu bạn chấp nhận mất lịch sử được mã hóa cũ không thể khôi phục, thay vào đó bạn có thể đặt lại
baseline sao lưu hiện tại bằng `openclaw matrix verify backup reset --yes`. Khi
secret sao lưu đã lưu bị hỏng, thao tác đặt lại đó cũng có thể tạo lại secret storage để
backup key mới có thể tải đúng sau khi khởi động lại.

`Backup trust chain is not verified on this device. Re-run 'openclaw matrix verify device --recovery-key-stdin'.`

- Ý nghĩa: bản sao lưu tồn tại, nhưng thiết bị này chưa tin cậy chuỗi cross-signing đủ mạnh.
- Việc cần làm: đặt `MATRIX_RECOVERY_KEY` và chạy `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`.

`Matrix recovery key is required`

- Ý nghĩa: bạn đã thử một bước khôi phục mà không cung cấp recovery key trong khi key đó là bắt buộc.
- Việc cần làm: chạy lại lệnh với `--recovery-key-stdin`, ví dụ `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`.

`Invalid Matrix recovery key: ...`

- Ý nghĩa: key được cung cấp không thể phân tích cú pháp hoặc không khớp định dạng mong đợi.
- Việc cần làm: thử lại bằng recovery key chính xác từ client Matrix hoặc tệp recovery-key của bạn.

`Matrix recovery key was applied, but this device still lacks full Matrix identity trust.`

- Ý nghĩa: OpenClaw có thể áp dụng recovery key, nhưng Matrix vẫn chưa
  thiết lập đầy đủ mức tin cậy danh tính cross-signing cho thiết bị này. Kiểm tra
  đầu ra lệnh để tìm `Recovery key accepted`, `Backup usable`,
  `Cross-signing verified` và `Device verified by owner`.
- Việc cần làm: chạy `openclaw matrix verify self`, chấp nhận yêu cầu trong một
  client Matrix khác, so sánh SAS, và chỉ nhập `yes` khi khớp. Lệnh
  sẽ chờ mức tin cậy danh tính Matrix đầy đủ trước khi báo thành công. Chỉ dùng
  `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify bootstrap --recovery-key-stdin --force-reset-cross-signing`
  khi bạn cố ý muốn thay thế danh tính cross-signing hiện tại.

`Matrix key backup is not active on this device after loading from secret storage.`

- Ý nghĩa: secret storage không tạo ra phiên sao lưu đang hoạt động trên thiết bị này.
- Việc cần làm: xác minh thiết bị trước, rồi kiểm tra lại bằng `openclaw matrix verify backup status`.

`Matrix crypto backend cannot load backup keys from secret storage. Verify this device with 'openclaw matrix verify device --recovery-key-stdin' first.`

- Ý nghĩa: thiết bị này không thể khôi phục từ secret storage cho đến khi hoàn tất xác minh thiết bị.
- Việc cần làm: trước tiên chạy `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`.

### Thông báo cài đặt Plugin tùy chỉnh

`Matrix is installed from a custom path that no longer exists: ...`

- Ý nghĩa: bản ghi cài đặt Plugin của bạn trỏ đến một đường dẫn cục bộ không còn tồn tại.
- Việc cần làm: cài đặt lại bằng `openclaw plugins install @openclaw/matrix`, hoặc nếu bạn đang chạy từ một repo checkout, `openclaw plugins install ./path/to/local/matrix-plugin`.

## Nếu lịch sử được mã hóa vẫn không quay lại

Chạy các kiểm tra này theo thứ tự:

```bash
openclaw matrix verify status --verbose
openclaw matrix verify backup status --verbose
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin --verbose
```

Nếu bản sao lưu khôi phục thành công nhưng một số phòng cũ vẫn thiếu lịch sử, các key bị thiếu đó có thể chưa từng được Plugin trước đó sao lưu.

## Nếu bạn muốn bắt đầu mới cho các tin nhắn trong tương lai

Nếu bạn chấp nhận mất lịch sử được mã hóa cũ không thể khôi phục và chỉ muốn có một baseline sao lưu sạch từ nay về sau, hãy chạy các lệnh này theo thứ tự:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

Nếu thiết bị vẫn chưa được xác minh sau đó, hãy hoàn tất xác minh từ client Matrix của bạn bằng cách so sánh emoji SAS hoặc mã thập phân và xác nhận rằng chúng khớp.

## Liên quan

- [Matrix](/vi/channels/matrix): thiết lập và cấu hình kênh.
- [Matrix push rules](/vi/channels/matrix-push-rules): định tuyến thông báo.
- [Doctor](/vi/gateway/doctor): kiểm tra sức khỏe và kích hoạt migration tự động.
- [Migration guide](/vi/install/migrating): tất cả đường dẫn migration (di chuyển máy, import giữa các hệ thống).
- [Plugin](/vi/tools/plugin): cài đặt và đăng ký Plugin.
