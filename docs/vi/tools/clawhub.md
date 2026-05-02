---
read_when:
    - Tìm kiếm, cài đặt hoặc cập nhật Skills hoặc Plugin
    - Xuất bản Skills hoặc các Plugin lên kho đăng ký
    - Cấu hình CLI clawhub hoặc các giá trị ghi đè môi trường của nó
sidebarTitle: ClawHub
summary: 'ClawHub: registry công khai cho Skills và plugin của OpenClaw, các quy trình cài đặt tích hợp sẵn và CLI clawhub'
title: ClawHub
x-i18n:
    generated_at: "2026-05-02T20:57:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: cd422cb3e7e53fcc6d2b8a557ebc569debb0b470d5fcf141d90499c03fb4d7b3
    source_path: tools/clawhub.md
    workflow: 16
---

ClawHub là sổ đăng ký công khai cho **Skills và Plugin của OpenClaw**.

- Dùng các lệnh `openclaw` gốc để tìm kiếm, cài đặt và cập nhật Skills, cũng như cài đặt Plugin từ ClawHub.
- Dùng CLI `clawhub` riêng cho các luồng xác thực sổ đăng ký, phát hành, xóa/khôi phục xóa và đồng bộ.

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
  <Step title="Phát hành (tùy chọn)">
    Với các luồng đã xác thực với sổ đăng ký (phát hành, đồng bộ, quản lý), hãy cài đặt
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
    lưu siêu dữ liệu nguồn để các lệnh `update` sau này có thể tiếp tục dùng ClawHub.

  </Tab>
  <Tab title="Plugin">
    ```bash
    openclaw plugins search "calendar"
    openclaw plugins install clawhub:<package>
    openclaw plugins update --all
    ```

    `plugins search` truy vấn danh mục Plugin của ClawHub và in ra tên
    package sẵn sàng để cài đặt. Dùng `clawhub:<package>` khi bạn muốn phân giải qua ClawHub.
    Các đặc tả Plugin npm-safe dạng trần sẽ cài từ npm trong giai đoạn chuyển đổi ra mắt:

    ```bash
    openclaw plugins install openclaw-codex-app-server
    ```

    `npm:<package>` cũng chỉ dùng npm và hữu ích khi một đặc tả có thể
    mơ hồ theo cách khác:

    ```bash
    openclaw plugins install npm:openclaw-codex-app-server
    ```

    Việc cài Plugin xác thực tính tương thích của `pluginApi` và
    `minGatewayVersion` được công bố trước khi cài đặt kho lưu trữ chạy, để
    các host không tương thích đóng lỗi sớm thay vì cài đặt package một phần.
    Khi một phiên bản package phát hành artifact ClawPack, OpenClaw ưu tiên
    `.tgz` npm-pack đã tải lên chính xác, xác minh header digest ClawHub và
    byte đã tải xuống, đồng thời ghi lại loại artifact, integrity npm, shasum npm,
    tên tarball và siêu dữ liệu digest ClawPack cho các bản cập nhật sau này.
    Các phiên bản package cũ không có siêu dữ liệu ClawPack vẫn dùng đường dẫn
    xác minh kho lưu trữ package cũ.

  </Tab>
</Tabs>

<Note>
`openclaw plugins install clawhub:...` chỉ chấp nhận các họ Plugin
có thể cài đặt. Nếu một package ClawHub thực ra là một Skills, OpenClaw dừng lại và
chỉ bạn sang `openclaw skills install <slug>` thay thế.

Việc cài đặt Plugin ClawHub ẩn danh cũng đóng lỗi đối với các package riêng tư.
Các kênh cộng đồng hoặc kênh không chính thức khác vẫn có thể cài đặt, nhưng OpenClaw
cảnh báo để người vận hành có thể xem xét nguồn và quá trình xác minh trước khi bật
chúng.
</Note>

## ClawHub là gì

- Một sổ đăng ký công khai cho Skills và Plugin của OpenClaw.
- Một kho có phiên bản cho các gói Skills và siêu dữ liệu.
- Một bề mặt khám phá cho tìm kiếm, thẻ và tín hiệu sử dụng.

Một Skills điển hình là một gói tệp có phiên bản, bao gồm:

- Một tệp `SKILL.md` với mô tả và cách dùng chính.
- Các cấu hình, script hoặc tệp hỗ trợ tùy chọn mà Skills sử dụng.
- Siêu dữ liệu như thẻ, tóm tắt và yêu cầu cài đặt.

ClawHub dùng siêu dữ liệu để hỗ trợ khám phá và hiển thị an toàn
các khả năng của Skills. Sổ đăng ký theo dõi tín hiệu sử dụng (sao, lượt tải xuống) để
cải thiện xếp hạng và khả năng hiển thị. Mỗi lần phát hành tạo một phiên bản semver
mới, và sổ đăng ký giữ lịch sử phiên bản để người dùng có thể kiểm tra
các thay đổi.

## Workspace và tải Skills

CLI `clawhub` riêng cũng cài đặt Skills vào `./skills` trong
thư mục làm việc hiện tại của bạn. Nếu một workspace OpenClaw đã được cấu hình,
`clawhub` sẽ dùng workspace đó làm dự phòng trừ khi bạn ghi đè bằng `--workdir`
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
| Phiên bản hóa            | Semver, nhật ký thay đổi và thẻ (bao gồm `latest`).                 |
| Lượt tải xuống           | Zip theo từng phiên bản.                                            |
| Sao và bình luận         | Phản hồi cộng đồng.                                                 |
| Tóm tắt quét bảo mật     | Trang chi tiết hiển thị trạng thái quét mới nhất trước khi cài đặt hoặc tải xuống. |
| Trang chi tiết bộ quét   | Kết quả VirusTotal, ClawScan và phân tích tĩnh có liên kết sâu.     |
| Bảng điều khiển khôi phục của chủ sở hữu | Nhà phát hành có thể xem nội dung thuộc sở hữu bị giữ do quét từ `/dashboard`. |
| Quét lại theo yêu cầu của chủ sở hữu | Chủ sở hữu có thể yêu cầu quét lại có giới hạn để khôi phục khi dương tính giả. |
| Kiểm duyệt               | Phê duyệt và kiểm tra.                                              |
| API thân thiện với CLI   | Phù hợp cho tự động hóa và scripting.                               |

## Bảo mật và kiểm duyệt

ClawHub mở theo mặc định — bất kỳ ai cũng có thể tải Skills lên, nhưng tài khoản GitHub
phải **ít nhất một tuần tuổi** để phát hành. Điều này làm chậm hành vi
lạm dụng mà không chặn những người đóng góp hợp lệ.

<AccordionGroup>
  <Accordion title="Quét bảo mật">
    ClawHub chạy kiểm tra bảo mật tự động trên Skills và bản phát hành Plugin
    đã phát hành. Trang chi tiết công khai tóm tắt kết quả hiện tại, và các hàng
    bộ quét liên kết tới các trang chi tiết riêng cho VirusTotal, ClawScan và phân tích
    tĩnh.

    Các bản phát hành bị giữ do quét hoặc bị chặn có thể không có trên danh mục công khai và
    bề mặt cài đặt, nhưng vẫn hiển thị với chủ sở hữu của chúng trong `/dashboard`.

  </Accordion>
  <Accordion title="Báo cáo">
    - Bất kỳ người dùng đã đăng nhập nào cũng có thể báo cáo một Skills.
    - Lý do báo cáo là bắt buộc và được ghi lại.
    - Mỗi người dùng có thể có tối đa 20 báo cáo đang hoạt động cùng lúc.
    - Skills có hơn 3 báo cáo duy nhất sẽ tự động bị ẩn theo mặc định.

  </Accordion>
  <Accordion title="Kiểm duyệt">
    - Người kiểm duyệt có thể xem Skills bị ẩn, bỏ ẩn, xóa chúng hoặc cấm người dùng.
    - Lạm dụng tính năng báo cáo có thể dẫn đến việc tài khoản bị cấm.
    - Quan tâm đến việc trở thành người kiểm duyệt? Hãy hỏi trong Discord của OpenClaw và liên hệ một người kiểm duyệt hoặc maintainer.

  </Accordion>
</AccordionGroup>

## CLI ClawHub

Bạn chỉ cần phần này cho các luồng đã xác thực với sổ đăng ký như
phát hành/đồng bộ.

