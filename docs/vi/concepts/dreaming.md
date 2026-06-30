---
read_when:
    - Bạn muốn việc thăng hạng bộ nhớ chạy tự động
    - Bạn muốn hiểu từng giai đoạn Dreaming làm gì
    - Bạn muốn tinh chỉnh quá trình hợp nhất mà không làm bẩn MEMORY.md
sidebarTitle: Dreaming
summary: Hợp nhất bộ nhớ nền với các pha nhẹ, sâu và REM cùng Nhật ký giấc mơ
title: Dreaming
x-i18n:
    generated_at: "2026-06-30T14:10:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1b636df63cdc5b60758f9600af695b3b6453122a03b0cc6fdc69d3c9259d1e61
    source_path: concepts/dreaming.md
    workflow: 16
---

Dreaming là hệ thống hợp nhất bộ nhớ chạy nền trong `memory-core`. Nó giúp OpenClaw chuyển các tín hiệu ngắn hạn mạnh vào bộ nhớ bền vững, đồng thời giữ cho quy trình có thể giải thích và xem xét được.

<Note>
Dreaming là tính năng **chọn bật** và bị tắt theo mặc định.
</Note>

## Dreaming ghi những gì

Dreaming giữ hai loại đầu ra:

- **Trạng thái máy** trong `memory/.dreams/` (kho truy hồi, tín hiệu pha, điểm kiểm tra nhập dữ liệu, khóa).
- **Đầu ra cho người đọc** trong `DREAMS.md` (hoặc `dreams.md` hiện có) và các tệp báo cáo pha tùy chọn dưới `memory/dreaming/<phase>/YYYY-MM-DD.md`.

Việc thăng cấp dài hạn vẫn chỉ ghi vào `MEMORY.md`.

## Mô hình pha

Dreaming sử dụng ba pha phối hợp:

| Pha   | Mục đích                                      | Ghi bền vững     |
| ----- | --------------------------------------------- | ---------------- |
| Light | Sắp xếp và chuẩn bị tài liệu ngắn hạn gần đây | Không            |
| Deep  | Chấm điểm và thăng cấp ứng viên bền vững      | Có (`MEMORY.md`) |
| REM   | Suy ngẫm về chủ đề và ý tưởng lặp lại         | Không            |

Các pha này là chi tiết triển khai nội bộ, không phải các "chế độ" riêng do người dùng cấu hình.

<AccordionGroup>
  <Accordion title="Light phase">
    Pha Light nhập các tín hiệu bộ nhớ hằng ngày gần đây và dấu vết truy hồi, khử trùng lặp chúng, rồi chuẩn bị các dòng ứng viên.

    - Đọc từ trạng thái truy hồi ngắn hạn, các tệp bộ nhớ hằng ngày gần đây và bản ghi phiên đã được biên tập khi có.
    - Ghi một khối `## Light Sleep` được quản lý khi lưu trữ bao gồm đầu ra nội tuyến.
    - Ghi lại tín hiệu củng cố để xếp hạng Deep sau này.
    - Không bao giờ ghi vào `MEMORY.md`.

  </Accordion>
  <Accordion title="Deep phase">
    Pha Deep quyết định nội dung nào trở thành bộ nhớ dài hạn.

    - Xếp hạng ứng viên bằng điểm số có trọng số và các cổng ngưỡng.
    - Yêu cầu `minScore`, `minRecallCount` và `minUniqueQueries` phải đạt.
    - Tái tạo đoạn trích từ các tệp hằng ngày trực tiếp trước khi ghi, nên các đoạn trích cũ/đã xóa sẽ bị bỏ qua.
    - Thêm các mục đã thăng cấp vào `MEMORY.md`.
    - Ghi bản tóm tắt `## Deep Sleep` vào `DREAMS.md` và tùy chọn ghi `memory/dreaming/deep/YYYY-MM-DD.md`.

  </Accordion>
  <Accordion title="REM phase">
    Pha REM trích xuất mẫu và tín hiệu suy ngẫm.

    - Xây dựng tóm tắt chủ đề và suy ngẫm từ các dấu vết ngắn hạn gần đây.
    - Ghi một khối `## REM Sleep` được quản lý khi lưu trữ bao gồm đầu ra nội tuyến.
    - Ghi lại tín hiệu củng cố REM được dùng bởi xếp hạng Deep.
    - Không bao giờ ghi vào `MEMORY.md`.

  </Accordion>
