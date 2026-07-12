---
read_when:
    - Thay đổi hành vi cập nhật, doctor, chấp nhận gói hoặc cài đặt plugin của OpenClaw
    - Chuẩn bị hoặc phê duyệt một bản phát hành ứng viên
    - Gỡ lỗi cập nhật gói, dọn dẹp phần phụ thuộc của Plugin hoặc lỗi hồi quy khi cài đặt Plugin
sidebarTitle: Update and plugin tests
summary: Cách OpenClaw xác thực các lộ trình cập nhật, quá trình di chuyển gói và hành vi cài đặt/cập nhật Plugin
title: 'Kiểm thử: bản cập nhật và plugin'
x-i18n:
    generated_at: "2026-07-12T08:02:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4e930960b5819d2144467476cb473e62f236eca63e1d9941a6bc793b484e731c
    source_path: help/testing-updates-plugins.md
    workflow: 16
---

Danh sách kiểm tra để xác thực cập nhật và Plugin: chứng minh gói có thể cài đặt có thể
cập nhật trạng thái người dùng thực, sửa chữa trạng thái cũ lỗi thời thông qua `doctor`, đồng thời vẫn
cài đặt, tải, cập nhật và gỡ cài đặt Plugin từ mọi nguồn được hỗ trợ.

Để xem bản đồ trình chạy kiểm thử rộng hơn, hãy xem [Kiểm thử](/vi/help/testing). Đối với khóa
của nhà cung cấp trực tiếp và các bộ kiểm thử có truy cập mạng, hãy xem [Kiểm thử trực tiếp](/vi/help/testing-live).

## Những gì chúng tôi bảo vệ

- Tarball của gói phải đầy đủ, có `dist/postinstall-inventory.json` hợp lệ
  và không phụ thuộc vào các tệp kho lưu trữ chưa được đóng gói.
- Người dùng có thể chuyển từ một gói đã phát hành cũ hơn sang gói ứng viên
  mà không làm mất cấu hình, agent, phiên, không gian làm việc, danh sách cho phép của Plugin hoặc
  cấu hình kênh.
- `openclaw doctor --fix --non-interactive` chịu trách nhiệm về các đường dẫn dọn dẹp và sửa chữa
  cũ. Quá trình khởi động không được phát sinh các bước di chuyển tương thích ẩn cho
  trạng thái Plugin lỗi thời.
- Việc cài đặt Plugin hoạt động từ thư mục cục bộ, kho git, gói npm và
  đường dẫn registry ClawHub.
- Các phần phụ thuộc npm của Plugin được cài đặt trong một dự án npm được quản lý cho mỗi Plugin,
  được quét trước khi tin cậy và được xóa thông qua `npm uninstall` khi
  gỡ cài đặt Plugin để các phần phụ thuộc được nâng cấp không còn sót lại.
- Việc cập nhật Plugin là thao tác không làm gì khi không có thay đổi: bản ghi cài đặt, nguồn
  đã phân giải, bố cục phần phụ thuộc đã cài đặt và trạng thái kích hoạt vẫn nguyên vẹn.

## Bằng chứng cục bộ trong quá trình phát triển

Bắt đầu với phạm vi hẹp:

```bash
pnpm changed:lanes --json
pnpm check:changed
pnpm test:changed
```

Đối với các thay đổi về cài đặt, gỡ cài đặt, phần phụ thuộc hoặc kiểm kê gói của Plugin, cũng
chạy các kiểm thử tập trung bao phủ điểm nối đã chỉnh sửa:

```bash
pnpm test src/plugins/uninstall.test.ts src/infra/package-dist-inventory.test.ts test/scripts/package-acceptance-workflow.test.ts
```

Trước khi bất kỳ luồng Docker gói nào sử dụng tarball, hãy xác minh tạo phẩm gói:

```bash
pnpm release:check
```

