---
read_when:
    - Kiểm tra vì sao đợt tái cấu trúc luồng vào kênh đã thêm quá nhiều mã
    - Di chuyển chính sách tuyến, lệnh, sự kiện, kích hoạt hoặc nhóm truy cập từ các Plugin đóng gói kèm vào lõi
    - Đang xem xét liệu một hàm trợ giúp đầu vào của kênh có thực sự xóa mã Plugin được đóng gói kèm hay không
sidebarTitle: Ingress core deletion
summary: Kế hoạch ưu tiên xóa bỏ để chuyển phần mã kết nối ingress kênh lặp lại vào lõi.
title: Kế hoạch xóa lõi tiếp nhận
x-i18n:
    generated_at: "2026-05-10T19:50:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 71afcf5d4f58c57ecfe7b388325279700a723ec1fcd926f644095106b662c3d0
    source_path: refactor/ingress-core.md
    workflow: 16
---

# Kế hoạch xóa bỏ lõi ingress

Việc tái cấu trúc ingress không lành mạnh khi nó thêm hàng nghìn dòng ròng. Việc
tập trung hóa vào lõi chỉ được tính khi mã production của Plugin đi kèm nhỏ hơn và
khả năng tương thích SDK bên thứ ba cũ được cô lập vào các shim SDK/lõi.

Hình dạng runtime mong muốn:

```text
bundled plugin event
  -> extract platform facts locally
  -> resolve shared ingress once when facts are available
  -> branch on generic ingress projections/outcomes
  -> perform platform side effects locally

old third-party helper
  -> SDK compatibility shim
  -> shared ingress-compatible projection where possible
  -> old return shape preserved
```

Các Plugin đi kèm không nên dịch ingress ngược lại thành các hình dạng cục bộ
`AccessResult`, `GroupAccessDecision`, `CommandAuthDecision`, `DmCommandAccess`,
hoặc `{ allowed, reasonCode }` trừ khi kiểu đó là API Plugin công khai.

## Ngân sách

Đo so với merge-base của PR với `origin/main`, bao gồm cả các tệp chưa được
theo dõi.

```text
merge-base            1671e7532adb

current:
core production       +3,922 / -546    = +3,376
docs                  +601 / -17       = +584
other                 +145 / -2        = +143
plugin production     +4,148 / -5,388  = -1,240
tests                 +2,326 / -2,414  = -88
total                 +11,142 / -8,367 = +2,775

required:
plugin production     <= -1,500
core production       <= +1,500, or paid for by larger plugin deletion
tests                 <= +1,000
total                 <= +2,000

stretch:
plugin production     <= -2,500
core production       <= +1,200
total                 <= 0
```

Phần dọn dẹp tối thiểu còn lại:

```text
plugin production     needs 260 more net deleted lines
total                 needs 775 more net deleted lines
core production       still +1,876 over standalone budget, unless paid down by plugin deletion
```

Việc chỉ xóa bình luận không được tính là dọn dẹp. Lần rà ngân sách trước quá
rộng rãi vì đã tính cả các bình luận giải thích QQBot được khôi phục; tài liệu
này chỉ theo dõi sự dịch chuyển của mã thực thi/tài liệu/kiểm thử.

Đo lại sau mỗi đợt dọn dẹp:

```sh
base=$(git merge-base HEAD origin/main)
git diff --shortstat "$base"
git diff --numstat "$base" -- src/channels/message-access src/plugin-sdk extensions | sort -nr -k1 | head -n 80
pnpm lint:extensions:no-deprecated-channel-access
```

## Chẩn đoán

Lần đầu tiên đã thêm kernel ingress dùng chung, rồi để lại quá nhiều phần ủy
quyền cục bộ của Plugin bên cạnh nó:

```text
platform facts
  -> shared ingress state and decision
  -> plugin-local DTO or legacy projection
  -> plugin-local if/else ladder
```

Điều đó nhân đôi mô hình. Mã production lõi tăng khoảng 3.376 dòng, trong khi
mã production của Plugin đi kèm nhỏ hơn 1.240 dòng. Điều này tốt hơn lần đầu,
nhưng vẫn chưa nằm trong ngân sách tối thiểu. Cách sửa vẫn là ưu tiên xóa:

- xóa các DTO Plugin chỉ đổi tên trường ingress
- xóa các kiểm thử chỉ khẳng định hình dạng wrapper
- chỉ thêm helper lõi khi cùng bản vá đó xóa mã Plugin đi kèm
- chỉ giữ khả năng tương thích SDK cũ trong các shim SDK/lõi
- đóng gói lại lõi sau khi việc xóa wrapper làm lộ hình dạng ổn định

