---
read_when:
    - Bạn muốn cài đặt hoặc quản lý các Plugin Gateway hoặc các gói tương thích
    - Bạn muốn gỡ lỗi các sự cố tải Plugin
sidebarTitle: Plugins
summary: Tham chiếu CLI cho `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, doctor)
title: Plugin
x-i18n:
    generated_at: "2026-05-12T08:45:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4b51646a103e9e020f6e53cd08aa25e7291fb629741fd41bdab520d80b7416ff
    source_path: cli/plugins.md
    workflow: 16
---

Quản lý Plugin Gateway, gói hook và các bundle tương thích.

<CardGroup cols={2}>
  <Card title="Hệ thống Plugin" href="/vi/tools/plugin">
    Hướng dẫn cho người dùng cuối về cài đặt, bật và khắc phục sự cố Plugin.
  </Card>
  <Card title="Quản lý Plugin" href="/vi/plugins/manage-plugins">
    Ví dụ nhanh cho cài đặt, liệt kê, cập nhật, gỡ cài đặt và phát hành.
  </Card>
  <Card title="Bundle Plugin" href="/vi/plugins/bundles">
    Mô hình tương thích của bundle.
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

Để điều tra thao tác cài đặt, kiểm tra, gỡ cài đặt hoặc làm mới registry chậm, hãy chạy
lệnh với `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`. Trace ghi thời gian từng pha
vào stderr và giữ cho đầu ra JSON có thể phân tích cú pháp. Xem [Gỡ lỗi](/vi/help/debugging#plugin-lifecycle-trace).

<Note>
Ở chế độ Nix (`OPENCLAW_NIX_MODE=1`), các thao tác thay đổi vòng đời Plugin bị tắt. Hãy dùng nguồn Nix cho bản cài đặt này thay vì `plugins install`, `plugins update`, `plugins uninstall`, `plugins enable` hoặc `plugins disable`; với nix-openclaw, hãy dùng [Bắt đầu nhanh](https://github.com/openclaw/nix-openclaw#quick-start) theo hướng ưu tiên agent.
</Note>

<Note>
Các Plugin đi kèm được phát hành cùng OpenClaw. Một số được bật theo mặc định (ví dụ các provider mô hình đi kèm, provider giọng nói đi kèm và Plugin trình duyệt đi kèm); các Plugin khác yêu cầu `plugins enable`.

Plugin OpenClaw native phải phát hành `openclaw.plugin.json` với JSON Schema nội tuyến (`configSchema`, ngay cả khi trống). Các bundle tương thích dùng manifest bundle riêng của chúng.

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

Maintainer kiểm thử cài đặt ở thời điểm thiết lập có thể ghi đè nguồn cài đặt Plugin tự động
bằng các biến môi trường được bảo vệ. Xem
[Ghi đè cài đặt Plugin](/vi/plugins/install-overrides).

<Warning>
Tên package trần mặc định cài đặt từ npm trong giai đoạn chuyển đổi khởi chạy. Dùng `clawhub:<package>` cho ClawHub. Hãy xem cài đặt Plugin như chạy code. Ưu tiên các phiên bản đã pin.
</Warning>

`plugins search` truy vấn ClawHub để tìm các package Plugin có thể cài đặt và in ra
tên package sẵn sàng cài đặt. Lệnh này tìm kiếm các package code-plugin và bundle-plugin,
không phải Skills. Dùng `openclaw skills search` cho Skills trên ClawHub.

<Note>
ClawHub là bề mặt phân phối và khám phá chính cho hầu hết Plugin. Npm
vẫn là phương án dự phòng và đường dẫn cài đặt trực tiếp được hỗ trợ. Các package Plugin
`@openclaw/*` do OpenClaw sở hữu đã được phát hành lại trên npm; xem danh sách hiện tại
trên [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) hoặc
[kho Plugin](/vi/plugins/plugin-inventory). Bản cài đặt ổn định dùng `latest`.
Bản cài đặt và cập nhật kênh beta ưu tiên dist-tag `beta` của npm khi tag đó
có sẵn, rồi quay về `latest`.
</Note>

<AccordionGroup>
  <Accordion title="Include cấu hình và sửa cấu hình không hợp lệ">
    Nếu phần `plugins` của bạn được hỗ trợ bởi một `$include` một tệp, `plugins install/update/enable/disable/uninstall` sẽ ghi xuyên qua tệp được include đó và giữ nguyên `openclaw.json`. Include gốc, mảng include và include có override cùng cấp sẽ fail closed thay vì làm phẳng. Xem [Include cấu hình](/vi/gateway/configuration) để biết các dạng được hỗ trợ.

    Nếu cấu hình không hợp lệ trong lúc cài đặt, `plugins install` thường fail closed và yêu cầu bạn chạy `openclaw doctor --fix` trước. Trong quá trình Gateway khởi động và hot reload, cấu hình Plugin không hợp lệ fail closed như mọi cấu hình không hợp lệ khác; `openclaw doctor --fix` có thể cách ly mục Plugin không hợp lệ. Ngoại lệ duy nhất được tài liệu hóa ở thời điểm cài đặt là một đường dẫn khôi phục hẹp cho Plugin đi kèm khi Plugin đó chọn tham gia rõ ràng vào `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force và cài đặt lại so với cập nhật">
    `--force` tái sử dụng đích cài đặt hiện có và ghi đè một Plugin hoặc gói hook đã được cài đặt ngay tại chỗ. Dùng tùy chọn này khi bạn cố ý cài đặt lại cùng một id từ một đường dẫn cục bộ, archive, package ClawHub hoặc artifact npm mới. Với các nâng cấp thường lệ của một Plugin npm đã được theo dõi, hãy ưu tiên `openclaw plugins update <id-or-npm-spec>`.

    Nếu bạn chạy `plugins install` cho một id Plugin đã được cài đặt, OpenClaw sẽ dừng và chỉ bạn tới `plugins update <id-or-npm-spec>` cho nâng cấp thông thường, hoặc tới `plugins install <package> --force` khi bạn thực sự muốn ghi đè bản cài đặt hiện tại từ một nguồn khác.

  </Accordion>
  <Accordion title="Phạm vi --pin">
    `--pin` chỉ áp dụng cho cài đặt npm. Tùy chọn này không được hỗ trợ với cài đặt `git:`; dùng một git ref rõ ràng như `git:github.com/acme/plugin@v1.2.3` khi bạn muốn một nguồn đã pin. Tùy chọn này không được hỗ trợ với `--marketplace`, vì cài đặt marketplace lưu metadata nguồn marketplace thay vì một spec npm.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` là tùy chọn phá kính khẩn cấp cho các cảnh báo dương tính giả trong trình quét code nguy hiểm tích hợp. Tùy chọn này cho phép tiếp tục cài đặt ngay cả khi trình quét tích hợp báo các finding `critical`, nhưng **không** bỏ qua các chặn chính sách hook `before_install` của Plugin và **không** bỏ qua lỗi quét.

    Cờ CLI này áp dụng cho các luồng cài đặt/cập nhật Plugin. Cài đặt dependency Skills do Gateway hỗ trợ dùng override yêu cầu tương ứng `dangerouslyForceUnsafeInstall`, trong khi `openclaw skills install` vẫn là một luồng tải xuống/cài đặt Skills ClawHub riêng biệt.

    Nếu một Plugin bạn phát hành trên ClawHub bị chặn bởi một lần quét registry, hãy dùng các bước dành cho publisher trong [ClawHub](/vi/clawhub/security).

  </Accordion>
  <Accordion title="Gói hook và spec npm">
    `plugins install` cũng là bề mặt cài đặt cho các gói hook có expose `openclaw.hooks` trong `package.json`. Dùng `openclaw hooks` để xem hook đã lọc và bật từng hook, không phải để cài đặt package.

    Spec npm **chỉ dành cho registry** (tên package + **phiên bản chính xác** hoặc **dist-tag** tùy chọn). Spec Git/URL/file và khoảng semver bị từ chối. Cài đặt dependency chạy cục bộ theo dự án với `--ignore-scripts` để an toàn, ngay cả khi shell của bạn có thiết lập cài đặt npm toàn cục. Các root npm Plugin được quản lý kế thừa `overrides` npm cấp package của OpenClaw, vì vậy các pin bảo mật của host cũng áp dụng cho dependency Plugin được hoist.

    Dùng `npm:<package>` khi bạn muốn làm rõ việc resolution qua npm. Spec package trần cũng cài đặt trực tiếp từ npm trong giai đoạn chuyển đổi khởi chạy.

    Spec trần và `@latest` vẫn ở track ổn định. Các phiên bản sửa lỗi đóng dấu ngày của OpenClaw như `2026.5.3-1` là bản phát hành ổn định cho kiểm tra này. Nếu npm resolve một trong hai dạng đó thành prerelease, OpenClaw sẽ dừng và yêu cầu bạn opt in rõ ràng bằng một tag prerelease như `@beta`/`@rc` hoặc một phiên bản prerelease chính xác như `@1.2.3-beta.4`.

    Nếu một spec cài đặt trần khớp với id Plugin chính thức (ví dụ `diffs`), OpenClaw cài đặt trực tiếp mục catalog. Để cài đặt một package npm có cùng tên, dùng một spec có scope rõ ràng (ví dụ `@scope/diffs`).

  </Accordion>
  <Accordion title="Repository Git">
    Dùng `git:<repo>` để cài đặt trực tiếp từ một repository git. Các dạng được hỗ trợ gồm `git:github.com/owner/repo`, `git:owner/repo`, URL clone đầy đủ `https://`, `ssh://`, `git://`, `file://` và `git@host:owner/repo.git`. Thêm `@<ref>` hoặc `#<ref>` để checkout một branch, tag hoặc commit trước khi cài đặt.

    Cài đặt Git clone vào một thư mục tạm, checkout ref được yêu cầu khi có, rồi dùng trình cài đặt thư mục Plugin thông thường. Điều đó có nghĩa là xác thực manifest, quét code nguy hiểm, công việc cài đặt package-manager và bản ghi cài đặt hoạt động như cài đặt npm. Cài đặt git được ghi nhận bao gồm URL/ref nguồn cùng commit đã resolve để `openclaw plugins update` có thể resolve lại nguồn sau này.

    Sau khi cài đặt từ git, dùng `openclaw plugins inspect <id> --runtime --json` để xác minh các đăng ký runtime như gateway method và lệnh CLI. Nếu Plugin đã đăng ký một root CLI với `api.registerCli`, hãy thực thi lệnh đó trực tiếp qua CLI root của OpenClaw, ví dụ `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Archive">
    Archive được hỗ trợ: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Archive Plugin OpenClaw native phải chứa một `openclaw.plugin.json` hợp lệ tại root Plugin sau khi giải nén; archive chỉ chứa `package.json` bị từ chối trước khi OpenClaw ghi bản ghi cài đặt.

    Dùng `npm-pack:<path.tgz>` khi tệp là tarball npm-pack và bạn muốn
    kiểm thử cùng đường dẫn cài đặt npm-root được quản lý như cài đặt từ registry,
    bao gồm xác minh `package-lock.json`, quét dependency được hoist và
    bản ghi cài đặt npm. Đường dẫn archive thường vẫn cài đặt như archive cục bộ
    dưới root extensions của Plugin.

    Cài đặt marketplace Claude cũng được hỗ trợ.

  </Accordion>
</AccordionGroup>

Cài đặt ClawHub dùng locator rõ ràng `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Spec Plugin an toàn cho npm dạng trần mặc định cài đặt từ npm trong giai đoạn chuyển đổi khởi chạy:

```bash
openclaw plugins install openclaw-codex-app-server
```

Dùng `npm:` để làm rõ resolution chỉ qua npm:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw kiểm tra API Plugin được công bố / mức tương thích Gateway tối thiểu trước khi cài đặt. Khi phiên bản ClawHub đã chọn phát hành một tạo phẩm ClawPack, OpenClaw tải xuống `.tgz` npm-pack có phiên bản, xác minh tiêu đề digest của ClawHub và digest của tạo phẩm, rồi cài đặt qua đường dẫn lưu trữ thông thường. Các phiên bản ClawHub cũ hơn không có siêu dữ liệu ClawPack vẫn cài đặt qua đường dẫn xác minh gói lưu trữ cũ. Các bản cài đặt đã ghi giữ lại siêu dữ liệu nguồn ClawHub, loại tạo phẩm, npm integrity, npm shasum, tên tarball và các dữ kiện digest ClawPack để phục vụ các bản cập nhật sau này.
Các bản cài đặt ClawHub không có phiên bản giữ một đặc tả đã ghi không có phiên bản để `openclaw plugins update` có thể theo dõi các bản phát hành ClawHub mới hơn; các bộ chọn phiên bản hoặc thẻ rõ ràng như `clawhub:pkg@1.2.3` và `clawhub:pkg@beta` vẫn được ghim vào bộ chọn đó.

#### Cú pháp rút gọn marketplace

Dùng cú pháp rút gọn `plugin@marketplace` khi tên marketplace tồn tại trong bộ nhớ đệm registry cục bộ của Claude tại `~/.claude/plugins/known_marketplaces.json`:

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
    - thư mục gốc marketplace cục bộ hoặc đường dẫn `marketplace.json`
    - cú pháp rút gọn repo GitHub như `owner/repo`
    - URL repo GitHub như `https://github.com/owner/repo`
    - URL git

  </Tab>
  <Tab title="Quy tắc marketplace từ xa">
    Với marketplace từ xa được tải từ GitHub hoặc git, các mục Plugin phải nằm bên trong repo marketplace đã clone. OpenClaw chấp nhận các nguồn đường dẫn tương đối từ repo đó và từ chối HTTP(S), đường dẫn tuyệt đối, git, GitHub và các nguồn Plugin không phải đường dẫn khác từ manifest từ xa.
  </Tab>
</Tabs>

Với đường dẫn cục bộ và tệp lưu trữ, OpenClaw tự động phát hiện:

- Plugin OpenClaw gốc (`openclaw.plugin.json`)
- gói tương thích Codex (`.codex-plugin/plugin.json`)
- gói tương thích Claude (`.claude-plugin/plugin.json` hoặc bố cục thành phần Claude mặc định)
- gói tương thích Cursor (`.cursor-plugin/plugin.json`)

<Note>
Các gói tương thích cài đặt vào thư mục gốc Plugin thông thường và tham gia cùng luồng list/info/enable/disable. Hiện tại, bundle skills, command-skills của Claude, mặc định `settings.json` của Claude, mặc định `.lsp.json` / `lspServers` được khai báo trong manifest của Claude, command-skills của Cursor và các thư mục hook Codex tương thích được hỗ trợ; các khả năng gói khác được phát hiện sẽ hiển thị trong chẩn đoán/info nhưng chưa được nối vào thực thi runtime.
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
  Chuyển từ chế độ xem bảng sang các dòng chi tiết theo từng Plugin với siêu dữ liệu source/origin/version/activation.
</ParamField>
<ParamField path="--json" type="boolean">
  Kho kiểm kê máy đọc được cùng chẩn đoán registry và trạng thái cài đặt phụ thuộc gói.
</ParamField>

<Note>
`plugins list` đọc registry Plugin cục bộ đã lưu trước, với fallback chỉ từ manifest khi registry bị thiếu hoặc không hợp lệ. Lệnh này hữu ích để kiểm tra một Plugin đã được cài đặt, đã bật và hiển thị với kế hoạch khởi động nguội hay chưa, nhưng không phải là probe runtime trực tiếp của một tiến trình Gateway đang chạy. Sau khi thay đổi mã Plugin, trạng thái bật, chính sách hook hoặc `plugins.load.paths`, hãy khởi động lại Gateway phục vụ kênh trước khi kỳ vọng mã `register(api)` mới hoặc hook chạy. Với triển khai từ xa/container, hãy xác minh bạn đang khởi động lại đúng tiến trình con `openclaw gateway run`, không chỉ một tiến trình wrapper.

`plugins list --json` bao gồm `dependencyStatus` của từng Plugin từ `dependencies` và `optionalDependencies` trong `package.json`. OpenClaw kiểm tra các tên gói đó có hiện diện dọc theo đường dẫn tra cứu `node_modules` Node thông thường của Plugin hay không; nó không import mã runtime của Plugin, không chạy trình quản lý gói và không sửa các phụ thuộc bị thiếu.
</Note>

`plugins search` là một tra cứu danh mục ClawHub từ xa. Nó không kiểm tra trạng thái cục bộ, không thay đổi config, không cài đặt gói và không tải mã runtime Plugin. Kết quả tìm kiếm bao gồm tên gói ClawHub, family, channel, version, tóm tắt và gợi ý cài đặt như `openclaw plugins install clawhub:<package>`.

Với công việc trên Plugin đi kèm bên trong ảnh Docker đã đóng gói, bind-mount thư mục nguồn Plugin đè lên đường dẫn nguồn đã đóng gói tương ứng, chẳng hạn `/app/extensions/synology-chat`. OpenClaw sẽ phát hiện overlay nguồn đã mount đó trước `/app/dist/extensions/synology-chat`; một thư mục nguồn được sao chép đơn thuần vẫn không hoạt động, để các bản cài đặt đã đóng gói thông thường vẫn dùng dist đã biên dịch.

Để gỡ lỗi hook runtime:

- `openclaw plugins inspect <id> --runtime --json` hiển thị hook đã đăng ký và chẩn đoán từ một lượt kiểm tra có tải module. Kiểm tra runtime không bao giờ cài đặt phụ thuộc; dùng `openclaw doctor --fix` để dọn trạng thái phụ thuộc cũ hoặc khôi phục các Plugin có thể tải xuống bị thiếu đang được config tham chiếu.
- `openclaw gateway status --deep --require-rpc` xác nhận Gateway có thể truy cập, gợi ý service/process, đường dẫn config và sức khỏe RPC.
- Các hook hội thoại không đi kèm (`llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize`, `agent_end`) yêu cầu `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Dùng `--link` để tránh sao chép một thư mục cục bộ (thêm vào `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` không được hỗ trợ cùng `--link` vì các bản cài đặt liên kết tái sử dụng đường dẫn nguồn thay vì sao chép đè lên mục tiêu cài đặt được quản lý.

Dùng `--pin` trên các bản cài đặt npm để lưu đặc tả chính xác đã phân giải (`name@version`) trong chỉ mục Plugin được quản lý, đồng thời giữ hành vi mặc định là không ghim.
</Note>

### Chỉ mục Plugin

Siêu dữ liệu cài đặt Plugin là trạng thái do máy quản lý, không phải config người dùng. Các bản cài đặt và cập nhật ghi nó vào `plugins/installs.json` trong thư mục trạng thái OpenClaw đang hoạt động. Map `installRecords` cấp cao nhất của nó là nguồn bền vững cho siêu dữ liệu cài đặt, bao gồm bản ghi cho các manifest Plugin bị hỏng hoặc bị thiếu. Mảng `plugins` là bộ nhớ đệm registry nguội được dẫn xuất từ manifest. Tệp bao gồm cảnh báo không chỉnh sửa và được dùng bởi `openclaw plugins update`, uninstall, chẩn đoán và registry Plugin nguội.

Khi OpenClaw thấy các bản ghi `plugins.installs` cũ đã phát hành trong config, các lượt đọc runtime xử lý chúng như đầu vào tương thích mà không ghi lại `openclaw.json`. Các thao tác ghi Plugin rõ ràng và `openclaw doctor --fix` di chuyển các bản ghi đó vào chỉ mục Plugin và xóa khóa config khi được phép ghi config; nếu một trong hai thao tác ghi thất bại, các bản ghi config được giữ lại để siêu dữ liệu cài đặt không bị mất.

### Gỡ cài đặt

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` xóa bản ghi Plugin khỏi `plugins.entries`, chỉ mục Plugin đã lưu, các mục danh sách allow/deny của Plugin và các mục `plugins.load.paths` đã liên kết khi áp dụng. Trừ khi đặt `--keep-files`, uninstall cũng xóa thư mục cài đặt được quản lý đang được theo dõi khi nó nằm bên trong thư mục gốc phần mở rộng Plugin của OpenClaw. Với Plugin active memory, slot bộ nhớ đặt lại về `memory-core`.

<Note>
`--keep-config` được hỗ trợ như alias đã lỗi thời của `--keep-files`.
</Note>

### Cập nhật

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

Các bản cập nhật áp dụng cho những bản cài đặt Plugin được theo dõi trong chỉ mục Plugin được quản lý và các bản cài đặt hook-pack được theo dõi trong `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="Phân giải id Plugin so với đặc tả npm">
    Khi bạn truyền một id Plugin, OpenClaw tái sử dụng đặc tả cài đặt đã ghi cho Plugin đó. Điều đó có nghĩa là các dist-tag đã lưu trước đó như `@beta` và các phiên bản được ghim chính xác tiếp tục được dùng trong các lần chạy `update <id>` sau này.

    Với bản cài đặt npm, bạn cũng có thể truyền một đặc tả gói npm rõ ràng kèm dist-tag hoặc phiên bản chính xác. OpenClaw phân giải tên gói đó trở lại bản ghi Plugin được theo dõi, cập nhật Plugin đã cài đó và ghi đặc tả npm mới cho các lần cập nhật dựa trên id trong tương lai.

    Truyền tên gói npm không kèm phiên bản hoặc thẻ cũng phân giải trở lại bản ghi Plugin được theo dõi. Dùng cách này khi một Plugin đã được ghim vào phiên bản chính xác và bạn muốn chuyển nó trở lại dòng phát hành mặc định của registry.

  </Accordion>
  <Accordion title="Cập nhật kênh beta">
    `openclaw plugins update` tái sử dụng đặc tả Plugin được theo dõi trừ khi bạn truyền một đặc tả mới. `openclaw update` còn biết kênh cập nhật OpenClaw đang hoạt động: trên kênh beta, các bản ghi Plugin npm và ClawHub ở dòng mặc định sẽ thử `@beta` trước, rồi fallback về đặc tả default/latest đã ghi nếu không có bản phát hành beta của Plugin. Fallback đó được báo cáo dưới dạng cảnh báo và không làm hỏng cập nhật core. Phiên bản chính xác và thẻ rõ ràng vẫn được ghim vào bộ chọn đó.

  </Accordion>
  <Accordion title="Kiểm tra phiên bản và lệch integrity">
    Trước một bản cập nhật npm trực tiếp, OpenClaw kiểm tra phiên bản gói đã cài so với siêu dữ liệu registry npm. Nếu phiên bản đã cài và danh tính tạo phẩm đã ghi đã khớp với mục tiêu được phân giải, bản cập nhật sẽ bị bỏ qua mà không tải xuống, không cài đặt lại và không ghi lại `openclaw.json`.

    Khi tồn tại hash integrity đã lưu và hash tạo phẩm tải về thay đổi, OpenClaw xử lý đó là lệch tạo phẩm npm. Lệnh tương tác `openclaw plugins update` in ra hash kỳ vọng và hash thực tế, rồi yêu cầu xác nhận trước khi tiếp tục. Các trình trợ giúp cập nhật không tương tác sẽ fail closed trừ khi bên gọi cung cấp một chính sách tiếp tục rõ ràng.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install khi cập nhật">
    `--dangerously-force-unsafe-install` cũng có sẵn trên `plugins update` như một override khẩn cấp cho các false positive của quét dangerous-code tích hợp trong quá trình cập nhật Plugin. Nó vẫn không bỏ qua các chặn chính sách `before_install` của Plugin hoặc chặn do lỗi quét, và chỉ áp dụng cho cập nhật Plugin, không áp dụng cho cập nhật hook-pack.
  </Accordion>
</AccordionGroup>

### Kiểm tra

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect hiển thị danh tính, trạng thái tải, nguồn, khả năng manifest, cờ chính sách, chẩn đoán, siêu dữ liệu cài đặt, khả năng gói và mọi hỗ trợ MCP hoặc LSP server được phát hiện mà mặc định không import runtime Plugin. Thêm `--runtime` để tải module Plugin và bao gồm hook, tool, command, service, phương thức Gateway và route HTTP đã đăng ký. Kiểm tra runtime báo cáo trực tiếp các phụ thuộc Plugin bị thiếu; cài đặt và sửa chữa vẫn nằm trong `openclaw plugins install`, `openclaw plugins update` và `openclaw doctor --fix`.

Các lệnh CLI do Plugin sở hữu thường được cài đặt làm nhóm lệnh `openclaw` cấp gốc, nhưng Plugin cũng có thể đăng ký lệnh lồng dưới một parent core như `openclaw nodes`. Sau khi `inspect --runtime` hiển thị một lệnh trong `cliCommands`, hãy chạy lệnh đó tại đường dẫn được liệt kê; ví dụ, một Plugin đăng ký `demo-git` có thể được xác minh bằng `openclaw demo-git ping`.

Mỗi Plugin được phân loại theo những gì nó thực sự đăng ký tại runtime:

- **plain-capability** — một loại capability (ví dụ: Plugin chỉ dành cho provider)
- **hybrid-capability** — nhiều loại capability (ví dụ: văn bản + giọng nói + hình ảnh)
- **hook-only** — chỉ có hook, không có capability hoặc surface
- **non-capability** — công cụ/lệnh/dịch vụ nhưng không có capability

Xem [Hình dạng Plugin](/vi/plugins/architecture#plugin-shapes) để biết thêm về mô hình capability.

<Note>
Cờ `--json` xuất báo cáo có thể đọc bằng máy, phù hợp cho scripting và kiểm toán. `inspect --all` hiển thị bảng toàn fleet với các cột hình dạng, loại capability, thông báo tương thích, capability của bundle và tóm tắt hook. `info` là bí danh của `inspect`.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` báo cáo lỗi tải Plugin, chẩn đoán manifest/discovery và thông báo tương thích. Khi mọi thứ sạch, lệnh in ra `No plugin issues detected.`

Nếu một Plugin đã cấu hình có mặt trên đĩa nhưng bị chặn bởi các kiểm tra an toàn đường dẫn của loader, xác thực cấu hình sẽ giữ mục Plugin và báo cáo là `present but blocked`. Sửa chẩn đoán Plugin bị chặn trước đó, chẳng hạn như quyền sở hữu đường dẫn hoặc quyền ghi cho mọi người, thay vì xóa cấu hình `plugins.entries.<id>` hoặc `plugins.allow`.

Đối với các lỗi hình dạng module như thiếu export `register`/`activate`, chạy lại với `OPENCLAW_PLUGIN_LOAD_DEBUG=1` để đưa tóm tắt hình dạng export gọn vào đầu ra chẩn đoán.

### Registry

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Registry Plugin cục bộ là mô hình đọc lạnh được lưu bền của OpenClaw cho danh tính Plugin đã cài đặt, trạng thái bật, siêu dữ liệu nguồn và quyền sở hữu đóng góp. Khởi động bình thường, tra cứu owner provider, phân loại thiết lập kênh và kiểm kê Plugin có thể đọc registry này mà không cần import các module runtime của Plugin.

Dùng `plugins registry` để kiểm tra registry đã lưu bền có tồn tại, hiện hành hay đã cũ hay không. Dùng `--refresh` để xây dựng lại registry từ chỉ mục Plugin đã lưu bền, chính sách cấu hình và siêu dữ liệu manifest/package. Đây là đường dẫn sửa chữa, không phải đường dẫn kích hoạt runtime.

`openclaw doctor --fix` cũng sửa lỗi trôi dạt npm được quản lý liền kề registry: nếu một package `@openclaw/*` mồ côi hoặc được khôi phục dưới root npm Plugin được quản lý che khuất một Plugin đi kèm, doctor sẽ xóa package cũ đó và xây dựng lại registry để khởi động xác thực theo manifest đi kèm. Doctor cũng liên kết lại package `openclaw` của host vào các Plugin npm được quản lý khai báo `peerDependencies.openclaw`, để các import runtime cục bộ của package như `openclaw/plugin-sdk/*` phân giải được sau các bản cập nhật hoặc sửa chữa npm.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` là công tắc tương thích break-glass đã bị ngừng khuyến nghị cho lỗi đọc registry. Ưu tiên `plugins registry --refresh` hoặc `openclaw doctor --fix`; fallback env chỉ dành cho khôi phục khởi động khẩn cấp trong khi migration được triển khai.
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Danh sách Marketplace chấp nhận đường dẫn marketplace cục bộ, đường dẫn `marketplace.json`, dạng viết tắt GitHub như `owner/repo`, URL repo GitHub hoặc URL git. `--json` in nhãn nguồn đã phân giải cùng manifest marketplace đã phân tích và các mục Plugin.

## Liên quan

- [Xây dựng Plugin](/vi/plugins/building-plugins)
- [Tham chiếu CLI](/vi/cli)
- [ClawHub](/vi/clawhub)
