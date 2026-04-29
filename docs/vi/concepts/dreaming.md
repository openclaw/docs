---
read_when:
    - Bạn muốn quá trình đưa vào bộ nhớ chạy tự động
    - Bạn muốn hiểu chức năng của từng giai đoạn Dreaming
    - Bạn muốn tinh chỉnh quá trình hợp nhất mà không làm lộn xộn MEMORY.md
sidebarTitle: Dreaming
summary: Hợp nhất bộ nhớ ở chế độ nền với các giai đoạn nhẹ, sâu và REM cùng Nhật ký giấc mơ
title: Dreaming
x-i18n:
    generated_at: "2026-04-29T22:37:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 85c323c073fc786069835aad25ee68781af49bb031e63b9601674461f385cc2a
    source_path: concepts/dreaming.md
    workflow: 16
---

Dreaming là hệ thống hợp nhất bộ nhớ nền trong `memory-core`. Nó giúp OpenClaw chuyển các tín hiệu ngắn hạn mạnh vào bộ nhớ bền vững, đồng thời giữ cho quy trình có thể giải thích và xem xét được.

<Note>
Dreaming là tính năng **tùy chọn bật** và mặc định bị tắt.
</Note>

## Dreaming ghi những gì

Dreaming giữ hai loại đầu ra:

- **Trạng thái máy** trong `memory/.dreams/` (kho truy hồi, tín hiệu pha, điểm kiểm tra nạp dữ liệu, khóa).
- **Đầu ra cho con người đọc** trong `DREAMS.md` (hoặc `dreams.md` hiện có) và các tệp báo cáo pha tùy chọn dưới `memory/dreaming/<phase>/YYYY-MM-DD.md`.

Việc nâng cấp lên dài hạn vẫn chỉ ghi vào `MEMORY.md`.

## Mô hình pha

Dreaming sử dụng ba pha phối hợp:

| Pha   | Mục đích                                      | Ghi bền vững     |
| ----- | -------------------------------------------- | ---------------- |
| Nhẹ   | Sắp xếp và chuẩn bị tài liệu ngắn hạn gần đây | Không            |
| Sâu   | Chấm điểm và nâng cấp ứng viên bền vững       | Có (`MEMORY.md`) |
| REM   | Suy ngẫm về chủ đề và ý tưởng lặp lại         | Không            |

Các pha này là chi tiết triển khai nội bộ, không phải các "chế độ" riêng do người dùng cấu hình.

<AccordionGroup>
  <Accordion title="Pha nhẹ">
    Pha nhẹ nạp các tín hiệu bộ nhớ hằng ngày gần đây và dấu vết truy hồi, khử trùng lặp chúng, rồi chuẩn bị các dòng ứng viên.

    - Đọc từ trạng thái truy hồi ngắn hạn, các tệp bộ nhớ hằng ngày gần đây và bản ghi phiên đã biên tập khi có.
    - Ghi một khối `## Light Sleep` được quản lý khi bộ lưu trữ bao gồm đầu ra nội tuyến.
    - Ghi lại tín hiệu củng cố để xếp hạng sâu sau này.
    - Không bao giờ ghi vào `MEMORY.md`.

  </Accordion>
  <Accordion title="Pha sâu">
    Pha sâu quyết định nội dung nào trở thành bộ nhớ dài hạn.

    - Xếp hạng ứng viên bằng chấm điểm có trọng số và các cổng ngưỡng.
    - Yêu cầu `minScore`, `minRecallCount` và `minUniqueQueries` đạt yêu cầu.
    - Nạp lại đoạn trích từ các tệp hằng ngày trực tiếp trước khi ghi, nên các đoạn trích cũ/đã xóa sẽ bị bỏ qua.
    - Thêm các mục đã nâng cấp vào `MEMORY.md`.
    - Ghi tóm tắt `## Deep Sleep` vào `DREAMS.md` và tùy chọn ghi `memory/dreaming/deep/YYYY-MM-DD.md`.

  </Accordion>
  <Accordion title="Pha REM">
    Pha REM trích xuất các mẫu và tín hiệu phản tư.

    - Xây dựng tóm tắt chủ đề và phản tư từ các dấu vết ngắn hạn gần đây.
    - Ghi một khối `## REM Sleep` được quản lý khi bộ lưu trữ bao gồm đầu ra nội tuyến.
    - Ghi lại tín hiệu củng cố REM được dùng bởi xếp hạng sâu.
    - Không bao giờ ghi vào `MEMORY.md`.

  </Accordion>
