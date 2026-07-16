---
read_when:
    - Bạn muốn quá trình thăng cấp bộ nhớ tự động chạy
    - Bạn muốn hiểu chức năng của từng giai đoạn Dreaming
    - Bạn muốn tinh chỉnh quá trình hợp nhất mà không làm lộn xộn MEMORY.md
sidebarTitle: Dreaming
summary: Hợp nhất bộ nhớ nền với các giai đoạn nhẹ, sâu và REM cùng Nhật ký Giấc mơ
title: Dreaming
x-i18n:
    generated_at: "2026-07-16T14:19:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 501ab42cfdfa0216c308896aa8c1719b06b49d64a62afdb004e097102a376eac
    source_path: concepts/dreaming.md
    workflow: 16
---

Dreaming là hệ thống hợp nhất bộ nhớ chạy nền trong `memory-core`. Hệ thống chuyển các tín hiệu ngắn hạn mạnh vào bộ nhớ bền vững, đồng thời giữ cho quy trình có thể giải thích và xem xét được.

<Note>
Dreaming là tính năng **tùy chọn tham gia** và bị tắt theo mặc định.
</Note>

## Nội dung Dreaming ghi

- **Trạng thái máy** trong `memory/.dreams/` (kho truy hồi, tín hiệu pha, điểm kiểm tra nhập dữ liệu, khóa).
- **Đầu ra dễ đọc** trong `DREAMS.md` (hoặc một `dreams.md` hiện có) và các tệp báo cáo pha tùy chọn trong `memory/dreaming/<phase>/YYYY-MM-DD.md`.

Quá trình thăng cấp dài hạn vẫn chỉ ghi vào `MEMORY.md`.

## Mô hình pha

Dreaming chạy ba pha phối hợp trong mỗi lượt quét, theo thứ tự: nhẹ -> REM -> sâu. Đây là các pha triển khai nội bộ, không phải các chế độ riêng biệt do người dùng cấu hình.

| Pha  | Mục đích                                      | Ghi bền vững      |
| ---- | --------------------------------------------- | ----------------- |
| Nhẹ  | Sắp xếp và chuẩn bị tài liệu ngắn hạn gần đây | Không             |
| REM  | Suy ngẫm về các chủ đề và ý tưởng lặp lại     | Không             |
| Sâu  | Chấm điểm và thăng cấp ứng viên bền vững      | Có (`MEMORY.md`) |

<AccordionGroup>
  <Accordion title="Pha nhẹ">
    - Đọc trạng thái truy hồi ngắn hạn gần đây, các tệp bộ nhớ hằng ngày và bản chép lời phiên đã được che thông tin khi có.
    - Loại bỏ tín hiệu trùng lặp và chuẩn bị các dòng ứng viên.
    - Ghi một khối `## Light Sleep` được quản lý khi bộ lưu trữ bao gồm đầu ra nội tuyến.
    - Ghi lại các tín hiệu củng cố để dùng cho việc xếp hạng sâu sau này.
    - Không bao giờ ghi vào `MEMORY.md`.

  </Accordion>
  <Accordion title="Pha REM">
    - Tạo bản tóm tắt chủ đề và suy ngẫm từ các dấu vết ngắn hạn gần đây.
    - Ghi một khối `## REM Sleep` được quản lý khi bộ lưu trữ bao gồm đầu ra nội tuyến.
    - Ghi lại các tín hiệu củng cố REM được dùng khi xếp hạng sâu.
    - Không bao giờ ghi vào `MEMORY.md`.

  </Accordion>
  <Accordion title="Pha sâu">
    - Xếp hạng ứng viên bằng phương pháp chấm điểm có trọng số và các ngưỡng kiểm soát (`minScore`, `minRecallCount`, `minUniqueQueries` đều phải đạt).
    - Khôi phục các đoạn trích từ tệp hằng ngày đang hoạt động trước khi ghi, vì vậy các đoạn trích cũ hoặc đã bị xóa sẽ được bỏ qua.
    - Nối thêm các mục đã thăng cấp vào `MEMORY.md`.
    - Ghi bản tóm tắt `## Deep Sleep` vào `DREAMS.md` và tùy chọn vào `memory/dreaming/deep/YYYY-MM-DD.md`.

  </Accordion>
