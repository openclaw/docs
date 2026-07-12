---
read_when:
    - OpenClaw'u WeChat veya Weixin'e bağlamak istiyorsunuz
    - openclaw-weixin kanal Pluginini kuruyor veya sorunlarını gideriyorsunuz
    - Harici kanal Pluginlerinin Gateway'in yanında nasıl çalıştığını anlamanız gerekir
summary: Harici openclaw-weixin Plugin aracılığıyla WeChat kanal kurulumu
title: WeChat
x-i18n:
    generated_at: "2026-07-12T12:06:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 98faf95f9fb76deedb7df9adf3092083722a77bdd793de98c41a6f715cc0d14a
    source_path: channels/wechat.md
    workflow: 16
---

OpenClaw, Tencent'in harici `@tencent-weixin/openclaw-weixin` kanal Plugin'i üzerinden WeChat'e bağlanır.

Durum: Tencent Weixin ekibi tarafından sürdürülen harici Plugin. Doğrudan sohbetler ve medya desteklenir. Grup sohbetleri, Plugin yetenek meta verilerinde belirtilmez (yalnızca doğrudan sohbetleri bildirir).

## Adlandırma

- **WeChat**, bu belgelerde kullanıcıya gösterilen addır.
- **Weixin**, Tencent paketinde ve Plugin kimliğinde kullanılan addır.
- `openclaw-weixin`, OpenClaw kanal kimliğidir (`weixin` ve `wechat` takma ad olarak çalışır).
- `@tencent-weixin/openclaw-weixin`, npm paketidir.

CLI komutlarında ve yapılandırma yollarında `openclaw-weixin` kullanın.

## Nasıl çalışır?

WeChat kodu, OpenClaw çekirdek deposunda yer almaz. OpenClaw genel kanal Plugin sözleşmesini, harici Plugin ise WeChat'e özgü çalışma zamanını sağlar:

1. `openclaw plugins install`, `@tencent-weixin/openclaw-weixin` paketini yükler.
2. Gateway, Plugin manifestini keşfeder ve Plugin giriş noktasını yükler.
3. Plugin, `openclaw-weixin` kanal kimliğini kaydeder.
4. `openclaw channels login --channel openclaw-weixin`, QR kodla oturum açma işlemini başlatır.
5. Plugin, hesap kimlik bilgilerini OpenClaw durum dizininde (varsayılan olarak `~/.openclaw`) saklar.
6. Gateway başladığında Plugin, yapılandırılmış her hesap için Weixin izleyicisini başlatır.
7. Gelen WeChat mesajları kanal sözleşmesi üzerinden normalleştirilir, seçilen OpenClaw aracısına yönlendirilir ve Plugin'in giden ileti yolu üzerinden geri gönderilir.

Bu ayrım önemlidir: OpenClaw çekirdeği kanaldan bağımsız kalır. WeChat oturum açma işlemi, Tencent iLink API çağrıları, medya yükleme/indirme, bağlam belirteçleri ve hesap izleme harici Plugin'in sorumluluğundadır.

## Yükleme

Hızlı yükleme:

```bash
npx -y @tencent-weixin/openclaw-weixin-cli install
```

Elle yükleme:

```bash
openclaw plugins install "@tencent-weixin/openclaw-weixin"
openclaw config set plugins.entries.openclaw-weixin.enabled true
```

Yüklemeden sonra Gateway'i yeniden başlatın:

```bash
openclaw gateway restart
```

## Oturum açma

QR kodla oturum açma işlemini Gateway'in çalıştığı makinede başlatın:

```bash
openclaw channels login --channel openclaw-weixin
```

Telefonunuzdaki WeChat ile QR kodu tarayın ve oturum açma işlemini onaylayın. Başarılı bir taramanın ardından Plugin, hesap belirtecini yerel olarak kaydeder.

Başka bir WeChat hesabı eklemek için aynı oturum açma komutunu yeniden çalıştırın. Birden fazla hesap için doğrudan mesaj oturumlarını hesap, kanal ve gönderene göre yalıtın:

```bash
openclaw config set session.dmScope per-account-channel-peer
```

