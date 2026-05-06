---
read_when:
    - macOS geliştirme ortamını kurma
summary: OpenClaw macOS uygulaması üzerinde çalışan geliştiriciler için kurulum kılavuzu
title: macOS geliştirme kurulumu
x-i18n:
    generated_at: "2026-05-06T09:22:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: c3ecf014bff10e8416f1586f731e30c9de4a0f09eb82046d06ead7511c47d660
    source_path: platforms/mac/dev-setup.md
    workflow: 16
---

# macOS geliştirici kurulumu

OpenClaw macOS uygulamasını kaynaktan derleyip çalıştırın.

## Önkoşullar

Uygulamayı derlemeden önce aşağıdakilerin yüklü olduğundan emin olun:

1. **Xcode 26.2+**: Swift geliştirme için gereklidir.
2. **Node.js 24 ve pnpm**: Gateway, CLI ve paketleme betikleri için önerilir. Node 22 LTS, şu anda `22.14+`, uyumluluk için desteklenmeye devam ediyor.

## 1. Bağımlılıkları Yükleyin

Proje genelindeki bağımlılıkları yükleyin:

```bash
pnpm install
```

## 2. Uygulamayı Derleyin ve Paketleyin

macOS uygulamasını derleyip `dist/OpenClaw.app` içine paketlemek için şunu çalıştırın:

```bash
./scripts/package-mac-app.sh
```

Apple Developer ID sertifikanız yoksa betik otomatik olarak **ad-hoc imzalama** (`-`) kullanır.

Geliştirme çalıştırma modları, imzalama bayrakları ve Team ID sorun giderme için macOS uygulaması README dosyasına bakın:
[https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md](https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md)

> **Not**: Ad-hoc imzalanmış uygulamalar güvenlik istemlerini tetikleyebilir. Uygulama "Abort trap 6" ile hemen çöküyorsa [Sorun giderme](#troubleshooting) bölümüne bakın.

## 3. CLI'yi Yükleyin

macOS uygulaması, arka plan görevlerini yönetmek için genel bir `openclaw` CLI kurulumu bekler.

**Yüklemek için (önerilir):**

1. OpenClaw uygulamasını açın.
2. **Genel** ayarlar sekmesine gidin.
3. **"CLI'yi Yükle"** düğmesine tıklayın.

Alternatif olarak elle yükleyin:

```bash
npm install -g openclaw@<version>
```

`pnpm add -g openclaw@<version>` ve `bun add -g openclaw@<version>` da çalışır.
Gateway çalışma zamanı için önerilen yol Node olmaya devam eder.

## Sorun giderme

### Derleme başarısız oluyor: araç zinciri veya SDK uyumsuzluğu

macOS uygulama derlemesi, en son macOS SDK'sını ve Swift 6.2 araç zincirini bekler.

**Sistem bağımlılıkları (gerekli):**

- **Yazılım Güncelleme'de bulunan en son macOS sürümü** (Xcode 26.2 SDK'ları için gereklidir)
- **Xcode 26.2** (Swift 6.2 araç zinciri)

**Kontroller:**

```bash
xcodebuild -version
xcrun swift --version
```

Sürümler eşleşmiyorsa macOS/Xcode'u güncelleyin ve derlemeyi yeniden çalıştırın.

### İzin verme sırasında uygulama çöküyor

**Konuşma Tanıma** veya **Mikrofon** erişimine izin vermeye çalıştığınızda uygulama çöküyorsa bunun nedeni bozuk bir TCC önbelleği veya imza uyumsuzluğu olabilir.

**Düzeltme:**

1. TCC izinlerini sıfırlayın:

   ```bash
   tccutil reset All ai.openclaw.mac.debug
   ```

2. Bu başarısız olursa macOS'tan "temiz bir başlangıç" zorlamak için [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh) içindeki `BUNDLE_ID` değerini geçici olarak değiştirin.

### Gateway süresiz olarak "Starting..." durumunda kalıyor

Gateway durumu "Starting..." üzerinde kalıyorsa bağlantı noktasını bir zombi işlemin tutup tutmadığını kontrol edin:

```bash
openclaw gateway status
openclaw gateway stop

# If you're not using a LaunchAgent (dev mode / manual runs), find the listener:
lsof -nP -iTCP:18789 -sTCP:LISTEN
```

Bağlantı noktasını elle çalıştırılan bir süreç tutuyorsa o süreci durdurun (Ctrl+C). Son çare olarak yukarıda bulduğunuz PID'yi sonlandırın.

## İlgili

- [macOS uygulaması](/tr/platforms/macos)
- [Kuruluma genel bakış](/tr/install)