### Tùy chọn toàn cục

<ParamField path="--workdir <dir>" type="string">
  Thư mục làm việc. Mặc định: thư mục hiện tại; dự phòng sang workspace OpenClaw.
</ParamField>
<ParamField path="--dir <dir>" type="string" default="skills">
  Thư mục Skills, tương đối với workdir.
</ParamField>
<ParamField path="--site <url>" type="string">
  URL cơ sở của trang (đăng nhập bằng trình duyệt).
</ParamField>
<ParamField path="--registry <url>" type="string">
  URL cơ sở của API sổ đăng ký.
</ParamField>
<ParamField path="--no-input" type="boolean">
  Tắt lời nhắc (không tương tác).
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

    - `--token <token>` — dán API token.
    - `--label <label>` — nhãn được lưu cho token đăng nhập bằng trình duyệt (mặc định: `CLI token`).
    - `--no-browser` — không mở trình duyệt (yêu cầu `--token`).

  </Accordion>
  <Accordion title="Tìm kiếm">
    ```bash
    clawhub search "query"
    ```

    Tìm kiếm Skills. Để khám phá Plugin/package, dùng `clawhub package explore`.

    - `--limit <n>` — số kết quả tối đa.

  </Accordion>
  <Accordion title="Duyệt / kiểm tra Plugin">
    ```bash
    clawhub package explore --family code-plugin
    clawhub package explore "episodic-claw" --family code-plugin
    clawhub package inspect episodic-claw
    ```

    `package explore` và `package inspect` là các bề mặt CLI ClawHub để khám phá Plugin/package và kiểm tra siêu dữ liệu. Các lượt cài đặt OpenClaw gốc vẫn dùng `openclaw plugins install clawhub:<package>`.

    Tùy chọn:

    - `--family skill|code-plugin|bundle-plugin` — lọc họ package.
    - `--official` — chỉ hiển thị package chính thức.
    - `--executes-code` — chỉ hiển thị package thực thi mã.
    - `--version <version>` / `--tag <tag>` — kiểm tra một phiên bản package cụ thể.
    - `--versions`, `--files`, `--file <path>` — kiểm tra lịch sử và tệp package.
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
    - `--force` — ghi đè nếu thư mục đã tồn tại, hoặc khi tệp cục bộ không khớp với bất kỳ phiên bản đã phát hành nào.
    - `clawhub list` đọc `.clawhub/lock.json`.

  </Accordion>
  <Accordion title="Phát hành Skills">
    ```bash
    clawhub skill publish <path>
    ```

    Tùy chọn:

    - `--slug <slug>` — slug Skills.
    - `--name <name>` — tên hiển thị.
    - `--version <version>` — phiên bản semver.
    - `--changelog <text>` — nội dung nhật ký thay đổi (có thể để trống).
    - `--tags <tags>` — thẻ phân tách bằng dấu phẩy (mặc định: `latest`).

  </Accordion>
  <Accordion title="Phát hành Plugin">
    ```bash
    clawhub package publish <source>
    ```

    `<source>` có thể là thư mục cục bộ, `owner/repo`, `owner/repo@ref`, hoặc một
    URL GitHub.

    Tùy chọn:

    - `--dry-run` — xây dựng kế hoạch phát hành chính xác mà không tải gì lên.
    - `--json` — phát ra đầu ra máy có thể đọc cho CI.
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
    đã phát hành mới nhất hoặc bản phát hành Plugin. Trong các lần chạy không tương tác, truyền
    `--yes`.

    Phản hồi JSON bao gồm loại đích, tên, phiên bản, trạng thái quét lại và
    số lượng yêu cầu còn lại/tối đa cho phiên bản hoặc bản phát hành đó.

  </Accordion>
  <Accordion title="Xóa / khôi phục xóa (chủ sở hữu hoặc quản trị viên)">
    ```bash
    clawhub delete <slug> --yes
    clawhub undelete <slug> --yes
    ```
  </Accordion>
  <Accordion title="Đồng bộ (quét cục bộ + phát hành mới hoặc đã cập nhật)">
    ```bash
    clawhub sync
    ```

    Tùy chọn:

    - `--root <dir...>` — gốc quét bổ sung.
    - `--all` — tải mọi thứ lên mà không hỏi.
    - `--dry-run` — hiển thị những gì sẽ được tải lên.
    - `--bump <type>` — `patch|minor|major` cho các bản cập nhật (mặc định: `patch`).
    - `--changelog <text>` — nhật ký thay đổi cho các bản cập nhật không tương tác.
    - `--tags <tags>` — thẻ phân tách bằng dấu phẩy (mặc định: `latest`).
    - `--concurrency <n>` — kiểm tra sổ đăng ký (mặc định: `4`).

  </Accordion>
