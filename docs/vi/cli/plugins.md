---
read_when:
    - Bạn muốn cài đặt hoặc quản lý các Plugin Gateway hoặc các gói tương thích
    - Bạn muốn gỡ lỗi các sự cố tải Plugin
sidebarTitle: Plugins
summary: Tài liệu tham chiếu CLI cho `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, deps, doctor)
title: Plugin
x-i18n:
    generated_at: "2026-04-30T09:34:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 381e3243eaefb5b5e31db8fd2ba459773649a6ef427080a12018ea92b25f707c
    source_path: cli/plugins.md
    workflow: 16
---

Quản lý các Plugin Gateway, gói hook và bundle tương thích.

<CardGroup cols={2}>
  <Card title="Hệ thống Plugin" href="/vi/tools/plugin">
    Hướng dẫn cho người dùng cuối về cài đặt, bật và khắc phục sự cố Plugin.
  </Card>
  <Card title="Bundle Plugin" href="/vi/plugins/bundles">
    Mô hình tương thích bundle.
  </Card>
  <Card title="Manifest Plugin" href="/vi/plugins/manifest">
    Các trường manifest và lược đồ cấu hình.
  </Card>
  <Card title="Bảo mật" href="/vi/gateway/security">
    Tăng cường bảo mật cho các bản cài đặt Plugin.
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

Để điều tra các thao tác cài đặt, kiểm tra, gỡ cài đặt hoặc làm mới registry chậm, hãy chạy lệnh với `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`. Trace ghi thời gian từng giai đoạn vào stderr và giữ đầu ra JSON có thể phân tích được. Xem [Gỡ lỗi](/vi/help/debugging#plugin-lifecycle-trace).

<Note>
Các Plugin đi kèm được phát hành cùng OpenClaw. Một số được bật theo mặc định (ví dụ như các nhà cung cấp mô hình đi kèm, nhà cung cấp giọng nói đi kèm và Plugin trình duyệt đi kèm); các Plugin khác yêu cầu `plugins enable`.

Plugin OpenClaw gốc phải phát hành kèm `openclaw.plugin.json` với JSON Schema nội tuyến (`configSchema`, ngay cả khi rỗng). Các bundle tương thích dùng manifest bundle riêng của chúng.

`plugins list` hiển thị `Format: openclaw` hoặc `Format: bundle`. Đầu ra list/info chi tiết cũng hiển thị loại phụ của bundle (`codex`, `claude`, hoặc `cursor`) cùng với các khả năng bundle được phát hiện.
</Note>

### Cài đặt

```bash
openclaw plugins install <package>                      # ClawHub first, then npm
openclaw plugins install clawhub:<package>              # ClawHub only
openclaw plugins install npm:<package>                  # npm only
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
ClawHub là bề mặt phân phối và khám phá chính cho hầu hết Plugin. Npm vẫn là đường dẫn dự phòng và cài đặt trực tiếp được hỗ trợ. Trong quá trình di chuyển sang ClawHub, OpenClaw vẫn phát hành một số package Plugin `@openclaw/*` do OpenClaw sở hữu trên npm; các phiên bản package đó có thể chậm hơn nguồn đi kèm giữa các đợt phát hành Plugin. Nếu npm báo một package Plugin do OpenClaw sở hữu là deprecated, phiên bản đã phát hành đó là một artifact bên ngoài cũ; hãy dùng Plugin đi kèm với OpenClaw hiện tại hoặc một checkout cục bộ cho đến khi package npm mới hơn được phát hành.
</Note>

