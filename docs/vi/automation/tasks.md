---
read_when:
    - Kiểm tra công việc nền đang diễn ra hoặc vừa hoàn tất
    - Gỡ lỗi các sự cố phân phối cho các lượt chạy tác tử tách rời
    - Tìm hiểu cách các lượt chạy nền liên quan đến phiên, Cron và Heartbeat
sidebarTitle: Background tasks
summary: Theo dõi tác vụ nền cho các lượt chạy ACP, tác tử phụ, lần thực thi cron và thao tác CLI
title: Tác vụ nền
x-i18n:
    generated_at: "2026-07-19T05:36:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: dbdc5ced133764fec0c8b9ae7b1957e24272dc9c1c86099de81f6923955d6b5a
    source_path: automation/tasks.md
    workflow: 16
---

<Note>
Bạn đang tìm cách lập lịch? Xem [Tự động hóa](/vi/automation) để chọn cơ chế phù hợp. Trang này là sổ ghi hoạt động cho công việc nền, không phải bộ lập lịch.
</Note>

Tác vụ nền theo dõi công việc chạy **bên ngoài phiên hội thoại chính của bạn**: các lượt chạy ACP, việc khởi tạo subagent, các lần thực thi công việc cron và các thao tác được khởi tạo từ CLI.

Tác vụ **không** thay thế phiên, công việc cron hoặc heartbeat - chúng là **sổ ghi hoạt động** ghi lại công việc tách biệt nào đã diễn ra, vào thời điểm nào và có thành công hay không.

<Note>
Không phải mọi lượt chạy agent đều tạo tác vụ. Các lượt heartbeat và trò chuyện tương tác thông thường thì không. Tất cả các lần thực thi cron, khởi tạo ACP, khởi tạo subagent, lệnh agent CLI được Gateway điều phối và lệnh nền `exec` do agent khởi chạy đều tạo tác vụ.
</Note>

## Tóm tắt

- Tác vụ là **bản ghi**, không phải bộ lập lịch - cron và heartbeat quyết định công việc chạy _khi nào_, còn tác vụ theo dõi _điều gì đã xảy ra_.
- ACP, subagent, tất cả công việc cron và thao tác CLI đều tạo tác vụ. Các lượt heartbeat thì không.
- Mỗi tác vụ chuyển qua `queued → running → terminal` (succeeded, failed, timed_out, cancelled hoặc lost).
- Tác vụ cron vẫn hoạt động khi runtime cron còn sở hữu công việc; nếu trạng thái runtime trong bộ nhớ đã mất, quy trình bảo trì tác vụ trước tiên kiểm tra lịch sử lượt chạy cron bền vững rồi mới đánh dấu tác vụ là lost.
- Quá trình hoàn tất được thúc đẩy bằng cơ chế đẩy: công việc tách biệt có thể thông báo trực tiếp hoặc đánh thức phiên/heartbeat của bên yêu cầu khi hoàn tất, vì vậy vòng lặp thăm dò trạng thái thường không phù hợp.
- Các lượt chạy cron cô lập và lần hoàn tất của subagent sẽ cố gắng dọn dẹp các tab/tiến trình trình duyệt được theo dõi cho phiên con trước khi thực hiện bước ghi sổ dọn dẹp cuối cùng.
- Quá trình phân phối cron cô lập sẽ chặn các phản hồi tạm thời đã lỗi thời từ agent cha khi công việc của subagent hậu duệ vẫn đang hoàn tất, đồng thời ưu tiên đầu ra cuối cùng của hậu duệ nếu đầu ra đó đến trước khi phân phối.
- Thông báo hoàn tất được phân phối trực tiếp đến một kênh hoặc đưa vào hàng đợi cho heartbeat tiếp theo.
- `openclaw tasks list` hiển thị tất cả tác vụ; `openclaw tasks audit` nêu bật các vấn đề.
- Bản ghi kết thúc được lưu trong 7 ngày (bản ghi `lost` trong 24 giờ), sau đó tự động bị xóa bớt.

## Bắt đầu nhanh