</AccordionGroup>

## Luồng công việc phổ biến

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
  <Tab title="Xuất bản một skill">
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

Các Plugin mã phải bao gồm siêu dữ liệu OpenClaw bắt buộc trong
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

Các gói đã xuất bản nên phân phối **JavaScript đã build** và trỏ
`runtimeExtensions` đến đầu ra đó. Các bản cài đặt từ Git checkout vẫn có thể
dự phòng về mã nguồn TypeScript khi không có tệp đã build, nhưng các mục nhập
runtime đã build giúp tránh biên dịch TypeScript lúc runtime trong các đường dẫn
khởi động, doctor và tải Plugin.

## Quản lý phiên bản, lockfile và telemetry

<AccordionGroup>
  <Accordion title="Quản lý phiên bản và thẻ">
    - Mỗi lần xuất bản tạo một **semver** `SkillVersion` mới.
    - Các thẻ (như `latest`) trỏ đến một phiên bản; di chuyển thẻ cho phép bạn quay lui.
    - Changelog được gắn theo từng phiên bản và có thể để trống khi đồng bộ hoặc xuất bản bản cập nhật.

  </Accordion>
  <Accordion title="Thay đổi cục bộ so với phiên bản registry">
    Các bản cập nhật so sánh nội dung skill cục bộ với các phiên bản registry bằng
    hàm băm nội dung. Nếu các tệp cục bộ không khớp với bất kỳ phiên bản đã xuất bản nào,
    CLI sẽ hỏi trước khi ghi đè (hoặc yêu cầu `--force` trong
    các lượt chạy không tương tác).
  </Accordion>
  <Accordion title="Quét đồng bộ và thư mục gốc dự phòng">
    `clawhub sync` quét workdir hiện tại của bạn trước. Nếu không tìm thấy skill nào,
    nó sẽ dự phòng về các vị trí cũ đã biết (ví dụ
    `~/openclaw/skills` và `~/.openclaw/skills`). Cơ chế này được thiết kế để
    tìm các bản cài đặt skill cũ hơn mà không cần cờ bổ sung.
  </Accordion>
  <Accordion title="Lưu trữ và lockfile">
    - Các skill đã cài đặt được ghi lại trong `.clawhub/lock.json` bên dưới workdir của bạn.
    - Token xác thực được lưu trong tệp cấu hình ClawHub CLI (ghi đè bằng `CLAWHUB_CONFIG_PATH`).

  </Accordion>
  <Accordion title="Telemetry (số lượt cài đặt)">
    Khi bạn chạy `clawhub sync` trong lúc đã đăng nhập, CLI gửi một bản chụp tối thiểu
    để tính số lượt cài đặt. Bạn có thể tắt hoàn toàn chức năng này:

    ```bash
    export CLAWHUB_DISABLE_TELEMETRY=1
    ```

  </Accordion>
</AccordionGroup>

## Biến môi trường

| Biến                          | Tác dụng                                        |
| ----------------------------- | ----------------------------------------------- |
| `CLAWHUB_SITE`                | Ghi đè URL của site.                            |
| `CLAWHUB_REGISTRY`            | Ghi đè URL API registry.                        |
| `CLAWHUB_CONFIG_PATH`         | Ghi đè nơi CLI lưu token/cấu hình.              |
| `CLAWHUB_WORKDIR`             | Ghi đè workdir mặc định.                        |
| `CLAWHUB_DISABLE_TELEMETRY=1` | Tắt telemetry khi chạy `sync`.                  |

## Liên quan

- [Plugin cộng đồng](/vi/plugins/community)
- [Plugins](/vi/tools/plugin)
- [Skills](/vi/tools/skills)
