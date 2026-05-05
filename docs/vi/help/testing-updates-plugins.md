---
read_when:
    - Thay đổi hành vi cập nhật OpenClaw, doctor, chấp nhận gói hoặc cài đặt Plugin
    - Chuẩn bị hoặc phê duyệt bản phát hành ứng viên
    - Gỡ lỗi cập nhật gói, dọn dẹp phụ thuộc Plugin hoặc lỗi hồi quy cài đặt Plugin
sidebarTitle: Update and plugin tests
summary: Cách OpenClaw xác thực các đường dẫn cập nhật, quá trình di chuyển gói và hành vi cài đặt/cập nhật Plugin
title: 'Kiểm thử: bản cập nhật và Plugin'
x-i18n:
    generated_at: "2026-05-05T01:48:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: e83a847c76f424199b5fccbd9a2b30d0bf01e4f466c4f9822bf7693d1c2ad286
    source_path: help/testing-updates-plugins.md
    workflow: 16
---

Đây là danh sách kiểm tra chuyên biệt cho việc xác thực cập nhật và Plugin. Mục tiêu
đơn giản: chứng minh gói có thể cài đặt có thể cập nhật trạng thái người dùng thực,
sửa trạng thái kế thừa đã cũ thông qua `doctor`, và vẫn cài đặt, tải, cập nhật,
cũng như gỡ cài đặt Plugin từ các nguồn được hỗ trợ.

Để xem bản đồ bộ chạy kiểm thử rộng hơn, hãy xem [Kiểm thử](/vi/help/testing). Để biết
các khóa nhà cung cấp trực tiếp và các bộ kiểm thử chạm tới mạng, hãy xem
[Kiểm thử trực tiếp](/vi/help/testing-live).

## Những gì chúng ta bảo vệ

Các kiểm thử cập nhật và Plugin bảo vệ những hợp đồng này:

- Tarball của gói là đầy đủ, có `dist/postinstall-inventory.json` hợp lệ,
  và không phụ thuộc vào các tệp repo chưa được đóng gói.
- Người dùng có thể chuyển từ một gói đã phát hành cũ hơn sang gói ứng viên
  mà không mất cấu hình, agent, phiên, workspace, danh sách cho phép Plugin,
  hoặc cấu hình kênh.
- `openclaw doctor --fix --non-interactive` sở hữu các đường dẫn dọn dẹp và sửa chữa
  kế thừa. Khởi động không nên phát sinh các migration tương thích ẩn cho trạng thái
  Plugin đã cũ.
- Cài đặt Plugin hoạt động từ thư mục cục bộ, repo git, gói npm, và đường dẫn
  registry ClawHub.
- Các phụ thuộc npm của Plugin được cài đặt trong npm root được quản lý, được quét
  trước khi tin cậy, và được gỡ bỏ thông qua npm trong quá trình gỡ cài đặt để
  các phụ thuộc đã hoist không còn sót lại.
- Cập nhật Plugin ổn định khi không có gì thay đổi: bản ghi cài đặt, nguồn đã
  phân giải, bố cục phụ thuộc đã cài đặt, và trạng thái bật vẫn nguyên vẹn.

## Bằng chứng cục bộ trong quá trình phát triển

Bắt đầu hẹp:

```bash
pnpm changed:lanes --json
pnpm check:changed
pnpm test:changed
```

Đối với các thay đổi về cài đặt, gỡ cài đặt, phụ thuộc, hoặc inventory gói của
Plugin, cũng chạy các kiểm thử tập trung bao phủ ranh giới đã chỉnh sửa:

```bash
pnpm test src/plugins/uninstall.test.ts src/infra/package-dist-inventory.test.ts test/scripts/package-acceptance-workflow.test.ts
```

Trước khi bất kỳ lane Docker gói nào tiêu thụ tarball, hãy chứng minh artifact gói:

```bash
pnpm release:check
```