<Tabs>
  <Tab title="Liệt kê và lọc">
    ```bash
    # Liệt kê tất cả tác vụ (mới nhất trước)
    openclaw tasks list

    # Lọc theo runtime hoặc trạng thái
    openclaw tasks list --runtime acp
    openclaw tasks list --status running
    ```

  </Tab>
  <Tab title="Kiểm tra">
    ```bash
    # Hiển thị chi tiết của một tác vụ cụ thể (theo ID tác vụ, ID lượt chạy hoặc khóa phiên)
    openclaw tasks show <lookup>
    ```
  </Tab>
  <Tab title="Hủy và thông báo">
    ```bash
    # Hủy một tác vụ đang chạy (kết thúc phiên con)
    openclaw tasks cancel <lookup>

    # Thay đổi chính sách thông báo cho một tác vụ
    openclaw tasks notify <lookup> state_changes
    ```

  </Tab>
  <Tab title="Kiểm tra và bảo trì">
    ```bash
    # Chạy kiểm tra tình trạng
    openclaw tasks audit

    # Xem trước hoặc áp dụng bảo trì
    openclaw tasks maintenance
    openclaw tasks maintenance --apply
    ```

  </Tab>
  <Tab title="Luồng tác vụ">
    ```bash
    # Kiểm tra trạng thái TaskFlow
    openclaw tasks flow list
    openclaw tasks flow show <lookup>
    openclaw tasks flow cancel <lookup>
    ```
  </Tab>
</Tabs>

## Những gì tạo ra tác vụ

| Nguồn                  | Loại runtime | Thời điểm bản ghi tác vụ được tạo                                      | Chính sách thông báo mặc định |
| ---------------------- | ------------ | ---------------------------------------------------------------------- | ----------------------------- |
| Lượt chạy nền ACP      | `acp`        | Khởi tạo một phiên ACP con                                             | `done_only`           |
| Điều phối subagent     | `subagent`   | Khởi tạo subagent qua `sessions_spawn`                                 | `done_only`           |
| Công việc cron (mọi loại) | `cron`       | Mỗi lần thực thi cron (phiên chính và cô lập)                           | `silent`              |
| Thao tác CLI           | `cli`        | Các lệnh `openclaw agent` chạy qua Gateway                             | `silent`              |
| Công việc phương tiện của agent | `cli`        | Các lượt chạy `image_generate`/`music_generate`/`video_generate` dựa trên phiên | `silent`              |

<AccordionGroup>
  <Accordion title="Giá trị mặc định thông báo cho cron và phương tiện">
    Tác vụ cron (phiên chính và cô lập) sử dụng chính sách thông báo `silent` - chúng tạo bản ghi để theo dõi nhưng không tự tạo thông báo tác vụ; cron sở hữu đường dẫn phân phối của mình.

    Các lượt chạy `image_generate`, `music_generate` và `video_generate` dựa trên phiên cũng sử dụng chính sách thông báo `silent`. Chúng vẫn tạo bản ghi tác vụ, nhưng quá trình hoàn tất được trả về phiên agent ban đầu dưới dạng một lượt đánh thức nội bộ để agent có thể viết thông báo tiếp theo và tự đính kèm phương tiện đã hoàn tất. Agent yêu cầu tuân theo hợp đồng phản hồi hiển thị thông thường: tự động gửi phản hồi cuối cùng khi được cấu hình, hoặc `message(action="send")` cùng `NO_REPLY` khi phiên yêu cầu phản hồi bằng công cụ nhắn tin. Nếu phiên yêu cầu không còn hoạt động hoặc lượt đánh thức chủ động của phiên thất bại, đồng thời agent hoàn tất bỏ sót một phần hoặc toàn bộ phương tiện đã tạo, OpenClaw sẽ gửi một phương án dự phòng trực tiếp, có tính lũy đẳng và chỉ chứa phương tiện còn thiếu đến đích kênh ban đầu.

  </Accordion>
  <Accordion title="Biện pháp bảo vệ khi tạo phương tiện đồng thời">
    Khi một tác vụ tạo phương tiện dựa trên phiên vẫn đang hoạt động, `image_generate`, `music_generate` và `video_generate` ngăn việc thử lại ngoài ý muốn: lặp lại lời gọi với cùng lời nhắc/yêu cầu sẽ trả về trạng thái tác vụ đang hoạt động tương ứng thay vì khởi chạy một bản trùng lặp, trong khi một lời nhắc khác biệt có thể khởi chạy tác vụ riêng. Sử dụng `action: "status"` khi bạn muốn tra cứu rõ ràng tiến trình/trạng thái từ phía agent.
  </Accordion>
  <Accordion title="Những gì không tạo tác vụ">
    - Các lượt heartbeat - phiên chính; xem [Heartbeat](/vi/gateway/heartbeat)
    - Các lượt trò chuyện tương tác thông thường
    - Các phản hồi `/command` trực tiếp

  </Accordion>
