---
read_when:
    - Bạn cần hiểu lý do một tác vụ CI đã chạy hoặc không chạy
    - Bạn đang gỡ lỗi một bước kiểm tra GitHub Actions bị lỗi
    - Bạn đang điều phối một lượt chạy hoặc chạy lại quy trình xác thực bản phát hành
    - Bạn đang thay đổi cơ chế điều phối ClawSweeper hoặc chuyển tiếp hoạt động GitHub
summary: Biểu đồ tác vụ CI, các cổng phạm vi, các nhóm quy trình phát hành và các lệnh cục bộ tương đương
title: Pipeline CI
x-i18n:
    generated_at: "2026-07-20T04:34:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8d2b185ae6261201072242a3873bd154cbf695e16bae3e41f7e05f6a5ac1a173
    source_path: ci.md
    workflow: 16
---

OpenClaw CI chạy khi có nội dung được đẩy lên `main` (các đường dẫn Markdown và `docs/**` bị bỏ qua
tại trình kích hoạt), trên mọi pull request không phải bản nháp và khi điều phối thủ công.
Các lượt đẩy chuẩn lên `main` chạy theo cơ chế một lượt duy nhất: nhóm đồng thời `CI` cho phép một
chu kỳ tích hợp hoàn chỉnh chạy trong khi GitHub chỉ giữ lại lượt đẩy đang chờ mới nhất.
Các lượt hợp nhất mới thay thế lượt chạy đang chờ đó thay vì hủy công việc đã
đăng ký một ma trận Blacksmith. Pull request vẫn hủy các head đã bị thay thế,
còn các lượt điều phối thủ công sử dụng các nhóm độc lập. `preflight` phân loại phần khác biệt và
tắt các lane tốn kém khi chỉ những khu vực không liên quan thay đổi. Các lượt chạy
`workflow_dispatch` thủ công chủ ý bỏ qua phạm vi thông minh và phân nhánh
toàn bộ đồ thị cho các ứng viên phát hành và quá trình xác thực diện rộng. Các lane Android vẫn
chỉ được bật theo yêu cầu thông qua `include_android` (hoặc đầu vào `release_gate`). Phạm vi kiểm thử
plugin chỉ dành cho bản phát hành nằm trong quy trình làm việc
[`Plugin Prerelease`](#plugin-prerelease) riêng biệt và chỉ chạy từ
[`Full Release Validation`](#full-release-validation) hoặc một lượt
điều phối thủ công rõ ràng.

## Tổng quan Pipeline

| Công việc                           | Mục đích                                                                                                                                                                                                              | Thời điểm chạy                                          |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| `preflight`                        | Phát hiện các phạm vi đã thay đổi và tạo bản kê CI; trên `main` chuẩn có liên quan đến Node, làm mới và duy trì ảnh chụp phần phụ thuộc trước khi phân nhánh                                                   | Luôn chạy trên các lượt đẩy và PR không phải bản nháp   |
| `security-fast`                    | Phát hiện khóa riêng tư, kiểm tra quy trình làm việc đã thay đổi qua `zizmor` và kiểm tra tệp khóa môi trường sản xuất                                                                                             | Luôn chạy trên các lượt đẩy và PR không phải bản nháp   |
| `pnpm-store-warmup`                | Làm nóng bộ nhớ đệm Actions được ghim theo tệp khóa cho pull request và lượt chạy thủ công mà không chặn các shard Linux Node                                                                                           | Các lane Node hoặc kiểm tra tài liệu được chọn ngoài main |
| `build-artifacts`                  | Xây dựng `dist/`, Control UI, kiểm tra nhanh CLI đã dựng, bộ nhớ khi khởi động và kiểm tra cấu phần dựng được nhúng                                                                                                  | Các thay đổi liên quan đến Node                         |
| `control-ui-i18n`                  | Xác minh các gói locale Control UI, siêu dữ liệu và bộ nhớ dịch đã tạo; mang tính tư vấn trên các lượt chạy tự động, có tính chặn trên CI phát hành thủ công                                                             | Các thay đổi liên quan đến i18n Control UI và CI thủ công |
| `checks-fast-core`                 | Các lane kiểm tra tính đúng đắn nhanh trên Linux: chốt tăng dần số dòng tối đa của đường cơ sở loại trừ, gói tích hợp + giao thức, trình khởi chạy Bun và tác vụ nhanh định tuyến CI                                    | Các thay đổi liên quan đến Node                         |
| `qa-smoke-ci-profile`              | Hai phần cân bằng, độc lập của tập đại diện QA Smoke tự động có giới hạn; phạm vi đầy đủ của hệ phân loại vẫn có thể dùng qua các hồ sơ QA rõ ràng                                                                      | Các thay đổi liên quan đến Node                         |
| `checks-fast-contracts-plugins-*`  | Hai shard hợp đồng plugin có trọng số                                                                                                                                                                                  | Các thay đổi liên quan đến Node                         |
| `checks-fast-contracts-channels-*` | Hai shard hợp đồng kênh có trọng số                                                                                                                                                                                    | Các thay đổi liên quan đến Node                         |
| `checks-node-*`                    | Các kiểm thử Node nhắm đến mục tiêu đã thay đổi trên pull request; toàn bộ shard lõi trên `main`, các lượt chạy thủ công, phát hành và dự phòng diện rộng                                                        | Các thay đổi liên quan đến Node                         |
| `check-*`                          | Tương đương cổng cục bộ chính được phân shard: bộ bảo vệ, shrinkwrap, siêu dữ liệu cấu hình kênh tích hợp, kiểu môi trường sản xuất, lint, phần phụ thuộc, kiểu kiểm thử                                                 | Các thay đổi liên quan đến Node                         |
| `check-additional-*`               | Các dải kiểm tra ranh giới (bao gồm sai lệch ảnh chụp prompt), ranh giới bộ truy cập phiên/trình đọc bản chép lời/giao dịch SQLite, nhóm lint tiện ích mở rộng, biên dịch/canary ranh giới gói và kiến trúc cấu trúc liên kết runtime | Các thay đổi liên quan đến Node                    |
| `checks-node-compat-node22`        | Lane dựng và kiểm tra nhanh khả năng tương thích Node 22                                                                                                                                                               | Điều phối CI thủ công cho các bản phát hành             |
| `check-docs`                       | Kiểm tra định dạng tài liệu, lint và liên kết hỏng                                                                                                                                                                     | Tài liệu thay đổi (PR và điều phối thủ công)            |
| `native-i18n`                      | Xác minh việc trích xuất nguồn gốc và độ an toàn bản địa hóa trên PR nguồn; thực thi tính tương đồng đầy đủ giữa bản dịch và tài nguyên được tạo theo nền tảng trên PR được tạo và CI thủ công                           | Các thay đổi liên quan đến i18n gốc                     |
| `skills-python`                    | Ruff + pytest cho Skills dựa trên Python                                                                                                                                                                               | Các thay đổi liên quan đến Skills Python                |
| `checks-windows`                   | Các kiểm thử quy trình/đường dẫn dành riêng cho Windows cùng với các lỗi hồi quy của bộ chỉ định nhập runtime dùng chung                                                                                                | Các thay đổi liên quan đến Windows                      |
| `macos-node`                       | Các kiểm thử TypeScript tập trung cho macOS: launchd, Homebrew, đường dẫn runtime, tập lệnh đóng gói, trình bao bọc nhóm quy trình                                                                                     | Các thay đổi liên quan đến macOS                        |
| `macos-swift`                      | Lint và dựng Swift cho ứng dụng macOS, cùng với các kiểm thử cho ứng dụng và gói OpenClawKit dùng chung                                                                                                                 | Các thay đổi liên quan đến macOS                        |
| `ios-build`                        | Tạo dự án Xcode cùng với việc dựng ứng dụng iOS trên trình mô phỏng                                                                                                                                                    | Các thay đổi đối với ứng dụng iOS, bộ ứng dụng dùng chung hoặc Swabble |
| `android`                          | Kiểm thử đơn vị Android cho cả hai biến thể cùng với một lượt dựng APK gỡ lỗi                                                                                                                                          | Các thay đổi liên quan đến Android                      |
| `openclaw/ci-gate`                 | Tổng hợp cuối cùng: yêu cầu bước kiểm tra sơ bộ và bảo mật; chỉ chấp nhận bỏ qua đối với các lane hạ nguồn bị bản kê vô hiệu hóa                                                                                        | Mọi lượt chạy CI không phải bản nháp                    |
| `test-performance-agent`           | Quy trình làm việc riêng biệt: tối ưu hóa kiểm thử chậm Codex hằng ngày sau hoạt động đáng tin cậy                                                                                                                      | CI main thành công hoặc điều phối thủ công              |
| `openclaw-performance`             | Quy trình làm việc riêng biệt: báo cáo hiệu năng runtime Kova hằng ngày/theo yêu cầu với các lane nhà cung cấp mô phỏng, lập hồ sơ sâu và GPT 5.6 trực tiếp                                                             | Điều phối theo lịch và thủ công                         |

Các quy trình làm việc Periphery độc lập thực thi yêu cầu không có phát hiện mã chết cho ứng dụng iOS và macOS. Quy trình làm việc OpenClawKit dùng chung quét song song cả hai thành phần sử dụng và chỉ báo cáo một khai báo khi Periphery phát ra cùng một Swift USR từ cả hai bản dựng. Hợp đồng lược đồ `OpenClawProtocol/GatewayModels.swift` được tạo của quy trình này được giữ lại dưới dạng mã thuộc quyền sở hữu của trình tạo thay vì bị coi là mã chết cục bộ của ứng dụng.

## Thứ tự dừng sớm khi lỗi

1. `preflight` quyết định những lane nào thực sự tồn tại. Logic `docs-scope` và `changed-scope` là các bước bên trong công việc này, không phải các công việc độc lập. `main` chuẩn bắt đầu ngay lập tức, nhưng nhóm đồng thời của nó chỉ cho phép một lượt chạy hoàn chỉnh và gộp các lượt đẩy sau thành một lượt chạy đang chờ mới nhất. Các lượt đẩy main liên quan đến Node cũng tuần tự hóa trình ghi đĩa phần phụ thuộc duy nhất và việc duy trì kích thước của nó tại đây trước khi các công việc hạ nguồn có thể gắn khóa; Blacksmith có thể chỉ cung cấp một commit mới cho lượt chạy quy trình làm việc sau, vì vậy các thành phần sử dụng trong cùng lượt chạy vẫn giữ phương án dự phòng cục bộ có kiểm tra dấu mốc.
2. `security-fast`, `check-*`, `check-additional-*`, `check-docs` và `skills-python` thất bại nhanh chóng mà không chờ các công việc ma trận nền tảng và cấu phần nặng hơn.
3. `build-artifacts` và các bước kiểm tra locale chạy chồng lấp với các lane Linux nhanh. Các PR nguồn của Control UI và ứng dụng gốc loại trừ ảnh chụp nhanh/tài nguyên locale được tạo; các quy trình làm mới tuần tự của chúng sửa chữa và tự động hợp nhất các PR được tạo độc lập ở chế độ nền. CI nguồn vẫn chặn các bản kê nguồn lỗi thời và lệnh gọi bản địa hóa không an toàn. Các PR được tạo, CI thủ công và quá trình chuẩn bị phát hành thực thi tính tương đồng đầy đủ giữa bản dịch và dữ liệu được tạo theo nền tảng. Các nhánh `release/YYYY.M.PATCH` chuẩn có thể bao gồm sửa chữa locale trong quá trình chuẩn bị phát hành cùng với đầu ra phát hành được tạo khác.
4. Sau đó, các lane nền tảng và runtime nặng hơn được phân nhánh: `checks-fast-core`, `checks-fast-contracts-plugins-*`, `checks-fast-contracts-channels-*`, `checks-node-*`, `checks-windows`, `macos-node`, `macos-swift`, `ios-build` và `android`.
5. `openclaw/ci-gate` chờ mọi lane đã chọn. Bước kiểm tra sơ bộ và bảo mật phải thành công; các công việc hạ nguồn chỉ được bỏ qua khi bản kê không chọn chúng. Một lane đã chọn bị lỗi hoặc bị hủy sẽ làm bước tổng hợp thất bại.

Trình điều phối hợp nhất có thể tái sử dụng một `openclaw/ci-gate` đã xác thực và thành công
cho cùng một head pull request trong tối đa 24 giờ. Điều này tránh ghi lại
nhánh của người đóng góp sau các thay đổi `main` không liên quan. Kết quả có thể tái sử dụng không
thay thế bước kiểm tra hợp nhất thử nghiệm nghiêm ngặt, thuộc sở hữu của App đối với `main` hiện tại.
Một lượt chạy lại đang chờ hoặc thất bại sau đó không xóa kết quả thành công trước đó cho
head không thay đổi đó trong khoảng thời gian còn hiệu lực.

Bộ quy tắc của nhánh mặc định yêu cầu kiểm tra `openclaw/ci-gate` do GitHub Actions sở hữu. Các quản trị viên và người bảo trì kho lưu trữ có quyền bỏ qua khẩn cấp được kiểm toán, chỉ dành cho các lần đưa thay đổi trực tiếp theo kiểu fast-forward có chữ ký; bộ quy tắc của tổ chức vẫn chặn việc xóa và các bản cập nhật không phải fast-forward. Các lần hợp nhất pull request thông thường nên tiếp tục sử dụng cổng kiểm tra thay vì bỏ qua Pipeline CI bị lỗi. Kiểm tra hợp nhất thử nghiệm nghiêm ngặt riêng biệt do App sở hữu vẫn liên kết head với `main` hiện tại.

GitHub có thể đánh dấu các tác vụ pull request đã bị thay thế là `cancelled` khi một head mới hơn được đưa vào. Hãy coi đó là nhiễu CI trừ khi lần chạy mới nhất của cùng PR cũng đang thất bại. Các lần chạy `main` chính thức không bị hủy sau khi được tiếp nhận; khi có lưu lượng hợp nhất, GitHub chỉ thay thế lần chạy cũ hơn đang chờ xử lý bằng tip mới nhất. Các tác vụ ma trận sử dụng `fail-fast: false`, còn `build-artifacts` báo cáo trực tiếp các lỗi kênh nhúng, ranh giới hỗ trợ lõi và theo dõi Gateway thay vì xếp hàng các tác vụ xác minh nhỏ. Khóa đồng thời CI tự động được gắn phiên bản (`CI-v7-*`) để một tác vụ zombie phía GitHub trong nhóm hàng đợi cũ không thể chặn vô thời hạn các lần chạy main mới hơn. Các lần chạy toàn bộ bộ kiểm thử theo cách thủ công sử dụng `CI-manual-v1-*` và không hủy các lần chạy đang diễn ra. Cơ chế bảo vệ bộ nhớ khởi động của danh sách plugin duy trì mức trần 350 MiB trên Blacksmith Linux tự lưu trữ và cho phép 425 MiB trên Linux do GitHub lưu trữ, vốn có mức RSS cơ sở cao hơn đối với cùng một CLI đã dựng.

Sử dụng `pnpm ci:timings`, `pnpm ci:timings:recent` hoặc `node scripts/ci-run-timings.mjs <run-id>` để tóm tắt thời gian thực tế, thời gian xếp hàng, các tác vụ chậm nhất, lỗi và rào cản fanout `pnpm-store-warmup` từ GitHub Actions. Tác vụ `ci-timings-summary` trong quy trình làm việc tồn tại trong `ci.yml` nhưng hiện đang bị vô hiệu hóa (`if: false`); thay vào đó, hãy chạy trình trợ giúp đo thời gian cục bộ. Để xem thời gian dựng, hãy kiểm tra bước `Build dist` của tác vụ `build-artifacts`: `pnpm build:ci-artifacts` in ra `[build-all] phase timings:` và bao gồm `ui:build`; tác vụ cũng tải lên artifact `startup-memory`.

## Bối cảnh và bằng chứng của PR

Các PR của cộng tác viên bên ngoài chạy một cổng kiểm tra bối cảnh và bằng chứng của PR từ
`.github/workflows/real-behavior-proof.yml`. Quy trình làm việc checkout
bản sửa đổi quy trình làm việc đáng tin cậy (`github.workflow_sha`) và chỉ đánh giá phần nội dung PR;
nó không thực thi mã từ nhánh của cộng tác viên.

Cổng kiểm tra áp dụng cho các tác giả PR không phải là chủ sở hữu, thành viên,
cộng tác viên của kho lưu trữ hoặc bot. Cổng đạt yêu cầu khi nội dung PR chứa các phần
`What Problem This Solves` và `Evidence` do tác giả viết. Bằng chứng có thể là một
kiểm thử tập trung, kết quả CI, ảnh chụp màn hình, bản ghi, đầu ra terminal, quan sát trực tiếp,
nhật ký đã biên tập hoặc liên kết artifact. Phần nội dung cung cấp mục đích và thông tin xác thực hữu ích;
người review kiểm tra mã, các kiểm thử và CI để đánh giá tính đúng đắn.

Khi kiểm tra thất bại, hãy cập nhật nội dung PR thay vì đẩy thêm một commit mã khác.

## Phạm vi và định tuyến

Logic phạm vi nằm trong `scripts/ci-changed-scope.mjs` và được bao phủ bởi các kiểm thử đơn vị trong `src/scripts/ci-changed-scope.test.ts`. Việc kích hoạt thủ công bỏ qua phát hiện phạm vi thay đổi và khiến manifest kiểm tra sơ bộ hoạt động như thể mọi khu vực thuộc phạm vi đều đã thay đổi.

Các quy trình làm việc Periphery riêng biệt cho iOS và macOS thực thi chính sách không có phát hiện nào đối với mã chết. Mỗi quy trình chỉ chạy khi một pull request không phải bản nháp chạm vào phạm vi quét native tương ứng, hoặc khi được kích hoạt thủ công.

- **Các chỉnh sửa quy trình làm việc CI** xác thực đồ thị CI của Node, việc lint quy trình làm việc và lane Windows (`ci.yml` thực thi lane này), nhưng tự chúng không bắt buộc các bản dựng native cho iOS, Android hoặc macOS; các lane nền tảng đó vẫn chỉ áp dụng cho các thay đổi mã nguồn của nền tảng.
- **Kiểm tra tính hợp lệ của quy trình làm việc** chạy `actionlint`, `zizmor` trên tất cả các tệp YAML của quy trình làm việc, cơ chế bảo vệ nội suy composite action và cơ chế bảo vệ dấu xung đột. Tác vụ `security-fast` theo phạm vi PR cũng chạy `zizmor` trên các tệp quy trình làm việc đã thay đổi để các phát hiện bảo mật quy trình làm việc thất bại sớm trong đồ thị CI chính.
- **Tài liệu trên các lần push `main`** được kiểm tra bởi quy trình làm việc `Docs` độc lập với cùng bản sao tài liệu ClawHub được CI sử dụng, vì vậy các lần push hỗn hợp gồm mã+tài liệu không đồng thời xếp hàng shard `check-docs` của CI. Các pull request và CI thủ công vẫn chạy `check-docs` từ CI khi tài liệu thay đổi.
- **TUI PTY** chạy trong shard Linux Node `checks-node-core-runtime-tui-pty` đối với các thay đổi TUI. Shard chạy `test/vitest/vitest.tui-pty.config.ts` với `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1`, vì vậy nó bao phủ cả lane fixture `TuiBackend` có tính xác định và kiểm thử smoke `tui --local` chậm hơn, vốn chỉ mô phỏng endpoint mô hình bên ngoài.
- **Các chỉnh sửa chỉ liên quan đến định tuyến CI, tập hợp nhỏ các fixture kiểm thử lõi mà tác vụ nhanh chạy trực tiếp và các chỉnh sửa hẹp đối với trình trợ giúp hợp đồng plugin** sử dụng một đường dẫn manifest nhanh chỉ dành cho Node: `preflight`, `security-fast` và chỉ các lane nhanh mà thay đổi tác động đến — một tác vụ định tuyến CI `checks-fast-core` duy nhất, hai shard hợp đồng plugin hoặc cả hai. Đường dẫn đó bỏ qua các artifact dựng, khả năng tương thích Node 22, hợp đồng kênh, toàn bộ các shard lõi, các shard plugin đi kèm và các ma trận bảo vệ bổ sung.
- **Các kiểm tra Node trên Windows** được giới hạn phạm vi ở các wrapper tiến trình/đường dẫn dành riêng cho Windows, trình trợ giúp chạy npm/pnpm/UI, cấu hình trình quản lý gói và các bề mặt quy trình làm việc CI thực thi lane đó; các thay đổi không liên quan về mã nguồn, plugin, kiểm thử smoke cài đặt và chỉ dành cho kiểm thử vẫn chạy trên các lane Linux Node.

Các nhóm kiểm thử Node chậm nhất được chia tách hoặc cân bằng để mỗi tác vụ duy trì quy mô nhỏ mà không đặt trước quá nhiều runner:

- Các hợp đồng Plugin và hợp đồng kênh đều chạy dưới dạng hai shard có trọng số được Blacksmith hỗ trợ, với cơ chế dự phòng bằng runner GitHub tiêu chuẩn.
- Các lane nhanh/hỗ trợ của kiểm thử đơn vị lõi chạy riêng biệt; hạ tầng runtime lõi được chia thành các shard quy trình, dùng chung, hook, secret và ba shard miền Cron.
- Tính năng tự động trả lời chạy dưới dạng các worker cân bằng, với cây con trả lời được chia thành các shard agent-runner, lệnh, điều phối, phiên và định tuyến trạng thái.
- Các cấu hình Gateway/máy chủ tác tử (mặt phẳng điều khiển) được chia thành các lane trò chuyện, xác thực, mô hình, HTTP/Plugin, runtime và khởi động thay vì chờ các artifact đã dựng.
- Pipeline CI thông thường chỉ đóng gói các shard mẫu bao gồm của hạ tầng biệt lập thành những gói xác định gồm tối đa 64 tệp kiểm thử, qua đó thu gọn ma trận Node mà không hợp nhất các bộ kiểm thử lệnh/Cron không biệt lập, agents-core có trạng thái hoặc Gateway/máy chủ. Các bộ kiểm thử cố định nặng vẫn dùng 8 vCPU, còn các lane được đóng gói và có trọng số thấp hơn dùng 4 vCPU.
- Các pull request trên kho lưu trữ chính tắc tái sử dụng trình phân giải kiểm thử đã thay đổi dựa trên phần khác biệt của cây hợp nhất tổng hợp. Các thay đổi chính xác chạy một tác vụ Node được nhắm mục tiêu; mỗi tệp kiểm thử được chọn có quy trình riêng để duy trì tính biệt lập của bộ kiểm thử có trạng thái. Bộ lập kế hoạch kết hợp các kiểm thử cùng cấp với những phần phụ thuộc trong đồ thị nhập và quay về kế hoạch bộ kiểm thử đầy đủ dạng rút gọn gồm 14 tác vụ hiện có đối với các thay đổi về gói workspace, gói/tệp khóa, bộ khung dùng chung, cấu hình phân tách, đổi tên hoặc xóa; các thay đổi hợp đồng tiện ích mở rộng công khai; các kiểm thử có thiết lập shard đặc biệt; mục tiêu được phân giải một phần hoặc trống; kế hoạch đường dẫn hoặc mục tiêu quá lớn; và lỗi của bộ lập kế hoạch. Các kế hoạch được nhắm mục tiêu luôn giữ lại cổng ranh giới artifact đã dựng đầy đủ vì không thể suy ra các trình quét kho lưu trữ của cổng này từ các lệnh nhập. Các lần đẩy `main` chạy cùng bộ kiểm thử đầy đủ dạng rút gọn: các sự kiện đẩy trung gian đang chờ có thể được hợp nhất, vì vậy lần chạy còn lại mới nhất phải xác thực toàn bộ cây tích hợp thay vì chỉ phần khác biệt của lần đẩy cuối cùng. Các lần điều phối thủ công và cổng phát hành vẫn giữ ma trận đầy đủ được đặt tên theo từng shard.
- Ma trận Node đầy đủ tiếp nhận trước các công cụ nối tiếp luôn chạy chậm, các shard lệnh tự động trả lời và trình ghi bộ nhớ đệm core-fast diện rộng. Cách này duy trì giới hạn 28 tác vụ, đồng thời ngăn công việc trên đường găng và seed biến đổi của lần chạy tiếp theo bị trượt sang một đợt sau.
- Các kiểm thử trình duyệt, QA, phương tiện và Plugin hỗn hợp có phạm vi rộng sử dụng cấu hình Vitest chuyên biệt thay vì cấu hình gom chung Plugin dùng chung. Các shard mẫu bao gồm ghi lại mục thời gian bằng tên shard của Pipeline CI để `.artifacts/vitest-shard-timings.json` có thể phân biệt toàn bộ cấu hình với một shard đã lọc.
- Các tác vụ shard Linux Node lưu giữ bộ nhớ đệm mô-đun hệ thống tệp thử nghiệm của Vitest thông qua API bộ nhớ đệm Actions thượng nguồn, được Blacksmith tăng tốc trong suốt trên các runner của mình. Mỗi shard Pipeline CI chỉ khôi phục và giải nén seed được bảo vệ vào thư mục gốc cục bộ riêng của runner; sau đó trình bao bọc shard cấp các thư mục con hoạt động riêng cho những quy trình Vitest đồng thời. Chỉ trình làm ấm hằng ngày không bị hủy hoặc trình làm ấm được điều phối rõ ràng mới lưu một kho lưu trữ bất biến mới, vì vậy pull request không thể xuất bản các phép biến đổi hoặc tạo các họ bộ nhớ đệm riêng cho từng PR. Dấu vân tay đầu vào biến đổi xóa các thế hệ tệp khóa, gói, tsconfig và cấu hình Vitest không tương thích. Trình ghi được bảo vệ quét và cắt giảm bộ nhớ đệm đã khôi phục xuống 75% sau khi vượt quá 2 GiB. Vitest băm mã định danh mô-đun, nội dung nguồn, môi trường và cấu hình biến đổi đã phân giải, vì vậy các thay đổi nguồn từng phần thông thường vẫn giữ ấm những mục không đổi, còn các mô-đun đã thay đổi sẽ trượt bộ nhớ đệm một cách an toàn. Các tiền tố khôi phục thô bắc cầu giữa các lần chạy workflow; cơ chế LRU và loại bỏ do không hoạt động thông thường của bộ nhớ đệm Actions giới hạn các kho lưu trữ bất biến cũ.
- Các tác vụ Linux Node đáng tin cậy cũng liên kết kho pnpm và `node_modules` từ một đĩa phụ thuộc được bảo vệ cho mỗi dòng Node được hỗ trợ. Manifest gói, thiết lập cài đặt, nền tảng runner và bản vá Node chính xác không nằm trong khóa đĩa; dấu vân tay chính xác của runtime và đầu vào cài đặt quyết định tác vụ tái sử dụng cây hay cài đặt lại và làm mới cùng đĩa đó. Các manifest được chuẩn hóa trước khi băm. Các hook gốc trực tiếp đã được kiểm tra chỉ giữ lại script vòng đời cài đặt của pnpm, vì vậy các chỉnh sửa định dạng và script kiểm thử/dựng thông thường vẫn giữ cây phụ thuộc ấm; sai lệch hook vòng đời chưa được kiểm tra sẽ đóng khi lỗi cho đến khi các đầu vào nguồn của nó được đưa vào hợp đồng dấu vân tay. Các thay đổi về phụ thuộc, trình quản lý gói, nguồn hook và tệp khóa luôn làm mất hiệu lực snapshot. Dấu vân tay khớp là điều kiện cần nhưng chưa đủ: quá trình thiết lập còn kiểm tra kho lưu trữ importer và checksum manifest, sau đó xác minh các phụ thuộc trong tệp khóa được registry hỗ trợ mà postinstall giữ lại dựa trên những manifest gói được Node phân giải từ importer tương ứng. Nội dung importer thiếu hoặc cũ sẽ quay về cài đặt mới thay vì cung cấp phần hoist gốc. Pull request có snapshot chỉ đọc không sử dụng được sẽ tách liên kết workspace và cài đặt vào bộ nhớ cục bộ của runner, tránh ghi chậm vào một bản sao mà nó không thể xuất bản. Các lượt cài đặt nguội trên đĩa cố định sẽ vô hiệu hóa các lần thử lại tìm nạp nội bộ của pnpm và thực hiện tối đa ba lần thử cài đặt đầy đủ có giới hạn từ kho đang dần được làm ấm; hết thời gian vẫn là lỗi. Sau khi khôi phục đã được xác thực nội dung hoặc cài đặt với tệp khóa cố định, quá trình thiết lập vô hiệu hóa bước kiểm tra phụ thuộc dư thừa trước khi chạy của pnpm: kho lưu trữ chủ ý cắt bỏ `node_modules` cục bộ của Plugin, vốn bị pnpm coi là cũ và sửa chữa bằng các lượt cài đặt ngầm đồng thời không an toàn trong quá trình phân tán shard. Bước kiểm tra sơ bộ của main chính tắc là trình ghi duy nhất và đo kho trong mỗi lần làm mới, chỉ chạy `pnpm store prune` sau khi các phiên bản gói đã ngừng sử dụng đẩy dung lượng vượt quá 8 GiB. Việc xuất bản snapshot của Blacksmith diễn ra bất đồng bộ ngay cả sau khi tác vụ ghi hoàn tất, vì vậy lần chạy đầu tiên sau một khóa hoặc dấu vân tay mới vẫn có thể nguội; các lần khôi phục dấu mốc chính xác sau đó đã được xác thực nội dung là bằng chứng triển khai. Các tác vụ Pipeline CI bắt buộc và pull request nhận bản sao dùng một lần, vì vậy thay đổi phụ thuộc không tạo đĩa mới, snapshot cạnh tranh hoặc khóa bộ nhớ đệm có thể hủy bản dựng.
- Các tác vụ shard Node và artifact dựng cũng khôi phục bộ nhớ đệm biên dịch di động trên đĩa của Node thông qua các bộ nhớ đệm Actions bất biến. Các không gian tên `test` và `build` độc lập ngăn trình ghi của chúng thay thế kho lưu trữ của nhau: trình làm ấm kiểm thử theo lịch sở hữu seed kiểm thử được bảo vệ, còn `build-artifacts` có thể xuất bản tối đa một kho lưu trữ bản dựng được bảo vệ mỗi ngày UTC từ các lần đẩy `main` đáng tin cậy. Các tác vụ PR và kiểm thử thông thường chỉ đọc snapshot được bảo vệ, vì vậy bytecode của nhánh tính năng không bao giờ đi vào seed dùng chung và lưu lượng PR không tạo kho lưu trữ bộ nhớ đệm. Cơ chế này tái sử dụng bytecode V8 cho phần điều phối do Node tải, công cụ dựng và các phụ thuộc bên ngoài trên những đường dẫn checkout khác nhau, kể cả khi chỉ một phần đồ thị nguồn thay đổi. Các quy trình con Vitest vô hiệu hóa bộ nhớ đệm biên dịch kế thừa vì có thể bật độ bao phủ bên trong cấu hình động và độ bao phủ V8 có thể mất độ chính xác vị trí nguồn khi script được giải tuần tự hóa từ bytecode.
- Tác vụ artifact dựng cũng lưu giữ các đầu ra bước `build-all` có dấu vân tay nội dung. Các khai báo SDK Plugin do Pipeline CI tự dựng băm toàn bộ đồ thị nguồn TypeScript/JSON thuộc sở hữu kho lưu trữ, loại trừ các thư mục đã cài đặt và được tạo, đồng thời khôi phục cả khai báo phẳng lẫn cầu nối gói sau khi `tsdown` xóa `dist`. Các thay đổi về tài liệu, workflow, Plugin và những phần khác ngoài đồ thị đó có thể tái sử dụng snapshot khai báo; thay đổi nguồn sẽ dựng lại snapshot trước khi cổng xuất chạy.
- Các bản dựng khai báo đầy đủ chia `tsdown` thành các nhóm AI, gói workspace và hợp nhất. Mỗi nhóm chỉ lưu khai báo vào bộ nhớ đệm, sau đó vẫn dựng lại JavaScript runtime trước khi khôi phục các khai báo đó. Vì vậy, thay đổi lõi hoặc Plugin chỉ làm mất hiệu lực đồ thị hợp nhất lớn, còn thay đổi gói workspace làm mất hiệu lực một cách thận trọng đối với mọi nhóm khai báo phụ thuộc. Các bản dựng đầy đủ công khai thường sử dụng bộ nhớ đệm Actions bất biến; khóa khôi phục thô cung cấp seed cho các thay đổi từng phần, dấu vân tay nội dung theo nhóm từ chối dữ liệu cũ và hạn ngạch bộ nhớ đệm của GitHub loại bỏ các thế hệ cũ. Thay vào đó, lane Node 22 hằng tuần xuất bản artifact 14 ngày sau khi các lần chạy `main` thành công và chỉ khôi phục những artifact có danh tính trình tạo bất biến được phân giải thành workflow đó trên `main`, tránh biến động hạn ngạch mà không cho phép mã PR ghi vào bộ nhớ đệm dùng chung. Các khai báo QA riêng tư không bao giờ được lưu trong bộ nhớ đệm Actions vì không gian tên bộ nhớ đệm không phải là ranh giới bảo mật.
- `check-additional-*` chia xen kẽ danh sách kiểm tra ranh giới bổ sung (`scripts/run-additional-boundary-checks.mjs`) thành một shard nặng về prompt (`check-additional-boundaries-a`, bao gồm bước kiểm tra sai lệch snapshot prompt Codex) và một shard kết hợp cho các dải còn lại (`check-additional-boundaries-bcd`), mỗi shard chạy đồng thời các bước bảo vệ độc lập và in thời gian của từng bước kiểm tra. Công việc biên dịch/canary ranh giới gói vẫn được giữ cùng nhau, còn kiến trúc cấu trúc liên kết runtime chạy riêng với độ bao phủ theo dõi Gateway được nhúng trong `build-artifacts`.
- Trên runner dựng tự lưu trữ 32 vCPU, theo dõi Gateway, kiểm thử kênh và shard ranh giới hỗ trợ lõi cùng khởi động bên trong `build-artifacts` sau khi `dist/` và `dist-runtime/` đã được dựng. Các lần chạy dự phòng do GitHub lưu trữ giữ theo dõi Gateway ở chế độ nối tiếp để tranh chấp trên hệ thống ít lõi không làm tiêu hao thời hạn sẵn sàng của nó.

Sau khi được tiếp nhận, Pipeline CI Linux chính tắc cho phép tối đa 28 tác vụ kiểm thử Node đồng thời và
12 tác vụ cho các lane nhanh/kiểm tra nhỏ hơn; Windows và Android duy trì ở mức hai vì
các nhóm runner này hẹp hơn. Các lô toàn cấu hình dạng rút gọn chạy với
thời gian chờ lô là 120 phút, còn các nhóm mẫu bao gồm chia sẻ cùng ngân sách
tác vụ có giới hạn.

Pipeline CI Android chạy cả `testPlayDebugUnitTest` và `testThirdPartyDebugUnitTest`, sau đó dựng APK gỡ lỗi Play. Biến thể bên thứ ba không có tập nguồn hoặc manifest riêng; lane kiểm thử đơn vị của nó vẫn biên dịch biến thể với các cờ BuildConfig SMS/nhật ký cuộc gọi, đồng thời tránh tác vụ đóng gói APK gỡ lỗi trùng lặp trên mỗi lần đẩy liên quan đến Android. Mỗi tác vụ Gradle hiện tại có một đĩa cố định được bảo vệ; các tác vụ PR sử dụng bản sao dùng một lần, còn các lần chạy được bảo vệ làm mới tại chỗ những mục Gradle được định địa chỉ theo nội dung.

Các khóa đĩa cố định Blacksmith được chủ ý giới hạn theo kích thước runtime hoặc tác vụ được hỗ trợ, tuyệt đối không theo số PR, commit, lần chạy, nhánh hoặc hàm băm phụ thuộc. Bộ nhớ đệm biến đổi runtime và biên dịch sử dụng bộ nhớ đệm Actions thay vì đĩa cố định vì kho lưu trữ bất biến cung cấp kết quả khôi phục/lưu có thể xác minh và tránh lỗi thăng cấp snapshot khả biến. Sau khi di chuyển phiên bản khóa cố định, chỉ thêm chính xác khóa, kiến trúc và danh tính vùng đã lỗi thời vào `.github/retired-sticky-disks.json`, điều phối `Sticky Disk Cleanup` từ `main` với cùng kích thước và xác nhận, xác minh việc xóa, rồi loại bỏ các mục đó. Workflow định tuyến danh tính ARM đến runner ARM, từ chối trường hợp vùng runner không khớp, sử dụng action xóa theo khóa chính xác của Blacksmith và không bao giờ xóa bộ nhớ đệm trình dựng Docker hoặc tiền tố ký tự đại diện. Các kho lưu trữ bộ nhớ đệm Actions sử dụng cơ chế LRU và loại bỏ do không hoạt động thông thường.

Shard `check-dependencies` chạy các bước kiểm tra Knip cho phụ thuộc sản xuất, tệp không dùng và phần xuất không dùng. Bước bảo vệ tệp không dùng thất bại khi PR thêm một tệp không dùng mới chưa được review hoặc để lại một mục cũ trong danh sách cho phép, đồng thời duy trì các bề mặt Plugin động, được tạo, bản dựng, kiểm thử trực tiếp và cầu nối gói có chủ ý mà Knip không thể phân giải tĩnh. Bước bảo vệ phần xuất không dùng loại trừ các tệp hỗ trợ kiểm thử và thất bại với mọi phần xuất sản xuất không dùng; các bên tiêu thụ động có chủ ý phải được mô hình hóa trong `config/knip.config.ts`. Các mục tiêu lịch sử chạy bước bảo vệ phần xuất khi chúng cung cấp bước này và tiếp tục dùng phương án dự phòng mã chết cũ hơn trong trường hợp còn lại.

## Chuyển tiếp hoạt động ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` là cầu nối phía đích từ hoạt động của kho lưu trữ OpenClaw vào ClawSweeper. Nó không checkout hoặc thực thi mã pull request không đáng tin cậy. Quy trình làm việc tạo token GitHub App từ `CLAWSWEEPER_APP_PRIVATE_KEY`, sau đó gửi các payload `repository_dispatch` nhỏ gọn đến `openclaw/clawsweeper`.

Quy trình làm việc có bốn luồng:

- `clawsweeper_item` dành cho các yêu cầu review issue và pull request cụ thể;
- `clawsweeper_comment` dành cho các lệnh ClawSweeper tường minh trong bình luận issue;
- `clawsweeper_commit_review` dành cho các yêu cầu review ở cấp commit trên các lần push `main`;
- `github_activity` dành cho hoạt động GitHub chung mà tác nhân ClawSweeper có thể kiểm tra.

Luồng `github_activity` chỉ chuyển tiếp siêu dữ liệu đã chuẩn hóa: loại sự kiện, hành động, tác nhân, kho lưu trữ, số mục, URL, tiêu đề, trạng thái và các đoạn trích ngắn từ bình luận hoặc bài review khi có. Luồng này chủ ý không chuyển tiếp toàn bộ nội dung webhook. Quy trình tiếp nhận trong `openclaw/clawsweeper` là `.github/workflows/github-activity.yml`, quy trình này đăng sự kiện đã chuẩn hóa lên hook của OpenClaw Gateway dành cho tác nhân ClawSweeper.

Hoạt động chung dùng để quan sát, không mặc định để chuyển phát. Tác nhân ClawSweeper nhận đích Discord trong prompt và chỉ nên đăng lên `#clawsweeper` khi sự kiện bất ngờ, có thể hành động, tiềm ẩn rủi ro hoặc hữu ích về mặt vận hành. Các thao tác mở và chỉnh sửa thông thường, hoạt động nhiễu từ bot, nhiễu webhook trùng lặp và lưu lượng review bình thường phải cho kết quả `NO_REPLY`.

Xuyên suốt đường dẫn này, hãy coi tiêu đề, bình luận, nội dung, văn bản review, tên nhánh và thông điệp commit trên GitHub là dữ liệu không đáng tin cậy. Chúng là đầu vào để tóm tắt và phân loại, không phải chỉ dẫn cho quy trình làm việc hoặc môi trường chạy của tác nhân.

## Kích hoạt thủ công

Các lần kích hoạt CI thủ công chạy cùng đồ thị công việc như CI thông thường nhưng buộc bật mọi luồng có phạm vi ngoài Android: các shard Linux Node, shard Plugin đóng gói kèm, shard hợp đồng Plugin và kênh, khả năng tương thích Node 22, `check-*`, `check-additional-*`, kiểm tra smoke artifact đã build, kiểm tra tài liệu, Skills Python, Windows, macOS, bản build iOS và i18n của Control UI/ứng dụng gốc. Các PR nguồn tự động xác minh danh mục trích xuất gốc và độ an toàn bản địa hóa Android/Apple mà không yêu cầu đầu ra đã dịch hoặc do nền tảng tạo ra trong cùng PR. Quy trình Native App Locale Refresh được tuần tự hóa sẽ build lại các artifact đó trong một PR biệt lập và bật tự động hợp nhất đúng head sau khi các kiểm tra bắt buộc vượt qua. Tính tương đương đầy đủ của ứng dụng gốc vẫn là điều kiện chặn đối với PR artifact được tạo, CI thủ công, Full Release Validation và quá trình chuẩn bị phát hành. Tính tương đương locale của Control UI vẫn chỉ mang tính tư vấn trong PR tự động và các lần chạy `main`, đồng thời là điều kiện chặn trong CI thủ công/phát hành. Các lần kích hoạt CI thủ công độc lập chỉ chạy Android với `include_android=true` (đầu vào `release_gate` cũng buộc bật Android); quy trình phát hành đầy đủ bật Android bằng cách truyền `include_android=true`. Các kiểm tra tĩnh tiền phát hành Plugin, shard chỉ dành cho phát hành `agentic-plugins`, toàn bộ lượt quét hàng loạt extension và các luồng Docker tiền phát hành Plugin bị loại khỏi CI. Bộ kiểm thử tiền phát hành Docker chỉ chạy khi `Full Release Validation` kích hoạt quy trình `Plugin Prerelease` riêng biệt với cổng xác thực phát hành được bật.

Các kiểm tra số dòng tối đa của PR lấy đường cơ sở từ cây hợp nhất tổng hợp đã checkout và xác minh commit cha của head so với head của sự kiện. Các lần chạy thủ công sử dụng một nhóm đồng thời duy nhất để bộ kiểm thử đầy đủ của ứng viên phát hành không bị hủy bởi một lần push hoặc chạy PR khác trên cùng ref. Đầu vào tùy chọn `target_ref` cho phép bên gọi đáng tin cậy chạy đồ thị đó đối với một nhánh, thẻ hoặc SHA commit đầy đủ, đồng thời sử dụng tệp quy trình làm việc từ ref kích hoạt đã chọn; đường cơ sở số dòng tối đa được so sánh với merge base của đích so với head của nhánh mặc định được phân giải cho lần chạy đó. Đầu vào `release_gate` là phương án dự phòng chính xác theo SHA dành cho người bảo trì khi CI của PR bị đình trệ do năng lực: nó yêu cầu `target_ref` là SHA commit đầy đủ khớp với head của nhánh được kích hoạt và `pull_request_number` xác định PR đang mở có cây hợp nhất được xác thực.

```bash
gh workflow run ci.yml --ref release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

Đường dẫn extended-stable hằng tháng chỉ dành cho npm là ngoại lệ: kích hoạt cả bước kiểm tra trước `OpenClaw NPM
Release` và `Full Release Validation` từ chính xác
nhánh `extended-stable/YYYY.M.33`, lưu lại ID các lần chạy của chúng và truyền cả hai ID vào
lần chạy phát hành trực tiếp lên npm. Xem [Phát hành extended-stable hằng tháng chỉ dành cho npm](/vi/reference/RELEASING#monthly-npm-only-extended-stable-publication) để biết
các lệnh, yêu cầu chính xác về danh tính, thao tác đọc lại registry và quy trình
sửa bộ chọn. Đường dẫn này không kích hoạt việc phát hành Plugin, macOS, Windows, GitHub
Release, dist-tag riêng tư hoặc nền tảng khác.

## Runner

| Runner                          | Công việc                                                                                                                                                                                                                                                                              |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                  | `security-fast`, kích hoạt CI thủ công và phương án dự phòng cho kho lưu trữ không chính tắc, tác vụ tổng hợp QA Smoke, quét chất lượng và bảo mật CodeQL, kiểm tra tính hợp lệ của quy trình làm việc, trình gắn nhãn, phản hồi tự động, quy trình Docs độc lập và toàn bộ quy trình Install Smoke                                |
| `blacksmith-4vcpu-ubuntu-2404`  | `preflight`, `pnpm-store-warmup`, `native-i18n`, `checks-fast-core` ngoại trừ QA Smoke CI, các shard hợp đồng Plugin/kênh, phần lớn shard Linux Node đóng gói kèm/tải nhẹ hơn, các luồng `check-*` ngoại trừ `check-lint`, các shard `check-additional-*` được chọn, `check-docs` và `skills-python` |
| `blacksmith-8vcpu-ubuntu-2404`  | Các bộ kiểm thử Linux Node nặng được giữ lại, các shard `check-additional-*` nặng về ranh giới/extension và `android`                                                                                                                                                                             |
| `blacksmith-16vcpu-ubuntu-2404` | Các shard QA Smoke CI tự động, `build-artifacts` trong CI và Testbox, cùng `check-lint` (đủ nhạy với CPU để 8 vCPU tốn kém hơn mức tiết kiệm mà chúng mang lại)                                                                                                                                  |
| `blacksmith-8vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                  |
| `blacksmith-6vcpu-macos-15`     | `macos-node` trên `openclaw/openclaw`; các fork chuyển sang phương án dự phòng `macos-15`                                                                                                                                                                                                                |
| `blacksmith-12vcpu-macos-26`    | `macos-swift` và `ios-build` trên `openclaw/openclaw`; các fork chuyển sang phương án dự phòng `macos-26`                                                                                                                                                                                               |

## Ngân sách đăng ký runner

Nhóm đăng ký runner GitHub hiện tại của OpenClaw báo cáo 10.000 lượt đăng ký
runner tự lưu trữ mỗi 5 phút trong `ghx api rate_limit`. Hãy kiểm tra lại
`actions_runner_registration` trước mỗi lần tinh chỉnh vì GitHub có thể thay đổi
nhóm này. Giới hạn được dùng chung cho tất cả lượt đăng ký runner Blacksmith trong
tổ chức `openclaw`, vì vậy việc thêm một bản cài đặt Blacksmith khác không tạo thêm
nhóm mới.

Hãy coi nhãn Blacksmith là tài nguyên khan hiếm để kiểm soát tải tăng đột biến. Các công việc
chỉ định tuyến, thông báo, tóm tắt, chọn shard hoặc chạy quét CodeQL ngắn nên
duy trì trên runner do GitHub lưu trữ, trừ khi có nhu cầu riêng cho Blacksmith
đã được đo lường. Mọi ma trận Blacksmith mới, `max-parallel` lớn hơn hoặc quy trình làm việc
tần suất cao phải trình bày số lượt đăng ký trong trường hợp xấu nhất và giữ mục tiêu
cấp tổ chức dưới khoảng 60% nhóm hiện hành. Với nhóm 10.000 lượt đăng ký
hiện tại, điều đó tương ứng với mục tiêu vận hành 6.000 lượt đăng ký, để lại dư địa cho
các kho lưu trữ đồng thời, lần thử lại và phần tải tăng đột biến chồng lấn.

Kế hoạch PR theo đích đã thay đổi giúp giảm mức tăng đột biến thông thường của kiểm thử Node từ 14 lượt đăng ký Blacksmith xuống còn một. Các PR có rủi ro rộng vẫn giữ phương án dự phòng nhỏ gọn với 14 lượt đăng ký, vì vậy trường hợp xấu nhất không tăng.

CI của kho lưu trữ chính tắc giữ Blacksmith làm đường dẫn runner mặc định cho các lần chạy push và pull request thông thường. `workflow_dispatch` và các lần chạy kho lưu trữ không chính tắc sử dụng runner do GitHub lưu trữ, nhưng các lần chạy chính tắc thông thường hiện không dò tình trạng hàng đợi Blacksmith hoặc tự động chuyển sang nhãn do GitHub lưu trữ khi Blacksmith không khả dụng.

## Lệnh tương đương cục bộ

```bash
pnpm changed:lanes                            # kiểm tra bộ phân loại luồng thay đổi cục bộ cho origin/main...HEAD
pnpm check:changed                            # cổng kiểm tra cục bộ thông minh: định dạng/typecheck/lint/bộ bảo vệ đã thay đổi theo luồng ranh giới
pnpm check                                    # cổng cục bộ nhanh: tsgo sản phẩm + lint phân shard + các bộ bảo vệ nhanh song song
pnpm check:test-types
pnpm check:timed                              # cùng cổng với thời gian của từng giai đoạn
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1 node scripts/run-vitest.mjs run --config test/vitest/vitest.tui-pty.config.ts
pnpm test                                     # kiểm thử vitest
pnpm test:changed                             # các đích Vitest đã thay đổi thông minh, ít tốn tài nguyên
pnpm test:ui                                  # bộ kiểm thử đơn vị/trình duyệt Control UI
pnpm ui:i18n:check                            # tính tương đương locale Control UI được tạo (cổng phát hành)
pnpm native:i18n:baseline                     # cập nhật danh mục trích xuất ứng dụng gốc do nguồn sở hữu
pnpm native:i18n:verify                       # danh mục nguồn + độ an toàn bản địa hóa Android/Apple
pnpm native:i18n:check                        # tính tương đương nghiêm ngặt giữa bản dịch/đầu ra do nền tảng tạo (cổng phát hành)
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs                               # định dạng tài liệu + lint + liên kết hỏng
pnpm build                                    # build dist khi kiểm tra artifact/smoke của CI có ý nghĩa
pnpm ios:build                                # tạo và build dự án ứng dụng iOS
pnpm ci:timings                               # tóm tắt lần chạy CI push origin/main mới nhất
pnpm ci:timings:recent                        # so sánh các lần chạy CI main thành công gần đây
node scripts/ci-run-timings.mjs <run-id>      # tóm tắt tổng thời gian, thời gian chờ và các công việc chậm nhất
node scripts/ci-run-timings.mjs --latest-main # bỏ qua nhiễu từ issue/bình luận và chọn CI push origin/main
node scripts/ci-run-timings.mjs --recent 10   # so sánh các lần chạy CI main thành công gần đây
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
pnpm test:startup:memory
pnpm test:extensions:memory -- --json .artifacts/openclaw-performance/source/mock-provider/extension-memory.json
pnpm perf:kova:summary --report .artifacts/kova/reports/mock-provider/report.json --output .artifacts/kova/summary.md
```

## Hiệu năng OpenClaw

`OpenClaw Performance` là quy trình hiệu năng sản phẩm/môi trường chạy. Quy trình này chạy hằng ngày trên `main` và có thể được kích hoạt thủ công:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_openai_candidate=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

Việc kích hoạt thủ công thường đo hiệu năng của ref workflow. Đặt `target_ref` để đo hiệu năng của một thẻ phát hành hoặc một nhánh khác bằng cách triển khai workflow hiện tại. Các đường dẫn báo cáo đã xuất bản và con trỏ mới nhất được phân chia theo ref đã kiểm thử, và mỗi `index.md` ghi lại ref/SHA đã kiểm thử, ref/SHA workflow, ref Kova, hồ sơ, chế độ xác thực của lane, mô hình, số lần lặp và các bộ lọc kịch bản.

Workflow cài đặt OCM từ một bản phát hành được ghim và Kova từ `openclaw/Kova` tại đầu vào `kova_ref` được ghim, sau đó chạy ba lane:

- `mock-provider`: các kịch bản chẩn đoán Kova trên runtime được dựng cục bộ với cơ chế xác thực giả tương thích OpenAI có tính xác định.
- `mock-deep-profile`: lập hồ sơ CPU/heap/trace cho các điểm nóng khi khởi động, tại Gateway và trong lượt chạy của agent. Chạy theo lịch hoặc khi được kích hoạt với `deep_profile=true`.
- `live-openai-candidate`: một lượt chạy agent `openai/gpt-5.6-luna` OpenAI thực, bị bỏ qua khi `OPENAI_API_KEY` không khả dụng. Chạy theo lịch hoặc khi được kích hoạt với `live_openai_candidate=true`.

Lane nhà cung cấp mô phỏng cũng chạy các phép thăm dò mã nguồn dành riêng cho OpenClaw sau lượt Kova: thời gian khởi động Gateway và bộ nhớ trong các trường hợp khởi động mặc định, bỏ qua kênh, hook nội bộ và năm mươi Plugin; RSS khi nhập Plugin đi kèm, các vòng lặp chào `channel-chat-baseline` OpenAI mô phỏng lặp lại, các lệnh khởi động CLI trên Gateway đã khởi động và phép thăm dò hiệu năng smoke trạng thái SQLite. Khi báo cáo mã nguồn của nhà cung cấp mô phỏng đã xuất bản trước đó có sẵn cho ref được kiểm thử, bản tóm tắt mã nguồn sẽ so sánh các giá trị RSS và heap hiện tại với đường cơ sở đó, đồng thời đánh dấu mức tăng RSS lớn là `watch`. Bản tóm tắt Markdown của phép thăm dò mã nguồn nằm tại `source/index.md` trong gói báo cáo, cùng với JSON thô bên cạnh.

Mỗi lane tải lên artifact GitHub đầy đủ của mình, bao gồm các gói CPU, heap, trace và chẩn đoán đã nén. Một job xuất bản riêng tải xuống và xác thực các artifact đó, sau đó tạo token GitHub App ClawSweeper có thời hạn ngắn, chỉ giới hạn trong nội dung `openclaw/clawgrit-reports`, rồi chỉ chuyển token đó cho bước Git push. Job này commit `report.json`, `report.md`, `index.md`, các artifact thăm dò mã nguồn và siêu dữ liệu/tổng kiểm gói vào `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`; kho lưu trữ chẩn đoán đầy đủ vẫn nằm trong artifact Actions được liên kết. Trình xuất bản từ chối mọi tệp báo cáo lớn hơn 50 MB trước khi thử push. Con trỏ hiện tại của ref được kiểm thử là `openclaw-performance/<tested-ref>/latest-<lane>.json`. Các lần chạy theo lịch và những lần kích hoạt `profile=release` sẽ thất bại nếu việc tạo token ứng dụng hoặc xuất bản báo cáo thất bại. Các lần kích hoạt thủ công không dành cho phát hành vẫn coi việc xuất bản là khuyến nghị và giữ lại các artifact GitHub khi xác thực hoặc xuất bản thất bại. Đường cơ sở mã nguồn trước đó được tải ẩn danh từ kho báo cáo công khai, vì vậy việc tải đường cơ sở thành công không chứng minh rằng trình xuất bản đã được xác thực.

## Xác thực bản phát hành đầy đủ

`Full Release Validation` là workflow tổng hợp thủ công để "chạy mọi thứ trước khi phát hành". Workflow này chấp nhận một nhánh, thẻ hoặc SHA commit đầy đủ; kích hoạt workflow `CI` thủ công với mục tiêu đó (bao gồm Android); kích hoạt `Plugin Prerelease` để cung cấp bằng chứng Plugin/gói/tĩnh/Docker chỉ dành cho phát hành; kích hoạt `OpenClaw Performance` trên SHA mục tiêu; và kích hoạt `OpenClaw Release Checks` cho kiểm thử smoke cài đặt, chấp nhận gói, kiểm tra gói đa hệ điều hành, tính tương đương QA Lab, Matrix, Telegram cùng các lane Discord, WhatsApp và Slack có cổng kiểm soát (việc kết xuất bảng điểm mức độ trưởng thành mang tính khuyến nghị là tùy chọn qua `run_maturity_scorecard`). Hồ sơ ổn định và đầy đủ luôn bao gồm phạm vi kiểm thử live/E2E toàn diện và kiểm thử soak đường dẫn phát hành Docker; hồ sơ beta có thể bật tùy chọn này bằng `run_release_soak=true`. E2E Telegram của gói chuẩn chạy bên trong quy trình Chấp nhận Gói, vì vậy một ứng viên đầy đủ không khởi động trình thăm dò live trùng lặp. Sau khi xuất bản, truyền `release_package_spec` để tái sử dụng gói npm đã phát hành trong các kiểm tra phát hành, Chấp nhận Gói, Docker, kiểm tra đa hệ điều hành và Telegram mà không dựng lại. Chỉ sử dụng `npm_telegram_package_spec` để chạy lại Telegram có trọng tâm với gói đã xuất bản. Lane gói live của Plugin Codex mặc định sử dụng cùng trạng thái đã chọn: `release_package_spec=openclaw@<tag>` đã xuất bản suy ra `codex_plugin_spec=npm:@openclaw/codex@<tag>`, trong khi các lần chạy SHA/artifact đóng gói `extensions/codex` từ ref đã chọn. Đặt `codex_plugin_spec` một cách rõ ràng cho các nguồn Plugin tùy chỉnh như đặc tả `npm:`, `npm-pack:` hoặc `git:`. Bằng chứng agent live của lane này gửi tiến trình hiển thị được, tiếp tục qua các lần đọc không gian làm việc ngẫu nhiên và một lần ghi artifact chính xác, rồi gửi thông báo hoàn tất.

Xem [Xác thực bản phát hành đầy đủ](/vi/reference/full-release-validation) để biết
ma trận giai đoạn, tên job workflow chính xác, sự khác biệt giữa các hồ sơ, artifact và
các tham số chạy lại có trọng tâm.

`OpenClaw Release Publish` là workflow phát hành có thay đổi trạng thái được kích hoạt thủ công. Kích hoạt
các lần xuất bản beta và ổn định thông thường từ `main` đáng tin cậy sau khi thẻ phát hành
đã tồn tại và sau khi quy trình kiểm tra trước npm của OpenClaw thành công (quy trình kiểm tra trước chạy
`pnpm plugins:sync:check` trong số các bước kiểm tra). Thẻ vẫn chọn chính xác
commit phát hành, bao gồm cả commit trên `release/YYYY.M.PATCH`; các lần xuất bản alpha
Tideclaw tiếp tục sử dụng nhánh alpha tương ứng. Workflow yêu cầu
`preflight_run_id` đã lưu và một lần chạy
`full_release_validation_run_id` thành công cùng
`full_release_validation_run_attempt` chính xác của lần chạy đó; kích hoạt `Plugin NPM Release` cho tất cả
các gói Plugin có thể xuất bản; kích hoạt `Plugin ClawHub Release` cho cùng
SHA phát hành; và chỉ sau đó mới kích hoạt `OpenClaw NPM Release`. Việc xuất bản ổn định cũng
yêu cầu một `windows_node_tag` chính xác; workflow xác minh bản phát hành mã nguồn Windows
và so sánh các trình cài đặt x64/ARM64 của bản đó với đầu vào
`windows_node_installer_digests` đã được ứng viên phê duyệt trước bất kỳ workflow con xuất bản nào, sau đó quảng bá
và xác minh chính các digest trình cài đặt đã ghim đó cùng với artifact đi kèm chính xác
và hợp đồng tổng kiểm trước khi xuất bản bản nháp phát hành GitHub.
Các bản sửa chữa có trọng tâm chỉ dành cho Plugin sử dụng `plugin_publish_scope=selected` với
danh sách gói không rỗng. Các lần chạy `all-publishable` chỉ dành cho Plugin yêu cầu cùng
bằng chứng kiểm tra trước npm bất biến và Xác thực Bản phát hành Đầy đủ như khi xuất bản lõi.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref main \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f full_release_validation_run_attempt=<successful-full-release-validation-run-attempt> \
  -f npm_dist_tag=beta
```

Để xác minh commit được ghim trên một nhánh thay đổi nhanh, hãy sử dụng trình trợ giúp thay vì
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

Các ref dùng để kích hoạt quy trình làm việc GitHub phải là nhánh hoặc thẻ, không phải SHA commit thô. Trình trợ giúp đẩy một nhánh `release-ci/<sha>-...` tạm thời tại SHA quy trình làm việc `main` đáng tin cậy, truyền SHA đích được yêu cầu qua đầu vào `ref` của quy trình làm việc, tái sử dụng bằng chứng nghiêm ngặt về đúng đích khi có sẵn, xác minh rằng `headSha` của mọi quy trình làm việc con khớp với SHA quy trình làm việc đáng tin cậy và xóa nhánh tạm thời khi lượt chạy hoàn tất. Truyền `-f reuse_evidence=false` để buộc thực hiện xác thực mới. Trình xác minh tổng cũng thất bại nếu bất kỳ quy trình làm việc con nào chạy tại một SHA quy trình làm việc khác.

`release_profile` kiểm soát phạm vi live/nhà cung cấp được truyền vào các bước kiểm tra bản phát hành. Các quy trình làm việc phát hành thủ công mặc định dùng `stable`; chỉ sử dụng `full` khi bạn chủ ý muốn ma trận tư vấn rộng về nhà cung cấp/phương tiện. Các bước kiểm tra bản phát hành ổn định và đầy đủ luôn chạy toàn bộ quy trình live/E2E và kiểm thử ngâm đường dẫn phát hành Docker; hồ sơ beta có thể bật tham gia bằng `run_release_soak=true`.

- `beta` giữ lại các lane quan trọng với bản phát hành OpenAI/core nhanh nhất.
- `stable` thêm tập hợp nhà cung cấp/backend ổn định.
- `full` chạy ma trận tư vấn rộng về nhà cung cấp/phương tiện.

Quy trình tổng ghi lại ID của các lượt chạy con đã kích hoạt, còn job `Verify full validation` cuối cùng kiểm tra lại kết luận hiện tại của các lượt chạy con và nối thêm bảng các job chậm nhất cho từng lượt chạy con. Nếu một quy trình làm việc con được chạy lại và chuyển sang trạng thái xanh, chỉ chạy lại job xác minh cha để làm mới kết quả tổng và bản tóm tắt thời gian.

Để khôi phục, cả `Full Release Validation` và `OpenClaw Release Checks` đều chấp nhận `rerun_group`. Sử dụng `all` cho một bản phát hành ứng viên, `ci` chỉ cho quy trình CI đầy đủ con thông thường, `plugin-prerelease` chỉ cho quy trình con tiền phát hành Plugin, `performance` chỉ cho quy trình con Hiệu năng OpenClaw, `release-checks` cho mọi quy trình con phát hành hoặc một nhóm hẹp hơn: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` hoặc `npm-telegram` trên quy trình tổng. Cách này giữ phạm vi chạy lại của một hộp phát hành bị lỗi ở mức giới hạn sau một bản sửa tập trung. Đối với một lane đa hệ điều hành bị lỗi, kết hợp `rerun_group=cross-os` với `cross_os_suite_filter`, ví dụ `windows/packaged-upgrade`; các lệnh đa hệ điều hành chạy lâu phát ra các dòng Heartbeat và bản tóm tắt nâng cấp gói bao gồm thời gian của từng giai đoạn. Các lane QA Matrix và Telegram được chọn sẽ chặn quá trình xác thực bản phát hành thông thường, tương tự như cổng bao phủ công cụ runtime tiêu chuẩn. Tính tương đương QA, tính tương đương runtime và các lane live Discord, WhatsApp và Slack có cổng chỉ mang tính tư vấn.

`OpenClaw Release Checks` sử dụng ref quy trình làm việc đáng tin cậy để phân giải ref đã chọn một lần thành tarball `release-package-under-test`, sau đó truyền artifact đó cho các bước kiểm tra đa hệ điều hành và Chấp nhận Gói, cùng với quy trình làm việc Docker live/E2E cho đường dẫn phát hành khi chạy phạm vi kiểm thử ngâm. Cách này giữ nhất quán các byte của gói trên các hộp phát hành và tránh đóng gói lại cùng một bản ứng viên trong nhiều job con. Đối với lane live npm-plugin Codex, các bước kiểm tra bản phát hành truyền một đặc tả Plugin đã xuất bản khớp được suy ra từ `release_package_spec`, truyền `codex_plugin_spec` do người vận hành cung cấp hoặc để trống đầu vào để script Docker đóng gói Plugin Codex của checkout đã chọn.

Các lượt chạy `Full Release Validation` trùng lặp cho `ref=main` và `rerun_group=all` sẽ thay thế quy trình tổng cũ hơn. Trình giám sát cha hủy mọi quy trình làm việc con mà nó đã kích hoạt khi quy trình cha bị hủy, nhờ đó quá trình xác thực main mới hơn không phải chờ sau một lượt kiểm tra bản phát hành hai giờ đã lỗi thời. Quá trình xác thực nhánh/thẻ phát hành và các nhóm chạy lại tập trung giữ nguyên `cancel-in-progress: false`.

## Các shard live và E2E

Quy trình con live/E2E của bản phát hành duy trì phạm vi bao phủ `pnpm test:live` gốc rộng, nhưng chạy dưới dạng các shard có tên thông qua `scripts/test-live-shard.mjs` thay vì một job tuần tự:

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

Cách này giữ nguyên phạm vi bao phủ tệp, đồng thời giúp việc chạy lại và chẩn đoán các lỗi nhà cung cấp live chậm trở nên dễ dàng hơn. Các tên shard tổng hợp `native-live-src-gateway`, `native-live-extensions-o-z`, `native-live-extensions-media` và `native-live-extensions-media-music` vẫn hợp lệ cho các lượt chạy lại thủ công một lần.

Các shard phương tiện live gốc chạy trong `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, được xây dựng bởi quy trình làm việc `Live Media Runner Image`. Image đó cài đặt sẵn `ffmpeg` và `ffprobe`; các job phương tiện chỉ xác minh các tệp nhị phân trước khi thiết lập. Giữ các bộ kiểm thử live dựa trên Docker trên các runner Blacksmith thông thường — các job container không phải nơi phù hợp để khởi chạy các bài kiểm thử Docker lồng nhau.

Các phân đoạn mô hình/backend trực tiếp dựa trên Docker sử dụng một image `ghcr.io/openclaw/openclaw-live-test:<sha>-<extensions>` dùng chung riêng biệt cho mỗi commit được chọn. Quy trình phát hành trực tiếp xây dựng và đẩy image đó một lần, sau đó các phân đoạn mô hình trực tiếp Docker, Gateway được phân đoạn theo nhà cung cấp, backend CLI, liên kết ACP và bộ kiểm thử Codex chạy với `OPENCLAW_SKIP_DOCKER_BUILD=1`. Các phân đoạn Gateway Docker mang giới hạn `timeout` rõ ràng ở cấp tập lệnh, thấp hơn thời gian chờ của job quy trình, để một container bị treo hoặc đường dẫn dọn dẹp bị kẹt sẽ thất bại nhanh thay vì tiêu tốn toàn bộ ngân sách kiểm tra phát hành. Nếu các phân đoạn đó tự xây dựng lại độc lập toàn bộ target Docker từ mã nguồn, thì lượt chạy phát hành đã được cấu hình sai và sẽ lãng phí thời gian thực tế vào các lần xây dựng image trùng lặp.

## Chấp nhận gói

Sử dụng `Package Acceptance` khi câu hỏi là "gói OpenClaw có thể cài đặt này có hoạt động như một sản phẩm không?" Quy trình này khác với CI thông thường: CI thông thường xác thực cây mã nguồn, còn chấp nhận gói xác thực một tarball duy nhất thông qua cùng bộ kiểm thử E2E Docker mà người dùng thực hiện sau khi cài đặt hoặc cập nhật.

### Job

1. `resolve_package` checkout `workflow_ref`, phân giải một ứng viên gói, ghi `.artifacts/docker-e2e-package/openclaw-current.tgz`, ghi `.artifacts/docker-e2e-package/package-candidate.json`, tải cả hai lên dưới dạng artifact `package-under-test`, đồng thời in nguồn, tham chiếu quy trình, tham chiếu gói, phiên bản, SHA-256 và hồ sơ trong phần tóm tắt bước GitHub.
2. `package_integrity` tải xuống artifact `package-under-test` và thực thi hợp đồng tarball gói công khai bằng `scripts/check-openclaw-package-tarball.mjs`.
3. `docker_acceptance` gọi `openclaw-live-and-e2e-checks-reusable.yml` với SHA nguồn gói đã phân giải (dự phòng về `workflow_ref`) và `package_artifact_name=package-under-test`. Quy trình có thể tái sử dụng tải artifact đó xuống, xác thực danh mục tarball, chuẩn bị các image Docker theo digest gói khi cần và chạy các lane Docker được chọn đối với gói đó thay vì đóng gói bản checkout của quy trình. Khi một hồ sơ chọn nhiều `docker_lanes` có mục tiêu, quy trình có thể tái sử dụng chuẩn bị gói và các image dùng chung một lần, sau đó phân tán các lane đó thành các job Docker có mục tiêu chạy song song với các artifact duy nhất.
4. `package_telegram` tùy chọn gọi `NPM Telegram Beta E2E`. Job này chạy khi `telegram_mode` không phải là `none` và cài đặt cùng artifact `package-under-test` khi Chấp nhận gói đã phân giải một artifact; lượt điều phối Telegram độc lập vẫn có thể cài đặt một đặc tả npm đã phát hành.
5. `summary` làm quy trình thất bại nếu quá trình phân giải gói, tính toàn vẹn, chấp nhận Docker hoặc lane Telegram tùy chọn thất bại. Đầu vào `advisory` hạ các lỗi chấp nhận xuống thành cảnh báo đối với các bên gọi mang tính tư vấn.

### Nguồn ứng viên

- `source=npm` chỉ chấp nhận `openclaw@extended-stable`, `openclaw@beta`, `openclaw@latest` hoặc một phiên bản phát hành OpenClaw chính xác như `openclaw@2026.4.27-beta.2`. Sử dụng mục này để chấp nhận bản ổn định mở rộng, bản phát hành trước hoặc bản ổn định đã phát hành.
- `source=ref` đóng gói một nhánh, thẻ hoặc SHA commit đầy đủ `package_ref` đáng tin cậy. Trình phân giải tìm nạp các nhánh/thẻ OpenClaw, xác minh commit được chọn có thể truy cập từ lịch sử nhánh kho lưu trữ hoặc một thẻ phát hành, cài đặt các phần phụ thuộc trong một worktree tách rời và đóng gói bằng `scripts/package-openclaw-for-docker.mjs`.
- `source=url` tải xuống một `.tgz` HTTPS công khai; bắt buộc có `package_sha256`. Đường dẫn này từ chối thông tin xác thực trong URL, các cổng HTTPS không mặc định, tên máy chủ hoặc địa chỉ IP đã phân giải thuộc loại riêng tư/nội bộ/dành cho mục đích đặc biệt, cũng như các chuyển hướng nằm ngoài cùng chính sách an toàn công khai.
- `source=trusted-url` tải xuống một `.tgz` HTTPS từ một chính sách nguồn đáng tin cậy có tên trong `.github/package-trusted-sources.json`; bắt buộc có `package_sha256` và `trusted_source_id`. Chỉ sử dụng mục này cho các mirror doanh nghiệp do người bảo trì sở hữu hoặc kho lưu trữ gói riêng tư cần cấu hình máy chủ, cổng, tiền tố đường dẫn, máy chủ chuyển hướng hoặc phân giải mạng riêng. Nếu chính sách khai báo xác thực bearer, quy trình sử dụng secret `OPENCLAW_TRUSTED_PACKAGE_TOKEN` cố định; thông tin xác thực được nhúng trong URL vẫn bị từ chối.
- `source=artifact` tải xuống một `.tgz` từ `artifact_run_id` và `artifact_name`; `package_sha256` là tùy chọn nhưng nên được cung cấp cho các artifact được chia sẻ bên ngoài.

Giữ `workflow_ref` và `package_ref` tách biệt. `workflow_ref` là mã quy trình/bộ kiểm thử đáng tin cậy chạy bài kiểm tra. `package_ref` là commit nguồn được đóng gói khi `source=ref`. Điều này cho phép bộ kiểm thử hiện tại xác thực các commit nguồn đáng tin cậy cũ hơn mà không chạy logic quy trình cũ.

### Hồ sơ bộ kiểm thử

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `skill-install`, `update-corrupt-plugin`, `upgrade-survivor`, `published-upgrade-survivor`, `root-managed-vps-upgrade`, `update-restart-auth`, `plugins-offline`, `plugin-update`
- `product` — tập hợp `package` với phạm vi bao phủ `plugins` trực tiếp thay cho `plugins-offline`, cộng với `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — các phần đầy đủ của đường dẫn phát hành Docker với OpenWebUI
- `custom` — chính xác `docker_lanes`; bắt buộc khi `suite_profile=custom`

Hồ sơ `package` sử dụng phạm vi bao phủ Plugin ngoại tuyến để việc xác thực gói đã phát hành không phụ thuộc vào tính khả dụng trực tiếp của ClawHub. Lane Telegram tùy chọn tái sử dụng artifact `package-under-test` trong `NPM Telegram Beta E2E`, đồng thời giữ lại đường dẫn đặc tả npm đã phát hành cho các lượt điều phối độc lập.

Để xem chính sách chuyên biệt về kiểm thử cập nhật và Plugin, bao gồm các lệnh cục bộ,
lane Docker, đầu vào Chấp nhận gói, giá trị mặc định phát hành và phân loại lỗi,
hãy xem [Kiểm thử cập nhật và Plugin](/vi/help/testing-updates-plugins).

Các bước kiểm tra phát hành gọi Chấp nhận gói với `source=artifact`, artifact gói phát hành đã chuẩn bị, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor root-managed-vps-upgrade update-restart-auth plugins-offline plugin-update plugin-binding-command-escape'` và `telegram_mode=mock-openai`. Điều này giữ cho việc di chuyển gói, cập nhật, cài đặt Skills trực tiếp từ ClawHub, dọn dẹp phần phụ thuộc Plugin cũ, sửa chữa cài đặt Plugin đã cấu hình, Plugin ngoại tuyến, cập nhật Plugin và bằng chứng Telegram sử dụng cùng một tarball gói đã phân giải. Đặt `release_package_spec` trên Xác thực phát hành đầy đủ hoặc Kiểm tra phát hành OpenClaw sau khi phát hành bản beta để chạy cùng ma trận đối với gói npm đã phát hành mà không xây dựng lại; chỉ đặt `package_acceptance_package_spec` khi Chấp nhận gói cần một gói khác với phần còn lại của quá trình xác thực phát hành. Các bước kiểm tra phát hành đa hệ điều hành vẫn bao phủ quá trình onboarding, trình cài đặt và hành vi nền tảng dành riêng cho hệ điều hành; việc xác thực sản phẩm gói/cập nhật nên bắt đầu bằng Chấp nhận gói.

Lane Docker `published-upgrade-survivor` xác thực một đường cơ sở gói đã phát hành cho mỗi lượt chạy trong đường dẫn phát hành chặn. Trong Chấp nhận gói, tarball `package-under-test` đã phân giải luôn là ứng viên và `published_upgrade_survivor_baseline` chọn đường cơ sở đã phát hành dự phòng, mặc định là `openclaw@latest`; các lệnh chạy lại lane thất bại giữ nguyên đường cơ sở đó. Xác thực phát hành đầy đủ với `run_release_soak=true` hoặc `release_profile=full` đặt `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` và `published_upgrade_survivor_scenarios=reported-issues` để mở rộng trên bốn bản phát hành npm ổn định mới nhất, cộng với các bản phát hành biên tương thích Plugin được ghim và các fixture theo tình huống sự cố cho cấu hình Feishu, các tệp bootstrap/persona được giữ nguyên, cài đặt Plugin OpenClaw đã cấu hình, đường dẫn nhật ký có dấu ngã và các thư mục gốc phần phụ thuộc Plugin cũ. Các lựa chọn kiểm tra khả năng tồn tại sau nâng cấp từ nhiều đường cơ sở đã phát hành được phân đoạn theo đường cơ sở thành các job trình chạy Docker có mục tiêu riêng biệt. Quy trình `Update Migration` riêng biệt sử dụng lane Docker `update-migration` với các đường cơ sở `all-since-2026.4.23` và các kịch bản `plugin-deps-cleanup` khi câu hỏi là dọn dẹp cập nhật đã phát hành một cách toàn diện, không phải phạm vi CI Phát hành đầy đủ thông thường. Các lượt chạy tổng hợp cục bộ có thể truyền các đặc tả gói chính xác bằng `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, giữ một lane duy nhất bằng `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` như `openclaw@2026.4.15`, hoặc đặt `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` cho ma trận kịch bản. Lane đã phát hành cấu hình đường cơ sở bằng một công thức lệnh `openclaw config set` được tích hợp sẵn, ghi lại các bước của công thức trong `summary.json`, đồng thời thăm dò `/healthz`, `/readyz` và trạng thái RPC sau khi Gateway khởi động. Các lane cài đặt mới và gói đóng sẵn trên Windows cũng xác minh rằng một gói đã cài đặt có thể nhập một phần ghi đè điều khiển trình duyệt từ đường dẫn Windows tuyệt đối thô. Kiểm tra nhanh lượt chạy agent OpenAI đa hệ điều hành mặc định dùng `OPENCLAW_CROSS_OS_OPENAI_MODEL` khi được đặt, nếu không thì dùng `openai/gpt-5.6-luna`, để bằng chứng cài đặt và Gateway sử dụng cấp kiểm thử GPT-5.6 có chi phí thấp hơn.

### Cửa sổ tương thích cũ

Chấp nhận gói có các cửa sổ tương thích cũ giới hạn cho các gói đã phát hành. Các gói đến hết `2026.4.25`, bao gồm `2026.4.25-beta.*`, có thể sử dụng đường dẫn tương thích:

- các mục QA riêng tư đã biết trong `dist/postinstall-inventory.json` có thể trỏ đến các tệp bị loại khỏi tarball;
- `doctor-switch` có thể bỏ qua trường hợp con duy trì `gateway install --wrapper` khi gói không cung cấp cờ đó;
- `update-channel-switch` có thể loại bỏ `patchedDependencies` pnpm bị thiếu khỏi fixture git giả được tạo từ tarball và có thể ghi nhật ký `update.channel` được duy trì nhưng bị thiếu;
- các bài kiểm tra nhanh Plugin có thể đọc vị trí bản ghi cài đặt cũ hoặc chấp nhận việc thiếu duy trì bản ghi cài đặt marketplace;
- `plugin-update` có thể cho phép di chuyển siêu dữ liệu cấu hình trong khi vẫn yêu cầu bản ghi cài đặt và hành vi không cài đặt lại giữ nguyên.

Gói `2026.4.26` đã phát hành cũng có thể cảnh báo về các tệp dấu siêu dữ liệu bản dựng cục bộ đã được phát hành, và các gói đến hết `2026.5.20` có thể cảnh báo thay vì thất bại khi thiếu `npm-shrinkwrap.json`. Các gói mới hơn phải đáp ứng các hợp đồng hiện đại; cùng các điều kiện đó sẽ thất bại thay vì cảnh báo hoặc bỏ qua.

### Ví dụ

```bash
# Xác thực gói beta hiện tại với phạm vi bao phủ cấp sản phẩm.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai

# Xác thực gói ổn định mở rộng đã phát hành với phạm vi bao phủ gói.
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

# Xác thực một tarball từ chính sách mirror riêng tư đáng tin cậy có tên.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=trusted-url \
  -f trusted_source_id=enterprise-artifactory \
  -f package_url=https://packages.example.internal:8443/artifactory/openclaw/openclaw-current.tgz \
  -f package_sha256=<64-char-sha256> \
  -f suite_profile=smoke

# Tái sử dụng tarball do một lượt chạy Actions khác tải lên.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=package-under-test \
  -f suite_profile=custom \
  -f docker_lanes='install-e2e plugin-update'
```

Khi gỡ lỗi một lượt chạy chấp nhận gói thất bại, hãy bắt đầu tại phần tóm tắt `resolve_package` để xác nhận nguồn gói, phiên bản và SHA-256. Sau đó kiểm tra lượt chạy con `docker_acceptance` và các artifact Docker của nó: `.artifacts/docker-tests/**/summary.json`, `failures.json`, nhật ký lane, thời gian từng giai đoạn và các lệnh chạy lại. Ưu tiên chạy lại hồ sơ gói thất bại hoặc các lane Docker chính xác thay vì chạy lại toàn bộ quá trình xác thực phát hành.

## Kiểm tra nhanh cài đặt

Quy trình `Install Smoke` không còn chạy trên các pull request hoặc lượt đẩy `main`. Trình bao chạy hằng đêm/thủ công và quy trình xác thực bản phát hành của nó đều gọi lõi chỉ đọc `install-smoke-reusable.yml`, và mỗi lượt chạy đều thực hiện đầy đủ luồng kiểm tra nhanh cài đặt trên các runner do GitHub lưu trữ:

- Ảnh kiểm tra nhanh từ Dockerfile gốc được xây dựng một lần cho mỗi SHA đích, liên kết với bản sửa đổi quy trình và lần thử của trình tạo trong một artifact bất biến, sau đó được kiểm tra nhanh CLI, kiểm tra nhanh CLI dùng không gian làm việc dùng chung để xóa agent, E2E mạng Gateway trong container và kiểm tra nhanh đối số xây dựng Plugin `matrix` đi kèm tải. Kiểm tra nhanh Plugin xác minh việc phản chiếu cài đặt dependency thời gian chạy và xác minh Plugin tải mà không có chẩn đoán thoát khỏi điểm vào.
- Cài đặt gói QR và các kiểm tra nhanh Docker cho trình cài đặt/cập nhật (bao gồm các lane trình cài đặt Rocky Linux và một lane cập nhật dựa trên baseline npm `update_baseline_version` có thể cấu hình) chạy dưới dạng các job riêng biệt để công việc trình cài đặt không phải chờ sau các kiểm tra nhanh ảnh gốc.

Kiểm tra nhanh nhà cung cấp ảnh cài đặt toàn cục Bun chậm được kiểm soát riêng bằng `run_bun_global_install_smoke`. Nó chạy theo lịch hằng đêm, mặc định được bật cho các lệnh gọi quy trình từ kiểm tra bản phát hành và các lượt điều phối `Install Smoke` thủ công có thể chọn bật nó. CI PR thông thường vẫn chạy lane hồi quy trình khởi chạy Bun nhanh cho các thay đổi liên quan đến Node. Các bài kiểm tra Docker QR và trình cài đặt giữ nguyên các Dockerfile tập trung vào cài đặt riêng.

## E2E Docker cục bộ

`pnpm test:docker:all` xây dựng trước một ảnh kiểm thử trực tiếp dùng chung, đóng gói OpenClaw một lần dưới dạng tarball npm và xây dựng hai ảnh `scripts/e2e/Dockerfile` dùng chung:

- một runner Node/Git tối giản cho các lane trình cài đặt/cập nhật/dependency Plugin;
- một ảnh chức năng cài đặt cùng tarball vào `/app` cho các lane chức năng thông thường.

Các định nghĩa lane Docker nằm trong `scripts/lib/docker-e2e-scenarios.mjs`, logic lập kế hoạch nằm trong `scripts/lib/docker-e2e-plan.mjs`, và runner chỉ thực thi kế hoạch đã chọn. Bộ lập lịch chọn ảnh cho mỗi lane bằng `OPENCLAW_DOCKER_E2E_BARE_IMAGE` và `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, sau đó chạy các lane bằng `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Tham số điều chỉnh

| Biến                               | Mặc định | Mục đích                                                                                       |
| -------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | Số lượng vị trí trong nhóm chính cho các lane thông thường.                                                        |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | Số lượng vị trí trong nhóm cuối nhạy cảm với nhà cung cấp.                                                      |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | Giới hạn lane trực tiếp đồng thời để nhà cung cấp không điều tiết.                                        |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 5       | Giới hạn lane cài đặt npm đồng thời.                                                              |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | Giới hạn lane đa dịch vụ đồng thời.                                                            |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | Khoảng giãn giữa các lần khởi động lane để tránh bão tạo Docker daemon; đặt `0` để không giãn.     |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | Thời gian chờ dự phòng cho mỗi lane (120 phút); các lane trực tiếp/cuối được chọn sử dụng giới hạn chặt hơn.           |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | chưa đặt   | `1` in kế hoạch bộ lập lịch mà không chạy các lane.                                          |
| `OPENCLAW_DOCKER_ALL_LANES`            | chưa đặt   | Danh sách chính xác các lane, phân tách bằng dấu phẩy; bỏ qua kiểm tra nhanh dọn dẹp để agent có thể tái tạo một lane bị lỗi. |

Một lane nặng hơn giới hạn hiệu dụng của nó vẫn có thể khởi động từ một nhóm trống, sau đó chạy một mình cho đến khi giải phóng sức chứa. Quy trình tổng hợp cục bộ kiểm tra trước Docker, xóa các container E2E OpenClaw cũ, phát trạng thái lane đang hoạt động, lưu thời gian lane để sắp xếp dài nhất trước và mặc định dừng lập lịch các lane mới trong nhóm sau lỗi đầu tiên.

### Quy trình trực tiếp/E2E có thể tái sử dụng

Quy trình trực tiếp/E2E có thể tái sử dụng hỏi `scripts/test-docker-all.mjs --plan-json` về gói, loại ảnh, ảnh trực tiếp, lane và phạm vi thông tin xác thực cần thiết. Sau đó, `scripts/docker-e2e.mjs` chuyển đổi kế hoạch đó thành đầu ra và bản tóm tắt GitHub. Nó đóng gói OpenClaw thông qua `scripts/package-openclaw-for-docker.mjs`, tải xuống artifact gói của lượt chạy hiện tại hoặc tải xuống artifact gói từ `package_artifact_run_id`, rồi xác thực danh mục tarball. Luồng `no-push-artifact` mặc định xây dựng các ảnh tối giản/chức năng được gắn thẻ theo digest gói thông qua bộ nhớ đệm lớp Docker của Blacksmith, đóng gói chính xác các byte ảnh vào một artifact quy trình bất biến và yêu cầu mỗi trình tiêu thụ xác minh rồi tải artifact đó. Thay vào đó, `existing-only` yêu cầu rõ ràng các tham chiếu GHCR `docker_e2e_bare_image`/`docker_e2e_functional_image` và không bao giờ xây dựng hoặc đẩy. Các lượt kéo registry đó sử dụng thời gian chờ giới hạn 180 giây cho mỗi lần thử để luồng bị kẹt được thử lại nhanh chóng thay vì chiếm phần lớn đường găng CI. Sau khi xác thực theo lịch thành công, `openclaw-scheduled-live-checks.yml` chuyển manifest ảnh bất biến đã kiểm thử cho trình phát hành ghi gói riêng biệt; các trình gọi bản phát hành và tiền phát hành chỉ đọc không bao giờ đi qua trình ghi đó.

### Các phần của luồng phát hành

Phạm vi Docker của bản phát hành chạy các job nhỏ hơn được chia phần bằng `OPENCLAW_SKIP_DOCKER_BUILD=1` để mỗi phần chỉ xác minh và tải loại ảnh dựa trên artifact mà nó cần (hoặc kéo ảnh đó khi tái sử dụng rõ ràng `existing-only`) và thực thi nhiều lane thông qua cùng bộ lập lịch có trọng số:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h | openwebui`

Các phần Docker bản phát hành hiện tại là `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, từ `plugins-runtime-install-a` đến `plugins-runtime-install-h` và `openwebui`. `package-update-openai` bao gồm lane gói Plugin Codex trực tiếp, cài đặt gói OpenClaw ứng viên, cài đặt Plugin Codex từ `codex_plugin_spec` hoặc tarball cùng tham chiếu với phê duyệt cài đặt Codex CLI rõ ràng, chạy kiểm tra trước Codex CLI và các lượt agent trong cùng phiên, sau đó chạy một lượt không thử lại với mức suy luận trung bình để gửi tiến độ, đọc các đầu vào không gian làm việc được ngẫu nhiên hóa, ghi artifact chính xác của chúng và gửi trạng thái hoàn tất. `plugins-runtime-core`, `plugins-runtime` và `plugins-integrations` vẫn là các bí danh tổng hợp Plugin/thời gian chạy. Bí danh lane `install-e2e` vẫn là bí danh chạy lại thủ công tổng hợp cho cả hai lane trình cài đặt nhà cung cấp.

OpenWebUI chạy dưới dạng một phần `openwebui` độc lập trên runner Blacksmith dung lượng đĩa lớn chuyên dụng bất cứ khi nào phạm vi luồng phát hành ổn định hoặc đầy đủ yêu cầu, ngay cả khi quy trình có thể tái sử dụng định tuyến các job được hỗ trợ đến runner do GitHub lưu trữ. Việc tách riêng lượt kéo ảnh bên ngoài ngăn ảnh lớn cạnh tranh với các ảnh gói và Plugin dùng chung trong `plugins-runtime-services`; các phần tổng hợp Plugin/thời gian chạy cũ vẫn bao gồm OpenWebUI cho các lượt chạy lại thủ công tương thích. Các lane cập nhật kênh đi kèm thử lại một lần đối với lỗi mạng npm tạm thời.

Mỗi phần tải lên `.artifacts/docker-tests/` cùng nhật ký lane, thời gian, `summary.json`, `failures.json`, thời gian các pha, JSON kế hoạch bộ lập lịch, bảng lane chậm và lệnh chạy lại cho từng lane. Đầu vào `docker_lanes` của quy trình chạy các lane đã chọn dựa trên ảnh được chuẩn bị cho lượt chạy đó thay vì các job chia phần, nhờ đó việc gỡ lỗi lane thất bại được giới hạn trong một job Docker có mục tiêu; nếu lane được chọn là lane Docker trực tiếp, job có mục tiêu sẽ xây dựng cục bộ ảnh kiểm thử trực tiếp cho lượt chạy lại đó. Trình trợ giúp chạy lại xác thực chính xác SHA đích được chọn của artifact lỗi và lượt điều phối thủ công đóng gói lại tham chiếu đó, vì bộ giá trị gói của quy trình có thể tái sử dụng nội bộ không thuộc schema `workflow_dispatch`. Các lệnh được tạo chỉ bao gồm đầu vào ảnh đã chuẩn bị và `shared_image_policy=existing-only` khi các đầu vào đó dựa trên GHCR; thẻ artifact cục bộ trên runner bị bỏ qua để runner mới xây dựng lại chúng. Giá trị ghi đè đích rõ ràng sẽ loại bỏ các tham chiếu ảnh GHCR được khôi phục trừ khi artifact chứng minh chúng khớp với giá trị ghi đè. Các tham chiếu định nghĩa quy trình do artifact tạo cũng bị bỏ qua vì các nhánh tạm thời của bản phát hành đầy đủ bị xóa; lượt điều phối sử dụng nhánh mặc định của kho lưu trữ trừ khi người vận hành ghi đè rõ ràng.

```bash
pnpm test:docker:rerun <run-id>      # tải xuống các artifact Docker và in các lệnh chạy lại có mục tiêu kết hợp/theo từng lane
pnpm test:docker:timings <summary>   # bản tóm tắt lane chậm và đường găng theo pha
```

Quy trình trực tiếp/E2E theo lịch chạy bộ Docker đầy đủ của luồng phát hành hằng ngày và sau khi thành công, gọi trình phát hành rõ ràng cho chính xác các artifact ảnh đã kiểm thử.

## Tiền phát hành Plugin

`Plugin Prerelease` là phạm vi sản phẩm/gói tốn kém hơn, vì vậy đây là một quy trình riêng được điều phối bởi `Full Release Validation` hoặc một người vận hành rõ ràng. Các pull request thông thường, lượt đẩy `main` và các lượt điều phối CI thủ công độc lập không bật bộ này. Nó cân bằng các bài kiểm tra Plugin đi kèm trên tám worker phần mở rộng; các job phân mảnh phần mở rộng đó chạy tối đa hai nhóm cấu hình Plugin cùng lúc với một worker Vitest trên mỗi nhóm và heap Node lớn hơn để các lô Plugin nặng về import không tạo thêm job CI. Luồng tiền phát hành Docker chỉ dành cho bản phát hành (được bật bằng đầu vào `full_release_validation`) gom các lane Docker có mục tiêu thành các nhóm bốn để tránh giữ trước hàng chục runner cho các job kéo dài từ một đến ba phút. Quy trình cũng tải lên artifact `plugin-inspector-advisory` mang tính thông tin từ `@openclaw/plugin-inspector`; các phát hiện của trình kiểm tra là đầu vào phân loại và không thay đổi cổng Tiền phát hành Plugin có tính chặn.

## QA Lab

QA Lab có các lane CI chuyên dụng nằm ngoài quy trình chính có phạm vi thông minh. Tính tương đương theo tác nhân được lồng trong các bộ khung QA rộng và bản phát hành, không phải một quy trình PR độc lập. Sử dụng `Full Release Validation` cùng `rerun_group=qa-parity` khi tính tương đương cần đi cùng một lượt xác thực rộng.

- Quy trình `QA-Lab - All Lanes` chạy hằng đêm trên `main` và khi điều phối thủ công; nó phân nhánh các job tính tương đương mô phỏng cùng các job trực tiếp Matrix, Telegram, Discord, WhatsApp và Slack. Các job trực tiếp sử dụng môi trường `qa-live-shared`; Telegram, Discord, WhatsApp và Slack sử dụng hợp đồng thuê Convex, còn Matrix cấp thông tin xác thực cục bộ dùng một lần.

Kiểm tra bản phát hành chạy các lane truyền tải trực tiếp Matrix và Telegram với nhà cung cấp mô phỏng xác định và các mô hình đủ điều kiện mô phỏng (`mock-openai/gpt-5.6-luna` và `mock-openai/gpt-5.6-luna-alt`) để hợp đồng kênh được cô lập khỏi độ trễ mô hình trực tiếp và quá trình khởi động Plugin nhà cung cấp thông thường. Gateway truyền tải trực tiếp tắt tìm kiếm bộ nhớ vì tính tương đương QA kiểm tra riêng hành vi bộ nhớ; khả năng kết nối nhà cung cấp được kiểm tra bởi các bộ mô hình trực tiếp, nhà cung cấp gốc và nhà cung cấp Docker riêng biệt.

Các cổng Matrix theo lịch và bản phát hành sử dụng máy chủ bộ QA Lab dùng chung cùng adapter trực tiếp với các kịch bản bản phát hành. Giá trị mặc định CLI và đầu vào quy trình thủ công vẫn là `all`; các lượt điều phối `all` thủ công phân nhánh các hồ sơ `transport`, `media`, `e2ee-smoke`, `e2ee-deep` và `e2ee-cli` để bằng chứng gồm 93 kịch bản nằm trong thời gian chờ của mỗi job. Các lượt điều phối thủ công có mục tiêu chọn `fast`, `release` hoặc `transport` trong một job.

`OpenClaw Release Checks` cũng chạy các lane QA Lab quan trọng với bản phát hành trước khi phê duyệt bản phát hành; cổng tính tương đương QA của nó chạy các gói ứng viên và baseline dưới dạng các job lane song song, sau đó tải xuống cả hai artifact vào một job báo cáo nhỏ để so sánh tính tương đương cuối cùng.

Đối với các PR thông thường, hãy dựa vào bằng chứng CI/kiểm tra theo phạm vi thay vì coi tính tương đương là trạng thái bắt buộc.

## CodeQL

Quy trình `CodeQL` được chủ đích thiết kế làm trình quét bảo mật bước đầu có phạm vi hẹp, không phải lượt quét toàn bộ kho lưu trữ. Các lượt chạy hằng ngày, thủ công, lượt đẩy `main` và lượt bảo vệ pull request không phải bản nháp quét mã quy trình Actions cùng các bề mặt JavaScript/TypeScript có rủi ro cao nhất bằng truy vấn bảo mật độ tin cậy cao được lọc theo `security-severity` cao/nghiêm trọng.

Bộ bảo vệ pull request vẫn gọn nhẹ: nó chỉ khởi chạy cho các thay đổi trong `.github/actions`, `.github/codeql`, `.github/workflows`, `packages`, `scripts`, `src`, hoặc các đường dẫn runtime của plugin đi kèm sở hữu tiến trình, và chạy cùng ma trận bảo mật có độ tin cậy cao như quy trình làm việc theo lịch. CodeQL cho Android và macOS không nằm trong cấu hình mặc định của PR.

### Các danh mục bảo mật

| Danh mục                                          | Bề mặt                                                                                                                             |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Đường cơ sở về xác thực, bí mật, sandbox, cron và Gateway                                                                                  |
| `/codeql-security-high/channel-runtime-boundary`  | Các hợp đồng triển khai kênh lõi cùng runtime plugin kênh, Gateway, Plugin SDK, bí mật và các điểm tiếp xúc kiểm tra              |
| `/codeql-security-high/network-ssrf-boundary`     | Các bề mặt chính sách SSRF của lõi, phân tích IP, bộ bảo vệ mạng, tìm nạp web và Plugin SDK                                                |
| `/codeql-security-high/mcp-process-tool-boundary` | Máy chủ MCP, trình trợ giúp thực thi tiến trình, phân phối đi và các cổng thực thi công cụ của tác tử                                           |
| `/codeql-security-high/process-exec-boundary`     | Shell cục bộ, trình trợ giúp tạo tiến trình, runtime plugin đi kèm sở hữu tiến trình và mã kết nối tập lệnh quy trình làm việc                             |
| `/codeql-security-high/plugin-trust-boundary`     | Các bề mặt tin cậy của hợp đồng gói Plugin SDK và quá trình cài đặt, trình tải, manifest, registry, cài đặt bằng trình quản lý gói, tải nguồn của plugin |

### Các phân đoạn bảo mật dành riêng cho nền tảng

- `CodeQL Android Critical Security` — phân đoạn bảo mật Android theo lịch. Xây dựng ứng dụng Android theo cách thủ công cho CodeQL trên runner Linux Blacksmith nhỏ nhất được kiểm tra tính hợp lệ của quy trình làm việc chấp nhận. Tải lên dưới `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — phân đoạn bảo mật macOS chạy hằng tuần/thủ công. Xây dựng ứng dụng macOS theo cách thủ công cho CodeQL trên Blacksmith macOS, lọc kết quả xây dựng phần phụ thuộc khỏi SARIF được tải lên và tải lên dưới `/codeql-critical-security/macos`. Được giữ ngoài cấu hình mặc định hằng ngày vì quá trình xây dựng macOS chi phối thời gian chạy ngay cả khi không có vấn đề.

### Các danh mục Chất lượng Quan trọng

`CodeQL Critical Quality` là phân đoạn phi bảo mật tương ứng. Nó chỉ chạy các truy vấn chất lượng JavaScript/TypeScript phi bảo mật ở mức độ nghiêm trọng lỗi trên các bề mặt hẹp có giá trị cao bằng runner Linux do GitHub lưu trữ, để các lượt quét chất lượng không tiêu tốn ngân sách đăng ký runner Blacksmith. Bộ bảo vệ pull request của nó được chủ đích thu hẹp hơn hồ sơ theo lịch: các PR không phải bản nháp chỉ chạy những phân đoạn tương ứng với các bề mặt mà chúng tác động, trong số mười ba phân đoạn có thể định tuyến cho PR — `agent-runtime-boundary`, `channel-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `gateway-runtime-boundary`, `mcp-process-runtime-boundary`, `memory-runtime-boundary`, `network-runtime-boundary`, `plugin-boundary`, `plugin-sdk-package-contract`, `plugin-sdk-reply-runtime`, `provider-runtime-boundary` và `session-diagnostics-boundary`. `ui-control-plane` và `web-media-runtime-boundary` không được chạy trong PR. Các thay đổi đối với cấu hình CodeQL và quy trình làm việc chất lượng sẽ chạy toàn bộ tập phân đoạn PR (các khóa của phân đoạn runtime mạng dựa trên các tệp cấu hình CodeQL riêng và các đường dẫn nguồn sở hữu mạng).

Điều phối thủ công chấp nhận:

```text
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|network-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Các hồ sơ hẹp là những điểm nối phục vụ hướng dẫn/lặp lại để chạy riêng biệt một phân đoạn chất lượng.

| Danh mục                                                | Bề mặt                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Mã ranh giới bảo mật cho xác thực, bí mật, sandbox, cron và Gateway                                                                                                  |
| `/codeql-critical-quality/config-boundary`              | Các hợp đồng lược đồ cấu hình, di chuyển, chuẩn hóa và IO                                                                                                         |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Các lược đồ giao thức Gateway và hợp đồng phương thức máy chủ                                                                                                              |
| `/codeql-critical-quality/channel-runtime-boundary`     | Các hợp đồng triển khai plugin kênh lõi và plugin kênh đi kèm                                                                                                  |
| `/codeql-critical-quality/agent-runtime-boundary`       | Các hợp đồng runtime về thực thi lệnh, điều phối mô hình/nhà cung cấp, điều phối và hàng đợi tự động trả lời, cùng mặt phẳng điều khiển ACP                                               |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Máy chủ MCP và cầu nối công cụ, trình trợ giúp giám sát tiến trình và hợp đồng phân phối đi                                                                        |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK máy chủ bộ nhớ, facade runtime bộ nhớ, bí danh Plugin SDK cho bộ nhớ, mã kết nối kích hoạt runtime bộ nhớ và các lệnh doctor cho bộ nhớ                                    |
| `/codeql-critical-quality/network-runtime-boundary`     | Gói chính sách mạng, runtime socket thô và thu thập proxy, đường hầm SSH, khóa Gateway, socket JSONL và các bề mặt truyền tải đẩy                                 |
| `/codeql-critical-quality/session-diagnostics-boundary` | Thành phần nội bộ của hàng đợi trả lời, hàng đợi phân phối phiên, trình trợ giúp liên kết/phân phối phiên đi, các bề mặt gói sự kiện/nhật ký chẩn đoán và hợp đồng CLI doctor cho phiên |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Điều phối trả lời đến của Plugin SDK, trình trợ giúp tải trọng/phân đoạn/runtime trả lời, tùy chọn trả lời kênh, hàng đợi phân phối và trình trợ giúp liên kết phiên/luồng             |
| `/codeql-critical-quality/provider-runtime-boundary`    | Chuẩn hóa danh mục mô hình, xác thực và khám phá nhà cung cấp, đăng ký runtime nhà cung cấp, giá trị mặc định/danh mục nhà cung cấp và các registry web/tìm kiếm/tìm nạp/embedding    |
| `/codeql-critical-quality/ui-control-plane`             | Khởi động Control UI, lưu trữ cục bộ, luồng điều khiển Gateway và hợp đồng runtime mặt phẳng điều khiển tác vụ                                                          |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Tìm nạp/tìm kiếm web lõi, IO phương tiện, hiểu phương tiện, tạo hình ảnh và hợp đồng runtime tạo phương tiện                                                    |
| `/codeql-critical-quality/plugin-boundary`              | Hợp đồng điểm vào của trình tải, registry, bề mặt công khai và Plugin SDK                                                                                             |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Nguồn Plugin SDK phía gói đã phát hành và trình trợ giúp hợp đồng gói plugin                                                                                      |

Chất lượng được tách biệt với bảo mật để các phát hiện về chất lượng có thể được lên lịch, đo lường, vô hiệu hóa hoặc mở rộng mà không làm lu mờ tín hiệu bảo mật. Việc mở rộng CodeQL cho Swift, Python và plugin đi kèm chỉ nên được bổ sung lại dưới dạng công việc tiếp nối có phạm vi hoặc được phân đoạn sau khi các hồ sơ hẹp có thời gian chạy và tín hiệu ổn định.

## Quy trình làm việc bảo trì

### Tác tử Tài liệu

Quy trình làm việc `Docs Agent` là một luồng bảo trì Codex theo sự kiện nhằm giữ cho tài liệu hiện có đồng bộ với các thay đổi mới được hợp nhất. Nó không có lịch chạy thuần túy: một lần chạy CI đẩy mã thành công không phải của bot trên `main` có thể kích hoạt nó, và điều phối thủ công có thể chạy trực tiếp. Các lần gọi từ quy trình làm việc sẽ bỏ qua khi `main` đã tiến lên hoặc khi một lần chạy Tác tử Tài liệu không bị bỏ qua khác được tạo trong vòng một giờ qua. Khi chạy, nó xem xét phạm vi commit từ SHA nguồn của Tác tử Tài liệu không bị bỏ qua trước đó đến `main` hiện tại, vì vậy một lần chạy mỗi giờ có thể bao quát mọi thay đổi trên nhánh chính đã tích lũy kể từ lượt xử lý tài liệu gần nhất.

### Tác tử Hiệu năng Kiểm thử

Quy trình làm việc `Test Performance Agent` là một luồng bảo trì Codex theo sự kiện dành cho các kiểm thử chậm. Nó không có lịch chạy thuần túy: một lần chạy CI đẩy mã thành công không phải của bot trên `main` có thể kích hoạt nó, nhưng nó sẽ bỏ qua nếu một lần gọi khác từ quy trình làm việc đã chạy hoặc đang chạy trong ngày UTC đó. Điều phối thủ công bỏ qua cổng hoạt động hằng ngày này. Luồng này xây dựng một báo cáo hiệu năng Vitest toàn bộ bộ kiểm thử được nhóm, chỉ cho phép Codex thực hiện các bản sửa hiệu năng kiểm thử nhỏ vẫn bảo toàn độ bao phủ thay vì tái cấu trúc trên diện rộng, sau đó chạy lại báo cáo toàn bộ bộ kiểm thử và từ chối các thay đổi làm giảm số lượng kiểm thử đạt trong đường cơ sở. Báo cáo được nhóm ghi lại thời gian thực tế theo từng cấu hình và RSS tối đa trên Linux và macOS, để phép so sánh trước/sau hiển thị chênh lệch bộ nhớ kiểm thử bên cạnh chênh lệch thời lượng. Nếu đường cơ sở có kiểm thử thất bại, Codex chỉ có thể sửa các lỗi hiển nhiên và báo cáo toàn bộ bộ kiểm thử sau khi tác tử xử lý phải đạt trước khi bất kỳ nội dung nào được commit. Khi `main` tiến lên trước khi lượt đẩy của bot được hợp nhất, luồng sẽ rebase bản vá đã xác thực, chạy lại `pnpm check:changed` và thử đẩy lại; các bản vá cũ xung đột sẽ bị bỏ qua. Nó sử dụng Ubuntu do GitHub lưu trữ để tác vụ Codex có thể duy trì cùng cơ chế an toàn loại bỏ sudo như tác tử tài liệu.

### Các PR Trùng lặp Sau khi Hợp nhất

Quy trình làm việc `Duplicate PRs After Merge` là một quy trình làm việc thủ công dành cho người bảo trì để dọn dẹp các bản trùng lặp sau khi hợp nhất. Theo mặc định, nó chạy thử và chỉ đóng các PR được liệt kê rõ ràng khi `apply=true`. Trước khi thay đổi GitHub, nó xác minh rằng PR đã được hợp nhất và mỗi bản trùng lặp có một issue được tham chiếu chung hoặc các đoạn thay đổi chồng lấn.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Các cổng kiểm tra cục bộ và định tuyến thay đổi

Logic làn thay đổi cục bộ nằm trong `scripts/changed-lanes.mjs` và được thực thi bởi `scripts/check-changed.mjs`. Cổng kiểm tra cục bộ đó nghiêm ngặt hơn về ranh giới kiến trúc so với phạm vi nền tảng CI rộng:

- các thay đổi mã sản xuất lõi chạy kiểm tra kiểu mã sản xuất lõi và kiểm tra lõi cùng lint/bộ bảo vệ lõi;
- các thay đổi chỉ dành cho kiểm thử lõi chỉ chạy kiểm tra kiểu kiểm thử lõi cùng lint lõi;
- các thay đổi mã sản xuất phần mở rộng chạy kiểm tra kiểu mã sản xuất phần mở rộng và kiểm tra phần mở rộng cùng lint phần mở rộng;
- các thay đổi chỉ dành cho kiểm thử phần mở rộng chạy kiểm tra kiểu kiểm thử phần mở rộng cùng lint phần mở rộng;
- các thay đổi đối với Plugin SDK công khai hoặc hợp đồng plugin mở rộng sang kiểm tra kiểu phần mở rộng vì các phần mở rộng phụ thuộc vào các hợp đồng lõi đó (các lượt quét phần mở rộng bằng Vitest vẫn là công việc kiểm thử riêng);
- các lần tăng phiên bản chỉ liên quan đến siêu dữ liệu phát hành chạy các kiểm tra phiên bản/cấu hình/phần phụ thuộc gốc có mục tiêu;
- các thay đổi gốc/cấu hình không xác định sẽ chuyển sang chế độ an toàn bằng cách chạy tất cả làn kiểm tra.

Định tuyến kiểm thử thay đổi cục bộ nằm trong `scripts/test-projects.test-support.mjs` và được chủ đích thiết kế rẻ hơn `check:changed`: các chỉnh sửa kiểm thử trực tiếp tự chạy chính chúng, các chỉnh sửa nguồn ưu tiên ánh xạ rõ ràng, sau đó là kiểm thử cùng cấp và các thành phần phụ thuộc trong đồ thị import. Cấu hình phân phối phòng nhóm dùng chung là một trong các ánh xạ rõ ràng: các thay đổi đối với cấu hình trả lời hiển thị trong nhóm, chế độ phân phối trả lời nguồn hoặc prompt hệ thống của công cụ tin nhắn được định tuyến qua các kiểm thử trả lời lõi cùng các kiểm thử hồi quy phân phối Discord và Slack, để thay đổi giá trị mặc định dùng chung thất bại trước lần đẩy PR đầu tiên. Chỉ sử dụng `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` khi thay đổi có phạm vi toàn bộ harness đến mức tập ánh xạ chi phí thấp không còn là đại diện đáng tin cậy.

## Xác thực Testbox

Crabbox là trình bao bọc máy từ xa thuộc sở hữu của repo dùng cho việc kiểm chứng trên Linux của người bảo trì. Các phiên tác tử chỉ giữ một/vài bài kiểm thử trọng tâm và các phép kiểm tra tĩnh ít tốn tài nguyên ở máy cục bộ đối với
nguồn đáng tin cậy khi bản cài đặt phần phụ thuộc hiện có đã sẵn sàng. Chúng sử dụng Crabbox cho các bộ kiểm thử lớn hơn và
công việc đòi hỏi nhiều tài nguyên tính toán, bao gồm build, kiểm tra kiểu, phân tán lint,
Docker, các luồng gói, E2E, kiểm chứng trực tiếp và tính tương đương với CI. Hoạt động kiểm chứng nặng của người bảo trì đáng tin cậy
mặc định dùng `blacksmith-testbox`, và `.crabbox.yaml` hiện cũng mặc định dùng nó. Workflow đã cấu hình của nó
nạp thông tin xác thực của nhà cung cấp và tác tử, vì vậy mã từ người đóng góp hoặc
fork không đáng tin cậy phải dùng CI fork không có secret hoặc Crabbox AWS trực tiếp đã được làm sạch.
Các lượt chạy AWS đã làm sạch đặt `CRABBOX_ENV_ALLOW=CI`, truyền
`--no-hydrate` và sử dụng một `HOME` từ xa tạm thời mới; điều này ngăn danh sách cho phép
`OPENCLAW_*` của repo và các hồ sơ xác thực hiện có tiếp cận mã không đáng tin cậy.
Chúng sử dụng một lease vừa được khởi động dành riêng cho nguồn không đáng tin cậy đó, tuyệt đối không dùng
lease đáng tin cậy hoặc đã từng được nạp thông tin xác thực. Khởi chạy tệp nhị phân Crabbox đáng tin cậy đã cài đặt
từ một checkout `main` sạch và đáng tin cậy, đồng thời chỉ tìm nạp PR từ xa bằng
`--fresh-pr`; tuyệt đối không thực thi trình bao bọc hoặc cấu hình của checkout không đáng tin cậy ở máy cục bộ.
Bỏ đặt `CRABBOX_AWS_INSTANCE_PROFILE` và đóng khi lỗi trừ khi
`aws.instanceProfile` sau khi phân giải là rỗng. Trước mọi thao tác cài đặt/kiểm thử, hãy dùng
các công cụ đường dẫn tuyệt đối đáng tin cậy để yêu cầu token IMDSv2, chứng minh điểm cuối
thông tin xác thực IAM trả về 404 và so sánh `git rev-parse HEAD` từ xa với SHA đầu PR đầy đủ
đã được review. Ràng buộc lease với SHA đó và dừng/khởi động lại khi đầu thay đổi.
Tải `scripts/crabbox-untrusted-bootstrap.sh` đáng tin cậy lên từ `main` sạch
cùng với `--fresh-pr`; tệp này cài đặt Node/pnpm được ghim, xác minh SHA và
mốc ghim trình quản lý gói, cô lập `HOME`, cài đặt các phần phụ thuộc, rồi thực thi
bài kiểm thử được yêu cầu.
Bỏ đặt mọi giá trị ghi đè `CRABBOX_TAILSCALE*`, bắt buộc dùng `--network public
--tailscale=false`, xóa các cờ nút thoát/LAN và yêu cầu `crabbox inspect`
báo cáo mạng công cộng không có trạng thái Tailscale trước khi tải bất kỳ tập lệnh nào lên.
Dung lượng AWS/Hetzner thuộc sở hữu cũng vẫn là phương án dự phòng khi Blacksmith gặp sự cố,
có vấn đề về hạn ngạch hoặc khi kiểm thử dung lượng thuộc sở hữu được yêu cầu rõ ràng.

Các tác tử không khởi động trước cho công việc dự kiến. Chỉ nhận một Testbox khi
lệnh nặng đầu tiên đã sẵn sàng, tái sử dụng id `tbx_...` được trả về cho các lệnh nặng
sau đó, đồng bộ checkout hiện tại trong mỗi lượt chạy và dừng nó trước khi bàn giao.

Các lượt chạy Blacksmith dựa trên Crabbox khởi động, nhận, đồng bộ, chạy, báo cáo và dọn dẹp
các Testbox dùng một lần. Phép kiểm tra tính hợp lệ của đồng bộ tích hợp sẵn sẽ dừng sớm khi
`git status --short` trên máy đã đồng bộ hiển thị ít nhất 200 tệp được theo dõi bị xóa,
nhờ đó phát hiện các tệp gốc biến mất như `pnpm-lock.yaml`. Đối với các PR
cố ý xóa nhiều tệp, hãy đặt `CRABBOX_ALLOW_MASS_DELETIONS=1` cho lệnh từ xa.

Crabbox cũng chấm dứt một lượt gọi Blacksmith CLI cục bộ nếu lượt gọi đó vẫn ở
giai đoạn đồng bộ quá năm phút mà không có đầu ra sau đồng bộ. Đặt
`CRABBOX_BLACKSMITH_SYNC_TIMEOUT_MS=0` để tắt biện pháp bảo vệ đó hoặc dùng giá trị mili giây lớn hơn
cho các diff cục bộ lớn bất thường.

Trước lượt chạy đầu tiên, hãy kiểm tra trình bao bọc từ thư mục gốc của repo:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

Trình bao bọc của repo từ chối tệp nhị phân Crabbox lỗi thời không công bố nhà cung cấp đã chọn, và các lượt chạy dựa trên Blacksmith yêu cầu Crabbox 0.22.0 trở lên để trình bao bọc nhận được hành vi đồng bộ, hàng đợi và dọn dẹp Testbox hiện tại. Trong các worktree Codex hoặc checkout được liên kết/thưa, tránh tập lệnh `pnpm crabbox:run` cục bộ vì pnpm có thể đối soát các phần phụ thuộc trước khi Crabbox khởi động; thay vào đó, hãy gọi trực tiếp trình bao bọc node:

```bash
node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox --timing-json --shell -- "pnpm test <path-or-filter>"
```

Khi sử dụng checkout cùng cấp, hãy build lại tệp nhị phân cục bộ bị bỏ qua trước công việc đo thời gian hoặc kiểm chứng:

```bash
version="$(git -C ../crabbox describe --tags --always --dirty | sed 's/^v//')" \
  && go build -C ../crabbox -trimpath -ldflags "-s -w -X github.com/openclaw/crabbox/internal/cli.version=${version}" -o bin/crabbox ./cmd/crabbox
```

Khối `blacksmith:` trong `.crabbox.yaml` đã ghim sẵn các giá trị mặc định cho tổ chức, workflow, job và ref, vì vậy các cờ tường minh dưới đây là tùy chọn. Cổng kiểm tra thay đổi:

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

Chạy lại bài kiểm thử trọng tâm trên Testbox khi các phần phụ thuộc cục bộ không khả dụng hoặc
mục tiêu phân tán:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox \
  --idle-timeout 90m \
  --ttl 240m \
  --timing-json \
  --shell -- \
  "corepack pnpm test <path-or-filter>"
```

Toàn bộ bộ kiểm thử:

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
Blacksmith Testbox được ủy quyền, mã thoát của trình bao bọc Crabbox và bản tóm tắt JSON là
kết quả lệnh. Lượt chạy GitHub Actions được liên kết sở hữu việc nạp thông tin xác thực và duy trì hoạt động; lượt chạy này
có thể kết thúc ở trạng thái `cancelled` khi Testbox bị dừng từ bên ngoài sau khi lệnh SSH
đã trả về. Hãy coi đó là một hiện tượng của quá trình dọn dẹp/trạng thái, trừ khi
`exitCode` của trình bao bọc khác 0 hoặc đầu ra lệnh cho thấy bài kiểm thử thất bại.
Các lượt chạy Crabbox dùng một lần dựa trên Blacksmith phải tự động dừng Testbox;
nếu một lượt chạy bị gián đoạn hoặc việc dọn dẹp không rõ ràng, hãy kiểm tra các máy đang hoạt động và chỉ dừng
những máy bạn đã tạo:

```bash
blacksmith testbox list --all
blacksmith testbox status --id <tbx_id>
blacksmith testbox stop --id <tbx_id>
```

Chỉ tái sử dụng khi bạn chủ ý cần nhiều lệnh trên cùng một máy đã được nạp thông tin xác thực:

```bash
node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox --id <tbx_id> --timing-json --shell -- "corepack pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

Tái sử dụng lease, không tái sử dụng mã nguồn lỗi thời. Bỏ `--no-sync` để mỗi lượt chạy tải
checkout hiện tại lên; chỉ dùng nó để chủ ý chạy lại một cây không thay đổi và đã được đồng bộ.
Mã của người đóng góp/fork không đáng tin cậy phải dùng
`CRABBOX_ENV_ALLOW=CI`, `--provider aws --no-hydrate` và một
`HOME` từ xa tạm thời mới cho mỗi lệnh; cài đặt các phần phụ thuộc bên trong
lệnh đã làm sạch đó trước khi kiểm thử. Chỉ tái sử dụng lease vừa được khởi động dành riêng cho
cùng nguồn không đáng tin cậy; tuyệt đối không dùng lease đáng tin cậy hoặc đã từng được nạp thông tin xác thực. Tuyệt đối không
thực thi trình bao bọc hoặc cấu hình của checkout không đáng tin cậy ở máy cục bộ: hãy khởi chạy tệp nhị phân
Crabbox đáng tin cậy đã cài đặt từ `main` sạch, đáng tin cậy và truyền `--fresh-pr` trong mọi
lượt chạy. Giữ `CRABBOX_AWS_INSTANCE_PROFILE` ở trạng thái chưa đặt, từ chối hồ sơ
phiên bản đã phân giải không rỗng, yêu cầu bằng chứng IMDS từ xa đáng tin cậy rằng không có vai trò và xác minh
SHA đầu đã được review trước khi cài đặt/kiểm thử. Ràng buộc lease với SHA đó; dừng và
khởi động lại sau mọi thay đổi đầu. Nếu không có PR từ xa, hãy dùng CI fork không có secret.
Tuyệt đối không chọn `hydrate-github` hoặc workflow Blacksmith được nạp thông tin xác thực
cho nguồn không đáng tin cậy.

Nếu Crabbox là lớp bị hỏng nhưng bản thân Blacksmith vẫn hoạt động, chỉ dùng
Blacksmith trực tiếp cho hoạt động chẩn đoán như `list`, `status` và dọn dẹp. Hãy sửa
đường dẫn Crabbox trước khi coi một lượt chạy Blacksmith trực tiếp là bằng chứng của người bảo trì.

Nếu `blacksmith testbox list --all` và `blacksmith testbox status` hoạt động nhưng các lượt
khởi động mới nằm ở trạng thái `queued` mà không có IP hoặc URL lượt chạy Actions sau vài phút,
hãy coi đây là áp lực từ nhà cung cấp Blacksmith, hàng đợi, thanh toán hoặc giới hạn tổ chức. Dừng các
id trong hàng đợi mà bạn đã tạo, tránh khởi động thêm Testbox và chuyển hoạt động kiểm chứng sang
đường dẫn dung lượng Crabbox thuộc sở hữu bên dưới trong khi có người kiểm tra bảng điều khiển Blacksmith,
thanh toán và các giới hạn tổ chức.

Chỉ chuyển sang dung lượng Crabbox thuộc sở hữu khi Blacksmith ngừng hoạt động, bị giới hạn hạn ngạch, thiếu môi trường cần thiết hoặc khi mục tiêu rõ ràng là dung lượng thuộc sở hữu:

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --provider aws --id <cbx_id-or-slug>
pnpm crabbox:run -- --provider aws --id <cbx_id-or-slug> --timing-json --shell -- "pnpm check:changed"
pnpm crabbox:stop -- --provider aws <cbx_id-or-slug>
```

Khi AWS chịu áp lực, tránh `class=beast` trừ khi tác vụ thực sự cần CPU hạng 48xlarge. Một yêu cầu `beast` bắt đầu ở 192 vCPU và là cách dễ nhất để chạm hạn ngạch EC2 Spot hoặc On-Demand Standard theo khu vực. `.crabbox.yaml` thuộc sở hữu của repo mặc định dùng `class: standard`, thị trường theo nhu cầu và `capacity.hints: true` để các lease AWS qua broker in ra khu vực/thị trường đã chọn, áp lực hạn ngạch, phương án dự phòng Spot và cảnh báo lớp có áp lực cao. Dùng `fast` cho các phép kiểm tra rộng nặng hơn, chỉ dùng `large` sau khi standard/fast không đủ và chỉ dùng `beast` cho các luồng đặc biệt bị giới hạn bởi CPU như ma trận Docker toàn bộ bộ kiểm thử hoặc tất cả plugin, xác thực bản phát hành/trình chặn rõ ràng hoặc phân tích hiệu năng nhiều lõi. Không dùng `beast` cho `pnpm check:changed`, các bài kiểm thử trọng tâm, công việc chỉ liên quan đến tài liệu, lint/kiểm tra kiểu thông thường, các ca tái hiện E2E nhỏ hoặc phân loại sự cố Blacksmith. Dùng `--market on-demand` để chẩn đoán dung lượng nhằm tránh làm nhiễu tín hiệu bởi biến động thị trường Spot.

`.crabbox.yaml` sở hữu các giá trị mặc định cho nhà cung cấp, đồng bộ và nạp thông tin xác thực GitHub Actions. Đồng bộ Crabbox không bao giờ truyền `.git`, vì vậy checkout Actions đã được nạp thông tin xác thực giữ siêu dữ liệu Git từ xa của riêng nó thay vì đồng bộ các remote và kho đối tượng cục bộ của người bảo trì, đồng thời cấu hình repo cũng loại trừ các tạo phẩm runtime/build cục bộ (chẳng hạn như `.artifacts` và báo cáo kiểm thử) tuyệt đối không được truyền. `.github/workflows/crabbox-hydrate.yml` sở hữu checkout, thiết lập Node/pnpm, thao tác tìm nạp `origin/main` và việc chuyển giao môi trường không chứa secret cho các lệnh `crabbox run --id <cbx_id>` trên đám mây thuộc sở hữu.

## Liên quan

- [Tổng quan về cài đặt](/vi/install)
- [Các kênh phát triển](/vi/install/development-channels)
