---
read_when:
    - Bạn gặp sự cố kết nối/xác thực và muốn được hướng dẫn cách khắc phục
    - Bạn đã cập nhật và muốn kiểm tra sơ bộ
summary: Tham chiếu CLI cho `openclaw doctor` (kiểm tra tình trạng + sửa chữa có hướng dẫn)
title: Doctor
x-i18n:
    generated_at: "2026-06-27T17:18:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cf7c07cd39053fce7efa81d968ef0f2666f6f5331581e72d2684843519c63b43
    source_path: cli/doctor.md
    workflow: 16
---

# `openclaw doctor`

Kiểm tra tình trạng + sửa nhanh cho Gateway và các kênh.

Liên quan:

- Khắc phục sự cố: [Khắc phục sự cố](/vi/gateway/troubleshooting)
- Kiểm tra bảo mật: [Bảo mật](/vi/gateway/security)

## Vì Sao Nên Dùng

`openclaw doctor` là bề mặt kiểm tra tình trạng của OpenClaw. Dùng khi Gateway,
kênh, Plugin, Skills, định tuyến mô hình, trạng thái cục bộ, hoặc di chuyển cấu hình
không hoạt động như mong đợi và bạn muốn một lệnh có thể giải thích vấn đề
đang nằm ở đâu.

Doctor có ba chế độ:

| Chế độ | Lệnh                     | Hành vi                                                                                     |
| ------ | ------------------------ | ------------------------------------------------------------------------------------------- |
| Kiểm tra | `openclaw doctor`        | Các kiểm tra hướng đến con người và lời nhắc có hướng dẫn.                                  |
| Sửa chữa | `openclaw doctor --fix`  | Áp dụng các sửa chữa được hỗ trợ, dùng lời nhắc trừ khi sửa chữa không tương tác là an toàn. |
| Lint   | `openclaw doctor --lint` | Phát hiện có cấu trúc, chỉ đọc cho CI, tiền kiểm, và cổng review.                            |

Ưu tiên `--lint` khi tự động hóa cần kết quả ổn định. Ưu tiên `--fix` khi một
người vận hành chủ động muốn doctor chỉnh sửa cấu hình hoặc trạng thái.

## Ví dụ

```bash
openclaw doctor
openclaw doctor --lint
openclaw doctor --lint --json
openclaw doctor --lint --severity-min warning
openclaw doctor --lint --all
openclaw doctor --lint --allow-exec
openclaw doctor --deep
openclaw doctor --fix
openclaw doctor --fix --non-interactive
openclaw doctor --generate-gateway-token
openclaw doctor --post-upgrade
openclaw doctor --post-upgrade --json
```

Với quyền theo từng kênh, hãy dùng các phép dò kênh thay vì `doctor`:

```bash
openclaw channels capabilities --channel discord --target channel:<channel-id>
openclaw channels status --probe
```

Phép dò năng lực Discord có mục tiêu báo cáo quyền kênh hiệu dụng của bot; phép dò trạng thái kiểm tra các kênh Discord đã cấu hình và mục tiêu tự động tham gia thoại.

## Tùy chọn

- `--no-workspace-suggestions`: tắt gợi ý bộ nhớ/tìm kiếm không gian làm việc
- `--yes`: chấp nhận mặc định mà không nhắc
- `--repair`: áp dụng các sửa chữa không phải dịch vụ được khuyến nghị mà không nhắc; cài đặt và ghi lại dịch vụ Gateway vẫn yêu cầu xác nhận tương tác hoặc lệnh Gateway rõ ràng
- `--fix`: bí danh cho `--repair`
- `--force`: áp dụng sửa chữa mạnh tay, bao gồm ghi đè cấu hình dịch vụ tùy chỉnh khi cần
- `--non-interactive`: chạy không có lời nhắc; chỉ di chuyển an toàn và sửa chữa không phải dịch vụ
- `--generate-gateway-token`: tạo và cấu hình token Gateway
- `--allow-exec`: cho phép doctor thực thi các SecretRefs exec đã cấu hình khi xác minh bí mật
- `--deep`: quét dịch vụ hệ thống để tìm các bản cài Gateway bổ sung và báo cáo các lần bàn giao khởi động lại gần đây của trình giám sát Gateway
- `--lint`: chạy kiểm tra tình trạng hiện đại hóa ở chế độ chỉ đọc và phát ra phát hiện chẩn đoán
- `--post-upgrade`: chạy các phép dò tương thích Plugin sau nâng cấp; phát hiện được xuất ra stdout; thoát với mã 1 nếu có bất kỳ phát hiện mức lỗi nào
- `--json`: với `--lint`, phát ra phát hiện JSON thay vì đầu ra cho con người; với `--post-upgrade`, phát ra phong bì JSON máy đọc được (`{ probesRun, findings }`)
- `--severity-min <level>`: với `--lint`, bỏ các phát hiện dưới `info`, `warning`, hoặc `error`
- `--all`: với `--lint`, chạy tất cả kiểm tra đã đăng ký, bao gồm các kiểm tra opt-in bị loại khỏi bộ tự động hóa mặc định
- `--skip <id>`: với `--lint`, bỏ qua một id kiểm tra; lặp lại để bỏ qua nhiều hơn một
- `--only <id>`: với `--lint`, chỉ chạy một id kiểm tra; lặp lại để chạy một bộ nhỏ đã chọn

