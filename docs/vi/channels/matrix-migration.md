---
read_when:
    - Nâng cấp một bản cài đặt Matrix hiện có
    - Di chuyển lịch sử Matrix đã mã hóa và trạng thái thiết bị
summary: Cách OpenClaw nâng cấp Plugin Matrix trước đó tại chỗ, bao gồm các giới hạn khôi phục trạng thái đã mã hóa và các bước khôi phục thủ công.
title: Di chuyển Matrix
x-i18n:
    generated_at: "2026-06-27T17:11:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 796d27aa3f08388b78e005d5e93ee4a04bc9ae9bb1f214b83c3ba19165042755
    source_path: channels/matrix-migration.md
    workflow: 16
---

Nâng cấp từ Plugin `matrix` công khai trước đây lên triển khai hiện tại.

Với hầu hết người dùng, việc nâng cấp diễn ra tại chỗ:

- Plugin vẫn là `@openclaw/matrix`
- kênh vẫn là `matrix`
- cấu hình của bạn vẫn nằm dưới `channels.matrix`
- thông tin xác thực đã lưu trong bộ nhớ đệm vẫn nằm dưới `~/.openclaw/credentials/matrix/`
- trạng thái runtime vẫn nằm dưới `~/.openclaw/matrix/`

Bạn không cần đổi tên khóa cấu hình hoặc cài đặt lại Plugin dưới tên mới.
Gói gốc `openclaw` không còn đóng gói mã runtime Matrix hoặc các phụ thuộc Matrix SDK.
Nếu `openclaw channels status` cho thấy Matrix đã được cấu hình nhưng Plugin bị thiếu sau khi cập nhật, hãy chạy `openclaw doctor --fix` hoặc
`openclaw plugins install @openclaw/matrix`; đừng cài các gói Matrix SDK
vào gói OpenClaw gốc.

## Quá trình di chuyển tự động làm gì

Khi Gateway khởi động, và khi bạn chạy [`openclaw doctor --fix`](/vi/gateway/doctor), OpenClaw cố gắng tự động sửa trạng thái Matrix cũ.
Trước khi bất kỳ bước di chuyển Matrix có thể thực hiện nào thay đổi trạng thái trên đĩa, OpenClaw tạo hoặc tái sử dụng một bản chụp khôi phục tập trung.

Khi bạn dùng `openclaw update`, điều kiện kích hoạt chính xác phụ thuộc vào cách OpenClaw được cài đặt:

- các bản cài từ nguồn chạy `openclaw doctor --fix` trong luồng cập nhật, rồi mặc định khởi động lại Gateway
- các bản cài qua trình quản lý gói cập nhật gói, chạy một lượt doctor không tương tác, rồi dựa vào lần khởi động lại Gateway mặc định để quá trình khởi động có thể hoàn tất di chuyển Matrix
- nếu bạn dùng `openclaw update --no-restart`, quá trình di chuyển Matrix dựa trên khởi động sẽ bị hoãn cho đến khi bạn chạy `openclaw doctor --fix` sau đó và khởi động lại Gateway

Quá trình di chuyển tự động bao gồm:

- tạo hoặc tái sử dụng bản chụp trước di chuyển dưới `~/Backups/openclaw-migrations/`
- tái sử dụng thông tin xác thực Matrix đã lưu trong bộ nhớ đệm của bạn
- giữ nguyên lựa chọn tài khoản và cấu hình `channels.matrix`
- di chuyển kho đồng bộ Matrix phẳng cũ nhất vào vị trí hiện tại theo phạm vi tài khoản
- di chuyển kho crypto Matrix phẳng cũ nhất vào vị trí hiện tại theo phạm vi tài khoản khi tài khoản đích có thể được phân giải an toàn
- trích xuất khóa giải mã bản sao lưu room-key Matrix đã lưu trước đó từ kho rust crypto cũ, khi khóa đó tồn tại cục bộ
- tái sử dụng gốc lưu trữ token-hash hoàn chỉnh nhất hiện có cho cùng tài khoản Matrix, homeserver và người dùng khi access token thay đổi sau này
- quét các gốc lưu trữ token-hash cùng cấp để tìm siêu dữ liệu khôi phục trạng thái mã hóa đang chờ xử lý khi access token Matrix đã thay đổi nhưng danh tính tài khoản/thiết bị vẫn giữ nguyên
- khôi phục room key đã sao lưu vào kho crypto mới trong lần khởi động Matrix tiếp theo