## Điểm nóng

Các tệp production Plugin đi kèm có mức tăng dương và vẫn cần thu nhỏ:

```text
extensions/telegram/src/ingress.ts                        +126
extensions/discord/src/monitor/dm-command-auth.ts         +101
extensions/signal/src/monitor/access-policy.ts             +92
extensions/feishu/src/policy.ts                            +85
extensions/slack/src/monitor/auth.ts                       +64
extensions/googlechat/src/monitor-access.ts                +59
extensions/nextcloud-talk/src/inbound.ts                   +51
extensions/matrix/src/matrix/monitor/access-state.ts       +49
extensions/irc/src/inbound.ts                              +44
extensions/imessage/src/monitor/inbound-processing.ts      +36
extensions/qa-channel/src/inbound.ts                       +34
extensions/qqbot/src/bridge/sdk-adapter.ts                 +33
extensions/tlon/src/monitor/utils.ts                       +30
extensions/twitch/src/access-control.ts                    +22
extensions/qqbot/src/engine/commands/slash-command-handler.ts +20
extensions/telegram/src/bot-handlers.runtime.ts            +19
```

Nhánh này vẫn chưa nằm trong ngân sách tối thiểu. Phần việc còn lại có liên quan
đến review nên xóa luồng ủy quyền lặp lại, giàn dựng lượt, hoặc kiểm thử wrapper
trước khi thêm một abstraction lõi khác.

## Đọc mã hiện tại

Đường nối lõi lành mạnh đã tồn tại trong `src/channels/message-access/runtime.ts`:
nó sở hữu các bộ điều hợp định danh, allowlist hiệu lực, lần đọc pairing-store,
mô tả tuyến, preset lệnh/sự kiện, nhóm truy cập, và projection cuối cùng đã phân
giải `ResolvedChannelMessageIngress`.

Phần tăng còn lại chủ yếu là lớp keo Plugin đặt trên đường nối đó:

- `extensions/telegram/src/ingress.ts` bọc các quyết định lõi trong helper
  lệnh/sự kiện riêng cho Telegram, rồi các điểm gọi vẫn truyền allowlist đã
  chuẩn hóa và danh sách chủ sở hữu đã tính sẵn.
- `extensions/discord/src/monitor/dm-command-auth.ts`,
  `extensions/feishu/src/policy.ts`, `extensions/googlechat/src/monitor-access.ts`,
  và `extensions/matrix/src/matrix/monitor/access-state.ts` vẫn giữ các DTO
  policy cục bộ hoặc tên quyết định cũ bên cạnh ingress.
- `extensions/signal/src/monitor/access-policy.ts` giữ đúng phần chuẩn hóa định
  danh Signal và phản hồi ghép đôi ở cục bộ, nhưng vẫn có một đường nối wrapper
  nên được thu gọn thành tiêu thụ ingress trực tiếp.
- `extensions/nextcloud-talk/src/inbound.ts`, `extensions/irc/src/inbound.ts`,
  `extensions/qa-channel/src/inbound.ts`, `extensions/zalo/src/monitor.ts`, và
  `extensions/zalouser/src/monitor.ts` vẫn lặp lại việc lắp ráp tuyến/envelope/lượt
  có thể chuyển sang các helper lượt dùng chung bên ngoài kernel ingress.

Kết luận: chuyển thêm mã vào lõi chỉ hữu ích nếu nó xóa các lớp wrapper Plugin
này trong cùng bản vá. Thêm một abstraction khác trong khi vẫn giữ nguyên các
giá trị trả về wrapper là lặp lại sai lầm.

## Ranh giới

Lõi sở hữu policy chung:

- chuẩn hóa và so khớp allowlist
- mở rộng nhóm truy cập và chẩn đoán
- đọc allowlist DM từ pairing-store
- các gate tuyến, người gửi, lệnh, sự kiện và kích hoạt
- ánh xạ tiếp nhận: dispatch, drop, skip, observe, pairing
- trạng thái, quyết định, chẩn đoán đã che giấu và các projection tương thích SDK
- các mô tả chung tái sử dụng được cho định danh, tuyến, lệnh, sự kiện, kích hoạt,
  và kết quả

Plugin sở hữu dữ kiện vận chuyển và tác dụng phụ:

- tính xác thực của webhook/socket/request
- trích xuất định danh nền tảng và tra cứu API
- mặc định policy riêng theo kênh
- gửi thử thách ghép đôi, phản hồi, ack, reaction, typing, media, lịch sử,
  thiết lập, doctor, trạng thái, log, và nội dung hiển thị cho người dùng

