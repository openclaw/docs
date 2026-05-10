---
read_when:
    - Triển khai các móc nối thời gian chạy của nhà cung cấp, vòng đời kênh hoặc các gói đóng gói
    - Gỡ lỗi thứ tự tải Plugin hoặc trạng thái sổ đăng ký
    - Thêm năng lực Plugin mới hoặc Plugin công cụ ngữ cảnh
summary: 'Nội bộ kiến trúc Plugin: quy trình tải, registry, hook runtime, tuyến HTTP và bảng tham chiếu'
title: Nội bộ kiến trúc Plugin
x-i18n:
    generated_at: "2026-05-10T19:41:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: d41a28b83759906df693a00f3a20237bb7b91905eb948ff7bb354608e7997119
    source_path: plugins/architecture-internals.md
    workflow: 16
---

Đối với mô hình năng lực công khai, hình dạng Plugin và hợp đồng sở hữu/thực thi, hãy xem [Kiến trúc Plugin](/vi/plugins/architecture). Trang này là tài liệu tham chiếu cho cơ chế nội bộ: quy trình tải, registry, runtime hooks, các route HTTP của Gateway, đường dẫn import và bảng schema.

## Quy trình tải

Khi khởi động, OpenClaw đại khái thực hiện như sau:

1. khám phá các thư mục gốc Plugin ứng viên
2. đọc manifest bundle native hoặc tương thích và metadata package
3. từ chối các ứng viên không an toàn
4. chuẩn hóa cấu hình Plugin (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. quyết định trạng thái bật cho từng ứng viên
6. tải các mô-đun native đã bật: các mô-đun bundled đã build sử dụng loader native;
   mã nguồn TypeScript cục bộ của bên thứ ba sử dụng fallback Jiti khẩn cấp
7. gọi các hook native `register(api)` và thu thập đăng ký vào plugin registry
8. hiển thị registry cho các lệnh/bề mặt runtime

<Note>
`activate` là bí danh legacy cho `register` — loader phân giải mục nào hiện có (`def.register ?? def.activate`) và gọi nó tại cùng thời điểm. Tất cả bundled plugins đều dùng `register`; hãy ưu tiên `register` cho Plugin mới.
</Note>

Các cổng an toàn diễn ra **trước** khi thực thi runtime. Ứng viên bị chặn
khi entry thoát khỏi thư mục gốc Plugin, đường dẫn có thể ghi bởi mọi người, hoặc quyền sở hữu
đường dẫn có vẻ đáng ngờ đối với Plugin không bundled.

Ứng viên bị chặn vẫn được gắn với plugin id của chúng để chẩn đoán. Nếu cấu hình
vẫn tham chiếu id đó, validation báo cáo Plugin là có mặt nhưng bị chặn
và trỏ ngược lại cảnh báo an toàn đường dẫn thay vì xem entry cấu hình
là đã lỗi thời.

### Hành vi ưu tiên manifest

Manifest là nguồn sự thật của control-plane. OpenClaw dùng nó để:

- xác định Plugin
- khám phá channels/Skills/config schema hoặc bundle capabilities đã khai báo
- validate `plugins.entries.<id>.config`
- bổ sung labels/placeholders của Control UI
- hiển thị metadata install/catalog
- giữ lại activation và setup descriptors chi phí thấp mà không tải Plugin runtime

Đối với native plugins, mô-đun runtime là phần data-plane. Nó đăng ký
hành vi thực tế như hooks, tools, commands hoặc provider flows.

Các khối manifest tùy chọn `activation` và `setup` nằm trên control plane.
Chúng là descriptors chỉ có metadata cho lập kế hoạch activation và khám phá setup;
chúng không thay thế runtime registration, `register(...)`, hoặc `setupEntry`.
Các consumers activation trực tiếp đầu tiên hiện dùng hints command, channel và provider trong manifest
để thu hẹp việc tải Plugin trước khi materialize registry rộng hơn:

- CLI loading thu hẹp còn các Plugin sở hữu primary command được yêu cầu
- channel setup/plugin resolution thu hẹp còn các Plugin sở hữu
  channel id được yêu cầu
- explicit provider setup/runtime resolution thu hẹp còn các Plugin sở hữu
  provider id được yêu cầu
- Gateway startup planning dùng `activation.onStartup` cho các startup
  imports và startup opt-outs tường minh; Plugin không có startup metadata chỉ tải
  qua các activation triggers hẹp hơn

Các preload runtime tại thời điểm request yêu cầu scope rộng `all` vẫn suy ra một
tập plugin id hiệu lực tường minh từ cấu hình, startup planning, configured
channels, slots và auto-enable rules. Nếu tập suy ra đó trống, OpenClaw
tải một runtime registry trống thay vì mở rộng sang mọi Plugin có thể khám phá.

Activation planner hiển thị cả API chỉ gồm ids cho callers hiện có và một
plan API cho diagnostics mới. Plan entries báo cáo lý do một Plugin được chọn,
tách riêng planner hints `activation.*` tường minh khỏi manifest ownership
fallback như `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` và hooks. Phân tách lý do đó là ranh giới tương thích:
metadata Plugin hiện có tiếp tục hoạt động, trong khi mã mới có thể phát hiện hints rộng
hoặc fallback behavior mà không thay đổi runtime loading semantics.

Setup discovery hiện ưu tiên các id do descriptor sở hữu như `setup.providers` và
`setup.cliBackends` để thu hẹp Plugin ứng viên trước khi fallback về
`setup-api` cho các Plugin vẫn cần setup-time runtime hooks. Danh sách provider
setup dùng manifest `providerAuthChoices`, các setup choices suy ra từ descriptor
và metadata install-catalog mà không tải provider runtime. `setup.requiresRuntime: false`
tường minh là điểm cắt chỉ dùng descriptor; `requiresRuntime` bị bỏ qua
giữ fallback setup-api legacy để tương thích. Nếu nhiều hơn một Plugin được khám phá
claim cùng một normalized setup provider hoặc CLI backend id, setup lookup từ chối
owner mơ hồ thay vì dựa vào thứ tự discovery. Khi setup runtime thực thi,
registry diagnostics báo cáo drift giữa `setup.providers` / `setup.cliBackends` và
các providers hoặc CLI backends được đăng ký bởi setup-api mà không chặn legacy plugins.

### Ranh giới cache Plugin

OpenClaw không cache kết quả Plugin discovery hoặc dữ liệu direct manifest registry
phía sau các cửa sổ wall-clock. Installs, chỉnh sửa manifest và thay đổi load-path
phải hiển thị ở lần đọc metadata tường minh tiếp theo hoặc snapshot rebuild tiếp theo.
Manifest file parser có thể giữ một file-signature cache có giới hạn, keyed theo
đường dẫn manifest đã mở, inode, kích thước và timestamps; cache đó chỉ tránh
parse lại bytes không đổi và không được cache discovery, registry, owner hoặc
policy answers.

Fast path metadata an toàn là sở hữu object tường minh, không phải cache ẩn.
Các hot paths khi Gateway startup nên truyền `PluginMetadataSnapshot` hiện tại,
`PluginLookUpTable` suy ra, hoặc explicit manifest registry qua call chain.
Config validation, startup auto-enable, Plugin bootstrap và provider selection
có thể tái sử dụng các object đó trong khi chúng đại diện cho config hiện tại và
Plugin inventory. Setup lookup vẫn tái tạo manifest metadata theo nhu cầu
trừ khi setup path cụ thể nhận được explicit manifest registry; hãy giữ đó
là cold-path fallback thay vì thêm hidden lookup caches. Khi input
thay đổi, rebuild và thay thế snapshot thay vì mutate nó hoặc giữ
các bản sao lịch sử.
Views trên active plugin registry và bundled channel bootstrap helpers
nên được tính lại từ registry/root hiện tại. Short-lived maps có thể dùng được
trong một call để dedupe work hoặc guard reentry; chúng không được trở thành process
metadata caches.

Đối với Plugin loading, persistent cache layer là runtime loading. Nó có thể tái sử dụng
loader state khi code hoặc installed artifacts thực sự được tải, chẳng hạn:

- `PluginLoaderCacheState` và các active runtime registries tương thích
- jiti/module caches và public-surface loader caches dùng để tránh import
  cùng một runtime surface nhiều lần
- filesystem caches cho installed plugin artifacts
- short-lived per-call maps cho path normalization hoặc duplicate resolution

Các cache đó là chi tiết triển khai data-plane. Chúng không được trả lời
các câu hỏi control-plane như "Plugin nào sở hữu provider này?" trừ khi
caller cố ý yêu cầu runtime loading.

Không thêm persistent hoặc wall-clock caches cho:

- discovery results
- direct manifest registries
- manifest registries được tái tạo từ installed plugin index
- provider owner lookup, model suppression, provider policy hoặc public-artifact
  metadata
- bất kỳ manifest-derived answer nào khác trong đó manifest, installed index
  hoặc load path đã thay đổi phải hiển thị ở lần đọc metadata tiếp theo

Callers rebuild manifest metadata từ persisted installed plugin
index sẽ tái tạo registry đó theo nhu cầu. Installed index là durable
source-plane state; nó không phải hidden in-process metadata cache.

## Mô hình registry

Loaded plugins không trực tiếp mutate các core globals ngẫu nhiên. Chúng đăng ký vào một
central plugin registry.

Registry theo dõi:

- plugin records (identity, source, origin, status, diagnostics)
- tools
- legacy hooks và typed hooks
- channels
- providers
- gateway RPC handlers
- HTTP routes
- CLI registrars
- background services
- plugin-owned commands

Các core features sau đó đọc từ registry đó thay vì nói chuyện trực tiếp với Plugin modules.
Điều này giữ loading một chiều:

- plugin module -> registry registration
- core runtime -> registry consumption

Sự tách biệt đó quan trọng cho khả năng bảo trì. Nó có nghĩa là hầu hết core surfaces chỉ
cần một integration point: "read the registry", không phải "special-case every plugin
module".

## Callbacks liên kết cuộc trò chuyện

Plugin liên kết một cuộc trò chuyện có thể phản ứng khi một phê duyệt được giải quyết.

Dùng `api.onConversationBindingResolved(...)` để nhận callback sau khi một bind
request được approved hoặc denied:

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

Các trường callback payload:

- `status`: `"approved"` hoặc `"denied"`
- `decision`: `"allow-once"`, `"allow-always"`, hoặc `"deny"`
- `binding`: binding đã resolve cho approved requests
- `request`: original request summary, detach hint, sender id và
  conversation metadata

Callback này chỉ để thông báo. Nó không thay đổi ai được phép bind một
cuộc trò chuyện, và nó chạy sau khi core approval handling hoàn tất.

## Provider runtime hooks

Provider plugins có ba lớp:

- **Manifest metadata** cho lookup pre-runtime chi phí thấp:
  `setup.providers[].envVars`, deprecated compatibility `providerAuthEnvVars`,
  `providerAuthAliases`, `providerAuthChoices` và `channelEnvVars`.
- **Config-time hooks**: `catalog` (legacy `discovery`) cộng với
  `applyConfigDefaults`.
- **Runtime hooks**: hơn 40 optional hooks bao phủ auth, model resolution,
  stream wrapping, thinking levels, replay policy và usage endpoints. Xem
  danh sách đầy đủ tại [Thứ tự và cách dùng hook](#hook-order-and-usage).

OpenClaw vẫn sở hữu generic agent loop, failover, transcript handling và
tool policy. Các hook này là extension surface cho hành vi đặc thù provider
mà không cần toàn bộ custom inference transport.

Dùng manifest `setup.providers[].envVars` khi provider có credentials dựa trên env
mà các đường generic auth/status/model-picker cần thấy mà không
tải plugin runtime. Deprecated `providerAuthEnvVars` vẫn được đọc bởi
compatibility adapter trong giai đoạn deprecation window, và non-bundled plugins
dùng nó nhận được manifest diagnostic. Dùng manifest `providerAuthAliases`
khi một provider id nên tái sử dụng env vars, auth profiles,
config-backed auth và API-key onboarding choice của provider id khác. Dùng manifest
`providerAuthChoices` khi các onboarding/auth-choice CLI surfaces cần biết
choice id, group labels và simple one-flag auth wiring của provider mà không
tải provider runtime. Giữ provider runtime
`envVars` cho operator-facing hints như onboarding labels hoặc OAuth
client-id/client-secret setup vars.

Dùng manifest `channelEnvVars` khi một channel có auth hoặc setup dựa trên env mà
generic shell-env fallback, config/status checks hoặc setup prompts cần thấy
mà không tải channel runtime.

### Thứ tự và cách dùng hook

Đối với model/provider plugins, OpenClaw gọi hooks theo thứ tự đại khái này.
Cột "Khi nào dùng" là hướng dẫn quyết định nhanh.
Các trường provider chỉ dành cho tương thích mà OpenClaw không còn gọi, chẳng hạn
`ProviderPlugin.capabilities` và `suppressBuiltInModel`, được chủ ý không
liệt kê ở đây.

| #   | Hook                              | Chức năng                                                                                                      | Khi nào sử dụng                                                                                                                              |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | Công bố cấu hình nhà cung cấp vào `models.providers` trong quá trình tạo `models.json`                        | Nhà cung cấp sở hữu một catalog hoặc giá trị mặc định cho URL cơ sở                                                                           |
| 2   | `applyConfigDefaults`             | Áp dụng các giá trị mặc định cấu hình toàn cục do nhà cung cấp sở hữu trong quá trình hiện thực hóa cấu hình  | Giá trị mặc định phụ thuộc vào chế độ xác thực, env, hoặc ngữ nghĩa họ mô hình của nhà cung cấp                                               |
| --  | _(tra cứu mô hình tích hợp)_      | OpenClaw thử đường dẫn registry/catalog thông thường trước                                                     | _(không phải hook của Plugin)_                                                                                                                |
| 3   | `normalizeModelId`                | Chuẩn hóa alias model-id cũ hoặc preview trước khi tra cứu                                                     | Nhà cung cấp sở hữu việc dọn dẹp alias trước khi phân giải mô hình chính tắc                                                                 |
| 4   | `normalizeTransport`              | Chuẩn hóa `api` / `baseUrl` của họ nhà cung cấp trước khi lắp ráp mô hình chung                                | Nhà cung cấp sở hữu việc dọn dẹp transport cho các id nhà cung cấp tùy chỉnh trong cùng họ transport                                         |
| 5   | `normalizeConfig`                 | Chuẩn hóa `models.providers.<id>` trước khi phân giải runtime/nhà cung cấp                                    | Nhà cung cấp cần dọn dẹp cấu hình nên nằm trong Plugin; các helper họ Google đi kèm cũng hỗ trợ dự phòng cho các mục cấu hình Google được hỗ trợ |
| 6   | `applyNativeStreamingUsageCompat` | Áp dụng các lần ghi lại tương thích usage streaming gốc cho các nhà cung cấp cấu hình                         | Nhà cung cấp cần sửa metadata usage streaming gốc theo endpoint                                                                               |
| 7   | `resolveConfigApiKey`             | Phân giải xác thực env-marker cho nhà cung cấp cấu hình trước khi tải xác thực runtime                        | Nhà cung cấp có phân giải API key env-marker do nhà cung cấp sở hữu; `amazon-bedrock` cũng có bộ phân giải env-marker AWS tích hợp tại đây   |
| 8   | `resolveSyntheticAuth`            | Hiển thị xác thực cục bộ/tự lưu trữ hoặc dựa trên cấu hình mà không lưu plaintext                             | Nhà cung cấp có thể hoạt động với một marker credential tổng hợp/cục bộ                                                                       |
| 9   | `resolveExternalAuthProfiles`     | Phủ các hồ sơ xác thực bên ngoài do nhà cung cấp sở hữu; `persistence` mặc định là `runtime-only` cho credential do CLI/app sở hữu | Nhà cung cấp tái sử dụng credential xác thực bên ngoài mà không lưu refresh token đã sao chép; khai báo `contracts.externalAuthProviders` trong manifest |
| 10  | `shouldDeferSyntheticProfileAuth` | Hạ ưu tiên các placeholder hồ sơ tổng hợp đã lưu phía sau xác thực dựa trên env/cấu hình                      | Nhà cung cấp lưu các hồ sơ placeholder tổng hợp không nên thắng về mức ưu tiên                                                               |
| 11  | `resolveDynamicModel`             | Dự phòng đồng bộ cho id mô hình do nhà cung cấp sở hữu chưa có trong registry cục bộ                          | Nhà cung cấp chấp nhận id mô hình upstream tùy ý                                                                                              |
| 12  | `prepareDynamicModel`             | Khởi động nóng bất đồng bộ, rồi `resolveDynamicModel` chạy lại                                                 | Nhà cung cấp cần metadata mạng trước khi phân giải id chưa biết                                                                               |
| 13  | `normalizeResolvedModel`          | Ghi lại cuối cùng trước khi runner nhúng sử dụng mô hình đã phân giải                                          | Nhà cung cấp cần ghi lại transport nhưng vẫn dùng transport lõi                                                                               |
| 14  | `contributeResolvedModelCompat`   | Đóng góp cờ tương thích cho mô hình vendor phía sau một transport tương thích khác                             | Nhà cung cấp nhận diện mô hình của chính mình trên transport proxy mà không tiếp quản nhà cung cấp                                           |
| 15  | `normalizeToolSchemas`            | Chuẩn hóa schema công cụ trước khi runner nhúng nhìn thấy chúng                                                | Nhà cung cấp cần dọn dẹp schema theo họ transport                                                                                             |
| 16  | `inspectToolSchemas`              | Hiển thị chẩn đoán schema do nhà cung cấp sở hữu sau khi chuẩn hóa                                             | Nhà cung cấp muốn cảnh báo từ khóa mà không dạy lõi các quy tắc riêng theo nhà cung cấp                                                      |
| 17  | `resolveReasoningOutputMode`      | Chọn hợp đồng đầu ra reasoning gốc so với gắn thẻ                                                             | Nhà cung cấp cần reasoning/đầu ra cuối cùng dạng gắn thẻ thay vì trường gốc                                                                   |
| 18  | `prepareExtraParams`              | Chuẩn hóa tham số yêu cầu trước các wrapper tùy chọn stream chung                                              | Nhà cung cấp cần tham số yêu cầu mặc định hoặc dọn dẹp tham số theo từng nhà cung cấp                                                        |
| 19  | `createStreamFn`                  | Thay thế hoàn toàn đường dẫn stream thông thường bằng transport tùy chỉnh                                      | Nhà cung cấp cần giao thức dây tùy chỉnh, không chỉ một wrapper                                                                               |
| 20  | `wrapStreamFn`                    | Wrapper stream sau khi các wrapper chung đã được áp dụng                                                       | Nhà cung cấp cần wrapper tương thích header/body/model của yêu cầu mà không cần transport tùy chỉnh                                          |
| 21  | `resolveTransportTurnState`       | Gắn header hoặc metadata transport gốc theo từng lượt                                                          | Nhà cung cấp muốn transport chung gửi danh tính lượt gốc của nhà cung cấp                                                                    |
| 22  | `resolveWebSocketSessionPolicy`   | Gắn header WebSocket gốc hoặc chính sách hạ nhiệt phiên                                                        | Nhà cung cấp muốn transport WS chung tinh chỉnh header phiên hoặc chính sách dự phòng                                                        |
| 23  | `formatApiKey`                    | Bộ định dạng hồ sơ xác thực: hồ sơ đã lưu trở thành chuỗi `apiKey` runtime                                     | Nhà cung cấp lưu metadata xác thực bổ sung và cần hình dạng token runtime tùy chỉnh                                                          |
| 24  | `refreshOAuth`                    | Ghi đè làm mới OAuth cho endpoint làm mới tùy chỉnh hoặc chính sách lỗi làm mới                               | Nhà cung cấp không phù hợp với các bộ làm mới `pi-ai` dùng chung                                                                              |
| 25  | `buildAuthDoctorHint`             | Gợi ý sửa chữa được thêm vào khi làm mới OAuth thất bại                                                        | Nhà cung cấp cần hướng dẫn sửa xác thực do nhà cung cấp sở hữu sau lỗi làm mới                                                               |
| 26  | `matchesContextOverflowError`     | Bộ khớp tràn cửa sổ ngữ cảnh do nhà cung cấp sở hữu                                                           | Nhà cung cấp có lỗi tràn thô mà heuristic chung sẽ bỏ sót                                                                                     |
| 27  | `classifyFailoverReason`          | Phân loại lý do failover do nhà cung cấp sở hữu                                                               | Nhà cung cấp có thể ánh xạ lỗi API/transport thô sang rate-limit/quá tải/v.v.                                                                |
| 28  | `isCacheTtlEligible`              | Chính sách prompt-cache cho nhà cung cấp proxy/backhaul                                                       | Nhà cung cấp cần cổng kiểm soát TTL cache riêng cho proxy                                                                                     |
| 29  | `buildMissingAuthMessage`         | Thay thế thông báo khôi phục thiếu xác thực chung                                                             | Nhà cung cấp cần gợi ý khôi phục thiếu xác thực riêng theo nhà cung cấp                                                                      |
| 30  | `augmentModelCatalog`             | Các hàng catalog tổng hợp/cuối cùng được thêm sau discovery                                                   | Nhà cung cấp cần hàng forward-compat tổng hợp trong `models list` và bộ chọn                                                                 |
| 31  | `resolveThinkingProfile`          | Tập cấp `/think` riêng theo mô hình, nhãn hiển thị và mặc định                                                | Nhà cung cấp phơi bày một thang thinking tùy chỉnh hoặc nhãn nhị phân cho các mô hình đã chọn                                                |
| 32  | `isBinaryThinking`                | Hook tương thích bật/tắt reasoning                                                                            | Nhà cung cấp chỉ phơi bày thinking nhị phân bật/tắt                                                                                           |
| 33  | `supportsXHighThinking`           | Hook tương thích hỗ trợ reasoning `xhigh`                                                                     | Nhà cung cấp muốn `xhigh` chỉ trên một tập con mô hình                                                                                        |
| 34  | `resolveDefaultThinkingLevel`     | Hook tương thích cấp `/think` mặc định                                                                        | Nhà cung cấp sở hữu chính sách `/think` mặc định cho một họ mô hình                                                                           |
| 35  | `isModernModelRef`                | Bộ khớp mô hình hiện đại cho bộ lọc hồ sơ live và lựa chọn smoke                                              | Nhà cung cấp sở hữu việc khớp mô hình ưu tiên cho live/smoke                                                                                  |
| 36  | `prepareRuntimeAuth`              | Trao đổi credential đã cấu hình thành token/key runtime thực tế ngay trước inference                          | Nhà cung cấp cần trao đổi token hoặc credential yêu cầu ngắn hạn                                                                              |
| 37  | `resolveUsageAuth`                | Phân giải thông tin xác thực sử dụng/thanh toán cho `/usage` và các giao diện trạng thái liên quan                                     | Nhà cung cấp cần phân tích cú pháp token sử dụng/hạn mức tùy chỉnh hoặc một thông tin xác thực sử dụng khác                                                               |
| 38  | `fetchUsageSnapshot`              | Tìm nạp và chuẩn hóa các ảnh chụp nhanh sử dụng/hạn mức dành riêng cho nhà cung cấp sau khi thông tin xác thực được phân giải                             | Nhà cung cấp cần một điểm cuối sử dụng dành riêng cho nhà cung cấp hoặc bộ phân tích cú pháp payload                                                                           |
| 39  | `createEmbeddingProvider`         | Xây dựng bộ chuyển đổi nhúng do nhà cung cấp sở hữu cho bộ nhớ/tìm kiếm                                                     | Hành vi nhúng bộ nhớ thuộc về Plugin của nhà cung cấp                                                                                    |
| 40  | `buildReplayPolicy`               | Trả về chính sách phát lại kiểm soát việc xử lý bản ghi hội thoại cho nhà cung cấp                                        | Nhà cung cấp cần chính sách bản ghi hội thoại tùy chỉnh (ví dụ: loại bỏ khối suy nghĩ)                                                               |
| 41  | `sanitizeReplayHistory`           | Viết lại lịch sử phát lại sau khi dọn dẹp bản ghi hội thoại chung                                                        | Nhà cung cấp cần các lần viết lại phát lại dành riêng cho nhà cung cấp ngoài các trình trợ giúp Compaction dùng chung                                                             |
| 42  | `validateReplayTurns`             | Xác thực hoặc định hình lại lượt phát lại cuối cùng trước runner được nhúng                                           | Cơ chế truyền tải của nhà cung cấp cần xác thực lượt nghiêm ngặt hơn sau bước làm sạch chung                                                                    |
| 43  | `onModelSelected`                 | Chạy các hiệu ứng phụ sau chọn do nhà cung cấp sở hữu                                                                 | Nhà cung cấp cần dữ liệu đo từ xa hoặc trạng thái do nhà cung cấp sở hữu khi một mô hình trở nên hoạt động                                                                  |

`normalizeModelId`, `normalizeTransport`, và `normalizeConfig` trước tiên kiểm tra
Plugin nhà cung cấp khớp, sau đó chuyển tiếp qua các Plugin nhà cung cấp khác
có hỗ trợ hook cho đến khi một Plugin thực sự thay đổi id mô hình hoặc
transport/config. Điều đó giúp các shim nhà cung cấp alias/compat tiếp tục hoạt
động mà không yêu cầu bên gọi biết Plugin tích hợp nào sở hữu phần ghi lại. Nếu
không có hook nhà cung cấp nào ghi lại một mục cấu hình thuộc họ Google được hỗ
trợ, bộ chuẩn hóa cấu hình Google tích hợp vẫn áp dụng phần dọn dẹp tương thích
đó.

Nếu nhà cung cấp cần một giao thức truyền tải hoàn toàn tùy chỉnh hoặc trình
thực thi yêu cầu tùy chỉnh, đó là một lớp mở rộng khác. Các hook này dành cho
hành vi nhà cung cấp vẫn chạy trên vòng lặp suy luận bình thường của OpenClaw.

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

Các Plugin nhà cung cấp tích hợp kết hợp các hook ở trên để phù hợp với nhu cầu
catalog, xác thực, thinking, replay, và usage của từng nhà cung cấp. Tập hook có
thẩm quyền nằm cùng mỗi Plugin trong `extensions/`; trang này minh họa các dạng
thay vì sao chép danh sách.

<AccordionGroup>
  <Accordion title="Nhà cung cấp catalog chuyển tiếp">
    OpenRouter, Kilocode, Z.AI, xAI đăng ký `catalog` cùng với
    `resolveDynamicModel` / `prepareDynamicModel` để có thể hiển thị id mô hình
    upstream trước catalog tĩnh của OpenClaw.
  </Accordion>
  <Accordion title="Nhà cung cấp OAuth và endpoint usage">
    GitHub Copilot, Gemini CLI, ChatGPT Codex, MiniMax, Xiaomi, z.ai ghép
    `prepareRuntimeAuth` hoặc `formatApiKey` với `resolveUsageAuth` +
    `fetchUsageSnapshot` để sở hữu việc trao đổi token và tích hợp `/usage`.
  </Accordion>
  <Accordion title="Các họ dọn dẹp replay và transcript">
    Các họ dùng chung có tên (`google-gemini`, `passthrough-gemini`,
    `anthropic-by-model`, `hybrid-anthropic-openai`) cho phép nhà cung cấp chọn
    tham gia chính sách transcript qua `buildReplayPolicy` thay vì mỗi Plugin
    tự triển khai lại việc dọn dẹp.
  </Accordion>
  <Accordion title="Nhà cung cấp chỉ có catalog">
    `byteplus`, `cloudflare-ai-gateway`, `huggingface`, `kimi-coding`, `nvidia`,
    `qianfan`, `synthetic`, `together`, `venice`, `vercel-ai-gateway`, và
    `volcengine` chỉ đăng ký `catalog` và chạy trên vòng lặp suy luận dùng chung.
  </Accordion>
  <Accordion title="Trình trợ giúp stream riêng cho Anthropic">
    Beta headers, `/fast` / `serviceTier`, và `context1m` nằm trong seam
    `api.ts` / `contract-api.ts` công khai của Plugin Anthropic
    (`wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`) thay vì trong
    SDK chung.
  </Accordion>
</AccordionGroup>

## Trình trợ giúp runtime

Plugin có thể truy cập các trình trợ giúp core được chọn qua `api.runtime`. Với TTS:

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
- Sử dụng cấu hình `messages.tts` của core và lựa chọn nhà cung cấp.
- Trả về bộ đệm âm thanh PCM + tốc độ lấy mẫu. Plugin phải resample/encode cho nhà cung cấp.
- `listVoices` là tùy chọn theo từng nhà cung cấp. Dùng nó cho bộ chọn giọng nói hoặc luồng thiết lập do nhà cung cấp sở hữu.
- Danh sách giọng nói có thể bao gồm metadata phong phú hơn như locale, giới tính, và thẻ tính cách cho bộ chọn nhận biết nhà cung cấp.
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

- Giữ chính sách TTS, fallback, và chuyển phát phản hồi trong core.
- Dùng nhà cung cấp speech cho hành vi tổng hợp do nhà cung cấp sở hữu.
- Đầu vào Microsoft `edge` cũ được chuẩn hóa thành id nhà cung cấp `microsoft`.
- Mô hình sở hữu được ưu tiên là hướng theo công ty: một Plugin nhà cung cấp có
  thể sở hữu nhà cung cấp văn bản, speech, hình ảnh, và media tương lai khi
  OpenClaw bổ sung các hợp đồng năng lực đó.

Với hiểu nội dung hình ảnh/âm thanh/video, Plugin đăng ký một nhà cung cấp
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

- Giữ orchestration, fallback, cấu hình, và kết nối kênh trong core.
- Giữ hành vi nhà cung cấp trong Plugin nhà cung cấp.
- Việc mở rộng cộng thêm nên vẫn có kiểu: phương thức tùy chọn mới, trường kết
  quả tùy chọn mới, năng lực tùy chọn mới.
- Tạo video đã tuân theo cùng mẫu:
  - core sở hữu hợp đồng năng lực và trình trợ giúp runtime
  - Plugin nhà cung cấp đăng ký `api.registerVideoGenerationProvider(...)`
  - Plugin tính năng/kênh dùng `api.runtime.videoGeneration.*`

Với trình trợ giúp runtime media-understanding, Plugin có thể gọi:

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

Đối với phiên âm âm thanh, Plugin có thể dùng runtime media-understanding hoặc
alias STT cũ:

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // Optional when MIME cannot be inferred reliably:
  mime: "audio/ogg",
});
```

Ghi chú:

- `api.runtime.mediaUnderstanding.*` là bề mặt dùng chung được ưu tiên cho việc
  hiểu hình ảnh/âm thanh/video.
- Sử dụng cấu hình âm thanh media-understanding của core (`tools.media.audio`) và thứ tự fallback nhà cung cấp.
- Trả về `{ text: undefined }` khi không tạo ra đầu ra phiên âm (ví dụ đầu vào bị bỏ qua/không được hỗ trợ).
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

- `provider` và `model` là ghi đè tùy chọn theo từng lần chạy, không phải thay đổi session bền vững.
- OpenClaw chỉ tôn trọng các trường ghi đè đó cho bên gọi đáng tin cậy.
- Với các lần chạy fallback do Plugin sở hữu, operator phải chọn tham gia bằng `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Dùng `plugins.entries.<id>.subagent.allowedModels` để giới hạn Plugin đáng tin cậy vào các mục tiêu `provider/model` chuẩn tắc cụ thể, hoặc `"*"` để cho phép rõ ràng mọi mục tiêu.
- Các lần chạy subagent của Plugin không đáng tin cậy vẫn hoạt động, nhưng yêu cầu ghi đè bị từ chối thay vì âm thầm fallback.
- Các session subagent do Plugin tạo được gắn thẻ bằng id Plugin tạo ra. Fallback `api.runtime.subagent.deleteSession(...)` chỉ có thể xóa các session được sở hữu đó; xóa session tùy ý vẫn yêu cầu yêu cầu Gateway có phạm vi admin.

