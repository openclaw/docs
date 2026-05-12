---
read_when:
    - Rà soát lý do quá trình tái cấu trúc đầu vào kênh đã thêm quá nhiều mã
    - Chuyển chính sách về định tuyến, lệnh, sự kiện, kích hoạt hoặc nhóm truy cập từ các Plugin đi kèm vào phần lõi
    - Đang xem xét liệu một hàm trợ giúp đầu vào kênh có thực sự xóa mã Plugin đi kèm hay không
sidebarTitle: Ingress core deletion
summary: Kế hoạch ưu tiên xóa bỏ để chuyển phần mã kết nối đầu vào kênh lặp lại vào lõi.
title: Kế hoạch xóa lõi Ingress
x-i18n:
    generated_at: "2026-05-12T00:59:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1fdf1e7c9636d02c48c4b5d2b4a51470317dd64e2270c7fae779777c0d787afc
    source_path: refactor/ingress-core.md
    workflow: 16
---

# Kế hoạch xóa lõi ingress

Quá trình tái cấu trúc ingress chưa lành mạnh khi nó thêm hàng nghìn dòng ròng. Việc tập trung hóa vào lõi chỉ có ý nghĩa khi mã production của Plugin đóng gói nhỏ hơn và khả năng tương thích SDK bên thứ ba cũ được cô lập trong các shim SDK/lõi.

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

Các Plugin đóng gói không nên dịch ingress ngược lại thành các dạng `AccessResult`,
`GroupAccessDecision`, `CommandAuthDecision`, `DmCommandAccess`, hoặc
`{ allowed, reasonCode }` cục bộ, trừ khi kiểu đó là API Plugin công khai.

## Ngân sách

Đo theo merge-base của PR với `origin/main`, bao gồm cả các tệp chưa được theo dõi.

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

Dọn dẹp tối thiểu còn lại:

```text
plugin production     needs 260 more net deleted lines
total                 needs 775 more net deleted lines
core production       still +1,876 over standalone budget, unless paid down by plugin deletion
```

Việc chỉ xóa bình luận không được tính là dọn dẹp. Lượt ngân sách trước đó quá rộng rãi vì đã bao gồm các bình luận giải thích QQBot được khôi phục; tài liệu này chỉ theo dõi việc di chuyển mã thực thi/docs/test.

Đo lại sau mỗi đợt dọn dẹp:

```sh
base=$(git merge-base HEAD origin/main)
git diff --shortstat "$base"
git diff --numstat "$base" -- src/channels/message-access src/plugin-sdk extensions | sort -nr -k1 | head -n 80
pnpm lint:extensions:no-deprecated-channel-access
```

## Chẩn đoán

Lượt đầu đã thêm kernel ingress dùng chung, rồi để lại quá nhiều phần ủy quyền cục bộ trong Plugin bên cạnh nó:

```text
platform facts
  -> shared ingress state and decision
  -> plugin-local DTO or legacy projection
  -> plugin-local if/else ladder
```

Điều đó nhân đôi mô hình. Mã production của lõi tăng khoảng 3.376 dòng, trong khi mã production của Plugin đóng gói nhỏ hơn 1.240 dòng. Điều này tốt hơn lượt đầu, nhưng chưa nằm trong ngân sách tối thiểu. Cách sửa vẫn là ưu tiên xóa:

- xóa các DTO Plugin chỉ đổi tên trường ingress
- xóa các test chỉ khẳng định hình dạng wrapper
- chỉ thêm helper lõi khi cùng patch đó xóa mã Plugin đóng gói
- chỉ giữ khả năng tương thích SDK cũ trong các shim SDK/lõi
- đóng gói lại lõi sau khi việc xóa wrapper làm lộ hình dạng ổn định

## Điểm nóng

Các tệp production đóng gói có số dương vẫn cần thu nhỏ:

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

Nhánh này vẫn chưa nằm trong ngân sách tối thiểu. Phần việc còn lại có liên quan đến review nên xóa luồng ủy quyền lặp lại, khung dựng turn, hoặc test wrapper trước khi thêm một abstraction lõi khác.

## Đọc mã hiện tại

Ranh giới lõi lành mạnh đã tồn tại trong `src/channels/message-access/runtime.ts`: nó sở hữu các adapter danh tính, allowlist hiệu lực, đọc pairing-store, descriptor định tuyến, preset lệnh/sự kiện, nhóm truy cập và projection `ResolvedChannelMessageIngress` đã được giải quyết cuối cùng.

Phần tăng trưởng còn lại chủ yếu là glue Plugin được xếp lên trên ranh giới đó:

- `extensions/telegram/src/ingress.ts` bọc các quyết định lõi trong helper lệnh/sự kiện riêng của Telegram, rồi các call site vẫn truyền allowlist đã chuẩn hóa và danh sách owner được tính trước.
- `extensions/discord/src/monitor/dm-command-auth.ts`,
  `extensions/feishu/src/policy.ts`, `extensions/googlechat/src/monitor-access.ts`,
  và `extensions/matrix/src/matrix/monitor/access-state.ts` vẫn giữ các DTO policy cục bộ hoặc tên quyết định legacy bên cạnh ingress.
