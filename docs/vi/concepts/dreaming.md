---
read_when:
    - Bạn muốn quá trình thăng hạng bộ nhớ chạy tự động
    - Bạn muốn hiểu chức năng của từng giai đoạn Dreaming
    - Bạn muốn tinh chỉnh quá trình hợp nhất mà không làm lộn xộn MEMORY.md
sidebarTitle: Dreaming
summary: Hợp nhất bộ nhớ nền với các pha nhẹ, sâu và REM cùng Nhật ký giấc mơ
title: Dreaming
x-i18n:
    generated_at: "2026-05-02T10:39:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 23057bfeaaac1cc6b2bf2ee78928c8fdd820c817e461cc0b77f7c1e40ac14c22
    source_path: concepts/dreaming.md
    workflow: 16
---

Dreaming là hệ thống hợp nhất bộ nhớ nền trong `memory-core`. Nó giúp OpenClaw chuyển các tín hiệu ngắn hạn mạnh vào bộ nhớ bền vững trong khi vẫn giữ quy trình có thể giải thích và xem xét.

<Note>
Dreaming là tính năng **chọn tham gia** và bị tắt theo mặc định.
</Note>

## Dreaming ghi gì

Dreaming giữ hai loại đầu ra:

- **Trạng thái máy** trong `memory/.dreams/` (kho truy hồi, tín hiệu pha, điểm kiểm tra nạp dữ liệu, khóa).
- **Đầu ra con người đọc được** trong `DREAMS.md` (hoặc `dreams.md` hiện có) và các tệp báo cáo pha tùy chọn bên dưới `memory/dreaming/<phase>/YYYY-MM-DD.md`.

Việc nâng cấp lên dài hạn vẫn chỉ ghi vào `MEMORY.md`.

## Mô hình pha

Dreaming dùng ba pha phối hợp:

| Pha | Mục đích                                   | Ghi bền vững     |
| ----- | ----------------------------------------- | ----------------- |
| Nhẹ | Sắp xếp và chuẩn bị tài liệu ngắn hạn gần đây | Không                |
| Sâu  | Chấm điểm và nâng cấp các ứng viên bền vững      | Có (`MEMORY.md`) |
| REM   | Suy ngẫm về các chủ đề và ý tưởng lặp lại     | Không                |

Các pha này là chi tiết triển khai nội bộ, không phải các "chế độ" riêng do người dùng cấu hình.

<AccordionGroup>
  <Accordion title="Pha nhẹ">
    Pha nhẹ nạp các tín hiệu bộ nhớ hằng ngày gần đây và dấu vết truy hồi, khử trùng lặp chúng, rồi chuẩn bị các dòng ứng viên.

    - Đọc từ trạng thái truy hồi ngắn hạn, các tệp bộ nhớ hằng ngày gần đây và bản ghi phiên đã biên tập khi có.
    - Ghi một khối `## Light Sleep` được quản lý khi bộ lưu trữ bao gồm đầu ra nội tuyến.
    - Ghi lại tín hiệu củng cố cho việc xếp hạng sâu sau này.
    - Không bao giờ ghi vào `MEMORY.md`.

  </Accordion>
  <Accordion title="Pha sâu">
    Pha sâu quyết định nội dung nào trở thành bộ nhớ dài hạn.

    - Xếp hạng ứng viên bằng cách chấm điểm có trọng số và các cổng ngưỡng.
    - Yêu cầu `minScore`, `minRecallCount` và `minUniqueQueries` phải đạt.
    - Tái nạp đoạn trích từ các tệp hằng ngày trực tiếp trước khi ghi, vì vậy các đoạn trích cũ/đã xóa sẽ bị bỏ qua.
    - Thêm các mục đã nâng cấp vào `MEMORY.md`.
    - Ghi tóm tắt `## Deep Sleep` vào `DREAMS.md` và tùy chọn ghi `memory/dreaming/deep/YYYY-MM-DD.md`.

  </Accordion>
  <Accordion title="Pha REM">
    Pha REM trích xuất các mẫu và tín hiệu phản tư.

    - Xây dựng tóm tắt chủ đề và phản tư từ các dấu vết ngắn hạn gần đây.
    - Ghi một khối `## REM Sleep` được quản lý khi bộ lưu trữ bao gồm đầu ra nội tuyến.
    - Ghi lại các tín hiệu củng cố REM được dùng bởi xếp hạng sâu.
    - Không bao giờ ghi vào `MEMORY.md`.

  </Accordion>
