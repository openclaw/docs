---
read_when:
    - Yaygın kurulum, yükleme, ilk kullanıma hazırlık veya çalışma zamanı desteği sorularını yanıtlama
    - Daha derinlemesine hata ayıklamadan önce kullanıcı tarafından bildirilen sorunları triyaj etme
summary: OpenClaw kurulumu, yapılandırması ve kullanımı hakkında sık sorulan sorular
title: SSS
x-i18n:
    generated_at: "2026-05-07T13:20:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: b208e28def6b9a1165130bc02f9e2646c3b16d203dfc8c0d59dc664f388c2ef8
    source_path: help/faq.md
    workflow: 16
---

Gerçek dünyadaki kurulumlar (yerel geliştirme, VPS, çoklu ajan, OAuth/API anahtarları, model failover) için hızlı yanıtlar ve daha derin sorun giderme. Çalışma zamanı tanılaması için [Sorun Giderme](/tr/gateway/troubleshooting) bölümüne bakın. Tam yapılandırma referansı için [Yapılandırma](/tr/gateway/configuration) bölümüne bakın.

## Bir şey bozulduysa ilk 60 saniye

1. **Hızlı durum (ilk kontrol)**

   ```bash
   openclaw status
   ```

   Hızlı yerel özet: işletim sistemi + güncelleme, gateway/hizmet erişilebilirliği, ajanlar/oturumlar, sağlayıcı yapılandırması + çalışma zamanı sorunları (gateway erişilebilir olduğunda).

