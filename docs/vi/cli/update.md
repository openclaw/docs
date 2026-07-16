---
read_when:
    - Bạn muốn cập nhật bản sao mã nguồn một cách an toàn
    - Bạn đang gỡ lỗi đầu ra hoặc tùy chọn của `openclaw update`
    - Bạn cần hiểu hành vi viết tắt `--update`
summary: Tài liệu tham khảo CLI cho `openclaw update` (cập nhật mã nguồn tương đối an toàn + tự động khởi động lại Gateway)
title: Cập nhật
x-i18n:
    generated_at: "2026-07-16T14:15:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: b46696f6b9cba5c318f870bcb6c5ea8e0652940968da2ad85e86709fe4c11146
    source_path: cli/update.md
    workflow: 16
---

# `openclaw update`

Cập nhật OpenClaw và chuyển đổi giữa các kênh stable/extended-stable/beta/dev.

Nếu bạn đã cài đặt qua **npm/pnpm/bun** (cài đặt toàn cục, không có siêu dữ liệu git),
việc cập nhật được thực hiện theo quy trình của trình quản lý gói được mô tả trong
[Cập nhật](/vi/install/updating).

## Cách sử dụng

```bash
openclaw update
openclaw update status
openclaw update repair
openclaw update wizard
openclaw update --channel extended-stable
openclaw update --channel beta
openclaw update --channel dev
openclaw update --tag beta
openclaw update --tag main
openclaw update --dry-run
openclaw update --no-restart
openclaw update --yes
openclaw update --acknowledge-clawhub-risk
openclaw update --json
openclaw --update
```

`openclaw --update` được chuyển thành `openclaw update` (hữu ích cho shell và
tập lệnh trình khởi chạy).

## Tùy chọn

| Cờ                                               | Mô tả                                                                                                                                                                                                                                                                                                                                        |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--no-restart`                                   | Bỏ qua việc khởi động lại dịch vụ Gateway sau khi cập nhật thành công. Các bản cập nhật qua trình quản lý gói có khởi động lại sẽ xác minh rằng dịch vụ đã khởi động lại báo cáo đúng phiên bản dự kiến trước khi lệnh hoàn tất thành công.                                                                                                    |
| `--channel <stable\|extended-stable\|beta\|dev>` | Đặt kênh cập nhật và lưu kênh đó sau khi cập nhật lõi thành công. Extended-stable chỉ dành cho gói.                                                                                                                                                                                                                                           |
| `--tag <dist-tag\|version\|spec>`                | Ghi đè đích gói chỉ cho lần cập nhật này. Không thể kết hợp tùy chọn này với kênh `extended-stable` đang có hiệu lực, vì kênh đó bắt buộc phải dùng đích chính xác đã được xác minh. Đối với các bản cài đặt gói khác, `main` ánh xạ tới `github:openclaw/openclaw#main`; thông số nguồn GitHub/git được đóng gói vào một tarball tạm thời trước khi cài đặt npm toàn cục theo từng giai đoạn. |
| `--dry-run`                                      | Xem trước các hành động dự kiến (luồng kênh/thẻ/đích/khởi động lại) mà không ghi cấu hình, cài đặt, đồng bộ Plugin hoặc khởi động lại.                                                                                                                                                                                                         |
| `--json`                                         | In JSON `UpdateRunResult` mà máy có thể đọc. Bao gồm `postUpdate.plugins.warnings` khi một Plugin được quản lý cần sửa chữa, thông tin chi tiết về phương án dự phòng Plugin của kênh beta và `postUpdate.plugins.integrityDrifts` khi phát hiện sai lệch tạo phẩm Plugin npm trong quá trình đồng bộ sau cập nhật. |
| `--timeout <seconds>`                            | Thời gian chờ cho mỗi bước. Mặc định là `1800`.                                                                                                                                                                                                                                                                                   |
| `--yes`                                          | Bỏ qua lời nhắc xác nhận (ví dụ: xác nhận hạ cấp).                                                                                                                                                                                                                                                                                            |
| `--acknowledge-clawhub-risk`                     | Cho phép quá trình đồng bộ Plugin sau cập nhật tiếp tục bất chấp cảnh báo tin cậy về ClawHub cộng đồng mà không cần lời nhắc tương tác. Nếu không có tùy chọn này, các bản phát hành cộng đồng có rủi ro sẽ bị bỏ qua và giữ nguyên khi OpenClaw không thể hiển thị lời nhắc. Các gói ClawHub chính thức và nguồn Plugin đi kèm không cần lời nhắc này. |

