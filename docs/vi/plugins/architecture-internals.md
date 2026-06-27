---
read_when:
    - Triển khai các hook thời gian chạy của nhà cung cấp, vòng đời kênh hoặc các bộ gói
    - Gỡ lỗi thứ tự tải Plugin hoặc trạng thái registry
    - Thêm một năng lực plugin mới hoặc plugin công cụ ngữ cảnh
summary: 'Nội bộ kiến trúc Plugin: quy trình tải, registry, hook runtime, tuyến HTTP và bảng tham chiếu'
title: Nội bộ kiến trúc Plugin
x-i18n:
    generated_at: "2026-06-27T17:43:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 29abbd75d696a26cf33702a78abfcc987aaf5358eca2dc1ebe43f039f4ff6edf
    source_path: plugins/architecture-internals.md
    workflow: 16
---

Để xem mô hình năng lực công khai, dạng Plugin, và hợp đồng sở hữu/thực thi,
hãy xem [Kiến trúc Plugin](/vi/plugins/architecture). Trang này là tài liệu
tham chiếu cho cơ chế nội bộ: quy trình tải, registry, hook môi trường chạy,
tuyến HTTP Gateway, đường dẫn import, và bảng schema.

## Quy trình tải

Khi khởi động, OpenClaw đại khái thực hiện như sau:

