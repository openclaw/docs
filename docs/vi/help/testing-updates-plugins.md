---
read_when:
    - Thay đổi hành vi cập nhật, doctor, chấp nhận gói hoặc cài đặt plugin của OpenClaw
    - Chuẩn bị hoặc phê duyệt một bản phát hành ứng viên
    - Gỡ lỗi cập nhật gói, dọn dẹp phần phụ thuộc của Plugin hoặc lỗi hồi quy khi cài đặt Plugin
sidebarTitle: Update and plugin tests
summary: Cách OpenClaw xác thực các lộ trình cập nhật, quá trình di chuyển gói và hành vi cài đặt/cập nhật Plugin
title: 'Kiểm thử: bản cập nhật và plugin'
x-i18n:
    generated_at: "2026-07-19T05:48:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 96a11fe42472f758d4fd1cc568486e301f7460982fdb547cab8b39de04a8dabe
    source_path: help/testing-updates-plugins.md
    workflow: 16
---

Danh sách kiểm tra để xác thực cập nhật và plugin: chứng minh gói có thể cài đặt có thể
cập nhật trạng thái người dùng thực, sửa trạng thái cũ lỗi thời thông qua `doctor`, đồng thời vẫn
cài đặt, tải, cập nhật và gỡ cài đặt plugin từ mọi nguồn được hỗ trợ.

Để xem sơ đồ trình chạy kiểm thử tổng quát hơn, hãy xem [Kiểm thử](/vi/help/testing). Đối với khóa
nhà cung cấp trực tiếp và các bộ kiểm thử truy cập mạng, hãy xem [Kiểm thử trực tiếp](/vi/help/testing-live).

## Những gì chúng ta bảo vệ

- Tarball của gói phải đầy đủ, có `dist/postinstall-inventory.json` hợp lệ
  và không phụ thuộc vào các tệp kho mã nguồn chưa được đóng gói.
- Người dùng có thể chuyển từ một gói cũ hơn đã phát hành sang gói ứng viên
  mà không mất cấu hình, agent, phiên, không gian làm việc, danh sách cho phép plugin hoặc
  cấu hình kênh.
- `openclaw doctor --fix --non-interactive` sở hữu các đường dẫn dọn dẹp và sửa chữa
  trạng thái cũ. Quá trình khởi động không nên phát sinh các bước di chuyển tương thích ẩn cho
  trạng thái plugin lỗi thời.
- Việc cài đặt plugin hoạt động từ thư mục cục bộ, kho git, gói npm và
  đường dẫn registry ClawHub.
- Các phần phụ thuộc npm của plugin được cài đặt trong một dự án npm được quản lý cho mỗi plugin,
  được quét trước khi được tin cậy và được xóa thông qua `npm uninstall` trong khi
  gỡ cài đặt plugin để các phần phụ thuộc được hoist không còn sót lại.
- Cập nhật plugin là thao tác không làm gì khi không có thay đổi: bản ghi cài đặt, nguồn
  đã phân giải, bố cục phần phụ thuộc đã cài đặt và trạng thái bật vẫn nguyên vẹn.

## Xác minh cục bộ trong quá trình phát triển

Bắt đầu với phạm vi hẹp:

```bash
pnpm changed:lanes --json
pnpm check:changed
pnpm test:changed
```

Đối với các thay đổi về cài đặt, gỡ cài đặt, phần phụ thuộc hoặc kiểm kê gói của plugin, cũng
chạy các kiểm thử tập trung bao phủ điểm nối đã chỉnh sửa:

```bash
pnpm test src/plugins/uninstall.test.ts src/infra/package-dist-inventory.test.ts test/scripts/package-acceptance-workflow.test.ts
```

Trước khi bất kỳ lane Docker gói nào sử dụng tarball, hãy xác minh tạo phẩm gói:

```bash
pnpm release:check
```

