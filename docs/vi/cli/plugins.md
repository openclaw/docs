---
read_when:
    - Bạn muốn cài đặt hoặc quản lý các Plugin Gateway hay các gói tương thích
    - Bạn muốn tạo khung hoặc xác thực một Plugin công cụ đơn giản
    - Bạn muốn gỡ lỗi các trường hợp không tải được plugin
sidebarTitle: Plugins
summary: Tài liệu tham khảo CLI cho `openclaw plugins` (khởi tạo, xây dựng, xác thực, liệt kê, cài đặt, marketplace, gỡ cài đặt, bật/tắt, chẩn đoán)
title: Plugin
x-i18n:
    generated_at: "2026-07-16T14:17:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: dadc182cd931672d98c3d1c6ddc1f1defdf0384b25feff7bd4b5324a7fc2e26c
    source_path: cli/plugins.md
    workflow: 16
---

Quản lý các Plugin Gateway, gói hook và các bundle tương thích.

<CardGroup cols={2}>
  <Card title="Hệ thống Plugin" href="/vi/tools/plugin">
    Hướng dẫn dành cho người dùng cuối về cách cài đặt, bật và khắc phục sự cố Plugin.
  </Card>
  <Card title="Quản lý Plugin" href="/vi/plugins/manage-plugins">
    Ví dụ nhanh về cài đặt, liệt kê, cập nhật, gỡ cài đặt và xuất bản.
  </Card>
  <Card title="Bundle Plugin" href="/vi/plugins/bundles">
    Mô hình tương thích bundle.
  </Card>
  <Card title="Manifest Plugin" href="/vi/plugins/manifest">
    Các trường manifest và lược đồ cấu hình.
  </Card>
  <Card title="Bảo mật" href="/vi/gateway/security">
    Tăng cường bảo mật cho việc cài đặt Plugin.
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
Trong chế độ Nix (`OPENCLAW_NIX_MODE=1`), `openclaw.json` là bất biến. `install`, `update`, `uninstall`, `enable` và `disable` đều từ chối chạy. Thay vào đó, hãy chỉnh sửa nguồn Nix cho bản cài đặt này (`programs.openclaw.config` hoặc `instances.<name>.config` đối với nix-openclaw), rồi xây dựng lại. Xem [Bắt đầu nhanh](https://github.com/openclaw/nix-openclaw#quick-start) ưu tiên tác nhân.
</Note>

<Note>
Các Plugin đi kèm được phân phối cùng OpenClaw. Một số được bật theo mặc định (ví dụ: các nhà cung cấp mô hình đi kèm, nhà cung cấp giọng nói đi kèm và Plugin trình duyệt đi kèm); các Plugin khác yêu cầu `plugins enable`.

Các Plugin OpenClaw gốc phân phối `openclaw.plugin.json` với JSON Schema nội tuyến (`configSchema`, ngay cả khi trống). Các bundle tương thích sử dụng manifest bundle riêng.

`plugins list` hiển thị `Format: openclaw` hoặc `Format: bundle`. Đầu ra danh sách/thông tin chi tiết cũng hiển thị kiểu con của bundle (`codex`, `claude` hoặc `cursor`) cùng các khả năng bundle được phát hiện.
</Note>

## Tạo Plugin

```bash
openclaw plugins init stock-quotes --name "Stock Quotes"
cd stock-quotes
npm run plugin:build
npm run plugin:validate
```

Theo mặc định, `plugins init` tạo một Plugin công cụ TypeScript tối giản. Đối số
đầu tiên là id Plugin; `--name` đặt tên hiển thị. OpenClaw sử dụng
id cho thư mục đầu ra mặc định và cách đặt tên gói. Khung công cụ sử dụng
`defineToolPlugin` và tạo các tập lệnh `package.json` `plugin:build` và
`plugin:validate`; chúng xây dựng rồi gọi `openclaw plugins build`/`validate`.

`plugins build` nhập điểm vào đã xây dựng, đọc siêu dữ liệu công cụ tĩnh, ghi
`openclaw.plugin.json` và giữ cho `openclaw.extensions` của `package.json` đồng bộ.
`plugins validate` kiểm tra rằng manifest đã tạo, siêu dữ liệu gói và
phần xuất hiện tại của điểm vào vẫn nhất quán. Xem [Plugin công cụ](/vi/plugins/tool-plugins) để biết
quy trình tạo đầy đủ.

Khung ghi mã nguồn TypeScript nhưng tạo siêu dữ liệu từ điểm vào
`./dist/index.js` đã xây dựng, vì vậy quy trình này cũng hoạt động với CLI đã xuất bản. Sử dụng
`--entry <path>` khi điểm vào không phải là điểm vào mặc định của gói. Sử dụng
`plugins build --check` trong CI để báo lỗi khi siêu dữ liệu đã tạo bị lỗi thời mà không
ghi lại tệp.

### Khung nhà cung cấp

```bash
openclaw plugins init acme-models --name "Acme Models" --type provider
cd acme-models
npm install
npm run build
npm test
npm run validate
```

Khung nhà cung cấp tạo một Plugin nhà cung cấp mô hình chung tương thích với OpenAI,
bao gồm cơ chế xác thực bằng khóa API, một tập lệnh `npm run validate` chạy
`clawhub package validate`, siêu dữ liệu gói ClawHub và một quy trình GitHub Actions được
kích hoạt thủ công để phục vụ việc xuất bản đáng tin cậy qua GitHub
OIDC trong tương lai. Khung nhà cung cấp không tạo Skills và không sử dụng
`openclaw plugins build`/`validate`; các lệnh đó dành cho đường dẫn siêu dữ liệu được tạo
của khung công cụ.

Trước khi xuất bản, hãy thay URL cơ sở API giữ chỗ, danh mục mô hình, tuyến tài liệu,
văn bản thông tin xác thực và nội dung README bằng thông tin thực tế của nhà cung cấp. Sử dụng
README đã tạo cho lần xuất bản đầu tiên lên ClawHub và quá trình thiết lập nhà xuất bản đáng tin cậy.

## Cài đặt

```bash
openclaw plugins search "calendar"                      # tìm kiếm Plugin ClawHub
openclaw plugins install @openclaw/<package>            # danh mục chính thức đáng tin cậy
openclaw plugins install <package>                       # gói npm tùy ý
openclaw plugins install clawhub:<package>                # chỉ ClawHub
openclaw plugins install npm:<package>                    # chỉ npm
openclaw plugins install npm-pack:<path.tgz>               # tarball npm-pack cục bộ
openclaw plugins install git:github.com/<owner>/<repo>     # kho git
openclaw plugins install git:github.com/<owner>/<repo>@<ref>
openclaw plugins install <path>                            # đường dẫn hoặc kho lưu trữ cục bộ
openclaw plugins install -l <path>                         # liên kết thay vì sao chép
openclaw plugins install <plugin>@<marketplace>             # dạng viết tắt marketplace
openclaw plugins install <plugin> --marketplace <name>      # marketplace (tường minh)
openclaw plugins install <package> --force                  # xác nhận nguồn / ghi đè bản hiện có
openclaw plugins install <package> --pin                    # ghim phiên bản npm đã phân giải
openclaw plugins install clawhub:<package> --acknowledge-clawhub-risk
openclaw plugins install <package> --dangerously-force-unsafe-install
```

Người bảo trì kiểm thử việc cài đặt trong quá trình thiết lập có thể ghi đè các nguồn
cài đặt Plugin tự động bằng các biến môi trường được bảo vệ. Xem
[Ghi đè cài đặt Plugin](/vi/plugins/install-overrides).

<Warning>
Trong quá trình chuyển đổi khởi chạy, tên gói thuần túy được cài đặt từ npm theo mặc định, trừ khi khớp với id của Plugin đi kèm hoặc chính thức; trong trường hợp đó, OpenClaw sử dụng bản sao cục bộ/chính thức thay vì truy cập registry npm. Sử dụng `npm:<package>` khi bạn chủ ý muốn dùng một gói npm bên ngoài. Sử dụng `clawhub:<package>` cho ClawHub. Hãy xem việc cài đặt Plugin như chạy mã; ưu tiên các phiên bản được ghim.
</Warning>

<Warning>
Các gói ClawHub và danh mục đi kèm/chính thức của OpenClaw là những nguồn cài đặt
đáng tin cậy. Một nguồn npm tùy ý mới, `npm-pack:`, git, đường dẫn/kho lưu trữ cục bộ hoặc
marketplace sẽ hiển thị cảnh báo và yêu cầu xác nhận trước khi tiếp tục. Việc cài đặt tùy ý
không tương tác phải truyền `--force` sau khi bạn xem xét và tin tưởng nguồn. Cờ này cũng
ghi đè mục tiêu cài đặt hiện có khi cần. Các bản cập nhật thông thường của một bản
cài đặt đã được theo dõi không yêu cầu cờ này. Xác nhận này tách biệt với
`--acknowledge-clawhub-risk`, vốn chỉ áp dụng cho các cảnh báo về độ tin cậy của bản phát hành
ClawHub có rủi ro. `--force` không bỏ qua `security.installPolicy` hoặc các bước
kiểm tra an toàn cài đặt còn lại.
</Warning>

`plugins search` truy vấn ClawHub để tìm các gói `code-plugin` và
`bundle-plugin` có thể cài đặt (không phải Skills; hãy dùng `openclaw skills search` cho chúng).
Giá trị `--limit` mặc định là 20, tối đa 100. Lệnh này chỉ đọc danh mục từ xa: không
kiểm tra trạng thái cục bộ, thay đổi cấu hình, cài đặt gói hay tải thời gian chạy
Plugin. Kết quả bao gồm tên gói ClawHub, họ, kênh, phiên bản,
bản tóm tắt và gợi ý cài đặt như `openclaw plugins install clawhub:<package>`.

<Note>
ClawHub là bề mặt phân phối và khám phá chính cho hầu hết các Plugin. Npm
vẫn là đường dẫn dự phòng và cài đặt trực tiếp được hỗ trợ. Các gói Plugin
`@openclaw/*` do OpenClaw sở hữu đã được xuất bản lại trên npm; xem danh sách hiện tại
tại [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) hoặc
[danh mục Plugin](/vi/plugins/plugin-inventory). Các bản cài đặt ổn định sử dụng `latest`.
Các bản cài đặt và cập nhật trên kênh beta ưu tiên dist-tag npm `beta` khi có,
nếu không sẽ dùng `latest`. Trên kênh ổn định mở rộng, các Plugin npm chính thức
với ý định thuần túy/mặc định hoặc `latest` sẽ được phân giải thành đúng phiên bản lõi
đã cài đặt. Các bản ghim chính xác và thẻ không phải `latest` tường minh, gói bên thứ ba và
nguồn không phải npm không được viết lại.
</Note>

<AccordionGroup>
  <Accordion title="Bao gồm cấu hình và sửa chữa cấu hình không hợp lệ">
    Nếu phần `plugins` được hỗ trợ bởi `$include` một tệp, `plugins install/update/enable/disable/uninstall` sẽ ghi xuyên vào tệp được bao gồm đó và giữ nguyên `openclaw.json`. Các phần bao gồm ở gốc, mảng phần bao gồm và phần bao gồm có ghi đè cùng cấp sẽ đóng an toàn thay vì làm phẳng. Xem [Bao gồm cấu hình](/vi/gateway/configuration) để biết các hình dạng được hỗ trợ.

    Nếu cấu hình không hợp lệ trong quá trình cài đặt, `plugins install` thường đóng an toàn và yêu cầu bạn chạy `openclaw doctor --fix` trước. Trong quá trình khởi động và tải lại nóng Gateway, cấu hình Plugin không hợp lệ sẽ đóng an toàn như mọi cấu hình không hợp lệ khác; `openclaw doctor --fix` có thể cách ly mục Plugin không hợp lệ. Ngoại lệ duy nhất được ghi nhận trong quá trình cài đặt là một đường dẫn khôi phục hẹp cho Plugin đi kèm chủ động chọn sử dụng `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="Xác nhận --force và cài đặt lại so với cập nhật">
    `--force` xác nhận một nguồn không phải ClawHub mà không cần nhắc. Cờ này không bỏ qua `security.installPolicy` hoặc các bước kiểm tra an toàn cài đặt còn lại. Khi Plugin hoặc gói hook đã được cài đặt, cờ này cũng tái sử dụng mục tiêu hiện có và ghi đè tại chỗ. Hãy dùng cờ này sau khi xem xét một nguồn npm tùy ý, cục bộ, kho lưu trữ, git hoặc marketplace, hay khi chủ ý cài đặt lại cùng một id. Đối với việc nâng cấp định kỳ một Plugin npm đã được theo dõi, hãy ưu tiên `openclaw plugins update <id-or-npm-spec>`.

    Nếu bạn chạy `plugins install` cho một id Plugin đã được cài đặt, OpenClaw sẽ dừng và hướng bạn đến `plugins update <id-or-npm-spec>` để nâng cấp thông thường, hoặc đến `plugins install <package> --force` khi bạn thực sự muốn ghi đè bản cài đặt hiện tại từ một nguồn khác. Các nguồn tùy ý vẫn hiển thị cảnh báo nguồn gốc tương tác; việc cài đặt không tương tác phải truyền `--force` sau khi xem xét. Các nguồn ClawHub và danh mục OpenClaw đáng tin cậy không cần cờ này. Với `--link`, `--force` xác nhận nguồn nhưng không thay đổi chế độ cài đặt bằng đường dẫn liên kết.

  </Accordion>
  <Accordion title="Phạm vi --pin">
    `--pin` chỉ áp dụng cho cài đặt npm và ghi lại `<name>@<version>` chính xác đã phân giải. Cờ này không được hỗ trợ với cài đặt `git:` (thay vào đó, hãy ghim ref trong đặc tả, ví dụ `git:github.com/acme/plugin@v1.2.3`) hoặc với `--marketplace` (cài đặt marketplace lưu giữ siêu dữ liệu nguồn marketplace thay vì đặc tả npm).
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` đã lỗi thời và hiện không thực hiện thao tác nào. OpenClaw không còn chạy cơ chế chặn mã nguy hiểm tích hợp trong quá trình cài đặt Plugin.

    Sử dụng bề mặt `security.installPolicy` do người vận hành sở hữu khi cần chính sách cài đặt dành riêng cho máy chủ. Các hook `before_install` của Plugin là hook vòng đời trong thời gian chạy của Plugin, không phải ranh giới chính sách chính cho các lượt cài đặt qua CLI.

    Nếu một Plugin bạn đã phát hành trên ClawHub bị ẩn hoặc chặn bởi quá trình quét registry, hãy sử dụng các bước dành cho nhà phát hành trong [Phát hành trên ClawHub](/vi/clawhub/publishing). `--dangerously-force-unsafe-install` không yêu cầu ClawHub quét lại Plugin hoặc công khai một bản phát hành bị chặn.

  </Accordion>
  <Accordion title="--acknowledge-clawhub-risk">
    Các lượt cài đặt từ ClawHub cộng đồng kiểm tra bản ghi độ tin cậy của bản phát hành đã chọn trước khi tải xuống. Nếu ClawHub vô hiệu hóa việc tải xuống đối với bản phát hành, báo cáo phát hiện quét độc hại hoặc đặt bản phát hành vào trạng thái kiểm duyệt chặn (cách ly, thu hồi), OpenClaw sẽ từ chối hoàn toàn bất kể cờ này. Đối với các trạng thái quét có rủi ro hoặc trạng thái kiểm duyệt không chặn, OpenClaw hiển thị chi tiết độ tin cậy và yêu cầu xác nhận trước khi tiếp tục.

    Chỉ sử dụng `--acknowledge-clawhub-risk` sau khi xem xét cảnh báo của ClawHub và quyết định tiếp tục mà không cần lời nhắc tương tác. Kết quả quét đang chờ hoặc đã cũ (chưa sạch) sẽ đưa ra cảnh báo nhưng không yêu cầu xác nhận. Các gói ClawHub chính thức và nguồn Plugin OpenClaw đi kèm hoàn toàn bỏ qua bước kiểm tra độ tin cậy của bản phát hành này.

  </Accordion>
  <Accordion title="Các gói hook và đặc tả npm">
    `plugins install` cũng là bề mặt cài đặt cho các gói hook cung cấp `openclaw.hooks` trong `package.json`. Sử dụng `openclaw hooks` để kiểm soát khả năng hiển thị hook đã lọc và bật từng hook, không phải để cài đặt gói.

    Các đặc tả npm **chỉ dành cho registry** (tên gói cộng với **phiên bản chính xác** hoặc **dist-tag** tùy chọn). Các đặc tả Git/URL/tệp và khoảng semver bị từ chối. Để đảm bảo an toàn, việc cài đặt phần phụ thuộc chạy trong một dự án npm được quản lý cho mỗi Plugin với `--ignore-scripts`, ngay cả khi shell của bạn có thiết lập cài đặt npm toàn cục. Các dự án npm Plugin được quản lý kế thừa `overrides` npm cấp gói của OpenClaw, vì vậy các chốt bảo mật của máy chủ cũng áp dụng cho các phần phụ thuộc Plugin được đưa lên cấp cao hơn.

    Sử dụng `npm:<package>` để chỉ định rõ việc phân giải npm. Theo mặc định, các đặc tả gói thuần cũng được cài đặt trực tiếp từ npm trong quá trình chuyển đổi khi ra mắt, trừ khi chúng khớp với id Plugin chính thức.

    Các đặc tả `@openclaw/*` thô khớp với Plugin đi kèm sẽ được phân giải thành bản đi kèm do image sở hữu trước khi chuyển sang npm dự phòng. Ví dụ: `openclaw plugins install @openclaw/discord@2026.5.20 --pin` sử dụng Plugin Discord đi kèm từ bản dựng OpenClaw hiện tại thay vì tạo một bản ghi đè npm được quản lý. Để buộc sử dụng gói npm bên ngoài, hãy dùng `openclaw plugins install npm:@openclaw/discord@2026.5.20 --pin`.

    Các đặc tả thuần và `@latest` vẫn sử dụng kênh ổn định. Các phiên bản sửa lỗi có dấu ngày của OpenClaw, chẳng hạn như `2026.5.3-1`, được tính là ổn định cho bước kiểm tra này. Nếu npm phân giải một trong hai dạng thành bản phát hành trước, OpenClaw sẽ dừng lại và yêu cầu bạn chủ động chọn tham gia bằng thẻ bản phát hành trước (`@beta`/`@rc`) hoặc phiên bản phát hành trước chính xác (`@1.2.3-beta.4`).

    Đối với lượt cài đặt npm không có phiên bản chính xác (`npm:<package>` hoặc `npm:<package>@latest`), OpenClaw kiểm tra siêu dữ liệu gói đã phân giải trước khi cài đặt. Nếu gói ổn định mới nhất yêu cầu API Plugin OpenClaw mới hơn hoặc phiên bản máy chủ tối thiểu cao hơn, OpenClaw sẽ kiểm tra các phiên bản ổn định cũ hơn và cài đặt bản phát hành tương thích mới nhất. Phiên bản chính xác và dist-tag được chỉ định rõ vẫn được xử lý nghiêm ngặt: lựa chọn không tương thích sẽ thất bại và yêu cầu bạn nâng cấp OpenClaw hoặc chọn phiên bản tương thích.

    Nếu một đặc tả cài đặt thuần khớp với id Plugin chính thức (ví dụ `diffs`), OpenClaw sẽ cài đặt trực tiếp mục trong danh mục. Để cài đặt gói npm có cùng tên, hãy sử dụng đặc tả có phạm vi rõ ràng (ví dụ `@scope/diffs`).

  </Accordion>
  <Accordion title="Kho lưu trữ Git">
    Sử dụng `git:<repo>` để cài đặt trực tiếp từ kho lưu trữ Git. Các dạng được hỗ trợ: `git:github.com/owner/repo`, `git:owner/repo`, `https://` đầy đủ, `ssh://`, `git://`, `file://` và URL sao chép `git@host:owner/repo.git`. Thêm `@<ref>` hoặc `#<ref>` để checkout một nhánh, thẻ hoặc commit trước khi cài đặt.

    Việc cài đặt từ Git sao chép vào một thư mục tạm thời, checkout ref được yêu cầu nếu có, rồi sử dụng trình cài đặt thư mục Plugin thông thường; do đó, việc xác thực manifest, chính sách cài đặt của người vận hành, hoạt động cài đặt của trình quản lý gói và bản ghi cài đặt đều hoạt động như khi cài đặt từ npm. Các lượt cài đặt Git được ghi lại bao gồm URL/ref nguồn cùng với commit đã phân giải để `openclaw plugins update` có thể phân giải lại nguồn sau này.

    Sau khi cài đặt từ Git, hãy sử dụng `openclaw plugins inspect <id> --runtime --json` để xác minh các đăng ký trong thời gian chạy, chẳng hạn như phương thức Gateway và lệnh CLI. Nếu Plugin đã đăng ký một gốc CLI bằng `api.registerCli`, hãy chạy lệnh đó trực tiếp thông qua CLI gốc của OpenClaw, ví dụ `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Kho lưu trữ nén">
    Các định dạng lưu trữ được hỗ trợ: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Kho lưu trữ Plugin OpenClaw gốc phải chứa `openclaw.plugin.json` hợp lệ tại thư mục gốc Plugin sau khi giải nén; các kho lưu trữ chỉ chứa `package.json` sẽ bị từ chối trước khi OpenClaw ghi bản ghi cài đặt.

    Sử dụng `npm-pack:<path.tgz>` khi tệp là tarball npm-pack và bạn muốn
    sử dụng cùng đường dẫn dự án npm được quản lý cho từng Plugin như khi cài đặt từ registry,
    bao gồm việc xác minh `package-lock.json`, quét phần phụ thuộc được đưa lên cấp cao hơn
    và bản ghi cài đặt npm. Các đường dẫn kho lưu trữ thuần vẫn được cài đặt dưới dạng
    kho lưu trữ cục bộ trong thư mục gốc phần mở rộng Plugin.

    Việc cài đặt từ marketplace Claude cũng được hỗ trợ.

  </Accordion>
</AccordionGroup>

Các lượt cài đặt từ ClawHub sử dụng bộ định vị `clawhub:<package>` rõ ràng:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Theo mặc định, các đặc tả Plugin thuần an toàn với npm được cài đặt từ npm trong quá trình chuyển đổi khi ra mắt, trừ khi chúng khớp với id Plugin chính thức:

```bash
openclaw plugins install openclaw-codex-app-server
```

Sử dụng `npm:` để chỉ định rõ việc chỉ phân giải qua npm:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@openclaw/discord@2026.5.20
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw kiểm tra khả năng tương thích với API Plugin / phiên bản Gateway tối thiểu được công bố trước khi cài đặt. Khi phiên bản ClawHub đã chọn phát hành một cấu phần ClawPack, OpenClaw tải xuống `.tgz` npm-pack có phiên bản, xác minh tiêu đề mã băm ClawHub và mã băm cấu phần, rồi cài đặt thông qua đường dẫn kho lưu trữ thông thường. Các phiên bản ClawHub cũ hơn không có siêu dữ liệu ClawPack vẫn được cài đặt thông qua đường dẫn xác minh kho lưu trữ gói cũ. Các lượt cài đặt được ghi lại giữ lại siêu dữ liệu nguồn ClawHub, loại cấu phần, tính toàn vẹn npm, shasum npm, tên tarball và thông tin mã băm ClawPack để cập nhật sau này.
Các lượt cài đặt ClawHub không có phiên bản giữ một đặc tả được ghi lại không có phiên bản để `openclaw plugins update` có thể theo dõi các bản phát hành ClawHub mới hơn; các bộ chọn phiên bản hoặc thẻ rõ ràng như `clawhub:pkg@1.2.3` và `clawhub:pkg@beta` vẫn được ghim vào bộ chọn đó.

### Cách viết tắt marketplace

Sử dụng cách viết tắt `plugin@marketplace` khi tên marketplace tồn tại trong bộ nhớ đệm registry cục bộ của Claude tại `~/.claude/plugins/known_marketplaces.json`:

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

Sử dụng `--marketplace` để truyền nguồn marketplace một cách rõ ràng:

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

<Tabs>
  <Tab title="Nguồn marketplace">
    - một tên marketplace đã biết của Claude từ `~/.claude/plugins/known_marketplaces.json`
    - một thư mục gốc marketplace cục bộ hoặc đường dẫn `marketplace.json`
    - một cách viết tắt kho lưu trữ GitHub, chẳng hạn như `owner/repo`
    - một URL kho lưu trữ GitHub, chẳng hạn như `https://github.com/owner/repo`
    - một URL Git

  </Tab>
  <Tab title="Quy tắc marketplace từ xa">
    Đối với marketplace từ xa được tải từ GitHub hoặc Git, các mục Plugin phải nằm trong kho lưu trữ marketplace đã sao chép. OpenClaw chấp nhận nguồn đường dẫn tương đối từ kho lưu trữ đó và từ chối các nguồn Plugin HTTP(S), đường dẫn tuyệt đối, Git, GitHub và các nguồn không phải đường dẫn khác từ manifest từ xa.
  </Tab>
</Tabs>

Đối với đường dẫn cục bộ và kho lưu trữ, OpenClaw tự động phát hiện:

- Plugin OpenClaw gốc (`openclaw.plugin.json`)
- gói tương thích với Codex (`.codex-plugin/plugin.json`)
- gói tương thích với Claude (`.claude-plugin/plugin.json`, hoặc bố cục thành phần Claude mặc định khi không có tệp manifest đó)
- gói tương thích với Cursor (`.cursor-plugin/plugin.json`)

Các lượt cài đặt cục bộ được quản lý phải là thư mục hoặc kho lưu trữ Plugin. Các tệp Plugin `.js`,
`.mjs`, `.cjs` và `.ts` độc lập không được `plugins install` sao chép vào thư mục gốc Plugin
được quản lý, cũng không được tải bằng cách đặt trực tiếp vào
`~/.openclaw/extensions` hoặc `<workspace>/.openclaw/extensions`; các
thư mục gốc được tự động phát hiện đó tải các thư mục gói hoặc gói tổng hợp Plugin và bỏ qua
các tệp tập lệnh cấp cao nhất dưới dạng trình trợ giúp cục bộ. Thay vào đó, hãy liệt kê rõ ràng các tệp độc lập trong
`plugins.load.paths`.

<Note>
Các gói tương thích được cài đặt vào thư mục gốc Plugin thông thường và tham gia cùng quy trình liệt kê/thông tin/bật/tắt. Hiện tại, Skills trong gói, command-skill của Claude, giá trị mặc định `settings.json` của Claude, giá trị mặc định `.lsp.json` / `lspServers` được khai báo trong manifest của Claude, command-skill của Cursor và các thư mục hook tương thích với Codex được hỗ trợ; các khả năng gói khác được phát hiện sẽ hiển thị trong chẩn đoán/thông tin nhưng chưa được kết nối với quá trình thực thi trong thời gian chạy.
</Note>

Sử dụng `-l`/`--link` để trỏ đến thư mục Plugin cục bộ mà không sao chép thư mục đó (thêm
vào `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

`--link` không được hỗ trợ với các lượt cài đặt `--marketplace` hoặc `git:`, và
yêu cầu một đường dẫn cục bộ đã tồn tại. Đối với liên kết cục bộ không tương tác,
hãy truyền `--force` sau khi xem xét nguồn; tùy chọn này xác nhận nguồn gốc nhưng không
sao chép hoặc ghi đè thư mục được liên kết.

<Note>
Các Plugin có nguồn gốc từ workspace được phát hiện từ thư mục gốc phần mở rộng của workspace sẽ không được
nhập hoặc thực thi cho đến khi chúng được bật rõ ràng. Để phát triển cục bộ,
hãy chạy `openclaw plugins enable <plugin-id>` hoặc đặt
`plugins.entries.<plugin-id>.enabled: true`; nếu cấu hình của bạn sử dụng
`plugins.allow`, hãy đưa cùng id Plugin vào đó. Quy tắc từ chối theo mặc định này
cũng áp dụng khi quá trình thiết lập kênh nhắm rõ ràng đến Plugin có nguồn gốc từ workspace để
chỉ tải phục vụ thiết lập; do đó, mã thiết lập Plugin kênh cục bộ sẽ không chạy khi
Plugin workspace đó vẫn bị tắt hoặc bị loại khỏi danh sách cho phép. Các lượt cài đặt liên kết
và mục `plugins.load.paths` rõ ràng tuân theo chính sách thông thường đối với
nguồn gốc Plugin đã phân giải. Xem
[Định cấu hình chính sách Plugin](/vi/tools/plugin#configure-plugin-policy)
và [Tham chiếu cấu hình](/vi/gateway/configuration-reference#plugins).

Sử dụng `--pin` khi cài đặt từ npm để lưu đặc tả chính xác đã phân giải (`name@version`) trong chỉ mục Plugin được quản lý, đồng thời giữ hành vi mặc định là không ghim.
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
  Chuyển từ chế độ xem bảng sang các dòng chi tiết cho từng Plugin với siêu dữ liệu định dạng/nguồn/xuất xứ/phiên bản/kích hoạt.
</ParamField>
<ParamField path="--json" type="boolean">
  Danh mục có thể đọc bằng máy cùng với chẩn đoán registry và trạng thái cài đặt phần phụ thuộc của gói.
</ParamField>

<Note>
`plugins list` đọc sổ đăng ký plugin cục bộ đã lưu trước tiên, với phương án dự phòng được suy ra chỉ từ manifest khi sổ đăng ký bị thiếu hoặc không hợp lệ. Lệnh này hữu ích để kiểm tra liệu một plugin đã được cài đặt, bật và hiển thị cho quá trình lập kế hoạch khởi động nguội hay chưa, nhưng không phải là phép thăm dò runtime trực tiếp đối với một tiến trình Gateway đang chạy. Sau khi thay đổi mã plugin, trạng thái bật, chính sách hook hoặc `plugins.load.paths`, hãy khởi động lại Gateway phục vụ kênh trước khi kỳ vọng mã hoặc hook `register(api)` mới chạy. Đối với các triển khai từ xa/trong container, hãy xác minh rằng bạn đang khởi động lại tiến trình con `openclaw gateway run` thực tế, chứ không chỉ một tiến trình bao bọc.

`plugins list --json` bao gồm `dependencyStatus` của từng plugin từ `package.json`
`dependencies` và `optionalDependencies`. OpenClaw kiểm tra xem các tên gói đó
có hiện diện trong đường dẫn tra cứu Node `node_modules` thông thường của plugin hay không; OpenClaw
không nhập mã runtime của plugin, chạy trình quản lý gói hoặc sửa chữa các
phần phụ thuộc bị thiếu.
</Note>

Nếu nhật ký khởi động ghi `plugins.allow is empty; discovered non-bundled plugins may auto-load: ...`,
hãy chạy `openclaw plugins list --enabled --verbose` hoặc
`openclaw plugins inspect <id>` với một id plugin được liệt kê để xác nhận các
id plugin và sao chép các id đáng tin cậy vào `plugins.allow` trong `openclaw.json`. Khi
cảnh báo có thể liệt kê mọi plugin được phát hiện, cảnh báo sẽ in một đoạn mã
`plugins.allow` sẵn sàng để dán, trong đó đã bao gồm các id đó. Nếu một plugin tải
mà không có thông tin nguồn gốc cài đặt/đường dẫn tải, hãy kiểm tra id plugin đó, rồi ghim
id đáng tin cậy trong `plugins.allow` hoặc cài đặt lại plugin từ một nguồn đáng tin cậy
để OpenClaw ghi lại nguồn gốc cài đặt.

Khi làm việc với plugin đi kèm bên trong một ảnh Docker đã đóng gói, hãy gắn kết thư mục
nguồn của plugin đè lên đường dẫn nguồn đã đóng gói tương ứng, chẳng hạn như
`/app/extensions/synology-chat`. OpenClaw phát hiện lớp phủ nguồn được gắn kết đó
trước `/app/dist/extensions/synology-chat`; một thư mục nguồn chỉ được sao chép
vẫn không hoạt động, vì vậy các bản cài đặt đóng gói thông thường vẫn sử dụng dist đã biên dịch.

Để gỡ lỗi hook runtime:

- `openclaw plugins inspect <id> --runtime --json` hiển thị các hook đã đăng ký và thông tin chẩn đoán từ một lượt kiểm tra có tải mô-đun. Việc kiểm tra runtime không bao giờ cài đặt phần phụ thuộc; hãy dùng `openclaw doctor --fix` để dọn dẹp trạng thái phần phụ thuộc cũ hoặc khôi phục các plugin có thể tải xuống bị thiếu nhưng được tham chiếu trong cấu hình.
- `openclaw gateway status --deep --require-rpc` xác nhận URL/hồ sơ Gateway có thể truy cập, các gợi ý về dịch vụ/tiến trình, đường dẫn cấu hình và tình trạng RPC.
- Các hook hội thoại không đi kèm (`llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize`, `agent_end`) yêu cầu `plugins.entries.<id>.hooks.allowConversationAccess=true`.

### Chỉ mục plugin

Siêu dữ liệu cài đặt plugin là trạng thái do máy quản lý, không phải cấu hình người dùng. Các lượt cài đặt và cập nhật ghi dữ liệu này vào cơ sở dữ liệu trạng thái SQLite dùng chung trong thư mục trạng thái OpenClaw đang hoạt động. Hàng `installed_plugin_index` lưu siêu dữ liệu `installRecords` bền vững, bao gồm các bản ghi cho manifest plugin bị hỏng hoặc bị thiếu, cùng với bộ nhớ đệm sổ đăng ký nguội được suy ra từ manifest mà `openclaw plugins update`, thao tác gỡ cài đặt, chẩn đoán và sổ đăng ký plugin nguội sử dụng.

Khi OpenClaw gặp các bản ghi `plugins.installs` cũ đã phát hành trong cấu hình, các lượt đọc runtime coi chúng là đầu vào tương thích mà không ghi lại `openclaw.json`. Các lượt ghi plugin rõ ràng và `openclaw doctor --fix` chuyển các bản ghi đó vào chỉ mục plugin và xóa khóa cấu hình khi được phép ghi cấu hình; nếu một trong hai lượt ghi thất bại, các bản ghi cấu hình sẽ được giữ lại để siêu dữ liệu cài đặt không bị mất.

## Gỡ cài đặt

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
openclaw plugins uninstall <id> --force
```

`uninstall` xóa các bản ghi plugin khỏi `plugins.entries`, chỉ mục plugin đã lưu, các mục trong danh sách cho phép/từ chối plugin và các mục `plugins.load.paths` được liên kết khi áp dụng. Trừ khi `--keep-files` được đặt, thao tác gỡ cài đặt cũng xóa thư mục cài đặt được quản lý đang được theo dõi, nhưng chỉ khi thư mục đó được phân giải bên trong thư mục gốc phần mở rộng plugin của OpenClaw. Nếu plugin hiện sở hữu vị trí `memory` hoặc `contextEngine`, vị trí đó sẽ được đặt lại về giá trị mặc định (`memory-core` cho bộ nhớ, `legacy` cho công cụ ngữ cảnh).

`uninstall` in bản xem trước những nội dung sẽ bị xóa, rồi nhắc `Uninstall plugin "<id>"?` trước khi thực hiện thay đổi. Truyền `--force` để bỏ qua lời nhắc xác nhận (hữu ích cho tập lệnh và các lượt chạy không tương tác); nếu không có tùy chọn này, thao tác gỡ cài đặt yêu cầu một TTY tương tác. `--dry-run` in cùng bản xem trước rồi thoát mà không nhắc hoặc thay đổi bất kỳ nội dung nào.

<Note>
`--keep-config` được hỗ trợ dưới dạng bí danh đã lỗi thời cho `--keep-files`.
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

Các bản cập nhật áp dụng cho những lượt cài đặt plugin được theo dõi trong chỉ mục plugin được quản lý và những lượt cài đặt gói hook được theo dõi trong `hooks.internal.installs`. Chúng tái sử dụng nguồn mà người dùng đã chọn khi cài đặt plugin, vì vậy không yêu cầu xác nhận nguồn lần thứ hai.

<AccordionGroup>
  <Accordion title="Phân giải id plugin so với đặc tả npm">
    Khi bạn truyền một id plugin, OpenClaw tái sử dụng đặc tả cài đặt đã ghi cho plugin đó. Điều này có nghĩa là các dist-tag đã lưu trước đó như `@beta` và các phiên bản chính xác đã ghim tiếp tục được sử dụng trong những lượt chạy `update <id>` sau này.

    Trong `update <id> --dry-run`, các lượt cài đặt npm với phiên bản chính xác đã ghim vẫn được ghim. Nếu OpenClaw cũng có thể phân giải nhánh mặc định trong sổ đăng ký của gói và nhánh mặc định đó mới hơn phiên bản đã ghim đang cài đặt, lượt chạy thử sẽ báo cáo ghim đó và in lệnh cập nhật gói `@latest` rõ ràng để theo nhánh mặc định của sổ đăng ký.

    Quy tắc cập nhật có mục tiêu đó khác với đường dẫn bảo trì hàng loạt `openclaw plugins update --all`. Các bản cập nhật hàng loạt vẫn tôn trọng những đặc tả cài đặt thông thường được theo dõi, nhưng các bản ghi plugin OpenClaw chính thức đáng tin cậy có thể đồng bộ với mục tiêu danh mục chính thức hiện tại thay vì tiếp tục dùng một gói chính thức chính xác đã lỗi thời. Hãy dùng `update <id>` có mục tiêu khi bạn chủ ý muốn giữ nguyên một đặc tả chính thức chính xác hoặc có thẻ.

    Đối với các lượt cài đặt npm, bạn cũng có thể truyền một đặc tả gói npm rõ ràng kèm dist-tag hoặc phiên bản chính xác. OpenClaw phân giải tên gói đó trở lại bản ghi plugin được theo dõi, cập nhật plugin đã cài đặt đó và ghi lại đặc tả npm mới cho các bản cập nhật dựa trên id trong tương lai.

    Việc truyền tên gói npm mà không có phiên bản hoặc thẻ cũng phân giải trở lại bản ghi plugin được theo dõi. Hãy dùng cách này khi một plugin đã được ghim vào một phiên bản chính xác và bạn muốn chuyển nó trở lại nhánh phát hành mặc định của sổ đăng ký.

  </Accordion>
  <Accordion title="Cập nhật kênh beta">
    `openclaw plugins update <id-or-npm-spec>` có mục tiêu tái sử dụng đặc tả plugin được theo dõi trừ khi bạn truyền một đặc tả mới. `openclaw plugins update --all` hàng loạt sử dụng `update.channel` đã cấu hình khi đồng bộ các bản ghi plugin chính thức đáng tin cậy với mục tiêu danh mục chính thức, nhờ đó các lượt cài đặt từ kênh beta có thể duy trì trên nhánh phát hành beta thay vì bị âm thầm chuẩn hóa sang stable/latest.

    `openclaw update` cũng biết kênh cập nhật OpenClaw đang hoạt động: trên kênh beta, các bản ghi plugin npm và ClawHub thuộc nhánh mặc định sẽ thử `@beta` trước. Chúng quay về đặc tả default/latest đã ghi nếu không tồn tại bản phát hành beta của plugin; các plugin npm cũng quay về khi gói beta tồn tại nhưng không vượt qua xác thực cài đặt. Phương án dự phòng đó được báo cáo dưới dạng cảnh báo và không làm bản cập nhật lõi thất bại. Các phiên bản chính xác và thẻ rõ ràng vẫn được ghim vào bộ chọn đó đối với các bản cập nhật có mục tiêu.

  </Accordion>
  <Accordion title="Kiểm tra phiên bản và sai lệch tính toàn vẹn">
    Trước một bản cập nhật npm trực tiếp, OpenClaw kiểm tra phiên bản gói đã cài đặt so với siêu dữ liệu sổ đăng ký npm. Nếu phiên bản đã cài đặt và danh tính tạo phẩm đã ghi khớp với mục tiêu được phân giải, bản cập nhật sẽ được bỏ qua mà không tải xuống, cài đặt lại hoặc ghi lại `openclaw.json`.

    Khi tồn tại hàm băm tính toàn vẹn đã lưu và hàm băm của tạo phẩm được tìm nạp thay đổi, OpenClaw coi đó là sai lệch tạo phẩm npm. Lệnh `openclaw plugins update` tương tác in các hàm băm dự kiến và thực tế rồi yêu cầu xác nhận trước khi tiếp tục. Các trình trợ giúp cập nhật không tương tác mặc định từ chối tiếp tục trừ khi bên gọi cung cấp một chính sách tiếp tục rõ ràng.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install khi cập nhật">
    `--dangerously-force-unsafe-install` cũng được chấp nhận trên `plugins update` để tương thích, nhưng tùy chọn này đã lỗi thời và không còn thay đổi hành vi cập nhật plugin. `security.installPolicy` của nhà vận hành vẫn có thể chặn các bản cập nhật; các hook `before_install` của plugin chỉ áp dụng trong những tiến trình có tải hook plugin.
  </Accordion>
  <Accordion title="--acknowledge-clawhub-risk khi cập nhật">
    Các bản cập nhật plugin cộng đồng dựa trên ClawHub chạy cùng phép kiểm tra độ tin cậy của bản phát hành chính xác như khi cài đặt trước khi tải xuống gói thay thế. Hãy dùng `--acknowledge-clawhub-risk` cho quy trình tự động hóa đã được rà soát cần tiếp tục khi bản phát hành ClawHub đã chọn có cảnh báo độ tin cậy rủi ro. Các gói ClawHub chính thức và nguồn plugin OpenClaw đi kèm bỏ qua lời nhắc về độ tin cậy của bản phát hành này.
  </Accordion>
</AccordionGroup>

## Kiểm tra

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
openclaw plugins inspect --all
```

Thao tác kiểm tra hiển thị danh tính, trạng thái tải, nguồn, các khả năng của manifest, cờ chính sách, thông tin chẩn đoán, siêu dữ liệu cài đặt, khả năng của gói và mọi hỗ trợ máy chủ MCP hoặc LSP được phát hiện mà mặc định không nhập runtime của plugin. Đầu ra JSON bao gồm các hợp đồng manifest plugin, chẳng hạn như `contracts.agentToolResultMiddleware` và `contracts.trustedToolPolicies`, để nhà vận hành có thể kiểm tra các khai báo bề mặt đáng tin cậy trước khi bật hoặc khởi động lại plugin. Thêm `--runtime` để tải mô-đun plugin và bao gồm các hook, công cụ, lệnh, dịch vụ, phương thức Gateway và tuyến HTTP đã đăng ký. Việc kiểm tra runtime báo cáo trực tiếp các phần phụ thuộc plugin bị thiếu; thao tác cài đặt và sửa chữa vẫn nằm trong `openclaw plugins install`, `openclaw plugins update` và `openclaw doctor --fix`.

Các lệnh CLI do plugin sở hữu thường được cài đặt dưới dạng nhóm lệnh `openclaw` cấp gốc, nhưng plugin cũng có thể đăng ký các lệnh lồng nhau dưới một lệnh cha lõi như `openclaw nodes`. Sau khi `inspect --runtime` hiển thị một lệnh dưới `cliCommands`, hãy chạy lệnh đó tại đường dẫn được liệt kê; ví dụ, một plugin đăng ký `demo-git` có thể được xác minh bằng `openclaw demo-git ping`.

Mỗi plugin được phân loại theo những gì nó thực sự đăng ký tại runtime:

| Hình dạng               | Ý nghĩa                                                           |
| ------------------- | ----------------------------------------------------------------- |
| `plain-capability`  | chính xác một loại khả năng (ví dụ: plugin chỉ dành cho nhà cung cấp)         |
| `hybrid-capability` | nhiều hơn một loại khả năng (ví dụ: văn bản + giọng nói + hình ảnh)       |
| `hook-only`         | chỉ có hook, không có khả năng, công cụ, lệnh, dịch vụ hoặc tuyến |
| `non-capability`    | có công cụ/lệnh/dịch vụ nhưng không có khả năng                       |

Xem [Hình dạng plugin](/vi/plugins/architecture#plugin-shapes) để biết thêm về mô hình khả năng.

<Note>
Cờ `--json` xuất báo cáo mà máy có thể đọc, phù hợp cho việc viết tập lệnh và kiểm tra. `inspect --all` kết xuất một bảng trên toàn bộ đội máy với các cột hình dạng, loại khả năng, thông báo tương thích, khả năng của gói và bản tóm tắt hook. `info` là bí danh của `inspect`.
</Note>

## Doctor

```bash
openclaw plugins doctor
```

`doctor` báo cáo lỗi tải plugin, thông tin chẩn đoán về manifest/khám phá, thông báo tương thích và các tham chiếu cấu hình plugin lỗi thời, chẳng hạn như các vị trí plugin bị thiếu. Khi cây cài đặt và cấu hình plugin không có vấn đề, lệnh sẽ in `No plugin issues detected.` Nếu vẫn còn cấu hình lỗi thời nhưng cây cài đặt không có vấn đề nào khác, phần tóm tắt sẽ nêu rõ điều đó thay vì ngụ ý rằng plugin hoàn toàn hoạt động bình thường.

Nếu một plugin đã cấu hình có trên đĩa nhưng bị trình tải chặn bởi các bước kiểm tra an toàn đường dẫn, quá trình xác thực cấu hình sẽ giữ lại mục nhập plugin và báo cáo mục đó là `present but blocked`. Hãy khắc phục chẩn đoán plugin bị chặn xuất hiện trước đó, chẳng hạn như quyền sở hữu đường dẫn hoặc quyền cho phép mọi người ghi, thay vì xóa cấu hình `plugins.entries.<id>` hoặc `plugins.allow`.

Đối với các lỗi hình dạng mô-đun, chẳng hạn như thiếu các export `register`/`activate`, hãy chạy lại với `OPENCLAW_PLUGIN_LOAD_DEBUG=1` để đưa bản tóm tắt ngắn gọn về hình dạng export vào đầu ra chẩn đoán.

## Registry

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Registry plugin cục bộ là mô hình đọc nguội được lưu bền vững của OpenClaw dành cho danh tính plugin đã cài đặt, trạng thái kích hoạt, siêu dữ liệu nguồn và quyền sở hữu phần đóng góp. Quá trình khởi động thông thường, tra cứu chủ sở hữu nhà cung cấp, phân loại thiết lập kênh và kiểm kê plugin có thể đọc mô hình này mà không cần nhập các mô-đun thời gian chạy của plugin.

Dùng `plugins registry` để kiểm tra xem registry được lưu bền vững có tồn tại, còn hiện hành hay đã lỗi thời. Dùng `--refresh` để xây dựng lại registry từ chỉ mục plugin được lưu bền vững, chính sách cấu hình và siêu dữ liệu manifest/gói. Đây là đường dẫn sửa chữa, không phải đường dẫn kích hoạt thời gian chạy.

`openclaw doctor --fix` cũng sửa chữa tình trạng sai lệch npm được quản lý liền kề với registry: nếu một gói `@openclaw/*` mồ côi hoặc được khôi phục trong một dự án npm plugin được quản lý hoặc thư mục gốc npm được quản lý dạng phẳng cũ che khuất một plugin đi kèm, doctor sẽ xóa gói lỗi thời đó và xây dựng lại registry để quá trình khởi động xác thực dựa trên manifest đi kèm. Doctor cũng liên kết lại gói `openclaw` của máy chủ vào các plugin npm được quản lý có khai báo `peerDependencies.openclaw`, để các lệnh nhập thời gian chạy cục bộ theo gói như `openclaw/plugin-sdk/*` có thể phân giải sau khi cập nhật hoặc sửa chữa npm.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` là công tắc tương thích khẩn cấp đã ngừng khuyến nghị dùng cho các lỗi đọc registry. Ưu tiên `plugins registry --refresh` hoặc `openclaw doctor --fix`; phương án dự phòng bằng biến môi trường chỉ dành cho việc khôi phục khởi động khẩn cấp trong khi quá trình di chuyển đang được triển khai.
</Warning>

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

`plugins marketplace entries` liệt kê các mục nhập từ nguồn cấp marketplace OpenClaw đã cấu hình. Theo mặc định, lệnh thử dùng nguồn cấp được lưu trữ và chuyển sang ảnh chụp nhanh mới nhất đã được chấp nhận hoặc dữ liệu đi kèm nếu không thành công. Dùng `--feed-profile <name>` để đọc một hồ sơ cụ thể đã cấu hình, `--feed-url <url>` để đọc một URL nguồn cấp được lưu trữ được chỉ định rõ ràng và `--offline` để đọc ảnh chụp nhanh mới nhất đã được chấp nhận mà không tìm nạp nguồn cấp.

`plugins marketplace refresh` làm mới ảnh chụp nhanh của nguồn cấp được lưu trữ đã cấu hình và báo cáo liệu OpenClaw đã chấp nhận dữ liệu được lưu trữ, ảnh chụp nhanh được lưu trữ hay dữ liệu dự phòng đi kèm. Dùng `--expected-sha256` khi bên gọi cần lệnh thất bại trừ khi tải trọng mới từ nguồn được lưu trữ khớp với tổng kiểm tra được ghim.

`list` của Marketplace chấp nhận một đường dẫn marketplace cục bộ, một đường dẫn `marketplace.json`, dạng viết tắt GitHub như `owner/repo`, URL kho lưu trữ GitHub hoặc URL git. `--json` in nhãn nguồn đã phân giải cùng với manifest marketplace đã phân tích và các mục nhập plugin.

Quá trình làm mới Marketplace tải một nguồn cấp marketplace OpenClaw được lưu trữ và lưu bền vững
phản hồi đã xác thực làm ảnh chụp nhanh nguồn cấp được lưu trữ cục bộ. Khi không có tùy chọn, quá trình này dùng
hồ sơ nguồn cấp mặc định đã cấu hình. Dùng `--feed-profile <name>` để làm mới một
hồ sơ cụ thể đã cấu hình, `--feed-url <url>` để làm mới một URL nguồn cấp được lưu trữ
được chỉ định rõ ràng, `--expected-sha256 <sha256>` để yêu cầu tổng kiểm tra tải trọng khớp
(`sha256:<hex>` hoặc một chuỗi thập lục phân trần gồm 64 ký tự) và `--json` cho
đầu ra có thể đọc bằng máy. URL nguồn cấp được lưu trữ được chỉ định rõ ràng không được chứa
thông tin xác thực, chuỗi truy vấn hoặc phân mảnh. Các lần làm mới không được ghim có thể báo cáo kết quả
từ ảnh chụp nhanh được lưu trữ hoặc dữ liệu dự phòng đi kèm mà không làm lệnh thất bại. Các lần làm mới
được ghim sẽ thất bại trừ khi chấp nhận một tải trọng mới từ nguồn được lưu trữ, và các lần làm mới thành công
từ nguồn được lưu trữ sẽ thất bại nếu OpenClaw không thể lưu bền vững ảnh chụp nhanh đã xác thực.

## Liên quan

- [Xây dựng plugin](/vi/plugins/building-plugins)
- [Tài liệu tham khảo CLI](/vi/cli)
- [ClawHub](/clawhub)
