---
read_when:
    - Bạn muốn cài đặt hoặc quản lý các Plugin Gateway hoặc các gói tương thích
    - Bạn muốn gỡ lỗi khi tải Plugin thất bại
sidebarTitle: Plugins
summary: Tham chiếu CLI cho `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, doctor)
title: Plugin
x-i18n:
    generated_at: "2026-05-04T07:03:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 36ae7edb12986ead7e126f25e0761bf312b2644b35017181b674082105886776
    source_path: cli/plugins.md
    workflow: 16
---

Quản lý Plugin Gateway, gói hook và các bundle tương thích.

<CardGroup cols={2}>
  <Card title="Hệ thống Plugin" href="/vi/tools/plugin">
    Hướng dẫn cho người dùng cuối về cài đặt, bật và khắc phục sự cố Plugin.
  </Card>
  <Card title="Quản lý Plugin" href="/vi/plugins/manage-plugins">
    Ví dụ nhanh về cài đặt, liệt kê, cập nhật, gỡ cài đặt và phát hành.
  </Card>
  <Card title="Bundle Plugin" href="/vi/plugins/bundles">
    Mô hình tương thích của bundle.
  </Card>
  <Card title="Manifest Plugin" href="/vi/plugins/manifest">
    Các trường manifest và schema cấu hình.
  </Card>
  <Card title="Bảo mật" href="/vi/gateway/security">
    Gia cố bảo mật cho các lượt cài đặt Plugin.
  </Card>
</CardGroup>

## Lệnh

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
openclaw plugins search <query>
openclaw plugins search <query> --limit 20
openclaw plugins search <query> --json
openclaw plugins install <path-or-spec>
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
openclaw plugins inspect --all
openclaw plugins info <id>
openclaw plugins enable <id>
openclaw plugins disable <id>
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins uninstall <id>
openclaw plugins doctor
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins marketplace list <marketplace>
openclaw plugins marketplace list <marketplace> --json
```

