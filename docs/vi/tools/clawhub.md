---
read_when:
    - Tìm kiếm, cài đặt hoặc cập nhật Skills hoặc Plugin
    - Xuất bản Skills hoặc Plugin lên kho đăng ký
    - Cấu hình CLI clawhub hoặc các ghi đè môi trường của nó
sidebarTitle: ClawHub
summary: 'ClawHub: registry công khai cho Skills và Plugin của OpenClaw, các luồng cài đặt gốc và CLI clawhub'
title: ClawHub
x-i18n:
    generated_at: "2026-04-29T23:17:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9ec09a3c76820137eb1f7ca829a184fc1ed6392d3b32a327ecbda4d2cad7a78d
    source_path: tools/clawhub.md
    workflow: 16
---

ClawHub là sổ đăng ký công khai cho **Skills và plugins của OpenClaw**.

- Dùng các lệnh `openclaw` gốc để tìm kiếm, cài đặt và cập nhật skills, cũng như cài đặt plugins từ ClawHub.
- Dùng CLI `clawhub` riêng cho các quy trình xác thực sổ đăng ký, phát hành, xóa/khôi phục xóa và đồng bộ.

Trang: [clawhub.ai](https://clawhub.ai)

## Bắt đầu nhanh

<Steps>
  <Step title="Tìm kiếm">
    ```bash
    openclaw skills search "calendar"
    ```
  </Step>
  <Step title="Cài đặt">
    ```bash
    openclaw skills install <skill-slug>
    ```
  </Step>
  <Step title="Sử dụng">
    Bắt đầu một phiên OpenClaw mới — phiên này sẽ nhận skill mới.
  </Step>
  <Step title="Phát hành (tùy chọn)">
    Với các quy trình đã xác thực với sổ đăng ký (phát hành, đồng bộ, quản lý), hãy cài đặt
    CLI `clawhub` riêng:

    ```bash
    npm i -g clawhub
    # or
    pnpm add -g clawhub
    ```

  </Step>
</Steps>

## Luồng OpenClaw gốc

<Tabs>
  <Tab title="Skills">
    ```bash
    openclaw skills search "calendar"
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    Các lệnh `openclaw` gốc cài đặt vào workspace đang hoạt động của bạn và
    lưu giữ siêu dữ liệu nguồn để các lần gọi `update` sau này có thể tiếp tục dùng ClawHub.

  </Tab>
  <Tab title="Plugins">
    ```bash
    openclaw plugins install clawhub:<package>
    openclaw plugins update --all
    ```

    Các đặc tả plugin trần an toàn với npm cũng được thử với ClawHub trước npm:

    ```bash
    openclaw plugins install openclaw-codex-app-server
    ```

    Dùng `npm:<package>` khi bạn muốn phân giải chỉ qua npm mà không
    tra cứu ClawHub:

    ```bash
    openclaw plugins install npm:openclaw-codex-app-server
    ```

    Việc cài đặt Plugin xác thực khả năng tương thích `pluginApi` và
    `minGatewayVersion` đã công bố trước khi chạy cài đặt archive, vì vậy
    các host không tương thích sẽ đóng an toàn từ sớm thay vì cài đặt
    gói một phần.

  </Tab>
</Tabs>

<Note>
`openclaw plugins install clawhub:...` chỉ chấp nhận các họ plugin có thể cài đặt.
Nếu một gói ClawHub thực ra là skill, OpenClaw sẽ dừng và
chỉ bạn dùng `openclaw skills install <slug>` thay thế.

Việc cài đặt plugin ClawHub ẩn danh cũng đóng an toàn với các gói riêng tư.
Các kênh cộng đồng hoặc không chính thức khác vẫn có thể cài đặt, nhưng OpenClaw
sẽ cảnh báo để người vận hành có thể xem lại nguồn và xác minh trước khi bật
chúng.
</Note>

## ClawHub là gì

- Một sổ đăng ký công khai cho skills và plugins của OpenClaw.
- Một kho có phiên bản cho các gói skill và siêu dữ liệu.
- Một bề mặt khám phá cho tìm kiếm, thẻ và tín hiệu sử dụng.

Một skill điển hình là một gói tệp có phiên bản, bao gồm:

- Một tệp `SKILL.md` với mô tả chính và cách sử dụng.
- Các cấu hình, script hoặc tệp hỗ trợ tùy chọn được skill sử dụng.
- Siêu dữ liệu như thẻ, tóm tắt và yêu cầu cài đặt.

ClawHub dùng siêu dữ liệu để hỗ trợ khám phá và phơi bày an toàn các
khả năng của skill. Sổ đăng ký theo dõi tín hiệu sử dụng (sao, lượt tải xuống) để
cải thiện xếp hạng và khả năng hiển thị. Mỗi lần phát hành tạo một phiên bản
semver mới, và sổ đăng ký giữ lịch sử phiên bản để người dùng có thể kiểm tra
các thay đổi.

## Workspace và tải skill

CLI `clawhub` riêng cũng cài đặt skills vào `./skills` trong
thư mục làm việc hiện tại của bạn. Nếu một workspace OpenClaw đã được cấu hình,
`clawhub` sẽ quay về workspace đó trừ khi bạn ghi đè `--workdir`
(hoặc `CLAWHUB_WORKDIR`). OpenClaw tải skills của workspace từ
`<workspace>/skills` và nhận chúng trong phiên **kế tiếp**.

Nếu bạn đã dùng `~/.openclaw/skills` hoặc skills đi kèm, skills trong workspace
sẽ được ưu tiên. Để biết thêm chi tiết về cách skills được tải,
chia sẻ và kiểm soát, xem [Skills](/vi/tools/skills).

## Tính năng dịch vụ

| Tính năng                | Ghi chú                                                               |
| ------------------------ | --------------------------------------------------------------------- |
| Duyệt công khai          | Skills và nội dung `SKILL.md` của chúng có thể xem công khai.         |
| Tìm kiếm                 | Được hỗ trợ bởi embedding (tìm kiếm vector), không chỉ từ khóa.       |
| Phiên bản hóa            | Semver, changelog và thẻ (bao gồm `latest`).                          |
| Tải xuống                | Zip cho mỗi phiên bản.                                                |
| Sao và bình luận         | Phản hồi cộng đồng.                                                   |
| Tóm tắt quét bảo mật     | Trang chi tiết hiển thị trạng thái quét mới nhất trước khi cài đặt hoặc tải xuống. |
| Trang chi tiết scanner   | Kết quả VirusTotal, ClawScan và phân tích tĩnh có liên kết sâu.       |
| Bảng điều khiển khôi phục của chủ sở hữu | Nhà phát hành có thể xem nội dung thuộc sở hữu bị giữ do quét từ `/dashboard`. |
| Quét lại theo yêu cầu của chủ sở hữu | Chủ sở hữu có thể yêu cầu số lần quét lại giới hạn để khôi phục false-positive. |
| Kiểm duyệt               | Phê duyệt và kiểm toán.                                               |
| API thân thiện với CLI   | Phù hợp cho tự động hóa và scripting.                                 |

## Bảo mật và kiểm duyệt

ClawHub mặc định là mở — bất kỳ ai cũng có thể tải skills lên, nhưng tài khoản GitHub
phải **ít nhất một tuần tuổi** mới được phát hành. Điều này làm chậm
lạm dụng mà không chặn người đóng góp hợp pháp.

<AccordionGroup>
  <Accordion title="Quét bảo mật">
    ClawHub chạy các kiểm tra bảo mật tự động trên skills và bản phát hành plugin
    đã phát hành. Các trang chi tiết công khai tóm tắt kết quả hiện tại, và các hàng scanner
    liên kết tới các trang chi tiết riêng cho VirusTotal, ClawScan và phân tích tĩnh.

    Các bản phát hành bị giữ do quét hoặc bị chặn có thể không có trên catalog công khai và
    bề mặt cài đặt, trong khi vẫn hiển thị với chủ sở hữu của chúng trong `/dashboard`.

  </Accordion>
  <Accordion title="Báo cáo">
    - Bất kỳ người dùng đã đăng nhập nào cũng có thể báo cáo một skill.
    - Lý do báo cáo là bắt buộc và được ghi lại.
    - Mỗi người dùng có thể có tối đa 20 báo cáo đang hoạt động cùng lúc.
    - Skills có hơn 3 báo cáo duy nhất sẽ mặc định được tự động ẩn.

  </Accordion>
  <Accordion title="Kiểm duyệt">
    - Người kiểm duyệt có thể xem skills bị ẩn, bỏ ẩn, xóa chúng hoặc cấm người dùng.
    - Lạm dụng tính năng báo cáo có thể dẫn đến bị cấm tài khoản.
    - Muốn trở thành người kiểm duyệt? Hãy hỏi trong Discord của OpenClaw và liên hệ một người kiểm duyệt hoặc maintainer.

  </Accordion>
</AccordionGroup>

## CLI ClawHub

Bạn chỉ cần công cụ này cho các quy trình đã xác thực với sổ đăng ký như
phát hành/đồng bộ.

### Tùy chọn toàn cục

<ParamField path="--workdir <dir>" type="string">
  Thư mục làm việc. Mặc định: thư mục hiện tại; quay về workspace OpenClaw.
</ParamField>
<ParamField path="--dir <dir>" type="string" default="skills">
  Thư mục Skills, tương đối với workdir.
</ParamField>
<ParamField path="--site <url>" type="string">
  URL gốc của trang (đăng nhập bằng trình duyệt).
</ParamField>
<ParamField path="--registry <url>" type="string">
  URL gốc API sổ đăng ký.
</ParamField>
<ParamField path="--no-input" type="boolean">
  Tắt prompt (không tương tác).
</ParamField>
<ParamField path="-V, --cli-version" type="boolean">
  In phiên bản CLI.
</ParamField>

### Lệnh

<AccordionGroup>
  <Accordion title="Xác thực (login / logout / whoami)">
    ```bash
    clawhub login              # browser flow
    clawhub login --token <token>
    clawhub logout
    clawhub whoami
    ```

    Tùy chọn đăng nhập:

    - `--token <token>` — dán một API token.
    - `--label <label>` — nhãn được lưu cho token đăng nhập bằng trình duyệt (mặc định: `CLI token`).
    - `--no-browser` — không mở trình duyệt (yêu cầu `--token`).

  </Accordion>
  <Accordion title="Tìm kiếm">
    ```bash
    clawhub search "query"
    ```

    Tìm kiếm skills. Để khám phá plugin/gói, dùng `clawhub package explore`.

    - `--limit <n>` — số kết quả tối đa.

  </Accordion>
  <Accordion title="Duyệt / kiểm tra plugins">
    ```bash
    clawhub package explore --family code-plugin
    clawhub package explore "episodic-claw" --family code-plugin
    clawhub package inspect episodic-claw
    ```

    `package explore` và `package inspect` là các bề mặt CLI ClawHub để khám phá plugin/gói và kiểm tra siêu dữ liệu. Việc cài đặt gốc của OpenClaw vẫn dùng `openclaw plugins install clawhub:<package>`.

    Tùy chọn:

    - `--family skill|code-plugin|bundle-plugin` — lọc họ gói.
    - `--official` — chỉ hiển thị gói chính thức.
    - `--executes-code` — chỉ hiển thị các gói thực thi mã.
    - `--version <version>` / `--tag <tag>` — kiểm tra một phiên bản gói cụ thể.
    - `--versions`, `--files`, `--file <path>` — kiểm tra lịch sử và tệp của gói.
    - `--json` — đầu ra máy đọc được.

  </Accordion>
  <Accordion title="Cài đặt / cập nhật / liệt kê">
    ```bash
    clawhub install <slug>
    clawhub update <slug>
    clawhub update --all
    clawhub list
    ```

    Tùy chọn:

    - `--version <version>` — cài đặt hoặc cập nhật lên một phiên bản cụ thể (chỉ một slug trên `update`).
    - `--force` — ghi đè nếu thư mục đã tồn tại, hoặc khi tệp cục bộ không khớp với bất kỳ phiên bản đã phát hành nào.
    - `clawhub list` đọc `.clawhub/lock.json`.

  </Accordion>
  <Accordion title="Phát hành skills">
    ```bash
    clawhub skill publish <path>
    ```

    Tùy chọn:

    - `--slug <slug>` — slug của skill.
    - `--name <name>` — tên hiển thị.
    - `--version <version>` — phiên bản semver.
    - `--changelog <text>` — văn bản changelog (có thể trống).
    - `--tags <tags>` — thẻ phân tách bằng dấu phẩy (mặc định: `latest`).

  </Accordion>
  <Accordion title="Phát hành plugins">
    ```bash
    clawhub package publish <source>
    ```

    `<source>` có thể là thư mục cục bộ, `owner/repo`, `owner/repo@ref`, hoặc một
    URL GitHub.

    Tùy chọn:

    - `--dry-run` — xây dựng kế hoạch phát hành chính xác mà không tải gì lên.
    - `--json` — phát đầu ra máy đọc được cho CI.
    - `--source-repo`, `--source-commit`, `--source-ref` — các ghi đè tùy chọn khi tự động phát hiện là chưa đủ.

  </Accordion>
  <Accordion title="Yêu cầu quét lại">
    ```bash
    clawhub skill rescan <slug>
    clawhub skill rescan <slug> --yes --json

    clawhub package rescan <name>
    clawhub package rescan <name> --yes --json
    ```

    Các lệnh quét lại yêu cầu token chủ sở hữu đã đăng nhập và nhắm tới phiên bản
    skill đã phát hành mới nhất hoặc bản phát hành plugin mới nhất. Trong các lần chạy không tương tác, truyền
    `--yes`.

    Phản hồi JSON bao gồm loại mục tiêu, tên, phiên bản, trạng thái quét lại và
    số lượng yêu cầu còn lại/tối đa cho phiên bản hoặc bản phát hành đó.

  </Accordion>
  <Accordion title="Xóa / khôi phục xóa (chủ sở hữu hoặc admin)">
    ```bash
    clawhub delete <slug> --yes
    clawhub undelete <slug> --yes
    ```
  </Accordion>
  <Accordion title="Đồng bộ (quét cục bộ + phát hành mới hoặc cập nhật)">
    ```bash
    clawhub sync
    ```

    Tùy chọn:

    - `--root <dir...>` — gốc quét bổ sung.
    - `--all` — tải lên mọi thứ mà không cần prompt.
    - `--dry-run` — hiển thị những gì sẽ được tải lên.
    - `--bump <type>` — `patch|minor|major` cho cập nhật (mặc định: `patch`).
    - `--changelog <text>` — changelog cho cập nhật không tương tác.
    - `--tags <tags>` — thẻ phân tách bằng dấu phẩy (mặc định: `latest`).
    - `--concurrency <n>` — kiểm tra sổ đăng ký (mặc định: `4`).

  </Accordion>
</AccordionGroup>

## Quy trình phổ biến

<Tabs>
  <Tab title="Tìm kiếm">
    ```bash
    clawhub search "postgres backups"
    ```
  </Tab>
  <Tab title="Tìm Plugin">
    ```bash
    clawhub package explore --family code-plugin
    clawhub package explore "memory" --family code-plugin
    clawhub package inspect episodic-claw
    ```
  </Tab>
  <Tab title="Cài đặt">
    ```bash
    clawhub install my-skill-pack
    ```
  </Tab>
  <Tab title="Cập nhật tất cả">
    ```bash
    clawhub update --all
    ```
  </Tab>
  <Tab title="Phát hành một skill đơn lẻ">
    ```bash
    clawhub skill publish ./my-skill --slug my-skill --name "My Skill" --version 1.0.0 --tags latest
    ```
  </Tab>
  <Tab title="Đồng bộ nhiều skill">
    ```bash
    clawhub sync --all
    ```
  </Tab>
  <Tab title="Phát hành Plugin từ GitHub">
    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    clawhub package publish your-org/your-plugin@v1.0.0
    clawhub package publish https://github.com/your-org/your-plugin
    ```
  </Tab>
</Tabs>

### Siêu dữ liệu gói Plugin

Plugin mã phải bao gồm siêu dữ liệu OpenClaw bắt buộc trong
`package.json`:

```json
{
  "name": "@myorg/openclaw-my-plugin",
  "version": "1.0.0",
  "type": "module",
  "openclaw": {
    "extensions": ["./src/index.ts"],
    "runtimeExtensions": ["./dist/index.js"],
    "compat": {
      "pluginApi": ">=2026.3.24-beta.2",
      "minGatewayVersion": "2026.3.24-beta.2"
    },
    "build": {
      "openclawVersion": "2026.3.24-beta.2",
      "pluginSdkVersion": "2026.3.24-beta.2"
    }
  }
}
```

Các gói đã phát hành nên đi kèm **JavaScript đã build** và trỏ
`runtimeExtensions` đến đầu ra đó. Các bản cài đặt từ Git checkout vẫn có thể dự phòng
về mã nguồn TypeScript khi không có tệp đã build, nhưng các mục runtime
đã build tránh phải biên dịch TypeScript lúc chạy trong các đường dẫn khởi động, doctor và
tải Plugin.

## Đánh phiên bản, lockfile và telemetry

<AccordionGroup>
  <Accordion title="Đánh phiên bản và thẻ">
    - Mỗi lần phát hành tạo một `SkillVersion` **semver** mới.
    - Các thẻ (như `latest`) trỏ đến một phiên bản; di chuyển thẻ cho phép bạn khôi phục.
    - Nhật ký thay đổi được gắn theo từng phiên bản và có thể để trống khi đồng bộ hoặc phát hành bản cập nhật.

  </Accordion>
  <Accordion title="Thay đổi cục bộ so với phiên bản registry">
    Các bản cập nhật so sánh nội dung skill cục bộ với các phiên bản registry bằng
    content hash. Nếu các tệp cục bộ không khớp với bất kỳ phiên bản đã phát hành nào, 
    CLI sẽ hỏi trước khi ghi đè (hoặc yêu cầu `--force` trong
    các lần chạy không tương tác).
  </Accordion>
  <Accordion title="Quét đồng bộ và thư mục gốc dự phòng">
    `clawhub sync` quét workdir hiện tại của bạn trước. Nếu không tìm thấy skill nào,
    nó sẽ dự phòng về các vị trí cũ đã biết (ví dụ
    `~/openclaw/skills` và `~/.openclaw/skills`). Điều này được thiết kế để
    tìm các bản cài đặt skill cũ mà không cần thêm cờ.
  </Accordion>
  <Accordion title="Lưu trữ và lockfile">
    - Các skill đã cài đặt được ghi lại trong `.clawhub/lock.json` dưới workdir của bạn.
    - Token xác thực được lưu trong tệp cấu hình ClawHub CLI (ghi đè qua `CLAWHUB_CONFIG_PATH`).

  </Accordion>
  <Accordion title="Telemetry (số lượt cài đặt)">
    Khi bạn chạy `clawhub sync` trong lúc đã đăng nhập, CLI gửi một bản chụp tối thiểu
    để tính số lượt cài đặt. Bạn có thể tắt hoàn toàn tính năng này:

    ```bash
    export CLAWHUB_DISABLE_TELEMETRY=1
    ```

  </Accordion>
</AccordionGroup>

## Biến môi trường

| Biến                          | Tác dụng                                        |
| ----------------------------- | ----------------------------------------------- |
| `CLAWHUB_SITE`                | Ghi đè URL trang.                               |
| `CLAWHUB_REGISTRY`            | Ghi đè URL API registry.                        |
| `CLAWHUB_CONFIG_PATH`         | Ghi đè nơi CLI lưu token/cấu hình.              |
| `CLAWHUB_WORKDIR`             | Ghi đè workdir mặc định.                        |
| `CLAWHUB_DISABLE_TELEMETRY=1` | Tắt telemetry khi `sync`.                       |

## Liên quan

- [Plugin cộng đồng](/vi/plugins/community)
- [Plugin](/vi/tools/plugin)
- [Skills](/vi/tools/skills)
