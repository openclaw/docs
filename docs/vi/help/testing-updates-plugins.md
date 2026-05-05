---
read_when:
    - Thay đổi hành vi cập nhật, doctor, chấp nhận gói hoặc cài đặt Plugin của OpenClaw
    - Chuẩn bị hoặc phê duyệt một bản ứng viên phát hành
    - Gỡ lỗi các hồi quy khi cập nhật gói, dọn dẹp phụ thuộc Plugin hoặc cài đặt Plugin
sidebarTitle: Update and plugin tests
summary: Cách OpenClaw xác thực các lộ trình cập nhật, quá trình chuyển đổi gói và hành vi cài đặt/cập nhật Plugin
title: 'Kiểm thử: các bản cập nhật và Plugin'
x-i18n:
    generated_at: "2026-05-05T06:17:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 19ae526d3daa8a1b67cb2f74225138b3e1fa192c9f956c9dd6d0e407581b9ed9
    source_path: help/testing-updates-plugins.md
    workflow: 16
---

Đây là checklist chuyên biệt cho xác thực cập nhật và Plugin. Mục tiêu rất
đơn giản: chứng minh gói có thể cài đặt có thể cập nhật trạng thái người dùng
thực, sửa chữa trạng thái kế thừa đã cũ thông qua `doctor`, và vẫn cài đặt,
tải, cập nhật và gỡ cài đặt Plugin từ các nguồn được hỗ trợ.

Để xem bản đồ trình chạy kiểm thử rộng hơn, xem [Kiểm thử](/vi/help/testing). Để
biết khóa nhà cung cấp trực tiếp và các bộ kiểm thử chạm mạng, xem [Kiểm thử
trực tiếp](/vi/help/testing-live).

## Những gì chúng ta bảo vệ

Các kiểm thử cập nhật và Plugin bảo vệ các hợp đồng sau:

- Một tarball gói hoàn chỉnh, có `dist/postinstall-inventory.json` hợp lệ,
  và không phụ thuộc vào các tệp repo chưa được đóng gói.
- Người dùng có thể chuyển từ một gói đã phát hành cũ hơn sang gói ứng viên
  mà không mất cấu hình, tác nhân, phiên, workspace, danh sách cho phép Plugin
  hoặc cấu hình kênh.
- `openclaw doctor --fix --non-interactive` sở hữu các đường dẫn dọn dẹp và sửa
  chữa kế thừa. Khởi động không nên phát sinh các migration tương thích ẩn cho
  trạng thái Plugin đã cũ.
- Cài đặt Plugin hoạt động từ thư mục cục bộ, repo git, gói npm và đường dẫn
  registry ClawHub.
- Phụ thuộc npm của Plugin được cài đặt trong npm root được quản lý, được quét
  trước khi tin cậy, và được gỡ bỏ thông qua npm trong quá trình gỡ cài đặt để
  các phụ thuộc đã hoist không còn sót lại.
- Cập nhật Plugin ổn định khi không có gì thay đổi: bản ghi cài đặt, nguồn đã
  phân giải, bố cục phụ thuộc đã cài đặt và trạng thái đã bật vẫn nguyên vẹn.

## Bằng chứng cục bộ trong quá trình phát triển

Bắt đầu hẹp:

```bash
pnpm changed:lanes --json
pnpm check:changed
pnpm test:changed
```

Đối với thay đổi về cài đặt Plugin, gỡ cài đặt, phụ thuộc hoặc inventory gói,
cũng chạy các kiểm thử tập trung bao phủ đường nối đã chỉnh sửa:

```bash
pnpm test src/plugins/uninstall.test.ts src/infra/package-dist-inventory.test.ts test/scripts/package-acceptance-workflow.test.ts
```

Trước khi bất kỳ lane Docker gói nào tiêu thụ tarball, hãy chứng minh artifact
gói:

```bash
pnpm release:check
```

`release:check` chạy kiểm tra drift cấu hình/tài liệu/API, ghi inventory dist
của gói, chạy `npm pack --dry-run`, từ chối các tệp bị cấm trong gói đã đóng,
cài tarball vào một prefix tạm, chạy postinstall, và smoke các entrypoint kênh
được đóng gói.

## Các lane Docker

