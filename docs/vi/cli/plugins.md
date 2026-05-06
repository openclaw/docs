---
read_when:
    - Bạn muốn cài đặt hoặc quản lý các Plugin Gateway hoặc gói tương thích
    - Bạn muốn gỡ lỗi các lỗi khi tải Plugin
sidebarTitle: Plugins
summary: Tài liệu tham chiếu CLI cho `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, doctor)
title: Plugin
x-i18n:
    generated_at: "2026-05-06T10:57:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: c888d3fc8de0e25edc1c38f679d522a4e75cb09d986702451e29418d70a939f2
    source_path: cli/plugins.md
    workflow: 16
---

Quản lý Plugin Gateway, gói hook và các bundle tương thích.

<CardGroup cols={2}>
  <Card title="Hệ thống Plugin" href="/vi/tools/plugin">
    Hướng dẫn cho người dùng cuối về cài đặt, bật và khắc phục sự cố Plugin.
  </Card>
  <Card title="Quản lý Plugin" href="/vi/plugins/manage-plugins">
    Ví dụ nhanh để cài đặt, liệt kê, cập nhật, gỡ cài đặt và phát hành.
  </Card>
  <Card title="Bundle Plugin" href="/vi/plugins/bundles">
    Mô hình tương thích bundle.
  </Card>
  <Card title="Manifest Plugin" href="/vi/plugins/manifest">
    Các trường manifest và schema cấu hình.
  </Card>
  <Card title="Bảo mật" href="/vi/gateway/security">
    Gia cố bảo mật cho các lần cài đặt Plugin.
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

Để điều tra cài đặt, kiểm tra, gỡ cài đặt hoặc làm mới registry chậm, hãy chạy lệnh với `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`. Trace ghi thời gian từng pha vào stderr và giữ cho đầu ra JSON vẫn có thể phân tích cú pháp. Xem [Gỡ lỗi](/vi/help/debugging#plugin-lifecycle-trace).

<Note>
Các Plugin đi kèm được phát hành cùng OpenClaw. Một số được bật theo mặc định (ví dụ các nhà cung cấp mô hình đi kèm, nhà cung cấp giọng nói đi kèm và Plugin trình duyệt đi kèm); các Plugin khác yêu cầu `plugins enable`.

Plugin OpenClaw native phải phát hành `openclaw.plugin.json` với JSON Schema nội tuyến (`configSchema`, ngay cả khi rỗng). Các bundle tương thích dùng manifest bundle riêng của chúng.

`plugins list` hiển thị `Format: openclaw` hoặc `Format: bundle`. Đầu ra danh sách/thông tin dạng chi tiết cũng hiển thị kiểu phụ của bundle (`codex`, `claude` hoặc `cursor`) cùng các khả năng bundle được phát hiện.
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
Tên package trần cài đặt từ npm theo mặc định trong giai đoạn chuyển đổi ra mắt. Dùng `clawhub:<package>` cho ClawHub. Hãy coi việc cài đặt Plugin giống như chạy mã. Ưu tiên phiên bản được ghim.
</Warning>

`plugins search` truy vấn ClawHub để tìm các package Plugin có thể cài đặt và in ra tên package sẵn sàng để cài đặt. Lệnh này tìm các package code-plugin và bundle-plugin, không tìm Skills. Dùng `openclaw skills search` cho Skills trên ClawHub.

<Note>
ClawHub là bề mặt phân phối và khám phá chính cho hầu hết Plugin. Npm vẫn là phương án dự phòng được hỗ trợ và đường dẫn cài đặt trực tiếp. Các package Plugin `@openclaw/*` do OpenClaw sở hữu đã được phát hành lại trên npm; xem danh sách hiện tại trên [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) hoặc [kho Plugin](/vi/plugins/plugin-inventory). Cài đặt ổn định dùng `latest`. Cài đặt và cập nhật theo kênh beta ưu tiên dist-tag `beta` của npm khi tag đó có sẵn, rồi quay về `latest`.
</Note>

<AccordionGroup>
  <Accordion title="Config includes và sửa cấu hình không hợp lệ">
    Nếu phần `plugins` của bạn được hỗ trợ bởi một `$include` một tệp, `plugins install/update/enable/disable/uninstall` sẽ ghi xuyên qua tệp được include đó và giữ nguyên `openclaw.json`. Include gốc, mảng include và include có ghi đè cùng cấp sẽ thất bại đóng thay vì làm phẳng. Xem [Config includes](/vi/gateway/configuration) để biết các dạng được hỗ trợ.

    Nếu cấu hình không hợp lệ trong lúc cài đặt, `plugins install` thường thất bại đóng và yêu cầu bạn chạy `openclaw doctor --fix` trước. Trong lúc Gateway khởi động và tải lại nóng, cấu hình Plugin không hợp lệ thất bại đóng như mọi cấu hình không hợp lệ khác; `openclaw doctor --fix` có thể cách ly mục Plugin không hợp lệ. Ngoại lệ duy nhất được ghi tài liệu ở thời điểm cài đặt là một đường dẫn khôi phục hẹp cho Plugin đi kèm, dành cho các Plugin chủ động chọn tham gia `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force và cài đặt lại so với cập nhật">
    `--force` tái sử dụng đích cài đặt hiện có và ghi đè tại chỗ một Plugin hoặc gói hook đã được cài đặt. Dùng tùy chọn này khi bạn cố ý cài đặt lại cùng một id từ đường dẫn cục bộ, archive, package ClawHub hoặc artifact npm mới. Với nâng cấp thường lệ của một Plugin npm đã được theo dõi, ưu tiên `openclaw plugins update <id-or-npm-spec>`.

    Nếu bạn chạy `plugins install` cho một id Plugin đã được cài đặt, OpenClaw sẽ dừng và chỉ bạn tới `plugins update <id-or-npm-spec>` cho nâng cấp thông thường, hoặc tới `plugins install <package> --force` khi bạn thật sự muốn ghi đè cài đặt hiện tại từ một nguồn khác.

  </Accordion>
  <Accordion title="Phạm vi --pin">
    `--pin` chỉ áp dụng cho cài đặt npm. Tùy chọn này không được hỗ trợ với cài đặt `git:`; hãy dùng ref git rõ ràng như `git:github.com/acme/plugin@v1.2.3` khi bạn muốn một nguồn được ghim. Tùy chọn này không được hỗ trợ với `--marketplace`, vì cài đặt marketplace lưu giữ metadata nguồn marketplace thay vì npm spec.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` là tùy chọn phá kính trong trường hợp dương tính giả ở trình quét mã nguy hiểm tích hợp. Tùy chọn này cho phép quá trình cài đặt tiếp tục ngay cả khi trình quét tích hợp báo cáo phát hiện `critical`, nhưng **không** bỏ qua các chặn chính sách hook `before_install` của Plugin và **không** bỏ qua lỗi quét.

    Cờ CLI này áp dụng cho luồng cài đặt/cập nhật Plugin. Các lần cài đặt phụ thuộc Skills do Gateway hỗ trợ dùng override yêu cầu tương ứng `dangerouslyForceUnsafeInstall`, còn `openclaw skills install` vẫn là một luồng tải xuống/cài đặt Skills ClawHub riêng.

    Nếu một Plugin bạn đã phát hành trên ClawHub bị chặn bởi quá trình quét registry, hãy dùng các bước dành cho nhà phát hành trong [ClawHub](/vi/tools/clawhub).

  </Accordion>
  <Accordion title="Gói hook và npm spec">
    `plugins install` cũng là bề mặt cài đặt cho các gói hook expose `openclaw.hooks` trong `package.json`. Dùng `openclaw hooks` để xem hook có lọc và bật từng hook, không dùng để cài đặt package.

    Npm spec là **chỉ registry** (tên package + **phiên bản chính xác** hoặc **dist-tag** tùy chọn). Git/URL/file spec và dải semver bị từ chối. Cài đặt phụ thuộc chạy cục bộ theo dự án với `--ignore-scripts` để an toàn, ngay cả khi shell của bạn có thiết lập cài đặt npm toàn cục. Các root npm Plugin được quản lý kế thừa `overrides` npm ở cấp package của OpenClaw, nên các ghim bảo mật của host cũng áp dụng cho phụ thuộc Plugin được hoist.

    Dùng `npm:<package>` khi bạn muốn làm rõ việc phân giải npm. Các spec package trần cũng cài đặt trực tiếp từ npm trong giai đoạn chuyển đổi ra mắt.

    Spec trần và `@latest` ở lại track ổn định. Các phiên bản sửa lỗi có dấu ngày của OpenClaw như `2026.5.3-1` là bản phát hành ổn định cho kiểm tra này. Nếu npm phân giải một trong hai dạng đó thành prerelease, OpenClaw sẽ dừng và yêu cầu bạn chọn tham gia rõ ràng bằng tag prerelease như `@beta`/`@rc` hoặc một phiên bản prerelease chính xác như `@1.2.3-beta.4`.

    Nếu một spec cài đặt trần khớp với id Plugin chính thức (ví dụ `diffs`), OpenClaw cài đặt trực tiếp mục catalog. Để cài một package npm có cùng tên, hãy dùng spec có scope rõ ràng (ví dụ `@scope/diffs`).

  </Accordion>
  <Accordion title="Kho Git">
    Dùng `git:<repo>` để cài đặt trực tiếp từ kho git. Các dạng được hỗ trợ gồm `git:github.com/owner/repo`, `git:owner/repo`, URL clone đầy đủ `https://`, `ssh://`, `git://`, `file://` và `git@host:owner/repo.git`. Thêm `@<ref>` hoặc `#<ref>` để checkout một branch, tag hoặc commit trước khi cài đặt.

    Cài đặt Git clone vào một thư mục tạm, checkout ref được yêu cầu khi có, rồi dùng trình cài đặt thư mục Plugin thông thường. Điều đó nghĩa là xác thực manifest, quét mã nguy hiểm, công việc cài đặt bằng trình quản lý package và bản ghi cài đặt hoạt động như cài đặt npm. Các cài đặt git được ghi lại bao gồm URL/ref nguồn cùng commit đã phân giải để `openclaw plugins update` có thể phân giải lại nguồn về sau.

    Sau khi cài đặt từ git, dùng `openclaw plugins inspect <id> --runtime --json` để xác minh các đăng ký runtime như phương thức Gateway và lệnh CLI. Nếu Plugin đã đăng ký một root CLI bằng `api.registerCli`, hãy thực thi lệnh đó trực tiếp qua CLI root của OpenClaw, ví dụ `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Archive">
    Archive được hỗ trợ: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Archive Plugin OpenClaw native phải chứa `openclaw.plugin.json` hợp lệ tại root Plugin được giải nén; archive chỉ chứa `package.json` bị từ chối trước khi OpenClaw ghi bản ghi cài đặt.

    Dùng `npm-pack:<path.tgz>` khi tệp là tarball npm-pack và bạn muốn kiểm thử cùng đường dẫn cài đặt npm-root được quản lý như cài đặt registry, bao gồm xác minh `package-lock.json`, quét phụ thuộc được hoist và bản ghi cài đặt npm. Đường dẫn archive thuần vẫn cài đặt dưới dạng archive cục bộ trong root phần mở rộng Plugin.

    Cài đặt marketplace Claude cũng được hỗ trợ.

  </Accordion>
</AccordionGroup>

Cài đặt ClawHub dùng locator `clawhub:<package>` rõ ràng:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Các spec Plugin an toàn với npm dạng trần cài đặt từ npm theo mặc định trong giai đoạn chuyển đổi ra mắt:

```bash
openclaw plugins install openclaw-codex-app-server
```

Dùng `npm:` để làm rõ phân giải chỉ npm:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw kiểm tra API Plugin được công bố / khả năng tương thích Gateway tối thiểu trước khi cài đặt. Khi phiên bản ClawHub được chọn phát hành artifact ClawPack, OpenClaw tải xuống `.tgz` npm-pack có phiên bản, xác minh header digest ClawHub và digest artifact, rồi cài đặt qua đường dẫn archive thông thường. Các phiên bản ClawHub cũ hơn không có metadata ClawPack vẫn cài đặt qua đường dẫn xác minh archive package legacy. Các cài đặt được ghi lại giữ metadata nguồn ClawHub, loại artifact, npm integrity, npm shasum, tên tarball và dữ kiện digest ClawPack để cập nhật về sau.
Cài đặt ClawHub không phiên bản giữ spec được ghi lại không phiên bản để `openclaw plugins update` có thể theo các bản phát hành ClawHub mới hơn; bộ chọn phiên bản hoặc tag rõ ràng như `clawhub:pkg@1.2.3` và `clawhub:pkg@beta` vẫn được ghim vào bộ chọn đó.

#### Viết tắt marketplace

Dùng viết tắt `plugin@marketplace` khi tên marketplace tồn tại trong cache registry cục bộ của Claude tại `~/.claude/plugins/known_marketplaces.json`:

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

Dùng `--marketplace` khi bạn muốn truyền nguồn marketplace một cách tường minh:

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

<Tabs>
  <Tab title="Marketplace sources">
    - một tên marketplace đã biết của Claude từ `~/.claude/plugins/known_marketplaces.json`
    - một gốc marketplace cục bộ hoặc đường dẫn `marketplace.json`
    - dạng viết tắt repo GitHub như `owner/repo`
    - URL repo GitHub như `https://github.com/owner/repo`
    - URL git

  </Tab>
  <Tab title="Remote marketplace rules">
    Đối với các marketplace từ xa được tải từ GitHub hoặc git, các mục Plugin phải nằm trong repo marketplace đã clone. OpenClaw chấp nhận các nguồn đường dẫn tương đối từ repo đó và từ chối HTTP(S), đường dẫn tuyệt đối, git, GitHub, và các nguồn Plugin không phải đường dẫn khác từ manifest từ xa.
  </Tab>
</Tabs>

Đối với đường dẫn cục bộ và kho lưu trữ, OpenClaw tự động phát hiện:

- Plugin OpenClaw gốc (`openclaw.plugin.json`)
- gói tương thích Codex (`.codex-plugin/plugin.json`)
- gói tương thích Claude (`.claude-plugin/plugin.json` hoặc bố cục thành phần Claude mặc định)
- gói tương thích Cursor (`.cursor-plugin/plugin.json`)

<Note>
Các gói tương thích được cài vào gốc Plugin thông thường và tham gia cùng luồng liệt kê/thông tin/bật/tắt. Hiện tại, bundle skills, Claude command-skills, giá trị mặc định `settings.json` của Claude, giá trị mặc định `.lsp.json` / `lspServers` được khai báo trong manifest của Claude, Cursor command-skills, và các thư mục hook Codex tương thích được hỗ trợ; các khả năng gói khác được phát hiện sẽ hiển thị trong chẩn đoán/thông tin nhưng chưa được nối vào thực thi runtime.
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
  Kho kê khai có thể đọc bằng máy cùng chẩn đoán registry và trạng thái cài đặt phụ thuộc gói.
</ParamField>

<Note>
`plugins list` đọc registry Plugin cục bộ đã lưu trước, với phương án dự phòng chỉ dựa trên manifest khi registry bị thiếu hoặc không hợp lệ. Lệnh này hữu ích để kiểm tra một Plugin đã được cài, bật, và hiển thị với kế hoạch khởi động lạnh hay chưa, nhưng không phải là phép dò runtime trực tiếp của một tiến trình Gateway đang chạy. Sau khi thay đổi mã Plugin, trạng thái bật, chính sách hook, hoặc `plugins.load.paths`, hãy khởi động lại Gateway phục vụ kênh trước khi kỳ vọng mã `register(api)` hoặc hook mới chạy. Đối với triển khai từ xa/container, hãy xác minh rằng bạn đang khởi động lại đúng tiến trình con `openclaw gateway run`, không chỉ tiến trình bọc.

`plugins list --json` bao gồm `dependencyStatus` của từng Plugin từ `package.json`
`dependencies` và `optionalDependencies`. OpenClaw kiểm tra liệu các tên gói đó
có hiện diện dọc theo đường dẫn tra cứu Node `node_modules` thông thường của Plugin hay không; nó
không import mã runtime Plugin, chạy trình quản lý gói, hoặc sửa các
phụ thuộc bị thiếu.
</Note>

`plugins search` là phép tra cứu danh mục ClawHub từ xa. Nó không kiểm tra trạng thái
cục bộ, thay đổi cấu hình, cài gói, hoặc tải mã runtime Plugin. Kết quả
tìm kiếm bao gồm tên gói ClawHub, họ, kênh, phiên bản, tóm tắt, và
gợi ý cài đặt như `openclaw plugins install clawhub:<package>`.

Đối với công việc Plugin được đóng gói sẵn bên trong image Docker đã đóng gói, hãy bind-mount thư mục
nguồn Plugin đè lên đường dẫn nguồn đã đóng gói tương ứng, chẳng hạn
`/app/extensions/synology-chat`. OpenClaw sẽ phát hiện lớp phủ nguồn đã mount đó
trước `/app/dist/extensions/synology-chat`; một thư mục nguồn được sao chép thông thường
vẫn bất hoạt để các bản cài đặt đã đóng gói thông thường tiếp tục dùng dist đã biên dịch.

Để gỡ lỗi hook runtime:

- `openclaw plugins inspect <id> --runtime --json` hiển thị các hook đã đăng ký và chẩn đoán từ một lượt kiểm tra tải module. Kiểm tra runtime không bao giờ cài phụ thuộc; dùng `openclaw doctor --fix` để dọn trạng thái phụ thuộc cũ hoặc khôi phục các Plugin có thể tải xuống bị thiếu đang được cấu hình tham chiếu.
- `openclaw gateway status --deep --require-rpc` xác nhận Gateway có thể truy cập, gợi ý dịch vụ/tiến trình, đường dẫn cấu hình, và tình trạng RPC.
- Các hook hội thoại không đóng gói sẵn (`llm_input`, `llm_output`, `before_agent_finalize`, `agent_end`) yêu cầu `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Dùng `--link` để tránh sao chép thư mục cục bộ (thêm vào `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` không được hỗ trợ cùng `--link` vì các bản cài liên kết dùng lại đường dẫn nguồn thay vì sao chép đè lên mục tiêu cài đặt được quản lý.

Dùng `--pin` trên các bản cài npm để lưu spec chính xác đã phân giải (`name@version`) trong chỉ mục Plugin được quản lý trong khi vẫn giữ hành vi mặc định là không ghim.
</Note>

### Chỉ mục Plugin

Siêu dữ liệu cài đặt Plugin là trạng thái được máy quản lý, không phải cấu hình người dùng. Các bản cài và cập nhật ghi nó vào `plugins/installs.json` trong thư mục trạng thái OpenClaw đang hoạt động. Map `installRecords` cấp cao nhất của nó là nguồn bền vững cho siêu dữ liệu cài đặt, bao gồm các bản ghi cho manifest Plugin bị hỏng hoặc bị thiếu. Mảng `plugins` là bộ nhớ đệm registry lạnh được dẫn xuất từ manifest. Tệp này bao gồm cảnh báo không chỉnh sửa và được dùng bởi `openclaw plugins update`, gỡ cài đặt, chẩn đoán, và registry Plugin lạnh.

Khi OpenClaw thấy các bản ghi `plugins.installs` cũ đã được phát hành trong cấu hình, nó di chuyển chúng vào chỉ mục Plugin và xóa khóa cấu hình; nếu một trong hai thao tác ghi thất bại, các bản ghi cấu hình được giữ lại để siêu dữ liệu cài đặt không bị mất.

### Gỡ cài đặt

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` xóa bản ghi Plugin khỏi `plugins.entries`, chỉ mục Plugin đã lưu, các mục danh sách cho phép/từ chối Plugin, và các mục `plugins.load.paths` được liên kết khi áp dụng. Trừ khi đặt `--keep-files`, gỡ cài đặt cũng xóa thư mục cài đặt được quản lý đang được theo dõi khi thư mục đó nằm trong gốc plugin extensions của OpenClaw. Đối với các Plugin Active Memory, slot bộ nhớ đặt lại thành `memory-core`.

<Note>
`--keep-config` được hỗ trợ như một alias đã lỗi thời cho `--keep-files`.
</Note>

### Cập nhật

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

Các bản cập nhật áp dụng cho các bản cài Plugin được theo dõi trong chỉ mục Plugin được quản lý và các bản cài hook-pack được theo dõi trong `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="Resolving plugin id vs npm spec">
    Khi bạn truyền một id Plugin, OpenClaw dùng lại spec cài đặt đã ghi cho Plugin đó. Điều đó có nghĩa là các dist-tag đã lưu trước đó như `@beta` và các phiên bản ghim chính xác tiếp tục được dùng trong các lần chạy `update <id>` sau này.

    Đối với bản cài npm, bạn cũng có thể truyền một spec gói npm tường minh với dist-tag hoặc phiên bản chính xác. OpenClaw phân giải tên gói đó trở lại bản ghi Plugin được theo dõi, cập nhật Plugin đã cài đó, và ghi lại spec npm mới cho các bản cập nhật dựa trên id trong tương lai.

    Truyền tên gói npm mà không có phiên bản hoặc tag cũng phân giải trở lại bản ghi Plugin được theo dõi. Dùng cách này khi một Plugin đã được ghim vào một phiên bản chính xác và bạn muốn chuyển nó trở lại dòng phát hành mặc định của registry.

  </Accordion>
  <Accordion title="Beta channel updates">
    `openclaw plugins update` dùng lại spec Plugin được theo dõi trừ khi bạn truyền một spec mới. `openclaw update` còn biết kênh cập nhật OpenClaw đang hoạt động: trên kênh beta, các bản ghi Plugin npm và ClawHub thuộc dòng mặc định sẽ thử `@beta` trước, rồi quay về spec mặc định/latest đã ghi nếu không có bản phát hành Plugin beta. Phiên bản chính xác và tag tường minh vẫn được ghim vào bộ chọn đó.

  </Accordion>
  <Accordion title="Version checks and integrity drift">
    Trước một bản cập nhật npm trực tiếp, OpenClaw kiểm tra phiên bản gói đã cài so với siêu dữ liệu registry npm. Nếu phiên bản đã cài và định danh artifact đã ghi đã khớp với mục tiêu đã phân giải, bản cập nhật sẽ được bỏ qua mà không tải xuống, cài lại, hoặc ghi lại `openclaw.json`.

    Khi có hash toàn vẹn đã lưu và hash artifact tải về thay đổi, OpenClaw coi đó là trôi dạt artifact npm. Lệnh tương tác `openclaw plugins update` in các hash kỳ vọng và thực tế rồi yêu cầu xác nhận trước khi tiếp tục. Các helper cập nhật không tương tác sẽ fail closed trừ khi bên gọi cung cấp chính sách tiếp tục tường minh.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install on update">
    `--dangerously-force-unsafe-install` cũng có trên `plugins update` như một override khẩn cấp cho các kết quả dương tính giả của bước quét mã nguy hiểm tích hợp trong quá trình cập nhật Plugin. Nó vẫn không bỏ qua các chặn chính sách `before_install` của Plugin hoặc chặn do lỗi quét, và chỉ áp dụng cho cập nhật Plugin, không áp dụng cho cập nhật hook-pack.
  </Accordion>
</AccordionGroup>

### Kiểm tra

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect hiển thị định danh, trạng thái tải, nguồn, khả năng manifest, cờ chính sách, chẩn đoán, siêu dữ liệu cài đặt, khả năng gói, và mọi hỗ trợ máy chủ MCP hoặc LSP được phát hiện mà mặc định không import runtime Plugin. Thêm `--runtime` để tải module Plugin và bao gồm các hook, công cụ, lệnh, dịch vụ, phương thức Gateway, và route HTTP đã đăng ký. Kiểm tra runtime báo cáo trực tiếp các phụ thuộc Plugin bị thiếu; cài đặt và sửa chữa vẫn nằm trong `openclaw plugins install`, `openclaw plugins update`, và `openclaw doctor --fix`.

Các lệnh CLI do Plugin sở hữu được cài làm nhóm lệnh `openclaw` gốc. Sau khi `inspect --runtime` hiển thị một lệnh dưới `cliCommands`, hãy chạy nó dưới dạng `openclaw <command> ...`; ví dụ một Plugin đăng ký `demo-git` có thể được xác minh bằng `openclaw demo-git ping`.

Mỗi Plugin được phân loại theo những gì nó thực sự đăng ký ở runtime:

- **plain-capability** — một loại khả năng (ví dụ một Plugin chỉ dành cho provider)
- **hybrid-capability** — nhiều loại khả năng (ví dụ văn bản + giọng nói + hình ảnh)
- **hook-only** — chỉ hook, không có khả năng hoặc bề mặt
- **non-capability** — công cụ/lệnh/dịch vụ nhưng không có khả năng

Xem [Hình dạng Plugin](/vi/plugins/architecture#plugin-shapes) để biết thêm về mô hình khả năng.

<Note>
Cờ `--json` xuất báo cáo có thể đọc bằng máy, phù hợp cho script và kiểm toán. `inspect --all` kết xuất bảng toàn bộ đội với các cột hình dạng, loại khả năng, thông báo tương thích, khả năng gói, và tóm tắt hook. `info` là alias cho `inspect`.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` báo cáo lỗi tải Plugin, chẩn đoán manifest/phát hiện, và thông báo tương thích. Khi mọi thứ sạch, nó in `No plugin issues detected.`

Nếu một Plugin đã cấu hình có trên đĩa nhưng bị chặn bởi các kiểm tra an toàn đường dẫn của loader, xác thực cấu hình giữ mục Plugin và báo cáo là `present but blocked`. Hãy sửa chẩn đoán Plugin bị chặn đứng trước, chẳng hạn quyền sở hữu đường dẫn hoặc quyền world-writable, thay vì xóa cấu hình `plugins.entries.<id>` hoặc `plugins.allow`.

Đối với các lỗi hình dạng module như thiếu export `register`/`activate`, hãy chạy lại với `OPENCLAW_PLUGIN_LOAD_DEBUG=1` để bao gồm bản tóm tắt hình dạng export ngắn gọn trong đầu ra chẩn đoán.

### Registry

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Sổ đăng ký Plugin cục bộ là mô hình đọc lạnh được lưu bền vững của OpenClaw cho danh tính Plugin đã cài đặt, trạng thái bật, siêu dữ liệu nguồn và quyền sở hữu phần đóng góp. Quy trình khởi động thông thường, tra cứu chủ sở hữu nhà cung cấp, phân loại thiết lập kênh và kiểm kê Plugin có thể đọc mô hình này mà không cần nhập các mô-đun thời gian chạy của Plugin.

Dùng `plugins registry` để kiểm tra xem sổ đăng ký đã lưu có hiện diện, hiện hành hay đã cũ không. Dùng `--refresh` để dựng lại sổ đăng ký từ chỉ mục Plugin đã lưu, chính sách cấu hình và siêu dữ liệu manifest/gói. Đây là đường dẫn sửa chữa, không phải đường dẫn kích hoạt thời gian chạy.

`openclaw doctor --fix` cũng sửa lỗi trôi dạt npm được quản lý ở vùng lân cận sổ đăng ký: nếu một gói `@openclaw/*` mồ côi hoặc được khôi phục dưới gốc npm Plugin được quản lý che khuất một Plugin đi kèm, doctor sẽ xóa gói đã cũ đó và dựng lại sổ đăng ký để quá trình khởi động xác thực theo manifest đi kèm.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` là công tắc tương thích phá kính khẩn cấp đã ngừng khuyến nghị dùng cho lỗi đọc sổ đăng ký. Ưu tiên `plugins registry --refresh` hoặc `openclaw doctor --fix`; phương án dự phòng qua env chỉ dành cho khôi phục khởi động khẩn cấp trong khi quá trình di chuyển được triển khai.
</Warning>

### Chợ ứng dụng

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Danh sách chợ ứng dụng chấp nhận đường dẫn chợ ứng dụng cục bộ, đường dẫn `marketplace.json`, cú pháp rút gọn GitHub như `owner/repo`, URL kho lưu trữ GitHub hoặc URL git. `--json` in nhãn nguồn đã phân giải cùng với manifest chợ ứng dụng đã phân tích và các mục Plugin.

## Liên quan

- [Xây dựng Plugin](/vi/plugins/building-plugins)
- [Tham chiếu CLI](/vi/cli)
- [Plugin cộng đồng](/vi/plugins/community)