## Chế độ lint

`openclaw doctor --lint` là chế độ tự động hóa chỉ đọc cho các kiểm tra doctor.
Nó dùng đường dẫn kiểm tra tình trạng có cấu trúc, không nhắc, và không sửa chữa
hoặc ghi lại cấu hình/trạng thái. Dùng trong CI, script tiền kiểm, và quy trình review
khi bạn muốn phát hiện máy đọc được thay vì lời nhắc sửa chữa có hướng dẫn.
Các tùy chọn đầu ra lint như `--json`, `--severity-min`, `--all`, `--only`, và `--skip`
chỉ được chấp nhận cùng với `--lint`.

```bash
openclaw doctor --lint
openclaw doctor --lint --severity-min warning
openclaw doctor --lint --json
openclaw doctor --lint --all
openclaw doctor --lint --allow-exec
openclaw doctor --lint --only core/doctor/gateway-config --json
```

Đầu ra cho con người rất gọn:

```text
doctor --lint: ran 6 check(s), 1 finding(s)
  [warning] core/doctor/gateway-config gateway.mode - gateway.mode is unset; gateway start will be blocked.
    fix: Run `openclaw configure` and set Gateway mode (local/remote), or `openclaw config set gateway.mode local`.
```

Đầu ra JSON là bề mặt scripting cho các lần chạy lint:

```json
{
  "ok": false,
  "checksRun": 5,
  "checksSkipped": 0,
  "findings": [
    {
      "checkId": "core/doctor/gateway-config",
      "severity": "warning",
      "message": "gateway.mode is unset; gateway start will be blocked.",
      "path": "gateway.mode",
      "fixHint": "Run `openclaw configure` and set Gateway mode (local/remote), or `openclaw config set gateway.mode local`."
    }
  ]
}
```

Hành vi thoát:

- `0`: không có phát hiện nào ở hoặc trên ngưỡng mức độ nghiêm trọng đã chọn
- `1`: ít nhất một phát hiện đạt ngưỡng đã chọn
- `2`: lỗi lệnh/runtime trước khi có thể tạo phát hiện lint

`--severity-min` kiểm soát cả phát hiện hiển thị lẫn ngưỡng thoát. Ví dụ,
`openclaw doctor --lint --severity-min error` có thể không in phát hiện nào và
thoát `0` ngay cả khi tồn tại các phát hiện `info` hoặc `warning` có mức độ thấp hơn.

`--all` kiểm soát các kiểm tra được chọn trước khi lọc theo mức độ nghiêm trọng. Lần chạy
lint mặc định là cổng tự động hóa ổn định và loại trừ các kiểm tra được cố ý
opt-in vì chúng sâu, mang tính lịch sử, hoặc dễ làm lộ phần dư cũ có thể sửa chữa hơn.
Dùng `--all` khi bạn muốn toàn bộ danh mục lint mà không cần liệt kê từng id kiểm tra.
`--only <id>` vẫn là bộ chọn chính xác nhất và có thể chạy bất kỳ kiểm tra đã đăng ký nào theo id.

## Kiểm Tra Tình Trạng Có Cấu Trúc