`release:check` chạy các bước kiểm tra sai lệch cấu hình/tài liệu/API (lược đồ cấu hình, đường cơ sở
tài liệu cấu hình, đường cơ sở và các mục xuất API của SDK Plugin, phiên bản/kiểm kê Plugin),
ghi kiểm kê bản phân phối gói, chạy `npm pack --dry-run`, từ chối các tệp đóng gói
bị cấm, cài đặt tarball vào một tiền tố tạm thời, chạy postinstall và
kiểm tra nhanh các điểm vào kênh đi kèm.

## Các luồng Docker

Các luồng Docker là bằng chứng ở cấp sản phẩm. Chúng cài đặt hoặc cập nhật một
gói thực bên trong các vùng chứa Linux và xác nhận hành vi thông qua các lệnh CLI,
khởi động Gateway, phép dò HTTP, trạng thái RPC và trạng thái hệ thống tệp.

Sử dụng các luồng tập trung trong khi lặp:

```bash
pnpm test:docker:plugins
pnpm test:docker:plugin-lifecycle-matrix
pnpm test:docker:plugin-update
pnpm test:docker:upgrade-survivor
pnpm test:docker:published-upgrade-survivor
pnpm test:docker:update-restart-auth
pnpm test:docker:update-migration
```

Các luồng quan trọng:

- `test:docker:plugins` bao phủ kiểm tra nhanh cài đặt Plugin, cài đặt từ thư mục cục bộ,
  hành vi bỏ qua cập nhật thư mục cục bộ, thư mục cục bộ có các phần phụ thuộc được cài đặt sẵn,
  cài đặt gói `file:`, cài đặt git có thực thi CLI, cập nhật tham chiếu git
  di chuyển, cài đặt từ registry npm với các phần phụ thuộc bắc cầu được nâng cấp,
  cập nhật npm không làm gì, từ chối siêu dữ liệu gói npm không hợp lệ,
  cài đặt từ fixture ClawHub cục bộ và cập nhật không làm gì, hành vi cập nhật marketplace,
  cũng như kích hoạt/kiểm tra gói Claude. Đặt `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` để
  giữ khối ClawHub biệt lập/ngoại tuyến.
- `test:docker:plugin-lifecycle-matrix` cài đặt gói ứng viên trong một vùng chứa
  trống, chạy một Plugin npm qua các bước cài đặt, kiểm tra, vô hiệu hóa, kích hoạt,
  nâng cấp tường minh, hạ cấp tường minh và gỡ cài đặt sau khi xóa mã Plugin.
  Luồng này ghi nhật ký các chỉ số RSS và CPU theo từng giai đoạn.
- `test:docker:plugin-update` xác thực rằng một Plugin đã cài đặt không thay đổi
  sẽ không được cài đặt lại hoặc mất siêu dữ liệu cài đặt trong quá trình `openclaw plugins update`.
- `test:docker:upgrade-survivor` cài đặt tarball ứng viên đè lên một fixture
  người dùng cũ có trạng thái không sạch, chạy cập nhật gói cùng doctor không tương tác, sau đó khởi động
  Gateway local loopback và kiểm tra việc bảo toàn trạng thái.
- `test:docker:published-upgrade-survivor` trước tiên cài đặt một đường cơ sở đã phát hành,
  cấu hình nó thông qua công thức `openclaw config set` được tích hợp sẵn, cập nhật lên
  tarball ứng viên, chạy doctor, kiểm tra việc dọn dẹp dữ liệu cũ, khởi động Gateway và
  dò `/healthz`, `/readyz` cùng trạng thái RPC.
- `test:docker:update-restart-auth` cài đặt gói ứng viên, khởi động một
  Gateway xác thực bằng token được quản lý, hủy đặt biến môi trường xác thực gateway của bên gọi cho
  `openclaw update --yes --json` và yêu cầu lệnh cập nhật ứng viên
  khởi động lại Gateway trước các phép dò thông thường.
- `test:docker:update-migration` là luồng cập nhật đã phát hành tập trung nhiều vào việc dọn dẹp. Luồng này
  bắt đầu từ trạng thái người dùng kiểu Discord/Telegram đã cấu hình, chạy doctor
  đường cơ sở để các phần phụ thuộc Plugin đã cấu hình có cơ hội hiện thực hóa, tạo sẵn
  phần dư thừa của phần phụ thuộc Plugin cũ cho một Plugin đóng gói đã cấu hình, cập nhật lên
  tarball ứng viên và yêu cầu doctor sau cập nhật xóa các thư mục gốc phần phụ thuộc
  cũ.