</AccordionGroup>

## Vòng đời tác vụ

```mermaid
stateDiagram-v2
    [*] --> queued
    queued --> running : agent bắt đầu
    running --> succeeded : hoàn tất thành công
    running --> failed : lỗi
    running --> timed_out : vượt quá thời gian chờ
    queued --> cancelled : người vận hành hủy
    running --> cancelled : người vận hành hủy
    queued --> lost : mất trạng thái nền > 5 phút
    running --> lost : mất trạng thái nền > 5 phút
```

| Trạng thái  | Ý nghĩa                                                                     |
| ----------- | --------------------------------------------------------------------------- |
| `queued`    | Đã tạo, đang chờ agent bắt đầu                                              |
| `running`   | Lượt agent đang tích cực thực thi                                           |
| `succeeded` | Đã hoàn tất thành công                                                      |
| `failed`    | Đã hoàn tất với lỗi                                                         |
| `timed_out` | Đã vượt quá thời gian chờ được cấu hình                                     |
| `cancelled` | Bị người vận hành dừng qua `openclaw tasks cancel`, hoặc lượt chạy đã bị hủy bỏ |
| `lost`      | Runtime mất trạng thái nền có thẩm quyền sau khoảng ân hạn 5 phút           |

Các bước chuyển diễn ra tự động - sự kiện vòng đời lượt chạy agent (bắt đầu, kết thúc, lỗi) cập nhật trạng thái tác vụ; bạn không quản lý thủ công.

Quá trình hoàn tất lượt chạy agent là nguồn có thẩm quyền cho các bản ghi tác vụ đang hoạt động. Một lượt chạy tách biệt thành công kết thúc ở trạng thái `succeeded`, lỗi lượt chạy thông thường kết thúc ở trạng thái `failed`, hết thời gian chờ kết thúc ở trạng thái `timed_out`, còn kết quả hủy/dừng kết thúc ở trạng thái `cancelled`. Sau khi tác vụ đã kết thúc, các tín hiệu vòng đời sau đó không hạ cấp trạng thái của tác vụ - tác vụ bị người vận hành hủy hoặc đã ở trạng thái `failed`/`timed_out`/`lost` vẫn giữ nguyên như vậy ngay cả khi tín hiệu thành công đến sau đó.

`lost` nhận biết runtime:

- Tác vụ ACP: chỉ một lượt ACP đang hoạt động trong tiến trình của Gateway mới chứng minh lượt chạy còn sống; chỉ siêu dữ liệu phiên được lưu bền vững thì không đủ. Hoạt động kiểm tra CLI ngoại tuyến giữ nguyên tính thận trọng và không bao giờ thu hồi tác vụ ACP.
- Tác vụ subagent: phiên con nền đã biến mất khỏi kho agent đích (hoặc mang dấu mốc khôi phục sau khi khởi động lại).
- Tác vụ cron: runtime cron không còn theo dõi công việc là đang hoạt động và lịch sử lượt chạy cron bền vững không hiển thị kết quả kết thúc cho lượt chạy đó. Hoạt động kiểm tra CLI ngoại tuyến không coi trạng thái runtime cron trống trong chính tiến trình của nó là nguồn có thẩm quyền.
- Tác vụ CLI: tác vụ có ID lượt chạy/ID nguồn sử dụng ngữ cảnh lượt chạy trực tiếp, vì vậy các hàng phiên con hoặc phiên trò chuyện còn sót lại không giữ cho chúng hoạt động sau khi lượt chạy do Gateway sở hữu biến mất. Tác vụ CLI cũ không có danh tính lượt chạy vẫn dùng phiên con làm phương án dự phòng. Các lượt chạy `openclaw agent` dựa trên Gateway cũng kết thúc theo kết quả lượt chạy, vì vậy lượt chạy đã hoàn tất không nằm ở trạng thái hoạt động cho đến khi trình quét đánh dấu chúng là `lost`.

