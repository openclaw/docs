---
read_when:
    - Bạn muốn cài đặt hoặc quản lý các Plugin Gateway hoặc các gói tương thích
    - Bạn muốn gỡ lỗi các sự cố tải Plugin
sidebarTitle: Plugins
summary: Tham chiếu CLI cho `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, deps, doctor)
title: Plugin
x-i18n:
    generated_at: "2026-05-01T10:47:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3a7aebe4ee647d7821b881cdb9d5af01d70508c38b36462ff7b57fb44769dc2f
    source_path: cli/plugins.md
    workflow: 16
---

Quản lý các Plugin Gateway, gói hook và các gói tương thích.

<CardGroup cols={2}>
  <Card title="Hệ thống Plugin" href="/vi/tools/plugin">
    Hướng dẫn dành cho người dùng cuối về cài đặt, bật và khắc phục sự cố Plugin.
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
openclaw plugins deps
openclaw plugins deps --repair
openclaw plugins deps --prune
openclaw plugins deps --json
openclaw plugins doctor
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins marketplace list <marketplace>
openclaw plugins marketplace list <marketplace> --json
```

Để điều tra thao tác cài đặt, kiểm tra, gỡ cài đặt hoặc làm mới registry bị chậm, chạy lệnh với `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`. Trace ghi thời gian từng pha vào stderr và giữ đầu ra JSON có thể phân tích cú pháp. Xem [Gỡ lỗi](/vi/help/debugging#plugin-lifecycle-trace).

<Note>
Các Plugin đi kèm được phát hành cùng OpenClaw. Một số được bật theo mặc định (ví dụ: nhà cung cấp mô hình đi kèm, nhà cung cấp giọng nói đi kèm và Plugin trình duyệt đi kèm); các Plugin khác yêu cầu `plugins enable`.

Plugin OpenClaw native phải phát hành kèm `openclaw.plugin.json` với JSON Schema nội tuyến (`configSchema`, kể cả khi trống). Các gói tương thích dùng manifest gói riêng của chúng.

`plugins list` hiển thị `Format: openclaw` hoặc `Format: bundle`. Đầu ra danh sách/thông tin chi tiết cũng hiển thị subtype của gói (`codex`, `claude` hoặc `cursor`) cùng các khả năng gói được phát hiện.
</Note>

### Cài đặt

```bash
openclaw plugins install <package>                      # ClawHub first, then npm
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
Tên package trần được kiểm tra với ClawHub trước, rồi đến npm. Hãy xem việc cài đặt Plugin như chạy mã. Ưu tiên các phiên bản được ghim.
</Warning>

<Note>
ClawHub là bề mặt phân phối và khám phá chính cho hầu hết Plugin. Npm vẫn là phương án dự phòng được hỗ trợ và là đường dẫn cài đặt trực tiếp. Trong quá trình di chuyển sang ClawHub, OpenClaw vẫn phát hành một số package Plugin `@openclaw/*` do OpenClaw sở hữu trên npm; các phiên bản package đó có thể tụt lại so với mã nguồn đi kèm giữa các đợt phát hành Plugin. Nếu npm báo một package Plugin do OpenClaw sở hữu là deprecated, phiên bản đã phát hành đó là một artifact bên ngoài cũ; hãy dùng Plugin đi kèm OpenClaw hiện tại hoặc một checkout cục bộ cho đến khi package npm mới hơn được phát hành.
</Note>

<AccordionGroup>
  <Accordion title="Include cấu hình và khôi phục cấu hình không hợp lệ">
    Nếu phần `plugins` của bạn được hỗ trợ bởi một `$include` một tệp, `plugins install/update/enable/disable/uninstall` sẽ ghi xuyên qua tệp được include đó và để nguyên `openclaw.json`. Include gốc, mảng include và include có ghi đè sibling sẽ thất bại đóng thay vì làm phẳng. Xem [Include cấu hình](/vi/gateway/configuration) để biết các hình dạng được hỗ trợ.

    Nếu cấu hình không hợp lệ trong lúc cài đặt, `plugins install` thường thất bại đóng và yêu cầu bạn chạy `openclaw doctor --fix` trước. Trong lúc khởi động Gateway, cấu hình không hợp lệ của một Plugin được cô lập vào Plugin đó để các kênh và Plugin khác vẫn tiếp tục chạy; `openclaw doctor --fix` có thể cách ly mục Plugin không hợp lệ. Ngoại lệ duy nhất được tài liệu hóa ở thời điểm cài đặt là một đường khôi phục hẹp cho Plugin đi kèm dành cho các Plugin chủ động chọn `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force và cài đặt lại so với cập nhật">
    `--force` tái sử dụng mục tiêu cài đặt hiện có và ghi đè tại chỗ lên Plugin hoặc gói hook đã được cài đặt. Dùng tùy chọn này khi bạn cố ý cài đặt lại cùng một id từ một đường dẫn cục bộ mới, archive, package ClawHub hoặc artifact npm. Với các nâng cấp thông thường của một Plugin npm đã được theo dõi, ưu tiên `openclaw plugins update <id-or-npm-spec>`.

    Nếu bạn chạy `plugins install` cho một id Plugin đã được cài đặt, OpenClaw sẽ dừng và chỉ bạn đến `plugins update <id-or-npm-spec>` cho nâng cấp thông thường, hoặc đến `plugins install <package> --force` khi bạn thật sự muốn ghi đè bản cài đặt hiện tại từ một nguồn khác.

  </Accordion>
  <Accordion title="Phạm vi --pin">
    `--pin` chỉ áp dụng cho cài đặt npm. Tùy chọn này không được hỗ trợ với cài đặt `git:`; dùng một git ref rõ ràng như `git:github.com/acme/plugin@v1.2.3` khi bạn muốn một nguồn được ghim. Tùy chọn này không được hỗ trợ với `--marketplace`, vì cài đặt marketplace lưu metadata nguồn marketplace thay vì một npm spec.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` là tùy chọn phá kính cho kết quả dương tính giả trong trình quét mã nguy hiểm tích hợp. Tùy chọn này cho phép tiếp tục cài đặt ngay cả khi trình quét tích hợp báo cáo phát hiện `critical`, nhưng **không** bỏ qua các chặn chính sách hook `before_install` của Plugin và **không** bỏ qua lỗi quét.

    Cờ CLI này áp dụng cho luồng cài đặt/cập nhật Plugin. Cài đặt phụ thuộc Skills do Gateway hỗ trợ dùng override yêu cầu tương ứng `dangerouslyForceUnsafeInstall`, trong khi `openclaw skills install` vẫn là một luồng tải xuống/cài đặt skill ClawHub riêng.

    Nếu một Plugin bạn đã phát hành trên ClawHub bị chặn bởi quét registry, hãy dùng các bước dành cho nhà phát hành trong [ClawHub](/vi/tools/clawhub).

  </Accordion>
  <Accordion title="Gói hook và npm specs">
    `plugins install` cũng là bề mặt cài đặt cho các gói hook công bố `openclaw.hooks` trong `package.json`. Dùng `openclaw hooks` để xem hook có lọc và bật từng hook, không phải để cài đặt package.

    Npm specs **chỉ qua registry** (tên package + **phiên bản chính xác** tùy chọn hoặc **dist-tag**). Git/URL/file specs và dải semver bị từ chối. Cài đặt phụ thuộc chạy cục bộ theo dự án với `--ignore-scripts` để an toàn, kể cả khi shell của bạn có thiết lập cài đặt npm toàn cục.

    Dùng `npm:<package>` khi bạn muốn bỏ qua tra cứu ClawHub và cài đặt trực tiếp từ npm. Bare package specs vẫn ưu tiên ClawHub và chỉ fallback sang npm khi ClawHub không có package hoặc phiên bản đó.

    Bare specs và `@latest` ở lại nhánh ổn định. Nếu npm phân giải một trong hai thành prerelease, OpenClaw sẽ dừng và yêu cầu bạn chọn tham gia rõ ràng bằng một prerelease tag như `@beta`/`@rc` hoặc một phiên bản prerelease chính xác như `@1.2.3-beta.4`.

    Nếu một bare install spec khớp với id Plugin đi kèm (ví dụ `diffs`), OpenClaw sẽ cài đặt trực tiếp Plugin đi kèm. Để cài đặt một package npm cùng tên, hãy dùng một scoped spec rõ ràng (ví dụ `@scope/diffs`).

  </Accordion>
  <Accordion title="Kho Git">
    Dùng `git:<repo>` để cài đặt trực tiếp từ một kho git. Các dạng được hỗ trợ gồm `git:github.com/owner/repo`, `git:owner/repo`, URL clone đầy đủ `https://`, `ssh://`, `git://`, `file://` và `git@host:owner/repo.git`. Thêm `@<ref>` hoặc `#<ref>` để checkout một branch, tag hoặc commit trước khi cài đặt.

    Cài đặt Git clone vào một thư mục tạm, checkout ref được yêu cầu khi có, rồi dùng trình cài đặt thư mục Plugin thông thường. Điều đó có nghĩa là xác thực manifest, quét mã nguy hiểm, staging phụ thuộc runtime và bản ghi cài đặt hoạt động như cài đặt bằng đường dẫn cục bộ. Bản ghi cài đặt git bao gồm URL/ref nguồn cùng commit đã phân giải để `openclaw plugins update` có thể phân giải lại nguồn về sau.

    Sau khi cài đặt từ git, dùng `openclaw plugins inspect <id> --runtime --json` để xác minh các đăng ký runtime như phương thức gateway và lệnh CLI. Nếu Plugin đã đăng ký một gốc CLI với `api.registerCli`, hãy thực thi lệnh đó trực tiếp qua CLI gốc của OpenClaw, ví dụ `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Archive">
    Archive được hỗ trợ: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Archive Plugin OpenClaw native phải chứa một `openclaw.plugin.json` hợp lệ tại gốc Plugin đã giải nén; archive chỉ chứa `package.json` bị từ chối trước khi OpenClaw ghi bản ghi cài đặt.

    Cài đặt Claude marketplace cũng được hỗ trợ.

  </Accordion>
</AccordionGroup>

Cài đặt ClawHub dùng bộ định vị `clawhub:<package>` rõ ràng:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

OpenClaw hiện cũng ưu tiên ClawHub cho bare npm-safe plugin specs. Nó chỉ fallback sang npm nếu ClawHub không có package hoặc phiên bản đó:

```bash
openclaw plugins install openclaw-codex-app-server
```

Dùng `npm:` để ép phân giải chỉ qua npm, ví dụ khi không truy cập được ClawHub hoặc bạn biết package chỉ tồn tại trên npm:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw tải xuống archive package từ ClawHub, kiểm tra API Plugin được quảng bá / khả năng tương thích gateway tối thiểu, rồi cài đặt qua đường dẫn archive thông thường. Bản ghi cài đặt giữ metadata nguồn ClawHub để cập nhật về sau.
Cài đặt ClawHub không có phiên bản giữ một spec được ghi nhận không có phiên bản để `openclaw plugins update` có thể theo các bản phát hành ClawHub mới hơn; selector phiên bản hoặc tag rõ ràng như `clawhub:pkg@1.2.3` và `clawhub:pkg@beta` vẫn được ghim vào selector đó.

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
  <Tab title="Nguồn marketplace">
    - tên known-marketplace của Claude từ `~/.claude/plugins/known_marketplaces.json`
    - gốc marketplace cục bộ hoặc đường dẫn `marketplace.json`
    - cú pháp rút gọn kho GitHub như `owner/repo`
    - URL kho GitHub như `https://github.com/owner/repo`
    - URL git

  </Tab>
  <Tab title="Quy tắc marketplace từ xa">
    Với marketplace từ xa được tải từ GitHub hoặc git, các mục Plugin phải ở bên trong kho marketplace đã clone. OpenClaw chấp nhận nguồn đường dẫn tương đối từ kho đó và từ chối HTTP(S), đường dẫn tuyệt đối, git, GitHub và các nguồn Plugin không phải đường dẫn khác từ manifest từ xa.
  </Tab>
</Tabs>

Với đường dẫn cục bộ và archive, OpenClaw tự động phát hiện:

- Plugin gốc của OpenClaw (`openclaw.plugin.json`)
- Gói tương thích với Codex (`.codex-plugin/plugin.json`)
- Gói tương thích với Claude (`.claude-plugin/plugin.json` hoặc bố cục thành phần Claude mặc định)
- Gói tương thích với Cursor (`.cursor-plugin/plugin.json`)

<Note>
Các gói tương thích được cài vào gốc Plugin thông thường và tham gia cùng quy trình list/info/enable/disable. Hiện tại, bundle skills, Claude command-skills, giá trị mặc định `settings.json` của Claude, giá trị mặc định `.lsp.json` / `lspServers` được khai báo trong manifest của Claude, Cursor command-skills và các thư mục hook Codex tương thích đã được hỗ trợ; các khả năng gói khác được phát hiện sẽ hiển thị trong chẩn đoán/info nhưng chưa được nối vào thực thi runtime.
</Note>

### Liệt kê

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

<ParamField path="--enabled" type="boolean">
  Chỉ hiển thị các Plugin đã bật.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Chuyển từ chế độ xem bảng sang các dòng chi tiết theo từng Plugin với siêu dữ liệu source/origin/version/activation.
</ParamField>
<ParamField path="--json" type="boolean">
  Inventory có thể đọc bằng máy cùng chẩn đoán registry.
</ParamField>

<Note>
`plugins list` đọc registry Plugin cục bộ đã lưu trước, với phương án dự phòng dẫn xuất chỉ từ manifest khi registry bị thiếu hoặc không hợp lệ. Lệnh này hữu ích để kiểm tra Plugin đã được cài, bật và hiển thị cho kế hoạch khởi động lạnh hay chưa, nhưng không phải là đầu dò runtime trực tiếp của một tiến trình Gateway đang chạy. Sau khi thay đổi mã Plugin, trạng thái bật, chính sách hook hoặc `plugins.load.paths`, hãy khởi động lại Gateway phục vụ kênh trước khi kỳ vọng mã `register(api)` hoặc hook mới chạy. Với các triển khai từ xa/container, hãy xác minh bạn đang khởi động lại đúng tiến trình con `openclaw gateway run`, không chỉ một tiến trình wrapper.
</Note>

Đối với công việc trên Plugin đi kèm bên trong một Docker image đã đóng gói, hãy bind-mount thư mục source của Plugin lên đường dẫn source đóng gói tương ứng, chẳng hạn như `/app/extensions/synology-chat`. OpenClaw sẽ phát hiện lớp phủ source đã mount đó trước `/app/dist/extensions/synology-chat`; một thư mục source chỉ được sao chép đơn thuần vẫn không hoạt động, để các bản cài đóng gói thông thường vẫn dùng dist đã biên dịch.

Để gỡ lỗi hook runtime:

- `openclaw plugins inspect <id> --runtime --json` hiển thị các hook đã đăng ký và chẩn đoán từ một lượt kiểm tra có nạp module. Kiểm tra runtime không bao giờ tải xuống các phụ thuộc runtime đi kèm bị thiếu; dùng `openclaw plugins deps --repair` khi cần sửa chữa.
- `openclaw gateway status --deep --require-rpc` xác nhận Gateway có thể truy cập, gợi ý service/process, đường dẫn config và tình trạng RPC.
- Hook hội thoại không đi kèm (`llm_input`, `llm_output`, `before_agent_finalize`, `agent_end`) yêu cầu `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Dùng `--link` để tránh sao chép một thư mục cục bộ (thêm vào `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` không được hỗ trợ cùng `--link` vì các bản cài liên kết tái sử dụng đường dẫn source thay vì sao chép đè lên một đích cài được quản lý.

Dùng `--pin` trên các bản cài npm để lưu spec chính xác đã phân giải (`name@version`) trong chỉ mục Plugin được quản lý trong khi vẫn giữ hành vi mặc định là không ghim.
</Note>

### Chỉ mục Plugin

Siêu dữ liệu cài đặt Plugin là trạng thái do máy quản lý, không phải config của người dùng. Các thao tác cài và cập nhật ghi trạng thái này vào `plugins/installs.json` trong thư mục trạng thái OpenClaw đang hoạt động. Map cấp cao nhất `installRecords` là nguồn bền vững của siêu dữ liệu cài đặt, bao gồm cả các bản ghi cho manifest Plugin bị hỏng hoặc bị thiếu. Mảng `plugins` là cache registry lạnh được dẫn xuất từ manifest. Tệp này có cảnh báo không chỉnh sửa và được dùng bởi `openclaw plugins update`, gỡ cài đặt, chẩn đoán và registry Plugin lạnh.

Khi OpenClaw thấy các bản ghi `plugins.installs` legacy được phát hành trong config, OpenClaw chuyển chúng vào chỉ mục Plugin và xóa khóa config; nếu một trong hai lần ghi thất bại, các bản ghi config được giữ lại để siêu dữ liệu cài đặt không bị mất.

### Phụ thuộc runtime

```bash
openclaw plugins deps
openclaw plugins deps --repair
openclaw plugins deps --prune
openclaw plugins deps --json
```

`plugins deps` kiểm tra giai đoạn phụ thuộc runtime đã đóng gói cho các Plugin đi kèm do OpenClaw sở hữu được chọn bởi config Plugin, các kênh đã bật/cấu hình, các provider mô hình đã cấu hình hoặc giá trị mặc định của manifest đi kèm. Đây không phải là đường dẫn cài đặt/cập nhật cho Plugin npm bên thứ ba hoặc ClawHub.

Dùng `--repair` khi một bản cài đóng gói báo thiếu phụ thuộc runtime đi kèm trong quá trình khởi động Gateway hoặc `plugins doctor`. Sửa chữa chỉ cài các phụ thuộc Plugin đi kèm đã bật còn thiếu với lifecycle scripts bị tắt. Dùng `--prune` để xóa các gốc phụ thuộc runtime bên ngoài không xác định đã cũ do các bố cục đóng gói cũ để lại.

Để xem toàn bộ kế hoạch, staging và vòng đời sửa chữa, xem [Phân giải phụ thuộc Plugin](/vi/plugins/dependency-resolution).

### Gỡ cài đặt

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` xóa các bản ghi Plugin khỏi `plugins.entries`, chỉ mục Plugin đã lưu, các mục danh sách allow/deny của Plugin và các mục `plugins.load.paths` được liên kết khi áp dụng. Trừ khi đặt `--keep-files`, gỡ cài đặt cũng xóa thư mục cài đặt được quản lý đã theo dõi khi thư mục đó nằm trong gốc extensions Plugin của OpenClaw. Với Plugin active memory, khe bộ nhớ được đặt lại thành `memory-core`.

<Note>
`--keep-config` được hỗ trợ như một alias đã ngừng khuyến nghị cho `--keep-files`.
</Note>

### Cập nhật

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call@beta
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

Cập nhật áp dụng cho các bản cài Plugin đã theo dõi trong chỉ mục Plugin được quản lý và các bản cài hook-pack đã theo dõi trong `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="Phân giải id Plugin so với npm spec">
    Khi bạn truyền một id Plugin, OpenClaw tái sử dụng spec cài đặt đã ghi cho Plugin đó. Điều này có nghĩa là các dist-tag đã lưu trước đó như `@beta` và các phiên bản ghim chính xác tiếp tục được dùng trong những lần chạy `update <id>` sau này.

    Với các bản cài npm, bạn cũng có thể truyền một npm package spec rõ ràng với dist-tag hoặc phiên bản chính xác. OpenClaw phân giải tên package đó trở lại bản ghi Plugin đã theo dõi, cập nhật Plugin đã cài đó và ghi lại npm spec mới cho các cập nhật dựa trên id trong tương lai.

    Truyền tên package npm mà không có phiên bản hoặc tag cũng phân giải trở lại bản ghi Plugin đã theo dõi. Dùng cách này khi một Plugin đã được ghim vào một phiên bản chính xác và bạn muốn chuyển nó trở lại dòng phát hành mặc định của registry.

  </Accordion>
  <Accordion title="Kiểm tra phiên bản và drift toàn vẹn">
    Trước một cập nhật npm trực tiếp, OpenClaw kiểm tra phiên bản package đã cài so với siêu dữ liệu registry npm. Nếu phiên bản đã cài và danh tính artifact đã ghi đã khớp với đích đã phân giải, cập nhật sẽ bị bỏ qua mà không tải xuống, cài đặt lại hoặc ghi lại `openclaw.json`.

    Khi có hash toàn vẹn đã lưu và hash artifact đã fetch thay đổi, OpenClaw xem đó là drift artifact npm. Lệnh tương tác `openclaw plugins update` in hash mong đợi và hash thực tế rồi yêu cầu xác nhận trước khi tiếp tục. Các helper cập nhật không tương tác sẽ fail closed trừ khi caller cung cấp một chính sách tiếp tục rõ ràng.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install khi cập nhật">
    `--dangerously-force-unsafe-install` cũng có trên `plugins update` như một override khẩn cấp cho các cảnh báo dương tính giả của built-in dangerous-code scan trong quá trình cập nhật Plugin. Cờ này vẫn không bỏ qua các chặn chính sách `before_install` của Plugin hoặc chặn do scan thất bại, và chỉ áp dụng cho cập nhật Plugin, không áp dụng cho cập nhật hook-pack.
  </Accordion>
</AccordionGroup>

### Kiểm tra

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect hiển thị danh tính, trạng thái nạp, source, khả năng manifest, cờ chính sách, chẩn đoán, siêu dữ liệu cài đặt, khả năng gói và mọi hỗ trợ máy chủ MCP hoặc LSP được phát hiện mà mặc định không import runtime Plugin. Thêm `--runtime` để nạp module Plugin và bao gồm các hook, công cụ, lệnh, service, phương thức Gateway và route HTTP đã đăng ký. Kiểm tra runtime thất bại kèm gợi ý sửa chữa khi thiếu phụ thuộc runtime đi kèm; dùng `openclaw plugins deps --repair` để sửa chúng một cách rõ ràng.

Các lệnh CLI do Plugin sở hữu được cài thành các nhóm lệnh gốc `openclaw`. Sau khi `inspect --runtime` hiển thị một lệnh dưới `cliCommands`, chạy lệnh đó dưới dạng `openclaw <command> ...`; ví dụ, một Plugin đăng ký `demo-git` có thể được xác minh bằng `openclaw demo-git ping`.

Mỗi Plugin được phân loại theo những gì nó thực sự đăng ký ở runtime:

- **plain-capability** — một loại khả năng (ví dụ: Plugin chỉ dành cho provider)
- **hybrid-capability** — nhiều loại khả năng (ví dụ: văn bản + giọng nói + hình ảnh)
- **hook-only** — chỉ có hook, không có khả năng hoặc surface
- **non-capability** — công cụ/lệnh/service nhưng không có khả năng

Xem [Hình dạng Plugin](/vi/plugins/architecture#plugin-shapes) để biết thêm về mô hình khả năng.

<Note>
Cờ `--json` xuất báo cáo có thể đọc bằng máy, phù hợp cho scripting và audit. `inspect --all` hiển thị bảng toàn bộ fleet với các cột shape, loại khả năng, thông báo tương thích, khả năng gói và tóm tắt hook. `info` là alias của `inspect`.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` báo cáo lỗi nạp Plugin, chẩn đoán manifest/discovery và thông báo tương thích. Khi mọi thứ sạch, lệnh in `No plugin issues detected.`

Với các lỗi module-shape như thiếu export `register`/`activate`, chạy lại với `OPENCLAW_PLUGIN_LOAD_DEBUG=1` để bao gồm tóm tắt export-shape ngắn gọn trong đầu ra chẩn đoán.

### Registry

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Registry Plugin cục bộ là read model lạnh đã lưu của OpenClaw cho danh tính Plugin đã cài, trạng thái bật, siêu dữ liệu source và quyền sở hữu đóng góp. Khởi động thông thường, tra cứu chủ sở hữu provider, phân loại thiết lập kênh và inventory Plugin có thể đọc nó mà không cần import module runtime Plugin.

Dùng `plugins registry` để kiểm tra registry đã lưu có hiện diện, hiện hành hoặc đã cũ hay không. Dùng `--refresh` để dựng lại từ chỉ mục Plugin đã lưu, chính sách config và siêu dữ liệu manifest/package. Đây là đường dẫn sửa chữa, không phải đường dẫn kích hoạt runtime.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` là công tắc tương thích khẩn cấp đã ngừng khuyến nghị cho các lỗi đọc registry. Ưu tiên `plugins registry --refresh` hoặc `openclaw doctor --fix`; phương án dự phòng qua env chỉ dành cho khôi phục khởi động khẩn cấp trong khi migration được triển khai.
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Danh sách Marketplace chấp nhận đường dẫn marketplace cục bộ, đường dẫn `marketplace.json`, dạng rút gọn GitHub như `owner/repo`, URL repo GitHub hoặc URL git. `--json` in nhãn source đã phân giải cùng manifest marketplace đã parse và các mục Plugin.

## Liên quan

- [Xây dựng Plugin](/vi/plugins/building-plugins)
- [Tham chiếu CLI](/vi/cli)
- [Plugin cộng đồng](/vi/plugins/community)
