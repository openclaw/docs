---
read_when:
    - Bạn muốn cài đặt hoặc quản lý các Plugin Gateway hoặc các gói tương thích
    - Bạn muốn gỡ lỗi các lỗi tải Plugin
sidebarTitle: Plugins
summary: Tài liệu tham khảo CLI cho `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, doctor)
title: Plugin
x-i18n:
    generated_at: "2026-05-02T10:37:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 963a4292f86d651a23f06ee83fd82d7ad80cb99ff3397a665940d8247225252c
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
    Các trường manifest và schema cấu hình.
  </Card>
  <Card title="Bảo mật" href="/vi/gateway/security">
    Tăng cường bảo mật cho cài đặt Plugin.
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

Để điều tra quá trình cài đặt, kiểm tra, gỡ cài đặt hoặc làm mới registry bị chậm, hãy chạy lệnh với `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`. Trace ghi thời gian của từng giai đoạn vào stderr và giữ cho đầu ra JSON vẫn có thể phân tích cú pháp. Xem [Gỡ lỗi](/vi/help/debugging#plugin-lifecycle-trace).

<Note>
Các Plugin được đóng gói sẵn đi kèm với OpenClaw. Một số được bật theo mặc định (ví dụ: các provider mô hình đóng gói sẵn, provider giọng nói đóng gói sẵn và Plugin trình duyệt đóng gói sẵn); các Plugin khác yêu cầu `plugins enable`.

Các Plugin OpenClaw gốc phải cung cấp `openclaw.plugin.json` với JSON Schema nội tuyến (`configSchema`, ngay cả khi rỗng). Các bundle tương thích sử dụng manifest bundle riêng của chúng.

`plugins list` hiển thị `Format: openclaw` hoặc `Format: bundle`. Đầu ra danh sách/info ở chế độ verbose cũng hiển thị subtype của bundle (`codex`, `claude` hoặc `cursor`) cùng với các khả năng bundle được phát hiện.
</Note>

### Cài đặt

```bash
openclaw plugins search "calendar"                   # search ClawHub plugins
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
Tên package trần được kiểm tra với ClawHub trước, rồi đến npm. Hãy xử lý việc cài đặt Plugin như chạy mã. Ưu tiên các phiên bản đã ghim.
</Warning>

`plugins search` truy vấn ClawHub để tìm các package Plugin có thể cài đặt và in ra tên package sẵn sàng để cài đặt. Lệnh này tìm kiếm các package code-plugin và bundle-plugin, không phải Skills. Dùng `openclaw skills search` cho Skills trên ClawHub.

<Note>
ClawHub là bề mặt phân phối và khám phá chính cho hầu hết Plugin. Npm vẫn là đường dẫn dự phòng và cài đặt trực tiếp được hỗ trợ. Trong quá trình chuyển sang ClawHub, OpenClaw vẫn phát hành một số package Plugin `@openclaw/*` do OpenClaw sở hữu trên npm; các phiên bản package đó có thể tụt lại so với nguồn đóng gói sẵn giữa các đợt phát hành Plugin. Nếu npm báo một package Plugin do OpenClaw sở hữu là không còn được khuyến nghị, phiên bản đã phát hành đó là một artifact bên ngoài cũ; hãy dùng Plugin được đóng gói sẵn với OpenClaw hiện tại hoặc một checkout cục bộ cho đến khi package npm mới hơn được phát hành.
</Note>