Các lane Docker là bằng chứng cấp sản phẩm. Chúng cài đặt hoặc cập nhật một gói
thực bên trong container Linux và xác nhận hành vi thông qua lệnh CLI, khởi động
Gateway, probe HTTP, trạng thái RPC và trạng thái hệ thống tệp.

Dùng các lane tập trung trong khi lặp:

```bash
pnpm test:docker:plugins
pnpm test:docker:plugin-lifecycle-matrix
pnpm test:docker:plugin-update
pnpm test:docker:upgrade-survivor
pnpm test:docker:published-upgrade-survivor
pnpm test:docker:update-restart-auth
pnpm test:docker:update-migration
```

Các lane quan trọng:

- `test:docker:plugins` xác thực smoke cài đặt Plugin, cài đặt thư mục cục bộ,
  hành vi bỏ qua cập nhật thư mục cục bộ, thư mục cục bộ có phụ thuộc đã cài
  sẵn, cài đặt gói `file:`, cài đặt git với thực thi CLI, cập nhật git
  moving-ref, cài đặt npm registry với phụ thuộc bắc cầu đã hoist, cập nhật npm
  không thao tác, cài đặt fixture ClawHub cục bộ và cập nhật không thao tác,
  hành vi cập nhật marketplace, và bật/kiểm tra gói Claude. Đặt
  `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` để giữ khối ClawHub kín/offline.
- `test:docker:plugin-lifecycle-matrix` cài gói ứng viên trong container trống,
  chạy một Plugin npm qua cài đặt, kiểm tra, tắt, bật, nâng cấp rõ ràng, hạ cấp
  rõ ràng, và gỡ cài đặt sau khi xóa mã Plugin. Nó ghi log chỉ số RSS và CPU
  cho từng pha.
- `test:docker:plugin-update` xác thực rằng một Plugin đã cài đặt không đổi
  sẽ không cài lại hoặc mất metadata cài đặt trong `openclaw plugins update`.
- `test:docker:upgrade-survivor` cài tarball ứng viên lên một fixture người dùng
  cũ bẩn, chạy cập nhật gói cộng với doctor không tương tác, sau đó khởi động
  một Gateway loopback và kiểm tra bảo toàn trạng thái.
- `test:docker:published-upgrade-survivor` trước tiên cài một baseline đã phát
  hành, cấu hình nó thông qua recipe `openclaw config set` đã bake, cập nhật
  lên tarball ứng viên, chạy doctor, kiểm tra dọn dẹp kế thừa, khởi động Gateway,
  và probe `/healthz`, `/readyz`, cùng trạng thái RPC.
- `test:docker:update-restart-auth` cài gói ứng viên, khởi động Gateway xác thực
  token được quản lý, bỏ đặt env xác thực Gateway của caller cho
  `openclaw update --yes --json`, và yêu cầu lệnh cập nhật ứng viên khởi động
  lại Gateway trước các probe bình thường.
- `test:docker:update-migration` là lane published-update nặng về dọn dẹp. Nó
  bắt đầu từ trạng thái người dùng kiểu Discord/Telegram đã cấu hình, chạy
  doctor baseline để các phụ thuộc Plugin đã cấu hình có cơ hội hình thành,
  gieo rác phụ thuộc Plugin kế thừa cho một Plugin đóng gói đã cấu hình, cập
  nhật lên tarball ứng viên, và yêu cầu doctor sau cập nhật xóa các root phụ
  thuộc kế thừa.

Các biến thể published-upgrade survivor hữu ích:

```bash
OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@2026.4.23 \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=versioned-runtime-deps \
pnpm test:docker:published-upgrade-survivor

OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@latest \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=bootstrap-persona \
pnpm test:docker:published-upgrade-survivor
```

Các kịch bản có sẵn là `base`, `feishu-channel`, `bootstrap-persona`,
`plugin-deps-cleanup`, `configured-plugin-installs`,
`stale-source-plugin-shadow`, `tilde-log-path` và `versioned-runtime-deps`. Trong các lần chạy tổng hợp,
`OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` mở rộng thành tất cả các
kịch bản có hình dạng giống vấn đề đã báo cáo, bao gồm migration cài đặt Plugin
đã cấu hình.