`release:check` chạy các kiểm tra sai lệch về cấu hình/tài liệu/API (schema cấu hình, đường cơ sở
tài liệu cấu hình, tệp kê khai hợp đồng API và các mục xuất của SDK plugin, phiên bản/kiểm kê plugin),
ghi bản kiểm kê bản phân phối gói, chạy `npm pack --dry-run`, từ chối các tệp đóng gói
bị cấm, cài đặt tarball vào một tiền tố tạm thời, chạy postinstall và
kiểm tra nhanh các điểm vào kênh đi kèm.

## Các lane Docker

Các lane Docker là bằng chứng ở cấp sản phẩm. Chúng cài đặt hoặc cập nhật một
gói thực bên trong container Linux và xác nhận hành vi thông qua lệnh CLI,
khởi động Gateway, phép dò HTTP, trạng thái RPC và trạng thái hệ thống tệp.

Sử dụng các lane tập trung trong khi lặp:

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

- `test:docker:plugins` bao gồm kiểm tra nhanh cài đặt plugin, cài đặt thư mục cục bộ,
  hành vi bỏ qua cập nhật thư mục cục bộ, thư mục cục bộ có các phần phụ thuộc
  được cài đặt sẵn, cài đặt gói `file:`, cài đặt git kèm thực thi CLI, cập nhật
  tham chiếu git di chuyển, cài đặt từ registry npm với các phần phụ thuộc bắc cầu
  được hoist, cập nhật npm không làm gì, từ chối siêu dữ liệu gói npm không đúng định dạng,
  cài đặt fixture ClawHub cục bộ và cập nhật không làm gì, hành vi cập nhật marketplace
  và bật/kiểm tra gói Claude. Đặt `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` để
  giữ khối ClawHub khép kín/ngoại tuyến.
- `test:docker:plugin-lifecycle-matrix` cài đặt gói ứng viên trong một container
  trống, chạy một plugin npm qua các bước cài đặt, kiểm tra, tắt, bật,
  nâng cấp rõ ràng, hạ cấp rõ ràng và gỡ cài đặt sau khi xóa mã
  plugin. Lane này ghi nhật ký chỉ số RSS và CPU theo từng giai đoạn.
- `test:docker:plugin-update` xác thực rằng một plugin đã cài đặt không thay đổi
  không được cài đặt lại hoặc mất siêu dữ liệu cài đặt trong `openclaw plugins update`.
- `test:docker:upgrade-survivor` cài đặt tarball ứng viên đè lên một fixture
  người dùng cũ không sạch, chạy cập nhật gói cùng doctor không tương tác, sau đó khởi động
  một Gateway loopback và kiểm tra việc bảo toàn trạng thái.
- `test:docker:published-upgrade-survivor` trước tiên cài đặt một đường cơ sở đã phát hành,
  cấu hình nó thông qua công thức `openclaw config set` được tích hợp sẵn, cập nhật lên
  tarball ứng viên, chạy doctor, kiểm tra việc dọn dẹp trạng thái cũ, khởi động Gateway và
  dò `/healthz`, `/readyz` cùng trạng thái RPC.
- `test:docker:update-restart-auth` cài đặt gói ứng viên, khởi động một
  Gateway xác thực bằng token được quản lý, bỏ đặt biến môi trường xác thực Gateway của bên gọi cho
  `openclaw update --yes --json` và yêu cầu lệnh cập nhật ứng viên
  khởi động lại Gateway trước các phép dò thông thường.
- `test:docker:update-migration` là lane cập nhật đã phát hành tập trung nhiều vào dọn dẹp. Lane này
  bắt đầu từ trạng thái người dùng đã cấu hình theo kiểu Discord/Telegram, chạy doctor
  đường cơ sở để các phần phụ thuộc plugin đã cấu hình có cơ hội được hiện thực hóa, tạo
  dữ liệu rác phần phụ thuộc plugin cũ cho một plugin đóng gói đã cấu hình, cập nhật lên
  tarball ứng viên và yêu cầu doctor sau cập nhật xóa các thư mục gốc phần phụ thuộc cũ.

