---
read_when:
    - Triển khai các hook runtime của nhà cung cấp, vòng đời kênh hoặc các gói package
    - Gỡ lỗi thứ tự tải plugin hoặc trạng thái registry
    - Thêm tính năng Plugin mới hoặc Plugin công cụ ngữ cảnh
summary: 'Nội bộ kiến trúc Plugin: pipeline tải, registry, hook runtime, route HTTP và bảng tham chiếu'
title: Chi tiết nội bộ về kiến trúc Plugin
x-i18n:
    generated_at: "2026-07-19T06:03:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 38041d0b6bfab4beebdc724561921dfc08ef2d0aa6d1c949c751098ab98c7d14
    source_path: plugins/architecture-internals.md
    workflow: 16
---

Đối với mô hình khả năng công khai, các dạng Plugin và hợp đồng về quyền sở hữu/thực thi,
hãy xem [Kiến trúc Plugin](/vi/plugins/architecture). Trang này trình bày
cơ chế nội bộ: pipeline tải, registry, hook runtime, tuyến HTTP của Gateway,
đường dẫn import và bảng schema.

## Pipeline tải

Khi khởi động, OpenClaw thực hiện đại khái như sau:

1. phát hiện các gốc Plugin ứng viên
2. đọc manifest gói native hoặc tương thích và siêu dữ liệu gói
3. từ chối các ứng viên không an toàn
4. chuẩn hóa cấu hình Plugin (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. quyết định trạng thái bật cho từng ứng viên
6. tải các mô-đun native đã bật: các mô-đun tích hợp sẵn đã được dựng sử dụng trình tải native;
   mã nguồn TypeScript cục bộ của bên thứ ba sử dụng phương án dự phòng Jiti khẩn cấp
7. gọi các hook native `register(api)` và thu thập đăng ký vào registry Plugin
8. cung cấp registry cho các bề mặt lệnh/runtime

<Note>
`activate` là bí danh cũ của `register` — trình tải phân giải mục hiện diện (`def.register ?? def.activate`) và gọi mục đó tại cùng một thời điểm. Tất cả Plugin tích hợp sẵn đều sử dụng `register`; nên dùng `register` cho Plugin mới.
</Note>

Các cổng an toàn chạy **trước** khi thực thi runtime. Quá trình phát hiện chặn một ứng viên
khi:

- điểm vào đã phân giải của ứng viên nằm ngoài gốc Plugin
- đường dẫn của ứng viên (hoặc thư mục gốc của đường dẫn đó) cho phép mọi người dùng ghi
- đối với Plugin không tích hợp sẵn, quyền sở hữu đường dẫn không khớp với uid hiện tại (hoặc root)

Trước tiên, hệ thống thử sửa tại chỗ bằng `chmod` đối với các thư mục tích hợp sẵn
cho phép mọi người dùng ghi (các bản cài đặt npm/toàn cục có thể cung cấp thư mục gói ở chế độ `0777`) trước khi cổng
kiểm tra lại; kiểm tra quyền sở hữu được bỏ qua hoàn toàn đối với nguồn tích hợp sẵn.

Các ứng viên bị chặn vẫn mang id Plugin trong chẩn đoán được phát ra khi
xác định được id (bao gồm các id được phân giải từ manifest bên trong một
thư mục vốn bị từ chối), vì vậy cấu hình tham chiếu đến id đó sẽ thấy một
Plugin bị chặn gắn với cảnh báo an toàn đường dẫn thay vì lỗi "Plugin không xác định"
không liên quan.

### Hành vi ưu tiên manifest

Manifest là nguồn sự thật của mặt phẳng điều khiển. OpenClaw sử dụng manifest để:

- nhận dạng Plugin
- phát hiện các kênh/Skills/schema cấu hình hoặc khả năng gói đã khai báo
- xác thực `plugins.entries.<id>.config`
- bổ sung nhãn/văn bản giữ chỗ cho Control UI
- hiển thị siêu dữ liệu cài đặt/danh mục
- duy trì các mô tả kích hoạt và thiết lập ít tốn tài nguyên mà không tải runtime của Plugin

Đối với Plugin native, mô-đun runtime là phần thuộc mặt phẳng dữ liệu. Mô-đun này đăng ký
hành vi thực tế như hook, công cụ, lệnh hoặc luồng nhà cung cấp.

Các khối `activation` và `setup` tùy chọn của manifest vẫn nằm trên mặt phẳng điều khiển.
Chúng chỉ là các mô tả siêu dữ liệu phục vụ lập kế hoạch kích hoạt và phát hiện thiết lập;
chúng không thay thế đăng ký runtime, `register(...)` hoặc `setupEntry`.
Các thành phần tiêu thụ kích hoạt trực tiếp sử dụng gợi ý về lệnh, kênh và nhà cung cấp trong manifest để
thu hẹp phạm vi tải Plugin trước khi hiện thực hóa registry rộng hơn:

- quá trình tải CLI thu hẹp xuống các Plugin sở hữu lệnh chính được yêu cầu
- quá trình phân giải thiết lập kênh/Plugin thu hẹp xuống các Plugin sở hữu
  id kênh được yêu cầu
- quá trình phân giải thiết lập/runtime nhà cung cấp tường minh thu hẹp xuống các Plugin sở hữu
  id nhà cung cấp được yêu cầu
- quá trình lập kế hoạch khởi động Gateway sử dụng `activation.onStartup` cho các import khởi động
  tường minh; các Plugin không có siêu dữ liệu khởi động chỉ tải thông qua các
  tác nhân kích hoạt có phạm vi hẹp hơn

Trình lập kế hoạch kích hoạt cung cấp cả API chỉ chứa id cho các bên gọi hiện có và
API kế hoạch cho chẩn đoán. Các mục kế hoạch báo cáo lý do một Plugin được chọn,
phân biệt các gợi ý `activation.*` tường minh với phương án dự phòng theo quyền sở hữu manifest:

| Lý do (từ gợi ý `activation.*`)   | Lý do (từ quyền sở hữu manifest)                                                             |
| ------------------------------------ | -------------------------------------------------------------------------------------------- |
| `activation-agent-harness-hint`      | —                                                                                            |
| `activation-capability-hint`         | —                                                                                            |
| `activation-channel-hint`            | `manifest-channel-owner` (`channels`)                                                        |
| `activation-command-hint`            | `manifest-command-alias` (`commandAliases`)                                                  |
| `activation-provider-hint`           | `manifest-provider-owner` (`providers`), `manifest-setup-provider-owner` (`setup.providers`) |
| `activation-route-hint`              | —                                                                                            |
| — (tác nhân hook không có biến thể gợi ý) | `manifest-hook-owner` (`hooks`), `manifest-tool-contract` (`contracts.tools`)                |

Sự phân tách lý do đó là ranh giới tương thích: siêu dữ liệu Plugin hiện có
tiếp tục hoạt động, trong khi mã mới có thể phát hiện các gợi ý rộng hoặc hành vi dự phòng
mà không thay đổi ngữ nghĩa tải runtime.

Các lần tải trước runtime tại thời điểm yêu cầu đòi hỏi phạm vi `all` rộng vẫn suy ra
một tập id Plugin hiệu dụng tường minh từ cấu hình, kế hoạch khởi động, các
kênh đã cấu hình, slot và quy tắc tự động bật
(`resolveEffectivePluginIds` trong `src/plugins/effective-plugin-ids.ts`). Nếu
tập suy ra đó trống, OpenClaw giữ phạm vi trống thay vì mở rộng sang
mọi Plugin có thể phát hiện.

Quá trình phát hiện thiết lập ưu tiên các id thuộc sở hữu của mô tả như `setup.providers` và
`setup.cliBackends` để thu hẹp các Plugin ứng viên trước khi dùng phương án dự phòng
`setup-api` cho các Plugin vẫn cần hook runtime tại thời điểm thiết lập. Danh sách
thiết lập nhà cung cấp sử dụng `providerAuthChoices` của manifest, các lựa chọn thiết lập
suy ra từ mô tả và siêu dữ liệu danh mục cài đặt mà không tải runtime nhà cung cấp. Giá trị
`setup.requiresRuntime: false` tường minh là điểm ngắt chỉ dùng mô tả; việc bỏ qua
`requiresRuntime` giữ lại phương án dự phòng API thiết lập cũ để tương thích. Nếu
nhiều hơn một Plugin được phát hiện cùng nhận sở hữu một id nhà cung cấp thiết lập hoặc
backend CLI đã chuẩn hóa, quá trình tra cứu thiết lập sẽ từ chối chủ sở hữu không rõ ràng thay vì dựa vào
thứ tự phát hiện. Khi runtime thiết lập thực sự chạy, chẩn đoán registry báo cáo
sự sai lệch giữa `setup.providers` / `setup.cliBackends` và các nhà cung cấp hoặc backend CLI
thực sự được setup-api đăng ký mà không chặn các Plugin cũ.

### Ranh giới bộ nhớ đệm Plugin

OpenClaw không lưu vào bộ nhớ đệm kết quả phát hiện Plugin hoặc dữ liệu registry manifest trực tiếp
theo các khoảng thời gian đồng hồ thực. Các thay đổi về cài đặt, manifest và đường dẫn tải
phải hiển thị ở lần đọc siêu dữ liệu tường minh hoặc dựng lại snapshot tiếp theo.
Trình phân tích tệp manifest duy trì bộ nhớ đệm chữ ký tệp có giới hạn, được lập khóa theo
đường dẫn manifest đã mở cùng thiết bị/inode, kích thước và mtime/ctime; bộ nhớ đệm đó chỉ
tránh phân tích lại các byte không đổi và không được lưu vào bộ nhớ đệm các câu trả lời về phát hiện, registry,
chủ sở hữu hoặc chính sách.

Đường dẫn nhanh an toàn cho siêu dữ liệu là quyền sở hữu đối tượng tường minh, không phải bộ nhớ đệm ẩn.
Các đường dẫn nóng khi khởi động Gateway nên truyền `PluginMetadataSnapshot` hiện tại,
`PluginLookUpTable` đã suy ra hoặc một registry manifest tường minh xuyên suốt chuỗi gọi.
Quá trình xác thực cấu hình, tự động bật khi khởi động, khởi tạo Plugin và lựa chọn nhà cung cấp
có thể tái sử dụng các đối tượng đó trong khi chúng đại diện cho cấu hình và
kho Plugin hiện tại. Quá trình tra cứu thiết lập vẫn dựng lại siêu dữ liệu manifest theo yêu cầu
trừ khi đường dẫn thiết lập cụ thể nhận được một registry manifest tường minh; hãy giữ
đó làm phương án dự phòng cho đường dẫn ít dùng thay vì thêm bộ nhớ đệm tra cứu ẩn. Khi
đầu vào thay đổi, hãy dựng lại và thay thế snapshot thay vì sửa đổi snapshot hoặc
giữ các bản sao lịch sử. Các khung nhìn trên registry Plugin đang hoạt động và trình trợ giúp
khởi tạo kênh tích hợp sẵn nên được tính toán lại từ registry/gốc hiện tại.
Có thể dùng các map tồn tại trong thời gian ngắn bên trong một lời gọi để loại bỏ công việc trùng lặp hoặc
ngăn tái nhập; chúng không được trở thành bộ nhớ đệm siêu dữ liệu của tiến trình.

Đối với việc tải Plugin, lớp bộ nhớ đệm bền vững là quá trình tải runtime. Lớp này có thể tái sử dụng
trạng thái trình tải khi mã hoặc artifact đã cài đặt thực sự được tải, chẳng hạn như:

- `PluginLoaderCacheState` và các registry runtime đang hoạt động tương thích
- bộ nhớ đệm jiti/mô-đun và bộ nhớ đệm trình tải bề mặt công khai dùng để tránh import
  lặp lại cùng một bề mặt runtime
- bộ nhớ đệm hệ thống tệp cho artifact Plugin đã cài đặt
- các map tồn tại trong thời gian ngắn theo từng lời gọi để chuẩn hóa đường dẫn hoặc phân giải trùng lặp

Các bộ nhớ đệm đó là chi tiết triển khai của mặt phẳng dữ liệu. Chúng không được trả lời
các câu hỏi của mặt phẳng điều khiển như "Plugin nào sở hữu nhà cung cấp này?" trừ khi
bên gọi chủ ý yêu cầu tải runtime.

Không thêm bộ nhớ đệm bền vững hoặc theo đồng hồ thực cho:

- kết quả phát hiện
- registry manifest trực tiếp
- registry manifest được dựng lại từ chỉ mục Plugin đã cài đặt
- tra cứu chủ sở hữu nhà cung cấp, chặn mô hình, chính sách nhà cung cấp hoặc siêu dữ liệu
  artifact công khai
- bất kỳ câu trả lời nào khác suy ra từ manifest mà trong đó manifest, chỉ mục cài đặt
  hoặc đường dẫn tải đã thay đổi phải hiển thị ở lần đọc siêu dữ liệu tiếp theo

Các bên gọi dựng lại siêu dữ liệu manifest từ chỉ mục Plugin đã cài đặt được lưu bền vững sẽ
dựng lại registry đó theo yêu cầu. Chỉ mục đã cài đặt là trạng thái mặt phẳng nguồn bền vững;
nó không phải bộ nhớ đệm siêu dữ liệu ẩn trong tiến trình.

## Mô hình registry

Các Plugin đã tải không trực tiếp sửa đổi tùy tiện các biến toàn cục của lõi. Chúng đăng ký vào một
registry Plugin trung tâm (`PluginRegistry` trong `src/plugins/registry-types.ts`),
registry này theo dõi các bản ghi Plugin (danh tính, nguồn, xuất xứ, trạng thái, chẩn đoán)
cùng các mảng cho mọi khả năng: công cụ, hook cũ và hook có kiểu,
kênh, nhà cung cấp, trình xử lý RPC của Gateway, tuyến HTTP, trình đăng ký CLI,
dịch vụ nền, lệnh thuộc sở hữu Plugin và hàng chục họ nhà cung cấp có kiểu khác
(giọng nói, embedding, tạo hình ảnh/video/nhạc, tìm nạp/tìm kiếm web,
bộ khung tác nhân, hành động phiên, v.v.).

Sau đó, các tính năng lõi đọc từ registry đó thay vì giao tiếp trực tiếp với
các mô-đun Plugin. Điều này giữ quá trình tải theo một chiều:

- mô-đun Plugin -> đăng ký registry
- runtime lõi -> sử dụng registry

Sự phân tách đó quan trọng đối với khả năng bảo trì. Điều này có nghĩa là hầu hết các bề mặt lõi chỉ
cần một điểm tích hợp: "đọc registry", thay vì "xử lý riêng từng
mô-đun Plugin".

## Callback liên kết cuộc trò chuyện

Các Plugin liên kết một cuộc trò chuyện có thể phản ứng khi một yêu cầu phê duyệt được giải quyết.

Sử dụng `api.onConversationBindingResolved(...)` để nhận callback sau khi một yêu cầu liên kết
được phê duyệt hoặc từ chối:

```ts
export default {
  id: "my-plugin",
  register(api) {
    api.onConversationBindingResolved(async (event) => {
      if (event.status === "approved") {
        // Hiện đã tồn tại liên kết cho Plugin + cuộc trò chuyện này.
        console.log(event.binding?.conversationId);
        return;
      }

      // Yêu cầu đã bị từ chối; xóa mọi trạng thái cục bộ đang chờ xử lý.
      console.log(event.request.conversation.conversationId);
    });
  },
};
```

Các trường của payload callback:

- `status`: `"approved"` hoặc `"denied"`
- `decision`: `"allow-once"`, `"allow-always"` hoặc `"deny"`
- `binding`: liên kết đã phân giải cho các yêu cầu được phê duyệt
- `request`: bản tóm tắt yêu cầu ban đầu, gợi ý tách, id người gửi và
  siêu dữ liệu cuộc trò chuyện

Callback này chỉ dùng để thông báo. Nó không thay đổi đối tượng được phép liên kết
cuộc trò chuyện và chạy sau khi quá trình xử lý phê duyệt của lõi hoàn tất.

## Hook runtime của nhà cung cấp

Plugin nhà cung cấp có ba lớp:

- **Siêu dữ liệu manifest** để tra cứu trước thời điểm chạy với chi phí thấp:
  `setup.providers[].envVars`, khả năng tương thích đã lỗi thời `providerAuthEnvVars`,
  `providerAuthAliases`, `providerAuthChoices` và `channelEnvVars`.
- **Hook tại thời điểm cấu hình**: `catalog` (`discovery` cũ) cùng với
  `applyConfigDefaults`.
- **Hook thời gian chạy**: hơn 40 hook tùy chọn bao quát xác thực, phân giải mô hình,
  bọc luồng, mức độ suy luận, chính sách phát lại và các endpoint mức sử dụng. Xem
  [Thứ tự và cách sử dụng hook](#hook-order-and-usage).

OpenClaw vẫn sở hữu vòng lặp tác nhân chung, cơ chế chuyển đổi dự phòng, xử lý bản ghi hội thoại và
chính sách công cụ. Các hook này là bề mặt mở rộng dành cho hành vi
đặc thù của nhà cung cấp mà không cần toàn bộ một cơ chế truyền tải suy luận tùy chỉnh.

Sử dụng `setup.providers[].envVars` trong manifest khi nhà cung cấp có thông tin xác thực dựa trên
biến môi trường mà các luồng xác thực/trạng thái/trình chọn mô hình chung cần nhận biết mà không
tải thời gian chạy của plugin. `providerAuthEnvVars` đã lỗi thời vẫn được bộ điều hợp
tương thích đọc trong thời gian ngừng hỗ trợ, và các plugin không được đóng gói
sử dụng trường này sẽ nhận được chẩn đoán manifest. Sử dụng `providerAuthAliases`
trong manifest khi một mã định danh nhà cung cấp cần tái sử dụng biến môi trường, hồ sơ xác thực,
xác thực dựa trên cấu hình và lựa chọn thiết lập API key của một mã định danh nhà cung cấp khác. Sử dụng
`providerAuthChoices` trong manifest khi các bề mặt CLI về thiết lập/lựa chọn xác thực cần biết
mã định danh lựa chọn, nhãn nhóm và cách nối dây xác thực đơn giản bằng một cờ của
nhà cung cấp mà không tải thời gian chạy của nhà cung cấp. Giữ
`envVars` trong thời gian chạy của nhà cung cấp cho các gợi ý hướng đến người vận hành như nhãn thiết lập hoặc
các biến cấu hình client-id/client-secret OAuth.

Sử dụng `channelEnvVars` trong manifest khi một kênh có xác thực hoặc thiết lập dựa trên biến môi trường mà
cơ chế dự phòng biến môi trường shell chung, các bước kiểm tra cấu hình/trạng thái hoặc lời nhắc thiết lập cần nhận biết
mà không tải thời gian chạy của kênh.

### Thứ tự và cách sử dụng hook

Đối với các plugin mô hình/nhà cung cấp, OpenClaw gọi các hook theo thứ tự gần đúng sau.
Cột "Khi nào nên dùng" là hướng dẫn quyết định nhanh.
Các trường nhà cung cấp chỉ dành cho khả năng tương thích mà OpenClaw không còn gọi, chẳng hạn như
`ProviderPlugin.capabilities` và `suppressBuiltInModel`, được chủ ý không
liệt kê tại đây.

| Hook                              | Chức năng                                                                                                      | Khi nào nên dùng                                                                                                                              |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `catalog`                         | Đưa cấu hình nhà cung cấp vào `models.providers` trong quá trình tạo `models.json`                             | Nhà cung cấp sở hữu danh mục hoặc các giá trị mặc định của URL cơ sở                                                                          |
| `applyConfigDefaults`             | Áp dụng các giá trị mặc định của cấu hình toàn cục do nhà cung cấp sở hữu trong quá trình hiện thực hóa cấu hình | Các giá trị mặc định phụ thuộc vào chế độ xác thực, môi trường hoặc ngữ nghĩa họ mô hình của nhà cung cấp                                      |
| _(tra cứu mô hình tích hợp sẵn)_         | OpenClaw thử đường dẫn registry/danh mục thông thường trước                                                     | _(không phải hook của plugin)_                                                                                                                |
| `normalizeModelId`                | Chuẩn hóa các bí danh ID mô hình cũ hoặc thử nghiệm trước khi tra cứu                                           | Nhà cung cấp sở hữu việc dọn dẹp bí danh trước khi phân giải mô hình chuẩn                                                                    |
| `normalizeTransport`              | Chuẩn hóa `api` / `baseUrl` của họ nhà cung cấp trước khi lắp ráp mô hình chung                 | Nhà cung cấp sở hữu việc dọn dẹp transport cho các ID nhà cung cấp tùy chỉnh trong cùng một họ transport                                      |
| `normalizeConfig`                 | Chuẩn hóa `models.providers.<id>` trước khi phân giải runtime/nhà cung cấp                                      | Nhà cung cấp cần dọn dẹp cấu hình và việc này nên nằm trong plugin; các trình trợ giúp tích hợp thuộc họ Google cũng dự phòng cho các mục cấu hình Google được hỗ trợ |
| `applyNativeStreamingUsageCompat` | Áp dụng các phép ghi lại tương thích sử dụng streaming gốc cho các nhà cung cấp trong cấu hình                  | Nhà cung cấp cần sửa siêu dữ liệu sử dụng streaming gốc dựa trên endpoint                                                                     |
| `resolveConfigApiKey`             | Phân giải xác thực bằng dấu hiệu môi trường cho các nhà cung cấp trong cấu hình trước khi tải xác thực runtime  | Các nhà cung cấp cung cấp hook riêng để phân giải khóa API bằng dấu hiệu môi trường                                                            |
| `resolveSyntheticAuth`            | Hiển thị xác thực cục bộ/tự lưu trữ hoặc dựa trên cấu hình mà không lưu văn bản thuần                           | Nhà cung cấp có thể hoạt động với dấu hiệu thông tin xác thực tổng hợp/cục bộ                                                                 |
| `resolveExternalAuthProfiles`     | Phủ các hồ sơ xác thực bên ngoài do nhà cung cấp sở hữu; `persistence` mặc định là `runtime-only` cho thông tin xác thực do CLI/ứng dụng sở hữu | Nhà cung cấp tái sử dụng thông tin xác thực bên ngoài mà không lưu các refresh token đã sao chép; khai báo `contracts.externalAuthProviders` trong manifest |
| `shouldDeferSyntheticProfileAuth` | Hạ mức ưu tiên của các phần giữ chỗ hồ sơ tổng hợp đã lưu khi có xác thực dựa trên môi trường/cấu hình          | Nhà cung cấp lưu các hồ sơ phần giữ chỗ tổng hợp không nên được ưu tiên                                                                       |
| `resolveDynamicModel`             | Đồng bộ dự phòng cho các ID mô hình do nhà cung cấp sở hữu nhưng chưa có trong registry cục bộ                  | Nhà cung cấp chấp nhận ID mô hình upstream tùy ý                                                                                              |
| `prepareDynamicModel`             | Khởi động trước bất đồng bộ, sau đó `resolveDynamicModel` chạy lại                                             | Nhà cung cấp cần siêu dữ liệu mạng trước khi phân giải các ID chưa biết                                                                        |
| `normalizeResolvedModel`          | Ghi lại lần cuối trước khi trình chạy nhúng sử dụng mô hình đã phân giải                                        | Nhà cung cấp cần ghi lại transport nhưng vẫn sử dụng transport lõi                                                                            |
| `normalizeToolSchemas`            | Chuẩn hóa schema công cụ trước khi trình chạy nhúng nhận chúng                                                  | Nhà cung cấp cần dọn dẹp schema của họ transport                                                                                              |
| `inspectToolSchemas`              | Hiển thị chẩn đoán schema do nhà cung cấp sở hữu sau khi chuẩn hóa                                              | Nhà cung cấp muốn cảnh báo từ khóa mà không cần dạy lõi các quy tắc riêng của nhà cung cấp                                                     |
| `resolveReasoningOutputMode`      | Chọn hợp đồng đầu ra suy luận gốc hoặc có thẻ                                                                   | Nhà cung cấp cần đầu ra suy luận/cuối cùng có thẻ thay vì các trường gốc                                                                       |
| `prepareExtraParams`              | Chuẩn hóa tham số yêu cầu trước các trình bao tùy chọn luồng chung                                              | Nhà cung cấp cần tham số yêu cầu mặc định hoặc dọn dẹp tham số theo từng nhà cung cấp                                                          |
| `createStreamFn`                  | Thay thế hoàn toàn đường dẫn luồng thông thường bằng transport tùy chỉnh                                        | Nhà cung cấp cần giao thức truyền dẫn tùy chỉnh, không chỉ là một trình bao                                                                   |
| `wrapStreamFn`                    | Trình bao luồng sau khi áp dụng các trình bao chung                                                             | Nhà cung cấp cần các trình bao tương thích cho header/body/mô hình của yêu cầu mà không cần transport tùy chỉnh                                |
| `resolveTransportTurnState`       | Đính kèm header hoặc siêu dữ liệu transport gốc theo từng lượt                                                  | Nhà cung cấp muốn các transport chung gửi danh tính lượt theo định dạng gốc của nhà cung cấp                                                   |
| `resolveWebSocketSessionPolicy`   | Đính kèm header WebSocket gốc hoặc chính sách thời gian chờ phiên                                               | Nhà cung cấp muốn các transport WS chung điều chỉnh header phiên hoặc chính sách dự phòng                                                      |
| `formatApiKey`                    | Trình định dạng hồ sơ xác thực: hồ sơ đã lưu trở thành chuỗi `apiKey` của runtime                          | Nhà cung cấp lưu siêu dữ liệu xác thực bổ sung và cần định dạng token runtime tùy chỉnh                                                        |
| `refreshOAuth`                    | Ghi đè làm mới OAuth cho endpoint làm mới tùy chỉnh hoặc chính sách khi làm mới thất bại                        | Nhà cung cấp không phù hợp với các trình làm mới dùng chung của OpenClaw                                                                      |
| `buildAuthDoctorHint`             | Gợi ý sửa chữa được nối thêm khi làm mới OAuth thất bại                                                         | Nhà cung cấp cần hướng dẫn sửa chữa xác thực do chính nhà cung cấp sở hữu sau khi làm mới thất bại                                             |
| `matchesContextOverflowError`     | Bộ so khớp tràn cửa sổ ngữ cảnh do nhà cung cấp sở hữu                                                          | Nhà cung cấp có các lỗi tràn thô mà phương pháp phỏng đoán chung sẽ bỏ sót                                                                    |
| `classifyFailoverReason`          | Phân loại lý do chuyển đổi dự phòng do nhà cung cấp sở hữu                                                      | Nhà cung cấp có thể ánh xạ lỗi API/transport thô thành giới hạn tốc độ/quá tải/v.v.                                                            |
| `isCacheTtlEligible`              | Chính sách bộ nhớ đệm prompt cho nhà cung cấp proxy/backhaul                                                    | Nhà cung cấp cần kiểm soát TTL bộ nhớ đệm dành riêng cho proxy                                                                                |
| `buildMissingAuthMessage`         | Thay thế thông báo khôi phục khi thiếu xác thực chung                                                           | Nhà cung cấp cần gợi ý khôi phục khi thiếu xác thực dành riêng cho nhà cung cấp                                                               |
| `augmentModelCatalog`             | Các hàng danh mục tổng hợp/cuối cùng được nối thêm sau khi khám phá (đã lỗi thời, xem bên dưới)                 | Nhà cung cấp cần các hàng tương thích chuyển tiếp tổng hợp trong `models list` và các bộ chọn                                                |
| `resolveThinkingProfile`          | Tập hợp cấp độ `/think`, nhãn hiển thị và giá trị mặc định theo từng mô hình                                | Nhà cung cấp cung cấp thang tư duy tùy chỉnh hoặc nhãn nhị phân cho các mô hình được chọn                                                      |
| `isBinaryThinking`                | Hook tương thích bật/tắt suy luận                                                                               | Nhà cung cấp chỉ cung cấp chế độ tư duy nhị phân bật/tắt                                                                                      |
| `supportsXHighThinking`           | Hook tương thích hỗ trợ suy luận `xhigh`                                                                      | Nhà cung cấp chỉ muốn `xhigh` trên một tập hợp con các mô hình                                                                               |
| `resolveDefaultThinkingLevel`     | Hook tương thích cho cấp độ `/think` mặc định                                                                  | Nhà cung cấp sở hữu chính sách `/think` mặc định cho một họ mô hình                                                                          |
| `isModernModelRef`                | Bộ so khớp mô hình hiện đại cho bộ lọc hồ sơ trực tiếp và lựa chọn kiểm thử nhanh                              | Nhà cung cấp sở hữu việc so khớp mô hình ưu tiên cho kiểm thử trực tiếp/nhanh                                                                 |
| `prepareRuntimeAuth`              | Trao đổi thông tin xác thực đã cấu hình thành token/khóa runtime thực tế ngay trước khi suy luận                | Nhà cung cấp cần trao đổi token hoặc thông tin xác thực yêu cầu ngắn hạn                                                                      |
| `resolveUsageAuth`                | Phân giải thông tin xác thực về mức sử dụng/thanh toán cho `/usage` và các bề mặt trạng thái liên quan       | Nhà cung cấp cần phân tích token mức sử dụng/hạn ngạch tùy chỉnh hoặc thông tin xác thực mức sử dụng khác                                      |
| `fetchUsageSnapshot`              | Tìm nạp và chuẩn hóa ảnh chụp mức sử dụng/hạn ngạch riêng của nhà cung cấp sau khi phân giải xác thực           | Nhà cung cấp cần endpoint mức sử dụng hoặc trình phân tích payload dành riêng cho nhà cung cấp                                                |
| `createEmbeddingProvider`         | Xây dựng bộ điều hợp embedding do nhà cung cấp sở hữu cho bộ nhớ/tìm kiếm                                                     | Hành vi embedding bộ nhớ thuộc về Plugin của nhà cung cấp                                                                                    |
| `buildReplayPolicy`               | Trả về chính sách phát lại kiểm soát việc xử lý bản ghi hội thoại cho nhà cung cấp                                        | Nhà cung cấp cần chính sách bản ghi hội thoại tùy chỉnh (ví dụ: loại bỏ khối suy luận)                                                               |
| `sanitizeReplayHistory`           | Viết lại lịch sử phát lại sau khi dọn dẹp bản ghi hội thoại chung                                                        | Nhà cung cấp cần các phép viết lại phát lại dành riêng cho nhà cung cấp ngoài các trình trợ giúp Compaction dùng chung                                                             |
| `validateReplayTurns`             | Xác thực hoặc định hình lại lượt phát lại cuối cùng trước trình chạy nhúng                                           | Cơ chế truyền tải của nhà cung cấp cần xác thực lượt chặt chẽ hơn sau quá trình làm sạch chung                                                                    |
| `onModelSelected`                 | Chạy các hiệu ứng phụ sau khi lựa chọn do nhà cung cấp sở hữu                                                                 | Nhà cung cấp cần dữ liệu đo từ xa hoặc trạng thái do nhà cung cấp sở hữu khi một mô hình được kích hoạt                                                                  |

`normalizeModelId`, `normalizeTransport` và `normalizeConfig` trước tiên kiểm tra
plugin nhà cung cấp khớp, sau đó lần lượt chuyển qua các plugin nhà cung cấp khác có hỗ trợ hook
cho đến khi một plugin thực sự thay đổi id mô hình hoặc phương thức truyền tải/cấu hình. Điều đó giúp
các shim bí danh/tương thích của nhà cung cấp tiếp tục hoạt động mà không yêu cầu bên gọi phải biết
plugin đi kèm nào sở hữu thao tác viết lại. Nếu không có hook nhà cung cấp nào viết lại một mục
cấu hình được hỗ trợ thuộc họ Google, trình chuẩn hóa cấu hình Google đi kèm vẫn áp dụng
việc dọn dẹp tương thích đó.

Nếu nhà cung cấp cần một giao thức truyền hoàn toàn tùy chỉnh hoặc trình thực thi yêu cầu tùy chỉnh,
thì đó là một loại tiện ích mở rộng khác. Các hook này dành cho hành vi của nhà cung cấp
vẫn chạy trên vòng lặp suy luận thông thường của OpenClaw.

`resolveUsageAuth` quyết định OpenClaw nên gọi `fetchUsageSnapshot` hay
chuyển về cơ chế phân giải thông tin xác thực chung cho các bề mặt mức sử dụng/trạng thái. Trả về
`{ token, accountId?, subscriptionType?, rateLimitTier? }` khi nhà cung cấp
có thông tin xác thực mức sử dụng (siêu dữ liệu gói tùy chọn được truyền vào
`fetchUsageSnapshot`), trả về
`{ handled: true }` khi cơ chế xác thực mức sử dụng do nhà cung cấp sở hữu đã xử lý yêu cầu và
phải ngăn cơ chế dự phòng khóa API/OAuth chung, đồng thời trả về `null` hoặc `undefined`
khi nhà cung cấp không xử lý xác thực mức sử dụng.

Khai báo thông tin xác thực của tổ chức hoặc thanh toán trong manifest
`providerUsageAuthEnvVars`. Điều này cho phép các bề mặt khám phá chung và xóa dữ liệu bí mật
nhận diện chúng mà không biến chúng thành ứng viên xác thực suy luận.

### Ví dụ về nhà cung cấp

```ts
api.registerProvider({
  id: "example-proxy",
  label: "Example Proxy",
  auth: [],
  catalog: {
    order: "simple",
    run: async (ctx) => {
      const apiKey = ctx.resolveProviderApiKey("example-proxy").apiKey;
      if (!apiKey) {
        return null;
      }
      return {
        provider: {
          baseUrl: "https://proxy.example.com/v1",
          apiKey,
          api: "openai-completions",
          models: [{ id: "auto", name: "Auto" }],
        },
      };
    },
  },
  resolveDynamicModel: (ctx) => ({
    id: ctx.modelId,
    name: ctx.modelId,
    provider: "example-proxy",
    api: "openai-completions",
    baseUrl: "https://proxy.example.com/v1",
    reasoning: false,
    input: ["text"],
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    contextWindow: 128000,
    maxTokens: 8192,
  }),
  prepareRuntimeAuth: async (ctx) => {
    const exchanged = await exchangeToken(ctx.apiKey);
    return {
      apiKey: exchanged.token,
      baseUrl: exchanged.baseUrl,
      expiresAt: exchanged.expiresAt,
    };
  },
  resolveUsageAuth: async (ctx) => {
    const auth = await ctx.resolveOAuthToken();
    return auth ? { token: auth.token } : null;
  },
  fetchUsageSnapshot: async (ctx) => {
    return await fetchExampleProxyUsage(ctx.token, ctx.timeoutMs, ctx.fetchFn);
  },
});
```

### Ví dụ tích hợp sẵn

Các plugin nhà cung cấp đi kèm kết hợp những hook ở trên để phù hợp với nhu cầu về danh mục,
xác thực, suy luận, phát lại và mức sử dụng của từng nhà cung cấp. Tập hợp hook có thẩm quyền nằm cùng
mỗi plugin trong `extensions/`; trang này minh họa các dạng thay vì
sao chép danh sách.

<AccordionGroup>
  <Accordion title="Nhà cung cấp danh mục chuyển tiếp">
    OpenRouter, Kilocode, Z.AI, xAI đăng ký `catalog` cùng với
    `resolveDynamicModel` / `prepareDynamicModel` để có thể hiển thị các
    id mô hình thượng nguồn trước danh mục tĩnh của OpenClaw.
  </Accordion>
  <Accordion title="Nhà cung cấp điểm cuối OAuth và mức sử dụng">
    GitHub Copilot, Gemini CLI, ChatGPT Codex, MiniMax, Xiaomi, z.ai kết hợp
    `prepareRuntimeAuth` hoặc `formatApiKey` với `resolveUsageAuth` +
    `fetchUsageSnapshot` để sở hữu việc trao đổi token và tích hợp `/usage`.
  </Accordion>
  <Accordion title="Các họ dọn dẹp phát lại và bản ghi">
    Các họ dùng chung có tên (`google-gemini`, `passthrough-gemini`,
    `anthropic-by-model`, `hybrid-anthropic-openai`) cho phép nhà cung cấp chọn dùng
    chính sách bản ghi thông qua `buildReplayPolicy` thay vì để từng plugin
    tự triển khai lại việc dọn dẹp.
  </Accordion>
  <Accordion title="Nhà cung cấp chỉ có danh mục">
    `byteplus`, `cloudflare-ai-gateway`, `huggingface`, `kimi-coding`, `nvidia`,
    `qianfan`, `synthetic`, `together`, `venice`, `vercel-ai-gateway` và
    `volcengine` chỉ đăng ký `catalog` và sử dụng vòng lặp suy luận dùng chung.
  </Accordion>
  <Accordion title="Trình trợ giúp luồng dành riêng cho Anthropic">
    Các header beta, `/fast` / `serviceTier` và `context1m` nằm trong
    đường nối `api.ts` / `contract-api.ts` công khai của plugin Anthropic
    (`wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`) thay vì trong
    SDK chung.
  </Accordion>
</AccordionGroup>

## Trình trợ giúp runtime

Các plugin có thể truy cập một số trình trợ giúp lõi đã chọn thông qua `api.runtime`. Đối với TTS:

```ts
const clip = await api.runtime.tts.textToSpeech({
  text: "Xin chào từ OpenClaw",
  cfg: api.config,
});

const result = await api.runtime.tts.textToSpeechTelephony({
  text: "Xin chào từ OpenClaw",
  cfg: api.config,
});

const voices = await api.runtime.tts.listVoices({
  provider: "elevenlabs",
  cfg: api.config,
});
```

Lưu ý:

- `textToSpeech` trả về payload đầu ra TTS lõi thông thường cho các bề mặt tệp/ghi chú thoại.
- Sử dụng cấu hình `messages.tts` và lựa chọn nhà cung cấp của lõi.
- Trả về bộ đệm âm thanh PCM + tốc độ lấy mẫu. Các plugin phải lấy mẫu lại/mã hóa cho nhà cung cấp.
- `listVoices` là tùy chọn theo từng nhà cung cấp. Sử dụng nó cho trình chọn giọng nói hoặc luồng thiết lập do nhà cung cấp sở hữu.
- Lõi truyền thời hạn yêu cầu đã phân giải đến các hook `listVoices` của nhà cung cấp; cài đặt thời gian chờ riêng của nhà cung cấp có thể ghi đè thời hạn đó.
- Danh sách giọng nói có thể bao gồm siêu dữ liệu phong phú hơn như ngôn ngữ, giới tính và thẻ tính cách cho các trình chọn nhận biết nhà cung cấp.
- OpenAI và ElevenLabs hiện hỗ trợ điện thoại. Microsoft thì không.

Các plugin cũng có thể đăng ký nhà cung cấp giọng nói thông qua `api.registerSpeechProvider(...)`.

```ts
api.registerSpeechProvider({
  id: "acme-speech",
  label: "Acme Speech",
  isConfigured: ({ config }) => Boolean(config.messages?.tts),
  synthesize: async (req) => {
    return {
      audioBuffer: Buffer.from([]),
      outputFormat: "mp3",
      fileExtension: ".mp3",
      voiceCompatible: false,
    };
  },
});
```

Lưu ý:

- Giữ chính sách TTS, cơ chế dự phòng và phân phối phản hồi trong lõi.
- Sử dụng nhà cung cấp giọng nói cho hành vi tổng hợp do nhà cung cấp sở hữu.
- Đầu vào Microsoft `edge` cũ được chuẩn hóa thành id nhà cung cấp `microsoft`.
- Mô hình quyền sở hữu ưu tiên được định hướng theo công ty: một plugin nhà cung cấp có thể sở hữu
  các nhà cung cấp văn bản, giọng nói, hình ảnh và phương tiện trong tương lai khi OpenClaw bổ sung
  các hợp đồng khả năng đó.

Để hiểu hình ảnh/âm thanh/video, các plugin đăng ký một nhà cung cấp
hiểu phương tiện có kiểu thay vì một tập hợp khóa/giá trị chung:

```ts
api.registerMediaUnderstandingProvider({
  id: "google",
  capabilities: ["image", "audio", "video"],
  describeImage: async (req) => ({ text: "..." }),
  transcribeAudio: async (req) => ({ text: "..." }),
  describeVideo: async (req) => ({ text: "..." }),
});
```

Lưu ý:

- Giữ việc điều phối, cơ chế dự phòng, cấu hình và kết nối kênh trong lõi.
- Giữ hành vi của nhà cung cấp trong plugin nhà cung cấp.
- Việc mở rộng bổ sung nên duy trì kiểu: các phương thức tùy chọn mới, các trường
  kết quả tùy chọn mới, các khả năng tùy chọn mới.
- Việc tạo video đã tuân theo cùng một mẫu:
  - lõi sở hữu hợp đồng khả năng và trình trợ giúp runtime
  - các plugin nhà cung cấp đăng ký `api.registerVideoGenerationProvider(...)`
  - các plugin tính năng/kênh sử dụng `api.runtime.videoGeneration.*`

Đối với trình trợ giúp runtime hiểu phương tiện, các plugin có thể gọi:

```ts
const image = await api.runtime.mediaUnderstanding.describeImageFile({
  filePath: "/tmp/inbound-photo.jpg",
  cfg: api.config,
  agentDir: "/tmp/agent",
});

const video = await api.runtime.mediaUnderstanding.describeVideoFile({
  filePath: "/tmp/inbound-video.mp4",
  cfg: api.config,
});

const extraction = await api.runtime.mediaUnderstanding.extractStructuredWithModel({
  provider: "codex",
  model: "gpt-5.6-sol",
  input: [
    {
      type: "image",
      buffer: receiptImageBuffer,
      fileName: "receipt.png",
      mime: "image/png",
    },
    { type: "text", text: "Sử dụng các trường được in làm nguồn sự thật." },
  ],
  instructions: "Trả về các thực thể và thẻ có thể tìm kiếm.",
  schemaName: "example.evidence",
  jsonSchema: {
    type: "object",
    properties: {
      entities: { type: "array", items: { type: "string" } },
      tags: { type: "array", items: { type: "string" } },
    },
  },
  cfg: api.config,
});
```

Đối với phiên âm âm thanh, các plugin có thể sử dụng runtime hiểu phương tiện
hoặc bí danh STT cũ hơn:

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // Tùy chọn khi không thể suy luận MIME một cách đáng tin cậy:
  mime: "audio/ogg",
});
```

Lưu ý:

- `api.runtime.mediaUnderstanding.*` là bề mặt dùng chung ưu tiên để
  hiểu hình ảnh/âm thanh/video.
- `extractStructuredWithModel(...)` là đường nối dành cho plugin để thực hiện việc trích xuất
  ưu tiên hình ảnh có giới hạn do nhà cung cấp sở hữu. Bao gồm ít nhất một đầu vào hình ảnh;
  đầu vào văn bản là ngữ cảnh bổ sung. Các plugin sản phẩm sở hữu tuyến và
  schema của chúng, trong khi OpenClaw sở hữu ranh giới nhà cung cấp/runtime.
- Sử dụng cấu hình âm thanh hiểu phương tiện của lõi (`tools.media.audio`) và thứ tự dự phòng nhà cung cấp.
- Trả về `{ text: undefined }` khi không tạo ra đầu ra phiên âm nào (ví dụ: đầu vào bị bỏ qua/không được hỗ trợ).
- `api.runtime.stt.transcribeAudioFile(...)` vẫn được giữ làm bí danh tương thích.

Các plugin cũng có thể khởi chạy các lượt chạy subagent nền thông qua `api.runtime.subagent`:

```ts
const result = await api.runtime.subagent.run({
  sessionKey: "agent:main:subagent:search-helper",
  message: "Mở rộng truy vấn này thành các tìm kiếm tiếp theo có trọng tâm.",
  toolsAlsoAllow: ["my_plugin_progress"],
  provider: "openai",
  model: "gpt-4.1-mini",
  deliver: false,
});
```

Lưu ý:

- `provider` và `model` là các giá trị ghi đè tùy chọn theo từng lượt chạy, không phải thay đổi phiên lâu dài.
- `toolsAlsoAllow` chấp nhận các tên công cụ chính xác, có chủ sở hữu duy nhất do plugin gọi đăng ký. Tên lõi và tên không rõ ràng bị từ chối. Nó được bổ sung vào hồ sơ thông thường, nhưng danh sách cho phép và danh sách từ chối của người vận hành vẫn có thẩm quyền.
- OpenClaw chỉ tuân theo các trường ghi đè đó đối với bên gọi đáng tin cậy.
- Đối với các lượt chạy dự phòng do plugin sở hữu, người vận hành phải chủ động chọn dùng bằng `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Sử dụng `plugins.entries.<id>.subagent.allowedModels` để giới hạn các plugin đáng tin cậy ở những đích `provider/model` chuẩn tắc cụ thể, hoặc `"*"` để cho phép rõ ràng mọi đích.
- Các lượt chạy subagent của plugin không đáng tin cậy vẫn hoạt động, nhưng yêu cầu ghi đè bị từ chối thay vì âm thầm chuyển về cơ chế dự phòng.
- Các phiên subagent do plugin tạo được gắn thẻ bằng id của plugin tạo ra. `api.runtime.subagent.deleteSession(...)` dự phòng chỉ có thể xóa các phiên thuộc sở hữu đó; việc xóa phiên tùy ý vẫn yêu cầu một yêu cầu Gateway có phạm vi quản trị viên.

