---
read_when:
    - Bạn đang triển khai clawdbot-d63.2 / clawdbot-04b
    - Bạn đang tác động đến việc lưu giữ, đặt lại, xóa phiên SQLite hoặc lưu trữ khi xóa tác tử
    - Bạn cần phân biệt các nhóm thành phần tạo tác thời SQLite với các tệp JSONL phụ trợ cũ.
summary: Kế hoạch phương án 3 để lưu trữ tất cả các thành phần bản ghi SQLite thuộc về một phiên làm việc
title: Nhóm cấu phần phiên SQLite của đường dẫn 3
x-i18n:
    generated_at: "2026-07-16T15:26:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: adb2c31293ab63cb80449d037600d78fbb228e91f380d1ccaf15fb00728a9057
    source_path: plan/path3-sqlite-session-artifact-family.md
    workflow: 16
---

# Họ hiện vật phiên SQLite của Đường dẫn 3

Ghi chú này xác định phạm vi của `clawdbot-d63.2`, trong khi `clawdbot-d63.1` phụ trách trình trợ giúp lưu trữ
đặt lại/xóa bị chồng lấn trong `src/config/sessions/session-accessor.sqlite.ts`.
Tệp triển khai đang có thay đổi chưa lưu trong lượt này, vì vậy hiện vật này ghi lại
hợp đồng và các điểm vá chính xác mà không gây xung đột với worker song song.

## Họ có thẩm quyền

Sau khi chuyển sang SQLite, bản chép lời của các phiên đang hoạt động là các hàng SQLite. Họ
lưu trữ của một phiên gồm:

- Các hàng `transcript_events`, `transcript_event_identities` và `sessions`
  cho `sessionId` hiện tại của mục.
- Cùng tập hợp hàng bản chép lời SQLite cho mọi `sessionId` được
  `entry.compactionCheckpoints[*].preCompaction.sessionId` tham chiếu.
- Cùng tập hợp hàng bản chép lời SQLite cho mọi `sessionId` được
  `entry.compactionCheckpoints[*].postCompaction.sessionId` tham chiếu.
- Cùng tập hợp hàng bản chép lời SQLite cho mọi `sessionId` trong
  `entry.usageFamilySessionIds`.

Chỉ lưu trữ các hàng không còn được bất kỳ hàng `session_entries` nào còn lại
hoặc siêu dữ liệu Compaction hay họ mức sử dụng của bất kỳ mục nào còn lại tham chiếu.
Điều này bảo toàn trạng thái nhánh/khôi phục điểm kiểm tra và tổng hợp mức sử dụng cho đến
khi tham chiếu đang hoạt động cuối cùng không còn nữa.

## Các hiện vật ngoài họ sau khi chuyển đổi

Các biến thể tệp bản chép lời chủ đề được tạo và các tệp phụ quỹ đạo không phải là trạng thái
thời gian chạy SQLite đang hoạt động. Chúng là các hiện vật tệp cũ:

- Các biến thể chủ đề như `<sessionId>-topic-<thread>.jsonl` chỉ tồn tại đối với
  định dạng bản chép lời dựa trên tệp. SQLite sử dụng mã định danh phiên chuẩn cùng
  siêu dữ liệu phân phối `session_routes`/mục thay cho các tệp JSONL theo từng chủ đề.
- Các tệp phụ quỹ đạo như `.trajectory.jsonl` và `.trajectory-path.json`
  được đặt tên từ các đường dẫn `sessionFile` JSONL thực. Các giá trị `sessionFile` của SQLite
  là các dấu mốc `sqlite:<agentId>:<sessionId>:<storePath>` và không chỉ định
  tệp phụ.
- Các trình đọc tầng lưu trữ phải tiếp tục đọc các tệp JSONL cũ đã lưu trữ, nhưng
  cơ chế lưu giữ thời gian chạy không được quét các thư mục phiên đang hoạt động hoặc mở lại
  các tệp bản chép lời JSONL cho phiên SQLite.

Quy trình nhập của Doctor vẫn là bên sở hữu việc di chuyển các tệp JSONL chính cũ và
các tệp phụ quỹ đạo liền kề của chúng. Cơ chế lưu giữ SQLite trong thời gian chạy không nên thêm
trình nhập thứ hai hoặc phương án dự phòng bằng tệp.

## Các điểm vá

Mở rộng trình trợ giúp lưu trữ SQLite do `clawdbot-d63.1` đưa vào thay vì
thêm một đường dẫn song song.

1. Thêm một bộ thu thập cục bộ gần `deleteSqliteSessionStateIfUnreferenced`:
   - `collectSqliteSessionArtifactFamily(entry: SessionEntry): Set<string>`
   - Bao gồm `entry.sessionId`, các mã định danh phiên trước/sau điểm kiểm tra và
     `usageFamilySessionIds`.
   - Lọc các chuỗi rỗng và loại bỏ trùng lặp theo cách tất định.

2. Thêm một bộ thu thập tham chiếu cho kho sau khi xóa:
   - `readReferencedSqliteSessionArtifactFamilyIds(database): Set<string>`
   - Lặp qua `session_entries` hiện tại, phân tích từng `entry_json` và thu thập
     các mã định danh cùng họ từ mọi mục còn tồn tại.

3. Thay đổi các bên gọi đặt lại/xóa/bảo trì hiện đang lưu trữ một
   `sessionId` đã bị xóa để truyền toàn bộ họ của mục đã bị xóa.

4. Với mỗi mã định danh họ, lưu trữ các hàng bản chép lời SQLite với lý do của bên gọi
   (`reset` hoặc `deleted`), sau đó chỉ xóa hàng `sessions` khi
   mã định danh họ không có trong tập hợp tham chiếu sau khi xóa.

5. Duy trì việc xóa sự kiện bản chép lời tập trung thông qua đường dẫn
   dọn dẹp hàng phiên SQLite hiện có. Không thêm thao tác đọc JSONL đang hoạt động.

## Các kiểm thử tập trung

Thêm các kiểm thử chỉ dành cho SQLite vào `src/config/sessions/session-accessor.conformance.test.ts`
hoặc kiểm thử vòng đời song song sau khi `clawdbot-d63.1` commit:

- Việc xóa một mục có bản chép lời trước Compaction sẽ lưu trữ cả phiên hiện tại
  lẫn phiên trước Compaction, sau đó xóa cả hai tập hợp hàng SQLite.
- Việc xóa một trong hai mục dùng chung một phiên trước Compaction không lưu trữ
  gì cho phiên trước dùng chung cho đến khi mục tham chiếu cuối cùng bị
  xóa.
- Việc xóa một mục có `usageFamilySessionIds` sẽ lưu trữ các hàng bản chép lời SQLite
  của phiên tiền nhiệm khi không có mục nào khác tham chiếu họ mức sử dụng đó.
- Một khóa phiên có dạng chủ đề với dấu mốc SQLite không gây ra bất kỳ thao tác đọc
  JSONL chủ đề được tạo nào hoặc tra cứu tệp phụ nào.

Bằng chứng tập trung nên sử dụng:

```bash
node scripts/run-vitest.mjs src/config/sessions/session-accessor.conformance.test.ts
```

Nếu các kiểm thử cuối cùng nằm trong `store.session-lifecycle-mutation.test.ts`, hãy chạy rõ ràng
tệp đó bằng cùng trình bao bọc. Các cổng `pnpm` diện rộng nên tiếp tục chạy trên
Crabbox/Testbox cho worktree Codex này.
