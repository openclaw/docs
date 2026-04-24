---
read_when:
    - OpenClaw'ı yeni bir dizüstü bilgisayara/sunucuya taşıyorsunuz
    - Oturumları, kimlik doğrulamayı ve kanal oturumlarını (WhatsApp vb.) korumak istiyorsunuz
summary: Bir OpenClaw kurulumunu bir makineden diğerine taşıma (geçirme)
title: Geçiş rehberi
x-i18n:
    generated_at: "2026-04-24T09:16:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2c14be563d1eb052726324678cf2784efffc2341aa17f662587fdabe1d8ec1e2
    source_path: install/migrating.md
    workflow: 15
---

# OpenClaw'ı Yeni Bir Makineye Geçirme

Bu rehber, onboarding işlemini yeniden yapmadan bir OpenClaw Gateway'i yeni bir makineye taşır.

## Neler Geçirilir

**Durum dizinini** (varsayılan olarak `~/.openclaw/`) ve **çalışma alanınızı** kopyaladığınızda şunları korursunuz:

- **Yapılandırma** -- `openclaw.json` ve tüm Gateway ayarları
- **Kimlik doğrulama** -- ajan başına `auth-profiles.json` (API anahtarları + OAuth), ayrıca `credentials/` altındaki kanal/sağlayıcı durumu
- **Oturumlar** -- konuşma geçmişi ve ajan durumu
- **Kanal durumu** -- WhatsApp oturumu, Telegram oturumu vb.
- **Çalışma alanı dosyaları** -- `MEMORY.md`, `USER.md`, Skills ve istemler

<Tip>
Durum dizini yolunuzu doğrulamak için eski makinede `openclaw status` çalıştırın.
Özel profiller `~/.openclaw-<profile>/` kullanır veya `OPENCLAW_STATE_DIR` ile ayarlanmış bir yol kullanır.
</Tip>

## Geçiş Adımları

<Steps>
  <Step title="Gateway'i durdurun ve yedek alın">
    **Eski** makinede, dosyalar kopyalama sırasında değişmesin diye Gateway'i durdurun, ardından arşivleyin:

    ```bash
    openclaw gateway stop
    cd ~
    tar -czf openclaw-state.tgz .openclaw
    ```

    Birden fazla profil kullanıyorsanız (ör. `~/.openclaw-work`), her birini ayrı ayrı arşivleyin.

  </Step>

  <Step title="Yeni makineye OpenClaw kurun">
    Yeni makineye CLI'yi (ve gerekiyorsa Node'u) [kurun](/tr/install).
    Onboarding'in yeni bir `~/.openclaw/` oluşturması sorun değildir -- birazdan bunun üzerine yazacaksınız.
  </Step>

  <Step title="Durum dizinini ve çalışma alanını kopyalayın">
    Arşivi `scp`, `rsync -a` veya harici bir sürücü ile aktarın, ardından çıkarın:

    ```bash
    cd ~
    tar -xzf openclaw-state.tgz
    ```

    Gizli dizinlerin dahil edildiğinden ve dosya sahipliğinin Gateway'i çalıştıracak kullanıcıyla eşleştiğinden emin olun.

  </Step>

  <Step title="Doctor çalıştırın ve doğrulayın">
    Yeni makinede yapılandırma geçişlerini uygulamak ve hizmetleri onarmak için [Doctor](/tr/gateway/doctor) çalıştırın:

    ```bash
    openclaw doctor
    openclaw gateway restart
    openclaw status
    ```

  </Step>
</Steps>

## Yaygın Tuzaklar

<AccordionGroup>
  <Accordion title="Profil veya state-dir uyuşmazlığı">
    Eski Gateway `--profile` veya `OPENCLAW_STATE_DIR` kullanıyordu ama yenisi kullanmıyorsa
    kanallar oturumu kapatılmış gibi görünür ve oturumlar boş olur.
    Gateway'i geçirdiğiniz **aynı** profil veya state-dir ile başlatın, sonra `openclaw doctor` komutunu yeniden çalıştırın.
  </Accordion>

  <Accordion title="Yalnızca openclaw.json dosyasını kopyalamak">
    Yalnızca yapılandırma dosyası yeterli değildir. Model kimlik doğrulama profilleri
    `agents/<agentId>/agent/auth-profiles.json` altında bulunur ve kanal/sağlayıcı durumu hâlâ
    `credentials/` altında yaşar. Her zaman **tüm** durum dizinini geçirin.
  </Accordion>

  <Accordion title="İzinler ve sahiplik">
    Root olarak kopyaladıysanız veya kullanıcı değiştirdiyseniz Gateway kimlik bilgilerini okuyamayabilir.
    Durum dizini ve çalışma alanının Gateway'i çalıştıran kullanıcıya ait olduğundan emin olun.
  </Accordion>

  <Accordion title="Uzak mod">
    UI'niz bir **uzak** Gateway'i işaret ediyorsa oturumlar ve çalışma alanı uzak ana bilgisayara aittir.
    Yerel dizüstü bilgisayarınızı değil, Gateway ana bilgisayarının kendisini geçirin. Bkz. [SSS](/tr/help/faq#where-things-live-on-disk).
  </Accordion>

  <Accordion title="Yedeklerdeki gizli bilgiler">
    Durum dizini kimlik doğrulama profilleri, kanal kimlik bilgileri ve diğer
    sağlayıcı durumlarını içerir.
    Yedekleri şifreli saklayın, güvensiz aktarım kanallarından kaçının ve açığa çıkma şüphesi varsa anahtarları döndürün.
  </Accordion>
</AccordionGroup>

## Doğrulama Kontrol Listesi

Yeni makinede şunları doğrulayın:

- [ ] `openclaw status`, Gateway'in çalıştığını gösteriyor
- [ ] Kanallar hâlâ bağlı (yeniden Pairing gerekmiyor)
- [ ] Pano açılıyor ve mevcut oturumları gösteriyor
- [ ] Çalışma alanı dosyaları (bellek, yapılandırmalar) mevcut

## İlgili

- [Kuruluma genel bakış](/tr/install)
- [Matrix geçişi](/tr/install/migrating-matrix)
- [Kaldırma](/tr/install/uninstall)
