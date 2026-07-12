---
read_when:
    - Bạn muốn hiểu toàn bộ quy trình OAuth của OpenClaw từ đầu đến cuối
    - Bạn gặp sự cố token bị vô hiệu hóa / bị đăng xuất
    - Bạn muốn sử dụng Claude CLI hoặc các luồng xác thực OAuth
    - Bạn muốn sử dụng nhiều tài khoản hoặc định tuyến hồ sơ
summary: 'OAuth trong OpenClaw: trao đổi token, lưu trữ và các mô hình đa tài khoản'
title: OAuth
x-i18n:
    generated_at: "2026-07-12T07:54:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 51aa98a9cb9614107ce979eca235c175a1748df2facdded852cd8899cebba22c
    source_path: concepts/oauth.md
    workflow: 16
---

OpenClaw hỗ trợ OAuth ("xác thực bằng gói thuê bao") cho các nhà cung cấp có cung cấp phương thức này,
đáng chú ý là **OpenAI Codex (ChatGPT OAuth)** và **tái sử dụng Anthropic Claude CLI**.
Đối với Anthropic, cách phân chia thực tế là:

- **Khóa API Anthropic**: thanh toán API Anthropic thông thường.
- **Anthropic Claude CLI / xác thực bằng gói thuê bao bên trong OpenClaw**: nhân viên Anthropic
  đã thông báo với chúng tôi rằng cách sử dụng này lại được cho phép, vì vậy OpenClaw xem việc tái sử dụng Claude CLI và
  sử dụng `claude -p` là được chấp thuận cho tích hợp này, trừ khi Anthropic
  công bố chính sách mới. Khi dùng Anthropic trong môi trường sản xuất, xác thực bằng khóa API vẫn
  là phương án an toàn hơn và được khuyến nghị.

OpenClaw lưu cả xác thực bằng khóa API OpenAI và ChatGPT/Codex OAuth dưới
ID nhà cung cấp chuẩn `openai`. Các ID hồ sơ `openai-codex:*` cũ và
mục `auth.order.openai-codex` là trạng thái cũ được
`openclaw doctor --fix` sửa chữa; hãy sử dụng ID hồ sơ `openai:*` và `auth.order.openai` cho
cấu hình mới.

Trang này trình bày:

- cách **trao đổi mã thông báo** OAuth hoạt động (PKCE)
- nơi **lưu trữ** mã thông báo (và lý do)
- cách xử lý **nhiều tài khoản** (hồ sơ + ghi đè theo phiên)

Các Plugin nhà cung cấp có quy trình OAuth hoặc khóa API riêng đều chạy qua
cùng một điểm vào:

```bash
openclaw models auth login --provider <id>
```

## Nơi tiếp nhận mã thông báo (lý do tồn tại)

Các nhà cung cấp OAuth thường tạo mã thông báo làm mới mới sau mỗi lần đăng nhập/làm mới.
Một số nhà cung cấp vô hiệu hóa mã thông báo làm mới trước đó khi một mã mới được
cấp cho cùng người dùng/ứng dụng. Biểu hiện thực tế: đăng nhập qua cả OpenClaw _và_
Claude Code / Codex CLI, rồi sau đó một trong hai bị đăng xuất ngẫu nhiên.

Để giảm tình trạng này, OpenClaw xem kho hồ sơ xác thực là một **nơi tiếp nhận mã thông báo**:

- môi trường chạy đọc thông tin xác thực từ một nơi cho mỗi tác nhân
- nhiều hồ sơ có thể cùng tồn tại và được định tuyến theo cách xác định
- việc tái sử dụng CLI bên ngoài phụ thuộc vào từng nhà cung cấp: sau khi OpenClaw sở hữu một hồ sơ OAuth
  cục bộ cho một nhà cung cấp, mã thông báo làm mới cục bộ là dữ liệu chuẩn. Nếu mã thông báo làm mới
  cục bộ đó bị từ chối, OpenClaw báo cáo hồ sơ cần
  xác thực lại thay vì dự phòng bằng dữ liệu mã thông báo từ CLI bên ngoài.
  Việc khởi tạo từ Codex CLI còn giới hạn hơn: nó chỉ có thể điền dữ liệu ban đầu vào một hồ sơ trống
  kiểu `openai:default` trước khi OpenClaw sở hữu OAuth cho nhà cung cấp đó;
  sau thời điểm này, các lần làm mới do OpenClaw sở hữu vẫn là dữ liệu chuẩn
- các đường dẫn trạng thái/khởi động giới hạn việc phát hiện CLI bên ngoài trong tập hợp nhà cung cấp
  đã được cấu hình, vì vậy kho đăng nhập của một CLI không liên quan sẽ không bị thăm dò đối với
  thiết lập chỉ có một nhà cung cấp

## Lưu trữ (nơi chứa mã thông báo)

