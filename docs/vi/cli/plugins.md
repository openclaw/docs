---
read_when:
    - Bạn muốn cài đặt hoặc quản lý các Plugin Gateway hoặc các gói tương thích
    - Bạn muốn gỡ lỗi các sự cố tải Plugin
sidebarTitle: Plugins
summary: Tài liệu tham khảo CLI cho `openclaw plugins` (liệt kê, cài đặt, marketplace, gỡ cài đặt, bật/tắt, doctor)
title: Plugin
x-i18n:
    generated_at: "2026-04-29T22:33:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 68d6a2734c7b4a3608467c64426f48bdf8dc1a36e33b51ba024313fc36762b5b
    source_path: cli/plugins.md
    workflow: 16
---

Quản lý Plugin Gateway, gói hook và bundle tương thích.

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
openclaw plugins doctor
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins marketplace list <marketplace>
openclaw plugins marketplace list <marketplace> --json
```

Để điều tra quá trình cài đặt, kiểm tra, gỡ cài đặt hoặc làm mới registry bị chậm, hãy chạy
lệnh với `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`. Trace ghi thời gian từng giai đoạn
vào stderr và vẫn giữ đầu ra JSON có thể phân tích. Xem [Gỡ lỗi](/vi/help/debugging#plugin-lifecycle-trace).

<Note>
Các Plugin được bundle đi kèm OpenClaw. Một số được bật theo mặc định (ví dụ: nhà cung cấp mô hình được bundle, nhà cung cấp giọng nói được bundle và Plugin trình duyệt được bundle); các Plugin khác yêu cầu `plugins enable`.

Plugin OpenClaw gốc phải đi kèm `openclaw.plugin.json` với JSON Schema nội tuyến (`configSchema`, kể cả khi rỗng). Bundle tương thích dùng manifest bundle riêng của chúng.

`plugins list` hiển thị `Format: openclaw` hoặc `Format: bundle`. Đầu ra list/info chi tiết cũng hiển thị subtype của bundle (`codex`, `claude` hoặc `cursor`) cùng các khả năng bundle được phát hiện.
</Note>

### Cài đặt

```bash
openclaw plugins install <package>                      # ClawHub trước, rồi npm
openclaw plugins install clawhub:<package>              # chỉ ClawHub
openclaw plugins install npm:<package>                  # chỉ npm
openclaw plugins install <package> --force              # ghi đè cài đặt hiện có
openclaw plugins install <package> --pin                # ghim phiên bản
openclaw plugins install <package> --dangerously-force-unsafe-install
openclaw plugins install <path>                         # đường dẫn cục bộ
openclaw plugins install <plugin>@<marketplace>         # marketplace
openclaw plugins install <plugin> --marketplace <name>  # marketplace (tường minh)
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
```

<Warning>
Tên package trần được kiểm tra với ClawHub trước, rồi đến npm. Hãy xem việc cài đặt Plugin như chạy mã. Ưu tiên các phiên bản đã ghim.
</Warning>

<Note>
ClawHub là bề mặt phân phối và khám phá chính cho hầu hết Plugin. Npm
vẫn là đường dẫn dự phòng và cài đặt trực tiếp được hỗ trợ. Trong quá trình chuyển đổi sang
ClawHub, OpenClaw vẫn phát hành một số package Plugin `@openclaw/*` do OpenClaw sở hữu
trên npm; các phiên bản package đó có thể chậm hơn mã nguồn được bundle giữa các đợt phát hành
Plugin. Nếu npm báo một package Plugin do OpenClaw sở hữu là deprecated, thì
phiên bản đã phát hành đó là một artifact bên ngoài cũ; hãy dùng Plugin được bundle với
OpenClaw hiện tại hoặc một checkout cục bộ cho đến khi package npm mới hơn được phát hành.
</Note>

<AccordionGroup>
  <Accordion title="Include cấu hình và khôi phục cấu hình không hợp lệ">
    Nếu phần `plugins` của bạn được hỗ trợ bởi một `$include` một tệp, `plugins install/update/enable/disable/uninstall` sẽ ghi xuyên qua tệp được include đó và giữ nguyên `openclaw.json`. Include gốc, mảng include và include có override cùng cấp sẽ fail closed thay vì làm phẳng. Xem [Include cấu hình](/vi/gateway/configuration) để biết các dạng được hỗ trợ.

    Nếu cấu hình không hợp lệ trong lúc cài đặt, `plugins install` thường fail closed và yêu cầu bạn chạy `openclaw doctor --fix` trước. Trong quá trình khởi động Gateway, cấu hình không hợp lệ của một Plugin được cô lập vào Plugin đó để các kênh và Plugin khác có thể tiếp tục chạy; `openclaw doctor --fix` có thể cách ly mục Plugin không hợp lệ. Ngoại lệ duy nhất tại thời điểm cài đặt được tài liệu hóa là đường dẫn khôi phục hẹp cho Plugin được bundle, dành cho các Plugin tường minh chọn tham gia `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force và cài đặt lại so với cập nhật">
    `--force` tái sử dụng đích cài đặt hiện có và ghi đè một Plugin hoặc gói hook đã cài đặt ngay tại chỗ. Dùng tùy chọn này khi bạn cố ý cài đặt lại cùng một id từ một đường dẫn cục bộ, archive, package ClawHub hoặc artifact npm mới. Với các nâng cấp thường lệ của một Plugin npm đã được theo dõi, hãy ưu tiên `openclaw plugins update <id-or-npm-spec>`.

    Nếu bạn chạy `plugins install` cho một id Plugin đã được cài đặt, OpenClaw sẽ dừng và chỉ bạn đến `plugins update <id-or-npm-spec>` cho nâng cấp thông thường, hoặc đến `plugins install <package> --force` khi bạn thật sự muốn ghi đè cài đặt hiện tại từ một nguồn khác.

  </Accordion>
  <Accordion title="Phạm vi --pin">
    `--pin` chỉ áp dụng cho cài đặt npm. Tùy chọn này không được hỗ trợ với `--marketplace`, vì cài đặt marketplace lưu metadata nguồn marketplace thay vì một spec npm.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` là tùy chọn phá kính khẩn cấp cho các trường hợp dương tính giả trong trình quét mã nguy hiểm tích hợp. Tùy chọn này cho phép tiếp tục cài đặt ngay cả khi trình quét tích hợp báo phát hiện `critical`, nhưng **không** bỏ qua các chặn chính sách hook `before_install` của Plugin và **không** bỏ qua lỗi quét.

    Cờ CLI này áp dụng cho các luồng cài đặt/cập nhật Plugin. Cài đặt phụ thuộc Skills dựa trên Gateway dùng override yêu cầu tương ứng `dangerouslyForceUnsafeInstall`, trong khi `openclaw skills install` vẫn là một luồng tải xuống/cài đặt Skills ClawHub riêng.

    Nếu một Plugin bạn đã phát hành trên ClawHub bị chặn bởi quá trình quét registry, hãy dùng các bước dành cho nhà phát hành trong [ClawHub](/vi/tools/clawhub).

  </Accordion>
  <Accordion title="Gói hook và spec npm">
    `plugins install` cũng là bề mặt cài đặt cho các gói hook expose `openclaw.hooks` trong `package.json`. Dùng `openclaw hooks` để xem hook có lọc và bật theo từng hook, không phải để cài đặt package.

    Spec npm **chỉ dành cho registry** (tên package + **phiên bản chính xác** tùy chọn hoặc **dist-tag**). Spec Git/URL/file và khoảng semver bị từ chối. Cài đặt phụ thuộc chạy trong phạm vi dự án cục bộ với `--ignore-scripts` để đảm bảo an toàn, kể cả khi shell của bạn có thiết lập cài đặt npm toàn cục.

    Dùng `npm:<package>` khi bạn muốn bỏ qua tra cứu ClawHub và cài đặt trực tiếp từ npm. Spec package trần vẫn ưu tiên ClawHub và chỉ dự phòng sang npm khi ClawHub không có package hoặc phiên bản đó.

    Spec trần và `@latest` vẫn ở track ổn định. Nếu npm resolve một trong hai thành prerelease, OpenClaw sẽ dừng và yêu cầu bạn chọn tham gia tường minh bằng một tag prerelease như `@beta`/`@rc` hoặc một phiên bản prerelease chính xác như `@1.2.3-beta.4`.

    Nếu một spec cài đặt trần khớp với id Plugin được bundle (ví dụ `diffs`), OpenClaw sẽ cài đặt trực tiếp Plugin được bundle. Để cài đặt package npm có cùng tên, hãy dùng spec có scope tường minh (ví dụ `@scope/diffs`).

  </Accordion>
  <Accordion title="Archive">
    Archive được hỗ trợ: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Archive Plugin OpenClaw gốc phải chứa `openclaw.plugin.json` hợp lệ tại root Plugin sau khi giải nén; archive chỉ chứa `package.json` bị từ chối trước khi OpenClaw ghi bản ghi cài đặt.

    Cài đặt từ marketplace Claude cũng được hỗ trợ.

  </Accordion>
</AccordionGroup>

Cài đặt ClawHub dùng locator `clawhub:<package>` tường minh:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

OpenClaw hiện cũng ưu tiên ClawHub cho spec Plugin trần an toàn với npm. Nó chỉ dự phòng sang npm nếu ClawHub không có package hoặc phiên bản đó:

```bash
openclaw plugins install openclaw-codex-app-server
```

Dùng `npm:` để buộc resolve chỉ qua npm, ví dụ khi ClawHub không truy cập được hoặc bạn biết package chỉ tồn tại trên npm:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw tải archive package từ ClawHub, kiểm tra API Plugin được công bố / khả năng tương thích Gateway tối thiểu, rồi cài đặt qua đường dẫn archive thông thường. Các cài đặt được ghi lại giữ metadata nguồn ClawHub để cập nhật về sau.
Cài đặt ClawHub không có phiên bản giữ spec được ghi lại không có phiên bản để `openclaw plugins update` có thể theo các bản phát hành ClawHub mới hơn; bộ chọn phiên bản hoặc tag tường minh như `clawhub:pkg@1.2.3` và `clawhub:pkg@beta` vẫn được ghim vào bộ chọn đó.

#### Cú pháp rút gọn marketplace

Dùng cú pháp rút gọn `plugin@marketplace` khi tên marketplace tồn tại trong cache registry cục bộ của Claude tại `~/.claude/plugins/known_marketplaces.json`:

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
    - root marketplace cục bộ hoặc đường dẫn `marketplace.json`
    - cú pháp rút gọn repo GitHub như `owner/repo`
    - URL repo GitHub như `https://github.com/owner/repo`
    - URL git

  </Tab>
  <Tab title="Quy tắc marketplace từ xa">
    Với marketplace từ xa được tải từ GitHub hoặc git, các mục Plugin phải nằm bên trong repo marketplace đã clone. OpenClaw chấp nhận nguồn đường dẫn tương đối từ repo đó và từ chối HTTP(S), đường dẫn tuyệt đối, git, GitHub và các nguồn Plugin không phải đường dẫn khác từ manifest từ xa.
  </Tab>
</Tabs>

Đối với đường dẫn cục bộ và archive, OpenClaw tự động phát hiện:

- Plugin OpenClaw gốc (`openclaw.plugin.json`)
- bundle tương thích Codex (`.codex-plugin/plugin.json`)
- bundle tương thích Claude (`.claude-plugin/plugin.json` hoặc layout thành phần Claude mặc định)
- bundle tương thích Cursor (`.cursor-plugin/plugin.json`)

<Note>
Bundle tương thích cài đặt vào root Plugin thông thường và tham gia cùng luồng list/info/enable/disable. Hiện tại, Skills của bundle, command-skills của Claude, mặc định `settings.json` của Claude, mặc định `.lsp.json` / `lspServers` khai báo trong manifest của Claude, command-skills của Cursor và thư mục hook Codex tương thích được hỗ trợ; các khả năng bundle được phát hiện khác được hiển thị trong diagnostics/info nhưng chưa được nối vào thực thi runtime.
</Note>

### Danh sách

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

<ParamField path="--enabled" type="boolean">
  Chỉ hiển thị Plugin đã bật.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Chuyển từ chế độ xem bảng sang các dòng chi tiết theo từng Plugin với metadata nguồn/gốc/phiên bản/kích hoạt.
</ParamField>
<ParamField path="--json" type="boolean">
  Inventory máy đọc được cùng diagnostics registry.
</ParamField>

<Note>
`plugins list` đọc sổ đăng ký Plugin cục bộ đã lưu trước, với phương án dự phòng chỉ dẫn xuất từ manifest khi sổ đăng ký bị thiếu hoặc không hợp lệ. Lệnh này hữu ích để kiểm tra một Plugin đã được cài đặt, bật và hiển thị với kế hoạch khởi động nguội hay chưa, nhưng không phải là phép dò thời gian chạy trực tiếp của một tiến trình Gateway đang chạy. Sau khi thay đổi mã Plugin, trạng thái bật, chính sách hook hoặc `plugins.load.paths`, hãy khởi động lại Gateway phục vụ kênh trước khi kỳ vọng mã `register(api)` hoặc hook mới chạy. Với các triển khai từ xa/container, hãy xác minh rằng bạn đang khởi động lại đúng tiến trình con `openclaw gateway run`, không chỉ một tiến trình wrapper.
</Note>

Đối với công việc trên Plugin đóng gói kèm bên trong ảnh Docker đã đóng gói, hãy bind-mount thư mục nguồn Plugin lên đường dẫn nguồn đã đóng gói tương ứng, chẳng hạn như `/app/extensions/synology-chat`. OpenClaw sẽ phát hiện lớp phủ nguồn đã mount đó trước `/app/dist/extensions/synology-chat`; một thư mục nguồn chỉ được sao chép thuần túy sẽ không hoạt động, nên các bản cài đặt đóng gói thông thường vẫn dùng dist đã biên dịch.

Để gỡ lỗi hook thời gian chạy:

- `openclaw plugins inspect <id> --json` hiển thị các hook đã đăng ký và chẩn đoán từ một lượt kiểm tra có tải module.
- `openclaw gateway status --deep --require-rpc` xác nhận Gateway có thể truy cập, gợi ý dịch vụ/tiến trình, đường dẫn cấu hình và tình trạng RPC.
- Các hook hội thoại không đóng gói kèm (`llm_input`, `llm_output`, `before_agent_finalize`, `agent_end`) yêu cầu `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Dùng `--link` để tránh sao chép một thư mục cục bộ (thêm vào `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` không được hỗ trợ cùng với `--link` vì các bản cài đặt liên kết tái sử dụng đường dẫn nguồn thay vì sao chép đè lên một đích cài đặt được quản lý.

Dùng `--pin` trên các bản cài đặt npm để lưu spec chính xác đã phân giải (`name@version`) trong chỉ mục Plugin được quản lý, trong khi vẫn giữ hành vi mặc định là không ghim.
</Note>

### Chỉ mục Plugin

Siêu dữ liệu cài đặt Plugin là trạng thái do máy quản lý, không phải cấu hình người dùng. Các lượt cài đặt và cập nhật ghi dữ liệu này vào `plugins/installs.json` trong thư mục trạng thái OpenClaw đang hoạt động. Map `installRecords` cấp cao nhất là nguồn bền vững của siêu dữ liệu cài đặt, bao gồm cả bản ghi cho các manifest Plugin bị hỏng hoặc bị thiếu. Mảng `plugins` là bộ nhớ đệm sổ đăng ký nguội được dẫn xuất từ manifest. Tệp này bao gồm cảnh báo không chỉnh sửa và được dùng bởi `openclaw plugins update`, gỡ cài đặt, chẩn đoán và sổ đăng ký Plugin nguội.

Khi OpenClaw thấy các bản ghi `plugins.installs` cũ đã phát hành trong cấu hình, nó chuyển chúng vào chỉ mục Plugin và xóa khóa cấu hình; nếu một trong hai thao tác ghi thất bại, các bản ghi cấu hình được giữ lại để siêu dữ liệu cài đặt không bị mất.

### Gỡ cài đặt

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` xóa bản ghi Plugin khỏi `plugins.entries`, chỉ mục Plugin đã lưu, các mục danh sách cho phép/từ chối Plugin và các mục `plugins.load.paths` đã liên kết khi áp dụng được. Trừ khi đặt `--keep-files`, gỡ cài đặt cũng xóa thư mục cài đặt được quản lý đang được theo dõi khi nó nằm trong root tiện ích mở rộng Plugin của OpenClaw. Với các Plugin active memory, ô nhớ được đặt lại thành `memory-core`.

<Note>
`--keep-config` được hỗ trợ như một bí danh đã ngừng khuyến nghị cho `--keep-files`.
</Note>

### Cập nhật

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call@beta
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

Các bản cập nhật áp dụng cho các bản cài đặt Plugin được theo dõi trong chỉ mục Plugin được quản lý và các bản cài đặt gói hook được theo dõi trong `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="Phân giải id Plugin so với spec npm">
    Khi bạn truyền một id Plugin, OpenClaw tái sử dụng spec cài đặt đã ghi cho Plugin đó. Điều này nghĩa là các dist-tag đã lưu trước đó như `@beta` và các phiên bản được ghim chính xác tiếp tục được dùng trong các lần chạy `update <id>` sau này.

    Đối với các bản cài đặt npm, bạn cũng có thể truyền một spec gói npm rõ ràng kèm dist-tag hoặc phiên bản chính xác. OpenClaw phân giải tên gói đó về lại bản ghi Plugin được theo dõi, cập nhật Plugin đã cài đặt đó và ghi lại spec npm mới cho các lần cập nhật dựa trên id trong tương lai.

    Truyền tên gói npm mà không có phiên bản hoặc tag cũng phân giải về lại bản ghi Plugin được theo dõi. Dùng cách này khi một Plugin đã được ghim vào một phiên bản chính xác và bạn muốn chuyển nó về lại dòng phát hành mặc định của registry.

  </Accordion>
  <Accordion title="Kiểm tra phiên bản và trôi dạt tính toàn vẹn">
    Trước một bản cập nhật npm trực tiếp, OpenClaw kiểm tra phiên bản gói đã cài đặt so với siêu dữ liệu npm registry. Nếu phiên bản đã cài đặt và danh tính artifact đã ghi khớp với đích đã phân giải, bản cập nhật sẽ bị bỏ qua mà không tải xuống, cài đặt lại hoặc ghi lại `openclaw.json`.

    Khi có hash tính toàn vẹn đã lưu và hash artifact đã tải thay đổi, OpenClaw xem đó là trôi dạt artifact npm. Lệnh tương tác `openclaw plugins update` in các hash kỳ vọng và thực tế rồi yêu cầu xác nhận trước khi tiếp tục. Các trình trợ giúp cập nhật không tương tác sẽ đóng thất bại trừ khi bên gọi cung cấp một chính sách tiếp tục rõ ràng.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install khi cập nhật">
    `--dangerously-force-unsafe-install` cũng có trên `plugins update` như một cơ chế override khẩn cấp cho các trường hợp dương tính giả của quét mã nguy hiểm tích hợp sẵn trong lúc cập nhật Plugin. Nó vẫn không bỏ qua các chặn chính sách `before_install` của Plugin hoặc chặn khi quét thất bại, và nó chỉ áp dụng cho cập nhật Plugin, không áp dụng cho cập nhật gói hook.
  </Accordion>
</AccordionGroup>

### Kiểm tra

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
```

Tự kiểm tra sâu cho một Plugin đơn lẻ. Hiển thị danh tính, trạng thái tải, nguồn, các capability đã đăng ký, hook, tool, lệnh, dịch vụ, phương thức Gateway, route HTTP, cờ chính sách, chẩn đoán, siêu dữ liệu cài đặt, capability của bundle và mọi hỗ trợ máy chủ MCP hoặc LSP được phát hiện.

Mỗi Plugin được phân loại theo những gì nó thực sự đăng ký tại thời gian chạy:

- **plain-capability** — một loại capability (ví dụ: một Plugin chỉ dành cho provider)
- **hybrid-capability** — nhiều loại capability (ví dụ: văn bản + giọng nói + hình ảnh)
- **hook-only** — chỉ có hook, không có capability hoặc bề mặt
- **non-capability** — tool/lệnh/dịch vụ nhưng không có capability

Xem [Hình dạng Plugin](/vi/plugins/architecture#plugin-shapes) để biết thêm về mô hình capability.

<Note>
Cờ `--json` xuất một báo cáo máy đọc được, phù hợp cho scripting và kiểm toán. `inspect --all` hiển thị một bảng toàn hệ thống với các cột hình dạng, loại capability, thông báo tương thích, capability của bundle và tóm tắt hook. `info` là bí danh của `inspect`.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` báo cáo lỗi tải Plugin, chẩn đoán manifest/phát hiện và thông báo tương thích. Khi mọi thứ đều sạch, lệnh in `No plugin issues detected.`

Đối với các lỗi hình dạng module như thiếu export `register`/`activate`, chạy lại với `OPENCLAW_PLUGIN_LOAD_DEBUG=1` để đưa bản tóm tắt hình dạng export gọn vào đầu ra chẩn đoán.

### Registry

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Sổ đăng ký Plugin cục bộ là mô hình đọc nguội đã lưu của OpenClaw cho danh tính Plugin đã cài đặt, trạng thái bật, siêu dữ liệu nguồn và quyền sở hữu đóng góp. Khởi động bình thường, tra cứu chủ sở hữu provider, phân loại thiết lập kênh và kiểm kê Plugin có thể đọc nó mà không cần import các module thời gian chạy Plugin.

Dùng `plugins registry` để kiểm tra sổ đăng ký đã lưu có hiện diện, hiện hành hay đã cũ hay không. Dùng `--refresh` để dựng lại nó từ chỉ mục Plugin đã lưu, chính sách cấu hình và siêu dữ liệu manifest/gói. Đây là đường dẫn sửa chữa, không phải đường dẫn kích hoạt thời gian chạy.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` là công tắc tương thích khẩn cấp đã ngừng khuyến nghị cho các lỗi đọc sổ đăng ký. Ưu tiên `plugins registry --refresh` hoặc `openclaw doctor --fix`; phương án dự phòng bằng env chỉ dành cho khôi phục khởi động khẩn cấp trong khi quá trình di trú được triển khai.
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Danh sách Marketplace chấp nhận một đường dẫn marketplace cục bộ, đường dẫn `marketplace.json`, dạng rút gọn GitHub như `owner/repo`, URL repo GitHub hoặc URL git. `--json` in nhãn nguồn đã phân giải cùng với manifest marketplace đã phân tích và các mục Plugin.

## Liên quan

- [Xây dựng Plugin](/vi/plugins/building-plugins)
- [Tham chiếu CLI](/vi/cli)
- [Plugin cộng đồng](/vi/plugins/community)
