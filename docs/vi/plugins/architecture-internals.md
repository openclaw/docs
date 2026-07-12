---
read_when:
    - Triển khai các hook thời gian chạy của nhà cung cấp, vòng đời kênh hoặc các gói phần mềm
    - Gỡ lỗi thứ tự tải plugin hoặc trạng thái sổ đăng ký
    - Thêm khả năng plugin mới hoặc plugin công cụ ngữ cảnh
summary: 'Cơ chế nội bộ của kiến trúc Plugin: quy trình tải, sổ đăng ký, hook thời gian chạy, tuyến HTTP và bảng tham chiếu'
title: Cấu trúc nội bộ của kiến trúc Plugin
x-i18n:
    generated_at: "2026-07-12T08:05:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2fe5b7f34c638da40b43c24da9425ecdeb9ce7381e233b3ebdd5cc95276ba04f
    source_path: plugins/architecture-internals.md
    workflow: 16
---

Để tìm hiểu mô hình khả năng công khai, các dạng Plugin và hợp đồng về quyền sở hữu/thực thi, hãy xem [Kiến trúc Plugin](/vi/plugins/architecture). Trang này trình bày cơ chế nội bộ: quy trình tải, sổ đăng ký, hook thời gian chạy, tuyến HTTP của Gateway, đường dẫn nhập và bảng lược đồ.

## Quy trình tải

Khi khởi động, OpenClaw thực hiện đại致 như sau:

