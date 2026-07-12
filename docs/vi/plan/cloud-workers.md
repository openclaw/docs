---
read_when:
    - Thiết kế hoặc triển khai việc cấp phát worker đám mây, chế độ worker hoặc chuyển giao phiên làm việc
    - Thay đổi environments.*, giao thức worker, quá trình nạp bản ghi hội thoại hoặc các RPC của proxy suy luận
    - Đánh giá mức độ bảo mật của việc thực thi tác tử từ xa
summary: Chạy các phiên tác nhân trên các máy tạm thời có thể truy cập qua SSH, với suy luận được ủy quyền qua Gateway và truyền phát trực tiếp trên thanh bên.
title: Kế hoạch worker đám mây
x-i18n:
    generated_at: "2026-07-12T08:05:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 134c3f6e486837607225d95d12a3153525b14237b362b9f9957313d9bc379dc4
    source_path: plan/cloud-workers.md
    workflow: 16
---

## Trạng thái

Đề xuất, bản sửa đổi 3. Chưa được triển khai. Hướng đi đã được thống nhất vào 2026-07; bản sửa đổi 2 đã tích hợp các phát hiện từ quá trình đánh giá đối kháng (giao thức worker chuyên dụng, máy trạng thái vị trí/môi trường, đồng bộ đầu vào có nhận biết git, bàn giao một chiều trong v1, cách diễn đạt về bảo mật đầu ra mạng có kiểm soát). Bản sửa đổi 3 chốt mô hình sở hữu đồng bộ (worker tạo commit, Gateway tiếp nhận và phát hành), bổ sung chế độ đồng bộ thuần không dùng git, sửa việc thực thi của worker thành đầy đủ trong phạm vi máy, chuyển chính sách internet sang thời điểm cấp phát và khôi phục việc điều phối tác nhân vào cột mốc 3.

## Vấn đề

Các phiên tác nhân OpenClaw chạy vòng lặp, công cụ và suy luận bên trong tiến trình Gateway trên một máy. Năng lực tính toán bị giới hạn bởi máy đó, các tác vụ dài chiếm dụng máy và công việc song song cạnh tranh tài nguyên. Các sản phẩm được lưu trữ (tác nhân đám mây Cursor, Claude Code trên web, Codex cloud) giải quyết vấn đề này bằng các sandbox đám mây tạm thời cho từng tác vụ, nhưng chúng yêu cầu hạ tầng và sự tin cậy vào nhà cung cấp.

Những người vận hành đã có máy dư (hoặc có thể thuê với chi phí thấp) không có cách nào để yêu cầu: chạy phiên này trên máy kia, hiển thị nó trong thanh bên của tôi như mọi phiên khác, rồi loại bỏ máy sau đó.

## Mục tiêu

- Chạy một phiên tác nhân đầy đủ (vòng lặp + công cụ) trên một máy từ xa tạm thời ("worker đám mây"), trong khi phiên xuất hiện và truyền trực tiếp trong giao diện điều khiển giống hệt một phiên cục bộ.
- Không có thông tin xác thực thường trực trên worker (không có xác thực nhà cung cấp, không có token nền tảng lưu trữ mã nguồn) và không có đầu ra mạng trực tiếp; máy chỉ cần một sshd có thể truy cập.
- Cấp phát, đồng bộ, chạy, thu thập, hủy — hoàn toàn tự động, có thể thay thế nhà cung cấp (nhà cung cấp đầu tiên: CLI thuê máy kiểu Crabbox).
- Điều phối công việc đang chạy từ Gateway sang worker tại ranh giới lượt mà không làm mất bản ghi hội thoại, danh tính phiên hoặc (khi các byte yêu cầu vẫn tương đương) tính liên tục của bộ nhớ đệm nhà cung cấp; kéo kết quả trở lại một cách an toàn.
- Cả con người (giao diện người dùng) và tác nhân (công cụ) đều có thể điều phối công việc sang worker đám mây.
- Hỗ trợ các phiên kéo dài nhiều ngày; thời gian tồn tại là chính sách, không phải giới hạn được mã hóa cứng.

## Ngoài phạm vi (v1)

- Không có bộ khung lập trình bên ngoài (Claude Code, Codex CLI) trên worker. Các phiên worker chỉ chạy trình thực thi nhúng của OpenClaw. Hỗ trợ bộ khung là tùy chọn tham gia trong v2 vì các bộ khung tự thực hiện suy luận bằng thông tin xác thực riêng.
- Không có phân nhánh nhiều lần thử tốt nhất trong N lần/song song.
- Không phụ thuộc VPN/tailnet. Chỉ dùng SSH làm phương thức truyền tải.
- Không có môi trường chạy sandbox mới. Máy worker là ranh giới cách ly; có thể bổ sung sandbox cấp hệ điều hành bên trong máy sau.
- Không có di chuyển trực tiếp đối xứng trong v1: điều phối theo chiều cục bộ → worker; chiều worker → cục bộ yêu cầu phiên đã dừng cùng với quá trình đối soát không gian làm việc đã hoàn tất. Việc bàn giao trực tiếp hai chiều sau này sẽ xây dựng trên cùng cơ chế hàng rào.
- Không có trạng thái phụ dạng JSON trên Gateway; trạng thái môi trường, vị trí, con trỏ và quyền cấp được lưu trong SQLite.

