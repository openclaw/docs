---
read_when:
    - Bạn muốn cài đặt hoặc quản lý các Plugin Gateway hoặc các gói tương thích
    - Bạn muốn gỡ lỗi các sự cố tải Plugin
sidebarTitle: Plugins
summary: Tài liệu tham khảo CLI cho `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, doctor)
title: Plugin
x-i18n:
    generated_at: "2026-05-05T01:44:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 24d274f33213231eaed48ac848a9266802a2179ba0311ab18462ad783219095a
    source_path: cli/plugins.md
    workflow: 16
---

Quản lý Plugin Gateway, gói hook và các bundle tương thích.

<CardGroup cols={2}>
  <Card title="Hệ thống Plugin" href="/vi/tools/plugin">
    Hướng dẫn dành cho người dùng cuối về cách cài đặt, bật và khắc phục sự cố plugin.
  </Card>
  <Card title="Quản lý plugin" href="/vi/plugins/manage-plugins">
    Ví dụ nhanh cho cài đặt, liệt kê, cập nhật, gỡ cài đặt và phát hành.
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

Để điều tra các thao tác cài đặt, kiểm tra, gỡ cài đặt hoặc làm mới registry bị chậm, hãy chạy lệnh với `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`. Trace ghi thời lượng từng pha vào stderr và giữ cho đầu ra JSON vẫn có thể phân tích cú pháp. Xem [Gỡ lỗi](/vi/help/debugging#plugin-lifecycle-trace).

<Note>
Plugin được đóng gói sẵn đi kèm OpenClaw. Một số được bật theo mặc định (ví dụ các nhà cung cấp mô hình đóng gói sẵn, nhà cung cấp giọng nói đóng gói sẵn và plugin trình duyệt đóng gói sẵn); những plugin khác yêu cầu `plugins enable`.

Plugin OpenClaw native phải đi kèm `openclaw.plugin.json` với JSON Schema inline (`configSchema`, ngay cả khi trống). Các bundle tương thích dùng manifest bundle riêng của chúng.

`plugins list` hiển thị `Format: openclaw` hoặc `Format: bundle`. Đầu ra list/info chi tiết cũng hiển thị kiểu phụ của bundle (`codex`, `claude` hoặc `cursor`) cùng các năng lực bundle được phát hiện.
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
Tên package trần sẽ cài đặt từ npm theo mặc định trong giai đoạn chuyển đổi ra mắt. Dùng `clawhub:<package>` cho ClawHub. Hãy xem việc cài đặt plugin như chạy mã. Ưu tiên các phiên bản đã ghim.
</Warning>

`plugins search` truy vấn ClawHub để tìm các package plugin có thể cài đặt và in ra tên package sẵn sàng cài đặt. Lệnh này tìm kiếm các package code-plugin và bundle-plugin, không tìm skills. Dùng `openclaw skills search` cho ClawHub skills.

<Note>
ClawHub là bề mặt phân phối và khám phá chính cho hầu hết plugin. Npm vẫn là đường dẫn dự phòng được hỗ trợ và đường dẫn cài đặt trực tiếp. Các package plugin `@openclaw/*` do OpenClaw sở hữu đã được phát hành lại trên npm; xem danh sách hiện tại trên [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) hoặc [kho plugin](/vi/plugins/plugin-inventory). Cài đặt ổn định dùng `latest`. Các lượt cài đặt và cập nhật kênh beta ưu tiên dist-tag npm `beta` khi tag đó có sẵn, rồi quay về `latest`.
</Note>

<AccordionGroup>
  <Accordion title="Config includes và sửa cấu hình không hợp lệ">
    Nếu phần `plugins` của bạn được hỗ trợ bởi `$include` một tệp duy nhất, `plugins install/update/enable/disable/uninstall` sẽ ghi xuyên qua tệp được include đó và giữ nguyên `openclaw.json`. Include gốc, mảng include và include có ghi đè cùng cấp sẽ fail closed thay vì bị làm phẳng. Xem [Config includes](/vi/gateway/configuration) để biết các dạng được hỗ trợ.

    Nếu cấu hình không hợp lệ trong lúc cài đặt, `plugins install` thường fail closed và yêu cầu bạn chạy `openclaw doctor --fix` trước. Trong lúc Gateway khởi động và hot reload, cấu hình plugin không hợp lệ fail closed như mọi cấu hình không hợp lệ khác; `openclaw doctor --fix` có thể cách ly mục plugin không hợp lệ. Ngoại lệ duy nhất được tài liệu hóa tại thời điểm cài đặt là đường dẫn khôi phục hẹp cho plugin đóng gói sẵn, áp dụng cho các plugin chủ động chọn tham gia `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force và cài đặt lại so với cập nhật">
    `--force` tái sử dụng mục tiêu cài đặt hiện có và ghi đè plugin hoặc gói hook đã được cài đặt ngay tại chỗ. Dùng tùy chọn này khi bạn chủ ý cài đặt lại cùng một id từ đường dẫn cục bộ mới, archive, package ClawHub hoặc artifact npm mới. Với các nâng cấp định kỳ của một plugin npm đã được theo dõi, hãy ưu tiên `openclaw plugins update <id-or-npm-spec>`.

    Nếu bạn chạy `plugins install` cho một id plugin đã được cài đặt, OpenClaw sẽ dừng lại và trỏ bạn tới `plugins update <id-or-npm-spec>` cho nâng cấp thông thường, hoặc tới `plugins install <package> --force` khi bạn thực sự muốn ghi đè cài đặt hiện tại từ một nguồn khác.

  </Accordion>
  <Accordion title="Phạm vi --pin">
    `--pin` chỉ áp dụng cho các lượt cài đặt npm. Tùy chọn này không được hỗ trợ với cài đặt `git:`; hãy dùng ref git rõ ràng như `git:github.com/acme/plugin@v1.2.3` khi bạn muốn nguồn đã ghim. Tùy chọn này không được hỗ trợ với `--marketplace`, vì cài đặt marketplace lưu metadata nguồn marketplace thay vì spec npm.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` là tùy chọn khẩn cấp cho các kết quả dương tính giả trong bộ quét mã nguy hiểm tích hợp. Tùy chọn này cho phép tiếp tục cài đặt ngay cả khi bộ quét tích hợp báo cáo phát hiện `critical`, nhưng **không** bỏ qua các chặn chính sách hook `before_install` của plugin và **không** bỏ qua lỗi quét.

    Cờ CLI này áp dụng cho luồng cài đặt/cập nhật plugin. Các lượt cài đặt dependency kỹ năng do Gateway hỗ trợ dùng override yêu cầu tương ứng `dangerouslyForceUnsafeInstall`, còn `openclaw skills install` vẫn là luồng tải xuống/cài đặt kỹ năng ClawHub riêng biệt.

    Nếu một plugin bạn đã phát hành trên ClawHub bị chặn bởi một lượt quét registry, hãy dùng các bước dành cho nhà phát hành trong [ClawHub](/vi/tools/clawhub).

  </Accordion>
  <Accordion title="Gói hook và spec npm">
    `plugins install` cũng là bề mặt cài đặt cho các gói hook phơi bày `openclaw.hooks` trong `package.json`. Dùng `openclaw hooks` để xem hook có lọc và bật từng hook, không dùng cho cài đặt package.

    Spec npm là **chỉ registry** (tên package + **phiên bản chính xác** hoặc **dist-tag** tùy chọn). Spec Git/URL/file và dải semver bị từ chối. Cài đặt dependency chạy cục bộ theo dự án với `--ignore-scripts` để an toàn, ngay cả khi shell của bạn có thiết lập cài đặt npm toàn cục.

    Dùng `npm:<package>` khi bạn muốn làm rõ việc phân giải npm. Spec package trần cũng cài đặt trực tiếp từ npm trong giai đoạn chuyển đổi ra mắt.

    Spec trần và `@latest` ở lại nhánh ổn định. Các phiên bản sửa lỗi có đóng dấu ngày của OpenClaw như `2026.5.3-1` là bản phát hành ổn định cho kiểm tra này. Nếu npm phân giải một trong hai loại đó thành prerelease, OpenClaw sẽ dừng lại và yêu cầu bạn chọn tham gia rõ ràng bằng tag prerelease như `@beta`/`@rc` hoặc một phiên bản prerelease chính xác như `@1.2.3-beta.4`.

    Nếu một spec cài đặt trần khớp với id plugin chính thức (ví dụ `diffs`), OpenClaw sẽ cài đặt trực tiếp mục catalog. Để cài đặt một package npm cùng tên, hãy dùng spec scoped rõ ràng (ví dụ `@scope/diffs`).

  </Accordion>
  <Accordion title="Kho Git">
    Dùng `git:<repo>` để cài đặt trực tiếp từ một kho git. Các dạng được hỗ trợ gồm `git:github.com/owner/repo`, `git:owner/repo`, URL clone đầy đủ `https://`, `ssh://`, `git://`, `file://` và `git@host:owner/repo.git`. Thêm `@<ref>` hoặc `#<ref>` để checkout một branch, tag hoặc commit trước khi cài đặt.

    Cài đặt Git clone vào một thư mục tạm, checkout ref được yêu cầu khi có, rồi dùng trình cài đặt thư mục plugin thông thường. Điều đó nghĩa là xác thực manifest, quét mã nguy hiểm, công việc cài đặt của trình quản lý package và bản ghi cài đặt hoạt động như cài đặt npm. Các cài đặt git được ghi lại bao gồm URL/ref nguồn cùng commit đã phân giải để `openclaw plugins update` có thể phân giải lại nguồn sau này.

    Sau khi cài đặt từ git, dùng `openclaw plugins inspect <id> --runtime --json` để xác minh các đăng ký runtime như phương thức gateway và lệnh CLI. Nếu plugin đã đăng ký một gốc CLI với `api.registerCli`, hãy thực thi lệnh đó trực tiếp qua CLI gốc OpenClaw, ví dụ `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Archive">
    Archive được hỗ trợ: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Archive plugin OpenClaw native phải chứa một `openclaw.plugin.json` hợp lệ tại gốc plugin đã giải nén; archive chỉ chứa `package.json` sẽ bị từ chối trước khi OpenClaw ghi bản ghi cài đặt.

    Cài đặt marketplace Claude cũng được hỗ trợ.

  </Accordion>
</AccordionGroup>

Cài đặt ClawHub dùng locator `clawhub:<package>` rõ ràng:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Spec plugin an toàn cho npm dạng trần cài đặt từ npm theo mặc định trong giai đoạn chuyển đổi ra mắt:

```bash
openclaw plugins install openclaw-codex-app-server
```

Dùng `npm:` để làm rõ phân giải chỉ npm:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw kiểm tra khả năng tương thích API plugin / gateway tối thiểu được quảng bá trước khi cài đặt. Khi phiên bản ClawHub được chọn phát hành một artifact ClawPack, OpenClaw tải xuống `.tgz` npm-pack có phiên bản, xác minh header digest ClawHub và digest artifact, rồi cài đặt thông qua đường dẫn archive thông thường. Các phiên bản ClawHub cũ hơn không có metadata ClawPack vẫn cài đặt qua đường dẫn xác minh archive package cũ. Các cài đặt được ghi lại giữ metadata nguồn ClawHub, loại artifact, tính toàn vẹn npm, shasum npm, tên tarball và các thông tin digest ClawPack cho các cập nhật sau.
Cài đặt ClawHub không có phiên bản giữ một spec được ghi lại không có phiên bản để `openclaw plugins update` có thể theo các bản phát hành ClawHub mới hơn; selector phiên bản hoặc tag rõ ràng như `clawhub:pkg@1.2.3` và `clawhub:pkg@beta` vẫn được ghim vào selector đó.

#### Viết tắt marketplace

Dùng viết tắt `plugin@marketplace` khi tên marketplace tồn tại trong cache registry cục bộ của Claude tại `~/.claude/plugins/known_marketplaces.json`:

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
    - tên marketplace Claude đã biết từ `~/.claude/plugins/known_marketplaces.json`
    - gốc marketplace cục bộ hoặc đường dẫn `marketplace.json`
    - dạng viết tắt repo GitHub như `owner/repo`
    - URL repo GitHub như `https://github.com/owner/repo`
    - URL git

  </Tab>
  <Tab title="Quy tắc marketplace từ xa">
    Với các marketplace từ xa được tải từ GitHub hoặc git, các mục Plugin phải nằm trong repo marketplace đã được clone. OpenClaw chấp nhận các nguồn đường dẫn tương đối từ repo đó và từ chối HTTP(S), đường dẫn tuyệt đối, git, GitHub, và các nguồn Plugin không phải đường dẫn khác từ manifest từ xa.
  </Tab>
</Tabs>

Với đường dẫn cục bộ và archive, OpenClaw tự động phát hiện:

- Plugin OpenClaw gốc (`openclaw.plugin.json`)
- bundle tương thích với Codex (`.codex-plugin/plugin.json`)
- bundle tương thích với Claude (`.claude-plugin/plugin.json` hoặc bố cục thành phần Claude mặc định)
- bundle tương thích với Cursor (`.cursor-plugin/plugin.json`)

<Note>
Các bundle tương thích được cài vào gốc Plugin thông thường và tham gia cùng luồng list/info/enable/disable. Hiện tại, bundle skills, command-skills của Claude, mặc định `settings.json` của Claude, mặc định `.lsp.json` / `lspServers` được khai báo trong manifest của Claude, command-skills của Cursor, và các thư mục hook Codex tương thích được hỗ trợ; các khả năng bundle khác được phát hiện sẽ hiển thị trong chẩn đoán/info nhưng chưa được nối vào thực thi runtime.
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
  Inventory đọc được bằng máy kèm chẩn đoán registry và trạng thái cài đặt dependency của package.
</ParamField>

<Note>
`plugins list` đọc registry Plugin cục bộ đã lưu trước, với phương án dự phòng chỉ dựa trên manifest khi registry bị thiếu hoặc không hợp lệ. Lệnh này hữu ích để kiểm tra một Plugin đã được cài, bật và hiển thị cho kế hoạch khởi động lạnh hay chưa, nhưng không phải phép dò runtime trực tiếp của một tiến trình Gateway đang chạy. Sau khi thay đổi mã Plugin, trạng thái bật, chính sách hook, hoặc `plugins.load.paths`, hãy khởi động lại Gateway phục vụ kênh trước khi kỳ vọng mã `register(api)` mới hoặc các hook chạy. Với triển khai từ xa/container, hãy xác minh bạn đang khởi động lại đúng tiến trình con `openclaw gateway run`, không chỉ một tiến trình wrapper.

`plugins list --json` bao gồm `dependencyStatus` của từng Plugin từ `package.json`
`dependencies` và `optionalDependencies`. OpenClaw kiểm tra xem các tên package đó
có hiện diện dọc theo đường dẫn tra cứu Node `node_modules` thông thường của Plugin hay không; nó
không import mã runtime của Plugin, chạy trình quản lý package, hoặc sửa chữa
dependency bị thiếu.
</Note>

`plugins search` là tra cứu catalog ClawHub từ xa. Nó không kiểm tra trạng thái
cục bộ, thay đổi config, cài package, hoặc tải mã runtime của Plugin. Kết quả
tìm kiếm bao gồm tên package ClawHub, family, channel, phiên bản, tóm tắt, và
gợi ý cài đặt như `openclaw plugins install clawhub:<package>`.

Với công việc trên Plugin được bundle bên trong image Docker đã đóng gói, bind-mount thư mục
nguồn Plugin đè lên đường dẫn nguồn đã đóng gói tương ứng, chẳng hạn
`/app/extensions/synology-chat`. OpenClaw sẽ phát hiện overlay nguồn đã mount đó
trước `/app/dist/extensions/synology-chat`; một thư mục nguồn chỉ được sao chép
vẫn bất hoạt để các bản cài đặt đã đóng gói thông thường tiếp tục dùng dist đã biên dịch.

Để gỡ lỗi hook runtime:

- `openclaw plugins inspect <id> --runtime --json` hiển thị các hook đã đăng ký và chẩn đoán từ một lượt kiểm tra có tải module. Kiểm tra runtime không bao giờ cài dependency; dùng `openclaw doctor --fix` để dọn trạng thái dependency legacy hoặc khôi phục các Plugin có thể tải xuống bị thiếu đang được tham chiếu bởi config.
- `openclaw gateway status --deep --require-rpc` xác nhận Gateway có thể truy cập, gợi ý service/process, đường dẫn config, và sức khỏe RPC.
- Hook hội thoại không được bundle (`llm_input`, `llm_output`, `before_agent_finalize`, `agent_end`) yêu cầu `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Dùng `--link` để tránh sao chép một thư mục cục bộ (thêm vào `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` không được hỗ trợ với `--link` vì bản cài liên kết tái sử dụng đường dẫn nguồn thay vì sao chép đè lên mục tiêu cài đặt được quản lý.

Dùng `--pin` trên bản cài npm để lưu spec chính xác đã phân giải (`name@version`) trong index Plugin được quản lý, đồng thời giữ hành vi mặc định không ghim.
</Note>

### Index Plugin

Siêu dữ liệu cài đặt Plugin là trạng thái do máy quản lý, không phải config người dùng. Các lượt cài đặt và cập nhật ghi nó vào `plugins/installs.json` trong thư mục trạng thái OpenClaw đang hoạt động. Map cấp cao nhất `installRecords` là nguồn bền vững của siêu dữ liệu cài đặt, bao gồm bản ghi cho manifest Plugin bị hỏng hoặc bị thiếu. Mảng `plugins` là cache registry lạnh được suy ra từ manifest. Tệp bao gồm cảnh báo không chỉnh sửa và được dùng bởi `openclaw plugins update`, gỡ cài đặt, chẩn đoán, và registry Plugin lạnh.

Khi OpenClaw thấy các bản ghi `plugins.installs` legacy đã phát hành trong config, nó chuyển chúng vào index Plugin và xóa khóa config; nếu một trong hai lượt ghi thất bại, các bản ghi config được giữ lại để siêu dữ liệu cài đặt không bị mất.

### Gỡ cài đặt

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` xóa bản ghi Plugin khỏi `plugins.entries`, index Plugin đã lưu, các mục trong danh sách cho phép/từ chối Plugin, và các mục `plugins.load.paths` được liên kết khi áp dụng. Trừ khi đặt `--keep-files`, gỡ cài đặt cũng xóa thư mục cài đặt được quản lý đang được theo dõi khi nó nằm trong gốc extensions Plugin của OpenClaw. Với Plugin active memory, slot bộ nhớ đặt lại về `memory-core`.

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

Cập nhật áp dụng cho các bản cài Plugin được theo dõi trong index Plugin được quản lý và các bản cài hook-pack được theo dõi trong `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="Phân giải id Plugin so với spec npm">
    Khi bạn truyền một id Plugin, OpenClaw tái sử dụng spec cài đặt đã ghi cho Plugin đó. Điều đó có nghĩa là các dist-tag đã lưu trước đó như `@beta` và các phiên bản ghim chính xác tiếp tục được dùng trong các lần chạy `update <id>` sau này.

    Với bản cài npm, bạn cũng có thể truyền một spec package npm rõ ràng với dist-tag hoặc phiên bản chính xác. OpenClaw phân giải tên package đó ngược về bản ghi Plugin được theo dõi, cập nhật Plugin đã cài đó, và ghi spec npm mới cho các lần cập nhật dựa trên id trong tương lai.

    Truyền tên package npm không kèm phiên bản hoặc tag cũng phân giải ngược về bản ghi Plugin được theo dõi. Dùng cách này khi một Plugin đã được ghim vào phiên bản chính xác và bạn muốn chuyển nó trở lại dòng phát hành mặc định của registry.

  </Accordion>
  <Accordion title="Cập nhật kênh beta">
    `openclaw plugins update` tái sử dụng spec Plugin được theo dõi trừ khi bạn truyền spec mới. `openclaw update` còn biết kênh cập nhật OpenClaw đang hoạt động: trên kênh beta, các bản ghi Plugin npm và ClawHub thuộc dòng mặc định sẽ thử `@beta` trước, rồi quay lại spec default/latest đã ghi nếu không có bản phát hành beta của Plugin. Phiên bản chính xác và tag rõ ràng vẫn được ghim vào selector đó.

  </Accordion>
  <Accordion title="Kiểm tra phiên bản và trôi dạt tính toàn vẹn">
    Trước một lượt cập nhật npm trực tiếp, OpenClaw kiểm tra phiên bản package đã cài so với siêu dữ liệu registry npm. Nếu phiên bản đã cài và định danh artifact đã ghi đã khớp với mục tiêu được phân giải, bản cập nhật được bỏ qua mà không tải xuống, cài lại, hoặc ghi lại `openclaw.json`.

    Khi có hash tính toàn vẹn đã lưu và hash artifact được fetch thay đổi, OpenClaw xem đó là trôi dạt artifact npm. Lệnh tương tác `openclaw plugins update` in hash kỳ vọng và thực tế rồi yêu cầu xác nhận trước khi tiếp tục. Các helper cập nhật không tương tác sẽ fail closed trừ khi caller cung cấp chính sách tiếp tục rõ ràng.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install khi cập nhật">
    `--dangerously-force-unsafe-install` cũng có sẵn trên `plugins update` như một override khẩn cấp cho dương tính giả của quét dangerous-code tích hợp trong quá trình cập nhật Plugin. Nó vẫn không bỏ qua các chặn chính sách `before_install` của Plugin hoặc chặn do lỗi quét, và chỉ áp dụng cho cập nhật Plugin, không áp dụng cho cập nhật hook-pack.
  </Accordion>
</AccordionGroup>

### Kiểm tra

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect hiển thị định danh, trạng thái tải, nguồn, khả năng manifest, cờ chính sách, chẩn đoán, siêu dữ liệu cài đặt, khả năng bundle, và mọi hỗ trợ MCP hoặc server LSP được phát hiện mà mặc định không import runtime Plugin. Thêm `--runtime` để tải module Plugin và bao gồm các hook, tool, lệnh, service, phương thức gateway, và route HTTP đã đăng ký. Kiểm tra runtime báo trực tiếp dependency Plugin bị thiếu; việc cài đặt và sửa chữa nằm trong `openclaw plugins install`, `openclaw plugins update`, và `openclaw doctor --fix`.

Các lệnh CLI do Plugin sở hữu được cài làm nhóm lệnh `openclaw` gốc. Sau khi `inspect --runtime` hiển thị một lệnh dưới `cliCommands`, hãy chạy nó dưới dạng `openclaw <command> ...`; ví dụ một Plugin đăng ký `demo-git` có thể được xác minh bằng `openclaw demo-git ping`.

Mỗi Plugin được phân loại theo những gì nó thực sự đăng ký ở runtime:

- **plain-capability** — một loại khả năng (ví dụ: Plugin chỉ có provider)
- **hybrid-capability** — nhiều loại khả năng (ví dụ: văn bản + giọng nói + hình ảnh)
- **hook-only** — chỉ có hook, không có khả năng hoặc surface
- **non-capability** — tool/lệnh/service nhưng không có khả năng

Xem [Hình dạng Plugin](/vi/plugins/architecture#plugin-shapes) để biết thêm về mô hình khả năng.

<Note>
Cờ `--json` xuất báo cáo đọc được bằng máy, phù hợp cho scripting và kiểm toán. `inspect --all` render bảng toàn đội với các cột shape, loại khả năng, thông báo tương thích, khả năng bundle, và tóm tắt hook. `info` là alias của `inspect`.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` báo lỗi tải Plugin, chẩn đoán manifest/discovery, và thông báo tương thích. Khi mọi thứ sạch, nó in `No plugin issues detected.`

Nếu một Plugin đã cấu hình hiện diện trên đĩa nhưng bị chặn bởi các kiểm tra an toàn đường dẫn của loader, validation config giữ lại mục Plugin và báo là `present but blocked`. Sửa chẩn đoán Plugin bị chặn trước đó, chẳng hạn quyền sở hữu đường dẫn hoặc quyền world-writable, thay vì xóa config `plugins.entries.<id>` hoặc `plugins.allow`.

Với lỗi hình dạng module như thiếu export `register`/`activate`, chạy lại với `OPENCLAW_PLUGIN_LOAD_DEBUG=1` để bao gồm tóm tắt hình dạng export ngắn gọn trong đầu ra chẩn đoán.

### Registry

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Registry Plugin cục bộ là mô hình đọc lạnh đã lưu của OpenClaw cho định danh Plugin đã cài, trạng thái bật, siêu dữ liệu nguồn, và quyền sở hữu đóng góp. Khởi động thông thường, tra cứu chủ sở hữu provider, phân loại thiết lập kênh, và inventory Plugin có thể đọc nó mà không cần import các module runtime Plugin.

Dùng `plugins registry` để kiểm tra registry đã lưu có hiện diện, hiện hành hay lỗi thời hay không. Dùng `--refresh` để dựng lại registry từ chỉ mục Plugin đã lưu, chính sách cấu hình và siêu dữ liệu manifest/package. Đây là đường dẫn sửa chữa, không phải đường dẫn kích hoạt runtime.

`openclaw doctor --fix` cũng sửa lỗi sai lệch npm được quản lý liên quan đến registry: nếu một gói `@openclaw/*` mồ côi hoặc đã được khôi phục trong thư mục gốc npm của Plugin được quản lý che khuất một Plugin đi kèm, doctor sẽ xóa gói lỗi thời đó và dựng lại registry để quá trình khởi động xác thực theo manifest đi kèm.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` là công tắc tương thích khẩn cấp đã ngừng khuyến nghị dùng cho lỗi đọc registry. Ưu tiên `plugins registry --refresh` hoặc `openclaw doctor --fix`; cơ chế dự phòng qua env chỉ dành cho khôi phục khởi động khẩn cấp trong khi quá trình migration được triển khai.
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Danh sách marketplace chấp nhận đường dẫn marketplace cục bộ, đường dẫn `marketplace.json`, dạng rút gọn GitHub như `owner/repo`, URL repo GitHub hoặc URL git. `--json` in nhãn nguồn đã phân giải cùng với manifest marketplace đã phân tích và các mục Plugin.

## Liên quan

- [Xây dựng Plugin](/vi/plugins/building-plugins)
- [Tham chiếu CLI](/vi/cli)
- [Plugin cộng đồng](/vi/plugins/community)