Đối với tìm kiếm web, các plugin có thể sử dụng trình trợ giúp runtime dùng chung thay vì
truy cập vào hệ thống kết nối công cụ của tác nhân:

```ts
const providers = api.runtime.webSearch.listProviders({
  config: api.config,
});

const result = await api.runtime.webSearch.search({
  config: api.config,
  args: {
    query: "Trình trợ giúp runtime plugin OpenClaw",
    count: 5,
  },
});
```

Các plugin cũng có thể đăng ký nhà cung cấp tìm kiếm web thông qua
`api.registerWebSearchProvider(...)`.

Lưu ý:

- Giữ việc lựa chọn nhà cung cấp, phân giải thông tin xác thực và ngữ nghĩa yêu cầu dùng chung trong lõi.
- Sử dụng các nhà cung cấp tìm kiếm web cho những phương thức truyền tải tìm kiếm dành riêng cho từng nhà cung cấp.
- `api.runtime.webSearch.*` là bề mặt dùng chung được ưu tiên cho các Plugin tính năng/kênh cần hành vi tìm kiếm mà không phụ thuộc vào trình bao công cụ tác tử.

### `api.runtime.imageGeneration`

```ts
const result = await api.runtime.imageGeneration.generate({
  config: api.config,
  args: { prompt: "Một linh vật tôm hùm thân thiện", size: "1024x1024" },
});

const providers = api.runtime.imageGeneration.listProviders({
  config: api.config,
});
```

