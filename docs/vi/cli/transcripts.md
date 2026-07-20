---
read_when:
    - Bạn muốn đọc các bản tóm tắt bản ghi hội thoại đã lưu từ terminal
    - Bạn cần đường dẫn đến bản tóm tắt bản chép lời ở định dạng Markdown
    - Bạn đang gỡ lỗi bố cục lưu trữ bản ghi hội thoại cốt lõi
summary: Tài liệu tham khảo CLI cho `openclaw transcripts` (liệt kê, hiển thị và định vị các bản chép lời đã lưu trữ)
title: CLI bản ghi hội thoại
x-i18n:
    generated_at: "2026-07-20T04:37:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f5615c3051f31f9ae38acb70c8bb00e187b987366d41b8e2049c97ba953aa35d
    source_path: cli/transcripts.md
    workflow: 16
---

# `openclaw transcripts`

Trình kiểm tra chỉ đọc dành cho các bản chép lời được ghi bởi công cụ agent `transcripts`.
Việc ghi lại, nhập và tóm tắt được thực hiện thông qua công cụ đó, không phải CLI này.

Các tạo tác nằm trong thư mục trạng thái:

```text
$OPENCLAW_STATE_DIR/transcripts/YYYY-MM-DD/<session>/
  metadata.json
  transcript.jsonl
  summary.json
  summary.md
```

Thư mục trạng thái mặc định là `~/.openclaw`; ghi đè bằng `OPENCLAW_STATE_DIR`.
Thư mục ngày được xác định từ thời điểm bắt đầu phiên; thư mục phiên là
một slug an toàn cho hệ thống tệp được tạo từ id phiên.

## Lệnh

```bash
openclaw transcripts list
openclaw transcripts show <session>
openclaw transcripts show YYYY-MM-DD/<session>
openclaw transcripts path <session>
openclaw transcripts path YYYY-MM-DD/<session>
openclaw transcripts path <session> --dir
openclaw transcripts path <session> --metadata
openclaw transcripts path <session> --transcript
openclaw transcripts list --json
openclaw transcripts show <session> --json
openclaw transcripts path <session> --json
```

| Lệnh                          | Mô tả                                            |
| ----------------------------- | ----------------------------------------------- |
| `list`                        | Liệt kê các phiên đã lưu.                       |
| `show <session>`              | In `summary.md` đã lưu.                         |
| `path <session>`              | In đường dẫn `summary.md`.                      |
| `path <session> --dir`        | In thư mục phiên.                               |
| `path <session> --metadata`   | In `metadata.json`.                                 |
| `path <session> --transcript` | In `transcript.jsonl`.                              |
| `--json`                      | In đầu ra mà máy có thể đọc được (mọi lệnh con). |

`<session>` chấp nhận id phiên trần hoặc bộ chọn có kèm ngày
(`YYYY-MM-DD/<session>`). Sử dụng dạng có kèm ngày khi cùng một id phiên
xuất hiện vào nhiều ngày, ví dụ `openclaw transcripts show
2026-05-22/standup`. Id phiên mặc định bao gồm dấu thời gian và hậu tố
ngẫu nhiên; chỉ gán id cố định cho phiên khi id đó là duy nhất trong ngày.

## Đầu ra

`list` in một dòng phân tách bằng tab cho mỗi phiên: bộ chọn, thời gian bắt đầu, tiêu đề,
đường dẫn bản tóm tắt.

```text
2026-05-22/standup  2026-05-22T09:00:00.000Z  Cuộc họp đứng hằng tuần  /Users/user/.openclaw/transcripts/2026-05-22/standup/summary.md
```

Bộ chọn là giá trị an toàn nhất để truyền lại cho `show` hoặc `path`.

`list --json` trả về các đối tượng có `sessionId`, `selector`, `date`, `title`,
`startedAt`, `stoppedAt`, `source`, `path`, `summaryPath`, `hasSummary`.

`show --json` trả về siêu dữ liệu phiên đã lưu, bộ chọn, thư mục
phiên, đường dẫn bản tóm tắt và văn bản Markdown của bản tóm tắt.

`path --json` trả về đường dẫn đã chọn và trạng thái tệp đó có tồn tại hay không.

## Nhiều phiên mỗi ngày

Các phiên được nhóm theo ngày, sau đó theo id phiên. Mười cuộc họp trong một ngày sẽ tạo thành
mười thư mục ngang hàng:

```text
~/.openclaw/transcripts/2026-05-22/
  transcript-2026-05-22T09-00-00-000Z-a1b2c3d4/
  transcript-2026-05-22T10-30-00-000Z-b2c3d4e5/
  standup/
```

Sử dụng id được tạo mặc định cho hoạt động tự động hóa. Chỉ sử dụng id cố định như `standup`
khi id đó không lặp lại trong cùng ngày.

## Thiếu bản tóm tắt

Các phiên trực tiếp ghi `summary.md` khi phiên dừng; các bản chép lời được nhập
ghi nó ngay sau khi nhập. Một phiên có thể xuất hiện trong `list` mà không có
bản tóm tắt khi quá trình ghi vẫn đang hoạt động, nếu nhà cung cấp gặp lỗi trong lúc dừng hoặc nếu
siêu dữ liệu được ghi trước khi có bất kỳ lời thoại nào.

Sử dụng `path <session> --transcript` để kiểm tra bản chép lời thô chỉ cho phép ghi nối tiếp,
hoặc chạy hành động `summarize` của công cụ `transcripts` để tạo lại bản tóm tắt
Markdown.

## Cấu hình

Tính năng ghi lại yêu cầu chủ động bật (các nguồn trực tiếp có thể tham gia và ghi âm cuộc họp). Bật tính năng này
bằng:

```json
{
  "transcripts": {
    "enabled": true
  }
}
```

- `enabled` (mặc định `false`): bật công cụ.
  Cấu hình các nguồn tự động khởi động bằng `transcripts.autoStart`. Mỗi mục được
  bật khi hiện diện; bỏ mục đó để tắt nguồn tương ứng. `discord-voice`
  là nguồn đi kèm có khả năng tự động khởi động và yêu cầu `guildId` cùng
  `channelId`:

```json
{
  "transcripts": {
    "enabled": true,
    "autoStart": [
      {
        "providerId": "discord-voice",
        "guildId": "1234567890",
        "channelId": "2345678901"
      }
    ]
  }
}
```
