---
read_when:
    - macOS geliştirme ortamını ayarlama
summary: OpenClaw macOS uygulaması üzerinde çalışan geliştiriciler için kurulum kılavuzu
title: macOS geliştirme kurulumu
x-i18n:
    generated_at: "2026-07-12T11:56:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bd7d556af92892d3deea3f5d8238a33cd413e10b0b377468396221e174ace8fe
    source_path: platforms/mac/dev-setup.md
    workflow: 16
---

# macOS geliştirici kurulumu

OpenClaw macOS uygulamasını kaynak koddan derleyin ve çalıştırın.

## Ön koşullar

- Yazılım Güncelleme'de bulunan en son macOS sürümünde **Xcode 26.2+** (Swift 6.2 araç zinciri).
- Gateway, CLI ve paketleme betikleri için **Node.js 24 ve pnpm**. Node 22.19+ da çalışır.

## 1. Bağımlılıkları yükleyin

```bash
pnpm install
```

`dist/OpenClaw.app` çıktısını üretir. Apple Developer ID sertifikası yoksa betik geçici imzalamaya geri döner.

Geliştirme çalıştırma modları, imzalama bayrakları ve Team ID sorunlarını giderme hakkında bilgi için [apps/macos/README.md](https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md) belgesine bakın. Depo kökünden hızlı geliştirme döngüsü: `scripts/restart-mac.sh` (geçici imzalama için `--no-sign` ekleyin; TCC izinleri `--no-sign` ile kalıcı olmaz).

<Note>
Geçici olarak imzalanmış uygulamalar güvenlik istemlerini tetikleyebilir. Uygulama "Abort trap 6" hatasıyla hemen çökerse [Sorun giderme](#troubleshooting) bölümüne bakın.
</Note>

## 2. Uygulamayı derleyin ve paketleyin

```bash
./scripts/package-mac-app.sh
```

## 3. CLI ve Gateway'i yükleyin

Paketlenmiş uygulama, standart `scripts/install-cli.sh` yükleyicisini içerir. Yeni bir profilde ilk katılım sırasında **This Mac** seçeneğini belirleyin; uygulama, Gateway sihirbazını başlatmadan önce eşleşen kullanıcı alanı CLI'sini ve çalışma zamanını yükler.

Elle geliştirme kurtarması için eşleşen CLI'yi kendiniz yükleyin:

```bash
npm install -g openclaw@<version>
```

`pnpm add -g openclaw@<version>` ve `bun add -g openclaw@<version>` da çalışır. Gateway'in kendisi için önerilen çalışma zamanı Node olmaya devam eder.

## Sorun giderme

### Derleme başarısız oluyor: araç zinciri veya SDK uyuşmazlığı

macOS uygulama derlemesi, en son macOS SDK'sını ve Swift 6.2 araç zincirini (Xcode 26.2+) gerektirir.

```bash
xcodebuild -version
xcrun swift --version
```

Sürümler eşleşmiyorsa macOS/Xcode'u güncelleyin ve derlemeyi yeniden çalıştırın.

### İzin verilirken uygulama çöküyor

**Speech Recognition** veya **Microphone** erişimine izin vermeye çalıştığınızda uygulama çöküyorsa bunun nedeni bozulmuş bir TCC önbelleği veya imza uyuşmazlığı olabilir.

1. Hata ayıklama paket kimliği için TCC izinlerini sıfırlayın:

   ```bash
   tccutil reset All ai.openclaw.mac.debug
   ```

2. Bu işlem başarısız olursa macOS'ta temiz bir başlangıç sağlamak için [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh) içindeki `BUNDLE_ID` değerini geçici olarak değiştirin.

### Gateway süresiz olarak "Starting..." durumunda kalıyor

Bağlantı noktasını bir zombi işlemin tutup tutmadığını kontrol edin:

```bash
openclaw gateway status
openclaw gateway stop

# LaunchAgent kullanmıyorsanız (geliştirme modu / elle çalıştırmalar), dinleyiciyi bulun:
lsof -nP -iTCP:18789 -sTCP:LISTEN
```

Bağlantı noktasını elle başlatılmış bir işlem tutuyorsa işlemi durdurun (Ctrl+C) veya son çare olarak yukarıda bulunan PID'yi sonlandırın.

## İlgili

- [macOS uygulaması](/tr/platforms/macos)
- [Kuruluma genel bakış](/tr/install)
