---
read_when:
    - Triển khai hook thời gian chạy của nhà cung cấp, vòng đời kênh hoặc các bộ gói
    - Gỡ lỗi thứ tự tải Plugin hoặc trạng thái registry
    - Thêm một khả năng Plugin mới hoặc Plugin công cụ ngữ cảnh
summary: 'Nội bộ kiến trúc Plugin: quy trình nạp, sổ đăng ký, điểm móc thời gian chạy, tuyến HTTP và bảng tham chiếu'
title: Nội bộ kiến trúc Plugin
x-i18n:
    generated_at: "2026-04-29T22:58:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 51020f00fd501c006a8e8e92f4daaeb65a9e211771f8f350d869017332b5da3b
    source_path: plugins/architecture-internals.md
    workflow: 16
---

Để biết mô hình năng lực công khai, hình dạng Plugin và hợp đồng sở hữu/thực thi, xem [Kiến trúc Plugin](/vi/plugins/architecture). Trang này là tài liệu tham chiếu cho cơ chế nội bộ: quy trình tải, registry, hook runtime, tuyến HTTP của Gateway, đường dẫn import và bảng schema.

## Quy trình tải

Khi khởi động, OpenClaw về cơ bản thực hiện như sau:

1. phát hiện các gốc Plugin ứng viên
2. đọc manifest bundle native hoặc tương thích và siêu dữ liệu package
3. từ chối các ứng viên không an toàn
4. chuẩn hóa cấu hình Plugin (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. quyết định trạng thái bật cho từng ứng viên
6. tải các module native đã bật: các module đi kèm đã build dùng bộ tải native;
   các Plugin native chưa build dùng jiti
7. gọi hook native `register(api)` và thu thập các đăng ký vào registry Plugin
8. cung cấp registry cho các lệnh/bề mặt runtime

<Note>
`activate` là bí danh kế thừa của `register` — bộ tải sẽ phân giải mục nào có mặt (`def.register ?? def.activate`) và gọi nó tại cùng thời điểm. Tất cả Plugin đi kèm đều dùng `register`; ưu tiên `register` cho Plugin mới.
</Note>

Các cổng an toàn diễn ra **trước** khi thực thi runtime. Ứng viên bị chặn
khi entry thoát khỏi gốc Plugin, đường dẫn có thể ghi bởi mọi người, hoặc quyền
sở hữu đường dẫn trông đáng ngờ đối với Plugin không đi kèm.

### Hành vi ưu tiên manifest

Manifest là nguồn sự thật của control plane. OpenClaw dùng nó để:

- định danh Plugin
- phát hiện kênh/skills/schema cấu hình hoặc năng lực bundle đã khai báo
- xác thực `plugins.entries.<id>.config`
- bổ sung nhãn/placeholder cho Control UI
- hiển thị siêu dữ liệu cài đặt/catalog
- giữ các descriptor kích hoạt và thiết lập rẻ mà không tải runtime Plugin

Đối với Plugin native, module runtime là phần data plane. Nó đăng ký
hành vi thực tế như hook, công cụ, lệnh hoặc luồng provider.

Các khối manifest tùy chọn `activation` và `setup` vẫn nằm trên control plane.
Chúng là descriptor chỉ có siêu dữ liệu cho lập kế hoạch kích hoạt và phát hiện thiết lập;
chúng không thay thế đăng ký runtime, `register(...)` hoặc `setupEntry`.
Các bên tiêu thụ kích hoạt trực tiếp đầu tiên hiện dùng gợi ý lệnh, kênh và provider trong manifest
để thu hẹp tải Plugin trước khi materialize registry rộng hơn:

- tải CLI thu hẹp xuống các Plugin sở hữu lệnh chính được yêu cầu
- phân giải thiết lập/Plugin kênh thu hẹp xuống các Plugin sở hữu
  id kênh được yêu cầu
- phân giải thiết lập/runtime provider tường minh thu hẹp xuống các Plugin sở hữu
  id provider được yêu cầu
- lập kế hoạch khởi động Gateway dùng `activation.onStartup` cho các import khởi động
  tường minh và opt-out khởi động; mọi Plugin nên khai báo nó khi OpenClaw
  chuyển khỏi các import khởi động ngầm định, trong khi Plugin không có siêu dữ liệu
  năng lực tĩnh và không có `activation.onStartup` vẫn dùng fallback sidecar
  khởi động ngầm định đã lỗi thời để tương thích

Bộ lập kế hoạch kích hoạt cung cấp cả API chỉ id cho caller hiện có và
API plan cho chẩn đoán mới. Các mục plan báo cáo lý do một Plugin được chọn,
tách gợi ý planner `activation.*` tường minh khỏi fallback sở hữu manifest
như `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` và hook. Việc tách lý do đó là ranh giới tương thích:
siêu dữ liệu Plugin hiện có vẫn hoạt động, trong khi mã mới có thể phát hiện gợi ý rộng
hoặc hành vi fallback mà không thay đổi ngữ nghĩa tải runtime.

Phát hiện thiết lập hiện ưu tiên các id do descriptor sở hữu như `setup.providers` và
`setup.cliBackends` để thu hẹp Plugin ứng viên trước khi fallback sang
`setup-api` cho các Plugin vẫn cần hook runtime tại thời điểm thiết lập. Danh sách
thiết lập provider dùng manifest `providerAuthChoices`, lựa chọn thiết lập
suy ra từ descriptor và siêu dữ liệu catalog cài đặt mà không tải runtime provider. `setup.requiresRuntime: false`
tường minh là điểm cắt chỉ descriptor; `requiresRuntime` bị bỏ qua
giữ fallback setup-api kế thừa để tương thích. Nếu có nhiều hơn
một Plugin được phát hiện claim cùng id provider thiết lập hoặc backend CLI
đã chuẩn hóa, lookup thiết lập sẽ từ chối owner mơ hồ thay vì dựa vào
thứ tự phát hiện. Khi runtime thiết lập thực thi, chẩn đoán registry báo cáo
độ lệch giữa `setup.providers` / `setup.cliBackends` và các provider hoặc backend CLI
được đăng ký bởi setup-api mà không chặn Plugin kế thừa.

### Ranh giới cache Plugin

OpenClaw không cache kết quả phát hiện Plugin hoặc dữ liệu registry manifest trực tiếp
sau các cửa sổ theo thời gian thực. Các cài đặt, chỉnh sửa manifest và thay đổi load-path
phải hiển thị ở lần đọc siêu dữ liệu tường minh tiếp theo hoặc lần rebuild snapshot tiếp theo.
Bộ phân tích cú pháp file manifest có thể giữ cache chữ ký file có giới hạn, được khóa bằng
đường dẫn manifest đã mở, inode, kích thước và timestamp; cache đó chỉ tránh
phân tích lại các byte không đổi và không được cache câu trả lời về phát hiện, registry, owner hoặc
policy.

Đường nhanh siêu dữ liệu an toàn là quyền sở hữu đối tượng tường minh, không phải cache ẩn.
Các đường nóng khi khởi động Gateway nên truyền `PluginMetadataSnapshot` hiện tại,
`PluginLookUpTable` suy ra, hoặc registry manifest tường minh qua chuỗi lời gọi.
Xác thực cấu hình, tự động bật khi khởi động, bootstrap Plugin và lựa chọn provider
có thể tái sử dụng các đối tượng đó khi chúng đại diện cho cấu hình và inventory Plugin
hiện tại. Lookup thiết lập vẫn tái tạo siêu dữ liệu manifest theo nhu cầu
trừ khi đường thiết lập cụ thể nhận được registry manifest tường minh; giữ điều đó
như fallback đường lạnh thay vì thêm cache lookup ẩn. Khi đầu vào
thay đổi, rebuild và thay thế snapshot thay vì mutate nó hoặc giữ
bản sao lịch sử.
Các view trên registry Plugin đang hoạt động và helper bootstrap kênh đi kèm
nên được tính lại từ registry/root hiện tại. Map tồn tại ngắn hạn thì được
bên trong một lời gọi để loại trùng công việc hoặc chặn reentry; chúng không được trở thành cache
siêu dữ liệu của tiến trình.

Đối với tải Plugin, lớp cache bền vững là tải runtime. Nó có thể tái sử dụng
trạng thái bộ tải khi mã hoặc artifact đã cài đặt thực sự được tải, chẳng hạn:

- `PluginLoaderCacheState` và registry runtime đang hoạt động tương thích
- cache jiti/module và cache bộ tải bề mặt công khai dùng để tránh import
  cùng một bề mặt runtime nhiều lần
- mirror dependency runtime và cache hệ thống file cho artifact Plugin
  đã cài đặt
- map theo từng lời gọi tồn tại ngắn hạn để chuẩn hóa đường dẫn hoặc phân giải bản trùng

Các cache đó là chi tiết triển khai data plane. Chúng không được trả lời
câu hỏi control-plane như "Plugin nào sở hữu provider này?" trừ khi
caller cố ý yêu cầu tải runtime.

Không thêm cache bền vững hoặc theo thời gian thực cho:

- kết quả phát hiện
- registry manifest trực tiếp
- registry manifest được tái tạo từ index Plugin đã cài đặt
- lookup owner provider, chặn model, policy provider hoặc siêu dữ liệu artifact công khai
- bất kỳ câu trả lời nào khác suy ra từ manifest mà manifest, index đã cài đặt
  hoặc load path đã thay đổi phải hiển thị ở lần đọc siêu dữ liệu tiếp theo

Các caller rebuild siêu dữ liệu manifest từ index Plugin đã cài đặt đã lưu
sẽ tái tạo registry đó theo nhu cầu. Index đã cài đặt là trạng thái source-plane
bền vững; nó không phải cache siêu dữ liệu ẩn trong tiến trình.

## Mô hình registry

Plugin đã tải không trực tiếp mutate các global core ngẫu nhiên. Chúng đăng ký vào
registry Plugin trung tâm.

Registry theo dõi:

- bản ghi Plugin (định danh, nguồn, origin, trạng thái, chẩn đoán)
- công cụ
- hook kế thừa và hook có kiểu
- kênh
- provider
- handler RPC Gateway
- tuyến HTTP
- registrar CLI
- dịch vụ nền
- lệnh do Plugin sở hữu

Sau đó các tính năng core đọc từ registry đó thay vì nói chuyện trực tiếp
với module Plugin. Điều này giữ quá trình tải một chiều:

- module Plugin -> đăng ký registry
- runtime core -> tiêu thụ registry

Sự tách biệt đó quan trọng cho khả năng bảo trì. Điều đó có nghĩa là hầu hết bề mặt core chỉ
cần một điểm tích hợp: "đọc registry", không phải "đặc cách từng module Plugin".

## Callback liên kết cuộc trò chuyện

Plugin liên kết một cuộc trò chuyện có thể phản ứng khi một phê duyệt được giải quyết.

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
- `binding`: binding đã phân giải cho yêu cầu được phê duyệt
- `request`: tóm tắt yêu cầu gốc, gợi ý detach, id người gửi và
  siêu dữ liệu cuộc trò chuyện

Callback này chỉ để thông báo. Nó không thay đổi ai được phép bind
một cuộc trò chuyện, và nó chạy sau khi xử lý phê duyệt core hoàn tất.

## Hook runtime provider

Plugin provider có ba lớp:

- **Siêu dữ liệu manifest** để lookup trước runtime với chi phí thấp:
  `setup.providers[].envVars`, tương thích đã lỗi thời `providerAuthEnvVars`,
  `providerAuthAliases`, `providerAuthChoices` và `channelEnvVars`.
- **Hook thời điểm cấu hình**: `catalog` (`discovery` kế thừa) cộng với
  `applyConfigDefaults`.
- **Hook runtime**: hơn 40 hook tùy chọn bao phủ auth, phân giải model,
  bọc stream, mức suy nghĩ, policy replay và endpoint usage. Xem
  danh sách đầy đủ trong [Thứ tự hook và cách dùng](#hook-order-and-usage).

OpenClaw vẫn sở hữu agent loop chung, failover, xử lý transcript và
policy công cụ. Các hook này là bề mặt mở rộng cho hành vi riêng theo provider
mà không cần toàn bộ transport suy luận tùy chỉnh.

Dùng manifest `setup.providers[].envVars` khi provider có thông tin xác thực dựa trên env
mà các đường auth/trạng thái/bộ chọn model chung cần thấy mà không
tải runtime Plugin. `providerAuthEnvVars` đã lỗi thời vẫn được đọc bởi
adapter tương thích trong cửa sổ ngừng hỗ trợ, và Plugin không đi kèm
dùng nó sẽ nhận chẩn đoán manifest. Dùng manifest `providerAuthAliases`
khi một id provider nên tái sử dụng env var, auth profile,
auth dựa trên cấu hình và lựa chọn onboarding API-key của id provider khác. Dùng manifest
`providerAuthChoices` khi các bề mặt CLI onboarding/lựa chọn auth cần biết
id lựa chọn, nhãn nhóm và dây nối auth một cờ đơn giản của provider mà không
tải runtime provider. Giữ `envVars` runtime provider cho các gợi ý hướng tới operator
như nhãn onboarding hoặc biến thiết lập OAuth
client-id/client-secret.

Dùng manifest `channelEnvVars` khi một kênh có auth hoặc thiết lập dựa trên env mà
fallback shell-env chung, kiểm tra cấu hình/trạng thái hoặc prompt thiết lập cần thấy
mà không tải runtime kênh.

### Thứ tự hook và cách dùng

Đối với Plugin model/provider, OpenClaw gọi hook theo thứ tự đại khái sau.
Cột "Khi nào dùng" là hướng dẫn quyết định nhanh.
Các trường provider chỉ để tương thích mà OpenClaw không còn gọi, như
`ProviderPlugin.capabilities` và `suppressBuiltInModel`, được cố ý không
liệt kê ở đây.

| #   | Hook                              | Chức năng                                                                                                   | Khi nào dùng                                                                                                                                   |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | Xuất bản cấu hình nhà cung cấp vào `models.providers` trong quá trình tạo `models.json`                                | Nhà cung cấp sở hữu một danh mục hoặc các giá trị mặc định của URL cơ sở                                                                                                  |
| 2   | `applyConfigDefaults`             | Áp dụng các giá trị mặc định cấu hình toàn cục do nhà cung cấp sở hữu trong quá trình vật liệu hóa cấu hình                                      | Giá trị mặc định phụ thuộc vào chế độ xác thực, env, hoặc ngữ nghĩa họ mô hình của nhà cung cấp                                                                         |
| --  | _(tra cứu mô hình tích hợp sẵn)_         | OpenClaw thử đường dẫn registry/danh mục thông thường trước                                                          | _(không phải hook Plugin)_                                                                                                                         |
| 3   | `normalizeModelId`                | Chuẩn hóa các bí danh model-id cũ hoặc bản xem trước trước khi tra cứu                                                     | Nhà cung cấp sở hữu việc dọn dẹp bí danh trước khi phân giải mô hình chuẩn                                                                                 |
| 4   | `normalizeTransport`              | Chuẩn hóa `api` / `baseUrl` của họ nhà cung cấp trước khi lắp ráp mô hình chung                                      | Nhà cung cấp sở hữu việc dọn dẹp transport cho các id nhà cung cấp tùy chỉnh trong cùng họ transport                                                          |
| 5   | `normalizeConfig`                 | Chuẩn hóa `models.providers.<id>` trước khi phân giải runtime/nhà cung cấp                                           | Nhà cung cấp cần dọn dẹp cấu hình thuộc về Plugin; các helper họ Google đi kèm cũng hỗ trợ dự phòng cho các mục cấu hình Google được hỗ trợ   |
| 6   | `applyNativeStreamingUsageCompat` | Áp dụng các bản viết lại tương thích usage streaming gốc cho các nhà cung cấp cấu hình                                               | Nhà cung cấp cần sửa metadata usage streaming gốc theo endpoint                                                                          |
| 7   | `resolveConfigApiKey`             | Phân giải xác thực bằng env-marker cho các nhà cung cấp cấu hình trước khi tải xác thực runtime                                       | Nhà cung cấp có cơ chế phân giải API-key env-marker do nhà cung cấp sở hữu; `amazon-bedrock` cũng có bộ phân giải env-marker AWS tích hợp sẵn tại đây                  |
| 8   | `resolveSyntheticAuth`            | Hiển thị xác thực cục bộ/tự lưu trữ hoặc được hỗ trợ bởi cấu hình mà không lưu plaintext                                   | Nhà cung cấp có thể vận hành với marker thông tin xác thực tổng hợp/cục bộ                                                                                 |
| 9   | `resolveExternalAuthProfiles`     | Phủ chồng các hồ sơ xác thực bên ngoài do nhà cung cấp sở hữu; `persistence` mặc định là `runtime-only` cho thông tin xác thực do CLI/app sở hữu | Nhà cung cấp tái sử dụng thông tin xác thực bên ngoài mà không lưu các refresh token đã sao chép; khai báo `contracts.externalAuthProviders` trong manifest |
| 10  | `shouldDeferSyntheticProfileAuth` | Hạ mức các placeholder hồ sơ tổng hợp đã lưu phía sau xác thực được hỗ trợ bởi env/cấu hình                                      | Nhà cung cấp lưu các hồ sơ placeholder tổng hợp không nên giành quyền ưu tiên                                                                 |
| 11  | `resolveDynamicModel`             | Dự phòng đồng bộ cho các id mô hình do nhà cung cấp sở hữu chưa có trong registry cục bộ                                       | Nhà cung cấp chấp nhận các id mô hình upstream tùy ý                                                                                                 |
| 12  | `prepareDynamicModel`             | Khởi động làm nóng bất đồng bộ, sau đó `resolveDynamicModel` chạy lại                                                           | Nhà cung cấp cần metadata mạng trước khi phân giải các id không xác định                                                                                  |
| 13  | `normalizeResolvedModel`          | Bản viết lại cuối cùng trước khi runner nhúng dùng mô hình đã phân giải                                               | Nhà cung cấp cần viết lại transport nhưng vẫn dùng một transport lõi                                                                             |
| 14  | `contributeResolvedModelCompat`   | Đóng góp các cờ tương thích cho mô hình vendor phía sau một transport tương thích khác                                  | Nhà cung cấp nhận diện mô hình của chính mình trên transport proxy mà không tiếp quản nhà cung cấp                                                       |
| 15  | `normalizeToolSchemas`            | Chuẩn hóa schema công cụ trước khi runner nhúng nhìn thấy chúng                                                    | Nhà cung cấp cần dọn dẹp schema theo họ transport                                                                                                |
| 16  | `inspectToolSchemas`              | Hiển thị chẩn đoán schema do nhà cung cấp sở hữu sau khi chuẩn hóa                                                  | Nhà cung cấp muốn cảnh báo từ khóa mà không dạy lõi các quy tắc riêng cho từng nhà cung cấp                                                                 |
| 17  | `resolveReasoningOutputMode`      | Chọn hợp đồng đầu ra reasoning gốc so với có gắn thẻ                                                              | Nhà cung cấp cần reasoning/đầu ra cuối cùng có gắn thẻ thay vì các trường gốc                                                                         |
| 18  | `prepareExtraParams`              | Chuẩn hóa tham số yêu cầu trước các wrapper tùy chọn stream chung                                              | Nhà cung cấp cần tham số yêu cầu mặc định hoặc dọn dẹp tham số theo từng nhà cung cấp                                                                           |
| 19  | `createStreamFn`                  | Thay thế hoàn toàn đường dẫn stream thông thường bằng một transport tùy chỉnh                                                   | Nhà cung cấp cần giao thức dây tùy chỉnh, không chỉ một wrapper                                                                                     |
| 20  | `wrapStreamFn`                    | Wrapper stream sau khi các wrapper chung được áp dụng                                                              | Nhà cung cấp cần wrapper tương thích header/body/model của yêu cầu mà không có transport tùy chỉnh                                                          |
| 21  | `resolveTransportTurnState`       | Gắn header hoặc metadata transport gốc theo từng lượt                                                           | Nhà cung cấp muốn các transport chung gửi định danh lượt gốc của nhà cung cấp                                                                       |
| 22  | `resolveWebSocketSessionPolicy`   | Gắn header WebSocket gốc hoặc chính sách hạ nhiệt phiên                                                    | Nhà cung cấp muốn các transport WS chung tinh chỉnh header phiên hoặc chính sách dự phòng                                                               |
| 23  | `formatApiKey`                    | Bộ định dạng hồ sơ xác thực: hồ sơ đã lưu trở thành chuỗi `apiKey` runtime                                     | Nhà cung cấp lưu metadata xác thực bổ sung và cần hình dạng token runtime tùy chỉnh                                                                    |
| 24  | `refreshOAuth`                    | Ghi đè làm mới OAuth cho endpoint làm mới tùy chỉnh hoặc chính sách lỗi làm mới                                  | Nhà cung cấp không phù hợp với các bộ làm mới `pi-ai` dùng chung                                                                                           |
| 25  | `buildAuthDoctorHint`             | Gợi ý sửa chữa được thêm vào khi làm mới OAuth thất bại                                                                  | Nhà cung cấp cần hướng dẫn sửa chữa xác thực do nhà cung cấp sở hữu sau lỗi làm mới                                                                      |
| 26  | `matchesContextOverflowError`     | Bộ khớp tràn cửa sổ ngữ cảnh do nhà cung cấp sở hữu                                                                 | Nhà cung cấp có lỗi tràn thô mà heuristic chung sẽ bỏ sót                                                                                |
| 27  | `classifyFailoverReason`          | Phân loại lý do failover do nhà cung cấp sở hữu                                                                  | Nhà cung cấp có thể ánh xạ lỗi API/transport thô sang giới hạn tốc độ/quá tải/v.v.                                                                          |
| 28  | `isCacheTtlEligible`              | Chính sách prompt-cache cho các nhà cung cấp proxy/backhaul                                                               | Nhà cung cấp cần chặn cache TTL riêng cho proxy                                                                                                |
| 29  | `buildMissingAuthMessage`         | Thay thế cho thông báo khôi phục thiếu xác thực chung                                                      | Nhà cung cấp cần gợi ý khôi phục thiếu xác thực riêng cho nhà cung cấp                                                                                 |
| 30  | `augmentModelCatalog`             | Các hàng danh mục tổng hợp/cuối cùng được thêm sau khi khám phá                                                          | Nhà cung cấp cần các hàng tương thích chuyển tiếp tổng hợp trong `models list` và các bộ chọn                                                                     |
| 31  | `resolveThinkingProfile`          | Bộ mức `/think` theo từng mô hình, nhãn hiển thị, và mặc định                                                 | Nhà cung cấp cung cấp một thang thinking tùy chỉnh hoặc nhãn nhị phân cho các mô hình đã chọn                                                                 |
| 32  | `isBinaryThinking`                | Hook tương thích bật/tắt reasoning                                                                     | Nhà cung cấp chỉ cung cấp bật/tắt thinking nhị phân                                                                                                  |
| 33  | `supportsXHighThinking`           | Hook tương thích hỗ trợ reasoning `xhigh`                                                                   | Nhà cung cấp muốn `xhigh` chỉ trên một tập con mô hình                                                                                             |
| 34  | `resolveDefaultThinkingLevel`     | Hook tương thích mức `/think` mặc định                                                                      | Nhà cung cấp sở hữu chính sách `/think` mặc định cho một họ mô hình                                                                                      |
| 35  | `isModernModelRef`                | Bộ khớp mô hình hiện đại cho bộ lọc hồ sơ live và lựa chọn smoke                                              | Nhà cung cấp sở hữu việc khớp mô hình ưu tiên cho live/smoke                                                                                             |
| 36  | `prepareRuntimeAuth`              | Trao đổi một thông tin xác thực đã cấu hình thành token/key runtime thực tế ngay trước inference                       | Nhà cung cấp cần trao đổi token hoặc thông tin xác thực yêu cầu ngắn hạn                                                                             |
| 37  | `resolveUsageAuth`                | Phân giải thông tin xác thực sử dụng/thanh toán cho `/usage` và các bề mặt trạng thái liên quan                                     | Nhà cung cấp cần phân tích token sử dụng/hạn mức tùy chỉnh hoặc thông tin xác thực sử dụng khác                                                               |
| 38  | `fetchUsageSnapshot`              | Tải và chuẩn hóa các ảnh chụp nhanh sử dụng/hạn mức dành riêng cho nhà cung cấp sau khi auth được phân giải                             | Nhà cung cấp cần một điểm cuối sử dụng hoặc trình phân tích payload dành riêng cho nhà cung cấp                                                                           |
| 39  | `createEmbeddingProvider`         | Xây dựng bộ điều hợp embedding do nhà cung cấp sở hữu cho bộ nhớ/tìm kiếm                                                     | Hành vi embedding bộ nhớ thuộc về Plugin của nhà cung cấp                                                                                    |
| 40  | `buildReplayPolicy`               | Trả về một chính sách phát lại kiểm soát cách xử lý transcript cho nhà cung cấp                                        | Nhà cung cấp cần chính sách transcript tùy chỉnh (ví dụ: loại bỏ khối suy nghĩ)                                                               |
| 41  | `sanitizeReplayHistory`           | Viết lại lịch sử phát lại sau bước dọn dẹp transcript chung                                                        | Nhà cung cấp cần các bản viết lại phát lại dành riêng cho nhà cung cấp ngoài các helper Compaction dùng chung                                                             |
| 42  | `validateReplayTurns`             | Xác thực hoặc định hình lại lượt phát lại cuối cùng trước trình chạy nhúng                                           | Lớp vận chuyển của nhà cung cấp cần xác thực lượt nghiêm ngặt hơn sau bước làm sạch chung                                                                    |
| 43  | `onModelSelected`                 | Chạy các tác dụng phụ sau lựa chọn do nhà cung cấp sở hữu                                                                 | Nhà cung cấp cần telemetry hoặc trạng thái do nhà cung cấp sở hữu khi một model trở nên active                                                                  |

`normalizeModelId`, `normalizeTransport` và `normalizeConfig` trước tiên kiểm tra Plugin nhà cung cấp đã khớp, rồi tiếp tục chuyển qua các Plugin nhà cung cấp khác có hỗ trợ hook cho đến khi một Plugin thực sự thay đổi id mô hình hoặc transport/config. Điều đó giữ cho các shim nhà cung cấp alias/compat hoạt động mà không yêu cầu bên gọi biết Plugin tích hợp nào sở hữu thao tác ghi lại. Nếu không có hook nhà cung cấp nào ghi lại một mục cấu hình thuộc họ Google được hỗ trợ, trình chuẩn hóa cấu hình Google tích hợp vẫn áp dụng bước dọn dẹp tương thích đó.

Nếu nhà cung cấp cần một giao thức truyền tải hoàn toàn tùy chỉnh hoặc trình thực thi yêu cầu tùy chỉnh, đó là một lớp mở rộng khác. Các hook này dành cho hành vi nhà cung cấp vẫn chạy trên vòng lặp suy luận thông thường của OpenClaw.

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

Các Plugin nhà cung cấp tích hợp kết hợp các hook ở trên để phù hợp với catalog, xác thực, suy nghĩ, phát lại và nhu cầu sử dụng của từng nhà cung cấp. Tập hook có thẩm quyền nằm cùng mỗi Plugin trong `extensions/`; trang này minh họa các hình dạng thay vì sao chép danh sách.

<AccordionGroup>
  <Accordion title="Nhà cung cấp catalog chuyển tiếp">
    OpenRouter, Kilocode, Z.AI, xAI đăng ký `catalog` cùng với
    `resolveDynamicModel` / `prepareDynamicModel` để chúng có thể hiển thị các
    id mô hình upstream trước catalog tĩnh của OpenClaw.
  </Accordion>
  <Accordion title="Nhà cung cấp endpoint OAuth và usage">
    GitHub Copilot, Gemini CLI, ChatGPT Codex, MiniMax, Xiaomi, z.ai ghép
    `prepareRuntimeAuth` hoặc `formatApiKey` với `resolveUsageAuth` +
    `fetchUsageSnapshot` để sở hữu trao đổi token và tích hợp `/usage`.
  </Accordion>
  <Accordion title="Nhóm dọn dẹp phát lại và bản ghi">
    Các nhóm được đặt tên dùng chung (`google-gemini`, `passthrough-gemini`,
    `anthropic-by-model`, `hybrid-anthropic-openai`) cho phép nhà cung cấp chọn
    áp dụng chính sách bản ghi thông qua `buildReplayPolicy` thay vì từng Plugin
    tự triển khai lại bước dọn dẹp.
  </Accordion>
  <Accordion title="Nhà cung cấp chỉ có catalog">
    `byteplus`, `cloudflare-ai-gateway`, `huggingface`, `kimi-coding`, `nvidia`,
    `qianfan`, `synthetic`, `together`, `venice`, `vercel-ai-gateway` và
    `volcengine` chỉ đăng ký `catalog` và dùng vòng lặp suy luận dùng chung.
  </Accordion>
  <Accordion title="Trình trợ giúp stream riêng cho Anthropic">
    Header beta, `/fast` / `serviceTier` và `context1m` nằm trong đường nối
    `api.ts` / `contract-api.ts` công khai của Plugin Anthropic
    (`wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`) thay vì trong
    SDK chung.
  </Accordion>
</AccordionGroup>

## Trình trợ giúp runtime

Plugin có thể truy cập một số trình trợ giúp lõi qua `api.runtime`. Với TTS:

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

- `textToSpeech` trả về payload đầu ra TTS lõi thông thường cho các bề mặt tệp/ghi chú thoại.
- Sử dụng cấu hình lõi `messages.tts` và lựa chọn nhà cung cấp.
- Trả về bộ đệm âm thanh PCM + tốc độ lấy mẫu. Plugin phải lấy mẫu lại/mã hóa cho nhà cung cấp.
- `listVoices` là tùy chọn theo từng nhà cung cấp. Dùng nó cho các bộ chọn giọng nói hoặc luồng thiết lập do nhà cung cấp sở hữu.
- Danh sách giọng nói có thể bao gồm metadata phong phú hơn như ngôn ngữ, giới tính và thẻ tính cách cho các bộ chọn nhận biết nhà cung cấp.
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

- Giữ chính sách TTS, fallback và phân phối trả lời trong lõi.
- Dùng nhà cung cấp giọng nói cho hành vi tổng hợp do nhà cung cấp sở hữu.
- Đầu vào Microsoft cũ `edge` được chuẩn hóa thành id nhà cung cấp `microsoft`.
- Mô hình sở hữu được ưu tiên là theo công ty: một Plugin nhà cung cấp có thể sở hữu nhà cung cấp văn bản, giọng nói, hình ảnh và phương tiện trong tương lai khi OpenClaw bổ sung các hợp đồng capability đó.

Để hiểu hình ảnh/âm thanh/video, Plugin đăng ký một nhà cung cấp media-understanding có kiểu thay vì một túi khóa/giá trị chung:

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

- Giữ điều phối, fallback, cấu hình và đấu nối kênh trong lõi.
- Giữ hành vi nhà cung cấp trong Plugin nhà cung cấp.
- Mở rộng bổ sung nên giữ có kiểu: phương thức tùy chọn mới, trường kết quả tùy chọn mới, capability tùy chọn mới.
- Tạo video đã theo cùng mẫu:
  - lõi sở hữu hợp đồng capability và trình trợ giúp runtime
  - Plugin nhà cung cấp đăng ký `api.registerVideoGenerationProvider(...)`
  - Plugin tính năng/kênh tiêu thụ `api.runtime.videoGeneration.*`

Với các trình trợ giúp runtime media-understanding, Plugin có thể gọi:

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

Để phiên âm âm thanh, Plugin có thể dùng runtime media-understanding hoặc alias STT cũ hơn:

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // Optional when MIME cannot be inferred reliably:
  mime: "audio/ogg",
});
```

Ghi chú:

- `api.runtime.mediaUnderstanding.*` là bề mặt dùng chung được ưu tiên cho việc hiểu hình ảnh/âm thanh/video.
- Sử dụng cấu hình âm thanh media-understanding của lõi (`tools.media.audio`) và thứ tự fallback nhà cung cấp.
- Trả về `{ text: undefined }` khi không tạo ra đầu ra phiên âm nào (ví dụ đầu vào bị bỏ qua/không được hỗ trợ).
- `api.runtime.stt.transcribeAudioFile(...)` vẫn là alias tương thích.

Plugin cũng có thể khởi chạy các lần chạy subagent nền thông qua `api.runtime.subagent`:

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

- `provider` và `model` là các ghi đè tùy chọn theo từng lần chạy, không phải thay đổi phiên lâu dài.
- OpenClaw chỉ tôn trọng các trường ghi đè đó cho bên gọi đáng tin cậy.
- Với các lần chạy fallback do Plugin sở hữu, operator phải chọn tham gia bằng `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Dùng `plugins.entries.<id>.subagent.allowedModels` để giới hạn Plugin đáng tin cậy vào các đích `provider/model` chuẩn cụ thể, hoặc `"*"` để cho phép rõ ràng mọi đích.
- Các lần chạy subagent của Plugin không đáng tin cậy vẫn hoạt động, nhưng yêu cầu ghi đè bị từ chối thay vì âm thầm fallback.
- Các phiên subagent do Plugin tạo được gắn thẻ bằng id Plugin tạo ra. Fallback `api.runtime.subagent.deleteSession(...)` chỉ có thể xóa các phiên được sở hữu đó; xóa phiên tùy ý vẫn cần một yêu cầu Gateway có phạm vi admin.

