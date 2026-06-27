---
read_when:
    - Bạn muốn hiểu `openclaw.ai/install.sh`
    - Bạn muốn tự động hóa việc cài đặt (CI / không giao diện)
    - Bạn muốn cài đặt từ một bản checkout GitHub
summary: Cách các tập lệnh cài đặt hoạt động (install.sh, install-cli.sh, install.ps1), các cờ và tự động hóa
title: Chi tiết nội bộ của trình cài đặt
x-i18n:
    generated_at: "2026-06-27T17:37:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 72182472f423e64b33afa071feda76c2c9abdf896bffa269f2148124c49a451c
    source_path: install/installer.md
    workflow: 16
---

OpenClaw cung cấp ba script cài đặt, được phục vụ từ `openclaw.ai`.

| Script                             | Nền tảng             | Chức năng                                                                                                   |
| ---------------------------------- | -------------------- | -------------------------------------------------------------------------------------------------------------- |
| [`install.sh`](#installsh)         | macOS / Linux / WSL  | Cài đặt Node nếu cần, cài đặt OpenClaw qua npm (mặc định) hoặc git, và có thể chạy thiết lập ban đầu.                   |
| [`install-cli.sh`](#install-clish) | macOS / Linux / WSL  | Cài đặt Node + OpenClaw vào một tiền tố cục bộ (`~/.openclaw`) bằng chế độ npm hoặc git checkout. Không cần root. |
| [`install.ps1`](#installps1)       | Windows (PowerShell) | Cài đặt Node nếu cần, cài đặt OpenClaw qua npm (mặc định) hoặc git, và có thể chạy thiết lập ban đầu.                   |

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
Được khuyến nghị cho hầu hết các cài đặt tương tác trên macOS/Linux/WSL.
</Tip>

### Luồng (install.sh)

<Steps>
  <Step title="Phát hiện OS">
    Hỗ trợ macOS và Linux (bao gồm WSL).
  </Step>
  <Step title="Đảm bảo Node.js 24 theo mặc định">
    Kiểm tra phiên bản Node và cài đặt Node 24 nếu cần (Homebrew trên macOS, script thiết lập NodeSource trên Linux apt/dnf/yum). Trên macOS, Homebrew chỉ được cài đặt khi trình cài đặt cần nó cho Node hoặc Git. OpenClaw vẫn hỗ trợ Node 22 LTS, hiện là `22.19+`, để tương thích.
    Trên Alpine/musl Linux, trình cài đặt dùng gói apk thay vì NodeSource; các kho Alpine đã cấu hình phải cung cấp Node `22.19+` (Alpine 3.21 hoặc mới hơn tại thời điểm viết).
  </Step>
  <Step title="Đảm bảo Git">
    Cài đặt Git nếu thiếu bằng trình quản lý gói được phát hiện, bao gồm Homebrew trên macOS và apk trên Alpine.
  </Step>
  <Step title="Cài đặt OpenClaw">
    - Phương thức `npm` (mặc định): cài đặt npm toàn cục
    - Phương thức `git`: clone/cập nhật repo, cài đặt phụ thuộc bằng pnpm, build, rồi cài đặt wrapper tại `~/.local/bin/openclaw`

  </Step>
  <Step title="Tác vụ sau cài đặt">
    - Làm mới dịch vụ Gateway đã tải theo kiểu best-effort (`openclaw gateway install --force`, rồi khởi động lại)
    - Chạy `openclaw doctor --non-interactive` khi nâng cấp và cài đặt bằng git (best effort)
    - Thử thiết lập ban đầu khi phù hợp (có TTY, không tắt thiết lập ban đầu, và kiểm tra bootstrap/cấu hình đạt)

  </Step>
</Steps>

### Phát hiện source checkout

Nếu chạy bên trong một OpenClaw checkout (`package.json` + `pnpm-workspace.yaml`), script sẽ đề xuất:

- dùng checkout (`git`), hoặc
- dùng cài đặt toàn cục (`npm`)

Nếu không có TTY và chưa đặt phương thức cài đặt, mặc định là `npm` và cảnh báo.

Script thoát với mã `2` khi chọn phương thức không hợp lệ hoặc giá trị `--install-method` không hợp lệ.

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
  <Tab title="Checkout main trên GitHub">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git --version main
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
| `--install-method npm\|git`           | Chọn phương thức cài đặt (mặc định: `npm`). Bí danh: `--method`  |
| `--npm`                               | Lối tắt cho phương thức npm                                    |
| `--git`                               | Lối tắt cho phương thức git. Bí danh: `--github`                 |
| `--version <version\|dist-tag\|spec>` | Phiên bản npm, dist-tag, hoặc package spec (mặc định: `latest`) |
| `--beta`                              | Dùng beta dist-tag nếu có, nếu không thì fallback về `latest`  |
| `--git-dir <path>`                    | Thư mục checkout (mặc định: `~/openclaw`). Bí danh: `--dir` |
| `--no-git-update`                     | Bỏ qua `git pull` cho checkout hiện có                      |
| `--no-prompt`                         | Tắt lời nhắc                                            |
| `--no-onboard`                        | Bỏ qua thiết lập ban đầu                                            |
| `--onboard`                           | Bật thiết lập ban đầu                                          |
| `--dry-run`                           | In các hành động mà không áp dụng thay đổi                     |
| `--verbose`                           | Bật đầu ra gỡ lỗi (`set -x`, nhật ký npm mức notice)      |
| `--help`                              | Hiển thị cách dùng (`-h`)                                          |

  </Accordion>

  <Accordion title="Tham chiếu biến môi trường">

| Biến                                          | Mô tả                                                        |
| ------------------------------------------------- | ------------------------------------------------------------------ |
| `OPENCLAW_INSTALL_METHOD=git\|npm`                | Phương thức cài đặt                                                     |
| `OPENCLAW_VERSION=latest\|next\|<semver>\|<spec>` | Phiên bản npm, dist-tag, hoặc package spec                             |
| `OPENCLAW_BETA=0\|1`                              | Dùng beta nếu có                                              |
| `OPENCLAW_HOME=<path>`                            | Thư mục cơ sở cho trạng thái OpenClaw và đường dẫn git/thiết lập ban đầu mặc định |
| `OPENCLAW_GIT_DIR=<path>`                         | Thư mục checkout                                                 |
| `OPENCLAW_GIT_UPDATE=0\|1`                        | Bật/tắt cập nhật git                                                 |
| `OPENCLAW_NO_PROMPT=1`                            | Tắt lời nhắc                                                    |
| `OPENCLAW_NO_ONBOARD=1`                           | Bỏ qua thiết lập ban đầu                                                    |
| `OPENCLAW_DRY_RUN=1`                              | Chế độ chạy thử                                                       |
| `OPENCLAW_VERBOSE=1`                              | Chế độ gỡ lỗi                                                         |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice`       | Mức nhật ký npm                                                      |

  </Accordion>
</AccordionGroup>

---

<a id="install-clish"></a>

## install-cli.sh

<Info>
Được thiết kế cho các môi trường mà bạn muốn mọi thứ nằm dưới một tiền tố cục bộ
(mặc định `~/.openclaw`) và không phụ thuộc vào Node hệ thống. Hỗ trợ cài đặt npm
theo mặc định, cộng với cài đặt git-checkout trong cùng luồng tiền tố.
</Info>

### Luồng (install-cli.sh)

<Steps>
  <Step title="Cài đặt runtime Node cục bộ">
    Tải xuống tarball Node LTS được ghim và hỗ trợ (phiên bản được nhúng trong script và cập nhật độc lập) vào `<prefix>/tools/node-v<version>` và xác minh SHA-256.
    Trên Alpine/musl Linux, nơi Node không phát hành tarball tương thích cho runtime đã ghim, cài đặt `nodejs` và `npm` bằng `apk` và liên kết runtime đó vào đường dẫn wrapper của tiền tố. Các kho Alpine phải cung cấp Node `22.19+`; dùng Alpine 3.21 hoặc mới hơn nếu các kho cũ hơn chỉ cung cấp Node 20 hoặc 21.
  </Step>
  <Step title="Đảm bảo Git">
    Nếu thiếu Git, thử cài đặt qua apt/dnf/yum/apk trên Linux hoặc Homebrew trên macOS.
  </Step>
  <Step title="Cài đặt OpenClaw dưới tiền tố">
    - Phương thức `npm` (mặc định): cài đặt dưới tiền tố bằng npm, rồi ghi wrapper vào `<prefix>/bin/openclaw`
    - Phương thức `git`: clone/cập nhật một checkout (mặc định `~/openclaw`) và vẫn ghi wrapper vào `<prefix>/bin/openclaw`

  </Step>
  <Step title="Làm mới dịch vụ Gateway đã tải">
    Nếu một dịch vụ Gateway đã được tải từ chính tiền tố đó, script chạy
    `openclaw gateway install --force`, rồi `openclaw gateway restart`, và
    thăm dò trạng thái Gateway theo kiểu best-effort.
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
  <Accordion title="Tham chiếu flag">

| Cờ                          | Mô tả                                                                            |
| --------------------------- | ------------------------------------------------------------------------------- |
| `--prefix <path>`           | Tiền tố cài đặt (mặc định: `~/.openclaw`)                                        |
| `--install-method npm\|git` | Chọn phương thức cài đặt (mặc định: `npm`). Bí danh: `--method`                 |
| `--npm`                     | Lối tắt cho phương thức npm                                                      |
| `--git`, `--github`         | Lối tắt cho phương thức git                                                      |
| `--git-dir <path>`          | Thư mục checkout Git (mặc định: `~/openclaw`). Bí danh: `--dir`                 |
| `--version <ver>`           | Phiên bản OpenClaw hoặc dist-tag (mặc định: `latest`)                           |
| `--node-version <ver>`      | Phiên bản Node (mặc định: `22.22.0`)                                             |
| `--json`                    | Phát ra sự kiện NDJSON                                                           |
| `--onboard`                 | Chạy `openclaw onboard` sau khi cài đặt                                          |
| `--no-onboard`              | Bỏ qua onboarding (mặc định)                                                     |
| `--set-npm-prefix`          | Trên Linux, ép tiền tố npm thành `~/.npm-global` nếu tiền tố hiện tại không ghi được |
| `--help`                    | Hiển thị cách dùng (`-h`)                                                        |

  </Accordion>

  <Accordion title="Tham chiếu biến môi trường">

| Biến                                        | Mô tả                                                              |
| ------------------------------------------- | ------------------------------------------------------------------ |
| `OPENCLAW_PREFIX=<path>`                    | Tiền tố cài đặt                                                    |
| `OPENCLAW_INSTALL_METHOD=git\|npm`          | Phương thức cài đặt                                                |
| `OPENCLAW_VERSION=<ver>`                    | Phiên bản OpenClaw hoặc dist-tag                                   |
| `OPENCLAW_NODE_VERSION=<ver>`               | Phiên bản Node                                                     |
| `OPENCLAW_HOME=<path>`                      | Thư mục cơ sở cho trạng thái OpenClaw và đường dẫn git/onboarding mặc định |
| `OPENCLAW_GIT_DIR=<path>`                   | Thư mục checkout Git cho các bản cài đặt git                       |
| `OPENCLAW_GIT_UPDATE=0\|1`                  | Bật/tắt cập nhật git cho các checkout hiện có                      |
| `OPENCLAW_NO_ONBOARD=1`                     | Bỏ qua onboarding                                                  |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice` | Mức ghi log npm                                                    |

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
    Nếu thiếu, thử cài đặt qua winget, rồi Chocolatey, rồi Scoop. Nếu không có trình quản lý gói nào khả dụng, tập lệnh tải xuống tệp zip Windows chính thức của Node.js vào `%LOCALAPPDATA%\OpenClaw\deps\portable-node` và thêm nó vào PATH của tiến trình hiện tại và người dùng. Node 22 LTS, hiện là `22.19+`, vẫn được hỗ trợ để tương thích.
  </Step>
  <Step title="Cài đặt OpenClaw">
    - Phương thức `npm` (mặc định): cài đặt npm toàn cục bằng `-Tag` đã chọn, được khởi chạy từ thư mục tạm của trình cài đặt có thể ghi để các shell mở trong thư mục được bảo vệ như `C:\` vẫn hoạt động
    - Phương thức `git`: clone/cập nhật repo, cài đặt/biên dịch bằng pnpm, và cài đặt wrapper tại `%USERPROFILE%\.local\bin\openclaw.cmd`. Nếu thiếu Git, tập lệnh bootstrap MinGit cục bộ theo người dùng trong `%LOCALAPPDATA%\OpenClaw\deps\portable-git` và thêm nó vào PATH của tiến trình hiện tại và người dùng.

  </Step>
  <Step title="Tác vụ sau cài đặt">
    - Thêm thư mục bin cần thiết vào PATH của người dùng khi có thể
    - Làm mới dịch vụ gateway đã tải theo khả năng tốt nhất (`openclaw gateway install --force`, rồi khởi động lại)
    - Chạy `openclaw doctor --non-interactive` khi nâng cấp và cài đặt bằng git (theo khả năng tốt nhất)

  </Step>
  <Step title="Xử lý lỗi">
    Các bản cài đặt `iwr ... | iex` và scriptblock báo cáo lỗi kết thúc mà không đóng phiên PowerShell hiện tại. Các bản cài đặt trực tiếp `powershell -File` / `pwsh -File` vẫn thoát với mã khác 0 cho tự động hóa.
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
  <Tab title="Checkout main GitHub">
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
  <Tab title="Theo dõi gỡ lỗi">
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
| `-Tag <tag\|version\|spec>` | dist-tag npm, phiên bản, hoặc đặc tả gói (mặc định: `latest`) |
| `-GitDir <path>`            | Thư mục checkout (mặc định: `%USERPROFILE%\openclaw`)      |
| `-NoOnboard`                | Bỏ qua onboarding                                          |
| `-NoGitUpdate`              | Bỏ qua `git pull`                                          |
| `-DryRun`                   | Chỉ in các hành động                                       |

  </Accordion>

  <Accordion title="Tham chiếu biến môi trường">

| Biến                               | Mô tả                 |
| ---------------------------------- | --------------------- |
| `OPENCLAW_INSTALL_METHOD=git\|npm` | Phương thức cài đặt   |
| `OPENCLAW_GIT_DIR=<path>`          | Thư mục checkout      |
| `OPENCLAW_NO_ONBOARD=1`            | Bỏ qua onboarding     |
| `OPENCLAW_GIT_UPDATE=0`            | Tắt `git pull`        |
| `OPENCLAW_DRY_RUN=1`               | Chế độ chạy thử       |

  </Accordion>
</AccordionGroup>

<Note>
Nếu dùng `-InstallMethod git` và thiếu Git, tập lệnh thử bootstrap MinGit cục bộ theo người dùng trước khi in liên kết Git for Windows.
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
    Git là bắt buộc cho phương thức cài đặt `git`. Với các bản cài đặt `npm`, Git vẫn được kiểm tra/cài đặt để tránh lỗi `spawn git ENOENT` khi các phụ thuộc dùng URL git.
  </Accordion>

  <Accordion title="Tại sao npm gặp EACCES trên Linux?">
    Một số thiết lập Linux trỏ tiền tố toàn cục của npm tới các đường dẫn thuộc sở hữu root. `install.sh` có thể chuyển tiền tố sang `~/.npm-global` và thêm các export PATH vào tệp rc của shell (khi các tệp đó tồn tại).
  </Accordion>

  <Accordion title='Windows: "npm error spawn git / ENOENT"'>
    Chạy lại trình cài đặt để nó có thể bootstrap MinGit cục bộ theo người dùng, hoặc cài đặt Git for Windows và mở lại PowerShell.
  </Accordion>

  <Accordion title='Windows: "openclaw is not recognized"'>
    Chạy `npm config get prefix` và thêm thư mục đó vào PATH của người dùng (không cần hậu tố `\bin` trên Windows), rồi mở lại PowerShell.
  </Accordion>

  <Accordion title="Windows: cách lấy đầu ra chi tiết của trình cài đặt">
    `install.ps1` hiện chưa cung cấp công tắc `-Verbose`.
    Dùng theo dõi PowerShell để chẩn đoán ở cấp tập lệnh:

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