Chi tiết bản chụp:

- OpenClaw ghi một tệp đánh dấu tại `~/.openclaw/matrix/migration-snapshot.json` sau khi tạo bản chụp thành công để các lượt khởi động và sửa chữa sau này có thể tái sử dụng cùng một tệp lưu trữ.
- Các bản chụp di chuyển Matrix tự động này chỉ sao lưu cấu hình + trạng thái (`includeWorkspace: false`).
- Nếu Matrix chỉ có trạng thái di chuyển dạng cảnh báo, ví dụ vì vẫn thiếu `userId` hoặc `accessToken`, OpenClaw chưa tạo bản chụp vì chưa có thay đổi Matrix nào có thể thực hiện.
- Nếu bước tạo bản chụp thất bại, OpenClaw bỏ qua di chuyển Matrix cho lượt chạy đó thay vì thay đổi trạng thái mà không có điểm khôi phục.

Về nâng cấp nhiều tài khoản:

- kho Matrix phẳng cũ nhất (`~/.openclaw/matrix/bot-storage.json` và `~/.openclaw/matrix/crypto/`) xuất phát từ bố cục một kho duy nhất, nên OpenClaw chỉ có thể di chuyển nó vào một đích tài khoản Matrix đã phân giải
- các kho Matrix kế thừa đã theo phạm vi tài khoản được phát hiện và chuẩn bị cho từng tài khoản Matrix đã cấu hình

## Quá trình di chuyển không thể tự động làm gì

Plugin Matrix công khai trước đây **không** tự động tạo bản sao lưu room-key Matrix. Nó lưu giữ trạng thái crypto cục bộ và yêu cầu xác minh thiết bị, nhưng không đảm bảo room key của bạn đã được sao lưu lên homeserver.

Điều đó có nghĩa là một số bản cài có mã hóa chỉ có thể được di chuyển một phần.

OpenClaw không thể tự động khôi phục:

- room key chỉ có cục bộ và chưa từng được sao lưu
- trạng thái mã hóa khi tài khoản Matrix đích chưa thể được phân giải vì `homeserver`, `userId`, hoặc `accessToken` vẫn chưa có
- tự động di chuyển một kho Matrix phẳng dùng chung khi nhiều tài khoản Matrix được cấu hình nhưng `channels.matrix.defaultAccount` chưa được đặt
- các bản cài Plugin theo đường dẫn tùy chỉnh được ghim vào đường dẫn repo thay vì gói Matrix tiêu chuẩn
- khóa khôi phục bị thiếu khi kho cũ có các khóa đã sao lưu nhưng không giữ khóa giải mã cục bộ

Phạm vi cảnh báo hiện tại:

- các bản cài Plugin Matrix theo đường dẫn tùy chỉnh được hiển thị bởi cả quá trình khởi động Gateway và `openclaw doctor`

Nếu bản cài cũ của bạn có lịch sử mã hóa chỉ có cục bộ và chưa từng được sao lưu, một số tin nhắn mã hóa cũ hơn có thể vẫn không đọc được sau khi nâng cấp.

## Luồng nâng cấp được khuyến nghị

1. Cập nhật OpenClaw và Plugin Matrix như bình thường.
   Nên dùng `openclaw update` thuần túy, không có `--no-restart`, để quá trình khởi động có thể hoàn tất di chuyển Matrix ngay lập tức.
