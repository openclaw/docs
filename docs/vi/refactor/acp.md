---
read_when:
    - Tái cấu trúc vòng đời phiên ACP hoặc quy trình dọn dẹp tiến trình ACPX
    - Gỡ lỗi các tiến trình ACPX mồ côi, việc tái sử dụng PID hoặc tính an toàn khi dọn dẹp nhiều Gateway
    - Thay đổi khả năng hiển thị của sessions_list đối với các phiên ACP hoặc phiên tác tử con được tạo ra
    - Thiết kế siêu dữ liệu về quyền sở hữu cho các tác vụ nền, phiên ACP hoặc hợp đồng thuê tiến trình
sidebarTitle: ACP lifecycle refactor
summary: Kế hoạch di chuyển nhằm xác định rõ quyền sở hữu phiên ACP và tiến trình ACPX
title: Tái cấu trúc vòng đời ACP
x-i18n:
    generated_at: "2026-07-12T08:18:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b7f4ee447e0b436601c68251c26c1b897a642f6a8b1886d18647b62817996792
    source_path: refactor/acp.md
    workflow: 16
---

Vòng đời ACP hiện đang hoạt động, nhưng quá nhiều phần trong đó được suy luận sau khi sự việc đã xảy ra.
Quá trình dọn dẹp tiến trình tái dựng quyền sở hữu từ PID, chuỗi lệnh, đường dẫn
trình bao và bảng tiến trình đang hoạt động. Khả năng hiển thị phiên tái dựng quyền sở hữu
từ chuỗi khóa phiên cùng với các truy vấn phụ `sessions.list({ spawnedBy })`.
Điều đó cho phép thực hiện các bản sửa lỗi có phạm vi hẹp, nhưng cũng khiến các trường hợp biên dễ bị bỏ sót:
tái sử dụng PID, lệnh có dấu nháy, tiến trình cháu của bộ điều hợp, thư mục gốc trạng thái của nhiều Gateway,
`cancel` so với `close`, và khả năng hiển thị `tree` so với `all` đều trở thành những
nơi riêng biệt phải khám phá lại cùng một bộ quy tắc sở hữu.

Bản tái cấu trúc này đưa quyền sở hữu thành khái niệm hạng nhất. Mục tiêu không phải là một bề mặt sản phẩm ACP
mới; mà là một hợp đồng nội bộ an toàn hơn cho hành vi ACP và ACPX hiện có.

## Mục tiêu

- Quá trình dọn dẹp không bao giờ gửi tín hiệu đến một tiến trình trừ khi bằng chứng trực tiếp hiện tại khớp với một
  hợp đồng thuê do OpenClaw sở hữu.
- `cancel`, `close` và thu dọn khi khởi động có các ý định vòng đời riêng biệt.
- `sessions_list`, `sessions_history`, `sessions_send` và các lần kiểm tra trạng thái sử dụng
  cùng một mô hình phiên do bên yêu cầu sở hữu.
- Các bản cài đặt nhiều Gateway không thể thu dọn trình bao ACPX của nhau.
- Các bản ghi phiên ACPX cũ tiếp tục hoạt động trong quá trình di chuyển.
- Môi trường chạy vẫn thuộc sở hữu của Plugin; lõi không biết các chi tiết gói ACPX.

## Ngoài mục tiêu

- Thay thế ACPX hoặc thay đổi bề mặt lệnh công khai `/acp`.
- Chuyển hành vi bộ điều hợp ACP dành riêng cho nhà cung cấp vào lõi.
- Yêu cầu người dùng dọn dẹp trạng thái thủ công trước khi nâng cấp.
- Khiến `cancel` đóng các phiên ACP có thể tái sử dụng.

## Mô hình mục tiêu

### Danh tính phiên bản Gateway

Mỗi tiến trình Gateway nên có một mã định danh phiên bản môi trường chạy ổn định:

```ts
type GatewayInstanceId = string;
```

Mã này có thể được tạo khi Gateway khởi động và được lưu bền vững trong trạng thái suốt vòng đời của
bản cài đặt đó. Đây không phải là bí mật bảo mật; mà là một dấu hiệu phân biệt quyền sở hữu được dùng
để tránh nhầm lẫn các tiến trình ACP của một Gateway với tiến trình của Gateway khác.

### Quyền sở hữu phiên ACP

Mỗi phiên ACP được tạo nên có siêu dữ liệu quyền sở hữu đã chuẩn hóa:

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

Gateway nên trả về các trường này trên các hàng phiên khi chúng đã được xác định.
Việc lọc khả năng hiển thị nên là một phép kiểm tra thuần túy trên siêu dữ liệu hàng:

```ts
canSeeSessionRow({
  row,
  requesterSessionKey,
  visibility,
  a2aPolicy,
});
```

Điều đó loại bỏ các lệnh gọi phụ ẩn `sessions.list({ spawnedBy })` khỏi
các lần kiểm tra khả năng hiển thị. Một phiên ACP con liên tác nhân được tạo sẽ thuộc sở hữu của bên yêu cầu vì
hàng dữ liệu cho biết như vậy, chứ không phải vì một truy vấn thứ hai tình cờ tìm thấy nó.

### Hợp đồng thuê tiến trình ACPX

Mỗi lần khởi chạy trình bao được tạo nên tạo một bản ghi hợp đồng thuê:

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

Tiến trình trình bao nên nhận mã hợp đồng thuê và mã phiên bản Gateway trong
môi trường của nó:

```sh
OPENCLAW_ACPX_LEASE_ID=...
OPENCLAW_GATEWAY_INSTANCE_ID=...
```

Khi nền tảng cho phép, việc xác minh nên ưu tiên siêu dữ liệu tiến trình trực tiếp
không thể bị nhầm lẫn bởi cách đặt dấu nháy trong lệnh:

- PID gốc vẫn tồn tại
- đường dẫn trình bao trực tiếp nằm dưới `wrapperRoot`
- nhóm tiến trình khớp với hợp đồng thuê khi có sẵn
- môi trường chứa mã hợp đồng thuê mong đợi khi có thể đọc được
- hàm băm lệnh hoặc đường dẫn tệp thực thi khớp với hợp đồng thuê

Nếu không thể xác minh tiến trình trực tiếp, quá trình dọn dẹp sẽ từ chối thực hiện để bảo đảm an toàn.

## Bộ điều khiển vòng đời

Giới thiệu một bộ điều khiển vòng đời ACPX duy nhất sở hữu các hợp đồng thuê tiến trình và chính sách
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

`cancelTurn` chỉ yêu cầu hủy lượt hiện tại. Nó không được thu dọn tiến trình trình bao
hoặc bộ điều hợp có thể tái sử dụng.

`closeSession` được phép thu dọn, nhưng chỉ sau khi tải bản ghi phiên,
tải hợp đồng thuê và xác minh cây tiến trình trực tiếp vẫn thuộc về
hợp đồng thuê đó.

`reapStartupOrphans` bắt đầu từ các hợp đồng thuê đang mở trong trạng thái. Nó có thể dùng bảng
tiến trình để tìm các tiến trình con, nhưng không nên quét các lệnh tùy ý trông giống ACP
trước rồi mới quyết định rằng chúng có thể là của chúng ta.

## Hợp đồng trình bao

Các trình bao được tạo nên duy trì kích thước nhỏ. Chúng nên:

- khởi động bộ điều hợp trong một nhóm tiến trình khi được hỗ trợ
- chuyển tiếp các tín hiệu kết thúc thông thường đến nhóm tiến trình
- phát hiện tiến trình cha đã chết
- khi tiến trình cha chết, gửi SIGTERM, sau đó giữ trình bao hoạt động cho đến khi cơ chế dự phòng
  SIGKILL chạy