</AccordionGroup>

## Nạp bản ghi phiên

Dreaming có thể nạp bản ghi phiên đã biên tập vào kho ngữ liệu Dreaming. Khi có bản ghi, chúng được đưa vào pha nhẹ cùng với các tín hiệu bộ nhớ hằng ngày và dấu vết truy hồi. Nội dung cá nhân và nhạy cảm được biên tập trước khi nạp.

## Nhật ký giấc mơ

Dreaming cũng giữ một **Nhật ký giấc mơ** dạng tường thuật trong `DREAMS.md`. Sau khi mỗi pha có đủ tài liệu, `memory-core` chạy một lượt subagent nền theo nỗ lực tốt nhất và thêm một mục nhật ký ngắn. Nó dùng mô hình runtime mặc định trừ khi `dreaming.model` được cấu hình. Nếu mô hình đã cấu hình không khả dụng, Nhật ký giấc mơ thử lại một lần với mô hình mặc định của phiên.

<Note>
Nhật ký này dành cho con người đọc trong giao diện Dreams, không phải nguồn nâng cấp. Các tạo phẩm nhật ký/báo cáo do Dreaming tạo ra bị loại khỏi nâng cấp ngắn hạn. Chỉ các đoạn bộ nhớ có căn cứ mới đủ điều kiện nâng cấp vào `MEMORY.md`.
</Note>

Cũng có một luồng điền lùi lịch sử có căn cứ cho công việc xem xét và khôi phục:

<AccordionGroup>
  <Accordion title="Lệnh điền lùi">
    - `memory rem-harness --path ... --grounded` xem trước đầu ra nhật ký có căn cứ từ các ghi chú `YYYY-MM-DD.md` lịch sử.
    - `memory rem-backfill --path ...` ghi các mục nhật ký có căn cứ và có thể đảo ngược vào `DREAMS.md`.
    - `memory rem-backfill --path ... --stage-short-term` chuẩn bị các ứng viên bền vững có căn cứ vào cùng kho bằng chứng ngắn hạn mà pha sâu thông thường đã dùng.
    - `memory rem-backfill --rollback` và `--rollback-short-term` xóa các tạo phẩm điền lùi đã chuẩn bị đó mà không chạm vào các mục nhật ký thông thường hoặc truy hồi ngắn hạn trực tiếp.

  </Accordion>
</AccordionGroup>

Control UI hiển thị cùng luồng điền lùi/đặt lại nhật ký để bạn có thể kiểm tra kết quả trong cảnh Dreams trước khi quyết định liệu các ứng viên có căn cứ có đáng được nâng cấp hay không. Cảnh này cũng hiển thị một luồng có căn cứ riêng biệt để bạn có thể thấy những mục ngắn hạn đã chuẩn bị nào đến từ phát lại lịch sử, những mục đã nâng cấp nào do căn cứ dẫn dắt, và chỉ xóa các mục đã chuẩn bị chỉ có căn cứ mà không chạm vào trạng thái ngắn hạn trực tiếp thông thường.

## Tín hiệu xếp hạng sâu

Xếp hạng sâu dùng sáu tín hiệu cơ sở có trọng số cộng với củng cố pha:

| Tín hiệu              | Trọng số | Mô tả                                       |
| ------------------- | ------ | ------------------------------------------------- |
| Tần suất           | 0.24   | Số lượng tín hiệu ngắn hạn mà mục đã tích lũy |
| Mức độ liên quan           | 0.30   | Chất lượng truy xuất trung bình cho mục           |
| Độ đa dạng truy vấn     | 0.15   | Các ngữ cảnh truy vấn/ngày riêng biệt đã làm nó xuất hiện      |
| Độ gần đây             | 0.15   | Điểm độ mới suy giảm theo thời gian                      |
| Hợp nhất       | 0.10   | Độ mạnh lặp lại qua nhiều ngày                     |
| Độ phong phú khái niệm | 0.06   | Mật độ thẻ khái niệm từ đoạn trích/đường dẫn             |