Các kiểm tra doctor hiện đại dùng một hợp đồng có cấu trúc nhỏ:

```ts
detect(ctx, scope?) -> HealthFinding[]
repair?(ctx, findings) -> HealthRepairResult
```

`detect()` cấp nguồn cho `doctor --lint`. `repair()` là tùy chọn và chỉ được xem xét
bởi `doctor --fix` / `doctor --repair`. Các kiểm tra chưa được di chuyển sang
hình dạng này tiếp tục dùng luồng đóng góp doctor cũ.

Việc tách này là có chủ ý: `detect()` sở hữu chẩn đoán, còn `repair()` sở hữu
việc báo cáo những gì nó đã thay đổi hoặc sẽ thay đổi. Ngữ cảnh sửa chữa có thể mang
yêu cầu `dryRun`/`diff`, và kết quả sửa chữa có thể trả về `diffs` có cấu trúc cho
chỉnh sửa cấu hình/tệp cộng với `effects` cho dịch vụ, tiến trình, gói, trạng thái, hoặc
tác dụng phụ khác. Điều đó cho phép các kiểm tra đã chuyển đổi phát triển hướng tới
`doctor --fix --dry-run` và báo cáo diff mà không chuyển lập kế hoạch đột biến vào `detect()`.

`repair()` báo cáo liệu nó đã thử sửa chữa được yêu cầu hay chưa bằng `status:
"repaired" | "skipped" | "failed"`. Bỏ qua status nghĩa là `repaired`, nên các
kiểm tra sửa chữa đơn giản chỉ cần trả về thay đổi. Khi sửa chữa trả về `skipped` hoặc
`failed`, doctor báo cáo lý do và không chạy xác thực cho kiểm tra đó.

Sau khi sửa chữa có cấu trúc thành công, doctor chạy lại `detect()` với các
phát hiện đã sửa làm phạm vi. Kiểm tra có thể dùng các phát hiện, đường dẫn, hoặc giá trị `ocPath`
được chọn để xác thực tập trung. Nếu phát hiện vẫn còn, doctor báo cáo một
cảnh báo sửa chữa thay vì coi thay đổi là đã hoàn tất âm thầm.

Một phát hiện bao gồm:

| Trường            | Mục đích                                                   |
| ----------------- | ---------------------------------------------------------- |
| `checkId`         | Id ổn định cho bộ lọc skip/only và danh sách cho phép CI.  |
| `severity`        | `info`, `warning`, hoặc `error`.                           |
| `message`         | Mô tả vấn đề con người đọc được.                           |
| `path`            | Cấu hình, tệp, hoặc đường dẫn logic khi có.                 |
| `line` / `column` | Vị trí nguồn khi có.                                       |
| `ocPath`          | Địa chỉ `oc://` chính xác khi một kiểm tra có thể trỏ đến. |
| `fixHint`         | Hành động vận hành được gợi ý hoặc tóm tắt sửa chữa.        |

Các kiểm tra doctor lõi đã hiện đại hóa vẫn gắn với đóng góp doctor có thứ tự
sở hữu hành vi `doctor` / `doctor --fix` cho con người của chúng. Registry tình trạng
có cấu trúc dùng chung là điểm mở rộng: các kiểm tra đi kèm và được Plugin hỗ trợ chạy
sau kiểm tra doctor lõi khi gói sở hữu của chúng đăng ký chúng trong đường dẫn lệnh
đang hoạt động. Đường dẫn con `openclaw/plugin-sdk/health` phơi bày cùng
hợp đồng cho các bên tiêu thụ mở rộng đó.

## Chọn Kiểm Tra

Dùng `--only` và `--skip` khi một quy trình muốn một cổng tập trung:

```bash
openclaw doctor --lint --only core/doctor/gateway-config --json
openclaw doctor --lint --skip core/doctor/skills-readiness
openclaw doctor --lint --all --skip core/doctor/session-locks
```

`--only` và `--skip` chấp nhận id kiểm tra đầy đủ và có thể được lặp lại. Nếu một id
`--only` chưa được đăng ký, không có kiểm tra nào chạy cho id đó; dùng các trường
`checksRun` và `checksSkipped` của lệnh để xác minh rằng một cổng tập trung đang chọn
đúng các kiểm tra bạn mong đợi.