1. khám phá các thư mục gốc Plugin tiềm năng
2. đọc manifest gói nguyên bản hoặc tương thích và siêu dữ liệu gói
3. từ chối các ứng viên không an toàn
4. chuẩn hóa cấu hình Plugin (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. quyết định trạng thái bật cho từng ứng viên
6. tải các mô-đun nguyên bản đã bật: các mô-đun đi kèm đã biên dịch sử dụng trình tải nguyên bản;
   mã nguồn TypeScript cục bộ của bên thứ ba sử dụng phương án dự phòng Jiti khẩn cấp
7. gọi các hook nguyên bản `register(api)` và thu thập nội dung đăng ký vào sổ đăng ký Plugin
8. cung cấp sổ đăng ký cho các lệnh/bề mặt thời gian chạy

<Note>
`activate` là bí danh cũ của `register` — trình tải phân giải mục nào hiện diện (`def.register ?? def.activate`) và gọi mục đó tại cùng một thời điểm. Tất cả Plugin đi kèm đều sử dụng `register`; hãy ưu tiên `register` cho Plugin mới.
</Note>

Các cổng kiểm tra an toàn chạy **trước** khi thực thi thời gian chạy. Quá trình khám phá chặn một ứng viên khi:

- điểm vào đã phân giải nằm ngoài thư mục gốc Plugin
- đường dẫn của ứng viên (hoặc thư mục gốc) cho phép mọi người ghi
- đối với Plugin không đi kèm, quyền sở hữu đường dẫn không khớp với uid hiện tại (hoặc root)

Trước tiên, hệ thống sẽ thử sửa tại chỗ bằng `chmod` đối với các thư mục đi kèm cho phép mọi người ghi (các bản cài đặt npm/toàn cục có thể cung cấp thư mục gói với quyền `0777`), rồi mới kiểm tra lại cổng; kiểm tra quyền sở hữu được bỏ qua hoàn toàn đối với nguồn gốc đi kèm.

Các ứng viên bị chặn vẫn mang id Plugin trong chẩn đoán được phát ra khi xác định được id (bao gồm cả id được phân giải từ manifest bên trong một thư mục vốn bị từ chối), vì vậy cấu hình tham chiếu đến id đó sẽ nhận được thông báo Plugin bị chặn gắn với cảnh báo an toàn đường dẫn thay vì lỗi "Plugin không xác định" không liên quan.

### Hành vi ưu tiên manifest

Manifest là nguồn chân lý của mặt phẳng điều khiển. OpenClaw sử dụng manifest để:

- nhận dạng Plugin
- khám phá các kênh/Skills/lược đồ cấu hình hoặc khả năng gói đã khai báo
- xác thực `plugins.entries.<id>.config`
- bổ sung nhãn/văn bản giữ chỗ cho giao diện điều khiển
- hiển thị siêu dữ liệu cài đặt/danh mục
- duy trì các bộ mô tả kích hoạt và thiết lập ít tốn tài nguyên mà không cần tải thời gian chạy của Plugin

Đối với Plugin nguyên bản, mô-đun thời gian chạy là phần thuộc mặt phẳng dữ liệu. Mô-đun này đăng ký hành vi thực tế như hook, công cụ, lệnh hoặc luồng nhà cung cấp.

Các khối manifest tùy chọn `activation` và `setup` vẫn nằm trên mặt phẳng điều khiển. Chúng chỉ là các bộ mô tả siêu dữ liệu dùng để lập kế hoạch kích hoạt và khám phá thiết lập; chúng không thay thế việc đăng ký thời gian chạy, `register(...)` hoặc `setupEntry`. Các thành phần sử dụng kích hoạt trực tiếp dùng gợi ý về lệnh, kênh và nhà cung cấp trong manifest để thu hẹp phạm vi tải Plugin trước khi hiện thực hóa sổ đăng ký rộng hơn:

- quá trình tải CLI thu hẹp còn các Plugin sở hữu lệnh chính được yêu cầu
- quá trình phân giải thiết lập kênh/Plugin thu hẹp còn các Plugin sở hữu id kênh được yêu cầu
- quá trình phân giải thiết lập/thời gian chạy rõ ràng của nhà cung cấp thu hẹp còn các Plugin sở hữu id nhà cung cấp được yêu cầu
- quá trình lập kế hoạch khởi động Gateway sử dụng `activation.onStartup` cho các lượt nhập khởi động rõ ràng; những Plugin không có siêu dữ liệu khởi động chỉ được tải thông qua các tác nhân kích hoạt có phạm vi hẹp hơn

Trình lập kế hoạch kích hoạt cung cấp cả API chỉ chứa id cho các thành phần gọi hiện có và API kế hoạch để chẩn đoán. Các mục kế hoạch cho biết lý do một Plugin được chọn, đồng thời tách biệt các gợi ý `activation.*` rõ ràng khỏi phương án dự phòng dựa trên quyền sở hữu manifest:

| Lý do (từ gợi ý `activation.*`)      | Lý do (từ quyền sở hữu manifest)                                                           |
| ------------------------------------ | ------------------------------------------------------------------------------------------ |
| `activation-agent-harness-hint`      | —                                                                                          |
| `activation-capability-hint`         | —                                                                                          |
| `activation-channel-hint`            | `manifest-channel-owner` (`channels`)                                                      |
| `activation-command-hint`            | `manifest-command-alias` (`commandAliases`)                                                |
| `activation-provider-hint`           | `manifest-provider-owner` (`providers`), `manifest-setup-provider-owner` (`setup.providers`) |
| `activation-route-hint`              | —                                                                                          |
| — (tác nhân hook không có biến thể gợi ý) | `manifest-hook-owner` (`hooks`), `manifest-tool-contract` (`contracts.tools`)          |

Sự phân tách lý do đó là ranh giới tương thích: siêu dữ liệu Plugin hiện có tiếp tục hoạt động, trong khi mã mới có thể phát hiện gợi ý rộng hoặc hành vi dự phòng mà không thay đổi ngữ nghĩa tải thời gian chạy.

Các lượt tải trước thời gian chạy tại thời điểm yêu cầu có phạm vi rộng `all` vẫn suy ra một tập id Plugin hiệu dụng rõ ràng từ cấu hình, kế hoạch khởi động, các kênh đã cấu hình, vị trí và quy tắc tự động bật (`resolveEffectivePluginIds` trong `src/plugins/effective-plugin-ids.ts`). Nếu tập suy ra đó rỗng, OpenClaw giữ nguyên phạm vi rỗng thay vì mở rộng đến mọi Plugin có thể khám phá.

Quá trình khám phá thiết lập ưu tiên các id do bộ mô tả sở hữu, chẳng hạn như `setup.providers` và `setup.cliBackends`, để thu hẹp các Plugin ứng viên trước khi dùng `setup-api` làm phương án dự phòng cho những Plugin vẫn cần hook thời gian chạy trong lúc thiết lập. Danh sách thiết lập nhà cung cấp sử dụng `providerAuthChoices` trong manifest, các lựa chọn thiết lập suy ra từ bộ mô tả và siêu dữ liệu danh mục cài đặt mà không tải thời gian chạy của nhà cung cấp. Việc đặt rõ ràng `setup.requiresRuntime: false` là điểm ngắt chỉ dùng bộ mô tả; nếu bỏ qua `requiresRuntime`, phương án dự phòng setup-api cũ vẫn được giữ lại để tương thích. Nếu nhiều hơn một Plugin được khám phá cùng khai báo sở hữu một id nhà cung cấp thiết lập hoặc phần phụ trợ CLI đã chuẩn hóa, quá trình tra cứu thiết lập sẽ từ chối chủ sở hữu không rõ ràng thay vì dựa vào thứ tự khám phá. Khi thời gian chạy thiết lập thực sự được thực thi, chẩn đoán sổ đăng ký sẽ báo cáo độ lệch giữa `setup.providers` / `setup.cliBackends` và các nhà cung cấp hoặc phần phụ trợ CLI thực sự được setup-api đăng ký, nhưng không chặn các Plugin cũ.

### Ranh giới bộ nhớ đệm Plugin

OpenClaw không lưu kết quả khám phá Plugin hoặc dữ liệu sổ đăng ký manifest trực tiếp vào bộ nhớ đệm dựa trên khoảng thời gian thực. Các lượt cài đặt, chỉnh sửa manifest và thay đổi đường dẫn tải phải hiển thị trong lần đọc siêu dữ liệu rõ ràng hoặc lần dựng lại ảnh chụp nhanh tiếp theo. Trình phân tích tệp manifest duy trì một bộ nhớ đệm chữ ký tệp có giới hạn, được lập khóa bằng đường dẫn manifest đã mở cùng thiết bị/inode, kích thước và mtime/ctime; bộ nhớ đệm đó chỉ tránh phân tích lại các byte không thay đổi và không được lưu vào bộ nhớ đệm các câu trả lời về khám phá, sổ đăng ký, chủ sở hữu hoặc chính sách.

Đường dẫn nhanh an toàn cho siêu dữ liệu là quyền sở hữu đối tượng rõ ràng, không phải bộ nhớ đệm ẩn. Các đường dẫn nóng khi khởi động Gateway nên truyền `PluginMetadataSnapshot` hiện tại, `PluginLookUpTable` đã suy ra hoặc một sổ đăng ký manifest rõ ràng xuyên suốt chuỗi lời gọi. Quá trình xác thực cấu hình, tự động bật khi khởi động, khởi tạo Plugin và lựa chọn nhà cung cấp có thể tái sử dụng các đối tượng đó trong khi chúng đại diện cho cấu hình và kho Plugin hiện tại. Quá trình tra cứu thiết lập vẫn dựng lại siêu dữ liệu manifest theo yêu cầu, trừ khi đường dẫn thiết lập cụ thể nhận được một sổ đăng ký manifest rõ ràng; hãy giữ cơ chế đó làm phương án dự phòng cho đường dẫn ít dùng thay vì thêm bộ nhớ đệm tra cứu ẩn. Khi đầu vào thay đổi, hãy dựng lại và thay thế ảnh chụp nhanh thay vì sửa đổi nó hoặc giữ các bản sao lịch sử. Các khung nhìn trên sổ đăng ký Plugin đang hoạt động và trình trợ giúp khởi tạo kênh đi kèm nên được tính toán lại từ sổ đăng ký/thư mục gốc hiện tại. Có thể dùng bản đồ tồn tại ngắn hạn trong một lời gọi để loại bỏ công việc trùng lặp hoặc ngăn tái nhập; chúng không được trở thành bộ nhớ đệm siêu dữ liệu cấp tiến trình.

Đối với quá trình tải Plugin, lớp bộ nhớ đệm lâu dài là việc tải thời gian chạy. Lớp này có thể tái sử dụng trạng thái trình tải khi mã hoặc hiện vật đã cài đặt thực sự được tải, chẳng hạn như:

- `PluginLoaderCacheState` và các sổ đăng ký thời gian chạy đang hoạt động tương thích
- bộ nhớ đệm jiti/mô-đun và bộ nhớ đệm trình tải bề mặt công khai dùng để tránh nhập lặp lại cùng một bề mặt thời gian chạy
- bộ nhớ đệm hệ thống tệp cho các hiện vật Plugin đã cài đặt
- bản đồ tồn tại ngắn hạn theo từng lời gọi để chuẩn hóa đường dẫn hoặc phân giải trùng lặp

Các bộ nhớ đệm đó là chi tiết triển khai của mặt phẳng dữ liệu. Chúng không được trả lời các câu hỏi của mặt phẳng điều khiển như "Plugin nào sở hữu nhà cung cấp này?" trừ khi thành phần gọi chủ động yêu cầu tải thời gian chạy.

Không thêm bộ nhớ đệm lâu dài hoặc dựa trên thời gian thực cho:

- kết quả khám phá
- sổ đăng ký manifest trực tiếp
- sổ đăng ký manifest được dựng lại từ chỉ mục Plugin đã cài đặt
- tra cứu chủ sở hữu nhà cung cấp, ẩn mô hình, chính sách nhà cung cấp hoặc siêu dữ liệu hiện vật công khai
- bất kỳ câu trả lời nào khác được suy ra từ manifest mà trong đó manifest, chỉ mục đã cài đặt hoặc đường dẫn tải đã thay đổi cần hiển thị trong lần đọc siêu dữ liệu tiếp theo

Các thành phần gọi dựng lại siêu dữ liệu manifest từ chỉ mục Plugin đã cài đặt và được lưu bền vững sẽ tái tạo sổ đăng ký đó theo yêu cầu. Chỉ mục đã cài đặt là trạng thái bền vững của mặt phẳng nguồn; nó không phải là bộ nhớ đệm siêu dữ liệu ẩn trong tiến trình.

## Mô hình sổ đăng ký

Các Plugin đã tải không trực tiếp sửa đổi tùy tiện các biến toàn cục của lõi. Chúng đăng ký vào một sổ đăng ký Plugin trung tâm (`PluginRegistry` trong `src/plugins/registry-types.ts`), theo dõi các bản ghi Plugin (danh tính, nguồn, xuất xứ, trạng thái, chẩn đoán) cùng các mảng cho mọi khả năng: công cụ, hook cũ và hook có kiểu, kênh, nhà cung cấp, trình xử lý RPC của Gateway, tuyến HTTP, trình đăng ký CLI, dịch vụ nền, lệnh do Plugin sở hữu và hàng chục nhóm nhà cung cấp có kiểu khác (giọng nói, embedding, tạo hình ảnh/video/nhạc, tìm nạp/tìm kiếm web, bộ khung tác nhân, hành động phiên, v.v.).

Sau đó, các tính năng lõi đọc từ sổ đăng ký đó thay vì giao tiếp trực tiếp với các mô-đun Plugin. Điều này giữ cho quá trình tải chỉ diễn ra một chiều:

- mô-đun Plugin -> đăng ký vào sổ đăng ký
- thời gian chạy lõi -> sử dụng sổ đăng ký

Sự phân tách đó rất quan trọng đối với khả năng bảo trì. Nhờ vậy, hầu hết bề mặt lõi chỉ cần một điểm tích hợp: "đọc sổ đăng ký", thay vì "xử lý đặc biệt từng mô-đun Plugin".

## Callback liên kết cuộc trò chuyện

Các Plugin liên kết một cuộc trò chuyện có thể phản ứng khi một yêu cầu phê duyệt được giải quyết.

Sử dụng `api.onConversationBindingResolved(...)` để nhận callback sau khi yêu cầu liên kết được phê duyệt hoặc từ chối:

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

Các trường trong tải trọng callback:

- `status`: `"approved"` hoặc `"denied"`
- `decision`: `"allow-once"`, `"allow-always"` hoặc `"deny"`
- `binding`: liên kết đã phân giải cho các yêu cầu được phê duyệt
- `request`: bản tóm tắt yêu cầu ban đầu, gợi ý tách liên kết, id người gửi và siêu dữ liệu cuộc trò chuyện

Callback này chỉ dùng để thông báo. Nó không thay đổi đối tượng được phép liên kết cuộc trò chuyện và chạy sau khi quá trình xử lý phê duyệt của lõi hoàn tất.

## Hook thời gian chạy của nhà cung cấp

Plugin nhà cung cấp có ba lớp:

- **Siêu dữ liệu manifest** để tra cứu ít tốn tài nguyên trước thời gian chạy:
  `setup.providers[].envVars`, `providerAuthEnvVars` tương thích đã lỗi thời,
  `providerAuthAliases`, `providerAuthChoices` và `channelEnvVars`.
- **Hook tại thời điểm cấu hình**: `catalog` (`discovery` cũ) cùng
  `applyConfigDefaults`.
- **Hook thời gian chạy**: hơn 40 hook tùy chọn bao gồm xác thực, phân giải mô hình,
  bao bọc luồng, mức độ suy luận, chính sách phát lại và điểm cuối mức sử dụng. Xem
  [Thứ tự và cách sử dụng hook](#hook-order-and-usage).

OpenClaw vẫn sở hữu vòng lặp tác nhân chung, chuyển đổi dự phòng, xử lý bản ghi hội thoại và chính sách công cụ. Các hook này là bề mặt mở rộng dành cho hành vi đặc thù của nhà cung cấp mà không cần một cơ chế truyền tải suy luận tùy chỉnh hoàn chỉnh.

Sử dụng `setup.providers[].envVars` trong manifest khi nhà cung cấp có thông tin xác thực dựa trên biến môi trường mà các luồng xác thực/trạng thái/trình chọn mô hình dùng chung cần nhận biết mà không phải tải môi trường chạy của plugin. `providerAuthEnvVars` đã ngừng dùng vẫn được bộ điều hợp tương thích đọc trong thời gian chuyển tiếp ngừng hỗ trợ, và các plugin không được đóng gói sử dụng trường này sẽ nhận được chẩn đoán manifest. Sử dụng `providerAuthAliases` trong manifest khi một mã định danh nhà cung cấp cần tái sử dụng các biến môi trường, hồ sơ xác thực, xác thực dựa trên cấu hình và lựa chọn thiết lập ban đầu bằng khóa API của một mã định danh nhà cung cấp khác. Sử dụng `providerAuthChoices` trong manifest khi các giao diện CLI về thiết lập ban đầu/lựa chọn xác thực cần biết mã định danh lựa chọn, nhãn nhóm và cách nối xác thực đơn giản bằng một cờ của nhà cung cấp mà không phải tải môi trường chạy của nhà cung cấp. Giữ `envVars` trong môi trường chạy của nhà cung cấp cho các gợi ý dành cho người vận hành, chẳng hạn như nhãn thiết lập ban đầu hoặc các biến thiết lập mã định danh máy khách/khóa bí mật máy khách OAuth.

Sử dụng `channelEnvVars` trong manifest khi một kênh có quy trình xác thực hoặc thiết lập dựa trên biến môi trường mà cơ chế dự phòng biến môi trường shell dùng chung, các bước kiểm tra cấu hình/trạng thái hoặc lời nhắc thiết lập cần nhận biết mà không phải tải môi trường chạy của kênh.

### Thứ tự và cách sử dụng hook

Đối với các plugin mô hình/nhà cung cấp, OpenClaw gọi các hook theo thứ tự gần đúng sau.
Cột "Thời điểm sử dụng" là hướng dẫn ra quyết định nhanh.
Các trường nhà cung cấp chỉ dành cho khả năng tương thích mà OpenClaw không còn gọi, chẳng hạn như `ProviderPlugin.capabilities` và `suppressBuiltInModel`, được chủ ý không liệt kê tại đây.

| Hook                              | Chức năng                                                                                                                   | Khi nào nên dùng                                                                                                                                                                          |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `catalog`                         | Đưa cấu hình nhà cung cấp vào `models.providers` trong quá trình tạo `models.json`                                           | Nhà cung cấp sở hữu danh mục hoặc các giá trị mặc định của URL cơ sở                                                                                                                      |
| `applyConfigDefaults`             | Áp dụng các giá trị mặc định của cấu hình toàn cục do nhà cung cấp sở hữu trong quá trình hiện thực hóa cấu hình             | Các giá trị mặc định phụ thuộc vào chế độ xác thực, môi trường hoặc ngữ nghĩa họ mô hình của nhà cung cấp                                                                                  |
| _(tra cứu mô hình tích hợp sẵn)_  | OpenClaw thử đường dẫn sổ đăng ký/danh mục thông thường trước                                                               | _(không phải Hook của Plugin)_                                                                                                                                                            |
| `normalizeModelId`                | Chuẩn hóa các bí danh ID mô hình cũ hoặc thử nghiệm trước khi tra cứu                                                       | Nhà cung cấp sở hữu việc dọn dẹp bí danh trước khi phân giải mô hình chuẩn tắc                                                                                                             |
| `normalizeTransport`              | Chuẩn hóa `api` / `baseUrl` của họ nhà cung cấp trước khi lắp ráp mô hình chung                                              | Nhà cung cấp sở hữu việc dọn dẹp phương thức truyền tải cho các ID nhà cung cấp tùy chỉnh trong cùng họ phương thức truyền tải                                                             |
| `normalizeConfig`                 | Chuẩn hóa `models.providers.<id>` trước khi phân giải thời gian chạy/nhà cung cấp                                            | Nhà cung cấp cần dọn dẹp cấu hình và logic này nên nằm trong Plugin; các trình trợ giúp tích hợp sẵn của họ Google cũng hỗ trợ dự phòng cho những mục cấu hình Google được hỗ trợ          |
| `applyNativeStreamingUsageCompat` | Áp dụng các phép viết lại tương thích về mức sử dụng luồng phát trực tiếp gốc cho các nhà cung cấp trong cấu hình            | Nhà cung cấp cần sửa siêu dữ liệu mức sử dụng luồng phát trực tiếp gốc dựa trên điểm cuối                                                                                                  |
| `resolveConfigApiKey`             | Phân giải xác thực bằng dấu mốc môi trường cho các nhà cung cấp trong cấu hình trước khi tải xác thực thời gian chạy          | Các nhà cung cấp cung cấp Hook riêng để phân giải khóa API bằng dấu mốc môi trường                                                                                                         |
| `resolveSyntheticAuth`            | Cung cấp xác thực cục bộ/tự lưu trữ hoặc dựa trên cấu hình mà không lưu văn bản thuần                                        | Nhà cung cấp có thể hoạt động với dấu mốc thông tin xác thực tổng hợp/cục bộ                                                                                                               |
| `resolveExternalAuthProfiles`     | Phủ các hồ sơ xác thực bên ngoài do nhà cung cấp sở hữu; `persistence` mặc định là `runtime-only` đối với thông tin xác thực do CLI/ứng dụng sở hữu | Nhà cung cấp tái sử dụng thông tin xác thực bên ngoài mà không lưu các mã làm mới đã sao chép; khai báo `contracts.externalAuthProviders` trong tệp kê khai                                 |
| `shouldDeferSyntheticProfileAuth` | Hạ mức ưu tiên của các phần giữ chỗ trong hồ sơ tổng hợp đã lưu xuống dưới xác thực dựa trên môi trường/cấu hình             | Nhà cung cấp lưu các hồ sơ giữ chỗ tổng hợp không nên được ưu tiên                                                                                                                         |
| `resolveDynamicModel`             | Cơ chế dự phòng đồng bộ cho các ID mô hình do nhà cung cấp sở hữu nhưng chưa có trong sổ đăng ký cục bộ                     | Nhà cung cấp chấp nhận ID mô hình thượng nguồn tùy ý                                                                                                                                       |
| `prepareDynamicModel`             | Khởi động trước bất đồng bộ, sau đó chạy lại `resolveDynamicModel`                                                           | Nhà cung cấp cần siêu dữ liệu mạng trước khi phân giải các ID chưa biết                                                                                                                    |
| `normalizeResolvedModel`          | Phép viết lại cuối cùng trước khi trình chạy nhúng sử dụng mô hình đã phân giải                                              | Nhà cung cấp cần viết lại phương thức truyền tải nhưng vẫn sử dụng phương thức truyền tải cốt lõi                                                                                          |
| `normalizeToolSchemas`            | Chuẩn hóa lược đồ công cụ trước khi trình chạy nhúng tiếp nhận                                                               | Nhà cung cấp cần dọn dẹp lược đồ theo họ phương thức truyền tải                                                                                                                            |
| `inspectToolSchemas`              | Cung cấp chẩn đoán lược đồ do nhà cung cấp sở hữu sau khi chuẩn hóa                                                         | Nhà cung cấp muốn cảnh báo từ khóa mà không cần đưa các quy tắc riêng của nhà cung cấp vào phần cốt lõi                                                                                    |
| `resolveReasoningOutputMode`      | Chọn hợp đồng đầu ra suy luận gốc hoặc có gắn thẻ                                                                            | Nhà cung cấp cần đầu ra suy luận/kết quả cuối có gắn thẻ thay vì các trường gốc                                                                                                            |
| `prepareExtraParams`              | Chuẩn hóa tham số yêu cầu trước các trình bao tùy chọn luồng phát chung                                                      | Nhà cung cấp cần tham số yêu cầu mặc định hoặc dọn dẹp tham số theo từng nhà cung cấp                                                                                                      |
| `createStreamFn`                  | Thay thế hoàn toàn đường dẫn luồng phát thông thường bằng phương thức truyền tải tùy chỉnh                                   | Nhà cung cấp cần giao thức đường truyền tùy chỉnh, không chỉ một trình bao                                                                                                                 |
| `wrapStreamFn`                    | Trình bao luồng phát sau khi áp dụng các trình bao chung                                                                     | Nhà cung cấp cần các trình bao tương thích cho tiêu đề/nội dung yêu cầu/mô hình mà không cần phương thức truyền tải tùy chỉnh                                                              |
| `resolveTransportTurnState`       | Đính kèm tiêu đề hoặc siêu dữ liệu truyền tải gốc cho từng lượt                                                              | Nhà cung cấp muốn các phương thức truyền tải chung gửi danh tính lượt theo định dạng gốc của nhà cung cấp                                                                                  |
| `resolveWebSocketSessionPolicy`   | Đính kèm tiêu đề WebSocket gốc hoặc chính sách thời gian chờ của phiên                                                       | Nhà cung cấp muốn các phương thức truyền tải WS chung điều chỉnh tiêu đề phiên hoặc chính sách dự phòng                                                                                    |
| `formatApiKey`                    | Trình định dạng hồ sơ xác thực: hồ sơ đã lưu trở thành chuỗi `apiKey` thời gian chạy                                         | Nhà cung cấp lưu thêm siêu dữ liệu xác thực và cần hình dạng mã thông báo thời gian chạy tùy chỉnh                                                                                         |
| `refreshOAuth`                    | Ghi đè quá trình làm mới OAuth cho các điểm cuối làm mới tùy chỉnh hoặc chính sách xử lý lỗi làm mới                         | Nhà cung cấp không phù hợp với các trình làm mới dùng chung của OpenClaw                                                                                                                   |
| `buildAuthDoctorHint`             | Gợi ý sửa chữa được thêm vào khi làm mới OAuth thất bại                                                                      | Nhà cung cấp cần hướng dẫn sửa chữa xác thực do mình sở hữu sau khi làm mới thất bại                                                                                                       |
| `matchesContextOverflowError`     | Bộ đối sánh tràn cửa sổ ngữ cảnh do nhà cung cấp sở hữu                                                                      | Nhà cung cấp có các lỗi tràn thô mà phương pháp suy đoán chung sẽ bỏ sót                                                                                                                   |
| `classifyFailoverReason`          | Phân loại lý do chuyển đổi dự phòng do nhà cung cấp sở hữu                                                                   | Nhà cung cấp có thể ánh xạ lỗi API/phương thức truyền tải thô thành giới hạn tốc độ/quá tải/v.v.                                                                                           |
| `isCacheTtlEligible`              | Chính sách bộ nhớ đệm lời nhắc cho các nhà cung cấp proxy/hạ tuyến                                                           | Nhà cung cấp cần cơ chế giới hạn TTL của bộ nhớ đệm dành riêng cho proxy                                                                                                                   |
| `buildMissingAuthMessage`         | Thay thế thông báo khôi phục chung khi thiếu xác thực                                                                        | Nhà cung cấp cần gợi ý khôi phục riêng khi thiếu xác thực                                                                                                                                  |
| `augmentModelCatalog`             | Các hàng danh mục tổng hợp/cuối cùng được thêm sau khi khám phá (đã lỗi thời, xem bên dưới)                                  | Nhà cung cấp cần các hàng tương thích xuôi tổng hợp trong `models list` và các bộ chọn                                                                                                     |
| `resolveThinkingProfile`          | Bộ mức `/think`, nhãn hiển thị và giá trị mặc định dành riêng cho mô hình                                                    | Nhà cung cấp cung cấp thang mức suy nghĩ tùy chỉnh hoặc nhãn nhị phân cho các mô hình đã chọn                                                                                              |
| `isBinaryThinking`                | Hook tương thích cho nút bật/tắt suy luận                                                                                    | Nhà cung cấp chỉ cung cấp chế độ bật/tắt suy nghĩ nhị phân                                                                                                                                |
| `supportsXHighThinking`           | Hook tương thích hỗ trợ suy luận `xhigh`                                                                                     | Nhà cung cấp chỉ muốn bật `xhigh` cho một tập con các mô hình                                                                                                                              |
| `resolveDefaultThinkingLevel`     | Hook tương thích cho mức `/think` mặc định                                                                                   | Nhà cung cấp sở hữu chính sách `/think` mặc định cho một họ mô hình                                                                                                                        |
| `isModernModelRef`                | Bộ đối sánh mô hình hiện đại cho bộ lọc hồ sơ trực tiếp và lựa chọn kiểm thử khói                                            | Nhà cung cấp sở hữu việc đối sánh mô hình ưu tiên cho hoạt động trực tiếp/kiểm thử khói                                                                                                    |
| `prepareRuntimeAuth`              | Trao đổi thông tin xác thực đã cấu hình lấy mã thông báo/khóa thời gian chạy thực tế ngay trước khi suy luận                  | Nhà cung cấp cần trao đổi mã thông báo hoặc thông tin xác thực yêu cầu có thời hạn ngắn                                                                                                    |
| `resolveUsageAuth`                | Phân giải thông tin xác thực về mức sử dụng/thanh toán cho `/usage` và các bề mặt trạng thái liên quan                       | Nhà cung cấp cần phân tích cú pháp mã thông báo mức sử dụng/hạn mức tùy chỉnh hoặc một thông tin xác thực mức sử dụng khác                                                                  |
| `fetchUsageSnapshot`              | Tìm nạp và chuẩn hóa ảnh chụp nhanh về mức sử dụng/hạn mức riêng của nhà cung cấp sau khi phân giải xác thực                 | Nhà cung cấp cần điểm cuối mức sử dụng hoặc trình phân tích tải trọng riêng                                                                                                                |
| `createEmbeddingProvider`         | Xây dựng bộ điều hợp nhúng do nhà cung cấp sở hữu cho bộ nhớ/tìm kiếm                                                     | Hành vi nhúng bộ nhớ thuộc về Plugin của nhà cung cấp                                                                                    |
| `buildReplayPolicy`               | Trả về chính sách phát lại kiểm soát việc xử lý bản ghi hội thoại cho nhà cung cấp                                        | Nhà cung cấp cần chính sách bản ghi hội thoại tùy chỉnh (ví dụ: loại bỏ khối suy luận)                                                               |
| `sanitizeReplayHistory`           | Viết lại lịch sử phát lại sau khi dọn dẹp bản ghi hội thoại chung                                                        | Nhà cung cấp cần các phép viết lại phát lại dành riêng cho nhà cung cấp ngoài các trình trợ giúp Compaction dùng chung                                                             |
| `validateReplayTurns`             | Xác thực hoặc định hình lại lượt phát lại lần cuối trước trình chạy nhúng                                           | Cơ chế truyền tải của nhà cung cấp cần xác thực lượt nghiêm ngặt hơn sau khi làm sạch chung                                                                    |
| `onModelSelected`                 | Chạy các tác dụng phụ sau khi lựa chọn do nhà cung cấp sở hữu                                                                 | Nhà cung cấp cần dữ liệu đo từ xa hoặc trạng thái do nhà cung cấp sở hữu khi một mô hình được kích hoạt                                                                  |

`normalizeModelId`, `normalizeTransport` và `normalizeConfig` trước tiên kiểm tra plugin nhà cung cấp khớp, sau đó chuyển tiếp qua các plugin nhà cung cấp khác có hỗ trợ hook cho đến khi một plugin thực sự thay đổi mã mô hình hoặc phương thức truyền tải/cấu hình. Điều này giúp các shim nhà cung cấp về bí danh/tương thích tiếp tục hoạt động mà không yêu cầu bên gọi phải biết plugin đi kèm nào sở hữu thao tác ghi lại. Nếu không có hook nhà cung cấp nào ghi lại một mục cấu hình được hỗ trợ thuộc họ Google, trình chuẩn hóa cấu hình Google đi kèm vẫn áp dụng thao tác dọn dẹp tương thích đó.

Nếu nhà cung cấp cần một giao thức truyền trên dây hoàn toàn tùy chỉnh hoặc một bộ thực thi yêu cầu tùy chỉnh, thì đó là một loại tiện ích mở rộng khác. Các hook này dành cho hành vi nhà cung cấp vẫn chạy trên vòng lặp suy luận thông thường của OpenClaw.

`resolveUsageAuth` quyết định OpenClaw nên gọi `fetchUsageSnapshot` hay chuyển sang cơ chế phân giải thông tin xác thực chung cho các bề mặt mức sử dụng/trạng thái. Trả về `{ token, accountId?, subscriptionType?, rateLimitTier? }` khi nhà cung cấp có thông tin xác thực mức sử dụng (siêu dữ liệu gói tùy chọn được chuyển vào `fetchUsageSnapshot`), trả về `{ handled: true }` khi cơ chế xác thực mức sử dụng do nhà cung cấp sở hữu đã xử lý yêu cầu và phải ngăn cơ chế dự phòng khóa API/OAuth chung, đồng thời trả về `null` hoặc `undefined` khi nhà cung cấp không xử lý xác thực mức sử dụng.

Khai báo thông tin xác thực tổ chức hoặc thanh toán trong `providerUsageAuthEnvVars` của manifest. Điều này cho phép các bề mặt khám phá chung và xóa thông tin bí mật nhận diện chúng mà không biến chúng thành ứng viên xác thực suy luận.

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

Các plugin nhà cung cấp đi kèm kết hợp những hook ở trên để phù hợp với nhu cầu danh mục, xác thực, suy luận, phát lại và mức sử dụng của từng nhà cung cấp. Tập hợp hook có thẩm quyền nằm cùng mỗi plugin trong `extensions/`; trang này minh họa các cấu trúc thay vì sao chép danh sách.

<AccordionGroup>
  <Accordion title="Nhà cung cấp danh mục chuyển tiếp nguyên trạng">
    OpenRouter, Kilocode, Z.AI, xAI đăng ký `catalog` cùng với
    `resolveDynamicModel` / `prepareDynamicModel` để có thể hiển thị các mã mô hình
    thượng nguồn trước danh mục tĩnh của OpenClaw.
  </Accordion>
  <Accordion title="Nhà cung cấp điểm cuối OAuth và mức sử dụng">
    GitHub Copilot, Gemini CLI, ChatGPT Codex, MiniMax, Xiaomi, z.ai kết hợp
    `prepareRuntimeAuth` hoặc `formatApiKey` với `resolveUsageAuth` +
    `fetchUsageSnapshot` để sở hữu việc trao đổi token và tích hợp `/usage`.
  </Accordion>
  <Accordion title="Các họ dọn dẹp phát lại và bản chép lời">
    Các họ dùng chung có tên (`google-gemini`, `passthrough-gemini`,
    `anthropic-by-model`, `hybrid-anthropic-openai`) cho phép nhà cung cấp chọn
    tham gia chính sách bản chép lời qua `buildReplayPolicy` thay vì để từng plugin
    triển khai lại thao tác dọn dẹp.
  </Accordion>
  <Accordion title="Nhà cung cấp chỉ có danh mục">
    `byteplus`, `cloudflare-ai-gateway`, `huggingface`, `kimi-coding`, `nvidia`,
    `qianfan`, `synthetic`, `together`, `venice`, `vercel-ai-gateway` và
    `volcengine` chỉ đăng ký `catalog` rồi sử dụng vòng lặp suy luận dùng chung.
  </Accordion>
  <Accordion title="Trình trợ giúp luồng dành riêng cho Anthropic">
    Các tiêu đề beta, `/fast` / `serviceTier` và `context1m` nằm trong
    bề mặt công khai `api.ts` / `contract-api.ts` của plugin Anthropic
    (`wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`) thay vì trong
    SDK chung.
  </Accordion>
</AccordionGroup>

## Trình trợ giúp thời gian chạy

Các plugin có thể truy cập một số trình trợ giúp lõi được chọn qua `api.runtime`. Đối với TTS:

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

Lưu ý:

- `textToSpeech` trả về tải trọng đầu ra TTS lõi thông thường cho các bề mặt tệp/tin nhắn thoại.
- Sử dụng cấu hình `messages.tts` lõi và cơ chế chọn nhà cung cấp.
- Trả về bộ đệm âm thanh PCM cùng tần số lấy mẫu. Các plugin phải lấy mẫu lại/mã hóa cho nhà cung cấp.
- `listVoices` là tùy chọn đối với từng nhà cung cấp. Hãy dùng nó cho bộ chọn giọng nói hoặc luồng thiết lập do nhà cung cấp sở hữu.
- Lõi chuyển thời hạn yêu cầu đã phân giải tới các hook `listVoices` của nhà cung cấp; thiết lập thời gian chờ dành riêng cho nhà cung cấp có thể ghi đè thời hạn này.
- Danh sách giọng nói có thể bao gồm siêu dữ liệu phong phú hơn như ngôn ngữ-vùng, giới tính và thẻ tính cách cho các bộ chọn nhận biết nhà cung cấp.
- OpenAI và ElevenLabs hiện hỗ trợ điện thoại. Microsoft thì không.

Các plugin cũng có thể đăng ký nhà cung cấp giọng nói qua `api.registerSpeechProvider(...)`.

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

- Giữ chính sách TTS, cơ chế dự phòng và việc gửi phản hồi trong lõi.
- Sử dụng nhà cung cấp giọng nói cho hành vi tổng hợp do nhà cung cấp sở hữu.
- Đầu vào Microsoft `edge` cũ được chuẩn hóa thành mã nhà cung cấp `microsoft`.
- Mô hình sở hữu được ưu tiên là theo công ty: một plugin nhà cung cấp có thể sở hữu
  các nhà cung cấp văn bản, giọng nói, hình ảnh và phương tiện tương lai khi OpenClaw bổ sung
  các hợp đồng năng lực đó.

Đối với khả năng hiểu hình ảnh/âm thanh/video, các plugin đăng ký một nhà cung cấp hiểu phương tiện có kiểu thay vì một tập hợp khóa/giá trị chung:

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
- Việc mở rộng theo hướng bổ sung phải giữ nguyên kiểu dữ liệu: phương thức tùy chọn mới, trường kết quả tùy chọn mới, năng lực tùy chọn mới.
- Tạo video đã tuân theo cùng một mẫu:
  - lõi sở hữu hợp đồng năng lực và trình trợ giúp thời gian chạy
  - các plugin nhà cung cấp đăng ký `api.registerVideoGenerationProvider(...)`
  - các plugin tính năng/kênh sử dụng `api.runtime.videoGeneration.*`

Đối với các trình trợ giúp thời gian chạy để hiểu phương tiện, plugin có thể gọi:

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

Đối với việc chép lời âm thanh, plugin có thể dùng thời gian chạy hiểu phương tiện hoặc bí danh STT cũ hơn:

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // Optional when MIME cannot be inferred reliably:
  mime: "audio/ogg",
});
```

Lưu ý:

- `api.runtime.mediaUnderstanding.*` là bề mặt dùng chung được ưu tiên cho
  khả năng hiểu hình ảnh/âm thanh/video.
- `extractStructuredWithModel(...)` là bề mặt dành cho plugin để trích xuất có giới hạn, ưu tiên hình ảnh và do nhà cung cấp sở hữu. Hãy bao gồm ít nhất một đầu vào hình ảnh;
  đầu vào văn bản là ngữ cảnh bổ sung. Các plugin sản phẩm sở hữu tuyến và
  lược đồ của chúng, còn OpenClaw sở hữu ranh giới nhà cung cấp/thời gian chạy.
- Sử dụng cấu hình âm thanh hiểu phương tiện của lõi (`tools.media.audio`) và thứ tự dự phòng nhà cung cấp.
- Trả về `{ text: undefined }` khi không tạo ra đầu ra chép lời nào (ví dụ: đầu vào bị bỏ qua/không được hỗ trợ).
- `api.runtime.stt.transcribeAudioFile(...)` vẫn được duy trì như một bí danh tương thích.

Các plugin cũng có thể khởi chạy các lượt chạy tác tử con trong nền qua `api.runtime.subagent`:

```ts
const result = await api.runtime.subagent.run({
  sessionKey: "agent:main:subagent:search-helper",
  message: "Expand this query into focused follow-up searches.",
  provider: "openai",
  model: "gpt-4.1-mini",
  deliver: false,
});
```

Lưu ý:

- `provider` và `model` là các giá trị ghi đè tùy chọn cho từng lượt chạy, không phải thay đổi phiên lâu dài.
- OpenClaw chỉ tôn trọng các trường ghi đè đó đối với bên gọi đáng tin cậy.
- Đối với các lượt chạy dự phòng do plugin sở hữu, người vận hành phải chủ động bật bằng `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Sử dụng `plugins.entries.<id>.subagent.allowedModels` để giới hạn các plugin đáng tin cậy vào những đích `provider/model` chuẩn cụ thể, hoặc `"*"` để cho phép rõ ràng mọi đích.
- Các lượt chạy tác tử con của plugin không đáng tin cậy vẫn hoạt động, nhưng yêu cầu ghi đè sẽ bị từ chối thay vì âm thầm chuyển sang cơ chế dự phòng.
- Các phiên tác tử con do plugin tạo được gắn thẻ bằng mã plugin tạo ra chúng. Cơ chế dự phòng `api.runtime.subagent.deleteSession(...)` chỉ có thể xóa các phiên thuộc sở hữu đó; việc xóa phiên tùy ý vẫn yêu cầu một yêu cầu Gateway có phạm vi quản trị viên.