- `generate(...)`: tạo hình ảnh bằng chuỗi nhà cung cấp tạo hình ảnh đã cấu hình.
- `listProviders(...)`: liệt kê các nhà cung cấp tạo hình ảnh hiện có và khả năng của họ.

## Các tuyến HTTP của Gateway

Plugin có thể cung cấp các điểm cuối HTTP bằng `api.registerHttpRoute(...)`.

```ts
api.registerHttpRoute({
  path: "/acme/webhook",
  auth: "plugin",
  match: "exact",
  handler: async (_req, res) => {
    res.statusCode = 200;
    res.end("ok");
    return true;
  },
});
```

Các trường của tuyến:

- `path`: đường dẫn tuyến bên dưới máy chủ HTTP của Gateway.
- `auth`: bắt buộc, `"gateway"` hoặc `"plugin"`. Sử dụng `"gateway"` để yêu cầu xác thực Gateway thông thường hoặc `"plugin"` cho việc xác thực/xác minh Webhook do Plugin quản lý.
- `match`: không bắt buộc. `"exact"` (mặc định) hoặc `"prefix"`.
- `handleUpgrade`: trình xử lý không bắt buộc cho các yêu cầu nâng cấp WebSocket trên cùng tuyến.
- `replaceExisting`: không bắt buộc. Cho phép cùng một Plugin thay thế đăng ký tuyến hiện có của chính nó.
- `handler`: trả về `true` khi tuyến đã xử lý yêu cầu.

