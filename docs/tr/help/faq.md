---
read_when:
    - Yaygın kurulum, yükleme, ilk katılım veya çalışma zamanı destek sorularını yanıtlama
    - Daha kapsamlı hata ayıklamadan önce kullanıcılar tarafından bildirilen sorunları ön değerlendirmeden geçirme
summary: OpenClaw kurulumu, yapılandırması ve kullanımı hakkında sık sorulan sorular
title: SSS
x-i18n:
    generated_at: "2026-05-12T00:58:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 57e42ea34d4f53cb9e6f0e9c175fd553a67e70aaca08a09be28f0bde43414bc8
    source_path: help/faq.md
    workflow: 16
---

Hızlı yanıtlar ve gerçek dünya kurulumları (yerel geliştirme, VPS, çok ajanlı kullanım, OAuth/API anahtarları, model devretme) için daha derin sorun giderme. Çalışma zamanı tanılaması için bkz. [Sorun giderme](/tr/gateway/troubleshooting). Tam yapılandırma referansı için bkz. [Yapılandırma](/tr/gateway/configuration).

## Bir şey bozuksa ilk 60 saniye

1. **Hızlı durum (ilk kontrol)**

   ```bash
   openclaw status
   ```

   Hızlı yerel özet: OS + güncelleme, gateway/hizmet erişilebilirliği, ajanlar/oturumlar, sağlayıcı yapılandırması + çalışma zamanı sorunları (gateway erişilebilir olduğunda).