Đối với tìm kiếm web, các plugin có thể sử dụng trình trợ giúp thời gian chạy dùng chung thay vì truy cập trực tiếp vào hệ thống kết nối công cụ của tác tử:

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

Các plugin cũng có thể đăng ký nhà cung cấp tìm kiếm web qua `api.registerWebSearchProvider(...)`.

Lưu ý:

- Giữ việc chọn nhà cung cấp, phân giải thông tin xác thực và ngữ nghĩa yêu cầu dùng chung trong lõi.
- Sử dụng nhà cung cấp tìm kiếm web cho các phương thức truyền tải tìm kiếm dành riêng cho nhà cung cấp.
- `api.runtime.webSearch.*` là bề mặt dùng chung được ưu tiên cho các plugin tính năng/kênh cần hành vi tìm kiếm mà không phụ thuộc vào trình bao công cụ tác tử.

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
- `listProviders(...)`: liệt kê các nhà cung cấp tạo hình ảnh hiện có và năng lực của chúng.

## Tuyến HTTP của Gateway

Các plugin có thể cung cấp điểm cuối HTTP bằng `api.registerHttpRoute(...)`.

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

- `path`: đường dẫn tuyến trong máy chủ HTTP của Gateway.
- `auth`: bắt buộc, `"gateway"` hoặc `"plugin"`. Dùng `"gateway"` để yêu cầu xác thực Gateway thông thường, hoặc `"plugin"` để Plugin quản lý việc xác thực/xác minh Webhook.
- `match`: tùy chọn. `"exact"` (mặc định) hoặc `"prefix"`.
- `handleUpgrade`: trình xử lý tùy chọn cho các yêu cầu nâng cấp WebSocket trên cùng tuyến.
- `replaceExisting`: tùy chọn. Cho phép cùng một Plugin thay thế đăng ký tuyến hiện có của chính nó.
- `handler`: trả về `true` khi tuyến đã xử lý yêu cầu.