## Chế độ sau nâng cấp

`openclaw doctor --post-upgrade` chạy các phép dò tương thích Plugin dành để được
nối chuỗi sau một bản build hoặc nâng cấp. Phát hiện được xuất ra stdout; lệnh
thoát với mã 1 nếu bất kỳ phát hiện nào có `level: "error"`. Thêm `--json` để nhận
một phong bì máy đọc được (`{ probesRun, findings }`) phù hợp cho CI,
Skills `fork-upgrade` cộng đồng, và công cụ smoke sau nâng cấp khác. Nếu
chỉ mục Plugin đã cài bị thiếu hoặc sai định dạng, chế độ JSON vẫn phát ra
phong bì đó với một phát hiện lỗi `plugin.index_unavailable`.

Ghi chú:

- Trong chế độ Nix (`OPENCLAW_NIX_MODE=1`), các kiểm tra doctor chỉ đọc vẫn hoạt động, nhưng `doctor --fix`, `doctor --repair`, `doctor --yes` và `doctor --generate-gateway-token` bị tắt vì `openclaw.json` là bất biến. Thay vào đó, hãy chỉnh sửa nguồn Nix cho bản cài đặt này; với nix-openclaw, hãy dùng [Bắt đầu nhanh](https://github.com/openclaw/nix-openclaw#quick-start) ưu tiên agent.
- Lời nhắc tương tác (như sửa keychain/OAuth) chỉ chạy khi stdin là TTY và **không** đặt `--non-interactive`. Các lần chạy không giao diện (cron, Telegram, không có terminal) sẽ bỏ qua lời nhắc.
- Hiệu năng: các lần chạy `doctor` không tương tác bỏ qua việc tải Plugin sớm để các kiểm tra sức khỏe không giao diện luôn nhanh. Các phiên doctor tương tác vẫn tải các bề mặt Plugin cần cho luồng sức khỏe và sửa chữa kế thừa.
- `--lint` nghiêm ngặt hơn `--non-interactive`: nó luôn chỉ đọc, không bao giờ nhắc và không bao giờ áp dụng các di chuyển an toàn. Chạy `doctor --fix` hoặc `doctor --repair` khi bạn muốn doctor thực hiện thay đổi.
- Theo mặc định, doctor không thực thi SecretRefs `exec` khi kiểm tra bí mật. Chỉ dùng `openclaw doctor --allow-exec` hoặc `openclaw doctor --lint --allow-exec` khi bạn chủ ý muốn doctor chạy các bộ phân giải bí mật đã cấu hình đó.
- `--fix` (bí danh của `--repair`) ghi một bản sao lưu vào `~/.openclaw/openclaw.json.bak` và loại bỏ các khóa cấu hình không xác định, liệt kê từng mục bị xóa.
- Các kiểm tra sức khỏe đã hiện đại hóa có thể cung cấp đường dẫn `repair()` cho `doctor --fix`; các kiểm tra không cung cấp đường dẫn này tiếp tục đi qua luồng sửa chữa doctor hiện có.
- `doctor --fix --non-interactive` báo cáo các định nghĩa dịch vụ Gateway bị thiếu hoặc lỗi thời nhưng không cài đặt hoặc ghi lại chúng bên ngoài chế độ sửa chữa cập nhật. Chạy `openclaw gateway install` khi thiếu dịch vụ, hoặc `openclaw gateway install --force` khi bạn chủ ý muốn thay thế launcher.
- Các kiểm tra toàn vẹn trạng thái giờ phát hiện tệp transcript mồ côi trong thư mục sessions. Việc lưu trữ chúng dưới dạng `.deleted.<timestamp>` cần xác nhận tương tác; `--fix`, `--yes` và các lần chạy không giao diện giữ nguyên chúng tại chỗ.
- Doctor cũng quét `~/.openclaw/cron/jobs.json` (hoặc `cron.store`) để tìm các dạng cron job kế thừa và ghi lại chúng trước khi nhập các hàng chuẩn vào SQLite.
- Doctor báo cáo các cron job có ghi đè `payload.model` rõ ràng, bao gồm số lượng namespace của provider và các điểm không khớp với `agents.defaults.model`, để các công việc đã lập lịch không kế thừa model mặc định có thể được nhìn thấy trong quá trình điều tra xác thực hoặc thanh toán.
- Trên Linux, doctor cảnh báo khi crontab của người dùng vẫn chạy `~/.openclaw/bin/ensure-whatsapp.sh` kế thừa; script đó không còn được bảo trì và có thể ghi nhận sai sự cố ngừng hoạt động của WhatsApp gateway khi cron thiếu môi trường systemd user-bus.
- Khi WhatsApp được bật, doctor kiểm tra vòng lặp sự kiện Gateway bị suy giảm trong khi các client `openclaw-tui` cục bộ vẫn đang chạy. `doctor --fix` chỉ dừng các client TUI cục bộ đã xác minh để các phản hồi WhatsApp không bị xếp hàng sau các vòng lặp làm mới TUI cũ.
- Doctor ghi lại các ref model `openai-codex/*` kế thừa thành ref `openai/*` chuẩn trên các model chính, fallback, model tạo hình ảnh/video, ghi đè heartbeat/subagent/compaction, hook, ghi đè model theo kênh và các ghim tuyến phiên cũ. `--fix` cũng di chuyển các hồ sơ xác thực `openai-codex:*` kế thừa và mục `auth.order.openai-codex` sang `openai:*`, chuyển ý định Codex vào các mục `agentRuntime.id: "codex"` theo phạm vi provider/model, xóa các ghim runtime toàn agent/phiên cũ và giữ các ref agent OpenAI đã sửa trên định tuyến xác thực Codex thay vì xác thực bằng khóa API OpenAI trực tiếp.
- Doctor dọn trạng thái staging phụ thuộc Plugin kế thừa do các phiên bản OpenClaw cũ tạo ra và liên kết lại gói `openclaw` của host cho các Plugin npm được quản lý khai báo nó là peer dependency. Doctor cũng sửa các Plugin có thể tải xuống bị thiếu đang được cấu hình tham chiếu, chẳng hạn như `plugins.entries`, các kênh đã cấu hình, cài đặt provider/tìm kiếm đã cấu hình hoặc runtime agent đã cấu hình. Trong quá trình cập nhật gói, doctor bỏ qua sửa chữa Plugin bằng package-manager cho đến khi việc hoán đổi gói hoàn tất; chạy lại `openclaw doctor --fix` sau đó nếu một Plugin đã cấu hình vẫn cần khôi phục. Nếu tải xuống thất bại, doctor báo cáo lỗi cài đặt và giữ lại mục Plugin đã cấu hình cho lần sửa chữa tiếp theo.
- Doctor sửa cấu hình Plugin cũ bằng cách xóa các id Plugin bị thiếu khỏi `plugins.allow`/`plugins.deny`/`plugins.entries`, cùng với cấu hình kênh treo tương ứng, mục tiêu heartbeat và ghi đè model theo kênh khi khám phá Plugin khỏe mạnh.
- Doctor cách ly cấu hình Plugin không hợp lệ bằng cách tắt mục `plugins.entries.<id>` bị ảnh hưởng và xóa payload `config` không hợp lệ của nó. Khởi động Gateway vốn đã chỉ bỏ qua Plugin lỗi đó để các Plugin và kênh khác có thể tiếp tục chạy.
- Đặt `OPENCLAW_SERVICE_REPAIR_POLICY=external` khi một supervisor khác sở hữu vòng đời gateway. Doctor vẫn báo cáo sức khỏe gateway/dịch vụ và áp dụng các sửa chữa không liên quan đến dịch vụ, nhưng bỏ qua cài đặt/khởi động/khởi động lại/bootstrap dịch vụ và dọn dẹp dịch vụ kế thừa.
- Trên Linux, doctor bỏ qua các đơn vị systemd giống gateway bổ sung nhưng không hoạt động và không ghi lại metadata lệnh/entrypoint cho một dịch vụ gateway systemd đang chạy trong quá trình sửa chữa. Dừng dịch vụ trước hoặc dùng `openclaw gateway install --force` khi bạn chủ ý muốn thay thế launcher đang hoạt động.
- Doctor tự động di chuyển cấu hình Talk phẳng kế thừa (`talk.voiceId`, `talk.modelId` và các mục tương tự) vào `talk.provider` + `talk.providers.<provider>`.
- Các lần chạy lặp lại `doctor --fix` không còn báo cáo/áp dụng chuẩn hóa Talk khi khác biệt duy nhất là thứ tự khóa trong object.
- Doctor bao gồm kiểm tra sẵn sàng tìm kiếm bộ nhớ và có thể đề xuất `openclaw configure --section model` khi thiếu thông tin xác thực embedding.
- Doctor cảnh báo khi chưa cấu hình chủ sở hữu lệnh. Chủ sở hữu lệnh là tài khoản người vận hành được phép chạy các lệnh chỉ dành cho chủ sở hữu và phê duyệt các hành động nguy hiểm. Ghép cặp DM chỉ cho phép ai đó nói chuyện với bot; nếu bạn đã phê duyệt một người gửi trước khi bootstrap chủ sở hữu đầu tiên tồn tại, hãy đặt `commands.ownerAllowFrom` rõ ràng.
- Doctor báo cáo một ghi chú thông tin khi các agent chế độ Codex được cấu hình và tài sản Codex CLI cá nhân tồn tại trong Codex home của người vận hành. Các lần khởi chạy app-server Codex cục bộ dùng home riêng biệt theo từng agent, vì vậy hãy cài đặt Plugin Codex trước nếu cần, rồi dùng `openclaw migrate plan codex` để kiểm kê những tài sản cần được thăng cấp có chủ đích.
- Doctor xóa `plugins.entries.codex.config.codexDynamicToolsProfile` đã ngừng dùng; app-server Codex luôn giữ các công cụ workspace gốc Codex ở dạng gốc.
- Doctor cảnh báo khi Skills được phép cho agent mặc định không khả dụng trong môi trường runtime hiện tại vì thiếu bin, biến môi trường, cấu hình hoặc yêu cầu hệ điều hành. `doctor --fix` có thể tắt các Skills không khả dụng đó bằng `skills.entries.<skill>.enabled=false`; hãy cài đặt/cấu hình yêu cầu còn thiếu nếu bạn muốn giữ skill hoạt động.
- Nếu chế độ sandbox được bật nhưng Docker không khả dụng, doctor báo cáo cảnh báo tín hiệu cao kèm cách khắc phục (`install Docker` hoặc `openclaw config set agents.defaults.sandbox.mode off`).
- Nếu có các tệp registry sandbox kế thừa hoặc thư mục shard (`~/.openclaw/sandbox/containers.json`, `~/.openclaw/sandbox/browsers.json`, `~/.openclaw/sandbox/containers/` hoặc `~/.openclaw/sandbox/browsers/`), doctor báo cáo chúng; `openclaw doctor --fix` di chuyển các mục hợp lệ vào SQLite và cách ly các tệp kế thừa không hợp lệ.
- Nếu `gateway.auth.token`/`gateway.auth.password` do SecretRef quản lý và không khả dụng trong đường dẫn lệnh hiện tại, doctor báo cáo cảnh báo chỉ đọc và không ghi thông tin xác thực fallback dạng văn bản thuần. Với SecretRefs dựa trên exec, doctor bỏ qua thực thi trừ khi có `--allow-exec`.
- Nếu kiểm tra SecretRef của kênh thất bại trong đường dẫn sửa lỗi, doctor tiếp tục và báo cáo cảnh báo thay vì thoát sớm.
- Sau các di chuyển thư mục trạng thái, doctor cảnh báo khi tài khoản Telegram hoặc Discord mặc định đã bật phụ thuộc vào fallback biến môi trường và `TELEGRAM_BOT_TOKEN` hoặc `DISCORD_BOT_TOKEN` không khả dụng cho tiến trình doctor.
- Tự động phân giải username `allowFrom` của Telegram (`doctor --fix`) cần một token Telegram có thể phân giải trong đường dẫn lệnh hiện tại. Nếu kiểm tra token không khả dụng, doctor báo cáo cảnh báo và bỏ qua tự động phân giải cho lượt đó.

## macOS: ghi đè env `launchctl`

Nếu trước đây bạn đã chạy `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (hoặc `...PASSWORD`), giá trị đó ghi đè tệp cấu hình của bạn và có thể gây lỗi "unauthorized" kéo dài.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## Liên quan

- [Tham chiếu CLI](/vi/cli)
- [Gateway doctor](/vi/gateway/doctor)
