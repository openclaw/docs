---
read_when:
    - Bạn muốn cài đặt hoặc quản lý các Plugin Gateway hoặc các gói tương thích
    - Bạn muốn gỡ lỗi các sự cố tải Plugin
sidebarTitle: Plugins
summary: Tham chiếu CLI cho `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, doctor)
title: Plugin
x-i18n:
    generated_at: "2026-05-11T20:26:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7ad7d6341d6c2325bfef966b00ca1956f8b337fd0ffe40dba3384ed7eefd1285
    source_path: cli/plugins.md
    workflow: 16
---

Quản lý Plugin Gateway, gói hook và các bundle tương thích.

<CardGroup cols={2}>
  <Card title="Hệ thống Plugin" href="/vi/tools/plugin">
    Hướng dẫn dành cho người dùng cuối để cài đặt, bật và khắc phục sự cố plugin.
  </Card>
  <Card title="Quản lý plugin" href="/vi/plugins/manage-plugins">
    Ví dụ nhanh cho cài đặt, liệt kê, cập nhật, gỡ cài đặt và phát hành.
  </Card>
  <Card title="Bundle Plugin" href="/vi/plugins/bundles">
    Mô hình tương thích của bundle.
  </Card>
  <Card title="Bản kê khai Plugin" href="/vi/plugins/manifest">
    Các trường bản kê khai và schema cấu hình.
  </Card>
  <Card title="Bảo mật" href="/vi/gateway/security">
    Tăng cường bảo mật cho các bản cài đặt plugin.
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

Để điều tra các thao tác cài đặt, kiểm tra, gỡ cài đặt hoặc làm mới registry bị chậm, hãy chạy
lệnh với `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`. Trace ghi thời gian từng pha
vào stderr và giữ cho đầu ra JSON có thể phân tích được. Xem [Gỡ lỗi](/vi/help/debugging#plugin-lifecycle-trace).

<Note>
Trong chế độ Nix (`OPENCLAW_NIX_MODE=1`), các thao tác thay đổi vòng đời plugin bị tắt. Hãy dùng nguồn Nix cho bản cài đặt này thay vì `plugins install`, `plugins update`, `plugins uninstall`, `plugins enable` hoặc `plugins disable`; với nix-openclaw, hãy dùng [Khởi động nhanh](https://github.com/openclaw/nix-openclaw#quick-start) theo hướng agent trước.
</Note>

<Note>
Các plugin được đóng gói sẵn đi kèm OpenClaw. Một số được bật theo mặc định (ví dụ nhà cung cấp mô hình đóng gói sẵn, nhà cung cấp giọng nói đóng gói sẵn và plugin trình duyệt đóng gói sẵn); các plugin khác cần `plugins enable`.

Plugin OpenClaw gốc phải cung cấp `openclaw.plugin.json` với JSON Schema nội tuyến (`configSchema`, kể cả khi rỗng). Các bundle tương thích dùng bản kê khai bundle riêng của chúng.

`plugins list` hiển thị `Format: openclaw` hoặc `Format: bundle`. Đầu ra list/info chi tiết cũng hiển thị subtype của bundle (`codex`, `claude` hoặc `cursor`) cùng các capability bundle đã phát hiện.
</Note>

### Cài đặt

```bash
openclaw plugins search "calendar"                   # search ClawHub plugins
openclaw plugins install <package>                      # npm by default
openclaw plugins install clawhub:<package>              # ClawHub only
openclaw plugins install npm:<package>                  # npm only
openclaw plugins install npm-pack:<path.tgz>            # local npm pack through npm install semantics
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

Maintainer đang kiểm thử các bản cài đặt tại thời điểm thiết lập có thể ghi đè nguồn cài đặt plugin tự động
bằng các biến môi trường được bảo vệ. Xem
[Ghi đè cài đặt Plugin](/vi/plugins/install-overrides).

<Warning>
Tên package trần cài đặt từ npm theo mặc định trong giai đoạn chuyển đổi khi ra mắt. Dùng `clawhub:<package>` cho ClawHub. Hãy xem việc cài đặt plugin giống như chạy mã. Ưu tiên các phiên bản đã ghim.
</Warning>

`plugins search` truy vấn ClawHub để tìm các package plugin có thể cài đặt và in ra
tên package sẵn sàng để cài đặt. Lệnh này tìm kiếm các package code-plugin và bundle-plugin,
không phải skills. Dùng `openclaw skills search` cho Skills trên ClawHub.