2. Chạy:

   ```bash
   openclaw doctor --fix
   ```

   Nếu Matrix có công việc di chuyển có thể thực hiện, doctor sẽ tạo hoặc tái sử dụng bản chụp trước di chuyển trước và in đường dẫn tệp lưu trữ.

3. Khởi động hoặc khởi động lại Gateway.
4. Kiểm tra trạng thái xác minh và sao lưu hiện tại:

   ```bash
   openclaw matrix verify status
   openclaw matrix verify backup status
   ```

5. Đặt khóa khôi phục cho tài khoản Matrix bạn đang sửa vào biến môi trường riêng cho tài khoản. Với một tài khoản mặc định duy nhất, `MATRIX_RECOVERY_KEY` là đủ. Với nhiều tài khoản, dùng một biến cho mỗi tài khoản, ví dụ `MATRIX_RECOVERY_KEY_ASSISTANT`, và thêm `--account assistant` vào lệnh.

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

   Nếu khóa khôi phục được chấp nhận và bản sao lưu dùng được, nhưng `Cross-signing verified`
   vẫn là `no`, hãy hoàn tất tự xác minh từ một ứng dụng Matrix khác:

   ```bash
   openclaw matrix verify self
   ```

   Chấp nhận yêu cầu trong một ứng dụng Matrix khác, so sánh emoji hoặc số thập phân,
   và chỉ nhập `yes` khi chúng khớp. Lệnh chỉ thoát thành công
   sau khi `Cross-signing verified` trở thành `yes`.

8. Nếu bạn chủ ý từ bỏ lịch sử cũ không thể khôi phục và muốn một đường cơ sở sao lưu mới cho các tin nhắn tương lai, hãy chạy:

   ```bash
   openclaw matrix verify backup reset --yes
   ```

9. Nếu chưa có bản sao lưu khóa phía máy chủ, hãy tạo một bản cho các lần khôi phục trong tương lai:

   ```bash
   openclaw matrix verify bootstrap
   ```

## Cách di chuyển dữ liệu mã hóa hoạt động

Di chuyển dữ liệu mã hóa là quy trình hai giai đoạn:

1. Khởi động hoặc `openclaw doctor --fix` tạo hoặc tái sử dụng bản chụp trước di chuyển nếu di chuyển dữ liệu mã hóa có thể thực hiện.
2. Khởi động hoặc `openclaw doctor --fix` kiểm tra kho crypto Matrix cũ thông qua bản cài Plugin Matrix đang hoạt động.
3. Nếu tìm thấy khóa giải mã bản sao lưu, OpenClaw ghi khóa đó vào luồng recovery-key mới và đánh dấu khôi phục room-key là đang chờ.
4. Trong lần khởi động Matrix tiếp theo, OpenClaw tự động khôi phục room key đã sao lưu vào kho crypto mới.

Nếu kho cũ báo cáo các room key chưa từng được sao lưu, OpenClaw cảnh báo thay vì giả vờ rằng việc khôi phục đã thành công.

## Các thông báo thường gặp và ý nghĩa của chúng

### Thông báo nâng cấp và phát hiện

`Matrix plugin upgraded in place.`

- Ý nghĩa: trạng thái Matrix cũ trên đĩa đã được phát hiện và di chuyển vào bố cục hiện tại.
- Việc cần làm: không cần làm gì trừ khi cùng đầu ra cũng có cảnh báo.

`Matrix migration snapshot created before applying Matrix upgrades.`

- Ý nghĩa: OpenClaw đã tạo một tệp lưu trữ khôi phục trước khi thay đổi trạng thái Matrix.
- Việc cần làm: giữ đường dẫn tệp lưu trữ được in ra cho đến khi bạn xác nhận di chuyển đã thành công.

`Matrix migration snapshot reused before applying Matrix upgrades.`

- Ý nghĩa: OpenClaw tìm thấy một dấu mốc bản chụp di chuyển Matrix hiện có và tái sử dụng tệp lưu trữ đó thay vì tạo bản sao lưu trùng lặp.
- Việc cần làm: giữ đường dẫn tệp lưu trữ được in ra cho đến khi bạn xác nhận di chuyển đã thành công.