## Phân phối và thông báo

Khi một tác vụ đạt trạng thái kết thúc, OpenClaw sẽ thông báo cho bạn. Có hai đường dẫn phân phối:

**Phân phối trực tiếp** - nếu tác vụ có đích kênh (`requesterOrigin`), thông báo hoàn tất sẽ đi thẳng đến kênh đó (Discord, Slack, Telegram, v.v.). Thay vào đó, quá trình hoàn tất tác vụ nhóm và kênh được định tuyến qua phiên yêu cầu để agent cha có thể viết phản hồi hiển thị. Đối với quá trình hoàn tất của subagent, OpenClaw cũng giữ nguyên định tuyến luồng/chủ đề đã liên kết khi có và có thể điền `to` / tài khoản còn thiếu từ tuyến đã lưu của phiên yêu cầu (`lastChannel` / `lastTo` / `lastAccountId`) trước khi từ bỏ phân phối trực tiếp.

**Phân phối qua hàng đợi phiên** - nếu phân phối trực tiếp thất bại hoặc không đặt nguồn gốc, bản cập nhật sẽ được đưa vào hàng đợi dưới dạng sự kiện hệ thống trong phiên của bên yêu cầu và xuất hiện vào heartbeat tiếp theo.

<Tip>
Quá trình hoàn tất tác vụ qua hàng đợi phiên kích hoạt ngay một lượt đánh thức heartbeat, vì vậy bạn sẽ nhanh chóng thấy kết quả - không cần chờ nhịp heartbeat được lập lịch tiếp theo.
</Tip>

Điều đó có nghĩa quy trình làm việc thông thường dựa trên cơ chế đẩy: khởi chạy công việc tách biệt một lần, sau đó để runtime đánh thức hoặc thông báo cho bạn khi hoàn tất. Chỉ thăm dò trạng thái tác vụ khi cần gỡ lỗi, can thiệp hoặc kiểm tra rõ ràng.

### Chính sách thông báo

Kiểm soát lượng thông tin bạn nhận được về từng tác vụ:

| Chính sách            | Nội dung được phân phối                                  |
| --------------------- | -------------------------------------------------------- |
| `done_only` (mặc định) | Chỉ trạng thái kết thúc (succeeded, failed, v.v.)         |
| `state_changes`       | Mọi bước chuyển trạng thái và cập nhật tiến trình         |
| `silent`              | Hoàn toàn không có gì (mặc định cho tác vụ cron, CLI và phương tiện) |

Thay đổi chính sách khi tác vụ đang chạy:

```bash
openclaw tasks notify <lookup> state_changes
```

## Tham chiếu CLI

