---
read_when:
    - Bạn muốn cài đặt hoặc quản lý các Plugin Gateway hoặc các gói tương thích
    - Bạn muốn tạo khung hoặc xác thực một Plugin công cụ đơn giản
    - Bạn muốn gỡ lỗi các sự cố tải plugin
sidebarTitle: Plugins
summary: Tài liệu tham khảo CLI cho `openclaw plugins` (khởi tạo, xây dựng, xác thực, liệt kê, cài đặt, chợ ứng dụng, gỡ cài đặt, bật/tắt, chẩn đoán)
title: Plugin
x-i18n:
    generated_at: "2026-07-12T07:49:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 729e74103a302936dc45da3be31306803b16e9dae182e78b3742783b892a9027
    source_path: cli/plugins.md
    workflow: 16
---

Quản lý các Plugin của Gateway, gói hook và các gói tương thích.

<CardGroup cols={2}>
  <Card title="Hệ thống Plugin" href="/vi/tools/plugin">
    Hướng dẫn dành cho người dùng cuối về cách cài đặt, bật và khắc phục sự cố Plugin.
  </Card>
  <Card title="Quản lý Plugin" href="/vi/plugins/manage-plugins">
    Ví dụ nhanh về cài đặt, liệt kê, cập nhật, gỡ cài đặt và phát hành.
  </Card>
  <Card title="Gói Plugin" href="/vi/plugins/bundles">
    Mô hình tương thích của gói.
  </Card>
  <Card title="Tệp kê khai Plugin" href="/vi/plugins/manifest">
    Các trường trong tệp kê khai và lược đồ cấu hình.
  </Card>
  <Card title="Bảo mật" href="/vi/gateway/security">
    Tăng cường bảo mật khi cài đặt Plugin.
  </Card>
</CardGroup>

## Lệnh