Với tìm kiếm web, Plugin có thể tiêu thụ trình trợ giúp runtime dùng chung thay vì đi vào phần đấu nối công cụ agent:

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
- Dùng nhà cung cấp tìm kiếm web cho các transport tìm kiếm riêng theo nhà cung cấp.
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
- `listProviders(...)`: liệt kê các nhà cung cấp tạo hình ảnh có sẵn và capability của họ.

## Tuyến HTTP của Gateway

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

- `path`: đường dẫn tuyến trong máy chủ HTTP của gateway.
- `auth`: bắt buộc. Dùng `"gateway"` để yêu cầu xác thực gateway thông thường, hoặc `"plugin"` cho xác thực/xác minh Webhook do Plugin quản lý.
- `match`: tùy chọn. `"exact"` (mặc định) hoặc `"prefix"`.
- `replaceExisting`: tùy chọn. Cho phép cùng Plugin thay thế đăng ký tuyến hiện có của chính nó.
- `handler`: trả về `true` khi tuyến đã xử lý yêu cầu.

Ghi chú:

- `api.registerHttpHandler(...)` đã bị gỡ bỏ và sẽ gây lỗi tải Plugin. Thay vào đó, hãy dùng `api.registerHttpRoute(...)`.
- Các route của Plugin phải khai báo `auth` một cách rõ ràng.
- Các xung đột `path + match` chính xác sẽ bị từ chối trừ khi có `replaceExisting: true`, và một Plugin không thể thay thế route của Plugin khác.
- Các route chồng lấn với mức `auth` khác nhau sẽ bị từ chối. Chỉ giữ các chuỗi chuyển tiếp `exact`/`prefix` ở cùng một mức auth.
- Các route `auth: "plugin"` **không** tự động nhận phạm vi runtime của operator. Chúng dành cho webhook/xác minh chữ ký do Plugin quản lý, không phải các lệnh gọi trợ giúp Gateway có đặc quyền.
- Các route `auth: "gateway"` chạy bên trong phạm vi runtime của yêu cầu Gateway, nhưng phạm vi đó được cố ý giữ thận trọng:
  - xác thực bearer bằng bí mật dùng chung (`gateway.auth.mode = "token"` / `"password"`) giữ phạm vi runtime của route Plugin cố định ở `operator.write`, ngay cả khi bên gọi gửi `x-openclaw-scopes`
  - các chế độ HTTP có danh tính đáng tin cậy (ví dụ `trusted-proxy` hoặc `gateway.auth.mode = "none"` trên ingress riêng tư) chỉ tôn trọng `x-openclaw-scopes` khi header đó được cung cấp rõ ràng
  - nếu thiếu `x-openclaw-scopes` trên các yêu cầu route Plugin có danh tính đó, phạm vi runtime sẽ quay về `operator.write`
