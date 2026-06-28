---
read_when:
    - Bạn muốn cài đặt hoặc quản lý plugin Gateway hoặc các gói tương thích
    - Bạn muốn tạo khung hoặc xác thực một Plugin công cụ đơn giản
    - Bạn muốn gỡ lỗi các lỗi tải plugin
sidebarTitle: Plugins
summary: Tham chiếu CLI cho `openclaw plugins` (init, build, validate, list, install, marketplace, uninstall, enable/disable, doctor)
title: Plugin
x-i18n:
    generated_at: "2026-06-28T20:43:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a703adb93af2490282f73b25cbbd95c7bc1d54c9c9c656fdb9b75465683f4ec8
    source_path: cli/plugins.md
    workflow: 16
---

Quản lý Plugin Gateway, các gói hook và các bundle tương thích.

<CardGroup cols={2}>
  <Card title="Plugin system" href="/vi/tools/plugin">
    Hướng dẫn dành cho người dùng cuối về cài đặt, bật và khắc phục sự cố Plugin.
  </Card>
  <Card title="Manage plugins" href="/vi/plugins/manage-plugins">
    Ví dụ nhanh cho cài đặt, liệt kê, cập nhật, gỡ cài đặt và phát hành.
  </Card>
  <Card title="Plugin bundles" href="/vi/plugins/bundles">
    Mô hình tương thích bundle.
  </Card>
  <Card title="Plugin manifest" href="/vi/plugins/manifest">
    Các trường manifest và schema cấu hình.
  </Card>
  <Card title="Security" href="/vi/gateway/security">
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

