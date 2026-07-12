---
read_when:
    - Bạn muốn quản lý các hook của tác tử
    - Bạn muốn kiểm tra các hook khả dụng hoặc bật hook cho không gian làm việc
summary: Tài liệu tham khảo CLI cho `openclaw hooks` (hook tác tử)
title: Hook
x-i18n:
    generated_at: "2026-07-12T07:45:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f33d1e343771971bdc17dcafdabc6c4fc893b3080897862475a148e5f3957796
    source_path: cli/hooks.md
    workflow: 16
---

# `openclaw hooks`

Quản lý các hook của tác nhân (các tác vụ tự động hóa theo sự kiện dành cho những lệnh như `/new`, `/reset` và khi Gateway khởi động). Chỉ dùng `openclaw hooks` tương đương với `openclaw hooks list`.

Liên quan: [Hook](/vi/automation/hooks) - [Hook của Plugin](/vi/plugins/hooks)

## Liệt kê hook

```bash
openclaw hooks list [--eligible] [--json] [-v|--verbose]
```

Liệt kê các hook được phát hiện từ không gian làm việc, các thư mục được quản lý, thư mục bổ sung và thư mục đi kèm.

- `--eligible`: chỉ các hook đáp ứng yêu cầu.
- `--json`: đầu ra có cấu trúc.
- `-v, --verbose`: thêm cột Thiếu, hiển thị các yêu cầu chưa được đáp ứng.

```
Hook (4/5 sẵn sàng)

Sẵn sàng:
  🚀 boot-md ✓ - Chạy BOOT.md khi Gateway khởi động
  📎 bootstrap-extra-files ✓ - Chèn thêm các tệp khởi tạo không gian làm việc trong quá trình khởi tạo tác nhân
  📝 command-logger ✓ - Ghi nhật ký mọi sự kiện lệnh vào một tệp kiểm toán tập trung
  💾 session-memory ✓ - Lưu ngữ cảnh phiên vào bộ nhớ khi lệnh /new hoặc /reset được thực thi
```

## Xem thông tin hook

```bash
openclaw hooks info <name> [--json]
```

`<name>` là tên hoặc khóa của hook (ví dụ: `session-memory`). Hiển thị nguồn, đường dẫn tệp/trình xử lý, trang chủ, sự kiện và trạng thái của từng yêu cầu (tệp nhị phân, biến môi trường, cấu hình, hệ điều hành).

## Kiểm tra tính đủ điều kiện

```bash
openclaw hooks check [--json]
```

In bản tóm tắt số lượng sẵn sàng/chưa sẵn sàng; nếu có hook chưa sẵn sàng, lệnh sẽ liệt kê từng hook cùng nguyên nhân cản trở.

## Bật một hook

```bash
openclaw hooks enable <name>
```

Thêm/cập nhật `hooks.internal.entries.<name>.enabled = true` trong cấu hình, đồng thời bật công tắc chính `hooks.internal.enabled` (Gateway không tải bất kỳ trình xử lý hook nội bộ nào cho đến khi có ít nhất một hook được cấu hình). Lệnh sẽ thất bại nếu hook không tồn tại, do Plugin quản lý hoặc không đủ điều kiện (thiếu yêu cầu).

Các hook do Plugin quản lý hiển thị `plugin:<id>` trong `hooks list` và không thể bật/tắt tại đây; thay vào đó, hãy bật hoặc tắt Plugin sở hữu hook.

Khởi động lại Gateway sau khi bật (khởi động lại ứng dụng trên thanh menu macOS hoặc khởi động lại tiến trình Gateway trong môi trường phát triển) để Gateway tải lại các hook.

## Tắt một hook

```bash
openclaw hooks disable <name>
```

Đặt `hooks.internal.entries.<name>.enabled = false`. Sau đó, hãy khởi động lại Gateway.

## Cài đặt và cập nhật gói hook

```bash
openclaw plugins install <package>        # npm theo mặc định
openclaw plugins install npm:<package>    # chỉ npm
openclaw plugins install <package> --pin  # ghim phiên bản đã phân giải
openclaw plugins install <path>           # thư mục hoặc tệp lưu trữ cục bộ
openclaw plugins install -l <path>        # liên kết thư mục cục bộ thay vì sao chép

openclaw plugins update <id>
openclaw plugins update --all
openclaw plugins update --dry-run
```