- Quy tắc thực tế: đừng giả định route Plugin xác thực qua gateway là một bề mặt admin ngầm định. Nếu route của bạn cần hành vi chỉ dành cho admin, hãy yêu cầu chế độ auth có danh tính và ghi tài liệu cho hợp đồng header `x-openclaw-scopes` rõ ràng.

## Đường dẫn import Plugin SDK

Dùng các đường dẫn con SDK hẹp thay vì barrel gốc `openclaw/plugin-sdk` nguyên khối
khi viết Plugin mới. Các đường dẫn con cốt lõi:

| Đường dẫn con                      | Mục đích                                           |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | Các primitive đăng ký Plugin                      |
| `openclaw/plugin-sdk/channel-core`  | Trình trợ giúp entry/build cho kênh               |
| `openclaw/plugin-sdk/core`          | Trình trợ giúp chia sẻ chung và hợp đồng bao quát |
| `openclaw/plugin-sdk/config-schema` | Schema Zod gốc `openclaw.json` (`OpenClawSchema`) |

Plugin kênh chọn từ một nhóm các seam hẹp — `channel-setup`,
`setup-runtime`, `setup-adapter-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-lifecycle`,
`channel-reply-pipeline`, `command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets`, và `channel-actions`. Hành vi phê duyệt nên được hợp nhất
trên một hợp đồng `approvalCapability` thay vì trộn lẫn giữa các trường Plugin
không liên quan. Xem [Plugin kênh](/vi/plugins/sdk-channel-plugins).

