---
read_when:
    - Bạn muốn đọc các bản tóm tắt bản ghi hội thoại đã lưu từ terminal
    - Bạn cần đường dẫn đến bản tóm tắt bản chép lời ở định dạng Markdown
    - Bạn đang gỡ lỗi bố cục lưu trữ bản ghi hội thoại cốt lõi
summary: Tài liệu tham khảo CLI cho `openclaw transcripts` (liệt kê, hiển thị và định vị các bản chép lời đã lưu trữ)
title: CLI bản ghi hội thoại
x-i18n:
    generated_at: "2026-07-12T07:50:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dde02e924339c64cf6acd5c4b6162785dcfccf4a1df2aac0d9d52d5306511579
    source_path: cli/transcripts.md
    workflow: 16
---

# `openclaw transcripts`

Trình kiểm tra chỉ đọc dành cho các bản ghi do công cụ tác nhân `transcripts` ghi.
Việc thu, nhập và tóm tắt được thực hiện thông qua công cụ đó, không phải CLI này.

Các tệp đầu ra nằm trong thư mục trạng thái:

```text
$OPENCLAW_STATE_DIR/transcripts/YYYY-MM-DD/<session>/
  metadata.json
  transcript.jsonl
  summary.json
  summary.md
```

Thư mục trạng thái mặc định là `~/.openclaw`; ghi đè bằng `OPENCLAW_STATE_DIR`.
Thư mục ngày được xác định từ thời điểm bắt đầu phiên; thư mục phiên là
một slug an toàn cho hệ thống tệp được tạo từ mã định danh phiên.

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

| Lệnh                          | Mô tả                                                     |
| ----------------------------- | --------------------------------------------------------- |
| `list`                        | Liệt kê các phiên đã lưu.                                 |
| `show <session>`              | In nội dung `summary.md` đã lưu.                          |
| `path <session>`              | In đường dẫn đến `summary.md`.                            |
| `path <session> --dir`        | In thư mục phiên.                                         |
| `path <session> --metadata`   | In `metadata.json`.                                       |
| `path <session> --transcript` | In `transcript.jsonl`.                                    |
| `--json`                      | In đầu ra có thể đọc bằng máy (mọi lệnh con).             |

`<session>` chấp nhận mã định danh phiên thuần hoặc bộ chọn có kèm ngày
(`YYYY-MM-DD/<session>`). Sử dụng dạng đầy đủ khi cùng một mã định danh phiên
xuất hiện vào nhiều ngày, ví dụ `openclaw transcripts show
2026-05-22/standup`. Mã định danh phiên mặc định bao gồm dấu thời gian và hậu tố
ngẫu nhiên; chỉ đặt mã định danh cố định cho phiên khi mã đó là duy nhất trong ngày.

## Đầu ra

`list` in một dòng phân cách bằng tab cho mỗi phiên: bộ chọn, thời gian bắt đầu, tiêu đề,
đường dẫn bản tóm tắt.

```text
2026-05-22/standup  2026-05-22T09:00:00.000Z  Weekly standup  /Users/user/.openclaw/transcripts/2026-05-22/standup/summary.md
```

Bộ chọn là giá trị an toàn nhất để truyền lại cho `show` hoặc `path`.

`list --json` trả về các đối tượng có `sessionId`, `selector`, `date`, `title`,
`startedAt`, `stoppedAt`, `source`, `path`, `summaryPath`, `hasSummary`.

`show --json` trả về siêu dữ liệu phiên đã lưu, bộ chọn, thư mục phiên,
đường dẫn bản tóm tắt và văn bản Markdown của bản tóm tắt.

`path --json` trả về đường dẫn đã chọn và cho biết tệp đó có tồn tại hay không.

## Nhiều phiên mỗi ngày

Các phiên được nhóm theo ngày, sau đó theo mã định danh phiên. Mười cuộc họp trong một ngày sẽ tạo thành
mười thư mục ngang hàng:

```text
~/.openclaw/transcripts/2026-05-22/
  transcript-2026-05-22T09-00-00-000Z-a1b2c3d4/
  transcript-2026-05-22T10-30-00-000Z-b2c3d4e5/
  standup/
```

Sử dụng mã định danh được tạo mặc định cho tự động hóa. Chỉ sử dụng mã định danh cố định như `standup`
khi mã đó không lặp lại trong cùng ngày.

## Thiếu bản tóm tắt

Các phiên trực tiếp ghi `summary.md` khi phiên dừng; các bản ghi được nhập
ghi tệp này ngay sau khi nhập. Một phiên có thể xuất hiện trong `list` mà chưa có
bản tóm tắt khi quá trình thu vẫn đang hoạt động, nếu nhà cung cấp gặp lỗi trong lúc dừng hoặc nếu
siêu dữ liệu được ghi trước khi có bất kỳ phát ngôn nào.

Sử dụng `path <session> --transcript` để kiểm tra bản ghi thô chỉ cho phép nối thêm,
hoặc chạy hành động `summarize` của công cụ `transcripts` để tạo lại bản tóm tắt
Markdown.

## Cấu hình

Tính năng thu yêu cầu chủ động bật (các nguồn trực tiếp có thể tham gia và ghi âm cuộc họp). Bật tính năng này
bằng:

```json
{
  "transcripts": {
    "enabled": true,
    "maxUtterances": 2000
  }
}
```

- `enabled` (mặc định `false`): bật công cụ.
- `maxUtterances` (mặc định `2000`, giới hạn trong khoảng 1-10000): kích thước bộ đệm phát ngôn cho mỗi
  phiên.

Cấu hình các nguồn tự động bắt đầu bằng `transcripts.autoStart`. Mỗi mục được
bật khi có mặt; bỏ mục đó để tắt nguồn tương ứng. `discord-voice`
là nguồn đi kèm có khả năng tự động bắt đầu và yêu cầu `guildId` cùng
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
