---
read_when:
    - Bạn muốn cài đặt hoặc quản lý các Plugin Gateway hoặc các gói tương thích
    - Bạn muốn tạo khung hoặc xác thực một Plugin công cụ đơn giản
    - Bạn muốn gỡ lỗi lỗi tải Plugin
sidebarTitle: Plugins
summary: Tài liệu tham chiếu CLI cho `openclaw plugins` (init, build, validate, list, install, marketplace, uninstall, enable/disable, doctor)
title: Plugin
x-i18n:
    generated_at: "2026-06-28T22:33:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 528a7ead224eab330bc0a83314d205a68c7f814ad336441aee7b19170c105e43
    source_path: cli/plugins.md
    workflow: 16
---

Quản lý Plugin Gateway, gói hook và các bundle tương thích.

<CardGroup cols={2}>
  <Card title="Plugin system" href="/vi/tools/plugin">
    Hướng dẫn cho người dùng cuối về cài đặt, bật và khắc phục sự cố Plugin.
  </Card>
  <Card title="Manage plugins" href="/vi/plugins/manage-plugins">
    Ví dụ nhanh cho cài đặt, liệt kê, cập nhật, gỡ cài đặt và phát hành.
  </Card>
  <Card title="Plugin bundles" href="/vi/plugins/bundles">
    Mô hình tương thích của bundle.
  </Card>
  <Card title="Plugin manifest" href="/vi/plugins/manifest">
    Các trường manifest và schema cấu hình.
  </Card>
  <Card title="Security" href="/vi/gateway/security">
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
openclaw plugins marketplace entries
openclaw plugins marketplace entries --offline
openclaw plugins marketplace entries --json
openclaw plugins marketplace list <marketplace>
openclaw plugins marketplace list <marketplace> --json
openclaw plugins marketplace refresh
openclaw plugins marketplace refresh --feed-profile clawhub-public --json
openclaw plugins marketplace refresh --feed-url https://clawhub.ai/v1/feeds/plugins --expected-sha256 <sha256>
openclaw plugins init my-tool --name "My Tool"
openclaw plugins init my-provider --name "My Provider" --type provider
openclaw plugins init my-provider --name "My Provider" --type provider --directory ./my-provider
openclaw plugins build --entry ./dist/index.js
openclaw plugins build --entry ./dist/index.js --check
openclaw plugins validate --entry ./dist/index.js
```

Để điều tra cài đặt, kiểm tra, gỡ cài đặt hoặc làm mới registry bị chậm, hãy chạy
lệnh với `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`. Trace ghi thời gian từng pha
vào stderr và giữ cho đầu ra JSON vẫn có thể phân tích được. Xem [Gỡ lỗi](/vi/help/debugging#plugin-lifecycle-trace).

<Note>
Ở chế độ Nix (`OPENCLAW_NIX_MODE=1`), các thao tác thay đổi vòng đời Plugin bị tắt. Thay vào đó, hãy dùng nguồn Nix cho lần cài đặt này thay vì `plugins install`, `plugins update`, `plugins uninstall`, `plugins enable` hoặc `plugins disable`; với nix-openclaw, hãy dùng [Bắt đầu nhanh](https://github.com/openclaw/nix-openclaw#quick-start) theo hướng agent trước.
</Note>

<Note>
Plugin đi kèm được phân phối cùng OpenClaw. Một số được bật theo mặc định (ví dụ provider mô hình đi kèm, provider giọng nói đi kèm và Plugin trình duyệt đi kèm); các Plugin khác yêu cầu `plugins enable`.

Plugin OpenClaw gốc phải phân phối `openclaw.plugin.json` với JSON Schema nội tuyến (`configSchema`, kể cả khi rỗng). Các bundle tương thích dùng manifest bundle riêng của chúng.

`plugins list` hiển thị `Format: openclaw` hoặc `Format: bundle`. Đầu ra list/info chi tiết cũng hiển thị subtype của bundle (`codex`, `claude` hoặc `cursor`) cùng các capability bundle đã phát hiện.
</Note>

### Tác giả

```bash
openclaw plugins init stock-quotes --name "Stock Quotes"
cd stock-quotes
npm run plugin:build
npm run plugin:validate
```

Theo mặc định, `plugins init` tạo một Plugin công cụ TypeScript tối thiểu. Đối số đầu tiên
là id Plugin; truyền `--name` cho tên hiển thị. OpenClaw dùng
id cho thư mục đầu ra mặc định và cách đặt tên package. Khung công cụ dùng
`defineToolPlugin`.
`plugins build` import entry đã build, đọc metadata công cụ tĩnh, ghi
`openclaw.plugin.json`, và giữ cho `package.json` `openclaw.extensions` đồng bộ.
`plugins validate` kiểm tra manifest đã tạo, metadata package và
export entry hiện tại vẫn khớp nhau. Xem [Plugin công cụ](/vi/plugins/tool-plugins) để biết
toàn bộ quy trình biên soạn công cụ.

Khung mẫu ghi mã nguồn TypeScript nhưng tạo metadata từ entry
`./dist/index.js` đã build, nên quy trình này cũng hoạt động với CLI đã phát hành. Dùng
`--entry <path>` khi entry không phải entry package mặc định. Dùng
`plugins build --check` trong CI để thất bại khi metadata đã tạo bị cũ mà không
ghi lại tệp.

### Khung mẫu Provider

```bash
openclaw plugins init acme-models --name "Acme Models" --type provider
cd acme-models
npm install
npm run build
npm test
npm run validate
```

Khung mẫu provider tạo một Plugin provider văn bản/mô hình chung với phần nối
API key tương thích OpenAI, một script `npm run validate` tích hợp sẵn cho `clawhub package
validate`, metadata package ClawHub và một workflow GitHub được kích hoạt thủ công
để phát hành đáng tin cậy trong tương lai qua GitHub Actions OIDC. Khung mẫu provider
không tạo Skills và không dùng `openclaw plugins build` hoặc
`openclaw plugins validate`; các lệnh đó dành cho đường dẫn metadata đã tạo của
khung công cụ.

Trước khi phát hành, hãy thay URL cơ sở API, catalog mô hình, tuyến docs,
văn bản thông tin xác thực và nội dung README giữ chỗ bằng chi tiết provider thật. Dùng
README đã tạo cho lần phát hành ClawHub đầu tiên và thiết lập nhà phát hành đáng tin cậy.

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

Maintainer kiểm thử cài đặt ở thời điểm thiết lập có thể ghi đè nguồn cài đặt Plugin tự động
bằng các biến môi trường được bảo vệ. Xem
[Ghi đè cài đặt Plugin](/vi/plugins/install-overrides).

<Warning>
Tên package trần sẽ cài đặt từ npm theo mặc định trong giai đoạn chuyển đổi ra mắt, trừ khi chúng khớp với id Plugin chính thức. Spec package `@openclaw/*` thô khớp với Plugin đi kèm sẽ dùng bản đi kèm đã được phân phối cùng bản build OpenClaw hiện tại. Dùng `npm:<package>` khi bạn chủ ý muốn một package npm bên ngoài. Dùng `clawhub:<package>` cho ClawHub. Hãy xem cài đặt Plugin như chạy mã. Ưu tiên phiên bản đã ghim.
</Warning>

`plugins search` truy vấn ClawHub để tìm các package Plugin có thể cài đặt và in ra
tên package sẵn sàng cài đặt. Lệnh này tìm các package code-plugin và bundle-plugin,
không phải Skills. Dùng `openclaw skills search` cho Skills trên ClawHub.

<Note>
ClawHub là bề mặt phân phối và khám phá chính cho hầu hết Plugin. Npm
vẫn là đường dự phòng được hỗ trợ và đường cài đặt trực tiếp. Các package Plugin
`@openclaw/*` do OpenClaw sở hữu đã được phát hành lại trên npm; xem danh sách hiện tại
trên [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) hoặc
[kho Plugin](/vi/plugins/plugin-inventory). Cài đặt ổn định dùng `latest`.
Cài đặt và cập nhật kênh beta ưu tiên dist-tag npm `beta` khi tag đó
có sẵn, rồi fallback về `latest`.
</Note>

<AccordionGroup>
  <Accordion title="Config includes and invalid-config repair">
    Nếu phần `plugins` của bạn được hỗ trợ bởi `$include` một tệp duy nhất, `plugins install/update/enable/disable/uninstall` sẽ ghi xuyên qua tệp được include đó và giữ nguyên `openclaw.json`. Include gốc, mảng include và include có ghi đè cùng cấp sẽ thất bại đóng thay vì làm phẳng. Xem [Include cấu hình](/vi/gateway/configuration) để biết các hình dạng được hỗ trợ.

    Nếu cấu hình không hợp lệ trong khi cài đặt, `plugins install` thường thất bại đóng và yêu cầu bạn chạy `openclaw doctor --fix` trước. Trong lúc Gateway khởi động và hot reload, cấu hình Plugin không hợp lệ thất bại đóng như mọi cấu hình không hợp lệ khác; `openclaw doctor --fix` có thể cách ly mục Plugin không hợp lệ. Ngoại lệ duy nhất được ghi tài liệu tại thời điểm cài đặt là một đường khôi phục hẹp cho Plugin đi kèm đối với các Plugin chọn tham gia rõ ràng vào `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force and reinstall vs update">
    `--force` tái sử dụng đích cài đặt hiện có và ghi đè một Plugin hoặc gói hook đã cài đặt ngay tại chỗ. Dùng tùy chọn này khi bạn chủ ý cài đặt lại cùng id từ một đường dẫn cục bộ, archive, package ClawHub hoặc artifact npm mới. Với các nâng cấp thường kỳ của một Plugin npm đã được theo dõi, ưu tiên `openclaw plugins update <id-or-npm-spec>`.

    Nếu bạn chạy `plugins install` cho một id Plugin đã được cài đặt, OpenClaw sẽ dừng và chỉ bạn đến `plugins update <id-or-npm-spec>` để nâng cấp thông thường, hoặc đến `plugins install <package> --force` khi bạn thực sự muốn ghi đè cài đặt hiện tại từ một nguồn khác.

  </Accordion>
  <Accordion title="--pin scope">
    `--pin` chỉ áp dụng cho cài đặt npm. Tùy chọn này không được hỗ trợ với cài đặt `git:`; hãy dùng một git ref rõ ràng như `git:github.com/acme/plugin@v1.2.3` khi bạn muốn nguồn đã ghim. Tùy chọn này không được hỗ trợ với `--marketplace`, vì cài đặt marketplace lưu metadata nguồn marketplace thay vì spec npm.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` đã bị ngừng khuyến nghị và hiện không còn tác dụng. OpenClaw không còn chạy cơ chế chặn mã nguy hiểm tích hợp tại thời điểm cài đặt cho cài đặt Plugin.

    Dùng bề mặt `security.installPolicy` chung do operator sở hữu khi cần chính sách cài đặt theo host. Hook `before_install` của Plugin là hook vòng đời runtime của Plugin và không phải ranh giới chính sách chính cho cài đặt CLI.

    Nếu một Plugin bạn đã phát hành trên ClawHub bị ẩn hoặc bị chặn bởi một lần quét registry, hãy dùng các bước dành cho nhà phát hành trong [Phát hành ClawHub](/vi/clawhub/publishing). `--dangerously-force-unsafe-install` không yêu cầu ClawHub quét lại Plugin hoặc công khai một release bị chặn.

  </Accordion>
  <Accordion title="--acknowledge-clawhub-risk">
    Cài đặt từ ClawHub cộng đồng kiểm tra bản ghi độ tin cậy của release đã chọn trước khi tải package xuống. Nếu ClawHub tắt tải xuống cho release, báo cáo phát hiện quét độc hại hoặc đặt release vào trạng thái kiểm duyệt chặn như cách ly, OpenClaw sẽ từ chối release đó. Với trạng thái quét rủi ro không chặn, trạng thái kiểm duyệt rủi ro hoặc lý do registry, OpenClaw hiển thị chi tiết độ tin cậy và yêu cầu xác nhận trước khi tiếp tục.

    Chỉ dùng `--acknowledge-clawhub-risk` sau khi xem cảnh báo ClawHub và quyết định tiếp tục mà không cần prompt tương tác. Bản ghi độ tin cậy sạch đang chờ xử lý hoặc đã cũ sẽ cảnh báo nhưng không yêu cầu xác nhận. Các package ClawHub chính thức và nguồn Plugin OpenClaw đi kèm bỏ qua prompt độ tin cậy release này.

  </Accordion>
  <Accordion title="Hook packs and npm specs">
    `plugins install` cũng là bề mặt cài đặt cho các gói hook expose `openclaw.hooks` trong `package.json`. Dùng `openclaw hooks` để xem hook đã lọc và bật từng hook, không phải để cài đặt package.

    Thông số npm **chỉ từ registry** (tên gói + **phiên bản chính xác** hoặc **dist-tag** tùy chọn). Thông số Git/URL/file và dải phiên bản semver bị từ chối. Việc cài đặt dependency chạy trong một dự án npm được quản lý cho mỗi plugin với `--ignore-scripts` để đảm bảo an toàn, ngay cả khi shell của bạn có thiết lập cài đặt npm toàn cục. Các dự án npm plugin được quản lý kế thừa `overrides` npm ở cấp package của OpenClaw, nên các ghim bảo mật của host cũng áp dụng cho dependency plugin được hoist.

    Dùng `npm:<package>` khi bạn muốn làm rõ việc phân giải npm. Thông số gói trần cũng cài đặt trực tiếp từ npm trong giai đoạn chuyển đổi ra mắt, trừ khi chúng khớp với một id plugin chính thức.

    Các thông số package `@openclaw/*` thô khớp với plugin được đóng gói sẵn sẽ phân giải tới bản sao đóng gói sẵn thuộc image trước khi fallback sang npm. Ví dụ, `openclaw plugins install @openclaw/discord@2026.5.20 --pin` dùng plugin Discord được đóng gói sẵn từ bản dựng OpenClaw hiện tại thay vì tạo override npm được quản lý. Để buộc dùng package npm bên ngoài, hãy dùng `openclaw plugins install npm:@openclaw/discord@2026.5.20 --pin`.

    Thông số trần và `@latest` vẫn ở track ổn định. Các phiên bản sửa lỗi có dấu ngày của OpenClaw như `2026.5.3-1` là bản phát hành ổn định cho kiểm tra này. Nếu npm phân giải một trong hai loại đó thành prerelease, OpenClaw sẽ dừng và yêu cầu bạn chọn tham gia rõ ràng bằng một thẻ prerelease như `@beta`/`@rc` hoặc một phiên bản prerelease chính xác như `@1.2.3-beta.4`.

    Với các lượt cài đặt npm không có phiên bản chính xác (`npm:<package>` hoặc `npm:<package>@latest`), OpenClaw kiểm tra metadata package đã phân giải trước khi cài đặt. Nếu package ổn định mới nhất yêu cầu API plugin OpenClaw mới hơn hoặc phiên bản host tối thiểu mới hơn, OpenClaw sẽ kiểm tra các phiên bản ổn định cũ hơn và cài đặt bản phát hành tương thích mới nhất thay vào đó. Phiên bản chính xác và dist-tag rõ ràng như `@beta` vẫn nghiêm ngặt: nếu package đã chọn không tương thích, lệnh sẽ thất bại và yêu cầu bạn nâng cấp OpenClaw hoặc chọn một phiên bản tương thích.

    Nếu một thông số cài đặt trần khớp với id plugin chính thức (ví dụ `diffs`), OpenClaw cài đặt trực tiếp mục catalog. Để cài đặt một package npm có cùng tên, hãy dùng thông số có scope rõ ràng (ví dụ `@scope/diffs`).

  </Accordion>
  <Accordion title="Git repositories">
    Dùng `git:<repo>` để cài đặt trực tiếp từ một kho git. Các dạng được hỗ trợ bao gồm `git:github.com/owner/repo`, `git:owner/repo`, URL clone đầy đủ `https://`, `ssh://`, `git://`, `file://`, và `git@host:owner/repo.git`. Thêm `@<ref>` hoặc `#<ref>` để checkout một branch, tag, hoặc commit trước khi cài đặt.

    Các lượt cài đặt Git clone vào một thư mục tạm, checkout ref được yêu cầu khi có, rồi dùng trình cài đặt thư mục plugin thông thường. Điều đó nghĩa là xác thực manifest, chính sách cài đặt của operator, công việc cài đặt package manager, và bản ghi cài đặt hoạt động giống các lượt cài đặt npm. Các lượt cài đặt git được ghi lại bao gồm URL/ref nguồn cùng commit đã phân giải để `openclaw plugins update` có thể phân giải lại nguồn về sau.

    Sau khi cài đặt từ git, dùng `openclaw plugins inspect <id> --runtime --json` để xác minh các đăng ký runtime như phương thức gateway và lệnh CLI. Nếu plugin đã đăng ký một root CLI bằng `api.registerCli`, hãy thực thi lệnh đó trực tiếp qua CLI root của OpenClaw, ví dụ `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Archives">
    Archive được hỗ trợ: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Archive plugin OpenClaw gốc phải chứa `openclaw.plugin.json` hợp lệ tại root plugin sau khi giải nén; archive chỉ chứa `package.json` sẽ bị từ chối trước khi OpenClaw ghi bản ghi cài đặt.

    Dùng `npm-pack:<path.tgz>` khi file là tarball npm-pack và bạn muốn
    kiểm thử cùng đường dẫn dự án npm được quản lý theo từng plugin mà các lượt
    cài đặt registry dùng, bao gồm xác minh `package-lock.json`, quét dependency
    được hoist, và bản ghi cài đặt npm. Đường dẫn archive thường vẫn cài đặt
    như archive cục bộ dưới root extensions plugin.

    Các lượt cài đặt từ marketplace của Claude cũng được hỗ trợ.

  </Accordion>
</AccordionGroup>

Các lượt cài đặt ClawHub dùng locator `clawhub:<package>` rõ ràng:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Thông số plugin trần an toàn với npm cài đặt từ npm theo mặc định trong giai đoạn chuyển đổi ra mắt, trừ khi chúng khớp với một id plugin chính thức:

```bash
openclaw plugins install openclaw-codex-app-server
```

Dùng `npm:` để làm rõ phân giải chỉ qua npm:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@openclaw/discord@2026.5.20
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw kiểm tra API plugin / khả năng tương thích gateway tối thiểu được quảng bá trước khi cài đặt. Khi phiên bản ClawHub đã chọn phát hành artifact ClawPack, OpenClaw tải xuống npm-pack `.tgz` có phiên bản, xác minh header digest ClawHub và digest artifact, rồi cài đặt qua đường dẫn archive thông thường. Các phiên bản ClawHub cũ hơn không có metadata ClawPack vẫn cài đặt qua đường dẫn xác minh archive package legacy. Các lượt cài đặt được ghi lại giữ metadata nguồn ClawHub, loại artifact, integrity npm, shasum npm, tên tarball, và các dữ kiện digest ClawPack để cập nhật về sau.
Các lượt cài đặt ClawHub không có phiên bản giữ thông số đã ghi không có phiên bản để `openclaw plugins update` có thể theo các bản phát hành ClawHub mới hơn; bộ chọn phiên bản hoặc tag rõ ràng như `clawhub:pkg@1.2.3` và `clawhub:pkg@beta` vẫn được ghim vào bộ chọn đó.

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
  <Tab title="Marketplace sources">
    - tên marketplace đã biết của Claude từ `~/.claude/plugins/known_marketplaces.json`
    - root marketplace cục bộ hoặc đường dẫn `marketplace.json`
    - cú pháp rút gọn repo GitHub như `owner/repo`
    - URL repo GitHub như `https://github.com/owner/repo`
    - URL git

  </Tab>
  <Tab title="Remote marketplace rules">
    Với marketplace từ xa được tải từ GitHub hoặc git, các mục plugin phải nằm bên trong repo marketplace đã clone. OpenClaw chấp nhận nguồn đường dẫn tương đối từ repo đó và từ chối HTTP(S), đường dẫn tuyệt đối, git, GitHub, và các nguồn plugin không phải đường dẫn khác từ manifest từ xa.
  </Tab>
</Tabs>

Với đường dẫn cục bộ và archive, OpenClaw tự động phát hiện:

- plugin OpenClaw gốc (`openclaw.plugin.json`)
- bundle tương thích Codex (`.codex-plugin/plugin.json`)
- bundle tương thích Claude (`.claude-plugin/plugin.json` hoặc layout component Claude mặc định)
- bundle tương thích Cursor (`.cursor-plugin/plugin.json`)

Các lượt cài đặt cục bộ được quản lý phải là thư mục plugin hoặc archive. Các file plugin
`.js`, `.mjs`, `.cjs`, và `.ts` độc lập không được sao chép vào root plugin được quản lý
bởi `plugins install`; thay vào đó hãy liệt kê chúng rõ ràng trong `plugins.load.paths`.

<Note>
Các bundle tương thích cài đặt vào root plugin thông thường và tham gia cùng luồng list/info/enable/disable. Hiện tại, bundle skills, command-skills của Claude, mặc định `settings.json` của Claude, mặc định `.lsp.json` / `lspServers` do manifest khai báo của Claude, command-skills của Cursor, và thư mục hook Codex tương thích được hỗ trợ; các khả năng bundle được phát hiện khác được hiển thị trong diagnostics/info nhưng chưa được nối vào thực thi runtime.
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
  Chuyển từ chế độ xem bảng sang các dòng chi tiết theo từng plugin với metadata nguồn/xuất xứ/phiên bản/kích hoạt.
</ParamField>
<ParamField path="--json" type="boolean">
  Inventory đọc được bằng máy cùng diagnostics registry và trạng thái cài đặt dependency package.
</ParamField>

<Note>
`plugins list` đọc registry plugin cục bộ đã lưu trước, với fallback suy ra chỉ từ manifest khi registry thiếu hoặc không hợp lệ. Lệnh này hữu ích để kiểm tra plugin đã được cài đặt, đã bật, và hiển thị với kế hoạch khởi động lạnh hay chưa, nhưng không phải là probe runtime trực tiếp của một tiến trình Gateway đang chạy sẵn. Sau khi thay đổi mã plugin, trạng thái bật, chính sách hook, hoặc `plugins.load.paths`, hãy khởi động lại Gateway phục vụ channel trước khi kỳ vọng mã `register(api)` mới hoặc hook chạy. Với triển khai từ xa/container, hãy xác minh rằng bạn đang khởi động lại đúng child `openclaw gateway run` thực tế, không chỉ một tiến trình wrapper.

`plugins list --json` bao gồm `dependencyStatus` của từng plugin từ `package.json`
`dependencies` và `optionalDependencies`. OpenClaw kiểm tra liệu các tên package đó
có hiện diện dọc theo đường dẫn tra cứu `node_modules` Node thông thường của plugin hay không;
nó không import mã runtime plugin, chạy package manager, hoặc sửa dependency bị thiếu.
</Note>

Nếu log khởi động ghi `plugins.allow is empty; discovered non-bundled plugins may auto-load: ...`,
hãy chạy `openclaw plugins list --enabled --verbose` hoặc
`openclaw plugins inspect <id>` với một id plugin được liệt kê để xác nhận các id plugin
và sao chép các id đáng tin cậy vào `plugins.allow` trong `openclaw.json`. Khi cảnh báo
có thể liệt kê mọi plugin được phát hiện, nó in một đoạn `plugins.allow` sẵn sàng dán
đã bao gồm các id đó. Nếu một plugin tải mà không có provenance install/load-path,
hãy inspect id plugin đó, rồi ghim id đáng tin cậy trong `plugins.allow` hoặc cài đặt lại
plugin từ một nguồn đáng tin cậy để OpenClaw ghi provenance cài đặt.

`plugins search` là tra cứu catalog ClawHub từ xa. Nó không kiểm tra trạng thái cục bộ,
không thay đổi config, không cài đặt package, và không tải mã runtime plugin. Kết quả
tìm kiếm bao gồm tên package ClawHub, family, channel, phiên bản, tóm tắt, và
gợi ý cài đặt như `openclaw plugins install clawhub:<package>`.

Với công việc plugin được đóng gói sẵn bên trong image Docker đã đóng gói, hãy bind-mount
thư mục nguồn plugin đè lên đường dẫn nguồn đã đóng gói tương ứng, chẳng hạn
`/app/extensions/synology-chat`. OpenClaw sẽ phát hiện overlay nguồn đã mount đó
trước `/app/dist/extensions/synology-chat`; một thư mục nguồn được sao chép thường
vẫn không hoạt động nên các lượt cài đặt đã đóng gói thông thường vẫn dùng dist đã biên dịch.

Để debug hook runtime:

- `openclaw plugins inspect <id> --runtime --json` hiển thị hook đã đăng ký và diagnostics từ một lượt kiểm tra đã tải module. Kiểm tra runtime không bao giờ cài đặt dependency; dùng `openclaw doctor --fix` để dọn trạng thái dependency legacy hoặc khôi phục plugin có thể tải xuống bị thiếu đang được config tham chiếu.
- `openclaw gateway status --deep --require-rpc` xác nhận URL/profile Gateway có thể truy cập, gợi ý service/process, đường dẫn config, và sức khỏe RPC.
- Hook hội thoại không đóng gói sẵn (`llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize`, `agent_end`) yêu cầu `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Dùng `--link` để tránh sao chép thư mục plugin cục bộ (thêm vào `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

File plugin độc lập phải được liệt kê trong `plugins.load.paths` thay vì
được cài đặt bằng `plugins install` hoặc đặt trực tiếp trong `~/.openclaw/extensions`
hoặc `<workspace>/.openclaw/extensions`. Các root được tự động phát hiện đó tải thư mục
package hoặc bundle plugin, còn file script cấp cao nhất được xem là helper cục bộ
và bị bỏ qua.

<Note>
Các Plugin có nguồn từ workspace được phát hiện từ thư mục gốc extensions của workspace sẽ không được nhập hoặc thực thi cho đến khi chúng được bật rõ ràng. Để phát triển cục bộ, hãy chạy `openclaw plugins enable <plugin-id>` hoặc đặt `plugins.entries.<plugin-id>.enabled: true`; nếu cấu hình của bạn dùng `plugins.allow`, hãy thêm cùng id Plugin đó vào đó nữa. Quy tắc fail-closed này cũng áp dụng khi thiết lập kênh nhắm rõ ràng đến một Plugin có nguồn từ workspace để tải chỉ cho thiết lập, vì vậy mã thiết lập Plugin kênh cục bộ sẽ không chạy khi Plugin workspace đó vẫn bị tắt hoặc bị loại khỏi allowlist. Các bản cài đặt được liên kết và các mục `plugins.load.paths` rõ ràng tuân theo chính sách thông thường cho nguồn Plugin đã phân giải của chúng. Xem [Cấu hình chính sách Plugin](/vi/tools/plugin#configure-plugin-policy) và [Tham chiếu cấu hình](/vi/gateway/configuration-reference#plugins).

`--force` không được hỗ trợ với `--link` vì các bản cài đặt được liên kết dùng lại đường dẫn nguồn thay vì sao chép đè lên một đích cài đặt được quản lý.

Dùng `--pin` trên các bản cài đặt npm để lưu spec chính xác đã phân giải (`name@version`) trong chỉ mục Plugin được quản lý, đồng thời giữ hành vi mặc định là không pin.
</Note>

### Chỉ mục Plugin

Siêu dữ liệu cài đặt Plugin là trạng thái do máy quản lý, không phải cấu hình người dùng. Các lượt cài đặt và cập nhật ghi dữ liệu này vào cơ sở dữ liệu trạng thái SQLite dùng chung trong thư mục trạng thái OpenClaw đang hoạt động. Hàng `installed_plugin_index` lưu siêu dữ liệu `installRecords` bền vững, bao gồm bản ghi cho các manifest Plugin bị lỗi hoặc bị thiếu, cùng bộ nhớ đệm cold registry được suy ra từ manifest dùng bởi `openclaw plugins update`, gỡ cài đặt, chẩn đoán và cold plugin registry.

Khi OpenClaw thấy các bản ghi `plugins.installs` kế thừa đã phát hành trong cấu hình, các lượt đọc runtime xem chúng là đầu vào tương thích mà không ghi lại `openclaw.json`. Các lượt ghi Plugin rõ ràng và `openclaw doctor --fix` chuyển những bản ghi đó vào chỉ mục Plugin và xóa khóa cấu hình khi được phép ghi cấu hình; nếu một trong hai lượt ghi thất bại, các bản ghi cấu hình được giữ lại để siêu dữ liệu cài đặt không bị mất.

### Gỡ cài đặt

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` xóa các bản ghi Plugin khỏi `plugins.entries`, chỉ mục Plugin đã lưu, các mục danh sách cho phép/từ chối Plugin và các mục `plugins.load.paths` được liên kết khi áp dụng. Trừ khi đặt `--keep-files`, gỡ cài đặt cũng xóa thư mục cài đặt được quản lý đang được theo dõi khi thư mục đó nằm trong thư mục gốc extensions Plugin của OpenClaw. Với các Plugin active memory, slot bộ nhớ được đặt lại thành `memory-core`.

<Note>
`--keep-config` được hỗ trợ như một alias không còn khuyến nghị dùng cho `--keep-files`.
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

Các lượt cập nhật áp dụng cho các bản cài đặt Plugin được theo dõi trong chỉ mục Plugin được quản lý và các bản cài đặt hook-pack được theo dõi trong `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="Resolving plugin id vs npm spec">
    Khi bạn truyền một id Plugin, OpenClaw dùng lại spec cài đặt đã ghi cho Plugin đó. Điều này nghĩa là các dist-tag đã lưu trước đó như `@beta` và các phiên bản được pin chính xác tiếp tục được dùng trong các lần chạy `update <id>` sau này.

    Trong `update <id> --dry-run`, các bản cài đặt npm được pin chính xác vẫn được pin. Nếu OpenClaw cũng có thể phân giải dòng mặc định registry của gói và dòng mặc định đó mới hơn phiên bản được pin đã cài đặt, lượt chạy thử sẽ báo pin đó và in lệnh cập nhật gói `@latest` rõ ràng để theo dòng mặc định registry.

    Quy tắc cập nhật có nhắm đích đó khác với đường bảo trì hàng loạt `openclaw plugins update --all`. Cập nhật hàng loạt vẫn tôn trọng các spec cài đặt được theo dõi thông thường, nhưng các bản ghi Plugin OpenClaw chính thức đáng tin cậy có thể đồng bộ tới đích catalog chính thức hiện tại thay vì ở lại một gói chính thức chính xác đã cũ. Dùng `update <id>` có nhắm đích khi bạn cố ý muốn giữ nguyên một spec chính thức chính xác hoặc có tag.

    Với các bản cài đặt npm, bạn cũng có thể truyền một spec gói npm rõ ràng kèm dist-tag hoặc phiên bản chính xác. OpenClaw phân giải tên gói đó ngược về bản ghi Plugin được theo dõi, cập nhật Plugin đã cài đặt đó và ghi lại spec npm mới cho các lượt cập nhật dựa trên id trong tương lai.

    Truyền tên gói npm mà không có phiên bản hoặc tag cũng phân giải ngược về bản ghi Plugin được theo dõi. Dùng cách này khi một Plugin đã được pin vào một phiên bản chính xác và bạn muốn đưa nó trở lại dòng phát hành mặc định của registry.

  </Accordion>
  <Accordion title="Beta channel updates">
    `openclaw plugins update <id-or-npm-spec>` có nhắm đích dùng lại spec Plugin được theo dõi trừ khi bạn truyền một spec mới. `openclaw plugins update --all` hàng loạt dùng `update.channel` đã cấu hình khi đồng bộ các bản ghi Plugin chính thức đáng tin cậy tới đích catalog chính thức, vì vậy các bản cài đặt kênh beta có thể ở lại dòng phát hành beta thay vì bị âm thầm chuẩn hóa về stable/latest.

    `openclaw update` cũng biết kênh cập nhật OpenClaw đang hoạt động: trên kênh beta, các bản ghi Plugin npm và ClawHub dòng mặc định thử `@beta` trước. Chúng fallback về spec default/latest đã ghi nếu không có bản phát hành beta của Plugin; các Plugin npm cũng fallback khi gói beta tồn tại nhưng không vượt qua xác thực cài đặt. Fallback đó được báo dưới dạng cảnh báo và không làm thất bại cập nhật lõi. Các phiên bản chính xác và tag rõ ràng vẫn được pin vào selector đó cho các lượt cập nhật có nhắm đích.

  </Accordion>
  <Accordion title="Version checks and integrity drift">
    Trước một lượt cập nhật npm trực tiếp, OpenClaw kiểm tra phiên bản gói đã cài đặt so với siêu dữ liệu npm registry. Nếu phiên bản đã cài đặt và danh tính artifact đã ghi đã khớp với đích đã phân giải, lượt cập nhật được bỏ qua mà không tải xuống, cài đặt lại hoặc ghi lại `openclaw.json`.

    Khi có hash integrity đã lưu và hash artifact được tải về thay đổi, OpenClaw xem đó là npm artifact drift. Lệnh tương tác `openclaw plugins update` in các hash kỳ vọng và thực tế rồi yêu cầu xác nhận trước khi tiếp tục. Các helper cập nhật không tương tác fail closed trừ khi caller cung cấp một chính sách tiếp tục rõ ràng.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install on update">
    `--dangerously-force-unsafe-install` cũng được chấp nhận trên `plugins update` để tương thích, nhưng không còn được khuyến nghị dùng và không còn thay đổi hành vi cập nhật Plugin. `security.installPolicy` của operator vẫn có thể chặn cập nhật; các hook `before_install` của Plugin chỉ áp dụng trong các tiến trình nơi hook Plugin được tải.
  </Accordion>
  <Accordion title="--acknowledge-clawhub-risk on update">
    Các lượt cập nhật Plugin do cộng đồng hậu thuẫn bởi ClawHub chạy cùng kiểm tra độ tin cậy bản phát hành chính xác như khi cài đặt trước khi tải gói thay thế. Dùng `--acknowledge-clawhub-risk` cho tự động hóa đã được rà soát cần tiếp tục khi bản phát hành ClawHub được chọn có cảnh báo tin cậy rủi ro. Các gói ClawHub chính thức và nguồn Plugin OpenClaw được bundle bỏ qua lời nhắc tin cậy bản phát hành này.
  </Accordion>
</AccordionGroup>

### Kiểm tra

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect hiển thị danh tính, trạng thái tải, nguồn, capability trong manifest, cờ chính sách, chẩn đoán, siêu dữ liệu cài đặt, capability bundle và mọi hỗ trợ máy chủ MCP hoặc LSP được phát hiện mà mặc định không nhập runtime Plugin. Đầu ra JSON bao gồm các hợp đồng manifest Plugin, chẳng hạn `contracts.agentToolResultMiddleware` và `contracts.trustedToolPolicies`, để operator có thể kiểm toán các khai báo bề mặt tin cậy trước khi bật hoặc khởi động lại một Plugin. Thêm `--runtime` để tải module Plugin và bao gồm các hook, công cụ, lệnh, dịch vụ, phương thức Gateway và route HTTP đã đăng ký. Kiểm tra runtime báo trực tiếp các phụ thuộc Plugin bị thiếu; cài đặt và sửa chữa nằm trong `openclaw plugins install`, `openclaw plugins update` và `openclaw doctor --fix`.

Các lệnh CLI do Plugin sở hữu thường được cài đặt làm nhóm lệnh gốc `openclaw`, nhưng Plugin cũng có thể đăng ký các lệnh lồng dưới một parent lõi như `openclaw nodes`. Sau khi `inspect --runtime` hiển thị một lệnh dưới `cliCommands`, hãy chạy lệnh đó tại đường dẫn được liệt kê; ví dụ một Plugin đăng ký `demo-git` có thể được xác minh bằng `openclaw demo-git ping`.

Mỗi Plugin được phân loại theo những gì nó thực sự đăng ký ở runtime:

- **plain-capability** — một loại capability (ví dụ: Plugin chỉ provider)
- **hybrid-capability** — nhiều loại capability (ví dụ: văn bản + giọng nói + hình ảnh)
- **hook-only** — chỉ hook, không có capability hoặc bề mặt
- **non-capability** — công cụ/lệnh/dịch vụ nhưng không có capability

Xem [Hình dạng Plugin](/vi/plugins/architecture#plugin-shapes) để biết thêm về mô hình capability.

<Note>
Cờ `--json` xuất một báo cáo máy đọc được, phù hợp cho scripting và kiểm toán. `inspect --all` hiển thị một bảng toàn đội với các cột hình dạng, loại capability, thông báo tương thích, capability bundle và tóm tắt hook. `info` là alias của `inspect`.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` báo lỗi tải Plugin, chẩn đoán manifest/discovery, thông báo tương thích và các tham chiếu cấu hình Plugin đã cũ như slot Plugin bị thiếu. Khi cây cài đặt và cấu hình Plugin sạch, nó in `No plugin issues detected.` Nếu cấu hình cũ vẫn còn nhưng cây cài đặt ngoài ra vẫn khỏe, phần tóm tắt sẽ nói như vậy thay vì ngụ ý sức khỏe Plugin đầy đủ.

Nếu một Plugin đã cấu hình có trên đĩa nhưng bị chặn bởi các kiểm tra an toàn đường dẫn của loader, xác thực cấu hình giữ lại mục Plugin và báo nó là `present but blocked`. Hãy sửa chẩn đoán Plugin bị chặn đứng trước, chẳng hạn quyền sở hữu đường dẫn hoặc quyền world-writable, thay vì xóa cấu hình `plugins.entries.<id>` hoặc `plugins.allow`.

Với các lỗi hình dạng module như thiếu export `register`/`activate`, hãy chạy lại với `OPENCLAW_PLUGIN_LOAD_DEBUG=1` để bao gồm phần tóm tắt hình dạng export gọn trong đầu ra chẩn đoán.

### Registry

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Registry Plugin cục bộ là mô hình đọc lạnh đã lưu của OpenClaw cho danh tính Plugin đã cài đặt, trạng thái bật, siêu dữ liệu nguồn và quyền sở hữu đóng góp. Khởi động thông thường, tra cứu chủ sở hữu provider, phân loại thiết lập kênh và kiểm kê Plugin có thể đọc nó mà không nhập các module runtime Plugin.

Dùng `plugins registry` để kiểm tra registry đã lưu có hiện diện, hiện hành hay đã cũ. Dùng `--refresh` để dựng lại nó từ chỉ mục Plugin đã lưu, chính sách cấu hình và siêu dữ liệu manifest/package. Đây là đường sửa chữa, không phải đường kích hoạt runtime.

`openclaw doctor --fix` cũng sửa npm drift được quản lý liền kề registry: nếu một gói `@openclaw/*` mồ côi hoặc được khôi phục dưới một dự án npm Plugin được quản lý hoặc thư mục gốc npm được quản lý phẳng kế thừa che khuất một Plugin được bundle, doctor xóa gói cũ đó và dựng lại registry để startup xác thực theo manifest được bundle. Doctor cũng liên kết lại gói host `openclaw` vào các Plugin npm được quản lý khai báo `peerDependencies.openclaw`, để các import runtime cục bộ theo gói như `openclaw/plugin-sdk/*` phân giải sau cập nhật hoặc sửa chữa npm.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` là một công tắc tương thích break-glass không còn khuyến nghị dùng cho các lỗi đọc registry. Ưu tiên `plugins registry --refresh` hoặc `openclaw doctor --fix`; fallback env chỉ dành cho khôi phục khởi động khẩn cấp trong khi migration được triển khai.
</Warning>

### Marketplace

```bash
openclaw plugins marketplace entries
openclaw plugins marketplace entries --offline
openclaw plugins marketplace entries --json
openclaw plugins marketplace entries --feed-profile <name>
openclaw plugins marketplace entries --feed-url <url>
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
openclaw plugins marketplace refresh
openclaw plugins marketplace refresh --feed-profile <name>
openclaw plugins marketplace refresh --feed-url <url>
openclaw plugins marketplace refresh --expected-sha256 <sha256> --json
```

`plugins marketplace entries` liệt kê các mục từ nguồn cấp marketplace OpenClaw đã cấu hình. Theo mặc định, lệnh này thử dùng nguồn cấp được lưu trữ và chuyển dự phòng sang ảnh chụp nhanh mới nhất đã được chấp nhận hoặc dữ liệu đi kèm. Dùng `--feed-profile <name>` để đọc một hồ sơ đã cấu hình cụ thể, `--feed-url <url>` để đọc một URL nguồn cấp được lưu trữ rõ ràng, và `--offline` để đọc ảnh chụp nhanh mới nhất đã được chấp nhận mà không lấy nguồn cấp.

`plugins marketplace refresh` làm mới ảnh chụp nhanh nguồn cấp được lưu trữ đã cấu hình và báo cáo OpenClaw đã chấp nhận dữ liệu được lưu trữ, ảnh chụp nhanh được lưu trữ, hay dữ liệu dự phòng đi kèm. Dùng `--expected-sha256` khi bên gọi cần lệnh thất bại trừ khi một payload mới từ nguồn được lưu trữ khớp với checksum đã ghim.

`list` của chợ ứng dụng chấp nhận đường dẫn chợ ứng dụng cục bộ, đường dẫn `marketplace.json`, dạng viết tắt GitHub như `owner/repo`, URL kho GitHub, hoặc URL git. `--json` in nhãn nguồn đã phân giải cùng với tệp kê khai chợ ứng dụng đã phân tích và các mục plugin.

Làm mới chợ ứng dụng sẽ tải nguồn cấp chợ ứng dụng OpenClaw được lưu trữ và lưu
phản hồi đã xác thực dưới dạng ảnh chụp nhanh nguồn cấp được lưu trữ cục bộ. Khi không có tùy chọn, lệnh dùng
hồ sơ nguồn cấp mặc định đã cấu hình. Dùng `--feed-profile <name>` để làm mới
một hồ sơ đã cấu hình cụ thể, `--feed-url <url>` để làm mới một URL nguồn cấp
được lưu trữ rõ ràng, `--expected-sha256 <sha256>` để yêu cầu tổng kiểm payload
khớp (`sha256:<hex>` hoặc mã băm hex 64 ký tự thuần), và `--json` cho
đầu ra máy đọc được. Các URL nguồn cấp được lưu trữ rõ ràng không được chứa
thông tin xác thực, chuỗi truy vấn, hoặc phân đoạn. Các lần làm mới không ghim có thể báo cáo
kết quả ảnh chụp nhanh được lưu trữ hoặc kết quả dự phòng đi kèm mà không làm lệnh thất bại. Các lần làm mới
đã ghim sẽ thất bại trừ khi chúng chấp nhận một payload được lưu trữ mới, và các lần làm mới được lưu trữ
thành công sẽ thất bại nếu OpenClaw không thể lưu ảnh chụp nhanh đã xác thực.

## Liên quan

- [Xây dựng plugin](/vi/plugins/building-plugins)
- [Tham chiếu CLI](/vi/cli)
- [ClawHub](/vi/clawhub)