<AccordionGroup>
  <Accordion title="Include cấu hình và khôi phục cấu hình không hợp lệ">
    Nếu phần `plugins` của bạn được hỗ trợ bởi một `$include` một tệp, `plugins install/update/enable/disable/uninstall` sẽ ghi xuyên qua tệp được include đó và giữ nguyên `openclaw.json`. Include gốc, mảng include và include có ghi đè ngang cấp sẽ fail closed thay vì làm phẳng. Xem [Include cấu hình](/vi/gateway/configuration) để biết các dạng được hỗ trợ.

    Nếu cấu hình không hợp lệ trong khi cài đặt, `plugins install` thường fail closed và yêu cầu bạn chạy `openclaw doctor --fix` trước. Trong quá trình khởi động Gateway, cấu hình không hợp lệ cho một Plugin được cô lập vào Plugin đó để các kênh và Plugin khác có thể tiếp tục chạy; `openclaw doctor --fix` có thể cách ly mục Plugin không hợp lệ. Ngoại lệ duy nhất được ghi tài liệu tại thời điểm cài đặt là đường dẫn khôi phục hẹp cho Plugin đi kèm, dành cho các Plugin chủ động chọn tham gia `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force và cài đặt lại so với cập nhật">
    `--force` dùng lại đích cài đặt hiện có và ghi đè một Plugin hoặc gói hook đã được cài đặt ngay tại chỗ. Dùng tùy chọn này khi bạn cố ý cài đặt lại cùng một id từ đường dẫn cục bộ, archive, package ClawHub hoặc artifact npm mới. Đối với nâng cấp thường lệ của một Plugin npm đã được theo dõi, hãy ưu tiên `openclaw plugins update <id-or-npm-spec>`.

    Nếu bạn chạy `plugins install` cho một id Plugin đã được cài đặt, OpenClaw sẽ dừng và chỉ bạn đến `plugins update <id-or-npm-spec>` cho nâng cấp thông thường, hoặc đến `plugins install <package> --force` khi bạn thật sự muốn ghi đè bản cài đặt hiện tại từ một nguồn khác.

  </Accordion>
  <Accordion title="Phạm vi --pin">
    `--pin` chỉ áp dụng cho các bản cài đặt npm. Tùy chọn này không được hỗ trợ với `--marketplace`, vì các bản cài đặt marketplace lưu metadata nguồn marketplace thay vì spec npm.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` là tùy chọn phá kính khẩn cấp cho các dương tính giả trong trình quét mã nguy hiểm tích hợp. Nó cho phép tiếp tục cài đặt ngay cả khi trình quét tích hợp báo phát hiện mức `critical`, nhưng **không** bỏ qua các chặn chính sách hook `before_install` của Plugin và **không** bỏ qua lỗi quét.

    Cờ CLI này áp dụng cho các luồng cài đặt/cập nhật Plugin. Các bản cài đặt phụ thuộc Skills dựa trên Gateway dùng override yêu cầu tương ứng `dangerouslyForceUnsafeInstall`, trong khi `openclaw skills install` vẫn là một luồng tải xuống/cài đặt Skills ClawHub riêng.

    Nếu một Plugin bạn phát hành trên ClawHub bị chặn bởi quét registry, hãy dùng các bước dành cho publisher trong [ClawHub](/vi/tools/clawhub).

  </Accordion>
  <Accordion title="Gói hook và spec npm">
    `plugins install` cũng là bề mặt cài đặt cho các gói hook phơi bày `openclaw.hooks` trong `package.json`. Dùng `openclaw hooks` để xem hook có lọc và bật từng hook, không phải để cài đặt package.

    Spec npm **chỉ dành cho registry** (tên package + **phiên bản chính xác** hoặc **dist-tag** tùy chọn). Spec Git/URL/file và dải semver bị từ chối. Cài đặt phụ thuộc chạy cục bộ theo dự án với `--ignore-scripts` để an toàn, ngay cả khi shell của bạn có thiết lập cài đặt npm toàn cục.

    Dùng `npm:<package>` khi bạn muốn bỏ qua tra cứu ClawHub và cài đặt trực tiếp từ npm. Spec package trần vẫn ưu tiên ClawHub và chỉ fallback sang npm khi ClawHub không có package hoặc phiên bản đó.

    Spec trần và `@latest` ở lại track ổn định. Nếu npm phân giải một trong hai thành prerelease, OpenClaw dừng và yêu cầu bạn chọn tham gia rõ ràng bằng một tag prerelease như `@beta`/`@rc` hoặc một phiên bản prerelease chính xác như `@1.2.3-beta.4`.

    Nếu một spec cài đặt trần khớp với id Plugin đi kèm (ví dụ `diffs`), OpenClaw cài đặt trực tiếp Plugin đi kèm. Để cài đặt một package npm có cùng tên, hãy dùng spec có scope rõ ràng (ví dụ `@scope/diffs`).

  </Accordion>
  <Accordion title="Archive">
    Archive được hỗ trợ: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Archive Plugin OpenClaw gốc phải chứa `openclaw.plugin.json` hợp lệ ở root Plugin sau khi giải nén; archive chỉ chứa `package.json` bị từ chối trước khi OpenClaw ghi bản ghi cài đặt.

    Các bản cài đặt marketplace Claude cũng được hỗ trợ.

  </Accordion>
