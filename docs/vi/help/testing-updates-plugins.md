---
read_when:
    - Thay đổi hành vi cập nhật, doctor, chấp nhận gói hoặc cài đặt Plugin của OpenClaw
    - Chuẩn bị hoặc phê duyệt ứng viên phát hành
    - Gỡ lỗi các hồi quy về cập nhật gói, dọn dẹp phụ thuộc của Plugin hoặc cài đặt Plugin
sidebarTitle: Update and plugin tests
summary: Cách OpenClaw xác thực các lộ trình cập nhật, quá trình di chuyển gói và hành vi cài đặt/cập nhật Plugin
title: 'Kiểm thử: bản cập nhật và Plugin'
x-i18n:
    generated_at: "2026-05-06T09:16:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: db3790bb8c6b952458342727f3e326f9610b4d8155889dfdadb143e3ef07aa46
    source_path: help/testing-updates-plugins.md
    workflow: 16
---

Đây là checklist chuyên dụng cho việc xác thực cập nhật và plugin. Mục tiêu rất
đơn giản: chứng minh gói có thể cài đặt có thể cập nhật trạng thái người dùng
thực, sửa trạng thái cũ lỗi thời thông qua `doctor`, và vẫn cài đặt, tải, cập
nhật, cũng như gỡ cài đặt plugin từ các nguồn được hỗ trợ.

Để xem bản đồ trình chạy kiểm thử rộng hơn, xem [Kiểm thử](/vi/help/testing). Đối
với khóa nhà cung cấp live và các bộ kiểm thử chạm mạng, xem [Kiểm thử live](/vi/help/testing-live).

## Những gì chúng ta bảo vệ

Các kiểm thử cập nhật và plugin bảo vệ các hợp đồng này:

- Một tarball gói là đầy đủ, có `dist/postinstall-inventory.json` hợp lệ, và
  không phụ thuộc vào các tệp repo chưa được đóng gói.
- Người dùng có thể chuyển từ một gói đã phát hành cũ hơn sang gói ứng viên
  mà không mất config, agent, phiên, workspace, danh sách cho phép plugin, hoặc
  config kênh.
- `openclaw doctor --fix --non-interactive` sở hữu các đường dẫn dọn dẹp và sửa
  chữa cũ. Khởi động không nên phát sinh các migration tương thích ẩn cho trạng
  thái plugin lỗi thời.
- Cài đặt plugin hoạt động từ thư mục cục bộ, repo git, gói npm, và đường dẫn
  registry ClawHub.
- Các phụ thuộc npm của plugin được cài trong gốc npm được quản lý, được quét
  trước khi tin cậy, và được gỡ bỏ thông qua npm trong khi gỡ cài đặt để các
  phụ thuộc được hoist không còn sót lại.
- Cập nhật plugin ổn định khi không có gì thay đổi: bản ghi cài đặt, nguồn đã
  phân giải, bố cục phụ thuộc đã cài đặt, và trạng thái bật được giữ nguyên.

## Bằng chứng cục bộ trong khi phát triển

Bắt đầu hẹp:

```bash
pnpm changed:lanes --json
pnpm check:changed
pnpm test:changed
```

Đối với các thay đổi về cài đặt plugin, gỡ cài đặt, phụ thuộc, hoặc package
inventory, cũng chạy các kiểm thử tập trung bao phủ seam đã chỉnh sửa:

```bash
pnpm test src/plugins/uninstall.test.ts src/infra/package-dist-inventory.test.ts test/scripts/package-acceptance-workflow.test.ts
```

Trước khi bất kỳ lane Docker nào của gói tiêu thụ tarball, hãy chứng minh artifact
gói:

```bash
pnpm release:check
```

`release:check` chạy các kiểm tra drift config/docs/API, ghi package dist
inventory, chạy `npm pack --dry-run`, từ chối các tệp bị cấm trong gói, cài
tarball vào một tiền tố tạm, chạy postinstall, và smoke các entrypoint kênh
được đóng gói.

## Các lane Docker

Các lane Docker là bằng chứng cấp sản phẩm. Chúng cài đặt hoặc cập nhật một gói
thực bên trong container Linux và xác nhận hành vi thông qua lệnh CLI, khởi động
Gateway, probe HTTP, trạng thái RPC, và trạng thái hệ thống tệp.

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

- `test:docker:plugins` xác thực smoke cài đặt plugin, cài đặt thư mục cục bộ,
  hành vi bỏ qua cập nhật thư mục cục bộ, thư mục cục bộ có phụ thuộc đã cài
  sẵn, cài đặt gói `file:`, cài đặt git có thực thi CLI, cập nhật moving-ref của
  git, cài đặt từ npm registry với phụ thuộc bắc cầu được hoist, no-op cập nhật
  npm, cài đặt fixture ClawHub cục bộ và no-op cập nhật, hành vi cập nhật
  marketplace, và bật/kiểm tra Claude-bundle. Đặt `OPENCLAW_PLUGINS_E2E_CLAWHUB=0`
  để giữ khối ClawHub kín và offline.
