---
read_when:
    - Yaygın kurulum, yükleme, onboarding veya çalışma zamanı destek sorularını yanıtlama
    - Daha derin hata ayıklamadan önce kullanıcı tarafından bildirilen sorunları ön değerlendirme
summary: OpenClaw kurulumu, yapılandırması ve kullanımı hakkında sık sorulan sorular
title: SSS
x-i18n:
    generated_at: "2026-05-02T08:57:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: f818d009a261e32df22c793ab9018ff20cc38f799428d0cfdd8979f8c6d94e13
    source_path: help/faq.md
    workflow: 16
---

Gerçek dünya kurulumları (yerel geliştirme, VPS, çoklu ajan, OAuth/API anahtarları, model failover) için hızlı yanıtlar ve daha derin sorun giderme. Çalışma zamanı tanılamaları için [Sorun giderme](/tr/gateway/troubleshooting) bölümüne bakın. Tam yapılandırma referansı için [Yapılandırma](/tr/gateway/configuration) bölümüne bakın.

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

   Günlük kuyruğu ile salt okunur tanılama (belirteçler gizlenir).

3. **Daemon + port durumu**

   ```bash
   openclaw gateway status
   ```

   Supervisor çalışma zamanı ile RPC erişilebilirliğini, yoklama hedef URL’sini ve hizmetin muhtemelen hangi yapılandırmayı kullandığını gösterir.

4. **Derin yoklamalar**

   ```bash
   openclaw status --deep
   ```

   Desteklendiğinde kanal yoklamaları dahil olmak üzere canlı bir Gateway sağlık yoklaması çalıştırır
   (erişilebilir bir Gateway gerektirir). Bkz. [Sağlık](/tr/gateway/health).

5. **En son günlüğü takip edin**

   ```bash
   openclaw logs --follow
   ```

   RPC kapalıysa şuna geri dönün:

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   Dosya günlükleri hizmet günlüklerinden ayrıdır; bkz. [Günlükleme](/tr/logging) ve [Sorun giderme](/tr/gateway/troubleshooting).

6. **Doctor çalıştırın (onarımlar)**

   ```bash
   openclaw doctor
   ```

   Yapılandırmayı/durumu onarır/geçirir + sağlık kontrolleri çalıştırır. Bkz. [Doctor](/tr/gateway/doctor).

7. **Gateway anlık görüntüsü**

   ```bash
   openclaw health --json
   openclaw health --verbose   # shows the target URL + config path on errors
   ```

   Çalışan Gateway’den tam bir anlık görüntü ister (yalnızca WS). Bkz. [Sağlık](/tr/gateway/health).

## Hızlı başlangıç ve ilk çalıştırma kurulumu

İlk çalıştırma SSS’si — kurulum, ilk yapılandırma, kimlik doğrulama rotaları, abonelikler, ilk hatalar —
[İlk çalıştırma SSS](/tr/help/faq-first-run) sayfasında bulunur.

## OpenClaw nedir?

<AccordionGroup>
  <Accordion title="OpenClaw tek paragrafta nedir?">
    OpenClaw, kendi cihazlarınızda çalıştırdığınız kişisel bir AI asistanıdır. Zaten kullandığınız mesajlaşma yüzeylerinde yanıt verir (WhatsApp, Telegram, Slack, Mattermost, Discord, Google Chat, Signal, iMessage, WebChat ve QQ Bot gibi paketlenmiş kanal Plugin’leri) ve desteklenen platformlarda ses + canlı Canvas da kullanabilir. **Gateway**, sürekli açık kontrol düzlemidir; asistan ürünün kendisidir.
  </Accordion>

  <Accordion title="Değer önerisi">
    OpenClaw "yalnızca bir Claude sarmalayıcısı" değildir. Zaten kullandığınız sohbet uygulamalarından erişilebilen, **kendi donanımınızda** yetenekli bir asistan çalıştırmanızı sağlayan, durumlu oturumlara, belleğe ve araçlara sahip bir **yerel öncelikli kontrol düzlemidir**; iş akışlarınızın kontrolünü barındırılan bir SaaS’ye devretmenizi gerektirmez.

    Öne çıkanlar:

    - **Cihazlarınız, verileriniz:** Gateway’i istediğiniz yerde çalıştırın (Mac, Linux, VPS) ve çalışma alanı + oturum geçmişini yerel tutun.
    - **Web sandbox değil, gerçek kanallar:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage/vb.,
      ayrıca desteklenen platformlarda mobil ses ve Canvas.
    - **Modelden bağımsız:** Ajan bazlı yönlendirme ve failover ile Anthropic, OpenAI, MiniMax, OpenRouter vb. kullanın.
    - **Yalnızca yerel seçenek:** İsterseniz **tüm verilerin cihazınızda kalabilmesi** için yerel modeller çalıştırın.
    - **Çoklu ajan yönlendirmesi:** Her biri kendi çalışma alanına ve varsayılanlarına sahip olacak şekilde kanal, hesap veya görev başına ayrı ajanlar.
    - **Açık kaynaklı ve hacklenebilir:** Tedarikçi kilidine girmeden inceleyin, genişletin ve kendiniz barındırın.

    Dokümanlar: [Gateway](/tr/gateway), [Kanallar](/tr/channels), [Çoklu ajan](/tr/concepts/multi-agent),
    [Bellek](/tr/concepts/memory).

  </Accordion>

  <Accordion title="Yeni kurdum - önce ne yapmalıyım?">
    İyi ilk projeler:

    - Bir web sitesi oluşturun (WordPress, Shopify veya basit bir statik site).
    - Bir mobil uygulama prototipi hazırlayın (taslak, ekranlar, API planı).
    - Dosya ve klasörleri düzenleyin (temizlik, adlandırma, etiketleme).
    - Gmail’i bağlayın ve özetleri veya takipleri otomatikleştirin.

    Büyük görevleri halledebilir, ancak bunları aşamalara böldüğünüzde ve
    paralel işler için alt ajanlar kullandığınızda en iyi sonucu verir.

  </Accordion>

  <Accordion title="OpenClaw için en yaygın beş günlük kullanım senaryosu nedir?">
    Günlük kazanımlar genellikle şöyle görünür:

    - **Kişisel brifingler:** Gelen kutusu, takvim ve ilgilendiğiniz haberlerin özetleri.
    - **Araştırma ve taslak oluşturma:** E-postalar veya dokümanlar için hızlı araştırma, özetler ve ilk taslaklar.
    - **Hatırlatıcılar ve takipler:** Cron veya Heartbeat güdümlü dürtmeler ve kontrol listeleri.
    - **Tarayıcı otomasyonu:** Form doldurma, veri toplama ve web görevlerini tekrarlama.
    - **Cihazlar arası koordinasyon:** Telefonunuzdan bir görev gönderin, Gateway’in bunu bir sunucuda çalıştırmasına izin verin ve sonucu sohbette geri alın.

  </Accordion>

  <Accordion title="OpenClaw bir SaaS için potansiyel müşteri bulma, erişim, reklamlar ve bloglarda yardımcı olabilir mi?">
    **Araştırma, nitelendirme ve taslak oluşturma** için evet. Siteleri tarayabilir, kısa listeler oluşturabilir,
    potansiyel müşterileri özetleyebilir ve erişim ya da reklam metni taslakları yazabilir.

    **Erişim veya reklam çalışmaları** için süreçte bir insan bulundurun. Spam’den kaçının, yerel yasalara ve
    platform politikalarına uyun ve gönderilmeden önce her şeyi gözden geçirin. En güvenli kalıp,
    OpenClaw’ın taslak hazırlaması ve sizin onaylamanızdır.

    Dokümanlar: [Güvenlik](/tr/gateway/security).

  </Accordion>

  <Accordion title="Web geliştirme için Claude Code’a göre avantajları nelerdir?">
    OpenClaw bir **kişisel asistan** ve koordinasyon katmanıdır, IDE’nin yerine geçmez. Bir repo içinde en hızlı doğrudan kodlama döngüsü için
    Claude Code veya Codex kullanın. Kalıcı bellek, cihazlar arası erişim ve araç orkestrasyonu istediğinizde OpenClaw kullanın.

    Avantajlar:

    - Oturumlar arasında **kalıcı bellek + çalışma alanı**
    - **Çok platformlu erişim** (WhatsApp, Telegram, TUI, WebChat)
    - **Araç orkestrasyonu** (tarayıcı, dosyalar, zamanlama, hook’lar)
    - **Sürekli açık Gateway** (bir VPS’te çalıştırın, her yerden etkileşim kurun)
    - Yerel tarayıcı/ekran/kamera/komut yürütme için **Nodes**

    Showcase: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills ve otomasyon