</AccordionGroup>

Các bản cài đặt ClawHub dùng locator `clawhub:<package>` rõ ràng:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

OpenClaw giờ cũng ưu tiên ClawHub cho các spec Plugin an toàn với npm ở dạng trần. Nó chỉ fallback sang npm nếu ClawHub không có package hoặc phiên bản đó:

```bash
openclaw plugins install openclaw-codex-app-server
```

Dùng `npm:` để buộc chỉ phân giải bằng npm, ví dụ khi ClawHub không truy cập được hoặc bạn biết package chỉ tồn tại trên npm:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw tải archive package từ ClawHub, kiểm tra khả năng tương thích API Plugin / Gateway tối thiểu được quảng bá, rồi cài đặt thông qua đường dẫn archive thông thường. Các bản cài đặt được ghi lại giữ metadata nguồn ClawHub để cập nhật về sau.
Các bản cài đặt ClawHub không có phiên bản giữ spec đã ghi ở dạng không có phiên bản để `openclaw plugins update` có thể theo các bản phát hành ClawHub mới hơn; bộ chọn phiên bản hoặc tag rõ ràng như `clawhub:pkg@1.2.3` và `clawhub:pkg@beta` vẫn được ghim vào bộ chọn đó.

#### Cú pháp rút gọn marketplace

Dùng cú pháp rút gọn `plugin@marketplace` khi tên marketplace tồn tại trong bộ nhớ đệm registry cục bộ của Claude tại `~/.claude/plugins/known_marketplaces.json`:

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
    - tên marketplace đã biết của Claude từ `~/.claude/plugins/known_marketplaces.json`
    - root marketplace cục bộ hoặc đường dẫn `marketplace.json`
    - cú pháp rút gọn repo GitHub như `owner/repo`
    - URL repo GitHub như `https://github.com/owner/repo`
    - URL git

  </Tab>
  <Tab title="Quy tắc marketplace từ xa">
    Đối với marketplace từ xa được tải từ GitHub hoặc git, các mục Plugin phải nằm bên trong repo marketplace đã clone. OpenClaw chấp nhận nguồn đường dẫn tương đối từ repo đó và từ chối HTTP(S), đường dẫn tuyệt đối, git, GitHub và các nguồn Plugin không phải đường dẫn khác từ manifest từ xa.
  </Tab>
</Tabs>

Đối với đường dẫn cục bộ và archive, OpenClaw tự động phát hiện:

- Plugin OpenClaw gốc (`openclaw.plugin.json`)
- bundle tương thích với Codex (`.codex-plugin/plugin.json`)
- bundle tương thích với Claude (`.claude-plugin/plugin.json` hoặc bố cục thành phần Claude mặc định)
- bundle tương thích với Cursor (`.cursor-plugin/plugin.json`)

<Note>
Bundle tương thích được cài đặt vào root Plugin thông thường và tham gia cùng luồng list/info/enable/disable. Hiện tại, Skills của bundle, command-skills Claude, mặc định `settings.json` của Claude, mặc định `.lsp.json` / `lspServers` do manifest khai báo của Claude, command-skills Cursor và thư mục hook tương thích với Codex được hỗ trợ; các khả năng bundle được phát hiện khác được hiển thị trong diagnostics/info nhưng chưa được nối vào thực thi runtime.
</Note>