Lưu ý:

- `api.registerHttpHandler(...)` đã bị xóa và sẽ gây lỗi tải Plugin. Thay vào đó, hãy sử dụng `api.registerHttpRoute(...)`.
- Các tuyến Plugin phải khai báo rõ `auth`.
- Các xung đột `path + match` chính xác sẽ bị từ chối trừ khi `replaceExisting: true`, và một Plugin không thể thay thế tuyến của Plugin khác.
- Các tuyến chồng lấn có mức `auth` khác nhau sẽ bị từ chối. Chỉ duy trì các chuỗi chuyển tiếp `exact`/`prefix` ở cùng một mức xác thực.
- Các tuyến `auth: "plugin"` **không** tự động nhận phạm vi thời gian chạy của người vận hành. Chúng dành cho việc xác minh Webhook/chữ ký do Plugin quản lý, không dành cho các lệnh gọi trợ giúp Gateway có đặc quyền.
- Các tuyến `auth: "gateway"` chạy bên trong phạm vi thời gian chạy của yêu cầu Gateway. Bề mặt mặc định (`gatewayRuntimeScopeSurface: "write-default"`) được thiết kế thận trọng:
  - xác thực bearer bằng bí mật dùng chung (`gateway.auth.mode = "token"` / `"password"`) và mọi phương thức xác thực không dùng proxy đáng tin cậy đều nhận một phạm vi `operator.write` duy nhất, ngay cả khi bên gọi gửi `x-openclaw-scopes`
  - các bên gọi `trusted-proxy` không có tiêu đề `x-openclaw-scopes` rõ ràng cũng chỉ giữ bề mặt `operator.write` cũ
  - các bên gọi `trusted-proxy` có gửi `x-openclaw-scopes` sẽ nhận các phạm vi đã khai báo
  - một tuyến có thể chọn dùng `gatewayRuntimeScopeSurface: "trusted-operator"` để luôn tuân theo `x-openclaw-scopes` đối với các chế độ xác thực mang danh tính (chuyển về tập phạm vi CLI mặc định đầy đủ khi không có tiêu đề)
