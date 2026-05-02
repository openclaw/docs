---
x-i18n:
    generated_at: "2026-05-02T22:21:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: d9f2b5783c5762ebe7b5db108a89692e653c515138110b4fa9d23663e2ccbbd5
    source_path: superpowers/specs/2026-04-22-tweakcn-custom-theme-import-design.md
    workflow: 16
---

# Thiết kế nhập chủ đề tùy chỉnh Tweakcn

Trạng thái: đã phê duyệt trong terminal vào 2026-04-22

## Tóm tắt

Thêm đúng một khe chủ đề Control UI tùy chỉnh cục bộ trong trình duyệt, có thể được nhập từ liên kết chia sẻ tweakcn. Các họ chủ đề tích hợp hiện có vẫn là `claw`, `knot` và `dash`. Họ `custom` mới hoạt động như một họ chủ đề OpenClaw thông thường và hỗ trợ chế độ `light`, `dark` và `system` khi payload tweakcn đã nhập bao gồm cả hai bộ token sáng và tối.

Chủ đề đã nhập chỉ được lưu trong hồ sơ trình duyệt hiện tại cùng với phần còn lại của cài đặt Control UI. Chủ đề này không được ghi vào cấu hình gateway và không đồng bộ giữa các thiết bị hoặc trình duyệt.

## Vấn đề

Hệ thống chủ đề Control UI hiện bị đóng trong ba họ chủ đề được mã hóa cứng:

- `ui/src/ui/theme.ts`
- `ui/src/ui/views/config.ts`
- `ui/src/styles/base.css`

Người dùng có thể chuyển đổi giữa các họ tích hợp và biến thể chế độ, nhưng họ không thể đưa một chủ đề từ tweakcn vào mà không chỉnh sửa CSS của repo. Kết quả được yêu cầu nhỏ hơn một hệ thống chủ đề tổng quát: giữ ba chủ đề tích hợp và thêm một khe nhập do người dùng kiểm soát, có thể được thay thế từ liên kết tweakcn.

## Mục tiêu

- Giữ nguyên các họ chủ đề tích hợp hiện có.
- Thêm đúng một khe tùy chỉnh đã nhập, không phải một thư viện chủ đề.
- Chấp nhận liên kết chia sẻ tweakcn hoặc URL trực tiếp `https://tweakcn.com/r/themes/{id}`.
- Chỉ duy trì chủ đề đã nhập trong bộ nhớ cục bộ của trình duyệt.
- Cho phép khe đã nhập hoạt động với các điều khiển chế độ `light`, `dark` và `system` hiện có.
- Giữ hành vi lỗi an toàn: một lần nhập không hợp lệ không bao giờ làm hỏng chủ đề UI đang hoạt động.

## Không phải mục tiêu

- Không có thư viện nhiều chủ đề hoặc danh sách nhập cục bộ trong trình duyệt.
- Không có duy trì phía gateway hoặc đồng bộ giữa thiết bị.
- Không có trình chỉnh sửa CSS tùy ý hoặc trình chỉnh sửa JSON chủ đề thô.
- Không tự động tải tài nguyên phông chữ từ xa từ tweakcn.
- Không cố hỗ trợ payload tweakcn chỉ cung cấp một chế độ.
- Không tái cấu trúc chủ đề toàn repo ngoài các seam cần thiết cho Control UI.

## Quyết định của người dùng đã được đưa ra

- Giữ ba chủ đề tích hợp.
- Thêm một khe nhập dùng tweakcn.
- Lưu chủ đề đã nhập trong trình duyệt, không phải cấu hình gateway.
- Hỗ trợ `light`, `dark` và `system` cho khe đã nhập.
- Ghi đè khe tùy chỉnh bằng lần nhập tiếp theo là hành vi mong muốn.

## Cách tiếp cận được khuyến nghị

Thêm id họ chủ đề thứ tư, `custom`, vào mô hình chủ đề Control UI. Họ `custom` chỉ có thể chọn khi có một lần nhập tweakcn hợp lệ. Payload đã nhập được chuẩn hóa thành bản ghi chủ đề tùy chỉnh dành riêng cho OpenClaw và được lưu trong bộ nhớ cục bộ của trình duyệt cùng với phần còn lại của cài đặt UI.