1. phát hiện các root Plugin ứng viên
2. đọc bản kê khai gói native hoặc tương thích và siêu dữ liệu package
3. từ chối các ứng viên không an toàn
4. chuẩn hóa cấu hình Plugin (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. quyết định bật hay không cho từng ứng viên
6. tải các mô-đun native đã bật: mô-đun bundled đã build dùng bộ tải native;
   mã nguồn TypeScript cục bộ của bên thứ ba dùng fallback Jiti khẩn cấp
7. gọi các hook native `register(api)` và thu thập đăng ký vào registry Plugin
8. hiển thị registry cho các bề mặt lệnh/môi trường chạy

<Note>
`activate` là bí danh cũ của `register` — bộ tải phân giải mục nào hiện diện (`def.register ?? def.activate`) và gọi nó tại cùng một điểm. Tất cả Plugin bundled dùng `register`; hãy ưu tiên `register` cho Plugin mới.
</Note>

Các cổng an toàn diễn ra **trước** khi thực thi môi trường chạy. Ứng viên bị chặn
khi entry thoát khỏi root Plugin, đường dẫn có thể ghi bởi mọi người, hoặc quyền
sở hữu đường dẫn có vẻ đáng ngờ đối với Plugin không bundled.

Ứng viên bị chặn vẫn gắn với id Plugin của chúng để phục vụ chẩn đoán. Nếu cấu hình
vẫn tham chiếu id đó, xác thực báo cáo Plugin là có mặt nhưng bị chặn
và trỏ lại cảnh báo an toàn đường dẫn thay vì xem entry cấu hình
là lỗi thời.

### Hành vi ưu tiên bản kê khai

Bản kê khai là nguồn sự thật của mặt phẳng điều khiển. OpenClaw dùng nó để:

- nhận diện Plugin
- phát hiện kênh/skills/schema cấu hình hoặc năng lực gói đã khai báo
- xác thực `plugins.entries.<id>.config`
- bổ sung nhãn/placeholder cho Control UI
- hiển thị siêu dữ liệu cài đặt/catalog
- giữ các mô tả kích hoạt và thiết lập rẻ mà không cần tải môi trường chạy của Plugin

Đối với Plugin native, mô-đun môi trường chạy là phần thuộc mặt phẳng dữ liệu. Nó đăng ký
hành vi thực tế như hook, công cụ, lệnh, hoặc luồng nhà cung cấp.

Các khối `activation` và `setup` tùy chọn trong bản kê khai vẫn nằm trên mặt phẳng điều khiển.
Chúng là các mô tả chỉ-siêu-dữ-liệu cho lập kế hoạch kích hoạt và phát hiện thiết lập;
chúng không thay thế đăng ký môi trường chạy, `register(...)`, hoặc `setupEntry`.
Các thành phần tiêu thụ kích hoạt trực tiếp đầu tiên hiện dùng gợi ý lệnh, kênh, và nhà cung cấp trong bản kê khai
để thu hẹp phạm vi tải Plugin trước khi vật chất hóa registry rộng hơn:

- việc tải CLI thu hẹp vào các Plugin sở hữu lệnh chính được yêu cầu
- phân giải thiết lập kênh/Plugin thu hẹp vào các Plugin sở hữu
  id kênh được yêu cầu
- phân giải thiết lập/môi trường chạy nhà cung cấp tường minh thu hẹp vào các Plugin sở hữu
  id nhà cung cấp được yêu cầu
- lập kế hoạch khởi động Gateway dùng `activation.onStartup` cho các import khởi động
  tường minh và các lựa chọn không tham gia khởi động; Plugin không có siêu dữ liệu khởi động chỉ tải
  qua các trigger kích hoạt hẹp hơn

Các lần tải trước môi trường chạy tại thời điểm yêu cầu có phạm vi rộng `all` vẫn dẫn xuất
một tập id Plugin hiệu lực tường minh từ cấu hình, kế hoạch khởi động, kênh
đã cấu hình, slot, và quy tắc tự động bật. Nếu tập dẫn xuất đó trống, OpenClaw
tải một registry môi trường chạy trống thay vì mở rộng sang mọi
Plugin có thể phát hiện.

Bộ lập kế hoạch kích hoạt cung cấp cả API chỉ-id cho caller hiện có và
API kế hoạch cho chẩn đoán mới. Entry kế hoạch báo cáo lý do một Plugin được chọn,
tách các gợi ý lập kế hoạch `activation.*` tường minh khỏi fallback sở hữu bản kê khai
như `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools`, và hook. Việc tách lý do đó là ranh giới tương thích:
siêu dữ liệu Plugin hiện có tiếp tục hoạt động, trong khi mã mới có thể phát hiện gợi ý rộng
hoặc hành vi fallback mà không thay đổi ngữ nghĩa tải môi trường chạy.

Phát hiện thiết lập hiện ưu tiên các id do descriptor sở hữu như `setup.providers` và
`setup.cliBackends` để thu hẹp Plugin ứng viên trước khi fallback về
`setup-api` cho các Plugin vẫn cần hook môi trường chạy lúc thiết lập. Danh sách thiết lập
nhà cung cấp dùng `providerAuthChoices` trong bản kê khai, lựa chọn thiết lập dẫn xuất từ descriptor,
và siêu dữ liệu catalog cài đặt mà không tải môi trường chạy nhà cung cấp. `setup.requiresRuntime: false`
tường minh là điểm cắt chỉ-descriptor; `requiresRuntime` bị bỏ qua giữ fallback
setup-api cũ để tương thích. Nếu nhiều hơn một Plugin được phát hiện tuyên bố cùng
id nhà cung cấp thiết lập hoặc backend CLI đã chuẩn hóa, tra cứu thiết lập từ chối chủ sở hữu
mơ hồ thay vì dựa vào thứ tự phát hiện. Khi môi trường chạy thiết lập thực sự thực thi,
chẩn đoán registry báo cáo độ lệch giữa `setup.providers` / `setup.cliBackends`
và các nhà cung cấp hoặc backend CLI được setup-api đăng ký mà không chặn Plugin cũ.

### Ranh giới bộ nhớ đệm Plugin

OpenClaw không lưu đệm kết quả phát hiện Plugin hoặc dữ liệu registry bản kê khai trực tiếp
sau các cửa sổ thời gian đồng hồ. Cài đặt, chỉnh sửa bản kê khai, và thay đổi đường dẫn tải
phải hiển thị trong lần đọc siêu dữ liệu tường minh kế tiếp hoặc lần build lại snapshot.
Bộ phân tích tệp bản kê khai có thể giữ một bộ nhớ đệm chữ ký tệp có giới hạn, khóa theo
đường dẫn bản kê khai đã mở, inode, kích thước, và dấu thời gian; bộ nhớ đệm đó chỉ tránh
phân tích lại các byte không đổi và không được lưu đệm câu trả lời về phát hiện,
registry, chủ sở hữu, hoặc chính sách.

Đường nhanh siêu dữ liệu an toàn là quyền sở hữu đối tượng tường minh, không phải bộ nhớ đệm ẩn.
Các đường nóng khi khởi động Gateway nên truyền `PluginMetadataSnapshot` hiện tại,
`PluginLookUpTable` dẫn xuất, hoặc registry bản kê khai tường minh qua chuỗi gọi.
Xác thực cấu hình, tự động bật khi khởi động, bootstrap Plugin, và lựa chọn nhà cung cấp
có thể tái sử dụng các đối tượng đó khi chúng đại diện cho cấu hình hiện tại và
kho Plugin hiện tại. Tra cứu thiết lập vẫn tái tạo siêu dữ liệu bản kê khai theo nhu cầu
trừ khi đường thiết lập cụ thể nhận một registry bản kê khai tường minh; hãy giữ điều đó
như fallback đường lạnh thay vì thêm bộ nhớ đệm tra cứu ẩn. Khi đầu vào
thay đổi, build lại và thay thế snapshot thay vì mutate nó hoặc giữ
các bản sao lịch sử.
Các view trên registry Plugin đang hoạt động và helper bootstrap kênh bundled
nên được tính lại từ registry/root hiện tại. Map ngắn hạn là ổn
trong một lần gọi để khử trùng lặp công việc hoặc bảo vệ reentry; chúng không được trở thành
bộ nhớ đệm siêu dữ liệu của tiến trình.

Đối với tải Plugin, lớp bộ nhớ đệm bền vững là tải môi trường chạy. Nó có thể tái sử dụng
trạng thái bộ tải khi mã hoặc artifact đã cài đặt thực sự được tải, chẳng hạn:

- `PluginLoaderCacheState` và các registry môi trường chạy đang hoạt động tương thích
- bộ nhớ đệm jiti/mô-đun và bộ nhớ đệm bộ tải bề mặt công khai dùng để tránh import
  cùng một bề mặt môi trường chạy lặp lại
- bộ nhớ đệm hệ thống tệp cho artifact Plugin đã cài đặt
- map ngắn hạn theo-lần-gọi cho chuẩn hóa đường dẫn hoặc phân giải trùng lặp

Các bộ nhớ đệm đó là chi tiết triển khai của mặt phẳng dữ liệu. Chúng không được trả lời
các câu hỏi mặt phẳng điều khiển như "Plugin nào sở hữu nhà cung cấp này?" trừ khi
caller chủ động yêu cầu tải môi trường chạy.

Không thêm bộ nhớ đệm bền vững hoặc theo đồng hồ cho:

- kết quả phát hiện
- registry bản kê khai trực tiếp
- registry bản kê khai được tái tạo từ chỉ mục Plugin đã cài đặt
- tra cứu chủ sở hữu nhà cung cấp, chặn mô hình, chính sách nhà cung cấp, hoặc siêu dữ liệu
  artifact công khai
- bất kỳ câu trả lời dẫn xuất từ bản kê khai nào khác mà bản kê khai, chỉ mục đã cài đặt,
  hoặc đường dẫn tải đã thay đổi nên hiển thị trong lần đọc siêu dữ liệu kế tiếp

Caller build lại siêu dữ liệu bản kê khai từ chỉ mục Plugin đã cài đặt được lưu bền vững
sẽ tái tạo registry đó theo nhu cầu. Chỉ mục đã cài đặt là trạng thái mặt phẳng nguồn
bền vững; nó không phải bộ nhớ đệm siêu dữ liệu trong tiến trình ẩn.

## Mô hình registry

Plugin đã tải không trực tiếp mutate các global lõi ngẫu nhiên. Chúng đăng ký vào một
registry Plugin trung tâm.

Registry theo dõi:

- bản ghi Plugin (danh tính, nguồn, xuất xứ, trạng thái, chẩn đoán)
- công cụ
- hook cũ và hook có kiểu
- kênh
- nhà cung cấp
- handler RPC Gateway
- tuyến HTTP
- registrar CLI
- dịch vụ nền
- lệnh do Plugin sở hữu

Sau đó các tính năng lõi đọc từ registry đó thay vì nói chuyện trực tiếp với mô-đun
Plugin. Điều này giữ việc tải theo một chiều:

- mô-đun Plugin -> đăng ký registry
- môi trường chạy lõi -> tiêu thụ registry

Sự tách biệt đó quan trọng cho khả năng bảo trì. Nó có nghĩa là hầu hết bề mặt lõi chỉ
cần một điểm tích hợp: "đọc registry", không phải "xử lý đặc biệt từng mô-đun
Plugin".

## Callback liên kết hội thoại

Plugin liên kết một hội thoại có thể phản ứng khi một phê duyệt được giải quyết.

Dùng `api.onConversationBindingResolved(...)` để nhận callback sau khi yêu cầu liên kết
được phê duyệt hoặc từ chối:

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

Các trường payload callback:

- `status`: `"approved"` hoặc `"denied"`
- `decision`: `"allow-once"`, `"allow-always"`, hoặc `"deny"`
- `binding`: liên kết đã giải quyết cho yêu cầu được phê duyệt
- `request`: tóm tắt yêu cầu ban đầu, gợi ý tách, id người gửi, và
  siêu dữ liệu hội thoại

Callback này chỉ để thông báo. Nó không thay đổi ai được phép liên kết
một hội thoại, và nó chạy sau khi xử lý phê duyệt lõi hoàn tất.

## Hook môi trường chạy nhà cung cấp

Plugin nhà cung cấp có ba lớp:

- **Siêu dữ liệu bản kê khai** cho tra cứu rẻ trước môi trường chạy:
  `setup.providers[].envVars`, tương thích đã ngừng khuyến nghị `providerAuthEnvVars`,
  `providerAuthAliases`, `providerAuthChoices`, và `channelEnvVars`.
- **Hook lúc cấu hình**: `catalog` (`discovery` cũ) cộng với
  `applyConfigDefaults`.
- **Hook môi trường chạy**: hơn 40 hook tùy chọn bao phủ xác thực, phân giải mô hình,
  bọc stream, mức thinking, chính sách replay, và endpoint sử dụng. Xem
  danh sách đầy đủ trong [Thứ tự và cách dùng hook](#hook-order-and-usage).

OpenClaw vẫn sở hữu vòng lặp agent chung, failover, xử lý bản ghi hội thoại, và
chính sách công cụ. Các hook này là bề mặt mở rộng cho hành vi riêng của nhà cung cấp
mà không cần một transport suy luận tùy chỉnh hoàn toàn.

Dùng `setup.providers[].envVars` trong bản kê khai khi nhà cung cấp có thông tin xác thực dựa trên env
mà các đường xác thực/trạng thái/bộ chọn mô hình chung nên thấy mà không cần
tải môi trường chạy Plugin. `providerAuthEnvVars` đã ngừng khuyến nghị vẫn được đọc bởi
adapter tương thích trong thời gian ngừng hỗ trợ, và Plugin không bundled
dùng nó sẽ nhận một chẩn đoán bản kê khai. Dùng `providerAuthAliases` trong bản kê khai
khi một id nhà cung cấp nên tái sử dụng env var, hồ sơ xác thực,
xác thực dựa trên cấu hình, và lựa chọn onboarding API key của id nhà cung cấp khác. Dùng
`providerAuthChoices` trong bản kê khai khi các bề mặt CLI onboarding/lựa chọn xác thực nên biết
id lựa chọn, nhãn nhóm, và kết nối xác thực một-cờ đơn giản của nhà cung cấp mà không
tải môi trường chạy nhà cung cấp. Giữ `envVars` trong môi trường chạy nhà cung cấp
cho các gợi ý hướng tới operator như nhãn onboarding hoặc biến thiết lập OAuth
client-id/client-secret.

Dùng `channelEnvVars` trong bản kê khai khi một kênh có xác thực hoặc thiết lập dựa trên env mà
fallback shell-env chung, kiểm tra cấu hình/trạng thái, hoặc lời nhắc thiết lập nên thấy
mà không tải môi trường chạy kênh.

### Thứ tự và cách dùng hook

Đối với Plugin mô hình/nhà cung cấp, OpenClaw gọi hook theo thứ tự đại khái này.
Cột "Khi nào dùng" là hướng dẫn quyết định nhanh.
Các trường nhà cung cấp chỉ-tương-thích mà OpenClaw không còn gọi, chẳng hạn
`ProviderPlugin.capabilities` và `suppressBuiltInModel`, cố ý không được
liệt kê ở đây.

| #   | Hook                              | Chức năng                                                                                                   | Khi dùng                                                                                                                                   |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | Công bố cấu hình nhà cung cấp vào `models.providers` trong quá trình tạo `models.json`                                | Nhà cung cấp sở hữu catalog hoặc các mặc định URL cơ sở                                                                                                  |
| 2   | `applyConfigDefaults`             | Áp dụng các mặc định cấu hình toàn cục do nhà cung cấp sở hữu trong quá trình vật chất hóa cấu hình                                      | Các mặc định phụ thuộc vào chế độ xác thực, env, hoặc ngữ nghĩa họ mô hình của nhà cung cấp                                                                         |
| --  | _(tra cứu mô hình tích hợp sẵn)_         | OpenClaw thử đường dẫn registry/catalog thông thường trước                                                          | _(không phải hook Plugin)_                                                                                                                         |
| 3   | `normalizeModelId`                | Chuẩn hóa các bí danh model-id cũ hoặc preview trước khi tra cứu                                                     | Nhà cung cấp sở hữu việc dọn dẹp bí danh trước khi phân giải mô hình chuẩn                                                                                 |
| 4   | `normalizeTransport`              | Chuẩn hóa `api` / `baseUrl` của họ nhà cung cấp trước khi lắp ráp mô hình chung                                      | Nhà cung cấp sở hữu việc dọn dẹp tầng truyền tải cho các id nhà cung cấp tùy chỉnh trong cùng họ truyền tải                                                          |
| 5   | `normalizeConfig`                 | Chuẩn hóa `models.providers.<id>` trước khi phân giải thời gian chạy/nhà cung cấp                                           | Nhà cung cấp cần dọn dẹp cấu hình nên nằm cùng Plugin; các helper họ Google được đóng gói cũng hỗ trợ dự phòng cho các mục cấu hình Google được hỗ trợ   |
| 6   | `applyNativeStreamingUsageCompat` | Áp dụng các bản viết lại tương thích mức sử dụng streaming gốc cho nhà cung cấp cấu hình                                               | Nhà cung cấp cần sửa siêu dữ liệu mức sử dụng streaming gốc theo endpoint                                                                          |
| 7   | `resolveConfigApiKey`             | Phân giải xác thực marker env cho nhà cung cấp cấu hình trước khi tải xác thực thời gian chạy                                       | Nhà cung cấp phơi bày hook phân giải API-key marker env riêng                                                                                |
| 8   | `resolveSyntheticAuth`            | Hiển thị xác thực cục bộ/tự lưu trữ hoặc dựa trên cấu hình mà không lưu plaintext                                   | Nhà cung cấp có thể vận hành với marker thông tin xác thực tổng hợp/cục bộ                                                                                 |
| 9   | `resolveExternalAuthProfiles`     | Phủ các hồ sơ xác thực bên ngoài do nhà cung cấp sở hữu; `persistence` mặc định là `runtime-only` cho thông tin xác thực do CLI/ứng dụng sở hữu | Nhà cung cấp tái sử dụng thông tin xác thực bên ngoài mà không lưu các refresh token đã sao chép; khai báo `contracts.externalAuthProviders` trong manifest |
| 10  | `shouldDeferSyntheticProfileAuth` | Hạ mức ưu tiên các placeholder hồ sơ tổng hợp đã lưu phía sau xác thực dựa trên env/cấu hình                                      | Nhà cung cấp lưu các hồ sơ placeholder tổng hợp không nên thắng về thứ tự ưu tiên                                                                 |
| 11  | `resolveDynamicModel`             | Đồng bộ dự phòng cho các id mô hình do nhà cung cấp sở hữu chưa có trong registry cục bộ                                       | Nhà cung cấp chấp nhận các id mô hình upstream tùy ý                                                                                                 |
| 12  | `prepareDynamicModel`             | Khởi động async, rồi `resolveDynamicModel` chạy lại                                                           | Nhà cung cấp cần siêu dữ liệu mạng trước khi phân giải id không xác định                                                                                  |
| 13  | `normalizeResolvedModel`          | Viết lại lần cuối trước khi runner nhúng dùng mô hình đã phân giải                                               | Nhà cung cấp cần viết lại tầng truyền tải nhưng vẫn dùng tầng truyền tải lõi                                                                             |
| 14  | `normalizeToolSchemas`            | Chuẩn hóa schema công cụ trước khi runner nhúng nhìn thấy chúng                                                    | Nhà cung cấp cần dọn dẹp schema theo họ truyền tải                                                                                                |
| 15  | `inspectToolSchemas`              | Hiển thị chẩn đoán schema do nhà cung cấp sở hữu sau khi chuẩn hóa                                                  | Nhà cung cấp muốn cảnh báo keyword mà không dạy core các quy tắc riêng cho nhà cung cấp                                                                 |
| 16  | `resolveReasoningOutputMode`      | Chọn hợp đồng đầu ra suy luận gốc hoặc được gắn thẻ                                                              | Nhà cung cấp cần đầu ra suy luận/kết quả cuối được gắn thẻ thay vì các trường gốc                                                                         |
| 17  | `prepareExtraParams`              | Chuẩn hóa tham số yêu cầu trước các wrapper tùy chọn stream chung                                              | Nhà cung cấp cần tham số yêu cầu mặc định hoặc dọn dẹp tham số theo từng nhà cung cấp                                                                           |
| 18  | `createStreamFn`                  | Thay thế hoàn toàn đường dẫn stream thông thường bằng tầng truyền tải tùy chỉnh                                                   | Nhà cung cấp cần giao thức dây tùy chỉnh, không chỉ một wrapper                                                                                     |
| 20  | `wrapStreamFn`                    | Wrapper stream sau khi các wrapper chung được áp dụng                                                              | Nhà cung cấp cần wrapper tương thích header/body/mô hình của yêu cầu mà không có tầng truyền tải tùy chỉnh                                                          |
| 21  | `resolveTransportTurnState`       | Gắn header hoặc siêu dữ liệu truyền tải gốc theo từng lượt                                                           | Nhà cung cấp muốn các tầng truyền tải chung gửi định danh lượt gốc của nhà cung cấp                                                                       |
| 22  | `resolveWebSocketSessionPolicy`   | Gắn header WebSocket gốc hoặc chính sách giảm nhiệt phiên                                                    | Nhà cung cấp muốn các tầng truyền tải WS chung tinh chỉnh header phiên hoặc chính sách dự phòng                                                               |
| 23  | `formatApiKey`                    | Bộ định dạng hồ sơ xác thực: hồ sơ đã lưu trở thành chuỗi `apiKey` thời gian chạy                                     | Nhà cung cấp lưu siêu dữ liệu xác thực bổ sung và cần hình dạng token thời gian chạy tùy chỉnh                                                                    |
| 24  | `refreshOAuth`                    | Ghi đè làm mới OAuth cho endpoint làm mới tùy chỉnh hoặc chính sách lỗi làm mới                                  | Nhà cung cấp không khớp với các bộ làm mới dùng chung của OpenClaw                                                                                          |
| 25  | `buildAuthDoctorHint`             | Gợi ý sửa chữa được thêm vào khi làm mới OAuth thất bại                                                                  | Nhà cung cấp cần hướng dẫn sửa chữa xác thực do nhà cung cấp sở hữu sau lỗi làm mới                                                                      |
| 26  | `matchesContextOverflowError`     | Bộ khớp tràn cửa sổ ngữ cảnh do nhà cung cấp sở hữu                                                                 | Nhà cung cấp có lỗi tràn thô mà các heuristic chung sẽ bỏ sót                                                                                |
| 27  | `classifyFailoverReason`          | Phân loại lý do failover do nhà cung cấp sở hữu                                                                  | Nhà cung cấp có thể ánh xạ lỗi API/tầng truyền tải thô sang giới hạn tốc độ/quá tải/v.v.                                                                          |
| 28  | `isCacheTtlEligible`              | Chính sách prompt-cache cho nhà cung cấp proxy/backhaul                                                               | Nhà cung cấp cần chặn TTL bộ nhớ đệm riêng cho proxy                                                                                                |
| 29  | `buildMissingAuthMessage`         | Thay thế thông báo khôi phục thiếu xác thực chung                                                      | Nhà cung cấp cần gợi ý khôi phục thiếu xác thực riêng cho nhà cung cấp                                                                                 |
| 30  | `augmentModelCatalog`             | Các hàng catalog tổng hợp/cuối cùng được thêm sau discovery                                                          | Nhà cung cấp cần các hàng tương thích về phía trước tổng hợp trong `models list` và bộ chọn                                                                     |
| 31  | `resolveThinkingProfile`          | Tập mức `/think` theo mô hình, nhãn hiển thị, và mặc định                                                 | Nhà cung cấp phơi bày thang thinking tùy chỉnh hoặc nhãn nhị phân cho các mô hình được chọn                                                                 |
| 32  | `isBinaryThinking`                | Hook tương thích bật/tắt reasoning                                                                     | Nhà cung cấp chỉ phơi bày thinking bật/tắt dạng nhị phân                                                                                                  |
| 33  | `supportsXHighThinking`           | Hook tương thích hỗ trợ reasoning `xhigh`                                                                   | Nhà cung cấp muốn `xhigh` chỉ trên một tập con mô hình                                                                                             |
| 34  | `resolveDefaultThinkingLevel`     | Hook tương thích mức `/think` mặc định                                                                      | Nhà cung cấp sở hữu chính sách `/think` mặc định cho một họ mô hình                                                                                      |
| 35  | `isModernModelRef`                | Bộ khớp mô hình hiện đại cho bộ lọc hồ sơ live và lựa chọn smoke                                              | Nhà cung cấp sở hữu việc khớp mô hình ưu tiên cho live/smoke                                                                                             |
| 36  | `prepareRuntimeAuth`              | Trao đổi thông tin xác thực đã cấu hình thành token/key thời gian chạy thực tế ngay trước khi suy luận                       | Nhà cung cấp cần trao đổi token hoặc thông tin xác thực yêu cầu ngắn hạn                                                                             |
| 37  | `resolveUsageAuth`                | Phân giải thông tin xác thực usage/billing cho `/usage` và các bề mặt trạng thái liên quan                                     | Nhà cung cấp cần phân tích token usage/quota tùy chỉnh hoặc thông tin xác thực usage khác                                                               |
| 38  | `fetchUsageSnapshot`              | Lấy và chuẩn hóa ảnh chụp nhanh mức sử dụng/hạn ngạch dành riêng cho nhà cung cấp sau khi auth được giải quyết                             | Nhà cung cấp cần một điểm cuối mức sử dụng dành riêng cho nhà cung cấp hoặc bộ phân tích cú pháp tải trọng                                                                           |
| 39  | `createEmbeddingProvider`         | Xây dựng bộ điều hợp embedding do nhà cung cấp sở hữu cho bộ nhớ/tìm kiếm                                                     | Hành vi embedding bộ nhớ thuộc về plugin nhà cung cấp                                                                                    |
| 40  | `buildReplayPolicy`               | Trả về chính sách phát lại kiểm soát việc xử lý transcript cho nhà cung cấp                                        | Nhà cung cấp cần chính sách transcript tùy chỉnh (ví dụ: loại bỏ thinking-block)                                                               |
| 41  | `sanitizeReplayHistory`           | Viết lại lịch sử phát lại sau khi dọn dẹp transcript chung                                                        | Nhà cung cấp cần các thao tác viết lại phát lại dành riêng cho nhà cung cấp ngoài các helper compaction dùng chung                                                             |
| 42  | `validateReplayTurns`             | Xác thực hoặc định hình lại replay-turn cuối cùng trước embedded runner                                           | Transport của nhà cung cấp cần xác thực lượt nghiêm ngặt hơn sau bước làm sạch chung                                                                    |
| 43  | `onModelSelected`                 | Chạy các hiệu ứng phụ sau lựa chọn do nhà cung cấp sở hữu                                                                 | Nhà cung cấp cần telemetry hoặc trạng thái do nhà cung cấp sở hữu khi một model trở nên hoạt động                                                                  |

`normalizeModelId`, `normalizeTransport`, và `normalizeConfig` trước tiên kiểm tra
plugin nhà cung cấp đã khớp, rồi chuyển tiếp qua các plugin nhà cung cấp khác
có hỗ trợ hook cho đến khi một plugin thực sự thay đổi mã định danh mô hình
hoặc transport/config. Cách đó giữ cho các shim nhà cung cấp alias/compat hoạt
động mà không yêu cầu bên gọi biết plugin đi kèm nào sở hữu phần viết lại. Nếu
không có hook nhà cung cấp nào viết lại một mục cấu hình họ Google được hỗ trợ,
bộ chuẩn hóa cấu hình Google đi kèm vẫn áp dụng phần dọn dẹp tương thích đó.

Nếu nhà cung cấp cần một giao thức truyền dẫn hoàn toàn tùy chỉnh hoặc bộ thực
thi yêu cầu tùy chỉnh, đó là một lớp tiện ích mở rộng khác. Các hook này dành cho
hành vi nhà cung cấp vẫn chạy trên vòng lặp suy luận bình thường của OpenClaw.

`resolveUsageAuth` quyết định OpenClaw nên gọi `fetchUsageSnapshot` hay quay về
cơ chế phân giải thông tin xác thực chung cho các bề mặt usage/status. Trả về
`{ token, accountId? }` khi nhà cung cấp có thông tin xác thực usage, trả về
`{ handled: true }` khi auth usage do nhà cung cấp sở hữu đã xử lý yêu cầu và
phải chặn fallback API-key/OAuth chung, và trả về `null` hoặc `undefined` khi
nhà cung cấp không xử lý auth usage.

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

Các plugin nhà cung cấp đi kèm kết hợp các hook ở trên để phù hợp với nhu cầu
catalog, auth, suy luận, replay và usage của từng nhà cung cấp. Tập hook có thẩm
quyền nằm cùng mỗi plugin trong `extensions/`; trang này minh họa các hình dạng
thay vì sao chép danh sách.

<AccordionGroup>
  <Accordion title="Pass-through catalog providers">
    OpenRouter, Kilocode, Z.AI, xAI đăng ký `catalog` cùng
    `resolveDynamicModel` / `prepareDynamicModel` để chúng có thể hiển thị mã
    định danh mô hình upstream trước catalog tĩnh của OpenClaw.
  </Accordion>
  <Accordion title="OAuth and usage endpoint providers">
    GitHub Copilot, Gemini CLI, ChatGPT Codex, MiniMax, Xiaomi, z.ai ghép
    `prepareRuntimeAuth` hoặc `formatApiKey` với `resolveUsageAuth` +
    `fetchUsageSnapshot` để sở hữu trao đổi token và tích hợp `/usage`.
  </Accordion>
  <Accordion title="Replay and transcript cleanup families">
    Các họ được đặt tên dùng chung (`google-gemini`, `passthrough-gemini`,
    `anthropic-by-model`, `hybrid-anthropic-openai`) cho phép nhà cung cấp chọn
    tham gia chính sách transcript qua `buildReplayPolicy` thay vì để mỗi plugin
    tự triển khai lại phần dọn dẹp.
  </Accordion>
  <Accordion title="Catalog-only providers">
    `byteplus`, `cloudflare-ai-gateway`, `huggingface`, `kimi-coding`, `nvidia`,
    `qianfan`, `synthetic`, `together`, `venice`, `vercel-ai-gateway`, và
    `volcengine` chỉ đăng ký `catalog` và dùng vòng lặp suy luận dùng chung.
  </Accordion>
  <Accordion title="Anthropic-specific stream helpers">
    Beta headers, `/fast` / `serviceTier`, và `context1m` nằm bên trong seam
    `api.ts` / `contract-api.ts` công khai của plugin Anthropic
    (`wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`) thay vì nằm trong
    SDK chung.
  </Accordion>
</AccordionGroup>

## Helper runtime

Plugin có thể truy cập các helper lõi được chọn qua `api.runtime`. Với TTS:

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

- `textToSpeech` trả về payload đầu ra TTS lõi bình thường cho các bề mặt tệp/ghi chú thoại.
- Dùng cấu hình lõi `messages.tts` và lựa chọn nhà cung cấp.
- Trả về bộ đệm âm thanh PCM + tần số mẫu. Plugin phải resample/encode cho nhà cung cấp.
- `listVoices` là tùy chọn theo từng nhà cung cấp. Dùng nó cho bộ chọn giọng nói hoặc luồng thiết lập do nhà cung cấp sở hữu.
- Danh sách giọng nói có thể bao gồm metadata phong phú hơn như locale, giới tính và thẻ tính cách cho bộ chọn nhận biết nhà cung cấp.
- OpenAI và ElevenLabs hiện hỗ trợ telephony. Microsoft thì không.

Plugin cũng có thể đăng ký nhà cung cấp speech qua `api.registerSpeechProvider(...)`.

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

- Giữ chính sách TTS, fallback và gửi phản hồi trong lõi.
- Dùng nhà cung cấp speech cho hành vi tổng hợp do nhà cung cấp sở hữu.
- Đầu vào Microsoft legacy `edge` được chuẩn hóa thành mã định danh nhà cung cấp `microsoft`.
- Mô hình sở hữu ưu tiên là theo công ty: một plugin nhà cung cấp có thể sở hữu
  nhà cung cấp văn bản, speech, hình ảnh và media tương lai khi OpenClaw bổ sung
  các hợp đồng năng lực đó.

Với hiểu hình ảnh/âm thanh/video, plugin đăng ký một nhà cung cấp
media-understanding có kiểu thay vì một túi khóa/giá trị chung:

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

- Giữ orchestration, fallback, cấu hình và nối dây kênh trong lõi.
- Giữ hành vi nhà cung cấp trong plugin nhà cung cấp.
- Mở rộng cộng thêm nên duy trì có kiểu: phương thức tùy chọn mới, trường kết quả tùy chọn mới, năng lực tùy chọn mới.
- Tạo video đã đi theo cùng mẫu:
  - lõi sở hữu hợp đồng năng lực và helper runtime
  - plugin nhà cung cấp đăng ký `api.registerVideoGenerationProvider(...)`
  - plugin tính năng/kênh tiêu thụ `api.runtime.videoGeneration.*`

Với helper runtime media-understanding, plugin có thể gọi:

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
  model: "gpt-5.5",
  input: [
    {
      type: "image",
      buffer: receiptImageBuffer,
      fileName: "receipt.png",
      mime: "image/png",
    },
    { type: "text", text: "Use the printed fields as the source of truth." },
  ],
  instructions: "Return entities and searchable tags.",
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

Với phiên âm âm thanh, plugin có thể dùng runtime media-understanding hoặc alias STT cũ hơn:

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // Optional when MIME cannot be inferred reliably:
  mime: "audio/ogg",
});
```

Ghi chú:

- `api.runtime.mediaUnderstanding.*` là bề mặt dùng chung ưu tiên cho hiểu hình ảnh/âm thanh/video.
- `extractStructuredWithModel(...)` là seam hướng plugin cho trích xuất có giới hạn, do nhà cung cấp sở hữu, ưu tiên hình ảnh. Bao gồm ít nhất một đầu vào hình ảnh;
  đầu vào văn bản là ngữ cảnh bổ sung.
  plugin sản phẩm sở hữu route và schema của chúng trong khi OpenClaw sở hữu
  ranh giới provider/runtime.
- Dùng cấu hình âm thanh media-understanding lõi (`tools.media.audio`) và thứ tự fallback nhà cung cấp.
- Trả về `{ text: undefined }` khi không tạo ra đầu ra phiên âm nào, ví dụ đầu vào bị bỏ qua/không được hỗ trợ.
- `api.runtime.stt.transcribeAudioFile(...)` vẫn là alias tương thích.

Plugin cũng có thể khởi chạy lượt chạy subagent nền qua `api.runtime.subagent`:

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

- `provider` và `model` là override theo từng lượt chạy tùy chọn, không phải thay đổi phiên bền vững.
- OpenClaw chỉ tôn trọng các trường override đó cho bên gọi đáng tin cậy.
- Với lượt chạy fallback do plugin sở hữu, operator phải bật bằng `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Dùng `plugins.entries.<id>.subagent.allowedModels` để giới hạn plugin đáng tin cậy vào các mục tiêu `provider/model` canonical cụ thể, hoặc `"*"` để cho phép rõ ràng bất kỳ mục tiêu nào.
- Lượt chạy subagent của plugin không đáng tin cậy vẫn hoạt động, nhưng yêu cầu override bị từ chối thay vì âm thầm fallback.
- Phiên subagent do plugin tạo được gắn thẻ bằng mã định danh plugin đã tạo. Fallback `api.runtime.subagent.deleteSession(...)` chỉ có thể xóa các phiên được sở hữu đó; xóa phiên tùy ý vẫn yêu cầu một yêu cầu Gateway phạm vi admin.