## Giải pháp tham khảo (những gì chúng ta sao chép, những gì chúng ta đảo ngược)

- Tác nhân đám mây Cursor: vòng lặp tác nhân chạy trong đám mây của họ; máy ảo là đích thực thi công cụ; kho hội thoại chỉ cho phép nối thêm được truyền đến mọi máy khách; khởi động nhanh từ ảnh chụp sau khi cài đặt; worker tự lưu trữ là các tiến trình worker chỉ kết nối ra ngoài. Chúng ta sao chép mô hình "nguồn dữ liệu chuẩn của hội thoại vẫn nằm trên bộ điều phối" và mô hình truyền trực tiếp; chúng ta đảo ngược vị trí vòng lặp (xem quyết định bên dưới).
- Codex cloud: môi trường chạy hai giai đoạn — giai đoạn thiết lập có mạng, sau đó là giai đoạn tác nhân ngoại tuyến với các bí mật đã bị loại bỏ; bộ nhớ đệm trạng thái vùng chứa để tăng tốc các lần tiếp theo. Chúng ta sao chép việc phân tách giai đoạn làm tư thế kiểm soát đầu ra mạng và ý tưởng bộ nhớ đệm cho ảnh khởi động nhanh trong v2.
- Claude Code trên web: máy ảo theo từng phiên; proxy git cách ly thông tin xác thực (token thực không bao giờ đi vào sandbox, thao tác đẩy bị giới hạn ở nhánh của phiên); ảnh chụp hệ thống tệp sau khi thiết lập; bàn giao dịch chuyển tức thời = nhánh đã đẩy + lịch sử được phát lại. Chúng ta sao chép việc cách ly thông tin xác thực và cách đóng khung bàn giao, nhưng đồng bộ đầu ra là rsync từ Gateway để cây làm việc chưa sạch vẫn hoạt động và không có token nền tảng lưu trữ mã nguồn nào ở gần máy.
- Tác nhân lập trình Copilot: mặc định từ chối đầu ra mạng với danh sách cho phép dành cho kho gói. Mặc định ở trạng thái ổn định của chúng ta nghiêm ngặt hơn (hoàn toàn không có đầu ra mạng trực tiếp) vì suy luận và tìm kiếm web đi qua đường hầm SSH — nhưng hãy xem phần Bảo mật để hiểu tại sao đây là "đầu ra mạng có kiểm soát", không phải "không có đầu ra mạng".

## Quyết định kiến trúc: vòng lặp trên worker, suy luận qua Gateway

Ba cách bố trí đã được xem xét:

1. Vòng lặp vẫn nằm trên Gateway, worker thực thi công cụ (mô hình Cursor). Miền lỗi an toàn nhất (bản ghi hội thoại, suy luận, phê duyệt và khôi phục sau khi khởi động lại đều ở cục bộ) và là cột mốc đầu tiên được người đánh giá ưu tiên. Bị bác bỏ với tư cách kiến trúc sản phẩm: các công cụ không phải `exec` của OpenClaw là các thao tác hệ thống tệp trong tiến trình, vì vậy mỗi lần đọc/chỉnh sửa/grep tệp sẽ trở thành một lượt khứ hồi qua mạng hoặc đòi hỏi tái cấu trúc diện tích công cụ lớn thành các RPC không gian làm việc cấp thô; hành vi môi trường chạy có nhiều lượt trao đổi và bị giới hạn bởi độ trễ. Chúng ta tái sử dụng tinh thần của mô hình này ở nơi nó đã được xây dựng (chuyển tải `exec` sang các Node) nhưng không xây dựng lớp điều khiển công cụ từ xa.
2. Cả vòng lặp và suy luận đều nằm trên worker. Miền lỗi đơn giản nhất, nhưng thông tin xác thực mô hình (bao gồm hồ sơ OAuth) phải được chuyển đến các máy dùng một lần, Gateway mất quyền kiểm soát chính sách/định tuyến/kiểm toán và việc di chuyển làm thay đổi danh tính gọi nhà cung cấp, khiến bộ nhớ đệm nhà cung cấp mất hiệu lực.
3. Vòng lặp + công cụ trên worker, các lệnh gọi mô hình được chuyển tiếp qua Gateway. Được chọn. Một lượt khứ hồi cho mỗi lượt mô hình thay vì mỗi lệnh gọi công cụ; công cụ chạy cạnh mã nguồn; Gateway vẫn là chủ sở hữu duy nhất của hồ sơ xác thực, định tuyến nhà cung cấp và chính sách; worker không giữ bí mật nào.

