---
read_when:
    - Thiết lập một máy mới
    - Bạn muốn có phiên bản "mới nhất + tốt nhất" mà không làm hỏng thiết lập cá nhân của mình
summary: Quy trình thiết lập nâng cao và phát triển cho OpenClaw
title: Thiết lập
x-i18n:
    generated_at: "2026-07-16T15:51:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: c40d6d2bf2814465f3cc49c65d4c1498671420af728ce8012d13af3fba67025a
    source_path: start/setup.md
    workflow: 16
---

<Note>
Nếu bạn thiết lập lần đầu, hãy bắt đầu với [Bắt đầu](/vi/start/getting-started).
Để biết chi tiết về quy trình làm quen, hãy xem [Quy trình làm quen (CLI)](/vi/start/wizard).
</Note>

## Tóm tắt

Chọn quy trình thiết lập dựa trên tần suất bạn muốn cập nhật và liệu bạn có muốn tự chạy Gateway hay không:

- **Phần tùy chỉnh nằm ngoài kho mã nguồn:** lưu cấu hình và không gian làm việc của bạn trong `~/.openclaw/openclaw.json` và `~/.openclaw/workspace/` để các bản cập nhật kho mã nguồn không ảnh hưởng đến chúng.
- **Quy trình ổn định (được khuyến nghị cho đa số người dùng):** cài đặt ứng dụng macOS và để ứng dụng chạy Gateway đi kèm.
- **Quy trình tiên phong (phát triển):** tự chạy Gateway qua `pnpm gateway:watch`, sau đó để ứng dụng macOS kết nối ở chế độ Local.

## Điều kiện tiên quyết (từ mã nguồn)

- Khuyến nghị Node 24.15+ (Node 22 LTS, hiện là `22.22.3+`, vẫn được hỗ trợ)
- Cần có `pnpm` đối với bản sao mã nguồn. OpenClaw tải các plugin đi kèm từ các gói không gian làm việc pnpm
  `extensions/*` ở chế độ phát triển, vì vậy `npm install` ở thư mục gốc
  không chuẩn bị toàn bộ cây mã nguồn.
- Docker (không bắt buộc; chỉ dành cho thiết lập trong vùng chứa/e2e — xem [Docker](/vi/install/docker))

## Chiến lược tùy chỉnh (để cập nhật không gây ảnh hưởng)

Nếu bạn muốn hệ thống "được tùy chỉnh 100% cho mình" _và_ dễ cập nhật, hãy lưu phần tùy chỉnh trong:

- **Cấu hình:** `~/.openclaw/openclaw.json` (dạng JSON/JSON5)
- **Không gian làm việc:** `~/.openclaw/workspace` (skills, prompt, bộ nhớ; hãy biến nó thành một kho git riêng tư)

Khởi tạo các thư mục cấu hình/không gian làm việc một lần mà không chạy toàn bộ trình hướng dẫn làm quen:

```bash
openclaw setup --baseline
```

Chưa cài đặt toàn cục? Thay vào đó, hãy chạy từ kho mã nguồn này:

```bash
pnpm openclaw setup --baseline
```

(`openclaw setup` độc lập, không có `--baseline`, là bí danh của `openclaw onboard` và chạy toàn bộ trình hướng dẫn tương tác.)

## Chạy Gateway từ kho mã nguồn này

Sau `pnpm build`, bạn có thể chạy trực tiếp CLI đã đóng gói:

```bash
node openclaw.mjs gateway --port 18789 --verbose
```

## Quy trình ổn định (ưu tiên ứng dụng macOS)

1. Cài đặt và khởi chạy **OpenClaw.app** (thanh menu).
2. Hoàn tất danh sách kiểm tra về quy trình làm quen/quyền truy cập (các lời nhắc TCC).
3. Đảm bảo Gateway ở chế độ **Local** và đang chạy (ứng dụng quản lý Gateway).
4. Liên kết các nền tảng (ví dụ: WhatsApp):

```bash
openclaw channels login
```

5. Kiểm tra nhanh:

```bash
openclaw health
```

Nếu quy trình làm quen không có trong bản dựng của bạn:

- Chạy `openclaw setup`, sau đó là `openclaw channels login`, rồi khởi động Gateway theo cách thủ công (`openclaw gateway`).

## Quy trình tiên phong (Gateway trong terminal)

Mục tiêu: làm việc trên Gateway TypeScript, sử dụng tính năng tải lại nóng và duy trì kết nối với giao diện người dùng của ứng dụng macOS.

### 0) (Không bắt buộc) Chạy cả ứng dụng macOS từ mã nguồn

Nếu bạn cũng muốn dùng phiên bản tiên phong của ứng dụng macOS:

```bash
./scripts/restart-mac.sh
```

### 1) Khởi động Gateway phát triển

```bash
pnpm install
# Chỉ trong lần chạy đầu tiên (hoặc sau khi đặt lại cấu hình/không gian làm việc OpenClaw cục bộ)
pnpm openclaw setup
pnpm gateway:watch
```