Lưu ý:

- `api.registerHttpHandler(...)` đã bị xóa và sẽ gây lỗi khi tải Plugin. Thay vào đó, hãy dùng `api.registerHttpRoute(...)`.
- Các tuyến của Plugin phải khai báo `auth` rõ ràng.
- Xung đột `path + match` trùng khớp chính xác sẽ bị từ chối trừ khi `replaceExisting: true`, và một Plugin không thể thay thế tuyến của Plugin khác.
- Các tuyến chồng lấn có cấp độ `auth` khác nhau sẽ bị từ chối. Chỉ giữ các chuỗi chuyển tiếp `exact`/`prefix` ở cùng một cấp độ xác thực.
- Các tuyến `auth: "plugin"` **không** tự động nhận phạm vi thời gian chạy của người vận hành. Chúng dành cho Webhook/xác minh chữ ký do Plugin quản lý, không dành cho các lệnh gọi trợ giúp Gateway có đặc quyền.
- Các tuyến `auth: "gateway"` chạy trong phạm vi thời gian chạy của yêu cầu Gateway. Bề mặt mặc định (`gatewayRuntimeScopeSurface: "write-default"`) được thiết kế thận trọng:
  - xác thực bearer bằng bí mật dùng chung (`gateway.auth.mode = "token"` / `"password"`) và mọi phương thức xác thực không phải proxy đáng tin cậy chỉ nhận một phạm vi `operator.write`, ngay cả khi bên gọi gửi `x-openclaw-scopes`
  - bên gọi `trusted-proxy` không có tiêu đề `x-openclaw-scopes` rõ ràng cũng giữ bề mặt cũ chỉ có `operator.write`
  - bên gọi `trusted-proxy` có gửi `x-openclaw-scopes` sẽ nhận các phạm vi đã khai báo
  - một tuyến có thể chọn dùng `gatewayRuntimeScopeSurface: "trusted-operator"` để luôn tôn trọng `x-openclaw-scopes` đối với các chế độ xác thực mang danh tính (chuyển sang bộ phạm vi mặc định đầy đủ của CLI khi không có tiêu đề)
