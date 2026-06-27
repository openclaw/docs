---
read_when:
    - Thay đổi hành vi cập nhật, doctor, chấp nhận gói hoặc cài đặt Plugin của OpenClaw
    - Đang chuẩn bị hoặc phê duyệt một bản ứng viên phát hành
    - Gỡ lỗi hồi quy cập nhật gói, dọn dẹp phụ thuộc Plugin hoặc cài đặt Plugin
sidebarTitle: Update and plugin tests
summary: Cách OpenClaw xác thực các lộ trình cập nhật, quá trình di trú gói và hành vi cài đặt/cập nhật Plugin
title: 'Kiểm thử: bản cập nhật và Plugin'
x-i18n:
    generated_at: "2026-06-27T17:36:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9be94eab4be97c53022bdac3110da74a61cfa23db989964c803497305e5415db
    source_path: help/testing-updates-plugins.md
    workflow: 16
---

Đây là danh sách kiểm tra chuyên dụng cho xác thực cập nhật và Plugin. Mục tiêu rất
đơn giản: chứng minh gói có thể cài đặt có thể cập nhật trạng thái người dùng thực, sửa chữa trạng thái
kế thừa đã cũ thông qua `doctor`, và vẫn cài đặt, tải, cập nhật, cũng như gỡ cài đặt
Plugin từ các nguồn được hỗ trợ.

Để xem bản đồ trình chạy kiểm thử rộng hơn, xem [Kiểm thử](/vi/help/testing). Với các khóa
nhà cung cấp trực tiếp và các bộ kiểm thử có chạm mạng, xem [Kiểm thử trực tiếp](/vi/help/testing-live).

## Những gì chúng ta bảo vệ

Các kiểm thử cập nhật và Plugin bảo vệ những hợp đồng này:

- Một tarball gói phải đầy đủ, có `dist/postinstall-inventory.json` hợp lệ,
  và không phụ thuộc vào các tệp repo chưa được đóng gói.
- Người dùng có thể chuyển từ một gói đã phát hành cũ hơn sang gói ứng viên
  mà không mất cấu hình, agent, phiên, không gian làm việc, danh sách cho phép Plugin, hoặc
  cấu hình kênh.
- `openclaw doctor --fix --non-interactive` sở hữu các đường dẫn dọn dẹp và sửa chữa
  kế thừa. Khởi động không nên phát sinh các di chuyển tương thích ẩn cho trạng thái
  Plugin đã cũ.
- Cài đặt Plugin hoạt động từ thư mục cục bộ, repo git, gói npm, và đường dẫn
  registry ClawHub.
- Phụ thuộc npm của Plugin được cài đặt trong một dự án npm được quản lý cho mỗi Plugin,
  được quét trước khi tin cậy, và được xóa thông qua npm trong quá trình gỡ cài đặt để các phụ thuộc
  được hoist không còn sót lại.
- Cập nhật Plugin ổn định khi không có gì thay đổi: bản ghi cài đặt, nguồn đã phân giải,
  bố cục phụ thuộc đã cài đặt, và trạng thái bật vẫn nguyên vẹn.

## Bằng chứng cục bộ trong quá trình phát triển

Bắt đầu hẹp:

```bash
pnpm changed:lanes --json
pnpm check:changed
pnpm test:changed
```

Với thay đổi về cài đặt Plugin, gỡ cài đặt, phụ thuộc, hoặc kiểm kê gói, cũng
chạy các kiểm thử tập trung bao phủ ranh giới đã chỉnh sửa:

```bash
pnpm test src/plugins/uninstall.test.ts src/infra/package-dist-inventory.test.ts test/scripts/package-acceptance-workflow.test.ts
```

Trước khi bất kỳ lane Docker gói nào tiêu thụ một tarball, chứng minh artifact gói:

```bash
pnpm release:check
```

`release:check` chạy kiểm tra trôi lệch cấu hình/tài liệu/API, ghi kiểm kê dist của gói,
chạy `npm pack --dry-run`, từ chối các tệp bị cấm đã đóng gói, cài đặt
tarball vào một prefix tạm, chạy postinstall, và smoke các entrypoint kênh
được đóng gói kèm.

