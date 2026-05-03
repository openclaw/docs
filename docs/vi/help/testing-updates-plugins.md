---
read_when:
    - Thay đổi hành vi cập nhật OpenClaw, doctor, chấp nhận gói hoặc cài đặt Plugin
    - Chuẩn bị hoặc phê duyệt một ứng viên phát hành
    - Gỡ lỗi các hồi quy về cập nhật gói, dọn dẹp phụ thuộc Plugin hoặc cài đặt Plugin
sidebarTitle: Update and plugin tests
summary: Cách OpenClaw kiểm chứng các lộ trình cập nhật, quá trình di chuyển gói và hành vi cài đặt/cập nhật Plugin
title: 'Kiểm thử: bản cập nhật và Plugin'
x-i18n:
    generated_at: "2026-05-03T10:38:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 309ac7785a8d49db241989d28580887d3f6739982108af7148b624082c5f23dd
    source_path: help/testing-updates-plugins.md
    workflow: 16
---

Đây là danh sách kiểm tra chuyên dụng cho xác thực cập nhật và Plugin. Mục tiêu rất đơn giản: chứng minh gói có thể cài đặt có thể cập nhật trạng thái người dùng thực, sửa chữa trạng thái kế thừa đã cũ thông qua `doctor`, và vẫn cài đặt, tải, cập nhật, và gỡ cài đặt Plugin từ các nguồn được hỗ trợ.

Để xem bản đồ trình chạy kiểm thử rộng hơn, hãy xem [Kiểm thử](/vi/help/testing). Đối với khóa nhà cung cấp trực tiếp và các bộ kiểm thử chạm mạng, hãy xem [Kiểm thử trực tiếp](/vi/help/testing-live).

## Những gì chúng ta bảo vệ

Các kiểm thử cập nhật và Plugin bảo vệ các hợp đồng này:

- Một tarball gói phải đầy đủ, có `dist/postinstall-inventory.json` hợp lệ, và không phụ thuộc vào các tệp repo chưa được đóng gói.
- Người dùng có thể chuyển từ một gói đã phát hành cũ hơn sang gói ứng viên mà không mất cấu hình, tác tử, phiên, workspace, danh sách cho phép Plugin, hoặc cấu hình kênh.
- `openclaw doctor --fix --non-interactive` sở hữu các đường dẫn dọn dẹp và sửa chữa kế thừa. Khởi động không nên phát triển các migration tương thích ẩn cho trạng thái Plugin đã cũ.
- Cài đặt Plugin hoạt động từ thư mục cục bộ, repo git, gói npm, và đường dẫn registry ClawHub.
- Các phụ thuộc npm của Plugin được cài đặt trong gốc npm được quản lý, được quét trước khi tin cậy, và được loại bỏ thông qua npm trong quá trình gỡ cài đặt để các phụ thuộc được hoist không còn sót lại.
- Cập nhật Plugin ổn định khi không có gì thay đổi: bản ghi cài đặt, nguồn đã phân giải, bố cục phụ thuộc đã cài đặt, và trạng thái bật vẫn nguyên vẹn.

## Bằng chứng cục bộ trong quá trình phát triển

Bắt đầu hẹp:

```bash
pnpm changed:lanes --json
pnpm check:changed
pnpm test:changed
```

Đối với thay đổi về cài đặt, gỡ cài đặt, phụ thuộc, hoặc kiểm kê gói của Plugin, cũng chạy các kiểm thử tập trung bao phủ ranh giới đã chỉnh sửa:

```bash
pnpm test src/plugins/uninstall.test.ts src/infra/package-dist-inventory.test.ts test/scripts/package-acceptance-workflow.test.ts
```

Trước khi bất kỳ lane Docker gói nào tiêu thụ một tarball, hãy chứng minh artifact gói:

```bash
pnpm release:check
```

`release:check` chạy các kiểm tra drift cấu hình/tài liệu/API, ghi kiểm kê dist của gói, chạy `npm pack --dry-run`, từ chối các tệp bị cấm trong gói, cài đặt tarball vào một tiền tố tạm, chạy postinstall, và kiểm tra khói các entrypoint kênh đi kèm.

## Các lane Docker

Các lane Docker là bằng chứng ở cấp sản phẩm. Chúng cài đặt hoặc cập nhật một gói thực bên trong container Linux và xác nhận hành vi thông qua lệnh CLI, khởi động Gateway, probe HTTP, trạng thái RPC, và trạng thái hệ thống tệp.

Dùng các lane tập trung khi lặp:

```bash
pnpm test:docker:plugins
pnpm test:docker:plugin-lifecycle-matrix
pnpm test:docker:plugin-update
pnpm test:docker:upgrade-survivor
pnpm test:docker:published-upgrade-survivor
pnpm test:docker:update-migration
```

Các lane quan trọng:

- `test:docker:plugins` xác thực kiểm tra khói cài đặt Plugin, cài đặt thư mục cục bộ, hành vi bỏ qua cập nhật thư mục cục bộ, thư mục cục bộ có phụ thuộc được cài đặt sẵn, cài đặt gói `file:`, cài đặt git có thực thi CLI, cập nhật git moving-ref, cài đặt registry npm với phụ thuộc bắc cầu được hoist, no-op cập nhật npm, cài đặt fixture ClawHub cục bộ và no-op cập nhật, hành vi cập nhật marketplace, và bật/kiểm tra Claude-bundle. Đặt `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` để giữ khối ClawHub khép kín/ngoại tuyến.
- `test:docker:plugin-lifecycle-matrix` cài đặt gói ứng viên trong một container trống, chạy một Plugin npm qua cài đặt, kiểm tra, tắt, bật, nâng cấp rõ ràng, hạ cấp rõ ràng, và gỡ cài đặt sau khi xóa mã Plugin. Nó ghi log chỉ số RSS và CPU cho từng pha.
- `test:docker:plugin-update` xác thực rằng một Plugin đã cài đặt không đổi sẽ không cài đặt lại hoặc mất metadata cài đặt trong `openclaw plugins update`.
- `test:docker:upgrade-survivor` cài đặt tarball ứng viên lên trên fixture người dùng cũ bẩn, chạy cập nhật gói cộng với doctor không tương tác, sau đó khởi động Gateway local loopback và kiểm tra bảo toàn trạng thái.
- `test:docker:published-upgrade-survivor` trước tiên cài đặt một baseline đã phát hành, cấu hình nó thông qua một công thức `openclaw config set` được bake sẵn, cập nhật nó lên tarball ứng viên, chạy doctor, kiểm tra dọn dẹp kế thừa, khởi động Gateway, và probe `/healthz`, `/readyz`, và trạng thái RPC.
- `test:docker:update-migration` là lane cập nhật đã phát hành nặng về dọn dẹp. Nó bắt đầu từ trạng thái người dùng kiểu Discord/Telegram đã cấu hình, chạy doctor baseline để các phụ thuộc Plugin đã cấu hình có cơ hội hiện thực hóa, seed phần dư phụ thuộc Plugin kế thừa cho một Plugin đóng gói đã cấu hình, cập nhật lên tarball ứng viên, và yêu cầu doctor sau cập nhật loại bỏ các gốc phụ thuộc kế thừa.

Các biến thể published-upgrade survivor hữu ích:

```bash
OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@2026.4.23 \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=versioned-runtime-deps \
pnpm test:docker:published-upgrade-survivor

OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@latest \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=bootstrap-persona \
pnpm test:docker:published-upgrade-survivor
```

Các kịch bản khả dụng là `base`, `feishu-channel`, `bootstrap-persona`, `plugin-deps-cleanup`, `configured-plugin-installs`, `tilde-log-path`, và `versioned-runtime-deps`. Trong các lần chạy tổng hợp, `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` mở rộng thành tất cả các kịch bản có hình dạng sự cố đã báo cáo, bao gồm migration cài đặt Plugin đã cấu hình.

Migration cập nhật đầy đủ được tách riêng có chủ ý khỏi Full Release CI. Dùng workflow thủ công `Update Migration` khi câu hỏi phát hành là "mọi bản phát hành stable đã công bố từ 2026.4.23 trở đi có thể cập nhật lên ứng viên này và dọn sạch phần dư phụ thuộc Plugin không?":

```bash
gh workflow run update-migration.yml \
  --ref main \
  -f workflow_ref=main \
  -f package_ref=main \
  -f baselines=all-since-2026.4.23 \
  -f scenarios=plugin-deps-cleanup
```

## Package Acceptance

Package Acceptance là cổng gói gốc GitHub. Nó phân giải một gói ứng viên thành tarball `package-under-test`, ghi lại phiên bản và SHA-256, sau đó chạy các lane Docker E2E có thể tái sử dụng trên đúng tarball đó. Ref của harness workflow tách biệt với ref nguồn gói, vì vậy logic kiểm thử hiện tại có thể xác thực các bản phát hành tin cậy cũ hơn.

Nguồn ứng viên:

- `source=npm`: xác thực `openclaw@beta`, `openclaw@latest`, hoặc một phiên bản đã phát hành chính xác.
- `source=ref`: đóng gói một nhánh, tag, hoặc commit tin cậy với harness hiện tại đã chọn.
- `source=url`: xác thực một tarball HTTPS với `package_sha256` bắt buộc.
- `source=artifact`: tái sử dụng tarball được tải lên bởi một lần chạy Actions khác.

Full Release Validation dùng `source=artifact` theo mặc định, được dựng từ release SHA đã phân giải. Để chứng minh sau phát hành, truyền `package_acceptance_package_spec=openclaw@YYYY.M.D` để cùng ma trận nâng cấp nhắm tới gói npm đã ship.

Các kiểm tra phát hành gọi Package Acceptance với bộ package/update/Plugin:

```text
doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update
```

Chúng cũng truyền:

```text
published_upgrade_survivor_baselines=all-since-2026.4.23
published_upgrade_survivor_scenarios=reported-issues
telegram_mode=mock-openai
```

