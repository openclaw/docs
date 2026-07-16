---
read_when:
    - Bạn lưu trữ nhiều miền tin cậy của đối tượng thuê trên một máy duy nhất
    - Bạn cần tạo, kiểm tra, nâng cấp hoặc xóa các ô trong đội máy.
summary: Tài liệu tham khảo CLI để cấp phát và quản lý các cell OpenClaw biệt lập cho từng tenant
title: Đội máy chủ
x-i18n:
    generated_at: "2026-07-16T15:04:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: be589500e4715541f175caf0d5135a96baee4874e64c60c8b6f188ff1f70bc9f
    source_path: cli/fleet.md
    workflow: 16
---

# `openclaw fleet`

`openclaw fleet` quản lý các phiên bản OpenClaw hoàn chỉnh được gọi là **cell**. Mỗi cell có Gateway, trạng thái, thông tin xác thực, tài khoản kênh, container và cổng máy chủ chỉ dành cho loopback riêng. Sử dụng một cell cho mỗi ranh giới tin cậy của tenant; không sử dụng một Gateway dùng chung làm ranh giới đa tenant không đáng tin cậy.

Fleet đang ở trạng thái **thử nghiệm**. Tên lệnh, cờ, cấu trúc đầu ra và hồ sơ container có thể thay đổi giữa các bản phát hành mà không có giai đoạn ngừng hỗ trợ.

Fleet hỗ trợ Docker và Podman. Image mặc định là `ghcr.io/openclaw/openclaw:latest`.

Fleet được kiểm thử trên máy chủ Linux và macOS. Máy chủ Windows hiện chưa được kiểm thử.

## Bắt đầu nhanh

```bash
openclaw fleet create acme
openclaw fleet status acme
openclaw fleet list
```

`fleet create` in token Gateway đã tạo một lần cùng với URL của cell. Hãy lưu token ngay lập tức, sau đó cấu hình tài khoản kênh của từng tenant bên trong cell của tenant đó.

## ID tenant

ID tenant phải khớp với:

```text
^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?$
```

Quy tắc này cho phép từ 1 đến 40 chữ cái viết thường, chữ số và dấu gạch nối ở giữa. ID phải bắt đầu và kết thúc bằng chữ cái hoặc chữ số. Chữ cái viết hoa, dấu gạch dưới, dấu gạch chéo, dấu chấm, khoảng trắng và các chuỗi duyệt đường dẫn như `../acme` đều bị từ chối.

ID trở thành một phần của tên container: `openclaw-cell-<tenant>`.

## `fleet create`

Tạo và khởi động một cell:

```bash
openclaw fleet create acme
```

Tạo một cell Podman trên cổng cố định mà không khởi động:

```bash
openclaw fleet create acme \
  --runtime podman \
  --port 19125 \
  --no-start
```

Truyền các biến môi trường dành riêng cho tenant bằng cách lặp lại `--env`:

```bash
openclaw fleet create acme \
  --env TZ=America/Los_Angeles \
  --env OPENCLAW_DISABLE_BONJOUR=1
```