Các biến thể hữu ích của quy trình nâng cấp từ bản đã phát hành:

```bash
OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@2026.4.23 \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=versioned-runtime-deps \
pnpm test:docker:published-upgrade-survivor

OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@latest \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=bootstrap-persona \
pnpm test:docker:published-upgrade-survivor
```

Các kịch bản có sẵn: `base`, `acpx-openclaw-tools-bridge`, `feishu-channel`,
`bootstrap-persona`, `channel-post-core-restore`, `plugin-deps-cleanup`,
`configured-plugin-installs`, `stale-source-plugin-shadow`, `tilde-log-path`
và `versioned-runtime-deps`. Trong các lần chạy tổng hợp, `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues`
(bí danh `far-reaching`) mở rộng thành tất cả kịch bản, bao gồm cả
bước di chuyển cài đặt Plugin đã cấu hình.

Việc di chuyển cập nhật đầy đủ được chủ ý tách biệt khỏi CI Bản phát hành đầy đủ. Sử dụng
quy trình thủ công `Update Migration` khi câu hỏi về bản phát hành là "mọi
bản phát hành ổn định đã xuất bản từ 2026.4.23 trở đi có thể cập nhật lên ứng viên này và
dọn dẹp phần dư thừa của phần phụ thuộc Plugin không?":

```bash
gh workflow run update-migration.yml \
  --ref main \
  -f workflow_ref=main \
  -f package_ref=main \
  -f baselines=all-since-2026.4.23 \
  -f scenarios=plugin-deps-cleanup
```

## Chấp nhận gói

Chấp nhận gói là cổng gói nguyên bản của GitHub. Nó phân giải một gói ứng viên
thành tarball `package-under-test`, ghi lại phiên bản và SHA-256, sau đó
chạy các luồng Docker E2E có thể tái sử dụng đối với chính tarball đó. Tham chiếu bộ khung quy trình
tách biệt với tham chiếu nguồn gói, vì vậy logic kiểm thử hiện tại có thể xác thực
các bản phát hành đáng tin cậy cũ hơn.

Các nguồn ứng viên:

- `source=npm`: xác thực `openclaw@extended-stable`, `openclaw@beta`,
  `openclaw@latest` hoặc một phiên bản đã phát hành chính xác.
- `source=ref`: đóng gói một nhánh, thẻ hoặc commit đáng tin cậy bằng bộ khung hiện tại
  đã chọn.
- `source=url`: xác thực tarball HTTPS công khai với `package_sha256` bắt buộc.
  Đường dẫn này từ chối thông tin xác thực trong URL, cổng HTTPS không mặc định, tên máy chủ
  riêng tư/nội bộ hoặc kết quả DNS/IP tương ứng, không gian IP dùng cho mục đích đặc biệt và chuyển hướng không an toàn.
- `source=trusted-url`: xác thực tarball HTTPS với
  `package_sha256` và `trusted_source_id` bắt buộc dựa trên chính sách do người bảo trì sở hữu
  trong `.github/package-trusted-sources.json`. Sử dụng tùy chọn này cho các mirror doanh nghiệp/riêng tư
  thay vì làm suy yếu `source=url` bằng nút chuyển cho phép riêng tư ở cấp đầu vào.
  Xác thực Bearer, khi được cấu hình bằng chính sách, sử dụng secret
  `OPENCLAW_TRUSTED_PACKAGE_TOKEN` cố định.
- `source=artifact`: tái sử dụng tarball được tải lên bởi một lần chạy Actions khác.

Theo mặc định, Xác thực bản phát hành đầy đủ sử dụng `source=artifact`, được xây dựng từ
SHA bản phát hành đã phân giải. Để xác minh sau phát hành, truyền
`package_acceptance_package_spec=openclaw@YYYY.M.PATCH` để cùng ma trận nâng cấp
nhắm đến gói npm đã phát hành.