<Note>
ClawHub là bề mặt phân phối và khám phá chính cho hầu hết plugin. Npm
vẫn là đường dự phòng được hỗ trợ và là đường cài đặt trực tiếp. Các package plugin
`@openclaw/*` do OpenClaw sở hữu đã được phát hành lại trên npm; xem danh sách hiện tại
trên [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) hoặc
[kiểm kê plugin](/vi/plugins/plugin-inventory). Bản cài đặt ổn định dùng `latest`.
Bản cài đặt và cập nhật kênh beta ưu tiên dist-tag `beta` của npm khi tag đó
có sẵn, sau đó quay về `latest`.
</Note>

<AccordionGroup>
  <Accordion title="Include cấu hình và sửa cấu hình không hợp lệ">
    Nếu phần `plugins` của bạn được hỗ trợ bởi một `$include` dạng một tệp, `plugins install/update/enable/disable/uninstall` sẽ ghi xuyên qua tệp được include đó và để nguyên `openclaw.json`. Include gốc, mảng include và include có ghi đè cùng cấp sẽ đóng lại khi lỗi thay vì làm phẳng. Xem [Include cấu hình](/vi/gateway/configuration) để biết các dạng được hỗ trợ.

    Nếu cấu hình không hợp lệ trong lúc cài đặt, `plugins install` thường sẽ đóng lại khi lỗi và yêu cầu bạn chạy `openclaw doctor --fix` trước. Trong quá trình khởi động Gateway và hot reload, cấu hình plugin không hợp lệ đóng lại khi lỗi giống như mọi cấu hình không hợp lệ khác; `openclaw doctor --fix` có thể cách ly mục plugin không hợp lệ. Ngoại lệ duy nhất được ghi tài liệu ở thời điểm cài đặt là một đường khôi phục hẹp cho plugin đóng gói sẵn, dành cho các plugin chủ động chọn tham gia `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force và cài đặt lại so với cập nhật">
    `--force` tái sử dụng đích cài đặt hiện có và ghi đè tại chỗ một plugin hoặc gói hook đã cài đặt. Dùng tùy chọn này khi bạn cố ý cài đặt lại cùng một id từ một đường dẫn cục bộ, archive, package ClawHub hoặc artifact npm mới. Với các lần nâng cấp thường lệ của một plugin npm đã được theo dõi, hãy ưu tiên `openclaw plugins update <id-or-npm-spec>`.

    Nếu bạn chạy `plugins install` cho một id plugin đã được cài đặt, OpenClaw sẽ dừng và chỉ bạn đến `plugins update <id-or-npm-spec>` để nâng cấp bình thường, hoặc đến `plugins install <package> --force` khi bạn thực sự muốn ghi đè bản cài đặt hiện tại từ một nguồn khác.

  </Accordion>
  <Accordion title="Phạm vi --pin">
    `--pin` chỉ áp dụng cho bản cài đặt npm. Tùy chọn này không được hỗ trợ với bản cài đặt `git:`; hãy dùng một git ref rõ ràng như `git:github.com/acme/plugin@v1.2.3` khi bạn muốn một nguồn đã ghim. Tùy chọn này không được hỗ trợ với `--marketplace`, vì bản cài đặt marketplace lưu metadata nguồn marketplace thay vì npm spec.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` là tùy chọn phá kính trong trường hợp dương tính giả từ bộ quét mã nguy hiểm tích hợp. Tùy chọn này cho phép tiếp tục cài đặt ngay cả khi bộ quét tích hợp báo phát hiện `critical`, nhưng **không** bỏ qua các chặn chính sách hook `before_install` của plugin và **không** bỏ qua lỗi quét.

    Cờ CLI này áp dụng cho luồng cài đặt/cập nhật plugin. Các bản cài đặt phụ thuộc skill dựa trên Gateway dùng ghi đè yêu cầu tương ứng `dangerouslyForceUnsafeInstall`, trong khi `openclaw skills install` vẫn là một luồng tải xuống/cài đặt Skills ClawHub riêng biệt.

    Nếu một plugin bạn phát hành trên ClawHub bị chặn bởi lần quét registry, hãy dùng các bước dành cho nhà phát hành trong [ClawHub](/vi/clawhub/security).

  </Accordion>
  <Accordion title="Gói hook và npm specs">
    `plugins install` cũng là bề mặt cài đặt cho các gói hook phơi bày `openclaw.hooks` trong `package.json`. Dùng `openclaw hooks` để xem hook đã lọc và bật từng hook, không phải để cài đặt package.

    Npm specs là **chỉ registry** (tên package + **phiên bản chính xác** hoặc **dist-tag** tùy chọn). Git/URL/file specs và khoảng semver bị từ chối. Các bản cài đặt phụ thuộc chạy cục bộ theo dự án với `--ignore-scripts` để an toàn, ngay cả khi shell của bạn có thiết lập cài đặt npm toàn cục. Các npm root plugin được quản lý thừa hưởng `overrides` npm ở cấp package của OpenClaw, vì vậy các pin bảo mật của host cũng áp dụng cho phụ thuộc plugin được hoist.

    Dùng `npm:<package>` khi bạn muốn làm rõ rằng quá trình phân giải dùng npm. Bare package specs cũng cài đặt trực tiếp từ npm trong giai đoạn chuyển đổi khi ra mắt.

    Bare specs và `@latest` ở lại track ổn định. Các phiên bản sửa lỗi có dấu ngày của OpenClaw như `2026.5.3-1` là bản phát hành ổn định cho kiểm tra này. Nếu npm phân giải một trong hai loại đó thành prerelease, OpenClaw sẽ dừng và yêu cầu bạn chọn tham gia rõ ràng bằng một tag prerelease như `@beta`/`@rc` hoặc một phiên bản prerelease chính xác như `@1.2.3-beta.4`.

    Nếu một bare install spec khớp với id plugin chính thức (ví dụ `diffs`), OpenClaw sẽ cài đặt trực tiếp mục catalog. Để cài đặt một package npm có cùng tên, hãy dùng spec có scope rõ ràng (ví dụ `@scope/diffs`).

  </Accordion>
  <Accordion title="Kho Git">
    Dùng `git:<repo>` để cài đặt trực tiếp từ một kho git. Các dạng được hỗ trợ gồm `git:github.com/owner/repo`, `git:owner/repo`, URL clone đầy đủ `https://`, `ssh://`, `git://`, `file://` và `git@host:owner/repo.git`. Thêm `@<ref>` hoặc `#<ref>` để checkout một branch, tag hoặc commit trước khi cài đặt.

    Bản cài đặt Git clone vào một thư mục tạm, checkout ref được yêu cầu khi có, rồi dùng trình cài đặt thư mục plugin bình thường. Điều đó có nghĩa là xác thực bản kê khai, quét mã nguy hiểm, công việc cài đặt bằng package-manager và bản ghi cài đặt hoạt động như bản cài đặt npm. Bản cài đặt git được ghi lại bao gồm URL/ref nguồn cùng commit đã phân giải để `openclaw plugins update` có thể phân giải lại nguồn về sau.

    Sau khi cài đặt từ git, dùng `openclaw plugins inspect <id> --runtime --json` để xác minh các đăng ký runtime như phương thức gateway và lệnh CLI. Nếu plugin đã đăng ký một CLI root bằng `api.registerCli`, hãy thực thi lệnh đó trực tiếp thông qua CLI root của OpenClaw, ví dụ `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Archive">
    Archive được hỗ trợ: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Archive plugin OpenClaw gốc phải chứa `openclaw.plugin.json` hợp lệ ở root plugin sau khi giải nén; archive chỉ chứa `package.json` bị từ chối trước khi OpenClaw ghi bản ghi cài đặt.

    Dùng `npm-pack:<path.tgz>` khi tệp là tarball npm-pack và bạn muốn
    kiểm thử cùng đường cài đặt npm-root được quản lý mà bản cài đặt registry sử dụng,
    bao gồm xác minh `package-lock.json`, quét phụ thuộc được hoist và
    bản ghi cài đặt npm. Đường dẫn archive thường vẫn được cài đặt dưới dạng archive cục bộ
    dưới root tiện ích mở rộng plugin.

    Bản cài đặt marketplace Claude cũng được hỗ trợ.

  </Accordion>
</AccordionGroup>

Bản cài đặt ClawHub dùng locator rõ ràng `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Bare npm-safe plugin specs cài đặt từ npm theo mặc định trong giai đoạn chuyển đổi khi ra mắt:

```bash
openclaw plugins install openclaw-codex-app-server
```

Dùng `npm:` để làm rõ phân giải chỉ npm:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw kiểm tra API Plugin được quảng bá / khả năng tương thích Gateway tối thiểu trước khi cài đặt. Khi phiên bản ClawHub đã chọn phát hành artifact ClawPack, OpenClaw tải xuống npm-pack `.tgz` đã đánh phiên bản, xác minh tiêu đề digest ClawHub và digest artifact, rồi cài đặt thông qua đường dẫn lưu trữ thông thường. Các phiên bản ClawHub cũ hơn không có metadata ClawPack vẫn cài đặt thông qua đường dẫn xác minh kho lưu trữ gói kế thừa. Các bản cài đặt đã ghi nhận giữ lại metadata nguồn ClawHub, loại artifact, tính toàn vẹn npm, npm shasum, tên tarball và các dữ kiện digest ClawPack để dùng cho những lần cập nhật sau.
Các bản cài đặt ClawHub không có phiên bản giữ một spec đã ghi nhận không có phiên bản để `openclaw plugins update` có thể đi theo các bản phát hành ClawHub mới hơn; các bộ chọn phiên bản hoặc thẻ rõ ràng như `clawhub:pkg@1.2.3` và `clawhub:pkg@beta` vẫn được ghim vào bộ chọn đó.

