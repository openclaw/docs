---
read_when:
    - Tìm kiếm, cài đặt hoặc cập nhật Skills hoặc Plugin
    - Xuất bản Skills hoặc Plugin lên kho đăng ký
    - Cấu hình clawhub CLI hoặc các ghi đè môi trường của nó
sidebarTitle: ClawHub
summary: 'ClawHub: kho đăng ký công khai cho Skills và Plugin của OpenClaw, các luồng cài đặt gốc và CLI clawhub'
title: ClawHub
x-i18n:
    generated_at: "2026-05-06T09:32:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 78ccf1911344d71b3b1c2c94691e15108305348e09db62aaaf1d03d852984acd
    source_path: tools/clawhub.md
    workflow: 16
---

ClawHub là registry công khai dành cho **Skills và Plugin của OpenClaw**.

- Dùng các lệnh `openclaw` native để tìm kiếm, cài đặt và cập nhật Skills, cũng như cài đặt Plugin từ ClawHub.
- Dùng CLI `clawhub` riêng cho các quy trình xác thực registry, xuất bản, xóa/khôi phục xóa và đồng bộ.

Trang web: [clawhub.ai](https://clawhub.ai)

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
    Bắt đầu một phiên OpenClaw mới - phiên đó sẽ nhận Skills mới.
  </Step>
  <Step title="Xuất bản (tùy chọn)">
    Đối với các quy trình đã xác thực với registry (xuất bản, đồng bộ, quản lý), hãy cài đặt
    CLI `clawhub` riêng:

    ```bash
    npm i -g clawhub
    # or
    pnpm add -g clawhub
    ```

  </Step>
</Steps>

## Luồng OpenClaw native

<Tabs>
  <Tab title="Skills">
    ```bash
    openclaw skills search "calendar"
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    Các lệnh `openclaw` native cài đặt vào workspace đang hoạt động của bạn và
    lưu metadata nguồn để các lệnh `update` sau này vẫn có thể dùng ClawHub.

  </Tab>
  <Tab title="Plugins">
    ```bash
    openclaw plugins search "calendar"
    openclaw plugins install clawhub:<package>
    openclaw plugins update --all
    ```

    `plugins search` truy vấn catalog Plugin của ClawHub và in ra các tên
    package sẵn sàng cài đặt. Dùng `clawhub:<package>` khi bạn muốn phân giải qua ClawHub.
    Các đặc tả Plugin npm-safe dạng trần sẽ cài đặt từ npm trong giai đoạn chuyển đổi khi ra mắt:

    ```bash
    openclaw plugins install openclaw-codex-app-server
    ```

    `npm:<package>` cũng chỉ dùng npm và hữu ích khi một đặc tả có thể
    bị mơ hồ:

    ```bash
    openclaw plugins install npm:openclaw-codex-app-server
    ```

    Các bản cài đặt Plugin xác thực khả năng tương thích `pluginApi` và
    `minGatewayVersion` được công bố trước khi quá trình cài đặt archive chạy, vì vậy
    các host không tương thích sẽ thất bại đóng sớm thay vì cài đặt một phần
    package. Khi một phiên bản package xuất bản artifact ClawPack,
    OpenClaw ưu tiên `.tgz` npm-pack đã tải lên chính xác, xác minh header digest ClawHub
    và các byte đã tải xuống, đồng thời ghi lại loại artifact, integrity npm,
    shasum npm, tên tarball và metadata digest ClawPack cho các lần
    cập nhật sau này. Các phiên bản package cũ hơn không có metadata ClawPack vẫn dùng
    đường dẫn xác minh archive package legacy.

  </Tab>
</Tabs>

<Note>
`openclaw plugins install clawhub:...` chỉ chấp nhận các họ Plugin
có thể cài đặt. Nếu một package ClawHub thực ra là một Skills, OpenClaw sẽ dừng và
chỉ bạn dùng `openclaw skills install <slug>` thay thế.

Các bản cài đặt Plugin ClawHub ẩn danh cũng thất bại đóng đối với package riêng tư.
Các kênh cộng đồng hoặc kênh không chính thức khác vẫn có thể cài đặt, nhưng OpenClaw
sẽ cảnh báo để operator có thể xem xét nguồn và quy trình xác minh trước khi bật
chúng.
</Note>

## ClawHub là gì

- Một registry công khai dành cho Skills và Plugin của OpenClaw.
- Một kho có phiên bản cho các gói Skills và metadata.
- Một bề mặt khám phá cho tìm kiếm, thẻ và tín hiệu sử dụng.

Một Skills điển hình là một gói tệp có phiên bản, bao gồm:

- Tệp `SKILL.md` với mô tả và cách dùng chính.
- Cấu hình, script hoặc tệp hỗ trợ tùy chọn được Skills sử dụng.
- Metadata như thẻ, tóm tắt và yêu cầu cài đặt.

ClawHub dùng metadata để hỗ trợ khám phá và cung cấp an toàn các
khả năng của Skills. Registry theo dõi tín hiệu sử dụng (sao, lượt tải xuống) để
cải thiện xếp hạng và mức độ hiển thị. Mỗi lần xuất bản tạo một phiên bản semver
mới, và registry lưu lịch sử phiên bản để người dùng có thể audit
các thay đổi.

## Workspace và tải Skills

CLI `clawhub` riêng cũng cài đặt Skills vào `./skills` dưới
thư mục làm việc hiện tại của bạn. Nếu một workspace OpenClaw đã được cấu hình,
`clawhub` sẽ fallback về workspace đó trừ khi bạn ghi đè bằng `--workdir`
(hoặc `CLAWHUB_WORKDIR`). OpenClaw tải Skills của workspace từ
`<workspace>/skills` và nhận chúng trong phiên **tiếp theo**.

Nếu bạn đã dùng `~/.openclaw/skills` hoặc Skills đi kèm, Skills trong workspace
sẽ được ưu tiên. Để biết thêm chi tiết về cách Skills được tải,
chia sẻ và kiểm soát, xem [Skills](/vi/tools/skills).

## Tính năng dịch vụ

| Tính năng                | Ghi chú                                                             |
| ------------------------ | ------------------------------------------------------------------- |
| Duyệt công khai          | Skills và nội dung `SKILL.md` của chúng có thể được xem công khai.  |
| Tìm kiếm                 | Được hỗ trợ bởi embedding (tìm kiếm vector), không chỉ từ khóa.     |
| Phiên bản hóa            | Semver, changelog và thẻ (bao gồm `latest`).                        |
| Tải xuống                | Zip theo từng phiên bản.                                            |
| Sao và bình luận         | Phản hồi cộng đồng.                                                 |
| Tóm tắt quét bảo mật     | Trang chi tiết hiển thị trạng thái quét mới nhất trước khi cài đặt hoặc tải xuống. |
| Trang chi tiết scanner   | Kết quả VirusTotal, ClawScan và phân tích tĩnh có liên kết sâu.     |
| Bảng điều khiển khôi phục của owner | Publisher có thể xem nội dung thuộc sở hữu đang bị giữ do quét từ `/dashboard`. |
| Owner yêu cầu quét lại   | Owner có thể yêu cầu quét lại giới hạn để khôi phục lỗi dương tính giả. |
| Điều phối nội dung       | Phê duyệt và audit.                                                 |
| API thân thiện với CLI   | Phù hợp cho tự động hóa và script.                                  |

## Bảo mật và điều phối

ClawHub mặc định là mở - bất kỳ ai cũng có thể tải Skills lên, nhưng tài khoản GitHub
phải **có ít nhất một tuần tuổi** để xuất bản. Điều này làm chậm
lạm dụng mà không chặn các contributor hợp lệ.

<AccordionGroup>
  <Accordion title="Quét bảo mật">
    ClawHub chạy các kiểm tra bảo mật tự động trên Skills và bản phát hành Plugin
    đã xuất bản. Các trang chi tiết công khai tóm tắt kết quả hiện tại, và các hàng scanner
    liên kết đến trang chi tiết riêng cho VirusTotal, ClawScan và phân tích
    tĩnh.

    Các bản phát hành bị giữ do quét hoặc bị chặn có thể không khả dụng trên catalog công khai và
    bề mặt cài đặt, nhưng vẫn hiển thị với owner của chúng trong `/dashboard`.

  </Accordion>
  <Accordion title="Báo cáo">
    - Bất kỳ người dùng đã đăng nhập nào cũng có thể báo cáo một Skills.
    - Lý do báo cáo là bắt buộc và được ghi lại.
    - Mỗi người dùng có thể có tối đa 20 báo cáo đang hoạt động cùng lúc.
    - Skills có hơn 3 báo cáo duy nhất sẽ mặc định bị tự động ẩn.

  </Accordion>
  <Accordion title="Điều phối">
    - Moderator có thể xem Skills bị ẩn, bỏ ẩn, xóa hoặc cấm người dùng.
    - Lạm dụng tính năng báo cáo có thể dẫn đến việc tài khoản bị cấm.
    - Muốn trở thành moderator? Hãy hỏi trong Discord OpenClaw và liên hệ với moderator hoặc maintainer.

  </Accordion>
</AccordionGroup>

## CLI ClawHub

Bạn chỉ cần phần này cho các quy trình đã xác thực với registry như
xuất bản/đồng bộ.

### Tùy chọn toàn cục

<ParamField path="--workdir <dir>" type="string">
  Thư mục làm việc. Mặc định: thư mục hiện tại; fallback về workspace OpenClaw.
</ParamField>
<ParamField path="--dir <dir>" type="string" default="skills">
  Thư mục Skills, tương đối với workdir.
</ParamField>
<ParamField path="--site <url>" type="string">
  URL cơ sở của site (đăng nhập bằng trình duyệt).
</ParamField>
<ParamField path="--registry <url>" type="string">
  URL cơ sở của API registry.
</ParamField>
<ParamField path="--no-input" type="boolean">
  Tắt prompt (không tương tác).
</ParamField>
<ParamField path="-V, --cli-version" type="boolean">
  In phiên bản CLI.
</ParamField>

### Lệnh

<AccordionGroup>
  <Accordion title="Xác thực (đăng nhập / đăng xuất / whoami)">
    ```bash
    clawhub login              # browser flow
    clawhub login --token <token>
    clawhub logout
    clawhub whoami
    ```

    Tùy chọn đăng nhập:

    - `--token <token>` - dán token API.
    - `--label <label>` - nhãn được lưu cho token đăng nhập bằng trình duyệt (mặc định: `CLI token`).
    - `--no-browser` - không mở trình duyệt (yêu cầu `--token`).

  </Accordion>
  <Accordion title="Tìm kiếm">
    ```bash
    clawhub search "query"
    ```

    Tìm kiếm Skills. Để khám phá Plugin/package, dùng `clawhub package explore`.

    - `--limit <n>` - số kết quả tối đa.

  </Accordion>
  <Accordion title="Duyệt / kiểm tra Plugin">
    ```bash
    clawhub package explore --family code-plugin
    clawhub package explore "episodic-claw" --family code-plugin
    clawhub package inspect episodic-claw
    ```

    `package explore` và `package inspect` là các bề mặt CLI ClawHub để khám phá Plugin/package và kiểm tra metadata. Các bản cài đặt OpenClaw native vẫn dùng `openclaw plugins install clawhub:<package>`.

    Tùy chọn:

    - `--family skill|code-plugin|bundle-plugin` - lọc họ package.
    - `--official` - chỉ hiển thị package chính thức.
    - `--executes-code` - chỉ hiển thị package thực thi code.
    - `--version <version>` / `--tag <tag>` - kiểm tra một phiên bản package cụ thể.
    - `--versions`, `--files`, `--file <path>` - kiểm tra lịch sử và tệp của package.
    - `--json` - đầu ra máy đọc được.

  </Accordion>
  <Accordion title="Cài đặt / cập nhật / liệt kê">
    ```bash
    clawhub install <slug>
    clawhub update <slug>
    clawhub update --all
    clawhub list
    ```

    Tùy chọn:

    - `--version <version>` - cài đặt hoặc cập nhật lên một phiên bản cụ thể (chỉ một slug trên `update`).
    - `--force` - ghi đè nếu thư mục đã tồn tại, hoặc khi tệp cục bộ không khớp với bất kỳ phiên bản đã xuất bản nào.
    - `clawhub list` đọc `.clawhub/lock.json`.

  </Accordion>
  <Accordion title="Xuất bản Skills">
    ```bash
    clawhub skill publish <path>
    ```

    Tùy chọn:

    - `--slug <slug>` - slug của Skills.
    - `--name <name>` - tên hiển thị.
    - `--version <version>` - phiên bản semver.
    - `--changelog <text>` - nội dung changelog (có thể để trống).
    - `--tags <tags>` - thẻ phân tách bằng dấu phẩy (mặc định: `latest`).

  </Accordion>
  <Accordion title="Xuất bản Plugin">
    ```bash
    clawhub package publish <source>
    ```

    `<source>` có thể là một thư mục cục bộ, `owner/repo`, `owner/repo@ref`, hoặc một
    URL GitHub.

    Tùy chọn:

    - `--dry-run` - xây dựng kế hoạch xuất bản chính xác mà không tải gì lên.
    - `--json` - phát đầu ra máy đọc được cho CI.
    - `--source-repo`, `--source-commit`, `--source-ref` - ghi đè tùy chọn khi tự động phát hiện là chưa đủ.

  </Accordion>
  <Accordion title="Yêu cầu quét lại">
    ```bash
    clawhub skill rescan <slug>
    clawhub skill rescan <slug> --yes --json

    clawhub package rescan <name>
    clawhub package rescan <name> --yes --json
    ```

    Các lệnh quét lại yêu cầu token owner đã đăng nhập và nhắm đến phiên bản Skills
    đã xuất bản mới nhất hoặc bản phát hành Plugin mới nhất. Trong các lần chạy không tương tác, truyền
    `--yes`.

    Phản hồi JSON bao gồm loại mục tiêu, tên, phiên bản, trạng thái quét lại và
    số lượng yêu cầu còn lại/tối đa cho phiên bản hoặc bản phát hành đó.

  </Accordion>
  <Accordion title="Xóa / khôi phục xóa (owner hoặc admin)">
    ```bash
    clawhub delete <slug> --yes
    clawhub undelete <slug> --yes
    ```
  </Accordion>
  <Accordion title="Đồng bộ (quét cục bộ + xuất bản mới hoặc đã cập nhật)">
    ```bash
    clawhub sync
    ```

    Tùy chọn:

    - `--root <dir...>` - root quét bổ sung.
    - `--all` - tải lên mọi thứ mà không cần prompt.
    - `--dry-run` - hiển thị những gì sẽ được tải lên.
    - `--bump <type>` - `patch|minor|major` cho cập nhật (mặc định: `patch`).
    - `--changelog <text>` - changelog cho cập nhật không tương tác.
    - `--tags <tags>` - thẻ phân tách bằng dấu phẩy (mặc định: `latest`).
    - `--concurrency <n>` - kiểm tra registry (mặc định: `4`).

  </Accordion>
</AccordionGroup>

## Quy trình thường dùng

<Tabs>
  <Tab title="Tìm kiếm">
    ```bash
    clawhub search "postgres backups"
    ```
  </Tab>
  <Tab title="Tìm một plugin">
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
  <Tab title="Xuất bản một skill riêng lẻ">
    ```bash
    clawhub skill publish ./my-skill --slug my-skill --name "My Skill" --version 1.0.0 --tags latest
    ```
  </Tab>
  <Tab title="Đồng bộ nhiều skills">
    ```bash
    clawhub sync --all
    ```
  </Tab>
  <Tab title="Xuất bản một plugin từ GitHub">
    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    clawhub package publish your-org/your-plugin@v1.0.0
    clawhub package publish https://github.com/your-org/your-plugin
    ```
  </Tab>
</Tabs>

### Siêu dữ liệu gói Plugin

Code plugins phải bao gồm siêu dữ liệu OpenClaw bắt buộc trong
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

Các gói đã xuất bản nên đóng gói kèm **JavaScript đã build** và trỏ
`runtimeExtensions` tới đầu ra đó. Các bản cài đặt từ Git checkout vẫn có thể
fallback về mã nguồn TypeScript khi không có tệp đã build, nhưng các entry runtime
đã build sẽ tránh việc biên dịch TypeScript lúc runtime trong các đường dẫn khởi động, doctor và tải plugin.

## Quản lý phiên bản, lockfile và telemetry

<AccordionGroup>
  <Accordion title="Quản lý phiên bản và thẻ">
    - Mỗi lần xuất bản tạo một `SkillVersion` **semver** mới.
    - Các thẻ (như `latest`) trỏ tới một phiên bản; việc di chuyển thẻ cho phép bạn rollback.
    - Changelog được gắn theo từng phiên bản và có thể để trống khi đồng bộ hoặc xuất bản cập nhật.

  </Accordion>
  <Accordion title="Thay đổi cục bộ so với phiên bản trong registry">
    Các bản cập nhật so sánh nội dung skill cục bộ với các phiên bản trong registry bằng
    content hash. Nếu các tệp cục bộ không khớp với bất kỳ phiên bản đã xuất bản nào,
    CLI sẽ hỏi trước khi ghi đè (hoặc yêu cầu `--force` trong
    các lần chạy không tương tác).
  </Accordion>
  <Accordion title="Quét đồng bộ và thư mục gốc fallback">
    `clawhub sync` quét workdir hiện tại của bạn trước. Nếu không tìm thấy skills,
    nó sẽ fallback về các vị trí cũ đã biết (ví dụ
    `~/openclaw/skills` và `~/.openclaw/skills`). Cơ chế này được thiết kế để
    tìm các bản cài đặt skill cũ hơn mà không cần cờ bổ sung.
  </Accordion>
  <Accordion title="Lưu trữ và lockfile">
    - Skills đã cài đặt được ghi lại trong `.clawhub/lock.json` dưới workdir của bạn.
    - Token xác thực được lưu trong tệp cấu hình ClawHub CLI (ghi đè bằng `CLAWHUB_CONFIG_PATH`).

  </Accordion>
  <Accordion title="Telemetry (số lượt cài đặt)">
    Khi bạn chạy `clawhub sync` trong khi đã đăng nhập, CLI gửi một snapshot tối thiểu
    để tính số lượt cài đặt. Bạn có thể tắt hoàn toàn tính năng này:

    ```bash
    export CLAWHUB_DISABLE_TELEMETRY=1
    ```

  </Accordion>
</AccordionGroup>

## Biến môi trường

| Biến                          | Tác dụng                                        |
| ----------------------------- | ----------------------------------------------- |
| `CLAWHUB_SITE`                | Ghi đè URL site.                                |
| `CLAWHUB_REGISTRY`            | Ghi đè URL API registry.                        |
| `CLAWHUB_CONFIG_PATH`         | Ghi đè nơi CLI lưu token/cấu hình.              |
| `CLAWHUB_WORKDIR`             | Ghi đè workdir mặc định.                        |
| `CLAWHUB_DISABLE_TELEMETRY=1` | Tắt telemetry khi chạy `sync`.                  |

## Liên quan

- [Plugin cộng đồng](/vi/plugins/community)
- [Plugins](/vi/tools/plugin)
- [Skills](/vi/tools/skills)