Các biến thể hữu ích của lane duy trì sau nâng cấp đã phát hành:

```bash
OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@2026.4.23 \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=versioned-runtime-deps \
pnpm test:docker:published-upgrade-survivor

OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@latest \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=bootstrap-persona \
pnpm test:docker:published-upgrade-survivor
```

Các kịch bản khả dụng: `base`, `acpx-openclaw-tools-bridge`, `feishu-channel`,
`bootstrap-persona`, `channel-post-core-restore`, `plugin-deps-cleanup`,
`configured-plugin-installs`, `stale-source-plugin-shadow`, `tilde-log-path`
và `versioned-runtime-deps`. Trong các lần chạy tổng hợp, `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues`
(bí danh `far-reaching`) mở rộng thành mọi kịch bản, bao gồm cả
quá trình di chuyển cài đặt plugin đã cấu hình.

Quá trình di chuyển cập nhật đầy đủ được cố ý tách khỏi CI phát hành đầy đủ. Sử dụng
workflow `Update Migration` thủ công khi câu hỏi phát hành là "mọi
bản phát hành ổn định đã xuất bản từ 2026.4.23 trở đi có thể cập nhật lên ứng viên này và
dọn dẹp dữ liệu rác phần phụ thuộc plugin hay không?":

```bash
gh workflow run update-migration.yml \
  --ref main \
  -f workflow_ref=main \
  -f package_ref=main \
  -f baselines=all-since-2026.4.23 \
  -f scenarios=plugin-deps-cleanup
```

## Chấp nhận gói

Chấp nhận gói là cổng gói gốc GitHub. Nó phân giải một gói
ứng viên thành tarball `package-under-test`, ghi lại phiên bản và SHA-256, sau đó
chạy các lane E2E Docker có thể tái sử dụng với chính xác tarball đó. Tham chiếu harness
workflow tách biệt với tham chiếu nguồn gói, vì vậy logic kiểm thử hiện tại có thể xác thực
các bản phát hành đáng tin cậy cũ hơn.

Các nguồn ứng viên:

- `source=npm`: xác thực `openclaw@extended-stable`, `openclaw@beta`,
  `openclaw@latest` hoặc một phiên bản chính xác đã phát hành.
- `source=ref`: đóng gói một nhánh, thẻ hoặc commit đáng tin cậy bằng harness hiện tại
  đã chọn.
- `source=url`: xác thực tarball HTTPS công khai với `package_sha256` bắt buộc.
  Đường dẫn này từ chối thông tin xác thực trong URL, cổng HTTPS không mặc định, tên máy chủ riêng/nội bộ
  hoặc kết quả DNS/IP riêng/nội bộ, không gian IP dùng cho mục đích đặc biệt và chuyển hướng không an toàn.
- `source=trusted-url`: xác thực tarball HTTPS với
  `package_sha256` và `trusted_source_id` bắt buộc theo chính sách do người bảo trì sở hữu
  trong `.github/package-trusted-sources.json`. Sử dụng đường dẫn này cho các mirror
  doanh nghiệp/riêng tư thay vì làm suy yếu `source=url` bằng một công tắc cho phép riêng tư
  ở cấp đầu vào. Xác thực bearer, khi được chính sách cấu hình, sử dụng
  secret `OPENCLAW_TRUSTED_PACKAGE_TOKEN` cố định.
- `source=artifact`: tái sử dụng tarball do một lần chạy Actions khác tải lên.

Xác thực phát hành đầy đủ sử dụng `source=artifact` theo mặc định, được xây dựng từ
SHA phát hành đã phân giải. Để xác minh sau khi phát hành, hãy truyền
`package_acceptance_package_spec=openclaw@YYYY.M.PATCH` để cùng ma trận nâng cấp đó
nhắm đến gói npm đã phát hành.

