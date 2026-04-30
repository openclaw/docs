---
read_when:
    - Yaygın kurulum, yükleme, başlangıç süreci veya çalışma zamanı desteği sorularını yanıtlama
    - Daha derin hata ayıklamaya geçmeden önce kullanıcıların bildirdiği sorunları ön değerlendirme
summary: OpenClaw kurulumu, yapılandırması ve kullanımı hakkında sık sorulan sorular
title: SSS
x-i18n:
    generated_at: "2026-04-30T09:26:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: c09be6571e048b71e4e02288b22b51e70102872675dfc7bef133b955a06f6ac9
    source_path: help/faq.md
    workflow: 16
---

Hızlı yanıtlar ve gerçek dünya kurulumları için daha derin sorun giderme (yerel geliştirme, VPS, çok aracılı, OAuth/API anahtarları, model yük devretme). Çalışma zamanı tanılamaları için bkz. [Sorun giderme](/tr/gateway/troubleshooting). Tam yapılandırma referansı için bkz. [Yapılandırma](/tr/gateway/configuration).

## Bir şey bozulduysa ilk 60 saniye

1. **Hızlı durum (ilk kontrol)**

   ```bash
   openclaw status
   ```

   Hızlı yerel özet: OS + güncelleme, gateway/servis erişilebilirliği, aracılar/oturumlar, sağlayıcı yapılandırması + çalışma zamanı sorunları (gateway erişilebilir olduğunda).

2. **Yapıştırılabilir rapor (paylaşması güvenli)**

   ```bash
   openclaw status --all
   ```

   Günlük sonuyla birlikte salt okunur tanılama (tokenlar redakte edilir).

3. **Daemon + port durumu**

   ```bash
   openclaw gateway status
   ```

   Supervisor çalışma zamanı ile RPC erişilebilirliğini, yoklama hedef URL'sini ve servisin muhtemelen hangi yapılandırmayı kullandığını gösterir.

4. **Derin yoklamalar**

   ```bash
   openclaw status --deep
   ```

   Desteklendiğinde kanal yoklamaları dahil canlı bir gateway sağlık yoklaması çalıştırır
   (erişilebilir bir gateway gerektirir). Bkz. [Sağlık](/tr/gateway/health).

5. **En son günlüğü takip edin**

   ```bash
   openclaw logs --follow
   ```

   RPC kapalıysa şuna geri dönün:

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   Dosya günlükleri servis günlüklerinden ayrıdır; bkz. [Günlükleme](/tr/logging) ve [Sorun giderme](/tr/gateway/troubleshooting).

6. **Doctor'ı çalıştırın (onarımlar)**

   ```bash
   openclaw doctor
   ```

   Yapılandırmayı/durumu onarır/taşır + sağlık kontrolleri çalıştırır. Bkz. [Doctor](/tr/gateway/doctor).

7. **Gateway anlık görüntüsü**

   ```bash
   openclaw health --json
   openclaw health --verbose   # hatalarda hedef URL'yi + yapılandırma yolunu gösterir
   ```

   Çalışan gateway'den tam bir anlık görüntü ister (yalnızca WS). Bkz. [Sağlık](/tr/gateway/health).

## Hızlı başlangıç ve ilk çalıştırma kurulumu

İlk çalıştırma SSS'si — kurulum, ilk yapılandırma, kimlik doğrulama rotaları, abonelikler, ilk hatalar —
[İlk çalıştırma SSS](/tr/help/faq-first-run) sayfasındadır.

## OpenClaw nedir?

<AccordionGroup>
  <Accordion title="OpenClaw tek paragrafta nedir?">
    OpenClaw, kendi cihazlarınızda çalıştırdığınız kişisel bir AI asistanıdır. Zaten kullandığınız mesajlaşma yüzeylerinde (WhatsApp, Telegram, Slack, Mattermost, Discord, Google Chat, Signal, iMessage, WebChat ve QQ Bot gibi paketlenmiş kanal pluginleri) yanıt verir ve desteklenen platformlarda ses + canlı Canvas da yapabilir. **Gateway** her zaman açık kontrol düzlemidir; asistan ise üründür.
  </Accordion>

  <Accordion title="Değer önerisi">
    OpenClaw "sadece bir Claude sarmalayıcısı" değildir. Zaten kullandığınız sohbet uygulamalarından erişilebilen, durumlu oturumlar, bellek ve araçlarla **kendi donanımınızda** yetenekli bir asistan çalıştırmanızı sağlayan **yerel öncelikli bir kontrol düzlemidir**; iş akışlarınızın kontrolünü barındırılan bir SaaS'a devretmeniz gerekmez.

    Öne çıkanlar:

    - **Cihazlarınız, verileriniz:** Gateway'i istediğiniz yerde çalıştırın (Mac, Linux, VPS) ve çalışma alanı + oturum geçmişini yerel tutun.
    - **Web sanal alanı değil, gerçek kanallar:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage/vb,
      ayrıca desteklenen platformlarda mobil ses ve Canvas.
    - **Modelden bağımsız:** Aracı başına yönlendirme ve yük devretme ile Anthropic, OpenAI, MiniMax, OpenRouter vb. kullanın.
    - **Yalnızca yerel seçenek:** İsterseniz **tüm veriler cihazınızda kalabilsin** diye yerel modeller çalıştırın.
    - **Çok aracılı yönlendirme:** Her biri kendi çalışma alanı ve varsayılanlarına sahip kanal, hesap veya görev başına ayrı aracılar.
    - **Açık kaynak ve kurcalanabilir:** Satıcı bağımlılığı olmadan inceleyin, genişletin ve kendi kendinize barındırın.

    Belgeler: [Gateway](/tr/gateway), [Kanallar](/tr/channels), [Çok aracılı](/tr/concepts/multi-agent),
    [Bellek](/tr/concepts/memory).

  </Accordion>

  <Accordion title="Az önce kurdum - ilk olarak ne yapmalıyım?">
    İyi ilk projeler:

    - Bir web sitesi oluşturun (WordPress, Shopify veya basit bir statik site).
    - Bir mobil uygulama prototipi çıkarın (taslak, ekranlar, API planı).
    - Dosya ve klasörleri düzenleyin (temizleme, adlandırma, etiketleme).
    - Gmail'i bağlayın ve özetleri veya takipleri otomatikleştirin.

    Büyük görevleri ele alabilir, ancak bunları aşamalara böldüğünüzde ve
    paralel işler için alt aracılar kullandığınızda en iyi sonucu verir.

  </Accordion>

  <Accordion title="OpenClaw için en yaygın beş günlük kullanım alanı nedir?">
    Günlük kazanımlar genellikle şöyle görünür:

    - **Kişisel brifingler:** önemsediğiniz gelen kutusu, takvim ve haber özetleri.
    - **Araştırma ve taslak oluşturma:** e-postalar veya belgeler için hızlı araştırma, özetler ve ilk taslaklar.
    - **Hatırlatmalar ve takipler:** Cron veya Heartbeat güdümlü dürtmeler ve kontrol listeleri.
    - **Tarayıcı otomasyonu:** formları doldurma, veri toplama ve web görevlerini tekrarlama.
    - **Cihazlar arası koordinasyon:** telefonunuzdan bir görev gönderin, Gateway'in bunu bir sunucuda çalıştırmasına izin verin ve sonucu sohbette geri alın.

  </Accordion>

  <Accordion title="OpenClaw bir SaaS için müşteri adayı bulma, erişim, reklamlar ve bloglarda yardımcı olabilir mi?">
    **Araştırma, nitelendirme ve taslak oluşturma** için evet. Siteleri tarayabilir, kısa listeler oluşturabilir,
    potansiyel müşterileri özetleyebilir ve erişim veya reklam metni taslakları yazabilir.

    **Erişim veya reklam çalışmaları** için döngüde bir insan tutun. Spam'den kaçının, yerel yasalara ve
    platform politikalarına uyun ve gönderilmeden önce her şeyi gözden geçirin. En güvenli kalıp,
    OpenClaw'un taslak hazırlaması ve sizin onaylamanızdır.

    Belgeler: [Güvenlik](/tr/gateway/security).

  </Accordion>

  <Accordion title="Web geliştirme için Claude Code'a göre avantajları nelerdir?">
    OpenClaw bir **kişisel asistan** ve koordinasyon katmanıdır, IDE yerine geçmez. Bir repo içinde en hızlı doğrudan kodlama döngüsü için
    Claude Code veya Codex kullanın. Kalıcı bellek, cihazlar arası erişim ve araç orkestrasyonu istediğinizde OpenClaw kullanın.

    Avantajlar:

    - Oturumlar arasında **kalıcı bellek + çalışma alanı**
    - **Çok platformlu erişim** (WhatsApp, Telegram, TUI, WebChat)
    - **Araç orkestrasyonu** (tarayıcı, dosyalar, zamanlama, hooklar)
    - **Her zaman açık Gateway** (bir VPS üzerinde çalıştırın, her yerden etkileşim kurun)
    - Yerel tarayıcı/ekran/kamera/exec için **Node'lar**

    Gösterim: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills ve otomasyon

