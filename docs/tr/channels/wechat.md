---
read_when:
    - OpenClaw'ı WeChat veya Weixin'e bağlamak istiyorsunuz
    - openclaw-weixin kanal plugin'ini kuruyor veya sorun gideriyorsunuz
    - Harici kanal plugin'lerinin Gateway'in yanında nasıl çalıştığını anlamanız gerekiyor
summary: Harici openclaw-weixin plugin'i üzerinden WeChat kanal kurulumu
title: WeChat
x-i18n:
    generated_at: "2026-04-24T09:00:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: ea7c815a364c2ae087041bf6de5b4182334c67377e18b9bedfa0f9d949afc09c
    source_path: channels/wechat.md
    workflow: 15
---

OpenClaw, WeChat'e Tencent'in harici
`@tencent-weixin/openclaw-weixin` kanal plugin'i üzerinden bağlanır.

Durum: harici plugin. Doğrudan sohbetler ve medya desteklenir. Grup sohbetleri, mevcut plugin yetenek meta verilerinde
reklamı yapılan bir özellik değildir.

## Adlandırma

- **WeChat**, bu belgelerde kullanıcıya görünen addır.
- **Weixin**, Tencent'in paketinde ve plugin kimliğinde kullanılan addır.
- `openclaw-weixin`, OpenClaw kanal kimliğidir.
- `@tencent-weixin/openclaw-weixin`, npm paketidir.

CLI komutlarında ve yapılandırma yollarında `openclaw-weixin` kullanın.

## Nasıl çalışır

WeChat kodu OpenClaw çekirdek reposunda yer almaz. OpenClaw,
genel kanal plugin sözleşmesini sağlar; harici plugin ise
WeChat'e özgü çalışma zamanını sağlar:

1. `openclaw plugins install`, `@tencent-weixin/openclaw-weixin` paketini kurar.
2. Gateway plugin manifest'ini keşfeder ve plugin giriş noktasını yükler.
3. Plugin, `openclaw-weixin` kanal kimliğini kaydeder.
4. `openclaw channels login --channel openclaw-weixin`, QR ile oturum açmayı başlatır.
5. Plugin, hesap kimlik bilgilerini OpenClaw durum dizini altında depolar.
6. Gateway başladığında, plugin yapılandırılmış her hesap için Weixin izleyicisini başlatır.
7. Gelen WeChat mesajları kanal sözleşmesi üzerinden normalize edilir, seçilen OpenClaw agent'ine yönlendirilir ve plugin'in giden yolu üzerinden geri gönderilir.

Bu ayrım önemlidir: OpenClaw çekirdeği kanaldan bağımsız kalmalıdır. WeChat girişi,
Tencent iLink API çağrıları, medya yükleme/indirme, bağlam token'ları ve hesap
izleme işlemleri harici plugin'e aittir.

## Kurulum

Hızlı kurulum:

```bash
npx -y @tencent-weixin/openclaw-weixin-cli install
```

Elle kurulum:

```bash
openclaw plugins install "@tencent-weixin/openclaw-weixin"
openclaw config set plugins.entries.openclaw-weixin.enabled true
```

Kurulumdan sonra Gateway'i yeniden başlatın:

```bash
openclaw gateway restart
```

## Giriş

QR ile oturum açmayı Gateway'in çalıştığı aynı makinede çalıştırın:

```bash
openclaw channels login --channel openclaw-weixin
```

Telefonunuzdaki WeChat ile QR kodunu tarayın ve girişi onaylayın. Plugin,
tarama başarılı olduktan sonra hesap token'ını yerel olarak kaydeder.

Başka bir WeChat hesabı eklemek için aynı giriş komutunu yeniden çalıştırın. Birden fazla
hesap için, doğrudan mesaj oturumlarını hesap, kanal ve gönderene göre yalıtın:

```bash
openclaw config set session.dmScope per-account-channel-peer
```

## Erişim denetimi

Doğrudan mesajlar, kanal
plugin'leri için normal OpenClaw eşleştirme ve izin listesi modelini kullanır.

Yeni gönderenleri onaylayın:

```bash
openclaw pairing list openclaw-weixin
openclaw pairing approve openclaw-weixin <CODE>
```

Tam erişim denetimi modeli için bkz. [Pairing](/tr/channels/pairing).

## Uyumluluk

Plugin, başlangıçta host OpenClaw sürümünü kontrol eder.

| Plugin hattı | OpenClaw sürümü         | npm etiketi |
| ------------ | ----------------------- | ----------- |
| `2.x`        | `>=2026.3.22`           | `latest`    |
| `1.x`        | `>=2026.1.0 <2026.3.22` | `legacy`    |

Plugin, OpenClaw sürümünüzün çok eski olduğunu bildirirse ya
OpenClaw'ı güncelleyin ya da eski plugin hattını kurun:

```bash
openclaw plugins install @tencent-weixin/openclaw-weixin@legacy
```

## Sidecar süreci

WeChat plugin'i, Tencent iLink API'yi izlerken
Gateway'in yanında yardımcı işler çalıştırabilir. #68451 numaralı issue'da, bu yardımcı yol OpenClaw'ın
genel eski Gateway temizliğinde bir hatayı ortaya çıkardı: bir alt süreç üst Gateway sürecini
temizlemeye çalışabiliyor ve systemd gibi süreç yöneticileri altında yeniden başlatma döngülerine neden olabiliyordu.

Geçerli OpenClaw başlangıç temizliği, mevcut süreci ve onun atalarını hariç tutar,
bu nedenle bir kanal yardımcısı, kendisini başlatan Gateway'i öldürmemelidir. Bu düzeltme
geneldir; çekirdekte WeChat'e özgü bir yol değildir.

## Sorun giderme

Kurulumu ve durumu kontrol edin:

```bash
openclaw plugins list
openclaw channels status --probe
openclaw --version
```

Kanal kurulu görünüyor ama bağlanmıyorsa, plugin'in
etkin olduğunu doğrulayın ve yeniden başlatın:

```bash
openclaw config set plugins.entries.openclaw-weixin.enabled true
openclaw gateway restart
```

WeChat etkinleştirildikten sonra Gateway sürekli yeniden başlıyorsa, hem OpenClaw'ı hem de
plugin'i güncelleyin:

```bash
npm view @tencent-weixin/openclaw-weixin version
openclaw plugins install "@tencent-weixin/openclaw-weixin" --force
openclaw gateway restart
```

Geçici olarak devre dışı bırakma:

```bash
openclaw config set plugins.entries.openclaw-weixin.enabled false
openclaw gateway restart
```

## İlgili belgeler

- Kanal genel bakışı: [Chat Channels](/tr/channels)
- Eşleştirme: [Pairing](/tr/channels/pairing)
- Kanal yönlendirme: [Channel Routing](/tr/channels/channel-routing)
- Plugin mimarisi: [Plugin Architecture](/tr/plugins/architecture)
- Kanal plugin SDK'sı: [Channel Plugin SDK](/tr/plugins/sdk-channel-plugins)
- Harici paket: [@tencent-weixin/openclaw-weixin](https://www.npmjs.com/package/@tencent-weixin/openclaw-weixin)