Để điều tra cài đặt, kiểm tra, gỡ cài đặt hoặc làm mới registry chậm, hãy chạy
lệnh với `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`. Trace ghi thời lượng từng pha
vào stderr và giữ cho đầu ra JSON vẫn phân tích được. Xem [Gỡ lỗi](/vi/help/debugging#plugin-lifecycle-trace).

<Note>
Ở chế độ Nix (`OPENCLAW_NIX_MODE=1`), các thao tác thay đổi vòng đời Plugin bị tắt. Hãy dùng nguồn Nix cho lượt cài đặt này thay vì `plugins install`, `plugins update`, `plugins uninstall`, `plugins enable` hoặc `plugins disable`; với nix-openclaw, hãy dùng [Bắt đầu nhanh](https://github.com/openclaw/nix-openclaw#quick-start) ưu tiên agent.
</Note>

<Note>
Các Plugin đi kèm được phát hành cùng OpenClaw. Một số được bật theo mặc định (ví dụ các nhà cung cấp mô hình đi kèm, nhà cung cấp giọng nói đi kèm và Plugin trình duyệt đi kèm); các Plugin khác cần `plugins enable`.

Plugin OpenClaw gốc phải phát hành `openclaw.plugin.json` với JSON Schema nội tuyến (`configSchema`, kể cả khi rỗng). Các bundle tương thích dùng manifest bundle riêng của chúng.

`plugins list` hiển thị `Format: openclaw` hoặc `Format: bundle`. Đầu ra list/info chi tiết cũng hiển thị subtype của bundle (`codex`, `claude` hoặc `cursor`) cùng các khả năng bundle được phát hiện.
</Note>

### Tạo plugin

```bash
openclaw plugins init stock-quotes --name "Stock Quotes"
cd stock-quotes
npm run plugin:build
npm run plugin:validate
```

Theo mặc định, `plugins init` tạo một Plugin công cụ TypeScript tối thiểu. Đối số đầu tiên
là id Plugin; truyền `--name` cho tên hiển thị. OpenClaw dùng id cho
thư mục đầu ra mặc định và cách đặt tên package. Khung dựng công cụ dùng
`defineToolPlugin`.
`plugins build` nhập entry đã build, đọc metadata công cụ tĩnh của nó, ghi
`openclaw.plugin.json`, và giữ cho `package.json` `openclaw.extensions` đồng bộ.
`plugins validate` kiểm tra rằng manifest được tạo, metadata package và
export entry hiện tại vẫn khớp nhau. Xem [Plugin công cụ](/vi/plugins/tool-plugins) để biết
toàn bộ quy trình tạo công cụ.

Khung dựng ghi mã nguồn TypeScript nhưng tạo metadata từ entry đã build
`./dist/index.js`, nên quy trình này cũng hoạt động với CLI đã phát hành. Dùng
`--entry <path>` khi entry không phải entry package mặc định. Dùng
`plugins build --check` trong CI để thất bại khi metadata được tạo đã lỗi thời mà không
ghi lại tệp.

### Khung dựng nhà cung cấp

```bash
openclaw plugins init acme-models --name "Acme Models" --type provider
cd acme-models
npm install
npm run build
npm test
npm run validate
```

Khung dựng nhà cung cấp tạo một Plugin nhà cung cấp văn bản/mô hình chung với
hệ thống API-key tương thích OpenAI, script `npm run validate` tích hợp sẵn cho `clawhub package
validate`, metadata package ClawHub và một workflow GitHub được kích hoạt thủ công
để phát hành đáng tin cậy trong tương lai qua GitHub Actions OIDC. Khung dựng nhà cung cấp
không tạo Skills và không dùng `openclaw plugins build` hoặc
`openclaw plugins validate`; các lệnh đó dành cho đường dẫn metadata được tạo của
khung dựng công cụ.

  Trước khi xuất bản, hãy thay URL cơ sở API, danh mục model, tuyến docs, văn bản thông tin xác thực và nội dung README giữ chỗ bằng chi tiết provider thật. Sử dụng README được tạo cho lần xuất bản ClawHub đầu tiên và thiết lập nhà xuất bản đáng tin cậy.

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

  Maintainer đang kiểm thử các lượt cài đặt trong lúc thiết lập có thể ghi đè nguồn cài đặt plugin tự động bằng các biến môi trường được bảo vệ. Xem [ghi đè cài đặt Plugin](/vi/plugins/install-overrides).

  <Warning>
  Tên gói trần mặc định cài đặt từ npm trong giai đoạn chuyển đổi ra mắt, trừ khi chúng khớp với một id plugin chính thức. Các đặc tả gói `@openclaw/*` thô khớp với plugin đóng gói sẵn sẽ dùng bản đóng gói sẵn đi kèm bản dựng OpenClaw hiện tại. Dùng `npm:<package>` khi bạn chủ ý muốn dùng một gói npm bên ngoài. Dùng `clawhub:<package>` cho ClawHub. Hãy xem việc cài đặt plugin như chạy mã. Ưu tiên các phiên bản đã ghim.
  </Warning>

  `plugins search` truy vấn ClawHub để tìm các gói plugin có thể cài đặt và in ra tên gói sẵn sàng để cài đặt. Lệnh này tìm kiếm các gói code-plugin và bundle-plugin, không phải Skills. Dùng `openclaw skills search` cho Skills trên ClawHub.

  <Note>
  ClawHub là bề mặt phân phối và khám phá chính cho hầu hết plugin. Npm vẫn là đường dự phòng được hỗ trợ và đường cài đặt trực tiếp. Các gói plugin `@openclaw/*` do OpenClaw sở hữu đã được xuất bản lại trên npm; xem danh sách hiện tại trên [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) hoặc [kho kiểm kê plugin](/vi/plugins/plugin-inventory). Các lượt cài đặt ổn định dùng `latest`. Các lượt cài đặt và cập nhật kênh beta ưu tiên dist-tag `beta` của npm khi thẻ đó có sẵn, rồi mới chuyển về `latest`.
  </Note>

  <AccordionGroup>
  <Accordion title="Include cấu hình và sửa cấu hình không hợp lệ">
    Nếu phần `plugins` của bạn được hỗ trợ bởi một `$include` một tệp, `plugins install/update/enable/disable/uninstall` sẽ ghi xuyên qua tệp được include đó và giữ nguyên `openclaw.json`. Include gốc, mảng include và include có ghi đè cùng cấp sẽ fail closed thay vì làm phẳng. Xem [include cấu hình](/vi/gateway/configuration) để biết các dạng được hỗ trợ.

    Nếu cấu hình không hợp lệ trong lúc cài đặt, `plugins install` thường fail closed và yêu cầu bạn chạy `openclaw doctor --fix` trước. Trong lúc Gateway khởi động và hot reload, cấu hình plugin không hợp lệ fail closed như mọi cấu hình không hợp lệ khác; `openclaw doctor --fix` có thể cách ly mục plugin không hợp lệ. Ngoại lệ duy nhất được ghi tài liệu tại thời điểm cài đặt là một đường khôi phục plugin đóng gói sẵn hẹp dành cho các plugin chủ động chọn tham gia `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force và cài đặt lại so với cập nhật">
    `--force` tái sử dụng đích cài đặt hiện có và ghi đè tại chỗ một plugin hoặc hook pack đã được cài đặt. Dùng nó khi bạn chủ ý cài đặt lại cùng một id từ một đường dẫn cục bộ, archive, gói ClawHub hoặc artifact npm mới. Đối với nâng cấp thường lệ của một plugin npm đã được theo dõi, hãy ưu tiên `openclaw plugins update <id-or-npm-spec>`.

    Nếu bạn chạy `plugins install` cho một id plugin đã được cài đặt, OpenClaw sẽ dừng và chỉ bạn đến `plugins update <id-or-npm-spec>` để nâng cấp bình thường, hoặc đến `plugins install <package> --force` khi bạn thật sự muốn ghi đè bản cài đặt hiện tại từ một nguồn khác.

  </Accordion>
  <Accordion title="Phạm vi --pin">
    `--pin` chỉ áp dụng cho cài đặt npm. Nó không được hỗ trợ với cài đặt `git:`; hãy dùng một git ref rõ ràng như `git:github.com/acme/plugin@v1.2.3` khi bạn muốn một nguồn đã ghim. Nó không được hỗ trợ với `--marketplace`, vì cài đặt marketplace lưu giữ metadata nguồn marketplace thay vì một đặc tả npm.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` đã bị ngừng dùng và hiện là no-op. OpenClaw không còn chạy cơ chế chặn mã nguy hiểm tích hợp sẵn tại thời điểm cài đặt cho các lượt cài đặt plugin.

    Dùng bề mặt `security.installPolicy` chung do operator sở hữu khi cần chính sách cài đặt dành riêng cho host. Hook `before_install` của plugin là hook vòng đời plugin-runtime và không phải ranh giới chính sách chính cho cài đặt CLI.

    Nếu một plugin bạn đã xuất bản trên ClawHub bị ẩn hoặc bị chặn bởi một lượt quét registry, hãy dùng các bước dành cho nhà xuất bản trong [xuất bản ClawHub](/vi/clawhub/publishing). `--dangerously-force-unsafe-install` không yêu cầu ClawHub quét lại plugin hoặc công khai một bản phát hành bị chặn.

  </Accordion>
  <Accordion title="--acknowledge-clawhub-risk">
    Các lượt cài đặt ClawHub cộng đồng kiểm tra bản ghi tin cậy của bản phát hành đã chọn trước khi tải xuống gói. Nếu ClawHub vô hiệu hóa tải xuống cho bản phát hành, báo cáo phát hiện quét độc hại hoặc đặt bản phát hành vào trạng thái kiểm duyệt chặn như quarantine, OpenClaw sẽ từ chối bản phát hành đó. Đối với các trạng thái quét rủi ro không chặn, trạng thái kiểm duyệt rủi ro hoặc lý do registry, OpenClaw hiển thị chi tiết tin cậy và yêu cầu xác nhận trước khi tiếp tục.

    Chỉ dùng `--acknowledge-clawhub-risk` sau khi xem cảnh báo ClawHub và quyết định tiếp tục mà không cần lời nhắc tương tác. Bản ghi tin cậy sạch đang chờ hoặc cũ sẽ cảnh báo nhưng không yêu cầu xác nhận. Các gói ClawHub chính thức và nguồn plugin OpenClaw đóng gói sẵn bỏ qua lời nhắc tin cậy bản phát hành này.

  </Accordion>
  <Accordion title="Hook pack và đặc tả npm">
    `plugins install` cũng là bề mặt cài đặt cho các hook pack hiển thị `openclaw.hooks` trong `package.json`. Dùng `openclaw hooks` để xem hook có lọc và bật từng hook, không phải để cài đặt gói.

    Thông số npm là **chỉ từ registry** (tên gói + **phiên bản chính xác** hoặc **dist-tag** tùy chọn). Thông số Git/URL/tệp và dải semver bị từ chối. Cài đặt phụ thuộc chạy trong một dự án npm được quản lý cho mỗi plugin với `--ignore-scripts` để an toàn, ngay cả khi shell của bạn có thiết lập cài đặt npm toàn cục. Các dự án npm plugin được quản lý kế thừa `overrides` npm cấp gói của OpenClaw, nên các ghim bảo mật của host cũng áp dụng cho phụ thuộc plugin được hoist.

    Dùng `npm:<package>` khi bạn muốn làm rõ việc phân giải npm. Thông số gói dạng trần cũng cài trực tiếp từ npm trong giai đoạn chuyển đổi khởi chạy, trừ khi chúng khớp với id plugin chính thức.

    Thông số gói `@openclaw/*` thô khớp với plugin được đóng gói sẵn sẽ phân giải sang bản đóng gói sẵn do image sở hữu trước khi dự phòng sang npm. Ví dụ, `openclaw plugins install @openclaw/discord@2026.5.20 --pin` dùng plugin Discord được đóng gói sẵn từ bản dựng OpenClaw hiện tại thay vì tạo một override npm được quản lý. Để ép dùng gói npm bên ngoài, hãy dùng `openclaw plugins install npm:@openclaw/discord@2026.5.20 --pin`.

    Thông số trần và `@latest` nằm trên kênh ổn định. Các phiên bản sửa lỗi có dấu ngày của OpenClaw như `2026.5.3-1` là bản phát hành ổn định cho kiểm tra này. Nếu npm phân giải một trong các dạng đó thành bản phát hành trước, OpenClaw sẽ dừng và yêu cầu bạn chọn tham gia rõ ràng bằng một thẻ phát hành trước như `@beta`/`@rc` hoặc một phiên bản phát hành trước chính xác như `@1.2.3-beta.4`.

    Với cài đặt npm không có phiên bản chính xác (`npm:<package>` hoặc `npm:<package>@latest`), OpenClaw kiểm tra metadata gói đã phân giải trước khi cài đặt. Nếu gói ổn định mới nhất yêu cầu API plugin OpenClaw mới hơn hoặc phiên bản host tối thiểu mới hơn, OpenClaw sẽ kiểm tra các phiên bản ổn định cũ hơn và cài bản phát hành tương thích mới nhất thay vào đó. Phiên bản chính xác và dist-tag rõ ràng như `@beta` vẫn nghiêm ngặt: nếu gói được chọn không tương thích, lệnh thất bại và yêu cầu bạn nâng cấp OpenClaw hoặc chọn một phiên bản tương thích.

    Nếu thông số cài đặt trần khớp với id plugin chính thức (ví dụ `diffs`), OpenClaw cài trực tiếp mục catalog. Để cài một gói npm có cùng tên, hãy dùng thông số có scope rõ ràng (ví dụ `@scope/diffs`).

  </Accordion>
  <Accordion title="Git repositories">
    Dùng `git:<repo>` để cài trực tiếp từ kho git. Các dạng được hỗ trợ gồm `git:github.com/owner/repo`, `git:owner/repo`, URL clone đầy đủ `https://`, `ssh://`, `git://`, `file://`, và `git@host:owner/repo.git`. Thêm `@<ref>` hoặc `#<ref>` để checkout một nhánh, thẻ, hoặc commit trước khi cài đặt.

    Cài đặt Git clone vào một thư mục tạm, checkout ref được yêu cầu khi có, rồi dùng trình cài đặt thư mục plugin thông thường. Điều đó nghĩa là xác thực manifest, chính sách cài đặt của operator, công việc cài đặt trình quản lý gói, và bản ghi cài đặt hoạt động giống cài đặt npm. Bản ghi cài đặt git bao gồm URL/ref nguồn cùng commit đã phân giải để `openclaw plugins update` có thể phân giải lại nguồn sau này.

    Sau khi cài từ git, dùng `openclaw plugins inspect <id> --runtime --json` để xác minh các đăng ký runtime như phương thức gateway và lệnh CLI. Nếu plugin đã đăng ký một CLI root bằng `api.registerCli`, hãy thực thi lệnh đó trực tiếp qua CLI root của OpenClaw, ví dụ `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Archives">
    Lưu trữ được hỗ trợ: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Lưu trữ plugin OpenClaw gốc phải chứa `openclaw.plugin.json` hợp lệ tại root plugin sau khi giải nén; lưu trữ chỉ chứa `package.json` bị từ chối trước khi OpenClaw ghi bản ghi cài đặt.

    Dùng `npm-pack:<path.tgz>` khi tệp là tarball npm-pack và bạn muốn
    kiểm thử cùng đường dẫn dự án npm được quản lý cho mỗi plugin như registry
    installs sử dụng, bao gồm xác minh `package-lock.json`, quét phụ thuộc
    được hoist, và bản ghi cài đặt npm. Đường dẫn lưu trữ thuần vẫn cài như
    lưu trữ cục bộ dưới root extensions của plugin.

    Cài đặt Claude marketplace cũng được hỗ trợ.

  </Accordion>
</AccordionGroup>

Cài đặt ClawHub dùng locator `clawhub:<package>` rõ ràng:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Thông số plugin an toàn cho npm dạng trần mặc định cài từ npm trong giai đoạn chuyển đổi khởi chạy, trừ khi chúng khớp với id plugin chính thức:

```bash
openclaw plugins install openclaw-codex-app-server
```

Dùng `npm:` để làm rõ phân giải chỉ npm:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@openclaw/discord@2026.5.20
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw kiểm tra API plugin được quảng bá / khả năng tương thích gateway tối thiểu trước khi cài đặt. Khi phiên bản ClawHub được chọn phát hành một artifact ClawPack, OpenClaw tải xuống `.tgz` npm-pack có phiên bản, xác minh header digest ClawHub và digest artifact, rồi cài nó qua đường dẫn lưu trữ thông thường. Các phiên bản ClawHub cũ hơn không có metadata ClawPack vẫn cài qua đường dẫn xác minh lưu trữ gói legacy. Bản ghi cài đặt giữ metadata nguồn ClawHub, loại artifact, integrity npm, shasum npm, tên tarball, và thông tin digest ClawPack để cập nhật sau này.
Cài đặt ClawHub không có phiên bản giữ thông số được ghi không có phiên bản để `openclaw plugins update` có thể theo các bản phát hành ClawHub mới hơn; bộ chọn phiên bản hoặc thẻ rõ ràng như `clawhub:pkg@1.2.3` và `clawhub:pkg@beta` vẫn được ghim vào bộ chọn đó.

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
    - tên known-marketplace của Claude từ `~/.claude/plugins/known_marketplaces.json`
    - root marketplace cục bộ hoặc đường dẫn `marketplace.json`
    - cú pháp rút gọn repo GitHub như `owner/repo`
    - URL repo GitHub như `https://github.com/owner/repo`
    - URL git

  </Tab>
  <Tab title="Remote marketplace rules">
    Với marketplace từ xa được tải từ GitHub hoặc git, các mục plugin phải ở bên trong repo marketplace đã clone. OpenClaw chấp nhận nguồn đường dẫn tương đối từ repo đó và từ chối HTTP(S), đường dẫn tuyệt đối, git, GitHub, và các nguồn plugin không phải đường dẫn khác từ manifest từ xa.
  </Tab>
</Tabs>

Với đường dẫn cục bộ và lưu trữ, OpenClaw tự động phát hiện:

- plugin OpenClaw gốc (`openclaw.plugin.json`)
- bundle tương thích Codex (`.codex-plugin/plugin.json`)
- bundle tương thích Claude (`.claude-plugin/plugin.json` hoặc bố cục thành phần Claude mặc định)
- bundle tương thích Cursor (`.cursor-plugin/plugin.json`)

Cài đặt cục bộ được quản lý phải là thư mục plugin hoặc lưu trữ. Các tệp plugin độc lập `.js`,
`.mjs`, `.cjs`, và `.ts` không được sao chép vào root plugin được quản lý
bởi `plugins install`; thay vào đó hãy liệt kê chúng rõ ràng trong `plugins.load.paths`.

<Note>
Bundle tương thích được cài vào root plugin thông thường và tham gia cùng luồng list/info/enable/disable. Hiện tại, bundle skills, command-skills của Claude, mặc định `settings.json` của Claude, mặc định `.lsp.json` / `lspServers` khai báo trong manifest của Claude, command-skills của Cursor, và thư mục hook Codex tương thích được hỗ trợ; các khả năng bundle khác được phát hiện sẽ hiển thị trong diagnostics/info nhưng chưa được nối vào thực thi runtime.
</Note>

### Danh sách

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
  Chuyển từ chế độ xem bảng sang các dòng chi tiết theo từng plugin với metadata source/origin/version/activation.
</ParamField>
<ParamField path="--json" type="boolean">
  Inventory đọc được bằng máy cộng với diagnostics registry và trạng thái cài đặt phụ thuộc gói.
</ParamField>

<Note>
`plugins list` đọc registry plugin cục bộ đã lưu trước, với dự phòng dẫn xuất chỉ từ manifest khi registry bị thiếu hoặc không hợp lệ. Lệnh này hữu ích để kiểm tra liệu một plugin đã được cài, bật, và hiển thị cho kế hoạch khởi động lạnh hay chưa, nhưng nó không phải probe runtime trực tiếp của một tiến trình Gateway đang chạy. Sau khi thay đổi mã plugin, trạng thái bật, chính sách hook, hoặc `plugins.load.paths`, hãy khởi động lại Gateway phục vụ channel trước khi kỳ vọng mã `register(api)` hoặc hook mới chạy. Với triển khai từ xa/container, hãy xác minh bạn đang khởi động lại đúng child `openclaw gateway run` thực tế, không chỉ một tiến trình wrapper.

`plugins list --json` bao gồm `dependencyStatus` của mỗi plugin từ `package.json`
`dependencies` và `optionalDependencies`. OpenClaw kiểm tra liệu các tên gói đó
có hiện diện dọc theo đường dẫn tra cứu `node_modules` Node bình thường của plugin hay không; nó
không import mã runtime plugin, chạy trình quản lý gói, hoặc sửa chữa
phụ thuộc bị thiếu.
</Note>

Nếu log khởi động ghi `plugins.allow is empty; discovered non-bundled plugins may auto-load: ...`,
hãy chạy `openclaw plugins list --enabled --verbose` hoặc
`openclaw plugins inspect <id>` với một id plugin được liệt kê để xác nhận các
id plugin và sao chép id tin cậy vào `plugins.allow` trong `openclaw.json`. Khi
cảnh báo có thể liệt kê mọi plugin được phát hiện, nó in một đoạn
`plugins.allow` sẵn sàng dán đã bao gồm các id đó. Nếu một plugin tải
mà không có provenance cài đặt/load-path, hãy inspect id plugin đó, rồi ghim
id tin cậy trong `plugins.allow` hoặc cài lại plugin từ một nguồn tin cậy
để OpenClaw ghi provenance cài đặt.

`plugins search` là tra cứu catalog ClawHub từ xa. Nó không kiểm tra trạng thái
cục bộ, mutate config, cài gói, hoặc tải mã runtime plugin. Kết quả tìm kiếm
bao gồm tên gói ClawHub, family, channel, version, summary, và
gợi ý cài đặt như `openclaw plugins install clawhub:<package>`.

Với công việc plugin được đóng gói sẵn bên trong image Docker đã đóng gói, hãy bind-mount thư mục
nguồn plugin lên đường dẫn nguồn đã đóng gói tương ứng, chẳng hạn
`/app/extensions/synology-chat`. OpenClaw sẽ phát hiện overlay nguồn đã mount đó
trước `/app/dist/extensions/synology-chat`; một thư mục nguồn sao chép thuần
vẫn không hoạt động để các cài đặt đóng gói thông thường tiếp tục dùng dist đã biên dịch.

Để gỡ lỗi hook runtime:

- `openclaw plugins inspect <id> --runtime --json` hiển thị hook đã đăng ký và diagnostics từ một lượt inspect có tải module. Runtime inspection không bao giờ cài phụ thuộc; dùng `openclaw doctor --fix` để dọn trạng thái phụ thuộc legacy hoặc khôi phục plugin có thể tải xuống bị thiếu được tham chiếu bởi config.
- `openclaw gateway status --deep --require-rpc` xác nhận URL/profile Gateway có thể truy cập, gợi ý service/process, đường dẫn config, và sức khỏe RPC.
- Hook hội thoại không đóng gói sẵn (`llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize`, `agent_end`) yêu cầu `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Dùng `--link` để tránh sao chép thư mục plugin cục bộ (thêm vào `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

Tệp plugin độc lập phải được liệt kê trong `plugins.load.paths` thay vì
cài bằng `plugins install` hoặc đặt trực tiếp trong `~/.openclaw/extensions`
hoặc `<workspace>/.openclaw/extensions`. Các root tự động phát hiện đó tải
thư mục gói hoặc bundle plugin, trong khi tệp script cấp cao nhất được xem là
helper cục bộ và bị bỏ qua.

<Note>
Các Plugin có nguồn từ workspace được phát hiện từ thư mục gốc extensions của workspace sẽ không
được nhập hoặc thực thi cho đến khi chúng được bật rõ ràng. Để phát triển cục bộ,
chạy `openclaw plugins enable <plugin-id>` hoặc đặt
`plugins.entries.<plugin-id>.enabled: true`; nếu cấu hình của bạn dùng
`plugins.allow`, hãy đưa cùng id Plugin đó vào đó nữa. Quy tắc fail-closed này
cũng áp dụng khi thiết lập kênh nhắm rõ đến một Plugin có nguồn từ workspace để
tải chỉ phục vụ thiết lập, vì vậy mã thiết lập Plugin kênh cục bộ sẽ không chạy khi
Plugin workspace đó vẫn bị tắt hoặc bị loại khỏi allowlist. Các bản cài đặt được liên kết
và các mục `plugins.load.paths` rõ ràng tuân theo chính sách bình thường cho
nguồn Plugin đã phân giải của chúng. Xem
[Cấu hình chính sách Plugin](/vi/tools/plugin#configure-plugin-policy)
và [Tham chiếu cấu hình](/vi/gateway/configuration-reference#plugins).

`--force` không được hỗ trợ với `--link` vì các bản cài đặt được liên kết tái sử dụng đường dẫn nguồn thay vì sao chép đè lên một đích cài đặt được quản lý.

Dùng `--pin` trên các bản cài npm để lưu spec chính xác đã phân giải (`name@version`) trong chỉ mục Plugin được quản lý trong khi vẫn giữ hành vi mặc định không ghim.
</Note>

### Chỉ mục Plugin

Siêu dữ liệu cài đặt Plugin là trạng thái do máy quản lý, không phải cấu hình người dùng. Các lần cài đặt và cập nhật ghi dữ liệu này vào cơ sở dữ liệu trạng thái SQLite dùng chung trong thư mục trạng thái OpenClaw đang hoạt động. Hàng `installed_plugin_index` lưu siêu dữ liệu `installRecords` bền vững, bao gồm bản ghi cho các manifest Plugin bị hỏng hoặc bị thiếu, cùng với bộ nhớ đệm registry lạnh suy ra từ manifest được dùng bởi `openclaw plugins update`, gỡ cài đặt, chẩn đoán và registry Plugin lạnh.

Khi OpenClaw thấy các bản ghi `plugins.installs` kế thừa đã phát hành trong cấu hình, các lần đọc runtime xem chúng là dữ liệu đầu vào tương thích mà không ghi lại `openclaw.json`. Các lần ghi Plugin rõ ràng và `openclaw doctor --fix` chuyển các bản ghi đó vào chỉ mục Plugin và xóa khóa cấu hình khi được phép ghi cấu hình; nếu một trong hai lần ghi thất bại, các bản ghi cấu hình được giữ lại để siêu dữ liệu cài đặt không bị mất.

### Gỡ cài đặt

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` xóa bản ghi Plugin khỏi `plugins.entries`, chỉ mục Plugin đã lưu, các mục trong danh sách cho phép/từ chối Plugin, và các mục `plugins.load.paths` được liên kết khi áp dụng. Trừ khi đặt `--keep-files`, thao tác gỡ cài đặt cũng xóa thư mục cài đặt được quản lý đang được theo dõi khi thư mục đó nằm trong thư mục gốc extensions Plugin của OpenClaw. Với các Plugin Active Memory, khe bộ nhớ được đặt lại về `memory-core`.

<Note>
`--keep-config` được hỗ trợ dưới dạng bí danh đã lỗi thời cho `--keep-files`.
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

Các bản cập nhật áp dụng cho các bản cài Plugin được theo dõi trong chỉ mục Plugin được quản lý và các bản cài hook-pack được theo dõi trong `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="Phân giải id Plugin so với spec npm">
    Khi bạn truyền một id Plugin, OpenClaw tái sử dụng spec cài đặt đã ghi cho Plugin đó. Điều này nghĩa là các dist-tag đã lưu trước đó như `@beta` và các phiên bản ghim chính xác tiếp tục được dùng trong những lần chạy `update <id>` sau này.

    Trong `update <id> --dry-run`, các bản cài npm ghim chính xác vẫn được ghim. Nếu OpenClaw cũng có thể phân giải dòng mặc định của registry cho gói và dòng mặc định đó mới hơn phiên bản ghim đã cài, lần chạy thử sẽ báo cáo pin và in lệnh cập nhật gói `@latest` rõ ràng để theo dòng mặc định của registry.

    Quy tắc cập nhật có mục tiêu đó khác với đường dẫn bảo trì hàng loạt `openclaw plugins update --all`. Các bản cập nhật hàng loạt vẫn tôn trọng các spec cài đặt được theo dõi thông thường, nhưng bản ghi Plugin OpenClaw chính thức đáng tin cậy có thể đồng bộ với đích catalog chính thức hiện tại thay vì ở lại trên một gói chính thức chính xác đã cũ. Dùng `update <id>` có mục tiêu khi bạn cố ý muốn giữ nguyên một spec chính thức chính xác hoặc có tag.

    Với các bản cài npm, bạn cũng có thể truyền một spec gói npm rõ ràng với dist-tag hoặc phiên bản chính xác. OpenClaw phân giải tên gói đó ngược về bản ghi Plugin được theo dõi, cập nhật Plugin đã cài đó, và ghi spec npm mới cho các bản cập nhật dựa trên id trong tương lai.

    Truyền tên gói npm không kèm phiên bản hoặc tag cũng phân giải ngược về bản ghi Plugin được theo dõi. Dùng cách này khi một Plugin đã được ghim vào một phiên bản chính xác và bạn muốn chuyển nó trở lại dòng phát hành mặc định của registry.

  </Accordion>
  <Accordion title="Cập nhật kênh beta">
    `openclaw plugins update <id-or-npm-spec>` có mục tiêu tái sử dụng spec Plugin được theo dõi trừ khi bạn truyền một spec mới. `openclaw plugins update --all` hàng loạt dùng `update.channel` đã cấu hình khi đồng bộ các bản ghi Plugin chính thức đáng tin cậy với đích catalog chính thức, vì vậy các bản cài kênh beta có thể ở lại trên dòng phát hành beta thay vì bị chuẩn hóa ngầm về stable/latest.

    `openclaw update` cũng biết kênh cập nhật OpenClaw đang hoạt động: trên kênh beta, các bản ghi Plugin npm dòng mặc định và ClawHub sẽ thử `@beta` trước. Chúng quay lại spec default/latest đã ghi nếu không có bản phát hành beta của Plugin; Plugin npm cũng quay lại khi gói beta tồn tại nhưng không vượt qua xác thực cài đặt. Phần fallback đó được báo cáo dưới dạng cảnh báo và không làm hỏng cập nhật core. Các phiên bản chính xác và tag rõ ràng vẫn được ghim vào bộ chọn đó cho các bản cập nhật có mục tiêu.

  </Accordion>
  <Accordion title="Kiểm tra phiên bản và lệch toàn vẹn">
    Trước một bản cập nhật npm trực tiếp, OpenClaw kiểm tra phiên bản gói đã cài so với siêu dữ liệu npm registry. Nếu phiên bản đã cài và danh tính artifact đã ghi đã khớp với đích đã phân giải, bản cập nhật sẽ được bỏ qua mà không tải xuống, cài đặt lại hoặc ghi lại `openclaw.json`.

    Khi có hash toàn vẹn đã lưu và hash artifact đã tải về thay đổi, OpenClaw xem đó là lệch artifact npm. Lệnh tương tác `openclaw plugins update` in hash kỳ vọng và hash thực tế rồi yêu cầu xác nhận trước khi tiếp tục. Các helper cập nhật không tương tác sẽ fail closed trừ khi caller cung cấp một chính sách tiếp tục rõ ràng.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install khi cập nhật">
    `--dangerously-force-unsafe-install` cũng được chấp nhận trên `plugins update` để tương thích, nhưng nó đã lỗi thời và không còn thay đổi hành vi cập nhật Plugin. `security.installPolicy` của operator vẫn có thể chặn cập nhật; các hook `before_install` của Plugin chỉ áp dụng trong các tiến trình nơi hook Plugin được tải.
  </Accordion>
  <Accordion title="--acknowledge-clawhub-risk khi cập nhật">
    Các bản cập nhật Plugin cộng đồng dựa trên ClawHub chạy cùng kiểm tra tin cậy bản phát hành chính xác như khi cài đặt trước khi tải gói thay thế xuống. Dùng `--acknowledge-clawhub-risk` cho tự động hóa đã được rà soát cần tiếp tục khi bản phát hành ClawHub được chọn có cảnh báo tin cậy rủi ro. Các gói ClawHub chính thức và nguồn Plugin OpenClaw đi kèm bỏ qua lời nhắc tin cậy bản phát hành này.
  </Accordion>
</AccordionGroup>

### Kiểm tra

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect hiển thị danh tính, trạng thái tải, nguồn, capability trong manifest, cờ chính sách, chẩn đoán, siêu dữ liệu cài đặt, capability bundle, và mọi hỗ trợ máy chủ MCP hoặc LSP được phát hiện mà mặc định không nhập runtime Plugin. Đầu ra JSON bao gồm các hợp đồng manifest Plugin, chẳng hạn `contracts.agentToolResultMiddleware` và `contracts.trustedToolPolicies`, để operator có thể audit các khai báo bề mặt đáng tin cậy trước khi bật hoặc khởi động lại Plugin. Thêm `--runtime` để tải mô-đun Plugin và bao gồm các hook, công cụ, lệnh, dịch vụ, phương thức Gateway, và tuyến HTTP đã đăng ký. Kiểm tra runtime báo cáo trực tiếp các phụ thuộc Plugin bị thiếu; cài đặt và sửa chữa vẫn nằm trong `openclaw plugins install`, `openclaw plugins update`, và `openclaw doctor --fix`.

Các lệnh CLI do Plugin sở hữu thường được cài đặt dưới dạng nhóm lệnh gốc `openclaw`, nhưng Plugin cũng có thể đăng ký lệnh lồng dưới một parent core như `openclaw nodes`. Sau khi `inspect --runtime` hiển thị một lệnh trong `cliCommands`, hãy chạy lệnh đó tại đường dẫn được liệt kê; ví dụ, một Plugin đăng ký `demo-git` có thể được xác minh bằng `openclaw demo-git ping`.

Mỗi Plugin được phân loại theo những gì nó thực sự đăng ký ở runtime:

- **plain-capability** — một loại capability (ví dụ: Plugin chỉ dành cho provider)
- **hybrid-capability** — nhiều loại capability (ví dụ: văn bản + giọng nói + hình ảnh)
- **hook-only** — chỉ có hook, không có capability hoặc bề mặt
- **non-capability** — công cụ/lệnh/dịch vụ nhưng không có capability

Xem [Hình dạng Plugin](/vi/plugins/architecture#plugin-shapes) để biết thêm về mô hình capability.

<Note>
Cờ `--json` xuất báo cáo machine-readable phù hợp cho script và audit. `inspect --all` hiển thị bảng toàn bộ fleet với các cột shape, loại capability, thông báo tương thích, capability bundle, và tóm tắt hook. `info` là bí danh của `inspect`.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` báo cáo lỗi tải Plugin, chẩn đoán manifest/discovery, thông báo tương thích, và tham chiếu cấu hình Plugin cũ như các khe Plugin bị thiếu. Khi cây cài đặt và cấu hình Plugin sạch, nó in `No plugin issues detected.` Nếu cấu hình cũ vẫn còn nhưng cây cài đặt nhìn chung khỏe mạnh, phần tóm tắt sẽ nói như vậy thay vì ngụ ý sức khỏe Plugin đầy đủ.

Nếu một Plugin đã cấu hình có mặt trên đĩa nhưng bị chặn bởi các kiểm tra an toàn đường dẫn của loader, xác thực cấu hình giữ lại mục Plugin và báo cáo là `present but blocked`. Hãy sửa chẩn đoán Plugin bị chặn đứng trước, chẳng hạn quyền sở hữu đường dẫn hoặc quyền world-writable, thay vì xóa cấu hình `plugins.entries.<id>` hoặc `plugins.allow`.

Với các lỗi hình dạng mô-đun như thiếu export `register`/`activate`, chạy lại với `OPENCLAW_PLUGIN_LOAD_DEBUG=1` để đưa tóm tắt hình dạng export gọn vào đầu ra chẩn đoán.

### Registry

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Registry Plugin cục bộ là mô hình đọc lạnh đã lưu của OpenClaw cho danh tính Plugin đã cài, trạng thái bật, siêu dữ liệu nguồn, và quyền sở hữu đóng góp. Khởi động bình thường, tra cứu owner provider, phân loại thiết lập kênh, và kiểm kê Plugin có thể đọc nó mà không nhập các mô-đun runtime Plugin.

Dùng `plugins registry` để kiểm tra registry đã lưu có tồn tại, hiện hành, hay đã cũ. Dùng `--refresh` để dựng lại nó từ chỉ mục Plugin đã lưu, chính sách cấu hình, và siêu dữ liệu manifest/package. Đây là đường dẫn sửa chữa, không phải đường dẫn kích hoạt runtime.

`openclaw doctor --fix` cũng sửa lệch npm được quản lý nằm gần registry: nếu một gói `@openclaw/*` mồ côi hoặc được phục hồi trong dự án npm Plugin được quản lý hoặc thư mục gốc npm được quản lý phẳng kế thừa che khuất một Plugin đi kèm, doctor sẽ xóa gói cũ đó và dựng lại registry để quá trình khởi động xác thực theo manifest đi kèm. Doctor cũng liên kết lại gói host `openclaw` vào các Plugin npm được quản lý khai báo `peerDependencies.openclaw`, để các import runtime cục bộ theo gói như `openclaw/plugin-sdk/*` phân giải sau cập nhật hoặc sửa chữa npm.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` là công tắc tương thích khẩn cấp đã lỗi thời cho lỗi đọc registry. Ưu tiên `plugins registry --refresh` hoặc `openclaw doctor --fix`; fallback env chỉ dành cho khôi phục khởi động khẩn cấp trong khi migration được triển khai.
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
openclaw plugins marketplace refresh
openclaw plugins marketplace refresh --feed-profile <name>
openclaw plugins marketplace refresh --feed-url <url>
openclaw plugins marketplace refresh --expected-sha256 <sha256> --json
```

Danh sách Marketplace chấp nhận đường dẫn marketplace cục bộ, đường dẫn `marketplace.json`, dạng viết tắt GitHub như `owner/repo`, URL repo GitHub, hoặc URL git. `--json` in nhãn nguồn đã phân giải cùng với manifest marketplace đã phân tích cú pháp và các mục Plugin.

Làm mới Marketplace sẽ tải một feed marketplace OpenClaw được lưu trữ và lưu phản hồi
đã xác thực dưới dạng snapshot hosted-feed cục bộ. Nếu không có tùy chọn, lệnh này dùng
hồ sơ feed mặc định đã cấu hình. Dùng `--feed-profile <name>` để làm mới một
hồ sơ đã cấu hình cụ thể, `--feed-url <url>` để làm mới một URL feed được lưu trữ
rõ ràng, `--expected-sha256 <sha256>` để yêu cầu checksum payload khớp
(`sha256:<hex>` hoặc một digest hex 64 ký tự thuần), và `--json` cho
đầu ra máy đọc được. Các URL feed được lưu trữ rõ ràng không được chứa
thông tin xác thực, chuỗi truy vấn, hoặc phân mảnh. Các lần làm mới chưa ghim có thể báo cáo
snapshot được lưu trữ hoặc kết quả dự phòng đi kèm mà không làm lệnh thất bại. Các lần làm mới
đã ghim sẽ thất bại trừ khi chúng chấp nhận một payload được lưu trữ mới, và các lần làm mới được lưu trữ
thành công sẽ thất bại nếu OpenClaw không thể lưu snapshot đã xác thực.

## Liên quan

- [Xây dựng Plugin](/vi/plugins/building-plugins)
- [Tài liệu tham khảo CLI](/vi/cli)
- [ClawHub](/vi/clawhub)