Với tìm kiếm web, plugin có thể tiêu thụ helper runtime dùng chung thay vì
chạm vào phần nối dây công cụ agent:

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

- Giữ lựa chọn nhà cung cấp, phân giải thông tin xác thực và ngữ nghĩa yêu cầu dùng chung trong lõi.
- Dùng nhà cung cấp tìm kiếm web cho transport tìm kiếm riêng theo nhà cung cấp.
- `api.runtime.webSearch.*` là bề mặt dùng chung ưu tiên cho plugin tính năng/kênh cần hành vi tìm kiếm mà không phụ thuộc vào wrapper công cụ agent.

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

- `generate(...)`: tạo một hình ảnh bằng chuỗi nhà cung cấp tạo hình ảnh đã cấu hình.
- `listProviders(...)`: liệt kê các nhà cung cấp tạo hình ảnh hiện có và năng lực của họ.

## Route HTTP Gateway

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

Trường route:

- `path`: đường dẫn route dưới máy chủ HTTP của Gateway.
- `auth`: bắt buộc. Dùng `"gateway"` để yêu cầu xác thực Gateway thông thường, hoặc `"plugin"` cho xác thực/xác minh webhook do plugin quản lý.
- `match`: tùy chọn. `"exact"` (mặc định) hoặc `"prefix"`.
- `replaceExisting`: tùy chọn. Cho phép cùng một plugin thay thế đăng ký route hiện có của chính nó.
- `handler`: trả về `true` khi route đã xử lý yêu cầu.