Chi phí của phương án 3 là phụ thuộc đồng bộ vào Gateway trong mỗi lượt mô hình, vì vậy các quy tắc về độ bền của nó là một phần của quyết định chứ không phải phần bổ sung sau này:

- Nếu mất Gateway giữa lượt, lệnh gọi nhà cung cấp đang hoạt động sẽ thất bại. Lượt được đánh dấu là thất bại và được thử lại dưới dạng lượt mới sau khi kết nối lại; không có phát lại trong suốt luồng nhà cung cấp đang thực hiện (nguy cơ tính phí hai lần/gọi công cụ hai lần).
- Mọi thao tác worker↔Gateway đều mang danh tính bền vững (xem Giao thức worker) để khi kết nối lại có thể tiếp tục hoặc truy xuất kết quả kết thúc đã lưu trong bộ nhớ đệm thay vì bị treo.
- Gateway là một thành phần được quản lý năng lực: giới hạn worker đồng thời, kiểm soát luồng và giảm tải nằm trong phạm vi v1 (xem Năng lực).

Vì Gateway vừa lưu bản ghi hội thoại vừa khởi tạo toàn bộ lưu lượng đến nhà cung cấp, phiên không phụ thuộc vị trí: việc di chuyển vòng lặp giữa Gateway và worker không thay đổi gì ở phía nhà cung cấp cũng như đường dẫn dữ liệu giao diện người dùng. Đây là yếu tố giúp việc điều phối và kéo trở lại có chi phí thấp.

## Thành phần

### 1. Máy trạng thái môi trường + hợp đồng nhà cung cấp

`environments.*` trong giao thức Gateway hiện chỉ là phép chiếu trạng thái. Phần lõi bền vững là bản ghi môi trường và máy trạng thái do SQLite sở hữu, được thiết kế trước các hình dạng RPC:

`requested → provisioning → bootstrapping → ready → (attached|idle) → draining → destroying → destroyed | failed | orphaned`

- Việc cấp phát an toàn khi gặp sự cố: hàng ý định được lưu bền vững trước lệnh gọi nhà cung cấp, cùng một mã thao tác xác định, để sau khi Gateway khởi động lại có thể tiếp nhận hợp đồng thuê đang thực hiện thay vì cấp phát hai lần hoặc bỏ rơi một máy trả phí.
- Đối soát sau khi khởi động lại và trình quét tài nguyên mồ côi (`inspect` của nhà cung cấp so với bản ghi cục bộ) là yêu cầu của v1, không phải biện pháp gia cố bổ sung.

Hợp đồng nhà cung cấp (do Plugin triển khai; không có tên nhà cung cấp hoặc chính sách trong phần lõi):

```ts
type WorkerProvider = {
  id: string;
  provision(profile: WorkerProfile, opId: string): Promise<WorkerLease>; // → ssh host/port/user/key material
  inspect(lease: { leaseId: string; profile: WorkerProfile }): Promise<LeaseStatus>; // adopt/health/orphan sweep
  renew?(leaseId: string): Promise<void>; // long-lived sessions vs provider TTLs
  destroy(lease: { leaseId: string; profile: WorkerProfile }): Promise<void>; // idempotent, returns only on proof of teardown
};
```

Các RPC: `environments.create`, `environments.destroy`, `environments.list/status` mở rộng (nhà cung cấp, mã hợp đồng thuê, trạng thái, tuổi, thời gian nhàn rỗi, các phiên được đính kèm). Các nhà cung cấp đầu tiên: trình bao bọc CLI thuê máy có hình dạng Crabbox (đường dẫn sản phẩm) và nhà cung cấp máy chủ SSH tĩnh được đánh dấu chỉ dành cho phát triển — worker trên máy chủ dùng chung có thể đọc dữ liệu không liên quan trên máy chủ, vì vậy máy chủ tĩnh dành cho phát triển tính năng, không phải tư thế mặc định.

### 2. Khởi tạo worker: cài đặt OpenClaw trên máy

Không có tạo phẩm worker chuyên biệt và không phụ thuộc vào khả năng truy cập npm:

- Cách cài đặt chuẩn cho mọi chế độ: gói worker có hàm băm nội dung do Gateway tạo ra (đầu ra bản dựng của chính Gateway được đóng gói dưới dạng tarball), được đẩy qua SSH và cài đặt trên máy. Theo thiết kế, cách này hỗ trợ cả bản dựng phát triển và commit chưa phát hành.
- `npm i -g openclaw@<exact gateway version>` là một tối ưu hóa khi Gateway chạy phiên bản đã phát hành; không bao giờ dùng `latest`.
- Quá trình khởi tạo có tính lũy đẳng; hợp đồng thuê đã khởi động sẵn với hàm băm gói trùng khớp sẽ bỏ qua cài đặt. Máy thô có thể cần giai đoạn chuỗi công cụ có mạng (môi trường chạy Node) — đây là một phần của giai đoạn thiết lập và sẽ được đóng lại sau đó.
- Bắt tay xác minh hàm băm bản dựng worker, tập tính năng giao thức và khả năng tương thích môi trường chạy. Các kiểm tra phiên bản/giao thức hiện có của Gateway không đủ cho việc này (các Node được tạo đường hầm qua SSH được miễn từ chối do phiên bản không khớp chính xác), vì vậy quy trình tiếp nhận worker thực hiện kiểm tra chính xác bản dựng riêng.

Chế độ worker (`openclaw worker`) là một điểm vào, không phải một nhánh rẽ: xử lý kết nối cùng với trình thực thi tác nhân nhúng, với khả năng lưu bền vững phiên và các lệnh gọi mô hình được hỗ trợ bởi RPC của Gateway. Chế độ này không được khởi động các bề mặt Gateway: không có kênh, không tự động khởi động Plugin ngoài bộ công cụ phiên, thư mục trạng thái dùng một lần, không có hồ sơ xác thực cục bộ.

### 3. Truyền tải: mọi thứ qua SSH

Gateway sở hữu kết nối; worker không yêu cầu gì ngoài sshd:

- Gateway mở kết nối SSH đến worker (thông tin xác thực từ hợp đồng thuê của nhà cung cấp, khóa máy chủ được ghim từ đầu ra cấp phát — không dùng `StrictHostKeyChecking=no`) và thiết lập đường hầm ngược chuyển tiếp một socket cục bộ của worker đến điểm cuối WS của Gateway.
- Lưu lượng điều khiển/mô hình và truyền không gian làm việc sử dụng các kết nối SSH riêng biệt với cùng vật liệu tin cậy đã ghim để rsync không thể chặn đầu hàng các luồng token.
- Vòng đời đường hầm (duy trì kết nối, kết nối lại với thời gian chờ tăng dần) thuộc quyền sở hữu của môi trường chạy môi trường trên Gateway. Một gián đoạn ngắn của đường hầm không hiển thị ở cấp phiên: trạng thái giao thức bền vững (bên dưới) cho phép worker đính kèm lại và tiếp tục.

### 4. Giao thức worker (chuyên dụng; không phải giao thức Node)

Đánh giá đối kháng với các điểm nối Node hiện tại đã loại trừ việc tái sử dụng trực tiếp: các lệnh gọi Node đang chờ là các promise cục bộ trong tiến trình và sẽ mất khi kết nối chấm dứt, khóa lũy đẳng của Node được phân tích nhưng không được loại bỏ trùng lặp, và — yếu tố quyết định — một Node đã kết nối có thể phát các sự kiện Node thông thường (bao gồm yêu cầu chạy tác nhân), vì vậy "loại Node + trần năng lực" không phải là ranh giới bảo mật đầu vào. Do đó, worker nhận vai trò `worker` đã xác thực với danh sách cho phép RPC/sự kiện đóng và có phiên bản; kết nối worker không thể truy cập bất kỳ trình xử lý sự kiện Node cũ nào.

Danh tính và thông tin xác thực: quá trình cấp phát tạo một thông tin xác thực worker ngắn hạn, được ràng buộc với mã môi trường, khóa worker, hàm băm gói, một phiên duy nhất được phép, tập RPC được phép và thời điểm hết hạn. Việc ghép cặp được xác minh bằng SSH vẫn áp dụng (chúng ta đã cấp phát máy và giữ khóa), nhưng quyền hạn đến từ thông tin xác thực được tạo, không phải từ bề mặt Node được khai báo.

Ngữ nghĩa thao tác bền vững (hình dạng mượn từ môi trường chạy ACP hiện có và sổ cái sự kiện của nó — định danh ổn định, tuần tự hóa theo từng phiên, phát lại bền vững `(session, seq)`):

- Mọi thao tác đều có phạm vi `(sessionId, lifecycleRevision, runId, ownerEpoch, streamKind, seq)`.
- Kỷ nguyên sở hữu ngăn chặn worker lỗi thời: worker thay thế tăng kỷ nguyên; kết quả đến muộn từ kỷ nguyên cũ bị từ chối theo cách xác định.
- Phân phối ít nhất một lần với con trỏ ACK được lưu bền vững và kết quả kết thúc được lưu trong bộ nhớ đệm SQLite; việc loại bỏ trùng lặp có tính xác định. Không cam kết chính xác một lần.
- Các khung tường minh dành cho hủy, đóng, tiếp tục và kết quả kết thúc; kiểm soát luồng dựa trên tín dụng/cửa sổ cho các luồng.
- Thương lượng tính năng giao thức độc lập với phiên bản giao thức Node chung.

