---
read_when:
    - Bạn duy trì một plugin OpenClaw
    - Bạn thấy cảnh báo về khả năng tương thích của plugin
    - Bạn đang lập kế hoạch di chuyển SDK Plugin hoặc manifest
summary: Các hợp đồng tương thích của Plugin, siêu dữ liệu ngừng hỗ trợ và kỳ vọng về quá trình di chuyển
title: Khả năng tương thích của Plugin
x-i18n:
    generated_at: "2026-07-20T04:29:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 1554105e3499dd608237d638174b167d9a78c227fe05668ce1159d466a1f8c10
    source_path: plugins/compatibility.md
    workflow: 16
---

OpenClaw duy trì kết nối các hợp đồng plugin cũ thông qua các bộ điều hợp tương thích
có tên trước khi loại bỏ chúng. Điều này bảo vệ các plugin đi kèm và bên ngoài hiện có
trong khi các hợp đồng SDK, manifest, thiết lập, cấu hình và môi trường chạy agent
phát triển.

## Registry tương thích

Các hợp đồng tương thích plugin được theo dõi trong registry lõi tại
`src/plugins/compat/registry.ts`. Mỗi bản ghi có:

- một mã tương thích ổn định
- trạng thái: `active`, `deprecated`, `removal-pending`, hoặc `removed`
- chủ sở hữu: `sdk`, `config`, `setup`, `channel`, `provider`, `plugin-execution`,
  `agent-runtime`, hoặc `core`
- ngày giới thiệu và ngừng hỗ trợ khi áp dụng
- hướng dẫn thay thế
- tài liệu, chẩn đoán và kiểm thử bao quát hành vi cũ và mới

Registry là nguồn phục vụ việc lập kế hoạch của người bảo trì và các bước kiểm tra
trình kiểm tra plugin trong tương lai. Nếu một hành vi dành cho plugin thay đổi, hãy
thêm hoặc cập nhật bản ghi tương thích trong cùng thay đổi bổ sung bộ điều hợp.

Khả năng tương thích của việc sửa chữa và di chuyển bằng Doctor được theo dõi riêng tại
`src/commands/doctor/shared/deprecation-compat.ts`. Các bản ghi đó bao quát các
cấu trúc cấu hình cũ, bố cục sổ cái cài đặt và các shim sửa chữa có thể cần
tiếp tục khả dụng sau khi đường dẫn tương thích của môi trường chạy bị loại bỏ.

Các đợt rà soát bản phát hành nên kiểm tra cả hai registry. Không xóa một bản di chuyển
của Doctor chỉ vì bản ghi tương thích môi trường chạy hoặc cấu hình tương ứng
đã hết hạn; trước tiên hãy xác minh rằng không có đường dẫn nâng cấp được hỗ trợ nào vẫn
cần việc sửa chữa đó. Đồng thời xác thực lại từng chú thích thay thế trong quá trình lập kế hoạch
bản phát hành, vì quyền sở hữu plugin và phạm vi cấu hình có thể thay đổi khi các nhà cung cấp
và kênh được chuyển ra khỏi lõi.

## Chính sách ngừng hỗ trợ

OpenClaw không nên loại bỏ một hợp đồng plugin đã được ghi trong tài liệu trong cùng bản phát hành
giới thiệu hợp đồng thay thế. Trình tự di chuyển:

1. Thêm hợp đồng mới.
2. Duy trì kết nối hành vi cũ thông qua một bộ điều hợp tương thích có tên.
3. Phát chẩn đoán hoặc cảnh báo khi tác giả plugin có thể xử lý.
4. Ghi tài liệu về giải pháp thay thế và tiến trình thời gian.
5. Kiểm thử cả đường dẫn cũ và mới.
6. Chờ hết khoảng thời gian di chuyển đã công bố.
7. Chỉ loại bỏ khi có phê duyệt rõ ràng cho bản phát hành phá vỡ tương thích.

Các bản ghi đã ngừng hỗ trợ phải bao gồm ngày bắt đầu cảnh báo, giải pháp thay thế, liên kết
tài liệu và ngày loại bỏ cuối cùng không quá ba tháng sau khi cảnh báo
bắt đầu. Không thêm đường dẫn tương thích đã ngừng hỗ trợ với khoảng thời gian
loại bỏ không xác định, trừ khi người bảo trì quyết định rõ ràng rằng đó là khả năng tương thích
vĩnh viễn và đánh dấu là `active`.

## Các khu vực tương thích hiện tại

Đợt rà soát tháng 7 năm 2026 đã loại bỏ các bí danh SDK gốc, manifest, nhà cung cấp, môi trường chạy,
cờ registry và cấu hình web thuộc sở hữu plugin đã hết hạn. Các bản di chuyển của Doctor vẫn được
theo dõi riêng để các đường dẫn nâng cấp được hỗ trợ vẫn có thể sửa cấu hình cũ.

Các khu vực tương thích còn lại có ngày cụ thể là:

- các khoảng thời gian đường dẫn con SDK trong tháng 8 và tháng 9 được liệt kê trong hướng dẫn di chuyển
- các bí danh hook `api.on("deactivate", ...)` và `api.on("subagent_spawning", ...)`
- đăng ký embedding dành riêng cho bộ nhớ và cầu nối kho phiên beta.5
- các bí danh callback đầu vào WhatsApp được mô tả bên dưới
- phân tích đích kênh rõ ràng và `openclaw/plugin-sdk/messaging-targets`
- các bí danh agent Pi nhúng
- các bí danh SDK bộ khung agent đã phát hành, việc loại bỏ chúng đang chờ một quyết định
  di chuyển mới được ghi tài liệu bên ngoài