- Các thẻ Control UI bên ngoài được cách ly và được hỗ trợ bởi các tuyến `auth: "gateway"` sử dụng một quyền cấp cookie đã ký, tồn tại trong thời gian ngắn và chỉ được tạo qua quá trình khởi động đã xác thực; các thẻ xác thực bằng Plugin giữ nguyên đường dẫn iframe trực tiếp. Trước khi gắn kết, phần tử cha chạy một phép thăm dò do tuyến sở hữu bên trong cùng sandbox bất định danh và từ chối an toàn khi chính sách quyền riêng tư của trình duyệt chặn cookie. Quyền cấp được ràng buộc với Plugin sở hữu, gốc tuyến khớp và thế hệ xác thực hiện tại; tên cookie ngẫu nhiên theo tiến trình ngăn các Gateway đáng tin cậy trên cùng máy chủ ghi đè lẫn nhau, nhưng cookie không bao giờ cô lập các cổng TCP. Do đó, tên máy chủ Gateway là một ranh giới thông tin xác thực: không đồng lưu trữ các dịch vụ không tin cậy lẫn nhau trên tên máy chủ đó, kể cả ở các cổng khác. Quá trình điều phối tuyến từ chối việc tái sử dụng đối với tuyến lồng nhau thuộc sở hữu của Plugin khác. Vì các phần tử con trong sandbox được coi là khác trang web cho mục đích cookie, quyền cấp chỉ chấp nhận `GET` và `HEAD` với `operator.read`; các thao tác thay đổi dữ liệu và nâng cấp WebSocket vẫn nằm trên các bề mặt được xác thực Gateway một cách rõ ràng. Cookie này có chủ ý không thể sử dụng CHIPS: các trình duyệt hiện tại đưa một bit tổ tiên khác trang web vào khóa phân vùng, vì vậy các khung sandbox bất định danh lồng nhau sẽ mất quyền truy cập vào tài nguyên cùng tuyến. Cookie yêu cầu ngữ cảnh bảo mật và quyền của trình duyệt đối với cookie khác trang web, vì vậy các thẻ bên ngoài xác thực bằng Gateway không khả dụng trên nguồn LAN HTTP thuần túy hoặc khi cookie bên thứ ba bị chặn hoàn toàn; hãy sử dụng HTTPS/Tailscale Serve hoặc loopback được trình duyệt tin cậy với chính sách cookie tương thích.
- Quyền cấp ngăn việc tiết lộ bearer token của Gateway và việc vô tình tái sử dụng tuyến/phạm vi; nó không tạo ra ranh giới bảo mật giữa các Plugin gốc. Mã Plugin gốc và nội dung UI mà nó cung cấp vẫn thuộc cùng một ranh giới Plugin trong tiến trình đáng tin cậy.
- Quy tắc thực tế: không giả định rằng một tuyến Plugin xác thực bằng Gateway ngầm định là bề mặt quản trị. Nếu tuyến cần hành vi chỉ dành cho quản trị viên, hãy chọn dùng bề mặt phạm vi `trusted-operator`, yêu cầu một chế độ xác thực mang danh tính và ghi tài liệu về hợp đồng tiêu đề `x-openclaw-scopes` rõ ràng.
- Sau khi khớp tuyến và xác thực, các trình xử lý thông thường tham gia quá trình tiếp nhận công việc gốc của Gateway. Gateway đang chuẩn bị hoặc khởi động lại sẽ trả về `503` trước khi gọi trình xử lý. Ngoại lệ hẹp là tuyến `auth: "gateway"` được manifest cấp quyền và đồng thời chọn dùng bề mặt `trusted-operator` dành riêng cho tuyến; tuyến này vẫn có thể truy cập được để quá trình điều phối kiểm soát tạm ngưng không bị mắc kẹt, trong khi các tuyến thông thường cùng cấp của cùng Plugin vẫn nằm sau ranh giới tiếp nhận. Quyền sở hữu `handleUpgrade` của WebSocket sử dụng cùng ranh giới tiếp nhận nguyên tử; sau khi trình xử lý chấp nhận một socket, vòng đời tiếp theo của socket thuộc quyền sở hữu của Plugin và không được ranh giới này theo dõi.