Các gói hook được cài đặt thông qua trình cài đặt/cập nhật Plugin hợp nhất; `openclaw hooks install` / `openclaw hooks update` vẫn hoạt động dưới dạng bí danh đã lỗi thời, chúng sẽ in cảnh báo và chuyển tiếp sang các lệnh `plugins`.

- Đặc tả npm chỉ được lấy từ kho đăng ký: tên gói cùng phiên bản chính xác hoặc thẻ phân phối tùy chọn. Đặc tả Git/URL/tệp và dải phiên bản semver sẽ bị từ chối. Các phần phụ thuộc được cài đặt cục bộ trong dự án với `--ignore-scripts`.
- Đặc tả không kèm phiên bản và `@latest` vẫn sử dụng kênh ổn định; nếu npm phân giải thành một bản phát hành thử nghiệm, OpenClaw sẽ dừng lại và yêu cầu bạn chủ động chọn tham gia (`@beta`, `@rc` hoặc một phiên bản phát hành thử nghiệm chính xác).
- Các định dạng tệp lưu trữ được hỗ trợ: `.zip`, `.tgz`, `.tar.gz`, `.tar`.
- `-l, --link` liên kết một thư mục cục bộ thay vì sao chép thư mục đó (thêm thư mục vào `hooks.internal.load.extraDirs`); các gói hook được liên kết là hook được quản lý từ một thư mục do người vận hành cấu hình, không phải hook của không gian làm việc.
- `--pin` ghi lại các lượt cài đặt npm dưới dạng `name@version` chính xác đã được phân giải trong `hooks.internal.installs`.
- Thao tác cài đặt sao chép gói vào `~/.openclaw/hooks/<id>`, bật các hook của gói trong `hooks.internal.entries.*` và ghi lại lượt cài đặt trong `hooks.internal.installs`.
- Nếu mã băm toàn vẹn đã lưu không còn khớp với thành phần được tải về, OpenClaw sẽ cảnh báo và yêu cầu xác nhận trước khi tiếp tục; truyền tùy chọn toàn cục `--yes` để bỏ qua lời nhắc (ví dụ trong CI).

## Các hook đi kèm

| Hook                  | Sự kiện                                           | Chức năng                                                                                                  |
| --------------------- | ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| boot-md               | `gateway:startup`                                 | Chạy `BOOT.md` khi Gateway khởi động cho từng phạm vi tác nhân đã cấu hình                                 |
| bootstrap-extra-files | `agent:bootstrap`                                 | Chèn các tệp khởi tạo bổ sung (ví dụ: `AGENTS.md`/`TOOLS.md` của monorepo) trong quá trình khởi tạo tác nhân |
| command-logger        | `command`                                         | Ghi nhật ký các sự kiện lệnh vào `~/.openclaw/logs/commands.log`                                           |
| compaction-notifier   | `session:compact:before`, `session:compact:after` | Gửi thông báo trò chuyện hiển thị khi quá trình Compaction phiên bắt đầu và kết thúc                       |
| session-memory        | `command:new`, `command:reset`                    | Lưu ngữ cảnh phiên vào bộ nhớ khi dùng `/new` hoặc `/reset`                                                |

Bật bất kỳ hook đi kèm nào bằng `openclaw hooks enable <hook-name>`. Chi tiết đầy đủ, khóa cấu hình và giá trị mặc định: [Các hook đi kèm](/vi/automation/hooks#bundled-hooks).

### Tệp nhật ký của command-logger

```bash
tail -n 20 ~/.openclaw/logs/commands.log        # các lệnh gần đây
cat ~/.openclaw/logs/commands.log | jq .          # in theo định dạng dễ đọc
grep '"action":"new"' ~/.openclaw/logs/commands.log | jq .   # lọc theo hành động
```

## Ghi chú

- `hooks list --json`, `info --json` và `check --json` ghi trực tiếp JSON có cấu trúc vào đầu ra chuẩn.

## Liên quan

- [Tài liệu tham chiếu CLI](/vi/cli)
- [Hook tự động hóa](/vi/automation/hooks)
