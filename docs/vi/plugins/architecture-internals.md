---
read_when:
    - Triển khai các hook runtime của nhà cung cấp, vòng đời kênh hoặc các bộ gói
    - Gỡ lỗi thứ tự tải Plugin hoặc trạng thái sổ đăng ký
    - Thêm một khả năng Plugin mới hoặc Plugin công cụ ngữ cảnh
summary: 'Chi tiết nội bộ kiến trúc Plugin: quy trình nạp, sổ đăng ký, điểm móc nối thời gian chạy, tuyến HTTP và bảng tham chiếu'
title: Nội bộ kiến trúc Plugin
x-i18n:
    generated_at: "2026-05-03T21:34:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 898cbe2f97d666fc8bb2c2197cb786efb6d13a8842d8eb931fa3ce535bfd21fb
    source_path: plugins/architecture-internals.md
    workflow: 16
---

Để biết mô hình năng lực công khai, hình dạng Plugin và hợp đồng sở hữu/thực thi, xem [Kiến trúc Plugin](/vi/plugins/architecture). Trang này là tài liệu tham chiếu cho cơ chế nội bộ: quy trình nạp, sổ đăng ký, hook thời gian chạy, tuyến HTTP của Gateway, đường dẫn nhập và bảng lược đồ.

## Quy trình nạp

Khi khởi động, OpenClaw đại khái thực hiện như sau:

1. phát hiện các gốc Plugin ứng viên
2. đọc manifest gói native hoặc tương thích và siêu dữ liệu gói
3. từ chối các ứng viên không an toàn
4. chuẩn hóa cấu hình Plugin (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. quyết định trạng thái bật cho từng ứng viên
6. nạp các mô-đun native đã bật: các mô-đun tích hợp đã build dùng trình nạp native;
   mã nguồn TypeScript cục bộ của bên thứ ba dùng phương án dự phòng Jiti khẩn cấp
7. gọi các hook native `register(api)` và thu thập đăng ký vào sổ đăng ký Plugin
8. đưa sổ đăng ký ra các bề mặt lệnh/thời gian chạy

<Note>
`activate` là bí danh cũ của `register` — trình nạp phân giải mục nào hiện có (`def.register ?? def.activate`) và gọi nó tại cùng một thời điểm. Tất cả Plugin tích hợp dùng `register`; hãy ưu tiên `register` cho Plugin mới.
</Note>

Các cổng an toàn diễn ra **trước** khi thực thi thời gian chạy. Ứng viên bị chặn
khi điểm vào thoát khỏi gốc Plugin, đường dẫn cho phép mọi người ghi, hoặc quyền
sở hữu đường dẫn trông đáng ngờ đối với Plugin không tích hợp.

Ứng viên bị chặn vẫn được gắn với id Plugin của chúng để chẩn đoán. Nếu cấu hình
vẫn tham chiếu id đó, bước xác thực báo cáo Plugin là có mặt nhưng bị chặn
và trỏ ngược về cảnh báo an toàn đường dẫn thay vì coi mục cấu hình là lỗi thời.

### Hành vi ưu tiên manifest

Manifest là nguồn sự thật của mặt phẳng điều khiển. OpenClaw dùng nó để:

- định danh Plugin
- phát hiện kênh/Skills/lược đồ cấu hình hoặc năng lực gói đã khai báo
- xác thực `plugins.entries.<id>.config`
- bổ sung nhãn/phần giữ chỗ của Control UI
- hiển thị siêu dữ liệu cài đặt/danh mục
- giữ các bộ mô tả kích hoạt và thiết lập nhẹ mà không cần nạp thời gian chạy Plugin

Đối với Plugin native, mô-đun thời gian chạy là phần mặt phẳng dữ liệu. Nó đăng ký
hành vi thực tế như hook, công cụ, lệnh hoặc luồng nhà cung cấp.

Các khối manifest tùy chọn `activation` và `setup` vẫn nằm trên mặt phẳng điều khiển.
Chúng chỉ là bộ mô tả siêu dữ liệu cho lập kế hoạch kích hoạt và phát hiện thiết lập;
chúng không thay thế đăng ký thời gian chạy, `register(...)` hoặc `setupEntry`.
Các bên tiêu thụ kích hoạt trực tiếp đầu tiên hiện dùng gợi ý lệnh, kênh và nhà cung cấp
trong manifest để thu hẹp việc nạp Plugin trước khi vật chất hóa sổ đăng ký rộng hơn:

- việc nạp CLI thu hẹp vào các Plugin sở hữu lệnh chính được yêu cầu
- phân giải thiết lập/Plugin kênh thu hẹp vào các Plugin sở hữu
  id kênh được yêu cầu
- phân giải thiết lập/thời gian chạy nhà cung cấp tường minh thu hẹp vào các Plugin sở hữu
  id nhà cung cấp được yêu cầu
- lập kế hoạch khởi động Gateway dùng `activation.onStartup` cho các lượt nhập khởi động
  tường minh và lựa chọn không nạp khi khởi động; Plugin không có siêu dữ liệu khởi động chỉ nạp
  thông qua các tác nhân kích hoạt hẹp hơn

Các lượt nạp trước thời gian chạy tại thời điểm yêu cầu khi xin phạm vi rộng `all` vẫn suy ra
một tập id Plugin hiệu lực tường minh từ cấu hình, lập kế hoạch khởi động, các kênh
đã cấu hình, slot và quy tắc tự động bật. Nếu tập suy ra đó trống, OpenClaw
nạp một sổ đăng ký thời gian chạy trống thay vì mở rộng sang mọi Plugin có thể phát hiện.

Bộ lập kế hoạch kích hoạt cung cấp cả API chỉ id cho bên gọi hiện có và
API kế hoạch cho chẩn đoán mới. Các mục kế hoạch báo cáo lý do một Plugin được chọn,
tách riêng gợi ý lập kế hoạch `activation.*` tường minh khỏi phương án dự phòng sở hữu
theo manifest như `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` và hook. Phân tách lý do đó là ranh giới tương thích:
siêu dữ liệu Plugin hiện có vẫn hoạt động, trong khi mã mới có thể phát hiện gợi ý rộng
hoặc hành vi dự phòng mà không đổi ngữ nghĩa nạp thời gian chạy.

Phát hiện thiết lập hiện ưu tiên các id do bộ mô tả sở hữu như `setup.providers` và
`setup.cliBackends` để thu hẹp Plugin ứng viên trước khi dự phòng về
`setup-api` cho Plugin vẫn cần hook thời gian chạy lúc thiết lập. Danh sách
thiết lập nhà cung cấp dùng `providerAuthChoices` trong manifest, lựa chọn thiết lập
suy ra từ bộ mô tả và siêu dữ liệu danh mục cài đặt mà không nạp thời gian chạy nhà cung cấp. `setup.requiresRuntime: false` tường minh là điểm cắt chỉ dùng bộ mô tả; nếu bỏ qua
`requiresRuntime` thì vẫn giữ phương án dự phòng setup-api cũ để tương thích. Nếu nhiều hơn
một Plugin được phát hiện cùng nhận cùng một id nhà cung cấp thiết lập hoặc backend CLI
đã chuẩn hóa, tra cứu thiết lập sẽ từ chối chủ sở hữu mơ hồ thay vì dựa vào
thứ tự phát hiện. Khi thời gian chạy thiết lập thực thi, chẩn đoán sổ đăng ký báo cáo
độ lệch giữa `setup.providers` / `setup.cliBackends` và các nhà cung cấp hoặc backend CLI
được setup-api đăng ký mà không chặn Plugin cũ.

### Ranh giới bộ nhớ đệm Plugin

OpenClaw không lưu đệm kết quả phát hiện Plugin hoặc dữ liệu sổ đăng ký manifest trực tiếp
sau các cửa sổ theo đồng hồ. Việc cài đặt, chỉnh sửa manifest và thay đổi đường dẫn nạp
phải hiển thị ở lần đọc siêu dữ liệu tường minh hoặc lần dựng lại snapshot tiếp theo.
Bộ phân tích cú pháp tệp manifest có thể giữ một bộ nhớ đệm chữ ký tệp có giới hạn, khóa theo
đường dẫn manifest đã mở, inode, kích thước và dấu thời gian; bộ nhớ đệm đó chỉ tránh
phân tích lại các byte không đổi và không được lưu đệm câu trả lời về phát hiện, sổ đăng ký,
chủ sở hữu hoặc chính sách.

Đường nhanh siêu dữ liệu an toàn là quyền sở hữu đối tượng tường minh, không phải bộ nhớ đệm ẩn.
Các đường nóng khi khởi động Gateway nên truyền `PluginMetadataSnapshot` hiện tại,
`PluginLookUpTable` đã suy ra, hoặc một sổ đăng ký manifest tường minh qua chuỗi gọi.
Xác thực cấu hình, tự động bật khi khởi động, bootstrap Plugin và chọn nhà cung cấp
có thể dùng lại các đối tượng đó khi chúng đại diện cho cấu hình và kiểm kê Plugin hiện tại.
Tra cứu thiết lập vẫn dựng lại siêu dữ liệu manifest theo yêu cầu trừ khi đường dẫn thiết lập
cụ thể nhận được một sổ đăng ký manifest tường minh; hãy giữ việc đó làm phương án dự phòng
đường lạnh thay vì thêm bộ nhớ đệm tra cứu ẩn. Khi đầu vào thay đổi, hãy dựng lại và thay thế
snapshot thay vì đột biến nó hoặc giữ các bản sao lịch sử.
Các góc nhìn trên sổ đăng ký Plugin đang hoạt động và trình trợ giúp bootstrap kênh tích hợp
nên được tính lại từ sổ đăng ký/gốc hiện tại. Bản đồ ngắn hạn là ổn
trong một lần gọi để khử trùng lặp công việc hoặc chặn tái nhập; chúng không được trở thành
bộ nhớ đệm siêu dữ liệu của tiến trình.

Đối với việc nạp Plugin, lớp bộ nhớ đệm bền vững là nạp thời gian chạy. Nó có thể dùng lại
trạng thái trình nạp khi mã hoặc artifact đã cài đặt thực sự được nạp, chẳng hạn như:

- `PluginLoaderCacheState` và các sổ đăng ký thời gian chạy tương thích đang hoạt động
- bộ nhớ đệm jiti/mô-đun và bộ nhớ đệm trình nạp bề mặt công khai dùng để tránh nhập
  cùng một bề mặt thời gian chạy nhiều lần
- bộ nhớ đệm hệ thống tệp cho artifact Plugin đã cài đặt
- bản đồ ngắn hạn theo từng lần gọi để chuẩn hóa đường dẫn hoặc phân giải trùng lặp

Những bộ nhớ đệm đó là chi tiết triển khai mặt phẳng dữ liệu. Chúng không được trả lời
các câu hỏi mặt phẳng điều khiển như "Plugin nào sở hữu nhà cung cấp này?" trừ khi
bên gọi chủ động yêu cầu nạp thời gian chạy.

Không thêm bộ nhớ đệm bền vững hoặc theo đồng hồ cho:

- kết quả phát hiện
- sổ đăng ký manifest trực tiếp
- sổ đăng ký manifest được dựng lại từ chỉ mục Plugin đã cài đặt
- tra cứu chủ sở hữu nhà cung cấp, chặn mô hình, chính sách nhà cung cấp hoặc siêu dữ liệu
  artifact công khai
- bất kỳ câu trả lời nào khác suy ra từ manifest mà manifest, chỉ mục đã cài đặt,
  hoặc đường dẫn nạp đã thay đổi phải hiển thị ở lần đọc siêu dữ liệu tiếp theo

Các bên gọi dựng lại siêu dữ liệu manifest từ chỉ mục Plugin đã cài đặt được lưu bền vững
sẽ dựng lại sổ đăng ký đó theo yêu cầu. Chỉ mục đã cài đặt là trạng thái mặt phẳng nguồn
bền vững; nó không phải bộ nhớ đệm siêu dữ liệu ẩn trong tiến trình.

## Mô hình sổ đăng ký

Plugin đã nạp không trực tiếp đột biến các biến toàn cục lõi tùy ý. Chúng đăng ký vào một
sổ đăng ký Plugin trung tâm.

Sổ đăng ký theo dõi:

- bản ghi Plugin (định danh, nguồn, xuất xứ, trạng thái, chẩn đoán)
- công cụ
- hook cũ và hook có kiểu
- kênh
- nhà cung cấp
- bộ xử lý RPC Gateway
- tuyến HTTP
- trình đăng ký CLI
- dịch vụ nền
- lệnh do Plugin sở hữu

Sau đó các tính năng lõi đọc từ sổ đăng ký đó thay vì nói chuyện trực tiếp với mô-đun Plugin.
Điều này giữ việc nạp theo một chiều:

- mô-đun Plugin -> đăng ký vào sổ đăng ký
- thời gian chạy lõi -> tiêu thụ sổ đăng ký

Sự tách biệt đó quan trọng cho khả năng bảo trì. Nó nghĩa là hầu hết bề mặt lõi chỉ
cần một điểm tích hợp: "đọc sổ đăng ký", không phải "xử lý đặc biệt từng mô-đun Plugin".

## Callback liên kết cuộc hội thoại

Plugin liên kết một cuộc hội thoại có thể phản ứng khi một phê duyệt được giải quyết.

Dùng `api.onConversationBindingResolved(...)` để nhận callback sau khi yêu cầu liên kết
được chấp thuận hoặc từ chối:

```ts
export default {
  id: "my-plugin",
  register(api) {
    api.onConversationBindingResolved(async (event) => {
      if (event.status === "approved") {
        // A binding now exists for this plugin + conversation.
        console.log(event.binding?.conversationId);
        return;
      }

      // The request was denied; clear any local pending state.
      console.log(event.request.conversation.conversationId);
    });
  },
};
```

Các trường tải trọng callback:

- `status`: `"approved"` hoặc `"denied"`
- `decision`: `"allow-once"`, `"allow-always"` hoặc `"deny"`
- `binding`: liên kết đã phân giải cho yêu cầu được chấp thuận
- `request`: tóm tắt yêu cầu ban đầu, gợi ý tách, id người gửi và
  siêu dữ liệu cuộc hội thoại

Callback này chỉ dùng để thông báo. Nó không thay đổi ai được phép liên kết
một cuộc hội thoại, và nó chạy sau khi xử lý phê duyệt lõi hoàn tất.

## Hook thời gian chạy nhà cung cấp

Plugin nhà cung cấp có ba lớp:

- **Siêu dữ liệu manifest** cho tra cứu nhẹ trước thời gian chạy:
  `setup.providers[].envVars`, tương thích cũ đã ngừng khuyến nghị `providerAuthEnvVars`,
  `providerAuthAliases`, `providerAuthChoices` và `channelEnvVars`.
- **Hook thời điểm cấu hình**: `catalog` (`discovery` cũ) cộng với
  `applyConfigDefaults`.
- **Hook thời gian chạy**: hơn 40 hook tùy chọn bao phủ xác thực, phân giải mô hình,
  bọc luồng, mức suy nghĩ, chính sách phát lại và endpoint mức sử dụng. Xem
  danh sách đầy đủ trong [Thứ tự và cách dùng hook](#hook-order-and-usage).

OpenClaw vẫn sở hữu vòng lặp tác nhân chung, chuyển đổi dự phòng, xử lý bản ghi cuộc hội thoại và
chính sách công cụ. Các hook này là bề mặt mở rộng cho hành vi riêng của nhà cung cấp
mà không cần toàn bộ một tầng truyền suy luận tùy chỉnh.

Dùng `setup.providers[].envVars` trong manifest khi nhà cung cấp có thông tin xác thực dựa trên env
mà các đường dẫn xác thực/trạng thái/bộ chọn mô hình chung nên thấy mà không
nạp thời gian chạy Plugin. `providerAuthEnvVars` đã ngừng khuyến nghị vẫn được
bộ chuyển đổi tương thích đọc trong giai đoạn ngừng dần, và Plugin không tích hợp
dùng nó sẽ nhận chẩn đoán manifest. Dùng `providerAuthAliases` trong manifest
khi một id nhà cung cấp nên dùng lại biến env, hồ sơ xác thực, xác thực dựa trên cấu hình
và lựa chọn onboarding API-key của một id nhà cung cấp khác. Dùng
`providerAuthChoices` trong manifest khi các bề mặt CLI onboarding/lựa chọn xác thực cần biết
id lựa chọn, nhãn nhóm và nối dây xác thực một cờ đơn giản của nhà cung cấp mà không
nạp thời gian chạy nhà cung cấp. Giữ
`envVars` thời gian chạy nhà cung cấp cho các gợi ý hướng tới người vận hành như nhãn onboarding hoặc biến thiết lập
client-id/client-secret OAuth.

Dùng `channelEnvVars` trong manifest khi một kênh có xác thực hoặc thiết lập dựa trên env mà
phương án dự phòng shell-env chung, kiểm tra cấu hình/trạng thái hoặc lời nhắc thiết lập nên thấy
mà không nạp thời gian chạy kênh.

### Thứ tự và cách dùng hook

Đối với Plugin mô hình/nhà cung cấp, OpenClaw gọi hook theo thứ tự đại khái này.
Cột "Khi nào dùng" là hướng dẫn quyết định nhanh.
Các trường nhà cung cấp chỉ để tương thích mà OpenClaw không còn gọi nữa, chẳng hạn như
`ProviderPlugin.capabilities` và `suppressBuiltInModel`, được cố ý không
liệt kê ở đây.

| #   | Móc nối                           | Chức năng                                                                                                      | Khi dùng                                                                                                                                      |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | Xuất bản cấu hình nhà cung cấp vào `models.providers` trong quá trình tạo `models.json`                        | Nhà cung cấp sở hữu danh mục hoặc giá trị mặc định URL cơ sở                                                                                  |
| 2   | `applyConfigDefaults`             | Áp dụng các giá trị mặc định cấu hình toàn cục do nhà cung cấp sở hữu trong quá trình vật liệu hóa cấu hình    | Giá trị mặc định phụ thuộc vào chế độ xác thực, môi trường, hoặc ngữ nghĩa họ mô hình của nhà cung cấp                                         |
| --  | _(tra cứu mô hình tích hợp sẵn)_  | OpenClaw thử đường dẫn registry/danh mục thông thường trước                                                    | _(không phải móc nối Plugin)_                                                                                                                 |
| 3   | `normalizeModelId`                | Chuẩn hóa bí danh mã mô hình cũ hoặc xem trước trước khi tra cứu                                               | Nhà cung cấp sở hữu việc dọn dẹp bí danh trước khi phân giải mô hình chính tắc                                                               |
| 4   | `normalizeTransport`              | Chuẩn hóa `api` / `baseUrl` theo họ nhà cung cấp trước khi lắp ráp mô hình chung                               | Nhà cung cấp sở hữu việc dọn dẹp transport cho mã nhà cung cấp tùy chỉnh trong cùng họ transport                                              |
| 5   | `normalizeConfig`                 | Chuẩn hóa `models.providers.<id>` trước khi phân giải runtime/nhà cung cấp                                     | Nhà cung cấp cần dọn dẹp cấu hình nên nằm cùng Plugin; các trợ giúp họ Google được đóng gói cũng dự phòng cho các mục cấu hình Google được hỗ trợ |
| 6   | `applyNativeStreamingUsageCompat` | Áp dụng các bản ghi lại tương thích usage streaming gốc cho nhà cung cấp cấu hình                              | Nhà cung cấp cần sửa metadata usage streaming gốc do endpoint chi phối                                                                        |
| 7   | `resolveConfigApiKey`             | Phân giải xác thực bằng dấu môi trường cho nhà cung cấp cấu hình trước khi tải xác thực runtime                | Nhà cung cấp có phân giải khóa API bằng dấu môi trường do nhà cung cấp sở hữu; `amazon-bedrock` cũng có bộ phân giải dấu môi trường AWS tích hợp sẵn tại đây |
| 8   | `resolveSyntheticAuth`            | Hiển thị xác thực cục bộ/tự lưu trữ hoặc dựa trên cấu hình mà không lưu văn bản thuần                          | Nhà cung cấp có thể hoạt động với dấu thông tin xác thực tổng hợp/cục bộ                                                                      |
| 9   | `resolveExternalAuthProfiles`     | Phủ chồng hồ sơ xác thực ngoài do nhà cung cấp sở hữu; `persistence` mặc định là `runtime-only` cho thông tin xác thực do CLI/ứng dụng sở hữu | Nhà cung cấp tái sử dụng thông tin xác thực ngoài mà không lưu token làm mới đã sao chép; khai báo `contracts.externalAuthProviders` trong manifest |
| 10  | `shouldDeferSyntheticProfileAuth` | Hạ mức các placeholder hồ sơ tổng hợp đã lưu phía sau xác thực dựa trên môi trường/cấu hình                    | Nhà cung cấp lưu hồ sơ placeholder tổng hợp không nên thắng về độ ưu tiên                                                                     |
| 11  | `resolveDynamicModel`             | Đồng bộ phương án dự phòng cho mã mô hình do nhà cung cấp sở hữu chưa có trong registry cục bộ                 | Nhà cung cấp chấp nhận mã mô hình upstream tùy ý                                                                                              |
| 12  | `prepareDynamicModel`             | Khởi động bất đồng bộ, rồi `resolveDynamicModel` chạy lại                                                      | Nhà cung cấp cần metadata mạng trước khi phân giải mã chưa biết                                                                               |
| 13  | `normalizeResolvedModel`          | Ghi lại cuối cùng trước khi runner nhúng dùng mô hình đã phân giải                                             | Nhà cung cấp cần ghi lại transport nhưng vẫn dùng transport lõi                                                                               |
| 14  | `contributeResolvedModelCompat`   | Đóng góp cờ tương thích cho mô hình nhà cung cấp phía sau một transport tương thích khác                       | Nhà cung cấp nhận diện mô hình của chính mình trên transport proxy mà không tiếp quản nhà cung cấp                                            |
| 15  | `normalizeToolSchemas`            | Chuẩn hóa schema công cụ trước khi runner nhúng nhìn thấy chúng                                                | Nhà cung cấp cần dọn dẹp schema theo họ transport                                                                                             |
| 16  | `inspectToolSchemas`              | Hiển thị chẩn đoán schema do nhà cung cấp sở hữu sau khi chuẩn hóa                                             | Nhà cung cấp muốn cảnh báo từ khóa mà không dạy lõi các quy tắc riêng theo nhà cung cấp                                                       |
| 17  | `resolveReasoningOutputMode`      | Chọn hợp đồng đầu ra suy luận gốc so với dạng gắn thẻ                                                          | Nhà cung cấp cần đầu ra suy luận/kết quả cuối dạng gắn thẻ thay vì trường gốc                                                                 |
| 18  | `prepareExtraParams`              | Chuẩn hóa tham số yêu cầu trước các wrapper tùy chọn stream chung                                              | Nhà cung cấp cần tham số yêu cầu mặc định hoặc dọn dẹp tham số theo từng nhà cung cấp                                                         |
| 19  | `createStreamFn`                  | Thay thế hoàn toàn đường dẫn stream thông thường bằng transport tùy chỉnh                                      | Nhà cung cấp cần giao thức truyền dây tùy chỉnh, không chỉ một wrapper                                                                        |
| 20  | `wrapStreamFn`                    | Wrapper stream sau khi áp dụng các wrapper chung                                                               | Nhà cung cấp cần wrapper tương thích header/body/model của yêu cầu mà không cần transport tùy chỉnh                                           |
| 21  | `resolveTransportTurnState`       | Gắn header hoặc metadata transport gốc theo từng lượt                                                          | Nhà cung cấp muốn transport chung gửi danh tính lượt gốc của nhà cung cấp                                                                     |
| 22  | `resolveWebSocketSessionPolicy`   | Gắn header WebSocket gốc hoặc chính sách giảm tải phiên                                                        | Nhà cung cấp muốn transport WS chung tinh chỉnh header phiên hoặc chính sách dự phòng                                                         |
| 23  | `formatApiKey`                    | Bộ định dạng hồ sơ xác thực: hồ sơ đã lưu trở thành chuỗi `apiKey` runtime                                     | Nhà cung cấp lưu metadata xác thực bổ sung và cần hình dạng token runtime tùy chỉnh                                                           |
| 24  | `refreshOAuth`                    | Ghi đè làm mới OAuth cho endpoint làm mới tùy chỉnh hoặc chính sách lỗi làm mới                                | Nhà cung cấp không phù hợp với các bộ làm mới `pi-ai` dùng chung                                                                              |
| 25  | `buildAuthDoctorHint`             | Gợi ý sửa chữa được nối thêm khi làm mới OAuth thất bại                                                        | Nhà cung cấp cần hướng dẫn sửa xác thực do nhà cung cấp sở hữu sau lỗi làm mới                                                               |
| 26  | `matchesContextOverflowError`     | Bộ khớp tràn cửa sổ ngữ cảnh do nhà cung cấp sở hữu                                                            | Nhà cung cấp có lỗi tràn thô mà các heuristic chung sẽ bỏ sót                                                                                 |
| 27  | `classifyFailoverReason`          | Phân loại lý do chuyển dự phòng do nhà cung cấp sở hữu                                                         | Nhà cung cấp có thể ánh xạ lỗi API/transport thô thành giới hạn tốc độ/quá tải/v.v.                                                           |
| 28  | `isCacheTtlEligible`              | Chính sách bộ nhớ đệm prompt cho nhà cung cấp proxy/backhaul                                                   | Nhà cung cấp cần điều kiện TTL bộ nhớ đệm riêng cho proxy                                                                                     |
| 29  | `buildMissingAuthMessage`         | Thay thế thông báo khôi phục thiếu xác thực chung                                                              | Nhà cung cấp cần gợi ý khôi phục thiếu xác thực riêng theo nhà cung cấp                                                                       |
| 30  | `augmentModelCatalog`             | Các hàng danh mục tổng hợp/cuối cùng được nối thêm sau khi khám phá                                            | Nhà cung cấp cần các hàng tương thích tiến về trước tổng hợp trong `models list` và bộ chọn                                                   |
| 31  | `resolveThinkingProfile`          | Tập mức `/think` theo mô hình, nhãn hiển thị, và giá trị mặc định                                              | Nhà cung cấp phơi bày thang tư duy tùy chỉnh hoặc nhãn nhị phân cho các mô hình được chọn                                                     |
| 32  | `isBinaryThinking`                | Móc nối tương thích bật/tắt suy luận                                                                           | Nhà cung cấp chỉ phơi bày tư duy nhị phân bật/tắt                                                                                             |
| 33  | `supportsXHighThinking`           | Móc nối tương thích hỗ trợ suy luận `xhigh`                                                                    | Nhà cung cấp muốn `xhigh` chỉ trên một tập con mô hình                                                                                        |
| 34  | `resolveDefaultThinkingLevel`     | Móc nối tương thích mức `/think` mặc định                                                                      | Nhà cung cấp sở hữu chính sách `/think` mặc định cho một họ mô hình                                                                           |
| 35  | `isModernModelRef`                | Bộ khớp mô hình hiện đại cho bộ lọc hồ sơ trực tiếp và lựa chọn smoke                                          | Nhà cung cấp sở hữu việc khớp mô hình ưu tiên cho trực tiếp/smoke                                                                             |
| 36  | `prepareRuntimeAuth`              | Trao đổi thông tin xác thực đã cấu hình thành token/khóa runtime thực tế ngay trước suy luận                   | Nhà cung cấp cần trao đổi token hoặc thông tin xác thực yêu cầu ngắn hạn                                                                      |
| 37  | `resolveUsageAuth`                | Phân giải thông tin xác thực sử dụng/thanh toán cho `/usage` và các bề mặt trạng thái liên quan                                     | Nhà cung cấp cần phân tích token sử dụng/hạn mức tùy chỉnh hoặc một thông tin xác thực sử dụng khác                                                               |
| 38  | `fetchUsageSnapshot`              | Tìm nạp và chuẩn hóa các bản chụp nhanh sử dụng/hạn mức dành riêng cho nhà cung cấp sau khi xác thực được phân giải                             | Nhà cung cấp cần một điểm cuối sử dụng dành riêng cho nhà cung cấp hoặc bộ phân tích tải dữ liệu                                                                           |
| 39  | `createEmbeddingProvider`         | Xây dựng một bộ điều hợp nhúng do nhà cung cấp sở hữu cho bộ nhớ/tìm kiếm                                                     | Hành vi nhúng bộ nhớ thuộc về Plugin của nhà cung cấp                                                                                    |
| 40  | `buildReplayPolicy`               | Trả về chính sách phát lại kiểm soát cách xử lý bản ghi hội thoại cho nhà cung cấp                                        | Nhà cung cấp cần chính sách bản ghi hội thoại tùy chỉnh (ví dụ: loại bỏ khối suy nghĩ)                                                               |
| 41  | `sanitizeReplayHistory`           | Viết lại lịch sử phát lại sau bước dọn dẹp bản ghi hội thoại chung                                                        | Nhà cung cấp cần các thao tác viết lại phát lại dành riêng cho nhà cung cấp ngoài các trình trợ giúp Compaction dùng chung                                                             |
| 42  | `validateReplayTurns`             | Xác thực hoặc định hình lại lượt phát lại cuối cùng trước trình chạy nhúng                                           | Tầng truyền tải của nhà cung cấp cần xác thực lượt chặt chẽ hơn sau bước làm sạch chung                                                                    |
| 43  | `onModelSelected`                 | Chạy các hiệu ứng phụ sau khi chọn do nhà cung cấp sở hữu                                                                 | Nhà cung cấp cần đo lường từ xa hoặc trạng thái do nhà cung cấp sở hữu khi một mô hình trở nên hoạt động                                                                  |

`normalizeModelId`, `normalizeTransport`, và `normalizeConfig` trước tiên kiểm tra
Plugin nhà cung cấp khớp, rồi chuyển qua các Plugin nhà cung cấp khác có hỗ trợ hook
cho đến khi có một Plugin thực sự thay đổi mã định danh mô hình hoặc transport/config. Điều đó giữ cho
các shim nhà cung cấp alias/tương thích hoạt động mà không yêu cầu bên gọi biết
Plugin được đóng gói nào sở hữu việc viết lại. Nếu không có hook nhà cung cấp nào viết lại một
mục cấu hình thuộc họ Google được hỗ trợ, trình chuẩn hóa cấu hình Google được đóng gói vẫn áp dụng
bước dọn dẹp tương thích đó.

Nếu nhà cung cấp cần một giao thức truyền tải hoàn toàn tùy chỉnh hoặc trình thực thi yêu cầu tùy chỉnh,
đó là một lớp phần mở rộng khác. Các hook này dành cho hành vi nhà cung cấp
vẫn chạy trên vòng lặp suy luận thông thường của OpenClaw.

### Ví dụ nhà cung cấp

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

Các Plugin nhà cung cấp được đóng gói kết hợp các hook ở trên để phù hợp với catalog,
xác thực, suy luận, phát lại và nhu cầu sử dụng của từng nhà cung cấp. Bộ hook có thẩm quyền nằm cùng
mỗi Plugin trong `extensions/`; trang này minh họa các dạng thay vì
sao chép danh sách.

<AccordionGroup>
  <Accordion title="Nhà cung cấp catalog chuyển tiếp">
    OpenRouter, Kilocode, Z.AI, xAI đăng ký `catalog` cùng với
    `resolveDynamicModel` / `prepareDynamicModel` để có thể hiển thị các mã định danh mô hình upstream
    trước catalog tĩnh của OpenClaw.
  </Accordion>
  <Accordion title="Nhà cung cấp OAuth và endpoint usage">
    GitHub Copilot, Gemini CLI, ChatGPT Codex, MiniMax, Xiaomi, z.ai ghép
    `prepareRuntimeAuth` hoặc `formatApiKey` với `resolveUsageAuth` +
    `fetchUsageSnapshot` để sở hữu việc trao đổi token và tích hợp `/usage`.
  </Accordion>
  <Accordion title="Các họ dọn dẹp phát lại và transcript">
    Các họ được đặt tên dùng chung (`google-gemini`, `passthrough-gemini`,
    `anthropic-by-model`, `hybrid-anthropic-openai`) cho phép nhà cung cấp chọn áp dụng
    chính sách transcript thông qua `buildReplayPolicy` thay vì mỗi Plugin
    tự triển khai lại việc dọn dẹp.
  </Accordion>
  <Accordion title="Nhà cung cấp chỉ có catalog">
    `byteplus`, `cloudflare-ai-gateway`, `huggingface`, `kimi-coding`, `nvidia`,
    `qianfan`, `synthetic`, `together`, `venice`, `vercel-ai-gateway`, và
    `volcengine` chỉ đăng ký `catalog` và dùng vòng lặp suy luận dùng chung.
  </Accordion>
  <Accordion title="Trình trợ giúp luồng dành riêng cho Anthropic">
    Header beta, `/fast` / `serviceTier`, và `context1m` nằm trong seam
    `api.ts` / `contract-api.ts` công khai của Plugin Anthropic
    (`wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`) thay vì trong
    SDK chung.
  </Accordion>
</AccordionGroup>

## Trình trợ giúp runtime

Plugin có thể truy cập các trình trợ giúp core được chọn qua `api.runtime`. Đối với TTS:

```ts
const clip = await api.runtime.tts.textToSpeech({
  text: "Hello from OpenClaw",
  cfg: api.config,
});

const result = await api.runtime.tts.textToSpeechTelephony({
  text: "Hello from OpenClaw",
  cfg: api.config,
});

const voices = await api.runtime.tts.listVoices({
  provider: "elevenlabs",
  cfg: api.config,
});
```

Ghi chú:

- `textToSpeech` trả về payload đầu ra TTS core thông thường cho các bề mặt tệp/ghi chú thoại.
- Sử dụng cấu hình `messages.tts` của core và lựa chọn nhà cung cấp.
- Trả về bộ đệm âm thanh PCM + tần số lấy mẫu. Plugin phải lấy mẫu lại/mã hóa cho nhà cung cấp.
- `listVoices` là tùy chọn theo từng nhà cung cấp. Dùng nó cho bộ chọn giọng nói do nhà cung cấp sở hữu hoặc luồng thiết lập.
- Danh sách giọng nói có thể bao gồm metadata phong phú hơn như locale, giới tính và thẻ tính cách cho các bộ chọn nhận biết nhà cung cấp.
- OpenAI và ElevenLabs hiện hỗ trợ điện thoại. Microsoft thì không.

Plugin cũng có thể đăng ký nhà cung cấp giọng nói qua `api.registerSpeechProvider(...)`.

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

Ghi chú:

- Giữ chính sách TTS, fallback và phân phối phản hồi trong core.
- Dùng nhà cung cấp giọng nói cho hành vi tổng hợp do nhà cung cấp sở hữu.
- Đầu vào Microsoft `edge` kế thừa được chuẩn hóa thành mã định danh nhà cung cấp `microsoft`.
- Mô hình sở hữu được ưu tiên là theo công ty: một Plugin nhà cung cấp có thể sở hữu
  các nhà cung cấp văn bản, giọng nói, hình ảnh và phương tiện tương lai khi OpenClaw bổ sung các
  hợp đồng năng lực đó.

Đối với hiểu hình ảnh/âm thanh/video, Plugin đăng ký một
nhà cung cấp hiểu phương tiện có kiểu thay vì một túi key/value chung:

```ts
api.registerMediaUnderstandingProvider({
  id: "google",
  capabilities: ["image", "audio", "video"],
  describeImage: async (req) => ({ text: "..." }),
  transcribeAudio: async (req) => ({ text: "..." }),
  describeVideo: async (req) => ({ text: "..." }),
});
```

Ghi chú:

- Giữ orchestration, fallback, cấu hình và nối kênh trong core.
- Giữ hành vi nhà cung cấp trong Plugin nhà cung cấp.
- Mở rộng bổ sung nên tiếp tục có kiểu: phương thức tùy chọn mới, trường kết quả tùy chọn mới,
  năng lực tùy chọn mới.
- Tạo video đã theo cùng mẫu:
  - core sở hữu hợp đồng năng lực và trình trợ giúp runtime
  - Plugin nhà cung cấp đăng ký `api.registerVideoGenerationProvider(...)`
  - Plugin tính năng/kênh sử dụng `api.runtime.videoGeneration.*`

Đối với trình trợ giúp runtime hiểu phương tiện, Plugin có thể gọi:

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
```

Đối với phiên âm âm thanh, Plugin có thể dùng runtime hiểu phương tiện
hoặc alias STT cũ hơn:

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // Optional when MIME cannot be inferred reliably:
  mime: "audio/ogg",
});
```

Ghi chú:

- `api.runtime.mediaUnderstanding.*` là bề mặt dùng chung được ưu tiên cho
  hiểu hình ảnh/âm thanh/video.
- Sử dụng cấu hình âm thanh hiểu phương tiện của core (`tools.media.audio`) và thứ tự fallback nhà cung cấp.
- Trả về `{ text: undefined }` khi không tạo ra đầu ra phiên âm nào (ví dụ đầu vào bị bỏ qua/không được hỗ trợ).
- `api.runtime.stt.transcribeAudioFile(...)` vẫn là alias tương thích.

Plugin cũng có thể khởi chạy các lượt chạy subagent nền thông qua `api.runtime.subagent`:

```ts
const result = await api.runtime.subagent.run({
  sessionKey: "agent:main:subagent:search-helper",
  message: "Expand this query into focused follow-up searches.",
  provider: "openai",
  model: "gpt-4.1-mini",
  deliver: false,
});
```

Ghi chú:

- `provider` và `model` là các override tùy chọn theo từng lượt chạy, không phải thay đổi phiên bền vững.
- OpenClaw chỉ tôn trọng các trường override đó cho bên gọi đáng tin cậy.
- Đối với lượt chạy fallback do Plugin sở hữu, người vận hành phải bật bằng `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Dùng `plugins.entries.<id>.subagent.allowedModels` để giới hạn các Plugin đáng tin cậy ở các mục tiêu `provider/model` chuẩn hóa cụ thể, hoặc `"*"` để cho phép rõ ràng bất kỳ mục tiêu nào.
- Lượt chạy subagent của Plugin không đáng tin cậy vẫn hoạt động, nhưng yêu cầu override bị từ chối thay vì âm thầm fallback.
- Các phiên subagent do Plugin tạo được gắn thẻ bằng mã định danh Plugin tạo ra chúng. Fallback `api.runtime.subagent.deleteSession(...)` chỉ có thể xóa các phiên được sở hữu đó; việc xóa phiên tùy ý vẫn cần một yêu cầu Gateway có phạm vi admin.

Đối với tìm kiếm web, Plugin có thể dùng trình trợ giúp runtime dùng chung thay vì
đi vào phần nối dây công cụ agent:

```ts
const providers = api.runtime.webSearch.listProviders({
  config: api.config,
});

const result = await api.runtime.webSearch.search({
  config: api.config,
  args: {
    query: "OpenClaw plugin runtime helpers",
    count: 5,
  },
});
```

Plugin cũng có thể đăng ký nhà cung cấp tìm kiếm web qua
`api.registerWebSearchProvider(...)`.

Ghi chú:

- Giữ lựa chọn nhà cung cấp, phân giải thông tin xác thực và ngữ nghĩa yêu cầu dùng chung trong core.
- Dùng nhà cung cấp tìm kiếm web cho transport tìm kiếm dành riêng cho nhà cung cấp.
- `api.runtime.webSearch.*` là bề mặt dùng chung được ưu tiên cho Plugin tính năng/kênh cần hành vi tìm kiếm mà không phụ thuộc vào wrapper công cụ agent.

### `api.runtime.imageGeneration`

```ts
const result = await api.runtime.imageGeneration.generate({
  config: api.config,
  args: { prompt: "A friendly lobster mascot", size: "1024x1024" },
});

const providers = api.runtime.imageGeneration.listProviders({
  config: api.config,
});
```

- `generate(...)`: tạo hình ảnh bằng chuỗi nhà cung cấp tạo hình ảnh đã cấu hình.
- `listProviders(...)`: liệt kê các nhà cung cấp tạo hình ảnh có sẵn và năng lực của họ.

## Tuyến HTTP Gateway

Plugin có thể phơi bày endpoint HTTP bằng `api.registerHttpRoute(...)`.

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

Trường tuyến:

- `path`: đường dẫn tuyến dưới máy chủ HTTP gateway.
- `auth`: bắt buộc. Dùng `"gateway"` để yêu cầu xác thực gateway thông thường, hoặc `"plugin"` cho xác thực/xác minh webhook do Plugin quản lý.
- `match`: tùy chọn. `"exact"` (mặc định) hoặc `"prefix"`.
- `replaceExisting`: tùy chọn. Cho phép cùng một Plugin thay thế đăng ký tuyến hiện có của chính nó.
- `handler`: trả về `true` khi tuyến đã xử lý yêu cầu.

Ghi chú:

- `api.registerHttpHandler(...)` đã bị gỡ bỏ và sẽ gây lỗi tải plugin. Thay vào đó hãy dùng `api.registerHttpRoute(...)`.
- Các route Plugin phải khai báo `auth` rõ ràng.
- Các xung đột chính xác `path + match` bị từ chối trừ khi có `replaceExisting: true`, và một Plugin không thể thay thế route của Plugin khác.
- Các route chồng lấn với các mức `auth` khác nhau bị từ chối. Chỉ giữ các chuỗi chuyển tiếp `exact`/`prefix` trên cùng một mức auth.
- Các route `auth: "plugin"` **không** tự động nhận phạm vi runtime của operator. Chúng dành cho Webhook/xác minh chữ ký do Plugin quản lý, không phải các lệnh gọi trợ giúp Gateway đặc quyền.
- Các route `auth: "gateway"` chạy bên trong phạm vi runtime của yêu cầu Gateway, nhưng phạm vi đó được cố ý giữ bảo thủ:
  - xác thực bearer bằng shared-secret (`gateway.auth.mode = "token"` / `"password"`) giữ phạm vi runtime route Plugin cố định ở `operator.write`, ngay cả khi bên gọi gửi `x-openclaw-scopes`
  - các chế độ HTTP mang danh tính đáng tin cậy (ví dụ `trusted-proxy` hoặc `gateway.auth.mode = "none"` trên ingress riêng tư) chỉ tôn trọng `x-openclaw-scopes` khi header được cung cấp rõ ràng
  - nếu thiếu `x-openclaw-scopes` trên các yêu cầu route Plugin mang danh tính đó, phạm vi runtime sẽ quay về `operator.write`
- Quy tắc thực tế: đừng giả định một route Plugin xác thực bằng Gateway là một bề mặt quản trị ngầm định. Nếu route của bạn cần hành vi chỉ dành cho admin, hãy yêu cầu chế độ auth mang danh tính và ghi tài liệu về hợp đồng header `x-openclaw-scopes` rõ ràng.

## Đường dẫn import Plugin SDK

Dùng các đường dẫn con SDK hẹp thay vì barrel gốc nguyên khối `openclaw/plugin-sdk` khi viết Plugin mới. Các đường dẫn con cốt lõi:

| Đường dẫn con                     | Mục đích                                           |
| --------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry` | Primitive đăng ký Plugin                          |
| `openclaw/plugin-sdk/channel-core` | Trợ giúp entry/build cho kênh                     |
| `openclaw/plugin-sdk/core`        | Trợ giúp dùng chung tổng quát và hợp đồng bao quát |
| `openclaw/plugin-sdk/config-schema` | Schema Zod gốc `openclaw.json` (`OpenClawSchema`) |

Các Plugin kênh chọn từ một nhóm seam hẹp — `channel-setup`,
`setup-runtime`, `setup-adapter-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-lifecycle`,
`channel-reply-pipeline`, `command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets`, và `channel-actions`. Hành vi phê duyệt nên hợp nhất
trên một hợp đồng `approvalCapability` thay vì trộn lẫn giữa các trường
Plugin không liên quan. Xem [Plugin kênh](/vi/plugins/sdk-channel-plugins).

Các trợ giúp runtime và config nằm dưới các đường dẫn con `*-runtime` tập trung
tương ứng (`approval-runtime`, `agent-runtime`, `lazy-runtime`, `directory-runtime`,
`text-runtime`, `runtime-store`, `system-event-runtime`, `heartbeat-runtime`,
`channel-activity-runtime`, v.v.). Ưu tiên `config-types`,
`plugin-config-runtime`, `runtime-config-snapshot`, và `config-mutation`
thay vì barrel tương thích rộng `config-runtime`.

<Info>
`openclaw/plugin-sdk/channel-runtime`, `openclaw/plugin-sdk/config-runtime`,
và `openclaw/plugin-sdk/infra-runtime` là các shim tương thích đã lỗi thời cho
các Plugin cũ hơn. Mã mới nên import các primitive tổng quát hẹp hơn.
</Info>

Entry point nội bộ repo (theo root package của từng Plugin bundled):

- `index.js` — entry Plugin bundled
- `api.js` — barrel trợ giúp/kiểu
- `runtime-api.js` — barrel chỉ dành cho runtime
- `setup-entry.js` — entry Plugin thiết lập

Plugin bên ngoài chỉ nên import các đường dẫn con `openclaw/plugin-sdk/*`. Không bao giờ
import `src/*` của package Plugin khác từ core hoặc từ Plugin khác.
Các entry point được tải qua facade ưu tiên snapshot config runtime đang hoạt động khi có,
sau đó quay về tệp config đã resolve trên đĩa.

Các đường dẫn con theo capability như `image-generation`, `media-understanding`,
và `speech` tồn tại vì các Plugin bundled đang dùng chúng hiện nay. Chúng không
tự động là hợp đồng bên ngoài được đóng băng dài hạn — hãy kiểm tra trang tham chiếu SDK
liên quan khi dựa vào chúng.

## Schema công cụ tin nhắn

Plugin nên sở hữu các đóng góp schema `describeMessageTool(...)` theo từng kênh
cho các primitive không phải tin nhắn như reaction, trạng thái đã đọc, và poll.
Phần trình bày gửi dùng chung nên sử dụng hợp đồng `MessagePresentation` tổng quát
thay vì các trường button, component, block, hoặc card native của provider.
Xem [Trình bày tin nhắn](/vi/plugins/message-presentation) để biết hợp đồng,
quy tắc fallback, ánh xạ provider, và checklist cho tác giả Plugin.

Các Plugin có khả năng gửi khai báo những gì chúng có thể render thông qua capability tin nhắn:

- `presentation` cho các block trình bày ngữ nghĩa (`text`, `context`, `divider`, `buttons`, `select`)
- `delivery-pin` cho các yêu cầu ghim khi gửi

Core quyết định render phần trình bày theo cách native hay hạ cấp thành văn bản.
Không phơi bày các lối thoát UI native của provider từ công cụ tin nhắn tổng quát.
Các trợ giúp SDK đã lỗi thời cho schema native legacy vẫn được export cho các
Plugin bên thứ ba hiện có, nhưng Plugin mới không nên dùng chúng.

## Resolve mục tiêu kênh

Plugin kênh nên sở hữu ngữ nghĩa mục tiêu theo từng kênh. Giữ host outbound dùng chung
ở mức tổng quát và dùng bề mặt adapter nhắn tin cho các quy tắc provider:

- `messaging.inferTargetChatType({ to })` quyết định một mục tiêu đã chuẩn hóa
  nên được xem là `direct`, `group`, hay `channel` trước khi tra cứu directory.
- `messaging.targetResolver.looksLikeId(raw, normalized)` cho core biết liệu một
  input có nên đi thẳng đến resolve dạng id thay vì tìm kiếm directory hay không.
- `messaging.targetResolver.resolveTarget(...)` là fallback của Plugin khi
  core cần một bước resolve cuối cùng do provider sở hữu sau chuẩn hóa hoặc sau khi
  không tìm thấy trong directory.
- `messaging.resolveOutboundSessionRoute(...)` sở hữu việc dựng route phiên
  theo provider sau khi một mục tiêu đã được resolve.

Cách tách khuyến nghị:

- Dùng `inferTargetChatType` cho các quyết định phân loại cần xảy ra trước khi
  tìm kiếm peer/group.
- Dùng `looksLikeId` cho các kiểm tra "xem đây là id mục tiêu rõ ràng/native".
- Dùng `resolveTarget` cho fallback chuẩn hóa theo provider, không dùng cho
  tìm kiếm directory rộng.
- Giữ các id native của provider như chat id, thread id, JID, handle, và room
  id bên trong các giá trị `target` hoặc params theo provider, không đặt trong
  các trường SDK tổng quát.

## Directory dựa trên config

Các Plugin suy ra entry directory từ config nên giữ logic đó trong
Plugin và tái sử dụng các trợ giúp dùng chung từ
`openclaw/plugin-sdk/directory-runtime`.

Dùng phần này khi một kênh cần peer/group dựa trên config như:

- peer DM điều khiển bằng allowlist
- bản đồ kênh/group đã cấu hình
- fallback directory tĩnh theo phạm vi tài khoản

Các trợ giúp dùng chung trong `directory-runtime` chỉ xử lý các thao tác tổng quát:

- lọc truy vấn
- áp dụng giới hạn
- trợ giúp khử trùng lặp/chuẩn hóa
- dựng `ChannelDirectoryEntry[]`

Việc kiểm tra tài khoản và chuẩn hóa id theo kênh nên nằm trong phần triển khai
Plugin.

## Catalog provider

Plugin provider có thể định nghĩa catalog model cho inference bằng
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` trả về cùng hình dạng mà OpenClaw ghi vào
`models.providers`:

- `{ provider }` cho một entry provider
- `{ providers }` cho nhiều entry provider

Dùng `catalog` khi Plugin sở hữu id model theo provider, giá trị mặc định base URL,
hoặc metadata model bị chặn bởi auth.

`catalog.order` kiểm soát thời điểm catalog của Plugin được merge tương đối với
các provider ngầm định tích hợp sẵn của OpenClaw:

- `simple`: provider đơn giản dựa trên API-key hoặc env
- `profile`: provider xuất hiện khi auth profile tồn tại
- `paired`: provider tổng hợp nhiều entry provider liên quan
- `late`: lượt cuối, sau các provider ngầm định khác

Provider về sau thắng khi trùng key, nên Plugin có thể chủ ý ghi đè một
entry provider tích hợp sẵn với cùng provider id.

Tương thích:

- `discovery` vẫn hoạt động như alias legacy
- nếu cả `catalog` và `discovery` đều được đăng ký, OpenClaw dùng `catalog`

## Kiểm tra kênh chỉ đọc

Nếu Plugin của bạn đăng ký một kênh, hãy ưu tiên triển khai
`plugin.config.inspectAccount(cfg, accountId)` cùng với `resolveAccount(...)`.

Lý do:

- `resolveAccount(...)` là đường dẫn runtime. Nó được phép giả định credentials
  đã được materialize đầy đủ và có thể fail fast khi thiếu secret bắt buộc.
- Các đường dẫn lệnh chỉ đọc như `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve`, và các luồng doctor/config
  repair không nên cần materialize credentials runtime chỉ để
  mô tả cấu hình.

Hành vi `inspectAccount(...)` được khuyến nghị:

- Chỉ trả về trạng thái tài khoản mang tính mô tả.
- Giữ nguyên `enabled` và `configured`.
- Bao gồm các trường nguồn/trạng thái credential khi liên quan, chẳng hạn:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Bạn không cần trả về giá trị token thô chỉ để báo cáo tính khả dụng
  chỉ đọc. Trả về `tokenStatus: "available"` (và trường nguồn tương ứng)
  là đủ cho các lệnh kiểu status.
- Dùng `configured_unavailable` khi một credential được cấu hình qua SecretRef nhưng
  không khả dụng trong đường dẫn lệnh hiện tại.

Điều này cho phép các lệnh chỉ đọc báo cáo "đã cấu hình nhưng không khả dụng trong đường dẫn lệnh này"
thay vì crash hoặc báo sai rằng tài khoản chưa được cấu hình.

## Gói package

Một directory Plugin có thể bao gồm `package.json` với `openclaw.extensions`:

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"],
    "setupEntry": "./src/setup-entry.ts"
  }
}
```

Mỗi entry trở thành một Plugin. Nếu pack liệt kê nhiều extension, plugin id
trở thành `name/<fileBase>`.

Nếu Plugin của bạn import dependency npm, hãy cài chúng trong directory đó để
`node_modules` khả dụng (`npm install` / `pnpm install`).

Rào chắn bảo mật: mọi entry `openclaw.extensions` phải nằm trong directory Plugin
sau khi resolve symlink. Các entry thoát khỏi directory package sẽ bị từ chối.

Ghi chú bảo mật: `openclaw plugins install` cài dependency của Plugin bằng
`npm install --omit=dev --ignore-scripts` cục bộ theo project (không có lifecycle script,
không có dev dependency ở runtime), bỏ qua thiết lập npm install toàn cục được kế thừa.
Giữ cây dependency Plugin ở dạng "JS/TS thuần" và tránh các package yêu cầu
build `postinstall`.

Tùy chọn: `openclaw.setupEntry` có thể trỏ đến một module nhẹ chỉ dành cho thiết lập.
Khi OpenClaw cần các bề mặt thiết lập cho một Plugin kênh bị tắt, hoặc
khi một Plugin kênh đã bật nhưng vẫn chưa được cấu hình, nó tải `setupEntry`
thay vì entry Plugin đầy đủ. Điều này giúp startup và thiết lập nhẹ hơn
khi entry Plugin chính của bạn cũng nối tools, hooks, hoặc mã chỉ dành cho runtime khác.

Tùy chọn: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
có thể cho một Plugin kênh dùng cùng đường dẫn `setupEntry` trong giai đoạn startup
trước khi lắng nghe của Gateway, ngay cả khi kênh đã được cấu hình.

Chỉ dùng phần này khi `setupEntry` bao phủ đầy đủ bề mặt startup bắt buộc phải tồn tại
trước khi Gateway bắt đầu lắng nghe. Trên thực tế, điều đó nghĩa là entry thiết lập
phải đăng ký mọi capability do kênh sở hữu mà startup phụ thuộc vào, chẳng hạn:

- chính việc đăng ký kênh
- bất kỳ route HTTP nào phải khả dụng trước khi Gateway bắt đầu lắng nghe
- bất kỳ phương thức, tool, hoặc service Gateway nào phải tồn tại trong cùng khoảng thời gian đó

Nếu entry đầy đủ của bạn vẫn sở hữu bất kỳ capability startup bắt buộc nào, đừng bật
flag này. Giữ Plugin theo hành vi mặc định và để OpenClaw tải
entry đầy đủ trong startup.

Các kênh bundled cũng có thể publish các trợ giúp bề mặt hợp đồng chỉ dành cho thiết lập mà core
có thể tham khảo trước khi runtime kênh đầy đủ được tải. Bề mặt nâng cấp thiết lập hiện tại là:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Lõi dùng bề mặt đó khi cần nâng cấp cấu hình kênh một tài khoản kiểu cũ thành `channels.<id>.accounts.*` mà không tải đầy đủ mục nhập plugin. Matrix là ví dụ được đóng gói hiện tại: nó chỉ di chuyển các khóa xác thực/khởi động vào một tài khoản được nâng cấp có tên khi các tài khoản có tên đã tồn tại, và có thể giữ lại một khóa tài khoản mặc định không chuẩn đã cấu hình thay vì luôn tạo `accounts.default`.

Các bộ chuyển đổi bản vá thiết lập đó giữ cho việc khám phá bề mặt hợp đồng được đóng gói ở trạng thái tải lười. Thời gian import vẫn nhẹ; bề mặt nâng cấp chỉ được tải trong lần sử dụng đầu tiên thay vì khởi động lại kênh được đóng gói khi import mô-đun.

Khi các bề mặt khởi động đó bao gồm các phương thức RPC của Gateway, hãy giữ chúng trên một tiền tố dành riêng cho plugin. Các không gian tên quản trị lõi (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) vẫn được dành riêng và luôn phân giải thành `operator.admin`, ngay cả khi một plugin yêu cầu phạm vi hẹp hơn.

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

Plugin kênh có thể quảng bá siêu dữ liệu thiết lập/khám phá qua `openclaw.channel` và gợi ý cài đặt qua `openclaw.install`. Điều này giữ cho danh mục lõi không chứa dữ liệu.

Ví dụ:

```json
{
  "name": "@openclaw/nextcloud-talk",
  "openclaw": {
    "extensions": ["./index.ts"],
    "channel": {
      "id": "nextcloud-talk",
      "label": "Nextcloud Talk",
      "selectionLabel": "Nextcloud Talk (self-hosted)",
      "docsPath": "/channels/nextcloud-talk",
      "docsLabel": "nextcloud-talk",
      "blurb": "Self-hosted chat via Nextcloud Talk webhook bots.",
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

- `detailLabel`: nhãn phụ cho các bề mặt danh mục/trạng thái giàu thông tin hơn
- `docsLabel`: ghi đè văn bản liên kết cho liên kết tài liệu
- `preferOver`: các id plugin/kênh có mức ưu tiên thấp hơn mà mục danh mục này nên xếp trên
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: các điều khiển nội dung cho bề mặt lựa chọn
- `markdownCapable`: đánh dấu kênh là có khả năng markdown cho các quyết định định dạng gửi đi
- `exposure.configured`: ẩn kênh khỏi các bề mặt liệt kê kênh đã cấu hình khi được đặt thành `false`
- `exposure.setup`: ẩn kênh khỏi các bộ chọn thiết lập/cấu hình tương tác khi được đặt thành `false`
- `exposure.docs`: đánh dấu kênh là nội bộ/riêng tư cho các bề mặt điều hướng tài liệu
- `showConfigured` / `showInSetup`: các bí danh cũ vẫn được chấp nhận để tương thích; ưu tiên `exposure`
- `quickstartAllowFrom`: đưa kênh vào luồng `allowFrom` khởi động nhanh tiêu chuẩn
- `forceAccountBinding`: yêu cầu liên kết tài khoản tường minh ngay cả khi chỉ tồn tại một tài khoản
- `preferSessionLookupForAnnounceTarget`: ưu tiên tra cứu phiên khi phân giải mục tiêu thông báo

OpenClaw cũng có thể hợp nhất **các danh mục kênh bên ngoài** (ví dụ: một bản xuất registry MPM). Đặt một tệp JSON tại một trong các vị trí:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Hoặc trỏ `OPENCLAW_PLUGIN_CATALOG_PATHS` (hoặc `OPENCLAW_MPM_CATALOG_PATHS`) tới một hoặc nhiều tệp JSON (phân tách bằng dấu phẩy/dấu chấm phẩy/`PATH`). Mỗi tệp nên chứa `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. Bộ phân tích cũng chấp nhận `"packages"` hoặc `"plugins"` làm bí danh cũ cho khóa `"entries"`.

Các mục danh mục kênh được tạo và mục danh mục cài đặt nhà cung cấp hiển thị các dữ kiện nguồn cài đặt đã chuẩn hóa bên cạnh khối `openclaw.install` thô. Các dữ kiện đã chuẩn hóa xác định spec npm là phiên bản chính xác hay bộ chọn nổi, siêu dữ liệu toàn vẹn dự kiến có hiện diện hay không, và đường dẫn nguồn cục bộ có sẵn hay không. Khi danh tính danh mục/gói đã biết, các dữ kiện đã chuẩn hóa cảnh báo nếu tên gói npm đã phân tích lệch khỏi danh tính đó. Chúng cũng cảnh báo khi `defaultChoice` không hợp lệ hoặc trỏ tới một nguồn không có sẵn, và khi siêu dữ liệu toàn vẹn npm hiện diện mà không có nguồn npm hợp lệ. Người tiêu thụ nên xem `installSource` là một trường tùy chọn bổ sung để các mục được tạo thủ công và shim danh mục không phải tổng hợp nó. Điều này cho phép quá trình onboarding và chẩn đoán giải thích trạng thái mặt phẳng nguồn mà không import runtime plugin.

Các mục npm bên ngoài chính thức nên ưu tiên một `npmSpec` chính xác kèm `expectedIntegrity`. Tên gói trần và dist-tag vẫn hoạt động để tương thích, nhưng chúng hiển thị cảnh báo mặt phẳng nguồn để danh mục có thể tiến tới các cài đặt được ghim và kiểm tra toàn vẹn mà không phá vỡ các plugin hiện có. Khi onboarding cài đặt từ đường dẫn danh mục cục bộ, nó ghi lại một mục chỉ mục plugin được quản lý với `source: "path"` và `sourcePath` tương đối với workspace khi có thể. Đường dẫn tải vận hành tuyệt đối vẫn nằm trong `plugins.load.paths`; bản ghi cài đặt tránh sao chép các đường dẫn workstation cục bộ vào cấu hình tồn tại lâu dài. Điều này giữ cho các cài đặt phát triển cục bộ hiển thị với chẩn đoán mặt phẳng nguồn mà không thêm một bề mặt tiết lộ đường dẫn hệ thống tệp thô thứ hai. Chỉ mục plugin được lưu bền vững `plugins/installs.json` là nguồn sự thật của cài đặt và có thể được làm mới mà không tải các mô-đun runtime plugin. Bản đồ `installRecords` của nó bền vững ngay cả khi manifest plugin bị thiếu hoặc không hợp lệ; mảng `plugins` của nó là một chế độ xem manifest có thể xây dựng lại.

## Plugin công cụ ngữ cảnh

Plugin công cụ ngữ cảnh sở hữu việc điều phối ngữ cảnh phiên cho nhập dữ liệu, lắp ráp và Compaction. Đăng ký chúng từ plugin của bạn bằng `api.registerContextEngine(id, factory)`, rồi chọn công cụ đang hoạt động bằng `plugins.slots.contextEngine`.

Dùng điều này khi plugin của bạn cần thay thế hoặc mở rộng pipeline ngữ cảnh mặc định thay vì chỉ thêm tìm kiếm bộ nhớ hoặc hook.

```ts
import { buildMemorySystemPromptAddition } from "openclaw/plugin-sdk/core";

export default function (api) {
  api.registerContextEngine("lossless-claw", (ctx) => ({
    info: { id: "lossless-claw", name: "Lossless Claw", ownsCompaction: true },
    async ingest() {
      return { ingested: true };
    },
    async assemble({ messages, availableTools, citationsMode }) {
      return {
        messages,
        estimatedTokens: 0,
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
        }),
      };
    },
    async compact() {
      return { ok: true, compacted: false };
    },
  }));
}
```

Factory `ctx` hiển thị các giá trị tùy chọn `config`, `agentDir` và `workspaceDir` để khởi tạo tại thời điểm xây dựng.

Nếu công cụ của bạn **không** sở hữu thuật toán Compaction, hãy giữ `compact()` được triển khai và ủy quyền nó một cách tường minh:

```ts
import {
  buildMemorySystemPromptAddition,
  delegateCompactionToRuntime,
} from "openclaw/plugin-sdk/core";

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
    async assemble({ messages, availableTools, citationsMode }) {
      return {
        messages,
        estimatedTokens: 0,
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
        }),
      };
    },
    async compact(params) {
      return await delegateCompactionToRuntime(params);
    },
  }));
}
```

## Thêm một capability mới

Khi một plugin cần hành vi không phù hợp với API hiện tại, đừng đi vòng qua hệ thống plugin bằng cách truy cập riêng tư vào bên trong. Hãy thêm capability còn thiếu.

Trình tự khuyến nghị:

1. định nghĩa hợp đồng lõi
   Quyết định hành vi dùng chung nào lõi nên sở hữu: chính sách, dự phòng, hợp nhất cấu hình, vòng đời, ngữ nghĩa hướng tới kênh và hình dạng helper runtime.
2. thêm các bề mặt đăng ký/runtime plugin có kiểu
   Mở rộng `OpenClawPluginApi` và/hoặc `api.runtime` với bề mặt capability có kiểu nhỏ nhất nhưng hữu ích.
3. nối lõi + các bên tiêu thụ kênh/tính năng
   Các plugin kênh và tính năng nên tiêu thụ capability mới thông qua lõi, không phải bằng cách import trực tiếp một triển khai vendor.
4. đăng ký các triển khai vendor
   Sau đó các plugin vendor đăng ký backend của chúng với capability.
5. thêm phạm vi kiểm thử hợp đồng
   Thêm kiểm thử để quyền sở hữu và hình dạng đăng ký luôn tường minh theo thời gian.

Đây là cách OpenClaw giữ lập trường rõ ràng mà không bị hardcode theo thế giới quan của một nhà cung cấp. Xem [Sổ tay capability](/vi/plugins/architecture) để có danh sách kiểm tra tệp cụ thể và ví dụ hoàn chỉnh.

### Danh sách kiểm tra capability

Khi bạn thêm một capability mới, việc triển khai thường nên chạm các bề mặt này cùng lúc:

- các kiểu hợp đồng lõi trong `src/<capability>/types.ts`
- helper runner/runtime lõi trong `src/<capability>/runtime.ts`
- bề mặt đăng ký API plugin trong `src/plugins/types.ts`
- nối registry plugin trong `src/plugins/registry.ts`
- phơi bày runtime plugin trong `src/plugins/runtime/*` khi các plugin tính năng/kênh cần tiêu thụ nó
- helper capture/kiểm thử trong `src/test-utils/plugin-registration.ts`
- khẳng định quyền sở hữu/hợp đồng trong `src/plugins/contracts/registry.ts`
- tài liệu operator/plugin trong `docs/`

Nếu một trong các bề mặt đó bị thiếu, đó thường là dấu hiệu capability chưa được tích hợp đầy đủ.

### Mẫu capability

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

Mẫu kiểm thử hợp đồng:

```ts
expect(findVideoGenerationProviderIdsForPlugin("openai")).toEqual(["openai"]);
```

Điều đó giữ cho quy tắc đơn giản:

- lõi sở hữu hợp đồng capability + điều phối
- plugin vendor sở hữu các triển khai vendor
- plugin tính năng/kênh tiêu thụ helper runtime
- kiểm thử hợp đồng giữ cho quyền sở hữu tường minh

## Liên quan

- [Kiến trúc Plugin](/vi/plugins/architecture) — mô hình và hình dạng capability công khai
- [Đường dẫn con SDK Plugin](/vi/plugins/sdk-subpaths)
- [Thiết lập SDK Plugin](/vi/plugins/sdk-setup)
- [Xây dựng plugin](/vi/plugins/building-plugins)