Migration cập nhật đầy đủ được tách riêng có chủ ý khỏi Full Release CI. Dùng
workflow thủ công `Update Migration` khi câu hỏi phát hành là "mọi bản phát hành
ổn định đã phát hành từ 2026.4.23 trở đi có thể cập nhật lên ứng viên này và
dọn sạch rác phụ thuộc Plugin không?":

```bash
gh workflow run update-migration.yml \
  --ref main \
  -f workflow_ref=main \
  -f package_ref=main \
  -f baselines=all-since-2026.4.23 \
  -f scenarios=plugin-deps-cleanup
```

## Package Acceptance

Package Acceptance là cổng gói gốc GitHub. Nó phân giải một gói ứng viên thành
tarball `package-under-test`, ghi lại phiên bản và SHA-256, rồi chạy các lane
Docker E2E tái sử dụng trên đúng tarball đó. Ref harness workflow tách biệt với
ref nguồn gói, nên logic kiểm thử hiện tại có thể xác thực các bản phát hành
đáng tin cậy cũ hơn.

Nguồn ứng viên:

- `source=npm`: xác thực `openclaw@beta`, `openclaw@latest` hoặc một phiên bản
  đã phát hành chính xác.
- `source=ref`: đóng gói một nhánh, tag hoặc commit đáng tin cậy bằng harness
  hiện tại đã chọn.
- `source=url`: xác thực một tarball HTTPS với `package_sha256` bắt buộc.
- `source=artifact`: tái sử dụng tarball do một lần chạy Actions khác tải lên.

Full Release Validation dùng `source=artifact` theo mặc định, được xây dựng từ
SHA phát hành đã phân giải. Để có bằng chứng sau phát hành, truyền
`package_acceptance_package_spec=openclaw@YYYY.M.D` để cùng ma trận nâng cấp
nhắm vào gói npm đã phát hành thay vào đó.

Các kiểm tra phát hành gọi Package Acceptance với bộ package/update/restart/plugin:

```text
doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update
```

Khi bật release soak, chúng cũng truyền:

```text
published_upgrade_survivor_baselines=last-stable-4 2026.4.23 2026.5.2 2026.4.15
published_upgrade_survivor_scenarios=reported-issues
telegram_mode=mock-openai
```

Điều này giữ migration gói, chuyển kênh cập nhật, dọn dẹp phụ thuộc Plugin đã
cũ, bao phủ Plugin offline, hành vi cập nhật Plugin và QA gói Telegram trên cùng
artifact đã phân giải mà không khiến cổng gói phát hành mặc định đi qua mọi bản
phát hành đã công bố.

`last-stable-4` phân giải thành bốn bản phát hành OpenClaw ổn định mới nhất đã
được phát hành lên npm. Release package acceptance ghim `2026.4.23` làm ranh
giới tương thích plugin-update đầu tiên, `2026.5.2` làm ranh giới biến động kiến
trúc Plugin, và `2026.4.15` làm baseline published-update cũ hơn của 2026.4.1x;
resolver khử trùng lặp các pin đã nằm trong bốn bản mới nhất. Để bao phủ
migration cập nhật đã phát hành một cách toàn diện, dùng `all-since-2026.4.23`
trong workflow Update Migration riêng thay vì Full Release CI. `release-history`
vẫn có sẵn để lấy mẫu rộng hơn thủ công khi bạn cũng muốn anchor trước ngày kế
thừa.

Khi chọn nhiều baseline published-upgrade survivor, workflow Docker tái sử dụng
sẽ shard từng baseline vào job runner mục tiêu riêng. Mỗi shard baseline vẫn chạy
bộ kịch bản đã chọn, nhưng log và artifact được giữ theo từng baseline và thời
gian chạy bị chặn bởi shard chậm nhất thay vì một job tuần tự lớn.

Chạy thủ công một profile gói khi xác thực ứng viên trước phát hành:

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=package \
  -f published_upgrade_survivor_baselines="last-stable-4 2026.4.23 2026.5.2 2026.4.15" \
  -f published_upgrade_survivor_scenarios=reported-issues \
  -f telegram_mode=mock-openai