Với tìm kiếm web, Plugin có thể dùng trình trợ giúp runtime dùng chung thay vì
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

- Giữ lựa chọn nhà cung cấp, phân giải thông tin xác thực, và ngữ nghĩa yêu cầu dùng chung trong core.
- Dùng nhà cung cấp tìm kiếm web cho transport tìm kiếm riêng theo nhà cung cấp.
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
- `listProviders(...)`: liệt kê các nhà cung cấp tạo hình ảnh hiện có và năng lực của họ.

## Tuyến HTTP Gateway

Plugin có thể công bố endpoint HTTP bằng `api.registerHttpRoute(...)`.

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

Các trường tuyến:

- `path`: đường dẫn tuyến dưới máy chủ HTTP gateway.
- `auth`: bắt buộc. Dùng `"gateway"` để yêu cầu xác thực gateway bình thường, hoặc `"plugin"` cho xác thực/xác minh webhook do Plugin quản lý.
- `match`: tùy chọn. `"exact"` (mặc định) hoặc `"prefix"`.
- `replaceExisting`: tùy chọn. Cho phép cùng một Plugin thay thế đăng ký tuyến hiện có của chính nó.
- `handler`: trả về `true` khi tuyến đã xử lý yêu cầu.

Ghi chú:

- `api.registerHttpHandler(...)` đã bị gỡ bỏ và sẽ gây lỗi tải Plugin. Thay vào đó hãy dùng `api.registerHttpRoute(...)`.
- Các route của Plugin phải khai báo `auth` rõ ràng.
- Các xung đột `path + match` chính xác bị từ chối trừ khi có `replaceExisting: true`, và một Plugin không thể thay thế route của Plugin khác.
- Các route chồng lấn với mức `auth` khác nhau bị từ chối. Chỉ giữ chuỗi chuyển tiếp `exact`/`prefix` ở cùng mức auth.
- Các route `auth: "plugin"` **không** tự động nhận phạm vi runtime của operator. Chúng dành cho Webhook/xác minh chữ ký do Plugin quản lý, không phải các lệnh gọi trợ giúp Gateway đặc quyền.
- Các route `auth: "gateway"` chạy bên trong phạm vi runtime yêu cầu Gateway, nhưng phạm vi đó được cố ý giữ thận trọng:
  - auth bearer bằng bí mật dùng chung (`gateway.auth.mode = "token"` / `"password"`) giữ phạm vi runtime của route Plugin cố định ở `operator.write`, ngay cả khi bên gọi gửi `x-openclaw-scopes`
  - các chế độ HTTP mang danh tính tin cậy (ví dụ `trusted-proxy` hoặc `gateway.auth.mode = "none"` trên ingress riêng tư) chỉ tôn trọng `x-openclaw-scopes` khi header được cung cấp rõ ràng
  - nếu `x-openclaw-scopes` vắng mặt trên các yêu cầu route Plugin mang danh tính đó, phạm vi runtime quay về `operator.write`
