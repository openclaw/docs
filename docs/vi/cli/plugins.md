---
read_when:
    - Bạn muốn cài đặt hoặc quản lý các Plugin Gateway hay các gói tương thích
    - Bạn muốn dựng khung hoặc xác thực một plugin công cụ đơn giản
    - Bạn muốn gỡ lỗi các sự cố tải Plugin
sidebarTitle: Plugins
summary: Tài liệu tham khảo CLI cho `openclaw plugins` (khởi tạo, xây dựng, xác thực, liệt kê, cài đặt, marketplace, gỡ cài đặt, bật/tắt, chẩn đoán)
title: Plugin
x-i18n:
    generated_at: "2026-07-20T04:19:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8db98bf732151009ca09a38c0f56d6e9feb185812196fdfa946bc0949aa09d1f
    source_path: cli/plugins.md
    workflow: 16
---

Quản lý các plugin Gateway, gói hook và các bundle tương thích.

<CardGroup cols={2}>
  <Card title="Hệ thống plugin" href="/vi/tools/plugin">
    Hướng dẫn dành cho người dùng cuối về cách cài đặt, bật và khắc phục sự cố plugin.
  </Card>
  <Card title="Quản lý plugin" href="/vi/plugins/manage-plugins">
    Các ví dụ nhanh về cài đặt, liệt kê, cập nhật, gỡ cài đặt và phát hành.
  </Card>
  <Card title="Bundle plugin" href="/vi/plugins/bundles">
    Mô hình tương thích của bundle.
  </Card>
  <Card title="Manifest plugin" href="/vi/plugins/manifest">
    Các trường manifest và schema cấu hình.
  </Card>
  <Card title="Bảo mật" href="/vi/gateway/security">
    Gia cố bảo mật cho việc cài đặt plugin.
  </Card>
</CardGroup>

## Lệnh

```bash
openclaw plugins list [--enabled] [--verbose] [--json]
openclaw plugins search <query> [--limit <n>] [--json]
openclaw plugins install <path-or-spec> [--link] [--force] [--pin] [--marketplace <source>]
openclaw plugins inspect <id> [--runtime] [--json]
openclaw plugins inspect --all [--runtime] [--json]
openclaw plugins info <id>                    # bí danh của inspect
openclaw plugins enable <id>
openclaw plugins disable <id>
openclaw plugins uninstall <id> [--dry-run] [--keep-files] [--force]
openclaw plugins update <id-or-npm-spec> | --all [--dry-run]
openclaw plugins registry [--refresh] [--json]
openclaw plugins doctor
openclaw plugins init <id> [--name <name>] [--type tool|provider] [--directory <path>]
openclaw plugins build [--entry <path>] [--check]
openclaw plugins validate [--entry <path>]
openclaw plugins marketplace entries [--offline] [--feed-profile <name>] [--json]
openclaw plugins marketplace list <source> [--json]
openclaw plugins marketplace refresh [--feed-profile <name>] [--expected-sha256 <sha256>] [--json]
```

