---
read_when:
    - Bạn đang triển khai hoặc review một giai đoạn của quá trình thiết kế lại quy trình làm quen ban đầu
summary: Kế hoạch triển khai cho việc thiết kế lại quy trình hướng dẫn người quản lý bắt đầu sử dụng (tài liệu được cập nhật liên tục)
title: Thiết kế lại quy trình thiết lập ban đầu
x-i18n:
    generated_at: "2026-07-19T06:02:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: dc1f049d59cfa2638e7332ab4127905141625de5471144c856c91bfe50c9fa11
    source_path: start/onboarding-redesign.md
    workflow: 16
---

# Kế hoạch triển khai thiết kế lại quy trình làm quen

> **Tài liệu động.** Trang này theo dõi việc thiết kế lại quy trình làm quen với vai trò quản trị hệ thống
> ở cấp độ triển khai và được cập nhật khi từng giai đoạn hoàn tất. Khi giai đoạn cuối cùng
> được hợp nhất, trang này sẽ được viết lại thành hướng dẫn làm quen dành cho người dùng và được đưa vào
> điều hướng tài liệu. Cho đến lúc đó, trang này chủ ý không nằm trong `docs.json`.

## Mục tiêu định hướng

Một người dùng không chuyên về kỹ thuật nhập `openclaw onboard` (hoặc mở ứng dụng) và được chào đón
bởi một hiện diện hội thoại duy nhất — OpenClaw, quản trị viên hệ thống ("custodian" chỉ là
tên nội bộ; người dùng luôn thấy "OpenClaw") — có khả năng tìm AI của họ,
thiết lập mọi thứ bằng các giá trị mặc định được thông báo thay vì đặt câu hỏi, cho tác nhân của họ
chào đời như một khoảnh khắc định hình danh tính rõ ràng, và từ đó luôn sẵn sàng với vai trò
người chăm sóc hệ thống. Mặc định kỳ diệu, một ranh giới đồng thuận, không có ngõ cụt.

Các nguyên tắc thiết kế (đã quyết định, không tùy tiện tranh luận lại):

- **Giá trị mặc định được thông báo và dễ hoàn tác** thay thế các câu hỏi gây gián đoạn. Yêu cầu
  bắt buộc duy nhất là suy luận hoạt động được; mọi thứ khác đều là đề xuất.
- **Câu hỏi số không là ranh giới đồng thuận**: "Toàn quyền truy cập" (khuyên dùng) có nghĩa là
  quá trình khám phá diễn ra âm thầm và tự động; "Hỏi trước" đặt mọi hoạt động khám phá — quét AI,
  quét ứng dụng và quét nguồn bộ nhớ — sau một lần đồng ý
  rõ ràng duy nhất, đồng thời cung cấp một quy trình hoàn toàn thủ công không bao giờ quét.
- **Hội thoại làm giao diện người dùng với trí thông minh tăng dần**: bề mặt quản trị viên
  tồn tại trước khi bất kỳ AI nào hoạt động (hội thoại theo kịch bản), chuyển sang được mô hình hỗ trợ
  ngay khi một tuyến được xác minh và thông báo rõ ràng về điều đó. Nó không bao giờ giả vờ thông minh:
  nội dung văn bản tự do được nhập trước khi xác minh tuyến sẽ nhận phản hồi nhẹ nhàng "trước tiên hãy để tôi
  khởi động bộ não của mình".
- **Sự chào đời là một nghi thức**: cùng một luồng hội thoại, đổi ảnh đại diện, tác nhân tự đặt tên
  và chọn khuôn mặt của mình. Quản trị viên giải thích hệ thống phân cấp một lần: "hãy hỏi tôi
  về hệ thống, hoặc chỉ cần hỏi tác nhân của bạn — tác nhân sẽ chuyển tiếp."
- **Độ tin cậy được phân cấp theo nguồn**: các mục trong danh mục chính thức có thể được chọn sẵn;
  Skills ClawHub của bên thứ ba không bao giờ được chọn sẵn bất kể xếp hạng của mô hình,
  và nhãn của chúng cho biết chúng cài đặt mã của nhà phát hành.
- **Các bản cài đặt đã cấu hình là bất khả xâm phạm**: chạy lại quy trình làm quen là một lượt
  xác minh. Quy trình không bao giờ áp dụng lại thiết lập và không bao giờ khởi động lại dịch vụ Gateway.
