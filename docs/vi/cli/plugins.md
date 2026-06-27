---
read_when:
    - Bạn muốn cài đặt hoặc quản lý các Plugin Gateway hoặc các gói tương thích
    - Bạn muốn tạo khung hoặc xác thực một Plugin công cụ đơn giản
    - Bạn muốn gỡ lỗi các lỗi tải Plugin
sidebarTitle: Plugins
summary: Tham chiếu CLI cho `openclaw plugins` (init, build, validate, list, install, marketplace, uninstall, enable/disable, doctor)
title: Plugin
x-i18n:
    generated_at: "2026-06-27T17:19:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b4366a862f6a8996b38b624760eef407969f35a7451e3b2a1d5e82746d73b678
    source_path: cli/plugins.md
    workflow: 16
---

Quản lý các Plugin Gateway, gói hook và các bundle tương thích.

<CardGroup cols={2}>
  <Card title="Hệ thống Plugin" href="/vi/tools/plugin">
    Hướng dẫn cho người dùng cuối về cài đặt, bật và khắc phục sự cố Plugin.
  </Card>
  <Card title="Quản lý Plugin" href="/vi/plugins/manage-plugins">
    Ví dụ nhanh để cài đặt, liệt kê, cập nhật, gỡ cài đặt và phát hành.
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
openclaw plugins init my-tool --name "My Tool"
openclaw plugins init my-provider --name "My Provider" --type provider
openclaw plugins init my-provider --name "My Provider" --type provider --directory ./my-provider
openclaw plugins build --entry ./dist/index.js
openclaw plugins build --entry ./dist/index.js --check
openclaw plugins validate --entry ./dist/index.js
```

Để điều tra các thao tác cài đặt, kiểm tra, gỡ cài đặt hoặc làm mới registry bị chậm, hãy chạy
lệnh với `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`. Trace ghi thời lượng từng pha
vào stderr và giữ cho đầu ra JSON vẫn phân tích được. Xem [Gỡ lỗi](/vi/help/debugging#plugin-lifecycle-trace).

<Note>
Ở chế độ Nix (`OPENCLAW_NIX_MODE=1`), các thao tác thay đổi vòng đời Plugin bị tắt. Hãy dùng nguồn Nix cho lượt cài đặt này thay vì `plugins install`, `plugins update`, `plugins uninstall`, `plugins enable` hoặc `plugins disable`; với nix-openclaw, dùng [Khởi động nhanh](https://github.com/openclaw/nix-openclaw#quick-start) theo hướng agent-first.
</Note>

<Note>
Các Plugin đi kèm được phát hành cùng OpenClaw. Một số được bật mặc định (ví dụ các nhà cung cấp mô hình đi kèm, nhà cung cấp giọng nói đi kèm và Plugin trình duyệt đi kèm); các Plugin khác cần `plugins enable`.

Plugin OpenClaw gốc phải phát hành kèm `openclaw.plugin.json` với JSON Schema nội tuyến (`configSchema`, ngay cả khi rỗng). Các bundle tương thích dùng manifest bundle riêng của chúng.

`plugins list` hiển thị `Format: openclaw` hoặc `Format: bundle`. Đầu ra list/info chi tiết cũng hiển thị subtype của bundle (`codex`, `claude` hoặc `cursor`) cùng các khả năng bundle được phát hiện.
</Note>

### Tác giả

```bash
openclaw plugins init stock-quotes --name "Stock Quotes"
cd stock-quotes
npm run plugin:build
npm run plugin:validate
```

`plugins init` mặc định tạo một Plugin công cụ TypeScript tối thiểu. Đối số đầu tiên
là id Plugin; truyền `--name` cho tên hiển thị. OpenClaw dùng
id cho thư mục đầu ra mặc định và cách đặt tên package. Scaffold công cụ dùng
`defineToolPlugin`.
`plugins build` import entry đã build, đọc metadata công cụ tĩnh của nó, ghi
`openclaw.plugin.json` và giữ `package.json` `openclaw.extensions` đồng bộ.
`plugins validate` kiểm tra rằng manifest đã tạo, metadata package và
export entry hiện tại vẫn thống nhất. Xem [Plugin công cụ](/vi/plugins/tool-plugins) để biết
toàn bộ workflow viết công cụ.

Scaffold ghi mã nguồn TypeScript nhưng tạo metadata từ entry đã build
`./dist/index.js` để workflow cũng hoạt động với CLI đã phát hành. Dùng
`--entry <path>` khi entry không phải entry package mặc định. Dùng
`plugins build --check` trong CI để thất bại khi metadata đã tạo bị cũ mà không
ghi lại tệp.

### Scaffold nhà cung cấp

```bash
openclaw plugins init acme-models --name "Acme Models" --type provider
cd acme-models
npm install
npm run build
npm test
npm run validate
```

Scaffold nhà cung cấp tạo một Plugin nhà cung cấp văn bản/mô hình chung với phần nối API key tương thích OpenAI, script `npm run validate` tích hợp sẵn cho `clawhub package
validate`, metadata package ClawHub và một workflow GitHub được kích hoạt thủ công
để phát hành tin cậy trong tương lai thông qua GitHub Actions OIDC. Scaffold nhà cung cấp
không tạo skills và không dùng `openclaw plugins build` hoặc
`openclaw plugins validate`; các lệnh đó dành cho đường dẫn metadata được tạo của scaffold công cụ.

Trước khi phát hành, hãy thay URL cơ sở API giữ chỗ, danh mục mô hình, route tài liệu,
văn bản thông tin xác thực và nội dung README bằng thông tin nhà cung cấp thật. Dùng
README đã tạo cho lần phát hành ClawHub đầu tiên và thiết lập nhà phát hành tin cậy.

### Cài đặt

```bash
openclaw plugins search "calendar"                   # search ClawHub plugins
openclaw plugins install <package>                      # source auto-detection
openclaw plugins install clawhub:<package>              # ClawHub only
openclaw plugins install npm:<package>                  # npm only
openclaw plugins install npm-pack:<path.tgz>            # local npm pack through npm install semantics
openclaw plugins install git:github.com/<owner>/<repo>  # git repo
openclaw plugins install git:github.com/<owner>/<repo>@<ref>
openclaw plugins install <package> --force              # overwrite existing install
openclaw plugins install <package> --pin                # pin version
openclaw plugins install clawhub:<package> --acknowledge-clawhub-risk
openclaw plugins install <package> --dangerously-force-unsafe-install
openclaw plugins install <path>                         # local path
openclaw plugins install <plugin>@<marketplace>         # marketplace
openclaw plugins install <plugin> --marketplace <name>  # marketplace (explicit)
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
```

Maintainer kiểm thử lượt cài đặt lúc thiết lập có thể ghi đè nguồn cài đặt Plugin tự động
bằng các biến môi trường được bảo vệ. Xem
[Ghi đè cài đặt Plugin](/vi/plugins/install-overrides).

<Warning>
Tên package trần sẽ cài từ npm theo mặc định trong giai đoạn chuyển đổi ra mắt, trừ khi chúng khớp với id Plugin chính thức. Các spec package `@openclaw/*` thô khớp với Plugin đi kèm sẽ dùng bản đi kèm đã phát hành cùng bản build OpenClaw hiện tại. Dùng `npm:<package>` khi bạn chủ ý muốn một package npm bên ngoài. Dùng `clawhub:<package>` cho ClawHub. Hãy coi việc cài Plugin như chạy mã. Ưu tiên các phiên bản được ghim.
</Warning>

`plugins search` truy vấn ClawHub để tìm các package Plugin có thể cài đặt và in
tên package sẵn sàng để cài đặt. Lệnh này tìm kiếm package code-plugin và bundle-plugin,
không phải skills. Dùng `openclaw skills search` cho Skills ClawHub.

<Note>
ClawHub là bề mặt phân phối và khám phá chính cho hầu hết Plugin. Npm
vẫn là đường dẫn dự phòng được hỗ trợ và cài đặt trực tiếp. Các package Plugin
`@openclaw/*` thuộc OpenClaw được phát hành lại trên npm; xem danh sách hiện tại
trên [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) hoặc
[kiểm kê Plugin](/vi/plugins/plugin-inventory). Cài đặt ổn định dùng `latest`.
Cài đặt và cập nhật kênh beta ưu tiên dist-tag npm `beta` khi tag đó
có sẵn, rồi fallback về `latest`.
</Note>

<AccordionGroup>
  <Accordion title="Config includes và sửa cấu hình không hợp lệ">
    Nếu phần `plugins` của bạn được hỗ trợ bởi một `$include` tệp đơn, `plugins install/update/enable/disable/uninstall` ghi xuyên qua tệp được include đó và giữ nguyên `openclaw.json`. Include gốc, mảng include và include có ghi đè sibling sẽ fail closed thay vì làm phẳng. Xem [Config includes](/vi/gateway/configuration) để biết các hình dạng được hỗ trợ.

    Nếu cấu hình không hợp lệ trong khi cài đặt, `plugins install` thường fail closed và yêu cầu bạn chạy `openclaw doctor --fix` trước. Trong quá trình khởi động Gateway và hot reload, cấu hình Plugin không hợp lệ fail closed như mọi cấu hình không hợp lệ khác; `openclaw doctor --fix` có thể cách ly mục Plugin không hợp lệ. Ngoại lệ duy nhất được ghi tài liệu tại thời điểm cài đặt là một đường dẫn khôi phục hẹp cho Plugin đi kèm, dành cho các Plugin chủ động chọn tham gia `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force và cài lại so với cập nhật">
    `--force` tái sử dụng đích cài đặt hiện có và ghi đè tại chỗ một Plugin hoặc gói hook đã được cài đặt. Dùng tùy chọn này khi bạn chủ ý cài lại cùng một id từ một đường dẫn cục bộ, archive, package ClawHub hoặc artifact npm mới. Với nâng cấp định kỳ của một Plugin npm đã được theo dõi, ưu tiên `openclaw plugins update <id-or-npm-spec>`.

    Nếu bạn chạy `plugins install` cho một id Plugin đã được cài đặt, OpenClaw dừng lại và chỉ bạn đến `plugins update <id-or-npm-spec>` để nâng cấp bình thường, hoặc đến `plugins install <package> --force` khi bạn thật sự muốn ghi đè lượt cài đặt hiện tại từ một nguồn khác.

  </Accordion>
  <Accordion title="Phạm vi --pin">
    `--pin` chỉ áp dụng cho cài đặt npm. Tùy chọn này không được hỗ trợ với cài đặt `git:`; hãy dùng một git ref rõ ràng như `git:github.com/acme/plugin@v1.2.3` khi bạn muốn một nguồn được ghim. Tùy chọn này không được hỗ trợ với `--marketplace`, vì cài đặt marketplace lưu metadata nguồn marketplace thay vì spec npm.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` đã bị ngừng khuyến nghị và hiện là no-op. OpenClaw không còn chạy cơ chế chặn mã nguy hiểm tích hợp tại thời điểm cài đặt cho lượt cài Plugin.

    Dùng bề mặt `security.installPolicy` do operator sở hữu dùng chung khi cần chính sách cài đặt theo host. Hook `before_install` của Plugin là hook vòng đời runtime Plugin và không phải ranh giới chính sách chính cho cài đặt CLI.

    Nếu một Plugin bạn đã phát hành trên ClawHub bị ẩn hoặc bị chặn bởi lần quét registry, hãy dùng các bước dành cho nhà phát hành trong [Phát hành ClawHub](/vi/clawhub/publishing). `--dangerously-force-unsafe-install` không yêu cầu ClawHub quét lại Plugin hoặc công khai một release bị chặn.

  </Accordion>
  <Accordion title="--acknowledge-clawhub-risk">
    Lượt cài đặt ClawHub cộng đồng kiểm tra bản ghi tin cậy của release đã chọn trước khi tải package xuống. Nếu ClawHub tắt tải xuống cho release, báo cáo phát hiện quét độc hại hoặc đặt release vào trạng thái kiểm duyệt chặn như cách ly, OpenClaw từ chối release đó. Với trạng thái quét rủi ro không chặn, trạng thái kiểm duyệt rủi ro hoặc lý do registry, OpenClaw hiển thị chi tiết tin cậy và yêu cầu xác nhận trước khi tiếp tục.

    Chỉ dùng `--acknowledge-clawhub-risk` sau khi xem cảnh báo ClawHub và quyết định tiếp tục mà không có prompt tương tác. Bản ghi tin cậy sạch đang chờ hoặc đã cũ sẽ cảnh báo nhưng không yêu cầu xác nhận. Package ClawHub chính thức và nguồn Plugin OpenClaw đi kèm bỏ qua prompt tin cậy release này.

  </Accordion>
  <Accordion title="Gói hook và spec npm">
    `plugins install` cũng là bề mặt cài đặt cho các gói hook phơi bày `openclaw.hooks` trong `package.json`. Dùng `openclaw hooks` để xem hook có lọc và bật từng hook, không dùng để cài package.

    Spec npm là **chỉ registry** (tên package + **phiên bản chính xác** hoặc **dist-tag** tùy chọn). Spec Git/URL/file và khoảng semver bị từ chối. Cài đặt dependency chạy trong một dự án npm được quản lý cho mỗi Plugin với `--ignore-scripts` vì an toàn, ngay cả khi shell của bạn có thiết lập cài đặt npm toàn cục. Các dự án npm Plugin được quản lý kế thừa `overrides` npm cấp package của OpenClaw, vì vậy các ghim bảo mật của host cũng áp dụng cho dependency Plugin được hoist.

    Dùng `npm:<package>` khi bạn muốn làm rõ việc phân giải npm. Spec package trần cũng cài trực tiếp từ npm trong giai đoạn chuyển đổi ra mắt trừ khi chúng khớp với id Plugin chính thức.

    Các đặc tả gói `@openclaw/*` thô khớp với plugin đi kèm sẽ phân giải sang bản sao đi kèm thuộc image trước khi fallback sang npm. Ví dụ, `openclaw plugins install @openclaw/discord@2026.5.20 --pin` dùng plugin Discord đi kèm từ bản dựng OpenClaw hiện tại thay vì tạo một ghi đè npm được quản lý. Để buộc dùng gói npm bên ngoài, hãy dùng `openclaw plugins install npm:@openclaw/discord@2026.5.20 --pin`.

    Đặc tả trần và `@latest` vẫn ở nhánh ổn định. Các phiên bản sửa lỗi có đóng dấu ngày của OpenClaw như `2026.5.3-1` là bản phát hành ổn định cho bước kiểm tra này. Nếu npm phân giải một trong hai loại đó thành bản phát hành trước, OpenClaw sẽ dừng và yêu cầu bạn chọn rõ bằng một thẻ phát hành trước như `@beta`/`@rc` hoặc một phiên bản phát hành trước chính xác như `@1.2.3-beta.4`.

    Với các lượt cài đặt npm không có phiên bản chính xác (`npm:<package>` hoặc `npm:<package>@latest`), OpenClaw kiểm tra siêu dữ liệu gói đã phân giải trước khi cài đặt. Nếu gói ổn định mới nhất yêu cầu API plugin OpenClaw mới hơn hoặc phiên bản host tối thiểu mới hơn, OpenClaw kiểm tra các phiên bản ổn định cũ hơn và cài đặt bản phát hành tương thích mới nhất thay thế. Phiên bản chính xác và các dist-tag rõ ràng như `@beta` vẫn nghiêm ngặt: nếu gói đã chọn không tương thích, lệnh sẽ thất bại và yêu cầu bạn nâng cấp OpenClaw hoặc chọn một phiên bản tương thích.

    Nếu một đặc tả cài đặt trần khớp với id plugin chính thức (ví dụ `diffs`), OpenClaw cài đặt trực tiếp mục catalog. Để cài đặt một gói npm có cùng tên, hãy dùng một đặc tả có phạm vi rõ ràng (ví dụ `@scope/diffs`).

  </Accordion>
  <Accordion title="Kho Git">
    Dùng `git:<repo>` để cài đặt trực tiếp từ một kho git. Các dạng được hỗ trợ bao gồm URL clone `git:github.com/owner/repo`, `git:owner/repo`, `https://` đầy đủ, `ssh://`, `git://`, `file://`, và `git@host:owner/repo.git`. Thêm `@<ref>` hoặc `#<ref>` để checkout một nhánh, thẻ hoặc commit trước khi cài đặt.

    Cài đặt Git clone vào một thư mục tạm, checkout ref được yêu cầu khi có, rồi dùng trình cài đặt thư mục plugin thông thường. Điều đó nghĩa là xác thực manifest, chính sách cài đặt của operator, công việc cài đặt bằng trình quản lý gói, và bản ghi cài đặt hoạt động giống như cài đặt npm. Các lượt cài đặt git được ghi lại bao gồm URL/ref nguồn cùng commit đã phân giải để `openclaw plugins update` có thể phân giải lại nguồn về sau.

    Sau khi cài đặt từ git, dùng `openclaw plugins inspect <id> --runtime --json` để xác minh các đăng ký runtime như phương thức gateway và lệnh CLI. Nếu plugin đã đăng ký một CLI root bằng `api.registerCli`, hãy thực thi lệnh đó trực tiếp qua CLI root của OpenClaw, ví dụ `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Kho lưu trữ">
    Kho lưu trữ được hỗ trợ: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Kho lưu trữ plugin OpenClaw native phải chứa một `openclaw.plugin.json` hợp lệ tại root plugin đã giải nén; các kho lưu trữ chỉ chứa `package.json` bị từ chối trước khi OpenClaw ghi bản ghi cài đặt.

    Dùng `npm-pack:<path.tgz>` khi tệp là tarball npm-pack và bạn muốn
    kiểm thử cùng đường dẫn dự án npm được quản lý theo từng plugin mà các lượt
    cài đặt từ registry sử dụng, bao gồm xác minh `package-lock.json`, quét
    dependency đã hoist, và bản ghi cài đặt npm. Đường dẫn kho lưu trữ thuần vẫn
    cài đặt dưới dạng kho lưu trữ cục bộ trong root extensions của plugin.

    Cũng hỗ trợ cài đặt từ marketplace Claude.

  </Accordion>
</AccordionGroup>

Cài đặt ClawHub dùng locator `clawhub:<package>` rõ ràng:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Đặc tả plugin an toàn với npm dạng trần cài đặt từ npm theo mặc định trong giai đoạn chuyển đổi ra mắt, trừ khi chúng khớp với một id plugin chính thức:

```bash
openclaw plugins install openclaw-codex-app-server
```

Dùng `npm:` để làm rõ việc chỉ phân giải bằng npm:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@openclaw/discord@2026.5.20
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw kiểm tra API plugin được quảng bá / khả năng tương thích gateway tối thiểu trước khi cài đặt. Khi phiên bản ClawHub đã chọn xuất bản artifact ClawPack, OpenClaw tải xuống npm-pack `.tgz` có phiên bản, xác minh header digest ClawHub và digest artifact, rồi cài đặt nó qua đường dẫn kho lưu trữ thông thường. Các phiên bản ClawHub cũ hơn không có siêu dữ liệu ClawPack vẫn cài đặt qua đường dẫn xác minh kho lưu trữ gói legacy. Các lượt cài đặt được ghi lại giữ lại siêu dữ liệu nguồn ClawHub, loại artifact, tính toàn vẹn npm, shasum npm, tên tarball, và các dữ kiện digest ClawPack cho các lần cập nhật về sau.
Cài đặt ClawHub không có phiên bản giữ một đặc tả được ghi lại không có phiên bản để `openclaw plugins update` có thể theo dõi các bản phát hành ClawHub mới hơn; bộ chọn phiên bản hoặc thẻ rõ ràng như `clawhub:pkg@1.2.3` và `clawhub:pkg@beta` vẫn được ghim vào bộ chọn đó.

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
    - tên marketplace Claude đã biết từ `~/.claude/plugins/known_marketplaces.json`
    - root marketplace cục bộ hoặc đường dẫn `marketplace.json`
    - cú pháp rút gọn repo GitHub như `owner/repo`
    - URL repo GitHub như `https://github.com/owner/repo`
    - URL git

  </Tab>
  <Tab title="Quy tắc marketplace từ xa">
    Với marketplace từ xa được tải từ GitHub hoặc git, các mục plugin phải nằm bên trong repo marketplace đã clone. OpenClaw chấp nhận nguồn đường dẫn tương đối từ repo đó và từ chối HTTP(S), đường dẫn tuyệt đối, git, GitHub, và các nguồn plugin không phải đường dẫn khác từ manifest từ xa.
  </Tab>
</Tabs>

Với đường dẫn cục bộ và kho lưu trữ, OpenClaw tự động phát hiện:

- plugin OpenClaw native (`openclaw.plugin.json`)
- bundle tương thích với Codex (`.codex-plugin/plugin.json`)
- bundle tương thích với Claude (`.claude-plugin/plugin.json` hoặc bố cục thành phần Claude mặc định)
- bundle tương thích với Cursor (`.cursor-plugin/plugin.json`)

Cài đặt cục bộ được quản lý phải là thư mục plugin hoặc kho lưu trữ. Các tệp plugin
độc lập `.js`, `.mjs`, `.cjs`, và `.ts` không được sao chép vào root plugin được quản lý
bởi `plugins install`; thay vào đó hãy liệt kê chúng rõ ràng trong `plugins.load.paths`.

<Note>
Các bundle tương thích cài đặt vào root plugin thông thường và tham gia cùng luồng list/info/enable/disable. Hiện tại, bundle skills, command-skills của Claude, mặc định `settings.json` của Claude, mặc định `.lsp.json` của Claude / `lspServers` được khai báo trong manifest, command-skills của Cursor, và thư mục hook Codex tương thích được hỗ trợ; các khả năng bundle được phát hiện khác được hiển thị trong diagnostics/info nhưng chưa được nối vào thực thi runtime.
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
  Chỉ hiển thị plugin đã bật.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Chuyển từ chế độ xem bảng sang các dòng chi tiết theo từng plugin với siêu dữ liệu nguồn/xuất xứ/phiên bản/kích hoạt.
</ParamField>
<ParamField path="--json" type="boolean">
  Kho kiểm kê máy đọc được cùng diagnostics registry và trạng thái cài đặt dependency gói.
</ParamField>

<Note>
`plugins list` đọc registry plugin cục bộ đã lưu trước, với fallback chỉ dẫn xuất từ manifest khi registry bị thiếu hoặc không hợp lệ. Nó hữu ích để kiểm tra liệu một plugin đã được cài đặt, bật, và hiển thị cho lập kế hoạch khởi động lạnh hay chưa, nhưng nó không phải là phép dò runtime trực tiếp của một tiến trình Gateway đang chạy. Sau khi thay đổi mã plugin, trạng thái bật, chính sách hook, hoặc `plugins.load.paths`, hãy khởi động lại Gateway phục vụ channel trước khi mong đợi mã `register(api)` mới hoặc hook chạy. Với triển khai từ xa/container, hãy xác minh bạn đang khởi động lại đúng child `openclaw gateway run` thực tế, không chỉ một tiến trình wrapper.

`plugins list --json` bao gồm `dependencyStatus` của từng plugin từ `package.json`
`dependencies` và `optionalDependencies`. OpenClaw kiểm tra liệu các tên gói đó
có hiện diện dọc theo đường dẫn tra cứu Node `node_modules` thông thường của plugin hay không; nó
không import mã runtime plugin, chạy trình quản lý gói, hoặc sửa chữa
dependency bị thiếu.
</Note>

Nếu nhật ký khởi động ghi `plugins.allow is empty; discovered non-bundled plugins may auto-load: ...`,
hãy chạy `openclaw plugins list --enabled --verbose` hoặc
`openclaw plugins inspect <id>` với một id plugin được liệt kê để xác nhận
các id plugin và sao chép id đáng tin cậy vào `plugins.allow` trong `openclaw.json`. Khi
cảnh báo có thể liệt kê mọi plugin đã phát hiện, nó in ra một đoạn
`plugins.allow` sẵn sàng dán đã bao gồm các id đó. Nếu một plugin tải
mà không có nguồn gốc cài đặt/load-path, hãy inspect id plugin đó, rồi ghim
id đáng tin cậy trong `plugins.allow` hoặc cài đặt lại plugin từ một nguồn đáng tin cậy
để OpenClaw ghi lại nguồn gốc cài đặt.

`plugins search` là phép tra cứu catalog ClawHub từ xa. Nó không kiểm tra trạng thái
cục bộ, thay đổi cấu hình, cài đặt gói, hoặc tải mã runtime plugin. Kết quả
tìm kiếm bao gồm tên gói ClawHub, family, channel, phiên bản, tóm tắt, và
gợi ý cài đặt như `openclaw plugins install clawhub:<package>`.

Với công việc plugin đi kèm bên trong image Docker đã đóng gói, bind-mount thư mục
nguồn plugin lên đường dẫn nguồn đã đóng gói tương ứng, chẳng hạn
`/app/extensions/synology-chat`. OpenClaw sẽ phát hiện overlay nguồn đã mount đó
trước `/app/dist/extensions/synology-chat`; một thư mục nguồn chỉ được sao chép
vẫn không hoạt động để các lượt cài đặt đóng gói thông thường tiếp tục dùng dist đã biên dịch.

Để gỡ lỗi hook runtime:

- `openclaw plugins inspect <id> --runtime --json` hiển thị hook đã đăng ký và diagnostics từ một lượt inspection đã tải module. Inspection runtime không bao giờ cài đặt dependency; dùng `openclaw doctor --fix` để dọn trạng thái dependency legacy hoặc khôi phục plugin có thể tải xuống bị thiếu đang được cấu hình tham chiếu.
- `openclaw gateway status --deep --require-rpc` xác nhận URL/profile Gateway có thể truy cập, gợi ý service/process, đường dẫn cấu hình, và sức khỏe RPC.
- Hook hội thoại không đi kèm (`llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize`, `agent_end`) yêu cầu `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Dùng `--link` để tránh sao chép một thư mục plugin cục bộ (thêm vào `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

Tệp plugin độc lập phải được liệt kê trong `plugins.load.paths` thay vì
được cài đặt bằng `plugins install` hoặc đặt trực tiếp trong `~/.openclaw/extensions`
hoặc `<workspace>/.openclaw/extensions`. Các root tự động phát hiện đó tải thư mục
gói hoặc bundle plugin, còn tệp script cấp cao nhất được xem là helper
cục bộ và bị bỏ qua.

<Note>
Các Plugin có nguồn từ workspace được phát hiện từ gốc tiện ích mở rộng của workspace sẽ không được nhập hoặc thực thi cho đến khi chúng được bật rõ ràng. Để phát triển cục bộ, hãy chạy `openclaw plugins enable <plugin-id>` hoặc đặt `plugins.entries.<plugin-id>.enabled: true`; nếu cấu hình của bạn dùng `plugins.allow`, hãy đưa cùng id Plugin đó vào đó nữa. Quy tắc đóng theo mặc định này cũng áp dụng khi thiết lập kênh nhắm rõ ràng đến một Plugin có nguồn từ workspace để chỉ tải phục vụ thiết lập, vì vậy mã thiết lập Plugin kênh cục bộ sẽ không chạy khi Plugin workspace đó vẫn bị tắt hoặc bị loại khỏi danh sách cho phép. Các bản cài đặt được liên kết và các mục `plugins.load.paths` rõ ràng tuân theo chính sách bình thường cho nguồn Plugin đã được phân giải của chúng. Xem [Cấu hình chính sách Plugin](/vi/tools/plugin#configure-plugin-policy) và [Tham chiếu cấu hình](/vi/gateway/configuration-reference#plugins).

`--force` không được hỗ trợ cùng với `--link` vì các bản cài đặt được liên kết tái sử dụng đường dẫn nguồn thay vì sao chép đè lên mục tiêu cài đặt được quản lý.

Dùng `--pin` trên các bản cài đặt npm để lưu spec chính xác đã phân giải (`name@version`) trong chỉ mục Plugin được quản lý, đồng thời giữ hành vi mặc định là không ghim.
</Note>

### Chỉ mục Plugin

Siêu dữ liệu cài đặt Plugin là trạng thái do máy quản lý, không phải cấu hình người dùng. Các lần cài đặt và cập nhật ghi nó vào cơ sở dữ liệu trạng thái SQLite dùng chung trong thư mục trạng thái OpenClaw đang hoạt động. Hàng `installed_plugin_index` lưu siêu dữ liệu `installRecords` bền vững, bao gồm các bản ghi cho manifest Plugin bị hỏng hoặc bị thiếu, cùng một bộ nhớ đệm sổ đăng ký lạnh có nguồn gốc từ manifest, được dùng bởi `openclaw plugins update`, gỡ cài đặt, chẩn đoán và sổ đăng ký Plugin lạnh.

Khi OpenClaw thấy các bản ghi `plugins.installs` cũ đã phát hành trong cấu hình, các lần đọc runtime coi chúng là đầu vào tương thích mà không ghi lại `openclaw.json`. Các lần ghi Plugin rõ ràng và `openclaw doctor --fix` di chuyển những bản ghi đó vào chỉ mục Plugin và xóa khóa cấu hình khi được phép ghi cấu hình; nếu một trong hai lần ghi thất bại, các bản ghi cấu hình sẽ được giữ lại để siêu dữ liệu cài đặt không bị mất.

### Gỡ cài đặt

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` xóa các bản ghi Plugin khỏi `plugins.entries`, chỉ mục Plugin được duy trì, các mục trong danh sách cho phép/từ chối Plugin, và các mục `plugins.load.paths` được liên kết khi áp dụng. Trừ khi đặt `--keep-files`, thao tác gỡ cài đặt cũng xóa thư mục cài đặt được quản lý đang được theo dõi khi nó nằm trong gốc tiện ích mở rộng Plugin của OpenClaw. Đối với Plugin Active Memory, ô bộ nhớ đặt lại thành `memory-core`.

<Note>
`--keep-config` được hỗ trợ như một bí danh đã ngừng khuyến nghị cho `--keep-files`.
</Note>

### Cập nhật

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call
openclaw plugins update openclaw-codex-app-server --acknowledge-clawhub-risk
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

Các bản cập nhật áp dụng cho các bản cài đặt Plugin được theo dõi trong chỉ mục Plugin được quản lý và các bản cài đặt hook-pack được theo dõi trong `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="Phân giải id Plugin so với spec npm">
    Khi bạn truyền một id Plugin, OpenClaw tái sử dụng spec cài đặt đã ghi cho Plugin đó. Điều này có nghĩa là các dist-tag đã lưu trước đó như `@beta` và các phiên bản đã ghim chính xác tiếp tục được dùng trong các lần chạy `update <id>` sau này.

    Quy tắc cập nhật có mục tiêu đó khác với đường dẫn bảo trì hàng loạt `openclaw plugins update --all`. Cập nhật hàng loạt vẫn tôn trọng các spec cài đặt được theo dõi thông thường, nhưng các bản ghi Plugin OpenClaw chính thức đáng tin cậy có thể đồng bộ sang mục tiêu danh mục chính thức hiện tại thay vì giữ nguyên một gói chính thức chính xác đã cũ. Dùng `update <id>` có mục tiêu khi bạn cố ý muốn giữ nguyên một spec chính thức chính xác hoặc có gắn thẻ.

    Đối với cài đặt npm, bạn cũng có thể truyền một spec gói npm rõ ràng với dist-tag hoặc phiên bản chính xác. OpenClaw phân giải tên gói đó trở lại bản ghi Plugin được theo dõi, cập nhật Plugin đã cài đặt đó, và ghi lại spec npm mới cho các lần cập nhật dựa trên id trong tương lai.

    Truyền tên gói npm không kèm phiên bản hoặc thẻ cũng phân giải trở lại bản ghi Plugin được theo dõi. Dùng cách này khi một Plugin đã được ghim vào một phiên bản chính xác và bạn muốn chuyển nó trở lại dòng phát hành mặc định của sổ đăng ký.

  </Accordion>
  <Accordion title="Cập nhật kênh beta">
    `openclaw plugins update <id-or-npm-spec>` có mục tiêu tái sử dụng spec Plugin được theo dõi trừ khi bạn truyền một spec mới. `openclaw plugins update --all` hàng loạt dùng `update.channel` đã cấu hình khi đồng bộ các bản ghi Plugin chính thức đáng tin cậy sang mục tiêu danh mục chính thức, vì vậy các bản cài đặt kênh beta có thể ở lại dòng phát hành beta thay vì bị chuẩn hóa ngầm sang stable/latest.

    `openclaw update` cũng biết kênh cập nhật OpenClaw đang hoạt động: trên kênh beta, các bản ghi Plugin npm và ClawHub thuộc dòng mặc định sẽ thử `@beta` trước. Chúng quay về spec default/latest đã ghi nếu không có bản phát hành beta của Plugin; Plugin npm cũng quay về khi gói beta tồn tại nhưng thất bại xác thực cài đặt. Việc quay về đó được báo cáo dưới dạng cảnh báo và không làm thất bại bản cập nhật lõi. Các phiên bản chính xác và thẻ rõ ràng vẫn được ghim vào bộ chọn đó cho các bản cập nhật có mục tiêu.

  </Accordion>
  <Accordion title="Kiểm tra phiên bản và sai lệch tính toàn vẹn">
    Trước khi cập nhật npm trực tiếp, OpenClaw kiểm tra phiên bản gói đã cài đặt so với siêu dữ liệu sổ đăng ký npm. Nếu phiên bản đã cài đặt và định danh artifact đã ghi đã khớp với mục tiêu đã phân giải, bản cập nhật sẽ được bỏ qua mà không tải xuống, cài đặt lại, hoặc ghi lại `openclaw.json`.

    Khi có hash toàn vẹn đã lưu và hash artifact đã lấy thay đổi, OpenClaw coi đó là sai lệch artifact npm. Lệnh tương tác `openclaw plugins update` in hash kỳ vọng và thực tế rồi yêu cầu xác nhận trước khi tiếp tục. Các helper cập nhật không tương tác sẽ đóng theo mặc định trừ khi caller cung cấp một chính sách tiếp tục rõ ràng.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install khi cập nhật">
    `--dangerously-force-unsafe-install` cũng được chấp nhận trên `plugins update` để tương thích, nhưng đã ngừng khuyến nghị và không còn thay đổi hành vi cập nhật Plugin. `security.installPolicy` của operator vẫn có thể chặn cập nhật; hook `before_install` của Plugin chỉ áp dụng trong các tiến trình có tải hook Plugin.
  </Accordion>
  <Accordion title="--acknowledge-clawhub-risk khi cập nhật">
    Các bản cập nhật Plugin cộng đồng dựa trên ClawHub chạy cùng kiểm tra tin cậy bản phát hành chính xác như khi cài đặt trước khi tải xuống gói thay thế. Dùng `--acknowledge-clawhub-risk` cho tự động hóa đã được rà soát cần tiếp tục khi bản phát hành ClawHub đã chọn có cảnh báo tin cậy rủi ro. Các gói ClawHub chính thức và nguồn Plugin OpenClaw được đóng gói bỏ qua lời nhắc tin cậy bản phát hành này.
  </Accordion>
</AccordionGroup>

### Kiểm tra

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect hiển thị định danh, trạng thái tải, nguồn, capability manifest, cờ chính sách, chẩn đoán, siêu dữ liệu cài đặt, capability bundle, và mọi hỗ trợ máy chủ MCP hoặc LSP được phát hiện mà mặc định không nhập runtime Plugin. Đầu ra JSON bao gồm các hợp đồng manifest Plugin, chẳng hạn `contracts.agentToolResultMiddleware` và `contracts.trustedToolPolicies`, để operator có thể kiểm toán các khai báo bề mặt đáng tin cậy trước khi bật hoặc khởi động lại một Plugin. Thêm `--runtime` để tải mô-đun Plugin và bao gồm các hook, tool, lệnh, dịch vụ, phương thức Gateway, và route HTTP đã đăng ký. Kiểm tra runtime báo cáo trực tiếp các dependency Plugin bị thiếu; cài đặt và sửa chữa nằm trong `openclaw plugins install`, `openclaw plugins update`, và `openclaw doctor --fix`.

Các lệnh CLI do Plugin sở hữu thường được cài đặt dưới dạng nhóm lệnh `openclaw` gốc, nhưng Plugin cũng có thể đăng ký các lệnh lồng nhau dưới một cha lõi như `openclaw nodes`. Sau khi `inspect --runtime` hiển thị một lệnh dưới `cliCommands`, hãy chạy lệnh đó tại đường dẫn đã liệt kê; ví dụ, một Plugin đăng ký `demo-git` có thể được xác minh bằng `openclaw demo-git ping`.

Mỗi Plugin được phân loại theo những gì nó thực sự đăng ký tại runtime:

- **plain-capability** — một loại capability (ví dụ: Plugin chỉ dành cho provider)
- **hybrid-capability** — nhiều loại capability (ví dụ: văn bản + giọng nói + hình ảnh)
- **hook-only** — chỉ có hook, không có capability hoặc bề mặt
- **non-capability** — tool/lệnh/dịch vụ nhưng không có capability

Xem [Hình dạng Plugin](/vi/plugins/architecture#plugin-shapes) để biết thêm về mô hình capability.

<Note>
Cờ `--json` xuất một báo cáo máy đọc được, phù hợp cho scripting và kiểm toán. `inspect --all` hiển thị một bảng toàn đội với các cột hình dạng, loại capability, thông báo tương thích, capability bundle, và tóm tắt hook. `info` là bí danh của `inspect`.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` báo cáo lỗi tải Plugin, chẩn đoán manifest/phát hiện, thông báo tương thích, và tham chiếu cấu hình Plugin đã cũ như ô Plugin bị thiếu. Khi cây cài đặt và cấu hình Plugin sạch, nó in `No plugin issues detected.` Nếu cấu hình cũ vẫn còn nhưng cây cài đặt còn lại khỏe mạnh, phần tóm tắt sẽ nói như vậy thay vì ngụ ý sức khỏe Plugin đầy đủ.

Nếu một Plugin đã cấu hình có trên đĩa nhưng bị chặn bởi các kiểm tra an toàn đường dẫn của loader, xác thực cấu hình giữ mục Plugin và báo cáo là `present but blocked`. Hãy sửa chẩn đoán Plugin bị chặn trước đó, chẳng hạn quyền sở hữu đường dẫn hoặc quyền world-writable, thay vì xóa cấu hình `plugins.entries.<id>` hoặc `plugins.allow`.

Đối với các lỗi hình dạng mô-đun như thiếu export `register`/`activate`, hãy chạy lại với `OPENCLAW_PLUGIN_LOAD_DEBUG=1` để bao gồm tóm tắt hình dạng export gọn trong đầu ra chẩn đoán.

### Sổ đăng ký

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Sổ đăng ký Plugin cục bộ là mô hình đọc lạnh được duy trì của OpenClaw cho định danh Plugin đã cài đặt, trạng thái bật, siêu dữ liệu nguồn, và quyền sở hữu đóng góp. Khởi động bình thường, tra cứu chủ sở hữu provider, phân loại thiết lập kênh, và kiểm kê Plugin có thể đọc nó mà không nhập mô-đun runtime Plugin.

Dùng `plugins registry` để kiểm tra sổ đăng ký đã duy trì có tồn tại, hiện hành, hay đã cũ. Dùng `--refresh` để dựng lại nó từ chỉ mục Plugin đã duy trì, chính sách cấu hình, và siêu dữ liệu manifest/gói. Đây là đường dẫn sửa chữa, không phải đường dẫn kích hoạt runtime.

`openclaw doctor --fix` cũng sửa sai lệch npm được quản lý liền kề sổ đăng ký: nếu một gói `@openclaw/*` mồ côi hoặc được khôi phục dưới một dự án npm Plugin được quản lý hoặc gốc npm phẳng được quản lý cũ che khuất một Plugin được đóng gói, doctor sẽ xóa gói cũ đó và dựng lại sổ đăng ký để khởi động xác thực theo manifest được đóng gói. Doctor cũng liên kết lại gói máy chủ `openclaw` vào các Plugin npm được quản lý khai báo `peerDependencies.openclaw`, để các import runtime cục bộ theo gói như `openclaw/plugin-sdk/*` phân giải sau cập nhật hoặc sửa chữa npm.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` là một công tắc tương thích khẩn cấp đã ngừng khuyến nghị cho lỗi đọc sổ đăng ký. Ưu tiên `plugins registry --refresh` hoặc `openclaw doctor --fix`; fallback env chỉ dành cho khôi phục khởi động khẩn cấp trong khi migration được triển khai.
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Danh sách Marketplace chấp nhận một đường dẫn marketplace cục bộ, một đường dẫn `marketplace.json`, dạng viết tắt GitHub như `owner/repo`, URL repo GitHub, hoặc URL git. `--json` in nhãn nguồn đã phân giải cùng manifest marketplace và các mục Plugin đã phân tích.

## Liên quan

- [Xây dựng Plugin](/vi/plugins/building-plugins)
- [Tham chiếu CLI](/vi/cli)
- [ClawHub](/vi/clawhub)