- Quy tắc thực tế: không được giả định một tuyến Plugin được xác thực qua Gateway mặc nhiên là bề mặt quản trị. Nếu tuyến cần hành vi chỉ dành cho quản trị viên, hãy chọn bề mặt phạm vi `trusted-operator`, yêu cầu chế độ xác thực mang danh tính và ghi lại rõ hợp đồng tiêu đề `x-openclaw-scopes`.
- Sau khi khớp tuyến và xác thực, các trình xử lý thông thường tham gia cơ chế tiếp nhận công việc gốc của Gateway. Gateway đang được chuẩn bị hoặc khởi động lại sẽ trả về `503` trước khi gọi trình xử lý. Ngoại lệ hẹp là tuyến `auth: "gateway"` được manifest cấp quyền và đồng thời chọn bề mặt `trusted-operator` dành riêng cho tuyến; tuyến này vẫn có thể truy cập để hoạt động điều phối kiểm soát tạm ngưng không bị mắc kẹt, trong khi các tuyến ngang hàng thông thường của cùng Plugin vẫn nằm sau ranh giới tiếp nhận. Quyền sở hữu `handleUpgrade` của WebSocket sử dụng cùng ranh giới tiếp nhận nguyên tử; sau khi trình xử lý chấp nhận một socket, vòng đời tiếp theo của socket thuộc quyền sở hữu của Plugin và không được ranh giới này theo dõi.