Để điều tra thao tác cài đặt, kiểm tra, gỡ cài đặt hoặc làm mới registry bị chậm, hãy chạy
lệnh với `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`. Dấu vết ghi thời gian của từng giai đoạn
vào stderr và giữ cho đầu ra JSON có thể phân tích được. Xem [Gỡ lỗi](/vi/help/debugging#plugin-lifecycle-trace).

<Note>
Trong chế độ Nix (`OPENCLAW_NIX_MODE=1`), `openclaw.json` là bất biến. `install`, `update`, `uninstall`, `enable` và `disable` đều từ chối chạy. Thay vào đó, hãy chỉnh sửa nguồn Nix cho bản cài đặt này (`programs.openclaw.config` hoặc `instances.<name>.config` đối với nix-openclaw), rồi build lại. Xem [Bắt đầu nhanh](https://github.com/openclaw/nix-openclaw#quick-start) ưu tiên agent.
</Note>

<Note>
Các plugin đi kèm được phân phối cùng OpenClaw. Một số được bật theo mặc định (ví dụ: các nhà cung cấp mô hình đi kèm, các nhà cung cấp giọng nói đi kèm và plugin trình duyệt đi kèm); số khác yêu cầu `plugins enable`.

Các plugin OpenClaw nguyên bản cung cấp `openclaw.plugin.json` cùng một JSON Schema nội tuyến (`configSchema`, ngay cả khi trống). Các bundle tương thích sử dụng manifest bundle riêng.

`plugins list` hiển thị `Format: openclaw` hoặc `Format: bundle`. Đầu ra danh sách/thông tin chi tiết cũng hiển thị kiểu con của bundle (`codex`, `claude` hoặc `cursor`) cùng các khả năng bundle được phát hiện.
</Note>

## Phát triển

```bash
openclaw plugins init stock-quotes --name "Stock Quotes"
cd stock-quotes
npm run plugin:build
npm run plugin:validate
```

Theo mặc định, `plugins init` tạo một plugin công cụ TypeScript tối giản. Đối số
đầu tiên là id plugin; `--name` đặt tên hiển thị. OpenClaw sử dụng
id cho thư mục đầu ra mặc định và cách đặt tên gói. Các scaffold công cụ sử dụng
`defineToolPlugin` và tạo các script `package.json` `plugin:build` và
`plugin:validate`; chúng build rồi gọi `openclaw plugins build`/`validate`.

`plugins build` nhập entry đã build, đọc metadata tĩnh của công cụ, ghi
`openclaw.plugin.json` và giữ cho `openclaw.extensions` của `package.json` đồng bộ.
`plugins validate` kiểm tra rằng manifest được tạo, metadata gói và
export entry hiện tại vẫn khớp nhau. Xem [Plugin công cụ](/vi/plugins/tool-plugins) để biết
toàn bộ quy trình phát triển.

Scaffold ghi mã nguồn TypeScript nhưng tạo metadata từ entry
`./dist/index.js` đã build, vì vậy quy trình này cũng hoạt động với CLI đã phát hành. Dùng
`--entry <path>` khi entry không phải entry mặc định của gói. Dùng
`plugins build --check` trong CI để báo lỗi khi metadata được tạo đã lỗi thời mà không
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

Các scaffold nhà cung cấp tạo một plugin nhà cung cấp mô hình tương thích với OpenAI
dạng tổng quát, có luồng xác thực bằng khóa API, một script `npm run validate` chạy
`clawhub package validate`, metadata gói ClawHub và một quy trình GitHub Actions
được kích hoạt thủ công để hỗ trợ phát hành tin cậy qua GitHub
OIDC trong tương lai. Scaffold nhà cung cấp không tạo skill và không dùng
`openclaw plugins build`/`validate`; các lệnh đó dành cho quy trình metadata
được tạo của scaffold công cụ.

Trước khi phát hành, hãy thay URL cơ sở API giữ chỗ, danh mục mô hình, route tài liệu,
nội dung thông tin xác thực và nội dung README bằng thông tin thực tế của nhà cung cấp. Dùng
README được tạo để phát hành lần đầu lên ClawHub và thiết lập nhà phát hành tin cậy.

## Cài đặt

```bash
openclaw plugins search "calendar"                      # tìm kiếm plugin ClawHub
openclaw plugins install @openclaw/<package>            # danh mục chính thức đáng tin cậy
openclaw plugins install <package>                       # gói npm bất kỳ
openclaw plugins install clawhub:<package>                # chỉ ClawHub
openclaw plugins install npm:<package>                    # chỉ npm
openclaw plugins install npm-pack:<path.tgz>               # tarball npm-pack cục bộ
openclaw plugins install git:github.com/<owner>/<repo>     # kho git
openclaw plugins install git:github.com/<owner>/<repo>@<ref>
openclaw plugins install <path>                            # đường dẫn hoặc tệp lưu trữ cục bộ
openclaw plugins install -l <path>                         # liên kết thay vì sao chép
openclaw plugins install <plugin>@<marketplace>             # dạng viết tắt của marketplace
openclaw plugins install <plugin> --marketplace <name>      # marketplace (tường minh)
openclaw plugins install <package> --force                  # xác nhận nguồn / ghi đè bản hiện có
openclaw plugins install <package> --pin                    # ghim phiên bản npm đã phân giải
openclaw plugins install clawhub:<package> --acknowledge-clawhub-risk
openclaw plugins install <package> --dangerously-force-unsafe-install
```

Người bảo trì kiểm thử các lượt cài đặt trong quá trình thiết lập có thể ghi đè
nguồn cài đặt plugin tự động bằng các biến môi trường được bảo vệ. Xem
[Ghi đè cài đặt plugin](/vi/plugins/install-overrides).

<Warning>
Trong giai đoạn chuyển đổi khi ra mắt, tên gói thuần túy được cài đặt từ npm theo mặc định, trừ khi chúng khớp với id của plugin đi kèm hoặc plugin chính thức; trong trường hợp đó, OpenClaw dùng bản sao cục bộ/chính thức thay vì truy cập registry npm. Dùng `npm:<package>` khi bạn chủ ý muốn dùng một gói npm bên ngoài. Dùng `clawhub:<package>` cho ClawHub. Hãy coi việc cài đặt plugin như chạy mã; ưu tiên các phiên bản được ghim.
</Warning>

<Warning>
Các gói ClawHub và danh mục đi kèm/chính thức của OpenClaw là những nguồn cài đặt
đáng tin cậy. Một nguồn npm bất kỳ mới, `npm-pack:`, git, đường dẫn/tệp lưu trữ cục bộ hoặc
marketplace sẽ cảnh báo và yêu cầu xác nhận trước khi tiếp tục. Các lượt cài đặt tùy ý
không tương tác phải truyền `--force` sau khi bạn xem xét và tin cậy nguồn. Cờ này
cũng ghi đè mục tiêu cài đặt hiện có khi cần. Các bản cập nhật thông thường của một
bản cài đặt đã được theo dõi không yêu cầu cờ này. Xác nhận này tách biệt với
`--acknowledge-clawhub-risk`, vốn chỉ áp dụng cho cảnh báo độ tin cậy của bản phát hành ClawHub
có rủi ro. `--force` không bỏ qua `security.installPolicy` hoặc các bước
kiểm tra an toàn cài đặt còn lại.
</Warning>

`plugins search` truy vấn ClawHub để tìm các gói `code-plugin` và
`bundle-plugin` có thể cài đặt (không phải skill; dùng `openclaw skills search` cho chúng).
Giá trị `--limit` mặc định là 20, tối đa 100. Lệnh này chỉ đọc danh mục từ xa: không
kiểm tra trạng thái cục bộ, thay đổi cấu hình, cài đặt gói hoặc tải runtime
plugin. Kết quả bao gồm tên gói ClawHub, họ, kênh, phiên bản,
tóm tắt và gợi ý cài đặt như `openclaw plugins install clawhub:<package>`.

<Note>
ClawHub là bề mặt phân phối và khám phá chính cho hầu hết plugin. Npm
vẫn là phương án dự phòng được hỗ trợ và là đường dẫn cài đặt trực tiếp. Các gói plugin
`@openclaw/*` do OpenClaw sở hữu đã được phát hành lại trên npm; xem danh sách hiện tại
tại [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) hoặc
[danh mục plugin](/vi/plugins/plugin-inventory). Các bản cài đặt ổn định dùng `latest`.
Các lượt cài đặt và cập nhật trên kênh beta ưu tiên dist-tag npm `beta` khi có,
nếu không sẽ dùng `latest`. Trên kênh ổn định mở rộng, các plugin npm chính thức
có ý định thuần túy/mặc định hoặc `latest` sẽ được phân giải thành đúng phiên bản core
đã cài đặt. Các phiên bản ghim chính xác và tag không phải `latest` được chỉ định rõ, gói bên thứ ba và
nguồn không phải npm sẽ không bị viết lại.
</Note>

<AccordionGroup>
  <Accordion title="Include cấu hình và sửa chữa cấu hình không hợp lệ">
    Nếu phần `plugins` được hỗ trợ bởi một `$include` dạng một tệp, `plugins install/update/enable/disable/uninstall` sẽ ghi xuyên vào tệp được include đó và giữ nguyên `openclaw.json`. Include ở gốc, mảng include và include có ghi đè ngang hàng sẽ dừng an toàn thay vì làm phẳng. Xem [Include cấu hình](/vi/gateway/configuration) để biết các dạng được hỗ trợ.

    Nếu cấu hình không hợp lệ trong quá trình cài đặt, `plugins install` thường dừng an toàn và yêu cầu bạn chạy `openclaw doctor --fix` trước. Trong quá trình khởi động Gateway và tải lại nóng, cấu hình plugin không hợp lệ sẽ dừng an toàn như mọi cấu hình không hợp lệ khác; `openclaw doctor --fix` có thể cách ly mục plugin không hợp lệ. Ngoại lệ duy nhất được ghi nhận trong quá trình cài đặt là một đường dẫn khôi phục hẹp dành cho plugin đi kèm chủ động chọn dùng `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="Xác nhận --force và cài đặt lại so với cập nhật">
    `--force` xác nhận một nguồn không phải ClawHub mà không nhắc hỏi. Nó không bỏ qua `security.installPolicy` hoặc các bước kiểm tra an toàn cài đặt còn lại. Khi plugin hoặc gói hook đã được cài đặt, nó cũng tái sử dụng mục tiêu hiện có và ghi đè tại chỗ. Hãy dùng sau khi xem xét một nguồn npm tùy ý, cục bộ, tệp lưu trữ, git hoặc marketplace, hoặc khi chủ ý cài đặt lại cùng một id. Đối với các nâng cấp định kỳ của plugin npm đã được theo dõi, ưu tiên `openclaw plugins update <id-or-npm-spec>`.

    Nếu bạn chạy `plugins install` cho một id plugin đã được cài đặt, OpenClaw sẽ dừng và hướng bạn đến `plugins update <id-or-npm-spec>` để nâng cấp thông thường, hoặc đến `plugins install <package> --force` khi bạn thực sự muốn ghi đè bản cài đặt hiện tại từ một nguồn khác. Các nguồn tùy ý vẫn hiển thị cảnh báo tương tác về nguồn gốc; các lượt cài đặt không tương tác phải truyền `--force` sau khi xem xét. Các nguồn ClawHub và danh mục OpenClaw đáng tin cậy không cần cờ này. Với `--link`, `--force` xác nhận nguồn nhưng không thay đổi chế độ cài đặt bằng đường dẫn liên kết.

  </Accordion>
  <Accordion title="Phạm vi của --pin">
    `--pin` chỉ áp dụng cho các lượt cài đặt npm và ghi lại `<name>@<version>` chính xác đã được phân giải. Tùy chọn này không được hỗ trợ với các lượt cài đặt `git:` (thay vào đó, hãy ghim ref trong đặc tả, ví dụ `git:github.com/acme/plugin@v1.2.3`) hoặc với `--marketplace` (các lượt cài đặt marketplace lưu metadata nguồn marketplace thay vì đặc tả npm).
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` đã bị phản đối sử dụng và giờ không thực hiện thao tác nào. OpenClaw không còn chạy cơ chế chặn mã nguy hiểm tích hợp trong quá trình cài đặt plugin.

    Sử dụng bề mặt `security.installPolicy` do người vận hành sở hữu khi cần chính sách cài đặt dành riêng cho máy chủ. Các hook `before_install` của Plugin là hook vòng đời runtime Plugin, không phải ranh giới chính sách chính cho việc cài đặt qua CLI.

    Nếu một Plugin bạn đã phát hành trên ClawHub bị ẩn hoặc chặn bởi quá trình quét registry, hãy làm theo các bước dành cho nhà phát hành trong [Phát hành trên ClawHub](/vi/clawhub/publishing). `--dangerously-force-unsafe-install` không yêu cầu ClawHub quét lại Plugin hoặc công khai một bản phát hành bị chặn.

  </Accordion>
  <Accordion title="--acknowledge-clawhub-risk">
    Các lượt cài đặt từ ClawHub cộng đồng kiểm tra hồ sơ tin cậy của bản phát hành đã chọn trước khi tải xuống. Nếu ClawHub vô hiệu hóa tải xuống đối với bản phát hành, báo cáo phát hiện quét độc hại hoặc đưa bản phát hành vào trạng thái kiểm duyệt chặn (cách ly, thu hồi), OpenClaw sẽ từ chối hoàn toàn bất kể cờ này. Đối với các trạng thái quét rủi ro hoặc trạng thái kiểm duyệt không chặn, OpenClaw hiển thị chi tiết tin cậy và yêu cầu xác nhận trước khi tiếp tục.

    Chỉ sử dụng `--acknowledge-clawhub-risk` sau khi xem xét cảnh báo của ClawHub và quyết định tiếp tục mà không cần lời nhắc tương tác. Kết quả quét đang chờ xử lý hoặc đã cũ (chưa sạch) sẽ cảnh báo nhưng không yêu cầu xác nhận. Các gói ClawHub chính thức và nguồn Plugin OpenClaw đi kèm hoàn toàn bỏ qua bước kiểm tra độ tin cậy của bản phát hành này.

  </Accordion>
  <Accordion title="Gói hook và đặc tả npm">
    `plugins install` cũng là bề mặt cài đặt dành cho các gói hook cung cấp `openclaw.hooks` trong `package.json`. Sử dụng `openclaw hooks` để lọc khả năng hiển thị hook và bật từng hook, không phải để cài đặt gói.

    Các đặc tả npm **chỉ dành cho registry** (tên gói cộng với **phiên bản chính xác** hoặc **dist-tag** tùy chọn). Các đặc tả Git/URL/tệp và dải semver đều bị từ chối. Để bảo đảm an toàn, việc cài đặt phần phụ thuộc chạy trong một dự án npm được quản lý cho mỗi Plugin với `--ignore-scripts`, ngay cả khi shell của bạn có thiết lập cài đặt npm toàn cục. Các dự án npm Plugin được quản lý kế thừa `overrides` npm cấp gói của OpenClaw, vì vậy các ghim bảo mật của máy chủ cũng áp dụng cho phần phụ thuộc Plugin được nâng lên.

    Sử dụng `npm:<package>` để chỉ định rõ việc phân giải npm. Các đặc tả gói thuần cũng được cài đặt trực tiếp từ npm trong quá trình chuyển đổi khi khởi chạy, trừ khi chúng khớp với id Plugin chính thức.

    Các đặc tả `@openclaw/*` thô khớp với Plugin đi kèm sẽ phân giải thành bản đi kèm do image sở hữu trước khi dự phòng sang npm. Ví dụ: `openclaw plugins install @openclaw/discord@2026.5.20 --pin` sử dụng Plugin Discord đi kèm từ bản dựng OpenClaw hiện tại thay vì tạo bản ghi đè npm được quản lý. Để buộc sử dụng gói npm bên ngoài, hãy dùng `openclaw plugins install npm:@openclaw/discord@2026.5.20 --pin`.

    Các đặc tả thuần và `@latest` duy trì trên kênh ổn định. Các phiên bản sửa lỗi có dấu ngày của OpenClaw, chẳng hạn như `2026.5.3-1`, được tính là ổn định trong bước kiểm tra này. Nếu npm phân giải một trong hai dạng thành bản phát hành trước, OpenClaw sẽ dừng và yêu cầu bạn chọn tham gia rõ ràng bằng thẻ bản phát hành trước (`@beta`/`@rc`) hoặc phiên bản phát hành trước chính xác (`@1.2.3-beta.4`).

    Đối với các lượt cài đặt npm không có phiên bản chính xác (`npm:<package>` hoặc `npm:<package>@latest`), OpenClaw kiểm tra siêu dữ liệu gói đã phân giải trước khi cài đặt. Nếu gói ổn định mới nhất yêu cầu API Plugin OpenClaw mới hơn hoặc phiên bản máy chủ tối thiểu cao hơn, OpenClaw sẽ kiểm tra các phiên bản ổn định cũ hơn và cài đặt bản phát hành tương thích mới nhất. Phiên bản chính xác và dist-tag được chỉ định rõ vẫn tuân thủ nghiêm ngặt: lựa chọn không tương thích sẽ thất bại và yêu cầu bạn nâng cấp OpenClaw hoặc chọn một phiên bản tương thích.

    Nếu một đặc tả cài đặt thuần khớp với id Plugin chính thức (ví dụ: `diffs`), OpenClaw sẽ cài đặt trực tiếp mục trong danh mục. Để cài đặt gói npm có cùng tên, hãy sử dụng đặc tả có phạm vi rõ ràng (ví dụ: `@scope/diffs`).

  </Accordion>
  <Accordion title="Kho lưu trữ Git">
    Sử dụng `git:<repo>` để cài đặt trực tiếp từ kho lưu trữ git. Các dạng được hỗ trợ: `git:github.com/owner/repo`, `git:owner/repo`, `https://` đầy đủ, `ssh://`, `git://`, `file://` và URL sao chép `git@host:owner/repo.git`. Thêm `@<ref>` hoặc `#<ref>` để checkout một nhánh, thẻ hoặc commit trước khi cài đặt.

    Quá trình cài đặt Git sao chép vào một thư mục tạm thời, checkout ref được yêu cầu nếu có, sau đó sử dụng trình cài đặt thư mục Plugin thông thường; vì vậy, việc xác thực manifest, chính sách cài đặt của người vận hành, thao tác cài đặt của trình quản lý gói và bản ghi cài đặt hoạt động giống như cài đặt npm. Các lượt cài đặt git được ghi lại bao gồm URL/ref nguồn cùng commit đã phân giải để `openclaw plugins update` có thể phân giải lại nguồn sau này.

    Sau khi cài đặt từ git, hãy sử dụng `openclaw plugins inspect <id> --runtime --json` để xác minh các đăng ký runtime như phương thức Gateway và lệnh CLI. Nếu Plugin đã đăng ký một gốc CLI bằng `api.registerCli`, hãy chạy lệnh đó trực tiếp thông qua CLI gốc của OpenClaw, ví dụ: `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Kho lưu trữ nén">
    Các kho lưu trữ được hỗ trợ: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Kho lưu trữ Plugin OpenClaw gốc phải chứa `openclaw.plugin.json` hợp lệ tại gốc Plugin đã giải nén; các kho lưu trữ chỉ chứa `package.json` sẽ bị từ chối trước khi OpenClaw ghi bản ghi cài đặt.

    Sử dụng `npm-pack:<path.tgz>` khi tệp là tarball npm-pack và bạn muốn
    sử dụng cùng đường dẫn dự án npm được quản lý theo từng Plugin như các lượt cài đặt từ registry,
    bao gồm xác minh `package-lock.json`, quét phần phụ thuộc được nâng lên
    và bản ghi cài đặt npm. Các đường dẫn kho lưu trữ thuần vẫn được cài đặt dưới dạng
    kho lưu trữ cục bộ trong gốc phần mở rộng Plugin.

    Các lượt cài đặt từ marketplace Claude cũng được hỗ trợ.

  </Accordion>
</AccordionGroup>

Các lượt cài đặt ClawHub sử dụng trình định vị `clawhub:<package>` rõ ràng:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Theo mặc định, các đặc tả Plugin thuần an toàn cho npm được cài đặt từ npm trong quá trình chuyển đổi khi khởi chạy, trừ khi chúng khớp với id Plugin chính thức:

```bash
openclaw plugins install openclaw-codex-app-server
```

Sử dụng `npm:` để chỉ định rõ việc chỉ phân giải qua npm:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@openclaw/discord@2026.5.20
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw kiểm tra khả năng tương thích được công bố của API Plugin / Gateway tối thiểu trước khi cài đặt. Khi phiên bản ClawHub được chọn phát hành một artifact ClawPack, OpenClaw tải xuống `.tgz` npm-pack có phiên bản, xác minh header digest ClawHub và digest artifact, sau đó cài đặt thông qua đường dẫn kho lưu trữ thông thường. Các phiên bản ClawHub cũ hơn không có siêu dữ liệu ClawPack vẫn được cài đặt thông qua đường dẫn xác minh kho lưu trữ gói cũ. Các lượt cài đặt được ghi lại giữ nguyên siêu dữ liệu nguồn ClawHub, loại artifact, tính toàn vẹn npm, shasum npm, tên tarball và thông tin digest ClawPack để phục vụ các lần cập nhật sau.
Các lượt cài đặt ClawHub không chỉ định phiên bản giữ đặc tả đã ghi không có phiên bản để `openclaw plugins update` có thể theo các bản phát hành ClawHub mới hơn; các bộ chọn phiên bản hoặc thẻ rõ ràng như `clawhub:pkg@1.2.3` và `clawhub:pkg@beta` vẫn được ghim vào bộ chọn đó.

### Cú pháp rút gọn của marketplace

Sử dụng cú pháp rút gọn `plugin@marketplace` khi tên marketplace tồn tại trong bộ nhớ đệm registry cục bộ của Claude tại `~/.claude/plugins/known_marketplaces.json`:

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

Sử dụng `--marketplace` để truyền rõ nguồn marketplace:

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

<Tabs>
  <Tab title="Nguồn marketplace">
    - một tên marketplace đã biết của Claude từ `~/.claude/plugins/known_marketplaces.json`
    - một gốc marketplace cục bộ hoặc đường dẫn `marketplace.json`
    - một cú pháp rút gọn kho lưu trữ GitHub như `owner/repo`
    - một URL kho lưu trữ GitHub như `https://github.com/owner/repo`
    - một URL git

  </Tab>
  <Tab title="Quy tắc marketplace từ xa">
    Đối với các marketplace từ xa được tải từ GitHub hoặc git, các mục Plugin phải nằm trong kho lưu trữ marketplace đã sao chép. OpenClaw chấp nhận nguồn đường dẫn tương đối từ kho lưu trữ đó và từ chối các nguồn Plugin HTTP(S), đường dẫn tuyệt đối, git, GitHub và các nguồn không phải đường dẫn khác từ manifest từ xa.
  </Tab>
</Tabs>

Đối với đường dẫn và kho lưu trữ cục bộ, OpenClaw tự động phát hiện:

- Plugin OpenClaw gốc (`openclaw.plugin.json`)
- gói tương thích với Codex (`.codex-plugin/plugin.json`)
- gói tương thích với Claude (`.claude-plugin/plugin.json`, hoặc bố cục thành phần Claude mặc định khi không có tệp manifest đó)
- gói tương thích với Cursor (`.cursor-plugin/plugin.json`)

Các lượt cài đặt cục bộ được quản lý phải là thư mục hoặc kho lưu trữ Plugin. Các tệp Plugin `.js`,
`.mjs`, `.cjs` và `.ts` độc lập không được `plugins install` sao chép vào gốc Plugin
được quản lý, cũng không được tải bằng cách đặt trực tiếp trong
`~/.openclaw/extensions` hoặc `<workspace>/.openclaw/extensions`; các gốc
được tự động phát hiện đó tải thư mục gói hoặc gói tương thích Plugin và bỏ qua
các tệp script cấp cao nhất vì coi chúng là trình trợ giúp cục bộ. Thay vào đó, hãy liệt kê rõ các tệp độc lập trong
`plugins.load.paths`.

<Note>
Các gói tương thích được cài đặt vào gốc Plugin thông thường và tham gia cùng luồng liệt kê/thông tin/bật/tắt. Hiện tại, hệ thống hỗ trợ Skills trong gói, command-skill Claude, giá trị mặc định `settings.json` của Claude, giá trị mặc định `.lsp.json` của Claude / `lspServers` được khai báo trong manifest, command-skill Cursor và các thư mục hook tương thích với Codex; các khả năng gói khác được phát hiện sẽ hiển thị trong chẩn đoán/thông tin nhưng chưa được kết nối với quá trình thực thi runtime.
</Note>

Sử dụng `-l`/`--link` để trỏ đến một thư mục Plugin cục bộ mà không sao chép (thêm
vào `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

`--link` không được hỗ trợ với các lượt cài đặt `--marketplace` hoặc `git:`, và
yêu cầu một đường dẫn cục bộ đã tồn tại. Đối với liên kết cục bộ không tương tác,
hãy truyền `--force` sau khi xem xét nguồn; tùy chọn này xác nhận nguồn gốc nhưng không
sao chép hoặc ghi đè thư mục được liên kết.

<Note>
Các Plugin có nguồn gốc từ workspace được phát hiện trong gốc phần mở rộng của workspace sẽ không được
nhập hoặc thực thi cho đến khi được bật rõ ràng. Để phát triển cục bộ,
hãy chạy `openclaw plugins enable <plugin-id>` hoặc đặt
`plugins.entries.<plugin-id>.enabled: true`; nếu cấu hình của bạn sử dụng
`plugins.allow`, hãy thêm cùng id Plugin vào đó. Quy tắc từ chối theo mặc định này
cũng áp dụng khi quá trình thiết lập kênh nhắm rõ đến một Plugin có nguồn gốc từ workspace để
chỉ tải phục vụ thiết lập; do đó, mã thiết lập Plugin kênh cục bộ sẽ không chạy khi
Plugin workspace đó vẫn bị tắt hoặc bị loại khỏi danh sách cho phép. Các lượt cài đặt được liên kết
và mục `plugins.load.paths` rõ ràng tuân theo chính sách thông thường dành cho
nguồn gốc Plugin đã phân giải. Xem
[Cấu hình chính sách Plugin](/vi/tools/plugin#configure-plugin-policy)
và [Tham chiếu cấu hình](/vi/gateway/configuration-reference#plugins).

Sử dụng `--pin` trong các lượt cài đặt npm để lưu đặc tả chính xác đã phân giải (`name@version`) vào chỉ mục Plugin được quản lý, đồng thời vẫn giữ hành vi mặc định là không ghim.
</Note>

## Liệt kê

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
  Chuyển từ chế độ xem bảng sang các dòng chi tiết theo từng Plugin với siêu dữ liệu định dạng/nguồn/xuất xứ/phiên bản/kích hoạt.
</ParamField>
<ParamField path="--json" type="boolean">
  Danh mục có thể đọc bằng máy cùng chẩn đoán registry và trạng thái cài đặt phần phụ thuộc gói.
</ParamField>

<Note>
`plugins list` đọc sổ đăng ký plugin cục bộ đã lưu trước tiên, với phương án dự phòng được suy ra chỉ từ manifest khi sổ đăng ký bị thiếu hoặc không hợp lệ. Lệnh này hữu ích để kiểm tra xem một plugin đã được cài đặt, bật và hiển thị cho quá trình lập kế hoạch khởi động lạnh hay chưa, nhưng không phải là phép thăm dò runtime trực tiếp đối với một tiến trình Gateway đang chạy. Sau khi thay đổi mã plugin, trạng thái bật, chính sách hook hoặc `plugins.load.paths`, hãy khởi động lại Gateway phục vụ kênh trước khi kỳ vọng mã hoặc hook `register(api)` mới chạy. Đối với các bản triển khai từ xa/trong container, hãy xác minh rằng bạn đang khởi động lại tiến trình con `openclaw gateway run` thực tế, chứ không chỉ tiến trình bao bọc.

`plugins list --json` bao gồm `dependencyStatus` của từng plugin từ `package.json`
`dependencies` và `optionalDependencies`. OpenClaw kiểm tra xem các tên gói đó
có hiện diện trên đường dẫn tra cứu Node `node_modules` thông thường của plugin hay không; hệ thống
không nhập mã runtime của plugin, chạy trình quản lý gói hoặc sửa chữa các
phần phụ thuộc bị thiếu.
</Note>

Nếu nhật ký khởi động ghi `plugins.allow is empty; discovered non-bundled plugins may auto-load: ...`,
hãy chạy `openclaw plugins list --enabled --verbose` hoặc
`openclaw plugins inspect <id>` với một id plugin được liệt kê để xác nhận các
id plugin và sao chép các id đáng tin cậy vào `plugins.allow` trong `openclaw.json`. Khi
cảnh báo có thể liệt kê mọi plugin đã phát hiện, cảnh báo sẽ in một đoạn mã
`plugins.allow` sẵn sàng để dán, trong đó đã bao gồm các id đó. Nếu một plugin tải
mà không có thông tin nguồn gốc cài đặt/đường dẫn tải, hãy kiểm tra id plugin đó, sau đó ghim
id đáng tin cậy trong `plugins.allow` hoặc cài đặt lại plugin từ một nguồn đáng tin cậy
để OpenClaw ghi lại nguồn gốc cài đặt.

Đối với công việc trên plugin đi kèm bên trong một ảnh Docker đã đóng gói, hãy bind-mount thư mục
mã nguồn plugin đè lên đường dẫn mã nguồn đã đóng gói tương ứng, chẳng hạn như
`/app/extensions/synology-chat`. OpenClaw phát hiện lớp phủ mã nguồn đã mount đó
trước `/app/dist/extensions/synology-chat`; một thư mục mã nguồn chỉ được sao chép
vẫn không hoạt động, vì vậy các bản cài đặt đóng gói thông thường vẫn sử dụng dist đã biên dịch.

Để gỡ lỗi hook runtime:

- `openclaw plugins inspect <id> --runtime --json` hiển thị các hook đã đăng ký và thông tin chẩn đoán từ một lượt kiểm tra có tải mô-đun. Việc kiểm tra runtime không bao giờ cài đặt phần phụ thuộc; hãy dùng `openclaw doctor --fix` để dọn dẹp trạng thái phần phụ thuộc cũ hoặc khôi phục các plugin có thể tải xuống bị thiếu nhưng được cấu hình tham chiếu.
- `openclaw gateway status --deep --require-rpc` xác nhận URL/hồ sơ Gateway có thể truy cập, gợi ý về dịch vụ/tiến trình, đường dẫn cấu hình và tình trạng RPC.
- Các hook hội thoại không đi kèm (`llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize`, `agent_end`) yêu cầu `plugins.entries.<id>.hooks.allowConversationAccess=true`.

### Chỉ mục plugin

Siêu dữ liệu cài đặt plugin là trạng thái do máy quản lý, không phải cấu hình người dùng. Các thao tác cài đặt và cập nhật ghi dữ liệu này vào cơ sở dữ liệu trạng thái SQLite dùng chung trong thư mục trạng thái OpenClaw đang hoạt động. Hàng `installed_plugin_index` lưu trữ siêu dữ liệu `installRecords` lâu bền, bao gồm các bản ghi dành cho manifest plugin bị lỗi hoặc bị thiếu, cùng bộ nhớ đệm sổ đăng ký lạnh được suy ra từ manifest mà `openclaw plugins update`, thao tác gỡ cài đặt, chẩn đoán và sổ đăng ký plugin lạnh sử dụng.

`plugins.installs` là một bề mặt cấu hình do người dùng tạo đã ngừng sử dụng. Runtime và các lệnh cập nhật chỉ đọc chỉ mục plugin đã cài đặt trong SQLite. Hãy chạy `openclaw doctor --fix` để nhập các bản ghi cấu hình cũ vào chỉ mục và xóa khóa đã ngừng sử dụng trước khi vận hành runtime bình thường.

## Gỡ cài đặt

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
openclaw plugins uninstall <id> --force
```

`uninstall` xóa các bản ghi plugin khỏi `plugins.entries`, chỉ mục plugin đã lưu, các mục trong danh sách cho phép/từ chối plugin và các mục `plugins.load.paths` được liên kết khi áp dụng. Trừ khi đặt `--keep-files`, thao tác gỡ cài đặt cũng xóa thư mục cài đặt được quản lý đang được theo dõi, nhưng chỉ khi thư mục đó phân giải nằm bên trong thư mục gốc phần mở rộng plugin của OpenClaw. Nếu plugin hiện sở hữu vị trí `memory` hoặc `contextEngine`, vị trí đó sẽ được đặt lại về giá trị mặc định (`memory-core` cho bộ nhớ, `legacy` cho công cụ ngữ cảnh).

`uninstall` in bản xem trước nội dung sẽ bị xóa, sau đó nhắc `Uninstall plugin "<id>"?` trước khi thực hiện thay đổi. Truyền `--force` để bỏ qua lời nhắc xác nhận (hữu ích cho tập lệnh và các lượt chạy không tương tác); nếu không có tùy chọn này, thao tác gỡ cài đặt yêu cầu một TTY tương tác. `--dry-run` in cùng bản xem trước rồi thoát mà không nhắc hoặc thay đổi bất kỳ nội dung nào.

<Note>
`--keep-config` được hỗ trợ dưới dạng bí danh không còn được khuyến nghị cho `--keep-files`.
</Note>

## Cập nhật

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call
openclaw plugins update @acme/demo
openclaw plugins update openclaw-codex-app-server --acknowledge-clawhub-risk
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

Các bản cập nhật áp dụng cho các bản cài đặt plugin được theo dõi trong chỉ mục plugin được quản lý và các bản cài đặt gói hook được theo dõi trong `hooks.internal.installs`. Chúng tái sử dụng nguồn mà người dùng đã chọn khi cài đặt plugin, vì vậy không yêu cầu xác nhận nguồn lần thứ hai.

<AccordionGroup>
  <Accordion title="Phân giải id plugin so với đặc tả npm">
    Khi truyền một id plugin, OpenClaw tái sử dụng đặc tả cài đặt đã ghi cho plugin đó. Điều này có nghĩa là các dist-tag đã lưu trước đó như `@beta` và các phiên bản được ghim chính xác sẽ tiếp tục được sử dụng trong các lượt chạy `update <id>` sau này.

    Trong `update <id> --dry-run`, các bản cài đặt npm được ghim phiên bản chính xác vẫn được ghim. Nếu OpenClaw cũng có thể phân giải dòng mặc định trong sổ đăng ký của gói và dòng mặc định đó mới hơn phiên bản được ghim đã cài đặt, lượt chạy thử sẽ báo cáo bản ghim và in lệnh cập nhật gói `@latest` cụ thể để chuyển sang dòng mặc định của sổ đăng ký.

    Quy tắc cập nhật có mục tiêu đó khác với đường dẫn bảo trì hàng loạt `openclaw plugins update --all`. Các bản cập nhật hàng loạt vẫn tuân theo các đặc tả cài đặt thông thường được theo dõi, nhưng các bản ghi plugin OpenClaw chính thức đáng tin cậy có thể đồng bộ với mục tiêu danh mục chính thức hiện tại thay vì tiếp tục dùng một gói chính thức chính xác đã lỗi thời. Hãy dùng `update <id>` có mục tiêu khi bạn chủ ý muốn giữ nguyên một đặc tả chính thức chính xác hoặc có thẻ.

    Đối với các bản cài đặt npm, bạn cũng có thể truyền một đặc tả gói npm rõ ràng kèm dist-tag hoặc phiên bản chính xác. OpenClaw phân giải tên gói đó ngược về bản ghi plugin được theo dõi, cập nhật plugin đã cài đặt và ghi lại đặc tả npm mới cho các bản cập nhật dựa trên id trong tương lai.

    Việc truyền tên gói npm không kèm phiên bản hoặc thẻ cũng phân giải ngược về bản ghi plugin được theo dõi. Hãy dùng cách này khi một plugin được ghim vào phiên bản chính xác và bạn muốn chuyển nó trở lại dòng phát hành mặc định của sổ đăng ký.

  </Accordion>
  <Accordion title="Cập nhật kênh beta">
    `openclaw plugins update <id-or-npm-spec>` có mục tiêu tái sử dụng đặc tả plugin được theo dõi trừ khi bạn truyền một đặc tả mới. `openclaw plugins update --all` hàng loạt sử dụng `update.channel` đã cấu hình khi đồng bộ các bản ghi plugin chính thức đáng tin cậy với mục tiêu danh mục chính thức, nhờ đó các bản cài đặt trên kênh beta có thể tiếp tục ở dòng phát hành beta thay vì bị âm thầm chuẩn hóa về stable/latest.

    `openclaw update` cũng biết kênh cập nhật OpenClaw đang hoạt động: trên kênh beta, các bản ghi plugin npm theo dòng mặc định và ClawHub sẽ thử `@beta` trước. Chúng quay về đặc tả default/latest đã ghi nếu không có bản phát hành beta của plugin; các plugin npm cũng quay về khi gói beta tồn tại nhưng không vượt qua quá trình xác thực cài đặt. Phương án dự phòng đó được báo cáo dưới dạng cảnh báo và không làm bản cập nhật lõi thất bại. Các phiên bản chính xác và thẻ rõ ràng vẫn được ghim vào bộ chọn đó cho các bản cập nhật có mục tiêu.

  </Accordion>
  <Accordion title="Kiểm tra phiên bản và sai lệch tính toàn vẹn">
    Trước một bản cập nhật npm thực tế, OpenClaw kiểm tra phiên bản gói đã cài đặt dựa trên siêu dữ liệu sổ đăng ký npm. Nếu phiên bản đã cài đặt và danh tính cấu phần đã ghi khớp với mục tiêu được phân giải, bản cập nhật sẽ bị bỏ qua mà không tải xuống, cài đặt lại hoặc ghi lại `openclaw.json`.

    Khi có hàm băm tính toàn vẹn đã lưu và hàm băm cấu phần được tải về thay đổi, OpenClaw coi đó là sai lệch cấu phần npm. Lệnh `openclaw plugins update` tương tác in các hàm băm dự kiến và thực tế rồi yêu cầu xác nhận trước khi tiếp tục. Các trình trợ giúp cập nhật không tương tác sẽ từ chối tiếp tục theo mặc định trừ khi bên gọi cung cấp một chính sách tiếp tục rõ ràng.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install khi cập nhật">
    `--dangerously-force-unsafe-install` cũng được chấp nhận trên `plugins update` để tương thích, nhưng tùy chọn này không còn được khuyến nghị và không còn thay đổi hành vi cập nhật plugin. `security.installPolicy` của người vận hành vẫn có thể chặn các bản cập nhật; các hook `before_install` của plugin chỉ áp dụng trong những tiến trình đã tải hook plugin.
  </Accordion>
  <Accordion title="--acknowledge-clawhub-risk khi cập nhật">
    Các bản cập nhật plugin cộng đồng dựa trên ClawHub chạy cùng phép kiểm tra độ tin cậy của bản phát hành chính xác như khi cài đặt trước khi tải xuống gói thay thế. Hãy dùng `--acknowledge-clawhub-risk` cho quy trình tự động hóa đã được xem xét cần tiếp tục khi bản phát hành ClawHub được chọn có cảnh báo độ tin cậy rủi ro. Các gói ClawHub chính thức và nguồn plugin OpenClaw đi kèm bỏ qua lời nhắc về độ tin cậy của bản phát hành này.
  </Accordion>
</AccordionGroup>

## Kiểm tra

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
openclaw plugins inspect --all
```

Thao tác kiểm tra hiển thị danh tính, trạng thái tải, nguồn, các khả năng trong manifest, cờ chính sách, thông tin chẩn đoán, siêu dữ liệu cài đặt, khả năng gói và mọi hỗ trợ máy chủ MCP hoặc LSP được phát hiện mà mặc định không nhập runtime của plugin. Đầu ra JSON bao gồm các hợp đồng manifest plugin, chẳng hạn như `contracts.agentToolResultMiddleware` và `contracts.trustedToolPolicies`, để người vận hành có thể kiểm tra các khai báo bề mặt đáng tin cậy trước khi bật hoặc khởi động lại plugin. Thêm `--runtime` để tải mô-đun plugin và bao gồm các hook, công cụ, lệnh, dịch vụ, phương thức Gateway và tuyến HTTP đã đăng ký. Việc kiểm tra runtime báo cáo trực tiếp các phần phụ thuộc plugin bị thiếu; các thao tác cài đặt và sửa chữa vẫn nằm trong `openclaw plugins install`, `openclaw plugins update` và `openclaw doctor --fix`.

Các lệnh CLI do plugin sở hữu thường được cài đặt dưới dạng các nhóm lệnh `openclaw` cấp gốc, nhưng plugin cũng có thể đăng ký các lệnh lồng nhau dưới một lệnh cha của lõi như `openclaw nodes`. Sau khi `inspect --runtime` hiển thị một lệnh dưới `cliCommands`, hãy chạy lệnh đó tại đường dẫn được liệt kê; ví dụ, một plugin đăng ký `demo-git` có thể được xác minh bằng `openclaw demo-git ping`.

Mỗi plugin được phân loại theo nội dung mà nó thực sự đăng ký tại runtime:

| Dạng                | Ý nghĩa                                                           |
| ------------------- | ----------------------------------------------------------------- |
| `plain-capability`  | chính xác một loại khả năng (ví dụ: plugin chỉ dành cho nhà cung cấp) |
| `hybrid-capability` | nhiều hơn một loại khả năng (ví dụ: văn bản + giọng nói + hình ảnh) |
| `hook-only`         | chỉ có hook, không có khả năng, công cụ, lệnh, dịch vụ hoặc tuyến |
| `non-capability`    | có công cụ/lệnh/dịch vụ nhưng không có khả năng                   |

Xem [Các dạng plugin](/vi/plugins/architecture#plugin-shapes) để biết thêm về mô hình khả năng.

<Note>
Cờ `--json` xuất báo cáo mà máy có thể đọc, phù hợp cho việc viết tập lệnh và kiểm tra. `inspect --all` hiển thị một bảng trên toàn bộ hệ thống với các cột dạng, loại khả năng, thông báo tương thích, khả năng gói và tóm tắt hook. `info` là bí danh của `inspect`.
</Note>

## Chẩn đoán

```bash
openclaw plugins doctor
```

`doctor` báo cáo lỗi tải plugin, thông tin chẩn đoán manifest/phát hiện, thông báo tương thích và các tham chiếu cấu hình plugin lỗi thời như vị trí plugin bị thiếu. Khi cây cài đặt và cấu hình plugin sạch, lệnh in `No plugin issues detected.` Nếu cấu hình lỗi thời vẫn còn nhưng cây cài đặt không có vấn đề nào khác, phần tóm tắt sẽ nêu rõ điều đó thay vì ngụ ý rằng plugin hoàn toàn khỏe mạnh.

Nếu một plugin đã được cấu hình có trên đĩa nhưng bị chặn bởi các bước kiểm tra an toàn đường dẫn của trình tải, quá trình xác thực cấu hình sẽ giữ lại mục plugin và báo cáo mục đó là `present but blocked`. Hãy khắc phục chẩn đoán plugin bị chặn ở trước đó, chẳng hạn như quyền sở hữu đường dẫn hoặc quyền cho phép mọi người dùng ghi, thay vì xóa cấu hình `plugins.entries.<id>` hoặc `plugins.allow`.

Đối với các lỗi hình dạng mô-đun như thiếu các export `register`/`activate`, hãy chạy lại với `OPENCLAW_PLUGIN_LOAD_DEBUG=1` để đưa phần tóm tắt ngắn gọn về hình dạng export vào đầu ra chẩn đoán.

## Registry

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Registry plugin cục bộ là mô hình đọc nguội được OpenClaw duy trì bền vững cho danh tính plugin đã cài đặt, trạng thái bật, siêu dữ liệu nguồn và quyền sở hữu phần đóng góp. Quá trình khởi động thông thường, tra cứu chủ sở hữu nhà cung cấp, phân loại thiết lập kênh và kiểm kê plugin có thể đọc mô hình này mà không cần nhập các mô-đun runtime của plugin.

Sử dụng `plugins registry` để kiểm tra xem registry được duy trì bền vững có tồn tại, hiện hành hay đã lỗi thời hay không. Sử dụng `--refresh` để xây dựng lại registry từ chỉ mục plugin được duy trì bền vững, chính sách cấu hình và siêu dữ liệu manifest/gói. Đây là đường dẫn sửa chữa, không phải đường dẫn kích hoạt runtime.

`openclaw doctor --fix` cũng sửa chữa tình trạng sai lệch npm được quản lý liền kề với registry. Nếu một gói `@openclaw/*` mồ côi hoặc được khôi phục trong một dự án npm plugin được quản lý hoặc thư mục gốc npm được quản lý dạng phẳng cũ che khuất một plugin đi kèm, doctor sẽ xóa gói lỗi thời đó và xây dựng lại registry để quá trình khởi động xác thực dựa trên manifest đi kèm. Khi một bản ghi cài đặt có thẩm quyền chọn một thế hệ được quản lý nhưng các thư mục dạng phẳng hoặc thư mục thế hệ cũ hơn vẫn còn, doctor sẽ cho ngừng sử dụng các cây thư mục lỗi thời đó để cắt bỏ sau khi Gateway khởi động lại. Doctor cũng liên kết lại gói `openclaw` của máy chủ vào các plugin npm được quản lý khai báo `peerDependencies.openclaw`, để các lệnh import runtime cục bộ theo gói như `openclaw/plugin-sdk/*` phân giải được sau khi cập nhật hoặc sửa chữa npm.

## Marketplace

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

`plugins marketplace entries` liệt kê các mục từ nguồn cấp marketplace OpenClaw đã cấu hình. Theo mặc định, lệnh này thử dùng nguồn cấp được lưu trữ và chuyển sang ảnh chụp nhanh được chấp nhận gần nhất hoặc dữ liệu đi kèm nếu không thành công. Sử dụng `--feed-profile <name>` để đọc một hồ sơ cụ thể đã cấu hình, `--feed-url <url>` để đọc một URL nguồn cấp được lưu trữ được chỉ định rõ ràng và `--offline` để đọc ảnh chụp nhanh được chấp nhận gần nhất mà không tìm nạp nguồn cấp.

`plugins marketplace refresh` làm mới ảnh chụp nhanh của nguồn cấp được lưu trữ đã cấu hình và báo cáo OpenClaw đã chấp nhận dữ liệu được lưu trữ, ảnh chụp nhanh được lưu trữ hay dữ liệu dự phòng đi kèm. Sử dụng `--expected-sha256` khi bên gọi cần lệnh thất bại trừ khi tải trọng mới từ nguồn được lưu trữ khớp với giá trị tổng kiểm đã ghim.

`list` của Marketplace chấp nhận đường dẫn marketplace cục bộ, đường dẫn `marketplace.json`, dạng viết tắt GitHub như `owner/repo`, URL kho lưu trữ GitHub hoặc URL git. `--json` in nhãn nguồn đã phân giải cùng với manifest marketplace đã phân tích cú pháp và các mục plugin.

Thao tác làm mới Marketplace tải nguồn cấp marketplace OpenClaw được lưu trữ và duy trì bền vững phản hồi đã xác thực làm ảnh chụp nhanh nguồn cấp được lưu trữ cục bộ. Khi không có tùy chọn, thao tác này sử dụng hồ sơ nguồn cấp mặc định đã cấu hình. Sử dụng `--feed-profile <name>` để làm mới một hồ sơ cụ thể đã cấu hình, `--feed-url <url>` để làm mới một URL nguồn cấp được lưu trữ được chỉ định rõ ràng, `--expected-sha256 <sha256>` để yêu cầu tổng kiểm tải trọng khớp (`sha256:<hex>` hoặc chuỗi mã hex thuần gồm 64 ký tự) và `--json` để nhận đầu ra có thể đọc bằng máy. URL nguồn cấp được lưu trữ được chỉ định rõ ràng không được chứa thông tin xác thực, chuỗi truy vấn hoặc phân mảnh. Các lần làm mới không ghim có thể báo cáo kết quả ảnh chụp nhanh được lưu trữ hoặc dữ liệu dự phòng đi kèm mà không làm lệnh thất bại. Các lần làm mới được ghim sẽ thất bại trừ khi chấp nhận tải trọng mới từ nguồn được lưu trữ, và các lần làm mới từ nguồn được lưu trữ thành công sẽ thất bại nếu OpenClaw không thể duy trì bền vững ảnh chụp nhanh đã xác thực.

## Liên quan

- [Xây dựng plugin](/vi/plugins/building-plugins)
- [Tài liệu tham khảo CLI](/vi/cli)
- [ClawHub](/vi/clawhub)