`release:check` chạy các kiểm tra độ lệch cấu hình/tài liệu/API, ghi inventory dist
của gói, chạy `npm pack --dry-run`, từ chối các tệp bị cấm đã được đóng gói, cài đặt
tarball vào một prefix tạm, chạy postinstall, và smoke các entrypoint kênh được bundle.

## Các lane Docker

Các lane Docker là bằng chứng ở cấp sản phẩm. Chúng cài đặt hoặc cập nhật một gói thực
bên trong container Linux và xác nhận hành vi thông qua các lệnh CLI, khởi động Gateway,
probe HTTP, trạng thái RPC, và trạng thái hệ thống tệp.

Dùng các lane tập trung trong khi lặp:

```bash
pnpm test:docker:plugins
pnpm test:docker:plugin-lifecycle-matrix
pnpm test:docker:plugin-update
pnpm test:docker:upgrade-survivor
pnpm test:docker:published-upgrade-survivor
pnpm test:docker:update-migration
```

Các lane quan trọng:

- `test:docker:plugins` xác thực smoke cài đặt Plugin, cài đặt thư mục cục bộ,
  hành vi bỏ qua cập nhật của thư mục cục bộ, thư mục cục bộ có phụ thuộc được
  cài sẵn, cài đặt gói `file:`, cài đặt git với thực thi CLI, cập nhật tham chiếu
  git đang di chuyển, cài đặt registry npm với các phụ thuộc bắc cầu đã hoist,
  npm update không thao tác, cài đặt fixture ClawHub cục bộ và update không thao tác,
  hành vi cập nhật marketplace, và bật/kiểm tra Claude-bundle. Đặt
  `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` để giữ khối ClawHub hermetic/offline.
- `test:docker:plugin-lifecycle-matrix` cài đặt gói ứng viên trong một container trống,
  chạy một Plugin npm qua các bước cài đặt, kiểm tra, tắt, bật, nâng cấp rõ ràng,
  hạ cấp rõ ràng, và gỡ cài đặt sau khi xóa mã Plugin. Nó ghi log các chỉ số RSS và CPU
  cho từng pha.
- `test:docker:plugin-update` xác thực rằng một Plugin đã cài đặt không đổi sẽ không
  được cài lại hoặc mất metadata cài đặt trong `openclaw plugins update`.
- `test:docker:upgrade-survivor` cài đặt tarball ứng viên đè lên một fixture người dùng
  cũ bẩn, chạy cập nhật gói cùng doctor không tương tác, sau đó khởi động một Gateway
  local loopback và kiểm tra việc bảo toàn trạng thái.
- `test:docker:published-upgrade-survivor` trước tiên cài đặt một baseline đã phát hành,
  cấu hình nó thông qua một công thức `openclaw config set` đã bake, cập nhật nó lên
  tarball ứng viên, chạy doctor, kiểm tra dọn dẹp kế thừa, khởi động Gateway, và probe
  `/healthz`, `/readyz`, cùng trạng thái RPC.
- `test:docker:update-migration` là lane cập nhật đã phát hành tập trung nhiều vào dọn dẹp.
  Nó bắt đầu từ trạng thái người dùng kiểu Discord/Telegram đã cấu hình, chạy doctor
  baseline để các phụ thuộc Plugin đã cấu hình có cơ hội materialize, seed rác phụ thuộc
  Plugin kế thừa cho một Plugin đóng gói đã cấu hình, cập nhật lên tarball ứng viên,
  và yêu cầu doctor sau cập nhật gỡ bỏ các root phụ thuộc kế thừa.

Các biến thể upgrade survivor đã phát hành hữu ích:

```bash
OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@2026.4.23 \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=versioned-runtime-deps \
pnpm test:docker:published-upgrade-survivor

OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@latest \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=bootstrap-persona \
pnpm test:docker:published-upgrade-survivor
```

