---
read_when:
    - Bạn muốn cài đặt hoặc quản lý các Plugin Gateway hoặc các gói tương thích
    - Bạn muốn gỡ lỗi các sự cố tải Plugin
sidebarTitle: Plugins
summary: Tham chiếu CLI cho `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, doctor)
title: Plugin
x-i18n:
    generated_at: "2026-05-10T19:28:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: c6afa3ff12b3672d321d16c831672340ccde70b153671f2c328f578b5c66348b
    source_path: cli/plugins.md
    workflow: 16
---

Quản lý các Plugin Gateway, gói hook và gói tương thích.

<CardGroup cols={2}>
  <Card title="Hệ thống Plugin" href="/vi/tools/plugin">
    Hướng dẫn dành cho người dùng cuối về cài đặt, bật và khắc phục sự cố Plugin.
  </Card>
  <Card title="Quản lý Plugin" href="/vi/plugins/manage-plugins">
    Ví dụ nhanh để cài đặt, liệt kê, cập nhật, gỡ cài đặt và xuất bản.
  </Card>
  <Card title="Gói Plugin" href="/vi/plugins/bundles">
    Mô hình tương thích của gói.
  </Card>
  <Card title="Manifest Plugin" href="/vi/plugins/manifest">
    Các trường manifest và schema cấu hình.
  </Card>
  <Card title="Bảo mật" href="/vi/gateway/security">
    Tăng cường bảo mật cho cài đặt Plugin.
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
lệnh với `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`. Trace ghi thời gian từng giai đoạn
vào stderr và giữ cho đầu ra JSON có thể phân tích được. Xem [Gỡ lỗi](/vi/help/debugging#plugin-lifecycle-trace).

<Note>
Ở chế độ Nix (`OPENCLAW_NIX_MODE=1`), các thao tác thay đổi vòng đời Plugin bị tắt. Thay vào đó hãy dùng nguồn Nix cho lần cài đặt này thay vì `plugins install`, `plugins update`, `plugins uninstall`, `plugins enable`, hoặc `plugins disable`; với nix-openclaw, hãy dùng [Bắt đầu nhanh](https://github.com/openclaw/nix-openclaw#quick-start) theo hướng agent-first.
</Note>

<Note>
Các Plugin đi kèm được phát hành cùng OpenClaw. Một số được bật theo mặc định (ví dụ như provider mô hình đi kèm, provider giọng nói đi kèm và Plugin trình duyệt đi kèm); các Plugin khác yêu cầu `plugins enable`.

Plugin OpenClaw gốc phải phát hành `openclaw.plugin.json` với JSON Schema nội tuyến (`configSchema`, ngay cả khi trống). Các gói tương thích dùng manifest gói riêng của chúng thay vào đó.

`plugins list` hiển thị `Format: openclaw` hoặc `Format: bundle`. Đầu ra danh sách/thông tin chi tiết cũng hiển thị subtype của gói (`codex`, `claude`, hoặc `cursor`) cùng các capability gói được phát hiện.
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

Các maintainer đang kiểm thử cài đặt ở thời điểm thiết lập có thể ghi đè nguồn cài đặt Plugin tự động
bằng các biến môi trường được bảo vệ. Xem
[Ghi đè cài đặt Plugin](/vi/plugins/install-overrides).

<Warning>
Tên package trần cài đặt từ npm theo mặc định trong giai đoạn chuyển đổi khởi chạy. Dùng `clawhub:<package>` cho ClawHub. Hãy coi việc cài đặt Plugin như chạy mã. Ưu tiên các phiên bản được ghim.
</Warning>

`plugins search` truy vấn ClawHub để tìm các package Plugin có thể cài đặt và in ra
tên package sẵn sàng cài đặt. Lệnh này tìm kiếm package code-plugin và bundle-plugin,
không phải Skills. Dùng `openclaw skills search` cho Skills trên ClawHub.

<Note>
ClawHub là bề mặt phân phối và khám phá chính cho hầu hết Plugin. Npm
vẫn là đường dẫn dự phòng được hỗ trợ và đường dẫn cài đặt trực tiếp. Các package Plugin
`@openclaw/*` do OpenClaw sở hữu đã được xuất bản lại trên npm; xem danh sách hiện tại
trên [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) hoặc
[kho Plugin](/vi/plugins/plugin-inventory). Cài đặt ổn định dùng `latest`.
Cài đặt và cập nhật kênh beta ưu tiên dist-tag `beta` của npm khi tag đó
có sẵn, sau đó mới quay về `latest`.
</Note>

<AccordionGroup>
  <Accordion title="Include cấu hình và sửa cấu hình không hợp lệ">
    Nếu mục `plugins` của bạn được hỗ trợ bởi một `$include` một tệp, `plugins install/update/enable/disable/uninstall` ghi xuyên qua tệp được include đó và giữ nguyên `openclaw.json`. Include gốc, mảng include và include có override ngang hàng sẽ fail closed thay vì làm phẳng. Xem [Include cấu hình](/vi/gateway/configuration) để biết các dạng được hỗ trợ.

    Nếu cấu hình không hợp lệ trong khi cài đặt, `plugins install` thường fail closed và yêu cầu bạn chạy `openclaw doctor --fix` trước. Trong quá trình khởi động Gateway và hot reload, cấu hình Plugin không hợp lệ fail closed như mọi cấu hình không hợp lệ khác; `openclaw doctor --fix` có thể cách ly mục Plugin không hợp lệ. Ngoại lệ tại thời điểm cài đặt duy nhất được ghi nhận là một đường dẫn khôi phục hẹp cho Plugin đi kèm, dành cho các Plugin chủ động chọn tham gia `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force và cài đặt lại so với cập nhật">
    `--force` tái sử dụng đích cài đặt hiện có và ghi đè một Plugin hoặc gói hook đã cài đặt ngay tại chỗ. Dùng tùy chọn này khi bạn cố ý cài đặt lại cùng một id từ một đường dẫn cục bộ, archive, package ClawHub hoặc artifact npm mới. Với các nâng cấp thường lệ cho một Plugin npm đã được theo dõi, ưu tiên `openclaw plugins update <id-or-npm-spec>`.

    Nếu bạn chạy `plugins install` cho một id Plugin đã được cài đặt, OpenClaw sẽ dừng và trỏ bạn đến `plugins update <id-or-npm-spec>` để nâng cấp thông thường, hoặc đến `plugins install <package> --force` khi bạn thực sự muốn ghi đè cài đặt hiện tại từ một nguồn khác.

  </Accordion>
  <Accordion title="Phạm vi --pin">
    `--pin` chỉ áp dụng cho cài đặt npm. Tùy chọn này không được hỗ trợ với cài đặt `git:`; hãy dùng git ref rõ ràng như `git:github.com/acme/plugin@v1.2.3` khi bạn muốn một nguồn được ghim. Tùy chọn này không được hỗ trợ với `--marketplace`, vì cài đặt marketplace lưu metadata nguồn marketplace thay vì một spec npm.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` là tùy chọn phá kính khẩn cấp cho false positive trong bộ quét mã nguy hiểm tích hợp. Tùy chọn này cho phép cài đặt tiếp tục ngay cả khi bộ quét tích hợp báo cáo phát hiện `critical`, nhưng **không** bỏ qua các chặn chính sách hook `before_install` của Plugin và **không** bỏ qua lỗi quét.

    Cờ CLI này áp dụng cho luồng cài đặt/cập nhật Plugin. Cài đặt dependency của Skills do Gateway hỗ trợ dùng override yêu cầu tương ứng `dangerouslyForceUnsafeInstall`, trong khi `openclaw skills install` vẫn là một luồng tải xuống/cài đặt Skill ClawHub riêng biệt.

    Nếu một Plugin bạn đã xuất bản trên ClawHub bị chặn bởi quá trình quét registry, hãy dùng các bước dành cho publisher trong [ClawHub](/vi/clawhub/security).

  </Accordion>
  <Accordion title="Gói hook và spec npm">
    `plugins install` cũng là bề mặt cài đặt cho các gói hook có expose `openclaw.hooks` trong `package.json`. Dùng `openclaw hooks` để xem hook đã lọc và bật theo từng hook, không phải để cài đặt package.

    Spec npm là **chỉ registry** (tên package + **phiên bản chính xác** hoặc **dist-tag** tùy chọn). Spec Git/URL/file và dải semver bị từ chối. Cài đặt dependency chạy cục bộ theo project với `--ignore-scripts` để an toàn, ngay cả khi shell của bạn có thiết lập cài đặt npm toàn cục. Root npm Plugin được quản lý kế thừa `overrides` npm cấp package của OpenClaw, vì vậy các pin bảo mật của host cũng áp dụng cho dependency Plugin được hoist.

    Dùng `npm:<package>` khi bạn muốn làm rõ việc phân giải npm. Spec package trần cũng cài đặt trực tiếp từ npm trong giai đoạn chuyển đổi khởi chạy.

    Spec trần và `@latest` ở lại track ổn định. Các phiên bản sửa lỗi có dấu ngày của OpenClaw như `2026.5.3-1` là bản phát hành ổn định cho lần kiểm tra này. Nếu npm phân giải một trong các spec đó thành prerelease, OpenClaw sẽ dừng và yêu cầu bạn chủ động chọn tham gia bằng một tag prerelease như `@beta`/`@rc` hoặc một phiên bản prerelease chính xác như `@1.2.3-beta.4`.

    Nếu một spec cài đặt trần khớp với id Plugin chính thức (ví dụ `diffs`), OpenClaw cài đặt trực tiếp mục catalog. Để cài đặt một package npm có cùng tên, hãy dùng một spec có scope rõ ràng (ví dụ `@scope/diffs`).

  </Accordion>
  <Accordion title="Kho lưu trữ Git">
    Dùng `git:<repo>` để cài đặt trực tiếp từ một kho lưu trữ git. Các dạng được hỗ trợ gồm `git:github.com/owner/repo`, `git:owner/repo`, URL clone đầy đủ `https://`, `ssh://`, `git://`, `file://`, và `git@host:owner/repo.git`. Thêm `@<ref>` hoặc `#<ref>` để checkout một branch, tag hoặc commit trước khi cài đặt.

    Cài đặt Git clone vào một thư mục tạm thời, checkout ref được yêu cầu khi có, rồi dùng trình cài đặt thư mục Plugin thông thường. Điều đó có nghĩa là xác thực manifest, quét mã nguy hiểm, công việc cài đặt bằng package manager và bản ghi cài đặt hoạt động như cài đặt npm. Cài đặt git đã ghi nhận bao gồm URL/ref nguồn cùng commit đã phân giải để `openclaw plugins update` có thể phân giải lại nguồn sau này.

    Sau khi cài đặt từ git, dùng `openclaw plugins inspect <id> --runtime --json` để xác minh các đăng ký runtime như phương thức gateway và lệnh CLI. Nếu Plugin đã đăng ký một root CLI bằng `api.registerCli`, hãy thực thi lệnh đó trực tiếp thông qua CLI gốc của OpenClaw, ví dụ `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Archive">
    Archive được hỗ trợ: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Archive Plugin OpenClaw gốc phải chứa `openclaw.plugin.json` hợp lệ tại root Plugin sau khi giải nén; archive chỉ chứa `package.json` bị từ chối trước khi OpenClaw ghi bản ghi cài đặt.

    Dùng `npm-pack:<path.tgz>` khi tệp là tarball npm-pack và bạn muốn
    kiểm thử cùng đường dẫn cài đặt npm-root được quản lý mà cài đặt registry sử dụng,
    bao gồm xác minh `package-lock.json`, quét dependency được hoist và
    bản ghi cài đặt npm. Đường dẫn archive thường vẫn cài đặt như archive cục bộ
    dưới root extensions của Plugin.

    Cài đặt marketplace Claude cũng được hỗ trợ.

  </Accordion>
</AccordionGroup>

Cài đặt ClawHub dùng locator `clawhub:<package>` rõ ràng:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Spec Plugin an toàn cho npm dạng trần cài đặt từ npm theo mặc định trong giai đoạn chuyển đổi khởi chạy:

```bash
openclaw plugins install openclaw-codex-app-server
```

Dùng `npm:` để làm rõ việc phân giải chỉ qua npm:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw kiểm tra API plugin được công bố / mức tương thích Gateway tối thiểu trước khi cài đặt. Khi phiên bản ClawHub được chọn phát hành một tạo tác ClawPack, OpenClaw tải xuống `.tgz` npm-pack có phiên bản, xác minh header digest của ClawHub và digest của tạo tác, rồi cài đặt thông qua đường dẫn lưu trữ thông thường. Các phiên bản ClawHub cũ hơn không có siêu dữ liệu ClawPack vẫn cài đặt thông qua đường dẫn xác minh kho lưu trữ gói cũ. Các bản cài đặt được ghi lại giữ siêu dữ liệu nguồn ClawHub, loại tạo tác, npm integrity, npm shasum, tên tarball và các thông tin digest ClawPack để dùng cho các bản cập nhật sau này.
Các bản cài đặt ClawHub không có phiên bản giữ một đặc tả được ghi lại không có phiên bản để `openclaw plugins update` có thể theo các bản phát hành ClawHub mới hơn; các bộ chọn phiên bản hoặc thẻ rõ ràng như `clawhub:pkg@1.2.3` và `clawhub:pkg@beta` vẫn được ghim vào bộ chọn đó.

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
  <Tab title="Marketplace sources">
    - tên marketplace đã biết của Claude từ `~/.claude/plugins/known_marketplaces.json`
    - gốc marketplace cục bộ hoặc đường dẫn `marketplace.json`
    - cú pháp rút gọn repo GitHub như `owner/repo`
    - URL repo GitHub như `https://github.com/owner/repo`
    - URL git

  </Tab>
  <Tab title="Remote marketplace rules">
    Với các marketplace từ xa được tải từ GitHub hoặc git, các mục plugin phải nằm bên trong repo marketplace đã clone. OpenClaw chấp nhận các nguồn đường dẫn tương đối từ repo đó và từ chối HTTP(S), đường dẫn tuyệt đối, git, GitHub và các nguồn plugin không phải đường dẫn khác từ manifest từ xa.
  </Tab>
</Tabs>

Với đường dẫn cục bộ và kho lưu trữ, OpenClaw tự động phát hiện:

- plugin OpenClaw gốc (`openclaw.plugin.json`)
- bundle tương thích với Codex (`.codex-plugin/plugin.json`)
- bundle tương thích với Claude (`.claude-plugin/plugin.json` hoặc bố cục thành phần Claude mặc định)
- bundle tương thích với Cursor (`.cursor-plugin/plugin.json`)

<Note>
Các bundle tương thích cài đặt vào gốc plugin thông thường và tham gia cùng luồng list/info/enable/disable. Hiện tại, bundle skills, command-skills của Claude, mặc định `settings.json` của Claude, mặc định `.lsp.json` / `lspServers` do manifest khai báo của Claude, command-skills của Cursor và các thư mục hook Codex tương thích được hỗ trợ; các khả năng bundle khác được phát hiện sẽ hiển thị trong chẩn đoán/thông tin nhưng chưa được nối vào thực thi runtime.
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
  Chuyển từ chế độ xem bảng sang các dòng chi tiết theo từng plugin với siêu dữ liệu nguồn/xuất xứ/phiên bản/kích hoạt.
</ParamField>
<ParamField path="--json" type="boolean">
  Inventory đọc được bằng máy cùng chẩn đoán registry và trạng thái cài đặt phụ thuộc gói.
</ParamField>

<Note>
`plugins list` đọc registry plugin cục bộ đã lưu trước, với fallback chỉ dẫn xuất từ manifest khi registry bị thiếu hoặc không hợp lệ. Lệnh này hữu ích để kiểm tra xem một plugin đã được cài đặt, bật và hiển thị cho kế hoạch khởi động lạnh hay chưa, nhưng không phải là phép dò runtime trực tiếp của một tiến trình Gateway đang chạy. Sau khi thay đổi mã plugin, trạng thái bật, chính sách hook hoặc `plugins.load.paths`, hãy khởi động lại Gateway phục vụ kênh trước khi mong đợi mã `register(api)` hoặc hook mới chạy. Với triển khai từ xa/container, hãy xác minh bạn đang khởi động lại đúng tiến trình con `openclaw gateway run`, không chỉ một tiến trình wrapper.

`plugins list --json` bao gồm `dependencyStatus` của từng plugin từ `package.json`
`dependencies` và `optionalDependencies`. OpenClaw kiểm tra xem các tên gói đó
có hiện diện dọc theo đường dẫn tra cứu `node_modules` Node thông thường của plugin hay không; OpenClaw
không import mã runtime plugin, chạy trình quản lý gói hoặc sửa các
phụ thuộc bị thiếu.
</Note>

`plugins search` là tra cứu catalog ClawHub từ xa. Lệnh này không kiểm tra trạng thái
cục bộ, thay đổi config, cài đặt gói hoặc tải mã runtime plugin. Kết quả tìm kiếm
bao gồm tên gói ClawHub, family, channel, phiên bản, tóm tắt và
gợi ý cài đặt như `openclaw plugins install clawhub:<package>`.

Với công việc plugin đóng gói sẵn bên trong một ảnh Docker đã đóng gói, hãy bind-mount thư mục nguồn
plugin lên đường dẫn nguồn đã đóng gói tương ứng, chẳng hạn
`/app/extensions/synology-chat`. OpenClaw sẽ phát hiện lớp phủ nguồn đã mount đó
trước `/app/dist/extensions/synology-chat`; một thư mục nguồn được sao chép đơn thuần
vẫn không hoạt động để các bản cài đặt đóng gói thông thường tiếp tục dùng dist đã biên dịch.

Để gỡ lỗi hook runtime:

- `openclaw plugins inspect <id> --runtime --json` hiển thị các hook đã đăng ký và chẩn đoán từ một lượt kiểm tra có tải module. Kiểm tra runtime không bao giờ cài đặt phụ thuộc; dùng `openclaw doctor --fix` để dọn trạng thái phụ thuộc cũ hoặc khôi phục các plugin có thể tải xuống bị thiếu nhưng được tham chiếu bởi config.
- `openclaw gateway status --deep --require-rpc` xác nhận Gateway có thể truy cập, gợi ý dịch vụ/tiến trình, đường dẫn config và sức khỏe RPC.
- Các hook hội thoại không đóng gói sẵn (`llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize`, `agent_end`) yêu cầu `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Dùng `--link` để tránh sao chép một thư mục cục bộ (thêm vào `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` không được hỗ trợ với `--link` vì các bản cài đặt liên kết tái sử dụng đường dẫn nguồn thay vì sao chép đè lên một đích cài đặt được quản lý.

Dùng `--pin` trên các bản cài đặt npm để lưu đặc tả chính xác đã phân giải (`name@version`) trong chỉ mục plugin được quản lý trong khi vẫn giữ hành vi mặc định là không ghim.
</Note>

### Chỉ mục Plugin

Siêu dữ liệu cài đặt Plugin là trạng thái do máy quản lý, không phải config người dùng. Các lần cài đặt và cập nhật ghi siêu dữ liệu đó vào `plugins/installs.json` bên dưới thư mục trạng thái OpenClaw đang hoạt động. Map `installRecords` cấp cao nhất là nguồn bền vững của siêu dữ liệu cài đặt, bao gồm các bản ghi cho manifest plugin bị hỏng hoặc bị thiếu. Mảng `plugins` là bộ nhớ đệm registry lạnh dẫn xuất từ manifest. Tệp bao gồm cảnh báo không chỉnh sửa và được dùng bởi `openclaw plugins update`, uninstall, chẩn đoán và registry plugin lạnh.

Khi OpenClaw thấy các bản ghi `plugins.installs` cũ được phát hành trong config, các lượt đọc runtime xử lý chúng như đầu vào tương thích mà không ghi lại `openclaw.json`. Các lượt ghi plugin rõ ràng và `openclaw doctor --fix` chuyển các bản ghi đó vào chỉ mục plugin và xóa khóa config khi được phép ghi config; nếu một trong hai lượt ghi thất bại, các bản ghi config được giữ lại để siêu dữ liệu cài đặt không bị mất.

### Gỡ cài đặt

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` xóa các bản ghi plugin khỏi `plugins.entries`, chỉ mục plugin đã lưu, các mục danh sách allow/deny của plugin và các mục `plugins.load.paths` được liên kết khi áp dụng. Trừ khi `--keep-files` được đặt, uninstall cũng xóa thư mục cài đặt được quản lý đang được theo dõi khi thư mục đó nằm trong gốc tiện ích mở rộng plugin của OpenClaw. Với các plugin active memory, memory slot đặt lại về `memory-core`.

<Note>
`--keep-config` được hỗ trợ như alias đã lỗi thời cho `--keep-files`.
</Note>

### Cập nhật

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

Các bản cập nhật áp dụng cho các bản cài đặt plugin được theo dõi trong chỉ mục plugin được quản lý và các bản cài đặt hook-pack được theo dõi trong `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="Resolving plugin id vs npm spec">
    Khi bạn truyền một id plugin, OpenClaw tái sử dụng đặc tả cài đặt đã ghi lại cho plugin đó. Điều đó nghĩa là các dist-tag đã lưu trước đó như `@beta` và các phiên bản ghim chính xác tiếp tục được dùng trong các lần chạy `update <id>` sau này.

    Với các bản cài đặt npm, bạn cũng có thể truyền một đặc tả gói npm rõ ràng với dist-tag hoặc phiên bản chính xác. OpenClaw phân giải tên gói đó về bản ghi plugin được theo dõi, cập nhật plugin đã cài đó và ghi lại đặc tả npm mới cho các bản cập nhật dựa trên id trong tương lai.

    Truyền tên gói npm không kèm phiên bản hoặc thẻ cũng phân giải về bản ghi plugin được theo dõi. Dùng cách này khi một plugin đã được ghim vào một phiên bản chính xác và bạn muốn chuyển nó trở lại dòng phát hành mặc định của registry.

  </Accordion>
  <Accordion title="Beta channel updates">
    `openclaw plugins update` tái sử dụng đặc tả plugin được theo dõi trừ khi bạn truyền một đặc tả mới. `openclaw update` còn biết kênh cập nhật OpenClaw đang hoạt động: trên kênh beta, các bản ghi plugin npm và ClawHub theo dòng mặc định thử `@beta` trước, rồi fallback về đặc tả mặc định/latest đã ghi lại nếu không có bản phát hành beta plugin. Các phiên bản chính xác và thẻ rõ ràng vẫn được ghim vào bộ chọn đó.

  </Accordion>
  <Accordion title="Version checks and integrity drift">
    Trước một bản cập nhật npm trực tiếp, OpenClaw kiểm tra phiên bản gói đã cài đặt với siêu dữ liệu registry npm. Nếu phiên bản đã cài đặt và danh tính tạo tác đã ghi lại đã khớp với đích đã phân giải, bản cập nhật sẽ bị bỏ qua mà không tải xuống, cài đặt lại hoặc ghi lại `openclaw.json`.

    Khi có hash integrity đã lưu và hash tạo tác đã fetch thay đổi, OpenClaw xử lý đó là drift tạo tác npm. Lệnh tương tác `openclaw plugins update` in các hash dự kiến và thực tế rồi yêu cầu xác nhận trước khi tiếp tục. Các helper cập nhật không tương tác fail closed trừ khi bên gọi cung cấp một chính sách tiếp tục rõ ràng.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install on update">
    `--dangerously-force-unsafe-install` cũng có sẵn trên `plugins update` như một ghi đè khẩn cấp cho các false positive của quét mã nguy hiểm tích hợp trong quá trình cập nhật plugin. Tùy chọn này vẫn không bỏ qua các chặn chính sách `before_install` của plugin hoặc chặn do lỗi quét, và chỉ áp dụng cho các bản cập nhật plugin, không áp dụng cho các bản cập nhật hook-pack.
  </Accordion>
</AccordionGroup>

### Kiểm tra

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect hiển thị danh tính, trạng thái tải, nguồn, khả năng manifest, cờ chính sách, chẩn đoán, siêu dữ liệu cài đặt, khả năng bundle và mọi hỗ trợ máy chủ MCP hoặc LSP được phát hiện mà mặc định không import runtime plugin. Thêm `--runtime` để tải module plugin và bao gồm các hook, tool, command, service, phương thức gateway và route HTTP đã đăng ký. Kiểm tra runtime báo cáo trực tiếp các phụ thuộc plugin bị thiếu; việc cài đặt và sửa chữa vẫn nằm trong `openclaw plugins install`, `openclaw plugins update` và `openclaw doctor --fix`.

Các lệnh CLI do plugin sở hữu thường được cài đặt dưới dạng các nhóm lệnh `openclaw` gốc, nhưng plugin cũng có thể đăng ký các lệnh lồng dưới một parent lõi như `openclaw nodes`. Sau khi `inspect --runtime` hiển thị một lệnh dưới `cliCommands`, hãy chạy lệnh đó tại đường dẫn được liệt kê; ví dụ một plugin đăng ký `demo-git` có thể được xác minh bằng `openclaw demo-git ping`.

Mỗi plugin được phân loại theo những gì nó thực sự đăng ký tại runtime:

- **plain-capability** — một loại capability (ví dụ: Plugin chỉ dành cho provider)
- **hybrid-capability** — nhiều loại capability (ví dụ: văn bản + giọng nói + hình ảnh)
- **hook-only** — chỉ có hook, không có capability hoặc surface
- **non-capability** — công cụ/lệnh/dịch vụ nhưng không có capability

Xem [hình dạng Plugin](/vi/plugins/architecture#plugin-shapes) để biết thêm về mô hình capability.

<Note>
Cờ `--json` xuất báo cáo máy đọc được, phù hợp cho script và kiểm tra. `inspect --all` hiển thị một bảng trên toàn bộ đội hình với các cột hình dạng, loại capability, thông báo tương thích, capability của gói, và tóm tắt hook. `info` là bí danh của `inspect`.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` báo cáo lỗi tải Plugin, chẩn đoán manifest/discovery, và thông báo tương thích. Khi mọi thứ sạch, lệnh in ra `No plugin issues detected.`

Nếu một Plugin đã cấu hình có trên đĩa nhưng bị chặn bởi các kiểm tra an toàn đường dẫn của loader, xác thực cấu hình sẽ giữ mục Plugin đó và báo cáo là `present but blocked`. Hãy sửa chẩn đoán Plugin bị chặn đứng trước, chẳng hạn như quyền sở hữu đường dẫn hoặc quyền cho phép ghi toàn cục, thay vì xóa cấu hình `plugins.entries.<id>` hoặc `plugins.allow`.

Đối với lỗi hình dạng module như thiếu export `register`/`activate`, hãy chạy lại với `OPENCLAW_PLUGIN_LOAD_DEBUG=1` để đưa tóm tắt hình dạng export gọn vào đầu ra chẩn đoán.

### Registry

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Registry Plugin cục bộ là mô hình đọc lạnh được lưu bền vững của OpenClaw cho danh tính Plugin đã cài đặt, trạng thái bật, siêu dữ liệu nguồn, và quyền sở hữu đóng góp. Khởi động thông thường, tra cứu chủ sở hữu provider, phân loại thiết lập kênh, và kiểm kê Plugin có thể đọc nó mà không cần nhập các module runtime của Plugin.

Dùng `plugins registry` để kiểm tra registry đã lưu bền vững có tồn tại, còn hiện hành, hay đã cũ. Dùng `--refresh` để xây dựng lại từ chỉ mục Plugin đã lưu bền vững, chính sách cấu hình, và siêu dữ liệu manifest/package. Đây là đường sửa chữa, không phải đường kích hoạt runtime.

`openclaw doctor --fix` cũng sửa hiện tượng trôi npm được quản lý gần registry: nếu một package `@openclaw/*` mồ côi hoặc được khôi phục dưới gốc npm Plugin được quản lý che khuất một Plugin đi kèm, doctor sẽ xóa package cũ đó và xây dựng lại registry để quá trình khởi động xác thực theo manifest đi kèm.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` là công tắc tương thích phá kính đã lỗi thời dành cho lỗi đọc registry. Ưu tiên `plugins registry --refresh` hoặc `openclaw doctor --fix`; fallback env chỉ dành cho khôi phục khởi động khẩn cấp trong khi quá trình di trú được triển khai.
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Danh sách Marketplace chấp nhận một đường dẫn Marketplace cục bộ, một đường dẫn `marketplace.json`, dạng viết tắt GitHub như `owner/repo`, URL repo GitHub, hoặc URL git. `--json` in nhãn nguồn đã phân giải cùng manifest Marketplace đã phân tích cú pháp và các mục Plugin.

## Liên quan

- [Xây dựng Plugin](/vi/plugins/building-plugins)
- [Tham chiếu CLI](/vi/cli)
- [ClawHub](/vi/clawhub)