## Đường dẫn nhập Plugin SDK

Khi tạo Plugin mới, hãy dùng các đường dẫn con SDK hẹp thay vì barrel gốc nguyên khối `openclaw/plugin-sdk`.
Các đường dẫn con cốt lõi:

| Đường dẫn con                       | Mục đích                                            |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | Các thành phần cơ bản để đăng ký Plugin            |
| `openclaw/plugin-sdk/channel-core`  | Trình trợ giúp tạo/xây dựng kênh                   |
| `openclaw/plugin-sdk/core`          | Trình trợ giúp dùng chung tổng quát và hợp đồng bao quát |
| `openclaw/plugin-sdk/config-schema` | Lược đồ Zod `openclaw.json` gốc (`OpenClawSchema`) |

Các Plugin kênh chọn từ một nhóm giao diện hẹp — `channel-setup`,
`setup-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-outbound`,
`command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets` và `channel-actions`. Hành vi phê duyệt nên được hợp nhất
trên một hợp đồng `approvalCapability` thay vì trộn lẫn giữa các trường
Plugin không liên quan. Xem [Plugin kênh](/vi/plugins/sdk-channel-plugins).

Các trình trợ giúp thời gian chạy và cấu hình nằm trong những đường dẫn con
`*-runtime` tập trung tương ứng (`approval-runtime`, `agent-runtime`,
`lazy-runtime`, `directory-runtime`, `text-runtime`, `runtime-store`,
`system-event-runtime`, `heartbeat-runtime`, `channel-activity-runtime`, v.v.).
Ưu tiên `config-contracts`, `plugin-config-runtime`, `runtime-config-snapshot`
và `config-mutation` thay vì barrel tương thích `config-runtime` có phạm vi rộng.

<Info>
`openclaw/plugin-sdk/channel-runtime`, `openclaw/plugin-sdk/channel-lifecycle`,
các facade trợ giúp kênh nhỏ, `openclaw/plugin-sdk/outbound-runtime`,
`openclaw/plugin-sdk/outbound-send-deps`, `openclaw/plugin-sdk/config-runtime`
và `openclaw/plugin-sdk/infra-runtime` là các shim tương thích đã lỗi thời dành
cho những Plugin cũ. Mã mới nên nhập các thành phần cơ bản tổng quát hẹp hơn.
</Info>

Các điểm vào nội bộ kho mã (tính từ thư mục gốc của mỗi gói Plugin tích hợp):

- `index.js` — điểm vào của Plugin tích hợp
- `api.js` — barrel trình trợ giúp/kiểu
- `runtime-api.js` — barrel chỉ dành cho thời gian chạy
- `setup-entry.js` — điểm vào Plugin thiết lập

Các Plugin bên ngoài chỉ nên nhập những đường dẫn con `openclaw/plugin-sdk/*`.
Không bao giờ nhập `src/*` của gói Plugin khác từ lõi hoặc từ một Plugin khác.
Các điểm vào được tải qua facade ưu tiên ảnh chụp nhanh cấu hình thời gian chạy
đang hoạt động nếu có, sau đó mới chuyển sang tệp cấu hình đã phân giải trên đĩa.

Các đường dẫn con dành riêng cho năng lực như `image-generation`,
`media-understanding` và `speech` tồn tại vì các Plugin tích hợp hiện đang sử
dụng chúng. Chúng không tự động trở thành những hợp đồng bên ngoài ổn định lâu
dài — hãy kiểm tra trang tham chiếu SDK liên quan khi phụ thuộc vào chúng.

## Lược đồ công cụ tin nhắn

Plugin nên sở hữu các phần đóng góp lược đồ `describeMessageTool(...)` dành
riêng cho kênh đối với các thành phần cơ bản không phải tin nhắn như lượt bày tỏ
cảm xúc, lượt đọc và cuộc thăm dò. Phần trình bày gửi dùng chung nên sử dụng hợp
đồng `MessagePresentation` tổng quát thay vì các trường nút, thành phần, khối
hoặc thẻ gốc của nhà cung cấp.
Xem [Trình bày tin nhắn](/vi/plugins/message-presentation) để biết hợp đồng,
quy tắc dự phòng, ánh xạ nhà cung cấp và danh sách kiểm tra dành cho tác giả Plugin.

Các Plugin có khả năng gửi khai báo những gì chúng có thể kết xuất thông qua
các năng lực tin nhắn:

- `presentation` dành cho các khối trình bày ngữ nghĩa (`text`, `context`,
  `divider`, `chart`, `table`, `buttons`, `select`)
- `delivery-pin` dành cho các yêu cầu ghim nội dung gửi

Lõi quyết định kết xuất phần trình bày theo cách gốc hay hạ cấp thành văn bản.
Không được đưa các lối thoát UI gốc của nhà cung cấp ra khỏi công cụ tin nhắn
tổng quát. Các trình trợ giúp SDK đã lỗi thời dành cho lược đồ gốc cũ vẫn được
xuất để phục vụ các Plugin bên thứ ba hiện có, nhưng Plugin mới không nên dùng chúng.

## Phân giải đích kênh

Các Plugin kênh nên sở hữu ngữ nghĩa đích dành riêng cho kênh. Giữ máy chủ gửi
đi dùng chung ở dạng tổng quát và sử dụng bề mặt bộ điều hợp nhắn tin cho các
quy tắc của nhà cung cấp:

- `messaging.inferTargetChatType({ to })` quyết định xem một đích đã chuẩn hóa
  nên được coi là `direct`, `group` hay `channel` trước khi tra cứu danh bạ.
- `messaging.targetResolver.looksLikeId(raw, normalized)` cho lõi biết liệu
  dữ liệu đầu vào có nên chuyển thẳng sang cơ chế phân giải dạng mã định danh
  thay vì tìm kiếm trong danh bạ hay không.
- `messaging.targetResolver.reservedLiterals` liệt kê các từ riêng lẻ là tham
  chiếu kênh/phiên đối với nhà cung cấp đó. Quá trình phân giải giữ lại các mục
  danh bạ đã cấu hình trước khi từ chối những giá trị dành riêng, sau đó từ chối
  an toàn khi không tìm thấy trong danh bạ.
- `messaging.targetResolver.resolveTarget(...)` là cơ chế dự phòng của Plugin
  khi lõi cần lần phân giải cuối cùng do nhà cung cấp sở hữu sau khi chuẩn hóa
  hoặc sau khi không tìm thấy trong danh bạ.
- `messaging.resolveOutboundSessionRoute(...)` sở hữu việc xây dựng tuyến phiên
  dành riêng cho nhà cung cấp sau khi đích đã được phân giải.

Cách phân chia được đề xuất:

- Dùng `inferTargetChatType` cho các quyết định phân loại cần diễn ra trước khi
  tìm kiếm các đối tác/nhóm.
- Dùng `looksLikeId` cho các kiểm tra "coi đây là mã định danh đích rõ ràng/gốc".
- Dùng `resolveTarget` làm cơ chế dự phòng chuẩn hóa dành riêng cho nhà cung cấp,
  không dùng để tìm kiếm rộng trong danh bạ.
- Giữ các mã định danh gốc của nhà cung cấp như mã cuộc trò chuyện, mã luồng,
  JID, tên định danh và mã phòng bên trong các giá trị `target` hoặc tham số
  dành riêng cho nhà cung cấp, không đặt trong các trường SDK tổng quát.

## Danh bạ dựa trên cấu hình

Các Plugin tạo mục danh bạ từ cấu hình nên giữ logic đó trong Plugin và tái sử
dụng các trình trợ giúp dùng chung từ
`openclaw/plugin-sdk/directory-runtime`.

Dùng cơ chế này khi một kênh cần các đối tác/nhóm dựa trên cấu hình, chẳng hạn:

- các đối tác tin nhắn trực tiếp được điều khiển bằng danh sách cho phép
- ánh xạ kênh/nhóm đã cấu hình
- cơ chế dự phòng danh bạ tĩnh theo phạm vi tài khoản

Các trình trợ giúp dùng chung trong `directory-runtime` chỉ xử lý những thao tác
tổng quát:

- lọc truy vấn
- áp dụng giới hạn
- các trình trợ giúp loại bỏ trùng lặp/chuẩn hóa
- xây dựng `ChannelDirectoryEntry[]`

Việc kiểm tra tài khoản và chuẩn hóa mã định danh dành riêng cho kênh nên được
giữ trong phần triển khai Plugin.

## Danh mục nhà cung cấp

