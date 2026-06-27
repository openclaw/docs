---
read_when:
    - Bạn cần cài đặt Node.js trước khi cài đặt OpenClaw
    - Bạn đã cài đặt OpenClaw nhưng `openclaw` báo không tìm thấy lệnh
    - Cài đặt `npm install -g` thất bại do vấn đề về quyền hoặc PATH
summary: Cài đặt và cấu hình Node.js cho OpenClaw - yêu cầu phiên bản, tùy chọn cài đặt và khắc phục sự cố PATH
title: Node.js
x-i18n:
    generated_at: "2026-06-27T17:38:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 90a2461458fd9995df264753259a3297b8aa316f9e4efd8290e527cbb46fc4e3
    source_path: install/node.md
    workflow: 16
---

OpenClaw yêu cầu **Node 22.19 trở lên**. **Node 24 là runtime mặc định và được khuyến nghị** cho cài đặt, CI và quy trình phát hành. Node 22 vẫn được hỗ trợ thông qua nhánh LTS đang hoạt động. [Tập lệnh cài đặt](/vi/install#alternative-install-methods) sẽ tự động phát hiện và cài đặt Node - trang này dành cho khi bạn muốn tự thiết lập Node và bảo đảm mọi thứ được kết nối đúng cách (phiên bản, PATH, cài đặt toàn cục).

## Kiểm tra phiên bản của bạn

```bash
node -v
```

Nếu lệnh này in ra `v24.x.x` hoặc cao hơn, bạn đang dùng mặc định được khuyến nghị. Nếu nó in ra `v22.19.x` hoặc cao hơn, bạn đang dùng lộ trình Node 22 LTS được hỗ trợ, nhưng chúng tôi vẫn khuyến nghị nâng cấp lên Node 24 khi thuận tiện. Nếu Node chưa được cài đặt hoặc phiên bản quá cũ, hãy chọn một phương thức cài đặt bên dưới.

## Cài đặt Node

<Tabs>
  <Tab title="macOS">
    **Homebrew** (khuyến nghị):

    ```bash
    brew install node
    ```

    Hoặc tải trình cài đặt macOS từ [nodejs.org](https://nodejs.org/).

  </Tab>
  <Tab title="Linux">
    **Ubuntu / Debian:**

    ```bash
    curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
    sudo apt-get install -y nodejs
    ```

    **Fedora / RHEL:**

    ```bash
    sudo dnf install nodejs
    ```

    Hoặc dùng trình quản lý phiên bản (xem bên dưới).

  </Tab>
  <Tab title="Windows">
    **winget** (khuyến nghị):

    ```powershell
    winget install OpenJS.NodeJS.LTS
    ```

    **Chocolatey:**

    ```powershell
    choco install nodejs-lts
    ```

    Hoặc tải trình cài đặt Windows từ [nodejs.org](https://nodejs.org/).

  </Tab>
</Tabs>

<Accordion title="Sử dụng trình quản lý phiên bản (nvm, fnm, mise, asdf)">
  Trình quản lý phiên bản cho phép bạn dễ dàng chuyển đổi giữa các phiên bản Node. Các lựa chọn phổ biến:

- [**fnm**](https://github.com/Schniz/fnm) - nhanh, đa nền tảng
- [**nvm**](https://github.com/nvm-sh/nvm) - được dùng rộng rãi trên macOS/Linux
- [**mise**](https://mise.jdx.dev/) - đa ngôn ngữ (Node, Python, Ruby, v.v.)

Ví dụ với fnm:

```bash
fnm install 24
fnm use 24
```

  <Warning>
  Hãy bảo đảm trình quản lý phiên bản của bạn được khởi tạo trong tệp khởi động shell (`~/.zshrc` hoặc `~/.bashrc`). Nếu không, `openclaw` có thể không được tìm thấy trong các phiên terminal mới vì PATH sẽ không bao gồm thư mục bin của Node.
  </Warning>
</Accordion>

## Khắc phục sự cố

### `openclaw: command not found`

Điều này hầu như luôn có nghĩa là thư mục bin toàn cục của npm không nằm trong PATH của bạn.

<Steps>
  <Step title="Tìm tiền tố npm toàn cục của bạn">
    ```bash
    npm prefix -g
    ```
  </Step>
  <Step title="Kiểm tra xem nó có nằm trong PATH của bạn không">
    ```bash
    echo "$PATH"
    ```

    Tìm `<npm-prefix>/bin` (macOS/Linux) hoặc `<npm-prefix>` (Windows) trong đầu ra.

  </Step>
  <Step title="Thêm nó vào tệp khởi động shell của bạn">
    <Tabs>
      <Tab title="macOS / Linux">
        Thêm vào `~/.zshrc` hoặc `~/.bashrc`:

        ```bash
        export PATH="$(npm prefix -g)/bin:$PATH"
        ```

        Sau đó mở một terminal mới (hoặc chạy `rehash` trong zsh / `hash -r` trong bash).
      </Tab>
      <Tab title="Windows">
        Thêm đầu ra của `npm prefix -g` vào PATH hệ thống của bạn qua Settings → System → Environment Variables.
      </Tab>
    </Tabs>

  </Step>
</Steps>

### Lỗi quyền trên `npm install -g` (Linux)

Nếu bạn thấy lỗi `EACCES`, hãy chuyển tiền tố toàn cục của npm sang một thư mục mà người dùng có quyền ghi:

```bash
mkdir -p "$HOME/.npm-global"
npm config set prefix "$HOME/.npm-global"
export PATH="$HOME/.npm-global/bin:$PATH"
```

Thêm dòng `export PATH=...` vào `~/.bashrc` hoặc `~/.zshrc` của bạn để áp dụng vĩnh viễn.

## Liên quan

- [Tổng quan cài đặt](/vi/install) - tất cả phương thức cài đặt
- [Cập nhật](/vi/install/updating) - giữ OpenClaw luôn cập nhật
- [Bắt đầu](/vi/start/getting-started) - các bước đầu tiên sau khi cài đặt
