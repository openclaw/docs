---
read_when:
    - Triển khai các hook thời gian chạy của nhà cung cấp, vòng đời kênh hoặc các bộ gói
    - Gỡ lỗi thứ tự tải Plugin hoặc trạng thái sổ đăng ký
    - Thêm khả năng Plugin mới hoặc Plugin công cụ ngữ cảnh
summary: 'Nội bộ kiến trúc Plugin: quy trình tải, sổ đăng ký, móc nối thời gian chạy, tuyến HTTP và bảng tham chiếu'
title: Nội bộ kiến trúc Plugin
x-i18n:
    generated_at: "2026-05-02T20:45:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: fec593518e51f68ce617d5bc4e55cede2188e9247f863364a9ea956e50ca2675
    source_path: plugins/architecture-internals.md
    workflow: 16
---

Để biết mô hình năng lực công khai, các dạng Plugin và hợp đồng quyền sở hữu/thực thi, xem [Kiến trúc Plugin](/vi/plugins/architecture). Trang này là tài liệu tham chiếu cho cơ chế nội bộ: quy trình tải, registry, hook runtime, route HTTP của Gateway, đường dẫn import và bảng schema.

## Quy trình tải

Khi khởi động, OpenClaw đại khái thực hiện như sau:

1. phát hiện các gốc Plugin ứng viên
2. đọc manifest bundle gốc hoặc tương thích và siêu dữ liệu package
3. từ chối các ứng viên không an toàn
4. chuẩn hóa cấu hình Plugin (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. quyết định bật hay không cho từng ứng viên
6. tải các mô-đun gốc đã bật: các mô-đun đi kèm đã build dùng trình tải gốc;
   mã nguồn TypeScript cục bộ của bên thứ ba dùng fallback Jiti khẩn cấp
7. gọi các hook `register(api)` gốc và thu thập đăng ký vào registry Plugin
8. phơi bày registry cho các bề mặt lệnh/runtime

<Note>
`activate` là bí danh legacy của `register` — trình tải phân giải mục nào hiện diện (`def.register ?? def.activate`) và gọi nó tại cùng thời điểm. Tất cả Plugin đi kèm dùng `register`; nên dùng `register` cho Plugin mới.
</Note>

Các cổng an toàn diễn ra **trước** khi thực thi runtime. Ứng viên bị chặn
khi entry thoát khỏi gốc Plugin, đường dẫn cho phép mọi người ghi, hoặc quyền
sở hữu đường dẫn có vẻ đáng ngờ đối với Plugin không đi kèm.

### Hành vi ưu tiên manifest

Manifest là nguồn sự thật của control plane. OpenClaw dùng manifest để:

- nhận diện Plugin
- phát hiện channel/skills/schema cấu hình đã khai báo hoặc năng lực bundle
- xác thực `plugins.entries.<id>.config`
- bổ sung nhãn/placeholder cho Control UI
- hiển thị siêu dữ liệu cài đặt/catalog
- giữ lại các mô tả kích hoạt và thiết lập nhẹ mà không cần tải runtime Plugin

Đối với Plugin gốc, mô-đun runtime là phần data plane. Nó đăng ký
hành vi thực tế như hook, tool, lệnh hoặc luồng provider.

Các khối manifest tùy chọn `activation` và `setup` vẫn nằm trên control plane.
Chúng là các mô tả chỉ gồm siêu dữ liệu để lập kế hoạch kích hoạt và phát hiện thiết lập;
chúng không thay thế đăng ký runtime, `register(...)` hay `setupEntry`.
Các consumer kích hoạt live đầu tiên hiện dùng gợi ý lệnh, channel và provider trong manifest
để thu hẹp việc tải Plugin trước khi vật thể hóa registry rộng hơn:

- Tải CLI thu hẹp xuống các Plugin sở hữu lệnh chính được yêu cầu
- phân giải thiết lập channel/Plugin thu hẹp xuống các Plugin sở hữu
  id channel được yêu cầu
- phân giải thiết lập/runtime provider tường minh thu hẹp xuống các Plugin sở hữu
  id provider được yêu cầu
- lập kế hoạch khởi động Gateway dùng `activation.onStartup` cho các import khởi động tường minh
  và các lựa chọn không tham gia khởi động; Plugin không có siêu dữ liệu khởi động chỉ tải
  qua các trigger kích hoạt hẹp hơn

Các preload runtime tại thời điểm yêu cầu hỏi phạm vi rộng `all` vẫn dẫn xuất một
tập id Plugin hiệu lực tường minh từ cấu hình, lập kế hoạch khởi động, các
channel đã cấu hình, slot và quy tắc tự động bật. Nếu tập dẫn xuất đó rỗng, OpenClaw
tải một registry runtime rỗng thay vì mở rộng ra mọi Plugin có thể phát hiện.

Bộ lập kế hoạch kích hoạt phơi bày cả API chỉ gồm id cho các caller hiện có và
API kế hoạch cho chẩn đoán mới. Các mục kế hoạch báo cáo lý do một Plugin được chọn,
tách các gợi ý lập kế hoạch `activation.*` tường minh khỏi fallback quyền sở hữu manifest
như `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` và hook. Sự tách lý do đó là ranh giới tương thích:
siêu dữ liệu Plugin hiện có tiếp tục hoạt động, trong khi mã mới có thể phát hiện gợi ý rộng
hoặc hành vi fallback mà không thay đổi ngữ nghĩa tải runtime.

Phát hiện thiết lập hiện ưu tiên các id do descriptor sở hữu như `setup.providers` và
`setup.cliBackends` để thu hẹp Plugin ứng viên trước khi fallback về
`setup-api` cho các Plugin vẫn cần hook runtime trong thời gian thiết lập. Danh sách
thiết lập provider dùng manifest `providerAuthChoices`, các lựa chọn thiết lập dẫn xuất từ descriptor,
và siêu dữ liệu catalog cài đặt mà không tải runtime provider. `setup.requiresRuntime: false`
tường minh là điểm cắt chỉ dùng descriptor; `requiresRuntime` bị bỏ qua
vẫn giữ fallback setup-api legacy để tương thích. Nếu nhiều hơn một Plugin được phát hiện
tuyên bố cùng một id provider thiết lập hoặc backend CLI đã chuẩn hóa, tra cứu thiết lập
từ chối owner mơ hồ thay vì dựa vào thứ tự phát hiện. Khi runtime thiết lập thực thi,
chẩn đoán registry báo cáo độ lệch giữa `setup.providers` / `setup.cliBackends` và
các provider hoặc backend CLI do setup-api đăng ký mà không chặn Plugin legacy.

### Ranh giới cache Plugin

OpenClaw không cache kết quả phát hiện Plugin hoặc dữ liệu registry manifest trực tiếp
sau các cửa sổ thời gian theo đồng hồ. Cài đặt, chỉnh sửa manifest và thay đổi load-path
phải hiển thị ở lần đọc siêu dữ liệu tường minh kế tiếp hoặc lần rebuild snapshot kế tiếp.
Bộ phân tích cú pháp file manifest có thể giữ một cache chữ ký file có giới hạn được khóa theo
đường dẫn manifest đã mở, inode, kích thước và timestamp; cache đó chỉ tránh
phân tích lại các byte không đổi và không được cache câu trả lời về phát hiện, registry, owner hoặc
policy.

Đường tắt siêu dữ liệu an toàn là quyền sở hữu đối tượng tường minh, không phải cache ẩn.
Các hot path khởi động Gateway nên truyền `PluginMetadataSnapshot` hiện tại,
`PluginLookUpTable` đã dẫn xuất hoặc một registry manifest tường minh qua chuỗi gọi.
Xác thực cấu hình, tự động bật khi khởi động, bootstrap Plugin và chọn provider
có thể tái sử dụng các đối tượng đó trong khi chúng đại diện cho cấu hình và
tồn kho Plugin hiện tại. Tra cứu thiết lập vẫn tái dựng siêu dữ liệu manifest theo nhu cầu
trừ khi đường dẫn thiết lập cụ thể nhận một registry manifest tường minh; giữ điều đó
làm fallback cold-path thay vì thêm cache tra cứu ẩn. Khi input
thay đổi, rebuild và thay thế snapshot thay vì mutate nó hoặc giữ
các bản sao lịch sử.
Các view trên registry Plugin đang hoạt động và helper bootstrap channel đi kèm
nên được tính lại từ registry/root hiện tại. Map ngắn hạn thì ổn
bên trong một lần gọi để loại trùng công việc hoặc bảo vệ reentry; chúng không được trở thành cache
siêu dữ liệu của process.

Đối với tải Plugin, lớp cache bền vững là tải runtime. Nó có thể tái sử dụng
trạng thái trình tải khi mã hoặc artifact đã cài đặt thực sự được tải, chẳng hạn:

- `PluginLoaderCacheState` và các registry runtime đang hoạt động tương thích
- cache jiti/module và cache trình tải bề mặt công khai dùng để tránh import
  cùng một bề mặt runtime nhiều lần
- cache hệ thống file cho artifact Plugin đã cài đặt
- map ngắn hạn theo từng lần gọi cho chuẩn hóa đường dẫn hoặc phân giải trùng lặp

Các cache đó là chi tiết triển khai data plane. Chúng không được trả lời
các câu hỏi control plane như "Plugin nào sở hữu provider này?" trừ khi
caller cố ý yêu cầu tải runtime.

Không thêm cache bền vững hoặc theo đồng hồ cho:

- kết quả phát hiện
- registry manifest trực tiếp
- registry manifest được tái dựng từ chỉ mục Plugin đã cài đặt
- tra cứu owner provider, ẩn model, policy provider hoặc siêu dữ liệu
  artifact công khai
- bất kỳ câu trả lời nào khác dẫn xuất từ manifest mà manifest, chỉ mục đã cài đặt
  hoặc load path đã thay đổi phải hiển thị ở lần đọc siêu dữ liệu kế tiếp

Các caller rebuild siêu dữ liệu manifest từ chỉ mục Plugin đã cài đặt được duy trì
sẽ tái dựng registry đó theo nhu cầu. Chỉ mục đã cài đặt là trạng thái source-plane
bền vững; nó không phải cache siêu dữ liệu ẩn trong process.

## Mô hình registry

Plugin đã tải không mutate trực tiếp các biến global core ngẫu nhiên. Chúng đăng ký vào một
registry Plugin trung tâm.

Registry theo dõi:

- bản ghi Plugin (danh tính, nguồn, origin, trạng thái, chẩn đoán)
- tool
- hook legacy và hook có kiểu
- channel
- provider
- handler RPC gateway
- route HTTP
- registrar CLI
- dịch vụ nền
- lệnh do Plugin sở hữu

Sau đó các tính năng core đọc từ registry đó thay vì nói chuyện trực tiếp với mô-đun Plugin.
Điều này giữ việc tải theo một chiều:

- mô-đun Plugin -> đăng ký registry
- runtime core -> tiêu thụ registry

Sự tách biệt đó quan trọng đối với khả năng bảo trì. Nó có nghĩa là hầu hết bề mặt core chỉ
cần một điểm tích hợp: "đọc registry", không phải "xử lý riêng từng mô-đun Plugin".

## Callback liên kết hội thoại

Plugin liên kết một hội thoại có thể phản ứng khi một phê duyệt được giải quyết.

Dùng `api.onConversationBindingResolved(...)` để nhận callback sau khi một yêu cầu liên kết
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

Các trường payload callback:

- `status`: `"approved"` hoặc `"denied"`
- `decision`: `"allow-once"`, `"allow-always"` hoặc `"deny"`
- `binding`: liên kết đã phân giải cho các yêu cầu được chấp thuận
- `request`: tóm tắt yêu cầu gốc, gợi ý detach, id sender và
  siêu dữ liệu hội thoại

Callback này chỉ để thông báo. Nó không thay đổi ai được phép liên kết
một hội thoại, và nó chạy sau khi xử lý phê duyệt của core hoàn tất.

## Hook runtime provider

Plugin provider có ba lớp:

- **Siêu dữ liệu manifest** cho tra cứu nhẹ trước runtime:
  `setup.providers[].envVars`, tương thích đã ngừng khuyến nghị `providerAuthEnvVars`,
  `providerAuthAliases`, `providerAuthChoices` và `channelEnvVars`.
- **Hook thời gian cấu hình**: `catalog` (`discovery` legacy) cộng với
  `applyConfigDefaults`.
- **Hook runtime**: hơn 40 hook tùy chọn bao phủ auth, phân giải model,
  bọc stream, mức thinking, policy replay và endpoint usage. Xem
  danh sách đầy đủ trong [Thứ tự và cách dùng hook](#hook-order-and-usage).

OpenClaw vẫn sở hữu vòng lặp agent chung, failover, xử lý transcript và
policy tool. Các hook này là bề mặt mở rộng cho hành vi riêng theo provider
mà không cần toàn bộ transport inference tùy chỉnh.

Dùng manifest `setup.providers[].envVars` khi provider có thông tin xác thực dựa trên env
mà các đường dẫn auth/status/model-picker chung nên thấy mà không
tải runtime Plugin. `providerAuthEnvVars` đã ngừng khuyến nghị vẫn được đọc bởi
adapter tương thích trong cửa sổ ngừng khuyến nghị, và Plugin không đi kèm
dùng nó sẽ nhận chẩn đoán manifest. Dùng manifest `providerAuthAliases`
khi một id provider nên tái sử dụng env var, auth profile,
auth dựa trên cấu hình và lựa chọn onboarding API-key của id provider khác. Dùng manifest
`providerAuthChoices` khi các bề mặt CLI onboarding/lựa chọn auth nên biết
id lựa chọn, nhãn nhóm và dây nối auth một cờ đơn giản của provider mà không
tải runtime provider. Giữ `envVars` runtime provider cho các gợi ý hướng tới operator
như nhãn onboarding hoặc biến thiết lập OAuth client-id/client-secret.

Dùng manifest `channelEnvVars` khi một channel có auth hoặc thiết lập theo env mà
fallback shell-env chung, kiểm tra cấu hình/trạng thái hoặc prompt thiết lập nên thấy
mà không tải runtime channel.

### Thứ tự và cách dùng hook

Đối với Plugin model/provider, OpenClaw gọi hook theo thứ tự đại khái này.
Cột "Khi nào dùng" là hướng dẫn quyết định nhanh.
Các trường provider chỉ để tương thích mà OpenClaw không còn gọi, chẳng hạn
`ProviderPlugin.capabilities` và `suppressBuiltInModel`, được cố ý không
liệt kê ở đây.

| #   | Móc                               | Tác dụng                                                                                                            | Khi dùng                                                                                                                                                    |
| --- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | Xuất bản cấu hình nhà cung cấp vào `models.providers` trong quá trình tạo `models.json`                             | Nhà cung cấp sở hữu một danh mục hoặc các giá trị mặc định của URL cơ sở                                                                                    |
| 2   | `applyConfigDefaults`             | Áp dụng các giá trị mặc định cấu hình toàn cục do nhà cung cấp sở hữu trong quá trình vật chất hóa cấu hình          | Giá trị mặc định phụ thuộc vào chế độ xác thực, env, hoặc ngữ nghĩa họ mô hình của nhà cung cấp                                                             |
| --  | _(tra cứu mô hình tích hợp sẵn)_  | OpenClaw thử đường dẫn registry/danh mục thông thường trước                                                          | _(không phải móc Plugin)_                                                                                                                                   |
| 3   | `normalizeModelId`                | Chuẩn hóa các bí danh model-id cũ hoặc bản xem trước trước khi tra cứu                                               | Nhà cung cấp sở hữu việc dọn dẹp bí danh trước khi phân giải mô hình chuẩn                                                                                  |
| 4   | `normalizeTransport`              | Chuẩn hóa `api` / `baseUrl` của họ nhà cung cấp trước khi lắp ráp mô hình chung                                      | Nhà cung cấp sở hữu việc dọn dẹp transport cho các id nhà cung cấp tùy chỉnh trong cùng họ transport                                                        |
| 5   | `normalizeConfig`                 | Chuẩn hóa `models.providers.<id>` trước khi phân giải runtime/nhà cung cấp                                           | Nhà cung cấp cần dọn dẹp cấu hình và việc đó nên nằm cùng Plugin; các helper họ Google được đóng gói cũng dự phòng cho các mục cấu hình Google được hỗ trợ |
| 6   | `applyNativeStreamingUsageCompat` | Áp dụng các bản ghi lại tương thích sử dụng phát trực tuyến gốc cho nhà cung cấp cấu hình                            | Nhà cung cấp cần sửa siêu dữ liệu sử dụng phát trực tuyến gốc theo endpoint                                                                                 |
| 7   | `resolveConfigApiKey`             | Phân giải xác thực bằng dấu env cho nhà cung cấp cấu hình trước khi tải xác thực runtime                             | Nhà cung cấp có phân giải khóa API bằng dấu env do nhà cung cấp sở hữu; `amazon-bedrock` cũng có bộ phân giải dấu env AWS tích hợp sẵn tại đây              |
| 8   | `resolveSyntheticAuth`            | Hiển thị xác thực cục bộ/tự lưu trữ hoặc dựa trên cấu hình mà không lưu văn bản thuần                                | Nhà cung cấp có thể hoạt động với dấu thông tin xác thực tổng hợp/cục bộ                                                                                    |
| 9   | `resolveExternalAuthProfiles`     | Phủ các hồ sơ xác thực bên ngoài do nhà cung cấp sở hữu; `persistence` mặc định là `runtime-only` cho thông tin xác thực do CLI/app sở hữu | Nhà cung cấp tái sử dụng thông tin xác thực bên ngoài mà không lưu các refresh token đã sao chép; khai báo `contracts.externalAuthProviders` trong manifest |
| 10  | `shouldDeferSyntheticProfileAuth` | Hạ ưu tiên các placeholder hồ sơ tổng hợp đã lưu sau xác thực dựa trên env/cấu hình                                  | Nhà cung cấp lưu các hồ sơ placeholder tổng hợp không nên thắng về thứ tự ưu tiên                                                                            |
| 11  | `resolveDynamicModel`             | Dự phòng đồng bộ cho các id mô hình do nhà cung cấp sở hữu chưa có trong registry cục bộ                             | Nhà cung cấp chấp nhận các id mô hình upstream tùy ý                                                                                                        |
| 12  | `prepareDynamicModel`             | Khởi động chuẩn bị bất đồng bộ, sau đó `resolveDynamicModel` chạy lại                                                | Nhà cung cấp cần siêu dữ liệu mạng trước khi phân giải các id chưa biết                                                                                     |
| 13  | `normalizeResolvedModel`          | Ghi lại lần cuối trước khi runner nhúng dùng mô hình đã phân giải                                                    | Nhà cung cấp cần ghi lại transport nhưng vẫn dùng một transport lõi                                                                                         |
| 14  | `contributeResolvedModelCompat`   | Đóng góp cờ tương thích cho mô hình của nhà cung cấp đứng sau một transport tương thích khác                         | Nhà cung cấp nhận diện mô hình của chính mình trên transport proxy mà không tiếp quản nhà cung cấp                                                          |
| 15  | `normalizeToolSchemas`            | Chuẩn hóa schema công cụ trước khi runner nhúng nhìn thấy chúng                                                      | Nhà cung cấp cần dọn dẹp schema theo họ transport                                                                                                           |
| 16  | `inspectToolSchemas`              | Hiển thị chẩn đoán schema do nhà cung cấp sở hữu sau khi chuẩn hóa                                                   | Nhà cung cấp muốn cảnh báo từ khóa mà không dạy lõi các quy tắc riêng theo nhà cung cấp                                                                     |
| 17  | `resolveReasoningOutputMode`      | Chọn hợp đồng đầu ra suy luận gốc hoặc gắn thẻ                                                                        | Nhà cung cấp cần đầu ra suy luận/kết quả cuối cùng gắn thẻ thay vì các trường gốc                                                                           |
| 18  | `prepareExtraParams`              | Chuẩn hóa tham số yêu cầu trước các wrapper tùy chọn phát trực tuyến chung                                           | Nhà cung cấp cần tham số yêu cầu mặc định hoặc dọn dẹp tham số theo từng nhà cung cấp                                                                       |
| 19  | `createStreamFn`                  | Thay thế hoàn toàn đường dẫn phát trực tuyến thông thường bằng một transport tùy chỉnh                               | Nhà cung cấp cần giao thức dây tùy chỉnh, không chỉ một wrapper                                                                                             |
| 20  | `wrapStreamFn`                    | Wrapper phát trực tuyến sau khi các wrapper chung được áp dụng                                                       | Nhà cung cấp cần wrapper tương thích header/body/model của yêu cầu mà không cần transport tùy chỉnh                                                         |
| 21  | `resolveTransportTurnState`       | Gắn header hoặc siêu dữ liệu transport gốc theo từng lượt                                                            | Nhà cung cấp muốn các transport chung gửi danh tính lượt gốc của nhà cung cấp                                                                               |
| 22  | `resolveWebSocketSessionPolicy`   | Gắn header WebSocket gốc hoặc chính sách hạ nhiệt phiên                                                              | Nhà cung cấp muốn các transport WS chung tinh chỉnh header phiên hoặc chính sách dự phòng                                                                   |
| 23  | `formatApiKey`                    | Bộ định dạng hồ sơ xác thực: hồ sơ đã lưu trở thành chuỗi `apiKey` runtime                                           | Nhà cung cấp lưu siêu dữ liệu xác thực bổ sung và cần hình dạng token runtime tùy chỉnh                                                                     |
| 24  | `refreshOAuth`                    | Ghi đè làm mới OAuth cho endpoint làm mới tùy chỉnh hoặc chính sách lỗi làm mới                                      | Nhà cung cấp không phù hợp với các bộ làm mới `pi-ai` dùng chung                                                                                            |
| 25  | `buildAuthDoctorHint`             | Gợi ý sửa chữa được thêm vào khi làm mới OAuth thất bại                                                              | Nhà cung cấp cần hướng dẫn sửa xác thực do nhà cung cấp sở hữu sau lỗi làm mới                                                                              |
| 26  | `matchesContextOverflowError`     | Bộ khớp tràn cửa sổ ngữ cảnh do nhà cung cấp sở hữu                                                                  | Nhà cung cấp có lỗi tràn thô mà các heuristic chung sẽ bỏ sót                                                                                               |
| 27  | `classifyFailoverReason`          | Phân loại lý do chuyển đổi dự phòng do nhà cung cấp sở hữu                                                           | Nhà cung cấp có thể ánh xạ lỗi API/transport thô sang giới hạn tốc độ/quá tải/v.v.                                                                          |
| 28  | `isCacheTtlEligible`              | Chính sách bộ nhớ đệm prompt cho nhà cung cấp proxy/backhaul                                                         | Nhà cung cấp cần kiểm soát TTL bộ nhớ đệm riêng cho proxy                                                                                                   |
| 29  | `buildMissingAuthMessage`         | Thay thế thông báo khôi phục thiếu xác thực chung                                                                    | Nhà cung cấp cần gợi ý khôi phục thiếu xác thực riêng theo nhà cung cấp                                                                                     |
| 30  | `augmentModelCatalog`             | Các hàng danh mục tổng hợp/cuối cùng được thêm sau khi khám phá                                                      | Nhà cung cấp cần các hàng tương thích tiến về trước tổng hợp trong `models list` và bộ chọn                                                                 |
| 31  | `resolveThinkingProfile`          | Tập mức `/think` theo mô hình, nhãn hiển thị và mặc định                                                             | Nhà cung cấp hiển thị thang thinking tùy chỉnh hoặc nhãn nhị phân cho các mô hình được chọn                                                                 |
| 32  | `isBinaryThinking`                | Móc tương thích bật/tắt suy luận                                                                                     | Nhà cung cấp chỉ hiển thị thinking nhị phân bật/tắt                                                                                                         |
| 33  | `supportsXHighThinking`           | Móc tương thích hỗ trợ suy luận `xhigh`                                                                              | Nhà cung cấp muốn `xhigh` chỉ trên một tập con mô hình                                                                                                      |
| 34  | `resolveDefaultThinkingLevel`     | Móc tương thích mức `/think` mặc định                                                                                | Nhà cung cấp sở hữu chính sách `/think` mặc định cho một họ mô hình                                                                                         |
| 35  | `isModernModelRef`                | Bộ khớp mô hình hiện đại cho bộ lọc hồ sơ live và lựa chọn smoke                                                     | Nhà cung cấp sở hữu việc khớp mô hình ưu tiên cho live/smoke                                                                                                |
| 36  | `prepareRuntimeAuth`              | Trao đổi thông tin xác thực đã cấu hình thành token/khóa runtime thực tế ngay trước khi suy luận                     | Nhà cung cấp cần trao đổi token hoặc thông tin xác thực yêu cầu ngắn hạn                                                                                    |
| 37  | `resolveUsageAuth`                | Phân giải thông tin xác thực sử dụng/thanh toán cho `/usage` và các bề mặt trạng thái liên quan                                     | Nhà cung cấp cần phân tích token sử dụng/hạn mức tùy chỉnh hoặc thông tin xác thực sử dụng khác                                                               |
| 38  | `fetchUsageSnapshot`              | Tìm nạp và chuẩn hóa ảnh chụp nhanh sử dụng/hạn mức dành riêng cho nhà cung cấp sau khi xác thực được phân giải                             | Nhà cung cấp cần endpoint sử dụng dành riêng cho nhà cung cấp hoặc trình phân tích payload                                                                           |
| 39  | `createEmbeddingProvider`         | Xây dựng bộ điều hợp embedding do nhà cung cấp sở hữu cho bộ nhớ/tìm kiếm                                                     | Hành vi embedding bộ nhớ thuộc về Plugin nhà cung cấp                                                                                    |
| 40  | `buildReplayPolicy`               | Trả về chính sách phát lại kiểm soát cách xử lý bản ghi hội thoại cho nhà cung cấp                                        | Nhà cung cấp cần chính sách bản ghi hội thoại tùy chỉnh (ví dụ: loại bỏ khối suy nghĩ)                                                               |
| 41  | `sanitizeReplayHistory`           | Viết lại lịch sử phát lại sau khi dọn dẹp bản ghi hội thoại chung                                                        | Nhà cung cấp cần các bản viết lại phát lại dành riêng cho nhà cung cấp ngoài các trình trợ giúp Compaction dùng chung                                                             |
| 42  | `validateReplayTurns`             | Xác thực hoặc định hình lại lượt phát lại cuối cùng trước runner nhúng                                           | Phương thức vận chuyển của nhà cung cấp cần xác thực lượt nghiêm ngặt hơn sau khi làm sạch chung                                                                    |
| 43  | `onModelSelected`                 | Chạy các hiệu ứng phụ sau lựa chọn do nhà cung cấp sở hữu                                                                 | Nhà cung cấp cần telemetry hoặc trạng thái do nhà cung cấp sở hữu khi một mô hình trở nên hoạt động                                                                  |

`normalizeModelId`, `normalizeTransport` và `normalizeConfig` trước tiên kiểm tra
Plugin nhà cung cấp khớp, sau đó chuyển qua các Plugin nhà cung cấp khác có hỗ trợ hook
cho đến khi một Plugin thực sự thay đổi mã định danh mô hình hoặc transport/config. Điều đó giúp
các shim nhà cung cấp alias/tương thích tiếp tục hoạt động mà không yêu cầu bên gọi biết
Plugin đi kèm nào sở hữu phần ghi lại. Nếu không có hook nhà cung cấp nào ghi lại một mục
cấu hình họ Google được hỗ trợ, bộ chuẩn hóa cấu hình Google đi kèm vẫn áp dụng
phần dọn dẹp tương thích đó.

Nếu nhà cung cấp cần một wire protocol hoàn toàn tùy chỉnh hoặc trình thực thi yêu cầu tùy chỉnh,
đó là một lớp mở rộng khác. Các hook này dành cho hành vi nhà cung cấp
vẫn chạy trên vòng lặp suy luận bình thường của OpenClaw.

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

Các Plugin nhà cung cấp đi kèm kết hợp các hook ở trên để phù hợp với danh mục,
xác thực, suy nghĩ, phát lại và nhu cầu usage của từng nhà cung cấp. Tập hook có thẩm quyền nằm cùng
mỗi Plugin trong `extensions/`; trang này minh họa các hình dạng thay vì
sao chép danh sách.

<AccordionGroup>
  <Accordion title="Pass-through catalog providers">
    OpenRouter, Kilocode, Z.AI, xAI đăng ký `catalog` cùng với
    `resolveDynamicModel` / `prepareDynamicModel` để chúng có thể hiển thị các mã định danh mô hình
    upstream trước danh mục tĩnh của OpenClaw.
  </Accordion>
  <Accordion title="OAuth and usage endpoint providers">
    GitHub Copilot, Gemini CLI, ChatGPT Codex, MiniMax, Xiaomi, z.ai ghép
    `prepareRuntimeAuth` hoặc `formatApiKey` với `resolveUsageAuth` +
    `fetchUsageSnapshot` để sở hữu việc trao đổi token và tích hợp `/usage`.
  </Accordion>
  <Accordion title="Replay and transcript cleanup families">
    Các họ được đặt tên dùng chung (`google-gemini`, `passthrough-gemini`,
    `anthropic-by-model`, `hybrid-anthropic-openai`) cho phép nhà cung cấp chọn tham gia
    chính sách transcript thông qua `buildReplayPolicy` thay vì từng Plugin
    tự triển khai lại việc dọn dẹp.
  </Accordion>
  <Accordion title="Catalog-only providers">
    `byteplus`, `cloudflare-ai-gateway`, `huggingface`, `kimi-coding`, `nvidia`,
    `qianfan`, `synthetic`, `together`, `venice`, `vercel-ai-gateway` và
    `volcengine` chỉ đăng ký `catalog` và dùng vòng lặp suy luận dùng chung.
  </Accordion>
  <Accordion title="Anthropic-specific stream helpers">
    Beta headers, `/fast` / `serviceTier` và `context1m` nằm bên trong seam
    `api.ts` / `contract-api.ts` công khai của Plugin Anthropic
    (`wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`) thay vì trong
    SDK chung.
  </Accordion>
</AccordionGroup>

## Trình trợ giúp runtime

Plugin có thể truy cập các trình trợ giúp core được chọn thông qua `api.runtime`. Với TTS:

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

- `textToSpeech` trả về payload đầu ra TTS core bình thường cho các bề mặt tệp/ghi chú thoại.
- Sử dụng cấu hình core `messages.tts` và lựa chọn nhà cung cấp.
- Trả về bộ đệm âm thanh PCM + tốc độ lấy mẫu. Plugin phải lấy mẫu lại/mã hóa cho nhà cung cấp.
- `listVoices` là tùy chọn theo từng nhà cung cấp. Dùng nó cho bộ chọn giọng nói do nhà cung cấp sở hữu hoặc các luồng thiết lập.
- Danh sách giọng nói có thể bao gồm siêu dữ liệu phong phú hơn như ngôn ngữ, giới tính và thẻ tính cách cho các bộ chọn nhận biết nhà cung cấp.
- OpenAI và ElevenLabs hiện hỗ trợ điện thoại. Microsoft thì không.

Plugin cũng có thể đăng ký nhà cung cấp giọng nói thông qua `api.registerSpeechProvider(...)`.

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
- Đầu vào Microsoft `edge` cũ được chuẩn hóa thành mã định danh nhà cung cấp `microsoft`.
- Mô hình sở hữu được ưu tiên là theo công ty: một Plugin nhà cung cấp có thể sở hữu
  nhà cung cấp văn bản, giọng nói, hình ảnh và phương tiện tương lai khi OpenClaw bổ sung các
  hợp đồng năng lực đó.

Đối với hiểu hình ảnh/âm thanh/video, Plugin đăng ký một
nhà cung cấp hiểu phương tiện có kiểu thay vì một túi khóa/giá trị chung:

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

- Giữ điều phối, fallback, cấu hình và kết nối kênh trong core.
- Giữ hành vi nhà cung cấp trong Plugin nhà cung cấp.
- Việc mở rộng cộng thêm nên vẫn có kiểu: các phương thức tùy chọn mới, các
  trường kết quả tùy chọn mới, các năng lực tùy chọn mới.
- Tạo video đã theo cùng mẫu:
  - core sở hữu hợp đồng năng lực và trình trợ giúp runtime
  - Plugin nhà cung cấp đăng ký `api.registerVideoGenerationProvider(...)`
  - Plugin tính năng/kênh tiêu thụ `api.runtime.videoGeneration.*`

Với các trình trợ giúp runtime hiểu phương tiện, Plugin có thể gọi:

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

Đối với chuyển lời nói thành văn bản, Plugin có thể dùng runtime hiểu phương tiện
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
- Trả về `{ text: undefined }` khi không tạo ra đầu ra chuyển lời nói thành văn bản nào (ví dụ đầu vào bị bỏ qua/không được hỗ trợ).
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

- `provider` và `model` là ghi đè tùy chọn theo từng lần chạy, không phải thay đổi phiên lâu dài.
- OpenClaw chỉ tôn trọng các trường ghi đè đó với bên gọi đáng tin cậy.
- Đối với các lần chạy fallback do Plugin sở hữu, người vận hành phải chọn tham gia bằng `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Dùng `plugins.entries.<id>.subagent.allowedModels` để giới hạn Plugin đáng tin cậy vào các mục tiêu `provider/model` chuẩn tắc cụ thể, hoặc `"*"` để cho phép rõ ràng mọi mục tiêu.
- Các lần chạy subagent của Plugin không đáng tin cậy vẫn hoạt động, nhưng yêu cầu ghi đè bị từ chối thay vì âm thầm fallback.
- Các phiên subagent do Plugin tạo được gắn thẻ bằng mã định danh Plugin tạo ra chúng. Fallback `api.runtime.subagent.deleteSession(...)` chỉ có thể xóa các phiên thuộc sở hữu đó; việc xóa phiên tùy ý vẫn yêu cầu một yêu cầu Gateway có phạm vi admin.

Đối với tìm kiếm web, Plugin có thể tiêu thụ trình trợ giúp runtime dùng chung thay vì
đi vào wiring công cụ agent:

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

Plugin cũng có thể đăng ký nhà cung cấp tìm kiếm web thông qua
`api.registerWebSearchProvider(...)`.

Ghi chú:

- Giữ lựa chọn nhà cung cấp, phân giải thông tin xác thực và ngữ nghĩa yêu cầu dùng chung trong core.
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
- `auth`: bắt buộc. Dùng `"gateway"` để yêu cầu xác thực gateway bình thường, hoặc `"plugin"` cho xác thực/xác minh webhook do Plugin quản lý.
- `match`: tùy chọn. `"exact"` (mặc định) hoặc `"prefix"`.
- `replaceExisting`: tùy chọn. Cho phép cùng Plugin thay thế đăng ký tuyến hiện có của chính nó.
- `handler`: trả về `true` khi tuyến đã xử lý yêu cầu.

Ghi chú:

- `api.registerHttpHandler(...)` đã bị gỡ bỏ và sẽ gây lỗi tải plugin. Thay vào đó hãy dùng `api.registerHttpRoute(...)`.
- Các tuyến Plugin phải khai báo `auth` rõ ràng.
- Các xung đột chính xác `path + match` sẽ bị từ chối trừ khi có `replaceExisting: true`, và một plugin không thể thay thế tuyến của plugin khác.
- Các tuyến chồng lấn với các mức `auth` khác nhau sẽ bị từ chối. Chỉ giữ các chuỗi chuyển tiếp `exact`/`prefix` ở cùng một mức auth.
- Các tuyến `auth: "plugin"` **không** tự động nhận phạm vi runtime của người vận hành. Chúng dành cho Webhook/xác minh chữ ký do plugin quản lý, không phải các lệnh gọi trợ giúp Gateway có đặc quyền.
- Các tuyến `auth: "gateway"` chạy bên trong phạm vi runtime yêu cầu Gateway, nhưng phạm vi đó được cố ý giới hạn thận trọng:
  - auth bearer bằng bí mật dùng chung (`gateway.auth.mode = "token"` / `"password"`) giữ phạm vi runtime của tuyến plugin cố định ở `operator.write`, ngay cả khi bên gọi gửi `x-openclaw-scopes`
  - các chế độ HTTP mang danh tính đáng tin cậy (ví dụ `trusted-proxy` hoặc `gateway.auth.mode = "none"` trên ingress riêng tư) chỉ tôn trọng `x-openclaw-scopes` khi header đó được cung cấp rõ ràng
  - nếu `x-openclaw-scopes` không có trên các yêu cầu tuyến plugin mang danh tính đó, phạm vi runtime sẽ quay về `operator.write`
- Quy tắc thực tế: đừng giả định một tuyến plugin dùng gateway-auth là một bề mặt quản trị ngầm định. Nếu tuyến của bạn cần hành vi chỉ dành cho quản trị viên, hãy yêu cầu chế độ auth mang danh tính và ghi rõ hợp đồng header `x-openclaw-scopes`.

## Đường dẫn import SDK Plugin

Hãy dùng các đường dẫn con SDK hẹp thay vì barrel gốc nguyên khối `openclaw/plugin-sdk`
khi tạo plugin mới. Các đường dẫn con lõi:

| Đường dẫn con                      | Mục đích                                            |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | Các nguyên hàm đăng ký Plugin                      |
| `openclaw/plugin-sdk/channel-core`  | Trợ giúp entry/build cho kênh                      |
| `openclaw/plugin-sdk/core`          | Trợ giúp dùng chung tổng quát và hợp đồng bao quát |
| `openclaw/plugin-sdk/config-schema` | Schema Zod gốc `openclaw.json` (`OpenClawSchema`)  |

Plugin kênh chọn từ một họ các seam hẹp — `channel-setup`,
`setup-runtime`, `setup-adapter-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-lifecycle`,
`channel-reply-pipeline`, `command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets`, và `channel-actions`. Hành vi phê duyệt nên được hợp nhất
trên một hợp đồng `approvalCapability` thay vì trộn lẫn qua các trường
plugin không liên quan. Xem [Plugin kênh](/vi/plugins/sdk-channel-plugins).

Các trợ giúp runtime và cấu hình nằm dưới các đường dẫn con `*-runtime` tập trung
tương ứng (`approval-runtime`, `agent-runtime`, `lazy-runtime`, `directory-runtime`,
`text-runtime`, `runtime-store`, `system-event-runtime`, `heartbeat-runtime`,
`channel-activity-runtime`, v.v.). Ưu tiên `config-types`,
`plugin-config-runtime`, `runtime-config-snapshot`, và `config-mutation`
thay vì barrel tương thích rộng `config-runtime`.

<Info>
`openclaw/plugin-sdk/channel-runtime`, `openclaw/plugin-sdk/config-runtime`,
và `openclaw/plugin-sdk/infra-runtime` là các shim tương thích đã lỗi thời cho
plugin cũ. Mã mới nên import các nguyên hàm tổng quát hẹp hơn.
</Info>

Điểm vào nội bộ repo (theo gốc package của từng plugin được đóng gói sẵn):

- `index.js` — entry plugin được đóng gói sẵn
- `api.js` — barrel trợ giúp/kiểu
- `runtime-api.js` — barrel chỉ dành cho runtime
- `setup-entry.js` — entry plugin thiết lập

Plugin bên ngoài chỉ nên import các đường dẫn con `openclaw/plugin-sdk/*`. Không bao giờ
import `src/*` của package plugin khác từ lõi hoặc từ plugin khác.
Các điểm vào được facade tải ưu tiên snapshot cấu hình runtime đang hoạt động khi có,
sau đó quay về tệp cấu hình đã được phân giải trên đĩa.

Các đường dẫn con theo năng lực như `image-generation`, `media-understanding`,
và `speech` tồn tại vì các plugin được đóng gói sẵn đang dùng chúng hiện nay. Chúng không
tự động là hợp đồng bên ngoài được đóng băng dài hạn — hãy kiểm tra trang tham chiếu SDK
liên quan khi dựa vào chúng.

## Schema công cụ tin nhắn

Plugin nên sở hữu các đóng góp schema `describeMessageTool(...)` theo kênh
cho các nguyên hàm không phải tin nhắn như reaction, trạng thái đã đọc, và bình chọn.
Phần trình bày gửi dùng chung nên dùng hợp đồng tổng quát `MessagePresentation`
thay vì các trường button, component, block, hoặc card gốc của provider.
Xem [Trình bày tin nhắn](/vi/plugins/message-presentation) để biết hợp đồng,
quy tắc fallback, ánh xạ provider, và checklist cho tác giả plugin.

Plugin có khả năng gửi khai báo những gì chúng có thể render thông qua năng lực tin nhắn:

- `presentation` cho các block trình bày theo ngữ nghĩa (`text`, `context`, `divider`, `buttons`, `select`)
- `delivery-pin` cho yêu cầu ghim khi gửi

Lõi quyết định render phần trình bày theo cách gốc hay hạ cấp thành văn bản.
Không phơi bày các lối thoát UI gốc của provider từ công cụ tin nhắn tổng quát.
Các trợ giúp SDK đã lỗi thời cho schema gốc cũ vẫn được export cho plugin
bên thứ ba hiện có, nhưng plugin mới không nên dùng chúng.

## Phân giải mục tiêu kênh

Plugin kênh nên sở hữu ngữ nghĩa mục tiêu theo kênh. Giữ host outbound dùng chung
ở mức tổng quát và dùng bề mặt adapter nhắn tin cho các quy tắc provider:

- `messaging.inferTargetChatType({ to })` quyết định một mục tiêu đã chuẩn hóa
  nên được xem là `direct`, `group`, hay `channel` trước khi tra cứu thư mục.
- `messaging.targetResolver.looksLikeId(raw, normalized)` cho lõi biết liệu một
  đầu vào có nên đi thẳng tới phân giải dạng id thay vì tìm kiếm thư mục hay không.
- `messaging.targetResolver.resolveTarget(...)` là fallback của plugin khi
  lõi cần lần phân giải cuối do provider sở hữu sau chuẩn hóa hoặc sau khi
  không tìm thấy trong thư mục.
- `messaging.resolveOutboundSessionRoute(...)` sở hữu việc xây dựng tuyến phiên
  theo provider sau khi mục tiêu đã được phân giải.

Cách tách khuyến nghị:

- Dùng `inferTargetChatType` cho các quyết định phân loại cần xảy ra trước khi
  tìm kiếm peer/nhóm.
- Dùng `looksLikeId` cho các kiểm tra "xem đây là id mục tiêu tường minh/gốc".
- Dùng `resolveTarget` cho fallback chuẩn hóa theo provider, không dùng cho
  tìm kiếm thư mục rộng.
- Giữ các id gốc của provider như chat id, thread id, JID, handle, và room id
  bên trong giá trị `target` hoặc tham số theo provider, không đặt trong các
  trường SDK tổng quát.

## Thư mục dựa trên cấu hình

Plugin suy ra mục nhập thư mục từ cấu hình nên giữ logic đó trong
plugin và tái sử dụng các trợ giúp dùng chung từ
`openclaw/plugin-sdk/directory-runtime`.

Dùng cách này khi một kênh cần peer/nhóm dựa trên cấu hình như:

- peer DM do allowlist điều khiển
- ánh xạ kênh/nhóm đã cấu hình
- fallback thư mục tĩnh theo phạm vi tài khoản

Các trợ giúp dùng chung trong `directory-runtime` chỉ xử lý các thao tác tổng quát:

- lọc truy vấn
- áp dụng giới hạn
- trợ giúp khử trùng lặp/chuẩn hóa
- xây dựng `ChannelDirectoryEntry[]`

Việc kiểm tra tài khoản và chuẩn hóa id theo kênh nên nằm trong phần triển khai
plugin.

## Catalog provider

Plugin provider có thể định nghĩa catalog model cho inference bằng
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` trả về cùng hình dạng mà OpenClaw ghi vào
`models.providers`:

- `{ provider }` cho một mục nhập provider
- `{ providers }` cho nhiều mục nhập provider

Dùng `catalog` khi plugin sở hữu id model theo provider, giá trị mặc định base URL,
hoặc metadata model bị chặn bởi auth.

`catalog.order` điều khiển thời điểm catalog của plugin được hợp nhất tương đối với
các provider ngầm định tích hợp sẵn của OpenClaw:

- `simple`: provider dùng API key thuần túy hoặc do env điều khiển
- `profile`: provider xuất hiện khi có auth profile
- `paired`: provider tổng hợp nhiều mục nhập provider liên quan
- `late`: lượt cuối, sau các provider ngầm định khác

Provider về sau thắng khi trùng khóa, vì vậy plugin có thể chủ ý ghi đè một
mục nhập provider tích hợp sẵn có cùng provider id.

Tương thích:

- `discovery` vẫn hoạt động như alias cũ
- nếu cả `catalog` và `discovery` đều được đăng ký, OpenClaw dùng `catalog`

## Kiểm tra kênh chỉ đọc

Nếu plugin của bạn đăng ký một kênh, hãy ưu tiên triển khai
`plugin.config.inspectAccount(cfg, accountId)` bên cạnh `resolveAccount(...)`.

Lý do:

- `resolveAccount(...)` là đường dẫn runtime. Nó được phép giả định thông tin xác thực
  đã được hiện thực hóa đầy đủ và có thể thất bại nhanh khi thiếu secret bắt buộc.
- Các đường dẫn lệnh chỉ đọc như `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve`, và các luồng sửa chữa
  doctor/config không nên cần hiện thực hóa thông tin xác thực runtime chỉ để
  mô tả cấu hình.

Hành vi `inspectAccount(...)` khuyến nghị:

- Chỉ trả về trạng thái tài khoản có tính mô tả.
- Giữ nguyên `enabled` và `configured`.
- Bao gồm các trường nguồn/trạng thái thông tin xác thực khi liên quan, chẳng hạn:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Bạn không cần trả về giá trị token thô chỉ để báo cáo khả năng sẵn dùng
  chỉ đọc. Trả về `tokenStatus: "available"` (và trường nguồn tương ứng)
  là đủ cho các lệnh kiểu trạng thái.
- Dùng `configured_unavailable` khi thông tin xác thực được cấu hình qua SecretRef nhưng
  không sẵn dùng trong đường dẫn lệnh hiện tại.

Điều này cho phép các lệnh chỉ đọc báo cáo "đã cấu hình nhưng không sẵn dùng trong
đường dẫn lệnh này" thay vì bị crash hoặc báo sai tài khoản là chưa được cấu hình.

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

Nếu plugin của bạn import npm deps, hãy cài chúng trong thư mục đó để
`node_modules` sẵn dùng (`npm install` / `pnpm install`).

Rào chắn bảo mật: mọi entry `openclaw.extensions` phải ở trong thư mục plugin
sau khi phân giải symlink. Các entry thoát khỏi thư mục package sẽ bị
từ chối.

Ghi chú bảo mật: `openclaw plugins install` cài dependencies của plugin bằng một
`npm install --omit=dev --ignore-scripts` cục bộ theo dự án (không có lifecycle scripts,
không có dev dependencies lúc runtime), bỏ qua các thiết lập npm install toàn cục được kế thừa.
Giữ cây dependency của plugin là "JS/TS thuần" và tránh các package yêu cầu
build `postinstall`.

Tùy chọn: `openclaw.setupEntry` có thể trỏ tới một module nhẹ chỉ dành cho thiết lập.
Khi OpenClaw cần các bề mặt thiết lập cho plugin kênh bị tắt, hoặc
khi plugin kênh được bật nhưng vẫn chưa cấu hình, nó tải `setupEntry`
thay vì entry plugin đầy đủ. Điều này giúp khởi động và thiết lập nhẹ hơn
khi entry plugin chính của bạn cũng nối công cụ, hook, hoặc mã chỉ dành cho runtime
khác.

Tùy chọn: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
có thể cho phép plugin kênh dùng cùng đường dẫn `setupEntry` trong giai đoạn
khởi động trước khi lắng nghe của gateway, ngay cả khi kênh đã được cấu hình.

Chỉ dùng điều này khi `setupEntry` bao phủ đầy đủ bề mặt khởi động bắt buộc phải tồn tại
trước khi gateway bắt đầu lắng nghe. Trong thực tế, điều đó nghĩa là entry thiết lập
phải đăng ký mọi năng lực do kênh sở hữu mà khởi động phụ thuộc vào, chẳng hạn:

- chính việc đăng ký kênh
- bất kỳ tuyến HTTP nào phải sẵn dùng trước khi gateway bắt đầu lắng nghe
- bất kỳ phương thức, công cụ, hoặc dịch vụ gateway nào phải tồn tại trong cùng khoảng thời gian đó

Nếu entry đầy đủ của bạn vẫn sở hữu bất kỳ năng lực khởi động bắt buộc nào, đừng bật
cờ này. Giữ plugin theo hành vi mặc định và để OpenClaw tải entry đầy đủ
trong lúc khởi động.

Các kênh được đóng gói sẵn cũng có thể xuất bản trợ giúp bề mặt hợp đồng chỉ dành cho thiết lập mà lõi
có thể tham chiếu trước khi runtime đầy đủ của kênh được tải. Bề mặt
thăng cấp thiết lập hiện tại là:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Phần lõi dùng bề mặt đó khi cần nâng cấp cấu hình kênh một tài khoản kiểu cũ
vào `channels.<id>.accounts.*` mà không tải đầy đủ mục Plugin.
Matrix là ví dụ đi kèm hiện tại: nó chỉ di chuyển các khóa xác thực/bootstrap vào một
tài khoản được nâng cấp có tên khi các tài khoản có tên đã tồn tại, và nó có thể giữ lại
một khóa tài khoản mặc định không chính tắc đã cấu hình thay vì luôn tạo
`accounts.default`.

Các bộ chuyển đổi bản vá thiết lập đó giữ cho việc khám phá bề mặt hợp đồng đi kèm được lười tải. Thời gian
import vẫn nhẹ; bề mặt nâng cấp chỉ được tải trong lần dùng đầu tiên thay vì
vào lại quá trình khởi động kênh đi kèm khi import mô-đun.

Khi các bề mặt khởi động đó bao gồm phương thức RPC của Gateway, hãy giữ chúng trên một
tiền tố riêng cho Plugin. Các không gian tên quản trị lõi (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) vẫn được dành riêng và luôn phân giải
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

Các Plugin kênh có thể quảng bá siêu dữ liệu thiết lập/khám phá qua `openclaw.channel` và
gợi ý cài đặt qua `openclaw.install`. Cách này giữ cho danh mục lõi không chứa dữ liệu.

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
- `preferOver`: các id Plugin/kênh có mức ưu tiên thấp hơn mà mục danh mục này nên xếp trên
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: các điều khiển nội dung cho bề mặt lựa chọn
- `markdownCapable`: đánh dấu kênh là hỗ trợ markdown cho các quyết định định dạng gửi đi
- `exposure.configured`: ẩn kênh khỏi các bề mặt liệt kê kênh đã cấu hình khi đặt thành `false`
- `exposure.setup`: ẩn kênh khỏi các bộ chọn thiết lập/cấu hình tương tác khi đặt thành `false`
- `exposure.docs`: đánh dấu kênh là nội bộ/riêng tư cho các bề mặt điều hướng tài liệu
- `showConfigured` / `showInSetup`: các bí danh cũ vẫn được chấp nhận để tương thích; ưu tiên `exposure`
- `quickstartAllowFrom`: đưa kênh vào luồng quickstart `allowFrom` tiêu chuẩn
- `forceAccountBinding`: yêu cầu ràng buộc tài khoản rõ ràng ngay cả khi chỉ có một tài khoản tồn tại
- `preferSessionLookupForAnnounceTarget`: ưu tiên tra cứu phiên khi phân giải mục tiêu thông báo

OpenClaw cũng có thể hợp nhất **các danh mục kênh bên ngoài** (ví dụ: một bản xuất
registry MPM). Đặt một tệp JSON tại một trong các vị trí:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Hoặc trỏ `OPENCLAW_PLUGIN_CATALOG_PATHS` (hoặc `OPENCLAW_MPM_CATALOG_PATHS`) tới
một hoặc nhiều tệp JSON (phân tách bằng dấu phẩy/dấu chấm phẩy/`PATH`). Mỗi tệp nên
chứa `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. Bộ phân tích cũng chấp nhận `"packages"` hoặc `"plugins"` làm bí danh cũ cho khóa `"entries"`.

Các mục danh mục kênh được tạo và các mục danh mục cài đặt nhà cung cấp hiển thị
các dữ kiện nguồn cài đặt đã chuẩn hóa bên cạnh khối `openclaw.install` thô. Các
dữ kiện đã chuẩn hóa xác định liệu spec npm là phiên bản chính xác hay bộ chọn
thả nổi, liệu siêu dữ liệu toàn vẹn kỳ vọng có hiện diện hay không, và liệu đường dẫn
nguồn cục bộ cũng có sẵn hay không. Khi danh tính danh mục/gói đã biết, các
dữ kiện đã chuẩn hóa cảnh báo nếu tên gói npm được phân tích lệch khỏi danh tính đó.
Chúng cũng cảnh báo khi `defaultChoice` không hợp lệ hoặc trỏ tới một nguồn
không có sẵn, và khi siêu dữ liệu toàn vẹn npm hiện diện mà không có nguồn npm
hợp lệ. Người tiêu thụ nên xem `installSource` là một trường tùy chọn bổ sung để
các mục dựng thủ công và lớp tương thích danh mục không phải tổng hợp trường này.
Điều này cho phép quá trình onboarding và chẩn đoán giải thích trạng thái mặt phẳng nguồn mà không
import runtime của Plugin.

Các mục npm bên ngoài chính thức nên ưu tiên một `npmSpec` chính xác cộng với
`expectedIntegrity`. Tên gói trần và dist-tag vẫn hoạt động để tương thích,
nhưng chúng hiển thị cảnh báo mặt phẳng nguồn để danh mục có thể tiến tới các bản cài đặt
được ghim và kiểm tra toàn vẹn mà không phá vỡ các Plugin hiện có.
Khi onboarding cài đặt từ một đường dẫn danh mục cục bộ, nó ghi lại một mục chỉ mục Plugin
được quản lý với `source: "path"` và một `sourcePath` tương đối với workspace
khi có thể. Đường dẫn tải vận hành tuyệt đối vẫn nằm trong
`plugins.load.paths`; bản ghi cài đặt tránh sao chép các đường dẫn máy trạm cục bộ
vào cấu hình tồn tại lâu dài. Điều này giữ cho các bản cài đặt phát triển cục bộ hiển thị với
chẩn đoán mặt phẳng nguồn mà không thêm bề mặt tiết lộ đường dẫn hệ thống tệp thô thứ hai.
Chỉ mục Plugin được lưu bền vững `plugins/installs.json` là nguồn sự thật về cài đặt
và có thể được làm mới mà không tải các mô-đun runtime của Plugin.
Bản đồ `installRecords` của nó vẫn bền vững ngay cả khi manifest của Plugin bị thiếu hoặc
không hợp lệ; mảng `plugins` của nó là một khung nhìn manifest có thể xây dựng lại.

## Plugin công cụ ngữ cảnh

Các Plugin công cụ ngữ cảnh sở hữu việc điều phối ngữ cảnh phiên cho nhập liệu, lắp ráp
và Compaction. Đăng ký chúng từ Plugin của bạn bằng
`api.registerContextEngine(id, factory)`, sau đó chọn công cụ đang hoạt động bằng
`plugins.slots.contextEngine`.

Dùng cách này khi Plugin của bạn cần thay thế hoặc mở rộng pipeline ngữ cảnh mặc định
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

Factory `ctx` hiển thị các giá trị tùy chọn `config`, `agentDir`, và `workspaceDir`
để khởi tạo tại thời điểm xây dựng.

Nếu công cụ của bạn **không** sở hữu thuật toán Compaction, hãy giữ `compact()`
được triển khai và ủy quyền rõ ràng:

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

Khi một Plugin cần hành vi không phù hợp với API hiện tại, đừng vượt qua
hệ thống Plugin bằng một truy cập riêng tư vào bên trong. Hãy thêm năng lực còn thiếu.

Trình tự khuyến nghị:

1. định nghĩa hợp đồng lõi
   Quyết định hành vi dùng chung nào phần lõi nên sở hữu: chính sách, fallback, hợp nhất cấu hình,
   vòng đời, ngữ nghĩa hướng tới kênh, và hình dạng helper runtime.
2. thêm các bề mặt đăng ký/runtime Plugin có kiểu
   Mở rộng `OpenClawPluginApi` và/hoặc `api.runtime` bằng bề mặt
   năng lực có kiểu nhỏ nhất nhưng hữu ích.
3. nối phần lõi + người tiêu thụ kênh/tính năng
   Các kênh và Plugin tính năng nên tiêu thụ năng lực mới thông qua phần lõi,
   không phải bằng cách import trực tiếp một triển khai vendor.
4. đăng ký các triển khai vendor
   Sau đó các Plugin vendor đăng ký backend của chúng với năng lực đó.
5. thêm phạm vi kiểm thử hợp đồng
   Thêm kiểm thử để hình dạng quyền sở hữu và đăng ký luôn rõ ràng theo thời gian.

Đây là cách OpenClaw giữ quan điểm rõ ràng mà không bị mã hóa cứng theo thế giới quan
của một nhà cung cấp. Xem [Sổ tay năng lực](/vi/plugins/architecture)
để có checklist tệp cụ thể và ví dụ đã triển khai.

### Checklist năng lực

Khi bạn thêm một năng lực mới, triển khai thường nên chạm tới các bề mặt này
cùng lúc:

- các kiểu hợp đồng lõi trong `src/<capability>/types.ts`
- helper runner/runtime lõi trong `src/<capability>/runtime.ts`
- bề mặt đăng ký API Plugin trong `src/plugins/types.ts`
- nối registry Plugin trong `src/plugins/registry.ts`
- hiển thị runtime Plugin trong `src/plugins/runtime/*` khi các Plugin tính năng/kênh
  cần tiêu thụ nó
- helper ghi nhận/kiểm thử trong `src/test-utils/plugin-registration.ts`
- khẳng định quyền sở hữu/hợp đồng trong `src/plugins/contracts/registry.ts`
- tài liệu dành cho operator/Plugin trong `docs/`

Nếu thiếu một trong các bề mặt đó, thường đó là dấu hiệu năng lực này
chưa được tích hợp đầy đủ.

### Mẫu năng lực

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

- phần lõi sở hữu hợp đồng năng lực + điều phối
- các Plugin vendor sở hữu triển khai vendor
- các Plugin tính năng/kênh tiêu thụ helper runtime
- kiểm thử hợp đồng giữ cho quyền sở hữu rõ ràng

## Liên quan

- [Kiến trúc Plugin](/vi/plugins/architecture) — mô hình và hình dạng năng lực công khai
- [Đường dẫn phụ Plugin SDK](/vi/plugins/sdk-subpaths)
- [Thiết lập Plugin SDK](/vi/plugins/sdk-setup)
- [Xây dựng Plugin](/vi/plugins/building-plugins)