Lõi phải giữ tính độc lập với kênh: không có Discord, Slack, Telegram, Matrix,
room, guild, space, API client, hoặc mặc định riêng cho Plugin trong
`src/channels/message-access`.

## Quy tắc chấp nhận

Mọi helper lõi mới phải xóa mã production của Plugin đi kèm ngay lập tức.

```text
one bundled caller        reject; keep plugin-local
two bundled callers       accept only if plugin production LOC drops
three or more callers     plugin deletion must be at least 2x new core LOC
compatibility-only helper SDK/core shim only; never bundled hot paths
```

Dừng và thiết kế lại nếu:

- LOC production của Plugin tăng
- kiểm thử tăng nhanh hơn mức production thu nhỏ
- một hot path đi kèm trả về DTO chỉ đổi tên `ResolvedChannelMessageIngress`
- một helper lõi cần id kênh, đối tượng nền tảng, API client, hoặc mặc định riêng
  theo kênh

## Gói công việc

1. Đóng băng ngân sách.
   Đưa LOC vào PR, giữ lint deprecated-ingress xanh, và bao gồm LOC trước/sau
   trong các commit dọn dẹp.

2. Xóa các đường nối DTO mỏng.
   Thay các giá trị trả về wrapper cục bộ của Plugin bằng
   `ResolvedChannelMessageIngress`, `senderAccess`, `commandAccess`,
   `routeAccess`, hoặc `ingress` trực tiếp. Bắt đầu với QQBot, Telegram, Slack,
   Discord, Signal, Feishu, Matrix, iMessage, và Tlon. Xóa kiểm thử hình dạng
   wrapper; giữ kiểm thử hành vi.

3. Chỉ thêm phân loại kết quả khi có phần xóa đi kèm.
   Một bộ phân loại chung có thể phơi bày `dispatch`, `pairing-required`,
   `skip-activation`, `drop-command`, `drop-route`, `drop-sender`, và
   `drop-ingress`. Nó phải suy ra từ đồ thị quyết định, không phải chuỗi lý do,
   và di chuyển ít nhất ba Plugin trong cùng bản vá.

4. Chỉ thêm builder mô tả tuyến khi có phần xóa đi kèm.
   Helper mục tiêu tuyến và người gửi tuyến chung chỉ được chấp nhận nếu chúng
   ngay lập tức thu nhỏ các Plugin nặng về tuyến: Google Chat, IRC, Microsoft Teams,
   Nextcloud Talk, Mattermost, Slack, Zalo, và Zalo Personal.

5. Chỉ thêm preset lệnh/sự kiện khi có phần xóa đi kèm.
   Tập trung hóa các hình dạng lệnh văn bản, lệnh native, callback, và
   origin-subject. Người tiêu thụ lệnh phải mặc định là không được ủy quyền khi
   không có gate lệnh nào chạy; sự kiện không được bắt đầu ghép đôi.

6. Chỉ thêm preset định danh ở nơi chúng loại bỏ boilerplate.
   Các helper stable-id, stable-id-plus-aliases, phone/e164, và multi-identifier
   được phép khi giá trị thô chỉ đi vào đầu vào bộ điều hợp và trạng thái đã che
   giấu giữ id/số lượng mờ.

7. Chia sẻ lắp ráp lượt đã được ủy quyền.
   Bên ngoài kernel ingress, loại bỏ giàn dựng tuyến/session/envelope/context/reply
   lặp lại khỏi QA Channel, IRC, Nextcloud Talk, Zalo, và Zalo Personal. Lõi có
   thể sở hữu trình tự tuyến/session/envelope/dispatch; Plugin giữ việc gửi và
   ngữ cảnh riêng theo kênh.

8. Cô lập khả năng tương thích.
   Các helper SDK bị loại bỏ dần vẫn tương thích nguồn, nhưng hot path đi kèm
   không được import các facade ingress hoặc command-auth bị loại bỏ dần. Kiểm
   thử tương thích nên dùng Plugin bên thứ ba giả, không dùng nội bộ Plugin đi kèm.

9. Đóng gói lại lõi.
   Sau khi việc xóa wrapper làm các Plugin tiêu thụ projection runtime trực tiếp,
   thu gọn các module chỉ dùng một lần, loại bỏ export không dùng, chuyển projection
   tương thích ra khỏi hot path, và giữ kiểm thử tập trung cho định danh, tuyến,
   lệnh/sự kiện, kích hoạt, nhóm truy cập, và shim tương thích.

## Các đợt xóa

Chạy các đợt này theo thứ tự. Mỗi đợt phải giảm LOC production của Plugin đi kèm.

