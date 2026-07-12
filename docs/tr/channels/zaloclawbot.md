---
read_when:
    - QR koduyla oturum açan kişisel bir Zalo asistan botu istiyorsunuz
    - openclaw-zaloclawbot kanal Pluginini kuruyor veya sorunlarını gideriyorsunuz
summary: Harici openclaw-zaloclawbot Plugin aracılığıyla Zalo ClawBot kanal kurulumu
title: Zalo ClawBot
x-i18n:
    generated_at: "2026-07-12T11:31:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 76c9f79d114856b86026a5e4b98a43f451b0d3f16dd41a67e9226da4f8b37b33
    source_path: channels/zaloclawbot.md
    workflow: 16
---

OpenClaw, katalogda listelenen harici `@zalo-platforms/openclaw-zaloclawbot` Plugin aracılığıyla Zalo ClawBot'a bağlanır. Oturum açma işlemi bir Zalo Mini App QR kodu kullanır; yapılandırmadaki Plugin kimliği `openclaw-zaloclawbot` değeridir.

## Uyumluluk

| Plugin Sürümü | OpenClaw Sürümü | npm dist-tag | Durum          |
| ------------- | --------------- | ------------ | -------------- |
| 0.1.4         | >=2026.4.10     | `latest`     | Etkin / Beta   |

## Ön koşullar

- Node.js >= 22
- [OpenClaw](https://docs.openclaw.ai/install) kurulu (`openclaw` CLI kullanılabilir)
- Oturum açma QR kodunu taramak için mobil cihazda bir Zalo hesabı

## Onboard ile kurulum (önerilen)

```bash
openclaw onboard
```

Kanal menüsünden **Zalo ClawBot** seçeneğini belirleyin. Sihirbaz, Plugin'i resmî katalogdan kurar (bütünlüğü doğrulanmış olarak), oturum açma QR kodunu terminalde görüntüler ve Zalo uygulamasıyla kodu taradığınızda kanal kurulumunu tamamlar.

## Manuel kurulum

Kanalı onboard işlemi daha önce tamamlanmış bir Gateway'e eklemek için:

### 1. Plugin'i kurun

```bash
openclaw plugins install "@zalo-platforms/openclaw-zaloclawbot@0.1.4"
```

OpenClaw'ın kurulum sırasında paketi katalog bütünlük karmasına göre doğrulaması için sabitlenmiş sürümü tam olarak kullanın.

### 2. Yapılandırmada Plugin'i etkinleştirin

```bash
openclaw config set plugins.entries.openclaw-zaloclawbot.enabled true
```

### 3. Bir QR kodu oluşturun ve oturum açın

```bash
openclaw channels login --channel openclaw-zaloclawbot
```

Terminalde görüntülenen QR kodunu Zalo mobil uygulamasıyla tarayın, Zalo Mini App içindeki Kullanım Koşullarını kabul edin ve oturumu yetkilendirin.

### 4. Gateway'i yeniden başlatın

```bash
openclaw gateway restart
```

## Nasıl çalışır?

Kendi Zalo Official Account (OA) hesabınızı kaydetmenizi ve statik geliştirici kimlik bilgilerini yapılandırmanızı gerektiren standart Zalo kanalının aksine Zalo ClawBot, paylaşılan resmî altyapıda çalışan **sahibine bağlı kişisel bir asistandır**:

1. **İlk kurulum:** QR kodu, paylaşılan resmî bir OA altında yeni sağlanmış özel bir botu doğrudan Zalo kullanıcı kimliğinize bağlayan bir Zalo Mini App'e yönlendirir.
2. **Sahibe bağlı gizlilik:** Bot yalnızca sahibiyle iletişim kurar. Diğer kullanıcılardan gelen mesajlar platform düzeyinde bırakılır.
3. **Resmî API yolu:** Plugin, tarayıcı veya web oturumu otomasyonu yerine Zalo Bot Platform API'lerini kullanır.

## Arka planda

Plugin, kalıcı bir uzun yoklama döngüsü (`getUpdates`) aracılığıyla Zalo ile iletişim kurar. Yerel masaüstü/terminal Gateway çalıştırmalarında Webhook'lar varsayılan olarak devre dışıdır. Mesajlar istemci tarafında işlenir ve yerel ajan çalışma zamanınızla eşleştirilir.

Plugin, bot kimlik bilgilerini OpenClaw durum dizini altında yönetir. Bu dizini hassas olarak değerlendirin ve OpenClaw durumunun geri kalanıyla aynı erişim denetimi ve yedekleme politikasına tabi tutun.

Bu Plugin'in çalışma zamanı tamamen harici `@zalo-platforms/openclaw-zaloclawbot` paketinde yer alır; aşağıda kurulum/yapılandırmanın ötesinde verilen davranış ayrıntıları Plugin bakımcılarının bildirimlerine dayanır ve OpenClaw çekirdek kaynak koduna göre doğrulanmamıştır.

## Sorun giderme

- **QR ile oturum açma zaman aşımı:** Oturum açma belirtecinin (`zbsk`) süresi güvenlik nedeniyle 5 dakika sonra dolar. QR kodunun süresi siz taramadan önce dolarsa yeni bir kod oluşturmak için oturum açma komutunu yeniden çalıştırın.
- **Gateway yüklenemiyor:** OpenClaw ana makine sürümünüzün `2026.4.10` veya üzeri olduğunu doğrulayın. Eski sürümler, bu kimliğin gerektirdiği harici npm Plugin kurulum kaydını desteklemez.

## İlgili

- [Kanallara Genel Bakış](/tr/channels) - desteklenen tüm kanallar
- [Zalo](/tr/channels/zalo) - paketle birlikte sunulan Zalo Bot Creator / Marketplace kanalı
- [Eşleştirme](/tr/channels/pairing) - doğrudan mesaj kimlik doğrulaması ve eşleştirme akışı
- [Plugin'ler](/tr/tools/plugin) - Plugin'leri kurma ve yönetme
