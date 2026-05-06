---
read_when:
    - Bạn muốn cài đặt hoặc quản lý các Plugin Gateway hoặc các gói tương thích
    - Bạn muốn gỡ lỗi khi tải Plugin thất bại
sidebarTitle: Plugins
summary: Tài liệu tham khảo CLI cho `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, doctor)
title: Plugin
x-i18n:
    generated_at: "2026-05-06T17:54:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 734366b6bbee5f036fdc2cfac5197ae86d2e8fbc7c977ccc4e22add2f4206951
    source_path: cli/plugins.md
    workflow: 16
---

Quản lý các Plugin Gateway, gói hook và bundle tương thích.

<CardGroup cols={2}>
  <Card title="Plugin system" href="/vi/tools/plugin">
    Hướng dẫn cho người dùng cuối về cài đặt, bật và khắc phục sự cố Plugin.
  </Card>
  <Card title="Manage plugins" href="/vi/plugins/manage-plugins">
    Ví dụ nhanh về cài đặt, liệt kê, cập nhật, gỡ cài đặt và xuất bản.
  </Card>
  <Card title="Plugin bundles" href="/vi/plugins/bundles">
    Mô hình tương thích bundle.
  </Card>
  <Card title="Plugin manifest" href="/vi/plugins/manifest">
    Các trường manifest và schema cấu hình.
  </Card>
  <Card title="Security" href="/vi/gateway/security">
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

Để điều tra các thao tác cài đặt, kiểm tra, gỡ cài đặt hoặc làm mới registry bị chậm, hãy chạy lệnh với `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`. Trace ghi thời lượng từng pha vào stderr và giữ cho đầu ra JSON vẫn có thể phân tích cú pháp. Xem [Gỡ lỗi](/vi/help/debugging#plugin-lifecycle-trace).

<Note>
Ở chế độ Nix (`OPENCLAW_NIX_MODE=1`), các thao tác thay đổi vòng đời Plugin bị tắt. Thay vào đó, hãy dùng nguồn Nix cho lượt cài đặt này thay vì `plugins install`, `plugins update`, `plugins uninstall`, `plugins enable` hoặc `plugins disable`; với nix-openclaw, hãy dùng [Bắt đầu nhanh](https://github.com/openclaw/nix-openclaw#quick-start) ưu tiên agent.
</Note>

<Note>
Các Plugin đi kèm được phát hành cùng OpenClaw. Một số được bật theo mặc định (ví dụ các nhà cung cấp mô hình đi kèm, nhà cung cấp giọng nói đi kèm và Plugin trình duyệt đi kèm); các Plugin khác cần `plugins enable`.

Plugin OpenClaw gốc phải phát hành `openclaw.plugin.json` với JSON Schema nội tuyến (`configSchema`, ngay cả khi rỗng). Các bundle tương thích dùng manifest bundle riêng của chúng.

`plugins list` hiển thị `Format: openclaw` hoặc `Format: bundle`. Đầu ra list/info chi tiết cũng hiển thị kiểu con của bundle (`codex`, `claude` hoặc `cursor`) cùng các năng lực bundle được phát hiện.
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
Tên gói trần cài đặt từ npm theo mặc định trong giai đoạn chuyển đổi ra mắt. Dùng `clawhub:<package>` cho ClawHub. Hãy xem việc cài đặt Plugin như chạy mã. Ưu tiên các phiên bản đã ghim.
</Warning>

`plugins search` truy vấn ClawHub để tìm các gói Plugin có thể cài đặt và in ra tên gói sẵn sàng để cài đặt. Lệnh này tìm kiếm các gói code-plugin và bundle-plugin, không phải Skills. Dùng `openclaw skills search` cho Skills trên ClawHub.

<Note>
ClawHub là bề mặt phân phối và khám phá chính cho hầu hết Plugin. Npm vẫn là đường dự phòng và cài đặt trực tiếp được hỗ trợ. Các gói Plugin `@openclaw/*` do OpenClaw sở hữu lại được xuất bản trên npm; xem danh sách hiện tại trên [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) hoặc [kho Plugin](/vi/plugins/plugin-inventory). Các lượt cài đặt ổn định dùng `latest`. Các lượt cài đặt và cập nhật kênh beta ưu tiên dist-tag `beta` của npm khi tag đó có sẵn, sau đó rơi về `latest`.
</Note>

<AccordionGroup>
  <Accordion title="Config includes and invalid-config repair">
    Nếu phần `plugins` của bạn được hỗ trợ bởi một `$include` một tệp, `plugins install/update/enable/disable/uninstall` ghi xuyên tới tệp được include đó và không chạm vào `openclaw.json`. Include gốc, mảng include và include có ghi đè cùng cấp sẽ đóng thất bại thay vì làm phẳng. Xem [Include cấu hình](/vi/gateway/configuration) để biết các dạng được hỗ trợ.

    Nếu cấu hình không hợp lệ trong lúc cài đặt, `plugins install` thường đóng thất bại và yêu cầu bạn chạy `openclaw doctor --fix` trước. Trong quá trình khởi động Gateway và tải lại nóng, cấu hình Plugin không hợp lệ đóng thất bại như mọi cấu hình không hợp lệ khác; `openclaw doctor --fix` có thể cách ly mục Plugin không hợp lệ. Ngoại lệ duy nhất được ghi tài liệu tại thời điểm cài đặt là một đường khôi phục hẹp cho Plugin đi kèm, dành cho các Plugin chủ động chọn dùng `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force and reinstall vs update">
    `--force` tái sử dụng đích cài đặt hiện có và ghi đè tại chỗ một Plugin hoặc gói hook đã được cài đặt. Dùng tùy chọn này khi bạn cố ý cài đặt lại cùng một id từ đường dẫn cục bộ, archive, gói ClawHub hoặc artifact npm mới. Với các nâng cấp thông thường của một Plugin npm đã được theo dõi, hãy ưu tiên `openclaw plugins update <id-or-npm-spec>`.

    Nếu bạn chạy `plugins install` cho một id Plugin đã được cài đặt, OpenClaw dừng lại và chỉ bạn tới `plugins update <id-or-npm-spec>` cho một nâng cấp thông thường, hoặc tới `plugins install <package> --force` khi bạn thực sự muốn ghi đè lượt cài đặt hiện tại từ một nguồn khác.

  </Accordion>
  <Accordion title="--pin scope">
    `--pin` chỉ áp dụng cho các lượt cài đặt npm. Tùy chọn này không được hỗ trợ với lượt cài đặt `git:`; hãy dùng ref Git rõ ràng như `git:github.com/acme/plugin@v1.2.3` khi bạn muốn một nguồn được ghim. Tùy chọn này không được hỗ trợ với `--marketplace`, vì các lượt cài đặt marketplace lưu siêu dữ liệu nguồn marketplace thay vì một spec npm.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` là tùy chọn phá kính khẩn cấp cho các dương tính giả trong trình quét mã nguy hiểm tích hợp. Tùy chọn này cho phép quá trình cài đặt tiếp tục ngay cả khi trình quét tích hợp báo cáo phát hiện `critical`, nhưng **không** bỏ qua các chặn chính sách hook `before_install` của Plugin và **không** bỏ qua lỗi quét.

    Cờ CLI này áp dụng cho các luồng cài đặt/cập nhật Plugin. Các lượt cài đặt phụ thuộc Skills dựa trên Gateway dùng override yêu cầu tương ứng `dangerouslyForceUnsafeInstall`, trong khi `openclaw skills install` vẫn là một luồng tải xuống/cài đặt Skills ClawHub riêng.

    Nếu một Plugin bạn đã xuất bản trên ClawHub bị chặn bởi một lần quét registry, hãy dùng các bước dành cho nhà xuất bản trong [ClawHub](/vi/tools/clawhub).

  </Accordion>
  <Accordion title="Hook packs and npm specs">
    `plugins install` cũng là bề mặt cài đặt cho các gói hook phơi bày `openclaw.hooks` trong `package.json`. Dùng `openclaw hooks` để xem hook đã lọc và bật từng hook, không phải để cài đặt gói.

    Spec npm là **chỉ registry** (tên gói + tùy chọn **phiên bản chính xác** hoặc **dist-tag**). Spec Git/URL/tệp và dải semver bị từ chối. Các lượt cài đặt phụ thuộc chạy cục bộ theo dự án với `--ignore-scripts` để an toàn, ngay cả khi shell của bạn có thiết lập cài đặt npm toàn cục. Các gốc npm Plugin được quản lý thừa hưởng `overrides` npm cấp gói của OpenClaw, nên các pin bảo mật của host cũng áp dụng cho phụ thuộc Plugin được hoist.

    Dùng `npm:<package>` khi bạn muốn làm rõ việc phân giải npm. Các spec gói trần cũng cài đặt trực tiếp từ npm trong giai đoạn chuyển đổi ra mắt.

    Spec trần và `@latest` vẫn ở nhánh ổn định. Các phiên bản hiệu chỉnh có dấu ngày của OpenClaw như `2026.5.3-1` là bản phát hành ổn định cho kiểm tra này. Nếu npm phân giải một trong hai loại đó thành bản tiền phát hành, OpenClaw dừng lại và yêu cầu bạn chủ động chọn tham gia bằng một tag tiền phát hành như `@beta`/`@rc` hoặc một phiên bản tiền phát hành chính xác như `@1.2.3-beta.4`.

    Nếu một spec cài đặt trần khớp với id Plugin chính thức (ví dụ `diffs`), OpenClaw cài đặt trực tiếp mục trong catalog. Để cài đặt một gói npm cùng tên, hãy dùng một spec có scope rõ ràng (ví dụ `@scope/diffs`).

  </Accordion>
  <Accordion title="Git repositories">
    Dùng `git:<repo>` để cài đặt trực tiếp từ một kho Git. Các dạng được hỗ trợ gồm `git:github.com/owner/repo`, `git:owner/repo`, URL clone đầy đủ `https://`, `ssh://`, `git://`, `file://` và `git@host:owner/repo.git`. Thêm `@<ref>` hoặc `#<ref>` để checkout một nhánh, tag hoặc commit trước khi cài đặt.

    Lượt cài đặt Git clone vào một thư mục tạm, checkout ref được yêu cầu khi có, rồi dùng trình cài đặt thư mục Plugin bình thường. Điều đó có nghĩa là xác thực manifest, quét mã nguy hiểm, công việc cài đặt của trình quản lý gói và bản ghi cài đặt hoạt động giống lượt cài đặt npm. Các lượt cài đặt Git được ghi lại bao gồm URL/ref nguồn cùng commit đã phân giải để `openclaw plugins update` có thể phân giải lại nguồn sau này.

    Sau khi cài đặt từ Git, dùng `openclaw plugins inspect <id> --runtime --json` để xác minh các đăng ký runtime như phương thức gateway và lệnh CLI. Nếu Plugin đã đăng ký một gốc CLI bằng `api.registerCli`, hãy thực thi lệnh đó trực tiếp qua CLI gốc của OpenClaw, ví dụ `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Archives">
    Archive được hỗ trợ: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Archive Plugin OpenClaw gốc phải chứa `openclaw.plugin.json` hợp lệ tại gốc Plugin đã giải nén; các archive chỉ chứa `package.json` bị từ chối trước khi OpenClaw ghi bản ghi cài đặt.

    Dùng `npm-pack:<path.tgz>` khi tệp là tarball npm-pack và bạn muốn kiểm thử cùng đường cài đặt gốc npm được quản lý như các lượt cài đặt registry, bao gồm xác minh `package-lock.json`, quét phụ thuộc được hoist và bản ghi cài đặt npm. Đường dẫn archive thuần vẫn cài đặt dưới dạng archive cục bộ dưới gốc tiện ích mở rộng Plugin.

    Lượt cài đặt marketplace Claude cũng được hỗ trợ.

  </Accordion>
</AccordionGroup>

Các lượt cài đặt ClawHub dùng locator `clawhub:<package>` rõ ràng:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Các spec Plugin an toàn với npm dạng trần cài đặt từ npm theo mặc định trong giai đoạn chuyển đổi ra mắt:

```bash
openclaw plugins install openclaw-codex-app-server
```

Dùng `npm:` để làm rõ việc phân giải chỉ npm:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw kiểm tra khả năng tương thích của API Plugin được công bố / Gateway tối thiểu trước khi cài đặt. Khi phiên bản ClawHub được chọn phát hành artifact ClawPack, OpenClaw tải xuống `.tgz` npm-pack có phiên bản, xác minh header digest của ClawHub và digest của artifact, rồi cài đặt qua đường dẫn lưu trữ thông thường. Các phiên bản ClawHub cũ hơn không có siêu dữ liệu ClawPack vẫn cài đặt qua đường dẫn xác minh lưu trữ gói kế thừa. Các bản cài đặt đã ghi giữ lại siêu dữ liệu nguồn ClawHub, loại artifact, npm integrity, npm shasum, tên tarball và các thông tin digest ClawPack để cập nhật sau này.
Các bản cài đặt ClawHub không có phiên bản giữ một spec đã ghi không có phiên bản để `openclaw plugins update` có thể theo các bản phát hành ClawHub mới hơn; các bộ chọn phiên bản hoặc tag tường minh như `clawhub:pkg@1.2.3` và `clawhub:pkg@beta` vẫn được ghim vào bộ chọn đó.

#### Cách viết tắt marketplace

Dùng cách viết tắt `plugin@marketplace` khi tên marketplace tồn tại trong cache registry cục bộ của Claude tại `~/.claude/plugins/known_marketplaces.json`:

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
  <Tab title="Nguồn marketplace">
    - tên marketplace đã biết của Claude từ `~/.claude/plugins/known_marketplaces.json`
    - gốc marketplace cục bộ hoặc đường dẫn `marketplace.json`
    - cách viết tắt repo GitHub như `owner/repo`
    - URL repo GitHub như `https://github.com/owner/repo`
    - URL git

  </Tab>
  <Tab title="Quy tắc marketplace từ xa">
    Đối với marketplace từ xa được tải từ GitHub hoặc git, các mục Plugin phải nằm bên trong repo marketplace đã clone. OpenClaw chấp nhận các nguồn đường dẫn tương đối từ repo đó và từ chối các nguồn Plugin HTTP(S), đường dẫn tuyệt đối, git, GitHub và các nguồn Plugin không phải đường dẫn khác từ manifest từ xa.
  </Tab>
</Tabs>

Đối với đường dẫn cục bộ và kho lưu trữ, OpenClaw tự động phát hiện:

- Plugin OpenClaw gốc (`openclaw.plugin.json`)
- bundle tương thích Codex (`.codex-plugin/plugin.json`)
- bundle tương thích Claude (`.claude-plugin/plugin.json` hoặc bố cục thành phần Claude mặc định)
- bundle tương thích Cursor (`.cursor-plugin/plugin.json`)

<Note>
Các bundle tương thích được cài đặt vào gốc Plugin thông thường và tham gia cùng luồng list/info/enable/disable. Hiện tại, bundle skills, command-skills của Claude, mặc định `settings.json` của Claude, mặc định `.lsp.json` / `lspServers` được khai báo trong manifest của Claude, command-skills của Cursor và các thư mục hook Codex tương thích được hỗ trợ; các khả năng bundle được phát hiện khác được hiển thị trong diagnostics/info nhưng chưa được nối vào thực thi runtime.
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
  Inventory có thể đọc bằng máy cùng diagnostics registry và trạng thái cài đặt phụ thuộc gói.
</ParamField>

<Note>
`plugins list` đọc registry Plugin cục bộ đã lưu trước, với fallback dẫn xuất chỉ từ manifest khi registry bị thiếu hoặc không hợp lệ. Lệnh này hữu ích để kiểm tra một Plugin có được cài đặt, bật và hiển thị với kế hoạch khởi động lạnh hay không, nhưng không phải là probe runtime trực tiếp của một tiến trình Gateway đang chạy. Sau khi thay đổi mã Plugin, trạng thái bật, chính sách hook hoặc `plugins.load.paths`, hãy khởi động lại Gateway phục vụ kênh trước khi kỳ vọng mã `register(api)` hoặc hook mới chạy. Đối với triển khai từ xa/container, hãy xác minh rằng bạn đang khởi động lại đúng tiến trình con `openclaw gateway run` thực tế, không chỉ một tiến trình wrapper.

`plugins list --json` bao gồm `dependencyStatus` của từng Plugin từ `dependencies` và `optionalDependencies` trong `package.json`. OpenClaw kiểm tra liệu các tên gói đó có hiện diện dọc theo đường dẫn tra cứu `node_modules` Node thông thường của Plugin hay không; nó không import mã runtime Plugin, chạy trình quản lý gói hoặc sửa các phụ thuộc bị thiếu.
</Note>

`plugins search` là thao tác tra cứu catalog ClawHub từ xa. Nó không kiểm tra trạng thái cục bộ, thay đổi config, cài đặt gói hoặc tải mã runtime Plugin. Kết quả tìm kiếm bao gồm tên gói ClawHub, family, channel, version, summary và gợi ý cài đặt như `openclaw plugins install clawhub:<package>`.

Đối với công việc trên Plugin được đóng gói bên trong image Docker đã đóng gói, hãy bind-mount thư mục nguồn Plugin lên đường dẫn nguồn đã đóng gói tương ứng, chẳng hạn `/app/extensions/synology-chat`. OpenClaw sẽ phát hiện lớp phủ nguồn đã mount đó trước `/app/dist/extensions/synology-chat`; một thư mục nguồn chỉ được copy sẽ vẫn bất hoạt để các bản cài đặt đóng gói thông thường vẫn dùng dist đã biên dịch.

Để gỡ lỗi hook runtime:

- `openclaw plugins inspect <id> --runtime --json` hiển thị các hook đã đăng ký và diagnostics từ một lượt kiểm tra đã tải module. Kiểm tra runtime không bao giờ cài đặt phụ thuộc; dùng `openclaw doctor --fix` để dọn trạng thái phụ thuộc kế thừa hoặc khôi phục các Plugin có thể tải xuống bị thiếu đang được config tham chiếu.
- `openclaw gateway status --deep --require-rpc` xác nhận Gateway có thể truy cập, gợi ý service/process, đường dẫn config và sức khỏe RPC.
- Các hook hội thoại không được bundle (`llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize`, `agent_end`) yêu cầu `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Dùng `--link` để tránh copy một thư mục cục bộ (thêm vào `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` không được hỗ trợ cùng `--link` vì các bản cài đặt liên kết tái sử dụng đường dẫn nguồn thay vì copy đè lên mục tiêu cài đặt được quản lý.

Dùng `--pin` trên các bản cài đặt npm để lưu spec chính xác đã phân giải (`name@version`) trong chỉ mục Plugin được quản lý trong khi vẫn giữ hành vi mặc định không ghim.
</Note>

### Chỉ mục Plugin

Siêu dữ liệu cài đặt Plugin là trạng thái do máy quản lý, không phải config của người dùng. Các bản cài đặt và cập nhật ghi nó vào `plugins/installs.json` dưới thư mục trạng thái OpenClaw đang hoạt động. Map `installRecords` cấp cao nhất của nó là nguồn bền vững của siêu dữ liệu cài đặt, bao gồm các bản ghi cho manifest Plugin bị hỏng hoặc bị thiếu. Mảng `plugins` là cache registry lạnh dẫn xuất từ manifest. Tệp bao gồm cảnh báo không chỉnh sửa và được `openclaw plugins update`, uninstall, diagnostics và registry Plugin lạnh sử dụng.

Khi OpenClaw thấy các bản ghi `plugins.installs` kế thừa đã phát hành trong config, các lượt đọc runtime xem chúng là đầu vào tương thích mà không ghi lại `openclaw.json`. Các lượt ghi Plugin tường minh và `openclaw doctor --fix` chuyển các bản ghi đó vào chỉ mục Plugin và xóa key config khi được phép ghi config; nếu một trong hai lượt ghi thất bại, các bản ghi config được giữ lại để siêu dữ liệu cài đặt không bị mất.

### Gỡ cài đặt

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` xóa các bản ghi Plugin khỏi `plugins.entries`, chỉ mục Plugin đã lưu, các mục danh sách allow/deny của Plugin và các mục `plugins.load.paths` đã liên kết khi áp dụng. Trừ khi đặt `--keep-files`, uninstall cũng xóa thư mục cài đặt được quản lý đã theo dõi khi nó nằm bên trong gốc phần mở rộng Plugin của OpenClaw. Đối với Plugin active memory, slot bộ nhớ đặt lại về `memory-core`.

<Note>
`--keep-config` được hỗ trợ như một alias đã ngừng khuyến nghị cho `--keep-files`.
</Note>

### Cập nhật

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

Các bản cập nhật áp dụng cho các bản cài đặt Plugin đã theo dõi trong chỉ mục Plugin được quản lý và các bản cài đặt hook-pack đã theo dõi trong `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="Phân giải id Plugin so với spec npm">
    Khi bạn truyền một id Plugin, OpenClaw tái sử dụng spec cài đặt đã ghi cho Plugin đó. Điều đó có nghĩa là các dist-tag đã lưu trước đó như `@beta` và các phiên bản ghim chính xác tiếp tục được dùng trong các lần chạy `update <id>` sau này.

    Đối với các bản cài đặt npm, bạn cũng có thể truyền một spec gói npm tường minh với dist-tag hoặc phiên bản chính xác. OpenClaw phân giải tên gói đó trở lại bản ghi Plugin đã theo dõi, cập nhật Plugin đã cài đặt đó và ghi spec npm mới cho các bản cập nhật dựa trên id trong tương lai.

    Việc truyền tên gói npm không kèm phiên bản hoặc tag cũng phân giải trở lại bản ghi Plugin đã theo dõi. Dùng cách này khi một Plugin đã được ghim vào một phiên bản chính xác và bạn muốn chuyển nó trở lại dòng phát hành mặc định của registry.

  </Accordion>
  <Accordion title="Cập nhật kênh beta">
    `openclaw plugins update` tái sử dụng spec Plugin đã theo dõi trừ khi bạn truyền spec mới. `openclaw update` còn biết kênh cập nhật OpenClaw đang hoạt động: trên kênh beta, các bản ghi Plugin npm và ClawHub thuộc dòng mặc định thử `@beta` trước, rồi fallback về spec default/latest đã ghi nếu không có bản phát hành beta của Plugin. Các phiên bản chính xác và tag tường minh vẫn được ghim vào bộ chọn đó.

  </Accordion>
  <Accordion title="Kiểm tra phiên bản và drift integrity">
    Trước một bản cập nhật npm trực tiếp, OpenClaw kiểm tra phiên bản gói đã cài đặt với siêu dữ liệu registry npm. Nếu phiên bản đã cài đặt và danh tính artifact đã ghi đã khớp với mục tiêu đã phân giải, bản cập nhật sẽ bị bỏ qua mà không tải xuống, cài đặt lại hoặc ghi lại `openclaw.json`.

    Khi tồn tại hash integrity đã lưu và hash artifact đã fetch thay đổi, OpenClaw xem đó là drift artifact npm. Lệnh tương tác `openclaw plugins update` in các hash kỳ vọng và thực tế rồi yêu cầu xác nhận trước khi tiếp tục. Các helper cập nhật không tương tác fail closed trừ khi bên gọi cung cấp một chính sách tiếp tục tường minh.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install khi cập nhật">
    `--dangerously-force-unsafe-install` cũng có sẵn trên `plugins update` như một override khẩn cấp cho các false positive của quét mã nguy hiểm tích hợp trong quá trình cập nhật Plugin. Nó vẫn không bỏ qua các chặn chính sách `before_install` của Plugin hoặc chặn lỗi quét, và chỉ áp dụng cho cập nhật Plugin, không áp dụng cho cập nhật hook-pack.
  </Accordion>
</AccordionGroup>

### Kiểm tra

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect hiển thị danh tính, trạng thái tải, nguồn, khả năng manifest, cờ chính sách, diagnostics, siêu dữ liệu cài đặt, khả năng bundle và mọi hỗ trợ MCP hoặc LSP server được phát hiện mà mặc định không import runtime Plugin. Thêm `--runtime` để tải module Plugin và bao gồm các hook, tool, lệnh, service, phương thức Gateway và route HTTP đã đăng ký. Kiểm tra runtime báo cáo trực tiếp các phụ thuộc Plugin bị thiếu; cài đặt và sửa chữa nằm trong `openclaw plugins install`, `openclaw plugins update` và `openclaw doctor --fix`.

Các lệnh CLI do Plugin sở hữu được cài đặt dưới dạng các nhóm lệnh `openclaw` gốc. Sau khi `inspect --runtime` hiển thị một lệnh dưới `cliCommands`, hãy chạy nó dưới dạng `openclaw <command> ...`; ví dụ một Plugin đăng ký `demo-git` có thể được xác minh bằng `openclaw demo-git ping`.

Mỗi Plugin được phân loại theo những gì nó thực sự đăng ký tại runtime:

- **plain-capability** — một loại khả năng (ví dụ: Plugin chỉ dành cho nhà cung cấp)
- **hybrid-capability** — nhiều loại khả năng (ví dụ: văn bản + giọng nói + hình ảnh)
- **hook-only** — chỉ có hook, không có khả năng hoặc bề mặt
- **non-capability** — công cụ/lệnh/dịch vụ nhưng không có khả năng

Xem [hình dạng Plugin](/vi/plugins/architecture#plugin-shapes) để biết thêm về mô hình khả năng.

<Note>
Cờ `--json` xuất báo cáo mà máy có thể đọc được, phù hợp cho viết script và kiểm toán. `inspect --all` hiển thị bảng cho toàn bộ đội gồm hình dạng, loại khả năng, thông báo tương thích, khả năng của gói và các cột tóm tắt hook. `info` là bí danh của `inspect`.
</Note>

### Chẩn đoán

```bash
openclaw plugins doctor
```

`doctor` báo cáo lỗi tải Plugin, chẩn đoán manifest/khám phá và thông báo tương thích. Khi mọi thứ đều sạch, lệnh này in ra `No plugin issues detected.`

Nếu một Plugin đã cấu hình có trên đĩa nhưng bị chặn bởi các kiểm tra an toàn đường dẫn của trình tải, xác thực cấu hình giữ lại mục nhập Plugin và báo cáo mục đó là `present but blocked`. Hãy sửa chẩn đoán Plugin bị chặn xuất hiện trước đó, chẳng hạn quyền sở hữu đường dẫn hoặc quyền world-writable, thay vì xóa cấu hình `plugins.entries.<id>` hoặc `plugins.allow`.

Đối với lỗi hình dạng mô-đun như thiếu export `register`/`activate`, hãy chạy lại với `OPENCLAW_PLUGIN_LOAD_DEBUG=1` để đưa phần tóm tắt ngắn gọn về hình dạng export vào đầu ra chẩn đoán.

### Sổ đăng ký

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Sổ đăng ký Plugin cục bộ là mô hình đọc lạnh được lưu bền vững của OpenClaw cho danh tính Plugin đã cài đặt, trạng thái bật, siêu dữ liệu nguồn và quyền sở hữu đóng góp. Quy trình khởi động bình thường, tra cứu chủ sở hữu nhà cung cấp, phân loại thiết lập kênh và kiểm kê Plugin có thể đọc nó mà không cần nhập các mô-đun runtime của Plugin.

Dùng `plugins registry` để kiểm tra sổ đăng ký đã lưu bền vững hiện có, còn hiện hành hay đã cũ. Dùng `--refresh` để dựng lại từ chỉ mục Plugin đã lưu bền vững, chính sách cấu hình và siêu dữ liệu manifest/package. Đây là đường dẫn sửa chữa, không phải đường dẫn kích hoạt runtime.

`openclaw doctor --fix` cũng sửa drift npm được quản lý gần với sổ đăng ký: nếu một package `@openclaw/*` mồ côi hoặc được khôi phục trong thư mục gốc npm Plugin được quản lý che khuất một Plugin đi kèm, doctor sẽ xóa package cũ đó và dựng lại sổ đăng ký để quá trình khởi động xác thực theo manifest đi kèm.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` là công tắc tương thích khẩn cấp đã lỗi thời cho lỗi đọc sổ đăng ký. Nên dùng `plugins registry --refresh` hoặc `openclaw doctor --fix`; phương án dự phòng bằng env chỉ dành cho khôi phục khởi động khẩn cấp trong khi migration được triển khai.
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Danh sách Marketplace chấp nhận đường dẫn marketplace cục bộ, đường dẫn `marketplace.json`, dạng viết tắt GitHub như `owner/repo`, URL repo GitHub hoặc URL git. `--json` in nhãn nguồn đã phân giải cùng manifest marketplace đã phân tích cú pháp và các mục nhập Plugin.

## Liên quan

- [Xây dựng Plugin](/vi/plugins/building-plugins)
- [Tham chiếu CLI](/vi/cli)
- [Plugin cộng đồng](/vi/plugins/community)