</AccordionGroup>

## Nhập bản chép lời phiên

Dreaming có thể nhập các bản chép lời phiên đã được che thông tin vào tập dữ liệu Dreaming. Khi có, bản chép lời được đưa vào pha nhẹ cùng với các tín hiệu bộ nhớ hằng ngày và dấu vết truy hồi. Nội dung cá nhân và nhạy cảm được che trước khi nhập.

## Nhật ký giấc mơ

Dreaming duy trì một **Nhật ký giấc mơ** dạng tường thuật trong `DREAMS.md`. Sau khi mỗi pha có đủ dữ liệu, `memory-core` chạy một lượt subagent nền theo cơ chế nỗ lực tối đa và nối thêm một mục nhật ký ngắn, sử dụng mô hình runtime mặc định trừ khi `dreaming.model` được cấu hình. Nếu mô hình đã cấu hình không khả dụng, lượt chạy nhật ký sẽ thử lại một lần với mô hình mặc định của phiên; lỗi về độ tin cậy hoặc danh sách cho phép không được thử lại và vẫn hiển thị trong nhật ký hệ thống thay vì âm thầm chuyển sang một mục nhật ký chung.

<Note>
Nhật ký dành cho con người đọc trong giao diện Giấc mơ, không phải nguồn thăng cấp. Các thành phần nhật ký/báo cáo bị loại khỏi quá trình thăng cấp ngắn hạn; chỉ những đoạn bộ nhớ có căn cứ mới đủ điều kiện thăng cấp vào `MEMORY.md`.
</Note>

Ngoài ra còn có một luồng điền bù lịch sử có căn cứ dành cho công việc xem xét và khôi phục:

<AccordionGroup>
  <Accordion title="Lệnh điền bù">
    - `memory rem-harness --path ... --grounded` xem trước đầu ra nhật ký có căn cứ từ các ghi chú `YYYY-MM-DD.md` trong lịch sử.
    - `memory rem-backfill --path ...` ghi các mục nhật ký có căn cứ và có thể hoàn tác vào `DREAMS.md`.
    - `memory rem-backfill --path ... --stage-short-term` chuẩn bị các ứng viên bền vững có căn cứ vào cùng kho bằng chứng ngắn hạn mà pha sâu thông thường sử dụng.
    - `memory rem-backfill --rollback` và `--rollback-short-term` xóa các thành phần điền bù đã chuẩn bị đó mà không tác động đến các mục nhật ký thông thường hoặc dữ liệu truy hồi ngắn hạn đang hoạt động.

  </Accordion>
</AccordionGroup>

Giao diện Điều khiển cung cấp cùng quy trình điền bù/đặt lại nhật ký trên thẻ Bộ nhớ của tác nhân (trang Tác nhân), để bạn có thể kiểm tra kết quả trong cảnh giấc mơ trước khi quyết định liệu các ứng viên có căn cứ có xứng đáng được thăng cấp hay không. Một luồng Cảnh có căn cứ riêng biệt cho biết các mục ngắn hạn đã chuẩn bị nào đến từ quá trình phát lại lịch sử, các mục đã thăng cấp nào được dẫn dắt bởi dữ liệu có căn cứ và cho phép bạn chỉ xóa các mục đã chuẩn bị chỉ có căn cứ mà không tác động đến trạng thái ngắn hạn đang hoạt động.

## Tín hiệu xếp hạng sâu

Xếp hạng sâu sử dụng sáu tín hiệu cơ sở có trọng số cùng với tín hiệu củng cố theo pha:

| Tín hiệu            | Trọng số | Mô tả                                               |
| ------------------- | -------- | --------------------------------------------------- |
| Mức độ liên quan    | 0.30     | Chất lượng truy xuất trung bình của mục              |
| Tần suất             | 0.24     | Số lượng tín hiệu ngắn hạn mà mục đã tích lũy        |
| Độ đa dạng truy vấn | 0.15     | Các ngữ cảnh truy vấn/ngày riêng biệt đã làm nó xuất hiện |
| Độ gần đây          | 0.15     | Điểm độ mới suy giảm theo thời gian                   |
| Mức hợp nhất        | 0.10     | Cường độ lặp lại trong nhiều ngày                     |
| Độ phong phú khái niệm | 0.06  | Mật độ thẻ khái niệm từ đoạn trích/đường dẫn          |

Các lượt khớp ở pha nhẹ và REM bổ sung một mức tăng nhỏ suy giảm theo độ gần đây từ `memory/.dreams/phase-signals.json`.

Kết quả thử nghiệm ngầm có thể được xếp lớp lên trên điểm cơ sở dưới dạng tín hiệu xem xét trước khi thực hiện bất kỳ thao tác ghi bền vững nào: một thử nghiệm hữu ích mang lại cho ứng viên mức tăng nhỏ có giới hạn, một thử nghiệm trung lập giữ ứng viên ở trạng thái trì hoãn và một thử nghiệm có hại đánh dấu ứng viên là bị từ chối trong lượt chấm điểm đó. Tín hiệu này chỉ dùng cho báo cáo - nó có thể thay đổi thứ tự ứng viên hoặc siêu dữ liệu xem xét, nhưng không bao giờ ghi vào `MEMORY.md` hoặc tự thăng cấp ứng viên.

### Phạm vi báo cáo thử nghiệm ngầm của QA

QA Lab bao gồm một kịch bản chỉ dùng cho báo cáo để khám phá cách một thử nghiệm ngầm Dreaming trong tương lai có thể xem xét bộ nhớ ứng viên trước khi thăng cấp: một tác nhân so sánh câu trả lời cơ sở với câu trả lời có thể sử dụng bộ nhớ ứng viên, sau đó ghi báo cáo cục bộ gồm kết luận, lý do và các cờ rủi ro. Phạm vi này chỉ áp dụng cho QA - nó xác minh rằng thành phần báo cáo vẫn tách biệt khỏi `MEMORY.md` và tác nhân không bao giờ tuyên bố ứng viên đã được thăng cấp. Nó không bổ sung hành vi thử nghiệm ngầm vào môi trường sản xuất hoặc thay đổi công cụ thăng cấp của pha sâu.

Trình chạy thử nghiệm ngầm `memory-core` duy trì cùng hợp đồng chỉ dùng cho báo cáo đối với các đường dẫn mã cần một thành phần ổn định. Trình chạy nhận ứng viên, lời nhắc thử nghiệm, kết quả cơ sở, kết quả ứng viên, kết luận, lý do, cờ rủi ro và tham chiếu bằng chứng, sau đó ghi báo cáo bằng `promotion action: report-only`. Kết luận hữu ích ánh xạ tới đề xuất `promote`, kết luận trung lập ánh xạ tới `defer` và kết luận có hại ánh xạ tới `reject` - không thao tác nào trong số đó ghi vào `MEMORY.md` hoặc áp dụng việc thăng cấp pha sâu.

## Lập lịch

Khi được bật, `memory-core` tự động quản lý một tác vụ Cron cho toàn bộ lượt quét Dreaming, đồng thời loại bỏ trùng lặp giữa workspace runtime chính và mọi workspace tác nhân đã cấu hình để việc phân tán workspace của subagent không loại trừ `DREAMS.md` và trạng thái bộ nhớ của tác nhân chính.

| Cài đặt              | Mặc định      |
| -------------------- | ------------- |
| `dreaming.frequency` | `0 3 * * *`   |
| `dreaming.model`     | mô hình mặc định |

## Bắt đầu nhanh

<Tabs>
  <Tab title="Bật Dreaming">
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
  <Tab title="Nhịp quét tùy chỉnh">
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

## Lệnh gạch chéo

```text
/dreaming status
/dreaming on
/dreaming off
/dreaming help
```