## Đường dẫn nhập Plugin SDK

Sử dụng các đường dẫn con SDK hẹp thay cho barrel gốc `openclaw/plugin-sdk` nguyên khối
khi viết Plugin mới. Các đường dẫn con lõi:

| Đường dẫn con                       | Mục đích                                            |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | Các thành phần cơ bản để đăng ký Plugin             |
| `openclaw/plugin-sdk/channel-core`  | Trình trợ giúp tạo/điểm vào kênh                    |
| `openclaw/plugin-sdk/core`          | Trình trợ giúp dùng chung tổng quát và hợp đồng bao quát |
| `openclaw/plugin-sdk/config-schema` | Lược đồ Zod `openclaw.json` gốc (`OpenClawSchema`) |

Các Plugin kênh chọn từ một nhóm đường nối hẹp — `channel-setup`,
`setup-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-outbound`,
`command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets` và `channel-actions`. Hành vi phê duyệt nên được hợp nhất
trên một hợp đồng `approvalCapability` thay vì trộn lẫn giữa các trường
Plugin không liên quan. Xem [Plugin kênh](/vi/plugins/sdk-channel-plugins).

Các trình trợ giúp thời gian chạy và cấu hình nằm dưới những đường dẫn con `*-runtime` tập trung tương ứng
(`approval-runtime`, `agent-runtime`, `lazy-runtime`, `directory-runtime`,
`text-runtime`, `runtime-store`, `system-event-runtime`, `heartbeat-runtime`,
`channel-activity-runtime`, v.v.). Ưu tiên `config-contracts`,
`plugin-config-runtime`, `runtime-config-snapshot` và `config-mutation`
thay cho barrel tương thích `config-runtime` rộng.

<Info>
`openclaw/plugin-sdk/channel-runtime`, `openclaw/plugin-sdk/channel-lifecycle`,
các facade trình trợ giúp kênh nhỏ, `openclaw/plugin-sdk/outbound-runtime`,
`openclaw/plugin-sdk/outbound-send-deps`, `openclaw/plugin-sdk/config-runtime`
và `openclaw/plugin-sdk/infra-runtime` là các shim tương thích đã lỗi thời dành cho
Plugin cũ. Mã mới nên nhập các thành phần cơ bản tổng quát hẹp hơn.
</Info>

Các điểm vào nội bộ kho lưu trữ (theo gốc gói Plugin đi kèm):

- `index.js` — điểm vào Plugin đi kèm
- `api.js` — barrel trình trợ giúp/kiểu
- `runtime-api.js` — barrel chỉ dành cho thời gian chạy
- `setup-entry.js` — điểm vào Plugin thiết lập

Plugin bên ngoài chỉ nên nhập các đường dẫn con `openclaw/plugin-sdk/*`. Không bao giờ
nhập `src/*` của gói Plugin khác từ lõi hoặc từ Plugin khác.
Các điểm vào được tải bằng facade ưu tiên ảnh chụp nhanh cấu hình thời gian chạy đang hoạt động khi có,
sau đó chuyển về tệp cấu hình đã phân giải trên đĩa.

Các đường dẫn con dành riêng cho khả năng như `image-generation`, `media-understanding`
và `speech` tồn tại vì các Plugin đi kèm hiện đang sử dụng chúng. Chúng không
tự động là các hợp đồng bên ngoài dài hạn, bất biến — hãy kiểm tra trang tham chiếu
SDK liên quan khi dựa vào chúng.

## Lược đồ công cụ tin nhắn

Plugin nên sở hữu các phần đóng góp lược đồ `describeMessageTool(...)` dành riêng cho kênh
đối với các thành phần cơ bản không phải tin nhắn như phản ứng, lượt đọc và cuộc thăm dò.
Phần trình bày gửi dùng chung nên sử dụng hợp đồng `MessagePresentation` tổng quát
thay cho các trường nút, thành phần, khối hoặc thẻ gốc của nhà cung cấp.
Xem [Trình bày tin nhắn](/vi/plugins/message-presentation) để biết hợp đồng,
các quy tắc chuyển cấp, ánh xạ nhà cung cấp và danh sách kiểm tra dành cho tác giả Plugin.

Các Plugin có khả năng gửi khai báo nội dung chúng có thể kết xuất thông qua khả năng tin nhắn:

- `presentation` cho các khối trình bày ngữ nghĩa (`text`, `context`,
  `divider`, `chart`, `table`, `buttons`, `select`)
- `delivery-pin` cho các yêu cầu phân phối được ghim

Lõi quyết định kết xuất phần trình bày theo cách gốc hay hạ cấp thành văn bản.
Không cung cấp các lối thoát UI gốc của nhà cung cấp từ công cụ tin nhắn tổng quát.
Các trình trợ giúp SDK đã lỗi thời cho lược đồ gốc cũ vẫn được xuất cho các
Plugin bên thứ ba hiện có, nhưng Plugin mới không nên sử dụng chúng.

## Phân giải đích kênh

Các Plugin kênh nên sở hữu ngữ nghĩa đích dành riêng cho kênh. Giữ máy chủ
gửi đi dùng chung ở dạng tổng quát và sử dụng bề mặt bộ điều hợp nhắn tin cho các quy tắc của nhà cung cấp:

- `messaging.inferTargetChatType({ to })` quyết định liệu một đích đã chuẩn hóa
  nên được xử lý dưới dạng `direct`, `group` hay `channel` trước khi tra cứu thư mục.
- `messaging.targetResolver.looksLikeId(raw, normalized)` cho lõi biết liệu một
  đầu vào có nên chuyển thẳng sang phân giải dạng id thay vì tìm kiếm thư mục hay không.
- `messaging.targetResolver.reservedLiterals` liệt kê các từ đơn lẻ là
  tham chiếu kênh/phiên cho nhà cung cấp đó. Quá trình phân giải giữ nguyên các mục
  thư mục đã cấu hình trước khi từ chối các giá trị dành riêng, sau đó từ chối an toàn khi
  không tìm thấy trong thư mục.
- `messaging.targetResolver.resolveTarget(...)` là phương án chuyển cấp của Plugin khi
  lõi cần một lần phân giải cuối cùng do nhà cung cấp sở hữu sau khi chuẩn hóa hoặc sau khi
  không tìm thấy trong thư mục.
- `messaging.resolveOutboundSessionRoute(...)` sở hữu việc xây dựng tuyến phiên
  dành riêng cho nhà cung cấp sau khi đích được phân giải.

Cách phân chia được khuyến nghị:

- Sử dụng `inferTargetChatType` cho các quyết định phân loại cần diễn ra trước khi
  tìm kiếm các đối tác/nhóm.
- Sử dụng `looksLikeId` cho các kiểm tra "xử lý giá trị này như một id đích rõ ràng/gốc".
- Sử dụng `resolveTarget` cho phương án chuyển cấp chuẩn hóa dành riêng cho nhà cung cấp, không dùng cho
  tìm kiếm thư mục rộng.
- Giữ các id gốc của nhà cung cấp như id cuộc trò chuyện, id luồng, JID, tên định danh và id phòng
  bên trong các giá trị `target` hoặc tham số dành riêng cho nhà cung cấp, không đặt trong các trường
  SDK tổng quát.

## Thư mục dựa trên cấu hình

Các Plugin suy ra mục thư mục từ cấu hình nên giữ logic đó trong
Plugin và tái sử dụng các trình trợ giúp dùng chung từ
`openclaw/plugin-sdk/directory-runtime`.

Sử dụng cách này khi một kênh cần các đối tác/nhóm dựa trên cấu hình, chẳng hạn như:

- các đối tượng DM ngang hàng dựa trên danh sách cho phép
- các ánh xạ kênh/nhóm đã cấu hình
- các phương án dự phòng thư mục tĩnh theo phạm vi tài khoản

Các trình trợ giúp dùng chung trong `directory-runtime` chỉ xử lý các thao tác chung:

- lọc truy vấn
- áp dụng giới hạn
- các trình trợ giúp khử trùng lặp/chuẩn hóa
- tạo `ChannelDirectoryEntry[]`

Việc kiểm tra tài khoản và chuẩn hóa id dành riêng cho từng kênh nên nằm trong
phần triển khai plugin.

## Danh mục nhà cung cấp

