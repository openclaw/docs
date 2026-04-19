---
read_when:
    - OpenClaw'ı WeChat veya Weixin'e bağlamak istiyorsunuz
    - openclaw-weixin kanal Plugin'ini yüklüyor veya sorunlarını gideriyorsunuz
    - Harici kanal Plugin'lerinin Gateway'in yanında nasıl çalıştığını anlamanız gerekiyor
summary: Harici openclaw-weixin Plugin'i üzerinden WeChat kanal kurulumu
title: WeChat
x-i18n:
    generated_at: "2026-04-19T01:11:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: ae669f2b6300e0c2b1d1dc57743a0a2ab0c05b9e277ec2ac640a03e6e7ab3b84
    source_path: channels/wechat.md
    workflow: 15
---

# WeChat

OpenClaw, WeChat'e Tencent'in harici
`@tencent-weixin/openclaw-weixin` kanal Plugin'i üzerinden bağlanır.

Durum: harici Plugin. Doğrudan sohbetler ve medya desteklenir. Grup sohbetleri, mevcut Plugin yetenek meta verileri tarafından
bildirilmemektedir.

## Adlandırma

- **WeChat**, bu belgelerde kullanıcıya görünen addır.
- **Weixin**, Tencent'in paketinde ve Plugin kimliğinde kullanılan addır.
- `openclaw-weixin`, OpenClaw kanal kimliğidir.
- `@tencent-weixin/openclaw-weixin`, npm paketidir.

CLI komutlarında ve yapılandırma yollarında `openclaw-weixin` kullanın.

## Nasıl çalışır

WeChat kodu OpenClaw çekirdek deposunda bulunmaz. OpenClaw genel
kanal Plugin sözleşmesini sağlar ve harici Plugin
WeChat'e özgü çalışma zamanını sağlar:

1. `openclaw plugins install`, `@tencent-weixin/openclaw-weixin` paketini yükler.
2. Gateway, Plugin manifestini keşfeder ve Plugin giriş noktasını yükler.
3. Plugin, `openclaw-weixin` kanal kimliğini kaydeder.
4. `openclaw channels login --channel openclaw-weixin`, QR ile giriş işlemini başlatır.
5. Plugin, hesap kimlik bilgilerini OpenClaw durum dizini altında depolar.
6. Gateway başladığında, Plugin her
   yapılandırılmış hesap için Weixin izleyicisini başlatır.
7. Gelen WeChat mesajları kanal sözleşmesi üzerinden normalize edilir, seçilen OpenClaw ajanına yönlendirilir ve Plugin'in giden yolundan geri gönderilir.

Bu ayrım önemlidir: OpenClaw çekirdeği kanaldan bağımsız kalmalıdır. WeChat girişi,
Tencent iLink API çağrıları, medya yükleme/indirme, bağlam belirteçleri ve hesap
izleme işlemleri harici Plugin'e aittir.

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

## Giriş

QR ile girişi, Gateway'in çalıştığı makinede çalıştırın:

```bash
openclaw channels login --channel openclaw-weixin
```

Telefonunuzdaki WeChat ile QR kodunu tarayın ve girişi onaylayın. Plugin,
başarılı bir taramadan sonra hesap belirtecini yerel olarak kaydeder.

Başka bir WeChat hesabı eklemek için aynı giriş komutunu yeniden çalıştırın. Birden fazla
hesap için, doğrudan mesaj oturumlarını hesap, kanal ve göndericiye göre yalıtın:

```bash
openclaw config set session.dmScope per-account-channel-peer
```

## Erişim denetimi

Doğrudan mesajlar, kanal
Plugin'leri için normal OpenClaw eşleme ve izin listesi modelini kullanır.

Yeni göndericileri onaylayın:

```bash
openclaw pairing list openclaw-weixin
openclaw pairing approve openclaw-weixin <CODE>
```

Tam erişim denetimi modeli için bkz. [Eşleme](/tr/channels/pairing).

## Uyumluluk

Plugin, başlangıçta ana OpenClaw sürümünü denetler.

| Plugin hattı | OpenClaw sürümü        | npm etiketi |
| ------------ | ---------------------- | ----------- |
| `2.x`        | `>=2026.3.22`          | `latest`    |
| `1.x`        | `>=2026.1.0 <2026.3.22` | `legacy`   |

Plugin, OpenClaw sürümünüzün çok eski olduğunu bildirirse ya
OpenClaw'ı güncelleyin ya da eski Plugin hattını yükleyin:

```bash
openclaw plugins install @tencent-weixin/openclaw-weixin@legacy
```

## Sidecar işlemi

WeChat Plugin'i, Tencent iLink API'yi izlerken
Gateway'in yanında yardımcı işleri çalıştırabilir. #68451 numaralı sorunda, bu yardımcı yol OpenClaw'ın
genel eski Gateway temizliğinde bir hatayı ortaya çıkardı: bir alt süreç üst Gateway sürecini temizlemeye çalışabiliyor,
bu da systemd gibi süreç yöneticileri altında yeniden başlatma döngülerine neden olabiliyordu.

Mevcut OpenClaw başlangıç temizliği, geçerli süreci ve onun atalarını hariç tutar;
bu nedenle bir kanal yardımcısı, kendisini başlatan Gateway'i sonlandırmamalıdır. Bu düzeltme
geneldir; çekirdekte WeChat'e özgü bir yol değildir.

## Sorun giderme

Yüklemeyi ve durumu denetleyin:

```bash
openclaw plugins list
openclaw channels status --probe
openclaw --version
```

Kanal yüklü görünüyor ancak bağlanmıyorsa, Plugin'in
etkin olduğunu doğrulayın ve yeniden başlatın:

```bash
openclaw config set plugins.entries.openclaw-weixin.enabled true
openclaw gateway restart
```

WeChat etkinleştirildikten sonra Gateway sürekli yeniden başlıyorsa, hem OpenClaw'ı hem de
Plugin'i güncelleyin:

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

- Kanal genel bakışı: [Sohbet Kanalları](/tr/channels)
- Eşleme: [Eşleme](/tr/channels/pairing)
- Kanal yönlendirme: [Kanal Yönlendirme](/tr/channels/channel-routing)
- Plugin mimarisi: [Plugin Mimarisi](/tr/plugins/architecture)
- Kanal Plugin SDK'sı: [Kanal Plugin SDK'sı](/tr/plugins/sdk-channel-plugins)
- Harici paket: [@tencent-weixin/openclaw-weixin](https://www.npmjs.com/package/@tencent-weixin/openclaw-weixin)
