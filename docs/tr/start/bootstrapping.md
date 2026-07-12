---
read_when:
    - İlk ajan çalıştırmasında neler olduğunu anlama
    - Önyükleme dosyalarının nerede bulunduğunu açıklama
    - İlk katılım kimlik kurulumunda hata ayıklama
sidebarTitle: Bootstrapping
summary: Çalışma alanı ve kimlik dosyalarını başlangıç verileriyle dolduran ajan önyükleme ritüeli
title: Ajan önyüklemesi
x-i18n:
    generated_at: "2026-07-12T12:15:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d8356684e8567b02f558ce2b455a20019e55579e5dcb4625bb441d66656098e0
    source_path: start/bootstrapping.md
    workflow: 16
---

Önyükleme, yeni bir ajan çalışma alanını başlangıç dosyalarıyla hazırlayan ve
ajanın bir kimlik seçmesine rehberlik eden ilk çalıştırma ritüelidir. İlk katılımın
hemen ardından, ajanın ilk gerçek turunda bir kez çalışır.

## Neler olur

Yepyeni bir çalışma alanında (varsayılan `~/.openclaw/workspace`) ilk kez
çalıştırıldığında OpenClaw:

- `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` ve `BOOTSTRAP.md` dosyalarını başlangıç içerikleriyle oluşturur.
- Ajanın `BOOTSTRAP.md` dosyasını izlemesini sağlar: bir ad, kişilik ve genel tarz belirlemek için serbest biçimli bir konuşma (sabit bir soru-cevap formu değil).
- Öğrendiklerini `IDENTITY.md`, `USER.md` ve `SOUL.md` dosyalarına yazar.
- Çalışma alanı yapılandırılmış göründüğünde `BOOTSTRAP.md` dosyasını siler; böylece ritüel yalnızca bir kez çalışır.

`SOUL.md`, `IDENTITY.md` veya `USER.md` başlangıç şablonundan farklılaştığında
ya da bir `memory/` klasörü bulunduğunda çalışma alanı yapılandırılmış sayılır.

<Note>
`BOOTSTRAP.md`, kimlik konuşmasının tamamını kapsar. İçeriğini
[BOOTSTRAP.md şablonu](/tr/reference/templates/BOOTSTRAP) sayfasında görebilirsiniz.
</Note>

## Gömülü ve yerel model çalıştırmaları

OpenClaw, gömülü veya yerel model çalıştırmalarında `BOOTSTRAP.md` dosyasını
ayrıcalıklı sistem bağlamının dışında tutar. Birincil etkileşimli ilk çalıştırmada
dosya içeriğini yine de kullanıcı istemi üzerinden iletir; böylece `read` aracını
güvenilir biçimde çağırmayan modeller de ritüeli tamamlayabilir. Geçerli çalıştırma
çalışma alanına güvenli biçimde erişemiyorsa ajan, genel bir karşılama yerine kısa
ve sınırlı bir önyükleme notu alır.

## Önyüklemeyi atlama

Önceden hazırlanmış bir çalışma alanında bunu atlamak için şunu çalıştırın:

```bash
openclaw onboard --skip-bootstrap
```

## Nerede çalışır

Önyükleme her zaman Gateway ana makinesinde çalışır. macOS uygulaması uzak bir
Gateway'e bağlanırsa çalışma alanı ve önyükleme dosyaları Mac'te değil, uzak
makinede bulunur.

<Note>
Gateway başka bir makinede çalışıyorsa çalışma alanı dosyalarını Gateway ana
makinesinde düzenleyin (örneğin `user@gateway-host:~/.openclaw/workspace`).
</Note>

## İlgili belgeler

- macOS uygulamasında ilk katılım: [İlk katılım](/tr/start/onboarding)
- Çalışma alanı düzeni: [Ajan çalışma alanı](/tr/concepts/agent-workspace)
- Şablon içeriği: [BOOTSTRAP.md şablonu](/tr/reference/templates/BOOTSTRAP)