### 5. RPC phần phụ trợ phiên

Hai hợp đồng riêng biệt — cơ sở mã hiện tại tách biệt các thay đổi bền vững đối với bản ghi hội thoại (do trình quản lý phiên sở hữu, cây JSONL với trạng thái cha/lá) khỏi các sự kiện trực tiếp cục bộ trong tiến trình (delta phát trực tuyến, vòng đời công cụ, phê duyệt), và giao thức worker phải duy trì sự phân tách đó:

- Ghi nhận bản ghi hội thoại bền vững: worker gửi các lô nối thêm theo ngữ nghĩa với `runEpoch` + thao tác so sánh-và-hoán đổi trên lá cơ sở; trình quản lý phiên của Gateway tạo id mục nhập và id cha. Worker không bao giờ được cung cấp các hàng bản ghi hội thoại đáng tin cậy, id mục nhập, id cha hoặc id phiên bên ngoài.
- Sự kiện trực tiếp có thể phát lại: một hợp kiểu sự kiện được định kiểu với số thứ tự của worker, ACK từ Gateway, thời gian lưu giữ có giới hạn và cơ chế rào chắn sự kiện đến muộn, cung cấp dữ liệu cho luồng phân phối sự kiện tác tử hiện có để chế độ xem trò chuyện, các hàng công cụ và logic chưa đọc/trạng thái hoạt động giống hệt các phiên cục bộ.

Proxy suy luận: tái sử dụng bộ thuật ngữ sự kiện của trình khách luồng proxy thời gian chạy hiện có (`src/agents/runtime/proxy.ts`) nhưng di chuyển ranh giới tin cậy. Worker chỉ gửi danh tính phiên/lượt chạy, tham chiếu mô hình đã được phê duyệt, ngữ cảnh và các tùy chọn sinh bị giới hạn; Gateway phân giải nhà cung cấp, điểm cuối, xác thực, tiêu đề, định tuyến và chính sách chi phí từ danh mục riêng. Đối tượng mô hình do worker cung cấp (ví dụ: `baseUrl` do kẻ tấn công kiểm soát) sẽ bị từ chối. Áp dụng giới hạn kích thước yêu cầu, hủy bỏ, kiểm toán và phát lại kết quả cuối. Các công cụ thường trú trên Gateway (websearch) thực thi trên Gateway và trả về kết quả qua cùng một kênh.

### 6. Đồng bộ không gian làm việc

Điểm neo đồng bộ là một không gian làm việc cục bộ trên Gateway có quyền sở hữu vị trí độc quyền: với không gian làm việc git, dùng một worktree chuyên dụng được quản lý (siêu dữ liệu worktree được quản lý hiện có — nhánh, cơ sở, quyền sở hữu ảnh chụp — là nền tảng); với không gian làm việc không dùng git, dùng một thư mục đích do Gateway sở hữu. Tuyệt đối không dùng checkout đang hoạt động của người dùng. Quyền sở hữu độc quyền trong khi phiên được bố trí từ xa giúp đồng bộ vào không xung đột ngay từ thiết kế.

Phân chia quyền sở hữu — commit và phát hành:

- Tác tử phía worker tạo commit bình thường trong bản sao của nó (`git commit` là thao tác cục bộ, không cần thông tin xác thực; danh tính tác giả được chiếu từ cấu hình Gateway). Các commit đó là những đối tượng bất hoạt cho đến khi Gateway tiếp nhận chúng.
- Gateway thực hiện mọi việc yêu cầu sự tin cậy: xác minh các commit đi vào được xây dựng trên cơ sở đã ghi nhận, tua tiến worktree cục bộ, push, tạo PR và tùy chọn ký/ký lại — tất cả bằng thông tin xác thực cục bộ của Gateway. Worker không bao giờ nắm giữ thông tin xác thực git hoặc forge và không bao giờ truy cập remote.

Hai chế độ đồng bộ, được chọn dựa trên việc không gian làm việc có phải là kho lưu trữ git hay không:

- Chế độ git. Chiều ra: dùng rsync cho worktree (bao gồm các tệp chưa commit và tệp chưa được theo dõi đủ điều kiện; cơ chế bao gồm/loại trừ kiểu crabbox, tôn trọng `.worktreeinclude`) qua danh tính SSH của đường hầm, được ghi nhận thành một bản kê cơ sở bất biến (hàm băm nội dung + commit cơ sở). Chiều vào: các commit mới trở về dưới dạng git bundle hoặc tham chiếu tạm thời dựa trên cơ sở đã ghi nhận; các thành phần tạo tác chưa được theo dõi trở về qua một bản kê tường minh với kiểm tra kích thước/kiểu/giới hạn symlink. Quá trình tiếp nhận xác minh quan hệ tổ tiên của cơ sở và dừng khi có phân kỳ — không có gì âm thầm ghi đè lên bất kỳ phía nào. Việc xóa, đổi tên, submodule và symlink thoát phạm vi được xử lý bằng các quy tắc bản kê, không phải phương pháp phỏng đoán của rsync.
- Chế độ thuần (không có git — ví dụ: xây dựng một dự án từ đầu trên máy). Chiều ra sử dụng cùng cơ chế rsync + bản kê cơ sở. Chiều vào là một bản sao phản chiếu được so sánh khác biệt theo bản kê trở lại thư mục đích do Gateway sở hữu, có lan truyền thao tác xóa. An toàn vì cùng lý do với chế độ git: quyền sở hữu độc quyền đồng nghĩa không có chỉnh sửa cục bộ đồng thời gây xung đột; bản kê cơ sở vẫn phát hiện độ lệch cục bộ ngoài dự kiến và dừng thay vì ghi đè.

Tạo điểm kiểm tra bảo vệ các phiên kéo dài nhiều ngày khỏi mất lease: các điểm kiểm tra chiều vào định kỳ (commit nhánh phiên ở chế độ git, ảnh chụp bản kê ở chế độ thuần); nhịp độ là chính sách hồ sơ (mặc định dựa trên lượt).

### 7. Máy trạng thái bố trí, phiên và giao diện người dùng

Bố trí thời gian chạy là một máy trạng thái do SQLite sở hữu, được gắn khóa với phiên, không phải một cặp trường hàng rời rạc:

`local → requested → provisioning → syncing → starting → active(worker) → draining → reconciling → local | reclaimed | failed`

Nó lưu bền vững id môi trường, thế hệ chuyển đổi, epoch của chủ sở hữu đang hoạt động, bản kê cơ sở không gian làm việc, hàm băm bundle của worker và các con trỏ ACK gần nhất. Việc tiếp nhận lượt xác nhận bố trí theo cách nguyên tử trước khi một trong hai vòng lặp bắt đầu một lượt, vì vậy một tin nhắn cục bộ được tiếp nhận dựa trên ảnh chụp lỗi thời không bao giờ có thể chạy đua với lượt của worker — tại mọi thời điểm, chỉ đúng một vòng lặp sở hữu phiên.

Giao diện người dùng:

- Phiên worker là một hàng phiên thông thường cộng với siêu dữ liệu bố trí. Phiên nằm trong kho lưu trữ thông thường, được liệt kê qua `sessions.list`, phát trực tuyến qua các đăng ký hiện có — thanh bên và trò chuyện không cần đường dẫn dữ liệu mới, chỉ cần phần trình bày: huy hiệu worker và trạng thái bố trí/môi trường (`provisioning / syncing / running / idle / reconciling / reclaimed`).
- Trải nghiệm tạo: thanh đích phiên (thiết kế lại thanh bên phiên) có thêm đích worker đám mây bên cạnh Gateway và Node. Yêu cầu hồ sơ nhà cung cấp đã được cấu hình; tính năng này không hiển thị cho đến khi được cấu hình.
- Điều phối tác tử: một công cụ phiên cho phép tác tử bàn giao công việc cho worker đám mây giống như con người thực hiện (phiên con dựa trên worker, theo kiểu tác tử con). Phát hành trong cùng mốc với điều phối của con người, được kiểm soát bởi cùng cấu hình nhà cung cấp chọn tham gia. Đệ quy được giới hạn về mặt cấu trúc (các phiên worker không thể tự điều phối worker trong v1); kiểm soát chi tiêu dùng cơ chế hạch toán/kiểm toán theo môi trường, không phải cơ chế hạn ngạch.

## Điều phối và bàn giao

v1 cố ý bất đối xứng:

- Cục bộ → worker (điều phối): vượt qua rào cản di chuyển bên dưới, cấp phát hoặc tái sử dụng worker, đồng bộ, chuyển bố trí, lượt tiếp theo thực thi từ xa.
- Worker → cục bộ (kéo về): dừng phiên (rút worker theo cùng rào cản), hoàn tất đối soát chiều vào, chuyển bố trí sang cục bộ. Đây không phải di chuyển trực tiếp.
- Bàn giao trực tiếp đối xứng (di chuyển một phiên đang hoạt động theo cả hai hướng mà không dừng) tái sử dụng cùng cơ chế rào cản và đối soát, rồi phát hành sau khi các kiểm thử chèn lỗi chứng minh được rào cản.

Rào cản di chuyển (chỉ “ranh giới lượt” là không đủ — phê duyệt, tiến trình nền và hợp nhất bản ghi hội thoại sau khi nhả khóa có thể kéo dài qua ranh giới này):