- báo cáo PID gốc và mã nhóm tiến trình về bộ điều khiển vòng đời khi
  có sẵn

Trình bao không nên quyết định chính sách phiên. Chúng chỉ thực thi việc dọn dẹp cây tiến trình cục bộ
cho nhóm bộ điều hợp của chính mình.

## Hợp đồng khả năng hiển thị phiên

Khả năng hiển thị nên sử dụng quyền sở hữu hàng đã chuẩn hóa:

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
- `tree`: phiên của bên yêu cầu cùng với các hàng thuộc sở hữu của hoặc được tạo từ bên yêu cầu.
- `all`: tất cả các hàng cùng tác nhân, các hàng liên tác nhân được a2a cho phép và các hàng liên tác nhân được tạo
  thuộc sở hữu của bên yêu cầu ngay cả khi a2a chung bị vô hiệu hóa.
- `agent`: chỉ cùng tác nhân, trừ khi mối quan hệ sở hữu rõ ràng cho biết hàng đó
  thuộc về bên yêu cầu.

Điều này làm cho `tree` và `all` có tính đơn điệu: `all` không được ẩn một phiên con thuộc sở hữu mà
`tree` sẽ hiển thị.

## Kế hoạch di chuyển

### Giai đoạn 1: Thêm danh tính và hợp đồng thuê

- Thêm `gatewayInstanceId` vào trạng thái Gateway.
- Thêm kho hợp đồng thuê ACPX trong thư mục trạng thái ACPX.
- Ghi một hợp đồng thuê trước khi tạo trình bao được sinh.
- Lưu `leaseId` trên các bản ghi phiên ACPX mới.
- Giữ các trường PID và lệnh hiện có cho các bản ghi cũ.

### Giai đoạn 2: Dọn dẹp ưu tiên hợp đồng thuê

- Thay đổi quá trình dọn dẹp khi đóng để tải `leaseId` trước.
- Xác minh quyền sở hữu tiến trình trực tiếp dựa trên hợp đồng thuê trước khi gửi tín hiệu.
- Chỉ giữ cơ chế dự phòng PID gốc và thư mục gốc trình bao hiện tại cho các bản ghi cũ.
- Đánh dấu hợp đồng thuê là `closed` sau khi dọn dẹp đã được xác minh.
- Đánh dấu hợp đồng thuê là `lost` khi tiến trình đã biến mất trước khi dọn dẹp.

### Giai đoạn 3: Thu dọn khi khởi động ưu tiên hợp đồng thuê

- Quá trình thu dọn khi khởi động quét các hợp đồng thuê đang mở.
- Với mỗi hợp đồng thuê, xác minh tiến trình gốc và thu thập các tiến trình con.
- Thu dọn các cây đã xác minh theo thứ tự tiến trình con trước.
- Cho hết hạn các hợp đồng thuê `closed` và `lost` cũ với một khoảng thời gian lưu giữ có giới hạn.
- Chỉ giữ việc quét dấu lệnh như một cơ chế dự phòng tạm thời cho dữ liệu cũ, được bảo vệ bằng
  thư mục gốc trình bao và phiên bản Gateway khi có thể.

### Giai đoạn 4: Các hàng quyền sở hữu phiên

- Thêm siêu dữ liệu quyền sở hữu vào các hàng phiên Gateway.
- Hướng dẫn ACPX, tác nhân phụ, tác vụ nền và các trình ghi kho phiên điền
  `ownerSessionKey` hoặc `spawnedBy`.
- Chuyển các lần kiểm tra khả năng hiển thị phiên sang sử dụng siêu dữ liệu hàng.
- Loại bỏ các truy vấn phụ `sessions.list({ spawnedBy })` tại thời điểm kiểm tra khả năng hiển thị.

### Giai đoạn 5: Loại bỏ phương pháp phỏng đoán cũ

