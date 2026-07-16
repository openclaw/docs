---
read_when: You want agent sessions to run on ephemeral cloud machines instead of the Gateway host, or you are configuring cloudWorkers profiles.
sidebarTitle: Cloud Workers
status: active
summary: 'Điều phối các phiên đến những máy đám mây dùng một lần: cấp phát, môi trường thực thi worker, suy luận qua proxy và truyền phát kết quả trực tiếp'
title: Tiến trình xử lý trên đám mây
x-i18n:
    generated_at: "2026-07-16T15:14:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: c20b3b4f1408ed3ef0beb155a207f99476323cf67eba7b44931eec32c79e52be
    source_path: gateway/cloud-workers.md
    workflow: 16
---

Các worker đám mây cho phép một phiên chạy vòng lặp agent trên một máy đám mây dùng một lần, trong khi mọi thứ về phiên vẫn ở vị trí vốn có: hiển thị trong thanh bên, phát trực tiếp, với bản ghi hội thoại do Gateway sở hữu. Gateway thuê một máy, cài đặt một bản OpenClaw được ghim trên đó, đồng bộ không gian làm việc của phiên sang và giao vòng lặp lượt cho một tiến trình `openclaw worker` bị hạn chế. Các lệnh gọi mô hình được chuyển tiếp qua Gateway, vì vậy thông tin xác thực của nhà cung cấp không bao giờ rời khỏi máy của bạn, và bộ nhớ đệm prompt vẫn hoạt động vì nhà cung cấp nhận thấy một luồng liên tục duy nhất.

Khi công việc hoàn tất (hoặc máy ngừng hoạt động), máy sẽ bị loại bỏ. Trạng thái lâu bền — bản ghi hội thoại, các commit của không gian làm việc, bản ghi vị trí — nằm tại Gateway.

<Note>
Các worker đám mây là tính năng tùy chọn và không hiển thị cho đến khi bạn cấu hình một hồ sơ. Các bản cài đặt chưa được cấu hình không thấy RPC, cấu hình hay giao diện người dùng mới nào.
</Note>

## Thành phần nào chạy ở đâu

| Mối quan tâm                                             | Vị trí                                                                           |
| ------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Vòng lặp agent + công cụ (`exec`, `read`, `write`, `edit`, …) | Máy worker đám mây                                                               |
| Suy luận mô hình và thông tin xác thực của nhà cung cấp | Gateway (được chuyển tiếp bằng tham chiếu `{provider, model}`)                    |
| Bản ghi hội thoại (lâu bền, kho lưu trữ phiên)          | Gateway                                                                          |
| Phát trực tiếp vào thanh bên                            | Phân phối từ Gateway, nhận dữ liệu từ luồng sự kiện có thể phát lại của worker   |
| Lịch sử git của không gian làm việc                     | Được tạo trên máy mà không cần thông tin xác thực; Gateway tiếp nhận commit và sở hữu thao tác push/PR |

Máy không cần cổng đến nào ngoại trừ `sshd`: Gateway kết nối ra ngoài qua SSH được ghim, và một đường hầm ngược truyền WebSocket của worker trở lại. Nhà cung cấp Crabbox đi kèm bắt buộc sử dụng tuyến SSH công khai và tắt đăng ký Tailscale được quản lý. Quyền truy cập internet ra ngoài tuân theo chính sách của nhà cung cấp; hồ sơ AWS mặc định có thể truy cập internet trừ khi bạn hạn chế mạng hoặc nhóm bảo mật của hồ sơ đó.

## Yêu cầu