Ghi chú:

- `api.registerHttpHandler(...)` đã bị xóa và sẽ gây lỗi tải plugin. Thay vào đó, hãy dùng `api.registerHttpRoute(...)`.
- Các route của plugin phải khai báo `auth` rõ ràng.
- Xung đột `path + match` chính xác sẽ bị từ chối trừ khi `replaceExisting: true`, và một plugin không thể thay thế route của plugin khác.
- Các route chồng lấn với các mức `auth` khác nhau sẽ bị từ chối. Chỉ giữ các chuỗi chuyển tiếp `exact`/`prefix` trên cùng một mức xác thực.
- Các route `auth: "plugin"` **không** tự động nhận phạm vi runtime của operator. Chúng dành cho webhook/xác minh chữ ký do plugin quản lý, không phải các lệnh gọi trợ giúp Gateway đặc quyền.
- Các route `auth: "gateway"` chạy bên trong phạm vi runtime yêu cầu Gateway, nhưng phạm vi đó được cố ý giữ thận trọng:
  - xác thực bearer bằng shared-secret (`gateway.auth.mode = "token"` / `"password"`) giữ phạm vi runtime của route plugin cố định ở `operator.write`, ngay cả khi caller gửi `x-openclaw-scopes`
  - các chế độ HTTP có danh tính đáng tin cậy (ví dụ `trusted-proxy` hoặc `gateway.auth.mode = "none"` trên ingress riêng tư) chỉ tôn trọng `x-openclaw-scopes` khi header được trình bày rõ ràng
  - nếu `x-openclaw-scopes` vắng mặt trên các yêu cầu route plugin có danh tính đó, phạm vi runtime quay về `operator.write`
