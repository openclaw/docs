---
read_when:
    - Bạn muốn cài đặt hoặc quản lý các Plugin Gateway hoặc các gói tương thích
    - Bạn muốn gỡ lỗi các trường hợp tải Plugin không thành công
sidebarTitle: Plugins
summary: Tài liệu tham khảo CLI cho `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, deps, doctor)
title: Plugin
x-i18n:
    generated_at: "2026-04-30T00:06:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: c1ba79bccbbb74e3403188afc2dffc06e4215d433e2b23ed998b1fb09419601b
    source_path: cli/plugins.md
    workflow: 16
---

Quản lý các Plugin Gateway, hook pack và bundle tương thích.

<CardGroup cols={2}>
  <Card title="Hệ thống Plugin" href="/vi/tools/plugin">
    Hướng dẫn cho người dùng cuối về cài đặt, bật và khắc phục sự cố Plugin.
  </Card>
  <Card title="Bundle Plugin" href="/vi/plugins/bundles">
    Mô hình tương thích bundle.
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

Để điều tra cài đặt, kiểm tra, gỡ cài đặt hoặc làm mới registry chậm, hãy chạy lệnh với `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`. Trace ghi thời gian từng pha vào stderr và giữ cho đầu ra JSON có thể phân tích cú pháp. Xem [Gỡ lỗi](/vi/help/debugging#plugin-lifecycle-trace).

<Note>
Các Plugin đi kèm được phát hành cùng OpenClaw. Một số được bật theo mặc định (ví dụ như nhà cung cấp mô hình đi kèm, nhà cung cấp giọng nói đi kèm và Plugin trình duyệt đi kèm); các Plugin khác yêu cầu `plugins enable`.

Plugin OpenClaw gốc phải phát hành `openclaw.plugin.json` với JSON Schema nội tuyến (`configSchema`, ngay cả khi rỗng). Bundle tương thích dùng manifest bundle riêng của chúng.

`plugins list` hiển thị `Format: openclaw` hoặc `Format: bundle`. Đầu ra list/info chi tiết cũng hiển thị kiểu con của bundle (`codex`, `claude`, hoặc `cursor`) cùng với các khả năng bundle được phát hiện.
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
Tên gói trần được kiểm tra với ClawHub trước, rồi đến npm. Hãy xem việc cài đặt Plugin như chạy mã. Ưu tiên phiên bản được ghim.
</Warning>

<Note>
ClawHub là bề mặt phân phối và khám phá chính cho hầu hết Plugin. Npm vẫn là đường dẫn dự phòng và cài đặt trực tiếp được hỗ trợ. Trong quá trình di chuyển sang ClawHub, OpenClaw vẫn phát hành một số gói Plugin `@openclaw/*` do OpenClaw sở hữu trên npm; các phiên bản gói đó có thể tụt lại so với mã nguồn đi kèm giữa các đợt phát hành Plugin. Nếu npm báo một gói Plugin do OpenClaw sở hữu là đã ngừng khuyến nghị sử dụng, phiên bản đã phát hành đó là một artifact bên ngoài cũ; hãy dùng Plugin đi kèm với OpenClaw hiện tại hoặc một checkout cục bộ cho đến khi gói npm mới hơn được phát hành.
</Note>

<AccordionGroup>
  <Accordion title="Include cấu hình và khôi phục cấu hình không hợp lệ">
    Nếu phần `plugins` của bạn được hỗ trợ bởi một `$include` một tệp, `plugins install/update/enable/disable/uninstall` ghi xuyên qua tệp được include đó và giữ nguyên `openclaw.json`. Include gốc, mảng include và include có override cùng cấp sẽ thất bại đóng thay vì làm phẳng. Xem [Include cấu hình](/vi/gateway/configuration) để biết các dạng được hỗ trợ.

    Nếu cấu hình không hợp lệ trong khi cài đặt, `plugins install` thường thất bại đóng và yêu cầu bạn chạy `openclaw doctor --fix` trước. Trong quá trình khởi động Gateway, cấu hình không hợp lệ cho một Plugin được cô lập vào Plugin đó để các kênh và Plugin khác có thể tiếp tục chạy; `openclaw doctor --fix` có thể cách ly mục nhập Plugin không hợp lệ. Ngoại lệ duy nhất được tài liệu hóa tại thời điểm cài đặt là đường dẫn khôi phục hẹp cho Plugin đi kèm đối với các Plugin chọn rõ ràng `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force và cài đặt lại so với cập nhật">
    `--force` dùng lại đích cài đặt hiện có và ghi đè một Plugin hoặc hook pack đã cài đặt tại chỗ. Dùng tùy chọn này khi bạn cố ý cài đặt lại cùng một id từ một đường dẫn cục bộ, archive, gói ClawHub hoặc artifact npm mới. Với nâng cấp thường lệ của một Plugin npm đã được theo dõi, hãy ưu tiên `openclaw plugins update <id-or-npm-spec>`.

    Nếu bạn chạy `plugins install` cho một id Plugin đã được cài đặt, OpenClaw dừng lại và chỉ bạn đến `plugins update <id-or-npm-spec>` để nâng cấp thông thường, hoặc đến `plugins install <package> --force` khi bạn thật sự muốn ghi đè cài đặt hiện tại từ một nguồn khác.

  </Accordion>
  <Accordion title="Phạm vi --pin">
    `--pin` chỉ áp dụng cho cài đặt npm. Tùy chọn này không được hỗ trợ với `--marketplace`, vì cài đặt marketplace lưu metadata nguồn marketplace thay vì một spec npm.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` là tùy chọn phá kính cho các kết quả dương tính giả trong bộ quét mã nguy hiểm tích hợp. Tùy chọn này cho phép cài đặt tiếp tục ngay cả khi bộ quét tích hợp báo phát hiện mức `critical`, nhưng **không** bỏ qua các chặn chính sách hook `before_install` của Plugin và **không** bỏ qua lỗi quét.

    Cờ CLI này áp dụng cho luồng cài đặt/cập nhật Plugin. Cài đặt phụ thuộc Skills do Gateway hỗ trợ dùng override yêu cầu tương ứng `dangerouslyForceUnsafeInstall`, trong khi `openclaw skills install` vẫn là một luồng tải xuống/cài đặt Skills ClawHub riêng.

    Nếu một Plugin bạn đã phát hành trên ClawHub bị chặn bởi quét registry, hãy dùng các bước dành cho nhà phát hành trong [ClawHub](/vi/tools/clawhub).

  </Accordion>
  <Accordion title="Hook pack và spec npm">
    `plugins install` cũng là bề mặt cài đặt cho các hook pack phơi bày `openclaw.hooks` trong `package.json`. Dùng `openclaw hooks` để hiển thị hook có lọc và bật từng hook, không phải để cài đặt gói.

    Spec npm là **chỉ registry** (tên gói + **phiên bản chính xác** hoặc **dist-tag** tùy chọn). Spec Git/URL/file và dải semver bị từ chối. Cài đặt phụ thuộc chạy theo dự án cục bộ với `--ignore-scripts` để an toàn, ngay cả khi shell của bạn có thiết lập cài đặt npm toàn cục.

    Dùng `npm:<package>` khi bạn muốn bỏ qua tra cứu ClawHub và cài đặt trực tiếp từ npm. Spec gói trần vẫn ưu tiên ClawHub và chỉ rơi về npm khi ClawHub không có gói hoặc phiên bản đó.

    Spec trần và `@latest` vẫn ở kênh ổn định. Nếu npm phân giải một trong hai thành bản prerelease, OpenClaw dừng lại và yêu cầu bạn chọn tham gia rõ ràng bằng một thẻ prerelease như `@beta`/`@rc` hoặc một phiên bản prerelease chính xác như `@1.2.3-beta.4`.

    Nếu spec cài đặt trần khớp với id Plugin đi kèm (ví dụ `diffs`), OpenClaw cài đặt trực tiếp Plugin đi kèm. Để cài đặt một gói npm cùng tên, hãy dùng spec có scope rõ ràng (ví dụ `@scope/diffs`).

  </Accordion>
  <Accordion title="Archive">
    Archive được hỗ trợ: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Archive Plugin OpenClaw gốc phải chứa `openclaw.plugin.json` hợp lệ ở gốc Plugin sau khi giải nén; archive chỉ chứa `package.json` bị từ chối trước khi OpenClaw ghi bản ghi cài đặt.

    Cài đặt marketplace Claude cũng được hỗ trợ.

  </Accordion>
</AccordionGroup>

Cài đặt ClawHub dùng locator `clawhub:<package>` rõ ràng:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

OpenClaw hiện cũng ưu tiên ClawHub cho spec Plugin trần an toàn với npm. OpenClaw chỉ rơi về npm nếu ClawHub không có gói hoặc phiên bản đó:

```bash
openclaw plugins install openclaw-codex-app-server
```

Dùng `npm:` để buộc chỉ phân giải npm, ví dụ khi không truy cập được ClawHub hoặc bạn biết gói chỉ tồn tại trên npm:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw tải xuống archive gói từ ClawHub, kiểm tra API Plugin được công bố / khả năng tương thích Gateway tối thiểu, rồi cài đặt qua đường dẫn archive thông thường. Các cài đặt đã ghi giữ metadata nguồn ClawHub của chúng để cập nhật sau này.
Cài đặt ClawHub không có phiên bản giữ spec đã ghi không có phiên bản để `openclaw plugins update` có thể theo các bản phát hành ClawHub mới hơn; selector phiên bản hoặc thẻ rõ ràng như `clawhub:pkg@1.2.3` và `clawhub:pkg@beta` vẫn được ghim vào selector đó.

#### Viết tắt marketplace

Dùng viết tắt `plugin@marketplace` khi tên marketplace tồn tại trong cache registry cục bộ của Claude tại `~/.claude/plugins/known_marketplaces.json`:

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
    - viết tắt repo GitHub như `owner/repo`
    - URL repo GitHub như `https://github.com/owner/repo`
    - URL git

  </Tab>
  <Tab title="Quy tắc marketplace từ xa">
    Đối với marketplace từ xa được tải từ GitHub hoặc git, các mục Plugin phải nằm bên trong repo marketplace đã clone. OpenClaw chấp nhận nguồn đường dẫn tương đối từ repo đó và từ chối HTTP(S), đường dẫn tuyệt đối, git, GitHub và các nguồn Plugin không phải đường dẫn khác từ manifest từ xa.
  </Tab>
</Tabs>

Đối với đường dẫn cục bộ và archive, OpenClaw tự động phát hiện:

- Plugin OpenClaw gốc (`openclaw.plugin.json`)
- bundle tương thích Codex (`.codex-plugin/plugin.json`)
- bundle tương thích Claude (`.claude-plugin/plugin.json` hoặc bố cục thành phần Claude mặc định)
- bundle tương thích Cursor (`.cursor-plugin/plugin.json`)

<Note>
Bundle tương thích cài vào gốc Plugin thông thường và tham gia cùng luồng list/info/enable/disable. Hiện tại, bundle skills, command-skills của Claude, mặc định `settings.json` của Claude, mặc định `.lsp.json` / `lspServers` được khai báo trong manifest của Claude, command-skills của Cursor và thư mục hook Codex tương thích được hỗ trợ; các khả năng bundle được phát hiện khác được hiển thị trong diagnostics/info nhưng chưa được nối vào thực thi runtime.
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
  Chuyển từ chế độ xem bảng sang các dòng chi tiết theo từng Plugin với metadata nguồn/xuất xứ/phiên bản/kích hoạt.
</ParamField>
<ParamField path="--json" type="boolean">
  Inventory có thể đọc bằng máy cùng diagnostics registry.
</ParamField>

<Note>
`plugins list` đọc sổ đăng ký Plugin cục bộ đã lưu trước, với phương án dự phòng được suy ra chỉ từ manifest khi sổ đăng ký bị thiếu hoặc không hợp lệ. Lệnh này hữu ích để kiểm tra một Plugin có được cài đặt, bật và hiển thị cho kế hoạch khởi động nguội hay không, nhưng không phải là phép dò runtime trực tiếp của một tiến trình Gateway đang chạy. Sau khi thay đổi mã Plugin, trạng thái bật, chính sách hook hoặc `plugins.load.paths`, hãy khởi động lại Gateway phục vụ kênh trước khi kỳ vọng mã `register(api)` hoặc hook mới chạy. Với các triển khai từ xa/container, hãy xác minh bạn đang khởi động lại đúng tiến trình con `openclaw gateway run`, không chỉ một tiến trình wrapper.
</Note>

Đối với công việc trên Plugin đi kèm bên trong ảnh Docker đã đóng gói, hãy bind-mount thư mục nguồn Plugin
đè lên đường dẫn nguồn đã đóng gói tương ứng, chẳng hạn như
`/app/extensions/synology-chat`. OpenClaw sẽ phát hiện overlay nguồn đã mount đó
trước `/app/dist/extensions/synology-chat`; một thư mục nguồn được sao chép thông thường
vẫn không có hiệu lực để các bản cài đặt đóng gói thông thường vẫn dùng dist đã biên dịch.

Để gỡ lỗi hook runtime:

- `openclaw plugins inspect <id> --json` hiển thị các hook đã đăng ký và chẩn đoán từ một lượt kiểm tra đã tải module.
- `openclaw gateway status --deep --require-rpc` xác nhận Gateway có thể truy cập, gợi ý dịch vụ/tiến trình, đường dẫn cấu hình và tình trạng RPC.
- Các hook hội thoại không đi kèm (`llm_input`, `llm_output`, `before_agent_finalize`, `agent_end`) yêu cầu `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Dùng `--link` để tránh sao chép một thư mục cục bộ (thêm vào `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` không được hỗ trợ với `--link` vì các bản cài đặt liên kết dùng lại đường dẫn nguồn thay vì sao chép đè lên một đích cài đặt được quản lý.

Dùng `--pin` trên các bản cài đặt npm để lưu spec chính xác đã phân giải (`name@version`) trong chỉ mục Plugin được quản lý, trong khi vẫn giữ hành vi mặc định là không ghim.
</Note>

### Chỉ mục Plugin

Siêu dữ liệu cài đặt Plugin là trạng thái do máy quản lý, không phải cấu hình người dùng. Các thao tác cài đặt và cập nhật ghi nó vào `plugins/installs.json` trong thư mục trạng thái OpenClaw đang hoạt động. Bản đồ `installRecords` cấp cao nhất của nó là nguồn bền vững cho siêu dữ liệu cài đặt, bao gồm các bản ghi cho manifest Plugin bị hỏng hoặc bị thiếu. Mảng `plugins` là bộ nhớ đệm sổ đăng ký nguội được suy ra từ manifest. Tệp này bao gồm cảnh báo không chỉnh sửa và được dùng bởi `openclaw plugins update`, gỡ cài đặt, chẩn đoán và sổ đăng ký Plugin nguội.

Khi OpenClaw thấy các bản ghi `plugins.installs` cũ được phát hành trong cấu hình, nó chuyển chúng vào chỉ mục Plugin và xóa khóa cấu hình; nếu một trong hai thao tác ghi thất bại, các bản ghi cấu hình sẽ được giữ lại để siêu dữ liệu cài đặt không bị mất.

### Phụ thuộc runtime

```bash
openclaw plugins deps
openclaw plugins deps --repair
openclaw plugins deps --prune
openclaw plugins deps --json
```

`plugins deps` kiểm tra giai đoạn phụ thuộc runtime đã đóng gói cho các Plugin đi kèm do OpenClaw sở hữu. Đây không phải là đường dẫn cài đặt/cập nhật cho Plugin npm bên thứ ba hoặc ClawHub.

Dùng `--repair` khi một bản cài đặt đóng gói báo thiếu phụ thuộc runtime đi kèm trong lúc khởi động Gateway hoặc `plugins doctor`. Sửa chữa chỉ cài đặt các phụ thuộc Plugin đi kèm đang bật bị thiếu với lifecycle scripts bị tắt. Dùng `--prune` để xóa các gốc phụ thuộc runtime bên ngoài không xác định đã lỗi thời còn sót lại từ các bố cục đóng gói cũ hơn.

### Gỡ cài đặt

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` xóa bản ghi Plugin khỏi `plugins.entries`, chỉ mục Plugin đã lưu, các mục trong danh sách cho phép/từ chối Plugin, và các mục `plugins.load.paths` đã liên kết khi áp dụng. Trừ khi đặt `--keep-files`, gỡ cài đặt cũng xóa thư mục cài đặt được quản lý đã theo dõi khi thư mục đó nằm trong gốc phần mở rộng Plugin của OpenClaw. Đối với các Plugin active memory, slot bộ nhớ đặt lại về `memory-core`.

<Note>
`--keep-config` được hỗ trợ dưới dạng bí danh đã ngừng khuyến nghị cho `--keep-files`.
</Note>

### Cập nhật

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call@beta
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

Các bản cập nhật áp dụng cho các bản cài đặt Plugin đã theo dõi trong chỉ mục Plugin được quản lý và các bản cài đặt hook-pack đã theo dõi trong `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="Resolving plugin id vs npm spec">
    Khi bạn truyền một id Plugin, OpenClaw dùng lại spec cài đặt đã ghi cho Plugin đó. Điều đó có nghĩa là các dist-tag đã lưu trước đó như `@beta` và các phiên bản ghim chính xác tiếp tục được dùng trong các lần chạy `update <id>` sau này.

    Với các bản cài đặt npm, bạn cũng có thể truyền một spec gói npm rõ ràng với dist-tag hoặc phiên bản chính xác. OpenClaw phân giải tên gói đó trở lại bản ghi Plugin đã theo dõi, cập nhật Plugin đã cài đặt đó và ghi lại spec npm mới cho các lần cập nhật dựa trên id trong tương lai.

    Truyền tên gói npm mà không có phiên bản hoặc tag cũng phân giải trở lại bản ghi Plugin đã theo dõi. Dùng cách này khi một Plugin đã được ghim vào một phiên bản chính xác và bạn muốn chuyển nó trở lại dòng phát hành mặc định của registry.

  </Accordion>
  <Accordion title="Version checks and integrity drift">
    Trước một bản cập nhật npm trực tiếp, OpenClaw kiểm tra phiên bản gói đã cài đặt so với siêu dữ liệu registry npm. Nếu phiên bản đã cài đặt và danh tính artifact đã ghi đã khớp với đích đã phân giải, bản cập nhật sẽ bị bỏ qua mà không tải xuống, cài đặt lại hoặc ghi lại `openclaw.json`.

    Khi có hash integrity đã lưu và hash artifact đã fetch thay đổi, OpenClaw xem đó là hiện tượng trôi artifact npm. Lệnh tương tác `openclaw plugins update` in ra các hash kỳ vọng và thực tế rồi yêu cầu xác nhận trước khi tiếp tục. Các helper cập nhật không tương tác sẽ thất bại đóng trừ khi caller cung cấp một chính sách tiếp tục rõ ràng.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install on update">
    `--dangerously-force-unsafe-install` cũng có trên `plugins update` như một override khẩn cấp cho các false positive của quét mã nguy hiểm tích hợp trong lúc cập nhật Plugin. Nó vẫn không bỏ qua các chặn chính sách `before_install` của Plugin hoặc chặn do lỗi quét, và chỉ áp dụng cho cập nhật Plugin, không áp dụng cho cập nhật hook-pack.
  </Accordion>
</AccordionGroup>

### Kiểm tra

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
```

Nội quan sâu cho một Plugin duy nhất. Hiển thị danh tính, trạng thái tải, nguồn, capability đã đăng ký, hook, công cụ, lệnh, dịch vụ, phương thức Gateway, tuyến HTTP, cờ chính sách, chẩn đoán, siêu dữ liệu cài đặt, capability bundle và mọi hỗ trợ máy chủ MCP hoặc LSP được phát hiện.

Mỗi Plugin được phân loại theo những gì nó thực sự đăng ký ở runtime:

- **plain-capability** — một loại capability (ví dụ: Plugin chỉ dành cho provider)
- **hybrid-capability** — nhiều loại capability (ví dụ: văn bản + giọng nói + hình ảnh)
- **hook-only** — chỉ hook, không có capability hoặc bề mặt
- **non-capability** — công cụ/lệnh/dịch vụ nhưng không có capability

Xem [Các dạng Plugin](/vi/plugins/architecture#plugin-shapes) để biết thêm về mô hình capability.

<Note>
Cờ `--json` xuất báo cáo máy đọc được, phù hợp cho script và kiểm toán. `inspect --all` hiển thị một bảng toàn hệ thống với các cột dạng, loại capability, thông báo tương thích, capability bundle và tóm tắt hook. `info` là bí danh của `inspect`.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` báo cáo lỗi tải Plugin, chẩn đoán manifest/discovery và thông báo tương thích. Khi mọi thứ sạch, nó in `No plugin issues detected.`

Đối với các lỗi dạng module như thiếu export `register`/`activate`, hãy chạy lại với `OPENCLAW_PLUGIN_LOAD_DEBUG=1` để bao gồm bản tóm tắt dạng export ngắn gọn trong đầu ra chẩn đoán.

### Registry

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Sổ đăng ký Plugin cục bộ là mô hình đọc nguội đã lưu của OpenClaw cho danh tính Plugin đã cài đặt, trạng thái bật, siêu dữ liệu nguồn và quyền sở hữu đóng góp. Khởi động thông thường, tra cứu chủ sở hữu provider, phân loại thiết lập kênh và kiểm kê Plugin có thể đọc nó mà không cần import module runtime của Plugin.

Dùng `plugins registry` để kiểm tra sổ đăng ký đã lưu có tồn tại, hiện hành hay lỗi thời hay không. Dùng `--refresh` để xây dựng lại nó từ chỉ mục Plugin đã lưu, chính sách cấu hình và siêu dữ liệu manifest/package. Đây là đường dẫn sửa chữa, không phải đường dẫn kích hoạt runtime.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` là công tắc tương thích khẩn cấp đã ngừng khuyến nghị cho lỗi đọc registry. Ưu tiên `plugins registry --refresh` hoặc `openclaw doctor --fix`; fallback env chỉ dành cho phục hồi khởi động khẩn cấp trong khi quá trình migration được triển khai.
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Danh sách Marketplace chấp nhận một đường dẫn marketplace cục bộ, một đường dẫn `marketplace.json`, dạng viết tắt GitHub như `owner/repo`, một URL repo GitHub hoặc một URL git. `--json` in nhãn nguồn đã phân giải cùng với manifest marketplace đã phân tích cú pháp và các mục Plugin.

## Liên quan

- [Xây dựng Plugin](/vi/plugins/building-plugins)
- [Tham chiếu CLI](/vi/cli)
- [Plugin cộng đồng](/vi/plugins/community)
