---
read_when:
    - Triển khai các móc nối thời gian chạy của nhà cung cấp, vòng đời kênh hoặc các bộ gói
    - Gỡ lỗi thứ tự tải Plugin hoặc trạng thái registry
    - Thêm khả năng Plugin mới hoặc Plugin công cụ ngữ cảnh
summary: 'Nội bộ kiến trúc Plugin: quy trình tải, sổ đăng ký, hook thời gian chạy, tuyến HTTP và bảng tham chiếu'
title: Nội bộ kiến trúc Plugin
x-i18n:
    generated_at: "2026-05-02T10:46:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2de741c4b496c7c3dd31dafebf39c4b9a32c5edd71bdd201c14037d9de31718f
    source_path: plugins/architecture-internals.md
    workflow: 16
---

Đối với mô hình năng lực công khai, hình dạng plugin và hợp đồng sở hữu/thực thi, hãy xem [kiến trúc Plugin](/vi/plugins/architecture). Trang này là tài liệu tham chiếu cho cơ chế nội bộ: quy trình tải, registry, hook runtime, tuyến HTTP Gateway, đường dẫn import và bảng schema.

## Quy trình tải

Khi khởi động, OpenClaw đại khái thực hiện như sau:

1. phát hiện các thư mục gốc plugin ứng viên
2. đọc manifest gói native hoặc tương thích và metadata package
3. từ chối các ứng viên không an toàn
4. chuẩn hóa cấu hình plugin (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. quyết định trạng thái bật cho từng ứng viên
6. tải các mô-đun native đã bật: các mô-đun bundled đã build dùng bộ tải native;
   mã nguồn TypeScript cục bộ của bên thứ ba dùng fallback Jiti khẩn cấp
7. gọi các hook native `register(api)` và thu thập đăng ký vào plugin registry
8. hiển thị registry cho các lệnh/bề mặt runtime

<Note>
`activate` là alias cũ của `register` — bộ tải phân giải mục nào hiện diện (`def.register ?? def.activate`) và gọi nó tại cùng thời điểm. Tất cả plugin bundled đều dùng `register`; hãy ưu tiên `register` cho plugin mới.
</Note>

Các cổng an toàn diễn ra **trước** khi thực thi runtime. Ứng viên bị chặn khi entry thoát khỏi thư mục gốc plugin, đường dẫn có quyền ghi cho mọi người, hoặc quyền sở hữu đường dẫn có vẻ đáng ngờ đối với plugin không bundled.

### Hành vi ưu tiên manifest

Manifest là nguồn sự thật của control plane. OpenClaw dùng nó để:

- nhận dạng plugin
- phát hiện kênh/Skills/schema cấu hình đã khai báo hoặc năng lực bundle
- xác thực `plugins.entries.<id>.config`
- bổ sung nhãn/placeholder của Control UI
- hiển thị metadata cài đặt/catalog
- giữ lại descriptor kích hoạt và thiết lập giá rẻ mà không cần tải plugin runtime

Đối với plugin native, mô-đun runtime là phần data plane. Nó đăng ký hành vi thực tế như hook, công cụ, lệnh hoặc luồng provider.

Các khối manifest tùy chọn `activation` và `setup` nằm trên control plane. Chúng chỉ là descriptor metadata cho lập kế hoạch kích hoạt và phát hiện thiết lập; chúng không thay thế đăng ký runtime, `register(...)` hoặc `setupEntry`. Những consumer kích hoạt live đầu tiên hiện dùng gợi ý lệnh, kênh và provider trong manifest để thu hẹp việc tải plugin trước khi materialize registry rộng hơn:

- việc tải CLI thu hẹp vào các plugin sở hữu lệnh chính được yêu cầu
- phân giải thiết lập/plugin kênh thu hẹp vào các plugin sở hữu id kênh được yêu cầu
- phân giải thiết lập/runtime provider tường minh thu hẹp vào các plugin sở hữu id provider được yêu cầu
- lập kế hoạch khởi động Gateway dùng `activation.onStartup` cho các import khởi động tường minh và lựa chọn không khởi động; plugin không có metadata khởi động chỉ tải thông qua các trigger kích hoạt hẹp hơn

Bộ lập kế hoạch kích hoạt cung cấp cả API chỉ có id cho các caller hiện có và API kế hoạch cho chẩn đoán mới. Các mục kế hoạch báo cáo lý do plugin được chọn, tách riêng các gợi ý planner `activation.*` tường minh khỏi fallback sở hữu manifest như `providers`, `channels`, `commandAliases`, `setup.providers`, `contracts.tools` và hook. Việc tách lý do đó là ranh giới tương thích: metadata plugin hiện có tiếp tục hoạt động, trong khi mã mới có thể phát hiện gợi ý rộng hoặc hành vi fallback mà không thay đổi ngữ nghĩa tải runtime.

Phát hiện thiết lập hiện ưu tiên các id do descriptor sở hữu như `setup.providers` và `setup.cliBackends` để thu hẹp plugin ứng viên trước khi fallback về `setup-api` cho những plugin vẫn cần hook runtime lúc thiết lập. Danh sách thiết lập provider dùng manifest `providerAuthChoices`, lựa chọn thiết lập dẫn xuất từ descriptor và metadata install-catalog mà không tải runtime provider. `setup.requiresRuntime: false` tường minh là điểm cắt chỉ dùng descriptor; `requiresRuntime` bị bỏ qua giữ fallback setup-api cũ để tương thích. Nếu có nhiều hơn một plugin đã phát hiện khai báo cùng id provider thiết lập hoặc backend CLI đã chuẩn hóa, lookup thiết lập từ chối chủ sở hữu mơ hồ thay vì dựa vào thứ tự phát hiện. Khi runtime thiết lập thực thi, chẩn đoán registry báo cáo drift giữa `setup.providers` / `setup.cliBackends` và các provider hoặc backend CLI được setup-api đăng ký mà không chặn plugin cũ.

### Ranh giới cache plugin

OpenClaw không cache kết quả phát hiện plugin hoặc dữ liệu manifest registry trực tiếp sau các cửa sổ theo đồng hồ. Cài đặt, chỉnh sửa manifest và thay đổi đường dẫn tải phải hiển thị ở lần đọc metadata tường minh hoặc rebuild snapshot tiếp theo. Trình phân tích file manifest có thể giữ cache chữ ký file có giới hạn, được khóa theo đường dẫn manifest đã mở, inode, kích thước và timestamp; cache đó chỉ tránh phân tích lại các byte không đổi và không được cache câu trả lời về phát hiện, registry, chủ sở hữu hoặc chính sách.

Đường nhanh metadata an toàn là sở hữu đối tượng tường minh, không phải cache ẩn. Các đường nóng khi khởi động Gateway nên truyền `PluginMetadataSnapshot`, `PluginLookUpTable` dẫn xuất hiện tại hoặc manifest registry tường minh qua chuỗi gọi. Xác thực cấu hình, tự động bật khi khởi động, bootstrap plugin và chọn provider có thể tái sử dụng các đối tượng đó khi chúng đại diện cho cấu hình và inventory plugin hiện tại. Lookup thiết lập vẫn dựng lại metadata manifest theo yêu cầu, trừ khi đường thiết lập cụ thể nhận manifest registry tường minh; hãy giữ đó là fallback đường lạnh thay vì thêm cache lookup ẩn. Khi đầu vào thay đổi, rebuild và thay thế snapshot thay vì mutate nó hoặc giữ các bản sao lịch sử.
Các view trên plugin registry đang hoạt động và helper bootstrap kênh bundled nên được tính lại từ registry/root hiện tại. Map ngắn hạn dùng trong một lần gọi để dedupe công việc hoặc chặn tái nhập là ổn; chúng không được trở thành cache metadata tiến trình.

Đối với tải plugin, lớp cache bền vững là tải runtime. Nó có thể tái sử dụng trạng thái bộ tải khi mã hoặc artifact đã cài đặt thực sự được tải, chẳng hạn như:

- `PluginLoaderCacheState` và registry runtime active tương thích
- cache jiti/module và cache bộ tải bề mặt công khai dùng để tránh import lặp lại cùng bề mặt runtime
- cache hệ thống file cho artifact plugin đã cài đặt
- map ngắn hạn theo lần gọi để chuẩn hóa đường dẫn hoặc phân giải trùng lặp

Những cache đó là chi tiết triển khai data plane. Chúng không được trả lời câu hỏi control plane như "plugin nào sở hữu provider này?" trừ khi caller cố ý yêu cầu tải runtime.

Không thêm cache bền vững hoặc theo đồng hồ cho:

- kết quả phát hiện
- manifest registry trực tiếp
- manifest registry được dựng lại từ chỉ mục plugin đã cài đặt
- lookup chủ sở hữu provider, chặn model, chính sách provider hoặc metadata public-artifact
- bất kỳ câu trả lời nào khác dẫn xuất từ manifest mà manifest, chỉ mục đã cài đặt hoặc đường dẫn tải đã thay đổi phải hiển thị ở lần đọc metadata tiếp theo

Caller rebuild metadata manifest từ chỉ mục plugin đã cài đặt được lưu bền vững sẽ dựng lại registry đó theo yêu cầu. Chỉ mục đã cài đặt là trạng thái source plane bền vững; nó không phải cache metadata ẩn trong tiến trình.

## Mô hình registry

Plugin đã tải không trực tiếp mutate các global core ngẫu nhiên. Chúng đăng ký vào một plugin registry trung tâm.

Registry theo dõi:

- bản ghi plugin (danh tính, nguồn, origin, trạng thái, chẩn đoán)
- công cụ
- hook legacy và hook typed
- kênh
- provider
- trình xử lý RPC Gateway
- tuyến HTTP
- registrar CLI
- dịch vụ nền
- lệnh do plugin sở hữu

Các tính năng core sau đó đọc từ registry đó thay vì nói chuyện trực tiếp với mô-đun plugin. Điều này giữ việc tải theo một chiều:

- mô-đun plugin -> đăng ký registry
- runtime core -> tiêu thụ registry

Sự tách biệt đó quan trọng cho khả năng bảo trì. Điều đó có nghĩa là hầu hết bề mặt core chỉ cần một điểm tích hợp: "đọc registry", không phải "xử lý đặc biệt từng mô-đun plugin".

## Callback ràng buộc hội thoại

Plugin ràng buộc một hội thoại có thể phản ứng khi một phê duyệt được giải quyết.

Dùng `api.onConversationBindingResolved(...)` để nhận callback sau khi yêu cầu ràng buộc được phê duyệt hoặc từ chối:

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
- `request`: tóm tắt yêu cầu gốc, gợi ý tách, id người gửi và metadata hội thoại

Callback này chỉ dùng để thông báo. Nó không thay đổi ai được phép ràng buộc một hội thoại, và nó chạy sau khi xử lý phê duyệt của core kết thúc.

## Hook runtime provider

Plugin provider có ba lớp:

- **Metadata manifest** cho lookup giá rẻ trước runtime:
  `setup.providers[].envVars`, `providerAuthEnvVars` tương thích đã deprecated,
  `providerAuthAliases`, `providerAuthChoices` và `channelEnvVars`.
- **Hook lúc cấu hình**: `catalog` (`discovery` legacy) cộng với
  `applyConfigDefaults`.
- **Hook runtime**: hơn 40 hook tùy chọn bao phủ xác thực, phân giải model,
  bọc stream, cấp độ suy nghĩ, chính sách replay và endpoint usage. Xem danh sách đầy đủ trong [Thứ tự và cách dùng hook](#hook-order-and-usage).

OpenClaw vẫn sở hữu vòng lặp agent chung, failover, xử lý transcript và chính sách công cụ. Các hook này là bề mặt extension cho hành vi đặc thù provider mà không cần toàn bộ transport suy luận tùy chỉnh.

Dùng manifest `setup.providers[].envVars` khi provider có credential dựa trên env mà các đường auth/status/model-picker chung nên thấy mà không tải runtime plugin. `providerAuthEnvVars` đã deprecated vẫn được adapter tương thích đọc trong cửa sổ deprecation, và plugin không bundled dùng nó sẽ nhận chẩn đoán manifest. Dùng manifest `providerAuthAliases` khi một id provider nên tái sử dụng env var, auth profile, auth được cấu hình hỗ trợ và lựa chọn onboarding API-key của một id provider khác. Dùng manifest `providerAuthChoices` khi các bề mặt CLI onboarding/lựa chọn auth nên biết id lựa chọn, nhãn nhóm và wiring auth một cờ đơn giản của provider mà không tải runtime provider. Giữ runtime provider `envVars` cho các gợi ý hướng tới operator như nhãn onboarding hoặc biến thiết lập client-id/client-secret OAuth.

Dùng manifest `channelEnvVars` khi một kênh có auth hoặc thiết lập do env điều khiển mà fallback shell-env chung, kiểm tra config/status hoặc prompt thiết lập nên thấy mà không tải runtime kênh.

### Thứ tự và cách dùng hook

Đối với plugin model/provider, OpenClaw gọi hook theo thứ tự đại khái này.
Cột "Khi nào dùng" là hướng dẫn quyết định nhanh.
Các trường provider chỉ để tương thích mà OpenClaw không còn gọi, chẳng hạn như `ProviderPlugin.capabilities` và `suppressBuiltInModel`, được cố ý không liệt kê ở đây.

| #   | Hook                              | Chức năng                                                                                                      | Khi nào sử dụng                                                                                                                              |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | Xuất bản cấu hình nhà cung cấp vào `models.providers` trong quá trình tạo `models.json`                       | Nhà cung cấp sở hữu catalog hoặc giá trị mặc định của base URL                                                                                |
| 2   | `applyConfigDefaults`             | Áp dụng các giá trị mặc định cấu hình toàn cục do nhà cung cấp sở hữu trong quá trình hiện thực hóa cấu hình  | Giá trị mặc định phụ thuộc vào chế độ xác thực, env, hoặc ngữ nghĩa họ mô hình của nhà cung cấp                                               |
| --  | _(tra cứu mô hình tích hợp sẵn)_  | OpenClaw thử đường dẫn registry/catalog thông thường trước                                                     | _(không phải Hook của Plugin)_                                                                                                                |
| 3   | `normalizeModelId`                | Chuẩn hóa các bí danh model-id cũ hoặc preview trước khi tra cứu                                               | Nhà cung cấp sở hữu việc dọn dẹp bí danh trước khi phân giải mô hình chính tắc                                                               |
| 4   | `normalizeTransport`              | Chuẩn hóa `api` / `baseUrl` thuộc họ nhà cung cấp trước khi lắp ráp mô hình chung                              | Nhà cung cấp sở hữu việc dọn dẹp transport cho các id nhà cung cấp tùy chỉnh trong cùng họ transport                                          |
| 5   | `normalizeConfig`                 | Chuẩn hóa `models.providers.<id>` trước khi phân giải runtime/nhà cung cấp                                    | Nhà cung cấp cần dọn dẹp cấu hình nên nằm cùng Plugin; các helper họ Google đi kèm cũng dự phòng cho các mục cấu hình Google được hỗ trợ     |
| 6   | `applyNativeStreamingUsageCompat` | Áp dụng các bản viết lại tương thích streaming-usage gốc cho nhà cung cấp cấu hình                            | Nhà cung cấp cần sửa metadata native streaming usage theo endpoint                                                                            |
| 7   | `resolveConfigApiKey`             | Phân giải xác thực env-marker cho nhà cung cấp cấu hình trước khi tải xác thực runtime                        | Nhà cung cấp có phân giải API-key env-marker do nhà cung cấp sở hữu; `amazon-bedrock` cũng có bộ phân giải AWS env-marker tích hợp tại đây   |
| 8   | `resolveSyntheticAuth`            | Hiển thị xác thực local/tự lưu trữ hoặc dựa trên cấu hình mà không lưu plaintext                               | Nhà cung cấp có thể hoạt động với marker thông tin xác thực tổng hợp/local                                                                    |
| 9   | `resolveExternalAuthProfiles`     | Phủ các hồ sơ xác thực bên ngoài do nhà cung cấp sở hữu; `persistence` mặc định là `runtime-only` cho thông tin xác thực do CLI/app sở hữu | Nhà cung cấp tái sử dụng thông tin xác thực bên ngoài mà không lưu refresh token đã sao chép; khai báo `contracts.externalAuthProviders` trong manifest |
| 10  | `shouldDeferSyntheticProfileAuth` | Hạ mức các placeholder hồ sơ tổng hợp đã lưu phía sau xác thực dựa trên env/cấu hình                           | Nhà cung cấp lưu các hồ sơ placeholder tổng hợp không nên được ưu tiên                                                                        |
| 11  | `resolveDynamicModel`             | Dự phòng đồng bộ cho các id mô hình do nhà cung cấp sở hữu chưa có trong registry cục bộ                       | Nhà cung cấp chấp nhận các id mô hình upstream tùy ý                                                                                          |
| 12  | `prepareDynamicModel`             | Khởi động bất đồng bộ, sau đó `resolveDynamicModel` chạy lại                                                   | Nhà cung cấp cần metadata mạng trước khi phân giải các id chưa biết                                                                           |
| 13  | `normalizeResolvedModel`          | Bản viết lại cuối cùng trước khi runner nhúng dùng mô hình đã phân giải                                        | Nhà cung cấp cần viết lại transport nhưng vẫn dùng transport lõi                                                                              |
| 14  | `contributeResolvedModelCompat`   | Đóng góp cờ tương thích cho mô hình vendor phía sau một transport tương thích khác                             | Nhà cung cấp nhận diện mô hình của chính mình trên proxy transport mà không tiếp quản nhà cung cấp                                            |
| 15  | `normalizeToolSchemas`            | Chuẩn hóa schema công cụ trước khi runner nhúng nhìn thấy chúng                                                | Nhà cung cấp cần dọn dẹp schema theo họ transport                                                                                             |
| 16  | `inspectToolSchemas`              | Hiển thị chẩn đoán schema do nhà cung cấp sở hữu sau khi chuẩn hóa                                             | Nhà cung cấp muốn cảnh báo keyword mà không dạy lõi các quy tắc riêng của nhà cung cấp                                                        |
| 17  | `resolveReasoningOutputMode`      | Chọn hợp đồng đầu ra suy luận gốc so với gắn thẻ                                                               | Nhà cung cấp cần đầu ra suy luận/cuối cùng gắn thẻ thay vì các trường gốc                                                                     |
| 18  | `prepareExtraParams`              | Chuẩn hóa tham số yêu cầu trước các wrapper tùy chọn stream chung                                              | Nhà cung cấp cần tham số yêu cầu mặc định hoặc dọn dẹp tham số theo từng nhà cung cấp                                                         |
| 19  | `createStreamFn`                  | Thay thế hoàn toàn đường dẫn stream thông thường bằng transport tùy chỉnh                                      | Nhà cung cấp cần giao thức wire tùy chỉnh, không chỉ một wrapper                                                                              |
| 20  | `wrapStreamFn`                    | Wrapper stream sau khi các wrapper chung được áp dụng                                                          | Nhà cung cấp cần wrapper tương thích headers/body/model của yêu cầu mà không có transport tùy chỉnh                                            |
| 21  | `resolveTransportTurnState`       | Đính kèm headers hoặc metadata transport gốc theo từng lượt                                                    | Nhà cung cấp muốn transport chung gửi định danh lượt gốc của nhà cung cấp                                                                     |
| 22  | `resolveWebSocketSessionPolicy`   | Đính kèm headers WebSocket gốc hoặc chính sách cool-down phiên                                                 | Nhà cung cấp muốn transport WS chung tinh chỉnh headers phiên hoặc chính sách dự phòng                                                        |
| 23  | `formatApiKey`                    | Bộ định dạng hồ sơ xác thực: hồ sơ đã lưu trở thành chuỗi `apiKey` runtime                                     | Nhà cung cấp lưu metadata xác thực bổ sung và cần hình dạng token runtime tùy chỉnh                                                           |
| 24  | `refreshOAuth`                    | Ghi đè làm mới OAuth cho endpoint làm mới tùy chỉnh hoặc chính sách lỗi làm mới                               | Nhà cung cấp không phù hợp với các bộ làm mới `pi-ai` dùng chung                                                                              |
| 25  | `buildAuthDoctorHint`             | Gợi ý sửa chữa được nối thêm khi làm mới OAuth thất bại                                                        | Nhà cung cấp cần hướng dẫn sửa chữa xác thực do nhà cung cấp sở hữu sau lỗi làm mới                                                           |
| 26  | `matchesContextOverflowError`     | Bộ khớp tràn cửa sổ ngữ cảnh do nhà cung cấp sở hữu                                                            | Nhà cung cấp có lỗi tràn thô mà heuristic chung sẽ bỏ sót                                                                                     |
| 27  | `classifyFailoverReason`          | Phân loại lý do chuyển dự phòng do nhà cung cấp sở hữu                                                         | Nhà cung cấp có thể ánh xạ lỗi API/transport thô sang rate-limit/overload/v.v.                                                               |
| 28  | `isCacheTtlEligible`              | Chính sách prompt-cache cho nhà cung cấp proxy/backhaul                                                        | Nhà cung cấp cần kiểm soát TTL bộ nhớ đệm riêng cho proxy                                                                                     |
| 29  | `buildMissingAuthMessage`         | Thay thế cho thông báo khôi phục thiếu xác thực chung                                                          | Nhà cung cấp cần gợi ý khôi phục thiếu xác thực riêng cho nhà cung cấp                                                                        |
| 30  | `augmentModelCatalog`             | Các hàng catalog tổng hợp/cuối cùng được nối thêm sau khi khám phá                                             | Nhà cung cấp cần các hàng tương thích tiến về trước tổng hợp trong `models list` và bộ chọn                                                   |
| 31  | `resolveThinkingProfile`          | Tập mức `/think` theo mô hình, nhãn hiển thị và mặc định                                                       | Nhà cung cấp phơi bày thang thinking tùy chỉnh hoặc nhãn nhị phân cho các mô hình được chọn                                                   |
| 32  | `isBinaryThinking`                | Hook tương thích bật/tắt suy luận                                                                              | Nhà cung cấp chỉ phơi bày bật/tắt thinking nhị phân                                                                                           |
| 33  | `supportsXHighThinking`           | Hook tương thích hỗ trợ suy luận `xhigh`                                                                       | Nhà cung cấp muốn `xhigh` chỉ trên một tập con mô hình                                                                                        |
| 34  | `resolveDefaultThinkingLevel`     | Hook tương thích mức `/think` mặc định                                                                         | Nhà cung cấp sở hữu chính sách `/think` mặc định cho một họ mô hình                                                                           |
| 35  | `isModernModelRef`                | Bộ khớp mô hình hiện đại cho bộ lọc hồ sơ live và lựa chọn smoke                                               | Nhà cung cấp sở hữu việc khớp mô hình ưu tiên live/smoke                                                                                      |
| 36  | `prepareRuntimeAuth`              | Trao đổi thông tin xác thực đã cấu hình thành token/key runtime thực tế ngay trước suy luận                    | Nhà cung cấp cần trao đổi token hoặc thông tin xác thực yêu cầu ngắn hạn                                                                      |
| 37  | `resolveUsageAuth`                | Phân giải thông tin xác thực mức sử dụng/thanh toán cho `/usage` và các bề mặt trạng thái liên quan                                     | Nhà cung cấp cần phân tích token mức sử dụng/hạn mức tùy chỉnh hoặc một thông tin xác thực mức sử dụng khác                                                               |
| 38  | `fetchUsageSnapshot`              | Tìm nạp và chuẩn hóa các ảnh chụp nhanh mức sử dụng/hạn mức theo từng nhà cung cấp sau khi xác thực được phân giải                             | Nhà cung cấp cần một endpoint mức sử dụng theo nhà cung cấp hoặc bộ phân tích payload                                                                           |
| 39  | `createEmbeddingProvider`         | Xây dựng adapter embedding do nhà cung cấp sở hữu cho bộ nhớ/tìm kiếm                                                     | Hành vi embedding bộ nhớ thuộc về Plugin nhà cung cấp                                                                                    |
| 40  | `buildReplayPolicy`               | Trả về chính sách phát lại kiểm soát việc xử lý transcript cho nhà cung cấp                                        | Nhà cung cấp cần chính sách transcript tùy chỉnh (ví dụ: loại bỏ thinking-block)                                                               |
| 41  | `sanitizeReplayHistory`           | Viết lại lịch sử phát lại sau khi dọn dẹp transcript chung                                                        | Nhà cung cấp cần các lượt viết lại phát lại theo nhà cung cấp ngoài các helper Compaction dùng chung                                                             |
| 42  | `validateReplayTurns`             | Xác thực hoặc định hình lại lượt phát lại cuối cùng trước runner được nhúng                                           | Phương thức truyền tải của nhà cung cấp cần xác thực lượt chặt chẽ hơn sau khi vệ sinh chung                                                                    |
| 43  | `onModelSelected`                 | Chạy các tác dụng phụ sau khi chọn do nhà cung cấp sở hữu                                                                 | Nhà cung cấp cần telemetry hoặc trạng thái do nhà cung cấp sở hữu khi một mô hình trở nên hoạt động                                                                  |

`normalizeModelId`, `normalizeTransport`, và `normalizeConfig` trước tiên kiểm tra
provider plugin khớp, rồi tiếp tục rơi qua các provider plugin khác có khả năng
hook cho đến khi một plugin thực sự thay đổi model id hoặc transport/config.
Điều đó giữ cho các shim provider alias/tương thích hoạt động mà không yêu cầu
caller biết bundled plugin nào sở hữu việc rewrite. Nếu không có provider hook nào
rewrite một mục cấu hình Google-family được hỗ trợ, bộ chuẩn hóa cấu hình Google
được bundled vẫn áp dụng bước dọn dẹp tương thích đó.

Nếu provider cần một wire protocol hoàn toàn tùy chỉnh hoặc custom request executor,
đó là một lớp extension khác. Các hook này dành cho hành vi provider
vẫn chạy trên vòng lặp inference thông thường của OpenClaw.

### Ví dụ provider

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

Các bundled provider plugin kết hợp các hook ở trên để phù hợp với catalog,
auth, thinking, replay, và nhu cầu usage của từng vendor. Bộ hook có thẩm quyền nằm cùng
mỗi plugin trong `extensions/`; trang này minh họa các dạng thay vì
phản chiếu danh sách.

<AccordionGroup>
  <Accordion title="Provider catalog pass-through">
    OpenRouter, Kilocode, Z.AI, xAI đăng ký `catalog` cùng với
    `resolveDynamicModel` / `prepareDynamicModel` để có thể hiển thị các
    model id upstream trước catalog tĩnh của OpenClaw.
  </Accordion>
  <Accordion title="Provider OAuth và endpoint usage">
    GitHub Copilot, Gemini CLI, ChatGPT Codex, MiniMax, Xiaomi, z.ai ghép
    `prepareRuntimeAuth` hoặc `formatApiKey` với `resolveUsageAuth` +
    `fetchUsageSnapshot` để sở hữu token exchange và tích hợp `/usage`.
  </Accordion>
  <Accordion title="Nhóm replay và dọn dẹp transcript">
    Các nhóm được đặt tên dùng chung (`google-gemini`, `passthrough-gemini`,
    `anthropic-by-model`, `hybrid-anthropic-openai`) cho phép provider chọn dùng
    transcript policy qua `buildReplayPolicy` thay vì mỗi plugin
    tự triển khai lại bước dọn dẹp.
  </Accordion>
  <Accordion title="Provider chỉ catalog">
    `byteplus`, `cloudflare-ai-gateway`, `huggingface`, `kimi-coding`, `nvidia`,
    `qianfan`, `synthetic`, `together`, `venice`, `vercel-ai-gateway`, và
    `volcengine` chỉ đăng ký `catalog` và dùng vòng lặp inference dùng chung.
  </Accordion>
  <Accordion title="Helper stream riêng cho Anthropic">
    Beta headers, `/fast` / `serviceTier`, và `context1m` nằm trong seam
    `api.ts` / `contract-api.ts` công khai của Anthropic plugin
    (`wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`) thay vì trong
    SDK chung.
  </Accordion>
</AccordionGroup>

## Runtime helper

Plugin có thể truy cập một số core helper qua `api.runtime`. Với TTS:

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
- Sử dụng cấu hình `messages.tts` của core và lựa chọn provider.
- Trả về buffer âm thanh PCM + sample rate. Plugin phải resample/encode cho provider.
- `listVoices` là tùy chọn theo từng provider. Dùng nó cho voice picker hoặc setup flow do vendor sở hữu.
- Danh sách voice có thể bao gồm metadata phong phú hơn như locale, gender, và personality tags cho picker nhận biết provider.
- OpenAI và ElevenLabs hiện hỗ trợ telephony. Microsoft thì không.

Plugin cũng có thể đăng ký speech provider qua `api.registerSpeechProvider(...)`.

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

- Giữ TTS policy, fallback, và reply delivery trong core.
- Dùng speech provider cho hành vi synthesis do vendor sở hữu.
- Input Microsoft `edge` legacy được chuẩn hóa thành provider id `microsoft`.
- Mô hình sở hữu được ưu tiên là theo công ty: một vendor plugin có thể sở hữu
  các provider text, speech, image, và media trong tương lai khi OpenClaw thêm các
  capability contract đó.

Đối với hiểu image/audio/video, plugin đăng ký một
media-understanding provider có kiểu thay vì một túi key/value chung:

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

- Giữ orchestration, fallback, config, và channel wiring trong core.
- Giữ hành vi vendor trong provider plugin.
- Mở rộng additive nên giữ có kiểu: method tùy chọn mới, field kết quả tùy chọn mới, capability tùy chọn mới.
- Video generation đã theo cùng mẫu:
  - core sở hữu capability contract và runtime helper
  - vendor plugin đăng ký `api.registerVideoGenerationProvider(...)`
  - feature/channel plugin sử dụng `api.runtime.videoGeneration.*`

Với runtime helper media-understanding, plugin có thể gọi:

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

Với audio transcription, plugin có thể dùng runtime media-understanding
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
- Sử dụng cấu hình audio media-understanding của core (`tools.media.audio`) và thứ tự fallback provider.
- Trả về `{ text: undefined }` khi không tạo ra output transcription nào (ví dụ input bị bỏ qua/không được hỗ trợ).
- `api.runtime.stt.transcribeAudioFile(...)` vẫn là alias tương thích.

Plugin cũng có thể chạy subagent nền qua `api.runtime.subagent`:

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

- `provider` và `model` là override tùy chọn theo từng lần chạy, không phải thay đổi session lâu dài.
- OpenClaw chỉ tôn trọng các field override đó cho caller đáng tin cậy.
- Với các lần chạy fallback do plugin sở hữu, operator phải opt in bằng `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Dùng `plugins.entries.<id>.subagent.allowedModels` để giới hạn plugin đáng tin cậy vào các target `provider/model` canonical cụ thể, hoặc `"*"` để cho phép rõ ràng bất kỳ target nào.
- Các lần chạy subagent từ plugin không đáng tin cậy vẫn hoạt động, nhưng yêu cầu override bị từ chối thay vì âm thầm fallback.
- Session subagent do plugin tạo được gắn tag bằng plugin id tạo ra. Fallback `api.runtime.subagent.deleteSession(...)` chỉ có thể xóa các session được sở hữu đó; xóa session tùy ý vẫn yêu cầu request Gateway có phạm vi admin.

Với web search, plugin có thể dùng runtime helper dùng chung thay vì
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

Plugin cũng có thể đăng ký web-search provider qua
`api.registerWebSearchProvider(...)`.

Ghi chú:

- Giữ provider selection, credential resolution, và ngữ nghĩa request dùng chung trong core.
- Dùng web-search provider cho search transport riêng theo vendor.
- `api.runtime.webSearch.*` là bề mặt dùng chung được ưu tiên cho feature/channel plugin cần hành vi search mà không phụ thuộc vào agent tool wrapper.

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

- `generate(...)`: tạo image bằng chuỗi provider image-generation đã cấu hình.
- `listProviders(...)`: liệt kê các provider image-generation có sẵn và capability của chúng.

## Route HTTP Gateway

Plugin có thể expose HTTP endpoint bằng `api.registerHttpRoute(...)`.

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

Field route:

- `path`: đường dẫn route dưới gateway HTTP server.
- `auth`: bắt buộc. Dùng `"gateway"` để yêu cầu auth gateway thông thường, hoặc `"plugin"` cho xác minh auth/webhook do plugin quản lý.
- `match`: tùy chọn. `"exact"` (mặc định) hoặc `"prefix"`.
- `replaceExisting`: tùy chọn. Cho phép cùng plugin thay thế đăng ký route hiện có của chính nó.
- `handler`: trả về `true` khi route đã xử lý request.

Ghi chú:

- `api.registerHttpHandler(...)` đã bị gỡ bỏ và sẽ gây lỗi tải Plugin. Thay vào đó, hãy dùng `api.registerHttpRoute(...)`.
- Các route của Plugin phải khai báo `auth` rõ ràng.
- Các xung đột chính xác theo `path + match` sẽ bị từ chối trừ khi có `replaceExisting: true`, và một Plugin không thể thay thế route của Plugin khác.
- Các route chồng lấn với các mức `auth` khác nhau sẽ bị từ chối. Chỉ giữ các chuỗi chuyển tiếp `exact`/`prefix` ở cùng một mức xác thực.
- Các route `auth: "plugin"` **không** tự động nhận phạm vi runtime của operator. Chúng dành cho webhook/xác minh chữ ký do Plugin quản lý, không phải các lệnh gọi trợ giúp Gateway đặc quyền.
- Các route `auth: "gateway"` chạy bên trong phạm vi runtime của yêu cầu Gateway, nhưng phạm vi đó được cố ý giữ thận trọng:
  - xác thực bearer bằng bí mật dùng chung (`gateway.auth.mode = "token"` / `"password"`) giữ phạm vi runtime của route Plugin cố định ở `operator.write`, ngay cả khi bên gọi gửi `x-openclaw-scopes`
  - các chế độ HTTP mang danh tính đáng tin cậy (ví dụ `trusted-proxy` hoặc `gateway.auth.mode = "none"` trên một ingress riêng tư) chỉ tôn trọng `x-openclaw-scopes` khi header được hiện diện rõ ràng
  - nếu `x-openclaw-scopes` vắng mặt trên các yêu cầu route Plugin mang danh tính đó, phạm vi runtime sẽ quay về `operator.write`
- Quy tắc thực tế: đừng giả định một route Plugin xác thực bằng Gateway là bề mặt quản trị ngầm định. Nếu route của bạn cần hành vi chỉ dành cho quản trị viên, hãy yêu cầu một chế độ xác thực mang danh tính và ghi tài liệu hợp đồng header `x-openclaw-scopes` rõ ràng.

## Đường dẫn import SDK của Plugin

Dùng các subpath SDK hẹp thay vì barrel gốc nguyên khối `openclaw/plugin-sdk`
khi tạo Plugin mới. Các subpath lõi:

| Subpath                             | Mục đích                                            |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | Các primitive đăng ký Plugin                       |
| `openclaw/plugin-sdk/channel-core`  | Trình trợ giúp entry/build cho kênh                |
| `openclaw/plugin-sdk/core`          | Trình trợ giúp dùng chung tổng quát và hợp đồng bao quát |
| `openclaw/plugin-sdk/config-schema` | Schema Zod gốc `openclaw.json` (`OpenClawSchema`) |

Plugin kênh chọn từ một họ các seam hẹp — `channel-setup`,
`setup-runtime`, `setup-adapter-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-lifecycle`,
`channel-reply-pipeline`, `command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets`, và `channel-actions`. Hành vi phê duyệt nên được hợp nhất
vào một hợp đồng `approvalCapability` thay vì trộn lẫn giữa các trường
Plugin không liên quan. Xem [Plugin kênh](/vi/plugins/sdk-channel-plugins).

Các trình trợ giúp runtime và cấu hình nằm dưới các subpath `*-runtime` tập trung
tương ứng (`approval-runtime`, `agent-runtime`, `lazy-runtime`, `directory-runtime`,
`text-runtime`, `runtime-store`, `system-event-runtime`, `heartbeat-runtime`,
`channel-activity-runtime`, v.v.). Ưu tiên `config-types`,
`plugin-config-runtime`, `runtime-config-snapshot`, và `config-mutation`
thay vì barrel tương thích rộng `config-runtime`.

<Info>
`openclaw/plugin-sdk/channel-runtime`, `openclaw/plugin-sdk/config-runtime`,
và `openclaw/plugin-sdk/infra-runtime` là các shim tương thích đã lỗi thời cho
Plugin cũ hơn. Mã mới nên import các primitive tổng quát hẹp hơn.
</Info>

Các điểm vào nội bộ repo (theo root package của mỗi Plugin đi kèm):

- `index.js` — entry Plugin đi kèm
- `api.js` — barrel trình trợ giúp/kiểu
- `runtime-api.js` — barrel chỉ dành cho runtime
- `setup-entry.js` — entry Plugin thiết lập

Plugin bên ngoài chỉ nên import các subpath `openclaw/plugin-sdk/*`. Không bao giờ
import `src/*` của package Plugin khác từ lõi hoặc từ Plugin khác.
Các điểm vào được tải qua facade ưu tiên snapshot cấu hình runtime đang hoạt động
khi có, rồi mới quay về tệp cấu hình đã phân giải trên đĩa.

Các subpath theo năng lực cụ thể như `image-generation`, `media-understanding`,
và `speech` tồn tại vì các Plugin đi kèm hiện đang dùng chúng. Chúng không
tự động là các hợp đồng bên ngoài được đóng băng dài hạn — hãy kiểm tra trang
tham chiếu SDK liên quan khi dựa vào chúng.

## Schema công cụ tin nhắn

Plugin nên sở hữu các đóng góp schema `describeMessageTool(...)` riêng cho kênh
đối với các primitive không phải tin nhắn như phản ứng, trạng thái đã đọc và bình chọn.
Phần trình bày gửi dùng chung nên dùng hợp đồng `MessagePresentation` tổng quát
thay vì các trường nút, thành phần, khối hoặc thẻ gốc của nhà cung cấp.
Xem [Trình bày tin nhắn](/vi/plugins/message-presentation) để biết hợp đồng,
quy tắc fallback, ánh xạ nhà cung cấp và danh sách kiểm tra cho tác giả Plugin.

Plugin có khả năng gửi khai báo những gì chúng có thể render thông qua năng lực tin nhắn:

- `presentation` cho các khối trình bày ngữ nghĩa (`text`, `context`, `divider`, `buttons`, `select`)
- `delivery-pin` cho các yêu cầu ghim khi gửi

Lõi quyết định render phần trình bày theo cách gốc hay hạ cấp thành văn bản.
Không phơi bày các lối thoát UI gốc của nhà cung cấp từ công cụ tin nhắn tổng quát.
Các trình trợ giúp SDK đã lỗi thời cho schema gốc legacy vẫn được export cho
Plugin bên thứ ba hiện có, nhưng Plugin mới không nên dùng chúng.

## Phân giải đích kênh

Plugin kênh nên sở hữu ngữ nghĩa đích riêng cho kênh. Giữ host outbound dùng chung
ở mức tổng quát và dùng bề mặt adapter nhắn tin cho các quy tắc nhà cung cấp:

- `messaging.inferTargetChatType({ to })` quyết định một đích đã chuẩn hóa
  nên được xem là `direct`, `group`, hay `channel` trước khi tra cứu thư mục.
- `messaging.targetResolver.looksLikeId(raw, normalized)` cho lõi biết liệu một
  đầu vào nên đi thẳng đến phân giải giống id thay vì tìm kiếm thư mục hay không.
- `messaging.targetResolver.resolveTarget(...)` là fallback của Plugin khi
  lõi cần một phân giải cuối cùng do nhà cung cấp sở hữu sau khi chuẩn hóa hoặc sau khi
  không tìm thấy trong thư mục.
- `messaging.resolveOutboundSessionRoute(...)` sở hữu việc xây dựng route phiên
  riêng cho nhà cung cấp sau khi một đích được phân giải.

Cách tách được khuyến nghị:

- Dùng `inferTargetChatType` cho các quyết định phân loại cần xảy ra trước khi
  tìm kiếm peer/nhóm.
- Dùng `looksLikeId` cho các kiểm tra "xem đây là id đích rõ ràng/gốc".
- Dùng `resolveTarget` cho fallback chuẩn hóa riêng theo nhà cung cấp, không phải cho
  tìm kiếm thư mục rộng.
- Giữ các id gốc của nhà cung cấp như chat id, thread id, JID, handle và room
  id bên trong các giá trị `target` hoặc tham số riêng theo nhà cung cấp, không nằm trong
  các trường SDK tổng quát.

## Thư mục dựa trên cấu hình

Plugin suy ra các mục thư mục từ cấu hình nên giữ logic đó trong
Plugin và tái sử dụng các trình trợ giúp dùng chung từ
`openclaw/plugin-sdk/directory-runtime`.

Dùng cách này khi một kênh cần peer/nhóm dựa trên cấu hình như:

- peer DM dựa trên allowlist
- map kênh/nhóm đã cấu hình
- fallback thư mục tĩnh theo phạm vi tài khoản

Các trình trợ giúp dùng chung trong `directory-runtime` chỉ xử lý các thao tác tổng quát:

- lọc truy vấn
- áp dụng giới hạn
- trình trợ giúp khử trùng lặp/chuẩn hóa
- xây dựng `ChannelDirectoryEntry[]`

Việc kiểm tra tài khoản và chuẩn hóa id riêng cho kênh nên nằm trong
phần triển khai Plugin.

## Catalog nhà cung cấp

Plugin nhà cung cấp có thể định nghĩa catalog model cho suy luận bằng
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` trả về cùng một hình dạng mà OpenClaw ghi vào
`models.providers`:

- `{ provider }` cho một mục nhà cung cấp
- `{ providers }` cho nhiều mục nhà cung cấp

Dùng `catalog` khi Plugin sở hữu id model riêng theo nhà cung cấp, mặc định base URL
hoặc metadata model được chặn bởi xác thực.

`catalog.order` kiểm soát thời điểm catalog của Plugin được hợp nhất tương đối với
các nhà cung cấp ngầm định tích hợp sẵn của OpenClaw:

- `simple`: nhà cung cấp thuần dựa trên API key hoặc env
- `profile`: nhà cung cấp xuất hiện khi có hồ sơ xác thực
- `paired`: nhà cung cấp tổng hợp nhiều mục nhà cung cấp liên quan
- `late`: lượt cuối, sau các nhà cung cấp ngầm định khác

Nhà cung cấp về sau sẽ thắng khi trùng khóa, vì vậy Plugin có thể cố ý ghi đè
một mục nhà cung cấp tích hợp sẵn có cùng id nhà cung cấp.

Tương thích:

- `discovery` vẫn hoạt động như một bí danh legacy
- nếu cả `catalog` và `discovery` đều được đăng ký, OpenClaw dùng `catalog`

## Kiểm tra kênh chỉ đọc

Nếu Plugin của bạn đăng ký một kênh, hãy ưu tiên triển khai
`plugin.config.inspectAccount(cfg, accountId)` cùng với `resolveAccount(...)`.

Lý do:

- `resolveAccount(...)` là đường dẫn runtime. Nó được phép giả định thông tin đăng nhập
  đã được hiện thực hóa đầy đủ và có thể thất bại nhanh khi thiếu secret bắt buộc.
- Các đường dẫn lệnh chỉ đọc như `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve`, và các luồng repair
  doctor/cấu hình không nên cần hiện thực hóa thông tin đăng nhập runtime chỉ để
  mô tả cấu hình.

Hành vi `inspectAccount(...)` được khuyến nghị:

- Chỉ trả về trạng thái tài khoản mô tả.
- Giữ nguyên `enabled` và `configured`.
- Bao gồm các trường nguồn/trạng thái thông tin đăng nhập khi liên quan, chẳng hạn:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Bạn không cần trả về giá trị token thô chỉ để báo cáo tính sẵn có
  chỉ đọc. Trả về `tokenStatus: "available"` (và trường nguồn tương ứng)
  là đủ cho các lệnh kiểu trạng thái.
- Dùng `configured_unavailable` khi một thông tin đăng nhập được cấu hình qua SecretRef nhưng
  không khả dụng trong đường dẫn lệnh hiện tại.

Điều này cho phép các lệnh chỉ đọc báo cáo "đã cấu hình nhưng không khả dụng trong
đường dẫn lệnh này" thay vì bị crash hoặc báo sai tài khoản là chưa cấu hình.

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
sẽ trở thành `name/<fileBase>`.

Nếu Plugin của bạn import dependency npm, hãy cài chúng trong thư mục đó để
`node_modules` khả dụng (`npm install` / `pnpm install`).

Lan can bảo mật: mọi entry `openclaw.extensions` phải nằm trong thư mục Plugin
sau khi phân giải symlink. Các entry thoát khỏi thư mục package sẽ bị
từ chối.

Ghi chú bảo mật: `openclaw plugins install` cài dependency của Plugin bằng một
`npm install --omit=dev --ignore-scripts` cục bộ trong dự án (không có script vòng đời,
không có dependency dev ở runtime), bỏ qua các thiết lập npm install toàn cục được kế thừa.
Giữ cây dependency của Plugin là "JS/TS thuần" và tránh các package yêu cầu
build `postinstall`.

Tùy chọn: `openclaw.setupEntry` có thể trỏ đến một module nhẹ chỉ dành cho thiết lập.
Khi OpenClaw cần các bề mặt thiết lập cho một Plugin kênh bị tắt, hoặc
khi một Plugin kênh được bật nhưng vẫn chưa cấu hình, nó sẽ tải `setupEntry`
thay vì entry Plugin đầy đủ. Điều này giúp startup và thiết lập nhẹ hơn
khi entry Plugin chính của bạn cũng nối dây công cụ, hook hoặc mã chỉ dành cho runtime khác.

Tùy chọn: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
có thể cho một Plugin kênh tham gia cùng đường dẫn `setupEntry` trong giai đoạn startup
trước khi gateway bắt đầu lắng nghe, ngay cả khi kênh đã được cấu hình.

Chỉ dùng tùy chọn này khi `setupEntry` bao phủ đầy đủ bề mặt startup phải tồn tại
trước khi gateway bắt đầu lắng nghe. Trên thực tế, điều đó nghĩa là entry thiết lập
phải đăng ký mọi năng lực do kênh sở hữu mà startup phụ thuộc vào, chẳng hạn:

- chính việc đăng ký kênh
- mọi route HTTP phải khả dụng trước khi gateway bắt đầu lắng nghe
- mọi phương thức, công cụ hoặc dịch vụ gateway phải tồn tại trong cùng khoảng thời gian đó

Nếu entry đầy đủ của bạn vẫn sở hữu bất kỳ năng lực startup bắt buộc nào, đừng bật
cờ này. Giữ Plugin theo hành vi mặc định và để OpenClaw tải
entry đầy đủ trong startup.

Các kênh đi kèm cũng có thể phát hành các trình trợ giúp bề mặt hợp đồng chỉ dành cho thiết lập mà lõi
có thể tham khảo trước khi runtime kênh đầy đủ được tải. Bề mặt nâng cấp thiết lập hiện tại là:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Core dùng bề mặt đó khi cần nâng cấp cấu hình kênh một tài khoản cũ vào
`channels.<id>.accounts.*` mà không tải toàn bộ điểm vào Plugin. Matrix là ví dụ
được đóng gói hiện tại: nó chỉ di chuyển các khóa auth/bootstrap vào một tài khoản
được nâng cấp có tên khi các tài khoản có tên đã tồn tại, và nó có thể giữ lại một
khóa tài khoản mặc định không chính tắc đã được cấu hình thay vì luôn tạo
`accounts.default`.

Các setup patch adapter đó giữ việc phát hiện bề mặt hợp đồng được đóng gói ở chế
độ lazy. Thời gian import vẫn nhẹ; bề mặt nâng cấp chỉ được tải ở lần dùng đầu tiên
thay vì đi lại vào quá trình khởi động kênh được đóng gói khi import module.

Khi các bề mặt khởi động đó bao gồm các phương thức RPC của Gateway, hãy giữ chúng
trên một tiền tố riêng cho Plugin. Các namespace quản trị Core (`config.*`,
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

Các Plugin kênh có thể công bố siêu dữ liệu thiết lập/phát hiện qua `openclaw.channel` và
gợi ý cài đặt qua `openclaw.install`. Điều này giữ cho danh mục Core không chứa dữ liệu.

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
- `markdownCapable`: đánh dấu kênh là có khả năng markdown cho các quyết định định dạng đầu ra
- `exposure.configured`: ẩn kênh khỏi các bề mặt liệt kê kênh đã cấu hình khi đặt thành `false`
- `exposure.setup`: ẩn kênh khỏi các bộ chọn thiết lập/cấu hình tương tác khi đặt thành `false`
- `exposure.docs`: đánh dấu kênh là nội bộ/riêng tư cho các bề mặt điều hướng tài liệu
- `showConfigured` / `showInSetup`: các bí danh cũ vẫn được chấp nhận để tương thích; ưu tiên `exposure`
- `quickstartAllowFrom`: đưa kênh vào luồng quickstart `allowFrom` tiêu chuẩn
- `forceAccountBinding`: yêu cầu liên kết tài khoản rõ ràng ngay cả khi chỉ tồn tại một tài khoản
- `preferSessionLookupForAnnounceTarget`: ưu tiên tra cứu phiên khi phân giải mục tiêu thông báo

OpenClaw cũng có thể hợp nhất **danh mục kênh bên ngoài** (ví dụ: bản xuất registry
MPM). Đặt một tệp JSON tại một trong các vị trí:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Hoặc trỏ `OPENCLAW_PLUGIN_CATALOG_PATHS` (hoặc `OPENCLAW_MPM_CATALOG_PATHS`) đến
một hoặc nhiều tệp JSON (phân tách bằng dấu phẩy/dấu chấm phẩy/`PATH`). Mỗi tệp nên
chứa `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. Bộ phân tích cũng chấp nhận `"packages"` hoặc `"plugins"` làm bí danh cũ cho khóa `"entries"`.

Các mục danh mục kênh được tạo và các mục danh mục cài đặt provider phơi bày
các dữ kiện nguồn cài đặt đã chuẩn hóa bên cạnh khối `openclaw.install` thô. Các
dữ kiện đã chuẩn hóa xác định liệu npm spec là phiên bản chính xác hay bộ chọn
floating, liệu siêu dữ liệu integrity dự kiến có hiện diện hay không, và liệu
một đường dẫn nguồn cục bộ cũng có sẵn hay không. Khi danh tính danh mục/gói đã
biết, các dữ kiện đã chuẩn hóa sẽ cảnh báo nếu tên gói npm được phân tích lệch
khỏi danh tính đó. Chúng cũng cảnh báo khi `defaultChoice` không hợp lệ hoặc trỏ
đến một nguồn không khả dụng, và khi siêu dữ liệu integrity của npm hiện diện mà
không có nguồn npm hợp lệ. Consumer nên coi `installSource` là một trường tùy chọn
bổ sung để các mục được tạo thủ công và shim danh mục không phải tổng hợp nó.
Điều này cho phép onboarding và chẩn đoán giải thích trạng thái mặt phẳng nguồn
mà không import runtime của Plugin.

Các mục npm bên ngoài chính thức nên ưu tiên một `npmSpec` chính xác cộng với
`expectedIntegrity`. Tên gói trần và dist-tag vẫn hoạt động để tương thích, nhưng
chúng hiển thị cảnh báo mặt phẳng nguồn để danh mục có thể tiến tới các cài đặt
được ghim và kiểm tra integrity mà không phá vỡ các Plugin hiện có.
Khi onboarding cài đặt từ một đường dẫn danh mục cục bộ, nó ghi lại một mục chỉ
mục Plugin được quản lý với `source: "path"` và một `sourcePath` tương đối với
workspace khi có thể. Đường dẫn tải vận hành tuyệt đối vẫn nằm trong
`plugins.load.paths`; bản ghi cài đặt tránh sao chép các đường dẫn workstation
cục bộ vào cấu hình lâu dài. Điều này giữ cho các cài đặt phát triển cục bộ hiển
thị với chẩn đoán mặt phẳng nguồn mà không thêm bề mặt tiết lộ đường dẫn hệ thống
tệp thô thứ hai. Chỉ mục Plugin được lưu bền `plugins/installs.json` là nguồn sự
thật cho nguồn cài đặt và có thể được làm mới mà không tải các module runtime của
Plugin. Map `installRecords` của nó bền ngay cả khi manifest Plugin bị thiếu hoặc
không hợp lệ; mảng `plugins` của nó là một chế độ xem manifest có thể xây dựng lại.

## Plugin engine ngữ cảnh

Các Plugin engine ngữ cảnh sở hữu việc điều phối ngữ cảnh phiên cho ingest, assembly,
và Compaction. Đăng ký chúng từ Plugin của bạn bằng
`api.registerContextEngine(id, factory)`, rồi chọn engine đang hoạt động bằng
`plugins.slots.contextEngine`.

Dùng phần này khi Plugin của bạn cần thay thế hoặc mở rộng pipeline ngữ cảnh mặc định
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

Nếu engine của bạn **không** sở hữu thuật toán Compaction, hãy giữ `compact()`
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
thống Plugin bằng một truy cập riêng tư vào bên trong. Hãy thêm capability còn thiếu.

Trình tự khuyến nghị:

1. định nghĩa hợp đồng Core
   Quyết định hành vi dùng chung nào Core nên sở hữu: policy, fallback, hợp nhất
   cấu hình, lifecycle, ngữ nghĩa hướng tới kênh, và hình dạng helper runtime.
2. thêm các bề mặt đăng ký/runtime Plugin có kiểu
   Mở rộng `OpenClawPluginApi` và/hoặc `api.runtime` bằng bề mặt capability có kiểu
   nhỏ nhất nhưng hữu ích.
3. nối Core + các consumer kênh/tính năng
   Các kênh và Plugin tính năng nên tiêu thụ capability mới thông qua Core,
   không phải bằng cách import trực tiếp một triển khai vendor.
4. đăng ký các triển khai vendor
   Sau đó các Plugin vendor đăng ký backend của chúng với capability.
5. thêm phạm vi kiểm thử hợp đồng
   Thêm kiểm thử để hình dạng sở hữu và đăng ký vẫn rõ ràng theo thời gian.

Đây là cách OpenClaw giữ lập trường rõ ràng mà không bị hardcode theo thế giới quan
của một provider. Xem [Capability Cookbook](/vi/plugins/architecture)
để có checklist tệp cụ thể và ví dụ hoàn chỉnh.

### Checklist capability

Khi bạn thêm một capability mới, phần triển khai thường nên chạm đồng thời các
bề mặt này:

- các kiểu hợp đồng Core trong `src/<capability>/types.ts`
- helper runner/runtime Core trong `src/<capability>/runtime.ts`
- bề mặt đăng ký API Plugin trong `src/plugins/types.ts`
- nối dây registry Plugin trong `src/plugins/registry.ts`
- phơi bày runtime Plugin trong `src/plugins/runtime/*` khi các Plugin tính năng/kênh
  cần tiêu thụ nó
- helper capture/test trong `src/test-utils/plugin-registration.ts`
- assertion sở hữu/hợp đồng trong `src/plugins/contracts/registry.ts`
- tài liệu operator/Plugin trong `docs/`

Nếu một trong các bề mặt đó bị thiếu, đó thường là dấu hiệu capability chưa được
tích hợp đầy đủ.

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

Điều đó giữ quy tắc đơn giản:

- Core sở hữu hợp đồng capability + điều phối
- các Plugin vendor sở hữu triển khai vendor
- các Plugin tính năng/kênh tiêu thụ helper runtime
- kiểm thử hợp đồng giữ quyền sở hữu rõ ràng

## Liên quan

- [Kiến trúc Plugin](/vi/plugins/architecture) — mô hình và hình dạng capability công khai
- [Đường dẫn phụ của Plugin SDK](/vi/plugins/sdk-subpaths)
- [Thiết lập Plugin SDK](/vi/plugins/sdk-setup)
- [Xây dựng Plugin](/vi/plugins/building-plugins)