#### Cách viết tắt Marketplace

Dùng cách viết tắt `plugin@marketplace` khi tên marketplace tồn tại trong bộ nhớ đệm registry cục bộ của Claude tại `~/.claude/plugins/known_marketplaces.json`:

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

Dùng `--marketplace` khi bạn muốn truyền nguồn marketplace một cách rõ ràng:

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

<Tabs>
  <Tab title="Nguồn marketplace">
    - tên known-marketplace của Claude từ `~/.claude/plugins/known_marketplaces.json`
    - root marketplace cục bộ hoặc đường dẫn `marketplace.json`
    - cách viết tắt repo GitHub như `owner/repo`
    - URL repo GitHub như `https://github.com/owner/repo`
    - URL git

  </Tab>
  <Tab title="Quy tắc marketplace từ xa">
    Đối với marketplace từ xa được tải từ GitHub hoặc git, các mục Plugin phải nằm bên trong repo marketplace đã clone. OpenClaw chấp nhận nguồn đường dẫn tương đối từ repo đó và từ chối HTTP(S), đường dẫn tuyệt đối, git, GitHub và các nguồn Plugin không phải đường dẫn khác từ manifest từ xa.
  </Tab>
</Tabs>

Đối với đường dẫn cục bộ và archive, OpenClaw tự động phát hiện:

- Plugin OpenClaw gốc (`openclaw.plugin.json`)
- bundle tương thích Codex (`.codex-plugin/plugin.json`)
- bundle tương thích Claude (`.claude-plugin/plugin.json` hoặc bố cục component Claude mặc định)
- bundle tương thích Cursor (`.cursor-plugin/plugin.json`)

<Note>
Các bundle tương thích cài đặt vào root Plugin thông thường và tham gia cùng luồng list/info/enable/disable. Hiện tại, bundle skills, command-skills của Claude, mặc định `settings.json` của Claude, mặc định `.lsp.json` / `lspServers` do manifest khai báo của Claude, command-skills của Cursor, và thư mục hook Codex tương thích đã được hỗ trợ; các năng lực bundle khác được phát hiện sẽ hiển thị trong diagnostics/info nhưng chưa được nối vào quá trình thực thi runtime.
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
  Chuyển từ chế độ xem bảng sang các dòng chi tiết theo từng Plugin với metadata nguồn/xuất xứ/phiên bản/kích hoạt.
</ParamField>
<ParamField path="--json" type="boolean">
  Inventory có thể đọc bằng máy kèm diagnostics registry và trạng thái cài đặt phụ thuộc gói.
</ParamField>

<Note>
`plugins list` đọc registry Plugin cục bộ đã lưu trước, với fallback suy ra chỉ từ manifest khi registry bị thiếu hoặc không hợp lệ. Lệnh này hữu ích để kiểm tra một Plugin đã được cài đặt, bật và hiển thị cho việc lập kế hoạch khởi động lạnh hay chưa, nhưng không phải là phép thăm dò runtime trực tiếp của một tiến trình Gateway đang chạy. Sau khi thay đổi mã Plugin, trạng thái bật, chính sách hook hoặc `plugins.load.paths`, hãy khởi động lại Gateway phục vụ kênh trước khi kỳ vọng mã `register(api)` hoặc hook mới chạy. Với triển khai từ xa/container, hãy xác minh bạn đang khởi động lại đúng tiến trình con `openclaw gateway run`, không chỉ một tiến trình wrapper.