Các bí mật được lưu riêng theo từng tác nhân, với tên logic `auth-profiles.json` (kho
bên dưới là cơ sở dữ liệu SQLite của tác nhân; tên JSON được giữ lại để
tương thích và hiển thị trong công cụ):

- Hồ sơ xác thực (OAuth + khóa API + tham chiếu tùy chọn ở cấp giá trị):
  `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Tệp tương thích cũ: `~/.openclaw/agents/<agentId>/agent/auth.json`
  (các mục `api_key` tĩnh sẽ bị xóa khi được phát hiện)

Tệp cũ chỉ dùng để nhập (vẫn được hỗ trợ nhưng không phải kho chính):

- `~/.openclaw/credentials/oauth.json` (được nhập vào kho hồ sơ xác thực trong lần sử dụng đầu tiên)

Tất cả các đường dẫn trên cũng tuân theo `$OPENCLAW_STATE_DIR` (ghi đè thư mục trạng thái). Tài liệu tham khảo đầy đủ: [/gateway/configuration-reference#auth-storage](/vi/gateway/configuration-reference#auth-storage)

Để biết hành vi kích hoạt ảnh chụp nhanh môi trường chạy và tham chiếu bí mật tĩnh, hãy xem [Quản lý bí mật](/vi/gateway/secrets).

Khi một tác nhân phụ không có hồ sơ xác thực cục bộ, OpenClaw sử dụng cơ chế kế thừa
đọc xuyên từ kho của tác nhân mặc định/chính; hệ thống không sao chép kho của tác nhân chính
khi đọc. Mã thông báo làm mới OAuth đặc biệt nhạy cảm: các quy trình sao chép thông thường
mặc định bỏ qua chúng vì một số nhà cung cấp luân chuyển hoặc vô hiệu hóa
mã thông báo làm mới sau khi sử dụng. Hãy cấu hình một lần đăng nhập OAuth riêng cho tác nhân khi
tác nhân đó cần một tài khoản độc lập.

## Tái sử dụng Anthropic Claude CLI

OpenClaw hỗ trợ tái sử dụng Anthropic Claude CLI và `claude -p` như một
phương thức xác thực được chấp thuận. Nếu máy chủ đã có phiên đăng nhập Claude cục bộ,
quy trình tiếp nhận/cấu hình có thể trực tiếp tái sử dụng phiên đó. Mã thông báo thiết lập Anthropic vẫn
khả dụng như một phương thức xác thực bằng mã thông báo được hỗ trợ, nhưng OpenClaw ưu tiên tái sử dụng Claude CLI
khi phương thức này khả dụng.

<Warning>
Tài liệu Claude Code công khai của Anthropic cho biết việc sử dụng trực tiếp Claude Code vẫn nằm trong
giới hạn gói thuê bao Claude, và nhân viên Anthropic đã thông báo với chúng tôi rằng kiểu sử dụng Claude
CLI như OpenClaw lại được cho phép. Do đó, OpenClaw xem việc tái sử dụng Claude CLI và
sử dụng `claude -p` là được chấp thuận cho tích hợp này, trừ khi Anthropic
công bố chính sách mới.

Để xem tài liệu hiện tại của Anthropic về các gói dùng trực tiếp Claude Code, hãy xem [Sử dụng Claude Code
với gói Pro hoặc Max của
bạn](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
và [Sử dụng Claude Code với gói Team hoặc Enterprise của
bạn](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/).

Nếu bạn muốn các tùy chọn kiểu gói thuê bao khác trong OpenClaw, hãy xem [OpenAI
Codex](/vi/providers/openai), [Gói lập trình Qwen Cloud
](/vi/providers/qwen), [Gói lập trình MiniMax](/vi/providers/minimax),
và [Gói lập trình Z.AI / GLM](/vi/providers/zai).
</Warning>

## Trao đổi OAuth (cách đăng nhập hoạt động)

Các quy trình đăng nhập tương tác của OpenClaw được triển khai trong `openclaw/plugin-sdk/llm.ts` và kết nối với các trình hướng dẫn/lệnh.

### Mã thông báo thiết lập Anthropic

Cấu trúc quy trình:

1. bắt đầu quy trình mã thông báo thiết lập hoặc dán mã thông báo Anthropic từ OpenClaw
2. OpenClaw lưu thông tin xác thực Anthropic thu được vào một hồ sơ xác thực
3. lựa chọn mô hình vẫn là `anthropic/...`
4. các hồ sơ xác thực Anthropic hiện có vẫn khả dụng để quay lui/kiểm soát thứ tự

### OpenAI Codex (ChatGPT OAuth)

OpenAI Codex OAuth được hỗ trợ rõ ràng để sử dụng bên ngoài Codex CLI, bao gồm các quy trình làm việc của OpenClaw.

Lệnh đăng nhập sử dụng ID nhà cung cấp OpenAI chuẩn:

```bash
openclaw models auth login --provider openai
```

Sử dụng `--profile-id openai:<name>` cho nhiều tài khoản ChatGPT/Codex OAuth trong
một tác nhân. Không sử dụng `openai-codex:<name>` cho hồ sơ mới. Doctor di chuyển
tiền tố cũ đó sang một ID hồ sơ `openai:*` không xung đột; hãy chạy
`openclaw models auth list --provider openai` sau khi sửa chữa, trước khi sao chép
ID hồ sơ vào `auth.order` hoặc `/model ...@<profileId>`.

Cấu trúc quy trình (PKCE):

1. tạo bộ xác minh/thử thách PKCE và một `state` ngẫu nhiên
2. mở `https://auth.openai.com/oauth/authorize?...` (phạm vi
   `openid profile email offline_access`)