<AccordionGroup>
  <Accordion title="tasks list">
    ```bash
    openclaw tasks list [--runtime <acp|subagent|cron|cli>] [--status <status>] [--json]
    ```

    Các cột đầu ra: Tác vụ, Loại, Trạng thái, Phân phối, Lượt chạy, Phiên con, Tóm tắt. `openclaw tasks` đơn lẻ hoạt động như `openclaw tasks list`.

  </Accordion>
  <Accordion title="tasks show">
    ```bash
    openclaw tasks show <lookup> [--json]
    ```

    Mã tra cứu chấp nhận ID tác vụ, ID lượt chạy hoặc khóa phiên. Hiển thị toàn bộ bản ghi, bao gồm thời gian, trạng thái phân phối, lỗi và bản tóm tắt kết thúc.

  </Accordion>
  <Accordion title="tasks cancel">
    ```bash
    openclaw tasks cancel <lookup>
    ```

    Đối với các tác vụ ACP và subagent, thao tác này sẽ kết thúc phiên con; yêu cầu hủy ACP và cron được định tuyến qua Gateway đang chạy (`tasks.cancel`). Đối với các tác vụ được CLI theo dõi, yêu cầu hủy được ghi lại trong sổ đăng ký tác vụ (không có handle runtime con riêng). Trạng thái chuyển thành `cancelled` và thông báo phân phối được gửi khi thích hợp.

  </Accordion>
  <Accordion title="thông báo tác vụ">
    ```bash
    openclaw tasks notify <lookup> <done_only|state_changes|silent>
    ```
  </Accordion>
  <Accordion title="kiểm tra tác vụ">
    ```bash
    openclaw tasks audit [--severity <warn|error>] [--code <name>] [--limit <n>] [--json]
    ```

    Hiển thị các sự cố vận hành của cả tác vụ **và** TaskFlow trong một báo cáo. Các phát hiện cũng xuất hiện trong `openclaw status` khi phát hiện sự cố.

    Phát hiện về tác vụ:

    | Phát hiện                   | Mức độ nghiêm trọng   | Điều kiện kích hoạt                                                                                                      |
    | ------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------ |
    | `stale_queued`            | cảnh báo       | Đã xếp hàng hơn 10 phút                                                                              |
    | `stale_running`           | lỗi      | Đã chạy hơn 30 phút                                                                             |
    | `lost`                    | cảnh báo/lỗi | Quyền sở hữu tác vụ do runtime hỗ trợ đã biến mất; các tác vụ bị mất còn được giữ lại sẽ cảnh báo cho đến `cleanupAfter`, sau đó trở thành lỗi |
    | `delivery_failed`         | cảnh báo       | Phân phối thất bại và chính sách thông báo không phải là `silent`                                                            |
    | `missing_cleanup`         | cảnh báo       | Tác vụ kết thúc không có dấu thời gian dọn dẹp                                                                      |
    | `inconsistent_timestamps` | cảnh báo       | Vi phạm dòng thời gian (ví dụ: kết thúc trước khi bắt đầu)                                                        |

    Phát hiện về TaskFlow:

    | Phát hiện                | Mức độ nghiêm trọng   | Điều kiện kích hoạt                                                                    |
    | ---------------------- | ---------- | --------------------------------------------------------------------------- |
    | `restore_failed`       | lỗi      | Khôi phục sổ đăng ký luồng từ SQLite thất bại                                    |
    | `stale_running`        | lỗi      | Luồng đang chạy không tiến triển trong hơn 30 phút                      |
    | `stale_waiting`        | cảnh báo       | Luồng đang chờ không tiến triển trong hơn 30 phút                      |
    | `stale_blocked`        | cảnh báo       | Luồng bị chặn không tiến triển trong hơn 30 phút                      |
    | `cancel_stuck`         | cảnh báo       | Đã yêu cầu hủy hơn 5 phút trước, không có tác vụ con đang hoạt động, nhưng vẫn chưa kết thúc |
    | `missing_linked_tasks` | cảnh báo/lỗi | Luồng được quản lý đã cũ, không có tác vụ được liên kết hoặc trạng thái chờ                       |
    | `blocked_task_missing` | cảnh báo       | Luồng bị chặn trỏ đến một mã tác vụ không còn tồn tại                      |

  </Accordion>
  <Accordion title="bảo trì tác vụ">
    ```bash
    openclaw tasks maintenance [--json]
    openclaw tasks maintenance --apply [--json]
    ```

    Dùng lệnh này để xem trước hoặc áp dụng việc đối soát, đóng dấu dọn dẹp và loại bỏ đối với tác vụ, trạng thái TaskFlow và các hàng sổ đăng ký phiên chạy cron đã cũ.

    Việc đối soát có nhận biết runtime:

    - Các tác vụ ACP yêu cầu một lượt xử lý trong tiến trình đang hoạt động trong Gateway; các tác vụ subagent kiểm tra phiên con hỗ trợ chúng.
    - Các tác vụ subagent có phiên con chứa dấu mốc khôi phục sau khi khởi động lại sẽ được đánh dấu là bị mất thay vì được coi là các phiên hỗ trợ có thể khôi phục.
    - Các tác vụ Cron kiểm tra xem runtime cron có còn sở hữu công việc hay không, sau đó khôi phục trạng thái kết thúc từ nhật ký chạy cron/trạng thái công việc đã lưu trước khi chuyển sang `lost`. Chỉ tiến trình Gateway mới có thẩm quyền đối với tập hợp công việc cron đang hoạt động trong bộ nhớ; việc kiểm tra CLI ngoại tuyến sử dụng lịch sử bền vững nhưng không đánh dấu tác vụ cron là bị mất chỉ vì tập hợp cục bộ đó trống.
    - Các tác vụ CLI có danh tính lượt chạy sẽ kiểm tra ngữ cảnh lượt chạy đang hoạt động sở hữu chúng, không chỉ các hàng phiên con hoặc phiên trò chuyện.

    Việc dọn dẹp khi hoàn tất cũng có nhận biết runtime:

    - Khi subagent hoàn tất, hệ thống cố gắng hết sức đóng các tab/tiến trình trình duyệt được theo dõi cho phiên con trước khi tiếp tục dọn dẹp thông báo.
    - Khi cron cô lập hoàn tất, hệ thống cố gắng hết sức đóng các tab/tiến trình trình duyệt được theo dõi cho phiên cron trước khi lượt chạy được tháo dỡ hoàn toàn.
    - Việc phân phối cron cô lập chờ tác vụ theo sau của subagent hậu duệ hoàn tất khi cần và chặn văn bản xác nhận cũ của tác vụ cha thay vì thông báo văn bản đó.
    - Việc phân phối khi subagent hoàn tất chỉ sử dụng văn bản trợ lý hiển thị mới nhất của phiên con. Đầu ra tool/toolResult không được nâng thành văn bản kết quả của phiên con. Các lượt chạy kết thúc với lỗi sẽ thông báo trạng thái thất bại mà không phát lại văn bản trả lời đã ghi lại.
    - Lỗi dọn dẹp không che khuất kết quả thực tế của tác vụ.

    Khi áp dụng bảo trì, OpenClaw cũng xóa các hàng sổ đăng ký phiên `cron:<jobId>:run:<runId>` đã cũ hơn 7 ngày, đồng thời giữ lại các hàng của công việc cron hiện đang chạy và không thay đổi các hàng phiên không phải cron.

  </Accordion>
  <Accordion title="liệt kê | hiển thị | hủy luồng tác vụ">
    ```bash
    openclaw tasks flow list [--status <status>] [--json]
    openclaw tasks flow show <lookup> [--json]
    openclaw tasks flow cancel <lookup>
    ```

    Token tra cứu luồng chấp nhận mã luồng hoặc khóa chủ sở hữu. Hãy dùng các lệnh này khi [Luồng tác vụ](/vi/automation/taskflow) điều phối mới là đối tượng bạn quan tâm thay vì một bản ghi tác vụ nền riêng lẻ.

  </Accordion>
