---
read_when:
    - Bạn muốn kiểm tra hoặc chỉnh sửa một nút lá duy nhất trong một tệp không gian làm việc từ terminal
    - Bạn đang viết tập lệnh dựa trên trạng thái không gian làm việc và cần một cơ chế định địa ổn định, không phụ thuộc vào loại đối tượng
    - Bạn đang cân nhắc có nên bật Plugin `oc-path` tùy chọn trên Gateway tự lưu trữ hay không
summary: 'Plugin `oc-path` được đóng gói sẵn: cung cấp CLI `openclaw path` cho cơ chế định địa chỉ tệp không gian làm việc `oc://`'
title: Plugin OC Path
x-i18n:
    generated_at: "2026-07-12T08:09:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eb7bb1aacd37e5cc9c391372b871dc519f4048232d93a0016138ae00a6985a59
    source_path: plugins/oc-path.md
    workflow: 16
---

Plugin `oc-path` đi kèm bổ sung CLI [`openclaw path`](/vi/cli/path) cho cơ chế định địa chỉ tệp trong không gian làm việc `oc://`. Plugin này được phân phối trong kho lưu trữ OpenClaw tại `extensions/oc-path/` nhưng là tính năng tùy chọn: quá trình cài đặt/xây dựng để nó ở trạng thái không hoạt động cho đến khi bạn bật.

Địa chỉ `oc://` trỏ đến một nút lá duy nhất (hoặc một tập hợp nút lá dùng ký tự đại diện) bên trong một tệp không gian làm việc. Plugin hỗ trợ bốn loại tệp:

- **markdown** (`.md`): frontmatter, phần, mục, trường
- **jsonc** (`.jsonc`, `.json`): giữ nguyên chú thích và định dạng
- **jsonl** (`.jsonl`, `.ndjson`): bản ghi theo từng dòng
- **yaml** (`.yaml`, `.yml`, `.lobster`): các nút ánh xạ/chuỗi/vô hướng thông qua API `Document` của gói `yaml`

Người tự lưu trữ và các tiện ích mở rộng trình soạn thảo sử dụng CLI để đọc hoặc ghi một nút lá mà không cần viết tập lệnh trực tiếp với SDK; các tác nhân và hook coi đây là một lớp nền xác định để việc khứ hồi bảo toàn từng byte và cơ chế bảo vệ bằng giá trị đánh dấu biên tập được áp dụng đồng nhất cho mọi loại tệp. Xem [tài liệu tham khảo CLI](/vi/cli/path) để biết đầy đủ ngữ pháp, danh sách cờ theo từng động từ và các ví dụ hoàn chỉnh cho từng loại tệp; trang này trình bày lý do và cách bật Plugin.

## Tại sao nên bật

Bật `oc-path` khi tập lệnh, hook hoặc công cụ tác nhân cục bộ cần trỏ đến một phần chính xác của trạng thái không gian làm việc mà không cần trình phân tích riêng cho từng cấu trúc tệp. Một địa chỉ `oc://` duy nhất có thể định danh khóa frontmatter markdown, mục trong một phần, nút lá cấu hình JSONC, trường sự kiện JSONL hoặc bước quy trình công việc YAML.

Điều này quan trọng đối với các quy trình công việc của người bảo trì, nơi thay đổi cần nhỏ gọn, có thể kiểm tra và có thể lặp lại: kiểm tra một giá trị, tìm các bản ghi khớp, chạy thử thao tác ghi, sau đó chỉ áp dụng cho nút lá đó trong khi giữ nguyên chú thích, ký tự kết thúc dòng và định dạng lân cận.

Các lý do phổ biến để bật:

- **Tự động hóa cục bộ**: tập lệnh shell phân giải hoặc cập nhật một giá trị trong không gian làm việc bằng `openclaw path … --json` thay vì duy trì mã phân tích riêng cho markdown, JSONC, JSONL và YAML.
- **Chỉnh sửa hiển thị cho tác nhân**: tác nhân hiển thị bản khác biệt chạy thử cho một nút lá được định địa chỉ trước khi ghi, giúp việc xem xét dễ dàng hơn so với viết lại tệp theo dạng tự do.
- **Tích hợp trình soạn thảo**: trình soạn thảo ánh xạ `oc://AGENTS.md/tools/gh` đến đúng nút markdown và số dòng mà không phải suy đoán từ văn bản tiêu đề.
- **Chẩn đoán**: `emit` cho tệp khứ hồi qua trình phân tích và trình phát, nhờ đó bạn có thể kiểm tra liệu một loại tệp có ổn định từng byte hay không trước khi dựa vào các thao tác chỉnh sửa tự động.

```bash
# Plugin GitHub có được bật trong cấu hình này không?
openclaw path resolve 'oc://config.jsonc/plugins/github/enabled' --json

# Những tên lệnh gọi công cụ nào xuất hiện trong nhật ký phiên này?
openclaw path find 'oc://session.jsonl/[event=tool_call]/name' --json

# Thao tác chỉnh sửa cấu hình nhỏ này sẽ ghi những byte nào?
openclaw path set 'oc://config.jsonc/plugins/github/enabled' 'true' --dry-run
```

`oc-path` chủ ý không sở hữu ngữ nghĩa cấp cao hơn. Các Plugin bộ nhớ vẫn sở hữu thao tác ghi bộ nhớ, các lệnh cấu hình vẫn sở hữu việc quản lý toàn bộ cấu hình và cơ chế khôi phục cấu hình tốt gần nhất (LKG) vẫn sở hữu việc phục hồi/thăng cấp. `oc-path` là lớp thao tác tệp hẹp để định địa chỉ và bảo toàn byte mà các công cụ cấp cao hơn có thể xây dựng xung quanh.