## Các lane Docker

Các lane Docker là bằng chứng cấp sản phẩm. Chúng cài đặt hoặc cập nhật một
gói thực bên trong container Linux và xác nhận hành vi thông qua lệnh CLI,
khởi động Gateway, probe HTTP, trạng thái RPC, và trạng thái hệ thống tệp.

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
  hành vi bỏ qua cập nhật cho thư mục cục bộ, thư mục cục bộ có phụ thuộc
  được cài sẵn, cài đặt gói `file:`, cài đặt git có thực thi CLI, cập nhật
  moving-ref của git, cài đặt registry npm với phụ thuộc bắc cầu được hoist,
  no-op cập nhật npm, từ chối metadata gói npm sai định dạng,
  cài đặt fixture ClawHub cục bộ và no-op cập nhật, hành vi cập nhật marketplace,
  và bật/kiểm tra Claude-bundle. Đặt `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` để
  giữ khối ClawHub hermetic/offline.
- `test:docker:plugin-lifecycle-matrix` cài đặt gói ứng viên trong một
  container trống, chạy một Plugin npm qua cài đặt, kiểm tra, tắt, bật,
  nâng cấp tường minh, hạ cấp tường minh, và gỡ cài đặt sau khi xóa mã Plugin.
  Nó ghi lại chỉ số RSS và CPU cho từng pha.
- `test:docker:plugin-update` xác thực rằng một Plugin đã cài đặt không đổi
  không bị cài đặt lại hoặc mất metadata cài đặt trong `openclaw plugins update`.
- `test:docker:upgrade-survivor` cài đặt tarball ứng viên lên một fixture
  người dùng cũ bẩn, chạy cập nhật gói cùng doctor không tương tác, rồi khởi động
  một Gateway loopback và kiểm tra việc bảo toàn trạng thái.
- `test:docker:published-upgrade-survivor` trước tiên cài đặt một baseline đã phát hành,
  cấu hình nó thông qua một công thức `openclaw config set` được bake sẵn, cập nhật nó lên
  tarball ứng viên, chạy doctor, kiểm tra dọn dẹp kế thừa, khởi động Gateway, và
  probe `/healthz`, `/readyz`, cùng trạng thái RPC.
- `test:docker:update-restart-auth` cài đặt gói ứng viên, khởi động một
  Gateway auth bằng token được quản lý, unset env auth gateway của caller cho
  `openclaw update --yes --json`, và yêu cầu lệnh cập nhật ứng viên
  khởi động lại Gateway trước các probe bình thường.
- `test:docker:update-migration` là lane published-update nặng về dọn dẹp. Nó
  bắt đầu từ trạng thái người dùng kiểu Discord/Telegram đã cấu hình, chạy
  doctor baseline để các phụ thuộc Plugin đã cấu hình có cơ hội được hiện thực hóa, seed
  mảnh vụn phụ thuộc Plugin kế thừa cho một Plugin đóng gói đã cấu hình, cập nhật lên
  tarball ứng viên, và yêu cầu doctor sau cập nhật xóa các root phụ thuộc
  kế thừa.

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
`stale-source-plugin-shadow`, `tilde-log-path`, và `versioned-runtime-deps`. Trong các lượt chạy tổng hợp,
`OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` mở rộng thành tất cả các kịch bản
có dạng issue đã báo cáo, bao gồm cả di chuyển cài đặt Plugin đã cấu hình.

Full update migration được tách riêng có chủ ý khỏi Full Release CI. Dùng
workflow thủ công `Update Migration` khi câu hỏi phát hành là "mọi
bản phát hành ổn định đã xuất bản từ 2026.4.23 trở đi có thể cập nhật lên ứng viên này và
dọn sạch mảnh vụn phụ thuộc Plugin không?":

```bash
gh workflow run update-migration.yml \
  --ref main \
  -f workflow_ref=main \
  -f package_ref=main \
  -f baselines=all-since-2026.4.23 \
  -f scenarios=plugin-deps-cleanup
```

## Package Acceptance