`plugins list --json` bao gồm `dependencyStatus` của từng Plugin từ `package.json`
`dependencies` và `optionalDependencies`. OpenClaw kiểm tra xem các tên gói đó
có hiện diện dọc theo đường dẫn tra cứu `node_modules` Node thông thường của Plugin hay không; nó
không import mã runtime Plugin, chạy trình quản lý gói hoặc sửa chữa các
phụ thuộc bị thiếu.
</Note>

`plugins search` là tra cứu catalog ClawHub từ xa. Nó không kiểm tra trạng thái
cục bộ, thay đổi config, cài đặt gói hoặc tải mã runtime Plugin. Kết quả tìm kiếm
bao gồm tên gói ClawHub, family, channel, phiên bản, tóm tắt và
gợi ý cài đặt như `openclaw plugins install clawhub:<package>`.

Đối với công việc trên Plugin đóng gói sẵn bên trong image Docker đã đóng gói, hãy bind-mount thư mục
nguồn Plugin đè lên đường dẫn nguồn đã đóng gói tương ứng, chẳng hạn như
`/app/extensions/synology-chat`. OpenClaw sẽ phát hiện overlay nguồn đã mount đó
trước `/app/dist/extensions/synology-chat`; một thư mục nguồn được copy đơn thuần
vẫn bất hoạt để các bản cài đặt đã đóng gói thông thường vẫn dùng dist đã biên dịch.

Để gỡ lỗi hook runtime:

- `openclaw plugins inspect <id> --runtime --json` hiển thị các hook đã đăng ký và diagnostics từ một lượt kiểm tra có tải module. Kiểm tra runtime không bao giờ cài đặt phụ thuộc; dùng `openclaw doctor --fix` để dọn trạng thái phụ thuộc kế thừa hoặc khôi phục các Plugin có thể tải xuống bị thiếu nhưng được config tham chiếu.
- `openclaw gateway status --deep --require-rpc` xác nhận Gateway có thể truy cập, gợi ý service/process, đường dẫn config và sức khỏe RPC.
- Các hook hội thoại không đóng gói sẵn (`llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize`, `agent_end`) yêu cầu `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Dùng `--link` để tránh sao chép một thư mục cục bộ (thêm vào `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` không được hỗ trợ cùng `--link` vì bản cài đặt dạng liên kết tái sử dụng đường dẫn nguồn thay vì sao chép đè lên mục tiêu cài đặt được quản lý.

Dùng `--pin` trên các bản cài đặt npm để lưu spec chính xác đã resolve (`name@version`) trong chỉ mục Plugin được quản lý trong khi vẫn giữ hành vi mặc định là không ghim.
</Note>

### Chỉ mục Plugin

Metadata cài đặt Plugin là trạng thái do máy quản lý, không phải config người dùng. Các lần cài đặt và cập nhật ghi nó vào `plugins/installs.json` trong thư mục trạng thái OpenClaw đang hoạt động. Map cấp cao nhất `installRecords` của nó là nguồn bền vững cho metadata cài đặt, bao gồm cả bản ghi cho các manifest Plugin bị hỏng hoặc bị thiếu. Mảng `plugins` là bộ nhớ đệm registry lạnh suy ra từ manifest. Tệp này bao gồm cảnh báo không chỉnh sửa và được dùng bởi `openclaw plugins update`, uninstall, diagnostics và registry Plugin lạnh.

Khi OpenClaw thấy các bản ghi `plugins.installs` kế thừa đã phát hành trong config, các lượt đọc runtime xử lý chúng như đầu vào tương thích mà không ghi lại `openclaw.json`. Các thao tác ghi Plugin rõ ràng và `openclaw doctor --fix` chuyển những bản ghi đó vào chỉ mục Plugin và xóa khóa config khi được phép ghi config; nếu một trong hai thao tác ghi thất bại, các bản ghi config được giữ lại để metadata cài đặt không bị mất.

### Gỡ cài đặt

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` xóa các bản ghi Plugin khỏi `plugins.entries`, chỉ mục Plugin đã lưu, các mục danh sách allow/deny của Plugin, và các mục `plugins.load.paths` đã liên kết khi áp dụng được. Trừ khi đặt `--keep-files`, uninstall cũng xóa thư mục cài đặt được quản lý đã theo dõi khi thư mục đó nằm trong root extensions Plugin của OpenClaw. Đối với các Plugin active memory, slot memory đặt lại về `memory-core`.

