---
read_when:
    - Bạn muốn cài đặt hoặc quản lý các Plugin của Gateway hoặc các gói tương thích
    - Bạn muốn gỡ lỗi khi tải Plugin không thành công
sidebarTitle: Plugins
summary: Tài liệu tham chiếu CLI cho `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, doctor)
title: Plugin
x-i18n:
    generated_at: "2026-05-07T13:14:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 73023d11309c5dc4fe9fab9cffc0f7d96de1e1c22ce1ec4d2cd22d2aa4808f1a
    source_path: cli/plugins.md
    workflow: 16
---

Quản lý plugin Gateway, gói hook và các bundle tương thích.

<CardGroup cols={2}>
  <Card title="Hệ thống Plugin" href="/vi/tools/plugin">
    Hướng dẫn cho người dùng cuối về cách cài đặt, bật và khắc phục sự cố plugin.
  </Card>
  <Card title="Quản lý plugin" href="/vi/plugins/manage-plugins">
    Ví dụ nhanh cho cài đặt, liệt kê, cập nhật, gỡ cài đặt và xuất bản.
  </Card>
  <Card title="Bundle Plugin" href="/vi/plugins/bundles">
    Mô hình tương thích của bundle.
  </Card>
  <Card title="Manifest Plugin" href="/vi/plugins/manifest">
    Các trường manifest và schema cấu hình.
  </Card>
  <Card title="Bảo mật" href="/vi/gateway/security">
    Gia cố bảo mật cho cài đặt plugin.
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

Để điều tra cài đặt, kiểm tra, gỡ cài đặt hoặc làm mới registry chậm, hãy chạy
lệnh với `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`. Trace ghi thời lượng từng pha
vào stderr và giữ cho đầu ra JSON có thể phân tích cú pháp. Xem [Gỡ lỗi](/vi/help/debugging#plugin-lifecycle-trace).

<Note>
Ở chế độ Nix (`OPENCLAW_NIX_MODE=1`), các thao tác thay đổi vòng đời plugin bị tắt. Thay vào đó hãy dùng nguồn Nix cho cài đặt này thay vì `plugins install`, `plugins update`, `plugins uninstall`, `plugins enable`, hoặc `plugins disable`; với nix-openclaw, hãy dùng [Bắt đầu nhanh](https://github.com/openclaw/nix-openclaw#quick-start) theo hướng agent-first.
</Note>

<Note>
Các plugin đi kèm được phát hành cùng OpenClaw. Một số được bật theo mặc định (ví dụ nhà cung cấp mô hình đi kèm, nhà cung cấp giọng nói đi kèm và plugin trình duyệt đi kèm); các plugin khác yêu cầu `plugins enable`.

Plugin OpenClaw native phải phát hành `openclaw.plugin.json` với JSON Schema nội tuyến (`configSchema`, ngay cả khi rỗng). Các bundle tương thích dùng manifest bundle riêng của chúng.

`plugins list` hiển thị `Format: openclaw` hoặc `Format: bundle`. Đầu ra danh sách/thông tin chi tiết cũng hiển thị subtype bundle (`codex`, `claude`, hoặc `cursor`) cùng các capability bundle được phát hiện.
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

<Warning>
Tên package trần mặc định cài đặt từ npm trong giai đoạn chuyển đổi lúc ra mắt. Dùng `clawhub:<package>` cho ClawHub. Hãy xem việc cài đặt plugin như chạy mã. Ưu tiên các phiên bản được pin.
</Warning>

`plugins search` truy vấn ClawHub để tìm các package plugin có thể cài đặt và in
tên package sẵn sàng để cài đặt. Nó tìm kiếm các package code-plugin và bundle-plugin,
không phải skills. Dùng `openclaw skills search` cho Skills trên ClawHub.

<Note>
ClawHub là bề mặt phân phối và khám phá chính cho hầu hết plugin. Npm
vẫn là đường dẫn dự phòng và cài đặt trực tiếp được hỗ trợ. Các package plugin
`@openclaw/*` do OpenClaw sở hữu đã được xuất bản lại trên npm; xem danh sách hiện tại
trên [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) hoặc
[kiểm kê plugin](/vi/plugins/plugin-inventory). Cài đặt ổn định dùng `latest`.
Cài đặt và cập nhật kênh beta ưu tiên dist-tag `beta` của npm khi tag đó
có sẵn, sau đó fallback về `latest`.
</Note>

<AccordionGroup>
  <Accordion title="Config includes và sửa cấu hình không hợp lệ">
    Nếu phần `plugins` của bạn được hỗ trợ bởi `$include` một tệp, `plugins install/update/enable/disable/uninstall` sẽ ghi xuyên qua tệp được include đó và giữ nguyên `openclaw.json`. Include gốc, mảng include và include có ghi đè cùng cấp sẽ fail closed thay vì bị làm phẳng. Xem [Config includes](/vi/gateway/configuration) để biết các dạng được hỗ trợ.

    Nếu cấu hình không hợp lệ trong khi cài đặt, `plugins install` thường fail closed và yêu cầu bạn chạy `openclaw doctor --fix` trước. Trong quá trình khởi động Gateway và hot reload, cấu hình plugin không hợp lệ fail closed như mọi cấu hình không hợp lệ khác; `openclaw doctor --fix` có thể cách ly mục plugin không hợp lệ. Ngoại lệ duy nhất được ghi tài liệu ở thời điểm cài đặt là đường khôi phục hẹp cho plugin đi kèm đối với các plugin chủ động chọn `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force và cài đặt lại so với cập nhật">
    `--force` tái sử dụng đích cài đặt hiện có và ghi đè plugin hoặc gói hook đã cài đặt ngay tại chỗ. Dùng tùy chọn này khi bạn chủ ý cài đặt lại cùng id từ đường dẫn cục bộ, archive, package ClawHub hoặc artifact npm mới. Với các nâng cấp thường lệ của một plugin npm đã được theo dõi, hãy ưu tiên `openclaw plugins update <id-or-npm-spec>`.

    Nếu bạn chạy `plugins install` cho một id plugin đã được cài đặt, OpenClaw sẽ dừng và chỉ bạn đến `plugins update <id-or-npm-spec>` cho nâng cấp thông thường, hoặc đến `plugins install <package> --force` khi bạn thực sự muốn ghi đè cài đặt hiện tại từ một nguồn khác.

  </Accordion>
  <Accordion title="Phạm vi --pin">
    `--pin` chỉ áp dụng cho cài đặt npm. Tùy chọn này không được hỗ trợ với cài đặt `git:`; hãy dùng git ref rõ ràng như `git:github.com/acme/plugin@v1.2.3` khi bạn muốn nguồn được pin. Nó không được hỗ trợ với `--marketplace`, vì cài đặt marketplace lưu metadata nguồn marketplace thay vì một spec npm.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` là tùy chọn break-glass cho các cảnh báo dương tính giả trong bộ quét mã nguy hiểm tích hợp. Nó cho phép tiếp tục cài đặt ngay cả khi bộ quét tích hợp báo cáo phát hiện `critical`, nhưng nó **không** bỏ qua các chặn chính sách hook `before_install` của plugin và **không** bỏ qua lỗi quét.

    Cờ CLI này áp dụng cho các luồng cài đặt/cập nhật plugin. Cài đặt phụ thuộc Skills do Gateway hỗ trợ dùng override yêu cầu tương ứng `dangerouslyForceUnsafeInstall`, trong khi `openclaw skills install` vẫn là một luồng tải xuống/cài đặt Skills ClawHub riêng.

    Nếu một plugin bạn đã xuất bản trên ClawHub bị chặn bởi quét registry, hãy dùng các bước dành cho publisher trong [ClawHub](/vi/tools/clawhub).

  </Accordion>
  <Accordion title="Gói hook và spec npm">
    `plugins install` cũng là bề mặt cài đặt cho các gói hook phơi bày `openclaw.hooks` trong `package.json`. Dùng `openclaw hooks` để xem hook có lọc và bật từng hook, không phải để cài đặt package.

    Spec npm là **chỉ registry** (tên package + **phiên bản chính xác** hoặc **dist-tag** tùy chọn). Spec Git/URL/file và khoảng semver bị từ chối. Cài đặt phụ thuộc chạy cục bộ theo project với `--ignore-scripts` để an toàn, ngay cả khi shell của bạn có thiết lập cài đặt npm toàn cục. Các root npm plugin được quản lý kế thừa `overrides` npm ở cấp package của OpenClaw, vì vậy các pin bảo mật của host cũng áp dụng cho phụ thuộc plugin được hoist.

    Dùng `npm:<package>` khi bạn muốn làm rõ việc phân giải npm. Spec package trần cũng cài đặt trực tiếp từ npm trong giai đoạn chuyển đổi lúc ra mắt.

    Spec trần và `@latest` ở lại track ổn định. Các phiên bản sửa lỗi có đóng dấu ngày của OpenClaw như `2026.5.3-1` là bản phát hành ổn định cho kiểm tra này. Nếu npm phân giải một trong hai dạng đó thành bản prerelease, OpenClaw sẽ dừng và yêu cầu bạn chọn tham gia rõ ràng bằng tag prerelease như `@beta`/`@rc` hoặc phiên bản prerelease chính xác như `@1.2.3-beta.4`.

    Nếu một spec cài đặt trần khớp với id plugin chính thức (ví dụ `diffs`), OpenClaw cài đặt trực tiếp mục catalog. Để cài một package npm cùng tên, hãy dùng spec scoped rõ ràng (ví dụ `@scope/diffs`).

  </Accordion>
  <Accordion title="Kho Git">
    Dùng `git:<repo>` để cài đặt trực tiếp từ kho git. Các dạng được hỗ trợ bao gồm `git:github.com/owner/repo`, `git:owner/repo`, URL clone đầy đủ `https://`, `ssh://`, `git://`, `file://`, và `git@host:owner/repo.git`. Thêm `@<ref>` hoặc `#<ref>` để checkout một branch, tag hoặc commit trước khi cài đặt.

    Cài đặt Git clone vào thư mục tạm, checkout ref được yêu cầu khi có, sau đó dùng trình cài đặt thư mục plugin bình thường. Điều đó có nghĩa là xác thực manifest, quét mã nguy hiểm, công việc cài đặt của package-manager và bản ghi cài đặt hoạt động như cài đặt npm. Cài đặt git được ghi lại bao gồm URL/ref nguồn cùng commit đã phân giải để `openclaw plugins update` có thể phân giải lại nguồn sau này.

    Sau khi cài đặt từ git, dùng `openclaw plugins inspect <id> --runtime --json` để xác minh các đăng ký runtime như phương thức gateway và lệnh CLI. Nếu plugin đã đăng ký một root CLI với `api.registerCli`, hãy thực thi lệnh đó trực tiếp thông qua CLI root của OpenClaw, ví dụ `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Archive">
    Archive được hỗ trợ: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Archive plugin OpenClaw native phải chứa `openclaw.plugin.json` hợp lệ ở root plugin sau khi giải nén; archive chỉ chứa `package.json` bị từ chối trước khi OpenClaw ghi bản ghi cài đặt.

    Dùng `npm-pack:<path.tgz>` khi tệp là tarball npm-pack và bạn muốn
    kiểm thử cùng đường cài đặt root npm được quản lý mà cài đặt registry dùng,
    bao gồm xác minh `package-lock.json`, quét phụ thuộc được hoist và
    bản ghi cài đặt npm. Đường dẫn archive thông thường vẫn cài đặt như archive cục bộ
    dưới root extensions plugin.

    Cài đặt marketplace Claude cũng được hỗ trợ.

  </Accordion>
</AccordionGroup>

Cài đặt ClawHub dùng locator rõ ràng `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Spec plugin an toàn với npm dạng trần mặc định cài đặt từ npm trong giai đoạn chuyển đổi lúc ra mắt:

```bash
openclaw plugins install openclaw-codex-app-server
```

Dùng `npm:` để làm rõ phân giải chỉ npm:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw kiểm tra API Plugin được công bố / mức tương thích Gateway tối thiểu trước khi cài đặt. Khi phiên bản ClawHub được chọn phát hành một artifact ClawPack, OpenClaw tải xuống `.tgz` npm-pack có phiên bản, xác minh header digest ClawHub và digest artifact, rồi cài đặt qua đường dẫn lưu trữ thông thường. Các phiên bản ClawHub cũ hơn không có metadata ClawPack vẫn cài đặt qua đường dẫn xác minh kho lưu trữ gói cũ. Các bản cài đặt đã ghi nhận giữ metadata nguồn ClawHub, loại artifact, npm integrity, npm shasum, tên tarball, và các dữ kiện digest ClawPack để cập nhật về sau.
Các bản cài đặt ClawHub không có phiên bản giữ spec đã ghi nhận không có phiên bản để `openclaw plugins update` có thể theo các bản phát hành ClawHub mới hơn; bộ chọn phiên bản hoặc tag rõ ràng như `clawhub:pkg@1.2.3` và `clawhub:pkg@beta` vẫn được ghim vào bộ chọn đó.

#### Cách viết tắt marketplace

Dùng cách viết tắt `plugin@marketplace` khi tên marketplace tồn tại trong bộ nhớ đệm registry cục bộ của Claude tại `~/.claude/plugins/known_marketplaces.json`:

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

Dùng `--marketplace` khi bạn muốn truyền rõ nguồn marketplace:

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

<Tabs>
  <Tab title="Nguồn marketplace">
    - tên marketplace Claude đã biết từ `~/.claude/plugins/known_marketplaces.json`
    - gốc marketplace cục bộ hoặc đường dẫn `marketplace.json`
    - cách viết tắt repo GitHub như `owner/repo`
    - URL repo GitHub như `https://github.com/owner/repo`
    - URL git

  </Tab>
  <Tab title="Quy tắc marketplace từ xa">
    Đối với marketplace từ xa được tải từ GitHub hoặc git, các mục Plugin phải nằm bên trong repo marketplace đã clone. OpenClaw chấp nhận nguồn đường dẫn tương đối từ repo đó và từ chối HTTP(S), đường dẫn tuyệt đối, git, GitHub, và các nguồn Plugin không phải đường dẫn khác từ manifest từ xa.
  </Tab>
</Tabs>

Đối với đường dẫn cục bộ và kho lưu trữ, OpenClaw tự động phát hiện:

- Plugin OpenClaw gốc (`openclaw.plugin.json`)
- gói tương thích Codex (`.codex-plugin/plugin.json`)
- gói tương thích Claude (`.claude-plugin/plugin.json` hoặc bố cục thành phần Claude mặc định)
- gói tương thích Cursor (`.cursor-plugin/plugin.json`)

<Note>
Các gói tương thích cài đặt vào gốc Plugin thông thường và tham gia cùng luồng list/info/enable/disable. Hiện tại, bundle skills, Claude command-skills, mặc định Claude `settings.json`, mặc định Claude `.lsp.json` / `lspServers` do manifest khai báo, Cursor command-skills, và thư mục hook Codex tương thích được hỗ trợ; các khả năng gói khác được phát hiện sẽ hiển thị trong diagnostics/info nhưng chưa được nối vào thực thi runtime.
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
  Chỉ hiển thị Plugin đã bật.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Chuyển từ chế độ xem bảng sang các dòng chi tiết theo từng Plugin với metadata nguồn/xuất xứ/phiên bản/kích hoạt.
</ParamField>
<ParamField path="--json" type="boolean">
  Inventory đọc được bằng máy cùng diagnostics registry và trạng thái cài đặt dependency gói.
</ParamField>

<Note>
`plugins list` đọc registry Plugin cục bộ đã lưu trước, với fallback chỉ dựa trên manifest khi registry bị thiếu hoặc không hợp lệ. Lệnh này hữu ích để kiểm tra một Plugin đã được cài đặt, bật, và hiển thị với kế hoạch khởi động lạnh hay chưa, nhưng đây không phải là phép dò runtime trực tiếp của một tiến trình Gateway đang chạy. Sau khi thay đổi mã Plugin, trạng thái bật, chính sách hook, hoặc `plugins.load.paths`, hãy khởi động lại Gateway phục vụ channel trước khi kỳ vọng mã `register(api)` hoặc hook mới chạy. Đối với triển khai từ xa/container, hãy xác minh bạn đang khởi động lại đúng tiến trình con `openclaw gateway run` thực tế, không chỉ một tiến trình wrapper.

`plugins list --json` bao gồm `dependencyStatus` của từng Plugin từ `package.json`
`dependencies` và `optionalDependencies`. OpenClaw kiểm tra liệu các tên gói đó
có hiện diện dọc theo đường dẫn tra cứu Node `node_modules` thông thường của Plugin hay không; OpenClaw
không import mã runtime Plugin, không chạy package manager, và không sửa chữa
dependency bị thiếu.
</Note>

`plugins search` là tra cứu catalog ClawHub từ xa. Lệnh này không kiểm tra trạng thái
cục bộ, không thay đổi config, không cài đặt gói, và không tải mã runtime Plugin. Kết quả
tìm kiếm bao gồm tên gói ClawHub, family, channel, phiên bản, tóm tắt, và
gợi ý cài đặt như `openclaw plugins install clawhub:<package>`.

Đối với công việc với Plugin đóng gói sẵn bên trong image Docker đã đóng gói, hãy bind-mount thư mục
nguồn Plugin đè lên đường dẫn nguồn đã đóng gói tương ứng, chẳng hạn như
`/app/extensions/synology-chat`. OpenClaw sẽ phát hiện lớp phủ nguồn đã mount đó
trước `/app/dist/extensions/synology-chat`; một thư mục nguồn được sao chép thuần túy
vẫn không hoạt động để các bản cài đặt đã đóng gói thông thường tiếp tục dùng dist đã biên dịch.

Để debug hook runtime:

- `openclaw plugins inspect <id> --runtime --json` hiển thị các hook đã đăng ký và diagnostics từ một lượt kiểm tra có tải module. Kiểm tra runtime không bao giờ cài đặt dependency; dùng `openclaw doctor --fix` để dọn trạng thái dependency cũ hoặc khôi phục Plugin có thể tải xuống bị thiếu được tham chiếu bởi config.
- `openclaw gateway status --deep --require-rpc` xác nhận Gateway có thể truy cập, gợi ý service/process, đường dẫn config, và sức khỏe RPC.
- Hook hội thoại không đóng gói sẵn (`llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize`, `agent_end`) yêu cầu `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Dùng `--link` để tránh sao chép một thư mục cục bộ (thêm vào `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` không được hỗ trợ cùng `--link` vì cài đặt liên kết tái sử dụng đường dẫn nguồn thay vì sao chép đè lên một mục tiêu cài đặt được quản lý.

Dùng `--pin` trên các bản cài đặt npm để lưu spec chính xác đã resolve (`name@version`) trong chỉ mục Plugin được quản lý trong khi vẫn giữ hành vi mặc định là không ghim.
</Note>

### Chỉ mục Plugin

Metadata cài đặt Plugin là trạng thái do máy quản lý, không phải config người dùng. Các lần cài đặt và cập nhật ghi trạng thái này vào `plugins/installs.json` dưới thư mục trạng thái OpenClaw đang hoạt động. Map `installRecords` cấp cao nhất của nó là nguồn bền vững của metadata cài đặt, bao gồm bản ghi cho manifest Plugin bị hỏng hoặc bị thiếu. Mảng `plugins` là bộ nhớ đệm registry lạnh được suy ra từ manifest. Tệp này bao gồm cảnh báo không chỉnh sửa và được dùng bởi `openclaw plugins update`, uninstall, diagnostics, và registry Plugin lạnh.

Khi OpenClaw thấy các bản ghi `plugins.installs` cũ đã phát hành trong config, các lượt đọc runtime xử lý chúng như đầu vào tương thích mà không ghi lại `openclaw.json`. Các lượt ghi Plugin rõ ràng và `openclaw doctor --fix` di chuyển các bản ghi đó vào chỉ mục Plugin và xóa khóa config khi được phép ghi config; nếu một trong hai lượt ghi thất bại, các bản ghi config được giữ lại để metadata cài đặt không bị mất.

### Gỡ cài đặt

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` xóa bản ghi Plugin khỏi `plugins.entries`, chỉ mục Plugin đã lưu, các mục danh sách allow/deny Plugin, và các mục `plugins.load.paths` đã liên kết khi áp dụng. Trừ khi đặt `--keep-files`, uninstall cũng xóa thư mục cài đặt được quản lý đã theo dõi khi nó nằm bên trong gốc extensions Plugin của OpenClaw. Đối với Plugin active memory, slot memory đặt lại về `memory-core`.

<Note>
`--keep-config` được hỗ trợ như alias không còn khuyến nghị cho `--keep-files`.
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
    Khi bạn truyền một id Plugin, OpenClaw tái sử dụng spec cài đặt đã ghi nhận cho Plugin đó. Điều này nghĩa là các dist-tag đã lưu trước đó như `@beta` và các phiên bản ghim chính xác tiếp tục được dùng trong những lần chạy `update <id>` sau này.

    Đối với cài đặt npm, bạn cũng có thể truyền một spec gói npm rõ ràng với dist-tag hoặc phiên bản chính xác. OpenClaw resolve tên gói đó trở lại bản ghi Plugin đã theo dõi, cập nhật Plugin đã cài đặt đó, và ghi lại spec npm mới cho các lần cập nhật dựa trên id trong tương lai.

    Truyền tên gói npm không kèm phiên bản hoặc tag cũng resolve trở lại bản ghi Plugin đã theo dõi. Dùng cách này khi một Plugin đã được ghim vào phiên bản chính xác và bạn muốn chuyển nó trở lại dòng phát hành mặc định của registry.

  </Accordion>
  <Accordion title="Cập nhật kênh beta">
    `openclaw plugins update` tái sử dụng spec Plugin đã theo dõi trừ khi bạn truyền một spec mới. `openclaw update` còn biết channel cập nhật OpenClaw đang hoạt động: trên channel beta, bản ghi Plugin npm và ClawHub theo dòng mặc định thử `@beta` trước, rồi fallback về spec default/latest đã ghi nhận nếu không có bản phát hành beta cho Plugin. Phiên bản chính xác và tag rõ ràng vẫn được ghim vào bộ chọn đó.

  </Accordion>
  <Accordion title="Kiểm tra phiên bản và drift integrity">
    Trước một bản cập nhật npm trực tiếp, OpenClaw kiểm tra phiên bản gói đã cài đặt so với metadata registry npm. Nếu phiên bản đã cài đặt và danh tính artifact đã ghi nhận đã khớp với mục tiêu đã resolve, bản cập nhật sẽ được bỏ qua mà không tải xuống, cài đặt lại, hoặc ghi lại `openclaw.json`.

    Khi tồn tại hash integrity đã lưu và hash artifact đã fetch thay đổi, OpenClaw xem đó là drift artifact npm. Lệnh tương tác `openclaw plugins update` in các hash kỳ vọng và thực tế rồi yêu cầu xác nhận trước khi tiếp tục. Các helper cập nhật không tương tác sẽ fail closed trừ khi caller cung cấp chính sách tiếp tục rõ ràng.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install khi cập nhật">
    `--dangerously-force-unsafe-install` cũng có sẵn trên `plugins update` như một override break-glass cho false positive của quét dangerous-code tích hợp trong quá trình cập nhật Plugin. Nó vẫn không bỏ qua các chặn chính sách `before_install` của Plugin hoặc chặn scan-failure, và chỉ áp dụng cho cập nhật Plugin, không áp dụng cho cập nhật hook-pack.
  </Accordion>
</AccordionGroup>

### Kiểm tra

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect hiển thị danh tính, trạng thái tải, nguồn, khả năng manifest, cờ chính sách, diagnostics, metadata cài đặt, khả năng gói, và mọi hỗ trợ server MCP hoặc LSP được phát hiện mà mặc định không import runtime Plugin. Thêm `--runtime` để tải module Plugin và bao gồm các hook, tool, command, service, phương thức gateway, và route HTTP đã đăng ký. Kiểm tra runtime báo cáo trực tiếp dependency Plugin bị thiếu; việc cài đặt và sửa chữa nằm trong `openclaw plugins install`, `openclaw plugins update`, và `openclaw doctor --fix`.

Các lệnh CLI do Plugin sở hữu thường được cài đặt dưới dạng nhóm lệnh `openclaw` gốc, nhưng Plugin cũng có thể đăng ký lệnh lồng dưới một parent lõi như `openclaw nodes`. Sau khi `inspect --runtime` hiển thị một lệnh trong `cliCommands`, hãy chạy lệnh đó tại đường dẫn được liệt kê; ví dụ một Plugin đăng ký `demo-git` có thể được xác minh bằng `openclaw demo-git ping`.

Mỗi Plugin được phân loại theo những gì nó thực sự đăng ký tại runtime:

- **plain-capability** — một loại khả năng (ví dụ: Plugin chỉ dành cho nhà cung cấp)
- **hybrid-capability** — nhiều loại khả năng (ví dụ: văn bản + giọng nói + hình ảnh)
- **hook-only** — chỉ có hook, không có khả năng hoặc bề mặt
- **non-capability** — công cụ/lệnh/dịch vụ nhưng không có khả năng

Xem [các dạng Plugin](/vi/plugins/architecture#plugin-shapes) để biết thêm về mô hình khả năng.

<Note>
Cờ `--json` xuất báo cáo có thể đọc bằng máy, phù hợp cho viết script và kiểm tra. `inspect --all` hiển thị một bảng trên toàn bộ đội hình với các cột dạng, loại khả năng, thông báo tương thích, khả năng của bundle và tóm tắt hook. `info` là bí danh của `inspect`.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` báo cáo lỗi tải Plugin, chẩn đoán manifest/discovery và thông báo tương thích. Khi mọi thứ sạch, nó in `No plugin issues detected.`

Nếu một Plugin đã cấu hình có trên đĩa nhưng bị chặn bởi các kiểm tra an toàn đường dẫn của bộ tải, xác thực cấu hình sẽ giữ mục Plugin đó và báo cáo là `present but blocked`. Hãy sửa chẩn đoán Plugin bị chặn đứng trước đó, chẳng hạn như quyền sở hữu đường dẫn hoặc quyền cho phép ghi toàn cầu, thay vì xóa cấu hình `plugins.entries.<id>` hoặc `plugins.allow`.

Đối với các lỗi dạng module như thiếu export `register`/`activate`, hãy chạy lại với `OPENCLAW_PLUGIN_LOAD_DEBUG=1` để bao gồm bản tóm tắt dạng export ngắn gọn trong đầu ra chẩn đoán.

### Registry

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Registry Plugin cục bộ là mô hình đọc nguội được OpenClaw lưu bền vững cho danh tính Plugin đã cài đặt, trạng thái bật, siêu dữ liệu nguồn và quyền sở hữu đóng góp. Khởi động thông thường, tra cứu chủ sở hữu nhà cung cấp, phân loại thiết lập kênh và kiểm kê Plugin có thể đọc nó mà không cần nhập các module runtime của Plugin.

Dùng `plugins registry` để kiểm tra registry đã lưu bền vững có tồn tại, hiện hành hay đã cũ. Dùng `--refresh` để dựng lại nó từ chỉ mục Plugin đã lưu bền vững, chính sách cấu hình và siêu dữ liệu manifest/package. Đây là đường sửa chữa, không phải đường kích hoạt runtime.

`openclaw doctor --fix` cũng sửa sai lệch npm được quản lý ở gần registry: nếu một package `@openclaw/*` mồ côi hoặc đã khôi phục dưới gốc npm Plugin được quản lý che khuất một Plugin đi kèm, doctor sẽ xóa package cũ đó và dựng lại registry để quá trình khởi động xác thực dựa trên manifest đi kèm.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` là công tắc tương thích khẩn cấp đã lỗi thời cho các lỗi đọc registry. Ưu tiên `plugins registry --refresh` hoặc `openclaw doctor --fix`; dự phòng env chỉ dành cho khôi phục khởi động khẩn cấp trong khi quá trình di chuyển đang được triển khai.
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Danh sách Marketplace chấp nhận đường dẫn marketplace cục bộ, đường dẫn `marketplace.json`, dạng viết tắt GitHub như `owner/repo`, URL repo GitHub hoặc URL git. `--json` in nhãn nguồn đã phân giải cùng manifest marketplace đã phân tích cú pháp và các mục Plugin.

## Liên quan

- [Xây dựng Plugin](/vi/plugins/building-plugins)
- [Tham chiếu CLI](/vi/cli)
- [Plugin cộng đồng](/vi/plugins/community)