Trình trợ giúp runtime và config nằm dưới các đường dẫn con `*-runtime` tập trung tương ứng
(`approval-runtime`, `agent-runtime`, `lazy-runtime`, `directory-runtime`,
`text-runtime`, `runtime-store`, `system-event-runtime`, `heartbeat-runtime`,
`channel-activity-runtime`, v.v.). Ưu tiên `config-types`,
`plugin-config-runtime`, `runtime-config-snapshot`, và `config-mutation`
thay vì barrel tương thích `config-runtime` rộng.

<Info>
`openclaw/plugin-sdk/channel-runtime`, `openclaw/plugin-sdk/config-runtime`,
và `openclaw/plugin-sdk/infra-runtime` là các shim tương thích đã ngừng khuyến nghị cho
Plugin cũ. Mã mới nên import các primitive chung hẹp hơn.
</Info>

Điểm vào nội bộ repo (theo gốc package Plugin đóng gói sẵn):

- `index.js` — entry Plugin đóng gói sẵn
- `api.js` — barrel trình trợ giúp/kiểu
- `runtime-api.js` — barrel chỉ dành cho runtime
- `setup-entry.js` — entry Plugin thiết lập

Plugin bên ngoài chỉ nên import các đường dẫn con `openclaw/plugin-sdk/*`. Không bao giờ
import `src/*` của package Plugin khác từ core hoặc từ Plugin khác.
Các điểm vào được tải qua facade ưu tiên snapshot config runtime đang hoạt động khi có,
sau đó mới quay về tệp config đã phân giải trên đĩa.