1. Thu gọn wrapper, delta Plugin dự kiến: -400 đến -600.
   Thay các kiểu kết quả cục bộ của Plugin `resolveXAccess`,
   `resolveXCommandAccess`, và `accessFromIngress` bằng đọc trực tiếp từ
   `ResolvedChannelMessageIngress`. Mục tiêu đầu tiên: Discord DM command auth,
   Feishu policy, Matrix access state, Telegram ingress, Signal access policy,
   QQBot SDK adapter.

2. Helper kết quả dùng chung, delta Plugin dự kiến: -200 đến -350.
   Chỉ thêm một bộ phân loại chung nếu nó xóa các ladder lặp lại về
   `shouldBlockControlCommand`, pairing, bỏ qua kích hoạt, chặn tuyến, và chặn
   người gửi trên ít nhất ba Plugin.

3. Builder mô tả tuyến, delta Plugin dự kiến: -200 đến -350.
   Chuyển việc lắp ráp lặp lại của mô tả mục tiêu tuyến và người gửi tuyến vào
   helper lõi. Mục tiêu đầu tiên: Google Chat, IRC, Microsoft Teams, Nextcloud Talk,
   Mattermost, Slack, Zalo, Zalo Personal.

4. Chia sẻ lắp ráp lượt, delta Plugin dự kiến: -250 đến -450.
   Dùng trình tự tuyến/session/envelope/dispatch chung cho các Plugin inbound
   đơn giản. Mục tiêu đầu tiên: QA Channel, IRC, Nextcloud Talk, Zalo, Zalo Personal.

5. Đóng gói lại lõi, delta lõi dự kiến: -300 đến -700.
   Sau khi Plugin tiêu thụ projection runtime trực tiếp, xóa các module chỉ dùng
   một lần, gộp các tệp nhỏ trở lại `runtime.ts` hoặc các tệp anh em tập trung,
   và giữ các tệp tương thích SDK tách khỏi hot path đi kèm.

6. Cắt tỉa kiểm thử, delta kiểm thử dự kiến: -300 đến -600.
   Xóa các kiểm thử chỉ khẳng định hình dạng wrapper đã bị loại bỏ. Giữ kiểm thử
   hành vi cho từ chối lệnh, fallback nhóm, so khớp origin-subject, bỏ qua kích
   hoạt, nhóm truy cập, ghép đôi, và che giấu.

Hình dạng tối thiểu dự kiến khi landing sau các đợt này:

```text
plugin production     <= -1,500
core production       about +1,800 to +2,200 before final repack
tests                 <= +500
total                 <= +2,000
```

## Không di chuyển

Không di chuyển giá trị mặc định của cấu hình nền tảng, UX thiết lập, nội dung doctor/fix, tra cứu API,
kiểm tra sự hiện diện của chủ sở hữu Slack, xử lý bí danh/xác minh Matrix, phân tích callback Telegram, phân tích cú pháp lệnh, đăng ký lệnh gốc, phân tích payload phản ứng, phản hồi ghép nối, phản hồi lệnh, xác nhận, đang nhập, phương tiện, lịch sử,
hoặc nhật ký.

## Xác minh

Vòng lặp cục bộ có mục tiêu:

```sh
pnpm lint:extensions:no-deprecated-channel-access
pnpm test src/channels/message-access/message-access.test.ts src/plugin-sdk/channel-ingress-runtime.test.ts src/plugin-sdk/access-groups.test.ts
pnpm test extensions/<changed-plugin>/src/...
pnpm plugin-sdk:api:check
pnpm config:docs:check
pnpm check:docs
git diff --check
```

Dùng Testbox cho các cổng kiểm tra thay đổi rộng/bằng chứng toàn bộ bộ kiểm thử khi xu hướng LOC
nằm trong ngân sách.

Mỗi gói công việc ghi lại:

- LOC trước/sau theo danh mục
- các wrapper Plugin đã xóa
- LOC helper lõi mới, nếu có
- các kiểm thử có mục tiêu đã chạy
- danh sách điểm nóng còn lại

## Tiêu chí thoát

- các import sản xuất được đóng gói không dùng facade channel-access hoặc command-auth đã lỗi thời
- mã tương thích được cô lập vào các đường nối SDK/lõi
- các Plugin được đóng gói tiêu thụ trực tiếp projection ingress hoặc kết quả chung
- LOC sản xuất của Plugin giảm ròng ít nhất 1.500 so với `origin/main`
- LOC sản xuất lõi <= +1.500, hoặc mọi phần vượt mức được bù trừ trong khi tổng vẫn
  <= +2.000
- các kiểm thử đại diện bao phủ hành vi che dữ liệu nhạy cảm, định tuyến, lệnh/sự kiện, kích hoạt,
  access-group, và fallback theo từng kênh
