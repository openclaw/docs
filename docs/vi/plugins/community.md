---
read_when:
    - Bạn muốn tìm các Plugin OpenClaw của bên thứ ba
    - Bạn muốn xuất bản hoặc đưa Plugin của riêng mình vào danh sách
summary: 'Các plugin OpenClaw do cộng đồng duy trì: duyệt, cài đặt và gửi plugin của riêng bạn'
title: Plugin cộng đồng
x-i18n:
    generated_at: "2026-04-30T09:37:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9685aaf141b739a2a745a6184201ac86689e4284bec6eb068ffbd0d53fb4ecf1
    source_path: plugins/community.md
    workflow: 16
---

Plugin cộng đồng là các gói của bên thứ ba mở rộng OpenClaw bằng các
kênh, công cụ, nhà cung cấp hoặc năng lực khác mới. Chúng được cộng đồng xây dựng
và duy trì, thường được phát hành trên [ClawHub](/vi/tools/clawhub), và có thể cài đặt
bằng một lệnh duy nhất. Npm vẫn là phương án dự phòng được hỗ trợ cho các gói
chưa chuyển sang ClawHub.

ClawHub là bề mặt khám phá chính thức cho plugin cộng đồng. Đừng mở PR chỉ cho tài liệu
chỉ để thêm plugin của bạn vào đây nhằm tăng khả năng khám phá; thay vào đó hãy phát hành plugin đó trên
ClawHub.

```bash
openclaw plugins install <package-name>
```

OpenClaw kiểm tra ClawHub trước và tự động chuyển sang npm nếu cần.

## Plugin được liệt kê

### Apify

Thu thập dữ liệu từ bất kỳ trang web nào với hơn 20.000 trình thu thập dữ liệu dựng sẵn. Hãy để agent của bạn
trích xuất dữ liệu từ Instagram, Facebook, TikTok, YouTube, Google Maps, Google
Search, các trang thương mại điện tử và nhiều nguồn khác — chỉ bằng cách yêu cầu.