### Danh sách

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
  Chuyển từ dạng xem bảng sang các dòng chi tiết theo từng Plugin với metadata nguồn/xuất xứ/phiên bản/kích hoạt.
</ParamField>
<ParamField path="--json" type="boolean">
  Inventory máy đọc được cùng diagnostics registry.
</ParamField>

<Note>
`plugins list` đọc sổ đăng ký Plugin cục bộ đã lưu trước, với phương án dự phòng chỉ dẫn xuất từ manifest khi sổ đăng ký bị thiếu hoặc không hợp lệ. Lệnh này hữu ích để kiểm tra liệu một Plugin đã được cài đặt, bật và hiển thị cho kế hoạch khởi động nguội hay chưa, nhưng không phải là phép dò runtime trực tiếp đối với một tiến trình Gateway đang chạy sẵn. Sau khi thay đổi mã Plugin, trạng thái bật, chính sách hook hoặc `plugins.load.paths`, hãy khởi động lại Gateway phục vụ kênh trước khi kỳ vọng mã `register(api)` hoặc hook mới chạy. Với triển khai từ xa/container, hãy xác minh rằng bạn đang khởi động lại đúng tiến trình con `openclaw gateway run`, không chỉ một tiến trình bao bọc.
</Note>

Với công việc trên Plugin đóng gói sẵn bên trong một Docker image đã đóng gói, hãy bind-mount thư mục mã nguồn Plugin
đè lên đường dẫn mã nguồn đã đóng gói tương ứng, chẳng hạn như
`/app/extensions/synology-chat`. OpenClaw sẽ phát hiện lớp phủ mã nguồn được mount đó
trước `/app/dist/extensions/synology-chat`; một thư mục mã nguồn chỉ được sao chép
vẫn không hoạt động để các bản cài đặt đóng gói thông thường vẫn dùng dist đã biên dịch.

Để gỡ lỗi hook runtime:

- `openclaw plugins inspect <id> --json` hiển thị các hook đã đăng ký và chẩn đoán từ một lượt kiểm tra đã tải module.
- `openclaw gateway status --deep --require-rpc` xác nhận Gateway có thể truy cập, gợi ý dịch vụ/tiến trình, đường dẫn cấu hình và tình trạng RPC.
- Các hook hội thoại không đóng gói sẵn (`llm_input`, `llm_output`, `before_agent_finalize`, `agent_end`) yêu cầu `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Dùng `--link` để tránh sao chép một thư mục cục bộ (thêm vào `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` không được hỗ trợ cùng với `--link` vì các bản cài đặt liên kết tái sử dụng đường dẫn mã nguồn thay vì sao chép đè lên một đích cài đặt do hệ thống quản lý.

Dùng `--pin` trên các bản cài đặt npm để lưu spec chính xác đã phân giải (`name@version`) trong chỉ mục Plugin do hệ thống quản lý, trong khi vẫn giữ hành vi mặc định là không ghim.
</Note>

### Chỉ mục Plugin

Siêu dữ liệu cài đặt Plugin là trạng thái do máy quản lý, không phải cấu hình người dùng. Các thao tác cài đặt và cập nhật ghi dữ liệu này vào `plugins/installs.json` trong thư mục trạng thái OpenClaw đang hoạt động. Bản đồ cấp cao nhất `installRecords` là nguồn bền vững của siêu dữ liệu cài đặt, bao gồm cả bản ghi cho các manifest Plugin bị hỏng hoặc bị thiếu. Mảng `plugins` là bộ nhớ đệm sổ đăng ký nguội được dẫn xuất từ manifest. Tệp này bao gồm cảnh báo không chỉnh sửa và được dùng bởi `openclaw plugins update`, gỡ cài đặt, chẩn đoán và sổ đăng ký Plugin nguội.

Khi OpenClaw thấy các bản ghi `plugins.installs` cũ đã phát hành trong cấu hình, nó chuyển chúng vào chỉ mục Plugin và xóa khóa cấu hình; nếu một trong hai thao tác ghi thất bại, các bản ghi cấu hình được giữ lại để siêu dữ liệu cài đặt không bị mất.

### Phụ thuộc runtime

```bash
openclaw plugins deps
openclaw plugins deps --repair
openclaw plugins deps --prune
openclaw plugins deps --json
```

`plugins deps` kiểm tra tầng phụ thuộc runtime đã đóng gói cho các Plugin đóng gói sẵn thuộc OpenClaw được chọn bởi cấu hình Plugin, các kênh đã bật/cấu hình, các nhà cung cấp mô hình đã cấu hình hoặc mặc định manifest đóng gói sẵn. Đây không phải là đường dẫn cài đặt/cập nhật cho Plugin npm bên thứ ba hoặc Plugin ClawHub.

Dùng `--repair` khi một bản cài đặt đóng gói báo thiếu phụ thuộc runtime đóng gói sẵn trong lúc Gateway khởi động hoặc khi chạy `plugins doctor`. Sửa chữa chỉ cài đặt các phụ thuộc Plugin đóng gói sẵn còn thiếu đã được bật, với lifecycle scripts bị tắt. Dùng `--prune` để xóa các gốc phụ thuộc runtime bên ngoài cũ, không xác định, còn sót lại từ các bố cục đóng gói cũ hơn.

### Gỡ cài đặt

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` xóa bản ghi Plugin khỏi `plugins.entries`, chỉ mục Plugin đã lưu, các mục danh sách cho phép/từ chối Plugin và các mục `plugins.load.paths` đã liên kết khi áp dụng. Trừ khi đặt `--keep-files`, thao tác gỡ cài đặt cũng xóa thư mục cài đặt do hệ thống quản lý đã được theo dõi khi thư mục đó nằm trong gốc plugin extensions của OpenClaw. Với các Plugin Active Memory, khe bộ nhớ đặt lại thành `memory-core`.

