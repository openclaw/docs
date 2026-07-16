---
read_when:
    - Bạn muốn tìm hiểu `openclaw.ai/install.sh`
    - Bạn muốn tự động hóa quá trình cài đặt (CI / không giao diện)
    - Bạn muốn cài đặt từ một bản checkout GitHub
summary: Cách hoạt động của các tập lệnh cài đặt (install.sh, install-cli.sh, install.ps1), các cờ và tự động hóa
title: Cơ chế nội bộ của trình cài đặt
x-i18n:
    generated_at: "2026-07-16T14:40:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 7878f10903893b4e1902bbc79991f43edaa436bd802d5fecde41421e3e05bc2b
    source_path: install/installer.md
    workflow: 16
---

OpenClaw cung cấp ba tập lệnh cài đặt, được phân phối từ `openclaw.ai`.

| Tập lệnh                             | Nền tảng             | Chức năng                                                                                   |
| ---------------------------------- | -------------------- | ---------------------------------------------------------------------------------------------- |
| [`install.sh`](#installsh)         | macOS / Linux / WSL  | Cài đặt Node nếu cần, cài đặt OpenClaw qua npm (mặc định) hoặc git và có thể chạy quy trình thiết lập ban đầu.       |
| [`install-cli.sh`](#install-clish) | macOS / Linux / WSL  | Cài đặt Node + OpenClaw vào một tiền tố cục bộ (`~/.openclaw`) qua npm hoặc git. Không yêu cầu quyền root. |
| [`install.ps1`](#installps1)       | Windows (PowerShell) | Cài đặt Node nếu cần, cài đặt OpenClaw qua npm (mặc định) hoặc git và có thể chạy quy trình thiết lập ban đầu.       |

Cả ba đều hỗ trợ Node **22.22.3+, 24.15+ hoặc 25.9+**; Node 24 là phiên bản đích mặc định cho các lượt cài đặt mới.

## Lệnh nhanh

<Tabs>
  <Tab title="install.sh">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --help
    ```

  </Tab>
  <Tab title="install-cli.sh">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --help
    ```

  </Tab>
  <Tab title="install.ps1">
    ```powershell
    iwr -useb https://openclaw.ai/install.ps1 | iex
    ```

    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -Tag beta -NoOnboard -DryRun
    ```

  </Tab>
</Tabs>

<Note>
Nếu cài đặt thành công nhưng không tìm thấy `openclaw` trong terminal mới, hãy xem [khắc phục sự cố Node.js](/vi/install/node#troubleshooting).
</Note>

---

<a id="installsh"></a>

## install.sh

<Tip>
Được khuyến nghị cho hầu hết các lượt cài đặt tương tác trên macOS/Linux/WSL.
</Tip>

### Quy trình (install.sh)

<Steps>
  <Step title="Phát hiện hệ điều hành">
    Hỗ trợ macOS và Linux (bao gồm WSL).
  </Step>
  <Step title="Mặc định bảo đảm có Node.js 24">
    Kiểm tra phiên bản Node và cài đặt Node 24 nếu cần (Homebrew trên macOS, các tập lệnh thiết lập NodeSource trên Linux apt/dnf/yum). Trên macOS, Homebrew chỉ được cài đặt khi trình cài đặt cần dùng để cài Node hoặc Git. Node 22.22.3+, Node 24.15+ và Node 25.9+ được hỗ trợ; Node 23 không được hỗ trợ.
    Trên Alpine/musl Linux, trình cài đặt dùng các gói apk thay cho NodeSource và xác minh phiên bản SQLite thực tế được liên kết. Các luồng gói Alpine ổn định hiện tại có thể cung cấp phiên bản Node đủ mới nhưng liên kết với SQLite hệ thống có lỗ hổng; khi điều đó xảy ra, hãy dùng container `node:24-alpine` chính thức hoặc máy chủ dựa trên glibc.
  </Step>
  <Step title="Bảo đảm có Git">
    Cài đặt Git nếu chưa có bằng trình quản lý gói được phát hiện, bao gồm Homebrew trên macOS và apk trên Alpine.
  </Step>
  <Step title="Cài đặt OpenClaw">
    - Phương thức `npm` (mặc định): cài đặt npm toàn cục
    - Phương thức `git`: sao chép/cập nhật kho mã nguồn, cài đặt các phần phụ thuộc bằng pnpm, dựng dự án, sau đó cài đặt trình bao bọc tại `~/.local/bin/openclaw`

  </Step>
  <Step title="Tác vụ sau cài đặt">
    - Phân giải tệp nhị phân `openclaw` vừa cài đặt để dùng cho các lệnh tiếp theo
    - Đối với bản cài đặt chưa được cấu hình, bắt đầu quy trình thiết lập ban đầu trước khi chạy doctor hoặc kiểm tra Gateway. Khi dùng `--no-onboard` hoặc không có TTY, tập lệnh sẽ in lệnh để hoàn tất thiết lập sau.
    - Đối với bản cài đặt đã được cấu hình, cố gắng hết mức có thể để làm mới và khởi động lại dịch vụ Gateway đã được nạp, rồi chạy doctor. Khi nâng cấp, tập lệnh cập nhật các Plugin nếu có thể hoặc in lệnh thủ công trong lượt chạy không có giao diện nhưng cho phép lời nhắc.
    - Khi `--verify` chạy, tập lệnh kiểm tra phiên bản đã cài đặt và chỉ kiểm tra tình trạng Gateway sau khi đã có cấu hình.

  </Step>
</Steps>

### Phát hiện bản sao mã nguồn

Nếu chạy bên trong một bản sao mã nguồn OpenClaw (`package.json` + `pnpm-workspace.yaml`), tập lệnh cung cấp các lựa chọn:

- dùng bản sao mã nguồn (`git`), hoặc
- dùng bản cài đặt toàn cục (`npm`)

Nếu không có TTY và chưa đặt phương thức cài đặt, tập lệnh mặc định dùng `npm` và đưa ra cảnh báo.

Tập lệnh thoát với mã `2` khi lựa chọn phương thức không hợp lệ hoặc giá trị `--install-method` không hợp lệ.

### Ví dụ (install.sh)

<Tabs>
  <Tab title="Mặc định">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```
  </Tab>
  <Tab title="Bỏ qua thiết lập ban đầu">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --no-onboard
    ```
  </Tab>
  <Tab title="Cài đặt bằng Git">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```
  </Tab>
  <Tab title="Bản sao nhánh main trên GitHub">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git --version main
    ```
  </Tab>
  <Tab title="Chạy thử">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --dry-run
    ```
  </Tab>
  <Tab title="Xác minh sau khi cài đặt">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --no-onboard --verify
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Tham chiếu cờ">

| Cờ                                    | Mô tả                                                             |
| --------------------------------------- | ----------------------------------------------------------------------- |
| `--install-method \| --method npm\|git` | Chọn phương thức cài đặt (mặc định: `npm`)                                  |
| `--npm`                                 | Lối tắt cho phương thức npm                                                 |
| `--git \| --github`                     | Lối tắt cho phương thức git                                                 |
| `--version <version\|dist-tag\|spec>`   | Phiên bản npm, dist-tag hoặc đặc tả gói (mặc định: `latest`)              |
| `--beta`                                | Dùng dist-tag beta nếu có, nếu không thì chuyển về `latest`              |
| `--git-dir \| --dir <path>`             | Thư mục bản sao mã nguồn (mặc định: `~/openclaw`)                              |
| `--no-git-update`                       | Bỏ qua `git pull` đối với bản sao mã nguồn hiện có                                   |
| `--no-prompt`                           | Tắt lời nhắc                                                         |
| `--no-onboard`                          | Bỏ qua thiết lập ban đầu                                                         |
| `--onboard`                             | Bật thiết lập ban đầu                                                       |
| `--verify`                              | Chạy xác minh nhanh sau cài đặt (`--version`, tình trạng Gateway nếu đã được nạp) |
| `--dry-run`                             | In các hành động mà không áp dụng thay đổi                                  |
| `--verbose`                             | Bật đầu ra gỡ lỗi (`set -x`, nhật ký npm ở mức notice)                   |
| `--help \| -h`                          | Hiển thị cách dùng                                                              |

  </Accordion>

  <Accordion title="Tham chiếu biến môi trường">

| Biến                                          | Mô tả                                                        |
| ------------------------------------------------- | ------------------------------------------------------------------ |
| `OPENCLAW_INSTALL_METHOD=git\|npm`                | Phương thức cài đặt                                                     |
| `OPENCLAW_VERSION=latest\|next\|<semver>\|<spec>` | Phiên bản npm, dist-tag hoặc đặc tả gói                             |
| `OPENCLAW_BETA=0\|1`                              | Dùng phiên bản beta nếu có                                              |
| `OPENCLAW_HOME=<path>`                            | Thư mục cơ sở cho trạng thái OpenClaw và các đường dẫn git/thiết lập ban đầu mặc định |
| `OPENCLAW_GIT_DIR=<path>`                         | Thư mục bản sao mã nguồn                                                 |
| `OPENCLAW_GIT_UPDATE=0\|1`                        | Bật/tắt cập nhật git                                                 |
| `OPENCLAW_NO_PROMPT=1`                            | Tắt lời nhắc                                                    |
| `OPENCLAW_VERIFY_INSTALL=1`                       | Chạy xác minh nhanh sau cài đặt                                  |
| `OPENCLAW_NO_ONBOARD=1`                           | Bỏ qua thiết lập ban đầu                                                    |
| `OPENCLAW_DRY_RUN=1`                              | Chế độ chạy thử                                                       |
| `OPENCLAW_VERBOSE=1`                              | Chế độ gỡ lỗi                                                         |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice`       | Mức nhật ký npm (mặc định: `error`, ẩn thông báo ngừng hỗ trợ của npm)      |

  </Accordion>
</AccordionGroup>

---

<a id="install-clish"></a>

## install-cli.sh

<Info>
Được thiết kế cho các môi trường mà bạn muốn mọi thứ nằm dưới một tiền tố cục bộ
(mặc định `~/.openclaw`) và không phụ thuộc vào Node hệ thống. Mặc định hỗ trợ cài đặt bằng npm,
đồng thời hỗ trợ cài đặt từ bản sao mã nguồn git theo cùng quy trình tiền tố.
</Info>

### Quy trình (install-cli.sh)

<Steps>
  <Step title="Cài đặt môi trường chạy Node cục bộ">
    Tải xuống tarball Node LTS được ghim ở phiên bản được hỗ trợ (phiên bản được nhúng trong tập lệnh và cập nhật độc lập, mặc định `24.15.0`) vào `<prefix>/tools/node-v<version>` và xác minh SHA-256.
    Linux ARMv7 dùng Node `22.22.3` vì không có tệp nhị phân ARMv7 chính thức cho Node 24+.
    Trên Alpine/musl Linux, nơi Node không phát hành tarball tương thích với môi trường chạy được ghim, tập lệnh cài đặt `nodejs` và `npm` bằng `apk`, sau đó xác minh cả Node lẫn thư viện SQLite thực tế được liên kết. Các luồng gói Alpine ổn định hiện tại vẫn có thể liên kết với SQLite có lỗ hổng ngay cả khi Node đủ mới; hãy dùng container `node:24-alpine` chính thức hoặc máy chủ dựa trên glibc khi kiểm tra an toàn từ chối gói đó.
  </Step>
  <Step title="Bảo đảm có Git">
    Nếu chưa có Git, tập lệnh sẽ thử cài đặt qua apt/dnf/yum/apk trên Linux hoặc Homebrew trên macOS.
  </Step>
  <Step title="Cài đặt OpenClaw dưới tiền tố">
    - Phương thức `npm` (mặc định): cài đặt dưới tiền tố bằng npm, sau đó ghi trình bao bọc vào `<prefix>/bin/openclaw`
    - Phương thức `git`: sao chép/cập nhật một bản sao mã nguồn (mặc định `~/openclaw`) và vẫn ghi trình bao bọc vào `<prefix>/bin/openclaw`

  </Step>
  <Step title="Làm mới dịch vụ Gateway đã được nạp">
    Nếu một dịch vụ Gateway đã được nạp từ chính tiền tố đó, tập lệnh sẽ chạy
    `openclaw gateway install --force`, thao tác này kích hoạt dịch vụ thay thế,
    rồi cố gắng hết mức có thể để kiểm tra tình trạng Gateway.
  </Step>
</Steps>

### Ví dụ (install-cli.sh)

<Tabs>
  <Tab title="Mặc định">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash
    ```
  </Tab>
  <Tab title="Tiền tố + phiên bản tùy chỉnh">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --prefix /opt/openclaw --version latest
    ```
  </Tab>
  <Tab title="Cài đặt bằng Git">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --install-method git --git-dir ~/openclaw
    ```
  </Tab>
  <Tab title="Đầu ra JSON cho tự động hóa">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --json --prefix /opt/openclaw
    ```
  </Tab>
  <Tab title="Chạy thiết lập ban đầu">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --onboard
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Tham chiếu cờ">

| Cờ                                      | Mô tả                                                                            |
| --------------------------------------- | ------------------------------------------------------------------------------- |
| `--prefix <path>`                       | Tiền tố cài đặt (mặc định: `~/.openclaw`)                                         |
| `--install-method \| --method npm\|git` | Chọn phương thức cài đặt (mặc định: `npm`)                                          |
| `--npm`                                 | Lối tắt cho phương thức npm                                                         |
| `--git \| --github`                     | Lối tắt cho phương thức git                                                         |
| `--git-dir \| --dir <path>`             | Thư mục checkout Git (mặc định: `~/openclaw`)                                  |
| `--version <ver>`                       | Phiên bản hoặc dist-tag của OpenClaw (mặc định: `latest`)                                |
| `--node-version <ver>`                  | Phiên bản Node (mặc định: `24.15.0`; `22.22.3` trên Linux ARMv7)                     |
| `--json`                                | Xuất các sự kiện NDJSON                                                              |
| `--onboard`                             | Chạy `openclaw onboard` sau khi cài đặt                                            |
| `--no-onboard`                          | Bỏ qua quy trình thiết lập ban đầu (mặc định)                                                       |
| `--set-npm-prefix`                      | Trên Linux, buộc tiền tố npm thành `~/.npm-global` nếu tiền tố hiện tại không thể ghi |
| `--help \| -h`                          | Hiển thị cách sử dụng                                                                      |

  </Accordion>

  <Accordion title="Tham chiếu biến môi trường">

| Biến                                        | Mô tả                                                               |
| ------------------------------------------- | ------------------------------------------------------------------ |
| `OPENCLAW_PREFIX=<path>`                    | Tiền tố cài đặt                                                     |
| `OPENCLAW_INSTALL_METHOD=git\|npm`          | Phương thức cài đặt                                                     |
| `OPENCLAW_VERSION=<ver>`                    | Phiên bản hoặc dist-tag của OpenClaw                                       |
| `OPENCLAW_NODE_VERSION=<ver>`               | Phiên bản Node                                                       |
| `OPENCLAW_HOME=<path>`                      | Thư mục cơ sở cho trạng thái OpenClaw và các đường dẫn git/thiết lập ban đầu mặc định |
| `OPENCLAW_GIT_DIR=<path>`                   | Thư mục checkout Git cho các bản cài đặt bằng git                            |
| `OPENCLAW_GIT_UPDATE=0\|1`                  | Bật/tắt cập nhật git cho các checkout hiện có                          |
| `OPENCLAW_NO_ONBOARD=1`                     | Bỏ qua quy trình thiết lập ban đầu                                                    |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice` | Mức ghi log npm (mặc định: `error`)                                   |

  </Accordion>
</AccordionGroup>

<Note>
`openclaw@main` và các đặc tả nguồn GitHub khác không phải là đích `--version` hợp lệ cho bản cài đặt npm. Thay vào đó, hãy dùng `--install-method git --version main`.
</Note>

---

<a id="installps1"></a>

## install.ps1

### Luồng (install.ps1)

<Steps>
  <Step title="Đảm bảo môi trường PowerShell + Windows">
    Yêu cầu PowerShell 5+.
  </Step>
  <Step title="Đảm bảo Node.js 24 theo mặc định">
    Nếu chưa có, hệ thống sẽ thử cài đặt qua winget, sau đó Chocolatey, rồi Scoop. Nếu không có trình quản lý gói nào, tập lệnh sẽ tải tệp zip Node.js 24 chính thức dành cho Windows vào `%LOCALAPPDATA%\OpenClaw\deps\portable-node` và thêm tệp này vào PATH của tiến trình hiện tại và người dùng. Hỗ trợ Node 22.22.3+, Node 24.15+ và Node 25.9+; không hỗ trợ Node 23.
  </Step>
  <Step title="Cài đặt OpenClaw">
    - Phương thức `npm` (mặc định): cài đặt npm toàn cục bằng `-Tag` đã chọn, được khởi chạy từ thư mục tạm của trình cài đặt có thể ghi để các shell mở trong thư mục được bảo vệ như `C:\` vẫn hoạt động
    - Phương thức `git`: sao chép/cập nhật kho lưu trữ, cài đặt/biên dịch bằng pnpm và cài đặt trình bao bọc tại `%USERPROFILE%\.local\bin\openclaw.cmd`. Nếu thiếu Git, tập lệnh sẽ thiết lập MinGit cục bộ cho người dùng trong `%LOCALAPPDATA%\OpenClaw\deps\portable-git` và thêm nó vào PATH của tiến trình hiện tại và người dùng.

  </Step>
  <Step title="Các tác vụ sau cài đặt">
    - Thêm thư mục bin cần thiết vào PATH của người dùng khi có thể
    - Làm mới dịch vụ Gateway đã nạp theo cơ chế nỗ lực tối đa (`openclaw gateway install --force`, sau đó khởi động lại)
    - Chạy `openclaw doctor --non-interactive` khi nâng cấp và cài đặt bằng git (nỗ lực tối đa)

  </Step>
  <Step title="Xử lý lỗi">
    Các bản cài đặt bằng `iwr ... | iex` và khối tập lệnh báo lỗi kết thúc mà không đóng phiên PowerShell hiện tại. Các bản cài đặt trực tiếp bằng `powershell -File` / `pwsh -File` vẫn thoát với mã khác 0 để phục vụ tự động hóa.
  </Step>
</Steps>

### Ví dụ (install.ps1)

<Tabs>
  <Tab title="Mặc định">
    ```powershell
    iwr -useb https://openclaw.ai/install.ps1 | iex
    ```
  </Tab>
  <Tab title="Cài đặt bằng Git">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -InstallMethod git
    ```
  </Tab>
  <Tab title="Checkout nhánh main trên GitHub">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -InstallMethod git -Tag main
    ```
  </Tab>
  <Tab title="Thư mục git tùy chỉnh">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -InstallMethod git -GitDir "C:\openclaw"
    ```
  </Tab>
  <Tab title="Chạy thử">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -DryRun
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Tham chiếu cờ">

| Cờ                          | Mô tả                                                       |
| --------------------------- | ---------------------------------------------------------- |
| `-InstallMethod npm\|git`   | Phương thức cài đặt (mặc định: `npm`)                            |
| `-Tag <tag\|version\|spec>` | dist-tag, phiên bản hoặc đặc tả gói npm (mặc định: `latest`) |
| `-GitDir <path>`            | Thư mục checkout (mặc định: `%USERPROFILE%\openclaw`)     |
| `-NoOnboard`                | Bỏ qua quy trình thiết lập ban đầu                                            |
| `-NoGitUpdate`              | Bỏ qua `git pull`                                            |
| `-DryRun`                   | Chỉ in các hành động                                         |

  </Accordion>

  <Accordion title="Tham chiếu biến môi trường">

| Biến                               | Mô tả              |
| ---------------------------------- | ------------------ |
| `OPENCLAW_INSTALL_METHOD=git\|npm` | Phương thức cài đặt     |
| `OPENCLAW_GIT_DIR=<path>`          | Thư mục checkout |
| `OPENCLAW_NO_ONBOARD=1`            | Bỏ qua quy trình thiết lập ban đầu    |
| `OPENCLAW_GIT_UPDATE=0`            | Tắt git pull   |
| `OPENCLAW_DRY_RUN=1`               | Chế độ chạy thử       |

  </Accordion>
</AccordionGroup>

<Note>
Nếu sử dụng `-InstallMethod git` và thiếu Git, tập lệnh sẽ thử thiết lập MinGit cục bộ cho người dùng trước khi in liên kết Git for Windows.
</Note>

---

## CI và tự động hóa

Sử dụng cờ/biến môi trường không tương tác để các lần chạy có thể dự đoán được.

<Tabs>
  <Tab title="install.sh (npm không tương tác)">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --no-prompt --no-onboard
    ```
  </Tab>
  <Tab title="install.sh (git không tương tác)">
    ```bash
    OPENCLAW_INSTALL_METHOD=git OPENCLAW_NO_PROMPT=1 \
      curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```
  </Tab>
  <Tab title="install-cli.sh (JSON)">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --json --prefix /opt/openclaw
    ```
  </Tab>
  <Tab title="install.ps1 (bỏ qua thiết lập ban đầu)">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    ```
  </Tab>
</Tabs>

---

## Khắc phục sự cố

<AccordionGroup>
  <Accordion title="Tại sao cần Git?">
    Git là bắt buộc đối với phương thức cài đặt `git`. Đối với các bản cài đặt `npm`, Git vẫn được kiểm tra/cài đặt để tránh lỗi `spawn git ENOENT` khi các phần phụ thuộc sử dụng URL git.
  </Accordion>

  <Accordion title="Tại sao npm gặp lỗi EACCES trên Linux?">
    Một số cấu hình Linux trỏ tiền tố toàn cục của npm đến các đường dẫn thuộc sở hữu của root. `install.sh` có thể chuyển tiền tố sang `~/.npm-global` và thêm các lệnh xuất PATH vào tệp rc của shell (khi các tệp đó tồn tại).
  </Accordion>

  <Accordion title='Windows: "npm error spawn git / ENOENT"'>
    Chạy lại trình cài đặt để nó có thể thiết lập MinGit cục bộ cho người dùng, hoặc cài đặt Git for Windows rồi mở lại PowerShell.
  </Accordion>

  <Accordion title='Windows: "openclaw is not recognized"'>
    Chạy `npm config get prefix`, thêm thư mục đó vào PATH người dùng (không cần hậu tố `\bin` trên Windows), rồi mở lại PowerShell.
  </Accordion>

  <Accordion title="Windows: cách lấy đầu ra chi tiết của trình cài đặt">
    `install.ps1` không cung cấp tùy chọn `-Verbose`.
    Sử dụng tính năng theo dõi PowerShell để chẩn đoán ở cấp tập lệnh:

    ```powershell
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

  </Accordion>

  <Accordion title="Không tìm thấy openclaw sau khi cài đặt">
    Thường là vấn đề về PATH. Xem [khắc phục sự cố Node.js](/vi/install/node#troubleshooting).
  </Accordion>
</AccordionGroup>

## Liên quan

- [Tổng quan về cài đặt](/vi/install)
- [Cập nhật](/vi/install/updating)
- [Gỡ cài đặt](/vi/install/uninstall)
