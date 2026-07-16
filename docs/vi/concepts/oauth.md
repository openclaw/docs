---
read_when:
    - Bạn muốn hiểu toàn bộ quy trình OAuth của OpenClaw từ đầu đến cuối
    - Bạn gặp sự cố token bị vô hiệu hóa / bị đăng xuất
    - Bạn muốn sử dụng luồng xác thực Claude CLI hoặc OAuth
    - Bạn muốn sử dụng nhiều tài khoản hoặc định tuyến theo hồ sơ
summary: 'OAuth trong OpenClaw: trao đổi token, lưu trữ và các mẫu hình đa tài khoản'
title: OAuth
x-i18n:
    generated_at: "2026-07-16T15:10:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 3ef94af0601b7d57bb7e2d53c3d8231708b401251eca7dc1bb1e7e4fc09b46da
    source_path: concepts/oauth.md
    workflow: 16
---

OpenClaw hỗ trợ OAuth ("xác thực thuê bao") cho các nhà cung cấp có cung cấp phương thức này,
đáng chú ý là **OpenAI Codex (ChatGPT OAuth)** và **tái sử dụng Anthropic Claude CLI**.
Đối với Anthropic, cách phân chia thực tế là:

- **Khóa API Anthropic**: thanh toán API Anthropic thông thường.
- **Anthropic Claude CLI / xác thực thuê bao bên trong OpenClaw**: nhân viên Anthropic
  đã cho chúng tôi biết rằng cách sử dụng này lại được phép, vì vậy OpenClaw coi việc tái sử dụng Claude CLI và
  sử dụng `claude -p` là được chấp thuận cho tích hợp này, trừ khi Anthropic
  công bố chính sách mới. Đối với Anthropic trong môi trường sản xuất, xác thực bằng khóa API vẫn là
  phương thức được khuyến nghị an toàn hơn.

OpenClaw lưu cả xác thực bằng khóa API OpenAI và ChatGPT/Codex OAuth dưới
ID nhà cung cấp chuẩn `openai`. Các ID hồ sơ `openai-codex:*` và
mục `auth.order.openai-codex` cũ là trạng thái kế thừa được
`openclaw doctor --fix` sửa chữa; hãy dùng ID hồ sơ `openai:*` và `auth.order.openai` cho
cấu hình mới.

Trang này trình bày:

- cách **trao đổi token** OAuth hoạt động (PKCE)
- nơi token được **lưu trữ** (và lý do)
- cách xử lý **nhiều tài khoản** (hồ sơ + ghi đè theo phiên)

Các Plugin nhà cung cấp có luồng OAuth hoặc khóa API riêng sẽ chạy qua
cùng một điểm vào:

```bash
openclaw models auth login --provider <id>
```

## Điểm tiếp nhận token (lý do tồn tại)

Các nhà cung cấp OAuth thường tạo một refresh token mới mỗi lần đăng nhập/làm mới.
Một số nhà cung cấp vô hiệu hóa refresh token trước đó khi một token mới được
cấp cho cùng người dùng/ứng dụng. Triệu chứng thực tế: đăng nhập qua OpenClaw _và_
qua Claude Code / Codex CLI, rồi một trong hai bị đăng xuất ngẫu nhiên sau đó.

Để giảm tình trạng này, OpenClaw coi kho hồ sơ xác thực là một **điểm tiếp nhận token**:

- runtime đọc thông tin xác thực từ một nơi cho mỗi agent
- nhiều hồ sơ có thể cùng tồn tại và được định tuyến một cách xác định
- việc tái sử dụng CLI bên ngoài tùy thuộc vào nhà cung cấp: sau khi OpenClaw sở hữu một hồ sơ OAuth cục bộ
  cho một nhà cung cấp, refresh token cục bộ là nguồn chuẩn. Nếu refresh token cục bộ đó
  bị từ chối, OpenClaw báo cáo hồ sơ cần
  xác thực lại thay vì quay về dùng dữ liệu token từ CLI bên ngoài.
  Quá trình khởi tạo từ Codex CLI còn hạn chế hơn: nó chỉ có thể tạo dữ liệu ban đầu cho một hồ sơ trống
  theo kiểu `openai:default` trước khi OpenClaw sở hữu OAuth cho nhà cung cấp đó;
  sau thời điểm này, các lần làm mới do OpenClaw quản lý vẫn là nguồn chuẩn
- các đường dẫn trạng thái/khởi động giới hạn việc khám phá CLI bên ngoài trong tập hợp nhà cung cấp
  đã được cấu hình, vì vậy kho đăng nhập của một CLI không liên quan sẽ không bị kiểm tra trong
  thiết lập chỉ có một nhà cung cấp

## Lưu trữ (token nằm ở đâu)

