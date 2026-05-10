---
read_when:
    - Bạn muốn tìm các Plugin OpenClaw của bên thứ ba
    - Bạn muốn phát hành hoặc đưa Plugin của riêng mình vào danh sách
summary: 'Các Plugin OpenClaw do cộng đồng duy trì: duyệt, cài đặt và gửi Plugin của riêng bạn'
title: Plugin cộng đồng
x-i18n:
    generated_at: "2026-05-10T19:42:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: ee23598011f79f46b9171296501605cf0a5ef5aa7b67040135ea47cac21ca6a4
    source_path: plugins/community.md
    workflow: 16
---

Các plugin cộng đồng là các gói bên thứ ba mở rộng OpenClaw với các
kênh, công cụ, provider hoặc năng lực khác mới. Chúng được cộng đồng xây dựng
và duy trì, thường được phát hành trên [ClawHub](/vi/clawhub), và có thể cài đặt
bằng một lệnh duy nhất. Npm vẫn là mặc định khởi chạy cho đặc tả gói trần
trong khi cài đặt gói ClawHub được triển khai.

ClawHub là bề mặt khám phá chính thức cho các plugin cộng đồng. Đừng mở
PR chỉ dành cho tài liệu chỉ để thêm plugin của bạn vào đây nhằm tăng khả năng
được khám phá; thay vào đó hãy phát hành nó trên ClawHub.

```bash
openclaw plugins install clawhub:<package-name>
```

Dùng `openclaw plugins install <package-name>` cho các gói được lưu trữ trên npm.

## Các plugin được liệt kê

### Apify

Thu thập dữ liệu từ bất kỳ trang web nào với hơn 20.000 scraper dựng sẵn. Cho phép agent của bạn
trích xuất dữ liệu từ Instagram, Facebook, TikTok, YouTube, Google Maps, Google
Search, các trang thương mại điện tử và nhiều nguồn khác — chỉ bằng cách yêu cầu.

