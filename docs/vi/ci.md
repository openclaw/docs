---
read_when:
    - Bạn cần hiểu lý do một tác vụ CI đã hoặc không chạy
    - Bạn đang gỡ lỗi một bước kiểm tra GitHub Actions bị lỗi
    - Bạn đang điều phối một lượt chạy hoặc chạy lại quy trình xác thực bản phát hành
    - Bạn đang thay đổi cơ chế điều phối ClawSweeper hoặc chuyển tiếp hoạt động GitHub
summary: Biểu đồ job CI, các cổng phạm vi, các nhóm bao quát bản phát hành và các lệnh tương đương cục bộ
title: Pipeline CI
x-i18n:
    generated_at: "2026-07-19T05:37:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 5c633517ef09e7348033bb9fbf57f95376095967979f53d05921899c8b8cde3d
    source_path: ci.md
    workflow: 16
---

CI của OpenClaw chạy khi có lượt đẩy lên `main` (các đường dẫn Markdown và `docs/**` bị bỏ qua
tại trình kích hoạt), trên mọi pull request không ở trạng thái nháp và khi kích hoạt thủ công.
Các lượt đẩy `main` chính tắc chạy đơn luồng: nhóm đồng thời `CI` cho phép một
chu kỳ tích hợp hoàn chỉnh chạy trong khi GitHub chỉ giữ lại lượt đẩy đang chờ mới nhất.
Các lượt hợp nhất mới thay thế lượt chạy đang chờ đó thay vì hủy công việc đã
đăng ký một ma trận Blacksmith. Các pull request vẫn hủy những head đã bị thay thế,
còn các lượt kích hoạt thủ công sử dụng các nhóm biệt lập. `preflight` phân loại phần khác biệt và
tắt các lane tốn kém khi chỉ những khu vực không liên quan thay đổi. Các lượt chạy
`workflow_dispatch` thủ công chủ ý bỏ qua cơ chế xác định phạm vi thông minh và phân tỏa
toàn bộ đồ thị cho các ứng viên phát hành và hoạt động xác thực diện rộng. Các lane Android vẫn
chỉ chạy khi được chọn thông qua `include_android` (hoặc đầu vào `release_gate`). Phạm vi kiểm thử Plugin
chỉ dành cho bản phát hành nằm trong quy trình làm việc riêng
[`Plugin Prerelease`](#plugin-prerelease) và chỉ chạy từ
[`Full Release Validation`](#full-release-validation) hoặc một lượt
kích hoạt thủ công rõ ràng.

## Tổng quan Pipeline

| Tác vụ                             | Mục đích                                                                                                                                                                                                              | Thời điểm chạy                                  |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| `preflight`                        | Phát hiện các phạm vi đã thay đổi và tạo bản kê CI; trên các `main` chính tắc có liên quan đến Node, làm mới và duy trì ảnh chụp nhanh phần phụ thuộc trước khi phân tỏa                                          | Luôn chạy trên các lượt đẩy và PR không ở trạng thái nháp |
| `security-fast`                    | Phát hiện khóa riêng tư, kiểm tra quy trình làm việc đã thay đổi qua `zizmor` và kiểm tra tệp khóa dùng cho môi trường production                                                                                   | Luôn chạy trên các lượt đẩy và PR không ở trạng thái nháp |
| `pnpm-store-warmup`                | Làm nóng bộ nhớ đệm Actions được ghim theo tệp khóa cho các pull request và lượt chạy thủ công mà không chặn các shard Linux Node                                                                                      | Khi các lane Node hoặc kiểm tra tài liệu được chọn ngoài main |
| `build-artifacts`                  | Xây dựng `dist/`, Control UI, kiểm tra smoke CLI đã build, bộ nhớ khởi động và kiểm tra cấu phần build được nhúng                                                                                                    | Khi có thay đổi liên quan đến Node             |
| `control-ui-i18n`                  | Xác minh các gói locale Control UI đã tạo, siêu dữ liệu và bộ nhớ dịch; mang tính khuyến nghị trên các lượt chạy tự động, mang tính chặn trên CI phát hành thủ công                                                      | Khi có thay đổi liên quan đến i18n Control UI và CI thủ công |
| `checks-fast-core`                 | Các lane kiểm tra tính đúng đắn nhanh trên Linux: cơ chế siết dần số dòng tối đa của đường cơ sở loại trừ, gói kèm + giao thức, trình khởi chạy Bun và tác vụ nhanh định tuyến CI                                         | Khi có thay đổi liên quan đến Node             |
| `qa-smoke-ci-profile`              | Hai phần cân bằng, độc lập của tập đại diện QA Smoke tự động có giới hạn; phạm vi đầy đủ của hệ thống phân loại vẫn khả dụng qua các hồ sơ QA được chỉ định rõ                                                            | Khi có thay đổi liên quan đến Node             |
| `checks-fast-contracts-plugins-*`  | Hai shard hợp đồng Plugin được gán trọng số                                                                                                                                                                            | Khi có thay đổi liên quan đến Node             |
| `checks-fast-contracts-channels-*` | Hai shard hợp đồng kênh được gán trọng số                                                                                                                                                                              | Khi có thay đổi liên quan đến Node             |
| `checks-node-*`                    | Kiểm thử Node theo mục tiêu đã thay đổi trên các pull request; toàn bộ shard lõi trên `main`, các lượt chạy thủ công, phát hành và dự phòng diện rộng                                                            | Khi có thay đổi liên quan đến Node             |
| `check-*`                          | Tương đương cổng cục bộ chính được phân shard: các biện pháp bảo vệ, shrinkwrap, siêu dữ liệu cấu hình kênh đóng gói kèm, kiểu production, lint, phần phụ thuộc, kiểu kiểm thử                                           | Khi có thay đổi liên quan đến Node             |
| `check-additional-*`               | Các dải kiểm tra ranh giới (bao gồm sai lệch ảnh chụp nhanh prompt), ranh giới bộ truy cập phiên/trình đọc transcript/giao dịch SQLite, các nhóm lint phần mở rộng, biên dịch/canary ranh giới gói và kiến trúc tô-pô runtime | Khi có thay đổi liên quan đến Node             |
| `checks-node-compat-node22`        | Lane build và smoke kiểm tra tính tương thích với Node 22                                                                                                                                                              | Kích hoạt CI thủ công cho các bản phát hành    |
| `check-docs`                       | Kiểm tra định dạng tài liệu, lint và liên kết hỏng                                                                                                                                                                     | Khi tài liệu thay đổi (PR và kích hoạt thủ công) |
| `native-i18n`                      | Kiểm tra ứng dụng native, Android và danh mục i18n của Apple                                                                                                                                                           | Khi có thay đổi liên quan đến i18n native      |
| `skills-python`                    | Ruff + pytest cho các skill dựa trên Python                                                                                                                                                                            | Khi có thay đổi liên quan đến skill Python     |
| `checks-windows`                   | Kiểm thử quy trình/đường dẫn dành riêng cho Windows cùng các hồi quy về định danh nhập runtime dùng chung                                                                                                              | Khi có thay đổi liên quan đến Windows          |
| `macos-node`                       | Kiểm thử TypeScript tập trung cho macOS: launchd, Homebrew, đường dẫn runtime, script đóng gói, trình bao nhóm tiến trình                                                                                              | Khi có thay đổi liên quan đến macOS            |
| `macos-swift`                      | Lint và build Swift cho ứng dụng macOS, cùng các kiểm thử cho ứng dụng và gói OpenClawKit dùng chung                                                                                                                   | Khi có thay đổi liên quan đến macOS            |
| `ios-build`                        | Tạo dự án Xcode cùng bản build ứng dụng iOS trên trình mô phỏng                                                                                                                                                        | Khi ứng dụng iOS, bộ công cụ ứng dụng dùng chung hoặc Swabble thay đổi |
| `android`                          | Kiểm thử đơn vị Android cho cả hai biến thể cùng một bản build APK debug                                                                                                                                               | Khi có thay đổi liên quan đến Android          |
| `openclaw/ci-gate`                 | Tổng hợp cuối: yêu cầu bước kiểm tra sơ bộ và bảo mật; chỉ chấp nhận bỏ qua đối với các lane hạ nguồn bị bản kê vô hiệu hóa                                                                                            | Mọi lượt chạy CI không ở trạng thái nháp       |
| `test-performance-agent`           | Quy trình làm việc riêng: tối ưu hóa kiểm thử chậm của Codex hằng ngày sau hoạt động đáng tin cậy                                                                                                                      | Khi CI main thành công hoặc kích hoạt thủ công |
| `openclaw-performance`             | Quy trình làm việc riêng: báo cáo hiệu năng runtime Kova hằng ngày/theo yêu cầu với các lane nhà cung cấp giả lập, hồ sơ chuyên sâu và GPT 5.6 trực tiếp                                                              | Theo lịch và kích hoạt thủ công                |

Các quy trình làm việc Periphery độc lập đảm bảo không có phát hiện mã chết nào cho ứng dụng iOS và macOS. Quy trình làm việc OpenClawKit dùng chung quét song song cả hai bên sử dụng và chỉ báo cáo một khai báo khi Periphery phát ra cùng một Swift USR từ cả hai bản build. Hợp đồng lược đồ `OpenClawProtocol/GatewayModels.swift` được tạo của quy trình này được giữ lại dưới dạng mã do trình tạo sở hữu thay vì bị coi là mã chết cục bộ của ứng dụng.

## Thứ tự dừng sớm khi lỗi

1. `preflight` quyết định những lane nào thực sự tồn tại. Logic `docs-scope` và `changed-scope` là các bước bên trong tác vụ này, không phải các tác vụ độc lập. `main` chính tắc bắt đầu ngay lập tức, nhưng nhóm đồng thời của nó chỉ cho phép một lượt chạy hoàn chỉnh và gộp các lượt đẩy sau thành một lượt chạy đang chờ mới nhất. Các lượt đẩy main liên quan đến Node cũng tuần tự hóa trình ghi đĩa phần phụ thuộc duy nhất và hoạt động duy trì kích thước của nó tại đây trước khi các tác vụ hạ nguồn có thể gắn khóa; Blacksmith có thể chỉ cung cấp một commit mới cho lượt chạy quy trình làm việc sau, vì vậy các bên sử dụng trong cùng lượt chạy vẫn giữ phương án dự phòng cục bộ được kiểm tra bằng dấu mốc.
2. `security-fast`, `check-*`, `check-additional-*`, `check-docs` và `skills-python` dừng nhanh khi lỗi mà không chờ các tác vụ ma trận cấu phần và nền tảng nặng hơn.
3. `build-artifacts` và bước kiểm tra mang tính khuyến nghị `control-ui-i18n` chạy chồng lấp với các lane Linux nhanh. Các PR nguồn loại trừ ảnh chụp nhanh locale đã tạo; quy trình làm mới độc lập sửa chữa và tự động hợp nhất một PR được tạo biệt lập ở chế độ nền. Các nhánh `release/YYYY.M.PATCH` chính tắc có thể bao gồm các bản sửa locale chuẩn bị phát hành cùng những đầu ra phát hành được tạo khác.
4. Sau đó, các lane nền tảng và runtime nặng hơn được phân tỏa: `checks-fast-core`, `checks-fast-contracts-plugins-*`, `checks-fast-contracts-channels-*`, `checks-node-*`, `checks-windows`, `macos-node`, `macos-swift`, `ios-build` và `android`.
5. `openclaw/ci-gate` chờ mọi lane đã chọn. Bước kiểm tra sơ bộ và bảo mật phải thành công; các tác vụ hạ nguồn chỉ có thể bỏ qua khi bản kê không chọn chúng. Một lane đã chọn bị lỗi hoặc bị hủy sẽ khiến bước tổng hợp thất bại.

Trình điều phối hợp nhất có thể tái sử dụng một `openclaw/ci-gate` đã xác thực và thành công
cho cùng một head pull request trong tối đa 24 giờ. Điều này tránh ghi lại
nhánh của người đóng góp sau các thay đổi `main` không liên quan. Kết quả có thể tái sử dụng không
thay thế bước kiểm tra hợp nhất thử nghiệm nghiêm ngặt, riêng biệt do App sở hữu đối với `main` hiện tại.
Một lượt chạy lại đang chờ hoặc thất bại sau đó không xóa kết quả thành công trước đó
cho head không thay đổi ấy trong khoảng thời gian còn hiệu lực.

Bộ quy tắc của nhánh mặc định yêu cầu bước kiểm tra `openclaw/ci-gate` do GitHub Actions sở hữu. Người bảo trì và quản trị viên kho lưu trữ có quyền bỏ qua khẩn cấp đã được kiểm toán, chỉ dành cho các lần đưa thay đổi trực tiếp theo kiểu fast-forward có chữ ký; bộ quy tắc của tổ chức vẫn chặn thao tác xóa và các bản cập nhật không phải fast-forward. Các lần hợp nhất pull request thông thường nên tiếp tục sử dụng cổng kiểm tra thay vì bỏ qua Pipeline CI bị lỗi. Bước kiểm tra hợp nhất thử nghiệm nghiêm ngặt riêng biệt do App sở hữu vẫn ràng buộc head với `main` hiện tại.

GitHub có thể đánh dấu các tác vụ pull request đã bị thay thế là `cancelled` khi một head mới hơn được đưa vào. Hãy coi đó là nhiễu CI, trừ khi lượt chạy mới nhất của cùng PR cũng bị lỗi. Các lượt chạy `main` chính tắc không bị hủy sau khi được tiếp nhận; khi có lưu lượng hợp nhất, GitHub chỉ thay thế lượt chạy cũ đang chờ bằng tip mới nhất. Các tác vụ ma trận sử dụng `fail-fast: false`, và `build-artifacts` báo cáo trực tiếp các lỗi về kênh nhúng, ranh giới hỗ trợ lõi và theo dõi Gateway thay vì xếp hàng các tác vụ xác minh nhỏ. Khóa đồng thời tự động của CI được lập phiên bản (`CI-v7-*`) để một tiến trình zombie phía GitHub trong nhóm hàng đợi cũ không thể chặn vô thời hạn các lượt chạy main mới hơn. Các lượt chạy toàn bộ bộ kiểm thử thủ công sử dụng `CI-manual-v1-*` và không hủy các lượt chạy đang diễn ra. Cơ chế bảo vệ bộ nhớ khởi động của danh sách plugin giữ mức trần 350 MiB trên Blacksmith Linux tự lưu trữ và cho phép 425 MiB trên Linux do GitHub lưu trữ, vốn có mức RSS cơ sở cao hơn đối với cùng một CLI đã xây dựng.

Sử dụng `pnpm ci:timings`, `pnpm ci:timings:recent` hoặc `node scripts/ci-run-timings.mjs <run-id>` để tóm tắt thời gian thực tế, thời gian xếp hàng, các tác vụ chậm nhất, lỗi và rào cản phân nhánh `pnpm-store-warmup` từ GitHub Actions. Tác vụ `ci-timings-summary` trong workflow tồn tại trong `ci.yml` nhưng hiện đang bị vô hiệu hóa (`if: false`); thay vào đó, hãy chạy trình trợ giúp đo thời gian cục bộ. Để xem thời gian xây dựng, hãy kiểm tra bước `Build dist` của tác vụ `build-artifacts`: `pnpm build:ci-artifacts` in `[build-all] phase timings:` và bao gồm `ui:build`; tác vụ cũng tải lên artifact `startup-memory`.

## Ngữ cảnh và bằng chứng của PR

Các PR của cộng tác viên bên ngoài chạy cổng ngữ cảnh và bằng chứng PR từ
`.github/workflows/real-behavior-proof.yml`. Workflow checkout
bản sửa đổi workflow đáng tin cậy (`github.workflow_sha`) và chỉ đánh giá nội dung PR;
nó không thực thi mã từ nhánh của cộng tác viên.

Cổng này áp dụng cho các tác giả PR không phải là chủ sở hữu, thành viên,
cộng tác viên của kho lưu trữ hoặc bot. Cổng đạt yêu cầu khi nội dung PR chứa các phần
`What Problem This Solves` và `Evidence` do tác giả viết. Bằng chứng có thể là một kiểm thử tập trung,
kết quả CI, ảnh chụp màn hình, bản ghi, đầu ra terminal, quan sát trực tiếp,
nhật ký đã biên tập hoặc liên kết artifact. Nội dung cung cấp ý định và hoạt động xác thực hữu ích;
người review kiểm tra mã, kiểm thử và CI để đánh giá tính đúng đắn.

Khi bước kiểm tra thất bại, hãy cập nhật nội dung PR thay vì đẩy thêm một commit mã.

## Phạm vi và định tuyến

Logic phạm vi nằm trong `scripts/ci-changed-scope.mjs` và được bao phủ bởi các kiểm thử đơn vị trong `src/scripts/ci-changed-scope.test.ts`. Thao tác kích hoạt thủ công bỏ qua việc phát hiện phạm vi thay đổi và khiến manifest kiểm tra sơ bộ hoạt động như thể mọi khu vực thuộc phạm vi đều đã thay đổi.

Các workflow Periphery riêng biệt cho iOS và macOS thực thi chính sách không có phát hiện mã chết. Mỗi workflow chỉ chạy khi một pull request không phải bản nháp chạm vào phạm vi quét native tương ứng hoặc khi được kích hoạt thủ công.

- **Các chỉnh sửa workflow CI** xác thực đồ thị CI của Node, hoạt động lint workflow và lane Windows (`ci.yml` thực thi lane này), nhưng bản thân chúng không bắt buộc chạy các bản dựng native của iOS, Android hoặc macOS; các lane nền tảng đó vẫn được giới hạn trong phạm vi thay đổi mã nguồn của nền tảng.
- **Kiểm tra tính hợp lệ của workflow** chạy `actionlint`, `zizmor` trên tất cả các tệp YAML workflow, cơ chế bảo vệ phép nội suy của composite action và cơ chế bảo vệ dấu xung đột. Tác vụ `security-fast` theo phạm vi PR cũng chạy `zizmor` trên các tệp workflow đã thay đổi để các phát hiện bảo mật workflow gây lỗi sớm trong đồ thị CI chính.
- **Tài liệu trên các lần đẩy `main`** được kiểm tra bởi workflow `Docs` độc lập với cùng bản sao tài liệu ClawHub mà CI sử dụng, vì vậy các lần đẩy kết hợp mã+tài liệu không đồng thời xếp hàng shard `check-docs` của CI. Pull request và CI thủ công vẫn chạy `check-docs` từ CI khi tài liệu thay đổi.
- **TUI PTY** chạy trong shard Linux Node `checks-node-core-runtime-tui-pty` đối với các thay đổi TUI. Shard này chạy `test/vitest/vitest.tui-pty.config.ts` với `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1`, nên bao phủ cả lane fixture `TuiBackend` có tính xác định và kiểm thử smoke `tui --local` chậm hơn, vốn chỉ mô phỏng endpoint mô hình bên ngoài.
- **Các chỉnh sửa chỉ liên quan đến định tuyến CI, tập hợp nhỏ các fixture kiểm thử lõi mà tác vụ nhanh chạy trực tiếp và các chỉnh sửa hẹp đối với trình trợ giúp hợp đồng plugin** sử dụng đường dẫn manifest nhanh chỉ dành cho Node: `preflight`, `security-fast` và chỉ những lane nhanh mà thay đổi tác động đến — một tác vụ định tuyến CI `checks-fast-core` duy nhất, hai shard hợp đồng plugin hoặc cả hai. Đường dẫn đó bỏ qua các artifact bản dựng, khả năng tương thích Node 22, hợp đồng kênh, toàn bộ shard lõi, shard plugin đi kèm và các ma trận bảo vệ bổ sung.
- **Các bước kiểm tra Node trên Windows** được giới hạn trong phạm vi các wrapper tiến trình/đường dẫn dành riêng cho Windows, trình trợ giúp trình chạy npm/pnpm/UI, cấu hình trình quản lý gói và các bề mặt workflow CI thực thi lane đó; các thay đổi không liên quan về mã nguồn, plugin, kiểm thử smoke cài đặt và chỉ dành cho kiểm thử vẫn nằm trên các lane Linux Node.

Các họ kiểm thử Node chậm nhất được chia tách hoặc cân bằng để mỗi tác vụ vẫn nhỏ mà không đặt trước quá nhiều runner:

- Các hợp đồng Plugin và hợp đồng kênh đều chạy dưới dạng hai shard có trọng số được Blacksmith hỗ trợ, với phương án dự phòng là runner GitHub tiêu chuẩn.
- Các lane nhanh/hỗ trợ của kiểm thử đơn vị lõi chạy riêng biệt; hạ tầng runtime lõi được chia thành các shard miền process, shared, hooks, secrets và ba shard miền Cron.
- Tính năng tự động trả lời chạy dưới dạng các worker được cân bằng, với cây con trả lời được chia thành các shard agent-runner, commands, dispatch, session và state-routing.
- Các cấu hình Gateway/server tác tử (mặt phẳng điều khiển) được chia thành các lane chat, auth, model, HTTP/plugin, runtime và startup thay vì chờ các artifact đã build.
- CI thông thường chỉ đóng gói các shard mẫu include của hạ tầng cô lập thành các bundle xác định, mỗi bundle có tối đa 64 tệp kiểm thử, giúp giảm ma trận Node mà không hợp nhất các bộ kiểm thử command/cron không cô lập, agents-core có trạng thái hoặc Gateway/server. Các bộ kiểm thử cố định nặng tiếp tục dùng 8 vCPU, còn các lane đã đóng gói và có trọng số thấp hơn dùng 4 vCPU.
- Các pull request trên kho lưu trữ chuẩn tái sử dụng trình phân giải kiểm thử đã thay đổi dựa trên diff cây hợp nhất tổng hợp. Các thay đổi chính xác chạy một job Node được nhắm mục tiêu; mỗi tệp kiểm thử được chọn có một process riêng để duy trì tính cô lập của bộ kiểm thử có trạng thái. Trình lập kế hoạch kết hợp các kiểm thử cùng cấp với các thành phần phụ thuộc trong đồ thị import và quay về kế hoạch bộ kiểm thử đầy đủ nhỏ gọn gồm 14 job hiện có đối với các thay đổi liên quan đến gói workspace, package/lockfile, harness dùng chung, cấu hình phân tách, đổi tên hoặc xóa, thay đổi hợp đồng extension công khai, kiểm thử có thiết lập shard đặc biệt, mục tiêu được phân giải một phần hoặc trống, kế hoạch đường dẫn hoặc mục tiêu quá lớn và lỗi trình lập kế hoạch. Các kế hoạch được nhắm mục tiêu luôn giữ lại toàn bộ cổng ranh giới artifact đã build vì không thể suy ra các trình quét kho lưu trữ của cổng này từ các import. Các lần push `main` chạy cùng bộ kiểm thử nhỏ gọn đầy đủ: các sự kiện push trung gian đang chờ có thể được gộp lại, vì vậy lần chạy còn lại mới nhất phải xác thực toàn bộ cây tích hợp thay vì chỉ diff của lần push cuối cùng. Các lần kích hoạt thủ công và cổng phát hành vẫn giữ ma trận đầy đủ được đặt tên theo từng shard.
- Ma trận Node đầy đủ ưu tiên tiếp nhận công cụ nối tiếp luôn chạy chậm, các shard lệnh tự động trả lời và trình ghi cache core-fast diện rộng. Điều này duy trì giới hạn 28 job, đồng thời ngăn công việc trên đường găng và seed transform của lần chạy tiếp theo bị đẩy sang đợt sau.
- Các kiểm thử trình duyệt diện rộng, QA, media và Plugin hỗn hợp sử dụng cấu hình Vitest chuyên biệt thay vì cấu hình gom chung Plugin dùng chung. Các shard mẫu include ghi lại mục thời gian bằng tên shard CI, nhờ đó `.artifacts/vitest-shard-timings.json` có thể phân biệt toàn bộ cấu hình với một shard đã lọc.
- Các job shard Linux Node duy trì cache mô-đun hệ thống tệp thử nghiệm của Vitest thông qua API cache Actions thượng nguồn, được Blacksmith tăng tốc minh bạch trên các runner của mình. Mọi shard CI chỉ khôi phục và giải nén seed được bảo vệ vào thư mục gốc cục bộ riêng của runner; sau đó wrapper shard cấp các thư mục con hoạt động riêng biệt cho các process Vitest đồng thời. Chỉ trình làm ấm hằng ngày không bị hủy hoặc được kích hoạt rõ ràng mới lưu một archive bất biến mới, do đó pull request không thể phát hành các transform hoặc tạo các họ cache riêng cho từng PR. Dấu vân tay đầu vào transform xóa các thế hệ lockfile, package, tsconfig và cấu hình Vitest không tương thích. Trình ghi được bảo vệ quét và cắt giảm cache đã khôi phục xuống 75% sau khi vượt quá 2 GiB. Vitest băm id mô-đun, nội dung nguồn, môi trường và cấu hình transform đã phân giải, vì vậy các thay đổi nguồn cục bộ thông thường giữ ấm những mục không đổi, còn các mô-đun đã thay đổi sẽ trượt cache một cách an toàn. Các tiền tố khôi phục thô bắc cầu giữa các lần chạy workflow; cơ chế LRU và loại bỏ do không hoạt động thông thường của cache Actions giới hạn các archive bất biến cũ.
- Các job Linux Node đáng tin cậy cũng gắn pnpm store và `node_modules` từ một đĩa phụ thuộc được bảo vệ cho mỗi dòng Node được hỗ trợ. Manifest gói, thiết lập cài đặt, nền tảng runner và bản vá Node chính xác không nằm trong khóa đĩa; dấu vân tay chính xác của runtime và đầu vào cài đặt quyết định job tái sử dụng cây hay cài đặt lại rồi làm mới cùng một đĩa. Các manifest được chuẩn hóa trước khi băm. Các hook gốc trực tiếp đã được kiểm tra chỉ giữ lại script vòng đời cài đặt của pnpm, vì vậy các chỉnh sửa định dạng và script kiểm thử/build thông thường vẫn giữ cây phụ thuộc ấm; sai lệch hook vòng đời chưa được kiểm tra sẽ đóng an toàn cho đến khi các đầu vào nguồn của nó được đưa vào hợp đồng dấu vân tay. Các thay đổi về phụ thuộc, trình quản lý gói, nguồn hook và lockfile luôn làm snapshot mất hiệu lực. Một pull request có snapshot chỉ đọc mang dấu vân tay khác sẽ tháo liên kết workspace và cài đặt vào bộ nhớ cục bộ của runner, tránh các thao tác ghi chậm vào một bản sao mà nó không thể phát hành. Các lượt cài đặt nguội trên đĩa sticky vô hiệu hóa các lần thử lại fetch nội bộ của pnpm và thực hiện tối đa ba lần thử cài đặt đầy đủ có giới hạn từ store được làm ấm dần; hết thời gian vẫn được xem là lỗi. Sau khi khôi phục chính xác hoặc cài đặt với frozen-lockfile, quá trình thiết lập vô hiệu hóa bước kiểm tra phụ thuộc dư thừa trước khi chạy của pnpm: kho lưu trữ chủ động cắt bỏ `node_modules` cục bộ của Plugin, vốn bị pnpm xem là lỗi thời và sửa chữa bằng các lượt cài đặt ngầm đồng thời không an toàn trong quá trình phân tỏa shard. Bước kiểm tra trước của nhánh main chuẩn là trình ghi duy nhất và đo store trong mỗi lần làm mới, chỉ chạy `pnpm store prune` sau khi các phiên bản gói đã ngừng sử dụng đẩy dung lượng vượt quá 8 GiB. Việc phát hành snapshot của Blacksmith diễn ra bất đồng bộ ngay cả sau khi job ghi hoàn tất, vì vậy lần chạy đầu tiên sau một khóa hoặc dấu vân tay mới vẫn có thể nguội; các lần khôi phục theo marker chính xác về sau là bằng chứng triển khai. Các job CI bắt buộc và pull request nhận các bản sao dùng một lần, vì vậy thay đổi phụ thuộc không tạo đĩa mới, snapshot cạnh tranh hoặc khóa cache có thể hủy build.
- Các job shard Node và artifact build cũng khôi phục cache biên dịch di động trên đĩa của Node thông qua các cache Actions bất biến. Các namespace `test` và `build` độc lập ngăn trình ghi của chúng thay thế archive của nhau: trình làm ấm kiểm thử theo lịch sở hữu seed kiểm thử được bảo vệ, còn `build-artifacts` có thể phát hành tối đa một archive build được bảo vệ mỗi ngày UTC từ các lần push `main` đáng tin cậy. PR và các job kiểm thử thông thường chỉ đọc snapshot được bảo vệ, vì vậy bytecode của nhánh tính năng không bao giờ đi vào seed dùng chung và lưu lượng PR không tạo archive cache. Cơ chế này tái sử dụng bytecode V8 cho phần điều phối do Node nạp, công cụ build và các phụ thuộc bên ngoài trên các đường dẫn checkout khác nhau, kể cả khi chỉ một phần đồ thị nguồn thay đổi. Các process con Vitest vô hiệu hóa cache biên dịch được kế thừa vì coverage có thể được bật bên trong cấu hình động và coverage V8 có thể mất độ chính xác về vị trí nguồn khi script được giải tuần tự hóa từ bytecode.
- Job artifact build cũng duy trì các đầu ra bước `build-all` có dấu vân tay nội dung. Các khai báo SDK Plugin do CI tự build băm toàn bộ đồ thị nguồn TypeScript/JSON thuộc sở hữu kho lưu trữ, loại trừ các thư mục đã cài đặt và được tạo, đồng thời khôi phục cả khai báo phẳng lẫn cầu nối gói sau khi `tsdown` xóa `dist`. Các thay đổi về tài liệu, workflow, Plugin và những phần khác bên ngoài đồ thị đó có thể tái sử dụng snapshot khai báo; thay đổi nguồn sẽ build lại snapshot trước khi cổng export chạy.
- Các bản build khai báo đầy đủ chia `tsdown` thành các nhóm AI, workspace-package và hợp nhất. Mỗi nhóm chỉ cache khai báo, sau đó vẫn build lại JavaScript runtime trước khi khôi phục các khai báo đó. Do đó, thay đổi lõi hoặc Plugin chỉ làm mất hiệu lực đồ thị hợp nhất lớn, còn thay đổi gói workspace thận trọng làm mất hiệu lực mọi nhóm khai báo phụ thuộc. Các bản build đầy đủ công khai thường dùng cache Actions bất biến; khóa khôi phục thô tạo seed cho các thay đổi cục bộ, dấu vân tay nội dung theo từng nhóm từ chối dữ liệu lỗi thời và hạn ngạch cache của GitHub loại bỏ các thế hệ cũ. Thay vào đó, lane Node 22 hằng tuần phát hành artifact 14 ngày sau khi các lần chạy `main` thành công và chỉ khôi phục những artifact có danh tính nhà sản xuất bất biến phân giải về workflow đó trên `main`, tránh biến động hạn ngạch mà không cho phép mã PR ghi vào cache dùng chung. Các khai báo QA riêng tư không bao giờ được duy trì trong cache Actions vì namespace cache không phải là ranh giới bảo mật.
- `check-additional-*` chia theo dải danh sách kiểm tra ranh giới bổ sung (`scripts/run-additional-boundary-checks.mjs`) thành một shard nặng về prompt (`check-additional-boundaries-a`, bao gồm kiểm tra sai lệch snapshot prompt Codex) và một shard kết hợp cho các dải còn lại (`check-additional-boundaries-bcd`), mỗi shard chạy đồng thời các kiểm tra độc lập và in thời gian theo từng kiểm tra. Công việc biên dịch/canary ranh giới gói vẫn được giữ cùng nhau, còn kiến trúc topology runtime chạy riêng với coverage theo dõi Gateway được nhúng trong `build-artifacts`.
- Trên runner build tự lưu trữ 32 vCPU, theo dõi Gateway, kiểm thử kênh và shard ranh giới hỗ trợ lõi khởi động cùng nhau bên trong `build-artifacts` sau khi `dist/` và `dist-runtime/` đã được build. Các lượt chạy dự phòng do GitHub lưu trữ giữ theo dõi Gateway ở chế độ nối tiếp để tranh chấp trên hệ thống ít lõi không thể làm hết hạn chót sẵn sàng của nó.

Sau khi được tiếp nhận, CI Linux chuẩn cho phép tối đa 28 job kiểm thử Node đồng thời và
12 job cho các lane nhanh/kiểm tra nhỏ hơn; Windows và Android duy trì ở mức hai vì
các nhóm runner đó hẹp hơn. Các batch nhỏ gọn theo toàn bộ cấu hình chạy với
thời gian chờ batch 120 phút, còn các nhóm mẫu include dùng chung cùng ngân sách
job có giới hạn.

CI Android chạy cả `testPlayDebugUnitTest` và `testThirdPartyDebugUnitTest`, sau đó build APK gỡ lỗi Play. Flavor bên thứ ba không có source set hoặc manifest riêng; lane kiểm thử đơn vị của nó vẫn biên dịch flavor với các cờ BuildConfig SMS/nhật ký cuộc gọi, đồng thời tránh job đóng gói APK gỡ lỗi trùng lặp trên mỗi lần push liên quan đến Android. Mỗi tác vụ Gradle hiện tại có một đĩa sticky được bảo vệ; các job PR dùng bản sao dùng một lần, còn các lượt chạy được bảo vệ làm mới tại chỗ các mục Gradle được định địa chỉ theo nội dung.

Các khóa đĩa sticky của Blacksmith được cố ý giới hạn theo runtime hoặc chiều tác vụ được hỗ trợ, tuyệt đối không theo số PR, commit, lần chạy, nhánh hoặc hàm băm phụ thuộc. Cache transform runtime và cache biên dịch dùng cache Actions thay vì đĩa sticky vì các archive bất biến cung cấp kết quả khôi phục/lưu có thể xác minh và tránh lỗi thăng cấp snapshot có thể thay đổi. Sau khi di chuyển phiên bản khóa sticky, chỉ thêm chính xác các danh tính khóa, kiến trúc và khu vực đã lỗi thời vào `.github/retired-sticky-disks.json`, kích hoạt `Sticky Disk Cleanup` từ `main` với cùng các chiều và xác nhận, xác minh việc xóa rồi loại bỏ các mục đó. Workflow định tuyến danh tính ARM đến runner ARM, từ chối khu vực runner không khớp, sử dụng action xóa theo khóa chính xác của Blacksmith và không bao giờ xóa cache trình build Docker hoặc tiền tố ký tự đại diện. Các archive cache Actions sử dụng cơ chế LRU và loại bỏ do không hoạt động thông thường.

Shard `check-dependencies` chạy các kiểm tra Knip production về phụ thuộc, tệp không dùng và export không dùng. Kiểm tra tệp không dùng sẽ thất bại khi PR thêm một tệp không dùng mới chưa được review hoặc để lại một mục allowlist lỗi thời, đồng thời bảo toàn các bề mặt Plugin động, được tạo, build, kiểm thử trực tiếp và cầu nối gói có chủ đích mà Knip không thể phân giải tĩnh. Kiểm tra export không dùng loại trừ các tệp hỗ trợ kiểm thử và thất bại với mọi export production không dùng; các đối tượng sử dụng động có chủ đích phải được mô hình hóa trong `config/knip.config.ts`. Các mục tiêu lịch sử chạy kiểm tra export khi có cung cấp và nếu không thì giữ lại phương án dự phòng mã chết cũ hơn của chúng.

## Chuyển tiếp hoạt động ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` là cầu nối phía đích đưa hoạt động của kho lưu trữ OpenClaw vào ClawSweeper. Nó không checkout hoặc thực thi mã pull request không đáng tin cậy. Workflow tạo token GitHub App từ `CLAWSWEEPER_APP_PRIVATE_KEY`, sau đó gửi các payload `repository_dispatch` nhỏ gọn đến `openclaw/clawsweeper`.

Workflow có bốn lane:

- `clawsweeper_item` cho các yêu cầu review chính xác về issue và pull request;
- `clawsweeper_comment` cho các lệnh ClawSweeper tường minh trong bình luận issue;
- `clawsweeper_commit_review` cho các yêu cầu review ở cấp commit trên các lần push `main`;
- `github_activity` cho hoạt động GitHub chung mà tác nhân ClawSweeper có thể kiểm tra.

Luồng `github_activity` chỉ chuyển tiếp siêu dữ liệu đã chuẩn hóa: loại sự kiện, hành động, tác nhân, kho lưu trữ, số thứ tự mục, URL, tiêu đề, trạng thái và các đoạn trích ngắn của bình luận hoặc nội dung review khi có. Luồng này chủ ý không chuyển tiếp toàn bộ nội dung Webhook. Workflow tiếp nhận trong `openclaw/clawsweeper` là `.github/workflows/github-activity.yml`, workflow này đăng sự kiện đã chuẩn hóa lên hook của OpenClaw Gateway dành cho tác nhân ClawSweeper.

Hoạt động chung dùng để quan sát, không mặc định dùng để gửi thông báo. Tác nhân ClawSweeper nhận đích Discord trong prompt và chỉ nên đăng lên `#clawsweeper` khi sự kiện bất ngờ, có thể hành động, có rủi ro hoặc hữu ích về mặt vận hành. Các thao tác mở, chỉnh sửa thông thường, hoạt động nhiễu từ bot, nhiễu Webhook trùng lặp và lưu lượng review bình thường nên dẫn đến `NO_REPLY`.

Trong toàn bộ đường dẫn này, hãy coi tiêu đề, bình luận, nội dung, văn bản review, tên nhánh và thông điệp commit trên GitHub là dữ liệu không đáng tin cậy. Chúng là đầu vào để tóm tắt và phân loại, không phải chỉ thị cho workflow hoặc môi trường chạy của tác nhân.

## Kích hoạt thủ công

Các lượt kích hoạt CI thủ công chạy cùng một đồ thị công việc như CI thông thường nhưng buộc bật mọi luồng có phạm vi không phải Android: các shard Linux Node, các shard Plugin đi kèm, các shard hợp đồng Plugin và kênh, khả năng tương thích Node 22, `check-*`, `check-additional-*`, kiểm tra nhanh artifact đã build, kiểm tra tài liệu, Skills Python, Windows, macOS, bản build iOS và i18n của Control UI. Tính đồng nhất locale của Control UI chỉ mang tính khuyến nghị trong các lượt chạy PR tự động và `main` vì workflow làm mới độc lập sửa sai lệch được tạo ra trong nền; kiểm tra này có tính chặn trong CI thủ công và do đó cũng chặn Full Release Validation. Quy trình chuẩn bị bản phát hành chạy cùng thao tác đồng bộ locale trước khi Code SHA được cố định, sau đó xác minh trạng thái nghiêm ngặt không có fallback. Các lượt kích hoạt CI thủ công độc lập chỉ chạy Android với `include_android=true` (đầu vào `release_gate` cũng buộc bật Android); workflow bao quát toàn bộ bản phát hành bật Android bằng cách truyền `include_android=true`. Các kiểm tra tĩnh trước phát hành Plugin, shard chỉ dành cho bản phát hành `agentic-plugins`, lượt quét toàn bộ lô tiện ích mở rộng và các luồng Docker trước phát hành Plugin bị loại khỏi CI. Bộ kiểm thử Docker trước phát hành chỉ chạy khi `Full Release Validation` kích hoạt workflow `Plugin Prerelease` riêng với cổng xác thực bản phát hành được bật.

Các kiểm tra số dòng tối đa của PR lấy đường cơ sở từ cây merge tổng hợp đã checkout và xác minh commit cha của head so với head của sự kiện. Các lượt chạy thủ công sử dụng một nhóm đồng thời duy nhất để bộ kiểm thử đầy đủ của ứng viên phát hành không bị hủy bởi một lần push hoặc lượt chạy PR khác trên cùng ref. Đầu vào tùy chọn `target_ref` cho phép một bên gọi đáng tin cậy chạy đồ thị đó với một nhánh, thẻ hoặc commit SHA đầy đủ trong khi sử dụng tệp workflow từ ref kích hoạt đã chọn; đường cơ sở số dòng tối đa được so sánh với merge base của mục tiêu so với head của nhánh mặc định được phân giải cho lượt chạy đó. Đầu vào `release_gate` là phương án dự phòng theo SHA chính xác dành cho người bảo trì khi CI của PR bị đình trệ do năng lực: đầu vào này yêu cầu `target_ref` là một commit SHA đầy đủ khớp với head của nhánh được kích hoạt và `pull_request_number` xác định PR đang mở có cây merge được xác thực.

```bash
gh workflow run ci.yml --ref release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

Lộ trình extended-stable chỉ dành cho npm hằng tháng là ngoại lệ: kích hoạt cả bước kiểm tra trước `OpenClaw NPM
Release` và `Full Release Validation` từ chính xác
nhánh `extended-stable/YYYY.M.33`, giữ lại ID lượt chạy của chúng và truyền cả hai ID vào
lượt phát hành npm trực tiếp. Xem [Phát hành extended-stable chỉ dành cho npm
hằng tháng](/vi/reference/RELEASING#monthly-npm-only-extended-stable-publication) để biết
các lệnh, yêu cầu định danh chính xác, thao tác đọc lại registry và quy trình
sửa selector. Lộ trình này không kích hoạt việc phát hành Plugin, macOS, Windows, GitHub
Release, dist-tag riêng tư hoặc nền tảng khác.

## Trình chạy

| Trình chạy                          | Công việc                                                                                                                                                                                                                                                                              |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                  | `security-fast`, các lượt kích hoạt CI thủ công và phương án dự phòng cho kho lưu trữ không chính tắc, bước tổng hợp QA Smoke, các lượt quét chất lượng và bảo mật CodeQL, kiểm tra tính hợp lệ của workflow, trình gắn nhãn, phản hồi tự động, workflow Docs độc lập và toàn bộ workflow Install Smoke                                |
| `blacksmith-4vcpu-ubuntu-2404`  | `preflight`, `pnpm-store-warmup`, `native-i18n`, `checks-fast-core` ngoại trừ QA Smoke CI, các shard hợp đồng Plugin/kênh, hầu hết các shard Linux Node đi kèm/có trọng số thấp hơn, các luồng `check-*` ngoại trừ `check-lint`, các shard `check-additional-*` được chọn, `check-docs` và `skills-python` |
| `blacksmith-8vcpu-ubuntu-2404`  | Các bộ kiểm thử Linux Node nặng được giữ lại, các shard `check-additional-*` chú trọng ranh giới/tiện ích mở rộng và `android`                                                                                                                                                                             |
| `blacksmith-16vcpu-ubuntu-2404` | Các shard QA Smoke CI tự động, `build-artifacts` trong CI và Testbox, cùng `check-lint` (đủ nhạy với CPU để 8 vCPU tốn kém hơn phần thời gian tiết kiệm được)                                                                                                                                  |
| `blacksmith-8vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                  |
| `blacksmith-6vcpu-macos-15`     | `macos-node` trên `openclaw/openclaw`; các fork dùng phương án dự phòng `macos-15`                                                                                                                                                                                                                |
| `blacksmith-12vcpu-macos-26`    | `macos-swift` và `ios-build` trên `openclaw/openclaw`; các fork dùng phương án dự phòng `macos-26`                                                                                                                                                                                               |

## Ngân sách đăng ký trình chạy

Nhóm đăng ký trình chạy GitHub hiện tại của OpenClaw báo cáo 10,000 lượt đăng ký
trình chạy tự lưu trữ mỗi 5 phút trong `ghx api rate_limit`. Hãy kiểm tra lại
`actions_runner_registration` trước mỗi lần tinh chỉnh vì GitHub có thể thay đổi
nhóm này. Giới hạn được dùng chung cho mọi lượt đăng ký trình chạy Blacksmith trong
tổ chức `openclaw`, vì vậy việc thêm một bản cài đặt Blacksmith khác không tạo thêm
nhóm mới.

Hãy coi các nhãn Blacksmith là tài nguyên khan hiếm để kiểm soát tải tăng đột biến. Những công việc
chỉ định tuyến, thông báo, tóm tắt, chọn shard hoặc chạy các lượt quét CodeQL ngắn nên
duy trì trên trình chạy do GitHub lưu trữ, trừ khi chúng có nhu cầu riêng đối với Blacksmith đã được
đo lường. Mọi ma trận Blacksmith mới, `max-parallel` lớn hơn hoặc
workflow có tần suất cao phải thể hiện số lượt đăng ký trong trường hợp xấu nhất và giữ mục tiêu
ở cấp tổ chức dưới khoảng 60% nhóm đang hoạt động. Với nhóm 10,000 lượt đăng ký
hiện tại, điều đó tương ứng với mục tiêu vận hành 6,000 lượt đăng ký, để lại dư địa cho
các kho lưu trữ chạy đồng thời, các lượt thử lại và tải tăng đột biến chồng lấn.

Kế hoạch PR theo mục tiêu đã thay đổi giảm mức tăng đột biến phổ biến của kiểm thử Node từ 14 lượt đăng ký Blacksmith xuống còn một. Các PR có rủi ro rộng vẫn dùng phương án dự phòng gọn với 14 lượt đăng ký, vì vậy trường hợp xấu nhất không tăng.

CI của kho lưu trữ chính tắc duy trì Blacksmith làm lộ trình trình chạy mặc định cho các lượt push và pull request thông thường. Các lượt chạy `workflow_dispatch` và kho lưu trữ không chính tắc sử dụng trình chạy do GitHub lưu trữ, nhưng các lượt chạy chính tắc thông thường hiện không thăm dò tình trạng hàng đợi Blacksmith hoặc tự động chuyển về nhãn do GitHub lưu trữ khi Blacksmith không khả dụng.

## Lệnh tương đương cục bộ

```bash
pnpm changed:lanes                            # kiểm tra bộ phân loại luồng thay đổi cục bộ cho origin/main...HEAD
pnpm check:changed                            # cổng kiểm tra cục bộ thông minh: định dạng/typecheck/lint/bộ bảo vệ đã thay đổi theo luồng ranh giới
pnpm check                                    # cổng cục bộ nhanh: tsgo sản phẩm + lint phân shard + các bộ bảo vệ nhanh chạy song song
pnpm check:test-types
pnpm check:timed                              # cùng cổng với thời gian của từng giai đoạn
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1 node scripts/run-vitest.mjs run --config test/vitest/vitest.tui-pty.config.ts
pnpm test                                     # các kiểm thử vitest
pnpm test:changed                             # các mục tiêu Vitest thay đổi thông minh, ít tốn tài nguyên
pnpm test:ui                                  # bộ kiểm thử đơn vị/trình duyệt của Control UI
pnpm ui:i18n:check                            # tính đồng nhất locale được tạo của Control UI (cổng phát hành)
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs                               # định dạng + lint tài liệu + liên kết hỏng
pnpm build                                    # build dist khi các kiểm tra artifact/smoke của CI quan trọng
pnpm ios:build                                # tạo và build dự án ứng dụng iOS
pnpm ci:timings                               # tóm tắt lượt chạy CI push origin/main mới nhất
pnpm ci:timings:recent                        # so sánh các lượt chạy CI main thành công gần đây
node scripts/ci-run-timings.mjs <run-id>      # tóm tắt tổng thời gian, thời gian chờ và các công việc chậm nhất
node scripts/ci-run-timings.mjs --latest-main # bỏ qua nhiễu từ issue/bình luận và chọn CI push origin/main
node scripts/ci-run-timings.mjs --recent 10   # so sánh các lượt chạy CI main thành công gần đây
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
pnpm test:startup:memory
pnpm test:extensions:memory -- --json .artifacts/openclaw-performance/source/mock-provider/extension-memory.json
pnpm perf:kova:summary --report .artifacts/kova/reports/mock-provider/report.json --output .artifacts/kova/summary.md
```

## Hiệu năng OpenClaw

`OpenClaw Performance` là workflow hiệu năng sản phẩm/môi trường chạy. Workflow này chạy hằng ngày trên `main` và có thể được kích hoạt thủ công:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_openai_candidate=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

Theo mặc định, kích hoạt thủ công đo chuẩn ref của workflow. Đặt `target_ref` để đo chuẩn một thẻ phát hành hoặc nhánh khác bằng cách triển khai workflow hiện tại. Các đường dẫn báo cáo đã phát hành và con trỏ mới nhất được lập khóa theo ref được kiểm thử, đồng thời mỗi `index.md` ghi lại ref/SHA được kiểm thử, ref/SHA của workflow, ref Kova, hồ sơ, chế độ xác thực của luồng, mô hình, số lần lặp lại và bộ lọc kịch bản.

Workflow cài đặt OCM từ một bản phát hành được ghim và Kova từ `openclaw/Kova` tại đầu vào `kova_ref` được ghim, sau đó chạy ba luồng:

- `mock-provider`: các kịch bản chẩn đoán Kova đối với runtime được build cục bộ với xác thực giả tương thích OpenAI có tính xác định.
- `mock-deep-profile`: lập hồ sơ CPU/heap/trace cho các điểm nóng khi khởi động, Gateway và lượt agent. Chạy theo lịch hoặc khi điều phối với `deep_profile=true`.
- `live-openai-candidate`: một lượt agent OpenAI `openai/gpt-5.6-luna` thực, được bỏ qua khi không có `OPENAI_API_KEY`. Chạy theo lịch hoặc khi điều phối với `live_openai_candidate=true`.

Lane nhà cung cấp mô phỏng cũng chạy các phép thăm dò nguồn gốc OpenClaw sau lượt Kova: thời gian khởi động Gateway và bộ nhớ trong các trường hợp khởi động mặc định, bỏ qua kênh, hook nội bộ và năm mươi Plugin; RSS khi nhập Plugin đi kèm, các vòng lặp chào `channel-chat-baseline` lặp lại với OpenAI mô phỏng, các lệnh khởi động CLI đối với Gateway đã khởi động và phép thăm dò hiệu năng smoke cho trạng thái SQLite. Khi báo cáo nguồn nhà cung cấp mô phỏng đã phát hành trước đó có sẵn cho ref được kiểm thử, bản tóm tắt nguồn sẽ so sánh các giá trị RSS và heap hiện tại với đường cơ sở đó và đánh dấu mức tăng RSS lớn là `watch`. Bản tóm tắt Markdown của phép thăm dò nguồn nằm tại `source/index.md` trong gói báo cáo, với JSON thô bên cạnh.

Mỗi lane tải lên artifact GitHub đầy đủ của mình, bao gồm các gói chẩn đoán CPU, heap, trace và đã nén. Một job phát hành riêng tải xuống và xác thực các artifact đó, sau đó tạo token GitHub App ClawSweeper có thời hạn ngắn, chỉ giới hạn trong nội dung `openclaw/clawgrit-reports`, và chỉ chuyển token đó cho bước Git push. Job này commit `report.json`, `report.md`, `index.md`, các artifact thăm dò nguồn và siêu dữ liệu/checksum của gói dưới `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`; kho lưu trữ chẩn đoán đầy đủ vẫn nằm trong artifact Actions được liên kết. Trình phát hành từ chối mọi tệp báo cáo lớn hơn 50 MB trước khi thử push. Con trỏ ref hiện đang được kiểm thử là `openclaw-performance/<tested-ref>/latest-<lane>.json`. Các lượt chạy theo lịch và điều phối `profile=release` sẽ thất bại nếu việc tạo token ứng dụng hoặc phát hành báo cáo thất bại. Các lượt điều phối thủ công không phải bản phát hành giữ việc phát hành ở mức khuyến nghị và giữ lại các artifact GitHub khi xác thực hoặc phát hành thất bại. Đường cơ sở nguồn trước đó được tìm nạp ẩn danh từ kho báo cáo công khai, vì vậy việc tìm nạp đường cơ sở thành công không chứng minh xác thực của trình phát hành.

## Xác thực bản phát hành đầy đủ

`Full Release Validation` là workflow bao trùm thủ công để "chạy mọi thứ trước khi phát hành". Workflow này nhận một nhánh, thẻ hoặc SHA commit đầy đủ, điều phối workflow `CI` thủ công với mục tiêu đó (bao gồm Android), điều phối `Plugin Prerelease` để cung cấp bằng chứng Plugin/gói/tĩnh/Docker chỉ dành cho bản phát hành, điều phối `OpenClaw Performance` đối với SHA mục tiêu và điều phối `OpenClaw Release Checks` cho smoke cài đặt, chấp nhận gói, kiểm tra gói đa hệ điều hành, tính tương đương của QA Lab, Matrix, Telegram cùng các lane Discord, WhatsApp và Slack có cổng kiểm soát (việc kết xuất bảng điểm mức độ trưởng thành mang tính khuyến nghị là tùy chọn qua `run_maturity_scorecard`). Hồ sơ ổn định và đầy đủ luôn bao gồm phạm vi kiểm thử live/E2E toàn diện và soak đường dẫn phát hành Docker; hồ sơ beta có thể bật tùy chọn này bằng `run_release_soak=true`. E2E Telegram chuẩn của gói chạy bên trong Chấp nhận gói, vì vậy một ứng viên đầy đủ không khởi động trình thăm dò live trùng lặp. Sau khi phát hành, truyền `release_package_spec` để tái sử dụng gói npm đã phát hành trong các kiểm tra bản phát hành, Chấp nhận gói, Docker, đa hệ điều hành và Telegram mà không build lại. Chỉ dùng `npm_telegram_package_spec` cho một lượt chạy lại Telegram tập trung đối với gói đã phát hành. Lane gói live của Plugin Codex mặc định dùng cùng trạng thái đã chọn: `release_package_spec=openclaw@<tag>` đã phát hành suy ra `codex_plugin_spec=npm:@openclaw/codex@<tag>`, còn các lượt chạy SHA/artifact đóng gói `extensions/codex` từ ref đã chọn. Đặt rõ `codex_plugin_spec` cho các nguồn Plugin tùy chỉnh như thông số `npm:`, `npm-pack:` hoặc `git:`. Bằng chứng agent live của lane này gửi tiến độ hiển thị, tiếp tục qua các lượt đọc workspace ngẫu nhiên và một lần ghi artifact chính xác, rồi gửi thông báo hoàn tất.

Xem [Xác thực bản phát hành đầy đủ](/vi/reference/full-release-validation) để biết
ma trận giai đoạn, tên chính xác của các job workflow, khác biệt giữa các hồ sơ, artifact và
các cơ chế chạy lại tập trung.

`OpenClaw Release Publish` là workflow phát hành có thay đổi trạng thái được chạy thủ công. Điều phối
các lượt phát hành beta và ổn định thông thường từ `main` đáng tin cậy sau khi thẻ phát hành
đã tồn tại và sau khi kiểm tra sơ bộ npm của OpenClaw thành công (kiểm tra sơ bộ chạy
`pnpm plugins:sync:check` trong số các bước kiểm tra). Thẻ vẫn chọn chính xác
commit phát hành, bao gồm cả commit trên `release/YYYY.M.PATCH`; các lượt phát hành alpha
Tideclaw tiếp tục dùng nhánh alpha tương ứng. Workflow yêu cầu
`preflight_run_id` đã lưu và một
`full_release_validation_run_id` thành công cùng
`full_release_validation_run_attempt` chính xác của nó, điều phối `Plugin NPM Release` cho tất cả
các gói Plugin có thể phát hành, điều phối `Plugin ClawHub Release` cho cùng
SHA phát hành và chỉ sau đó mới điều phối `OpenClaw NPM Release`. Việc phát hành ổn định cũng
yêu cầu một `windows_node_tag` chính xác; workflow xác minh bản phát hành nguồn Windows
và so sánh các trình cài đặt x64/ARM64 của nó với đầu vào
`windows_node_installer_digests` đã được ứng viên phê duyệt trước mọi workflow con phát hành, sau đó quảng bá
và xác minh chính các digest trình cài đặt đã ghim đó cùng artifact đồng hành chính xác
và hợp đồng checksum trước khi phát hành bản nháp bản phát hành GitHub.
Các bản sửa chữa chỉ dành cho Plugin có phạm vi tập trung sử dụng `plugin_publish_scope=selected` với danh sách
gói không rỗng. Các lượt chạy `all-publishable` chỉ dành cho Plugin yêu cầu cùng bằng chứng kiểm tra sơ bộ npm
bất biến và Xác thực bản phát hành đầy đủ như một lượt phát hành lõi.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref main \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f full_release_validation_run_attempt=<successful-full-release-validation-run-attempt> \
  -f npm_dist_tag=beta
```

Để cung cấp bằng chứng commit đã ghim trên một nhánh thay đổi nhanh, hãy dùng trình trợ giúp thay vì
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

Các ref điều phối workflow GitHub phải là nhánh hoặc thẻ, không phải SHA commit thô.
Trình trợ giúp push một nhánh `release-ci/<sha>-...` tạm thời tại SHA workflow
`main` đáng tin cậy, chuyển SHA mục tiêu được yêu cầu qua đầu vào `ref` của workflow,
tái sử dụng bằng chứng mục tiêu chính xác nghiêm ngặt khi có sẵn, xác minh `headSha` của mọi
workflow con khớp với SHA workflow đáng tin cậy và xóa nhánh tạm thời
khi lượt chạy hoàn tất. Truyền `-f reuse_evidence=false` để buộc xác thực mới.
Trình xác minh bao trùm cũng thất bại nếu bất kỳ workflow con nào chạy với
SHA workflow khác.

`release_profile` kiểm soát phạm vi live/nhà cung cấp được truyền vào các kiểm tra bản phát hành. Các
workflow phát hành thủ công mặc định là `stable`; chỉ dùng `full` khi bạn
cố ý muốn ma trận nhà cung cấp/phương tiện rộng mang tính khuyến nghị. Các kiểm tra bản phát hành
ổn định và đầy đủ luôn chạy soak toàn diện cho đường dẫn phát hành live/E2E và Docker;
hồ sơ beta có thể bật tùy chọn này bằng `run_release_soak=true`.

- `beta` giữ lại các lane OpenAI/lõi quan trọng nhất đối với bản phát hành và nhanh nhất.
- `stable` bổ sung tập hợp nhà cung cấp/backend ổn định.
- `full` chạy ma trận nhà cung cấp/phương tiện rộng mang tính khuyến nghị.

Workflow bao trùm ghi lại ID của các lượt chạy con đã điều phối, và job `Verify full validation` cuối cùng kiểm tra lại kết luận hiện tại của các lượt chạy con và bổ sung bảng các job chậm nhất cho từng lượt chạy con. Nếu một workflow con được chạy lại và chuyển sang xanh, chỉ chạy lại job xác minh của workflow cha để làm mới kết quả bao trùm và bản tóm tắt thời gian.

Để khôi phục, cả `Full Release Validation` và `OpenClaw Release Checks` đều chấp nhận `rerun_group`. Dùng `all` cho một ứng viên phát hành, `ci` chỉ cho workflow con CI đầy đủ thông thường, `plugin-prerelease` chỉ cho workflow con tiền phát hành Plugin, `performance` chỉ cho workflow con Hiệu năng OpenClaw, `release-checks` cho mọi workflow con phát hành hoặc một nhóm hẹp hơn: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` hoặc `npm-telegram` trên workflow bao trùm. Điều này giữ phạm vi chạy lại của một hộp phát hành bị lỗi ở mức giới hạn sau một bản sửa lỗi tập trung. Với một lane đa hệ điều hành bị lỗi, kết hợp `rerun_group=cross-os` với `cross_os_suite_filter`, ví dụ `windows/packaged-upgrade`; các lệnh đa hệ điều hành chạy lâu phát ra các dòng Heartbeat và bản tóm tắt nâng cấp gói bao gồm thời gian cho từng giai đoạn. Các lane QA Matrix và Telegram được chọn sẽ chặn xác thực bản phát hành thông thường, cũng như cổng kiểm tra phạm vi công cụ runtime tiêu chuẩn. Tính tương đương QA, tính tương đương runtime và các lane live Discord, WhatsApp và Slack có cổng kiểm soát mang tính khuyến nghị.

`OpenClaw Release Checks` dùng ref workflow đáng tin cậy để phân giải ref đã chọn một lần thành tarball `release-package-under-test`, sau đó chuyển artifact đó cho các kiểm tra đa hệ điều hành và Chấp nhận gói, cùng workflow Docker đường dẫn phát hành live/E2E khi chạy phạm vi soak. Điều này giữ byte của gói nhất quán giữa các hộp phát hành và tránh đóng gói lại cùng một ứng viên trong nhiều job con. Đối với lane live của Plugin npm Codex, các kiểm tra bản phát hành hoặc truyền một thông số Plugin đã phát hành tương ứng được suy ra từ `release_package_spec`, truyền `codex_plugin_spec` do người vận hành cung cấp hoặc để trống đầu vào để script Docker đóng gói Plugin Codex của checkout đã chọn.

Các lượt chạy `Full Release Validation` trùng lặp cho `ref=main` và `rerun_group=all`
thay thế workflow bao trùm cũ hơn. Trình giám sát cha hủy mọi workflow con mà nó
đã điều phối khi workflow cha bị hủy, để lượt xác thực main mới hơn
không phải chờ sau một lượt kiểm tra bản phát hành cũ kéo dài hai giờ. Việc xác thực
nhánh/thẻ phát hành và các nhóm chạy lại tập trung giữ nguyên `cancel-in-progress: false`.

## Các shard live và E2E

Workflow con live/E2E của bản phát hành giữ phạm vi `pnpm test:live` gốc rộng, nhưng chạy dưới dạng các shard có tên thông qua `scripts/test-live-shard.mjs` thay vì một job tuần tự:

- `native-live-src-agents` và `native-live-src-agents-zai-coding`
- `native-live-src-gateway-core`
- các job `native-live-src-gateway-profiles` được lọc theo nhà cung cấp
- `native-live-src-gateway-backends`
- `native-live-src-infra`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-moonshot`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- các shard âm thanh/video phương tiện được tách riêng và các shard âm nhạc được lọc theo nhà cung cấp

Điều này giữ nguyên phạm vi tệp trong khi giúp chạy lại và chẩn đoán các lỗi nhà cung cấp live chậm dễ dàng hơn. Các tên shard tổng hợp `native-live-src-gateway`, `native-live-extensions-o-z`, `native-live-extensions-media` và `native-live-extensions-media-music` vẫn hợp lệ cho các lượt chạy lại thủ công một lần.

Các shard phương tiện live gốc chạy trong `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, được build bởi workflow `Live Media Runner Image`. Image đó cài đặt sẵn `ffmpeg` và `ffprobe`; các job phương tiện chỉ xác minh các tệp nhị phân trước khi thiết lập. Giữ các bộ kiểm thử live dựa trên Docker trên runner Blacksmith thông thường — các job container không phù hợp để khởi chạy kiểm thử Docker lồng nhau.

Các shard mô hình/backend live dựa trên Docker sử dụng một image `ghcr.io/openclaw/openclaw-live-test:<sha>-<extensions>` dùng chung riêng biệt cho mỗi commit đã chọn. Workflow phát hành live build và push image đó một lần, sau đó các shard mô hình live Docker, Gateway phân shard theo nhà cung cấp, backend CLI, liên kết ACP và bộ kiểm thử Codex chạy với `OPENCLAW_SKIP_DOCKER_BUILD=1`. Các shard Gateway Docker mang giới hạn `timeout` rõ ràng ở cấp script, thấp hơn thời gian chờ của job workflow để một container bị treo hoặc đường dẫn dọn dẹp thất bại nhanh thay vì tiêu tốn toàn bộ ngân sách kiểm tra bản phát hành. Nếu các shard đó tự build lại toàn bộ mục tiêu Docker nguồn, lượt chạy phát hành đã bị cấu hình sai và sẽ lãng phí thời gian thực tế vào các lượt build image trùng lặp.

## Chấp nhận gói

Dùng `Package Acceptance` khi câu hỏi là "gói OpenClaw có thể cài đặt này có hoạt động như một sản phẩm không?" Quy trình này khác CI thông thường: CI thông thường xác thực cây nguồn, còn Chấp nhận gói xác thực một tarball duy nhất thông qua cùng bộ kiểm thử Docker E2E mà người dùng thực hiện sau khi cài đặt hoặc cập nhật.

### Các job

1. `resolve_package` checkout `workflow_ref`, phân giải một ứng viên gói, ghi `.artifacts/docker-e2e-package/openclaw-current.tgz`, ghi `.artifacts/docker-e2e-package/package-candidate.json`, tải cả hai lên dưới dạng artifact `package-under-test`, đồng thời in nguồn, ref quy trình làm việc, ref gói, phiên bản, SHA-256 và hồ sơ trong phần tóm tắt bước GitHub.
2. `package_integrity` tải xuống artifact `package-under-test` và thực thi hợp đồng tarball gói công khai bằng `scripts/check-openclaw-package-tarball.mjs`.
3. `docker_acceptance` gọi `openclaw-live-and-e2e-checks-reusable.yml` với SHA nguồn gói đã phân giải (dự phòng về `workflow_ref`) và `package_artifact_name=package-under-test`. Quy trình làm việc tái sử dụng tải artifact đó xuống, xác thực danh mục tarball, chuẩn bị các image Docker theo digest gói khi cần và chạy các lane Docker đã chọn trên gói đó thay vì đóng gói bản checkout của quy trình làm việc. Khi một hồ sơ chọn nhiều `docker_lanes` mục tiêu, quy trình làm việc tái sử dụng chuẩn bị gói và các image dùng chung một lần, sau đó phân tỏa các lane đó thành những job Docker mục tiêu chạy song song với các artifact riêng biệt.
4. `package_telegram` tùy chọn gọi `NPM Telegram Beta E2E`. Nó chạy khi `telegram_mode` không phải là `none` và cài đặt cùng artifact `package-under-test` khi Package Acceptance đã phân giải được một artifact; tác vụ điều phối Telegram độc lập vẫn có thể cài đặt một đặc tả npm đã phát hành.
5. `summary` làm quy trình làm việc thất bại nếu việc phân giải gói, kiểm tra tính toàn vẹn, chấp nhận Docker hoặc lane Telegram tùy chọn thất bại. Đầu vào `advisory` hạ các lỗi chấp nhận xuống thành cảnh báo cho những bên gọi mang tính tư vấn.

### Nguồn ứng viên

- `source=npm` chỉ chấp nhận `openclaw@extended-stable`, `openclaw@beta`, `openclaw@latest` hoặc một phiên bản phát hành OpenClaw chính xác như `openclaw@2026.4.27-beta.2`. Dùng tùy chọn này để chấp nhận bản extended-stable, bản phát hành trước hoặc bản ổn định đã phát hành.
- `source=ref` đóng gói một nhánh, thẻ hoặc SHA commit đầy đủ `package_ref` đáng tin cậy. Trình phân giải tìm nạp các nhánh/thẻ OpenClaw, xác minh commit đã chọn có thể truy cập được từ lịch sử nhánh của kho lưu trữ hoặc một thẻ phát hành, cài đặt các phần phụ thuộc trong một worktree tách rời và đóng gói bằng `scripts/package-openclaw-for-docker.mjs`.
- `source=url` tải xuống một `.tgz` HTTPS công khai; bắt buộc phải có `package_sha256`. Đường dẫn này từ chối thông tin xác thực trong URL, cổng HTTPS không mặc định, tên máy chủ hoặc IP đã phân giải thuộc mạng riêng/nội bộ/dành cho mục đích đặc biệt, cũng như các chuyển hướng nằm ngoài cùng chính sách an toàn công khai.
- `source=trusted-url` tải xuống một `.tgz` HTTPS từ chính sách nguồn đáng tin cậy có tên trong `.github/package-trusted-sources.json`; bắt buộc phải có `package_sha256` và `trusted_source_id`. Chỉ dùng tùy chọn này cho các mirror doanh nghiệp do người bảo trì sở hữu hoặc các kho gói riêng cần cấu hình máy chủ, cổng, tiền tố đường dẫn, máy chủ chuyển hướng hoặc khả năng phân giải mạng riêng. Nếu chính sách khai báo xác thực bearer, quy trình làm việc sẽ dùng secret `OPENCLAW_TRUSTED_PACKAGE_TOKEN` cố định; thông tin xác thực nhúng trong URL vẫn bị từ chối.
- `source=artifact` tải xuống một `.tgz` từ `artifact_run_id` và `artifact_name`; `package_sha256` là tùy chọn nhưng nên được cung cấp cho các artifact được chia sẻ ra bên ngoài.

Giữ `workflow_ref` và `package_ref` tách biệt. `workflow_ref` là mã quy trình làm việc/bộ kiểm thử đáng tin cậy thực thi bài kiểm thử. `package_ref` là commit nguồn được đóng gói khi `source=ref`. Điều này cho phép bộ kiểm thử hiện tại xác thực các commit nguồn đáng tin cậy cũ hơn mà không chạy logic quy trình làm việc cũ.

### Hồ sơ bộ kiểm thử

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `skill-install`, `update-corrupt-plugin`, `upgrade-survivor`, `published-upgrade-survivor`, `root-managed-vps-upgrade`, `update-restart-auth`, `plugins-offline`, `plugin-update`
- `product` — tập hợp `package` với phạm vi kiểm thử `plugins` trực tiếp thay cho `plugins-offline`, cộng thêm `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — các phân đoạn đầy đủ của đường dẫn phát hành Docker với OpenWebUI
- `custom` — `docker_lanes` chính xác; bắt buộc khi `suite_profile=custom`

Hồ sơ `package` sử dụng phạm vi kiểm thử Plugin ngoại tuyến để việc xác thực gói đã phát hành không phụ thuộc vào tính khả dụng trực tiếp của ClawHub. Lane Telegram tùy chọn tái sử dụng artifact `package-under-test` trong `NPM Telegram Beta E2E`, đồng thời giữ lại đường dẫn đặc tả npm đã phát hành cho các tác vụ điều phối độc lập.

Để xem chính sách chuyên biệt về kiểm thử bản cập nhật và Plugin, bao gồm các lệnh cục bộ,
lane Docker, đầu vào Package Acceptance, giá trị mặc định cho bản phát hành và phân loại lỗi,
hãy xem [Kiểm thử bản cập nhật và Plugin](/vi/help/testing-updates-plugins).

Các bước kiểm tra phát hành gọi Package Acceptance với `source=artifact`, artifact gói phát hành đã chuẩn bị, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor root-managed-vps-upgrade update-restart-auth plugins-offline plugin-update plugin-binding-command-escape'` và `telegram_mode=mock-openai`. Điều này giữ cho việc di chuyển gói, cập nhật, cài đặt skill ClawHub trực tiếp, dọn dẹp phần phụ thuộc Plugin lỗi thời, sửa chữa cài đặt Plugin đã cấu hình, Plugin ngoại tuyến, cập nhật Plugin và bằng chứng Telegram cùng sử dụng một tarball gói đã phân giải. Đặt `release_package_spec` trên Full Release Validation hoặc OpenClaw Release Checks sau khi phát hành bản beta để chạy cùng ma trận trên gói npm đã phát hành mà không xây dựng lại; chỉ đặt `package_acceptance_package_spec` khi Package Acceptance cần một gói khác với phần còn lại của quy trình xác thực phát hành. Các bước kiểm tra phát hành đa hệ điều hành vẫn bao phủ quy trình thiết lập ban đầu, trình cài đặt và hành vi theo nền tảng; việc xác thực sản phẩm về gói/cập nhật nên bắt đầu bằng Package Acceptance.

Lane Docker `published-upgrade-survivor` xác thực một đường cơ sở gói đã phát hành cho mỗi lần chạy trong đường dẫn phát hành chặn. Trong Package Acceptance, tarball `package-under-test` đã phân giải luôn là ứng viên và `published_upgrade_survivor_baseline` chọn đường cơ sở đã phát hành dự phòng, mặc định là `openclaw@latest`; các lệnh chạy lại lane thất bại giữ nguyên đường cơ sở đó. Full Release Validation với `run_release_soak=true` hoặc `release_profile=full` đặt `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` và `published_upgrade_survivor_scenarios=reported-issues` để mở rộng trên bốn bản phát hành npm ổn định mới nhất, cộng với các bản phát hành ranh giới tương thích Plugin được ghim và các fixture mô phỏng vấn đề cho cấu hình Feishu, các tệp bootstrap/persona được giữ lại, cài đặt Plugin OpenClaw đã cấu hình, đường dẫn nhật ký dùng dấu ngã và các gốc phần phụ thuộc Plugin cũ lỗi thời. Các lựa chọn sống sót sau nâng cấp đã phát hành với nhiều đường cơ sở được phân mảnh theo đường cơ sở thành các job trình chạy Docker mục tiêu riêng biệt. Quy trình làm việc `Update Migration` riêng biệt sử dụng lane Docker `update-migration` với các đường cơ sở `all-since-2026.4.23` và các kịch bản `plugin-deps-cleanup` khi mục tiêu là dọn dẹp cập nhật đã phát hành một cách toàn diện, không phải phạm vi Full Release CI thông thường. Các lần chạy tổng hợp cục bộ có thể truyền đặc tả gói chính xác bằng `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, giữ một lane duy nhất bằng `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` như `openclaw@2026.4.15`, hoặc đặt `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` cho ma trận kịch bản. Lane đã phát hành cấu hình đường cơ sở bằng công thức lệnh `openclaw config set` được tích hợp sẵn, ghi lại các bước công thức trong `summary.json` và thăm dò `/healthz`, `/readyz`, cùng trạng thái RPC sau khi Gateway khởi động. Các lane mới dành cho gói đóng gói và trình cài đặt Windows cũng xác minh rằng một gói đã cài đặt có thể nhập phần ghi đè điều khiển trình duyệt từ một đường dẫn Windows tuyệt đối thô. Bài smoke kiểm thử lượt chạy agent OpenAI đa hệ điều hành mặc định dùng `OPENCLAW_CROSS_OS_OPENAI_MODEL` khi được đặt, nếu không thì dùng `openai/gpt-5.6-luna`, để bằng chứng cài đặt và Gateway sử dụng tầng kiểm thử GPT-5.6 có chi phí thấp hơn.

### Cửa sổ tương thích cũ

Package Acceptance có các cửa sổ tương thích cũ hữu hạn cho những gói đã phát hành. Các gói đến hết `2026.4.25`, bao gồm `2026.4.25-beta.*`, có thể dùng đường dẫn tương thích:

- các mục QA riêng tư đã biết trong `dist/postinstall-inventory.json` có thể trỏ đến các tệp bị lược khỏi tarball;
- `doctor-switch` có thể bỏ qua trường hợp con về tính bền vững `gateway install --wrapper` khi gói không cung cấp cờ đó;
- `update-channel-switch` có thể loại bỏ các `patchedDependencies` pnpm bị thiếu khỏi fixture git giả được tạo từ tarball và có thể ghi nhật ký các `update.channel` bền vững bị thiếu;
- các bài smoke Plugin có thể đọc vị trí bản ghi cài đặt cũ hoặc chấp nhận việc thiếu tính bền vững của bản ghi cài đặt marketplace;
- `plugin-update` có thể cho phép di chuyển siêu dữ liệu cấu hình trong khi vẫn yêu cầu bản ghi cài đặt và hành vi không cài đặt lại giữ nguyên.

Gói `2026.4.26` đã phát hành cũng có thể cảnh báo về các tệp dấu siêu dữ liệu bản dựng cục bộ đã được phát hành, và các gói đến hết `2026.5.20` có thể cảnh báo thay vì thất bại khi thiếu `npm-shrinkwrap.json`. Các gói mới hơn phải đáp ứng các hợp đồng hiện đại; cùng những điều kiện đó sẽ gây thất bại thay vì cảnh báo hoặc bị bỏ qua.

### Ví dụ

```bash
# Xác thực gói beta hiện tại với phạm vi kiểm thử cấp sản phẩm.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai

# Xác thực gói extended-stable đã phát hành với phạm vi kiểm thử gói.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@extended-stable \
  -f suite_profile=package \
  -f telegram_mode=mock-openai

# Đóng gói và xác thực một nhánh phát hành bằng bộ kiểm thử hiện tại.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=ref \
  -f package_ref=release/YYYY.M.PATCH \
  -f suite_profile=package \
  -f telegram_mode=mock-openai

# Xác thực một URL tarball. SHA-256 là bắt buộc đối với source=url.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=url \
  -f package_url=https://example.com/openclaw-current.tgz \
  -f package_sha256=<64-char-sha256> \
  -f suite_profile=smoke

# Xác thực tarball từ một chính sách mirror riêng đáng tin cậy có tên.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=trusted-url \
  -f trusted_source_id=enterprise-artifactory \
  -f package_url=https://packages.example.internal:8443/artifactory/openclaw/openclaw-current.tgz \
  -f package_sha256=<64-char-sha256> \
  -f suite_profile=smoke

# Tái sử dụng tarball do một lần chạy Actions khác tải lên.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=package-under-test \
  -f suite_profile=custom \
  -f docker_lanes='install-e2e plugin-update'
```

Khi gỡ lỗi một lần chạy chấp nhận gói thất bại, hãy bắt đầu tại phần tóm tắt `resolve_package` để xác nhận nguồn gói, phiên bản và SHA-256. Sau đó kiểm tra lần chạy con `docker_acceptance` và các artifact Docker của nó: `.artifacts/docker-tests/**/summary.json`, `failures.json`, nhật ký lane, thời gian từng giai đoạn và lệnh chạy lại. Ưu tiên chạy lại hồ sơ gói thất bại hoặc chính xác các lane Docker thay vì chạy lại toàn bộ quy trình xác thực phát hành.

## Smoke kiểm thử cài đặt

Quy trình làm việc `Install Smoke` không còn chạy trên các pull request hoặc lần đẩy `main`. Trình bao bọc chạy hằng đêm/thủ công và quy trình xác thực phát hành của nó đều gọi lõi chỉ đọc `install-smoke-reusable.yml`, và mỗi lần chạy đều thực hiện đầy đủ đường dẫn smoke kiểm thử cài đặt trên các trình chạy do GitHub lưu trữ:

- Image smoke Dockerfile gốc được xây dựng một lần cho mỗi SHA mục tiêu, được ràng buộc với bản sửa đổi quy trình làm việc và lần thử của trình tạo trong một artifact bất biến, sau đó được tải bởi smoke CLI, smoke CLI xóa agent trong không gian làm việc dùng chung, E2E mạng Gateway của container và smoke đối số bản dựng Plugin `matrix` đi kèm. Bài smoke Plugin xác minh việc phản chiếu cài đặt phần phụ thuộc thời gian chạy và xác minh Plugin tải mà không có chẩn đoán thoát khỏi điểm vào.
- Cài đặt gói QR và các bài smoke Docker về trình cài đặt/cập nhật (bao gồm các lane trình cài đặt Rocky Linux và một lane cập nhật dựa trên đường cơ sở npm `update_baseline_version` có thể cấu hình) chạy dưới dạng các job riêng biệt để công việc trình cài đặt không phải chờ sau các bài smoke image gốc.

Quy trình kiểm tra nhanh nhà cung cấp hình ảnh bằng cài đặt Bun toàn cục chậm được kiểm soát riêng bởi `run_bun_global_install_smoke`. Quy trình này chạy theo lịch hằng đêm, mặc định được bật cho các lệnh gọi workflow từ kiểm tra bản phát hành, và các lần điều phối `Install Smoke` thủ công có thể chọn tham gia. Pipeline CI PR thông thường vẫn chạy làn hồi quy trình khởi chạy Bun nhanh cho các thay đổi liên quan đến Node. Các kiểm thử Docker cho QR và trình cài đặt vẫn giữ các Dockerfile riêng tập trung vào việc cài đặt.

## E2E Docker cục bộ

`pnpm test:docker:all` dựng trước một ảnh kiểm thử trực tiếp dùng chung, đóng gói OpenClaw một lần dưới dạng tarball npm và xây dựng hai ảnh `scripts/e2e/Dockerfile` dùng chung:

- một trình chạy Node/Git cơ bản cho các làn trình cài đặt/cập nhật/phụ thuộc Plugin;
- một ảnh chức năng cài đặt cùng tarball vào `/app` cho các làn chức năng thông thường.

Các định nghĩa làn Docker nằm trong `scripts/lib/docker-e2e-scenarios.mjs`, logic lập kế hoạch nằm trong `scripts/lib/docker-e2e-plan.mjs`, còn trình chạy chỉ thực thi kế hoạch đã chọn. Bộ lập lịch chọn ảnh cho từng làn bằng `OPENCLAW_DOCKER_E2E_BARE_IMAGE` và `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, sau đó chạy các làn bằng `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Tham số điều chỉnh

| Biến                                   | Mặc định | Mục đích                                                                                      |
| -------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | Số vị trí trong nhóm chính dành cho các làn thông thường.                                     |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | Số vị trí trong nhóm cuối nhạy cảm với nhà cung cấp.                                          |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | Giới hạn số làn trực tiếp đồng thời để nhà cung cấp không điều tiết.                           |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 5       | Giới hạn số làn cài đặt npm đồng thời.                                                        |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | Giới hạn số làn đa dịch vụ đồng thời.                                                         |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | Khoảng giãn giữa các lần bắt đầu làn để tránh bão tạo của daemon Docker; đặt `0` để không giãn. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | Thời gian chờ dự phòng cho mỗi làn (120 phút); các làn trực tiếp/cuối được chọn dùng giới hạn chặt hơn. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | chưa đặt | `1` in kế hoạch của bộ lập lịch mà không chạy các làn.                          |
| `OPENCLAW_DOCKER_ALL_LANES`            | chưa đặt | Danh sách chính xác các làn, phân tách bằng dấu phẩy; bỏ qua kiểm tra nhanh dọn dẹp để tác nhân có thể tái hiện một làn thất bại. |

Một làn nặng hơn giới hạn hiệu dụng vẫn có thể bắt đầu từ một nhóm trống, sau đó chạy một mình cho đến khi giải phóng dung lượng. Quy trình tổng hợp cục bộ kiểm tra trước Docker, xóa các container E2E OpenClaw cũ, phát trạng thái làn đang hoạt động, lưu thời gian làn để sắp xếp làn dài nhất trước và mặc định ngừng lập lịch các làn nhóm mới sau lỗi đầu tiên.

### Workflow trực tiếp/E2E có thể tái sử dụng

Workflow trực tiếp/E2E có thể tái sử dụng hỏi `scripts/test-docker-all.mjs --plan-json` cần gói, loại ảnh, ảnh trực tiếp, làn và mức bao phủ thông tin xác thực nào. Sau đó, `scripts/docker-e2e.mjs` chuyển đổi kế hoạch đó thành đầu ra và bản tóm tắt GitHub. Nó đóng gói OpenClaw thông qua `scripts/package-openclaw-for-docker.mjs`, tải xuống artifact gói của lần chạy hiện tại hoặc tải xuống artifact gói từ `package_artifact_run_id`, rồi xác thực danh mục tarball. Đường dẫn `no-push-artifact` mặc định xây dựng các ảnh cơ bản/chức năng được gắn thẻ theo mã băm gói thông qua bộ nhớ đệm lớp Docker của Blacksmith, đóng gói chính xác các byte ảnh vào một artifact workflow bất biến và yêu cầu mỗi bên sử dụng xác minh rồi nạp artifact đó. Thay vào đó, `existing-only` yêu cầu rõ ràng các tham chiếu GHCR `docker_e2e_bare_image`/`docker_e2e_functional_image` và không bao giờ xây dựng hoặc đẩy lên. Các thao tác kéo từ registry đó dùng thời gian chờ giới hạn 180 giây cho mỗi lần thử để một luồng bị kẹt được thử lại nhanh thay vì chiếm phần lớn đường găng của Pipeline CI. Sau khi xác thực theo lịch thành công, `openclaw-scheduled-live-checks.yml` chuyển bản kê ảnh đã kiểm thử bất biến cho trình xuất bản ghi gói riêng biệt; các bên gọi bản phát hành và bản phát hành trước chỉ đọc không bao giờ đi qua trình ghi đó.

### Các phân đoạn đường dẫn phát hành

Phạm vi Docker của bản phát hành chạy các công việc phân đoạn nhỏ hơn bằng `OPENCLAW_SKIP_DOCKER_BUILD=1` để mỗi phân đoạn chỉ xác minh và nạp loại ảnh dựa trên artifact mà nó cần (hoặc kéo ảnh theo cơ chế tái sử dụng `existing-only` rõ ràng), đồng thời thực thi nhiều làn thông qua cùng bộ lập lịch có trọng số:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h | openwebui`

Các phân đoạn Docker phát hành hiện tại là `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, từ `plugins-runtime-install-a` đến `plugins-runtime-install-h` và `openwebui`. `package-update-openai` bao gồm làn gói Plugin Codex trực tiếp, làn này cài đặt gói OpenClaw ứng viên, cài đặt Plugin Codex từ `codex_plugin_spec` hoặc tarball cùng tham chiếu với sự phê duyệt rõ ràng cho việc cài đặt Codex CLI, chạy kiểm tra trước Codex CLI và các lượt tác nhân trong cùng phiên, sau đó chạy một lượt suy luận mức trung bình không thử lại, lượt này gửi tiến độ, đọc các đầu vào không gian làm việc được ngẫu nhiên hóa, ghi artifact chính xác của chúng và gửi thông báo hoàn tất. `plugins-runtime-core`, `plugins-runtime` và `plugins-integrations` vẫn là các bí danh tổng hợp Plugin/runtime. Bí danh làn `install-e2e` vẫn là bí danh chạy lại thủ công tổng hợp cho cả hai làn trình cài đặt nhà cung cấp.

OpenWebUI chạy dưới dạng một phân đoạn `openwebui` độc lập trên trình chạy Blacksmith chuyên dụng có đĩa lớn bất cứ khi nào phạm vi đường dẫn phát hành ổn định hoặc đầy đủ yêu cầu, ngay cả khi workflow có thể tái sử dụng định tuyến các công việc được hỗ trợ đến trình chạy do GitHub lưu trữ. Việc tách riêng thao tác kéo ảnh bên ngoài giúp ảnh lớn không cạnh tranh với các ảnh gói và Plugin dùng chung trong `plugins-runtime-services`; các phân đoạn Plugin/runtime tổng hợp cũ vẫn bao gồm OpenWebUI để tương thích với các lần chạy lại thủ công. Các làn cập nhật kênh đóng gói sẵn thử lại một lần khi gặp lỗi mạng npm tạm thời.

Mỗi phân đoạn tải lên `.artifacts/docker-tests/` cùng nhật ký làn, thời gian, `summary.json`, `failures.json`, thời gian từng giai đoạn, JSON kế hoạch bộ lập lịch, bảng làn chậm và lệnh chạy lại cho từng làn. Đầu vào `docker_lanes` của workflow chạy các làn đã chọn với những ảnh được chuẩn bị cho lần chạy đó thay vì các công việc phân đoạn, nhờ đó việc gỡ lỗi làn thất bại được giới hạn trong một công việc Docker có mục tiêu; nếu làn đã chọn là làn Docker trực tiếp, công việc có mục tiêu sẽ xây dựng ảnh kiểm thử trực tiếp cục bộ cho lần chạy lại đó. Trình trợ giúp chạy lại xác thực SHA mục tiêu đã chọn chính xác của artifact lỗi và thao tác điều phối thủ công đóng gói lại tham chiếu đó, vì bộ giá trị gói của workflow nội bộ có thể tái sử dụng không thuộc lược đồ `workflow_dispatch`. Các lệnh được tạo chỉ bao gồm đầu vào ảnh đã chuẩn bị và `shared_image_policy=existing-only` khi những đầu vào đó dựa trên GHCR; các thẻ artifact cục bộ của trình chạy bị bỏ qua để trình chạy mới xây dựng lại chúng. Việc ghi đè mục tiêu rõ ràng sẽ loại bỏ các tham chiếu ảnh GHCR được khôi phục trừ khi artifact chứng minh chúng khớp với giá trị ghi đè. Các tham chiếu định nghĩa workflow do artifact tạo cũng bị bỏ qua vì các nhánh tạm thời của bản phát hành đầy đủ bị xóa; thao tác điều phối sử dụng nhánh mặc định của kho lưu trữ trừ khi người vận hành ghi đè rõ ràng.

```bash
pnpm test:docker:rerun <run-id>      # tải xuống các artifact Docker và in các lệnh chạy lại có mục tiêu kết hợp/theo từng làn
pnpm test:docker:timings <summary>   # bản tóm tắt làn chậm và đường găng theo giai đoạn
```

Workflow trực tiếp/E2E theo lịch chạy toàn bộ bộ Docker của đường dẫn phát hành hằng ngày và sau khi thành công sẽ gọi trình xuất bản rõ ràng cho đúng các artifact ảnh đã kiểm thử.

## Bản phát hành trước của Plugin

`Plugin Prerelease` là phạm vi sản phẩm/gói tốn kém hơn, vì vậy đây là một workflow riêng được điều phối bởi `Full Release Validation` hoặc bởi một người vận hành rõ ràng. Các pull request thông thường, thao tác đẩy `main` và thao tác điều phối CI thủ công độc lập không chạy bộ này. Workflow cân bằng các kiểm thử Plugin đóng gói sẵn trên tám worker tiện ích mở rộng; các công việc phân đoạn tiện ích mở rộng đó chạy đồng thời tối đa hai nhóm cấu hình Plugin với một worker Vitest cho mỗi nhóm và heap Node lớn hơn để các lô Plugin có nhiều thao tác nhập không tạo thêm công việc CI. Đường dẫn bản phát hành trước Docker chỉ dành cho bản phát hành (được bật bởi đầu vào `full_release_validation`) xử lý các làn Docker có mục tiêu theo nhóm bốn làn để tránh dành trước hàng chục trình chạy cho các công việc kéo dài một đến ba phút. Workflow cũng tải lên artifact `plugin-inspector-advisory` mang tính thông tin từ `@openclaw/plugin-inspector`; các phát hiện của trình kiểm tra là đầu vào phân loại và không thay đổi cổng chặn Bản phát hành trước của Plugin.

## QA Lab

QA Lab có các làn CI chuyên dụng bên ngoài workflow chính có phạm vi thông minh. Tính tương đương tác nhân được lồng trong các bộ kiểm thử QA và phát hành rộng, không phải là một workflow PR độc lập. Sử dụng `Full Release Validation` với `rerun_group=qa-parity` khi tính tương đương cần đi cùng một lần xác thực rộng.

- Workflow `QA-Lab - All Lanes` chạy hằng đêm trên `main` và khi điều phối thủ công; workflow này phân nhánh thành các công việc mô phỏng tính tương đương cùng các công việc trực tiếp cho Matrix, Telegram, Discord, WhatsApp và Slack. Các công việc trực tiếp sử dụng môi trường `qa-live-shared`; Telegram, Discord, WhatsApp và Slack sử dụng lease Convex, còn Matrix cấp thông tin xác thực cục bộ dùng một lần.

Các kiểm tra bản phát hành chạy làn truyền tải trực tiếp Matrix và Telegram với nhà cung cấp mô phỏng xác định và các mô hình đủ điều kiện mô phỏng (`mock-openai/gpt-5.6-luna` và `mock-openai/gpt-5.6-luna-alt`) để hợp đồng kênh được tách biệt khỏi độ trễ của mô hình trực tiếp và quá trình khởi động Plugin nhà cung cấp thông thường. Gateway truyền tải trực tiếp vô hiệu hóa tìm kiếm bộ nhớ vì tính tương đương QA kiểm tra hành vi bộ nhớ riêng; khả năng kết nối nhà cung cấp được kiểm tra bởi các bộ mô hình trực tiếp, nhà cung cấp gốc và nhà cung cấp Docker riêng biệt.

Các cổng Matrix theo lịch và bản phát hành sử dụng máy chủ bộ QA Lab dùng chung và bộ điều hợp trực tiếp với các kịch bản phát hành. Giá trị mặc định của CLI và đầu vào workflow thủ công vẫn là `all`; các lần điều phối `all` thủ công phân nhánh thành các hồ sơ `transport`, `media`, `e2ee-smoke`, `e2ee-deep` và `e2ee-cli` để bằng chứng 93 kịch bản nằm trong thời gian chờ của mỗi công việc. Các lần điều phối thủ công tập trung chọn `fast`, `release` hoặc `transport` trong một công việc.

`OpenClaw Release Checks` cũng chạy các làn QA Lab trọng yếu đối với bản phát hành trước khi phê duyệt bản phát hành; cổng tính tương đương QA của nó chạy các gói ứng viên và đường cơ sở dưới dạng công việc làn song song, sau đó tải cả hai artifact xuống một công việc báo cáo nhỏ để thực hiện phép so sánh tính tương đương cuối cùng.

Đối với các PR thông thường, hãy dựa trên bằng chứng CI/kiểm tra theo phạm vi thay vì coi tính tương đương là một trạng thái bắt buộc.

## CodeQL

Workflow `CodeQL` được chủ ý thiết kế làm trình quét bảo mật vòng đầu có phạm vi hẹp, không phải quét toàn bộ kho lưu trữ. Các lần chạy hằng ngày, thủ công, thao tác đẩy `main` và lần chạy bảo vệ pull request không phải bản nháp sẽ quét mã workflow Actions cùng các bề mặt JavaScript/TypeScript có rủi ro cao nhất bằng truy vấn bảo mật có độ tin cậy cao, được lọc theo `security-severity` mức cao/nghiêm trọng.

Cơ chế bảo vệ pull request vẫn nhẹ: nó chỉ bắt đầu đối với các thay đổi trong `.github/actions`, `.github/codeql`, `.github/workflows`, `packages`, `scripts`, `src` hoặc các đường dẫn runtime Plugin đóng gói sẵn sở hữu tiến trình, đồng thời chạy cùng ma trận bảo mật có độ tin cậy cao như workflow theo lịch. CodeQL cho Android và macOS không nằm trong cấu hình PR mặc định.

### Danh mục bảo mật

| Danh mục                                          | Bề mặt                                                                                                                             |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Đường cơ sở về xác thực, bí mật, sandbox, cron và Gateway                                                                                  |
| `/codeql-security-high/channel-runtime-boundary`  | Các hợp đồng triển khai kênh lõi cùng runtime Plugin kênh, Gateway, Plugin SDK, bí mật và các điểm tiếp xúc kiểm tra              |
| `/codeql-security-high/network-ssrf-boundary`     | Các bề mặt chính sách SSRF của SSRF lõi, phân tích cú pháp IP, cơ chế bảo vệ mạng, tìm nạp web và Plugin SDK                                                |
| `/codeql-security-high/mcp-process-tool-boundary` | Máy chủ MCP, trình trợ giúp thực thi tiến trình, phân phối ra ngoài và các cổng thực thi công cụ của agent                                           |
| `/codeql-security-high/process-exec-boundary`     | Shell cục bộ, trình trợ giúp tạo tiến trình, runtime Plugin đóng gói sở hữu tiến trình con và mã kết nối tập lệnh quy trình làm việc                             |
| `/codeql-security-high/plugin-trust-boundary`     | Các bề mặt tin cậy của hợp đồng gói Plugin SDK, cài đặt Plugin, trình tải, manifest, registry, cài đặt trình quản lý gói và tải nguồn |

### Các phân đoạn bảo mật theo nền tảng

- `CodeQL Android Critical Security` — phân đoạn bảo mật Android theo lịch. Xây dựng ứng dụng Android thủ công cho CodeQL trên runner Blacksmith Linux nhỏ nhất được kiểm tra tính hợp lệ của quy trình làm việc chấp nhận. Tải lên dưới `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — phân đoạn bảo mật macOS hằng tuần/thủ công. Xây dựng ứng dụng macOS thủ công cho CodeQL trên Blacksmith macOS, lọc kết quả xây dựng phần phụ thuộc khỏi SARIF được tải lên và tải lên dưới `/codeql-critical-security/macos`. Được giữ ngoài các giá trị mặc định hằng ngày vì việc xây dựng macOS chiếm phần lớn thời gian chạy ngay cả khi không có vấn đề.

### Các danh mục Chất lượng Quan trọng

`CodeQL Critical Quality` là phân đoạn phi bảo mật tương ứng. Nó chỉ chạy các truy vấn chất lượng JavaScript/TypeScript phi bảo mật ở mức độ nghiêm trọng lỗi trên các bề mặt hẹp có giá trị cao bằng runner Linux do GitHub lưu trữ, để quá trình quét chất lượng không tiêu tốn ngân sách đăng ký runner Blacksmith. Cổng pull request của nó có chủ ý nhỏ hơn hồ sơ theo lịch: các PR không phải bản nháp chỉ chạy những phân đoạn tương ứng với các bề mặt chúng chạm tới, từ mười ba phân đoạn có thể định tuyến PR — `agent-runtime-boundary`, `channel-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `gateway-runtime-boundary`, `mcp-process-runtime-boundary`, `memory-runtime-boundary`, `network-runtime-boundary`, `plugin-boundary`, `plugin-sdk-package-contract`, `plugin-sdk-reply-runtime`, `provider-runtime-boundary` và `session-diagnostics-boundary`. `ui-control-plane` và `web-media-runtime-boundary` không tham gia các lần chạy PR. Các thay đổi về cấu hình CodeQL và quy trình làm việc chất lượng chạy toàn bộ tập phân đoạn PR (phân đoạn runtime mạng được kích hoạt dựa trên các tệp cấu hình CodeQL riêng và các đường dẫn nguồn sở hữu mạng).

Điều phối thủ công chấp nhận:

```text
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|network-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Các hồ sơ hẹp là những móc phục vụ hướng dẫn/lặp để chạy riêng lẻ một phân đoạn chất lượng.

| Danh mục                                                | Bề mặt                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Mã ranh giới bảo mật cho xác thực, bí mật, sandbox, cron và Gateway                                                                                                  |
| `/codeql-critical-quality/config-boundary`              | Các hợp đồng về schema cấu hình, di chuyển, chuẩn hóa và IO                                                                                                         |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Schema giao thức Gateway và các hợp đồng phương thức máy chủ                                                                                                              |
| `/codeql-critical-quality/channel-runtime-boundary`     | Các hợp đồng triển khai Plugin kênh lõi và kênh đóng gói                                                                                                  |
| `/codeql-critical-quality/agent-runtime-boundary`       | Các hợp đồng runtime cho thực thi lệnh, điều phối mô hình/nhà cung cấp, điều phối và hàng đợi tự động trả lời, cùng mặt phẳng điều khiển ACP                                               |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Máy chủ MCP và cầu nối công cụ, trình trợ giúp giám sát tiến trình và các hợp đồng phân phối ra ngoài                                                                        |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK máy chủ bộ nhớ, facade runtime bộ nhớ, bí danh Plugin SDK bộ nhớ, mã kết nối kích hoạt runtime bộ nhớ và các lệnh doctor bộ nhớ                                    |
| `/codeql-critical-quality/network-runtime-boundary`     | Gói chính sách mạng, runtime socket thô và ghi nhận proxy, đường hầm SSH, khóa Gateway, socket JSONL và các bề mặt truyền tải đẩy                                 |
| `/codeql-critical-quality/session-diagnostics-boundary` | Thành phần nội bộ của hàng đợi trả lời, hàng đợi phân phối phiên, trình trợ giúp liên kết/phân phối phiên ra ngoài, các bề mặt gói sự kiện/nhật ký chẩn đoán và hợp đồng CLI doctor phiên |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Điều phối trả lời đến của Plugin SDK, trình trợ giúp payload/phân đoạn/runtime trả lời, tùy chọn trả lời kênh, hàng đợi phân phối và trình trợ giúp liên kết phiên/luồng             |
| `/codeql-critical-quality/provider-runtime-boundary`    | Chuẩn hóa danh mục mô hình, xác thực và khám phá nhà cung cấp, đăng ký runtime nhà cung cấp, giá trị mặc định/danh mục nhà cung cấp và các registry web/tìm kiếm/tìm nạp/embedding    |
| `/codeql-critical-quality/ui-control-plane`             | Khởi động Control UI, lưu trữ cục bộ, luồng điều khiển Gateway và các hợp đồng runtime mặt phẳng điều khiển tác vụ                                                          |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Các hợp đồng runtime cho tìm nạp/tìm kiếm web lõi, IO phương tiện, hiểu phương tiện, tạo hình ảnh và tạo phương tiện                                                    |
| `/codeql-critical-quality/plugin-boundary`              | Các hợp đồng của trình tải, registry, bề mặt công khai và điểm vào Plugin SDK                                                                                             |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Nguồn Plugin SDK phía gói đã xuất bản và trình trợ giúp hợp đồng gói Plugin                                                                                      |

Chất lượng được giữ riêng với bảo mật để các phát hiện chất lượng có thể được lên lịch, đo lường, vô hiệu hóa hoặc mở rộng mà không che khuất tín hiệu bảo mật. Việc mở rộng CodeQL cho Swift, Python và Plugin đóng gói chỉ nên được bổ sung lại dưới dạng công việc tiếp theo có phạm vi hoặc được phân đoạn sau khi các hồ sơ hẹp có thời gian chạy và tín hiệu ổn định.

## Quy trình bảo trì

### Agent Tài liệu

Quy trình làm việc `Docs Agent` là một làn bảo trì Codex hướng sự kiện để giữ tài liệu hiện có đồng bộ với các thay đổi mới được hợp nhất. Nó không có lịch thuần túy: một lần chạy CI đẩy thành công không phải từ bot trên `main` có thể kích hoạt nó, và điều phối thủ công có thể chạy trực tiếp. Các lần gọi từ lần chạy quy trình làm việc sẽ bỏ qua khi `main` đã tiến tiếp hoặc khi một lần chạy Agent Tài liệu không bị bỏ qua khác được tạo trong giờ vừa qua. Khi chạy, nó xem xét phạm vi commit từ SHA nguồn của Agent Tài liệu không bị bỏ qua trước đó đến `main` hiện tại, vì vậy một lần chạy mỗi giờ có thể bao quát mọi thay đổi trên main tích lũy kể từ lượt xử lý tài liệu gần nhất.

### Agent Hiệu năng Kiểm thử

Quy trình làm việc `Test Performance Agent` là một làn bảo trì Codex hướng sự kiện dành cho các kiểm thử chậm. Nó không có lịch thuần túy: một lần chạy CI đẩy thành công không phải từ bot trên `main` có thể kích hoạt nó, nhưng sẽ bỏ qua nếu một lần gọi từ lần chạy quy trình làm việc khác đã chạy hoặc đang chạy trong ngày UTC đó. Điều phối thủ công bỏ qua cổng hoạt động hằng ngày này. Làn này xây dựng báo cáo hiệu năng Vitest được nhóm cho toàn bộ bộ kiểm thử, cho phép Codex chỉ thực hiện các bản sửa hiệu năng kiểm thử nhỏ có bảo toàn độ bao phủ thay vì tái cấu trúc rộng, sau đó chạy lại báo cáo toàn bộ bộ kiểm thử và từ chối những thay đổi làm giảm số lượng kiểm thử đường cơ sở vượt qua. Báo cáo được nhóm ghi lại thời gian thực tế theo từng cấu hình và RSS tối đa trên Linux và macOS, để phép so sánh trước/sau hiển thị mức thay đổi bộ nhớ kiểm thử bên cạnh mức thay đổi thời lượng. Nếu đường cơ sở có kiểm thử thất bại, Codex chỉ có thể sửa các lỗi rõ ràng và báo cáo toàn bộ bộ kiểm thử sau khi agent xử lý phải vượt qua trước khi bất kỳ nội dung nào được commit. Khi `main` tiến lên trước khi lần đẩy của bot được hợp nhất, làn này rebase bản vá đã xác thực, chạy lại `pnpm check:changed` và thử đẩy lại; các bản vá cũ xung đột sẽ bị bỏ qua. Nó sử dụng Ubuntu do GitHub lưu trữ để action Codex có thể duy trì cùng cơ chế an toàn loại bỏ sudo như agent tài liệu.

### Các PR trùng lặp sau khi hợp nhất

Quy trình làm việc `Duplicate PRs After Merge` là quy trình làm việc thủ công dành cho người bảo trì để dọn dẹp các mục trùng lặp sau khi hợp nhất. Theo mặc định, nó chạy thử và chỉ đóng các PR được liệt kê rõ ràng khi `apply=true`. Trước khi sửa đổi GitHub, nó xác minh rằng PR đã được hợp nhất và mỗi mục trùng lặp có một issue được tham chiếu chung hoặc các hunk đã thay đổi bị chồng lấn.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Các cổng kiểm tra cục bộ và định tuyến thay đổi

Logic làn thay đổi cục bộ nằm trong `scripts/changed-lanes.mjs` và được thực thi bởi `scripts/check-changed.mjs`. Cổng kiểm tra cục bộ đó nghiêm ngặt hơn về các ranh giới kiến trúc so với phạm vi nền tảng CI rộng:

- các thay đổi mã sản xuất lõi chạy kiểm tra kiểu mã sản xuất lõi và kiểm tra lõi, cùng lint/cổng bảo vệ lõi;
- các thay đổi chỉ dành cho kiểm thử lõi chỉ chạy kiểm tra kiểu kiểm thử lõi cùng lint lõi;
- các thay đổi mã sản xuất tiện ích mở rộng chạy kiểm tra kiểu mã sản xuất và kiểm thử tiện ích mở rộng, cùng lint tiện ích mở rộng;
- các thay đổi chỉ dành cho kiểm thử tiện ích mở rộng chạy kiểm tra kiểu kiểm thử tiện ích mở rộng cùng lint tiện ích mở rộng;
- các thay đổi Plugin SDK công khai hoặc hợp đồng Plugin mở rộng sang kiểm tra kiểu tiện ích mở rộng vì các tiện ích mở rộng phụ thuộc vào những hợp đồng lõi đó (các lượt quét tiện ích mở rộng Vitest vẫn là công việc kiểm thử riêng);
- các lần tăng phiên bản chỉ liên quan đến siêu dữ liệu phát hành chạy các kiểm tra có mục tiêu về phiên bản/cấu hình/phần phụ thuộc gốc;
- các thay đổi gốc/cấu hình không xác định chuyển sang chế độ an toàn bằng cách chạy tất cả các làn kiểm tra.

Định tuyến kiểm thử thay đổi cục bộ nằm trong `scripts/test-projects.test-support.mjs` và có chủ ý ít tốn kém hơn `check:changed`: các chỉnh sửa trực tiếp đối với kiểm thử sẽ chạy chính chúng, các chỉnh sửa nguồn ưu tiên ánh xạ tường minh, sau đó đến các kiểm thử cùng cấp và phần phụ thuộc trong đồ thị nhập. Cấu hình phân phối phòng nhóm dùng chung là một trong các ánh xạ tường minh: các thay đổi đối với cấu hình trả lời hiển thị trong nhóm, chế độ phân phối trả lời nguồn hoặc prompt hệ thống của công cụ tin nhắn được định tuyến qua các kiểm thử trả lời lõi cùng các kiểm thử hồi quy phân phối Discord và Slack, để một thay đổi mặc định dùng chung thất bại trước lần đẩy PR đầu tiên. Chỉ sử dụng `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` khi thay đổi có phạm vi toàn bộ harness đến mức tập ánh xạ ít tốn kém không còn là đại diện đáng tin cậy.

## Xác thực Testbox

Crabbox là trình bao bọc máy từ xa do repo sở hữu để thực hiện kiểm chứng Linux dành cho người bảo trì. Các phiên agent
chỉ giữ một hoặc vài bài kiểm thử tập trung và các bước kiểm tra tĩnh ít tốn tài nguyên ở máy cục bộ đối với
nguồn đáng tin cậy khi bản cài đặt phần phụ thuộc hiện có đã sẵn sàng. Chúng sử dụng Crabbox cho các bộ kiểm thử lớn hơn và
công việc tốn nhiều tài nguyên tính toán, bao gồm build, kiểm tra kiểu, phân tán lint,
Docker, các lane gói, E2E, kiểm chứng trực tiếp và tính tương đương với CI. Hoạt động kiểm chứng nặng của người bảo trì đáng tin cậy
mặc định dùng `blacksmith-testbox`, và `.crabbox.yaml` hiện cũng mặc định dùng nó. Quy trình làm việc đã cấu hình của nó
nạp thông tin xác thực của nhà cung cấp và agent, vì vậy mã từ cộng tác viên không đáng tin cậy hoặc
fork phải sử dụng CI fork không có secret hoặc Crabbox AWS trực tiếp đã được làm sạch.
Các lượt chạy AWS đã làm sạch đặt `CRABBOX_ENV_ALLOW=CI`, truyền
`--no-hydrate` và sử dụng `HOME` từ xa tạm thời mới; điều này ngăn danh sách cho phép
`OPENCLAW_*` của repo và các hồ sơ xác thực hiện có tiếp cận mã không đáng tin cậy.
Chúng sử dụng một lease mới được khởi động dành riêng cho nguồn không đáng tin cậy đó, tuyệt đối không dùng
lease đáng tin cậy hoặc lease đã được nạp thông tin xác thực trước đó. Khởi chạy tệp nhị phân Crabbox đáng tin cậy đã cài đặt
từ một checkout `main` sạch, đáng tin cậy và chỉ tìm nạp PR từ xa bằng
`--fresh-pr`; tuyệt đối không thực thi trình bao bọc hoặc cấu hình của checkout không đáng tin cậy ở máy cục bộ.
Bỏ đặt `CRABBOX_AWS_INSTANCE_PROFILE` và đóng khi có lỗi trừ khi
`aws.instanceProfile` sau khi phân giải là rỗng. Trước mọi thao tác cài đặt/kiểm thử, hãy dùng
các công cụ đường dẫn tuyệt đối đáng tin cậy để yêu cầu token IMDSv2, chứng minh endpoint thông tin xác thực
IAM trả về 404 và so sánh `git rev-parse HEAD` từ xa với SHA đầy đủ
của đầu PR đã review. Liên kết lease với SHA đó và dừng/khởi động lại khi đầu thay đổi.
Tải `scripts/crabbox-untrusted-bootstrap.sh` đáng tin cậy từ `main` sạch
cùng với `--fresh-pr`; nó cài đặt Node/pnpm được ghim, xác minh SHA và
bản ghim trình quản lý gói, cô lập `HOME`, cài đặt các phần phụ thuộc, rồi thực thi
bài kiểm thử được yêu cầu.
Bỏ đặt mọi giá trị ghi đè `CRABBOX_TAILSCALE*`, bắt buộc `--network public
--tailscale=false`, xóa các cờ exit-node/LAN và yêu cầu `crabbox inspect`
báo cáo mạng công cộng không có trạng thái Tailscale trước khi tải lên bất kỳ tập lệnh nào.
Dung lượng AWS/Hetzner sở hữu riêng cũng vẫn là phương án dự phòng khi Blacksmith ngừng hoạt động,
gặp vấn đề hạn ngạch hoặc khi cần kiểm thử rõ ràng trên dung lượng sở hữu riêng.

Agent không khởi động sẵn cho công việc dự kiến. Chỉ lấy Testbox khi
lệnh nặng đầu tiên đã sẵn sàng, tái sử dụng id `tbx_...` được trả về cho các lệnh nặng
sau đó, đồng bộ checkout hiện tại trong mỗi lượt chạy và dừng nó trước khi bàn giao.

Các lượt chạy Blacksmith dựa trên Crabbox khởi động, nhận quyền, đồng bộ, chạy, báo cáo và dọn dẹp
Testbox dùng một lần. Kiểm tra tính hợp lệ đồng bộ tích hợp sẵn sẽ thất bại ngay khi
`git status --short` trên máy đã đồng bộ hiển thị ít nhất 200 tệp được theo dõi bị xóa,
nhờ đó phát hiện các tệp gốc biến mất như `pnpm-lock.yaml`. Đối với các PR
cố ý xóa số lượng lớn, hãy đặt `CRABBOX_ALLOW_MASS_DELETIONS=1` cho lệnh từ xa.

Crabbox cũng kết thúc một lượt gọi Blacksmith CLI cục bộ nếu lượt gọi đó mắc kẹt trong
giai đoạn đồng bộ hơn năm phút mà không có đầu ra hậu đồng bộ. Đặt
`CRABBOX_BLACKSMITH_SYNC_TIMEOUT_MS=0` để tắt biện pháp bảo vệ đó hoặc dùng giá trị
mili giây lớn hơn cho các diff cục bộ lớn bất thường.

Trước lượt chạy đầu tiên, hãy kiểm tra trình bao bọc từ thư mục gốc của repo:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

Trình bao bọc của repo từ chối tệp nhị phân Crabbox cũ không công bố nhà cung cấp đã chọn, và các lượt chạy dựa trên Blacksmith yêu cầu Crabbox 0.22.0 trở lên để trình bao bọc nhận được hành vi đồng bộ, xếp hàng và dọn dẹp Testbox hiện tại. Trong worktree Codex hoặc checkout được liên kết/thưa, tránh tập lệnh `pnpm crabbox:run` cục bộ vì pnpm có thể điều chỉnh các phần phụ thuộc trước khi Crabbox khởi động; thay vào đó, hãy gọi trực tiếp trình bao bọc node:

```bash
node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox --timing-json --shell -- "pnpm test <path-or-filter>"
```

Khi sử dụng checkout cùng cấp, hãy build lại tệp nhị phân cục bộ bị bỏ qua trước khi thực hiện đo thời gian hoặc kiểm chứng:

```bash
version="$(git -C ../crabbox describe --tags --always --dirty | sed 's/^v//')" \
  && go build -C ../crabbox -trimpath -ldflags "-s -w -X github.com/openclaw/crabbox/internal/cli.version=${version}" -o bin/crabbox ./cmd/crabbox
```

Khối `blacksmith:` trong `.crabbox.yaml` đã ghim các giá trị mặc định cho tổ chức, quy trình làm việc, tác vụ và ref, vì vậy các cờ tường minh bên dưới là tùy chọn. Gate thay đổi:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox \
  --blacksmith-org openclaw \
  --blacksmith-workflow .github/workflows/ci-check-testbox.yml \
  --blacksmith-job check \
  --blacksmith-ref main \
  --idle-timeout 90m \
  --ttl 240m \
  --timing-json \
  --shell -- \
  "corepack pnpm check:changed"
```

Chạy lại bài kiểm thử tập trung trên Testbox khi các phần phụ thuộc cục bộ không khả dụng hoặc
mục tiêu bị phân tán:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox \
  --idle-timeout 90m \
  --ttl 240m \
  --timing-json \
  --shell -- \
  "corepack pnpm test <path-or-filter>"
```

Bộ kiểm thử đầy đủ:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox \
  --idle-timeout 90m \
  --ttl 240m \
  --timing-json \
  --shell -- \
  "corepack pnpm test"
```

Đọc bản tóm tắt JSON cuối cùng. Các trường hữu ích là `provider`, `leaseId`,
`syncDelegated`, `exitCode`, `commandMs` và `totalMs`. Đối với các lượt chạy
Blacksmith Testbox được ủy quyền, mã thoát và bản tóm tắt JSON của trình bao bọc Crabbox là
kết quả lệnh. Lượt chạy GitHub Actions được liên kết sở hữu việc nạp thông tin xác thực và duy trì hoạt động; nó
có thể kết thúc với trạng thái `cancelled` khi Testbox bị dừng bên ngoài sau khi lệnh SSH
đã trả về. Hãy xem đó là hiện vật dọn dẹp/trạng thái trừ khi
`exitCode` của trình bao bọc khác 0 hoặc đầu ra lệnh cho thấy bài kiểm thử thất bại.
Các lượt chạy Crabbox dùng một lần dựa trên Blacksmith phải tự động dừng Testbox;
nếu một lượt chạy bị gián đoạn hoặc việc dọn dẹp không rõ ràng, hãy kiểm tra các máy đang hoạt động và chỉ dừng
những máy do bạn tạo:

```bash
blacksmith testbox list --all
blacksmith testbox status --id <tbx_id>
blacksmith testbox stop --id <tbx_id>
```

Chỉ sử dụng tính năng tái sử dụng khi bạn chủ ý cần nhiều lệnh trên cùng một máy đã nạp thông tin xác thực:

```bash
node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox --id <tbx_id> --timing-json --shell -- "corepack pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

Tái sử dụng lease, không tái sử dụng mã nguồn cũ. Bỏ qua `--no-sync` để mỗi lượt chạy tải lên
checkout hiện tại; chỉ sử dụng nó để chủ ý chạy lại một cây không thay đổi và đã được đồng bộ.
Mã từ cộng tác viên/fork không đáng tin cậy phải sử dụng
`CRABBOX_ENV_ALLOW=CI`, `--provider aws --no-hydrate` và
`HOME` từ xa tạm thời mới cho mỗi lệnh; cài đặt các phần phụ thuộc bên trong
lệnh đã làm sạch đó trước khi kiểm thử. Chỉ tái sử dụng lease mới được khởi động dành riêng cho
cùng nguồn không đáng tin cậy; tuyệt đối không dùng lease đáng tin cậy hoặc đã được nạp thông tin xác thực trước đó. Tuyệt đối không
thực thi trình bao bọc hoặc cấu hình của checkout không đáng tin cậy ở máy cục bộ: khởi chạy tệp nhị phân
Crabbox đáng tin cậy đã cài đặt từ `main` sạch, đáng tin cậy và truyền `--fresh-pr` trong mọi
lượt chạy. Giữ `CRABBOX_AWS_INSTANCE_PROFILE` ở trạng thái chưa đặt, từ chối hồ sơ phiên bản đã phân giải
không rỗng, yêu cầu kiểm chứng IMDS từ xa đáng tin cậy rằng không có vai trò và xác minh
SHA đầu đã review trước khi cài đặt/kiểm thử. Liên kết lease với SHA đó; dừng và
khởi động lại sau mọi thay đổi đầu. Nếu không có PR từ xa, hãy sử dụng CI fork không có secret.
Tuyệt đối không chọn `hydrate-github` hoặc quy trình Blacksmith được nạp thông tin xác thực
cho nguồn không đáng tin cậy.

Nếu Crabbox là lớp bị lỗi nhưng bản thân Blacksmith vẫn hoạt động, chỉ sử dụng
Blacksmith trực tiếp cho hoạt động chẩn đoán như `list`, `status` và dọn dẹp. Sửa
đường dẫn Crabbox trước khi coi một lượt chạy Blacksmith trực tiếp là kiểm chứng của người bảo trì.

Nếu `blacksmith testbox list --all` và `blacksmith testbox status` hoạt động nhưng các lượt
khởi động mới nằm ở trạng thái `queued` mà không có IP hoặc URL lượt chạy Actions sau vài phút,
hãy xem đó là áp lực từ nhà cung cấp Blacksmith, hàng đợi, thanh toán hoặc giới hạn tổ chức. Dừng
các id đang xếp hàng mà bạn đã tạo, tránh khởi động thêm Testbox và chuyển hoạt động kiểm chứng sang
đường dẫn dung lượng Crabbox sở hữu riêng bên dưới trong khi có người kiểm tra bảng điều khiển Blacksmith,
thanh toán và các giới hạn tổ chức.

Chỉ chuyển sang dung lượng Crabbox sở hữu riêng khi Blacksmith ngừng hoạt động, bị giới hạn hạn ngạch, thiếu môi trường cần thiết hoặc dung lượng sở hữu riêng là mục tiêu được chỉ định rõ ràng:

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --provider aws --id <cbx_id-or-slug>
pnpm crabbox:run -- --provider aws --id <cbx_id-or-slug> --timing-json --shell -- "pnpm check:changed"
pnpm crabbox:stop -- --provider aws <cbx_id-or-slug>
```

Khi AWS chịu áp lực, tránh `class=beast` trừ khi tác vụ thực sự cần CPU cấp 48xlarge. Một yêu cầu `beast` bắt đầu ở 192 vCPU và là cách dễ nhất để chạm hạn ngạch EC2 Spot hoặc On-Demand Standard theo khu vực. `.crabbox.yaml` do repo sở hữu mặc định dùng `class: standard`, thị trường on-demand và `capacity.hints: true` để các lease AWS qua broker in ra khu vực/thị trường đã chọn, áp lực hạn ngạch, phương án dự phòng Spot và cảnh báo lớp chịu áp lực cao. Sử dụng `fast` cho các bước kiểm tra rộng, nặng hơn, `large` chỉ sau khi standard/fast không đủ và `beast` chỉ cho các lane đặc biệt phụ thuộc nhiều vào CPU như bộ kiểm thử đầy đủ hoặc ma trận Docker cho tất cả Plugin, xác thực rõ ràng cho bản phát hành/trình chặn hoặc lập hồ sơ hiệu năng nhiều lõi. Không sử dụng `beast` cho `pnpm check:changed`, các bài kiểm thử tập trung, công việc chỉ liên quan đến tài liệu, lint/kiểm tra kiểu thông thường, các lượt tái hiện E2E nhỏ hoặc phân loại sự cố ngừng hoạt động của Blacksmith. Sử dụng `--market on-demand` để chẩn đoán dung lượng nhằm tránh trộn biến động thị trường Spot vào tín hiệu.

`.crabbox.yaml` sở hữu các giá trị mặc định cho nhà cung cấp, đồng bộ và nạp thông tin xác thực GitHub Actions. Quá trình đồng bộ Crabbox không bao giờ chuyển `.git`, vì vậy checkout Actions đã nạp thông tin xác thực giữ lại siêu dữ liệu Git từ xa riêng thay vì đồng bộ các kho từ xa và kho đối tượng cục bộ của người bảo trì, đồng thời cấu hình repo còn loại trừ các hiện vật build/thời gian chạy cục bộ (như `.artifacts` và báo cáo kiểm thử) tuyệt đối không được chuyển. `.github/workflows/crabbox-hydrate.yml` sở hữu checkout, thiết lập Node/pnpm, thao tác tìm nạp `origin/main` và việc bàn giao môi trường không chứa secret cho các lệnh `crabbox run --id <cbx_id>` trên đám mây sở hữu riêng.

## Liên quan

- [Tổng quan cài đặt](/vi/install)
- [Các kênh phát triển](/vi/install/development-channels)