`Legacy Matrix state detected at ... but channels.matrix is not configured yet.`

- Ý nghĩa: trạng thái Matrix cũ tồn tại, nhưng OpenClaw không thể ánh xạ nó tới tài khoản Matrix hiện tại vì Matrix chưa được cấu hình.
- Việc cần làm: cấu hình `channels.matrix`, rồi chạy lại `openclaw doctor --fix` hoặc khởi động lại Gateway.

`Legacy Matrix state detected at ... but the new account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- Ý nghĩa: OpenClaw tìm thấy trạng thái cũ, nhưng vẫn chưa thể xác định chính xác gốc tài khoản/thiết bị hiện tại.
- Việc cần làm: khởi động Gateway một lần với đăng nhập Matrix hoạt động, hoặc chạy lại `openclaw doctor --fix` sau khi thông tin xác thực đã được lưu trong bộ nhớ đệm.

`Legacy Matrix state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- Ý nghĩa: OpenClaw tìm thấy một kho Matrix phẳng dùng chung, nhưng từ chối đoán tài khoản Matrix được đặt tên nào sẽ nhận nó.
- Việc cần làm: đặt `channels.matrix.defaultAccount` thành tài khoản dự định, rồi chạy lại `openclaw doctor --fix` hoặc khởi động lại Gateway.

`Matrix legacy sync store not migrated because the target already exists (...)`

- Ý nghĩa: vị trí mới theo phạm vi tài khoản đã có kho sync hoặc crypto, nên OpenClaw không tự động ghi đè.
- Việc cần làm: xác minh rằng tài khoản hiện tại là tài khoản đúng trước khi xóa hoặc di chuyển thủ công đích xung đột.

`Failed migrating Matrix legacy sync store (...)` or `Failed migrating Matrix legacy crypto store (...)`

- Ý nghĩa: OpenClaw đã cố di chuyển trạng thái Matrix cũ nhưng thao tác hệ thống tệp thất bại.
- Việc cần làm: kiểm tra quyền hệ thống tệp và trạng thái đĩa, rồi chạy lại `openclaw doctor --fix`.

`Legacy Matrix encrypted state detected at ... but channels.matrix is not configured yet.`

- Ý nghĩa: OpenClaw tìm thấy một kho Matrix mã hóa cũ, nhưng không có cấu hình Matrix hiện tại để gắn nó vào.
- Việc cần làm: cấu hình `channels.matrix`, rồi chạy lại `openclaw doctor --fix` hoặc khởi động lại Gateway.

`Legacy Matrix encrypted state detected at ... but the account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- Ý nghĩa: kho mã hóa tồn tại, nhưng OpenClaw không thể quyết định an toàn nó thuộc về tài khoản/thiết bị hiện tại nào.
- Việc cần làm: khởi động Gateway một lần với đăng nhập Matrix hoạt động, hoặc chạy lại `openclaw doctor --fix` sau khi thông tin xác thực đã có sẵn trong bộ nhớ đệm.

`Legacy Matrix encrypted state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- Ý nghĩa: OpenClaw tìm thấy một kho crypto kế thừa phẳng dùng chung, nhưng từ chối đoán tài khoản Matrix được đặt tên nào sẽ nhận nó.
- Việc cần làm: đặt `channels.matrix.defaultAccount` thành tài khoản dự định, rồi chạy lại `openclaw doctor --fix` hoặc khởi động lại Gateway.

`Matrix migration warnings are present, but no on-disk Matrix mutation is actionable yet. No pre-migration snapshot was needed.`

- Ý nghĩa: OpenClaw phát hiện trạng thái Matrix cũ, nhưng quá trình di chuyển vẫn bị chặn do thiếu dữ liệu danh tính hoặc thông tin xác thực.
- Việc cần làm: hoàn tất đăng nhập Matrix hoặc thiết lập cấu hình, rồi chạy lại `openclaw doctor --fix` hoặc khởi động lại Gateway.

