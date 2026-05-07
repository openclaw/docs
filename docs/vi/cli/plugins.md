---
read_when:
    - Bạn muốn cài đặt hoặc quản lý các Plugin Gateway hoặc các gói tương thích
    - Bạn muốn gỡ lỗi các sự cố tải Plugin
sidebarTitle: Plugins
summary: Tham chiếu CLI cho `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, doctor)
title: Plugin
x-i18n:
    generated_at: "2026-05-07T01:51:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: c43d51a8ecc2d420991e7beb585cbf3046d44cd6dca755377f4c050c7a155064
    source_path: cli/plugins.md
    workflow: 16
---

Quản lý các Plugin Gateway, gói hook và bundle tương thích.

<CardGroup cols={2}>
  <Card title="Hệ thống Plugin" href="/vi/tools/plugin">
    Hướng dẫn cho người dùng cuối về cài đặt, bật và khắc phục sự cố plugin.
  </Card>
  <Card title="Quản lý plugin" href="/vi/plugins/manage-plugins">
    Ví dụ nhanh về cài đặt, liệt kê, cập nhật, gỡ cài đặt và phát hành.
  </Card>
  <Card title="Bundle Plugin" href="/vi/plugins/bundles">
    Mô hình tương thích bundle.
  </Card>
  <Card title="Manifest Plugin" href="/vi/plugins/manifest">
    Các trường manifest và schema cấu hình.
  </Card>
  <Card title="Bảo mật" href="/vi/gateway/security">
    Gia cố bảo mật cho các lượt cài đặt plugin.
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

Để điều tra thao tác cài đặt, kiểm tra, gỡ cài đặt hoặc làm mới registry chậm, hãy chạy lệnh với `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`. Trace ghi thời lượng từng pha vào stderr và giữ cho đầu ra JSON vẫn có thể phân tích cú pháp. Xem [Gỡ lỗi](/vi/help/debugging#plugin-lifecycle-trace).

<Note>
Ở chế độ Nix (`OPENCLAW_NIX_MODE=1`), các thao tác thay đổi vòng đời plugin bị tắt. Thay vì `plugins install`, `plugins update`, `plugins uninstall`, `plugins enable`, hoặc `plugins disable`, hãy dùng nguồn Nix cho lượt cài đặt này; với nix-openclaw, hãy dùng [Bắt đầu nhanh](https://github.com/openclaw/nix-openclaw#quick-start) ưu tiên agent.
</Note>

<Note>
Các plugin đi kèm được phân phối cùng OpenClaw. Một số được bật mặc định (ví dụ nhà cung cấp mô hình đi kèm, nhà cung cấp giọng nói đi kèm và plugin trình duyệt đi kèm); các plugin khác yêu cầu `plugins enable`.

Plugin OpenClaw gốc phải phân phối `openclaw.plugin.json` kèm JSON Schema nội tuyến (`configSchema`, kể cả khi rỗng). Các bundle tương thích dùng manifest bundle riêng của chúng.

`plugins list` hiển thị `Format: openclaw` hoặc `Format: bundle`. Đầu ra list/info chi tiết cũng hiển thị subtype của bundle (`codex`, `claude`, hoặc `cursor`) cùng các khả năng bundle được phát hiện.
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
Tên gói trần cài đặt từ npm theo mặc định trong giai đoạn chuyển đổi lúc ra mắt. Dùng `clawhub:<package>` cho ClawHub. Hãy xem việc cài đặt plugin như chạy mã. Ưu tiên phiên bản được ghim.
</Warning>

`plugins search` truy vấn ClawHub để tìm các gói plugin có thể cài đặt và in ra tên gói sẵn sàng cài đặt. Lệnh này tìm các gói code-plugin và bundle-plugin, không tìm skills. Dùng `openclaw skills search` cho ClawHub skills.

<Note>
ClawHub là bề mặt phân phối và khám phá chính cho hầu hết plugin. Npm vẫn là đường dự phòng được hỗ trợ và đường cài đặt trực tiếp. Các gói plugin `@openclaw/*` do OpenClaw sở hữu đã được phát hành lại trên npm; xem danh sách hiện tại trên [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) hoặc [kho plugin](/vi/plugins/plugin-inventory). Cài đặt ổn định dùng `latest`. Cài đặt và cập nhật theo kênh beta ưu tiên dist-tag `beta` của npm khi tag đó có sẵn, rồi fallback về `latest`.
</Note>

<AccordionGroup>
  <Accordion title="Include cấu hình và sửa cấu hình không hợp lệ">
    Nếu phần `plugins` của bạn được backing bởi một `$include` tệp đơn, `plugins install/update/enable/disable/uninstall` sẽ ghi xuyên qua tệp được include đó và giữ nguyên `openclaw.json`. Include gốc, mảng include và include có override cùng cấp sẽ fail closed thay vì flatten. Xem [Include cấu hình](/vi/gateway/configuration) để biết các hình dạng được hỗ trợ.

    Nếu cấu hình không hợp lệ trong khi cài đặt, `plugins install` thường fail closed và báo bạn chạy `openclaw doctor --fix` trước. Trong quá trình Gateway khởi động và hot reload, cấu hình plugin không hợp lệ fail closed giống mọi cấu hình không hợp lệ khác; `openclaw doctor --fix` có thể cách ly mục plugin không hợp lệ. Ngoại lệ duy nhất được tài liệu hóa tại thời điểm cài đặt là đường khôi phục hẹp cho plugin đi kèm đối với các plugin chủ động chọn tham gia `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force và cài đặt lại so với cập nhật">
    `--force` tái sử dụng đích cài đặt hiện có và ghi đè plugin hoặc gói hook đã được cài đặt tại chỗ. Dùng tùy chọn này khi bạn chủ ý cài đặt lại cùng một id từ đường dẫn cục bộ, archive, gói ClawHub hoặc artifact npm mới. Với các nâng cấp thường lệ của plugin npm đã được theo dõi, ưu tiên `openclaw plugins update <id-or-npm-spec>`.

    Nếu bạn chạy `plugins install` cho một id plugin đã được cài đặt, OpenClaw dừng lại và chỉ bạn đến `plugins update <id-or-npm-spec>` để nâng cấp thông thường, hoặc đến `plugins install <package> --force` khi bạn thực sự muốn ghi đè lượt cài đặt hiện tại từ một nguồn khác.

  </Accordion>
  <Accordion title="Phạm vi --pin">
    `--pin` chỉ áp dụng cho cài đặt npm. Tùy chọn này không được hỗ trợ với cài đặt `git:`; dùng git ref rõ ràng như `git:github.com/acme/plugin@v1.2.3` khi bạn muốn một nguồn được ghim. Tùy chọn này không được hỗ trợ với `--marketplace`, vì cài đặt marketplace lưu metadata nguồn marketplace thay vì npm spec.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` là tùy chọn phá kính khẩn cấp cho các kết quả dương tính giả trong bộ quét mã nguy hiểm tích hợp. Tùy chọn này cho phép tiếp tục cài đặt ngay cả khi bộ quét tích hợp báo cáo phát hiện `critical`, nhưng **không** bỏ qua các chặn chính sách hook `before_install` của plugin và **không** bỏ qua lỗi quét.

    Cờ CLI này áp dụng cho các luồng cài đặt/cập nhật plugin. Cài đặt dependency skill do Gateway backing dùng override yêu cầu tương ứng `dangerouslyForceUnsafeInstall`, trong khi `openclaw skills install` vẫn là một luồng tải xuống/cài đặt ClawHub skill riêng.

    Nếu một plugin bạn phát hành trên ClawHub bị chặn bởi quét registry, hãy dùng các bước dành cho publisher trong [ClawHub](/vi/tools/clawhub).

  </Accordion>
  <Accordion title="Gói hook và npm spec">
    `plugins install` cũng là bề mặt cài đặt cho các gói hook expose `openclaw.hooks` trong `package.json`. Dùng `openclaw hooks` để xem hook đã lọc và bật từng hook, không phải để cài đặt gói.

    Npm spec **chỉ dành cho registry** (tên gói + **phiên bản chính xác** hoặc **dist-tag** tùy chọn). Git/URL/file spec và dải semver bị từ chối. Cài đặt dependency chạy cục bộ theo dự án với `--ignore-scripts` để an toàn, kể cả khi shell của bạn có thiết lập cài đặt npm toàn cục. Root npm plugin được quản lý kế thừa `overrides` npm cấp package của OpenClaw, nên các pin bảo mật của host cũng áp dụng cho dependency plugin được hoist.

    Dùng `npm:<package>` khi bạn muốn làm rõ việc phân giải bằng npm. Spec gói trần cũng cài đặt trực tiếp từ npm trong giai đoạn chuyển đổi lúc ra mắt.

    Spec trần và `@latest` ở lại track ổn định. Các phiên bản sửa lỗi OpenClaw legacy như `2026.5.3-1` vẫn được xem là bản phát hành ổn định cho kiểm tra này để các gói cũ tiếp tục cập nhật an toàn. Công việc support-line hằng tháng mới được lên kế hoạch dùng số patch SemVer bình thường thay vì hậu tố sửa lỗi bằng dấu gạch nối. Nếu npm phân giải một spec dòng mặc định thành prerelease, OpenClaw dừng lại và yêu cầu bạn chọn tham gia rõ ràng bằng tag prerelease như `@beta`/`@rc` hoặc phiên bản prerelease chính xác như `@1.2.3-beta.4`.

    Nếu một install spec trần khớp với id plugin chính thức (ví dụ `diffs`), OpenClaw cài đặt trực tiếp mục catalog. Để cài đặt một gói npm cùng tên, hãy dùng spec có scope rõ ràng (ví dụ `@scope/diffs`).

  </Accordion>
  <Accordion title="Kho Git">
    Dùng `git:<repo>` để cài đặt trực tiếp từ một kho git. Các dạng được hỗ trợ bao gồm `git:github.com/owner/repo`, `git:owner/repo`, clone URL đầy đủ `https://`, `ssh://`, `git://`, `file://`, và `git@host:owner/repo.git`. Thêm `@<ref>` hoặc `#<ref>` để checkout branch, tag hoặc commit trước khi cài đặt.

    Cài đặt Git clone vào thư mục tạm, checkout ref được yêu cầu khi có, rồi dùng trình cài đặt thư mục plugin thông thường. Điều đó nghĩa là xác thực manifest, quét mã nguy hiểm, công việc cài đặt package-manager và bản ghi cài đặt hoạt động giống cài đặt npm. Cài đặt git được ghi nhận bao gồm URL/ref nguồn cùng commit đã phân giải để `openclaw plugins update` có thể phân giải lại nguồn sau này.

    Sau khi cài đặt từ git, dùng `openclaw plugins inspect <id> --runtime --json` để xác minh các đăng ký runtime như phương thức gateway và lệnh CLI. Nếu plugin đã đăng ký một root CLI bằng `api.registerCli`, hãy thực thi lệnh đó trực tiếp qua root CLI của OpenClaw, ví dụ `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Archive">
    Archive được hỗ trợ: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Archive plugin OpenClaw gốc phải chứa một `openclaw.plugin.json` hợp lệ tại root plugin sau khi giải nén; archive chỉ chứa `package.json` bị từ chối trước khi OpenClaw ghi bản ghi cài đặt.

    Dùng `npm-pack:<path.tgz>` khi tệp là tarball npm-pack và bạn muốn kiểm thử cùng đường cài đặt npm-root được quản lý mà cài đặt registry dùng, bao gồm xác minh `package-lock.json`, quét dependency được hoist và bản ghi cài đặt npm. Đường dẫn archive thường vẫn cài đặt dưới dạng archive cục bộ bên dưới root extensions plugin.

    Cài đặt marketplace Claude cũng được hỗ trợ.

  </Accordion>
</AccordionGroup>

Cài đặt ClawHub dùng locator rõ ràng `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Spec plugin an toàn với npm dạng trần cài đặt từ npm theo mặc định trong giai đoạn chuyển đổi lúc ra mắt:

```bash
openclaw plugins install openclaw-codex-app-server
```

Dùng `npm:` để làm rõ phân giải chỉ bằng npm:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw kiểm tra API Plugin được công bố / mức tương thích Gateway tối thiểu trước khi cài đặt. Khi phiên bản ClawHub được chọn phát hành artifact ClawPack, OpenClaw tải xuống `.tgz` npm-pack có phiên bản, xác minh header digest của ClawHub và digest của artifact, rồi cài đặt thông qua đường dẫn archive thông thường. Các phiên bản ClawHub cũ hơn không có siêu dữ liệu ClawPack vẫn cài đặt thông qua đường dẫn xác minh package archive cũ. Các bản cài đặt đã ghi lại giữ siêu dữ liệu nguồn ClawHub, loại artifact, npm integrity, npm shasum, tên tarball và các dữ kiện digest ClawPack để dùng cho các lần cập nhật sau.
Các bản cài đặt ClawHub không có phiên bản giữ spec đã ghi không có phiên bản để `openclaw plugins update` có thể theo các bản phát hành ClawHub mới hơn; các selector phiên bản hoặc tag tường minh như `clawhub:pkg@1.2.3` và `clawhub:pkg@beta` vẫn được ghim vào selector đó.

#### Cú pháp rút gọn marketplace

Dùng cú pháp rút gọn `plugin@marketplace` khi tên marketplace tồn tại trong bộ nhớ đệm registry cục bộ của Claude tại `~/.claude/plugins/known_marketplaces.json`:

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
    - tên known-marketplace của Claude từ `~/.claude/plugins/known_marketplaces.json`
    - thư mục gốc marketplace cục bộ hoặc đường dẫn `marketplace.json`
    - cú pháp rút gọn repo GitHub như `owner/repo`
    - URL repo GitHub như `https://github.com/owner/repo`
    - URL git

  </Tab>
  <Tab title="Remote marketplace rules">
    Với marketplace từ xa được tải từ GitHub hoặc git, các mục Plugin phải nằm trong repo marketplace đã clone. OpenClaw chấp nhận các nguồn đường dẫn tương đối từ repo đó và từ chối HTTP(S), đường dẫn tuyệt đối, git, GitHub và các nguồn Plugin không phải đường dẫn khác từ manifest từ xa.
  </Tab>
</Tabs>

Với đường dẫn cục bộ và archive, OpenClaw tự động phát hiện:

- Plugin OpenClaw gốc (`openclaw.plugin.json`)
- bundle tương thích Codex (`.codex-plugin/plugin.json`)
- bundle tương thích Claude (`.claude-plugin/plugin.json` hoặc bố cục component Claude mặc định)
- bundle tương thích Cursor (`.cursor-plugin/plugin.json`)

<Note>
Các bundle tương thích cài đặt vào thư mục gốc Plugin thông thường và tham gia cùng luồng list/info/enable/disable. Hiện tại, bundle skills, Claude command-skills, mặc định Claude `settings.json`, mặc định Claude `.lsp.json` / `lspServers` do manifest khai báo, Cursor command-skills và các thư mục hook Codex tương thích được hỗ trợ; các khả năng bundle được phát hiện khác được hiển thị trong diagnostics/info nhưng chưa được nối vào thực thi runtime.
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
  Inventory có thể đọc bằng máy cùng diagnostics registry và trạng thái cài đặt dependency package.
</ParamField>

<Note>
`plugins list` đọc registry Plugin cục bộ đã lưu trước, với fallback chỉ dẫn xuất từ manifest khi registry bị thiếu hoặc không hợp lệ. Lệnh này hữu ích để kiểm tra một Plugin có được cài đặt, bật và hiển thị với kế hoạch khởi động lạnh hay không, nhưng không phải là phép dò runtime trực tiếp của một tiến trình Gateway đang chạy. Sau khi thay đổi mã Plugin, trạng thái bật, chính sách hook hoặc `plugins.load.paths`, hãy khởi động lại Gateway phục vụ channel trước khi kỳ vọng mã `register(api)` mới hoặc hook chạy. Với triển khai từ xa/container, hãy xác minh bạn đang khởi động lại đúng tiến trình con `openclaw gateway run`, không chỉ một tiến trình wrapper.

`plugins list --json` bao gồm `dependencyStatus` của từng Plugin từ `package.json`
`dependencies` và `optionalDependencies`. OpenClaw kiểm tra xem các tên package đó
có hiện diện dọc theo đường dẫn tra cứu Node `node_modules` thông thường của Plugin hay không; nó
không import mã runtime Plugin, chạy package manager hay sửa chữa các
dependency bị thiếu.
</Note>

`plugins search` là tra cứu catalog ClawHub từ xa. Nó không kiểm tra trạng thái
cục bộ, thay đổi config, cài đặt package hay tải mã runtime Plugin. Kết quả tìm kiếm
bao gồm tên package ClawHub, family, channel, version, summary và
gợi ý cài đặt như `openclaw plugins install clawhub:<package>`.

Đối với công việc Plugin đi kèm bên trong image Docker đã đóng gói, hãy bind-mount thư mục
nguồn Plugin lên đúng đường dẫn nguồn đã đóng gói tương ứng, chẳng hạn
`/app/extensions/synology-chat`. OpenClaw sẽ phát hiện overlay nguồn đã mount đó
trước `/app/dist/extensions/synology-chat`; một thư mục nguồn được sao chép thuần túy
vẫn không hoạt động, nên các bản cài đặt đã đóng gói thông thường vẫn dùng dist đã biên dịch.

Để gỡ lỗi hook runtime:

- `openclaw plugins inspect <id> --runtime --json` hiển thị các hook đã đăng ký và diagnostics từ một lượt kiểm tra đã tải module. Kiểm tra runtime không bao giờ cài đặt dependency; dùng `openclaw doctor --fix` để dọn trạng thái dependency cũ hoặc khôi phục các Plugin có thể tải xuống bị thiếu nhưng được tham chiếu bởi config.
- `openclaw gateway status --deep --require-rpc` xác nhận Gateway có thể truy cập, gợi ý service/process, đường dẫn config và tình trạng RPC.
- Các hook hội thoại không đi kèm (`llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize`, `agent_end`) yêu cầu `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Dùng `--link` để tránh sao chép một thư mục cục bộ (thêm vào `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` không được hỗ trợ cùng `--link` vì các bản cài đặt liên kết dùng lại đường dẫn nguồn thay vì sao chép đè lên đích cài đặt được quản lý.

Dùng `--pin` trên các bản cài đặt npm để lưu spec chính xác đã phân giải (`name@version`) trong chỉ mục Plugin được quản lý trong khi giữ hành vi mặc định là không ghim.
</Note>

### Chỉ mục Plugin

Siêu dữ liệu cài đặt Plugin là trạng thái do máy quản lý, không phải config người dùng. Các lần cài đặt và cập nhật ghi nó vào `plugins/installs.json` dưới thư mục trạng thái OpenClaw đang hoạt động. Map `installRecords` cấp cao nhất của nó là nguồn bền vững của siêu dữ liệu cài đặt, bao gồm các bản ghi cho manifest Plugin bị hỏng hoặc thiếu. Mảng `plugins` là bộ nhớ đệm registry lạnh được dẫn xuất từ manifest. Tệp này bao gồm cảnh báo không chỉnh sửa và được dùng bởi `openclaw plugins update`, uninstall, diagnostics và registry Plugin lạnh.

Khi OpenClaw thấy các bản ghi `plugins.installs` cũ đã ship trong config, các lượt đọc runtime xem chúng là đầu vào tương thích mà không ghi lại `openclaw.json`. Các lượt ghi Plugin tường minh và `openclaw doctor --fix` di chuyển những bản ghi đó vào chỉ mục Plugin và xóa khóa config khi được phép ghi config; nếu một trong hai lượt ghi thất bại, các bản ghi config được giữ lại để siêu dữ liệu cài đặt không bị mất.

### Gỡ cài đặt

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` xóa bản ghi Plugin khỏi `plugins.entries`, chỉ mục Plugin đã lưu, các mục danh sách allow/deny Plugin và các mục `plugins.load.paths` được liên kết khi áp dụng. Trừ khi đặt `--keep-files`, uninstall cũng xóa thư mục cài đặt được quản lý đang được theo dõi khi nó nằm trong thư mục gốc extensions Plugin của OpenClaw. Với Plugin active memory, slot memory đặt lại thành `memory-core`.

<Note>
`--keep-config` được hỗ trợ như alias đã ngừng khuyến nghị cho `--keep-files`.
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
  <Accordion title="Resolving plugin id vs npm spec">
    Khi bạn truyền một id Plugin, OpenClaw dùng lại spec cài đặt đã ghi cho Plugin đó. Điều đó nghĩa là các dist-tag đã lưu trước đó như `@beta` và các phiên bản ghim chính xác tiếp tục được dùng trong các lần chạy `update <id>` sau này.

    Với các bản cài đặt npm, bạn cũng có thể truyền một spec package npm tường minh với dist-tag hoặc phiên bản chính xác. OpenClaw phân giải tên package đó ngược về bản ghi Plugin được theo dõi, cập nhật Plugin đã cài đó và ghi lại spec npm mới cho các bản cập nhật dựa trên id trong tương lai.

    Truyền tên package npm không có phiên bản hoặc tag cũng phân giải ngược về bản ghi Plugin được theo dõi. Dùng cách này khi một Plugin đã bị ghim vào một phiên bản chính xác và bạn muốn đưa nó trở lại dòng phát hành mặc định của registry.

  </Accordion>
  <Accordion title="Beta channel updates">
    `openclaw plugins update` dùng lại spec Plugin được theo dõi trừ khi bạn truyền một spec mới. `openclaw update` còn biết channel cập nhật OpenClaw đang hoạt động: trên channel beta, các bản ghi Plugin npm và ClawHub dòng mặc định thử `@beta` trước, rồi fallback về spec default/latest đã ghi nếu không có bản phát hành beta Plugin. Các phiên bản chính xác và tag tường minh vẫn được ghim vào selector đó.

    OpenClaw chưa phơi bày các channel Plugin hỗ trợ LTS hoặc monthly. Công việc support-line đã lên kế hoạch sẽ cần package Plugin và tag ClawHub đi theo cùng support line với package lõi.

  </Accordion>
  <Accordion title="Version checks and integrity drift">
    Trước một bản cập nhật npm live, OpenClaw kiểm tra phiên bản package đã cài so với siêu dữ liệu npm registry. Nếu phiên bản đã cài và danh tính artifact đã ghi đã khớp với đích đã phân giải, bản cập nhật được bỏ qua mà không tải xuống, cài đặt lại hoặc ghi lại `openclaw.json`.

    Khi tồn tại hash integrity đã lưu và hash artifact đã fetch thay đổi, OpenClaw xem đó là npm artifact drift. Lệnh tương tác `openclaw plugins update` in các hash kỳ vọng và thực tế rồi yêu cầu xác nhận trước khi tiếp tục. Các helper cập nhật không tương tác sẽ fail closed trừ khi caller cung cấp một chính sách tiếp tục tường minh.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install on update">
    `--dangerously-force-unsafe-install` cũng có trên `plugins update` như một override khẩn cấp cho false positive của quét dangerous-code tích hợp trong quá trình cập nhật Plugin. Nó vẫn không bỏ qua các chặn chính sách `before_install` của Plugin hoặc chặn scan-failure, và chỉ áp dụng cho cập nhật Plugin, không áp dụng cho cập nhật hook-pack.
  </Accordion>
</AccordionGroup>

### Kiểm tra

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect hiển thị identity, trạng thái tải, source, khả năng manifest, cờ chính sách, diagnostics, siêu dữ liệu cài đặt, khả năng bundle và mọi hỗ trợ MCP hoặc LSP server được phát hiện mà mặc định không import runtime Plugin. Thêm `--runtime` để tải module Plugin và bao gồm các hook, tool, command, service, gateway method và HTTP route đã đăng ký. Kiểm tra runtime báo cáo trực tiếp các dependency Plugin bị thiếu; cài đặt và sửa chữa vẫn nằm trong `openclaw plugins install`, `openclaw plugins update` và `openclaw doctor --fix`.

Các lệnh CLI do Plugin sở hữu được cài đặt làm nhóm lệnh `openclaw` gốc. Sau khi `inspect --runtime` hiển thị một lệnh dưới `cliCommands`, hãy chạy nó dưới dạng `openclaw <command> ...`; ví dụ một Plugin đăng ký `demo-git` có thể được xác minh bằng `openclaw demo-git ping`.

Mỗi Plugin được phân loại theo những gì nó thật sự đăng ký tại runtime:

- **plain-capability** — một loại khả năng (ví dụ: Plugin chỉ dành cho nhà cung cấp)
- **hybrid-capability** — nhiều loại khả năng (ví dụ: văn bản + giọng nói + hình ảnh)
- **hook-only** — chỉ có hook, không có khả năng hoặc bề mặt
- **non-capability** — công cụ/lệnh/dịch vụ nhưng không có khả năng

Xem [Hình dạng Plugin](/vi/plugins/architecture#plugin-shapes) để biết thêm về mô hình khả năng.

<Note>
Cờ `--json` xuất ra một báo cáo máy có thể đọc được, phù hợp cho script và kiểm toán. `inspect --all` hiển thị một bảng trên toàn đội hình với các cột hình dạng, loại khả năng, thông báo tương thích, khả năng trong bundle và tóm tắt hook. `info` là bí danh của `inspect`.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` báo cáo lỗi tải Plugin, chẩn đoán manifest/phát hiện và thông báo tương thích. Khi mọi thứ sạch, nó in `No plugin issues detected.`

Nếu một Plugin đã cấu hình có trên đĩa nhưng bị chặn bởi các kiểm tra an toàn đường dẫn của loader, xác thực cấu hình giữ lại mục Plugin và báo cáo là `present but blocked`. Sửa chẩn đoán Plugin bị chặn trước đó, chẳng hạn như quyền sở hữu đường dẫn hoặc quyền world-writable, thay vì xóa cấu hình `plugins.entries.<id>` hoặc `plugins.allow`.

Với các lỗi hình dạng mô-đun như thiếu export `register`/`activate`, chạy lại với `OPENCLAW_PLUGIN_LOAD_DEBUG=1` để đưa bản tóm tắt hình dạng export gọn vào đầu ra chẩn đoán.

### Registry

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Registry Plugin cục bộ là mô hình đọc lạnh được lưu bền vững của OpenClaw cho danh tính Plugin đã cài đặt, trạng thái bật, siêu dữ liệu nguồn và quyền sở hữu đóng góp. Khởi động thông thường, tra cứu chủ sở hữu nhà cung cấp, phân loại thiết lập kênh và kiểm kê Plugin có thể đọc nó mà không cần nhập các mô-đun runtime của Plugin.

Dùng `plugins registry` để kiểm tra registry đã lưu bền vững có tồn tại, hiện hành hay đã cũ không. Dùng `--refresh` để dựng lại nó từ chỉ mục Plugin đã lưu bền vững, chính sách cấu hình và siêu dữ liệu manifest/package. Đây là đường sửa chữa, không phải đường kích hoạt runtime.

`openclaw doctor --fix` cũng sửa lệch managed npm liền kề registry: nếu một package `@openclaw/*` mồ côi hoặc được khôi phục dưới thư mục gốc managed plugin npm che khuất một Plugin đi kèm, doctor sẽ xóa package cũ đó và dựng lại registry để khởi động xác thực theo manifest đi kèm.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` là công tắc tương thích phá kính đã ngừng khuyến nghị cho các lỗi đọc registry. Ưu tiên `plugins registry --refresh` hoặc `openclaw doctor --fix`; fallback env chỉ dành cho khôi phục khởi động khẩn cấp trong khi migration được triển khai.
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
- [Plugin cộng đồng](/vi/plugins/community)