1. Dừng tiếp nhận lượt mới (xác nhận bố trí).
2. Hủy hoặc rút các lượt chạy đang hoạt động.
3. Thu hồi các phê duyệt exec và quyền cấp thực thi đang chờ.
4. Rút các ghi phụ vào bản ghi hội thoại và ACK sự kiện trực tiếp.
5. Chấm dứt các tiến trình con của worker.
6. Rào chắn chủ sở hữu cũ bằng cách tăng epoch chủ sở hữu.
7. Đối soát không gian làm việc (chiều vào, có nhận biết xung đột).
8. Kích hoạt chủ sở hữu mới.

Tính liên kết bộ nhớ đệm: vì các yêu cầu nhà cung cấp bắt nguồn từ Gateway trong cả hai vị trí bố trí, tính liên kết bộ nhớ đệm được duy trì khi yêu cầu nhà cung cấp đã tuần tự hóa vẫn tương đương — cùng thứ tự công cụ, chỉ dẫn hệ thống, trình bao bọc nhà cung cấp và siêu dữ liệu bộ nhớ đệm (vẫn nằm phía Gateway). Đây là thuộc tính có thể kiểm thử, không phải giả định: các kiểm thử tương đương theo byte giữa bố trí cục bộ/worker cho từng phương thức truyền tải nhà cung cấp được hỗ trợ là một phần của mốc giới thiệu vòng lặp worker.

## Mô hình bảo mật

Phát biểu chính xác: worker không có lưu lượng mạng trực tiếp đi ra và không có thông tin xác thực nhà cung cấp/forge thường trực. Đây không phải là “không có lưu lượng đi ra” — suy luận và các công cụ thực thi trên Gateway là những kênh lưu lượng đi ra được kiểm soát (worker bị tiêm prompt vẫn có thể đưa các byte của không gian làm việc vào ngữ cảnh mô hình hoặc truy vấn websearch). Theo đó:

- Hạch toán lưu lượng đi ra được kiểm soát: kiểm toán theo môi trường và hạch toán hiển thị cho người vận hành trên proxy suy luận và các công cụ Gateway. Giới hạn tốc độ/byte tồn tại dưới dạng kiểm soát luồng giao thức (dung lượng), không phải cơ chế hạn ngạch chi tiêu.
- Lưu lượng vào từ worker đến Gateway là danh sách cho phép khép kín của giao thức worker; các thao tác ghi bản ghi hội thoại bị giới hạn về mặt cấu trúc (id do Gateway tạo, một phiên duy nhất đã liên kết).
- Exec của worker có toàn quyền bên trong máy. Máy có thể bị hủy bỏ và không chứa thông tin xác thực, vì vậy phê duyệt theo từng lệnh chỉ gây thêm trở ngại mà không bảo vệ được gì; ranh giới được bảo vệ là đối soát chiều vào và kiểm toán. Exec không bao giờ đi qua đường dẫn phê duyệt Node của Gateway.
- Chính sách Internet là quyết định của nhà cung cấp tại thời điểm cấp phát: hồ sơ môi trường quyết định khi tạo máy (tường lửa/nhóm bảo mật/mạng không có lưu lượng đi ra), có thể kèm một giai đoạn thiết lập có mạng mà nhà cung cấp đóng lại trước giai đoạn tác tử. Phần lõi không triển khai nút chuyển mạng trong thời gian chạy.
- Vệ sinh máy tại thời điểm cấp phát: điểm cuối siêu dữ liệu đám mây bị chặn hoặc được xác minh là không tồn tại, không có hồ sơ phiên bản, không kế thừa tác tử SSH, không có socket Docker, môi trường/thư mục chính sạch. Khóa máy chủ SSH được ghim từ đầu ra cấp phát.
- Phê duyệt và chính sách cho mọi hoạt động phía Gateway (push, PR, lệnh gọi nhà cung cấp) tiếp tục chạy trên Gateway.

Phạm vi ảnh hưởng của một phiên worker bị xâm phạm: bản sao không gian làm việc đã đồng bộ cộng với những gì các kênh proxy được kiểm toán cho phép — không có thông tin xác thực, không có mạng trực tiếp, không có bề mặt Gateway ngoài danh sách cho phép.

## Dung lượng

Gateway chuyển tiếp mọi prompt và luồng token cho N worker, vì vậy v1 nêu rõ mô hình dung lượng thay vì chỉ phát hiện khi vận hành thực tế: giới hạn worker đồng thời trên mỗi Gateway, cửa sổ tín dụng theo luồng (hàng đợi luồng sự kiện hiện tại không bị giới hạn và ngưỡng bộ đệm socket của Node buộc đóng các trình tiêu thụ chậm — cả hai đều không phù hợp nếu giữ nguyên), bộ đệm đĩa có giới hạn cho các đợt tăng đột biến và giảm tải với trạng thái áp lực ngược hiển thị trong giao diện người dùng. Việc truyền không gian làm việc vẫn sử dụng kênh SSH riêng.

