---
read_when:
    - Bạn cần cài đặt Node.js trước khi cài đặt OpenClaw
    - Bạn đã cài đặt OpenClaw nhưng lệnh `openclaw` không được tìm thấy
    - npm install -g thất bại do vấn đề về quyền hoặc PATH
summary: Cài đặt và cấu hình Node.js cho OpenClaw - yêu cầu về phiên bản, các tùy chọn cài đặt và khắc phục sự cố PATH
title: Node.js
x-i18n:
    generated_at: "2026-07-16T15:24:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: ef4df255c24a11a549c757b597a07b00852e60973a5e513bdcf60796037a462a
    source_path: install/node.md
    workflow: 16
---

OpenClaw yêu cầu **Node 22.22.3+, Node 24.15+ hoặc Node 25.9+**. **Node 24 là runtime mặc định và được khuyến nghị** cho quy trình cài đặt, CI và phát hành; Node 22 vẫn được hỗ trợ thông qua nhánh LTS đang hoạt động. Node 23 không được hỗ trợ. [Tập lệnh cài đặt](/vi/install#alternative-install-methods) tự động phát hiện và cài đặt Node — hãy sử dụng trang này khi bạn muốn tự thiết lập Node (phiên bản, PATH, cài đặt toàn cục).

## Kiểm tra phiên bản

```bash
node -v
```

Khuyến nghị mặc định là `v24.15.0` hoặc phiên bản 24.x mới hơn. `v22.22.3` hoặc phiên bản 22.x mới hơn là lộ trình Node 22 LTS được hỗ trợ; Node `v25.9.0+` cũng được hỗ trợ. Node 23 không được hỗ trợ. Nếu chưa có Node hoặc phiên bản nằm ngoài phạm vi được hỗ trợ, hãy chọn một phương thức cài đặt bên dưới.

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

    Hoặc sử dụng trình quản lý phiên bản (xem bên dưới).

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
- [**nvm**](https://github.com/nvm-sh/nvm) - được sử dụng rộng rãi trên macOS/Linux
- [**mise**](https://mise.jdx.dev/) - hỗ trợ nhiều ngôn ngữ (Node, Python, Ruby, v.v.)

Ví dụ với fnm:

```bash
fnm install 24
fnm use 24
```

  <Warning>
  Khởi tạo trình quản lý phiên bản trong tệp khởi động shell (`~/.zshrc` hoặc `~/.bashrc`). Nếu bỏ qua bước này, hệ thống có thể không tìm thấy `openclaw` trong các phiên terminal mới vì PATH không chứa thư mục bin của Node.
  </Warning>
</Accordion>

## Khắc phục sự cố

### `openclaw: command not found`

Điều này hầu như luôn có nghĩa là thư mục bin toàn cục của npm không nằm trong PATH.

<Steps>
  <Step title="Tìm tiền tố npm toàn cục">
    ```bash
    npm prefix -g
    ```
  </Step>
  <Step title="Kiểm tra xem tiền tố có nằm trong PATH hay không">
    ```bash
    echo "$PATH"
    ```

    Tìm `<npm-prefix>/bin` (macOS/Linux) hoặc `<npm-prefix>` (Windows) trong đầu ra.

  </Step>
  <Step title="Thêm tiền tố vào tệp khởi động shell">
    <Tabs>
      <Tab title="macOS / Linux">
        Thêm vào `~/.zshrc` hoặc `~/.bashrc`:

        ```bash
        export PATH="$(npm prefix -g)/bin:$PATH"
        ```

        Sau đó mở một terminal mới (hoặc chạy `rehash` trong zsh / `hash -r` trong bash).
      </Tab>
      <Tab title="Windows">
        Thêm đầu ra của `npm prefix -g` vào PATH hệ thống qua Settings → System → Environment Variables.
      </Tab>
    </Tabs>

  </Step>
</Steps>

### Lỗi quyền đối với `npm install -g` (Linux)

Nếu bạn thấy lỗi `EACCES`, hãy chuyển tiền tố toàn cục của npm sang một thư mục mà người dùng có quyền ghi:

```bash
mkdir -p "$HOME/.npm-global"
npm config set prefix "$HOME/.npm-global"
export PATH="$HOME/.npm-global/bin:$PATH"
```

Thêm dòng `export PATH=...` vào `~/.bashrc` hoặc `~/.zshrc` để áp dụng vĩnh viễn.

## Liên quan

- [Tổng quan về cài đặt](/vi/install) - tất cả phương thức cài đặt
- [Cập nhật](/vi/install/updating) - duy trì OpenClaw ở phiên bản mới nhất
- [Bắt đầu](/vi/start/getting-started) - các bước đầu tiên sau khi cài đặt