- `extensions/signal/src/monitor/access-policy.ts` giữ đúng phần chuẩn hóa danh tính Signal và phản hồi pairing ở cục bộ, nhưng vẫn có một ranh giới wrapper cần thu gọn thành việc tiêu thụ ingress trực tiếp.
- `extensions/nextcloud-talk/src/inbound.ts`, `extensions/irc/src/inbound.ts`,
  `extensions/qa-channel/src/inbound.ts`, `extensions/zalo/src/monitor.ts`, và
  `extensions/zalouser/src/monitor.ts` vẫn lặp lại việc lắp ráp route/envelope/turn, có thể chuyển sang các helper turn dùng chung bên ngoài kernel ingress.

Kết luận: chuyển thêm mã vào lõi chỉ hữu ích nếu nó xóa các lớp wrapper Plugin này trong cùng patch. Thêm một abstraction khác trong khi vẫn giữ return wrapper tại chỗ là lặp lại sai lầm.

## Ranh giới

Lõi sở hữu policy chung:

- chuẩn hóa và khớp allowlist
- mở rộng nhóm truy cập và chẩn đoán
- đọc allowlist DM từ pairing-store
- các gate định tuyến, người gửi, lệnh, sự kiện và kích hoạt
- ánh xạ admission: dispatch, drop, skip, observe, pairing
- trạng thái đã biên tập, quyết định, chẩn đoán và projection tương thích SDK
- các descriptor chung có thể tái sử dụng cho danh tính, định tuyến, lệnh, sự kiện, kích hoạt và outcome

Plugin sở hữu fact transport và side effect:

- tính xác thực của webhook/socket/request
- trích xuất danh tính nền tảng và tra cứu API
- mặc định policy riêng theo kênh
- gửi challenge pairing, phản hồi, ack, reaction, typing, media, lịch sử,
  thiết lập, doctor, trạng thái, log và nội dung hướng người dùng

Lõi phải giữ tính độc lập với kênh: không có Discord, Slack, Telegram, Matrix, room,
guild, space, API client, hoặc mặc định riêng theo Plugin trong
`src/channels/message-access`.

## Quy tắc chấp nhận

Mọi helper lõi mới phải xóa mã production của Plugin đóng gói ngay lập tức.

```text
one bundled caller        reject; keep plugin-local
two bundled callers       accept only if plugin production LOC drops
three or more callers     plugin deletion must be at least 2x new core LOC
compatibility-only helper SDK/core shim only; never bundled hot paths
```

Dừng lại và thiết kế lại nếu:

- LOC production của Plugin tăng
- test tăng nhanh hơn production giảm
- một hot path đóng gói trả về DTO chỉ đổi tên `ResolvedChannelMessageIngress`
- một helper lõi cần channel id, đối tượng nền tảng, API client, hoặc mặc định riêng theo kênh

## Gói công việc

1. Đóng băng ngân sách.
   Đưa LOC vào PR, giữ deprecated-ingress lint xanh, và bao gồm LOC trước/sau trong các commit dọn dẹp.

2. Xóa các ranh giới DTO mỏng.
   Thay thế return wrapper cục bộ của Plugin bằng `ResolvedChannelMessageIngress`,
   `senderAccess`, `commandAccess`, `routeAccess`, hoặc `ingress` trực tiếp. Bắt đầu với QQBot, Telegram, Slack, Discord, Signal, Feishu, Matrix, iMessage và Tlon. Xóa các test hình dạng wrapper; giữ test hành vi.

3. Chỉ thêm phân loại outcome kèm với việc xóa.
   Một classifier chung có thể xuất `dispatch`, `pairing-required`,
   `skip-activation`, `drop-command`, `drop-route`, `drop-sender`, và
   `drop-ingress`. Nó phải suy ra từ đồ thị quyết định, không phải chuỗi lý do,
   và di chuyển ít nhất ba Plugin trong cùng patch.

4. Chỉ thêm builder descriptor định tuyến kèm với việc xóa.
   Helper target định tuyến và sender định tuyến chung chỉ được chấp nhận nếu chúng ngay lập tức thu nhỏ các Plugin nặng về định tuyến: Google Chat, IRC, Microsoft Teams,
   Nextcloud Talk, Mattermost, Slack, Zalo và Zalo Personal.

5. Chỉ thêm preset lệnh/sự kiện kèm với việc xóa.
   Tập trung hóa các hình dạng text-command, native-command, callback và origin-subject.
   Consumer lệnh phải mặc định là không được ủy quyền khi không có command gate nào chạy;
   sự kiện không được bắt đầu pairing.

6. Chỉ thêm preset danh tính ở nơi chúng loại bỏ boilerplate.
   Các helper stable-id, stable-id-plus-aliases, phone/e164 và multi-identifier
   được phép khi giá trị thô chỉ đi vào input adapter và trạng thái đã biên tập giữ các id/số đếm mờ.

