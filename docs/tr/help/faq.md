---
read_when:
    - Yaygın kurulum, yükleme, ilk kullanım veya çalışma zamanı destek sorularını yanıtlama
    - Daha derin hata ayıklamadan önce kullanıcıların bildirdiği sorunları önceliklendirme
summary: OpenClaw kurulumu, yapılandırması ve kullanımı hakkında sık sorulan sorular
title: SSS
x-i18n:
    generated_at: "2026-05-06T17:56:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8d5724af921ab660da3d4453779f269bda440fb27518638541312e489f203318
    source_path: help/faq.md
    workflow: 16
---

Gerçek dünya kurulumları (yerel geliştirme, VPS, çok ajanlı, OAuth/API anahtarları, model yedeklemeye geçişi) için hızlı yanıtlar ve daha derin sorun giderme. Çalışma zamanı tanılamaları için bkz. [Sorun giderme](/tr/gateway/troubleshooting). Tam yapılandırma referansı için bkz. [Yapılandırma](/tr/gateway/configuration).

## Bir şey bozulduysa ilk 60 saniye

1. **Hızlı durum (ilk kontrol)**

   ```bash
   openclaw status
   ```

   Hızlı yerel özet: OS + güncelleme, gateway/hizmet erişilebilirliği, ajanlar/oturumlar, sağlayıcı yapılandırması + çalışma zamanı sorunları (Gateway erişilebilir olduğunda).

2. **Yapıştırılabilir rapor (paylaşması güvenli)**

   ```bash
   openclaw status --all
   ```

   Günlük sonu ile salt okunur tanılama (token’lar maskelenir).

3. **Daemon + bağlantı noktası durumu**

   ```bash
   openclaw gateway status
   ```

   Supervisor çalışma zamanı ile RPC erişilebilirliğini, yoklama hedef URL’sini ve hizmetin muhtemelen hangi yapılandırmayı kullandığını gösterir.

4. **Derin yoklamalar**

   ```bash
   openclaw status --deep
   ```

   Desteklendiğinde kanal yoklamaları dahil canlı Gateway sağlık yoklaması çalıştırır
   (erişilebilir bir Gateway gerektirir). Bkz. [Sağlık](/tr/gateway/health).

5. **En son günlüğü takip et**

   ```bash
   openclaw logs --follow
   ```

   RPC kapalıysa şuna geri dönün:

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   Dosya günlükleri hizmet günlüklerinden ayrıdır; bkz. [Günlük Kaydı](/tr/logging) ve [Sorun Giderme](/tr/gateway/troubleshooting).

6. **Doctor’ı çalıştır (onarımlar)**

   ```bash
   openclaw doctor
   ```

   Yapılandırmayı/durumu onarır/taşır + sağlık kontrollerini çalıştırır. Bkz. [Doctor](/tr/gateway/doctor).

7. **Gateway anlık görüntüsü**

   ```bash
   openclaw health --json
   openclaw health --verbose   # hatalarda hedef URL'yi + yapılandırma yolunu gösterir
   ```

   Çalışan gateway'den tam bir anlık görüntü ister (yalnızca WS). Bkz. [Health](/tr/gateway/health).

## Hızlı başlangıç ve ilk çalıştırma kurulumu