Ở thời gian chạy, OpenClaw render một thẻ `<style>` được quản lý, định nghĩa các khối biến CSS tùy chỉnh đã phân giải:

```css
:root[data-theme="custom"] { ... }
:root[data-theme="custom-light"] { ... }
```

Cách này giữ các biến chủ đề tùy chỉnh trong phạm vi họ `custom` và tránh rò rỉ biến CSS nội tuyến vào các họ tích hợp.

## Kiến trúc

### Mô hình chủ đề

Cập nhật `ui/src/ui/theme.ts`:

- Mở rộng `ThemeName` để bao gồm `custom`.
- Mở rộng `ResolvedTheme` để bao gồm `custom` và `custom-light`.
- Mở rộng `VALID_THEME_NAMES`.
- Cập nhật `resolveTheme()` để `custom` phản chiếu hành vi họ hiện có:
  - `custom + dark` -> `custom`
  - `custom + light` -> `custom-light`
  - `custom + system` -> `custom` hoặc `custom-light` dựa trên tùy chọn hệ điều hành

Không thêm bí danh kế thừa nào cho `custom`.

### Mô hình duy trì

Mở rộng duy trì `UiSettings` trong `ui/src/ui/storage.ts` với một payload chủ đề tùy chỉnh tùy chọn:

- `customTheme?: ImportedCustomTheme`

Dạng lưu trữ được khuyến nghị:

```ts
type ImportedCustomTheme = {
  sourceUrl: string;
  themeId: string;
  label: string;
  importedAt: string;
  light: Record<string, string>;
  dark: Record<string, string>;
};
```

Ghi chú:

- `sourceUrl` lưu đầu vào gốc của người dùng sau khi chuẩn hóa.
- `themeId` là id chủ đề tweakcn được trích xuất từ URL.
- `label` là trường `name` của tweakcn khi có, nếu không là `Custom`.
- `light` và `dark` là các bản đồ token OpenClaw đã chuẩn hóa, không phải payload tweakcn thô.
- Payload đã nhập nằm cạnh các cài đặt cục bộ trình duyệt khác và được tuần tự hóa trong cùng tài liệu local-storage.
- Nếu dữ liệu chủ đề tùy chỉnh đã lưu bị thiếu hoặc không hợp lệ khi tải, bỏ qua payload và quay về `theme: "claw"` khi họ đã duy trì là `custom`.

### Áp dụng ở thời gian chạy

Thêm một trình quản lý stylesheet chủ đề tùy chỉnh hẹp trong runtime Control UI, được sở hữu gần `ui/src/ui/app-settings.ts` và `ui/src/ui/theme.ts`.

Trách nhiệm:

- Tạo hoặc cập nhật một thẻ `<style id="openclaw-custom-theme">` ổn định trong `document.head`.
- Chỉ phát CSS khi có payload chủ đề tùy chỉnh hợp lệ.
- Xóa nội dung thẻ style khi payload bị xóa.
- Giữ CSS họ tích hợp trong `ui/src/styles/base.css`; không chèn token đã nhập vào stylesheet được commit.

Trình quản lý này chạy bất cứ khi nào cài đặt được tải, lưu, nhập hoặc xóa.

### Bộ chọn chế độ sáng

Triển khai nên ưu tiên `data-theme-mode="light"` cho tạo kiểu sáng xuyên họ thay vì xử lý riêng `custom-light`. Nếu một bộ chọn hiện có bị ghim vào `data-theme="light"` và cần áp dụng cho mọi họ sáng, mở rộng nó như một phần của công việc này.

## UX nhập

Cập nhật `ui/src/ui/views/config.ts` trong phần `Appearance`:

- Thêm thẻ chủ đề `Custom` bên cạnh `Claw`, `Knot` và `Dash`.
- Hiển thị thẻ ở trạng thái vô hiệu hóa khi không có chủ đề tùy chỉnh đã nhập.
- Thêm bảng nhập bên dưới lưới chủ đề với:
  - một ô nhập văn bản cho liên kết chia sẻ tweakcn hoặc URL `/r/themes/{id}`
  - một nút `Import`
  - một đường dẫn `Replace` khi payload tùy chỉnh đã tồn tại
  - một hành động `Clear` khi payload tùy chỉnh đã tồn tại