- Quy tắc thực tế: đừng giả định route plugin xác thực qua gateway là một bề mặt quản trị ngầm định. Nếu route của bạn cần hành vi chỉ dành cho quản trị viên, hãy yêu cầu chế độ xác thực có danh tính và ghi tài liệu hợp đồng header `x-openclaw-scopes` rõ ràng.

## Đường dẫn import SDK của plugin

Dùng các đường dẫn con SDK hẹp thay vì barrel gốc nguyên khối `openclaw/plugin-sdk`
khi viết plugin mới. Các đường dẫn con lõi:

| Đường dẫn con                       | Mục đích                                           |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | Các primitive đăng ký plugin                       |
| `openclaw/plugin-sdk/channel-core`  | Trợ giúp entry/build cho kênh                      |
| `openclaw/plugin-sdk/core`          | Trợ giúp dùng chung tổng quát và hợp đồng bao quát |
| `openclaw/plugin-sdk/config-schema` | Schema Zod gốc `openclaw.json` (`OpenClawSchema`)  |

Plugin kênh chọn từ một họ các seam hẹp — `channel-setup`,
`setup-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-outbound`,
`command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets`, và `channel-actions`. Hành vi phê duyệt nên hợp nhất
trên một hợp đồng `approvalCapability` thay vì trộn lẫn qua các trường
plugin không liên quan. Xem [Plugin kênh](/vi/plugins/sdk-channel-plugins).