Khóa môi trường sử dụng chữ cái, chữ số và dấu gạch dưới, đồng thời không được bắt đầu bằng chữ số. Giá trị phải nằm trên một dòng vì Fleet truyền chúng qua tệp môi trường runtime được bảo vệ. Fleet từ chối các nỗ lực ghi đè biến đường dẫn container và biến token Gateway do hệ thống quản lý được liệt kê trong [Bố cục lưu trữ và container](#storage-and-container-layout).

### Tùy chọn tạo

| Tùy chọn                    | Mặc định                               | Mô tả                                                                                    |
| ------------------------- | ------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `--image <ref>`           | `ghcr.io/openclaw/openclaw:latest`    | Image container cho cell.                                                                  |
| `--runtime <runtime>`     | `docker`                              | CLI container: `docker` hoặc `podman`.                                                           |
| `--port <number>`         | Tự động cấp phát từ `19100`  | Cổng máy chủ loopback. Cổng được chọn rõ ràng không được thuộc về một cell đã đăng ký khác.    |
| `--memory <value>`        | `2g`                                  | Giới hạn bộ nhớ container theo cú pháp Docker/Podman.                                                |
| `--cpus <value>`          | `2`                                   | Giới hạn CPU của container.                                                                           |
| `--disk <size>`           | Không có                                  | Giới hạn lớp có thể ghi của container khi backend lưu trữ hỗ trợ hạn ngạch.                     |
| `--network <mode>`        | `bridge`                              | Chế độ mạng đi: `bridge` hoặc `internal`.                                                 |
| `--pids-limit <number>`   | `512`                                 | Số lượng tiến trình tối đa trong container.                                                  |
| `--env <KEY=VALUE>`       | Không có                                  | Truyền một biến môi trường vào cell. Lặp lại để truyền nhiều giá trị.                          |
| `--gateway-token <value>` | Token thập lục phân ngẫu nhiên gồm 32 ký tự | Sử dụng token Gateway được cung cấp thay vì tạo token mới. Xem [Xử lý token](#token-handling). |
| `--no-start`              | Cell được khởi động                           | Tạo container mà không khởi động.                                                      |
| `--json`                  | Đầu ra dễ đọc                 | In đầu ra có thể đọc bằng máy.                                                                 |

Quá trình cấp phát tự động chọn cổng registry chưa dùng đầu tiên có giá trị bằng hoặc lớn hơn `19100`. Fleet từ chối ID tenant trùng lặp và các cổng được chỉ định rõ ràng đã gán cho cell khác.

Tham chiếu image được truyền dưới dạng một đối số duy nhất cho runtime container. Các tham chiếu trống và giá trị bắt đầu bằng `-` bị từ chối để tránh việc image bị diễn giải thành tùy chọn Docker hoặc Podman.

Endpoint Docker hoặc Podman được chọn phải là endpoint cục bộ. Fleet từ chối các ngữ cảnh Docker từ xa, endpoint `DOCKER_HOST` và dịch vụ Podman từ xa trước khi dành riêng cổng hoặc tạo trạng thái cục bộ. Không hỗ trợ máy chủ cell từ xa.

Khi Fleet khởi động một cell mới, lệnh create chờ tối đa khoảng một phút để Gateway phản hồi `/healthz`. Nếu cell không đạt trạng thái khỏe mạnh, Fleet giữ nguyên container và hàng registry của cell để dùng với `fleet status`, `fleet logs` hoặc xóa rõ ràng. `--no-start` bỏ qua cổng kiểm tra tình trạng này. Token Gateway đã tạo của một cell mới không khỏe mạnh không bị mất — token vẫn còn trong môi trường container (`docker|podman inspect`); và vì cell chưa phục vụ lưu lượng nào, `fleet rm --force` rồi tạo lại từ đầu luôn là một phương án thay thế an toàn.

### Ghim bằng digest

Lệnh create và upgrade chấp nhận các tham chiếu image được ghim bằng digest như `--image ghcr.io/openclaw/openclaw@sha256:<digest>`. Fleet truyền nguyên văn tham chiếu image cho Docker hoặc Podman, cho phép người vận hành giữ cell trên nội dung image bất biến thay vì một thẻ có thể thay đổi.

Kết quả tạo bao gồm ID tenant, tên container, cổng máy chủ, token Gateway và URL cục bộ. Ngay cả trong đầu ra JSON, hãy coi kết quả là dữ liệu chứa thông tin bí mật vì kết quả có chứa token.

### Giới hạn ổ đĩa

`--disk` chỉ giới hạn lớp có thể ghi của container. Các thư mục trạng thái và xác thực riêng cho từng tenant được gắn kết vẫn nằm trên bộ nhớ máy chủ; hãy sử dụng hạn ngạch dự án của hệ thống tệp máy chủ khi các thư mục đó cũng cần giới hạn cứng.

| Backend runtime/lưu trữ | Mức hỗ trợ `--disk`                                                             |
| ----------------------- | ---------------------------------------------------------------------------- |
| Docker overlay2 trên XFS  | Yêu cầu tùy chọn gắn kết XFS `pquota`.                                      |
| Docker btrfs hoặc zfs     | Được driver lưu trữ hỗ trợ.                                             |
| Podman overlay          | Yêu cầu bộ nhớ nền XFS.                                                |
| Backend khác          | Quá trình tạo container thất bại với lỗi daemon và hướng dẫn backend của Fleet. |

### Chính sách lưu lượng đi

| Chế độ       | Docker                                                                                                | Podman                                                                              |
| ---------- | ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `bridge`   | Được hỗ trợ; lưu lượng đi không bị hạn chế theo mặc định.                                                | Được hỗ trợ; lưu lượng đi không bị hạn chế theo mặc định.                              |
| `internal` | Bị từ chối vì Docker không duy trì cổng Gateway loopback đã công bố trên mạng nội bộ. | Được hỗ trợ; Gateway loopback vẫn được công bố trong khi lưu lượng đi bị chặn. |

Đối với Docker, hãy giữ chế độ bridge và thực thi chính sách lưu lượng đi bằng các quy tắc tường lửa máy chủ như chuỗi `DOCKER-USER`.

## `fleet list`

Liệt kê các cell theo thứ tự ID tenant:

```bash
openclaw fleet list
openclaw fleet ls
openclaw fleet list --json
```

Bảng bao gồm:

| Cột    | Ý nghĩa                                                                                                                                                                                                                                                                               |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tenant`  | ID tenant.                                                                                                                                                                                                                                                                            |
| `state`   | Trạng thái container trực tiếp từ quá trình kiểm tra Docker hoặc Podman. `unknown` có nghĩa là runtime không khả dụng hoặc có một container mang tên của cell nhưng nhãn quyền sở hữu Fleet của container không khớp với bản ghi registry (dấu hiệu xung đột hoặc can thiệp — hãy kiểm tra thủ công trước khi hành động). |
| `port`    | Cổng máy chủ loopback được ánh xạ tới Gateway của cell.                                                                                                                                                                                                                                        |
| `image`   | Image container đã ghi nhận.                                                                                                                                                                                                                                                             |
| `created` | Thời điểm tạo cell.                                                                                                                                                                                                                                                                   |

Các hàng registry vẫn hiển thị khi Docker hoặc Podman không khả dụng; chỉ trạng thái trực tiếp trở thành `unknown`.

## `fleet status`

Kiểm tra một cell:

```bash
openclaw fleet status acme
openclaw fleet status acme --json
```

Trạng thái kết hợp hàng registry của Fleet, kết quả kiểm tra container trực tiếp và một yêu cầu ngắn theo khả năng tốt nhất tới:

```text
http://127.0.0.1:<host-port>/healthz
```

Kết quả tình trạng là `ok`, `failed` hoặc `skipped`. `/healthz` chứng minh Gateway đang hoạt động, không phải mọi kênh hoặc Plugin đã cấu hình đều hoàn toàn sẵn sàng. Phép thăm dò bị bỏ qua khi không có endpoint cục bộ khả dụng để kiểm tra.

## `fleet logs`

Truyền trực tiếp nhật ký container của một cell tới terminal:

```bash
openclaw fleet logs acme
openclaw fleet logs acme --follow
openclaw fleet logs acme --tail 200
openclaw fleet logs acme --since 10m
```

Fleet xác minh nhãn quyền sở hữu của container đã đăng ký trước khi đọc bất kỳ nhật ký nào, do đó Fleet từ chối container không thuộc quyền sở hữu đang sử dụng tên cell dự kiến. Luồng được ghim vào ID container đã kiểm tra đó, nên việc thay thế đồng thời không thể chuyển hướng luồng sang thế hệ mới hơn. Nhấn Ctrl-C để kết thúc `--follow` mà không coi thao tác dừng của người vận hành là lỗi lệnh. Đầu ra nhật ký được chuyển qua bộ lọc che giấu, thay thế token Gateway hiện tại của cell bằng `<redacted>` trước khi bất kỳ nội dung nào đến terminal.

`fleet logs` không có chế độ `--json` vì nhật ký container là luồng stdout/stderr thô. Đối với script, hãy giới hạn đầu ra bằng `--tail` và sử dụng tính năng chuyển hướng hoặc pipeline shell thông thường.

## `fleet start`, `fleet stop` và `fleet restart`

Điều khiển một cell hiện có bằng runtime đã ghi nhận của nó:

```bash
openclaw fleet start acme
openclaw fleet stop acme
openclaw fleet restart acme
```

Các lệnh này thao tác trên tên container đã đăng ký. Chúng sẽ thất bại nếu tenant không xác định hoặc runtime đã ghi nhận không thể thực hiện thao tác.

## `fleet upgrade`

Kéo lại image đã ghi nhận và thay thế container của cell:

```bash
openclaw fleet upgrade acme
```

Chuyển cell sang một image khác:

```bash
openclaw fleet upgrade acme --image ghcr.io/openclaw/openclaw:<version>
```

Quá trình nâng cấp kéo image đích, kiểm tra container hiện có và mạng riêng của từng cell, dừng và xóa container, sau đó tạo lại và khởi động nó. Container thay thế giữ nguyên cổng host, các thư mục dữ liệu, mạng bridge riêng của từng cell, hồ sơ runtime, giới hạn tài nguyên, chính sách khởi động lại, môi trường do Fleet quản lý và các giá trị ban đầu được cung cấp bằng `--env`. Trạng thái được mount vẫn tồn tại sau khi thay thế container; môi trường mặc định của image có thể thay đổi theo image đích.

Container thay thế chỉ được xác nhận sau khi Gateway của nó phản hồi `/healthz` trên cổng loopback của cell, phù hợp với hợp đồng kiểm tra tình trạng mà tệp compose chính thức sử dụng. Container thay thế bị thoát, lặp lỗi hoặc không đạt trạng thái khỏe mạnh trong khoảng một phút sẽ bị xóa và container trước đó được khôi phục, nhờ đó image lỗi không làm ngừng hoạt động một cell đang chạy tốt.

Token Gateway được chủ ý không lưu trong registry của fleet. Trước khi xóa container cũ, Fleet đọc môi trường của nó và chuyển `OPENCLAW_GATEWAY_TOKEN` sang container thay thế. Không xóa thủ công container cũ trước khi nâng cấp nếu token không tồn tại ở nơi nào khác mà bạn kiểm soát.

## `fleet backup` và `fleet restore`

Sao lưu một cell đã dừng:

```bash
openclaw fleet stop acme
openclaw fleet backup acme --out ./acme.tgz
```

Khôi phục tệp lưu trữ đó vào cell đã đăng ký:

```bash
openclaw fleet restore acme --from ./acme.tgz
```

Đây là các lệnh yêu cầu đặc quyền của người vận hành host. Tệp lưu trữ chứa trạng thái tenant và bí mật xác thực, được tạo với chế độ `0600` và phải được lưu trữ như thông tin xác thực. Lệnh sao lưu từ chối cell đang chạy để trạng thái SQLite được ghi lại nhất quán. Lệnh khôi phục từ chối cell đang chạy trừ khi cung cấp `--force`, chỉ thay thế trạng thái của tenant đó, xoay vòng token Gateway và in token mới một lần. Fleet sao lưu từng tenant một; sao lưu toàn bộ tenant là một thao tác riêng của người vận hành.

Quá trình khôi phục cần một container hiện có đã dừng vì hồ sơ runtime được kiểm tra của container đó cung cấp các giới hạn thay thế, ánh xạ người dùng, nguồn gốc môi trường và image. Nếu container đã đăng ký bị xóa ngoài quy trình, trước tiên hãy chạy `fleet rm <tenant> --force` mà không có `--purge-data`, tạo lại cell bằng image mong muốn và `--no-start`, sau đó thử khôi phục lại. Lần xóa đầu tiên giữ nguyên cả hai thư mục dữ liệu tenant.

Cả hai lệnh đều chấp nhận `--max-bytes <bytes>` để giới hạn dữ liệu tệp được lưu trữ hoặc giải nén, và đều áp dụng cùng một hạn mức cố định một triệu phân đoạn đường dẫn lưu trữ để các tệp lưu trữ độc hại chỉ chứa siêu dữ liệu không thể làm cạn inode của host và mọi bản sao lưu được chấp nhận đều có thể khôi phục. Lệnh sao lưu chấp nhận `--out <path>` và cả hai lệnh hỗ trợ `--json`.

Tệp lưu trữ chỉ chứa các tệp và thư mục thông thường. Lệnh sao lưu không bao giờ đi theo hoặc lưu liên kết tượng trưng, liên kết cứng, socket hay nút thiết bị; số lượng mục bị bỏ qua được báo cáo trong kết quả. Lệnh khôi phục từ chối tệp lưu trữ chứa bất kỳ loại mục nào khác. Các cây liên kết tượng trưng có thể tái tạo, chẳng hạn như `node_modules` của workspace, phải được cài đặt lại bên trong cell sau khi khôi phục.

## `fleet doctor`

Kiểm tra mọi cell hoặc một tenant mà không thay đổi trạng thái runtime hay hệ thống tệp:

```bash
openclaw fleet doctor
openclaw fleet doctor acme --json
```

Doctor kiểm tra tính cục bộ của runtime, nhãn sở hữu, tình trạng, biện pháp gia cố, giới hạn tài nguyên, liên kết cổng loopback, sự hiện diện của token, quyền sở hữu mạng và chế độ lưu lượng đi ra, cũng như quyền của thư mục trạng thái riêng tư. Cảnh báo mô tả các cell đã dừng hoặc khác biệt về quyền sở hữu; bất kỳ phát hiện thất bại nào cũng đặt mã thoát tiến trình khác 0.

## `fleet rm`

Xóa một cell đã dừng khỏi runtime và registry trong khi vẫn giữ dữ liệu tenant:

```bash
openclaw fleet rm acme
```

Container đang chạy yêu cầu `--force`:

```bash
openclaw fleet rm acme --force
```

Đồng thời xóa vĩnh viễn dữ liệu của cell:

```bash
openclaw fleet rm acme --purge-data --force
```

Fleet xóa container của cell trước khi xóa mạng bridge chuyên dụng của nó. `--purge-data` yêu cầu `--force`. Trước khi xóa đệ quy, Fleet phân giải cả hai thư mục gốc thuộc sở hữu của Fleet và cả hai thư mục riêng của từng tenant. Mỗi đích phải chính xác là thư mục lá tenant dự kiến, nằm hoàn toàn bên trong thư mục gốc tương ứng và không phải liên kết tượng trưng. Các bước kiểm tra phạm vi này ngăn đường dẫn registry bị hỏng hoặc liên kết tượng trưng xuyên tenant chuyển hướng việc xóa sang nơi khác.

Thao tác xóa sạch có thể được thử lại khi một thư mục tenant dự kiến chính xác đã không còn tồn tại. Điều này cho phép lần gọi sau hoàn tất việc dọn dẹp sau lỗi một phần của hệ thống tệp mà không nới lỏng các bước kiểm tra đường dẫn đối với những thư mục vẫn tồn tại.

## Bố cục lưu trữ và container

Trạng thái cell và khóa mã hóa hồ sơ xác thực sử dụng các đường dẫn host riêng biệt cho từng tenant bên dưới thư mục trạng thái OpenClaw đang hoạt động:

```text
<state-dir>/fleet/cells/<tenant>/
<state-dir>/fleet/auth-profile-secrets/<tenant>/
```

Thư mục đầu tiên được mount tại `/home/node/.openclaw`. Thư mục thứ hai được mount tại `/home/node/.config/openclaw`, phù hợp với điểm mount khóa mã hóa của thiết lập Docker chính thức. Do đó, khóa mã hóa không bị lộ bên dưới điểm mount trạng thái thông thường hoặc được đưa vào khi chỉ sao lưu hay chia sẻ thư mục trạng thái cell. Cả hai thư mục vẫn tồn tại sau thao tác xóa và nâng cấp thông thường; `fleet rm --purge-data --force` xóa cả hai sau các bước kiểm tra phạm vi riêng biệt.

Trước lần khởi động đầu tiên, Fleet khởi tạo cấu hình cell với `gateway.mode=local`, xác thực bằng token, liên kết container LAN và các nguồn gốc Control UI cho cổng host đã cấp phát. Giá trị token không được ghi vào cấu hình đó; nó vẫn nằm trong môi trường container.

Fleet cố định các đường dẫn container của image chính thức bằng các giá trị môi trường sau:

| Biến                 | Giá trị container                      |
| ------------------------ | ------------------------------------ |
| `HOME`                   | `/home/node`                         |
| `OPENCLAW_HOME`          | `/home/node`                         |
| `OPENCLAW_STATE_DIR`     | `/home/node/.openclaw`               |
| `OPENCLAW_CONFIG_PATH`   | `/home/node/.openclaw/openclaw.json` |
| `OPENCLAW_WORKSPACE_DIR` | `/home/node/.openclaw/workspace`     |
| `OPENCLAW_GATEWAY_TOKEN` | Token cell được tạo hoặc cung cấp     |

Image chính thức mặc định sử dụng người dùng không phải root `node` với UID 1000. Fleet giữ cho các bind mount riêng tư `0700` có thể ghi mà không cho phép mọi người truy cập. Docker rootful chạy cell bằng UID và GID không phải root của người gọi; Docker rootless sử dụng UID container 0, được ánh xạ tới người dùng host không đặc quyền đã gọi bên trong user namespace của daemon. Podman sử dụng `keep-id` với UID và GID của người gọi. Khi chính Fleet chạy dưới quyền root với một runtime rootful, nó giữ nguyên người dùng của image và gán các tệp mount ban đầu cho UID/GID 1000.

Trên các host SELinux, các mount Docker và Podman nhận thao tác gắn lại nhãn riêng tư `:Z`. Nếu bạn khôi phục hoặc di chuyển dữ liệu cell, hãy giữ cho các đường dẫn bind mount có thể ghi bởi người dùng container hiệu dụng. Hồ sơ này thân thiện với rootless, nhưng Docker hoặc Podman phải được cấu hình sẵn cho hoạt động rootless trên host; Fleet không chuyển đổi daemon rootful thành daemon rootless.

## Hồ sơ bảo mật

Fleet áp dụng hồ sơ sau cho mọi cell:

| Biện pháp kiểm soát              | Hồ sơ được áp dụng                                      | Lý do                                                                                    |
| -------------------- | ---------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Khả năng Linux   | `--cap-drop=ALL`                                     | Gateway là một tiến trình Node.js và không cần thêm khả năng Linux nào.                |
| Nâng đặc quyền | `--security-opt no-new-privileges`                   | Ngăn các tiến trình giành đặc quyền thông qua tệp nhị phân setuid hoặc setgid.          |
| Tiến trình init         | `--init`                                             | Thu hồi các tiến trình hậu duệ và chuyển tiếp tín hiệu vòng đời container.                   |
| Giới hạn tiến trình        | Mặc định là `--pids-limit 512`                        | Giới hạn tình trạng cạn kiệt do phân nhánh và tiến trình.                                                    |
| Giới hạn bộ nhớ         | Mặc định là `--memory 2g`                             | Giới hạn mức sử dụng bộ nhớ của cell.                                                                |
| Giới hạn CPU            | Mặc định là `--cpus 2`                                | Giới hạn mức sử dụng CPU của cell.                                                                   |
| Đĩa lớp có thể ghi  | `--disk` tùy chọn                                    | Giới hạn lớp container khi backend lưu trữ của runtime hỗ trợ hạn ngạch.           |
| Chính sách khởi động lại       | `--restart unless-stopped`                           | Khởi động lại cell bị lỗi mà không ghi đè thao tác dừng có chủ ý.                         |
| Xuất bản trên host      | Chỉ `127.0.0.1:<host-port>:18789`                   | Không để Gateway xuất hiện trên các giao diện host wildcard.                                        |
| Mạng cell         | Một mạng bridge hoặc mạng nội bộ Podman cho mỗi cell       | Phân tách lưu lượng IP của container và tùy chọn chặn lưu lượng đi ra của Podman.           |
| Danh tính container   | Ánh xạ người dùng khớp với host                            | Giữ cho các bind mount riêng tư có thể ghi mà không cấp quyền truy cập cho mọi người.                      |
| Trạng thái bền vững     | Các mount riêng của từng cell; không có mount trạng thái dùng chung               | Giữ cấu hình, thông tin xác thực, phiên và workspace của tenant trong cây dữ liệu của tenant đó. |
| Lệnh container    | `node dist/index.js gateway --bind lan --port 18789` | Lắng nghe trên mạng container để ánh xạ cổng host chỉ dùng loopback có thể kết nối tới nó.  |

Fleet không bao giờ mount `/var/run/docker.sock`, sử dụng `--privileged` hay mạng host hoặc thêm khả năng. Bridge riêng của từng cell là ranh giới phân tách giữa các cell, không phải tường lửa lưu lượng đi ra: các cell vẫn giữ kết nối mạng đi ra cần thiết cho nhà cung cấp và kênh. Đặt một proxy, đường hầm SSH hoặc cấu hình tailnet phù hợp với môi trường triển khai của bạn phía trước cổng loopback. `http://127.0.0.1:<port>` chỉ có thể được truy cập trực tiếp từ host Fleet.

Hồ sơ này phân tách các container tenant, nhưng không bảo vệ tenant khỏi người vận hành Fleet, quản trị viên runtime container hoặc host bị xâm phạm. Xem [Lưu trữ đa tenant](/gateway/multi-tenant-hosting) để biết mô hình tin cậy đầy đủ và các tùy chọn cô lập mạnh hơn.

## Xử lý token

Theo mặc định, `fleet create` tạo một token Gateway thập lục phân 32 ký tự ngẫu nhiên bằng mật mã và in token đó một lần trong kết quả tạo. Hãy lưu token trong trình quản lý bí mật được phê duyệt và tránh ghi đầu ra tạo vào nhật ký.

`--gateway-token` đặt token tùy chỉnh trong các đối số của tiến trình cục bộ, có thể được lưu trong lịch sử shell hoặc hiển thị trong danh sách tiến trình. Nên dùng token được tạo trừ khi quy trình quản lý bí mật hiện có yêu cầu một giá trị được cung cấp.

Token và mọi giá trị được truyền bằng `--env` nằm trong môi trường container. Fleet ghi chúng vào một tệp môi trường tồn tại trong thời gian ngắn với chế độ `0600`, chỉ truyền đường dẫn của tệp đó cho Docker hoặc Podman và xóa tệp sau khi lệnh runtime hoàn tất. Các giá trị được nhập rõ ràng trong `openclaw fleet create --gateway-token ...` hoặc `--env KEY=VALUE` vẫn có thể hiển thị trong các đối số của tiến trình `openclaw` bên ngoài và lịch sử shell.

Các giá trị môi trường của container không bị ẩn khỏi quản trị viên máy chủ đáng tin cậy: quản trị viên Docker hoặc Podman có thể đọc chúng bằng tính năng kiểm tra container. Ghi chú "chỉ hiển thị một lần" của Fleet mô tả đầu ra CLI thông thường, không có nghĩa là có khả năng chống lại quản trị viên máy chủ.

## Liên quan

- [Lưu trữ đa đối tượng thuê](/gateway/multi-tenant-hosting)
- [Docker](/vi/install/docker)
- [Podman](/vi/install/podman)
- [Bảo mật Gateway](/vi/gateway/security)