<AccordionGroup>
  <Accordion title="Include cấu hình và khôi phục cấu hình không hợp lệ">
    Nếu phần `plugins` của bạn được hỗ trợ bởi một `$include` một tệp, `plugins install/update/enable/disable/uninstall` sẽ ghi xuyên qua tệp được include đó và giữ nguyên `openclaw.json`. Include gốc, mảng include và include có override cùng cấp sẽ đóng an toàn thay vì làm phẳng. Xem [Include cấu hình](/vi/gateway/configuration) để biết các hình dạng được hỗ trợ.

    Nếu cấu hình không hợp lệ trong khi cài đặt, `plugins install` thường đóng an toàn và yêu cầu bạn chạy `openclaw doctor --fix` trước. Trong quá trình khởi động Gateway, cấu hình không hợp lệ của một Plugin được cô lập vào Plugin đó để các kênh và Plugin khác vẫn có thể tiếp tục chạy; `openclaw doctor --fix` có thể cách ly mục Plugin không hợp lệ. Ngoại lệ duy nhất được ghi tài liệu tại thời điểm cài đặt là đường dẫn khôi phục hẹp cho Plugin đóng gói sẵn dành cho các Plugin chủ động chọn `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force và cài đặt lại so với cập nhật">
    `--force` tái sử dụng đích cài đặt hiện có và ghi đè một Plugin hoặc gói hook đã cài đặt tại chỗ. Dùng tùy chọn này khi bạn cố ý cài đặt lại cùng một id từ đường dẫn cục bộ, archive, package ClawHub hoặc artifact npm mới. Đối với nâng cấp thông thường của một Plugin npm đã được theo dõi, hãy ưu tiên `openclaw plugins update <id-or-npm-spec>`.

    Nếu bạn chạy `plugins install` cho một id Plugin đã được cài đặt, OpenClaw sẽ dừng và chỉ bạn đến `plugins update <id-or-npm-spec>` để nâng cấp bình thường, hoặc đến `plugins install <package> --force` khi bạn thật sự muốn ghi đè cài đặt hiện tại từ một nguồn khác.

  </Accordion>
  <Accordion title="Phạm vi --pin">
    `--pin` chỉ áp dụng cho cài đặt npm. Tùy chọn này không được hỗ trợ với cài đặt `git:`; hãy dùng ref git rõ ràng như `git:github.com/acme/plugin@v1.2.3` khi bạn muốn một nguồn đã ghim. Tùy chọn này không được hỗ trợ với `--marketplace`, vì cài đặt marketplace lưu siêu dữ liệu nguồn marketplace thay vì một spec npm.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` là tùy chọn phá kính trong tình huống khẩn cấp cho các cảnh báo dương tính giả trong trình quét mã nguy hiểm tích hợp. Tùy chọn này cho phép quá trình cài đặt tiếp tục ngay cả khi trình quét tích hợp báo các phát hiện `critical`, nhưng **không** bỏ qua các chặn chính sách hook `before_install` của Plugin và **không** bỏ qua lỗi quét.

    Cờ CLI này áp dụng cho các luồng cài đặt/cập nhật Plugin. Các cài đặt phụ thuộc Skill do Gateway hỗ trợ sử dụng override yêu cầu tương ứng `dangerouslyForceUnsafeInstall`, trong khi `openclaw skills install` vẫn là luồng tải xuống/cài đặt Skill ClawHub riêng biệt.

    Nếu một Plugin bạn đã phát hành trên ClawHub bị chặn bởi quét registry, hãy dùng các bước dành cho nhà phát hành trong [ClawHub](/vi/tools/clawhub).

  </Accordion>
  <Accordion title="Gói hook và spec npm">
    `plugins install` cũng là bề mặt cài đặt cho các gói hook cung cấp `openclaw.hooks` trong `package.json`. Dùng `openclaw hooks` để xem hook có lọc và bật theo từng hook, không phải để cài đặt package.

    Spec npm là **chỉ registry** (tên package + **phiên bản chính xác** tùy chọn hoặc **dist-tag**). Spec Git/URL/file và khoảng semver bị từ chối. Cài đặt phụ thuộc chạy cục bộ theo dự án với `--ignore-scripts` vì an toàn, ngay cả khi shell của bạn có thiết lập cài đặt npm toàn cục.

    Dùng `npm:<package>` khi bạn muốn bỏ qua tra cứu ClawHub và cài đặt trực tiếp từ npm. Spec package trần vẫn ưu tiên ClawHub và chỉ fallback sang npm khi ClawHub không có package hoặc phiên bản đó.

    Spec trần và `@latest` ở lại nhánh ổn định. Nếu npm resolve một trong hai tới bản phát hành trước, OpenClaw sẽ dừng và yêu cầu bạn chọn tham gia rõ ràng bằng một thẻ phát hành trước như `@beta`/`@rc` hoặc một phiên bản phát hành trước chính xác như `@1.2.3-beta.4`.

    Nếu một spec cài đặt trần khớp với id Plugin chính thức (ví dụ `diffs`), OpenClaw sẽ cài đặt trực tiếp mục catalog. Để cài một package npm có cùng tên, hãy dùng spec scoped rõ ràng (ví dụ `@scope/diffs`).

  </Accordion>
  <Accordion title="Kho Git">
    Dùng `git:<repo>` để cài đặt trực tiếp từ một kho git. Các dạng được hỗ trợ gồm `git:github.com/owner/repo`, `git:owner/repo`, URL clone đầy đủ `https://`, `ssh://`, `git://`, `file://` và `git@host:owner/repo.git`. Thêm `@<ref>` hoặc `#<ref>` để checkout một branch, tag hoặc commit trước khi cài đặt.

    Cài đặt Git clone vào một thư mục tạm, checkout ref được yêu cầu khi có, rồi dùng trình cài đặt thư mục Plugin bình thường. Điều đó có nghĩa là xác thực manifest, quét mã nguy hiểm, công việc cài đặt package-manager và bản ghi cài đặt hoạt động như cài đặt npm. Các cài đặt git được ghi lại bao gồm URL/ref nguồn cùng với commit đã resolve để `openclaw plugins update` có thể resolve lại nguồn sau này.

    Sau khi cài đặt từ git, dùng `openclaw plugins inspect <id> --runtime --json` để xác minh các đăng ký runtime như phương thức gateway và lệnh CLI. Nếu Plugin đã đăng ký một gốc CLI bằng `api.registerCli`, hãy thực thi lệnh đó trực tiếp qua CLI gốc của OpenClaw, ví dụ `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Archive">
    Archive được hỗ trợ: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Archive Plugin OpenClaw gốc phải chứa một `openclaw.plugin.json` hợp lệ tại root Plugin sau khi giải nén; archive chỉ chứa `package.json` bị từ chối trước khi OpenClaw ghi bản ghi cài đặt.

    Cài đặt marketplace Claude cũng được hỗ trợ.

  </Accordion>
</AccordionGroup>

Cài đặt ClawHub dùng locator `clawhub:<package>` rõ ràng:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

OpenClaw hiện cũng ưu tiên ClawHub cho các spec Plugin trần an toàn với npm. OpenClaw chỉ fallback sang npm nếu ClawHub không có package hoặc phiên bản đó:

```bash
openclaw plugins install openclaw-codex-app-server
```

Dùng `npm:` để buộc chỉ resolve qua npm, ví dụ khi ClawHub không truy cập được hoặc bạn biết package chỉ tồn tại trên npm:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw kiểm tra khả năng tương thích Plugin API / Gateway tối thiểu được quảng bá trước khi cài đặt. Khi phiên bản ClawHub được chọn phát hành artifact ClawPack, OpenClaw tải ClawPack có phiên bản, xác minh header digest ClawHub và digest artifact, rồi cài đặt thông qua đường dẫn archive bình thường. Các phiên bản ClawHub cũ hơn không có siêu dữ liệu ClawPack vẫn cài đặt thông qua đường dẫn xác minh archive package cũ. Các cài đặt được ghi lại giữ siêu dữ liệu nguồn ClawHub và thông tin digest ClawPack để cập nhật sau này.
Cài đặt ClawHub không có phiên bản giữ một spec đã ghi không có phiên bản để `openclaw plugins update` có thể theo các bản phát hành ClawHub mới hơn; các bộ chọn phiên bản hoặc thẻ rõ ràng như `clawhub:pkg@1.2.3` và `clawhub:pkg@beta` vẫn được ghim vào bộ chọn đó.

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
  <Tab title="Nguồn chợ Plugin">
    - tên chợ đã biết của Claude từ `~/.claude/plugins/known_marketplaces.json`
    - gốc chợ cục bộ hoặc đường dẫn `marketplace.json`
    - dạng viết tắt repo GitHub như `owner/repo`
    - URL repo GitHub như `https://github.com/owner/repo`
    - URL git

  </Tab>
  <Tab title="Quy tắc chợ Plugin từ xa">
    Với các chợ từ xa được tải từ GitHub hoặc git, các mục Plugin phải nằm bên trong repo chợ đã được clone. OpenClaw chấp nhận các nguồn đường dẫn tương đối từ repo đó và từ chối HTTP(S), đường dẫn tuyệt đối, git, GitHub và các nguồn Plugin không phải đường dẫn khác từ manifest từ xa.
  </Tab>