Các đường dẫn con theo năng lực cụ thể như `image-generation`, `media-understanding`,
và `speech` tồn tại vì các Plugin đóng gói sẵn hiện dùng chúng. Chúng không
tự động là hợp đồng bên ngoài được đóng băng dài hạn — hãy kiểm tra trang tham chiếu SDK
liên quan khi dựa vào chúng.

## Schema công cụ tin nhắn

Plugin nên sở hữu các đóng góp schema `describeMessageTool(...)` theo kênh
cho các primitive không phải tin nhắn như phản ứng, trạng thái đã đọc và thăm dò ý kiến.
Phần trình bày gửi dùng chung nên sử dụng hợp đồng `MessagePresentation` chung
thay vì các trường nút, component, block hoặc card gốc của nhà cung cấp.
Xem [Trình bày tin nhắn](/vi/plugins/message-presentation) để biết hợp đồng,
quy tắc fallback, ánh xạ nhà cung cấp và checklist cho tác giả Plugin.

Plugin có khả năng gửi khai báo những gì chúng có thể render thông qua năng lực tin nhắn:

- `presentation` cho các khối trình bày ngữ nghĩa (`text`, `context`, `divider`, `buttons`, `select`)
- `delivery-pin` cho yêu cầu ghim việc gửi

Core quyết định render phần trình bày theo cách gốc hay giảm cấp thành văn bản.
Không để lộ lối thoát UI gốc của nhà cung cấp từ công cụ tin nhắn chung.
Các trình trợ giúp SDK đã ngừng khuyến nghị cho schema gốc cũ vẫn được export cho
Plugin bên thứ ba hiện có, nhưng Plugin mới không nên dùng chúng.