`/dreaming on` và `/dreaming off` yêu cầu trạng thái chủ sở hữu đối với bên gọi qua kênh hoặc `operator.admin` đối với máy khách Gateway. `/dreaming status` và `/dreaming help` là chỉ đọc.

## Quy trình CLI

<Tabs>
  <Tab title="Xem trước / áp dụng thăng cấp">
    ```bash
    openclaw memory promote
    openclaw memory promote --apply
    openclaw memory promote --limit 5
    openclaw memory status --deep
    ```

    `memory promote` thủ công sử dụng các ngưỡng của pha sâu theo mặc định, trừ khi được ghi đè bằng cờ CLI.

  </Tab>
  <Tab title="Giải thích việc thăng cấp">
    Giải thích lý do một ứng viên cụ thể sẽ hoặc sẽ không được thăng cấp:

    ```bash
    openclaw memory promote-explain "router vlan"
    openclaw memory promote-explain "router vlan" --json
    ```

  </Tab>
  <Tab title="Xem trước bộ thử REM">
    Xem trước các suy ngẫm REM, sự thật ứng viên và đầu ra thăng cấp sâu mà không ghi bất kỳ nội dung nào:

    ```bash
    openclaw memory rem-harness
    openclaw memory rem-harness --json
    ```

  </Tab>
</Tabs>

## Giá trị mặc định chính

Tất cả cài đặt nằm trong `plugins.entries.memory-core.config.dreaming`.

<ParamField path="enabled" type="boolean" default="false">
  Bật hoặc tắt lượt quét Dreaming.
</ParamField>
<ParamField path="frequency" type="string" default="0 3 * * *">
  Nhịp Cron cho toàn bộ lượt quét Dreaming.
</ParamField>
<ParamField path="model" type="string">
  Ghi đè mô hình subagent tùy chọn cho Nhật ký giấc mơ. Sử dụng giá trị `provider/model` chuẩn khi đồng thời thiết lập danh sách cho phép `allowedModels` cho subagent.
</ParamField>
<ParamField path="phases.deep.maxPromotedSnippetTokens" type="number" default="160">
  Số lượng token ước tính tối đa được giữ lại từ mỗi đoạn truy hồi ngắn hạn được thăng cấp vào `MEMORY.md`. Nguồn gốc xếp hạng vẫn hiển thị.
</ParamField>

<Warning>
`dreaming.model` yêu cầu `plugins.entries.memory-core.subagent.allowModelOverride: true`. Để hạn chế nó, hãy thiết lập thêm `plugins.entries.memory-core.subagent.allowedModels`. Việc tự động thử lại chỉ áp dụng cho lỗi mô hình không khả dụng; lỗi về độ tin cậy hoặc danh sách cho phép vẫn hiển thị trong nhật ký hệ thống thay vì âm thầm chuyển sang phương án dự phòng.
</Warning>

<Note>
Hầu hết chính sách pha, ngưỡng và hành vi lưu trữ là chi tiết triển khai nội bộ. Xem [tham chiếu cấu hình Bộ nhớ](/vi/reference/memory-config#dreaming) để biết danh sách khóa đầy đủ.
</Note>

## Giao diện Giấc mơ

Khi được bật, thẻ **Giấc mơ** của Gateway hiển thị:

- trạng thái bật Dreaming hiện tại
- trạng thái theo từng pha và sự hiện diện của lượt quét được quản lý
- số lượng mục ngắn hạn, có căn cứ, tín hiệu và được thăng cấp hôm nay
- thời điểm chạy theo lịch tiếp theo
- một luồng Cảnh có căn cứ riêng biệt cho các mục phát lại lịch sử đã chuẩn bị
- trình đọc Nhật ký giấc mơ có thể mở rộng, được hỗ trợ bởi `doctor.memory.dreamDiary`

## Liên quan

- [Bộ nhớ](/vi/concepts/memory)
- [CLI Bộ nhớ](/vi/cli/memory)
- [Tham chiếu cấu hình Bộ nhớ](/vi/reference/memory-config)
- [Tìm kiếm bộ nhớ](/vi/concepts/memory-search)