## Vòng đời

- Tự động dừng khi nhàn rỗi và TTL là chính sách hồ sơ nhà cung cấp, không phải hằng số cố định. Giá trị mặc định rộng rãi với cơ chế duy trì hoạt động tường minh; công việc kéo dài nhiều ngày là trường hợp được hỗ trợ ưu tiên (nhà cung cấp có `renew` cho các backend dựa trên lease); phiên có lượt đang xử lý hoặc hoạt động gần đây không bao giờ bị thu hồi.
- Khi worker chết hoặc bị thu hồi: bố trí chuyển sang `reclaimed`, hàng phiên vẫn còn, tin nhắn tiếp theo cấp phát worker mới và đồng bộ lại từ điểm kiểm tra gần nhất. Hội thoại không bao giờ mất (kho lưu trữ phía Gateway); các thay đổi không gian làm việc kể từ điểm kiểm tra gần nhất sẽ mất và giao diện người dùng thông báo rõ điều đó.
- Tái sử dụng lease ấm ngay từ ngày đầu tiên (đối với các nhà cung cấp hỗ trợ); ảnh chụp image sau bootstrap là đường dẫn khởi động nhanh của v2.

## Bề mặt cấu hình

Tối thiểu và chọn tham gia: một khối hồ sơ nhà cung cấp (id nhà cung cấp, tham chiếu thông tin xác thực/CLI, quy tắc đồng bộ, chính sách vòng đời, ngân sách, giai đoạn thiết lập tùy chọn) cộng với lựa chọn bố trí theo phiên. Không có biến môi trường mới. Các bản cài đặt chưa cấu hình sẽ không thấy gì.

## Các mốc

Việc triển khai được đưa vào dưới dạng các PR nhỏ, có thể hợp nhất độc lập; mỗi mốc bên dưới là một chuỗi PR, không phải một thay đổi duy nhất.

1. Nền tảng: máy trạng thái môi trường + hợp đồng nhà cung cấp + nhà cung cấp theo cấu trúc crabbox (static-SSH làm bộ khung phát triển), bootstrap bundle của worker + bắt tay tiếp nhận, đường hầm SSH + ghim khóa máy chủ, ảnh chụp worktree được quản lý + đồng bộ chiều ra (chế độ git + thuần). Quét phần mồ côi + tiếp nhận sau khi khởi động lại.
2. Giao thức worker + vòng lặp worker: vai trò worker đã xác thực, các thao tác/epoch/con trỏ ACK bền vững, hợp đồng ghi nhận bản ghi hội thoại + sự kiện trực tiếp, proxy suy luận với mô hình do Gateway phân giải, kiểm soát luồng. Một nhà cung cấp, chỉ điều phối phiên mới bởi con người, không bàn giao. Các kiểm thử chèn lỗi (phân vùng đường hầm, Gateway khởi động lại, worker chết) là điều kiện hoàn thành.
3. Điều phối + kéo về + điều phối tác tử: rào cản di chuyển, máy trạng thái bố trí được nối với thanh đích giao diện người dùng, đối soát chiều vào + điểm kiểm tra, kiểm toán theo môi trường, giới hạn dung lượng, công cụ điều phối tác tử (các phiên worker không thể đệ quy). Các kiểm thử tương đương theo byte của bộ nhớ đệm prompt.
4. Bàn giao trực tiếp đối xứng, sau khi có bằng chứng kiểm thử chèn lỗi của mốc 3.

Sau này: các bộ khung ACP trên worker dưới dạng tùy chọn tham gia nạp thông tin xác thực theo môi trường; khởi động nhanh bằng ảnh chụp/image ấm; phân phối song song (N lease, cùng prompt); sandbox hệ điều hành trong máy; thu thập thành phần tạo tác phong phú hơn qua lược đồ thành phần tạo tác.

## Câu hỏi mở

- Khả năng sử dụng Plugin/skill trên các worker: các skill đi kèm kho lưu trữ được đồng bộ miễn phí cùng không gian làm việc; các skill/Plugin của tác tử được cấu hình qua Gateway cần có quyết định rõ ràng về việc đồng bộ hoặc loại trừ (trong cả hai trường hợp, tệp kê khai công cụ/Plugin đều là một phần của quy trình bắt tay tiếp nhận).
- Nhịp tạo điểm kiểm tra mặc định: theo lượt hay theo thời gian đối với các phiên có lượng trò chuyện rất lớn.
- Cách các hồ sơ môi trường tương tác với định tuyến đa tác tử (hồ sơ mặc định theo từng tác tử hay chỉ lựa chọn theo từng phiên).
