---
read_when:
    - Tái cấu trúc vòng đời phiên ACP hoặc dọn dẹp tiến trình ACPX
    - Gỡ lỗi các tiến trình ACPX mồ côi, tái sử dụng PID hoặc độ an toàn khi dọn dẹp nhiều Gateway
    - Thay đổi khả năng hiển thị của sessions_list cho các phiên ACP hoặc tác tử con được tạo ra
    - Thiết kế siêu dữ liệu quyền sở hữu cho các tác vụ nền, phiên ACP hoặc quyền giữ tạm thời của quy trình
sidebarTitle: ACP lifecycle refactor
summary: Kế hoạch di chuyển để làm cho quyền sở hữu phiên ACP và tiến trình ACPX trở nên tường minh
title: Tái cấu trúc vòng đời ACP
x-i18n:
    generated_at: "2026-05-07T13:25:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: b7f4ee447e0b436601c68251c26c1b897a642f6a8b1886d18647b62817996792
    source_path: refactor/acp.md
    workflow: 16
---

Vòng đời ACP hiện hoạt động, nhưng quá nhiều phần của nó được suy luận sau khi sự việc đã xảy ra.
Dọn dẹp tiến trình tái dựng quyền sở hữu từ PID, chuỗi lệnh, đường dẫn trình bọc
và bảng tiến trình đang chạy. Khả năng hiển thị phiên tái dựng quyền sở hữu
từ các chuỗi khóa phiên cộng với các lượt tra cứu phụ `sessions.list({ spawnedBy })`.
Điều đó khiến các bản sửa hẹp trở nên khả thi, nhưng cũng làm cho các trường hợp biên dễ bị bỏ sót:
tái sử dụng PID, lệnh có dấu nháy, tiến trình cháu của bộ điều hợp, gốc trạng thái nhiều Gateway,
`cancel` so với `close`, và khả năng hiển thị `tree` so với `all` đều trở thành những nơi riêng biệt
để khám phá lại cùng các quy tắc sở hữu.

Bản tái cấu trúc này biến quyền sở hữu thành khái niệm hạng nhất. Mục tiêu không phải là một bề mặt sản phẩm ACP mới;
mà là một hợp đồng nội bộ an toàn hơn cho hành vi ACP và ACPX hiện có.

## Mục tiêu

- Dọn dẹp không bao giờ gửi tín hiệu tới tiến trình trừ khi bằng chứng đang chạy hiện tại khớp với một
  quyền giữ do OpenClaw sở hữu.
- `cancel`, `close`, và thu gom khi khởi động có các ý định vòng đời riêng biệt.
- `sessions_list`, `sessions_history`, `sessions_send`, và các kiểm tra trạng thái dùng
  cùng một mô hình phiên thuộc sở hữu của bên yêu cầu.
- Các cài đặt nhiều Gateway không thể thu gom trình bọc ACPX của nhau.
- Các bản ghi phiên ACPX cũ tiếp tục hoạt động trong quá trình di chuyển.
- Runtime vẫn thuộc sở hữu của Plugin; lõi không biết chi tiết gói ACPX.

## Không phải mục tiêu

- Thay thế ACPX hoặc thay đổi bề mặt lệnh công khai `/acp`.
- Di chuyển hành vi bộ điều hợp ACP riêng theo nhà cung cấp vào lõi.
- Yêu cầu người dùng dọn dẹp trạng thái thủ công trước khi nâng cấp.
- Khiến `cancel` đóng các phiên ACP có thể tái sử dụng.

## Mô hình đích

### Danh tính thực thể Gateway

Mỗi tiến trình Gateway nên có một mã định danh thực thể runtime ổn định:

```ts
type GatewayInstanceId = string;
```

Nó có thể được tạo khi Gateway khởi động và được lưu trong trạng thái trong suốt vòng đời
của cài đặt đó. Đây không phải là bí mật bảo mật; nó là bộ phân biệt quyền sở hữu dùng
để tránh nhầm lẫn các tiến trình ACP của một Gateway với các tiến trình của Gateway khác.

### Quyền sở hữu phiên ACP

