---
read_when:
    - Thay đổi vòng đời phê duyệt, cơ chế lưu trữ, giao thức hoặc phân quyền của exec hay Plugin
    - Thêm liên kết phê duyệt hoặc các nút điều khiển phê duyệt gốc vào một kênh
    - Chiếu các phê duyệt của phiên con vào chế độ xem của phiên cha hoặc trình điều phối
summary: Thiết kế quy trình phê duyệt bền vững, hỗ trợ liên kết sâu trên Control UI, ứng dụng gốc, các kênh và phiên cha
title: Phê duyệt của người vận hành trên nhiều giao diện
x-i18n:
    generated_at: "2026-07-16T15:46:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 9defdaada1911df1184f64429e1787c4881e735c433d6dbc30a5946e11cc7cce
    source_path: refactor/operator-approvals.md
    workflow: 16
---

# Phê duyệt của người vận hành trên nhiều bề mặt

Thiết kế này theo dõi [#103505](https://github.com/openclaw/openclaw/issues/103505). Thiết kế thay thế thẩm quyền phê duyệt cục bộ theo tiến trình bằng một vòng đời duy nhất do Gateway sở hữu và được SQLite hỗ trợ. Mỗi yêu cầu phê duyệt exec hoặc plugin/công cụ do Gateway sở hữu nhận một ID ổn định, một tuyến Control UI đã xác thực, cơ chế phân giải nguyên tử theo nguyên tắc câu trả lời đầu tiên thắng, cùng các phép chiếu chỉ dành cho người vận hành tới luồng phiên nguồn và phiên tổ tiên của yêu cầu đó.

Các thao tác nội tuyến và liên kết sâu cùng tồn tại. Không có nút chuyển đổi chế độ phê duyệt.

## Mục tiêu

- Một đối tượng phê duyệt bền vững cho các cổng exec và plugin/công cụ.
- Tuyến `${controlUiBasePath}/approve/{approvalId}` ổn định.
- Phân giải từ bất kỳ Control UI, ứng dụng gốc hoặc bề mặt kênh nào đã được cấp quyền.
- Hành vi nguyên tử theo nguyên tắc câu trả lời đầu tiên thắng trên các bề mặt đồng thời.
- Các lần thử lại giống hệt nhau có tính lũy đẳng; những câu trả lời muộn xung đột không thể ghi đè kết quả thắng.
- Hết thời gian chờ, phán quyết đáng tin cậy sai định dạng, thiếu tuyến, hủy bỏ và khởi động lại đều từ chối theo mặc định.
- Các sự kiện yêu cầu và kết thúc đến được phiên nguồn cùng mọi chủ sở hữu cha/bộ điều phối có liên quan.
- Các kênh nhận thao tác phê duyệt và điều hướng có kiểu; dữ liệu gọi lại của lớp truyền tải vẫn riêng tư đối với kênh.
- Các phương thức Gateway hiện có cho exec/plugin vẫn tương thích trong khi phần triển khai hội tụ về một dịch vụ duy nhất.

## Ngoài mục tiêu

- Duy trì hoặc tiếp tục chính quá trình thực thi công cụ đang bị chặn qua lần khởi động lại Gateway.
- Biến ID hoặc URL phê duyệt thành thông tin xác thực dạng bearer.
- Nối lời nhắc phê duyệt vào bản ghi hội thoại mà mô hình có thể thấy hoặc đánh thức các tác nhân cha.
- Chuyển chính sách phê duyệt, lệnh sản phẩm hoặc việc cấp quyền cho người xét duyệt vào các plugin kênh.
- Sao chép trạng thái phê duyệt theo từng kênh, thiết bị hoặc tổ tiên.
- Thiết kế lại danh sách cho phép exec, thành phần chính sách plugin hoặc cơ chế lưu trữ `allow-always`, ngoại trừ những phần cần thiết để làm rõ ràng các kết quả kết thúc.
- Cho phép truy cập từ xa vào một TUI nhúng không có Gateway trong đợt triển khai đầu tiên. TUI này vẫn chỉ hoạt động cục bộ và phải từ chối theo mặc định khi không có người xét duyệt.

## Đường cơ sở trước khi triển khai và bản đồ bằng chứng

Bảng này ghi lại trạng thái triển khai khi #103505 được mở. Các phần triển khai bên dưới theo dõi những bước bổ sung về sổ đăng ký bền vững, thao tác có kiểu, trang liên kết sâu và máy khách gốc được xây dựng trên đường cơ sở đó.

| Bề mặt           | Điểm vào và chủ sở hữu ở đường cơ sở                                                                                                                                  | Hành vi và khoảng trống ở đường cơ sở                                                                                                                                                                    |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Exec của tác nhân        | `src/agents/bash-tools.exec-approval-request.ts`, `src/agents/bash-tools.exec-host-shared.ts`                                                                   | Việc đăng ký `exec.approval.*` hai giai đoạn ngăn điều kiện tranh chấp `/approve` xảy ra sớm, nhưng hết thời gian chờ vẫn có thể trở thành cho phép thông qua `askFallback`.                                                        |
| Cổng công cụ plugin  | `src/agents/agent-tools.before-tool-call.ts`                                                                                                                    | Yêu cầu `plugin.approval.*`; `timeoutBehavior: "allow"` có thể phê duyệt một cổng đã hết thời gian chờ. Chế độ nhúng có thẩm quyền cục bộ theo tiến trình riêng trong `src/infra/embedded-plugin-approval-broker.ts`. |
| Cổng Node của plugin  | `src/gateway/node-invoke-plugin-policy.ts`                                                                                                                      | Tạo và phát trực tiếp thông qua trình quản lý plugin, sao chép một phần vòng đời của phương thức máy chủ.                                                                                 |
| Thẩm quyền Gateway | `src/gateway/server-aux-handlers.ts`, `src/gateway/exec-approval-manager.ts`, `src/gateway/server-methods/approval-shared.ts`                                   | Các trình quản lý exec và plugin riêng biệt sử dụng bản đồ cục bộ theo tiến trình. Các mục kết thúc tồn tại trong 15 giây. Nguyên tắc câu trả lời đầu tiên thắng chỉ được đảm bảo trong một tiến trình.                                          |
| Giao thức Gateway  | `packages/gateway-protocol/src/schema/exec-approvals.ts`, `packages/gateway-protocol/src/schema/plugin-approvals.ts`, `src/gateway/methods/core-descriptors.ts` | Exec có `get` chỉ dành cho trạng thái đang chờ; plugin không có `get`; không có phép tra cứu kết thúc độc lập với loại dành cho liên kết sâu.                                                                                   |
| Phân phối          | `src/infra/exec-approval-channel-runtime.ts`, `src/infra/approval-native-runtime.ts`, `src/infra/approval-handler-runtime.ts`                                   | Hỗ trợ định tuyến nguồn, tin nhắn trực tiếp đến người phê duyệt, phát lại yêu cầu đang chờ, trình xử lý gốc và dọn dẹp trạng thái kết thúc trong tiến trình. Một bước tiếp nối riêng bổ sung cơ chế đối soát kết thúc bền vững.                          |
| Thao tác di động  | `src/interactive/payload.ts`, `src/plugin-sdk/interactive-runtime.ts`, `src/plugin-sdk/approval-reply-runtime.ts`                                               | Các nút phê duyệt là thao tác lệnh chứa `/approve ...`; đích URL và Web App là các trường nút không có kiểu.                                                                           |
| Telegram          | `extensions/telegram/src/approval-handler.runtime.ts`, `extensions/telegram/src/button-types.ts`                                                                | Bộ kết xuất phân tích văn bản lệnh để nhận biết ngữ nghĩa phê duyệt trước khi tạo dữ liệu gọi lại riêng tư.                                                                                     |
| Control UI        | `ui/src/app/exec-approval.ts`, `ui/src/app/overlays.ts`, `ui/src/components/exec-approval.ts`                                                                   | Giao diện phê duyệt là một hộp thoại toàn cục. `ui/src/app-route-paths.ts` và `ui/src/app-routes.ts` sử dụng các tuyến chính xác và viết lại các đường dẫn không xác định thành Chat.                                                    |
| Quyền sở hữu phiên | `src/agents/subagent-registry.types.ts`, `src/agents/subagent-registry-read.ts`, `src/config/sessions/types.ts`                                                 | Đã có quyền sở hữu của bộ điều khiển, bên yêu cầu, phiên cha tường minh và tiến trình sinh kế thừa, nhưng các sự kiện phê duyệt chưa được chiếu tới các luồng phiên đó.                                                    |
| Trạng thái dùng chung      | `src/state/openclaw-state-schema.sql`, `src/state/openclaw-state-db.ts`                                                                                         | Các giao dịch tức thời hiện có và cập nhật có điều kiện của Kysely hỗ trợ thao tác so sánh-và-gán bền vững trong `state/openclaw.sqlite`.                                                                   |

Các kiểm thử hiện tại tiêu biểu gồm `src/gateway/exec-approval-manager.test.ts`, `src/gateway/server-methods/approval-shared.test.ts`, `src/agents/bash-tools.exec-gateway-approval.e2e.test.ts`, `extensions/telegram/src/approval-handler.runtime.test.ts` và `ui/src/e2e/approval-flow.e2e.test.ts`.

SDK plugin vẫn là ranh giới duy nhất của kênh/plugin. Các thay đổi về thời gian chạy và cách trình bày phê duyệt phải được xuất qua các đường dẫn con `src/plugin-sdk/approval-*.ts` và `src/plugin-sdk/interactive-runtime.ts` hiện có; mã sản xuất của plugin không được nhập các thành phần nội bộ của Gateway.

## Giải pháp tham khảo

Omnigent cung cấp ngữ nghĩa hữu ích về trải nghiệm người dùng và lỗi:

- [`approval.py`](https://github.com/omnigent-ai/omnigent/blob/46e3cd9754c3b8567f7b09f4d19b6249dabe0e80/omnigent/runtime/policies/approval.py) tạm dừng ASK, áp dụng thời gian chờ theo từng chính sách và chỉ coi việc chấp nhận chính xác là phê duyệt.
- [`sessions.py`](https://github.com/omnigent-ai/omnigent/blob/46e3cd9754c3b8567f7b09f4d19b6249dabe0e80/omnigent/server/routes/sessions.py) chứa cổng bộ kiểm thử gốc phía máy chủ và phép chiếu yêu cầu/phân giải tới phiên tổ tiên.
- [`ApprovePage.tsx`](https://github.com/omnigent-ai/omnigent/blob/46e3cd9754c3b8567f7b09f4d19b6249dabe0e80/web/src/pages/ApprovePage.tsx) cung cấp trang phê duyệt độc lập dành cho thiết bị di động.

Không được sao chép một cách thiếu cân nhắc tuyên bố của dự án này về lưu trữ. Trạng thái đang chờ hoạt động hiện tại là cục bộ theo tiến trình trong [`_elicitation_registry.py`](https://github.com/omnigent-ai/omnigent/blob/46e3cd9754c3b8567f7b09f4d19b6249dabe0e80/omnigent/server/_elicitation_registry.py), và bảng đang chờ không được sử dụng bị xóa bởi [`e3b1f2a4c9d7_drop_pending_tool_calls_table.py`](https://github.com/omnigent-ai/omnigent/blob/46e3cd9754c3b8567f7b09f4d19b6249dabe0e80/omnigent/db/migrations/versions/e3b1f2a4c9d7_drop_pending_tool_calls_table.py). OpenClaw chủ ý tiến xa hơn: SQLite là nguồn có thẩm quyền và mọi chuyển đổi kết thúc đều là thao tác so sánh-và-gán trong cơ sở dữ liệu.

## Kiến trúc và quyền sở hữu

Gateway sở hữu vòng đời:

1. Một tác nhân, hook plugin hoặc chính sách Node cung cấp yêu cầu dành riêng cho từng loại và liên kết thực thi cục bộ theo tiến trình.
2. Gateway xác thực yêu cầu đó và tạo một phép chiếu đã được làm sạch dành cho người xét duyệt.
3. Dịch vụ phê duyệt tính toán nhóm người nhận gồm nguồn/chủ sở hữu, chèn hàng chính tắc rồi đăng ký trình chờ trong tiến trình.
4. Sau khi chèn bền vững, Gateway phát hành các sự kiện phê duyệt hiện có, phép chiếu phiên, thông báo kênh và thông báo đẩy gốc.
5. Mọi bề mặt đều phân giải thông qua cùng một dịch vụ.
6. Dịch vụ xác nhận một chuyển đổi kết thúc, đánh thức trình chờ thời gian chạy và phát hành các phép chiếu kết thúc.
7. Việc phân phối sự kiện thất bại không bao giờ hoàn tác quyết định đã được xác nhận; máy khách khôi phục thông qua `approval.get` hoặc phát lại danh sách.

Ranh giới quyền sở hữu:

- `src/gateway/`: dịch vụ phê duyệt, cấp quyền, bộ điều hợp RPC, xây dựng URL, vòng đời trình chờ và phát hành sự kiện.
- `src/state/`: lược đồ dùng chung và các kiểu Kysely được tạo.
- `src/infra/`: mô hình dạng xem phê duyệt đã được làm sạch và cấu trúc trình bày di động.
- `src/agents/`: yêu cầu, chờ và áp dụng phán quyết được trả về; không lưu trữ.
- `src/channels/` và `extensions/*`: kết xuất thao tác có kiểu, cấp quyền cho người dùng kênh, mã hóa lệnh gọi lại riêng tư và cập nhật các điều khiển đã phân phối.
- `src/plugin-sdk/`: chỉ các hợp đồng phê duyệt và trình bày công khai.
- `ui/`: trang độc lập và các máy khách hàng đợi/hộp thoại hiện có.

Trình chờ trong tiến trình là một cơ chế thông báo, không phải nguồn có thẩm quyền. Quá trình đăng ký chèn hàng và cài đặt trình chờ một cách đồng bộ trước khi phát hành yêu cầu, nên trình phân giải không thể xen vào giữa các bước đó. Mọi trình phân giải sau đó đều xác nhận thông qua SQLite trước khi hoàn tất trình chờ đó.

## Bản ghi bền vững

Thêm một bảng `operator_approvals` vào cơ sở dữ liệu trạng thái dùng chung.

| Cột                                             | Mục đích                                                                                                                                       |
| -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `approval_id`                                      | ID chuẩn tắc duy nhất trên toàn cục. Giữ nguyên các ID thực thi hiện có và ID `plugin:` để tương thích giao thức, nhưng tuyệt đối không suy luận loại từ tiền tố.      |
| `resolution_ref`                                   | Bộ định vị base64url SHA-256 đầy đủ, duy nhất dành cho các callback truyền tải không thể mang ID chuẩn tắc. Đây không phải là thông tin ủy quyền hoặc ID URL công khai. |
| `kind`                                             | Bộ phân biệt `exec \| plugin` đóng.                                                                                                        |
| `status`                                           | Trạng thái `pending \| allowed \| denied \| expired \| cancelled` đóng.                                                                          |
| `presentation_json`                                | Phép chiếu dành cho người xét duyệt đã được xác thực và gắn thẻ loại. Các yêu cầu thời gian chạy thô, liên kết lệnh và tải trọng callback vẫn chỉ tồn tại cục bộ trong tiến trình.               |
| `source_agent_id`, `source_session_key`            | Danh tính nguồn và điểm neo phép chiếu phiên. Khóa phiên có tính lâu bền; UUID phiên luân chuyển thì không.                                          |
| `audience_session_keys_json`                       | Mảng JSON có thứ tự, đã loại bỏ trùng lặp, được tạo bởi quá trình duyệt quyền sở hữu theo chiều rộng có giới hạn. Các sự kiện yêu cầu và kết thúc sử dụng cùng ảnh chụp nhanh này. |
| `requested_by_device_id`, `requested_by_client_id` | Siêu dữ liệu lâu bền về bên yêu cầu/kiểm toán. ID kết nối được giữ trong bộ nhớ và không phải là chủ thể xuyên bề mặt.                                         |
| `reviewer_device_ids_json`                         | Các thiết bị người xét duyệt được nhắm đích rõ ràng, không bắt buộc, chỉ do môi trường thời gian chạy phê duyệt đáng tin cậy cung cấp.                                                  |
| `runtime_epoch`                                    | Kỷ nguyên tiến trình sở hữu lượt thực thi đang tạm dừng; dùng để hủy các hàng mồ côi sau khi khởi động lại.                                                     |
| `created_at_ms`, `expires_at_ms`, `updated_at_ms`  | Thông tin thời gian có thẩm quyền.                                                                                                                         |
| `decision`                                         | Quyết định rõ ràng của người dùng khi có.                                                                                                       |
| `terminal_reason`                                  | Lý do đóng, chẳng hạn như `user`, `timeout`, `malformed-verdict`, `no-route`, `run-aborted` hoặc `gateway-restart`.                                |
| `resolved_at_ms`, `resolver_kind`, `resolver_id`   | Danh tính của bên thắng và danh tính kiểm toán được giữ lại phía máy chủ. Các phép chiếu dành cho người xét duyệt bỏ qua định danh thô của bên phân giải.                                           |
| `consumed_at_ms`, `consumed_by`                    | Cơ chế bảo vệ phát lại riêng cho `allow-once`; việc tiêu thụ không được xóa quyết định đã ghi lại.                                                       |

Các chỉ mục bắt buộc:

| Chỉ mục                                      | Mục đích                                                                     |
| ------------------------------------------ | --------------------------------------------------------------------------- |
| unique `(resolution_ref)`                  | Từ chối sự nhập nhằng `approval_id`/`resolution_ref` giữa các cột trong khi chèn. |
| `(status, expires_at_ms)`                  | Tìm các phê duyệt đang chờ và đối soát thời hạn có thẩm quyền.               |
| `(source_session_key, created_at_ms DESC)` | Phát lại các phê duyệt gần đây cho một phiên nguồn.                             |
| `(resolved_at_ms)`                         | Dọn các phê duyệt kết thúc được giữ lại theo chính sách lưu giữ cố định.  |

Các mảng đối tượng nhận có kích thước nhỏ và bị giới hạn. Quá trình phát lại được lọc theo phiên trước tiên chọn các hàng đang chờ có thể nhìn thấy thông qua Kysely, sau đó giải mã và lọc các mảng đối tượng nhận có giới hạn trong mã ứng dụng; quá trình này không sử dụng so khớp chuỗi hoặc truy vấn JSON bằng SQL thô.

Giữ lại các hàng kết thúc trong 30 ngày, phù hợp với thời gian lưu giữ kiểm toán siêu dữ liệu trong `src/audit/audit-event-store.ts`. Việc dọn dẹp là chính sách bảo trì cố định, không phải bề mặt cấu hình mới. Cơ sở dữ liệu là trạng thái mặt phẳng điều khiển cục bộ riêng tư, nhưng các API dành cho người xét duyệt tuyệt đối không được để lộ toàn bộ yêu cầu đã lưu hoặc liên kết thời gian chạy.

## Máy trạng thái và so sánh-rồi-đặt

Chỉ các chuyển đổi sau là hợp lệ:

- `pending -> allowed`: `allow-once` hoặc `allow-always` rõ ràng.
- `pending -> denied`: từ chối rõ ràng, phán quyết kết thúc sai định dạng đáng tin cậy hoặc không có tuyến phân phối.
- `pending -> expired`: đã đến thời hạn có thẩm quyền.
- `pending -> cancelled`: hủy lượt chạy, tắt đúng quy trình hoặc khôi phục mục mồ côi sau khi khởi động lại.

Mọi trạng thái kết thúc không được cho phép đều có phán quyết hiệu lực là từ chối.

Quá trình phân giải sử dụng một giao dịch SQLite tức thời và một cập nhật có điều kiện của Kysely tương đương với:

```sql
UPDATE operator_approvals
SET status = ?, decision = ?, terminal_reason = ?, resolved_at_ms = ?
WHERE approval_id = ?
  AND status = 'pending'
  AND expires_at_ms > ?;
```

Nếu cập nhật không ảnh hưởng đến hàng nào, cùng giao dịch đó sẽ đọc bản ghi:

- Thiếu hoặc không được ủy quyền: trả về không tìm thấy; không để lộ sự tồn tại.
- Vẫn đang chờ nhưng đã đến thời hạn: so sánh-rồi-đặt thành `expired`, sau đó trả về hàng kết thúc đó.
- Cùng quyết định đã ghi lại: trả về thành công có tính lũy đẳng cùng bên thắng đã ghi lại.
- Quyết định khác: API hợp nhất trả về `applied: false` cùng bên thắng đã ghi lại; các bộ điều hợp cũ giữ lại `APPROVAL_ALREADY_RESOLVED` khi hợp đồng đã phát hành của chúng yêu cầu.
- Bất kỳ trạng thái kết thúc nào: tuyệt đối không thay đổi trạng thái đó.

`now == expires_at_ms` đã hết hạn. Thời gian của Gateway có thẩm quyền.

Lượt thực thi `allow-once` sử dụng CAS thứ hai trên `consumed_at_ms IS NULL`, được liên kết với ngữ cảnh lệnh/lượt chạy hệ thống chính xác hiện có. Hàng phê duyệt vẫn là bản ghi kiểm toán sau khi được tiêu thụ.

Đầu vào HTTP/RPC sai định dạng không thể được xác thực hoặc không thể xác định một phê duyệt sẽ bị từ chối mà không thay đổi trạng thái và tuyệt đối không thể phê duyệt. Một phán quyết kết thúc sai định dạng nhận từ bộ khai thác/bộ chờ đáng tin cậy cho một phê duyệt đã biết sẽ chuyển sang `denied`.

## API Gateway

Thêm các phương thức dành cho người xét duyệt không phụ thuộc vào loại:

| Phương thức                                    | Hợp đồng                                                                                                                                                                                                            |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `approval.get { id }`                     | Trả về phép chiếu đang chờ có thể nhìn thấy hoặc phép chiếu kết thúc được giữ lại.                                                                                                                                                          |
| `approval.resolve { id, kind, decision }` | Chấp nhận ID chuẩn tắc hoặc tham chiếu truyền tải có kích thước cố định, sau đó thực hiện xác thực ủy quyền, xác thực loại và quyết định được phép, đối soát thời hạn và CAS kết thúc. Phản hồi luôn mang ID chuẩn tắc. |

Sau khi CAS thành công, trả về phép chiếu đã xác nhận ngay lập tức. Các sự kiện cũ, bộ chuyển tiếp kênh và bộ kết thúc đẩy là các bước tiếp theo theo nỗ lực tối đa; một bề mặt chậm hoặc lỗi không được làm trì hoãn hoặc hoàn tác phản hồi chiến thắng.

Việc xác thực yêu cầu theo loại vẫn nằm trong `exec.approval.request` và `plugin.approval.request`. Các `exec.approval.get/list/waitDecision/resolve` và `plugin.approval.list/waitDecision/resolve` hiện có trở thành bộ điều hợp ranh giới giao thức cho dịch vụ chuẩn tắc vì chúng là API Gateway đã phát hành. Các bên gọi nội bộ chuyển sang dịch vụ trong cùng thay đổi.

Phép chiếu dành cho người xét duyệt là một hợp kiểu có gắn thẻ:

```ts
type OperatorApproval = {
  id: string;
  status: OperatorApprovalStatus;
  presentation:
    | { kind: "exec"; commandText: string /* bản xem trước thực thi an toàn */ }
    | { kind: "plugin"; title: string; description: string /* bản xem trước plugin an toàn */ };
  // các trường vòng đời chung
};
```

Đường dẫn ổn định được suy ra, không được lưu bền vững. `approval.get` trả về `urlPath`; các bề mặt biết một nguồn gốc công khai đã được phê duyệt cũng có thể nhận `url` tuyệt đối. Ảnh chụp nhanh dành cho người xét duyệt bỏ qua các khóa phiên nguồn và đối tượng nhận. Gateway giữ các khóa định tuyến đó phía máy chủ cho phép chiếu `session.approval` riêng biệt.

## Sự kiện và hành động khả chuyển

PR 1 giữ nguyên các tên sự kiện, tải trọng và bộ lọc người nhận cấp bản ghi đã phát hành:

- `exec.approval.requested`
- `exec.approval.resolved`
- `plugin.approval.requested`
- `plugin.approval.resolved`

Các sự kiện cũ đó có thể chứa toàn bộ yêu cầu thời gian chạy, vì vậy không được phát tán chúng đến mọi máy khách trong phạm vi phê duyệt. PR 5 bổ sung các trường vòng đời có gắn thẻ (`status`, `sourceSessionKey`, `urlPath`, siêu dữ liệu kết thúc và `kind` ở cấp trình bày) thông qua phép chiếu vòng đời đã làm sạch thay vì mở rộng phạm vi phân phối sự kiện cũ.

Thêm một sự kiện phép chiếu `session.approval` trong phạm vi phê duyệt. Phát hành sự kiện chuẩn tắc một lần với các khóa đối tượng nhận được lưu bền vững; các bên đăng ký theo phiên chính xác nhận cùng sự kiện cho mỗi khóa khớp:

- `sessionKey`: luồng nhận phép chiếu.
- `sourceSessionKey`: tiến trình con/nguồn đã tạo ra cổng kiểm soát.
- `phase`: `pending \| terminal`, được phân biệt theo trạng thái phê duyệt.
- một phép chiếu `OperatorApproval` an toàn.

Máy khách chọn tham gia bằng `sessions.messages.subscribe { key, agentId?, includeApprovals: true }`. Phản hồi thành công bổ sung một `approvalReplay` chứa tối đa 1.000 phê duyệt đang chờ hiện tại cho khóa luồng chính xác đó mà máy khách đăng ký cũng được ủy quyền xét duyệt ở cấp bản ghi. `truncated: false` làm cho lượt phát lại đã lọc trở thành nguồn có thẩm quyền và các máy khách kết nối lại thay thế tập hợp đang chờ cục bộ bằng nó; `truncated: true` là tín hiệu quá tải và máy khách phải giữ lại các mục cục bộ chưa thấy cho đến khi tra cứu chuẩn tắc hoặc các sự kiện vòng đời sau đó giải quyết chúng. Một lần hết thời gian lâu bền được phát hiện sau đó trong quá trình phát lại chỉ phát các dấu mốc kết thúc đến những đối tượng nhận đã đăng ký và được ủy quyền ở cấp bản ghi trước khi trả về ảnh chụp nhanh mới. `operator.admin` có thể trực tiếp chọn tham gia; các máy khách có phạm vi hẹp hơn yêu cầu cả danh tính thiết bị đã ghép nối và `operator.approvals`. Chỉ đăng ký phiên tuyệt đối không bao giờ cấp quyền nhìn thấy phê duyệt.

Đăng ký sự kiện dưới `operator.approvals` trong `src/gateway/server-broadcast.ts`. Phép chiếu này chỉ dùng để quan sát: nó tuyệt đối không nối thêm hàng bản chép lời, phát `sessions.changed` hoặc đánh thức tác nhân.

Mở rộng `MessagePresentationAction` trong `src/interactive/payload.ts`:

```ts
type MessagePresentationAction =
  | { type: "command"; command: string }
  | { type: "callback"; value: string }
  | {
      type: "approval";
      approvalId: string;
      approvalKind: "exec" | "plugin";
      decision: ExecApprovalDecision;
    }
  | { type: "url"; url: string }
  | { type: "web-app"; url: string };
```

Các hành động quyết định có kiểu được core tạo ra cùng với một liên kết Xem xét riêng khi có sẵn origin Control UI tuyệt đối đã được phê duyệt. Các kênh mã hóa hành động phê duyệt theo định dạng callback riêng và gửi kết quả xử lý đến dịch vụ chuẩn. Callback sử dụng chính xác ID chuẩn nếu vừa; nếu không, nó sử dụng `resolution_ref` toàn bộ digest duy nhất của hàng. Tham chiếu chỉ là một khóa tra cứu thu gọn: xác thực Gateway thông thường, ủy quyền bản ghi, loại tường minh, kiểm tra quyết định được phép, đối soát thời hạn và CAS câu trả lời đầu tiên vẫn được áp dụng. Các kênh không được cắt ngắn ID, phân giải tiền tố băm, phân tích văn bản `/approve` hoặc suy luận loại từ tiền tố ID.

Giữ `button.url`, `button.webApp` và các điều khiển phê duyệt dựa trên lệnh làm đầu vào tương thích SDK plugin đã ngừng khuyến nghị. Chuẩn hóa chúng tại ranh giới SDK; di chuyển mọi caller nội bộ đi kèm trong cùng PR. `/approve {id} {decision}` vẫn là phương án dự phòng dạng văn bản và lệnh CLI/trò chuyện, không phải hợp đồng ngữ nghĩa của nút.

## Control UI

Route là `${basePath}/approve/{approvalId}`. ID là tham số đường dẫn duy nhất; danh tính phiên nguồn lấy từ bản ghi.

Vì router hiện tại có các route tĩnh khớp chính xác và ghi lại các đường dẫn không xác định thành Trò chuyện, hãy phát hiện liên kết sâu này trong `ui/src/app/bootstrap.ts` trước khi chuẩn hóa route thông thường. Tái sử dụng thiết lập Gateway/xác thực thông thường, nhưng kết xuất một trang phê duyệt độc lập bên ngoài shell thanh bên và modal toàn cục.

Tài liệu thuộc sở hữu của Gateway đã phục vụ URL của nó. Kết nối ban đầu bỏ qua lựa chọn Gateway từ xa được lưu bền của toàn bộ ứng dụng mà không thay đổi hoặc sao chép cài đặt của lựa chọn đó; chỉ xác thực vẫn được giới hạn theo phiên đối với Gateway phục vụ. Xác thực gốc đáng tin cậy hoặc ghi đè `gatewayUrl` được xác nhận riêng có thể chuyển hướng nó. Core dành riêng không gian tên một phân đoạn `/approve` trước các route HTTP của plugin và việc phát hiện phần mở rộng tĩnh, bao gồm cả các ID kết thúc bằng `.json` hoặc `.js`; khi tính năng phục vụ Control UI bị tắt, route dành riêng đóng khi lỗi với `404`. Giữ trang trong gói Control UI chính để một chunk tải lười bị lỗi không khiến quyết định bảo mật mắc kẹt ở vòng xoay tải.

Các trạng thái trang:

- đang tải
- yêu cầu xác thực
- đang chờ
- đang xử lý
- đã phê duyệt hoặc từ chối tại đây
- đã xử lý ở nơi khác
- đã hết hạn
- đã hủy
- bị cấm/không tìm thấy
- lỗi kết nối, có thể thử lại

Trang gọi RPC Gateway, không phải API REST không xác thực thứ hai. Việc làm mới trình duyệt đọc lại trạng thái bền vững. Trang không bao giờ đặt thông tin xác thực Gateway trong URL, truy vấn hoặc fragment.

## Ủy quyền và quyền riêng tư

URL là công cụ định vị, không phải thẩm quyền. Việc xử lý yêu cầu:

1. kết nối Gateway đã xác thực;
2. `operator.approvals` hoặc `operator.admin`;
3. ủy quyền người xét duyệt ở cấp bản ghi.

Quy tắc cấp bản ghi:

- `operator.admin` có thể xét duyệt.
- `reviewer_device_ids` có thẩm quyền quyết định khi hiện diện. Chỉ thiết bị
  `operator.approvals` đã ghép cặp có trong danh sách mới có thể xét duyệt; thiết bị yêu cầu không mặc nhiên
  có quyền truy cập trừ khi cũng có trong danh sách.
- Khi không có danh sách người xét duyệt tường minh, thiết bị
  `operator.approvals` đã ghép cặp gửi yêu cầu có thể xét duyệt bản ghi của chính nó.
- Các bản ghi thực sự cũ không có liên kết với bên yêu cầu hoặc người xét duyệt vẫn giữ khả năng hiển thị rộng
  cho thiết bị đã ghép cặp để quá trình nâng cấp không làm mắc kẹt công việc đang chờ.
- Các runtime nội bộ không có thiết bị có thể xử lý nhưng không thể đọc thông qua kết nối
  runtime phê duyệt có phạm vi. Thẩm quyền đó chỉ đến từ token runtime
  được máy chủ xác thực; các trường `approval.resolve` công khai không thể
  tạo ra thẩm quyền này.
- Quyền sở hữu kết nối trực tiếp của bên yêu cầu vẫn hợp lệ đối với các adapter cũ; quyền này
  không bao giờ được suy luận từ tên máy khách trùng khớp.
- Tư cách thành viên đối tượng chỉ thay đổi cách trình bày. Nó không bao giờ mở rộng quyền ủy quyền.

`approval.get` chỉ cung cấp phép chiếu đã làm sạch dành cho người xét duyệt và bỏ qua các khóa định tuyến nguồn/đối tượng nội bộ. Sự kiện `session.approval` của PR 5 mang một đích `sessionKey` cùng `sourceSessionKey` sau khi Gateway áp dụng ảnh chụp đối tượng được lưu bền ở phía máy chủ. Các sự kiện exec/plugin hiện có giữ payload lịch sử và phạm vi người nhận hạn chế cho đến khi consumer được di chuyển. Yêu cầu thực thi, liên kết lệnh và phần tiếp tục chỉ tồn tại trong waiter cục bộ của tiến trình. Hàng bền vững chứa phần trình bày an toàn cùng siêu dữ liệu vòng đời, định tuyến và kiểm toán; nó không bao giờ lưu giá trị môi trường thô, thông tin xác thực, header xác thực hoặc dữ liệu callback của kênh.

## Phép chiếu đối tượng

Tính toán đối tượng một lần trước khi chèn và lưu bền ảnh chụp có thứ tự. Quyền sở hữu là một đồ thị, không phải lúc nào cũng là một chuỗi cha duy nhất: một phần tử con có thể có cả bộ điều khiển hiện tại và bên yêu cầu ban đầu, và các chủ sở hữu đó có thể dẫn đến các gốc khác nhau.

Sử dụng phép duyệt theo chiều rộng có tính xác định:

1. Khởi tạo hàng đợi bằng khóa phiên nguồn.
2. Với mỗi khóa được lấy khỏi hàng đợi, đọc hàng registry subagent mới nhất và thêm cả hai cạnh sở hữu riêng biệt vào hàng đợi theo thứ tự cố định: `controllerSessionKey`, rồi `requesterSessionKey`.
3. Khi có hàng registry khả dụng, không đồng thời đi theo dòng dõi mục nhập phiên có thể đã lỗi thời sau khi điều hướng. Nếu không, hãy thêm cạnh dự phòng hiện tại duy nhất `parentSessionKey ?? spawnedBy` vào hàng đợi.
4. Chuẩn hóa và loại bỏ trùng lặp khi thêm vào hàng đợi để đường đi đầu tiên, ngắn nhất được ưu tiên.
5. Dừng ở 64 khóa duy nhất; giới hạn kích thước đối tượng này cũng giới hạn độ sâu duyệt.

Nguồn registry là `src/agents/subagent-registry-read.ts`; các trường quyền sở hữu được định nghĩa trong `src/agents/subagent-registry.types.ts`. Các trường dự phòng phiên được định nghĩa trong `src/config/sessions/types.ts`.

Các phép chiếu được yêu cầu và kết thúc sử dụng cùng một đối tượng được lưu bền ngay cả khi quyền sở hữu tiêu điểm/bộ điều khiển thay đổi trong lúc phê duyệt đang chờ. Điều này bảo đảm dọn dẹp khi kết thúc cho mọi luồng phiên đối tượng đã nhận phép chiếu yêu cầu. Việc xử lý luôn nhắm đến ID phê duyệt nguồn; các phiên đối tượng không bao giờ nhận trạng thái phê duyệt được sao chép. Việc dọn dẹp tin nhắn kênh được chuyển tiếp vẫn là bước tiếp theo riêng về công cụ định vị phân phối bên dưới.

Không ghi tin nhắn bản chép lời, chèn prompt hệ thống, bắt đầu lượt của chủ sở hữu hoặc phát `sessions.changed` chỉ vì một phê duyệt.

## Hội tụ bề mặt đã phân phối

Các trình xử lý phê duyệt gốc đã giữ lại mục tin nhắn được phân phối đủ lâu để thay thế hoặc ngừng các điều khiển đang hoạt động. Các tin nhắn phê duyệt được chuyển tiếp chung hiện loại bỏ `MessageReceipt`, vì vậy quyết định trên một bề mặt khác có thể khiến các điều khiển cũ của chúng vẫn trông như đang chờ. Một bước tiếp theo riêng khắc phục khoảng trống đó bằng bảng con `operator_approval_deliveries` trong cơ sở dữ liệu trạng thái dùng chung.

Mỗi hàng lưu ID phê duyệt, ID phân phối duy nhất, kênh/tài khoản/route chính xác, công cụ định vị tin nhắn riêng của kênh được giới hạn và xác thực bằng JSON, dấu thời gian phân phối và trạng thái kết thúc. Nó không bao giờ lưu dữ liệu callback, token quyết định hoặc yêu cầu phê duyệt thô. Kênh sở hữu việc mã hóa công cụ định vị và thay đổi tin nhắn; core sở hữu trạng thái chuẩn, lựa chọn đích, chính sách thử lại và văn bản kết thúc dự phòng.

Đăng ký phân phối và xử lý kết thúc cạnh tranh an toàn:

1. Sau khi một lần gửi đang chờ trả về biên nhận, hãy chèn công cụ định vị phân phối và đọc trạng thái phê duyệt cha trong một giao dịch.
2. Nếu phần tử cha đã kết thúc, hãy lên lịch kết thúc ngay lập tức thay vì để lần phân phối muộn ở trạng thái đang chờ.
3. Mỗi lần chuyển trạng thái kết thúc đã commit sẽ lên lịch riêng cho tất cả hàng phân phối chưa hoàn tất; broadcast có thể loại bỏ không phải là tác nhân kích hoạt.
4. Trình kết thúc của kênh báo cáo `replaced`, `retired` hoặc `unsupported`. Trạng thái đã thay thế ngăn gửi trùng tin nhắn kết thúc; trạng thái đã ngừng gửi bước tiếp theo kết thúc hiện có; không được hỗ trợ hoặc thất bại sẽ dùng phương án dự phòng mà không hoàn tác CAS phê duyệt.
5. Khi khởi động, thử lại các phê duyệt đã kết thúc nhưng có phân phối chưa hoàn tất, giúp việc dọn dẹp chịu được lần khởi động lại Gateway.

Vòng đời vận chuyển này là hook adapter phân phối tùy chọn, không phải trình kết xuất hoặc hành động tin nhắn hướng đến mô hình. Tin nhắn QQ C2C/nhóm hiện không có API chỉnh sửa, xóa hoặc xóa bàn phím; adapter đó vẫn không được hỗ trợ và chỉ có thể hiển thị sự thật chuẩn sau một lần nhấp sau đó cho đến khi phương thức vận chuyển có API thay đổi.

## Ngữ nghĩa khởi động lại, hết thời gian và route

Khả năng lưu bền của SQLite không đồng nghĩa với tiếp tục thực thi. Các liên kết lệnh/công cụ vẫn nằm trong bộ nhớ vì chúng có thể chứa các dữ kiện runtime nhạy cảm về bảo mật và không phải là hợp đồng công việc có thể tiếp tục.

Khi Gateway khởi động:

- tạo epoch runtime mới;
- chuyển nguyên tử các hàng đang chờ từ epoch cũ sang `cancelled` với lý do `gateway-restart`;
- giữ lại các hàng để URL của chúng giải thích điều đã xảy ra;
- không bao giờ thực thi phê duyệt sau đó đối với một liên kết runtime bị thiếu.

Timer là tối ưu hóa đánh thức. Thẩm quyền về thời hạn được lưu trong `expires_at_ms`; các thao tác đọc, chờ và xử lý đều chạy đối soát hết hạn.

Hành vi nghiêm ngặt cuối cùng:

- hết thời gian -> `expired`, từ chối;
- không có route -> `denied`, từ chối;
- hủy lượt chạy -> `cancelled`, từ chối;
- phán quyết đáng tin cậy sai định dạng -> `denied`, từ chối;
- chỉ quyết định cho phép tường minh nằm trong danh sách được phép -> `allowed`.

Hành vi exec đã phát hành hiện tại vẫn xung đột với hợp đồng này:

- `src/agents/bash-tools.exec-host-shared.ts` có thể áp dụng `askFallback`.
- `docs/tools/exec-approvals.md` và `docs/cli/approvals.md` ghi lại bề mặt đó.

Phê duyệt plugin hiện đóng khi lỗi lúc hết thời gian và khi phán quyết sai định dạng; trường cũ
`timeoutBehavior` vẫn được chấp nhận nhưng bị bỏ qua. Bước tiếp theo về ngữ nghĩa nghiêm ngặt
của exec phải cập nhật đồng thời mã, kiểu, tài liệu, kiểm thử và changelog, với
xét duyệt tường minh của chủ sở hữu/bảo mật. `askFallback` có thể tiếp tục mô tả
việc lựa chọn chính sách trước cổng trong quá trình di chuyển, nhưng không được biến thời gian chờ
của bản ghi đang chờ đã tạo thành phê duyệt.

## Kế hoạch tương thích

- Giao thức Gateway bổ sung; không tăng phiên bản giao thức.
- Giữ nguyên các phương thức và sự kiện exec/plugin hiện có tại ranh giới bên ngoài.
- Giữ các ID hiện có, bao gồm tiền tố `plugin:`, nhưng ngừng sử dụng tiền tố làm thông tin kiểu.
- Giữ hành vi lệnh văn bản `/approve`.
- Giữ các trường URL/Web App của nút cũ và hành động lệnh làm đầu vào tương thích SDK plugin; đầu ra core mới có kiểu.
- Di chuyển tất cả các kênh đi kèm và caller nội bộ trong cùng thay đổi hành động có kiểu.
- Thêm mục changelog cho URL/trang mới và cho thay đổi hành vi hết thời gian sau này.
- Không thêm cài đặt chế độ elicitation.

## Triển khai

### PR 1: vòng đời bền vững

- Ghi chú thiết kế này.
- Schema SQLite dùng chung, quá trình tạo Kysely, kho lưu trữ và dọn dẹp sau 30 ngày.
- Dịch vụ phê duyệt Gateway, cầu nối waiter runtime và xử lý phần tử mồ côi khi khởi động lại.
- `approval.get/resolve` hợp nhất.
- Các adapter phương thức exec/plugin.
- Các kiểm thử câu trả lời đầu tiên thắng, tính lũy đẳng, hết hạn, ủy quyền và tiêu thụ.
- Chưa thay đổi hành vi UI hoặc kênh.

### PR 2: hành động có kiểu và callback của kênh

- Các hành động phê duyệt, URL và Web App có kiểu.
- Các trình dựng nội dung trình bày cốt lõi và các nội dung xuất của SDK Plugin.
- Mã hóa callback riêng tư với lớp truyền tải, có loại chủ sở hữu tường minh.
- Các tham chiếu callback bền vững, kích thước cố định cho ID chuẩn vượt quá giới hạn của lớp truyền tải.
- Di chuyển các kênh đi kèm khỏi cơ chế suy luận văn bản lệnh và ID phê duyệt.
- Trạng thái đúng chuẩn của câu trả lời đầu tiên trên bề mặt được nhấp và các cập nhật trạng thái kết thúc native đang hoạt động theo nỗ lực tối đa; việc đưa thông báo kênh về trạng thái kết thúc một cách bền vững vẫn là công việc tiếp theo.
- Các kiểm thử SDK và kênh đi kèm.

### PR 3: Liên kết sâu trong giao diện điều khiển

- Trang phê duyệt độc lập có xác thực và định tuyến khởi động nhận biết đường dẫn cơ sở.
- Liên kết với Gateway đang phục vụ mà không sửa đổi lựa chọn từ xa đã lưu của người vận hành.
- Không gian tên HTTP phê duyệt do lõi sở hữu, bao gồm cả các ID trông giống tài nguyên.
- Payload URL do Gateway tạo và thăm dò trạng thái đang chờ cho đến khi các sự kiện vòng đời được phát hành.
- Bằng chứng về chiều rộng thiết bị di động, kết nối lại, câu trả lời cạnh tranh, tải lại và đường dẫn được gắn.

### PR 4: ứng dụng khách native

- Các bề mặt xem xét trên iOS và Android sử dụng `approval.get/resolve` có nhận biết loại; watchOS chuyển tiếp lời nhắc và quyết định an toàn cho người xem xét thông qua iPhone đã ghép đôi.
- Watch cung cấp các quyết định thực thi được hợp đồng chuyển tiếp nhỏ gọn hỗ trợ: cho phép một lần và từ chối.
- Trạng thái kết thúc đúng chuẩn của câu trả lời đầu tiên thay thế trạng thái quyết định đã thử cục bộ.
- Xác nhận giải quyết bị mất hoặc không rõ ràng sẽ đóng băng các nút điều khiển cho đến khi đọc lại trạng thái chuẩn.
- Các phiên bản Gateway v4 đã phát hành trước đó vẫn giữ khả năng xem xét thực thi thông qua phương thức dự phòng cũ có phạm vi hẹp; trạng thái kết thúc được duy trì xuyên bề mặt yêu cầu các phương thức hợp nhất.
- Cảnh báo dành cho người xem xét và ngữ cảnh chủ sở hữu vẫn hiển thị trên iPhone, Watch và Android.
- Bằng chứng về kiểm thử đơn vị native, bản dựng và nền tảng.

### PR 5: lan truyền vòng đời đến phần tử tổ tiên

- Phân phối trạng thái đang chờ/kết thúc của `session.approval` từ ảnh chụp đối tượng nhận đã được lưu bền vững trong PR 1.
- Đăng ký phiên chính xác, phát lại khi kết nối lại và dấu mộ trạng thái kết thúc mà không sửa đổi bản chép lời hoặc đánh thức tác tử.
- Các callback vòng đời chạy sau thao tác chèn/CAS bền vững và không bao giờ trở thành thẩm quyền phê duyệt.
- Bằng chứng về tác tử con lồng nhau và kết nối lại.

### PR 6: hành vi đóng khi lỗi

- Di chuyển `node-invoke-plugin-policy.ts` và trình môi giới Plugin nhúng khỏi thẩm quyền trùng lặp.
- Ngữ nghĩa nghiêm ngặt về thời gian chờ, dữ liệu sai định dạng, không có tuyến, liên kết và việc sử dụng quyền cho phép một lần.
- Ngừng dùng các cài đặt thời gian chờ dễ dãi đã phát hành mà không tuân theo chúng sau khi một yêu cầu đã ở trạng thái chờ.
- Bằng chứng về tranh chấp đa bề mặt và chèn lỗi.

### Công việc tiếp theo: dọn dẹp thông báo từ xa bền vững

- Lưu bền vững các bộ định vị chuyển tiếp phân phối và đưa mọi thông báo kênh đã phân phối về trạng thái kết thúc sau khi khởi động lại.
- Giữ vòng đời lớp truyền tải này tách biệt với thẩm quyền phê duyệt chuẩn và các hành động trình bày có kiểu.

## Kiểm thử

Phạm vi kiểm thử tập trung bắt buộc:

- Mở lại SQLite vẫn giữ nguyên các phép chiếu trạng thái đang chờ và kết thúc.
- Hai trình giải quyết đồng thời tạo ra chính xác một bên thắng CAS.
- Thử lại cùng quyết định thành công theo cách lũy đẳng; thử lại với quyết định xung đột trả về bên thắng đã được ghi nhận.
- Giải quyết tại hoặc sau thời hạn không thể phê duyệt.
- `allow-once` chỉ có thể được sử dụng đúng một lần mà không xóa trạng thái kiểm tra kết thúc.
- Quá trình khởi động hủy các epoch thời gian chạy cũ hơn.
- Tra cứu và giải quyết không được cấp quyền không làm lộ sự tồn tại của bản ghi.
- Danh sách cho phép người xem xét tường minh và hành vi `operator.approvals` được ghép đôi tổng quát.
- Các phương thức cũ của thực thi và Plugin dùng chung một kho lưu trữ.
- Các lược đồ yêu cầu/liệt kê/lấy/giải quyết của Gateway và các payload sự kiện bổ sung.
- Chuẩn hóa hành động có kiểu, kết xuất dự phòng, các nội dung xuất của SDK và chuyển đổi kênh đi kèm.
- Mã hóa callback Telegram chứa dữ liệu riêng tư với lớp truyền tải và không suy luận chuỗi lệnh.
- Phần tử con trực tiếp, các chủ sở hữu bộ điều khiển/người yêu cầu phân nhánh, chủ sở hữu lồng nhau, tái chỉ định, dự phòng trường phiên, chu trình và giới hạn kích thước đối tượng nhận.
- Các mảng đối tượng nhận khi được yêu cầu và khi kết thúc hoàn toàn giống nhau.
- Các phép chiếu chủ sở hữu không gây sửa đổi bản chép lời hoặc đánh thức tác tử.
- Tuyến giao diện điều khiển hoạt động tại `/` và một đường dẫn cơ sở đã cấu hình; làm mới hiển thị trạng thái đúng đang chờ hoặc kết thúc.
- Các câu trả lời đồng thời từ giao diện điều khiển và Telegram hiển thị một bên thắng và "đã được giải quyết ở nơi khác" cho bên thua.
- Các mã định danh phê duyệt native và mã định danh chủ sở hữu Gateway giữ nguyên chính xác các byte UTF-8 trong suốt quá trình định tuyến và đối soát.
- Thương lượng họ RPC native ghim một họ chuẩn hoặc cũ cho mỗi tuyến Gateway được tiếp nhận và không bao giờ âm thầm hạ cấp sau khi sử dụng.
- Xác nhận giải quyết native bị mất sẽ đóng băng các hành động cho đến khi đọc lại trạng thái chuẩn; việc đọc lại thất bại không thể tạo ra một bên thắng giả hoặc xác nhận một lần làm mới Watch.
- Tương quan yêu cầu ảnh chụp Watch chỉ được chấp nhận cho đúng chủ sở hữu Gateway đã ghép đôi và sau khi iPhone hoàn tất đọc lại trạng thái chuẩn.
- Bằng chứng luồng người dùng qua Testbox/Crabbox, bao gồm trang phê duyệt có chiều rộng thiết bị di động, dọn dẹp hành động Telegram và một vòng khứ hồi đang chờ/giải quyết/bên thua đến muộn trên Android, iPhone và Watch.

## Khả năng quan sát

Phát nhật ký chuyển tiếp có cấu trúc, không chứa nội dung, gồm ID phê duyệt, loại, khóa phiên nguồn, trạng thái, lý do và độ trễ. Không bao giờ ghi nhật ký nội dung xem trước hoặc liên kết thô.

Theo dõi:

- số lượng yêu cầu theo loại;
- số lượng kết thúc theo loại/trạng thái/lý do;
- thước đo trạng thái đang chờ;
- độ trễ từ yêu cầu đến kết thúc;
- kết quả tranh đua giải quyết: bên thắng, thử lại lũy đẳng, xung đột, hết hạn;
- số lượng tuyến phân phối và số lần từ chối do không có tuyến;
- số lần hủy mục mồ côi khi khởi động;
- kích thước đối tượng nhận.

Một chuyển tiếp đã cam kết được coi là thành công ngay cả khi việc phân phối sự kiện sau đó thất bại. Các bên đăng ký vòng đời khôi phục thông qua cơ chế phát lại của PR 5 và tra cứu chuẩn. Việc đưa thông báo kênh về trạng thái kết thúc một cách bền vững vẫn là công việc tiếp theo riêng biệt nêu trên.

## Các quyết định còn bỏ ngỏ

1. **Nguồn gốc giao diện điều khiển có thể truy cập từ bên ngoài.** Mỗi ảnh chụp đều mang `urlPath` tương đối ổn định. URL tuyệt đối chỉ có thể được quảng bá từ vị trí Tailscale Serve/Funnel đã lưu vào bộ nhớ đệm sau khi việc công khai Gateway thành công; `allowedOrigins`, tiêu đề Host của yêu cầu, `gateway.remote.url` và các ứng viên loopback/LAN chỉ dùng để hiển thị không phải là nguồn gốc chuẩn. Telegram có thể sử dụng trình bao bọc Mini App đã xác thực để giữ lại đường dẫn phê duyệt xuyên suốt quá trình bootstrap. Các proxy ngược tùy ý chỉ tiếp tục dùng đường dẫn tương đối cho đến khi có hợp đồng URL công khai tường minh được xem xét riêng. Không bao giờ để một kênh tự suy đoán nguồn gốc.
2. **Chuyển đổi tương thích sang thời gian chờ nghiêm ngặt cho thực thi.** Thời gian chờ phê duyệt Plugin hiện đóng khi lỗi và `timeoutBehavior` đã ngừng dùng. Hợp đồng `askFallback` đã phát hành còn lại cần được chủ sở hữu/bộ phận bảo mật xem xét tường minh, cùng với changelog, tài liệu và quyết định di chuyển/ngừng dùng trước khi ngừng cấp quyền thực thi sau khi một yêu cầu đang chờ hết thời gian.
3. **Chế độ nhúng không có Gateway.** Khuyến nghị: ban đầu chỉ giữ ở cục bộ, sau đó biến chế độ này thành một ứng dụng khách của dịch vụ chuẩn khi có Gateway. Không quảng bá liên kết sâu mà không máy chủ nào có thể giải quyết.