Các plugin nhà cung cấp có thể định nghĩa danh mục mô hình để suy luận bằng
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` trả về cùng cấu trúc mà OpenClaw ghi vào
`models.providers`:

- `{ provider }` cho một mục nhà cung cấp
- `{ providers }` cho nhiều mục nhà cung cấp

Dùng `catalog` khi plugin sở hữu id mô hình dành riêng cho nhà cung cấp, giá trị mặc định của URL cơ sở
hoặc siêu dữ liệu mô hình bị giới hạn bởi xác thực.

`catalog.order` kiểm soát thời điểm danh mục của plugin được hợp nhất so với các
nhà cung cấp ngầm định tích hợp sẵn của OpenClaw:

- `simple`: các nhà cung cấp dùng khóa API thuần túy hoặc dựa trên biến môi trường
- `profile`: các nhà cung cấp xuất hiện khi có hồ sơ xác thực
- `paired`: các nhà cung cấp tổng hợp nhiều mục nhà cung cấp liên quan
- `late`: lượt cuối cùng, sau các nhà cung cấp ngầm định khác

Nhà cung cấp xuất hiện sau sẽ thắng khi xảy ra xung đột khóa, vì vậy plugin có thể chủ ý ghi đè
một mục nhà cung cấp tích hợp sẵn có cùng id nhà cung cấp.

Plugin cũng có thể công bố các hàng mô hình chỉ đọc thông qua
`api.registerModelCatalogProvider({ provider, kinds, staticCatalog, liveCatalog
})`. Đây là hướng phát triển cho các giao diện danh sách/trợ giúp/bộ chọn và hỗ trợ
các hàng `text`, `voice`, `image_generation`, `video_generation` và `music_generation`.
Plugin nhà cung cấp vẫn sở hữu các lệnh gọi điểm cuối trực tiếp, trao đổi token và
ánh xạ phản hồi của nhà cung cấp; lõi sở hữu cấu trúc hàng chung, nhãn nguồn và
định dạng trợ giúp công cụ phương tiện. Các đăng ký nhà cung cấp tạo phương tiện tự động tổng hợp
các hàng danh mục tĩnh từ `defaultModel`, `models` và
`capabilities`.

Khả năng tương thích:

- `discovery` vẫn hoạt động như một bí danh cũ, nhưng phát cảnh báo ngừng hỗ trợ
- nếu cả `catalog` và `discovery` đều được đăng ký, OpenClaw dùng `catalog`
  và phát cảnh báo
- `augmentModelCatalog` đã lỗi thời; các nhà cung cấp đi kèm nên công bố
  các hàng bổ sung thông qua `registerModelCatalogProvider`

## Kiểm tra kênh chỉ đọc

Nếu plugin của bạn đăng ký một kênh, nên triển khai
`plugin.config.inspectAccount(cfg, accountId)` cùng với `resolveAccount(...)`.

Lý do:

- `resolveAccount(...)` là đường dẫn thời gian chạy. Nó được phép giả định thông tin xác thực
  đã được hiện thực hóa đầy đủ và có thể dừng ngay khi thiếu các bí mật bắt buộc.
- Các đường dẫn lệnh chỉ đọc như `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve` và các luồng sửa chữa doctor/cấu hình
  không cần phải hiện thực hóa thông tin xác thực thời gian chạy chỉ để
  mô tả cấu hình.

Hành vi `inspectAccount(...)` được khuyến nghị:

- Chỉ trả về trạng thái tài khoản mang tính mô tả.
- Giữ nguyên `enabled` và `configured`.
- Bao gồm các trường nguồn/trạng thái thông tin xác thực khi phù hợp, chẳng hạn:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Bạn không cần trả về giá trị token thô chỉ để báo cáo
  tính khả dụng chỉ đọc. Trả về `tokenStatus: "available"` (và trường nguồn
  tương ứng) là đủ cho các lệnh dạng trạng thái.
- Dùng `configured_unavailable` khi thông tin xác thực được cấu hình qua SecretRef nhưng
  không khả dụng trong đường dẫn lệnh hiện tại.

Điều này cho phép các lệnh chỉ đọc báo cáo "đã cấu hình nhưng không khả dụng trong đường dẫn lệnh
này" thay vì gặp sự cố hoặc báo cáo sai rằng tài khoản chưa được cấu hình.

## Gói plugin

Một thư mục plugin có thể bao gồm `package.json` với `openclaw.extensions`:

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"],
    "setupEntry": "./src/setup-entry.ts"
  }
}
```

Mỗi mục trở thành một plugin. Nếu gói liệt kê nhiều tiện ích mở rộng, id plugin
trở thành `<manifestOrPackageName>/<fileBase>` (id bản kê khai được ưu tiên khi
có; nếu không thì dùng tên `package.json` không có phạm vi).

Nếu plugin của bạn nhập các phần phụ thuộc npm, hãy cài đặt chúng trong thư mục đó để
`node_modules` khả dụng (`npm install` / `pnpm install`).

Rào chắn bảo mật: mọi mục `openclaw.extensions` phải nằm bên trong thư mục plugin
sau khi phân giải liên kết tượng trưng. Các mục thoát khỏi thư mục gói sẽ bị
từ chối.

Lưu ý bảo mật: `openclaw plugins install` cài đặt các phần phụ thuộc plugin bằng
`npm install --omit=dev --ignore-scripts` cục bộ của dự án (không có tập lệnh vòng đời,
không có phần phụ thuộc phát triển trong thời gian chạy), bỏ qua các thiết lập cài đặt npm toàn cục được kế thừa.
Giữ cây phần phụ thuộc plugin ở dạng "JS/TS thuần túy" và tránh các gói yêu cầu
bản dựng `postinstall`.

Tùy chọn: `openclaw.setupEntry` có thể trỏ đến một mô-đun nhẹ chỉ dùng cho thiết lập.
Khi OpenClaw cần các giao diện thiết lập cho một plugin kênh bị vô hiệu hóa, hoặc
khi plugin kênh đã được bật nhưng vẫn chưa được cấu hình, nó sẽ tải `setupEntry`
thay vì mục plugin đầy đủ. Điều này giúp quá trình khởi động và thiết lập nhẹ hơn
khi mục plugin chính của bạn còn kết nối các công cụ, hook hoặc mã khác
chỉ dành cho thời gian chạy.

Tùy chọn: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
có thể đưa plugin kênh vào cùng đường dẫn `setupEntry` trong giai đoạn khởi động trước khi lắng nghe của Gateway,
ngay cả khi kênh đã được cấu hình.

Chỉ dùng tùy chọn này khi `setupEntry` bao phủ đầy đủ giao diện khởi động phải tồn tại
trước khi Gateway bắt đầu lắng nghe. Trên thực tế, điều đó có nghĩa là mục thiết lập
phải đăng ký mọi khả năng do kênh sở hữu mà quá trình khởi động phụ thuộc vào, chẳng hạn:

- chính việc đăng ký kênh
- mọi tuyến HTTP phải khả dụng trước khi Gateway bắt đầu lắng nghe
- mọi phương thức, công cụ hoặc dịch vụ Gateway phải tồn tại trong cùng khoảng thời gian đó

Nếu mục đầy đủ của bạn vẫn sở hữu bất kỳ khả năng khởi động bắt buộc nào, đừng bật
cờ này. Giữ plugin theo hành vi mặc định và để OpenClaw tải
mục đầy đủ trong quá trình khởi động.

Các kênh đi kèm cũng có thể công bố các trình trợ giúp giao diện hợp đồng chỉ dành cho thiết lập mà lõi
có thể tham chiếu trước khi thời gian chạy đầy đủ của kênh được tải. Giao diện nâng cấp thiết lập
hiện tại là:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Lõi dùng giao diện đó khi cần nâng cấp cấu hình kênh một tài khoản kiểu cũ
thành `channels.<id>.accounts.*` mà không tải mục plugin đầy đủ.
Matrix là ví dụ đi kèm hiện tại: nó chỉ chuyển các khóa xác thực/khởi tạo vào một
tài khoản được nâng cấp có tên khi các tài khoản có tên đã tồn tại, đồng thời có thể giữ nguyên
khóa tài khoản mặc định không chuẩn đã cấu hình thay vì luôn tạo
`accounts.default`.

Các bộ điều hợp bản vá thiết lập đó duy trì việc khám phá giao diện hợp đồng đi kèm theo cơ chế tải lười. Thời gian
nhập vẫn nhẹ; giao diện nâng cấp chỉ được tải trong lần sử dụng đầu tiên thay vì
tái kích hoạt quá trình khởi động kênh đi kèm khi nhập mô-đun.

Khi các giao diện khởi động đó bao gồm phương thức RPC của Gateway, hãy giữ chúng dưới một
tiền tố dành riêng cho plugin. Các không gian tên quản trị lõi (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) vẫn được bảo lưu và luôn phân giải
thành `operator.admin`, ngay cả khi plugin yêu cầu phạm vi hẹp hơn.

Ví dụ:

```json
{
  "name": "@scope/my-channel",
  "openclaw": {
    "extensions": ["./index.ts"],
    "setupEntry": "./setup-entry.ts",
    "startup": {
      "deferConfiguredChannelFullLoadUntilAfterListen": true
    }
  }
}
```

### Siêu dữ liệu danh mục kênh

Các plugin kênh có thể quảng bá siêu dữ liệu thiết lập/khám phá qua `openclaw.channel` và
gợi ý cài đặt qua `openclaw.install`. Điều này giúp danh mục lõi không chứa dữ liệu.

Ví dụ:

```json
{
  "name": "@openclaw/nextcloud-talk",
  "openclaw": {
    "extensions": ["./index.ts"],
    "channel": {
      "id": "nextcloud-talk",
      "label": "Nextcloud Talk",
      "selectionLabel": "Nextcloud Talk (tự lưu trữ)",
      "docsPath": "/channels/nextcloud-talk",
      "docsLabel": "nextcloud-talk",
      "blurb": "Trò chuyện tự lưu trữ qua bot webhook Nextcloud Talk.",
      "order": 65,
      "aliases": ["nc-talk", "nc"]
    },
    "install": {
      "npmSpec": "@openclaw/nextcloud-talk",
      "localPath": "<bundled-plugin-local-path>",
      "defaultChoice": "npm"
    }
  }
}
```

Các trường `openclaw.channel` hữu ích ngoài ví dụ tối thiểu:

- `detailLabel`: nhãn phụ cho các giao diện danh mục/trạng thái phong phú hơn
- `docsLabel`: ghi đè văn bản liên kết của liên kết tài liệu
- `preferOver`: các id plugin/kênh có mức ưu tiên thấp hơn mà mục danh mục này nên được xếp trên
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: các tùy chọn kiểm soát nội dung trên giao diện lựa chọn
- `markdownCapable`: đánh dấu kênh có khả năng Markdown để đưa ra quyết định định dạng gửi đi
- `exposure.configured`: ẩn kênh khỏi các giao diện liệt kê kênh đã cấu hình khi được đặt thành `false`
- `exposure.setup`: ẩn kênh khỏi các bộ chọn thiết lập/cấu hình tương tác khi được đặt thành `false`
- `exposure.docs`: đánh dấu kênh là nội bộ/riêng tư đối với các giao diện điều hướng tài liệu
- `showConfigured` / `showInSetup`: các bí danh cũ vẫn được chấp nhận để tương thích; nên dùng `exposure`
- `quickstartAllowFrom`: đưa kênh vào luồng bắt đầu nhanh `allowFrom` tiêu chuẩn
- `forceAccountBinding`: yêu cầu liên kết tài khoản rõ ràng ngay cả khi chỉ có một tài khoản
- `preferSessionLookupForAnnounceTarget`: ưu tiên tra cứu phiên khi phân giải đích thông báo