Các trợ giúp runtime và cấu hình nằm dưới các đường dẫn con tập trung `*-runtime`
tương ứng (`approval-runtime`, `agent-runtime`, `lazy-runtime`, `directory-runtime`,
`text-runtime`, `runtime-store`, `system-event-runtime`, `heartbeat-runtime`,
`channel-activity-runtime`, v.v.). Ưu tiên `config-contracts`,
`plugin-config-runtime`, `runtime-config-snapshot`, và `config-mutation`
thay vì barrel tương thích `config-runtime` rộng.

<Info>
`openclaw/plugin-sdk/channel-runtime`, `openclaw/plugin-sdk/channel-lifecycle`,
các facade trợ giúp kênh nhỏ, `openclaw/plugin-sdk/outbound-runtime`,
`openclaw/plugin-sdk/outbound-send-deps`, `openclaw/plugin-sdk/config-runtime`,
và `openclaw/plugin-sdk/infra-runtime` là các shim tương thích đã ngừng khuyến nghị cho
plugin cũ. Mã mới nên import các primitive tổng quát hẹp hơn.
</Info>

Các entry point nội bộ repo (theo gốc package plugin được đóng gói kèm):

- `index.js` — entry plugin được đóng gói kèm
- `api.js` — barrel trợ giúp/kiểu
- `runtime-api.js` — barrel chỉ dành cho runtime
- `setup-entry.js` — entry plugin thiết lập

Plugin bên ngoài chỉ nên import các đường dẫn con `openclaw/plugin-sdk/*`. Không bao giờ
import `src/*` của package plugin khác từ lõi hoặc từ plugin khác.
Các entry point được tải qua facade ưu tiên snapshot cấu hình runtime đang hoạt động khi
có, sau đó quay về tệp cấu hình đã phân giải trên đĩa.

Các đường dẫn con theo năng lực như `image-generation`, `media-understanding`,
và `speech` tồn tại vì các plugin đóng gói kèm đang dùng chúng hiện nay. Chúng không
tự động là hợp đồng bên ngoài được đóng băng dài hạn — hãy kiểm tra trang tham chiếu SDK
liên quan khi dựa vào chúng.

## Schema công cụ tin nhắn

Plugin nên sở hữu các đóng góp schema `describeMessageTool(...)` theo kênh
cho các primitive không phải tin nhắn như reaction, read, và poll.
Phần trình bày gửi dùng chung nên dùng hợp đồng `MessagePresentation` tổng quát
thay vì các trường button, component, block, hoặc card gốc của nhà cung cấp.
Xem [Trình bày tin nhắn](/vi/plugins/message-presentation) để biết hợp đồng,
quy tắc fallback, ánh xạ nhà cung cấp, và checklist cho tác giả plugin.

Các plugin có khả năng gửi khai báo những gì chúng có thể render thông qua năng lực tin nhắn:

- `presentation` cho các khối trình bày ngữ nghĩa (`text`, `context`, `divider`, `buttons`, `select`)
- `delivery-pin` cho yêu cầu ghim khi gửi

Lõi quyết định render phần trình bày theo cách gốc hay hạ cấp thành văn bản.
Không để lộ các lối thoát UI gốc của nhà cung cấp từ công cụ tin nhắn tổng quát.
Các trợ giúp SDK đã ngừng khuyến nghị cho schema gốc cũ vẫn được export cho các
plugin bên thứ ba hiện có, nhưng plugin mới không nên dùng chúng.

## Phân giải mục tiêu kênh

Plugin kênh nên sở hữu ngữ nghĩa mục tiêu theo kênh. Giữ host outbound dùng chung
ở mức tổng quát và dùng bề mặt adapter nhắn tin cho quy tắc nhà cung cấp:

- `messaging.inferTargetChatType({ to })` quyết định một mục tiêu đã chuẩn hóa
  nên được coi là `direct`, `group`, hay `channel` trước khi tra cứu thư mục.
- `messaging.targetResolver.looksLikeId(raw, normalized)` cho lõi biết liệu một
  input có nên đi thẳng tới phân giải kiểu id thay vì tìm kiếm thư mục hay không.
- `messaging.targetResolver.reservedLiterals` liệt kê các từ trần là
  tham chiếu kênh/phiên cho nhà cung cấp đó. Phân giải giữ nguyên các mục thư mục
  đã cấu hình trước khi từ chối literal dành riêng, rồi fail closed khi không tìm thấy
  trong thư mục.
- `messaging.targetResolver.resolveTarget(...)` là fallback của plugin khi
  lõi cần một phân giải cuối cùng thuộc sở hữu nhà cung cấp sau khi chuẩn hóa hoặc sau khi
  không tìm thấy trong thư mục.
- `messaging.resolveOutboundSessionRoute(...)` sở hữu việc xây dựng route phiên
  theo nhà cung cấp sau khi mục tiêu được phân giải.

Cách chia được khuyến nghị:

- Dùng `inferTargetChatType` cho các quyết định danh mục cần xảy ra trước khi
  tìm kiếm peer/group.
- Dùng `looksLikeId` cho các kiểm tra "coi đây là id mục tiêu rõ ràng/gốc".
- Dùng `resolveTarget` cho fallback chuẩn hóa theo nhà cung cấp, không phải cho
  tìm kiếm thư mục rộng.
- Giữ các id gốc của nhà cung cấp như chat id, thread id, JID, handle, và room
  id bên trong giá trị `target` hoặc tham số theo nhà cung cấp, không đặt trong các trường SDK
  tổng quát.

## Thư mục dựa trên cấu hình

Plugin tạo mục thư mục từ cấu hình nên giữ logic đó trong
plugin và tái sử dụng các trợ giúp dùng chung từ
`openclaw/plugin-sdk/directory-runtime`.

Dùng mục này khi một kênh cần peer/group dựa trên cấu hình như:

- peer DM theo allowlist
- ánh xạ kênh/group đã cấu hình
- fallback thư mục tĩnh theo phạm vi tài khoản

Các trợ giúp dùng chung trong `directory-runtime` chỉ xử lý các thao tác tổng quát:

- lọc truy vấn
- áp dụng giới hạn
- trợ giúp khử trùng lặp/chuẩn hóa
- xây dựng `ChannelDirectoryEntry[]`

Việc kiểm tra tài khoản theo kênh và chuẩn hóa id nên nằm trong
triển khai plugin.

## Catalog nhà cung cấp

