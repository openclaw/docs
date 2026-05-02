---
read_when:
    - Tìm kiếm, cài đặt hoặc cập nhật Skills hoặc Plugin
    - Xuất bản Skills hoặc Plugin lên kho đăng ký
    - Cấu hình CLI clawhub hoặc các giá trị ghi đè môi trường của nó
sidebarTitle: ClawHub
summary: 'ClawHub: kho đăng ký công khai cho Skills và Plugin của OpenClaw, các quy trình cài đặt gốc và CLI clawhub'
title: ClawHub
x-i18n:
    generated_at: "2026-05-02T10:54:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 353b224ccfb8096c270b7896e640e9e419fcb50c265298102a5ce0173566933e
    source_path: tools/clawhub.md
    workflow: 16
---

ClawHub là registry công khai cho **Skills và plugins của OpenClaw**.

- Dùng các lệnh `openclaw` gốc để tìm kiếm, cài đặt và cập nhật Skills, cũng như cài đặt plugins từ ClawHub.
- Dùng CLI `clawhub` riêng cho các workflow xác thực registry, publish, delete/undelete và sync.

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
    Bắt đầu một phiên OpenClaw mới — phiên này sẽ nhận Skills mới.
  </Step>
  <Step title="Publish (tùy chọn)">
    Với các workflow đã xác thực registry (publish, sync, quản lý), hãy cài đặt
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
    lưu metadata nguồn để các lần gọi `update` sau này có thể tiếp tục dùng ClawHub.

  </Tab>
  <Tab title="Plugins">
    ```bash
    openclaw plugins search "calendar"
    openclaw plugins install clawhub:<package>
    openclaw plugins update --all
    ```

    `plugins search` truy vấn danh mục Plugin của ClawHub và in ra các
    tên package sẵn sàng để cài đặt. Các đặc tả Plugin dạng trần an toàn với npm cũng được thử với ClawHub
    trước npm:

    ```bash
    openclaw plugins install openclaw-codex-app-server
    ```

    Dùng `npm:<package>` khi bạn muốn phân giải chỉ qua npm mà không
    tra cứu ClawHub:

    ```bash
    openclaw plugins install npm:openclaw-codex-app-server
    ```

    Các lượt cài đặt Plugin xác thực tính tương thích `pluginApi` và
    `minGatewayVersion` được khai báo trước khi chạy cài đặt archive, vì vậy
    host không tương thích sẽ đóng thất bại sớm thay vì cài đặt package
    một phần. Khi một phiên bản package publish một artifact ClawPack,
    OpenClaw ưu tiên artifact đó, xác minh header digest ClawHub và
    các byte đã tải xuống, đồng thời ghi lại metadata digest ClawPack cho các
    lần cập nhật sau. Những phiên bản package cũ hơn không có metadata ClawPack vẫn dùng
    đường dẫn xác minh archive package cũ.

  </Tab>
</Tabs>

<Note>
`openclaw plugins install clawhub:...` chỉ chấp nhận các nhóm Plugin
có thể cài đặt. Nếu một package ClawHub thực ra là một Skills, OpenClaw sẽ dừng và
chỉ bạn dùng `openclaw skills install <slug>` thay thế.

Các lượt cài đặt Plugin ClawHub ẩn danh cũng đóng thất bại với package riêng tư.
Các kênh cộng đồng hoặc kênh không chính thức khác vẫn có thể cài đặt, nhưng OpenClaw
cảnh báo để operator có thể xem xét nguồn và việc xác minh trước khi bật
chúng.
</Note>

## ClawHub là gì

- Một registry công khai cho Skills và plugins của OpenClaw.
- Một kho có phiên bản cho các bundle Skills và metadata.
- Một bề mặt khám phá cho tìm kiếm, tag và tín hiệu sử dụng.

Một Skills điển hình là một bundle tệp có phiên bản, bao gồm:

- Một tệp `SKILL.md` với mô tả và cách dùng chính.
- Các cấu hình, script hoặc tệp hỗ trợ tùy chọn được Skills dùng.
- Metadata như tag, tóm tắt và yêu cầu cài đặt.

ClawHub dùng metadata để hỗ trợ khám phá và phơi bày an toàn các
khả năng của Skills. Registry theo dõi tín hiệu sử dụng (sao, lượt tải xuống) để
cải thiện xếp hạng và khả năng hiển thị. Mỗi lần publish tạo một phiên bản semver
mới, và registry giữ lịch sử phiên bản để người dùng có thể kiểm tra
các thay đổi.

## Workspace và tải Skills