</Tabs>

Với đường dẫn và kho lưu trữ cục bộ, OpenClaw tự động phát hiện:

- Plugin OpenClaw nguyên bản (`openclaw.plugin.json`)
- gói tương thích Codex (`.codex-plugin/plugin.json`)
- gói tương thích Claude (`.claude-plugin/plugin.json` hoặc bố cục thành phần Claude mặc định)
- gói tương thích Cursor (`.cursor-plugin/plugin.json`)

<Note>
Các gói tương thích được cài vào gốc Plugin thông thường và tham gia cùng luồng liệt kê/thông tin/bật/tắt. Hiện tại, kỹ năng trong gói, kỹ năng-lệnh Claude, mặc định `settings.json` của Claude, mặc định `.lsp.json` / `lspServers` do manifest khai báo của Claude, kỹ năng-lệnh Cursor và các thư mục hook Codex tương thích được hỗ trợ; các khả năng gói khác được phát hiện sẽ hiển thị trong chẩn đoán/thông tin nhưng chưa được nối vào thực thi runtime.
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
  Chuyển từ chế độ xem bảng sang các dòng chi tiết theo từng Plugin với metadata nguồn/gốc/phiên bản/kích hoạt.
</ParamField>
<ParamField path="--json" type="boolean">
  Kho kiểm kê máy đọc được cùng chẩn đoán registry.