- Quy tắc thực tế: đừng giả định một route Plugin dùng gateway-auth là bề mặt quản trị ngầm định. Nếu route của bạn cần hành vi chỉ dành cho quản trị viên, hãy yêu cầu chế độ auth mang danh tính và ghi rõ hợp đồng header `x-openclaw-scopes`.

## Đường dẫn import Plugin SDK

Dùng các đường dẫn con SDK hẹp thay vì barrel gốc nguyên khối `openclaw/plugin-sdk`
khi tạo Plugin mới. Các đường dẫn con cốt lõi:

| Đường dẫn con                      | Mục đích                                           |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | Các primitive đăng ký Plugin                      |
| `openclaw/plugin-sdk/channel-core`  | Trợ giúp entry/build cho kênh                     |
| `openclaw/plugin-sdk/core`          | Trợ giúp chia sẻ chung và hợp đồng bao quát       |
| `openclaw/plugin-sdk/config-schema` | Schema Zod gốc `openclaw.json` (`OpenClawSchema`) |

Plugin kênh chọn từ một nhóm các giao diện hẹp — `channel-setup`,
`setup-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-lifecycle`,
`channel-reply-pipeline`, `command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets`, và `channel-actions`. Hành vi phê duyệt nên hợp nhất
trên một hợp đồng `approvalCapability` thay vì trộn lẫn giữa các trường
Plugin không liên quan. Xem [Plugin kênh](/vi/plugins/sdk-channel-plugins).