- Hiển thị nhãn chủ đề đã nhập và host nguồn khi có payload.
- Nếu chủ đề đang hoạt động là `custom`, nhập bản thay thế sẽ áp dụng ngay lập tức.
- Nếu chủ đề đang hoạt động không phải `custom`, việc nhập chỉ lưu payload mới cho đến khi người dùng chọn thẻ `Custom`.

Trình chọn chủ đề cài đặt nhanh trong `ui/src/ui/views/config-quick.ts` cũng chỉ nên hiển thị `Custom` khi có payload.

## Phân tích URL và fetch từ xa

Đường dẫn nhập trong trình duyệt chấp nhận:

- `https://tweakcn.com/themes/{id}`
- `https://tweakcn.com/r/themes/{id}`

Triển khai nên chuẩn hóa cả hai dạng thành:

- `https://tweakcn.com/r/themes/{id}`

Sau đó trình duyệt fetch trực tiếp endpoint `/r/themes/{id}` đã chuẩn hóa.

Dùng bộ xác thực schema hẹp cho payload bên ngoài. Ưu tiên schema zod vì đây là ranh giới bên ngoài không đáng tin cậy.

Các trường từ xa bắt buộc:

- `name` cấp cao nhất dưới dạng chuỗi tùy chọn
- `cssVars.theme` dưới dạng object tùy chọn
- `cssVars.light` dưới dạng object
- `cssVars.dark` dưới dạng object

Nếu thiếu `cssVars.light` hoặc `cssVars.dark`, từ chối nhập. Đây là chủ ý: hành vi sản phẩm đã phê duyệt là hỗ trợ đầy đủ chế độ, không phải tổng hợp theo kiểu cố gắng tối đa cho phía bị thiếu.

## Ánh xạ token

Không sao chép mù quáng các biến tweakcn. Chuẩn hóa một tập con có giới hạn thành token OpenClaw và suy ra phần còn lại trong một helper.

### Token được nhập trực tiếp

Từ mỗi khối chế độ tweakcn:

- `background`
- `foreground`
- `card`
- `card-foreground`
- `popover`
- `popover-foreground`
- `primary`
- `primary-foreground`
- `secondary`
- `secondary-foreground`
- `muted`
- `muted-foreground`
- `accent`
- `accent-foreground`
- `destructive`
- `destructive-foreground`
- `border`
- `input`
- `ring`
- `radius`

Từ `cssVars.theme` dùng chung khi có:

- `font-sans`
- `font-mono`

Nếu một khối chế độ ghi đè `font-sans`, `font-mono` hoặc `radius`, giá trị cục bộ của chế độ sẽ thắng.

### Token được suy ra cho OpenClaw

Trình nhập suy ra các biến chỉ dành cho OpenClaw từ các màu cơ sở đã nhập:

- `--bg-accent`
- `--bg-elevated`
- `--bg-hover`
- `--panel`
- `--panel-strong`
- `--panel-hover`
- `--chrome`
- `--chrome-strong`
- `--text`
- `--text-strong`
- `--chat-text`
- `--muted`
- `--muted-strong`
- `--accent-hover`
- `--accent-muted`
- `--accent-subtle`
- `--accent-glow`
- `--focus`
- `--focus-ring`
- `--focus-glow`
- `--secondary`
- `--secondary-foreground`
- `--danger`
- `--danger-muted`
- `--danger-subtle`

Quy tắc suy ra nằm trong một helper thuần để có thể kiểm thử độc lập. Công thức pha màu chính xác là chi tiết triển khai, nhưng helper phải thỏa mãn hai ràng buộc:

- giữ độ tương phản dễ đọc gần với ý định của chủ đề đã nhập
- tạo đầu ra ổn định cho cùng một payload đã nhập

### Token bị bỏ qua trong v1

Các token tweakcn này được cố ý bỏ qua trong phiên bản đầu tiên:

- `chart-*`
- `sidebar-*`
- `font-serif`
- `shadow-*`
- `tracking-*`
- `letter-spacing`
- `spacing`

Điều này giữ phạm vi ở các token mà Control UI hiện tại thực sự cần.

### Phông chữ

Chuỗi font stack được nhập nếu có, nhưng OpenClaw không tải tài nguyên phông chữ từ xa trong v1. Nếu stack đã nhập tham chiếu các phông chữ không có sẵn trong trình duyệt, hành vi fallback thông thường sẽ áp dụng.

## Hành vi lỗi

Các lần nhập lỗi phải thất bại đóng.

- Định dạng URL không hợp lệ: hiển thị lỗi xác thực nội tuyến, không fetch.
- Host hoặc dạng đường dẫn không được hỗ trợ: hiển thị lỗi xác thực nội tuyến, không fetch.
- Lỗi mạng, phản hồi không OK hoặc JSON sai định dạng: hiển thị lỗi nội tuyến, giữ nguyên payload đã lưu hiện tại.
- Lỗi schema hoặc thiếu khối sáng/tối: hiển thị lỗi nội tuyến, giữ nguyên payload đã lưu hiện tại.
- Hành động xóa:
  - xóa payload tùy chỉnh đã lưu
  - xóa nội dung thẻ style tùy chỉnh được quản lý
  - nếu `custom` đang hoạt động, chuyển họ chủ đề về `claw`
- Payload tùy chỉnh đã lưu không hợp lệ khi tải lần đầu:
  - bỏ qua payload đã lưu
  - không phát CSS tùy chỉnh
  - nếu họ chủ đề đã duy trì là `custom`, quay về `claw`

Không lúc nào một lần nhập thất bại được để tài liệu đang hoạt động còn áp dụng một phần biến CSS tùy chỉnh.

## Các tệp dự kiến thay đổi khi triển khai

Tệp chính:

- `ui/src/ui/theme.ts`
- `ui/src/ui/storage.ts`
- `ui/src/ui/app-settings.ts`
- `ui/src/ui/views/config.ts`
- `ui/src/ui/views/config-quick.ts`
- `ui/src/styles/base.css`

Helper có khả năng mới:

- `ui/src/ui/custom-theme.ts`

Kiểm thử:

- `ui/src/ui/app-settings.test.ts`
- `ui/src/ui/storage.node.test.ts`
- `ui/src/ui/views/config.browser.test.ts`
- kiểm thử tập trung mới cho phân tích URL và chuẩn hóa payload

## Kiểm thử

Phạm vi triển khai tối thiểu:

- phân tích URL liên kết chia sẻ thành id chủ đề tweakcn
- chuẩn hóa `/themes/{id}` và `/r/themes/{id}` thành URL fetch
- từ chối host không được hỗ trợ và id sai định dạng
- xác thực dạng payload tweakcn
- ánh xạ một payload tweakcn hợp lệ thành bản đồ token sáng và tối OpenClaw đã chuẩn hóa
- tải và lưu payload tùy chỉnh trong cài đặt cục bộ trình duyệt
- phân giải `custom` cho `light`, `dark` và `system`
- vô hiệu hóa lựa chọn `Custom` khi không có payload
- áp dụng chủ đề đã nhập ngay lập tức khi `custom` đã hoạt động
- quay về `claw` khi chủ đề tùy chỉnh đang hoạt động bị xóa

Mục tiêu xác minh thủ công:

- nhập một chủ đề tweakcn đã biết từ Settings
- chuyển đổi giữa `light`, `dark` và `system`
- chuyển đổi giữa `custom` và các họ tích hợp
- tải lại trang và xác nhận chủ đề tùy chỉnh đã nhập được duy trì cục bộ

## Ghi chú rollout

Tính năng này cố ý nhỏ. Nếu sau này người dùng yêu cầu nhiều chủ đề đã nhập, đổi tên, xuất hoặc đồng bộ giữa thiết bị, hãy xem đó là thiết kế tiếp theo. Không xây dựng sẵn một abstraction thư viện chủ đề trong triển khai này.