<Note>
`--keep-config` được hỗ trợ dưới dạng bí danh đã deprecated cho `--keep-files`.
</Note>

### Cập nhật

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

Cập nhật áp dụng cho các bản cài đặt Plugin đã theo dõi trong chỉ mục Plugin được quản lý và các bản cài đặt hook-pack đã theo dõi trong `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="Resolve id Plugin so với spec npm">
    Khi bạn truyền một id Plugin, OpenClaw tái sử dụng spec cài đặt đã ghi nhận cho Plugin đó. Điều đó nghĩa là các dist-tag đã lưu trước đó như `@beta` và các phiên bản ghim chính xác tiếp tục được dùng trong các lần chạy `update <id>` sau này.

    Đối với bản cài đặt npm, bạn cũng có thể truyền một spec gói npm rõ ràng với dist-tag hoặc phiên bản chính xác. OpenClaw resolve tên gói đó ngược về bản ghi Plugin đã theo dõi, cập nhật Plugin đã cài đặt đó, và ghi nhận spec npm mới cho các lần cập nhật dựa trên id trong tương lai.

    Truyền tên gói npm không kèm phiên bản hoặc thẻ cũng resolve ngược về bản ghi Plugin đã theo dõi. Dùng cách này khi một Plugin đã bị ghim vào phiên bản chính xác và bạn muốn chuyển nó trở lại dòng phát hành mặc định của registry.

  </Accordion>
  <Accordion title="Cập nhật kênh beta">
    `openclaw plugins update` tái sử dụng spec Plugin đã theo dõi trừ khi bạn truyền một spec mới. `openclaw update` còn biết kênh cập nhật OpenClaw đang hoạt động: trên kênh beta, các bản ghi Plugin npm và ClawHub theo dòng mặc định thử `@beta` trước, rồi fallback về spec mặc định/latest đã ghi nhận nếu không có bản phát hành beta Plugin. Fallback đó được báo cáo như cảnh báo và không làm lỗi cập nhật core. Các phiên bản chính xác và thẻ rõ ràng vẫn được ghim vào bộ chọn đó.

  </Accordion>
  <Accordion title="Kiểm tra phiên bản và lệch tính toàn vẹn">
    Trước một cập nhật npm trực tiếp, OpenClaw kiểm tra phiên bản gói đã cài đặt so với metadata registry npm. Nếu phiên bản đã cài đặt và danh tính artifact đã ghi nhận đã khớp với mục tiêu đã resolve, cập nhật được bỏ qua mà không tải xuống, cài đặt lại hoặc ghi lại `openclaw.json`.

    Khi có hash toàn vẹn đã lưu và hash artifact đã fetch thay đổi, OpenClaw xử lý đó là lệch artifact npm. Lệnh tương tác `openclaw plugins update` in hash kỳ vọng và hash thực tế rồi yêu cầu xác nhận trước khi tiếp tục. Các helper cập nhật không tương tác fail closed trừ khi caller cung cấp chính sách tiếp tục rõ ràng.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install khi cập nhật">
    `--dangerously-force-unsafe-install` cũng có trên `plugins update` như một override khẩn cấp cho false positive của quét mã nguy hiểm tích hợp trong quá trình cập nhật Plugin. Nó vẫn không bỏ qua các chặn chính sách `before_install` của Plugin hoặc chặn do lỗi quét, và chỉ áp dụng cho cập nhật Plugin, không áp dụng cho cập nhật hook-pack.
  </Accordion>
</AccordionGroup>

### Kiểm tra

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect hiển thị danh tính, trạng thái tải, nguồn, năng lực manifest, cờ chính sách, diagnostics, metadata cài đặt, năng lực bundle và mọi hỗ trợ máy chủ MCP hoặc LSP được phát hiện mà mặc định không import runtime Plugin. Thêm `--runtime` để tải module Plugin và bao gồm các hook, tool, command, service, gateway method và HTTP route đã đăng ký. Kiểm tra runtime báo cáo trực tiếp các phụ thuộc Plugin bị thiếu; cài đặt và sửa chữa nằm trong `openclaw plugins install`, `openclaw plugins update`, và `openclaw doctor --fix`.

Các lệnh CLI do Plugin sở hữu thường được cài đặt dưới dạng nhóm lệnh root `openclaw`, nhưng Plugin cũng có thể đăng ký lệnh lồng dưới một parent core như `openclaw nodes`. Sau khi `inspect --runtime` hiển thị một lệnh dưới `cliCommands`, hãy chạy nó tại đường dẫn đã liệt kê; ví dụ một Plugin đăng ký `demo-git` có thể được xác minh bằng `openclaw demo-git ping`.

Mỗi Plugin được phân loại theo những gì nó thực sự đăng ký tại runtime:

- **plain-capability** — một loại năng lực (ví dụ: Plugin chỉ dành cho nhà cung cấp)
- **hybrid-capability** — nhiều loại năng lực (ví dụ: văn bản + giọng nói + hình ảnh)
- **hook-only** — chỉ có hook, không có năng lực hoặc bề mặt
- **non-capability** — công cụ/lệnh/dịch vụ nhưng không có năng lực

Xem [Hình dạng Plugin](/vi/plugins/architecture#plugin-shapes) để biết thêm về mô hình năng lực.

<Note>
Cờ `--json` xuất báo cáo có thể đọc bằng máy, phù hợp cho script và kiểm toán. `inspect --all` hiển thị một bảng trên toàn bộ nhóm với các cột hình dạng, loại năng lực, thông báo tương thích, năng lực gói và tóm tắt hook. `info` là bí danh của `inspect`.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` báo cáo lỗi tải Plugin, chẩn đoán manifest/phát hiện và thông báo tương thích. Khi mọi thứ sạch, lệnh in ra `No plugin issues detected.`