Các Plugin nhà cung cấp có thể định nghĩa danh mục mô hình để suy luận bằng
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` trả về cùng cấu trúc mà OpenClaw ghi vào
`models.providers`:

- `{ provider }` cho một mục nhà cung cấp
- `{ providers }` cho nhiều mục nhà cung cấp

Dùng `catalog` khi Plugin sở hữu mã mô hình dành riêng cho nhà cung cấp, giá trị
mặc định của URL cơ sở hoặc siêu dữ liệu mô hình bị kiểm soát bởi xác thực.

`catalog.order` kiểm soát thời điểm danh mục của Plugin được hợp nhất so với các
nhà cung cấp ngầm định tích hợp sẵn của OpenClaw:

- `simple`: các nhà cung cấp dùng khóa API đơn giản hoặc được điều khiển bằng biến môi trường
- `profile`: các nhà cung cấp xuất hiện khi có hồ sơ xác thực
- `paired`: các nhà cung cấp tổng hợp nhiều mục nhà cung cấp có liên quan
- `late`: lượt cuối cùng, sau các nhà cung cấp ngầm định khác

Nhà cung cấp xuất hiện sau sẽ thắng khi xung đột khóa, vì vậy Plugin có thể chủ
đích ghi đè một mục nhà cung cấp tích hợp có cùng mã nhà cung cấp.

Plugin cũng có thể công bố các hàng mô hình chỉ đọc thông qua
`api.registerModelCatalogProvider({ provider, kinds, staticCatalog, liveCatalog
})`. Đây là hướng phát triển tiếp theo cho các bề mặt danh sách/trợ giúp/bộ chọn
và hỗ trợ các hàng `text`, `voice`, `image_generation`, `video_generation` và
`music_generation`. Plugin nhà cung cấp vẫn sở hữu các lệnh gọi điểm cuối trực
tiếp, trao đổi token và ánh xạ phản hồi của nhà cung cấp; lõi sở hữu cấu trúc
hàng dùng chung, nhãn nguồn và định dạng trợ giúp công cụ phương tiện. Các đăng
ký nhà cung cấp tạo phương tiện tự động tổng hợp những hàng danh mục tĩnh từ
`defaultModel`, `models` và `capabilities`.

Khả năng tương thích:

- `discovery` vẫn hoạt động như một bí danh cũ, nhưng phát cảnh báo lỗi thời
- nếu cả `catalog` và `discovery` đều được đăng ký, OpenClaw sử dụng `catalog`
  và phát cảnh báo
- `augmentModelCatalog` đã lỗi thời; các nhà cung cấp tích hợp nên công bố
  những hàng bổ sung thông qua `registerModelCatalogProvider`

## Kiểm tra kênh chỉ đọc

Nếu Plugin của bạn đăng ký một kênh, hãy ưu tiên triển khai
`plugin.config.inspectAccount(cfg, accountId)` cùng với `resolveAccount(...)`.

Lý do:

- `resolveAccount(...)` là đường dẫn thời gian chạy. Hàm này được phép giả định
  thông tin xác thực đã được hiện thực hóa đầy đủ và có thể thất bại ngay khi
  thiếu các bí mật bắt buộc.
- Các đường dẫn lệnh chỉ đọc như `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve` và các luồng sửa chữa
  của doctor/cấu hình không cần phải hiện thực hóa thông tin xác thực thời gian
  chạy chỉ để mô tả cấu hình.

Hành vi `inspectAccount(...)` được đề xuất:

- Chỉ trả về trạng thái mô tả của tài khoản.
- Giữ nguyên `enabled` và `configured`.
- Bao gồm các trường nguồn/trạng thái thông tin xác thực khi phù hợp, chẳng hạn như:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Bạn không cần trả về giá trị token thô chỉ để báo cáo khả năng sẵn dùng ở chế độ chỉ đọc. Việc trả về `tokenStatus: "available"` (cùng với trường nguồn tương ứng) là đủ cho các lệnh kiểu trạng thái.
- Sử dụng `configured_unavailable` khi thông tin xác thực được cấu hình qua SecretRef nhưng không khả dụng trong đường dẫn lệnh hiện tại.

Điều này cho phép các lệnh chỉ đọc báo cáo "đã cấu hình nhưng không khả dụng trong đường dẫn lệnh này" thay vì gặp sự cố hoặc báo sai rằng tài khoản chưa được cấu hình.

## Gói đóng gói

Một thư mục plugin có thể chứa `package.json` với `openclaw.extensions`:

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"],
    "setupEntry": "./src/setup-entry.ts"
  }
}
```

Mỗi mục trở thành một plugin. Nếu gói liệt kê nhiều phần mở rộng, mã định danh plugin sẽ trở thành `<manifestOrPackageName>/<fileBase>` (mã định danh manifest được ưu tiên khi có; nếu không thì dùng tên `package.json` không có phạm vi).

Nếu plugin của bạn nhập các phần phụ thuộc npm, hãy cài đặt chúng trong thư mục đó để `node_modules` khả dụng (`npm install` / `pnpm install`).

Rào chắn bảo mật: sau khi phân giải liên kết tượng trưng, mọi mục `openclaw.extensions` phải nằm trong thư mục plugin. Các mục thoát ra ngoài thư mục gói sẽ bị từ chối.

Lưu ý bảo mật: `openclaw plugins install` cài đặt các phần phụ thuộc của plugin bằng lệnh `npm install --omit=dev --ignore-scripts` cục bộ trong dự án (không chạy tập lệnh vòng đời, không có phần phụ thuộc phát triển khi chạy), đồng thời bỏ qua các thiết lập cài đặt npm toàn cục được kế thừa. Hãy giữ cây phần phụ thuộc của plugin ở dạng "JS/TS thuần" và tránh các gói yêu cầu bản dựng `postinstall`.

Tùy chọn: `openclaw.setupEntry` có thể trỏ đến một mô-đun nhẹ chỉ dành cho thiết lập. Khi OpenClaw cần các bề mặt thiết lập cho một plugin kênh bị tắt, hoặc khi một plugin kênh đã được bật nhưng vẫn chưa được cấu hình, OpenClaw sẽ tải `setupEntry` thay vì điểm vào đầy đủ của plugin. Điều này giúp quá trình khởi động và thiết lập nhẹ hơn khi điểm vào chính của plugin cũng kết nối các công cụ, hook hoặc mã khác chỉ dùng trong thời gian chạy.

Tùy chọn: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` có thể cho phép một plugin kênh sử dụng cùng đường dẫn `setupEntry` trong giai đoạn khởi động trước khi gateway bắt đầu lắng nghe, ngay cả khi kênh đã được cấu hình.

Chỉ sử dụng tùy chọn này khi `setupEntry` bao phủ đầy đủ bề mặt khởi động phải tồn tại trước khi gateway bắt đầu lắng nghe. Trên thực tế, điều đó có nghĩa là điểm vào thiết lập phải đăng ký mọi khả năng do kênh sở hữu mà quá trình khởi động phụ thuộc vào, chẳng hạn như:

- việc đăng ký chính kênh đó
- mọi tuyến HTTP phải khả dụng trước khi gateway bắt đầu lắng nghe
- mọi phương thức gateway, công cụ hoặc dịch vụ phải tồn tại trong cùng khoảng thời gian đó

Nếu điểm vào đầy đủ của bạn vẫn sở hữu bất kỳ khả năng khởi động bắt buộc nào, đừng bật cờ này. Hãy giữ plugin theo hành vi mặc định và để OpenClaw tải điểm vào đầy đủ trong quá trình khởi động.

Các kênh được đóng gói cũng có thể công bố các trình trợ giúp bề mặt hợp đồng chỉ dành cho thiết lập để lõi có thể tham khảo trước khi tải môi trường chạy đầy đủ của kênh. Bề mặt nâng cấp thiết lập hiện tại là:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Lõi sử dụng bề mặt đó khi cần nâng cấp cấu hình kênh một tài khoản kiểu cũ thành `channels.<id>.accounts.*` mà không tải điểm vào đầy đủ của plugin. Matrix là ví dụ được đóng gói hiện tại: nó chỉ di chuyển các khóa xác thực/khởi tạo vào một tài khoản được nâng cấp có tên khi đã tồn tại các tài khoản có tên, đồng thời có thể giữ lại khóa tài khoản mặc định không chính tắc đã được cấu hình thay vì luôn tạo `accounts.default`.

Các bộ điều hợp bản vá thiết lập đó giữ cho việc khám phá bề mặt hợp đồng được đóng gói diễn ra theo kiểu tải lười. Thời gian nhập vẫn nhẹ; bề mặt nâng cấp chỉ được tải trong lần sử dụng đầu tiên thay vì chạy lại quá trình khởi động kênh được đóng gói khi nhập mô-đun.

Khi các bề mặt khởi động đó bao gồm các phương thức RPC của gateway, hãy đặt chúng dưới một tiền tố dành riêng cho plugin. Các không gian tên quản trị lõi (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) vẫn được dành riêng và luôn phân giải thành `operator.admin`, ngay cả khi một plugin yêu cầu phạm vi hẹp hơn.

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

Các plugin kênh có thể công bố siêu dữ liệu thiết lập/khám phá qua `openclaw.channel` và gợi ý cài đặt qua `openclaw.install`. Điều này giúp danh mục lõi không chứa dữ liệu.

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
- `preferOver`: các mã định danh plugin/kênh có mức ưu tiên thấp hơn mà mục danh mục này nên xếp trên
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: các tùy chọn kiểm soát nội dung trên bề mặt lựa chọn
- `markdownCapable`: đánh dấu kênh có khả năng xử lý markdown để phục vụ các quyết định định dạng gửi đi
- `exposure.configured`: ẩn kênh khỏi các bề mặt liệt kê kênh đã cấu hình khi được đặt thành `false`
- `exposure.setup`: ẩn kênh khỏi các bộ chọn thiết lập/cấu hình tương tác khi được đặt thành `false`
- `exposure.docs`: đánh dấu kênh là nội bộ/riêng tư đối với các bề mặt điều hướng tài liệu
- `showConfigured` / `showInSetup`: các bí danh cũ vẫn được chấp nhận để bảo đảm khả năng tương thích; ưu tiên `exposure`
- `quickstartAllowFrom`: cho phép kênh tham gia luồng khởi động nhanh `allowFrom` tiêu chuẩn
- `forceAccountBinding`: yêu cầu liên kết tài khoản rõ ràng ngay cả khi chỉ tồn tại một tài khoản
- `preferSessionLookupForAnnounceTarget`: ưu tiên tra cứu phiên khi phân giải đích thông báo

OpenClaw cũng có thể hợp nhất **các danh mục kênh bên ngoài** (ví dụ: bản xuất sổ đăng ký MPM). Đặt một tệp JSON tại một trong các vị trí sau:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Hoặc trỏ `OPENCLAW_PLUGIN_CATALOG_PATHS` (hoặc `OPENCLAW_MPM_CATALOG_PATHS`) đến một hoặc nhiều tệp JSON (phân tách bằng dấu phẩy/dấu chấm phẩy/`PATH`). Mỗi tệp phải chứa `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. Trình phân tích cú pháp cũng chấp nhận `"packages"` hoặc `"plugins"` làm bí danh cũ cho khóa `"entries"`.

