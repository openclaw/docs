---
read_when:
    - Bạn đang gỡ lỗi việc sửa chữa phụ thuộc lúc chạy của Plugin được đóng gói kèm
    - Bạn đang thay đổi hành vi khởi động Plugin, doctor hoặc cài đặt của trình quản lý gói
    - Bạn đang bảo trì các bản cài đặt OpenClaw đóng gói hoặc manifest plugin được đóng gói kèm
sidebarTitle: Dependencies
summary: Cách OpenClaw lập kế hoạch, chuẩn bị và sửa chữa các phụ thuộc thời gian chạy của các Plugin được đóng gói kèm
title: Phân giải phụ thuộc của Plugin
x-i18n:
    generated_at: "2026-05-01T10:51:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: e09245c2b7e2f1fb2a61d64f0f9dc77e7df7da58fd71608c391e3865345b7bc9
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

OpenClaw không cài đặt toàn bộ cây phụ thuộc của mọi Plugin đi kèm tại thời điểm
cài đặt gói. Trước tiên, OpenClaw suy ra một kế hoạch Plugin hiệu lực từ cấu hình
và siêu dữ liệu Plugin, rồi chỉ dàn dựng các phụ thuộc runtime cho những Plugin
đi kèm do OpenClaw sở hữu mà kế hoạch thực sự có thể tải.

Trang này đề cập đến các phụ thuộc runtime được đóng gói cho những Plugin
OpenClaw đi kèm. Plugin bên thứ ba và đường dẫn Plugin tùy chỉnh vẫn dùng các
lệnh cài đặt Plugin tường minh như `openclaw plugins install` và
`openclaw plugins update`.

## Phân chia trách nhiệm

OpenClaw sở hữu kế hoạch và chính sách:

- Plugin nào đang hoạt động cho cấu hình này
- gốc phụ thuộc nào có thể ghi hoặc chỉ đọc
- khi nào được phép sửa chữa
- id Plugin nào được dàn dựng cho khởi động
- các kiểm tra cuối cùng trước khi nhập các mô-đun runtime của Plugin

Trình quản lý gói sở hữu việc hội tụ phụ thuộc:

- phân giải đồ thị gói
- xử lý phụ thuộc production, tùy chọn và peer
- bố cục `node_modules`
- tính toàn vẹn của gói
- siêu dữ liệu khóa và cài đặt

Trong thực tế, OpenClaw nên quyết định thứ gì cần tồn tại. `pnpm` hoặc `npm` nên
làm cho hệ thống tệp khớp với quyết định đó.

OpenClaw cũng sở hữu khóa điều phối theo từng gốc cài đặt. Trình quản lý gói
bảo vệ giao dịch cài đặt riêng của chúng, nhưng chúng không tuần tự hóa việc ghi
manifest của OpenClaw, sao chép/đổi tên vùng dàn dựng cô lập, xác thực cuối cùng
hoặc nhập Plugin trước một Gateway, doctor hoặc tiến trình CLI khác đang chạm
vào cùng gốc phụ thuộc runtime.

## Kế hoạch Plugin hiệu lực

Kế hoạch Plugin hiệu lực được suy ra từ cấu hình cộng với siêu dữ liệu Plugin đã
phát hiện. Những đầu vào này có thể kích hoạt các phụ thuộc runtime của Plugin
đi kèm:

- `plugins.entries.<id>.enabled`
- `plugins.allow`, `plugins.deny`, và `plugins.enabled`
- cấu hình kênh cũ như `channels.telegram.enabled`
- provider, model hoặc tham chiếu backend CLI đã cấu hình yêu cầu một Plugin
- mặc định manifest đi kèm như `enabledByDefault`
- chỉ mục Plugin đã cài đặt và siêu dữ liệu manifest đi kèm

Vô hiệu hóa tường minh sẽ thắng. Một Plugin bị vô hiệu hóa, id Plugin bị từ
chối, hệ thống Plugin bị vô hiệu hóa hoặc kênh bị vô hiệu hóa sẽ không kích hoạt
sửa chữa phụ thuộc runtime. Chỉ riêng trạng thái xác thực đã lưu cũng không kích
hoạt một kênh hoặc provider đi kèm.

Kế hoạch Plugin là đầu vào ổn định. Phần vật chất hóa phụ thuộc được tạo là đầu
ra của kế hoạch đó.

## Luồng khởi động