Package Acceptance là cổng gói native trên GitHub. Nó phân giải một gói ứng viên
thành một tarball `package-under-test`, ghi lại phiên bản và SHA-256, rồi
chạy các lane Docker E2E tái sử dụng với đúng tarball đó. Ref harness workflow
tách biệt với ref nguồn gói, nên logic kiểm thử hiện tại có thể xác thực
các bản phát hành đáng tin cậy cũ hơn.

Nguồn ứng viên:

- `source=npm`: xác thực `openclaw@beta`, `openclaw@latest`, hoặc một
  phiên bản đã phát hành chính xác.
- `source=ref`: đóng gói một nhánh, tag, hoặc commit đáng tin cậy bằng harness hiện tại
  đã chọn.
- `source=url`: xác thực một tarball HTTPS công khai với `package_sha256` bắt buộc.
  Đường dẫn này từ chối thông tin xác thực URL, cổng HTTPS không mặc định, hostname hoặc
  kết quả DNS/IP riêng tư/nội bộ, không gian IP dùng đặc biệt, và redirect không an toàn.
- `source=trusted-url`: xác thực một tarball HTTPS với
  `package_sha256` và `trusted_source_id` bắt buộc dựa trên chính sách do maintainer sở hữu
  trong `.github/package-trusted-sources.json`. Dùng lựa chọn này cho mirror enterprise/private
  thay vì làm yếu `source=url` bằng một công tắc allow-private ở cấp input.
  Bearer auth, khi được cấu hình bằng chính sách, dùng secret cố định
  `OPENCLAW_TRUSTED_PACKAGE_TOKEN`.
- `source=artifact`: tái sử dụng một tarball được tải lên bởi một lượt chạy Actions khác.

Full Release Validation dùng `source=artifact` theo mặc định, được build từ
SHA phát hành đã phân giải. Với bằng chứng sau phát hành, truyền
`package_acceptance_package_spec=openclaw@YYYY.M.PATCH` để cùng ma trận nâng cấp
nhắm tới gói npm đã ship thay thế.

Release checks gọi Package Acceptance với bộ package/update/restart/plugin:

```text
doctor-switch update-channel-switch update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update
```

Khi bật release soak, chúng cũng truyền:

```text
published_upgrade_survivor_baselines=last-stable-4 2026.4.23 2026.5.2 2026.4.15
published_upgrade_survivor_scenarios=reported-issues
telegram_mode=mock-openai
```

Điều này giữ di chuyển gói, chuyển kênh cập nhật, khả năng chịu lỗi managed-plugin
bị hỏng, dọn dẹp phụ thuộc Plugin đã cũ, bao phủ Plugin offline, hành vi
cập nhật Plugin, và QA gói Telegram trên cùng artifact đã phân giải mà không
khiến cổng gói phát hành mặc định phải đi qua mọi bản phát hành đã xuất bản.

`last-stable-4` phân giải thành bốn bản phát hành OpenClaw ổn định mới nhất
đã được xuất bản lên npm. Release package acceptance ghim `2026.4.23` làm ranh giới
tương thích plugin-update đầu tiên, `2026.5.2` làm ranh giới xáo trộn kiến trúc Plugin, và
`2026.4.15` làm baseline published-update 2026.4.1x cũ hơn; resolver
loại trùng các pin đã nằm trong bốn bản mới nhất. Để bao phủ published
update migration toàn diện, dùng `all-since-2026.4.23` trong workflow Update
Migration riêng thay vì Full Release CI. `release-history` vẫn
có sẵn để lấy mẫu rộng hơn thủ công khi bạn cũng muốn anchor kế thừa trước ngày đó.

Khi nhiều baseline published-upgrade survivor được chọn, workflow Docker tái sử dụng
chia mỗi baseline thành job runner nhắm mục tiêu riêng. Mỗi shard baseline
vẫn chạy bộ kịch bản đã chọn, nhưng log và artifact được giữ
theo từng baseline và thời gian tường bị giới hạn bởi shard chậm nhất thay vì một job
tuần tự lớn.

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

Dùng `suite_profile=product` khi câu hỏi phát hành bao gồm kênh MCP,
dọn dẹp cron/subagent, tìm kiếm web OpenAI, hoặc OpenWebUI. Chỉ dùng `suite_profile=full`
khi bạn cần bao phủ đầy đủ đường dẫn phát hành Docker.

