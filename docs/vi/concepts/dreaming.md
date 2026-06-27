---
read_when:
    - Bạn muốn việc thăng cấp bộ nhớ chạy tự động
    - Bạn muốn hiểu mỗi giai đoạn Dreaming làm gì
    - Bạn muốn tinh chỉnh quá trình hợp nhất mà không làm nhiễu MEMORY.md
sidebarTitle: Dreaming
summary: Hợp nhất bộ nhớ nền với các pha nhẹ, sâu và REM cùng Dream Diary
title: Dreaming
x-i18n:
    generated_at: "2026-06-27T17:22:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 257e8095114e05f18e0ba7a6870765a6b88c80e1eedaccfa891faa231f68f01b
    source_path: concepts/dreaming.md
    workflow: 16
---

Dreaming là hệ thống hợp nhất bộ nhớ nền trong `memory-core`. Nó giúp OpenClaw chuyển các tín hiệu ngắn hạn mạnh vào bộ nhớ bền vững, đồng thời giữ cho quá trình có thể giải thích và xem xét được.

<Note>
Dreaming là tính năng **tùy chọn bật** và bị tắt theo mặc định.
</Note>

## Dreaming ghi gì

Dreaming giữ hai loại đầu ra:

- **Trạng thái máy** trong `memory/.dreams/` (kho truy hồi, tín hiệu giai đoạn, checkpoint nạp dữ liệu, khóa).
- **Đầu ra dễ đọc cho con người** trong `DREAMS.md` (hoặc `dreams.md` hiện có) và các tệp báo cáo giai đoạn tùy chọn dưới `memory/dreaming/<phase>/YYYY-MM-DD.md`.

Việc thăng hạng dài hạn vẫn chỉ ghi vào `MEMORY.md`.

## Mô hình giai đoạn

Dreaming dùng ba giai đoạn phối hợp:

| Giai đoạn | Mục đích                                      | Ghi bền vững      |
| --------- | --------------------------------------------- | ----------------- |
| Light     | Sắp xếp và chuẩn bị tài liệu ngắn hạn gần đây | Không             |
| Deep      | Chấm điểm và thăng hạng ứng viên bền vững     | Có (`MEMORY.md`)  |
| REM       | Suy ngẫm về chủ đề và ý tưởng lặp lại         | Không             |

Các giai đoạn này là chi tiết triển khai nội bộ, không phải các "chế độ" riêng do người dùng cấu hình.

<AccordionGroup>
  <Accordion title="Light phase">
    Giai đoạn Light nạp các tín hiệu bộ nhớ hằng ngày gần đây và dấu vết truy hồi, loại bỏ trùng lặp, rồi chuẩn bị các dòng ứng viên.

    - Đọc từ trạng thái truy hồi ngắn hạn, các tệp bộ nhớ hằng ngày gần đây, và bản ghi phiên đã được biên tập khi có.
    - Ghi một khối `## Light Sleep` được quản lý khi lưu trữ bao gồm đầu ra nội tuyến.
    - Ghi lại tín hiệu củng cố để xếp hạng Deep về sau.
    - Không bao giờ ghi vào `MEMORY.md`.

  </Accordion>
  <Accordion title="Deep phase">
    Giai đoạn Deep quyết định nội dung nào trở thành bộ nhớ dài hạn.

    - Xếp hạng ứng viên bằng chấm điểm có trọng số và các ngưỡng kiểm soát.
    - Yêu cầu `minScore`, `minRecallCount`, và `minUniqueQueries` đạt ngưỡng.
    - Tái tạo đoạn trích từ các tệp hằng ngày trực tiếp trước khi ghi, nên các đoạn trích cũ/đã xóa sẽ bị bỏ qua.
    - Thêm các mục được thăng hạng vào `MEMORY.md`.
    - Ghi tóm tắt `## Deep Sleep` vào `DREAMS.md` và tùy chọn ghi `memory/dreaming/deep/YYYY-MM-DD.md`.

  </Accordion>
  <Accordion title="REM phase">
    Giai đoạn REM trích xuất các mẫu và tín hiệu phản tư.

    - Xây dựng tóm tắt chủ đề và suy ngẫm từ các dấu vết ngắn hạn gần đây.
    - Ghi một khối `## REM Sleep` được quản lý khi lưu trữ bao gồm đầu ra nội tuyến.
    - Ghi lại tín hiệu củng cố REM được xếp hạng Deep sử dụng.
    - Không bao giờ ghi vào `MEMORY.md`.

  </Accordion>
</AccordionGroup>

## Nạp bản ghi phiên

Dreaming có thể nạp bản ghi phiên đã được biên tập vào kho Dreaming. Khi có bản ghi, chúng được đưa vào giai đoạn Light cùng với tín hiệu bộ nhớ hằng ngày và dấu vết truy hồi. Nội dung cá nhân và nhạy cảm được biên tập trước khi nạp.

## Nhật ký Dream