Các trợ giúp runtime và cấu hình nằm dưới các đường dẫn con `*-runtime` tập trung
tương ứng (`approval-runtime`, `agent-runtime`, `lazy-runtime`, `directory-runtime`,
`text-runtime`, `runtime-store`, `system-event-runtime`, `heartbeat-runtime`,
`channel-activity-runtime`, v.v.). Ưu tiên `config-contracts`,
`plugin-config-runtime`, `runtime-config-snapshot`, và `config-mutation`
thay vì barrel tương thích rộng `config-runtime`.

<Info>
`openclaw/plugin-sdk/channel-runtime`, `openclaw/plugin-sdk/config-runtime`,
và `openclaw/plugin-sdk/infra-runtime` là các shim tương thích đã lỗi thời cho
Plugin cũ. Mã mới nên import các primitive chung hẹp hơn.
</Info>

Điểm vào nội bộ repo (theo gốc gói Plugin được đóng gói sẵn):

- `index.js` — entry Plugin đóng gói sẵn
- `api.js` — barrel trợ giúp/kiểu
- `runtime-api.js` — barrel chỉ dành cho runtime
- `setup-entry.js` — entry Plugin thiết lập

Plugin bên ngoài chỉ nên import các đường dẫn con `openclaw/plugin-sdk/*`. Không bao giờ
import `src/*` của gói Plugin khác từ core hoặc từ Plugin khác.
Các điểm vào được tải qua facade ưu tiên snapshot cấu hình runtime đang hoạt động khi
tồn tại, sau đó quay về tệp cấu hình đã phân giải trên đĩa.