Thông tin bí mật được lưu riêng theo agent, với khóa là tên logic `auth-profiles.json` (
kho bên dưới là cơ sở dữ liệu SQLite của agent; tên JSON được giữ lại để
tương thích và hiển thị trong công cụ):

- Hồ sơ xác thực (OAuth + khóa API + tham chiếu tùy chọn ở cấp giá trị):
  `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Tệp tương thích kế thừa: `~/.openclaw/agents/<agentId>/agent/auth.json`
  (các mục `api_key` tĩnh sẽ bị xóa sạch khi được phát hiện)

Tệp kế thừa chỉ dùng để nhập (vẫn được hỗ trợ nhưng không phải kho chính):

- `~/.openclaw/credentials/oauth.json` (được nhập vào kho hồ sơ xác thực trong lần sử dụng đầu tiên)

Tất cả các mục trên cũng tuân theo `$OPENCLAW_STATE_DIR` (ghi đè thư mục trạng thái). Tham khảo đầy đủ: [/gateway/configuration-reference#auth-storage](/vi/gateway/configuration-reference#auth-storage)

Để biết về tham chiếu thông tin bí mật tĩnh và hành vi kích hoạt ảnh chụp nhanh runtime, hãy xem [Quản lý thông tin bí mật](/vi/gateway/secrets).

Khi một agent phụ không có hồ sơ xác thực cục bộ, OpenClaw sử dụng cơ chế kế thừa
đọc xuyên từ kho của agent mặc định/chính; hệ thống không sao chép kho của agent chính
khi đọc. Refresh token OAuth đặc biệt nhạy cảm: các luồng sao chép thông thường
mặc định bỏ qua chúng vì một số nhà cung cấp xoay vòng hoặc vô hiệu hóa
refresh token sau khi sử dụng. Hãy cấu hình một lần đăng nhập OAuth riêng cho agent khi
agent đó cần một tài khoản độc lập.

## Tái sử dụng Anthropic Claude CLI

OpenClaw hỗ trợ tái sử dụng Anthropic Claude CLI và `claude -p` như một
phương thức xác thực được chấp thuận. Nếu máy chủ đã có phiên đăng nhập Claude cục bộ,
quá trình tích hợp ban đầu/cấu hình có thể tái sử dụng trực tiếp. Setup-token của Anthropic vẫn
khả dụng như một phương thức xác thực bằng token được hỗ trợ, nhưng OpenClaw ưu tiên tái sử dụng Claude CLI
khi phương thức này khả dụng.

<Warning>
Tài liệu Claude Code công khai của Anthropic cho biết việc sử dụng trực tiếp Claude Code vẫn nằm trong
giới hạn thuê bao Claude, và nhân viên Anthropic đã cho chúng tôi biết rằng kiểu sử dụng Claude
CLI của OpenClaw lại được phép. Do đó, OpenClaw coi việc tái sử dụng Claude CLI và
sử dụng `claude -p` là được chấp thuận cho tích hợp này, trừ khi Anthropic
công bố chính sách mới.

Để xem tài liệu hiện tại của Anthropic về các gói sử dụng Claude Code trực tiếp, hãy xem [Sử dụng Claude Code
với gói Pro hoặc Max của bạn](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
và [Sử dụng Claude Code với gói Team hoặc Enterprise
của bạn](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/).

Nếu bạn muốn các tùy chọn kiểu thuê bao khác trong OpenClaw, hãy xem [OpenAI
Codex](/vi/providers/openai), [Gói Qwen Cloud Coding
Plan](/vi/providers/qwen), [Gói MiniMax Coding Plan](/vi/providers/minimax),
và [Gói Z.AI / GLM Coding Plan](/vi/providers/zai).
</Warning>

## Trao đổi OAuth (cách đăng nhập hoạt động)

Các luồng đăng nhập tương tác của OpenClaw được triển khai trong `openclaw/plugin-sdk/llm.ts` và kết nối với các trình hướng dẫn/lệnh.

### Setup-token Anthropic

Cấu trúc luồng:

1. tạo token bằng cách chạy `claude setup-token` trên bất kỳ máy nào có Claude Code, sau đó bắt đầu dùng setup-token Anthropic hoặc paste-token từ OpenClaw
2. OpenClaw lưu thông tin xác thực Anthropic thu được vào một hồ sơ xác thực
3. lựa chọn mô hình vẫn dùng `anthropic/...`
4. các hồ sơ xác thực Anthropic hiện có vẫn khả dụng để quay lui/kiểm soát thứ tự

### OpenAI Codex (ChatGPT OAuth)

OpenAI Codex OAuth được hỗ trợ rõ ràng để sử dụng bên ngoài Codex CLI, bao gồm các quy trình làm việc của OpenClaw.

Lệnh đăng nhập sử dụng ID nhà cung cấp OpenAI chuẩn:

```bash
openclaw models auth login --provider openai
```

Hãy dùng `--profile-id openai:<name>` cho nhiều tài khoản ChatGPT/Codex OAuth trong
một agent. Không dùng `openai-codex:<name>` cho hồ sơ mới. Doctor di chuyển
tiền tố cũ đó sang ID hồ sơ `openai:*` không xung đột; hãy chạy
`openclaw models auth list --provider openai` sau khi sửa chữa trước khi sao chép
ID hồ sơ vào `auth.order` hoặc `/model ...@<profileId>`.

Cấu trúc luồng (PKCE):

1. tạo trình xác minh/thách thức PKCE và một `state` ngẫu nhiên
2. mở `https://auth.openai.com/oauth/authorize?...` (phạm vi
   `openid profile email offline_access`)
