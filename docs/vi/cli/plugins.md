---
read_when:
    - Bạn muốn cài đặt hoặc quản lý Plugin Gateway hoặc các gói tương thích
    - Bạn muốn gỡ lỗi các lỗi tải Plugin
sidebarTitle: Plugins
summary: Tài liệu tham khảo CLI cho `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, doctor)
title: Plugin
x-i18n:
    generated_at: "2026-05-06T09:05:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: e584092c6cdaf87681aef2ed106c299e3bab0552305b669c66b05deb61bf25ce
    source_path: cli/plugins.md
    workflow: 16
---

Quản lý Plugin Gateway, gói hook và các bundle tương thích.

<CardGroup cols={2}>
  <Card title="Hệ thống Plugin" href="/vi/tools/plugin">
    Hướng dẫn cho người dùng cuối về cài đặt, bật và khắc phục sự cố Plugin.
  </Card>
  <Card title="Quản lý Plugin" href="/vi/plugins/manage-plugins">
    Ví dụ nhanh cho cài đặt, liệt kê, cập nhật, gỡ cài đặt và xuất bản.
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

Để điều tra thao tác cài đặt, kiểm tra, gỡ cài đặt hoặc làm mới registry bị chậm, hãy chạy lệnh với `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`. Trace ghi thời lượng từng pha vào stderr và giữ cho đầu ra JSON vẫn có thể phân tích được. Xem [Gỡ lỗi](/vi/help/debugging#plugin-lifecycle-trace).

<Note>
Các Plugin đi kèm được phát hành cùng OpenClaw. Một số được bật mặc định (ví dụ nhà cung cấp mô hình đi kèm, nhà cung cấp giọng nói đi kèm và Plugin trình duyệt đi kèm); các Plugin khác cần `plugins enable`.

Plugin OpenClaw gốc phải phát hành kèm `openclaw.plugin.json` với JSON Schema nội tuyến (`configSchema`, ngay cả khi rỗng). Các bundle tương thích dùng manifest bundle riêng của chúng.

`plugins list` hiển thị `Format: openclaw` hoặc `Format: bundle`. Đầu ra danh sách/thông tin chi tiết cũng hiển thị subtype của bundle (`codex`, `claude` hoặc `cursor`) cùng các khả năng bundle được phát hiện.
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
Tên gói trần được cài đặt từ npm theo mặc định trong giai đoạn chuyển đổi ra mắt. Dùng `clawhub:<package>` cho ClawHub. Hãy xem việc cài đặt Plugin như chạy mã. Ưu tiên các phiên bản được ghim.
</Warning>

`plugins search` truy vấn ClawHub để tìm các gói Plugin có thể cài đặt và in ra tên gói sẵn sàng để cài đặt. Lệnh này tìm kiếm các gói code-plugin và bundle-plugin, không phải skills. Dùng `openclaw skills search` cho Skills trên ClawHub.

<Note>
ClawHub là bề mặt phân phối và khám phá chính cho hầu hết Plugin. Npm vẫn là đường dự phòng được hỗ trợ và đường cài đặt trực tiếp. Các gói Plugin `@openclaw/*` do OpenClaw sở hữu đã được xuất bản lại trên npm; xem danh sách hiện tại trên [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) hoặc [kho Plugin](/vi/plugins/plugin-inventory). Cài đặt ổn định dùng `latest`. Cài đặt và cập nhật kênh beta ưu tiên dist-tag `beta` của npm khi tag đó có sẵn, rồi quay về `latest`.
</Note>

<AccordionGroup>
  <Accordion title="Include cấu hình và sửa cấu hình không hợp lệ">
    Nếu phần `plugins` của bạn được hỗ trợ bởi một `$include` một tệp, `plugins install/update/enable/disable/uninstall` sẽ ghi xuyên tới tệp được include đó và để nguyên `openclaw.json`. Include gốc, mảng include và include có ghi đè cùng cấp sẽ fail closed thay vì làm phẳng. Xem [Include cấu hình](/vi/gateway/configuration) để biết các dạng được hỗ trợ.

    Nếu cấu hình không hợp lệ trong lúc cài đặt, `plugins install` thường fail closed và yêu cầu bạn chạy `openclaw doctor --fix` trước. Trong quá trình khởi động Gateway và hot reload, cấu hình Plugin không hợp lệ fail closed như mọi cấu hình không hợp lệ khác; `openclaw doctor --fix` có thể cách ly mục Plugin không hợp lệ. Ngoại lệ lúc cài đặt duy nhất được ghi tài liệu là đường khôi phục hẹp cho Plugin đi kèm đối với các Plugin chọn rõ ràng tham gia `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force và cài đặt lại so với cập nhật">
    `--force` dùng lại mục tiêu cài đặt hiện có và ghi đè tại chỗ Plugin hoặc gói hook đã được cài đặt. Dùng tùy chọn này khi bạn cố ý cài đặt lại cùng một id từ đường dẫn cục bộ, archive, gói ClawHub hoặc artifact npm mới. Với các nâng cấp thường kỳ cho một Plugin npm đã được theo dõi, ưu tiên `openclaw plugins update <id-or-npm-spec>`.

    Nếu bạn chạy `plugins install` cho một id Plugin đã được cài đặt, OpenClaw sẽ dừng và chỉ bạn tới `plugins update <id-or-npm-spec>` để nâng cấp bình thường, hoặc tới `plugins install <package> --force` khi bạn thực sự muốn ghi đè cài đặt hiện tại từ một nguồn khác.

  </Accordion>
  <Accordion title="Phạm vi --pin">
    `--pin` chỉ áp dụng cho cài đặt npm. Tùy chọn này không được hỗ trợ với cài đặt `git:`; hãy dùng git ref rõ ràng như `git:github.com/acme/plugin@v1.2.3` khi bạn muốn ghim nguồn. Tùy chọn này không được hỗ trợ với `--marketplace`, vì cài đặt marketplace lưu metadata nguồn marketplace thay vì spec npm.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` là tùy chọn phá kính khẩn cấp cho các cảnh báo dương tính giả trong bộ quét mã nguy hiểm tích hợp. Tùy chọn này cho phép quá trình cài đặt tiếp tục ngay cả khi bộ quét tích hợp báo cáo phát hiện `critical`, nhưng **không** bỏ qua các chặn chính sách hook `before_install` của Plugin và **không** bỏ qua lỗi quét.

    Cờ CLI này áp dụng cho các luồng cài đặt/cập nhật Plugin. Cài đặt dependency của skill dựa trên Gateway dùng override yêu cầu tương ứng `dangerouslyForceUnsafeInstall`, trong khi `openclaw skills install` vẫn là một luồng tải xuống/cài đặt skill ClawHub riêng.

    Nếu một Plugin bạn đã xuất bản trên ClawHub bị chặn bởi quét registry, hãy dùng các bước dành cho nhà xuất bản trong [ClawHub](/vi/tools/clawhub).

  </Accordion>
  <Accordion title="Gói hook và spec npm">
    `plugins install` cũng là bề mặt cài đặt cho các gói hook công bố `openclaw.hooks` trong `package.json`. Dùng `openclaw hooks` để xem hook đã lọc và bật theo từng hook, không phải để cài đặt gói.

    Spec npm là **chỉ registry** (tên gói + **phiên bản chính xác** hoặc **dist-tag** tùy chọn). Spec Git/URL/file và khoảng semver bị từ chối. Cài đặt dependency chạy cục bộ theo dự án với `--ignore-scripts` để an toàn, ngay cả khi shell của bạn có thiết lập cài đặt npm toàn cục.

    Dùng `npm:<package>` khi bạn muốn làm rõ việc phân giải npm. Spec gói trần cũng cài đặt trực tiếp từ npm trong giai đoạn chuyển đổi ra mắt.

    Spec trần và `@latest` vẫn ở track ổn định. Các phiên bản sửa lỗi có dấu ngày của OpenClaw như `2026.5.3-1` là bản phát hành ổn định cho kiểm tra này. Nếu npm phân giải một trong hai dạng đó thành prerelease, OpenClaw sẽ dừng và yêu cầu bạn chọn tham gia rõ ràng bằng tag prerelease như `@beta`/`@rc` hoặc phiên bản prerelease chính xác như `@1.2.3-beta.4`.

    Nếu một spec cài đặt trần khớp với id Plugin chính thức (ví dụ `diffs`), OpenClaw cài đặt trực tiếp mục catalog. Để cài đặt một gói npm có cùng tên, hãy dùng spec có scope rõ ràng (ví dụ `@scope/diffs`).

  </Accordion>
  <Accordion title="Kho Git">
    Dùng `git:<repo>` để cài đặt trực tiếp từ một kho git. Các dạng được hỗ trợ gồm `git:github.com/owner/repo`, `git:owner/repo`, URL clone đầy đủ `https://`, `ssh://`, `git://`, `file://` và `git@host:owner/repo.git`. Thêm `@<ref>` hoặc `#<ref>` để checkout branch, tag hoặc commit trước khi cài đặt.

    Cài đặt Git clone vào một thư mục tạm, checkout ref được yêu cầu khi có, rồi dùng trình cài đặt thư mục Plugin bình thường. Điều đó nghĩa là xác thực manifest, quét mã nguy hiểm, công việc cài đặt bằng trình quản lý gói và bản ghi cài đặt hoạt động giống cài đặt npm. Bản ghi cài đặt git bao gồm URL/ref nguồn cùng commit đã phân giải để `openclaw plugins update` có thể phân giải lại nguồn sau này.

    Sau khi cài đặt từ git, dùng `openclaw plugins inspect <id> --runtime --json` để xác minh các đăng ký runtime như phương thức gateway và lệnh CLI. Nếu Plugin đã đăng ký một root CLI bằng `api.registerCli`, hãy thực thi lệnh đó trực tiếp qua CLI gốc của OpenClaw, ví dụ `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Archive">
    Archive được hỗ trợ: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Archive Plugin OpenClaw gốc phải chứa `openclaw.plugin.json` hợp lệ tại root Plugin sau khi giải nén; archive chỉ chứa `package.json` sẽ bị từ chối trước khi OpenClaw ghi bản ghi cài đặt.

    Dùng `npm-pack:<path.tgz>` khi tệp là tarball npm-pack và bạn muốn kiểm thử cùng đường cài đặt npm-root được quản lý như cài đặt registry, bao gồm xác minh `package-lock.json`, quét dependency được hoist và bản ghi cài đặt npm. Đường dẫn archive thuần vẫn cài đặt như archive cục bộ dưới root extensions của Plugin.

    Cài đặt marketplace Claude cũng được hỗ trợ.

  </Accordion>
</AccordionGroup>

Cài đặt ClawHub dùng locator `clawhub:<package>` rõ ràng:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Spec Plugin an toàn cho npm ở dạng trần được cài đặt từ npm theo mặc định trong giai đoạn chuyển đổi ra mắt:

```bash
openclaw plugins install openclaw-codex-app-server
```

Dùng `npm:` để làm rõ phân giải chỉ npm:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw kiểm tra khả năng tương thích API Plugin được quảng bá / Gateway tối thiểu trước khi cài đặt. Khi phiên bản ClawHub được chọn xuất bản artifact ClawPack, OpenClaw tải xuống `.tgz` npm-pack có phiên bản, xác minh header digest ClawHub và digest artifact, rồi cài đặt qua đường archive bình thường. Các phiên bản ClawHub cũ hơn không có metadata ClawPack vẫn cài đặt qua đường xác minh archive gói cũ. Bản ghi cài đặt giữ metadata nguồn ClawHub, loại artifact, integrity npm, shasum npm, tên tarball và các sự kiện digest ClawPack để cập nhật về sau.
Cài đặt ClawHub không có phiên bản giữ spec đã ghi không có phiên bản để `openclaw plugins update` có thể đi theo các bản phát hành ClawHub mới hơn; selector phiên bản hoặc tag rõ ràng như `clawhub:pkg@1.2.3` và `clawhub:pkg@beta` vẫn được ghim vào selector đó.

#### Cú pháp rút gọn marketplace

Dùng cú pháp rút gọn `plugin@marketplace` khi tên marketplace tồn tại trong cache registry cục bộ của Claude tại `~/.claude/plugins/known_marketplaces.json`:

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

Dùng `--marketplace` khi bạn muốn truyền rõ ràng nguồn marketplace:

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

<Tabs>
  <Tab title="Nguồn marketplace">
    - tên marketplace Claude đã biết từ `~/.claude/plugins/known_marketplaces.json`
    - thư mục gốc marketplace cục bộ hoặc đường dẫn `marketplace.json`
    - dạng viết tắt repo GitHub như `owner/repo`
    - URL repo GitHub như `https://github.com/owner/repo`
    - URL git

  </Tab>
  <Tab title="Quy tắc marketplace từ xa">
    Với các marketplace từ xa được tải từ GitHub hoặc git, mục nhập Plugin phải nằm bên trong repo marketplace đã clone. OpenClaw chấp nhận các nguồn đường dẫn tương đối từ repo đó và từ chối các nguồn Plugin HTTP(S), đường dẫn tuyệt đối, git, GitHub và các nguồn Plugin không phải đường dẫn khác từ manifest từ xa.
  </Tab>
</Tabs>

Với đường dẫn cục bộ và tệp lưu trữ, OpenClaw tự động phát hiện:

- Plugin OpenClaw gốc (`openclaw.plugin.json`)
- gói tương thích Codex (`.codex-plugin/plugin.json`)
- gói tương thích Claude (`.claude-plugin/plugin.json` hoặc bố cục thành phần Claude mặc định)
- gói tương thích Cursor (`.cursor-plugin/plugin.json`)

<Note>
Các gói tương thích được cài vào thư mục gốc Plugin thông thường và tham gia cùng luồng list/info/enable/disable. Hiện tại, bundle skills, command-skills của Claude, mặc định `settings.json` của Claude, mặc định `.lsp.json` của Claude / `lspServers` được khai báo trong manifest, command-skills của Cursor và các thư mục hook Codex tương thích được hỗ trợ; các khả năng gói khác được phát hiện sẽ hiển thị trong diagnostics/info nhưng chưa được nối vào thực thi runtime.
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
  Kho dữ liệu máy đọc được kèm diagnostics registry và trạng thái cài đặt dependency của package.
</ParamField>

<Note>
`plugins list` đọc registry Plugin cục bộ đã lưu trước, với fallback chỉ dựa trên manifest khi registry bị thiếu hoặc không hợp lệ. Lệnh này hữu ích để kiểm tra một Plugin đã được cài, bật và hiển thị với quá trình lập kế hoạch khởi động lạnh hay chưa, nhưng không phải là phép dò runtime trực tiếp của một tiến trình Gateway đang chạy. Sau khi thay đổi mã Plugin, trạng thái bật, chính sách hook hoặc `plugins.load.paths`, hãy khởi động lại Gateway phục vụ channel trước khi kỳ vọng mã `register(api)` hoặc hook mới chạy. Với triển khai từ xa/container, hãy xác minh bạn đang khởi động lại đúng tiến trình con `openclaw gateway run`, không chỉ một tiến trình wrapper.

`plugins list --json` bao gồm `dependencyStatus` của từng Plugin từ `dependencies` và `optionalDependencies` trong `package.json`. OpenClaw kiểm tra xem các tên package đó có hiện diện dọc theo đường dẫn tra cứu `node_modules` thông thường của Node cho Plugin hay không; nó không import mã runtime Plugin, không chạy trình quản lý package và không sửa các dependency bị thiếu.
</Note>

`plugins search` là truy vấn danh mục ClawHub từ xa. Nó không kiểm tra trạng thái cục bộ, không thay đổi config, không cài package và không tải mã runtime Plugin. Kết quả tìm kiếm bao gồm tên package ClawHub, family, channel, phiên bản, tóm tắt và gợi ý cài đặt như `openclaw plugins install clawhub:<package>`.

Khi làm việc với Plugin đi kèm bên trong image Docker đã đóng gói, hãy bind-mount thư mục nguồn Plugin lên đường dẫn nguồn đã đóng gói tương ứng, chẳng hạn `/app/extensions/synology-chat`. OpenClaw sẽ phát hiện lớp phủ nguồn đã mount đó trước `/app/dist/extensions/synology-chat`; một thư mục nguồn được sao chép đơn thuần vẫn bất hoạt để các bản cài đặt đóng gói thông thường tiếp tục dùng dist đã biên dịch.

Để gỡ lỗi hook runtime:

- `openclaw plugins inspect <id> --runtime --json` hiển thị các hook đã đăng ký và diagnostics từ một lượt kiểm tra có tải module. Kiểm tra runtime không bao giờ cài dependency; dùng `openclaw doctor --fix` để dọn trạng thái dependency cũ hoặc khôi phục các Plugin có thể tải xuống bị thiếu nhưng được tham chiếu bởi config.
- `openclaw gateway status --deep --require-rpc` xác nhận Gateway có thể truy cập, gợi ý service/process, đường dẫn config và tình trạng RPC.
- Các hook hội thoại không đi kèm (`llm_input`, `llm_output`, `before_agent_finalize`, `agent_end`) yêu cầu `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Dùng `--link` để tránh sao chép một thư mục cục bộ (thêm vào `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` không được hỗ trợ cùng `--link` vì các bản cài liên kết tái sử dụng đường dẫn nguồn thay vì sao chép đè lên mục tiêu cài đặt được quản lý.

Dùng `--pin` trên các bản cài npm để lưu spec chính xác đã phân giải (`name@version`) trong chỉ mục Plugin được quản lý trong khi vẫn giữ hành vi mặc định là không ghim.
</Note>

### Chỉ mục Plugin

Metadata cài đặt Plugin là trạng thái do máy quản lý, không phải config của người dùng. Các bản cài và cập nhật ghi metadata này vào `plugins/installs.json` trong thư mục trạng thái OpenClaw đang hoạt động. Map cấp cao nhất `installRecords` là nguồn bền vững của metadata cài đặt, bao gồm cả bản ghi cho các manifest Plugin bị hỏng hoặc bị thiếu. Mảng `plugins` là cache registry lạnh được suy ra từ manifest. Tệp này bao gồm cảnh báo không chỉnh sửa và được dùng bởi `openclaw plugins update`, gỡ cài đặt, diagnostics và registry Plugin lạnh.

Khi OpenClaw thấy các bản ghi `plugins.installs` cũ đã phát hành trong config, nó chuyển chúng vào chỉ mục Plugin và xóa khóa config; nếu một trong hai thao tác ghi thất bại, các bản ghi config được giữ lại để metadata cài đặt không bị mất.

### Gỡ cài đặt

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` xóa bản ghi Plugin khỏi `plugins.entries`, chỉ mục Plugin đã lưu, các mục danh sách cho phép/từ chối Plugin và các mục `plugins.load.paths` được liên kết khi áp dụng. Trừ khi đặt `--keep-files`, gỡ cài đặt cũng xóa thư mục cài đặt được quản lý đã theo dõi khi thư mục đó nằm bên trong thư mục gốc tiện ích mở rộng Plugin của OpenClaw. Với Plugin active memory, ô nhớ đặt lại về `memory-core`.

<Note>
`--keep-config` được hỗ trợ như bí danh đã ngừng khuyến nghị cho `--keep-files`.
</Note>

### Cập nhật

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

Các cập nhật áp dụng cho bản cài Plugin được theo dõi trong chỉ mục Plugin được quản lý và bản cài hook-pack được theo dõi trong `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="Phân giải id Plugin so với spec npm">
    Khi bạn truyền một id Plugin, OpenClaw tái sử dụng spec cài đặt đã ghi lại cho Plugin đó. Điều này có nghĩa là các dist-tag đã lưu trước đó như `@beta` và các phiên bản được ghim chính xác tiếp tục được dùng trong các lần chạy `update <id>` sau.

    Với bản cài npm, bạn cũng có thể truyền một spec package npm rõ ràng kèm dist-tag hoặc phiên bản chính xác. OpenClaw phân giải tên package đó ngược về bản ghi Plugin được theo dõi, cập nhật Plugin đã cài đó và ghi lại spec npm mới cho các lần cập nhật dựa trên id trong tương lai.

    Truyền tên package npm không kèm phiên bản hoặc tag cũng phân giải ngược về bản ghi Plugin được theo dõi. Dùng cách này khi một Plugin đã được ghim vào phiên bản chính xác và bạn muốn chuyển nó về dòng phát hành mặc định của registry.

  </Accordion>
  <Accordion title="Cập nhật kênh beta">
    `openclaw plugins update` tái sử dụng spec Plugin được theo dõi trừ khi bạn truyền spec mới. `openclaw update` còn biết channel cập nhật OpenClaw đang hoạt động: trên channel beta, các bản ghi Plugin npm dòng mặc định và ClawHub thử `@beta` trước, rồi fallback về spec mặc định/latest đã ghi lại nếu không tồn tại bản phát hành beta của Plugin. Phiên bản chính xác và tag rõ ràng vẫn được ghim vào bộ chọn đó.

  </Accordion>
  <Accordion title="Kiểm tra phiên bản và lệch integrity">
    Trước một cập nhật npm trực tiếp, OpenClaw kiểm tra phiên bản package đã cài so với metadata registry npm. Nếu phiên bản đã cài và danh tính artifact đã ghi lại đã khớp với mục tiêu được phân giải, cập nhật sẽ bị bỏ qua mà không tải xuống, cài lại hoặc ghi lại `openclaw.json`.

    Khi tồn tại hash integrity đã lưu và hash artifact đã fetch thay đổi, OpenClaw xem đó là lệch artifact npm. Lệnh tương tác `openclaw plugins update` in hash mong đợi và thực tế rồi yêu cầu xác nhận trước khi tiếp tục. Các helper cập nhật không tương tác thất bại đóng, trừ khi caller cung cấp chính sách tiếp tục rõ ràng.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install khi cập nhật">
    `--dangerously-force-unsafe-install` cũng có trên `plugins update` như một override phá kính cho các false positive của quét mã nguy hiểm tích hợp trong quá trình cập nhật Plugin. Nó vẫn không bỏ qua các chặn chính sách `before_install` của Plugin hoặc chặn khi quét thất bại, và chỉ áp dụng cho cập nhật Plugin, không áp dụng cho cập nhật hook-pack.
  </Accordion>
</AccordionGroup>

### Kiểm tra

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect hiển thị danh tính, trạng thái tải, nguồn, khả năng manifest, cờ chính sách, diagnostics, metadata cài đặt, khả năng gói và mọi hỗ trợ MCP hoặc máy chủ LSP được phát hiện mà mặc định không import runtime Plugin. Thêm `--runtime` để tải module Plugin và bao gồm các hook, công cụ, lệnh, service, phương thức gateway và route HTTP đã đăng ký. Kiểm tra runtime báo cáo trực tiếp các dependency Plugin bị thiếu; việc cài đặt và sửa chữa vẫn nằm trong `openclaw plugins install`, `openclaw plugins update` và `openclaw doctor --fix`.

Các lệnh CLI do Plugin sở hữu được cài như các nhóm lệnh `openclaw` gốc. Sau khi `inspect --runtime` hiển thị một lệnh dưới `cliCommands`, hãy chạy lệnh đó dưới dạng `openclaw <command> ...`; ví dụ một Plugin đăng ký `demo-git` có thể được xác minh bằng `openclaw demo-git ping`.

Mỗi Plugin được phân loại theo những gì nó thực sự đăng ký tại runtime:

- **plain-capability** — một loại khả năng (ví dụ: Plugin chỉ dành cho provider)
- **hybrid-capability** — nhiều loại khả năng (ví dụ: văn bản + giọng nói + hình ảnh)
- **hook-only** — chỉ có hook, không có khả năng hoặc bề mặt
- **non-capability** — công cụ/lệnh/service nhưng không có khả năng

Xem [Hình dạng Plugin](/vi/plugins/architecture#plugin-shapes) để biết thêm về mô hình khả năng.

<Note>
Cờ `--json` xuất báo cáo máy đọc được, phù hợp cho script và kiểm toán. `inspect --all` render bảng toàn fleet với các cột hình dạng, loại khả năng, thông báo tương thích, khả năng gói và tóm tắt hook. `info` là bí danh của `inspect`.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` báo cáo lỗi tải Plugin, diagnostics manifest/discovery và thông báo tương thích. Khi mọi thứ sạch, lệnh in `No plugin issues detected.`

Nếu một Plugin đã cấu hình hiện diện trên đĩa nhưng bị chặn bởi các kiểm tra an toàn đường dẫn của loader, xác thực config giữ lại mục nhập Plugin và báo cáo là `present but blocked`. Hãy sửa diagnostic Plugin bị chặn đứng trước, chẳng hạn quyền sở hữu đường dẫn hoặc quyền world-writable, thay vì xóa config `plugins.entries.<id>` hoặc `plugins.allow`.

Với lỗi hình dạng module như thiếu export `register`/`activate`, chạy lại với `OPENCLAW_PLUGIN_LOAD_DEBUG=1` để đưa tóm tắt hình dạng export gọn vào đầu ra diagnostic.

### Registry

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Sổ đăng ký plugin cục bộ là mô hình đọc nguội được lưu bền vững của OpenClaw cho danh tính plugin đã cài đặt, trạng thái bật, siêu dữ liệu nguồn và quyền sở hữu đóng góp. Khởi động thông thường, tra cứu chủ sở hữu nhà cung cấp, phân loại thiết lập kênh và kiểm kê plugin có thể đọc dữ liệu này mà không cần nhập các mô-đun thời gian chạy plugin.

Dùng `plugins registry` để kiểm tra xem sổ đăng ký được lưu bền vững có tồn tại, hiện hành hay đã lỗi thời không. Dùng `--refresh` để xây dựng lại từ chỉ mục plugin được lưu bền vững, chính sách cấu hình và siêu dữ liệu manifest/package. Đây là đường dẫn sửa chữa, không phải đường dẫn kích hoạt thời gian chạy.

`openclaw doctor --fix` cũng sửa sai lệch npm được quản lý liền kề sổ đăng ký: nếu một package `@openclaw/*` mồ côi hoặc được khôi phục dưới gốc npm plugin được quản lý che khuất một plugin đi kèm, doctor sẽ xóa package lỗi thời đó và xây dựng lại sổ đăng ký để quá trình khởi động xác thực theo manifest đi kèm.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` là công tắc tương thích khẩn cấp đã lỗi thời cho lỗi đọc sổ đăng ký. Ưu tiên `plugins registry --refresh` hoặc `openclaw doctor --fix`; phương án dự phòng env chỉ dành cho khôi phục khởi động khẩn cấp trong khi quá trình di trú được triển khai.
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Danh sách Marketplace chấp nhận đường dẫn marketplace cục bộ, đường dẫn `marketplace.json`, dạng viết tắt GitHub như `owner/repo`, URL repo GitHub hoặc URL git. `--json` in nhãn nguồn đã phân giải cùng với manifest marketplace đã phân tích cú pháp và các mục plugin.

## Liên quan

- [Xây dựng plugin](/vi/plugins/building-plugins)
- [Tham chiếu CLI](/vi/cli)
- [Plugin cộng đồng](/vi/plugins/community)