2. **Yapıştırılabilir rapor (paylaşması güvenli)**

   ```bash
   openclaw status --all
   ```

   Günlük sonu ile salt okunur tanılama (token'lar redakte edilir).

3. **Daemon + bağlantı noktası durumu**

   ```bash
   openclaw gateway status
   ```

   Denetleyici çalışma zamanına karşı RPC erişilebilirliğini, yoklama hedef URL'sini ve hizmetin muhtemelen hangi yapılandırmayı kullandığını gösterir.

4. **Derin yoklamalar**

   ```bash
   openclaw status --deep
   ```

   Desteklendiğinde kanal yoklamaları dahil olmak üzere canlı bir gateway sağlık yoklaması çalıştırır
   (erişilebilir bir gateway gerekir). Bkz. [Sağlık](/tr/gateway/health).

5. **En son günlüğü takip edin**

   ```bash
   openclaw logs --follow
   ```

   RPC çalışmıyorsa şuna geri dönün:

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   Dosya günlükleri hizmet günlüklerinden ayrıdır; bkz. [Günlükleme](/tr/logging) ve [Sorun Giderme](/tr/gateway/troubleshooting).

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

İlk çalıştırma soru-cevapları — kurulum, onboarding, kimlik doğrulama rotaları, abonelikler, ilk hatalar —
[İlk çalıştırma SSS](/tr/help/faq-first-run) sayfasında yer alır.

## OpenClaw nedir?

<AccordionGroup>
  <Accordion title="OpenClaw nedir, tek paragrafta?">
    OpenClaw, kendi cihazlarınızda çalıştırdığınız kişisel bir AI asistanıdır. Zaten kullandığınız mesajlaşma yüzeylerinde yanıt verir (WhatsApp, Telegram, Slack, Mattermost, Discord, Google Chat, Signal, iMessage, WebChat ve QQ Bot gibi paketli kanal pluginleri) ve desteklenen platformlarda ses + canlı Canvas da sunabilir. **Gateway** her zaman açık kontrol düzlemidir; asistan ise üründür.
  </Accordion>

  <Accordion title="Değer önerisi">
    OpenClaw "sadece bir Claude sarmalayıcısı" değildir. Zaten kullandığınız sohbet uygulamalarından erişilebilen, durum bilgili oturumlar, bellek ve araçlarla birlikte **kendi donanımınızda** yetenekli bir asistan çalıştırmanızı sağlayan **yerel öncelikli bir kontrol düzlemidir**; iş akışlarınızın kontrolünü barındırılan bir SaaS'a devretmeden.

    Öne çıkanlar:

    - **Cihazlarınız, verileriniz:** Gateway'i istediğiniz yerde çalıştırın (Mac, Linux, VPS) ve çalışma alanını + oturum geçmişini yerel tutun.
    - **Web sandbox değil, gerçek kanallar:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage/vb.,
      ayrıca desteklenen platformlarda mobil ses ve Canvas.
    - **Modelden bağımsız:** Ajan başına yönlendirme ve failover ile Anthropic, OpenAI, MiniMax, OpenRouter vb. kullanın.
    - **Yalnızca yerel seçeneği:** İsterseniz **tüm veriler cihazınızda kalabilsin** diye yerel modeller çalıştırın.
    - **Çoklu ajan yönlendirme:** Her biri kendi çalışma alanı ve varsayılanlarıyla kanal, hesap veya görev başına ayrı ajanlar.
    - **Açık kaynak ve hacklenebilir:** Tedarikçi kilidine girmeden inceleyin, genişletin ve kendi kendinize barındırın.

    Dokümanlar: [Gateway](/tr/gateway), [Kanallar](/tr/channels), [Çoklu ajan](/tr/concepts/multi-agent),
    [Bellek](/tr/concepts/memory).

  </Accordion>

  <Accordion title="Yeni kurdum - önce ne yapmalıyım?">
    İyi ilk projeler:

    - Bir web sitesi oluşturun (WordPress, Shopify veya basit bir statik site).
    - Bir mobil uygulama prototipi hazırlayın (taslak, ekranlar, API planı).
    - Dosya ve klasörleri düzenleyin (temizlik, adlandırma, etiketleme).
    - Gmail'i bağlayın ve özetleri ya da takipleri otomatikleştirin.

    Büyük görevleri halledebilir, ancak bunları aşamalara böldüğünüzde ve
    paralel çalışma için alt ajanlar kullandığınızda en iyi sonucu verir.

  </Accordion>

  <Accordion title="OpenClaw için en iyi beş günlük kullanım alanı nedir?">
    Günlük kazanımlar genellikle şöyle görünür:

    - **Kişisel brifingler:** Gelen kutusu, takvim ve önemsediğiniz haberlerin özetleri.
    - **Araştırma ve taslak hazırlama:** E-postalar veya dokümanlar için hızlı araştırma, özetler ve ilk taslaklar.
    - **Hatırlatıcılar ve takipler:** Cron veya Heartbeat ile tetiklenen dürtmeler ve kontrol listeleri.
    - **Tarayıcı otomasyonu:** Form doldurma, veri toplama ve web görevlerini tekrarlama.
    - **Cihazlar arası koordinasyon:** Telefonunuzdan bir görev gönderin, Gateway'in bunu bir sunucuda çalıştırmasına izin verin ve sonucu sohbette geri alın.

  </Accordion>

  <Accordion title="OpenClaw bir SaaS için müşteri adayı oluşturma, erişim, reklamlar ve bloglarda yardımcı olabilir mi?">
    **Araştırma, nitelendirme ve taslak hazırlama** için evet. Siteleri tarayabilir, kısa listeler oluşturabilir,
    potansiyel müşterileri özetleyebilir ve erişim ya da reklam metni taslakları yazabilir.

    **Erişim veya reklam çalışmaları** için döngüde bir insan tutun. Spam'den kaçının, yerel yasalara ve
    platform politikalarına uyun ve gönderilmeden önce her şeyi gözden geçirin. En güvenli kalıp,
    OpenClaw'ın taslak hazırlaması ve sizin onaylamanızdır.

    Dokümanlar: [Güvenlik](/tr/gateway/security).

  </Accordion>

  <Accordion title="Web geliştirme için Claude Code'a göre avantajları nelerdir?">
    OpenClaw bir **kişisel asistan** ve koordinasyon katmanıdır, IDE yerine geçmez. Bir repo içinde en hızlı doğrudan kodlama döngüsü için
    Claude Code veya Codex kullanın. Kalıcı bellek, cihazlar arası erişim ve araç orkestrasyonu istediğinizde OpenClaw kullanın.

    Avantajlar:

    - Oturumlar boyunca **kalıcı bellek + çalışma alanı**
    - **Çoklu platform erişimi** (WhatsApp, Telegram, TUI, WebChat)
    - **Araç orkestrasyonu** (tarayıcı, dosyalar, zamanlama, hook'lar)
    - **Her zaman açık Gateway** (VPS üzerinde çalıştırın, her yerden etkileşime geçin)
    - Yerel tarayıcı/ekran/kamera/çalıştırma için **Node'lar**

    Vitrin: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills ve otomasyon

<AccordionGroup>
  <Accordion title="Repo'yu kirli tutmadan Skills'i nasıl özelleştiririm?">
    Repo kopyasını düzenlemek yerine yönetilen geçersiz kılmalar kullanın. Değişikliklerinizi `~/.openclaw/skills/<name>/SKILL.md` içine koyun (veya `~/.openclaw/openclaw.json` içinde `skills.load.extraDirs` aracılığıyla bir klasör ekleyin). Öncelik sırası `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → paketli → `skills.load.extraDirs` şeklindedir; bu nedenle yönetilen geçersiz kılmalar, git'e dokunmadan paketli skills üzerinde yine de öncelik kazanır. Skill'in küresel olarak kurulması ama yalnızca bazı ajanlara görünmesi gerekiyorsa paylaşılan kopyayı `~/.openclaw/skills` içinde tutun ve görünürlüğü `agents.defaults.skills` ile `agents.list[].skills` üzerinden kontrol edin. Yalnızca upstream'e uygun düzenlemeler repo'da bulunmalı ve PR olarak gönderilmelidir.
  </Accordion>

  <Accordion title="Özel bir klasörden skills yükleyebilir miyim?">
    Evet. `~/.openclaw/openclaw.json` içinde `skills.load.extraDirs` aracılığıyla ek dizinler ekleyin (en düşük öncelik). Varsayılan öncelik sırası `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → paketli → `skills.load.extraDirs` şeklindedir. `clawhub` varsayılan olarak `./skills` içine kurar; OpenClaw bunu bir sonraki oturumda `<workspace>/skills` olarak ele alır. Skill yalnızca belirli ajanlara görünmeliyse bunu `agents.defaults.skills` veya `agents.list[].skills` ile eşleştirin.
  </Accordion>

  <Accordion title="Farklı görevler için farklı modelleri nasıl kullanabilirim?">
    Bugün desteklenen kalıplar şunlardır:

    - **Cron işleri**: Yalıtılmış işler, iş başına bir `model` geçersiz kılması ayarlayabilir.
    - **Alt ajanlar**: Görevleri farklı varsayılan modellere sahip ayrı ajanlara yönlendirin.
    - **İsteğe bağlı geçiş**: Geçerli oturum modelini herhangi bir zamanda değiştirmek için `/model` kullanın.

    Bkz. [Cron işleri](/tr/automation/cron-jobs), [Çoklu Ajan Yönlendirme](/tr/concepts/multi-agent) ve [Slash komutları](/tr/tools/slash-commands).

  </Accordion>

  <Accordion title="Bot ağır iş yaparken donuyor. Bunu nasıl dışa aktarırım?">
    Uzun veya paralel görevler için **alt ajanlar** kullanın. Alt ajanlar kendi oturumlarında çalışır,
    bir özet döndürür ve ana sohbetinizi duyarlı tutar.

    Botunuzdan "bu görev için bir alt ajan başlatmasını" isteyin veya `/subagents` kullanın.
    Gateway'in şu anda ne yaptığını (ve meşgul olup olmadığını) görmek için sohbette `/status` kullanın.

    Token ipucu: uzun görevler ve alt ajanların ikisi de token tüketir. Maliyet endişeniz varsa,
    `agents.defaults.subagents.model` aracılığıyla alt ajanlar için daha ucuz bir model ayarlayın.

    Dokümanlar: [Alt ajanlar](/tr/tools/subagents), [Arka Plan Görevleri](/tr/automation/tasks).

  </Accordion>

  <Accordion title="Discord'da iş parçacığına bağlı alt ajan oturumları nasıl çalışır?">
    İş parçacığı bağlarını kullanın. Bir Discord iş parçacığını bir alt ajana veya oturum hedefine bağlayabilirsiniz; böylece o iş parçacığındaki takip mesajları bağlı oturumda kalır.

    Temel akış:

    - `thread: true` ile `sessions_spawn` kullanarak başlatın (kalıcı takip için isteğe bağlı olarak `mode: "session"`).
    - Veya `/focus <target>` ile elle bağlayın.
    - Bağ durumu incelemek için `/agents` kullanın.
    - Otomatik odaktan çıkmayı kontrol etmek için `/session idle <duration|off>` ve `/session max-age <duration|off>` kullanın.
    - İş parçacığını ayırmak için `/unfocus` kullanın.

    Gerekli yapılandırma:

    - Küresel varsayılanlar: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
    - Discord geçersiz kılmaları: `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours`.
    - Başlatmada otomatik bağlama: `channels.discord.threadBindings.spawnSessions` varsayılan olarak `true` değerindedir; iş parçacığına bağlı oturum başlatmalarını devre dışı bırakmak için `false` olarak ayarlayın.

    Dokümanlar: [Alt ajanlar](/tr/tools/subagents), [Discord](/tr/channels/discord), [Yapılandırma Referansı](/tr/gateway/configuration-reference), [Slash komutları](/tr/tools/slash-commands).

  </Accordion>

  <Accordion title="Bir alt ajan tamamlandı, ancak tamamlama güncellemesi yanlış yere gitti veya hiç gönderilmedi. Neyi kontrol etmeliyim?">
    Önce çözümlenen istekte bulunan rotasını kontrol edin:

    - Tamamlama modundaki alt ajan teslimi, varsa bağlı herhangi bir iş parçacığını veya konuşma rotasını tercih eder.
    - Tamamlama kaynağı yalnızca bir kanal taşıyorsa OpenClaw, doğrudan teslimatın yine de başarılı olabilmesi için istekte bulunan oturumun depolanmış rotasına (`lastChannel` / `lastTo` / `lastAccountId`) geri döner.
    - Ne bağlı bir rota ne de kullanılabilir bir depolanmış rota varsa doğrudan teslimat başarısız olabilir ve sonuç sohbete hemen gönderilmek yerine kuyruğa alınmış oturum teslimatına geri döner.
    - Geçersiz veya eski hedefler yine de kuyruk geri dönüşünü ya da nihai teslimat hatasını zorlayabilir.
    - Çocuğun son görünür asistan yanıtı tam sessiz token `NO_REPLY` / `no_reply` veya tam olarak `ANNOUNCE_SKIP` ise OpenClaw eski önceki ilerlemeyi göndermek yerine duyuruyu kasıtlı olarak bastırır.
    - Çocuk yalnızca araç çağrılarından sonra zaman aşımına uğradıysa duyuru, ham araç çıktısını yeniden oynatmak yerine bunu kısa bir kısmi ilerleme özetine indirebilir.

    Hata ayıklama:

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    Dokümanlar: [Alt ajanlar](/tr/tools/subagents), [Arka Plan Görevleri](/tr/automation/tasks), [Oturum Araçları](/tr/concepts/session-tool).

  </Accordion>

  <Accordion title="Cron veya hatırlatıcılar çalışmıyor. Neyi kontrol etmeliyim?">
    Cron, Gateway işlemi içinde çalışır. Gateway sürekli çalışmıyorsa,
    zamanlanmış işler çalışmaz.

    Kontrol listesi:

    - Cron'un etkin olduğunu (`cron.enabled`) ve `OPENCLAW_SKIP_CRON` ayarlanmadığını doğrulayın.
    - Gateway'in 7/24 çalıştığını kontrol edin (uyku/yeniden başlatma yok).
    - İş için saat dilimi ayarlarını doğrulayın (`--tz` ve ana makine saat dilimi).

    Hata ayıklama:

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    Dokümanlar: [Cron işleri](/tr/automation/cron-jobs), [Otomasyon ve Görevler](/tr/automation).

  </Accordion>

  <Accordion title="Cron çalıştı, ancak kanala hiçbir şey gönderilmedi. Neden?">
    Önce teslim modunu kontrol edin:

    - `--no-deliver` / `delivery.mode: "none"` hiçbir çalıştırıcı yedek gönderimi beklenmediği anlamına gelir.
    - Eksik veya geçersiz duyuru hedefi (`channel` / `to`), çalıştırıcının dışa teslimi atladığı anlamına gelir.
    - Kanal kimlik doğrulama hataları (`unauthorized`, `Forbidden`), çalıştırıcının teslim etmeye çalıştığı ancak kimlik bilgilerinin bunu engellediği anlamına gelir.
    - Sessiz izole sonuç (yalnızca `NO_REPLY` / `no_reply`) bilerek teslim edilemez kabul edilir, bu yüzden çalıştırıcı kuyruktaki yedek teslimi de bastırır.

    İzole cron işleri için, bir sohbet rotası kullanılabiliyorsa agent yine de `message`
    aracıyla doğrudan gönderebilir. `--announce` yalnızca agent'ın zaten göndermediği
    son metin için çalıştırıcı yedek yolunu kontrol eder.

    Hata ayıklama:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Dokümanlar: [Cron işleri](/tr/automation/cron-jobs), [Arka Plan Görevleri](/tr/automation/tasks).

  </Accordion>

  <Accordion title="İzole bir cron çalışması neden model değiştirdi veya bir kez yeniden denedi?">
    Bu genellikle yinelenen zamanlama değil, canlı model değiştirme yoludur.

    İzole cron, etkin çalışma `LiveSessionModelSwitchError` fırlattığında çalışma zamanı
    model devrini kalıcı hale getirebilir ve yeniden deneyebilir. Yeniden deneme değiştirilen
    sağlayıcıyı/modeli korur; değişiklik yeni bir kimlik doğrulama profili geçersiz kılması
    taşıyorsa cron yeniden denemeden önce onu da kalıcı hale getirir.

    İlgili seçim kuralları:

    - Uygulanabilir olduğunda önce Gmail hook model geçersiz kılması kazanır.
    - Sonra iş başına `model`.
    - Sonra depolanmış herhangi bir cron oturumu model geçersiz kılması.
    - Sonra normal agent/varsayılan model seçimi.

    Yeniden deneme döngüsü sınırlıdır. İlk deneme artı 2 değiştirme yeniden denemesinden
    sonra cron sonsuza kadar döngüye girmek yerine iptal eder.

    Hata ayıklama:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Dokümanlar: [Cron işleri](/tr/automation/cron-jobs), [cron CLI](/tr/cli/cron).

  </Accordion>

  <Accordion title="Linux'ta Skills nasıl kurarım?">
    Yerel `openclaw skills` komutlarını kullanın veya skills'i çalışma alanınıza bırakın. macOS Skills arayüzü Linux'ta kullanılamaz.
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
    dizinine yazar. Ayrı `clawhub` CLI'yi yalnızca kendi skills'inizi yayımlamak veya
    eşitlemek istiyorsanız kurun. Agent'lar arasında paylaşılan kurulumlar için skill'i
    `~/.openclaw/skills` altına koyun ve hangi agent'ların onu görebileceğini daraltmak
    istiyorsanız `agents.defaults.skills` veya `agents.list[].skills` kullanın.

  </Accordion>

  <Accordion title="OpenClaw görevleri bir zamanlamaya göre veya arka planda sürekli çalıştırabilir mi?">
    Evet. Gateway zamanlayıcısını kullanın:

    - Zamanlanmış veya yinelenen görevler için **Cron işleri** (yeniden başlatmalar arasında kalıcıdır).
    - "Ana oturum" dönemsel kontrolleri için **Heartbeat**.
    - Özetler yayımlayan veya sohbetlere teslim eden otonom agent'lar için **İzole işler**.

    Dokümanlar: [Cron işleri](/tr/automation/cron-jobs), [Otomasyon ve Görevler](/tr/automation),
    [Heartbeat](/tr/gateway/heartbeat).

  </Accordion>

  <Accordion title="Apple macOS'a özel skills'i Linux'tan çalıştırabilir miyim?">
    Doğrudan değil. macOS skills'i `metadata.openclaw.os` ve gerekli ikili dosyalarla sınırlandırılır; skills sistem isteminde yalnızca **Gateway host** üzerinde uygun olduklarında görünür. Linux'ta, `darwin`-only skills (`apple-notes`, `apple-reminders`, `things-mac` gibi) sınırlandırmayı geçersiz kılmadığınız sürece yüklenmez.

    Desteklenen üç desen vardır:

    **Seçenek A - Gateway'i bir Mac'te çalıştırın (en basiti).**
    Gateway'i macOS ikili dosyalarının bulunduğu yerde çalıştırın, ardından Linux'tan [uzak modda](#gateway-ports-already-running-and-remote-mode) veya Tailscale üzerinden bağlanın. Gateway host macOS olduğu için skills normal şekilde yüklenir.

    **Seçenek B - bir macOS node kullanın (SSH yok).**
    Gateway'i Linux'ta çalıştırın, bir macOS node'u (menü çubuğu uygulaması) eşleştirin ve Mac'te **Node Çalıştırma Komutları** ayarını "Her Zaman Sor" veya "Her Zaman İzin Ver" olarak belirleyin. OpenClaw, gerekli ikili dosyalar node üzerinde bulunduğunda macOS'a özel skills'i uygun kabul edebilir. Agent bu skills'i `nodes` aracı üzerinden çalıştırır. "Her Zaman Sor" seçeneğini seçerseniz, istemde "Her Zaman İzin Ver" onayı bu komutu izin listesine ekler.

    **Seçenek C - macOS ikili dosyalarını SSH üzerinden proxy'leyin (ileri düzey).**
    Gateway'i Linux'ta tutun, ancak gerekli CLI ikili dosyalarının bir Mac'te çalışan SSH sarmalayıcılarına çözümlenmesini sağlayın. Ardından skill'in Linux'a izin vermesi için geçersiz kılın ki uygun kalmaya devam etsin.

    1. İkili dosya için bir SSH sarmalayıcısı oluşturun (örnek: Apple Notes için `memo`):

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. Sarmalayıcıyı Linux host üzerinde `PATH`'e koyun (örneğin `~/bin/memo`).
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

    - **Özel skill / Plugin:** güvenilir API erişimi için en iyi seçenek (Notion/HeyGen ikisinin de API'leri vardır).
    - **Tarayıcı otomasyonu:** kod olmadan çalışır ancak daha yavaş ve daha kırılgandır.

    Bağlamı müşteri başına korumak istiyorsanız (ajans iş akışları), basit bir desen şudur:

    - Müşteri başına bir Notion sayfası (bağlam + tercihler + etkin iş).
    - Oturumun başında agent'tan bu sayfayı getirmesini isteyin.

    Yerel bir entegrasyon istiyorsanız, bir özellik isteği açın veya bu API'leri
    hedefleyen bir skill oluşturun.

    Skills kurun:

    ```bash
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    Yerel kurulumlar etkin çalışma alanındaki `skills/` dizinine iner. Agent'lar arasında paylaşılan skills için bunları `~/.openclaw/skills/<name>/SKILL.md` içine yerleştirin. Paylaşılan bir kurulumu yalnızca bazı agent'ların görmesi gerekiyorsa `agents.defaults.skills` veya `agents.list[].skills` yapılandırın. Bazı skills, Homebrew üzerinden kurulan ikili dosyalar bekler; Linux'ta bu Linuxbrew anlamına gelir (yukarıdaki Homebrew Linux SSS girdisine bakın). Bkz. [Skills](/tr/tools/skills), [Skills yapılandırması](/tr/tools/skills-config) ve [ClawHub](/tr/tools/clawhub).

  </Accordion>

  <Accordion title="OpenClaw ile mevcut oturum açılmış Chrome'umu nasıl kullanırım?">
    Chrome DevTools MCP üzerinden eklenen yerleşik `user` tarayıcı profilini kullanın:

    ```bash
    openclaw browser --browser-profile user tabs
    openclaw browser --browser-profile user snapshot
    ```

    Özel bir ad istiyorsanız, açık bir MCP profili oluşturun:

    ```bash
    openclaw browser create-profile --name chrome-live --driver existing-session
    openclaw browser --browser-profile chrome-live tabs
    ```

    Bu yol yerel host tarayıcısını veya bağlı bir tarayıcı node'unu kullanabilir. Gateway başka bir yerde çalışıyorsa, tarayıcı makinesinde bir node host çalıştırın veya bunun yerine uzak CDP kullanın.

    `existing-session` / `user` üzerindeki mevcut sınırlar:

    - eylemler CSS seçici odaklı değil, ref odaklıdır
    - yüklemeler `ref` / `inputRef` gerektirir ve şu anda aynı anda bir dosyayı destekler
    - `responsebody`, PDF dışa aktarma, indirme yakalama ve toplu eylemler için hâlâ yönetilen tarayıcı veya ham CDP profili gerekir

  </Accordion>
</AccordionGroup>

## Sandbox ve bellek

<AccordionGroup>
  <Accordion title="Ayrılmış bir sandbox dokümanı var mı?">
    Evet. Bkz. [Sandbox](/tr/gateway/sandboxing). Docker'a özel kurulum için (Docker içinde tam gateway veya sandbox görüntüleri), bkz. [Docker](/tr/install/docker).
  </Accordion>

  <Accordion title="Docker sınırlı geliyor - tam özellikleri nasıl etkinleştiririm?">
    Varsayılan görüntü güvenliği önceleyen şekilde hazırlanmıştır ve `node` kullanıcısı
    olarak çalışır; bu yüzden sistem paketleri, Homebrew veya paketlenmiş tarayıcılar
    içermez. Daha tam bir kurulum için:

    - Önbelleklerin kalıcı olması için `/home/node` dizinini `OPENCLAW_HOME_VOLUME` ile kalıcı hale getirin.
    - Sistem bağımlılıklarını `OPENCLAW_DOCKER_APT_PACKAGES` ile görüntüye ekleyin.
    - Playwright tarayıcılarını paketlenmiş CLI ile kurun:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - `PLAYWRIGHT_BROWSERS_PATH` ayarlayın ve yolun kalıcı olduğundan emin olun.

    Dokümanlar: [Docker](/tr/install/docker), [Tarayıcı](/tr/tools/browser).

  </Accordion>

  <Accordion title="DM'leri kişisel tutup grupları tek bir agent ile herkese açık/sandbox içinde yapabilir miyim?">
    Evet - özel trafiğiniz **DM'ler** ve herkese açık trafiğiniz **gruplar** ise.

    `agents.defaults.sandbox.mode: "non-main"` kullanın; böylece grup/kanal oturumları (ana olmayan anahtarlar) yapılandırılmış sandbox arka ucunda çalışırken ana DM oturumu host üzerinde kalır. Bir arka uç seçmezseniz Docker varsayılandır. Ardından `tools.sandbox.tools` aracılığıyla sandbox içindeki oturumlarda hangi araçların kullanılabileceğini kısıtlayın.

    Kurulum adımları + örnek yapılandırma: [Gruplar: kişisel DM'ler + herkese açık gruplar](/tr/channels/groups#pattern-personal-dms-public-groups-single-agent)

    Ana yapılandırma başvurusu: [Gateway yapılandırması](/tr/gateway/config-agents#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="Bir host klasörünü sandbox içine nasıl bağlarım?">
    `agents.defaults.sandbox.docker.binds` değerini `["host:path:mode"]` olarak ayarlayın (ör. `"/home/user/src:/src:ro"`). Genel + agent başına bind'lar birleştirilir; `scope: "shared"` olduğunda agent başına bind'lar yok sayılır. Hassas olan her şey için `:ro` kullanın ve bind'ların sandbox dosya sistemi duvarlarını atladığını unutmayın.

    OpenClaw bind kaynaklarını hem normalleştirilmiş yola hem de en derindeki mevcut üst dizin üzerinden çözümlenen kanonik yola göre doğrular. Bu, son yol segmenti henüz mevcut olmasa bile sembolik bağlantı üst dizini kaçışlarının kapalı şekilde başarısız olduğu ve izin verilen kök kontrollerinin sembolik bağlantı çözümlemesinden sonra hâlâ uygulandığı anlamına gelir.

    Örnekler ve güvenlik notları için bkz. [Sandbox](/tr/gateway/sandboxing#custom-bind-mounts) ve [Sandbox vs Araç Politikası vs Yükseltilmiş](/tr/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check).

  </Accordion>

  <Accordion title="Bellek nasıl çalışır?">
    OpenClaw belleği, agent çalışma alanındaki Markdown dosyalarından ibarettir:

    - `memory/YYYY-MM-DD.md` içinde günlük notlar
    - `MEMORY.md` içinde düzenlenmiş uzun vadeli notlar (yalnızca ana/özel oturumlar)

    OpenClaw ayrıca, otomatik Compaction öncesinde modelin kalıcı notlar yazmasını
    hatırlatmak için **sessiz Compaction öncesi bellek boşaltma** çalıştırır. Bu yalnızca çalışma alanı
    yazılabilir olduğunda çalışır (salt okunur sandbox'lar bunu atlar). Bkz. [Bellek](/tr/concepts/memory).

  </Accordion>

  <Accordion title="Bellek bir şeyleri unutmaya devam ediyor. Kalıcı olmasını nasıl sağlarım?">
    Bottan **gerçeği belleğe yazmasını** isteyin. Uzun vadeli notlar `MEMORY.md`
    içine, kısa vadeli bağlam `memory/YYYY-MM-DD.md` içine gider.

    Bu hâlâ geliştirdiğimiz bir alan. Modele anıları saklamasını hatırlatmak yardımcı olur;
    ne yapacağını bilir. Unutmaya devam ederse Gateway'in her çalıştırmada aynı
    çalışma alanını kullandığını doğrulayın.

    Dokümanlar: [Bellek](/tr/concepts/memory), [Agent çalışma alanı](/tr/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Bellek sonsuza kadar kalıcı mı? Sınırlar nelerdir?">
    Bellek dosyaları diskte yaşar ve siz silene kadar kalıcı olur. Sınır model değil,
    depolamanızdır. **Oturum bağlamı** yine de model bağlam penceresiyle sınırlıdır,
    bu yüzden uzun konuşmalar compact edilebilir veya kesilebilir. Bellek aramasının
    var olmasının nedeni budur - yalnızca ilgili parçaları yeniden bağlama çeker.

    Dokümanlar: [Bellek](/tr/concepts/memory), [Bağlam](/tr/concepts/context).

  </Accordion>

  <Accordion title="Anlamsal bellek araması için OpenAI API anahtarı gerekir mi?">
    Yalnızca **OpenAI embeddings** kullanırsanız. Codex OAuth sohbet/tamamlamaları kapsar ve
    embeddings erişimi **vermez**, bu nedenle **Codex ile oturum açmak (OAuth veya
    Codex CLI oturumu)** anlamsal bellek araması için yardımcı olmaz. OpenAI embeddings
    için yine gerçek bir API anahtarı gerekir (`OPENAI_API_KEY` veya `models.providers.openai.apiKey`).

    Açıkça bir sağlayıcı ayarlamazsanız, OpenClaw bir API anahtarını çözümleyebildiğinde
    bir sağlayıcıyı otomatik seçer (kimlik doğrulama profilleri, `models.providers.*.apiKey` veya ortam değişkenleri).
    Bir OpenAI anahtarı çözümlenirse OpenAI'ı, aksi halde bir Gemini anahtarı
    çözümlenirse Gemini'ı, sonra Voyage'ı, sonra Mistral'ı tercih eder. Uzak anahtar yoksa,
    bellek araması siz yapılandırana kadar devre dışı kalır. Yapılandırılmış ve mevcut bir
    yerel model yolunuz varsa, OpenClaw
    `local`ı tercih eder. Ollama, açıkça
    `memorySearch.provider = "ollama"` ayarladığınızda desteklenir.

    Yerelde kalmayı tercih ediyorsanız `memorySearch.provider = "local"` ayarlayın (ve isteğe bağlı olarak
    `memorySearch.fallback = "none"`). Gemini embeddings istiyorsanız,
    `memorySearch.provider = "gemini"` ayarlayın ve `GEMINI_API_KEY` (veya
    `memorySearch.remote.apiKey`) sağlayın. **OpenAI, Gemini, Voyage, Mistral, Ollama veya yerel** embedding
    modellerini destekliyoruz - kurulum ayrıntıları için [Bellek](/tr/concepts/memory) bölümüne bakın.

  </Accordion>
</AccordionGroup>

## Öğelerin diskte bulunduğu yer

<AccordionGroup>
  <Accordion title="OpenClaw ile kullanılan tüm veriler yerel olarak mı kaydedilir?">
    Hayır - **OpenClaw durumu yereldir**, ancak **harici hizmetler gönderdiğiniz şeyleri yine de görür**.

    - **Varsayılan olarak yerel:** oturumlar, bellek dosyaları, yapılandırma ve çalışma alanı Gateway ana makinesinde bulunur
      (`~/.openclaw` + çalışma alanı dizininiz).
    - **Zorunlu olarak uzak:** model sağlayıcılarına (Anthropic/OpenAI/vb.) gönderdiğiniz iletiler
      onların API'lerine gider ve sohbet platformları (WhatsApp/Telegram/Slack/vb.) ileti verilerini kendi
      sunucularında depolar.
    - **Ayak izini siz kontrol edersiniz:** yerel modeller kullanmak istemleri makinenizde tutar, ancak kanal
      trafiği yine de kanalın sunucularından geçer.

    İlgili: [Aracı çalışma alanı](/tr/concepts/agent-workspace), [Bellek](/tr/concepts/memory).

  </Accordion>

  <Accordion title="OpenClaw verilerini nerede depolar?">
    Her şey `$OPENCLAW_STATE_DIR` altında bulunur (varsayılan: `~/.openclaw`):

    | Yol                                                             | Amaç                                                               |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | Ana yapılandırma (JSON5)                                           |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | Eski OAuth içe aktarması (ilk kullanımda kimlik doğrulama profillerine kopyalanır) |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | Kimlik doğrulama profilleri (OAuth, API anahtarları ve isteğe bağlı `keyRef`/`tokenRef`) |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | `file` SecretRef sağlayıcıları için isteğe bağlı dosya destekli gizli yük |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | Eski uyumluluk dosyası (statik `api_key` girdileri temizlenmiş)    |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | Sağlayıcı durumu (örn. `whatsapp/<accountId>/creds.json`)          |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | Aracı başına durum (agentDir + oturumlar)                          |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | Konuşma geçmişi ve durumu (aracı başına)                           |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | Oturum meta verileri (aracı başına)                                |

    Eski tek aracı yolu: `~/.openclaw/agent/*` (`openclaw doctor` tarafından taşınır).

    **Çalışma alanınız** (AGENTS.md, bellek dosyaları, Skills vb.) ayrıdır ve `agents.defaults.workspace` üzerinden yapılandırılır (varsayılan: `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title="AGENTS.md / SOUL.md / USER.md / MEMORY.md nerede bulunmalı?">
    Bu dosyalar `~/.openclaw` içinde değil, **aracı çalışma alanında** bulunur.

    - **Çalışma alanı (aracı başına)**: `AGENTS.md`, `SOUL.md`, `IDENTITY.md`, `USER.md`,
      `MEMORY.md`, `memory/YYYY-MM-DD.md`, isteğe bağlı `HEARTBEAT.md`.
      Küçük harfli kök `memory.md` yalnızca eski onarım girdisidir; iki dosya da varsa `openclaw doctor --fix`
      bunu `MEMORY.md` içine birleştirebilir.
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

    `~/.openclaw` altındaki hiçbir şeyi commit etmeyin (kimlik bilgileri, oturumlar, token'lar veya şifrelenmiş gizli yükler).
    Tam geri yükleme gerekiyorsa, hem çalışma alanını hem de durum dizinini
    ayrı ayrı yedekleyin (yukarıdaki taşıma sorusuna bakın).

    Belgeler: [Aracı çalışma alanı](/tr/concepts/agent-workspace).

  </Accordion>

  <Accordion title="OpenClaw'ı tamamen nasıl kaldırırım?">
    Özel kılavuza bakın: [Kaldırma](/tr/install/uninstall).
  </Accordion>

  <Accordion title="Aracılar çalışma alanı dışında çalışabilir mi?">
    Evet. Çalışma alanı **varsayılan cwd** ve bellek dayanağıdır, katı bir sandbox değildir.
    Göreli yollar çalışma alanı içinde çözümlenir, ancak sandboxing etkin değilse mutlak yollar diğer
    ana makine konumlarına erişebilir. Yalıtım gerekiyorsa
    [`agents.defaults.sandbox`](/tr/gateway/sandboxing) veya aracı başına sandbox ayarlarını kullanın. Bir deponun
    varsayılan çalışma dizini olmasını istiyorsanız, o aracının
    `workspace` değerini depo köküne yönlendirin. OpenClaw deposu yalnızca kaynak koddur; aracının özellikle içinde çalışmasını
    istemiyorsanız çalışma alanını ayrı tutun.

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
  <Accordion title="Yapılandırmanın biçimi nedir? Nerede bulunur?">
    OpenClaw, `$OPENCLAW_CONFIG_PATH` üzerinden isteğe bağlı bir **JSON5** yapılandırması okur (varsayılan: `~/.openclaw/openclaw.json`):

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    Dosya yoksa, güvenli sayılabilecek varsayılanları kullanır (`~/.openclaw/workspace` varsayılan çalışma alanı dahil).

  </Accordion>

  <Accordion title='gateway.bind: "lan" (veya "tailnet") ayarladım ve artık hiçbir şey dinlemiyor / UI yetkisiz diyor'>
    local loopback olmayan bağlamalar **geçerli bir gateway kimlik doğrulama yolu gerektirir**. Pratikte bu şu anlama gelir:

    - paylaşılan gizli kimlik doğrulaması: token veya parola
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

    - `gateway.remote.token` / `.password` tek başlarına yerel gateway kimlik doğrulamasını etkinleştirmez.
    - Yerel çağrı yolları, yalnızca `gateway.auth.*` ayarlanmamışsa `gateway.remote.*` değerini yedek olarak kullanabilir.
    - Parola kimlik doğrulaması için bunun yerine `gateway.auth.mode: "password"` ve `gateway.auth.password` (veya `OPENCLAW_GATEWAY_PASSWORD`) ayarlayın.
    - `gateway.auth.token` / `gateway.auth.password` SecretRef üzerinden açıkça yapılandırılmış ve çözümlenememişse, çözümleme kapalı biçimde başarısız olur (uzak yedek maskelemesi yoktur).
    - Paylaşılan gizli Control UI kurulumları `connect.params.auth.token` veya `connect.params.auth.password` üzerinden kimlik doğrular (uygulama/UI ayarlarında saklanır). Tailscale Serve veya `trusted-proxy` gibi kimlik taşıyan modlar bunun yerine istek başlıklarını kullanır. Paylaşılan gizli bilgileri URL'lere koymaktan kaçının.
    - `gateway.auth.mode: "trusted-proxy"` ile aynı ana makinedeki local loopback ters proxy'leri açık `gateway.auth.trustedProxy.allowLoopback = true` ve `gateway.trustedProxies` içinde bir local loopback girdisi gerektirir.

  </Accordion>

  <Accordion title="Artık localhost üzerinde neden bir token gerekiyor?">
    OpenClaw, local loopback dahil olmak üzere varsayılan olarak gateway kimlik doğrulamasını zorunlu kılar. Normal varsayılan yolda bu token kimlik doğrulaması anlamına gelir: açık bir kimlik doğrulama yolu yapılandırılmamışsa gateway başlatma token moduna çözümlenir ve o başlatma için yalnızca çalışma zamanına ait bir token üretir, bu nedenle **yerel WS istemcileri kimlik doğrulamalıdır**. İstemcilerin yeniden başlatmalar arasında kararlı bir gizli bilgiye ihtiyacı olduğunda `gateway.auth.token`, `gateway.auth.password`, `OPENCLAW_GATEWAY_TOKEN` veya `OPENCLAW_GATEWAY_PASSWORD` değerlerini açıkça yapılandırın. Bu, diğer yerel süreçlerin Gateway'i çağırmasını engeller.

    Farklı bir kimlik doğrulama yolunu tercih ediyorsanız, parola modunu (veya kimlik farkındalıklı ters proxy'ler için `trusted-proxy`) açıkça seçebilirsiniz. **Gerçekten** açık local loopback istiyorsanız, yapılandırmanızda `gateway.auth.mode: "none"` değerini açıkça ayarlayın. Doctor sizin için istediğiniz zaman token üretebilir: `openclaw doctor --generate-gateway-token`.

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

    - `off`: slogan metnini gizler, ancak başlık/sürüm satırını korur.
    - `default`: her seferinde `All your chats, one OpenClaw.` kullanır.
    - `random`: dönen komik/mevsimsel sloganlar (varsayılan davranış).
    - Hiç banner istemiyorsanız `OPENCLAW_HIDE_BANNER=1` ortam değişkenini ayarlayın.

  </Accordion>

  <Accordion title="Web aramasını (ve web getirmeyi) nasıl etkinleştiririm?">
    `web_fetch` API anahtarı olmadan çalışır. `web_search` seçtiğiniz
    sağlayıcıya bağlıdır:

    - Brave, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Perplexity ve Tavily gibi API destekli sağlayıcılar normal API anahtarı kurulumlarını gerektirir.
    - Ollama Web Search anahtarsızdır, ancak yapılandırılmış Ollama ana makinenizi kullanır ve `ollama signin` gerektirir.
    - DuckDuckGo anahtarsızdır, ancak resmi olmayan HTML tabanlı bir entegrasyondur.
    - SearXNG anahtarsız/kendi barındırmalı çalışır; `SEARXNG_BASE_URL` veya `plugins.entries.searxng.config.webSearch.baseUrl` yapılandırın.

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
    - `web_fetch` varsayılan olarak etkindir (açıkça devre dışı bırakılmadığı sürece).
    - `tools.web.fetch.provider` atlanırsa OpenClaw, mevcut kimlik bilgilerinden ilk hazır getirme yedek sağlayıcısını otomatik algılar. Bugün paketle gelen sağlayıcı Firecrawl’dır.
    - Daemon’lar ortam değişkenlerini `~/.openclaw/.env` dosyasından (veya servis ortamından) okur.

    Belgeler: [Web araçları](/tr/tools/web).

  </Accordion>

  <Accordion title="config.apply yapılandırmamı sildi. Nasıl kurtarır ve bundan nasıl kaçınırım?">
    `config.apply` **tüm yapılandırmayı** değiştirir. Kısmi bir nesne gönderirseniz geri kalan her şey
    kaldırılır.

    Güncel OpenClaw birçok kazara üzerine yazmaya karşı koruma sağlar:

    - OpenClaw’a ait yapılandırma yazımları, yazmadan önce değişiklik sonrası tam yapılandırmayı doğrular.
    - Geçersiz veya yıkıcı OpenClaw’a ait yazımlar reddedilir ve `openclaw.json.rejected.*` olarak kaydedilir.
    - Doğrudan düzenleme başlatmayı veya sıcak yeniden yüklemeyi bozarsa Gateway güvenli kapalı duruma geçer veya yeniden yüklemeyi atlar; `openclaw.json` dosyasını yeniden yazmaz.
    - Onarım `openclaw doctor --fix` tarafından yönetilir ve reddedilen dosyayı `openclaw.json.clobbered.*` olarak kaydederken son bilinen iyi durumu geri yükleyebilir.

    Kurtarma:

    - `Invalid config at`, `Config write rejected:` veya `config reload skipped (invalid config)` için `openclaw logs --follow` çıktısını kontrol edin.
    - Etkin yapılandırmanın yanındaki en yeni `openclaw.json.clobbered.*` veya `openclaw.json.rejected.*` dosyasını inceleyin.
    - `openclaw config validate` ve `openclaw doctor --fix` çalıştırın.
    - Yalnızca amaçlanan anahtarları `openclaw config set` veya `config.patch` ile geri kopyalayın.
    - Son bilinen iyi yapılandırmanız veya reddedilen yükünüz yoksa yedekten geri yükleyin ya da `openclaw doctor` komutunu yeniden çalıştırıp kanalları/modelleri yeniden yapılandırın.
    - Bu beklenmedikse bir hata kaydı açın ve bilinen son yapılandırmanızı veya varsa bir yedeği ekleyin.
    - Yerel bir kodlama agent’ı çoğu zaman günlüklerden veya geçmişten çalışan bir yapılandırmayı yeniden oluşturabilir.

    Kaçınma:

    - Küçük değişiklikler için `openclaw config set` kullanın.
    - Etkileşimli düzenlemeler için `openclaw configure` kullanın.
    - Tam yol veya alan şekli konusunda emin değilseniz önce `config.schema.lookup` kullanın; ayrıntıya inmek için sığ bir şema düğümü ve doğrudan alt özetleri döndürür.
    - Kısmi RPC düzenlemeleri için `config.patch` kullanın; `config.apply` yalnızca tam yapılandırma değişimi için kalsın.
    - Bir agent çalıştırmasından yalnızca sahibin kullanabildiği `gateway` aracını kullanıyorsanız, `tools.exec.ask` / `tools.exec.security` yazımlarını (aynı korumalı yürütme yollarına normalize edilen eski `tools.bash.*` takma adları dahil) yine reddeder.

    Belgeler: [Yapılandırma](/tr/cli/config), [Yapılandır](/tr/cli/configure), [Gateway sorun giderme](/tr/gateway/troubleshooting#gateway-rejected-invalid-config), [Doctor](/tr/gateway/doctor).

  </Accordion>

  <Accordion title="Cihazlar arasında özelleşmiş worker’larla merkezi bir Gateway’i nasıl çalıştırırım?">
    Yaygın kalıp **tek Gateway** (örn. Raspberry Pi) artı **node’lar** ve **agent’lar** şeklindedir:

    - **Gateway (merkez):** kanalları (Signal/WhatsApp), yönlendirmeyi ve oturumları yönetir.
    - **Node’lar (cihazlar):** Mac/iOS/Android çevre birimleri olarak bağlanır ve yerel araçları (`system.run`, `canvas`, `camera`) sunar.
    - **Agent’lar (worker’lar):** özel roller için ayrı beyinler/çalışma alanlarıdır (örn. "Hetzner operasyonları", "Kişisel veri").
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

    Varsayılan `false` değeridir (görünür). Headless bazı sitelerde bot karşıtı kontrolleri tetikleme olasılığını artırır. Bkz. [Tarayıcı](/tr/tools/browser).

    Headless **aynı Chromium motorunu** kullanır ve çoğu otomasyon için çalışır (formlar, tıklamalar, kazıma, girişler). Başlıca farklar:

    - Görünür tarayıcı penceresi yoktur (görsellere ihtiyacınız varsa ekran görüntüleri kullanın).
    - Bazı siteler headless modda otomasyona karşı daha katıdır (CAPTCHA’lar, bot karşıtı önlemler).
      Örneğin X/Twitter, headless oturumları sık sık engeller.

  </Accordion>

  <Accordion title="Tarayıcı kontrolü için Brave’i nasıl kullanırım?">
    `browser.executablePath` değerini Brave ikili dosyanıza (veya Chromium tabanlı herhangi bir tarayıcıya) ayarlayın ve Gateway’i yeniden başlatın.
    Tam yapılandırma örnekleri için [Tarayıcı](/tr/tools/browser#use-brave-or-another-chromium-based-browser) bölümüne bakın.
  </Accordion>
</AccordionGroup>

## Uzak Gateway’ler ve node’lar

<AccordionGroup>
  <Accordion title="Komutlar Telegram, gateway ve node’lar arasında nasıl yayılır?">
    Telegram mesajları **gateway** tarafından işlenir. Gateway agent’ı çalıştırır ve
    ancak bir node aracı gerektiğinde **Gateway WebSocket** üzerinden node’ları çağırır:

    Telegram → Gateway → Agent → `node.*` → Node → Gateway → Telegram

    Node’lar gelen sağlayıcı trafiğini görmez; yalnızca node RPC çağrıları alırlar.

  </Accordion>

  <Accordion title="Gateway uzakta barındırılıyorsa agent’ım bilgisayarıma nasıl erişebilir?">
    Kısa cevap: **bilgisayarınızı node olarak eşleştirin**. Gateway başka yerde çalışır, ancak Gateway WebSocket üzerinden yerel makinenizdeki `node.*` araçlarını (ekran, kamera, sistem) çağırabilir.

    Tipik kurulum:

    1. Gateway’i her zaman açık ana makinede (VPS/ev sunucusu) çalıştırın.
    2. Gateway ana makinesini ve bilgisayarınızı aynı tailnet’e koyun.
    3. Gateway WS’nin erişilebilir olduğundan emin olun (tailnet bind veya SSH tüneli).
    4. macOS uygulamasını yerelde açın ve node olarak kaydolabilmesi için **SSH üzerinden Uzak** modda (veya doğrudan tailnet ile) bağlanın.
    5. Node’u Gateway’de onaylayın:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Ayrı bir TCP köprüsü gerekmez; node’lar Gateway WebSocket üzerinden bağlanır.

    Güvenlik hatırlatması: Bir macOS node’unu eşleştirmek, o makinede `system.run` kullanımına izin verir. Yalnızca
    güvendiğiniz cihazları eşleştirin ve [Güvenlik](/tr/gateway/security) bölümünü inceleyin.

    Belgeler: [Node’lar](/tr/nodes), [Gateway protokolü](/tr/gateway/protocol), [macOS uzak modu](/tr/platforms/mac/remote), [Güvenlik](/tr/gateway/security).

  </Accordion>

  <Accordion title="Tailscale bağlı ama yanıt alamıyorum. Şimdi ne yapmalıyım?">
    Temel kontrolleri yapın:

    - Gateway çalışıyor: `openclaw gateway status`
    - Gateway sağlık durumu: `openclaw status`
    - Kanal sağlık durumu: `openclaw channels status`

    Ardından kimlik doğrulamayı ve yönlendirmeyi doğrulayın:

    - Tailscale Serve kullanıyorsanız `gateway.auth.allowTailscale` değerinin doğru ayarlandığından emin olun.
    - SSH tüneli üzerinden bağlanıyorsanız yerel tünelin açık olduğunu ve doğru porta işaret ettiğini doğrulayın.
    - İzin listelerinizin (DM veya grup) hesabınızı içerdiğini doğrulayın.

    Belgeler: [Tailscale](/tr/gateway/tailscale), [Uzaktan erişim](/tr/gateway/remote), [Kanallar](/tr/channels).

  </Accordion>

  <Accordion title="İki OpenClaw örneği birbiriyle konuşabilir mi (yerel + VPS)?">
    Evet. Yerleşik bir "bot-to-bot" köprüsü yoktur, ancak bunu birkaç
    güvenilir yolla bağlayabilirsiniz:

    **En basit:** her iki botun da erişebildiği normal bir sohbet kanalı kullanın (Telegram/Slack/WhatsApp).
    Bot A’nın Bot B’ye mesaj göndermesini sağlayın, ardından Bot B her zamanki gibi yanıtlasın.

    **CLI köprüsü (genel):** diğer botun dinlediği bir sohbeti hedefleyerek
    `openclaw agent --message ... --deliver` ile diğer Gateway’i çağıran bir betik çalıştırın.
    Botlardan biri uzak bir VPS üzerindeyse CLI’nizi SSH/Tailscale üzerinden o uzak Gateway’e
    yönlendirin (bkz. [Uzaktan erişim](/tr/gateway/remote)).

    Örnek kalıp (hedef Gateway’e erişebilen bir makineden çalıştırın):

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    İpucu: iki botun sonsuz döngüye girmemesi için bir güvenlik sınırı ekleyin (yalnızca bahsetme,
    kanal izin listeleri veya "bot mesajlarına yanıt verme" kuralı).

    Belgeler: [Uzaktan erişim](/tr/gateway/remote), [Agent CLI](/tr/cli/agent), [Agent gönderimi](/tr/tools/agent-send).

  </Accordion>

  <Accordion title="Birden fazla agent için ayrı VPS’lere ihtiyacım var mı?">
    Hayır. Bir Gateway birden fazla agent barındırabilir; her birinin kendi çalışma alanı, model varsayılanları
    ve yönlendirmesi olabilir. Bu normal kurulumdur ve agent başına bir VPS çalıştırmaktan çok daha ucuz ve basittir.

    Ayrı VPS’leri yalnızca katı izolasyona (güvenlik sınırları) veya paylaşmak istemediğiniz çok
    farklı yapılandırmalara ihtiyacınız olduğunda kullanın. Aksi halde tek Gateway kullanın ve
    birden fazla agent veya alt agent kullanın.

  </Accordion>

  <Accordion title="VPS’den SSH kullanmak yerine kişisel dizüstü bilgisayarımda node kullanmanın bir faydası var mı?">
    Evet - node’lar uzak bir Gateway’den dizüstü bilgisayarınıza erişmenin birinci sınıf yoludur ve
    kabuk erişiminden fazlasını sağlar. Gateway macOS/Linux üzerinde çalışır (Windows WSL2 üzerinden) ve
    hafiftir (küçük bir VPS veya Raspberry Pi sınıfı kutu yeterlidir; 4 GB RAM fazlasıyla yeterli), bu nedenle yaygın
    kurulum her zaman açık bir ana makine artı node olarak dizüstü bilgisayarınızdır.

    - **Gelen SSH gerekmez.** Node’lar Gateway WebSocket’e dışarı doğru bağlanır ve cihaz eşleştirme kullanır.
    - **Daha güvenli yürütme kontrolleri.** `system.run`, o dizüstü bilgisayardaki node izin listeleri/onaylarıyla sınırlandırılır.
    - **Daha fazla cihaz aracı.** Node’lar `system.run` ek olarak `canvas`, `camera` ve `screen` sunar.
    - **Yerel tarayıcı otomasyonu.** Gateway’i VPS’de tutun, ancak Chrome’u dizüstü bilgisayardaki bir node host üzerinden yerelde çalıştırın veya Chrome MCP üzerinden host üzerindeki yerel Chrome’a bağlanın.

    SSH geçici kabuk erişimi için uygundur, ancak node’lar sürekli agent iş akışları ve
    cihaz otomasyonu için daha basittir.

    Belgeler: [Node’lar](/tr/nodes), [Node’lar CLI](/tr/cli/nodes), [Tarayıcı](/tr/tools/browser).

  </Accordion>

  <Accordion title="Node’lar bir gateway servisi çalıştırır mı?">
    Hayır. Bilerek izole profiller çalıştırmıyorsanız ana makine başına yalnızca **tek gateway** çalışmalıdır (bkz. [Birden çok gateway](/tr/gateway/multiple-gateways)). Node’lar gateway’e bağlanan çevre birimleridir
    (iOS/Android node’ları veya menü çubuğu uygulamasında macOS "node modu"). Headless node
    host’ları ve CLI kontrolü için bkz. [Node host CLI](/tr/cli/node).

    `gateway`, `discovery` ve barındırılan Plugin yüzeyi değişiklikleri için tam yeniden başlatma gerekir.

  </Accordion>

  <Accordion title="Yapılandırma uygulamak için API / RPC yolu var mı?">
    Evet.

    - `config.schema.lookup`: yazmadan önce bir config alt ağacını sığ schema düğümü, eşleşen UI ipucu ve doğrudan alt özetleriyle inceleyin
    - `config.get`: geçerli snapshot + hash değerini getirir
    - `config.patch`: güvenli kısmi güncelleme (çoğu RPC düzenlemesi için tercih edilir); mümkün olduğunda hot-reload yapar, gerektiğinde yeniden başlatır
    - `config.apply`: config'in tamamını doğrular + değiştirir; mümkün olduğunda hot-reload yapar, gerektiğinde yeniden başlatır
    - Yalnızca owner'a açık `gateway` runtime aracı hâlâ `tools.exec.ask` / `tools.exec.security` değerlerini yeniden yazmayı reddeder; eski `tools.bash.*` alias'ları aynı korumalı exec yollarına normalize edilir

  </Accordion>

  <Accordion title="İlk kurulum için minimal mantıklı config">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    Bu, workspace'inizi ayarlar ve botu kimlerin tetikleyebileceğini kısıtlar.

  </Accordion>

  <Accordion title="Bir VPS üzerinde Tailscale'i nasıl kurup Mac'imden nasıl bağlanırım?">
    Minimal adımlar:

    1. **VPS üzerinde kurun + giriş yapın**

       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```

    2. **Mac'inizde kurun + giriş yapın**
       - Tailscale uygulamasını kullanın ve aynı tailnet'e giriş yapın.
    3. **MagicDNS'i etkinleştirin (önerilir)**
       - Tailscale yönetici konsolunda MagicDNS'i etkinleştirerek VPS'in kararlı bir ada sahip olmasını sağlayın.
    4. **tailnet hostname'ini kullanın**
       - SSH: `ssh user@your-vps.tailnet-xxxx.ts.net`
       - Gateway WS: `ws://your-vps.tailnet-xxxx.ts.net:18789`

    Control UI'yi SSH olmadan istiyorsanız VPS üzerinde Tailscale Serve kullanın:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Bu, gateway'i loopback'e bağlı tutar ve Tailscale üzerinden HTTPS olarak dışa açar. Bkz. [Tailscale](/tr/gateway/tailscale).

  </Accordion>

  <Accordion title="Bir Mac node'unu uzak Gateway'e nasıl bağlarım (Tailscale Serve)?">
    Serve, **Gateway Control UI + WS**'yi dışa açar. Node'lar aynı Gateway WS endpoint'i üzerinden bağlanır.

    Önerilen kurulum:

    1. **VPS + Mac'in aynı tailnet üzerinde olduğundan emin olun**.
    2. **macOS uygulamasını Remote modunda kullanın** (SSH hedefi tailnet hostname'i olabilir).
       Uygulama Gateway portunu tüneller ve node olarak bağlanır.
    3. **Node'u gateway üzerinde onaylayın**:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Dokümanlar: [Gateway protokolü](/tr/gateway/protocol), [Keşif](/tr/gateway/discovery), [macOS remote modu](/tr/platforms/mac/remote).

  </Accordion>

  <Accordion title="İkinci bir dizüstü bilgisayara kurulum yapmalı mıyım, yoksa sadece bir node mu eklemeliyim?">
    İkinci dizüstü bilgisayarda yalnızca **yerel araçlara** (ekran/kamera/exec) ihtiyacınız varsa, onu bir
    **node** olarak ekleyin. Bu, tek bir Gateway tutar ve yinelenen config'i önler. Yerel node araçları
    şu anda yalnızca macOS'ta kullanılabilir, ancak bunları diğer OS'lere genişletmeyi planlıyoruz.

    İkinci bir Gateway'i yalnızca **katı izolasyon** veya tamamen ayrı iki bot gerektiğinde kurun.

    Dokümanlar: [Node'lar](/tr/nodes), [Node'lar CLI](/tr/cli/nodes), [Birden fazla gateway](/tr/gateway/multiple-gateways).

  </Accordion>
</AccordionGroup>

## Env değişkenleri ve .env yükleme

<AccordionGroup>
  <Accordion title="OpenClaw ortam değişkenlerini nasıl yükler?">
    OpenClaw env değişkenlerini üst süreçten (shell, launchd/systemd, CI vb.) okur ve ayrıca şunları yükler:

    - geçerli çalışma dizininden `.env`
    - `~/.openclaw/.env` konumundan global fallback `.env` (diğer adıyla `$OPENCLAW_STATE_DIR/.env`)

    Hiçbir `.env` dosyası mevcut env değişkenlerini override etmez.

    Config içinde inline env değişkenleri de tanımlayabilirsiniz (yalnızca process env içinde eksikse uygulanır):

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

  <Accordion title="Gateway'i servis üzerinden başlattım ve env değişkenlerim kayboldu. Şimdi ne yapmalıyım?">
    İki yaygın çözüm:

    1. Eksik anahtarları `~/.openclaw/.env` içine koyun; böylece servis shell env'inizi devralmasa bile alınırlar.
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

    Bu, login shell'inizi çalıştırır ve yalnızca eksik beklenen anahtarları içe aktarır (asla override etmez). Env değişkeni karşılıkları:
    `OPENCLAW_LOAD_SHELL_ENV=1`, `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`.

  </Accordion>

  <Accordion title='COPILOT_GITHUB_TOKEN ayarladım, ancak model durumu "Shell env: off." gösteriyor. Neden?'>
    `openclaw models status`, **shell env import** etkin olup olmadığını bildirir. "Shell env: off"
    env değişkenlerinizin eksik olduğu anlamına **gelmez** - yalnızca OpenClaw'ın
    login shell'inizi otomatik olarak yüklemeyeceği anlamına gelir.

    Gateway bir servis (launchd/systemd) olarak çalışıyorsa shell
    environment'ınızı devralmaz. Şunlardan birini yaparak düzeltin:

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

    Copilot token'ları `COPILOT_GITHUB_TOKEN` değerinden okunur (ayrıca `GH_TOKEN` / `GITHUB_TOKEN`).
    Bkz. [/concepts/model-providers](/tr/concepts/model-providers) ve [/environment](/tr/help/environment).

  </Accordion>
</AccordionGroup>

## Oturumlar ve birden fazla sohbet

<AccordionGroup>
  <Accordion title="Yeni bir konuşmayı nasıl başlatırım?">
    Bağımsız bir mesaj olarak `/new` veya `/reset` gönderin. Bkz. [Oturum yönetimi](/tr/concepts/session).
  </Accordion>

  <Accordion title="/new göndermesem oturumlar otomatik olarak sıfırlanır mı?">
    Oturumlar `session.idleMinutes` sonrasında sona erebilir, ancak bu **varsayılan olarak devre dışıdır** (varsayılan **0**).
    Boşta kalma süresi sonunu etkinleştirmek için pozitif bir değere ayarlayın. Etkin olduğunda,
    boşta kalma süresinden sonraki **sonraki** mesaj, o sohbet anahtarı için yeni bir session id başlatır.
    Bu transcript'leri silmez - yalnızca yeni bir oturum başlatır.

    ```json5
    {
      session: {
        idleMinutes: 240,
      },
    }
    ```

  </Accordion>

  <Accordion title="OpenClaw instance'larından oluşan bir ekip kurmanın yolu var mı (bir CEO ve çok sayıda agent)?">
    Evet, **multi-agent routing** ve **sub-agents** üzerinden. Kendi workspace'leri ve modelleri olan bir coordinator
    agent ve birkaç worker agent oluşturabilirsiniz.

    Bununla birlikte, bunu en iyi **eğlenceli bir deney** olarak görmek gerekir. Token açısından ağırdır ve çoğu zaman
    ayrı oturumlarla tek bot kullanmaktan daha az verimlidir. Öngördüğümüz tipik model, konuştuğunuz tek bir bottur
    ve paralel çalışma için farklı oturumlar kullanılır. Bu bot gerektiğinde sub-agent'lar da oluşturabilir.

    Dokümanlar: [Multi-agent routing](/tr/concepts/multi-agent), [Sub-agents](/tr/tools/subagents), [Agents CLI](/tr/cli/agents).

  </Accordion>

  <Accordion title="Bağlam neden görevin ortasında kırpıldı? Bunu nasıl önlerim?">
    Oturum bağlamı model penceresiyle sınırlıdır. Uzun sohbetler, büyük araç çıktıları veya çok sayıda
    dosya compaction ya da kırpmayı tetikleyebilir.

    Yardımcı olanlar:

    - Bottan mevcut durumu özetlemesini ve bir dosyaya yazmasını isteyin.
    - Uzun görevlerden önce `/compact`, konu değiştirirken `/new` kullanın.
    - Önemli bağlamı workspace'te tutun ve bottan geri okumasını isteyin.
    - Uzun veya paralel işler için sub-agent'lar kullanın; böylece ana sohbet daha küçük kalır.
    - Bu sık oluyorsa daha büyük context window'a sahip bir model seçin.

  </Accordion>

  <Accordion title="OpenClaw'ı kurulu tutup tamamen nasıl sıfırlarım?">
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

    - Onboarding, mevcut config görürse **Reset** de sunar. Bkz. [Onboarding (CLI)](/tr/start/wizard).
    - Profiller kullandıysanız (`--profile` / `OPENCLAW_PROFILE`), her state dir'i sıfırlayın (varsayılanlar `~/.openclaw-<profile>`).
    - Dev reset: `openclaw gateway --dev --reset` (yalnızca dev; dev config + credentials + sessions + workspace'i siler).

  </Accordion>

  <Accordion title='"context too large" hataları alıyorum - nasıl sıfırlarım veya compact yaparım?'>
    Şunlardan birini kullanın:

    - **Compact** (konuşmayı korur ancak eski turn'leri özetler):

      ```
      /compact
      ```

      veya özeti yönlendirmek için `/compact <instructions>`.

    - **Reset** (aynı sohbet anahtarı için yeni session ID):

      ```
      /new
      /reset
      ```

    Devam ederse:

    - Eski araç çıktısını kırpmak için **session pruning** (`agents.defaults.contextPruning`) etkinleştirin veya ayarlayın.
    - Daha büyük context window'a sahip bir model kullanın.

    Dokümanlar: [Compaction](/tr/concepts/compaction), [Session pruning](/tr/concepts/session-pruning), [Oturum yönetimi](/tr/concepts/session).

  </Accordion>

  <Accordion title='"LLM request rejected: messages.content.tool_use.input field required" neden görüyorum?'>
    Bu bir provider doğrulama hatasıdır: model, gerekli `input` olmadan bir `tool_use` bloğu üretmiştir.
    Genellikle oturum geçmişinin eski veya bozulmuş olduğu anlamına gelir (çoğunlukla uzun thread'lerden
    veya bir araç/schema değişikliğinden sonra).

    Düzeltme: `/new` ile yeni bir oturum başlatın (bağımsız mesaj).

  </Accordion>

  <Accordion title="Neden her 30 dakikada bir heartbeat mesajları alıyorum?">
    Heartbeat'ler varsayılan olarak her **30m** çalışır (OAuth auth kullanıldığında **1h**). Ayarlayın veya devre dışı bırakın:

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
    Dosya eksikse heartbeat yine çalışır ve model ne yapacağına karar verir.

    Agent başına override'lar `agents.list[].heartbeat` kullanır. Dokümanlar: [Heartbeat](/tr/gateway/heartbeat).

  </Accordion>

  <Accordion title='Bir WhatsApp grubuna "bot account" eklemem gerekir mi?'>
    Hayır. OpenClaw **kendi hesabınızda** çalışır, bu yüzden gruptaysanız OpenClaw onu görebilir.
    Varsayılan olarak, göndericilere izin verene kadar grup yanıtları engellenir (`groupPolicy: "allowlist"`).

    Yalnızca **sizin** grup yanıtlarını tetikleyebilmesini istiyorsanız:

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
    Seçenek 1 (en hızlısı): log'ları takip edin ve grupta bir test mesajı gönderin:

    ```bash
    openclaw logs --follow --json
    ```

    `@g.us` ile biten `chatId` (veya `from`) değerini arayın, örneğin:
    `1234567890-1234567890@g.us`.

    Seçenek 2 (zaten yapılandırılmış/allowlist'e alınmışsa): grupları config'ten listeleyin:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    Dokümanlar: [WhatsApp](/tr/channels/whatsapp), [Directory](/tr/cli/directory), [Logs](/tr/cli/logs).

  </Accordion>

  <Accordion title="OpenClaw bir grupta neden yanıt vermiyor?">
    İki yaygın neden:

    - Mention gating açık (varsayılan). Botu @mention etmelisiniz (veya `mentionPatterns` ile eşleşmelisiniz).
    - `channels.whatsapp.groups` yapılandırdınız ancak `"*"` eklemediniz ve grup allowlist'te değil.

    Bkz. [Gruplar](/tr/channels/groups) ve [Grup mesajları](/tr/channels/group-messages).

  </Accordion>

  <Accordion title="Gruplar/thread'ler DM'lerle bağlam paylaşır mı?">
    Doğrudan sohbetler varsayılan olarak ana oturuma katlanır. Grupların/kanalların kendi oturum anahtarları vardır; Telegram topics / Discord threads ise ayrı oturumlardır. Bkz. [Gruplar](/tr/channels/groups) ve [Grup mesajları](/tr/channels/group-messages).
  </Accordion>

  <Accordion title="Kaç çalışma alanı ve aracı oluşturabilirim?">
    Katı sınırlar yok. Onlarcası (hatta yüzlercesi) sorun değildir, ancak şunlara dikkat edin:

    - **Disk büyümesi:** oturumlar + transkriptler `~/.openclaw/agents/<agentId>/sessions/` altında bulunur.
    - **Token maliyeti:** daha fazla aracı, daha fazla eşzamanlı model kullanımı demektir.
    - **Operasyon yükü:** aracı başına auth profilleri, çalışma alanları ve kanal yönlendirmesi.

    İpuçları:

    - Aracı başına bir **aktif** çalışma alanı tutun (`agents.defaults.workspace`).
    - Disk büyürse eski oturumları temizleyin (JSONL veya mağaza girdilerini silin).
    - Dağınık çalışma alanlarını ve profil uyuşmazlıklarını bulmak için `openclaw doctor` kullanın.

  </Accordion>

  <Accordion title="Aynı anda birden çok bot veya sohbet çalıştırabilir miyim (Slack) ve bunu nasıl kurmalıyım?">
    Evet. Birden çok yalıtılmış aracıyı çalıştırmak ve gelen iletileri
    kanal/hesap/eşe göre yönlendirmek için **Çok Aracılı Yönlendirme** kullanın. Slack bir kanal olarak desteklenir ve belirli aracılara bağlanabilir.

    Tarayıcı erişimi güçlüdür ancak "bir insanın yapabildiği her şeyi yapabilir" anlamına gelmez; bot karşıtı önlemler, CAPTCHA'lar ve MFA
    otomasyonu yine de engelleyebilir. En güvenilir tarayıcı denetimi için ana makinede yerel Chrome MCP kullanın
    veya tarayıcıyı gerçekten çalıştıran makinede CDP kullanın.

    En iyi uygulama kurulumu:

    - Her zaman açık Gateway ana makinesi (VPS/Mac mini).
    - Rol başına bir aracı (bağlamalar).
    - Bu aracılara bağlı Slack kanalları.
    - Gerektiğinde Chrome MCP veya bir node üzerinden yerel tarayıcı.

    Belgeler: [Çok Aracılı Yönlendirme](/tr/concepts/multi-agent), [Slack](/tr/channels/slack),
    [Tarayıcı](/tr/tools/browser), [Node'lar](/tr/nodes).

  </Accordion>
</AccordionGroup>

## Modeller, devralma ve auth profilleri

Model SSS'si — varsayılanlar, seçim, takma adlar, değiştirme, devralma, auth profilleri —
[Modeller SSS'sinde](/tr/help/faq-models) yer alır.

## Gateway: bağlantı noktaları, "already running" ve uzak mod

<AccordionGroup>
  <Accordion title="Gateway hangi bağlantı noktasını kullanır?">
    `gateway.port`, WebSocket + HTTP (Control UI, hook'lar vb.) için tek çoklanmış bağlantı noktasını denetler.

    Öncelik sırası:

    ```
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > default 18789
    ```

  </Accordion>

  <Accordion title='openclaw gateway status neden "Runtime: running" ama "Connectivity probe: failed" diyor?'>
    Çünkü "running", **supervisor'ın** görünümüdür (launchd/systemd/schtasks). Bağlantı yoklaması ise CLI'ın gateway WebSocket'e gerçekten bağlanmasıdır.

    `openclaw gateway status` kullanın ve şu satırlara güvenin:

    - `Probe target:` (yoklamanın gerçekten kullandığı URL)
    - `Listening:` (bağlantı noktasında gerçekten neyin bağlı olduğu)
    - `Last gateway error:` (işlem çalışıyor ama bağlantı noktası dinlemiyorsa yaygın kök neden)

  </Accordion>

  <Accordion title='openclaw gateway status neden farklı "Config (cli)" ve "Config (service)" gösteriyor?'>
    Servis başka bir config dosyasını çalıştırırken siz başka bir config dosyasını düzenliyorsunuz (sıkça bir `--profile` / `OPENCLAW_STATE_DIR` uyuşmazlığı).

    Düzeltme:

    ```bash
    openclaw gateway install --force
    ```

    Bunu servisin kullanmasını istediğiniz aynı `--profile` / ortamdan çalıştırın.

  </Accordion>

  <Accordion title='"another gateway instance is already listening" ne anlama gelir?'>
    OpenClaw, başlangıçta WebSocket dinleyicisini hemen bağlayarak bir çalışma zamanı kilidi uygular (varsayılan `ws://127.0.0.1:18789`). Bağlama `EADDRINUSE` ile başarısız olursa, başka bir örneğin zaten dinlediğini belirten `GatewayLockError` fırlatır.

    Düzeltme: diğer örneği durdurun, bağlantı noktasını boşaltın veya `openclaw gateway --port <port>` ile çalıştırın.

  </Accordion>

  <Accordion title="OpenClaw'u uzak modda nasıl çalıştırırım (istemci başka yerdeki bir Gateway'e bağlanır)?">
    `gateway.mode: "remote"` ayarlayın ve isteğe bağlı olarak paylaşılan gizli uzak kimlik bilgileriyle birlikte uzak bir WebSocket URL'sine yönlendirin:

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

    - `openclaw gateway` yalnızca `gateway.mode` `local` olduğunda (veya override bayrağını geçerseniz) başlar.
    - macOS uygulaması config dosyasını izler ve bu değerler değiştiğinde modları canlı olarak değiştirir.
    - `gateway.remote.token` / `.password` yalnızca istemci tarafı uzak kimlik bilgileridir; tek başlarına yerel gateway auth'u etkinleştirmezler.

  </Accordion>

  <Accordion title='Control UI "unauthorized" diyor (veya yeniden bağlanıp duruyor). Şimdi ne yapmalıyım?'>
    Gateway auth yolunuz ile UI'ın auth yöntemi eşleşmiyor.

    Gerçekler (koddan):

    - Control UI, token'ı mevcut tarayıcı sekmesi oturumu ve seçili gateway URL'si için `sessionStorage` içinde tutar; böylece aynı sekme yenilemeleri, uzun ömürlü localStorage token kalıcılığını geri getirmeden çalışmaya devam eder.
    - `AUTH_TOKEN_MISMATCH` durumunda, trusted istemciler gateway yeniden deneme ipuçları döndürdüğünde (`canRetryWithDeviceToken=true`, `recommendedNextStep=retry_with_device_token`) önbelleğe alınmış bir cihaz token'ıyla sınırlı bir yeniden deneme deneyebilir.
    - Bu önbelleğe alınmış token yeniden denemesi artık cihaz token'ıyla birlikte saklanan önbelleğe alınmış onaylı kapsamları yeniden kullanır. Açık `deviceToken` / açık `scopes` çağıranlar, önbelleğe alınmış kapsamları devralmak yerine yine kendi istedikleri kapsam kümesini korur.
    - Bu yeniden deneme yolunun dışında, bağlantı auth önceliği önce açık paylaşılan token/parola, sonra açık `deviceToken`, sonra saklanan cihaz token'ı, sonra bootstrap token'dır.
    - Bootstrap token kapsam denetimleri rol öneklidir. Yerleşik bootstrap operatör izin listesi yalnızca operatör isteklerini karşılar; node veya diğer operatör olmayan rollerin yine kendi rol önekleri altında kapsamlara ihtiyacı vardır.

    Düzeltme:

    - En hızlısı: `openclaw dashboard` (dashboard URL'sini yazdırır + kopyalar, açmayı dener; headless ise SSH ipucu gösterir).
    - Henüz bir token'ınız yoksa: `openclaw doctor --generate-gateway-token`.
    - Uzaksa, önce tünel açın: `ssh -N -L 18789:127.0.0.1:18789 user@host` ardından `http://127.0.0.1:18789/` açın.
    - Paylaşılan gizli mod: `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` veya `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` ayarlayın, ardından eşleşen gizliyi Control UI ayarlarına yapıştırın.
    - Tailscale Serve modu: `gateway.auth.allowTailscale` etkin olduğundan ve Tailscale kimlik başlıklarını atlayan ham bir loopback/tailnet URL'si değil, Serve URL'sini açtığınızdan emin olun.
    - Trusted-proxy modu: ham gateway URL'siyle değil, yapılandırılmış kimlik farkındalığına sahip proxy üzerinden geldiğinizden emin olun. Aynı ana makine loopback proxy'leri için ayrıca `gateway.auth.trustedProxy.allowLoopback = true` gerekir.
    - Tek yeniden denemeden sonra uyuşmazlık sürerse, eşlenmiş cihaz token'ını döndürün/yeniden onaylayın:
      - `openclaw devices list`
      - `openclaw devices rotate --device <id> --role operator`
    - Bu döndürme çağrısı reddedildiğini söylüyorsa iki şeyi kontrol edin:
      - eşlenmiş cihaz oturumları, ayrıca `operator.admin` yoksa yalnızca **kendi** cihazlarını döndürebilir
      - açık `--scope` değerleri, çağıranın mevcut operatör kapsamlarını aşamaz
    - Hâlâ takıldınız mı? `openclaw status --all` çalıştırın ve [Sorun Giderme](/tr/gateway/troubleshooting) adımlarını izleyin. Auth ayrıntıları için [Dashboard](/tr/web/dashboard) bölümüne bakın.

  </Accordion>

  <Accordion title="gateway.bind tailnet ayarladım ama bağlanamıyor ve hiçbir şey dinlemiyor">
    `tailnet` bağlaması, ağ arayüzlerinizden bir Tailscale IP'si seçer (100.64.0.0/10). Makine Tailscale üzerinde değilse (veya arayüz kapalıysa), bağlanacak hiçbir şey yoktur.

    Düzeltme:

    - O ana makinede Tailscale'i başlatın (böylece 100.x adresi olur), veya
    - `gateway.bind: "loopback"` / `"lan"` değerine geçin.

    Not: `tailnet` açıktır. `auto` loopback'i tercih eder; yalnızca tailnet'e bağlanmak istediğinizde `gateway.bind: "tailnet"` kullanın.

  </Accordion>

  <Accordion title="Aynı ana makinede birden çok Gateway çalıştırabilir miyim?">
    Genellikle hayır; bir Gateway birden çok mesajlaşma kanalını ve aracıyı çalıştırabilir. Birden çok Gateway'i yalnızca yedeklilik (örn. kurtarma botu) veya katı yalıtım gerektiğinde kullanın.

    Evet, ancak yalıtmanız gerekir:

    - `OPENCLAW_CONFIG_PATH` (örnek başına config)
    - `OPENCLAW_STATE_DIR` (örnek başına durum)
    - `agents.defaults.workspace` (çalışma alanı yalıtımı)
    - `gateway.port` (benzersiz bağlantı noktaları)

    Hızlı kurulum (önerilir):

    - Her örnek için `openclaw --profile <name> ...` kullanın (`~/.openclaw-<name>` otomatik oluşturulur).
    - Her profil config'inde benzersiz bir `gateway.port` ayarlayın (veya manuel çalıştırmalar için `--port` geçin).
    - Profil başına servis kurun: `openclaw --profile <name> gateway install`.

    Profiller ayrıca servis adlarına son ek ekler (`ai.openclaw.<profile>`; eski `com.openclaw.*`, `openclaw-gateway-<profile>.service`, `OpenClaw Gateway (<profile>)`).
    Tam kılavuz: [Birden çok gateway](/tr/gateway/multiple-gateways).

  </Accordion>

  <Accordion title='"invalid handshake" / kod 1008 ne anlama gelir?'>
    Gateway bir **WebSocket sunucusudur** ve ilk iletinin
    bir `connect` çerçevesi olmasını bekler. Başka bir şey alırsa, bağlantıyı
    **kod 1008** (policy violation) ile kapatır.

    Yaygın nedenler:

    - Bir WS istemcisi yerine tarayıcıda **HTTP** URL'sini açtınız (`http://...`).
    - Yanlış bağlantı noktası veya yolu kullandınız.
    - Bir proxy veya tünel auth başlıklarını sildi ya da Gateway olmayan bir istek gönderdi.

    Hızlı düzeltmeler:

    1. WS URL'sini kullanın: `ws://<host>:18789` (veya HTTPS ise `wss://...`).
    2. WS bağlantı noktasını normal bir tarayıcı sekmesinde açmayın.
    3. Auth açıksa, token/parolayı `connect` çerçevesine dahil edin.

    CLI veya TUI kullanıyorsanız, URL şöyle görünmelidir:

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

    `logging.file` ile kararlı bir yol ayarlayabilirsiniz. Dosya günlük seviyesi `logging.level` ile denetlenir. Konsol ayrıntı düzeyi `--verbose` ve `logging.consoleLevel` ile denetlenir.

    En hızlı günlük takibi:

    ```bash
    openclaw logs --follow
    ```

    Servis/supervisor günlükleri (gateway launchd/systemd üzerinden çalıştığında):

    - macOS: `$OPENCLAW_STATE_DIR/logs/gateway.log` ve `gateway.err.log` (varsayılan: `~/.openclaw/logs/...`; profiller `~/.openclaw-<profile>/logs/...` kullanır)
    - Linux: `journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`
    - Windows: `schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`

    Daha fazlası için [Sorun Giderme](/tr/gateway/troubleshooting) bölümüne bakın.

  </Accordion>

  <Accordion title="Gateway servisini nasıl başlatır/durdurur/yeniden başlatırım?">
    Gateway yardımcılarını kullanın:

    ```bash
    openclaw gateway status
    openclaw gateway restart
    ```

    Gateway'i manuel çalıştırıyorsanız, `openclaw gateway --force` bağlantı noktasını geri alabilir. [Gateway](/tr/gateway) bölümüne bakın.

  </Accordion>

  <Accordion title="Windows'ta terminalimi kapattım; OpenClaw'u nasıl yeniden başlatırım?">
    **İki Windows kurulum modu** vardır:

    **1) WSL2 (önerilir):** Gateway Linux içinde çalışır.

    PowerShell'i açın, WSL'ye girin, ardından yeniden başlatın:

    ```powershell
    wsl
    openclaw gateway status
    openclaw gateway restart
    ```

    Servisi hiç kurmadıysanız, ön planda başlatın:

    ```bash
    openclaw gateway run
    ```

    **2) Yerel Windows (önerilmez):** Gateway doğrudan Windows'ta çalışır.

    PowerShell'i açın ve çalıştırın:

    ```powershell
    openclaw gateway status
    openclaw gateway restart
    ```

    Manuel çalıştırıyorsanız (servis yoksa), şunu kullanın:

    ```powershell
    openclaw gateway run
    ```

    Belgeler: [Windows (WSL2)](/tr/platforms/windows), [Gateway servis çalışma kitabı](/tr/gateway).

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

    - Model kimlik doğrulaması **gateway host** üzerinde yüklenmemiş (`models status` kontrol edin).
    - Kanal eşleştirme/izin listesi yanıtları engelliyor (kanal yapılandırmasını + günlükleri kontrol edin).
    - WebChat/Dashboard doğru token olmadan açık.

    Uzaktaysanız tunnel/Tailscale bağlantısının açık olduğunu ve
    Gateway WebSocket'in erişilebilir olduğunu doğrulayın.

    Dokümanlar: [Kanallar](/tr/channels), [Sorun giderme](/tr/gateway/troubleshooting), [Uzaktan erişim](/tr/gateway/remote).

  </Accordion>

  <Accordion title='"Gateway bağlantısı kesildi: neden yok" - şimdi ne?'>
    Bu genellikle UI'ın WebSocket bağlantısını kaybettiği anlamına gelir. Şunları kontrol edin:

    1. Gateway çalışıyor mu? `openclaw gateway status`
    2. Gateway sağlıklı mı? `openclaw status`
    3. UI doğru token'a sahip mi? `openclaw dashboard`
    4. Uzaksa tunnel/Tailscale bağlantısı açık mı?

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

    - `BOT_COMMANDS_TOO_MUCH`: Telegram menüsünde çok fazla giriş var. OpenClaw zaten Telegram sınırına göre kırpar ve daha az komutla yeniden dener, ancak bazı menü girişlerinin yine de kaldırılması gerekir. Plugin/skill/özel komutları azaltın veya menüye ihtiyacınız yoksa `channels.telegram.commands.native` devre dışı bırakın.
    - `TypeError: fetch failed`, `Network request for 'setMyCommands' failed!` veya benzer ağ hataları: Bir VPS üzerindeyseniz veya proxy arkasındaysanız, dışarıya HTTPS'e izin verildiğini ve DNS'in `api.telegram.org` için çalıştığını doğrulayın.

    Gateway uzaktaysa, Gateway host üzerindeki günlüklere baktığınızdan emin olun.

    Dokümanlar: [Telegram](/tr/channels/telegram), [Kanal sorun giderme](/tr/channels/troubleshooting).

  </Accordion>

  <Accordion title="TUI çıktı göstermiyor. Neyi kontrol etmeliyim?">
    Önce Gateway'e erişilebildiğini ve agent'ın çalışabildiğini doğrulayın:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    TUI içinde geçerli durumu görmek için `/status` kullanın. Bir sohbet
    kanalında yanıt bekliyorsanız teslimin etkin olduğundan emin olun (`/deliver on`).

    Dokümanlar: [TUI](/tr/web/tui), [Slash komutları](/tr/tools/slash-commands).

  </Accordion>

  <Accordion title="Gateway'i tamamen nasıl durdurup yeniden başlatırım?">
    Hizmeti yüklediyseniz:

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    Bu, **gözetimli hizmeti** (macOS'ta launchd, Linux'ta systemd) durdurur/başlatır.
    Bunu Gateway arka planda daemon olarak çalıştığında kullanın.

    Ön planda çalıştırıyorsanız Ctrl-C ile durdurun, ardından:

    ```bash
    openclaw gateway run
    ```

    Dokümanlar: [Gateway hizmeti runbook'u](/tr/gateway).

  </Accordion>

  <Accordion title="Beş yaşındaymışım gibi anlat: openclaw gateway restart ile openclaw gateway">
    - `openclaw gateway restart`: **arka plan hizmetini** (launchd/systemd) yeniden başlatır.
    - `openclaw gateway`: bu terminal oturumu için gateway'i **ön planda** çalıştırır.

    Hizmeti yüklediyseniz gateway komutlarını kullanın. Tek seferlik, ön planda bir
    çalışma istediğinizde `openclaw gateway` kullanın.

  </Accordion>

  <Accordion title="Bir şey başarısız olduğunda daha fazla ayrıntı almanın en hızlı yolu">
    Daha fazla konsol ayrıntısı almak için Gateway'i `--verbose` ile başlatın. Ardından kanal kimlik doğrulaması, model yönlendirme ve RPC hataları için günlük dosyasını inceleyin.
  </Accordion>
</AccordionGroup>

## Medya ve ekler

<AccordionGroup>
  <Accordion title="Skill'im bir görsel/PDF oluşturdu, ancak hiçbir şey gönderilmedi">
    Agent'tan giden ekler kendi satırında bir `MEDIA:<path-or-url>` satırı içermelidir. Bkz. [OpenClaw assistant kurulumu](/tr/start/openclaw) ve [Agent gönderimi](/tr/tools/agent-send).

    CLI ile gönderme:

    ```bash
    openclaw message send --target +15555550123 --message "Here you go" --media /path/to/file.png
    ```

    Ayrıca şunları kontrol edin:

    - Hedef kanal giden medyayı destekliyor ve izin listeleri tarafından engellenmiyor.
    - Dosya provider'ın boyut sınırları içindedir (görseller en fazla 2048px'e yeniden boyutlandırılır).
    - `tools.fs.workspaceOnly=true`, yerel yol gönderimlerini workspace, temp/media-store ve sandbox tarafından doğrulanmış dosyalarla sınırlı tutar.
    - `tools.fs.workspaceOnly=false`, `MEDIA:` ile agent'ın zaten okuyabildiği host-local dosyaların gönderilmesine izin verir, ancak yalnızca medya ve güvenli belge türleri için (görseller, ses, video, PDF ve Office belgeleri). Düz metin ve gizli bilgiye benzer dosyalar yine de engellenir.

    Bkz. [Görseller](/tr/nodes/images).

  </Accordion>
</AccordionGroup>

## Güvenlik ve erişim denetimi

<AccordionGroup>
  <Accordion title="OpenClaw'ı gelen DM'lere açmak güvenli mi?">
    Gelen DM'leri güvenilmeyen girdi olarak ele alın. Varsayılanlar riski azaltmak için tasarlanmıştır:

    - DM destekli kanallarda varsayılan davranış **eşleştirme**dir:
      - Bilinmeyen gönderenler bir eşleştirme kodu alır; bot mesajlarını işlemez.
      - Şununla onaylayın: `openclaw pairing approve --channel <channel> [--account <id>] <code>`
      - Bekleyen istekler **kanal başına 3** ile sınırlıdır; kod gelmediyse `openclaw pairing list --channel <channel> [--account <id>]` kontrol edin.
    - DM'leri herkese açık açmak açıkça etkinleştirme gerektirir (`dmPolicy: "open"` ve allowlist `"*"`).

    Riskli DM politikalarını ortaya çıkarmak için `openclaw doctor` çalıştırın.

  </Accordion>

  <Accordion title="Prompt injection yalnızca herkese açık botlar için mi endişe kaynağıdır?">
    Hayır. Prompt injection yalnızca bota kimin DM gönderebildiğiyle değil, **güvenilmeyen içerikle** ilgilidir.
    Assistant'ınız harici içerik okuyorsa (web araması/getirme, tarayıcı sayfaları, e-postalar,
    dokümanlar, ekler, yapıştırılan günlükler), bu içerik modeli ele geçirmeye çalışan
    talimatlar içerebilir. Bu, **tek gönderen siz olsanız bile** gerçekleşebilir.

    En büyük risk araçlar etkin olduğundadır: Model, bağlamı dışarı sızdırmak veya sizin adınıza
    araç çağırmak için kandırılabilir. Etki alanını şunlarla azaltın:

    - güvenilmeyen içeriği özetlemek için salt okunur veya araçları devre dışı bırakılmış bir "okuyucu" agent kullanmak
    - araçları etkin agent'lar için `web_search` / `web_fetch` / `browser` kapalı tutmak
    - kodu çözülmüş dosya/belge metnini de güvenilmeyen saymak: OpenResponses
      `input_file` ve medya eki çıkarımı, ham dosya metnini geçirmek yerine çıkarılan metni
      açık harici içerik sınır işaretçileriyle sarar
    - sandbox kullanımı ve sıkı araç izin listeleri

    Ayrıntılar: [Güvenlik](/tr/gateway/security).

  </Accordion>

  <Accordion title="Botumun kendi e-postası, GitHub hesabı veya telefon numarası olmalı mı?">
    Evet, çoğu kurulum için. Botu ayrı hesaplar ve telefon numaralarıyla izole etmek,
    bir şey ters giderse etki alanını azaltır. Bu ayrıca kişisel hesaplarınızı etkilemeden
    kimlik bilgilerini döndürmeyi veya erişimi iptal etmeyi kolaylaştırır.

    Küçük başlayın. Yalnızca gerçekten ihtiyacınız olan araçlara ve hesaplara erişim verin ve gerekirse
    daha sonra genişletin.

    Dokümanlar: [Güvenlik](/tr/gateway/security), [Eşleştirme](/tr/channels/pairing).

  </Accordion>

  <Accordion title="Ona kısa mesajlarım üzerinde özerklik verebilir miyim ve bu güvenli mi?">
    Kişisel mesajlarınız üzerinde tam özerklik **önermiyoruz**. En güvenli kalıp şudur:

    - DM'leri **eşleştirme modunda** veya sıkı bir izin listesinde tutun.
    - Sizin adınıza mesaj göndermesini istiyorsanız **ayrı bir numara veya hesap** kullanın.
    - Taslak hazırlamasına izin verin, ardından **göndermeden önce onaylayın**.

    Denemek istiyorsanız bunu ayrılmış bir hesapta yapın ve izole tutun. Bkz.
    [Güvenlik](/tr/gateway/security).

  </Accordion>

  <Accordion title="Kişisel assistant görevleri için daha ucuz modeller kullanabilir miyim?">
    Evet, agent yalnızca sohbet amaçlıysa ve girdi güvenilirse. Daha küçük katmanlar
    talimat ele geçirmeye daha yatkındır, bu yüzden araçları etkin agent'larda
    veya güvenilmeyen içerik okurken bunlardan kaçının. Daha küçük bir model kullanmanız gerekiyorsa
    araçları kilitleyin ve bir sandbox içinde çalıştırın. Bkz. [Güvenlik](/tr/gateway/security).
  </Accordion>

  <Accordion title="Telegram'da /start çalıştırdım ancak eşleştirme kodu almadım">
    Eşleştirme kodları **yalnızca** bilinmeyen bir gönderen bota mesaj attığında ve
    `dmPolicy: "pairing"` etkin olduğunda gönderilir. `/start` tek başına kod oluşturmaz.

    Bekleyen istekleri kontrol edin:

    ```bash
    openclaw pairing list telegram
    ```

    Hemen erişim istiyorsanız gönderen id'nizi izin listesine ekleyin veya o hesap için `dmPolicy: "open"`
    ayarlayın.

  </Accordion>

  <Accordion title="WhatsApp: kişilere mesaj gönderir mi? Eşleştirme nasıl çalışır?">
    Hayır. Varsayılan WhatsApp DM politikası **eşleştirme**dir. Bilinmeyen gönderenler yalnızca bir eşleştirme kodu alır ve mesajları **işlenmez**. OpenClaw yalnızca aldığı sohbetlere veya sizin tetiklediğiniz açık gönderimlere yanıt verir.

    Eşleştirmeyi şununla onaylayın:

    ```bash
    openclaw pairing approve whatsapp <code>
    ```

    Bekleyen istekleri listeleyin:

    ```bash
    openclaw pairing list whatsapp
    ```

    Sihirbaz telefon numarası istemi: kendi DM'lerinize izin verilmesi için **allowlist/owner** ayarlamada kullanılır. Otomatik gönderim için kullanılmaz. Kişisel WhatsApp numaranızda çalıştırıyorsanız bu numarayı kullanın ve `channels.whatsapp.selfChatMode` etkinleştirin.

  </Accordion>
</AccordionGroup>

## Sohbet komutları, görevleri iptal etme ve "durmuyor"

<AccordionGroup>
  <Accordion title="Dahili sistem mesajlarının sohbette görünmesini nasıl durdururum?">
    Çoğu dahili veya araç mesajı yalnızca o oturum için **verbose**, **trace** veya **reasoning** etkin olduğunda
    görünür.

    Bunu gördüğünüz sohbette düzeltin:

    ```
    /verbose off
    /trace off
    /reasoning off
    ```

    Hâlâ gürültülüyse Control UI içindeki oturum ayarlarını kontrol edin ve verbose değerini
    **inherit** olarak ayarlayın. Ayrıca yapılandırmada `verboseDefault` değeri `on` olarak ayarlanmış
    bir bot profili kullanmadığınızdan emin olun.

    Dokümanlar: [Düşünme ve verbose](/tr/tools/thinking), [Güvenlik](/tr/gateway/security/index#reasoning-and-verbose-output-in-groups).

  </Accordion>

  <Accordion title="Çalışan bir görevi nasıl durdurur/iptal ederim?">
    Bunlardan herhangi birini **bağımsız bir mesaj olarak** gönderin (slash yok):

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

    Slash komutları genel bakışı: bkz. [Slash komutları](/tr/tools/slash-commands).

    Çoğu komut, `/` ile başlayan **bağımsız** bir mesaj olarak gönderilmelidir, ancak birkaç kısayol (`/status` gibi) izin listesindeki gönderenler için satır içinde de çalışır.

  </Accordion>

  <Accordion title='Telegram'dan Discord mesajı nasıl gönderirim? ("Cross-context messaging denied")'>
    OpenClaw varsayılan olarak **provider'lar arası** mesajlaşmayı engeller. Bir araç çağrısı
    Telegram'a bağlıysa, açıkça izin vermediğiniz sürece Discord'a göndermez.

    Agent için provider'lar arası mesajlaşmayı etkinleştirin:

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
    Kuyruk modu, yeni mesajların devam eden bir çalışmayla nasıl etkileşime girdiğini denetler. Modları değiştirmek için `/queue` kullanın:

    - `steer` - geçerli çalışmadaki bir sonraki model sınırı için bekleyen tüm yönlendirmeleri kuyruğa al
    - `queue` - eski tek seferde bir yönlendirme
    - `followup` - mesajları tek tek çalıştır
    - `collect` - mesajları toplu hale getir ve bir kez yanıtla
    - `steer-backlog` - şimdi yönlendir, ardından birikmiş kuyruğu işle
    - `interrupt` - geçerli çalışmayı iptal et ve baştan başla

    Varsayılan mod `steer` modudur. Takip modları için `debounce:0.5s cap:25 drop:summarize` gibi seçenekler ekleyebilirsiniz. Bkz. [Komut kuyruğu](/tr/concepts/queue) ve [Yönlendirme kuyruğu](/tr/concepts/queue-steering).

  </Accordion>
</AccordionGroup>

## Çeşitli

<AccordionGroup>
  <Accordion title='API anahtarıyla Anthropic için varsayılan model nedir?'>
    OpenClaw'da kimlik bilgileri ve model seçimi ayrıdır. `ANTHROPIC_API_KEY` ayarlamak (veya kimlik doğrulama profillerinde bir Anthropic API anahtarı saklamak) kimlik doğrulamayı etkinleştirir, ancak gerçek varsayılan model `agents.defaults.model.primary` içinde yapılandırdığınız modeldir (örneğin, `anthropic/claude-sonnet-4-6` veya `anthropic/claude-opus-4-6`). `No credentials found for profile "anthropic:default"` görürseniz, bu Gateway'in çalışan ajan için beklenen `auth-profiles.json` içinde Anthropic kimlik bilgilerini bulamadığı anlamına gelir.
  </Accordion>
</AccordionGroup>

---

Hâlâ takıldınız mı? [Discord](https://discord.com/invite/clawd) üzerinden sorun veya bir [GitHub tartışması](https://github.com/openclaw/openclaw/discussions) açın.

## İlgili

- [İlk çalıştırma SSS](/tr/help/faq-first-run) — kurulum, başlangıç, kimlik doğrulama, abonelikler, erken hatalar
- [Modeller SSS](/tr/help/faq-models) — model seçimi, yük devretme, kimlik doğrulama profilleri
- [Sorun giderme](/tr/help/troubleshooting) — belirti odaklı triyaj