Các kịch bản khả dụng là `base`, `feishu-channel`, `bootstrap-persona`,
`plugin-deps-cleanup`, `configured-plugin-installs`,
`stale-source-plugin-shadow`, `tilde-log-path`, và `versioned-runtime-deps`. Trong các lượt chạy tổng hợp,
`OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` mở rộng thành tất cả kịch bản
có dạng vấn đề đã báo cáo, bao gồm migration cài đặt Plugin đã cấu hình.

Migration cập nhật đầy đủ được tách riêng có chủ ý khỏi CI phát hành đầy đủ. Dùng
workflow thủ công `Update Migration` khi câu hỏi phát hành là "mọi bản phát hành
ổn định đã phát hành từ 2026.4.23 trở đi có thể cập nhật lên ứng viên này và dọn
rác phụ thuộc Plugin không?":

```bash
gh workflow run update-migration.yml \
  --ref main \
  -f workflow_ref=main \
  -f package_ref=main \
  -f baselines=all-since-2026.4.23 \
  -f scenarios=plugin-deps-cleanup
```

## Chấp nhận gói

Chấp nhận gói là cổng gói native của GitHub. Nó phân giải một gói ứng viên thành
tarball `package-under-test`, ghi lại phiên bản và SHA-256, rồi chạy các lane Docker E2E
tái sử dụng đối với đúng tarball đó. Ref harness workflow tách biệt với ref nguồn gói,
nên logic kiểm thử hiện tại có thể xác thực các bản phát hành đáng tin cậy cũ hơn.

Nguồn ứng viên:

- `source=npm`: xác thực `openclaw@beta`, `openclaw@latest`, hoặc một phiên bản đã
  phát hành chính xác.
- `source=ref`: đóng gói một nhánh, tag, hoặc commit đáng tin cậy với harness hiện tại
  đã chọn.
- `source=url`: xác thực một tarball HTTPS với `package_sha256` bắt buộc.
- `source=artifact`: tái sử dụng tarball do một lượt chạy Actions khác tải lên.

Xác thực phát hành đầy đủ dùng `source=artifact` theo mặc định, được build từ SHA
phát hành đã phân giải. Để chứng minh sau phát hành, truyền
`package_acceptance_package_spec=openclaw@YYYY.M.D` để cùng ma trận nâng cấp
nhắm tới gói npm đã được phát hành.

Các kiểm tra phát hành gọi Chấp nhận gói với bộ gói/cập nhật/Plugin:

```text
doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update
```

Chúng cũng truyền:

```text
published_upgrade_survivor_baselines=all-since-2026.4.23
published_upgrade_survivor_scenarios=reported-issues
telegram_mode=mock-openai
```

Điều này giữ migration gói, chuyển kênh cập nhật, dọn dẹp phụ thuộc Plugin đã cũ,
bao phủ Plugin offline, hành vi cập nhật Plugin, và QA gói Telegram trên cùng một
artifact đã phân giải.

`all-since-2026.4.23` là mẫu nâng cấp của CI phát hành đầy đủ: mọi bản phát hành ổn định đã phát hành lên npm từ `2026.4.23` đến `latest`. Để bao phủ migration
cập nhật đã phát hành một cách toàn diện, dùng `all-since-2026.4.23` trong workflow
Update Migration riêng thay vì CI phát hành đầy đủ. `release-history` vẫn khả dụng
cho việc lấy mẫu rộng hơn thủ công khi bạn cũng muốn neo ngày trước kế thừa.

Chạy hồ sơ gói thủ công khi xác thực ứng viên trước phát hành:

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

Dùng `suite_profile=product` khi câu hỏi phát hành bao gồm các kênh MCP, dọn dẹp
cron/subagent, tìm kiếm web OpenAI, hoặc OpenWebUI. Chỉ dùng `suite_profile=full`
khi bạn cần bao phủ đầy đủ đường dẫn phát hành Docker.