Khởi động Gateway phân tích cấu hình và xây dựng bảng tra cứu Plugin khởi động
trước khi các mô-đun runtime của Plugin được tải. Sau đó, khởi động chỉ dàn dựng
phụ thuộc runtime cho các `startupPluginIds` được kế hoạch đó chọn.

Đối với các bản cài đặt đóng gói, việc dàn dựng phụ thuộc được phép trước khi
nhập Plugin. Sau khi dàn dựng, trình tải runtime nhập các Plugin khởi động với
sửa chữa cài đặt bị tắt; tại thời điểm đó, thiếu vật chất hóa phụ thuộc được xem
là lỗi tải, không phải một vòng lặp sửa chữa khác.

Khi dàn dựng phụ thuộc khởi động bị trì hoãn sau HTTP bind, trạng thái sẵn sàng
của Gateway vẫn bị chặn bởi lý do `plugin-runtime-deps` cho đến khi các phụ thuộc
Plugin khởi động đã chọn được vật chất hóa và runtime của Plugin khởi động đã
tải.

## Khi sửa chữa chạy

Sửa chữa phụ thuộc runtime nên chạy khi một trong các điều sau là đúng:

- kế hoạch Plugin hiệu lực thay đổi và thêm các Plugin đi kèm cần phụ thuộc
  runtime
- manifest phụ thuộc được tạo không còn khớp với kế hoạch hiệu lực
- sentinel gói đã cài đặt dự kiến bị thiếu hoặc không đầy đủ
- `openclaw doctor --fix` hoặc `openclaw plugins deps --repair` đã được yêu cầu

Sửa chữa phụ thuộc runtime không nên chạy chỉ vì OpenClaw đã khởi động. Một lần
khởi động bình thường với kế hoạch không đổi và vật chất hóa phụ thuộc hoàn
chỉnh nên bỏ qua công việc của trình quản lý gói.

Các lệnh chỉnh sửa cấu hình, bật Plugin hoặc sửa chữa phát hiện của doctor có
thể vào chế độ kế hoạch Plugin một lần, vật chất hóa các phụ thuộc đi kèm mới
được yêu cầu, rồi quay lại luồng lệnh bình thường. `openclaw onboard` cục bộ và
`openclaw configure` tự động thực hiện việc này sau khi chúng ghi cấu hình thành
công, để lần chạy Gateway tiếp theo không phát hiện thiếu các gói Plugin đi kèm
sau khi khởi động đã bắt đầu. Onboarding/cấu hình từ xa vẫn ở chế độ chỉ đọc đối
với phụ thuộc runtime cục bộ.

## Quy tắc tải lại nóng

Các đường dẫn tải lại nóng có thể thay đổi Plugin đang hoạt động phải đi lại qua
chế độ kế hoạch Plugin trước khi tải runtime của Plugin. Việc tải lại nên so
sánh kế hoạch Plugin hiệu lực mới với kế hoạch trước đó, dàn dựng các phụ thuộc
còn thiếu cho những Plugin đi kèm mới hoạt động, rồi tải hoặc khởi động lại
runtime bị ảnh hưởng.

Nếu tải lại cấu hình không thay đổi kế hoạch Plugin hiệu lực, nó không nên sửa
chữa các phụ thuộc runtime đi kèm.

## Thực thi trình quản lý gói

OpenClaw ghi manifest cài đặt được tạo cho các phụ thuộc runtime đi kèm đã chọn
và chạy trình quản lý gói trong gốc cài đặt phụ thuộc runtime. OpenClaw ưu tiên
`pnpm` khi có sẵn và dự phòng về trình chạy `npm` đi kèm Node.

Đường dẫn `pnpm` dùng phụ thuộc production, tắt script vòng đời, bỏ qua
workspace và giữ store bên trong gốc cài đặt:

```bash
pnpm install \
  --prod \
  --ignore-scripts \
  --ignore-workspace \
  --config.frozen-lockfile=false \
  --config.minimum-release-age=0 \
  --config.store-dir=<install-root>/.openclaw-pnpm-store \
  --config.node-linker=hoisted \
  --config.virtual-store-dir=.pnpm
```

Dự phòng `npm` dùng wrapper cài đặt npm an toàn với phụ thuộc production, script
vòng đời bị tắt, chế độ workspace bị tắt, audit bị tắt, đầu ra fund bị tắt, hành
vi phụ thuộc peer cũ và đầu ra package-lock được bật cho gốc cài đặt được tạo.

