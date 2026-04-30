---
read_when:
    - OpenClaw'u yeni bir dizüstü bilgisayara veya sunucuya taşıyorsunuz
    - Başka bir ajan sisteminden geliyor ve durumu korumak istiyorsunuz
    - Bir Plugin için yerinde yükseltme yapıyorsunuz
summary: 'Geçiş merkezi: sistemler arası içe aktarmalar, makineden makineye taşımalar ve Plugin yükseltmeleri'
title: Geçiş kılavuzu
x-i18n:
    generated_at: "2026-04-30T09:30:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: e2a1dc86ed367a0b92cdc0d5189123bb045d327be944516f564dac723f324c97
    source_path: install/migrating.md
    workflow: 16
---

OpenClaw üç migration yolunu destekler: başka bir agent sisteminden içe aktarma, mevcut bir kurulumu yeni bir makineye taşıma ve bir Plugin'i yerinde yükseltme.

## Başka bir agent sisteminden içe aktarma

Talimatları, MCP sunucularını, skills, model yapılandırmasını ve (isteğe bağlı) API anahtarlarını OpenClaw'a getirmek için birlikte gelen migration sağlayıcılarını kullanın. Planlar herhangi bir değişiklikten önce önizlenir, sırlar raporlarda redakte edilir ve uygulama, doğrulanmış bir yedeklemeyle desteklenir.

<CardGroup cols={2}>
  <Card title="Claude'dan geçiş" href="/tr/install/migrating-claude" icon="brain">
    `CLAUDE.md`, MCP sunucuları, skills ve proje komutları dahil olmak üzere Claude Code ve Claude Desktop durumunu içe aktarın.
  </Card>
  <Card title="Hermes'ten geçiş" href="/tr/install/migrating-hermes" icon="feather">
    Hermes yapılandırmasını, sağlayıcıları, MCP sunucularını, belleği, skills ve desteklenen `.env` anahtarlarını içe aktarın.
  </Card>
</CardGroup>

CLI giriş noktası [`openclaw migrate`](/tr/cli/migrate). Onboarding, bilinen bir kaynak algıladığında migration da sunabilir (`openclaw onboard --flow import`).

## OpenClaw'u yeni bir makineye taşıma

Şunları korumak için **durum dizinini** (varsayılan olarak `~/.openclaw/`) ve **çalışma alanınızı** kopyalayın:

- **Yapılandırma** — `openclaw.json` ve tüm Gateway ayarları.
- **Kimlik doğrulama** — agent başına `auth-profiles.json` (API anahtarları ve OAuth) ile `credentials/` altındaki kanal veya sağlayıcı durumları.
- **Oturumlar** — konuşma geçmişi ve agent durumu.
- **Kanal durumu** — WhatsApp oturumu, Telegram oturumu ve benzerleri.
- **Çalışma alanı dosyaları** — `MEMORY.md`, `USER.md`, skills ve istemler.

<Tip>
Durum dizini yolunuzu doğrulamak için eski makinede `openclaw status` çalıştırın. Özel profiller `~/.openclaw-<profile>/` veya `OPENCLAW_STATE_DIR` üzerinden ayarlanan bir yol kullanır.
</Tip>

### Migration adımları

<Steps>
  <Step title="Gateway'i durdurun ve yedekleyin">
    **Eski** makinede, kopyalama sırasında dosyaların değişmemesi için Gateway'i durdurun, ardından arşivleyin:

    ```bash
    openclaw gateway stop
    cd ~
    tar -czf openclaw-state.tgz .openclaw
    ```

    Birden fazla profil kullanıyorsanız (örneğin `~/.openclaw-work`), her birini ayrı ayrı arşivleyin.

  </Step>

  <Step title="OpenClaw'u yeni makineye kurun">
    Yeni makineye CLI'yi (ve gerekirse Node'u) [kurun](/tr/install). Onboarding'in yeni bir `~/.openclaw/` oluşturmasında sorun yoktur. Sonraki adımda bunun üzerine yazacaksınız.
  </Step>

  <Step title="Durum dizinini ve çalışma alanını kopyalayın">
    Arşivi `scp`, `rsync -a` veya harici bir sürücü aracılığıyla aktarın, ardından çıkarın:

    ```bash
    cd ~
    tar -xzf openclaw-state.tgz
    ```

    Gizli dizinlerin dahil edildiğinden ve dosya sahipliğinin Gateway'i çalıştıracak kullanıcıyla eşleştiğinden emin olun.

  </Step>

  <Step title="Doctor çalıştırın ve doğrulayın">
    Yeni makinede, yapılandırma migration'larını uygulamak ve servisleri onarmak için [Doctor](/tr/gateway/doctor) çalıştırın:

    ```bash
    openclaw doctor
    openclaw gateway restart
    openclaw status
    ```

  </Step>
