---
read_when:
    - Bạn muốn hiểu `openclaw.ai/install.sh`
    - Bạn muốn tự động hóa việc cài đặt (CI / không giao diện)
    - Bạn muốn cài đặt từ một bản checkout GitHub
summary: Cách hoạt động của các tập lệnh cài đặt (install.sh, install-cli.sh, install.ps1), cờ và tự động hóa
title: Nội bộ trình cài đặt
x-i18n:
    generated_at: "2026-04-29T22:52:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 278e8d6a1a39651812b7f0955965c53c62afd3ad673b357484f8aecbcfbbdb1d
    source_path: install/installer.md
    workflow: 16
---

OpenClaw cung cấp ba script cài đặt, được phục vụ từ `openclaw.ai`.

| Script                             | Nền tảng             | Chức năng                                                                                                   |
| ---------------------------------- | -------------------- | -------------------------------------------------------------------------------------------------------------- |
| [`install.sh`](#installsh)         | macOS / Linux / WSL  | Cài đặt Node nếu cần, cài đặt OpenClaw qua npm (mặc định) hoặc git, và có thể chạy onboarding.                   |
| [`install-cli.sh`](#install-clish) | macOS / Linux / WSL  | Cài đặt Node + OpenClaw vào một prefix cục bộ (`~/.openclaw`) với chế độ npm hoặc checkout git. Không cần quyền root. |
| [`install.ps1`](#installps1)       | Windows (PowerShell) | Cài đặt Node nếu cần, cài đặt OpenClaw qua npm (mặc định) hoặc git, và có thể chạy onboarding.                   |

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
Khuyến nghị cho hầu hết các cài đặt tương tác trên macOS/Linux/WSL.
</Tip>

### Luồng (install.sh)

<Steps>
  <Step title="Phát hiện hệ điều hành">
    Hỗ trợ macOS và Linux (bao gồm WSL). Nếu phát hiện macOS, cài đặt Homebrew nếu chưa có.
  </Step>
  <Step title="Đảm bảo Node.js 24 theo mặc định">
    Kiểm tra phiên bản Node và cài đặt Node 24 nếu cần (Homebrew trên macOS, script thiết lập NodeSource trên Linux apt/dnf/yum). OpenClaw vẫn hỗ trợ Node 22 LTS, hiện là `22.14+`, để tương thích.
  </Step>
  <Step title="Đảm bảo Git">
    Cài đặt Git nếu chưa có.
  </Step>
  <Step title="Cài đặt OpenClaw">
    - Phương thức `npm` (mặc định): cài đặt npm toàn cục
    - Phương thức `git`: clone/cập nhật repo, cài đặt dependency bằng pnpm, build, sau đó cài đặt wrapper tại `~/.local/bin/openclaw`

  </Step>
  <Step title="Tác vụ sau cài đặt">
    - Làm mới best-effort một dịch vụ gateway đã được tải (`openclaw gateway install --force`, sau đó restart)
    - Chạy `openclaw doctor --non-interactive` khi nâng cấp và cài đặt bằng git (best effort)
    - Thử onboarding khi phù hợp (có TTY, onboarding không bị tắt, và kiểm tra bootstrap/config đạt)
    - Mặc định `SHARP_IGNORE_GLOBAL_LIBVIPS=1`

  </Step>
</Steps>

### Phát hiện checkout nguồn

Nếu chạy bên trong một checkout OpenClaw (`package.json` + `pnpm-workspace.yaml`), script sẽ đề xuất:

- dùng checkout (`git`), hoặc
- dùng cài đặt toàn cục (`npm`)

Nếu không có TTY và chưa đặt phương thức cài đặt, mặc định sẽ là `npm` và cảnh báo.

Script thoát với mã `2` khi chọn phương thức không hợp lệ hoặc giá trị `--install-method` không hợp lệ.

### Ví dụ (install.sh)

<Tabs>
  <Tab title="Mặc định">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```
  </Tab>
  <Tab title="Bỏ qua onboarding">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --no-onboard
    ```
  </Tab>
  <Tab title="Cài đặt Git">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```
  </Tab>
  <Tab title="GitHub main qua npm">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --version main
    ```
  </Tab>
  <Tab title="Chạy thử">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --dry-run
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Tham chiếu flag">

| Flag                                  | Mô tả                                                |
| ------------------------------------- | ---------------------------------------------------------- |
| `--install-method npm\|git`           | Chọn phương thức cài đặt (mặc định: `npm`). Alias: `--method`  |
| `--npm`                               | Lối tắt cho phương thức npm                                    |
| `--git`                               | Lối tắt cho phương thức git. Alias: `--github`                 |
| `--version <version\|dist-tag\|spec>` | Phiên bản npm, dist-tag hoặc package spec (mặc định: `latest`) |
| `--beta`                              | Dùng beta dist-tag nếu có, nếu không thì fallback về `latest`  |
| `--git-dir <path>`                    | Thư mục checkout (mặc định: `~/openclaw`). Alias: `--dir` |
| `--no-git-update`                     | Bỏ qua `git pull` cho checkout hiện có                      |
| `--no-prompt`                         | Tắt prompt                                            |
| `--no-onboard`                        | Bỏ qua onboarding                                            |
| `--onboard`                           | Bật onboarding                                          |
| `--dry-run`                           | In các hành động mà không áp dụng thay đổi                     |
| `--verbose`                           | Bật đầu ra debug (`set -x`, log mức notice của npm)      |
| `--help`                              | Hiển thị cách dùng (`-h`)                                          |

  </Accordion>

  <Accordion title="Tham chiếu biến môi trường">

| Biến                                                | Mô tả                                   |
| ------------------------------------------------------- | --------------------------------------------- |
| `OPENCLAW_INSTALL_METHOD=git\|npm`                      | Phương thức cài đặt                                |
| `OPENCLAW_VERSION=latest\|next\|main\|<semver>\|<spec>` | Phiên bản npm, dist-tag hoặc package spec        |
| `OPENCLAW_BETA=0\|1`                                    | Dùng beta nếu có                         |
| `OPENCLAW_GIT_DIR=<path>`                               | Thư mục checkout                            |
| `OPENCLAW_GIT_UPDATE=0\|1`                              | Bật/tắt cập nhật git                            |
| `OPENCLAW_NO_PROMPT=1`                                  | Tắt prompt                               |
| `OPENCLAW_NO_ONBOARD=1`                                 | Bỏ qua onboarding                               |
| `OPENCLAW_DRY_RUN=1`                                    | Chế độ chạy thử                                  |
| `OPENCLAW_VERBOSE=1`                                    | Chế độ debug                                    |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice`             | Mức log npm                                 |
| `SHARP_IGNORE_GLOBAL_LIBVIPS=0\|1`                      | Điều khiển hành vi sharp/libvips (mặc định: `1`) |

  </Accordion>
</AccordionGroup>

---

<a id="install-clish"></a>

## install-cli.sh

<Info>
Được thiết kế cho các môi trường nơi bạn muốn mọi thứ nằm dưới một prefix cục bộ
(mặc định `~/.openclaw`) và không phụ thuộc Node hệ thống. Hỗ trợ cài đặt npm
theo mặc định, cùng với cài đặt checkout git trong cùng luồng prefix.
</Info>

### Luồng (install-cli.sh)

<Steps>
  <Step title="Cài đặt runtime Node cục bộ">
    Tải một tarball Node LTS được ghim và hỗ trợ (phiên bản được nhúng trong script và cập nhật độc lập) vào `<prefix>/tools/node-v<version>` và xác minh SHA-256.
  </Step>
  <Step title="Đảm bảo Git">
    Nếu thiếu Git, thử cài đặt qua apt/dnf/yum trên Linux hoặc Homebrew trên macOS.
  </Step>
  <Step title="Cài đặt OpenClaw dưới prefix">
    - Phương thức `npm` (mặc định): cài đặt dưới prefix bằng npm, sau đó ghi wrapper vào `<prefix>/bin/openclaw`
    - Phương thức `git`: clone/cập nhật một checkout (mặc định `~/openclaw`) và vẫn ghi wrapper vào `<prefix>/bin/openclaw`

  </Step>
  <Step title="Làm mới dịch vụ gateway đã được tải">
    Nếu một dịch vụ gateway đã được tải từ cùng prefix đó, script sẽ chạy
    `openclaw gateway install --force`, sau đó `openclaw gateway restart`, và
    thăm dò sức khỏe gateway theo best-effort.
  </Step>
</Steps>

### Ví dụ (install-cli.sh)

<Tabs>
  <Tab title="Mặc định">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash
    ```
  </Tab>
  <Tab title="Prefix + phiên bản tùy chỉnh">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --prefix /opt/openclaw --version latest
    ```
  </Tab>
  <Tab title="Cài đặt Git">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --install-method git --git-dir ~/openclaw
    ```
  </Tab>
  <Tab title="Đầu ra JSON cho tự động hóa">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --json --prefix /opt/openclaw
    ```
  </Tab>
  <Tab title="Chạy onboarding">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --onboard
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Tham chiếu flag">

| Flag                        | Mô tả                                                                     |
| --------------------------- | ------------------------------------------------------------------------------- |
| `--prefix <path>`           | Prefix cài đặt (mặc định: `~/.openclaw`)                                         |
| `--install-method npm\|git` | Chọn phương thức cài đặt (mặc định: `npm`). Alias: `--method`                       |
| `--npm`                     | Lối tắt cho phương thức npm                                                         |
| `--git`, `--github`         | Lối tắt cho phương thức git                                                         |
| `--git-dir <path>`          | Thư mục checkout Git (mặc định: `~/openclaw`). Alias: `--dir`                  |
| `--version <ver>`           | Phiên bản OpenClaw hoặc dist-tag (mặc định: `latest`)                                |
| `--node-version <ver>`      | Phiên bản Node (mặc định: `22.22.0`)                                               |
| `--json`                    | Phát sự kiện NDJSON                                                              |
| `--onboard`                 | Chạy `openclaw onboard` sau khi cài đặt                                            |
| `--no-onboard`              | Bỏ qua onboarding (mặc định)                                                       |
| `--set-npm-prefix`          | Trên Linux, buộc prefix npm thành `~/.npm-global` nếu prefix hiện tại không ghi được |
| `--help`                    | Hiển thị cách dùng (`-h`)                                                               |

  </Accordion>

  <Accordion title="Tham chiếu biến môi trường">

| Variable                                    | Mô tả                                          |
| ------------------------------------------- | ---------------------------------------------- |
| `OPENCLAW_PREFIX=<path>`                    | Tiền tố cài đặt                                |
| `OPENCLAW_INSTALL_METHOD=git\|npm`          | Phương thức cài đặt                            |
| `OPENCLAW_VERSION=<ver>`                    | Phiên bản OpenClaw hoặc dist-tag               |
| `OPENCLAW_NODE_VERSION=<ver>`               | Phiên bản Node                                 |
| `OPENCLAW_GIT_DIR=<path>`                   | Thư mục checkout Git cho cài đặt bằng git      |
| `OPENCLAW_GIT_UPDATE=0\|1`                  | Bật/tắt cập nhật git cho checkout hiện có      |
| `OPENCLAW_NO_ONBOARD=1`                     | Bỏ qua onboarding                              |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice` | Mức log của npm                                |
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
  <Step title="Đảm bảo mặc định là Node.js 24">
    Nếu thiếu, thử cài đặt qua winget, rồi Chocolatey, rồi Scoop. Node 22 LTS, hiện là `22.14+`, vẫn được hỗ trợ để tương thích.
  </Step>
  <Step title="Cài đặt OpenClaw">
    - Phương thức `npm` (mặc định): cài đặt npm toàn cục bằng `-Tag` đã chọn
    - Phương thức `git`: clone/cập nhật repo, cài đặt/build bằng pnpm, và cài đặt wrapper tại `%USERPROFILE%\.local\bin\openclaw.cmd`

  </Step>
  <Step title="Tác vụ sau cài đặt">
    - Thêm thư mục bin cần thiết vào PATH của người dùng khi có thể
    - Làm mới dịch vụ gateway đã tải theo kiểu best-effort (`openclaw gateway install --force`, rồi restart)
    - Chạy `openclaw doctor --non-interactive` khi nâng cấp và cài đặt bằng git (best effort)

  </Step>
  <Step title="Xử lý lỗi">
    Cài đặt bằng `iwr ... | iex` và scriptblock báo lỗi kết thúc mà không đóng phiên PowerShell hiện tại. Cài đặt trực tiếp bằng `powershell -File` / `pwsh -File` vẫn thoát với mã khác 0 cho tự động hóa.
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
  <Accordion title="Tham chiếu flag">

| Flag                        | Mô tả                                                        |
| --------------------------- | ------------------------------------------------------------ |
| `-InstallMethod npm\|git`   | Phương thức cài đặt (mặc định: `npm`)                        |
| `-Tag <tag\|version\|spec>` | npm dist-tag, phiên bản, hoặc package spec (mặc định: `latest`) |
| `-GitDir <path>`            | Thư mục checkout (mặc định: `%USERPROFILE%\openclaw`)        |
| `-NoOnboard`                | Bỏ qua onboarding                                            |
| `-NoGitUpdate`              | Bỏ qua `git pull`                                            |
| `-DryRun`                   | Chỉ in các hành động                                         |

  </Accordion>

  <Accordion title="Tham chiếu biến môi trường">

| Variable                           | Mô tả                 |
| ---------------------------------- | --------------------- |
| `OPENCLAW_INSTALL_METHOD=git\|npm` | Phương thức cài đặt   |
| `OPENCLAW_GIT_DIR=<path>`          | Thư mục checkout      |
| `OPENCLAW_NO_ONBOARD=1`            | Bỏ qua onboarding     |
| `OPENCLAW_GIT_UPDATE=0`            | Tắt git pull          |
| `OPENCLAW_DRY_RUN=1`               | Chế độ chạy thử       |

  </Accordion>
</AccordionGroup>

<Note>
Nếu dùng `-InstallMethod git` và thiếu Git, script sẽ thoát và in liên kết Git for Windows.
</Note>

---

## CI và tự động hóa

Dùng flag/biến môi trường không tương tác để các lần chạy có thể dự đoán được.

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
  <Tab title="install.ps1 (bỏ qua onboarding)">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    ```
  </Tab>
</Tabs>

---

## Khắc phục sự cố

<AccordionGroup>
  <Accordion title="Tại sao cần Git?">
    Git là bắt buộc cho phương thức cài đặt `git`. Với cài đặt `npm`, Git vẫn được kiểm tra/cài đặt để tránh lỗi `spawn git ENOENT` khi dependency dùng URL git.
  </Accordion>

  <Accordion title="Tại sao npm gặp EACCES trên Linux?">
    Một số thiết lập Linux trỏ tiền tố toàn cục của npm tới các đường dẫn thuộc sở hữu root. `install.sh` có thể chuyển tiền tố sang `~/.npm-global` và thêm các lệnh export PATH vào file rc của shell (khi các file đó tồn tại).
  </Accordion>

  <Accordion title="Sự cố sharp/libvips">
    Các script đặt mặc định `SHARP_IGNORE_GLOBAL_LIBVIPS=1` để tránh sharp build với libvips của hệ thống. Để ghi đè:

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

  <Accordion title="Windows: cách lấy đầu ra chi tiết của trình cài đặt">
    `install.ps1` hiện không cung cấp switch `-Verbose`.
    Dùng tracing của PowerShell để chẩn đoán ở cấp script:

    ```powershell
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

  </Accordion>

  <Accordion title="không tìm thấy openclaw sau khi cài đặt">
    Thường là vấn đề PATH. Xem [khắc phục sự cố Node.js](/vi/install/node#troubleshooting).
  </Accordion>
</AccordionGroup>

## Liên quan

- [Tổng quan cài đặt](/vi/install)
- [Cập nhật](/vi/install/updating)
- [Gỡ cài đặt](/vi/install/uninstall)