```

Dùng `suite_profile=product` khi câu hỏi phát hành bao gồm kênh MCP, dọn dẹp
cron/subagent, tìm kiếm web OpenAI hoặc OpenWebUI. Chỉ dùng `suite_profile=full`
khi bạn cần bao phủ đầy đủ đường dẫn phát hành Docker.

## Mặc định phát hành

Đối với ứng viên phát hành, stack bằng chứng mặc định là:

1. `pnpm check:changed` và `pnpm test:changed` cho hồi quy cấp nguồn.
2. `pnpm release:check` cho tính toàn vẹn artifact gói.
3. Profile Package Acceptance `package` hoặc các lane gói tùy chỉnh của
   release-check cho hợp đồng install/update/restart/plugin.
4. Kiểm tra phát hành đa hệ điều hành cho trình cài đặt, onboarding và hành vi
   nền tảng theo từng hệ điều hành.
5. Các bộ trực tiếp chỉ khi bề mặt thay đổi chạm tới hành vi nhà cung cấp hoặc
   dịch vụ lưu trữ.

Trên máy maintainer, các cổng rộng và bằng chứng sản phẩm Docker/gói nên chạy
trong Testbox trừ khi đang thực hiện bằng chứng cục bộ rõ ràng.

## Tương thích kế thừa

Độ nới tương thích hẹp và có giới hạn thời gian:

- Các gói đến `2026.4.25`, bao gồm `2026.4.25-beta.*`, có thể dung thứ các
  khoảng trống metadata gói đã phát hành trong Package Acceptance.
- Gói `2026.4.26` đã phát hành có thể cảnh báo về các tệp stamp metadata build
  cục bộ đã được phát hành.
- Các gói sau đó phải thỏa mãn hợp đồng hiện đại. Cùng các khoảng trống đó sẽ
  thất bại thay vì cảnh báo hoặc bỏ qua.

Không thêm migration khởi động mới cho các hình dạng cũ này. Thêm hoặc mở rộng
sửa chữa doctor, rồi chứng minh bằng `upgrade-survivor`,
`published-upgrade-survivor` hoặc `update-restart-auth` khi lệnh cập nhật sở hữu
việc khởi động lại.

## Thêm bao phủ

Khi thay đổi hành vi cập nhật hoặc Plugin, hãy thêm bao phủ ở lớp thấp nhất có
thể thất bại vì đúng lý do:

- Logic đường dẫn hoặc metadata thuần: kiểm thử đơn vị cạnh nguồn.
- Inventory gói hoặc hành vi tệp đã đóng gói: kiểm thử `package-dist-inventory`
  hoặc trình kiểm tra tarball.
- Hành vi cài đặt/cập nhật CLI: assertion hoặc fixture lane Docker.
- Hành vi migration bản phát hành đã công bố: kịch bản `published-upgrade-survivor`.
- Hành vi khởi động lại do cập nhật sở hữu: `update-restart-auth`.
- Hành vi registry/nguồn gói: fixture `test:docker:plugins` hoặc máy chủ fixture
  ClawHub.
- Hành vi bố cục hoặc dọn dẹp phụ thuộc: xác nhận cả thực thi runtime và ranh
  giới hệ thống tệp. Phụ thuộc npm có thể được hoist dưới npm root được quản lý,
  nên kiểm thử cần chứng minh root được quét/dọn thay vì giả định cây
  `node_modules` cục bộ theo gói.

Giữ các fixture Docker mới kín theo mặc định. Dùng registry fixture cục bộ và
gói giả trừ khi mục tiêu của kiểm thử là hành vi registry trực tiếp.

## Phân loại lỗi

Bắt đầu với danh tính artifact:

- Tóm tắt Package Acceptance `resolve_package`: nguồn, phiên bản, SHA-256 và
  tên tạo phẩm.
- Tạo phẩm Docker: `.artifacts/docker-tests/**/summary.json`,
  `failures.json`, nhật ký lane và lệnh chạy lại.
- Tóm tắt nâng cấp còn tồn tại: `.artifacts/upgrade-survivor/summary.json`,
  bao gồm phiên bản baseline, phiên bản ứng viên, kịch bản, thời gian từng pha và
  các bước công thức.

Ưu tiên chạy lại đúng lane đã thất bại với cùng tạo phẩm gói thay vì
chạy lại toàn bộ nhóm phát hành.