Nếu một Plugin đã cấu hình có trên đĩa nhưng bị chặn bởi các kiểm tra an toàn đường dẫn của bộ tải, xác thực cấu hình sẽ giữ mục Plugin và báo cáo mục đó là `present but blocked`. Hãy sửa chẩn đoán Plugin bị chặn đứng trước, chẳng hạn quyền sở hữu đường dẫn hoặc quyền cho phép ghi bởi mọi người, thay vì xóa cấu hình `plugins.entries.<id>` hoặc `plugins.allow`.

Đối với lỗi hình dạng module như thiếu export `register`/`activate`, hãy chạy lại với `OPENCLAW_PLUGIN_LOAD_DEBUG=1` để bao gồm bản tóm tắt ngắn gọn về hình dạng export trong đầu ra chẩn đoán.

### Registry

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Registry Plugin cục bộ là mô hình đọc nguội được OpenClaw lưu bền vững cho danh tính Plugin đã cài đặt, trạng thái bật, siêu dữ liệu nguồn và quyền sở hữu phần đóng góp. Khởi động bình thường, tra cứu chủ sở hữu nhà cung cấp, phân loại thiết lập kênh và kiểm kê Plugin có thể đọc nó mà không cần import các module runtime của Plugin.

Dùng `plugins registry` để kiểm tra registry đã lưu bền vững có tồn tại, hiện hành hay đã cũ. Dùng `--refresh` để dựng lại từ chỉ mục Plugin đã lưu bền vững, chính sách cấu hình và siêu dữ liệu manifest/package. Đây là đường dẫn sửa chữa, không phải đường dẫn kích hoạt runtime.

`openclaw doctor --fix` cũng sửa sai lệch npm được quản lý liền kề registry: nếu một package `@openclaw/*` mồ côi hoặc đã khôi phục nằm dưới gốc npm Plugin được quản lý che khuất một Plugin đi kèm, doctor sẽ xóa package cũ đó và dựng lại registry để quá trình khởi động xác thực dựa trên manifest đi kèm.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` là công tắc tương thích khẩn cấp đã lỗi thời cho lỗi đọc registry. Ưu tiên `plugins registry --refresh` hoặc `openclaw doctor --fix`; phương án dự phòng bằng env chỉ dành cho khôi phục khởi động khẩn cấp trong khi quá trình di chuyển được triển khai.
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Danh sách marketplace chấp nhận đường dẫn marketplace cục bộ, đường dẫn `marketplace.json`, dạng viết tắt GitHub như `owner/repo`, URL repo GitHub hoặc URL git. `--json` in nhãn nguồn đã phân giải cùng manifest marketplace đã phân tích cú pháp và các mục Plugin.

## Liên quan

- [Xây dựng Plugin](/vi/plugins/building-plugins)
- [Tham chiếu CLI](/vi/cli)
- [ClawHub](/vi/clawhub)