- **npm:** `@apify/apify-openclaw-plugin`
- **repo:** [github.com/apify/apify-openclaw-plugin](https://github.com/apify/apify-openclaw-plugin)

```bash
openclaw plugins install @apify/apify-openclaw-plugin
```

### Codex App Server Bridge

Cầu nối OpenClaw độc lập cho các cuộc trò chuyện Codex App Server. Liên kết một cuộc trò chuyện với
một luồng Codex, trao đổi bằng văn bản thuần, và điều khiển nó bằng các lệnh
gốc trong chat để tiếp tục, lập kế hoạch, review, chọn mô hình, Compaction và hơn thế nữa.

- **npm:** `openclaw-codex-app-server`
- **repo:** [github.com/pwrdrvr/openclaw-codex-app-server](https://github.com/pwrdrvr/openclaw-codex-app-server)

```bash
openclaw plugins install openclaw-codex-app-server
```

### DingTalk

Tích hợp robot doanh nghiệp bằng chế độ Stream. Hỗ trợ tin nhắn văn bản, hình ảnh và
tệp thông qua bất kỳ client DingTalk nào.

- **npm:** `@largezhou/ddingtalk`
- **repo:** [github.com/largezhou/openclaw-dingtalk](https://github.com/largezhou/openclaw-dingtalk)

```bash
openclaw plugins install @largezhou/ddingtalk
```

### Lossless Claw (LCM)

Plugin Lossless Context Management cho OpenClaw. Tóm tắt cuộc trò chuyện
dựa trên DAG với Compaction tăng dần — giữ nguyên độ trung thực đầy đủ của ngữ cảnh
trong khi giảm lượng token sử dụng.

- **npm:** `@martian-engineering/lossless-claw`
- **repo:** [github.com/Martian-Engineering/lossless-claw](https://github.com/Martian-Engineering/lossless-claw)

```bash
openclaw plugins install @martian-engineering/lossless-claw
```

### Opik

Plugin chính thức xuất dấu vết agent sang Opik. Theo dõi hành vi agent,
chi phí, token, lỗi và nhiều nội dung khác.

- **npm:** `@opik/opik-openclaw`
- **repo:** [github.com/comet-ml/opik-openclaw](https://github.com/comet-ml/opik-openclaw)

```bash
openclaw plugins install @opik/opik-openclaw
```

### Prometheus Avatar

Cung cấp cho agent OpenClaw của bạn một avatar Live2D với đồng bộ môi theo thời gian thực,
biểu cảm cảm xúc và chuyển văn bản thành giọng nói. Bao gồm công cụ tạo cho việc sinh tài sản AI
và triển khai một lần nhấp lên Prometheus Marketplace. Hiện đang ở giai đoạn alpha.

- **npm:** `@prometheusavatar/openclaw-plugin`
- **repo:** [github.com/myths-labs/prometheus-avatar](https://github.com/myths-labs/prometheus-avatar)

```bash
openclaw plugins install @prometheusavatar/openclaw-plugin
```

### QQbot

Kết nối OpenClaw với QQ thông qua QQ Bot API. Hỗ trợ chat riêng tư, lượt nhắc trong nhóm,
tin nhắn kênh và đa phương tiện phong phú bao gồm giọng nói, hình ảnh, video,
và tệp.

Các bản phát hành OpenClaw hiện tại đi kèm QQ Bot. Dùng thiết lập tích hợp trong
[QQ Bot](/vi/channels/qqbot) cho cài đặt thông thường; chỉ cài đặt plugin bên ngoài này
khi bạn chủ đích muốn gói độc lập do Tencent duy trì.

- **npm:** `@tencent-connect/openclaw-qqbot`
- **repo:** [github.com/tencent-connect/openclaw-qqbot](https://github.com/tencent-connect/openclaw-qqbot)

```bash
openclaw plugins install @tencent-connect/openclaw-qqbot
```

### wecom

Plugin kênh WeCom cho OpenClaw của đội ngũ Tencent WeCom. Được hỗ trợ bởi
kết nối bền vững WeCom Bot WebSocket, plugin này hỗ trợ tin nhắn trực tiếp và chat nhóm,
phản hồi streaming, nhắn tin chủ động, xử lý hình ảnh/tệp, định dạng Markdown,
kiểm soát truy cập tích hợp sẵn, và các Skills về tài liệu/cuộc họp/nhắn tin.

- **npm:** `@wecom/wecom-openclaw-plugin`
- **repo:** [github.com/WecomTeam/wecom-openclaw-plugin](https://github.com/WecomTeam/wecom-openclaw-plugin)

```bash
openclaw plugins install @wecom/wecom-openclaw-plugin
```

### Yuanbao

Plugin kênh Yuanbao cho OpenClaw của đội ngũ Tencent Yuanbao. Được hỗ trợ bởi
kết nối bền vững WebSocket, plugin này hỗ trợ tin nhắn trực tiếp và chat nhóm,
phản hồi streaming, nhắn tin chủ động, xử lý hình ảnh/tệp/âm thanh/video,
định dạng Markdown, kiểm soát truy cập tích hợp sẵn, và menu lệnh gạch chéo.

- **npm:** `openclaw-plugin-yuanbao`
- **repo:** [github.com/YuanbaoTeam/yuanbao-openclaw-plugin](https://github.com/YuanbaoTeam/yuanbao-openclaw-plugin)

```bash
openclaw plugins install openclaw-plugin-yuanbao
```

## Gửi plugin của bạn

Chúng tôi hoan nghênh các plugin cộng đồng hữu ích, có tài liệu và an toàn khi vận hành.

<Steps>
  <Step title="Phát hành lên ClawHub hoặc npm">
    Plugin của bạn phải có thể cài đặt qua `openclaw plugins install \<package-name\>`.
    Phát hành lên [ClawHub](/vi/clawhub) trừ khi bạn đặc biệt cần phân phối
    chỉ qua npm.
    Xem [Xây dựng Plugin](/vi/plugins/building-plugins) để đọc hướng dẫn đầy đủ.

  </Step>

  <Step title="Lưu trữ trên GitHub">
    Mã nguồn phải nằm trong một kho công khai có tài liệu thiết lập và trình theo dõi
    vấn đề.

  </Step>

  <Step title="Chỉ dùng PR tài liệu cho thay đổi tài liệu nguồn">
    Bạn không cần PR tài liệu chỉ để làm cho plugin của mình có thể được khám phá. Thay vào đó hãy phát hành nó
    trên ClawHub.

    Chỉ mở PR tài liệu khi tài liệu nguồn của OpenClaw cần một thay đổi nội dung
    thực sự, chẳng hạn như sửa hướng dẫn cài đặt hoặc thêm tài liệu
    liên kho phù hợp với bộ tài liệu chính.

  </Step>
</Steps>

## Tiêu chuẩn chất lượng

| Yêu cầu                     | Lý do                                         |
| --------------------------- | --------------------------------------------- |
| Đã phát hành trên ClawHub hoặc npm | Người dùng cần `openclaw plugins install` hoạt động |
| Repo GitHub công khai       | Review mã nguồn, theo dõi vấn đề, tính minh bạch |
| Tài liệu thiết lập và sử dụng | Người dùng cần biết cách cấu hình nó         |
| Bảo trì tích cực            | Cập nhật gần đây hoặc xử lý vấn đề phản hồi nhanh |

Các wrapper đầu tư ít, quyền sở hữu không rõ ràng, hoặc gói không được bảo trì có thể bị từ chối.

## Liên quan

- [Cài đặt và Cấu hình Plugin](/vi/tools/plugin) — cách cài đặt bất kỳ plugin nào
- [Xây dựng Plugin](/vi/plugins/building-plugins) — tạo plugin của riêng bạn
- [Plugin Manifest](/vi/plugins/manifest) — schema manifest
