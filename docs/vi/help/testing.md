---
read_when:
    - Chạy kiểm thử cục bộ hoặc trong CI
    - Thêm kiểm thử hồi quy cho các lỗi về mô hình/nhà cung cấp
    - Gỡ lỗi hành vi của Gateway + tác tử
summary: 'Bộ công cụ kiểm thử: các bộ kiểm thử đơn vị, e2e và trực tiếp, trình chạy Docker, và phạm vi bao phủ của từng kiểm thử'
title: Kiểm thử
x-i18n:
    generated_at: "2026-04-30T18:38:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 470a96c6b47c2708950d05adc4a4efba5fe290f0675a131e2888d2d0032d5953
    source_path: help/testing.md
    workflow: 16
---

OpenClaw có ba bộ kiểm thử Vitest (đơn vị/tích hợp, e2e, live) và một nhóm nhỏ
các trình chạy Docker. Tài liệu này là hướng dẫn "cách chúng tôi kiểm thử":

- Mỗi bộ kiểm thử bao phủ những gì (và những gì nó chủ ý _không_ bao phủ).
- Các lệnh cần chạy cho những quy trình làm việc phổ biến (cục bộ, trước khi đẩy, gỡ lỗi).
- Cách kiểm thử live phát hiện thông tin xác thực và chọn mô hình/nhà cung cấp.
- Cách thêm hồi quy cho các vấn đề mô hình/nhà cung cấp trong thực tế.

<Note>
**Ngăn xếp QA (qa-lab, qa-channel, các lane truyền tải live)** được ghi lại riêng:

- [Tổng quan QA](/vi/concepts/qa-e2e-automation) — kiến trúc, bề mặt lệnh, viết kịch bản.
- [QA ma trận](/vi/concepts/qa-matrix) — tài liệu tham chiếu cho `pnpm openclaw qa matrix`.
- [Kênh QA](/vi/channels/qa-channel) — Plugin truyền tải tổng hợp được dùng bởi các kịch bản dựa trên repo.