</AccordionGroup>

## Bảng tác vụ trò chuyện (`/tasks`)

Dùng `/tasks` trong bất kỳ phiên trò chuyện nào để xem các tác vụ nền được liên kết với phiên đó. Bảng hiển thị tối đa năm tác vụ đang hoạt động và vừa hoàn tất, cùng với runtime, trạng thái, thời gian và chi tiết tiến độ hoặc lỗi.

Khi phiên hiện tại không có tác vụ được liên kết nào có thể nhìn thấy, `/tasks` sẽ chuyển sang số lượng tác vụ cục bộ của tác nhân để vẫn cung cấp thông tin tổng quan mà không làm lộ chi tiết của các phiên khác.

Để xem sổ cái đầy đủ dành cho người vận hành, hãy dùng CLI: `openclaw tasks list`.

### Giao diện điều khiển

Giao diện điều khiển web có trang **Tác vụ** trong thanh bên, hiển thị trực tiếp các tác vụ nền đang hoạt động và gần đây. Dùng trang này để kiểm tra tiến độ, mở các phiên được liên kết, làm mới sổ cái hoặc hủy các tác vụ đang xếp hàng và đang chạy.

Các ngăn trò chuyện cũng có một thanh **Tác vụ nền** có thể thu gọn, giới hạn theo tác nhân của ngăn: các tác vụ và subagent đang chạy kèm nút dừng, một phần đã hoàn tất và các liên kết Xem bản ghi vào phiên con của từng tác vụ. Mở thanh này từ nút chuyển hoạt động trong tiêu đề ngăn (hoặc nút hoạt động nổi trong trò chuyện một ngăn).

