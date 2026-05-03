---
read_when:
    - Bạn muốn cài đặt hoặc quản lý các Plugin Gateway hoặc gói tương thích
    - Bạn muốn gỡ lỗi các lỗi khi tải Plugin
sidebarTitle: Plugins
summary: Tham chiếu CLI cho `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, doctor)
title: Plugins
x-i18n:
    generated_at: "2026-05-03T21:28:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: d854d052b0a012a86f9c775775676a9a8fe8ae86b2c38a18118f1abf0732174c
    source_path: cli/plugins.md
    workflow: 16
---

Quản lý Plugin Gateway, gói hook và các gói tương thích.

<CardGroup cols={2}>
  <Card title="Hệ thống Plugin" href="/vi/tools/plugin">
    Hướng dẫn dành cho người dùng cuối về cài đặt, bật và khắc phục sự cố Plugin.
  </Card>
  <Card title="Quản lý Plugin" href="/vi/plugins/manage-plugins">
    Ví dụ nhanh để cài đặt, liệt kê, cập nhật, gỡ cài đặt và phát hành.
  </Card>
  <Card title="Gói Plugin" href="/vi/plugins/bundles">
    Mô hình tương thích của gói.
  </Card>
  <Card title="Manifest Plugin" href="/vi/plugins/manifest">
    Các trường manifest và schema cấu hình.
  </Card>
  <Card title="Bảo mật" href="/vi/gateway/security">
    Gia cố bảo mật cho cài đặt Plugin.
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

Để điều tra quá trình cài đặt, kiểm tra, gỡ cài đặt hoặc làm mới registry chậm, hãy chạy
lệnh với `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`. Trace ghi thời gian từng pha
vào stderr và giữ cho đầu ra JSON vẫn có thể phân tích được. Xem [Gỡ lỗi](/vi/help/debugging#plugin-lifecycle-trace).

<Note>
Plugin đi kèm được phát hành cùng OpenClaw. Một số được bật theo mặc định (ví dụ các nhà cung cấp mô hình đi kèm, nhà cung cấp giọng nói đi kèm và Plugin trình duyệt đi kèm); các Plugin khác yêu cầu `plugins enable`.

Plugin OpenClaw native phải phát hành `openclaw.plugin.json` với JSON Schema nội tuyến (`configSchema`, kể cả khi rỗng). Các gói tương thích dùng manifest gói riêng của chúng.

`plugins list` hiển thị `Format: openclaw` hoặc `Format: bundle`. Đầu ra danh sách/thông tin chi tiết cũng hiển thị subtype của gói (`codex`, `claude`, hoặc `cursor`) cùng các khả năng gói được phát hiện.
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
Tên package trần mặc định cài đặt từ npm trong giai đoạn chuyển đổi ra mắt. Dùng `clawhub:<package>` cho ClawHub. Hãy xử lý cài đặt Plugin như chạy mã. Ưu tiên phiên bản được ghim.
</Warning>

`plugins search` truy vấn ClawHub để tìm các package Plugin có thể cài đặt và in ra
tên package sẵn sàng cài đặt. Lệnh này tìm kiếm package code-plugin và bundle-plugin,
không phải Skills. Dùng `openclaw skills search` cho Skills trên ClawHub.

<Note>
ClawHub là bề mặt phân phối và khám phá chính cho hầu hết Plugin. Npm
vẫn là đường dẫn dự phòng được hỗ trợ và cài đặt trực tiếp. Các package Plugin
`@openclaw/*` do OpenClaw sở hữu đã được phát hành lại trên npm; xem danh sách hiện tại
trên [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) hoặc
[kho Plugin](/vi/plugins/plugin-inventory). Cài đặt ổn định dùng `latest`.
Cài đặt và cập nhật kênh beta ưu tiên dist-tag `beta` của npm khi tag đó
có sẵn, rồi mới rơi về `latest`.
</Note>

<AccordionGroup>
  <Accordion title="Include cấu hình và sửa cấu hình không hợp lệ">
    Nếu phần `plugins` của bạn được hỗ trợ bởi một `$include` một tệp, `plugins install/update/enable/disable/uninstall` sẽ ghi xuyên qua tệp được include đó và để nguyên `openclaw.json`. Include root, mảng include và include có override cùng cấp sẽ đóng thất bại thay vì làm phẳng. Xem [Include cấu hình](/vi/gateway/configuration) để biết các dạng được hỗ trợ.

    Nếu cấu hình không hợp lệ trong quá trình cài đặt, `plugins install` thường đóng thất bại và yêu cầu bạn chạy `openclaw doctor --fix` trước. Trong quá trình khởi động Gateway và hot reload, cấu hình Plugin không hợp lệ đóng thất bại như mọi cấu hình không hợp lệ khác; `openclaw doctor --fix` có thể cách ly mục Plugin không hợp lệ. Ngoại lệ duy nhất được tài liệu hóa tại thời điểm cài đặt là đường dẫn khôi phục hẹp cho Plugin đi kèm dành cho các Plugin chủ động chọn tham gia `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force và cài đặt lại so với cập nhật">
    `--force` tái sử dụng đích cài đặt hiện có và ghi đè tại chỗ một Plugin hoặc gói hook đã được cài đặt. Dùng tùy chọn này khi bạn cố ý cài đặt lại cùng một id từ đường dẫn cục bộ, archive, package ClawHub hoặc artifact npm mới. Với các nâng cấp thường lệ của một Plugin npm đã được theo dõi, ưu tiên `openclaw plugins update <id-or-npm-spec>`.

    Nếu bạn chạy `plugins install` cho một id Plugin đã được cài đặt, OpenClaw sẽ dừng và trỏ bạn tới `plugins update <id-or-npm-spec>` để nâng cấp bình thường, hoặc tới `plugins install <package> --force` khi bạn thật sự muốn ghi đè cài đặt hiện tại từ một nguồn khác.

  </Accordion>
  <Accordion title="Phạm vi --pin">
    `--pin` chỉ áp dụng cho cài đặt npm. Tùy chọn này không được hỗ trợ với cài đặt `git:`; dùng ref git rõ ràng như `git:github.com/acme/plugin@v1.2.3` khi bạn muốn một nguồn được ghim. Tùy chọn này không được hỗ trợ với `--marketplace`, vì cài đặt marketplace lưu metadata nguồn marketplace thay vì một spec npm.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` là tùy chọn phá kính cho false positive trong bộ quét mã nguy hiểm tích hợp. Nó cho phép quá trình cài đặt tiếp tục ngay cả khi bộ quét tích hợp báo cáo phát hiện `critical`, nhưng nó **không** bỏ qua các chặn chính sách hook `before_install` của Plugin và **không** bỏ qua lỗi quét.

    Cờ CLI này áp dụng cho luồng cài đặt/cập nhật Plugin. Cài đặt phụ thuộc Skills do Gateway hỗ trợ dùng override yêu cầu tương ứng `dangerouslyForceUnsafeInstall`, trong khi `openclaw skills install` vẫn là một luồng tải xuống/cài đặt Skills ClawHub riêng.

    Nếu một Plugin bạn phát hành trên ClawHub bị chặn bởi quét registry, hãy dùng các bước dành cho nhà phát hành trong [ClawHub](/vi/tools/clawhub).

  </Accordion>
  <Accordion title="Gói hook và spec npm">
    `plugins install` cũng là bề mặt cài đặt cho các gói hook phơi bày `openclaw.hooks` trong `package.json`. Dùng `openclaw hooks` để xem hook đã lọc và bật từng hook, không phải để cài đặt package.

    Spec npm là **chỉ registry** (tên package + **phiên bản chính xác** tùy chọn hoặc **dist-tag**). Spec Git/URL/file và dải semver bị từ chối. Cài đặt phụ thuộc chạy cục bộ theo project với `--ignore-scripts` để an toàn, ngay cả khi shell của bạn có thiết lập cài đặt npm toàn cục.

    Dùng `npm:<package>` khi bạn muốn làm rõ việc phân giải npm. Spec package trần cũng cài đặt trực tiếp từ npm trong giai đoạn chuyển đổi ra mắt.

    Spec trần và `@latest` vẫn ở track ổn định. Nếu npm phân giải một trong hai dạng đó thành một prerelease, OpenClaw sẽ dừng và yêu cầu bạn chủ động chọn tham gia bằng một tag prerelease như `@beta`/`@rc` hoặc một phiên bản prerelease chính xác như `@1.2.3-beta.4`.

    Nếu một spec cài đặt trần khớp với id Plugin chính thức (ví dụ `diffs`), OpenClaw sẽ cài đặt trực tiếp mục catalog. Để cài đặt một package npm cùng tên, dùng spec có scope rõ ràng (ví dụ `@scope/diffs`).

  </Accordion>
  <Accordion title="Kho Git">
    Dùng `git:<repo>` để cài đặt trực tiếp từ kho git. Các dạng được hỗ trợ gồm `git:github.com/owner/repo`, `git:owner/repo`, URL clone đầy đủ `https://`, `ssh://`, `git://`, `file://` và `git@host:owner/repo.git`. Thêm `@<ref>` hoặc `#<ref>` để checkout một branch, tag hoặc commit trước khi cài đặt.

    Cài đặt Git clone vào một thư mục tạm, checkout ref được yêu cầu khi có, rồi dùng trình cài đặt thư mục Plugin thông thường. Điều đó có nghĩa là xác thực manifest, quét mã nguy hiểm, công việc cài đặt package-manager và bản ghi cài đặt hoạt động giống cài đặt npm. Cài đặt git được ghi lại bao gồm URL/ref nguồn cùng commit đã phân giải để `openclaw plugins update` có thể phân giải lại nguồn sau này.

    Sau khi cài đặt từ git, dùng `openclaw plugins inspect <id> --runtime --json` để xác minh các đăng ký runtime như phương thức gateway và lệnh CLI. Nếu Plugin đã đăng ký một root CLI bằng `api.registerCli`, hãy thực thi lệnh đó trực tiếp qua CLI root của OpenClaw, ví dụ `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Archive">
    Archive được hỗ trợ: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Archive Plugin OpenClaw native phải chứa `openclaw.plugin.json` hợp lệ tại root Plugin sau khi giải nén; archive chỉ chứa `package.json` bị từ chối trước khi OpenClaw ghi bản ghi cài đặt.

    Cài đặt marketplace Claude cũng được hỗ trợ.

  </Accordion>
</AccordionGroup>

Cài đặt ClawHub dùng bộ định vị `clawhub:<package>` rõ ràng:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Spec Plugin an toàn với npm dạng trần mặc định cài đặt từ npm trong giai đoạn chuyển đổi ra mắt:

```bash
openclaw plugins install openclaw-codex-app-server
```

Dùng `npm:` để làm rõ chỉ phân giải qua npm:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw kiểm tra API Plugin được quảng bá / mức tương thích Gateway tối thiểu trước khi cài đặt. Khi phiên bản ClawHub được chọn phát hành artifact ClawPack, OpenClaw tải `.tgz` npm-pack có phiên bản, xác minh header digest ClawHub và digest artifact, rồi cài đặt qua đường dẫn archive thông thường. Các phiên bản ClawHub cũ hơn không có metadata ClawPack vẫn cài đặt qua đường dẫn xác minh archive package legacy. Bản ghi cài đặt giữ metadata nguồn ClawHub, loại artifact, integrity npm, shasum npm, tên tarball và các thông tin digest ClawPack để cập nhật về sau.
Cài đặt ClawHub không phiên bản giữ spec đã ghi không phiên bản để `openclaw plugins update` có thể theo các bản phát hành ClawHub mới hơn; các bộ chọn phiên bản hoặc tag rõ ràng như `clawhub:pkg@1.2.3` và `clawhub:pkg@beta` vẫn được ghim vào bộ chọn đó.

#### Viết tắt marketplace

Dùng viết tắt `plugin@marketplace` khi tên marketplace tồn tại trong cache registry cục bộ của Claude tại `~/.claude/plugins/known_marketplaces.json`:

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
    - gốc marketplace cục bộ hoặc đường dẫn `marketplace.json`
    - dạng viết tắt repo GitHub như `owner/repo`
    - URL repo GitHub như `https://github.com/owner/repo`
    - URL git

  </Tab>
  <Tab title="Quy tắc marketplace từ xa">
    Đối với marketplace từ xa được tải từ GitHub hoặc git, các mục plugin phải nằm bên trong repo marketplace đã clone. OpenClaw chấp nhận nguồn đường dẫn tương đối từ repo đó và từ chối HTTP(S), đường dẫn tuyệt đối, git, GitHub, và các nguồn plugin không phải đường dẫn khác từ manifest từ xa.
  </Tab>
</Tabs>

Đối với đường dẫn cục bộ và kho lưu trữ, OpenClaw tự động phát hiện:

- plugin OpenClaw gốc (`openclaw.plugin.json`)
- gói tương thích Codex (`.codex-plugin/plugin.json`)
- gói tương thích Claude (`.claude-plugin/plugin.json` hoặc bố cục thành phần Claude mặc định)
- gói tương thích Cursor (`.cursor-plugin/plugin.json`)

<Note>
Các gói tương thích được cài vào gốc plugin thông thường và tham gia cùng luồng list/info/enable/disable. Hiện tại, bundle skills, command-skills của Claude, mặc định `settings.json` của Claude, mặc định `.lsp.json` / `lspServers` được khai báo trong manifest của Claude, command-skills của Cursor, và thư mục hook Codex tương thích được hỗ trợ; các khả năng gói khác được phát hiện sẽ hiển thị trong diagnostics/info nhưng chưa được nối vào thực thi runtime.
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
  Chỉ hiển thị các plugin đã bật.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Chuyển từ dạng bảng sang các dòng chi tiết theo từng plugin với metadata nguồn/xuất xứ/phiên bản/kích hoạt.
</ParamField>
<ParamField path="--json" type="boolean">
  Inventory mà máy có thể đọc cùng diagnostics registry và trạng thái cài đặt phụ thuộc package.
</ParamField>

<Note>
`plugins list` đọc registry plugin cục bộ đã lưu trước, với fallback chỉ từ manifest khi registry bị thiếu hoặc không hợp lệ. Lệnh này hữu ích để kiểm tra một plugin có được cài đặt, bật và hiển thị với kế hoạch khởi động lạnh hay không, nhưng không phải là phép dò runtime trực tiếp của một tiến trình Gateway đang chạy. Sau khi thay đổi mã plugin, enablement, chính sách hook hoặc `plugins.load.paths`, hãy khởi động lại Gateway phục vụ channel trước khi mong đợi mã `register(api)` hoặc hook mới chạy. Với triển khai từ xa/container, hãy xác minh bạn đang khởi động lại đúng tiến trình con `openclaw gateway run`, không chỉ một tiến trình wrapper.

`plugins list --json` bao gồm `dependencyStatus` của từng plugin từ `package.json`
`dependencies` và `optionalDependencies`. OpenClaw kiểm tra xem các tên package đó
có hiện diện dọc theo đường dẫn tra cứu `node_modules` Node thông thường của plugin hay không; lệnh này
không import mã runtime plugin, chạy trình quản lý package, hoặc sửa các
phụ thuộc bị thiếu.
</Note>

`plugins search` là tra cứu catalog ClawHub từ xa. Lệnh này không kiểm tra trạng thái
cục bộ, sửa đổi config, cài package, hoặc tải mã runtime plugin. Kết quả tìm kiếm
bao gồm tên package ClawHub, family, channel, phiên bản, tóm tắt, và
gợi ý cài đặt như `openclaw plugins install clawhub:<package>`.

Đối với công việc trên plugin đi kèm bên trong image Docker đã đóng gói, hãy bind-mount thư mục
nguồn plugin lên đường dẫn nguồn đã đóng gói tương ứng, như
`/app/extensions/synology-chat`. OpenClaw sẽ phát hiện lớp phủ nguồn đã mount đó
trước `/app/dist/extensions/synology-chat`; thư mục nguồn chỉ được sao chép
vẫn không hoạt động để các bản cài đặt đóng gói thông thường vẫn dùng dist đã biên dịch.

Để debug hook runtime:

- `openclaw plugins inspect <id> --runtime --json` hiển thị hook đã đăng ký và diagnostics từ một lượt kiểm tra đã tải module. Kiểm tra runtime không bao giờ cài phụ thuộc; dùng `openclaw doctor --fix` để dọn trạng thái phụ thuộc legacy hoặc cài các plugin có thể tải xuống đã cấu hình nhưng bị thiếu.
- `openclaw gateway status --deep --require-rpc` xác nhận Gateway có thể kết nối, gợi ý service/process, đường dẫn config và sức khỏe RPC.
- Hook hội thoại không đi kèm (`llm_input`, `llm_output`, `before_agent_finalize`, `agent_end`) yêu cầu `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Dùng `--link` để tránh sao chép thư mục cục bộ (thêm vào `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` không được hỗ trợ với `--link` vì bản cài liên kết tái sử dụng đường dẫn nguồn thay vì sao chép đè lên mục tiêu cài đặt được quản lý.

Dùng `--pin` trên bản cài npm để lưu spec chính xác đã phân giải (`name@version`) trong chỉ mục plugin được quản lý trong khi vẫn giữ hành vi mặc định không ghim.
</Note>

### Chỉ mục Plugin

Metadata cài đặt Plugin là trạng thái do máy quản lý, không phải config người dùng. Các lượt cài đặt và cập nhật ghi nó vào `plugins/installs.json` dưới thư mục trạng thái OpenClaw đang hoạt động. Map `installRecords` cấp cao nhất là nguồn bền vững của metadata cài đặt, bao gồm bản ghi cho manifest plugin bị hỏng hoặc bị thiếu. Mảng `plugins` là cache registry lạnh được dẫn xuất từ manifest. Tệp có cảnh báo không chỉnh sửa và được dùng bởi `openclaw plugins update`, uninstall, diagnostics và registry plugin lạnh.

Khi OpenClaw thấy các bản ghi legacy `plugins.installs` đã phát hành trong config, OpenClaw chuyển chúng vào chỉ mục plugin và xóa khóa config; nếu một trong hai thao tác ghi thất bại, các bản ghi config được giữ lại để metadata cài đặt không bị mất.

### Gỡ cài đặt

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` xóa bản ghi plugin khỏi `plugins.entries`, chỉ mục plugin đã lưu, mục allow/deny list plugin, và mục `plugins.load.paths` đã liên kết khi áp dụng. Trừ khi đặt `--keep-files`, uninstall cũng xóa thư mục cài đặt được quản lý đã theo dõi khi thư mục đó nằm trong gốc tiện ích mở rộng plugin của OpenClaw. Đối với plugin active memory, memory slot đặt lại về `memory-core`.

<Note>
`--keep-config` được hỗ trợ dưới dạng alias đã deprecated cho `--keep-files`.
</Note>

### Cập nhật

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

Cập nhật áp dụng cho các bản cài plugin được theo dõi trong chỉ mục plugin được quản lý và các bản cài hook-pack được theo dõi trong `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="Phân giải plugin id so với npm spec">
    Khi bạn truyền một plugin id, OpenClaw tái sử dụng install spec đã ghi lại cho plugin đó. Điều đó nghĩa là các dist-tag đã lưu trước đó như `@beta` và phiên bản ghim chính xác tiếp tục được dùng trong các lần chạy `update <id>` sau này.

    Đối với bản cài npm, bạn cũng có thể truyền một npm package spec rõ ràng với dist-tag hoặc phiên bản chính xác. OpenClaw phân giải tên package đó ngược về bản ghi plugin đã theo dõi, cập nhật plugin đã cài đó, và ghi lại npm spec mới cho các lần cập nhật dựa trên id trong tương lai.

    Truyền tên package npm không có phiên bản hoặc tag cũng phân giải ngược về bản ghi plugin đã theo dõi. Dùng cách này khi một plugin đã bị ghim vào phiên bản chính xác và bạn muốn chuyển nó trở lại dòng phát hành mặc định của registry.

  </Accordion>
  <Accordion title="Cập nhật kênh beta">
    `openclaw plugins update` tái sử dụng spec plugin đã theo dõi trừ khi bạn truyền spec mới. `openclaw update` ngoài ra còn biết channel cập nhật OpenClaw đang hoạt động: trên channel beta, các bản ghi plugin npm dòng mặc định và ClawHub thử `@beta` trước, rồi fallback về spec default/latest đã ghi lại nếu không có bản phát hành beta của plugin. Phiên bản chính xác và tag rõ ràng vẫn được ghim vào bộ chọn đó.

  </Accordion>
  <Accordion title="Kiểm tra phiên bản và drift tính toàn vẹn">
    Trước một lượt cập nhật npm trực tiếp, OpenClaw kiểm tra phiên bản package đã cài so với metadata registry npm. Nếu phiên bản đã cài và định danh artifact đã ghi lại đã khớp với mục tiêu được phân giải, cập nhật sẽ bị bỏ qua mà không tải xuống, cài đặt lại hoặc ghi lại `openclaw.json`.

    Khi tồn tại hash tính toàn vẹn đã lưu và hash artifact được lấy về thay đổi, OpenClaw xem đó là drift artifact npm. Lệnh tương tác `openclaw plugins update` in hash mong đợi và hash thực tế rồi yêu cầu xác nhận trước khi tiếp tục. Các helper cập nhật không tương tác fail closed trừ khi caller cung cấp chính sách tiếp tục rõ ràng.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install khi cập nhật">
    `--dangerously-force-unsafe-install` cũng có trên `plugins update` như một override break-glass cho các false positive của dangerous-code scan tích hợp trong quá trình cập nhật plugin. Nó vẫn không bỏ qua các chặn chính sách `before_install` của plugin hoặc chặn do scan thất bại, và chỉ áp dụng cho cập nhật plugin, không áp dụng cho cập nhật hook-pack.
  </Accordion>
</AccordionGroup>

### Kiểm tra

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect hiển thị identity, trạng thái tải, nguồn, khả năng manifest, cờ chính sách, diagnostics, metadata cài đặt, khả năng gói, và mọi hỗ trợ máy chủ MCP hoặc LSP được phát hiện mà mặc định không import runtime plugin. Thêm `--runtime` để tải module plugin và bao gồm các hook, tool, command, service, gateway method, và HTTP route đã đăng ký. Kiểm tra runtime báo trực tiếp các phụ thuộc plugin bị thiếu; việc cài đặt và sửa chữa vẫn nằm trong `openclaw plugins install`, `openclaw plugins update`, và `openclaw doctor --fix`.

Các lệnh CLI do plugin sở hữu được cài dưới dạng nhóm lệnh gốc `openclaw`. Sau khi `inspect --runtime` hiển thị một lệnh dưới `cliCommands`, hãy chạy nó dưới dạng `openclaw <command> ...`; ví dụ một plugin đăng ký `demo-git` có thể được xác minh bằng `openclaw demo-git ping`.

Mỗi plugin được phân loại theo thứ mà nó thực sự đăng ký ở runtime:

- **plain-capability** — một loại khả năng (ví dụ: plugin chỉ provider)
- **hybrid-capability** — nhiều loại khả năng (ví dụ: văn bản + giọng nói + hình ảnh)
- **hook-only** — chỉ hook, không có khả năng hoặc surface
- **non-capability** — tool/command/service nhưng không có khả năng

Xem [Dạng Plugin](/vi/plugins/architecture#plugin-shapes) để biết thêm về mô hình khả năng.

<Note>
Cờ `--json` xuất báo cáo mà máy có thể đọc, phù hợp cho script và audit. `inspect --all` hiển thị bảng toàn bộ đội với các cột shape, loại khả năng, thông báo tương thích, khả năng gói, và tóm tắt hook. `info` là alias cho `inspect`.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` báo cáo lỗi tải plugin, diagnostics manifest/discovery, và thông báo tương thích. Khi mọi thứ sạch, lệnh in `No plugin issues detected.`

Nếu một plugin đã cấu hình hiện diện trên ổ đĩa nhưng bị chặn bởi các kiểm tra an toàn đường dẫn của loader, xác thực config giữ lại mục plugin và báo cáo là `present but blocked`. Hãy sửa diagnostic plugin bị chặn đứng trước, như quyền sở hữu đường dẫn hoặc quyền world-writable, thay vì xóa config `plugins.entries.<id>` hoặc `plugins.allow`.

Đối với lỗi hình dạng module như thiếu export `register`/`activate`, chạy lại với `OPENCLAW_PLUGIN_LOAD_DEBUG=1` để bao gồm tóm tắt hình dạng export gọn trong đầu ra diagnostic.

### Registry

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Registry plugin cục bộ là mô hình đọc lạnh đã lưu của OpenClaw cho identity plugin đã cài, enablement, metadata nguồn, và quyền sở hữu đóng góp. Khởi động thông thường, tra cứu chủ sở hữu provider, phân loại thiết lập channel, và inventory plugin có thể đọc nó mà không import module runtime plugin.

Dùng `plugins registry` để kiểm tra registry được lưu bền vững có tồn tại, hiện hành hay đã lỗi thời. Dùng `--refresh` để dựng lại registry từ chỉ mục plugin được lưu bền vững, chính sách cấu hình và siêu dữ liệu manifest/package. Đây là đường dẫn sửa chữa, không phải đường dẫn kích hoạt lúc chạy.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` là công tắc tương thích khẩn cấp đã ngừng khuyến nghị dùng cho lỗi đọc registry. Nên dùng `plugins registry --refresh` hoặc `openclaw doctor --fix`; phương án dự phòng bằng env chỉ dành cho khôi phục khởi động khẩn cấp trong khi quá trình di chuyển được triển khai.
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Danh sách Marketplace chấp nhận đường dẫn marketplace cục bộ, đường dẫn `marketplace.json`, dạng viết tắt GitHub như `owner/repo`, URL repo GitHub hoặc URL git. `--json` in nhãn nguồn đã phân giải cùng với manifest marketplace đã phân tích cú pháp và các mục plugin.

## Liên quan

- [Xây dựng plugin](/vi/plugins/building-plugins)
- [Tham chiếu CLI](/vi/cli)
- [Plugin cộng đồng](/vi/plugins/community)