Sau một chu kỳ phát hành:

- ngừng dựa vào các chuỗi lệnh gốc đã lưu cho quá trình dọn dẹp ACPX không phải dữ liệu cũ
- loại bỏ việc quét dấu lệnh khi khởi động
- loại bỏ các truy vấn danh sách dự phòng cho khả năng hiển thị
- giữ hành vi phòng vệ từ chối thực hiện để bảo đảm an toàn đối với các hợp đồng thuê bị thiếu hoặc không thể xác minh

## Kiểm thử

Thêm hai bộ kiểm thử điều khiển bằng bảng.

Trình mô phỏng vòng đời tiến trình:

- PID được tái sử dụng bởi tiến trình không liên quan
- PID được tái sử dụng bởi thư mục gốc trình bao của Gateway khác
- lệnh trình bao đã lưu được shell đặt dấu nháy, còn lệnh `ps` trực tiếp thì không
- tiến trình con bộ điều hợp thoát, tiến trình cháu vẫn còn trong nhóm tiến trình
- cơ chế dự phòng SIGTERM khi tiến trình cha chết chuyển đến SIGKILL
- không thể liệt kê tiến trình
- hợp đồng thuê cũ với tiến trình bị thiếu
- tiến trình mồ côi khi khởi động với trình bao, tiến trình con bộ điều hợp và tiến trình cháu

Ma trận khả năng hiển thị phiên:

- `self`, `tree`, `agent`, `all`
- a2a được bật và tắt
- hàng cùng tác nhân
- hàng liên tác nhân
- hàng ACP liên tác nhân được tạo thuộc sở hữu của bên yêu cầu
- bên yêu cầu trong sandbox bị giới hạn ở `tree`
- các thao tác liệt kê, lịch sử, gửi và trạng thái

Bất biến quan trọng: một phiên con được tạo thuộc sở hữu của bên yêu cầu sẽ hiển thị ở mọi nơi
mà khả năng hiển thị đã cấu hình bao gồm cây phiên của bên yêu cầu, và `all` không được
kém khả năng hơn `tree`.

## Ghi chú về khả năng tương thích

Các bản ghi phiên cũ có thể không có `leaseId`. Chúng nên dùng đường dẫn dọn dẹp cũ
từ chối thực hiện để bảo đảm an toàn:

- yêu cầu một tiến trình gốc đang hoạt động
- yêu cầu quyền sở hữu thư mục gốc trình bao khi dự kiến có trình bao được tạo
- yêu cầu lệnh khớp nhau đối với các gốc không phải trình bao
- không bao giờ gửi tín hiệu chỉ dựa trên siêu dữ liệu PID cũ đã lưu

Nếu không thể xác minh một bản ghi cũ, hãy để nguyên bản ghi đó. Quá trình dọn dẹp hợp đồng thuê khi khởi động và
chu kỳ phát hành tiếp theo cuối cùng sẽ loại bỏ cơ chế dự phòng này.

## Tiêu chí thành công

- Việc đóng một phiên ACPX cũ hoặc lỗi thời không thể kết thúc tiến trình của Gateway khác.
- Việc tiến trình cha chết không để lại các tiến trình cháu bộ điều hợp khó kết thúc vẫn đang chạy.
- `cancel` hủy lượt đang hoạt động mà không đóng các phiên có thể tái sử dụng.
- `sessions_list` có thể hiển thị các phiên ACP con liên tác nhân thuộc sở hữu của bên yêu cầu trong cả
  `tree` và `all`.
- Quá trình dọn dẹp khi khởi động được điều khiển bởi các hợp đồng thuê, không phải các lần quét chuỗi lệnh diện rộng.
- Các kiểm thử tập trung về tiến trình và ma trận khả năng hiển thị bao phủ mọi trường hợp biên
  trước đây cần các bản sửa lỗi đánh giá riêng lẻ.
