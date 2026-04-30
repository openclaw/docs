---
read_when:
    - macOS geliştirme ortamını kurma
summary: OpenClaw macOS uygulaması üzerinde çalışan geliştiriciler için kurulum kılavuzu
title: macOS geliştirme kurulumu
x-i18n:
    generated_at: "2026-04-30T09:32:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: d0c494b7a214b6db2880ba02c512653c35dbcdf80805bee9777ec946412668e1
    source_path: platforms/mac/dev-setup.md
    workflow: 16
---

# macOS geliştirici kurulumu

OpenClaw macOS uygulamasını kaynaktan derleyin ve çalıştırın.

## Ön koşullar

Uygulamayı derlemeden önce aşağıdakilerin yüklü olduğundan emin olun:

1. **Xcode 26.2+**: Swift geliştirme için gereklidir.
2. **Node.js 24 ve pnpm**: Gateway, CLI ve paketleme betikleri için önerilir. Şu anda `22.14+` olan Node 22 LTS, uyumluluk için desteklenmeye devam eder.

## 1. Bağımlılıkları Yükleyin

Proje genelindeki bağımlılıkları yükleyin:

```bash
pnpm install
```

## 2. Uygulamayı Derleyin ve Paketleyin

macOS uygulamasını derlemek ve `dist/OpenClaw.app` içine paketlemek için şunu çalıştırın:

```bash
./scripts/package-mac-app.sh
```

Apple Developer ID sertifikanız yoksa betik otomatik olarak **ad-hoc imzalama** (`-`) kullanır.

Geliştirme çalıştırma modları, imzalama bayrakları ve Team ID sorun giderme için macOS uygulaması README dosyasına bakın:
[https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md](https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md)

> **Not**: Ad-hoc imzalanmış uygulamalar güvenlik istemlerini tetikleyebilir. Uygulama "Abort trap 6" ile hemen çökerse [Sorun Giderme](#troubleshooting) bölümüne bakın.

## 3. CLI'yi Yükleyin

macOS uygulaması, arka plan görevlerini yönetmek için genel bir `openclaw` CLI kurulumuna ihtiyaç duyar.

**Yüklemek için (önerilir):**

1. OpenClaw uygulamasını açın.
2. **General** ayarlar sekmesine gidin.
3. **"Install CLI"** öğesine tıklayın.

Alternatif olarak elle yükleyin:

```bash
npm install -g openclaw@<version>
```

`pnpm add -g openclaw@<version>` ve `bun add -g openclaw@<version>` da çalışır.
Gateway çalışma zamanı için Node önerilen yol olmaya devam eder.

## Sorun Giderme

### Derleme başarısız: araç zinciri veya SDK uyuşmazlığı

macOS uygulama derlemesi en güncel macOS SDK'sını ve Swift 6.2 araç zincirini bekler.

**Sistem bağımlılıkları (gerekli):**

- **Software Update içinde sunulan en son macOS sürümü** (Xcode 26.2 SDK'ları tarafından gereklidir)
- **Xcode 26.2** (Swift 6.2 araç zinciri)

**Kontroller:**

```bash
xcodebuild -version
xcrun swift --version
```

Sürümler eşleşmiyorsa macOS/Xcode'u güncelleyin ve derlemeyi yeniden çalıştırın.

### İzin verme sırasında uygulama çöküyor

**Speech Recognition** veya **Microphone** erişimine izin vermeye çalıştığınızda uygulama çöküyorsa bunun nedeni bozuk bir TCC önbelleği veya imza uyuşmazlığı olabilir.

**Düzeltme:**

1. TCC izinlerini sıfırlayın:

   ```bash
   tccutil reset All ai.openclaw.mac.debug
   ```

2. Bu başarısız olursa macOS'tan "temiz başlangıç" zorlamak için [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh) içindeki `BUNDLE_ID` değerini geçici olarak değiştirin.

### Gateway süresiz olarak "Starting..." durumunda kalıyor

Gateway durumu "Starting..." olarak kalıyorsa bir zombi sürecin portu tutup tutmadığını kontrol edin:

```bash
openclaw gateway status
openclaw gateway stop

# LaunchAgent kullanmıyorsanız (geliştirme modu / elle çalıştırmalar), dinleyiciyi bulun:
lsof -nP -iTCP:18789 -sTCP:LISTEN
```

Elle çalıştırılan bir süreç portu tutuyorsa o süreci durdurun (Ctrl+C). Son çare olarak yukarıda bulduğunuz PID'yi sonlandırın.

## İlgili

- [macOS uygulaması](/tr/platforms/macos)
- [Kurulum özeti](/tr/install)