Các bước kiểm tra bản phát hành gọi Chấp nhận gói với tập hợp gói/cập nhật/khởi động lại/Plugin:

```text
doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor root-managed-vps-upgrade update-restart-auth plugins-offline plugin-update plugin-binding-command-escape
```

Khi thời gian theo dõi bản phát hành được bật (bắt buộc với `release_profile=stable` và
`full`), chúng cũng truyền:

```text
published_upgrade_survivor_baselines=last-stable-4 2026.4.23 2026.5.2 2026.4.15
published_upgrade_survivor_scenarios=reported-issues
telegram_mode=mock-openai
```

Điều này giữ việc di chuyển gói, chuyển kênh cập nhật, khả năng chịu lỗi của Plugin
được quản lý bị hỏng, dọn dẹp phần phụ thuộc Plugin lỗi thời, phạm vi bao phủ Plugin
ngoại tuyến, hành vi cập nhật Plugin và QA gói Telegram trên cùng một tạo phẩm đã phân giải mà không
buộc cổng gói phát hành mặc định phải duyệt qua mọi bản phát hành đã xuất bản.

`last-stable-4` phân giải thành bốn bản phát hành OpenClaw ổn định mới nhất
được xuất bản trên npm. Quy trình chấp nhận gói phát hành ghim `2026.4.23` làm ranh giới tương thích
cập nhật Plugin đầu tiên, `2026.5.2` làm ranh giới biến động kiến trúc Plugin và
`2026.4.15` làm đường cơ sở cập nhật đã phát hành cũ hơn thuộc chuỗi 2026.4.1x; trình phân giải
loại bỏ các ghim trùng đã có trong bốn bản mới nhất. Để có phạm vi bao phủ di chuyển
cập nhật đã phát hành toàn diện, hãy sử dụng `all-since-2026.4.23` trong quy trình Di chuyển
cập nhật riêng thay vì CI Bản phát hành đầy đủ. `release-history` vẫn
khả dụng để lấy mẫu thủ công rộng hơn khi bạn cũng muốn mốc neo cũ trước ngày đó.

Khi chọn nhiều đường cơ sở của quy trình nâng cấp từ bản đã phát hành, quy trình Docker
có thể tái sử dụng chia mỗi đường cơ sở thành một tác vụ trình chạy được nhắm mục tiêu riêng. Mỗi
phân đoạn đường cơ sở vẫn chạy tập kịch bản đã chọn, nhưng nhật ký và tạo phẩm được giữ
riêng theo đường cơ sở, còn thời gian chạy thực tế bị giới hạn bởi phân đoạn chậm nhất thay vì một tác vụ
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

Đối với bản canary extended-stable đã phát hành, đặt
`package_spec=openclaw@extended-stable`. Chấp nhận gói phân giải
bộ chọn đó thành một tarball chính xác trước khi các luồng Docker chạy.

Sử dụng `suite_profile=product` khi câu hỏi phát hành bao gồm các kênh MCP,
việc dọn dẹp cron/agent con, tìm kiếm web OpenAI hoặc OpenWebUI. Chỉ sử dụng `suite_profile=full`
khi bạn cần phạm vi bao phủ đầy đủ đường dẫn phát hành Docker.

## Mặc định phát hành

Đối với các ứng viên phát hành, ngăn xếp bằng chứng mặc định là:

1. `pnpm check:changed` và `pnpm test:changed` cho các hồi quy ở cấp mã nguồn.
2. `pnpm release:check` để kiểm tra tính toàn vẹn của tạo phẩm gói.
3. Hồ sơ Chấp nhận gói `package` hoặc các luồng gói tùy chỉnh của bước kiểm tra phát hành
   cho các hợp đồng cài đặt/cập nhật/khởi động lại/Plugin.
4. Các bước kiểm tra phát hành đa hệ điều hành cho hành vi riêng theo hệ điều hành của trình cài đặt, quy trình
   thiết lập ban đầu và nền tảng.
