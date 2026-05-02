---
read_when:
    - Thay đổi hành vi cập nhật OpenClaw, doctor, chấp nhận gói hoặc cài đặt Plugin
    - Chuẩn bị hoặc phê duyệt bản phát hành ứng viên
    - Gỡ lỗi các hồi quy về cập nhật gói, dọn dẹp phụ thuộc Plugin hoặc cài đặt Plugin
sidebarTitle: Update and plugin tests
summary: Cách OpenClaw xác thực các đường dẫn cập nhật, quá trình chuyển đổi gói và hành vi cài đặt/cập nhật Plugin
title: 'Kiểm thử: các bản cập nhật và Plugin'
x-i18n:
    generated_at: "2026-05-02T10:44:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: b1999106b52d2539a6ee0fd7cd88ebb3515c8726e080d4031d7bf421fb99de36
    source_path: help/testing-updates-plugins.md
    workflow: 16
---

Đây là danh sách kiểm tra chuyên dụng cho xác thực cập nhật và Plugin. Mục tiêu rất đơn giản: chứng minh rằng gói có thể cài đặt có thể cập nhật trạng thái người dùng thật, sửa chữa trạng thái cũ lỗi thời thông qua `doctor`, và vẫn cài đặt, tải, cập nhật, cũng như gỡ cài đặt Plugin từ các nguồn được hỗ trợ.

Để xem bản đồ trình chạy kiểm thử rộng hơn, xem [Kiểm thử](/vi/help/testing). Với khóa nhà cung cấp trực tiếp và các bộ kiểm thử chạm đến mạng, xem [Kiểm thử trực tiếp](/vi/help/testing-live).

## Những gì chúng ta bảo vệ

Các kiểm thử cập nhật và Plugin bảo vệ những hợp đồng này:

- Tarball gói đầy đủ, có `dist/postinstall-inventory.json` hợp lệ, và không phụ thuộc vào các tệp repo chưa được đóng gói.
- Người dùng có thể chuyển từ một gói đã phát hành cũ hơn sang gói ứng viên mà không mất cấu hình, agent, phiên, workspace, danh sách cho phép Plugin, hoặc cấu hình kênh.
- `openclaw doctor --fix --non-interactive` sở hữu các đường dẫn dọn dẹp và sửa chữa legacy. Khởi động không nên phát sinh các migration tương thích ẩn cho trạng thái Plugin lỗi thời.
- Cài đặt Plugin hoạt động từ thư mục cục bộ, repo git, gói npm, và đường dẫn sổ đăng ký ClawHub.
- Các phụ thuộc npm của Plugin được cài đặt trong gốc npm được quản lý, được quét trước khi tin cậy, và được xóa thông qua npm trong quá trình gỡ cài đặt để các phụ thuộc được hoist không còn sót lại.
- Cập nhật Plugin ổn định khi không có gì thay đổi: bản ghi cài đặt, nguồn đã phân giải, bố cục phụ thuộc đã cài đặt, và trạng thái bật vẫn được giữ nguyên.

## Bằng chứng cục bộ trong quá trình phát triển

Bắt đầu hẹp:

```bash
pnpm changed:lanes --json
pnpm check:changed
pnpm test:changed
```

Với các thay đổi về cài đặt, gỡ cài đặt, phụ thuộc, hoặc package-inventory của Plugin, cũng chạy các kiểm thử tập trung bao phủ ranh giới đã chỉnh sửa:

```bash
pnpm test src/plugins/uninstall.test.ts src/infra/package-dist-inventory.test.ts test/scripts/package-acceptance-workflow.test.ts
```

Trước khi bất kỳ lane Docker gói nào tiêu thụ một tarball, hãy chứng minh artifact gói:

```bash
pnpm release:check
```

`release:check` chạy kiểm tra drift cấu hình/tài liệu/API, ghi inventory dist của gói, chạy `npm pack --dry-run`, từ chối các tệp bị cấm đã đóng gói, cài đặt tarball vào một prefix tạm, chạy postinstall, và smoke các entrypoint kênh đi kèm.

## Lane Docker

Các lane Docker là bằng chứng cấp sản phẩm. Chúng cài đặt hoặc cập nhật một gói thật bên trong container Linux và xác nhận hành vi thông qua lệnh CLI, khởi động Gateway, probe HTTP, trạng thái RPC, và trạng thái hệ thống tệp.

Dùng các lane tập trung khi lặp:

```bash
pnpm test:docker:plugins
pnpm test:docker:plugin-update
pnpm test:docker:upgrade-survivor
pnpm test:docker:published-upgrade-survivor
pnpm test:docker:update-migration
```

Các lane quan trọng:

- `test:docker:plugins` xác thực smoke cài đặt Plugin, cài đặt thư mục cục bộ, hành vi bỏ qua cập nhật thư mục cục bộ, thư mục cục bộ có phụ thuộc được cài sẵn, cài đặt gói `file:`, cài đặt git có thực thi CLI, cập nhật git moving-ref, cài đặt sổ đăng ký npm với các phụ thuộc bắc cầu được hoist, npm update no-op, cài đặt fixture ClawHub cục bộ và update no-op, hành vi cập nhật marketplace, và bật/kiểm tra Claude-bundle. Đặt `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` để giữ khối ClawHub hermetic/offline.
- `test:docker:plugin-update` xác thực rằng một Plugin đã cài đặt không đổi sẽ không được cài đặt lại hoặc mất siêu dữ liệu cài đặt trong `openclaw plugins update`.
- `test:docker:upgrade-survivor` cài đặt tarball ứng viên đè lên một fixture người dùng cũ bẩn, chạy cập nhật gói cộng với doctor không tương tác, sau đó khởi động Gateway loopback và kiểm tra việc bảo toàn trạng thái.
- `test:docker:published-upgrade-survivor` trước tiên cài đặt một baseline đã phát hành, cấu hình nó thông qua một công thức `openclaw config set` được nướng sẵn, cập nhật nó lên tarball ứng viên, chạy doctor, kiểm tra dọn dẹp legacy, khởi động Gateway, và probe `/healthz`, `/readyz`, cùng trạng thái RPC.
- `test:docker:update-migration` là lane cập nhật đã phát hành tập trung nhiều vào dọn dẹp. Nó bắt đầu từ trạng thái người dùng kiểu Discord/Telegram đã cấu hình, chạy doctor baseline để các phụ thuộc Plugin đã cấu hình có cơ hội hiện thực hóa, seed phần vụn phụ thuộc Plugin legacy cho một Plugin đóng gói đã cấu hình, cập nhật lên tarball ứng viên, và yêu cầu doctor sau cập nhật xóa các gốc phụ thuộc legacy.

Các biến thể published-upgrade survivor hữu ích:

```bash
OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@2026.4.23 \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=versioned-runtime-deps \
pnpm test:docker:published-upgrade-survivor

OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@latest \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=bootstrap-persona \
pnpm test:docker:published-upgrade-survivor
```

Các kịch bản có sẵn là `base`, `feishu-channel`, `bootstrap-persona`, `plugin-deps-cleanup`, `tilde-log-path`, và `versioned-runtime-deps`. Trong các lần chạy tổng hợp, `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` mở rộng thành tất cả các kịch bản có hình dạng vấn đề đã báo cáo.

Migration cập nhật đầy đủ được tách riêng có chủ ý khỏi CI phát hành đầy đủ. Dùng workflow thủ công `Update Migration` khi câu hỏi phát hành là "mọi bản phát hành ổn định đã xuất bản từ 2026.4.23 trở đi có thể cập nhật lên ứng viên này và dọn dẹp phần vụn phụ thuộc Plugin không?":

```bash
gh workflow run update-migration.yml \
  --ref main \
  -f workflow_ref=main \
  -f package_ref=main \
  -f baselines=all-since-2026.4.23 \
  -f scenarios=plugin-deps-cleanup
```

## Chấp nhận gói

Chấp nhận gói là cổng gói gốc GitHub. Nó phân giải một gói ứng viên thành tarball `package-under-test`, ghi lại phiên bản và SHA-256, rồi chạy các lane Docker E2E có thể tái sử dụng với chính tarball đó. Ref harness workflow tách biệt với ref nguồn gói, nên logic kiểm thử hiện tại có thể xác thực các bản phát hành tin cậy cũ hơn.

Nguồn ứng viên:

- `source=npm`: xác thực `openclaw@beta`, `openclaw@latest`, hoặc một phiên bản đã phát hành chính xác.
- `source=ref`: đóng gói một nhánh, tag, hoặc commit tin cậy bằng harness hiện tại đã chọn.
- `source=url`: xác thực một tarball HTTPS với `package_sha256` bắt buộc.
- `source=artifact`: tái sử dụng một tarball đã được tải lên bởi một lần chạy Actions khác.

Các kiểm tra phát hành gọi Chấp nhận gói với tập gói/cập nhật/Plugin:

```text
doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update
```

Chúng cũng truyền:

```text
published_upgrade_survivor_baselines=release-history
published_upgrade_survivor_scenarios=reported-issues
telegram_mode=mock-openai
```

Điều này giữ migration gói, chuyển kênh cập nhật, dọn dẹp phụ thuộc Plugin lỗi thời, độ bao phủ Plugin offline, hành vi cập nhật Plugin, và QA gói Telegram trên cùng một artifact đã phân giải.