</ParamField>

<Note>
`plugins list` đọc registry Plugin cục bộ đã lưu trước, với phương án dự phòng chỉ dựa trên manifest khi registry bị thiếu hoặc không hợp lệ. Lệnh này hữu ích để kiểm tra một Plugin đã được cài, bật và hiển thị với kế hoạch khởi động nguội hay chưa, nhưng không phải là phép dò runtime trực tiếp của một tiến trình Gateway đang chạy. Sau khi thay đổi mã Plugin, trạng thái bật, chính sách hook hoặc `plugins.load.paths`, hãy khởi động lại Gateway phục vụ kênh trước khi kỳ vọng mã `register(api)` mới hoặc hook chạy. Với triển khai từ xa/container, hãy xác minh bạn đang khởi động lại đúng tiến trình con `openclaw gateway run`, không chỉ một tiến trình bao bọc.
</Note>

`plugins search` là tra cứu danh mục ClawHub từ xa. Nó không kiểm tra trạng thái cục bộ, thay đổi config, cài gói hoặc tải mã runtime của Plugin. Kết quả tìm kiếm bao gồm tên gói ClawHub, họ, kênh, phiên bản, tóm tắt và gợi ý cài đặt như `openclaw plugins install clawhub:<package>`.

Với công việc Plugin đi kèm bên trong ảnh Docker đã đóng gói, hãy bind-mount thư mục nguồn Plugin đè lên đường dẫn nguồn đã đóng gói tương ứng, chẳng hạn `/app/extensions/synology-chat`. OpenClaw sẽ phát hiện lớp phủ nguồn đã mount đó trước `/app/dist/extensions/synology-chat`; thư mục nguồn chỉ được sao chép vẫn không hoạt động để các cài đặt đóng gói thông thường vẫn dùng dist đã biên dịch.

Để gỡ lỗi hook runtime:

- `openclaw plugins inspect <id> --runtime --json` hiển thị hook đã đăng ký và chẩn đoán từ một lượt kiểm tra đã tải module. Kiểm tra runtime không bao giờ cài dependency; dùng `openclaw doctor --fix` để dọn trạng thái dependency cũ hoặc cài các Plugin có thể tải xuống đã được cấu hình nhưng còn thiếu.
- `openclaw gateway status --deep --require-rpc` xác nhận Gateway có thể truy cập, gợi ý dịch vụ/tiến trình, đường dẫn config và tình trạng RPC.
- Các hook hội thoại không đi kèm (`llm_input`, `llm_output`, `before_agent_finalize`, `agent_end`) yêu cầu `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Dùng `--link` để tránh sao chép một thư mục cục bộ (thêm vào `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` không được hỗ trợ cùng `--link` vì cài đặt liên kết dùng lại đường dẫn nguồn thay vì sao chép đè lên mục tiêu cài đặt được quản lý.

Dùng `--pin` trên cài đặt npm để lưu spec chính xác đã phân giải (`name@version`) trong chỉ mục Plugin được quản lý trong khi vẫn giữ hành vi mặc định không ghim.
</Note>

### Chỉ mục Plugin

Metadata cài đặt Plugin là trạng thái do máy quản lý, không phải config người dùng. Cài đặt và cập nhật ghi nó vào `plugins/installs.json` trong thư mục trạng thái OpenClaw đang hoạt động. Bản đồ cấp cao nhất `installRecords` là nguồn bền vững của metadata cài đặt, bao gồm bản ghi cho các manifest Plugin bị hỏng hoặc bị thiếu. Mảng `plugins` là bộ nhớ đệm registry nguội được suy ra từ manifest. Tệp này bao gồm cảnh báo không chỉnh sửa và được dùng bởi `openclaw plugins update`, gỡ cài đặt, chẩn đoán và registry Plugin nguội.

Khi OpenClaw thấy các bản ghi `plugins.installs` cũ đã phát hành trong config, nó chuyển chúng vào chỉ mục Plugin và xóa khóa config; nếu một trong hai thao tác ghi thất bại, các bản ghi config được giữ lại để metadata cài đặt không bị mất.

### Gỡ cài đặt

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` xóa bản ghi Plugin khỏi `plugins.entries`, chỉ mục Plugin đã lưu, các mục danh sách cho phép/từ chối Plugin và các mục `plugins.load.paths` đã liên kết khi áp dụng. Trừ khi đặt `--keep-files`, gỡ cài đặt cũng xóa thư mục cài đặt được quản lý đang được theo dõi khi nó nằm trong gốc tiện ích mở rộng Plugin của OpenClaw. Với Plugin active memory, slot bộ nhớ đặt lại thành `memory-core`.

<Note>
`--keep-config` được hỗ trợ như bí danh đã ngừng khuyến nghị của `--keep-files`.
</Note>

### Cập nhật

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call@beta
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

