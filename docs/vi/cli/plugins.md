---
read_when:
    - Bạn muốn cài đặt hoặc quản lý các Plugin Gateway hoặc các gói tương thích
    - Bạn muốn gỡ lỗi các lỗi tải Plugin
sidebarTitle: Plugins
summary: Tài liệu tham khảo CLI cho `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, doctor)
title: Plugin
x-i18n:
    generated_at: "2026-05-04T09:37:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: f561ce098181b07f25db3520b1726162863469ac05fb4a3e786915257d97c9a4
    source_path: cli/plugins.md
    workflow: 16
---

Quản lý các Plugin Gateway, gói hook và bundle tương thích.

<CardGroup cols={2}>
  <Card title="Hệ thống Plugin" href="/vi/tools/plugin">
    Hướng dẫn cho người dùng cuối về cài đặt, bật và khắc phục sự cố plugin.
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

Để điều tra thao tác cài đặt, kiểm tra, gỡ cài đặt hoặc làm mới registry bị chậm, hãy chạy
lệnh với `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`. Trace ghi thời lượng từng pha
vào stderr và vẫn giữ đầu ra JSON có thể phân tích cú pháp. Xem [Gỡ lỗi](/vi/help/debugging#plugin-lifecycle-trace).

<Note>
Plugin đi kèm được phân phối cùng OpenClaw. Một số được bật theo mặc định (ví dụ: nhà cung cấp mô hình đi kèm, nhà cung cấp giọng nói đi kèm và plugin trình duyệt đi kèm); các plugin khác yêu cầu `plugins enable`.

Plugin OpenClaw gốc phải phân phối `openclaw.plugin.json` với JSON Schema nội tuyến (`configSchema`, ngay cả khi rỗng). Các bundle tương thích dùng manifest bundle riêng của chúng.

`plugins list` hiển thị `Format: openclaw` hoặc `Format: bundle`. Đầu ra list/info dạng verbose cũng hiển thị subtype của bundle (`codex`, `claude` hoặc `cursor`) cùng các capability bundle được phát hiện.
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
Tên package trần cài đặt từ npm theo mặc định trong giai đoạn chuyển đổi khi ra mắt. Dùng `clawhub:<package>` cho ClawHub. Hãy coi việc cài đặt plugin như chạy mã. Ưu tiên các phiên bản đã ghim.
</Warning>

`plugins search` truy vấn ClawHub để tìm các package plugin có thể cài đặt và in ra
tên package sẵn sàng cài đặt. Lệnh này tìm kiếm package code-plugin và bundle-plugin,
không phải Skills. Dùng `openclaw skills search` cho Skills trên ClawHub.

<Note>
ClawHub là bề mặt phân phối và khám phá chính cho hầu hết plugin. Npm
vẫn là đường dẫn dự phòng và cài đặt trực tiếp được hỗ trợ. Các package plugin
`@openclaw/*` do OpenClaw sở hữu đã được xuất bản lại trên npm; xem danh sách hiện tại
trên [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) hoặc
[kho plugin](/vi/plugins/plugin-inventory). Bản cài đặt ổn định dùng `latest`.
Bản cài đặt và cập nhật kênh beta ưu tiên dist-tag `beta` của npm khi tag đó
có sẵn, rồi quay về `latest`.
</Note>

<AccordionGroup>
  <Accordion title="Config include và sửa cấu hình không hợp lệ">
    Nếu phần `plugins` của bạn được hỗ trợ bởi một `$include` một tệp, `plugins install/update/enable/disable/uninstall` sẽ ghi xuyên tới tệp được include đó và giữ nguyên `openclaw.json`. Include gốc, mảng include và include có override cùng cấp sẽ fail closed thay vì làm phẳng. Xem [Config include](/vi/gateway/configuration) để biết các dạng được hỗ trợ.

    Nếu cấu hình không hợp lệ trong khi cài đặt, `plugins install` thường fail closed và yêu cầu bạn chạy `openclaw doctor --fix` trước. Trong quá trình khởi động Gateway và hot reload, cấu hình plugin không hợp lệ fail closed như mọi cấu hình không hợp lệ khác; `openclaw doctor --fix` có thể cách ly mục plugin không hợp lệ. Ngoại lệ duy nhất được ghi nhận ở thời điểm cài đặt là đường dẫn phục hồi hẹp cho plugin đi kèm chủ động chọn tham gia `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force và cài đặt lại so với cập nhật">
    `--force` tái sử dụng mục tiêu cài đặt hiện có và ghi đè trực tiếp một plugin hoặc gói hook đã được cài đặt. Dùng tùy chọn này khi bạn chủ ý cài đặt lại cùng một id từ đường dẫn cục bộ, archive, package ClawHub hoặc artifact npm mới. Với nâng cấp thường lệ cho một plugin npm đã được theo dõi, hãy ưu tiên `openclaw plugins update <id-or-npm-spec>`.

    Nếu bạn chạy `plugins install` cho một id plugin đã được cài đặt, OpenClaw sẽ dừng và chỉ bạn tới `plugins update <id-or-npm-spec>` để nâng cấp thông thường, hoặc tới `plugins install <package> --force` khi bạn thực sự muốn ghi đè bản cài đặt hiện tại từ một nguồn khác.

  </Accordion>
  <Accordion title="Phạm vi --pin">
    `--pin` chỉ áp dụng cho cài đặt npm. Tùy chọn này không được hỗ trợ với cài đặt `git:`; hãy dùng git ref rõ ràng như `git:github.com/acme/plugin@v1.2.3` khi bạn muốn một nguồn đã ghim. Tùy chọn này không được hỗ trợ với `--marketplace`, vì cài đặt marketplace lưu metadata nguồn marketplace thay vì spec npm.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` là tùy chọn khẩn cấp cho lỗi dương tính giả trong trình quét mã nguy hiểm tích hợp. Tùy chọn này cho phép tiếp tục cài đặt ngay cả khi trình quét tích hợp báo cáo phát hiện `critical`, nhưng **không** bỏ qua các chặn chính sách hook `before_install` của plugin và **không** bỏ qua lỗi quét.

    Cờ CLI này áp dụng cho luồng cài đặt/cập nhật plugin. Các bản cài đặt phụ thuộc skill do Gateway hỗ trợ dùng override yêu cầu tương ứng `dangerouslyForceUnsafeInstall`, trong khi `openclaw skills install` vẫn là luồng tải xuống/cài đặt Skills ClawHub riêng.

    Nếu một plugin bạn đã xuất bản trên ClawHub bị chặn bởi quét registry, hãy dùng các bước dành cho nhà xuất bản trong [ClawHub](/vi/tools/clawhub).

  </Accordion>
  <Accordion title="Gói hook và spec npm">
    `plugins install` cũng là bề mặt cài đặt cho các gói hook expose `openclaw.hooks` trong `package.json`. Dùng `openclaw hooks` để xem hook đã lọc và bật từng hook, không phải để cài đặt package.

    Spec npm là **chỉ registry** (tên package + **phiên bản chính xác** hoặc **dist-tag** tùy chọn). Spec Git/URL/file và dải semver bị từ chối. Cài đặt phụ thuộc chạy cục bộ theo dự án với `--ignore-scripts` để an toàn, ngay cả khi shell của bạn có thiết lập cài đặt npm toàn cục.

    Dùng `npm:<package>` khi bạn muốn làm rõ quá trình phân giải npm. Spec package trần cũng cài đặt trực tiếp từ npm trong giai đoạn chuyển đổi khi ra mắt.

    Spec trần và `@latest` ở lại track ổn định. Các phiên bản sửa lỗi có dấu ngày của OpenClaw như `2026.5.3-1` là bản phát hành ổn định cho kiểm tra này. Nếu npm phân giải một trong các spec đó thành bản prerelease, OpenClaw sẽ dừng và yêu cầu bạn chọn tham gia rõ ràng bằng tag prerelease như `@beta`/`@rc` hoặc phiên bản prerelease chính xác như `@1.2.3-beta.4`.

    Nếu một spec cài đặt trần khớp với id plugin chính thức (ví dụ `diffs`), OpenClaw sẽ cài đặt trực tiếp mục catalog. Để cài đặt một package npm cùng tên, hãy dùng spec có scope rõ ràng (ví dụ `@scope/diffs`).

  </Accordion>
  <Accordion title="Kho Git">
    Dùng `git:<repo>` để cài đặt trực tiếp từ kho git. Các dạng được hỗ trợ gồm `git:github.com/owner/repo`, `git:owner/repo`, URL clone đầy đủ `https://`, `ssh://`, `git://`, `file://` và `git@host:owner/repo.git`. Thêm `@<ref>` hoặc `#<ref>` để checkout branch, tag hoặc commit trước khi cài đặt.

    Cài đặt Git clone vào thư mục tạm, checkout ref được yêu cầu nếu có, rồi dùng trình cài đặt thư mục plugin thông thường. Điều đó có nghĩa là xác thực manifest, quét mã nguy hiểm, công việc cài đặt package-manager và bản ghi cài đặt hoạt động như cài đặt npm. Bản ghi cài đặt git bao gồm URL/ref nguồn cùng commit đã phân giải để `openclaw plugins update` có thể phân giải lại nguồn sau này.

    Sau khi cài đặt từ git, dùng `openclaw plugins inspect <id> --runtime --json` để xác minh các đăng ký runtime như phương thức gateway và lệnh CLI. Nếu plugin đã đăng ký một CLI root với `api.registerCli`, hãy thực thi lệnh đó trực tiếp qua CLI root của OpenClaw, ví dụ `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Archive">
    Archive được hỗ trợ: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Archive plugin OpenClaw gốc phải chứa `openclaw.plugin.json` hợp lệ tại root plugin đã giải nén; archive chỉ chứa `package.json` bị từ chối trước khi OpenClaw ghi bản ghi cài đặt.

    Cài đặt marketplace Claude cũng được hỗ trợ.

  </Accordion>
</AccordionGroup>

Cài đặt ClawHub dùng locator rõ ràng `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Spec plugin an toàn với npm dạng trần cài đặt từ npm theo mặc định trong giai đoạn chuyển đổi khi ra mắt:

```bash
openclaw plugins install openclaw-codex-app-server
```

Dùng `npm:` để làm rõ quá trình phân giải chỉ npm:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw kiểm tra khả năng tương thích plugin API / gateway tối thiểu được quảng bá trước khi cài đặt. Khi phiên bản ClawHub đã chọn xuất bản artifact ClawPack, OpenClaw tải xuống npm-pack `.tgz` có phiên bản, xác minh header digest ClawHub và digest artifact, rồi cài đặt qua đường dẫn archive thông thường. Các phiên bản ClawHub cũ hơn không có metadata ClawPack vẫn cài đặt qua đường dẫn xác minh archive package cũ. Bản ghi cài đặt giữ metadata nguồn ClawHub, loại artifact, integrity npm, shasum npm, tên tarball và thông tin digest ClawPack để dùng cho các lần cập nhật sau.
Cài đặt ClawHub không có phiên bản giữ spec đã ghi không có phiên bản để `openclaw plugins update` có thể theo các bản phát hành ClawHub mới hơn; bộ chọn phiên bản hoặc tag rõ ràng như `clawhub:pkg@1.2.3` và `clawhub:pkg@beta` vẫn được ghim vào bộ chọn đó.

#### Cú pháp rút gọn marketplace

Dùng cú pháp rút gọn `plugin@marketplace` khi tên marketplace tồn tại trong cache registry cục bộ của Claude tại `~/.claude/plugins/known_marketplaces.json`:

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
  <Tab title="Marketplace sources">
    - tên marketplace đã biết của Claude từ `~/.claude/plugins/known_marketplaces.json`
    - gốc marketplace cục bộ hoặc đường dẫn `marketplace.json`
    - cách viết tắt kho GitHub như `owner/repo`
    - URL kho GitHub như `https://github.com/owner/repo`
    - URL git

  </Tab>
  <Tab title="Remote marketplace rules">
    Với marketplace từ xa được tải từ GitHub hoặc git, các mục plugin phải nằm bên trong kho marketplace đã clone. OpenClaw chấp nhận nguồn đường dẫn tương đối từ kho đó và từ chối HTTP(S), đường dẫn tuyệt đối, git, GitHub, và các nguồn plugin không phải đường dẫn khác từ manifest từ xa.
  </Tab>
</Tabs>

Với đường dẫn cục bộ và tệp lưu trữ, OpenClaw tự động phát hiện:

- plugin OpenClaw gốc (`openclaw.plugin.json`)
- gói tương thích với Codex (`.codex-plugin/plugin.json`)
- gói tương thích với Claude (`.claude-plugin/plugin.json` hoặc bố cục thành phần Claude mặc định)
- gói tương thích với Cursor (`.cursor-plugin/plugin.json`)

<Note>
Các gói tương thích được cài đặt vào gốc plugin thông thường và tham gia cùng luồng liệt kê/thông tin/bật/tắt. Hiện tại, bundle skills, command-skills của Claude, giá trị mặc định `settings.json` của Claude, giá trị mặc định `.lsp.json` của Claude / `lspServers` được khai báo trong manifest, command-skills của Cursor, và các thư mục hook Codex tương thích được hỗ trợ; các khả năng gói khác được phát hiện sẽ hiển thị trong chẩn đoán/thông tin nhưng chưa được nối vào thực thi runtime.
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
  Bản kiểm kê máy đọc được cùng chẩn đoán registry và trạng thái cài đặt phụ thuộc của package.
</ParamField>

<Note>
`plugins list` đọc registry plugin cục bộ đã lưu trước, với phương án dự phòng suy ra chỉ từ manifest khi registry bị thiếu hoặc không hợp lệ. Lệnh này hữu ích để kiểm tra liệu một plugin đã được cài đặt, bật và hiển thị cho việc lập kế hoạch khởi động lạnh hay chưa, nhưng không phải là phép dò runtime trực tiếp của một tiến trình Gateway đang chạy. Sau khi thay đổi mã plugin, trạng thái bật, chính sách hook, hoặc `plugins.load.paths`, hãy khởi động lại Gateway phục vụ kênh trước khi kỳ vọng mã `register(api)` mới hoặc hook chạy. Với triển khai từ xa/container, hãy xác minh bạn đang khởi động lại đúng tiến trình con `openclaw gateway run`, không chỉ một tiến trình wrapper.

`plugins list --json` bao gồm `dependencyStatus` của từng plugin từ `dependencies` và `optionalDependencies` trong `package.json`. OpenClaw kiểm tra liệu các tên package đó có hiện diện dọc theo đường dẫn tra cứu `node_modules` thông thường của Node cho plugin hay không; nó không import mã runtime của plugin, chạy trình quản lý package, hoặc sửa các phụ thuộc bị thiếu.
</Note>

`plugins search` là tra cứu danh mục ClawHub từ xa. Nó không kiểm tra trạng thái cục bộ, thay đổi cấu hình, cài đặt package, hoặc tải mã runtime của plugin. Kết quả tìm kiếm bao gồm tên package ClawHub, họ, kênh, phiên bản, tóm tắt, và gợi ý cài đặt như `openclaw plugins install clawhub:<package>`.

Với công việc plugin đi kèm bên trong ảnh Docker đã đóng gói, hãy bind-mount thư mục nguồn plugin lên đường dẫn nguồn đã đóng gói tương ứng, chẳng hạn `/app/extensions/synology-chat`. OpenClaw sẽ phát hiện lớp phủ nguồn đã mount đó trước `/app/dist/extensions/synology-chat`; một thư mục nguồn được sao chép thông thường sẽ không hoạt động để các bản cài đặt đóng gói bình thường vẫn dùng dist đã biên dịch.

Để gỡ lỗi hook runtime:

- `openclaw plugins inspect <id> --runtime --json` hiển thị các hook đã đăng ký và chẩn đoán từ một lượt kiểm tra đã tải module. Kiểm tra runtime không bao giờ cài đặt phụ thuộc; dùng `openclaw doctor --fix` để dọn trạng thái phụ thuộc legacy hoặc cài các plugin tải xuống đã cấu hình bị thiếu.
- `openclaw gateway status --deep --require-rpc` xác nhận Gateway có thể truy cập, gợi ý service/tiến trình, đường dẫn cấu hình, và sức khỏe RPC.
- Hook hội thoại không đi kèm (`llm_input`, `llm_output`, `before_agent_finalize`, `agent_end`) yêu cầu `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Dùng `--link` để tránh sao chép thư mục cục bộ (thêm vào `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` không được hỗ trợ cùng `--link` vì cài đặt liên kết tái sử dụng đường dẫn nguồn thay vì sao chép đè lên mục tiêu cài đặt do hệ thống quản lý.

Dùng `--pin` trên các bản cài đặt npm để lưu spec chính xác đã phân giải (`name@version`) trong chỉ mục plugin được quản lý, đồng thời giữ hành vi mặc định là không ghim.
</Note>

### Chỉ mục Plugin

Siêu dữ liệu cài đặt Plugin là trạng thái do máy quản lý, không phải cấu hình người dùng. Các lần cài đặt và cập nhật ghi nó vào `plugins/installs.json` trong thư mục trạng thái OpenClaw đang hoạt động. Bản đồ `installRecords` cấp cao nhất là nguồn bền vững của siêu dữ liệu cài đặt, bao gồm các bản ghi cho manifest plugin bị hỏng hoặc bị thiếu. Mảng `plugins` là bộ nhớ đệm registry lạnh suy ra từ manifest. Tệp này bao gồm cảnh báo không chỉnh sửa và được dùng bởi `openclaw plugins update`, gỡ cài đặt, chẩn đoán, và registry plugin lạnh.

Khi OpenClaw thấy các bản ghi legacy `plugins.installs` được phát hành trong cấu hình, nó chuyển chúng vào chỉ mục plugin và xóa khóa cấu hình; nếu một trong hai thao tác ghi thất bại, các bản ghi cấu hình được giữ lại để siêu dữ liệu cài đặt không bị mất.

### Gỡ cài đặt

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` xóa bản ghi plugin khỏi `plugins.entries`, chỉ mục plugin đã lưu, các mục danh sách cho phép/từ chối plugin, và các mục `plugins.load.paths` đã liên kết khi áp dụng. Trừ khi đặt `--keep-files`, gỡ cài đặt cũng xóa thư mục cài đặt do hệ thống quản lý đã theo dõi khi nó nằm bên trong gốc tiện ích mở rộng plugin của OpenClaw. Với plugin active memory, slot bộ nhớ đặt lại thành `memory-core`.

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

Cập nhật áp dụng cho các bản cài đặt plugin được theo dõi trong chỉ mục plugin được quản lý và các bản cài đặt hook-pack được theo dõi trong `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="Resolving plugin id vs npm spec">
    Khi bạn truyền một plugin id, OpenClaw tái sử dụng spec cài đặt đã ghi cho plugin đó. Điều đó có nghĩa là các dist-tag đã lưu trước đó như `@beta` và các phiên bản ghim chính xác tiếp tục được dùng trong những lần chạy `update <id>` sau này.

    Với bản cài đặt npm, bạn cũng có thể truyền một spec package npm rõ ràng với dist-tag hoặc phiên bản chính xác. OpenClaw phân giải tên package đó trở lại bản ghi plugin được theo dõi, cập nhật plugin đã cài đó, và ghi lại spec npm mới cho các lần cập nhật dựa trên id trong tương lai.

    Truyền tên package npm không kèm phiên bản hoặc tag cũng phân giải trở lại bản ghi plugin được theo dõi. Dùng cách này khi một plugin đã được ghim vào phiên bản chính xác và bạn muốn chuyển nó trở lại dòng phát hành mặc định của registry.

  </Accordion>
  <Accordion title="Beta channel updates">
    `openclaw plugins update` tái sử dụng spec plugin được theo dõi trừ khi bạn truyền spec mới. `openclaw update` còn biết kênh cập nhật OpenClaw đang hoạt động: trên kênh beta, các bản ghi plugin npm và ClawHub thuộc dòng mặc định sẽ thử `@beta` trước, rồi quay lại spec mặc định/latest đã ghi nếu không có bản phát hành beta của plugin. Phiên bản chính xác và tag rõ ràng vẫn được ghim vào bộ chọn đó.

  </Accordion>
  <Accordion title="Version checks and integrity drift">
    Trước một bản cập nhật npm trực tiếp, OpenClaw kiểm tra phiên bản package đã cài so với siêu dữ liệu npm registry. Nếu phiên bản đã cài và danh tính artifact đã ghi đã khớp với mục tiêu đã phân giải, bản cập nhật được bỏ qua mà không tải xuống, cài đặt lại, hoặc ghi lại `openclaw.json`.

    Khi có hash integrity đã lưu và hash artifact đã fetch thay đổi, OpenClaw coi đó là drift artifact npm. Lệnh tương tác `openclaw plugins update` in hash kỳ vọng và hash thực tế, rồi hỏi xác nhận trước khi tiếp tục. Các helper cập nhật không tương tác sẽ fail closed trừ khi bên gọi cung cấp chính sách tiếp tục rõ ràng.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install on update">
    `--dangerously-force-unsafe-install` cũng có sẵn trên `plugins update` như một override khẩn cấp cho các kết quả dương tính giả của quét dangerous-code tích hợp trong khi cập nhật plugin. Nó vẫn không bỏ qua các chặn chính sách `before_install` của plugin hoặc chặn do lỗi quét, và chỉ áp dụng cho cập nhật plugin, không áp dụng cho cập nhật hook-pack.
  </Accordion>
</AccordionGroup>

### Kiểm tra

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect hiển thị danh tính, trạng thái tải, nguồn, khả năng manifest, cờ chính sách, chẩn đoán, siêu dữ liệu cài đặt, khả năng gói, và mọi hỗ trợ máy chủ MCP hoặc LSP được phát hiện mà mặc định không import runtime plugin. Thêm `--runtime` để tải module plugin và bao gồm các hook, công cụ, lệnh, service, phương thức gateway, và tuyến HTTP đã đăng ký. Kiểm tra runtime báo cáo trực tiếp các phụ thuộc plugin bị thiếu; việc cài đặt và sửa chữa nằm trong `openclaw plugins install`, `openclaw plugins update`, và `openclaw doctor --fix`.

Các lệnh CLI do plugin sở hữu được cài đặt dưới dạng nhóm lệnh `openclaw` gốc. Sau khi `inspect --runtime` hiển thị một lệnh dưới `cliCommands`, hãy chạy nó dưới dạng `openclaw <command> ...`; ví dụ một plugin đăng ký `demo-git` có thể được xác minh bằng `openclaw demo-git ping`.

Mỗi plugin được phân loại theo những gì nó thực sự đăng ký tại runtime:

- **plain-capability** — một loại khả năng (ví dụ: plugin chỉ dành cho provider)
- **hybrid-capability** — nhiều loại khả năng (ví dụ: văn bản + giọng nói + hình ảnh)
- **hook-only** — chỉ hook, không có khả năng hoặc bề mặt
- **non-capability** — công cụ/lệnh/service nhưng không có khả năng

Xem [Kiểu Plugin](/vi/plugins/architecture#plugin-shapes) để biết thêm về mô hình khả năng.

<Note>
Cờ `--json` xuất một báo cáo máy đọc được phù hợp cho script và kiểm toán. `inspect --all` hiển thị bảng toàn bộ đội hình với các cột kiểu, loại khả năng, thông báo tương thích, khả năng gói, và tóm tắt hook. `info` là alias cho `inspect`.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` báo cáo lỗi tải plugin, chẩn đoán manifest/discovery, và thông báo tương thích. Khi mọi thứ sạch, nó in `No plugin issues detected.`

Nếu một plugin đã cấu hình hiện diện trên đĩa nhưng bị chặn bởi kiểm tra an toàn đường dẫn của loader, xác thực cấu hình giữ mục plugin và báo cáo nó là `present but blocked`. Hãy sửa chẩn đoán plugin bị chặn ở trước đó, chẳng hạn quyền sở hữu đường dẫn hoặc quyền ghi của mọi người, thay vì xóa cấu hình `plugins.entries.<id>` hoặc `plugins.allow`.

Với lỗi hình dạng module như thiếu export `register`/`activate`, chạy lại với `OPENCLAW_PLUGIN_LOAD_DEBUG=1` để bao gồm tóm tắt hình dạng export gọn trong đầu ra chẩn đoán.

### Registry

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Registry plugin cục bộ là mô hình đọc lạnh đã lưu của OpenClaw cho danh tính plugin đã cài, trạng thái bật, siêu dữ liệu nguồn, và quyền sở hữu đóng góp. Khởi động bình thường, tra cứu chủ sở hữu provider, phân loại thiết lập kênh, và kiểm kê plugin có thể đọc nó mà không cần import các module runtime plugin.

Sử dụng `plugins registry` để kiểm tra registry đã lưu có hiện diện, hiện hành hay đã cũ. Sử dụng `--refresh` để xây dựng lại registry từ chỉ mục plugin đã lưu, chính sách cấu hình và siêu dữ liệu manifest/package. Đây là đường dẫn sửa chữa, không phải đường dẫn kích hoạt khi chạy.

`openclaw doctor --fix` cũng sửa lỗi lệch npm được quản lý liền kề registry: nếu một package `@openclaw/*` mồ côi hoặc được khôi phục dưới gốc npm plugin được quản lý che khuất một plugin được đóng gói sẵn, doctor sẽ xóa package cũ đó và xây dựng lại registry để quá trình khởi động xác thực theo manifest được đóng gói sẵn.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` là công tắc tương thích khẩn cấp đã lỗi thời cho các lỗi đọc registry. Ưu tiên `plugins registry --refresh` hoặc `openclaw doctor --fix`; fallback bằng env chỉ dành cho khôi phục khởi động khẩn cấp trong khi quá trình di chuyển đang được triển khai.
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Danh sách Marketplace chấp nhận đường dẫn marketplace cục bộ, đường dẫn `marketplace.json`, cách viết tắt GitHub như `owner/repo`, URL repo GitHub hoặc URL git. `--json` in nhãn nguồn đã phân giải cùng với manifest marketplace đã phân tích cú pháp và các mục plugin.

## Liên quan

- [Xây dựng plugin](/vi/plugins/building-plugins)
- [Tham chiếu CLI](/vi/cli)
- [Plugin cộng đồng](/vi/plugins/community)