Mỗi phiên ACP được sinh ra nên có siêu dữ liệu quyền sở hữu đã chuẩn hóa:

```ts
type AcpSessionOwner = {
  sessionKey: string;
  spawnedBy?: string;
  parentSessionKey?: string;
  ownerSessionKey: string;
  agentId: string;
  backend: "acpx";
  gatewayInstanceId: GatewayInstanceId;
  createdAt: number;
};
```

Gateway nên trả về các trường này trên các hàng phiên khi đã biết chúng.
Lọc khả năng hiển thị nên là một kiểm tra thuần túy trên siêu dữ liệu hàng:

```ts
canSeeSessionRow({
  row,
  requesterSessionKey,
  visibility,
  a2aPolicy,
});
```

Điều đó loại bỏ các lệnh gọi phụ ẩn `sessions.list({ spawnedBy })` khỏi
các kiểm tra khả năng hiển thị. Một phiên con ACP xuyên tác nhân được sinh ra thuộc sở hữu của bên yêu cầu vì
hàng dữ liệu nói như vậy, không phải vì một truy vấn thứ hai tình cờ tìm thấy nó.

### Quyền giữ tiến trình ACPX

Mỗi lần khởi chạy trình bọc được tạo nên tạo một bản ghi quyền giữ:

```ts
type AcpxProcessLease = {
  leaseId: string;
  gatewayInstanceId: GatewayInstanceId;
  sessionKey: string;
  wrapperRoot: string;
  wrapperPath: string;
  rootPid: number;
  processGroupId?: number;
  commandHash: string;
  startedAt: number;
  state: "open" | "closing" | "closed" | "lost";
};
```

Tiến trình trình bọc nên nhận mã quyền giữ và mã thực thể Gateway trong
môi trường của nó:

```sh
OPENCLAW_ACPX_LEASE_ID=...
OPENCLAW_GATEWAY_INSTANCE_ID=...
```

Khi nền tảng cho phép, xác minh nên ưu tiên siêu dữ liệu tiến trình đang chạy
không thể bị nhầm lẫn bởi cách đặt dấu nháy trong lệnh:

- PID gốc vẫn tồn tại
- đường dẫn trình bọc đang chạy nằm dưới `wrapperRoot`
- nhóm tiến trình khớp với quyền giữ khi có
- môi trường chứa mã quyền giữ dự kiến khi có thể đọc
- băm lệnh hoặc đường dẫn tệp thực thi khớp với quyền giữ

Nếu không thể xác minh tiến trình đang chạy, dọn dẹp sẽ đóng theo hướng an toàn.

## Bộ điều khiển vòng đời

Giới thiệu một bộ điều khiển vòng đời ACPX sở hữu các quyền giữ tiến trình và chính sách
dọn dẹp:

```ts
interface AcpxLifecycleController {
  ensureSession(input: AcpRuntimeEnsureInput): Promise<AcpRuntimeHandle>;
  cancelTurn(handle: AcpRuntimeHandle): Promise<void>;
  closeSession(input: {
    handle: AcpRuntimeHandle;
    discardPersistentState?: boolean;
    reason?: string;
  }): Promise<void>;
  reapStartupOrphans(): Promise<void>;
  verifyOwnedTree(lease: AcpxProcessLease): Promise<OwnedProcessTree | null>;
}
```

`cancelTurn` chỉ yêu cầu hủy lượt. Nó không được thu gom trình bọc hoặc
tiến trình bộ điều hợp có thể tái sử dụng.

`closeSession` được phép thu gom, nhưng chỉ sau khi tải bản ghi phiên,
tải quyền giữ, và xác minh cây tiến trình đang chạy vẫn thuộc về quyền giữ đó.

`reapStartupOrphans` bắt đầu từ các quyền giữ đang mở trong trạng thái. Nó có thể dùng bảng tiến trình
để tìm hậu duệ, nhưng không nên quét các lệnh trông giống ACP tùy ý trước
rồi sau đó quyết định rằng chúng có lẽ là của chúng ta.

## Hợp đồng trình bọc