2. **Yapıştırılabilir rapor (paylaşması güvenli)**

   ```bash
   openclaw status --all
   ```

   Günlük kuyruğuyla salt okunur tanılama (token'lar maskelenir).

3. **Daemon + port durumu**

   ```bash
   openclaw gateway status
   ```

   Supervisor çalışma zamanına karşı RPC erişilebilirliğini, yoklama hedef URL'sini ve hizmetin büyük olasılıkla hangi yapılandırmayı kullandığını gösterir.

4. **Derin yoklamalar**

   ```bash
   openclaw status --deep
   ```

   Desteklendiğinde kanal yoklamaları dahil olmak üzere canlı bir gateway sağlık yoklaması çalıştırır
   (erişilebilir bir gateway gerektirir). Bkz. [Sağlık](/tr/gateway/health).

5. **En son günlüğü takip et**

   ```bash
   openclaw logs --follow
   ```

   RPC kapalıysa şuna geri dönün:

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   Dosya günlükleri hizmet günlüklerinden ayrıdır; bkz. [Günlükleme](/tr/logging) ve [Sorun giderme](/tr/gateway/troubleshooting).

6. **Doctor'ı çalıştır (onarımlar)**

   ```bash
   openclaw doctor
   ```

   Yapılandırmayı/durumu onarır/geçirir + sağlık kontrolleri çalıştırır. Bkz. [Doctor](/tr/gateway/doctor).

7. **Gateway anlık görüntüsü**

   ```bash
   openclaw health --json
   openclaw health --verbose   # hatalarda hedef URL'yi + yapılandırma yolunu gösterir
   ```

   Çalışan gateway'den tam bir anlık görüntü ister (yalnızca WS). Bkz. [Sağlık](/tr/gateway/health).

## Hızlı başlangıç ve ilk çalıştırma kurulumu

İlk çalıştırma SSS'si — kurulum, onboarding, kimlik doğrulama rotaları, abonelikler, ilk hatalar —
[İlk çalıştırma SSS](/tr/help/faq-first-run) sayfasında yer alır.

## OpenClaw nedir?

<AccordionGroup>
  <Accordion title="OpenClaw tek paragrafta nedir?">
    OpenClaw, kendi cihazlarınızda çalıştırdığınız kişisel bir AI asistanıdır. Zaten kullandığınız mesajlaşma yüzeylerinde (WhatsApp, Telegram, Slack, Mattermost, Discord, Google Chat, Signal, iMessage, WebChat ve QQ Bot gibi birlikte gelen kanal plugin'leri) yanıt verir ve desteklenen platformlarda ses + canlı Canvas da sağlayabilir. **Gateway** her zaman açık kontrol düzlemidir; asistan ise üründür.
  </Accordion>

  <Accordion title="Değer önerisi">
    OpenClaw "sadece bir Claude sarmalayıcısı" değildir. Zaten kullandığınız sohbet uygulamalarından erişilebilen, durum bilgili oturumlar, bellek ve araçlarla **kendi donanımınızda** yetenekli bir asistan çalıştırmanızı sağlayan **yerel öncelikli bir kontrol düzlemidir**; iş akışlarınızın kontrolünü barındırılan bir SaaS'a devretmeniz gerekmez.

    Öne çıkanlar:

    - **Cihazlarınız, verileriniz:** Gateway'i istediğiniz yerde (Mac, Linux, VPS) çalıştırın ve çalışma alanını + oturum geçmişini yerel tutun.
    - **Web sanal alanı değil, gerçek kanallar:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage/vb, ayrıca desteklenen platformlarda mobil ses ve Canvas.
    - **Modelden bağımsız:** Ajan başına yönlendirme ve devretme ile Anthropic, OpenAI, MiniMax, OpenRouter vb. kullanın.
    - **Yalnızca yerel seçeneği:** İsterseniz **tüm verilerin cihazınızda kalabilmesi** için yerel modeller çalıştırın.
    - **Çok ajanlı yönlendirme:** Her biri kendi çalışma alanına ve varsayılanlarına sahip, kanal, hesap veya görev başına ayrı ajanlar.
    - **Açık kaynak ve değiştirilebilir:** Tedarikçi kilidine takılmadan inceleyin, genişletin ve kendi kendinize barındırın.

    Belgeler: [Gateway](/tr/gateway), [Kanallar](/tr/channels), [Çok ajanlı](/tr/concepts/multi-agent),
    [Bellek](/tr/concepts/memory).

  </Accordion>

  <Accordion title="Yeni kurdum - önce ne yapmalıyım?">
    İyi ilk projeler:

    - Bir web sitesi oluşturun (WordPress, Shopify veya basit bir statik site).
    - Bir mobil uygulama prototipi hazırlayın (taslak, ekranlar, API planı).
    - Dosya ve klasörleri düzenleyin (temizleme, adlandırma, etiketleme).
    - Gmail'i bağlayın ve özetleri ya da takipleri otomatikleştirin.

    Büyük görevleri işleyebilir, ancak bunları aşamalara böldüğünüzde ve
    paralel çalışma için alt ajanlar kullandığınızda en iyi sonucu verir.

  </Accordion>

  <Accordion title="OpenClaw için en iyi beş günlük kullanım senaryosu nedir?">
    Günlük kazanımlar genellikle şöyle görünür:

    - **Kişisel brifingler:** Gelen kutusu, takvim ve önemsediğiniz haberlerin özetleri.
    - **Araştırma ve taslak hazırlama:** E-postalar veya belgeler için hızlı araştırma, özetler ve ilk taslaklar.
    - **Hatırlatıcılar ve takipler:** Cron veya Heartbeat güdümlü uyarılar ve kontrol listeleri.
    - **Tarayıcı otomasyonu:** Form doldurma, veri toplama ve web görevlerini tekrarlama.
    - **Cihazlar arası koordinasyon:** Telefonunuzdan bir görev gönderin, Gateway'in bunu bir sunucuda çalıştırmasını sağlayın ve sonucu sohbette geri alın.

  </Accordion>

  <Accordion title="OpenClaw bir SaaS için müşteri adayı oluşturma, erişim, reklamlar ve bloglarda yardımcı olabilir mi?">
    **Araştırma, nitelendirme ve taslak hazırlama** için evet. Siteleri tarayabilir, kısa listeler oluşturabilir,
    potansiyel müşterileri özetleyebilir ve erişim ya da reklam metni taslakları yazabilir.

    **Erişim veya reklam kampanyaları** için süreçte bir insan bulundurun. Spam'den kaçının, yerel yasalara ve
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
    - **Her zaman açık Gateway** (VPS üzerinde çalıştırın, her yerden etkileşim kurun)
    - Yerel tarayıcı/ekran/kamera/exec için **Node'lar**

    Vitrin: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills ve otomasyon

<AccordionGroup>
  <Accordion title="Repo'yu kirletmeden skills'i nasıl özelleştiririm?">
    Repo kopyasını düzenlemek yerine yönetilen geçersiz kılmalar kullanın. Değişikliklerinizi `~/.openclaw/skills/<name>/SKILL.md` içine koyun (veya `~/.openclaw/openclaw.json` içindeki `skills.load.extraDirs` ile bir klasör ekleyin). Öncelik sırası `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → birlikte gelenler → `skills.load.extraDirs` şeklindedir; böylece yönetilen geçersiz kılmalar git'e dokunmadan birlikte gelen skills'e karşı yine üstün gelir. Skill'in global olarak kurulu olması ancak yalnızca bazı ajanlara görünmesi gerekiyorsa, paylaşılan kopyayı `~/.openclaw/skills` içinde tutun ve görünürlüğü `agents.defaults.skills` ile `agents.list[].skills` üzerinden kontrol edin. Repo'da yalnızca upstream'e uygun düzenlemeler bulunmalı ve PR olarak gönderilmelidir.
  </Accordion>

  <Accordion title="Skills'i özel bir klasörden yükleyebilir miyim?">
    Evet. `~/.openclaw/openclaw.json` içindeki `skills.load.extraDirs` aracılığıyla ek dizinler ekleyin (en düşük öncelik). Varsayılan öncelik sırası `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → birlikte gelenler → `skills.load.extraDirs` şeklindedir. `clawhub` varsayılan olarak `./skills` içine kurar; OpenClaw bunu bir sonraki oturumda `<workspace>/skills` olarak değerlendirir. Skill yalnızca belirli ajanlara görünmeliyse bunu `agents.defaults.skills` veya `agents.list[].skills` ile eşleştirin.
  </Accordion>

  <Accordion title="Farklı görevler için farklı modelleri nasıl kullanabilirim?">
    Bugün desteklenen desenler şunlardır:

    - **Cron işleri**: yalıtılmış işler, iş başına bir `model` geçersiz kılması ayarlayabilir.
    - **Alt ajanlar**: görevleri farklı varsayılan modellere sahip ayrı ajanlara yönlendirin.
    - **İsteğe bağlı geçiş**: mevcut oturum modelini herhangi bir zamanda değiştirmek için `/model` kullanın.

    Bkz. [Cron işleri](/tr/automation/cron-jobs), [Çok Ajanlı Yönlendirme](/tr/concepts/multi-agent) ve [Slash komutları](/tr/tools/slash-commands).

  </Accordion>

  <Accordion title="Bot ağır iş yaparken donuyor. Bunu nasıl dışarı aktarırım?">
    Uzun veya paralel görevler için **alt ajanlar** kullanın. Alt ajanlar kendi oturumlarında çalışır,
    bir özet döndürür ve ana sohbetinizi duyarlı tutar.

    Botunuzdan "bu görev için bir alt ajan oluşturmasını" isteyin veya `/subagents` kullanın.
    Gateway'in şu anda ne yaptığını (ve meşgul olup olmadığını) görmek için sohbette `/status` kullanın.

    Token ipucu: uzun görevler ve alt ajanların ikisi de token tüketir. Maliyet kaygısı varsa,
    `agents.defaults.subagents.model` aracılığıyla alt ajanlar için daha ucuz bir model ayarlayın.

    Belgeler: [Alt ajanlar](/tr/tools/subagents), [Arka Plan Görevleri](/tr/automation/tasks).

  </Accordion>

  <Accordion title="Discord'da iş parçacığına bağlı alt ajan oturumları nasıl çalışır?">
    İş parçacığı bağlamalarını kullanın. Bir Discord iş parçacığını bir alt ajana veya oturum hedefine bağlayabilirsiniz; böylece o iş parçacığındaki takip mesajları bağlanan oturumda kalır.

    Temel akış:

    - `thread: true` kullanarak `sessions_spawn` ile oluşturun (ve kalıcı takip için isteğe bağlı olarak `mode: "session"`).
    - Veya `/focus <target>` ile elle bağlayın.
    - Bağlama durumunu incelemek için `/agents` kullanın.
    - Otomatik odaktan çıkmayı denetlemek için `/session idle <duration|off>` ve `/session max-age <duration|off>` kullanın.
    - İş parçacığını ayırmak için `/unfocus` kullanın.

    Gerekli yapılandırma:

    - Global varsayılanlar: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
    - Discord geçersiz kılmaları: `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours`.
    - Oluşturma sırasında otomatik bağlama: `channels.discord.threadBindings.spawnSessions` varsayılan olarak `true` değerindedir; iş parçacığına bağlı oturum oluşturmayı devre dışı bırakmak için `false` olarak ayarlayın.

    Belgeler: [Alt ajanlar](/tr/tools/subagents), [Discord](/tr/channels/discord), [Yapılandırma Referansı](/tr/gateway/configuration-reference), [Slash komutları](/tr/tools/slash-commands).

  </Accordion>

  <Accordion title="Bir alt ajan tamamlandı, ancak tamamlama güncellemesi yanlış yere gitti veya hiç gönderilmedi. Neyi kontrol etmeliyim?">
    Önce çözümlenen istek sahibi rotasını kontrol edin:

    - Tamamlama modu alt ajan teslimi, varsa bağlı herhangi bir iş parçacığını veya konuşma rotasını tercih eder.
    - Tamamlama kaynağı yalnızca bir kanal taşıyorsa, OpenClaw doğrudan teslimin yine de başarılı olabilmesi için istek sahibi oturumun saklanan rotasına (`lastChannel` / `lastTo` / `lastAccountId`) geri döner.
    - Ne bağlı bir rota ne de kullanılabilir saklı bir rota varsa, doğrudan teslim başarısız olabilir ve sonuç, sohbete hemen gönderilmek yerine kuyruğa alınmış oturum teslimine geri döner.
    - Geçersiz veya eski hedefler yine de kuyruk geri dönüşünü ya da son teslim başarısızlığını zorlayabilir.
    - Alt öğenin son görünür assistant yanıtı tam olarak sessiz token `NO_REPLY` / `no_reply` ise veya tam olarak `ANNOUNCE_SKIP` ise, OpenClaw eski önceki ilerlemeyi göndermek yerine duyuruyu bilinçli olarak bastırır.
    - Alt öğe yalnızca araç çağrılarından sonra zaman aşımına uğradıysa, duyuru ham araç çıktısını yeniden oynatmak yerine bunu kısa bir kısmi ilerleme özetine daraltabilir.

    Hata ayıklama:

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    Belgeler: [Alt ajanlar](/tr/tools/subagents), [Arka Plan Görevleri](/tr/automation/tasks), [Oturum Araçları](/tr/concepts/session-tool).

  </Accordion>

  <Accordion title="Cron veya hatırlatıcılar çalışmıyor. Neyi kontrol etmeliyim?">
    Cron, Gateway işlemi içinde çalışır. Gateway sürekli çalışmıyorsa,
    zamanlanmış işler çalışmaz.

    Kontrol listesi:

    - Cron'un etkin olduğunu (`cron.enabled`) ve `OPENCLAW_SKIP_CRON` ayarlı olmadığını doğrulayın.
    - Gateway'in 7/24 çalıştığını kontrol edin (uyku/yeniden başlatma yok).
    - İş için saat dilimi ayarlarını doğrulayın (`--tz` ve ana makine saat dilimi).

    Hata ayıklama:

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    Belgeler: [Cron işleri](/tr/automation/cron-jobs), [Otomasyon](/tr/automation).

  </Accordion>

  <Accordion title="Cron çalıştı, ancak kanala hiçbir şey gönderilmedi. Neden?">
    Önce teslim modunu kontrol edin:

    - `--no-deliver` / `delivery.mode: "none"` hiçbir runner yedek gönderiminin beklenmediği anlamına gelir.
    - Eksik veya geçersiz duyuru hedefi (`channel` / `to`), runner'ın giden teslimi atladığı anlamına gelir.
    - Kanal kimlik doğrulama hataları (`unauthorized`, `Forbidden`), runner'ın teslim etmeyi denediği ancak kimlik bilgilerinin bunu engellediği anlamına gelir.
    - Sessiz bir izole sonuç (yalnızca `NO_REPLY` / `no_reply`), kasıtlı olarak teslim edilemez kabul edilir; bu yüzden runner sıraya alınmış yedek teslimi de bastırır.

    İzole cron işleri için, bir sohbet rotası mevcut olduğunda agent yine de `message`
    aracıyla doğrudan gönderebilir. `--announce`, yalnızca agent'ın zaten göndermediği
    son metin için runner yedek yolunu denetler.

    Hata ayıklama:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Belgeler: [Cron işleri](/tr/automation/cron-jobs), [Arka Plan Görevleri](/tr/automation/tasks).

  </Accordion>

  <Accordion title="İzole bir cron çalıştırması neden model değiştirdi veya bir kez yeniden denedi?">
    Bu genellikle canlı model değiştirme yoludur, yinelenen zamanlama değildir.

    İzole cron, etkin çalışma `LiveSessionModelSwitchError` fırlattığında bir çalışma zamanı
    model devrini kalıcı hale getirebilir ve yeniden deneyebilir. Yeniden deneme, geçiş yapılmış
    sağlayıcı/modeli korur ve geçiş yeni bir kimlik doğrulama profili geçersiz kılması taşıyorsa cron
    yeniden denemeden önce bunu da kalıcı hale getirir.

    İlgili seçim kuralları:

    - Uygun olduğunda önce Gmail hook model geçersiz kılması kazanır.
    - Ardından iş başına `model`.
    - Ardından saklanan cron oturumu model geçersiz kılması.
    - Ardından normal agent/varsayılan model seçimi.

    Yeniden deneme döngüsü sınırlıdır. İlk deneme ve 2 geçiş yeniden denemesinden sonra,
    cron sonsuz döngüye girmek yerine işlemi iptal eder.

    Hata ayıklama:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Belgeler: [Cron işleri](/tr/automation/cron-jobs), [cron CLI](/tr/cli/cron).

  </Accordion>

  <Accordion title="Linux'ta Skills nasıl yüklerim?">
    Yerel `openclaw skills` komutlarını kullanın veya Skills'i çalışma alanınıza bırakın. macOS Skills kullanıcı arayüzü Linux'ta mevcut değildir.
    Skills'e [https://clawhub.ai](https://clawhub.ai) adresinden göz atın.

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
    dizinine yazar. Ayrı `clawhub` CLI'yi yalnızca kendi Skills'inizi yayımlamak veya
    eşitlemek istiyorsanız yükleyin. Agent'lar arasında paylaşılan yüklemeler için Skill'i
    `~/.openclaw/skills` altına koyun ve hangi agent'ların onu görebileceğini daraltmak
    istiyorsanız `agents.defaults.skills` veya `agents.list[].skills` kullanın.

  </Accordion>

  <Accordion title="OpenClaw görevleri bir takvime göre veya arka planda sürekli çalıştırabilir mi?">
    Evet. Gateway zamanlayıcısını kullanın:

    - Zamanlanmış veya yinelenen görevler için **Cron işleri** (yeniden başlatmalar arasında kalıcıdır).
    - "ana oturum" dönemsel kontrolleri için **Heartbeat**.
    - Özet yayımlayan veya sohbetlere teslim eden otonom agent'lar için **İzole işler**.

    Belgeler: [Cron işleri](/tr/automation/cron-jobs), [Otomasyon](/tr/automation),
    [Heartbeat](/tr/gateway/heartbeat).

  </Accordion>

  <Accordion title="Apple macOS'a özel Skills'i Linux'tan çalıştırabilir miyim?">
    Doğrudan değil. macOS Skills, `metadata.openclaw.os` ve gerekli ikili dosyalarla sınırlandırılır; Skills yalnızca **Gateway host** üzerinde uygun olduklarında sistem isteminde görünür. Linux'ta `darwin`-only Skills (`apple-notes`, `apple-reminders`, `things-mac` gibi), sınırlandırmayı geçersiz kılmadığınız sürece yüklenmez.

    Desteklenen üç kalıp vardır:

    **Seçenek A - Gateway'i bir Mac üzerinde çalıştırın (en basiti).**
    Gateway'i macOS ikili dosyalarının bulunduğu yerde çalıştırın, ardından Linux'tan [uzak modda](#gateway-ports-already-running-and-remote-mode) veya Tailscale üzerinden bağlanın. Gateway host macOS olduğu için Skills normal şekilde yüklenir.

    **Seçenek B - bir macOS node kullanın (SSH yok).**
    Gateway'i Linux'ta çalıştırın, bir macOS node (menü çubuğu uygulaması) eşleştirin ve Mac'te **Node Run Commands** ayarını "Always Ask" veya "Always Allow" olarak belirleyin. OpenClaw, gerekli ikili dosyalar node üzerinde mevcut olduğunda macOS'a özel Skills'i uygun kabul edebilir. Agent bu Skills'i `nodes` aracı üzerinden çalıştırır. "Always Ask" seçerseniz, istemde "Always Allow" onaylamak ilgili komutu izin listesine ekler.

    **Seçenek C - macOS ikili dosyalarını SSH üzerinden proxy'leyin (ileri düzey).**
    Gateway'i Linux'ta tutun, ancak gerekli CLI ikili dosyalarının bir Mac üzerinde çalışan SSH sarmalayıcılarına çözümlenmesini sağlayın. Ardından Skill'in uygun kalması için Linux'a izin verecek şekilde Skill'i geçersiz kılın.

    1. İkili dosya için bir SSH sarmalayıcısı oluşturun (örnek: Apple Notes için `memo`):

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. Sarmalayıcıyı Linux host üzerinde `PATH` konumuna koyun (örneğin `~/bin/memo`).
    3. Skill metadata'sını (çalışma alanı veya `~/.openclaw/skills`) Linux'a izin verecek şekilde geçersiz kılın:

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
    Bugün yerleşik olarak yok.

    Seçenekler:

    - **Özel skill / plugin:** güvenilir API erişimi için en iyisi (Notion/HeyGen ikisinin de API'leri vardır).
    - **Tarayıcı otomasyonu:** kod olmadan çalışır ancak daha yavaş ve daha kırılgandır.

    Bağlamı her müşteri için ayrı tutmak istiyorsanız (ajans iş akışları), basit bir kalıp şudur:

    - Her müşteri için bir Notion sayfası (bağlam + tercihler + etkin çalışma).
    - Oturum başlangıcında agent'tan bu sayfayı getirmesini isteyin.

    Yerel bir entegrasyon istiyorsanız, bir özellik isteği açın veya bu API'leri
    hedefleyen bir Skill oluşturun.

    Skills'i yükleyin:

    ```bash
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    Yerel yüklemeler etkin çalışma alanındaki `skills/` dizinine iner. Agent'lar arasında paylaşılan Skills için bunları `~/.openclaw/skills/<name>/SKILL.md` konumuna yerleştirin. Paylaşılan bir yüklemeyi yalnızca bazı agent'lar görmeliyse `agents.defaults.skills` veya `agents.list[].skills` yapılandırın. Bazı Skills, Homebrew üzerinden yüklenmiş ikili dosyalar bekler; Linux'ta bu Linuxbrew anlamına gelir (yukarıdaki Homebrew Linux SSS girdisine bakın). Bkz. [Skills](/tr/tools/skills), [Skills yapılandırması](/tr/tools/skills-config) ve [ClawHub](/tr/clawhub).

  </Accordion>

  <Accordion title="OpenClaw ile mevcut oturum açmış Chrome'umu nasıl kullanırım?">
    Chrome DevTools MCP üzerinden bağlanan yerleşik `user` tarayıcı profilini kullanın:

    ```bash
    openclaw browser --browser-profile user tabs
    openclaw browser --browser-profile user snapshot
    ```

    Özel bir ad istiyorsanız açık bir MCP profili oluşturun:

    ```bash
    openclaw browser create-profile --name chrome-live --driver existing-session
    openclaw browser --browser-profile chrome-live tabs
    ```

    Bu yol, yerel host tarayıcısını veya bağlı bir tarayıcı node'unu kullanabilir. Gateway başka bir yerde çalışıyorsa tarayıcı makinesinde bir node host çalıştırın veya bunun yerine uzak CDP kullanın.

    `existing-session` / `user` üzerindeki mevcut sınırlar:

    - eylemler CSS seçici tabanlı değil, ref odaklıdır
    - yüklemeler `ref` / `inputRef` gerektirir ve şu anda tek seferde bir dosyayı destekler
    - `responsebody`, PDF dışa aktarma, indirme yakalama ve toplu eylemler için hâlâ yönetilen tarayıcı veya raw CDP profili gerekir

  </Accordion>
</AccordionGroup>

## Sandbox ve bellek

<AccordionGroup>
  <Accordion title="Ayrı bir sandbox belgesi var mı?">
    Evet. Bkz. [Sandboxing](/tr/gateway/sandboxing). Docker'a özel kurulum için (Docker içinde tam Gateway veya sandbox imajları), bkz. [Docker](/tr/install/docker).
  </Accordion>

  <Accordion title="Docker sınırlı hissettiriyor - tüm özellikleri nasıl etkinleştiririm?">
    Varsayılan imaj güvenlik önceliklidir ve `node` kullanıcısı olarak çalışır, bu yüzden
    sistem paketleri, Homebrew veya paketli tarayıcılar içermez. Daha kapsamlı bir kurulum için:

    - Önbelleklerin korunması için `/home/node` dizinini `OPENCLAW_HOME_VOLUME` ile kalıcı hale getirin.
    - Sistem bağımlılıklarını `OPENCLAW_DOCKER_APT_PACKAGES` ile imaja ekleyin.
    - Paketli CLI üzerinden Playwright tarayıcılarını yükleyin:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - `PLAYWRIGHT_BROWSERS_PATH` ayarlayın ve yolun kalıcı olduğundan emin olun.

    Belgeler: [Docker](/tr/install/docker), [Tarayıcı](/tr/tools/browser).

  </Accordion>

  <Accordion title="Tek bir agent ile DM'leri kişisel tutup grupları herkese açık/sandbox'lı yapabilir miyim?">
    Evet - özel trafiğiniz **DM'ler** ve herkese açık trafiğiniz **gruplar** ise.

    Grup/kanal oturumları (ana olmayan anahtarlar) yapılandırılmış sandbox arka ucunda çalışırken ana DM oturumunun host üzerinde kalması için `agents.defaults.sandbox.mode: "non-main"` kullanın. Birini seçmezseniz varsayılan arka uç Docker'dır. Ardından sandbox'lı oturumlarda hangi araçların kullanılabilir olduğunu `tools.sandbox.tools` üzerinden sınırlayın.

    Kurulum anlatımı + örnek yapılandırma: [Gruplar: kişisel DM'ler + herkese açık gruplar](/tr/channels/groups#pattern-personal-dms-public-groups-single-agent)

    Temel yapılandırma başvurusu: [Gateway yapılandırması](/tr/gateway/config-agents#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="Bir host klasörünü sandbox'a nasıl bağlarım?">
    `agents.defaults.sandbox.docker.binds` değerini `["host:path:mode"]` olarak ayarlayın (ör. `"/home/user/src:/src:ro"`). Global + agent başına bağlar birleştirilir; agent başına bağlar `scope: "shared"` olduğunda yok sayılır. Hassas olan her şey için `:ro` kullanın ve bağların sandbox dosya sistemi duvarlarını atladığını unutmayın.

    OpenClaw, bağ kaynaklarını hem normalleştirilmiş yola hem de var olan en derin üst dizin üzerinden çözümlenen kanonik yola göre doğrular. Bu, son yol segmenti henüz mevcut olmasa bile sembolik bağlantı üst dizini kaçışlarının kapalı şekilde başarısız olduğu ve izin verilen kök denetimlerinin sembolik bağlantı çözümlemesinden sonra da geçerli olduğu anlamına gelir.

    Örnekler ve güvenlik notları için bkz. [Sandboxing](/tr/gateway/sandboxing#custom-bind-mounts) ve [Sandbox vs Araç Politikası vs Elevated](/tr/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check).

  </Accordion>

  <Accordion title="Bellek nasıl çalışır?">
    OpenClaw belleği, agent çalışma alanındaki Markdown dosyalarından ibarettir:

    - `memory/YYYY-MM-DD.md` içinde günlük notlar
    - `MEMORY.md` içinde düzenlenmiş uzun vadeli notlar (yalnızca ana/özel oturumlar)

    OpenClaw ayrıca, modele otomatik Compaction öncesinde kalıcı notlar yazmasını hatırlatmak için
    **sessiz Compaction öncesi bellek boşaltma** çalıştırır. Bu yalnızca çalışma alanı
    yazılabilir olduğunda çalışır (salt okunur sandbox'lar bunu atlar). Bkz. [Bellek](/tr/concepts/memory).

  </Accordion>

  <Accordion title="Bellek bazı şeyleri unutmaya devam ediyor. Kalıcı olmasını nasıl sağlarım?">
    Bota **gerçeği belleğe yazmasını** söyleyin. Uzun vadeli notlar `MEMORY.md` dosyasına,
    kısa vadeli bağlam `memory/YYYY-MM-DD.md` dosyasına aittir.

    Bu hâlâ geliştirdiğimiz bir alan. Modele anıları saklamasını hatırlatmak yardımcı olur;
    ne yapacağını bilir. Unutmaya devam ederse Gateway'in her çalıştırmada aynı
    çalışma alanını kullandığını doğrulayın.

    Belgeler: [Bellek](/tr/concepts/memory), [Agent çalışma alanı](/tr/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Bellek sonsuza kadar kalıcı mı? Sınırları nelerdir?">
    Bellek dosyaları diskte yaşar ve siz silene kadar kalıcıdır. Sınır model değil,
    depolama alanınızdır. **Oturum bağlamı** ise hâlâ model bağlam penceresiyle
    sınırlıdır; bu nedenle uzun konuşmalar compact edilebilir veya kırpılabilir. Bellek
    aramanın var olmasının nedeni budur - yalnızca ilgili parçaları bağlama geri çeker.

    Belgeler: [Bellek](/tr/concepts/memory), [Bağlam](/tr/concepts/context).

  </Accordion>

  <Accordion title="Anlamsal bellek araması için OpenAI API anahtarı gerekir mi?">
    Yalnızca **OpenAI embeddings** kullanıyorsanız. Codex OAuth sohbet/tamamlamaları kapsar ve
    embeddings erişimi **vermez**; bu nedenle **Codex ile oturum açmak (OAuth veya
    Codex CLI oturumu)** anlamsal bellek aramasında yardımcı olmaz. OpenAI embeddings
    yine de gerçek bir API anahtarı gerektirir (`OPENAI_API_KEY` veya `models.providers.openai.apiKey`).

    Açıkça bir sağlayıcı ayarlamazsanız, OpenClaw bir API anahtarını çözümleyebildiğinde
    otomatik olarak bir sağlayıcı seçer (kimlik doğrulama profilleri, `models.providers.*.apiKey` veya env vars).
    Bir OpenAI anahtarı çözümlenirse OpenAI'ı tercih eder; aksi halde Gemini anahtarı
    çözümlenirse Gemini'ı, ardından Voyage'ı, ardından Mistral'ı seçer. Uzak anahtar yoksa, siz yapılandırana kadar bellek
    araması devre dışı kalır. Yerel bir model yolu
    yapılandırılmış ve mevcutsa, OpenClaw
    `local` seçeneğini tercih eder. Ollama, açıkça
    `memorySearch.provider = "ollama"` ayarladığınızda desteklenir.

    Yerelde kalmayı tercih ederseniz, `memorySearch.provider = "local"` ayarlayın (ve isteğe bağlı olarak
    `memorySearch.fallback = "none"`). Gemini embeddings istiyorsanız,
    `memorySearch.provider = "gemini"` ayarlayın ve `GEMINI_API_KEY` (veya
    `memorySearch.remote.apiKey`) sağlayın. **OpenAI, Gemini, Voyage, Mistral, Ollama veya local** embedding
    modellerini destekliyoruz; kurulum ayrıntıları için [Bellek](/tr/concepts/memory) bölümüne bakın.

  </Accordion>
</AccordionGroup>

## Diskte öğelerin bulunduğu yer

<AccordionGroup>
  <Accordion title="OpenClaw ile kullanılan tüm veriler yerel olarak mı kaydedilir?">
    Hayır - **OpenClaw'ın durumu yereldir**, ancak **dış hizmetler yine de onlara ne gönderdiğinizi görür**.

    - **Varsayılan olarak yerel:** oturumlar, bellek dosyaları, yapılandırma ve çalışma alanı Gateway ana makinesinde bulunur
      (`~/.openclaw` + çalışma alanı dizininiz).
    - **Zorunlu olarak uzak:** model sağlayıcılarına gönderdiğiniz iletiler (Anthropic/OpenAI/vb.) onların
      API'lerine gider ve sohbet platformları (WhatsApp/Telegram/Slack/vb.) ileti verilerini kendi
      sunucularında depolar.
    - **Kapsamı siz kontrol edersiniz:** yerel modeller kullanmak istemleri makinenizde tutar, ancak kanal
      trafiği yine de kanalın sunucularından geçer.

    İlgili: [Aracı çalışma alanı](/tr/concepts/agent-workspace), [Bellek](/tr/concepts/memory).

  </Accordion>

  <Accordion title="OpenClaw verilerini nerede depolar?">
    Her şey `$OPENCLAW_STATE_DIR` altında bulunur (varsayılan: `~/.openclaw`):

    | Yol                                                             | Amaç                                                               |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | Ana yapılandırma (JSON5)                                           |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | Eski OAuth içe aktarımı (ilk kullanımda kimlik doğrulama profillerine kopyalanır) |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | Kimlik doğrulama profilleri (OAuth, API anahtarları ve isteğe bağlı `keyRef`/`tokenRef`) |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | `file` SecretRef sağlayıcıları için isteğe bağlı dosya destekli gizli yük |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | Eski uyumluluk dosyası (statik `api_key` girdileri temizlenmiş)     |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | Sağlayıcı durumu (örn. `whatsapp/<accountId>/creds.json`)           |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | Aracı başına durum (agentDir + oturumlar)                           |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | Konuşma geçmişi ve durum (aracı başına)                             |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | Oturum meta verileri (aracı başına)                                 |

    Eski tek aracılı yol: `~/.openclaw/agent/*` (`openclaw doctor` tarafından taşınır).

    **Çalışma alanınız** (AGENTS.md, bellek dosyaları, Skills vb.) ayrıdır ve `agents.defaults.workspace` üzerinden yapılandırılır (varsayılan: `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title="AGENTS.md / SOUL.md / USER.md / MEMORY.md nerede bulunmalı?">
    Bu dosyalar `~/.openclaw` içinde değil, **aracı çalışma alanında** bulunur.

    - **Çalışma alanı (aracı başına)**: `AGENTS.md`, `SOUL.md`, `IDENTITY.md`, `USER.md`,
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

    Bot yeniden başlatmadan sonra "unutuyorsa", Gateway'in her başlatmada aynı
    çalışma alanını kullandığını doğrulayın (ve unutmayın: uzak mod, yerel dizüstü bilgisayarınızın değil,
    **gateway ana makinesinin** çalışma alanını kullanır).

    İpucu: kalıcı bir davranış veya tercih istiyorsanız, sohbet geçmişine güvenmek yerine bottan bunu
    **AGENTS.md veya MEMORY.md içine yazmasını** isteyin.

    Bkz. [Aracı çalışma alanı](/tr/concepts/agent-workspace) ve [Bellek](/tr/concepts/memory).

  </Accordion>

  <Accordion title="Önerilen yedekleme stratejisi">
    **Aracı çalışma alanınızı** **özel** bir git deposuna koyun ve özel bir yerde
    yedekleyin (örneğin GitHub private). Bu, bellek + AGENTS/SOUL/USER
    dosyalarını yakalar ve asistanın "zihnini" daha sonra geri yüklemenizi sağlar.

    `~/.openclaw` altındaki hiçbir şeyi (kimlik bilgileri, oturumlar, tokenlar veya şifrelenmiş gizli yükler) commit etmeyin.
    Tam geri yükleme gerekiyorsa, hem çalışma alanını hem de durum dizinini
    ayrı ayrı yedekleyin (yukarıdaki taşıma sorusuna bakın).

    Belgeler: [Aracı çalışma alanı](/tr/concepts/agent-workspace).

  </Accordion>

  <Accordion title="OpenClaw'ı tamamen nasıl kaldırırım?">
    Özel kılavuza bakın: [Kaldırma](/tr/install/uninstall).
  </Accordion>

  <Accordion title="Aracılar çalışma alanının dışında çalışabilir mi?">
    Evet. Çalışma alanı **varsayılan cwd** ve bellek dayanağıdır; katı bir sandbox değildir.
    Göreli yollar çalışma alanı içinde çözümlenir, ancak sandbox etkin değilse mutlak yollar başka
    ana makine konumlarına erişebilir. Yalıtım gerekiyorsa,
    [`agents.defaults.sandbox`](/tr/gateway/sandboxing) veya aracı başına sandbox ayarlarını kullanın. Bir
    deponun varsayılan çalışma dizini olmasını istiyorsanız, ilgili aracının
    `workspace` değerini depo köküne yönlendirin. OpenClaw deposu yalnızca kaynak koddur; aracının kasıtlı olarak onun içinde çalışmasını istemiyorsanız
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
    Oturum durumu **gateway ana makinesine** aittir. Uzak moddaysanız, önem verdiğiniz oturum deposu yerel dizüstü bilgisayarınızda değil, uzak makinededir. Bkz. [Oturum yönetimi](/tr/concepts/session).
  </Accordion>
</AccordionGroup>

## Yapılandırma temelleri

<AccordionGroup>
  <Accordion title="Yapılandırma hangi biçimdedir? Nerede bulunur?">
    OpenClaw, `$OPENCLAW_CONFIG_PATH` üzerinden isteğe bağlı bir **JSON5** yapılandırması okur (varsayılan: `~/.openclaw/openclaw.json`):

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    Dosya yoksa güvenli sayılabilecek varsayılanları kullanır (`~/.openclaw/workspace` varsayılan çalışma alanı dahil).

  </Accordion>

  <Accordion title='gateway.bind: "lan" (veya "tailnet") ayarladım ve artık hiçbir şey dinlemiyor / UI yetkisiz diyor'>
    Geri döngü olmayan bağlamalar **geçerli bir gateway kimlik doğrulama yolu gerektirir**. Pratikte bu şu anlama gelir:

    - paylaşılan gizli kimlik doğrulama: token veya parola
    - doğru yapılandırılmış kimlik farkındalıklı ters proxy arkasında `gateway.auth.mode: "trusted-proxy"`

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
    - Yerel çağrı yolları, yalnızca `gateway.auth.*` ayarlanmamışsa `gateway.remote.*` değerini yedek olarak kullanabilir.
    - Parola kimlik doğrulaması için bunun yerine `gateway.auth.mode: "password"` ve `gateway.auth.password` (veya `OPENCLAW_GATEWAY_PASSWORD`) ayarlayın.
    - `gateway.auth.token` / `gateway.auth.password` SecretRef üzerinden açıkça yapılandırılmış ve çözümlenememişse, çözümleme kapalı durumda başarısız olur (uzak yedek maskelemesi yoktur).
    - Paylaşılan gizli Control UI kurulumları `connect.params.auth.token` veya `connect.params.auth.password` üzerinden kimlik doğrular (uygulama/UI ayarlarında depolanır). Tailscale Serve veya `trusted-proxy` gibi kimlik taşıyan modlar bunun yerine istek başlıklarını kullanır. Paylaşılan gizli bilgileri URL'lere koymaktan kaçının.
    - `gateway.auth.mode: "trusted-proxy"` ile, aynı ana makinedeki geri döngü ters proxy'leri için açıkça `gateway.auth.trustedProxy.allowLoopback = true` ve `gateway.trustedProxies` içinde bir geri döngü girdisi gerekir.

  </Accordion>

  <Accordion title="Artık localhost üzerinde neden token gerekiyor?">
    OpenClaw, geri döngü dahil olmak üzere varsayılan olarak gateway kimlik doğrulamasını zorunlu kılar. Normal varsayılan yolda bu token kimlik doğrulaması anlamına gelir: açık bir kimlik doğrulama yolu yapılandırılmamışsa, gateway başlangıcı token moduna çözümlenir ve bu başlangıç için yalnızca çalışma zamanı tokenı üretir; bu nedenle **yerel WS istemcileri kimlik doğrulaması yapmalıdır**. İstemcilerin yeniden başlatmalar arasında kararlı bir gizli bilgiye ihtiyaç duyduğu durumlarda `gateway.auth.token`, `gateway.auth.password`, `OPENCLAW_GATEWAY_TOKEN` veya `OPENCLAW_GATEWAY_PASSWORD` değerini açıkça yapılandırın. Bu, diğer yerel süreçlerin Gateway'i çağırmasını engeller.

    Farklı bir kimlik doğrulama yolu tercih ediyorsanız, parola modunu (veya kimlik farkındalıklı ters proxy'ler için `trusted-proxy`) açıkça seçebilirsiniz. Geri döngünün **gerçekten** açık olmasını istiyorsanız, yapılandırmanızda açıkça `gateway.auth.mode: "none"` ayarlayın. Doctor sizin için her zaman token üretebilir: `openclaw doctor --generate-gateway-token`.

  </Accordion>

  <Accordion title="Yapılandırmayı değiştirdikten sonra yeniden başlatmam gerekir mi?">
    Gateway yapılandırmayı izler ve sıcak yeniden yüklemeyi destekler:

    - `gateway.reload.mode: "hybrid"` (varsayılan): güvenli değişiklikleri sıcak uygula, kritik olanlar için yeniden başlat
    - `hot`, `restart`, `off` de desteklenir

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

    - `off`: slogan metnini gizler ancak başlık/sürüm satırını korur.
    - `default`: her seferinde `All your chats, one OpenClaw.` kullanır.
    - `random`: dönen komik/mevsimsel sloganlar (varsayılan davranış).
    - Hiç banner istemiyorsanız, env `OPENCLAW_HIDE_BANNER=1` ayarlayın.

  </Accordion>

  <Accordion title="Web aramasını (ve web getirmeyi) nasıl etkinleştiririm?">
    `web_fetch` API anahtarı olmadan çalışır. `web_search` seçtiğiniz
    sağlayıcıya bağlıdır:

    - Brave, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Perplexity ve Tavily gibi API destekli sağlayıcılar normal API anahtarı kurulumlarını gerektirir.
    - Ollama Web Search anahtarsızdır, ancak yapılandırılmış Ollama ana makinenizi kullanır ve `ollama signin` gerektirir.
    - DuckDuckGo anahtarsızdır, ancak resmi olmayan HTML tabanlı bir entegrasyondur.
    - SearXNG anahtarsız/kendi barındırdığınız yapıdadır; `SEARXNG_BASE_URL` veya `plugins.entries.searxng.config.webSearch.baseUrl` yapılandırın.

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
    - `tools.web.fetch.provider` atlanırsa OpenClaw, mevcut kimlik bilgilerinden ilk hazır getirme yedek sağlayıcısını otomatik algılar. Bugün paketlenen sağlayıcı Firecrawl'dır.
    - Daemon'lar ortam değişkenlerini `~/.openclaw/.env` dosyasından (veya hizmet ortamından) okur.

    Belgeler: [Web araçları](/tr/tools/web).

  </Accordion>

  <Accordion title="config.apply yapılandırmamı sildi. Nasıl kurtarır ve bunu nasıl önlerim?">
    `config.apply` **tüm yapılandırmayı** değiştirir. Kısmi bir nesne gönderirseniz diğer her şey
    kaldırılır.

    Güncel OpenClaw birçok kazara üzerine yazmaya karşı koruma sağlar:

    - OpenClaw'a ait yapılandırma yazmaları, yazmadan önce değişiklik sonrası tam yapılandırmayı doğrular.
    - Geçersiz veya yıkıcı OpenClaw'a ait yazmalar reddedilir ve `openclaw.json.rejected.*` olarak kaydedilir.
    - Doğrudan bir düzenleme başlatmayı veya sıcak yeniden yüklemeyi bozarsa Gateway kapalı şekilde başarısız olur veya yeniden yüklemeyi atlar; `openclaw.json` dosyasını yeniden yazmaz.
    - `openclaw doctor --fix`, onarımın sahibidir ve reddedilen dosyayı `openclaw.json.clobbered.*` olarak kaydederken son bilinen iyi durumu geri yükleyebilir.

    Kurtarma:

    - `Invalid config at`, `Config write rejected:` veya `config reload skipped (invalid config)` için `openclaw logs --follow` çıktısını kontrol edin.
    - Etkin yapılandırmanın yanındaki en yeni `openclaw.json.clobbered.*` veya `openclaw.json.rejected.*` dosyasını inceleyin.
    - `openclaw config validate` ve `openclaw doctor --fix` komutlarını çalıştırın.
    - Yalnızca amaçlanan anahtarları `openclaw config set` veya `config.patch` ile geri kopyalayın.
    - Son bilinen iyi durumunuz veya reddedilen yükünüz yoksa yedekten geri yükleyin ya da `openclaw doctor` komutunu yeniden çalıştırıp kanalları/modelleri yeniden yapılandırın.
    - Bu beklenmedikse bir hata bildirin ve son bilinen yapılandırmanızı veya varsa herhangi bir yedeği ekleyin.
    - Yerel bir kodlama ajanı genellikle günlüklerden veya geçmişten çalışan bir yapılandırmayı yeniden oluşturabilir.

    Önleme:

    - Küçük değişiklikler için `openclaw config set` kullanın.
    - Etkileşimli düzenlemeler için `openclaw configure` kullanın.
    - Tam yol veya alan biçiminden emin değilseniz önce `config.schema.lookup` kullanın; bu, detaya inmek için sığ bir şema düğümü ve doğrudan alt özetler döndürür.
    - Kısmi RPC düzenlemeleri için `config.patch` kullanın; `config.apply` yalnızca tam yapılandırma değiştirme için kalsın.
    - Bir ajan çalıştırmasından yalnızca sahibin kullanabildiği `gateway` aracını kullanıyorsanız, `tools.exec.ask` / `tools.exec.security` yazmalarını (aynı korumalı exec yollarına normalize edilen eski `tools.bash.*` takma adları dahil) yine de reddeder.

    Belgeler: [Yapılandırma](/tr/cli/config), [Yapılandır](/tr/cli/configure), [Gateway sorun giderme](/tr/gateway/troubleshooting#gateway-rejected-invalid-config), [Doctor](/tr/gateway/doctor).

  </Accordion>

  <Accordion title="Cihazlar arasında uzmanlaşmış çalışanlarla merkezi bir Gateway'i nasıl çalıştırırım?">
    Yaygın desen **bir Gateway** (ör. Raspberry Pi) artı **düğümler** ve **ajanlar** kullanmaktır:

    - **Gateway (merkezi):** kanalların (Signal/WhatsApp), yönlendirmenin ve oturumların sahibidir.
    - **Düğümler (cihazlar):** Mac'ler/iOS/Android çevre birimleri olarak bağlanır ve yerel araçları (`system.run`, `canvas`, `camera`) sunar.
    - **Ajanlar (çalışanlar):** özel roller için ayrı beyinler/çalışma alanlarıdır (ör. "Hetzner ops", "Kişisel veriler").
    - **Alt ajanlar:** paralellik istediğinizde ana ajandan arka plan işi başlatır.
    - **TUI:** Gateway'e bağlanır ve ajanlar/oturumlar arasında geçiş yapar.

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

    Varsayılan `false` (pencereli) değeridir. Headless bazı sitelerde anti-bot kontrollerini tetiklemeye daha yatkındır. Bkz. [Tarayıcı](/tr/tools/browser).

    Headless **aynı Chromium motorunu** kullanır ve çoğu otomasyon için çalışır (formlar, tıklamalar, scraping, girişler). Başlıca farklar:

    - Görünür tarayıcı penceresi yoktur (görsellere ihtiyacınız varsa ekran görüntüleri kullanın).
    - Bazı siteler headless modda otomasyon konusunda daha katıdır (CAPTCHA'lar, anti-bot).
      Örneğin, X/Twitter headless oturumları sık sık engeller.

  </Accordion>

  <Accordion title="Tarayıcı kontrolü için Brave'i nasıl kullanırım?">
    `browser.executablePath` değerini Brave ikili dosyanıza (veya Chromium tabanlı herhangi bir tarayıcıya) ayarlayın ve Gateway'i yeniden başlatın.
    Tam yapılandırma örnekleri için [Tarayıcı](/tr/tools/browser#use-brave-or-another-chromium-based-browser) bölümüne bakın.
  </Accordion>
</AccordionGroup>

## Uzak Gateway'ler ve düğümler

<AccordionGroup>
  <Accordion title="Komutlar Telegram, gateway ve düğümler arasında nasıl yayılır?">
    Telegram mesajları **gateway** tarafından işlenir. Gateway ajanı çalıştırır ve
    yalnızca bir düğüm aracı gerektiğinde **Gateway WebSocket** üzerinden düğümleri çağırır:

    Telegram → Gateway → Ajan → `node.*` → Düğüm → Gateway → Telegram

    Düğümler gelen sağlayıcı trafiğini görmez; yalnızca düğüm RPC çağrıları alırlar.

  </Accordion>

  <Accordion title="Gateway uzakta barındırılıyorsa ajanım bilgisayarıma nasıl erişebilir?">
    Kısa yanıt: **bilgisayarınızı düğüm olarak eşleştirin**. Gateway başka yerde çalışır, ancak
    Gateway WebSocket üzerinden yerel makinenizdeki `node.*` araçlarını (ekran, kamera, sistem) çağırabilir.

    Tipik kurulum:

    1. Gateway'i her zaman açık ana makinede (VPS/ev sunucusu) çalıştırın.
    2. Gateway ana makinesi + bilgisayarınızı aynı tailnet'e koyun.
    3. Gateway WS'nin erişilebilir olduğundan emin olun (tailnet bind veya SSH tüneli).
    4. macOS uygulamasını yerelde açın ve düğüm olarak kaydolabilmesi için **SSH üzerinden uzak** modda (veya doğrudan tailnet)
       bağlanın.
    5. Gateway üzerinde düğümü onaylayın:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Ayrı bir TCP köprüsü gerekmez; düğümler Gateway WebSocket üzerinden bağlanır.

    Güvenlik hatırlatması: bir macOS düğümünü eşleştirmek, o makinede `system.run` çalıştırılmasına izin verir. Yalnızca
    güvendiğiniz cihazları eşleştirin ve [Güvenlik](/tr/gateway/security) bölümünü inceleyin.

    Belgeler: [Düğümler](/tr/nodes), [Gateway protokolü](/tr/gateway/protocol), [macOS uzak modu](/tr/platforms/mac/remote), [Güvenlik](/tr/gateway/security).

  </Accordion>

  <Accordion title="Tailscale bağlı ama yanıt alamıyorum. Şimdi ne yapmalıyım?">
    Temel kontrolleri yapın:

    - Gateway çalışıyor: `openclaw gateway status`
    - Gateway sağlığı: `openclaw status`
    - Kanal sağlığı: `openclaw channels status`

    Ardından kimlik doğrulama ve yönlendirmeyi doğrulayın:

    - Tailscale Serve kullanıyorsanız `gateway.auth.allowTailscale` değerinin doğru ayarlandığından emin olun.
    - SSH tüneli üzerinden bağlanıyorsanız yerel tünelin açık olduğunu ve doğru porta işaret ettiğini doğrulayın.
    - İzin listelerinizin (DM veya grup) hesabınızı içerdiğini doğrulayın.

    Belgeler: [Tailscale](/tr/gateway/tailscale), [Uzaktan erişim](/tr/gateway/remote), [Kanallar](/tr/channels).

  </Accordion>

  <Accordion title="İki OpenClaw örneği birbiriyle konuşabilir mi (yerel + VPS)?">
    Evet. Yerleşik bir "bot-to-bot" köprüsü yoktur, ancak bunu birkaç
    güvenilir yolla bağlayabilirsiniz:

    **En basit:** iki botun da erişebildiği normal bir sohbet kanalı kullanın (Telegram/Slack/WhatsApp).
    Bot A'nın Bot B'ye bir mesaj göndermesini sağlayın, ardından Bot B'nin her zamanki gibi yanıtlamasına izin verin.

    **CLI köprüsü (genel):** diğer botun
    dinlediği bir sohbeti hedefleyerek diğer Gateway'i `openclaw agent --message ... --deliver` ile çağıran bir script çalıştırın. Botlardan biri uzak bir VPS üzerindeyse CLI'nizi SSH/Tailscale üzerinden o uzak Gateway'e yöneltin (bkz. [Uzaktan erişim](/tr/gateway/remote)).

    Örnek desen (hedef Gateway'e erişebilen bir makineden çalıştırın):

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    İpucu: iki botun sonsuz döngüye girmemesi için bir güvenlik sınırı ekleyin (yalnızca bahsetme, kanal
    izin listeleri veya "bot mesajlarına yanıt verme" kuralı).

    Belgeler: [Uzaktan erişim](/tr/gateway/remote), [Ajan CLI](/tr/cli/agent), [Ajan gönderimi](/tr/tools/agent-send).

  </Accordion>

  <Accordion title="Birden çok ajan için ayrı VPS'lere ihtiyacım var mı?">
    Hayır. Bir Gateway birden çok ajanı barındırabilir; her birinin kendi çalışma alanı, model varsayılanları
    ve yönlendirmesi olur. Normal kurulum budur ve ajan başına bir VPS çalıştırmaktan çok daha ucuz ve basittir.

    Ayrı VPS'leri yalnızca katı izolasyona (güvenlik sınırları) veya paylaşmak istemediğiniz çok
    farklı yapılandırmalara ihtiyacınız olduğunda kullanın. Aksi halde tek bir Gateway kullanın ve
    birden çok ajan veya alt ajan kullanın.

  </Accordion>

  <Accordion title="VPS'den SSH kullanmak yerine kişisel dizüstü bilgisayarımda bir düğüm kullanmanın avantajı var mı?">
    Evet - düğümler, uzak bir Gateway'den dizüstü bilgisayarınıza erişmenin birinci sınıf yoludur ve
    shell erişiminden fazlasını açar. Gateway macOS/Linux üzerinde çalışır (Windows, WSL2 üzerinden) ve
    hafiftir (küçük bir VPS veya Raspberry Pi sınıfı kutu yeterlidir; 4 GB RAM fazlasıyla yeterli), bu nedenle yaygın
    kurulum her zaman açık bir ana makine artı dizüstü bilgisayarınızın düğüm olmasıdır.

    - **Gelen SSH gerekmez.** Düğümler Gateway WebSocket'e dışarı doğru bağlanır ve cihaz eşleştirmesi kullanır.
    - **Daha güvenli yürütme kontrolleri.** `system.run`, o dizüstü bilgisayardaki düğüm izin listeleri/onaylarıyla denetlenir.
    - **Daha fazla cihaz aracı.** Düğümler `system.run` yanında `canvas`, `camera` ve `screen` sunar.
    - **Yerel tarayıcı otomasyonu.** Gateway'i bir VPS üzerinde tutun, ancak Chrome'u dizüstü bilgisayardaki bir düğüm ana makinesi üzerinden yerelde çalıştırın veya Chrome MCP üzerinden ana makinedeki yerel Chrome'a bağlanın.

    SSH tek seferlik shell erişimi için uygundur, ancak düğümler sürekli ajan iş akışları ve
    cihaz otomasyonu için daha basittir.

    Belgeler: [Düğümler](/tr/nodes), [Düğümler CLI](/tr/cli/nodes), [Tarayıcı](/tr/tools/browser).

  </Accordion>

  <Accordion title="Düğümler bir gateway hizmeti çalıştırır mı?">
    Hayır. Bilerek izole profiller çalıştırmadığınız sürece ana makine başına yalnızca **bir gateway** çalışmalıdır (bkz. [Birden çok gateway](/tr/gateway/multiple-gateways)). Düğümler gateway'e bağlanan çevre birimleridir
    (iOS/Android düğümleri veya menü çubuğu uygulamasında macOS "node mode"). Headless düğüm
    ana makineleri ve CLI kontrolü için bkz. [Düğüm ana makinesi CLI](/tr/cli/node).

    `gateway`, `discovery` ve barındırılan Plugin yüzeyi değişiklikleri için tam yeniden başlatma gerekir.

  </Accordion>

  <Accordion title="Yapılandırma uygulamak için bir API / RPC yolu var mı?">
    Evet.

    - `config.schema.lookup`: yazmadan önce bir config alt ağacını yüzeysel schema düğümü, eşleşen UI ipucu ve anlık alt öğe özetleriyle incele
    - `config.get`: geçerli snapshot + hash değerini getir
    - `config.patch`: güvenli kısmi güncelleme (çoğu RPC düzenlemesi için tercih edilir); mümkün olduğunda hot-reload yapar, gerektiğinde yeniden başlatır
    - `config.apply`: tam config'i doğrula + değiştir; mümkün olduğunda hot-reload yapar, gerektiğinde yeniden başlatır
    - Yalnızca sahibin kullanabildiği `gateway` çalışma zamanı aracı hâlâ `tools.exec.ask` / `tools.exec.security` öğelerini yeniden yazmayı reddeder; eski `tools.bash.*` alias'ları aynı korumalı exec yollarına normalleştirilir

  </Accordion>

  <Accordion title="İlk kurulum için en küçük makul config">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    Bu, workspace'inizi ayarlar ve botu kimin tetikleyebileceğini sınırlar.

  </Accordion>

  <Accordion title="Bir VPS üzerinde Tailscale'i nasıl kurar ve Mac'imden nasıl bağlanırım?">
    En küçük adımlar:

    1. **VPS üzerinde kur + oturum aç**

       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```

    2. **Mac'inize kur + oturum aç**
       - Tailscale uygulamasını kullanın ve aynı tailnet'te oturum açın.
    3. **MagicDNS'i etkinleştir (önerilir)**
       - Tailscale yönetici konsolunda MagicDNS'i etkinleştirin; böylece VPS'in kararlı bir adı olur.
    4. **tailnet hostname'ini kullan**
       - SSH: `ssh user@your-vps.tailnet-xxxx.ts.net`
       - Gateway WS: `ws://your-vps.tailnet-xxxx.ts.net:18789`

    SSH olmadan Control UI istiyorsanız, VPS üzerinde Tailscale Serve kullanın:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Bu, gateway'i loopback'e bağlı tutar ve HTTPS'i Tailscale üzerinden açar. Bkz. [Tailscale](/tr/gateway/tailscale).

  </Accordion>

  <Accordion title="Bir Mac node'u uzak bir Gateway'e (Tailscale Serve) nasıl bağlarım?">
    Serve, **Gateway Control UI + WS** öğelerini açar. Node'lar aynı Gateway WS endpoint'i üzerinden bağlanır.

    Önerilen kurulum:

    1. **VPS + Mac'in aynı tailnet üzerinde olduğundan emin olun**.
    2. **macOS uygulamasını Remote modda kullanın** (SSH hedefi tailnet hostname'i olabilir).
       Uygulama Gateway portunu tünelleyecek ve node olarak bağlanacaktır.
    3. **Node'u** gateway üzerinde onaylayın:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Belgeler: [Gateway protokolü](/tr/gateway/protocol), [Keşif](/tr/gateway/discovery), [macOS remote modu](/tr/platforms/mac/remote).

  </Accordion>

  <Accordion title="İkinci bir dizüstü bilgisayara kurmalı mıyım yoksa yalnızca bir node mu eklemeliyim?">
    İkinci dizüstü bilgisayarda yalnızca **yerel araçlara** (ekran/kamera/exec) ihtiyacınız varsa, onu
    **node** olarak ekleyin. Bu, tek bir Gateway tutar ve yinelenen config'i önler. Yerel node araçları
    şu anda yalnızca macOS içindir, ancak bunları diğer işletim sistemlerine genişletmeyi planlıyoruz.

    İkinci bir Gateway'i yalnızca **katı yalıtım** veya tamamen ayrı iki bot gerektiğinde kurun.

    Belgeler: [Node'lar](/tr/nodes), [Node'lar CLI](/tr/cli/nodes), [Birden çok gateway](/tr/gateway/multiple-gateways).

  </Accordion>
</AccordionGroup>

## Env var'ları ve .env yükleme

<AccordionGroup>
  <Accordion title="OpenClaw ortam değişkenlerini nasıl yükler?">
    OpenClaw, env var'larını üst süreçten (shell, launchd/systemd, CI vb.) okur ve ek olarak şunları yükler:

    - geçerli çalışma dizininden `.env`
    - `~/.openclaw/.env` konumundan global yedek `.env` (diğer adıyla `$OPENCLAW_STATE_DIR/.env`)

    Hiçbir `.env` dosyası mevcut env var'larını geçersiz kılmaz.

    Config içinde satır içi env var'ları da tanımlayabilirsiniz (yalnızca process env'de eksikse uygulanır):

    ```json5
    {
      env: {
        OPENROUTER_API_KEY: "sk-or-...",
        vars: { GROQ_API_KEY: "gsk-..." },
      },
    }
    ```

    Tam öncelik sırası ve kaynaklar için bkz. [/environment](/tr/help/environment).

  </Accordion>

  <Accordion title="Gateway'i servis üzerinden başlattım ve env var'larım kayboldu. Şimdi ne yapmalıyım?">
    İki yaygın düzeltme:

    1. Eksik anahtarları `~/.openclaw/.env` içine koyun; böylece servis shell env'inizi miras almadığında bile alınırlar.
    2. Shell içe aktarmayı etkinleştirin (opt-in kolaylık):

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

    Bu, login shell'inizi çalıştırır ve yalnızca eksik beklenen anahtarları içe aktarır (asla geçersiz kılmaz). Env var eşdeğerleri:
    `OPENCLAW_LOAD_SHELL_ENV=1`, `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`.

  </Accordion>

  <Accordion title='COPILOT_GITHUB_TOKEN ayarladım, ancak model durumu "Shell env: off." gösteriyor. Neden?'>
    `openclaw models status`, **shell env içe aktarmanın** etkin olup olmadığını bildirir. "Shell env: off"
    env var'larınızın eksik olduğu anlamına **gelmez** - yalnızca OpenClaw'ın
    login shell'inizi otomatik olarak yüklemeyeceği anlamına gelir.

    Gateway bir servis olarak çalışıyorsa (launchd/systemd), shell
    ortamınızı miras almaz. Şunlardan birini yaparak düzeltin:

    1. Token'ı `~/.openclaw/.env` içine koyun:

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. Veya shell içe aktarmayı etkinleştirin (`env.shellEnv.enabled: true`).
    3. Veya config `env` bloğunuza ekleyin (yalnızca eksikse uygulanır).

    Ardından gateway'i yeniden başlatın ve tekrar kontrol edin:

    ```bash
    openclaw models status
    ```

    Copilot token'ları `COPILOT_GITHUB_TOKEN` içinden okunur (ayrıca `GH_TOKEN` / `GITHUB_TOKEN`).
    Bkz. [/concepts/model-providers](/tr/concepts/model-providers) ve [/environment](/tr/help/environment).

  </Accordion>
</AccordionGroup>

## Oturumlar ve birden çok sohbet

<AccordionGroup>
  <Accordion title="Yeni bir konuşmayı nasıl başlatırım?">
    Bağımsız bir mesaj olarak `/new` veya `/reset` gönderin. Bkz. [Oturum yönetimi](/tr/concepts/session).
  </Accordion>

  <Accordion title="Hiç /new göndermesem oturumlar otomatik olarak sıfırlanır mı?">
    Oturumlar `session.idleMinutes` sonrasında sona erebilir, ancak bu **varsayılan olarak devre dışıdır** (varsayılan **0**).
    Boşta kalma süresinin dolmasını etkinleştirmek için pozitif bir değere ayarlayın. Etkinleştirildiğinde, boşta kalma süresinden sonraki **sonraki**
    mesaj, o sohbet anahtarı için yeni bir oturum kimliği başlatır.
    Bu, transcript'leri silmez - yalnızca yeni bir oturum başlatır.

    ```json5
    {
      session: {
        idleMinutes: 240,
      },
    }
    ```

  </Accordion>

  <Accordion title="OpenClaw instance'larından oluşan bir ekip (bir CEO ve birçok agent) oluşturmanın bir yolu var mı?">
    Evet, **çok agent'lı yönlendirme** ve **sub-agent'lar** ile. Kendi workspace'leri ve modelleri olan bir coordinator
    agent ve birkaç worker agent oluşturabilirsiniz.

    Bununla birlikte, bunu en iyi **eğlenceli bir deney** olarak görmek gerekir. Token açısından ağırdır ve çoğu zaman
    ayrı oturumları olan tek bir bot kullanmaktan daha az verimlidir. Öngördüğümüz tipik model,
    konuştuğunuz tek bir bot ve paralel işler için farklı oturumlardır. Bu
    bot gerektiğinde sub-agent'lar da oluşturabilir.

    Belgeler: [Çok agent'lı yönlendirme](/tr/concepts/multi-agent), [Sub-agent'lar](/tr/tools/subagents), [Agents CLI](/tr/cli/agents).

  </Accordion>

  <Accordion title="Context neden görev ortasında kırpıldı? Bunu nasıl önlerim?">
    Oturum context'i model penceresiyle sınırlıdır. Uzun sohbetler, büyük araç çıktıları veya çok sayıda
    dosya Compaction ya da kırpmayı tetikleyebilir.

    Yardımcı olanlar:

    - Bottan geçerli durumu özetlemesini ve bir dosyaya yazmasını isteyin.
    - Uzun görevlerden önce `/compact`, konu değiştirirken `/new` kullanın.
    - Önemli context'i workspace'te tutun ve bottan onu yeniden okumasını isteyin.
    - Ana sohbetin daha küçük kalması için uzun veya paralel işler için sub-agent'lar kullanın.
    - Bu sık oluyorsa daha büyük context penceresine sahip bir model seçin.

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

    Ardından kurulumu tekrar çalıştırın:

    ```bash
    openclaw onboard --install-daemon
    ```

    Notlar:

    - Onboarding, mevcut bir config görürse **Reset** seçeneğini de sunar. Bkz. [Onboarding (CLI)](/tr/start/wizard).
    - Profil kullandıysanız (`--profile` / `OPENCLAW_PROFILE`), her state dir'i sıfırlayın (varsayılanlar `~/.openclaw-<profile>`).
    - Dev reset: `openclaw gateway --dev --reset` (yalnızca dev; dev config + credentials + sessions + workspace öğelerini siler).

  </Accordion>

  <Accordion title='"context too large" hataları alıyorum - nasıl resetlerim veya compact ederim?'>
    Bunlardan birini kullanın:

    - **Compact** (konuşmayı tutar ancak eski dönüşleri özetler):

      ```
      /compact
      ```

      veya özeti yönlendirmek için `/compact <instructions>`.

    - **Reset** (aynı sohbet anahtarı için yeni oturum kimliği):

      ```
      /new
      /reset
      ```

    Bu devam ederse:

    - Eski araç çıktısını kırpmak için **session pruning** (`agents.defaults.contextPruning`) etkinleştirin veya ayarlayın.
    - Daha büyük context penceresine sahip bir model kullanın.

    Belgeler: [Compaction](/tr/concepts/compaction), [Session pruning](/tr/concepts/session-pruning), [Oturum yönetimi](/tr/concepts/session).

  </Accordion>

  <Accordion title='"LLM request rejected: messages.content.tool_use.input field required" ifadesini neden görüyorum?'>
    Bu bir provider doğrulama hatasıdır: model, gerekli
    `input` olmadan bir `tool_use` bloğu üretti. Genellikle oturum geçmişinin eski veya bozuk olduğu anlamına gelir (çoğunlukla uzun thread'lerden
    veya bir araç/schema değişikliğinden sonra).

    Düzeltme: `/new` ile yeni bir oturum başlatın (bağımsız mesaj).

  </Accordion>

  <Accordion title="Neden her 30 dakikada bir Heartbeat mesajları alıyorum?">
    Heartbeat'ler varsayılan olarak her **30m**'de bir çalışır (OAuth auth kullanırken **1h**). Ayarlayın veya devre dışı bırakın:

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
    başlıkları), OpenClaw API çağrılarını azaltmak için heartbeat çalıştırmasını atlar.
    Dosya eksikse heartbeat yine çalışır ve model ne yapılacağına karar verir.

    Agent başına geçersiz kılmalar `agents.list[].heartbeat` kullanır. Belgeler: [Heartbeat](/tr/gateway/heartbeat).

  </Accordion>

  <Accordion title='Bir WhatsApp grubuna "bot account" eklemem gerekiyor mu?'>
    Hayır. OpenClaw **kendi hesabınızda** çalışır; yani gruptaysanız OpenClaw onu görebilir.
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

  <Accordion title="Bir WhatsApp grubunun JID'sini nasıl alırım?">
    Seçenek 1 (en hızlı): log'ları takip edin ve grupta bir test mesajı gönderin:

    ```bash
    openclaw logs --follow --json
    ```

    `@g.us` ile biten `chatId` (veya `from`) arayın, örneğin:
    `1234567890-1234567890@g.us`.

    Seçenek 2 (zaten yapılandırılmış/allowlist'e alınmışsa): config'ten grupları listeleyin:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    Belgeler: [WhatsApp](/tr/channels/whatsapp), [Directory](/tr/cli/directory), [Log'lar](/tr/cli/logs).

  </Accordion>

  <Accordion title="OpenClaw bir grupta neden yanıt vermiyor?">
    İki yaygın neden:

    - Mention gating açık (varsayılan). Botu @mention etmelisiniz (veya `mentionPatterns` ile eşleşmelisiniz).
    - `channels.whatsapp.groups` öğesini `"*"` olmadan yapılandırdınız ve grup allowlist'te değil.

    Bkz. [Gruplar](/tr/channels/groups) ve [Grup mesajları](/tr/channels/group-messages).

  </Accordion>

  <Accordion title="Gruplar/thread'ler DM'lerle context paylaşır mı?">
    Doğrudan sohbetler varsayılan olarak ana oturuma daraltılır. Grupların/kanalların kendi oturum anahtarları vardır ve Telegram topic'leri / Discord thread'leri ayrı oturumlardır. Bkz. [Gruplar](/tr/channels/groups) ve [Grup mesajları](/tr/channels/group-messages).
  </Accordion>

  <Accordion title="Kaç çalışma alanı ve ajan oluşturabilirim?">
    Kesin sınır yok. Düzinelerce (hatta yüzlerce) sorun değildir, ancak şunlara dikkat edin:

    - **Disk büyümesi:** oturumlar + dökümler `~/.openclaw/agents/<agentId>/sessions/` altında bulunur.
    - **Token maliyeti:** daha fazla ajan, daha fazla eşzamanlı model kullanımı anlamına gelir.
    - **Operasyon yükü:** ajan başına kimlik doğrulama profilleri, çalışma alanları ve kanal yönlendirmesi.

    İpuçları:

    - Ajan başına bir **aktif** çalışma alanı tutun (`agents.defaults.workspace`).
    - Disk büyürse eski oturumları budayın (JSONL veya store girdilerini silin).
    - Başıboş çalışma alanlarını ve profil uyuşmazlıklarını bulmak için `openclaw doctor` kullanın.

  </Accordion>

  <Accordion title="Aynı anda birden fazla bot veya sohbet çalıştırabilir miyim (Slack) ve bunu nasıl ayarlamalıyım?">
    Evet. Birden fazla yalıtılmış ajan çalıştırmak ve gelen iletileri
    kanal/hesap/eş düzey öğesine göre yönlendirmek için **Çok Ajanlı Yönlendirme** kullanın. Slack bir kanal olarak desteklenir ve belirli ajanlara bağlanabilir.

    Tarayıcı erişimi güçlüdür ancak "bir insanın yapabildiği her şeyi yapabilir" anlamına gelmez; bot önleme, CAPTCHA'lar ve MFA
    otomasyonu hâlâ engelleyebilir. En güvenilir tarayıcı denetimi için ana makinede yerel Chrome MCP kullanın
    veya tarayıcıyı gerçekten çalıştıran makinede CDP kullanın.

    En iyi uygulama kurulumu:

    - Her zaman açık Gateway ana makinesi (VPS/Mac mini).
    - Rol başına bir ajan (bağlamalar).
    - Bu ajanlara bağlanan Slack kanal(ları).
    - Gerektiğinde Chrome MCP veya bir Node üzerinden yerel tarayıcı.

    Belgeler: [Çok Ajanlı Yönlendirme](/tr/concepts/multi-agent), [Slack](/tr/channels/slack),
    [Tarayıcı](/tr/tools/browser), [Nodes](/tr/nodes).

  </Accordion>
</AccordionGroup>

## Modeller, devretme ve kimlik doğrulama profilleri

Model SSS — varsayılanlar, seçim, takma adlar, geçiş, devretme, kimlik doğrulama profilleri —
[Modeller SSS](/tr/help/faq-models) sayfasındadır.

## Gateway: bağlantı noktaları, "zaten çalışıyor" ve uzak mod

<AccordionGroup>
  <Accordion title="Gateway hangi bağlantı noktasını kullanır?">
    `gateway.port`, WebSocket + HTTP (Control UI, kancalar vb.) için tek çoklanmış bağlantı noktasını denetler.

    Öncelik sırası:

    ```
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > default 18789
    ```

  </Accordion>

  <Accordion title='openclaw gateway status neden "Runtime: running" ama "Connectivity probe: failed" diyor?'>
    Çünkü "running", **gözetleyicinin** görünümüdür (launchd/systemd/schtasks). Bağlantı probu ise CLI'nin gateway WebSocket'ine gerçekten bağlanmasıdır.

    `openclaw gateway status` kullanın ve şu satırlara güvenin:

    - `Probe target:` (probun gerçekten kullandığı URL)
    - `Listening:` (bağlantı noktasında gerçekten bağlı olan şey)
    - `Last gateway error:` (işlem canlı ama bağlantı noktası dinlemiyorken yaygın kök neden)

  </Accordion>

  <Accordion title='openclaw gateway status neden "Config (cli)" ve "Config (service)" değerlerini farklı gösteriyor?'>
    Hizmet başka bir dosyayla çalışırken siz farklı bir yapılandırma dosyasını düzenliyorsunuz (çoğunlukla `--profile` / `OPENCLAW_STATE_DIR` uyuşmazlığı).

    Düzeltme:

    ```bash
    openclaw gateway install --force
    ```

    Bunu hizmetin kullanmasını istediğiniz aynı `--profile` / ortamdan çalıştırın.

  </Accordion>

  <Accordion title='"another gateway instance is already listening" ne anlama gelir?'>
    OpenClaw, başlangıçta WebSocket dinleyicisini hemen bağlayarak bir çalışma zamanı kilidi uygular (varsayılan `ws://127.0.0.1:18789`). Bağlama `EADDRINUSE` ile başarısız olursa, başka bir instance'ın zaten dinlediğini belirten `GatewayLockError` fırlatır.

    Düzeltme: diğer instance'ı durdurun, bağlantı noktasını boşaltın veya `openclaw gateway --port <port>` ile çalıştırın.

  </Accordion>

  <Accordion title="OpenClaw'ı uzak modda nasıl çalıştırırım (istemci başka yerdeki bir Gateway'e bağlanır)?">
    `gateway.mode: "remote"` ayarlayın ve isteğe bağlı olarak paylaşılan gizli uzak kimlik bilgileriyle uzak bir WebSocket URL'sini gösterin:

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

    - `openclaw gateway` yalnızca `gateway.mode` `local` olduğunda (veya override bayrağını ilettiğinizde) başlar.
    - macOS uygulaması yapılandırma dosyasını izler ve bu değerler değiştiğinde modları canlı olarak değiştirir.
    - `gateway.remote.token` / `.password` yalnızca istemci tarafı uzak kimlik bilgileridir; tek başlarına yerel gateway kimlik doğrulamasını etkinleştirmezler.

  </Accordion>

  <Accordion title='Control UI "unauthorized" diyor (veya yeniden bağlanıp duruyor). Şimdi ne yapmalıyım?'>
    Gateway kimlik doğrulama yolunuz ve UI'nin kimlik doğrulama yöntemi eşleşmiyor.

    Gerçekler (koddan):

    - Control UI, token'ı geçerli tarayıcı sekmesi oturumu ve seçili gateway URL'si için `sessionStorage` içinde tutar; böylece aynı sekme yenilemeleri, uzun ömürlü localStorage token kalıcılığını geri yüklemeden çalışmaya devam eder.
    - `AUTH_TOKEN_MISMATCH` durumunda, güvenilir istemciler gateway yeniden deneme ipuçları döndürdüğünde (`canRetryWithDeviceToken=true`, `recommendedNextStep=retry_with_device_token`) önbelleğe alınmış bir cihaz token'ı ile sınırlı bir yeniden deneme yapabilir.
    - Bu önbelleğe alınmış token yeniden denemesi artık cihaz token'ıyla birlikte saklanan önbelleğe alınmış onaylı kapsamları yeniden kullanır. Açık `deviceToken` / açık `scopes` çağırıcıları ise önbelleğe alınmış kapsamları devralmak yerine kendi istenen kapsam kümesini korur.
    - Bu yeniden deneme yolu dışında, bağlantı kimlik doğrulamasında öncelik sırası açık paylaşılan token/parola, ardından açık `deviceToken`, ardından saklanan cihaz token'ı, ardından bootstrap token'dır.
    - Bootstrap token kapsam denetimleri rol öneklidir. Yerleşik bootstrap operatör izin listesi yalnızca operatör isteklerini karşılar; node veya diğer operatör dışı roller yine kendi rol önekleri altında kapsamlar gerektirir.

    Düzeltme:

    - En hızlı: `openclaw dashboard` (dashboard URL'sini yazdırır + kopyalar, açmayı dener; headless ise SSH ipucu gösterir).
    - Henüz token'ınız yoksa: `openclaw doctor --generate-gateway-token`.
    - Uzaksa önce tünel açın: `ssh -N -L 18789:127.0.0.1:18789 user@host` ardından `http://127.0.0.1:18789/` açın.
    - Paylaşılan gizli mod: `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` veya `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` ayarlayın, ardından eşleşen gizli değeri Control UI ayarlarına yapıştırın.
    - Tailscale Serve modu: `gateway.auth.allowTailscale` etkin olduğundan ve Tailscale kimlik üstbilgilerini atlayan ham bir loopback/tailnet URL'si yerine Serve URL'sini açtığınızdan emin olun.
    - Güvenilir proxy modu: ham gateway URL'si yerine yapılandırılmış kimlik farkındalığı olan proxy üzerinden geldiğinizden emin olun. Aynı ana makinedeki loopback proxy'leri de `gateway.auth.trustedProxy.allowLoopback = true` gerektirir.
    - Tek yeniden denemeden sonra uyuşmazlık sürerse, eşleştirilmiş cihaz token'ını döndürün/yeniden onaylayın:
      - `openclaw devices list`
      - `openclaw devices rotate --device <id> --role operator`
    - Bu döndürme çağrısı reddedildiğini söylüyorsa iki şeyi kontrol edin:
      - eşleştirilmiş cihaz oturumları yalnızca kendi **kendi** cihazlarını döndürebilir, ayrıca `operator.admin` varsa istisna
      - açık `--scope` değerleri çağırıcının geçerli operatör kapsamlarını aşamaz
    - Hâlâ takıldınız mı? `openclaw status --all` çalıştırın ve [Sorun giderme](/tr/gateway/troubleshooting) adımlarını izleyin. Kimlik doğrulama ayrıntıları için [Dashboard](/tr/web/dashboard) sayfasına bakın.

  </Accordion>

  <Accordion title="gateway.bind tailnet ayarladım ama bağlanamıyor ve hiçbir şey dinlemiyor">
    `tailnet` bağlaması, ağ arayüzlerinizden bir Tailscale IP'si seçer (100.64.0.0/10). Makine Tailscale üzerinde değilse (veya arayüz kapalıysa), bağlanacak hiçbir şey yoktur.

    Düzeltme:

    - O ana makinede Tailscale'i başlatın (böylece 100.x adresi olur), veya
    - `gateway.bind: "loopback"` / `"lan"` değerine geçin.

    Not: `tailnet` açıktır. `auto` loopback'i tercih eder; yalnızca tailnet'e bağlanmak istediğinizde `gateway.bind: "tailnet"` kullanın.

  </Accordion>

  <Accordion title="Aynı ana makinede birden fazla Gateway çalıştırabilir miyim?">
    Genellikle hayır; tek bir Gateway birden fazla mesajlaşma kanalı ve ajan çalıştırabilir. Birden fazla Gateway'i yalnızca yedeklilik (örn. kurtarma botu) veya katı yalıtım gerektiğinde kullanın.

    Evet, ancak yalıtmanız gerekir:

    - `OPENCLAW_CONFIG_PATH` (instance başına yapılandırma)
    - `OPENCLAW_STATE_DIR` (instance başına durum)
    - `agents.defaults.workspace` (çalışma alanı yalıtımı)
    - `gateway.port` (benzersiz bağlantı noktaları)

    Hızlı kurulum (önerilir):

    - Her instance için `openclaw --profile <name> ...` kullanın (`~/.openclaw-<name>` otomatik oluşturulur).
    - Her profil yapılandırmasında benzersiz bir `gateway.port` ayarlayın (veya manuel çalıştırmalarda `--port` iletin).
    - Profil başına hizmet kurun: `openclaw --profile <name> gateway install`.

    Profiller hizmet adlarına da sonek ekler (`ai.openclaw.<profile>`; eski `com.openclaw.*`, `openclaw-gateway-<profile>.service`, `OpenClaw Gateway (<profile>)`).
    Tam kılavuz: [Birden fazla gateway](/tr/gateway/multiple-gateways).

  </Accordion>

  <Accordion title='"invalid handshake" / code 1008 ne anlama gelir?'>
    Gateway bir **WebSocket sunucusudur** ve ilk iletinin
    bir `connect` çerçevesi olmasını bekler. Başka bir şey alırsa, bağlantıyı
    **kod 1008** (ilke ihlali) ile kapatır.

    Yaygın nedenler:

    - WS istemcisi yerine bir tarayıcıda **HTTP** URL'sini açtınız (`http://...`).
    - Yanlış bağlantı noktasını veya yolu kullandınız.
    - Bir proxy veya tünel kimlik doğrulama üstbilgilerini çıkardı ya da Gateway dışı bir istek gönderdi.

    Hızlı düzeltmeler:

    1. WS URL'sini kullanın: `ws://<host>:18789` (HTTPS ise `wss://...`).
    2. WS bağlantı noktasını normal bir tarayıcı sekmesinde açmayın.
    3. Kimlik doğrulama açıksa, token/parolayı `connect` çerçevesine ekleyin.

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

    `logging.file` ile sabit bir yol ayarlayabilirsiniz. Dosya günlük düzeyi `logging.level` tarafından denetlenir. Konsol ayrıntı düzeyi `--verbose` ve `logging.consoleLevel` tarafından denetlenir.

    En hızlı günlük izleme:

    ```bash
    openclaw logs --follow
    ```

    Hizmet/gözetleyici günlükleri (gateway launchd/systemd üzerinden çalıştığında):

    - macOS: `$OPENCLAW_STATE_DIR/logs/gateway.log` ve `gateway.err.log` (varsayılan: `~/.openclaw/logs/...`; profiller `~/.openclaw-<profile>/logs/...` kullanır)
    - Linux: `journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`
    - Windows: `schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`

    Daha fazlası için [Sorun giderme](/tr/gateway/troubleshooting) sayfasına bakın.

  </Accordion>

  <Accordion title="Gateway hizmetini nasıl başlatır/durdurur/yeniden başlatırım?">
    Gateway yardımcılarını kullanın:

    ```bash
    openclaw gateway status
    openclaw gateway restart
    ```

    Gateway'i manuel çalıştırıyorsanız, `openclaw gateway --force` bağlantı noktasını geri alabilir. [Gateway](/tr/gateway) sayfasına bakın.

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

    Belgeler: [Windows (WSL2)](/tr/platforms/windows), [Gateway hizmet runbook'u](/tr/gateway).

  </Accordion>

  <Accordion title="Gateway ayakta ama yanıtlar hiç gelmiyor. Neyi kontrol etmeliyim?">
    Hızlı bir sağlık taramasıyla başlayın:

    ```bash
    openclaw status
    openclaw models status
    openclaw channels status
    openclaw logs --follow
    ```

    Yaygın nedenler:

    - Model kimlik doğrulaması **Gateway ana makinesinde** yüklenmemiş (`models status` ile kontrol edin).
    - Kanal eşleştirme/izin listesi yanıtları engelliyor (kanal yapılandırmasını + günlükleri kontrol edin).
    - WebChat/Dashboard doğru token olmadan açık.

    Uzaktaysanız tünel/Tailscale bağlantısının açık olduğunu ve
    Gateway WebSocket'e erişilebildiğini doğrulayın.

    Belgeler: [Kanallar](/tr/channels), [Sorun giderme](/tr/gateway/troubleshooting), [Uzak erişim](/tr/gateway/remote).

  </Accordion>

  <Accordion title='"Gateway bağlantısı kesildi: neden yok" - şimdi ne yapmalıyım?'>
    Bu genellikle UI'nin WebSocket bağlantısını kaybettiği anlamına gelir. Şunları kontrol edin:

    1. Gateway çalışıyor mu? `openclaw gateway status`
    2. Gateway sağlıklı mı? `openclaw status`
    3. UI doğru token'a sahip mi? `openclaw dashboard`
    4. Uzaksa tünel/Tailscale bağlantısı açık mı?

    Ardından günlükleri takip edin:

    ```bash
    openclaw logs --follow
    ```

    Belgeler: [Dashboard](/tr/web/dashboard), [Uzak erişim](/tr/gateway/remote), [Sorun giderme](/tr/gateway/troubleshooting).

  </Accordion>

  <Accordion title="Telegram setMyCommands başarısız oluyor. Neyi kontrol etmeliyim?">
    Günlükler ve kanal durumuyla başlayın:

    ```bash
    openclaw channels status
    openclaw channels logs --channel telegram
    ```

    Ardından hatayı eşleştirin:

    - `BOT_COMMANDS_TOO_MUCH`: Telegram menüsünde çok fazla giriş var. OpenClaw zaten Telegram sınırına göre kırpar ve daha az komutla yeniden dener, ancak bazı menü girişlerinin yine de kaldırılması gerekir. Plugin/skill/özel komutları azaltın veya menüye ihtiyacınız yoksa `channels.telegram.commands.native` ayarını devre dışı bırakın.
    - `TypeError: fetch failed`, `Network request for 'setMyCommands' failed!` veya benzer ağ hataları: Bir VPS üzerinde veya proxy arkasındaysanız, giden HTTPS'ye izin verildiğini ve DNS'in `api.telegram.org` için çalıştığını doğrulayın.

    Gateway uzaksa Gateway ana makinesindeki günlüklere baktığınızdan emin olun.

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
    kanalında yanıt bekliyorsanız teslimin etkin olduğundan emin olun (`/deliver on`).

    Belgeler: [TUI](/tr/web/tui), [Slash komutları](/tr/tools/slash-commands).

  </Accordion>

  <Accordion title="Gateway'i tamamen nasıl durdurup sonra başlatırım?">
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

    Belgeler: [Gateway hizmet runbook'u](/tr/gateway).

  </Accordion>

  <Accordion title="Basitçe: openclaw gateway restart ile openclaw gateway farkı">
    - `openclaw gateway restart`: **arka plan hizmetini** (launchd/systemd) yeniden başlatır.
    - `openclaw gateway`: bu terminal oturumu için gateway'i **ön planda** çalıştırır.

    Hizmeti kurduysanız gateway komutlarını kullanın. Tek seferlik, ön planda çalıştırma
    istediğinizde `openclaw gateway` kullanın.

  </Accordion>

  <Accordion title="Bir şey başarısız olduğunda daha fazla ayrıntı almanın en hızlı yolu">
    Daha fazla konsol ayrıntısı almak için Gateway'i `--verbose` ile başlatın. Ardından kanal kimlik doğrulaması, model yönlendirme ve RPC hataları için günlük dosyasını inceleyin.
  </Accordion>
</AccordionGroup>

## Medya ve ekler

<AccordionGroup>
  <Accordion title="Skill'im bir görüntü/PDF oluşturdu, ancak hiçbir şey gönderilmedi">
    Agent'tan giden ekler kendi satırında bir `MEDIA:<path-or-url>` satırı içermelidir. Bkz. [OpenClaw assistant kurulumu](/tr/start/openclaw) ve [Agent gönderme](/tr/tools/agent-send).

    CLI gönderimi:

    ```bash
    openclaw message send --target +15555550123 --message "Here you go" --media /path/to/file.png
    ```

    Şunları da kontrol edin:

    - Hedef kanal giden medyayı destekliyor ve izin listeleri tarafından engellenmiyor.
    - Dosya sağlayıcının boyut sınırları içinde (görüntüler en fazla 2048 piksele yeniden boyutlandırılır).
    - `tools.fs.workspaceOnly=true`, yerel yol gönderimlerini workspace, temp/media-store ve sandbox tarafından doğrulanmış dosyalarla sınırlar.
    - `tools.fs.workspaceOnly=false`, `MEDIA:` ile agent'ın zaten okuyabildiği ana makine yerel dosyalarını göndermesine izin verir, ancak yalnızca medya ve güvenli belge türleri için (görüntüler, ses, video, PDF ve Office belgeleri). Düz metin ve gizli bilgi gibi görünen dosyalar yine de engellenir.

    Bkz. [Görüntüler](/tr/nodes/images).

  </Accordion>
</AccordionGroup>

## Güvenlik ve erişim denetimi

<AccordionGroup>
  <Accordion title="OpenClaw'u gelen DM'lere açmak güvenli mi?">
    Gelen DM'leri güvenilmeyen girdi olarak ele alın. Varsayılanlar riski azaltacak şekilde tasarlanmıştır:

    - DM destekleyen kanallarda varsayılan davranış **eşleştirme**dir:
      - Bilinmeyen gönderenler bir eşleştirme kodu alır; bot mesajlarını işlemez.
      - Şununla onaylayın: `openclaw pairing approve --channel <channel> [--account <id>] <code>`
      - Bekleyen istekler **kanal başına 3** ile sınırlıdır; bir kod ulaşmadıysa `openclaw pairing list --channel <channel> [--account <id>]` kontrol edin.
    - DM'leri herkese açık hale getirmek açık bir katılım gerektirir (`dmPolicy: "open"` ve izin listesi `"*"`).

    Riskli DM ilkelerini ortaya çıkarmak için `openclaw doctor` çalıştırın.

  </Accordion>

  <Accordion title="Prompt injection yalnızca herkese açık botlar için mi bir endişe?">
    Hayır. Prompt injection, yalnızca bot'a kimin DM atabildiğiyle değil, **güvenilmeyen içerikle** ilgilidir.
    Assistant'ınız harici içerik okuyorsa (web araması/getirme, tarayıcı sayfaları, e-postalar,
    belgeler, ekler, yapıştırılmış günlükler), bu içerik modeli ele geçirmeye çalışan
    talimatlar içerebilir. Bu, **tek gönderen siz olsanız bile** gerçekleşebilir.

    En büyük risk araçlar etkin olduğundadır: model, bağlamı dışarı sızdırması veya
    sizin adınıza araçları çağırması için kandırılabilir. Etki alanını şu şekilde azaltın:

    - güvenilmeyen içeriği özetlemek için salt okunur veya araçları devre dışı bırakılmış bir "okuyucu" agent kullanma
    - araçları etkin agent'lar için `web_search` / `web_fetch` / `browser` kapalı tutma
    - kodu çözülmüş dosya/belge metnini de güvenilmeyen olarak ele alma: OpenResponses
      `input_file` ve medya eki çıkarma işlemi, ham dosya metnini geçirmek yerine
      çıkarılan metni açık harici içerik sınır işaretleriyle sarar
    - sandbox kullanma ve katı araç izin listeleri

    Ayrıntılar: [Güvenlik](/tr/gateway/security).

  </Accordion>

  <Accordion title="Bot'umun kendi e-postası, GitHub hesabı veya telefon numarası olmalı mı?">
    Evet, çoğu kurulum için. Bot'u ayrı hesaplar ve telefon numaralarıyla yalıtmak,
    bir şeyler ters giderse etki alanını azaltır. Bu ayrıca kişisel hesaplarınızı etkilemeden
    kimlik bilgilerini döndürmeyi veya erişimi iptal etmeyi kolaylaştırır.

    Küçük başlayın. Yalnızca gerçekten ihtiyaç duyduğunuz araçlara ve hesaplara erişim verin ve gerekirse
    daha sonra genişletin.

    Belgeler: [Güvenlik](/tr/gateway/security), [Eşleştirme](/tr/channels/pairing).

  </Accordion>

  <Accordion title="Metin mesajlarım üzerinde otonomi verebilir miyim ve bu güvenli mi?">
    Kişisel mesajlarınız üzerinde tam otonomi **önermiyoruz**. En güvenli kalıp şudur:

    - DM'leri **eşleştirme modunda** veya sıkı bir izin listesinde tutun.
    - Sizin adınıza mesaj göndermesini istiyorsanız **ayrı bir numara veya hesap** kullanın.
    - Taslak oluşturmasına izin verin, ardından **göndermeden önce onaylayın**.

    Denemek istiyorsanız bunu özel bir hesapta yapın ve yalıtılmış tutun. Bkz.
    [Güvenlik](/tr/gateway/security).

  </Accordion>

  <Accordion title="Kişisel assistant görevleri için daha ucuz modeller kullanabilir miyim?">
    Evet, agent yalnızca sohbet amaçlıysa ve girdi güvenilirse **kullanabilirsiniz**. Daha küçük katmanlar
    talimat ele geçirmeye daha yatkındır, bu nedenle araçları etkin agent'lar için
    veya güvenilmeyen içerik okurken bunlardan kaçının. Daha küçük bir model kullanmanız gerekiyorsa,
    araçları sıkı şekilde sınırlandırın ve bir sandbox içinde çalıştırın. Bkz. [Güvenlik](/tr/gateway/security).
  </Accordion>

  <Accordion title="Telegram'da /start çalıştırdım ancak eşleştirme kodu almadım">
    Eşleştirme kodları **yalnızca** bilinmeyen bir gönderen bot'a mesaj gönderdiğinde ve
    `dmPolicy: "pairing"` etkin olduğunda gönderilir. `/start` tek başına kod oluşturmaz.

    Bekleyen istekleri kontrol edin:

    ```bash
    openclaw pairing list telegram
    ```

    Hemen erişim istiyorsanız gönderen kimliğinizi izin listesine ekleyin veya bu hesap için
    `dmPolicy: "open"` ayarlayın.

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

    Sihirbaz telefon numarası istemi: kendi DM'lerinize izin verilmesi için **izin listenizi/sahibinizi** ayarlamak üzere kullanılır. Otomatik gönderim için kullanılmaz. Kişisel WhatsApp numaranızda çalıştırıyorsanız bu numarayı kullanın ve `channels.whatsapp.selfChatMode` etkinleştirin.

  </Accordion>
</AccordionGroup>

## Sohbet komutları, görevleri iptal etme ve "durmuyor"

<AccordionGroup>
  <Accordion title="Dahili sistem mesajlarının sohbette görünmesini nasıl durdururum?">
    Çoğu dahili veya araç mesajı yalnızca o oturum için **verbose**, **trace** veya **reasoning** etkin olduğunda
    görünür.

    Gördüğünüz sohbette düzeltin:

    ```
    /verbose off
    /trace off
    /reasoning off
    ```

    Hâlâ gürültülüyse Control UI içindeki oturum ayarlarını kontrol edin ve verbose ayarını
    **inherit** olarak belirleyin. Ayrıca yapılandırmada `verboseDefault` değeri `on` olarak ayarlanmış
    bir bot profili kullanmadığınızı doğrulayın.

    Belgeler: [Düşünme ve verbose](/tr/tools/thinking), [Güvenlik](/tr/gateway/security/index#reasoning-and-verbose-output-in-groups).

  </Accordion>

  <Accordion title="Çalışan bir görevi nasıl durdurur/iptal ederim?">
    Bunlardan herhangi birini **tek başına bir mesaj olarak** gönderin (slash yok):

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

    Bunlar iptal tetikleyicileridir (slash komutları değildir).

    Arka plan süreçleri için (exec aracından), agent'tan şunu çalıştırmasını isteyebilirsiniz:

    ```
    process action:kill sessionId:XXX
    ```

    Slash komutlarına genel bakış: bkz. [Slash komutları](/tr/tools/slash-commands).

    Çoğu komut `/` ile başlayan **tek başına** bir mesaj olarak gönderilmelidir, ancak birkaç kısayol (`/status` gibi) izin listesine alınmış gönderenler için satır içinde de çalışır.

  </Accordion>

  <Accordion title='Telegram'dan Discord mesajı nasıl gönderirim? ("Bağlamlar arası mesajlaşma reddedildi")'>
    OpenClaw varsayılan olarak **sağlayıcılar arası** mesajlaşmayı engeller. Bir araç çağrısı
    Telegram'a bağlıysa, açıkça izin vermediğiniz sürece Discord'a göndermez.

    Agent için sağlayıcılar arası mesajlaşmayı etkinleştirin:

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

  <Accordion title='Bot hızlı arka arkaya mesajları "yok sayıyor" gibi neden hissettiriyor?'>
    Kuyruk modu, yeni mesajların devam eden bir çalışmayla nasıl etkileşime girdiğini kontrol eder. Modları değiştirmek için `/queue` kullanın:

    - `steer` - mevcut çalışmadaki bir sonraki model sınırı için bekleyen tüm yönlendirmeleri kuyruğa al
    - `queue` - eski tarz tek seferde bir yönlendirme
    - `followup` - mesajları tek tek çalıştır
    - `collect` - mesajları toplu işle ve bir kez yanıtla
    - `steer-backlog` - şimdi yönlendir, ardından birikmiş işleri işle
    - `interrupt` - mevcut çalışmayı iptal et ve baştan başlat

    Varsayılan mod `steer` modudur. Takip modları için `debounce:0.5s cap:25 drop:summarize` gibi seçenekler ekleyebilirsiniz. Bkz. [Komut kuyruğu](/tr/concepts/queue) ve [Steering kuyruğu](/tr/concepts/queue-steering).

  </Accordion>
</AccordionGroup>

## Çeşitli

<AccordionGroup>
  <Accordion title='API anahtarıyla Anthropic için varsayılan model nedir?'>
    OpenClaw'da kimlik bilgileri ve model seçimi ayrıdır. `ANTHROPIC_API_KEY` ayarını yapmak (veya auth profillerinde bir Anthropic API anahtarı saklamak) kimlik doğrulamayı etkinleştirir, ancak gerçek varsayılan model `agents.defaults.model.primary` içinde yapılandırdığınız modeldir (örneğin, `anthropic/claude-sonnet-4-6` veya `anthropic/claude-opus-4-6`). `No credentials found for profile "anthropic:default"` görürseniz bu, Gateway'in çalışan ajan için beklenen `auth-profiles.json` içinde Anthropic kimlik bilgilerini bulamadığı anlamına gelir.
  </Accordion>
</AccordionGroup>

---

Hâlâ takıldınız mı? [Discord](https://discord.com/invite/clawd) üzerinde sorun veya bir [GitHub tartışması](https://github.com/openclaw/openclaw/discussions) açın.

## İlgili

- [İlk çalıştırma SSS](/tr/help/faq-first-run) — kurulum, ilk katılım, kimlik doğrulama, abonelikler, erken hatalar
- [Modeller SSS](/tr/help/faq-models) — model seçimi, yük devretme, auth profilleri
- [Sorun giderme](/tr/help/troubleshooting) — belirti odaklı triyaj
