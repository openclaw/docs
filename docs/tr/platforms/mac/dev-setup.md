---
read_when:
    - macOS geliştirme ortamını kurma
summary: OpenClaw macOS uygulaması üzerinde çalışan geliştiriciler için kurulum kılavuzu
title: macOS geliştirme kurulumu
x-i18n:
    generated_at: "2026-05-07T13:22:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: b39b449570176f44305c98ec4f00482a8b75ad20174b80c93abc45df37ffa0bc
    source_path: platforms/mac/dev-setup.md
    workflow: 16
---

# macOS geliştirici kurulumu

OpenClaw macOS uygulamasını kaynaktan derleyip çalıştırın.

## Ön koşullar

Uygulamayı derlemeden önce aşağıdakilerin kurulu olduğundan emin olun:

1. **Xcode 26.2+**: Swift geliştirme için gereklidir.
2. **Node.js 24 ve pnpm**: Gateway, CLI ve paketleme betikleri için önerilir. Şu anda `22.16+` olan Node 22 LTS, uyumluluk için desteklenmeye devam eder.

## 1. Bağımlılıkları yükleyin

Proje genelindeki bağımlılıkları yükleyin:

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

> **Not**: Ad-hoc imzalanmış uygulamalar güvenlik istemlerini tetikleyebilir. Uygulama "Abort trap 6" ile hemen çöküyorsa [Sorun giderme](#troubleshooting) bölümüne bakın.

## 3. CLI'ı yükleyin

macOS uygulaması, arka plan görevlerini yönetmek için genel bir `openclaw` CLI kurulumunun olmasını bekler.

**Yüklemek için (önerilir):**

1. OpenClaw uygulamasını açın.
2. **General** ayarlar sekmesine gidin.
3. **"Install CLI"** düğmesine tıklayın.

Alternatif olarak elle yükleyin:

```bash
npm install -g openclaw@<version>
```

`pnpm add -g openclaw@<version>` ve `bun add -g openclaw@<version>` de çalışır.
Gateway çalışma zamanı için Node önerilen yol olmaya devam eder.

## Sorun giderme

### Derleme başarısız oluyor: araç zinciri veya SDK uyumsuzluğu

macOS uygulama derlemesi en yeni macOS SDK'sını ve Swift 6.2 araç zincirini bekler.

**Sistem bağımlılıkları (gerekli):**

- **Software Update içinde sunulan en yeni macOS sürümü** (Xcode 26.2 SDK'ları tarafından gereklidir)
- **Xcode 26.2** (Swift 6.2 araç zinciri)

**Kontroller:**

```bash
xcodebuild -version
xcrun swift --version
```

Sürümler eşleşmiyorsa macOS/Xcode'u güncelleyin ve derlemeyi yeniden çalıştırın.

### İzin verme sırasında uygulama çöküyor

**Speech Recognition** veya **Microphone** erişimine izin vermeye çalıştığınızda uygulama çöküyorsa bunun nedeni bozuk bir TCC önbelleği veya imza uyumsuzluğu olabilir.

**Düzeltme:**

1. TCC izinlerini sıfırlayın:

   ```bash
   tccutil reset All ai.openclaw.mac.debug
   ```

2. Bu başarısız olursa macOS'tan "temiz başlangıç" zorlamak için [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh) içindeki `BUNDLE_ID` değerini geçici olarak değiştirin.

### Gateway "Starting..." durumunda süresiz kalıyor

Gateway durumu "Starting..." olarak kalıyorsa bağlantı noktasını tutan bir zombi süreç olup olmadığını kontrol edin:

```bash
openclaw gateway status
openclaw gateway stop

# LaunchAgent kullanmıyorsanız (geliştirme modu / elle çalıştırmalar), dinleyiciyi bulun:
lsof -nP -iTCP:18789 -sTCP:LISTEN
```

Elle çalıştırılan bir süreç bağlantı noktasını tutuyorsa bu süreci durdurun (Ctrl+C). Son çare olarak yukarıda bulduğunuz PID'yi sonlandırın.

## İlgili

- [macOS uygulaması](/tr/platforms/macos)
- [Kurulum özeti](/tr/install)