Các đường dẫn con theo capability như `image-generation`, `media-understanding`,
và `speech` tồn tại vì các Plugin đóng gói sẵn đang dùng chúng hiện nay. Chúng không
tự động là hợp đồng bên ngoài được đóng băng lâu dài — hãy kiểm tra trang tham chiếu
SDK liên quan khi dựa vào chúng.

## Schema công cụ tin nhắn

Plugin nên sở hữu các đóng góp schema `describeMessageTool(...)` dành riêng cho kênh
cho các primitive không phải tin nhắn như reaction, đọc, và poll.
Phần trình bày gửi dùng chung nên dùng hợp đồng `MessagePresentation` chung
thay vì các trường nút, component, block, hoặc card gốc của provider.
Xem [Trình bày tin nhắn](/vi/plugins/message-presentation) để biết hợp đồng,
quy tắc fallback, ánh xạ provider, và danh sách kiểm tra cho tác giả Plugin.

Các Plugin có khả năng gửi khai báo những gì chúng có thể render thông qua capability tin nhắn:

- `presentation` cho các block trình bày ngữ nghĩa (`text`, `context`, `divider`, `buttons`, `select`)
- `delivery-pin` cho yêu cầu ghim khi gửi

Core quyết định render phần trình bày bằng cơ chế gốc hay hạ cấp thành văn bản.
Không để lộ các lối thoát UI gốc của provider từ công cụ tin nhắn chung.
Các trợ giúp SDK đã lỗi thời cho schema gốc legacy vẫn được export cho
Plugin bên thứ ba hiện có, nhưng Plugin mới không nên dùng chúng.