</AccordionGroup>

## Nhập bản ghi phiên

Dreaming có thể nhập bản ghi phiên đã được biên tập vào tập dữ liệu Dreaming. Khi có bản ghi, chúng được đưa vào pha Light cùng với tín hiệu bộ nhớ hằng ngày và dấu vết truy hồi. Nội dung cá nhân và nhạy cảm được biên tập trước khi nhập.

## Nhật ký Dream

Dreaming cũng giữ một **Nhật ký Dream** dạng tường thuật trong `DREAMS.md`. Sau khi mỗi pha có đủ tài liệu, `memory-core` chạy một lượt subagent nền theo kiểu nỗ lực tối đa và thêm một mục nhật ký ngắn. Nó dùng mô hình runtime mặc định trừ khi `dreaming.model` được cấu hình. Nếu mô hình đã cấu hình không khả dụng, Nhật ký Dream thử lại một lần bằng mô hình mặc định của phiên.

<Note>
Nhật ký này dành cho người đọc trong giao diện Dreams, không phải nguồn thăng cấp. Các hiện vật nhật ký/báo cáo do Dreaming tạo bị loại khỏi thăng cấp ngắn hạn. Chỉ các đoạn trích bộ nhớ có căn cứ mới đủ điều kiện thăng cấp vào `MEMORY.md`.
</Note>

Cũng có một luồng điền bù lịch sử có căn cứ dành cho công việc xem xét và khôi phục:

<AccordionGroup>
  <Accordion title="Backfill commands">
    - `memory rem-harness --path ... --grounded` xem trước đầu ra nhật ký có căn cứ từ các ghi chú lịch sử `YYYY-MM-DD.md`.
    - `memory rem-backfill --path ...` ghi các mục nhật ký có căn cứ và có thể đảo ngược vào `DREAMS.md`.
    - `memory rem-backfill --path ... --stage-short-term` chuẩn bị các ứng viên bền vững có căn cứ vào cùng kho bằng chứng ngắn hạn mà pha Deep thông thường đã dùng.
    - `memory rem-backfill --rollback` và `--rollback-short-term` xóa các hiện vật điền bù đã chuẩn bị đó mà không chạm vào mục nhật ký thông thường hoặc truy hồi ngắn hạn trực tiếp.

  </Accordion>
</AccordionGroup>

Giao diện Control UI hiển thị cùng luồng điền bù/đặt lại nhật ký để bạn có thể kiểm tra kết quả trong cảnh Dreams trước khi quyết định liệu các ứng viên có căn cứ có xứng đáng được thăng cấp hay không. Scene cũng hiển thị một luồng có căn cứ riêng để bạn có thể thấy mục ngắn hạn đã chuẩn bị nào đến từ phát lại lịch sử, mục đã thăng cấp nào được dẫn dắt bởi căn cứ, và chỉ xóa các mục đã chuẩn bị chỉ có căn cứ mà không chạm vào trạng thái ngắn hạn trực tiếp thông thường.

## Tín hiệu xếp hạng Deep

Xếp hạng Deep dùng sáu tín hiệu cơ sở có trọng số cộng với củng cố pha:

| Tín hiệu             | Trọng số | Mô tả                                                |
| -------------------- | -------- | ---------------------------------------------------- |
| Tần suất             | 0.24     | Số lượng tín hiệu ngắn hạn mà mục đã tích lũy        |
| Mức liên quan        | 0.30     | Chất lượng truy xuất trung bình của mục              |
| Độ đa dạng truy vấn  | 0.15     | Các ngữ cảnh truy vấn/ngày riêng biệt đã làm nó hiện |
| Độ mới               | 0.15     | Điểm độ mới suy giảm theo thời gian                  |
| Hợp nhất             | 0.10     | Sức mạnh lặp lại qua nhiều ngày                      |
| Độ phong phú khái niệm | 0.06   | Mật độ thẻ khái niệm từ đoạn trích/đường dẫn         |