Dreaming cũng duy trì một **Nhật ký Dream** dạng tường thuật trong `DREAMS.md`. Sau khi mỗi giai đoạn có đủ tài liệu, `memory-core` chạy một lượt subagent nền theo cơ chế cố gắng tối đa và thêm một mục nhật ký ngắn. Nó dùng mô hình runtime mặc định trừ khi `dreaming.model` được cấu hình. Nếu mô hình đã cấu hình không khả dụng, Nhật ký Dream thử lại một lần bằng mô hình mặc định của phiên.

<Note>
Nhật ký này dành cho con người đọc trong giao diện Dreams, không phải nguồn thăng hạng. Các tạo tác nhật ký/báo cáo do Dreaming tạo được loại trừ khỏi thăng hạng ngắn hạn. Chỉ các đoạn bộ nhớ có căn cứ mới đủ điều kiện thăng hạng vào `MEMORY.md`.
</Note>

Cũng có một luồng điền bù lịch sử có căn cứ cho công việc xem xét và khôi phục:

<AccordionGroup>
  <Accordion title="Backfill commands">
    - `memory rem-harness --path ... --grounded` xem trước đầu ra nhật ký có căn cứ từ ghi chú lịch sử `YYYY-MM-DD.md`.
    - `memory rem-backfill --path ...` ghi các mục nhật ký có căn cứ có thể đảo ngược vào `DREAMS.md`.
    - `memory rem-backfill --path ... --stage-short-term` chuẩn bị các ứng viên bền vững có căn cứ vào cùng kho bằng chứng ngắn hạn mà giai đoạn Deep thông thường đã dùng.
    - `memory rem-backfill --rollback` và `--rollback-short-term` xóa các tạo tác điền bù đã chuẩn bị đó mà không chạm vào mục nhật ký thông thường hoặc truy hồi ngắn hạn trực tiếp.

  </Accordion>
</AccordionGroup>

Control UI hiển thị cùng luồng điền bù/đặt lại nhật ký để bạn có thể kiểm tra kết quả trong cảnh Dreams trước khi quyết định liệu các ứng viên có căn cứ có xứng đáng được thăng hạng hay không. Scene cũng hiển thị một luồng có căn cứ riêng biệt để bạn có thể thấy mục ngắn hạn đã chuẩn bị nào đến từ phát lại lịch sử, mục đã thăng hạng nào được dẫn dắt bởi căn cứ, và chỉ xóa các mục đã chuẩn bị chỉ-có-căn-cứ mà không chạm vào trạng thái ngắn hạn trực tiếp thông thường.

## Tín hiệu xếp hạng Deep

Xếp hạng Deep dùng sáu tín hiệu cơ sở có trọng số cộng với củng cố theo giai đoạn:

| Tín hiệu             | Trọng số | Mô tả                                             |
| -------------------- | -------- | ------------------------------------------------- |
| Tần suất             | 0.24     | Số tín hiệu ngắn hạn mà mục đã tích lũy           |
| Mức liên quan        | 0.30     | Chất lượng truy xuất trung bình của mục           |
| Độ đa dạng truy vấn  | 0.15     | Các ngữ cảnh truy vấn/ngày riêng biệt đã làm nó xuất hiện |
| Độ mới               | 0.15     | Điểm độ mới giảm dần theo thời gian               |
| Hợp nhất             | 0.10     | Độ mạnh của sự lặp lại nhiều ngày                 |
| Độ phong phú khái niệm | 0.06   | Mật độ thẻ khái niệm từ đoạn trích/đường dẫn      |

Các lượt khớp ở giai đoạn Light và REM thêm một phần tăng nhỏ giảm dần theo độ mới từ `memory/.dreams/phase-signals.json`.

Kết quả thử nghiệm bóng có thể được xếp chồng lên điểm cơ sở đó như một tín hiệu xem xét trước bất kỳ lần ghi bền vững nào. Một thử nghiệm hữu ích cho ứng viên một mức tăng nhỏ có giới hạn, thử nghiệm trung lập giữ ứng viên ở trạng thái hoãn, và thử nghiệm có hại đánh dấu ứng viên là bị từ chối cho lượt chấm điểm đó. Tín hiệu này vẫn chỉ dành cho báo cáo: nó có thể thay đổi thứ tự ứng viên hoặc siêu dữ liệu xem xét, nhưng không ghi vào `MEMORY.md` hoặc tự thăng hạng ứng viên.

## Phạm vi báo cáo thử nghiệm bóng QA

QA Lab bao gồm một kịch bản chỉ-báo-cáo để khám phá cách một thử nghiệm bóng Dreaming trong tương lai có thể xem xét một bộ nhớ ứng viên trước khi thăng hạng. Kịch bản yêu cầu một agent so sánh câu trả lời cơ sở với câu trả lời có thể dùng bộ nhớ ứng viên, rồi ghi một báo cáo cục bộ với phán quyết, lý do, và cờ rủi ro.