7. Chia sẻ việc lắp ráp turn đã được ủy quyền.
   Bên ngoài kernel ingress, xóa khung dựng route/envelope/context/reply lặp lại khỏi QA Channel, IRC, Nextcloud Talk, Zalo và Zalo Personal.
   Lõi có thể sở hữu thứ tự route/session/envelope/dispatch; Plugin giữ phần delivery và context riêng theo kênh.

8. Cô lập khả năng tương thích.
   Helper SDK đã deprecated vẫn tương thích source, nhưng hot path đóng gói không được import ingress đã deprecated hoặc facade command-auth. Test tương thích nên dùng Plugin bên thứ ba giả, không dùng nội bộ Plugin đóng gói.

9. Đóng gói lại lõi.
   Sau khi việc xóa wrapper hoàn tất, thu gọn các module dùng một lần, loại bỏ export không dùng, chuyển projection tương thích ra khỏi hot path, và giữ các test tập trung cho danh tính,
   định tuyến, lệnh/sự kiện, kích hoạt, nhóm truy cập và shim tương thích.

## Các đợt xóa

Chạy theo thứ tự này. Mỗi đợt phải giảm LOC production đóng gói.

1. Thu gọn wrapper, delta Plugin dự kiến: -400 đến -600.
   Thay thế các kiểu kết quả `resolveXAccess`, `resolveXCommandAccess` và
   `accessFromIngress` cục bộ của Plugin bằng việc đọc trực tiếp từ
   `ResolvedChannelMessageIngress`. Mục tiêu đầu tiên: Discord DM command auth,
   Feishu policy, Matrix access state, Telegram ingress, Signal access policy,
   QQBot SDK adapter.

2. Helper outcome dùng chung, delta Plugin dự kiến: -200 đến -350.
   Chỉ thêm một classifier chung nếu nó xóa các ladder
   `shouldBlockControlCommand`, pairing, activation skip, route block và sender
   block lặp lại trên ít nhất ba Plugin.

3. Builder descriptor định tuyến, delta Plugin dự kiến: -200 đến -350.
   Chuyển phần lắp ráp descriptor target định tuyến và sender định tuyến lặp lại vào helper lõi. Mục tiêu đầu tiên: Google Chat, IRC, Microsoft Teams, Nextcloud Talk,
   Mattermost, Slack, Zalo, Zalo Personal.

4. Chia sẻ lắp ráp turn, delta Plugin dự kiến: -250 đến -450.
   Dùng thứ tự route/session/envelope/dispatch chung cho các Plugin inbound đơn giản. Mục tiêu đầu tiên: QA Channel, IRC, Nextcloud Talk, Zalo, Zalo Personal.

5. Đóng gói lại lõi, delta lõi dự kiến: -300 đến -700.
   Sau khi Plugin tiêu thụ trực tiếp projection runtime, xóa các module dùng một lần,
   gộp các tệp nhỏ lại vào `runtime.ts` hoặc các sibling tập trung, và giữ tệp tương thích SDK tách biệt khỏi hot path đóng gói.

6. Tinh gọn test, delta test dự kiến: -300 đến -600.
   Xóa các test chỉ khẳng định hình dạng wrapper đã bị loại bỏ. Giữ test hành vi cho
   từ chối lệnh, fallback nhóm, khớp origin-subject, activation skip,
   nhóm truy cập, pairing và biên tập.

Hình dạng landing tối thiểu dự kiến sau các đợt này:

```text
plugin production     <= -1,500
core production       about +1,800 to +2,200 before final repack
tests                 <= +500
total                 <= +2,000
```

## Không di chuyển

Không di chuyển giá trị mặc định cấu hình nền tảng, UX thiết lập, nội dung doctor/fix, tra cứu API,
kiểm tra sự hiện diện của chủ sở hữu Slack, xử lý bí danh/xác minh Matrix, phân tích cú pháp callback Telegram,
phân tích cú pháp lệnh, đăng ký lệnh native, phân tích cú pháp payload phản ứng, phản hồi ghép nối, phản hồi lệnh, acks, typing, media, history,
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

Dùng Testbox cho các gate thay đổi phạm vi rộng/bằng chứng full-suite khi xu hướng LOC
nằm trong ngân sách.

Mỗi gói công việc ghi lại:

- LOC trước/sau theo danh mục
- wrapper plugin đã xóa
- LOC helper core mới, nếu có
- các kiểm thử có mục tiêu đã chạy
- danh sách điểm nóng còn lại

## Tiêu chí thoát

- import production được bundle không còn facade channel-access hoặc command-auth đã ngừng khuyến nghị
- mã tương thích được cô lập ở các seam SDK/core
- plugin được bundle tiêu thụ trực tiếp ingress projection hoặc kết quả generic
- LOC production của plugin âm ròng ít nhất 1.500 so với `origin/main`
- LOC production của core là `<= +1,500`, hoặc phần vượt mức được bù trong khi tổng
  vẫn `<= +2,000`
- các kiểm thử đại diện bao phủ hành vi redaction, route, command/event, activation,
  access-group và fallback riêng theo channel
