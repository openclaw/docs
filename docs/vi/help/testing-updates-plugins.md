---
read_when:
    - Thay đổi hành vi cập nhật, doctor, chấp nhận gói hoặc cài đặt Plugin của OpenClaw
    - Chuẩn bị hoặc phê duyệt bản ứng viên phát hành
    - Gỡ lỗi các lỗi hồi quy về cập nhật gói, dọn dẹp phần phụ thuộc của Plugin hoặc cài đặt Plugin
sidebarTitle: Update and plugin tests
summary: Cách OpenClaw kiểm chứng các lộ trình cập nhật, quá trình di chuyển gói và hành vi cài đặt/cập nhật Plugin
title: 'Kiểm thử: cập nhật và Plugin'
x-i18n:
    generated_at: "2026-05-02T20:45:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1a56e249f565cc23a439142b3332c0a57fd4afe9021b79f644d353946d6d2ffc
    source_path: help/testing-updates-plugins.md
    workflow: 16
---

Đây là danh sách kiểm tra chuyên dụng cho xác thực cập nhật và Plugin. Mục tiêu
đơn giản: chứng minh rằng gói có thể cài đặt có thể cập nhật trạng thái người
dùng thực, sửa trạng thái cũ lỗi thời thông qua `doctor`, và vẫn cài đặt, tải,
cập nhật và gỡ cài đặt Plugin từ các nguồn được hỗ trợ.

Để xem bản đồ bộ chạy kiểm thử rộng hơn, xem [Kiểm thử](/vi/help/testing). Để xem
khóa nhà cung cấp trực tiếp và các bộ kiểm thử chạm mạng, xem [Kiểm thử trực tiếp](/vi/help/testing-live).

## Những gì chúng ta bảo vệ

Các kiểm thử cập nhật và Plugin bảo vệ các hợp đồng này:

- Tarball của gói phải đầy đủ, có `dist/postinstall-inventory.json` hợp lệ,
  và không phụ thuộc vào các tệp repo chưa được đóng gói.
- Người dùng có thể chuyển từ gói đã phát hành cũ hơn sang gói ứng viên
  mà không mất cấu hình, agent, phiên, workspace, danh sách cho phép Plugin,
  hoặc cấu hình kênh.
- `openclaw doctor --fix --non-interactive` sở hữu các đường dẫn dọn dẹp và sửa
  chữa legacy. Khởi động không nên phát sinh các migration tương thích ẩn cho
  trạng thái Plugin lỗi thời.
- Cài đặt Plugin hoạt động từ thư mục cục bộ, repo git, gói npm, và đường dẫn
  registry ClawHub.
- Các phụ thuộc npm của Plugin được cài đặt trong root npm được quản lý, được
  quét trước khi tin cậy, và được gỡ bỏ thông qua npm trong lúc gỡ cài đặt để
  các phụ thuộc đã hoist không còn sót lại.
- Cập nhật Plugin ổn định khi không có gì thay đổi: bản ghi cài đặt, nguồn đã
  resolve, bố cục phụ thuộc đã cài, và trạng thái bật được giữ nguyên.

## Chứng minh cục bộ trong quá trình phát triển

Bắt đầu hẹp:

```bash
pnpm changed:lanes --json
pnpm check:changed
pnpm test:changed
```

Đối với thay đổi về cài đặt, gỡ cài đặt, phụ thuộc, hoặc inventory gói của
Plugin, cũng chạy các kiểm thử tập trung bao phủ seam đã chỉnh sửa:

```bash
pnpm test src/plugins/uninstall.test.ts src/infra/package-dist-inventory.test.ts test/scripts/package-acceptance-workflow.test.ts
```

Trước khi bất kỳ lane Docker nào của gói tiêu thụ tarball, hãy chứng minh artifact
của gói:

```bash
pnpm release:check
```

`release:check` chạy các kiểm tra drift cấu hình/tài liệu/API, ghi inventory dist
của gói, chạy `npm pack --dry-run`, từ chối các tệp bị cấm trong gói, cài đặt
tarball vào một prefix tạm, chạy postinstall, và smoke các entrypoint kênh đi kèm.

## Các lane Docker

Các lane Docker là chứng minh cấp sản phẩm. Chúng cài đặt hoặc cập nhật một gói
thực bên trong container Linux và xác nhận hành vi thông qua các lệnh CLI,
khởi động Gateway, probe HTTP, trạng thái RPC, và trạng thái hệ thống tệp.

Dùng các lane tập trung trong khi lặp:

```bash
pnpm test:docker:plugins
pnpm test:docker:plugin-update
pnpm test:docker:upgrade-survivor
pnpm test:docker:published-upgrade-survivor
pnpm test:docker:update-migration
```

Các lane quan trọng:

- `test:docker:plugins` xác thực smoke cài đặt Plugin, cài đặt thư mục cục bộ,
  hành vi bỏ qua cập nhật thư mục cục bộ, thư mục cục bộ có phụ thuộc đã cài
  sẵn, cài đặt gói `file:`, cài đặt git kèm thực thi CLI, cập nhật ref git di
  chuyển, cài đặt registry npm với các phụ thuộc bắc cầu đã hoist, no-op khi
  cập nhật npm, cài đặt fixture ClawHub cục bộ và no-op khi cập nhật, hành vi
  cập nhật marketplace, và bật/inspect gói Claude. Đặt
  `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` để giữ khối ClawHub hermetic/offline.
- `test:docker:plugin-update` xác thực rằng một Plugin đã cài không thay đổi
  sẽ không cài đặt lại hoặc mất metadata cài đặt trong `openclaw plugins update`.
- `test:docker:upgrade-survivor` cài tarball ứng viên đè lên một fixture người
  dùng cũ bị bẩn, chạy cập nhật gói cộng với doctor không tương tác, sau đó
  khởi động một Gateway loopback và kiểm tra việc bảo toàn trạng thái.
- `test:docker:published-upgrade-survivor` trước tiên cài một baseline đã phát
  hành, cấu hình nó thông qua công thức `openclaw config set` được bake sẵn,
  cập nhật nó lên tarball ứng viên, chạy doctor, kiểm tra dọn dẹp legacy, khởi
  động Gateway, và probe `/healthz`, `/readyz`, cùng trạng thái RPC.
- `test:docker:update-migration` là lane cập nhật đã phát hành nặng về dọn dẹp.
  Nó bắt đầu từ trạng thái người dùng kiểu Discord/Telegram đã cấu hình, chạy
  doctor baseline để các phụ thuộc Plugin đã cấu hình có cơ hội hiện diện, seed
  phần dư phụ thuộc Plugin legacy cho một Plugin đóng gói đã cấu hình, cập nhật
  lên tarball ứng viên, và yêu cầu doctor sau cập nhật xóa các root phụ thuộc legacy.

Các biến thể upgrade survivor đã phát hành hữu ích:

```bash
OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@2026.4.23 \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=versioned-runtime-deps \
pnpm test:docker:published-upgrade-survivor

OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@latest \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=bootstrap-persona \
pnpm test:docker:published-upgrade-survivor
```

Các kịch bản có sẵn là `base`, `feishu-channel`, `bootstrap-persona`,
`plugin-deps-cleanup`, `configured-plugin-installs`, `tilde-log-path`, và
`versioned-runtime-deps`. Trong các lượt chạy tổng hợp,
`OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` mở rộng thành tất cả các
kịch bản có dạng issue đã báo cáo, bao gồm migration cài đặt Plugin đã cấu hình.

Migration cập nhật đầy đủ được tách riêng có chủ ý khỏi Full Release CI. Dùng
workflow thủ công `Update Migration` khi câu hỏi phát hành là "mọi bản phát hành
ổn định đã xuất bản từ 2026.4.23 trở đi có thể cập nhật lên ứng viên này và dọn
sạch phần dư phụ thuộc Plugin không?":

```bash
gh workflow run update-migration.yml \
  --ref main \
  -f workflow_ref=main \
  -f package_ref=main \
  -f baselines=all-since-2026.4.23 \
  -f scenarios=plugin-deps-cleanup
```

## Package Acceptance

Package Acceptance là cổng gói native của GitHub. Nó resolve một gói ứng viên
thành tarball `package-under-test`, ghi lại phiên bản và SHA-256, sau đó chạy
các lane Docker E2E tái sử dụng trên đúng tarball đó. Ref của harness workflow
tách riêng khỏi ref nguồn gói, nên logic kiểm thử hiện tại có thể xác thực các
bản phát hành đáng tin cậy cũ hơn.

Nguồn ứng viên:

- `source=npm`: xác thực `openclaw@beta`, `openclaw@latest`, hoặc một phiên bản
  đã phát hành chính xác.
- `source=ref`: đóng gói một nhánh, tag, hoặc commit đáng tin cậy với harness
  hiện tại đã chọn.
- `source=url`: xác thực một tarball HTTPS với `package_sha256` bắt buộc.
- `source=artifact`: tái sử dụng tarball được upload bởi một lượt chạy Actions khác.

Full Release Validation dùng `source=artifact` theo mặc định, được build từ SHA
phát hành đã resolve. Để chứng minh sau phát hành, truyền
`package_acceptance_package_spec=openclaw@YYYY.M.D` để cùng ma trận nâng cấp
nhắm đến gói npm đã phát hành thay vào đó.

Các kiểm tra phát hành gọi Package Acceptance với tập gói/cập nhật/Plugin:

```text
doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update
```

Chúng cũng truyền:

```text
published_upgrade_survivor_baselines=all-since-2026.4.23
published_upgrade_survivor_scenarios=reported-issues
telegram_mode=mock-openai
```

Điều này giữ migration gói, chuyển kênh cập nhật, dọn dẹp phụ thuộc Plugin lỗi
thời, phạm vi Plugin offline, hành vi cập nhật Plugin, và QA gói Telegram trên
cùng artifact đã resolve.