Các kiểm tra phát hành gọi Chấp nhận gói với tập hợp gói/cập nhật/khởi động lại/plugin:

```text
doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor root-managed-vps-upgrade update-restart-auth plugins-offline plugin-update plugin-binding-command-escape
```

Khi giai đoạn theo dõi phát hành được bật (bắt buộc bật cho `release_profile=stable` và
`full`), chúng cũng truyền:

```text
published_upgrade_survivor_baselines=last-stable-4 2026.4.23 2026.5.2 2026.4.15
published_upgrade_survivor_scenarios=reported-issues
telegram_mode=mock-openai
```

Điều này giữ quá trình di chuyển gói, chuyển đổi kênh cập nhật, khả năng chịu đựng plugin
được quản lý bị hỏng, dọn dẹp phần phụ thuộc plugin lỗi thời, phạm vi plugin ngoại tuyến, hành vi
cập nhật plugin và QA gói Telegram trên cùng một tạo phẩm đã phân giải mà không
buộc cổng gói phát hành mặc định phải đi qua mọi bản phát hành đã xuất bản.

`last-stable-4` phân giải thành bốn bản phát hành OpenClaw ổn định mới nhất đã
phát hành lên npm. Chấp nhận gói phát hành ghim `2026.4.23` làm ranh giới tương thích
cập nhật plugin đầu tiên, `2026.5.2` làm ranh giới biến động kiến trúc plugin và
`2026.4.15` làm đường cơ sở cập nhật đã phát hành cũ hơn thuộc 2026.4.1x; trình phân giải
loại bỏ các mục ghim trùng đã có trong bốn bản mới nhất. Để bao phủ đầy đủ
quá trình di chuyển cập nhật đã phát hành, hãy sử dụng `all-since-2026.4.23` trong workflow
Di chuyển cập nhật riêng biệt thay vì CI phát hành đầy đủ. `release-history` vẫn
khả dụng để lấy mẫu thủ công rộng hơn khi bạn cũng muốn mốc neo cũ trước ngày đó.

Khi chọn nhiều đường cơ sở duy trì sau nâng cấp đã phát hành, workflow
Docker có thể tái sử dụng chia từng đường cơ sở thành một tác vụ runner được nhắm mục tiêu riêng. Mỗi
phân đoạn đường cơ sở vẫn chạy tập hợp kịch bản đã chọn, nhưng nhật ký và tạo phẩm được giữ
theo từng đường cơ sở, còn thời gian thực tế bị giới hạn bởi phân đoạn chậm nhất thay vì một tác vụ
tuần tự lớn.

Chạy thủ công một hồ sơ gói khi xác thực ứng viên trước khi phát hành:

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

Đối với canary extended-stable đã phát hành, hãy đặt
`package_spec=openclaw@extended-stable`. Chấp nhận gói phân giải
bộ chọn đó thành một tarball chính xác trước khi các lane Docker chạy.

Sử dụng `suite_profile=product` khi câu hỏi phát hành bao gồm các kênh MCP,
dọn dẹp cron/subagent, tìm kiếm web OpenAI hoặc OpenWebUI. Chỉ sử dụng `suite_profile=full`
khi cần bao phủ đầy đủ đường dẫn phát hành Docker.

## Mặc định phát hành

Đối với các ứng viên phát hành, ngăn xếp xác minh mặc định là:

1. `pnpm check:changed` và `pnpm test:changed` cho các lỗi hồi quy ở cấp mã nguồn.
2. `pnpm release:check` cho tính toàn vẹn của tạo phẩm gói.
3. Hồ sơ `package` của Chấp nhận gói hoặc các lane gói tùy chỉnh
   trong kiểm tra phát hành cho hợp đồng cài đặt/cập nhật/khởi động lại/plugin.
4. Các kiểm tra phát hành đa hệ điều hành cho trình cài đặt, quy trình thiết lập ban đầu và hành vi
   nền tảng dành riêng cho từng hệ điều hành.
