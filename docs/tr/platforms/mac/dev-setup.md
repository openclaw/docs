---
read_when:
    - macOS geliştirme ortamını kurarken
summary: OpenClaw macOS uygulaması üzerinde çalışan geliştiriciler için kurulum kılavuzu
title: macOS Geliştirme Kurulumu
x-i18n:
    generated_at: "2026-04-05T14:00:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: fd13f17391bdd87ef59e4c575e5da3312c4066de00905731263bff655a5db357
    source_path: platforms/mac/dev-setup.md
    workflow: 15
---

# macOS Geliştirici Kurulumu

Bu kılavuz, OpenClaw macOS uygulamasını kaynak koddan derlemek ve çalıştırmak için gerekli adımları kapsar.

## Ön koşullar

Uygulamayı derlemeden önce aşağıdakilerin kurulu olduğundan emin olun:

1. **Xcode 26.2+**: Swift geliştirme için gereklidir.
2. **Node.js 24 ve pnpm**: Gateway, CLI ve paketleme betikleri için önerilir. Uyumluluk için Node 22 LTS, şu anda `22.14+`, desteklenmeye devam eder.

## 1. Bağımlılıkları yükleyin

Proje genelindeki bağımlılıkları yükleyin:

```bash
pnpm install
```

## 2. Uygulamayı derleyin ve paketleyin

macOS uygulamasını derlemek ve `dist/OpenClaw.app` içine paketlemek için şunu çalıştırın:

```bash
./scripts/package-mac-app.sh
```

Apple Developer ID sertifikanız yoksa betik otomatik olarak **ad-hoc imzalama** (`-`) kullanır.

Geliştirme çalıştırma modları, imzalama bayrakları ve Team ID sorun giderme için macOS uygulaması README dosyasına bakın:
[https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md](https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md)

> **Not**: Ad-hoc imzalı uygulamalar güvenlik istemlerini tetikleyebilir. Uygulama "Abort trap 6" ile hemen çöküyorsa [Sorun Giderme](#troubleshooting) bölümüne bakın.

## 3. CLI'yi yükleyin

macOS uygulaması, arka plan görevlerini yönetmek için global bir `openclaw` CLI kurulumunu bekler.

**Yüklemek için (önerilir):**

1. OpenClaw uygulamasını açın.
2. **General** ayarları sekmesine gidin.
3. **"Install CLI"** seçeneğine tıklayın.

Alternatif olarak manuel olarak yükleyin:

```bash
npm install -g openclaw@<version>
```

`pnpm add -g openclaw@<version>` ve `bun add -g openclaw@<version>` de çalışır.
Gateway çalışma zamanı için önerilen yol Node olmaya devam eder.

## Sorun giderme

### Derleme Başarısız: Toolchain veya SDK Uyumsuzluğu

macOS uygulaması derlemesi en son macOS SDK'sını ve Swift 6.2 toolchain'ini bekler.

**Sistem bağımlılıkları (gerekli):**

- **Software Update içinde mevcut olan en son macOS sürümü** (Xcode 26.2 SDK'ları için gereklidir)
- **Xcode 26.2** (Swift 6.2 toolchain)

**Kontroller:**

```bash
xcodebuild -version
xcrun swift --version
```

Sürümler eşleşmiyorsa macOS/Xcode'u güncelleyin ve derlemeyi yeniden çalıştırın.

### İzin Verilirken Uygulama Çöküyor

**Speech Recognition** veya **Microphone** erişimine izin vermeye çalıştığınızda uygulama çöküyorsa bunun nedeni bozulmuş bir TCC önbelleği veya imza uyumsuzluğu olabilir.

**Düzeltme:**

1. TCC izinlerini sıfırlayın:

   ```bash
   tccutil reset All ai.openclaw.mac.debug
   ```

2. Bu işe yaramazsa macOS'tan "temiz bir başlangıç" zorlamak için [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh) içinde `BUNDLE_ID` değerini geçici olarak değiştirin.

### Gateway süresiz olarak "Starting..." durumunda kalıyor

Gateway durumu "Starting..." üzerinde kalıyorsa portu bir zombi sürecin tutup tutmadığını kontrol edin:

```bash
openclaw gateway status
openclaw gateway stop

# Bir LaunchAgent kullanmıyorsanız (geliştirme modu / manuel çalıştırmalar), dinleyiciyi bulun:
lsof -nP -iTCP:18789 -sTCP:LISTEN
```

Portu manuel bir çalıştırma tutuyorsa bu süreci durdurun (Ctrl+C). Son çare olarak yukarıda bulduğunuz PID'yi sonlandırın.