- `test:docker:plugin-lifecycle-matrix` cài gói ứng viên trong một container
  trống, chạy một plugin npm qua cài đặt, kiểm tra, tắt, bật, nâng cấp tường
  minh, hạ cấp tường minh, và gỡ cài đặt sau khi xóa mã plugin. Nó ghi log chỉ
  số RSS và CPU cho từng pha.
- `test:docker:plugin-update` xác thực rằng một plugin đã cài đặt nhưng không
  thay đổi sẽ không cài đặt lại hoặc mất metadata cài đặt trong khi chạy
  `openclaw plugins update`.
- `test:docker:upgrade-survivor` cài tarball ứng viên lên một fixture người dùng
  cũ bẩn, chạy cập nhật gói cùng doctor không tương tác, rồi khởi động Gateway
  loopback và kiểm tra việc bảo toàn trạng thái.
- `test:docker:published-upgrade-survivor` trước tiên cài một baseline đã phát
  hành, cấu hình nó qua một công thức `openclaw config set` được nướng sẵn, cập
  nhật nó lên tarball ứng viên, chạy doctor, kiểm tra dọn dẹp cũ, khởi động
  Gateway, và probe `/healthz`, `/readyz`, cùng trạng thái RPC.
- `test:docker:update-restart-auth` cài gói ứng viên, khởi động một Gateway
  token-auth được quản lý, bỏ đặt env xác thực Gateway của caller cho
  `openclaw update --yes --json`, và yêu cầu lệnh cập nhật ứng viên khởi động
  lại Gateway trước các probe thông thường.
- `test:docker:update-migration` là lane published-update nặng về dọn dẹp. Nó
  bắt đầu từ trạng thái người dùng kiểu Discord/Telegram đã cấu hình, chạy doctor
  baseline để các phụ thuộc plugin đã cấu hình có cơ hội hiện thực hóa, seed rác
  phụ thuộc plugin cũ cho một plugin đóng gói đã cấu hình, cập nhật lên tarball
  ứng viên, và yêu cầu doctor sau cập nhật xóa các root phụ thuộc cũ.

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
`stale-source-plugin-shadow`, `tilde-log-path`, và `versioned-runtime-deps`. Trong các lần chạy tổng hợp,
`OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` mở rộng thành tất cả kịch
bản có hình dạng vấn đề đã báo cáo, bao gồm migration cài đặt configured-plugin.

Full update migration được cố ý tách khỏi Full Release CI. Dùng workflow thủ
công `Update Migration` khi câu hỏi phát hành là "mọi bản phát hành stable đã
xuất bản từ 2026.4.23 trở đi có thể cập nhật lên ứng viên này và dọn rác phụ
thuộc plugin không?":

```bash
gh workflow run update-migration.yml \
  --ref main \
  -f workflow_ref=main \
  -f package_ref=main \
  -f baselines=all-since-2026.4.23 \
  -f scenarios=plugin-deps-cleanup
```

## Package Acceptance

Package Acceptance là gate gói theo kiểu native của GitHub. Nó phân giải một
gói ứng viên thành tarball `package-under-test`, ghi lại phiên bản và SHA-256,
sau đó chạy các lane Docker E2E có thể tái sử dụng dựa trên chính tarball đó.
Ref harness workflow tách biệt với ref nguồn gói, vì vậy logic kiểm thử hiện tại
có thể xác thực các bản phát hành tin cậy cũ hơn.

Nguồn ứng viên:

- `source=npm`: xác thực `openclaw@beta`, `openclaw@latest`, hoặc một phiên bản
  đã phát hành chính xác.
- `source=ref`: pack một branch, tag, hoặc commit tin cậy với harness hiện tại
  đã chọn.
- `source=url`: xác thực tarball HTTPS với `package_sha256` bắt buộc.
- `source=artifact`: tái sử dụng tarball do một lần chạy Actions khác tải lên.

Full Release Validation mặc định dùng `source=artifact`, được build từ SHA phát
hành đã phân giải. Để chứng minh sau phát hành, truyền
`package_acceptance_package_spec=openclaw@YYYY.M.D` để cùng ma trận nâng cấp
nhắm tới gói npm đã xuất xưởng thay thế.

Các kiểm tra phát hành gọi Package Acceptance với tập package/update/restart/plugin:

```text
doctor-switch update-channel-switch update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update
```

Khi bật release soak, chúng cũng truyền:

```text
published_upgrade_survivor_baselines=last-stable-4 2026.4.23 2026.5.2 2026.4.15
published_upgrade_survivor_scenarios=reported-issues
telegram_mode=mock-openai
```

Điều này giữ migration gói, chuyển kênh cập nhật, dung thứ plugin được quản lý
bị hỏng, dọn dẹp phụ thuộc plugin lỗi thời, bao phủ plugin offline, hành vi cập
nhật plugin, và QA gói Telegram trên cùng artifact đã phân giải mà không khiến
gate gói phát hành mặc định đi qua mọi bản phát hành đã xuất bản.

