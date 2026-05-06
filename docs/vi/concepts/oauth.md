---
read_when:
    - Bạn muốn hiểu OAuth của OpenClaw từ đầu đến cuối
    - Bạn gặp sự cố vô hiệu hóa token / đăng xuất
    - Bạn muốn các luồng xác thực Claude CLI hoặc OAuth
    - Bạn muốn nhiều tài khoản hoặc định tuyến hồ sơ
summary: 'OAuth trong OpenClaw: trao đổi mã thông báo, lưu trữ và các mẫu đa tài khoản'
title: OAuth
x-i18n:
    generated_at: "2026-05-06T09:08:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 223480a24bd30f92f5d9fdc35e937e582f9e81f5bee2fb0e5c0ea445ac552a40
    source_path: concepts/oauth.md
    workflow: 16
---

OpenClaw hỗ trợ "xác thực gói đăng ký" qua OAuth cho các nhà cung cấp có cung cấp tính năng này
(đáng chú ý là **OpenAI Codex (ChatGPT OAuth)**). Với Anthropic, cách phân tách thực tế
hiện là:

- **Khóa API Anthropic**: thanh toán API Anthropic thông thường
- **Anthropic Claude CLI / xác thực gói đăng ký bên trong OpenClaw**: nhân viên Anthropic
  đã cho chúng tôi biết rằng cách sử dụng này lại được phép

OpenAI Codex OAuth được hỗ trợ rõ ràng để sử dụng trong các công cụ bên ngoài như
OpenClaw. Trang này giải thích:

Với Anthropic trong môi trường sản xuất, xác thực bằng khóa API là đường dẫn được khuyến nghị an toàn hơn.

- cách **trao đổi token** OAuth hoạt động (PKCE)
- token được **lưu trữ** ở đâu (và lý do)
- cách xử lý **nhiều tài khoản** (hồ sơ + ghi đè theo phiên)

OpenClaw cũng hỗ trợ **Plugin nhà cung cấp** tự mang theo luồng OAuth hoặc khóa API
của riêng chúng. Chạy chúng bằng:

```bash
openclaw models auth login --provider <id>
```

## Bồn chứa token (lý do tồn tại)

Các nhà cung cấp OAuth thường tạo một **refresh token mới** trong các luồng đăng nhập/làm mới. Một số nhà cung cấp (hoặc ứng dụng khách OAuth) có thể vô hiệu hóa refresh token cũ hơn khi một token mới được cấp cho cùng người dùng/ứng dụng.

Triệu chứng thực tế:

- bạn đăng nhập qua OpenClaw _và_ qua Claude Code / Codex CLI → một trong hai sẽ ngẫu nhiên bị "đăng xuất" về sau

Để giảm tình trạng đó, OpenClaw xem `auth-profiles.json` là một **bồn chứa token**:

- runtime đọc thông tin xác thực từ **một nơi**
- chúng tôi có thể giữ nhiều hồ sơ và định tuyến chúng một cách xác định
- việc tái sử dụng CLI bên ngoài phụ thuộc vào nhà cung cấp: Codex CLI có thể khởi tạo một hồ sơ
  `openai-codex:default` trống, nhưng khi OpenClaw đã có hồ sơ OAuth cục bộ,
  refresh token cục bộ là nguồn chuẩn; các tích hợp khác có thể vẫn được quản lý
  bên ngoài và đọc lại kho xác thực CLI của chúng
- các đường dẫn trạng thái và khởi động đã biết tập nhà cung cấp được cấu hình sẽ giới hạn
  việc khám phá CLI bên ngoài vào tập đó, để một kho đăng nhập CLI không liên quan
  không bị dò quét trong thiết lập chỉ có một nhà cung cấp

## Lưu trữ (token nằm ở đâu)

Bí mật được lưu trong kho xác thực của tác nhân:

- Hồ sơ xác thực (OAuth + khóa API + tham chiếu tùy chọn ở cấp giá trị): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Tệp tương thích kế thừa: `~/.openclaw/agents/<agentId>/agent/auth.json`
  (các mục `api_key` tĩnh sẽ được xóa sạch khi được phát hiện)

Tệp chỉ nhập kế thừa (vẫn được hỗ trợ, nhưng không phải kho chính):

- `~/.openclaw/credentials/oauth.json` (được nhập vào `auth-profiles.json` trong lần sử dụng đầu tiên)

