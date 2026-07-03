---
read_when:
    - Yaygın kurulum, yükleme, başlangıç yapılandırması veya çalışma zamanı destek sorularını yanıtlama
    - Daha derin hata ayıklamadan önce kullanıcıların bildirdiği sorunları triyaj etme
summary: OpenClaw kurulumu, yapılandırması ve kullanımı hakkında sık sorulan sorular
title: SSS
x-i18n:
    generated_at: "2026-07-03T17:40:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4d55385d187c20dfce05022b76fcaa054c19fc22e46da66d4a24e2538dd95708
    source_path: help/faq.md
    workflow: 16
---

Gerçek dünya kurulumları (yerel geliştirme, VPS, çoklu ajan, OAuth/API anahtarları, model failover) için hızlı yanıtlar ve daha derin sorun giderme. Çalışma zamanı tanılamaları için [Sorun Giderme](/tr/gateway/troubleshooting) bölümüne bakın. Tam yapılandırma referansı için [Yapılandırma](/tr/gateway/configuration) bölümüne bakın.

## Bir şey bozulduysa ilk 60 saniye

1. **Hızlı durum (ilk kontrol)**

   ```bash
   openclaw status
   ```

   Hızlı yerel özet: OS + güncelleme, gateway/servis erişilebilirliği, ajanlar/oturumlar, sağlayıcı yapılandırması + çalışma zamanı sorunları (gateway erişilebilirse).

