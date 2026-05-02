---
read_when:
    - Bạn muốn cài đặt hoặc quản lý các Plugin Gateway hoặc các gói tương thích
    - Bạn muốn gỡ lỗi các lỗi khi tải Plugin
sidebarTitle: Plugins
summary: Tài liệu tham chiếu CLI cho `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, doctor)
title: Plugin
x-i18n:
    generated_at: "2026-05-02T22:17:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3b077ab0739e2453ccba434aa3b02b1d441bab792b7b131216221a8048d551cd
    source_path: cli/plugins.md
    workflow: 16
---

Quản lý các Plugin Gateway, gói hook và bundle tương thích.

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

Để điều tra các thao tác cài đặt, kiểm tra, gỡ cài đặt hoặc làm mới registry chậm, hãy chạy lệnh với `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`. Trace ghi thời gian từng pha vào stderr và giữ cho đầu ra JSON có thể phân tích cú pháp. Xem [Gỡ lỗi](/vi/help/debugging#plugin-lifecycle-trace).

<Note>
Các Plugin đi kèm được phân phối cùng OpenClaw. Một số được bật theo mặc định (ví dụ: các nhà cung cấp mô hình đi kèm, các nhà cung cấp giọng nói đi kèm và Plugin trình duyệt đi kèm); các Plugin khác yêu cầu `plugins enable`.

Plugin OpenClaw native phải phân phối `openclaw.plugin.json` với JSON Schema nội tuyến (`configSchema`, ngay cả khi rỗng). Các bundle tương thích dùng manifest bundle riêng của chúng.

`plugins list` hiển thị `Format: openclaw` hoặc `Format: bundle`. Đầu ra list/info chi tiết cũng hiển thị subtype của bundle (`codex`, `claude` hoặc `cursor`) cùng các capability bundle được phát hiện.
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
Tên package trần được cài đặt từ npm theo mặc định trong giai đoạn chuyển đổi khi ra mắt. Dùng `clawhub:<package>` cho ClawHub. Hãy coi việc cài đặt Plugin như chạy mã. Ưu tiên các phiên bản đã ghim.
</Warning>

`plugins search` truy vấn ClawHub để tìm các package Plugin có thể cài đặt và in ra tên package sẵn sàng để cài. Lệnh này tìm kiếm các package code-plugin và bundle-plugin, không phải skills. Dùng `openclaw skills search` cho Skills trên ClawHub.

<Note>
ClawHub là bề mặt phân phối và khám phá chính cho hầu hết Plugin. Npm vẫn là đường dẫn dự phòng được hỗ trợ và đường dẫn cài đặt trực tiếp. Các package Plugin `@openclaw/*` thuộc sở hữu OpenClaw đã được phát hành lại trên npm; xem danh sách hiện tại trên [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) hoặc [kho Plugin](/vi/plugins/plugin-inventory). Cài đặt ổn định dùng `latest`. Cài đặt và cập nhật kênh beta ưu tiên dist-tag `beta` của npm khi tag đó có sẵn, rồi mới rơi về `latest`.
</Note>

<AccordionGroup>
  <Accordion title="Include cấu hình và khôi phục cấu hình không hợp lệ">
    Nếu phần `plugins` của bạn được hỗ trợ bởi một `$include` một tệp, `plugins install/update/enable/disable/uninstall` sẽ ghi xuyên qua tệp được include đó và giữ nguyên `openclaw.json`. Include gốc, mảng include và include có override cùng cấp sẽ thất bại đóng thay vì flatten. Xem [Include cấu hình](/vi/gateway/configuration) để biết các dạng được hỗ trợ.

    Nếu cấu hình không hợp lệ trong khi cài đặt, `plugins install` thường thất bại đóng và yêu cầu bạn chạy `openclaw doctor --fix` trước. Trong quá trình khởi động Gateway, cấu hình không hợp lệ của một Plugin được cô lập trong Plugin đó để các kênh và Plugin khác vẫn có thể tiếp tục chạy; `openclaw doctor --fix` có thể cách ly mục Plugin không hợp lệ. Ngoại lệ duy nhất được tài liệu hóa tại thời điểm cài đặt là đường dẫn khôi phục hẹp cho Plugin đi kèm đối với các Plugin chọn rõ ràng `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force và cài đặt lại so với cập nhật">
    `--force` dùng lại đích cài đặt hiện có và ghi đè một Plugin hoặc gói hook đã được cài tại chỗ. Dùng tùy chọn này khi bạn chủ ý cài đặt lại cùng id từ một đường dẫn cục bộ, archive, package ClawHub hoặc artifact npm mới. Với các nâng cấp thông thường của một Plugin npm đã được theo dõi, ưu tiên `openclaw plugins update <id-or-npm-spec>`.

    Nếu bạn chạy `plugins install` cho một id Plugin đã được cài đặt, OpenClaw sẽ dừng lại và chỉ bạn đến `plugins update <id-or-npm-spec>` cho nâng cấp thông thường, hoặc đến `plugins install <package> --force` khi bạn thực sự muốn ghi đè bản cài đặt hiện tại từ một nguồn khác.

  </Accordion>
  <Accordion title="Phạm vi --pin">
    `--pin` chỉ áp dụng cho cài đặt npm. Tùy chọn này không được hỗ trợ với cài đặt `git:`; hãy dùng ref git rõ ràng như `git:github.com/acme/plugin@v1.2.3` khi bạn muốn một nguồn đã ghim. Tùy chọn này không được hỗ trợ với `--marketplace`, vì cài đặt marketplace lưu metadata nguồn marketplace thay vì một spec npm.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` là tùy chọn phá kính dùng khi có false positive trong bộ quét mã nguy hiểm tích hợp. Tùy chọn này cho phép cài đặt tiếp tục ngay cả khi bộ quét tích hợp báo phát hiện mức `critical`, nhưng **không** bỏ qua các chặn chính sách hook `before_install` của Plugin và **không** bỏ qua lỗi quét.

    Cờ CLI này áp dụng cho các luồng cài đặt/cập nhật Plugin. Các cài đặt phụ thuộc Skills do Gateway hỗ trợ dùng override yêu cầu tương ứng `dangerouslyForceUnsafeInstall`, trong khi `openclaw skills install` vẫn là một luồng tải xuống/cài đặt Skills ClawHub riêng.

    Nếu một Plugin bạn đã phát hành trên ClawHub bị chặn bởi lượt quét registry, hãy dùng các bước dành cho nhà phát hành trong [ClawHub](/vi/tools/clawhub).

  </Accordion>
  <Accordion title="Gói hook và spec npm">
    `plugins install` cũng là bề mặt cài đặt cho các gói hook phơi bày `openclaw.hooks` trong `package.json`. Dùng `openclaw hooks` để xem hook có lọc và bật theo từng hook, không phải để cài đặt package.

    Spec npm **chỉ dành cho registry** (tên package + tùy chọn **phiên bản chính xác** hoặc **dist-tag**). Spec Git/URL/file và dải semver bị từ chối. Cài đặt phụ thuộc chạy cục bộ theo dự án với `--ignore-scripts` để an toàn, ngay cả khi shell của bạn có thiết lập cài đặt npm toàn cục.

    Dùng `npm:<package>` khi bạn muốn chỉ rõ việc phân giải npm. Spec package trần cũng cài đặt trực tiếp từ npm trong giai đoạn chuyển đổi khi ra mắt.

    Spec trần và `@latest` ở lại track ổn định. Nếu npm phân giải một trong hai giá trị đó thành prerelease, OpenClaw sẽ dừng lại và yêu cầu bạn chọn tham gia rõ ràng bằng tag prerelease như `@beta`/`@rc` hoặc một phiên bản prerelease chính xác như `@1.2.3-beta.4`.

    Nếu một spec cài đặt trần khớp với id Plugin chính thức (ví dụ `diffs`), OpenClaw sẽ cài đặt trực tiếp mục catalog. Để cài đặt một package npm có cùng tên, hãy dùng spec có scope rõ ràng (ví dụ `@scope/diffs`).

  </Accordion>
  <Accordion title="Kho Git">
    Dùng `git:<repo>` để cài đặt trực tiếp từ một kho git. Các dạng được hỗ trợ gồm `git:github.com/owner/repo`, `git:owner/repo`, URL clone đầy đủ `https://`, `ssh://`, `git://`, `file://` và `git@host:owner/repo.git`. Thêm `@<ref>` hoặc `#<ref>` để checkout một branch, tag hoặc commit trước khi cài đặt.

    Cài đặt Git clone vào một thư mục tạm, checkout ref được yêu cầu khi có, rồi dùng trình cài đặt thư mục Plugin thông thường. Điều đó nghĩa là xác thực manifest, quét mã nguy hiểm, công việc cài đặt bằng trình quản lý package và bản ghi cài đặt hoạt động như cài đặt npm. Bản ghi cài đặt git bao gồm URL/ref nguồn cùng commit đã phân giải để `openclaw plugins update` có thể phân giải lại nguồn về sau.

    Sau khi cài đặt từ git, dùng `openclaw plugins inspect <id> --runtime --json` để xác minh các đăng ký runtime như phương thức gateway và lệnh CLI. Nếu Plugin đã đăng ký một CLI root bằng `api.registerCli`, hãy thực thi lệnh đó trực tiếp qua CLI root của OpenClaw, ví dụ `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Archive">
    Archive được hỗ trợ: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Archive Plugin OpenClaw native phải chứa một `openclaw.plugin.json` hợp lệ tại gốc Plugin đã giải nén; archive chỉ chứa `package.json` bị từ chối trước khi OpenClaw ghi bản ghi cài đặt.

    Cài đặt marketplace Claude cũng được hỗ trợ.

  </Accordion>
</AccordionGroup>

Cài đặt ClawHub dùng locator `clawhub:<package>` rõ ràng:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Spec Plugin an toàn cho npm dạng trần được cài đặt từ npm theo mặc định trong giai đoạn chuyển đổi khi ra mắt:

```bash
openclaw plugins install openclaw-codex-app-server
```

Dùng `npm:` để chỉ rõ phân giải chỉ qua npm:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw kiểm tra khả năng tương thích Plugin API / gateway tối thiểu được quảng bá trước khi cài đặt. Khi phiên bản ClawHub được chọn phát hành một artifact ClawPack, OpenClaw tải xuống `.tgz` npm-pack có phiên bản, xác minh header digest ClawHub và digest artifact, rồi cài đặt qua đường dẫn archive thông thường. Các phiên bản ClawHub cũ hơn không có metadata ClawPack vẫn cài đặt qua đường dẫn xác minh archive package kế thừa. Bản ghi cài đặt giữ metadata nguồn ClawHub, loại artifact, npm integrity, npm shasum, tên tarball và các thông tin digest ClawPack để phục vụ cập nhật sau này.
Cài đặt ClawHub không có phiên bản giữ một spec đã ghi không có phiên bản để `openclaw plugins update` có thể theo các bản phát hành ClawHub mới hơn; các selector phiên bản hoặc tag rõ ràng như `clawhub:pkg@1.2.3` và `clawhub:pkg@beta` vẫn được ghim vào selector đó.

#### Cú pháp rút gọn marketplace

Dùng cú pháp rút gọn `plugin@marketplace` khi tên marketplace tồn tại trong cache registry cục bộ của Claude tại `~/.claude/plugins/known_marketplaces.json`:

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
    Với các marketplace từ xa được tải từ GitHub hoặc git, các mục plugin phải nằm bên trong repo marketplace đã clone. OpenClaw chấp nhận nguồn đường dẫn tương đối từ repo đó và từ chối HTTP(S), đường dẫn tuyệt đối, git, GitHub và các nguồn plugin không phải đường dẫn khác từ manifest từ xa.
  </Tab>
</Tabs>

Với đường dẫn cục bộ và kho lưu trữ, OpenClaw tự động phát hiện:

- Plugin OpenClaw gốc (`openclaw.plugin.json`)
- bundle tương thích với Codex (`.codex-plugin/plugin.json`)
- bundle tương thích với Claude (`.claude-plugin/plugin.json` hoặc bố cục thành phần Claude mặc định)
- bundle tương thích với Cursor (`.cursor-plugin/plugin.json`)

<Note>
Các bundle tương thích cài đặt vào gốc plugin thông thường và tham gia cùng luồng liệt kê/thông tin/bật/tắt. Hiện tại, bundle skills, command-skills của Claude, mặc định `settings.json` của Claude, mặc định `.lsp.json` / `lspServers` do manifest khai báo của Claude, command-skills của Cursor và các thư mục hook Codex tương thích được hỗ trợ; các khả năng bundle khác được phát hiện sẽ hiển thị trong chẩn đoán/thông tin nhưng chưa được nối vào thực thi runtime.
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
  Chuyển từ chế độ xem bảng sang các dòng chi tiết theo từng plugin với metadata nguồn/xuất xứ/phiên bản/kích hoạt.
</ParamField>
<ParamField path="--json" type="boolean">
  Inventory mà máy đọc được, kèm chẩn đoán registry và trạng thái cài đặt phụ thuộc gói.
</ParamField>

<Note>
`plugins list` đọc registry plugin cục bộ đã lưu trước, với fallback dẫn xuất chỉ từ manifest khi registry bị thiếu hoặc không hợp lệ. Lệnh này hữu ích để kiểm tra liệu một plugin đã được cài đặt, bật và hiển thị với lập kế hoạch khởi động lạnh hay chưa, nhưng không phải là phép kiểm tra runtime trực tiếp của một tiến trình Gateway đang chạy. Sau khi thay đổi mã plugin, trạng thái bật, chính sách hook hoặc `plugins.load.paths`, hãy khởi động lại Gateway phục vụ kênh trước khi kỳ vọng mã `register(api)` mới hoặc hook chạy. Với triển khai từ xa/container, hãy xác minh bạn đang khởi động lại đúng tiến trình con `openclaw gateway run`, không chỉ một tiến trình wrapper.

`plugins list --json` bao gồm `dependencyStatus` của từng plugin từ `dependencies` và `optionalDependencies` trong `package.json`. OpenClaw kiểm tra liệu các tên gói đó có hiện diện dọc theo đường dẫn tra cứu `node_modules` Node thông thường của plugin hay không; nó không import mã runtime plugin, chạy trình quản lý gói hoặc sửa các phụ thuộc bị thiếu.
</Note>

`plugins search` là một tra cứu catalog ClawHub từ xa. Nó không kiểm tra trạng thái cục bộ, thay đổi config, cài đặt gói hoặc tải mã runtime plugin. Kết quả tìm kiếm bao gồm tên gói ClawHub, family, channel, phiên bản, tóm tắt và gợi ý cài đặt như `openclaw plugins install clawhub:<package>`.

Với công việc trên plugin đóng gói sẵn bên trong image Docker đã đóng gói, hãy bind-mount thư mục nguồn plugin đè lên đường dẫn nguồn đã đóng gói tương ứng, chẳng hạn `/app/extensions/synology-chat`. OpenClaw sẽ phát hiện lớp phủ nguồn đã mount đó trước `/app/dist/extensions/synology-chat`; một thư mục nguồn được sao chép thuần túy vẫn bất hoạt để các bản cài đặt đóng gói thông thường vẫn dùng dist đã biên dịch.

Để gỡ lỗi hook runtime:

- `openclaw plugins inspect <id> --runtime --json` hiển thị các hook đã đăng ký và chẩn đoán từ một lượt kiểm tra có tải module. Kiểm tra runtime không bao giờ cài đặt phụ thuộc; dùng `openclaw doctor --fix` để dọn trạng thái phụ thuộc legacy hoặc cài đặt các plugin có thể tải xuống bị thiếu đã cấu hình.
- `openclaw gateway status --deep --require-rpc` xác nhận Gateway có thể truy cập, gợi ý service/tiến trình, đường dẫn config và tình trạng RPC.
- Các hook hội thoại không đóng gói sẵn (`llm_input`, `llm_output`, `before_agent_finalize`, `agent_end`) yêu cầu `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Dùng `--link` để tránh sao chép một thư mục cục bộ (thêm vào `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` không được hỗ trợ cùng `--link` vì cài đặt liên kết tái sử dụng đường dẫn nguồn thay vì sao chép đè lên mục tiêu cài đặt được quản lý.

Dùng `--pin` trên các bản cài đặt npm để lưu spec chính xác đã phân giải (`name@version`) trong chỉ mục plugin được quản lý, đồng thời giữ hành vi mặc định không pin.
</Note>

### Chỉ mục Plugin

Metadata cài đặt Plugin là trạng thái do máy quản lý, không phải config người dùng. Cài đặt và cập nhật ghi nó vào `plugins/installs.json` trong thư mục trạng thái OpenClaw đang hoạt động. Map `installRecords` cấp cao nhất là nguồn bền vững của metadata cài đặt, bao gồm bản ghi cho các manifest plugin bị hỏng hoặc bị thiếu. Mảng `plugins` là cache registry lạnh dẫn xuất từ manifest. Tệp bao gồm cảnh báo không chỉnh sửa và được dùng bởi `openclaw plugins update`, gỡ cài đặt, chẩn đoán và registry plugin lạnh.

Khi OpenClaw thấy các bản ghi `plugins.installs` legacy được phát hành trong config, nó di chuyển chúng vào chỉ mục plugin và xóa khóa config; nếu một trong hai thao tác ghi thất bại, các bản ghi config được giữ lại để metadata cài đặt không bị mất.

### Gỡ cài đặt

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` xóa các bản ghi plugin khỏi `plugins.entries`, chỉ mục plugin đã lưu, các mục danh sách cho phép/từ chối plugin và các mục `plugins.load.paths` đã liên kết khi áp dụng được. Trừ khi đặt `--keep-files`, gỡ cài đặt cũng xóa thư mục cài đặt được quản lý đã theo dõi khi thư mục đó nằm trong gốc phần mở rộng plugin của OpenClaw. Với plugin bộ nhớ chủ động, slot bộ nhớ đặt lại về `memory-core`.

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

Cập nhật áp dụng cho các bản cài đặt plugin đã theo dõi trong chỉ mục plugin được quản lý và các bản cài đặt hook-pack đã theo dõi trong `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="Phân giải id plugin so với spec npm">
    Khi bạn truyền một id plugin, OpenClaw tái sử dụng spec cài đặt đã ghi cho plugin đó. Điều này nghĩa là các dist-tag đã lưu trước đó như `@beta` và các phiên bản đã pin chính xác tiếp tục được dùng trong những lần chạy `update <id>` sau.

    Với cài đặt npm, bạn cũng có thể truyền một spec gói npm rõ ràng kèm dist-tag hoặc phiên bản chính xác. OpenClaw phân giải tên gói đó ngược về bản ghi plugin đã theo dõi, cập nhật plugin đã cài đặt đó và ghi spec npm mới cho các cập nhật dựa trên id trong tương lai.

    Truyền tên gói npm không có phiên bản hoặc tag cũng phân giải ngược về bản ghi plugin đã theo dõi. Dùng cách này khi một plugin đã được pin vào một phiên bản chính xác và bạn muốn chuyển nó về dòng phát hành mặc định của registry.

  </Accordion>
  <Accordion title="Cập nhật kênh beta">
    `openclaw plugins update` tái sử dụng spec plugin đã theo dõi trừ khi bạn truyền một spec mới. `openclaw update` còn biết kênh cập nhật OpenClaw đang hoạt động: trên kênh beta, các bản ghi plugin npm dòng mặc định và ClawHub thử `@beta` trước, rồi fallback về spec mặc định/latest đã ghi nếu không có bản phát hành beta của plugin. Các phiên bản chính xác và tag rõ ràng vẫn được pin vào selector đó.

  </Accordion>
  <Accordion title="Kiểm tra phiên bản và lệch integrity">
    Trước một cập nhật npm trực tiếp, OpenClaw kiểm tra phiên bản gói đã cài đặt so với metadata registry npm. Nếu phiên bản đã cài đặt và danh tính artifact đã ghi đã khớp với mục tiêu đã phân giải, cập nhật sẽ được bỏ qua mà không tải xuống, cài đặt lại hoặc ghi lại `openclaw.json`.

    Khi có hash integrity đã lưu và hash artifact được fetch thay đổi, OpenClaw coi đó là lệch artifact npm. Lệnh tương tác `openclaw plugins update` in ra hash kỳ vọng và thực tế rồi yêu cầu xác nhận trước khi tiếp tục. Các helper cập nhật không tương tác sẽ đóng lỗi trừ khi caller cung cấp chính sách tiếp tục rõ ràng.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install khi cập nhật">
    `--dangerously-force-unsafe-install` cũng có trên `plugins update` như một override khẩn cấp cho các cảnh báo dương tính giả của quét mã nguy hiểm tích hợp sẵn trong quá trình cập nhật plugin. Nó vẫn không bỏ qua các chặn chính sách `before_install` của plugin hoặc chặn do lỗi quét, và chỉ áp dụng cho cập nhật plugin, không áp dụng cho cập nhật hook-pack.
  </Accordion>
</AccordionGroup>

### Kiểm tra

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect hiển thị danh tính, trạng thái tải, nguồn, khả năng manifest, cờ chính sách, chẩn đoán, metadata cài đặt, khả năng bundle và mọi hỗ trợ server MCP hoặc LSP được phát hiện mà mặc định không import runtime plugin. Thêm `--runtime` để tải module plugin và bao gồm hook, công cụ, lệnh, service, phương thức gateway và route HTTP đã đăng ký. Kiểm tra runtime báo trực tiếp các phụ thuộc plugin bị thiếu; cài đặt và sửa chữa nằm trong `openclaw plugins install`, `openclaw plugins update` và `openclaw doctor --fix`.

Các lệnh CLI do plugin sở hữu được cài đặt dưới dạng nhóm lệnh `openclaw` gốc. Sau khi `inspect --runtime` hiển thị một lệnh dưới `cliCommands`, hãy chạy lệnh đó dưới dạng `openclaw <command> ...`; ví dụ một plugin đăng ký `demo-git` có thể được xác minh bằng `openclaw demo-git ping`.

Mỗi plugin được phân loại theo những gì nó thực sự đăng ký ở runtime:

- **plain-capability** — một loại khả năng (ví dụ: plugin chỉ có provider)
- **hybrid-capability** — nhiều loại khả năng (ví dụ: văn bản + giọng nói + hình ảnh)
- **hook-only** — chỉ hook, không có khả năng hoặc surface
- **non-capability** — công cụ/lệnh/service nhưng không có khả năng

Xem [Hình dạng Plugin](/vi/plugins/architecture#plugin-shapes) để biết thêm về mô hình khả năng.

<Note>
Cờ `--json` xuất báo cáo mà máy đọc được, phù hợp cho scripting và kiểm toán. `inspect --all` render một bảng toàn bộ fleet với các cột hình dạng, loại khả năng, thông báo tương thích, khả năng bundle và tóm tắt hook. `info` là alias của `inspect`.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` báo lỗi tải plugin, chẩn đoán manifest/discovery và thông báo tương thích. Khi mọi thứ sạch, nó in `No plugin issues detected.`

Với lỗi hình dạng module như thiếu export `register`/`activate`, chạy lại với `OPENCLAW_PLUGIN_LOAD_DEBUG=1` để bao gồm tóm tắt hình dạng export gọn trong đầu ra chẩn đoán.

### Registry

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Registry plugin cục bộ là mô hình đọc lạnh đã lưu của OpenClaw cho danh tính plugin đã cài đặt, trạng thái bật, metadata nguồn và quyền sở hữu đóng góp. Khởi động thông thường, tra cứu chủ sở hữu provider, phân loại thiết lập kênh và inventory plugin có thể đọc nó mà không import module runtime plugin.

Dùng `plugins registry` để kiểm tra liệu registry đã lưu có hiện diện, hiện hành hoặc đã cũ hay không. Dùng `--refresh` để dựng lại từ chỉ mục plugin đã lưu, chính sách config và metadata manifest/package. Đây là đường dẫn sửa chữa, không phải đường dẫn kích hoạt runtime.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` là công tắc tương thích khẩn cấp đã bị phản đối dùng cho các lỗi đọc sổ đăng ký. Ưu tiên `plugins registry --refresh` hoặc `openclaw doctor --fix`; phương án dự phòng bằng biến môi trường chỉ dành cho việc khôi phục khởi động khẩn cấp trong khi quá trình di chuyển đang được triển khai.
</Warning>

### Chợ ứng dụng

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Lệnh liệt kê chợ ứng dụng chấp nhận đường dẫn chợ ứng dụng cục bộ, đường dẫn `marketplace.json`, cách viết tắt GitHub như `owner/repo`, URL kho GitHub hoặc URL git. `--json` in nhãn nguồn đã phân giải cùng với bản kê khai chợ ứng dụng đã phân tích cú pháp và các mục Plugin.

## Liên quan

- [Xây dựng Plugin](/vi/plugins/building-plugins)
- [Tham chiếu CLI](/vi/cli)
- [Plugin cộng đồng](/vi/plugins/community)