3. thử nhận callback tại `http://localhost:1455/auth/callback` (
   máy chủ callback mặc định là `localhost` và chỉ chấp nhận máy chủ loopback;
   ghi đè bằng `OPENCLAW_OAUTH_CALLBACK_HOST`)
4. nếu bạn có thể dán mã trước khi callback đến (hoặc đang
   ở môi trường từ xa/không giao diện và callback không thể liên kết), hãy dán URL/mã chuyển hướng
   thay thế - thao tác dán thủ công chạy đua với callback của trình duyệt và bên nào hoàn tất
   trước sẽ thắng
5. trao đổi mã tại `https://auth.openai.com/oauth/token`
6. trích xuất `accountId` từ access token và lưu `{ access, refresh, expires, accountId }`

Đường dẫn trình hướng dẫn là `openclaw onboard` → lựa chọn xác thực `openai`.

## Làm mới + hết hạn

Các hồ sơ lưu dấu thời gian `expires`. Trong runtime:

- nếu `expires` nằm trong tương lai, sử dụng access token đã lưu
- nếu đã hết hạn, làm mới (dưới khóa tệp) và ghi đè thông tin xác thực đã lưu
- nếu một agent phụ đọc hồ sơ OAuth được kế thừa từ agent chính,
  lần làm mới sẽ ghi trở lại kho của agent chính thay vì sao chép refresh
  token vào kho của agent phụ
- thông tin xác thực CLI được quản lý bên ngoài (Claude CLI, quá trình khởi tạo Codex CLI có giới hạn;
  xem [Điểm tiếp nhận token](#the-token-sink-why-it-exists)) được đọc lại thay vì
  sử dụng một refresh token đã sao chép. Nếu lần làm mới được quản lý thất bại, OpenClaw
  báo cáo hồ sơ bị ảnh hưởng cần xác thực lại thay vì trả về
  dữ liệu token từ CLI bên ngoài.

Luồng làm mới diễn ra tự động; thông thường bạn không cần quản lý token theo cách thủ công.

## Nhiều tài khoản (hồ sơ) + định tuyến

Hai kiểu:

### 1) Khuyến nghị: các agent riêng biệt

Nếu bạn muốn "cá nhân" và "công việc" không bao giờ tương tác, hãy dùng các agent biệt lập (các phiên + thông tin xác thực + không gian làm việc riêng biệt):

```bash
openclaw agents add work
openclaw agents add personal
```

Sau đó cấu hình xác thực theo từng agent (trình hướng dẫn) và định tuyến cuộc trò chuyện đến đúng agent.

### 2) Nâng cao: nhiều hồ sơ trong một agent

Kho hồ sơ xác thực hỗ trợ nhiều ID hồ sơ cho cùng một nhà cung cấp.
Chọn hồ sơ được sử dụng:

- trên toàn cục thông qua thứ tự cấu hình (`auth.order`)
- theo từng phiên thông qua `/model ...@<profileId>`

Ví dụ (ghi đè theo phiên):

- `/model Opus@anthropic:work`

Liệt kê các ID hồ sơ hiện có bằng:

```bash
openclaw models auth list --provider <id>
```

Tài liệu liên quan:

- [Chuyển đổi dự phòng mô hình](/vi/concepts/model-failover) (quy tắc xoay vòng + thời gian chờ)
- [Lệnh gạch chéo](/vi/tools/slash-commands) (bề mặt lệnh)

## Liên quan

- [Xác thực](/vi/gateway/authentication) - tổng quan về xác thực nhà cung cấp mô hình
- [Thông tin bí mật](/vi/gateway/secrets) - lưu trữ thông tin xác thực và SecretRef
- [Tham chiếu cấu hình](/vi/gateway/configuration-reference#auth-storage) - các khóa cấu hình xác thực