`all-since-2026.4.23` là mẫu nâng cấp Full Release CI: mọi bản phát hành ổn định
đã xuất bản trên npm từ `2026.4.23` đến `latest`. Để có phạm vi migration cập
nhật đã phát hành toàn diện, dùng `all-since-2026.4.23` trong workflow Update
Migration riêng thay vì Full Release CI. `release-history` vẫn có sẵn để lấy mẫu
rộng hơn thủ công khi bạn cũng muốn anchor legacy trước ngày đó.

Chạy thủ công một profile gói khi xác thực ứng viên trước phát hành:

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=package \
  -f published_upgrade_survivor_baselines=all-since-2026.4.23 \
  -f published_upgrade_survivor_scenarios=reported-issues \
  -f telegram_mode=mock-openai
```

Dùng `suite_profile=product` khi câu hỏi phát hành bao gồm các kênh MCP, dọn
dẹp cron/subagent, tìm kiếm web OpenAI, hoặc OpenWebUI. Chỉ dùng
`suite_profile=full` khi bạn cần toàn bộ phạm vi đường dẫn phát hành Docker.

## Mặc định phát hành

Đối với ứng viên phát hành, ngăn xếp chứng minh mặc định là:

1. `pnpm check:changed` và `pnpm test:changed` cho hồi quy cấp nguồn.
2. `pnpm release:check` cho tính toàn vẹn artifact của gói.
3. Profile `package` của Package Acceptance hoặc các lane gói tùy chỉnh của
   kiểm tra phát hành cho hợp đồng cài đặt/cập nhật/Plugin.
4. Kiểm tra phát hành đa hệ điều hành cho trình cài đặt, onboarding, và hành vi
   nền tảng đặc thù theo hệ điều hành.
5. Bộ kiểm thử trực tiếp chỉ khi bề mặt thay đổi chạm đến hành vi nhà cung cấp
   hoặc dịch vụ hosted.

Trên máy maintainer, các cổng rộng và chứng minh sản phẩm Docker/gói nên chạy
trong Testbox trừ khi đang làm chứng minh cục bộ một cách rõ ràng.

## Tương thích legacy

Độ nới tương thích rất hẹp và có giới hạn thời gian:

- Các gói đến `2026.4.25`, bao gồm `2026.4.25-beta.*`, có thể chấp nhận các
  khoảng trống metadata gói đã phát hành trong Package Acceptance.
- Gói `2026.4.26` đã phát hành có thể cảnh báo về các tệp dấu metadata build
  cục bộ đã được phát hành.
- Các gói sau đó phải đáp ứng hợp đồng hiện đại. Cùng các khoảng trống đó sẽ
  thất bại thay vì cảnh báo hoặc bỏ qua.

Không thêm migration khởi động mới cho các hình dạng cũ này. Thêm hoặc mở rộng
một sửa chữa doctor, rồi chứng minh nó với `upgrade-survivor` hoặc
`published-upgrade-survivor`.

## Thêm phạm vi kiểm thử

Khi thay đổi hành vi cập nhật hoặc Plugin, thêm phạm vi kiểm thử ở lớp thấp nhất
có thể thất bại vì đúng lý do:

- Logic đường dẫn hoặc metadata thuần: kiểm thử unit bên cạnh nguồn.
- Hành vi inventory gói hoặc tệp được đóng gói: kiểm thử `package-dist-inventory`
  hoặc trình kiểm tra tarball.
- Hành vi cài đặt/cập nhật CLI: assertion hoặc fixture lane Docker.
- Hành vi migration bản phát hành đã xuất bản: kịch bản `published-upgrade-survivor`.
- Hành vi nguồn registry/gói: fixture `test:docker:plugins` hoặc server fixture
  ClawHub.
- Hành vi bố cục hoặc dọn dẹp phụ thuộc: assert cả thực thi runtime và biên hệ
  thống tệp. Các phụ thuộc npm có thể được hoist dưới root npm được quản lý, nên
  kiểm thử cần chứng minh root được quét/dọn dẹp thay vì giả định cây
  `node_modules` cục bộ của gói.

Giữ fixture Docker mới hermetic theo mặc định. Dùng registry fixture cục bộ và
gói giả trừ khi mục đích của kiểm thử là hành vi registry trực tiếp.

## Phân loại lỗi

Bắt đầu với danh tính artifact:

- Tóm tắt `resolve_package` của Package Acceptance: nguồn, phiên bản, SHA-256,
  và tên artifact.
- Artifact Docker: `.artifacts/docker-tests/**/summary.json`,
  `failures.json`, log lane, và lệnh chạy lại.
- Tóm tắt upgrade survivor: `.artifacts/upgrade-survivor/summary.json`,
  bao gồm phiên bản baseline, phiên bản ứng viên, kịch bản, thời lượng theo pha,
  và các bước công thức.

Ưu tiên chạy lại đúng lane đã thất bại với cùng artifact gói thay vì chạy lại
toàn bộ umbrella phát hành.