`Legacy Matrix encrypted state was detected, but the Matrix plugin helper is unavailable. Install or repair @openclaw/matrix so OpenClaw can inspect the old rust crypto store before upgrading.`

- Ý nghĩa: OpenClaw đã tìm thấy trạng thái Matrix được mã hóa cũ, nhưng không thể tải entrypoint trợ giúp từ Plugin Matrix vốn thường kiểm tra kho lưu trữ đó.
- Việc cần làm: cài đặt lại hoặc sửa Plugin Matrix (`openclaw plugins install @openclaw/matrix`, hoặc `openclaw plugins install ./path/to/local/matrix-plugin` cho một repo checkout), rồi chạy lại `openclaw doctor --fix` hoặc khởi động lại Gateway.

`Matrix plugin helper path is unsafe: ... Reinstall @openclaw/matrix and try again.`

- Ý nghĩa: OpenClaw đã tìm thấy đường dẫn tệp trợ giúp thoát khỏi gốc Plugin hoặc không vượt qua kiểm tra ranh giới Plugin, nên đã từ chối import tệp đó.
- Việc cần làm: cài đặt lại Plugin Matrix từ một đường dẫn đáng tin cậy, rồi chạy lại `openclaw doctor --fix` hoặc khởi động lại Gateway.

`- Failed creating a Matrix migration snapshot before repair: ...`

`- Skipping Matrix migration changes for now. Resolve the snapshot failure, then rerun "openclaw doctor --fix".`

- Ý nghĩa: OpenClaw đã từ chối thay đổi trạng thái Matrix vì trước đó không thể tạo snapshot khôi phục.
- Việc cần làm: xử lý lỗi sao lưu, rồi chạy lại `openclaw doctor --fix` hoặc khởi động lại Gateway.

`Failed migrating legacy Matrix client storage: ...`

- Ý nghĩa: fallback phía client Matrix đã tìm thấy kho lưu trữ phẳng cũ, nhưng việc di chuyển thất bại. Giờ đây OpenClaw hủy fallback đó thay vì âm thầm khởi động với một kho lưu trữ mới.
- Việc cần làm: kiểm tra quyền hoặc xung đột trên hệ thống tệp, giữ nguyên trạng thái cũ và thử lại sau khi sửa lỗi.

`Matrix is installed from a custom path: ...`

- Ý nghĩa: Matrix đang được ghim vào một cài đặt theo đường dẫn, nên các bản cập nhật mainline sẽ không tự động thay thế nó bằng gói Matrix tiêu chuẩn của repo.
- Việc cần làm: cài đặt lại bằng `openclaw plugins install @openclaw/matrix` khi bạn muốn quay lại Plugin Matrix mặc định.

### Thông báo khôi phục trạng thái được mã hóa

`matrix: restored X/Y room key(s) from legacy encrypted-state backup`

- Ý nghĩa: các khóa phòng đã sao lưu được khôi phục thành công vào kho crypto mới.
- Việc cần làm: thường là không cần làm gì.

`matrix: N legacy local-only room key(s) were never backed up and could not be restored automatically`

- Ý nghĩa: một số khóa phòng cũ chỉ tồn tại trong kho cục bộ cũ và chưa từng được tải lên bản sao lưu Matrix.
- Việc cần làm: dự kiến một phần lịch sử mã hóa cũ sẽ vẫn không khả dụng, trừ khi bạn có thể khôi phục các khóa đó thủ công từ một client đã xác minh khác.

`Legacy Matrix encrypted state for account "..." has backed-up room keys, but no local backup decryption key was found. Ask the operator to run "openclaw matrix verify backup restore --recovery-key-stdin" after upgrade if they have the recovery key.`

- Ý nghĩa: bản sao lưu tồn tại, nhưng OpenClaw không thể tự động khôi phục khóa khôi phục.
- Việc cần làm: chạy `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin`.