## Phân giải mục tiêu kênh

Plugin kênh nên sở hữu ngữ nghĩa mục tiêu dành riêng cho kênh. Giữ host outbound dùng chung
ở mức chung và dùng bề mặt adapter nhắn tin cho quy tắc provider:

- `messaging.inferTargetChatType({ to })` quyết định một mục tiêu đã chuẩn hóa
  nên được xem là `direct`, `group`, hay `channel` trước khi tra cứu thư mục.
- `messaging.targetResolver.looksLikeId(raw, normalized)` cho core biết liệu một
  đầu vào có nên đi thẳng tới phân giải giống id thay vì tìm kiếm thư mục hay không.
- `messaging.targetResolver.resolveTarget(...)` là fallback của Plugin khi
  core cần lần phân giải cuối cùng do provider sở hữu sau khi chuẩn hóa hoặc sau khi
  không tìm thấy trong thư mục.
- `messaging.resolveOutboundSessionRoute(...)` sở hữu việc xây dựng route phiên
  dành riêng cho provider sau khi mục tiêu đã được phân giải.

Cách chia khuyến nghị:

- Dùng `inferTargetChatType` cho các quyết định phân loại nên xảy ra trước khi
  tìm kiếm peer/nhóm.
- Dùng `looksLikeId` cho các kiểm tra "xem đây là id mục tiêu rõ ràng/gốc".
- Dùng `resolveTarget` cho fallback chuẩn hóa dành riêng cho provider, không dùng cho
  tìm kiếm thư mục rộng.
- Giữ các id gốc của provider như chat id, thread id, JID, handle, và room id
  bên trong giá trị `target` hoặc tham số dành riêng cho provider, không đặt trong các trường SDK chung.

## Thư mục dựa trên cấu hình

Plugin suy ra mục nhập thư mục từ cấu hình nên giữ logic đó trong
Plugin và tái sử dụng các trợ giúp dùng chung từ
`openclaw/plugin-sdk/directory-runtime`.

Dùng cách này khi một kênh cần peer/nhóm dựa trên cấu hình như:

- peer DM do allowlist điều khiển
- ánh xạ kênh/nhóm đã cấu hình
- fallback thư mục tĩnh theo phạm vi tài khoản

Các trợ giúp dùng chung trong `directory-runtime` chỉ xử lý các thao tác chung:

- lọc truy vấn
- áp dụng giới hạn
- trợ giúp khử trùng lặp/chuẩn hóa
- xây dựng `ChannelDirectoryEntry[]`

Việc kiểm tra tài khoản và chuẩn hóa id dành riêng cho kênh nên ở lại trong
triển khai Plugin.

## Catalog provider