Để điều tra quá trình cài đặt, kiểm tra, gỡ cài đặt hoặc làm mới registry bị chậm, hãy chạy
lệnh với `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`. Trace ghi thời gian từng pha
vào stderr và vẫn giữ cho đầu ra JSON có thể phân tích được. Xem [Gỡ lỗi](/vi/help/debugging#plugin-lifecycle-trace).

<Note>
Các Plugin đi kèm được phát hành cùng OpenClaw. Một số được bật theo mặc định (ví dụ các provider mô hình đi kèm, provider giọng nói đi kèm và Plugin trình duyệt đi kèm); những Plugin khác yêu cầu `plugins enable`.

Plugin OpenClaw native phải phát hành `openclaw.plugin.json` cùng JSON Schema nội tuyến (`configSchema`, kể cả khi rỗng). Các bundle tương thích dùng manifest bundle riêng của chúng.

`plugins list` hiển thị `Format: openclaw` hoặc `Format: bundle`. Đầu ra danh sách/thông tin chi tiết cũng hiển thị subtype của bundle (`codex`, `claude` hoặc `cursor`) cùng các capability bundle được phát hiện.
</Note>

### Cài đặt

```bash
openclaw plugins search "calendar"                   # search ClawHub plugins
openclaw plugins install <package>                      # npm by default
openclaw plugins install clawhub:<package>              # ClawHub only
openclaw plugins install npm:<package>                  # npm only
openclaw plugins install git:github.com/<owner>/<repo>  # git repo
openclaw plugins install git:github.com/<owner>/<repo>@<ref>
openclaw plugins install <package> --force              # overwrite existing install
openclaw plugins install <package> --pin                # pin version
openclaw plugins install <package> --dangerously-force-unsafe-install
openclaw plugins install <path>                         # local path
openclaw plugins install <plugin>@<marketplace>         # marketplace
openclaw plugins install <plugin> --marketplace <name>  # marketplace (explicit)
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
```

<Warning>
Tên package trần cài đặt từ npm theo mặc định trong giai đoạn chuyển đổi ra mắt. Dùng `clawhub:<package>` cho ClawHub. Hãy xem việc cài đặt Plugin như chạy mã. Ưu tiên các phiên bản được pin.
</Warning>

`plugins search` truy vấn ClawHub để tìm các package Plugin có thể cài đặt và in ra
tên package sẵn sàng để cài đặt. Lệnh này tìm kiếm các package code-plugin và bundle-plugin,
không phải Skills. Dùng `openclaw skills search` cho ClawHub Skills.

<Note>
ClawHub là bề mặt phân phối và khám phá chính cho hầu hết Plugin. Npm
vẫn là đường dự phòng được hỗ trợ và là đường cài đặt trực tiếp. Các package Plugin
`@openclaw/*` do OpenClaw sở hữu đã được phát hành lại trên npm; xem danh sách hiện tại
trên [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) hoặc
[kho Plugin](/vi/plugins/plugin-inventory). Các lượt cài đặt ổn định dùng `latest`.
Các lượt cài đặt và cập nhật kênh beta ưu tiên dist-tag `beta` của npm khi tag đó
có sẵn, rồi mới quay về `latest`.
</Note>

<AccordionGroup>
  <Accordion title="Include cấu hình và sửa cấu hình không hợp lệ">
    Nếu phần `plugins` của bạn được hỗ trợ bởi một `$include` dạng một tệp, `plugins install/update/enable/disable/uninstall` sẽ ghi xuyên qua tệp được include đó và giữ nguyên `openclaw.json`. Include gốc, mảng include và include có override cùng cấp sẽ fail closed thay vì làm phẳng. Xem [Include cấu hình](/vi/gateway/configuration) để biết các dạng được hỗ trợ.

    Nếu cấu hình không hợp lệ trong lúc cài đặt, `plugins install` thường fail closed và yêu cầu bạn chạy `openclaw doctor --fix` trước. Trong quá trình khởi động Gateway và hot reload, cấu hình Plugin không hợp lệ fail closed như mọi cấu hình không hợp lệ khác; `openclaw doctor --fix` có thể cách ly mục Plugin không hợp lệ. Ngoại lệ duy nhất được ghi tài liệu tại thời điểm cài đặt là đường phục hồi hẹp cho Plugin đi kèm đối với các Plugin chủ động chọn `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force và cài đặt lại so với cập nhật">
    `--force` tái sử dụng đích cài đặt hiện có và ghi đè một Plugin hoặc gói hook đã được cài đặt ngay tại chỗ. Dùng tùy chọn này khi bạn cố ý cài đặt lại cùng một id từ đường dẫn cục bộ, archive, package ClawHub hoặc artifact npm mới. Với các bản nâng cấp thường lệ của một Plugin npm đã được theo dõi, ưu tiên `openclaw plugins update <id-or-npm-spec>`.

    Nếu bạn chạy `plugins install` cho một id Plugin đã được cài đặt, OpenClaw sẽ dừng lại và chỉ bạn tới `plugins update <id-or-npm-spec>` cho bản nâng cấp thông thường, hoặc tới `plugins install <package> --force` khi bạn thật sự muốn ghi đè cài đặt hiện tại từ một nguồn khác.

  </Accordion>
  <Accordion title="Phạm vi --pin">
    `--pin` chỉ áp dụng cho lượt cài đặt npm. Tùy chọn này không được hỗ trợ với cài đặt `git:`; hãy dùng git ref rõ ràng như `git:github.com/acme/plugin@v1.2.3` khi bạn muốn một nguồn được pin. Tùy chọn này không được hỗ trợ với `--marketplace`, vì cài đặt marketplace lưu metadata nguồn marketplace thay vì spec npm.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` là tùy chọn khẩn cấp cho các false positive trong bộ quét mã nguy hiểm tích hợp. Nó cho phép quá trình cài đặt tiếp tục ngay cả khi bộ quét tích hợp báo cáo phát hiện `critical`, nhưng **không** bỏ qua các chặn chính sách hook `before_install` của Plugin và **không** bỏ qua lỗi quét.

    Cờ CLI này áp dụng cho luồng cài đặt/cập nhật Plugin. Các lượt cài đặt dependency của skill do Gateway hỗ trợ dùng override yêu cầu tương ứng `dangerouslyForceUnsafeInstall`, trong khi `openclaw skills install` vẫn là một luồng tải xuống/cài đặt ClawHub skill riêng.

    Nếu một Plugin bạn phát hành trên ClawHub bị chặn bởi lần quét registry, hãy dùng các bước dành cho nhà phát hành trong [ClawHub](/vi/tools/clawhub).

  </Accordion>
  <Accordion title="Gói hook và spec npm">
    `plugins install` cũng là bề mặt cài đặt cho các gói hook expose `openclaw.hooks` trong `package.json`. Dùng `openclaw hooks` để xem hook có lọc và bật từng hook, không phải để cài đặt package.

    Spec npm là **chỉ registry** (tên package + **phiên bản chính xác** tùy chọn hoặc **dist-tag** tùy chọn). Spec Git/URL/file và khoảng semver bị từ chối. Cài đặt dependency chạy ở phạm vi cục bộ của project với `--ignore-scripts` để an toàn, kể cả khi shell của bạn có thiết lập cài đặt npm toàn cục.

    Dùng `npm:<package>` khi bạn muốn làm rõ việc phân giải npm. Spec package trần cũng cài đặt trực tiếp từ npm trong giai đoạn chuyển đổi ra mắt.

    Spec trần và `@latest` ở lại nhánh ổn định. Các phiên bản sửa lỗi có đóng dấu ngày của OpenClaw như `2026.5.3-1` là bản phát hành ổn định cho kiểm tra này. Nếu npm phân giải một trong hai loại đó thành prerelease, OpenClaw sẽ dừng và yêu cầu bạn chủ động opt in bằng tag prerelease như `@beta`/`@rc` hoặc một phiên bản prerelease chính xác như `@1.2.3-beta.4`.

    Nếu một spec cài đặt trần khớp với id Plugin chính thức (ví dụ `diffs`), OpenClaw sẽ cài trực tiếp mục catalog. Để cài package npm có cùng tên, hãy dùng spec scoped rõ ràng (ví dụ `@scope/diffs`).

  </Accordion>
  <Accordion title="Kho Git">
    Dùng `git:<repo>` để cài đặt trực tiếp từ một kho git. Các dạng được hỗ trợ gồm `git:github.com/owner/repo`, `git:owner/repo`, URL clone đầy đủ `https://`, `ssh://`, `git://`, `file://` và `git@host:owner/repo.git`. Thêm `@<ref>` hoặc `#<ref>` để checkout một branch, tag hoặc commit trước khi cài đặt.

    Cài đặt Git clone vào một thư mục tạm, checkout ref được yêu cầu nếu có, rồi dùng trình cài đặt thư mục Plugin bình thường. Điều đó có nghĩa là xác thực manifest, quét mã nguy hiểm, công việc cài đặt package-manager và bản ghi cài đặt hoạt động như cài đặt npm. Các lượt cài đặt git được ghi lại bao gồm URL/ref nguồn cùng commit đã phân giải để `openclaw plugins update` có thể phân giải lại nguồn sau này.

    Sau khi cài đặt từ git, dùng `openclaw plugins inspect <id> --runtime --json` để xác minh các đăng ký runtime như phương thức gateway và lệnh CLI. Nếu Plugin đã đăng ký CLI root bằng `api.registerCli`, hãy thực thi lệnh đó trực tiếp qua CLI root của OpenClaw, ví dụ `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Archive">
    Archive được hỗ trợ: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Archive Plugin OpenClaw native phải chứa `openclaw.plugin.json` hợp lệ tại root Plugin đã giải nén; archive chỉ chứa `package.json` sẽ bị từ chối trước khi OpenClaw ghi bản ghi cài đặt.

    Cài đặt marketplace Claude cũng được hỗ trợ.

  </Accordion>
</AccordionGroup>

Cài đặt ClawHub dùng locator `clawhub:<package>` rõ ràng:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Spec Plugin an toàn cho npm dạng trần cài đặt từ npm theo mặc định trong giai đoạn chuyển đổi ra mắt:

```bash
openclaw plugins install openclaw-codex-app-server
```

Dùng `npm:` để làm rõ phân giải chỉ npm:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw kiểm tra API Plugin được quảng bá / mức tương thích gateway tối thiểu trước khi cài đặt. Khi phiên bản ClawHub đã chọn phát hành artifact ClawPack, OpenClaw tải xuống `.tgz` npm-pack có phiên bản, xác minh header digest ClawHub và digest artifact, rồi cài đặt qua đường archive bình thường. Các phiên bản ClawHub cũ hơn không có metadata ClawPack vẫn cài đặt qua đường xác minh archive package legacy. Các lượt cài đặt được ghi lại giữ metadata nguồn ClawHub, loại artifact, npm integrity, npm shasum, tên tarball và các thông tin digest ClawPack để cập nhật sau này.
Các lượt cài đặt ClawHub không có phiên bản giữ spec được ghi lại không có phiên bản để `openclaw plugins update` có thể theo các bản phát hành ClawHub mới hơn; các selector phiên bản hoặc tag rõ ràng như `clawhub:pkg@1.2.3` và `clawhub:pkg@beta` vẫn được pin vào selector đó.

#### Viết tắt marketplace

Dùng viết tắt `plugin@marketplace` khi tên marketplace tồn tại trong cache registry cục bộ của Claude tại `~/.claude/plugins/known_marketplaces.json`:

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

Dùng `--marketplace` khi bạn muốn truyền nguồn marketplace rõ ràng:

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

<Tabs>
  <Tab title="Nguồn chợ ứng dụng">
    - tên chợ ứng dụng đã biết của Claude từ `~/.claude/plugins/known_marketplaces.json`
    - gốc chợ ứng dụng cục bộ hoặc đường dẫn `marketplace.json`
    - dạng viết tắt kho GitHub như `owner/repo`
    - URL kho GitHub như `https://github.com/owner/repo`
    - URL git

  </Tab>
  <Tab title="Quy tắc chợ ứng dụng từ xa">
    Đối với các chợ ứng dụng từ xa được tải từ GitHub hoặc git, các mục Plugin phải nằm bên trong kho chợ ứng dụng đã được sao chép. OpenClaw chấp nhận các nguồn đường dẫn tương đối từ kho đó và từ chối HTTP(S), đường dẫn tuyệt đối, git, GitHub, và các nguồn Plugin không phải đường dẫn khác từ manifest từ xa.
  </Tab>
</Tabs>

Đối với đường dẫn cục bộ và tệp lưu trữ, OpenClaw tự động phát hiện:

- Plugin OpenClaw gốc (`openclaw.plugin.json`)
- gói tương thích với Codex (`.codex-plugin/plugin.json`)
- gói tương thích với Claude (`.claude-plugin/plugin.json` hoặc bố cục thành phần Claude mặc định)
- gói tương thích với Cursor (`.cursor-plugin/plugin.json`)

<Note>
Các gói tương thích được cài vào gốc Plugin thông thường và tham gia cùng luồng liệt kê/thông tin/bật/tắt. Hiện tại, Skills trong gói, command-skills của Claude, giá trị mặc định `settings.json` của Claude, giá trị mặc định `.lsp.json` / `lspServers` khai báo trong manifest của Claude, command-skills của Cursor, và các thư mục hook Codex tương thích được hỗ trợ; các khả năng gói khác được phát hiện sẽ hiển thị trong chẩn đoán/thông tin nhưng chưa được nối vào thực thi thời gian chạy.
</Note>

### Liệt kê

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
openclaw plugins search <query>
openclaw plugins search <query> --limit 20
openclaw plugins search <query> --json
```

<ParamField path="--enabled" type="boolean">
  Chỉ hiển thị các Plugin đã bật.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Chuyển từ chế độ xem bảng sang các dòng chi tiết theo từng Plugin với siêu dữ liệu nguồn/xuất xứ/phiên bản/kích hoạt.
</ParamField>
<ParamField path="--json" type="boolean">
  Kiểm kê đọc được bằng máy cùng với chẩn đoán registry và trạng thái cài đặt phụ thuộc gói.
</ParamField>

<Note>
`plugins list` đọc registry Plugin cục bộ đã lưu trước, với phương án dự phòng dẫn xuất chỉ từ manifest khi registry bị thiếu hoặc không hợp lệ. Lệnh này hữu ích để kiểm tra liệu một Plugin đã được cài đặt, đã bật, và hiển thị với kế hoạch khởi động lạnh hay chưa, nhưng không phải là phép dò thời gian chạy trực tiếp của một tiến trình Gateway đang chạy. Sau khi thay đổi mã Plugin, trạng thái bật, chính sách hook, hoặc `plugins.load.paths`, hãy khởi động lại Gateway phục vụ kênh trước khi kỳ vọng mã `register(api)` mới hoặc hook chạy. Với triển khai từ xa/container, hãy xác minh rằng bạn đang khởi động lại đúng tiến trình con `openclaw gateway run`, không chỉ một tiến trình bao bọc.

`plugins list --json` bao gồm `dependencyStatus` của từng Plugin từ `package.json`
`dependencies` và `optionalDependencies`. OpenClaw kiểm tra liệu các tên gói đó
có hiện diện dọc theo đường dẫn tra cứu `node_modules` Node thông thường của Plugin hay không; OpenClaw
không nhập mã thời gian chạy của Plugin, không chạy trình quản lý gói, và không sửa chữa
các phụ thuộc bị thiếu.
</Note>

`plugins search` là phép tra cứu danh mục ClawHub từ xa. Lệnh này không kiểm tra trạng thái
cục bộ, không thay đổi cấu hình, không cài gói, và không tải mã thời gian chạy của Plugin. Kết quả
tìm kiếm bao gồm tên gói ClawHub, họ, kênh, phiên bản, tóm tắt, và
gợi ý cài đặt như `openclaw plugins install clawhub:<package>`.

Đối với công việc trên Plugin đi kèm bên trong ảnh Docker đã đóng gói, hãy bind-mount thư mục
nguồn Plugin đè lên đường dẫn nguồn đã đóng gói tương ứng, chẳng hạn
`/app/extensions/synology-chat`. OpenClaw sẽ phát hiện lớp phủ nguồn đã mount đó
trước `/app/dist/extensions/synology-chat`; một thư mục nguồn được sao chép đơn thuần
vẫn bất hoạt, nên các bản cài đặt đã đóng gói thông thường vẫn dùng dist đã biên dịch.

Để gỡ lỗi hook thời gian chạy:

- `openclaw plugins inspect <id> --runtime --json` hiển thị các hook đã đăng ký và chẩn đoán từ một lượt kiểm tra đã tải module. Kiểm tra thời gian chạy không bao giờ cài phụ thuộc; dùng `openclaw doctor --fix` để dọn trạng thái phụ thuộc cũ hoặc cài các Plugin tải xuống đã cấu hình nhưng còn thiếu.
- `openclaw gateway status --deep --require-rpc` xác nhận Gateway có thể truy cập, gợi ý dịch vụ/tiến trình, đường dẫn cấu hình, và tình trạng RPC.
- Các hook hội thoại không đi kèm (`llm_input`, `llm_output`, `before_agent_finalize`, `agent_end`) yêu cầu `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Dùng `--link` để tránh sao chép một thư mục cục bộ (thêm vào `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` không được hỗ trợ cùng với `--link` vì bản cài liên kết dùng lại đường dẫn nguồn thay vì sao chép đè lên một đích cài đặt được quản lý.

Dùng `--pin` trên bản cài npm để lưu đặc tả chính xác đã phân giải (`name@version`) trong chỉ mục Plugin được quản lý, đồng thời giữ hành vi mặc định không ghim.
</Note>

### Chỉ mục Plugin

Siêu dữ liệu cài đặt Plugin là trạng thái do máy quản lý, không phải cấu hình người dùng. Các lượt cài đặt và cập nhật ghi dữ liệu này vào `plugins/installs.json` trong thư mục trạng thái OpenClaw đang hoạt động. Bản đồ `installRecords` cấp cao nhất của tệp này là nguồn bền vững cho siêu dữ liệu cài đặt, bao gồm cả bản ghi cho các manifest Plugin bị hỏng hoặc bị thiếu. Mảng `plugins` là bộ nhớ đệm registry lạnh dẫn xuất từ manifest. Tệp này bao gồm cảnh báo không chỉnh sửa và được dùng bởi `openclaw plugins update`, gỡ cài đặt, chẩn đoán, và registry Plugin lạnh.

Khi OpenClaw thấy các bản ghi `plugins.installs` cũ được phân phối trong cấu hình, OpenClaw chuyển chúng vào chỉ mục Plugin và xóa khóa cấu hình; nếu một trong hai thao tác ghi thất bại, các bản ghi cấu hình được giữ lại để siêu dữ liệu cài đặt không bị mất.

### Gỡ cài đặt

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` xóa các bản ghi Plugin khỏi `plugins.entries`, chỉ mục Plugin đã lưu, các mục danh sách cho phép/từ chối Plugin, và các mục `plugins.load.paths` đã liên kết khi áp dụng. Trừ khi đặt `--keep-files`, gỡ cài đặt cũng xóa thư mục cài đặt được quản lý đã theo dõi khi thư mục đó nằm bên trong gốc tiện ích mở rộng Plugin của OpenClaw. Với các Plugin Active Memory, slot bộ nhớ đặt lại về `memory-core`.

<Note>
`--keep-config` được hỗ trợ như bí danh đã lỗi thời cho `--keep-files`.
</Note>

### Cập nhật

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

Các bản cập nhật áp dụng cho những bản cài Plugin đã theo dõi trong chỉ mục Plugin được quản lý và những bản cài hook-pack đã theo dõi trong `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="Phân giải id Plugin so với đặc tả npm">
    Khi bạn truyền một id Plugin, OpenClaw dùng lại đặc tả cài đặt đã ghi cho Plugin đó. Điều này nghĩa là các dist-tag đã lưu trước đó như `@beta` và các phiên bản ghim chính xác tiếp tục được dùng trong những lần chạy `update <id>` về sau.

    Đối với bản cài npm, bạn cũng có thể truyền một đặc tả gói npm rõ ràng với dist-tag hoặc phiên bản chính xác. OpenClaw phân giải tên gói đó ngược về bản ghi Plugin đã theo dõi, cập nhật Plugin đã cài đó, và ghi lại đặc tả npm mới cho các bản cập nhật dựa trên id trong tương lai.

    Truyền tên gói npm mà không có phiên bản hoặc thẻ cũng phân giải ngược về bản ghi Plugin đã theo dõi. Dùng cách này khi một Plugin đã được ghim vào một phiên bản chính xác và bạn muốn chuyển nó trở lại dòng phát hành mặc định của registry.

  </Accordion>
  <Accordion title="Cập nhật kênh beta">
    `openclaw plugins update` dùng lại đặc tả Plugin đã theo dõi trừ khi bạn truyền một đặc tả mới. `openclaw update` còn biết kênh cập nhật OpenClaw đang hoạt động: trên kênh beta, các bản ghi Plugin npm dòng mặc định và ClawHub thử `@beta` trước, rồi quay lại đặc tả mặc định/mới nhất đã ghi nếu không có bản phát hành beta của Plugin. Các phiên bản chính xác và thẻ rõ ràng vẫn được ghim vào bộ chọn đó.

  </Accordion>
  <Accordion title="Kiểm tra phiên bản và lệch toàn vẹn">
    Trước một bản cập nhật npm trực tiếp, OpenClaw kiểm tra phiên bản gói đã cài so với siêu dữ liệu registry npm. Nếu phiên bản đã cài và danh tính artifact đã ghi đã khớp với đích đã phân giải, bản cập nhật được bỏ qua mà không tải xuống, cài đặt lại, hoặc ghi lại `openclaw.json`.

    Khi có hash toàn vẹn đã lưu và hash artifact đã lấy thay đổi, OpenClaw xem đó là lệch artifact npm. Lệnh tương tác `openclaw plugins update` in ra hash kỳ vọng và hash thực tế rồi yêu cầu xác nhận trước khi tiếp tục. Các trình trợ giúp cập nhật không tương tác sẽ thất bại đóng trừ khi bên gọi cung cấp một chính sách tiếp tục rõ ràng.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install khi cập nhật">
    `--dangerously-force-unsafe-install` cũng có sẵn trên `plugins update` dưới dạng ghi đè phá kính cho các dương tính giả từ quét mã nguy hiểm tích hợp sẵn trong quá trình cập nhật Plugin. Nó vẫn không bỏ qua các chặn chính sách `before_install` của Plugin hoặc chặn do lỗi quét, và chỉ áp dụng cho cập nhật Plugin, không áp dụng cho cập nhật hook-pack.
  </Accordion>
</AccordionGroup>

### Kiểm tra

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Kiểm tra hiển thị danh tính, trạng thái tải, nguồn, khả năng trong manifest, cờ chính sách, chẩn đoán, siêu dữ liệu cài đặt, khả năng gói, và mọi hỗ trợ máy chủ MCP hoặc LSP được phát hiện mà mặc định không nhập thời gian chạy Plugin. Thêm `--runtime` để tải module Plugin và bao gồm các hook, công cụ, lệnh, dịch vụ, phương thức Gateway, và tuyến HTTP đã đăng ký. Kiểm tra thời gian chạy báo cáo trực tiếp các phụ thuộc Plugin bị thiếu; cài đặt và sửa chữa vẫn nằm trong `openclaw plugins install`, `openclaw plugins update`, và `openclaw doctor --fix`.

Các lệnh CLI do Plugin sở hữu được cài dưới dạng các nhóm lệnh gốc `openclaw`. Sau khi `inspect --runtime` hiển thị một lệnh trong `cliCommands`, hãy chạy lệnh đó dưới dạng `openclaw <command> ...`; ví dụ, một Plugin đăng ký `demo-git` có thể được xác minh bằng `openclaw demo-git ping`.

Mỗi Plugin được phân loại theo những gì nó thực sự đăng ký tại thời gian chạy:

- **plain-capability** — một loại khả năng (ví dụ: Plugin chỉ dành cho provider)
- **hybrid-capability** — nhiều loại khả năng (ví dụ: văn bản + giọng nói + hình ảnh)
- **hook-only** — chỉ hook, không có khả năng hoặc bề mặt
- **non-capability** — công cụ/lệnh/dịch vụ nhưng không có khả năng

Xem [Hình dạng Plugin](/vi/plugins/architecture#plugin-shapes) để biết thêm về mô hình khả năng.

<Note>
Cờ `--json` xuất báo cáo đọc được bằng máy phù hợp cho scripting và kiểm toán. `inspect --all` kết xuất một bảng toàn đội với hình dạng, loại khả năng, thông báo tương thích, khả năng gói, và các cột tóm tắt hook. `info` là bí danh của `inspect`.
</Note>

### Chẩn đoán

```bash
openclaw plugins doctor
```

`doctor` báo cáo lỗi tải Plugin, chẩn đoán manifest/phát hiện, và thông báo tương thích. Khi mọi thứ sạch, lệnh in `No plugin issues detected.`

Nếu một Plugin đã cấu hình hiện diện trên đĩa nhưng bị chặn bởi các kiểm tra an toàn đường dẫn của loader, xác thực cấu hình giữ lại mục Plugin và báo cáo là `present but blocked`. Hãy sửa chẩn đoán Plugin bị chặn đứng trước đó, chẳng hạn quyền sở hữu đường dẫn hoặc quyền world-writable, thay vì xóa cấu hình `plugins.entries.<id>` hoặc `plugins.allow`.

Đối với lỗi dạng module như thiếu export `register`/`activate`, hãy chạy lại với `OPENCLAW_PLUGIN_LOAD_DEBUG=1` để bao gồm tóm tắt dạng export gọn trong đầu ra chẩn đoán.

### Registry

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Registry Plugin cục bộ là mô hình đọc lạnh đã lưu của OpenClaw cho danh tính Plugin đã cài, trạng thái bật, siêu dữ liệu nguồn, và quyền sở hữu đóng góp. Khởi động thông thường, tra cứu chủ sở hữu provider, phân loại thiết lập kênh, và kiểm kê Plugin có thể đọc registry này mà không cần nhập các module thời gian chạy Plugin.

Dùng `plugins registry` để kiểm tra registry được lưu bền vững có tồn tại, hiện hành hay đã cũ hay không. Dùng `--refresh` để dựng lại nó từ chỉ mục Plugin được lưu bền vững, chính sách cấu hình và siêu dữ liệu manifest/package. Đây là đường dẫn sửa chữa, không phải đường dẫn kích hoạt lúc chạy.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` là công tắc tương thích phá kính đã lỗi thời dành cho các lỗi đọc registry. Ưu tiên `plugins registry --refresh` hoặc `openclaw doctor --fix`; cơ chế dự phòng bằng biến môi trường chỉ dành cho khôi phục khởi động khẩn cấp trong khi quá trình di chuyển đang được triển khai.
</Warning>

### Chợ ứng dụng

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Danh sách chợ ứng dụng chấp nhận đường dẫn chợ ứng dụng cục bộ, đường dẫn `marketplace.json`, cách viết tắt GitHub như `owner/repo`, URL repo GitHub hoặc URL git. `--json` in nhãn nguồn đã phân giải cùng với manifest chợ ứng dụng đã phân tích và các mục Plugin.

## Liên quan

- [Xây dựng Plugin](/vi/plugins/building-plugins)
- [Tham chiếu CLI](/vi/cli)
- [Plugin cộng đồng](/vi/plugins/community)