5. Chỉ chạy các bộ kiểm thử trực tiếp khi bề mặt thay đổi ảnh hưởng đến hành vi của nhà cung cấp
   hoặc dịch vụ được lưu trữ.

Trên máy của người bảo trì, các cổng rộng và xác minh sản phẩm Docker/gói nên chạy
trong Testbox trừ khi thực hiện xác minh cục bộ một cách rõ ràng.

## Tương thích cũ

Mức nới lỏng tương thích có phạm vi hẹp và giới hạn thời gian:

- Các gói đến `2026.4.25`, bao gồm `2026.4.25-beta.*`, có thể chấp nhận
  các thiếu sót siêu dữ liệu gói đã phát hành trong Chấp nhận gói.
- Gói `2026.4.26` đã phát hành có thể cảnh báo đối với các tệp dấu
  siêu dữ liệu bản dựng cục bộ đã được phát hành.
- Các gói sau đó phải đáp ứng các hợp đồng hiện đại. Những thiếu sót tương tự sẽ gây lỗi thay vì
  cảnh báo hoặc bỏ qua.

Không thêm các bước di chuyển khởi động mới cho những hình dạng cũ này. Hãy thêm hoặc mở rộng một bước
sửa chữa của doctor, sau đó xác minh bằng `upgrade-survivor`, `published-upgrade-survivor` hoặc
`update-restart-auth` khi lệnh cập nhật sở hữu thao tác khởi động lại.

## Thêm phạm vi kiểm thử

Khi thay đổi hành vi cập nhật hoặc plugin, hãy bổ sung phạm vi kiểm thử ở tầng thấp nhất
có thể thất bại vì đúng nguyên nhân:

- Logic đường dẫn hoặc siêu dữ liệu thuần túy: kiểm thử đơn vị đặt cạnh mã nguồn.
- Hành vi kiểm kê gói hoặc tệp đã đóng gói: `package-dist-inventory` hoặc kiểm thử
  trình kiểm tra tarball.
- Hành vi cài đặt/cập nhật qua CLI: xác nhận trong lane Docker hoặc fixture.
- Hành vi di chuyển bản phát hành đã xuất bản: kịch bản `published-upgrade-survivor`.
- Hành vi khởi động lại do cập nhật quản lý: `update-restart-auth`.
- Hành vi nguồn registry/gói: fixture `test:docker:plugins` hoặc máy chủ fixture
  ClawHub.
- Hành vi bố trí hoặc dọn dẹp phần phụ thuộc: xác nhận cả việc thực thi trong thời gian chạy lẫn
  ranh giới hệ thống tệp. Các phần phụ thuộc npm có thể được nâng lên trong dự án npm
  được quản lý của plugin, vì vậy các kiểm thử phải chứng minh rằng dự án đó được quét/dọn dẹp
  thay vì giả định chỉ có cây `node_modules` cục bộ của gói plugin.

Theo mặc định, hãy giữ các fixture Docker mới khép kín. Sử dụng registry fixture cục bộ và
gói giả, trừ khi mục đích của kiểm thử là hành vi registry trực tiếp.

## Phân loại lỗi

Bắt đầu với danh tính của artifact:

- Tóm tắt `resolve_package` của Package Acceptance: nguồn, phiên bản, SHA-256 và
  tên artifact.
- Artifact Docker: `.artifacts/docker-tests/**/summary.json`,
  `failures.json`, nhật ký lane và các lệnh chạy lại.
- Tóm tắt các thành phần còn tồn tại sau nâng cấp: `.artifacts/upgrade-survivor/summary.json`,
  bao gồm phiên bản cơ sở, phiên bản ứng viên, kịch bản, thời gian từng giai đoạn và
  phạm vi bao phủ công thức cấu hình.

Ưu tiên chạy lại chính xác lane đã thất bại với cùng artifact gói thay vì
chạy lại toàn bộ nhóm kiểm thử phát hành.