- **Thiết bị đầu cuối là phương án dự phòng, không phải một câu hỏi**: ưu tiên bảng điều khiển
  trình duyệt khi có thể kết nối tới Gateway; không bao giờ hỏi "thiết bị đầu cuối hay trình duyệt?".
- **Các mô hình yếu nhận được bề mặt tinh gọn** (tự động `localModelLean`), được giải thích bằng
  ngôn từ đơn giản — tuyệt đối không dùng các thuật ngữ về công cụ, chế độ mã hoặc cửa sổ ngữ cảnh.

## Luồng hiện được phát hành (sau các giai đoạn 1-3)

`openclaw onboard` trên một bản cài đặt macOS mới, theo luồng thuận lợi — tổng cộng bốn lần nhấn Enter:

1. Lưu ý bảo mật → nhấn Enter một lần để xác nhận (được lưu lại; không bao giờ hỏi lại).
2. **Câu hỏi số không**: "Tôi nên thiết lập mọi thứ như thế nào?" — Toàn quyền truy cập (khuyên dùng)
   hoặc Hỏi trước. Được lưu dưới dạng `wizard.accessMode`; các lần chạy lại mặc định dùng lựa chọn
   đã lưu. Chế độ được bảo vệ + "cấu hình thủ công" sẽ đi đến bộ chọn nhà cung cấp mà không
   thực hiện bất kỳ hoạt động quét nào, đồng thời cũng bỏ qua việc quét nguồn bộ nhớ.