CLI `clawhub` riêng cũng cài Skills vào `./skills` trong
thư mục làm việc hiện tại của bạn. Nếu một workspace OpenClaw đã được cấu hình,
`clawhub` sẽ dùng workspace đó làm dự phòng trừ khi bạn ghi đè `--workdir`
(hoặc `CLAWHUB_WORKDIR`). OpenClaw tải Skills của workspace từ
`<workspace>/skills` và nhận chúng trong phiên **tiếp theo**.

Nếu bạn đã dùng `~/.openclaw/skills` hoặc Skills đi kèm, Skills trong workspace
sẽ được ưu tiên. Để biết thêm chi tiết về cách Skills được tải,
chia sẻ và kiểm soát, xem [Skills](/vi/tools/skills).

## Tính năng dịch vụ

| Tính năng                | Ghi chú                                                              |
| ------------------------ | ------------------------------------------------------------------- |
| Duyệt công khai          | Skills và nội dung `SKILL.md` của chúng có thể được xem công khai.  |
| Tìm kiếm                 | Dựa trên embedding (tìm kiếm vector), không chỉ từ khóa.             |
| Quản lý phiên bản        | Semver, changelog và tag (bao gồm `latest`).                        |
| Lượt tải xuống           | Zip theo từng phiên bản.                                            |
| Sao và bình luận         | Phản hồi cộng đồng.                                                 |
| Tóm tắt quét bảo mật     | Trang chi tiết hiển thị trạng thái quét mới nhất trước khi cài đặt hoặc tải xuống. |
| Trang chi tiết trình quét | Kết quả VirusTotal, ClawScan và phân tích tĩnh có liên kết sâu.     |
| Dashboard khôi phục chủ sở hữu | Publisher có thể xem nội dung sở hữu đang bị giữ do quét từ `/dashboard`. |
| Quét lại theo yêu cầu của chủ sở hữu | Chủ sở hữu có thể yêu cầu quét lại giới hạn để khôi phục false-positive. |
| Kiểm duyệt               | Phê duyệt và kiểm tra.                                              |
| API thân thiện với CLI   | Phù hợp cho tự động hóa và scripting.                               |

## Bảo mật và kiểm duyệt

ClawHub mở theo mặc định — bất kỳ ai cũng có thể upload Skills, nhưng một tài khoản GitHub
phải **ít nhất một tuần tuổi** để publish. Điều này làm chậm hành vi
lạm dụng mà không chặn các contributor hợp lệ.

<AccordionGroup>
  <Accordion title="Quét bảo mật">
    ClawHub chạy các kiểm tra bảo mật tự động trên Skills đã publish và các bản phát hành
    Plugin. Trang chi tiết công khai tóm tắt kết quả hiện tại, và các hàng trình quét
    liên kết tới trang chi tiết riêng cho VirusTotal, ClawScan và phân tích
    tĩnh.

    Các bản phát hành bị giữ do quét hoặc bị chặn có thể không khả dụng trên danh mục công khai và
    bề mặt cài đặt, trong khi vẫn hiển thị với chủ sở hữu trong `/dashboard`.

  </Accordion>
  <Accordion title="Báo cáo">
    - Bất kỳ người dùng đã đăng nhập nào cũng có thể báo cáo một Skills.
    - Lý do báo cáo là bắt buộc và được ghi lại.
    - Mỗi người dùng có thể có tối đa 20 báo cáo đang hoạt động cùng lúc.
    - Skills có hơn 3 báo cáo duy nhất sẽ tự động bị ẩn theo mặc định.

  </Accordion>
  <Accordion title="Kiểm duyệt">
    - Moderator có thể xem Skills bị ẩn, bỏ ẩn chúng, xóa chúng hoặc cấm người dùng.
    - Lạm dụng tính năng báo cáo có thể dẫn đến cấm tài khoản.
    - Muốn trở thành moderator? Hãy hỏi trong Discord của OpenClaw và liên hệ với một moderator hoặc maintainer.

  </Accordion>
</AccordionGroup>

## CLI ClawHub

Bạn chỉ cần phần này cho các workflow đã xác thực registry như
publish/sync.

### Tùy chọn toàn cục

<ParamField path="--workdir <dir>" type="string">
  Thư mục làm việc. Mặc định: thư mục hiện tại; dùng workspace OpenClaw làm dự phòng.
</ParamField>
<ParamField path="--dir <dir>" type="string" default="skills">
  Thư mục Skills, tương đối với workdir.
</ParamField>
<ParamField path="--site <url>" type="string">
  URL gốc của trang (đăng nhập trình duyệt).
</ParamField>
<ParamField path="--registry <url>" type="string">
  URL gốc API registry.