Không có cờ `--verbose`. Hãy dùng `--dry-run` để xem trước các hành động dự kiến,
`--json` để nhận kết quả mà máy có thể đọc và `openclaw update status --json`
để chỉ xem kênh/tính khả dụng. Độ chi tiết của bảng điều khiển Gateway (`--verbose`) và
mức nhật ký tệp (`logging.level: "debug"`/`"trace"`) là các thiết lập độc lập; xem
[Ghi nhật ký Gateway](/vi/gateway/logging).

<Note>
Ở chế độ Nix (`OPENCLAW_NIX_MODE=1`), các lần chạy `openclaw update` có thay đổi dữ liệu bị vô hiệu hóa. Thay vào đó, hãy cập nhật nguồn Nix hoặc đầu vào flake cho bản cài đặt này; đối với nix-openclaw, hãy sử dụng [Bắt đầu nhanh](https://github.com/openclaw/nix-openclaw#quick-start) ưu tiên tác nhân. `openclaw update status` và `openclaw update --dry-run` vẫn chỉ đọc.
</Note>

<Warning>
Việc hạ cấp yêu cầu xác nhận vì các phiên bản cũ hơn có thể làm hỏng cấu hình.
Nếu bản cài đặt đã di chuyển các phiên sang SQLite, hãy khôi phục các tạo phẩm bản ghi
cũ đã lưu trữ trước khi khởi động một phiên bản cũ hơn sử dụng tệp. Xem
[Doctor: Hạ cấp sau khi di chuyển phiên sang SQLite](/vi/cli/doctor#downgrading-after-session-sqlite-migration).
</Warning>

## `update status`

Hiển thị kênh cập nhật đang hoạt động, thẻ/nhánh/SHA git (chỉ dành cho bản sao mã nguồn),
và tính khả dụng của bản cập nhật.

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

| Cờ                    | Mặc định | Mô tả                                  |
| --------------------- | -------- | -------------------------------------- |
| `--json`              | `false` | In JSON trạng thái mà máy có thể đọc. |
| `--timeout <seconds>` | `3`     | Thời gian chờ để kiểm tra.             |

Đối với các bản cài đặt gói extended-stable, trạng thái thực hiện cùng bộ chọn công khai
và quy trình xác minh gói chính xác như khi cập nhật ở nền trước. Trạng thái có thể báo cáo
`ahead of extended-stable` khi phiên bản đã cài đặt mới hơn. Các lỗi JSON
bao gồm `registry.reason` (`selector_missing`, `selector_query_failed`,
`exact_package_mismatch` hoặc `unsupported_git_channel`).

## `update repair`

Chạy lại quá trình hoàn tất cập nhật sau khi gói lõi đã thay đổi nhưng công việc
sửa chữa tiếp theo chưa hoàn tất đúng cách. Đây là quy trình khôi phục được hỗ trợ khi
`openclaw update` đã cài đặt gói lõi mới nhưng quá trình đồng bộ Plugin sau khi cập nhật lõi,
siêu dữ liệu Plugin npm được quản lý, làm mới sổ đăng ký hoặc sửa chữa bằng doctor
chưa hội tụ.

```bash
openclaw update repair
openclaw update repair --channel beta
openclaw update repair --acknowledge-clawhub-risk
openclaw update repair --json
```

| Cờ                                               | Mô tả                                                                                                                                                                                                                                                                       |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--channel <stable\|extended-stable\|beta\|dev>` | Lưu kênh cập nhật lõi trước khi sửa chữa. Đối với extended-stable, các Plugin npm chính thức đủ điều kiện tuân theo ý định trần/mặc định hoặc `latest` sẽ nhắm đến đúng phiên bản lõi đã cài đặt. Sửa chữa extended-stable bị từ chối trên các bản sao Git mà không thay đổi cấu hình. |
| `--json`                                         | In JSON hoàn tất mà máy có thể đọc.                                                                                                                                                                                                                                        |
| `--timeout <seconds>`                            | Thời gian chờ cho các bước sửa chữa. Mặc định là `1800`.                                                                                                                                                                                                        |
| `--yes`                                          | Bỏ qua lời nhắc xác nhận.                                                                                                                                                                                                                                                   |
| `--acknowledge-clawhub-risk`                     | Hành vi giống như trên `openclaw update`.                                                                                                                                                                                                                                  |
| `--no-restart`                                   | Được chấp nhận để đảm bảo tính tương đương; quá trình sửa chữa không bao giờ khởi động lại Gateway.                                                                                                                                                                         |

`update repair` chạy `openclaw doctor --fix`, tải lại cấu hình đã sửa chữa và
bản ghi cài đặt, đồng bộ các Plugin được theo dõi cho kênh cập nhật đang hoạt động, cập nhật
các bản cài đặt Plugin npm được quản lý, sửa chữa các tải trọng Plugin được cấu hình bị thiếu,
làm mới sổ đăng ký Plugin và ghi siêu dữ liệu bản ghi cài đặt đã hội tụ.
Lệnh này không cài đặt gói lõi mới và không khởi động lại Gateway.

## `update wizard`

Luồng tương tác để chọn kênh cập nhật và xác nhận có khởi động lại
Gateway sau đó hay không (mặc định là khởi động lại). Việc chọn `dev` khi không có bản sao git
sẽ đưa ra tùy chọn tạo một bản sao.

| Cờ                    | Mặc định | Mô tả                                |
| --------------------- | -------- | ------------------------------------ |
| `--timeout <seconds>` | `1800`  | Thời gian chờ cho mỗi bước cập nhật. |

## Chức năng

Việc chuyển kênh một cách rõ ràng (`--channel ...`) cũng giữ cho phương thức cài đặt
được căn chỉnh:

- `dev` -> đảm bảo có một bản sao git (mặc định là `~/openclaw`, hoặc
  `$OPENCLAW_HOME/openclaw` khi `OPENCLAW_HOME` được đặt; ghi đè bằng
  `OPENCLAW_GIT_DIR`), cập nhật bản sao đó và cài đặt CLI toàn cục từ
  bản sao đó.
- `stable` -> cài đặt từ npm bằng `latest`.
- `extended-stable` -> phân giải bộ chọn npm `extended-stable` công khai,
  xác minh chính xác gói đã chọn và cài đặt đúng phiên bản đó. Quy trình này
  không chuyển sang bộ chọn khác làm phương án dự phòng và bị từ chối đối với các bản sao Git.
- `beta` -> ưu tiên dist-tag npm `beta`, chuyển sang `latest` làm phương án dự phòng khi bản beta
  bị thiếu hoặc cũ hơn bản phát hành stable hiện tại.

### Bàn giao khởi động lại

Trình tự động cập nhật lõi Gateway (khi được bật qua cấu hình) khởi chạy đường dẫn
cập nhật CLI bên ngoài trình xử lý yêu cầu Gateway đang hoạt động. Các bản cập nhật
qua trình quản lý gói `update.run` của mặt phẳng điều khiển và các bản cập nhật
bản sao git có giám sát sử dụng cùng cơ chế bàn giao dịch vụ được quản lý thay vì thay thế cây gói hoặc
xây dựng lại `dist/` bên trong tiến trình Gateway đang hoạt động: Gateway khởi động một
trình trợ giúp tách rời rồi thoát, và trình trợ giúp đó chạy `openclaw update --yes --json`
từ bên ngoài cây tiến trình Gateway. Nếu cơ chế bàn giao không khả dụng,
`update.run` trả về một phản hồi có cấu trúc kèm lệnh shell an toàn để chạy
thủ công.

Các lựa chọn extended-stable đã lưu sẽ nhận các gợi ý khởi động chỉ đọc và cập nhật
mỗi 24 giờ khi `update.checkOnStart` được bật. Các kiểm tra này không bao giờ áp dụng bản cập nhật,
bắt đầu bàn giao, khởi động lại Gateway, sử dụng độ trễ/độ lệch ngẫu nhiên của stable hoặc sử dụng
nhịp thăm dò beta. Các bản cập nhật foreground rõ ràng, bản cập nhật foreground trần với
`update.channel: "extended-stable"` đã lưu, trạng thái theo yêu cầu và quy trình bàn giao
Gateway được quản lý của chúng vẫn được hỗ trợ.

Khi một dịch vụ Gateway được quản lý cục bộ đã được cài đặt và tính năng khởi động lại được bật,
các bản cập nhật qua trình quản lý gói và git checkout sẽ dừng dịch vụ đang chạy trước khi
thay thế cây gói hoặc sửa đổi đầu ra checkout/build. Sau đó, trình cập nhật
làm mới siêu dữ liệu dịch vụ, khởi động lại dịch vụ và xác minh
Gateway đã khởi động lại trước khi báo cáo `Gateway: restarted and verified.`.
Các bản cập nhật qua trình quản lý gói còn xác minh rằng Gateway đã khởi động lại báo cáo
phiên bản gói dự kiến; các bản cập nhật git checkout xác minh tình trạng của Gateway và
mức độ sẵn sàng của dịch vụ sau khi build lại.

Các bản cập nhật qua trình quản lý gói thường tiếp tục sử dụng tệp nhị phân Node được ghi trong
dịch vụ được quản lý. Nếu Node đó không thể chạy bản phát hành đích, nhưng Node của
CLI hiện tại có thể chạy và dịch vụ được chứng minh là thuộc về gói đang được cập nhật,
một bản cập nhật có bật khởi động lại sẽ sử dụng Node hiện tại để hoàn tất và ghi lại
siêu dữ liệu dịch vụ theo runtime đó. `--no-restart` không thể sửa siêu dữ liệu
dịch vụ, vì vậy trường hợp runtime không khớp tương tự sẽ dừng trước khi sửa đổi gói.

Trên macOS, bước kiểm tra sau cập nhật cũng xác minh LaunchAgent đang
được tải/chạy cho hồ sơ đang hoạt động và cổng loopback đã cấu hình
hoạt động bình thường. Nếu plist đã được cài đặt nhưng launchd không giám sát nó, OpenClaw
tự động bootstrap lại LaunchAgent và chạy lại các kiểm tra tình trạng/phiên bản/
mức độ sẵn sàng của kênh (một lần bootstrap mới sẽ tải trực tiếp tác vụ `RunAtLoad`,
do đó quá trình khôi phục không ngay lập tức `kickstart -k` Gateway vừa được tạo). Nếu
Gateway vẫn không hoạt động bình thường, lệnh sẽ thoát với mã khác 0 và
in đường dẫn nhật ký khởi động lại cùng hướng dẫn khởi động lại, cài đặt lại và hoàn tác
gói.

Nếu không thể khởi động lại, lệnh sẽ in `Gateway: restart skipped (...)` hoặc
`Gateway: restart failed: ...` cùng gợi ý `openclaw gateway restart` thủ công.
Với `--no-restart`, việc thay thế gói hoặc build lại git vẫn chạy, nhưng
dịch vụ được quản lý không bị dừng hoặc khởi động lại, vì vậy Gateway đang chạy tiếp tục dùng
mã cũ cho đến khi bạn khởi động lại thủ công.

### Hình dạng phản hồi của mặt phẳng điều khiển

Khi `update.run` chạy qua mặt phẳng điều khiển Gateway trên một bản cài đặt
qua trình quản lý gói hoặc git checkout được giám sát, trình xử lý báo cáo việc khởi tạo bàn giao
riêng với bản cập nhật CLI tiếp tục sau khi Gateway thoát:

- `ok: true`, `result.status: "skipped"`,
  `result.reason: "managed-service-handoff-started"` và
  `handoff.status: "started"`: Gateway đã tạo quy trình bàn giao dịch vụ được quản lý
  và lên lịch tự khởi động lại để trình trợ giúp tách rời có thể chạy
  `openclaw update --yes --json` bên ngoài tiến trình dịch vụ trực tiếp.
- `ok: false`, `result.reason: "managed-service-handoff-unavailable"` và
  `handoff.status: "unavailable"`: OpenClaw không thể tìm thấy ranh giới dịch vụ giám sát
  và danh tính dịch vụ bền vững để bàn giao an toàn (ví dụ:
  quy trình bàn giao systemd yêu cầu danh tính đơn vị `OPENCLAW_SYSTEMD_UNIT`,
  chứ không chỉ các dấu hiệu tiến trình systemd trong môi trường). Phản hồi bao gồm
  `handoff.command`, lệnh shell cần chạy từ bên ngoài Gateway.
- `ok: false`, `result.reason: "managed-service-handoff-failed"`: Gateway
  đã cố tạo quy trình bàn giao nhưng không thể tạo trình trợ giúp tách rời.

Payload `sentinel` được ghi trước khi Gateway thoát và quy trình bàn giao
CLI cập nhật cùng sentinel khởi động lại đó sau khi hoàn tất các kiểm tra
tình trạng khởi động lại dịch vụ được quản lý. Trong quá trình bàn giao, sentinel có thể chứa
`stats.reason: "restart-health-pending"` mà không có phần tiếp tục thành công;
Gateway đã khởi động lại sẽ thăm dò nó và chỉ kích hoạt phần tiếp tục sau khi CLI đã
xác minh tình trạng dịch vụ và ghi lại sentinel với kết quả `ok` cuối cùng.
`openclaw status` và `openclaw status --all` hiển thị một hàng `Update restart`
khi sentinel đó đang chờ xử lý hoặc thất bại, còn `update.status` làm mới và
trả về sentinel mới nhất.

## Luồng git checkout

### Chọn kênh

- `stable`: checkout thẻ không phải beta mới nhất, sau đó build và chạy doctor.
- `beta`: ưu tiên thẻ `-beta` mới nhất, chuyển sang thẻ stable mới nhất
  khi beta không tồn tại hoặc cũ hơn.
- `dev`: checkout `main`, sau đó fetch và rebase.
- `extended-stable`: không được hỗ trợ cho Git checkout; không có thay đổi
  checkout nào xảy ra.

### Các bước cập nhật

<Steps>
  <Step title="Xác minh worktree sạch">
    Yêu cầu không có thay đổi chưa commit.
  </Step>
  <Step title="Chuyển kênh">
    Chuyển sang kênh đã chọn (thẻ hoặc nhánh).
  </Step>
  <Step title="Fetch upstream">
    Chỉ dành cho dev.
  </Step>
  <Step title="Build kiểm tra sơ bộ (chỉ dành cho dev)">
    Chạy bản build TypeScript trong một worktree tạm thời. Nếu tip thất bại, lùi lại tối đa 10 commit để tìm commit mới nhất có thể build. Đặt `OPENCLAW_UPDATE_PREFLIGHT_LINT=1` để cũng chạy lint trong bước kiểm tra sơ bộ này; lint chạy ở chế độ tuần tự có giới hạn vì máy chủ cập nhật của người dùng thường nhỏ hơn runner CI.
  </Step>
  <Step title="Rebase">
    Rebase lên commit đã chọn (chỉ dành cho dev).
  </Step>
  <Step title="Cài đặt các phần phụ thuộc">
    Sử dụng trình quản lý gói của repo. Đối với các checkout pnpm, trình cập nhật bootstrap `pnpm` theo yêu cầu (trước tiên qua `corepack`, sau đó dùng `npm install pnpm@11` tạm thời làm phương án dự phòng) thay vì chạy `npm run build` bên trong workspace pnpm. Nếu bootstrap pnpm vẫn thất bại, trình cập nhật dừng sớm với lỗi dành riêng cho trình quản lý gói thay vì thử `npm run build` trong checkout.
  </Step>
  <Step title="Build giao diện điều khiển">
    Build gateway và giao diện điều khiển.
  </Step>
  <Step title="Chạy doctor">
    `openclaw doctor` chạy như bước kiểm tra cập nhật an toàn cuối cùng.
  </Step>
  <Step title="Đồng bộ Plugin">
    Đồng bộ các Plugin với kênh đang hoạt động. Dev sử dụng các Plugin đi kèm; stable và beta sử dụng npm. Cập nhật các bản cài đặt Plugin được theo dõi.
  </Step>
</Steps>

### Chi tiết đồng bộ Plugin

Trên kênh beta, các bản cài đặt Plugin npm và ClawHub được theo dõi đang sử dụng
nhánh default/latest sẽ thử bản phát hành Plugin `@beta` trước. Nếu Plugin không có
bản phát hành beta, OpenClaw sẽ quay lại đặc tả default/latest đã ghi và
báo cảnh báo. Đối với Plugin npm, OpenClaw cũng quay lại khi gói beta
tồn tại nhưng không vượt qua xác thực cài đặt. Những cảnh báo dự phòng này không
làm hỏng bản cập nhật lõi. Phiên bản chính xác và thẻ rõ ràng không bao giờ bị ghi lại.

<Warning>
Nếu một bản cập nhật Plugin npm được ghim phiên bản chính xác phân giải thành một artifact có tính toàn vẹn khác với bản ghi cài đặt đã lưu, `openclaw update` sẽ hủy cập nhật artifact Plugin đó thay vì cài đặt. Chỉ cài đặt lại hoặc cập nhật Plugin một cách rõ ràng sau khi xác minh rằng bạn tin cậy artifact mới.
</Warning>

<Note>
Các lỗi đồng bộ Plugin sau cập nhật được giới hạn trong một Plugin được quản lý và có thể được đường dẫn đồng bộ định tuyến vòng qua (ví dụ: registry npm không thể truy cập đối với một Plugin không thiết yếu) được báo cáo dưới dạng cảnh báo sau khi bản cập nhật lõi thành công. Kết quả JSON giữ `status: "ok"` cập nhật cấp cao nhất và báo cáo `postUpdate.plugins.status: "warning"` cùng hướng dẫn `openclaw update repair` và `openclaw plugins inspect <id> --runtime --json`. Các ngoại lệ ngoài dự kiến của trình cập nhật hoặc đồng bộ vẫn làm kết quả cập nhật thất bại. Khắc phục lỗi cài đặt hoặc cập nhật Plugin, sau đó chạy lại `openclaw update repair`. Khi một bản cập nhật thất bại khiến Plugin được quản lý không thể sử dụng, OpenClaw sẽ vô hiệu hóa mục runtime của Plugin và đặt lại các slot đang hoạt động mà không thay đổi chính sách `plugins.allow` hoặc `plugins.deny` do người vận hành tạo.

Sau bước đồng bộ từng Plugin, `openclaw update` chạy một lượt **hội tụ sau lõi** bắt buộc trước khi gateway khởi động lại: sửa các payload Plugin đã cấu hình còn thiếu, xác thực từng bản ghi cài đặt được theo dõi đang _hoạt động_ trên đĩa và xác minh tĩnh rằng `package.json` có thể phân tích cú pháp (và mọi `main` được khai báo rõ ràng đều tồn tại). Các lỗi từ lượt này và snapshot cấu hình không hợp lệ sẽ trả về `postUpdate.plugins.status: "error"` và chuyển `status` cập nhật cấp cao nhất thành `"error"`, khiến `openclaw update` thoát với mã khác 0 và gateway _không_ được khởi động lại với một tập hợp Plugin chưa được xác minh. Lỗi bao gồm các dòng `postUpdate.plugins.warnings[].guidance` có cấu trúc trỏ đến `openclaw update repair` và `openclaw plugins inspect <id> --runtime --json`. Các mục Plugin bị vô hiệu hóa và các bản ghi không phải mục tiêu đồng bộ chính thức được liên kết với nguồn đáng tin cậy sẽ bị bỏ qua tại đây (phản ánh chính sách `skipDisabledPlugins` được dùng trong bước kiểm tra payload còn thiếu), vì vậy một bản ghi Plugin bị vô hiệu hóa đã lỗi thời không thể chặn một bản cập nhật hợp lệ khác.

Khi Gateway đã cập nhật khởi động, việc tải Plugin chỉ thực hiện xác minh: quá trình khởi động không chạy trình quản lý gói hoặc sửa đổi cây phần phụ thuộc. Các lần khởi động lại `update.run` qua trình quản lý gói được bàn giao cho đường dẫn dịch vụ được quản lý của CLI, do đó việc hoán đổi gói diễn ra bên ngoài tiến trình Gateway cũ và các kiểm tra tình trạng dịch vụ quyết định liệu bản cập nhật có thể được báo cáo là hoàn tất hay không.
</Note>

Sau khi bản cập nhật lõi extended-stable thành công, tính toàn vẹn và
hội tụ Plugin sau lõi nhắm đến các Plugin npm chính thức đủ điều kiện tại đúng phiên bản lõi
đã cài đặt. Đối với ý định default/`latest`, OpenClaw không truy vấn
`@extended-stable` của Plugin hoặc quay lại `latest` của npm; thay vào đó, OpenClaw suy ra phiên bản gói
từ lõi đã cài đặt. Các bản ghim phiên bản rõ ràng, thẻ rõ ràng không phải `latest`,
gói bên thứ ba và nguồn không phải npm giữ nguyên ý định hiện có.

Đối với bản cài đặt qua trình quản lý gói, `openclaw update` phân giải phiên bản gói
đích trước khi gọi trình quản lý gói. Các bản cài đặt npm toàn cục sử dụng quy trình cài đặt
theo giai đoạn: OpenClaw cài đặt gói mới vào một prefix npm tạm thời,
cho phép gói ứng viên xác thực phiên bản Node của máy chủ trong `preinstall`,
và xác minh kho `dist` đóng gói tại đó. Một bộ bảo vệ hoàn tất đóng gói
nằm ngoài kho đó cho đến khi `preinstall` thành công, vì vậy các trình quản lý gói
bỏ qua script vòng đời cũng dừng trước khi kích hoạt. Trên npm 12 trở lên,
trình cập nhật chỉ phê duyệt vòng đời OpenClaw của ứng viên; script của
phần phụ thuộc bắc cầu vẫn bị chặn. Sau đó, OpenClaw hoán đổi cây gói sạch
vào prefix toàn cục thực. Nếu xác minh thất bại, doctor sau cập nhật, đồng bộ Plugin
và công việc khởi động lại sẽ không chạy từ cây đáng ngờ. Ngay cả khi
phiên bản đã cài đặt khớp với đích, lệnh vẫn làm mới
bản cài đặt gói toàn cục, sau đó chạy đồng bộ Plugin, làm mới phần hoàn thành
lệnh lõi và công việc khởi động lại. Điều này giữ các sidecar đóng gói và bản ghi
Plugin thuộc sở hữu của kênh đồng bộ với bản build OpenClaw đã cài đặt, đồng thời để việc
build lại phần hoàn thành đầy đủ cho lệnh Plugin cho các lần chạy
`openclaw completion --write-state` rõ ràng.

## Liên quan

- `openclaw doctor` (đề nghị chạy cập nhật trước trên git checkout)
- [Kênh phát triển](/vi/install/development-channels)
- [Cập nhật](/vi/install/updating)
- [Tài liệu tham khảo CLI](/vi/cli)