## Erişim denetimi

Doğrudan mesajlar, kanal Plugin'leri için standart OpenClaw eşleştirme ve izin listesi modelini kullanır.

Yeni gönderenleri onaylayın:

```bash
openclaw pairing list openclaw-weixin
openclaw pairing approve openclaw-weixin <CODE>
```

Erişim denetimi modelinin tamamı için [Eşleştirme](/tr/channels/pairing) bölümüne bakın.

## Uyumluluk

Plugin, başlangıçta ana sistemdeki OpenClaw sürümünü denetler.

| Plugin serisi | OpenClaw sürümü                                                | npm etiketi |
| ------------- | --------------------------------------------------------------- | ---------- |
| `2.x`         | `>=2026.5.12` (güncel 2.4.6; ilk 2.x sürümleri `>=2026.3.22` kabul ediyordu) | `latest` |
| `1.x`         | `>=2026.1.0 <2026.3.22`                                         | `legacy` |

Plugin, OpenClaw sürümünüzün çok eski olduğunu bildirirse OpenClaw'u güncelleyin veya eski Plugin serisini yükleyin:

```bash
openclaw plugins install @tencent-weixin/openclaw-weixin@legacy
```

## Yardımcı süreç

WeChat Plugin'i, Tencent iLink API'sini izlerken Gateway'in yanında yardımcı işlemler çalıştırabilir. #68451 numaralı sorunda bu yardımcı yol, OpenClaw'un genel eski Gateway temizleme işlemindeki bir hatayı açığa çıkardı: bir alt süreç, üst Gateway sürecini temizlemeye çalışabiliyor ve systemd gibi süreç yöneticileri altında yeniden başlatma döngülerine neden olabiliyordu.

OpenClaw'un mevcut başlangıç temizliği, geçerli süreci ve onun üst süreçlerini hariç tutar; böylece bir kanal yardımcısı kendisini başlatan Gateway'i sonlandıramaz. Bu düzeltme geneldir; çekirdekte WeChat'e özgü bir yol değildir.

## Sorun giderme

Yüklemeyi ve durumu denetleyin:

```bash
openclaw plugins list
openclaw channels status --probe
openclaw --version
```

Kanal yüklü görünmesine rağmen bağlanmıyorsa Plugin'in etkin olduğunu doğrulayın ve yeniden başlatın:

```bash
openclaw config set plugins.entries.openclaw-weixin.enabled true
openclaw gateway restart
```

WeChat etkinleştirildikten sonra Gateway sürekli yeniden başlıyorsa hem OpenClaw'u hem de Plugin'i güncelleyin:

```bash
npm view @tencent-weixin/openclaw-weixin version
openclaw plugins install "@tencent-weixin/openclaw-weixin" --force
openclaw gateway restart
```

Başlangıç sırasında yüklü Plugin paketinin `requires compiled runtime
output for TypeScript entry` gerektirdiği bildirilirse npm paketi, OpenClaw'un ihtiyaç duyduğu derlenmiş JavaScript çalışma zamanı dosyaları olmadan yayımlanmıştır. Plugin yayıncısı düzeltilmiş bir paket yayımladıktan sonra güncelleyin/yeniden yükleyin veya Plugin'i geçici olarak devre dışı bırakın/kaldırın.

Geçici olarak devre dışı bırakma:

```bash
openclaw config set plugins.entries.openclaw-weixin.enabled false
openclaw gateway restart
```

## İlgili belgeler

- Kanallara genel bakış: [Sohbet Kanalları](/tr/channels)
- Eşleştirme: [Eşleştirme](/tr/channels/pairing)
- Kanal yönlendirme: [Kanal Yönlendirme](/tr/channels/channel-routing)
- Plugin mimarisi: [Plugin Mimarisi](/tr/plugins/architecture)
- Kanal Plugin SDK'sı: [Kanal Plugin SDK'sı](/tr/plugins/sdk-channel-plugins)
- Harici paket: [@tencent-weixin/openclaw-weixin](https://www.npmjs.com/package/@tencent-weixin/openclaw-weixin)
