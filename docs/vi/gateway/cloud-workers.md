---
read_when: You want agent sessions to run on ephemeral cloud machines instead of the Gateway host, or you are configuring cloudWorkers profiles.
sidebarTitle: Cloud Workers
status: active
summary: 'Điều phối các phiên đến những máy đám mây dùng một lần: cấp phát, runtime worker, suy luận qua proxy và truyền phát kết quả theo thời gian thực'
title: Cloud Workers
x-i18n:
    generated_at: "2026-07-21T13:24:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 4e81fb50512639b3b0e00522dea914533b596574f35baf304c932c2962ac103c
    source_path: gateway/cloud-workers.md
    workflow: 16
---

Cloud worker cho phép một phiên chạy vòng lặp tác tử trên một máy đám mây dùng một lần, trong khi mọi thứ liên quan đến phiên vẫn ở nguyên nơi vốn có: hiển thị trong thanh bên, phát trực tiếp và bản chép lời thuộc quyền quản lý của Gateway. Gateway thuê một máy, cài đặt một bản OpenClaw được ghim phiên bản trên đó, đồng bộ không gian làm việc của phiên sang máy và giao vòng lặp lượt cho một tiến trình `openclaw worker` bị hạn chế. Các lệnh gọi mô hình được chuyển tiếp qua Gateway, nên thông tin xác thực của nhà cung cấp không bao giờ rời khỏi máy của bạn, đồng thời bộ nhớ đệm prompt vẫn hoạt động vì nhà cung cấp nhận được một luồng liên tục duy nhất.

Khi công việc hoàn tất (hoặc máy gặp sự cố), máy sẽ bị hủy. Trạng thái bền vững — bản chép lời, các commit trong không gian làm việc, bản ghi vị trí thực thi — nằm tại Gateway.

<Note>
Cloud worker là tính năng tùy chọn và không hiển thị cho đến khi bạn cấu hình một hồ sơ. Các bản cài đặt chưa cấu hình sẽ không thấy RPC, cấu hình hoặc giao diện người dùng mới nào.
</Note>

## Thành phần nào chạy ở đâu

| Hạng mục                                                | Vị trí                                                                           |
| ------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Vòng lặp tác tử + công cụ (`exec`, `read`, `write`, `edit`, …) | Máy Cloud worker                                                                 |
| Suy luận mô hình và thông tin xác thực của nhà cung cấp | Gateway (được chuyển tiếp qua tham chiếu `{provider, model}`)                    |
| Bản chép lời (bền vững, kho lưu trữ phiên)              | Gateway                                                                          |
| Phát trực tiếp vào thanh bên                            | Fanout của Gateway, nhận dữ liệu từ luồng sự kiện có thể phát lại của worker     |
| Lịch sử Git của không gian làm việc                     | Được tạo trên máy mà không cần thông tin xác thực; Gateway tiếp nhận các commit và sở hữu thao tác push/PR |

Máy không cần cổng đến nào ngoài `sshd`: Gateway chủ động kết nối qua SSH được ghim và một đường hầm ngược truyền WebSocket của worker trở lại. Nhà cung cấp Crabbox đi kèm bắt buộc sử dụng tuyến SSH công khai và vô hiệu hóa việc đăng ký Tailscale được quản lý. Quyền truy cập Internet đi là chính sách của nhà cung cấp; hồ sơ AWS mặc định có thể truy cập Internet trừ khi bạn hạn chế mạng hoặc nhóm bảo mật của hồ sơ đó.

## Yêu cầu