</Steps>

### Yaygın sorunlar

<AccordionGroup>
  <Accordion title="Profil veya state-dir uyumsuzluğu">
    Eski Gateway `--profile` veya `OPENCLAW_STATE_DIR` kullandıysa ve yenisi kullanmıyorsa, kanallar oturum kapatmış gibi görünür ve oturumlar boş olur. Gateway'i migrate ettiğiniz **aynı** profil veya state-dir ile başlatın, ardından `openclaw doctor` komutunu yeniden çalıştırın.
  </Accordion>

  <Accordion title="Yalnızca openclaw.json kopyalamak">
    Yapılandırma dosyası tek başına yeterli değildir. Model kimlik doğrulama profilleri `agents/<agentId>/agent/auth-profiles.json` altında, kanal ve sağlayıcı durumu ise `credentials/` altında bulunur. Her zaman **tüm** durum dizinini migrate edin.
  </Accordion>

  <Accordion title="İzinler ve sahiplik">
    Root olarak kopyaladıysanız veya kullanıcı değiştirdiyseniz Gateway kimlik bilgilerini okuyamayabilir. Durum dizininin ve çalışma alanının Gateway'i çalıştıran kullanıcıya ait olduğundan emin olun.
  </Accordion>

  <Accordion title="Uzak mod">
    UI'niz **uzak** bir Gateway'e işaret ediyorsa, oturumların ve çalışma alanının sahibi uzak hosttur. Yerel dizüstü bilgisayarınızı değil, Gateway hostunun kendisini migrate edin. Bkz. [SSS](/tr/help/faq#where-things-live-on-disk).
  </Accordion>

  <Accordion title="Yedeklerdeki sırlar">
    Durum dizini kimlik doğrulama profilleri, kanal kimlik bilgileri ve diğer sağlayıcı durumlarını içerir. Yedekleri şifreli saklayın, güvenli olmayan aktarım kanallarından kaçının ve açığa çıktığından şüpheleniyorsanız anahtarları döndürün.
  </Accordion>
</AccordionGroup>

### Doğrulama kontrol listesi

Yeni makinede şunları doğrulayın:

- [ ] `openclaw status` Gateway'in çalıştığını gösteriyor.
- [ ] Kanallar hâlâ bağlı (yeniden eşleştirme gerekmiyor).
- [ ] Pano açılıyor ve mevcut oturumları gösteriyor.
- [ ] Çalışma alanı dosyaları (bellek, yapılandırmalar) mevcut.

## Bir Plugin'i yerinde yükseltme

Yerinde Plugin yükseltmeleri aynı Plugin kimliğini ve yapılandırma anahtarlarını korur, ancak diskteki durumu mevcut düzene taşıyabilir. Plugin'e özel yükseltme kılavuzları kanallarının yanında bulunur:

- [Matrix migration](/tr/channels/matrix-migration): şifrelenmiş durum kurtarma sınırları, otomatik anlık görüntü davranışı ve manuel kurtarma komutları.

## İlgili

- [`openclaw migrate`](/tr/cli/migrate): sistemler arası içe aktarmalar için CLI referansı.
- [Kurulum genel bakışı](/tr/install): tüm kurulum yöntemleri.
- [Doctor](/tr/gateway/doctor): migration sonrası sağlık kontrolü.
- [Kaldırma](/tr/install/uninstall): OpenClaw'u temiz şekilde kaldırma.