- Một Plugin nhà cung cấp worker. Plugin `crabbox` đi kèm điều khiển CLI [Crabbox](https://github.com/openclaw/crabbox), công cụ môi giới việc thuê máy trên nhiều nền tảng đám mây (AWS, Hetzner và các nền tảng khác). Tệp nhị phân `crabbox` phải nằm trên `PATH` (hoặc đặt `settings.binary`) và thông tin xác thực của nhà cung cấp phải được cấu hình sẵn. Việc tiếp nhận AWS yêu cầu Crabbox 0.38.1 trở lên.
- Đối với worker Crabbox AWS, giá trị `aws.instanceProfile` có hiệu lực phải trống. Nhà cung cấp kiểm tra `crabbox config show --json` trước khi cấp phát, sau đó yêu cầu `crabbox inspect --json` báo cáo `providerMetadata.instanceProfileAttached: false` từ EC2 `DescribeInstances`. Các máy thuê có vai trò phiên bản hoặc không có siêu dữ liệu có thẩm quyền sẽ bị dừng và từ chối.
- Node.js trên máy được thuê. Các ảnh đám mây cơ bản thường không có sẵn — hãy cài đặt trong lệnh `setup` của hồ sơ.
- Một phiên có worktree được quản lý và thuộc sở hữu của phiên (tạo bằng `worktree: true`). Việc điều phối di chuyển nội dung của worktree đó; các thư mục thông thường được đồng bộ dưới dạng bản sao manifest.

## Cấu hình

Thêm một hồ sơ bên dưới `cloudWorkers.profiles` trong `openclaw.json`:

```json
{
  "cloudWorkers": {
    "profiles": {
      "aws": {
        "provider": "crabbox",
        "install": "bundle",
        "settings": {
          "provider": "aws",
          "class": "standard",
          "ttl": "8h",
          "idleTimeout": "45m",
          "setup": "test -x /usr/bin/node || (curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash - && sudo apt-get install -y nodejs)"
        }
      }
    }
  }
}
```

Các trường của hồ sơ:

| Khóa       | Ý nghĩa                                                                                                                                                                                                                                        |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider` | ID nhà cung cấp worker được Plugin đăng ký (`crabbox` đối với Plugin đi kèm).                                                                                                                                                    |
| `install`  | `bundle` (mặc định) phân phối bản dựng của Gateway đang chạy; `npm` cài đặt chính xác phiên bản Gateway đã phát hành với tính toàn vẹn được ghim. `npm` yêu cầu Gateway chạy từ một bản phát hành đã đóng gói. |
| `settings` | JSON do nhà cung cấp sở hữu. Đối với crabbox: `provider` (backend), `class` (lớp máy), `ttl`, `idleTimeout` (khoảng thời gian Go), `setup` tùy chọn và đường dẫn `binary` tuyệt đối. OpenClaw bắt buộc sử dụng SSH công khai và tắt Tailscale được quản lý cho các máy thuê này. |
| `lifetime` | Chính sách được lưu trữ tùy chọn (`idleTimeoutMinutes`, `maxLifetimeMinutes`).                                                                                                                                                                 |

### Lệnh thiết lập

`settings.setup` chạy trên máy được thuê sau khi máy sẵn sàng cho SSH và trước khi OpenClaw được cài đặt. Lệnh này chạy trong **mọi** lần thử cấp phát (bao gồm cả các lần phát lại sau khi quá trình điều phối bị gián đoạn), vì vậy lệnh phải có tính lũy đẳng — bảo vệ thao tác cài đặt bằng kiểm tra `command -v`/`test -x` như trong ví dụ. Nếu thiết lập thất bại, nhà cung cấp sẽ dừng máy thuê và quá trình điều phối thất bại theo cơ chế đóng an toàn; không có máy nào được cấu hình dở dang tiếp tục chạy.

### Kênh cài đặt

- **`bundle`** đóng gói `dist` của Gateway đang chạy, một `package.json` đã được tinh giản và mọi gói không gian làm việc mà bản dựng tham chiếu, tất cả được bảo vệ bằng hàm băm nội dung. Máy xác minh gói nguyên bản theo hàm băm đó, sau đó cài đặt các phần phụ thuộc npm dùng cho môi trường sản xuất (tắt script). Đây là cách chạy một bản dựng phát triển trên worker.
- **`npm`** chứng minh bản phát hành tồn tại trên registry công khai, ghim tính toàn vẹn SHA-512 của bản phát hành và cài đặt `openclaw@<version>` khớp chính xác với Gateway.

## Điều phối một phiên

Trong giao diện điều khiển, mở **Phiên mới**, chọn một agent có runtime được cấu hình là OpenClaw, chọn đích **Đám mây · hồ sơ** đã cấu hình từ menu **Vị trí**, rồi bắt đầu tác vụ. Việc chọn đám mây tự động bật worktree được quản lý bắt buộc; Gateway tạo phiên, hoàn tất điều phối rồi mới gửi lượt đầu tiên. Huy hiệu máy chủ trong thanh bên của phiên hiển thị trạng thái vị trí lâu bền. Các đích đám mây không được cung cấp cho danh mục phiên CLI bên ngoài.

Luồng RPC tương đương là:

Tạo một phiên với worktree được quản lý, sau đó điều phối phiên đó (RPC yêu cầu `operator.admin` và chỉ tồn tại khi các hồ sơ đã được cấu hình):

Các worker đám mây chạy runtime agent OpenClaw. Chọn một `openai/*` hoặc mô hình khác phân giải thành runtime đó; các phiên được cấu hình cho runtime CLI bên ngoài như `claude-cli` không thể điều phối.

```bash
openclaw gateway call sessions.create \
  --params '{"key":"agent:main:big-refactor","worktree":true,"cwd":"/path/to/repo","worktreeName":"big-refactor"}'

openclaw gateway call sessions.dispatch \
  --timeout 1500000 \
  --params '{"key":"agent:main:big-refactor","profileId":"aws"}'
```

`sessions.dispatch` đóng việc tiếp nhận lượt cục bộ, chờ công việc đang hoạt động hoàn tất, cấp phát máy thuê, chạy thiết lập, khởi tạo OpenClaw, đồng bộ không gian làm việc và trả về khi vị trí đạt quyền sở hữu worker `active`. Hãy dự trù vài phút cho lần điều phối đầu tiên; máy thuê và bản cài đặt được lưu vào bộ nhớ đệm khi nhà cung cấp hỗ trợ. Sau đó, hãy tương tác với phiên như bình thường — các lượt tự động được định tuyến đến worker.

Các lượt worker hoàn tất sẽ đồng bộ lại những tệp không gian làm việc đủ điều kiện và nằm trong giới hạn kích thước vào worktree được quản lý của phiên trước khi quyền xử lý lượt được giải phóng. Sự kiện worker cuối cùng tạo một hàng rào kết quả đang chờ bền vững trước khi được xác nhận, nhờ đó quá trình phục hồi sau khi Gateway khởi động lại sẽ kéo không gian làm việc từ xa về trước khi việc dọn dẹp lượt cũ có thể phá hủy chủ sở hữu của nó. Quá trình đồng bộ xác thực manifest của worker và dừng khi có sai lệch cục bộ thay vì ghi đè lên một trong hai phía. Trước khi thay đổi tệp, Gateway lưu một nhật ký hoàn tác có giới hạn trong cơ sở dữ liệu trạng thái SQLite; một lần thử lại sẽ khôi phục nhật ký đó sau khi tiến trình Gateway bị gián đoạn. Kết quả không gian làm việc sử dụng ngữ nghĩa tệp của Git: tệp thông thường, bit thực thi, liên kết tượng trưng, nội dung thêm mới, thay đổi và xóa đều được giữ lại, còn thư mục trống và các chế độ thư mục khác thì không. Các đối tượng commit từ xa không được giữ lại; những thay đổi tệp thu được vẫn nằm trong worktree được quản lý để xem xét và commit theo quy trình thông thường.

Khi công việc hoàn tất và không có lượt nào đang chạy, hãy mở menu phiên và chọn **Dừng worker đám mây…**. Gateway thực hiện lần đồng bộ không gian làm việc cuối cùng trước khi hủy môi trường. Một vị trí đã ở trạng thái `draining` hoặc `reconciling` đang hoàn tất quá trình tháo dỡ; hãy chờ huy hiệu chuyển thành `reclaimed` trước khi xóa phiên.

Đối với worker được đính kèm bị lỗi hoặc mất kiểm soát, người vận hành có thể gọi `environments.destroy` với `{ "force": true }` như biện pháp cuối cùng. Việc tháo dỡ cưỡng chế đánh dấu vị trí là thất bại một cách lâu bền và từ bỏ mọi kết quả từ xa chưa được đồng bộ trước khi hủy môi trường.

RPC quản trị tương đương là:

```bash
openclaw gateway call sessions.reclaim \
  --timeout 600000 \
  --params '{"key":"agent:main:big-refactor"}'
```

Vị trí di chuyển qua một máy trạng thái lâu bền (`local → requested → provisioning → syncing → starting → active`), vì vậy nếu Gateway khởi động lại giữa quá trình điều phối, hệ thống sẽ đồng bộ thay vì làm rò rỉ máy. Một lượt mô hình thất bại vẫn giữ vị trí đang hoạt động để thử lại. Nếu quá trình đồng bộ không gian làm việc đến thất bại, worker cũng vẫn hoạt động để người vận hành có thể giải quyết xung đột cục bộ và thử lại mà không mất kết quả từ xa; thay vào đó, các lỗi vòng đời sẽ chuyển vị trí sang trạng thái lỗi hoặc đã thu hồi và giữ lại phần cuối dữ liệu chẩn đoán.

## Mô hình bảo mật

- **Đóng luồng vào worker.** Worker giao tiếp bằng một giao thức chuyên dụng trên socket được tạo đường hầm với danh sách phương thức cho phép khép kín — worker không thể gọi RPC của người vận hành.
- **Thông tin xác thực được cấp mới, băm khi lưu trữ.** Mỗi lần điều phối cấp một thông tin xác thực cho worker; Gateway chỉ lưu hàm băm của thông tin đó. Việc xoay vòng thông tin xác thực và hàng rào epoch của chủ sở hữu đảm bảo mỗi phiên có nhiều nhất một chủ sở hữu đang hoạt động — một worker cũ kết nối lại sẽ bị ngăn cách, không bao giờ được hợp nhất.
- **Ghim khóa máy chủ.** Nhà cung cấp phải cung cấp khóa máy chủ SSH của máy tại thời điểm cấp phát; quá trình khởi tạo kết nối bằng cơ chế ghim nghiêm ngặt và thất bại theo cơ chế đóng an toàn nếu không có khóa.
- **Không có thông tin xác thực thường trực cho mô hình, nền tảng lưu trữ mã nguồn hoặc đám mây trên máy.** Xác thực mô hình nằm tại Gateway (suy luận truyền qua tham chiếu `{provider, model}`), các commit git của không gian làm việc được tạo mà không có thông tin xác thực của nền tảng lưu trữ mã nguồn, và siêu dữ liệu máy thuê Crabbox AWS được kiểm tra có thẩm quyền về vai trò phiên bản trước khi thiết lập. Các lệnh thiết lập cũng phải không chứa thông tin xác thực.
- **Lưu lượng ra do nhà cung cấp sở hữu.** Đường hầm ngược loại bỏ mọi nhu cầu truy cập trực tiếp vào mô hình của OpenClaw, nhưng OpenClaw không viết lại tường lửa của nhà cung cấp. Hạn chế lưu lượng ra tại nhà cung cấp worker khi tác vụ yêu cầu.
- **Bản ghi hội thoại lâu bền, chính xác một lần.** Worker commit các lô bản ghi hội thoại thông qua giao thức so sánh-và-hoán-đổi với nút lá của phiên; một cơ sở cũ sẽ buộc lượt chạy dừng khi lỗi thay vì nhân bản hoặc tái cơ sở hóa đầu ra phải trả phí.

## Khắc phục sự cố

- **`sessions.dispatch` là một phương thức không xác định** — chưa cấu hình `cloudWorkers.profiles`, hoặc bên gọi thiếu `operator.admin`.
- **"Các lượt worker trên đám mây yêu cầu runtime OpenClaw"** — chọn một mô hình có runtime được cấu hình là OpenClaw. Các runtime CLI bên ngoài như `claude-cli` không hỗ trợ suy luận worker.
- **"Quá trình khởi tạo worker yêu cầu Node.js trên máy chủ được cấp quyền sử dụng"** — thêm bước cài đặt Node vào `settings.setup` (xem ở trên).
- **Quá trình chứng thực vai trò phiên bản AWS thất bại** — xóa `aws.instanceProfile` (và `CRABBOX_AWS_INSTANCE_PROFILE`, nếu đã đặt). Cài đặt Crabbox 0.38.1 hoặc mới hơn; các tệp nhị phân cũ hơn không cung cấp hợp đồng `providerMetadata.instanceProfileAttached` có thẩm quyền cần thiết để được AWS chấp nhận.
- **Quá trình điều phối thất bại do lỗi nhà cung cấp** — bản ghi bố trí và `environments.list` lưu lỗi gần nhất, bao gồm phần cuối stderr của quá trình thiết lập/khởi tạo. Các box bị hủy khi xảy ra lỗi, vì vậy phần cuối đó là nguồn dữ liệu điều tra chính.
- **Máy khách hết thời gian chờ trong khi điều phối** — `openclaw gateway call` mặc định có thời gian chờ 10s; hãy truyền `--timeout` với giá trị đủ lớn (quá trình điều phối vẫn tiếp tục ở phía máy chủ trong cả hai trường hợp, và yêu cầu thử lại trong khi đang cấp phát sẽ bị từ chối với `session cannot dispatch from placement provisioning`).
- **Quản lý lease** — `crabbox list --provider <backend>` hiển thị các lease đang hoạt động; `crabbox stop --provider <backend> --id <lease>` giải phóng thủ công một lease. Các lease không hoạt động sẽ hết hạn theo `idleTimeout` của hồ sơ.

## Liên quan

- [Cô lập sandbox](/vi/gateway/sandboxing) — giảm phạm vi ảnh hưởng khi thực thi công cụ cục bộ
- [CLI phiên](/vi/cli/sessions) — kiểm tra các phiên đã lưu
- [Tài liệu tham chiếu cấu hình](/vi/gateway/configuration-reference)