`Failed inspecting legacy Matrix encrypted state for account "..." (...): ...`

- Ý nghĩa: OpenClaw đã tìm thấy kho mã hóa cũ, nhưng không thể kiểm tra nó đủ an toàn để chuẩn bị khôi phục.
- Việc cần làm: chạy lại `openclaw doctor --fix`. Nếu lỗi lặp lại, giữ nguyên thư mục trạng thái cũ và khôi phục bằng một client Matrix đã xác minh khác cộng với `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin`.

`Legacy Matrix backup key was found for account "...", but .../recovery-key.json already contains a different recovery key. Leaving the existing file unchanged.`

- Ý nghĩa: OpenClaw phát hiện xung đột khóa sao lưu và từ chối tự động ghi đè tệp recovery-key hiện tại.
- Việc cần làm: xác minh khóa khôi phục nào là đúng trước khi thử lại bất kỳ lệnh khôi phục nào.

`Legacy Matrix encrypted state for account "..." cannot be fully converted automatically because the old rust crypto store does not expose all local room keys for export.`

- Ý nghĩa: đây là giới hạn cứng của định dạng lưu trữ cũ.
- Việc cần làm: các khóa đã sao lưu vẫn có thể được khôi phục, nhưng lịch sử mã hóa chỉ có cục bộ có thể vẫn không khả dụng.

`matrix: failed restoring room keys from legacy encrypted-state backup: ...`

- Ý nghĩa: Plugin mới đã thử khôi phục nhưng Matrix trả về lỗi.
- Việc cần làm: chạy `openclaw matrix verify backup status`, rồi thử lại bằng `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin` nếu cần.

### Thông báo khôi phục thủ công

`Backup key is not loaded on this device. Run 'openclaw matrix verify backup restore' to load it and restore old room keys.`

- Ý nghĩa: OpenClaw biết bạn nên có khóa sao lưu, nhưng khóa đó chưa hoạt động trên thiết bị này.
- Việc cần làm: chạy `openclaw matrix verify backup restore`, hoặc đặt `MATRIX_RECOVERY_KEY` và chạy `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin` nếu cần.

`Store a recovery key with 'openclaw matrix verify device --recovery-key-stdin', then run 'openclaw matrix verify backup restore'.`

- Ý nghĩa: thiết bị này hiện chưa lưu khóa khôi phục.
- Việc cần làm: đặt `MATRIX_RECOVERY_KEY`, chạy `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`, rồi khôi phục bản sao lưu.

`Backup key mismatch on this device. Re-run 'openclaw matrix verify device --recovery-key-stdin' with the matching recovery key.`

- Ý nghĩa: khóa đã lưu không khớp với bản sao lưu Matrix đang hoạt động.
- Việc cần làm: đặt `MATRIX_RECOVERY_KEY` thành khóa đúng và chạy `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`.

Nếu bạn chấp nhận mất phần lịch sử mã hóa cũ không thể khôi phục, thay vào đó bạn có thể đặt lại
baseline sao lưu hiện tại bằng `openclaw matrix verify backup reset --yes`. Khi secret sao lưu
đã lưu bị hỏng, thao tác đặt lại đó cũng có thể tạo lại secret storage để khóa sao lưu
mới có thể tải đúng sau khi khởi động lại.

`Backup trust chain is not verified on this device. Re-run 'openclaw matrix verify device --recovery-key-stdin'.`

- Ý nghĩa: bản sao lưu tồn tại, nhưng thiết bị này chưa đủ tin cậy chuỗi cross-signing.
- Việc cần làm: đặt `MATRIX_RECOVERY_KEY` và chạy `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`.

`Matrix recovery key is required`

- Ý nghĩa: bạn đã thử một bước khôi phục mà không cung cấp khóa khôi phục trong khi khóa đó là bắt buộc.
- Việc cần làm: chạy lại lệnh với `--recovery-key-stdin`, ví dụ `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`.