Phạm vi này được cố ý giới hạn trong QA. Nó xác minh rằng tạo tác báo cáo vẫn tách biệt khỏi `MEMORY.md` và agent không tuyên bố ứng viên đã được thăng hạng. Nó không thêm hành vi thử nghiệm bóng production hoặc thay đổi bộ máy thăng hạng giai đoạn Deep.

Trình chạy thử nghiệm bóng của `memory-core` giữ cùng hợp đồng chỉ-báo-cáo đó cho các đường dẫn mã cần một tạo tác ổn định. Nó nhận ứng viên, prompt thử nghiệm, kết quả cơ sở, kết quả ứng viên, phán quyết, lý do, cờ rủi ro, và tham chiếu bằng chứng, rồi ghi một báo cáo với `promotion action: report-only`. Phán quyết hữu ích ánh xạ tới khuyến nghị `promote`, phán quyết trung lập ánh xạ tới `defer`, và phán quyết có hại ánh xạ tới `reject`; không khuyến nghị nào trong số đó ghi vào `MEMORY.md` hoặc áp dụng thăng hạng giai đoạn Deep.

## Lập lịch

Khi được bật, `memory-core` tự quản lý một công việc cron cho một lượt quét Dreaming đầy đủ. Mỗi lượt quét chạy các giai đoạn theo thứ tự: Light → REM → Deep.

Lượt quét bao gồm workspace runtime chính và mọi workspace agent đã cấu hình, được loại trùng theo đường dẫn, nên việc fan-out workspace của subagent không loại trừ `DREAMS.md` và trạng thái bộ nhớ của agent chính.

Hành vi nhịp mặc định:

| Cài đặt              | Mặc định      |
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

## Quy trình CLI

<Tabs>
  <Tab title="Promotion preview / apply">
    ```bash
    openclaw memory promote
    openclaw memory promote --apply
    openclaw memory promote --limit 5
    openclaw memory status --deep
    ```

    `memory promote` thủ công dùng các ngưỡng giai đoạn Deep theo mặc định trừ khi được ghi đè bằng cờ CLI.

  </Tab>
  <Tab title="Explain promotion">
    Giải thích vì sao một ứng viên cụ thể sẽ hoặc sẽ không được thăng hạng:

    ```bash
    openclaw memory promote-explain "router vlan"
    openclaw memory promote-explain "router vlan" --json
    ```

  </Tab>
  <Tab title="REM harness preview">
    Xem trước suy ngẫm REM, sự thật ứng viên, và đầu ra thăng hạng Deep mà không ghi gì:

    ```bash
    openclaw memory rem-harness
    openclaw memory rem-harness --json
    ```

  </Tab>
</Tabs>

## Mặc định chính

Tất cả cài đặt nằm dưới `plugins.entries.memory-core.config.dreaming`.

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
  Số token ước tính tối đa được giữ từ mỗi đoạn truy hồi ngắn hạn được thăng hạng vào `MEMORY.md`. Nguồn gốc xếp hạng vẫn hiển thị.
</ParamField>

<Warning>
`dreaming.model` yêu cầu `plugins.entries.memory-core.subagent.allowModelOverride: true`. Để hạn chế nó, cũng đặt `plugins.entries.memory-core.subagent.allowedModels`. Lỗi tin cậy hoặc danh sách cho phép vẫn hiển thị thay vì âm thầm fallback; lần thử lại chỉ bao phủ lỗi mô hình không khả dụng.
</Warning>

<Note>
Hầu hết chính sách giai đoạn, ngưỡng, và hành vi lưu trữ là chi tiết triển khai nội bộ. Xem [tham chiếu cấu hình Memory](/vi/reference/memory-config#dreaming) để có danh sách khóa đầy đủ.
</Note>

## Giao diện Dreams

Khi được bật, tab **Dreams** của Gateway hiển thị:

- trạng thái bật Dreaming hiện tại
- trạng thái cấp giai đoạn và sự hiện diện của lượt quét được quản lý
- số lượng ngắn hạn, có căn cứ, tín hiệu, và đã thăng hạng hôm nay
- thời điểm chạy đã lên lịch tiếp theo
- một luồng Scene có căn cứ riêng biệt cho các mục phát lại lịch sử đã chuẩn bị
- trình đọc Nhật ký Dream có thể mở rộng, được hỗ trợ bởi `doctor.memory.dreamDiary`

## Dreaming không bao giờ chạy: trạng thái hiển thị bị chặn

Nếu `openclaw memory status` báo cáo `Dreaming status: blocked`, cron được quản lý tồn tại nhưng Heartbeat của agent mặc định không kích hoạt. Kiểm tra rằng Heartbeat đã được bật cho agent mặc định và target của nó không phải là `none`, rồi chạy lại `openclaw memory status --deep` sau khoảng Heartbeat tiếp theo.

## Liên quan

- [Memory](/vi/concepts/memory)
- [CLI Memory](/vi/cli/memory)
- [Tham chiếu cấu hình Memory](/vi/reference/memory-config)
- [Tìm kiếm Memory](/vi/concepts/memory-search)