- Một Plugin nhà cung cấp worker. Plugin `crabbox` đi kèm điều khiển CLI [Crabbox](https://github.com/openclaw/crabbox), công cụ môi giới việc thuê máy trên nhiều nền tảng đám mây (AWS, Hetzner và các nền tảng khác). Tệp nhị phân `crabbox` phải nằm trên `PATH` (hoặc đặt `settings.binary`) và thông tin xác thực của nhà cung cấp phải được cấu hình sẵn. Việc tiếp nhận AWS yêu cầu Crabbox 0.38.1 trở lên.
- Đối với worker Crabbox AWS, giá trị `aws.instanceProfile` có hiệu lực phải để trống. Nhà cung cấp kiểm tra `crabbox config show --json` trước khi cấp phát, sau đó yêu cầu `crabbox inspect --json` báo cáo `providerMetadata.instanceProfileAttached: false` từ EC2 `DescribeInstances`. Các lượt thuê có vai trò phiên bản máy hoặc không có siêu dữ liệu có thẩm quyền sẽ bị dừng và từ chối.
- Node.js trên máy được thuê. Các ảnh đám mây cơ bản thường không có Node.js — hãy cài đặt Node.js trong lệnh `setup` của hồ sơ.
- Một phiên có worktree được quản lý và thuộc sở hữu của phiên (tạo bằng `worktree: true`). Thao tác điều phối sẽ di chuyển nội dung của worktree đó; các thư mục thông thường được đồng bộ dưới dạng bản sao phản chiếu theo manifest.

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
| `provider` | ID nhà cung cấp worker do một Plugin đăng ký (`crabbox` đối với Plugin đi kèm).                                                                                                                                                       |
| `install`  | `bundle` (mặc định) chuyển bản dựng của Gateway đang chạy; `npm` cài đặt chính xác phiên bản Gateway đã phát hành với tính toàn vẹn được ghim. `npm` yêu cầu Gateway chạy từ một bản phát hành đóng gói. |
| `settings` | JSON do nhà cung cấp sở hữu. Đối với crabbox: `provider` (backend), `class` (lớp máy), `ttl`, `idleTimeout` (khoảng thời gian Go), `setup` tùy chọn và đường dẫn tuyệt đối `binary`. OpenClaw bắt buộc sử dụng SSH công khai và vô hiệu hóa Tailscale được quản lý cho các lượt thuê này. |
| `lifetime` | Chính sách được lưu trữ tùy chọn (`idleTimeoutMinutes`, `maxLifetimeMinutes`).                                                                                                                                                                     |

### Lệnh thiết lập

`settings.setup` chạy trên máy được thuê sau khi máy sẵn sàng cho SSH và trước khi OpenClaw được cài đặt. Lệnh này chạy trong **mọi** lần cấp phát (bao gồm cả khi phát lại sau một lần điều phối bị gián đoạn), vì vậy lệnh phải có tính lũy đẳng — hãy bảo vệ thao tác cài đặt bằng phép kiểm tra `command -v`/`test -x` như trong ví dụ. Nếu thiết lập thất bại, nhà cung cấp sẽ dừng lượt thuê và thao tác điều phối sẽ thất bại theo cơ chế đóng an toàn; không máy nào được cấu hình dang dở vẫn tiếp tục chạy.

### Kênh cài đặt

- **`bundle`** đóng gói `dist` của Gateway đang chạy, một `package.json` đã được tinh giản và mọi gói không gian làm việc mà bản dựng tham chiếu, tất cả đều được bảo vệ bằng hàm băm nội dung. Máy xác minh gói nguyên vẹn dựa trên hàm băm đó, sau đó cài đặt các phần phụ thuộc npm dành cho môi trường sản xuất (đã vô hiệu hóa script). Đây là cách chạy một bản dựng phát triển trên worker.
- **`npm`** xác minh rằng bản phát hành tồn tại trên registry công khai, ghim tính toàn vẹn SHA-512 của bản phát hành và cài đặt `openclaw@<version>` khớp chính xác với Gateway.

## Điều phối một phiên

Trong giao diện Điều khiển, mở **Phiên mới**, chọn một tác tử có runtime được cấu hình là OpenClaw, chọn một đích **Đám mây · hồ sơ** đã cấu hình trong menu **Nơi chạy**, rồi bắt đầu tác vụ. Việc chọn đám mây tự động bật worktree được quản lý bắt buộc; Gateway tạo phiên, hoàn tất điều phối và chỉ sau đó mới gửi lượt đầu tiên. Huy hiệu máy chủ trong thanh bên của phiên hiển thị trạng thái vị trí thực thi bền vững. Các đích đám mây không được cung cấp cho danh mục phiên CLI bên ngoài.

Luồng RPC tương đương là:

Tạo một phiên có worktree được quản lý, sau đó điều phối phiên đó (RPC yêu cầu `operator.admin` và chỉ tồn tại khi các hồ sơ đã được cấu hình):

Cloud worker chạy runtime tác tử OpenClaw. Chọn một `openai/*` hoặc mô hình khác phân giải thành runtime đó; không thể điều phối các phiên được cấu hình cho runtime CLI bên ngoài như `claude-cli`.

```bash
openclaw gateway call sessions.create \
  --params '{"key":"agent:main:big-refactor","worktree":true,"cwd":"/path/to/repo","worktreeName":"big-refactor"}'

openclaw gateway call sessions.dispatch \
  --timeout 1500000 \
  --params '{"key":"agent:main:big-refactor","profileId":"aws"}'
```

`sessions.dispatch` đóng quyền tiếp nhận lượt cục bộ, chờ công việc đang hoạt động hoàn tất, cấp phát lượt thuê, chạy thiết lập, khởi động OpenClaw, đồng bộ không gian làm việc và trả về khi vị trí thực thi đạt quyền sở hữu worker `active`. Hãy dự trù vài phút cho lần điều phối đầu tiên; lượt thuê và bản cài đặt được lưu vào bộ nhớ đệm tại những nơi nhà cung cấp hỗ trợ. Sau đó, hãy tương tác với phiên như bình thường — các lượt sẽ tự động được định tuyến đến worker.

Các lượt worker đã hoàn tất sẽ đồng bộ trở lại những tệp không gian làm việc đủ điều kiện và nằm trong giới hạn kích thước vào worktree được quản lý của phiên trước khi quyền giữ lượt được giải phóng. Sự kiện worker cuối cùng tạo một hàng rào kết quả đang chờ bền vững trước khi được xác nhận. Sau đó, Gateway đưa toàn bộ kết quả đám mây vào vùng tạm dưới dạng một tham chiếu Git tại `refs/openclaw/worker-results/` trước khi áp dụng, nhờ đó phiên bản đám mây vẫn có thể khôi phục ngay cả khi Gateway dừng trong lúc áp dụng. Kết quả không gian làm việc sử dụng ngữ nghĩa tệp của Git: tệp thông thường, bit thực thi, liên kết tượng trưng, nội dung thêm mới, thay đổi và xóa đều được giữ lại, còn thư mục trống và các chế độ thư mục khác thì không. Các thay đổi tệp thu được vẫn nằm trong worktree được quản lý để review và commit theo quy trình thông thường.

Quá trình áp dụng sử dụng manifest tại thời điểm điều phối làm cơ sở hợp nhất. Các thay đổi chỉ có trên đám mây được áp dụng, các thay đổi chỉ có cục bộ được giữ nguyên, còn những đường dẫn bị thay đổi ở cả hai phía sử dụng chính sách hợp nhất ba chiều ưu tiên giữ bản cục bộ. Một lượt có xung đột vẫn hoàn tất: bản chép lời báo cáo phần tóm tắt đường dẫn có giới hạn và tham chiếu kết quả đã đưa vào vùng tạm, vị trí thực thi hiển thị cùng xung đột đó cho giao diện Điều khiển, còn các thay đổi đám mây không xung đột vẫn được áp dụng. Thông báo bao gồm `git show <ref>:<path>` để kiểm tra một tệp hiện có trên đám mây và một lệnh `git checkout <ref> -- <path>` có pathspec dạng đường dẫn cố định cấp cao nhất để lấy tệp đó từ bất kỳ thư mục không gian làm việc nào. Chạy các lệnh trong Bash hoặc zsh (Git Bash trên Windows). Nếu thao tác kiểm tra cho biết đường dẫn không tồn tại, kết quả đám mây đã xóa đường dẫn đó; hãy xác minh và xóa đường dẫn cục bộ được giữ lại theo cách thủ công. Nếu thao tác checkout báo có tệp/thư mục cản trở, hãy di chuyển hoặc xóa đường dẫn cục bộ gây cản trở rồi thử lại. Nếu chính tham chiếu đã đưa vào vùng tạm không còn tồn tại, hãy coi thông báo là lỗi thời và không thay đổi đường dẫn cục bộ. Các tham chiếu đã đưa vào vùng tạm có xung đột vẫn khả dụng sau khi hàng rào lượt thông thường được giải phóng; một kết quả sạch sau đó sẽ xóa thông báo và ngừng sử dụng tham chiếu cũ, còn việc xóa hàng rào rõ ràng là ranh giới dọn dẹp cuối cùng.

Khi một kết quả có hàng rào vẫn đang được đồng bộ, lượt mới sẽ chờ tối đa 15 giây để quyền giữ trước đó được giải phóng. Nếu vẫn còn bận, lượt sẽ thất bại với thông báo có hướng xử lý “kết quả không gian làm việc của lượt đám mây trước vẫn đang được đồng bộ” và có thể được thử lại sau ít phút. Khi khởi động lại, quá trình khôi phục phát hiện các kết quả đang chờ và đã đưa vào vùng tạm trước khi dọn dẹp quyền giữ lỗi thời, hoàn tất hoặc thử lại việc áp dụng cục bộ của các kết quả đó, đồng thời chỉ thu hồi các môi trường đã chết sau khi bảo toàn kết quả. Nhật ký rollback SQLite có giới hạn giúp khôi phục một lần áp dụng hệ thống tệp bị gián đoạn mà không phát lại các thay đổi đã được chấp nhận.

Khi công việc hoàn tất và không có lượt nào đang chạy, hãy mở menu phiên và chọn **Dừng Cloud worker…**. Gateway thực hiện một lần đồng bộ không gian làm việc cuối cùng trước khi hủy môi trường. Một vị trí thực thi đã ở trạng thái `draining` hoặc `reconciling` đang hoàn tất việc tháo dỡ; hãy đợi huy hiệu chuyển thành `reclaimed` trước khi xóa phiên.

Đối với worker đã gắn nhưng bị hỏng hoặc mất kiểm soát, người vận hành có thể gọi `environments.destroy` với `{ "force": true }` như biện pháp cuối cùng. Thao tác buộc tháo dỡ sẽ đánh dấu bền vững vị trí thực thi là thất bại và từ bỏ mọi kết quả từ xa chưa được đồng bộ trước khi hủy môi trường.

RPC quản trị tương đương là:

```bash
openclaw gateway call sessions.reclaim \
  --timeout 600000 \
  --params '{"key":"agent:main:big-refactor"}'
```

Vị trí thực thi chuyển đổi qua một máy trạng thái bền vững (`local → requested → provisioning → syncing → starting → active`), vì vậy nếu Gateway khởi động lại giữa quá trình điều phối, hệ thống sẽ đối soát thay vì làm rò rỉ các máy. Một lượt mô hình thất bại vẫn giữ vị trí thực thi đang hoạt động để có thể thử lại. Khi đường dẫn không gian làm việc xung đột, hệ thống giữ phiên bản cục bộ, áp dụng phần còn lại của kết quả đám mây và bảo lưu tham chiếu đám mây đã được đưa vào vùng tạm để kiểm tra; các lỗi đối soát hoặc vòng đời khác duy trì hàng rào khôi phục bền vững và phần cuối thông tin chẩn đoán cho đến khi quá trình khôi phục có thể thử lại hoặc thu hồi môi trường một cách an toàn.

## Mô hình bảo mật

- **Đóng luồng vào worker.** Các worker giao tiếp bằng một giao thức chuyên dụng trên socket được tạo đường hầm với danh sách phương thức cho phép đóng — worker không thể gọi các RPC của người vận hành.
- **Thông tin xác thực được cấp mới, được băm khi lưu trữ.** Mỗi lần điều phối cấp một thông tin xác thực cho worker; Gateway chỉ lưu hàm băm của thông tin đó. Việc xoay vòng thông tin xác thực và rào chắn theo epoch của chủ sở hữu bảo đảm mỗi phiên có nhiều nhất một chủ sở hữu đang hoạt động — một worker cũ kết nối lại sẽ bị chặn, tuyệt đối không được hợp nhất.
- **Ghim khóa máy chủ.** Nhà cung cấp phải cung cấp khóa máy chủ SSH của máy tại thời điểm cấp phát; quá trình bootstrap kết nối với chế độ ghim nghiêm ngặt và đóng an toàn nếu không có khóa.
- **Không lưu thường trực thông tin xác thực của mô hình, forge hoặc đám mây trên máy.** Xác thực mô hình vẫn nằm trên Gateway (suy luận được truyền qua tham chiếu `{provider, model}`), các commit git trong không gian làm việc được tạo mà không có thông tin xác thực forge, và siêu dữ liệu lease AWS của Crabbox được kiểm tra theo nguồn có thẩm quyền để xác định vai trò phiên bản trước khi thiết lập. Các lệnh thiết lập cũng phải không chứa thông tin xác thực.
- **Luồng ra do nhà cung cấp quản lý.** Đường hầm ngược loại bỏ nhu cầu truy cập trực tiếp vào mô hình của OpenClaw, nhưng OpenClaw không viết lại tường lửa của nhà cung cấp. Hãy hạn chế lưu lượng đi ra tại nhà cung cấp worker khi tác vụ yêu cầu.
- **Bản ghi hội thoại bền vững, chính xác một lần.** Worker commit các lô bản ghi hội thoại thông qua giao thức so sánh-và-hoán-đổi với nút lá của phiên; một cơ sở cũ sẽ buộc lượt chạy dừng do lỗi thay vì sao chép hoặc rebase đầu ra phải trả phí.

## Khắc phục sự cố

- **`sessions.dispatch` là phương thức không xác định** — chưa cấu hình `cloudWorkers.profiles` nào hoặc bên gọi không có `operator.admin`.
- **"Các lượt worker đám mây yêu cầu runtime OpenClaw"** — chọn một mô hình có runtime được cấu hình là OpenClaw. Các runtime CLI bên ngoài như `claude-cli` không hỗ trợ suy luận trên worker.
- **"Quá trình bootstrap worker yêu cầu Node.js trên máy chủ được cấp lease"** — thêm bước cài đặt Node vào `settings.setup` (xem phần trên).
- **Chứng thực vai trò phiên bản AWS thất bại** — xóa `aws.instanceProfile` (và `CRABBOX_AWS_INSTANCE_PROFILE`, nếu đã đặt). Cài đặt Crabbox 0.38.1 trở lên; các tệp nhị phân cũ hơn không cung cấp hợp đồng `providerMetadata.instanceProfileAttached` có thẩm quyền, vốn cần thiết để tiếp nhận AWS.
- **Điều phối thất bại do lỗi nhà cung cấp** — bản ghi vị trí thực thi và `environments.list` lưu lỗi gần nhất, bao gồm phần cuối stderr của quá trình thiết lập/bootstrap. Các máy bị hủy khi thất bại, vì vậy phần cuối này là bằng chứng điều tra chính.
- **Máy khách hết thời gian chờ khi điều phối** — `openclaw gateway call` mặc định có thời gian chờ 10s; hãy truyền `--timeout` với giá trị đủ lớn (quá trình điều phối vẫn tiếp tục chạy phía máy chủ trong cả hai trường hợp, và việc thử lại trong khi đang cấp phát sẽ bị từ chối bằng `session cannot dispatch from placement provisioning`).
- **Thông báo xung đột không gian làm việc đám mây** — lượt đã hoàn tất và giữ phiên bản cục bộ của từng đường dẫn được liệt kê. Dùng các lệnh tham chiếu đã được đưa vào vùng tạm trong thông báo để kiểm tra hoặc lấy phiên bản đám mây; không cần thử lại đối với các thay đổi không xung đột vì chúng đã được áp dụng.
- **“Kết quả không gian làm việc của lượt đám mây trước vẫn đang được đối soát”** — Gateway đã chờ trong thời gian ngắn để nhận hàng rào bền vững của kết quả trước nhưng không thể giành quyền yêu cầu phiên. Hãy chờ quá trình đối soát hoàn tất rồi thử lại lượt; việc khởi động lại Gateway là an toàn vì quá trình khôi phục bảo lưu các kết quả đã được đưa vào vùng tạm trước khi thu hồi một worker đã ngừng hoạt động.
- **Dọn dẹp lease** — `crabbox list --provider <backend>` hiển thị các lease đang hoạt động; `crabbox stop --provider <backend> --id <lease>` giải phóng thủ công một lease. Các lease nhàn rỗi hết hạn theo `idleTimeout` của hồ sơ.

## Liên quan

- [Cơ chế cách ly](/vi/gateway/sandboxing) — giảm phạm vi ảnh hưởng khi thực thi công cụ cục bộ
- [CLI phiên](/vi/cli/sessions) — kiểm tra các phiên đã lưu
- [Tham chiếu cấu hình](/vi/gateway/configuration-reference)