## Mặc định phát hành

Đối với ứng viên phát hành, ngăn xếp bằng chứng mặc định là:

1. `pnpm check:changed` và `pnpm test:changed` cho các hồi quy ở cấp nguồn.
2. `pnpm release:check` cho tính toàn vẹn artifact gói.
3. Hồ sơ `package` của Chấp nhận gói hoặc các lane gói tùy chỉnh của kiểm tra phát hành
   cho hợp đồng cài đặt/cập nhật/Plugin.
4. Kiểm tra phát hành đa hệ điều hành cho hành vi installer, onboarding, và nền tảng
   đặc thù theo OS.
5. Các bộ trực tiếp chỉ khi bề mặt đã thay đổi chạm tới hành vi nhà cung cấp hoặc
   dịch vụ được host.

Trên máy maintainer, các cổng rộng và bằng chứng sản phẩm Docker/gói nên chạy
trong Testbox trừ khi đang thực hiện bằng chứng cục bộ một cách rõ ràng.

## Tương thích kế thừa

Mức khoan dung tương thích hẹp và có giới hạn thời gian:

- Các gói đến `2026.4.25`, bao gồm `2026.4.25-beta.*`, có thể dung thứ các khoảng trống
  metadata gói đã được phát hành trong Chấp nhận gói.
- Gói `2026.4.26` đã phát hành có thể cảnh báo về các tệp stamp metadata build cục bộ
  đã được phát hành.
- Các gói sau đó phải đáp ứng hợp đồng hiện đại. Cùng các khoảng trống đó sẽ thất bại
  thay vì cảnh báo hoặc bỏ qua.

Không thêm migration khởi động mới cho các dạng cũ này. Thêm hoặc mở rộng một sửa chữa
doctor, rồi chứng minh bằng `upgrade-survivor` hoặc `published-upgrade-survivor`.

## Thêm phạm vi bao phủ

Khi thay đổi hành vi cập nhật hoặc Plugin, hãy thêm phạm vi bao phủ ở tầng thấp nhất
có thể thất bại vì đúng lý do:

- Logic đường dẫn thuần hoặc metadata: kiểm thử đơn vị bên cạnh nguồn.
- Hành vi inventory gói hoặc tệp đã đóng gói: `package-dist-inventory` hoặc kiểm thử
  trình kiểm tra tarball.
- Hành vi cài đặt/cập nhật CLI: assertion hoặc fixture trong lane Docker.
- Hành vi migration bản phát hành đã phát hành: kịch bản `published-upgrade-survivor`.
- Hành vi registry/nguồn gói: fixture `test:docker:plugins` hoặc server fixture ClawHub.
- Hành vi bố cục hoặc dọn dẹp phụ thuộc: xác nhận cả thực thi runtime và ranh giới
  hệ thống tệp. Phụ thuộc npm có thể được hoist dưới npm root được quản lý, nên kiểm thử
  cần chứng minh root được quét/dọn thay vì giả định một cây `node_modules` cục bộ của gói.

Giữ các fixture Docker mới hermetic theo mặc định. Dùng registry fixture cục bộ và
gói giả trừ khi mục tiêu của kiểm thử là hành vi registry trực tiếp.

## Phân loại lỗi

Bắt đầu với định danh artifact:

- Tóm tắt `resolve_package` của Chấp nhận gói: nguồn, phiên bản, SHA-256, và tên artifact.
- Artifact Docker: `.artifacts/docker-tests/**/summary.json`,
  `failures.json`, log lane, và các lệnh chạy lại.
- Tóm tắt upgrade survivor: `.artifacts/upgrade-survivor/summary.json`,
  bao gồm phiên bản baseline, phiên bản ứng viên, kịch bản, thời gian pha, và
  các bước công thức.

Ưu tiên chạy lại đúng lane đã lỗi với cùng artifact gói hơn là chạy lại toàn bộ
ô phát hành.