## Phân giải mục tiêu kênh

Plugin kênh nên sở hữu ngữ nghĩa mục tiêu theo kênh. Giữ host outbound dùng chung
ở mức chung và dùng bề mặt adapter nhắn tin cho các quy tắc nhà cung cấp:

- `messaging.inferTargetChatType({ to })` quyết định liệu một mục tiêu đã chuẩn hóa
  nên được xem là `direct`, `group`, hay `channel` trước khi tra cứu thư mục.
- `messaging.targetResolver.looksLikeId(raw, normalized)` cho core biết liệu một
  đầu vào nên bỏ qua thẳng sang phân giải dạng id thay vì tìm kiếm thư mục.
- `messaging.targetResolver.resolveTarget(...)` là fallback của Plugin khi
  core cần phân giải cuối cùng do nhà cung cấp sở hữu sau khi chuẩn hóa hoặc sau khi
  không tìm thấy trong thư mục.
- `messaging.resolveOutboundSessionRoute(...)` sở hữu việc xây dựng route phiên
  theo nhà cung cấp sau khi một mục tiêu đã được phân giải.

Phân tách được khuyến nghị:

- Dùng `inferTargetChatType` cho các quyết định phân loại cần xảy ra trước khi
  tìm kiếm peer/group.
- Dùng `looksLikeId` cho các kiểm tra "xem mục này là id mục tiêu rõ ràng/gốc".
- Dùng `resolveTarget` cho fallback chuẩn hóa theo nhà cung cấp, không dùng cho
  tìm kiếm thư mục rộng.
- Giữ các id gốc của nhà cung cấp như chat id, thread id, JID, handle và room
  id bên trong các giá trị `target` hoặc tham số theo nhà cung cấp, không đặt trong trường SDK chung.

## Thư mục dựa trên config

Plugin suy ra các mục thư mục từ config nên giữ logic đó trong
Plugin và tái sử dụng các trình trợ giúp dùng chung từ
`openclaw/plugin-sdk/directory-runtime`.

Dùng phần này khi một kênh cần peer/group dựa trên config như:

- peer DM dựa trên allowlist
- ánh xạ kênh/group đã cấu hình
- fallback thư mục tĩnh theo phạm vi tài khoản

Các trình trợ giúp dùng chung trong `directory-runtime` chỉ xử lý thao tác chung:

- lọc truy vấn
- áp dụng giới hạn
- trình trợ giúp loại trùng/chuẩn hóa
- xây dựng `ChannelDirectoryEntry[]`

Việc kiểm tra tài khoản và chuẩn hóa id theo kênh nên ở lại trong
phần triển khai Plugin.

## Danh mục nhà cung cấp