İlk çalıştırma SSS'si — kurulum, ilk katılım, kimlik doğrulama rotaları, abonelikler, ilk hatalar —
[İlk çalıştırma SSS'sinde](/tr/help/faq-first-run) bulunur.

## OpenClaw nedir?

<AccordionGroup>
  <Accordion title="OpenClaw tek paragrafta nedir?">
    OpenClaw, kendi cihazlarınızda çalıştırdığınız kişisel bir yapay zeka asistanıdır. Zaten kullandığınız mesajlaşma yüzeylerinde (WhatsApp, Telegram, Slack, Mattermost, Discord, Google Chat, Signal, iMessage, WebChat ve QQ Bot gibi paketle gelen kanal Plugin'leri) yanıt verir ve desteklenen platformlarda ses + canlı Canvas da sunabilir. **Gateway** her zaman açık olan kontrol düzlemidir; ürün ise asistandır.
  </Accordion>

  <Accordion title="Değer önerisi">
    OpenClaw "yalnızca bir Claude sarmalayıcısı" değildir. Zaten kullandığınız sohbet uygulamalarından erişilebilen, **kendi donanımınızda** yetenekli bir asistan çalıştırmanızı sağlayan, durum tutan oturumlar, bellek ve araçlar sunan **yerel öncelikli bir kontrol düzlemidir** - iş akışlarınızın denetimini barındırılan bir SaaS'a devretmeden.

    Öne çıkanlar:

    - **Cihazlarınız, verileriniz:** Gateway'i istediğiniz yerde çalıştırın (Mac, Linux, VPS) ve çalışma alanını + oturum geçmişini yerelde tutun.
    - **Web sandbox değil, gerçek kanallar:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage/vb. ve desteklenen platformlarda mobil ses ve Canvas.
    - **Modelden bağımsız:** aracı başına yönlendirme ve yük devretme ile Anthropic, OpenAI, MiniMax, OpenRouter vb. kullanın.
    - **Yalnızca yerel seçeneği:** isterseniz **tüm veriler cihazınızda kalabilsin** diye yerel modeller çalıştırın.
    - **Çoklu aracı yönlendirme:** her biri kendi çalışma alanına ve varsayılanlarına sahip olacak şekilde kanal, hesap veya görev başına ayrı aracılar.
    - **Açık kaynak ve değiştirilebilir:** tedarikçi kilidine takılmadan inceleyin, genişletin ve kendi ortamınızda barındırın.

    Dokümanlar: [Gateway](/tr/gateway), [Kanallar](/tr/channels), [Çoklu aracı](/tr/concepts/multi-agent),
    [Bellek](/tr/concepts/memory).

  </Accordion>

  <Accordion title="Yeni kurdum - ilk olarak ne yapmalıyım?">
    İyi ilk projeler:

    - Bir web sitesi oluşturun (WordPress, Shopify veya basit bir statik site).
    - Bir mobil uygulama prototipi hazırlayın (taslak, ekranlar, API planı).
    - Dosya ve klasörleri düzenleyin (temizlik, adlandırma, etiketleme).
    - Gmail'i bağlayın ve özetleri veya takipleri otomatikleştirin.

    Büyük görevleri yönetebilir, ancak bunları aşamalara böldüğünüzde ve
    paralel çalışma için alt aracılar kullandığınızda en iyi sonucu verir.

  </Accordion>

  <Accordion title="OpenClaw için günlük en önemli beş kullanım alanı nedir?">
    Günlük kazanımlar genellikle şöyle görünür:

    - **Kişisel özetler:** gelen kutusu, takvim ve ilgilendiğiniz haberlerin özetleri.
    - **Araştırma ve taslak hazırlama:** e-postalar veya dokümanlar için hızlı araştırma, özetler ve ilk taslaklar.
    - **Hatırlatıcılar ve takipler:** Cron veya Heartbeat ile tetiklenen dürtmeler ve kontrol listeleri.
    - **Tarayıcı otomasyonu:** form doldurma, veri toplama ve web görevlerini tekrarlama.
    - **Cihazlar arası koordinasyon:** telefonunuzdan bir görev gönderin, Gateway'in bunu bir sunucuda çalıştırmasını sağlayın ve sonucu sohbette geri alın.

  </Accordion>

  <Accordion title="OpenClaw bir SaaS için müşteri adayı oluşturma, erişim, reklamlar ve bloglarda yardımcı olabilir mi?">
    **Araştırma, nitelendirme ve taslak hazırlama** için evet. Siteleri tarayabilir, kısa listeler oluşturabilir,
    potansiyel müşterileri özetleyebilir ve erişim ya da reklam metni taslakları yazabilir.

    **Erişim veya reklam çalışmaları** için süreçte bir insan bulundurun. Spam'den kaçının, yerel yasalara ve
    platform politikalarına uyun ve gönderilmeden önce her şeyi gözden geçirin. En güvenli model,
    OpenClaw'ın taslak hazırlaması ve sizin onaylamanızdır.

    Dokümanlar: [Güvenlik](/tr/gateway/security).

  </Accordion>

  <Accordion title="Web geliştirme için Claude Code'a göre avantajları nelerdir?">
    OpenClaw bir **kişisel asistan** ve koordinasyon katmanıdır, IDE yerine geçmez. Bir repo içinde en hızlı doğrudan kodlama döngüsü için
    Claude Code veya Codex kullanın. Kalıcı bellek, cihazlar arası erişim ve araç orkestrasyonu istediğinizde
    OpenClaw kullanın.

    Avantajlar:

    - Oturumlar arasında **kalıcı bellek + çalışma alanı**
    - **Çok platformlu erişim** (WhatsApp, Telegram, TUI, WebChat)
    - **Araç orkestrasyonu** (tarayıcı, dosyalar, zamanlama, hook'lar)
    - **Her zaman açık Gateway** (bir VPS üzerinde çalıştırın, her yerden etkileşim kurun)
    - Yerel tarayıcı/ekran/kamera/exec için **Node'lar**

    Vitrin: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills ve otomasyon

<AccordionGroup>
  <Accordion title="Repoyu kirli tutmadan skills'leri nasıl özelleştiririm?">
    Repo kopyasını düzenlemek yerine yönetilen geçersiz kılmaları kullanın. Değişikliklerinizi `~/.openclaw/skills/<name>/SKILL.md` içine koyun (veya `~/.openclaw/openclaw.json` içinde `skills.load.extraDirs` ile bir klasör ekleyin). Öncelik sırası `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → paketle gelenler → `skills.load.extraDirs` şeklindedir; bu nedenle yönetilen geçersiz kılmalar, git'e dokunmadan paketle gelen skills'lerin önüne geçer. Skill'in global olarak yüklenmesi gerekiyor ama yalnızca bazı ajanlara görünmesi isteniyorsa, paylaşılan kopyayı `~/.openclaw/skills` içinde tutun ve görünürlüğü `agents.defaults.skills` ve `agents.list[].skills` ile kontrol edin. Yalnızca upstream'e uygun düzenlemeler repoda yaşamalı ve PR olarak gönderilmelidir.
  </Accordion>

  <Accordion title="Skills'leri özel bir klasörden yükleyebilir miyim?">
    Evet. `~/.openclaw/openclaw.json` içinde `skills.load.extraDirs` aracılığıyla ek dizinler ekleyin (en düşük öncelik). Varsayılan öncelik sırası `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → paketle gelenler → `skills.load.extraDirs` şeklindedir. `clawhub` varsayılan olarak `./skills` içine yükler; OpenClaw bunu sonraki oturumda `<workspace>/skills` olarak değerlendirir. Skill yalnızca belirli ajanlara görünmeliyse, bunu `agents.defaults.skills` veya `agents.list[].skills` ile eşleştirin.
  </Accordion>

  <Accordion title="Farklı görevler için farklı modelleri nasıl kullanabilirim?">
    Bugün desteklenen modeller şunlardır:

    - **Cron işleri**: yalıtılmış işler, iş başına bir `model` geçersiz kılması ayarlayabilir.
    - **Alt ajanlar**: görevleri farklı varsayılan modellere sahip ayrı ajanlara yönlendirin.
    - **İsteğe bağlı geçiş**: geçerli oturum modelini istediğiniz zaman değiştirmek için `/model` kullanın.

    Bkz. [Cron işleri](/tr/automation/cron-jobs), [Çoklu Ajan Yönlendirme](/tr/concepts/multi-agent) ve [Slash komutları](/tr/tools/slash-commands).

  </Accordion>

  <Accordion title="Bot ağır iş yaparken donuyor. Bunu nasıl dışarı aktarırım?">
    Uzun veya paralel görevler için **alt ajanlar** kullanın. Alt ajanlar kendi oturumlarında çalışır,
    bir özet döndürür ve ana sohbetinizi yanıt verebilir durumda tutar.

    Botunuzdan "bu görev için bir alt ajan oluşturmasını" isteyin veya `/subagents` kullanın.
    Gateway'in şu anda ne yaptığını (ve meşgul olup olmadığını) görmek için sohbette `/status` kullanın.

    Token ipucu: uzun görevler ve alt ajanlar ikisi de token tüketir. Maliyet bir sorunsa,
    `agents.defaults.subagents.model` aracılığıyla alt ajanlar için daha ucuz bir model ayarlayın.

    Dokümanlar: [Alt ajanlar](/tr/tools/subagents), [Arka Plan Görevleri](/tr/automation/tasks).

  </Accordion>

  <Accordion title="Discord'da iş parçacığına bağlı alt ajan oturumları nasıl çalışır?">
    İş parçacığı bağlamalarını kullanın. Bir Discord iş parçacığını bir alt ajana veya oturum hedefine bağlayabilirsiniz; böylece o iş parçacığındaki takip mesajları bağlı oturumda kalır.

    Temel akış:

    - `thread: true` kullanarak `sessions_spawn` ile oluşturun (ve kalıcı takip için isteğe bağlı olarak `mode: "session"` kullanın).
    - Ya da `/focus <target>` ile elle bağlayın.
    - Bağlama durumunu incelemek için `/agents` kullanın.
    - Otomatik odaktan çıkarmayı kontrol etmek için `/session idle <duration|off>` ve `/session max-age <duration|off>` kullanın.
    - İş parçacığını ayırmak için `/unfocus` kullanın.

    Gerekli yapılandırma:

    - Global varsayılanlar: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
    - Discord geçersiz kılmaları: `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours`.
    - Oluşturma sırasında otomatik bağlama: `channels.discord.threadBindings.spawnSessions` varsayılan olarak `true` değerindedir; iş parçacığına bağlı oturum oluşturmayı devre dışı bırakmak için bunu `false` olarak ayarlayın.

    Dokümanlar: [Alt ajanlar](/tr/tools/subagents), [Discord](/tr/channels/discord), [Yapılandırma Başvurusu](/tr/gateway/configuration-reference), [Slash komutları](/tr/tools/slash-commands).

  </Accordion>

  <Accordion title="Bir alt ajan tamamlandı, ancak tamamlanma güncellemesi yanlış yere gitti veya hiç gönderilmedi. Neyi kontrol etmeliyim?">
    Önce çözümlenen istek sahibi rotasını kontrol edin:

    - Tamamlanma modundaki alt ajan teslimi, mevcut olduğunda bağlı iş parçacığını veya konuşma rotasını tercih eder.
    - Tamamlanma kaynağı yalnızca bir kanal taşıyorsa, OpenClaw doğrudan teslimin yine de başarılı olabilmesi için istek sahibi oturumunun saklanan rotasına (`lastChannel` / `lastTo` / `lastAccountId`) geri döner.
    - Ne bağlı bir rota ne de kullanılabilir saklanan bir rota varsa, doğrudan teslim başarısız olabilir ve sonuç sohbete hemen gönderilmek yerine kuyruktaki oturum teslimine geri döner.
    - Geçersiz veya eski hedefler yine de kuyruk geri dönüşünü ya da nihai teslim hatasını zorlayabilir.
    - Çocuğun son görünür asistan yanıtı tam olarak sessiz token `NO_REPLY` / `no_reply` ya da tam olarak `ANNOUNCE_SKIP` ise, OpenClaw eski daha önceki ilerlemeyi göndermek yerine duyuruyu bilerek bastırır.
    - Çocuk yalnızca araç çağrılarından sonra zaman aşımına uğradıysa, duyuru ham araç çıktısını yeniden oynatmak yerine bunu kısa bir kısmi ilerleme özetine indirebilir.

    Hata ayıklama:

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    Dokümanlar: [Alt ajanlar](/tr/tools/subagents), [Arka Plan Görevleri](/tr/automation/tasks), [Oturum Araçları](/tr/concepts/session-tool).

  </Accordion>

  <Accordion title="Cron veya hatırlatıcılar tetiklenmiyor. Neyi kontrol etmeliyim?">
    Cron, Gateway sürecinin içinde çalışır. Gateway sürekli çalışmıyorsa,
    zamanlanmış işler çalışmaz.

    Kontrol listesi:

    - Cron'un etkin olduğunu (`cron.enabled`) ve `OPENCLAW_SKIP_CRON` ayarlı olmadığını doğrulayın.
    - Gateway'in 24/7 çalıştığını kontrol edin (uyku/yeniden başlatma yok).
    - İş için saat dilimi ayarlarını doğrulayın (`--tz` ile ana makine saat dilimi karşılaştırması).

    Hata ayıklama:

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    Dokümanlar: [Cron işleri](/tr/automation/cron-jobs), [Otomasyon ve Görevler](/tr/automation).

  </Accordion>

  <Accordion title="Cron çalıştı, ancak kanala hiçbir şey gönderilmedi. Neden?">
    Önce teslim modunu kontrol edin:

    - `--no-deliver` / `delivery.mode: "none"` runner yedek gönderiminin beklenmediği anlamına gelir.
    - Eksik veya geçersiz duyuru hedefi (`channel` / `to`), runner'ın giden teslimatı atladığı anlamına gelir.
    - Kanal kimlik doğrulama hataları (`unauthorized`, `Forbidden`), runner'ın teslim etmeye çalıştığı ancak kimlik bilgilerinin bunu engellediği anlamına gelir.
    - Sessiz bir yalıtılmış sonuç (yalnızca `NO_REPLY` / `no_reply`), bilerek teslim edilemez olarak değerlendirilir; bu nedenle runner sıraya alınmış yedek teslimatı da bastırır.

    Yalıtılmış Cron işleri için, bir sohbet rotası kullanılabiliyorsa agent yine de `message`
    aracıyla doğrudan gönderebilir. `--announce` yalnızca agent'ın zaten göndermediği
    son metin için runner yedek yolunu denetler.

    Hata ayıklama:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Belgeler: [Cron işleri](/tr/automation/cron-jobs), [Arka Plan Görevleri](/tr/automation/tasks).

  </Accordion>

  <Accordion title="Yalıtılmış bir Cron çalıştırması neden model değiştirdi veya bir kez yeniden denedi?">
    Bu genellikle yinelenen zamanlama değil, canlı model değiştirme yoludur.

    Yalıtılmış Cron, etkin çalıştırma `LiveSessionModelSwitchError` fırlattığında
    çalışma zamanı model devrini kalıcı hale getirip yeniden deneyebilir. Yeniden deneme,
    değiştirilen provider/model değerini korur; geçiş yeni bir auth profile override
    taşıyorsa Cron yeniden denemeden önce bunu da kalıcı hale getirir.

    İlgili seçim kuralları:

    - Uygulanabiliyorsa önce Gmail hook model override kazanır.
    - Sonra iş başına `model`.
    - Sonra depolanmış herhangi bir Cron oturumu model override.
    - Sonra normal agent/varsayılan model seçimi.

    Yeniden deneme döngüsü sınırlıdır. İlk deneme artı 2 geçiş yeniden denemesinden sonra,
    Cron sonsuza dek döngüye girmek yerine işlemi durdurur.

    Hata ayıklama:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Belgeler: [Cron işleri](/tr/automation/cron-jobs), [cron CLI](/tr/cli/cron).

  </Accordion>

  <Accordion title="Linux'ta Skills nasıl yüklenir?">
    Yerel `openclaw skills` komutlarını kullanın veya Skills öğelerini çalışma alanınıza bırakın. macOS Skills arayüzü Linux'ta kullanılamaz.
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
    dizinine yazar. Ayrı `clawhub` CLI'yi yalnızca kendi Skills öğelerinizi yayımlamak veya
    eşitlemek istiyorsanız yükleyin. Agent'lar arasında paylaşılan kurulumlar için skill'i
    `~/.openclaw/skills` altına koyun ve hangi agent'ların görebileceğini daraltmak istiyorsanız
    `agents.defaults.skills` veya `agents.list[].skills` kullanın.

  </Accordion>

  <Accordion title="OpenClaw görevleri bir zamanlamayla veya arka planda sürekli çalıştırabilir mi?">
    Evet. Gateway zamanlayıcısını kullanın:

    - Zamanlanmış veya yinelenen görevler için **Cron işleri** (yeniden başlatmalarda kalıcıdır).
    - "Ana oturum" periyodik kontrolleri için **Heartbeat**.
    - Özet gönderen veya sohbetlere teslim eden otonom agent'lar için **Yalıtılmış işler**.

    Belgeler: [Cron işleri](/tr/automation/cron-jobs), [Otomasyon ve Görevler](/tr/automation),
    [Heartbeat](/tr/gateway/heartbeat).

  </Accordion>

  <Accordion title="Apple macOS'a özgü Skills öğelerini Linux'tan çalıştırabilir miyim?">
    Doğrudan değil. macOS Skills öğeleri `metadata.openclaw.os` ve gerekli ikili dosyalarla sınırlandırılır; Skills yalnızca **Gateway host** üzerinde uygun olduklarında sistem prompt'unda görünür. Linux'ta `darwin`-only Skills (`apple-notes`, `apple-reminders`, `things-mac` gibi), bu sınırlamayı override etmediğiniz sürece yüklenmez.

    Desteklenen üç düzeniniz var:

    **Seçenek A - Gateway'i bir Mac üzerinde çalıştırın (en basiti).**
    Gateway'i macOS ikili dosyalarının bulunduğu yerde çalıştırın, ardından Linux'tan [uzak modda](#gateway-ports-already-running-and-remote-mode) veya Tailscale üzerinden bağlanın. Skills normal şekilde yüklenir çünkü Gateway host macOS'tur.

    **Seçenek B - bir macOS Node kullanın (SSH yok).**
    Gateway'i Linux'ta çalıştırın, bir macOS Node'u (menü çubuğu uygulaması) eşleştirin ve Mac'te **Node Çalıştırma Komutları** ayarını "Always Ask" veya "Always Allow" yapın. OpenClaw, gerekli ikili dosyalar Node üzerinde mevcut olduğunda macOS'a özgü Skills öğelerini uygun kabul edebilir. Agent bu Skills öğelerini `nodes` aracı üzerinden çalıştırır. "Always Ask" seçerseniz, istemde "Always Allow" onayı vermek bu komutu izin listesine ekler.

    **Seçenek C - macOS ikili dosyalarını SSH üzerinden proxy'leyin (gelişmiş).**
    Gateway'i Linux'ta tutun, ancak gerekli CLI ikili dosyalarının Mac üzerinde çalışan SSH sarmalayıcılarına çözümlenmesini sağlayın. Ardından skill'i Linux'a izin verecek şekilde override edin, böylece uygun kalır.

    1. İkili dosya için bir SSH sarmalayıcısı oluşturun (örnek: Apple Notes için `memo`):

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. Sarmalayıcıyı Linux host üzerindeki `PATH` içine koyun (örneğin `~/bin/memo`).
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

    - **Özel skill / Plugin:** güvenilir API erişimi için en iyisi (Notion/HeyGen ikisinin de API'leri var).
    - **Tarayıcı otomasyonu:** kod olmadan çalışır ancak daha yavaş ve daha kırılgandır.

    Müşteri başına bağlamı korumak istiyorsanız (ajans iş akışları), basit bir düzen şudur:

    - Müşteri başına bir Notion sayfası (bağlam + tercihler + etkin iş).
    - Agent'tan oturumun başında bu sayfayı getirmesini isteyin.

    Yerel bir entegrasyon istiyorsanız, bir özellik isteği açın veya bu API'leri
    hedefleyen bir skill oluşturun.

    Skills yükleme:

    ```bash
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    Yerel kurulumlar etkin çalışma alanındaki `skills/` dizinine yerleşir. Agent'lar arasında paylaşılan Skills için bunları `~/.openclaw/skills/<name>/SKILL.md` konumuna yerleştirin. Yalnızca bazı agent'ların paylaşılan bir kurulumu görmesi gerekiyorsa, `agents.defaults.skills` veya `agents.list[].skills` yapılandırın. Bazı Skills, Homebrew üzerinden yüklenmiş ikili dosyalar bekler; Linux'ta bu Linuxbrew anlamına gelir (yukarıdaki Homebrew Linux SSS girdisine bakın). Bkz. [Skills](/tr/tools/skills), [Skills yapılandırması](/tr/tools/skills-config) ve [ClawHub](/tr/tools/clawhub).

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

    Bu yol yerel host tarayıcısını veya bağlı bir tarayıcı Node'unu kullanabilir. Gateway başka bir yerde çalışıyorsa, tarayıcı makinesinde bir Node host çalıştırın veya bunun yerine uzak CDP kullanın.

    `existing-session` / `user` üzerindeki mevcut sınırlar:

    - eylemler CSS selector tabanlı değil, ref tabanlıdır
    - yüklemeler `ref` / `inputRef` gerektirir ve şu anda tek seferde bir dosyayı destekler
    - `responsebody`, PDF dışa aktarma, indirme yakalama ve toplu eylemler hâlâ yönetilen bir tarayıcı veya ham CDP profili gerektirir

  </Accordion>
</AccordionGroup>

## Sandboxing ve bellek

<AccordionGroup>
  <Accordion title="Ayrı bir Sandboxing belgesi var mı?">
    Evet. Bkz. [Sandboxing](/tr/gateway/sandboxing). Docker'a özgü kurulum için (Docker içinde tam Gateway veya sandbox görüntüleri), bkz. [Docker](/tr/install/docker).
  </Accordion>

  <Accordion title="Docker sınırlı hissettiriyor - tam özellikleri nasıl etkinleştiririm?">
    Varsayılan görüntü güvenlik önceliklidir ve `node` kullanıcısı olarak çalışır; bu nedenle
    sistem paketlerini, Homebrew'i veya birlikte gelen tarayıcıları içermez. Daha kapsamlı bir kurulum için:

    - Önbelleklerin kalıcı olması için `/home/node` konumunu `OPENCLAW_HOME_VOLUME` ile kalıcı hale getirin.
    - Sistem bağımlılıklarını `OPENCLAW_DOCKER_APT_PACKAGES` ile görüntüye ekleyin.
    - Playwright tarayıcılarını birlikte gelen CLI üzerinden yükleyin:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - `PLAYWRIGHT_BROWSERS_PATH` ayarlayın ve yolun kalıcı hale getirildiğinden emin olun.

    Belgeler: [Docker](/tr/install/docker), [Tarayıcı](/tr/tools/browser).

  </Accordion>

  <Accordion title="Tek bir agent ile DM'leri kişisel tutup grupları genel/sandbox'lı yapabilir miyim?">
    Evet - özel trafiğiniz **DM'ler** ve genel trafiğiniz **gruplar** ise.

    Grup/kanal oturumları (ana olmayan anahtarlar) yapılandırılan sandbox backend içinde çalışırken ana DM oturumunun host üzerinde kalması için `agents.defaults.sandbox.mode: "non-main"` kullanın. Bir backend seçmezseniz Docker varsayılan backend'dir. Ardından sandbox'lı oturumlarda hangi araçların kullanılabilir olduğunu `tools.sandbox.tools` üzerinden kısıtlayın.

    Kurulum anlatımı + örnek yapılandırma: [Gruplar: kişisel DM'ler + genel gruplar](/tr/channels/groups#pattern-personal-dms-public-groups-single-agent)

    Temel yapılandırma başvurusu: [Gateway yapılandırması](/tr/gateway/config-agents#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="Bir host klasörünü sandbox içine nasıl bağlarım?">
    `agents.defaults.sandbox.docker.binds` değerini `["host:path:mode"]` olarak ayarlayın (ör. `"/home/user/src:/src:ro"`). Genel + agent başına bağlamalar birleştirilir; `scope: "shared"` olduğunda agent başına bağlamalar yok sayılır. Hassas olan her şey için `:ro` kullanın ve bağlamaların sandbox dosya sistemi duvarlarını atladığını unutmayın.

    OpenClaw, bind kaynaklarını hem normalize edilmiş yola hem de mevcut en derin üst dizin üzerinden çözümlenen kanonik yola göre doğrular. Bu, son yol segmenti henüz mevcut olmasa bile symlink üst dizini kaçışlarının kapalı başarısız olduğu ve izin verilen kök kontrollerinin symlink çözümlemesinden sonra da geçerli olduğu anlamına gelir.

    Örnekler ve güvenlik notları için bkz. [Sandboxing](/tr/gateway/sandboxing#custom-bind-mounts) ve [Sandbox vs Araç İlkesi vs Yükseltilmiş](/tr/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check).

  </Accordion>

  <Accordion title="Bellek nasıl çalışır?">
    OpenClaw belleği, agent çalışma alanındaki Markdown dosyalarından ibarettir:

    - `memory/YYYY-MM-DD.md` içinde günlük notlar
    - `MEMORY.md` içinde derlenmiş uzun vadeli notlar (yalnızca ana/özel oturumlar)

    OpenClaw ayrıca modele auto-compaction öncesinde kalıcı notlar yazmasını hatırlatmak için
    **sessiz pre-compaction bellek boşaltması** çalıştırır. Bu yalnızca çalışma alanı
    yazılabilir olduğunda çalışır (salt okunur sandbox'lar bunu atlar). Bkz. [Bellek](/tr/concepts/memory).

  </Accordion>

  <Accordion title="Bellek bazı şeyleri unutmaya devam ediyor. Kalıcı olmasını nasıl sağlarım?">
    Bota **gerçeği belleğe yazmasını** söyleyin. Uzun vadeli notlar `MEMORY.md` içine,
    kısa vadeli bağlam `memory/YYYY-MM-DD.md` içine konur.

    Bu hâlâ geliştirdiğimiz bir alan. Modele anıları saklamasını hatırlatmak yardımcı olur;
    ne yapacağını bilir. Unutmaya devam ederse, Gateway'in her çalıştırmada aynı
    çalışma alanını kullandığını doğrulayın.

    Belgeler: [Bellek](/tr/concepts/memory), [Agent çalışma alanı](/tr/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Bellek sonsuza dek kalıcı mı? Sınırları nelerdir?">
    Bellek dosyaları diskte yaşar ve siz silene kadar kalıcı olur. Sınır model değil,
    depolama alanınızdır. **Oturum bağlamı** yine de model bağlam penceresiyle sınırlıdır;
    bu nedenle uzun konuşmalar compact edilebilir veya kırpılabilir. Bellek aramasının var olma nedeni budur -
    yalnızca ilgili bölümleri bağlama geri çeker.

    Belgeler: [Bellek](/tr/concepts/memory), [Bağlam](/tr/concepts/context).

  </Accordion>

  <Accordion title="Semantik bellek araması OpenAI API anahtarı gerektirir mi?">
    Yalnızca **OpenAI embeddings** kullanırsanız. Codex OAuth sohbet/tamamlamaları kapsar ve
    embeddings erişimi **vermez**, bu yüzden **Codex ile oturum açmak (OAuth veya
    Codex CLI oturumu)** semantik bellek araması için yardımcı olmaz. OpenAI embeddings
    yine de gerçek bir API anahtarı gerektirir (`OPENAI_API_KEY` veya `models.providers.openai.apiKey`).

    Açıkça bir sağlayıcı ayarlamazsanız, OpenClaw bir API anahtarını çözümleyebildiğinde
    otomatik olarak bir sağlayıcı seçer (kimlik doğrulama profilleri, `models.providers.*.apiKey` veya env vars).
    Bir OpenAI anahtarı çözümlenirse OpenAI'ı tercih eder; aksi halde bir Gemini anahtarı
    çözümlenirse Gemini'ı, sonra Voyage'ı, sonra Mistral'ı tercih eder. Uzak anahtar yoksa, bellek
    araması siz yapılandırana kadar devre dışı kalır. Yerel model yolu
    yapılandırılmış ve mevcutsa OpenClaw
    `local` değerini tercih eder. Ollama, açıkça
    `memorySearch.provider = "ollama"` ayarladığınızda desteklenir.

    Yerel kalmayı tercih ederseniz `memorySearch.provider = "local"` ayarlayın (ve isteğe bağlı olarak
    `memorySearch.fallback = "none"`). Gemini embeddings istiyorsanız
    `memorySearch.provider = "gemini"` ayarlayın ve `GEMINI_API_KEY` (veya
    `memorySearch.remote.apiKey`) sağlayın. **OpenAI, Gemini, Voyage, Mistral, Ollama veya local** embedding
    modellerini destekliyoruz - kurulum ayrıntıları için [Bellek](/tr/concepts/memory) bölümüne bakın.

  </Accordion>
</AccordionGroup>

## Verilerin diskte bulunduğu yer

<AccordionGroup>
  <Accordion title="OpenClaw ile kullanılan tüm veriler yerel olarak mı kaydedilir?">
    Hayır - **OpenClaw'un durumu yereldir**, ancak **harici hizmetler yine de onlara ne gönderdiğinizi görür**.

    - **Varsayılan olarak yerel:** oturumlar, bellek dosyaları, yapılandırma ve çalışma alanı Gateway ana makinesinde bulunur
      (`~/.openclaw` + çalışma alanı dizininiz).
    - **Zorunlu olarak uzak:** model sağlayıcılarına (Anthropic/OpenAI/vb.) gönderdiğiniz iletiler
      onların API'lerine gider ve sohbet platformları (WhatsApp/Telegram/Slack/vb.) ileti verilerini
      kendi sunucularında depolar.
    - **Kapsamı siz kontrol edersiniz:** yerel modeller kullanmak istemleri makinenizde tutar, ancak kanal
      trafiği yine de kanalın sunucularından geçer.

    İlgili: [Temsilci çalışma alanı](/tr/concepts/agent-workspace), [Bellek](/tr/concepts/memory).

  </Accordion>

  <Accordion title="OpenClaw verilerini nerede saklar?">
    Her şey `$OPENCLAW_STATE_DIR` altında bulunur (varsayılan: `~/.openclaw`):

    | Yol                                                             | Amaç                                                               |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | Ana yapılandırma (JSON5)                                           |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | Eski OAuth içe aktarımı (ilk kullanımda kimlik doğrulama profillerine kopyalanır) |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | Kimlik doğrulama profilleri (OAuth, API anahtarları ve isteğe bağlı `keyRef`/`tokenRef`) |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | `file` SecretRef sağlayıcıları için isteğe bağlı dosya destekli gizli yük |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | Eski uyumluluk dosyası (statik `api_key` girdileri temizlenmiş)    |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | Sağlayıcı durumu (örn. `whatsapp/<accountId>/creds.json`)          |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | Temsilci başına durum (agentDir + oturumlar)                       |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | Konuşma geçmişi ve durumu (temsilci başına)                        |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | Oturum meta verileri (temsilci başına)                             |

    Eski tek temsilcili yol: `~/.openclaw/agent/*` (`openclaw doctor` tarafından taşınır).

    **Çalışma alanınız** (AGENTS.md, bellek dosyaları, Skills, vb.) ayrıdır ve `agents.defaults.workspace` üzerinden yapılandırılır (varsayılan: `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title="AGENTS.md / SOUL.md / USER.md / MEMORY.md nerede bulunmalı?">
    Bu dosyalar `~/.openclaw` içinde değil, **temsilci çalışma alanında** bulunur.

    - **Çalışma alanı (temsilci başına)**: `AGENTS.md`, `SOUL.md`, `IDENTITY.md`, `USER.md`,
      `MEMORY.md`, `memory/YYYY-MM-DD.md`, isteğe bağlı `HEARTBEAT.md`.
      Küçük harfli kök `memory.md` yalnızca eski onarım girdisidir; `openclaw doctor --fix`
      her iki dosya da varsa bunu `MEMORY.md` içine birleştirebilir.
    - **Durum dizini (`~/.openclaw`)**: yapılandırma, kanal/sağlayıcı durumu, kimlik doğrulama profilleri, oturumlar, günlükler
      ve paylaşılan Skills (`~/.openclaw/skills`).

    Varsayılan çalışma alanı `~/.openclaw/workspace` olup şu şekilde yapılandırılabilir:

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    Bot yeniden başlatmadan sonra "unutursa", Gateway'in her başlatmada aynı
    çalışma alanını kullandığını doğrulayın (ve unutmayın: uzak mod **gateway ana makinesinin**
    çalışma alanını kullanır, yerel dizüstü bilgisayarınızınkini değil).

    İpucu: kalıcı bir davranış veya tercih istiyorsanız, sohbet geçmişine güvenmek yerine bottan bunu
    **AGENTS.md veya MEMORY.md içine yazmasını** isteyin.

    Bkz. [Temsilci çalışma alanı](/tr/concepts/agent-workspace) ve [Bellek](/tr/concepts/memory).

  </Accordion>

  <Accordion title="Önerilen yedekleme stratejisi">
    **Temsilci çalışma alanınızı** **özel** bir git deposuna koyun ve özel bir yerde
    yedekleyin (örneğin GitHub private). Bu, bellek + AGENTS/SOUL/USER
    dosyalarını yakalar ve asistanın "zihnini" daha sonra geri yüklemenizi sağlar.

    `~/.openclaw` altındaki hiçbir şeyi (kimlik bilgileri, oturumlar, token'lar veya şifrelenmiş gizli yükler)
    commit etmeyin.
    Tam geri yükleme gerekiyorsa hem çalışma alanını hem de durum dizinini
    ayrı ayrı yedekleyin (yukarıdaki taşıma sorusuna bakın).

    Belgeler: [Temsilci çalışma alanı](/tr/concepts/agent-workspace).

  </Accordion>

  <Accordion title="OpenClaw'u tamamen nasıl kaldırırım?">
    Özel kılavuza bakın: [Kaldırma](/tr/install/uninstall).
  </Accordion>

  <Accordion title="Temsilciler çalışma alanı dışında çalışabilir mi?">
    Evet. Çalışma alanı **varsayılan cwd** ve bellek dayanağıdır; katı bir sandbox değildir.
    Göreli yollar çalışma alanı içinde çözümlenir, ancak sandboxing etkin değilse mutlak yollar diğer
    ana makine konumlarına erişebilir. İzolasyona ihtiyacınız varsa
    [`agents.defaults.sandbox`](/tr/gateway/sandboxing) veya temsilci başına sandbox ayarlarını kullanın. Bir
    deponun varsayılan çalışma dizini olmasını istiyorsanız, o temsilcinin
    `workspace` değerini depo köküne yönlendirin. OpenClaw deposu yalnızca kaynak koddur; temsilcinin
    kasıtlı olarak onun içinde çalışmasını istemiyorsanız çalışma alanını ayrı tutun.

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
    Oturum durumu **gateway ana makinesine** aittir. Uzak moddaysanız, sizin için önemli olan oturum deposu yerel dizüstü bilgisayarınızda değil, uzak makinededir. Bkz. [Oturum yönetimi](/tr/concepts/session).
  </Accordion>
</AccordionGroup>

## Yapılandırma temelleri

<AccordionGroup>
  <Accordion title="Yapılandırma hangi formatta? Nerede bulunur?">
    OpenClaw, `$OPENCLAW_CONFIG_PATH` konumundan isteğe bağlı bir **JSON5** yapılandırması okur (varsayılan: `~/.openclaw/openclaw.json`):

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    Dosya yoksa güvenli sayılabilecek varsayılanları kullanır (`~/.openclaw/workspace` varsayılan çalışma alanı dahil).

  </Accordion>

  <Accordion title='gateway.bind: "lan" (veya "tailnet") ayarladım ve artık hiçbir şey dinlemiyor / UI yetkisiz diyor'>
    Loopback dışı bağlamalar **geçerli bir gateway kimlik doğrulama yolu gerektirir**. Pratikte bunun anlamı:

    - paylaşılan gizli kimlik doğrulaması: token veya parola
    - doğru yapılandırılmış kimlik farkında ters proxy arkasında `gateway.auth.mode: "trusted-proxy"`

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

    - `gateway.remote.token` / `.password` tek başına yerel gateway kimlik doğrulamasını etkinleştirmez.
    - Yerel çağrı yolları, yalnızca `gateway.auth.*` ayarlanmamışsa `gateway.remote.*` değerini geri dönüş olarak kullanabilir.
    - Parola kimlik doğrulaması için bunun yerine `gateway.auth.mode: "password"` ve `gateway.auth.password` (veya `OPENCLAW_GATEWAY_PASSWORD`) ayarlayın.
    - `gateway.auth.token` / `gateway.auth.password` açıkça SecretRef üzerinden yapılandırılmış ve çözümlenememişse, çözümleme kapalı başarısız olur (uzak geri dönüş maskelemesi yok).
    - Paylaşılan gizli Control UI kurulumları `connect.params.auth.token` veya `connect.params.auth.password` üzerinden kimlik doğrular (uygulama/UI ayarlarında saklanır). Tailscale Serve veya `trusted-proxy` gibi kimlik taşıyan modlar bunun yerine istek üst bilgilerini kullanır. Paylaşılan sırları URL'lere koymaktan kaçının.
    - `gateway.auth.mode: "trusted-proxy"` ile aynı ana makinedeki loopback ters proxy'leri açıkça `gateway.auth.trustedProxy.allowLoopback = true` ve `gateway.trustedProxies` içinde bir loopback girdisi gerektirir.

  </Accordion>

  <Accordion title="Artık localhost üzerinde neden token'a ihtiyacım var?">
    OpenClaw, loopback dahil olmak üzere varsayılan olarak gateway kimlik doğrulamasını zorunlu kılar. Normal varsayılan yolda bu token kimlik doğrulaması anlamına gelir: açık bir kimlik doğrulama yolu yapılandırılmamışsa gateway başlangıcı token moduna çözümlenir ve o başlangıç için yalnızca çalışma zamanı token'ı üretir; bu yüzden **yerel WS istemcileri kimlik doğrulaması yapmalıdır**. İstemcilerin yeniden başlatmalar arasında kararlı bir gizli değere ihtiyacı olduğunda `gateway.auth.token`, `gateway.auth.password`, `OPENCLAW_GATEWAY_TOKEN` veya `OPENCLAW_GATEWAY_PASSWORD` değerini açıkça yapılandırın. Bu, diğer yerel süreçlerin Gateway'i çağırmasını engeller.

    Farklı bir kimlik doğrulama yolu tercih ediyorsanız parola modunu (veya kimlik farkında ters proxy'ler için `trusted-proxy`) açıkça seçebilirsiniz. **Gerçekten** açık loopback istiyorsanız yapılandırmanızda açıkça `gateway.auth.mode: "none"` ayarlayın. Doctor sizin için istediğiniz zaman token üretebilir: `openclaw doctor --generate-gateway-token`.

  </Accordion>

  <Accordion title="Yapılandırmayı değiştirdikten sonra yeniden başlatmam gerekir mi?">
    Gateway yapılandırmayı izler ve hot-reload destekler:

    - `gateway.reload.mode: "hybrid"` (varsayılan): güvenli değişiklikleri sıcak uygula, kritik olanlar için yeniden başlat
    - `hot`, `restart`, `off` da desteklenir

  </Accordion>

  <Accordion title="Komik CLI sloganlarını nasıl devre dışı bırakırım?">
    Yapılandırmada `cli.banner.taglineMode` ayarlayın:

    ```json5
    {
      cli: {
        banner: {
          taglineMode: "off", // random | default | off
        },
      },
    }
    ```

    - `off`: slogan metnini gizler ancak banner başlık/sürüm satırını korur.
    - `default`: her seferinde `All your chats, one OpenClaw.` kullanır.
    - `random`: dönüşümlü komik/mevsimsel sloganlar (varsayılan davranış).
    - Hiç banner istemiyorsanız env `OPENCLAW_HIDE_BANNER=1` ayarlayın.

  </Accordion>

  <Accordion title="Web aramasını (ve web fetch'i) nasıl etkinleştiririm?">
    `web_fetch` API anahtarı olmadan çalışır. `web_search` seçtiğiniz
    sağlayıcıya bağlıdır:

    - Brave, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Perplexity ve Tavily gibi API destekli sağlayıcılar normal API anahtarı kurulumlarını gerektirir.
    - Ollama Web Search anahtarsızdır, ancak yapılandırılmış Ollama ana makinenizi kullanır ve `ollama signin` gerektirir.
    - DuckDuckGo anahtarsızdır, ancak resmi olmayan HTML tabanlı bir entegrasyondur.
    - SearXNG anahtarsız/kendi barındırmalıdır; `SEARXNG_BASE_URL` veya `plugins.entries.searxng.config.webSearch.baseUrl` yapılandırın.

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

    Sağlayıcıya özgü web araması yapılandırması artık `plugins.entries.<plugin>.config.webSearch.*` altında bulunur.
    Eski `tools.web.search.*` sağlayıcı yolları uyumluluk için geçici olarak hâlâ yüklenir, ancak yeni yapılandırmalarda kullanılmamalıdır.
    Firecrawl web getirme yedek yapılandırması `plugins.entries.firecrawl.config.webFetch.*` altında bulunur.

    Notlar:

    - İzin listeleri kullanıyorsanız `web_search`/`web_fetch`/`x_search` veya `group:web` ekleyin.
    - `web_fetch` varsayılan olarak etkindir (açıkça devre dışı bırakılmadıkça).
    - `tools.web.fetch.provider` atlanırsa OpenClaw, mevcut kimlik bilgilerinden ilk hazır getirme yedek sağlayıcısını otomatik olarak algılar. Bugün paketle gelen sağlayıcı Firecrawl’dır.
    - Daemon’lar ortam değişkenlerini `~/.openclaw/.env` dosyasından (veya servis ortamından) okur.

    Belgeler: [Web araçları](/tr/tools/web).

  </Accordion>

  <Accordion title="config.apply yapılandırmamı sildi. Nasıl kurtarır ve bunu nasıl önlerim?">
    `config.apply` **tüm yapılandırmayı** değiştirir. Kısmi bir nesne gönderirseniz diğer her şey
    kaldırılır.

    Güncel OpenClaw birçok kazara ezmeyi engeller:

    - OpenClaw’a ait yapılandırma yazmaları, yazmadan önce değişiklik sonrası tam yapılandırmayı doğrular.
    - Geçersiz veya yıkıcı OpenClaw’a ait yazmalar reddedilir ve `openclaw.json.rejected.*` olarak kaydedilir.
    - Doğrudan yapılan bir düzenleme başlatmayı veya sıcak yeniden yüklemeyi bozarsa Gateway kapalı şekilde başarısız olur veya yeniden yüklemeyi atlar; `openclaw.json` dosyasını yeniden yazmaz.
    - Onarım `openclaw doctor --fix` tarafından yönetilir ve reddedilen dosyayı `openclaw.json.clobbered.*` olarak kaydederken bilinen son iyi durumu geri yükleyebilir.

    Kurtarma:

    - `Invalid config at`, `Config write rejected:` veya `config reload skipped (invalid config)` için `openclaw logs --follow` çıktısını kontrol edin.
    - Etkin yapılandırmanın yanındaki en yeni `openclaw.json.clobbered.*` veya `openclaw.json.rejected.*` dosyasını inceleyin.
    - `openclaw config validate` ve `openclaw doctor --fix` çalıştırın.
    - Yalnızca amaçlanan anahtarları `openclaw config set` veya `config.patch` ile geri kopyalayın.
    - Bilinen son iyi durumunuz veya reddedilmiş yükünüz yoksa yedekten geri yükleyin ya da `openclaw doctor` komutunu yeniden çalıştırıp kanalları/modelleri yeniden yapılandırın.
    - Bu beklenmeyen bir durumsa bir hata bildirimi açın ve bilinen son yapılandırmanızı veya varsa bir yedeği ekleyin.
    - Yerel bir kodlama ajanı çoğu zaman günlüklerden veya geçmişten çalışan bir yapılandırmayı yeniden oluşturabilir.

    Önleme:

    - Küçük değişiklikler için `openclaw config set` kullanın.
    - Etkileşimli düzenlemeler için `openclaw configure` kullanın.
    - Tam yol veya alan biçiminden emin değilseniz önce `config.schema.lookup` kullanın; ayrıntıya inmek için sığ bir şema düğümü ve doğrudan alt öğe özetleri döndürür.
    - Kısmi RPC düzenlemeleri için `config.patch` kullanın; `config.apply` yalnızca tam yapılandırma değiştirme için kalsın.
    - Bir ajan çalıştırmasından yalnızca sahip kullanımına yönelik `gateway` aracını kullanıyorsanız, `tools.exec.ask` / `tools.exec.security` yazmalarını (aynı korumalı exec yollarına normalleştirilen eski `tools.bash.*` takma adları dahil) yine de reddeder.

    Belgeler: [Yapılandırma](/tr/cli/config), [Yapılandır](/tr/cli/configure), [Gateway sorun giderme](/tr/gateway/troubleshooting#gateway-rejected-invalid-config), [Doctor](/tr/gateway/doctor).

  </Accordion>

  <Accordion title="Cihazlar arasında özelleşmiş çalışanlarla merkezi bir Gateway’i nasıl çalıştırırım?">
    Yaygın kalıp **bir Gateway** (örn. Raspberry Pi) artı **Node’lar** ve **ajanlar** kullanmaktır:

    - **Gateway (merkezi):** kanalları (Signal/WhatsApp), yönlendirmeyi ve oturumları yönetir.
    - **Node’lar (cihazlar):** Mac/iOS/Android çevre birimleri olarak bağlanır ve yerel araçları (`system.run`, `canvas`, `camera`) sunar.
    - **Ajanlar (çalışanlar):** özel roller için ayrı beyinler/çalışma alanlarıdır (örn. "Hetzner operasyonları", "Kişisel veriler").
    - **Alt ajanlar:** paralellik istediğinizde ana ajandan arka plan işi başlatır.
    - **TUI:** Gateway’e bağlanır ve ajanlar/oturumlar arasında geçiş yapar.

    Belgeler: [Node’lar](/tr/nodes), [Uzaktan erişim](/tr/gateway/remote), [Çok Ajanlı Yönlendirme](/tr/concepts/multi-agent), [Alt ajanlar](/tr/tools/subagents), [TUI](/tr/web/tui).

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

    Varsayılan değer `false` (başlı) şeklindedir. Başsız modun bazı sitelerde bot karşıtı denetimleri tetikleme olasılığı daha yüksektir. Bkz. [Tarayıcı](/tr/tools/browser).

    Başsız mod **aynı Chromium motorunu** kullanır ve çoğu otomasyon için çalışır (formlar, tıklamalar, veri kazıma, girişler). Başlıca farklar:

    - Görünür tarayıcı penceresi yoktur (görsel gerekiyorsa ekran görüntüleri kullanın).
    - Bazı siteler başsız modda otomasyona karşı daha katıdır (CAPTCHA’lar, bot karşıtı önlemler).
      Örneğin X/Twitter sık sık başsız oturumları engeller.

  </Accordion>

  <Accordion title="Tarayıcı denetimi için Brave’i nasıl kullanırım?">
    `browser.executablePath` değerini Brave ikili dosyanıza (veya Chromium tabanlı herhangi bir tarayıcıya) ayarlayın ve Gateway’i yeniden başlatın.
    Tam yapılandırma örnekleri için [Tarayıcı](/tr/tools/browser#use-brave-or-another-chromium-based-browser) bölümüne bakın.
  </Accordion>
</AccordionGroup>

## Uzak Gateway’ler ve Node’lar

<AccordionGroup>
  <Accordion title="Komutlar Telegram, gateway ve Node’lar arasında nasıl yayılır?">
    Telegram mesajları **gateway** tarafından işlenir. Gateway ajanı çalıştırır ve
    yalnızca bir node aracı gerektiğinde **Gateway WebSocket** üzerinden Node’ları çağırır:

    Telegram → Gateway → Agent → `node.*` → Node → Gateway → Telegram

    Node’lar gelen sağlayıcı trafiğini görmez; yalnızca node RPC çağrıları alırlar.

  </Accordion>

  <Accordion title="Gateway uzakta barındırılıyorsa ajanım bilgisayarıma nasıl erişebilir?">
    Kısa yanıt: **bilgisayarınızı node olarak eşleştirin**. Gateway başka yerde çalışır, ancak
    yerel makinenizdeki `node.*` araçlarını (ekran, kamera, sistem) Gateway WebSocket üzerinden çağırabilir.

    Tipik kurulum:

    1. Gateway’i sürekli açık ana makinede (VPS/ev sunucusu) çalıştırın.
    2. Gateway ana makinesini ve bilgisayarınızı aynı tailnet’e koyun.
    3. Gateway WS’nin erişilebilir olduğundan emin olun (tailnet bağlama veya SSH tüneli).
    4. macOS uygulamasını yerelde açın ve node olarak kaydolabilmesi için **SSH Üzerinden Uzak** modda (veya doğrudan tailnet ile)
       bağlanın.
    5. Node’u Gateway’de onaylayın:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Ayrı bir TCP köprüsü gerekmez; Node’lar Gateway WebSocket üzerinden bağlanır.

    Güvenlik hatırlatması: bir macOS node’unu eşleştirmek o makinede `system.run` çalıştırmaya izin verir. Yalnızca
    güvendiğiniz cihazları eşleştirin ve [Güvenlik](/tr/gateway/security) bölümünü inceleyin.

    Belgeler: [Node’lar](/tr/nodes), [Gateway protokolü](/tr/gateway/protocol), [macOS uzak mod](/tr/platforms/mac/remote), [Güvenlik](/tr/gateway/security).

  </Accordion>

  <Accordion title="Tailscale bağlı ama yanıt alamıyorum. Şimdi ne yapmalıyım?">
    Temel noktaları kontrol edin:

    - Gateway çalışıyor: `openclaw gateway status`
    - Gateway sağlığı: `openclaw status`
    - Kanal sağlığı: `openclaw channels status`

    Ardından kimlik doğrulamayı ve yönlendirmeyi doğrulayın:

    - Tailscale Serve kullanıyorsanız `gateway.auth.allowTailscale` değerinin doğru ayarlandığından emin olun.
    - SSH tüneli üzerinden bağlanıyorsanız yerel tünelin açık olduğunu ve doğru bağlantı noktasını gösterdiğini doğrulayın.
    - İzin listelerinizin (DM veya grup) hesabınızı içerdiğini doğrulayın.

    Belgeler: [Tailscale](/tr/gateway/tailscale), [Uzaktan erişim](/tr/gateway/remote), [Kanallar](/tr/channels).

  </Accordion>

  <Accordion title="İki OpenClaw örneği birbiriyle konuşabilir mi (yerel + VPS)?">
    Evet. Yerleşik bir "bot-to-bot" köprüsü yoktur, ancak birkaç
    güvenilir şekilde bunu bağlayabilirsiniz:

    **En basit:** iki botun da erişebildiği normal bir sohbet kanalı kullanın (Telegram/Slack/WhatsApp).
    Bot A’nın Bot B’ye mesaj göndermesini sağlayın, ardından Bot B’nin her zamanki gibi yanıtlamasına izin verin.

    **CLI köprüsü (genel):** diğer botun
    dinlediği bir sohbeti hedefleyerek diğer Gateway’i `openclaw agent --message ... --deliver` ile çağıran bir betik çalıştırın. Botlardan biri uzak bir VPS üzerindeyse CLI’nizi
    SSH/Tailscale üzerinden o uzak Gateway’e yönlendirin (bkz. [Uzaktan erişim](/tr/gateway/remote)).

    Örnek kalıp (hedef Gateway’e erişebilen bir makineden çalıştırın):

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    İpucu: iki botun sonsuz döngüye girmemesi için bir koruma ekleyin (yalnızca bahsetme, kanal
    izin listeleri veya "bot mesajlarına yanıt verme" kuralı).

    Belgeler: [Uzaktan erişim](/tr/gateway/remote), [Ajan CLI](/tr/cli/agent), [Ajan gönderme](/tr/tools/agent-send).

  </Accordion>

  <Accordion title="Birden fazla ajan için ayrı VPS’lere ihtiyacım var mı?">
    Hayır. Tek bir Gateway, her biri kendi çalışma alanına, model varsayılanlarına
    ve yönlendirmesine sahip birden fazla ajan barındırabilir. Bu normal kurulumdur ve
    ajan başına bir VPS çalıştırmaktan çok daha ucuz ve basittir.

    Ayrı VPS’leri yalnızca katı yalıtım (güvenlik sınırları) veya paylaşmak istemediğiniz çok
    farklı yapılandırmalar gerektiğinde kullanın. Aksi halde tek Gateway kullanın ve
    birden fazla ajan veya alt ajan kullanın.

  </Accordion>

  <Accordion title="VPS’ten SSH yerine kişisel dizüstü bilgisayarımda node kullanmanın bir faydası var mı?">
    Evet - Node’lar uzak Gateway’den dizüstü bilgisayarınıza ulaşmanın birincil yoludur ve
    kabuk erişiminden fazlasını sağlar. Gateway macOS/Linux üzerinde çalışır (Windows WSL2 üzerinden) ve
    hafiftir (küçük bir VPS veya Raspberry Pi sınıfı bir kutu yeterlidir; 4 GB RAM fazlasıyla yeterli), bu yüzden yaygın
    kurulum sürekli açık bir ana makine artı node olarak dizüstü bilgisayarınızdır.

    - **Gelen SSH gerekmez.** Node’lar Gateway WebSocket’e dışarı doğru bağlanır ve cihaz eşleştirmesi kullanır.
    - **Daha güvenli yürütme denetimleri.** `system.run`, o dizüstü bilgisayardaki node izin listeleri/onaylarıyla sınırlandırılır.
    - **Daha fazla cihaz aracı.** Node’lar `system.run` yanında `canvas`, `camera` ve `screen` sunar.
    - **Yerel tarayıcı otomasyonu.** Gateway’i VPS üzerinde tutun, ancak Chrome’u dizüstü bilgisayardaki bir node ana makinesi üzerinden yerel olarak çalıştırın veya Chrome MCP ile ana makinedeki yerel Chrome’a bağlanın.

    SSH geçici kabuk erişimi için uygundur, ancak Node’lar sürekli ajan iş akışları ve
    cihaz otomasyonu için daha basittir.

    Belgeler: [Node’lar](/tr/nodes), [Node’lar CLI](/tr/cli/nodes), [Tarayıcı](/tr/tools/browser).

  </Accordion>

  <Accordion title="Node’lar bir gateway servisi çalıştırır mı?">
    Hayır. Bilerek yalıtılmış profiller çalıştırmadığınız sürece ana makine başına yalnızca **bir gateway** çalışmalıdır (bkz. [Birden çok gateway](/tr/gateway/multiple-gateways)). Node’lar gateway’e bağlanan çevre birimleridir
    (iOS/Android Node’ları veya menü çubuğu uygulamasında macOS "node mode"). Başsız node
    ana makineleri ve CLI denetimi için bkz. [Node ana makine CLI](/tr/cli/node).

    `gateway`, `discovery` ve `canvasHost` değişiklikleri için tam yeniden başlatma gerekir.

  </Accordion>

  <Accordion title="Yapılandırmayı uygulamak için bir API / RPC yolu var mı?">
    Evet.

    - `config.schema.lookup`: yazmadan önce bir config alt ağacını sığ schema düğümü, eşleşen UI ipucu ve anlık alt öğe özetleriyle incele
    - `config.get`: mevcut snapshot + hash değerini getir
    - `config.patch`: güvenli kısmi güncelleme (çoğu RPC düzenlemesi için tercih edilir); mümkün olduğunda hot-reload yapar, gerektiğinde yeniden başlatır
    - `config.apply`: tam config’i doğrula + değiştir; mümkün olduğunda hot-reload yapar, gerektiğinde yeniden başlatır
    - Yalnızca sahibin kullanabildiği `gateway` runtime aracı hâlâ `tools.exec.ask` / `tools.exec.security` değerlerini yeniden yazmayı reddeder; eski `tools.bash.*` alias’ları aynı korumalı exec yollarına normalize edilir

  </Accordion>

  <Accordion title="İlk kurulum için en küçük makul config">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    Bu, workspace’inizi ayarlar ve botu kimlerin tetikleyebileceğini sınırlar.

  </Accordion>

  <Accordion title="Bir VPS üzerinde Tailscale’i nasıl kurup Mac’imden bağlanırım?">
    En küçük adımlar:

    1. **VPS üzerinde kur + oturum aç**

       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```

    2. **Mac’inizde kur + oturum aç**
       - Tailscale uygulamasını kullanın ve aynı tailnet’te oturum açın.
    3. **MagicDNS’i etkinleştir (önerilir)**
       - Tailscale yönetici konsolunda MagicDNS’i etkinleştirerek VPS’nin kararlı bir ada sahip olmasını sağlayın.
    4. **Tailnet host adını kullan**
       - SSH: `ssh user@your-vps.tailnet-xxxx.ts.net`
       - Gateway WS: `ws://your-vps.tailnet-xxxx.ts.net:18789`

    SSH olmadan Control UI istiyorsanız VPS üzerinde Tailscale Serve kullanın:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Bu, gateway’i loopback’e bağlı tutar ve HTTPS’i Tailscale üzerinden dışa açar. Bkz. [Tailscale](/tr/gateway/tailscale).

  </Accordion>

  <Accordion title="Bir Mac Node’unu uzak Gateway’e nasıl bağlarım (Tailscale Serve)?">
    Serve, **Gateway Control UI + WS**’yi dışa açar. Node’lar aynı Gateway WS endpoint’i üzerinden bağlanır.

    Önerilen kurulum:

    1. **VPS + Mac’in aynı tailnet’te olduğundan emin olun**.
    2. **macOS uygulamasını Remote modunda kullanın** (SSH hedefi tailnet host adı olabilir).
       Uygulama Gateway portunu tünelleyecek ve Node olarak bağlanacaktır.
    3. Gateway üzerinde **Node’u onaylayın**:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Belgeler: [Gateway protokolü](/tr/gateway/protocol), [Keşif](/tr/gateway/discovery), [macOS Remote modu](/tr/platforms/mac/remote).

  </Accordion>

  <Accordion title="İkinci bir laptop’a kurmalı mıyım, yoksa yalnızca bir Node mu eklemeliyim?">
    İkinci laptop’ta yalnızca **yerel araçlara** (ekran/kamera/exec) ihtiyacınız varsa onu
    **Node** olarak ekleyin. Bu, tek bir Gateway’i korur ve yinelenen config’i önler. Yerel Node araçları
    şu anda yalnızca macOS içindir, ancak bunları diğer işletim sistemlerine de genişletmeyi planlıyoruz.

    Yalnızca **katı izolasyon** veya tamamen ayrı iki bot gerektiğinde ikinci bir Gateway kurun.

    Belgeler: [Node’lar](/tr/nodes), [Node CLI](/tr/cli/nodes), [Birden çok gateway](/tr/gateway/multiple-gateways).

  </Accordion>
</AccordionGroup>

## Env vars ve .env yükleme

<AccordionGroup>
  <Accordion title="OpenClaw ortam değişkenlerini nasıl yükler?">
    OpenClaw, env vars değerlerini üst süreçten (shell, launchd/systemd, CI vb.) okur ve ayrıca şunları yükler:

    - Geçerli çalışma dizininden `.env`
    - `~/.openclaw/.env` konumundan global fallback `.env` (diğer adıyla `$OPENCLAW_STATE_DIR/.env`)

    Hiçbir `.env` dosyası mevcut env vars değerlerini geçersiz kılmaz.

    Config içinde inline env vars da tanımlayabilirsiniz (yalnızca process env içinde eksikse uygulanır):

    ```json5
    {
      env: {
        OPENROUTER_API_KEY: "sk-or-...",
        vars: { GROQ_API_KEY: "gsk-..." },
      },
    }
    ```

    Tam öncelik sırası ve kaynaklar için [/environment](/tr/help/environment) bölümüne bakın.

  </Accordion>

  <Accordion title="Gateway’i servis üzerinden başlattım ve env vars kayboldu. Şimdi ne yapmalıyım?">
    İki yaygın çözüm:

    1. Eksik anahtarları `~/.openclaw/.env` içine koyun; böylece servis shell env’inizi devralmasa bile alınırlar.
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

    Bu, login shell’inizi çalıştırır ve yalnızca eksik beklenen anahtarları içe aktarır (asla geçersiz kılmaz). Env var karşılıkları:
    `OPENCLAW_LOAD_SHELL_ENV=1`, `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`.

  </Accordion>

  <Accordion title='COPILOT_GITHUB_TOKEN ayarladım, ama model durumu "Shell env: off." gösteriyor. Neden?'>
    `openclaw models status`, **shell env import** özelliğinin etkin olup olmadığını bildirir. "Shell env: off"
    env vars değerlerinizin eksik olduğu anlamına **gelmez** - yalnızca OpenClaw’ın
    login shell’inizi otomatik olarak yüklemeyeceği anlamına gelir.

    Gateway bir servis (launchd/systemd) olarak çalışıyorsa shell
    ortamınızı devralmaz. Şunlardan birini yaparak düzeltin:

    1. Token’ı `~/.openclaw/.env` içine koyun:

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. Ya da shell import’u etkinleştirin (`env.shellEnv.enabled: true`).
    3. Ya da config `env` bloğunuza ekleyin (yalnızca eksikse uygulanır).

    Ardından gateway’i yeniden başlatın ve tekrar kontrol edin:

    ```bash
    openclaw models status
    ```

    Copilot token’ları `COPILOT_GITHUB_TOKEN` üzerinden okunur (ayrıca `GH_TOKEN` / `GITHUB_TOKEN`).
    Bkz. [/concepts/model-providers](/tr/concepts/model-providers) ve [/environment](/tr/help/environment).

  </Accordion>
</AccordionGroup>

## Oturumlar ve birden çok sohbet

<AccordionGroup>
  <Accordion title="Yeni bir konuşmayı nasıl başlatırım?">
    Bağımsız bir mesaj olarak `/new` veya `/reset` gönderin. Bkz. [Oturum yönetimi](/tr/concepts/session).
  </Accordion>

  <Accordion title="/new göndermesem oturumlar otomatik olarak sıfırlanır mı?">
    Oturumlar `session.idleMinutes` sonrasında süresi dolabilir, ancak bu **varsayılan olarak devre dışıdır** (varsayılan **0**).
    Boşta kalma süresinin dolmasını etkinleştirmek için bunu pozitif bir değere ayarlayın. Etkinleştirildiğinde, boşta kalma süresinden sonraki **sonraki**
    mesaj, o sohbet anahtarı için yeni bir session id başlatır.
    Bu, transcript’leri silmez - yalnızca yeni bir oturum başlatır.

    ```json5
    {
      session: {
        idleMinutes: 240,
      },
    }
    ```

  </Accordion>

  <Accordion title="OpenClaw örneklerinden oluşan bir ekip (bir CEO ve birçok ajan) oluşturmanın bir yolu var mı?">
    Evet, **çok ajanlı yönlendirme** ve **alt ajanlar** ile. Bir koordinatör
    ajan ve kendi çalışma alanları ile modellerine sahip birkaç çalışan ajan oluşturabilirsiniz.

    Bununla birlikte, bunu en iyi **eğlenceli bir deney** olarak görmek gerekir. Token açısından ağırdır ve çoğu zaman
    ayrı oturumlara sahip tek bir bot kullanmaktan daha az verimlidir. Öngördüğümüz tipik model,
    konuştuğunuz tek bir bot ve paralel işler için farklı oturumlardır. Bu
    bot gerektiğinde alt ajanlar da oluşturabilir.

    Belgeler: [Çok ajanlı yönlendirme](/tr/concepts/multi-agent), [Alt ajanlar](/tr/tools/subagents), [Ajanlar CLI](/tr/cli/agents).

  </Accordion>

  <Accordion title="Bağlam neden görevin ortasında kesildi? Bunu nasıl önlerim?">
    Oturum bağlamı model penceresiyle sınırlıdır. Uzun sohbetler, büyük araç çıktıları veya çok sayıda
    dosya Compaction ya da kesilmeyi tetikleyebilir.

    Yardımcı olanlar:

    - Bottan mevcut durumu özetlemesini ve bunu bir dosyaya yazmasını isteyin.
    - Uzun görevlerden önce `/compact`, konu değiştirirken de `/new` kullanın.
    - Önemli bağlamı çalışma alanında tutun ve bottan bunu tekrar okumasını isteyin.
    - Ana sohbetin daha küçük kalması için uzun veya paralel işlerde alt ajanları kullanın.
    - Bu sık oluyorsa daha büyük bağlam penceresine sahip bir model seçin.

  </Accordion>

  <Accordion title="OpenClaw'ı kurulu tutarak tamamen nasıl sıfırlarım?">
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
    - Profil kullandıysanız (`--profile` / `OPENCLAW_PROFILE`), her durum dizinini sıfırlayın (varsayılanlar `~/.openclaw-<profile>`).
    - Geliştirme sıfırlaması: `openclaw gateway --dev --reset` (yalnızca geliştirme; geliştirme yapılandırmasını + kimlik bilgilerini + oturumları + çalışma alanını siler).

  </Accordion>

  <Accordion title='"context too large" hataları alıyorum - nasıl sıfırlar veya compact ederim?'>
    Bunlardan birini kullanın:

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

    Belgeler: [Compaction](/tr/concepts/compaction), [Oturum budama](/tr/concepts/session-pruning), [Oturum yönetimi](/tr/concepts/session).

  </Accordion>

  <Accordion title='"LLM request rejected: messages.content.tool_use.input field required" mesajını neden görüyorum?'>
    Bu bir sağlayıcı doğrulama hatasıdır: model, gerekli `input` olmadan bir `tool_use` bloğu üretti.
    Genellikle oturum geçmişinin eski veya bozuk olduğu anlamına gelir (çoğu zaman uzun iş parçacıklarından
    ya da bir araç/şema değişikliğinden sonra).

    Çözüm: `/new` ile yeni bir oturum başlatın (tek başına mesaj).

  </Accordion>

  <Accordion title="Neden her 30 dakikada bir heartbeat mesajları alıyorum?">
    Heartbeat varsayılan olarak her **30m** çalışır (OAuth kimlik doğrulaması kullanırken **1h**). Bunları ayarlayın veya devre dışı bırakın:

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

    `HEARTBEAT.md` varsa ancak fiilen boşsa (yalnızca boş satırlar ve `# Heading` gibi markdown
    başlıkları), OpenClaw API çağrılarından tasarruf etmek için heartbeat çalıştırmasını atlar.
    Dosya eksikse heartbeat yine çalışır ve model ne yapacağına karar verir.

    Ajan başına geçersiz kılmalar `agents.list[].heartbeat` kullanır. Belgeler: [Heartbeat](/tr/gateway/heartbeat).

  </Accordion>

  <Accordion title='Bir WhatsApp grubuna "bot hesabı" eklemem gerekiyor mu?'>
    Hayır. OpenClaw **kendi hesabınızda** çalışır, bu yüzden gruptaysanız OpenClaw bunu görebilir.
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
    Seçenek 1 (en hızlısı): günlükleri takip edin ve grupta bir test mesajı gönderin:

    ```bash
    openclaw logs --follow --json
    ```

    `@g.us` ile biten `chatId` (veya `from`) alanını arayın, örneğin:
    `1234567890-1234567890@g.us`.

    Seçenek 2 (zaten yapılandırılmış/izin listesine alınmışsa): grupları yapılandırmadan listeleyin:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    Belgeler: [WhatsApp](/tr/channels/whatsapp), [Dizin](/tr/cli/directory), [Günlükler](/tr/cli/logs).

  </Accordion>

  <Accordion title="OpenClaw neden bir grupta yanıt vermiyor?">
    İki yaygın neden:

    - Bahsetme kapısı açık (varsayılan). Botu @mention etmelisiniz (veya `mentionPatterns` ile eşleşmelisiniz).
    - `channels.whatsapp.groups` yapılandırdınız ancak `"*"` eklemediniz ve grup izin listesinde değil.

    Bkz. [Gruplar](/tr/channels/groups) ve [Grup mesajları](/tr/channels/group-messages).

  </Accordion>

  <Accordion title="Gruplar/iş parçacıkları DM'lerle bağlam paylaşır mı?">
    Doğrudan sohbetler varsayılan olarak ana oturuma daraltılır. Grupların/kanalların kendi oturum anahtarları vardır ve Telegram konuları / Discord iş parçacıkları ayrı oturumlardır. Bkz. [Gruplar](/tr/channels/groups) ve [Grup mesajları](/tr/channels/group-messages).
  </Accordion>

  <Accordion title="Kaç çalışma alanı ve aracı oluşturabilirim?">
    Kesin sınır yok. Düzinelerce (hatta yüzlerce) sorun olmaz, ancak şunlara dikkat edin:

    - **Disk büyümesi:** oturumlar + dökümler `~/.openclaw/agents/<agentId>/sessions/` altında tutulur.
    - **Token maliyeti:** daha fazla aracı, daha fazla eşzamanlı model kullanımı demektir.
    - **Operasyon yükü:** aracı başına auth profilleri, çalışma alanları ve kanal yönlendirmesi.

    İpuçları:

    - Aracı başına bir **aktif** çalışma alanı tutun (`agents.defaults.workspace`).
    - Disk büyürse eski oturumları budayın (JSONL veya store girdilerini silin).
    - Başıboş çalışma alanlarını ve profil uyumsuzluklarını tespit etmek için `openclaw doctor` kullanın.

  </Accordion>

  <Accordion title="Aynı anda birden fazla bot veya sohbet çalıştırabilir miyim (Slack) ve bunu nasıl kurmalıyım?">
    Evet. Birden fazla yalıtılmış aracı çalıştırmak ve gelen iletileri
    kanal/hesap/eş taraf bazında yönlendirmek için **Çok Aracılı Yönlendirme** kullanın. Slack bir kanal olarak desteklenir ve belirli aracılara bağlanabilir.

    Tarayıcı erişimi güçlüdür, ancak "bir insanın yapabildiği her şeyi yap" anlamına gelmez; bot önleme, CAPTCHA'lar ve MFA
    otomasyonu yine de engelleyebilir. En güvenilir tarayıcı denetimi için host üzerinde yerel Chrome MCP kullanın
    veya tarayıcıyı gerçekten çalıştıran makinede CDP kullanın.

    En iyi uygulama kurulumu:

    - Her zaman açık Gateway hostu (VPS/Mac mini).
    - Rol başına bir aracı (bağlamalar).
    - Bu aracılara bağlı Slack kanalları.
    - Gerektiğinde Chrome MCP veya bir Node üzerinden yerel tarayıcı.

    Dokümanlar: [Çok Aracılı Yönlendirme](/tr/concepts/multi-agent), [Slack](/tr/channels/slack),
    [Tarayıcı](/tr/tools/browser), [Node'lar](/tr/nodes).

  </Accordion>
</AccordionGroup>

## Modeller, failover ve auth profilleri

Model SSS'si — varsayılanlar, seçim, takma adlar, geçiş, failover, auth profilleri —
[Modeller SSS](/tr/help/faq-models) sayfasında yer alır.

## Gateway: portlar, "already running" ve uzak mod

<AccordionGroup>
  <Accordion title="Gateway hangi portu kullanır?">
    `gateway.port`, WebSocket + HTTP (Control UI, hook'lar vb.) için tek çoğullamalı portu denetler.

    Öncelik sırası:

    ```
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > default 18789
    ```

  </Accordion>

  <Accordion title='openclaw gateway status neden "Runtime: running" ama "Connectivity probe: failed" diyor?'>
    Çünkü "running", **supervisor'ın** görünümüdür (launchd/systemd/schtasks). Bağlantı yoklaması ise CLI'nin gateway WebSocket'e gerçekten bağlanmasıdır.

    `openclaw gateway status` kullanın ve şu satırlara güvenin:

    - `Probe target:` (yoklamanın gerçekten kullandığı URL)
    - `Listening:` (portta gerçekten bağlı olan şey)
    - `Last gateway error:` (süreç canlıyken port dinlemiyorsa yaygın kök neden)

  </Accordion>

  <Accordion title='openclaw gateway status neden "Config (cli)" ve "Config (service)" değerlerini farklı gösteriyor?'>
    Hizmet başka bir config dosyasıyla çalışırken siz başka bir config dosyasını düzenliyorsunuz (çoğu zaman `--profile` / `OPENCLAW_STATE_DIR` uyumsuzluğu).

    Düzeltme:

    ```bash
    openclaw gateway install --force
    ```

    Bunu hizmetin kullanmasını istediğiniz aynı `--profile` / ortamdan çalıştırın.

  </Accordion>

  <Accordion title='"another gateway instance is already listening" ne anlama gelir?'>
    OpenClaw, başlatma sırasında WebSocket dinleyicisini hemen bağlayarak bir çalışma zamanı kilidi uygular (varsayılan `ws://127.0.0.1:18789`). Bağlama `EADDRINUSE` ile başarısız olursa, başka bir örneğin zaten dinlediğini belirten `GatewayLockError` fırlatır.

    Düzeltme: diğer örneği durdurun, portu boşaltın veya `openclaw gateway --port <port>` ile çalıştırın.

  </Accordion>

  <Accordion title="OpenClaw'ı uzak modda nasıl çalıştırırım (istemci başka yerdeki bir Gateway'e bağlanır)?">
    `gateway.mode: "remote"` ayarlayın ve isteğe bağlı olarak paylaşılan gizli uzak kimlik bilgileriyle bir uzak WebSocket URL'sine yönlendirin:

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

    - `openclaw gateway` yalnızca `gateway.mode` `local` olduğunda (veya override bayrağını verdiğinizde) başlar.
    - macOS uygulaması config dosyasını izler ve bu değerler değiştiğinde modları canlı olarak değiştirir.
    - `gateway.remote.token` / `.password` yalnızca istemci tarafı uzak kimlik bilgileridir; tek başlarına yerel gateway auth'u etkinleştirmezler.

  </Accordion>

  <Accordion title='Control UI "unauthorized" diyor (veya yeniden bağlanmayı sürdürüyor). Şimdi ne yapmalıyım?'>
    Gateway auth yolunuz ile UI'nin auth yöntemi eşleşmiyor.

    Gerçekler (koddan):

    - Control UI, token'ı geçerli tarayıcı sekmesi oturumu ve seçili gateway URL'si için `sessionStorage` içinde tutar; böylece aynı sekme yenilemeleri, uzun ömürlü localStorage token kalıcılığını geri getirmeden çalışmaya devam eder.
    - `AUTH_TOKEN_MISMATCH` durumunda, gateway yeniden deneme ipuçları döndürdüğünde (`canRetryWithDeviceToken=true`, `recommendedNextStep=retry_with_device_token`), güvenilen istemciler önbelleğe alınmış bir cihaz token'ı ile sınırlı bir yeniden deneme yapabilir.
    - Bu önbelleğe alınmış token yeniden denemesi artık cihaz token'ı ile saklanan önbelleğe alınmış onaylı kapsamları yeniden kullanır. Açık `deviceToken` / açık `scopes` çağırıcıları, önbelleğe alınmış kapsamları devralmak yerine istenen kapsam kümesini korumaya devam eder.
    - Bu yeniden deneme yolu dışında, bağlantı auth önceliği önce açık paylaşılan token/parola, ardından açık `deviceToken`, ardından saklanan cihaz token'ı, ardından bootstrap token'dır.
    - Bootstrap token kapsam denetimleri rol ön eklidir. Yerleşik bootstrap operatör allowlist'i yalnızca operatör isteklerini karşılar; node veya diğer operatör olmayan rollerin yine de kendi rol ön ekleri altında kapsamlara ihtiyacı vardır.

    Düzeltme:

    - En hızlısı: `openclaw dashboard` (dashboard URL'sini yazdırır + kopyalar, açmayı dener; başsızsa SSH ipucu gösterir).
    - Henüz token'ınız yoksa: `openclaw doctor --generate-gateway-token`.
    - Uzaksa, önce tünel açın: `ssh -N -L 18789:127.0.0.1:18789 user@host`, ardından `http://127.0.0.1:18789/` açın.
    - Paylaşılan gizli mod: `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` veya `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` ayarlayın, ardından eşleşen gizli değeri Control UI ayarlarına yapıştırın.
    - Tailscale Serve modu: `gateway.auth.allowTailscale` etkin olduğundan ve Tailscale kimlik başlıklarını atlayan ham loopback/tailnet URL'si değil, Serve URL'sini açtığınızdan emin olun.
    - Güvenilen proxy modu: ham gateway URL'si değil, yapılandırılmış kimlik farkındalıklı proxy üzerinden geldiğinizden emin olun. Aynı host local loopback proxy'leri için de `gateway.auth.trustedProxy.allowLoopback = true` gerekir.
    - Tek yeniden denemeden sonra uyumsuzluk sürerse, eşleştirilmiş cihaz token'ını döndürün/yeniden onaylayın:
      - `openclaw devices list`
      - `openclaw devices rotate --device <id> --role operator`
    - Bu rotate çağrısı reddedildiğini söylüyorsa iki şeyi denetleyin:
      - eşleştirilmiş cihaz oturumları, `operator.admin` yetkisine de sahip değillerse yalnızca **kendi** cihazlarını döndürebilir
      - açık `--scope` değerleri, çağıranın geçerli operatör kapsamlarını aşamaz
    - Hâlâ takıldıysanız `openclaw status --all` çalıştırın ve [Sorun giderme](/tr/gateway/troubleshooting) adımlarını izleyin. Auth ayrıntıları için [Dashboard](/tr/web/dashboard) bölümüne bakın.

  </Accordion>

  <Accordion title="gateway.bind tailnet ayarladım ama bağlanamıyor ve hiçbir şey dinlemiyor">
    `tailnet` bağlaması, ağ arayüzlerinizden bir Tailscale IP'si seçer (100.64.0.0/10). Makine Tailscale üzerinde değilse (veya arayüz kapalıysa), bağlanacak bir şey yoktur.

    Düzeltme:

    - Bu hostta Tailscale'i başlatın (böylece 100.x adresi olur), veya
    - `gateway.bind: "loopback"` / `"lan"` değerine geçin.

    Not: `tailnet` açık bir ayardır. `auto` loopback'i tercih eder; yalnızca tailnet'e bağlanmak istediğinizde `gateway.bind: "tailnet"` kullanın.

  </Accordion>

  <Accordion title="Aynı host üzerinde birden fazla Gateway çalıştırabilir miyim?">
    Genellikle hayır; bir Gateway birden fazla mesajlaşma kanalını ve aracıyı çalıştırabilir. Birden fazla Gateway'i yalnızca yedeklilik (örn. kurtarma botu) veya katı yalıtım gerektiğinde kullanın.

    Evet, ancak yalıtmanız gerekir:

    - `OPENCLAW_CONFIG_PATH` (örnek başına config)
    - `OPENCLAW_STATE_DIR` (örnek başına durum)
    - `agents.defaults.workspace` (çalışma alanı yalıtımı)
    - `gateway.port` (benzersiz portlar)

    Hızlı kurulum (önerilir):

    - Her örnek için `openclaw --profile <name> ...` kullanın (`~/.openclaw-<name>` otomatik oluşturulur).
    - Her profil config'inde benzersiz bir `gateway.port` ayarlayın (veya manuel çalıştırmalar için `--port` verin).
    - Profil başına hizmet kurun: `openclaw --profile <name> gateway install`.

    Profiller hizmet adlarına da sonek ekler (`ai.openclaw.<profile>`; eski `com.openclaw.*`, `openclaw-gateway-<profile>.service`, `OpenClaw Gateway (<profile>)`).
    Tam kılavuz: [Birden fazla gateway](/tr/gateway/multiple-gateways).

  </Accordion>

  <Accordion title='"invalid handshake" / kod 1008 ne anlama gelir?'>
    Gateway bir **WebSocket sunucusudur** ve ilk iletinin
    bir `connect` frame'i olmasını bekler. Başka bir şey alırsa, bağlantıyı
    **kod 1008** (ilke ihlali) ile kapatır.

    Yaygın nedenler:

    - WS istemcisi yerine tarayıcıda **HTTP** URL'sini açtınız (`http://...`).
    - Yanlış portu veya yolu kullandınız.
    - Bir proxy veya tünel auth başlıklarını çıkardı ya da Gateway olmayan bir istek gönderdi.

    Hızlı düzeltmeler:

    1. WS URL'sini kullanın: `ws://<host>:18789` (veya HTTPS ise `wss://...`).
    2. WS portunu normal bir tarayıcı sekmesinde açmayın.
    3. Auth açıksa, token/parolayı `connect` frame'ine ekleyin.

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

    En hızlı günlük takibi:

    ```bash
    openclaw logs --follow
    ```

    Hizmet/supervisor günlükleri (gateway launchd/systemd üzerinden çalıştığında):

    - macOS: `$OPENCLAW_STATE_DIR/logs/gateway.log` ve `gateway.err.log` (varsayılan: `~/.openclaw/logs/...`; profiller `~/.openclaw-<profile>/logs/...` kullanır)
    - Linux: `journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`
    - Windows: `schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`

    Daha fazlası için [Sorun giderme](/tr/gateway/troubleshooting) bölümüne bakın.

  </Accordion>

  <Accordion title="Gateway hizmetini nasıl başlatır/durdurur/yeniden başlatırım?">
    Gateway yardımcılarını kullanın:

    ```bash
    openclaw gateway status
    openclaw gateway restart
    ```

    Gateway'i manuel çalıştırıyorsanız, `openclaw gateway --force` portu geri alabilir. [Gateway](/tr/gateway) bölümüne bakın.

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

    Hizmeti hiç kurmadıysanız, ön planda başlatın:

    ```bash
    openclaw gateway run
    ```

    **2) Yerel Windows (önerilmez):** Gateway doğrudan Windows'ta çalışır.

    PowerShell'i açın ve çalıştırın:

    ```powershell
    openclaw gateway status
    openclaw gateway restart
    ```

    Manuel çalıştırıyorsanız (hizmet yoksa), şunu kullanın:

    ```powershell
    openclaw gateway run
    ```

    Dokümanlar: [Windows (WSL2)](/tr/platforms/windows), [Gateway hizmet runbook'u](/tr/gateway).

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

    - Model kimlik doğrulaması **Gateway ana makinesinde** yüklenmemiş (`models status` komutunu kontrol edin).
    - Kanal eşleştirme/izin listesi yanıtları engelliyor (kanal yapılandırmasını + günlükleri kontrol edin).
    - WebChat/Dashboard doğru token olmadan açık.

    Uzaktaysanız, tünel/Tailscale bağlantısının açık olduğunu ve
    Gateway WebSocket'ine erişilebildiğini doğrulayın.

    Dokümanlar: [Kanallar](/tr/channels), [Sorun giderme](/tr/gateway/troubleshooting), [Uzaktan erişim](/tr/gateway/remote).

  </Accordion>

  <Accordion title='"Gateway bağlantısı kesildi: neden yok" - şimdi ne yapmalı?'>
    Bu genellikle UI'nin WebSocket bağlantısını kaybettiği anlamına gelir. Şunları kontrol edin:

    1. Gateway çalışıyor mu? `openclaw gateway status`
    2. Gateway sağlıklı mı? `openclaw status`
    3. UI doğru token'a sahip mi? `openclaw dashboard`
    4. Uzaktaysa, tünel/Tailscale bağlantısı açık mı?

    Ardından günlükleri izleyin:

    ```bash
    openclaw logs --follow
    ```

    Dokümanlar: [Dashboard](/tr/web/dashboard), [Uzaktan erişim](/tr/gateway/remote), [Sorun giderme](/tr/gateway/troubleshooting).

  </Accordion>

  <Accordion title="Telegram setMyCommands başarısız oluyor. Neyi kontrol etmeliyim?">
    Günlükler ve kanal durumuyla başlayın:

    ```bash
    openclaw channels status
    openclaw channels logs --channel telegram
    ```

    Ardından hatayı eşleştirin:

    - `BOT_COMMANDS_TOO_MUCH`: Telegram menüsünde çok fazla giriş var. OpenClaw zaten Telegram sınırına göre kırpar ve daha az komutla yeniden dener, ancak bazı menü girişlerinin yine de kaldırılması gerekir. Plugin/skill/özel komutları azaltın veya menüye ihtiyacınız yoksa `channels.telegram.commands.native` seçeneğini devre dışı bırakın.
    - `TypeError: fetch failed`, `Network request for 'setMyCommands' failed!` veya benzer ağ hataları: Bir VPS üzerindeyseniz veya proxy arkasındaysanız, dışa giden HTTPS'e izin verildiğini ve DNS'in `api.telegram.org` için çalıştığını doğrulayın.

    Gateway uzaktaysa, Gateway ana makinesindeki günlüklere baktığınızdan emin olun.

    Dokümanlar: [Telegram](/tr/channels/telegram), [Kanal sorunlarını giderme](/tr/channels/troubleshooting).

  </Accordion>

  <Accordion title="TUI çıktı göstermiyor. Neyi kontrol etmeliyim?">
    Önce Gateway'e erişilebildiğini ve aracının çalışabildiğini doğrulayın:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    TUI içinde mevcut durumu görmek için `/status` kullanın. Bir sohbet
    kanalında yanıt bekliyorsanız teslimin etkin olduğundan emin olun (`/deliver on`).

    Dokümanlar: [TUI](/tr/web/tui), [Eğik çizgi komutları](/tr/tools/slash-commands).

  </Accordion>

  <Accordion title="Gateway'i tamamen durdurup sonra nasıl başlatırım?">
    Hizmeti yüklediyseniz:

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    Bu, **denetimli hizmeti** durdurur/başlatır (macOS'ta launchd, Linux'ta systemd).
    Gateway arka planda bir daemon olarak çalıştığında bunu kullanın.

    Ön planda çalıştırıyorsanız Ctrl-C ile durdurun, ardından:

    ```bash
    openclaw gateway run
    ```

    Dokümanlar: [Gateway servis çalışma kılavuzu](/tr/gateway).

  </Accordion>

  <Accordion title="ELI5: openclaw gateway restart ile openclaw gateway">
    - `openclaw gateway restart`: **arka plan hizmetini** yeniden başlatır (launchd/systemd).
    - `openclaw gateway`: bu terminal oturumu için gateway'i **ön planda** çalıştırır.

    Hizmeti yüklediyseniz gateway komutlarını kullanın. Tek seferlik, ön planda
    çalıştırma istediğinizde `openclaw gateway` kullanın.

  </Accordion>

  <Accordion title="Bir şey başarısız olduğunda daha fazla ayrıntı almanın en hızlı yolu">
    Daha fazla konsol ayrıntısı almak için Gateway'i `--verbose` ile başlatın. Ardından kanal kimlik doğrulaması, model yönlendirme ve RPC hataları için günlük dosyasını inceleyin.
  </Accordion>
</AccordionGroup>

## Medya ve ekler

<AccordionGroup>
  <Accordion title="Skill'im bir görsel/PDF oluşturdu, ancak hiçbir şey gönderilmedi">
    Aracıdan giden ekler, kendi satırında bir `MEDIA:<path-or-url>` satırı içermelidir. Bkz. [OpenClaw asistan kurulumu](/tr/start/openclaw) ve [Aracı gönderimi](/tr/tools/agent-send).

    CLI gönderimi:

    ```bash
    openclaw message send --target +15555550123 --message "Here you go" --media /path/to/file.png
    ```

    Şunları da kontrol edin:

    - Hedef kanal giden medyayı destekliyor ve izin listeleri tarafından engellenmiyor.
    - Dosya, sağlayıcının boyut sınırları içinde (görseller en fazla 2048 px'e yeniden boyutlandırılır).
    - `tools.fs.workspaceOnly=true`, yerel yol gönderimlerini çalışma alanı, temp/media-store ve sandbox doğrulamalı dosyalarla sınırlı tutar.
    - `tools.fs.workspaceOnly=false`, `MEDIA:` ile aracının zaten okuyabildiği ana makine yerel dosyalarının gönderilmesine izin verir, ancak yalnızca medya ve güvenli belge türleri için (görseller, ses, video, PDF ve Office dokümanları). Düz metin ve gizli bilgiye benzeyen dosyalar yine de engellenir.

    Bkz. [Görseller](/tr/nodes/images).

  </Accordion>
</AccordionGroup>

## Güvenlik ve erişim denetimi

<AccordionGroup>
  <Accordion title="OpenClaw'u gelen DM'lere açmak güvenli mi?">
    Gelen DM'leri güvenilmeyen girdi olarak ele alın. Varsayılanlar riski azaltacak şekilde tasarlanmıştır:

    - DM destekli kanallarda varsayılan davranış **eşleştirme**dir:
      - Bilinmeyen gönderenler bir eşleştirme kodu alır; bot mesajlarını işlemez.
      - Şununla onaylayın: `openclaw pairing approve --channel <channel> [--account <id>] <code>`
      - Bekleyen istekler **kanal başına 3** ile sınırlıdır; kod gelmediyse `openclaw pairing list --channel <channel> [--account <id>]` komutunu kontrol edin.
    - DM'leri herkese açık hale getirmek açık onay gerektirir (`dmPolicy: "open"` ve izin listesi `"*"`).

    Riskli DM politikalarını ortaya çıkarmak için `openclaw doctor` çalıştırın.

  </Accordion>

  <Accordion title="Prompt enjeksiyonu yalnızca herkese açık botlar için mi sorun?">
    Hayır. Prompt enjeksiyonu, yalnızca bota kimin DM gönderebildiğiyle değil, **güvenilmeyen içerikle** ilgilidir.
    Asistanınız harici içerik okuyorsa (web araması/getirme, tarayıcı sayfaları, e-postalar,
    dokümanlar, ekler, yapıştırılmış günlükler), bu içerik modeli ele geçirmeye çalışan
    talimatlar içerebilir. **Tek gönderen siz olsanız** bile bu olabilir.

    En büyük risk araçlar etkin olduğunda ortaya çıkar: model, bağlamı sızdırmaya veya sizin adınıza araç çağırmaya
    kandırılabilir. Etki alanını azaltmak için:

    - güvenilmeyen içeriği özetlemek üzere salt okunur veya araçları devre dışı bırakılmış bir "okuyucu" aracı kullanın
    - araçları etkin aracılar için `web_search` / `web_fetch` / `browser` kapalı tutun
    - çözümlenmiş dosya/doküman metnini de güvenilmeyen kabul edin: OpenResponses
      `input_file` ve medya eki çıkarma işlemleri, ham dosya metnini geçirmek yerine
      çıkarılan metni açık harici içerik sınır işaretleriyle sarar
    - sandbox kullanımı ve sıkı araç izin listeleri

    Ayrıntılar: [Güvenlik](/tr/gateway/security).

  </Accordion>

  <Accordion title="Botumun kendi e-postası, GitHub hesabı veya telefon numarası olmalı mı?">
    Evet, çoğu kurulum için. Botu ayrı hesaplar ve telefon numaralarıyla izole etmek,
    bir şey ters giderse etki alanını azaltır. Bu ayrıca kişisel hesaplarınızı etkilemeden
    kimlik bilgilerini döndürmeyi veya erişimi iptal etmeyi kolaylaştırır.

    Küçük başlayın. Yalnızca gerçekten ihtiyaç duyduğunuz araçlara ve hesaplara erişim verin, gerekirse
    daha sonra genişletin.

    Dokümanlar: [Güvenlik](/tr/gateway/security), [Eşleştirme](/tr/channels/pairing).

  </Accordion>

  <Accordion title="Metin mesajlarım üzerinde ona özerklik verebilir miyim ve bu güvenli mi?">
    Kişisel mesajlarınız üzerinde tam özerklik önermiyoruz. En güvenli kalıp şudur:

    - DM'leri **eşleştirme modunda** veya dar bir izin listesinde tutun.
    - Sizin adınıza mesaj atmasını istiyorsanız **ayrı bir numara veya hesap** kullanın.
    - Taslak oluşturmasına izin verin, ardından **göndermeden önce onaylayın**.

    Denemek istiyorsanız bunu ayrılmış bir hesapta yapın ve izole tutun. Bkz.
    [Güvenlik](/tr/gateway/security).

  </Accordion>

  <Accordion title="Kişisel asistan görevleri için daha ucuz modeller kullanabilir miyim?">
    Evet, aracı yalnızca sohbet amaçlıysa ve girdi güvenilirse. Daha küçük katmanlar
    talimat ele geçirmeye daha yatkındır, bu yüzden araçları etkin aracılarda
    veya güvenilmeyen içerik okurken bunlardan kaçının. Daha küçük bir model kullanmanız gerekiyorsa,
    araçları sıkı şekilde sınırlayın ve sandbox içinde çalıştırın. Bkz. [Güvenlik](/tr/gateway/security).
  </Accordion>

  <Accordion title="Telegram'da /start çalıştırdım ama eşleştirme kodu almadım">
    Eşleştirme kodları **yalnızca** bilinmeyen bir gönderen bota mesaj attığında ve
    `dmPolicy: "pairing"` etkin olduğunda gönderilir. `/start` tek başına kod oluşturmaz.

    Bekleyen istekleri kontrol edin:

    ```bash
    openclaw pairing list telegram
    ```

    Hemen erişim istiyorsanız, gönderen kimliğinizi izin listesine alın veya o hesap için
    `dmPolicy: "open"` ayarlayın.

  </Accordion>

  <Accordion title="WhatsApp: kişilerime mesaj atar mı? Eşleştirme nasıl çalışır?">
    Hayır. Varsayılan WhatsApp DM politikası **eşleştirme**dir. Bilinmeyen gönderenler yalnızca bir eşleştirme kodu alır ve mesajları **işlenmez**. OpenClaw yalnızca aldığı sohbetlere veya sizin açıkça tetiklediğiniz gönderimlere yanıt verir.

    Eşleştirmeyi şununla onaylayın:

    ```bash
    openclaw pairing approve whatsapp <code>
    ```

    Bekleyen istekleri listeleyin:

    ```bash
    openclaw pairing list whatsapp
    ```

    Sihirbaz telefon numarası istemi: kendi DM'lerinize izin verilmesi için **izin listenizi/sahibinizi** ayarlamak üzere kullanılır. Otomatik gönderim için kullanılmaz. Kişisel WhatsApp numaranızda çalıştırıyorsanız, o numarayı kullanın ve `channels.whatsapp.selfChatMode` etkinleştirin.

  </Accordion>
</AccordionGroup>

## Sohbet komutları, görevleri iptal etme ve "durmuyor"

<AccordionGroup>
  <Accordion title="Dahili sistem mesajlarının sohbette görünmesini nasıl durdururum?">
    Çoğu dahili veya araç mesajı yalnızca o oturum için **ayrıntılı**, **izleme** veya **akıl yürütme** etkin olduğunda
    görünür.

    Bunu gördüğünüz sohbette düzeltin:

    ```
    /verbose off
    /trace off
    /reasoning off
    ```

    Hâlâ gürültülüyse, Control UI'da oturum ayarlarını kontrol edin ve ayrıntılı modu
    **devral** olarak ayarlayın. Ayrıca yapılandırmada `verboseDefault` değeri
    `on` olan bir bot profili kullanmadığınızı doğrulayın.

    Dokümanlar: [Düşünme ve ayrıntılı çıktı](/tr/tools/thinking), [Güvenlik](/tr/gateway/security/index#reasoning-and-verbose-output-in-groups).

  </Accordion>

  <Accordion title="Çalışan bir görevi nasıl durdurur/iptal ederim?">
    Bunlardan herhangi birini **bağımsız bir mesaj olarak** gönderin (eğik çizgi yok):

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

    Bunlar iptal tetikleyicileridir (eğik çizgi komutları değil).

    Arka plan işlemleri için (exec aracından), aracıdan şunu çalıştırmasını isteyebilirsiniz:

    ```
    process action:kill sessionId:XXX
    ```

    Eğik çizgi komutlarına genel bakış: bkz. [Eğik çizgi komutları](/tr/tools/slash-commands).

    Çoğu komut `/` ile başlayan **bağımsız** bir mesaj olarak gönderilmelidir, ancak bazı kısayollar (`/status` gibi) izin listesindeki gönderenler için satır içinde de çalışır.

  </Accordion>

  <Accordion title='Telegram'dan Discord mesajı nasıl gönderirim? ("Bağlamlar arası mesajlaşma reddedildi")'>
    OpenClaw varsayılan olarak **sağlayıcılar arası** mesajlaşmayı engeller. Bir araç çağrısı
    Telegram'a bağlıysa, siz açıkça izin vermedikçe Discord'a göndermez.

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

    Yapılandırmayı düzenledikten sonra gateway'i yeniden başlatın.

  </Accordion>

  <Accordion title='Bot neden hızlı peş peşe gelen mesajları "yok sayıyor" gibi hissettiriyor?'>
    Kuyruk modu, yeni mesajların devam eden bir çalıştırmayla nasıl etkileşime girdiğini kontrol eder. Modları değiştirmek için `/queue` kullanın:

    - `steer` - mevcut çalıştırmadaki bir sonraki model sınırı için bekleyen tüm yönlendirmeyi kuyruğa al
    - `queue` - eski, tek seferde bir yönlendirme
    - `followup` - mesajları tek tek çalıştır
    - `collect` - mesajları toplu işle ve bir kez yanıtla
    - `steer-backlog` - şimdi yönlendir, ardından birikmiş işleri işle
    - `interrupt` - mevcut çalıştırmayı iptal et ve baştan başla

    Varsayılan mod `steer` şeklindedir. followup modları için `debounce:0.5s cap:25 drop:summarize` gibi seçenekler ekleyebilirsiniz. Bkz. [Komut kuyruğu](/tr/concepts/queue) ve [Yönlendirme kuyruğu](/tr/concepts/queue-steering).

  </Accordion>
</AccordionGroup>

## Çeşitli

<AccordionGroup>
  <Accordion title='API anahtarıyla Anthropic için varsayılan model nedir?'>
    OpenClaw'da kimlik bilgileri ve model seçimi ayrıdır. `ANTHROPIC_API_KEY` ayarını yapmak (veya kimlik doğrulama profillerinde bir Anthropic API anahtarı saklamak) kimlik doğrulamayı etkinleştirir, ancak gerçek varsayılan model `agents.defaults.model.primary` içinde yapılandırdığınız modeldir (örneğin, `anthropic/claude-sonnet-4-6` veya `anthropic/claude-opus-4-6`). `No credentials found for profile "anthropic:default"` görürseniz, bu Gateway'in çalışan agent için beklenen `auth-profiles.json` içinde Anthropic kimlik bilgilerini bulamadığı anlamına gelir.
  </Accordion>
</AccordionGroup>

---

Hâlâ takıldınız mı? [Discord](https://discord.com/invite/clawd) üzerinden sorun veya bir [GitHub tartışması](https://github.com/openclaw/openclaw/discussions) açın.

## İlgili

- [İlk çalıştırma SSS](/tr/help/faq-first-run) — kurulum, ilk katılım, kimlik doğrulama, abonelikler, erken hatalar
- [Modeller SSS](/tr/help/faq-models) — model seçimi, yük devretme, kimlik doğrulama profilleri
- [Sorun giderme](/tr/help/troubleshooting) — belirti öncelikli triyaj