`last-stable-4` phân giải thành bốn bản phát hành OpenClaw stable mới nhất đã
xuất bản trên npm. Release package acceptance ghim `2026.4.23` làm ranh giới
tương thích cập nhật plugin đầu tiên, `2026.5.2` làm ranh giới churn kiến trúc
plugin, và `2026.4.15` làm baseline published-update cũ hơn của 2026.4.1x; bộ
phân giải khử trùng lặp các pin đã nằm trong bốn bản mới nhất. Để bao phủ
published update migration đầy đủ, dùng `all-since-2026.4.23` trong workflow
Update Migration riêng thay vì Full Release CI. `release-history` vẫn có sẵn để
lấy mẫu rộng hơn thủ công khi bạn cũng muốn anchor trước ngày cũ.

Khi chọn nhiều baseline published-upgrade survivor, workflow Docker có thể tái
sử dụng sẽ shard từng baseline vào job runner mục tiêu riêng. Mỗi shard baseline
vẫn chạy tập kịch bản đã chọn, nhưng log và artifact được giữ theo từng baseline
và thời gian wall bị chặn bởi shard chậm nhất thay vì một job tuần tự lớn.

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
cron/subagent, tìm kiếm web OpenAI, hoặc OpenWebUI. Chỉ dùng `suite_profile=full`
khi bạn cần bao phủ đầy đủ đường dẫn phát hành Docker.

## Mặc định phát hành

Đối với release candidate, stack bằng chứng mặc định là:

1. `pnpm check:changed` và `pnpm test:changed` cho hồi quy cấp nguồn.
2. `pnpm release:check` cho tính toàn vẹn artifact gói.
3. Profile `package` của Package Acceptance hoặc các lane gói tùy chỉnh của
   release-check cho hợp đồng install/update/restart/plugin.
4. Kiểm tra phát hành Cross-OS cho trình cài đặt, onboarding, và hành vi nền
   tảng đặc thù theo OS.
5. Bộ live chỉ khi bề mặt đã thay đổi chạm tới hành vi nhà cung cấp hoặc dịch vụ
   được host.

Trên máy của maintainer, các gate rộng và bằng chứng sản phẩm Docker/gói nên
chạy trong Testbox trừ khi đang làm bằng chứng cục bộ một cách tường minh.

## Tương thích cũ

Độ nới tương thích là hẹp và có giới hạn thời gian:

- Các gói đến `2026.4.25`, bao gồm `2026.4.25-beta.*`, có thể dung thứ các lỗ
  hổng metadata gói đã xuất xưởng trong Package Acceptance.
- Gói `2026.4.26` đã xuất bản có thể cảnh báo về các tệp stamp metadata build
  cục bộ đã xuất xưởng.
- Các gói muộn hơn phải đáp ứng hợp đồng hiện đại. Cùng các lỗ hổng đó sẽ thất
  bại thay vì cảnh báo hoặc bỏ qua.

Không thêm migration khởi động mới cho các hình dạng cũ này. Thêm hoặc mở rộng
một sửa chữa doctor, rồi chứng minh nó bằng `upgrade-survivor`,
`published-upgrade-survivor`, hoặc `update-restart-auth` khi lệnh cập nhật sở
hữu việc khởi động lại.

## Thêm bao phủ

Khi thay đổi hành vi cập nhật hoặc plugin, hãy thêm bao phủ ở lớp thấp nhất có
thể thất bại vì đúng lý do:

- Logic đường dẫn hoặc metadata thuần: kiểm thử unit cạnh nguồn.
- Hành vi package inventory hoặc packed-file: kiểm thử `package-dist-inventory`
  hoặc trình kiểm tra tarball.
- Hành vi cài đặt/cập nhật CLI: assertion hoặc fixture lane Docker.
- Hành vi migration bản phát hành đã xuất bản: kịch bản `published-upgrade-survivor`.
- Hành vi khởi động lại do cập nhật sở hữu: `update-restart-auth`.
- Hành vi nguồn registry/gói: fixture `test:docker:plugins` hoặc máy chủ fixture
  ClawHub.
- Hành vi bố cục hoặc dọn dẹp phụ thuộc: assert cả thực thi runtime và ranh giới
  hệ thống tệp. Các phụ thuộc npm có thể được hoist dưới root npm được quản lý,
  vì vậy kiểm thử nên chứng minh root được quét/dọn thay vì giả định một cây
  `node_modules` cục bộ theo gói.

Giữ các fixture Docker mới mặc định hermetic. Dùng registry fixture cục bộ và
gói giả trừ khi mục tiêu của kiểm thử là hành vi registry live.

## Triage lỗi

Bắt đầu với định danh artifact:

- Tóm tắt `resolve_package` Chấp nhận gói: nguồn, phiên bản, SHA-256 và
  tên artifact.
- Artifact Docker: `.artifacts/docker-tests/**/summary.json`,
  `failures.json`, nhật ký lane và lệnh chạy lại.
- Tóm tắt sống sót sau nâng cấp: `.artifacts/upgrade-survivor/summary.json`,
  bao gồm phiên bản baseline, phiên bản ứng viên, kịch bản, thời gian từng giai đoạn và
  các bước recipe.

Ưu tiên chạy lại đúng lane đã thất bại với cùng artifact gói thay vì
chạy lại toàn bộ umbrella phát hành.