<Note>
`--keep-config` được hỗ trợ như một bí danh đã lỗi thời cho `--keep-files`.
</Note>

### Cập nhật

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call@beta
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

Các bản cập nhật áp dụng cho các bản cài đặt Plugin được theo dõi trong chỉ mục Plugin do hệ thống quản lý và các bản cài đặt hook-pack được theo dõi trong `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="Phân giải id Plugin so với spec npm">
    Khi bạn truyền một id Plugin, OpenClaw tái sử dụng spec cài đặt đã ghi lại cho Plugin đó. Điều đó nghĩa là các dist-tag đã lưu trước đó như `@beta` và các phiên bản ghim chính xác tiếp tục được dùng trong những lần chạy `update <id>` sau này.

    Với các bản cài đặt npm, bạn cũng có thể truyền một spec gói npm rõ ràng với dist-tag hoặc phiên bản chính xác. OpenClaw phân giải tên gói đó trở lại bản ghi Plugin được theo dõi, cập nhật Plugin đã cài đặt đó và ghi lại spec npm mới cho các lần cập nhật dựa trên id trong tương lai.

    Truyền tên gói npm không kèm phiên bản hoặc tag cũng phân giải trở lại bản ghi Plugin được theo dõi. Dùng cách này khi một Plugin đã được ghim vào một phiên bản chính xác và bạn muốn chuyển nó trở lại dòng phát hành mặc định của sổ đăng ký.

  </Accordion>
  <Accordion title="Kiểm tra phiên bản và lệch integrity">
    Trước một bản cập nhật npm trực tiếp, OpenClaw kiểm tra phiên bản gói đã cài đặt so với siêu dữ liệu sổ đăng ký npm. Nếu phiên bản đã cài đặt và danh tính tạo tác đã ghi lại đã khớp với đích đã phân giải, bản cập nhật sẽ được bỏ qua mà không tải xuống, cài đặt lại hoặc ghi lại `openclaw.json`.

    Khi tồn tại hash integrity đã lưu và hash tạo tác đã tải về thay đổi, OpenClaw coi đó là lệch tạo tác npm. Lệnh tương tác `openclaw plugins update` in hash dự kiến và hash thực tế, rồi yêu cầu xác nhận trước khi tiếp tục. Các trình trợ giúp cập nhật không tương tác sẽ thất bại đóng trừ khi bên gọi cung cấp một chính sách tiếp tục rõ ràng.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install khi cập nhật">
    `--dangerously-force-unsafe-install` cũng có trên `plugins update` như một ghi đè khẩn cấp cho các kết quả dương tính giả của quét mã nguy hiểm tích hợp trong khi cập nhật Plugin. Nó vẫn không bỏ qua các chặn chính sách `before_install` của Plugin hoặc chặn do lỗi quét, và chỉ áp dụng cho cập nhật Plugin, không áp dụng cho cập nhật hook-pack.
  </Accordion>
</AccordionGroup>

### Kiểm tra

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
```