`Invalid Matrix recovery key: ...`

- Ý nghĩa: khóa đã cung cấp không thể phân tích cú pháp hoặc không khớp định dạng mong đợi.
- Việc cần làm: thử lại bằng đúng khóa khôi phục từ client Matrix hoặc tệp recovery-key của bạn.

`Matrix recovery key was applied, but this device still lacks full Matrix identity trust.`

- Ý nghĩa: OpenClaw có thể áp dụng khóa khôi phục, nhưng Matrix vẫn chưa
  thiết lập đầy đủ độ tin cậy danh tính cross-signing cho thiết bị này. Kiểm tra
  đầu ra lệnh để tìm `Recovery key accepted`, `Backup usable`,
  `Cross-signing verified`, và `Device verified by owner`.
- Việc cần làm: chạy `openclaw matrix verify self`, chấp nhận yêu cầu trong một
  client Matrix khác, so sánh SAS, và chỉ nhập `yes` khi khớp. Lệnh
  sẽ chờ đến khi có đầy đủ độ tin cậy danh tính Matrix trước khi báo thành công. Chỉ dùng
  `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify bootstrap --recovery-key-stdin --force-reset-cross-signing`
  khi bạn chủ ý muốn thay thế danh tính cross-signing hiện tại.

`Matrix key backup is not active on this device after loading from secret storage.`

- Ý nghĩa: secret storage không tạo ra phiên sao lưu hoạt động trên thiết bị này.
- Việc cần làm: xác minh thiết bị trước, rồi kiểm tra lại bằng `openclaw matrix verify backup status`.

`Matrix crypto backend cannot load backup keys from secret storage. Verify this device with 'openclaw matrix verify device --recovery-key-stdin' first.`

- Ý nghĩa: thiết bị này không thể khôi phục từ secret storage cho đến khi hoàn tất xác minh thiết bị.
- Việc cần làm: chạy `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin` trước.

### Thông báo cài đặt Plugin tùy chỉnh

`Matrix is installed from a custom path that no longer exists: ...`

- Ý nghĩa: bản ghi cài đặt Plugin của bạn trỏ đến một đường dẫn cục bộ đã không còn tồn tại.
- Việc cần làm: cài đặt lại bằng `openclaw plugins install @openclaw/matrix`, hoặc nếu bạn đang chạy từ một repo checkout, `openclaw plugins install ./path/to/local/matrix-plugin`.

## Nếu lịch sử mã hóa vẫn chưa quay lại

Chạy các bước kiểm tra này theo thứ tự:

```bash
openclaw matrix verify status --verbose
openclaw matrix verify backup status --verbose
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin --verbose
```

Nếu bản sao lưu khôi phục thành công nhưng một số phòng cũ vẫn thiếu lịch sử, những khóa bị thiếu đó có thể chưa từng được Plugin trước đó sao lưu.

## Nếu bạn muốn bắt đầu lại từ đầu cho các tin nhắn trong tương lai

Nếu bạn chấp nhận mất lịch sử mã hóa cũ không thể khôi phục và chỉ muốn một baseline sao lưu sạch từ nay về sau, hãy chạy các lệnh này theo thứ tự:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

Nếu thiết bị vẫn chưa được xác minh sau đó, hãy hoàn tất xác minh từ client Matrix của bạn bằng cách so sánh emoji SAS hoặc mã thập phân và xác nhận rằng chúng khớp.

## Liên quan

- [Matrix](/vi/channels/matrix): thiết lập và cấu hình kênh.
- [Quy tắc push Matrix](/vi/channels/matrix-push-rules): định tuyến thông báo.
- [Doctor](/vi/gateway/doctor): kiểm tra sức khỏe và trình kích hoạt di chuyển tự động.
- [Hướng dẫn di chuyển](/vi/install/migrating): tất cả các đường dẫn di chuyển (chuyển máy, import liên hệ thống).
- [Plugins](/vi/tools/plugin): cài đặt và đăng ký Plugin.