Plugin nhà cung cấp có thể định nghĩa danh mục model cho suy luận bằng
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` trả về cùng hình dạng mà OpenClaw ghi vào
`models.providers`:

- `{ provider }` cho một mục nhà cung cấp
- `{ providers }` cho nhiều mục nhà cung cấp

Dùng `catalog` khi Plugin sở hữu id model theo nhà cung cấp, mặc định URL cơ sở,
hoặc metadata model có kiểm soát auth.

`catalog.order` kiểm soát thời điểm danh mục của Plugin được hợp nhất so với các
nhà cung cấp ngầm định tích hợp của OpenClaw:

- `simple`: nhà cung cấp thuần API key hoặc do env điều khiển
- `profile`: nhà cung cấp xuất hiện khi có hồ sơ auth
- `paired`: nhà cung cấp tổng hợp nhiều mục nhà cung cấp liên quan
- `late`: lượt cuối, sau các nhà cung cấp ngầm định khác

Nhà cung cấp về sau thắng khi trùng khóa, vì vậy Plugin có thể chủ ý ghi đè một
mục nhà cung cấp tích hợp có cùng id nhà cung cấp.

Tương thích:

- `discovery` vẫn hoạt động như alias cũ
- nếu cả `catalog` và `discovery` được đăng ký, OpenClaw dùng `catalog`

## Kiểm tra kênh chỉ đọc

Nếu Plugin của bạn đăng ký một kênh, hãy ưu tiên triển khai
`plugin.config.inspectAccount(cfg, accountId)` cùng với `resolveAccount(...)`.

Lý do:

- `resolveAccount(...)` là đường dẫn runtime. Nó được phép giả định thông tin xác thực
  đã được materialize đầy đủ và có thể thất bại nhanh khi thiếu secret bắt buộc.
- Các đường dẫn lệnh chỉ đọc như `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve`, và các luồng doctor/config
  repair không nên cần materialize thông tin xác thực runtime chỉ để
  mô tả cấu hình.

Hành vi `inspectAccount(...)` được khuyến nghị:

- Chỉ trả về trạng thái tài khoản mang tính mô tả.
- Giữ nguyên `enabled` và `configured`.
- Bao gồm các trường nguồn/trạng thái thông tin xác thực khi liên quan, chẳng hạn:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Bạn không cần trả về giá trị token thô chỉ để báo cáo khả năng sẵn có
  chỉ đọc. Trả về `tokenStatus: "available"` (và trường nguồn tương ứng)
  là đủ cho các lệnh kiểu status.
- Dùng `configured_unavailable` khi thông tin xác thực được cấu hình qua SecretRef nhưng
  không khả dụng trong đường dẫn lệnh hiện tại.

Điều này cho phép các lệnh chỉ đọc báo cáo "đã cấu hình nhưng không khả dụng trong đường dẫn lệnh này"
thay vì crash hoặc báo sai tài khoản là chưa cấu hình.

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

Mỗi entry trở thành một Plugin. Nếu gói liệt kê nhiều extension, id Plugin
trở thành `name/<fileBase>`.

Nếu Plugin của bạn import dependency npm, hãy cài chúng trong thư mục đó để
`node_modules` khả dụng (`npm install` / `pnpm install`).

Rào chắn bảo mật: mọi entry `openclaw.extensions` phải ở bên trong thư mục Plugin
sau khi phân giải symlink. Các entry thoát khỏi thư mục package sẽ bị từ chối.

Ghi chú bảo mật: `openclaw plugins install` cài dependency của Plugin bằng
`npm install --omit=dev --ignore-scripts` cục bộ theo dự án (không có script vòng đời,
không có dependency dev ở runtime), bỏ qua các thiết lập cài đặt npm toàn cục được kế thừa.
Giữ cây dependency Plugin ở dạng "JS/TS thuần" và tránh các package yêu cầu
build `postinstall`.

Tùy chọn: `openclaw.setupEntry` có thể trỏ tới một module nhẹ chỉ dành cho thiết lập.
Khi OpenClaw cần bề mặt thiết lập cho một Plugin kênh bị tắt, hoặc
khi một Plugin kênh đã bật nhưng vẫn chưa cấu hình, nó sẽ tải `setupEntry`
thay vì entry Plugin đầy đủ. Điều này giúp khởi động và thiết lập nhẹ hơn
khi entry Plugin chính của bạn cũng nối công cụ, hook hoặc mã chỉ dành cho runtime khác.

Tùy chọn: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
có thể đưa một Plugin kênh vào cùng đường dẫn `setupEntry` trong giai đoạn khởi động
trước khi lắng nghe của gateway, ngay cả khi kênh đã được cấu hình.

Chỉ dùng phần này khi `setupEntry` bao phủ đầy đủ bề mặt khởi động phải tồn tại
trước khi gateway bắt đầu lắng nghe. Trong thực tế, điều đó nghĩa là entry thiết lập
phải đăng ký mọi năng lực do kênh sở hữu mà khởi động phụ thuộc vào, chẳng hạn:

- bản thân việc đăng ký kênh
- mọi route HTTP phải khả dụng trước khi gateway bắt đầu lắng nghe
- mọi phương thức, công cụ hoặc dịch vụ gateway phải tồn tại trong cùng khoảng thời gian đó

Nếu entry đầy đủ của bạn vẫn sở hữu bất kỳ năng lực khởi động bắt buộc nào, đừng bật
cờ này. Giữ Plugin ở hành vi mặc định và để OpenClaw tải
entry đầy đủ trong quá trình khởi động.

Các kênh đóng gói sẵn cũng có thể xuất bản trình trợ giúp bề mặt hợp đồng chỉ dành cho thiết lập mà core
có thể tham khảo trước khi runtime kênh đầy đủ được tải. Bề mặt promotion thiết lập hiện tại là:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Lõi dùng bề mặt đó khi cần nâng cấp cấu hình kênh một tài khoản cũ vào
`channels.<id>.accounts.*` mà không tải toàn bộ điểm vào Plugin. Matrix là ví
dụ bundled hiện tại: nó chỉ di chuyển các khóa auth/bootstrap vào một tài khoản
được nâng cấp có tên khi các tài khoản có tên đã tồn tại, và nó có thể giữ lại
một khóa tài khoản mặc định không chuẩn hóa đã cấu hình thay vì luôn tạo
`accounts.default`.

Các bộ chuyển đổi bản vá thiết lập đó giữ cho việc khám phá bề mặt hợp đồng
bundled ở trạng thái lazy. Thời gian import vẫn nhẹ; bề mặt nâng cấp chỉ được
tải ở lần dùng đầu tiên thay vì vào lại quá trình khởi động kênh bundled khi
import module.

Khi các bề mặt khởi động đó bao gồm các phương thức RPC của Gateway, hãy giữ
chúng trên một tiền tố dành riêng cho Plugin. Các namespace quản trị lõi
(`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) vẫn được dành riêng và
luôn phân giải thành `operator.admin`, ngay cả khi một Plugin yêu cầu phạm vi
hẹp hơn.

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

### Siêu dữ liệu catalog kênh

Các Plugin kênh có thể quảng bá siêu dữ liệu thiết lập/khám phá qua
`openclaw.channel` và gợi ý cài đặt qua `openclaw.install`. Điều này giữ cho
catalog lõi không chứa dữ liệu.

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

- `detailLabel`: nhãn phụ cho các bề mặt catalog/trạng thái phong phú hơn
- `docsLabel`: ghi đè văn bản liên kết cho liên kết tài liệu
- `preferOver`: các id Plugin/kênh có mức ưu tiên thấp hơn mà mục catalog này nên xếp trên
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: các điều khiển nội dung cho bề mặt lựa chọn
- `markdownCapable`: đánh dấu kênh là có khả năng markdown cho các quyết định định dạng gửi ra
- `exposure.configured`: ẩn kênh khỏi các bề mặt liệt kê kênh đã cấu hình khi đặt thành `false`
- `exposure.setup`: ẩn kênh khỏi các bộ chọn thiết lập/cấu hình tương tác khi đặt thành `false`
- `exposure.docs`: đánh dấu kênh là nội bộ/riêng tư cho các bề mặt điều hướng tài liệu
- `showConfigured` / `showInSetup`: các alias cũ vẫn được chấp nhận để tương thích; ưu tiên `exposure`
- `quickstartAllowFrom`: chọn cho kênh tham gia luồng quickstart `allowFrom` tiêu chuẩn
- `forceAccountBinding`: yêu cầu liên kết tài khoản rõ ràng ngay cả khi chỉ có một tài khoản tồn tại
- `preferSessionLookupForAnnounceTarget`: ưu tiên tra cứu phiên khi phân giải đích thông báo