Trang này bao phủ việc chạy các bộ kiểm thử thông thường và các trình chạy Docker/Parallels. Mục trình chạy riêng cho QA bên dưới ([Trình chạy riêng cho QA](#qa-specific-runners)) liệt kê các lệnh gọi `qa` cụ thể và trỏ lại các tài liệu tham chiếu ở trên.
</Note>

## Bắt đầu nhanh

Hầu hết các ngày:

- Cổng kiểm tra đầy đủ (dự kiến trước khi đẩy): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Chạy toàn bộ bộ kiểm thử cục bộ nhanh hơn trên máy dư tài nguyên: `pnpm test:max`
- Vòng lặp theo dõi Vitest trực tiếp: `pnpm test:watch`
- Nhắm mục tiêu tệp trực tiếp hiện cũng định tuyến cả đường dẫn phần mở rộng/kênh: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Ưu tiên các lần chạy nhắm mục tiêu trước khi bạn đang lặp trên một lỗi đơn lẻ.
- Site QA dựa trên Docker: `pnpm qa:lab:up`
- Lane QA dựa trên máy ảo Linux: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Khi bạn chạm vào kiểm thử hoặc muốn thêm độ tin cậy:

- Cổng kiểm tra độ bao phủ: `pnpm test:coverage`
- Bộ E2E: `pnpm test:e2e`

Khi gỡ lỗi các nhà cung cấp/mô hình thực (yêu cầu thông tin xác thực thật):

- Bộ live (mô hình + các phép dò công cụ/hình ảnh Gateway): `pnpm test:live`
- Nhắm một tệp live trong im lặng: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Quét mô hình live bằng Docker: `pnpm test:docker:live-models`
  - Mỗi mô hình được chọn giờ chạy một lượt văn bản cùng một phép dò nhỏ kiểu đọc tệp.
    Các mô hình có siêu dữ liệu quảng bá đầu vào `image` cũng chạy một lượt hình ảnh nhỏ.
    Tắt các phép dò bổ sung bằng `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` hoặc
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` khi cô lập lỗi nhà cung cấp.
  - Bao phủ CI: `OpenClaw Scheduled Live And E2E Checks` hằng ngày và
    `OpenClaw Release Checks` thủ công đều gọi workflow live/E2E tái sử dụng với
    `include_live_suites: true`, bao gồm các job ma trận mô hình live Docker riêng
    được chia shard theo nhà cung cấp.
  - Với các lần chạy lại CI có trọng tâm, kích hoạt `OpenClaw Live And E2E Checks (Reusable)`
    với `include_live_suites: true` và `live_models_only: true`.
  - Thêm các bí mật nhà cung cấp tín hiệu cao mới vào `scripts/ci-hydrate-live-auth.sh`
    cùng `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` và các
    trình gọi theo lịch/phát hành của nó.
- Kiểm thử khói trò chuyện ràng buộc Codex gốc: `pnpm test:docker:live-codex-bind`
  - Chạy một lane live Docker trên đường dẫn app-server Codex, ràng buộc một
    DM Slack tổng hợp bằng `/codex bind`, thực thi `/codex fast` và
    `/codex permissions`, rồi xác minh một phản hồi thuần và một tệp đính kèm hình ảnh
    đi qua ràng buộc Plugin gốc thay vì ACP.
- Kiểm thử khói harness app-server Codex: `pnpm test:docker:live-codex-harness`
  - Chạy các lượt tác tử Gateway qua harness app-server Codex do Plugin sở hữu,
    xác minh `/codex status` và `/codex models`, và theo mặc định thực thi các phép dò hình ảnh,
    cron MCP, sub-agent và Guardian. Tắt phép dò sub-agent bằng
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` khi cô lập các lỗi app-server Codex khác. Với một kiểm tra sub-agent có trọng tâm, tắt các phép dò khác:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    Lệnh này thoát sau phép dò sub-agent trừ khi
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` được đặt.
- Kiểm thử khói lệnh cứu hộ Crestodian: `pnpm test:live:crestodian-rescue-channel`
  - Kiểm tra chọn tham gia nhiều lớp bảo vệ cho bề mặt lệnh cứu hộ kênh tin nhắn.
    Nó thực thi `/crestodian status`, đưa vào hàng đợi một thay đổi mô hình bền vững,
    trả lời `/crestodian yes`, và xác minh đường dẫn ghi kiểm toán/cấu hình.
- Kiểm thử khói Docker trình lập kế hoạch Crestodian: `pnpm test:docker:crestodian-planner`
  - Chạy Crestodian trong container không có cấu hình với Claude CLI giả trên `PATH`
    và xác minh fallback trình lập kế hoạch mờ được chuyển thành thao tác ghi cấu hình
    có kiểu và được kiểm toán.
- Kiểm thử khói Docker lần chạy đầu tiên Crestodian: `pnpm test:docker:crestodian-first-run`
  - Bắt đầu từ thư mục trạng thái OpenClaw trống, định tuyến `openclaw` trần tới
    Crestodian, áp dụng thiết lập/mô hình/tác tử/Plugin Discord + các ghi SecretRef,
    xác thực cấu hình và xác minh các mục kiểm toán. Cùng đường dẫn thiết lập Ring 0
    cũng được bao phủ trong QA Lab bởi
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Kiểm thử khói chi phí Moonshot/Kimi: với `MOONSHOT_API_KEY` được đặt, chạy
  `openclaw models list --provider moonshot --json`, rồi chạy một
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  cô lập trên `moonshot/kimi-k2.6`. Xác minh JSON báo cáo Moonshot/K2.6 và bản ghi hội thoại trợ lý lưu `usage.cost` đã chuẩn hóa.

<Tip>
Khi bạn chỉ cần một trường hợp lỗi, hãy ưu tiên thu hẹp kiểm thử live qua các biến môi trường allowlist được mô tả bên dưới.
</Tip>

## Trình chạy riêng cho QA

Các lệnh này nằm cạnh các bộ kiểm thử chính khi bạn cần tính thực tế của QA-lab:

CI chạy QA Lab trong các workflow chuyên dụng. `Parity gate` chạy trên các PR khớp điều kiện và
từ kích hoạt thủ công với nhà cung cấp giả lập. `QA-Lab - All Lanes` chạy hằng đêm trên
`main` và từ kích hoạt thủ công với cổng tương đồng giả lập, lane Matrix live,
lane Telegram live do Convex quản lý và lane Discord live do Convex quản lý dưới dạng
các job song song. QA theo lịch và các kiểm tra phát hành truyền Matrix `--profile fast`
một cách rõ ràng, trong khi mặc định đầu vào workflow thủ công và Matrix CLI vẫn là
`all`; kích hoạt thủ công có thể chia shard `all` thành các job `transport`, `media`, `e2ee-smoke`,
`e2ee-deep`, và `e2ee-cli`. `OpenClaw Release Checks` chạy tương đồng cùng
các lane Matrix nhanh và Telegram trước khi phê duyệt phát hành, dùng
`mock-openai/gpt-5.5` cho các kiểm tra truyền tải phát hành để chúng duy trì tính xác định
và tránh khởi động Plugin nhà cung cấp thông thường. Các Gateway truyền tải live này tắt
tìm kiếm bộ nhớ; hành vi bộ nhớ vẫn được bao phủ bởi các bộ tương đồng QA.

Các shard phương tiện live phát hành đầy đủ dùng
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, vốn đã có
`ffmpeg` và `ffprobe`. Các shard mô hình/backend live Docker dùng image dùng chung
`ghcr.io/openclaw/openclaw-live-test:<sha>` được xây dựng một lần cho mỗi commit được chọn,
sau đó kéo image đó với `OPENCLAW_SKIP_DOCKER_BUILD=1` thay vì xây dựng lại
bên trong từng shard.

- `pnpm openclaw qa suite`
  - Chạy trực tiếp các kịch bản QA dựa trên repo trên máy chủ.
  - Chạy nhiều kịch bản được chọn song song theo mặc định với các worker Gateway
    cô lập. `qa-channel` mặc định concurrency 4 (giới hạn bởi số lượng kịch bản
    được chọn). Dùng `--concurrency <count>` để tinh chỉnh số lượng worker,
    hoặc `--concurrency 1` cho lane nối tiếp cũ hơn.
  - Thoát khác không khi bất kỳ kịch bản nào thất bại. Dùng `--allow-failures` khi bạn
    muốn hiện vật mà không có mã thoát thất bại.
  - Hỗ trợ các chế độ nhà cung cấp `live-frontier`, `mock-openai`, và `aimock`.
    `aimock` khởi động một máy chủ nhà cung cấp cục bộ dựa trên AIMock cho độ bao phủ
    fixture thử nghiệm và mock giao thức mà không thay thế lane `mock-openai`
    nhận biết kịch bản.
- `pnpm test:gateway:cpu-scenarios`
  - Chạy benchmark khởi động Gateway cùng một gói nhỏ kịch bản QA Lab giả lập
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) và ghi một bản tóm tắt quan sát CPU kết hợp
    dưới `.artifacts/gateway-cpu-scenarios/`.
  - Chỉ gắn cờ các quan sát CPU nóng kéo dài theo mặc định (`--cpu-core-warn`
    cộng `--hot-wall-warn-ms`), nên các đợt tăng ngắn khi khởi động được ghi nhận
    như số liệu mà không trông giống hồi quy Gateway bị ghim CPU kéo dài nhiều phút.
  - Dùng hiện vật `dist` đã xây dựng; hãy chạy build trước khi checkout chưa có
    đầu ra runtime mới.
- `pnpm openclaw qa suite --runner multipass`
  - Chạy cùng bộ QA bên trong một máy ảo Linux Multipass dùng một lần.
  - Giữ cùng hành vi chọn kịch bản như `qa suite` trên máy chủ.
  - Tái sử dụng cùng các cờ chọn nhà cung cấp/mô hình như `qa suite`.
  - Các lần chạy live chuyển tiếp những đầu vào xác thực QA được hỗ trợ và khả thi cho máy khách:
    khóa nhà cung cấp dựa trên env, đường dẫn cấu hình nhà cung cấp live QA, và `CODEX_HOME`
    khi có.
  - Thư mục đầu ra phải nằm dưới gốc repo để máy khách có thể ghi ngược qua
    workspace được mount.
  - Ghi báo cáo + tóm tắt QA thông thường cùng nhật ký Multipass dưới
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Khởi động site QA dựa trên Docker cho công việc QA kiểu vận hành viên.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Xây dựng một tarball npm từ checkout hiện tại, cài đặt nó toàn cục trong
    Docker, chạy onboarding khóa OpenAI API không tương tác, cấu hình Telegram
    theo mặc định, xác minh việc bật Plugin sẽ cài đặt các phụ thuộc runtime theo
    nhu cầu, chạy doctor, và chạy một lượt tác tử cục bộ trên endpoint OpenAI
    được giả lập.
  - Dùng `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` để chạy cùng lane cài đặt gói
    với Discord.
- `pnpm test:docker:session-runtime-context`
  - Chạy một kiểm thử khói Docker ứng dụng đã xây dựng có tính xác định cho các
    bản ghi hội thoại ngữ cảnh runtime nhúng. Nó xác minh ngữ cảnh runtime OpenClaw
    ẩn được lưu bền vững dưới dạng tin nhắn tùy chỉnh không hiển thị thay vì rò rỉ
    vào lượt người dùng thấy được, sau đó gieo một JSONL phiên lỗi bị ảnh hưởng và
    xác minh `openclaw doctor --fix` viết lại nó về nhánh hoạt động với một bản sao lưu.
- `pnpm test:docker:npm-telegram-live`
  - Cài đặt một ứng viên gói OpenClaw trong Docker, chạy onboarding gói đã cài đặt,
    cấu hình Telegram qua CLI đã cài đặt, rồi tái sử dụng lane QA Telegram live với
    gói đã cài đặt đó làm Gateway SUT.
  - Mặc định là `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`; đặt
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` hoặc
    `OPENCLAW_CURRENT_PACKAGE_TGZ` để kiểm thử một tarball cục bộ đã phân giải thay vì
    cài đặt từ registry.
  - Dùng cùng thông tin xác thực env Telegram hoặc nguồn thông tin xác thực Convex như
    `pnpm openclaw qa telegram`. Với tự động hóa CI/phát hành, đặt
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` cộng
    `OPENCLAW_QA_CONVEX_SITE_URL` và bí mật vai trò. Nếu
    `OPENCLAW_QA_CONVEX_SITE_URL` và một bí mật vai trò Convex có mặt trong CI,
    wrapper Docker tự động chọn Convex.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` ghi đè
    `OPENCLAW_QA_CREDENTIAL_ROLE` dùng chung chỉ cho lane này.
  - GitHub Actions phơi bày lane này dưới dạng workflow maintainer thủ công
    `NPM Telegram Beta E2E`. Nó không chạy khi merge. Workflow dùng môi trường
    `qa-live-shared` và các lease thông tin xác thực CI Convex.
- GitHub Actions cũng phơi bày `Package Acceptance` để chứng minh sản phẩm chạy kèm
  trên một gói ứng viên. Nó chấp nhận ref đáng tin cậy, spec npm đã phát hành,
  URL tarball HTTPS cộng SHA-256, hoặc hiện vật tarball từ một lần chạy khác, tải lên
  `openclaw-current.tgz` đã chuẩn hóa dưới tên `package-under-test`, rồi chạy bộ lập lịch
  Docker E2E hiện có với các profile lane khói, gói, sản phẩm, đầy đủ hoặc tùy chỉnh.
  Đặt `telegram_mode=mock-openai` hoặc `live-frontier` để chạy workflow QA Telegram
  trên cùng hiện vật `package-under-test`.
  - Bằng chứng sản phẩm beta mới nhất:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- Bằng chứng URL tarball chính xác yêu cầu một digest:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=url \
  -f package_url=https://registry.npmjs.org/openclaw/-/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

- Bằng chứng artifact tải xuống artifact dạng tarball từ một lần chạy Actions khác:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:bundled-channel-deps`
  - Đóng gói và cài đặt bản dựng OpenClaw hiện tại trong Docker, khởi động Gateway
    với OpenAI đã được cấu hình, sau đó bật kênh/Plugin đi kèm thông qua các
    chỉnh sửa cấu hình.
  - Xác minh quy trình phát hiện thiết lập để trống các phụ thuộc runtime Plugin
    chưa cấu hình, lần chạy Gateway đã cấu hình đầu tiên hoặc lần chạy doctor
    đầu tiên sẽ cài đặt phụ thuộc runtime của từng Plugin đi kèm theo nhu cầu,
    và lần khởi động lại thứ hai không cài đặt lại các phụ thuộc đã được kích hoạt.
  - Cũng cài đặt một baseline npm cũ đã biết, bật Telegram trước khi chạy
    `openclaw update --tag <candidate>`, và xác minh doctor sau cập nhật của
    bản candidate sửa chữa các phụ thuộc runtime kênh đi kèm mà không cần sửa
    postinstall phía harness.
- `pnpm test:parallels:npm-update`
  - Chạy kiểm thử khói cập nhật bản cài đặt đóng gói native trên các máy khách
    Parallels. Mỗi nền tảng được chọn trước tiên cài đặt gói baseline được yêu
    cầu, sau đó chạy lệnh `openclaw update` đã cài đặt trong cùng máy khách và
    xác minh phiên bản đã cài đặt, trạng thái cập nhật, mức sẵn sàng của Gateway,
    và một lượt agent cục bộ.
  - Dùng `--platform macos`, `--platform windows`, hoặc `--platform linux` khi
    lặp trên một máy khách. Dùng `--json` cho đường dẫn artifact tóm tắt và
    trạng thái theo từng lane.
  - Lane OpenAI dùng `openai/gpt-5.5` cho bằng chứng lượt agent trực tiếp theo
    mặc định. Truyền `--model <provider/model>` hoặc đặt
    `OPENCLAW_PARALLELS_OPENAI_MODEL` khi chủ ý xác thực một mô hình OpenAI khác.
  - Bọc các lần chạy cục bộ dài trong timeout của host để tình trạng đình trệ
    truyền tải Parallels không tiêu tốn phần còn lại của cửa sổ kiểm thử:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Script ghi log lane lồng nhau dưới `/tmp/openclaw-parallels-npm-update.*`.
    Kiểm tra `windows-update.log`, `macos-update.log`, hoặc `linux-update.log`
    trước khi cho rằng wrapper bên ngoài bị treo.
  - Cập nhật Windows có thể mất 10 đến 15 phút trong quá trình doctor sau cập
    nhật/sửa chữa phụ thuộc runtime trên một máy khách nguội; điều đó vẫn bình
    thường khi log debug npm lồng nhau vẫn đang tiến triển.
  - Không chạy wrapper tổng hợp này song song với từng lane kiểm thử khói
    Parallels macOS, Windows, hoặc Linux riêng lẻ. Chúng chia sẻ trạng thái VM
    và có thể xung đột ở bước khôi phục snapshot, phục vụ gói, hoặc trạng thái
    Gateway của máy khách.
  - Bằng chứng sau cập nhật chạy bề mặt Plugin đi kèm thông thường vì các facade
    năng lực như giọng nói, tạo ảnh, và hiểu phương tiện được tải qua API runtime
    đi kèm ngay cả khi chính lượt agent chỉ kiểm tra một phản hồi văn bản đơn giản.

- `pnpm openclaw qa aimock`
  - Chỉ khởi động máy chủ nhà cung cấp AIMock cục bộ để kiểm thử khói giao thức trực tiếp.
- `pnpm openclaw qa matrix`
  - Chạy lane QA trực tiếp Matrix với một homeserver Tuwunel dùng Docker dùng một lần. Chỉ source-checkout — các bản cài đặt đóng gói không phân phối `qa-lab`.
  - CLI đầy đủ, catalog profile/kịch bản, biến môi trường, và bố cục artifact: [QA Matrix](/vi/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Chạy lane QA trực tiếp Telegram với một nhóm riêng tư thật bằng token bot driver và SUT từ env.
  - Yêu cầu `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`, và `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. ID nhóm phải là ID trò chuyện Telegram dạng số.
  - Hỗ trợ `--credential-source convex` cho thông tin xác thực dùng chung theo pool. Dùng chế độ env theo mặc định, hoặc đặt `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` để chọn tham gia lease theo pool.
  - Thoát với mã khác không khi bất kỳ kịch bản nào thất bại. Dùng `--allow-failures` khi bạn
    muốn có artifact mà không có mã thoát thất bại.
  - Yêu cầu hai bot riêng biệt trong cùng một nhóm riêng tư, trong đó bot SUT để lộ tên người dùng Telegram.
  - Để quan sát bot-với-bot ổn định, bật Bot-to-Bot Communication Mode trong `@BotFather` cho cả hai bot và đảm bảo bot driver có thể quan sát lưu lượng bot trong nhóm.
  - Ghi báo cáo QA Telegram, bản tóm tắt, và artifact tin nhắn đã quan sát dưới `.artifacts/qa-e2e/...`. Các kịch bản trả lời bao gồm RTT từ yêu cầu gửi của driver đến phản hồi SUT đã quan sát.

Các lane truyền tải trực tiếp chia sẻ một hợp đồng chuẩn để các truyền tải mới không lệch hướng; ma trận phạm vi theo lane nằm trong [tổng quan QA → Phạm vi truyền tải trực tiếp](/vi/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` là bộ tổng hợp mô phỏng rộng và không thuộc ma trận đó.

### Thông tin xác thực Telegram dùng chung qua Convex (v1)

Khi bật `--credential-source convex` (hoặc `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) cho
`openclaw qa telegram`, QA lab lấy một lease độc quyền từ pool được Convex hỗ trợ, Heartbeat
lease đó trong khi lane đang chạy, và giải phóng lease khi tắt.

Scaffold dự án Convex tham chiếu:

- `qa/convex-credential-broker/`

Biến môi trường bắt buộc:

- `OPENCLAW_QA_CONVEX_SITE_URL` (ví dụ `https://your-deployment.convex.site`)
- Một secret cho vai trò đã chọn:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` cho `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` cho `ci`
- Chọn vai trò thông tin xác thực:
  - CLI: `--credential-role maintainer|ci`
  - Mặc định env: `OPENCLAW_QA_CREDENTIAL_ROLE` (mặc định là `ci` trong CI, nếu không thì là `maintainer`)

Biến môi trường tùy chọn:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (mặc định `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (mặc định `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (mặc định `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (mặc định `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (mặc định `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (ID truy vết tùy chọn)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` cho phép URL Convex `http://` local loopback cho phát triển chỉ cục bộ.

`OPENCLAW_QA_CONVEX_SITE_URL` nên dùng `https://` trong vận hành bình thường.

Các lệnh quản trị của maintainer (thêm/xóa/liệt kê pool) yêu cầu riêng
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

Trình trợ giúp CLI cho maintainer:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Dùng `doctor` trước các lần chạy trực tiếp để kiểm tra URL site Convex, secret broker,
tiền tố endpoint, timeout HTTP, và khả năng truy cập admin/list mà không in
giá trị secret. Dùng `--json` cho đầu ra máy đọc được trong script và tiện ích
CI.

Hợp đồng endpoint mặc định (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

- `POST /acquire`
  - Yêu cầu: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - Thành công: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - Hết tài nguyên/có thể thử lại: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /heartbeat`
  - Yêu cầu: `{ kind, ownerId, actorRole, credentialId, leaseToken, leaseTtlMs }`
  - Thành công: `{ status: "ok" }` (hoặc `2xx` rỗng)
- `POST /release`
  - Yêu cầu: `{ kind, ownerId, actorRole, credentialId, leaseToken }`
  - Thành công: `{ status: "ok" }` (hoặc `2xx` rỗng)
- `POST /admin/add` (chỉ secret maintainer)
  - Yêu cầu: `{ kind, actorId, payload, note?, status? }`
  - Thành công: `{ status: "ok", credential }`
- `POST /admin/remove` (chỉ secret maintainer)
  - Yêu cầu: `{ credentialId, actorId }`
  - Thành công: `{ status: "ok", changed, credential }`
  - Guard lease đang hoạt động: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (chỉ secret maintainer)
  - Yêu cầu: `{ kind?, status?, includePayload?, limit? }`
  - Thành công: `{ status: "ok", credentials, count }`

Hình dạng payload cho loại Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` phải là chuỗi ID trò chuyện Telegram dạng số.
- `admin/add` xác thực hình dạng này cho `kind: "telegram"` và từ chối payload sai định dạng.

### Thêm một kênh vào QA

Kiến trúc và tên trình trợ giúp kịch bản cho các adapter kênh mới nằm trong [tổng quan QA → Thêm một kênh](/vi/concepts/qa-e2e-automation#adding-a-channel). Mức tối thiểu: triển khai runner truyền tải trên seam host `qa-lab` dùng chung, khai báo `qaRunners` trong manifest Plugin, mount dưới dạng `openclaw qa <runner>`, và viết kịch bản trong `qa/scenarios/`.

## Bộ kiểm thử (chạy gì ở đâu)

Hãy xem các bộ này như “mức độ thực tế tăng dần” (và độ không ổn định/chi phí cũng tăng dần):

### Unit / tích hợp (mặc định)

- Lệnh: `pnpm test`
- Cấu hình: các lần chạy không nhắm mục tiêu dùng tập shard `vitest.full-*.config.ts` và có thể mở rộng shard nhiều dự án thành cấu hình theo từng dự án để lập lịch song song
- Tệp: inventory core/unit trong `src/**/*.test.ts`, `packages/**/*.test.ts`, và `test/**/*.test.ts`; kiểm thử unit UI chạy trong shard `unit-ui` chuyên dụng
- Phạm vi:
  - Kiểm thử unit thuần
  - Kiểm thử tích hợp trong tiến trình (xác thực Gateway, định tuyến, tooling, phân tích cú pháp, cấu hình)
  - Hồi quy xác định cho các lỗi đã biết
- Kỳ vọng:
  - Chạy trong CI
  - Không cần khóa thật
  - Nên nhanh và ổn định
  - Kiểm thử resolver và loader bề mặt công khai phải chứng minh hành vi fallback rộng của `api.js` và
    `runtime-api.js` bằng các fixture Plugin nhỏ được tạo, không phải
    API nguồn Plugin đi kèm thật. Tải API Plugin thật thuộc về
    các bộ hợp đồng/tích hợp do Plugin sở hữu.

<AccordionGroup>
  <Accordion title="Dự án, shard, và lane có phạm vi">

    - `pnpm test` không nhắm mục tiêu chạy mười hai cấu hình phân mảnh nhỏ hơn (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) thay vì một tiến trình dự án gốc native khổng lồ. Điều này giảm RSS đỉnh trên các máy đang tải nặng và tránh để công việc auto-reply/extension làm nghẽn các bộ kiểm thử không liên quan.
    - `pnpm test --watch` vẫn dùng đồ thị dự án gốc native `vitest.config.ts`, vì vòng lặp watch nhiều phân mảnh không thực tế.
    - `pnpm test`, `pnpm test:watch`, và `pnpm test:perf:imports` định tuyến các mục tiêu tệp/thư mục tường minh qua các lane có phạm vi trước, nên `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` tránh phải trả toàn bộ chi phí khởi động dự án gốc.
    - `pnpm test:changed` mặc định mở rộng các đường dẫn git đã thay đổi thành các lane có phạm vi chi phí thấp: chỉnh sửa kiểm thử trực tiếp, các tệp `*.test.ts` ngang hàng, ánh xạ nguồn tường minh, và các phụ thuộc đồ thị import cục bộ. Chỉnh sửa config/setup/package không chạy kiểm thử diện rộng trừ khi bạn dùng tường minh `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`.
    - `pnpm check:changed` là cổng kiểm tra cục bộ thông minh bình thường cho công việc hẹp. Nó phân loại diff thành core, kiểm thử core, extensions, kiểm thử extension, apps, tài liệu, metadata phát hành, công cụ Docker live, và tooling, rồi chạy các lệnh typecheck, lint, và guard tương ứng. Nó không chạy kiểm thử Vitest; gọi `pnpm test:changed` hoặc `pnpm test <target>` tường minh để có bằng chứng kiểm thử. Các bump phiên bản chỉ metadata phát hành chạy các kiểm tra phiên bản/config/phụ thuộc gốc có mục tiêu, với một guard từ chối thay đổi package ngoài trường phiên bản cấp cao nhất.
    - Các chỉnh sửa harness Docker ACP live chạy các kiểm tra tập trung: cú pháp shell cho các script xác thực Docker live và một dry-run bộ lập lịch Docker live. Thay đổi `package.json` chỉ được bao gồm khi diff giới hạn ở `scripts["test:docker:live-*"]`; các chỉnh sửa dependency, export, version, và bề mặt package khác vẫn dùng các guard rộng hơn.
    - Các kiểm thử đơn vị nhẹ về import từ agents, commands, plugins, helper auto-reply, `plugin-sdk`, và các vùng tiện ích thuần tương tự được định tuyến qua lane `unit-fast`, lane này bỏ qua `test/setup-openclaw-runtime.ts`; các tệp có trạng thái/nặng về runtime vẫn ở các lane hiện có.
    - Một số tệp nguồn helper `plugin-sdk` và `commands` được chọn cũng ánh xạ các lần chạy chế độ changed đến các kiểm thử ngang hàng tường minh trong các lane nhẹ đó, nên chỉnh sửa helper tránh chạy lại toàn bộ bộ kiểm thử nặng cho thư mục đó.
    - `auto-reply` có các bucket riêng cho helper core cấp cao nhất, kiểm thử tích hợp `reply.*` cấp cao nhất, và cây con `src/auto-reply/reply/**`. CI tiếp tục chia cây con reply thành các phân mảnh agent-runner, dispatch, và commands/state-routing để một bucket nặng về import không sở hữu toàn bộ phần đuôi Node.
    - CI PR/main bình thường cố ý bỏ qua sweep hàng loạt extension và phân mảnh chỉ phát hành `agentic-plugins`. Full Release Validation dispatch workflow con `Plugin Prerelease` riêng cho các bộ kiểm thử nặng về Plugin/extension đó trên các release candidate.

  </Accordion>

  <Accordion title="Độ phủ embedded runner">

    - Khi bạn thay đổi input khám phá message-tool hoặc ngữ cảnh runtime
      Compaction, hãy giữ cả hai mức độ phủ.
    - Thêm các hồi quy helper tập trung cho các ranh giới định tuyến và chuẩn hóa
      thuần.
    - Giữ các bộ tích hợp embedded runner khỏe mạnh:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts`, và
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - Các bộ đó xác minh rằng id có phạm vi và hành vi Compaction vẫn chảy
      qua các đường dẫn `run.ts` / `compact.ts` thật; kiểm thử chỉ helper
      không phải là thay thế đủ cho các đường dẫn tích hợp đó.

  </Accordion>

  <Accordion title="Mặc định pool và isolation của Vitest">

    - Config Vitest cơ sở mặc định là `threads`.
    - Config Vitest dùng chung cố định `isolate: false` và dùng runner
      không cô lập trên các dự án gốc, config e2e, và live.
    - Lane UI gốc giữ setup `jsdom` và optimizer của nó, nhưng cũng chạy trên
      runner không cô lập dùng chung.
    - Mỗi phân mảnh `pnpm test` kế thừa cùng mặc định `threads` + `isolate: false`
      từ config Vitest dùng chung.
    - `scripts/run-vitest.mjs` mặc định thêm `--no-maglev` cho các tiến trình
      Node con của Vitest để giảm churn biên dịch V8 trong các lần chạy cục bộ lớn.
      Đặt `OPENCLAW_VITEST_ENABLE_MAGLEV=1` để so sánh với hành vi V8 gốc.

  </Accordion>

  <Accordion title="Lặp cục bộ nhanh">

    - `pnpm changed:lanes` hiển thị các lane kiến trúc mà một diff kích hoạt.
    - Hook pre-commit chỉ định dạng. Nó stage lại các tệp đã định dạng và
      không chạy lint, typecheck, hoặc kiểm thử.
    - Chạy `pnpm check:changed` tường minh trước khi bàn giao hoặc push khi bạn
      cần cổng kiểm tra cục bộ thông minh.
    - `pnpm test:changed` mặc định định tuyến qua các lane có phạm vi chi phí thấp. Chỉ dùng
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` khi agent
      quyết định một chỉnh sửa harness, config, package, hoặc contract thật sự cần
      độ phủ Vitest rộng hơn.
    - `pnpm test:max` và `pnpm test:changed:max` giữ cùng hành vi định tuyến,
      chỉ với giới hạn worker cao hơn.
    - Tự động co giãn worker cục bộ cố ý thận trọng và giảm tải
      khi load average của host đã cao, nên nhiều lần chạy Vitest đồng thời
      mặc định gây ít thiệt hại hơn.
    - Config Vitest cơ sở đánh dấu các dự án/tệp config là
      `forceRerunTriggers` để các lần chạy lại chế độ changed vẫn đúng khi
      dây nối kiểm thử thay đổi.
    - Config giữ `OPENCLAW_VITEST_FS_MODULE_CACHE` bật trên các host được hỗ trợ;
      đặt `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` nếu bạn muốn
      một vị trí cache tường minh cho profiling trực tiếp.

  </Accordion>

  <Accordion title="Gỡ lỗi hiệu năng">

    - `pnpm test:perf:imports` bật báo cáo thời lượng import của Vitest cùng
      output phân rã import.
    - `pnpm test:perf:imports:changed` đặt phạm vi cùng góc nhìn profiling cho
      các tệp đã thay đổi kể từ `origin/main`.
    - Dữ liệu thời gian phân mảnh được ghi vào `.artifacts/vitest-shard-timings.json`.
      Các lần chạy toàn config dùng đường dẫn config làm khóa; các phân mảnh CI
      theo include-pattern nối thêm tên phân mảnh để có thể theo dõi riêng
      các phân mảnh đã lọc.
    - Khi một kiểm thử nóng vẫn dành phần lớn thời gian cho import khởi động,
      giữ các phụ thuộc nặng phía sau một seam `*.runtime.ts` cục bộ hẹp và
      mock seam đó trực tiếp thay vì deep-import các helper runtime chỉ
      để truyền chúng qua `vi.mock(...)`.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` so sánh
      `test:changed` đã định tuyến với đường dẫn dự án gốc native cho diff
      đã commit đó và in thời gian thực cùng RSS tối đa trên macOS.
    - `pnpm test:perf:changed:bench -- --worktree` benchmark cây làm việc bẩn
      hiện tại bằng cách định tuyến danh sách tệp đã thay đổi qua
      `scripts/test-projects.mjs` và config Vitest gốc.
    - `pnpm test:perf:profile:main` ghi một CPU profile luồng chính cho
      overhead khởi động và transform của Vitest/Vite.
    - `pnpm test:perf:profile:runner` ghi CPU+heap profile runner cho
      bộ unit khi tắt song song theo tệp.

  </Accordion>
</AccordionGroup>

### Độ ổn định (Gateway)

- Lệnh: `pnpm test:stability:gateway`
- Config: `vitest.gateway.config.ts`, bị buộc dùng một worker
- Phạm vi:
  - Khởi động một Gateway loopback thật với chẩn đoán được bật theo mặc định
  - Đẩy churn thông điệp gateway, bộ nhớ, và payload lớn tổng hợp qua đường dẫn sự kiện chẩn đoán
  - Truy vấn `diagnostics.stability` qua Gateway WS RPC
  - Bao phủ các helper lưu giữ bundle ổn định chẩn đoán
  - Khẳng định recorder vẫn bị giới hạn, các mẫu RSS tổng hợp nằm dưới ngân sách áp lực, và độ sâu hàng đợi theo phiên rút về lại zero
- Kỳ vọng:
  - An toàn cho CI và không cần key
  - Lane hẹp cho theo dõi hồi quy độ ổn định, không phải thay thế cho toàn bộ bộ kiểm thử Gateway

### E2E (gateway smoke)

- Lệnh: `pnpm test:e2e`
- Config: `vitest.e2e.config.ts`
- Tệp: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts`, và kiểm thử E2E của Plugin đi kèm dưới `extensions/`
- Mặc định runtime:
  - Dùng Vitest `threads` với `isolate: false`, khớp với phần còn lại của repo.
  - Dùng worker thích ứng (CI: tối đa 2, cục bộ: mặc định 1).
  - Mặc định chạy ở chế độ silent để giảm overhead I/O console.
- Override hữu ích:
  - `OPENCLAW_E2E_WORKERS=<n>` để buộc số worker (giới hạn ở 16).
  - `OPENCLAW_E2E_VERBOSE=1` để bật lại output console chi tiết.
- Phạm vi:
  - Hành vi Gateway end-to-end nhiều instance
  - Bề mặt WebSocket/HTTP, ghép cặp node, và networking nặng hơn
- Kỳ vọng:
  - Chạy trong CI (khi được bật trong pipeline)
  - Không cần key thật
  - Nhiều thành phần chuyển động hơn kiểm thử đơn vị (có thể chậm hơn)

### E2E: OpenShell backend smoke

- Lệnh: `pnpm test:e2e:openshell`
- Tệp: `extensions/openshell/src/backend.e2e.test.ts`
- Phạm vi:
  - Khởi động một Gateway OpenShell cô lập trên host qua Docker
  - Tạo sandbox từ một Dockerfile cục bộ tạm thời
  - Kiểm tra backend OpenShell của OpenClaw qua `sandbox ssh-config` thật + SSH exec
  - Xác minh hành vi hệ thống tệp chuẩn từ xa qua cầu nối sandbox fs
- Kỳ vọng:
  - Chỉ opt-in; không thuộc lần chạy `pnpm test:e2e` mặc định
  - Cần CLI `openshell` cục bộ cùng Docker daemon hoạt động
  - Dùng `HOME` / `XDG_CONFIG_HOME` cô lập, rồi hủy Gateway và sandbox kiểm thử
- Override hữu ích:
  - `OPENCLAW_E2E_OPENSHELL=1` để bật kiểm thử khi chạy thủ công bộ e2e rộng hơn
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` để trỏ tới binary CLI hoặc script wrapper không mặc định

### Live (provider thật + model thật)

- Lệnh: `pnpm test:live`
- Config: `vitest.live.config.ts`
- Tệp: `src/**/*.live.test.ts`, `test/**/*.live.test.ts`, và kiểm thử live của Plugin đi kèm dưới `extensions/`
- Mặc định: **được bật** bởi `pnpm test:live` (đặt `OPENCLAW_LIVE_TEST=1`)
- Phạm vi:
  - “Provider/model này có thật sự hoạt động _hôm nay_ với thông tin xác thực thật không?”
  - Bắt các thay đổi định dạng provider, điểm khác biệt tool-calling, vấn đề xác thực, và hành vi rate limit
- Kỳ vọng:
  - Không ổn định cho CI theo thiết kế (mạng thật, chính sách provider thật, quota, sự cố)
  - Tốn tiền / dùng rate limit
  - Ưu tiên chạy các tập con thu hẹp thay vì “mọi thứ”
- Các lần chạy live source `~/.profile` để lấy các API key còn thiếu.
- Theo mặc định, các lần chạy live vẫn cô lập `HOME` và sao chép material config/auth vào home kiểm thử tạm thời để fixture unit không thể sửa đổi `~/.openclaw` thật của bạn.
- Chỉ đặt `OPENCLAW_LIVE_USE_REAL_HOME=1` khi bạn cố ý cần kiểm thử live dùng thư mục home thật của mình.
- `pnpm test:live` hiện mặc định dùng chế độ yên tĩnh hơn: nó giữ output tiến độ `[live] ...`, nhưng ẩn thông báo `~/.profile` bổ sung và tắt tiếng log bootstrap Gateway/Bonjour chatter. Đặt `OPENCLAW_LIVE_TEST_QUIET=0` nếu bạn muốn có lại toàn bộ log khởi động.
- Xoay vòng API key (theo provider): đặt `*_API_KEYS` với định dạng dấu phẩy/chấm phẩy hoặc `*_API_KEY_1`, `*_API_KEY_2` (ví dụ `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) hoặc override theo live qua `OPENCLAW_LIVE_*_KEY`; kiểm thử retry khi có phản hồi rate limit.
- Output tiến độ/Heartbeat:
  - Các bộ live giờ phát dòng tiến độ ra stderr để các lệnh gọi provider dài hiển thị là vẫn hoạt động ngay cả khi Vitest console capture yên tĩnh.
  - `vitest.live.config.ts` tắt chặn console của Vitest để các dòng tiến độ provider/gateway stream ngay trong các lần chạy live.
  - Tinh chỉnh Heartbeat model trực tiếp bằng `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Tinh chỉnh Heartbeat gateway/probe bằng `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Tôi nên chạy bộ nào?

Dùng bảng quyết định này:

- Chỉnh sửa logic/kiểm thử: chạy `pnpm test` (và `pnpm test:coverage` nếu bạn đã thay đổi nhiều)
- Đụng đến mạng Gateway / giao thức WS / ghép cặp: thêm `pnpm test:e2e`
- Gỡ lỗi “bot của tôi bị sập” / lỗi theo từng nhà cung cấp / gọi công cụ: chạy `pnpm test:live` đã thu hẹp phạm vi

## Kiểm thử trực tiếp (có truy cập mạng)

Với ma trận mô hình trực tiếp, các bài smoke backend CLI, smoke ACP, harness máy chủ ứng dụng Codex, và tất cả kiểm thử trực tiếp của nhà cung cấp media (Deepgram, BytePlus, ComfyUI, hình ảnh, nhạc, video, media harness) — cùng với xử lý thông tin xác thực cho các lần chạy trực tiếp — xem [Kiểm thử — bộ kiểm thử trực tiếp](/vi/help/testing-live).

## Trình chạy Docker (kiểm tra tùy chọn "hoạt động trên Linux")

Các trình chạy Docker này được chia thành hai nhóm:

- Trình chạy mô hình trực tiếp: `test:docker:live-models` và `test:docker:live-gateway` chỉ chạy tệp trực tiếp profile-key tương ứng bên trong ảnh Docker của repo (`src/agents/models.profiles.live.test.ts` và `src/gateway/gateway-models.profiles.live.test.ts`), mount thư mục cấu hình cục bộ và workspace của bạn (và source `~/.profile` nếu được mount). Các điểm vào cục bộ tương ứng là `test:live:models-profiles` và `test:live:gateway-profiles`.
- Các trình chạy trực tiếp Docker mặc định dùng giới hạn smoke nhỏ hơn để một lượt quét Docker đầy đủ vẫn thực tế:
  `test:docker:live-models` mặc định là `OPENCLAW_LIVE_MAX_MODELS=12`, và
  `test:docker:live-gateway` mặc định là `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`, và
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Ghi đè các biến môi trường đó khi bạn
  thật sự muốn lượt quét toàn diện lớn hơn.
- `test:docker:all` xây dựng ảnh Docker trực tiếp một lần qua `test:docker:live-build`, đóng gói OpenClaw một lần thành tarball npm thông qua `scripts/package-openclaw-for-docker.mjs`, rồi xây dựng/tái sử dụng hai ảnh `scripts/e2e/Dockerfile`. Ảnh cơ bản chỉ là trình chạy Node/Git cho các lane cài đặt/cập nhật/phụ thuộc Plugin; các lane đó mount tarball đã dựng sẵn. Ảnh chức năng cài cùng tarball đó vào `/app` cho các lane chức năng ứng dụng đã dựng. Định nghĩa lane Docker nằm trong `scripts/lib/docker-e2e-scenarios.mjs`; logic lập kế hoạch nằm trong `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` thực thi kế hoạch đã chọn. Bộ tổng hợp dùng bộ lập lịch cục bộ có trọng số: `OPENCLAW_DOCKER_ALL_PARALLELISM` kiểm soát số slot tiến trình, còn các giới hạn tài nguyên giữ cho các lane nặng về trực tiếp, cài npm và đa dịch vụ không khởi động cùng lúc. Nếu một lane đơn lẻ nặng hơn các giới hạn đang hoạt động, bộ lập lịch vẫn có thể khởi động lane đó khi pool trống rồi giữ nó chạy một mình cho đến khi lại có dung lượng. Mặc định là 10 slot, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10`, và `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; chỉ tinh chỉnh `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` hoặc `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` khi host Docker còn nhiều dư địa hơn. Trình chạy thực hiện preflight Docker theo mặc định, xóa các container E2E OpenClaw cũ, in trạng thái mỗi 30 giây, lưu thời lượng các lane thành công trong `.artifacts/docker-tests/lane-timings.json`, và dùng các thời lượng đó để khởi động các lane dài hơn trước trong các lần chạy sau. Dùng `OPENCLAW_DOCKER_ALL_DRY_RUN=1` để in manifest lane có trọng số mà không xây dựng hoặc chạy Docker, hoặc `node scripts/test-docker-all.mjs --plan-json` để in kế hoạch CI cho các lane đã chọn, nhu cầu package/ảnh và thông tin xác thực.
- `Package Acceptance` là cổng package gốc GitHub cho câu hỏi "tarball có thể cài đặt này có hoạt động như một sản phẩm không?" Nó phân giải một package ứng viên từ `source=npm`, `source=ref`, `source=url`, hoặc `source=artifact`, tải nó lên dưới dạng `package-under-test`, rồi chạy các lane Docker E2E tái sử dụng với đúng tarball đó thay vì đóng gói lại ref đã chọn. `workflow_ref` chọn các script workflow/harness đáng tin cậy, còn `package_ref` chọn commit/branch/tag nguồn để đóng gói khi `source=ref`; điều này cho phép logic acceptance hiện tại xác thực các commit đáng tin cậy cũ hơn. Các profile được sắp xếp theo độ bao phủ: `smoke` là cài đặt/kênh/agent nhanh cộng với Gateway/cấu hình, `package` là hợp đồng package/cập nhật/Plugin cộng với fixture upgrade-survivor không cần khóa và thay thế native mặc định cho hầu hết phạm vi package/cập nhật Parallels, `product` thêm các kênh MCP, dọn dẹp cron/subagent, tìm kiếm web OpenAI và OpenWebUI, còn `full` chạy các khối Docker theo đường dẫn phát hành với OpenWebUI. Xác thực phát hành chạy một delta package tùy chỉnh (`bundled-channel-deps-compat plugins-offline`) cộng với QA package Telegram vì các khối Docker theo đường dẫn phát hành đã bao phủ các lane package/cập nhật/Plugin chồng lấp. Các lệnh chạy lại Docker GitHub có mục tiêu được tạo từ artifact bao gồm artifact package trước đó và đầu vào ảnh đã chuẩn bị khi có, để các lane lỗi có thể tránh xây dựng lại package và ảnh.
- Kiểm tra build và phát hành chạy `scripts/check-cli-bootstrap-imports.mjs` sau tsdown. Guard duyệt đồ thị build tĩnh từ `dist/entry.js` và `dist/cli/run-main.js` rồi thất bại nếu quá trình khởi động trước dispatch import các phụ thuộc package như Commander, giao diện nhắc lệnh, undici hoặc logging trước khi dispatch lệnh; nó cũng giữ chunk chạy Gateway đã bundle trong ngân sách và từ chối import tĩnh các đường dẫn Gateway nguội đã biết. Smoke CLI đã đóng gói cũng bao phủ trợ giúp gốc, trợ giúp onboard, trợ giúp doctor, trạng thái, schema cấu hình và một lệnh liệt kê mô hình.
- Tương thích cũ của Package Acceptance được giới hạn ở `2026.4.25` (bao gồm `2026.4.25-beta.*`). Tới ngưỡng đó, harness chỉ dung thứ các thiếu sót metadata package đã phát hành: các mục kho QA riêng tư bị lược bỏ, thiếu `gateway install --wrapper`, thiếu tệp patch trong fixture git sinh từ tarball, thiếu `update.channel` đã lưu, vị trí bản ghi cài đặt Plugin cũ, thiếu lưu bản ghi cài đặt marketplace, và di trú metadata cấu hình trong `plugins update`. Với các package sau `2026.4.25`, các đường dẫn đó là lỗi nghiêm ngặt.
- Trình chạy smoke container: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update`, và `test:docker:config-reload` khởi động một hoặc nhiều container thật và xác minh các đường dẫn tích hợp cấp cao hơn.

Các trình chạy Docker mô hình trực tiếp cũng chỉ bind-mount các home xác thực CLI cần thiết (hoặc tất cả home được hỗ trợ khi lần chạy không bị thu hẹp), rồi sao chép chúng vào home của container trước khi chạy để OAuth của CLI bên ngoài có thể làm mới token mà không làm thay đổi kho xác thực của host:

- Mô hình trực tiếp: `pnpm test:docker:live-models` (tập lệnh: `scripts/test-live-models-docker.sh`)
- Kiểm thử khói liên kết ACP: `pnpm test:docker:live-acp-bind` (tập lệnh: `scripts/test-live-acp-bind-docker.sh`; mặc định bao phủ Claude, Codex và Gemini, với phạm vi bao phủ Droid/OpenCode nghiêm ngặt qua `pnpm test:docker:live-acp-bind:droid` và `pnpm test:docker:live-acp-bind:opencode`)
- Kiểm thử khói backend CLI: `pnpm test:docker:live-cli-backend` (tập lệnh: `scripts/test-live-cli-backend-docker.sh`)
- Kiểm thử khói harness app-server Codex: `pnpm test:docker:live-codex-harness` (tập lệnh: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + tác tử dev: `pnpm test:docker:live-gateway` (tập lệnh: `scripts/test-live-gateway-models-docker.sh`)
- Kiểm thử khói khả năng quan sát: `pnpm qa:otel:smoke` là một lane kiểm tra nguồn QA riêng tư. Nó cố ý không thuộc các lane phát hành Docker của gói vì tarball npm bỏ qua QA Lab.
- Kiểm thử khói trực tiếp Open WebUI: `pnpm test:docker:openwebui` (tập lệnh: `scripts/e2e/openwebui-docker.sh`)
- Trình hướng dẫn onboarding (TTY, scaffold đầy đủ): `pnpm test:docker:onboard` (tập lệnh: `scripts/e2e/onboard-docker.sh`)
- Kiểm thử khói tarball npm cho onboarding/kênh/tác tử: `pnpm test:docker:npm-onboard-channel-agent` cài đặt tarball OpenClaw đã đóng gói ở phạm vi toàn cục trong Docker, cấu hình OpenAI qua onboarding tham chiếu env cùng với Telegram theo mặc định, xác minh doctor đã sửa các phụ thuộc runtime của Plugin đã kích hoạt, và chạy một lượt tác tử OpenAI được mô phỏng. Tái sử dụng tarball đã build sẵn bằng `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, bỏ qua rebuild trên host bằng `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0`, hoặc đổi kênh bằng `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`.
- Kiểm thử khói chuyển kênh cập nhật: `pnpm test:docker:update-channel-switch` cài đặt tarball OpenClaw đã đóng gói ở phạm vi toàn cục trong Docker, chuyển từ gói `stable` sang git `dev`, xác minh kênh đã lưu và Plugin sau cập nhật hoạt động, sau đó chuyển lại về gói `stable` và kiểm tra trạng thái cập nhật.
- Kiểm thử khói khả năng sống sót sau nâng cấp: `pnpm test:docker:upgrade-survivor` cài đặt tarball OpenClaw đã đóng gói đè lên một fixture người dùng cũ không sạch với các tác tử, cấu hình kênh, allowlist Plugin, trạng thái phụ thuộc runtime Plugin cũ, và các tệp workspace/session hiện có. Nó chạy cập nhật gói cùng doctor không tương tác mà không cần khóa nhà cung cấp hoặc kênh trực tiếp, sau đó khởi động một Gateway loopback và kiểm tra việc bảo toàn cấu hình/trạng thái cùng ngân sách khởi động/trạng thái.
- Kiểm thử khói ngữ cảnh runtime phiên: `pnpm test:docker:session-runtime-context` xác minh tính bền vững transcript ngữ cảnh runtime ẩn cùng với sửa chữa doctor cho các nhánh ghi lại prompt bị trùng lặp bị ảnh hưởng.
- Kiểm thử khói cài đặt toàn cục Bun: `bash scripts/e2e/bun-global-install-smoke.sh` đóng gói cây hiện tại, cài đặt bằng `bun install -g` trong một home cô lập, và xác minh `openclaw infer image providers --json` trả về các nhà cung cấp hình ảnh đóng gói kèm thay vì treo. Tái sử dụng tarball đã build sẵn bằng `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, bỏ qua build trên host bằng `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0`, hoặc sao chép `dist/` từ một image Docker đã build bằng `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Kiểm thử khói Docker của trình cài đặt: `bash scripts/test-install-sh-docker.sh` chia sẻ một cache npm giữa các container root, update và direct-npm của nó. Kiểm thử khói cập nhật mặc định dùng npm `latest` làm baseline ổn định trước khi nâng cấp lên tarball ứng viên. Ghi đè cục bộ bằng `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22`, hoặc bằng input `update_baseline_version` của workflow Install Smoke trên GitHub. Các kiểm tra trình cài đặt không phải root giữ một cache npm cô lập để các mục cache do root sở hữu không che lấp hành vi cài đặt cục bộ của người dùng. Đặt `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` để tái sử dụng cache root/update/direct-npm giữa các lần chạy lại cục bộ.
- Install Smoke CI bỏ qua cập nhật toàn cục direct-npm trùng lặp bằng `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; chạy tập lệnh cục bộ mà không có env đó khi cần phạm vi bao phủ `npm install -g` trực tiếp.
- Kiểm thử khói CLI xóa workspace dùng chung của tác tử: `pnpm test:docker:agents-delete-shared-workspace` (tập lệnh: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) mặc định build image Dockerfile gốc, seed hai tác tử với một workspace trong home container cô lập, chạy `agents delete --json`, và xác minh JSON hợp lệ cùng hành vi giữ lại workspace. Tái sử dụng image install-smoke bằng `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Mạng Gateway (hai container, xác thực WS + health): `pnpm test:docker:gateway-network` (tập lệnh: `scripts/e2e/gateway-network-docker.sh`)
- Kiểm thử khói ảnh chụp nhanh CDP của trình duyệt: `pnpm test:docker:browser-cdp-snapshot` (tập lệnh: `scripts/e2e/browser-cdp-snapshot-docker.sh`) build image E2E nguồn cùng một lớp Chromium, khởi động Chromium với CDP thô, chạy `browser doctor --deep`, và xác minh ảnh chụp nhanh vai trò CDP bao phủ URL liên kết, các phần tử có thể nhấp được nâng cấp từ con trỏ, tham chiếu iframe và metadata frame.
- Hồi quy reasoning tối thiểu OpenAI Responses web_search: `pnpm test:docker:openai-web-search-minimal` (tập lệnh: `scripts/e2e/openai-web-search-minimal-docker.sh`) chạy một máy chủ OpenAI được mô phỏng qua Gateway, xác minh `web_search` nâng `reasoning.effort` từ `minimal` lên `low`, sau đó buộc schema nhà cung cấp từ chối và kiểm tra chi tiết thô xuất hiện trong log Gateway.
- Cầu nối kênh MCP (Gateway đã seed + cầu nối stdio + kiểm thử khói frame thông báo Claude thô): `pnpm test:docker:mcp-channels` (tập lệnh: `scripts/e2e/mcp-channels-docker.sh`)
- Công cụ MCP gói Pi (máy chủ MCP stdio thật + kiểm thử khói cho phép/từ chối hồ sơ Pi nhúng): `pnpm test:docker:pi-bundle-mcp-tools` (tập lệnh: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Dọn dẹp MCP Cron/subagent (Gateway thật + tháo dỡ tiến trình con MCP stdio sau các lần chạy cron cô lập và subagent một lần): `pnpm test:docker:cron-mcp-cleanup` (tập lệnh: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugin (kiểm thử khói cài đặt, cài đặt/gỡ cài đặt ClawHub kitchen-sink, cập nhật marketplace, và bật/kiểm tra gói Claude): `pnpm test:docker:plugins` (tập lệnh: `scripts/e2e/plugins-docker.sh`)
  Đặt `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` để bỏ qua khối ClawHub, hoặc ghi đè cặp package/runtime kitchen-sink mặc định bằng `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` và `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. Khi không có `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL`, kiểm thử sử dụng một máy chủ fixture ClawHub cục bộ hermetic.
- Kiểm thử khói cập nhật Plugin không đổi: `pnpm test:docker:plugin-update` (tập lệnh: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Kiểm thử khói metadata tải lại cấu hình: `pnpm test:docker:config-reload` (tập lệnh: `scripts/e2e/config-reload-source-docker.sh`)
- Phụ thuộc runtime của Plugin đóng gói kèm: `pnpm test:docker:bundled-channel-deps` mặc định build một image runner Docker nhỏ, build và đóng gói OpenClaw một lần trên host, rồi mount tarball đó vào từng kịch bản cài đặt Linux. Tái sử dụng image bằng `OPENCLAW_SKIP_DOCKER_BUILD=1`, bỏ qua rebuild trên host sau một build cục bộ mới bằng `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0`, hoặc trỏ tới một tarball hiện có bằng `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`. Các chunk Docker aggregate đầy đủ và bundled-channel theo đường phát hành pre-pack tarball này một lần, rồi chia nhỏ kiểm tra kênh đóng gói kèm thành các lane độc lập, bao gồm các lane cập nhật riêng cho Telegram, Discord, Slack, Feishu, memory-lancedb và ACPX. Các chunk phát hành tách kiểm thử khói kênh, mục tiêu cập nhật, và hợp đồng setup/runtime thành `bundled-channels-core`, `bundled-channels-update-a`, `bundled-channels-update-b` và `bundled-channels-contracts`; chunk aggregate `bundled-channels` vẫn có sẵn cho các lần chạy lại thủ công. Workflow phát hành cũng tách các chunk trình cài đặt nhà cung cấp và các chunk cài đặt/gỡ cài đặt Plugin đóng gói kèm; các chunk cũ `package-update`, `plugins-runtime` và `plugins-integrations` vẫn là alias aggregate cho các lần chạy lại thủ công. Dùng `OPENCLAW_BUNDLED_CHANNELS=telegram,slack` để thu hẹp ma trận kênh khi chạy trực tiếp lane đóng gói kèm, hoặc `OPENCLAW_BUNDLED_CHANNEL_UPDATE_TARGETS=telegram,acpx` để thu hẹp kịch bản cập nhật. Các lần chạy Docker theo từng kịch bản mặc định là `OPENCLAW_BUNDLED_CHANNEL_DOCKER_RUN_TIMEOUT=900s`; kịch bản cập nhật nhiều mục tiêu mặc định là `OPENCLAW_BUNDLED_CHANNEL_UPDATE_DOCKER_RUN_TIMEOUT=2400s`. Lane cũng xác minh rằng `channels.<id>.enabled=false` và `plugins.entries.<id>.enabled=false` sẽ chặn sửa chữa doctor/phụ thuộc runtime.
- Thu hẹp phụ thuộc runtime của Plugin đóng gói kèm trong khi lặp bằng cách tắt các kịch bản không liên quan, ví dụ:
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`.

Để build sẵn và tái sử dụng image chức năng dùng chung theo cách thủ công:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Các override image theo suite như `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` vẫn được ưu tiên khi được đặt. Khi `OPENCLAW_SKIP_DOCKER_BUILD=1` trỏ tới một image dùng chung từ xa, các tập lệnh sẽ pull nó nếu nó chưa có cục bộ. Các kiểm thử Docker cho QR và trình cài đặt giữ Dockerfile riêng vì chúng xác thực hành vi gói/cài đặt thay vì runtime ứng dụng đã build dùng chung.

Các trình chạy Docker mô hình live cũng bind-mount checkout hiện tại ở chế độ chỉ đọc và
stage nó vào một workdir tạm thời bên trong container. Điều này giữ cho image runtime
gọn nhẹ trong khi vẫn chạy Vitest trên đúng source/config cục bộ của bạn.
Bước staging bỏ qua các cache lớn chỉ dùng cục bộ và output build ứng dụng như
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__`, và các thư mục output `.build` cục bộ của ứng dụng hoặc
Gradle để các lần chạy Docker live không mất nhiều phút sao chép
artifact riêng của máy.
Chúng cũng đặt `OPENCLAW_SKIP_CHANNELS=1` để các probe live của Gateway không khởi động
worker kênh Telegram/Discord/v.v. thật bên trong container.
`test:docker:live-models` vẫn chạy `pnpm test:live`, vì vậy hãy truyền tiếp
`OPENCLAW_LIVE_GATEWAY_*` khi bạn cần thu hẹp hoặc loại trừ phạm vi live của Gateway
khỏi lane Docker đó.
`test:docker:openwebui` là một smoke tương thích cấp cao hơn: nó khởi động một
container Gateway OpenClaw với các endpoint HTTP tương thích OpenAI được bật,
khởi động một container Open WebUI đã ghim phiên bản trỏ tới Gateway đó, đăng nhập qua
Open WebUI, xác minh `/api/models` công bố `openclaw/default`, rồi gửi một
yêu cầu chat thật qua proxy `/api/chat/completions` của Open WebUI.
Lần chạy đầu tiên có thể chậm hơn rõ rệt vì Docker có thể cần kéo image
Open WebUI và Open WebUI có thể cần hoàn tất thiết lập cold-start của chính nó.
Lane này cần một khóa mô hình live dùng được, và `OPENCLAW_PROFILE_FILE`
(mặc định là `~/.profile`) là cách chính để cung cấp khóa đó trong các lần chạy Docker hóa.
Các lần chạy thành công in ra một payload JSON nhỏ như `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` được thiết kế có tính xác định và không cần tài khoản
Telegram, Discord hoặc iMessage thật. Nó khởi động một container Gateway đã seed,
khởi động một container thứ hai sinh ra `openclaw mcp serve`, rồi xác minh
việc khám phá cuộc hội thoại được định tuyến, đọc transcript, metadata attachment,
hành vi hàng đợi sự kiện live, định tuyến gửi outbound, và thông báo kênh +
quyền kiểu Claude qua cầu nối stdio MCP thật. Kiểm tra thông báo
kiểm tra trực tiếp các frame stdio MCP thô để smoke xác thực những gì
cầu nối thật sự phát ra, không chỉ những gì một SDK client cụ thể tình cờ hiển thị.
`test:docker:pi-bundle-mcp-tools` có tính xác định và không cần khóa mô hình live.
Nó build image Docker của repo, khởi động một server probe stdio MCP thật
bên trong container, hiện thực hóa server đó qua runtime MCP của bundle Pi nhúng,
thực thi tool, rồi xác minh `coding` và `messaging` giữ lại
tool `bundle-mcp` trong khi `minimal` và `tools.deny: ["bundle-mcp"]` lọc chúng.
`test:docker:cron-mcp-cleanup` có tính xác định và không cần khóa mô hình live.
Nó khởi động một Gateway đã seed với một server probe stdio MCP thật, chạy một
lượt cron cô lập và một lượt con một lần qua `/subagents spawn`, rồi xác minh
process con MCP thoát sau mỗi lần chạy.

Smoke thread ACP ngôn ngữ tự nhiên thủ công (không phải CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Giữ script này cho các workflow hồi quy/debug. Nó có thể lại cần thiết cho việc xác thực định tuyến thread ACP, vì vậy đừng xóa nó.

Các biến môi trường hữu ích:

- `OPENCLAW_CONFIG_DIR=...` (mặc định: `~/.openclaw`) được mount vào `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (mặc định: `~/.openclaw/workspace`) được mount vào `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (mặc định: `~/.profile`) được mount vào `/home/node/.profile` và được source trước khi chạy test
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` để chỉ xác minh các biến môi trường được source từ `OPENCLAW_PROFILE_FILE`, dùng các thư mục config/workspace tạm thời và không mount xác thực CLI bên ngoài
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (mặc định: `~/.cache/openclaw/docker-cli-tools`) được mount vào `/home/node/.npm-global` cho các bản cài CLI được cache bên trong Docker
- Các thư mục/tệp xác thực CLI bên ngoài dưới `$HOME` được mount chỉ đọc dưới `/host-auth...`, rồi được sao chép vào `/home/node/...` trước khi test bắt đầu
  - Thư mục mặc định: `.minimax`
  - Tệp mặc định: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Các lần chạy provider đã thu hẹp chỉ mount các thư mục/tệp cần thiết được suy ra từ `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Ghi đè thủ công bằng `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none`, hoặc danh sách phân tách bằng dấu phẩy như `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` để thu hẹp lần chạy
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` để lọc provider trong container
- `OPENCLAW_SKIP_DOCKER_BUILD=1` để tái sử dụng image `openclaw:local-live` hiện có cho các lần chạy lại không cần rebuild
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` để bảo đảm credentials đến từ profile store (không phải env)
- `OPENCLAW_OPENWEBUI_MODEL=...` để chọn mô hình được Gateway công bố cho smoke Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` để ghi đè prompt kiểm tra nonce được dùng bởi smoke Open WebUI
- `OPENWEBUI_IMAGE=...` để ghi đè tag image Open WebUI đã ghim

## Kiểm tra hợp lý tài liệu

Chạy kiểm tra tài liệu sau khi sửa tài liệu: `pnpm check:docs`.
Chạy xác thực anchor Mintlify đầy đủ khi bạn cũng cần kiểm tra heading trong trang: `pnpm docs:check-links:anchors`.

## Hồi quy offline (an toàn cho CI)

Đây là các hồi quy “pipeline thật” không có provider thật:

- Gọi tool của Gateway (OpenAI giả lập, Gateway thật + vòng lặp agent thật): `src/gateway/gateway.test.ts` (case: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Wizard Gateway (WS `wizard.start`/`wizard.next`, ghi config + bắt buộc auth): `src/gateway/gateway.test.ts` (case: "runs wizard over ws and writes auth token config")

## Eval độ tin cậy agent (Skills)

Chúng ta đã có một vài test an toàn cho CI hoạt động như “eval độ tin cậy agent”:

- Gọi tool giả lập qua Gateway thật + vòng lặp agent (`src/gateway/gateway.test.ts`).
- Luồng wizard end-to-end xác thực wiring session và hiệu ứng config (`src/gateway/gateway.test.ts`).

Những gì vẫn còn thiếu cho Skills (xem [Skills](/vi/tools/skills)):

- **Ra quyết định:** khi skills được liệt kê trong prompt, agent có chọn đúng skill (hoặc tránh skill không liên quan) không?
- **Tuân thủ:** agent có đọc `SKILL.md` trước khi dùng và làm theo các bước/args bắt buộc không?
- **Hợp đồng workflow:** các kịch bản nhiều lượt assert thứ tự tool, truyền tiếp lịch sử session, và ranh giới sandbox.

Các eval tương lai trước hết nên giữ tính xác định:

- Một trình chạy kịch bản dùng provider giả lập để assert các lệnh gọi tool + thứ tự, việc đọc tệp skill, và wiring session.
- Một bộ nhỏ các kịch bản tập trung vào skill (dùng so với tránh, gating, prompt injection).
- Eval live tùy chọn (opt-in, có env gate) chỉ sau khi bộ an toàn cho CI đã có sẵn.

## Test hợp đồng (hình dạng Plugin và kênh)

Test hợp đồng xác minh rằng mọi Plugin và kênh đã đăng ký đều tuân thủ
hợp đồng interface của nó. Chúng lặp qua tất cả Plugin được khám phá và chạy một bộ
assertion về hình dạng và hành vi. Lane unit `pnpm test` mặc định cố ý
bỏ qua các tệp smoke và đường nối chung này; hãy chạy rõ ràng các lệnh hợp đồng
khi bạn chạm vào bề mặt kênh hoặc provider chung.

### Lệnh

- Tất cả hợp đồng: `pnpm test:contracts`
- Chỉ hợp đồng kênh: `pnpm test:contracts:channels`
- Chỉ hợp đồng provider: `pnpm test:contracts:plugins`

### Hợp đồng kênh

Nằm trong `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Hình dạng Plugin cơ bản (id, tên, capability)
- **setup** - Hợp đồng setup wizard
- **session-binding** - Hành vi binding session
- **outbound-payload** - Cấu trúc payload tin nhắn
- **inbound** - Xử lý tin nhắn inbound
- **actions** - Handler action của kênh
- **threading** - Xử lý ID thread
- **directory** - API directory/roster
- **group-policy** - Thực thi chính sách nhóm

### Hợp đồng trạng thái provider

Nằm trong `src/plugins/contracts/*.contract.test.ts`.

- **status** - Probe trạng thái kênh
- **registry** - Hình dạng registry Plugin

### Hợp đồng provider

Nằm trong `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Hợp đồng luồng auth
- **auth-choice** - Lựa chọn/chọn auth
- **catalog** - API catalog mô hình
- **discovery** - Khám phá Plugin
- **loader** - Tải Plugin
- **runtime** - Runtime provider
- **shape** - Hình dạng/interface Plugin
- **wizard** - Setup wizard

### Khi nào chạy

- Sau khi thay đổi export hoặc subpath của plugin-sdk
- Sau khi thêm hoặc sửa một kênh hoặc provider Plugin
- Sau khi refactor đăng ký hoặc khám phá Plugin

Test hợp đồng chạy trong CI và không cần khóa API thật.

## Thêm hồi quy (hướng dẫn)

Khi bạn sửa một vấn đề provider/mô hình được phát hiện trong live:

- Thêm hồi quy an toàn cho CI nếu có thể (provider mock/stub, hoặc ghi lại đúng phép biến đổi hình dạng request)
- Nếu vấn đề vốn chỉ xảy ra trong live (rate limit, chính sách auth), hãy giữ test live hẹp và opt-in qua biến môi trường
- Ưu tiên nhắm vào tầng nhỏ nhất bắt được lỗi:
  - lỗi chuyển đổi/replay request của provider → test models trực tiếp
  - lỗi pipeline session/history/tool của Gateway → smoke live Gateway hoặc test mock Gateway an toàn cho CI
- Guardrail duyệt SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` suy ra một target được lấy mẫu cho mỗi lớp SecretRef từ metadata registry (`listSecretTargetRegistryEntries()`), rồi assert các exec id dạng traversal-segment bị từ chối.
  - Nếu bạn thêm một họ target SecretRef `includeInPlan` mới trong `src/secrets/target-registry-data.ts`, hãy cập nhật `classifyTargetClass` trong test đó. Test cố ý fail với target id chưa được phân loại để các lớp mới không thể bị bỏ qua âm thầm.

## Liên quan

- [Kiểm thử live](/vi/help/testing-live)
- [CI](/vi/ci)
