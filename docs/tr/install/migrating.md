---
read_when:
    - OpenClaw’ı yeni bir dizüstü bilgisayara/sunucuya taşıyorsunuz
    - Oturumları, kimlik doğrulamayı ve kanal girişlerini (WhatsApp vb.) korumak istiyorsunuz
summary: Bir OpenClaw kurulumunu bir makineden diğerine taşıyın (migrate)
title: Geçiş Kılavuzu
x-i18n:
    generated_at: "2026-04-05T13:57:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 403f0b9677ce723c84abdbabfad20e0f70fd48392ebf23eabb7f8a111fd6a26d
    source_path: install/migrating.md
    workflow: 15
---

# OpenClaw’ı Yeni Bir Makineye Taşıma

Bu kılavuz, onboarding’i yeniden yapmadan bir OpenClaw gateway’ini yeni bir makineye taşır.

## Neler Taşınır

**Durum dizinini** (varsayılan olarak `~/.openclaw/`) ve **çalışma alanınızı** kopyaladığınızda şunları korursunuz:

- **Yapılandırma** -- `openclaw.json` ve tüm gateway ayarları
- **Kimlik doğrulama** -- agent başına `auth-profiles.json` (API anahtarları + OAuth), ayrıca `credentials/` altındaki tüm kanal/sağlayıcı durumu
- **Oturumlar** -- konuşma geçmişi ve agent durumu
- **Kanal durumu** -- WhatsApp girişi, Telegram oturumu vb.
- **Çalışma alanı dosyaları** -- `MEMORY.md`, `USER.md`, skills ve istemler

<Tip>
Durum dizini yolunuzu doğrulamak için eski makinede `openclaw status` çalıştırın.
Özel profiller `~/.openclaw-<profile>/` veya `OPENCLAW_STATE_DIR` ile ayarlanan bir yol kullanır.
</Tip>

## Geçiş Adımları

<Steps>
  <Step title="Gateway’i durdurun ve yedek alın">
    **Eski** makinede, dosyalar kopyalama sırasında değişmesin diye gateway’i durdurun, ardından arşivleyin:

    ```bash
    openclaw gateway stop
    cd ~
    tar -czf openclaw-state.tgz .openclaw
    ```

    Birden fazla profil kullanıyorsanız (ör. `~/.openclaw-work`), her birini ayrı ayrı arşivleyin.

  </Step>

  <Step title="OpenClaw’ı yeni makineye kurun">
    Yeni makinede CLI’yi (ve gerekirse Node’u) [Install](/install) ile kurun.
    Onboarding’in yeni bir `~/.openclaw/` oluşturması sorun değildir -- bir sonraki adımda üzerine yazacaksınız.
  </Step>

  <Step title="Durum dizinini ve çalışma alanını kopyalayın">
    Arşivi `scp`, `rsync -a` veya harici sürücü ile aktarın, sonra çıkarın:

    ```bash
    cd ~
    tar -xzf openclaw-state.tgz
    ```

    Gizli dizinlerin dahil edildiğinden ve dosya sahipliğinin gateway’i çalıştıracak kullanıcıyla eşleştiğinden emin olun.

  </Step>

  <Step title="Doctor çalıştırın ve doğrulayın">
    Yeni makinede, yapılandırma geçişlerini uygulamak ve hizmetleri onarmak için [Doctor](/gateway/doctor) çalıştırın:

    ```bash
    openclaw doctor
    openclaw gateway restart
    openclaw status
    ```

  </Step>
</Steps>

## Yaygın Hatalar

<AccordionGroup>
  <Accordion title="Profil veya durum dizini uyumsuzluğu">
    Eski gateway `--profile` veya `OPENCLAW_STATE_DIR` kullanıyorduysa ve yenisi kullanmıyorsa,
    kanallar oturumu kapatılmış gibi görünür ve oturumlar boş olur.
    Gateway’i taşıdığınız **aynı** profil veya durum diziniyle başlatın, ardından `openclaw doctor` komutunu yeniden çalıştırın.
  </Accordion>

  <Accordion title="Yalnızca openclaw.json dosyasını kopyalamak">
    Tek başına yapılandırma dosyası yeterli değildir. Model kimlik doğrulama profilleri
    `agents/<agentId>/agent/auth-profiles.json` altında bulunur, kanal/sağlayıcı durumu ise hâlâ
    `credentials/` altında yaşar. Her zaman **tüm** durum dizinini taşıyın.
  </Accordion>

  <Accordion title="İzinler ve sahiplik">
    Root olarak kopyaladıysanız veya kullanıcı değiştirdiyseniz, gateway kimlik bilgilerini okuyamayabilir.
    Durum dizininin ve çalışma alanının gateway’i çalıştıran kullanıcıya ait olduğundan emin olun.
  </Accordion>

  <Accordion title="Uzak mod">
    UI’niz **uzak** bir gateway’e işaret ediyorsa, oturumların ve çalışma alanının sahibi uzak ana bilgisayardır.
    Yerel dizüstü bilgisayarınızı değil, gateway ana bilgisayarının kendisini taşıyın. Bkz. [FAQ](/help/faq#where-things-live-on-disk).
  </Accordion>

  <Accordion title="Yedeklerdeki gizli bilgiler">
    Durum dizini; kimlik doğrulama profilleri, kanal kimlik bilgileri ve diğer
    sağlayıcı durumlarını içerir.
    Yedekleri şifreli saklayın, güvenli olmayan aktarım kanallarından kaçının ve maruz kalmadan şüpheleniyorsanız anahtarları döndürün.
  </Accordion>
</AccordionGroup>

## Doğrulama Kontrol Listesi

Yeni makinede şunları doğrulayın:

- [ ] `openclaw status`, gateway’in çalıştığını gösteriyor
- [ ] Kanallar hâlâ bağlı (yeniden eşleştirme gerekmiyor)
- [ ] Dashboard açılıyor ve mevcut oturumları gösteriyor
- [ ] Çalışma alanı dosyaları (hafıza, yapılandırmalar) mevcut
