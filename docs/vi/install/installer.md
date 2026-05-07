---
read_when:
    - Bạn muốn hiểu `openclaw.ai/install.sh`
    - Bạn muốn tự động hóa quá trình cài đặt (CI / không giao diện)
    - Bạn muốn cài đặt từ một bản checkout GitHub
summary: Cách hoạt động của các tập lệnh cài đặt (install.sh, install-cli.sh, install.ps1), các cờ và tự động hóa
title: Cơ chế nội bộ của trình cài đặt
x-i18n:
    generated_at: "2026-05-07T13:20:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: a62720526e2a5ffc94555f77e7e806d63768b849a9491b60f6fdc9cf070eed2f
    source_path: install/installer.md
    workflow: 16
---

OpenClaw cung cấp ba tập lệnh cài đặt, được phân phối từ `openclaw.ai`.

| Tập lệnh                           | Nền tảng             | Chức năng                                                                                                      |
| ---------------------------------- | -------------------- | -------------------------------------------------------------------------------------------------------------- |
| [`install.sh`](#installsh)         | macOS / Linux / WSL  | Cài đặt Node nếu cần, cài đặt OpenClaw qua npm (mặc định) hoặc git, và có thể chạy quy trình thiết lập ban đầu. |
| [`install-cli.sh`](#install-clish) | macOS / Linux / WSL  | Cài đặt Node + OpenClaw vào một tiền tố cục bộ (`~/.openclaw`) bằng chế độ npm hoặc git checkout. Không yêu cầu root. |
| [`install.ps1`](#installps1)       | Windows (PowerShell) | Cài đặt Node nếu cần, cài đặt OpenClaw qua npm (mặc định) hoặc git, và có thể chạy quy trình thiết lập ban đầu. |

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
Nếu cài đặt thành công nhưng không tìm thấy `openclaw` trong terminal mới, xem [khắc phục sự cố Node.js](/vi/install/node#troubleshooting).
</Note>

---

<a id="installsh"></a>

## install.sh

<Tip>
Được khuyến nghị cho hầu hết các lần cài đặt tương tác trên macOS/Linux/WSL.
</Tip>

### Luồng (install.sh)

<Steps>
  <Step title="Detect OS">
    Hỗ trợ macOS và Linux (bao gồm WSL). Nếu phát hiện macOS, cài đặt Homebrew nếu còn thiếu.
  </Step>
  <Step title="Ensure Node.js 24 by default">
    Kiểm tra phiên bản Node và cài đặt Node 24 nếu cần (Homebrew trên macOS, tập lệnh thiết lập NodeSource trên Linux apt/dnf/yum). OpenClaw vẫn hỗ trợ Node 22 LTS, hiện là `22.16+`, để tương thích.
  </Step>
  <Step title="Ensure Git">
    Cài đặt Git nếu còn thiếu.
  </Step>
  <Step title="Install OpenClaw">
    - phương thức `npm` (mặc định): cài đặt npm toàn cục
    - phương thức `git`: sao chép/cập nhật repo, cài đặt phụ thuộc bằng pnpm, build, sau đó cài đặt wrapper tại `~/.local/bin/openclaw`

  </Step>
  <Step title="Post-install tasks">
    - Làm mới dịch vụ Gateway đã tải theo khả năng tốt nhất (`openclaw gateway install --force`, rồi khởi động lại)
    - Chạy `openclaw doctor --non-interactive` khi nâng cấp và cài đặt bằng git (theo khả năng tốt nhất)
    - Thử chạy quy trình thiết lập ban đầu khi phù hợp (có TTY, không tắt thiết lập ban đầu, và các kiểm tra bootstrap/cấu hình đạt)
    - Mặc định `SHARP_IGNORE_GLOBAL_LIBVIPS=1`

  </Step>
</Steps>

### Phát hiện source checkout

Nếu chạy bên trong một checkout OpenClaw (`package.json` + `pnpm-workspace.yaml`), tập lệnh sẽ đề xuất:

- dùng checkout (`git`), hoặc
- dùng cài đặt toàn cục (`npm`)

Nếu không có TTY và chưa đặt phương thức cài đặt, mặc định là `npm` và hiển thị cảnh báo.

Tập lệnh thoát với mã `2` khi chọn phương thức không hợp lệ hoặc giá trị `--install-method` không hợp lệ.

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
  <Tab title="GitHub main via npm">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --version main
    ```
  </Tab>
  <Tab title="Dry run">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --dry-run
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Flags reference">

| Cờ                                    | Mô tả                                                       |
| ------------------------------------- | ----------------------------------------------------------- |
| `--install-method npm\|git`           | Chọn phương thức cài đặt (mặc định: `npm`). Bí danh: `--method` |
| `--npm`                               | Lối tắt cho phương thức npm                                 |
| `--git`                               | Lối tắt cho phương thức git. Bí danh: `--github`            |
| `--version <version\|dist-tag\|spec>` | Phiên bản npm, dist-tag, hoặc package spec (mặc định: `latest`) |
| `--beta`                              | Dùng beta dist-tag nếu có, nếu không thì quay về `latest`   |
| `--git-dir <path>`                    | Thư mục checkout (mặc định: `~/openclaw`). Bí danh: `--dir` |
| `--no-git-update`                     | Bỏ qua `git pull` cho checkout hiện có                      |
| `--no-prompt`                         | Tắt lời nhắc                                                |
| `--no-onboard`                        | Bỏ qua thiết lập ban đầu                                    |
| `--onboard`                           | Bật thiết lập ban đầu                                       |
| `--dry-run`                           | In các hành động mà không áp dụng thay đổi                  |
| `--verbose`                           | Bật đầu ra gỡ lỗi (`set -x`, nhật ký npm mức notice)        |
| `--help`                              | Hiển thị cách dùng (`-h`)                                   |

  </Accordion>

  <Accordion title="Environment variables reference">

| Biến                                                    | Mô tả                                         |
| ------------------------------------------------------- | --------------------------------------------- |
| `OPENCLAW_INSTALL_METHOD=git\|npm`                      | Phương thức cài đặt                           |
| `OPENCLAW_VERSION=latest\|next\|main\|<semver>\|<spec>` | Phiên bản npm, dist-tag, hoặc package spec    |
| `OPENCLAW_BETA=0\|1`                                    | Dùng beta nếu có                              |
| `OPENCLAW_GIT_DIR=<path>`                               | Thư mục checkout                              |
| `OPENCLAW_GIT_UPDATE=0\|1`                              | Bật/tắt cập nhật git                          |
| `OPENCLAW_NO_PROMPT=1`                                  | Tắt lời nhắc                                  |
| `OPENCLAW_NO_ONBOARD=1`                                 | Bỏ qua thiết lập ban đầu                      |
| `OPENCLAW_DRY_RUN=1`                                    | Chế độ chạy thử                               |
| `OPENCLAW_VERBOSE=1`                                    | Chế độ gỡ lỗi                                 |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice`             | Mức nhật ký npm                               |
| `SHARP_IGNORE_GLOBAL_LIBVIPS=0\|1`                      | Kiểm soát hành vi sharp/libvips (mặc định: `1`) |

  </Accordion>
</AccordionGroup>

---

<a id="install-clish"></a>

## install-cli.sh

<Info>
Được thiết kế cho các môi trường nơi bạn muốn mọi thứ nằm dưới một tiền tố cục bộ
(mặc định `~/.openclaw`) và không có phụ thuộc Node hệ thống. Hỗ trợ cài đặt npm
theo mặc định, cùng với cài đặt git-checkout trong cùng luồng tiền tố.
</Info>

### Luồng (install-cli.sh)

<Steps>
  <Step title="Install local Node runtime">
    Tải xuống một tarball Node LTS được ghim và hỗ trợ (phiên bản được nhúng trong tập lệnh và cập nhật độc lập) vào `<prefix>/tools/node-v<version>` và xác minh SHA-256.
  </Step>
  <Step title="Ensure Git">
    Nếu thiếu Git, thử cài đặt qua apt/dnf/yum trên Linux hoặc Homebrew trên macOS.
  </Step>
  <Step title="Install OpenClaw under prefix">
    - phương thức `npm` (mặc định): cài đặt dưới tiền tố bằng npm, rồi ghi wrapper vào `<prefix>/bin/openclaw`
    - phương thức `git`: sao chép/cập nhật một checkout (mặc định `~/openclaw`) và vẫn ghi wrapper vào `<prefix>/bin/openclaw`

  </Step>
  <Step title="Refresh loaded gateway service">
    Nếu một dịch vụ Gateway đã được tải từ cùng tiền tố đó, tập lệnh sẽ chạy
    `openclaw gateway install --force`, rồi `openclaw gateway restart`, và
    thăm dò tình trạng Gateway theo khả năng tốt nhất.
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

| Cờ                          | Mô tả                                                                          |
| --------------------------- | ------------------------------------------------------------------------------ |
| `--prefix <path>`           | Tiền tố cài đặt (mặc định: `~/.openclaw`)                                      |
| `--install-method npm\|git` | Chọn phương thức cài đặt (mặc định: `npm`). Bí danh: `--method`                |
| `--npm`                     | Lối tắt cho phương thức npm                                                    |
| `--git`, `--github`         | Lối tắt cho phương thức git                                                    |
| `--git-dir <path>`          | Thư mục Git checkout (mặc định: `~/openclaw`). Bí danh: `--dir`                |
| `--version <ver>`           | Phiên bản OpenClaw hoặc dist-tag (mặc định: `latest`)                          |
| `--node-version <ver>`      | Phiên bản Node (mặc định: `22.22.0`)                                           |
| `--json`                    | Phát sự kiện NDJSON                                                            |
| `--onboard`                 | Chạy `openclaw onboard` sau khi cài đặt                                        |
| `--no-onboard`              | Bỏ qua thiết lập ban đầu (mặc định)                                            |
| `--set-npm-prefix`          | Trên Linux, buộc tiền tố npm thành `~/.npm-global` nếu tiền tố hiện tại không ghi được |
| `--help`                    | Hiển thị cách dùng (`-h`)                                                      |

  </Accordion>

  <Accordion title="Environment variables reference">

| Biến                                        | Mô tả                                         |
| ------------------------------------------- | --------------------------------------------- |
| `OPENCLAW_PREFIX=<path>`                    | Tiền tố cài đặt                               |
| `OPENCLAW_INSTALL_METHOD=git\|npm`          | Phương thức cài đặt                           |
| `OPENCLAW_VERSION=<ver>`                    | Phiên bản OpenClaw hoặc dist-tag              |
| `OPENCLAW_NODE_VERSION=<ver>`               | Phiên bản Node                                |
| `OPENCLAW_GIT_DIR=<path>`                   | Thư mục checkout Git cho cài đặt bằng git     |
| `OPENCLAW_GIT_UPDATE=0\|1`                  | Bật/tắt cập nhật git cho các checkout hiện có |
| `OPENCLAW_NO_ONBOARD=1`                     | Bỏ qua thiết lập ban đầu                      |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice` | Mức nhật ký npm                               |
| `SHARP_IGNORE_GLOBAL_LIBVIPS=0\|1`          | Kiểm soát hành vi sharp/libvips (mặc định: `1`) |

  </Accordion>
</AccordionGroup>

---

<a id="installps1"></a>

## install.ps1

### Luồng (install.ps1)

<Steps>
  <Step title="Đảm bảo môi trường PowerShell + Windows">
    Yêu cầu PowerShell 5+.
  </Step>
  <Step title="Đảm bảo Node.js 24 theo mặc định">
    Nếu thiếu, thử cài đặt qua winget, sau đó Chocolatey, rồi Scoop. Node 22 LTS, hiện là `22.16+`, vẫn được hỗ trợ để tương thích.
  </Step>
  <Step title="Cài đặt OpenClaw">
    - Phương thức `npm` (mặc định): cài đặt npm toàn cục bằng `-Tag` đã chọn, chạy từ thư mục tạm của trình cài đặt có thể ghi để các shell được mở trong thư mục được bảo vệ như `C:\` vẫn hoạt động
    - Phương thức `git`: clone/cập nhật repo, cài đặt/build bằng pnpm, và cài đặt wrapper tại `%USERPROFILE%\.local\bin\openclaw.cmd`

  </Step>
  <Step title="Tác vụ sau cài đặt">
    - Thêm thư mục bin cần thiết vào PATH của người dùng khi có thể
    - Làm mới dịch vụ Gateway đã tải theo cách cố gắng tối đa (`openclaw gateway install --force`, rồi khởi động lại)
    - Chạy `openclaw doctor --non-interactive` khi nâng cấp và cài đặt bằng git (cố gắng tối đa)

  </Step>
  <Step title="Xử lý lỗi">
    `iwr ... | iex` và cài đặt bằng scriptblock báo lỗi kết thúc mà không đóng phiên PowerShell hiện tại. Cài đặt trực tiếp bằng `powershell -File` / `pwsh -File` vẫn thoát với mã khác 0 cho tự động hóa.
  </Step>
</Steps>

### Ví dụ (install.ps1)

<Tabs>
  <Tab title="Mặc định">
    ```powershell
    iwr -useb https://openclaw.ai/install.ps1 | iex
    ```
  </Tab>
  <Tab title="Cài đặt bằng git">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -InstallMethod git
    ```
  </Tab>
  <Tab title="GitHub main qua npm">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -Tag main
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
  <Tab title="Vết gỡ lỗi">
    ```powershell
    # install.ps1 has no dedicated -Verbose flag yet.
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Tham chiếu cờ">

| Cờ                          | Mô tả                                                      |
| --------------------------- | ---------------------------------------------------------- |
| `-InstallMethod npm\|git`   | Phương thức cài đặt (mặc định: `npm`)                      |
| `-Tag <tag\|version\|spec>` | dist-tag, phiên bản, hoặc đặc tả gói npm (mặc định: `latest`) |
| `-GitDir <path>`            | Thư mục checkout (mặc định: `%USERPROFILE%\openclaw`)      |
| `-NoOnboard`                | Bỏ qua thiết lập ban đầu                                   |
| `-NoGitUpdate`              | Bỏ qua `git pull`                                          |
| `-DryRun`                   | Chỉ in các hành động                                       |

  </Accordion>

  <Accordion title="Tham chiếu biến môi trường">

| Biến                               | Mô tả                    |
| ---------------------------------- | ------------------------ |
| `OPENCLAW_INSTALL_METHOD=git\|npm` | Phương thức cài đặt      |
| `OPENCLAW_GIT_DIR=<path>`          | Thư mục checkout         |
| `OPENCLAW_NO_ONBOARD=1`            | Bỏ qua thiết lập ban đầu |
| `OPENCLAW_GIT_UPDATE=0`            | Tắt git pull             |
| `OPENCLAW_DRY_RUN=1`               | Chế độ chạy thử          |

  </Accordion>
</AccordionGroup>

<Note>
Nếu dùng `-InstallMethod git` và thiếu Git, script sẽ thoát và in liên kết Git for Windows.
</Note>

---

## CI và tự động hóa

Dùng cờ/biến môi trường không tương tác để các lần chạy có thể dự đoán.

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
    Git là bắt buộc cho phương thức cài đặt `git`. Với cài đặt bằng `npm`, Git vẫn được kiểm tra/cài đặt để tránh lỗi `spawn git ENOENT` khi các phụ thuộc dùng URL git.
  </Accordion>

  <Accordion title="Tại sao npm gặp EACCES trên Linux?">
    Một số thiết lập Linux trỏ tiền tố toàn cục của npm tới các đường dẫn do root sở hữu. `install.sh` có thể chuyển tiền tố sang `~/.npm-global` và thêm các export PATH vào tệp rc của shell (khi các tệp đó tồn tại).
  </Accordion>

  <Accordion title="Sự cố sharp/libvips">
    Các script mặc định đặt `SHARP_IGNORE_GLOBAL_LIBVIPS=1` để tránh việc sharp build dựa trên libvips hệ thống. Để ghi đè:

    ```bash
    SHARP_IGNORE_GLOBAL_LIBVIPS=0 curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```

  </Accordion>

  <Accordion title='Windows: "npm error spawn git / ENOENT"'>
    Cài đặt Git for Windows, mở lại PowerShell, chạy lại trình cài đặt.
  </Accordion>

  <Accordion title='Windows: "openclaw is not recognized"'>
    Chạy `npm config get prefix` và thêm thư mục đó vào PATH của người dùng (không cần hậu tố `\bin` trên Windows), rồi mở lại PowerShell.
  </Accordion>

  <Accordion title="Windows: cách lấy đầu ra trình cài đặt chi tiết">
    `install.ps1` hiện không cung cấp công tắc `-Verbose`.
    Dùng truy vết PowerShell để chẩn đoán ở cấp script:

    ```powershell
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

  </Accordion>

  <Accordion title="không tìm thấy openclaw sau khi cài đặt">
    Thường là sự cố PATH. Xem [khắc phục sự cố Node.js](/vi/install/node#troubleshooting).
  </Accordion>
</AccordionGroup>

## Liên quan

- [Tổng quan cài đặt](/vi/install)
- [Cập nhật](/vi/install/updating)
- [Gỡ cài đặt](/vi/install/uninstall)
