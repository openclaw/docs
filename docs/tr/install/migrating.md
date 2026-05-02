---
read_when:
    - OpenClaw’ı yeni bir dizüstü bilgisayara veya sunucuya taşıyorsunuz
    - Başka bir ajan sisteminden geliyorsunuz ve durumu korumak istiyorsunuz
    - Yerinde bir Plugin'i yükseltiyorsunuz
summary: 'Geçiş merkezi: sistemler arası içe aktarmalar, makineden makineye taşımalar ve Plugin yükseltmeleri'
title: Geçiş kılavuzu
x-i18n:
    generated_at: "2026-05-02T08:59:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: e447e38cf0086603a7b30ee5204e63cc8227ebc7a56add26d06ac2798a23e26f
    source_path: install/migrating.md
    workflow: 16
---

OpenClaw üç geçiş yolunu destekler: başka bir ajan sisteminden içe aktarma, mevcut bir kurulumu yeni bir makineye taşıma ve bir Plugin'i yerinde yükseltme.

## Başka bir ajan sisteminden içe aktarma

Talimatları, MCP sunucularını, Skills'i, model yapılandırmasını ve (isteğe bağlı) API anahtarlarını OpenClaw'a taşımak için birlikte gelen geçiş sağlayıcılarını kullanın. Planlar herhangi bir değişiklikten önce önizlenir, gizli değerler raporlarda redakte edilir ve uygulama doğrulanmış bir yedekle desteklenir.

<CardGroup cols={2}>
  <Card title="Migrating from Claude" href="/tr/install/migrating-claude" icon="brain">
    `CLAUDE.md`, MCP sunucuları, Skills ve proje komutları dahil Claude Code ve Claude Desktop durumunu içe aktarın.
  </Card>
  <Card title="Migrating from Hermes" href="/tr/install/migrating-hermes" icon="feather">
    Hermes yapılandırmasını, sağlayıcıları, MCP sunucularını, belleği, Skills'i ve desteklenen `.env` anahtarlarını içe aktarın.
  </Card>
</CardGroup>

CLI giriş noktası [`openclaw migrate`](/tr/cli/migrate) komutudur. Onboarding, bilinen bir kaynak algıladığında geçiş de sunabilir (`openclaw onboard --flow import`).

## OpenClaw'ı yeni bir makineye taşıma

Şunları korumak için **durum dizinini** (varsayılan olarak `~/.openclaw/`) ve **çalışma alanınızı** kopyalayın:

- **Yapılandırma** — `openclaw.json` ve tüm gateway ayarları.
- **Kimlik doğrulama** — ajan başına `auth-profiles.json` (API anahtarları ve OAuth) ile `credentials/` altındaki tüm kanal veya sağlayıcı durumu.
- **Oturumlar** — konuşma geçmişi ve ajan durumu.
- **Kanal durumu** — WhatsApp oturumu, Telegram oturumu ve benzerleri.
- **Çalışma alanı dosyaları** — `MEMORY.md`, `USER.md`, Skills ve istemler.

<Tip>
Durum dizini yolunuzu doğrulamak için eski makinede `openclaw status` çalıştırın. Özel profiller `~/.openclaw-<profile>/` dizinini veya `OPENCLAW_STATE_DIR` ile ayarlanan bir yolu kullanır.
</Tip>

### Geçiş adımları

<Steps>
  <Step title="Stop the gateway and back up">
    **Eski** makinede, dosyaların kopyalama sırasında değişmemesi için gateway'i durdurun, ardından arşivleyin:

    ```bash
    openclaw gateway stop
    cd ~
    tar -czf openclaw-state.tgz .openclaw
    ```

    Birden çok profil kullanıyorsanız (örneğin `~/.openclaw-work`), her birini ayrı ayrı arşivleyin.

  </Step>

  <Step title="Install OpenClaw on the new machine">
    Yeni makinede CLI'yi (ve gerekirse Node'u) [kurun](/tr/install). Onboarding'in yeni bir `~/.openclaw/` oluşturması sorun değildir. Bir sonraki adımda bunun üzerine yazacaksınız.
  </Step>

  <Step title="Copy state directory and workspace">
    Arşivi `scp`, `rsync -a` veya harici bir sürücüyle aktarın, ardından çıkarın:

    ```bash
    cd ~
    tar -xzf openclaw-state.tgz
    ```

    Gizli dizinlerin dahil edildiğinden ve dosya sahipliğinin gateway'i çalıştıracak kullanıcıyla eşleştiğinden emin olun.

  </Step>

  <Step title="Run doctor and verify">
    Yeni makinede, yapılandırma geçişlerini uygulamak ve hizmetleri onarmak için [Doctor](/tr/gateway/doctor) çalıştırın:

    ```bash
    openclaw doctor
    openclaw gateway restart
    openclaw status
    ```

  </Step>