</AccordionGroup>

## Nạp bản ghi phiên

Dreaming có thể nạp các bản ghi phiên đã biên tập vào kho ngữ liệu Dreaming. Khi có bản ghi, chúng được đưa vào pha nhẹ cùng với các tín hiệu bộ nhớ hằng ngày và dấu vết truy hồi. Nội dung cá nhân và nhạy cảm được biên tập trước khi nạp.

## Nhật ký giấc mơ

Dreaming cũng giữ một **Nhật ký giấc mơ** dạng tường thuật trong `DREAMS.md`. Sau khi mỗi pha có đủ tài liệu, `memory-core` chạy một lượt subagent nền theo nỗ lực tốt nhất và thêm một mục nhật ký ngắn. Nó sử dụng mô hình runtime mặc định trừ khi `dreaming.model` được cấu hình. Nếu mô hình đã cấu hình không khả dụng, Nhật ký giấc mơ sẽ thử lại một lần bằng mô hình mặc định của phiên.

<Note>
Nhật ký này dành cho con người đọc trong giao diện Giấc mơ, không phải nguồn nâng cấp. Các tạo tác nhật ký/báo cáo do Dreaming tạo ra bị loại khỏi nâng cấp ngắn hạn. Chỉ các đoạn bộ nhớ có căn cứ mới đủ điều kiện nâng cấp vào `MEMORY.md`.
</Note>

Cũng có một tuyến điền lùi lịch sử có căn cứ cho công việc xem xét và phục hồi:

<AccordionGroup>
  <Accordion title="Lệnh điền lùi">
    - `memory rem-harness --path ... --grounded` xem trước đầu ra nhật ký có căn cứ từ ghi chú lịch sử `YYYY-MM-DD.md`.
    - `memory rem-backfill --path ...` ghi các mục nhật ký có căn cứ có thể đảo ngược vào `DREAMS.md`.
    - `memory rem-backfill --path ... --stage-short-term` chuẩn bị các ứng viên bền vững có căn cứ vào cùng kho bằng chứng ngắn hạn mà pha sâu bình thường đã dùng.
    - `memory rem-backfill --rollback` và `--rollback-short-term` xóa các tạo tác điền lùi đã chuẩn bị đó mà không chạm vào các mục nhật ký thông thường hoặc truy hồi ngắn hạn trực tiếp.

  </Accordion>
</AccordionGroup>

Giao diện Điều khiển cung cấp cùng luồng điền lùi/đặt lại nhật ký để bạn có thể kiểm tra kết quả trong cảnh Giấc mơ trước khi quyết định liệu các ứng viên có căn cứ có đáng được nâng cấp hay không. Cảnh này cũng hiển thị một tuyến có căn cứ riêng biệt để bạn có thể thấy mục ngắn hạn đã chuẩn bị nào đến từ phát lại lịch sử, mục đã nâng cấp nào được dẫn dắt bởi căn cứ, và chỉ xóa các mục đã chuẩn bị chỉ có căn cứ mà không chạm vào trạng thái ngắn hạn trực tiếp thông thường.

## Tín hiệu xếp hạng sâu

Xếp hạng sâu sử dụng sáu tín hiệu cơ sở có trọng số cộng với củng cố pha:

| Tín hiệu            | Trọng số | Mô tả                                             |
| ------------------- | -------- | ------------------------------------------------- |
| Tần suất            | 0.24     | Số lượng tín hiệu ngắn hạn mà mục đã tích lũy     |
| Mức độ liên quan    | 0.30     | Chất lượng truy xuất trung bình của mục           |
| Độ đa dạng truy vấn | 0.15     | Ngữ cảnh truy vấn/ngày riêng biệt đã làm nó xuất hiện |
| Tính gần đây        | 0.15     | Điểm độ mới giảm dần theo thời gian               |
| Hợp nhất            | 0.10     | Độ mạnh lặp lại qua nhiều ngày                    |
| Độ phong phú khái niệm | 0.06  | Mật độ thẻ khái niệm từ đoạn trích/đường dẫn      |

Các lần khớp pha nhẹ và REM thêm một mức tăng nhỏ giảm dần theo độ mới từ `memory/.dreams/phase-signals.json`.

## Lập lịch

Khi được bật, `memory-core` tự động quản lý một tác vụ cron cho một lần quét Dreaming đầy đủ. Mỗi lần quét chạy các pha theo thứ tự: nhẹ → REM → sâu.

Hành vi nhịp chạy mặc định:

| Thiết lập            | Mặc định      |
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

    Lệnh thủ công `memory promote` mặc định sử dụng các ngưỡng pha sâu trừ khi được ghi đè bằng cờ CLI.

  </Tab>
  <Tab title="Giải thích nâng cấp">
    Giải thích vì sao một ứng viên cụ thể sẽ hoặc sẽ không được nâng cấp:

    ```bash
    openclaw memory promote-explain "router vlan"
    openclaw memory promote-explain "router vlan" --json
    ```

  </Tab>
  <Tab title="Xem trước REM harness">
    Xem trước các phản tư REM, sự thật ứng viên và đầu ra nâng cấp sâu mà không ghi bất cứ thứ gì:

    ```bash
    openclaw memory rem-harness
    openclaw memory rem-harness --json
    ```

  </Tab>
</Tabs>

## Mặc định chính

Tất cả thiết lập nằm dưới `plugins.entries.memory-core.config.dreaming`.

<ParamField path="enabled" type="boolean" default="false">
  Bật hoặc tắt lần quét Dreaming.
</ParamField>
<ParamField path="frequency" type="string" default="0 3 * * *">
  Nhịp Cron cho lần quét Dreaming đầy đủ.
</ParamField>
<ParamField path="model" type="string">
  Ghi đè mô hình subagent tùy chọn cho Nhật ký giấc mơ. Dùng giá trị `provider/model` chuẩn khi cũng đặt allowlist `allowedModels` cho subagent.
</ParamField>

<Warning>
`dreaming.model` yêu cầu `plugins.entries.memory-core.subagent.allowModelOverride: true`. Để hạn chế nó, cũng đặt `plugins.entries.memory-core.subagent.allowedModels`. Lỗi tin cậy hoặc allowlist vẫn hiển thị thay vì âm thầm quay lui; lần thử lại chỉ áp dụng cho lỗi mô hình không khả dụng.
</Warning>

<Note>
Chính sách pha, ngưỡng và hành vi lưu trữ là chi tiết triển khai nội bộ (không phải cấu hình hướng tới người dùng). Xem [Tham chiếu cấu hình bộ nhớ](/vi/reference/memory-config#dreaming) để biết danh sách khóa đầy đủ.
</Note>

## Giao diện Giấc mơ

Khi được bật, tab **Giấc mơ** của Gateway hiển thị:

- trạng thái bật Dreaming hiện tại
- trạng thái cấp pha và sự hiện diện của quét được quản lý
- số lượng ngắn hạn, có căn cứ, tín hiệu và đã nâng cấp hôm nay
- thời điểm chạy theo lịch tiếp theo
- một tuyến Cảnh có căn cứ riêng biệt cho các mục phát lại lịch sử đã chuẩn bị
- trình đọc Nhật ký giấc mơ có thể mở rộng, được hỗ trợ bởi `doctor.memory.dreamDiary`

## Liên quan

- [Bộ nhớ](/vi/concepts/memory)
- [CLI bộ nhớ](/vi/cli/memory)
- [Tham chiếu cấu hình bộ nhớ](/vi/reference/memory-config)
- [Tìm kiếm bộ nhớ](/vi/concepts/memory-search)
