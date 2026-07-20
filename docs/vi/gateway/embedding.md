---
read_when:
    - Nhúng OpenClaw vào ứng dụng máy tính để bàn hoặc máy chủ
    - Giám sát Gateway dưới dạng tiến trình con
    - Xử lý trạng thái sẵn sàng, khởi động lại, tắt hoặc cấu hình không hợp lệ của Gateway mà không cần trích xuất nhật ký
summary: Giám sát Gateway OpenClaw dưới dạng tiến trình con từ Electron hoặc một ứng dụng chủ khác
title: Nhúng OpenClaw
x-i18n:
    generated_at: "2026-07-20T14:46:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: ca67e03994f21446bfeca58c95c2cb624dde767b9983a89982627145f80dfb90
    source_path: gateway/embedding.md
    workflow: 16
---

Máy chủ nhúng nên giám sát tệp thực thi `openclaw` đã cài đặt, sử dụng giao thức WebSocket của Gateway làm mặt phẳng điều khiển và xem tiến trình con là một runtime có thể thay thế. Cách này giúp xác định rõ quyền sở hữu tiến trình, trạng thái sẵn sàng, khả năng phục hồi sau lỗi và việc nâng cấp mà không phụ thuộc vào bố cục trạng thái riêng của OpenClaw.

Để biết về xác thực ứng dụng khách và trạng thái kết nối lại, hãy đọc
[Xây dựng ứng dụng khách Gateway](https://docs.openclaw.ai/gateway/clients).

## Khởi động tiến trình con bằng cấu hình đặt trước dành cho nhúng

Sử dụng một bản cài đặt `node_modules` thực và khởi chạy tệp thực thi của gói. Cấu hình cơ sở hữu ích cho máy chủ sở hữu việc khám phá, khởi động lại và vòng đời kênh là:

```ts
import { spawn } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Cung cấp đường dẫn tuyệt đối đến một runtime Node thực do ứng dụng máy chủ quản lý.
declare const hostNodeExecutable: string;

const packageEntry = fileURLToPath(import.meta.resolve("openclaw"));
const openclawEntry = resolve(dirname(packageEntry), "..", "openclaw.mjs");
const gateway = spawn(hostNodeExecutable, [openclawEntry, "gateway", "--allow-unconfigured"], {
  env: {
    ...process.env,
    OPENCLAW_DISABLE_BONJOUR: "1",
    OPENCLAW_EXEC_SHELL_SNAPSHOT: "0",
    OPENCLAW_NO_RESPAWN: "1",
    OPENCLAW_SKIP_CHANNELS: "1",
  },
  stdio: ["ignore", "inherit", "inherit"],
});
```

Phân giải OpenClaw thông qua gói đã cài đặt như minh họa; không giả định rằng tệp nhị phân `openclaw` cục bộ của dự án nằm trong `PATH` của tiến trình máy chủ. Ví dụ kế thừa đầu ra để tiến trình con không thể bị chặn do các pipe stdout hoặc stderr đầy. Nếu máy chủ thu thập các luồng này, hãy gắn trình tiêu thụ ngay sau khi khởi chạy.

| Thiết lập                          | Tác động khi nhúng                                                                                                                                                                           |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `OPENCLAW_DISABLE_BONJOUR=1`     | Tắt quảng bá multicast LAN do Gateway sở hữu khi máy chủ chịu trách nhiệm khám phá.                                                                                                             |
| `OPENCLAW_NO_RESPAWN=1`          | Trong tiến trình con nhúng không được quản lý, ngăn OpenClaw chuyển giao việc khởi động lại sau cập nhật cho một tiến trình con tách rời. Các lần khởi động lại thông thường vẫn diễn ra trong tiến trình, vì vậy máy chủ tiếp tục sở hữu PID đang được theo dõi. |
| `OPENCLAW_EXEC_SHELL_SNAPSHOT=0` | Tắt việc thu thập ảnh chụp nhanh shell đăng nhập cho các lệnh thực thi của máy chủ.                                                                                                                              |
| `OPENCLAW_SKIP_CHANNELS=1`       | Bỏ qua việc khởi động và tải lại kênh. Chỉ đặt tùy chọn này khi ứng dụng nhúng cần một Gateway chỉ dành cho mặt phẳng điều khiển hoặc WebChat.                                                                        |

`--allow-unconfigured` chỉ bỏ qua cơ chế bảo vệ khởi động `gateway.mode=local`. Tùy chọn này không ghi cấu hình hoặc sửa chữa tệp không hợp lệ. Hãy bỏ tùy chọn này khi ứng dụng nhúng cung cấp cấu hình cục bộ thông thường thông qua quy trình thiết lập ban đầu, CLI cấu hình hoặc RPC của Gateway.

### Cảnh báo về ảnh chụp nhanh shell trong Electron

Việc thu thập ảnh chụp nhanh shell chạy `process.execPath -e <script>` từ shell đăng nhập. Trong một tiến trình Node thông thường, `process.execPath` là tệp thực thi Node. Trong Electron, đó là tệp nhị phân Electron, có thể diễn giải lời gọi này là thao tác khởi chạy ứng dụng và hiển thị cửa sổ bật lên "Unable to find Electron app". Hãy đặt `OPENCLAW_EXEC_SHELL_SNAPSHOT=0` trong môi trường của tiến trình con Gateway, không chỉ trong tiến trình renderer. Cũng vì lý do đó, `hostNodeExecutable` phải trỏ đến một runtime Node thực thay vì `process.execPath` của Electron.

## Xử lý cấu hình không hợp lệ bằng mã thoát

Quá trình khởi động Gateway sử dụng mã thoát `78` (`EX_CONFIG`) cho các lỗi khởi động thuộc loại cấu hình, bao gồm cấu hình không hợp lệ. Hãy phân nhánh dựa trên mã thoát thay vì phân tích stderr dành cho người đọc:

1. Chạy `openclaw doctor --fix --yes --non-interactive` với cùng môi trường cấu hình và trạng thái như tiến trình con Gateway.
2. Thử khởi động Gateway lại một lần sau khi doctor thoát thành công.
3. Nếu tiến trình con lại thoát với `78`, hãy dừng vòng lặp sửa chữa và hiển thị lỗi cấu hình cho người dùng.

Giữ lại stderr để chẩn đoán, nhưng không đưa ra quyết định về vòng đời dựa trên cách diễn đạt của nó.

Sau khi khởi động thành công, việc chỉnh sửa trực tiếp khiến cấu hình trở nên không hợp lệ ít gây hậu quả nghiêm trọng hơn. Trình theo dõi cấu hình ghi nhật ký rằng quá trình tải lại đã bị bỏ qua và tiếp tục phục vụ cấu hình trong bộ nhớ được chấp nhận gần nhất. Hãy sửa tệp, sau đó để trình theo dõi chấp nhận ảnh chụp nhanh hợp lệ tiếp theo.

## Chờ giao thức sẵn sàng

Sử dụng tín hiệu WebSocket thay vì chuỗi con trong nhật ký:

1. Mở WebSocket của Gateway.
2. Chờ sự kiện `connect.challenge`. Sự kiện này chứng minh rằng trình lắng nghe đã chấp nhận WebSocket và quá trình bắt tay thử thách có thể bắt đầu.
3. Gửi `connect` cùng chữ ký thiết bị được ràng buộc với thử thách.
4. Xem `hello-ok` là trạng thái sẵn sàng của ứng dụng cho RPC đã xác thực.

Thử thách được đưa ra sớm hơn quá trình khởi tạo đầy đủ một cách có chủ ý. Nếu các tiến trình phụ khởi động vẫn đang chờ xử lý, `connect` trả về lỗi `UNAVAILABLE` có thể thử lại với `details.reason: "startup-sidecars"`, một `retryAfterMs` có giới hạn, rồi đóng bằng mã `1013` và lý do `gateway starting`. Sử dụng `resolveGatewayStartupRetryAfterMs` từ `@openclaw/gateway-protocol/startup-unavailable` hoặc chính sách tích hợp sẵn của ứng dụng khách tham chiếu, sau đó kết nối lại.

## Diễn giải việc khởi động lại và tắt

Trước khi đóng có trật tự, Gateway phát sự kiện `shutdown` với `reason` và `restartExpectedMs`. Giá trị `restartExpectedMs` khác null có nghĩa là dự kiến sẽ khởi động lại trong tiến trình hoặc dưới sự giám sát; `null` có nghĩa là tắt hoàn toàn.

Mã đóng WebSocket tiếp theo là `1012` cho cả hai trường hợp. Lý do đóng thông thường của ứng dụng khách cũng là `service restart` trong cả hai trường hợp, vì vậy cả mã đóng lẫn lý do đều không phân biệt được khởi động lại với tắt. Hãy giữ lại payload `shutdown` trước đó khi nhận được và kết hợp nó với ý định dừng của chính máy chủ cùng trạng thái thoát của tiến trình con. Nếu kết nối biến mất mà không có sự kiện, hãy sử dụng chính sách kết nối lại có giới hạn và giám sát tiến trình con thông thường.

## Sử dụng RPC thay vì tệp trạng thái

Giữ Gateway là chủ sở hữu duy nhất của trạng thái OpenClaw. Các thao tác nhúng phổ biến đã có sẵn phương thức RPC:

| Tác vụ                          | Phương thức RPC                                          |
| ----------------------------- | ---------------------------------------------------- |
| Danh mục và vòng đời phiên | `sessions.list`, `sessions.patch`, `sessions.delete` |
| Hiển thị bản ghi hội thoại            | `chat.history`                                       |
| Báo cáo chi phí và mức sử dụng        | `usage.cost`, `sessions.usage`                       |
| Trạng thái thông tin xác thực mô hình       | `models.authStatus`                                  |
| Cấu hình                 | `config.get`, `config.patch`                         |

`config.get` che giấu các giá trị nhạy cảm và mã định danh SecretRef trước khi trả về ảnh chụp nhanh. Các phương thức ghi cũng trả về cấu hình đã được che giấu. Ứng dụng khách phải coi dấu hiệu che giấu là dữ liệu bất khả tri và sử dụng hợp đồng ghi cấu hình đã được ghi tài liệu; tuyệt đối không được kỳ vọng Gateway trả về bí mật ở dạng văn bản thuần túy.

Không đọc hoặc sửa đổi tệp, bảng SQLite, tệp bản ghi hội thoại hay thư mục bộ nhớ đệm trong `~/.openclaw` để triển khai các tính năng ứng dụng. Các bố cục đó là chi tiết triển khai runtime riêng tư và có thể di chuyển hoặc thay đổi mà không cần duy trì khả năng tương thích giao thức.

## Cài đặt; không làm phẳng

Gói `openclaw` gốc không phải là mục tiêu để đóng gói mã nguồn vào một tệp duy nhất. Các tệp runtime đi kèm trong `dist/extensions` giữ lại các lệnh tự nhập trần như `openclaw/plugin-sdk/*`, trong khi gói npm chủ ý loại trừ các cây `node_modules` riêng cho từng phần mở rộng.

Cài đặt OpenClaw thông qua npm, pnpm hoặc một cơ chế cài đặt gói Node thông thường khác để Node có thể phân giải các export của gói và cây phụ thuộc gốc. Khởi chạy tệp thực thi `openclaw` đã cài đặt. Không chỉ sao chép `dist`, làm phẳng gói vào một bundle ứng dụng hoặc đóng gói kèm các tệp phần mở rộng được chọn.

## Liên quan

- [Xây dựng ứng dụng khách Gateway](https://docs.openclaw.ai/gateway/clients)
- [Giao thức Gateway](https://docs.openclaw.ai/gateway/protocol)
- [CLI Gateway](https://docs.openclaw.ai/cli/gateway)
- [Tích hợp Gateway cho ứng dụng bên ngoài](https://docs.openclaw.ai/gateway/external-apps)