</Steps>

Telegram veya Discord varsayılan env yedeğini (`TELEGRAM_BOT_TOKEN` veya `DISCORD_BOT_TOKEN`) kullanıyorsa, taşınan durum dizini `.env` dosyasının gizli değerleri yazdırmadan bu anahtarları içerdiğini doğrulayın:

```bash
awk -F= '/^(TELEGRAM_BOT_TOKEN|DISCORD_BOT_TOKEN)=/ { print $1 "=present" }' ~/.openclaw/.env
```

`openclaw doctor`, etkinleştirilmiş varsayılan bir Telegram veya Discord hesabında yapılandırılmış token olmadığında ve eşleşen env değişkeni doctor işlemi tarafından kullanılamadığında da uyarır.

### Yaygın hatalar

<AccordionGroup>
  <Accordion title="Profile or state-dir mismatch">
    Eski gateway `--profile` veya `OPENCLAW_STATE_DIR` kullandıysa ve yenisi kullanmıyorsa, kanallar oturum kapatmış görünecek ve oturumlar boş olacaktır. Gateway'i taşıdığınız **aynı** profil veya durum diziniyle başlatın, ardından `openclaw doctor` komutunu yeniden çalıştırın.
  </Accordion>

  <Accordion title="Copying only openclaw.json">
    Yapılandırma dosyası tek başına yeterli değildir. Model kimlik doğrulama profilleri `agents/<agentId>/agent/auth-profiles.json` altında bulunur; kanal ve sağlayıcı durumu ise `credentials/` altında bulunur. Her zaman **tüm** durum dizinini taşıyın.
  </Accordion>

  <Accordion title="Permissions and ownership">
    Root olarak kopyaladıysanız veya kullanıcı değiştirdiyseniz, gateway kimlik bilgilerini okuyamayabilir. Durum dizininin ve çalışma alanının gateway'i çalıştıran kullanıcıya ait olduğundan emin olun.
  </Accordion>

  <Accordion title="Remote mode">
    UI'niz **uzak** bir gateway'e işaret ediyorsa, oturumların ve çalışma alanının sahibi uzak ana makinedir. Yerel dizüstü bilgisayarınızı değil, gateway ana makinesinin kendisini taşıyın. [SSS](/tr/help/faq#where-things-live-on-disk) bölümüne bakın.
  </Accordion>

  <Accordion title="Secrets in backups">
    Durum dizini kimlik doğrulama profilleri, kanal kimlik bilgileri ve diğer sağlayıcı durumlarını içerir. Yedekleri şifrelenmiş olarak saklayın, güvenli olmayan aktarım kanallarından kaçının ve açığa çıkma şüpheniz varsa anahtarları döndürün.
  </Accordion>
</AccordionGroup>

### Doğrulama kontrol listesi

Yeni makinede şunları doğrulayın:

- [ ] `openclaw status`, gateway'in çalıştığını gösteriyor.
- [ ] Kanallar hâlâ bağlı (yeniden eşleştirme gerekmiyor).
- [ ] Dashboard açılıyor ve mevcut oturumları gösteriyor.
- [ ] Çalışma alanı dosyaları (bellek, yapılandırmalar) mevcut.

## Bir Plugin'i yerinde yükseltme

Yerinde Plugin yükseltmeleri aynı Plugin kimliğini ve yapılandırma anahtarlarını korur, ancak disk üzerindeki durumu geçerli düzene taşıyabilir. Plugin'e özel yükseltme kılavuzları kanallarının yanında bulunur:

- [Matrix geçişi](/tr/channels/matrix-migration): şifrelenmiş durum kurtarma sınırları, otomatik anlık görüntü davranışı ve manuel kurtarma komutları.

## İlgili

- [`openclaw migrate`](/tr/cli/migrate): sistemler arası içe aktarmalar için CLI referansı.
- [Kurulum genel bakışı](/tr/install): tüm kurulum yöntemleri.
- [Doctor](/tr/gateway/doctor): geçiş sonrası sağlık kontrolü.
- [Kaldırma](/tr/install/uninstall): OpenClaw'ı temiz şekilde kaldırma.