<AccordionGroup>
  <Accordion title="Repo’yu kirli tutmadan Skills’i nasıl özelleştiririm?">
    Repo kopyasını düzenlemek yerine yönetilen geçersiz kılmaları kullanın. Değişikliklerinizi `~/.openclaw/skills/<name>/SKILL.md` içine koyun (veya `~/.openclaw/openclaw.json` içinde `skills.load.extraDirs` aracılığıyla bir klasör ekleyin). Öncelik sırası `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → paketlenmiş → `skills.load.extraDirs` şeklindedir; bu yüzden yönetilen geçersiz kılmalar git’e dokunmadan paketlenmiş Skills’e göre hâlâ kazanır. Skill’in global kurulması ama yalnızca bazı ajanlara görünmesi gerekiyorsa paylaşılan kopyayı `~/.openclaw/skills` içinde tutun ve görünürlüğü `agents.defaults.skills` ile `agents.list[].skills` üzerinden kontrol edin. Yalnızca upstream’e uygun düzenlemeler repo’da yaşamalı ve PR olarak gönderilmelidir.
  </Accordion>

  <Accordion title="Skills’i özel bir klasörden yükleyebilir miyim?">
    Evet. `~/.openclaw/openclaw.json` içinde `skills.load.extraDirs` aracılığıyla ek dizinler ekleyin (en düşük öncelik). Varsayılan öncelik sırası `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → paketlenmiş → `skills.load.extraDirs` şeklindedir. `clawhub` varsayılan olarak `./skills` içine kurar; OpenClaw bunu sonraki oturumda `<workspace>/skills` olarak ele alır. Skill yalnızca belirli ajanlara görünmeliyse bunu `agents.defaults.skills` veya `agents.list[].skills` ile eşleştirin.
  </Accordion>

  <Accordion title="Farklı görevler için farklı modelleri nasıl kullanabilirim?">
    Bugün desteklenen kalıplar şunlardır:

    - **Cron işleri**: Yalıtılmış işler, iş başına bir `model` geçersiz kılması ayarlayabilir.
    - **Alt ajanlar**: Görevleri farklı varsayılan modellere sahip ayrı ajanlara yönlendirin.
    - **İsteğe bağlı geçiş**: Geçerli oturum modelini istediğiniz zaman değiştirmek için `/model` kullanın.

    Bkz. [Cron işleri](/tr/automation/cron-jobs), [Çoklu Ajan Yönlendirmesi](/tr/concepts/multi-agent) ve [Slash komutları](/tr/tools/slash-commands).

  </Accordion>

  <Accordion title="Bot ağır iş yaparken donuyor. Bunu nasıl başka yere aktarırım?">
    Uzun veya paralel görevler için **alt ajanlar** kullanın. Alt ajanlar kendi oturumlarında çalışır,
    bir özet döndürür ve ana sohbetinizin yanıt verebilir kalmasını sağlar.

    Botunuzdan "bu görev için bir alt ajan başlatmasını" isteyin veya `/subagents` kullanın.
    Gateway’in şu anda ne yaptığını (ve meşgul olup olmadığını) görmek için sohbette `/status` kullanın.

    Token ipucu: uzun görevler ve alt ajanlar token tüketir. Maliyet önemliyse alt ajanlar için
    `agents.defaults.subagents.model` aracılığıyla daha ucuz bir model ayarlayın.

    Dokümanlar: [Alt ajanlar](/tr/tools/subagents), [Arka Plan Görevleri](/tr/automation/tasks).

  </Accordion>

  <Accordion title="Discord’da iş parçacığına bağlı alt ajan oturumları nasıl çalışır?">
    İş parçacığı bağlamalarını kullanın. Bir Discord iş parçacığını bir alt ajana veya oturum hedefine bağlayabilirsiniz; böylece o iş parçacığındaki takip mesajları bağlı oturumda kalır.

    Temel akış:

    - `thread: true` kullanarak `sessions_spawn` ile başlatın (kalıcı takip için isteğe bağlı olarak `mode: "session"`).
    - Veya `/focus <target>` ile manuel bağlayın.
    - Bağlama durumunu incelemek için `/agents` kullanın.
    - Otomatik odağı kaldırmayı kontrol etmek için `/session idle <duration|off>` ve `/session max-age <duration|off>` kullanın.
    - İş parçacığını ayırmak için `/unfocus` kullanın.

    Gerekli yapılandırma:

    - Global varsayılanlar: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
    - Discord geçersiz kılmaları: `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours`.
    - Başlatmada otomatik bağlama: `channels.discord.threadBindings.spawnSessions` varsayılan olarak `true` değerindedir; iş parçacığına bağlı oturum başlatmalarını devre dışı bırakmak için bunu `false` olarak ayarlayın.

    Dokümanlar: [Alt ajanlar](/tr/tools/subagents), [Discord](/tr/channels/discord), [Yapılandırma Referansı](/tr/gateway/configuration-reference), [Slash komutları](/tr/tools/slash-commands).

  </Accordion>

  <Accordion title="Bir alt ajan tamamlandı, ancak tamamlanma güncellemesi yanlış yere gitti veya hiç gönderilmedi. Neyi kontrol etmeliyim?">
    Önce çözümlenen istekte bulunan rotasını kontrol edin:

    - Tamamlama modundaki alt ajan teslimatı, varsa bağlı herhangi bir iş parçacığı veya konuşma rotasını tercih eder.
    - Tamamlama kaynağı yalnızca bir kanal taşıyorsa OpenClaw, doğrudan teslimatın yine de başarılı olabilmesi için istekte bulunan oturumun saklanan rotasına (`lastChannel` / `lastTo` / `lastAccountId`) geri döner.
    - Ne bağlı bir rota ne de kullanılabilir saklı bir rota varsa doğrudan teslimat başarısız olabilir ve sonuç sohbete hemen gönderilmek yerine kuyruğa alınmış oturum teslimatına geri döner.
    - Geçersiz veya eski hedefler yine de kuyruk geri dönüşünü veya nihai teslimat hatasını zorlayabilir.
    - Çocuğun son görünür asistan yanıtı tam olarak sessiz token `NO_REPLY` / `no_reply` veya tam olarak `ANNOUNCE_SKIP` ise OpenClaw, eski ilerlemeyi göndermek yerine duyuruyu bilerek bastırır.
    - Çocuk yalnızca araç çağrılarından sonra zaman aşımına uğradıysa duyuru, ham araç çıktısını yeniden oynatmak yerine bunu kısa bir kısmi ilerleme özetine indirebilir.

    Hata ayıklama:

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    Dokümanlar: [Alt ajanlar](/tr/tools/subagents), [Arka Plan Görevleri](/tr/automation/tasks), [Oturum Araçları](/tr/concepts/session-tool).

  </Accordion>

  <Accordion title="Cron veya hatırlatıcılar tetiklenmiyor. Neyi kontrol etmeliyim?">
    Cron, Gateway işleminin içinde çalışır. Gateway sürekli çalışmıyorsa,
    zamanlanmış işler çalışmaz.

    Kontrol listesi:

    - Cron’un etkin olduğunu (`cron.enabled`) ve `OPENCLAW_SKIP_CRON` ayarlanmadığını doğrulayın.
    - Gateway’in 7/24 çalıştığını kontrol edin (uyku/yeniden başlatma yok).
    - İş için saat dilimi ayarlarını doğrulayın (`--tz` ile ana makine saat dilimi).

    Hata ayıklama:

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    Dokümanlar: [Cron işleri](/tr/automation/cron-jobs), [Otomasyon ve Görevler](/tr/automation).

  </Accordion>

  <Accordion title="Cron çalıştı, ancak kanala hiçbir şey gönderilmedi. Neden?">
    Önce teslim modunu kontrol edin:

    - `--no-deliver` / `delivery.mode: "none"` hiçbir runner geri dönüş gönderiminin beklenmediği anlamına gelir.
    - Eksik veya geçersiz duyuru hedefi (`channel` / `to`), runner'ın giden teslimi atladığı anlamına gelir.
    - Kanal kimlik doğrulama hataları (`unauthorized`, `Forbidden`), runner'ın teslim etmeyi denediği ancak kimlik bilgilerinin bunu engellediği anlamına gelir.
    - Sessiz izole sonuç (yalnızca `NO_REPLY` / `no_reply`) kasıtlı olarak teslim edilemez kabul edilir, bu nedenle runner kuyruğa alınmış geri dönüş teslimini de bastırır.

    İzole cron işleri için, bir sohbet rotası mevcut olduğunda agent hâlâ doğrudan `message`
    aracıyla gönderebilir. `--announce` yalnızca agent'ın zaten göndermediği
    nihai metin için runner geri dönüş yolunu kontrol eder.

    Hata ayıklama:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Belgeler: [Cron işleri](/tr/automation/cron-jobs), [Arka Plan Görevleri](/tr/automation/tasks).

  </Accordion>

  <Accordion title="İzole bir cron çalıştırması neden model değiştirdi veya bir kez yeniden denedi?">
    Bu genellikle yinelenen zamanlama değil, canlı model değiştirme yoludur.

    İzole cron, etkin çalıştırma `LiveSessionModelSwitchError` fırlattığında
    çalışma zamanı model devrini kalıcı hale getirebilir ve yeniden deneyebilir. Yeniden deneme,
    değiştirilmiş sağlayıcıyı/modeli korur ve değişiklik yeni bir kimlik doğrulama profili geçersiz kılması taşıyorsa cron
    yeniden denemeden önce onu da kalıcı hale getirir.

    İlgili seçim kuralları:

    - Uygun olduğunda önce Gmail hook model geçersiz kılması kazanır.
    - Sonra iş başına `model`.
    - Sonra depolanmış herhangi bir cron oturumu model geçersiz kılması.
    - Sonra normal agent/varsayılan model seçimi.

    Yeniden deneme döngüsü sınırlıdır. İlk deneme artı 2 değiştirme yeniden denemesinden sonra,
    cron sonsuza kadar döngüye girmek yerine durur.

    Hata ayıklama:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Belgeler: [Cron işleri](/tr/automation/cron-jobs), [cron CLI](/tr/cli/cron).

  </Accordion>

  <Accordion title="Linux'ta Skills nasıl kurarım?">
    Yerel `openclaw skills` komutlarını kullanın veya skills öğelerini çalışma alanınıza bırakın. macOS Skills arayüzü Linux'ta kullanılamaz.
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
    senkronize etmek istiyorsanız kurun. Agent'lar genelinde paylaşılan kurulumlar için skill'i
    `~/.openclaw/skills` altına koyun ve hangi agent'ların onu görebileceğini daraltmak istiyorsanız
    `agents.defaults.skills` veya
    `agents.list[].skills` kullanın.

  </Accordion>

  <Accordion title="OpenClaw görevleri bir zamanlamaya göre veya arka planda sürekli çalıştırabilir mi?">
    Evet. Gateway zamanlayıcısını kullanın:

    - Zamanlanmış veya yinelenen görevler için **Cron işleri** (yeniden başlatmalar arasında kalıcıdır).
    - "ana oturum" dönemsel kontrolleri için **Heartbeat**.
    - Özet gönderen veya sohbetlere teslim eden otonom agent'lar için **İzole işler**.

    Belgeler: [Cron işleri](/tr/automation/cron-jobs), [Otomasyon ve Görevler](/tr/automation),
    [Heartbeat](/tr/gateway/heartbeat).

  </Accordion>

  <Accordion title="Apple macOS'a özel skills öğelerini Linux'tan çalıştırabilir miyim?">
    Doğrudan değil. macOS skills öğeleri `metadata.openclaw.os` ve gerekli ikili dosyalarla sınırlandırılır ve skills yalnızca **Gateway ana makinesinde** uygun olduklarında sistem isteminde görünür. Linux'ta, `darwin`'e özel skills (`apple-notes`, `apple-reminders`, `things-mac` gibi), bu sınırlamayı geçersiz kılmadığınız sürece yüklenmez.

    Desteklenen üç kalıbınız var:

    **Seçenek A - Gateway'i bir Mac'te çalıştırın (en basit).**
    Gateway'i macOS ikili dosyalarının bulunduğu yerde çalıştırın, ardından Linux'tan [uzak modda](#gateway-ports-already-running-and-remote-mode) veya Tailscale üzerinden bağlanın. Gateway ana makinesi macOS olduğu için skills normal şekilde yüklenir.

    **Seçenek B - macOS node kullanın (SSH yok).**
    Gateway'i Linux'ta çalıştırın, bir macOS node (menü çubuğu uygulaması) eşleyin ve Mac'te **Node Run Commands** ayarını "Always Ask" veya "Always Allow" yapın. OpenClaw, gerekli ikili dosyalar node üzerinde mevcut olduğunda macOS'a özel skills öğelerini uygun kabul edebilir. Agent bu skills öğelerini `nodes` aracı üzerinden çalıştırır. "Always Ask" seçerseniz, istemde "Always Allow" onayı bu komutu izin listesine ekler.

    **Seçenek C - macOS ikili dosyalarını SSH üzerinden proxy'leyin (gelişmiş).**
    Gateway'i Linux'ta tutun, ancak gerekli CLI ikili dosyalarının Mac'te çalışan SSH sarmalayıcılarına çözümlenmesini sağlayın. Ardından Linux'a izin vermek için skill'i geçersiz kılın, böylece uygun kalır.

    1. İkili dosya için bir SSH sarmalayıcı oluşturun (örnek: Apple Notes için `memo`):

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. Sarmalayıcıyı Linux ana makinesinde `PATH` üzerine koyun (örneğin `~/bin/memo`).
    3. Linux'a izin vermek için skill metadata'sını (çalışma alanı veya `~/.openclaw/skills`) geçersiz kılın:

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

    - **Özel skill / Plugin:** güvenilir API erişimi için en iyisi (Notion/HeyGen'in ikisinin de API'leri vardır).
    - **Tarayıcı otomasyonu:** kod olmadan çalışır ancak daha yavaş ve daha kırılgandır.

    Bağlamı müşteri başına tutmak istiyorsanız (ajans iş akışları), basit bir kalıp şudur:

    - Müşteri başına bir Notion sayfası (bağlam + tercihler + etkin iş).
    - Oturum başında agent'tan bu sayfayı getirmesini isteyin.

    Yerel bir entegrasyon istiyorsanız bir özellik isteği açın veya bu API'leri
    hedefleyen bir skill oluşturun.

    Skills kurun:

    ```bash
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    Yerel kurulumlar etkin çalışma alanındaki `skills/` dizinine iner. Agent'lar arasında paylaşılan skills için bunları `~/.openclaw/skills/<name>/SKILL.md` konumuna yerleştirin. Yalnızca bazı agent'ların paylaşılan bir kurulumu görmesi gerekiyorsa `agents.defaults.skills` veya `agents.list[].skills` yapılandırın. Bazı skills, Homebrew ile kurulmuş ikili dosyalar bekler; Linux'ta bu Linuxbrew anlamına gelir (yukarıdaki Homebrew Linux SSS girdisine bakın). Bkz. [Skills](/tr/tools/skills), [Skills yapılandırması](/tr/tools/skills-config) ve [ClawHub](/tr/tools/clawhub).

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

    Bu yol yerel ana makine tarayıcısını veya bağlı bir tarayıcı node'unu kullanabilir. Gateway başka bir yerde çalışıyorsa, tarayıcı makinesinde bir node ana makinesi çalıştırın veya bunun yerine uzak CDP kullanın.

    `existing-session` / `user` üzerindeki mevcut sınırlar:

    - eylemler CSS seçiciyle değil, ref odaklıdır
    - yüklemeler `ref` / `inputRef` gerektirir ve şu anda aynı anda tek dosyayı destekler
    - `responsebody`, PDF dışa aktarma, indirme yakalama ve toplu eylemler hâlâ yönetilen bir tarayıcı veya ham CDP profili gerektirir

  </Accordion>
</AccordionGroup>

## Korumalı alan ve bellek

<AccordionGroup>
  <Accordion title="Özel bir korumalı alan belgesi var mı?">
    Evet. Bkz. [Korumalı alan](/tr/gateway/sandboxing). Docker'a özel kurulum için (Docker içinde tam Gateway veya korumalı alan imajları), bkz. [Docker](/tr/install/docker).
  </Accordion>

  <Accordion title="Docker sınırlı hissettiriyor - tüm özellikleri nasıl etkinleştiririm?">
    Varsayılan imaj güvenlik önceliklidir ve `node` kullanıcısı olarak çalışır, bu nedenle
    sistem paketleri, Homebrew veya paketlenmiş tarayıcıları içermez. Daha eksiksiz bir kurulum için:

    - Önbelleklerin kalıcı olması için `/home/node` öğesini `OPENCLAW_HOME_VOLUME` ile kalıcı hale getirin.
    - Sistem bağımlılıklarını imaja `OPENCLAW_DOCKER_APT_PACKAGES` ile ekleyin.
    - Playwright tarayıcılarını paketli CLI üzerinden kurun:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - `PLAYWRIGHT_BROWSERS_PATH` ayarlayın ve yolun kalıcı olduğundan emin olun.

    Belgeler: [Docker](/tr/install/docker), [Tarayıcı](/tr/tools/browser).

  </Accordion>

  <Accordion title="DM'leri kişisel tutup grupları tek bir agent ile genel/korumalı alanlı yapabilir miyim?">
    Evet - özel trafiğiniz **DM'ler** ve genel trafiğiniz **gruplar** ise.

    Grup/kanal oturumları (ana olmayan anahtarlar) yapılandırılan korumalı alan arka ucunda çalışırken ana DM oturumunun ana makinede kalması için `agents.defaults.sandbox.mode: "non-main"` kullanın. Bir tane seçmezseniz Docker varsayılan arka uçtur. Ardından korumalı alanlı oturumlarda hangi araçların kullanılabileceğini `tools.sandbox.tools` üzerinden sınırlayın.

    Kurulum adımları + örnek yapılandırma: [Gruplar: kişisel DM'ler + genel gruplar](/tr/channels/groups#pattern-personal-dms-public-groups-single-agent)

    Temel yapılandırma başvurusu: [Gateway yapılandırması](/tr/gateway/config-agents#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="Bir ana makine klasörünü korumalı alana nasıl bağlarım?">
    `agents.defaults.sandbox.docker.binds` değerini `["host:path:mode"]` olarak ayarlayın (ör. `"/home/user/src:/src:ro"`). Genel + agent başına bağlamalar birleşir; agent başına bağlamalar `scope: "shared"` olduğunda yok sayılır. Hassas olan her şey için `:ro` kullanın ve bağlamaların korumalı alan dosya sistemi duvarlarını aştığını unutmayın.

    OpenClaw, bağlama kaynaklarını hem normalleştirilmiş yola hem de mevcut en derin atadan çözümlenen kanonik yola göre doğrular. Bu, son yol segmenti henüz var olmasa bile sembolik bağlantı üst dizini kaçışlarının güvenli şekilde başarısız olduğu ve sembolik bağlantı çözümlemesinden sonra izin verilen kök kontrollerinin hâlâ uygulandığı anlamına gelir.

    Örnekler ve güvenlik notları için [Korumalı alan](/tr/gateway/sandboxing#custom-bind-mounts) ve [Korumalı alan vs Araç Politikası vs Yükseltilmiş](/tr/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check) bölümlerine bakın.

  </Accordion>

  <Accordion title="Bellek nasıl çalışır?">
    OpenClaw belleği yalnızca agent çalışma alanındaki Markdown dosyalarıdır:

    - `memory/YYYY-MM-DD.md` içindeki günlük notlar
    - `MEMORY.md` içindeki düzenlenmiş uzun vadeli notlar (yalnızca ana/özel oturumlar)

    OpenClaw ayrıca modele otomatik Compaction öncesinde kalıcı notlar yazmasını
    hatırlatmak için **sessiz Compaction öncesi bellek boşaltma** çalıştırır. Bu yalnızca çalışma alanı
    yazılabilir olduğunda çalışır (salt okunur korumalı alanlar bunu atlar). Bkz. [Bellek](/tr/concepts/memory).

  </Accordion>

  <Accordion title="Bellek sürekli bir şeyleri unutuyor. Kalıcı olmasını nasıl sağlarım?">
    Bottan **olguyu belleğe yazmasını** isteyin. Uzun vadeli notlar `MEMORY.md` içinde,
    kısa vadeli bağlam `memory/YYYY-MM-DD.md` içine gider.

    Bu hâlâ geliştirdiğimiz bir alan. Modele anıları saklamasını hatırlatmak yardımcı olur;
    ne yapacağını bilir. Unutmaya devam ederse, Gateway'in her çalıştırmada aynı
    çalışma alanını kullandığını doğrulayın.

    Belgeler: [Bellek](/tr/concepts/memory), [Agent çalışma alanı](/tr/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Bellek sonsuza kadar kalır mı? Sınırlar nelerdir?">
    Bellek dosyaları diskte yaşar ve siz silene kadar kalıcıdır. Sınır model değil,
    depolama alanınızdır. **oturum bağlamı** yine model
    bağlam penceresiyle sınırlıdır, bu nedenle uzun konuşmalar sıkıştırılabilir veya kesilebilir. Bu yüzden
    bellek araması vardır - yalnızca ilgili bölümleri bağlama geri çeker.

    Belgeler: [Bellek](/tr/concepts/memory), [Bağlam](/tr/concepts/context).

  </Accordion>

  <Accordion title="Anlamsal bellek araması bir OpenAI API anahtarı gerektirir mi?">
    Yalnızca **OpenAI embeddings** kullanıyorsanız. Codex OAuth sohbet/tamamlamaları kapsar ve
    embeddings erişimi **vermez**, bu nedenle **Codex ile oturum açmak (OAuth veya
    Codex CLI login)** anlamsal bellek araması için yardımcı olmaz. OpenAI embeddings
    yine de gerçek bir API anahtarı gerektirir (`OPENAI_API_KEY` veya `models.providers.openai.apiKey`).

    Açıkça bir sağlayıcı ayarlamazsanız OpenClaw, bir API anahtarını çözümleyebildiğinde
    otomatik olarak bir sağlayıcı seçer (kimlik doğrulama profilleri, `models.providers.*.apiKey` veya ortam değişkenleri).
    Bir OpenAI anahtarı çözümlenirse OpenAI’ı tercih eder; aksi halde bir Gemini anahtarı
    çözümlenirse Gemini, sonra Voyage, sonra Mistral tercih edilir. Uzak anahtar yoksa bellek
    araması siz yapılandırana kadar devre dışı kalır. Yapılandırılmış ve mevcut bir yerel model
    yolunuz varsa OpenClaw
    `local` seçeneğini tercih eder. Ollama, açıkça
    `memorySearch.provider = "ollama"` ayarladığınızda desteklenir.

    Yerel kalmayı tercih ederseniz `memorySearch.provider = "local"` ayarlayın (ve isteğe bağlı olarak
    `memorySearch.fallback = "none"`). Gemini embeddings istiyorsanız
    `memorySearch.provider = "gemini"` ayarlayın ve `GEMINI_API_KEY` (veya
    `memorySearch.remote.apiKey`) sağlayın. **OpenAI, Gemini, Voyage, Mistral, Ollama veya yerel** embedding
    modellerini destekliyoruz - kurulum ayrıntıları için [Bellek](/tr/concepts/memory) bölümüne bakın.

  </Accordion>
</AccordionGroup>

## Diskte öğelerin bulunduğu yerler

<AccordionGroup>
  <Accordion title="OpenClaw ile kullanılan tüm veriler yerel olarak mı kaydedilir?">
    Hayır - **OpenClaw’ın durumu yereldir**, ancak **harici hizmetler onlara gönderdiklerinizi yine de görür**.

    - **Varsayılan olarak yerel:** oturumlar, bellek dosyaları, yapılandırma ve çalışma alanı Gateway ana makinesinde bulunur
      (`~/.openclaw` + çalışma alanı dizininiz).
    - **Zorunlu olarak uzak:** model sağlayıcılarına (Anthropic/OpenAI/vb.) gönderdiğiniz iletiler
      onların API’lerine gider ve sohbet platformları (WhatsApp/Telegram/Slack/vb.) ileti verilerini
      kendi sunucularında saklar.
    - **Kapsamı siz kontrol edersiniz:** yerel modeller kullanmak istemleri makinenizde tutar, ancak kanal
      trafiği yine de kanalın sunucularından geçer.

    İlgili: [Ajan çalışma alanı](/tr/concepts/agent-workspace), [Bellek](/tr/concepts/memory).

  </Accordion>

  <Accordion title="OpenClaw verilerini nerede saklar?">
    Her şey `$OPENCLAW_STATE_DIR` altında bulunur (varsayılan: `~/.openclaw`):

    | Yol                                                             | Amaç                                                               |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | Ana yapılandırma (JSON5)                                           |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | Eski OAuth içe aktarması (ilk kullanımda kimlik doğrulama profillerine kopyalanır) |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | Kimlik doğrulama profilleri (OAuth, API anahtarları ve isteğe bağlı `keyRef`/`tokenRef`) |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | `file` SecretRef sağlayıcıları için isteğe bağlı dosya destekli gizli veri yükü |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | Eski uyumluluk dosyası (statik `api_key` girdileri temizlenmiş)    |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | Sağlayıcı durumu (örn. `whatsapp/<accountId>/creds.json`)          |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | Ajan başına durum (agentDir + oturumlar)                           |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | Konuşma geçmişi ve durum (ajan başına)                             |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | Oturum meta verileri (ajan başına)                                 |

    Eski tek ajan yolu: `~/.openclaw/agent/*` (`openclaw doctor` tarafından taşınır).

    **Çalışma alanınız** (AGENTS.md, bellek dosyaları, Skills, vb.) ayrıdır ve `agents.defaults.workspace` üzerinden yapılandırılır (varsayılan: `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title="AGENTS.md / SOUL.md / USER.md / MEMORY.md nerede bulunmalı?">
    Bu dosyalar `~/.openclaw` içinde değil, **ajan çalışma alanında** bulunur.

    - **Çalışma alanı (ajan başına)**: `AGENTS.md`, `SOUL.md`, `IDENTITY.md`, `USER.md`,
      `MEMORY.md`, `memory/YYYY-MM-DD.md`, isteğe bağlı `HEARTBEAT.md`.
      Küçük harfli kök `memory.md` yalnızca eski onarım girdisidir; her iki dosya da mevcut olduğunda
      `openclaw doctor --fix` bunu `MEMORY.md` içine birleştirebilir.
    - **Durum dizini (`~/.openclaw`)**: yapılandırma, kanal/sağlayıcı durumu, kimlik doğrulama profilleri, oturumlar, günlükler
      ve paylaşılan Skills (`~/.openclaw/skills`).

    Varsayılan çalışma alanı `~/.openclaw/workspace` olup şu şekilde yapılandırılabilir:

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    Bot yeniden başlatmadan sonra "unutuyorsa", Gateway’in her başlatmada aynı
    çalışma alanını kullandığını doğrulayın (ve unutmayın: uzak mod, yerel dizüstü bilgisayarınızın değil
    **gateway ana makinesinin** çalışma alanını kullanır).

    İpucu: Kalıcı bir davranış veya tercih istiyorsanız, sohbet geçmişine güvenmek yerine bottan bunu
    **AGENTS.md veya MEMORY.md içine yazmasını** isteyin.

    Bkz. [Ajan çalışma alanı](/tr/concepts/agent-workspace) ve [Bellek](/tr/concepts/memory).

  </Accordion>

  <Accordion title="Önerilen yedekleme stratejisi">
    **Ajan çalışma alanınızı** **özel** bir git deposuna koyun ve özel bir yerde
    yedekleyin (örneğin GitHub özel depo). Bu, bellek + AGENTS/SOUL/USER
    dosyalarını yakalar ve daha sonra asistanın "zihnini" geri yüklemenizi sağlar.

    `~/.openclaw` altındaki hiçbir şeyi commit etmeyin (kimlik bilgileri, oturumlar, token’lar veya şifrelenmiş gizli veri yükleri).
    Tam geri yükleme gerekiyorsa hem çalışma alanını hem de durum dizinini
    ayrı ayrı yedekleyin (yukarıdaki taşıma sorusuna bakın).

    Belgeler: [Ajan çalışma alanı](/tr/concepts/agent-workspace).

  </Accordion>

  <Accordion title="OpenClaw’ı tamamen nasıl kaldırırım?">
    Özel kılavuza bakın: [Kaldırma](/tr/install/uninstall).
  </Accordion>

  <Accordion title="Ajanlar çalışma alanı dışında çalışabilir mi?">
    Evet. Çalışma alanı **varsayılan cwd** ve bellek çıpasıdır; katı bir sandbox değildir.
    Göreli yollar çalışma alanı içinde çözümlenir, ancak sandboxing etkin değilse mutlak yollar diğer
    ana makine konumlarına erişebilir. Yalıtım gerekiyorsa
    [`agents.defaults.sandbox`](/tr/gateway/sandboxing) veya ajan başına sandbox ayarlarını kullanın. Bir
    deponun varsayılan çalışma dizini olmasını istiyorsanız, ilgili ajanın
    `workspace` değerini depo köküne yönlendirin. OpenClaw deposu yalnızca kaynak koddur; ajanın bilinçli olarak içinde çalışmasını istemiyorsanız
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
    Oturum durumu **gateway ana makinesine** aittir. Uzak moddaysanız, önemsemeniz gereken oturum deposu yerel dizüstü bilgisayarınızda değil uzak makinededir. Bkz. [Oturum yönetimi](/tr/concepts/session).
  </Accordion>
</AccordionGroup>

## Yapılandırma temelleri

<AccordionGroup>
  <Accordion title="Yapılandırma hangi biçimdedir? Nerede bulunur?">
    OpenClaw, `$OPENCLAW_CONFIG_PATH` konumundan isteğe bağlı bir **JSON5** yapılandırması okur (varsayılan: `~/.openclaw/openclaw.json`):

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    Dosya yoksa, güvenli sayılabilecek varsayılanları kullanır (`~/.openclaw/workspace` varsayılan çalışma alanı dahil).

  </Accordion>

  <Accordion title='gateway.bind: "lan" (veya "tailnet") ayarladım ve artık hiçbir şey dinlemiyor / kullanıcı arayüzü yetkisiz diyor'>
    local loopback dışı bağlamalar **geçerli bir gateway kimlik doğrulama yolu gerektirir**. Pratikte bunun anlamı:

    - paylaşılan gizli anahtar kimlik doğrulaması: token veya parola
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

    - `gateway.remote.token` / `.password` kendi başlarına yerel gateway kimlik doğrulamasını etkinleştirmez.
    - Yerel çağrı yolları, yalnızca `gateway.auth.*` ayarlanmamışsa geri dönüş olarak `gateway.remote.*` kullanabilir.
    - Parola kimlik doğrulaması için bunun yerine `gateway.auth.mode: "password"` ile birlikte `gateway.auth.password` (veya `OPENCLAW_GATEWAY_PASSWORD`) ayarlayın.
    - `gateway.auth.token` / `gateway.auth.password` SecretRef üzerinden açıkça yapılandırılmışsa ve çözümlenemiyorsa, çözümleme kapalı şekilde başarısız olur (uzak geri dönüş maskelemesi yok).
    - Paylaşılan gizli anahtarlı Control UI kurulumları `connect.params.auth.token` veya `connect.params.auth.password` üzerinden kimlik doğrular (uygulama/UI ayarlarında saklanır). Tailscale Serve veya `trusted-proxy` gibi kimlik taşıyan modlar bunun yerine istek başlıklarını kullanır. Paylaşılan gizli anahtarları URL’lere koymaktan kaçının.
    - `gateway.auth.mode: "trusted-proxy"` ile aynı ana makinedeki local loopback ters proxy’leri açıkça `gateway.auth.trustedProxy.allowLoopback = true` ve `gateway.trustedProxies` içinde bir local loopback girdisi gerektirir.

  </Accordion>

  <Accordion title="Artık localhost üzerinde neden token gerekiyor?">
    OpenClaw, local loopback dahil gateway kimlik doğrulamasını varsayılan olarak zorunlu kılar. Normal varsayılan yolda bu token kimlik doğrulaması anlamına gelir: açık bir kimlik doğrulama yolu yapılandırılmamışsa gateway başlatma token moduna çözümlenir ve otomatik olarak bir token üretip `gateway.auth.token` içine kaydeder; bu nedenle **yerel WS istemcileri kimlik doğrulamalıdır**. Bu, diğer yerel süreçlerin Gateway’i çağırmasını engeller.

    Farklı bir kimlik doğrulama yolunu tercih ediyorsanız parola modunu (veya kimlik farkındalıklı ters proxy’ler için `trusted-proxy`) açıkça seçebilirsiniz. local loopback’i **gerçekten** açık istiyorsanız yapılandırmanızda açıkça `gateway.auth.mode: "none"` ayarlayın. Doctor sizin için her zaman token oluşturabilir: `openclaw doctor --generate-gateway-token`.

  </Accordion>

  <Accordion title="Yapılandırmayı değiştirdikten sonra yeniden başlatmam gerekir mi?">
    Gateway yapılandırmayı izler ve hot-reload destekler:

    - `gateway.reload.mode: "hybrid"` (varsayılan): güvenli değişiklikleri sıcak uygular, kritik olanlar için yeniden başlatır
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

    - `off`: slogan metnini gizler ancak banner başlığı/sürüm satırını korur.
    - `default`: her seferinde `All your chats, one OpenClaw.` kullanır.
    - `random`: dönen komik/mevsimsel sloganlar (varsayılan davranış).
    - Hiç banner istemiyorsanız `OPENCLAW_HIDE_BANNER=1` ortam değişkenini ayarlayın.

  </Accordion>

  <Accordion title="Web aramayı (ve web getirmeyi) nasıl etkinleştiririm?">
    `web_fetch` API anahtarı olmadan çalışır. `web_search` seçtiğiniz
    sağlayıcıya bağlıdır:

    - Brave, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Perplexity ve Tavily gibi API destekli sağlayıcılar normal API anahtarı kurulumlarını gerektirir.
    - Ollama Web Search anahtarsızdır, ancak yapılandırılmış Ollama ana makinenizi kullanır ve `ollama signin` gerektirir.
    - DuckDuckGo anahtarsızdır, ancak resmi olmayan HTML tabanlı bir entegrasyondur.
    - SearXNG anahtarsız/kendi kendine barındırılan yapıdadır; `SEARXNG_BASE_URL` veya `plugins.entries.searxng.config.webSearch.baseUrl` yapılandırın.

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
    Firecrawl web getirme yedek yapılandırması `plugins.entries.firecrawl.config.webFetch.*` altında bulunur.

    Notlar:

    - İzin listeleri kullanıyorsanız `web_search`/`web_fetch`/`x_search` veya `group:web` ekleyin.
    - `web_fetch` varsayılan olarak etkindir (açıkça devre dışı bırakılmadığı sürece).
    - `tools.web.fetch.provider` atlanırsa OpenClaw, kullanılabilir kimlik bilgilerinden ilk hazır getirme yedek sağlayıcısını otomatik olarak algılar. Bugün paketle gelen sağlayıcı Firecrawl’dır.
    - Daemon’lar ortam değişkenlerini `~/.openclaw/.env` dosyasından (veya servis ortamından) okur.

    Belgeler: [Web araçları](/tr/tools/web).

  </Accordion>

  <Accordion title="config.apply yapılandırmamı sildi. Nasıl kurtarır ve bunu nasıl önlerim?">
    `config.apply` **tüm yapılandırmayı** değiştirir. Kısmi bir nesne gönderirseniz diğer
    her şey kaldırılır.

    Güncel OpenClaw birçok kazara ezmeye karşı koruma sağlar:

    - OpenClaw tarafından yönetilen yapılandırma yazımları, yazmadan önce değişiklik sonrası tam yapılandırmayı doğrular.
    - Geçersiz veya yıkıcı OpenClaw tarafından yönetilen yazımlar reddedilir ve `openclaw.json.rejected.*` olarak kaydedilir.
    - Doğrudan bir düzenleme başlangıcı veya sıcak yeniden yüklemeyi bozarsa Gateway bilinen son iyi yapılandırmayı geri yükler ve reddedilen dosyayı `openclaw.json.clobbered.*` olarak kaydeder.
    - Ana agent, kurtarma sonrasında hatalı yapılandırmayı körlemesine tekrar yazmaması için bir önyükleme uyarısı alır.

    Kurtarma:

    - `Config auto-restored from last-known-good`, `Config write rejected:` veya `config reload restored last-known-good config` için `openclaw logs --follow` çıktısını kontrol edin.
    - Etkin yapılandırmanın yanındaki en yeni `openclaw.json.clobbered.*` veya `openclaw.json.rejected.*` dosyasını inceleyin.
    - Çalışıyorsa etkin geri yüklenmiş yapılandırmayı koruyun, ardından yalnızca amaçlanan anahtarları `openclaw config set` veya `config.patch` ile geri kopyalayın.
    - `openclaw config validate` ve `openclaw doctor` komutlarını çalıştırın.
    - Bilinen son iyi yapılandırmanız veya reddedilmiş payload’unuz yoksa yedekten geri yükleyin ya da `openclaw doctor` komutunu yeniden çalıştırıp kanalları/modelleri yeniden yapılandırın.
    - Bu beklenmedik bir durumsa bir hata bildirimi açın ve bilinen son yapılandırmanızı veya herhangi bir yedeği ekleyin.
    - Yerel bir kodlama agent’ı çoğu zaman günlüklerden veya geçmişten çalışan bir yapılandırmayı yeniden oluşturabilir.

    Önleme:

    - Küçük değişiklikler için `openclaw config set` kullanın.
    - Etkileşimli düzenlemeler için `openclaw configure` kullanın.
    - Kesin bir yol veya alan şekli konusunda emin değilseniz önce `config.schema.lookup` kullanın; ayrıntıya inmek için sığ bir şema düğümü ve doğrudan alt öğe özetleri döndürür.
    - Kısmi RPC düzenlemeleri için `config.patch` kullanın; `config.apply` yalnızca tam yapılandırma değişimi için kalsın.
    - Bir agent çalıştırmasından sahipliğe özel `gateway` aracını kullanıyorsanız bu araç yine de `tools.exec.ask` / `tools.exec.security` yollarına yazımları reddeder (aynı korumalı exec yollarına normalize edilen eski `tools.bash.*` takma adları dahil).

    Belgeler: [Config](/tr/cli/config), [Configure](/tr/cli/configure), [Gateway sorun giderme](/tr/gateway/troubleshooting#gateway-restored-last-known-good-config), [Doctor](/tr/gateway/doctor).

  </Accordion>

  <Accordion title="Cihazlar arasında uzmanlaşmış worker’larla merkezi bir Gateway’i nasıl çalıştırırım?">
    Yaygın desen **bir Gateway** (örn. Raspberry Pi) ile **node’lar** ve **agent’lar** kullanmaktır:

    - **Gateway (merkezi):** kanalları (Signal/WhatsApp), yönlendirmeyi ve oturumları yönetir.
    - **Node’lar (cihazlar):** Mac’ler/iOS/Android çevre birimleri olarak bağlanır ve yerel araçları (`system.run`, `canvas`, `camera`) sunar.
    - **Agent’lar (worker’lar):** özel roller için ayrı beyinler/çalışma alanlarıdır (örn. "Hetzner operasyonları", "Kişisel veriler").
    - **Alt agent’lar:** paralellik istediğinizde ana agent’tan arka plan işi başlatır.
    - **TUI:** Gateway’e bağlanır ve agent’lar/oturumlar arasında geçiş yapar.

    Belgeler: [Node’lar](/tr/nodes), [Uzaktan erişim](/tr/gateway/remote), [Çoklu Agent Yönlendirme](/tr/concepts/multi-agent), [Alt agent’lar](/tr/tools/subagents), [TUI](/tr/web/tui).

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

    Varsayılan `false` değeridir (pencereli). Headless, bazı sitelerde anti-bot kontrollerini tetiklemeye daha yatkındır. Bkz. [Tarayıcı](/tr/tools/browser).

    Headless **aynı Chromium motorunu** kullanır ve çoğu otomasyon için çalışır (formlar, tıklamalar, scraping, oturum açmalar). Başlıca farklar:

    - Görünür tarayıcı penceresi yoktur (görsel gerekiyorsa ekran görüntülerini kullanın).
    - Bazı siteler headless modda otomasyona karşı daha katıdır (CAPTCHA’lar, anti-bot).
      Örneğin X/Twitter çoğu zaman headless oturumları engeller.

  </Accordion>

  <Accordion title="Tarayıcı kontrolü için Brave’i nasıl kullanırım?">
    `browser.executablePath` değerini Brave ikili dosyanıza (veya herhangi bir Chromium tabanlı tarayıcıya) ayarlayın ve Gateway’i yeniden başlatın.
    Tam yapılandırma örnekleri için [Tarayıcı](/tr/tools/browser#use-brave-or-another-chromium-based-browser) bölümüne bakın.
  </Accordion>
</AccordionGroup>

## Uzak gateway’ler ve node’lar

<AccordionGroup>
  <Accordion title="Komutlar Telegram, gateway ve node’lar arasında nasıl yayılır?">
    Telegram iletileri **gateway** tarafından işlenir. Gateway agent’ı çalıştırır ve
    ancak bir node aracı gerektiğinde **Gateway WebSocket** üzerinden node’ları çağırır:

    Telegram → Gateway → Agent → `node.*` → Node → Gateway → Telegram

    Node’lar gelen sağlayıcı trafiğini görmez; yalnızca node RPC çağrıları alırlar.

  </Accordion>

  <Accordion title="Gateway uzakta barındırılıyorsa agent’ım bilgisayarıma nasıl erişebilir?">
    Kısa yanıt: **bilgisayarınızı node olarak eşleştirin**. Gateway başka yerde çalışır, ancak Gateway WebSocket üzerinden
    yerel makinenizdeki `node.*` araçlarını (ekran, kamera, sistem) çağırabilir.

    Tipik kurulum:

    1. Gateway’i her zaman açık ana makinede (VPS/ev sunucusu) çalıştırın.
    2. Gateway ana makinesini ve bilgisayarınızı aynı tailnet’e koyun.
    3. Gateway WS’nin erişilebilir olduğundan emin olun (tailnet bind veya SSH tüneli).
    4. macOS uygulamasını yerel olarak açın ve node olarak kaydolabilmesi için **SSH Üzerinden Uzak** modunda (veya doğrudan tailnet) bağlanın.
    5. Node’u Gateway üzerinde onaylayın:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Ayrı bir TCP köprüsü gerekmez; node’lar Gateway WebSocket üzerinden bağlanır.

    Güvenlik hatırlatması: macOS node eşleştirmek o makinede `system.run` çalıştırılmasına izin verir. Yalnızca
    güvendiğiniz cihazları eşleştirin ve [Güvenlik](/tr/gateway/security) bölümünü inceleyin.

    Belgeler: [Node’lar](/tr/nodes), [Gateway protokolü](/tr/gateway/protocol), [macOS uzak modu](/tr/platforms/mac/remote), [Güvenlik](/tr/gateway/security).

  </Accordion>

  <Accordion title="Tailscale bağlı ama yanıt alamıyorum. Şimdi ne yapmalıyım?">
    Temel kontrolleri yapın:

    - Gateway çalışıyor: `openclaw gateway status`
    - Gateway sağlığı: `openclaw status`
    - Kanal sağlığı: `openclaw channels status`

    Ardından kimlik doğrulamayı ve yönlendirmeyi doğrulayın:

    - Tailscale Serve kullanıyorsanız `gateway.auth.allowTailscale` değerinin doğru ayarlandığından emin olun.
    - SSH tüneli üzerinden bağlanıyorsanız yerel tünelin açık olduğunu ve doğru porta işaret ettiğini doğrulayın.
    - İzin listelerinizin (DM veya grup) hesabınızı içerdiğini doğrulayın.

    Belgeler: [Tailscale](/tr/gateway/tailscale), [Uzaktan erişim](/tr/gateway/remote), [Kanallar](/tr/channels).

  </Accordion>

  <Accordion title="İki OpenClaw örneği birbiriyle konuşabilir mi (yerel + VPS)?">
    Evet. Yerleşik bir "bot-to-bot" köprüsü yoktur, ancak bunu birkaç
    güvenilir şekilde bağlayabilirsiniz:

    **En basit:** iki botun da erişebildiği normal bir sohbet kanalı kullanın (Telegram/Slack/WhatsApp).
    Bot A’nın Bot B’ye bir ileti göndermesini sağlayın, ardından Bot B’nin her zamanki gibi yanıt vermesine izin verin.

    **CLI köprüsü (genel):** diğer botun dinlediği bir sohbeti hedefleyerek
    `openclaw agent --message ... --deliver` ile diğer Gateway’i çağıran bir betik çalıştırın.
    Botlardan biri uzak bir VPS üzerindeyse CLI’nizi SSH/Tailscale üzerinden o uzak Gateway’e yönlendirin
    (bkz. [Uzaktan erişim](/tr/gateway/remote)).

    Örnek desen (hedef Gateway’e erişebilen bir makineden çalıştırın):

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    İpucu: iki botun sonsuz döngüye girmemesi için bir güvenlik sınırı ekleyin (yalnızca mention, kanal
    izin listeleri veya "bot iletilerine yanıt verme" kuralı).

    Belgeler: [Uzaktan erişim](/tr/gateway/remote), [Agent CLI](/tr/cli/agent), [Agent gönderme](/tr/tools/agent-send).

  </Accordion>

  <Accordion title="Birden fazla agent için ayrı VPS’lere ihtiyacım var mı?">
    Hayır. Bir Gateway birden fazla agent barındırabilir; her birinin kendi çalışma alanı, model varsayılanları
    ve yönlendirmesi olur. Normal kurulum budur ve agent başına bir VPS çalıştırmaktan çok daha ucuz ve basittir.

    Ayrı VPS’leri yalnızca güçlü izolasyona (güvenlik sınırları) veya paylaşmak istemediğiniz çok
    farklı yapılandırmalara ihtiyacınız olduğunda kullanın. Aksi halde tek Gateway’i koruyun ve
    birden fazla agent veya alt agent kullanın.

  </Accordion>

  <Accordion title="VPS’ten SSH kullanmak yerine kişisel dizüstü bilgisayarımda node kullanmanın faydası var mı?">
    Evet - node’lar uzak bir Gateway’den dizüstü bilgisayarınıza ulaşmanın birinci sınıf yoludur ve
    shell erişiminden fazlasını açar. Gateway macOS/Linux üzerinde (Windows için WSL2 üzerinden) çalışır ve
    hafiftir (küçük bir VPS veya Raspberry Pi sınıfı kutu yeterlidir; 4 GB RAM fazlasıyla yeter), bu yüzden yaygın
    kurulum her zaman açık bir ana makineye ek olarak dizüstü bilgisayarınızı node olarak kullanmaktır.

    - **Gelen SSH gerekmez.** Node’lar Gateway WebSocket’e dışarı doğru bağlanır ve cihaz eşleştirme kullanır.
    - **Daha güvenli yürütme kontrolleri.** `system.run` o dizüstü bilgisayardaki node izin listeleri/onaylarıyla sınırlandırılır.
    - **Daha fazla cihaz aracı.** Node’lar `system.run` yanında `canvas`, `camera` ve `screen` sunar.
    - **Yerel tarayıcı otomasyonu.** Gateway’i VPS üzerinde tutun, ancak Chrome’u dizüstü bilgisayardaki bir node host üzerinden yerel olarak çalıştırın veya Chrome MCP üzerinden host’taki yerel Chrome’a bağlanın.

    SSH geçici shell erişimi için uygundur, ancak node’lar sürekli agent iş akışları ve
    cihaz otomasyonu için daha basittir.

    Belgeler: [Node’lar](/tr/nodes), [Node’lar CLI](/tr/cli/nodes), [Tarayıcı](/tr/tools/browser).

  </Accordion>

  <Accordion title="Node’lar gateway servisi çalıştırır mı?">
    Hayır. Bilerek izole profiller çalıştırmadığınız sürece host başına yalnızca **bir gateway** çalışmalıdır (bkz. [Birden fazla gateway](/tr/gateway/multiple-gateways)). Node’lar gateway’e bağlanan çevre birimleridir
    (iOS/Android node’ları veya menü çubuğu uygulamasında macOS "node modu"). Headless node
    host’ları ve CLI kontrolü için bkz. [Node host CLI](/tr/cli/node).

    `gateway`, `discovery` ve `canvasHost` değişiklikleri için tam yeniden başlatma gerekir.

  </Accordion>

  <Accordion title="Yapılandırmayı uygulamak için API / RPC yolu var mı?">
    Evet.

    - `config.schema.lookup`: yazmadan önce bir yapılandırma alt ağacını sığ şema düğümü, eşleşen UI ipucu ve doğrudan alt öğe özetleriyle inceleyin
    - `config.get`: geçerli anlık görüntüyü + hash’i getirir
    - `config.patch`: güvenli kısmi güncelleme (çoğu RPC düzenlemesi için tercih edilir); mümkün olduğunda sıcak yeniden yükler ve gerektiğinde yeniden başlatır
    - `config.apply`: tam yapılandırmayı doğrular + değiştirir; mümkün olduğunda sıcak yeniden yükler ve gerektiğinde yeniden başlatır
    - Sahipliğe özel `gateway` runtime aracı yine de `tools.exec.ask` / `tools.exec.security` yollarını yeniden yazmayı reddeder; eski `tools.bash.*` takma adları aynı korumalı exec yollarına normalize edilir

  </Accordion>

  <Accordion title="İlk kurulum için asgari makul yapılandırma">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    Bu, çalışma alanınızı ayarlar ve botu kimlerin tetikleyebileceğini sınırlar.

  </Accordion>

  <Accordion title="Bir VPS üzerinde Tailscale'i nasıl kurup Mac'imden bağlanırım?">
    Asgari adımlar:

    1. **VPS üzerinde kurulum + oturum açma**

       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```

    2. **Mac'inizde kurulum + oturum açma**
       - Tailscale uygulamasını kullanın ve aynı tailnet'e giriş yapın.
    3. **MagicDNS'i etkinleştirin (önerilir)**
       - Tailscale yönetici konsolunda MagicDNS'i etkinleştirerek VPS'in sabit bir ada sahip olmasını sağlayın.
    4. **Tailnet ana makine adını kullanın**
       - SSH: `ssh user@your-vps.tailnet-xxxx.ts.net`
       - Gateway WS: `ws://your-vps.tailnet-xxxx.ts.net:18789`

    SSH olmadan Control UI kullanmak istiyorsanız VPS üzerinde Tailscale Serve kullanın:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Bu, gateway'i loopback'e bağlı tutar ve Tailscale üzerinden HTTPS sunar. Bkz. [Tailscale](/tr/gateway/tailscale).

  </Accordion>

  <Accordion title="Bir Mac düğümünü uzak bir Gateway'e nasıl bağlarım (Tailscale Serve)?">
    Serve, **Gateway Control UI + WS**'yi sunar. Düğümler aynı Gateway WS uç noktası üzerinden bağlanır.

    Önerilen kurulum:

    1. **VPS + Mac'in aynı tailnet üzerinde olduğundan emin olun**.
    2. **macOS uygulamasını Uzak modda kullanın** (SSH hedefi tailnet ana makine adı olabilir).
       Uygulama Gateway bağlantı noktasını tüneller ve düğüm olarak bağlanır.
    3. **Düğümü gateway üzerinde onaylayın**:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Dokümanlar: [Gateway protokolü](/tr/gateway/protocol), [Keşif](/tr/gateway/discovery), [macOS uzak modu](/tr/platforms/mac/remote).

  </Accordion>

  <Accordion title="İkinci bir dizüstü bilgisayara kurmalı mıyım, yoksa sadece düğüm mü eklemeliyim?">
    İkinci dizüstü bilgisayarda yalnızca **yerel araçlara** (ekran/kamera/exec) ihtiyacınız varsa, onu
    **düğüm** olarak ekleyin. Bu, tek bir Gateway'i korur ve yinelenen yapılandırmayı önler. Yerel düğüm araçları
    şu anda yalnızca macOS'te kullanılabilir, ancak bunları diğer işletim sistemlerine genişletmeyi planlıyoruz.

    İkinci bir Gateway'i yalnızca **katı izolasyona** veya tamamen ayrı iki bota ihtiyacınız olduğunda kurun.

    Dokümanlar: [Düğümler](/tr/nodes), [Düğümler CLI](/tr/cli/nodes), [Birden çok gateway](/tr/gateway/multiple-gateways).

  </Accordion>
</AccordionGroup>

## Ortam değişkenleri ve .env yükleme

<AccordionGroup>
  <Accordion title="OpenClaw ortam değişkenlerini nasıl yükler?">
    OpenClaw ortam değişkenlerini üst süreçten (shell, launchd/systemd, CI vb.) okur ve ayrıca şunları yükler:

    - geçerli çalışma dizininden `.env`
    - `~/.openclaw/.env` konumundan genel yedek `.env` (diğer adıyla `$OPENCLAW_STATE_DIR/.env`)

    Hiçbir `.env` dosyası mevcut ortam değişkenlerini geçersiz kılmaz.

    Ayrıca yapılandırmada satır içi ortam değişkenleri tanımlayabilirsiniz (yalnızca süreç ortamında eksikse uygulanır):

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

  <Accordion title="Gateway'i servis üzerinden başlattım ve ortam değişkenlerim kayboldu. Şimdi ne yapmalıyım?">
    İki yaygın düzeltme:

    1. Eksik anahtarları `~/.openclaw/.env` içine koyun; böylece servis shell ortamınızı devralmasa bile alınırlar.
    2. Shell içe aktarmayı etkinleştirin (tercihe bağlı kolaylık):

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

    Bu, giriş shell'inizi çalıştırır ve yalnızca eksik beklenen anahtarları içe aktarır (asla geçersiz kılmaz). Ortam değişkeni eşdeğerleri:
    `OPENCLAW_LOAD_SHELL_ENV=1`, `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`.

  </Accordion>

  <Accordion title='COPILOT_GITHUB_TOKEN ayarladım, ancak model durumu "Shell env: off." gösteriyor. Neden?'>
    `openclaw models status`, **shell ortamı içe aktarmanın** etkin olup olmadığını bildirir. "Shell env: off"
    ortam değişkenlerinizin eksik olduğu anlamına **gelmez** - yalnızca OpenClaw'ın
    giriş shell'inizi otomatik olarak yüklemeyeceği anlamına gelir.

    Gateway bir servis (launchd/systemd) olarak çalışıyorsa shell
    ortamınızı devralmaz. Şunlardan birini yaparak düzeltin:

    1. Token'ı `~/.openclaw/.env` içine koyun:

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. Veya shell içe aktarmayı etkinleştirin (`env.shellEnv.enabled: true`).
    3. Veya yapılandırmanızdaki `env` bloğuna ekleyin (yalnızca eksikse uygulanır).

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
    Tek başına bir mesaj olarak `/new` veya `/reset` gönderin. Bkz. [Oturum yönetimi](/tr/concepts/session).
  </Accordion>

  <Accordion title="Hiç /new göndermesem oturumlar otomatik olarak sıfırlanır mı?">
    Oturumlar `session.idleMinutes` sonrasında sona erebilir, ancak bu **varsayılan olarak devre dışıdır** (varsayılan **0**).
    Boşta kalma süresinin dolmasını etkinleştirmek için bunu pozitif bir değere ayarlayın. Etkinleştirildiğinde, boşta kalma süresinden sonraki **ilk**
    mesaj, o sohbet anahtarı için yeni bir oturum kimliği başlatır.
    Bu, transkriptleri silmez - yalnızca yeni bir oturum başlatır.

    ```json5
    {
      session: {
        idleMinutes: 240,
      },
    }
    ```

  </Accordion>

  <Accordion title="OpenClaw örneklerinden oluşan bir ekip (bir CEO ve birçok aracı) oluşturmanın bir yolu var mı?">
    Evet, **çok aracılı yönlendirme** ve **alt aracılar** ile. Bir koordinatör
    aracı ve kendi çalışma alanları ile modellerine sahip birkaç çalışan aracı oluşturabilirsiniz.

    Bununla birlikte, bunu en iyi **eğlenceli bir deney** olarak görmek gerekir. Token açısından ağırdır ve genellikle
    ayrı oturumlara sahip tek bir bot kullanmaktan daha az verimlidir. Öngördüğümüz tipik model,
    konuştuğunuz tek bir bot ve paralel çalışmalar için farklı oturumlardır. Bu
    bot gerektiğinde alt aracılar da başlatabilir.

    Dokümanlar: [Çok aracılı yönlendirme](/tr/concepts/multi-agent), [Alt aracılar](/tr/tools/subagents), [Aracılar CLI](/tr/cli/agents).

  </Accordion>

  <Accordion title="Bağlam neden görevin ortasında kesildi? Bunu nasıl önlerim?">
    Oturum bağlamı model penceresiyle sınırlıdır. Uzun sohbetler, büyük araç çıktıları veya çok sayıda
    dosya Compaction ya da kesilmeyi tetikleyebilir.

    Yardımcı olanlar:

    - Bottan geçerli durumu özetlemesini ve bir dosyaya yazmasını isteyin.
    - Uzun görevlerden önce `/compact`, konu değiştirirken de `/new` kullanın.
    - Önemli bağlamı çalışma alanında tutun ve bottan tekrar okumasını isteyin.
    - Ana sohbetin daha küçük kalması için uzun veya paralel işler için alt aracılar kullanın.
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

    - Onboarding, mevcut bir yapılandırma görürse **Sıfırla** seçeneğini de sunar. Bkz. [Onboarding (CLI)](/tr/start/wizard).
    - Profiller (`--profile` / `OPENCLAW_PROFILE`) kullandıysanız her durum dizinini sıfırlayın (varsayılanlar `~/.openclaw-<profile>`).
    - Geliştirme sıfırlaması: `openclaw gateway --dev --reset` (yalnızca geliştirme; geliştirme yapılandırmasını + kimlik bilgilerini + oturumları + çalışma alanını siler).

  </Accordion>

  <Accordion title='"context too large" hataları alıyorum - nasıl sıfırlar veya compact yaparım?'>
    Şunlardan birini kullanın:

    - **Compact** (konuşmayı korur ancak eski turları özetler):

      ```
      /compact
      ```

      veya özeti yönlendirmek için `/compact <instructions>` kullanın.

    - **Sıfırla** (aynı sohbet anahtarı için yeni oturum kimliği):

      ```
      /new
      /reset
      ```

    Devam ederse:

    - Eski araç çıktısını kırpmak için **oturum budamayı** (`agents.defaults.contextPruning`) etkinleştirin veya ayarlayın.
    - Daha büyük bağlam penceresine sahip bir model kullanın.

    Dokümanlar: [Compaction](/tr/concepts/compaction), [Oturum budama](/tr/concepts/session-pruning), [Oturum yönetimi](/tr/concepts/session).

  </Accordion>

  <Accordion title='"LLM request rejected: messages.content.tool_use.input field required" neden görünüyor?'>
    Bu bir sağlayıcı doğrulama hatasıdır: model, gerekli `input` olmadan bir `tool_use` bloğu üretti.
    Genellikle oturum geçmişinin eski veya bozuk olduğu anlamına gelir (çoğunlukla uzun iş parçacıklarından
    ya da araç/şema değişikliğinden sonra).

    Düzeltme: `/new` ile yeni bir oturum başlatın (tek başına mesaj).

  </Accordion>

  <Accordion title="Neden her 30 dakikada bir Heartbeat mesajları alıyorum?">
    Heartbeat'ler varsayılan olarak her **30m** çalışır (OAuth kimlik doğrulaması kullanılırken **1h**). Bunları ayarlayın veya devre dışı bırakın:

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

    `HEARTBEAT.md` varsa ancak fiilen boşsa (yalnızca boş satırlar ve
    `# Heading` gibi markdown başlıkları), OpenClaw API çağrılarını azaltmak için heartbeat çalıştırmasını atlar.
    Dosya eksikse heartbeat yine çalışır ve model ne yapacağına karar verir.

    Aracı başına geçersiz kılmalar `agents.list[].heartbeat` kullanır. Dokümanlar: [Heartbeat](/tr/gateway/heartbeat).

  </Accordion>

  <Accordion title='Bir WhatsApp grubuna "bot hesabı" eklemem gerekiyor mu?'>
    Hayır. OpenClaw **kendi hesabınızda** çalışır; bu yüzden gruptaysanız OpenClaw onu görebilir.
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
    Seçenek 1 (en hızlı): günlükleri takip edin ve grupta bir test mesajı gönderin:

    ```bash
    openclaw logs --follow --json
    ```

    `@g.us` ile biten `chatId` (veya `from`) değerini arayın; örneğin:
    `1234567890-1234567890@g.us`.

    Seçenek 2 (zaten yapılandırılmış/izin listesinde ise): grupları yapılandırmadan listeleyin:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    Dokümanlar: [WhatsApp](/tr/channels/whatsapp), [Dizin](/tr/cli/directory), [Günlükler](/tr/cli/logs).

  </Accordion>

  <Accordion title="OpenClaw neden bir grupta yanıt vermiyor?">
    İki yaygın neden:

    - Bahsetme geçidi açık (varsayılan). Botu @mention yapmanız (veya `mentionPatterns` ile eşleşmeniz) gerekir.
    - `channels.whatsapp.groups` yapılandırdınız ancak `"*"` eklemediniz ve grup izin listesinde değil.

    Bkz. [Gruplar](/tr/channels/groups) ve [Grup mesajları](/tr/channels/group-messages).

  </Accordion>

  <Accordion title="Gruplar/iş parçacıkları DM'lerle bağlam paylaşır mı?">
    Doğrudan sohbetler varsayılan olarak ana oturuma indirgenir. Gruplar/kanallar kendi oturum anahtarlarına sahiptir ve Telegram konuları / Discord iş parçacıkları ayrı oturumlardır. Bkz. [Gruplar](/tr/channels/groups) ve [Grup mesajları](/tr/channels/group-messages).
  </Accordion>

  <Accordion title="Kaç çalışma alanı ve aracı oluşturabilirim?">
    Katı bir sınır yok. Düzinelerce (hatta yüzlerce) sorun değildir, ancak şunlara dikkat edin:

    - **Disk büyümesi:** oturumlar + transkriptler `~/.openclaw/agents/<agentId>/sessions/` altında tutulur.
    - **Token maliyeti:** daha fazla aracı, daha fazla eşzamanlı model kullanımı anlamına gelir.
    - **Operasyon yükü:** aracı başına kimlik doğrulama profilleri, çalışma alanları ve kanal yönlendirmesi.

    İpuçları:

    - Aracı başına bir **etkin** çalışma alanı tutun (`agents.defaults.workspace`).
    - Disk büyürse eski oturumları budayın (JSONL dosyalarını veya depo girdilerini silin).
    - Başıboş çalışma alanlarını ve profil uyuşmazlıklarını tespit etmek için `openclaw doctor` kullanın.

  </Accordion>

  <Accordion title="Aynı anda birden fazla bot veya sohbet çalıştırabilir miyim (Slack) ve bunu nasıl kurmalıyım?">
    Evet. Birden fazla yalıtılmış ajan çalıştırmak ve gelen mesajları
    kanal/hesap/eş düzey öğeye göre yönlendirmek için **Çok Ajanlı Yönlendirme** kullanın. Slack bir kanal olarak desteklenir ve belirli ajanlara bağlanabilir.

    Tarayıcı erişimi güçlüdür, ancak "bir insanın yapabildiği her şeyi yap" anlamına gelmez - bot karşıtı mekanizmalar, CAPTCHA'lar ve MFA
    otomasyonu hâlâ engelleyebilir. En güvenilir tarayıcı kontrolü için ana makinede yerel Chrome MCP kullanın
    veya tarayıcıyı gerçekten çalıştıran makinede CDP kullanın.

    En iyi uygulama kurulumu:

    - Her zaman açık Gateway ana makinesi (VPS/Mac mini).
    - Rol başına bir ajan (bağlamalar).
    - Bu ajanlara bağlı Slack kanalları.
    - Gerektiğinde Chrome MCP veya bir node üzerinden yerel tarayıcı.

    Dokümanlar: [Çok Ajanlı Yönlendirme](/tr/concepts/multi-agent), [Slack](/tr/channels/slack),
    [Tarayıcı](/tr/tools/browser), [Nodes](/tr/nodes).

  </Accordion>
</AccordionGroup>

## Modeller, yük devretme ve kimlik doğrulama profilleri

Model SSS - varsayılanlar, seçim, takma adlar, değiştirme, yük devretme, kimlik doğrulama profilleri -
[Modeller SSS](/tr/help/faq-models) sayfasında yer alır.

## Gateway: bağlantı noktaları, "zaten çalışıyor" ve uzak mod

<AccordionGroup>
  <Accordion title="Gateway hangi bağlantı noktasını kullanır?">
    `gateway.port`, WebSocket + HTTP (Control UI, kancalar vb.) için tek çoğullamalı bağlantı noktasını kontrol eder.

    Öncelik:

    ```
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > default 18789
    ```

  </Accordion>

  <Accordion title='openclaw gateway status neden "Runtime: running" ama "Connectivity probe: failed" diyor?'>
    Çünkü "running", **supervisor'ın** görünümüdür (launchd/systemd/schtasks). Bağlantı yoklaması ise CLI'ın gateway WebSocket'e gerçekten bağlanmasıdır.

    `openclaw gateway status` kullanın ve şu satırlara güvenin:

    - `Probe target:` (yoklamanın gerçekten kullandığı URL)
    - `Listening:` (bağlantı noktasında gerçekte neyin bağlı olduğu)
    - `Last gateway error:` (süreç canlıyken ancak bağlantı noktası dinlemiyorken yaygın kök neden)

  </Accordion>

  <Accordion title='openclaw gateway status neden "Config (cli)" ve "Config (service)" değerlerini farklı gösteriyor?'>
    Hizmet başka bir yapılandırmayla çalışırken siz başka bir yapılandırma dosyasını düzenliyorsunuz (çoğunlukla `--profile` / `OPENCLAW_STATE_DIR` uyumsuzluğu).

    Düzeltme:

    ```bash
    openclaw gateway install --force
    ```

    Bunu hizmetin kullanmasını istediğiniz aynı `--profile` / ortamdan çalıştırın.

  </Accordion>

  <Accordion title='"another gateway instance is already listening" ne anlama gelir?'>
    OpenClaw, başlangıçta WebSocket dinleyicisini hemen bağlayarak bir runtime kilidi uygular (varsayılan `ws://127.0.0.1:18789`). Bağlama `EADDRINUSE` ile başarısız olursa, başka bir örneğin zaten dinlediğini belirten `GatewayLockError` fırlatır.

    Düzeltme: diğer örneği durdurun, bağlantı noktasını boşaltın veya `openclaw gateway --port <port>` ile çalıştırın.

  </Accordion>

  <Accordion title="OpenClaw'u uzak modda nasıl çalıştırırım (istemci başka yerdeki bir Gateway'e bağlanır)?">
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
    - `gateway.remote.token` / `.password` yalnızca istemci tarafı uzak kimlik bilgileridir; tek başlarına yerel gateway kimlik doğrulamasını etkinleştirmezler.

  </Accordion>

  <Accordion title='Control UI "unauthorized" diyor (veya yeniden bağlanmayı sürdürüyor). Şimdi ne yapmalıyım?'>
    Gateway kimlik doğrulama yolunuz ve UI'ın kimlik doğrulama yöntemi eşleşmiyor.

    Gerçekler (koddan):

    - Control UI, token'ı geçerli tarayıcı sekmesi oturumu ve seçili gateway URL'si için `sessionStorage` içinde tutar; böylece aynı sekme yenilemeleri uzun ömürlü localStorage token kalıcılığını geri yüklemeden çalışmaya devam eder.
    - `AUTH_TOKEN_MISMATCH` durumunda, güvenilir istemciler gateway yeniden deneme ipuçları döndürdüğünde (`canRetryWithDeviceToken=true`, `recommendedNextStep=retry_with_device_token`) önbelleğe alınmış bir cihaz token'ı ile sınırlı tek bir yeniden deneme yapabilir.
    - Bu önbelleğe alınmış token yeniden denemesi artık cihaz token'ı ile depolanan önbelleğe alınmış onaylı kapsamları yeniden kullanır. Açık `deviceToken` / açık `scopes` çağırıcıları ise önbelleğe alınmış kapsamları devralmak yerine istedikleri kapsam kümesini korur.
    - Bu yeniden deneme yolu dışında, bağlantı kimlik doğrulama önceliği önce açık paylaşılan token/parola, sonra açık `deviceToken`, sonra depolanmış cihaz token'ı, sonra bootstrap token'dır.
    - Bootstrap token kapsam denetimleri rol öneklidir. Yerleşik bootstrap operatör izin listesi yalnızca operatör isteklerini karşılar; node veya diğer operatör olmayan rollerin yine kendi rol önekleri altında kapsamları olması gerekir.

    Düzeltme:

    - En hızlısı: `openclaw dashboard` (dashboard URL'sini yazdırır + kopyalar, açmayı dener; headless ise SSH ipucu gösterir).
    - Henüz token'ınız yoksa: `openclaw doctor --generate-gateway-token`.
    - Uzaksa önce tünel açın: `ssh -N -L 18789:127.0.0.1:18789 user@host` sonra `http://127.0.0.1:18789/` adresini açın.
    - Paylaşılan gizli mod: `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` veya `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` ayarlayın, ardından eşleşen gizli değeri Control UI ayarlarına yapıştırın.
    - Tailscale Serve modu: `gateway.auth.allowTailscale` etkin olduğundan ve Tailscale kimlik başlıklarını atlayan ham bir loopback/tailnet URL'si değil, Serve URL'sini açtığınızdan emin olun.
    - Güvenilir proxy modu: ham bir gateway URL'si değil, yapılandırılmış kimlik farkındalıklı proxy üzerinden geldiğinizden emin olun. Aynı ana makinedeki loopback proxy'leri için de `gateway.auth.trustedProxy.allowLoopback = true` gerekir.
    - Tek yeniden denemeden sonra uyumsuzluk sürerse, eşleştirilmiş cihaz token'ını döndürün/yeniden onaylayın:
      - `openclaw devices list`
      - `openclaw devices rotate --device <id> --role operator`
    - Bu döndürme çağrısı reddedildiğini söylüyorsa iki şeyi kontrol edin:
      - eşleştirilmiş cihaz oturumları, ayrıca `operator.admin` yetkisine sahip değillerse yalnızca **kendi** cihazlarını döndürebilir
      - açık `--scope` değerleri çağırıcının mevcut operatör kapsamlarını aşamaz
    - Hâlâ takıldınız mı? `openclaw status --all` çalıştırın ve [Sorun Giderme](/tr/gateway/troubleshooting) adımlarını izleyin. Kimlik doğrulama ayrıntıları için [Dashboard](/tr/web/dashboard) sayfasına bakın.

  </Accordion>

  <Accordion title="gateway.bind tailnet ayarladım ancak bağlanamıyor ve hiçbir şey dinlemiyor">
    `tailnet` bağlaması, ağ arayüzlerinizden bir Tailscale IP'si seçer (100.64.0.0/10). Makine Tailscale üzerinde değilse (veya arayüz kapalıysa), bağlanacak hiçbir şey yoktur.

    Düzeltme:

    - Bu ana makinede Tailscale'i başlatın (böylece 100.x adresi olur), veya
    - `gateway.bind: "loopback"` / `"lan"` seçeneğine geçin.

    Not: `tailnet` açıktır. `auto` loopback tercih eder; yalnızca tailnet'e bağlanmak istediğinizde `gateway.bind: "tailnet"` kullanın.

  </Accordion>

  <Accordion title="Aynı ana makinede birden fazla Gateway çalıştırabilir miyim?">
    Genellikle hayır - bir Gateway birden fazla mesajlaşma kanalını ve ajanı çalıştırabilir. Birden fazla Gateway'i yalnızca yedeklilik (örn: kurtarma botu) veya sıkı yalıtım gerektiğinde kullanın.

    Evet, ancak yalıtmanız gerekir:

    - `OPENCLAW_CONFIG_PATH` (örnek başına yapılandırma)
    - `OPENCLAW_STATE_DIR` (örnek başına durum)
    - `agents.defaults.workspace` (çalışma alanı yalıtımı)
    - `gateway.port` (benzersiz bağlantı noktaları)

    Hızlı kurulum (önerilen):

    - Her örnek için `openclaw --profile <name> ...` kullanın (`~/.openclaw-<name>` otomatik oluşturulur).
    - Her profil yapılandırmasında benzersiz bir `gateway.port` ayarlayın (veya elle çalıştırmalar için `--port` geçin).
    - Profil başına bir hizmet kurun: `openclaw --profile <name> gateway install`.

    Profiller ayrıca hizmet adlarına son ek ekler (`ai.openclaw.<profile>`; eski `com.openclaw.*`, `openclaw-gateway-<profile>.service`, `OpenClaw Gateway (<profile>)`).
    Tam kılavuz: [Birden fazla gateway](/tr/gateway/multiple-gateways).

  </Accordion>

  <Accordion title='"invalid handshake" / code 1008 ne anlama gelir?'>
    Gateway bir **WebSocket sunucusudur** ve ilk mesajın
    bir `connect` çerçevesi olmasını bekler. Başka herhangi bir şey alırsa, bağlantıyı
    **code 1008** (ilke ihlali) ile kapatır.

    Yaygın nedenler:

    - Bir WS istemcisi yerine tarayıcıda **HTTP** URL'sini açtınız (`http://...`).
    - Yanlış bağlantı noktasını veya yolu kullandınız.
    - Bir proxy veya tünel kimlik doğrulama başlıklarını çıkardı ya da Gateway olmayan bir istek gönderdi.

    Hızlı düzeltmeler:

    1. WS URL'sini kullanın: `ws://<host>:18789` (veya HTTPS ise `wss://...`).
    2. WS bağlantı noktasını normal bir tarayıcı sekmesinde açmayın.
    3. Kimlik doğrulama açıksa, token/parolayı `connect` çerçevesine ekleyin.

    CLI veya TUI kullanıyorsanız, URL şöyle görünmelidir:

    ```
    openclaw tui --url ws://<host>:18789 --token <token>
    ```

    Protokol ayrıntıları: [Gateway protokolü](/tr/gateway/protocol).

  </Accordion>
</AccordionGroup>

## Günlük kaydı ve hata ayıklama

<AccordionGroup>
  <Accordion title="Günlükler nerede?">
    Dosya günlükleri (yapılandırılmış):

    ```
    /tmp/openclaw/openclaw-YYYY-MM-DD.log
    ```

    `logging.file` ile sabit bir yol ayarlayabilirsiniz. Dosya günlük düzeyi `logging.level` tarafından kontrol edilir. Konsol ayrıntı düzeyi `--verbose` ve `logging.consoleLevel` tarafından kontrol edilir.

    Günlüğü izlemenin en hızlı yolu:

    ```bash
    openclaw logs --follow
    ```

    Hizmet/supervisor günlükleri (gateway launchd/systemd üzerinden çalıştığında):

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

    Gateway'i elle çalıştırırsanız, `openclaw gateway --force` bağlantı noktasını geri alabilir. [Gateway](/tr/gateway) sayfasına bakın.

  </Accordion>

  <Accordion title="Windows'ta terminalimi kapattım - OpenClaw'u nasıl yeniden başlatırım?">
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

    **2) Yerel Windows (önerilmez):** Gateway doğrudan Windows içinde çalışır.

    PowerShell'i açın ve çalıştırın:

    ```powershell
    openclaw gateway status
    openclaw gateway restart
    ```

    Elle çalıştırıyorsanız (hizmet yoksa), şunu kullanın:

    ```powershell
    openclaw gateway run
    ```

    Dokümanlar: [Windows (WSL2)](/tr/platforms/windows), [Gateway hizmet çalıştırma kılavuzu](/tr/gateway).

  </Accordion>

  <Accordion title="Gateway açık ama yanıtlar hiç gelmiyor. Neyi kontrol etmeliyim?">
    Hızlı bir sağlık taramasıyla başlayın:

    ```bash
    openclaw status
    openclaw models status
    openclaw channels status
    openclaw logs --follow
    ```

    Yaygın nedenler:

    - Model kimlik doğrulaması **gateway ana makinesinde** yüklenmemiş (kontrol için `models status`).
    - Kanal eşleştirme/izin listesi yanıtları engelliyor (kanal yapılandırması + günlükleri kontrol edin).
    - WebChat/Dashboard doğru token olmadan açık.

    Uzak bağlantıdaysanız, tünel/Tailscale bağlantısının açık olduğunu ve
    Gateway WebSocket'e erişilebildiğini doğrulayın.

    Dokümanlar: [Kanallar](/tr/channels), [Sorun Giderme](/tr/gateway/troubleshooting), [Uzak erişim](/tr/gateway/remote).

  </Accordion>

  <Accordion title='"Disconnected from gateway: no reason" - şimdi ne yapmalıyım?'>
    Bu genellikle UI'ın WebSocket bağlantısını kaybettiği anlamına gelir. Kontrol edin:

    1. Gateway çalışıyor mu? `openclaw gateway status`
    2. Gateway sağlıklı mı? `openclaw status`
    3. UI doğru token'a sahip mi? `openclaw dashboard`
    4. Uzaksa, tünel/Tailscale bağlantısı açık mı?

    Ardından logları takip edin:

    ```bash
    openclaw logs --follow
    ```

    Belgeler: [Dashboard](/tr/web/dashboard), [Uzak erişim](/tr/gateway/remote), [Sorun giderme](/tr/gateway/troubleshooting).

  </Accordion>

  <Accordion title="Telegram setMyCommands başarısız oluyor. Neyi kontrol etmeliyim?">
    Loglar ve kanal durumuyla başlayın:

    ```bash
    openclaw channels status
    openclaw channels logs --channel telegram
    ```

    Ardından hatayı eşleştirin:

    - `BOT_COMMANDS_TOO_MUCH`: Telegram menüsünde çok fazla giriş var. OpenClaw zaten Telegram sınırına göre kırpar ve daha az komutla yeniden dener, ancak bazı menü girişlerinin yine de kaldırılması gerekir. Plugin/Skills/özel komutları azaltın veya menüye ihtiyacınız yoksa `channels.telegram.commands.native` ayarını devre dışı bırakın.
    - `TypeError: fetch failed`, `Network request for 'setMyCommands' failed!` veya benzer ağ hataları: Bir VPS üzerindeyseniz ya da proxy arkasındaysanız, giden HTTPS'e izin verildiğini ve DNS'in `api.telegram.org` için çalıştığını doğrulayın.

    Gateway uzaksa, Gateway ana makinesindeki loglara baktığınızdan emin olun.

    Belgeler: [Telegram](/tr/channels/telegram), [Kanal sorun giderme](/tr/channels/troubleshooting).

  </Accordion>

  <Accordion title="TUI çıktı göstermiyor. Neyi kontrol etmeliyim?">
    Önce Gateway'e erişilebildiğini ve agent'ın çalışabildiğini doğrulayın:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    TUI içinde mevcut durumu görmek için `/status` kullanın. Bir sohbet kanalında yanıt bekliyorsanız
    teslimatın etkin olduğundan emin olun (`/deliver on`).

    Belgeler: [TUI](/tr/web/tui), [Slash komutları](/tr/tools/slash-commands).

  </Accordion>

  <Accordion title="Gateway'i tamamen durdurup sonra nasıl başlatırım?">
    Hizmeti kurduysanız:

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    Bu, **denetlenen hizmeti** (macOS'ta launchd, Linux'ta systemd) durdurur/başlatır.
    Gateway arka planda daemon olarak çalıştığında bunu kullanın.

    Ön planda çalıştırıyorsanız Ctrl-C ile durdurun, ardından:

    ```bash
    openclaw gateway run
    ```

    Belgeler: [Gateway hizmet runbook'u](/tr/gateway).

  </Accordion>

  <Accordion title="Basit anlatım: openclaw gateway restart ve openclaw gateway">
    - `openclaw gateway restart`: **arka plan hizmetini** (launchd/systemd) yeniden başlatır.
    - `openclaw gateway`: gateway'i bu terminal oturumu için **ön planda** çalıştırır.

    Hizmeti kurduysanız gateway komutlarını kullanın. Tek seferlik, ön planda bir çalıştırma
    istediğinizde `openclaw gateway` kullanın.

  </Accordion>

  <Accordion title="Bir şey başarısız olduğunda daha fazla ayrıntı almanın en hızlı yolu">
    Daha fazla konsol ayrıntısı almak için Gateway'i `--verbose` ile başlatın. Ardından kanal kimlik doğrulaması, model yönlendirme ve RPC hataları için log dosyasını inceleyin.
  </Accordion>
</AccordionGroup>

## Medya ve ekler

<AccordionGroup>
  <Accordion title="Skill bir görüntü/PDF oluşturdu, ancak hiçbir şey gönderilmedi">
    Agent'tan giden ekler kendi satırında bir `MEDIA:<path-or-url>` satırı içermelidir. Bkz. [OpenClaw asistan kurulumu](/tr/start/openclaw) ve [Agent gönderimi](/tr/tools/agent-send).

    CLI gönderimi:

    ```bash
    openclaw message send --target +15555550123 --message "Here you go" --media /path/to/file.png
    ```

    Şunları da kontrol edin:

    - Hedef kanal giden medyayı destekliyor ve izin listeleri tarafından engellenmiyor.
    - Dosya sağlayıcının boyut sınırları içindedir (görüntüler en fazla 2048px olacak şekilde yeniden boyutlandırılır).
    - `tools.fs.workspaceOnly=true`, yerel yol gönderimlerini workspace, temp/media-store ve sandbox tarafından doğrulanmış dosyalarla sınırlı tutar.
    - `tools.fs.workspaceOnly=false`, `MEDIA:` ile agent'ın zaten okuyabildiği ana makine yerel dosyalarının gönderilmesine izin verir, ancak yalnızca medya ve güvenli belge türleri için (görüntüler, ses, video, PDF ve Office belgeleri). Düz metin ve gizli bilgiye benzeyen dosyalar yine de engellenir.

    Bkz. [Görüntüler](/tr/nodes/images).

  </Accordion>
</AccordionGroup>

## Güvenlik ve erişim denetimi

<AccordionGroup>
  <Accordion title="OpenClaw'u gelen DM'lere açmak güvenli mi?">
    Gelen DM'leri güvenilmeyen girdi olarak ele alın. Varsayılanlar riski azaltmak için tasarlanmıştır:

    - DM destekli kanallarda varsayılan davranış **eşleştirme**dir:
      - Bilinmeyen gönderenler bir eşleştirme kodu alır; bot mesajlarını işlemez.
      - Şununla onaylayın: `openclaw pairing approve --channel <channel> [--account <id>] <code>`
      - Bekleyen istekler **kanal başına 3** ile sınırlıdır; bir kod gelmediyse `openclaw pairing list --channel <channel> [--account <id>]` kontrol edin.
    - DM'leri herkese açık açmak açıkça etkinleştirme gerektirir (`dmPolicy: "open"` ve allowlist `"*"`).

    Riskli DM ilkelerini ortaya çıkarmak için `openclaw doctor` çalıştırın.

  </Accordion>

  <Accordion title="Prompt injection yalnızca herkese açık botlar için mi bir endişe?">
    Hayır. Prompt injection, yalnızca bota kimin DM gönderebildiğiyle değil, **güvenilmeyen içerikle** ilgilidir.
    Asistanınız harici içerik okuyorsa (web araması/getirme, tarayıcı sayfaları, e-postalar,
    belgeler, ekler, yapıştırılmış loglar), bu içerik modeli ele geçirmeye çalışan
    talimatlar içerebilir. Bu, **tek gönderen siz olsanız bile** gerçekleşebilir.

    En büyük risk araçlar etkin olduğundadır: Model, bağlamı dışarı sızdırmak veya sizin adınıza araç çağırmak için kandırılabilir. Etki alanını şu şekilde azaltın:

    - güvenilmeyen içeriği özetlemek için salt okunur veya araçları devre dışı bırakılmış bir "okuyucu" agent kullanarak
    - araç etkin agent'lar için `web_search` / `web_fetch` / `browser` kapalı tutarak
    - kodu çözülmüş dosya/belge metnini de güvenilmeyen olarak ele alarak: OpenResponses
      `input_file` ve medya eki çıkarımı, çıkarılan metni ham dosya metni olarak geçirmek yerine
      açık harici içerik sınır işaretçileriyle sarar
    - sandboxing ve sıkı araç izin listeleriyle

    Ayrıntılar: [Güvenlik](/tr/gateway/security).

  </Accordion>

  <Accordion title="Botumun kendi e-postası, GitHub hesabı veya telefon numarası olmalı mı?">
    Evet, çoğu kurulum için. Botu ayrı hesaplar ve telefon numaralarıyla izole etmek,
    bir şey ters giderse etki alanını azaltır. Bu ayrıca kişisel hesaplarınızı etkilemeden
    kimlik bilgilerini döndürmeyi veya erişimi iptal etmeyi kolaylaştırır.

    Küçük başlayın. Yalnızca gerçekten ihtiyacınız olan araçlara ve hesaplara erişim verin, gerekirse
    daha sonra genişletin.

    Belgeler: [Güvenlik](/tr/gateway/security), [Eşleştirme](/tr/channels/pairing).

  </Accordion>

  <Accordion title="Metin mesajlarım üzerinde ona otonomi verebilir miyim ve bu güvenli mi?">
    Kişisel mesajlarınız üzerinde tam otonomi önermiyoruz. En güvenli kalıp şudur:

    - DM'leri **eşleştirme modunda** veya sıkı bir allowlist içinde tutun.
    - Sizin adınıza mesaj atmasını istiyorsanız **ayrı bir numara veya hesap** kullanın.
    - Taslak hazırlamasına izin verin, ardından **göndermeden önce onaylayın**.

    Denemek istiyorsanız, bunu özel bir hesapta yapın ve izole tutun. Bkz.
    [Güvenlik](/tr/gateway/security).

  </Accordion>

  <Accordion title="Kişisel asistan görevleri için daha ucuz modeller kullanabilir miyim?">
    Evet, agent yalnızca sohbet içinse ve girdi güvenilirse. Daha küçük katmanlar
    talimat ele geçirmeye daha yatkındır, bu yüzden araç etkin agent'lar için
    veya güvenilmeyen içerik okurken bunlardan kaçının. Daha küçük bir model kullanmanız gerekiyorsa
    araçları kilitleyin ve sandbox içinde çalıştırın. Bkz. [Güvenlik](/tr/gateway/security).
  </Accordion>

  <Accordion title="Telegram'da /start çalıştırdım ama eşleştirme kodu almadım">
    Eşleştirme kodları **yalnızca** bilinmeyen bir gönderen bota mesaj attığında ve
    `dmPolicy: "pairing"` etkin olduğunda gönderilir. `/start` tek başına kod oluşturmaz.

    Bekleyen istekleri kontrol edin:

    ```bash
    openclaw pairing list telegram
    ```

    Hemen erişim istiyorsanız gönderen kimliğinizi allowlist'e ekleyin veya o hesap için `dmPolicy: "open"`
    ayarlayın.

  </Accordion>

  <Accordion title="WhatsApp: Kişilerime mesaj atar mı? Eşleştirme nasıl çalışır?">
    Hayır. Varsayılan WhatsApp DM ilkesi **eşleştirme**dir. Bilinmeyen gönderenler yalnızca bir eşleştirme kodu alır ve mesajları **işlenmez**. OpenClaw yalnızca aldığı sohbetlere veya sizin tetiklediğiniz açık gönderimlere yanıt verir.

    Eşleştirmeyi şununla onaylayın:

    ```bash
    openclaw pairing approve whatsapp <code>
    ```

    Bekleyen istekleri listeleyin:

    ```bash
    openclaw pairing list whatsapp
    ```

    Sihirbaz telefon numarası istemi: Kendi DM'lerinize izin verilmesi için **allowlist/owner** ayarınızı yapmakta kullanılır. Otomatik gönderim için kullanılmaz. Kişisel WhatsApp numaranızda çalıştırıyorsanız bu numarayı kullanın ve `channels.whatsapp.selfChatMode` etkinleştirin.

  </Accordion>
</AccordionGroup>

## Sohbet komutları, görevleri iptal etme ve "durmuyor"

<AccordionGroup>
  <Accordion title="Dahili sistem mesajlarının sohbette görünmesini nasıl durdururum?">
    Çoğu dahili veya araç mesajı yalnızca o oturum için **verbose**, **trace** veya **reasoning** etkin olduğunda görünür.

    Bunu gördüğünüz sohbette düzeltin:

    ```
    /verbose off
    /trace off
    /reasoning off
    ```

    Hâlâ gürültülüyse Control UI içinde oturum ayarlarını kontrol edin ve verbose değerini
    **inherit** olarak ayarlayın. Ayrıca config içinde `verboseDefault` değeri `on`
    olarak ayarlanmış bir bot profili kullanmadığınızı doğrulayın.

    Belgeler: [Düşünme ve verbose](/tr/tools/thinking), [Güvenlik](/tr/gateway/security#reasoning-verbose-output-in-groups).

  </Accordion>

  <Accordion title="Çalışan bir görevi nasıl durdururum/iptal ederim?">
    Bunlardan herhangi birini **tek başına mesaj** olarak gönderin (slash yok):

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

    Bunlar iptal tetikleyicileridir (slash komutları değil).

    Arka plan süreçleri için (exec aracından), agent'tan şunu çalıştırmasını isteyebilirsiniz:

    ```
    process action:kill sessionId:XXX
    ```

    Slash komutları özeti: bkz. [Slash komutları](/tr/tools/slash-commands).

    Çoğu komut `/` ile başlayan **tek başına** bir mesaj olarak gönderilmelidir, ancak birkaç kısayol (`/status` gibi) allowlist'teki gönderenler için satır içinde de çalışır.

  </Accordion>

  <Accordion title='Telegram üzerinden Discord mesajı nasıl gönderirim? ("Cross-context messaging denied")'>
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

    Config düzenlemesinden sonra gateway'i yeniden başlatın.

  </Accordion>

  <Accordion title='Bot hızlı ardışık mesajları "yok sayıyor" gibi neden hissediliyor?'>
    Kuyruk modu, yeni mesajların devam eden bir çalıştırmayla nasıl etkileşime gireceğini kontrol eder. Modları değiştirmek için `/queue` kullanın:

    - `steer` - mevcut çalıştırmadaki bir sonraki model sınırı için bekleyen tüm yönlendirmeleri kuyruğa alır
    - `queue` - eski usul tek tek yönlendirme
    - `followup` - mesajları tek tek çalıştırır
    - `collect` - mesajları toplu hale getirir ve bir kez yanıtlar
    - `steer-backlog` - şimdi yönlendirir, ardından birikmiş kuyruğu işler
    - `interrupt` - mevcut çalıştırmayı iptal eder ve yeniden başlar

    Varsayılan mod `steer` değeridir. Followup modları için `debounce:0.5s cap:25 drop:summarize` gibi seçenekler ekleyebilirsiniz. Bkz. [Komut kuyruğu](/tr/concepts/queue) ve [Yönlendirme kuyruğu](/tr/concepts/queue-steering).

  </Accordion>
</AccordionGroup>

## Çeşitli

<AccordionGroup>
  <Accordion title='Anthropic için API anahtarıyla varsayılan model nedir?'>
    OpenClaw'da kimlik bilgileri ve model seçimi ayrıdır. `ANTHROPIC_API_KEY` ayarlamak (veya kimlik doğrulama profillerinde bir Anthropic API anahtarı saklamak) kimlik doğrulamayı etkinleştirir, ancak gerçek varsayılan model `agents.defaults.model.primary` içinde yapılandırdığınız modeldir (örneğin `anthropic/claude-sonnet-4-6` veya `anthropic/claude-opus-4-6`). `No credentials found for profile "anthropic:default"` görüyorsanız, bu, Gateway'in çalışan ajan için beklenen `auth-profiles.json` içinde Anthropic kimlik bilgilerini bulamadığı anlamına gelir.
  </Accordion>
</AccordionGroup>

---

Hâlâ sorun mu yaşıyorsunuz? [Discord](https://discord.com/invite/clawd) üzerinden sorun veya bir [GitHub tartışması](https://github.com/openclaw/openclaw/discussions) açın.

## İlgili

- [İlk çalıştırma SSS](/tr/help/faq-first-run) — kurulum, ilk katılım, kimlik doğrulama, abonelikler, erken hatalar
- [Modeller SSS](/tr/help/faq-models) — model seçimi, yük devretme, kimlik doğrulama profilleri
- [Sorun giderme](/tr/help/troubleshooting) — belirti odaklı triyaj
