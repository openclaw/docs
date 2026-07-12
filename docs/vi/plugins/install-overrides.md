---
read_when:
    - Kiểm thử các quy trình hướng dẫn ban đầu hoặc thiết lập bằng Plugin được đóng gói cục bộ
    - Xác minh gói Plugin trước khi phát hành
    - Thay thế quá trình cài đặt plugin tự động bằng một bản dựng thử nghiệm
sidebarTitle: Install overrides
summary: Kiểm thử cơ chế ghi đè Plugin đã đóng gói bằng các luồng cài đặt trong quá trình thiết lập
title: Ghi đè cài đặt Plugin
x-i18n:
    generated_at: "2026-07-12T08:07:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: adc823f49ea9f8fa86e6a89933e43fdc309d808ac24397770495dbe81cb4b0d7
    source_path: plugins/install-overrides.md
    workflow: 16
---

Các giá trị ghi đè cài đặt Plugin cho phép người bảo trì chuyển hướng việc cài đặt Plugin trong quá trình thiết lập đến một gói npm cụ thể hoặc tarball npm-pack cục bộ thay vì nguồn từ danh mục, gói tích hợp sẵn hoặc npm mặc định. Chúng chỉ dành cho E2E và việc xác thực gói; người dùng thông thường cài đặt Plugin bằng
[`openclaw plugins install`](/vi/cli/plugins).

<Warning>
Các giá trị ghi đè sẽ thực thi mã Plugin từ nguồn bạn cung cấp. Chỉ sử dụng chúng trong một thư mục trạng thái biệt lập hoặc trên máy kiểm thử dùng một lần.
</Warning>

## Môi trường

Các giá trị ghi đè bị vô hiệu hóa trừ khi cả hai biến đều được đặt:

```bash
export OPENCLAW_ALLOW_PLUGIN_INSTALL_OVERRIDES=1
export OPENCLAW_PLUGIN_INSTALL_OVERRIDES='{
  "codex": "npm-pack:/tmp/openclaw-codex-2026.5.8.tgz",
  "openclaw-web-search": "npm:@openclaw/web-search@2026.5.8"
}'
```

Ánh xạ ghi đè là JSON với khóa là mã định danh Plugin. Các giá trị hỗ trợ:

| Tiền tố               | Nguồn                                                                                            |
| --------------------- | ------------------------------------------------------------------------------------------------ |
| `npm:<registry-spec>` | Gói từ registry, phiên bản chính xác hoặc thẻ                                                     |
| `npm-pack:<path.tgz>` | Tarball cục bộ được tạo bởi `npm pack`; đường dẫn tương đối được phân giải từ thư mục làm việc hiện tại |

## Hành vi

Khi một luồng trong quá trình thiết lập cài đặt Plugin có mã định danh xuất hiện trong ánh xạ, OpenClaw sử dụng nguồn ghi đè thay cho nguồn từ danh mục, gói tích hợp sẵn hoặc npm mặc định. Điều này áp dụng cho quá trình hướng dẫn thiết lập ban đầu và mọi luồng khác sử dụng trình cài đặt Plugin dùng chung trong quá trình thiết lập.

- Các giá trị ghi đè vẫn bắt buộc mã định danh Plugin phải khớp với giá trị mong đợi: tarball được ánh xạ tới `codex` phải cài đặt một Plugin có mã định danh trong manifest là `codex`.
- Các giá trị ghi đè không kế thừa trạng thái nguồn chính thức đáng tin cậy. Ngay cả khi mục trong danh mục thường đại diện cho một gói thuộc sở hữu của OpenClaw, giá trị ghi đè vẫn được xem là đầu vào kiểm thử do người vận hành cung cấp.
- Các tệp `.env` trong workspace không thể bật giá trị ghi đè cài đặt; cả hai biến môi trường đều nằm trong danh sách dotenv bị chặn của workspace. Hãy đặt chúng trong shell đáng tin cậy, tác vụ CI hoặc lệnh kiểm thử từ xa dùng để khởi chạy OpenClaw.

## E2E gói

Sử dụng một thư mục trạng thái biệt lập để quá trình cài đặt gói và các bản ghi cài đặt không ảnh hưởng đến trạng thái OpenClaw thông thường của bạn:

```bash
npm pack extensions/codex --pack-destination /tmp

OPENCLAW_STATE_DIR="$(mktemp -d)" \
OPENCLAW_ALLOW_PLUGIN_INSTALL_OVERRIDES=1 \
OPENCLAW_PLUGIN_INSTALL_OVERRIDES='{"codex":"npm-pack:/tmp/openclaw-codex-2026.5.8.tgz"}' \
pnpm openclaw onboard --mode local
```

Xác minh gói đã cài đặt trong thư mục trạng thái:

```bash
find "$OPENCLAW_STATE_DIR/npm/projects" -path '*/node_modules/@openclaw/codex/package.json' -print
grep -R '"@openclaw/codex"' "$OPENCLAW_STATE_DIR/npm/projects"/*/package-lock.json
```

Đối với E2E nhà cung cấp trực tiếp, hãy nạp khóa API thực từ shell đáng tin cậy hoặc secret CI trước khi khởi chạy lệnh kiểm thử. Không in khóa; chỉ báo cáo nguồn và khóa có hiện diện hay không.