Các trình bọc được tạo nên giữ nhỏ gọn. Chúng nên:

- khởi động bộ điều hợp trong một nhóm tiến trình khi được hỗ trợ
- chuyển tiếp các tín hiệu kết thúc thông thường tới nhóm tiến trình
- phát hiện tiến trình cha đã chết
- khi tiến trình cha chết, gửi SIGTERM, rồi giữ trình bọc chạy cho đến khi cơ chế dự phòng
  SIGKILL chạy
- báo cáo PID gốc và mã nhóm tiến trình về bộ điều khiển vòng đời khi
  có thông tin đó

Trình bọc không nên quyết định chính sách phiên. Chúng chỉ thực thi dọn dẹp cây tiến trình cục bộ
cho nhóm bộ điều hợp của chính chúng.

## Hợp đồng khả năng hiển thị phiên

Khả năng hiển thị nên dùng quyền sở hữu hàng đã chuẩn hóa:

```ts
type SessionVisibilityInput = {
  requesterSessionKey: string;
  row: {
    key: string;
    agentId: string;
    ownerSessionKey?: string;
    spawnedBy?: string;
    parentSessionKey?: string;
  };
  visibility: "self" | "tree" | "agent" | "all";
  a2aPolicy: AgentToAgentPolicy;
};
```

Quy tắc:

- `self`: chỉ phiên của bên yêu cầu.
- `tree`: phiên của bên yêu cầu cộng với các hàng do bên yêu cầu sở hữu hoặc sinh ra từ bên yêu cầu.
- `all`: tất cả các hàng cùng tác nhân, các hàng xuyên tác nhân được a2a cho phép, và các hàng xuyên tác nhân
  do bên yêu cầu sở hữu được sinh ra, ngay cả khi a2a chung bị tắt.
- `agent`: chỉ cùng tác nhân, trừ khi một quan hệ sở hữu rõ ràng cho biết hàng đó
  thuộc về bên yêu cầu.

Điều này khiến `tree` và `all` đơn điệu: `all` không được ẩn một phiên con thuộc sở hữu
mà `tree` sẽ hiển thị.

## Kế hoạch di chuyển

### Giai đoạn 1: Thêm danh tính và quyền giữ

- Thêm `gatewayInstanceId` vào trạng thái Gateway.
- Thêm một kho quyền giữ ACPX trong thư mục trạng thái ACPX.
- Ghi một quyền giữ trước khi sinh trình bọc được tạo.
- Lưu `leaseId` trên các bản ghi phiên ACPX mới.
- Giữ các trường PID và lệnh hiện có cho bản ghi cũ.

### Giai đoạn 2: Dọn dẹp ưu tiên quyền giữ

- Thay đổi dọn dẹp khi đóng để tải `leaseId` trước.
- Xác minh quyền sở hữu tiến trình đang chạy dựa trên quyền giữ trước khi gửi tín hiệu.
- Chỉ giữ cơ chế dự phòng PID gốc và gốc trình bọc hiện tại cho bản ghi cũ.
- Đánh dấu quyền giữ là `closed` sau khi dọn dẹp đã xác minh.
- Đánh dấu quyền giữ là `lost` khi tiến trình đã biến mất trước khi dọn dẹp.

### Giai đoạn 3: Thu gom khi khởi động ưu tiên quyền giữ

- Thu gom khi khởi động quét các quyền giữ đang mở.
- Với mỗi quyền giữ, xác minh tiến trình gốc và thu thập các hậu duệ.
- Thu gom các cây đã xác minh theo thứ tự con trước.
- Hết hạn các quyền giữ `closed` và `lost` cũ với một khoảng giữ lại có giới hạn.
- Chỉ giữ quét dấu hiệu lệnh như một cơ chế dự phòng tạm thời cho bản ghi cũ, được bảo vệ bởi
  gốc trình bọc và thực thể Gateway khi có thể.

### Giai đoạn 4: Hàng quyền sở hữu phiên

- Thêm siêu dữ liệu quyền sở hữu vào các hàng phiên Gateway.
- Dạy các trình ghi ACPX, tác nhân phụ, tác vụ nền và kho phiên điền
  `ownerSessionKey` hoặc `spawnedBy`.