<AccordionGroup>
  <Accordion title="Repoyu kirletmeden skills'i nasıl özelleştiririm?">
    Repo kopyasını düzenlemek yerine yönetilen geçersiz kılmalar kullanın. Değişikliklerinizi `~/.openclaw/skills/<name>/SKILL.md` içine koyun (veya `~/.openclaw/openclaw.json` içinde `skills.load.extraDirs` ile bir klasör ekleyin). Öncelik sırası `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → paketlenmiş → `skills.load.extraDirs` şeklindedir; bu nedenle yönetilen geçersiz kılmalar git'e dokunmadan paketlenmiş skills'e göre yine üstün gelir. Skill'in küresel olarak kurulu olması ama yalnızca bazı aracılara görünmesi gerekiyorsa, paylaşılan kopyayı `~/.openclaw/skills` içinde tutun ve görünürlüğü `agents.defaults.skills` ile `agents.list[].skills` üzerinden kontrol edin. Yalnızca upstream'e uygun düzenlemeler repoda yaşamalı ve PR olarak çıkmalıdır.
  </Accordion>

  <Accordion title="Özel bir klasörden skills yükleyebilir miyim?">
    Evet. `~/.openclaw/openclaw.json` içinde `skills.load.extraDirs` aracılığıyla ek dizinler ekleyin (en düşük öncelik). Varsayılan öncelik `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → paketlenmiş → `skills.load.extraDirs` şeklindedir. `clawhub` varsayılan olarak `./skills` içine kurar; OpenClaw bir sonraki oturumda bunu `<workspace>/skills` olarak ele alır. Skill yalnızca belirli aracılara görünmeliyse, bunu `agents.defaults.skills` veya `agents.list[].skills` ile eşleştirin.
  </Accordion>

  <Accordion title="Farklı görevler için farklı modelleri nasıl kullanabilirim?">
    Bugün desteklenen kalıplar şunlardır:

    - **Cron işleri**: yalıtılmış işler, iş başına bir `model` geçersiz kılması ayarlayabilir.
    - **Alt aracılar**: görevleri farklı varsayılan modellere sahip ayrı aracılara yönlendirin.
    - **İsteğe bağlı geçiş**: geçerli oturum modelini istediğiniz zaman değiştirmek için `/model` kullanın.

    Bkz. [Cron işleri](/tr/automation/cron-jobs), [Çok Aracılı Yönlendirme](/tr/concepts/multi-agent) ve [Eğik çizgi komutları](/tr/tools/slash-commands).

  </Accordion>

  <Accordion title="Bot ağır iş yaparken donuyor. Bunu nasıl başka yere devrederim?">
    Uzun veya paralel görevler için **alt aracılar** kullanın. Alt aracılar kendi oturumlarında çalışır,
    bir özet döndürür ve ana sohbetinizin yanıt vermeye devam etmesini sağlar.

    Botunuzdan "bu görev için bir alt aracı oluşturmasını" isteyin veya `/subagents` kullanın.
    Gateway'in o anda ne yaptığını (ve meşgul olup olmadığını) görmek için sohbette `/status` kullanın.

    Token ipucu: uzun görevler ve alt aracılar token tüketir. Maliyet önemliyse, `agents.defaults.subagents.model` üzerinden
    alt aracılar için daha ucuz bir model ayarlayın.

    Belgeler: [Alt aracılar](/tr/tools/subagents), [Arka Plan Görevleri](/tr/automation/tasks).

  </Accordion>

  <Accordion title="Discord'da iş parçacığına bağlı alt aracı oturumları nasıl çalışır?">
    İş parçacığı bağlamalarını kullanın. Bir Discord iş parçacığını bir alt aracıya veya oturum hedefine bağlayabilirsiniz; böylece o iş parçacığındaki takip mesajları bağlı oturumda kalır.

    Temel akış:

    - `thread: true` ile `sessions_spawn` kullanarak oluşturun (ve kalıcı takip için isteğe bağlı olarak `mode: "session"`).
    - Veya `/focus <target>` ile elle bağlayın.
    - Bağlama durumunu incelemek için `/agents` kullanın.
    - Otomatik odaktan çıkarmayı kontrol etmek için `/session idle <duration|off>` ve `/session max-age <duration|off>` kullanın.
    - İş parçacığını ayırmak için `/unfocus` kullanın.

    Gerekli yapılandırma:

    - Küresel varsayılanlar: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
    - Discord geçersiz kılmaları: `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours`.
    - Oluşturma sırasında otomatik bağlama: `channels.discord.threadBindings.spawnSubagentSessions: true` ayarlayın.

    Belgeler: [Alt aracılar](/tr/tools/subagents), [Discord](/tr/channels/discord), [Yapılandırma Referansı](/tr/gateway/configuration-reference), [Eğik çizgi komutları](/tr/tools/slash-commands).

  </Accordion>

  <Accordion title="Bir alt aracı tamamlandı, ancak tamamlanma güncellemesi yanlış yere gitti veya hiç gönderilmedi. Neyi kontrol etmeliyim?">
    Önce çözümlenen istek sahibi rotasını kontrol edin:

    - Tamamlanma modundaki alt aracı teslimi, mevcutsa herhangi bir bağlı iş parçacığını veya konuşma rotasını tercih eder.
    - Tamamlanma kaynağı yalnızca bir kanal taşıyorsa, OpenClaw doğrudan teslimatın yine de başarılı olabilmesi için istek sahibi oturumun saklanan rotasına (`lastChannel` / `lastTo` / `lastAccountId`) geri döner.
    - Ne bağlı bir rota ne de kullanılabilir bir saklanan rota varsa, doğrudan teslimat başarısız olabilir ve sonuç sohbete hemen gönderilmek yerine kuyruğa alınmış oturum teslimatına geri döner.
    - Geçersiz veya eski hedefler yine de kuyruğa geri dönüşü veya nihai teslimat hatasını zorlayabilir.
    - Alt öğenin son görünür asistan yanıtı tam olarak sessiz token `NO_REPLY` / `no_reply` veya tam olarak `ANNOUNCE_SKIP` ise, OpenClaw eski önceki ilerlemeyi göndermek yerine duyuruyu kasıtlı olarak bastırır.
    - Alt öğe yalnızca araç çağrılarından sonra zaman aşımına uğradıysa, duyuru ham araç çıktısını yeniden oynatmak yerine bunu kısa bir kısmi ilerleme özetine indirgeyebilir.

    Hata ayıklama:

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    Belgeler: [Alt aracılar](/tr/tools/subagents), [Arka Plan Görevleri](/tr/automation/tasks), [Oturum Araçları](/tr/concepts/session-tool).

  </Accordion>

  <Accordion title="Cron veya hatırlatıcılar çalışmıyor. Neyi kontrol etmeliyim?">
    Cron, Gateway sürecinin içinde çalışır. Gateway sürekli çalışmıyorsa,
    zamanlanmış işler çalışmaz.

    Kontrol listesi:

    - Cron'un etkin olduğunu (`cron.enabled`) ve `OPENCLAW_SKIP_CRON` ayarlı olmadığını doğrulayın.
    - Gateway'in 7/24 çalıştığını kontrol edin (uyku/yeniden başlatma yok).
    - İş için saat dilimi ayarlarını doğrulayın (`--tz` ile ana makine saat dilimi).

    Hata ayıklama:

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    Belgeler: [Cron işleri](/tr/automation/cron-jobs), [Otomasyon ve Görevler](/tr/automation).

  </Accordion>

  <Accordion title="Cron tetiklendi, ancak kanala hiçbir şey gönderilmedi. Neden?">
    Önce teslim modunu kontrol edin:

    - `--no-deliver` / `delivery.mode: "none"` runner yedek gönderiminin beklenmediği anlamına gelir.
    - Eksik veya geçersiz duyuru hedefi (`channel` / `to`), runner'ın dışa teslimi atladığı anlamına gelir.
    - Kanal kimlik doğrulama hataları (`unauthorized`, `Forbidden`), runner'ın teslim etmeye çalıştığı ancak kimlik bilgilerinin bunu engellediği anlamına gelir.
    - Sessiz yalıtılmış sonuç (yalnızca `NO_REPLY` / `no_reply`), kasıtlı olarak teslim edilemez kabul edilir; bu nedenle runner kuyruktaki yedek teslimi de bastırır.

    Yalıtılmış cron işleri için, bir sohbet rotası kullanılabiliyorsa agent yine de `message`
    aracıyla doğrudan gönderebilir. `--announce` yalnızca agent'ın zaten göndermediği
    son metin için runner yedek yolunu kontrol eder.

    Hata ayıklama:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Belgeler: [Cron işleri](/tr/automation/cron-jobs), [Arka Plan Görevleri](/tr/automation/tasks).

  </Accordion>

  <Accordion title="Yalıtılmış bir cron çalıştırması neden model değiştirdi veya bir kez yeniden denedi?">
    Bu genellikle yinelenen zamanlama değil, canlı model değiştirme yoludur.

    Yalıtılmış cron, etkin çalışma `LiveSessionModelSwitchError` fırlattığında
    çalışma zamanı model devrini kalıcı hale getirip yeniden deneyebilir. Yeniden deneme,
    değiştirilmiş provider/model değerini korur ve değişiklik yeni bir auth profile override
    taşıdıysa cron yeniden denemeden önce bunu da kalıcı hale getirir.

    İlgili seçim kuralları:

    - Uygulanabilir olduğunda önce Gmail hook model override kazanır.
    - Ardından iş başına `model`.
    - Ardından depolanmış cron oturumu model override.
    - Ardından normal agent/varsayılan model seçimi.

    Yeniden deneme döngüsü sınırlıdır. İlk deneme artı 2 değiştirme yeniden denemesinden sonra
    cron sonsuza dek döngüye girmek yerine iptal eder.

    Hata ayıklama:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Belgeler: [Cron işleri](/tr/automation/cron-jobs), [cron CLI](/tr/cli/cron).

  </Accordion>

  <Accordion title="Linux üzerinde Skills nasıl kurarım?">
    Yerel `openclaw skills` komutlarını kullanın veya skills öğelerini çalışma alanınıza bırakın. macOS Skills kullanıcı arayüzü Linux üzerinde kullanılamaz.
    Skills öğelerine [https://clawhub.ai](https://clawhub.ai) adresinden göz atın.

    ```bash
    openclaw skills search "calendar"
    openclaw skills search --limit 20
    openclaw skills install <skill-slug>
    openclaw skills install <skill-slug> --version <version>
    openclaw skills install <skill-slug> --force
    openclaw skills update --all
    openclaw skills list --eligible
    openclaw skills check
    ```

    Yerel `openclaw skills install`, etkin çalışma alanındaki `skills/`
    dizinine yazar. Ayrı `clawhub` CLI'yi yalnızca kendi skills öğelerinizi yayımlamak veya
    senkronize etmek istiyorsanız kurun. Agent'lar arasında paylaşılan kurulumlar için skill öğesini
    `~/.openclaw/skills` altına koyun ve hangi agent'ların bunu görebileceğini daraltmak istiyorsanız
    `agents.defaults.skills` veya `agents.list[].skills` kullanın.

  </Accordion>

  <Accordion title="OpenClaw görevleri zamanlamaya göre veya sürekli olarak arka planda çalıştırabilir mi?">
    Evet. Gateway zamanlayıcısını kullanın:

    - Zamanlanmış veya yinelenen görevler için **Cron işleri** (yeniden başlatmalar arasında kalıcıdır).
    - "Ana oturum" dönemsel kontrolleri için **Heartbeat**.
    - Özet gönderen veya sohbetlere teslim eden otonom agent'lar için **Yalıtılmış işler**.

    Belgeler: [Cron işleri](/tr/automation/cron-jobs), [Otomasyon ve Görevler](/tr/automation),
    [Heartbeat](/tr/gateway/heartbeat).

  </Accordion>

  <Accordion title="Apple macOS'a özel skills öğelerini Linux'tan çalıştırabilir miyim?">
    Doğrudan değil. macOS skills öğeleri `metadata.openclaw.os` ve gerekli ikili dosyalarla sınırlandırılır; skills yalnızca **Gateway host** üzerinde uygun olduklarında sistem prompt'unda görünür. Linux üzerinde `darwin`'e özel skills (`apple-notes`, `apple-reminders`, `things-mac` gibi), sınırlamayı override etmediğiniz sürece yüklenmez.

    Desteklenen üç desen vardır:

    **Seçenek A - Gateway'i Mac üzerinde çalıştırın (en basit).**
    Gateway'i macOS ikili dosyalarının bulunduğu yerde çalıştırın, ardından Linux'tan [remote mode](#gateway-ports-already-running-and-remote-mode) ile veya Tailscale üzerinden bağlanın. Gateway host macOS olduğu için skills normal şekilde yüklenir.

    **Seçenek B - bir macOS node kullanın (SSH yok).**
    Gateway'i Linux üzerinde çalıştırın, bir macOS node (menü çubuğu uygulaması) eşleştirin ve Mac üzerinde **Node Run Commands** ayarını "Always Ask" veya "Always Allow" yapın. OpenClaw, gerekli ikili dosyalar node üzerinde mevcut olduğunda macOS'a özel skills öğelerini uygun kabul edebilir. Agent bu skills öğelerini `nodes` aracı üzerinden çalıştırır. "Always Ask" seçerseniz, prompt'ta "Always Allow" onayı vermek bu komutu allowlist'e ekler.

    **Seçenek C - macOS ikili dosyalarını SSH üzerinden proxy'leyin (ileri düzey).**
    Gateway'i Linux üzerinde tutun, ancak gerekli CLI ikili dosyalarının Mac üzerinde çalışan SSH sarmalayıcılarına çözülmesini sağlayın. Ardından skill öğesinin uygun kalması için Linux'a izin verecek şekilde override edin.

    1. İkili dosya için bir SSH sarmalayıcısı oluşturun (örnek: Apple Notes için `memo`):

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. Sarmalayıcıyı Linux host üzerinde `PATH`'e koyun (örneğin `~/bin/memo`).
    3. Linux'a izin vermek için skill metadata'sını (çalışma alanı veya `~/.openclaw/skills`) override edin:

       ```markdown
       ---
       name: apple-notes
       description: Manage Apple Notes via the memo CLI on macOS.
       metadata: { "openclaw": { "os": ["darwin", "linux"], "requires": { "bins": ["memo"] } } }
       ---
       ```

    4. Skills snapshot'ının yenilenmesi için yeni bir oturum başlatın.

  </Accordion>

  <Accordion title="Notion veya HeyGen entegrasyonunuz var mı?">
    Bugün yerleşik olarak yok.

    Seçenekler:

    - **Özel skill / plugin:** güvenilir API erişimi için en iyisi (Notion/HeyGen ikisinin de API'leri vardır).
    - **Tarayıcı otomasyonu:** kod olmadan çalışır ancak daha yavaş ve daha kırılgandır.

    Bağlamı müşteri başına tutmak istiyorsanız (ajans iş akışları), basit bir desen şudur:

    - Müşteri başına bir Notion sayfası (bağlam + tercihler + etkin çalışma).
    - Agent'tan oturum başında bu sayfayı getirmesini isteyin.

    Yerel bir entegrasyon istiyorsanız, bir özellik isteği açın veya bu API'leri
    hedefleyen bir skill oluşturun.

    Skills kurun:

    ```bash
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    Yerel kurulumlar etkin çalışma alanındaki `skills/` dizinine iner. Agent'lar arasında paylaşılan skills için bunları `~/.openclaw/skills/<name>/SKILL.md` konumuna yerleştirin. Yalnızca bazı agent'ların paylaşılan bir kurulumu görmesi gerekiyorsa `agents.defaults.skills` veya `agents.list[].skills` yapılandırın. Bazı skills Homebrew ile kurulmuş ikili dosyalar bekler; Linux üzerinde bu Linuxbrew anlamına gelir (yukarıdaki Homebrew Linux SSS girdisine bakın). Bkz. [Skills](/tr/tools/skills), [Skills yapılandırması](/tr/tools/skills-config) ve [ClawHub](/tr/tools/clawhub).

  </Accordion>

  <Accordion title="Mevcut oturum açmış Chrome'umu OpenClaw ile nasıl kullanırım?">
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

    Bu yol yerel host tarayıcısını veya bağlı bir tarayıcı node'unu kullanabilir. Gateway başka yerde çalışıyorsa, tarayıcı makinesinde bir node host çalıştırın ya da bunun yerine uzak CDP kullanın.

    `existing-session` / `user` üzerindeki mevcut sınırlar:

    - eylemler CSS selector odaklı değil, ref odaklıdır
    - yüklemeler `ref` / `inputRef` gerektirir ve şu anda tek seferde bir dosyayı destekler
    - `responsebody`, PDF dışa aktarma, indirme yakalama ve toplu eylemler hâlâ yönetilen tarayıcı veya raw CDP profili gerektirir

  </Accordion>
</AccordionGroup>

## Sandbox ve bellek

<AccordionGroup>
  <Accordion title="Özel bir sandboxing belgesi var mı?">
    Evet. Bkz. [Sandboxing](/tr/gateway/sandboxing). Docker'a özel kurulum için (Docker içinde tam gateway veya sandbox imajları), bkz. [Docker](/tr/install/docker).
  </Accordion>

  <Accordion title="Docker sınırlı hissettiriyor - tüm özellikleri nasıl etkinleştiririm?">
    Varsayılan imaj güvenlik önceliklidir ve `node` kullanıcısı olarak çalışır; bu yüzden
    sistem paketlerini, Homebrew'ü veya paketlenmiş tarayıcıları içermez. Daha eksiksiz bir kurulum için:

    - Önbelleklerin kalıcı olması için `/home/node` öğesini `OPENCLAW_HOME_VOLUME` ile kalıcı hale getirin.
    - Sistem bağımlılıklarını `OPENCLAW_DOCKER_APT_PACKAGES` ile imaja gömün.
    - Paketlenmiş CLI aracılığıyla Playwright tarayıcılarını kurun:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - `PLAYWRIGHT_BROWSERS_PATH` ayarlayın ve yolun kalıcı olduğundan emin olun.

    Belgeler: [Docker](/tr/install/docker), [Tarayıcı](/tr/tools/browser).

  </Accordion>

  <Accordion title="DM'leri kişisel tutup grupları tek agent ile herkese açık/sandboxed yapabilir miyim?">
    Evet - özel trafiğiniz **DM'ler** ve herkese açık trafiğiniz **gruplar** ise.

    `agents.defaults.sandbox.mode: "non-main"` kullanın; böylece grup/kanal oturumları (ana olmayan anahtarlar) yapılandırılmış sandbox backend içinde çalışırken ana DM oturumu host üzerinde kalır. Bir backend seçmezseniz Docker varsayılan backend'dir. Ardından `tools.sandbox.tools` aracılığıyla sandboxed oturumlarda hangi araçların kullanılabilir olduğunu sınırlayın.

    Kurulum adımları + örnek yapılandırma: [Gruplar: kişisel DM'ler + herkese açık gruplar](/tr/channels/groups#pattern-personal-dms-public-groups-single-agent)

    Temel yapılandırma referansı: [Gateway yapılandırması](/tr/gateway/config-agents#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="Bir host klasörünü sandbox içine nasıl bağlarım?">
    `agents.defaults.sandbox.docker.binds` değerini `["host:path:mode"]` olarak ayarlayın (ör. `"/home/user/src:/src:ro"`). Genel + agent başına bind'lar birleştirilir; `scope: "shared"` olduğunda agent başına bind'lar yok sayılır. Hassas olan her şey için `:ro` kullanın ve bind'ların sandbox dosya sistemi duvarlarını aştığını unutmayın.

    OpenClaw, bind kaynaklarını hem normalize edilmiş yola hem de en derin mevcut üst öğe üzerinden çözümlenen kanonik yola göre doğrular. Bu, son yol segmenti henüz mevcut olmasa bile symlink-parent kaçışlarının kapalı başarısız olacağı ve allowed-root kontrollerinin symlink çözümlemesinden sonra da uygulanacağı anlamına gelir.

    Örnekler ve güvenlik notları için [Sandboxing](/tr/gateway/sandboxing#custom-bind-mounts) ve [Sandbox vs Tool Policy vs Elevated](/tr/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check) bölümlerine bakın.

  </Accordion>

  <Accordion title="Bellek nasıl çalışır?">
    OpenClaw belleği yalnızca agent çalışma alanındaki Markdown dosyalarıdır:

    - `memory/YYYY-MM-DD.md` içinde günlük notlar
    - `MEMORY.md` içinde düzenlenmiş uzun vadeli notlar (yalnızca ana/özel oturumlar)

    OpenClaw ayrıca otomatik Compaction öncesinde modele kalıcı notlar yazmasını hatırlatmak için
    **sessiz Compaction öncesi bellek boşaltma** çalıştırır. Bu yalnızca çalışma alanı
    yazılabilir olduğunda çalışır (salt okunur sandbox'lar bunu atlar). Bkz. [Bellek](/tr/concepts/memory).

  </Accordion>

  <Accordion title="Bellek sürekli bir şeyleri unutuyor. Kalıcı olmasını nasıl sağlarım?">
    Bottan **olguyu belleğe yazmasını** isteyin. Uzun vadeli notlar `MEMORY.md` içinde,
    kısa vadeli bağlam `memory/YYYY-MM-DD.md` içine gider.

    Bu hâlâ geliştirdiğimiz bir alan. Modele anıları depolamasını hatırlatmak yardımcı olur;
    ne yapacağını bilir. Unutmaya devam ederse, Gateway'in her çalıştırmada aynı
    çalışma alanını kullandığını doğrulayın.

    Belgeler: [Bellek](/tr/concepts/memory), [Agent çalışma alanı](/tr/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Bellek sonsuza kadar kalır mı? Sınırlar nelerdir?">
    Bellek dosyaları diskte yaşar ve siz silene kadar kalıcıdır. Sınır model değil,
    depolama alanınızdır. **Oturum bağlamı** ise hâlâ modelin bağlam penceresiyle sınırlıdır;
    bu nedenle uzun konuşmalar compact edilebilir veya kesilebilir. Bellek aramasının var olma nedeni budur -
    yalnızca ilgili parçaları tekrar bağlama çeker.

    Belgeler: [Bellek](/tr/concepts/memory), [Bağlam](/tr/concepts/context).

  </Accordion>

  <Accordion title="Anlamsal bellek araması OpenAI API anahtarı gerektirir mi?">
    Yalnızca **OpenAI embeddings** kullanıyorsanız. Codex OAuth sohbet/tamamlamaları kapsar ve
    embeddings erişimi **sağlamaz**, bu nedenle **Codex ile oturum açmak (OAuth veya
    Codex CLI oturumu)** anlamsal bellek aramasına yardımcı olmaz. OpenAI embeddings
    yine de gerçek bir API anahtarına ihtiyaç duyar (`OPENAI_API_KEY` veya `models.providers.openai.apiKey`).

    Açıkça bir sağlayıcı ayarlamazsanız OpenClaw, bir API anahtarını çözümleyebildiğinde
    otomatik olarak bir sağlayıcı seçer (auth profilleri, `models.providers.*.apiKey` veya env vars).
    Bir OpenAI anahtarı çözümlenirse OpenAI'ı, aksi halde bir Gemini anahtarı
    çözümlenirse Gemini'ı, sonra Voyage'ı, sonra Mistral'ı tercih eder. Uzak anahtar yoksa bellek
    araması siz yapılandırana kadar devre dışı kalır. Yerel model yolu
    yapılandırılmış ve mevcutsa OpenClaw
    `local` tercih eder. Ollama, açıkça
    `memorySearch.provider = "ollama"` ayarladığınızda desteklenir.

    Yerel kalmayı tercih ederseniz `memorySearch.provider = "local"` ayarlayın (ve isteğe bağlı olarak
    `memorySearch.fallback = "none"`). Gemini embeddings istiyorsanız
    `memorySearch.provider = "gemini"` ayarlayın ve `GEMINI_API_KEY` (veya
    `memorySearch.remote.apiKey`) sağlayın. **OpenAI, Gemini, Voyage, Mistral, Ollama veya local** embedding
    modellerini destekliyoruz - kurulum ayrıntıları için [Bellek](/tr/concepts/memory) bölümüne bakın.

  </Accordion>
</AccordionGroup>

## Diskte şeyler nerede bulunur

<AccordionGroup>
  <Accordion title="OpenClaw ile kullanılan tüm veriler yerel olarak mı kaydedilir?">
    Hayır - **OpenClaw'ın durumu yereldir**, ancak **dış hizmetler onlara gönderdiğiniz şeyleri yine de görür**.

    - **Varsayılan olarak yerel:** oturumlar, bellek dosyaları, config ve workspace Gateway ana makinesinde bulunur
      (`~/.openclaw` + workspace dizininiz).
    - **Zorunluluktan uzak:** model sağlayıcılarına (Anthropic/OpenAI/vb.) gönderdiğiniz mesajlar
      onların API'lerine gider ve sohbet platformları (WhatsApp/Telegram/Slack/vb.) mesaj verilerini
      kendi sunucularında saklar.
    - **Kapsamı siz kontrol edersiniz:** yerel modeller kullanmak istemleri makinenizde tutar, ancak kanal
      trafiği yine de kanalın sunucularından geçer.

    İlgili: [Agent workspace](/tr/concepts/agent-workspace), [Bellek](/tr/concepts/memory).

  </Accordion>

  <Accordion title="OpenClaw verilerini nerede saklar?">
    Her şey `$OPENCLAW_STATE_DIR` altında bulunur (varsayılan: `~/.openclaw`):

    | Yol                                                             | Amaç                                                               |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | Ana config (JSON5)                                                 |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | Eski OAuth içe aktarımı (ilk kullanımda auth profillerine kopyalanır) |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | Auth profilleri (OAuth, API anahtarları ve isteğe bağlı `keyRef`/`tokenRef`) |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | `file` SecretRef sağlayıcıları için isteğe bağlı dosya destekli secret payload |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | Eski uyumluluk dosyası (statik `api_key` girdileri temizlenir)      |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | Sağlayıcı durumu (örn. `whatsapp/<accountId>/creds.json`)           |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | Agent başına durum (agentDir + oturumlar)                          |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | Konuşma geçmişi ve durumu (agent başına)                           |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | Oturum meta verileri (agent başına)                                |

    Eski tek agent yolu: `~/.openclaw/agent/*` (`openclaw doctor` tarafından taşınır).

    **Workspace**'iniz (AGENTS.md, bellek dosyaları, skills vb.) ayrıdır ve `agents.defaults.workspace` üzerinden yapılandırılır (varsayılan: `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title="AGENTS.md / SOUL.md / USER.md / MEMORY.md nerede bulunmalı?">
    Bu dosyalar `~/.openclaw` içinde değil, **agent workspace** içinde bulunur.

    - **Workspace (agent başına)**: `AGENTS.md`, `SOUL.md`, `IDENTITY.md`, `USER.md`,
      `MEMORY.md`, `memory/YYYY-MM-DD.md`, isteğe bağlı `HEARTBEAT.md`.
      Küçük harfli kök `memory.md` yalnızca eski onarım girdisidir; `openclaw doctor --fix`
      her iki dosya da varsa onu `MEMORY.md` içine birleştirebilir.
    - **Durum dizini (`~/.openclaw`)**: config, kanal/sağlayıcı durumu, auth profilleri, oturumlar, günlükler
      ve paylaşılan Skills (`~/.openclaw/skills`).

    Varsayılan workspace `~/.openclaw/workspace` şeklindedir, şu şekilde yapılandırılabilir:

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    Bot yeniden başlatmadan sonra "unutuyorsa", Gateway'in her başlatmada aynı
    workspace'i kullandığını doğrulayın (ve unutmayın: uzak mod, yerel dizüstü bilgisayarınızın değil
    **gateway ana makinesinin** workspace'ini kullanır).

    İpucu: kalıcı bir davranış veya tercih istiyorsanız sohbet geçmişine güvenmek yerine bottan bunu
    **AGENTS.md veya MEMORY.md içine yazmasını** isteyin.

    Bkz. [Agent workspace](/tr/concepts/agent-workspace) ve [Bellek](/tr/concepts/memory).

  </Accordion>

  <Accordion title="Önerilen yedekleme stratejisi">
    **Agent workspace**'inizi **özel** bir git deposuna koyun ve özel bir yerde
    yedekleyin (örneğin GitHub private). Bu, bellek + AGENTS/SOUL/USER
    dosyalarını yakalar ve asistanın "zihnini" daha sonra geri yüklemenizi sağlar.

    `~/.openclaw` altındaki hiçbir şeyi commit etmeyin (kimlik bilgileri, oturumlar, token'lar veya şifreli secret payload'ları).
    Tam geri yükleme gerekiyorsa hem workspace'i hem de durum dizinini
    ayrı ayrı yedekleyin (yukarıdaki migration sorusuna bakın).

    Dokümanlar: [Agent workspace](/tr/concepts/agent-workspace).

  </Accordion>

  <Accordion title="OpenClaw'ı tamamen nasıl kaldırırım?">
    Özel kılavuza bakın: [Kaldırma](/tr/install/uninstall).
  </Accordion>

  <Accordion title="Agent'lar workspace dışında çalışabilir mi?">
    Evet. Workspace **varsayılan cwd** ve bellek sabitleyicisidir, katı bir sandbox değildir.
    Göreli yollar workspace içinde çözümlenir, ancak sandboxing etkin değilse mutlak yollar diğer
    ana makine konumlarına erişebilir. İzolasyona ihtiyacınız varsa
    [`agents.defaults.sandbox`](/tr/gateway/sandboxing) veya agent başına sandbox ayarlarını kullanın. Bir repo'nun varsayılan çalışma dizini olmasını
    istiyorsanız o agent'ın `workspace` değerini repo köküne yönlendirin. OpenClaw deposu yalnızca kaynak koddur; agent'ın özellikle içinde çalışmasını istemiyorsanız
    workspace'i ayrı tutun.

    Örnek (repo varsayılan cwd olarak):

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
    Oturum durumu **gateway ana makinesine** aittir. Uzak moddaysanız, ilgilendiğiniz oturum deposu yerel dizüstü bilgisayarınızda değil, uzak makinededir. Bkz. [Oturum yönetimi](/tr/concepts/session).
  </Accordion>
</AccordionGroup>

## Config temelleri

<AccordionGroup>
  <Accordion title="Config hangi formatta? Nerede bulunur?">
    OpenClaw, `$OPENCLAW_CONFIG_PATH` konumundan isteğe bağlı bir **JSON5** config okur (varsayılan: `~/.openclaw/openclaw.json`):

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    Dosya yoksa güvenli sayılabilecek varsayılanları kullanır (`~/.openclaw/workspace` varsayılan workspace'i dahil).

  </Accordion>

  <Accordion title='gateway.bind: "lan" (veya "tailnet") ayarladım ve artık hiçbir şey dinlemiyor / UI yetkisiz diyor'>
    local loopback dışı bağlamalar **geçerli bir gateway auth yolu gerektirir**. Pratikte bunun anlamı:

    - shared-secret auth: token veya password
    - doğru yapılandırılmış kimlik farkındalığı olan reverse proxy arkasında `gateway.auth.mode: "trusted-proxy"`

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

    - `gateway.remote.token` / `.password` tek başlarına yerel gateway auth'u etkinleştirmez.
    - Yerel çağrı yolları yalnızca `gateway.auth.*` ayarlanmamışsa `gateway.remote.*` değerini fallback olarak kullanabilir.
    - Password auth için bunun yerine `gateway.auth.mode: "password"` ve `gateway.auth.password` (veya `OPENCLAW_GATEWAY_PASSWORD`) ayarlayın.
    - `gateway.auth.token` / `gateway.auth.password` SecretRef üzerinden açıkça yapılandırılmış ve çözümlenememişse çözümleme kapalı şekilde başarısız olur (remote fallback maskelemesi yoktur).
    - Shared-secret Control UI kurulumları `connect.params.auth.token` veya `connect.params.auth.password` (uygulama/UI ayarlarında saklanır) üzerinden kimlik doğrular. Tailscale Serve veya `trusted-proxy` gibi kimlik taşıyan modlar bunun yerine istek header'larını kullanır. Shared secret'ları URL'lere koymaktan kaçının.
    - `gateway.auth.mode: "trusted-proxy"` ile aynı ana makinedeki local loopback reverse proxy'leri açıkça `gateway.auth.trustedProxy.allowLoopback = true` ve `gateway.trustedProxies` içinde bir loopback girdisi gerektirir.

  </Accordion>

  <Accordion title="Artık localhost üzerinde neden token'a ihtiyacım var?">
    OpenClaw, local loopback dahil olmak üzere gateway auth'u varsayılan olarak zorunlu kılar. Normal varsayılan yolda bunun anlamı token auth'tur: açıkça yapılandırılmış bir auth yolu yoksa gateway başlangıcı token moduna çözümlenir ve bir token'ı otomatik üretip `gateway.auth.token` içine kaydeder, bu nedenle **yerel WS istemcileri kimlik doğrulamalıdır**. Bu, diğer yerel süreçlerin Gateway'i çağırmasını engeller.

    Farklı bir auth yolu tercih ediyorsanız password modunu (veya kimlik farkındalığı olan reverse proxy'ler için `trusted-proxy`) açıkça seçebilirsiniz. local loopback'i **gerçekten** açık istiyorsanız config'inizde açıkça `gateway.auth.mode: "none"` ayarlayın. Doctor sizin için her zaman token üretebilir: `openclaw doctor --generate-gateway-token`.

  </Accordion>

  <Accordion title="Config değiştirdikten sonra yeniden başlatmam gerekir mi?">
    Gateway config'i izler ve hot-reload destekler:

    - `gateway.reload.mode: "hybrid"` (varsayılan): güvenli değişiklikleri hot-apply yapar, kritik olanlar için yeniden başlatır
    - `hot`, `restart`, `off` de desteklenir

  </Accordion>

  <Accordion title="Komik CLI sloganlarını nasıl devre dışı bırakırım?">
    Config içinde `cli.banner.taglineMode` ayarlayın:

    ```json5
    {
      cli: {
        banner: {
          taglineMode: "off", // random | default | off
        },
      },
    }
    ```

    - `off`: slogan metnini gizler ama banner başlığı/sürüm satırını korur.
    - `default`: her seferinde `All your chats, one OpenClaw.` kullanır.
    - `random`: dönen komik/mevsimsel sloganlar (varsayılan davranış).
    - Hiç banner istemiyorsanız env `OPENCLAW_HIDE_BANNER=1` ayarlayın.

  </Accordion>

  <Accordion title="Web aramasını (ve web getirmeyi) nasıl etkinleştiririm?">
    `web_fetch` API anahtarı olmadan çalışır. `web_search` seçtiğiniz
    sağlayıcıya bağlıdır:

    - Brave, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Perplexity ve Tavily gibi API destekli sağlayıcılar normal API anahtarı kurulumlarını gerektirir.
    - Ollama Web Search anahtarsızdır, ancak yapılandırılmış Ollama ana makinenizi kullanır ve `ollama signin` gerektirir.
    - DuckDuckGo anahtarsızdır, ancak resmi olmayan HTML tabanlı bir entegrasyondur.
    - SearXNG anahtarsız/self-hosted'dır; `SEARXNG_BASE_URL` veya `plugins.entries.searxng.config.webSearch.baseUrl` yapılandırın.

    **Önerilen:** `openclaw configure --section web` çalıştırın ve bir sağlayıcı seçin.
    Ortam alternatifleri:

    - Brave: `BRAVE_API_KEY`
    - Exa: `EXA_API_KEY`
    - Firecrawl: `FIRECRAWL_API_KEY`
    - Gemini: `GEMINI_API_KEY`
    - Grok: `XAI_API_KEY`
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

    Sağlayıcıya özgü web arama yapılandırması artık `plugins.entries.<plugin>.config.webSearch.*` altında bulunur.
    Eski `tools.web.search.*` sağlayıcı yolları uyumluluk için geçici olarak hâlâ yüklenir, ancak yeni yapılandırmalarda kullanılmamalıdır.
    Firecrawl web getirme fallback yapılandırması `plugins.entries.firecrawl.config.webFetch.*` altında bulunur.

    Notlar:

    - İzin listeleri kullanıyorsanız `web_search`/`web_fetch`/`x_search` veya `group:web` ekleyin.
    - `web_fetch` varsayılan olarak etkindir (açıkça devre dışı bırakılmadığı sürece).
    - `tools.web.fetch.provider` atlanırsa OpenClaw, kullanılabilir kimlik bilgilerinden ilk hazır getirme fallback sağlayıcısını otomatik algılar. Bugün paketle gelen sağlayıcı Firecrawl'dır.
    - Artalan süreçleri env var'ları `~/.openclaw/.env` dosyasından (veya hizmet ortamından) okur.

    Belgeler: [Web araçları](/tr/tools/web).

  </Accordion>

  <Accordion title="config.apply yapılandırmamı sildi. Bunu nasıl kurtarır ve önlerim?">
    `config.apply` **tüm yapılandırmayı** değiştirir. Kısmi bir nesne gönderirseniz geri kalan
    her şey kaldırılır.

    Mevcut OpenClaw birçok kazara ezmeyi önler:

    - OpenClaw tarafından sahip olunan yapılandırma yazımları, yazmadan önce değişiklik sonrası tam yapılandırmayı doğrular.
    - Geçersiz veya yıkıcı OpenClaw tarafından sahip olunan yazımlar reddedilir ve `openclaw.json.rejected.*` olarak kaydedilir.
    - Doğrudan bir düzenleme başlatmayı veya sıcak yeniden yüklemeyi bozarsa Gateway, bilinen son iyi yapılandırmayı geri yükler ve reddedilen dosyayı `openclaw.json.clobbered.*` olarak kaydeder.
    - Ana ajan, kurtarma sonrasında kötü yapılandırmayı körlemesine tekrar yazmaması için bir önyükleme uyarısı alır.

    Kurtarma:

    - `Config auto-restored from last-known-good`, `Config write rejected:` veya `config reload restored last-known-good config` için `openclaw logs --follow` çıktısını kontrol edin.
    - Etkin yapılandırmanın yanındaki en yeni `openclaw.json.clobbered.*` veya `openclaw.json.rejected.*` dosyasını inceleyin.
    - Çalışıyorsa etkin geri yüklenen yapılandırmayı koruyun, ardından yalnızca amaçlanan anahtarları `openclaw config set` veya `config.patch` ile geri kopyalayın.
    - `openclaw config validate` ve `openclaw doctor` çalıştırın.
    - Bilinen son iyi yapılandırmanız veya reddedilen yükünüz yoksa yedekten geri yükleyin ya da `openclaw doctor` komutunu yeniden çalıştırıp kanalları/modelleri yeniden yapılandırın.
    - Bu beklenmedikse bir hata bildirimi açın ve bilinen son yapılandırmanızı veya herhangi bir yedeği ekleyin.
    - Yerel bir kodlama ajanı çoğu zaman günlüklerden veya geçmişten çalışan bir yapılandırmayı yeniden oluşturabilir.

    Bundan kaçınma:

    - Küçük değişiklikler için `openclaw config set` kullanın.
    - Etkileşimli düzenlemeler için `openclaw configure` kullanın.
    - Tam bir yol veya alan şekli konusunda emin değilseniz önce `config.schema.lookup` kullanın; ayrıntıya inmek için sığ bir şema düğümü ve doğrudan alt özetleri döndürür.
    - Kısmi RPC düzenlemeleri için `config.patch` kullanın; `config.apply` yalnızca tam yapılandırma değişimi için kalsın.
    - Bir ajan çalıştırmasından yalnızca sahiplerin kullanabildiği `gateway` aracını kullanıyorsanız, `tools.exec.ask` / `tools.exec.security` yazımlarını yine de reddeder (aynı korumalı exec yollarına normalize edilen eski `tools.bash.*` takma adları dahil).

    Belgeler: [Yapılandırma](/tr/cli/config), [Yapılandır](/tr/cli/configure), [Gateway sorun giderme](/tr/gateway/troubleshooting#gateway-restored-last-known-good-config), [Doctor](/tr/gateway/doctor).

  </Accordion>

  <Accordion title="Cihazlar arasında özelleşmiş işçilerle merkezi bir Gateway'i nasıl çalıştırırım?">
    Yaygın desen **bir Gateway** (ör. Raspberry Pi) artı **Node'lar** ve **ajanlar** kullanmaktır:

    - **Gateway (merkezi):** kanallara (Signal/WhatsApp), yönlendirmeye ve oturumlara sahiptir.
    - **Node'lar (cihazlar):** Macs/iOS/Android çevre birimleri olarak bağlanır ve yerel araçları (`system.run`, `canvas`, `camera`) sunar.
    - **Ajanlar (işçiler):** özel roller için ayrı beyinler/çalışma alanlarıdır (ör. "Hetzner operasyonları", "Kişisel veri").
    - **Alt ajanlar:** paralellik istediğinizde bir ana ajandan arka plan işleri başlatır.
    - **TUI:** Gateway'e bağlanır ve ajanlar/oturumlar arasında geçiş yapar.

    Belgeler: [Node'lar](/tr/nodes), [Uzaktan erişim](/tr/gateway/remote), [Çok Ajanlı Yönlendirme](/tr/concepts/multi-agent), [Alt ajanlar](/tr/tools/subagents), [TUI](/tr/web/tui).

  </Accordion>

  <Accordion title="OpenClaw tarayıcısı başsız çalışabilir mi?">
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

    Varsayılan `false` (görünür mod). Başsız mod bazı sitelerde anti-bot kontrollerini tetiklemeye daha yatkındır. Bkz. [Tarayıcı](/tr/tools/browser).

    Başsız mod **aynı Chromium motorunu** kullanır ve çoğu otomasyon için çalışır (formlar, tıklamalar, kazıma, oturum açmalar). Temel farklar:

    - Görünür tarayıcı penceresi yoktur (görseller gerekiyorsa ekran görüntüleri kullanın).
    - Bazı siteler başsız modda otomasyona karşı daha katıdır (CAPTCHA'lar, anti-bot).
      Örneğin X/Twitter sık sık başsız oturumları engeller.

  </Accordion>

  <Accordion title="Tarayıcı kontrolü için Brave'i nasıl kullanırım?">
    `browser.executablePath` değerini Brave ikili dosyanıza (veya Chromium tabanlı herhangi bir tarayıcıya) ayarlayın ve Gateway'i yeniden başlatın.
    Tam yapılandırma örnekleri için [Tarayıcı](/tr/tools/browser#use-brave-or-another-chromium-based-browser) sayfasına bakın.
  </Accordion>
</AccordionGroup>

## Uzak Gateway'ler ve Node'lar

<AccordionGroup>
  <Accordion title="Komutlar Telegram, Gateway ve Node'lar arasında nasıl yayılır?">
    Telegram iletileri **Gateway** tarafından işlenir. Gateway ajanı çalıştırır ve
    ancak bir Node aracı gerektiğinde **Gateway WebSocket** üzerinden Node'ları çağırır:

    Telegram → Gateway → Ajan → `node.*` → Node → Gateway → Telegram

    Node'lar gelen sağlayıcı trafiğini görmez; yalnızca Node RPC çağrıları alırlar.

  </Accordion>

  <Accordion title="Gateway uzakta barındırılıyorsa ajanım bilgisayarıma nasıl erişebilir?">
    Kısa cevap: **bilgisayarınızı bir Node olarak eşleştirin**. Gateway başka yerde çalışır, ancak
    Gateway WebSocket üzerinden yerel makinenizdeki `node.*` araçlarını (ekran, kamera, sistem) çağırabilir.

    Tipik kurulum:

    1. Gateway'i her zaman açık ana makinede (VPS/ev sunucusu) çalıştırın.
    2. Gateway ana makinesini ve bilgisayarınızı aynı tailnet'e koyun.
    3. Gateway WS'nin erişilebilir olduğundan emin olun (tailnet bağlama veya SSH tüneli).
    4. macOS uygulamasını yerelde açın ve **SSH üzerinden uzak** modda (veya doğrudan tailnet)
       bağlanın; böylece node olarak kaydolabilir.
    5. Node'u Gateway üzerinde onaylayın:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Ayrı bir TCP köprüsü gerekmez; node'lar Gateway WebSocket üzerinden bağlanır.

    Güvenlik hatırlatması: Bir macOS node'unu eşlemek, o makinede `system.run` çalıştırılmasına izin verir. Yalnızca
    güvendiğiniz cihazları eşleyin ve [Güvenlik](/tr/gateway/security) bölümünü inceleyin.

    Belgeler: [Node'lar](/tr/nodes), [Gateway protokolü](/tr/gateway/protocol), [macOS uzak modu](/tr/platforms/mac/remote), [Güvenlik](/tr/gateway/security).

  </Accordion>

  <Accordion title="Tailscale bağlı ama yanıt alamıyorum. Şimdi ne yapmalıyım?">
    Temel noktaları kontrol edin:

    - Gateway çalışıyor: `openclaw gateway status`
    - Gateway sağlığı: `openclaw status`
    - Kanal sağlığı: `openclaw channels status`

    Ardından kimlik doğrulamayı ve yönlendirmeyi doğrulayın:

    - Tailscale Serve kullanıyorsanız, `gateway.auth.allowTailscale` değerinin doğru ayarlandığından emin olun.
    - SSH tüneliyle bağlanıyorsanız, yerel tünelin açık olduğunu ve doğru bağlantı noktasını işaret ettiğini doğrulayın.
    - İzin listelerinizin (DM veya grup) hesabınızı içerdiğini doğrulayın.

    Belgeler: [Tailscale](/tr/gateway/tailscale), [Uzak erişim](/tr/gateway/remote), [Kanallar](/tr/channels).

  </Accordion>

  <Accordion title="İki OpenClaw örneği birbiriyle konuşabilir mi (yerel + VPS)?">
    Evet. Yerleşik bir "bot'tan bot'a" köprüsü yoktur, ancak bunu birkaç
    güvenilir yolla bağlayabilirsiniz:

    **En basit:** Her iki botun da erişebildiği normal bir sohbet kanalı kullanın (Telegram/Slack/WhatsApp).
    Bot A'nın Bot B'ye mesaj göndermesini sağlayın, ardından Bot B'nin her zamanki gibi yanıtlamasına izin verin.

    **CLI köprüsü (genel):** Diğer botun
    dinlediği bir sohbeti hedefleyerek diğer Gateway'i `openclaw agent --message ... --deliver` ile çağıran bir betik çalıştırın. Botlardan biri uzak bir VPS üzerindeyse, CLI'nizi SSH/Tailscale üzerinden o uzak Gateway'e
    yönlendirin ([Uzak erişim](/tr/gateway/remote) bölümüne bakın).

    Örnek kalıp (hedef Gateway'e erişebilen bir makineden çalıştırın):

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    İpucu: İki botun sonsuz döngüye girmemesi için bir güvenlik sınırı ekleyin (yalnızca bahsetme, kanal
    izin listeleri veya "bot mesajlarına yanıt verme" kuralı).

    Belgeler: [Uzak erişim](/tr/gateway/remote), [Agent CLI](/tr/cli/agent), [Agent gönderimi](/tr/tools/agent-send).

  </Accordion>

  <Accordion title="Birden fazla agent için ayrı VPS'lere ihtiyacım var mı?">
    Hayır. Tek bir Gateway, her biri kendi çalışma alanına, model varsayılanlarına
    ve yönlendirmesine sahip birden fazla agent barındırabilir. Bu normal kurulumdur ve agent başına
    bir VPS çalıştırmaktan çok daha ucuz ve basittir.

    Ayrı VPS'leri yalnızca katı yalıtım (güvenlik sınırları) veya paylaşmak istemediğiniz çok
    farklı yapılandırmalar gerektiğinde kullanın. Aksi halde tek bir Gateway kullanın ve
    birden fazla agent veya alt agent kullanın.

  </Accordion>

  <Accordion title="VPS'ten SSH kullanmak yerine kişisel dizüstü bilgisayarımda node kullanmanın faydası var mı?">
    Evet - node'lar uzak bir Gateway'den dizüstü bilgisayarınıza erişmenin birinci sınıf yoludur ve
    shell erişiminden daha fazlasını açar. Gateway macOS/Linux üzerinde çalışır (Windows, WSL2 üzerinden) ve
    hafiftir (küçük bir VPS veya Raspberry Pi sınıfı bir kutu yeterlidir; 4 GB RAM fazlasıyla yeterli), bu nedenle yaygın
    kurulum, her zaman açık bir ana makine ve node olarak dizüstü bilgisayarınızdır.

    - **Gelen SSH gerekmez.** Node'lar Gateway WebSocket'e dışarı doğru bağlanır ve cihaz eşlemesi kullanır.
    - **Daha güvenli yürütme denetimleri.** `system.run`, o dizüstü bilgisayardaki node izin listeleri/onaylarıyla sınırlandırılır.
    - **Daha fazla cihaz aracı.** Node'lar `system.run` ek olarak `canvas`, `camera` ve `screen` sunar.
    - **Yerel tarayıcı otomasyonu.** Gateway'i bir VPS üzerinde tutun, ancak Chrome'u dizüstü bilgisayardaki bir node ana makinesi üzerinden yerelde çalıştırın veya Chrome MCP aracılığıyla ana makinedeki yerel Chrome'a bağlanın.

    SSH geçici shell erişimi için uygundur, ancak node'lar sürekli agent iş akışları ve
    cihaz otomasyonu için daha basittir.

    Belgeler: [Node'lar](/tr/nodes), [Node CLI](/tr/cli/nodes), [Tarayıcı](/tr/tools/browser).

  </Accordion>

  <Accordion title="Node'lar gateway hizmeti çalıştırır mı?">
    Hayır. Bilerek yalıtılmış profiller çalıştırmadığınız sürece ana makine başına yalnızca **bir gateway** çalışmalıdır ([Birden fazla gateway](/tr/gateway/multiple-gateways) bölümüne bakın). Node'lar gateway'e bağlanan çevre birimleridir
    (iOS/Android node'ları veya menü çubuğu uygulamasında macOS "node modu"). Başsız node
    ana makineleri ve CLI denetimi için [Node host CLI](/tr/cli/node) bölümüne bakın.

    `gateway`, `discovery` ve `canvasHost` değişiklikleri için tam yeniden başlatma gerekir.

  </Accordion>

  <Accordion title="Yapılandırmayı uygulamak için API / RPC yolu var mı?">
    Evet.

    - `config.schema.lookup`: Yazmadan önce bir yapılandırma alt ağacını sığ şema node'u, eşleşen UI ipucu ve doğrudan alt özetlerle inceleyin
    - `config.get`: Geçerli anlık görüntüyü + hash'i alın
    - `config.patch`: Güvenli kısmi güncelleme (çoğu RPC düzenlemesi için tercih edilir); mümkün olduğunda sıcak yeniden yükler ve gerektiğinde yeniden başlatır
    - `config.apply`: Tam yapılandırmayı doğrulayın + değiştirin; mümkün olduğunda sıcak yeniden yükler ve gerektiğinde yeniden başlatır
    - Yalnızca sahibin kullanabildiği `gateway` çalışma zamanı aracı hâlâ `tools.exec.ask` / `tools.exec.security` yeniden yazmayı reddeder; eski `tools.bash.*` diğer adları aynı korumalı exec yollarına normalleştirilir

  </Accordion>

  <Accordion title="İlk kurulum için en küçük makul yapılandırma">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    Bu, çalışma alanınızı ayarlar ve botu kimlerin tetikleyebileceğini sınırlar.

  </Accordion>

  <Accordion title="Bir VPS üzerinde Tailscale'i nasıl kurar ve Mac'imden nasıl bağlanırım?">
    En küçük adımlar:

    1. **VPS üzerinde kurulum + oturum açma**

       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```

    2. **Mac'inizde kurulum + oturum açma**
       - Tailscale uygulamasını kullanın ve aynı tailnet'e giriş yapın.
    3. **MagicDNS'i etkinleştirin (önerilir)**
       - Tailscale yönetici konsolunda MagicDNS'i etkinleştirin; böylece VPS sabit bir ada sahip olur.
    4. **Tailnet ana makine adını kullanın**
       - SSH: `ssh user@your-vps.tailnet-xxxx.ts.net`
       - Gateway WS: `ws://your-vps.tailnet-xxxx.ts.net:18789`

    SSH olmadan Control UI kullanmak istiyorsanız VPS üzerinde Tailscale Serve kullanın:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Bu, gateway'i loopback'e bağlı tutar ve HTTPS'i Tailscale üzerinden dışa açar. Bkz. [Tailscale](/tr/gateway/tailscale).

  </Accordion>

  <Accordion title="Bir Mac node'u uzak bir Gateway'e (Tailscale Serve) nasıl bağlarım?">
    Serve, **Gateway Control UI + WS**'yi dışa açar. Node'lar aynı Gateway WS uç noktası üzerinden bağlanır.

    Önerilen kurulum:

    1. **VPS + Mac'in aynı tailnet üzerinde olduğundan emin olun**.
    2. **macOS uygulamasını Uzak modda kullanın** (SSH hedefi tailnet ana makine adı olabilir).
       Uygulama Gateway portunu tüneller ve node olarak bağlanır.
    3. Gateway üzerinde **node'u onaylayın**:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Dokümanlar: [Gateway protokolü](/tr/gateway/protocol), [Keşif](/tr/gateway/discovery), [macOS uzak modu](/tr/platforms/mac/remote).

  </Accordion>

  <Accordion title="İkinci bir dizüstü bilgisayara kurmalı mıyım yoksa sadece bir node mu eklemeliyim?">
    İkinci dizüstü bilgisayarda yalnızca **yerel araçlara** (ekran/kamera/exec) ihtiyacınız varsa onu
    **node** olarak ekleyin. Bu, tek bir Gateway kullanır ve yinelenen yapılandırmayı önler. Yerel node araçları
    şu anda yalnızca macOS içindir, ancak bunları diğer işletim sistemlerine genişletmeyi planlıyoruz.

    Yalnızca **katı yalıtım** veya tamamen ayrı iki bot gerektiğinde ikinci bir Gateway kurun.

    Dokümanlar: [Node'lar](/tr/nodes), [Node'lar CLI](/tr/cli/nodes), [Birden çok gateway](/tr/gateway/multiple-gateways).

  </Accordion>
</AccordionGroup>

## Env vars ve .env yükleme

<AccordionGroup>
  <Accordion title="OpenClaw ortam değişkenlerini nasıl yükler?">
    OpenClaw env vars değerlerini üst süreçten (shell, launchd/systemd, CI vb.) okur ve ayrıca şunları yükler:

    - geçerli çalışma dizininden `.env`
    - `~/.openclaw/.env` konumundan global yedek `.env` (diğer adıyla `$OPENCLAW_STATE_DIR/.env`)

    Hiçbir `.env` dosyası mevcut env vars değerlerini geçersiz kılmaz.

    Yapılandırmada satır içi env vars da tanımlayabilirsiniz (yalnızca süreç env içinde eksikse uygulanır):

    ```json5
    {
      env: {
        OPENROUTER_API_KEY: "sk-or-...",
        vars: { GROQ_API_KEY: "gsk-..." },
      },
    }
    ```

    Tam öncelik sırası ve kaynaklar için [/environment](/tr/help/environment) sayfasına bakın.

  </Accordion>

  <Accordion title="Gateway'i servis üzerinden başlattım ve env vars kayboldu. Şimdi ne yapmalıyım?">
    İki yaygın düzeltme:

    1. Eksik anahtarları `~/.openclaw/.env` içine koyun; böylece servis shell env'inizi devralmasa bile alınırlar.
    2. Shell içe aktarmayı etkinleştirin (isteğe bağlı kolaylık):

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

    Bu, login shell'inizi çalıştırır ve yalnızca eksik beklenen anahtarları içe aktarır (asla geçersiz kılmaz). Env var karşılıkları:
    `OPENCLAW_LOAD_SHELL_ENV=1`, `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`.

  </Accordion>

  <Accordion title='COPILOT_GITHUB_TOKEN ayarladım, ama models status "Shell env: off." gösteriyor. Neden?'>
    `openclaw models status`, **shell env içe aktarma** özelliğinin etkin olup olmadığını bildirir. "Shell env: off"
    env vars değerlerinizin eksik olduğu anlamına **gelmez** - yalnızca OpenClaw'ın
    login shell'inizi otomatik olarak yüklemeyeceği anlamına gelir.

    Gateway bir servis (launchd/systemd) olarak çalışıyorsa shell
    ortamınızı devralmaz. Şunlardan birini yaparak düzeltin:

    1. Token'ı `~/.openclaw/.env` içine koyun:

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. Ya da shell içe aktarmayı etkinleştirin (`env.shellEnv.enabled: true`).
    3. Ya da yapılandırmanızdaki `env` bloğuna ekleyin (yalnızca eksikse uygulanır).

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

  <Accordion title="Hiç /new göndermesem oturumlar otomatik olarak sıfırlanır mı?">
    Oturumlar `session.idleMinutes` sonrasında süresi dolabilir, ancak bu **varsayılan olarak devre dışıdır** (varsayılan **0**).
    Boşta kalma süresinin dolmasını etkinleştirmek için pozitif bir değere ayarlayın. Etkinleştirildiğinde, boşta kalma süresinden sonraki **bir sonraki**
    mesaj, o sohbet anahtarı için yeni bir session id başlatır.
    Bu transkriptleri silmez - yalnızca yeni bir oturum başlatır.

    ```json5
    {
      session: {
        idleMinutes: 240,
      },
    }
    ```

  </Accordion>

  <Accordion title="OpenClaw örneklerinden oluşan bir ekip (bir CEO ve birçok agent) oluşturmanın yolu var mı?">
    Evet, **çok agent'lı yönlendirme** ve **alt agent'lar** ile. Bir koordinatör
    agent ve kendi çalışma alanları ile modellerine sahip birkaç worker agent oluşturabilirsiniz.

    Bununla birlikte, bunu en iyi bir **eğlenceli deney** olarak görmek gerekir. Token kullanımı yoğundur ve çoğu zaman
    ayrı oturumlara sahip tek bir bot kullanmaktan daha az verimlidir. Öngördüğümüz tipik model,
    paralel çalışma için farklı oturumlara sahip, konuştuğunuz tek bir bottur. Bu
    bot gerektiğinde alt agent'lar da oluşturabilir.

    Dokümanlar: [Çok agent'lı yönlendirme](/tr/concepts/multi-agent), [Alt agent'lar](/tr/tools/subagents), [Agent'lar CLI](/tr/cli/agents).

  </Accordion>

  <Accordion title="Bağlam neden görevin ortasında kesildi? Bunu nasıl önlerim?">
    Oturum bağlamı model penceresiyle sınırlıdır. Uzun sohbetler, büyük araç çıktıları veya çok sayıda
    dosya compaction ya da kesmeyi tetikleyebilir.

    Yardımcı olanlar:

    - Bottan geçerli durumu özetlemesini ve bir dosyaya yazmasını isteyin.
    - Uzun görevlerden önce `/compact`, konu değiştirirken `/new` kullanın.
    - Önemli bağlamı çalışma alanında tutun ve bottan onu yeniden okumasını isteyin.
    - Uzun veya paralel işler için alt agent'lar kullanın; böylece ana sohbet daha küçük kalır.
    - Bu sık oluyorsa daha büyük bağlam penceresine sahip bir model seçin.

  </Accordion>

  <Accordion title="OpenClaw'ı tamamen sıfırlayıp kurulu tutmayı nasıl yaparım?">
    Reset komutunu kullanın:

    ```bash
    openclaw reset
    ```

    Etkileşimsiz tam reset:

    ```bash
    openclaw reset --scope full --yes --non-interactive
    ```

    Ardından kurulumu yeniden çalıştırın:

    ```bash
    openclaw onboard --install-daemon
    ```

    Notlar:

    - Onboarding, mevcut bir yapılandırma görürse **Reset** seçeneğini de sunar. Bkz. [Onboarding (CLI)](/tr/start/wizard).
    - Profiller kullandıysanız (`--profile` / `OPENCLAW_PROFILE`), her state dir'i sıfırlayın (varsayılanlar `~/.openclaw-<profile>`).
    - Geliştirme reset'i: `openclaw gateway --dev --reset` (yalnızca geliştirme; geliştirme yapılandırmasını + kimlik bilgilerini + oturumları + çalışma alanını siler).

  </Accordion>

  <Accordion title='"context too large" hataları alıyorum - nasıl reset veya compact yaparım?'>
    Bunlardan birini kullanın:

    - **Compact** (konuşmayı tutar ama eski turları özetler):

      ```
      /compact
      ```

      veya özeti yönlendirmek için `/compact <instructions>`.

    - **Reset** (aynı sohbet anahtarı için yeni oturum kimliği):

      ```
      /new
      /reset
      ```

    Devam ederse:

    - Eski araç çıktısını kırpmak için **oturum budamayı** (`agents.defaults.contextPruning`) etkinleştirin veya ayarlayın.
    - Daha büyük bağlam penceresine sahip bir model kullanın.

    Dokümanlar: [Compaction](/tr/concepts/compaction), [Oturum budama](/tr/concepts/session-pruning), [Oturum yönetimi](/tr/concepts/session).

  </Accordion>

  <Accordion title='Neden "LLM request rejected: messages.content.tool_use.input field required" görüyorum?'>
    Bu bir sağlayıcı doğrulama hatasıdır: model, gerekli `input` olmadan bir `tool_use` bloğu üretti.
    Genellikle oturum geçmişinin bayat veya bozulmuş olduğu anlamına gelir (çoğunlukla uzun thread'lerden
    ya da bir araç/şema değişikliğinden sonra).

    Düzeltme: `/new` ile yeni bir oturum başlatın (bağımsız mesaj).

  </Accordion>

  <Accordion title="Neden her 30 dakikada bir heartbeat mesajları alıyorum?">
    Heartbeat'ler varsayılan olarak her **30m** çalışır (OAuth auth kullanırken **1h**). Ayarlayın veya devre dışı bırakın:

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

    `HEARTBEAT.md` mevcutsa ama etkili biçimde boşsa (yalnızca boş satırlar ve `# Heading` gibi markdown
    başlıkları), OpenClaw API çağrılarını azaltmak için heartbeat çalıştırmasını atlar.
    Dosya eksikse heartbeat yine çalışır ve model ne yapılacağına karar verir.

    Agent başına geçersiz kılmalar `agents.list[].heartbeat` kullanır. Dokümanlar: [Heartbeat](/tr/gateway/heartbeat).

  </Accordion>

  <Accordion title='Bir WhatsApp grubuna "bot account" eklemem gerekir mi?'>
    Hayır. OpenClaw **kendi hesabınızda** çalışır, bu yüzden gruptaysanız OpenClaw onu görebilir.
    Varsayılan olarak, gönderenlere izin verene kadar grup yanıtları engellenir (`groupPolicy: "allowlist"`).

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

  <Accordion title="Bir WhatsApp grubunun JID'sini nasıl alırım?">
    Seçenek 1 (en hızlı): log'ları izleyin ve grupta bir test mesajı gönderin:

    ```bash
    openclaw logs --follow --json
    ```

    `@g.us` ile biten `chatId` (veya `from`) değerini arayın, örneğin:
    `1234567890-1234567890@g.us`.

    Seçenek 2 (zaten yapılandırılmış/allowlist'e alınmışsa): grupları yapılandırmadan listeleyin:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    Dokümanlar: [WhatsApp](/tr/channels/whatsapp), [Directory](/tr/cli/directory), [Log'lar](/tr/cli/logs).

  </Accordion>

  <Accordion title="OpenClaw neden bir grupta yanıt vermiyor?">
    İki yaygın neden:

    - Mention gating açık (varsayılan). Bota @mention yapmalısınız (veya `mentionPatterns` ile eşleşmelisiniz).
    - `channels.whatsapp.groups` yapılandırdınız ama `"*"` yok ve grup allowlist'e alınmamış.

    Bkz. [Gruplar](/tr/channels/groups) ve [Grup mesajları](/tr/channels/group-messages).

  </Accordion>

  <Accordion title="Gruplar/thread'ler DM'lerle bağlam paylaşır mı?">
    Doğrudan sohbetler varsayılan olarak ana oturuma daraltılır. Gruplar/kanallar kendi oturum anahtarlarına sahiptir ve Telegram konuları / Discord thread'leri ayrı oturumlardır. Bkz. [Gruplar](/tr/channels/groups) ve [Grup mesajları](/tr/channels/group-messages).
  </Accordion>

  <Accordion title="Kaç çalışma alanı ve agent oluşturabilirim?">
    Katı sınırlar yok. Onlarca (hatta yüzlerce) sorun değildir, ancak şunlara dikkat edin:

    - **Disk büyümesi:** oturumlar + transkriptler `~/.openclaw/agents/<agentId>/sessions/` altında bulunur.
    - **Token maliyeti:** daha fazla agent, daha fazla eşzamanlı model kullanımı demektir.
    - **Operasyon yükü:** agent başına auth profilleri, çalışma alanları ve kanal yönlendirme.

    İpuçları:

    - Agent başına bir **aktif** çalışma alanı tutun (`agents.defaults.workspace`).
    - Disk büyürse eski oturumları budayın (JSONL veya store girdilerini silin).
    - Sahipsiz çalışma alanlarını ve profil uyuşmazlıklarını bulmak için `openclaw doctor` kullanın.

  </Accordion>

  <Accordion title="Aynı anda birden fazla bot veya sohbet çalıştırabilir miyim (Slack) ve bunu nasıl kurmalıyım?">
    Evet. Birden fazla yalıtılmış ajan çalıştırmak ve gelen mesajları
    kanal/hesap/eş bazında yönlendirmek için **Çoklu Ajan Yönlendirme** kullanın. Slack bir kanal olarak desteklenir ve belirli ajanlara bağlanabilir.

    Tarayıcı erişimi güçlüdür ancak "bir insanın yapabildiği her şeyi yapar" anlamına gelmez; bot karşıtı önlemler, CAPTCHA'lar ve MFA
    otomasyonu yine de engelleyebilir. En güvenilir tarayıcı denetimi için ana makinede yerel Chrome MCP kullanın
    veya tarayıcıyı gerçekten çalıştıran makinede CDP kullanın.

    En iyi uygulama kurulumu:

    - Her zaman açık Gateway ana makinesi (VPS/Mac mini).
    - Rol başına bir ajan (bağlamalar).
    - Bu ajanlara bağlı Slack kanalları.
    - Gerektiğinde Chrome MCP veya bir düğüm üzerinden yerel tarayıcı.

    Belgeler: [Çoklu Ajan Yönlendirme](/tr/concepts/multi-agent), [Slack](/tr/channels/slack),
    [Tarayıcı](/tr/tools/browser), [Düğümler](/tr/nodes).

  </Accordion>
</AccordionGroup>

## Modeller, yük devretme ve kimlik doğrulama profilleri

Model Soru-Cevapları — varsayılanlar, seçim, takma adlar, geçiş, yük devretme, kimlik doğrulama profilleri —
[Modeller SSS](/tr/help/faq-models) sayfasında yer alır.

## Gateway: bağlantı noktaları, "zaten çalışıyor" ve uzak mod

<AccordionGroup>
  <Accordion title="Gateway hangi bağlantı noktasını kullanır?">
    `gateway.port`, WebSocket + HTTP (Control UI, hook'lar vb.) için tek çoğullanmış bağlantı noktasını denetler.

    Öncelik sırası:

    ```
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > default 18789
    ```

  </Accordion>

  <Accordion title='openclaw gateway status neden "Runtime: running" ama "Connectivity probe: failed" diyor?'>
    Çünkü "running", **gözetleyicinin** görünümüdür (launchd/systemd/schtasks). Bağlantı probu ise CLI'nin gerçekten Gateway WebSocket'e bağlanmasıdır.

    `openclaw gateway status` kullanın ve şu satırlara güvenin:

    - `Probe target:` (probun gerçekten kullandığı URL)
    - `Listening:` (bağlantı noktasında gerçekten bağlı olan şey)
    - `Last gateway error:` (süreç canlıyken ancak bağlantı noktası dinlemiyorken yaygın kök neden)

  </Accordion>

  <Accordion title='openclaw gateway status neden "Config (cli)" ve "Config (service)" değerlerini farklı gösteriyor?'>
    Hizmet başka bir dosyayla çalışırken siz başka bir yapılandırma dosyasını düzenliyorsunuz (genellikle `--profile` / `OPENCLAW_STATE_DIR` uyumsuzluğu).

    Düzeltme:

    ```bash
    openclaw gateway install --force
    ```

    Bunu hizmetin kullanmasını istediğiniz aynı `--profile` / ortamdan çalıştırın.

  </Accordion>

  <Accordion title='"another gateway instance is already listening" ne anlama gelir?'>
    OpenClaw, başlangıçta WebSocket dinleyicisini hemen bağlayarak bir çalışma zamanı kilidi uygular (varsayılan `ws://127.0.0.1:18789`). Bağlama `EADDRINUSE` ile başarısız olursa, başka bir örneğin zaten dinlediğini belirten `GatewayLockError` fırlatır.

    Düzeltme: diğer örneği durdurun, bağlantı noktasını serbest bırakın veya `openclaw gateway --port <port>` ile çalıştırın.

  </Accordion>

  <Accordion title="OpenClaw'ı uzak modda nasıl çalıştırırım (istemci başka yerdeki bir Gateway'e bağlanır)?">
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

    - `openclaw gateway` yalnızca `gateway.mode` `local` olduğunda (veya geçersiz kılma bayrağını geçirdiğinizde) başlar.
    - macOS uygulaması yapılandırma dosyasını izler ve bu değerler değiştiğinde modları canlı olarak değiştirir.
    - `gateway.remote.token` / `.password` yalnızca istemci tarafı uzak kimlik bilgileridir; tek başlarına yerel Gateway kimlik doğrulamasını etkinleştirmezler.

  </Accordion>

  <Accordion title='Control UI "unauthorized" diyor (veya sürekli yeniden bağlanıyor). Şimdi ne yapmalıyım?'>
    Gateway kimlik doğrulama yolunuz ile UI'nin kimlik doğrulama yöntemi eşleşmiyor.

    Gerçekler (koddan):

    - Control UI, geçerli tarayıcı sekmesi oturumu ve seçilen Gateway URL'si için belirteci `sessionStorage` içinde tutar; böylece aynı sekme yenilemeleri, uzun ömürlü localStorage belirteç kalıcılığını geri yüklemeden çalışmaya devam eder.
    - `AUTH_TOKEN_MISMATCH` durumunda, güvenilen istemciler Gateway yeniden deneme ipuçları döndürdüğünde (`canRetryWithDeviceToken=true`, `recommendedNextStep=retry_with_device_token`) önbelleğe alınmış bir cihaz belirteciyle sınırlandırılmış tek bir yeniden deneme girişiminde bulunabilir.
    - Bu önbelleğe alınmış belirteç yeniden denemesi artık cihaz belirteciyle birlikte depolanan önbelleğe alınmış onaylı kapsamları yeniden kullanır. Açık `deviceToken` / açık `scopes` çağıranları, önbelleğe alınmış kapsamları devralmak yerine istenen kapsam kümesini korumaya devam eder.
    - Bu yeniden deneme yolunun dışında, bağlantı kimlik doğrulama önceliği önce açık paylaşılan belirteç/parola, sonra açık `deviceToken`, sonra depolanan cihaz belirteci, sonra bootstrap belirtecidir.
    - Bootstrap belirteci kapsam denetimleri rol öneklidir. Yerleşik bootstrap operatör izin listesi yalnızca operatör isteklerini karşılar; node veya operatör olmayan diğer rollerin hâlâ kendi rol önekleri altında kapsamlara ihtiyacı vardır.

    Düzeltme:

    - En hızlısı: `openclaw dashboard` (pano URL'sini yazdırır + kopyalar, açmayı dener; başsızsa SSH ipucu gösterir).
    - Henüz belirteciniz yoksa: `openclaw doctor --generate-gateway-token`.
    - Uzaksa önce tünel açın: `ssh -N -L 18789:127.0.0.1:18789 user@host`, sonra `http://127.0.0.1:18789/` açın.
    - Paylaşılan gizli mod: `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` veya `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` ayarlayın, sonra eşleşen gizli değeri Control UI ayarlarına yapıştırın.
    - Tailscale Serve modu: `gateway.auth.allowTailscale` etkin olduğundan ve Tailscale kimlik başlıklarını atlayan ham bir loopback/tailnet URL'si değil, Serve URL'sini açtığınızdan emin olun.
    - Güvenilen proxy modu: ham bir Gateway URL'sinden değil, yapılandırılmış kimlik farkındalıklı proxy üzerinden geldiğinizden emin olun. Aynı ana makinedeki loopback proxy'leri için ayrıca `gateway.auth.trustedProxy.allowLoopback = true` gerekir.
    - Tek yeniden denemeden sonra uyumsuzluk sürerse eşlenmiş cihaz belirtecini döndürün/yeniden onaylayın:
      - `openclaw devices list`
      - `openclaw devices rotate --device <id> --role operator`
    - Bu döndürme çağrısı reddedildiğini söylüyorsa iki şeyi kontrol edin:
      - eşlenmiş cihaz oturumları, `operator.admin` yetkisine de sahip olmadıkları sürece yalnızca **kendi** cihazlarını döndürebilir
      - açık `--scope` değerleri, çağıranın geçerli operatör kapsamlarını aşamaz
    - Hâlâ takıldınız mı? `openclaw status --all` çalıştırın ve [Sorun Giderme](/tr/gateway/troubleshooting) adımlarını izleyin. Kimlik doğrulama ayrıntıları için [Pano](/tr/web/dashboard) sayfasına bakın.

  </Accordion>

  <Accordion title="gateway.bind tailnet ayarladım ancak bağlanamıyor ve hiçbir şey dinlemiyor">
    `tailnet` bağlaması, ağ arayüzlerinizden bir Tailscale IP'si seçer (100.64.0.0/10). Makine Tailscale üzerinde değilse (veya arayüz kapalıysa), bağlanacak hiçbir şey yoktur.

    Düzeltme:

    - Bu ana makinede Tailscale'i başlatın (böylece 100.x adresi olur) veya
    - `gateway.bind: "loopback"` / `"lan"` değerine geçin.

    Not: `tailnet` açıktır. `auto` loopback'i tercih eder; yalnızca tailnet bağlaması istediğinizde `gateway.bind: "tailnet"` kullanın.

  </Accordion>

  <Accordion title="Aynı ana makinede birden fazla Gateway çalıştırabilir miyim?">
    Genellikle hayır; bir Gateway birden fazla mesajlaşma kanalı ve ajan çalıştırabilir. Birden fazla Gateway'i yalnızca yedeklilik (ör. kurtarma botu) veya katı yalıtım gerektiğinde kullanın.

    Evet, ancak yalıtmanız gerekir:

    - `OPENCLAW_CONFIG_PATH` (örnek başına yapılandırma)
    - `OPENCLAW_STATE_DIR` (örnek başına durum)
    - `agents.defaults.workspace` (çalışma alanı yalıtımı)
    - `gateway.port` (benzersiz bağlantı noktaları)

    Hızlı kurulum (önerilir):

    - Her örnek için `openclaw --profile <name> ...` kullanın (`~/.openclaw-<name>` otomatik oluşturulur).
    - Her profil yapılandırmasında benzersiz bir `gateway.port` ayarlayın (veya elle çalıştırmalar için `--port` geçin).
    - Profil başına bir hizmet kurun: `openclaw --profile <name> gateway install`.

    Profiller hizmet adlarına da sonek ekler (`ai.openclaw.<profile>`; eski `com.openclaw.*`, `openclaw-gateway-<profile>.service`, `OpenClaw Gateway (<profile>)`).
    Tam kılavuz: [Birden fazla Gateway](/tr/gateway/multiple-gateways).

  </Accordion>

  <Accordion title='"invalid handshake" / code 1008 ne anlama gelir?'>
    Gateway bir **WebSocket sunucusudur** ve ilk mesajın
    bir `connect` çerçevesi olmasını bekler. Başka bir şey alırsa, bağlantıyı
    **code 1008** (ilke ihlali) ile kapatır.

    Yaygın nedenler:

    - Bir WS istemcisi yerine tarayıcıda **HTTP** URL'sini açtınız (`http://...`).
    - Yanlış bağlantı noktası veya yolu kullandınız.
    - Bir proxy veya tünel kimlik doğrulama başlıklarını çıkardı ya da Gateway olmayan bir istek gönderdi.

    Hızlı düzeltmeler:

    1. WS URL'sini kullanın: `ws://<host>:18789` (veya HTTPS ise `wss://...`).
    2. WS bağlantı noktasını normal bir tarayıcı sekmesinde açmayın.
    3. Kimlik doğrulama açıksa belirteci/parolayı `connect` çerçevesine ekleyin.

    CLI veya TUI kullanıyorsanız URL şöyle görünmelidir:

    ```
    openclaw tui --url ws://<host>:18789 --token <token>
    ```

    Protokol ayrıntıları: [Gateway protokolü](/tr/gateway/protocol).

  </Accordion>
</AccordionGroup>

## Günlükleme ve hata ayıklama

<AccordionGroup>
  <Accordion title="Günlükler nerede?">
    Dosya günlükleri (yapılandırılmış):

    ```
    /tmp/openclaw/openclaw-YYYY-MM-DD.log
    ```

    `logging.file` ile kararlı bir yol ayarlayabilirsiniz. Dosya günlük düzeyi `logging.level` ile denetlenir. Konsol ayrıntı düzeyi `--verbose` ve `logging.consoleLevel` ile denetlenir.

    En hızlı günlük izleme:

    ```bash
    openclaw logs --follow
    ```

    Hizmet/gözetleyici günlükleri (Gateway launchd/systemd üzerinden çalıştığında):

    - macOS: `$OPENCLAW_STATE_DIR/logs/gateway.log` ve `gateway.err.log` (varsayılan: `~/.openclaw/logs/...`; profiller `~/.openclaw-<profile>/logs/...` kullanır)
    - Linux: `journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`
    - Windows: `schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`

    Daha fazlası için [Sorun Giderme](/tr/gateway/troubleshooting) sayfasına bakın.

  </Accordion>

  <Accordion title="Gateway hizmetini nasıl başlatır/durdurur/yeniden başlatırım?">
    Gateway yardımcılarını kullanın:

    ```bash
    openclaw gateway status
    openclaw gateway restart
    ```

    Gateway'i elle çalıştırıyorsanız, `openclaw gateway --force` bağlantı noktasını geri alabilir. Bkz. [Gateway](/tr/gateway).

  </Accordion>

  <Accordion title="Windows'ta terminalimi kapattım; OpenClaw'ı nasıl yeniden başlatırım?">
    **İki Windows kurulum modu** vardır:

    **1) WSL2 (önerilir):** Gateway Linux içinde çalışır.

    PowerShell'i açın, WSL'ye girin, ardından yeniden başlatın:

    ```powershell
    wsl
    openclaw gateway status
    openclaw gateway restart
    ```

    Hizmeti hiç kurmadıysanız ön planda başlatın:

    ```bash
    openclaw gateway run
    ```

    **2) Yerel Windows (önerilmez):** Gateway doğrudan Windows içinde çalışır.

    PowerShell'i açın ve çalıştırın:

    ```powershell
    openclaw gateway status
    openclaw gateway restart
    ```

    Elle çalıştırıyorsanız (hizmet yoksa) şunu kullanın:

    ```powershell
    openclaw gateway run
    ```

    Belgeler: [Windows (WSL2)](/tr/platforms/windows), [Gateway hizmet çalıştırma kılavuzu](/tr/gateway).

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

    - Model kimlik doğrulaması **gateway host** üzerinde yüklenmemiş (kontrol için `models status`).
    - Kanal eşlemesi/izin listesi yanıtları engelliyor (kanal yapılandırmasını + günlükleri kontrol edin).
    - WebChat/Pano doğru belirteç olmadan açık.

    Uzakta iseniz tünel/Tailscale bağlantısının açık olduğunu ve
    Gateway WebSocket'e erişilebildiğini doğrulayın.

    Belgeler: [Kanallar](/tr/channels), [Sorun Giderme](/tr/gateway/troubleshooting), [Uzak erişim](/tr/gateway/remote).

  </Accordion>

  <Accordion title='"Disconnected from gateway: no reason" - şimdi ne yapmalı?'>
    Bu genellikle UI'nin WebSocket bağlantısını kaybettiği anlamına gelir. Kontrol edin:

    1. Gateway çalışıyor mu? `openclaw gateway status`
    2. Gateway sağlıklı mı? `openclaw status`
    3. UI doğru token'a sahip mi? `openclaw dashboard`
    4. Uzaksa, tünel/Tailscale bağlantısı açık mı?

    Ardından günlükleri izle:

    ```bash
    openclaw logs --follow
    ```

    Belgeler: [Pano](/tr/web/dashboard), [Uzaktan erişim](/tr/gateway/remote), [Sorun giderme](/tr/gateway/troubleshooting).

  </Accordion>

  <Accordion title="Telegram setMyCommands başarısız oluyor. Neyi kontrol etmeliyim?">
    Günlükler ve kanal durumuyla başlayın:

    ```bash
    openclaw channels status
    openclaw channels logs --channel telegram
    ```

    Ardından hatayı eşleştirin:

    - `BOT_COMMANDS_TOO_MUCH`: Telegram menüsünde çok fazla giriş var. OpenClaw zaten Telegram sınırına göre kırpar ve daha az komutla yeniden dener, ancak bazı menü girişlerinin yine de kaldırılması gerekir. Plugin/beceri/özel komutları azaltın veya menüye ihtiyacınız yoksa `channels.telegram.commands.native` seçeneğini devre dışı bırakın.
    - `TypeError: fetch failed`, `Network request for 'setMyCommands' failed!` veya benzer ağ hataları: Bir VPS üzerindeyseniz ya da bir proxy arkasındaysanız, giden HTTPS'e izin verildiğini ve `api.telegram.org` için DNS'in çalıştığını doğrulayın.

    Gateway uzaksa, Gateway hostundaki günlüklere baktığınızdan emin olun.

    Belgeler: [Telegram](/tr/channels/telegram), [Kanal sorun giderme](/tr/channels/troubleshooting).

  </Accordion>

  <Accordion title="TUI çıktı göstermiyor. Neyi kontrol etmeliyim?">
    Önce Gateway'e erişilebildiğini ve aracının çalışabildiğini doğrulayın:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    TUI içinde geçerli durumu görmek için `/status` kullanın. Bir sohbet
    kanalında yanıt bekliyorsanız teslimatın etkin olduğundan emin olun (`/deliver on`).

    Belgeler: [TUI](/tr/web/tui), [Eğik çizgi komutları](/tr/tools/slash-commands).

  </Accordion>

  <Accordion title="Gateway'i tamamen durdurup sonra nasıl başlatırım?">
    Hizmeti kurduysanız:

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    Bu, **denetimli hizmeti** durdurur/başlatır (macOS'te launchd, Linux'ta systemd).
    Gateway arka planda daemon olarak çalıştığında bunu kullanın.

    Ön planda çalıştırıyorsanız Ctrl-C ile durdurun, ardından:

    ```bash
    openclaw gateway run
    ```

    Belgeler: [Gateway hizmet çalıştırma kılavuzu](/tr/gateway).

  </Accordion>

  <Accordion title="Beş yaşındaymışım gibi anlat: openclaw gateway restart ve openclaw gateway">
    - `openclaw gateway restart`: **arka plan hizmetini** yeniden başlatır (launchd/systemd).
    - `openclaw gateway`: bu terminal oturumu için Gateway'i **ön planda** çalıştırır.

    Hizmeti kurduysanız gateway komutlarını kullanın. Tek seferlik, ön plan çalıştırması
    istediğinizde `openclaw gateway` kullanın.

  </Accordion>

  <Accordion title="Bir şey başarısız olduğunda daha fazla ayrıntı almanın en hızlı yolu">
    Daha fazla konsol ayrıntısı almak için Gateway'i `--verbose` ile başlatın. Ardından kanal kimlik doğrulaması, model yönlendirme ve RPC hataları için günlük dosyasını inceleyin.
  </Accordion>
</AccordionGroup>

## Medya ve ekler

<AccordionGroup>
  <Accordion title="Becerim bir görüntü/PDF oluşturdu, ancak hiçbir şey gönderilmedi">
    Aracıdan giden ekler, kendi satırında bir `MEDIA:<path-or-url>` satırı içermelidir. Bkz. [OpenClaw asistan kurulumu](/tr/start/openclaw) ve [Aracı gönderimi](/tr/tools/agent-send).

    CLI ile gönderme:

    ```bash
    openclaw message send --target +15555550123 --message "Here you go" --media /path/to/file.png
    ```

    Şunları da kontrol edin:

    - Hedef kanal giden medyayı destekliyor ve izin listeleri tarafından engellenmiyor.
    - Dosya, sağlayıcının boyut sınırları içinde (görüntüler en fazla 2048px olacak şekilde yeniden boyutlandırılır).
    - `tools.fs.workspaceOnly=true`, yerel yol gönderimlerini çalışma alanı, temp/media-store ve sandbox tarafından doğrulanmış dosyalarla sınırlı tutar.
    - `tools.fs.workspaceOnly=false`, `MEDIA:` ile aracının zaten okuyabildiği host-yerel dosyaların gönderilmesine izin verir, ancak yalnızca medya ve güvenli belge türleri için (görüntüler, ses, video, PDF ve Office belgeleri). Düz metin ve gizli bilgiye benzeyen dosyalar yine de engellenir.

    Bkz. [Görüntüler](/tr/nodes/images).

  </Accordion>
</AccordionGroup>

## Güvenlik ve erişim denetimi

<AccordionGroup>
  <Accordion title="OpenClaw'ı gelen DM'lere açmak güvenli mi?">
    Gelen DM'leri güvenilmeyen girdi olarak ele alın. Varsayılanlar riski azaltmak üzere tasarlanmıştır:

    - DM destekleyen kanallarda varsayılan davranış **eşleştirme**dir:
      - Bilinmeyen gönderenler bir eşleştirme kodu alır; bot mesajlarını işlemez.
      - Şununla onaylayın: `openclaw pairing approve --channel <channel> [--account <id>] <code>`
      - Bekleyen istekler **kanal başına 3** ile sınırlıdır; bir kod gelmediyse `openclaw pairing list --channel <channel> [--account <id>]` komutunu kontrol edin.
    - DM'leri herkese açık hale getirmek açıkça katılım gerektirir (`dmPolicy: "open"` ve izin listesi `"*"`).

    Riskli DM ilkelerini ortaya çıkarmak için `openclaw doctor` çalıştırın.

  </Accordion>

  <Accordion title="Komut istemi enjeksiyonu yalnızca herkese açık botlar için mi sorun?">
    Hayır. Komut istemi enjeksiyonu, yalnızca bota kimin DM gönderebildiğiyle değil, **güvenilmeyen içerikle** ilgilidir.
    Asistanınız harici içerik okuyorsa (web arama/getirme, tarayıcı sayfaları, e-postalar,
    belgeler, ekler, yapıştırılan günlükler), bu içerik modeli ele geçirmeye çalışan
    talimatlar içerebilir. Bu, **tek gönderen siz olsanız** bile gerçekleşebilir.

    En büyük risk araçlar etkin olduğundadır: model, bağlamı dışarı sızdırmaya veya sizin adınıza
    araç çağırmaya kandırılabilir. Etki alanını azaltmak için:

    - güvenilmeyen içeriği özetlemek üzere salt okunur veya araçları devre dışı bırakılmış bir "okuyucu" aracı kullanın
    - araçları etkin aracılar için `web_search` / `web_fetch` / `browser` kapalı tutun
    - çözümlenen dosya/belge metnini de güvenilmeyen olarak ele alın: OpenResponses
      `input_file` ve medya eki çıkarma işlemi, ham dosya metnini geçirmek yerine çıkarılan metni
      açık harici içerik sınır işaretçileriyle sarar
    - sandbox ve katı araç izin listeleri kullanın

    Ayrıntılar: [Güvenlik](/tr/gateway/security).

  </Accordion>

  <Accordion title="Botumun kendi e-postası, GitHub hesabı veya telefon numarası olmalı mı?">
    Evet, çoğu kurulum için. Botu ayrı hesaplar ve telefon numaralarıyla yalıtmak,
    bir şey ters giderse etki alanını azaltır. Bu ayrıca kişisel hesaplarınızı etkilemeden
    kimlik bilgilerini döndürmeyi veya erişimi iptal etmeyi kolaylaştırır.

    Küçük başlayın. Yalnızca gerçekten ihtiyacınız olan araçlara ve hesaplara erişim verin, gerekirse
    daha sonra genişletin.

    Belgeler: [Güvenlik](/tr/gateway/security), [Eşleştirme](/tr/channels/pairing).

  </Accordion>

  <Accordion title="Metin mesajlarım üzerinde ona özerklik verebilir miyim ve bu güvenli mi?">
    Kişisel mesajlarınız üzerinde tam özerklik önermiyoruz. En güvenli kalıp şudur:

    - DM'leri **eşleştirme modunda** veya dar bir izin listesinde tutun.
    - Sizin adınıza mesaj göndermesini istiyorsanız **ayrı bir numara veya hesap** kullanın.
    - Taslak oluşturmasına izin verin, ardından **göndermeden önce onaylayın**.

    Denemek istiyorsanız bunu ayrılmış bir hesapta yapın ve yalıtılmış tutun. Bkz.
    [Güvenlik](/tr/gateway/security).

  </Accordion>

  <Accordion title="Kişisel asistan görevleri için daha ucuz modeller kullanabilir miyim?">
    Evet, aracının yalnızca sohbet yaptığı ve girdinin güvenilir olduğu durumda. Daha küçük katmanlar
    talimat ele geçirmeye daha yatkındır, bu nedenle araçları etkin aracılar
    veya güvenilmeyen içerik okunurken bunlardan kaçının. Daha küçük bir model kullanmanız gerekiyorsa
    araçları kilitleyin ve sandbox içinde çalıştırın. Bkz. [Güvenlik](/tr/gateway/security).
  </Accordion>

  <Accordion title="Telegram'da /start çalıştırdım ama eşleştirme kodu almadım">
    Eşleştirme kodları **yalnızca** bilinmeyen bir gönderen bota mesaj gönderdiğinde ve
    `dmPolicy: "pairing"` etkin olduğunda gönderilir. `/start` tek başına kod oluşturmaz.

    Bekleyen istekleri kontrol edin:

    ```bash
    openclaw pairing list telegram
    ```

    Hemen erişim istiyorsanız gönderen kimliğinizi izin listesine ekleyin veya o hesap için `dmPolicy: "open"`
    ayarlayın.

  </Accordion>

  <Accordion title="WhatsApp: kişilerime mesaj gönderir mi? Eşleştirme nasıl çalışır?">
    Hayır. Varsayılan WhatsApp DM ilkesi **eşleştirme**dir. Bilinmeyen gönderenler yalnızca bir eşleştirme kodu alır ve mesajları **işlenmez**. OpenClaw yalnızca aldığı sohbetlere veya sizin tetiklediğiniz açık gönderimlere yanıt verir.

    Eşleştirmeyi şununla onaylayın:

    ```bash
    openclaw pairing approve whatsapp <code>
    ```

    Bekleyen istekleri listeleyin:

    ```bash
    openclaw pairing list whatsapp
    ```

    Sihirbaz telefon numarası istemi: kendi DM'lerinize izin verilmesi için **izin listenizi/sahibinizi** ayarlamak amacıyla kullanılır. Otomatik gönderim için kullanılmaz. Kişisel WhatsApp numaranızda çalıştırıyorsanız o numarayı kullanın ve `channels.whatsapp.selfChatMode` seçeneğini etkinleştirin.

  </Accordion>
</AccordionGroup>

## Sohbet komutları, görevleri durdurma ve "durmuyor"

<AccordionGroup>
  <Accordion title="İç sistem mesajlarının sohbette görünmesini nasıl durdururum?">
    Çoğu iç veya araç mesajı yalnızca o oturum için **verbose**, **trace** veya **reasoning** etkin olduğunda
    görünür.

    Gördüğünüz sohbette düzeltin:

    ```
    /verbose off
    /trace off
    /reasoning off
    ```

    Hâlâ gürültülüyse Control UI içindeki oturum ayarlarını kontrol edin ve verbose değerini
    **inherit** olarak ayarlayın. Ayrıca yapılandırmada `verboseDefault` değeri
    `on` olarak ayarlanmış bir bot profili kullanmadığınızı doğrulayın.

    Belgeler: [Düşünme ve verbose](/tr/tools/thinking), [Güvenlik](/tr/gateway/security#reasoning-verbose-output-in-groups).

  </Accordion>

  <Accordion title="Çalışan bir görevi nasıl durdurur/iptal ederim?">
    Bunlardan herhangi birini **tek başına mesaj** olarak gönderin (eğik çizgi yok):

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

    Bunlar durdurma tetikleyicileridir (eğik çizgi komutları değil).

    Arka plan işlemleri için (exec aracından), aracıdan şunu çalıştırmasını isteyebilirsiniz:

    ```
    process action:kill sessionId:XXX
    ```

    Eğik çizgi komutlarına genel bakış: bkz. [Eğik çizgi komutları](/tr/tools/slash-commands).

    Çoğu komut `/` ile başlayan **tek başına** mesaj olarak gönderilmelidir, ancak birkaç kısayol (`/status` gibi) izin listesindeki gönderenler için satır içinde de çalışır.

  </Accordion>

  <Accordion title='Telegram’dan Discord mesajı nasıl gönderirim? ("Bağlamlar arası mesajlaşma reddedildi")'>
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

  <Accordion title='Bot neden hızlı arka arkaya gelen mesajları "yok sayıyor" gibi hissettiriyor?'>
    Kuyruk modu, yeni mesajların sürmekte olan bir çalıştırmayla nasıl etkileşime gireceğini kontrol eder. Modları değiştirmek için `/queue` kullanın:

    - `steer` - geçerli çalıştırmadaki bir sonraki model sınırı için bekleyen tüm yönlendirmeleri kuyruğa alır
    - `queue` - eski, teker teker yönlendirme
    - `followup` - mesajları teker teker çalıştırır
    - `collect` - mesajları toplar ve bir kez yanıtlar
    - `steer-backlog` - şimdi yönlendirir, ardından birikmiş işleri işler
    - `interrupt` - geçerli çalıştırmayı iptal eder ve baştan başlar

    Varsayılan mod `steer`'dır. Takip modları için `debounce:0.5s cap:25 drop:summarize` gibi seçenekler ekleyebilirsiniz. Bkz. [Komut kuyruğu](/tr/concepts/queue) ve [Yönlendirme kuyruğu](/tr/concepts/queue-steering).

  </Accordion>
</AccordionGroup>

## Çeşitli

<AccordionGroup>
  <Accordion title='Anthropic için API anahtarıyla varsayılan model nedir?'>
    OpenClaw'da kimlik bilgileri ve model seçimi ayrıdır. `ANTHROPIC_API_KEY` ayarlamak (veya kimlik doğrulama profillerinde bir Anthropic API anahtarı saklamak) kimlik doğrulamayı etkinleştirir, ancak gerçek varsayılan model `agents.defaults.model.primary` içinde yapılandırdığınız modeldir (örneğin, `anthropic/claude-sonnet-4-6` veya `anthropic/claude-opus-4-6`). `No credentials found for profile "anthropic:default"` görürseniz, bu, Gateway'in çalışan aracı için beklenen `auth-profiles.json` içinde Anthropic kimlik bilgilerini bulamadığı anlamına gelir.
  </Accordion>
</AccordionGroup>

---

Hâlâ takıldınız mı? [Discord](https://discord.com/invite/clawd) üzerinden sorun veya bir [GitHub tartışması](https://github.com/openclaw/openclaw/discussions) açın.

## İlgili

- [İlk çalıştırma SSS](/tr/help/faq-first-run) — kurulum, ilk kullanım, kimlik doğrulama, abonelikler, erken hatalar
- [Modeller SSS](/tr/help/faq-models) — model seçimi, yük devretme, kimlik doğrulama profilleri
- [Sorun giderme](/tr/help/troubleshooting) — belirti odaklı triyaj