5. Chỉ chạy các bộ kiểm thử trực tiếp khi bề mặt thay đổi liên quan đến hành vi của nhà cung cấp hoặc dịch vụ
   được lưu trữ.

Trên máy của người bảo trì, các cổng kiểm tra rộng và bằng chứng sản phẩm Docker/gói nên chạy
trong Testbox, trừ khi đang thực hiện bằng chứng cục bộ một cách tường minh.

## Khả năng tương thích cũ

Mức nới lỏng tương thích có phạm vi hẹp và giới hạn thời gian:

- Các gói đến hết `2026.4.25`, bao gồm `2026.4.25-beta.*`, có thể chấp nhận
  các khoảng trống siêu dữ liệu gói đã phát hành trong Chấp nhận gói.
- Gói `2026.4.26` đã phát hành có thể cảnh báo về các tệp dấu siêu dữ liệu
  bản dựng cục bộ đã được phát hành.
- Các gói sau đó phải đáp ứng các hợp đồng hiện đại. Những khoảng trống tương tự sẽ gây lỗi thay vì
  cảnh báo hoặc bị bỏ qua.

Không thêm các bước di chuyển khởi động mới cho những hình dạng cũ này. Hãy thêm hoặc mở rộng một bước sửa chữa
của doctor, sau đó chứng minh bằng `upgrade-survivor`, `published-upgrade-survivor` hoặc
`update-restart-auth` khi lệnh cập nhật chịu trách nhiệm khởi động lại.

## Bổ sung phạm vi bao phủ

Khi thay đổi hành vi cập nhật hoặc Plugin, hãy thêm phạm vi bao phủ ở lớp thấp nhất có thể
thất bại vì đúng nguyên nhân:

- Logic thuần túy về đường dẫn hoặc siêu dữ liệu: kiểm thử đơn vị đặt cạnh mã nguồn.
- Danh mục gói hoặc hành vi của tệp đã đóng gói: kiểm thử `package-dist-inventory` hoặc kiểm thử trình kiểm tra tarball.
- Hành vi cài đặt/cập nhật qua CLI: xác nhận trong luồng Docker hoặc fixture.
- Hành vi di chuyển dữ liệu của bản phát hành đã xuất bản: kịch bản `published-upgrade-survivor`.
- Hành vi khởi động lại do quá trình cập nhật quản lý: `update-restart-auth`.
- Hành vi nguồn registry/gói: fixture `test:docker:plugins` hoặc máy chủ fixture ClawHub.
- Hành vi bố trí hoặc dọn dẹp phần phụ thuộc: xác nhận cả việc thực thi khi chạy và ranh giới hệ thống tệp. Các phần phụ thuộc npm có thể được đưa lên cấp cao hơn trong dự án npm do Plugin quản lý, vì vậy kiểm thử phải chứng minh rằng dự án đó được quét/dọn dẹp thay vì giả định chỉ có cây `node_modules` cục bộ trong gói Plugin.

Theo mặc định, hãy giữ các fixture Docker mới ở trạng thái khép kín. Sử dụng registry fixture cục bộ và các gói giả, trừ khi mục đích của kiểm thử là kiểm tra hành vi của registry trực tiếp.

## Phân loại lỗi

Bắt đầu bằng danh tính của cấu phần:

- Tóm tắt `resolve_package` của quy trình Chấp nhận gói: nguồn, phiên bản, SHA-256 và tên cấu phần.
- Cấu phần Docker: `.artifacts/docker-tests/**/summary.json`, `failures.json`, nhật ký luồng và các lệnh chạy lại.
- Tóm tắt quá trình duy trì sau nâng cấp: `.artifacts/upgrade-survivor/summary.json`, bao gồm phiên bản cơ sở, phiên bản ứng viên, kịch bản, thời gian của từng giai đoạn và mức độ bao phủ công thức cấu hình.

Ưu tiên chạy lại chính xác luồng bị lỗi với cùng cấu phần gói thay vì chạy lại toàn bộ bộ kiểm thử phát hành.