Chọn một tác vụ trong thanh để kiểm tra lời nhắc đầu vào có giới hạn và đầu ra hoặc bản tóm tắt lỗi mới nhất. Công việc đang chạy được tách biệt khỏi công việc đã hoàn tất và các hàng đã hoàn tất cho biết tác vụ đã hoàn thành hay thất bại. Trên iOS, mở **Chat actions → Background Tasks**; trên Android, mở menu mục bổ sung của Chat và chọn **Background tasks**. Cả hai chế độ xem trên thiết bị di động đều sử dụng cùng cách nhóm Running và Finished, đồng thời mở chi tiết tác vụ khi được chọn.

## Tích hợp trạng thái (áp lực tác vụ)

`openclaw status` bao gồm một dòng tác vụ để xem nhanh:

```
Tác vụ    2 đang hoạt động · 1 đang xếp hàng · 1 đang chạy · 1 sự cố · kiểm tra sạch · 6 được theo dõi
```

Bản tóm tắt đếm công việc đang hoạt động (`queued` + `running`), các lỗi (`failed` + `timed_out` + `lost`), các phát hiện kiểm tra và tổng số bản ghi được theo dõi; tải trọng JSON cũng phân chia số lượng theo runtime (`acp`, `subagent`, `cron`, `cli`).

Cả `/status` và công cụ `session_status` đều sử dụng ảnh chụp nhanh tác vụ có nhận biết việc dọn dẹp: ưu tiên các tác vụ đang hoạt động, ẩn các hàng đã hết hạn và chỉ hiển thị các tác vụ đã kết thúc trong một khoảng thời gian ngắn gần đây (5 phút), đồng thời tập trung vào lỗi khi không còn công việc đang hoạt động. Điều này giúp thẻ trạng thái tập trung vào những gì quan trọng ngay lúc này.

## Lưu trữ và bảo trì

### Nơi lưu trữ tác vụ

Các bản ghi tác vụ và trạng thái phân phối được lưu bền vững trong cơ sở dữ liệu trạng thái SQLite dùng chung của OpenClaw:

```
~/.openclaw/state/openclaw.sqlite   (các bảng: task_runs, task_delivery_state, flow_runs)
```

Đặt `OPENCLAW_STATE_DIR` để chuyển toàn bộ thư mục gốc trạng thái (mặc định `~/.openclaw`) sang nơi khác; đường dẫn cơ sở dữ liệu dùng chung cũng di chuyển theo.

Sổ đăng ký được tải vào bộ nhớ khi sử dụng lần đầu và lưu bền vững mọi lần ghi trở lại SQLite, vì vậy các bản ghi vẫn tồn tại sau khi gateway khởi động lại. Mức tăng trưởng WAL được giới hạn nhờ ngưỡng điểm kiểm tra tự động mặc định của SQLite cùng các điểm kiểm tra `PASSIVE` định kỳ; các điểm kiểm tra khi tắt và bảo trì rõ ràng sử dụng `TRUNCATE` để các lần đóng thông thường thu hồi không gian WAL mà không khiến trình quét nền phải chờ các trình đọc đang hoạt động.

Các kho sidecar cũ từ những bản cài đặt trước đây (`tasks/runs.sqlite`, `flows/registry.sqlite`) được `openclaw doctor` nhập vào cơ sở dữ liệu dùng chung.

### Bảo trì tự động

Một trình quét chạy mỗi **60 giây** (lượt đầu tiên khoảng 5 giây sau khi gateway khởi động) và xử lý bốn việc:

<Steps>
  <Step title="Đối soát">
    Kiểm tra xem các tác vụ đang hoạt động còn có runtime có thẩm quyền hỗ trợ hay không. Các tác vụ ACP yêu cầu một lượt xử lý trong tiến trình đang hoạt động, các tác vụ subagent sử dụng trạng thái phiên con, các tác vụ cron sử dụng quyền sở hữu công việc đang hoạt động cùng lịch sử lượt chạy bền vững và các tác vụ CLI có danh tính lượt chạy sử dụng ngữ cảnh lượt chạy sở hữu chúng. Nếu trạng thái hỗ trợ đã biến mất hơn 5 phút (30 phút đối với các tác vụ subagent gốc không có tiến trình con), tác vụ sẽ được đánh dấu là `lost`.
  </Step>
  <Step title="Sửa chữa phiên ACP">
    Đóng các phiên ACP dùng một lần do phiên cha sở hữu đã kết thúc hoặc mồ côi, đồng thời chỉ đóng các phiên ACP bền vững đã cũ, đã kết thúc hoặc mồ côi khi không còn liên kết cuộc hội thoại đang hoạt động.
  </Step>
  <Step title="Đóng dấu dọn dẹp">
    Đặt dấu thời gian `cleanupAfter` trên các tác vụ đã kết thúc (thời điểm kết thúc + khoảng thời gian lưu giữ). Trong thời gian lưu giữ, các tác vụ bị mất vẫn xuất hiện trong báo cáo kiểm tra dưới dạng cảnh báo; sau khi `cleanupAfter` hết hạn hoặc khi thiếu siêu dữ liệu dọn dẹp, chúng trở thành lỗi.
  </Step>
  <Step title="Loại bỏ">
    Xóa các bản ghi đã quá ngày `cleanupAfter`.
  </Step>