OpenClaw cũng có thể hợp nhất **các danh mục kênh bên ngoài** (ví dụ: bản xuất sổ đăng ký
MPM). Đặt một tệp JSON tại một trong các vị trí:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Hoặc trỏ `OPENCLAW_PLUGIN_CATALOG_PATHS` (hoặc `OPENCLAW_MPM_CATALOG_PATHS`) đến
một hoặc nhiều tệp JSON (phân tách bằng dấu phẩy/dấu chấm phẩy/`PATH`). Mỗi tệp nên
chứa `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. Trình phân tích cú pháp cũng chấp nhận `"packages"` hoặc `"plugins"` làm bí danh cũ cho khóa `"entries"`.

Các mục danh mục kênh được tạo và mục danh mục cài đặt nhà cung cấp hiển thị
các dữ kiện nguồn cài đặt đã chuẩn hóa bên cạnh khối `openclaw.install` thô. Các
dữ kiện đã chuẩn hóa xác định thông số npm là phiên bản chính xác hay bộ chọn linh động,
siêu dữ liệu toàn vẹn dự kiến có hiện diện hay không và đường dẫn nguồn cục bộ
có khả dụng hay không. Khi đã biết danh tính danh mục/gói, các
dữ kiện đã chuẩn hóa sẽ cảnh báo nếu tên gói npm đã phân tích lệch khỏi danh tính đó.
Chúng cũng cảnh báo khi `defaultChoice` không hợp lệ hoặc trỏ đến một nguồn
không khả dụng, cũng như khi có siêu dữ liệu toàn vẹn npm mà không có nguồn npm
hợp lệ. Các bên sử dụng nên coi `installSource` là một trường tùy chọn bổ sung để
các mục tạo thủ công và shim danh mục không phải tổng hợp trường này.
Điều này cho phép quá trình hướng dẫn ban đầu và chẩn đoán giải thích trạng thái lớp nguồn mà không
nhập thời gian chạy plugin.

Các mục npm bên ngoài chính thức nên ưu tiên một `npmSpec` chính xác cùng với
`expectedIntegrity`. Tên gói thuần và dist-tag vẫn hoạt động để đảm bảo
khả năng tương thích, nhưng chúng hiển thị cảnh báo ở lớp nguồn để danh mục có thể chuyển
sang các bản cài đặt được ghim và kiểm tra tính toàn vẹn mà không làm hỏng các plugin hiện có.
Khi quy trình onboarding cài đặt từ một đường dẫn danh mục cục bộ, nó ghi lại một mục chỉ mục
plugin được quản lý với `source: "path"` và một
`sourcePath` tương đối với workspace khi có thể. Đường dẫn tải vận hành tuyệt đối vẫn nằm trong
`plugins.load.paths`; bản ghi cài đặt tránh sao chép các đường dẫn máy trạm cục bộ
vào cấu hình tồn tại lâu dài. Điều này giúp các bản cài đặt phát triển cục bộ vẫn hiển thị trong
chẩn đoán lớp nguồn mà không bổ sung thêm một bề mặt tiết lộ đường dẫn hệ thống tệp thô
thứ hai. Bảng SQLite `installed_plugin_index` được lưu bền vững là nguồn sự thật
về cài đặt và có thể được làm mới mà không cần tải các mô-đun runtime của plugin.
Ánh xạ `installRecords` của bảng vẫn bền vững ngay cả khi manifest của plugin bị thiếu hoặc
không hợp lệ; payload `plugins` của bảng là một chế độ xem manifest có thể tái tạo.

## Plugin công cụ ngữ cảnh

Plugin công cụ ngữ cảnh sở hữu việc điều phối ngữ cảnh phiên cho quá trình nạp,
tập hợp và Compaction. Đăng ký chúng từ plugin bằng
`api.registerContextEngine(id, factory)`, sau đó chọn công cụ đang hoạt động bằng
`plugins.slots.contextEngine`.

Sử dụng cách này khi plugin cần thay thế hoặc mở rộng pipeline ngữ cảnh mặc định
thay vì chỉ bổ sung tìm kiếm bộ nhớ hoặc hook.

```ts
import { buildMemorySystemPromptAddition } from "openclaw/plugin-sdk/core";
import { resolveSessionAgentId } from "openclaw/plugin-sdk/memory-host-core";

export default function (api) {
  api.registerContextEngine("lossless-claw", (ctx) => ({
    info: { id: "lossless-claw", name: "Lossless Claw", ownsCompaction: true },
    async ingest() {
      return { ingested: true };
    },
    async assemble({ messages, sessionKey, availableTools, citationsMode }) {
      return {
        messages,
        estimatedTokens: 0,
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
          agentId: resolveSessionAgentId({ config: ctx.config, sessionKey }),
          agentSessionKey: sessionKey,
        }),
      };
    },
    async compact() {
      return { ok: true, compacted: false };
    },
  }));
}
```

Factory `ctx` cung cấp các giá trị `config`, `agentDir` và `workspaceDir`
tùy chọn để khởi tạo tại thời điểm xây dựng.

Host hoàn tất quá trình chuẩn bị prompt bộ nhớ bất đồng bộ đã đăng ký trước khi gọi
`assemble()` của một công cụ không phải loại cũ. `buildMemorySystemPromptAddition(...)` vẫn
đồng bộ và đọc snapshot lượt chạy bất biến đó trong khi `assemble()` đang hoạt động.
Chuyển tiếp nguyên trạng ngữ cảnh công cụ và trích dẫn được cung cấp để snapshot
không thể vượt qua ranh giới lượt chạy.

`assemble()` có thể trả về `contextProjection` khi harness đang hoạt động có một
luồng backend bền vững. Bỏ qua giá trị này đối với phép chiếu theo từng lượt kiểu cũ. Trả về
`{ mode: "thread_bootstrap", epoch }` khi ngữ cảnh đã tập hợp cần được
chèn một lần vào luồng backend và tái sử dụng cho đến khi epoch thay đổi. Thay đổi
epoch sau khi ngữ cảnh ngữ nghĩa của công cụ thay đổi, chẳng hạn sau một lượt
Compaction do công cụ sở hữu. Host có thể giữ lại siêu dữ liệu lệnh gọi công cụ, hình dạng
đầu vào và kết quả công cụ đã biên tập trong phép chiếu khởi tạo luồng để các
luồng backend mới duy trì tính liên tục của công cụ mà không sao chép các
payload thô chứa thông tin bí mật.

Nếu công cụ **không** sở hữu thuật toán Compaction, hãy tiếp tục triển khai `compact()`
và ủy quyền thuật toán đó một cách tường minh:

```ts
import {
  buildMemorySystemPromptAddition,
  delegateCompactionToRuntime,
} from "openclaw/plugin-sdk/core";
import { resolveSessionAgentId } from "openclaw/plugin-sdk/memory-host-core";

export default function (api) {
  api.registerContextEngine("my-memory-engine", (ctx) => ({
    info: {
      id: "my-memory-engine",
      name: "My Memory Engine",
      ownsCompaction: false,
    },
    async ingest() {
      return { ingested: true };
    },
    async assemble({ messages, sessionKey, availableTools, citationsMode }) {
      return {
        messages,
        estimatedTokens: 0,
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
          agentId: resolveSessionAgentId({ config: ctx.config, sessionKey }),
          agentSessionKey: sessionKey,
        }),
      };
    },
    async compact(params) {
      return await delegateCompactionToRuntime(params);
    },
  }));
}
```

## Thêm một khả năng mới

Khi plugin cần hành vi không phù hợp với API hiện tại, không được bỏ qua
hệ thống plugin bằng cách truy cập nội bộ riêng tư. Hãy bổ sung khả năng còn thiếu.

Trình tự khuyến nghị:

1. **Định nghĩa hợp đồng lõi.** Quyết định hành vi dùng chung nào mà lõi nên sở hữu:
   chính sách, dự phòng, hợp nhất cấu hình, vòng đời, ngữ nghĩa hướng đến kênh và
   hình dạng trình trợ giúp runtime.
2. **Bổ sung các bề mặt đăng ký/runtime plugin có kiểu.** Mở rộng
   `OpenClawPluginApi` và/hoặc `api.runtime` bằng bề mặt khả năng có kiểu
   hữu ích nhỏ nhất.
3. **Kết nối lõi với các thành phần tiêu thụ của kênh/tính năng.** Kênh và plugin tính năng
   nên sử dụng khả năng mới thông qua lõi, không nhập trực tiếp một
   triển khai của nhà cung cấp.
4. **Đăng ký các triển khai của nhà cung cấp.** Sau đó, plugin của nhà cung cấp đăng ký
   backend của chúng với khả năng này.
5. **Bổ sung phạm vi kiểm thử hợp đồng.** Thêm các bài kiểm thử để quyền sở hữu và hình dạng đăng ký
   luôn tường minh theo thời gian.

Đây là cách OpenClaw duy trì quan điểm thiết kế rõ ràng mà không bị mã hóa cứng theo
thế giới quan của một nhà cung cấp. Xem [Cẩm nang khả năng](/vi/plugins/adding-capabilities)
để biết danh sách kiểm tra tệp cụ thể và ví dụ hoàn chỉnh.

### Danh sách kiểm tra khả năng

Khi thêm một khả năng mới, triển khai thường nên đồng thời tác động đến các
bề mặt sau:

- các kiểu hợp đồng lõi trong `src/<capability>/types.ts`
- trình chạy/trình trợ giúp runtime lõi trong `src/<capability>/runtime.ts`
- bề mặt đăng ký API plugin trong `src/plugins/types.ts`
- hệ thống kết nối registry plugin trong `src/plugins/registry.ts`
- bề mặt runtime plugin trong `src/plugins/runtime/*` khi plugin tính năng/kênh
  cần sử dụng khả năng đó
- các trình trợ giúp thu thập/kiểm thử trong `src/test-utils/plugin-registration.ts`
- các xác nhận quyền sở hữu/hợp đồng trong `src/plugins/contracts/registry.ts`
- tài liệu dành cho người vận hành/plugin trong `docs/`

Nếu thiếu một trong các bề mặt đó, đây thường là dấu hiệu cho thấy khả năng
chưa được tích hợp đầy đủ.

### Mẫu khả năng

Mẫu tối thiểu:

```ts
// core contract
export type VideoGenerationProviderPlugin = {
  id: string;
  label: string;
  generateVideo: (req: VideoGenerationRequest) => Promise<VideoGenerationResult>;
};

// plugin API
api.registerVideoGenerationProvider({
  id: "openai",
  label: "OpenAI",
  async generateVideo(req) {
    return await generateOpenAiVideo(req);
  },
});

// shared runtime helper for feature/channel plugins
const clip = await api.runtime.videoGeneration.generate({
  prompt: "Show the robot walking through the lab.",
  cfg,
});
```

Mẫu kiểm thử hợp đồng (`src/plugins/contracts/registry.ts` cung cấp các phép tra cứu
quyền sở hữu như `providerContractPluginIds`; các bài kiểm thử xác nhận danh sách
`contracts.videoGenerationProviders` của plugin khớp với những gì plugin thực sự đăng ký):

```ts
expect(pluginManifest.contracts?.videoGenerationProviders).toEqual(["openai"]);
```

Điều này giúp quy tắc luôn đơn giản:

- lõi sở hữu hợp đồng khả năng + việc điều phối
- plugin của nhà cung cấp sở hữu các triển khai của nhà cung cấp
- plugin tính năng/kênh sử dụng các trình trợ giúp runtime
- các bài kiểm thử hợp đồng giữ cho quyền sở hữu luôn tường minh

## Liên quan

- [Kiến trúc Plugin](/vi/plugins/architecture) — mô hình và hình dạng khả năng công khai
- [Đường dẫn con của SDK Plugin](/vi/plugins/sdk-subpaths)
- [Thiết lập SDK Plugin](/vi/plugins/sdk-setup)
- [Xây dựng plugin](/vi/plugins/building-plugins)