Cập nhật áp dụng cho các cài đặt Plugin được theo dõi trong chỉ mục Plugin được quản lý và các cài đặt gói hook được theo dõi trong `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="Phân giải id Plugin so với spec npm">
    Khi bạn truyền một id Plugin, OpenClaw dùng lại spec cài đặt đã ghi cho Plugin đó. Điều đó có nghĩa là các dist-tag đã lưu trước đó như `@beta` và các phiên bản được ghim chính xác tiếp tục được dùng trong các lần chạy `update <id>` sau này.

    Với cài đặt npm, bạn cũng có thể truyền một spec gói npm rõ ràng kèm dist-tag hoặc phiên bản chính xác. OpenClaw phân giải tên gói đó ngược về bản ghi Plugin được theo dõi, cập nhật Plugin đã cài đó và ghi lại spec npm mới cho các cập nhật dựa trên id trong tương lai.

    Truyền tên gói npm không kèm phiên bản hoặc tag cũng phân giải ngược về bản ghi Plugin được theo dõi. Dùng cách này khi một Plugin đã được ghim vào một phiên bản chính xác và bạn muốn chuyển nó trở lại dòng phát hành mặc định của registry.

  </Accordion>
  <Accordion title="Kiểm tra phiên bản và drift tính toàn vẹn">
    Trước một cập nhật npm trực tiếp, OpenClaw kiểm tra phiên bản gói đã cài so với metadata registry npm. Nếu phiên bản đã cài và định danh artifact đã ghi đã khớp với mục tiêu được phân giải, cập nhật sẽ bị bỏ qua mà không tải xuống, cài đặt lại hoặc ghi lại `openclaw.json`.

    Khi tồn tại hash tính toàn vẹn đã lưu và hash artifact đã fetch thay đổi, OpenClaw xem đó là drift artifact npm. Lệnh tương tác `openclaw plugins update` in ra hash kỳ vọng và hash thực tế rồi yêu cầu xác nhận trước khi tiếp tục. Các trình trợ giúp cập nhật không tương tác sẽ fail đóng trừ khi bên gọi cung cấp chính sách tiếp tục rõ ràng.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install khi cập nhật">
    `--dangerously-force-unsafe-install` cũng có sẵn trên `plugins update` như một override khẩn cấp cho các cảnh báo dương tính giả từ quét mã nguy hiểm tích hợp trong khi cập nhật Plugin. Nó vẫn không bỏ qua các chặn chính sách `before_install` của Plugin hoặc chặn do lỗi quét, và chỉ áp dụng cho cập nhật Plugin, không áp dụng cho cập nhật gói hook.
  </Accordion>
</AccordionGroup>

### Kiểm tra

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect hiển thị danh tính, trạng thái tải, nguồn, khả năng manifest, cờ chính sách, chẩn đoán, metadata cài đặt, khả năng gói và mọi hỗ trợ máy chủ MCP hoặc LSP được phát hiện mà mặc định không import runtime Plugin. Thêm `--runtime` để tải module Plugin và bao gồm hook, công cụ, lệnh, dịch vụ, phương thức Gateway và route HTTP đã đăng ký. Kiểm tra runtime báo trực tiếp dependency Plugin bị thiếu; cài đặt và sửa chữa vẫn nằm trong `openclaw plugins install`, `openclaw plugins update` và `openclaw doctor --fix`.

Các lệnh CLI do Plugin sở hữu được cài như các nhóm lệnh gốc `openclaw`. Sau khi `inspect --runtime` hiển thị một lệnh dưới `cliCommands`, hãy chạy nó dưới dạng `openclaw <command> ...`; ví dụ một Plugin đăng ký `demo-git` có thể được xác minh bằng `openclaw demo-git ping`.

Mỗi Plugin được phân loại theo những gì nó thực sự đăng ký ở runtime:

- **plain-capability** — một loại khả năng (ví dụ: Plugin chỉ dành cho nhà cung cấp)
- **hybrid-capability** — nhiều loại khả năng (ví dụ: văn bản + giọng nói + hình ảnh)
- **hook-only** — chỉ hook, không có khả năng hoặc bề mặt
- **non-capability** — công cụ/lệnh/dịch vụ nhưng không có khả năng

Xem [Hình dạng Plugin](/vi/plugins/architecture#plugin-shapes) để biết thêm về mô hình khả năng.

<Note>
Cờ `--json` xuất báo cáo máy đọc được, phù hợp cho scripting và kiểm toán. `inspect --all` render bảng toàn đội với các cột hình dạng, loại khả năng, thông báo tương thích, khả năng gói và tóm tắt hook. `info` là bí danh của `inspect`.
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

Registry Plugin cục bộ là mô hình đọc nguội đã lưu của OpenClaw cho danh tính Plugin đã cài, trạng thái bật, metadata nguồn và quyền sở hữu đóng góp. Khởi động thông thường, tra cứu chủ sở hữu nhà cung cấp, phân loại thiết lập kênh và kho kiểm kê Plugin có thể đọc nó mà không cần import module runtime Plugin.

Dùng `plugins registry` để kiểm tra registry đã lưu có hiện diện, hiện hành hay lỗi thời không. Dùng `--refresh` để dựng lại từ chỉ mục Plugin đã lưu, chính sách config và metadata manifest/gói. Đây là đường dẫn sửa chữa, không phải đường dẫn kích hoạt runtime.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` là công tắc tương thích khẩn cấp đã ngừng khuyến nghị cho lỗi đọc registry. Ưu tiên `plugins registry --refresh` hoặc `openclaw doctor --fix`; fallback env chỉ dành cho khôi phục khởi động khẩn cấp trong khi migration được triển khai.
</Warning>

### Chợ Plugin

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Danh sách chợ Plugin chấp nhận đường dẫn chợ cục bộ, đường dẫn `marketplace.json`, dạng viết tắt GitHub như `owner/repo`, URL repo GitHub hoặc URL git. `--json` in nhãn nguồn đã phân giải cùng manifest chợ đã phân tích và các mục Plugin.

## Liên quan

- [Xây dựng Plugin](/vi/plugins/building-plugins)
- [Tham chiếu CLI](/vi/cli)
- [Plugin cộng đồng](/vi/plugins/community)
