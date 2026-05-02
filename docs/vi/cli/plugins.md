---
read_when:
    - Bạn muốn cài đặt hoặc quản lý các Plugin Gateway hoặc các gói tương thích
    - Bạn muốn gỡ lỗi các lỗi tải Plugin
sidebarTitle: Plugins
summary: Tham chiếu CLI cho `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, doctor)
title: Plugin
x-i18n:
    generated_at: "2026-05-02T20:42:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6fc046a04175c1b22f787920bf5ec28c24d0bb7d62eda4d9517da8f5dbac4c50
    source_path: cli/plugins.md
    workflow: 16
---

Quản lý các Plugin Gateway, gói hook và bundle tương thích.

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

Để điều tra lượt cài đặt, kiểm tra, gỡ cài đặt hoặc làm mới registry chậm, hãy chạy
lệnh với `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`. Trace ghi thời gian từng pha
vào stderr và giữ cho đầu ra JSON có thể phân tích được. Xem [Gỡ lỗi](/vi/help/debugging#plugin-lifecycle-trace).

<Note>
Các Plugin đi kèm được phát hành cùng OpenClaw. Một số được bật theo mặc định (ví dụ các nhà cung cấp mô hình đi kèm, nhà cung cấp giọng nói đi kèm và Plugin trình duyệt đi kèm); những Plugin khác yêu cầu `plugins enable`.

Plugin OpenClaw native phải phát hành `openclaw.plugin.json` với JSON Schema nội tuyến (`configSchema`, ngay cả khi rỗng). Các bundle tương thích dùng manifest bundle riêng của chúng thay thế.

`plugins list` hiển thị `Format: openclaw` hoặc `Format: bundle`. Đầu ra danh sách/thông tin chi tiết cũng hiển thị subtype bundle (`codex`, `claude`, hoặc `cursor`) cùng các khả năng bundle đã phát hiện.
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
Tên package trần cài đặt từ npm theo mặc định trong giai đoạn chuyển đổi khi ra mắt. Dùng `clawhub:<package>` cho ClawHub. Hãy xử lý việc cài đặt Plugin như chạy mã. Ưu tiên các phiên bản đã ghim.
</Warning>

`plugins search` truy vấn ClawHub để tìm các package Plugin có thể cài đặt và in ra
tên package sẵn sàng để cài đặt. Lệnh này tìm kiếm các package code-plugin và bundle-plugin,
không phải Skills. Dùng `openclaw skills search` cho Skills trên ClawHub.

<Note>
ClawHub là bề mặt phân phối và khám phá chính cho hầu hết Plugin. Npm
vẫn là đường dẫn dự phòng và cài đặt trực tiếp được hỗ trợ. Trong quá trình di chuyển sang
ClawHub, OpenClaw vẫn phát hành một số package Plugin `@openclaw/*` do OpenClaw sở hữu
trên npm; các phiên bản package đó có thể chậm hơn mã nguồn đi kèm giữa các đợt phát hành Plugin.
Nếu npm báo một package Plugin do OpenClaw sở hữu là deprecated, phiên bản
đã phát hành đó là một artifact bên ngoài cũ; hãy dùng Plugin đi kèm với
OpenClaw hiện tại hoặc một checkout cục bộ cho đến khi package npm mới hơn được phát hành.
</Note>

<AccordionGroup>
  <Accordion title="Include cấu hình và khôi phục cấu hình không hợp lệ">
    Nếu mục `plugins` của bạn được hỗ trợ bởi một `$include` một tệp, `plugins install/update/enable/disable/uninstall` ghi xuyên qua tệp được include đó và giữ nguyên `openclaw.json`. Include gốc, mảng include và include có override cùng cấp sẽ fail closed thay vì làm phẳng. Xem [Include cấu hình](/vi/gateway/configuration) để biết các dạng được hỗ trợ.

    Nếu cấu hình không hợp lệ trong lúc cài đặt, `plugins install` thường fail closed và yêu cầu bạn chạy `openclaw doctor --fix` trước. Trong quá trình khởi động Gateway, cấu hình không hợp lệ cho một Plugin được cô lập vào Plugin đó để các kênh và Plugin khác vẫn có thể tiếp tục chạy; `openclaw doctor --fix` có thể cách ly mục Plugin không hợp lệ. Ngoại lệ duy nhất được ghi tài liệu tại thời điểm cài đặt là một đường dẫn khôi phục hẹp cho Plugin đi kèm đối với các Plugin chọn tham gia rõ ràng vào `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force và cài đặt lại so với cập nhật">
    `--force` dùng lại đích cài đặt hiện có và ghi đè tại chỗ một Plugin hoặc gói hook đã được cài đặt. Dùng tùy chọn này khi bạn chủ ý cài đặt lại cùng một id từ đường dẫn cục bộ, archive, package ClawHub hoặc artifact npm mới. Với các nâng cấp thường lệ của Plugin npm đã được theo dõi, ưu tiên `openclaw plugins update <id-or-npm-spec>`.

    Nếu bạn chạy `plugins install` cho một id Plugin đã được cài đặt, OpenClaw dừng lại và chỉ bạn đến `plugins update <id-or-npm-spec>` cho nâng cấp thông thường, hoặc đến `plugins install <package> --force` khi bạn thực sự muốn ghi đè cài đặt hiện tại từ một nguồn khác.

  </Accordion>
  <Accordion title="Phạm vi --pin">
    `--pin` chỉ áp dụng cho lượt cài đặt npm. Tùy chọn này không được hỗ trợ với lượt cài đặt `git:`; dùng một git ref rõ ràng như `git:github.com/acme/plugin@v1.2.3` khi bạn muốn một nguồn đã ghim. Tùy chọn này không được hỗ trợ với `--marketplace`, vì cài đặt marketplace lưu metadata nguồn marketplace thay vì npm spec.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` là tùy chọn phá kính trong trường hợp dương tính giả trong bộ quét mã nguy hiểm tích hợp. Tùy chọn này cho phép cài đặt tiếp tục ngay cả khi bộ quét tích hợp báo cáo phát hiện `critical`, nhưng **không** bỏ qua các chặn chính sách hook `before_install` của Plugin và **không** bỏ qua lỗi quét.

    Cờ CLI này áp dụng cho luồng cài đặt/cập nhật Plugin. Lượt cài đặt dependency của Skill do Gateway hỗ trợ dùng override yêu cầu tương ứng `dangerouslyForceUnsafeInstall`, trong khi `openclaw skills install` vẫn là luồng tải xuống/cài đặt Skill ClawHub riêng biệt.

    Nếu một Plugin bạn đã phát hành trên ClawHub bị chặn bởi quét registry, hãy dùng các bước dành cho publisher trong [ClawHub](/vi/tools/clawhub).

  </Accordion>
  <Accordion title="Gói hook và npm spec">
    `plugins install` cũng là bề mặt cài đặt cho các gói hook phơi bày `openclaw.hooks` trong `package.json`. Dùng `openclaw hooks` để xem hook có lọc và bật từng hook, không dùng để cài đặt package.

    Npm spec là **chỉ registry** (tên package + **phiên bản chính xác** hoặc **dist-tag** tùy chọn). Git/URL/file spec và dải semver bị từ chối. Lượt cài đặt dependency chạy theo project cục bộ với `--ignore-scripts` để an toàn, ngay cả khi shell của bạn có thiết lập cài đặt npm toàn cục.

    Dùng `npm:<package>` khi bạn muốn làm rõ việc phân giải npm. Spec package trần cũng cài đặt trực tiếp từ npm trong giai đoạn chuyển đổi khi ra mắt.

    Spec trần và `@latest` ở lại track ổn định. Nếu npm phân giải một trong hai thành prerelease, OpenClaw dừng lại và yêu cầu bạn chọn tham gia rõ ràng bằng tag prerelease như `@beta`/`@rc` hoặc một phiên bản prerelease chính xác như `@1.2.3-beta.4`.

    Nếu spec cài đặt trần khớp với một id Plugin chính thức (ví dụ `diffs`), OpenClaw cài đặt trực tiếp mục catalog. Để cài đặt một package npm có cùng tên, dùng spec có scope rõ ràng (ví dụ `@scope/diffs`).

  </Accordion>
  <Accordion title="Kho Git">
    Dùng `git:<repo>` để cài đặt trực tiếp từ một kho git. Các dạng được hỗ trợ bao gồm URL clone `git:github.com/owner/repo`, `git:owner/repo`, đầy đủ `https://`, `ssh://`, `git://`, `file://`, và `git@host:owner/repo.git`. Thêm `@<ref>` hoặc `#<ref>` để checkout một nhánh, tag hoặc commit trước khi cài đặt.

    Lượt cài đặt Git clone vào một thư mục tạm, checkout ref được yêu cầu khi có, rồi dùng trình cài đặt thư mục Plugin thông thường. Điều đó có nghĩa là xác thực manifest, quét mã nguy hiểm, công việc cài đặt package-manager và bản ghi cài đặt hoạt động như lượt cài đặt npm. Các lượt cài đặt git đã ghi bao gồm URL/ref nguồn cùng commit đã phân giải để `openclaw plugins update` có thể phân giải lại nguồn sau này.

    Sau khi cài đặt từ git, dùng `openclaw plugins inspect <id> --runtime --json` để xác minh các đăng ký runtime như phương thức gateway và lệnh CLI. Nếu Plugin đã đăng ký một CLI root bằng `api.registerCli`, hãy thực thi lệnh đó trực tiếp qua CLI root của OpenClaw, ví dụ `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Archive">
    Archive được hỗ trợ: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Archive Plugin OpenClaw native phải chứa `openclaw.plugin.json` hợp lệ tại gốc Plugin đã giải nén; archive chỉ chứa `package.json` bị từ chối trước khi OpenClaw ghi bản ghi cài đặt.

    Lượt cài đặt marketplace Claude cũng được hỗ trợ.

  </Accordion>
</AccordionGroup>

Lượt cài đặt ClawHub dùng locator `clawhub:<package>` rõ ràng:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Spec Plugin an toàn cho npm dạng trần cài đặt từ npm theo mặc định trong giai đoạn chuyển đổi khi ra mắt:

```bash
openclaw plugins install openclaw-codex-app-server
```

Dùng `npm:` để làm rõ việc phân giải chỉ npm:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw kiểm tra API Plugin được quảng bá / mức tương thích Gateway tối thiểu trước khi cài đặt. Khi phiên bản ClawHub đã chọn phát hành artifact ClawPack, OpenClaw tải xuống `.tgz` npm-pack có phiên bản, xác minh header digest ClawHub và digest artifact, rồi cài đặt qua đường dẫn archive thông thường. Các phiên bản ClawHub cũ hơn không có metadata ClawPack vẫn cài đặt qua đường dẫn xác minh archive package legacy. Các lượt cài đặt đã ghi giữ metadata nguồn ClawHub, loại artifact, integrity npm, shasum npm, tên tarball và các dữ kiện digest ClawPack để cập nhật sau.
Lượt cài đặt ClawHub không có phiên bản giữ một spec đã ghi không phiên bản để `openclaw plugins update` có thể theo các bản phát hành ClawHub mới hơn; selector phiên bản hoặc tag rõ ràng như `clawhub:pkg@1.2.3` và `clawhub:pkg@beta` vẫn được ghim vào selector đó.

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
  <Tab title="Nguồn chợ ứng dụng">
    - một tên chợ ứng dụng đã biết của Claude từ `~/.claude/plugins/known_marketplaces.json`
    - một gốc chợ ứng dụng cục bộ hoặc đường dẫn `marketplace.json`
    - một cách viết tắt kho GitHub như `owner/repo`
    - một URL kho GitHub như `https://github.com/owner/repo`
    - một URL git

  </Tab>
  <Tab title="Quy tắc chợ ứng dụng từ xa">
    Với các chợ ứng dụng từ xa được tải từ GitHub hoặc git, các mục Plugin phải nằm bên trong kho chợ ứng dụng đã clone. OpenClaw chấp nhận nguồn đường dẫn tương đối từ kho đó và từ chối các nguồn Plugin HTTP(S), đường dẫn tuyệt đối, git, GitHub và các nguồn Plugin không phải đường dẫn khác từ manifest từ xa.
  </Tab>
</Tabs>

Với đường dẫn cục bộ và kho lưu trữ, OpenClaw tự động phát hiện:

- Plugin OpenClaw gốc (`openclaw.plugin.json`)
- gói tương thích với Codex (`.codex-plugin/plugin.json`)
- gói tương thích với Claude (`.claude-plugin/plugin.json` hoặc bố cục thành phần Claude mặc định)
- gói tương thích với Cursor (`.cursor-plugin/plugin.json`)

<Note>
Các gói tương thích được cài vào gốc Plugin bình thường và tham gia cùng luồng liệt kê/thông tin/bật/tắt. Hiện tại, kỹ năng của gói, kỹ năng-lệnh Claude, mặc định `settings.json` của Claude, mặc định `.lsp.json` / `lspServers` do manifest khai báo của Claude, kỹ năng-lệnh Cursor và các thư mục hook Codex tương thích được hỗ trợ; các khả năng gói khác được phát hiện sẽ hiển thị trong chẩn đoán/thông tin nhưng chưa được nối vào thực thi runtime.
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
  Chỉ hiển thị Plugin đã bật.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Chuyển từ chế độ xem bảng sang các dòng chi tiết theo từng Plugin với siêu dữ liệu nguồn/xuất xứ/phiên bản/kích hoạt.
</ParamField>
<ParamField path="--json" type="boolean">
  Kho kiểm kê máy đọc được cùng chẩn đoán registry và trạng thái cài đặt phụ thuộc gói.
</ParamField>

<Note>
`plugins list` đọc registry Plugin cục bộ đã lưu trước, với phương án dự phòng suy ra chỉ từ manifest khi registry bị thiếu hoặc không hợp lệ. Lệnh này hữu ích để kiểm tra liệu một Plugin đã được cài, đã bật và hiển thị với kế hoạch khởi động nguội hay chưa, nhưng không phải là phép dò runtime trực tiếp của một tiến trình Gateway đang chạy. Sau khi thay đổi mã Plugin, trạng thái bật, chính sách hook hoặc `plugins.load.paths`, hãy khởi động lại Gateway phục vụ kênh trước khi kỳ vọng mã `register(api)` hoặc hook mới chạy. Với triển khai từ xa/container, hãy xác minh bạn đang khởi động lại tiến trình con `openclaw gateway run` thực tế, không chỉ một tiến trình bao bọc.

`plugins list --json` bao gồm `dependencyStatus` của từng Plugin từ `dependencies` và `optionalDependencies` trong `package.json`. OpenClaw kiểm tra liệu các tên gói đó có hiện diện dọc theo đường dẫn tra cứu `node_modules` Node bình thường của Plugin hay không; nó không import mã runtime Plugin, chạy trình quản lý gói, hoặc sửa các phụ thuộc bị thiếu.
</Note>

`plugins search` là một tra cứu danh mục ClawHub từ xa. Nó không kiểm tra trạng thái cục bộ, thay đổi config, cài gói, hoặc tải mã runtime Plugin. Kết quả tìm kiếm bao gồm tên gói ClawHub, họ, kênh, phiên bản, tóm tắt và gợi ý cài đặt như `openclaw plugins install clawhub:<package>`.

Với công việc trên Plugin đóng gói bên trong một image Docker đã đóng gói, hãy bind-mount thư mục nguồn Plugin lên đường dẫn nguồn đã đóng gói tương ứng, như `/app/extensions/synology-chat`. OpenClaw sẽ phát hiện lớp phủ nguồn đã mount đó trước `/app/dist/extensions/synology-chat`; một thư mục nguồn chỉ được sao chép vẫn không hoạt động để các bản cài đặt đóng gói bình thường tiếp tục dùng dist đã biên dịch.

Để debug hook runtime:

- `openclaw plugins inspect <id> --runtime --json` hiển thị các hook đã đăng ký và chẩn đoán từ một lượt kiểm tra có tải module. Kiểm tra runtime không bao giờ cài phụ thuộc; dùng `openclaw doctor --fix` để dọn trạng thái phụ thuộc cũ hoặc cài các Plugin có thể tải xuống đã cấu hình nhưng còn thiếu.
- `openclaw gateway status --deep --require-rpc` xác nhận Gateway có thể truy cập, gợi ý dịch vụ/tiến trình, đường dẫn config và sức khỏe RPC.
- Hook hội thoại không đóng gói (`llm_input`, `llm_output`, `before_agent_finalize`, `agent_end`) yêu cầu `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Dùng `--link` để tránh sao chép một thư mục cục bộ (thêm vào `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` không được hỗ trợ cùng `--link` vì cài đặt liên kết dùng lại đường dẫn nguồn thay vì sao chép đè lên một đích cài đặt được quản lý.

Dùng `--pin` trên các bản cài npm để lưu spec chính xác đã phân giải (`name@version`) trong chỉ mục Plugin được quản lý trong khi vẫn giữ hành vi mặc định là không ghim.
</Note>

### Chỉ mục Plugin

Siêu dữ liệu cài đặt Plugin là trạng thái do máy quản lý, không phải config người dùng. Các lượt cài đặt và cập nhật ghi nó vào `plugins/installs.json` dưới thư mục trạng thái OpenClaw đang hoạt động. Bản đồ `installRecords` cấp cao nhất là nguồn bền vững của siêu dữ liệu cài đặt, bao gồm cả bản ghi cho các manifest Plugin bị lỗi hoặc bị thiếu. Mảng `plugins` là bộ nhớ đệm registry nguội suy ra từ manifest. Tệp này bao gồm cảnh báo không chỉnh sửa và được dùng bởi `openclaw plugins update`, gỡ cài đặt, chẩn đoán và registry Plugin nguội.

Khi OpenClaw thấy các bản ghi `plugins.installs` cũ đã phát hành trong config, nó chuyển chúng vào chỉ mục Plugin và xóa khóa config; nếu một trong hai lượt ghi thất bại, các bản ghi config được giữ lại để siêu dữ liệu cài đặt không bị mất.

### Gỡ cài đặt

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` xóa bản ghi Plugin khỏi `plugins.entries`, chỉ mục Plugin đã lưu, các mục danh sách cho phép/từ chối Plugin và các mục `plugins.load.paths` đã liên kết khi áp dụng. Trừ khi `--keep-files` được đặt, gỡ cài đặt cũng xóa thư mục cài đặt được quản lý đang được theo dõi khi nó nằm bên trong gốc tiện ích Plugin của OpenClaw. Với Plugin active memory, slot bộ nhớ đặt lại về `memory-core`.

<Note>
`--keep-config` được hỗ trợ như một bí danh đã lỗi thời của `--keep-files`.
</Note>

### Cập nhật

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call@beta
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

Cập nhật áp dụng cho các bản cài Plugin được theo dõi trong chỉ mục Plugin được quản lý và các bản cài gói hook được theo dõi trong `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="Phân giải id Plugin so với spec npm">
    Khi bạn truyền một id Plugin, OpenClaw dùng lại spec cài đặt đã ghi cho Plugin đó. Điều này có nghĩa là các dist-tag đã lưu trước đó như `@beta` và các phiên bản ghim chính xác tiếp tục được dùng trong các lần chạy `update <id>` sau này.

    Với các bản cài npm, bạn cũng có thể truyền một spec gói npm rõ ràng với dist-tag hoặc phiên bản chính xác. OpenClaw phân giải tên gói đó ngược về bản ghi Plugin được theo dõi, cập nhật Plugin đã cài đó và ghi lại spec npm mới cho các bản cập nhật dựa trên id trong tương lai.

    Truyền tên gói npm không kèm phiên bản hoặc thẻ cũng phân giải ngược về bản ghi Plugin được theo dõi. Dùng cách này khi một Plugin đã được ghim vào một phiên bản chính xác và bạn muốn chuyển nó trở lại dòng phát hành mặc định của registry.

  </Accordion>
  <Accordion title="Cập nhật kênh beta">
    `openclaw plugins update` dùng lại spec Plugin được theo dõi trừ khi bạn truyền một spec mới. `openclaw update` còn biết kênh cập nhật OpenClaw đang hoạt động: trên kênh beta, các bản ghi Plugin npm dòng mặc định và ClawHub thử `@beta` trước, sau đó quay về spec mặc định/mới nhất đã ghi nếu không có bản phát hành beta Plugin nào tồn tại. Phiên bản chính xác và thẻ rõ ràng vẫn được ghim vào bộ chọn đó.

  </Accordion>
  <Accordion title="Kiểm tra phiên bản và trôi lệch tính toàn vẹn">
    Trước một bản cập nhật npm trực tiếp, OpenClaw kiểm tra phiên bản gói đã cài so với siêu dữ liệu registry npm. Nếu phiên bản đã cài và danh tính artifact đã ghi đã khớp với mục tiêu đã phân giải, bản cập nhật được bỏ qua mà không tải xuống, cài đặt lại hoặc ghi lại `openclaw.json`.

    Khi có hash toàn vẹn đã lưu và hash artifact đã tải về thay đổi, OpenClaw coi đó là trôi lệch artifact npm. Lệnh tương tác `openclaw plugins update` in hash kỳ vọng và thực tế rồi yêu cầu xác nhận trước khi tiếp tục. Các helper cập nhật không tương tác sẽ thất bại đóng trừ khi bên gọi cung cấp một chính sách tiếp tục rõ ràng.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install khi cập nhật">
    `--dangerously-force-unsafe-install` cũng có trên `plugins update` như một override phá kính cho các dương tính giả của quét mã nguy hiểm tích hợp trong quá trình cập nhật Plugin. Nó vẫn không bỏ qua các chặn chính sách `before_install` của Plugin hoặc chặn do lỗi quét, và chỉ áp dụng cho cập nhật Plugin, không áp dụng cho cập nhật gói hook.
  </Accordion>
</AccordionGroup>

### Kiểm tra

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Kiểm tra hiển thị danh tính, trạng thái tải, nguồn, khả năng manifest, cờ chính sách, chẩn đoán, siêu dữ liệu cài đặt, khả năng gói và mọi hỗ trợ máy chủ MCP hoặc LSP được phát hiện mà mặc định không import runtime Plugin. Thêm `--runtime` để tải module Plugin và bao gồm các hook, công cụ, lệnh, dịch vụ, phương thức gateway và route HTTP đã đăng ký. Kiểm tra runtime báo cáo trực tiếp các phụ thuộc Plugin bị thiếu; cài đặt và sửa chữa vẫn nằm trong `openclaw plugins install`, `openclaw plugins update` và `openclaw doctor --fix`.

Các lệnh CLI do Plugin sở hữu được cài như các nhóm lệnh gốc `openclaw`. Sau khi `inspect --runtime` hiển thị một lệnh dưới `cliCommands`, hãy chạy nó dưới dạng `openclaw <command> ...`; ví dụ một Plugin đăng ký `demo-git` có thể được xác minh bằng `openclaw demo-git ping`.

Mỗi Plugin được phân loại theo những gì nó thực sự đăng ký lúc runtime:

- **plain-capability** — một loại khả năng (ví dụ: Plugin chỉ dành cho provider)
- **hybrid-capability** — nhiều loại khả năng (ví dụ: văn bản + giọng nói + hình ảnh)
- **hook-only** — chỉ hook, không có khả năng hoặc bề mặt
- **non-capability** — công cụ/lệnh/dịch vụ nhưng không có khả năng

Xem [Hình dạng Plugin](/vi/plugins/architecture#plugin-shapes) để biết thêm về mô hình khả năng.

<Note>
Cờ `--json` xuất một báo cáo máy đọc được phù hợp cho scripting và audit. `inspect --all` hiển thị một bảng toàn đội với các cột hình dạng, loại khả năng, thông báo tương thích, khả năng gói và tóm tắt hook. `info` là bí danh của `inspect`.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` báo cáo lỗi tải Plugin, chẩn đoán manifest/phát hiện và thông báo tương thích. Khi mọi thứ sạch, nó in `No plugin issues detected.`

Với các lỗi hình dạng module như thiếu export `register`/`activate`, chạy lại với `OPENCLAW_PLUGIN_LOAD_DEBUG=1` để bao gồm tóm tắt hình dạng export ngắn gọn trong đầu ra chẩn đoán.

### Registry

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Registry Plugin cục bộ là mô hình đọc nguội đã lưu của OpenClaw cho danh tính Plugin đã cài, trạng thái bật, siêu dữ liệu nguồn và quyền sở hữu đóng góp. Khởi động bình thường, tra cứu chủ sở hữu provider, phân loại thiết lập kênh và kiểm kê Plugin có thể đọc nó mà không cần import các module runtime Plugin.

Dùng `plugins registry` để kiểm tra liệu registry đã lưu có hiện diện, hiện hành hoặc cũ hay không. Dùng `--refresh` để dựng lại từ chỉ mục Plugin đã lưu, chính sách config và siêu dữ liệu manifest/gói. Đây là đường dẫn sửa chữa, không phải đường dẫn kích hoạt runtime.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` là công tắc tương thích khẩn cấp đã không còn được khuyến nghị cho các lỗi đọc registry. Ưu tiên dùng `plugins registry --refresh` hoặc `openclaw doctor --fix`; phương án dự phòng bằng biến môi trường chỉ dành cho khôi phục khởi động khẩn cấp trong khi quá trình di chuyển được triển khai.
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Danh sách Marketplace chấp nhận đường dẫn marketplace cục bộ, đường dẫn `marketplace.json`, dạng viết tắt GitHub như `owner/repo`, URL repo GitHub hoặc URL git. `--json` in nhãn nguồn đã phân giải cùng với manifest marketplace đã phân tích và các mục plugin.

## Liên quan

- [Xây dựng plugin](/vi/plugins/building-plugins)
- [Tham chiếu CLI](/vi/cli)
- [Plugin cộng đồng](/vi/plugins/community)
