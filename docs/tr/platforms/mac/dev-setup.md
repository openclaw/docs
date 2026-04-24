---
read_when:
    - macOS geliştirme ortamını kurma
summary: OpenClaw macOS uygulaması üzerinde çalışan geliştiriciler için kurulum kılavuzu
title: macOS geliştirme kurulumu
x-i18n:
    generated_at: "2026-04-24T09:19:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 30f98b3249096fa1e125a7beb77562b7bd36e2c17f524f30a1c58de61bd04da0
    source_path: platforms/mac/dev-setup.md
    workflow: 15
---

# macOS Geliştirici Kurulumu

Bu kılavuz, OpenClaw macOS uygulamasını kaynaktan derlemek ve çalıştırmak için gereken adımları kapsar.

## Önkoşullar

Uygulamayı derlemeden önce aşağıdakilerin kurulu olduğundan emin olun:

1. **Xcode 26.2+**: Swift geliştirme için gereklidir.
2. **Node.js 24 & pnpm**: Gateway, CLI ve paketleme betikleri için önerilir. Uyumluluk için Node 22 LTS, şu anda `22.14+`, desteklenmeye devam etmektedir.

## 1. Bağımlılıkları kurun

Proje genelindeki bağımlılıkları kurun:

```bash
pnpm install
```

## 2. Uygulamayı derleyin ve paketleyin

macOS uygulamasını derleyip `dist/OpenClaw.app` içine paketlemek için şunu çalıştırın:

```bash
./scripts/package-mac-app.sh
```

Apple Developer ID sertifikanız yoksa betik otomatik olarak **ad-hoc imzalama** (`-`) kullanır.

Geliştirme çalıştırma modları, imzalama bayrakları ve Team ID sorun giderme için macOS uygulaması README dosyasına bakın:
[https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md](https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md)

> **Not**: Ad-hoc imzalanmış uygulamalar güvenlik istemlerini tetikleyebilir. Uygulama hemen "Abort trap 6" ile çöküyorsa [Sorun giderme](#troubleshooting) bölümüne bakın.

## 3. CLI'yi kurun

macOS uygulaması, arka plan görevlerini yönetmek için genel bir `openclaw` CLI kurulumu bekler.

**Kurmak için (önerilen):**

1. OpenClaw uygulamasını açın.
2. **General** ayarlar sekmesine gidin.
3. **"Install CLI"** düğmesine tıklayın.

Alternatif olarak elle kurun:

```bash
npm install -g openclaw@<version>
```

`pnpm add -g openclaw@<version>` ve `bun add -g openclaw@<version>` da çalışır.
Gateway çalışma zamanı için Node önerilen yol olmaya devam eder.

## Sorun giderme

### Derleme başarısız: araç zinciri veya SDK uyumsuzluğu

macOS uygulaması derlemesi en son macOS SDK'sını ve Swift 6.2 araç zincirini bekler.

**Sistem bağımlılıkları (gerekli):**

- **Software Update içinde mevcut en son macOS sürümü** (Xcode 26.2 SDK'ları tarafından gereklidir)
- **Xcode 26.2** (Swift 6.2 araç zinciri)

**Denetimler:**

```bash
xcodebuild -version
xcrun swift --version
```

Sürümler eşleşmiyorsa macOS/Xcode'u güncelleyin ve derlemeyi yeniden çalıştırın.

### Uygulama izin verirken çöküyor

Uygulama **Speech Recognition** veya **Microphone** erişimine izin vermeye çalışırken çöküyorsa, bunun nedeni bozulmuş bir TCC önbelleği veya imza uyumsuzluğu olabilir.

**Düzeltme:**

1. TCC izinlerini sıfırlayın:

   ```bash
   tccutil reset All ai.openclaw.mac.debug
   ```

2. Bu işe yaramazsa, macOS'tan "temiz bir sayfa" zorlamak için [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh) içindeki `BUNDLE_ID` değerini geçici olarak değiştirin.

### Gateway süresiz olarak "Starting..." durumunda

Gateway durumu "Starting..." üzerinde kalıyorsa, bir zombi sürecin portu tutup tutmadığını kontrol edin:

```bash
openclaw gateway status
openclaw gateway stop

# LaunchAgent kullanmıyorsanız (geliştirme modu / manuel çalıştırmalar), dinleyiciyi bulun:
lsof -nP -iTCP:18789 -sTCP:LISTEN
```

Portu manuel bir çalıştırma tutuyorsa, o süreci durdurun (Ctrl+C). Son çare olarak yukarıda bulduğunuz PID'yi sonlandırın.

## İlgili

- [macOS uygulaması](/tr/platforms/macos)
- [Kurulum genel bakışı](/tr/install)