Plugin provider có thể định nghĩa catalog model cho suy luận bằng
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` trả về cùng hình dạng mà OpenClaw ghi vào
`models.providers`:

- `{ provider }` cho một mục provider
- `{ providers }` cho nhiều mục provider

Dùng `catalog` khi Plugin sở hữu id model dành riêng cho provider, giá trị mặc định URL cơ sở,
hoặc siêu dữ liệu model bị kiểm soát bởi auth.

`catalog.order` kiểm soát thời điểm catalog của Plugin được hợp nhất tương đối với
các provider ngầm định tích hợp sẵn của OpenClaw:

- `simple`: provider thuần dựa trên khóa API hoặc env
- `profile`: provider xuất hiện khi có hồ sơ auth
- `paired`: provider tổng hợp nhiều mục provider có liên quan
- `late`: lượt cuối, sau các provider ngầm định khác

Provider về sau thắng khi trùng khóa, nên Plugin có thể cố ý ghi đè một
mục provider tích hợp sẵn có cùng id provider.

Plugin cũng có thể công bố các hàng model chỉ đọc thông qua
`api.registerModelCatalogProvider({ provider, kinds, staticCatalog, liveCatalog
})`. Đây là hướng đi về phía trước cho bề mặt list/help/picker và hỗ trợ
các hàng `text`, `image_generation`, `video_generation`, và `music_generation`.
Plugin provider vẫn sở hữu các lệnh gọi endpoint trực tiếp, trao đổi token, và
ánh xạ phản hồi của vendor; core sở hữu hình dạng hàng chung, nhãn nguồn, và
định dạng trợ giúp công cụ media. Đăng ký provider tạo media tự động tổng hợp
các hàng catalog tĩnh từ `defaultModel`, `models`, và `capabilities`.

Tương thích:

- `discovery` vẫn hoạt động như alias legacy, nhưng phát cảnh báo lỗi thời
- nếu cả `catalog` và `discovery` đều được đăng ký, OpenClaw dùng `catalog`
- `augmentModelCatalog` đã lỗi thời; provider đóng gói sẵn nên công bố
  hàng bổ sung thông qua `registerModelCatalogProvider`

## Kiểm tra kênh chỉ đọc

Nếu Plugin của bạn đăng ký một kênh, nên triển khai
`plugin.config.inspectAccount(cfg, accountId)` cùng với `resolveAccount(...)`.

Lý do:

- `resolveAccount(...)` là đường dẫn runtime. Nó được phép giả định thông tin xác thực
  đã được materialize đầy đủ và có thể fail fast khi thiếu secret bắt buộc.
- Các đường dẫn lệnh chỉ đọc như `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve`, và các luồng doctor/sửa
  cấu hình không nên cần materialize thông tin xác thực runtime chỉ để
  mô tả cấu hình.

Hành vi `inspectAccount(...)` khuyến nghị:

- Chỉ trả về trạng thái tài khoản mang tính mô tả.
- Giữ nguyên `enabled` và `configured`.
- Bao gồm các trường nguồn/trạng thái thông tin xác thực khi phù hợp, như:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Bạn không cần trả về giá trị token thô chỉ để báo cáo
  khả dụng chỉ đọc. Trả về `tokenStatus: "available"` (và trường nguồn
  tương ứng) là đủ cho các lệnh kiểu trạng thái.
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

Mỗi entry trở thành một Plugin. Nếu gói liệt kê nhiều extension, id Plugin
trở thành `name/<fileBase>`.

Nếu Plugin của bạn import dependency npm, hãy cài chúng trong thư mục đó để
`node_modules` có sẵn (`npm install` / `pnpm install`).

Rào chắn bảo mật: mọi entry `openclaw.extensions` phải ở lại bên trong thư mục Plugin
sau khi phân giải symlink. Các entry thoát khỏi thư mục package sẽ bị
từ chối.

Ghi chú bảo mật: `openclaw plugins install` cài dependency của Plugin bằng
`npm install --omit=dev --ignore-scripts` cục bộ theo dự án (không có script vòng đời,
không có dependency dev trong runtime), bỏ qua thiết lập npm install toàn cục được kế thừa.
Giữ cây dependency của Plugin "thuần JS/TS" và tránh các package yêu cầu
build `postinstall`.

Tùy chọn: `openclaw.setupEntry` có thể trỏ tới một module chỉ thiết lập gọn nhẹ.
Khi OpenClaw cần bề mặt thiết lập cho một Plugin kênh bị tắt, hoặc
khi một Plugin kênh được bật nhưng vẫn chưa được cấu hình, nó tải `setupEntry`
thay vì entry Plugin đầy đủ. Điều này giúp startup và thiết lập nhẹ hơn
khi entry Plugin chính của bạn cũng nối công cụ, hook, hoặc mã khác chỉ dành cho runtime.

Tùy chọn: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
có thể đưa một Plugin kênh vào cùng đường dẫn `setupEntry` trong giai đoạn startup
trước khi lắng nghe của Gateway, ngay cả khi kênh đã được cấu hình.

Chỉ dùng tùy chọn này khi `setupEntry` bao phủ đầy đủ bề mặt khởi động phải tồn tại
trước khi Gateway bắt đầu lắng nghe. Trong thực tế, điều đó nghĩa là setup entry
phải đăng ký mọi capability do kênh sở hữu mà quá trình khởi động phụ thuộc vào, chẳng hạn như:

- chính phần đăng ký kênh
- mọi route HTTP phải sẵn sàng trước khi Gateway bắt đầu lắng nghe
- mọi phương thức, công cụ hoặc dịch vụ Gateway phải tồn tại trong cùng khoảng thời gian đó

Nếu full entry của bạn vẫn sở hữu bất kỳ capability khởi động bắt buộc nào, đừng bật
cờ này. Giữ Plugin ở hành vi mặc định và để OpenClaw tải
full entry trong quá trình khởi động.

Các kênh đi kèm cũng có thể xuất bản các helper bề mặt hợp đồng chỉ dành cho setup mà core
có thể tham khảo trước khi runtime đầy đủ của kênh được tải. Bề mặt
promotion setup hiện tại là:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Core dùng bề mặt đó khi cần promote cấu hình kênh single-account cũ
vào `channels.<id>.accounts.*` mà không tải full plugin entry.
Matrix là ví dụ đi kèm hiện tại: nó chỉ chuyển các khóa auth/bootstrap vào một
tài khoản được promote có tên khi các tài khoản có tên đã tồn tại, và nó có thể giữ lại
khóa default-account không chuẩn đã được cấu hình thay vì luôn tạo
`accounts.default`.

Các setup patch adapter đó giữ cho việc khám phá bề mặt hợp đồng đi kèm được lazy. Thời gian
import vẫn nhẹ; bề mặt promotion chỉ được tải ở lần dùng đầu tiên thay vì
vào lại quá trình khởi động kênh đi kèm khi import module.

Khi các bề mặt khởi động đó bao gồm phương thức RPC của Gateway, hãy giữ chúng dưới một
prefix riêng cho Plugin. Các namespace quản trị core (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) vẫn được dành riêng và luôn resolve
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

Channel Plugin có thể quảng bá siêu dữ liệu setup/discovery qua `openclaw.channel` và
gợi ý cài đặt qua `openclaw.install`. Điều này giữ cho danh mục core không chứa dữ liệu.

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
- `preferOver`: các id Plugin/kênh có độ ưu tiên thấp hơn mà mục danh mục này nên xếp trên
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: điều khiển nội dung hiển thị trên bề mặt chọn
- `markdownCapable`: đánh dấu kênh là hỗ trợ markdown để ra quyết định định dạng outbound
- `exposure.configured`: ẩn kênh khỏi các bề mặt liệt kê kênh đã cấu hình khi đặt thành `false`
- `exposure.setup`: ẩn kênh khỏi các bộ chọn setup/configure tương tác khi đặt thành `false`
- `exposure.docs`: đánh dấu kênh là nội bộ/riêng tư cho các bề mặt điều hướng tài liệu
- `showConfigured` / `showInSetup`: alias cũ vẫn được chấp nhận để tương thích; ưu tiên `exposure`
- `quickstartAllowFrom`: đưa kênh vào luồng quickstart `allowFrom` chuẩn
- `forceAccountBinding`: yêu cầu ràng buộc tài khoản rõ ràng ngay cả khi chỉ có một tài khoản
- `preferSessionLookupForAnnounceTarget`: ưu tiên tra cứu session khi resolve announce target

OpenClaw cũng có thể hợp nhất **danh mục kênh bên ngoài** (ví dụ: bản export registry MPM).
Đặt một tệp JSON tại một trong các vị trí:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Hoặc trỏ `OPENCLAW_PLUGIN_CATALOG_PATHS` (hoặc `OPENCLAW_MPM_CATALOG_PATHS`) tới
một hoặc nhiều tệp JSON (phân tách bằng dấu phẩy/dấu chấm phẩy/`PATH`). Mỗi tệp nên
chứa `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. Parser cũng chấp nhận `"packages"` hoặc `"plugins"` làm alias cũ cho khóa `"entries"`.