Plugin nhà cung cấp có thể định nghĩa catalog model cho suy luận bằng
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` trả về cùng hình dạng mà OpenClaw ghi vào
`models.providers`:

- `{ provider }` cho một mục nhà cung cấp
- `{ providers }` cho nhiều mục nhà cung cấp

Dùng `catalog` khi plugin sở hữu id model theo nhà cung cấp, mặc định URL cơ sở,
hoặc metadata model bị chặn bởi xác thực.

`catalog.order` kiểm soát thời điểm catalog của plugin được hợp nhất tương đối với
các nhà cung cấp ngầm định tích hợp sẵn của OpenClaw:

- `simple`: nhà cung cấp dùng khóa API thuần hoặc điều khiển bằng env
- `profile`: nhà cung cấp xuất hiện khi có hồ sơ xác thực
- `paired`: nhà cung cấp tổng hợp nhiều mục nhà cung cấp liên quan
- `late`: lượt cuối, sau các nhà cung cấp ngầm định khác

Các nhà cung cấp sau thắng khi trùng khóa, nên plugin có thể cố ý ghi đè một
mục nhà cung cấp tích hợp sẵn có cùng provider id.

Plugin cũng có thể phát hành các hàng model chỉ đọc thông qua
`api.registerModelCatalogProvider({ provider, kinds, staticCatalog, liveCatalog
})`. Đây là hướng đi tiếp theo cho các bề mặt list/help/picker và hỗ trợ các hàng
`text`, `image_generation`, `video_generation`, và `music_generation`.
Plugin nhà cung cấp vẫn sở hữu các lệnh gọi endpoint trực tiếp, trao đổi token, và ánh xạ
phản hồi vendor; lõi sở hữu hình dạng hàng chung, nhãn nguồn, và định dạng trợ giúp
công cụ media. Đăng ký nhà cung cấp tạo media tự động tổng hợp các hàng
catalog tĩnh từ `defaultModel`, `models`, và `capabilities`.

Tương thích:

- `discovery` vẫn hoạt động như alias cũ, nhưng phát cảnh báo ngừng khuyến nghị
- nếu cả `catalog` và `discovery` đều được đăng ký, OpenClaw dùng `catalog`
- `augmentModelCatalog` đã ngừng khuyến nghị; các nhà cung cấp đóng gói kèm nên phát hành
  hàng bổ sung thông qua `registerModelCatalogProvider`

## Kiểm tra kênh chỉ đọc

Nếu plugin của bạn đăng ký một kênh, hãy ưu tiên triển khai
`plugin.config.inspectAccount(cfg, accountId)` cùng với `resolveAccount(...)`.

Lý do:

- `resolveAccount(...)` là đường dẫn runtime. Nó được phép giả định thông tin xác thực
  đã được materialize đầy đủ và có thể fail fast khi thiếu secret bắt buộc.
- Các đường dẫn lệnh chỉ đọc như `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve`, và các luồng doctor/sửa chữa
  cấu hình không nên cần materialize thông tin xác thực runtime chỉ để
  mô tả cấu hình.

Hành vi `inspectAccount(...)` được khuyến nghị:

- Chỉ trả về trạng thái tài khoản mang tính mô tả.
- Giữ nguyên `enabled` và `configured`.
- Bao gồm các trường nguồn/trạng thái thông tin xác thực khi liên quan, chẳng hạn:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Bạn không cần trả về giá trị token thô chỉ để báo cáo tính sẵn có
  chỉ đọc. Trả về `tokenStatus: "available"` (và trường nguồn tương ứng)
  là đủ cho các lệnh kiểu trạng thái.
- Dùng `configured_unavailable` khi thông tin xác thực được cấu hình qua SecretRef nhưng
  không sẵn có trong đường dẫn lệnh hiện tại.

Điều này cho phép các lệnh chỉ đọc báo cáo "đã cấu hình nhưng không sẵn có trong đường dẫn lệnh này"
thay vì crash hoặc báo sai rằng tài khoản chưa được cấu hình.

## Gói package

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

Mỗi entry trở thành một plugin. Nếu gói liệt kê nhiều extension, plugin id
trở thành `name/<fileBase>`.

Nếu plugin của bạn import phụ thuộc npm, hãy cài chúng trong thư mục đó để
`node_modules` sẵn có (`npm install` / `pnpm install`).

Rào chắn bảo mật: mọi entry `openclaw.extensions` phải nằm trong thư mục plugin
sau khi phân giải symlink. Các entry thoát khỏi thư mục package sẽ bị
từ chối.

Ghi chú bảo mật: `openclaw plugins install` cài đặt các phụ thuộc của plugin bằng một
`npm install --omit=dev --ignore-scripts` cục bộ theo dự án (không có script vòng đời,
không có phụ thuộc dev lúc chạy), bỏ qua các thiết lập cài đặt npm toàn cục được kế thừa.
Giữ cây phụ thuộc của plugin là "pure JS/TS" và tránh các gói yêu cầu
bản dựng `postinstall`.

Tùy chọn: `openclaw.setupEntry` có thể trỏ tới một mô-đun chỉ dùng cho thiết lập, gọn nhẹ.
Khi OpenClaw cần các bề mặt thiết lập cho một channel plugin bị tắt, hoặc
khi một channel plugin đã bật nhưng vẫn chưa được cấu hình, nó tải `setupEntry`
thay vì entry đầy đủ của plugin. Điều này giúp khởi động và thiết lập nhẹ hơn
khi entry chính của plugin cũng nối dây các công cụ, hook, hoặc mã chỉ dùng lúc chạy
khác.

Tùy chọn: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
có thể chọn cho một channel plugin đi theo cùng đường dẫn `setupEntry` trong giai đoạn
khởi động trước khi lắng nghe của gateway, ngay cả khi channel đã được cấu hình.

Chỉ dùng tùy chọn này khi `setupEntry` bao phủ đầy đủ bề mặt khởi động phải tồn tại
trước khi gateway bắt đầu lắng nghe. Trên thực tế, điều đó có nghĩa là setup entry
phải đăng ký mọi năng lực do channel sở hữu mà khởi động phụ thuộc vào, chẳng hạn:

- chính việc đăng ký channel
- mọi route HTTP phải có sẵn trước khi gateway bắt đầu lắng nghe
- mọi phương thức, công cụ hoặc dịch vụ gateway phải tồn tại trong cùng khoảng thời gian đó

Nếu entry đầy đủ của bạn vẫn sở hữu bất kỳ năng lực khởi động bắt buộc nào, đừng bật
cờ này. Giữ plugin ở hành vi mặc định và để OpenClaw tải
entry đầy đủ trong quá trình khởi động.

Các channel được đóng gói cũng có thể phát hành helper bề mặt hợp đồng chỉ dùng cho thiết lập mà core
có thể tham khảo trước khi runtime đầy đủ của channel được tải. Bề mặt thăng cấp thiết lập
hiện tại là:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Core dùng bề mặt đó khi cần thăng cấp cấu hình channel một tài khoản kiểu cũ
vào `channels.<id>.accounts.*` mà không tải entry đầy đủ của plugin.
Matrix là ví dụ đóng gói hiện tại: nó chỉ di chuyển các khóa auth/bootstrap vào một
tài khoản được thăng cấp có tên khi các tài khoản có tên đã tồn tại, và nó có thể giữ lại một
khóa tài khoản mặc định không chính tắc đã được cấu hình thay vì luôn tạo
`accounts.default`.

Các adapter bản vá thiết lập đó giữ cho việc khám phá bề mặt hợp đồng đóng gói là lazy. Thời gian
import vẫn nhẹ; bề mặt thăng cấp chỉ được tải ở lần sử dụng đầu tiên thay vì
đi lại vào khởi động channel đóng gói khi import mô-đun.

Khi các bề mặt khởi động đó bao gồm các phương thức RPC của gateway, hãy giữ chúng trên một
tiền tố riêng cho plugin. Các namespace quản trị core (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) vẫn được dành riêng và luôn phân giải
thành `operator.admin`, ngay cả khi một plugin yêu cầu phạm vi hẹp hơn.

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

### Siêu dữ liệu danh mục channel

Channel plugin có thể quảng bá siêu dữ liệu thiết lập/khám phá qua `openclaw.channel` và
gợi ý cài đặt qua `openclaw.install`. Điều này giữ cho dữ liệu danh mục core rỗng.

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

- `detailLabel`: nhãn phụ cho các bề mặt danh mục/trạng thái phong phú hơn
- `docsLabel`: ghi đè văn bản liên kết cho liên kết tài liệu
- `preferOver`: các id plugin/channel có ưu tiên thấp hơn mà mục danh mục này nên vượt lên
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: điều khiển nội dung bề mặt chọn
- `markdownCapable`: đánh dấu channel là có khả năng markdown cho các quyết định định dạng gửi đi
- `exposure.configured`: ẩn channel khỏi các bề mặt liệt kê channel đã cấu hình khi đặt thành `false`
- `exposure.setup`: ẩn channel khỏi bộ chọn thiết lập/cấu hình tương tác khi đặt thành `false`
- `exposure.docs`: đánh dấu channel là nội bộ/riêng tư cho các bề mặt điều hướng tài liệu
- `showConfigured` / `showInSetup`: các alias legacy vẫn được chấp nhận để tương thích; ưu tiên `exposure`
- `quickstartAllowFrom`: chọn channel vào luồng quickstart `allowFrom` chuẩn
- `forceAccountBinding`: yêu cầu ràng buộc tài khoản tường minh ngay cả khi chỉ có một tài khoản tồn tại
- `preferSessionLookupForAnnounceTarget`: ưu tiên tra cứu phiên khi phân giải mục tiêu thông báo

OpenClaw cũng có thể hợp nhất **danh mục channel bên ngoài** (ví dụ, một bản xuất registry MPM).
Đặt một tệp JSON tại một trong các vị trí:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Hoặc trỏ `OPENCLAW_PLUGIN_CATALOG_PATHS` (hoặc `OPENCLAW_MPM_CATALOG_PATHS`) tới
một hoặc nhiều tệp JSON (phân tách bằng dấu phẩy/dấu chấm phẩy/`PATH`). Mỗi tệp nên
chứa `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. Bộ phân tích cũng chấp nhận `"packages"` hoặc `"plugins"` làm alias legacy cho khóa `"entries"`.