3. **Màn trình diễn khám phá**: phát hiện CLI lập trình, khóa môi trường và runtime cục bộ;
   đưa ra lời nhận xét khi tìm thấy tác nhân lập trình; kiểm thử trực tiếp từng ứng viên theo thứ tự và
   âm thầm gom các lỗi vào một dòng tóm tắt duy nhất (chi tiết nằm sau "Xem các tùy chọn
   khác"). Tuyến hoạt động đầu tiên được thông báo là giá trị mặc định, kèm theo
   cách truy cập bộ chọn đầy đủ chỉ bằng một phím; việc khám phá và bỏ qua vẫn giữ nguyên
   tuyến đang hoạt động.
4. Đề xuất nhập bộ nhớ (Claude Code / Codex / Hermes), được bỏ qua khi người dùng
   từ chối khám phá.
5. Chỉ với bản cài đặt mới: kế hoạch thiết lập tiêu chuẩn được áp dụng tự động
   (không gian làm việc, dịch vụ Gateway, phiên — cùng kế hoạch mà câu trả lời "có"
   trong hội thoại sẽ chạy). Các bản cài đặt đã cấu hình hiển thị "đã được thiết lập" và không bao giờ động đến
   dịch vụ.
6. **Đề xuất ứng dụng**: các ứng dụng đã cài đặt được mô hình đã xác minh đối chiếu
   với danh mục chính thức + ClawHub; các Plugin kênh chính thức được chọn sẵn,
   Skills của bên thứ ba yêu cầu người dùng chủ động chọn và có nhãn cảnh báo. Có thể bỏ qua;
   công tắc vô hiệu hóa `wizard.appRecommendations`.
7. **Chào đời**: khi có thể kết nối tới Gateway, thao tác chuyển giao sang trình duyệt sẽ mở (GUI) hoặc
   in (chế độ không giao diện/SSH) URL bảng điều khiển và chờ Control UI
   kết nối — "Bảng điều khiển đã kết nối — tiếp tục trong trình duyệt của bạn." Nếu không, hoặc
   khi dùng `--tui`, TUI trên thiết bị đầu cuối sẽ mở với thông điệp chào đời khởi tạo
   được điền sẵn và tác nhân tự giới thiệu.

Quy trình làm quen với Gateway từ xa vẫn giữ thao tác chuyển giao hội thoại cũ
(`handoffMode: "chat"`); thiết lập phải được áp dụng trên Gateway từ xa.

## Các giai đoạn

| #   | Giai đoạn                                                                                                                                                     | Bề mặt              | Trạng thái                                                                                                                            |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Đề xuất Plugin cho ứng dụng đã cài đặt (quét, ứng viên, trình đối chiếu AI, bước trình hướng dẫn, lệnh Node `device.apps`)                                              | CLI cổ điển + có hướng dẫn | đã hợp nhất ([#109668](https://github.com/openclaw/openclaw/pull/109668))                                                              |
| 2   | Xương sống quản trị viên trên CLI (câu hỏi số không, màn trình diễn khám phá, tự động áp dụng + chào đời)                                                                                | CLI có hướng dẫn           | đã hợp nhất ([`a83ed13204f1`](https://github.com/openclaw/openclaw/commit/a83ed13204f118adf1009e5ac88d5afe1905b86c))                   |
| 3   | Chuyển giao ưu tiên trình duyệt (phát hiện phiên GUI, chờ kết nối bảng điều khiển, TUI làm phương án dự phòng)                                                                | CLI → web            | đã hợp nhất ([#110054](https://github.com/openclaw/openclaw/pull/110054))                                                              |
| 4   | Bề mặt quản trị viên trên web (thẻ tùy chọn, trường `question` có kiểu trên `openclaw.chat`, phản chiếu bước trình hướng dẫn, chuyển giao lần chạy đầu tiên)                                 | Control UI           | đã hợp nhất ([#110141](https://github.com/openclaw/openclaw/pull/110141), [#110242](https://github.com/openclaw/openclaw/pull/110242)) |
| 5   | Chào đời và khởi tạo (kho đề xuất với ngữ nghĩa chỉ-một-lần, trình tự khai sinh tự đặt tên, tự động chuyển giao chào đời sau thiết lập mới; hệ thống phân cấp ảnh đại diện được hoãn lại) | khởi tạo tác nhân      | đã hợp nhất ([#110173](https://github.com/openclaw/openclaw/pull/110173), [#110331](https://github.com/openclaw/openclaw/pull/110331)) |
| 6   | Hiện diện của quản trị viên PR1 (mục được ghim trên thanh bên, Hỏi OpenClaw trong Cài đặt, lời chào của người chăm sóc với giao diện thông thường; bình luận sự kiện và gọi từ kênh thuộc PR2)    | web + kênh       | đã hợp nhất ([#110269](https://github.com/openclaw/openclaw/pull/110269))                                                              |
| 7   | Khả năng phục hồi (có thể liên hệ quản trị viên khi cấu hình lỗi, cứu vãn một phần bề mặt, tự động chạy doctor)                                                                   | Gateway              | theo dõi sau                                                                                                                         |

## Ghi chú triển khai theo từng giai đoạn

### Giai đoạn 1 — đề xuất ứng dụng (PR #109668)

- Trình quét: `src/infra/installed-apps.ts` (liệt kê macOS không cần TCC; theo dõi
  các gói `.app` được liên kết tượng trưng).
- Ứng viên: danh mục chính thức + tìm kiếm ClawHub, tổng ngân sách 20 giây, suy giảm nhẹ nhàng
  khi ngoại tuyến xuống chỉ còn các ứng viên trong danh mục. Các mục danh mục là manifest gói
  không có `id` cấp cao nhất — ứng viên được lập khóa theo id Plugin đã phân giải
  (được kiểm thử hồi quy dựa trên các danh mục đi kèm thực tế; việc lập khóa theo
  `entry.id` từng làm toàn bộ danh mục bị thu gọn và loại bỏ mọi đề xuất
  chính thức).
- Trình đối chiếu AI: một lượt hoàn tất trên tuyến đã xác minh
  (`src/system-agent/setup-app-recommendations.ts`); không có ánh xạ bundle-id được tuyển chọn —
  mô hình từ chối các trường hợp trùng tên ngẫu nhiên. Đầu ra bị giới hạn bởi ngân sách
  `maxTokens` riêng của mô hình đã phân giải (lớp luồng áp dụng ngân sách này khi không
  truyền giới hạn rõ ràng).
- **Cơ chế bảo vệ chuỗi cung ứng**: văn bản niêm yết trên ClawHub do nhà phát hành kiểm soát và
  được đưa vào lời nhắc của trình đối chiếu, vì vậy một mục niêm yết có thể tự quảng bá thành
  "được đề xuất". Chỉ các mục danh mục chính thức mới có thể được chọn sẵn; Skills ClawHub
  luôn yêu cầu một lần đánh dấu rõ ràng và được gắn nhãn "Skill ClawHub của bên thứ ba;
  cài đặt mã của nhà phát hành".
- Lệnh Node `device.apps` (node-host TS, tương thích phong bì Android), mặc định
  tắt chia sẻ; công tắc vô hiệu hóa Gateway `wizard.appRecommendations`.
- Phần phân phối nằm trong trình hướng dẫn cổ điển và luồng quản trị viên có hướng dẫn
  (`src/wizard/setup.app-recommendations.ts`); việc chuyển mục tiêu sang phần cuối của quá trình khởi tạo
  vẫn thuộc giai đoạn 5 (dịch vụ đã nhận một nguồn kho ứng dụng có thể chèn).
  Ngữ nghĩa chỉ-một-lần (chỉ đề xuất cho đến khi được chấp nhận, lưu kết quả quét) cũng được triển khai
  cùng kho ở giai đoạn 5; hiện tại, chạy lại sẽ đề xuất lại.
- Cũng đã sửa: lời nhắc `completeSetupInference` tùy chỉnh không còn kế thừa
  giới hạn đầu ra 32 token của phép dò xác minh (`SETUP_INFERENCE_TEST_MAX_TOKENS`
  chỉ áp dụng cho phép dò "trả lời OK").

### Giai đoạn 2 — xương sống quản trị viên trên CLI (PR #109841)

- Làm lại luồng trong `src/commands/onboard-guided.ts`; quy trình làm quen với Gateway từ xa
  giữ thao tác chuyển giao trò chuyện cũ thông qua `handoffMode: "chat"`.
- Câu hỏi số không lưu `wizard.accessMode` ("full" | "guarded"); các lần chạy lại
  mặc định dùng lựa chọn đã lưu (chấp nhận giá trị mặc định không bao giờ được âm thầm
  hạ cấp từ guarded xuống full). Chế độ được bảo vệ + thủ công sử dụng
  `listManualSetupInferenceOptions` (chỉ cấu hình/manifest, không thăm dò) và
  bỏ qua việc quét nguồn bộ nhớ.
- Khám phá: âm thầm thu thập lỗi (một dòng tóm tắt duy nhất; chi tiết nằm sau
  "Xem các tùy chọn khác"), lời nhận xét về tác nhân lập trình, giá trị mặc định của tuyến được thông báo. Số lượng
  phiên trong lời nhận xét được hoãn lại (hiện chỉ mang tính định tính) cho đến khi có một
  điểm nối đếm phiên ít tốn tài nguyên.
- Bản cài đặt mới: `applySystemAgentSetup` (câu trả lời "có" mang tính xác định trong hội thoại),
  sau đó chào đời thông qua `launchTuiCli` với thông điệp khởi tạo được điền sẵn.
  Bản cài đặt đã cấu hình (cấu hình mô hình hoặc Gateway có từ trước — dấu thời gian của
  trình hướng dẫn không chứng minh được gì vì chúng được dùng chung với configure/doctor):
  chỉ xác minh — không áp dụng, không khởi động lại dịch vụ Gateway. Nếu áp dụng thất bại,
  hệ thống quay lại trò chuyện hội thoại.

### Giai đoạn 3 — chuyển giao ưu tiên trình duyệt (PR #110054, đã hợp nhất)

- `src/commands/onboard-browser-handoff.ts` chịu trách nhiệm hoàn toàn cho việc phát hiện phiên đồ họa
  (`SSH_CONNECTION`/`SSH_TTY`; `DISPLAY`/`WAYLAND_DISPLAY` trên Linux)
  và thời gian chờ GUI 60 giây / SSH 300 giây. Quy trình hướng dẫn thiết lập ban đầu hiện
  chỉ bật chuyển giao trên macOS; `--tui` và các nền tảng khác vẫn giữ
  lối thoát qua terminal. Việc bật trên Linux/Windows sẽ được thực hiện sau.
- Các liên kết Dashboard sử dụng cùng các trình trợ giúp `resolveAdvertisedControlUiLinks`,
  `resolveLocalControlUiProbeLinks` và `buildOnboardingControlUiUrl`
  như bước hoàn tất kiểu cổ điển. Việc khởi chạy trình duyệt sử dụng trình trợ giúp `openUrl` dùng chung.
- Việc kiểm tra trạng thái sẵn sàng thăm dò RPC `system-presence` hiện có dưới dạng **một ứng dụng khách loopback
  ở chế độ CLI cung cấp bí mật dùng chung đã cấu hình** — đường dẫn đáng tin cậy mà mọi
  lệnh `openclaw` đều sử dụng. Một ứng dụng khách Control UI xác thực trực tiếp bằng bí mật dùng chung sẽ bị từ chối
  với thông báo "yêu cầu danh tính thiết bị" trên các Gateway SecretRef. Bước kiểm tra sơ bộ khả năng kết nối
  phân giải cùng đích (và bí mật) như vòng lặp chờ, nên
  cổng kiểm tra và quá trình chờ không bao giờ có thể bất đồng về xác thực. Việc chuyển giao chỉ hoàn tất
  khi một hàng trạng thái hiện diện `openclaw-control-ui`/`webchat` đã kết nối là mới
  so với đường cơ sở trước khi khởi chạy (một dashboard đã mở sẵn không thể
  hoàn tất việc này).
- `gateway.controlUi.enabled: false` dừng ngay trước khi bất kỳ URL nào được hiển thị.
- Đã được chứng minh đầu cuối với một Gateway dùng cùng cấu hình nhưng được cô lập: in URL → trình duyệt thực
  kết nối → "Dashboard đã kết nối — tiếp tục trong trình duyệt của bạn" → không có
  lối thoát qua terminal. Một lần bị giữ lại trước đó do "token không khớp" là lỗi phát sinh từ
  bộ khung kiểm thử — xem cẩm nang kiểm thử bên dưới.

### Giai đoạn 4 — bề mặt quản gia trên web (đã hợp nhất: #110141, #110242)

- Trang `/custodian` trên `openclaw.chat` với thành phần thẻ tùy chọn
  (2-4 thẻ, tối đa một thẻ được đề xuất, luôn có thể bỏ qua); giao diện thiết lập ban đầu qua
  `?onboarding=1`; việc hoàn tất lần chạy đầu tiên của thiết lập mô hình sẽ chuyển giao vào đó.
- Các câu hỏi có cấu trúc là một trường `question` bổ sung có kiểu trên
  `SystemAgentChatResult` (văn bản `reply` cho từng tùy chọn; phần văn xuôi luôn tồn tại độc lập
  cho ứng dụng macOS/TUI). Nguồn tạo: cả hai biến thể chào mừng khi thiết lập ban đầu và
  các bước chọn/xác nhận của trình hướng dẫn được lưu trữ với 2-4 tùy chọn đóng — các trình hướng dẫn
  kênh thực tế hiển thị dưới dạng thẻ. Giải pháp tạm thời bằng dấu chuỗi của PR1 đã bị xóa.
- Quyền sở hữu phiên được giới hạn theo URL Gateway + mọi thông tin xác thực được cung cấp
  (token, mật khẩu, token bootstrap, token thiết bị đã lưu — vẫn duy trì qua
  các lần mất hello tạm thời); các lượt người dùng thất bại không bao giờ có thể phát lại; dữ liệu đầu vào
  nhạy cảm được gửi nguyên văn và che trong bản chép lời.

### Giai đoạn 5 — lối thoát và bootstrap (đã hợp nhất: #110173, #110331)

- Quản gia tạo một tác nhân không tên (lệnh gọi công cụ); bootstrap của tác nhân mở đầu
  bằng việc tự đặt tên. PR1 cung cấp nghi thức giới hạn ở ba nhịp (tên → một dòng
  tâm hồn → câu hỏi về Skills) và hoãn chuỗi bậc thang ảnh đại diện tự vẽ/tạo ảnh
  (các ứng viên do mô hình tạo → dấu hiệu đặt sẵn → giữ logo) sang lần triển khai sau. Cùng
  một luồng, đổi ảnh đại diện; dấu móng vuốt vẫn dành riêng cho quản gia. Danh tính
  đã thống nhất được lưu hai lần: vào `IDENTITY.md`/`SOUL.md` (nội dung tác nhân
  đọc) và qua `openclaw agents set-identity` (nội dung các kênh và UI
  hiển thị).
- Các đề xuất (dịch vụ giai đoạn 1, bản quét đã lưu với ngữ nghĩa chỉ một lần) xuất hiện ở
  bước bootstrap cuối cùng trước khi tệp bootstrap bị xóa: "bộ tối thiểu
  hay tiện lợi tối đa?" Bootstrap đọc đề nghị đã lưu qua
  `openclaw onboard recommendations --json` (chỉ các ID cài đặt không trong suốt) và
  xác nhận sau khi lựa chọn được xử lý để không bao giờ hỏi lại. Các nút
  kết nối kênh mang cẩm nang thiết lập riêng cho từng kênh; tác nhân thu thập
  thông tin xác thực qua hội thoại và chuyển tiếp các thao tác ghi cấu hình cho quản gia
  ("đang hỏi OpenClaw…" là cách diễn đạt chuẩn).
- Khả năng tự học được hỏi ý kiến, không phải thông báo, đồng thời đóng vai trò là sự đồng thuận
  cho xưởng Skills; mô tả các bước kiểm tra độ tin cậy bản phát hành, quét, xác minh và tính toàn vẹn
  của ClawHub cùng cảnh báo về mã của nhà phát hành — không bao giờ ngụ ý rằng mọi bản phát hành đều được ký.
- Tự động mở lối đã được phát hành: thao tác áp dụng thiết lập cho bản cài đặt mới sẽ thông báo về lối thoát và
  chuyển giao (TUI terminal / `open-agent` cho các ứng dụng khách Gateway); trang web
  chuyển đến cuộc trò chuyện với tác nhân, trong đó bản nháp "Thức dậy nào, bạn tôi!" đã được điền sẵn. Việc
  chuyển giao chỉ kích hoạt sau khi xác minh sạch sau thao tác ghi. Trạng thái không còn tác nhân nào sau khi
  xóa sẽ đưa ra lựa chọn (thay vì tự động) vẫn là phần hoàn thiện tiếp theo.

### Giai đoạn 6 — sự hiện diện của quản gia (PR1 đã hợp nhất: #110269; bình luận/triệu gọi thuộc PR2)

- Đã phát hành trong PR1: mục "OpenClaw" được ghim mặc định trên thanh bên (hồ sơ mới;
  người dùng hiện tại giữ các mục ghim đã lưu và truy cập qua tùy chỉnh/More), "Hỏi
  OpenClaw" là mục đầu tiên trong Settings, và các lượt truy cập `/custodian` với giao diện thông thường
  sẽ yêu cầu lời chào của người chăm sóc (không dùng biến thể chào mừng khi thiết lập ban đầu), với
  Exit setup chỉ được hiển thị trong chế độ thiết lập ban đầu. Một ngăn Settings nội tuyến
  được neo cần trích xuất chế độ xem hội thoại dùng chung (sẽ thực hiện sau).
- Bình luận phản ứng theo sự kiện với các rào chắn chống Clippy: chỉ dành cho thay đổi có hậu quả
  hoặc thất bại, tối đa một lần cho mỗi lượt truy cập phần cài đặt trừ khi được yêu cầu. Cùng một
  điểm nối sự kiện sau này sẽ biến quản gia thành tiếng nói cho tình trạng xác thực suy giảm hoặc
  các kênh bị hỏng.
- Các kênh: vô hình trong sử dụng hằng ngày (tác nhân chuyển tiếp); có thể tiếp cận bằng lệnh
  triệu gọi rõ ràng và khi xảy ra sự kiện tác nhân ngừng hoạt động trong cùng luồng, với tên và
  ảnh đại diện móng vuốt riêng khi nền tảng cho phép.
- Phát hiện mô hình yếu khi thiết lập: tự động đặt `localModelLean`, và quản gia
  thông báo rõ ràng bằng lời dễ hiểu kèm đề nghị nâng cấp.
- Quản gia biết biệt danh nội bộ của mình ("một số người gọi tôi là
  quản gia — gọi OpenClaw cũng được") và luôn gọi tác nhân bằng tên.

### Giai đoạn 7 — khả năng phục hồi (cần quyết định của chủ sở hữu trước khi xây dựng)

Bản phác thảo ban đầu — "quản gia phải luôn có thể truy cập được bất kể
cấu hình hỏng đến mức nào" — xung đột với chính sách bảo mật của kho mã: hướng dẫn gốc
nêu rằng Gateway **từ chối khởi động** khi cấu hình không hợp lệ về cấu trúc,
và chỉ các lỗi của chủ sở hữu SecretRef mới suy giảm thành các khả năng
được cấu hình nhưng không khả dụng. Phục vụ bất kỳ bề mặt nào từ một cấu hình không hợp lệ là thay đổi chính sách,
không phải chi tiết triển khai. Có hai phạm vi, hãy chọn một:

- **Tùy chọn A (được đề xuất, tuân thủ chính sách): tự động chạy doctor phía CLI.** Khi
  Gateway hoặc CLI không thể khởi động do cấu hình không hợp lệ có hình dạng đã biết, CLI sẽ đề nghị
  (hoặc chạy khi có sự đồng thuận) `openclaw doctor --fix`, sau đó thử lại một lần và
  báo cáo rõ ràng. Không thay đổi hành vi Gateway; quản gia vẫn có thể truy cập được
  qua đường dẫn SecretRef suy giảm hiện có và terminal.
- **Tùy chọn B (cần chủ sở hữu phê duyệt rõ ràng + review bảo mật): chế độ
  bề mặt tối thiểu của Gateway.** Khi cấu hình không hợp lệ về cấu trúc, khởi động một
  bề mặt bị khóa chỉ phục vụ cuộc hội thoại với quản gia và các thao tác doctor. Điều này
  viết lại hợp đồng khởi động đóng khi lỗi và phải xác định cơ chế bảo vệ đầu vào
  riêng trước khi có bất kỳ mã nào.

Các phần tiếp theo còn lại từ giai đoạn 4-6 (đã theo dõi, chưa lên lịch): chuỗi bậc thang ảnh đại diện/tạo ảnh
cho lối thoát; ứng dụng macOS hiển thị trường `question` có kiểu; một
ngăn Settings nội tuyến được neo cho quản gia (cần trích xuất chế độ xem hội thoại
dùng chung); bình luận phản ứng theo sự kiện và phục hồi bằng triệu gọi kênh/khi tác nhân ngừng hoạt động
(PR2 của giai đoạn 6); tự động `localModelLean` cho các mô hình yếu; liệu các
mục ghim thanh bên đã lưu của người dùng hiện tại có nên áp dụng mục OpenClaw hay không.

## Cẩm nang kiểm thử và hợp nhất (kinh nghiệm khó khăn; đọc trước giai đoạn 4-6)

- **`OPENCLAW_STATE_DIR` không cô lập dịch vụ Gateway.** Nhãn
  LaunchAgent (`ai.openclaw.gateway`) có phạm vi toàn máy: một kiểm thử thiết lập ban đầu cho bản cài đặt mới
  với thư mục trạng thái được cô lập sẽ GHI LẠI và KHỞI ĐỘNG LẠI dịch vụ thực
  của máy (các script trình bao nằm trong thư mục cô lập; lần khởi động dịch vụ
  tiếp theo sẽ hỏng khi thư mục đó bị dọn dẹp). Sau bất kỳ kiểm thử bản cài đặt mới nào,
  khôi phục bằng `openclaw gateway install --force && openclaw gateway
restart` từ môi trường thực và xác minh plist. Phần tiếp theo của sản phẩm:
  nhãn dịch vụ theo phạm vi thư mục trạng thái, hoặc quy trình thiết lập ban đầu phát hiện dịch vụ bên ngoài.
- **Bộ khung đầu cuối an toàn**: điền sẵn cấu hình cô lập bằng một phần `gateway`
  (để quy trình thiết lập ban đầu đi theo đường dẫn bản cài đặt đã cấu hình và không bao giờ tác động đến
  dịch vụ) và chạy `openclaw gateway run` dưới dạng tiến trình nền trước thuần túy trên
  một cổng dự phòng với token thuần túy. Bộ khung đó đã chứng minh vòng lặp giai đoạn 3,
  bao gồm cả kết nối bằng trình duyệt thực.
- **Các đường dẫn xác thực khác nhau theo danh tính ứng dụng khách, không chỉ theo thông tin xác thực.** Trạng thái hiện diện và
  các thao tác đọc khác của người vận hành sử dụng ứng dụng khách loopback ở chế độ CLI với thông tin xác thực từ
  cùng cấu hình. Các Gateway xác thực bằng token yêu cầu bí mật dùng chung; các Gateway
  SecretRef/none có thể dự phòng sang xác thực loopback đáng tin cậy mà không cần token. Một ứng dụng khách
  trình duyệt được nhận diện là Control UI cần danh tính thiết bị hoặc quyền cấp loopback
  trong ngữ cảnh bảo mật. Một đầu dò xác thực với Gateway phục vụ một cấu hình
  KHÁC (xem cạm bẫy LaunchAgent) sẽ thất bại với "token không khớp" — lỗi phát sinh đó
  đã tạm thời giữ lại giai đoạn 3.
- **Đầu dò hoàn tất**: `runSetupInferenceTest` giới hạn đầu dò xác minh ở
  32 token đầu ra; prompt tùy chỉnh bỏ qua giới hạn này và bị giới hạn bởi
  `maxTokens` riêng của mô hình. Các mô hình suy luận tiêu thụ ngân sách đó trước hết bằng
  suy luận ẩn — một lượt không có văn bản thường có nghĩa là ngân sách đã cạn tại đó.
- **Việc hợp nhất tác nhân cần Pipeline CI được lưu trữ tại chính xác HEAD.** Quy trình `CI` nặng có thể
  không được xếp hàng khi đẩy mã trong lúc tổ chức chịu tải cao; phương án dự phòng cho người bảo trì là một
  lần kích hoạt cổng phát hành trên nhánh PR:

  ```bash
  gh workflow run ci.yml --ref <branch> -f target_ref=<head-sha> -f release_gate=true -f pull_request_number=<pr>
  ```

  Lần chạy phải diễn ra trên
  tham chiếu nhánh để `head_sha` khớp, và tiêu đề trở thành
  `CI release gate <sha>`, được `scripts/verify-pr-hosted-gates.mjs`
  chấp nhận. Sau đó `scripts/pr` chuẩn bị/hợp nhất như thường lệ.

- **Các cổng mà CI thực thi ngoài các kiểm thử tập trung**: bản đồ tài liệu
  (`pnpm docs:map:gen` sau khi thêm bất kỳ trang tài liệu nào), oxlint (`no-map-spread`,
  `max-lines` — chia nhỏ tệp, không bao giờ bỏ qua), `check:test-types`, mã chết knip
  (chỉ xuất những gì mã sản phẩm sử dụng; định tuyến kiểm thử qua API công khai),
  và bộ phân loại phân đoạn kiểm thử trực tiếp
  (`test/scripts/test-live-shard.test.ts` phải liệt kê mọi `*.live.test.ts` mới).

## Nhật ký quyết định

- Quét tự động với công tắc ngắt, không yêu cầu đồng thuận trước (giai đoạn 1; thông tin công khai nằm
  trong dòng tiến trình quét và ghi chú kết quả).
- Toàn bộ chiều dọc bao gồm lệnh `device.apps` của Node (giai đoạn 1).
- Skills ClawHub của bên thứ ba không bao giờ được chọn sẵn và được gắn nhãn là
  cài đặt mã của nhà phát hành; các mục chính thức có thể được đánh dấu sẵn
  (giai đoạn 1, trạng thái bảo mật đã phát hành).
- Hai thẻ truy cập, không phải ba; sự đồng thuận được đưa lên đầu trong lựa chọn (giai đoạn 2).
- Tự động mở lối kèm thông báo, không phải nút chặn (giai đoạn 2/5).
- Ưu tiên trình duyệt: lối thoát qua terminal là phương án dự phòng, không bao giờ đặt câu hỏi "terminal hay
  trình duyệt?" (giai đoạn 3).
- Quản gia có sự hiện diện trên kênh (triệu gọi + phục hồi), không chỉ trên web/CLI
  (giai đoạn 6).
- Việc mở lối diễn ra trong cùng luồng với thao tác đổi ảnh đại diện; sau khi hoàn tất,
  ứng dụng chuyển sang UI thông thường (giai đoạn 5).
- Bề mặt cài đặt giữ tên "Settings"; quản gia tồn tại ở đó
  (và trên thanh bên) thay vì thay thế nó (giai đoạn 6).
- Các thẻ tùy chọn bị ràng buộc: 2-4 tùy chọn, chính xác một tùy chọn được đề xuất, luôn
  có thể bỏ qua; cùng một thành phần phục vụ quy trình thiết lập ban đầu và công cụ đặt câu hỏi của tác nhân
  (giai đoạn 4).
- "Đang hỏi OpenClaw…" là cách diễn đạt ủy quyền chuẩn; các tâm hồn có thể thêm sắc thái,
  phần tường thuật công cụ vẫn giản dị (giai đoạn 5).
- Nội dung hướng tới người dùng không bao giờ nói "chế độ mã", "công cụ" hoặc "cửa sổ ngữ cảnh" khi
  giải thích việc cắt giảm do mô hình yếu (giai đoạn 6).

## Các khoảng trống đã biết và phần tiếp theo

- Nhãn LaunchAgent không được phân phạm vi theo thư mục trạng thái (cạm bẫy kiểm thử ở trên; đồng thời là một
  thiếu sót thực sự của sản phẩm khi chạy nhiều phiên bản).
- Các đề xuất cần ngữ nghĩa chỉ một lần và bản quét được lưu trữ (giai đoạn 5); các lần chạy lại
  hiện vẫn đề xuất lại.
- Việc chuyển tiếp sang trình duyệt chỉ hỗ trợ macOS; khả năng hỗ trợ Linux/Windows đang chờ triển khai.
- Nhận xét dí dỏm về số lượng phiên mang tính định tính; việc đếm cần một giao diện đếm phiên nhẹ.
- Việc chuyển tiếp sang trình duyệt mở bảng điều khiển thông thường; liên kết sâu đến trình quản lý
  chế độ hướng dẫn thiết lập sẽ có trong giai đoạn 4.