`gateway:watch` khởi động hoặc khởi động lại tiến trình theo dõi Gateway trong một phiên tmux
có tên (`openclaw-gateway-watch-main`) và tự động đính kèm từ các
terminal tương tác. Các shell không tương tác vẫn tách rời và in ra
`tmux attach -t openclaw-gateway-watch-main`; dùng
`OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch` để giữ một lượt chạy tương tác
ở trạng thái tách rời hoặc `pnpm gateway:watch:raw` để dùng chế độ theo dõi ở tiền cảnh. Trình theo dõi
dừng dịch vụ Gateway đã cài đặt của hồ sơ đang hoạt động trước khi tiếp quản
cổng đã cấu hình/mặc định của dịch vụ, ngăn trình giám sát dịch vụ thay thế
tiến trình mã nguồn. Dịch vụ vẫn được cài đặt; chạy `pnpm openclaw gateway start`
khi bạn hoàn tất việc theo dõi. Khung tmux vẫn khả dụng sau khi khởi động thất bại
để terminal hoặc tác nhân khác có thể đính kèm hay thu thập nhật ký. Trình theo dõi
tải lại khi có thay đổi liên quan đến mã nguồn, cấu hình và siêu dữ liệu plugin đi kèm. Nếu
Gateway đang được theo dõi thoát trong lúc khởi động, `gateway:watch` sẽ chạy
`openclaw doctor --fix --non-interactive` một lần rồi thử lại; đặt
`OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0` để tắt lượt sửa chữa chỉ dành cho môi trường phát triển đó.
`pnpm gateway:watch` không dựng lại `dist/control-ui`, vì vậy hãy chạy lại `pnpm ui:build` sau khi `ui/` thay đổi hoặc dùng `pnpm ui:dev` khi phát triển giao diện người dùng điều khiển.

### 2) Trỏ ứng dụng macOS đến Gateway đang chạy

Trong **OpenClaw.app**:

- Connection Mode: **Local**
  Ứng dụng sẽ kết nối với gateway đang chạy trên cổng đã cấu hình.

### 3) Xác minh

- Trạng thái Gateway trong ứng dụng phải hiển thị **"Using existing gateway …"**
- Hoặc qua CLI:

```bash
openclaw health
```

### Các lỗi thường gặp

- **Sai cổng:** Gateway WS mặc định dùng `ws://127.0.0.1:18789`; hãy để ứng dụng và CLI sử dụng cùng một cổng.
- **Vị trí lưu trạng thái:**
  - Trạng thái kênh/nhà cung cấp: `~/.openclaw/credentials/`
  - Hồ sơ xác thực mô hình: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
  - Phiên và bản chép lời: `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`
  - Cấu phần phiên cũ/lưu trữ: `~/.openclaw/agents/<agentId>/sessions/`
  - Nhật ký: `/tmp/openclaw/`

## Sơ đồ lưu trữ thông tin xác thực

Sử dụng phần này khi gỡ lỗi xác thực hoặc quyết định nội dung cần sao lưu:

- **WhatsApp**: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Token bot Telegram**: cấu hình/biến môi trường hoặc `channels.telegram.tokenFile` (chỉ tệp thông thường; liên kết tượng trưng bị từ chối)
- **Token bot Discord**: cấu hình/biến môi trường hoặc SecretRef (nhà cung cấp biến môi trường/tệp/thực thi)
- **Token Slack**: cấu hình/biến môi trường (`channels.slack.*`)
- **Danh sách cho phép ghép nối**:
  - `~/.openclaw/credentials/<channel>-allowFrom.json` (tài khoản mặc định)
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json` (các tài khoản không mặc định)
- **Hồ sơ xác thực mô hình**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **Nội dung bí mật được lưu trong tệp (không bắt buộc)**: `~/.openclaw/secrets.json`
- **Nhập OAuth cũ**: `~/.openclaw/credentials/oauth.json`
  Chi tiết hơn: [Bảo mật](/vi/gateway/security#credential-storage-map).

## Cập nhật (mà không làm hỏng thiết lập)

- Giữ `~/.openclaw/workspace` và `~/.openclaw/` làm "nội dung của bạn"; không đưa prompt/cấu hình cá nhân vào kho mã nguồn `openclaw`.
- Cập nhật mã nguồn: `git pull` + `pnpm install` + tiếp tục dùng `pnpm gateway:watch`.

## Linux (dịch vụ người dùng systemd)

Các bản cài đặt Linux sử dụng dịch vụ **người dùng** systemd. Theo mặc định, systemd dừng các
dịch vụ người dùng khi đăng xuất/không hoạt động, khiến Gateway bị dừng. Quy trình làm quen cố gắng bật
chế độ duy trì cho bạn (có thể yêu cầu sudo). Nếu chế độ này vẫn tắt, hãy chạy:

```bash
sudo loginctl enable-linger $USER
```

Đối với máy chủ luôn hoạt động hoặc có nhiều người dùng, hãy cân nhắc dùng dịch vụ **hệ thống** thay cho
dịch vụ người dùng (không cần chế độ duy trì). Xem [Sổ tay vận hành Gateway](/vi/gateway) để biết các ghi chú về systemd.

## Tài liệu liên quan

- [Sổ tay vận hành Gateway](/vi/gateway) (cờ, giám sát, cổng)
- [Cấu hình Gateway](/vi/gateway/configuration) (lược đồ cấu hình + ví dụ)
- [Discord](/vi/channels/discord) và [Telegram](/vi/channels/telegram) (thẻ trả lời + cài đặt replyToMode)
- [Thiết lập trợ lý OpenClaw](/vi/start/openclaw)
- [Ứng dụng macOS](/vi/platforms/macos) (vòng đời gateway)