- **npm:** `@apify/apify-openclaw-plugin`
- **kho mã nguồn:** [github.com/apify/apify-openclaw-plugin](https://github.com/apify/apify-openclaw-plugin)

```bash
openclaw plugins install @apify/apify-openclaw-plugin
```

### Codex App Server Bridge

Cầu nối OpenClaw độc lập cho các cuộc trò chuyện Codex App Server. Gắn một cuộc trò chuyện với
một luồng Codex, trao đổi bằng văn bản thuần túy, và điều khiển bằng các lệnh
nguyên bản trong trò chuyện để tiếp tục, lập kế hoạch, đánh giá, chọn mô hình, Compaction và nhiều hơn nữa.

- **npm:** `openclaw-codex-app-server`
- **kho mã nguồn:** [github.com/pwrdrvr/openclaw-codex-app-server](https://github.com/pwrdrvr/openclaw-codex-app-server)

```bash
openclaw plugins install openclaw-codex-app-server
```

### DingTalk

Tích hợp robot doanh nghiệp bằng chế độ Stream. Hỗ trợ tin nhắn văn bản, hình ảnh và
tệp qua bất kỳ ứng dụng khách DingTalk nào.

- **npm:** `@largezhou/ddingtalk`
- **kho mã nguồn:** [github.com/largezhou/openclaw-dingtalk](https://github.com/largezhou/openclaw-dingtalk)

```bash
openclaw plugins install @largezhou/ddingtalk
```

### Lossless Claw (LCM)

Plugin Lossless Context Management cho OpenClaw. Tóm tắt cuộc trò chuyện dựa trên DAG
với compaction tăng dần — giữ nguyên độ trung thực đầy đủ của ngữ cảnh
trong khi giảm mức sử dụng token.

- **npm:** `@martian-engineering/lossless-claw`
- **kho mã nguồn:** [github.com/Martian-Engineering/lossless-claw](https://github.com/Martian-Engineering/lossless-claw)

```bash
openclaw plugins install @martian-engineering/lossless-claw
```

### Opik

Plugin chính thức xuất dấu vết agent sang Opik. Theo dõi hành vi agent,
chi phí, token, lỗi và nhiều thông tin khác.

- **npm:** `@opik/opik-openclaw`
- **kho mã nguồn:** [github.com/comet-ml/opik-openclaw](https://github.com/comet-ml/opik-openclaw)

```bash
openclaw plugins install @opik/opik-openclaw
```

### Prometheus Avatar

Cung cấp cho agent OpenClaw của bạn một avatar Live2D với đồng bộ môi theo thời gian thực, biểu cảm
cảm xúc và chuyển văn bản thành giọng nói. Bao gồm công cụ dành cho người sáng tạo để tạo tài sản AI
và triển khai một lần nhấp lên Prometheus Marketplace. Hiện đang ở giai đoạn alpha.

- **npm:** `@prometheusavatar/openclaw-plugin`
- **kho mã nguồn:** [github.com/myths-labs/prometheus-avatar](https://github.com/myths-labs/prometheus-avatar)

```bash
openclaw plugins install @prometheusavatar/openclaw-plugin
```

### QQbot

Kết nối OpenClaw với QQ qua QQ Bot API. Hỗ trợ trò chuyện riêng, nhắc đến trong nhóm,
tin nhắn kênh và đa phương tiện phong phú gồm giọng nói, hình ảnh, video
và tệp.

Các bản phát hành OpenClaw hiện tại đã kèm sẵn QQ Bot. Dùng thiết lập đi kèm trong
[QQ Bot](/vi/channels/qqbot) cho cài đặt thông thường; chỉ cài plugin bên ngoài này
khi bạn chủ ý muốn dùng gói độc lập do Tencent duy trì.

- **npm:** `@tencent-connect/openclaw-qqbot`
- **kho mã nguồn:** [github.com/tencent-connect/openclaw-qqbot](https://github.com/tencent-connect/openclaw-qqbot)

```bash
openclaw plugins install @tencent-connect/openclaw-qqbot
```

### wecom

Plugin kênh WeCom cho OpenClaw của đội ngũ Tencent WeCom. Được hỗ trợ bởi
kết nối liên tục WebSocket WeCom Bot, plugin này hỗ trợ tin nhắn trực tiếp và trò chuyện nhóm,
phản hồi dạng streaming, nhắn tin chủ động, xử lý hình ảnh/tệp, định dạng Markdown,
kiểm soát truy cập tích hợp sẵn và các kỹ năng tài liệu/cuộc họp/nhắn tin.

- **npm:** `@wecom/wecom-openclaw-plugin`
- **kho mã nguồn:** [github.com/WecomTeam/wecom-openclaw-plugin](https://github.com/WecomTeam/wecom-openclaw-plugin)

```bash
openclaw plugins install @wecom/wecom-openclaw-plugin
```

### Yuanbao

Plugin kênh Yuanbao cho OpenClaw của đội ngũ Tencent Yuanbao. Được hỗ trợ bởi
kết nối liên tục WebSocket, plugin này hỗ trợ tin nhắn trực tiếp và trò chuyện nhóm,
phản hồi dạng streaming, nhắn tin chủ động, xử lý hình ảnh/tệp/âm thanh/video,
định dạng Markdown, kiểm soát truy cập tích hợp sẵn và menu lệnh gạch chéo.

- **npm:** `openclaw-plugin-yuanbao`
- **kho mã nguồn:** [github.com/YuanbaoTeam/yuanbao-openclaw-plugin](https://github.com/YuanbaoTeam/yuanbao-openclaw-plugin)

```bash
openclaw plugins install openclaw-plugin-yuanbao
```

## Gửi plugin của bạn

Chúng tôi hoan nghênh các plugin cộng đồng hữu ích, có tài liệu và an toàn khi vận hành.

<Steps>
  <Step title="Phát hành lên ClawHub hoặc npm">
    Plugin của bạn phải có thể cài đặt qua `openclaw plugins install \<package-name\>`.
    Phát hành lên [ClawHub](/vi/tools/clawhub) trừ khi bạn đặc biệt cần phân phối
    chỉ qua npm.
    Xem [Xây dựng Plugin](/vi/plugins/building-plugins) để biết hướng dẫn đầy đủ.

  </Step>

  <Step title="Lưu trữ trên GitHub">
    Mã nguồn phải nằm trong một kho lưu trữ công khai có tài liệu thiết lập và trình theo dõi
    vấn đề.

  </Step>

  <Step title="Chỉ dùng PR tài liệu cho thay đổi tài liệu nguồn">
    Bạn không cần PR tài liệu chỉ để giúp plugin của mình dễ được tìm thấy. Thay vào đó hãy phát hành plugin đó
    trên ClawHub.

    Chỉ mở PR tài liệu khi tài liệu nguồn của OpenClaw cần thay đổi nội dung thực sự,
    chẳng hạn như sửa hướng dẫn cài đặt hoặc thêm tài liệu liên kho mã nguồn
    thuộc về bộ tài liệu chính.

  </Step>
</Steps>

## Tiêu chuẩn chất lượng

| Yêu cầu                     | Lý do                                             |
| --------------------------- | ------------------------------------------------- |
| Đã phát hành trên ClawHub hoặc npm | Người dùng cần `openclaw plugins install` hoạt động |
| Kho mã nguồn GitHub công khai | Đánh giá mã nguồn, theo dõi vấn đề, minh bạch     |
| Tài liệu thiết lập và sử dụng | Người dùng cần biết cách cấu hình plugin          |
| Bảo trì tích cực            | Có cập nhật gần đây hoặc xử lý vấn đề kịp thời    |

Các trình bao bọc ít đầu tư, quyền sở hữu không rõ ràng hoặc gói không được duy trì có thể bị từ chối.

## Liên quan

- [Cài đặt và cấu hình Plugin](/vi/tools/plugin) — cách cài đặt bất kỳ plugin nào
- [Xây dựng Plugin](/vi/plugins/building-plugins) — tạo plugin của riêng bạn
- [Bản kê khai Plugin](/vi/plugins/manifest) — lược đồ bản kê khai