</ParamField>
<ParamField path="--no-input" type="boolean">
  Tắt prompt (không tương tác).
</ParamField>
<ParamField path="-V, --cli-version" type="boolean">
  In phiên bản CLI.
</ParamField>

### Lệnh

<AccordionGroup>
  <Accordion title="Auth (login / logout / whoami)">
    ```bash
    clawhub login              # browser flow
    clawhub login --token <token>
    clawhub logout
    clawhub whoami
    ```

    Tùy chọn đăng nhập:

    - `--token <token>` — dán một token API.
    - `--label <label>` — nhãn được lưu cho token đăng nhập trình duyệt (mặc định: `CLI token`).
    - `--no-browser` — không mở trình duyệt (yêu cầu `--token`).

  </Accordion>
  <Accordion title="Tìm kiếm">
    ```bash
    clawhub search "query"
    ```

    Tìm kiếm Skills. Để khám phá Plugin/package, dùng `clawhub package explore`.

    - `--limit <n>` — kết quả tối đa.

  </Accordion>
  <Accordion title="Duyệt / kiểm tra plugins">
    ```bash
    clawhub package explore --family code-plugin
    clawhub package explore "episodic-claw" --family code-plugin
    clawhub package inspect episodic-claw
    ```

    `package explore` và `package inspect` là các bề mặt CLI ClawHub để khám phá Plugin/package và kiểm tra metadata. Các lượt cài đặt OpenClaw gốc vẫn dùng `openclaw plugins install clawhub:<package>`.

    Tùy chọn:

    - `--family skill|code-plugin|bundle-plugin` — lọc nhóm package.
    - `--official` — chỉ hiển thị package chính thức.
    - `--executes-code` — chỉ hiển thị package thực thi mã.
    - `--version <version>` / `--tag <tag>` — kiểm tra một phiên bản package cụ thể.
    - `--versions`, `--files`, `--file <path>` — kiểm tra lịch sử và tệp của package.
    - `--json` — đầu ra máy có thể đọc.

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
    - `--force` — ghi đè nếu thư mục đã tồn tại, hoặc khi các tệp cục bộ không khớp với bất kỳ phiên bản đã publish nào.
    - `clawhub list` đọc `.clawhub/lock.json`.

  </Accordion>
  <Accordion title="Publish Skills">
    ```bash
    clawhub skill publish <path>
    ```

    Tùy chọn:

    - `--slug <slug>` — slug Skills.
    - `--name <name>` — tên hiển thị.
    - `--version <version>` — phiên bản semver.
    - `--changelog <text>` — văn bản changelog (có thể trống).
    - `--tags <tags>` — tag phân tách bằng dấu phẩy (mặc định: `latest`).

  </Accordion>
  <Accordion title="Publish plugins">
    ```bash
    clawhub package publish <source>
    ```

    `<source>` có thể là một thư mục cục bộ, `owner/repo`, `owner/repo@ref`, hoặc một
    URL GitHub.

    Tùy chọn:

    - `--dry-run` — dựng kế hoạch publish chính xác mà không upload gì.
    - `--json` — xuất đầu ra máy có thể đọc cho CI.
    - `--source-repo`, `--source-commit`, `--source-ref` — ghi đè tùy chọn khi tự động phát hiện là chưa đủ.

  </Accordion>
  <Accordion title="Yêu cầu quét lại">
    ```bash
    clawhub skill rescan <slug>
    clawhub skill rescan <slug> --yes --json

    clawhub package rescan <name>
    clawhub package rescan <name> --yes --json
    ```

    Các lệnh quét lại yêu cầu token chủ sở hữu đã đăng nhập và nhắm tới phiên bản Skills
    đã publish mới nhất hoặc bản phát hành Plugin. Trong các lần chạy không tương tác, truyền
    `--yes`.

    Phản hồi JSON bao gồm loại mục tiêu, tên, phiên bản, trạng thái quét lại, và
    số lượng yêu cầu còn lại/tối đa cho phiên bản hoặc bản phát hành đó.

  </Accordion>
  <Accordion title="Xóa / khôi phục xóa (chủ sở hữu hoặc admin)">
    ```bash
    clawhub delete <slug> --yes
    clawhub undelete <slug> --yes
    ```
  </Accordion>
  <Accordion title="Sync (quét cục bộ + publish mới hoặc đã cập nhật)">
    ```bash
    clawhub sync
    ```

    Tùy chọn:

    - `--root <dir...>` — root quét bổ sung.
    - `--all` — upload mọi thứ mà không cần prompt.
    - `--dry-run` — hiển thị những gì sẽ được upload.
    - `--bump <type>` — `patch|minor|major` cho cập nhật (mặc định: `patch`).
    - `--changelog <text>` — changelog cho các cập nhật không tương tác.
    - `--tags <tags>` — tag phân tách bằng dấu phẩy (mặc định: `latest`).
    - `--concurrency <n>` — kiểm tra registry (mặc định: `4`).

  </Accordion>