`release-history` là một mẫu kiểm tra phát hành có giới hạn: sáu bản phát hành ổn định mới nhất, `2026.4.23`, và một mốc cũ hơn trước ngày đó. Để có độ bao phủ migration cập nhật đã phát hành toàn diện, dùng `all-since-2026.4.23` trong workflow Update Migration riêng thay vì CI phát hành đầy đủ.

Chạy thủ công một hồ sơ gói khi xác thực ứng viên trước phát hành:

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=package \
  -f published_upgrade_survivor_baselines=release-history \
  -f published_upgrade_survivor_scenarios=reported-issues \
  -f telegram_mode=mock-openai
```

Dùng `suite_profile=product` khi câu hỏi phát hành bao gồm các kênh MCP, dọn dẹp cron/subagent, tìm kiếm web OpenAI, hoặc OpenWebUI. Chỉ dùng `suite_profile=full` khi bạn cần độ bao phủ đầy đủ cho đường dẫn phát hành Docker.

## Mặc định phát hành

Với ứng viên phát hành, chồng bằng chứng mặc định là:

1. `pnpm check:changed` và `pnpm test:changed` cho hồi quy cấp nguồn.
2. `pnpm release:check` cho tính toàn vẹn artifact gói.
3. Hồ sơ Chấp nhận gói `package` hoặc các lane gói tùy chỉnh của kiểm tra phát hành cho hợp đồng cài đặt/cập nhật/Plugin.
4. Kiểm tra phát hành đa hệ điều hành cho trình cài đặt, onboarding, và hành vi nền tảng đặc thù hệ điều hành.
5. Các bộ trực tiếp chỉ khi bề mặt đã thay đổi chạm đến hành vi nhà cung cấp hoặc dịch vụ được lưu trữ.

Trên máy maintainer, các cổng rộng và bằng chứng sản phẩm Docker/gói nên chạy trong Testbox trừ khi đang làm bằng chứng cục bộ một cách rõ ràng.

## Tương thích legacy

Sự khoan dung tương thích hẹp và có giới hạn thời gian:

- Các gói đến `2026.4.25`, bao gồm `2026.4.25-beta.*`, có thể dung thứ các khoảng trống siêu dữ liệu gói đã phát hành trong Chấp nhận gói.
- Gói `2026.4.26` đã phát hành có thể cảnh báo về các tệp dấu siêu dữ liệu bản dựng cục bộ đã phát hành.
- Các gói sau đó phải đáp ứng các hợp đồng hiện đại. Những khoảng trống tương tự sẽ thất bại thay vì cảnh báo hoặc bỏ qua.

Không thêm migration khởi động mới cho các hình dạng cũ này. Thêm hoặc mở rộng một sửa chữa bằng doctor, rồi chứng minh nó bằng `upgrade-survivor` hoặc `published-upgrade-survivor`.

## Thêm độ bao phủ

Khi thay đổi hành vi cập nhật hoặc Plugin, thêm độ bao phủ ở lớp thấp nhất có thể thất bại vì đúng lý do:

- Logic đường dẫn hoặc siêu dữ liệu thuần túy: kiểm thử đơn vị bên cạnh nguồn.
- Hành vi package inventory hoặc packed-file: `package-dist-inventory` hoặc kiểm thử bộ kiểm tra tarball.
- Hành vi cài đặt/cập nhật CLI: assertion hoặc fixture lane Docker.
- Hành vi migration bản phát hành đã xuất bản: kịch bản `published-upgrade-survivor`.
- Hành vi nguồn registry/gói: fixture `test:docker:plugins` hoặc máy chủ fixture ClawHub.
- Hành vi bố cục hoặc dọn dẹp phụ thuộc: xác nhận cả thực thi runtime và ranh giới hệ thống tệp. Phụ thuộc npm có thể được hoist dưới gốc npm được quản lý, nên kiểm thử cần chứng minh gốc được quét/dọn dẹp thay vì giả định một cây `node_modules` cục bộ theo gói.

Giữ các fixture Docker mới mặc định là hermetic. Dùng registry fixture cục bộ và gói giả trừ khi mục tiêu của kiểm thử là hành vi registry trực tiếp.

## Phân loại lỗi

Bắt đầu với danh tính artifact:

- Tóm tắt `resolve_package` của Chấp nhận gói: nguồn, phiên bản, SHA-256, và tên artifact.
- Artifact Docker: `.artifacts/docker-tests/**/summary.json`, `failures.json`, nhật ký lane, và lệnh chạy lại.
- Tóm tắt upgrade survivor: `.artifacts/upgrade-survivor/summary.json`, bao gồm phiên bản baseline, phiên bản ứng viên, kịch bản, thời gian từng phase, và các bước công thức.

Ưu tiên chạy lại đúng lane đã thất bại với cùng artifact gói hơn là chạy lại toàn bộ ô phát hành.