Các lượt khớp pha Light và REM thêm một mức tăng nhỏ suy giảm theo độ mới từ `memory/.dreams/phase-signals.json`.

Kết quả thử nghiệm bóng có thể được xếp chồng lên điểm cơ sở đó như một tín hiệu xem xét trước bất kỳ lần ghi bền vững nào. Một thử nghiệm hữu ích cho ứng viên mức tăng nhỏ có giới hạn, thử nghiệm trung lập giữ nó ở trạng thái hoãn, và thử nghiệm có hại đánh dấu nó là bị từ chối cho lượt chấm điểm đó. Tín hiệu này vẫn chỉ dành cho báo cáo: nó có thể thay đổi thứ tự ứng viên hoặc siêu dữ liệu xem xét, nhưng không ghi vào `MEMORY.md` hoặc tự thăng cấp ứng viên.

## Phạm vi báo cáo thử nghiệm bóng QA

QA Lab bao gồm một kịch bản chỉ báo cáo để khám phá cách một thử nghiệm bóng Dreaming trong tương lai có thể xem xét bộ nhớ ứng viên trước khi thăng cấp. Kịch bản yêu cầu một agent so sánh câu trả lời cơ sở với câu trả lời có thể dùng bộ nhớ ứng viên, rồi ghi một báo cáo cục bộ với phán quyết, lý do và cờ rủi ro.

Phạm vi này được cố ý giới hạn trong QA. Nó xác minh rằng hiện vật báo cáo vẫn tách biệt với `MEMORY.md` và agent không tuyên bố ứng viên đã được thăng cấp. Nó không thêm hành vi thử nghiệm bóng production hoặc thay đổi công cụ thăng cấp pha Deep.

Trình chạy thử nghiệm bóng của `memory-core` giữ cùng hợp đồng chỉ báo cáo đó cho các đường mã cần hiện vật ổn định. Nó nhận ứng viên, prompt thử nghiệm, kết quả cơ sở, kết quả ứng viên, phán quyết, lý do, cờ rủi ro và tham chiếu bằng chứng, rồi ghi báo cáo với `promotion action: report-only`. Phán quyết hữu ích ánh xạ tới khuyến nghị `promote`, phán quyết trung lập ánh xạ tới `defer`, và phán quyết có hại ánh xạ tới `reject`; không khuyến nghị nào trong số đó ghi vào `MEMORY.md` hoặc áp dụng thăng cấp pha Deep.

## Lập lịch

Khi được bật, `memory-core` tự quản lý một công việc cron cho một lượt quét Dreaming đầy đủ. Mỗi lượt quét chạy các pha theo thứ tự: Light → REM → Deep.

Lượt quét bao gồm workspace runtime chính và mọi workspace agent đã cấu hình, được khử trùng lặp theo đường dẫn, nên việc phân nhánh workspace subagent không loại trừ `DREAMS.md` và trạng thái bộ nhớ của agent chính.

Hành vi nhịp mặc định:

| Thiết lập            | Mặc định      |
| -------------------- | ------------- |
| `dreaming.frequency` | `0 3 * * *`   |
| `dreaming.model`     | mô hình mặc định |

## Bắt đầu nhanh

<Tabs>
  <Tab title="Enable dreaming">
    ```json
    {
      "plugins": {
        "entries": {
          "memory-core": {
            "config": {
              "dreaming": {
                "enabled": true
              }
            }
          }
        }
      }
    }
    ```
  </Tab>
  <Tab title="Custom sweep cadence">
    ```json
    {
      "plugins": {
        "entries": {
          "memory-core": {
            "config": {
              "dreaming": {
                "enabled": true,
                "timezone": "America/Los_Angeles",
                "frequency": "0 */6 * * *"
              }
            }
          }
        }
      }
    }
    ```
  </Tab>
</Tabs>

## Lệnh slash

```
/dreaming status
/dreaming on
/dreaming off
/dreaming help
```

`/dreaming on` và `/dreaming off` thay đổi cấu hình trên toàn Gateway. Người gọi từ kênh phải là chủ sở hữu, và client Gateway phải có `operator.admin`. `/dreaming status` và `/dreaming help` vẫn chỉ đọc.