## Mặc định phát hành

Với release candidate, ngăn xếp bằng chứng mặc định là:

1. `pnpm check:changed` và `pnpm test:changed` cho hồi quy cấp nguồn.
2. `pnpm release:check` cho tính toàn vẹn artifact gói.
3. Profile Package Acceptance `package` hoặc các lane gói tùy chỉnh của release-check
   cho các hợp đồng cài đặt/cập nhật/khởi động lại/Plugin.
4. Kiểm tra phát hành đa hệ điều hành cho trình cài đặt, onboarding, và hành vi nền tảng
   đặc thù theo OS.
5. Các bộ trực tiếp chỉ khi bề mặt đã thay đổi chạm đến hành vi nhà cung cấp hoặc dịch vụ được host.

Trên máy maintainer, các cổng rộng và bằng chứng sản phẩm Docker/gói nên chạy
trong Testbox trừ khi đang thực hiện bằng chứng cục bộ một cách tường minh.

## Tương thích kế thừa

Mức nới lỏng tương thích rất hẹp và có giới hạn thời gian:

- Các gói đến `2026.4.25`, bao gồm `2026.4.25-beta.*`, có thể dung thứ
  các khoảng trống metadata gói đã ship trong Package Acceptance.
- Gói `2026.4.26` đã phát hành có thể cảnh báo về các tệp dấu metadata bản build cục bộ
  đã ship.
- Các gói sau đó phải thỏa mãn hợp đồng hiện đại. Cùng các khoảng trống đó sẽ thất bại thay vì
  cảnh báo hoặc bỏ qua.

Không thêm di chuyển khởi động mới cho các hình dạng cũ này. Thêm hoặc mở rộng một sửa chữa bằng doctor,
rồi chứng minh nó bằng `upgrade-survivor`, `published-upgrade-survivor`, hoặc
`update-restart-auth` khi lệnh cập nhật sở hữu việc khởi động lại.

## Thêm bao phủ

Khi thay đổi hành vi cập nhật hoặc Plugin, thêm bao phủ ở lớp thấp nhất có thể
thất bại vì đúng lý do:

- Logic thuần về đường dẫn hoặc siêu dữ liệu: kiểm thử đơn vị đặt cạnh mã nguồn.
- Hành vi kiểm kê gói hoặc tệp đã đóng gói: kiểm thử `package-dist-inventory` hoặc
  trình kiểm tra tarball.
- Hành vi cài đặt/cập nhật CLI: xác nhận trong lane Docker hoặc fixture.
- Hành vi di trú bản phát hành đã công bố: kịch bản `published-upgrade-survivor`.
- Hành vi khởi động lại do cập nhật sở hữu: `update-restart-auth`.
- Hành vi nguồn registry/gói: fixture `test:docker:plugins` hoặc máy chủ fixture
  ClawHub.
- Hành vi bố cục dependency hoặc dọn dẹp: xác nhận cả việc thực thi lúc chạy và
  ranh giới hệ thống tệp. Các dependency npm có thể được hoist bên trong dự án
  npm do Plugin quản lý, vì vậy kiểm thử nên chứng minh rằng dự án đó được quét/dọn dẹp
  thay vì giả định chỉ có cây `node_modules` cục bộ trong gói Plugin.

Theo mặc định, hãy giữ các fixture Docker mới khép kín. Dùng registry fixture cục bộ và
gói giả trừ khi mục đích của kiểm thử là hành vi registry trực tiếp.

## Phân loại lỗi

Bắt đầu với định danh artifact:

- Tóm tắt `resolve_package` của Package Acceptance: nguồn, phiên bản, SHA-256 và
  tên artifact.
- Artifact Docker: `.artifacts/docker-tests/**/summary.json`,
  `failures.json`, nhật ký lane và lệnh chạy lại.
- Tóm tắt upgrade survivor: `.artifacts/upgrade-survivor/summary.json`,
  bao gồm phiên bản baseline, phiên bản ứng viên, kịch bản, thời gian từng pha và
  các bước công thức.

Ưu tiên chạy lại đúng lane đã lỗi với cùng artifact gói thay vì
chạy lại toàn bộ umbrella phát hành.