## Nơi chạy

Plugin chạy **trong cùng tiến trình bên trong CLI `openclaw`** trên máy chủ nơi bạn gọi lệnh. Plugin không cần Gateway đang chạy và không mở bất kỳ socket mạng nào; mỗi động từ là một phép biến đổi thuần túy trên tệp mà bạn chỉ định.

Siêu dữ liệu Plugin nằm trong `extensions/oc-path/openclaw.plugin.json`:

```json
{
  "id": "oc-path",
  "name": "OC Path",
  "activation": {
    "onStartup": false,
    "onCommands": ["path"]
  },
  "commandAliases": [{ "name": "path", "kind": "cli" }]
}
```

`onStartup: false` giữ Plugin ngoài đường dẫn khởi động Gateway. `commandAliases` và `activation.onCommands` yêu cầu CLI tải Plugin theo nhu cầu vào lần đầu bạn chạy `openclaw path …`, vì vậy các bản cài đặt không bao giờ sử dụng động từ này không chịu thêm chi phí.

## Bật

```bash
openclaw plugins enable oc-path
```

Khởi động lại Gateway (nếu bạn có chạy Gateway) để ảnh chụp nhanh tệp kê khai nhận trạng thái mới. Các lệnh gọi trực tiếp `openclaw path` hoạt động ngay lập tức trên cùng máy chủ; CLI tải Plugin theo nhu cầu.

Tắt bằng:

```bash
openclaw plugins disable oc-path
```

## Phần phụ thuộc

Tất cả phần phụ thuộc của trình phân tích đều nằm cục bộ trong Plugin; việc bật `oc-path` không đưa các gói mới vào môi trường chạy lõi:

| Phần phụ thuộc | Mục đích |
| -------------- | ---------------------------------------------------------------------- |
| `commander` | Kết nối lệnh con cho `resolve`, `find`, `set`, `validate`, `emit`. |
| `jsonc-parser` | Phân tích JSONC và chỉnh sửa nút lá trong khi giữ nguyên chú thích và dấu phẩy cuối. |
| `markdown-it` | Phân tách markdown thành token cho mô hình phần / mục / trường. |
| `yaml` | Phân tích / phát / chỉnh sửa `Document` YAML trong khi giữ nguyên chú thích và kiểu luồng. |

JSONL vẫn được triển khai thủ công: phân tích theo từng dòng đơn giản hơn bất kỳ phần phụ thuộc nào và quá trình phân tích từng dòng đã đi qua `jsonc-parser`.

## Những gì Plugin cung cấp

| Bề mặt | Được cung cấp bởi |
| ------------------------------ | ------------------------------------------------------- |
| CLI `openclaw path` | `extensions/oc-path/cli-registration.ts` |
| Trình phân tích / định dạng `oc://` | `extensions/oc-path/src/oc-path/oc-path.ts` |
| Phân tích / phát / chỉnh sửa theo từng loại | `extensions/oc-path/src/oc-path/{md,jsonc,jsonl,yaml}` |
| Phân giải / tìm / đặt dùng chung | `extensions/oc-path/src/oc-path/{resolve,find,edit}.ts` |
| Cơ chế bảo vệ bằng giá trị đánh dấu biên tập | `extensions/oc-path/src/oc-path/sentinel.ts` |

CLI hiện là bề mặt công khai duy nhất. Các động từ của lớp nền là nội bộ đối với Plugin; bên sử dụng dùng CLI (hoặc xây dựng Plugin riêng dựa trên SDK).

## Mối quan hệ với các Plugin khác

- **`memory-*`**: thao tác ghi bộ nhớ đi qua các Plugin bộ nhớ, không phải `oc-path`. `oc-path` là một lớp nền tệp dùng chung; các Plugin bộ nhớ bổ sung ngữ nghĩa riêng ở lớp trên.
- **LKG**: `path` không biết về việc khôi phục cấu hình tốt gần nhất. Nếu một tệp bạn chỉnh sửa qua `path` cũng được LKG theo dõi, chu kỳ quan sát cấu hình tiếp theo sẽ quyết định thăng cấp hay khôi phục tệp đó; hãy coi thao tác chỉnh sửa bằng `path` giống như mọi thao tác ghi trực tiếp khác vào tệp đó.

## An toàn

`set` ghi byte thô thông qua đường dẫn phát của lớp nền, nơi tự động áp dụng cơ chế bảo vệ bằng giá trị đánh dấu biên tập. Nút lá chứa `__OPENCLAW_REDACTED__` (nguyên văn hoặc dưới dạng chuỗi con) sẽ bị từ chối tại thời điểm ghi với `OC_EMIT_SENTINEL`. CLI cũng loại bỏ giá trị đánh dấu nguyên văn khỏi mọi đầu ra dành cho người dùng hoặc JSON mà nó in, thay thế bằng `[REDACTED]` để bản ghi đầu cuối và quy trình đường ống không bao giờ làm lộ giá trị đánh dấu.

## Liên quan

- [Tài liệu tham khảo CLI `openclaw path`](/vi/cli/path)
- [Quản lý Plugin](/vi/plugins/manage-plugins)
- [Xây dựng Plugin](/vi/plugins/building-plugins)
