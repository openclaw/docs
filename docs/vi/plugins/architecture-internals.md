---
read_when:
    - Triển khai các điểm móc nối thời gian chạy của nhà cung cấp, vòng đời kênh hoặc các bộ gói
    - Gỡ lỗi thứ tự tải Plugin hoặc trạng thái sổ đăng ký
    - Thêm một khả năng Plugin mới hoặc Plugin công cụ ngữ cảnh
summary: 'Nội bộ kiến trúc Plugin: quy trình nạp, sổ đăng ký, móc nối thời gian chạy, tuyến HTTP và bảng tham chiếu'
title: Nội bộ kiến trúc Plugin
x-i18n:
    generated_at: "2026-05-11T20:33:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: a74c068fce039ef3b85b2634caea0854e8ffb246a5ff59ebd8feadb8d93601d6
    source_path: plugins/architecture-internals.md
    workflow: 16
---

Để biết mô hình khả năng công khai, dạng Plugin và hợp đồng sở hữu/thực thi, hãy xem [Kiến trúc Plugin](/vi/plugins/architecture). Trang này là tài liệu tham chiếu cho cơ chế nội bộ: quy trình tải, registry, hook runtime, route HTTP của Gateway, đường dẫn import và bảng lược đồ.

## Quy trình tải

Khi khởi động, OpenClaw đại khái thực hiện như sau:

1. phát hiện các gốc Plugin ứng viên
2. đọc manifest bundle gốc hoặc tương thích và metadata package
3. từ chối các ứng viên không an toàn
4. chuẩn hóa cấu hình Plugin (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. quyết định trạng thái bật cho từng ứng viên
6. tải các module gốc đã bật: các module đóng gói sẵn được xây dựng dùng trình tải gốc;
   mã nguồn TypeScript cục bộ của bên thứ ba dùng phương án dự phòng khẩn cấp Jiti
7. gọi hook `register(api)` gốc và thu thập các đăng ký vào Plugin registry
8. hiển thị registry cho các lệnh/bề mặt runtime

<Note>
`activate` là bí danh cũ của `register` — trình tải phân giải cái nào hiện diện (`def.register ?? def.activate`) và gọi nó tại cùng thời điểm. Tất cả Plugin đóng gói sẵn đều dùng `register`; hãy ưu tiên `register` cho Plugin mới.
</Note>

Các cổng an toàn diễn ra **trước** khi thực thi runtime. Ứng viên bị chặn
khi entry thoát ra ngoài gốc Plugin, đường dẫn có thể ghi bởi mọi người, hoặc
quyền sở hữu đường dẫn trông đáng ngờ đối với Plugin không đóng gói sẵn.

Các ứng viên bị chặn vẫn được gắn với id Plugin của chúng để chẩn đoán. Nếu cấu hình
vẫn tham chiếu id đó, kiểm thực sẽ báo Plugin là hiện diện nhưng bị chặn
và trỏ lại cảnh báo an toàn đường dẫn thay vì xem entry cấu hình
là đã lỗi thời.

### Hành vi ưu tiên manifest

Manifest là nguồn chân lý của mặt phẳng điều khiển. OpenClaw dùng nó để:

- nhận diện Plugin
- phát hiện các kênh/Skills/lược đồ cấu hình đã khai báo hoặc khả năng bundle
- kiểm thực `plugins.entries.<id>.config`
- bổ sung nhãn/placeholder cho Control UI
- hiển thị metadata cài đặt/catalog
- giữ lại descriptor kích hoạt và thiết lập rẻ mà không tải runtime Plugin

Đối với Plugin gốc, module runtime là phần mặt phẳng dữ liệu. Nó đăng ký
hành vi thực tế như hook, công cụ, lệnh hoặc luồng provider.

Các khối manifest tùy chọn `activation` và `setup` vẫn ở mặt phẳng điều khiển.
Chúng là descriptor chỉ chứa metadata cho lập kế hoạch kích hoạt và khám phá thiết lập;
chúng không thay thế đăng ký runtime, `register(...)` hoặc `setupEntry`.
Những bên tiêu thụ kích hoạt live đầu tiên hiện dùng gợi ý lệnh, kênh và provider trong manifest
để thu hẹp việc tải Plugin trước khi vật chất hóa registry rộng hơn:

- việc tải CLI thu hẹp vào các Plugin sở hữu lệnh chính được yêu cầu
- phân giải thiết lập kênh/Plugin thu hẹp vào các Plugin sở hữu
  id kênh được yêu cầu
- phân giải thiết lập/runtime provider tường minh thu hẹp vào các Plugin sở hữu
  id provider được yêu cầu
- lập kế hoạch khởi động Gateway dùng `activation.onStartup` cho các import khởi động
  tường minh và các trường hợp chọn không tham gia khởi động; Plugin không có metadata khởi động chỉ tải
  thông qua các trigger kích hoạt hẹp hơn

Các preload runtime tại thời điểm yêu cầu hỏi phạm vi rộng `all` vẫn dẫn xuất một
tập id Plugin hiệu dụng tường minh từ cấu hình, kế hoạch khởi động, kênh
đã cấu hình, slot và quy tắc tự động bật. Nếu tập dẫn xuất đó trống, OpenClaw
tải một runtime registry trống thay vì mở rộng sang mọi
Plugin có thể phát hiện.

Bộ lập kế hoạch kích hoạt hiển thị cả API chỉ có ids cho caller hiện có và
API plan cho chẩn đoán mới. Các entry plan báo cáo lý do một Plugin được chọn,
tách các gợi ý planner `activation.*` tường minh khỏi phương án dự phòng sở hữu manifest
như `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` và hook. Phần tách lý do đó là ranh giới tương thích:
metadata Plugin hiện có tiếp tục hoạt động, trong khi mã mới có thể phát hiện gợi ý rộng
hoặc hành vi dự phòng mà không thay đổi ngữ nghĩa tải runtime.

Khám phá thiết lập hiện ưu tiên các id do descriptor sở hữu như `setup.providers` và
`setup.cliBackends` để thu hẹp Plugin ứng viên trước khi quay về
`setup-api` cho các Plugin vẫn cần hook runtime tại thời điểm thiết lập. Danh sách thiết lập
provider dùng manifest `providerAuthChoices`, lựa chọn thiết lập dẫn xuất từ descriptor
và metadata catalog cài đặt mà không tải runtime provider. `setup.requiresRuntime: false`
tường minh là điểm dừng chỉ dùng descriptor; nếu bỏ qua
`requiresRuntime` thì vẫn giữ phương án dự phòng setup-api cũ để tương thích. Nếu nhiều
hơn một Plugin được phát hiện khai báo cùng id provider thiết lập hoặc backend CLI
đã chuẩn hóa, tra cứu thiết lập sẽ từ chối chủ sở hữu mơ hồ thay vì dựa vào
thứ tự khám phá. Khi runtime thiết lập thực thi, chẩn đoán registry báo cáo
độ lệch giữa `setup.providers` / `setup.cliBackends` và các provider hoặc backend CLI
được đăng ký bởi setup-api mà không chặn Plugin cũ.

### Ranh giới cache Plugin

OpenClaw không cache kết quả khám phá Plugin hoặc dữ liệu registry manifest trực tiếp
sau các cửa sổ theo đồng hồ. Cài đặt, chỉnh sửa manifest và thay đổi đường dẫn tải
phải hiển thị ở lần đọc metadata tường minh tiếp theo hoặc lần dựng lại snapshot tiếp theo.
Bộ phân tích cú pháp tệp manifest có thể giữ một cache chữ ký tệp có giới hạn, được khóa theo
đường dẫn manifest đã mở, inode, kích thước và dấu thời gian; cache đó chỉ tránh
phân tích lại các byte không đổi và không được cache câu trả lời về khám phá, registry, chủ sở hữu hoặc
chính sách.

Đường nhanh metadata an toàn là quyền sở hữu đối tượng tường minh, không phải cache ẩn.
Các hot path khởi động Gateway nên truyền `PluginMetadataSnapshot` hiện tại,
`PluginLookUpTable` dẫn xuất hoặc một registry manifest tường minh qua chuỗi gọi.
Kiểm thực cấu hình, tự động bật khi khởi động, bootstrap Plugin và lựa chọn provider
có thể dùng lại các đối tượng đó khi chúng đại diện cho cấu hình và
kho Plugin hiện tại. Tra cứu thiết lập vẫn tái tạo metadata manifest theo nhu cầu
trừ khi đường dẫn thiết lập cụ thể nhận được một registry manifest tường minh; hãy giữ nó
làm phương án dự phòng đường lạnh thay vì thêm cache tra cứu ẩn. Khi đầu vào
thay đổi, hãy dựng lại và thay thế snapshot thay vì sửa đổi nó hoặc giữ
các bản sao lịch sử.
Các view trên Plugin registry đang hoạt động và helper bootstrap kênh đóng gói sẵn
nên được tính lại từ registry/gốc hiện tại. Map ngắn hạn vẫn ổn
trong một lần gọi để khử trùng lặp công việc hoặc bảo vệ tái nhập; chúng không được trở thành cache
metadata của tiến trình.

Đối với tải Plugin, lớp cache bền vững là tải runtime. Nó có thể tái sử dụng
trạng thái trình tải khi mã hoặc artifact đã cài đặt thực sự được tải, chẳng hạn như:

- `PluginLoaderCacheState` và runtime registry đang hoạt động tương thích
- cache jiti/module và cache trình tải bề mặt công khai dùng để tránh import
  cùng một bề mặt runtime nhiều lần
- cache hệ thống tệp cho artifact Plugin đã cài đặt
- map ngắn hạn theo từng lần gọi để chuẩn hóa đường dẫn hoặc phân giải trùng lặp

Các cache đó là chi tiết triển khai mặt phẳng dữ liệu. Chúng không được trả lời
các câu hỏi mặt phẳng điều khiển như "Plugin nào sở hữu provider này?" trừ khi
caller cố ý yêu cầu tải runtime.

Không thêm cache bền vững hoặc theo đồng hồ cho:

- kết quả khám phá
- registry manifest trực tiếp
- registry manifest được tái tạo từ chỉ mục Plugin đã cài đặt
- tra cứu chủ sở hữu provider, chặn model, chính sách provider hoặc metadata artifact
  công khai
- bất kỳ câu trả lời nào khác dẫn xuất từ manifest mà manifest, chỉ mục đã cài đặt
  hoặc đường dẫn tải đã thay đổi cần hiển thị ở lần đọc metadata tiếp theo

Caller dựng lại metadata manifest từ chỉ mục Plugin đã cài đặt được lưu bền vững
sẽ tái tạo registry đó theo nhu cầu. Chỉ mục đã cài đặt là trạng thái mặt phẳng nguồn
bền vững; nó không phải cache metadata ẩn trong tiến trình.

## Mô hình registry

Plugin đã tải không trực tiếp sửa đổi các global lõi ngẫu nhiên. Chúng đăng ký vào một
Plugin registry trung tâm.

Registry theo dõi:

- bản ghi Plugin (danh tính, nguồn, origin, trạng thái, chẩn đoán)
- công cụ
- hook cũ và hook có kiểu
- kênh
- provider
- trình xử lý RPC Gateway
- route HTTP
- registrar CLI
- dịch vụ nền
- lệnh do Plugin sở hữu

Các tính năng lõi sau đó đọc từ registry đó thay vì nói chuyện trực tiếp với module
Plugin. Điều này giữ việc tải theo một chiều:

- module Plugin -> đăng ký registry
- runtime lõi -> tiêu thụ registry

Sự tách biệt đó quan trọng cho khả năng bảo trì. Nó có nghĩa là hầu hết bề mặt lõi chỉ
cần một điểm tích hợp: "đọc registry", không phải "xử lý riêng từng module
Plugin".

## Callback ràng buộc hội thoại

Plugin ràng buộc một hội thoại có thể phản ứng khi một phê duyệt được giải quyết.

Dùng `api.onConversationBindingResolved(...)` để nhận callback sau khi yêu cầu bind
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
- `decision`: `"allow-once"`, `"allow-always"` hoặc `"deny"`
- `binding`: binding đã phân giải cho các yêu cầu được phê duyệt
- `request`: tóm tắt yêu cầu ban đầu, gợi ý tách, id người gửi và
  metadata hội thoại

Callback này chỉ để thông báo. Nó không thay đổi ai được phép bind một
hội thoại, và chạy sau khi xử lý phê duyệt lõi hoàn tất.

## Hook runtime provider

Plugin provider có ba lớp:

- **Metadata manifest** cho tra cứu rẻ trước runtime:
  `setup.providers[].envVars`, tương thích đã ngừng khuyến nghị `providerAuthEnvVars`,
  `providerAuthAliases`, `providerAuthChoices` và `channelEnvVars`.
- **Hook thời điểm cấu hình**: `catalog` (`discovery` cũ) cộng với
  `applyConfigDefaults`.
- **Hook runtime**: hơn 40 hook tùy chọn bao phủ auth, phân giải model,
  bọc stream, cấp độ suy nghĩ, chính sách replay và endpoint sử dụng. Xem
  danh sách đầy đủ trong [Thứ tự hook và cách sử dụng](#hook-order-and-usage).

OpenClaw vẫn sở hữu vòng lặp agent chung, failover, xử lý transcript và
chính sách công cụ. Những hook này là bề mặt mở rộng cho hành vi đặc thù
provider mà không cần toàn bộ transport inference tùy chỉnh.

Dùng manifest `setup.providers[].envVars` khi provider có credential dựa trên env
mà các đường dẫn auth/trạng thái/trình chọn model chung nên thấy mà không
tải runtime Plugin. `providerAuthEnvVars` đã ngừng khuyến nghị vẫn được đọc bởi
adapter tương thích trong cửa sổ ngừng khuyến nghị, và Plugin không đóng gói sẵn
dùng nó sẽ nhận chẩn đoán manifest. Dùng manifest `providerAuthAliases`
khi một id provider nên tái sử dụng env vars, hồ sơ auth, auth dựa trên cấu hình
và lựa chọn onboarding API-key của một id provider khác. Dùng manifest
`providerAuthChoices` khi các bề mặt CLI onboarding/lựa chọn auth cần biết
id lựa chọn của provider, nhãn nhóm và dây nối auth một cờ đơn giản mà không
tải runtime provider. Giữ runtime provider
`envVars` cho các gợi ý hướng tới operator như nhãn onboarding hoặc biến thiết lập
client-id/client-secret OAuth.

Dùng manifest `channelEnvVars` khi một kênh có auth hoặc thiết lập do env điều khiển mà
phương án dự phòng shell-env chung, kiểm tra cấu hình/trạng thái hoặc prompt thiết lập nên thấy
mà không tải runtime kênh.

### Thứ tự hook và cách sử dụng

Đối với Plugin model/provider, OpenClaw gọi hook theo thứ tự đại khái này.
Cột "Khi nào dùng" là hướng dẫn quyết định nhanh.
Các trường provider chỉ để tương thích mà OpenClaw không còn gọi, chẳng hạn như
`ProviderPlugin.capabilities` và `suppressBuiltInModel`, được cố ý không
liệt kê ở đây.

| #   | Móc nối                           | Chức năng                                                                                                      | Khi nào dùng                                                                                                                                  |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | Công bố cấu hình nhà cung cấp vào `models.providers` trong quá trình tạo `models.json`                         | Nhà cung cấp sở hữu catalog hoặc giá trị mặc định URL cơ sở                                                                                   |
| 2   | `applyConfigDefaults`             | Áp dụng các giá trị mặc định cấu hình toàn cục do nhà cung cấp sở hữu trong quá trình vật chất hóa cấu hình    | Giá trị mặc định phụ thuộc vào chế độ xác thực, env, hoặc ngữ nghĩa họ mô hình của nhà cung cấp                                               |
| --  | _(tra cứu mô hình tích hợp sẵn)_  | OpenClaw thử đường dẫn registry/catalog thông thường trước                                                     | _(không phải móc nối Plugin)_                                                                                                                 |
| 3   | `normalizeModelId`                | Chuẩn hóa các bí danh model-id legacy hoặc preview trước khi tra cứu                                           | Nhà cung cấp sở hữu việc dọn dẹp bí danh trước khi phân giải mô hình chính tắc                                                               |
| 4   | `normalizeTransport`              | Chuẩn hóa `api` / `baseUrl` của họ nhà cung cấp trước khi lắp ráp mô hình chung                                | Nhà cung cấp sở hữu việc dọn dẹp transport cho các id nhà cung cấp tùy chỉnh trong cùng họ transport                                          |
| 5   | `normalizeConfig`                 | Chuẩn hóa `models.providers.<id>` trước khi phân giải runtime/nhà cung cấp                                     | Nhà cung cấp cần dọn dẹp cấu hình nằm cùng Plugin; các helper họ Google được đóng gói cũng hỗ trợ dự phòng cho mục cấu hình Google được hỗ trợ |
| 6   | `applyNativeStreamingUsageCompat` | Áp dụng các bản viết lại tương thích usage streaming gốc cho nhà cung cấp cấu hình                             | Nhà cung cấp cần sửa metadata usage streaming gốc do endpoint điều khiển                                                                      |
| 7   | `resolveConfigApiKey`             | Phân giải xác thực env-marker cho nhà cung cấp cấu hình trước khi tải xác thực runtime                         | Nhà cung cấp có phân giải API-key env-marker do nhà cung cấp sở hữu; `amazon-bedrock` cũng có bộ phân giải env-marker AWS tích hợp tại đây     |
| 8   | `resolveSyntheticAuth`            | Hiển thị xác thực cục bộ/tự lưu trữ hoặc dựa trên cấu hình mà không lưu plaintext                              | Nhà cung cấp có thể hoạt động với marker credential tổng hợp/cục bộ                                                                           |
| 9   | `resolveExternalAuthProfiles`     | Phủ hồ sơ xác thực bên ngoài do nhà cung cấp sở hữu; `persistence` mặc định là `runtime-only` cho cred do CLI/app sở hữu | Nhà cung cấp tái sử dụng credential xác thực bên ngoài mà không lưu refresh token đã sao chép; khai báo `contracts.externalAuthProviders` trong manifest |
| 10  | `shouldDeferSyntheticProfileAuth` | Hạ mức placeholder hồ sơ tổng hợp đã lưu xuống sau xác thực dựa trên env/cấu hình                              | Nhà cung cấp lưu hồ sơ placeholder tổng hợp không nên thắng về thứ tự ưu tiên                                                                |
| 11  | `resolveDynamicModel`             | Dự phòng đồng bộ cho id mô hình do nhà cung cấp sở hữu chưa có trong registry cục bộ                           | Nhà cung cấp chấp nhận id mô hình upstream tùy ý                                                                                              |
| 12  | `prepareDynamicModel`             | Khởi động nóng bất đồng bộ, rồi `resolveDynamicModel` chạy lại                                                 | Nhà cung cấp cần metadata mạng trước khi phân giải id chưa biết                                                                               |
| 13  | `normalizeResolvedModel`          | Bản viết lại cuối cùng trước khi runner nhúng dùng mô hình đã phân giải                                        | Nhà cung cấp cần viết lại transport nhưng vẫn dùng transport lõi                                                                              |
| 14  | `contributeResolvedModelCompat`   | Đóng góp cờ tương thích cho mô hình vendor phía sau transport tương thích khác                                 | Nhà cung cấp nhận diện mô hình của mình trên transport proxy mà không tiếp quản nhà cung cấp                                                  |
| 15  | `normalizeToolSchemas`            | Chuẩn hóa schema công cụ trước khi runner nhúng thấy chúng                                                     | Nhà cung cấp cần dọn dẹp schema họ transport                                                                                                  |
| 16  | `inspectToolSchemas`              | Hiển thị chẩn đoán schema do nhà cung cấp sở hữu sau khi chuẩn hóa                                             | Nhà cung cấp muốn cảnh báo từ khóa mà không dạy lõi các quy tắc riêng của nhà cung cấp                                                       |
| 17  | `resolveReasoningOutputMode`      | Chọn hợp đồng đầu ra reasoning gốc so với gắn thẻ                                                              | Nhà cung cấp cần reasoning/đầu ra cuối cùng dạng gắn thẻ thay vì trường gốc                                                                   |
| 18  | `prepareExtraParams`              | Chuẩn hóa tham số request trước các wrapper tùy chọn stream chung                                              | Nhà cung cấp cần tham số request mặc định hoặc dọn dẹp tham số theo từng nhà cung cấp                                                         |
| 19  | `createStreamFn`                  | Thay thế hoàn toàn đường dẫn stream thông thường bằng transport tùy chỉnh                                      | Nhà cung cấp cần giao thức wire tùy chỉnh, không chỉ một wrapper                                                                              |
| 20  | `wrapStreamFn`                    | Wrapper stream sau khi các wrapper chung được áp dụng                                                          | Nhà cung cấp cần wrapper tương thích header/body/model của request mà không cần transport tùy chỉnh                                           |
| 21  | `resolveTransportTurnState`       | Gắn header hoặc metadata transport gốc theo từng lượt                                                          | Nhà cung cấp muốn transport chung gửi định danh lượt gốc của nhà cung cấp                                                                     |
| 22  | `resolveWebSocketSessionPolicy`   | Gắn header WebSocket gốc hoặc chính sách làm nguội phiên                                                       | Nhà cung cấp muốn transport WS chung tinh chỉnh header phiên hoặc chính sách dự phòng                                                         |
| 23  | `formatApiKey`                    | Bộ định dạng hồ sơ xác thực: hồ sơ đã lưu trở thành chuỗi `apiKey` runtime                                     | Nhà cung cấp lưu metadata xác thực bổ sung và cần hình dạng token runtime tùy chỉnh                                                           |
| 24  | `refreshOAuth`                    | Ghi đè làm mới OAuth cho endpoint làm mới tùy chỉnh hoặc chính sách lỗi làm mới                               | Nhà cung cấp không phù hợp với các bộ làm mới `pi-ai` dùng chung                                                                              |
| 25  | `buildAuthDoctorHint`             | Gợi ý sửa chữa được thêm khi làm mới OAuth thất bại                                                            | Nhà cung cấp cần hướng dẫn sửa xác thực do nhà cung cấp sở hữu sau lỗi làm mới                                                               |
| 26  | `matchesContextOverflowError`     | Bộ khớp tràn cửa sổ ngữ cảnh do nhà cung cấp sở hữu                                                            | Nhà cung cấp có lỗi tràn thô mà heuristic chung sẽ bỏ sót                                                                                     |
| 27  | `classifyFailoverReason`          | Phân loại lý do chuyển dự phòng do nhà cung cấp sở hữu                                                         | Nhà cung cấp có thể ánh xạ lỗi API/transport thô sang rate-limit/overload/v.v.                                                               |
| 28  | `isCacheTtlEligible`              | Chính sách prompt-cache cho nhà cung cấp proxy/backhaul                                                        | Nhà cung cấp cần cổng kiểm soát TTL cache riêng cho proxy                                                                                     |
| 29  | `buildMissingAuthMessage`         | Bản thay thế cho thông báo khôi phục thiếu xác thực chung                                                      | Nhà cung cấp cần gợi ý khôi phục thiếu xác thực riêng cho nhà cung cấp                                                                        |
| 30  | `augmentModelCatalog`             | Các hàng catalog tổng hợp/cuối cùng được thêm sau khi khám phá                                                 | Nhà cung cấp cần các hàng tương thích tiến về trước tổng hợp trong `models list` và bộ chọn                                                   |
| 31  | `resolveThinkingProfile`          | Bộ mức `/think` theo mô hình, nhãn hiển thị, và mặc định                                                       | Nhà cung cấp phơi bày thang thinking tùy chỉnh hoặc nhãn nhị phân cho các mô hình được chọn                                                   |
| 32  | `isBinaryThinking`                | Móc nối tương thích bật/tắt reasoning                                                                          | Nhà cung cấp chỉ phơi bày thinking nhị phân bật/tắt                                                                                           |
| 33  | `supportsXHighThinking`           | Móc nối tương thích hỗ trợ reasoning `xhigh`                                                                   | Nhà cung cấp chỉ muốn `xhigh` trên một tập con mô hình                                                                                        |
| 34  | `resolveDefaultThinkingLevel`     | Móc nối tương thích mức `/think` mặc định                                                                      | Nhà cung cấp sở hữu chính sách `/think` mặc định cho một họ mô hình                                                                           |
| 35  | `isModernModelRef`                | Bộ khớp mô hình hiện đại cho bộ lọc hồ sơ live và chọn smoke                                                   | Nhà cung cấp sở hữu việc khớp mô hình ưu tiên live/smoke                                                                                      |
| 36  | `prepareRuntimeAuth`              | Trao đổi credential đã cấu hình thành token/key runtime thực tế ngay trước inference                           | Nhà cung cấp cần trao đổi token hoặc credential request ngắn hạn                                                                              |
| 37  | `resolveUsageAuth`                | Phân giải thông tin xác thực sử dụng/thanh toán cho `/usage` và các bề mặt trạng thái liên quan                                     | Nhà cung cấp cần phân tích cú pháp token sử dụng/hạn mức tùy chỉnh hoặc một thông tin xác thực sử dụng khác                                                               |
| 38  | `fetchUsageSnapshot`              | Tìm nạp và chuẩn hóa các ảnh chụp nhanh sử dụng/hạn mức dành riêng cho nhà cung cấp sau khi xác thực được phân giải                             | Nhà cung cấp cần một endpoint sử dụng dành riêng cho nhà cung cấp hoặc trình phân tích cú pháp payload                                                                           |
| 39  | `createEmbeddingProvider`         | Xây dựng bộ điều hợp nhúng do nhà cung cấp sở hữu cho bộ nhớ/tìm kiếm                                                     | Hành vi nhúng bộ nhớ thuộc về plugin của nhà cung cấp                                                                                    |
| 40  | `buildReplayPolicy`               | Trả về một chính sách phát lại kiểm soát cách xử lý transcript cho nhà cung cấp                                        | Nhà cung cấp cần chính sách transcript tùy chỉnh (ví dụ: loại bỏ khối suy nghĩ)                                                               |
| 41  | `sanitizeReplayHistory`           | Viết lại lịch sử phát lại sau khi dọn dẹp transcript chung                                                        | Nhà cung cấp cần các lần viết lại phát lại dành riêng cho nhà cung cấp ngoài các trợ giúp compaction dùng chung                                                             |
| 42  | `validateReplayTurns`             | Xác thực hoặc định hình lại lượt phát lại lần cuối trước runner nhúng                                           | Transport của nhà cung cấp cần xác thực lượt nghiêm ngặt hơn sau khi làm sạch chung                                                                    |
| 43  | `onModelSelected`                 | Chạy các tác dụng phụ sau chọn do nhà cung cấp sở hữu                                                                 | Nhà cung cấp cần telemetry hoặc trạng thái do nhà cung cấp sở hữu khi một model trở nên hoạt động                                                                  |

`normalizeModelId`, `normalizeTransport`, và `normalizeConfig` trước tiên kiểm tra
Plugin nhà cung cấp đã khớp, rồi tiếp tục qua các Plugin nhà cung cấp khác có
khả năng hook cho đến khi một Plugin thực sự thay đổi id mô hình hoặc transport/config.
Điều đó giữ cho các shim nhà cung cấp alias/tương thích hoạt động mà không yêu cầu
caller biết Plugin đi kèm nào sở hữu thao tác rewrite. Nếu không có hook nhà cung cấp nào rewrite
một mục cấu hình thuộc họ Google được hỗ trợ, trình chuẩn hóa cấu hình Google đi kèm vẫn áp dụng
bước dọn dẹp tương thích đó.

Nếu nhà cung cấp cần một giao thức wire hoàn toàn tùy chỉnh hoặc executor yêu cầu tùy chỉnh,
đó là một lớp mở rộng khác. Các hook này dành cho hành vi nhà cung cấp
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

Các Plugin nhà cung cấp đi kèm kết hợp các hook ở trên để phù hợp với catalog,
auth, thinking, replay và nhu cầu usage của từng vendor. Tập hook có thẩm quyền nằm cùng
mỗi Plugin trong `extensions/`; trang này minh họa các hình dạng thay vì
sao chép danh sách.

<AccordionGroup>
  <Accordion title="Nhà cung cấp catalog truyền thẳng">
    OpenRouter, Kilocode, Z.AI, xAI đăng ký `catalog` cùng với
    `resolveDynamicModel` / `prepareDynamicModel` để có thể hiển thị các id mô hình upstream
    trước catalog tĩnh của OpenClaw.
  </Accordion>
  <Accordion title="Nhà cung cấp endpoint OAuth và usage">
    GitHub Copilot, Gemini CLI, ChatGPT Codex, MiniMax, Xiaomi, z.ai ghép
    `prepareRuntimeAuth` hoặc `formatApiKey` với `resolveUsageAuth` +
    `fetchUsageSnapshot` để sở hữu trao đổi token và tích hợp `/usage`.
  </Accordion>
  <Accordion title="Các họ dọn dẹp replay và transcript">
    Các họ được đặt tên dùng chung (`google-gemini`, `passthrough-gemini`,
    `anthropic-by-model`, `hybrid-anthropic-openai`) cho phép nhà cung cấp tham gia
    chính sách transcript qua `buildReplayPolicy` thay vì từng Plugin
    tự triển khai lại bước dọn dẹp.
  </Accordion>
  <Accordion title="Nhà cung cấp chỉ catalog">
    `byteplus`, `cloudflare-ai-gateway`, `huggingface`, `kimi-coding`, `nvidia`,
    `qianfan`, `synthetic`, `together`, `venice`, `vercel-ai-gateway`, và
    `volcengine` chỉ đăng ký `catalog` và chạy trên vòng lặp suy luận dùng chung.
  </Accordion>
  <Accordion title="Helper stream riêng cho Anthropic">
    Beta headers, `/fast` / `serviceTier`, và `context1m` nằm trong seam
    `api.ts` / `contract-api.ts` công khai của Plugin Anthropic
    (`wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`) thay vì trong
    SDK chung.
  </Accordion>
</AccordionGroup>

## Helper runtime

Plugin có thể truy cập các helper core được chọn qua `api.runtime`. Với TTS:

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

- `textToSpeech` trả về payload đầu ra TTS core thông thường cho các bề mặt file/voice-note.
- Sử dụng cấu hình `messages.tts` của core và lựa chọn nhà cung cấp.
- Trả về buffer âm thanh PCM + sample rate. Plugin phải resample/encode cho nhà cung cấp.
- `listVoices` là tùy chọn theo từng nhà cung cấp. Dùng nó cho bộ chọn giọng nói hoặc luồng thiết lập do vendor sở hữu.
- Danh sách giọng nói có thể bao gồm metadata phong phú hơn như locale, gender và thẻ personality cho các bộ chọn nhận biết nhà cung cấp.
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

- Giữ chính sách TTS, fallback và chuyển phát phản hồi trong core.
- Dùng nhà cung cấp speech cho hành vi tổng hợp do vendor sở hữu.
- Đầu vào Microsoft `edge` kế thừa được chuẩn hóa thành id nhà cung cấp `microsoft`.
- Mô hình sở hữu được ưu tiên là theo công ty: một Plugin vendor có thể sở hữu
  nhà cung cấp text, speech, image và media trong tương lai khi OpenClaw thêm các
  hợp đồng capability đó.

Đối với hiểu image/audio/video, Plugin đăng ký một nhà cung cấp
media-understanding có kiểu thay vì một túi key/value chung:

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

- Giữ orchestration, fallback, config và channel wiring trong core.
- Giữ hành vi vendor trong Plugin nhà cung cấp.
- Mở rộng bổ sung nên vẫn có kiểu: phương thức tùy chọn mới, trường kết quả tùy chọn mới,
  capability tùy chọn mới.
- Tạo video đã tuân theo cùng mẫu:
  - core sở hữu hợp đồng capability và helper runtime
  - Plugin vendor đăng ký `api.registerVideoGenerationProvider(...)`
  - Plugin tính năng/channel tiêu thụ `api.runtime.videoGeneration.*`

Với các helper runtime media-understanding, Plugin có thể gọi:

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

Đối với phiên âm âm thanh, Plugin có thể dùng runtime media-understanding
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
  hiểu image/audio/video.
- `extractStructuredWithModel(...)` là seam hướng tới Plugin cho trích xuất giới hạn,
  do nhà cung cấp sở hữu, ưu tiên image. Bao gồm ít nhất một đầu vào image;
  đầu vào text là ngữ cảnh bổ sung.
  Plugin sản phẩm sở hữu route và schema của chúng trong khi OpenClaw sở hữu
  ranh giới provider/runtime.
- Sử dụng cấu hình âm thanh media-understanding của core (`tools.media.audio`) và thứ tự fallback nhà cung cấp.
- Trả về `{ text: undefined }` khi không tạo ra đầu ra phiên âm nào (ví dụ đầu vào bị bỏ qua/không hỗ trợ).
- `api.runtime.stt.transcribeAudioFile(...)` vẫn là alias tương thích.

Plugin cũng có thể khởi chạy các lần chạy subagent nền qua `api.runtime.subagent`:

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

- `provider` và `model` là các override tùy chọn cho từng lần chạy, không phải thay đổi session bền vững.
- OpenClaw chỉ tôn trọng các trường override đó cho caller đáng tin cậy.
- Với các lần chạy fallback do Plugin sở hữu, operator phải bật bằng `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Dùng `plugins.entries.<id>.subagent.allowedModels` để giới hạn Plugin đáng tin cậy vào các mục tiêu `provider/model` canonical cụ thể, hoặc `"*"` để cho phép rõ ràng bất kỳ mục tiêu nào.
- Các lần chạy subagent của Plugin không đáng tin cậy vẫn hoạt động, nhưng yêu cầu override bị từ chối thay vì âm thầm fallback.
- Các session subagent do Plugin tạo được gắn thẻ bằng id Plugin tạo ra chúng. Fallback `api.runtime.subagent.deleteSession(...)` chỉ có thể xóa các session được sở hữu đó; xóa session tùy ý vẫn cần yêu cầu Gateway có phạm vi admin.

Đối với tìm kiếm web, Plugin có thể tiêu thụ helper runtime dùng chung thay vì
truy cập vào agent tool wiring:

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

Plugin cũng có thể đăng ký nhà cung cấp web-search qua
`api.registerWebSearchProvider(...)`.

Ghi chú:

- Giữ lựa chọn nhà cung cấp, phân giải credential và ngữ nghĩa yêu cầu dùng chung trong core.
- Dùng nhà cung cấp web-search cho transport tìm kiếm riêng theo vendor.
- `api.runtime.webSearch.*` là bề mặt dùng chung được ưu tiên cho Plugin tính năng/channel cần hành vi tìm kiếm mà không phụ thuộc vào agent tool wrapper.

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

- `generate(...)`: tạo image bằng chuỗi nhà cung cấp image-generation đã cấu hình.
- `listProviders(...)`: liệt kê các nhà cung cấp image-generation có sẵn và capability của họ.

## Route HTTP Gateway

Plugin có thể hiển thị endpoint HTTP bằng `api.registerHttpRoute(...)`.

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

- `path`: đường dẫn route dưới máy chủ HTTP gateway.
- `auth`: bắt buộc. Dùng `"gateway"` để yêu cầu auth Gateway thông thường, hoặc `"plugin"` cho xác minh auth/webhook do Plugin quản lý.
- `match`: tùy chọn. `"exact"` (mặc định) hoặc `"prefix"`.
- `replaceExisting`: tùy chọn. Cho phép cùng một Plugin thay thế đăng ký route hiện có của chính nó.
- `handler`: trả về `true` khi route đã xử lý yêu cầu.

Ghi chú:

- `api.registerHttpHandler(...)` đã bị gỡ bỏ và sẽ gây lỗi tải Plugin. Thay vào đó hãy dùng `api.registerHttpRoute(...)`.
- Các tuyến Plugin phải khai báo `auth` một cách tường minh.
- Các xung đột chính xác `path + match` bị từ chối trừ khi có `replaceExisting: true`, và một Plugin không thể thay thế tuyến của Plugin khác.
- Các tuyến chồng lấn với các mức `auth` khác nhau bị từ chối. Chỉ giữ các chuỗi chuyển tiếp `exact`/`prefix` trên cùng một mức auth.
- Các tuyến `auth: "plugin"` **không** tự động nhận phạm vi runtime của operator. Chúng dành cho Webhook do Plugin quản lý/xác minh chữ ký, không phải các lệnh gọi trợ giúp Gateway có đặc quyền.
- Các tuyến `auth: "gateway"` chạy bên trong phạm vi runtime yêu cầu Gateway, nhưng phạm vi đó được cố ý giữ thận trọng:
  - xác thực bearer bằng shared-secret (`gateway.auth.mode = "token"` / `"password"`) giữ phạm vi runtime của tuyến Plugin cố định ở `operator.write`, ngay cả khi bên gọi gửi `x-openclaw-scopes`
  - các chế độ HTTP mang danh tính đáng tin cậy (ví dụ `trusted-proxy` hoặc `gateway.auth.mode = "none"` trên ingress riêng tư) chỉ tôn trọng `x-openclaw-scopes` khi header được hiện diện tường minh
  - nếu thiếu `x-openclaw-scopes` trên các yêu cầu tuyến Plugin mang danh tính đó, phạm vi runtime quay về `operator.write`
- Quy tắc thực tế: đừng giả định một tuyến Plugin được xác thực bằng gateway là bề mặt quản trị ngầm định. Nếu tuyến của bạn cần hành vi chỉ dành cho quản trị viên, hãy yêu cầu chế độ auth mang danh tính và ghi rõ hợp đồng header `x-openclaw-scopes` tường minh trong tài liệu.

## Đường dẫn import Plugin SDK

Hãy dùng các subpath SDK hẹp thay vì barrel gốc nguyên khối `openclaw/plugin-sdk`
khi viết Plugin mới. Các subpath cốt lõi:

| Subpath                             | Mục đích                                           |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | Nguyên hàm đăng ký Plugin                          |
| `openclaw/plugin-sdk/channel-core`  | Trợ giúp nhập/xây dựng kênh                        |
| `openclaw/plugin-sdk/core`          | Trợ giúp dùng chung tổng quát và hợp đồng bao quát |
| `openclaw/plugin-sdk/config-schema` | Lược đồ Zod gốc `openclaw.json` (`OpenClawSchema`) |

Các Plugin kênh chọn từ một nhóm các seam hẹp — `channel-setup`,
`setup-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-lifecycle`,
`channel-reply-pipeline`, `command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets`, và `channel-actions`. Hành vi phê duyệt nên hợp nhất
trên một hợp đồng `approvalCapability` thay vì trộn lẫn giữa các trường
Plugin không liên quan. Xem [Plugin kênh](/vi/plugins/sdk-channel-plugins).

Các trợ giúp runtime và cấu hình nằm dưới các subpath `*-runtime` tập trung
tương ứng (`approval-runtime`, `agent-runtime`, `lazy-runtime`, `directory-runtime`,
`text-runtime`, `runtime-store`, `system-event-runtime`, `heartbeat-runtime`,
`channel-activity-runtime`, v.v.). Ưu tiên `config-contracts`,
`plugin-config-runtime`, `runtime-config-snapshot`, và `config-mutation`
thay vì barrel tương thích `config-runtime` rộng.

<Info>
`openclaw/plugin-sdk/channel-runtime`, `openclaw/plugin-sdk/config-runtime`,
và `openclaw/plugin-sdk/infra-runtime` là các shim tương thích đã không còn được khuyến nghị cho
các Plugin cũ. Mã mới nên import các nguyên hàm tổng quát hẹp hơn.
</Info>

Điểm nhập nội bộ repo (theo root gói Plugin được đóng gói kèm):

- `index.js` — điểm nhập Plugin được đóng gói kèm
- `api.js` — barrel trợ giúp/kiểu
- `runtime-api.js` — barrel chỉ dành cho runtime
- `setup-entry.js` — điểm nhập Plugin thiết lập

Các Plugin bên ngoài chỉ nên import các subpath `openclaw/plugin-sdk/*`. Không bao giờ
import `src/*` của gói Plugin khác từ core hoặc từ Plugin khác.
Các điểm nhập được tải qua facade ưu tiên snapshot cấu hình runtime đang hoạt động khi có,
sau đó mới quay về tệp cấu hình đã phân giải trên đĩa.

Các subpath theo capability như `image-generation`, `media-understanding`,
và `speech` tồn tại vì các Plugin được đóng gói kèm hiện đang dùng chúng. Chúng không phải
là các hợp đồng bên ngoài tự động đóng băng dài hạn — hãy kiểm tra trang tham chiếu SDK
liên quan khi phụ thuộc vào chúng.

## Lược đồ công cụ tin nhắn

Plugin nên sở hữu các đóng góp lược đồ `describeMessageTool(...)` riêng theo kênh
cho các nguyên hàm không phải tin nhắn như reaction, lượt đọc, và cuộc thăm dò.
Phần trình bày gửi dùng chung nên sử dụng hợp đồng `MessagePresentation` tổng quát
thay vì các trường nút, component, block, hoặc card gốc của nhà cung cấp.
Xem [Trình bày tin nhắn](/vi/plugins/message-presentation) để biết hợp đồng,
quy tắc fallback, ánh xạ nhà cung cấp, và danh sách kiểm tra cho tác giả Plugin.

Các Plugin có khả năng gửi khai báo những gì chúng có thể render thông qua capability tin nhắn:

- `presentation` cho các block trình bày ngữ nghĩa (`text`, `context`, `divider`, `buttons`, `select`)
- `delivery-pin` cho các yêu cầu ghim gửi

Core quyết định render phần trình bày theo cách gốc hay hạ cấp thành văn bản.
Không để lộ các lối thoát UI gốc của nhà cung cấp từ công cụ tin nhắn tổng quát.
Các trợ giúp SDK không còn được khuyến nghị cho lược đồ gốc cũ vẫn được export cho các
Plugin bên thứ ba hiện có, nhưng Plugin mới không nên dùng chúng.

## Phân giải mục tiêu kênh

Plugin kênh nên sở hữu ngữ nghĩa mục tiêu riêng theo kênh. Giữ host outbound dùng chung
ở mức tổng quát và sử dụng bề mặt adapter nhắn tin cho các quy tắc nhà cung cấp:

- `messaging.inferTargetChatType({ to })` quyết định liệu mục tiêu đã chuẩn hóa
  nên được xử lý là `direct`, `group`, hay `channel` trước khi tra cứu thư mục.
- `messaging.targetResolver.looksLikeId(raw, normalized)` cho core biết liệu một
  đầu vào có nên bỏ qua để đi thẳng đến phân giải dạng id thay vì tìm kiếm thư mục.
- `messaging.targetResolver.resolveTarget(...)` là fallback của Plugin khi
  core cần phân giải cuối cùng do nhà cung cấp sở hữu sau khi chuẩn hóa hoặc sau một
  lần trượt thư mục.
- `messaging.resolveOutboundSessionRoute(...)` sở hữu việc xây dựng tuyến phiên
  riêng theo nhà cung cấp sau khi mục tiêu được phân giải.

Cách tách được khuyến nghị:

- Dùng `inferTargetChatType` cho các quyết định phân loại nên xảy ra trước khi
  tìm kiếm peer/nhóm.
- Dùng `looksLikeId` cho các kiểm tra "xử lý đây là id mục tiêu tường minh/gốc".
- Dùng `resolveTarget` cho fallback chuẩn hóa riêng theo nhà cung cấp, không phải cho
  tìm kiếm thư mục rộng.
- Giữ các id gốc của nhà cung cấp như id chat, id thread, JID, handle, và id phòng
  bên trong giá trị `target` hoặc tham số riêng theo nhà cung cấp, không đặt trong
  các trường SDK tổng quát.

## Thư mục dựa trên cấu hình

Các Plugin suy ra mục nhập thư mục từ cấu hình nên giữ logic đó trong
Plugin và tái sử dụng các trợ giúp dùng chung từ
`openclaw/plugin-sdk/directory-runtime`.

Dùng cách này khi một kênh cần peer/nhóm dựa trên cấu hình như:

- peer DM dựa trên allowlist
- bản đồ kênh/nhóm đã cấu hình
- fallback thư mục tĩnh theo phạm vi tài khoản

Các trợ giúp dùng chung trong `directory-runtime` chỉ xử lý các thao tác tổng quát:

- lọc truy vấn
- áp dụng giới hạn
- trợ giúp khử trùng lặp/chuẩn hóa
- xây dựng `ChannelDirectoryEntry[]`

Việc kiểm tra tài khoản và chuẩn hóa id riêng theo kênh nên nằm trong
phần triển khai Plugin.

## Catalog nhà cung cấp

Plugin nhà cung cấp có thể định nghĩa catalog mô hình cho inference bằng
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` trả về cùng dạng mà OpenClaw ghi vào
`models.providers`:

- `{ provider }` cho một mục nhập nhà cung cấp
- `{ providers }` cho nhiều mục nhập nhà cung cấp

Dùng `catalog` khi Plugin sở hữu id mô hình riêng theo nhà cung cấp, mặc định URL cơ sở,
hoặc metadata mô hình bị kiểm soát bởi auth.

`catalog.order` kiểm soát thời điểm catalog của Plugin được hợp nhất tương đối với các
nhà cung cấp ngầm định tích hợp sẵn của OpenClaw:

- `simple`: nhà cung cấp dùng API key đơn giản hoặc điều khiển bằng env
- `profile`: nhà cung cấp xuất hiện khi có hồ sơ auth
- `paired`: nhà cung cấp tổng hợp nhiều mục nhập nhà cung cấp có liên quan
- `late`: lượt cuối, sau các nhà cung cấp ngầm định khác

Nhà cung cấp xuất hiện sau sẽ thắng khi trùng key, vì vậy Plugin có thể cố ý ghi đè một
mục nhập nhà cung cấp tích hợp sẵn có cùng id nhà cung cấp.

Plugin cũng có thể công bố các hàng mô hình chỉ đọc thông qua
`api.registerModelCatalogProvider({ provider, kinds, staticCatalog, liveCatalog
})`. Đây là hướng đi mới cho các bề mặt danh sách/trợ giúp/bộ chọn và hỗ trợ các hàng
`text`, `image_generation`, `video_generation`, và `music_generation`.
Plugin nhà cung cấp vẫn sở hữu các lệnh gọi endpoint trực tiếp, trao đổi token, và ánh xạ
phản hồi vendor; core sở hữu dạng hàng chung, nhãn nguồn, và định dạng trợ giúp công cụ media.
Các đăng ký nhà cung cấp tạo media tự động tổng hợp các hàng catalog tĩnh
từ `defaultModel`, `models`, và `capabilities`.

Tương thích:

- `discovery` vẫn hoạt động như alias cũ, nhưng phát cảnh báo không còn được khuyến nghị
- nếu cả `catalog` và `discovery` đều được đăng ký, OpenClaw dùng `catalog`
- `augmentModelCatalog` không còn được khuyến nghị; các nhà cung cấp được đóng gói kèm nên công bố
  hàng bổ sung thông qua `registerModelCatalogProvider`

## Kiểm tra kênh chỉ đọc

Nếu Plugin của bạn đăng ký một kênh, hãy ưu tiên triển khai
`plugin.config.inspectAccount(cfg, accountId)` cùng với `resolveAccount(...)`.

Lý do:

- `resolveAccount(...)` là đường dẫn runtime. Nó được phép giả định thông tin xác thực
  đã được hiện thực hóa đầy đủ và có thể fail fast khi thiếu secret bắt buộc.
- Các đường dẫn lệnh chỉ đọc như `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve`, và các luồng sửa
  doctor/cấu hình không nên phải hiện thực hóa thông tin xác thực runtime chỉ để
  mô tả cấu hình.

Hành vi `inspectAccount(...)` được khuyến nghị:

- Chỉ trả về trạng thái tài khoản mang tính mô tả.
- Giữ nguyên `enabled` và `configured`.
- Bao gồm các trường nguồn/trạng thái thông tin xác thực khi liên quan, như:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Bạn không cần trả về giá trị token thô chỉ để báo cáo khả dụng chỉ đọc.
  Trả về `tokenStatus: "available"` (và trường nguồn tương ứng) là đủ cho các lệnh kiểu trạng thái.
- Dùng `configured_unavailable` khi một thông tin xác thực được cấu hình qua SecretRef nhưng
  không khả dụng trong đường dẫn lệnh hiện tại.

Điều này cho phép các lệnh chỉ đọc báo cáo "đã cấu hình nhưng không khả dụng trong đường dẫn lệnh này"
thay vì crash hoặc báo cáo sai rằng tài khoản chưa được cấu hình.

## Gói package

Một thư mục Plugin có thể bao gồm `package.json` với `openclaw.extensions`:

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"],
    "setupEntry": "./src/setup-entry.ts"
  }
}
```

Mỗi mục nhập trở thành một Plugin. Nếu gói liệt kê nhiều extension, id Plugin
trở thành `name/<fileBase>`.

Nếu Plugin của bạn import dependency npm, hãy cài chúng trong thư mục đó để
`node_modules` có sẵn (`npm install` / `pnpm install`).

Rào chắn bảo mật: mọi mục nhập `openclaw.extensions` phải ở bên trong thư mục Plugin
sau khi phân giải symlink. Các mục nhập thoát khỏi thư mục gói sẽ bị từ chối.

Ghi chú bảo mật: `openclaw plugins install` cài dependency Plugin bằng
`npm install --omit=dev --ignore-scripts` cục bộ theo dự án (không có lifecycle script,
không có dependency dev ở runtime), bỏ qua các thiết lập cài npm toàn cục được kế thừa.
Giữ cây dependency Plugin "thuần JS/TS" và tránh các gói yêu cầu
bản dựng `postinstall`.

Tùy chọn: `openclaw.setupEntry` có thể trỏ tới một module nhẹ chỉ dành cho thiết lập.
Khi OpenClaw cần các bề mặt thiết lập cho một Plugin kênh đã bị tắt, hoặc
khi một Plugin kênh được bật nhưng vẫn chưa cấu hình, nó tải `setupEntry`
thay vì điểm nhập Plugin đầy đủ. Điều này giúp khởi động và thiết lập nhẹ hơn
khi điểm nhập Plugin chính của bạn cũng nối dây công cụ, hook, hoặc mã khác
chỉ dành cho runtime.

Tùy chọn: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
có thể cho một Plugin kênh tham gia cùng đường dẫn `setupEntry` trong giai đoạn
khởi động trước khi listen của gateway, ngay cả khi kênh đã được cấu hình.

Chỉ dùng điều này khi `setupEntry` bao phủ đầy đủ bề mặt khởi động bắt buộc phải tồn tại
trước khi Gateway bắt đầu lắng nghe. Trên thực tế, điều đó có nghĩa là entry thiết lập
phải đăng ký mọi capability do kênh sở hữu mà quá trình khởi động phụ thuộc vào, chẳng hạn như:

- bản thân việc đăng ký kênh
- mọi tuyến HTTP phải sẵn sàng trước khi Gateway bắt đầu lắng nghe
- mọi phương thức, công cụ hoặc dịch vụ Gateway phải tồn tại trong cùng khoảng thời gian đó

Nếu entry đầy đủ của bạn vẫn sở hữu bất kỳ capability khởi động bắt buộc nào, đừng bật
cờ này. Giữ Plugin theo hành vi mặc định và để OpenClaw tải
entry đầy đủ trong khi khởi động.

Các kênh đi kèm cũng có thể xuất bản các helper bề mặt hợp đồng chỉ dành cho thiết lập mà lõi
có thể tham chiếu trước khi runtime kênh đầy đủ được tải. Bề mặt thăng cấp thiết lập
hiện tại là:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Lõi dùng bề mặt đó khi cần thăng cấp một cấu hình kênh một tài khoản kiểu cũ
vào `channels.<id>.accounts.*` mà không tải entry Plugin đầy đủ.
Matrix là ví dụ đi kèm hiện tại: nó chỉ chuyển các khóa xác thực/khởi tạo vào một
tài khoản được thăng cấp có tên khi các tài khoản có tên đã tồn tại, và nó có thể giữ lại
một khóa tài khoản mặc định không chuẩn hóa đã cấu hình thay vì luôn tạo
`accounts.default`.

Các adapter bản vá thiết lập đó giữ cho việc khám phá bề mặt hợp đồng đi kèm ở chế độ lazy.
Thời gian import vẫn nhẹ; bề mặt thăng cấp chỉ được tải trong lần dùng đầu tiên thay vì
vào lại khởi động kênh đi kèm khi import module.

Khi các bề mặt khởi động đó bao gồm phương thức RPC của Gateway, hãy giữ chúng trên một
tiền tố riêng cho Plugin. Các namespace quản trị lõi (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) vẫn được giữ riêng và luôn phân giải
thành `operator.admin`, ngay cả khi một Plugin yêu cầu phạm vi hẹp hơn.

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

Plugin kênh có thể quảng bá siêu dữ liệu thiết lập/khám phá qua `openclaw.channel` và
gợi ý cài đặt qua `openclaw.install`. Điều này giữ cho danh mục lõi không chứa dữ liệu.

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
- `preferOver`: các id Plugin/kênh có độ ưu tiên thấp hơn mà entry danh mục này nên xếp trên
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: các điều khiển nội dung cho bề mặt chọn lựa
- `markdownCapable`: đánh dấu kênh là có khả năng markdown cho các quyết định định dạng gửi ra
- `exposure.configured`: ẩn kênh khỏi các bề mặt liệt kê kênh đã cấu hình khi đặt thành `false`
- `exposure.setup`: ẩn kênh khỏi các bộ chọn thiết lập/cấu hình tương tác khi đặt thành `false`
- `exposure.docs`: đánh dấu kênh là nội bộ/riêng tư cho các bề mặt điều hướng tài liệu
- `showConfigured` / `showInSetup`: các bí danh cũ vẫn được chấp nhận để tương thích; ưu tiên `exposure`
- `quickstartAllowFrom`: đưa kênh vào luồng quickstart `allowFrom` tiêu chuẩn
- `forceAccountBinding`: yêu cầu liên kết tài khoản rõ ràng ngay cả khi chỉ tồn tại một tài khoản
- `preferSessionLookupForAnnounceTarget`: ưu tiên tra cứu phiên khi phân giải đích thông báo

OpenClaw cũng có thể hợp nhất **các danh mục kênh bên ngoài** (ví dụ: bản xuất registry
MPM). Đặt một tệp JSON tại một trong các vị trí sau:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Hoặc trỏ `OPENCLAW_PLUGIN_CATALOG_PATHS` (hoặc `OPENCLAW_MPM_CATALOG_PATHS`) đến
một hoặc nhiều tệp JSON (được phân tách bằng dấu phẩy/dấu chấm phẩy/`PATH`). Mỗi tệp nên
chứa `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. Bộ phân tích cũng chấp nhận `"packages"` hoặc `"plugins"` làm bí danh cũ cho khóa `"entries"`.

Các entry danh mục kênh được tạo và entry danh mục cài đặt provider phơi bày
các thông tin nguồn cài đặt đã chuẩn hóa bên cạnh khối `openclaw.install` thô. Các
thông tin đã chuẩn hóa xác định spec npm là phiên bản chính xác hay bộ chọn nổi,
siêu dữ liệu integrity kỳ vọng có hiện diện hay không, và đường dẫn nguồn cục bộ
cũng có sẵn hay không. Khi danh tính danh mục/gói đã biết, các thông tin đã chuẩn hóa
cảnh báo nếu tên gói npm đã phân tích lệch khỏi danh tính đó.
Chúng cũng cảnh báo khi `defaultChoice` không hợp lệ hoặc trỏ đến một nguồn
không có sẵn, và khi siêu dữ liệu integrity npm hiện diện mà không có nguồn npm hợp lệ.
Consumer nên xem `installSource` là một trường tùy chọn bổ sung để
các entry dựng thủ công và shim danh mục không phải tổng hợp nó.
Điều này cho phép onboarding và chẩn đoán giải thích trạng thái mặt phẳng nguồn mà không
import runtime Plugin.

Các entry npm bên ngoài chính thức nên ưu tiên một `npmSpec` chính xác cộng với
`expectedIntegrity`. Tên gói trần và dist-tag vẫn hoạt động để
tương thích, nhưng chúng hiển thị cảnh báo mặt phẳng nguồn để danh mục có thể tiến
tới các cài đặt được ghim và kiểm tra integrity mà không phá vỡ các Plugin hiện có.
Khi onboarding cài đặt từ một đường dẫn danh mục cục bộ, nó ghi lại một entry chỉ mục Plugin
Plugin được quản lý với `source: "path"` và một `sourcePath` tương đối với workspace
khi có thể. Đường dẫn tải vận hành tuyệt đối vẫn ở trong
`plugins.load.paths`; bản ghi cài đặt tránh nhân đôi các đường dẫn máy trạm cục bộ
vào cấu hình lâu dài. Điều này giữ cho các cài đặt phát triển cục bộ hiển thị với
chẩn đoán mặt phẳng nguồn mà không thêm bề mặt tiết lộ đường dẫn hệ thống tệp thô thứ hai.
Chỉ mục Plugin được lưu bền vững `plugins/installs.json` là nguồn sự thật về nguồn cài đặt
và có thể được làm mới mà không tải các module runtime Plugin.
Map `installRecords` của nó vẫn bền vững ngay cả khi manifest Plugin bị thiếu hoặc
không hợp lệ; mảng `plugins` của nó là một khung nhìn manifest có thể dựng lại.

## Plugin công cụ ngữ cảnh

Plugin công cụ ngữ cảnh sở hữu việc điều phối ngữ cảnh phiên cho ingest, lắp ráp
và Compaction. Đăng ký chúng từ Plugin của bạn bằng
`api.registerContextEngine(id, factory)`, rồi chọn công cụ đang hoạt động bằng
`plugins.slots.contextEngine`.

Dùng điều này khi Plugin của bạn cần thay thế hoặc mở rộng pipeline ngữ cảnh mặc định
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

Factory `ctx` phơi bày các giá trị tùy chọn `config`, `agentDir` và `workspaceDir`
để khởi tạo tại thời điểm xây dựng.

Nếu công cụ của bạn **không** sở hữu thuật toán Compaction, hãy giữ `compact()`
được triển khai và ủy quyền nó một cách rõ ràng:

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

## Thêm capability mới

Khi một Plugin cần hành vi không phù hợp với API hiện tại, đừng đi vòng
hệ thống Plugin bằng cách truy cập riêng tư vào bên trong. Hãy thêm capability còn thiếu.

Trình tự khuyến nghị:

1. định nghĩa hợp đồng lõi
   Quyết định hành vi dùng chung nào lõi nên sở hữu: chính sách, fallback, hợp nhất cấu hình,
   vòng đời, ngữ nghĩa hướng tới kênh, và hình dạng helper runtime.
2. thêm các bề mặt đăng ký/runtime Plugin có kiểu
   Mở rộng `OpenClawPluginApi` và/hoặc `api.runtime` với bề mặt capability có kiểu
   nhỏ nhất nhưng hữu ích.
3. nối lõi + consumer kênh/tính năng
   Các kênh và Plugin tính năng nên tiêu thụ capability mới thông qua lõi,
   không phải bằng cách import trực tiếp một implementation của vendor.
4. đăng ký implementation của vendor
   Sau đó Plugin vendor đăng ký backend của chúng với capability.
5. thêm độ phủ hợp đồng
   Thêm test để quyền sở hữu và hình dạng đăng ký luôn rõ ràng theo thời gian.

Đây là cách OpenClaw giữ lập trường rõ ràng mà không bị hardcode theo thế giới quan
của một provider. Xem [Sách hướng dẫn Capability](/vi/plugins/adding-capabilities)
để có checklist tệp cụ thể và ví dụ hoàn chỉnh.

### Checklist capability

Khi bạn thêm một capability mới, implementation thường nên chạm đồng thời các
bề mặt sau:

- kiểu hợp đồng lõi trong `src/<capability>/types.ts`
- runner/helper runtime lõi trong `src/<capability>/runtime.ts`
- bề mặt đăng ký API Plugin trong `src/plugins/types.ts`
- nối dây registry Plugin trong `src/plugins/registry.ts`
- phơi bày runtime Plugin trong `src/plugins/runtime/*` khi Plugin tính năng/kênh
  cần tiêu thụ nó
- helper capture/test trong `src/test-utils/plugin-registration.ts`
- assertion quyền sở hữu/hợp đồng trong `src/plugins/contracts/registry.ts`
- tài liệu operator/Plugin trong `docs/`

Nếu một trong những bề mặt đó bị thiếu, đó thường là dấu hiệu capability
chưa được tích hợp đầy đủ.

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

Mẫu test hợp đồng:

```ts
expect(findVideoGenerationProviderIdsForPlugin("openai")).toEqual(["openai"]);
```

Điều đó giữ quy tắc đơn giản:

- lõi sở hữu hợp đồng capability + điều phối
- Plugin vendor sở hữu implementation của vendor
- Plugin tính năng/kênh tiêu thụ helper runtime
- test hợp đồng giữ quyền sở hữu rõ ràng

## Liên quan

- [Kiến trúc Plugin](/vi/plugins/architecture) — mô hình và hình dạng capability công khai
- [Đường dẫn con Plugin SDK](/vi/plugins/sdk-subpaths)
- [Thiết lập Plugin SDK](/vi/plugins/sdk-setup)
- [Xây dựng Plugin](/vi/plugins/building-plugins)