## Quy trình CLI

<Tabs>
  <Tab title="Promotion preview / apply">
    ```bash
    openclaw memory promote
    openclaw memory promote --apply
    openclaw memory promote --limit 5
    openclaw memory status --deep
    ```

    `memory promote` thủ công dùng ngưỡng pha Deep theo mặc định trừ khi bị ghi đè bằng cờ CLI.

  </Tab>
  <Tab title="Explain promotion">
    Giải thích vì sao một ứng viên cụ thể sẽ hoặc sẽ không được thăng cấp:

    ```bash
    openclaw memory promote-explain "router vlan"
    openclaw memory promote-explain "router vlan" --json
    ```

  </Tab>
  <Tab title="REM harness preview">
    Xem trước các suy ngẫm REM, sự thật ứng viên và đầu ra thăng cấp Deep mà không ghi bất kỳ thứ gì:

    ```bash
    openclaw memory rem-harness
    openclaw memory rem-harness --json
    ```

  </Tab>
</Tabs>

## Mặc định chính

Tất cả thiết lập nằm dưới `plugins.entries.memory-core.config.dreaming`.

<ParamField path="enabled" type="boolean" default="false">
  Bật hoặc tắt lượt quét Dreaming.
</ParamField>
<ParamField path="frequency" type="string" default="0 3 * * *">
  Nhịp Cron cho lượt quét Dreaming đầy đủ.
</ParamField>
<ParamField path="model" type="string">
  Ghi đè mô hình subagent Nhật ký Dream tùy chọn. Dùng giá trị `provider/model` chuẩn khi cũng đặt danh sách cho phép `allowedModels` của subagent.
</ParamField>
<ParamField path="phases.deep.maxPromotedSnippetTokens" type="number" default="160">
  Số lượng token ước tính tối đa được giữ từ mỗi đoạn trích truy hồi ngắn hạn được thăng cấp vào `MEMORY.md`. Nguồn gốc xếp hạng vẫn hiển thị.
</ParamField>

<Warning>
`dreaming.model` yêu cầu `plugins.entries.memory-core.subagent.allowModelOverride: true`. Để giới hạn nó, cũng đặt `plugins.entries.memory-core.subagent.allowedModels`. Lỗi tin cậy hoặc danh sách cho phép vẫn hiển thị thay vì âm thầm fallback; lần thử lại chỉ bao phủ lỗi mô hình không khả dụng.
</Warning>

<Note>
Phần lớn chính sách pha, ngưỡng và hành vi lưu trữ là chi tiết triển khai nội bộ. Xem [tham chiếu cấu hình Memory](/vi/reference/memory-config#dreaming) để biết danh sách khóa đầy đủ.
</Note>

## Giao diện Dreams

Khi được bật, tab **Dreams** của Gateway hiển thị:

- trạng thái bật Dreaming hiện tại
- trạng thái cấp pha và sự hiện diện của lượt quét được quản lý
- số lượng ngắn hạn, có căn cứ, tín hiệu và đã thăng cấp hôm nay
- thời điểm chạy theo lịch tiếp theo
- một luồng Scene có căn cứ riêng cho các mục phát lại lịch sử đã chuẩn bị
- trình đọc Nhật ký Dream có thể mở rộng, được hỗ trợ bởi `doctor.memory.dreamDiary`

## Dreaming không bao giờ chạy: trạng thái hiển thị bị chặn

Nếu `openclaw memory status` báo cáo `Dreaming status: blocked`, cron được quản lý tồn tại nhưng heartbeat agent mặc định không kích hoạt. Kiểm tra rằng heartbeat được bật cho agent mặc định và đích của nó không phải `none`, rồi chạy lại `openclaw memory status --deep` sau khoảng heartbeat tiếp theo.

## Liên quan

- [Memory](/vi/concepts/memory)
- [CLI Memory](/vi/cli/memory)
- [Tham chiếu cấu hình Memory](/vi/reference/memory-config)
- [Tìm kiếm Memory](/vi/concepts/memory-search)