Điều này giữ migration gói, chuyển kênh cập nhật, dọn dẹp phụ thuộc Plugin đã cũ, độ bao phủ Plugin ngoại tuyến, hành vi cập nhật Plugin, và QA gói Telegram trên cùng artifact đã phân giải.

`all-since-2026.4.23` là mẫu nâng cấp Full Release CI: mọi bản phát hành stable đã công bố trên npm từ `2026.4.23` đến `latest`. Để có độ bao phủ migration cập nhật đã phát hành đầy đủ, hãy dùng `all-since-2026.4.23` trong workflow Update Migration riêng thay vì Full Release CI. `release-history` vẫn khả dụng cho việc lấy mẫu rộng hơn thủ công khi bạn cũng muốn anchor kế thừa trước ngày đó.

Chạy thủ công một hồ sơ gói khi xác thực ứng viên trước phát hành:

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

Dùng `suite_profile=product` khi câu hỏi phát hành bao gồm kênh MCP, dọn dẹp cron/subagent, tìm kiếm web OpenAI, hoặc OpenWebUI. Chỉ dùng `suite_profile=full` khi bạn cần độ bao phủ đầy đủ đường dẫn phát hành Docker.

## Mặc định phát hành

Đối với ứng viên phát hành, stack bằng chứng mặc định là:

1. `pnpm check:changed` và `pnpm test:changed` cho hồi quy cấp nguồn.
2. `pnpm release:check` cho tính toàn vẹn artifact gói.
3. Hồ sơ Package Acceptance `package` hoặc các lane gói tùy chỉnh release-check cho hợp đồng cài đặt/cập nhật/Plugin.
4. Kiểm tra phát hành đa hệ điều hành cho trình cài đặt, onboarding, và hành vi nền tảng theo hệ điều hành.
5. Bộ kiểm thử trực tiếp chỉ khi bề mặt thay đổi chạm vào hành vi nhà cung cấp hoặc dịch vụ được lưu trữ.

Trên máy maintainer, các cổng rộng và bằng chứng sản phẩm Docker/gói nên chạy trong Testbox trừ khi rõ ràng đang làm bằng chứng cục bộ.

## Tương thích kế thừa

Độ khoan dung tương thích hẹp và có giới hạn thời gian:

- Các gói đến `2026.4.25`, bao gồm `2026.4.25-beta.*`, có thể chấp nhận các khoảng trống metadata gói đã ship trong Package Acceptance.
- Gói `2026.4.26` đã phát hành có thể cảnh báo về các tệp dấu metadata build cục bộ đã ship.
- Các gói sau đó phải đáp ứng các hợp đồng hiện đại. Cùng các khoảng trống đó sẽ thất bại thay vì cảnh báo hoặc bỏ qua.

Không thêm migration khởi động mới cho các hình dạng cũ này. Thêm hoặc mở rộng một sửa chữa doctor, rồi chứng minh bằng `upgrade-survivor` hoặc `published-upgrade-survivor`.

## Thêm độ bao phủ

Khi thay đổi hành vi cập nhật hoặc Plugin, hãy thêm độ bao phủ ở lớp thấp nhất có thể thất bại vì đúng lý do:

- Logic đường dẫn hoặc metadata thuần túy: kiểm thử đơn vị cạnh nguồn.
- Hành vi kiểm kê gói hoặc tệp được đóng gói: kiểm thử `package-dist-inventory` hoặc trình kiểm tra tarball.
- Hành vi cài đặt/cập nhật CLI: assertion hoặc fixture lane Docker.
- Hành vi migration bản phát hành đã công bố: kịch bản `published-upgrade-survivor`.
- Hành vi nguồn registry/gói: fixture `test:docker:plugins` hoặc máy chủ fixture ClawHub.
- Hành vi bố cục hoặc dọn dẹp phụ thuộc: xác nhận cả thực thi runtime và ranh giới hệ thống tệp. Phụ thuộc npm có thể được hoist dưới gốc npm được quản lý, vì vậy kiểm thử nên chứng minh gốc được quét/dọn thay vì giả định cây `node_modules` cục bộ của gói.

Giữ các fixture Docker mới khép kín theo mặc định. Dùng registry fixture cục bộ và gói giả trừ khi mục tiêu của kiểm thử là hành vi registry trực tiếp.

## Phân loại lỗi

Bắt đầu với định danh artifact:

- Tóm tắt `resolve_package` của Package Acceptance: nguồn, phiên bản, SHA-256, và tên artifact.
- Artifact Docker: `.artifacts/docker-tests/**/summary.json`, `failures.json`, log lane, và lệnh chạy lại.
- Tóm tắt upgrade survivor: `.artifacts/upgrade-survivor/summary.json`, bao gồm phiên bản baseline, phiên bản ứng viên, kịch bản, thời gian pha, và các bước công thức.

Ưu tiên chạy lại đúng lane đã thất bại với cùng artifact gói hơn là chạy lại toàn bộ ô phát hành.