</Steps>

<Note>
**Lưu giữ:** các bản ghi tác vụ đã kết thúc được giữ trong **7 ngày** (các bản ghi `lost` trong **24 giờ**), sau đó tự động bị loại bỏ. Không cần cấu hình.
</Note>

## Mối quan hệ giữa tác vụ và các hệ thống khác

<AccordionGroup>
  <Accordion title="Tác vụ và Luồng tác vụ">
    [Luồng tác vụ](/vi/automation/taskflow) là lớp điều phối luồng phía trên các tác vụ nền. Một luồng có thể điều phối nhiều tác vụ trong suốt vòng đời bằng chế độ đồng bộ được quản lý hoặc phản chiếu. Dùng `openclaw tasks` để kiểm tra từng bản ghi tác vụ và `openclaw tasks flow` để kiểm tra luồng điều phối.

  </Accordion>
  <Accordion title="Tác vụ và cron">
    Các định nghĩa công việc Cron, trạng thái thực thi runtime và lịch sử lượt chạy nằm trong cơ sở dữ liệu trạng thái SQLite dùng chung của OpenClaw. **Mọi** lần thực thi cron đều tạo một bản ghi tác vụ — cả phiên chính lẫn phiên cô lập — với chính sách thông báo `silent`, vì vậy các lượt chạy cron được theo dõi mà không tự tạo thông báo tác vụ.

    Xem [Công việc Cron](/vi/automation/cron-jobs).

  </Accordion>
  <Accordion title="Tác vụ và Heartbeat">
    Các lượt chạy Heartbeat là các lượt xử lý của phiên chính — chúng không tạo bản ghi tác vụ. Khi một tác vụ hoàn tất, tác vụ đó có thể kích hoạt đánh thức Heartbeat để bạn thấy kết quả kịp thời.

    Xem [Heartbeat](/vi/gateway/heartbeat).

  </Accordion>
  <Accordion title="Tác vụ và phiên">
    Một tác vụ có thể tham chiếu đến một `childSessionKey` (nơi công việc chạy) và một `requesterSessionKey` (người khởi tạo tác vụ). `agentId` của tác vụ xác định tác nhân thực thi công việc, trong khi các trường người yêu cầu và chủ sở hữu lưu giữ ngữ cảnh khởi chạy và kiểm soát. Phiên là ngữ cảnh hội thoại; tác vụ dùng để theo dõi hoạt động trên ngữ cảnh đó.
  </Accordion>
  <Accordion title="Tác vụ và lượt chạy tác nhân">
    `runId` của một tác vụ liên kết đến lượt chạy tác nhân đang thực hiện công việc. Các sự kiện vòng đời của tác nhân (bắt đầu, kết thúc, lỗi) tự động cập nhật trạng thái tác vụ - bạn không cần quản lý vòng đời theo cách thủ công.
  </Accordion>
</AccordionGroup>

## Liên quan

- [Tự động hóa](/vi/automation) - tổng quan nhanh về tất cả cơ chế tự động hóa
- [CLI: Tác vụ](/vi/cli/tasks) - tài liệu tham khảo lệnh CLI
- [Heartbeat](/vi/gateway/heartbeat) - các lượt định kỳ của phiên chính
- [Tác vụ theo lịch](/vi/automation/cron-jobs) - lập lịch công việc nền
- [TaskFlow](/vi/automation/taskflow) - điều phối luồng ở tầng trên tác vụ