Nội quan sâu cho một Plugin duy nhất. Hiển thị danh tính, trạng thái tải, nguồn, các capability đã đăng ký, hook, công cụ, lệnh, dịch vụ, phương thức Gateway, tuyến HTTP, cờ chính sách, chẩn đoán, siêu dữ liệu cài đặt, capability gói và mọi hỗ trợ máy chủ MCP hoặc LSP được phát hiện.

Mỗi Plugin được phân loại theo những gì nó thực sự đăng ký ở runtime:

- **plain-capability** — một loại capability (ví dụ: một Plugin chỉ dành cho nhà cung cấp)
- **hybrid-capability** — nhiều loại capability (ví dụ: văn bản + giọng nói + hình ảnh)
- **hook-only** — chỉ hook, không có capability hoặc bề mặt
- **non-capability** — công cụ/lệnh/dịch vụ nhưng không có capability

Xem [Hình dạng Plugin](/vi/plugins/architecture#plugin-shapes) để biết thêm về mô hình capability.

<Note>
Cờ `--json` xuất báo cáo máy có thể đọc, phù hợp cho script và kiểm toán. `inspect --all` hiển thị một bảng trên toàn bộ đội với các cột hình dạng, loại capability, thông báo tương thích, capability gói và tóm tắt hook. `info` là bí danh cho `inspect`.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` báo cáo lỗi tải Plugin, chẩn đoán manifest/phát hiện và thông báo tương thích. Khi mọi thứ sạch, nó in `No plugin issues detected.`

Với các lỗi hình dạng module như thiếu export `register`/`activate`, hãy chạy lại với `OPENCLAW_PLUGIN_LOAD_DEBUG=1` để đưa bản tóm tắt hình dạng export gọn vào đầu ra chẩn đoán.

### Sổ đăng ký

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Sổ đăng ký Plugin cục bộ là mô hình đọc nguội đã lưu của OpenClaw cho danh tính Plugin đã cài đặt, trạng thái bật, siêu dữ liệu nguồn và quyền sở hữu đóng góp. Khởi động thông thường, tra cứu chủ sở hữu nhà cung cấp, phân loại thiết lập kênh và kiểm kê Plugin có thể đọc nó mà không cần import các module runtime Plugin.

Dùng `plugins registry` để kiểm tra liệu sổ đăng ký đã lưu có hiện diện, hiện hành hoặc cũ hay không. Dùng `--refresh` để xây dựng lại nó từ chỉ mục Plugin đã lưu, chính sách cấu hình và siêu dữ liệu manifest/package. Đây là đường dẫn sửa chữa, không phải đường dẫn kích hoạt runtime.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` là công tắc tương thích khẩn cấp đã lỗi thời cho lỗi đọc sổ đăng ký. Ưu tiên `plugins registry --refresh` hoặc `openclaw doctor --fix`; phương án dự phòng env chỉ dành cho khôi phục khởi động khẩn cấp trong lúc migration được triển khai.
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Danh sách Marketplace chấp nhận một đường dẫn marketplace cục bộ, một đường dẫn `marketplace.json`, một cách viết tắt GitHub như `owner/repo`, một URL repo GitHub hoặc một URL git. `--json` in nhãn nguồn đã phân giải cùng với manifest marketplace đã phân tích cú pháp và các mục Plugin.

## Liên quan

- [Xây dựng Plugin](/vi/plugins/building-plugins)
- [Tham chiếu CLI](/vi/cli)
- [Plugin cộng đồng](/vi/plugins/community)