Các bản ghi registry đang hoạt động, không có ngày cụ thể bao quát hành vi được hỗ trợ thay vì khoản nợ
loại bỏ, bao gồm gợi ý kích hoạt, thu nhận plugin, bật plugin đi kèm
và cơ chế dự phòng cấu hình kênh được tạo.

### Các bí danh phẳng của callback đầu vào WhatsApp

Các callback môi trường chạy WhatsApp cung cấp `WebInboundMessage`: các ngữ cảnh
lồng nhau chuẩn tắc `event`, `payload`, `quote`, `group` và `platform`, cùng
các bí danh phẳng đã ngừng hỗ trợ cho những trường callback đã phát hành. Mã callback mới
nên đọc các ngữ cảnh lồng nhau. Mã tạo thông điệp callback lồng nhau sạch
có thể dùng `WebInboundCallbackMessage`; các trình lắng nghe tương thích vẫn
chèn thông điệp kiểm thử hoặc plugin phẳng cũ nên dùng
`LegacyFlatWebInboundMessage` hoặc `WebInboundMessageInput`.

Các bí danh phẳng vẫn khả dụng đến **2026-08-30**; khoảng thời gian này chỉ áp dụng
cho việc truy cập bí danh phẳng, không áp dụng cho cấu trúc lồng nhau, vốn là hợp đồng
môi trường chạy chuẩn tắc. Chú thích TypeScript `@deprecated` của từng bí danh phẳng
nêu rõ mục thay thế lồng nhau chính xác. Các ví dụ phổ biến:

- `id`, `timestamp` và `isBatched` chuyển vào `event`.
- `body`, `mediaPath`, `mediaType`, `mediaFileName`, `mediaUrl`, `location`
  và `untrustedStructuredContext` chuyển vào `payload`.
- `to`, `chatId`, các trường người gửi/bản thân, `sendComposing`, `reply(...)` và
  `sendMedia(...)` chuyển vào `platform`.
- các trường `replyTo*` chuyển vào `quote`; các trường chủ đề nhóm/người tham gia/lượt đề cập
  chuyển vào `group`.

`payload.untrustedStructuredContext` được trích xuất từ các tải trọng đầu vào của nhà cung cấp.
Plugin nên kiểm tra `label`, `source` và `type` trước khi
coi `payload` của nó là có thẩm quyền.

### Các trường chấp nhận đầu vào WhatsApp

Các thông điệp callback WhatsApp được chấp nhận mang theo `admission`, một phong bì
an toàn để công khai cho quyết định kiểm soát truy cập đã chấp nhận thông điệp. Mã
callback mới nên đọc các dữ kiện chấp nhận từ `msg.admission` thay vì
các trường chấp nhận cấp cao nhất cũ hơn.

Các trường cấp cao nhất vẫn khả dụng đến **2026-08-30**. Chú thích
TypeScript `@deprecated` của từng trường nêu rõ mục thay thế:

- `from` và `conversationId` chuyển đến `admission.conversation.id`.
- `accountId` chuyển đến `admission.accountId`.
- `accessControlPassed` là một dạng xem tương thích được suy ra từ
  `admission.ingress.decision === "allow"`; trên các thông điệp đã mang theo
  `admission`, việc ghi giá trị boolean cũ không viết lại đồ thị
  đầu vào.
- `chatType` chuyển đến `admission.conversation.kind`.

## Gói trình kiểm tra plugin

Trình kiểm tra plugin nên nằm ngoài repo OpenClaw lõi dưới dạng một
gói/repository riêng biệt, dựa trên các hợp đồng tương thích và
manifest có phiên bản. CLI ban đầu nên là:

```sh
openclaw-plugin-inspector ./my-plugin
```

Nó nên xuất kết quả xác thực manifest/schema, phiên bản tương thích hợp đồng
đang được kiểm tra, các bước kiểm tra siêu dữ liệu cài đặt/nguồn, các bước kiểm tra nhập
đường dẫn nguội và cảnh báo ngừng hỗ trợ/tương thích. Dùng `--json` để có đầu ra
ổn định mà máy có thể đọc trong các chú thích CI. Lõi OpenClaw nên công khai
các hợp đồng và fixture mà trình kiểm tra có thể sử dụng, nhưng không nên phát hành
tệp nhị phân của trình kiểm tra từ gói `openclaw` chính.

### Làn nghiệm thu dành cho người bảo trì

Dùng Blacksmith Testbox dựa trên Crabbox cho làn nghiệm thu gói có thể cài đặt
khi xác thực trình kiểm tra bên ngoài đối với các gói plugin OpenClaw.
Chạy làn này từ một bản checkout OpenClaw sạch sau khi gói được dựng:

```sh
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "pnpm install && pnpm build && npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/telegram --json"
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/discord --json"
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- <clawhub-plugin-dir> --json"
```

Giữ làn này ở chế độ tùy chọn tham gia dành cho người bảo trì, vì nó cài đặt một gói npm
bên ngoài và có thể kiểm tra các gói plugin được sao chép bên ngoài repo. Các biện pháp bảo vệ
repo cục bộ bao quát sơ đồ xuất SDK, siêu dữ liệu registry tương thích,
việc loại bỏ dần các lệnh nhập SDK đã ngừng hỗ trợ và các ranh giới nhập của tiện ích mở rộng đi kèm;
bằng chứng từ trình kiểm tra trên Testbox bao quát gói theo cách các tác giả plugin bên ngoài
sử dụng nó.

## Ghi chú phát hành

Ghi chú phát hành nên bao gồm các đợt ngừng hỗ trợ plugin sắp tới cùng ngày mục tiêu
và liên kết đến tài liệu di chuyển, trước khi một đường dẫn tương thích chuyển sang
`removal-pending` hoặc `removed`.