2. **Yapıştırılabilir rapor (paylaşması güvenli)**

   ```bash
   openclaw status --all
   ```

   Günlük sonuyla birlikte salt okunur tanılama (token'lar redakte edilir).

3. **Daemon + port durumu**

   ```bash
   openclaw gateway status
   ```

   Supervisor çalışma zamanı ile RPC erişilebilirliğini, prob hedef URL'sini ve servisin muhtemelen hangi yapılandırmayı kullandığını gösterir.

4. **Derin problar**

   ```bash
   openclaw status --deep
   ```

   Desteklendiğinde kanal probları dahil canlı bir gateway sağlık probu çalıştırır
   (erişilebilir bir gateway gerektirir). Bkz. [Sağlık](/tr/gateway/health).

5. **En son günlüğü izle**

   ```bash
   openclaw logs --follow
   ```

   RPC çalışmıyorsa şuna geri dönün:

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   Dosya günlükleri servis günlüklerinden ayrıdır; bkz. [Günlükleme](/tr/logging) ve [Sorun Giderme](/tr/gateway/troubleshooting).

6. **Doctor'ı çalıştır (onarımlar)**

   ```bash
   openclaw doctor
   ```

   Yapılandırmayı/durumu onarır veya taşır + sağlık kontrollerini çalıştırır. Bkz. [Doctor](/tr/gateway/doctor).

7. **Gateway anlık görüntüsü**

   ```bash
   openclaw health --json
   openclaw health --verbose   # hatalarda hedef URL'yi + yapılandırma yolunu gösterir
   ```

   Çalışan gateway'den tam bir anlık görüntü ister (yalnızca WS). Bkz. [Sağlık](/tr/gateway/health).

## Hızlı başlangıç ve ilk çalıştırma kurulumu

İlk çalıştırma SSS'si - kurulum, onboard, kimlik doğrulama rotaları, abonelikler, ilk hatalar -
[İlk çalıştırma SSS](/tr/help/faq-first-run) sayfasında bulunur.

## OpenClaw nedir?

<AccordionGroup>
  <Accordion title="OpenClaw tek paragrafta nedir?">
    OpenClaw, kendi cihazlarınızda çalıştırdığınız kişisel bir AI asistanıdır. Zaten kullandığınız mesajlaşma yüzeylerinde (WhatsApp, Telegram, Slack, Mattermost, Discord, Google Chat, Signal, iMessage, WebChat ve QQ Bot gibi paketli kanal plugin'leri) yanıt verir ve desteklenen platformlarda ses + canlı Canvas da sunabilir. **Gateway**, sürekli açık kontrol düzlemidir; asistan ise ürünün kendisidir.
  </Accordion>

  <Accordion title="Değer önerisi">
    OpenClaw "sadece bir Claude sarmalayıcısı" değildir. Kendi donanımınızda yetenekli bir asistan çalıştırmanızı sağlayan, zaten kullandığınız sohbet uygulamalarından erişilebilen, durum bilgili oturumlar, bellek ve araçlar sunan bir **yerel öncelikli kontrol düzlemidir**; iş akışlarınızın kontrolünü barındırılan bir SaaS'a devretmeden.

    Öne çıkanlar:

    - **Cihazlarınız, verileriniz:** Gateway'i istediğiniz yerde (Mac, Linux, VPS) çalıştırın ve çalışma alanı + oturum geçmişini yerel tutun.
    - **Web korumalı alanı değil, gerçek kanallar:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage/vb,
      ayrıca desteklenen platformlarda mobil ses ve Canvas.
    - **Modelden bağımsız:** Ajan başına yönlendirme ve failover ile Anthropic, OpenAI, MiniMax, OpenRouter vb. kullanın.
    - **Yalnızca yerel seçeneği:** İsterseniz **tüm veriler cihazınızda kalabilsin** diye yerel modeller çalıştırın.
    - **Çoklu ajan yönlendirme:** Her biri kendi çalışma alanına ve varsayılanlarına sahip, kanal, hesap veya görev başına ayrı ajanlar.
    - **Açık kaynak ve hacklenebilir:** Tedarikçi kilidine girmeden inceleyin, genişletin ve kendi kendinize barındırın.

    Belgeler: [Gateway](/tr/gateway), [Kanallar](/tr/channels), [Çoklu ajan](/tr/concepts/multi-agent),
    [Bellek](/tr/concepts/memory).

  </Accordion>

  <Accordion title="Yeni kurdum - önce ne yapmalıyım?">
    İyi ilk projeler:

    - Bir web sitesi oluşturun (WordPress, Shopify veya basit bir statik site).
    - Bir mobil uygulama prototipi çıkarın (taslak, ekranlar, API planı).
    - Dosya ve klasörleri düzenleyin (temizlik, adlandırma, etiketleme).
    - Gmail'i bağlayın ve özetleri veya takipleri otomatikleştirin.

    Büyük görevleri yapabilir, ancak onları aşamalara böldüğünüzde ve
    paralel çalışma için alt ajanlar kullandığınızda en iyi şekilde çalışır.

  </Accordion>

  <Accordion title="OpenClaw için en yaygın beş günlük kullanım senaryosu nedir?">
    Günlük kazanımlar genellikle şöyle görünür:

    - **Kişisel brifingler:** Gelen kutusu, takvim ve önemsediğiniz haberlerin özetleri.
    - **Araştırma ve taslak oluşturma:** E-postalar veya belgeler için hızlı araştırma, özetler ve ilk taslaklar.
    - **Hatırlatıcılar ve takipler:** Cron veya Heartbeat odaklı dürtmeler ve kontrol listeleri.
    - **Tarayıcı otomasyonu:** Form doldurma, veri toplama ve web görevlerini tekrarlama.
    - **Cihazlar arası koordinasyon:** Telefonunuzdan bir görev gönderin, Gateway'in bunu bir sunucuda çalıştırmasını sağlayın ve sonucu sohbette geri alın.

  </Accordion>

  <Accordion title="OpenClaw, bir SaaS için potansiyel müşteri bulma, erişim, reklam ve blog konularında yardımcı olabilir mi?">
    **Araştırma, nitelendirme ve taslak oluşturma** için evet. Siteleri tarayabilir, kısa listeler oluşturabilir,
    potansiyel müşterileri özetleyebilir ve erişim ya da reklam metni taslakları yazabilir.

    **Erişim veya reklam çalışmaları** için insanı döngüde tutun. Spam'den kaçının, yerel yasalara ve
    platform politikalarına uyun ve gönderilmeden önce her şeyi inceleyin. En güvenli desen,
    OpenClaw'ın taslak hazırlaması ve sizin onaylamanızdır.

    Belgeler: [Güvenlik](/tr/gateway/security).

  </Accordion>

  <Accordion title="Web geliştirme için Claude Code'a göre avantajları nelerdir?">
    OpenClaw bir **kişisel asistan** ve koordinasyon katmanıdır, IDE yerine geçmez. Bir repo içinde en hızlı doğrudan kodlama döngüsü için
    Claude Code veya Codex kullanın. Kalıcı bellek, cihazlar arası erişim ve araç orkestrasyonu istediğinizde OpenClaw kullanın.

    Avantajlar:

    - Oturumlar arasında **kalıcı bellek + çalışma alanı**
    - **Çok platformlu erişim** (WhatsApp, Telegram, TUI, WebChat)
    - **Araç orkestrasyonu** (tarayıcı, dosyalar, zamanlama, hook'lar)
    - **Sürekli açık Gateway** (VPS üzerinde çalıştırın, her yerden etkileşime geçin)
    - Yerel tarayıcı/ekran/kamera/çalıştırma için **Node'lar**

    Vitrin: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills ve otomasyon

<AccordionGroup>
  <Accordion title="Repo'yu kirli tutmadan skills'i nasıl özelleştirebilirim?">
    Repo kopyasını düzenlemek yerine yönetilen geçersiz kılmaları kullanın. Değişikliklerinizi `~/.openclaw/skills/<name>/SKILL.md` içine koyun (veya `~/.openclaw/openclaw.json` içinde `skills.load.extraDirs` üzerinden bir klasör ekleyin). Öncelik sırası `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → paketli → `skills.load.extraDirs` şeklindedir; bu nedenle yönetilen geçersiz kılmalar, git'e dokunmadan paketli skills'e karşı yine de kazanır. Skill'in global olarak yüklenmesi ama yalnızca bazı ajanlara görünmesi gerekiyorsa, paylaşılan kopyayı `~/.openclaw/skills` içinde tutun ve görünürlüğü `agents.defaults.skills` ile `agents.list[].skills` üzerinden kontrol edin. Yalnızca upstream'e layık düzenlemeler repo içinde yaşamalı ve PR olarak çıkmalıdır.
  </Accordion>

  <Accordion title="Özel bir klasörden skills yükleyebilir miyim?">
    Evet. `~/.openclaw/openclaw.json` içinde `skills.load.extraDirs` aracılığıyla ek dizinler ekleyin (en düşük öncelik). Varsayılan öncelik `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → paketli → `skills.load.extraDirs` şeklindedir. `clawhub` varsayılan olarak `./skills` içine yükler; OpenClaw bunu sonraki oturumda `<workspace>/skills` olarak ele alır. Skill yalnızca belirli ajanlara görünmeliyse bunu `agents.defaults.skills` veya `agents.list[].skills` ile eşleştirin.
  </Accordion>

  <Accordion title="Farklı görevler için farklı modelleri veya ayarları nasıl kullanabilirim?">
    Bugün desteklenen desenler şunlardır:

    - **Cron işleri**: Yalıtılmış işler, iş başına bir `model` geçersiz kılması ayarlayabilir.
    - **Ajanlar**: Görevleri farklı varsayılan modellere, düşünme seviyelerine ve akış parametrelerine sahip ayrı ajanlara yönlendirin.
    - **İsteğe bağlı değiştirme**: Geçerli oturum modelini herhangi bir zamanda değiştirmek için `/model` kullanın.

    Örneğin, aynı modeli farklı ajan başına ayarlarla kullanın:

    ```json5
    {
      agents: {
        list: [
          {
            id: "coder",
            model: "xiaomi/mimo-v2.5-pro",
            thinkingDefault: "high",
            params: { temperature: 0.1 },
          },
          {
            id: "chat",
            model: "xiaomi/mimo-v2.5-pro",
            thinkingDefault: "off",
            params: { temperature: 0.8 },
          },
        ],
      },
    }
    ```

    Paylaşılan model başına varsayılanları `agents.defaults.models["provider/model"].params` içine koyun, ardından ajana özgü geçersiz kılmaları düz `agents.list[].params` içine koyun. Aynı model için ayrı iç içe `agents.list[].models["provider/model"].params` girdileri tanımlamayın; `agents.list[].models`, ajan başına model kataloğu ve çalışma zamanı geçersiz kılmaları içindir.

    Bkz. [Cron işleri](/tr/automation/cron-jobs), [Çoklu Ajan Yönlendirme](/tr/concepts/multi-agent), [Yapılandırma](/tr/gateway/config-agents) ve [Slash komutları](/tr/tools/slash-commands).

  </Accordion>

  <Accordion title="Bot ağır iş yaparken donuyor. Bunu nasıl başka yere aktarırım?">
    Uzun veya paralel görevler için **alt ajanlar** kullanın. Alt ajanlar kendi oturumlarında çalışır,
    bir özet döndürür ve ana sohbetinizi yanıt verir durumda tutar.

    Botunuzdan "bu görev için bir alt ajan başlatmasını" isteyin veya `/subagents` kullanın.
    Gateway'in şu anda ne yaptığını (ve meşgul olup olmadığını) görmek için sohbette `/status` kullanın.

    Token ipucu: Uzun görevler ve alt ajanların ikisi de token tüketir. Maliyet kaygısı varsa,
    `agents.defaults.subagents.model` üzerinden alt ajanlar için daha ucuz bir model ayarlayın.

    Belgeler: [Alt ajanlar](/tr/tools/subagents), [Arka Plan Görevleri](/tr/automation/tasks).

  </Accordion>

  <Accordion title="Discord'da thread'e bağlı alt ajan oturumları nasıl çalışır?">
    Thread bağlamalarını kullanın. Bir Discord thread'ini bir alt ajana veya oturum hedefine bağlayabilirsiniz; böylece o thread'deki takip mesajları bağlı oturumda kalır.

    Temel akış:

    - `thread: true` kullanarak `sessions_spawn` ile başlatın (ve kalıcı takip için isteğe bağlı olarak `mode: "session"`).
    - Veya `/focus <target>` ile manuel olarak bağlayın.
    - Bağlama durumunu incelemek için `/agents` kullanın.
    - Otomatik odaktan çıkmayı kontrol etmek için `/session idle <duration|off>` ve `/session max-age <duration|off>` kullanın.
    - Thread'i ayırmak için `/unfocus` kullanın.

    Gerekli yapılandırma:

    - Global varsayılanlar: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
    - Discord geçersiz kılmaları: `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours`.
    - Başlatmada otomatik bağlama: `channels.discord.threadBindings.spawnSessions` varsayılan olarak `true` değerindedir; thread'e bağlı oturum başlatmalarını devre dışı bırakmak için `false` olarak ayarlayın.

    Belgeler: [Alt ajanlar](/tr/tools/subagents), [Discord](/tr/channels/discord), [Yapılandırma Referansı](/tr/gateway/configuration-reference), [Slash komutları](/tr/tools/slash-commands).

  </Accordion>

  <Accordion title="Bir alt ajan tamamlandı, ancak tamamlama güncellemesi yanlış yere gitti veya hiç gönderilmedi. Neyi kontrol etmeliyim?">
    Önce çözümlenen istek sahibi rotasını kontrol edin:

    - Tamamlama modu alt ajan teslimi, mevcut olduğunda bağlı thread'i veya konuşma rotasını tercih eder.
    - Tamamlama kaynağı yalnızca bir kanal taşıyorsa, OpenClaw doğrudan teslimin yine de başarılı olabilmesi için istek sahibi oturumun saklanan rotasına (`lastChannel` / `lastTo` / `lastAccountId`) geri döner.
    - Ne bağlı bir rota ne de kullanılabilir saklanan bir rota varsa, doğrudan teslim başarısız olabilir ve sonuç sohbete hemen gönderilmek yerine kuyruğa alınmış oturum teslimine geri döner.
    - Geçersiz veya eski hedefler yine de kuyruk geri dönüşünü ya da son teslim başarısızlığını zorlayabilir.
    - Çocuğun son görünür asistan yanıtı tam olarak sessiz token `NO_REPLY` / `no_reply` veya tam olarak `ANNOUNCE_SKIP` ise OpenClaw, eski önceki ilerlemeyi göndermek yerine duyuruyu bilerek bastırır.
    - Tool/toolResult çıktısı çocuk sonuç metnine yükseltilmez; sonuç, çocuğun en son görünür asistan yanıtıdır.

    Debug:

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    Belgeler: [Alt ajanlar](/tr/tools/subagents), [Arka Plan Görevleri](/tr/automation/tasks), [Oturum Araçları](/tr/concepts/session-tool).

  </Accordion>

  <Accordion title="Cron veya anımsatıcılar çalışmıyor. Neyi kontrol etmeliyim?">
    Cron, Gateway süreci içinde çalışır. Gateway sürekli çalışmıyorsa,
    zamanlanmış işler çalışmaz.

    Kontrol listesi:

    - Cron'un etkin olduğunu (`cron.enabled`) ve `OPENCLAW_SKIP_CRON` değerinin ayarlanmadığını doğrulayın.
    - Gateway'in 7/24 çalıştığını kontrol edin (uyku/yeniden başlatma yok).
    - İşin saat dilimi ayarlarını doğrulayın (`--tz` ile ana makine saat dilimi karşılaştırması).

    Debug:

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    Belgeler: [Cron işleri](/tr/automation/cron-jobs), [Otomasyon](/tr/automation).

  </Accordion>

  <Accordion title="Cron çalıştı, ancak kanala hiçbir şey gönderilmedi. Neden?">
    Önce teslim modunu kontrol edin:

    - `--no-deliver` / `delivery.mode: "none"`, hiçbir çalıştırıcı geri dönüş gönderiminin beklenmediği anlamına gelir.
    - Eksik veya geçersiz duyuru hedefi (`channel` / `to`), çalıştırıcının giden teslimi atladığı anlamına gelir.
    - Kanal kimlik doğrulama hataları (`unauthorized`, `Forbidden`), çalıştırıcının teslim etmeyi denediği ancak kimlik bilgilerinin bunu engellediği anlamına gelir.
    - Sessiz yalıtılmış sonuç (yalnızca `NO_REPLY` / `no_reply`), bilerek teslim edilemez olarak değerlendirilir; bu yüzden çalıştırıcı kuyruktaki geri dönüş teslimini de bastırır.

    Yalıtılmış Cron işlerinde, bir sohbet rotası kullanılabilir olduğunda ajan yine de `message`
    aracıyla doğrudan gönderebilir. `--announce` yalnızca ajanın zaten göndermediği
    son metin için çalıştırıcı geri dönüş yolunu kontrol eder.

    Debug:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Belgeler: [Cron işleri](/tr/automation/cron-jobs), [Arka Plan Görevleri](/tr/automation/tasks).

  </Accordion>

  <Accordion title="Yalıtılmış bir Cron çalıştırması neden modelleri değiştirdi veya bir kez yeniden denedi?">
    Bu genellikle yinelenen zamanlama değil, canlı model değiştirme yoludur.

    Yalıtılmış Cron, etkin çalıştırma `LiveSessionModelSwitchError` fırlattığında
    çalışma zamanı model devrini kalıcı hale getirebilir ve yeniden deneyebilir. Yeniden deneme,
    geçilen sağlayıcı/modeli korur; geçiş yeni bir kimlik doğrulama profili geçersiz kılması taşıyorsa,
    Cron yeniden denemeden önce bunu da kalıcı hale getirir.

    İlgili seçim kuralları:

    - Uygulanabilir olduğunda önce Gmail kanca modeli geçersiz kılması kazanır.
    - Sonra iş başına `model`.
    - Sonra saklanan Cron oturumu model geçersiz kılması.
    - Sonra normal ajan/varsayılan model seçimi.

    Yeniden deneme döngüsü sınırlıdır. İlk deneme artı 2 geçiş yeniden denemesinden sonra,
    Cron sonsuza dek döngüye girmek yerine iptal eder.

    Debug:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Belgeler: [Cron işleri](/tr/automation/cron-jobs), [Cron CLI](/tr/cli/cron).

  </Accordion>

  <Accordion title="Linux'ta Skills nasıl kurarım?">
    Yerel `openclaw skills` komutlarını kullanın veya Skills'i çalışma alanınıza bırakın. macOS Skills kullanıcı arayüzü Linux'ta kullanılamaz.
    Skills'e [https://clawhub.ai](https://clawhub.ai) adresinden göz atın.

    ```bash
    openclaw skills search "calendar"
    openclaw skills search --limit 20
    openclaw skills install @owner/<skill-slug>
    openclaw skills install @owner/<skill-slug> --version <version>
    openclaw skills install @owner/<skill-slug> --force
    openclaw skills install @owner/<skill-slug> --global
    openclaw skills update --all
    openclaw skills update --all --global
    openclaw skills list --eligible
    openclaw skills check
    ```

    Yerel `openclaw skills install`, varsayılan olarak etkin çalışma alanı `skills/`
    dizinine yazar. Tüm yerel ajanlar için paylaşılan yönetilen
    Skills dizinine kurmak üzere `--global` ekleyin. Ayrı `clawhub` CLI'ını
    yalnızca kendi Skills'inizi yayımlamak veya eşitlemek istiyorsanız kurun.
    Hangi ajanların paylaşılan Skills'i görebileceğini daraltmak istiyorsanız
    `agents.defaults.skills` veya `agents.list[].skills` kullanın.

  </Accordion>

  <Accordion title="OpenClaw görevleri bir zamanlamaya göre veya arka planda sürekli çalıştırabilir mi?">
    Evet. Gateway zamanlayıcısını kullanın:

    - Zamanlanmış veya yinelenen görevler için **Cron işleri** (yeniden başlatmalar arasında kalıcıdır).
    - "Ana oturum" dönemsel kontrolleri için **Heartbeat**.
    - Özet gönderen veya sohbetlere teslim eden otonom ajanlar için **Yalıtılmış işler**.

    Belgeler: [Cron işleri](/tr/automation/cron-jobs), [Otomasyon](/tr/automation),
    [Heartbeat](/tr/gateway/heartbeat).

  </Accordion>

  <Accordion title="Apple macOS'a özgü Skills'i Linux'tan çalıştırabilir miyim?">
    Doğrudan değil. macOS Skills, `metadata.openclaw.os` ve gerekli ikili dosyalarla sınırlandırılır; Skills yalnızca **Gateway ana makinesinde** uygun olduklarında sistem isteminde görünür. Linux'ta `darwin`-only Skills (`apple-notes`, `apple-reminders`, `things-mac` gibi), sınırlamayı geçersiz kılmadığınız sürece yüklenmez.

    Desteklenen üç kalıbınız var:

    **Seçenek A - Gateway'i bir Mac üzerinde çalıştırın (en basiti).**
    Gateway'i macOS ikili dosyalarının bulunduğu yerde çalıştırın, ardından Linux'tan [uzak modda](#gateway-ports-already-running-and-remote-mode) veya Tailscale üzerinden bağlanın. Gateway ana makinesi macOS olduğu için Skills normal şekilde yüklenir.

    **Seçenek B - bir macOS Node kullanın (SSH yok).**
    Gateway'i Linux'ta çalıştırın, bir macOS Node'u (menü çubuğu uygulaması) eşleştirin ve Mac'te **Node Çalıştırma Komutları** ayarını "Always Ask" veya "Always Allow" yapın. OpenClaw, gerekli ikili dosyalar Node üzerinde bulunduğunda macOS'a özgü Skills'i uygun olarak değerlendirebilir. Ajan bu Skills'i `nodes` aracı üzerinden çalıştırır. "Always Ask" seçerseniz, istemde "Always Allow" onayı vermek o komutu izin verilenler listesine ekler.

    **Seçenek C - macOS ikili dosyalarını SSH üzerinden vekilleyin (ileri düzey).**
    Gateway'i Linux'ta tutun, ancak gerekli CLI ikili dosyalarının Mac üzerinde çalışan SSH sarmalayıcılarına çözümlenmesini sağlayın. Ardından Skill'i Linux'a izin verecek şekilde geçersiz kılın, böylece uygun kalır.

    1. İkili dosya için bir SSH sarmalayıcısı oluşturun (örnek: Apple Notes için `memo`):

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. Sarmalayıcıyı Linux ana makinesinde `PATH` üzerine koyun (örneğin `~/bin/memo`).
    3. Skill meta verilerini (çalışma alanı veya `~/.openclaw/skills`) Linux'a izin verecek şekilde geçersiz kılın:

       ```markdown
       ---
       name: apple-notes
       description: Manage Apple Notes via the memo CLI on macOS.
       metadata: { "openclaw": { "os": ["darwin", "linux"], "requires": { "bins": ["memo"] } } }
       ---
       ```

    4. Skills anlık görüntüsünün yenilenmesi için yeni bir oturum başlatın.

  </Accordion>

  <Accordion title="Notion veya HeyGen entegrasyonunuz var mı?">
    Bugün yerleşik değil.

    Seçenekler:

    - **Özel Skill / Plugin:** güvenilir API erişimi için en iyisi (Notion/HeyGen'in ikisinin de API'leri var).
    - **Tarayıcı otomasyonu:** kod olmadan çalışır ancak daha yavaştır ve daha kırılgandır.

    Bağlamı müşteri başına tutmak istiyorsanız (ajans iş akışları), basit bir kalıp şudur:

    - Müşteri başına bir Notion sayfası (bağlam + tercihler + etkin çalışma).
    - Ajandan oturumun başında o sayfayı getirmesini isteyin.

    Yerel bir entegrasyon istiyorsanız, bir özellik isteği açın veya bu API'leri
    hedefleyen bir Skill oluşturun.

    Skills kurun:

    ```bash
    openclaw skills install @owner/<skill-slug>
    openclaw skills update --all
    ```

    Yerel kurulumlar etkin çalışma alanı `skills/` dizinine iner. Tüm yerel ajanlarda paylaşılan Skills için `openclaw skills install @owner/<skill-slug> --global` kullanın (veya bunları elle `~/.openclaw/skills/<name>/SKILL.md` içine yerleştirin). Paylaşılan bir kurulumu yalnızca bazı ajanlar görmeliyse `agents.defaults.skills` veya `agents.list[].skills` yapılandırın. Bazı Skills, Homebrew aracılığıyla kurulmuş ikili dosyalar bekler; Linux'ta bu Linuxbrew anlamına gelir (yukarıdaki Homebrew Linux SSS girişine bakın). Bkz. [Skills](/tr/tools/skills), [Skills yapılandırması](/tr/tools/skills-config) ve [ClawHub](/tr/clawhub).

  </Accordion>

  <Accordion title="OpenClaw ile mevcut oturum açılmış Chrome'umu nasıl kullanırım?">
    Chrome DevTools MCP üzerinden bağlanan yerleşik `user` tarayıcı profilini kullanın:

    ```bash
    openclaw browser --browser-profile user tabs
    openclaw browser --browser-profile user snapshot
    ```

    Özel bir ad istiyorsanız, açık bir MCP profili oluşturun:

    ```bash
    openclaw browser create-profile --name chrome-live --driver existing-session
    openclaw browser --browser-profile chrome-live tabs
    ```

    Bu yol yerel ana makine tarayıcısını veya bağlı bir tarayıcı Node'unu kullanabilir. Gateway başka yerde çalışıyorsa, tarayıcı makinesinde bir Node ana makinesi çalıştırın veya bunun yerine uzak CDP kullanın.

    `existing-session` / `user` üzerindeki mevcut sınırlar:

    - eylemler CSS seçici odaklı değil, ref odaklıdır
    - yüklemeler `ref` / `inputRef` gerektirir ve şu anda aynı anda bir dosyayı destekler
    - `responsebody`, PDF dışa aktarma, indirme yakalama ve toplu eylemler için hâlâ yönetilen bir tarayıcı veya ham CDP profili gerekir

  </Accordion>
</AccordionGroup>

## Korumalı alan ve bellek

<AccordionGroup>
  <Accordion title="Ayrılmış bir korumalı alan belgesi var mı?">
    Evet. Bkz. [Korumalı alan](/tr/gateway/sandboxing). Docker'a özgü kurulum için (Docker'da tam Gateway veya korumalı alan imajları), bkz. [Docker](/tr/install/docker).
  </Accordion>

  <Accordion title="Docker sınırlı geliyor - tüm özellikleri nasıl etkinleştiririm?">
    Varsayılan imaj güvenlik önceliklidir ve `node` kullanıcısı olarak çalışır; bu yüzden
    sistem paketlerini, Homebrew'i veya paketlenmiş tarayıcıları içermez. Daha kapsamlı bir kurulum için:

    - Önbelleklerin kalıcı olması için `/home/node` yolunu `OPENCLAW_HOME_VOLUME` ile kalıcı hale getirin.
    - Sistem bağımlılıklarını `OPENCLAW_IMAGE_APT_PACKAGES` ile imaja ekleyin.
    - Paketlenmiş CLI üzerinden Playwright tarayıcılarını kurun:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - `PLAYWRIGHT_BROWSERS_PATH` değerini ayarlayın ve yolun kalıcı olduğundan emin olun.

    Belgeler: [Docker](/tr/install/docker), [Tarayıcı](/tr/tools/browser).

  </Accordion>

  <Accordion title="Tek bir ajanla DM'leri kişisel tutup grupları herkese açık/korumalı alanlı yapabilir miyim?">
    Evet - özel trafiğiniz **DM'ler** ve herkese açık trafiğiniz **gruplar** ise.

    `agents.defaults.sandbox.mode: "non-main"` kullanın; böylece grup/kanal oturumları (ana olmayan anahtarlar) yapılandırılmış korumalı alan arka ucunda çalışırken ana DM oturumu ana makinede kalır. Bir tane seçmezseniz Docker varsayılan arka uçtur. Ardından `tools.sandbox.tools` üzerinden korumalı alanlı oturumlarda hangi araçların kullanılabilir olduğunu sınırlayın.

    Kurulum kılavuzu + örnek yapılandırma: [Gruplar: kişisel DM'ler + herkese açık gruplar](/tr/channels/groups#pattern-personal-dms-public-groups-single-agent)

    Temel yapılandırma başvurusu: [Gateway yapılandırması](/tr/gateway/config-agents#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="Bir ana makine klasörünü korumalı alana nasıl bağlarım?">
    `agents.defaults.sandbox.docker.binds` değerini `["host:path:mode"]` olarak ayarlayın (örn. `"/home/user/src:/src:ro"`). Genel + ajan başına bağlamalar birleştirilir; ajan başına bağlamalar `scope: "shared"` olduğunda yok sayılır. Hassas olan her şey için `:ro` kullanın ve bağlamaların korumalı alan dosya sistemi duvarlarını baypas ettiğini unutmayın.

    OpenClaw, bağlama kaynaklarını hem normalize edilmiş yola hem de mevcut en derin üst dizin üzerinden çözümlenen kanonik yola göre doğrular. Bu, son yol segmenti henüz mevcut olmasa bile symlink üst dizini kaçışlarının kapalı biçimde başarısız olduğu ve izin verilen kök kontrollerinin symlink çözümlemesinden sonra da uygulanmaya devam ettiği anlamına gelir.

    Örnekler ve güvenlik notları için bkz. [Korumalı alan](/tr/gateway/sandboxing#custom-bind-mounts) ve [Korumalı Alan vs Araç İlkesi vs Yükseltilmiş](/tr/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check).

  </Accordion>

  <Accordion title="Bellek nasıl çalışır?">
    OpenClaw belleği, ajan çalışma alanındaki Markdown dosyalarından ibarettir:

    - `memory/YYYY-MM-DD.md` içinde günlük notlar
    - `MEMORY.md` içinde düzenlenmiş uzun vadeli notlar (yalnızca ana/özel oturumlar)

    OpenClaw ayrıca otomatik Compaction öncesinde modele dayanıklı notlar yazmasını hatırlatmak için
    **sessiz Compaction öncesi bellek boşaltması** çalıştırır. Bu yalnızca çalışma alanı
    yazılabilir olduğunda çalışır (salt okunur korumalı alanlar bunu atlar). Bkz. [Bellek](/tr/concepts/memory).

  </Accordion>

  <Accordion title="Memory sürekli bir şeyleri unutuyor. Kalıcı olmasını nasıl sağlarım?">
    Bottan **olguyu belleğe yazmasını** isteyin. Uzun vadeli notlar `MEMORY.md` içine,
    kısa vadeli bağlam ise `memory/YYYY-MM-DD.md` içine gider.

    Bu, hâlâ iyileştirdiğimiz bir alan. Modele anıları kaydetmesini hatırlatmak yardımcı olur;
    ne yapacağını bilir. Unutmaya devam ederse Gateway’in her çalıştırmada aynı
    çalışma alanını kullandığını doğrulayın.

    Belgeler: [Memory](/tr/concepts/memory), [Agent workspace](/tr/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Memory sonsuza kadar kalıcı mı? Sınırlar nelerdir?">
    Memory dosyaları diskte yaşar ve siz silene kadar kalıcı olur. Sınır model değil,
    depolama alanınızdır. **Oturum bağlamı** hâlâ modelin bağlam penceresiyle
    sınırlıdır, bu yüzden uzun konuşmalar compact edilebilir veya kesilebilir. Memory
    aramasının var olma nedeni budur - yalnızca ilgili kısımları bağlama geri çeker.

    Belgeler: [Memory](/tr/concepts/memory), [Context](/tr/concepts/context).

  </Accordion>

  <Accordion title="Anlamsal memory araması OpenAI API anahtarı gerektirir mi?">
    Yalnızca **OpenAI embeddings** kullanıyorsanız. Codex OAuth sohbet/tamamlama işlemlerini kapsar ve
    embeddings erişimi **sağlamaz**, bu yüzden **Codex ile oturum açmak (OAuth veya
    Codex CLI oturumu)** anlamsal memory aramasına yardımcı olmaz. OpenAI embeddings
    yine de gerçek bir API anahtarı gerektirir (`OPENAI_API_KEY` veya `models.providers.openai.apiKey`).

    Açıkça bir sağlayıcı ayarlamazsanız OpenClaw, OpenAI embeddings kullanır. Hâlâ
    `memorySearch.provider = "auto"` diyen eski yapılandırmalar da OpenAI olarak çözümlenir.
    Kullanılabilir bir OpenAI API anahtarı yoksa anlamsal memory araması, bir anahtar
    yapılandırana veya açıkça başka bir sağlayıcı seçene kadar kullanılamaz.

    Yerel kalmayı tercih ederseniz `memorySearch.provider = "local"` ayarlayın (ve isteğe bağlı olarak
    `memorySearch.fallback = "none"`). Gemini embeddings istiyorsanız
    `memorySearch.provider = "gemini"` ayarlayın ve `GEMINI_API_KEY` (veya
    `memorySearch.remote.apiKey`) sağlayın. **OpenAI, OpenAI uyumlu, Gemini,
    Voyage, Mistral, Bedrock, Ollama, LM Studio, GitHub Copilot, DeepInfra veya local**
    embedding modellerini destekliyoruz - kurulum ayrıntıları için [Memory](/tr/concepts/memory) bölümüne bakın.

  </Accordion>
</AccordionGroup>

## Öğelerin diskte bulunduğu yerler

<AccordionGroup>
  <Accordion title="OpenClaw ile kullanılan tüm veriler yerel olarak mı kaydedilir?">
    Hayır - **OpenClaw’ın durumu yereldir**, ancak **harici hizmetler onlara gönderdiklerinizi yine de görür**.

    - **Varsayılan olarak yerel:** oturumlar, memory dosyaları, yapılandırma ve çalışma alanı Gateway ana makinesinde yaşar
      (`~/.openclaw` + çalışma alanı dizininiz).
    - **Zorunlu olarak uzak:** model sağlayıcılarına (Anthropic/OpenAI/vb.) gönderdiğiniz mesajlar
      onların API’lerine gider ve sohbet platformları (WhatsApp/Telegram/Slack/vb.) mesaj verilerini kendi
      sunucularında saklar.
    - **Kapsamı siz kontrol edersiniz:** yerel modeller kullanmak istemleri makinenizde tutar, ancak kanal
      trafiği yine de kanalın sunucularından geçer.

    İlgili: [Agent workspace](/tr/concepts/agent-workspace), [Memory](/tr/concepts/memory).

  </Accordion>

  <Accordion title="OpenClaw verilerini nerede depolar?">
    Her şey `$OPENCLAW_STATE_DIR` altında yaşar (varsayılan: `~/.openclaw`):

    | Yol                                                             | Amaç                                                               |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | Ana yapılandırma (JSON5)                                           |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | Eski OAuth içe aktarımı (ilk kullanımda auth profillerine kopyalanır) |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | Auth profilleri (OAuth, API anahtarları ve isteğe bağlı `keyRef`/`tokenRef`) |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | `file` SecretRef sağlayıcıları için isteğe bağlı dosya destekli gizli veri yükü |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | Eski uyumluluk dosyası (statik `api_key` girdileri temizlenmiş)     |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | Sağlayıcı durumu (örn. `whatsapp/<accountId>/creds.json`)          |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | Agent başına durum (agentDir + oturumlar)                          |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | Konuşma geçmişi ve durumu (agent başına)                           |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | Oturum metadata’sı (agent başına)                                  |

    Eski tek agent yolu: `~/.openclaw/agent/*` (`openclaw doctor` tarafından taşınır).

    **Çalışma alanınız** (AGENTS.md, memory dosyaları, skills, vb.) ayrıdır ve `agents.defaults.workspace` üzerinden yapılandırılır (varsayılan: `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title="AGENTS.md / SOUL.md / USER.md / MEMORY.md nerede yaşamalı?">
    Bu dosyalar `~/.openclaw` içinde değil, **agent çalışma alanında** yaşar.

    - **Çalışma alanı (agent başına)**: `AGENTS.md`, `SOUL.md`, `IDENTITY.md`, `USER.md`,
      `MEMORY.md`, `memory/YYYY-MM-DD.md`, isteğe bağlı `HEARTBEAT.md`.
      Küçük harfli kök `memory.md` yalnızca eski onarım girdisidir; `openclaw doctor --fix`
      her iki dosya da mevcut olduğunda bunu `MEMORY.md` içine birleştirebilir.
    - **Durum dizini (`~/.openclaw`)**: yapılandırma, kanal/sağlayıcı durumu, auth profilleri, oturumlar, günlükler
      ve paylaşılan skills (`~/.openclaw/skills`).

    Varsayılan çalışma alanı `~/.openclaw/workspace` olur, şu şekilde yapılandırılabilir:

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    Bot yeniden başlatmadan sonra "unutuyorsa", Gateway’in her başlatmada aynı
    çalışma alanını kullandığını doğrulayın (ve unutmayın: uzak mod, yerel dizüstü bilgisayarınızın değil
    **gateway ana makinesinin** çalışma alanını kullanır).

    İpucu: kalıcı bir davranış veya tercih istiyorsanız, sohbet geçmişine güvenmek yerine bottan bunu
    **AGENTS.md veya MEMORY.md içine yazmasını** isteyin.

    Bkz. [Agent workspace](/tr/concepts/agent-workspace) ve [Memory](/tr/concepts/memory).

  </Accordion>

  <Accordion title="SOUL.md dosyasını büyütebilir miyim?">
    Evet. `SOUL.md`, agent bağlamına enjekte edilen çalışma alanı başlangıç dosyalarından biridir.
    Dosya başına varsayılan enjeksiyon sınırı `20000` karakterdir
    ve dosyalar genelindeki toplam başlangıç bütçesi `60000` karakterdir.

    OpenClaw yapılandırmanızda paylaşılan varsayılanları değiştirin:

    ```json5
    {
      agents: {
        defaults: {
          bootstrapMaxChars: 50000,
          bootstrapTotalMaxChars: 300000,
        },
      },
    }
    ```

    Ya da tek bir agent için geçersiz kılın:

    ```json5
    {
      agents: {
        list: [
          {
            id: "main",
            bootstrapMaxChars: 50000,
            bootstrapTotalMaxChars: 300000,
          },
        ],
      },
    }
    ```

    Ham ve enjekte edilen boyutları ve kırpma olup olmadığını kontrol etmek için `/context` kullanın.
    `SOUL.md` dosyasını ses, duruş ve kişiliğe odaklı tutun; işletim kurallarını
    `AGENTS.md` içine, kalıcı olguları ise memory içine koyun.

    Bkz. [Context](/tr/concepts/context) ve [Agent config](/tr/gateway/config-agents).

  </Accordion>

  <Accordion title="Önerilen yedekleme stratejisi">
    **Agent çalışma alanınızı** **özel** bir git deposuna koyun ve özel bir yerde
    yedekleyin (örneğin GitHub private). Bu, memory + AGENTS/SOUL/USER
    dosyalarını yakalar ve daha sonra asistanın "zihnini" geri yüklemenizi sağlar.

    `~/.openclaw` altındaki hiçbir şeyi (kimlik bilgileri, oturumlar, token’lar veya şifrelenmiş gizli veri yükleri) commit etmeyin.
    Tam geri yükleme gerekiyorsa hem çalışma alanını hem de durum dizinini
    ayrı ayrı yedekleyin (yukarıdaki taşıma sorusuna bakın).

    Belgeler: [Agent workspace](/tr/concepts/agent-workspace).

  </Accordion>

  <Accordion title="OpenClaw’ı tamamen nasıl kaldırırım?">
    Özel kılavuza bakın: [Kaldırma](/tr/install/uninstall).
  </Accordion>

  <Accordion title="Agent’lar çalışma alanı dışında çalışabilir mi?">
    Evet. Çalışma alanı **varsayılan cwd** ve memory çapasıdır, katı bir sandbox değildir.
    Göreli yollar çalışma alanı içinde çözümlenir, ancak sandboxing etkin değilse mutlak yollar diğer
    ana makine konumlarına erişebilir. İzolasyon gerekiyorsa
    [`agents.defaults.sandbox`](/tr/gateway/sandboxing) veya agent başına sandbox ayarlarını kullanın. Bir
    deponun varsayılan çalışma dizini olmasını istiyorsanız ilgili agent’ın
    `workspace` değerini depo köküne yönlendirin. OpenClaw deposu yalnızca kaynak koddur; agent’ın bilerek onun içinde çalışmasını istemediğiniz sürece
    çalışma alanını ayrı tutun.

    Örnek (varsayılan cwd olarak depo):

    ```json5
    {
      agents: {
        defaults: {
          workspace: "~/Projects/my-repo",
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Uzak mod: oturum deposu nerede?">
    Oturum durumu **gateway ana makinesine** aittir. Uzak moddaysanız, önemsediğiniz oturum deposu yerel dizüstü bilgisayarınızda değil, uzak makinededir. Bkz. [Session management](/tr/concepts/session).
  </Accordion>
</AccordionGroup>

## Yapılandırma temelleri

<AccordionGroup>
  <Accordion title="Yapılandırmanın biçimi nedir? Nerede bulunur?">
    OpenClaw, `$OPENCLAW_CONFIG_PATH` içinden isteğe bağlı bir **JSON5** yapılandırması okur (varsayılan: `~/.openclaw/openclaw.json`):

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    Dosya yoksa, nispeten güvenli varsayılanları kullanır (`~/.openclaw/workspace` varsayılan çalışma alanı dahil).

  </Accordion>

  <Accordion title='gateway.bind: "lan" (veya "tailnet") ayarladım ve artık hiçbir şey dinlemiyor / UI yetkisiz diyor'>
    Loopback dışı bind’lar **geçerli bir gateway auth yolu gerektirir**. Pratikte bunun anlamı:

    - paylaşılan gizli anahtar auth: token veya parola
    - doğru yapılandırılmış kimlik duyarlı bir reverse proxy arkasında `gateway.auth.mode: "trusted-proxy"`

    ```json5
    {
      gateway: {
        bind: "lan",
        auth: {
          mode: "token",
          token: "replace-me",
        },
      },
    }
    ```

    Notlar:

    - `gateway.remote.token` / `.password` yerel gateway auth’u tek başına etkinleştirmez.
    - Yerel çağrı yolları `gateway.auth.*` ayarlanmamışsa `gateway.remote.*` değerlerini yalnızca fallback olarak kullanabilir.
    - Parola auth için bunun yerine `gateway.auth.mode: "password"` ile birlikte `gateway.auth.password` (veya `OPENCLAW_GATEWAY_PASSWORD`) ayarlayın.
    - `gateway.auth.token` / `gateway.auth.password` açıkça SecretRef üzerinden yapılandırılmışsa ve çözümlenemiyorsa, çözümleme kapalı hata verir (uzak fallback ile maskeleme yoktur).
    - Paylaşılan gizli anahtarlı Control UI kurulumları `connect.params.auth.token` veya `connect.params.auth.password` üzerinden kimlik doğrular (uygulama/UI ayarlarında saklanır). Tailscale Serve veya `trusted-proxy` gibi kimlik taşıyan modlar bunun yerine istek başlıklarını kullanır. Paylaşılan gizli anahtarları URL’lere koymaktan kaçının.
    - `gateway.auth.mode: "trusted-proxy"` ile aynı ana makinedeki loopback reverse proxy’ler açık `gateway.auth.trustedProxy.allowLoopback = true` ve `gateway.trustedProxies` içinde bir loopback girdisi gerektirir.

  </Accordion>

  <Accordion title="Artık localhost üzerinde neden token gerekiyor?">
    OpenClaw, loopback dahil gateway auth’u varsayılan olarak zorunlu kılar. Normal varsayılan yolda bunun anlamı token auth’tur: açık bir auth yolu yapılandırılmamışsa gateway başlangıcı token moduna çözümlenir ve o başlangıç için yalnızca çalışma zamanı token’ı üretir, yani **yerel WS istemcileri kimlik doğrulamalıdır**. İstemcilerin yeniden başlatmalar arasında kararlı bir gizli anahtara ihtiyacı olduğunda `gateway.auth.token`, `gateway.auth.password`, `OPENCLAW_GATEWAY_TOKEN` veya `OPENCLAW_GATEWAY_PASSWORD` değerini açıkça yapılandırın. Bu, diğer yerel süreçlerin Gateway’i çağırmasını engeller.

    Farklı bir kimlik doğrulama yolu tercih ediyorsanız, açıkça parola modunu (veya kimlik farkındalıklı ters proxy'ler için `trusted-proxy`) seçebilirsiniz. **Gerçekten** açık loopback istiyorsanız, yapılandırmanızda `gateway.auth.mode: "none"` değerini açıkça ayarlayın. Doctor sizin için istediğiniz zaman bir token oluşturabilir: `openclaw doctor --generate-gateway-token`.

  </Accordion>

  <Accordion title="Yapılandırmayı değiştirdikten sonra yeniden başlatmam gerekir mi?">
    Gateway yapılandırmayı izler ve sıcak yeniden yüklemeyi destekler:

    - `gateway.reload.mode: "hybrid"` (varsayılan): güvenli değişiklikleri sıcak uygular, kritik olanlar için yeniden başlatır
    - `hot`, `restart`, `off` da desteklenir

  </Accordion>

  <Accordion title="Komik CLI sloganlarını nasıl devre dışı bırakırım?">
    Yapılandırmada `cli.banner.taglineMode` değerini ayarlayın:

    ```json5
    {
      cli: {
        banner: {
          taglineMode: "off", // random | default | off
        },
      },
    }
    ```

    - `off`: slogan metnini gizler ancak başlık/sürüm satırını korur.
    - `default`: her seferinde `All your chats, one OpenClaw.` kullanır.
    - `random`: dönen komik/mevsimsel sloganlar (varsayılan davranış).
    - Hiç banner istemiyorsanız, `OPENCLAW_HIDE_BANNER=1` ortam değişkenini ayarlayın.

  </Accordion>

  <Accordion title="Web aramayı (ve web getirmeyi) nasıl etkinleştiririm?">
    `web_fetch` API anahtarı olmadan çalışır. `web_search` seçtiğiniz sağlayıcıya bağlıdır:

    - Brave, Exa, Firecrawl, Gemini, Kimi, MiniMax Search, Perplexity ve Tavily gibi API destekli sağlayıcılar normal API anahtarı kurulumlarını gerektirir.
    - Grok, model kimlik doğrulamasından xAI OAuth'u yeniden kullanabilir veya `XAI_API_KEY` / plugin web-search yapılandırmasına geri dönebilir.
    - Ollama Web Search anahtarsızdır, ancak yapılandırılmış Ollama host'unuzu kullanır ve `ollama signin` gerektirir.
    - DuckDuckGo anahtarsızdır, ancak resmi olmayan HTML tabanlı bir entegrasyondur.
    - SearXNG anahtarsız/kendi kendine barındırılan bir çözümdür; `SEARXNG_BASE_URL` veya `plugins.entries.searxng.config.webSearch.baseUrl` yapılandırın.

    **Önerilen:** `openclaw configure --section web` komutunu çalıştırın ve bir sağlayıcı seçin.
    Ortam alternatifleri:

    - Brave: `BRAVE_API_KEY`
    - Exa: `EXA_API_KEY`
    - Firecrawl: `FIRECRAWL_API_KEY`
    - Gemini: `GEMINI_API_KEY`
    - Grok: xAI OAuth, `XAI_API_KEY`
    - Kimi: `KIMI_API_KEY` veya `MOONSHOT_API_KEY`
    - MiniMax Search: `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY` veya `MINIMAX_API_KEY`
    - Perplexity: `PERPLEXITY_API_KEY` veya `OPENROUTER_API_KEY`
    - SearXNG: `SEARXNG_BASE_URL`
    - Tavily: `TAVILY_API_KEY`

    ```json5
    {
      plugins: {
        entries: {
          brave: {
            config: {
              webSearch: {
                apiKey: "BRAVE_API_KEY_HERE",
              },
            },
          },
        },
        },
        tools: {
          web: {
            search: {
              enabled: true,
              provider: "brave",
              maxResults: 5,
            },
            fetch: {
              enabled: true,
              provider: "firecrawl", // optional; omit for auto-detect
            },
          },
        },
    }
    ```

    Sağlayıcıya özel web-search yapılandırması artık `plugins.entries.<plugin>.config.webSearch.*` altında bulunur.
    Eski `tools.web.search.*` sağlayıcı yolları uyumluluk için geçici olarak hâlâ yüklenir, ancak yeni yapılandırmalar için kullanılmamalıdır.
    Firecrawl web-fetch geri dönüş yapılandırması `plugins.entries.firecrawl.config.webFetch.*` altında bulunur.

    Notlar:

    - İzin listeleri kullanıyorsanız, `web_search`/`web_fetch`/`x_search` veya `group:web` ekleyin.
    - `web_fetch` varsayılan olarak etkindir (açıkça devre dışı bırakılmadıkça).
    - `tools.web.fetch.provider` atlanırsa, OpenClaw mevcut kimlik bilgilerinden ilk hazır fetch geri dönüş sağlayıcısını otomatik algılar. Resmi Firecrawl plugin'i bu geri dönüşü sağlar.
    - Daemon'lar ortam değişkenlerini `~/.openclaw/.env` dosyasından (veya hizmet ortamından) okur.

    Belgeler: [Web araçları](/tr/tools/web).

  </Accordion>

  <Accordion title="config.apply yapılandırmamı sildi. Nasıl kurtarırım ve bunu nasıl önlerim?">
    `config.apply` **tüm yapılandırmayı** değiştirir. Kısmi bir nesne gönderirseniz, diğer her şey kaldırılır.

    Güncel OpenClaw birçok kazara üzerine yazmayı önler:

    - OpenClaw'a ait yapılandırma yazmaları, yazmadan önce değişiklik sonrası tam yapılandırmayı doğrular.
    - Geçersiz veya yıkıcı OpenClaw'a ait yazmalar reddedilir ve `openclaw.json.rejected.*` olarak kaydedilir.
    - Doğrudan düzenleme başlatmayı veya sıcak yeniden yüklemeyi bozarsa, Gateway güvenli kapalı duruma geçer veya yeniden yüklemeyi atlar; `openclaw.json` dosyasını yeniden yazmaz.
    - `openclaw doctor --fix` onarımın sahibidir ve reddedilen dosyayı `openclaw.json.clobbered.*` olarak kaydederken bilinen son iyi yapılandırmayı geri yükleyebilir.

    Kurtarma:

    - `Invalid config at`, `Config write rejected:` veya `config reload skipped (invalid config)` için `openclaw logs --follow` çıktısını kontrol edin.
    - Etkin yapılandırmanın yanındaki en yeni `openclaw.json.clobbered.*` veya `openclaw.json.rejected.*` dosyasını inceleyin.
    - `openclaw config validate` ve `openclaw doctor --fix` çalıştırın.
    - Yalnızca amaçlanan anahtarları `openclaw config set` veya `config.patch` ile geri kopyalayın.
    - Bilinen son iyi yapılandırmanız veya reddedilen yükünüz yoksa yedekten geri yükleyin ya da `openclaw doctor` komutunu yeniden çalıştırıp kanalları/modelleri yeniden yapılandırın.
    - Bu beklenmedikse, bir hata bildirin ve bilinen son yapılandırmanızı veya herhangi bir yedeği ekleyin.
    - Yerel bir kodlama ajanı genellikle günlüklerden veya geçmişten çalışan bir yapılandırmayı yeniden oluşturabilir.

    Önlemek için:

    - Küçük değişiklikler için `openclaw config set` kullanın.
    - Etkileşimli düzenlemeler için `openclaw configure` kullanın.
    - Kesin bir yol veya alan şekli konusunda emin değilseniz önce `config.schema.lookup` kullanın; ayrıntıya inmek için sığ bir şema düğümü ve doğrudan alt özetler döndürür.
    - Kısmi RPC düzenlemeleri için `config.patch` kullanın; `config.apply` yalnızca tam yapılandırma değişimi için kalsın.
    - Bir ajan çalıştırmasından ajan odaklı `gateway` aracını kullanıyorsanız, `tools.exec.ask` / `tools.exec.security` yollarına (aynı korumalı exec yollarına normalize edilen eski `tools.bash.*` takma adları dahil) yazmaları yine de reddeder.

    Belgeler: [Yapılandırma](/tr/cli/config), [Yapılandır](/tr/cli/configure), [Gateway sorun giderme](/tr/gateway/troubleshooting#gateway-rejected-invalid-config), [Doctor](/tr/gateway/doctor).

  </Accordion>

  <Accordion title="Cihazlar arasında özelleşmiş worker'larla merkezi bir Gateway'i nasıl çalıştırırım?">
    Yaygın model **bir Gateway** (ör. Raspberry Pi) artı **düğümler** ve **ajanlar**dır:

    - **Gateway (merkezi):** kanalları (Signal/WhatsApp), yönlendirmeyi ve oturumları yönetir.
    - **Düğümler (cihazlar):** Mac/iOS/Android çevre birimleri olarak bağlanır ve yerel araçları (`system.run`, `canvas`, `camera`) sunar.
    - **Ajanlar (worker'lar):** özel roller için ayrı beyinler/çalışma alanları (ör. "Hetzner operasyonları", "Kişisel veriler").
    - **Alt ajanlar:** paralellik istediğinizde ana ajandan arka plan işi başlatır.
    - **TUI:** Gateway'e bağlanın ve ajanlar/oturumlar arasında geçiş yapın.

    Belgeler: [Düğümler](/tr/nodes), [Uzaktan erişim](/tr/gateway/remote), [Çok Ajanlı Yönlendirme](/tr/concepts/multi-agent), [Alt ajanlar](/tr/tools/subagents), [TUI](/tr/web/tui).

  </Accordion>

  <Accordion title="OpenClaw tarayıcısı headless çalışabilir mi?">
    Evet. Bu bir yapılandırma seçeneğidir:

    ```json5
    {
      browser: { headless: true },
      agents: {
        defaults: {
          sandbox: { browser: { headless: true } },
        },
      },
    }
    ```

    Varsayılan `false` değeridir (pencereli). Headless, bazı sitelerde anti-bot kontrollerini tetikleme olasılığını artırır. Bkz. [Tarayıcı](/tr/tools/browser).

    Headless **aynı Chromium motorunu** kullanır ve çoğu otomasyon için çalışır (formlar, tıklamalar, scraping, oturum açmalar). Başlıca farklar:

    - Görünür tarayıcı penceresi yoktur (görsellere ihtiyacınız varsa ekran görüntüleri kullanın).
    - Bazı siteler headless modda otomasyon konusunda daha katıdır (CAPTCHA'lar, anti-bot).
      Örneğin, X/Twitter çoğu zaman headless oturumları engeller.

  </Accordion>

  <Accordion title="Tarayıcı kontrolü için Brave'i nasıl kullanırım?">
    `browser.executablePath` değerini Brave ikili dosyanıza (veya herhangi bir Chromium tabanlı tarayıcıya) ayarlayın ve Gateway'i yeniden başlatın.
    Tam yapılandırma örnekleri için [Tarayıcı](/tr/tools/browser#use-brave-or-another-chromium-based-browser) bölümüne bakın.
  </Accordion>
</AccordionGroup>

## Uzak gateway'ler ve düğümler

<AccordionGroup>
  <Accordion title="Komutlar Telegram, gateway ve düğümler arasında nasıl yayılır?">
    Telegram mesajları **gateway** tarafından işlenir. gateway ajanı çalıştırır ve ancak bir düğüm aracı gerektiğinde **Gateway WebSocket** üzerinden düğümleri çağırır:

    Telegram → Gateway → Ajan → `node.*` → Düğüm → Gateway → Telegram

    Düğümler gelen sağlayıcı trafiğini görmez; yalnızca düğüm RPC çağrılarını alırlar.

  </Accordion>

  <Accordion title="Gateway uzaktan barındırılıyorsa ajanım bilgisayarıma nasıl erişebilir?">
    Kısa cevap: **bilgisayarınızı düğüm olarak eşleyin**. Gateway başka yerde çalışır, ancak Gateway WebSocket üzerinden yerel makinenizdeki `node.*` araçlarını (ekran, kamera, sistem) çağırabilir.

    Tipik kurulum:

    1. Gateway'i her zaman açık ana makinede (VPS/ev sunucusu) çalıştırın.
    2. Gateway ana makinesini ve bilgisayarınızı aynı tailnet'e koyun.
    3. Gateway WS'nin erişilebilir olduğundan emin olun (tailnet bind veya SSH tüneli).
    4. macOS uygulamasını yerelde açın ve düğüm olarak kaydolabilmesi için **SSH üzerinden Uzak** modunda (veya doğrudan tailnet) bağlanın.
    5. Düğümü Gateway'de onaylayın:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Ayrı bir TCP köprüsü gerekmez; düğümler Gateway WebSocket üzerinden bağlanır.

    Güvenlik hatırlatması: macOS düğümünü eşlemek, o makinede `system.run` çalıştırılmasına izin verir. Yalnızca güvendiğiniz cihazları eşleyin ve [Güvenlik](/tr/gateway/security) bölümünü inceleyin.

    Belgeler: [Düğümler](/tr/nodes), [Gateway protokolü](/tr/gateway/protocol), [macOS uzak modu](/tr/platforms/mac/remote), [Güvenlik](/tr/gateway/security).

  </Accordion>

  <Accordion title="Tailscale bağlı ama yanıt alamıyorum. Şimdi ne yapmalıyım?">
    Temel kontrolleri yapın:

    - Gateway çalışıyor: `openclaw gateway status`
    - Gateway sağlığı: `openclaw status`
    - Kanal sağlığı: `openclaw channels status`

    Ardından kimlik doğrulamayı ve yönlendirmeyi doğrulayın:

    - Tailscale Serve kullanıyorsanız, `gateway.auth.allowTailscale` değerinin doğru ayarlandığından emin olun.
    - SSH tüneli üzerinden bağlanıyorsanız, yerel tünelin çalıştığını ve doğru porta işaret ettiğini doğrulayın.
    - İzin listelerinizin (DM veya grup) hesabınızı içerdiğini doğrulayın.

    Belgeler: [Tailscale](/tr/gateway/tailscale), [Uzaktan erişim](/tr/gateway/remote), [Kanallar](/tr/channels).

  </Accordion>

  <Accordion title="İki OpenClaw örneği birbiriyle konuşabilir mi (yerel + VPS)?">
    Evet. Yerleşik bir "bot-to-bot" köprüsü yoktur, ancak bunu birkaç güvenilir şekilde bağlayabilirsiniz:

    **En basit:** her iki botun da erişebildiği normal bir sohbet kanalı kullanın (Telegram/Slack/WhatsApp).
    Bot A'nın Bot B'ye mesaj göndermesini sağlayın, ardından Bot B'nin her zamanki gibi yanıt vermesine izin verin.

    **CLI köprüsü (genel):** diğer botun dinlediği bir sohbeti hedefleyerek
    `openclaw agent --message ... --deliver` ile diğer Gateway'i çağıran bir betik çalıştırın. Botlardan biri uzak bir VPS üzerindeyse, CLI'nizi SSH/Tailscale üzerinden o uzak Gateway'e yönlendirin (bkz. [Uzaktan erişim](/tr/gateway/remote)).

    Örnek model (hedef Gateway'e erişebilen bir makineden çalıştırın):

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    İpucu: iki botun sonsuz döngüye girmemesi için bir güvenlik kuralı ekleyin (yalnızca bahsetme, kanal izin listeleri veya "bot mesajlarına yanıt verme" kuralı).

    Belgeler: [Uzaktan erişim](/tr/gateway/remote), [Ajan CLI](/tr/cli/agent), [Ajan gönderimi](/tr/tools/agent-send).

  </Accordion>

  <Accordion title="Birden fazla ajan için ayrı VPS'lere ihtiyacım var mı?">
    Hayır. Tek bir Gateway, her biri kendi çalışma alanına, model varsayılanlarına ve yönlendirmesine sahip birden fazla ajan barındırabilir. Normal kurulum budur ve ajan başına bir VPS çalıştırmaktan çok daha ucuz ve basittir.

    Ayrı VPS'leri yalnızca sıkı izolasyon (güvenlik sınırları) veya paylaşmak istemediğiniz çok farklı yapılandırmalar gerektiğinde kullanın. Aksi halde, tek bir Gateway kullanın ve birden fazla ajan veya alt ajan kullanın.

  </Accordion>

  <Accordion title="Kişisel dizüstü bilgisayarımda bir node kullanmanın, VPS'ten SSH kullanmaya göre bir faydası var mı?">
    Evet - node'lar, uzak bir Gateway'den dizüstü bilgisayarınıza erişmenin birinci sınıf yoludur ve
    kabuk erişiminden fazlasını sağlar. Gateway macOS/Linux üzerinde çalışır (Windows'ta WSL2 ile) ve
    hafiftir (küçük bir VPS veya Raspberry Pi sınıfı bir kutu yeterlidir; 4 GB RAM fazlasıyla yeterli), bu yüzden yaygın
    kurulum, her zaman açık bir host ve node olarak dizüstü bilgisayarınızdır.

    - **Gelen SSH gerekmez.** Node'lar Gateway WebSocket'e dışarıdan bağlanır ve cihaz eşleştirme kullanır.
    - **Daha güvenli yürütme kontrolleri.** `system.run`, o dizüstü bilgisayardaki node izin listeleri/onaylarıyla sınırlandırılır.
    - **Daha fazla cihaz aracı.** Node'lar `system.run` yanında `canvas`, `camera` ve `screen` araçlarını da sunar.
    - **Yerel tarayıcı otomasyonu.** Gateway'i bir VPS'te tutun, ancak Chrome'u dizüstü bilgisayardaki bir node host üzerinden yerel olarak çalıştırın veya Chrome MCP ile host üzerindeki yerel Chrome'a bağlanın.

    SSH geçici kabuk erişimi için uygundur, ancak node'lar sürekli agent iş akışları ve
    cihaz otomasyonu için daha basittir.

    Dokümanlar: [Node'lar](/tr/nodes), [Node CLI](/tr/cli/nodes), [Tarayıcı](/tr/tools/browser).

  </Accordion>

  <Accordion title="Node'lar gateway hizmeti çalıştırır mı?">
    Hayır. Bilerek yalıtılmış profiller çalıştırmıyorsanız host başına yalnızca **bir gateway** çalışmalıdır (bkz. [Birden çok gateway](/tr/gateway/multiple-gateways)). Node'lar gateway'e bağlanan çevre birimleridir
    (iOS/Android node'ları veya menü çubuğu uygulamasında macOS "node modu"). Başsız node
    host'ları ve CLI kontrolü için bkz. [Node host CLI](/tr/cli/node).

    `gateway`, `discovery` ve barındırılan plugin yüzeyi değişiklikleri için tam yeniden başlatma gerekir.

  </Accordion>

  <Accordion title="Yapılandırma uygulamak için bir API / RPC yolu var mı?">
    Evet.

    - `config.schema.lookup`: yazmadan önce tek bir yapılandırma alt ağacını, sığ şema node'u, eşleşen UI ipucu ve doğrudan alt özetleriyle inceleyin
    - `config.get`: geçerli anlık görüntüyü + hash'i alın
    - `config.patch`: güvenli kısmi güncelleme (çoğu RPC düzenlemesi için tercih edilir); mümkün olduğunda sıcak yeniden yükler ve gerektiğinde yeniden başlatır
    - `config.apply`: tam yapılandırmayı doğrula + değiştir; mümkün olduğunda sıcak yeniden yükler ve gerektiğinde yeniden başlatır
    - Agent'a yönelik `gateway` çalışma zamanı aracı hâlâ `tools.exec.ask` / `tools.exec.security` yeniden yazmayı reddeder; eski `tools.bash.*` takma adları aynı korumalı exec yollarına normalleştirilir

  </Accordion>

  <Accordion title="İlk kurulum için asgari makul yapılandırma">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    Bu, çalışma alanınızı ayarlar ve botu kimin tetikleyebileceğini sınırlar.

  </Accordion>

  <Accordion title="Bir VPS'te Tailscale'i nasıl kurar ve Mac'imden nasıl bağlanırım?">
    Asgari adımlar:

    1. **VPS'e kurun + giriş yapın**

       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```

    2. **Mac'inize kurun + giriş yapın**
       - Tailscale uygulamasını kullanın ve aynı tailnet'e giriş yapın.
    3. **MagicDNS'i etkinleştirin (önerilir)**
       - Tailscale yönetici konsolunda, VPS'in kararlı bir adı olması için MagicDNS'i etkinleştirin.
    4. **Tailnet host adını kullanın**
       - SSH: `ssh user@your-vps.tailnet-xxxx.ts.net`
       - Gateway WS: `ws://your-vps.tailnet-xxxx.ts.net:18789`

    Control UI'ı SSH olmadan istiyorsanız VPS'te Tailscale Serve kullanın:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Bu, gateway'i loopback'e bağlı tutar ve HTTPS'i Tailscale üzerinden sunar. Bkz. [Tailscale](/tr/gateway/tailscale).

  </Accordion>

  <Accordion title="Bir Mac node'unu uzak bir Gateway'e nasıl bağlarım (Tailscale Serve)?">
    Serve, **Gateway Control UI + WS** sunar. Node'lar aynı Gateway WS uç noktası üzerinden bağlanır.

    Önerilen kurulum:

    1. **VPS + Mac'in aynı tailnet'te olduğundan emin olun**.
    2. **macOS uygulamasını Uzak modda kullanın** (SSH hedefi tailnet host adı olabilir).
       Uygulama Gateway bağlantı noktasını tüneller ve node olarak bağlanır.
    3. **Node'u gateway üzerinde onaylayın**:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Dokümanlar: [Gateway protokolü](/tr/gateway/protocol), [Keşif](/tr/gateway/discovery), [macOS uzak modu](/tr/platforms/mac/remote).

  </Accordion>

  <Accordion title="İkinci bir dizüstü bilgisayara kurulum mu yapmalıyım, yoksa yalnızca bir node mu eklemeliyim?">
    İkinci dizüstü bilgisayarda yalnızca **yerel araçlara** (screen/camera/exec) ihtiyacınız varsa, onu
    **node** olarak ekleyin. Bu, tek bir Gateway kullanır ve yinelenen yapılandırmayı önler. Yerel node araçları
    şu anda yalnızca macOS içindir, ancak bunları diğer işletim sistemlerine genişletmeyi planlıyoruz.

    Yalnızca **katı yalıtım** veya tamamen ayrı iki bot gerektiğinde ikinci bir Gateway kurun.

    Dokümanlar: [Node'lar](/tr/nodes), [Node CLI](/tr/cli/nodes), [Birden çok gateway](/tr/gateway/multiple-gateways).

  </Accordion>
</AccordionGroup>

## Env vars ve .env yükleme

<AccordionGroup>
  <Accordion title="OpenClaw ortam değişkenlerini nasıl yükler?">
    OpenClaw, env vars değerlerini üst süreçten (kabuk, launchd/systemd, CI vb.) okur ve ayrıca şunları yükler:

    - geçerli çalışma dizininden `.env`
    - `~/.openclaw/.env` konumundan genel yedek `.env` (diğer adıyla `$OPENCLAW_STATE_DIR/.env`)

    Hiçbir `.env` dosyası mevcut env vars değerlerini geçersiz kılmaz.
    Sağlayıcı kimlik bilgisi değişkenleri çalışma alanı `.env` için istisnadır: `GEMINI_API_KEY`,
    `XAI_API_KEY` veya `MISTRAL_API_KEY` gibi anahtarlar çalışma alanı `.env` dosyasından
    yok sayılır ve süreç ortamında, `~/.openclaw/.env` içinde veya config `env` içinde bulunmalıdır.

    Yapılandırmada satır içi env vars da tanımlayabilirsiniz (yalnızca süreç env içinde eksikse uygulanır):

    ```json5
    {
      env: {
        OPENROUTER_API_KEY: "sk-or-...",
        vars: { GROQ_API_KEY: "gsk-..." },
      },
    }
    ```

    Tam öncelik ve kaynaklar için bkz. [/environment](/tr/help/environment).

  </Accordion>

  <Accordion title="Gateway'i hizmet üzerinden başlattım ve env vars kayboldu. Şimdi ne yapmalıyım?">
    İki yaygın çözüm:

    1. Eksik anahtarları `~/.openclaw/.env` içine koyun; böylece hizmet kabuk env'inizi devralmasa bile alınırlar.
    2. Kabuk içe aktarmayı etkinleştirin (isteğe bağlı kolaylık):

    ```json5
    {
      env: {
        shellEnv: {
          enabled: true,
          timeoutMs: 15000,
        },
      },
    }
    ```

    Bu, giriş kabuğunuzu çalıştırır ve yalnızca eksik beklenen anahtarları içe aktarır (asla geçersiz kılmaz). Env var eşdeğerleri:
    `OPENCLAW_LOAD_SHELL_ENV=1`, `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`.

  </Accordion>

  <Accordion title='COPILOT_GITHUB_TOKEN ayarladım, ancak model durumu "Shell env: off." gösteriyor. Neden?'>
    `openclaw models status`, **kabuk env içe aktarmanın** etkin olup olmadığını bildirir. "Shell env: off"
    env vars değerlerinizin eksik olduğu anlamına **gelmez** - yalnızca OpenClaw'ın giriş
    kabuğunuzu otomatik olarak yüklemeyeceği anlamına gelir.

    Gateway bir hizmet olarak çalışıyorsa (launchd/systemd), kabuk
    ortamınızı devralmaz. Şunlardan birini yaparak düzeltin:

    1. Token'ı `~/.openclaw/.env` içine koyun:

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. Veya kabuk içe aktarmayı etkinleştirin (`env.shellEnv.enabled: true`).
    3. Veya yapılandırmanızdaki `env` bloğuna ekleyin (yalnızca eksikse uygulanır).

    Ardından gateway'i yeniden başlatın ve tekrar kontrol edin:

    ```bash
    openclaw models status
    ```

    Copilot token'ları `COPILOT_GITHUB_TOKEN` üzerinden okunur (ayrıca `GH_TOKEN` / `GITHUB_TOKEN`).
    Bkz. [/concepts/model-providers](/tr/concepts/model-providers) ve [/environment](/tr/help/environment).

  </Accordion>
</AccordionGroup>

## Oturumlar ve birden çok sohbet

<AccordionGroup>
  <Accordion title="Yeni bir konuşmayı nasıl başlatırım?">
    Bağımsız bir mesaj olarak `/new` veya `/reset` gönderin. Bkz. [Oturum yönetimi](/tr/concepts/session).
  </Accordion>

  <Accordion title="/new hiç göndermezsem oturumlar otomatik olarak sıfırlanır mı?">
    Oturumlar `session.idleMinutes` sonrasında sona erebilir, ancak bu **varsayılan olarak devre dışıdır** (varsayılan **0**).
    Boşta kalma süresinin sona ermesini etkinleştirmek için bunu pozitif bir değere ayarlayın. Etkinleştirildiğinde, boşta kalma döneminden sonraki **sonraki**
    mesaj, ilgili sohbet anahtarı için yeni bir oturum kimliği başlatır.
    Bu, transkriptleri silmez - yalnızca yeni bir oturum başlatır.

    ```json5
    {
      session: {
        idleMinutes: 240,
      },
    }
    ```

  </Accordion>

  <Accordion title="OpenClaw instance'larından oluşan bir ekip (bir CEO ve birçok agent) oluşturmanın bir yolu var mı?">
    Evet, **çoklu agent yönlendirme** ve **alt agent'lar** aracılığıyla. Bir koordinatör
    agent ve kendi çalışma alanları ile modelleri olan birkaç worker agent oluşturabilirsiniz.

    Bununla birlikte, bunu en iyi **eğlenceli bir deney** olarak görmek gerekir. Token açısından ağırdır ve çoğu zaman
    ayrı oturumlara sahip tek bir bot kullanmaktan daha az verimlidir. Öngördüğümüz tipik model,
    konuştuğunuz tek bir bot ve paralel çalışma için farklı oturumlardır. Bu
    bot gerektiğinde alt agent'lar da başlatabilir.

    Dokümanlar: [Çoklu agent yönlendirme](/tr/concepts/multi-agent), [Alt agent'lar](/tr/tools/subagents), [Agents CLI](/tr/cli/agents).

  </Accordion>

  <Accordion title="Bağlam neden görevin ortasında kısaltıldı? Bunu nasıl önlerim?">
    Oturum bağlamı model penceresiyle sınırlıdır. Uzun sohbetler, büyük araç çıktıları veya çok sayıda
    dosya compaction ya da kısaltmayı tetikleyebilir.

    Yardımcı olanlar:

    - Bottan mevcut durumu özetlemesini ve bir dosyaya yazmasını isteyin.
    - Uzun görevlerden önce `/compact`, konu değiştirirken `/new` kullanın.
    - Önemli bağlamı çalışma alanında tutun ve bottan onu geri okumasını isteyin.
    - Ana sohbetin daha küçük kalması için uzun veya paralel işler için alt agent'lar kullanın.
    - Bu sık oluyorsa daha büyük bağlam penceresine sahip bir model seçin.

  </Accordion>

  <Accordion title="OpenClaw'ı tamamen sıfırlayıp kurulu halde nasıl tutarım?">
    Sıfırlama komutunu kullanın:

    ```bash
    openclaw reset
    ```

    Etkileşimsiz tam sıfırlama:

    ```bash
    openclaw reset --scope full --yes --non-interactive
    ```

    Ardından kurulumu yeniden çalıştırın:

    ```bash
    openclaw onboard --install-daemon
    ```

    Notlar:

    - Onboarding mevcut bir yapılandırma görürse **Sıfırla** seçeneğini de sunar. Bkz. [Onboarding (CLI)](/tr/start/wizard).
    - Profiller (`--profile` / `OPENCLAW_PROFILE`) kullandıysanız, her state dir'i sıfırlayın (varsayılanlar `~/.openclaw-<profile>`).
    - Dev sıfırlama: `openclaw gateway --dev --reset` (yalnızca dev; dev yapılandırmasını + kimlik bilgilerini + oturumları + çalışma alanını siler).

  </Accordion>

  <Accordion title='"context too large" hataları alıyorum - nasıl sıfırlar veya compact yaparım?'>
    Şunlardan birini kullanın:

    - **Compact** (konuşmayı korur ancak eski turları özetler):

      ```
      /compact
      ```

      veya özeti yönlendirmek için `/compact <instructions>`.

    - **Sıfırla** (aynı sohbet anahtarı için yeni oturum kimliği):

      ```
      /new
      /reset
      ```

    Bu devam ederse:

    - Eski araç çıktısını kırpmak için **oturum budamayı** (`agents.defaults.contextPruning`) etkinleştirin veya ayarlayın.
    - Daha büyük bağlam penceresine sahip bir model kullanın.

    Dokümanlar: [Compaction](/tr/concepts/compaction), [Oturum budama](/tr/concepts/session-pruning), [Oturum yönetimi](/tr/concepts/session).

  </Accordion>

  <Accordion title='"LLM request rejected: messages.content.tool_use.input field required" neden görüyorum?'>
    Bu bir sağlayıcı doğrulama hatasıdır: model, gerekli `input` olmadan bir `tool_use` bloğu yaydı.
    Genellikle oturum geçmişinin eski veya bozulmuş olduğu anlamına gelir (çoğunlukla uzun iş parçacıklarından
    veya bir araç/şema değişikliğinden sonra).

    Düzeltme: `/new` ile yeni bir oturum başlatın (bağımsız mesaj).

  </Accordion>

  <Accordion title="Neden her 30 dakikada bir heartbeat mesajları alıyorum?">
    Heartbeat'ler varsayılan olarak her **30m** çalışır (OAuth kimlik doğrulaması kullanırken **1h**). Bunları ayarlayın veya devre dışı bırakın:

    ```json5
    {
      agents: {
        defaults: {
          heartbeat: {
            every: "2h", // or "0m" to disable
          },
        },
      },
    }
    ```

    `HEARTBEAT.md` mevcutsa ancak fiilen boşsa (yalnızca boş satırlar,
    Markdown/HTML yorumları, `# Heading` gibi Markdown başlıkları, çit işaretleri
    veya boş kontrol listesi taslakları içeriyorsa), OpenClaw API çağrılarını azaltmak için Heartbeat çalıştırmasını atlar.
    Dosya yoksa Heartbeat yine çalışır ve model ne yapacağına karar verir.

    Aracı başına geçersiz kılmalar `agents.list[].heartbeat` kullanır. Belgeler: [Heartbeat](/tr/gateway/heartbeat).

  </Accordion>

  <Accordion title='Bir WhatsApp grubuna "bot hesabı" eklemem gerekir mi?'>
    Hayır. OpenClaw **kendi hesabınızda** çalışır; bu nedenle gruptaysanız OpenClaw bunu görebilir.
    Varsayılan olarak, göndericilere izin verene kadar grup yanıtları engellenir (`groupPolicy: "allowlist"`).

    Yalnızca **sizin** grup yanıtlarını tetikleyebilmenizi istiyorsanız:

    ```json5
    {
      channels: {
        whatsapp: {
          groupPolicy: "allowlist",
          groupAllowFrom: ["+15551234567"],
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Bir WhatsApp grubunun JID değerini nasıl alırım?">
    Seçenek 1 (en hızlısı): günlükleri takip edin ve grupta bir test mesajı gönderin:

    ```bash
    openclaw logs --follow --json
    ```

    `@g.us` ile biten `chatId` (veya `from`) değerini arayın, örneğin:
    `1234567890-1234567890@g.us`.

    Seçenek 2 (zaten yapılandırılmışsa/izin listesine alınmışsa): yapılandırmadan grupları listeleyin:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    Belgeler: [WhatsApp](/tr/channels/whatsapp), [Directory](/tr/cli/directory), [Logs](/tr/cli/logs).

  </Accordion>

  <Accordion title="OpenClaw neden bir grupta yanıt vermiyor?">
    İki yaygın neden:

    - Bahsetme geçidi açık (varsayılan). Botu @mention etmeniz (veya `mentionPatterns` ile eşleşmeniz) gerekir.
    - `channels.whatsapp.groups` değerini `"*"` olmadan yapılandırdınız ve grup izin listesinde değil.

    Bkz. [Groups](/tr/channels/groups) ve [Group messages](/tr/channels/group-messages).

  </Accordion>

  <Accordion title="Gruplar/konular DM'lerle bağlamı paylaşır mı?">
    Doğrudan sohbetler varsayılan olarak ana oturuma daraltılır. Grupların/kanalların kendi oturum anahtarları vardır ve Telegram konuları / Discord dizileri ayrı oturumlardır. Bkz. [Groups](/tr/channels/groups) ve [Group messages](/tr/channels/group-messages).
  </Accordion>

  <Accordion title="Kaç çalışma alanı ve aracı oluşturabilirim?">
    Kesin sınır yok. Düzinelerce (hatta yüzlerce) sorun değildir, ancak şunlara dikkat edin:

    - **Disk büyümesi:** oturumlar + dökümler `~/.openclaw/agents/<agentId>/sessions/` altında bulunur.
    - **Token maliyeti:** daha fazla aracı, daha fazla eşzamanlı model kullanımı anlamına gelir.
    - **Operasyon yükü:** aracı başına kimlik doğrulama profilleri, çalışma alanları ve kanal yönlendirmesi.

    İpuçları:

    - Aracı başına bir **aktif** çalışma alanı tutun (`agents.defaults.workspace`).
    - Disk büyürse eski oturumları budayın (JSONL veya mağaza girdilerini silin).
    - Başıboş çalışma alanlarını ve profil uyuşmazlıklarını görmek için `openclaw doctor` kullanın.

  </Accordion>

  <Accordion title="Aynı anda birden çok bot veya sohbet çalıştırabilir miyim (Slack) ve bunu nasıl kurmalıyım?">
    Evet. Birden çok yalıtılmış aracı çalıştırmak ve gelen mesajları
    kanal/hesap/eşe göre yönlendirmek için **Multi-Agent Routing** kullanın. Slack bir kanal olarak desteklenir ve belirli aracılara bağlanabilir.

    Tarayıcı erişimi güçlüdür ancak "bir insanın yapabildiği her şeyi yapabilir" değildir; bot karşıtı mekanizmalar, CAPTCHA'lar ve MFA
    otomasyonu yine de engelleyebilir. En güvenilir tarayıcı kontrolü için ana makinede yerel Chrome MCP kullanın
    veya tarayıcıyı gerçekten çalıştıran makinede CDP kullanın.

    En iyi uygulama kurulumu:

    - Her zaman açık Gateway ana makinesi (VPS/Mac mini).
    - Rol başına bir aracı (bağlamalar).
    - Bu aracılara bağlı Slack kanalları.
    - Gerektiğinde Chrome MCP veya bir düğüm üzerinden yerel tarayıcı.

    Belgeler: [Multi-Agent Routing](/tr/concepts/multi-agent), [Slack](/tr/channels/slack),
    [Browser](/tr/tools/browser), [Nodes](/tr/nodes).

  </Accordion>
</AccordionGroup>

## Modeller, yük devretme ve kimlik doğrulama profilleri

Model SSS — varsayılanlar, seçim, takma adlar, geçiş, yük devretme, kimlik doğrulama profilleri —
[Models FAQ](/tr/help/faq-models) sayfasında bulunur.

## Gateway: bağlantı noktaları, "zaten çalışıyor" ve uzak mod

<AccordionGroup>
  <Accordion title="Gateway hangi bağlantı noktasını kullanır?">
    `gateway.port`, WebSocket + HTTP (Control UI, kancalar vb.) için tek çoklanmış bağlantı noktasını denetler.

    Öncelik:

    ```
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > default 18789
    ```

  </Accordion>

  <Accordion title='openclaw gateway status neden "Runtime: running" ama "Connectivity probe: failed" diyor?'>
    Çünkü "running", **supervisor'ın** görünümüdür (launchd/systemd/schtasks). Bağlantı yoklaması ise CLI'ın gerçekten Gateway WebSocket'ine bağlanmasıdır.

    `openclaw gateway status` kullanın ve şu satırlara güvenin:

    - `Probe target:` (yoklamanın gerçekten kullandığı URL)
    - `Listening:` (bağlantı noktasında gerçekte bağlı olan şey)
    - `Last gateway error:` (işlem canlıyken ancak bağlantı noktası dinlemede değilken yaygın kök neden)

  </Accordion>

  <Accordion title='openclaw gateway status neden "Config (cli)" ve "Config (service)" değerlerini farklı gösteriyor?'>
    Hizmet başka bir yapılandırma dosyasıyla çalışırken siz farklı bir yapılandırma dosyasını düzenliyorsunuz (çoğunlukla `--profile` / `OPENCLAW_STATE_DIR` uyuşmazlığı).

    Düzeltme:

    ```bash
    openclaw gateway install --force
    ```

    Bunu hizmetin kullanmasını istediğiniz aynı `--profile` / ortamdan çalıştırın.

  </Accordion>

  <Accordion title='"another gateway instance is already listening" ne anlama gelir?'>
    OpenClaw, başlangıçta WebSocket dinleyicisini hemen bağlayarak bir çalışma zamanı kilidi uygular (varsayılan `ws://127.0.0.1:18789`). Bağlama `EADDRINUSE` ile başarısız olursa, başka bir örneğin zaten dinlediğini belirten `GatewayLockError` fırlatır.

    Düzeltme: diğer örneği durdurun, bağlantı noktasını boşaltın veya `openclaw gateway --port <port>` ile çalıştırın.

  </Accordion>

  <Accordion title="OpenClaw'ı uzak modda (istemci başka yerdeki bir Gateway'e bağlanır) nasıl çalıştırırım?">
    `gateway.mode: "remote"` ayarlayın ve isteğe bağlı olarak paylaşılan gizli uzak kimlik bilgileriyle uzak bir WebSocket URL'sine yönlendirin:

    ```json5
    {
      gateway: {
        mode: "remote",
        remote: {
          url: "ws://gateway.tailnet:18789",
          token: "your-token",
          password: "your-password",
        },
      },
    }
    ```

    Notlar:

    - `openclaw gateway` yalnızca `gateway.mode` `local` olduğunda (veya geçersiz kılma bayrağını geçerseniz) başlar.
    - macOS uygulaması yapılandırma dosyasını izler ve bu değerler değiştiğinde modları canlı olarak değiştirir.
    - `gateway.remote.token` / `.password` yalnızca istemci tarafı uzak kimlik bilgileridir; kendi başlarına yerel Gateway kimlik doğrulamasını etkinleştirmezler.

  </Accordion>

  <Accordion title='Control UI "unauthorized" diyor (veya yeniden bağlanmaya devam ediyor). Şimdi ne yapmalıyım?'>
    Gateway kimlik doğrulama yolunuz ve kullanıcı arayüzünün kimlik doğrulama yöntemi eşleşmiyor.

    Gerçekler (koddan):

    - Control UI, token'ı geçerli tarayıcı sekmesi oturumu ve seçilen Gateway URL'si için `sessionStorage` içinde tutar; böylece aynı sekme yenilemeleri, uzun ömürlü localStorage token kalıcılığını geri yüklemeden çalışmaya devam eder.
    - `AUTH_TOKEN_MISMATCH` durumunda, güvenilir istemciler Gateway yeniden deneme ipuçları döndürdüğünde (`canRetryWithDeviceToken=true`, `recommendedNextStep=retry_with_device_token`) önbelleğe alınmış cihaz token'ı ile sınırlı bir yeniden deneme yapabilir.
    - Bu önbelleğe alınmış token yeniden denemesi artık cihaz token'ı ile saklanan önbelleğe alınmış onaylı kapsamları yeniden kullanır. Açık `deviceToken` / açık `scopes` çağıranları, önbelleğe alınmış kapsamları devralmak yerine istenen kapsam kümelerini korumaya devam eder.
    - Bu yeniden deneme yolunun dışında, bağlantı kimlik doğrulama önceliği önce açık paylaşılan token/parola, ardından açık `deviceToken`, ardından saklanan cihaz token'ı, ardından bootstrap token'dır.
    - Yerleşik kurulum kodu bootstrap'i, `scopes: []` değerine sahip bir düğüm cihaz token'ı ve güvenilir mobil ilk kullanım için sınırlı bir operatör devir token'ı döndürür. Operatör devri, kurulum zamanı yerel yapılandırmasını okuyabilir ancak eşleştirme mutasyon kapsamları veya `operator.admin` vermez.

    Düzeltme:

    - En hızlısı: `openclaw dashboard` (dashboard URL'sini yazdırır + kopyalar, açmayı dener; başsızsa SSH ipucu gösterir).
    - Henüz token'ınız yoksa: `openclaw doctor --generate-gateway-token`.
    - Uzaksa, önce tünel açın: `ssh -N -L 18789:127.0.0.1:18789 user@host` ardından `http://127.0.0.1:18789/` adresini açın.
    - Paylaşılan gizli mod: `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` veya `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` ayarlayın, ardından eşleşen gizli değeri Control UI ayarlarına yapıştırın.
    - Tailscale Serve modu: `gateway.auth.allowTailscale` etkin olduğundan ve Tailscale kimlik başlıklarını atlayan ham bir loopback/tailnet URL'si değil, Serve URL'sini açtığınızdan emin olun.
    - Güvenilir proxy modu: ham Gateway URL'si değil, yapılandırılmış kimlik farkındalığı olan proxy üzerinden geldiğinizden emin olun. Aynı ana makine loopback proxy'leri de `gateway.auth.trustedProxy.allowLoopback = true` gerektirir.
    - Bir yeniden denemeden sonra uyuşmazlık sürerse, eşleştirilmiş cihaz token'ını döndürün/yeniden onaylayın:
      - `openclaw devices list`
      - `openclaw devices rotate --device <id> --role operator`
    - Bu döndürme çağrısı reddedildiğini söylüyorsa iki şeyi kontrol edin:
      - eşleştirilmiş cihaz oturumları, `operator.admin` yetkisine de sahip olmadıkça yalnızca **kendi** cihazlarını döndürebilir
      - açık `--scope` değerleri, çağıranın geçerli operatör kapsamlarını aşamaz
    - Hâlâ takıldınız mı? `openclaw status --all` çalıştırın ve [Troubleshooting](/tr/gateway/troubleshooting) adımlarını izleyin. Kimlik doğrulama ayrıntıları için [Dashboard](/tr/web/dashboard) bölümüne bakın.

  </Accordion>

  <Accordion title="gateway.bind tailnet ayarladım ama bağlanamıyor ve hiçbir şey dinlemiyor">
    `tailnet` bağlaması, ağ arayüzlerinizden bir Tailscale IP'si seçer (100.64.0.0/10). Makine Tailscale üzerinde değilse (veya arayüz kapalıysa), bağlanacak bir şey yoktur.

    Düzeltme:

    - Bu ana makinede Tailscale'i başlatın (böylece 100.x adresi olur), veya
    - `gateway.bind: "loopback"` / `"lan"` değerine geçin.

    Not: `tailnet` açıktır. `auto` loopback'i tercih eder; yalnızca tailnet'e özel bağlama istediğinizde `gateway.bind: "tailnet"` kullanın.

  </Accordion>

  <Accordion title="Aynı ana makinede birden çok Gateway çalıştırabilir miyim?">
    Genellikle hayır - tek bir Gateway birden çok mesajlaşma kanalı ve aracı çalıştırabilir. Birden çok Gateway'i yalnızca yedeklilik (örn. kurtarma botu) veya sıkı yalıtım gerektiğinde kullanın.

    Evet, ancak yalıtmanız gerekir:

    - `OPENCLAW_CONFIG_PATH` (örnek başına yapılandırma)
    - `OPENCLAW_STATE_DIR` (örnek başına durum)
    - `agents.defaults.workspace` (çalışma alanı yalıtımı)
    - `gateway.port` (benzersiz bağlantı noktaları)

    Hızlı kurulum (önerilen):

    - Örnek başına `openclaw --profile <name> ...` kullanın (`~/.openclaw-<name>` otomatik oluşturulur).
    - Her profil yapılandırmasında benzersiz bir `gateway.port` ayarlayın (veya manuel çalıştırmalar için `--port` geçin).
    - Profil başına bir hizmet kurun: `openclaw --profile <name> gateway install`.

    Profiller ayrıca hizmet adlarına sonek ekler (`ai.openclaw.<profile>`; eski `com.openclaw.*`, `openclaw-gateway-<profile>.service`, `OpenClaw Gateway (<profile>)`).
    Tam kılavuz: [Multiple gateways](/tr/gateway/multiple-gateways).

  </Accordion>

  <Accordion title='"invalid handshake" / kod 1008 ne anlama gelir?'>
    Gateway bir **WebSocket sunucusudur** ve ilk mesajın
    bir `connect` çerçevesi olmasını bekler. Başka bir şey alırsa bağlantıyı
    **kod 1008** (ilke ihlali) ile kapatır.

    Yaygın nedenler:

    - Bir WS istemcisi yerine **HTTP** URL'sini tarayıcıda açtınız (`http://...`).
    - Yanlış bağlantı noktasını veya yolu kullandınız.
    - Bir proxy veya tünel kimlik doğrulama başlıklarını kaldırdı ya da Gateway olmayan bir istek gönderdi.

    Hızlı düzeltmeler:

    1. WS URL'sini kullanın: `ws://<host>:18789` (veya HTTPS ise `wss://...`).
    2. WS bağlantı noktasını normal bir tarayıcı sekmesinde açmayın.
    3. Kimlik doğrulama açıksa, token/parolayı `connect` çerçevesine ekleyin.

    CLI veya TUI kullanıyorsanız URL şöyle görünmelidir:

    ```
    openclaw tui --url ws://<host>:18789 --token <token>
    ```

    Protokol ayrıntıları: [Gateway protocol](/tr/gateway/protocol).

  </Accordion>
</AccordionGroup>

## Günlükleme ve hata ayıklama

<AccordionGroup>
  <Accordion title="Günlükler nerede?">
    Dosya günlükleri (yapılandırılmış):

    ```
    /tmp/openclaw/openclaw-YYYY-MM-DD.log
    ```

    `logging.file` ile kararlı bir yol ayarlayabilirsiniz. Dosya günlük seviyesi `logging.level` tarafından denetlenir. Konsol ayrıntı düzeyi `--verbose` ve `logging.consoleLevel` tarafından denetlenir.

    En hızlı günlük takibi:

    ```bash
    openclaw logs --follow
    ```

    Servis/supervisor günlükleri (Gateway launchd/systemd üzerinden çalıştığında):

    - macOS launchd stdout: `~/Library/Logs/openclaw/gateway.log` (profiller `gateway-<profile>.log` kullanır; stderr bastırılır)
    - Linux: `journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`
    - Windows: `schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`

    Daha fazlası için [Sorun giderme](/tr/gateway/troubleshooting) bölümüne bakın.

  </Accordion>

  <Accordion title="Gateway servisini nasıl başlatır/durdurur/yeniden başlatırım?">
    Gateway yardımcılarını kullanın:

    ```bash
    openclaw gateway status
    openclaw gateway restart
    ```

    Gateway'i elle çalıştırıyorsanız, `openclaw gateway --force` portu geri alabilir. Bkz. [Gateway](/tr/gateway).

  </Accordion>

  <Accordion title="Windows'ta terminalimi kapattım - OpenClaw'ı nasıl yeniden başlatırım?">
    **Üç Windows kurulum modu** vardır:

    **1) Windows Hub yerel kurulumu:** yerel uygulama, uygulamaya ait yerel bir WSL Gateway'i yönetir.

    Başlat menüsünden veya tepsiden **OpenClaw Companion**'ı açın, ardından
    **Gateway Setup** veya Bağlantılar sekmesini kullanın.

    **2) Elle WSL2 Gateway:** Gateway Linux içinde çalışır.

    PowerShell'i açın, WSL'e girin, ardından yeniden başlatın:

    ```powershell
    wsl
    openclaw gateway status
    openclaw gateway restart
    ```

    Servisi hiç kurmadıysanız, ön planda başlatın:

    ```bash
    openclaw gateway run
    ```

    **3) Yerel Windows CLI/Gateway:** Gateway doğrudan Windows'ta çalışır.

    PowerShell'i açın ve çalıştırın:

    ```powershell
    openclaw gateway status
    openclaw gateway restart
    ```

    Elle çalıştırıyorsanız (servis yoksa), şunu kullanın:

    ```powershell
    openclaw gateway run
    ```

    Belgeler: [Windows](/tr/platforms/windows), [Gateway servis çalışma kılavuzu](/tr/gateway).

  </Accordion>

  <Accordion title="Gateway çalışıyor ama yanıtlar hiç gelmiyor. Neyi kontrol etmeliyim?">
    Hızlı bir sağlık taramasıyla başlayın:

    ```bash
    openclaw status
    openclaw models status
    openclaw channels status
    openclaw logs --follow
    ```

    Yaygın nedenler:

    - Model kimlik doğrulaması **gateway host** üzerinde yüklenmemiştir (`models status` kontrol edin).
    - Kanal eşleştirme/izin listesi yanıtları engelliyordur (kanal yapılandırmasını + günlükleri kontrol edin).
    - WebChat/Dashboard doğru token olmadan açıktır.

    Uzak konumdaysanız, tünel/Tailscale bağlantısının çalıştığını ve
    Gateway WebSocket'e erişilebildiğini doğrulayın.

    Belgeler: [Kanallar](/tr/channels), [Sorun giderme](/tr/gateway/troubleshooting), [Uzaktan erişim](/tr/gateway/remote).

  </Accordion>

  <Accordion title='"Gateway bağlantısı kesildi: neden yok" - şimdi ne yapmalı?'>
    Bu genellikle UI'ın WebSocket bağlantısını kaybettiği anlamına gelir. Kontrol edin:

    1. Gateway çalışıyor mu? `openclaw gateway status`
    2. Gateway sağlıklı mı? `openclaw status`
    3. UI doğru token'a sahip mi? `openclaw dashboard`
    4. Uzak bağlantıdaysanız, tünel/Tailscale bağlantısı açık mı?

    Ardından günlükleri takip edin:

    ```bash
    openclaw logs --follow
    ```

    Belgeler: [Dashboard](/tr/web/dashboard), [Uzaktan erişim](/tr/gateway/remote), [Sorun giderme](/tr/gateway/troubleshooting).

  </Accordion>

  <Accordion title="Telegram setMyCommands başarısız oluyor. Neyi kontrol etmeliyim?">
    Günlükler ve kanal durumuyla başlayın:

    ```bash
    openclaw channels status
    openclaw channels logs --channel telegram
    ```

    Ardından hatayı eşleştirin:

    - `BOT_COMMANDS_TOO_MUCH`: Telegram menüsünde çok fazla giriş var. OpenClaw zaten Telegram sınırına kadar kırpar ve daha az komutla yeniden dener, ancak bazı menü girişlerinin yine de kaldırılması gerekir. Plugin/skill/özel komutları azaltın veya menüye ihtiyacınız yoksa `channels.telegram.commands.native` ayarını devre dışı bırakın.
    - `TypeError: fetch failed`, `Network request for 'setMyCommands' failed!` veya benzer ağ hataları: Bir VPS üzerindeyseniz veya proxy arkasındaysanız, dışa giden HTTPS'e izin verildiğini ve DNS'in `api.telegram.org` için çalıştığını doğrulayın.

    Gateway uzaksa, Gateway host üzerindeki günlüklere baktığınızdan emin olun.

    Belgeler: [Telegram](/tr/channels/telegram), [Kanal sorun giderme](/tr/channels/troubleshooting).

  </Accordion>

  <Accordion title="TUI çıktı göstermiyor. Neyi kontrol etmeliyim?">
    Önce Gateway'e erişilebildiğini ve agent'ın çalışabildiğini doğrulayın:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    TUI içinde mevcut durumu görmek için `/status` kullanın. Bir sohbet
    kanalında yanıt bekliyorsanız, teslimatın etkin olduğundan emin olun (`/deliver on`).

    Belgeler: [TUI](/tr/web/tui), [Slash komutları](/tr/tools/slash-commands).

  </Accordion>

  <Accordion title="Gateway'i tamamen durdurup sonra nasıl başlatırım?">
    Servisi kurduysanız:

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    Bu, **denetlenen servisi** durdurur/başlatır (macOS'ta launchd, Linux'ta systemd).
    Gateway arka planda daemon olarak çalıştığında bunu kullanın.

    Ön planda çalıştırıyorsanız, Ctrl-C ile durdurun, ardından:

    ```bash
    openclaw gateway run
    ```

    Belgeler: [Gateway servis çalışma kılavuzu](/tr/gateway).

  </Accordion>

  <Accordion title="Basit anlatım: openclaw gateway restart ile openclaw gateway farkı">
    - `openclaw gateway restart`: **arka plan servisini** yeniden başlatır (launchd/systemd).
    - `openclaw gateway`: gateway'i bu terminal oturumu için **ön planda** çalıştırır.

    Servisi kurduysanız, gateway komutlarını kullanın. Tek seferlik, ön planda
    bir çalıştırma istediğinizde `openclaw gateway` kullanın.

  </Accordion>

  <Accordion title="Bir şey başarısız olduğunda daha fazla ayrıntı almanın en hızlı yolu">
    Daha fazla konsol ayrıntısı almak için Gateway'i `--verbose` ile başlatın. Ardından kanal kimlik doğrulaması, model yönlendirme ve RPC hataları için günlük dosyasını inceleyin.
  </Accordion>
</AccordionGroup>

## Medya ve ekler

<AccordionGroup>
  <Accordion title="Skill'im bir görüntü/PDF oluşturdu, ama hiçbir şey gönderilmedi">
    Agent'tan çıkan ekler `media`, `mediaUrl`, `path` veya `filePath` gibi yapılandırılmış medya alanlarını kullanmalıdır. Bkz. [OpenClaw asistan kurulumu](/tr/start/openclaw) ve [Agent gönderimi](/tr/tools/agent-send).

    CLI gönderimi:

    ```bash
    openclaw message send --target +15555550123 --message "Here you go" --media /path/to/file.png
    ```

    Ayrıca şunları kontrol edin:

    - Hedef kanal giden medyayı destekliyor ve izin listeleri tarafından engellenmiyor.
    - Dosya sağlayıcının boyut sınırları içindedir (görüntüler en fazla 2048px olacak şekilde yeniden boyutlandırılır).
    - `tools.fs.workspaceOnly=true`, yerel yol gönderimlerini çalışma alanı, temp/media-store ve sandbox tarafından doğrulanmış dosyalarla sınırlar.
    - `tools.fs.workspaceOnly=false`, yapılandırılmış yerel medya gönderimlerinin agent'ın zaten okuyabildiği host-yerel dosyaları kullanmasına izin verir, ancak yalnızca medya ve güvenli belge türleri için (görüntüler, ses, video, PDF, Office belgeleri ve Markdown/MD, TXT, JSON, YAML ve YML gibi doğrulanmış metin belgeleri). Bu bir gizli bilgi tarayıcısı değildir: uzantı ve içerik doğrulaması eşleştiğinde agent tarafından okunabilir bir `secret.txt` veya `config.json` eklenebilir. Hassas dosyaları agent tarafından okunabilir yolların dışında tutun veya daha sıkı yerel yol gönderimleri için `tools.fs.workspaceOnly=true` kullanın.

    Bkz. [Görüntüler](/tr/nodes/images).

  </Accordion>
</AccordionGroup>

## Güvenlik ve erişim denetimi

<AccordionGroup>
  <Accordion title="OpenClaw'ı gelen DM'lere açmak güvenli mi?">
    Gelen DM'leri güvenilmeyen girdi olarak ele alın. Varsayılanlar riski azaltmak için tasarlanmıştır:

    - DM destekli kanallarda varsayılan davranış **eşleştirme**dir:
      - Bilinmeyen göndericiler bir eşleştirme kodu alır; bot mesajlarını işlemez.
      - Şununla onaylayın: `openclaw pairing approve --channel <channel> [--account <id>] <code>`
      - Bekleyen istekler **kanal başına 3** ile sınırlıdır; kod gelmediyse `openclaw pairing list --channel <channel> [--account <id>]` kontrol edin.
    - DM'leri herkese açık açmak açık opt-in gerektirir (`dmPolicy: "open"` ve izin listesi `"*"`).

    Riskli DM politikalarını göstermek için `openclaw doctor` çalıştırın.

  </Accordion>

  <Accordion title="Prompt injection yalnızca herkese açık botlar için mi sorun?">
    Hayır. Prompt injection yalnızca bota kimin DM atabildiğiyle değil, **güvenilmeyen içerikle** ilgilidir.
    Asistanınız harici içerik okuyorsa (web araması/getirme, tarayıcı sayfaları, e-postalar,
    belgeler, ekler, yapıştırılmış günlükler), bu içerik modeli ele geçirmeye çalışan
    talimatlar içerebilir. Bu, **tek gönderici siz olsanız** bile gerçekleşebilir.

    En büyük risk, araçlar etkin olduğundadır: model kandırılarak bağlamı dışarı sızdırabilir
    veya sizin adınıza araçları çağırabilir. Etki alanını şu yollarla azaltın:

    - güvenilmeyen içeriği özetlemek için salt okunur veya araçları devre dışı bir "okuyucu" agent kullanmak
    - araç etkin agent'lar için `web_search` / `web_fetch` / `browser` kapalı tutmak
    - çözümlenen dosya/belge metnini de güvenilmeyen kabul etmek: OpenResponses
      `input_file` ve medya eki çıkarımı, ham dosya metnini geçirmek yerine çıkarılan metni
      açık harici içerik sınır işaretleriyle sarar
    - sandbox kullanmak ve katı araç izin listeleri uygulamak

    Ayrıntılar: [Güvenlik](/tr/gateway/security).

  </Accordion>

  <Accordion title="OpenClaw, Rust/WASM yerine TypeScript/Node kullandığı için daha mı az güvenli?">
    Dil ve runtime önemlidir, ancak kişisel bir agent için ana risk bunlar değildir.
    Pratik OpenClaw riskleri Gateway'in açığa çıkması, bota kimin mesaj atabildiği,
    prompt injection, araç kapsamı, kimlik bilgisi yönetimi, tarayıcı erişimi, exec
    erişimi ve üçüncü taraf skill veya plugin güvenidir.

    Rust ve WASM bazı kod sınıfları için daha güçlü izolasyon sağlayabilir, ancak
    prompt injection, kötü izin listeleri, herkese açık Gateway açığa çıkması,
    aşırı geniş araçlar veya hassas hesaplarda zaten oturum açmış bir tarayıcı profilini
    çözmez. Bunları birincil kontroller olarak ele alın:

    - Gateway'i özel veya kimlik doğrulamalı tutun
    - DM'ler ve gruplar için eşleştirme ve izin listeleri kullanın
    - güvenilmeyen girdiler için riskli araçları reddedin veya sandbox'a alın
    - yalnızca güvenilir plugin'ler ve skills kurun
    - yapılandırma değişikliklerinden sonra `openclaw security audit --deep` çalıştırın

    Ayrıntılar: [Güvenlik](/tr/gateway/security), [Sandbox kullanımı](/tr/gateway/sandboxing).

  </Accordion>

  <Accordion title="Açığa çıkan OpenClaw örnekleriyle ilgili raporlar gördüm. Neyi kontrol etmeliyim?">
    Önce gerçek dağıtımınızı kontrol edin:

    ```bash
    openclaw security audit --deep
    openclaw gateway status
    ```

    Daha güvenli bir temel şudur:

    - Gateway `loopback`'e bağlanmış veya yalnızca tailnet, SSH tüneli, token/parola kimlik doğrulaması ya da doğru yapılandırılmış güvenilir proxy gibi kimlik doğrulamalı özel
      erişim üzerinden açığa çıkarılmış
    - DM'ler `pairing` veya `allowlist` modunda
    - her üye güvenilir değilse gruplar izin listesine alınmış ve mention-gated
    - yüksek riskli araçlar (`exec`, `browser`, `gateway`, `cron`) güvenilmeyen içerik okuyan agent'lar için reddedilmiş veya sıkı
      kapsamlandırılmış
    - araç yürütmenin daha küçük bir etki alanına ihtiyaç duyduğu yerlerde sandbox etkin

    Kimlik doğrulamasız herkese açık bind'lar, araçlarla açık DM'ler/gruplar ve açığa çıkarılmış tarayıcı
    denetimi önce düzeltilmesi gereken bulgulardır. Ayrıntılar:
    [Güvenlik denetimi kontrol listesi](/tr/gateway/security#security-audit-checklist).

  </Accordion>

  <Accordion title="ClawHub skills ve üçüncü taraf plugin'leri kurmak güvenli mi?">
    Üçüncü taraf skills ve plugin'leri güvenmeyi seçtiğiniz kod olarak ele alın.
    ClawHub skill sayfaları kurulumdan önce tarama durumunu gösterir, ancak taramalar
    tam bir güvenlik sınırı değildir. OpenClaw, plugin veya skill kurulum/güncelleme
    akışları sırasında yerleşik yerel tehlikeli kod engellemesi çalıştırmaz; yerel
    izin/engelleme kararları için operatöre ait `security.installPolicy` kullanın.

    Daha güvenli kalıp:

    - güvenilir yazarları ve sabitlenmiş sürümleri tercih edin
    - etkinleştirmeden önce skill veya plugin'i okuyun
    - plugin ve skill izin listelerini dar tutun
    - güvenilmeyen girdi iş akışlarını en az araçla bir sandbox içinde çalıştırın
    - üçüncü taraf koda geniş dosya sistemi, exec, tarayıcı veya gizli bilgi erişimi vermekten kaçının

    Ayrıntılar: [Skills](/tr/tools/skills), [Plugin](/tr/tools/plugin),
    [Güvenlik](/tr/gateway/security).

  </Accordion>

  <Accordion title="Botumun kendi e-postası, GitHub hesabı veya telefon numarası olmalı mı?">
    Evet, çoğu kurulum için. Botu ayrı hesaplar ve telefon numaralarıyla izole etmek,
    bir şeyler ters giderse etki alanını azaltır. Bu ayrıca kişisel hesaplarınızı
    etkilemeden kimlik bilgilerini döndürmeyi veya erişimi iptal etmeyi kolaylaştırır.

    Küçük başlayın. Yalnızca gerçekten ihtiyaç duyduğunuz araçlara ve hesaplara
    erişim verin, gerekirse daha sonra genişletin.

    Belgeler: [Güvenlik](/tr/gateway/security), [Eşleştirme](/tr/channels/pairing).

  </Accordion>

  <Accordion title="Metin mesajlarım üzerinde ona özerklik verebilir miyim ve bu güvenli mi?">
    Kişisel mesajlarınız üzerinde tam özerklik vermenizi **önermiyoruz**. En güvenli kalıp şudur:

    - DM'leri **eşleştirme modunda** veya sıkı bir izin listesinde tutun.
    - Sizin adınıza mesaj göndermesini istiyorsanız **ayrı bir numara veya hesap** kullanın.
    - Taslak oluşturmasına izin verin, sonra **göndermeden önce onaylayın**.

    Deneme yapmak istiyorsanız bunu ayrılmış bir hesapta yapın ve izole tutun. Bkz.
    [Güvenlik](/tr/gateway/security).

  </Accordion>

  <Accordion title="Kişisel asistan görevleri için daha ucuz modeller kullanabilir miyim?">
    Evet, aracı yalnızca sohbet amaçlıysa ve girdi güvenilirse. Daha küçük katmanlar
    talimat ele geçirmeye daha açıktır, bu yüzden araç etkinleştirilmiş aracılar için
    veya güvenilmeyen içerik okunurken bunlardan kaçının. Daha küçük bir model kullanmanız
    gerekiyorsa araçları kilitleyin ve bir sandbox içinde çalıştırın. Bkz. [Güvenlik](/tr/gateway/security).
  </Accordion>

  <Accordion title="Telegram'da /start çalıştırdım ama eşleştirme kodu almadım">
    Eşleştirme kodları **yalnızca** bilinmeyen bir gönderen bota mesaj gönderdiğinde ve
    `dmPolicy: "pairing"` etkin olduğunda gönderilir. `/start` tek başına kod oluşturmaz.

    Bekleyen istekleri kontrol edin:

    ```bash
    openclaw pairing list telegram
    ```

    Hemen erişim istiyorsanız gönderen kimliğinizi izin listesine ekleyin veya
    bu hesap için `dmPolicy: "open"` ayarlayın.

  </Accordion>

  <Accordion title="WhatsApp: kişilerime mesaj gönderir mi? Eşleştirme nasıl çalışır?">
    Hayır. Varsayılan WhatsApp DM politikası **eşleştirme**dir. Bilinmeyen gönderenler yalnızca bir eşleştirme kodu alır ve mesajları **işlenmez**. OpenClaw yalnızca aldığı sohbetlere veya sizin açıkça tetiklediğiniz gönderimlere yanıt verir.

    Eşleştirmeyi şu komutla onaylayın:

    ```bash
    openclaw pairing approve whatsapp <code>
    ```

    Bekleyen istekleri listeleyin:

    ```bash
    openclaw pairing list whatsapp
    ```

    Sihirbaz telefon numarası istemi: kendi DM'lerinize izin verilmesi için **izin listenizi/sahibinizi** ayarlamakta kullanılır. Otomatik gönderim için kullanılmaz. Kişisel WhatsApp numaranızda çalıştırıyorsanız o numarayı kullanın ve `channels.whatsapp.selfChatMode` etkinleştirin.

  </Accordion>
</AccordionGroup>

## Sohbet komutları, görevleri iptal etme ve "durmuyor"

<AccordionGroup>
  <Accordion title="Dahili sistem mesajlarının sohbette görünmesini nasıl durdururum?">
    Çoğu dahili veya araç mesajı yalnızca o oturum için **verbose**, **trace** veya **reasoning**
    etkin olduğunda görünür.

    Bunu gördüğünüz sohbette düzeltin:

    ```
    /verbose off
    /trace off
    /reasoning off
    ```

    Hâlâ fazla gürültülüyse Control UI'daki oturum ayarlarını kontrol edin ve verbose değerini
    **inherit** olarak ayarlayın. Ayrıca yapılandırmada `verboseDefault` değeri `on` olarak
    ayarlanmış bir bot profili kullanmadığınızı doğrulayın.

    Belgeler: [Düşünme ve verbose](/tr/tools/thinking), [Güvenlik](/tr/gateway/security/index#reasoning-and-verbose-output-in-groups).

  </Accordion>

  <Accordion title="Çalışan bir görevi nasıl durdurur/iptal ederim?">
    Bunlardan herhangi birini **bağımsız bir mesaj olarak** gönderin (eğik çizgi olmadan):

    ```
    stop
    stop action
    stop current action
    stop run
    stop current run
    stop agent
    stop the agent
    stop openclaw
    openclaw stop
    stop don't do anything
    stop do not do anything
    stop doing anything
    please stop
    stop please
    abort
    esc
    wait
    exit
    interrupt
    ```

    Bunlar iptal tetikleyicileridir (eğik çizgi komutları değildir).

    Arka plan süreçleri için (exec aracından), aracıdan şunu çalıştırmasını isteyebilirsiniz:

    ```
    process action:kill sessionId:XXX
    ```

    Eğik çizgi komutları genel bakışı: bkz. [Eğik çizgi komutları](/tr/tools/slash-commands).

    Çoğu komut, `/` ile başlayan **bağımsız** bir mesaj olarak gönderilmelidir, ancak birkaç kısayol (`/status` gibi) izin listesindeki gönderenler için satır içinde de çalışır.

  </Accordion>

  <Accordion title='Telegram'dan Discord mesajı nasıl gönderirim? ("Bağlamlar arası mesajlaşma reddedildi")'>
    OpenClaw varsayılan olarak **sağlayıcılar arası** mesajlaşmayı engeller. Bir araç çağrısı
    Telegram'a bağlıysa, açıkça izin vermediğiniz sürece Discord'a göndermez.

    Aracı için sağlayıcılar arası mesajlaşmayı etkinleştirin:

    ```json5
    {
      tools: {
        message: {
          crossContext: {
            allowAcrossProviders: true,
            marker: { enabled: true, prefix: "[from {channel}] " },
          },
        },
      },
    }
    ```

    Yapılandırmayı düzenledikten sonra Gateway'i yeniden başlatın.

  </Accordion>

  <Accordion title='Botun hızlı ardışık mesajları "yok saydığı" neden hissediliyor?'>
    Çalışma ortası istemleri varsayılan olarak etkin çalışmaya yönlendirilir. Etkin çalışma davranışını seçmek için `/queue` kullanın:

    - `steer` - bir sonraki model sınırında etkin çalışmaya rehberlik et
    - `followup` - mesajları kuyruğa al ve mevcut çalışma bittikten sonra tek tek çalıştır
    - `collect` - uyumlu mesajları kuyruğa al ve mevcut çalışma bittikten sonra bir kez yanıtla
    - `interrupt` - mevcut çalışmayı iptal et ve yeniden başla

    Varsayılan mod `steer`dir. Kuyruk modları için `debounce:0.5s cap:25 drop:summarize` gibi seçenekler ekleyebilirsiniz. Bkz. [Komut kuyruğu](/tr/concepts/queue) ve [Yönlendirme kuyruğu](/tr/concepts/queue-steering).

  </Accordion>
</AccordionGroup>

## Çeşitli

<AccordionGroup>
  <Accordion title='API anahtarıyla Anthropic için varsayılan model nedir?'>
    OpenClaw'da kimlik bilgileri ve model seçimi ayrıdır. `ANTHROPIC_API_KEY` ayarlamak (veya kimlik doğrulama profillerinde bir Anthropic API anahtarı saklamak) kimlik doğrulamayı etkinleştirir, ancak gerçek varsayılan model `agents.defaults.model.primary` içinde yapılandırdığınız modeldir (örneğin, `anthropic/claude-sonnet-4-6` veya `anthropic/claude-opus-4-6`). `No credentials found for profile "anthropic:default"` görürseniz bu, Gateway'in çalışan aracı için beklenen `auth-profiles.json` içinde Anthropic kimlik bilgilerini bulamadığı anlamına gelir.
  </Accordion>
</AccordionGroup>

---

Hâlâ takıldınız mı? [Discord](https://discord.com/invite/clawd) üzerinden sorun veya bir [GitHub tartışması](https://github.com/openclaw/openclaw/discussions) açın.

## İlgili

- [İlk çalıştırma SSS](/tr/help/faq-first-run) — kurulum, ilk yapılandırma, kimlik doğrulama, abonelikler, erken hatalar
- [Modeller SSS](/tr/help/faq-models) — model seçimi, failover, kimlik doğrulama profilleri
- [Sorun giderme](/tr/help/troubleshooting) — belirti odaklı triyaj