Các mục danh mục channel được tạo và các mục danh mục cài đặt provider phơi bày
các sự kiện nguồn cài đặt đã chuẩn hóa bên cạnh khối `openclaw.install` thô. Các
sự kiện đã chuẩn hóa xác định npm spec là phiên bản chính xác hay bộ chọn trôi nổi,
siêu dữ liệu integrity kỳ vọng có hiện diện hay không, và đường dẫn nguồn cục bộ
có sẵn hay không. Khi biết danh tính danh mục/gói, các sự kiện đã chuẩn hóa cảnh báo nếu tên gói npm đã phân tích lệch khỏi danh tính đó.
Chúng cũng cảnh báo khi `defaultChoice` không hợp lệ hoặc trỏ tới một nguồn
không có sẵn, và khi siêu dữ liệu integrity npm hiện diện mà không có nguồn npm
hợp lệ. Consumer nên xem `installSource` là một trường tùy chọn cộng thêm để
các mục tạo thủ công và shim danh mục không phải tổng hợp nó.
Điều này cho phép onboarding và chẩn đoán giải thích trạng thái mặt phẳng nguồn mà không
import runtime plugin.

Các mục npm chính thức bên ngoài nên ưu tiên một `npmSpec` chính xác cộng với
`expectedIntegrity`. Tên gói trần và dist-tag vẫn hoạt động để
tương thích, nhưng chúng hiển thị cảnh báo mặt phẳng nguồn để danh mục có thể tiến tới
các bản cài đặt được ghim và kiểm tra integrity mà không làm hỏng các plugin hiện có.
Khi onboarding cài đặt từ một đường dẫn danh mục cục bộ, nó ghi lại một mục chỉ mục plugin
được quản lý với `source: "path"` và một `sourcePath` tương đối với workspace
khi có thể. Đường dẫn tải vận hành tuyệt đối vẫn nằm trong
`plugins.load.paths`; bản ghi cài đặt tránh sao chép các đường dẫn máy trạm cục bộ
vào cấu hình dài hạn. Điều này giữ cho các bản cài đặt phát triển cục bộ hiển thị với
chẩn đoán mặt phẳng nguồn mà không thêm một bề mặt tiết lộ đường dẫn hệ thống tệp thô thứ hai.
Hàng SQLite `installed_plugin_index` được lưu bền là nguồn sự thật của cài đặt
và có thể được làm mới mà không tải các mô-đun runtime plugin.
Map `installRecords` của nó bền ngay cả khi manifest plugin bị thiếu hoặc
không hợp lệ; payload `plugins` của nó là một chế độ xem manifest có thể dựng lại.

## Plugin engine ngữ cảnh

Plugin engine ngữ cảnh sở hữu điều phối ngữ cảnh phiên cho ingest, assembly,
và compaction. Đăng ký chúng từ plugin của bạn bằng
`api.registerContextEngine(id, factory)`, rồi chọn engine đang hoạt động bằng
`plugins.slots.contextEngine`.

Dùng tính năng này khi plugin của bạn cần thay thế hoặc mở rộng pipeline ngữ cảnh mặc định
thay vì chỉ thêm tìm kiếm bộ nhớ hoặc hook.

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

Factory `ctx` phơi bày các giá trị tùy chọn `config`, `agentDir`, và `workspaceDir`
để khởi tạo tại thời điểm xây dựng.

`assemble()` có thể trả về `contextProjection` khi harness đang hoạt động có một
luồng backend bền. Bỏ qua nó cho phép chiếu legacy theo từng lượt. Trả về
`{ mode: "thread_bootstrap", epoch }` khi ngữ cảnh đã lắp ráp nên được
tiêm một lần vào một luồng backend và tái sử dụng cho đến khi epoch thay đổi. Thay đổi
epoch sau khi ngữ cảnh ngữ nghĩa của engine thay đổi, chẳng hạn sau một lượt
compaction do engine sở hữu. Host có thể giữ lại siêu dữ liệu tool-call, hình dạng input,
và kết quả công cụ đã biên tập trong phép chiếu thread-bootstrap để các
luồng backend mới giữ được tính liên tục của công cụ mà không sao chép payload thô
mang bí mật.

Nếu engine của bạn **không** sở hữu thuật toán compaction, hãy giữ `compact()`
được triển khai và ủy quyền nó một cách tường minh:

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

## Thêm một năng lực mới

Khi một plugin cần hành vi không phù hợp với API hiện tại, đừng vượt qua
hệ thống plugin bằng một private reach-in. Hãy thêm năng lực còn thiếu.

Trình tự khuyến nghị:

1. định nghĩa hợp đồng core
   Quyết định hành vi chia sẻ nào core nên sở hữu: policy, fallback, hợp nhất cấu hình,
   vòng đời, ngữ nghĩa hướng channel, và hình dạng helper runtime.
2. thêm các bề mặt đăng ký/runtime plugin có kiểu
   Mở rộng `OpenClawPluginApi` và/hoặc `api.runtime` với bề mặt năng lực
   có kiểu nhỏ nhất hữu ích.
3. nối dây core + các consumer channel/tính năng
   Channel và feature plugin nên tiêu thụ năng lực mới thông qua core,
   không phải bằng cách import trực tiếp một triển khai vendor.
4. đăng ký các triển khai vendor
   Sau đó các plugin vendor đăng ký backend của chúng với năng lực.
5. thêm phạm vi kiểm thử hợp đồng
   Thêm kiểm thử để hình dạng sở hữu và đăng ký luôn tường minh theo thời gian.

Đây là cách OpenClaw giữ quan điểm rõ ràng mà không bị hardcode theo thế giới quan của một
provider. Xem [Sổ tay năng lực](/vi/plugins/adding-capabilities)
để có checklist tệp cụ thể và ví dụ đã làm.

### Checklist năng lực

Khi bạn thêm một năng lực mới, việc triển khai thường nên chạm các
bề mặt này cùng nhau:

- kiểu hợp đồng core trong `src/<capability>/types.ts`
- helper runner/runtime core trong `src/<capability>/runtime.ts`
- bề mặt đăng ký API plugin trong `src/plugins/types.ts`
- nối dây registry plugin trong `src/plugins/registry.ts`
- phơi bày runtime plugin trong `src/plugins/runtime/*` khi feature/channel
  plugin cần tiêu thụ nó
- helper capture/kiểm thử trong `src/test-utils/plugin-registration.ts`
- assertion sở hữu/hợp đồng trong `src/plugins/contracts/registry.ts`
- tài liệu operator/plugin trong `docs/`

Nếu một trong các bề mặt đó bị thiếu, đó thường là dấu hiệu năng lực
chưa được tích hợp đầy đủ.

### Mẫu năng lực

Mẫu tối giản:

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

- core sở hữu hợp đồng năng lực + điều phối
- các Plugin nhà cung cấp sở hữu phần triển khai của nhà cung cấp
- các Plugin tính năng/kênh dùng các helper runtime
- kiểm thử hợp đồng giữ quyền sở hữu rõ ràng

## Liên quan

- [Kiến trúc Plugin](/vi/plugins/architecture) — mô hình và hình dạng năng lực công khai
- [Đường dẫn con Plugin SDK](/vi/plugins/sdk-subpaths)
- [Thiết lập Plugin SDK](/vi/plugins/sdk-setup)
- [Xây dựng Plugin](/vi/plugins/building-plugins)