3. thử nhận lệnh gọi lại tại `http://localhost:1455/auth/callback` (máy chủ
   gọi lại mặc định là `localhost` và chỉ chấp nhận các máy chủ local loopback;
   ghi đè bằng `OPENCLAW_OAUTH_CALLBACK_HOST`)
4. nếu bạn có thể dán mã trước khi lệnh gọi lại đến (hoặc đang ở môi trường
   từ xa/không giao diện và không thể liên kết lệnh gọi lại), hãy dán URL chuyển hướng/mã
   thay thế — thao tác dán thủ công sẽ chạy đua với lệnh gọi lại từ trình duyệt và thao tác nào hoàn tất
   trước sẽ thắng
5. trao đổi mã tại `https://auth.openai.com/oauth/token`
6. trích xuất `accountId` từ mã thông báo truy cập và lưu `{ access, refresh, expires, accountId }`

Đường dẫn trình hướng dẫn là `openclaw onboard` → lựa chọn xác thực `openai`.

## Làm mới + hết hạn

Các hồ sơ lưu dấu thời gian `expires`. Trong môi trường chạy:

- nếu `expires` nằm trong tương lai, sử dụng mã thông báo truy cập đã lưu
- nếu đã hết hạn, làm mới (dưới khóa tệp) và ghi đè thông tin xác thực đã lưu
- nếu một tác nhân phụ đọc hồ sơ OAuth được kế thừa từ tác nhân chính, thao tác
  làm mới sẽ ghi ngược vào kho của tác nhân chính thay vì sao chép mã thông báo làm mới
  vào kho của tác nhân phụ
- thông tin xác thực CLI được quản lý bên ngoài (Claude CLI, khởi tạo Codex CLI có giới hạn;
  xem [Nơi tiếp nhận mã thông báo](#the-token-sink-why-it-exists)) sẽ được đọc lại thay vì
  sử dụng một mã thông báo làm mới đã sao chép. Nếu quá trình làm mới được quản lý thất bại, OpenClaw
  báo cáo hồ sơ bị ảnh hưởng cần xác thực lại thay vì trả về
  dữ liệu mã thông báo từ CLI bên ngoài.

Quy trình làm mới diễn ra tự động; thông thường bạn không cần quản lý mã thông báo theo cách thủ công.

## Nhiều tài khoản (hồ sơ) + định tuyến

Hai mô hình:

### 1) Khuyến nghị: các tác nhân riêng biệt

Nếu bạn muốn tài khoản "cá nhân" và "công việc" không bao giờ tương tác, hãy sử dụng các tác nhân tách biệt (phiên + thông tin xác thực + không gian làm việc riêng):

```bash
openclaw agents add work
openclaw agents add personal
```

Sau đó cấu hình xác thực cho từng tác nhân (trình hướng dẫn) và định tuyến cuộc trò chuyện đến đúng tác nhân.

### 2) Nâng cao: nhiều hồ sơ trong một tác nhân

Kho hồ sơ xác thực hỗ trợ nhiều ID hồ sơ cho cùng một nhà cung cấp.
Chọn hồ sơ sẽ được sử dụng:

- trên toàn cục thông qua thứ tự cấu hình (`auth.order`)
- theo từng phiên thông qua `/model ...@<profileId>`

Ví dụ (ghi đè phiên):

- `/model Opus@anthropic:work`

Liệt kê các ID hồ sơ hiện có bằng:

```bash
openclaw models auth list --provider <id>
```

Tài liệu liên quan:

- [Chuyển đổi dự phòng mô hình](/vi/concepts/model-failover) (quy tắc luân chuyển + thời gian chờ)
- [Lệnh dấu gạch chéo](/vi/tools/slash-commands) (bề mặt lệnh)

## Liên quan

- [Xác thực](/vi/gateway/authentication) - tổng quan về xác thực nhà cung cấp mô hình
- [Bí mật](/vi/gateway/secrets) - lưu trữ thông tin xác thực và SecretRef
- [Tài liệu tham khảo cấu hình](/vi/gateway/configuration-reference#auth-storage) - các khóa cấu hình xác thực