Sau khi cài đặt, OpenClaw xác thực cây phụ thuộc đã dàn dựng trước khi làm cho nó
hiển thị với gốc phụ thuộc runtime. Vùng dàn dựng cô lập được sao chép vào gốc
phụ thuộc runtime và được xác thực lại.

Toàn bộ phần sửa chữa/vật chất hóa được bảo vệ bằng một khóa gốc cài đặt. Chủ sở
hữu khóa hiện tại ghi lại PID, thời điểm bắt đầu tiến trình khi có sẵn và thời
điểm tạo. Các khóa cũ không có bằng chứng thời điểm bắt đầu tiến trình hoặc thời
điểm tạo chỉ được thu hồi theo tuổi hệ thống tệp, để khóa PID 1 của Docker được
tái sử dụng có thể phục hồi mà không làm hết hạn các bản cài đặt hiện tại chạy
lâu bình thường chỉ dựa trên tuổi.

## Gốc cài đặt

Các bản cài đặt đóng gói không được thay đổi thư mục gói chỉ đọc. OpenClaw có
thể đọc gốc phụ thuộc từ các lớp đã đóng gói, nhưng ghi phụ thuộc runtime được
tạo vào một vùng dàn dựng có thể ghi như:

- `OPENCLAW_PLUGIN_STAGE_DIR`
- `$STATE_DIRECTORY`
- `~/.openclaw/plugin-runtime-deps`
- `/var/lib/openclaw/plugin-runtime-deps` trong các bản cài đặt kiểu container

Gốc có thể ghi là đích vật chất hóa cuối cùng. Các gốc chỉ đọc cũ hơn chỉ được
giữ làm lớp tương thích khi cần.

Khi một bản cập nhật OpenClaw đóng gói thay đổi gốc có thể ghi được gắn phiên
bản nhưng kế hoạch phụ thuộc Plugin đi kèm đã chọn vẫn được đáp ứng bởi một gốc
đã dàn dựng trước đó, sửa chữa tái sử dụng cây `node_modules` trước đó thay vì
chạy lại trình quản lý gói. Gốc phiên bản mới vẫn có bản sao runtime gói hiện
tại riêng, nên mã Plugin đến từ gói OpenClaw hiện tại trong khi các cây phụ
thuộc không đổi được chia sẻ qua các bản cập nhật. Việc tái sử dụng bỏ qua các
gốc trước đó có khóa phụ thuộc runtime OpenClaw đang hoạt động, nên gốc mới
không liên kết đến một cây phụ thuộc mà một tiến trình Gateway, doctor hoặc CLI
khác hiện đang sửa chữa.

## Lệnh doctor và CLI

Dùng `plugins deps` để kiểm tra hoặc sửa chữa việc vật chất hóa phụ thuộc runtime
của Plugin đi kèm:

```bash
openclaw plugins deps
openclaw plugins deps --json
openclaw plugins deps --repair
openclaw plugins deps --prune
```

Dùng doctor khi trạng thái phụ thuộc là một phần của sức khỏe cài đặt rộng hơn:

```bash
openclaw doctor
openclaw doctor --fix
```

`plugins deps` và doctor hoạt động trên các phụ thuộc runtime của Plugin đi kèm
do OpenClaw sở hữu được kế hoạch Plugin hiệu lực chọn. Chúng không phải là lệnh
cài đặt hoặc cập nhật Plugin bên thứ ba.

## Khắc phục sự cố

Nếu một bản cài đặt đóng gói báo thiếu phụ thuộc runtime đi kèm:

1. Chạy `openclaw plugins deps --json` để kiểm tra kế hoạch đã chọn và các gói
   còn thiếu.
2. Chạy `openclaw plugins deps --repair` hoặc `openclaw doctor --fix` để sửa
   chữa vùng dàn dựng phụ thuộc có thể ghi.
3. Nếu gốc cài đặt là chỉ đọc, đặt `OPENCLAW_PLUGIN_STAGE_DIR` thành một đường
   dẫn có thể ghi và chạy lại sửa chữa.
4. Khởi động lại Gateway sau khi sửa chữa nếu phụ thuộc còn thiếu đã chặn việc
   tải Plugin khởi động.

Trong các checkout nguồn, bản cài đặt workspace thường cung cấp các phụ thuộc
Plugin đi kèm. Chạy `pnpm install` để sửa chữa phụ thuộc nguồn thay vì dùng sửa
chữa phụ thuộc runtime đóng gói làm bước đầu tiên.
