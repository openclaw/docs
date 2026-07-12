---
read_when:
    - Bạn muốn hiểu `openclaw.ai/install.sh`
    - Bạn muốn tự động hóa việc cài đặt (CI / không giao diện)
    - Bạn muốn cài đặt từ một bản checkout GitHub
summary: Cách hoạt động của các tập lệnh cài đặt (install.sh, install-cli.sh, install.ps1), các cờ và tự động hóa
title: Cơ chế nội bộ của trình cài đặt
x-i18n:
    generated_at: "2026-07-12T08:03:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 59b38a2eecbf15cc966beada81acf1824229a3825c73ae33ea0f8e89612bdf5b
    source_path: install/installer.md
    workflow: 16
---

OpenClaw cung cấp ba tập lệnh cài đặt, được phân phối từ `openclaw.ai`.

| Tập lệnh                          | Nền tảng             | Chức năng                                                                                         |
| ---------------------------------- | -------------------- | ------------------------------------------------------------------------------------------------- |
| [`install.sh`](#installsh)         | macOS / Linux / WSL  | Cài đặt Node nếu cần, cài đặt OpenClaw qua npm (mặc định) hoặc git và có thể chạy quy trình thiết lập ban đầu. |
| [`install-cli.sh`](#install-clish) | macOS / Linux / WSL  | Cài đặt Node + OpenClaw vào một tiền tố cục bộ (`~/.openclaw`) qua npm hoặc git. Không cần quyền root. |
| [`install.ps1`](#installps1)       | Windows (PowerShell) | Cài đặt Node nếu cần, cài đặt OpenClaw qua npm (mặc định) hoặc git và có thể chạy quy trình thiết lập ban đầu. |

Cả ba đều hỗ trợ Node **22.19+, 23.11+ hoặc 24+**; Node 24 là phiên bản đích mặc định cho các lượt cài đặt mới.

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
Nếu cài đặt thành công nhưng không tìm thấy `openclaw` trong cửa sổ dòng lệnh mới, hãy xem [khắc phục sự cố Node.js](/vi/install/node#troubleshooting).
</Note>

---

<a id="installsh"></a>

## install.sh

<Tip>
Được khuyến nghị cho hầu hết các lượt cài đặt tương tác trên macOS/Linux/WSL.
</Tip>

### Quy trình (install.sh)

<Steps>
  <Step title="Detect OS">
    Hỗ trợ macOS và Linux (bao gồm WSL).
  </Step>
  <Step title="Ensure Node.js 24 by default">
    Kiểm tra phiên bản Node và cài đặt Node 24 nếu cần (Homebrew trên macOS, các tập lệnh thiết lập NodeSource trên Linux dùng apt/dnf/yum). Trên macOS, Homebrew chỉ được cài đặt khi trình cài đặt cần nó cho Node hoặc Git. Node 22.19+ và 23.11+ vẫn được hỗ trợ để bảo đảm khả năng tương thích.
    Trên Alpine/Linux dùng musl, trình cài đặt sử dụng các gói apk thay cho NodeSource; các kho lưu trữ Alpine đã cấu hình phải cung cấp phiên bản Node được hỗ trợ (Alpine 3.21 trở lên tại thời điểm viết).
  </Step>
  <Step title="Ensure Git">
    Cài đặt Git nếu chưa có bằng trình quản lý gói được phát hiện, bao gồm Homebrew trên macOS và apk trên Alpine.
  </Step>
  <Step title="Install OpenClaw">
    - Phương thức `npm` (mặc định): cài đặt npm toàn cục
    - Phương thức `git`: sao chép/cập nhật kho mã nguồn, cài đặt các phần phụ thuộc bằng pnpm, biên dịch, sau đó cài đặt trình bao bọc tại `~/.local/bin/openclaw`

  </Step>
  <Step title="Post-install tasks">
    - Xác định tệp nhị phân `openclaw` vừa cài đặt để dùng cho các lệnh tiếp theo
    - Với lượt cài đặt chưa được cấu hình, bắt đầu quy trình thiết lập ban đầu trước khi chạy doctor hoặc các phép kiểm tra Gateway. Khi dùng `--no-onboard` hoặc không có TTY, tập lệnh in ra lệnh để hoàn tất thiết lập sau.
    - Với lượt cài đặt đã được cấu hình, cố gắng làm mới và khởi động lại dịch vụ Gateway đã nạp, rồi chạy doctor. Khi nâng cấp, tập lệnh cập nhật các Plugin nếu có thể hoặc in lệnh thủ công trong một lượt chạy không có giao diện nhưng đã bật lời nhắc.
    - Khi chạy `--verify`, tập lệnh kiểm tra phiên bản đã cài đặt và chỉ kiểm tra tình trạng Gateway sau khi đã có cấu hình.

  </Step>
</Steps>

### Phát hiện bản sao mã nguồn

Nếu chạy bên trong một bản sao mã nguồn OpenClaw (`package.json` + `pnpm-workspace.yaml`), tập lệnh cung cấp các lựa chọn:

- sử dụng bản sao mã nguồn (`git`), hoặc
- sử dụng bản cài đặt toàn cục (`npm`)

Nếu không có TTY và chưa đặt phương thức cài đặt, tập lệnh mặc định dùng `npm` và hiển thị cảnh báo.

Tập lệnh thoát với mã `2` khi lựa chọn phương thức không hợp lệ hoặc giá trị `--install-method` không hợp lệ.

### Ví dụ (install.sh)

<Tabs>
  <Tab title="Default">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```
  </Tab>
  <Tab title="Skip onboarding">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --no-onboard
    ```
  </Tab>
  <Tab title="Git install">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```
  </Tab>
  <Tab title="GitHub main checkout">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git --version main
    ```
  </Tab>
  <Tab title="Dry run">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --dry-run
    ```
  </Tab>
  <Tab title="Verify after install">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --no-onboard --verify
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Flags reference">

| Cờ                                      | Mô tả                                                                    |
| --------------------------------------- | ------------------------------------------------------------------------ |
| `--install-method \| --method npm\|git` | Chọn phương thức cài đặt (mặc định: `npm`)                               |
| `--npm`                                 | Lối tắt cho phương thức npm                                              |
| `--git \| --github`                     | Lối tắt cho phương thức git                                              |
| `--version <version\|dist-tag\|spec>`   | Phiên bản npm, dist-tag hoặc đặc tả gói (mặc định: `latest`)             |
| `--beta`                                | Dùng dist-tag beta nếu có, nếu không thì chuyển về `latest`              |
| `--git-dir \| --dir <path>`             | Thư mục bản sao mã nguồn (mặc định: `~/openclaw`)                        |
| `--no-git-update`                       | Bỏ qua `git pull` đối với bản sao mã nguồn hiện có                       |
| `--no-prompt`                           | Tắt lời nhắc                                                             |
| `--no-onboard`                          | Bỏ qua quy trình thiết lập ban đầu                                       |
| `--onboard`                             | Bật quy trình thiết lập ban đầu                                          |
| `--verify`                              | Chạy kiểm tra nhanh sau cài đặt (`--version`, tình trạng Gateway nếu đã nạp) |
| `--dry-run`                             | In các hành động mà không áp dụng thay đổi                               |
| `--verbose`                             | Bật đầu ra gỡ lỗi (`set -x`, nhật ký npm ở mức notice)                   |
| `--help \| -h`                          | Hiển thị cách sử dụng                                                    |

  </Accordion>

  <Accordion title="Environment variables reference">

| Biến                                               | Mô tả                                                                      |
| -------------------------------------------------- | -------------------------------------------------------------------------- |
| `OPENCLAW_INSTALL_METHOD=git\|npm`                 | Phương thức cài đặt                                                        |
| `OPENCLAW_VERSION=latest\|next\|<semver>\|<spec>`  | Phiên bản npm, dist-tag hoặc đặc tả gói                                    |
| `OPENCLAW_BETA=0\|1`                               | Dùng bản beta nếu có                                                       |
| `OPENCLAW_HOME=<path>`                             | Thư mục cơ sở cho trạng thái OpenClaw và các đường dẫn git/thiết lập ban đầu mặc định |
| `OPENCLAW_GIT_DIR=<path>`                          | Thư mục bản sao mã nguồn                                                   |
| `OPENCLAW_GIT_UPDATE=0\|1`                         | Bật hoặc tắt cập nhật git                                                  |
| `OPENCLAW_NO_PROMPT=1`                             | Tắt lời nhắc                                                               |
| `OPENCLAW_VERIFY_INSTALL=1`                        | Chạy kiểm tra nhanh sau cài đặt                                            |
| `OPENCLAW_NO_ONBOARD=1`                            | Bỏ qua quy trình thiết lập ban đầu                                         |
| `OPENCLAW_DRY_RUN=1`                               | Chế độ chạy thử                                                            |
| `OPENCLAW_VERBOSE=1`                               | Chế độ gỡ lỗi                                                              |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice`        | Mức nhật ký npm (mặc định: `error`, ẩn thông báo ngừng hỗ trợ của npm)     |

  </Accordion>
</AccordionGroup>

---

<a id="install-clish"></a>

## install-cli.sh

<Info>
Được thiết kế cho các môi trường mà bạn muốn đặt mọi thứ dưới một tiền tố cục bộ
(mặc định `~/.openclaw`) và không phụ thuộc vào Node của hệ thống. Mặc định hỗ trợ
cài đặt bằng npm, đồng thời hỗ trợ cài đặt từ bản sao mã nguồn git trong cùng quy trình dùng tiền tố.
</Info>

### Quy trình (install-cli.sh)

<Steps>
  <Step title="Install local Node runtime">
    Tải xuống tệp tarball Node LTS được ghim ở phiên bản được hỗ trợ (phiên bản được nhúng trong tập lệnh và cập nhật độc lập, mặc định là `22.22.2`) vào `<prefix>/tools/node-v<version>` và xác minh SHA-256.
    Trên Alpine/Linux dùng musl, nơi Node không phát hành tệp tarball tương thích cho môi trường thực thi được ghim, tập lệnh cài đặt `nodejs` và `npm` bằng `apk`, rồi liên kết môi trường thực thi đó vào đường dẫn trình bao bọc của tiền tố. Các kho lưu trữ Alpine phải cung cấp phiên bản Node được hỗ trợ (22.19+, 23.11+ hoặc 24+); hãy dùng Alpine 3.21 trở lên nếu các kho lưu trữ cũ chỉ cung cấp Node 20 hoặc 21.
  </Step>
  <Step title="Ensure Git">
    Nếu chưa có Git, tập lệnh thử cài đặt qua apt/dnf/yum/apk trên Linux hoặc Homebrew trên macOS.
  </Step>
  <Step title="Install OpenClaw under prefix">
    - Phương thức `npm` (mặc định): cài đặt dưới tiền tố bằng npm, sau đó ghi trình bao bọc vào `<prefix>/bin/openclaw`
    - Phương thức `git`: sao chép/cập nhật một bản sao mã nguồn (mặc định `~/openclaw`) và vẫn ghi trình bao bọc vào `<prefix>/bin/openclaw`

  </Step>
  <Step title="Refresh loaded gateway service">
    Nếu một dịch vụ Gateway đã được nạp từ cùng tiền tố đó, tập lệnh chạy
    `openclaw gateway install --force`, sau đó chạy `openclaw gateway restart` và
    cố gắng kiểm tra tình trạng Gateway.
  </Step>
</Steps>

### Ví dụ (install-cli.sh)

<Tabs>
  <Tab title="Default">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash
    ```
  </Tab>
  <Tab title="Custom prefix + version">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --prefix /opt/openclaw --version latest
    ```
  </Tab>
  <Tab title="Git install">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --install-method git --git-dir ~/openclaw
    ```
  </Tab>
  <Tab title="Automation JSON output">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --json --prefix /opt/openclaw
    ```
  </Tab>
  <Tab title="Run onboarding">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --onboard
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Flags reference">

| Cờ                                      | Mô tả                                                                                         |
| --------------------------------------- | --------------------------------------------------------------------------------------------- |
| `--prefix <path>`                       | Tiền tố cài đặt (mặc định: `~/.openclaw`)                                                     |
| `--install-method \| --method npm\|git` | Chọn phương thức cài đặt (mặc định: `npm`)                                                    |
| `--npm`                                 | Lối tắt cho phương thức npm                                                                   |
| `--git \| --github`                     | Lối tắt cho phương thức git                                                                   |
| `--git-dir \| --dir <path>`             | Thư mục checkout Git (mặc định: `~/openclaw`)                                                 |
| `--version <ver>`                       | Phiên bản hoặc dist-tag của OpenClaw (mặc định: `latest`)                                     |
| `--node-version <ver>`                  | Phiên bản Node (mặc định: `22.22.2`)                                                          |
| `--json`                                | Xuất các sự kiện NDJSON                                                                       |
| `--onboard`                             | Chạy `openclaw onboard` sau khi cài đặt                                                       |
| `--no-onboard`                          | Bỏ qua quy trình thiết lập ban đầu (mặc định)                                                 |
| `--set-npm-prefix`                      | Trên Linux, buộc tiền tố npm thành `~/.npm-global` nếu tiền tố hiện tại không thể ghi          |
| `--help \| -h`                          | Hiển thị cách sử dụng                                                                         |

  </Accordion>

  <Accordion title="Tham chiếu biến môi trường">

| Biến                                        | Mô tả                                                                         |
| ------------------------------------------- | ----------------------------------------------------------------------------- |
| `OPENCLAW_PREFIX=<path>`                    | Tiền tố cài đặt                                                               |
| `OPENCLAW_INSTALL_METHOD=git\|npm`          | Phương thức cài đặt                                                           |
| `OPENCLAW_VERSION=<ver>`                    | Phiên bản hoặc dist-tag của OpenClaw                                          |
| `OPENCLAW_NODE_VERSION=<ver>`               | Phiên bản Node                                                                |
| `OPENCLAW_HOME=<path>`                      | Thư mục cơ sở cho trạng thái OpenClaw và các đường dẫn git/thiết lập mặc định |
| `OPENCLAW_GIT_DIR=<path>`                   | Thư mục checkout Git cho các bản cài đặt bằng git                             |
| `OPENCLAW_GIT_UPDATE=0\|1`                  | Bật hoặc tắt cập nhật git cho các checkout hiện có                            |
| `OPENCLAW_NO_ONBOARD=1`                     | Bỏ qua quy trình thiết lập ban đầu                                            |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice` | Mức nhật ký npm (mặc định: `error`)                                           |

  </Accordion>
</AccordionGroup>

<Note>
`openclaw@main` và các đặc tả nguồn GitHub khác không phải là đích `--version` hợp lệ cho bản cài đặt npm. Thay vào đó, hãy dùng `--install-method git --version main`.
</Note>

---

<a id="installps1"></a>

## install.ps1

### Luồng thực thi (install.ps1)

<Steps>
  <Step title="Đảm bảo môi trường PowerShell + Windows">
    Yêu cầu PowerShell 5 trở lên.
  </Step>
  <Step title="Đảm bảo Node.js 24 theo mặc định">
    Nếu chưa có, tập lệnh sẽ thử cài đặt qua winget, sau đó là Chocolatey, rồi Scoop. Nếu không có trình quản lý gói nào, tập lệnh sẽ tải tệp zip Node.js 24 chính thức dành cho Windows vào `%LOCALAPPDATA%\OpenClaw\deps\portable-node`, rồi thêm thư mục đó vào PATH của tiến trình hiện tại và người dùng. Node 22.19+ và 23.11+ vẫn được hỗ trợ để đảm bảo khả năng tương thích.
  </Step>
  <Step title="Cài đặt OpenClaw">
    - Phương thức `npm` (mặc định): cài đặt npm toàn cục bằng `-Tag` đã chọn, được khởi chạy từ một thư mục tạm của trình cài đặt có thể ghi để các shell mở trong thư mục được bảo vệ như `C:\` vẫn hoạt động
    - Phương thức `git`: sao chép/cập nhật kho mã, cài đặt/biên dịch bằng pnpm và cài đặt trình bao bọc tại `%USERPROFILE%\.local\bin\openclaw.cmd`. Nếu thiếu Git, tập lệnh sẽ thiết lập MinGit cục bộ cho người dùng trong `%LOCALAPPDATA%\OpenClaw\deps\portable-git`, rồi thêm thư mục đó vào PATH của tiến trình hiện tại và người dùng.

  </Step>
  <Step title="Thực hiện các tác vụ sau cài đặt">
    - Thêm thư mục tệp thực thi cần thiết vào PATH của người dùng khi có thể
    - Cố gắng làm mới dịch vụ Gateway đã được nạp (`openclaw gateway install --force`, sau đó khởi động lại)
    - Chạy `openclaw doctor --non-interactive` khi nâng cấp và khi cài đặt bằng git (cố gắng tối đa)

  </Step>
  <Step title="Xử lý lỗi">
    Các bản cài đặt bằng `iwr ... | iex` và scriptblock báo lỗi kết thúc mà không đóng phiên PowerShell hiện tại. Các bản cài đặt trực tiếp bằng `powershell -File` / `pwsh -File` vẫn thoát với mã khác 0 để phục vụ tự động hóa.
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

| Cờ                          | Mô tả                                                                  |
| --------------------------- | ---------------------------------------------------------------------- |
| `-InstallMethod npm\|git`   | Phương thức cài đặt (mặc định: `npm`)                                  |
| `-Tag <tag\|version\|spec>` | dist-tag, phiên bản hoặc đặc tả gói npm (mặc định: `latest`)            |
| `-GitDir <path>`            | Thư mục checkout (mặc định: `%USERPROFILE%\openclaw`)                   |
| `-NoOnboard`                | Bỏ qua quy trình thiết lập ban đầu                                     |
| `-NoGitUpdate`              | Bỏ qua `git pull`                                                       |
| `-DryRun`                   | Chỉ in các hành động                                                    |

  </Accordion>

  <Accordion title="Tham chiếu biến môi trường">

| Biến                               | Mô tả                           |
| ---------------------------------- | ------------------------------- |
| `OPENCLAW_INSTALL_METHOD=git\|npm` | Phương thức cài đặt             |
| `OPENCLAW_GIT_DIR=<path>`          | Thư mục checkout                |
| `OPENCLAW_NO_ONBOARD=1`            | Bỏ qua quy trình thiết lập ban đầu |
| `OPENCLAW_GIT_UPDATE=0`            | Tắt git pull                    |
| `OPENCLAW_DRY_RUN=1`               | Chế độ chạy thử                 |

  </Accordion>
</AccordionGroup>

<Note>
Nếu dùng `-InstallMethod git` và thiếu Git, tập lệnh sẽ thử thiết lập MinGit cục bộ cho người dùng trước khi in liên kết Git for Windows.
</Note>

---

## CI và tự động hóa

Sử dụng các cờ/biến môi trường không tương tác để bảo đảm quá trình chạy có thể dự đoán được.

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
    Git là bắt buộc đối với phương thức cài đặt `git`. Đối với bản cài đặt `npm`, Git vẫn được kiểm tra/cài đặt để tránh lỗi `spawn git ENOENT` khi các phần phụ thuộc sử dụng URL git.
  </Accordion>

  <Accordion title="Tại sao npm gặp lỗi EACCES trên Linux?">
    Một số cấu hình Linux trỏ tiền tố toàn cục của npm đến các đường dẫn thuộc sở hữu của root. `install.sh` có thể chuyển tiền tố sang `~/.npm-global` và nối thêm các lệnh xuất PATH vào tệp rc của shell (khi các tệp đó tồn tại).
  </Accordion>

  <Accordion title='Windows: "npm error spawn git / ENOENT"'>
    Chạy lại trình cài đặt để nó có thể thiết lập MinGit cục bộ cho người dùng, hoặc cài đặt Git for Windows rồi mở lại PowerShell.
  </Accordion>

  <Accordion title='Windows: "openclaw is not recognized"'>
    Chạy `npm config get prefix`, thêm thư mục đó vào PATH của người dùng (không cần hậu tố `\bin` trên Windows), rồi mở lại PowerShell.
  </Accordion>

  <Accordion title="Windows: cách nhận đầu ra chi tiết của trình cài đặt">
    `install.ps1` không cung cấp tùy chọn `-Verbose`.
    Sử dụng tính năng truy vết PowerShell để chẩn đoán ở cấp độ tập lệnh:

    ```powershell
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

  </Accordion>

  <Accordion title="Không tìm thấy openclaw sau khi cài đặt">
    Thường là sự cố PATH. Xem [khắc phục sự cố Node.js](/vi/install/node#troubleshooting).
  </Accordion>
</AccordionGroup>

## Liên quan

- [Tổng quan về cài đặt](/vi/install)
- [Cập nhật](/vi/install/updating)
- [Gỡ cài đặt](/vi/install/uninstall)