Các lần khớp ở pha nhẹ và REM thêm một phần tăng nhỏ suy giảm theo độ gần đây từ `memory/.dreams/phase-signals.json`.

## Lên lịch

Khi được bật, `memory-core` tự động quản lý một tác vụ cron cho một lượt quét Dreaming đầy đủ. Mỗi lượt quét chạy các pha theo thứ tự: nhẹ → REM → sâu.

Lượt quét bao gồm workspace runtime chính và bất kỳ workspace agent nào đã cấu hình, được khử trùng lặp theo đường dẫn, vì vậy việc phân nhánh workspace subagent không loại trừ `DREAMS.md` và trạng thái bộ nhớ của agent chính.

Hành vi nhịp mặc định:

| Cài đặt              | Mặc định       |
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

## Lệnh slash

```
/dreaming status
/dreaming on
/dreaming off
/dreaming help
```

## Quy trình CLI

<Tabs>
  <Tab title="Xem trước / áp dụng nâng cấp">
    ```bash
    openclaw memory promote
    openclaw memory promote --apply
    openclaw memory promote --limit 5
    openclaw memory status --deep
    ```

    `memory promote` thủ công dùng các ngưỡng pha sâu theo mặc định trừ khi được ghi đè bằng cờ CLI.

  </Tab>
  <Tab title="Giải thích nâng cấp">
    Giải thích vì sao một ứng viên cụ thể sẽ hoặc sẽ không được nâng cấp:

    ```bash
    openclaw memory promote-explain "router vlan"
    openclaw memory promote-explain "router vlan" --json
    ```

  </Tab>
  <Tab title="Xem trước bộ kiểm REM">
    Xem trước phản tư REM, sự thật ứng viên và đầu ra nâng cấp sâu mà không ghi gì:

    ```bash
    openclaw memory rem-harness
    openclaw memory rem-harness --json
    ```

  </Tab>
</Tabs>

## Giá trị mặc định chính

Tất cả cài đặt nằm bên dưới `plugins.entries.memory-core.config.dreaming`.

<ParamField path="enabled" type="boolean" default="false">
  Bật hoặc tắt lượt quét Dreaming.
</ParamField>
<ParamField path="frequency" type="string" default="0 3 * * *">
  Nhịp Cron cho lượt quét Dreaming đầy đủ.
</ParamField>
<ParamField path="model" type="string">
  Ghi đè mô hình subagent Nhật ký giấc mơ tùy chọn. Dùng giá trị `provider/model` chuẩn khi cũng đặt danh sách cho phép `allowedModels` của subagent.
</ParamField>

<Warning>
`dreaming.model` yêu cầu `plugins.entries.memory-core.subagent.allowModelOverride: true`. Để hạn chế nó, cũng đặt `plugins.entries.memory-core.subagent.allowedModels`. Lỗi tin cậy hoặc danh sách cho phép vẫn hiển thị thay vì âm thầm quay về mặc định; lần thử lại chỉ bao phủ lỗi mô hình không khả dụng.
</Warning>

<Note>
Chính sách pha, ngưỡng và hành vi lưu trữ là chi tiết triển khai nội bộ (không phải cấu hình hướng người dùng). Xem [Tham chiếu cấu hình bộ nhớ](/vi/reference/memory-config#dreaming) để có danh sách khóa đầy đủ.
</Note>

## Giao diện Dreams

Khi được bật, tab **Dreams** của Gateway hiển thị:

- trạng thái bật Dreaming hiện tại
- trạng thái cấp pha và sự hiện diện của lượt quét được quản lý
- số lượng ngắn hạn, có căn cứ, tín hiệu và đã nâng cấp hôm nay
- thời điểm chạy theo lịch tiếp theo
- một luồng Cảnh có căn cứ riêng biệt cho các mục phát lại lịch sử đã chuẩn bị
- trình đọc Nhật ký giấc mơ có thể mở rộng, dựa trên `doctor.memory.dreamDiary`

## Liên quan

- [Bộ nhớ](/vi/concepts/memory)
- [CLI bộ nhớ](/vi/cli/memory)
- [Tham chiếu cấu hình bộ nhớ](/vi/reference/memory-config)
- [Tìm kiếm bộ nhớ](/vi/concepts/memory-search)
