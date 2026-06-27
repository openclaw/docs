---
read_when:
    - Kiểm thử các luồng hướng dẫn ban đầu hoặc thiết lập với Plugin được đóng gói cục bộ
    - Xác minh một gói Plugin trước khi phát hành
    - Thay thế một lượt cài đặt Plugin tự động bằng một artifact kiểm thử
sidebarTitle: Install overrides
summary: Kiểm thử các ghi đè Plugin đã đóng gói với các luồng cài đặt trong thời gian thiết lập
title: Ghi đè khi cài đặt Plugin
x-i18n:
    generated_at: "2026-06-27T17:47:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9ac3d8074f0455a3287c22447d134bebf57805bc06302652172eb5f87e47e548
    source_path: plugins/install-overrides.md
    workflow: 16
---

Ghi đè cài đặt Plugin cho phép maintainer kiểm thử các lượt cài đặt plugin tại thời điểm thiết lập với
một gói npm cụ thể hoặc tarball npm-pack cục bộ. Chúng chỉ dành cho E2E và xác thực
gói. Người dùng thông thường nên cài đặt plugin bằng
[`openclaw plugins install`](/vi/cli/plugins).

<Warning>
Ghi đè thực thi mã plugin từ nguồn bạn cung cấp. Chỉ sử dụng chúng trong một
thư mục trạng thái cô lập hoặc máy kiểm thử dùng một lần.
</Warning>

## Môi trường

Ghi đè bị tắt trừ khi cả hai biến đều được đặt:

```bash
export OPENCLAW_ALLOW_PLUGIN_INSTALL_OVERRIDES=1
export OPENCLAW_PLUGIN_INSTALL_OVERRIDES='{
  "codex": "npm-pack:/tmp/openclaw-codex-2026.5.8.tgz",
  "openclaw-web-search": "npm:@openclaw/web-search@2026.5.8"
}'
```

Bản đồ ghi đè là JSON được khóa theo id plugin. Giá trị hỗ trợ:

- `npm:<registry-spec>` cho các gói registry và phiên bản hoặc thẻ chính xác
- `npm-pack:<path.tgz>` cho tarball cục bộ được tạo bởi `npm pack`

Đường dẫn `npm-pack:` tương đối được phân giải từ thư mục làm việc hiện tại.

## Hành vi

Khi một luồng tại thời điểm thiết lập yêu cầu cài đặt một plugin có id xuất hiện trong bản đồ,
OpenClaw sử dụng nguồn ghi đè thay vì nguồn npm từ catalog, gói kèm, hoặc mặc định.
Điều này áp dụng cho onboarding và các luồng khác sử dụng trình cài đặt plugin
tại thời điểm thiết lập dùng chung.

Ghi đè vẫn thực thi id plugin kỳ vọng. Một tarball được ánh xạ tới `codex`
phải cài đặt một plugin có id manifest là `codex`.

Ghi đè không kế thừa trạng thái nguồn tin cậy chính thức. Ngay cả khi mục catalog
thường đại diện cho một gói do OpenClaw sở hữu, ghi đè vẫn được xem là
đầu vào kiểm thử do người vận hành cung cấp.

Các tệp `.env` trong workspace không thể bật ghi đè cài đặt. Hãy đặt các biến này trong
shell tin cậy, job CI, hoặc lệnh kiểm thử từ xa khởi chạy OpenClaw.

## E2E gói

Sử dụng một thư mục trạng thái cô lập để các lượt cài đặt gói và bản ghi cài đặt không
chạm vào trạng thái OpenClaw thông thường của bạn:

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

Đối với E2E nhà cung cấp trực tiếp, lấy khóa API thật từ shell tin cậy hoặc secret CI
trước khi khởi chạy lệnh kiểm thử. Không in khóa; chỉ báo cáo nguồn và
khóa có hiện diện hay không.