</AccordionGroup>

## Workflow phổ biến

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
  <Tab title="Xuất bản một skill đơn lẻ">
    ```bash
    clawhub skill publish ./my-skill --slug my-skill --name "My Skill" --version 1.0.0 --tags latest
    ```
  </Tab>
  <Tab title="Đồng bộ nhiều skill">
    ```bash
    clawhub sync --all
    ```
  </Tab>
  <Tab title="Xuất bản Plugin từ GitHub">
    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    clawhub package publish your-org/your-plugin@v1.0.0
    clawhub package publish https://github.com/your-org/your-plugin
    ```
  </Tab>
</Tabs>

### Siêu dữ liệu gói Plugin

Code plugin phải bao gồm siêu dữ liệu OpenClaw bắt buộc trong
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

Các gói đã xuất bản nên đi kèm **JavaScript đã build** và trỏ
`runtimeExtensions` đến đầu ra đó. Các bản cài đặt qua Git checkout vẫn có thể
dự phòng về mã nguồn TypeScript khi không có tệp đã build, nhưng các mục nhập runtime
đã build sẽ tránh việc biên dịch TypeScript runtime trong các đường dẫn khởi động, doctor và tải Plugin.

## Đánh phiên bản, lockfile và telemetry

<AccordionGroup>
  <Accordion title="Đánh phiên bản và thẻ">
    - Mỗi lần xuất bản tạo một `SkillVersion` **semver** mới.
    - Thẻ (như `latest`) trỏ đến một phiên bản; việc di chuyển thẻ cho phép bạn khôi phục.
    - Changelog được gắn theo từng phiên bản và có thể để trống khi đồng bộ hoặc xuất bản bản cập nhật.

  </Accordion>
  <Accordion title="Thay đổi cục bộ so với phiên bản registry">
    Các bản cập nhật so sánh nội dung skill cục bộ với các phiên bản registry bằng
    mã băm nội dung. Nếu các tệp cục bộ không khớp với bất kỳ phiên bản đã xuất bản nào,
    CLI sẽ hỏi trước khi ghi đè (hoặc yêu cầu `--force` trong
    các lần chạy không tương tác).
  </Accordion>
  <Accordion title="Quét đồng bộ và thư mục gốc dự phòng">
    `clawhub sync` quét workdir hiện tại của bạn trước. Nếu không tìm thấy skill nào,
    nó sẽ dự phòng về các vị trí cũ đã biết (ví dụ
    `~/openclaw/skills` và `~/.openclaw/skills`). Cơ chế này được thiết kế để
    tìm các bản cài đặt skill cũ hơn mà không cần cờ bổ sung.
  </Accordion>
  <Accordion title="Lưu trữ và lockfile">
    - Các skill đã cài đặt được ghi lại trong `.clawhub/lock.json` dưới workdir của bạn.
    - Token xác thực được lưu trong tệp cấu hình CLI của ClawHub (ghi đè qua `CLAWHUB_CONFIG_PATH`).

  </Accordion>
  <Accordion title="Telemetry (số lượt cài đặt)">
    Khi bạn chạy `clawhub sync` trong lúc đã đăng nhập, CLI gửi một snapshot tối thiểu
    để tính số lượt cài đặt. Bạn có thể tắt hoàn toàn tính năng này:

    ```bash
    export CLAWHUB_DISABLE_TELEMETRY=1
    ```

  </Accordion>
</AccordionGroup>

## Biến môi trường

| Biến                          | Hiệu lực                                         |
| ----------------------------- | ----------------------------------------------- |
| `CLAWHUB_SITE`                | Ghi đè URL trang web.                           |
| `CLAWHUB_REGISTRY`            | Ghi đè URL API registry.                        |
| `CLAWHUB_CONFIG_PATH`         | Ghi đè nơi CLI lưu token/cấu hình.              |
| `CLAWHUB_WORKDIR`             | Ghi đè workdir mặc định.                        |
| `CLAWHUB_DISABLE_TELEMETRY=1` | Tắt telemetry khi chạy `sync`.                  |

## Liên quan

- [Plugin cộng đồng](/vi/plugins/community)
- [Plugins](/vi/tools/plugin)
- [Skills](/vi/tools/skills)