Tất cả các mục trên cũng tôn trọng `$OPENCLAW_STATE_DIR` (ghi đè thư mục trạng thái). Tham chiếu đầy đủ: [/gateway/configuration](/vi/gateway/configuration-reference#auth-storage)

Về tham chiếu bí mật tĩnh và hành vi kích hoạt ảnh chụp runtime, xem [Quản lý bí mật](/vi/gateway/secrets).

Khi một tác nhân phụ không có hồ sơ xác thực cục bộ, OpenClaw dùng cơ chế kế thừa
đọc xuyên từ kho tác nhân mặc định/chính. Nó không sao chép `auth-profiles.json`
của tác nhân chính khi đọc. Refresh token OAuth đặc biệt nhạy cảm: các luồng sao chép
thông thường mặc định bỏ qua chúng vì một số nhà cung cấp xoay vòng
hoặc vô hiệu hóa refresh token sau khi sử dụng. Hãy cấu hình một đăng nhập OAuth riêng cho
một tác nhân khi nó cần một tài khoản độc lập.

## Tương thích token kế thừa của Anthropic

<Warning>
Tài liệu Claude Code công khai của Anthropic nói rằng việc dùng Claude Code trực tiếp vẫn nằm trong
giới hạn gói đăng ký Claude, và nhân viên Anthropic đã cho chúng tôi biết rằng cách sử dụng Claude
CLI kiểu OpenClaw lại được phép. Vì vậy, OpenClaw xem việc tái sử dụng Claude CLI và
sử dụng `claude -p` là được chấp thuận cho tích hợp này, trừ khi Anthropic
công bố chính sách mới.

Với tài liệu gói Claude Code trực tiếp hiện tại của Anthropic, xem [Sử dụng Claude Code
với gói Pro hoặc Max của bạn](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
và [Sử dụng Claude Code với gói Team hoặc Enterprise của bạn](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/).

Nếu bạn muốn các tùy chọn kiểu gói đăng ký khác trong OpenClaw, xem [OpenAI
Codex](/vi/providers/openai), [Gói Qwen Cloud Coding
Plan](/vi/providers/qwen), [Gói MiniMax Coding Plan](/vi/providers/minimax),
và [Gói Z.AI / GLM Coding Plan](/vi/providers/glm).
</Warning>

OpenClaw cũng cung cấp setup-token Anthropic như một đường dẫn xác thực bằng token được hỗ trợ, nhưng hiện ưu tiên tái sử dụng Claude CLI và `claude -p` khi có sẵn.

## Di chuyển Anthropic Claude CLI

OpenClaw lại hỗ trợ tái sử dụng Anthropic Claude CLI. Nếu bạn đã có đăng nhập Claude cục bộ
trên máy chủ, quy trình onboarding/cấu hình có thể tái sử dụng trực tiếp.

## Trao đổi OAuth (cách đăng nhập hoạt động)

Các luồng đăng nhập tương tác của OpenClaw được triển khai trong `@mariozechner/pi-ai` và nối vào các trình hướng dẫn/lệnh.

### Setup-token Anthropic

Hình dạng luồng:

1. bắt đầu setup-token Anthropic hoặc paste-token từ OpenClaw
2. OpenClaw lưu thông tin xác thực Anthropic thu được vào một hồ sơ xác thực
3. lựa chọn mô hình vẫn ở `anthropic/...`
4. các hồ sơ xác thực Anthropic hiện có vẫn khả dụng để kiểm soát khôi phục/thứ tự

### OpenAI Codex (ChatGPT OAuth)

OpenAI Codex OAuth được hỗ trợ rõ ràng để sử dụng bên ngoài Codex CLI, bao gồm các quy trình OpenClaw.

Hình dạng luồng (PKCE):

1. tạo PKCE verifier/challenge + `state` ngẫu nhiên
2. mở `https://auth.openai.com/oauth/authorize?...`
3. thử bắt callback tại `http://127.0.0.1:1455/auth/callback`
4. nếu callback không thể bind (hoặc bạn đang ở môi trường từ xa/headless), dán URL/code chuyển hướng
5. trao đổi tại `https://auth.openai.com/oauth/token`
6. trích xuất `accountId` từ access token và lưu `{ access, refresh, expires, accountId }`

Đường dẫn trình hướng dẫn là `openclaw onboard` → lựa chọn xác thực `openai-codex`.

## Làm mới + hết hạn

Hồ sơ lưu một dấu thời gian `expires`.

Ở runtime:

- nếu `expires` ở tương lai → dùng access token đã lưu
- nếu đã hết hạn → làm mới (dưới khóa tệp) và ghi đè thông tin xác thực đã lưu
- nếu một tác nhân phụ đọc một hồ sơ OAuth kế thừa từ tác nhân chính, thao tác làm mới
  ghi ngược về kho tác nhân chính thay vì sao chép refresh token vào
  kho tác nhân phụ
- ngoại lệ: một số thông tin xác thực CLI bên ngoài vẫn được quản lý bên ngoài; OpenClaw
  đọc lại các kho xác thực CLI đó thay vì tiêu tốn refresh token đã sao chép.
  Việc khởi tạo Codex CLI được cố ý thu hẹp hơn: nó gieo một hồ sơ
  `openai-codex:default` trống, rồi các lần làm mới do OpenClaw sở hữu giữ hồ sơ
  cục bộ làm nguồn chuẩn.

Luồng làm mới là tự động; thông thường bạn không cần quản lý token thủ công.

## Nhiều tài khoản (hồ sơ) + định tuyến

Hai mẫu:

### 1) Ưu tiên: tác nhân riêng biệt

Nếu bạn muốn "cá nhân" và "công việc" không bao giờ tương tác, hãy dùng các tác nhân cô lập (phiên + thông tin xác thực + workspace riêng):

```bash
openclaw agents add work
openclaw agents add personal
```

Sau đó cấu hình xác thực cho từng tác nhân (trình hướng dẫn) và định tuyến các cuộc trò chuyện đến đúng tác nhân.

### 2) Nâng cao: nhiều hồ sơ trong một tác nhân

`auth-profiles.json` hỗ trợ nhiều ID hồ sơ cho cùng một nhà cung cấp.

Chọn hồ sơ sẽ được dùng:

- toàn cục qua thứ tự cấu hình (`auth.order`)
- theo phiên qua `/model ...@<profileId>`

Ví dụ (ghi đè phiên):

- `/model Opus@anthropic:work`

Cách xem các ID hồ sơ hiện có:

- `openclaw channels list --json` (hiển thị `auth[]`)

Tài liệu liên quan:

- [Chuyển đổi dự phòng mô hình](/vi/concepts/model-failover) (quy tắc xoay vòng + thời gian chờ)
- [Lệnh gạch chéo](/vi/tools/slash-commands) (bề mặt lệnh)

## Liên quan

- [Xác thực](/vi/gateway/authentication) - tổng quan xác thực nhà cung cấp mô hình
- [Bí mật](/vi/gateway/secrets) - lưu trữ thông tin xác thực và SecretRef
- [Tham chiếu cấu hình](/vi/gateway/configuration-reference#auth-storage) - các khóa cấu hình xác thực