Các mục danh mục kênh được tạo và các mục danh mục cài đặt nhà cung cấp cung cấp các dữ kiện nguồn cài đặt đã chuẩn hóa bên cạnh khối `openclaw.install` thô. Các dữ kiện đã chuẩn hóa xác định liệu đặc tả npm là một phiên bản chính xác hay bộ chọn động, liệu siêu dữ liệu tính toàn vẹn dự kiến có tồn tại hay không và liệu đường dẫn nguồn cục bộ có khả dụng hay không. Khi biết danh tính danh mục/gói, các dữ kiện đã chuẩn hóa sẽ cảnh báo nếu tên gói npm đã phân tích lệch khỏi danh tính đó. Chúng cũng cảnh báo khi `defaultChoice` không hợp lệ hoặc trỏ đến một nguồn không khả dụng, cũng như khi có siêu dữ liệu tính toàn vẹn npm nhưng không có nguồn npm hợp lệ. Các thành phần sử dụng nên coi `installSource` là một trường tùy chọn bổ sung để các mục được tạo thủ công và các shim danh mục không phải tổng hợp trường này.
Điều này cho phép quy trình làm quen và chẩn đoán giải thích trạng thái bình diện nguồn mà không cần nhập môi trường chạy của plugin.

Các mục npm bên ngoài chính thức nên ưu tiên một `npmSpec` chính xác cùng với `expectedIntegrity`. Tên gói trần và dist-tag vẫn hoạt động để bảo đảm khả năng tương thích, nhưng chúng hiển thị cảnh báo bình diện nguồn để danh mục có thể chuyển dần sang các bản cài đặt được ghim và kiểm tra tính toàn vẹn mà không làm hỏng các plugin hiện có. Khi quy trình làm quen cài đặt từ một đường dẫn danh mục cục bộ, nó ghi một mục chỉ mục plugin được quản lý với `source: "path"` và `sourcePath` tương đối với không gian làm việc khi có thể. Đường dẫn tải vận hành tuyệt đối vẫn nằm trong `plugins.load.paths`; bản ghi cài đặt tránh sao chép các đường dẫn máy trạm cục bộ vào cấu hình tồn tại lâu dài. Điều này giúp các bản cài đặt phát triển cục bộ hiển thị trong chẩn đoán bình diện nguồn mà không bổ sung thêm một bề mặt tiết lộ đường dẫn hệ thống tệp thô thứ hai. Bảng SQLite `installed_plugin_index` được lưu bền vững là nguồn sự thật về cài đặt và có thể được làm mới mà không cần tải các mô-đun môi trường chạy của plugin. Ánh xạ `installRecords` của bảng này vẫn bền vững ngay cả khi manifest plugin bị thiếu hoặc không hợp lệ; tải trọng `plugins` là một dạng xem manifest có thể dựng lại.

## Plugin công cụ ngữ cảnh

Các plugin công cụ ngữ cảnh sở hữu việc điều phối ngữ cảnh phiên cho quá trình tiếp nhận, lắp ráp và Compaction. Đăng ký chúng từ plugin của bạn bằng `api.registerContextEngine(id, factory)`, sau đó chọn công cụ đang hoạt động bằng `plugins.slots.contextEngine`.

Sử dụng tính năng này khi plugin của bạn cần thay thế hoặc mở rộng quy trình ngữ cảnh mặc định thay vì chỉ bổ sung tìm kiếm bộ nhớ hoặc hook.

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

`ctx` của factory cung cấp các giá trị `config`, `agentDir` và `workspaceDir` tùy chọn để khởi tạo tại thời điểm xây dựng.

`assemble()` có thể trả về `contextProjection` khi bộ điều phối đang hoạt động có một luồng backend bền vững. Hãy bỏ qua trường này đối với phép chiếu từng lượt kiểu cũ. Trả về `{ mode: "thread_bootstrap", epoch }` khi ngữ cảnh đã lắp ráp cần được chèn một lần vào luồng backend và được tái sử dụng cho đến khi epoch thay đổi. Hãy thay đổi epoch sau khi ngữ cảnh ngữ nghĩa của công cụ thay đổi, chẳng hạn như sau một lượt Compaction do công cụ sở hữu. Máy chủ có thể giữ lại siêu dữ liệu lệnh gọi công cụ, hình dạng đầu vào và kết quả công cụ đã biên tập trong phép chiếu khởi tạo luồng để các luồng backend mới duy trì tính liên tục của công cụ mà không sao chép tải trọng thô chứa thông tin bí mật.

Nếu công cụ của bạn **không** sở hữu thuật toán Compaction, hãy tiếp tục triển khai `compact()` và ủy quyền nó một cách rõ ràng:

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

Khi Plugin cần hành vi không phù hợp với API hiện tại, đừng vượt qua
hệ thống Plugin bằng cách truy cập riêng vào nội bộ. Hãy bổ sung khả năng còn thiếu.

Trình tự được khuyến nghị:

1. **Xác định hợp đồng lõi.** Quyết định hành vi dùng chung nào mà lõi nên sở hữu:
   chính sách, phương án dự phòng, hợp nhất cấu hình, vòng đời, ngữ nghĩa hướng đến kênh và
   hình dạng trình trợ giúp thời gian chạy.
2. **Thêm các bề mặt đăng ký/thời gian chạy Plugin có kiểu.** Mở rộng
   `OpenClawPluginApi` và/hoặc `api.runtime` bằng bề mặt khả năng có kiểu
   nhỏ nhất nhưng hữu ích.
3. **Kết nối lõi với các thành phần sử dụng kênh/tính năng.** Các kênh và Plugin tính năng
   nên sử dụng khả năng mới thông qua lõi, thay vì nhập trực tiếp một phần triển khai
   của nhà cung cấp.
4. **Đăng ký các phần triển khai của nhà cung cấp.** Sau đó, các Plugin của nhà cung cấp đăng ký
   phần phụ trợ của chúng với khả năng này.
5. **Thêm phạm vi kiểm thử hợp đồng.** Thêm các kiểm thử để quyền sở hữu và hình dạng đăng ký
   luôn được thể hiện rõ ràng theo thời gian.

Đây là cách OpenClaw duy trì định hướng rõ ràng mà không mã hóa cứng theo thế giới quan
của một nhà cung cấp duy nhất. Xem [Sổ tay khả năng](/vi/plugins/adding-capabilities)
để biết danh sách kiểm tra tệp cụ thể và ví dụ hoàn chỉnh.

### Danh sách kiểm tra khả năng

Khi thêm một khả năng mới, phần triển khai thường nên đồng thời cập nhật các
bề mặt sau:

- các kiểu hợp đồng lõi trong `src/<capability>/types.ts`
- trình chạy lõi/trình trợ giúp thời gian chạy trong `src/<capability>/runtime.ts`
- bề mặt đăng ký API Plugin trong `src/plugins/types.ts`
- kết nối sổ đăng ký Plugin trong `src/plugins/registry.ts`
- phần cung cấp thời gian chạy Plugin trong `src/plugins/runtime/*` khi các Plugin tính năng/kênh
  cần sử dụng khả năng đó
- các trình trợ giúp ghi nhận/kiểm thử trong `src/test-utils/plugin-registration.ts`
- các xác nhận về quyền sở hữu/hợp đồng trong `src/plugins/contracts/registry.ts`
- tài liệu dành cho người vận hành/Plugin trong `docs/`

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
quyền sở hữu như `providerContractPluginIds`; các kiểm thử xác nhận danh sách
`contracts.videoGenerationProviders` của Plugin khớp với những gì Plugin thực sự đăng ký):

```ts
expect(pluginManifest.contracts?.videoGenerationProviders).toEqual(["openai"]);
```

Điều đó giúp quy tắc luôn đơn giản:

- lõi sở hữu hợp đồng khả năng + hoạt động điều phối
- các Plugin của nhà cung cấp sở hữu phần triển khai dành cho nhà cung cấp
- các Plugin tính năng/kênh sử dụng trình trợ giúp thời gian chạy
- các kiểm thử hợp đồng giữ cho quyền sở hữu được thể hiện rõ ràng

## Liên quan

- [Kiến trúc Plugin](/vi/plugins/architecture) — mô hình và hình dạng khả năng công khai
- [Đường dẫn con của SDK Plugin](/vi/plugins/sdk-subpaths)
- [Thiết lập SDK Plugin](/vi/plugins/sdk-setup)
- [Xây dựng Plugin](/vi/plugins/building-plugins)