```bash
openclaw plugins list [--enabled] [--verbose] [--json]
openclaw plugins search <query> [--limit <n>] [--json]
openclaw plugins install <path-or-spec> [--link] [--force] [--pin] [--marketplace <source>]
openclaw plugins inspect <id> [--runtime] [--json]
openclaw plugins inspect --all [--runtime] [--json]
openclaw plugins info <id>                    # alias for inspect
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

Để điều tra thao tác cài đặt, kiểm tra, gỡ cài đặt hoặc làm mới sổ đăng ký bị chậm, hãy chạy
lệnh với `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`. Dữ liệu theo dõi ghi thời gian của từng giai đoạn
vào stderr và vẫn giữ cho đầu ra JSON có thể phân tích được. Xem [Gỡ lỗi](/vi/help/debugging#plugin-lifecycle-trace).

<Note>
Ở chế độ Nix (`OPENCLAW_NIX_MODE=1`), `openclaw.json` là bất biến. Các lệnh `install`, `update`, `uninstall`, `enable` và `disable` đều từ chối chạy. Thay vào đó, hãy chỉnh sửa nguồn Nix cho bản cài đặt này (`programs.openclaw.config` hoặc `instances.<name>.config` đối với nix-openclaw), rồi xây dựng lại. Xem [Bắt đầu nhanh](https://github.com/openclaw/nix-openclaw#quick-start) theo hướng ưu tiên tác nhân.
</Note>

<Note>
Các Plugin đi kèm được phân phối cùng OpenClaw. Một số được bật theo mặc định (ví dụ: nhà cung cấp mô hình đi kèm, nhà cung cấp giọng nói đi kèm và Plugin trình duyệt đi kèm); các Plugin khác cần dùng `plugins enable`.

Các Plugin OpenClaw gốc cung cấp `openclaw.plugin.json` cùng một JSON Schema nội tuyến (`configSchema`, kể cả khi trống). Các gói tương thích sử dụng tệp kê khai gói riêng.

`plugins list` hiển thị `Format: openclaw` hoặc `Format: bundle`. Đầu ra danh sách/thông tin chi tiết cũng hiển thị kiểu con của gói (`codex`, `claude` hoặc `cursor`) cùng các khả năng của gói được phát hiện.
</Note>

## Phát triển

```bash
openclaw plugins init stock-quotes --name "Stock Quotes"
cd stock-quotes
npm run plugin:build
npm run plugin:validate
```

Theo mặc định, `plugins init` tạo một Plugin công cụ TypeScript tối thiểu. Đối số
đầu tiên là mã định danh Plugin; `--name` đặt tên hiển thị. OpenClaw sử dụng
mã định danh cho thư mục đầu ra mặc định và cách đặt tên gói. Khung công cụ sử dụng
`defineToolPlugin` và tạo các tập lệnh `plugin:build` cùng
`plugin:validate` trong `package.json`; chúng xây dựng rồi gọi `openclaw plugins build`/`validate`.

`plugins build` nhập điểm vào đã xây dựng, đọc siêu dữ liệu công cụ tĩnh, ghi
`openclaw.plugin.json` và giữ cho `openclaw.extensions` trong `package.json` đồng bộ.
`plugins validate` kiểm tra rằng tệp kê khai đã tạo, siêu dữ liệu gói và
phần xuất hiện tại của điểm vào vẫn nhất quán. Xem [Plugin công cụ](/vi/plugins/tool-plugins) để biết
toàn bộ quy trình phát triển.

Khung tạo mã nguồn TypeScript nhưng sinh siêu dữ liệu từ điểm vào
`./dist/index.js` đã xây dựng, vì vậy quy trình này cũng hoạt động với CLI đã phát hành. Dùng
`--entry <path>` khi điểm vào không phải điểm vào mặc định của gói. Dùng
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
bao gồm cơ chế xác thực bằng khóa API, tập lệnh `npm run validate` chạy
`clawhub package validate`, siêu dữ liệu gói ClawHub và một quy trình GitHub Actions
được kích hoạt thủ công để hỗ trợ việc phát hành đáng tin cậy qua GitHub
OIDC trong tương lai. Khung nhà cung cấp không tạo Skills và không sử dụng
`openclaw plugins build`/`validate`; các lệnh đó dành cho luồng siêu dữ liệu được tạo
của khung công cụ.

Trước khi phát hành, hãy thay URL cơ sở API giữ chỗ, danh mục mô hình, tuyến tài liệu,
văn bản thông tin xác thực và nội dung README bằng thông tin thực tế của nhà cung cấp. Dùng
README đã tạo để phát hành lần đầu lên ClawHub và thiết lập nhà phát hành đáng tin cậy.

## Cài đặt

```bash
openclaw plugins search "calendar"                      # search ClawHub plugins
openclaw plugins install <package>                       # source auto-detection
openclaw plugins install clawhub:<package>                # ClawHub only
openclaw plugins install npm:<package>                    # npm only
openclaw plugins install npm-pack:<path.tgz>               # local npm-pack tarball
openclaw plugins install git:github.com/<owner>/<repo>     # git repo
openclaw plugins install git:github.com/<owner>/<repo>@<ref>
openclaw plugins install <path>                            # local path or archive
openclaw plugins install -l <path>                         # link instead of copy
openclaw plugins install <plugin>@<marketplace>             # marketplace shorthand
openclaw plugins install <plugin> --marketplace <name>      # marketplace (explicit)
openclaw plugins install <package> --force                  # overwrite existing install
openclaw plugins install <package> --pin                    # pin resolved npm version
openclaw plugins install clawhub:<package> --acknowledge-clawhub-risk
openclaw plugins install <package> --dangerously-force-unsafe-install
```

Người bảo trì kiểm thử việc cài đặt trong quá trình thiết lập có thể ghi đè
các nguồn cài đặt Plugin tự động bằng những biến môi trường có cơ chế bảo vệ. Xem
[Ghi đè nguồn cài đặt Plugin](/vi/plugins/install-overrides).

<Warning>
Trong giai đoạn chuyển đổi khi ra mắt, tên gói thuần túy mặc định được cài đặt từ npm, trừ khi chúng khớp với mã định danh của một Plugin đi kèm hoặc chính thức; trong trường hợp đó, OpenClaw sử dụng bản sao cục bộ/chính thức thay vì truy cập sổ đăng ký npm. Dùng `npm:<package>` khi bạn chủ ý muốn dùng một gói npm bên ngoài. Dùng `clawhub:<package>` cho ClawHub. Hãy coi việc cài đặt Plugin giống như chạy mã; ưu tiên các phiên bản được ghim.
</Warning>

`plugins search` truy vấn ClawHub để tìm các gói `code-plugin` và
`bundle-plugin` có thể cài đặt (không phải Skills; hãy dùng `openclaw skills search` cho chúng).
Giá trị mặc định của `--limit` là 20, tối đa 100. Lệnh này chỉ đọc danh mục từ xa: không
kiểm tra trạng thái cục bộ, sửa đổi cấu hình, cài đặt gói hay tải môi trường chạy
Plugin. Kết quả bao gồm tên gói ClawHub, họ, kênh, phiên bản,
tóm tắt và gợi ý cài đặt như `openclaw plugins install clawhub:<package>`.

<Note>
ClawHub là nơi phân phối và khám phá chính cho hầu hết các Plugin. Npm
vẫn là phương án dự phòng được hỗ trợ và là đường dẫn cài đặt trực tiếp. Các gói Plugin
`@openclaw/*` do OpenClaw sở hữu đã được phát hành lại trên npm; xem danh sách hiện tại
tại [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) hoặc
[danh mục Plugin](/vi/plugins/plugin-inventory). Bản cài đặt ổn định sử dụng `latest`.
Bản cài đặt và cập nhật trên kênh beta ưu tiên thẻ phân phối npm `beta` khi có,
nếu không sẽ dùng `latest`. Trên kênh ổn định mở rộng, các Plugin npm chính thức
có ý định dùng giá trị thuần túy/mặc định hoặc `latest` sẽ phân giải thành chính xác phiên bản
lõi đã cài đặt. Các phiên bản ghim chính xác và thẻ không phải `latest` được chỉ định rõ, gói của bên thứ ba và
nguồn không phải npm sẽ không bị viết lại.
</Note>

<AccordionGroup>
  <Accordion title="Tệp cấu hình được bao gồm và sửa cấu hình không hợp lệ">
    Nếu phần `plugins` của bạn dựa trên một `$include` đơn tệp, `plugins install/update/enable/disable/uninstall` sẽ ghi xuyên vào tệp được bao gồm đó và không thay đổi `openclaw.json`. Các tệp bao gồm ở gốc, mảng tệp bao gồm và tệp bao gồm có giá trị ghi đè cùng cấp sẽ đóng an toàn thay vì bị làm phẳng. Xem [Tệp cấu hình được bao gồm](/vi/gateway/configuration) để biết các cấu trúc được hỗ trợ.

    Nếu cấu hình không hợp lệ trong quá trình cài đặt, `plugins install` thường sẽ đóng an toàn và yêu cầu bạn chạy `openclaw doctor --fix` trước. Trong quá trình Gateway khởi động và tải lại nóng, cấu hình Plugin không hợp lệ sẽ đóng an toàn giống như mọi cấu hình không hợp lệ khác; `openclaw doctor --fix` có thể cách ly mục Plugin không hợp lệ. Ngoại lệ duy nhất được ghi nhận cho thời điểm cài đặt là một đường khôi phục hẹp dành cho Plugin đi kèm đã chủ động bật `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force và cài đặt lại so với cập nhật">
    `--force` tái sử dụng đích cài đặt hiện có và ghi đè tại chỗ một Plugin hoặc gói hook đã được cài đặt. Dùng tùy chọn này khi bạn chủ ý cài đặt lại cùng một mã định danh từ đường dẫn cục bộ, tệp lưu trữ, gói ClawHub hoặc tạo phẩm npm mới. Đối với các bản nâng cấp thông thường của một Plugin npm đã được theo dõi, hãy ưu tiên `openclaw plugins update <id-or-npm-spec>`.

    Nếu bạn chạy `plugins install` cho một mã định danh Plugin đã được cài đặt, OpenClaw sẽ dừng và hướng bạn đến `plugins update <id-or-npm-spec>` để nâng cấp thông thường, hoặc đến `plugins install <package> --force` khi bạn thực sự muốn ghi đè bản cài đặt hiện tại từ một nguồn khác. `--force` không được hỗ trợ cùng `--link`.

  </Accordion>
  <Accordion title="Phạm vi của --pin">
    `--pin` chỉ áp dụng cho bản cài đặt npm và ghi lại chính xác `<name>@<version>` đã phân giải. Tùy chọn này không được hỗ trợ với bản cài đặt `git:` (thay vào đó hãy ghim tham chiếu trong đặc tả, ví dụ `git:github.com/acme/plugin@v1.2.3`) hoặc với `--marketplace` (bản cài đặt từ chợ lưu siêu dữ liệu nguồn của chợ thay vì đặc tả npm).
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` đã lỗi thời và hiện không thực hiện thao tác nào. OpenClaw không còn chạy cơ chế chặn mã nguy hiểm tích hợp sẵn tại thời điểm cài đặt Plugin.

    Hãy dùng bề mặt `security.installPolicy` do người vận hành sở hữu khi cần chính sách cài đặt dành riêng cho máy chủ. Các hook `before_install` của Plugin là hook vòng đời môi trường chạy Plugin, không phải ranh giới chính sách chính cho việc cài đặt qua CLI.

    Nếu một Plugin bạn đã phát hành trên ClawHub bị ẩn hoặc chặn bởi quá trình quét sổ đăng ký, hãy làm theo các bước dành cho nhà phát hành trong [Phát hành trên ClawHub](/vi/clawhub/publishing). `--dangerously-force-unsafe-install` không yêu cầu ClawHub quét lại Plugin hoặc công khai một bản phát hành bị chặn.

  </Accordion>
  <Accordion title="--acknowledge-clawhub-risk">
    Khi cài đặt từ cộng đồng ClawHub, OpenClaw kiểm tra hồ sơ tin cậy của bản phát hành đã chọn trước khi tải xuống. Nếu ClawHub vô hiệu hóa việc tải xuống đối với bản phát hành, báo cáo phát hiện quét độc hại hoặc đặt bản phát hành vào trạng thái kiểm duyệt chặn (bị cách ly, bị thu hồi), OpenClaw sẽ từ chối hoàn toàn bất kể cờ này. Đối với trạng thái quét rủi ro hoặc trạng thái kiểm duyệt không chặn, OpenClaw hiển thị chi tiết độ tin cậy và yêu cầu xác nhận trước khi tiếp tục.

    Chỉ dùng `--acknowledge-clawhub-risk` sau khi xem xét cảnh báo của ClawHub và quyết định tiếp tục mà không cần lời nhắc tương tác. Kết quả quét đang chờ hoặc đã cũ (chưa được xác nhận sạch) sẽ đưa ra cảnh báo nhưng không yêu cầu xác nhận rủi ro. Các gói ClawHub chính thức và nguồn Plugin OpenClaw đi kèm hoàn toàn bỏ qua bước kiểm tra độ tin cậy của bản phát hành này.

  </Accordion>
  <Accordion title="Gói hook và đặc tả npm">
    `plugins install` cũng là bề mặt cài đặt cho các gói hook cung cấp `openclaw.hooks` trong `package.json`. Dùng `openclaw hooks` để xem hook theo bộ lọc và bật từng hook, không dùng để cài đặt gói.

    Các đặc tả npm **chỉ dành cho registry** (tên gói cùng **phiên bản chính xác** hoặc **dist-tag** tùy chọn). Các đặc tả Git/URL/tệp và dải semver sẽ bị từ chối. Việc cài đặt phần phụ thuộc chạy trong một dự án npm được quản lý cho mỗi plugin với `--ignore-scripts` để bảo đảm an toàn, ngay cả khi shell của bạn có thiết lập cài đặt npm toàn cục. Các dự án npm plugin được quản lý kế thừa `overrides` npm cấp gói của OpenClaw, vì vậy các bản ghim bảo mật của máy chủ cũng áp dụng cho các phần phụ thuộc plugin được đưa lên cấp cao.

    Dùng `npm:<package>` để chỉ rõ việc phân giải npm. Các đặc tả gói trần cũng được cài đặt trực tiếp từ npm trong quá trình chuyển đổi khi ra mắt, trừ khi chúng khớp với một mã định danh plugin chính thức.

    Các đặc tả `@openclaw/*` thô khớp với plugin đi kèm sẽ phân giải thành bản đi kèm do image sở hữu trước khi dự phòng sang npm. Ví dụ, `openclaw plugins install @openclaw/discord@2026.5.20 --pin` dùng plugin Discord đi kèm từ bản dựng OpenClaw hiện tại thay vì tạo một bản ghi đè npm được quản lý. Để buộc dùng gói npm bên ngoài, hãy dùng `openclaw plugins install npm:@openclaw/discord@2026.5.20 --pin`.

    Các đặc tả trần và `@latest` vẫn đi theo kênh ổn định. Các phiên bản sửa lỗi có dấu ngày của OpenClaw như `2026.5.3-1` được tính là ổn định trong lần kiểm tra này. Nếu npm phân giải một trong hai dạng thành bản phát hành trước, OpenClaw sẽ dừng và yêu cầu bạn chủ động chọn tham gia bằng thẻ phát hành trước (`@beta`/`@rc`) hoặc phiên bản phát hành trước chính xác (`@1.2.3-beta.4`).

    Với các lượt cài đặt npm không có phiên bản chính xác (`npm:<package>` hoặc `npm:<package>@latest`), OpenClaw kiểm tra siêu dữ liệu của gói đã phân giải trước khi cài đặt. Nếu gói ổn định mới nhất yêu cầu API plugin OpenClaw mới hơn hoặc phiên bản máy chủ tối thiểu cao hơn, OpenClaw sẽ kiểm tra các phiên bản ổn định cũ hơn và cài đặt bản phát hành tương thích mới nhất. Các phiên bản chính xác và dist-tag được chỉ định rõ vẫn được xử lý nghiêm ngặt: lựa chọn không tương thích sẽ thất bại và yêu cầu bạn nâng cấp OpenClaw hoặc chọn phiên bản tương thích.

    Nếu một đặc tả cài đặt trần khớp với mã định danh plugin chính thức (ví dụ `diffs`), OpenClaw sẽ cài đặt trực tiếp mục trong danh mục. Để cài đặt gói npm có cùng tên, hãy dùng đặc tả có phạm vi rõ ràng (ví dụ `@scope/diffs`).

  </Accordion>
  <Accordion title="Kho lưu trữ Git">
    Dùng `git:<repo>` để cài đặt trực tiếp từ kho lưu trữ git. Các dạng được hỗ trợ: `git:github.com/owner/repo`, `git:owner/repo`, URL sao chép đầy đủ `https://`, `ssh://`, `git://`, `file://` và `git@host:owner/repo.git`. Thêm `@<ref>` hoặc `#<ref>` để checkout một nhánh, thẻ hoặc commit trước khi cài đặt.

    Quá trình cài đặt từ Git sao chép kho vào một thư mục tạm thời, checkout ref được yêu cầu nếu có, rồi dùng trình cài đặt thư mục plugin thông thường; do đó việc xác thực manifest, chính sách cài đặt của người vận hành, thao tác cài đặt của trình quản lý gói và bản ghi cài đặt hoạt động giống như cài đặt npm. Các lượt cài đặt git được ghi lại bao gồm URL/ref nguồn cùng commit đã phân giải để `openclaw plugins update` có thể phân giải lại nguồn về sau.

    Sau khi cài đặt từ git, hãy dùng `openclaw plugins inspect <id> --runtime --json` để xác minh các đăng ký thời gian chạy như phương thức Gateway và lệnh CLI. Nếu plugin đã đăng ký một lệnh gốc CLI bằng `api.registerCli`, hãy chạy lệnh đó trực tiếp qua CLI gốc của OpenClaw, ví dụ `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Tệp lưu trữ">
    Các tệp lưu trữ được hỗ trợ: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Tệp lưu trữ plugin OpenClaw gốc phải chứa `openclaw.plugin.json` hợp lệ tại thư mục gốc plugin sau khi giải nén; các tệp lưu trữ chỉ chứa `package.json` sẽ bị từ chối trước khi OpenClaw ghi bản ghi cài đặt.

    Dùng `npm-pack:<path.tgz>` khi tệp là tarball npm-pack và bạn muốn
    sử dụng cùng đường dẫn dự án npm được quản lý cho mỗi plugin như khi cài đặt từ registry,
    bao gồm xác minh `package-lock.json`, quét phần phụ thuộc được đưa lên cấp cao
    và bản ghi cài đặt npm. Các đường dẫn tệp lưu trữ thông thường vẫn được cài đặt dưới dạng
    tệp lưu trữ cục bộ trong thư mục gốc phần mở rộng plugin.

    Việc cài đặt từ marketplace Claude cũng được hỗ trợ.

  </Accordion>
</AccordionGroup>

Các lượt cài đặt ClawHub dùng bộ định vị `clawhub:<package>` rõ ràng:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Theo mặc định, các đặc tả plugin trần hợp lệ với npm được cài đặt từ npm trong quá trình chuyển đổi khi ra mắt, trừ khi chúng khớp với một mã định danh plugin chính thức:

```bash
openclaw plugins install openclaw-codex-app-server
```

Dùng `npm:` để chỉ rõ chỉ phân giải qua npm:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@openclaw/discord@2026.5.20
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw kiểm tra khả năng tương thích được công bố của API plugin / phiên bản Gateway tối thiểu trước khi cài đặt. Khi phiên bản ClawHub được chọn phát hành một tạo phẩm ClawPack, OpenClaw tải xuống `.tgz` npm-pack có phiên bản, xác minh header digest ClawHub và digest của tạo phẩm, rồi cài đặt qua đường dẫn tệp lưu trữ thông thường. Các phiên bản ClawHub cũ hơn không có siêu dữ liệu ClawPack vẫn được cài đặt qua đường dẫn xác minh tệp lưu trữ gói cũ. Các bản ghi cài đặt giữ lại siêu dữ liệu nguồn ClawHub, loại tạo phẩm, tính toàn vẹn npm, shasum npm, tên tarball và thông tin digest ClawPack để dùng cho các lần cập nhật sau.
Các lượt cài đặt ClawHub không chỉ định phiên bản giữ đặc tả không có phiên bản trong bản ghi để `openclaw plugins update` có thể theo các bản phát hành ClawHub mới hơn; các bộ chọn phiên bản hoặc thẻ rõ ràng như `clawhub:pkg@1.2.3` và `clawhub:pkg@beta` vẫn được ghim vào bộ chọn đó.

### Cú pháp rút gọn của marketplace

Dùng cú pháp rút gọn `plugin@marketplace` khi tên marketplace tồn tại trong bộ nhớ đệm registry cục bộ của Claude tại `~/.claude/plugins/known_marketplaces.json`:

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

Dùng `--marketplace` để truyền nguồn marketplace một cách rõ ràng:

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

<Tabs>
  <Tab title="Nguồn marketplace">
    - tên marketplace đã biết của Claude từ `~/.claude/plugins/known_marketplaces.json`
    - thư mục gốc marketplace cục bộ hoặc đường dẫn `marketplace.json`
    - cú pháp rút gọn kho GitHub như `owner/repo`
    - URL kho GitHub như `https://github.com/owner/repo`
    - URL git

  </Tab>
  <Tab title="Quy tắc marketplace từ xa">
    Với các marketplace từ xa được tải từ GitHub hoặc git, các mục plugin phải nằm trong kho marketplace đã sao chép. OpenClaw chấp nhận các nguồn đường dẫn tương đối từ kho đó và từ chối các nguồn plugin HTTP(S), đường dẫn tuyệt đối, git, GitHub và các nguồn không phải đường dẫn khác từ manifest từ xa.
  </Tab>
</Tabs>

Đối với đường dẫn và tệp lưu trữ cục bộ, OpenClaw tự động phát hiện:

- plugin OpenClaw gốc (`openclaw.plugin.json`)
- gói tương thích với Codex (`.codex-plugin/plugin.json`)
- gói tương thích với Claude (`.claude-plugin/plugin.json`, hoặc bố cục thành phần Claude mặc định khi không có tệp manifest đó)
- gói tương thích với Cursor (`.cursor-plugin/plugin.json`)

Các lượt cài đặt cục bộ được quản lý phải là thư mục plugin hoặc tệp lưu trữ. Các tệp plugin độc lập `.js`,
`.mjs`, `.cjs` và `.ts` không được `plugins install` sao chép vào thư mục gốc plugin
được quản lý, cũng không được tải khi đặt trực tiếp trong
`~/.openclaw/extensions` hoặc `<workspace>/.openclaw/extensions`; các thư mục gốc
được tự động phát hiện đó tải các thư mục gói hoặc bundle plugin và bỏ qua
các tệp script cấp cao nhất như trình trợ giúp cục bộ. Thay vào đó, hãy liệt kê rõ các tệp độc lập trong
`plugins.load.paths`.

<Note>
Các bundle tương thích được cài đặt vào thư mục gốc plugin thông thường và tham gia cùng quy trình liệt kê/thông tin/bật/tắt. Hiện tại, Skills của bundle, Skills lệnh Claude, giá trị mặc định trong `settings.json` của Claude, giá trị mặc định trong `.lsp.json` / `lspServers` được khai báo trong manifest của Claude, Skills lệnh Cursor và các thư mục hook Codex tương thích đã được hỗ trợ; các khả năng bundle khác được phát hiện sẽ xuất hiện trong chẩn đoán/thông tin nhưng chưa được kết nối với quá trình thực thi thời gian chạy.
</Note>

Dùng `-l`/`--link` để trỏ tới một thư mục plugin cục bộ mà không sao chép nó (thêm
vào `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

`--link` không được hỗ trợ cùng với `--force` (plugin được liên kết trỏ trực tiếp
tới đường dẫn nguồn nên không có gì để ghi đè tại chỗ), `--marketplace` hoặc
các lượt cài đặt `git:`, và yêu cầu một đường dẫn cục bộ đã tồn tại.

<Note>
Các plugin có nguồn gốc từ workspace được phát hiện trong thư mục gốc phần mở rộng của workspace sẽ không
được nhập hoặc thực thi cho đến khi được bật rõ ràng. Đối với phát triển cục bộ,
hãy chạy `openclaw plugins enable <plugin-id>` hoặc đặt
`plugins.entries.<plugin-id>.enabled: true`; nếu cấu hình của bạn dùng
`plugins.allow`, hãy thêm cùng mã định danh plugin vào đó. Quy tắc từ chối mặc định này
cũng áp dụng khi thiết lập kênh nhắm rõ ràng đến một plugin có nguồn gốc từ workspace để
chỉ tải phục vụ thiết lập, vì vậy mã thiết lập plugin kênh cục bộ sẽ không chạy khi
plugin workspace đó vẫn bị tắt hoặc bị loại khỏi danh sách cho phép. Các lượt cài đặt
được liên kết và mục `plugins.load.paths` rõ ràng tuân theo chính sách thông thường đối với
nguồn gốc plugin đã phân giải. Xem
[Cấu hình chính sách plugin](/vi/tools/plugin#configure-plugin-policy)
và [Tham chiếu cấu hình](/vi/gateway/configuration-reference#plugins).

Dùng `--pin` khi cài đặt npm để lưu đặc tả chính xác đã phân giải (`name@version`) vào chỉ mục plugin được quản lý, trong khi hành vi mặc định vẫn không ghim.
</Note>

## Liệt kê

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

<ParamField path="--enabled" type="boolean">
  Chỉ hiển thị các plugin đã bật.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Chuyển từ chế độ xem bảng sang các dòng chi tiết cho từng plugin với siêu dữ liệu định dạng/nguồn/xuất xứ/phiên bản/kích hoạt.
</ParamField>
<ParamField path="--json" type="boolean">
  Danh mục có thể đọc bằng máy cùng thông tin chẩn đoán registry và trạng thái cài đặt phần phụ thuộc gói.
</ParamField>

<Note>
`plugins list` đọc registry plugin cục bộ đã lưu trước, với phương án dự phòng được suy ra chỉ từ manifest khi registry bị thiếu hoặc không hợp lệ. Lệnh này hữu ích để kiểm tra plugin đã được cài đặt, bật và hiển thị cho quá trình lập kế hoạch khởi động nguội hay chưa, nhưng không phải là phép thăm dò thời gian chạy trực tiếp đối với một tiến trình Gateway đang chạy. Sau khi thay đổi mã plugin, trạng thái bật, chính sách hook hoặc `plugins.load.paths`, hãy khởi động lại Gateway phục vụ kênh trước khi mong đợi mã `register(api)` hoặc hook mới chạy. Với các triển khai từ xa/container, hãy xác minh rằng bạn đang khởi động lại tiến trình con `openclaw gateway run` thực tế, không chỉ tiến trình bao ngoài.

`plugins list --json` bao gồm `dependencyStatus` của từng plugin từ `dependencies`
và `optionalDependencies` trong `package.json`. OpenClaw kiểm tra xem các tên gói
đó có xuất hiện dọc theo đường dẫn tra cứu `node_modules` thông thường của Node dành cho plugin hay không; lệnh này
không nhập mã thời gian chạy của plugin, chạy trình quản lý gói hoặc sửa chữa
các phần phụ thuộc bị thiếu.
</Note>

Nếu nhật ký khởi động ghi `plugins.allow is empty; discovered non-bundled plugins may auto-load: ...`,
hãy chạy `openclaw plugins list --enabled --verbose` hoặc
`openclaw plugins inspect <id>` với mã định danh plugin được liệt kê để xác nhận các mã định danh
plugin và sao chép các mã định danh đáng tin cậy vào `plugins.allow` trong `openclaw.json`. Khi
cảnh báo có thể liệt kê mọi plugin được phát hiện, nó sẽ in một đoạn
`plugins.allow` sẵn sàng để dán, trong đó đã bao gồm các mã định danh đó. Nếu một plugin được tải
mà không có nguồn gốc cài đặt/đường dẫn tải, hãy kiểm tra mã định danh plugin đó, sau đó ghim
mã định danh đáng tin cậy trong `plugins.allow` hoặc cài đặt lại plugin từ nguồn đáng tin cậy
để OpenClaw ghi lại nguồn gốc cài đặt.

Đối với công việc trên plugin đi kèm bên trong image Docker đã đóng gói, hãy bind-mount thư mục
nguồn plugin đè lên đường dẫn nguồn đã đóng gói tương ứng, chẳng hạn
`/app/extensions/synology-chat`. OpenClaw phát hiện lớp phủ nguồn đã mount đó
trước `/app/dist/extensions/synology-chat`; một thư mục nguồn chỉ được sao chép
vẫn không hoạt động, vì vậy các lượt cài đặt đóng gói thông thường vẫn dùng bản dist đã biên dịch.

Để gỡ lỗi hook thời gian chạy:

- `openclaw plugins inspect <id> --runtime --json` hiển thị các hook đã đăng ký và thông tin chẩn đoán từ một lượt kiểm tra có tải mô-đun. Kiểm tra lúc chạy không bao giờ cài đặt phần phụ thuộc; hãy dùng `openclaw doctor --fix` để dọn dẹp trạng thái phần phụ thuộc cũ hoặc khôi phục các plugin có thể tải xuống đang bị thiếu nhưng được tham chiếu trong cấu hình.
- `openclaw gateway status --deep --require-rpc` xác nhận URL/hồ sơ Gateway có thể truy cập, các gợi ý về dịch vụ/tiến trình, đường dẫn cấu hình và tình trạng RPC.
- Các hook hội thoại không đi kèm (`llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize`, `agent_end`) yêu cầu `plugins.entries.<id>.hooks.allowConversationAccess=true`.

### Chỉ mục Plugin

Siêu dữ liệu cài đặt Plugin là trạng thái do máy quản lý, không phải cấu hình người dùng. Các thao tác cài đặt và cập nhật ghi dữ liệu này vào cơ sở dữ liệu trạng thái SQLite dùng chung trong thư mục trạng thái OpenClaw đang hoạt động. Hàng `installed_plugin_index` lưu siêu dữ liệu `installRecords` bền vững, bao gồm các bản ghi cho tệp kê khai plugin bị lỗi hoặc bị thiếu, cùng bộ nhớ đệm registry nguội được tạo từ tệp kê khai mà `openclaw plugins update`, thao tác gỡ cài đặt, chẩn đoán và registry plugin nguội sử dụng.

Khi OpenClaw phát hiện các bản ghi `plugins.installs` cũ đã phát hành trong cấu hình, các thao tác đọc lúc chạy coi chúng là đầu vào tương thích mà không ghi lại `openclaw.json`. Các thao tác ghi plugin rõ ràng và `openclaw doctor --fix` chuyển những bản ghi đó vào chỉ mục plugin rồi xóa khóa cấu hình khi được phép ghi cấu hình; nếu một trong hai thao tác ghi thất bại, các bản ghi cấu hình sẽ được giữ lại để siêu dữ liệu cài đặt không bị mất.

## Gỡ cài đặt

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
openclaw plugins uninstall <id> --force
```

`uninstall` xóa các bản ghi plugin khỏi `plugins.entries`, chỉ mục plugin đã lưu, các mục trong danh sách cho phép/từ chối plugin và các mục `plugins.load.paths` được liên kết khi áp dụng. Trừ khi đặt `--keep-files`, thao tác gỡ cài đặt cũng xóa thư mục cài đặt được quản lý đang được theo dõi, nhưng chỉ khi đường dẫn đó được phân giải bên trong thư mục gốc phần mở rộng plugin của OpenClaw. Nếu plugin hiện sở hữu vị trí `memory` hoặc `contextEngine`, vị trí đó sẽ được đặt lại về giá trị mặc định (`memory-core` cho bộ nhớ, `legacy` cho công cụ ngữ cảnh).

`uninstall` in bản xem trước về nội dung sẽ bị xóa, sau đó nhắc `Uninstall plugin "<id>"?` trước khi thực hiện thay đổi. Truyền `--force` để bỏ qua lời nhắc xác nhận (hữu ích cho tập lệnh và các lượt chạy không tương tác); nếu không có cờ này, thao tác gỡ cài đặt yêu cầu TTY tương tác. `--dry-run` in cùng bản xem trước rồi thoát mà không nhắc hoặc thay đổi bất kỳ nội dung nào.

<Note>
`--keep-config` được hỗ trợ dưới dạng bí danh đã ngừng khuyến nghị của `--keep-files`.
</Note>

## Cập nhật

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call
openclaw plugins update openclaw-codex-app-server --acknowledge-clawhub-risk
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

Các bản cập nhật áp dụng cho những bản cài đặt plugin được theo dõi trong chỉ mục plugin được quản lý và những bản cài đặt gói hook được theo dõi trong `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="Phân giải mã định danh plugin và đặc tả npm">
    Khi bạn truyền mã định danh plugin, OpenClaw tái sử dụng đặc tả cài đặt đã ghi cho plugin đó. Điều này có nghĩa là các thẻ phân phối đã lưu trước đó như `@beta` và những phiên bản được ghim chính xác tiếp tục được sử dụng trong các lượt chạy `update <id>` sau này.

    Trong `update <id> --dry-run`, các bản cài đặt npm được ghim phiên bản chính xác vẫn được giữ nguyên. Nếu OpenClaw cũng có thể phân giải dòng mặc định trong registry của gói và dòng mặc định đó mới hơn phiên bản được ghim đã cài đặt, lượt chạy thử sẽ báo về phiên bản ghim và in lệnh cập nhật gói `@latest` rõ ràng để chuyển sang dòng mặc định của registry.

    Quy tắc cập nhật có mục tiêu đó khác với đường dẫn bảo trì hàng loạt `openclaw plugins update --all`. Các bản cập nhật hàng loạt vẫn tuân theo đặc tả cài đặt được theo dõi thông thường, nhưng các bản ghi plugin OpenClaw chính thức đáng tin cậy có thể đồng bộ với mục tiêu danh mục chính thức hiện tại thay vì tiếp tục dùng một gói chính thức chính xác đã lỗi thời. Hãy dùng `update <id>` có mục tiêu khi bạn chủ ý muốn giữ nguyên một đặc tả chính thức chính xác hoặc có gắn thẻ.

    Đối với các bản cài đặt npm, bạn cũng có thể truyền một đặc tả gói npm rõ ràng với thẻ phân phối hoặc phiên bản chính xác. OpenClaw phân giải tên gói đó trở lại bản ghi plugin được theo dõi, cập nhật plugin đã cài đặt đó và ghi lại đặc tả npm mới cho các bản cập nhật dựa trên mã định danh trong tương lai.

    Việc truyền tên gói npm mà không có phiên bản hoặc thẻ cũng phân giải trở lại bản ghi plugin được theo dõi. Hãy dùng cách này khi plugin đã được ghim vào một phiên bản chính xác và bạn muốn chuyển nó trở lại dòng phát hành mặc định của registry.

  </Accordion>
  <Accordion title="Cập nhật kênh beta">
    `openclaw plugins update <id-or-npm-spec>` có mục tiêu tái sử dụng đặc tả plugin được theo dõi trừ khi bạn truyền một đặc tả mới. `openclaw plugins update --all` hàng loạt sử dụng `update.channel` đã cấu hình khi đồng bộ các bản ghi plugin chính thức đáng tin cậy với mục tiêu danh mục chính thức, vì vậy các bản cài đặt thuộc kênh beta có thể tiếp tục dùng dòng phát hành beta thay vì bị âm thầm chuẩn hóa thành ổn định/mới nhất.

    `openclaw update` cũng nhận biết kênh cập nhật OpenClaw đang hoạt động: trên kênh beta, các bản ghi plugin npm thuộc dòng mặc định và ClawHub sẽ thử `@beta` trước. Chúng quay về đặc tả mặc định/mới nhất đã ghi nếu không tồn tại bản phát hành beta của plugin; plugin npm cũng quay về khi gói beta tồn tại nhưng không vượt qua bước xác thực cài đặt. Việc quay về này được báo dưới dạng cảnh báo và không làm bản cập nhật lõi thất bại. Các phiên bản chính xác và thẻ rõ ràng vẫn được ghim vào bộ chọn đó đối với các bản cập nhật có mục tiêu.

  </Accordion>
  <Accordion title="Kiểm tra phiên bản và sai lệch tính toàn vẹn">
    Trước một bản cập nhật npm trực tiếp, OpenClaw kiểm tra phiên bản gói đã cài đặt dựa trên siêu dữ liệu registry npm. Nếu phiên bản đã cài đặt và danh tính cấu phần đã ghi đều khớp với mục tiêu đã phân giải, bản cập nhật sẽ bị bỏ qua mà không tải xuống, cài đặt lại hoặc ghi lại `openclaw.json`.

    Khi tồn tại giá trị băm toàn vẹn đã lưu và giá trị băm của cấu phần đã truy xuất thay đổi, OpenClaw coi đó là sai lệch cấu phần npm. Lệnh tương tác `openclaw plugins update` in giá trị băm dự kiến và thực tế rồi yêu cầu xác nhận trước khi tiếp tục. Các trình trợ giúp cập nhật không tương tác mặc định sẽ từ chối tiếp tục trừ khi bên gọi cung cấp chính sách tiếp tục rõ ràng.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install khi cập nhật">
    `--dangerously-force-unsafe-install` cũng được chấp nhận trên `plugins update` để đảm bảo tính tương thích, nhưng cờ này đã ngừng khuyến nghị và không còn thay đổi hành vi cập nhật plugin. `security.installPolicy` của người vận hành vẫn có thể chặn các bản cập nhật; các hook `before_install` của plugin chỉ áp dụng trong những tiến trình đã tải hook plugin.
  </Accordion>
  <Accordion title="--acknowledge-clawhub-risk khi cập nhật">
    Các bản cập nhật plugin cộng đồng dựa trên ClawHub thực hiện cùng phép kiểm tra độ tin cậy của bản phát hành chính xác như khi cài đặt trước khi tải xuống gói thay thế. Hãy dùng `--acknowledge-clawhub-risk` cho quy trình tự động hóa đã được xem xét cần tiếp tục khi bản phát hành ClawHub được chọn có cảnh báo tin cậy rủi ro. Các gói ClawHub chính thức và nguồn Plugin OpenClaw đi kèm bỏ qua lời nhắc về độ tin cậy của bản phát hành này.
  </Accordion>
</AccordionGroup>

## Kiểm tra

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
openclaw plugins inspect --all
```

Lệnh kiểm tra hiển thị danh tính, trạng thái tải, nguồn, khả năng trong tệp kê khai, cờ chính sách, chẩn đoán, siêu dữ liệu cài đặt, khả năng của gói cùng mọi hỗ trợ máy chủ MCP hoặc LSP được phát hiện mà theo mặc định không nhập môi trường lúc chạy của plugin. Đầu ra JSON bao gồm các hợp đồng trong tệp kê khai plugin, chẳng hạn như `contracts.agentToolResultMiddleware` và `contracts.trustedToolPolicies`, để người vận hành có thể kiểm tra các khai báo bề mặt đáng tin cậy trước khi bật hoặc khởi động lại plugin. Thêm `--runtime` để tải mô-đun plugin và bao gồm các hook, công cụ, lệnh, dịch vụ, phương thức Gateway và tuyến HTTP đã đăng ký. Kiểm tra lúc chạy báo trực tiếp những phần phụ thuộc plugin bị thiếu; việc cài đặt và sửa chữa vẫn thuộc về `openclaw plugins install`, `openclaw plugins update` và `openclaw doctor --fix`.

Các lệnh CLI do plugin sở hữu thường được cài đặt dưới dạng nhóm lệnh `openclaw` gốc, nhưng plugin cũng có thể đăng ký các lệnh lồng nhau dưới một lệnh cha thuộc lõi như `openclaw nodes`. Sau khi `inspect --runtime` hiển thị một lệnh trong `cliCommands`, hãy chạy lệnh đó tại đường dẫn được liệt kê; ví dụ, một plugin đăng ký `demo-git` có thể được xác minh bằng `openclaw demo-git ping`.

Mỗi plugin được phân loại theo nội dung mà nó thực sự đăng ký lúc chạy:

| Hình dạng            | Ý nghĩa                                                                    |
| -------------------- | -------------------------------------------------------------------------- |
| `plain-capability`   | chính xác một loại khả năng (ví dụ: plugin chỉ cung cấp nhà cung cấp)       |
| `hybrid-capability`  | nhiều hơn một loại khả năng (ví dụ: văn bản + giọng nói + hình ảnh)         |
| `hook-only`          | chỉ có hook, không có khả năng, công cụ, lệnh, dịch vụ hoặc tuyến            |
| `non-capability`     | có công cụ/lệnh/dịch vụ nhưng không có khả năng                             |

Xem [Hình dạng Plugin](/vi/plugins/architecture#plugin-shapes) để biết thêm về mô hình khả năng.

<Note>
Cờ `--json` xuất báo cáo có thể đọc bằng máy, phù hợp cho việc viết tập lệnh và kiểm tra. `inspect --all` kết xuất bảng cho toàn bộ hệ thống với các cột về hình dạng, loại khả năng, thông báo tương thích, khả năng của gói và tóm tắt hook. `info` là bí danh của `inspect`.
</Note>

## Chẩn đoán

```bash
openclaw plugins doctor
```

`doctor` báo các lỗi tải plugin, chẩn đoán tệp kê khai/khám phá, thông báo tương thích và những tham chiếu cấu hình plugin cũ như vị trí plugin bị thiếu. Khi cây cài đặt và cấu hình plugin không có vấn đề, lệnh in `No plugin issues detected.` Nếu cấu hình cũ vẫn còn nhưng cây cài đặt vẫn hoạt động bình thường, phần tóm tắt sẽ nêu rõ điều đó thay vì ngụ ý rằng plugin hoàn toàn khỏe mạnh.

Nếu một plugin đã cấu hình hiện diện trên đĩa nhưng bị chặn bởi các phép kiểm tra an toàn đường dẫn của trình tải, bước xác thực cấu hình sẽ giữ lại mục plugin và báo trạng thái `present but blocked`. Hãy sửa chẩn đoán plugin bị chặn xuất hiện trước đó, chẳng hạn như quyền sở hữu đường dẫn hoặc quyền cho phép mọi người ghi, thay vì xóa cấu hình `plugins.entries.<id>` hoặc `plugins.allow`.

Đối với các lỗi hình dạng mô-đun như thiếu phần xuất `register`/`activate`, hãy chạy lại với `OPENCLAW_PLUGIN_LOAD_DEBUG=1` để đưa phần tóm tắt ngắn gọn về hình dạng phần xuất vào đầu ra chẩn đoán.

## Registry

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Registry plugin cục bộ là mô hình đọc nguội được OpenClaw lưu bền vững cho danh tính plugin đã cài đặt, trạng thái kích hoạt, siêu dữ liệu nguồn và quyền sở hữu phần đóng góp. Quá trình khởi động thông thường, tra cứu chủ sở hữu nhà cung cấp, phân loại thiết lập kênh và kiểm kê plugin có thể đọc dữ liệu này mà không cần nhập các mô-đun lúc chạy của plugin.

Hãy dùng `plugins registry` để kiểm tra xem registry đã lưu có tồn tại, hiện hành hay đã lỗi thời. Dùng `--refresh` để dựng lại registry từ chỉ mục plugin đã lưu, chính sách cấu hình và siêu dữ liệu tệp kê khai/gói. Đây là đường dẫn sửa chữa, không phải đường dẫn kích hoạt lúc chạy.

`openclaw doctor --fix` cũng sửa chữa sai lệch npm được quản lý có liên quan đến registry: nếu một gói `@openclaw/*` mồ côi hoặc được khôi phục trong một dự án npm plugin được quản lý hoặc thư mục gốc npm phẳng được quản lý kiểu cũ che khuất một plugin đi kèm, doctor sẽ xóa gói cũ đó và dựng lại registry để quá trình khởi động xác thực dựa trên tệp kê khai đi kèm. Doctor cũng liên kết lại gói `openclaw` của máy chủ vào các plugin npm được quản lý có khai báo `peerDependencies.openclaw`, để các lệnh nhập lúc chạy cục bộ theo gói như `openclaw/plugin-sdk/*` phân giải được sau khi cập nhật hoặc sửa chữa npm.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` là một công tắc tương thích khẩn cấp đã ngừng khuyến nghị dành cho lỗi đọc registry. Ưu tiên `plugins registry --refresh` hoặc `openclaw doctor --fix`; phương án dự phòng bằng biến môi trường chỉ dành cho việc khôi phục khởi động khẩn cấp trong thời gian triển khai quá trình di chuyển.
</Warning>

## Kho ứng dụng

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

`plugins marketplace entries` liệt kê các mục từ nguồn cấp dữ liệu marketplace OpenClaw đã được cấu hình. Theo mặc định, lệnh sẽ thử dùng nguồn cấp dữ liệu được lưu trữ và chuyển sang ảnh chụp nhanh mới nhất đã được chấp nhận hoặc dữ liệu đi kèm nếu không thành công. Dùng `--feed-profile <name>` để đọc một hồ sơ cụ thể đã được cấu hình, `--feed-url <url>` để đọc một URL nguồn cấp dữ liệu được lưu trữ được chỉ định rõ ràng và `--offline` để đọc ảnh chụp nhanh mới nhất đã được chấp nhận mà không tìm nạp nguồn cấp dữ liệu.

`plugins marketplace refresh` làm mới ảnh chụp nhanh của nguồn cấp dữ liệu được lưu trữ đã cấu hình và báo cáo OpenClaw đã chấp nhận dữ liệu được lưu trữ, ảnh chụp nhanh được lưu trữ hay dữ liệu dự phòng đi kèm. Dùng `--expected-sha256` khi bên gọi cần lệnh thất bại nếu tải trọng mới từ nguồn được lưu trữ không khớp với giá trị tổng kiểm cố định.

Lệnh `list` của marketplace chấp nhận đường dẫn marketplace cục bộ, đường dẫn đến `marketplace.json`, dạng viết tắt GitHub như `owner/repo`, URL kho lưu trữ GitHub hoặc URL git. `--json` in nhãn nguồn đã phân giải cùng với bản kê khai marketplace đã phân tích cú pháp và các mục Plugin.

Lệnh làm mới marketplace tải nguồn cấp dữ liệu marketplace OpenClaw được lưu trữ và lưu lâu dài phản hồi đã xác thực dưới dạng ảnh chụp nhanh nguồn cấp dữ liệu được lưu trữ cục bộ. Khi không có tùy chọn, lệnh sử dụng hồ sơ nguồn cấp dữ liệu mặc định đã cấu hình. Dùng `--feed-profile <name>` để làm mới một hồ sơ cụ thể đã được cấu hình, `--feed-url <url>` để làm mới một URL nguồn cấp dữ liệu được lưu trữ được chỉ định rõ ràng, `--expected-sha256 <sha256>` để yêu cầu tổng kiểm tải trọng khớp (`sha256:<hex>` hoặc chuỗi băm thập lục phân gồm đúng 64 ký tự) và `--json` để xuất dữ liệu ở định dạng máy có thể đọc. URL nguồn cấp dữ liệu được lưu trữ được chỉ định rõ ràng không được chứa thông tin xác thực, chuỗi truy vấn hoặc phân mảnh. Các lần làm mới không cố định tổng kiểm có thể báo cáo kết quả từ ảnh chụp nhanh được lưu trữ hoặc dữ liệu dự phòng đi kèm mà không làm lệnh thất bại. Các lần làm mới có cố định tổng kiểm sẽ thất bại trừ khi chấp nhận tải trọng mới từ nguồn được lưu trữ, và các lần làm mới thành công từ nguồn được lưu trữ sẽ thất bại nếu OpenClaw không thể lưu lâu dài ảnh chụp nhanh đã xác thực.

## Liên quan

- [Xây dựng Plugin](/vi/plugins/building-plugins)
- [Tham chiếu CLI](/vi/cli)
- [ClawHub](/clawhub)