Các mục danh mục kênh được tạo và mục danh mục cài đặt provider hiển thị
các thông tin nguồn cài đặt đã chuẩn hóa bên cạnh block `openclaw.install` thô. Các
thông tin đã chuẩn hóa xác định npm spec là phiên bản chính xác hay selector floating,
siêu dữ liệu integrity mong đợi có hiện diện hay không, và có sẵn đường dẫn nguồn cục bộ
hay không. Khi biết danh tính danh mục/gói, các thông tin đã chuẩn hóa sẽ cảnh báo nếu
tên gói npm đã parse lệch khỏi danh tính đó.
Chúng cũng cảnh báo khi `defaultChoice` không hợp lệ hoặc trỏ tới một nguồn
không sẵn có, và khi siêu dữ liệu integrity npm hiện diện mà không có nguồn npm hợp lệ.
Consumer nên xem `installSource` là một trường tùy chọn bổ sung để
các mục tạo thủ công và shim danh mục không phải tổng hợp nó.
Điều này cho phép onboarding và diagnostics giải thích trạng thái source-plane mà không
import runtime Plugin.

Các mục npm bên ngoài chính thức nên ưu tiên `npmSpec` chính xác kèm
`expectedIntegrity`. Tên gói trần và dist-tag vẫn hoạt động để
tương thích, nhưng chúng hiển thị cảnh báo source-plane để danh mục có thể tiến
tới các bản cài đặt được pin và kiểm tra integrity mà không làm hỏng các Plugin hiện có.
Khi onboarding cài đặt từ một đường dẫn danh mục cục bộ, nó ghi lại một mục chỉ mục
Plugin được quản lý với `source: "path"` và `sourcePath` tương đối với workspace
khi có thể. Đường dẫn tải vận hành tuyệt đối vẫn ở
`plugins.load.paths`; bản ghi cài đặt tránh sao chép các đường dẫn máy trạm cục bộ
vào cấu hình dài hạn. Điều này giữ cho các bản cài đặt phát triển cục bộ hiển thị với
diagnostics source-plane mà không thêm một bề mặt tiết lộ đường dẫn hệ thống tệp thô thứ hai.
Chỉ mục Plugin được lưu bền vững `plugins/installs.json` là nguồn sự thật của cài đặt
và có thể được làm mới mà không tải các module runtime Plugin.
Map `installRecords` của nó bền vững ngay cả khi manifest Plugin bị thiếu hoặc
không hợp lệ; mảng `plugins` của nó là một góc nhìn manifest có thể dựng lại.

## Plugin engine ngữ cảnh

Plugin engine ngữ cảnh sở hữu điều phối ngữ cảnh session cho ingest, assembly,
và Compaction. Đăng ký chúng từ Plugin của bạn bằng
`api.registerContextEngine(id, factory)`, rồi chọn engine đang hoạt động bằng
`plugins.slots.contextEngine`.

Dùng tùy chọn này khi Plugin của bạn cần thay thế hoặc mở rộng pipeline ngữ cảnh
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

Factory `ctx` hiển thị các giá trị tùy chọn `config`, `agentDir`, và `workspaceDir`
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

Khi một Plugin cần hành vi không phù hợp với API hiện tại, đừng bypass
hệ thống Plugin bằng cách truy cập riêng vào bên trong. Hãy thêm capability còn thiếu.

Trình tự khuyến nghị:

1. định nghĩa hợp đồng core
   Quyết định hành vi dùng chung mà core nên sở hữu: policy, fallback, merge cấu hình,
   lifecycle, ngữ nghĩa hướng kênh, và hình dạng helper runtime.
2. thêm bề mặt đăng ký/runtime Plugin có kiểu
   Mở rộng `OpenClawPluginApi` và/hoặc `api.runtime` với bề mặt
   capability có kiểu nhỏ nhất nhưng hữu ích.
3. nối core + consumer kênh/tính năng
   Các kênh và Plugin tính năng nên dùng capability mới thông qua core,
   không import trực tiếp triển khai của vendor.
4. đăng ký các triển khai vendor
   Sau đó các Plugin vendor đăng ký backend của chúng theo capability.
5. thêm coverage hợp đồng
   Thêm test để ownership và hình dạng đăng ký vẫn rõ ràng theo thời gian.

Đây là cách OpenClaw giữ được quan điểm rõ ràng mà không bị hardcode theo thế giới quan
của một provider. Xem [Sổ tay Capability](/vi/plugins/adding-capabilities)
để có checklist tệp cụ thể và ví dụ hoàn chỉnh.

### Checklist capability

Khi bạn thêm capability mới, phần triển khai thường nên chạm đến các
bề mặt này cùng nhau:

- kiểu hợp đồng core trong `src/<capability>/types.ts`
- runner/helper runtime core trong `src/<capability>/runtime.ts`
- bề mặt đăng ký API Plugin trong `src/plugins/types.ts`
- nối registry Plugin trong `src/plugins/registry.ts`
- phơi bày runtime Plugin trong `src/plugins/runtime/*` khi Plugin tính năng/kênh
  cần dùng nó
- helper capture/test trong `src/test-utils/plugin-registration.ts`
- assertion ownership/hợp đồng trong `src/plugins/contracts/registry.ts`
- tài liệu operator/Plugin trong `docs/`

Nếu thiếu một trong các bề mặt đó, thường đó là dấu hiệu capability
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

Điều đó giữ cho quy tắc đơn giản:

- core sở hữu hợp đồng capability + điều phối
- Plugin vendor sở hữu các triển khai vendor
- Plugin tính năng/kênh dùng các helper runtime
- test hợp đồng giữ ownership rõ ràng

## Liên quan

- [Kiến trúc Plugin](/vi/plugins/architecture) — mô hình và hình dạng capability công khai
- [Subpath SDK Plugin](/vi/plugins/sdk-subpaths)
- [Thiết lập SDK Plugin](/vi/plugins/sdk-setup)
- [Xây dựng Plugin](/vi/plugins/building-plugins)