OpenClaw cũng có thể hợp nhất **catalog kênh bên ngoài** (ví dụ: bản xuất
registry MPM). Đặt một tệp JSON tại một trong các vị trí:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Hoặc trỏ `OPENCLAW_PLUGIN_CATALOG_PATHS` (hoặc `OPENCLAW_MPM_CATALOG_PATHS`) đến
một hoặc nhiều tệp JSON (phân tách bằng dấu phẩy/dấu chấm phẩy/`PATH`). Mỗi tệp
nên chứa `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. Bộ phân tích cũng chấp nhận `"packages"` hoặc `"plugins"` làm alias cũ cho khóa `"entries"`.

Các mục catalog kênh được tạo và mục catalog cài đặt provider hiển thị các dữ
kiện nguồn cài đặt đã chuẩn hóa bên cạnh khối `openclaw.install` thô. Các dữ
kiện đã chuẩn hóa xác định spec npm là phiên bản chính xác hay bộ chọn động,
siêu dữ liệu integrity mong đợi có hiện diện hay không, và đường dẫn nguồn cục
bộ cũng có sẵn hay không. Khi danh tính catalog/package đã biết, các dữ kiện đã
chuẩn hóa sẽ cảnh báo nếu tên package npm đã phân tích lệch khỏi danh tính đó.
Chúng cũng cảnh báo khi `defaultChoice` không hợp lệ hoặc trỏ đến một nguồn
không có sẵn, và khi siêu dữ liệu integrity npm hiện diện mà không có nguồn npm
hợp lệ. Consumer nên xem `installSource` là một trường tùy chọn bổ sung để các
mục tạo thủ công và shim catalog không phải tổng hợp nó. Điều này cho phép
onboarding và chẩn đoán giải thích trạng thái mặt phẳng nguồn mà không import
runtime Plugin.

Các mục npm bên ngoài chính thức nên ưu tiên một `npmSpec` chính xác kèm
`expectedIntegrity`. Tên package trần và dist-tag vẫn hoạt động để tương thích,
nhưng chúng hiển thị cảnh báo mặt phẳng nguồn để catalog có thể tiến tới các
cài đặt được ghim và kiểm tra integrity mà không phá vỡ các Plugin hiện có. Khi
onboarding cài đặt từ đường dẫn catalog cục bộ, nó ghi lại một mục chỉ mục
Plugin được quản lý với `source: "path"` và `sourcePath` tương đối với workspace
khi có thể. Đường dẫn tải vận hành tuyệt đối vẫn nằm trong `plugins.load.paths`;
bản ghi cài đặt tránh sao chép các đường dẫn workstation cục bộ vào cấu hình
tồn tại lâu dài. Điều này giữ cho các cài đặt phát triển cục bộ hiển thị với
chẩn đoán mặt phẳng nguồn mà không thêm bề mặt tiết lộ đường dẫn hệ thống tệp
thô thứ hai. Chỉ mục Plugin `plugins/installs.json` được lưu bền là nguồn sự
thật cài đặt và có thể được làm mới mà không tải các module runtime Plugin.
Map `installRecords` của nó bền vững ngay cả khi manifest Plugin bị thiếu hoặc
không hợp lệ; mảng `plugins` của nó là một dạng nhìn manifest có thể dựng lại.

## Plugin công cụ ngữ cảnh

Các Plugin công cụ ngữ cảnh sở hữu việc điều phối ngữ cảnh phiên cho ingest,
assembly và Compaction. Đăng ký chúng từ Plugin của bạn bằng
`api.registerContextEngine(id, factory)`, sau đó chọn công cụ đang hoạt động với
`plugins.slots.contextEngine`.

Dùng điều này khi Plugin của bạn cần thay thế hoặc mở rộng pipeline ngữ cảnh
mặc định thay vì chỉ thêm tìm kiếm bộ nhớ hoặc hook.

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

Factory `ctx` hiển thị các giá trị tùy chọn `config`, `agentDir` và
`workspaceDir` để khởi tạo ở thời điểm xây dựng.

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

## Thêm một capability mới

Khi một Plugin cần hành vi không phù hợp với API hiện tại, đừng đi vòng qua hệ
thống Plugin bằng cách truy cập riêng tư vào bên trong. Hãy thêm capability còn
thiếu.

Trình tự khuyến nghị:

1. định nghĩa hợp đồng lõi
   Quyết định hành vi dùng chung nào lõi nên sở hữu: chính sách, fallback, hợp nhất cấu hình,
   lifecycle, ngữ nghĩa hướng kênh và hình dạng helper runtime.
2. thêm các bề mặt đăng ký/runtime Plugin có kiểu
   Mở rộng `OpenClawPluginApi` và/hoặc `api.runtime` với bề mặt capability có kiểu nhỏ nhất hữu ích.
3. nối dây lõi + consumer kênh/tính năng
   Các kênh và Plugin tính năng nên dùng capability mới thông qua lõi,
   không import trực tiếp một triển khai vendor.
4. đăng ký các triển khai vendor
   Sau đó các Plugin vendor đăng ký backend của chúng với capability.
5. thêm coverage hợp đồng
   Thêm kiểm thử để quyền sở hữu và hình dạng đăng ký vẫn rõ ràng theo thời gian.

Đây là cách OpenClaw giữ lập trường rõ ràng mà không bị hardcode theo thế giới
quan của một provider. Xem [Capability Cookbook](/vi/plugins/architecture)
để có checklist tệp cụ thể và ví dụ đã làm.

### Checklist capability

Khi bạn thêm một capability mới, triển khai thường nên chạm đến các bề mặt này
cùng nhau:

- kiểu hợp đồng lõi trong `src/<capability>/types.ts`
- runner/helper runtime lõi trong `src/<capability>/runtime.ts`
- bề mặt đăng ký API Plugin trong `src/plugins/types.ts`
- nối dây registry Plugin trong `src/plugins/registry.ts`
- phơi bày runtime Plugin trong `src/plugins/runtime/*` khi Plugin tính năng/kênh
  cần dùng nó
- helper capture/kiểm thử trong `src/test-utils/plugin-registration.ts`
- assertion quyền sở hữu/hợp đồng trong `src/plugins/contracts/registry.ts`
- tài liệu operator/Plugin trong `docs/`

Nếu một trong các bề mặt đó bị thiếu, đó thường là dấu hiệu capability chưa
được tích hợp đầy đủ.

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
- Plugin vendor sở hữu triển khai vendor
- Plugin tính năng/kênh dùng helper runtime
- kiểm thử hợp đồng giữ cho quyền sở hữu rõ ràng

## Liên quan

- [Kiến trúc Plugin](/vi/plugins/architecture) — mô hình capability công khai và các hình dạng
- [Subpath Plugin SDK](/vi/plugins/sdk-subpaths)
- [Thiết lập Plugin SDK](/vi/plugins/sdk-setup)
- [Xây dựng Plugin](/vi/plugins/building-plugins)