- Chuyển đổi các kiểm tra khả năng hiển thị phiên sang dùng siêu dữ liệu hàng.
- Loại bỏ các lượt tra cứu phụ `sessions.list({ spawnedBy })` tại thời điểm kiểm tra khả năng hiển thị.

### Giai đoạn 5: Loại bỏ suy đoán cũ

Sau một cửa sổ phát hành:

- ngừng dựa vào chuỗi lệnh gốc đã lưu cho dọn dẹp ACPX không phải bản ghi cũ
- loại bỏ quét dấu hiệu lệnh khi khởi động
- loại bỏ các lượt tra cứu danh sách dự phòng cho khả năng hiển thị
- giữ hành vi phòng vệ đóng theo hướng an toàn cho các quyền giữ bị thiếu hoặc không thể xác minh

## Kiểm thử

Thêm hai bộ kiểm thử dạng bảng.

Trình mô phỏng vòng đời tiến trình:

- PID được tái sử dụng bởi tiến trình không liên quan
- PID được tái sử dụng bởi gốc trình bọc của Gateway khác
- lệnh trình bọc đã lưu được đặt dấu nháy shell, lệnh `ps` đang chạy thì không
- tiến trình con của bộ điều hợp thoát, tiến trình cháu vẫn còn trong nhóm tiến trình
- cơ chế dự phòng SIGTERM khi tiến trình cha chết đạt tới SIGKILL
- không có danh sách tiến trình
- quyền giữ cũ với tiến trình bị thiếu
- tiến trình mồ côi khi khởi động với trình bọc, tiến trình con của bộ điều hợp và tiến trình cháu

Ma trận khả năng hiển thị phiên:

- `self`, `tree`, `agent`, `all`
- a2a bật và tắt
- hàng cùng tác nhân
- hàng xuyên tác nhân
- hàng ACP xuyên tác nhân được sinh ra và do bên yêu cầu sở hữu
- bên yêu cầu bị sandbox kẹp về `tree`
- các hành động liệt kê, lịch sử, gửi và trạng thái

Bất biến quan trọng: một phiên con được sinh ra và thuộc sở hữu của bên yêu cầu sẽ hiển thị ở mọi nơi
mà cấu hình khả năng hiển thị bao gồm cây phiên của bên yêu cầu, và `all` không
kém khả năng hơn `tree`.

## Ghi chú tương thích

Các bản ghi phiên cũ có thể không có `leaseId`. Chúng nên dùng đường dẫn dọn dẹp cũ
đóng theo hướng an toàn:

- yêu cầu một tiến trình gốc đang chạy
- yêu cầu quyền sở hữu gốc trình bọc khi dự kiến có trình bọc được tạo
- yêu cầu lệnh khớp với các gốc không phải trình bọc
- không bao giờ gửi tín hiệu chỉ dựa trên siêu dữ liệu PID đã lưu và cũ

Nếu không thể xác minh một bản ghi cũ, hãy để nguyên nó. Dọn dẹp quyền giữ khi khởi động và
cửa sổ phát hành tiếp theo cuối cùng nên loại bỏ cơ chế dự phòng.

## Tiêu chí thành công

- Đóng một phiên ACPX cũ hoặc lỗi thời không thể giết tiến trình của Gateway khác.
- Tiến trình cha chết không để lại các tiến trình cháu bộ điều hợp cứng đầu vẫn chạy.
- `cancel` hủy lượt đang hoạt động mà không đóng các phiên có thể tái sử dụng.
- `sessions_list` có thể hiển thị các phiên con ACP xuyên tác nhân do bên yêu cầu sở hữu dưới cả
  `tree` và `all`.
- Dọn dẹp khi khởi động được dẫn dắt bởi quyền giữ, không phải các lượt quét chuỗi lệnh rộng.
- Các kiểm thử ma trận tiến trình và khả năng hiển thị tập trung bao phủ mọi trường hợp biên từng
  yêu cầu các bản sửa đánh giá riêng lẻ.
