---
read_when:
    - Kurulum, yükleme, ilk kullanım veya çalışma zamanı desteğiyle ilgili yaygın soruları yanıtlama
    - Daha derin hata ayıklamadan önce kullanıcıların bildirdiği sorunları triyaj etme
summary: OpenClaw kurulumu, yapılandırması ve kullanımı hakkında sık sorulan sorular
title: SSS
x-i18n:
    generated_at: "2026-05-03T21:34:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 372220d62f872db1427b2836662bc8cc74e07d2cdfb651c105d3df25131855dd
    source_path: help/faq.md
    workflow: 16
---

Gerçek dünya kurulumları (yerel geliştirme, VPS, çoklu ajan, OAuth/API anahtarları, model yük devretmesi) için hızlı yanıtlar ve daha derin sorun giderme. Çalışma zamanı tanılamaları için [Sorun Giderme](/tr/gateway/troubleshooting) bölümüne bakın. Tam yapılandırma referansı için [Yapılandırma](/tr/gateway/configuration) bölümüne bakın.

## Bir şey bozulduysa ilk 60 saniye

1. **Hızlı durum (ilk kontrol)**

   ```bash
   openclaw status
   ```

   Hızlı yerel özet: işletim sistemi + güncelleme, gateway/servis erişilebilirliği, ajanlar/oturumlar, sağlayıcı yapılandırması + çalışma zamanı sorunları (gateway erişilebilir olduğunda).

2. **Yapıştırılabilir rapor (paylaşmak için güvenli)**

   ```bash
   openclaw status --all
   ```

   Günlük sonuyla birlikte salt okunur tanılama (belirteçler maskelenir).

3. **Daemon + port durumu**

   ```bash
   openclaw gateway status
   ```

   Supervisor çalışma zamanı ile RPC erişilebilirliğini, yoklama hedef URL'sini ve servisin muhtemelen hangi yapılandırmayı kullandığını gösterir.

4. **Derin yoklamalar**

   ```bash
   openclaw status --deep
   ```

   Desteklendiğinde kanal yoklamaları da dahil olmak üzere canlı bir gateway sağlık yoklaması çalıştırır
   (erişilebilir bir gateway gerektirir). Bkz. [Sağlık](/tr/gateway/health).

5. **En son günlüğü izle**

   ```bash
   openclaw logs --follow
   ```

   RPC kapalıysa şuna geri dönün:

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   Dosya günlükleri servis günlüklerinden ayrıdır; bkz. [Günlükleme](/tr/logging) ve [Sorun Giderme](/tr/gateway/troubleshooting).

6. **Doctor'ı çalıştır (onarımlar)**

   ```bash
   openclaw doctor
   ```

   Yapılandırmayı/durumu onarır/taşır + sağlık denetimlerini çalıştırır. Bkz. [Doctor](/tr/gateway/doctor).

7. **Gateway anlık görüntüsü**

   ```bash
   openclaw health --json
   openclaw health --verbose   # hatalarda hedef URL'yi + yapılandırma yolunu gösterir
   ```

   Çalışan gateway'den tam bir anlık görüntü ister (yalnızca WS). Bkz. [Sağlık](/tr/gateway/health).

## Hızlı başlangıç ve ilk çalıştırma kurulumu

İlk çalıştırma SSS'si — kurulum, ilk kullanım, kimlik doğrulama rotaları, abonelikler, ilk hatalar —
[İlk çalıştırma SSS](/tr/help/faq-first-run) sayfasında yer alır.

## OpenClaw nedir?

<AccordionGroup>
  <Accordion title="OpenClaw tek paragrafta nedir?">
    OpenClaw, kendi cihazlarınızda çalıştırdığınız kişisel bir AI asistanıdır. Zaten kullandığınız mesajlaşma yüzeylerinde (WhatsApp, Telegram, Slack, Mattermost, Discord, Google Chat, Signal, iMessage, WebChat ve QQ Bot gibi paketli kanal Plugin'leri) yanıt verir ve desteklenen platformlarda ses + canlı Canvas da sunabilir. **Gateway** her zaman açık denetim düzlemidir; asistan ise ürünün kendisidir.
  </Accordion>

  <Accordion title="Değer önerisi">
    OpenClaw "sadece bir Claude sarmalayıcısı" değildir. Zaten kullandığınız sohbet uygulamalarından erişilebilen, **kendi donanımınızda** yetkin bir asistan çalıştırmanızı sağlayan, durum bilgili oturumlar, bellek ve araçlar sunan, iş akışlarınızın denetimini barındırılan bir SaaS'a devretmenizi gerektirmeyen **yerel öncelikli bir denetim düzlemidir**.

    Öne çıkanlar:

    - **Cihazlarınız, verileriniz:** Gateway'i istediğiniz yerde çalıştırın (Mac, Linux, VPS) ve çalışma alanını + oturum geçmişini yerel tutun.
    - **Web korumalı alanı değil, gerçek kanallar:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage/vb.,
      ayrıca desteklenen platformlarda mobil ses ve Canvas.
    - **Modelden bağımsız:** Anthropic, OpenAI, MiniMax, OpenRouter vb. kullanın; ajan başına yönlendirme
      ve yük devretme ile.
    - **Yalnızca yerel seçeneği:** İsterseniz **tüm verilerin cihazınızda kalabilmesi** için yerel modeller çalıştırın.
    - **Çoklu ajan yönlendirme:** Her biri kendi çalışma alanına ve varsayılanlarına sahip, kanal, hesap veya görev başına ayrı ajanlar.
    - **Açık kaynak ve hacklenebilir:** Tedarikçi kilidine takılmadan inceleyin, genişletin ve kendi kendinize barındırın.

    Belgeler: [Gateway](/tr/gateway), [Kanallar](/tr/channels), [Çoklu ajan](/tr/concepts/multi-agent),
    [Bellek](/tr/concepts/memory).

  </Accordion>

  <Accordion title="Yeni kurdum - önce ne yapmalıyım?">
    İyi ilk projeler:

    - Bir web sitesi oluşturun (WordPress, Shopify veya basit bir statik site).
    - Bir mobil uygulama prototipi hazırlayın (taslak, ekranlar, API planı).
    - Dosya ve klasörleri düzenleyin (temizleme, adlandırma, etiketleme).
    - Gmail'i bağlayın ve özetleri veya takipleri otomatikleştirin.

    Büyük görevleri yerine getirebilir, ancak bunları aşamalara böldüğünüzde ve
    paralel çalışma için alt ajanlar kullandığınızda en iyi şekilde çalışır.

  </Accordion>

  <Accordion title="OpenClaw için en yaygın beş günlük kullanım durumu nedir?">
    Günlük kazanımlar genellikle şöyle görünür:

    - **Kişisel brifingler:** Gelen kutusu, takvim ve önemsediğiniz haberlerin özetleri.
    - **Araştırma ve taslak hazırlama:** E-postalar veya belgeler için hızlı araştırma, özetler ve ilk taslaklar.
    - **Hatırlatıcılar ve takipler:** cron veya heartbeat odaklı uyarılar ve kontrol listeleri.
    - **Tarayıcı otomasyonu:** Form doldurma, veri toplama ve web görevlerini yineleme.
    - **Cihazlar arası koordinasyon:** Telefonunuzdan bir görev gönderin, Gateway'in bunu bir sunucuda çalıştırmasına izin verin ve sonucu sohbette geri alın.

  </Accordion>

  <Accordion title="OpenClaw bir SaaS için potansiyel müşteri oluşturma, erişim, reklamlar ve bloglar konusunda yardımcı olabilir mi?">
    **Araştırma, nitelendirme ve taslak hazırlama** için evet. Siteleri tarayabilir, kısa listeler oluşturabilir,
    potansiyel müşterileri özetleyebilir ve erişim ya da reklam metni taslakları yazabilir.

    **Erişim veya reklam çalışmaları** için insanı döngüde tutun. Spamden kaçının, yerel yasalara ve
    platform politikalarına uyun ve gönderilmeden önce her şeyi gözden geçirin. En güvenli kalıp,
    OpenClaw’ın taslak hazırlaması ve sizin onaylamanızdır.

    Dokümanlar: [Güvenlik](/tr/gateway/security).

  </Accordion>

  <Accordion title="Web geliştirme için Claude Code'a göre avantajları nelerdir?">
    OpenClaw bir **kişisel asistan** ve koordinasyon katmanıdır, IDE yerine geçmez. Bir repo içinde
    en hızlı doğrudan kodlama döngüsü için Claude Code veya Codex kullanın. Kalıcı bellek,
    cihazlar arası erişim ve araç orkestrasyonu istediğinizde OpenClaw kullanın.

    Avantajlar:

    - Oturumlar genelinde **kalıcı bellek + çalışma alanı**
    - **Çok platformlu erişim** (WhatsApp, Telegram, TUI, WebChat)
    - **Araç orkestrasyonu** (tarayıcı, dosyalar, zamanlama, kancalar)
    - **Her zaman açık Gateway** (bir VPS üzerinde çalıştırın, her yerden etkileşim kurun)
    - Yerel tarayıcı/ekran/kamera/exec için **Node’lar**

    Vitrin: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills ve otomasyon

<AccordionGroup>
  <Accordion title="Repo'yu kirli tutmadan Skills'i nasıl özelleştiririm?">
    Repo kopyasını düzenlemek yerine yönetilen geçersiz kılmaları kullanın. Değişikliklerinizi `~/.openclaw/skills/<name>/SKILL.md` içine koyun (veya `~/.openclaw/openclaw.json` içinde `skills.load.extraDirs` ile bir klasör ekleyin). Öncelik sırası `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → paketlenenler → `skills.load.extraDirs` şeklindedir; böylece yönetilen geçersiz kılmalar, git’e dokunmadan paketlenen skills üzerinde yine de öncelik kazanır. Skill’in küresel olarak kurulması, ancak yalnızca bazı ajanlara görünmesi gerekiyorsa paylaşılan kopyayı `~/.openclaw/skills` içinde tutun ve görünürlüğü `agents.defaults.skills` ile `agents.list[].skills` üzerinden denetleyin. Yalnızca upstream’e uygun düzenlemeler repo içinde yaşamalı ve PR olarak gönderilmelidir.
  </Accordion>

  <Accordion title="Skills'i özel bir klasörden yükleyebilir miyim?">
    Evet. `~/.openclaw/openclaw.json` içinde `skills.load.extraDirs` ile ek dizinler ekleyin (en düşük öncelik). Varsayılan öncelik sırası `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → paketlenenler → `skills.load.extraDirs` şeklindedir. `clawhub` varsayılan olarak `./skills` içine kurar; OpenClaw bunu sonraki oturumda `<workspace>/skills` olarak ele alır. Skill yalnızca belirli ajanlara görünmeliyse bunu `agents.defaults.skills` veya `agents.list[].skills` ile eşleştirin.
  </Accordion>

  <Accordion title="Farklı görevler için farklı modelleri nasıl kullanabilirim?">
    Bugün desteklenen kalıplar şunlardır:

    - **Cron işleri**: yalıtılmış işler, iş başına bir `model` geçersiz kılması ayarlayabilir.
    - **Alt ajanlar**: görevleri farklı varsayılan modellere sahip ayrı ajanlara yönlendirin.
    - **İsteğe bağlı değiştirme**: geçerli oturum modelini istediğiniz zaman değiştirmek için `/model` kullanın.

    Bkz. [Cron işleri](/tr/automation/cron-jobs), [Çok Ajanlı Yönlendirme](/tr/concepts/multi-agent) ve [Eğik çizgi komutları](/tr/tools/slash-commands).

  </Accordion>

  <Accordion title="Bot ağır iş yaparken donuyor. Bunu nasıl devredebilirim?">
    Uzun veya paralel görevler için **alt ajanlar** kullanın. Alt ajanlar kendi oturumlarında çalışır,
    bir özet döndürür ve ana sohbetinizin yanıt vermeye devam etmesini sağlar.

    Botunuzdan "bu görev için bir alt ajan oluşturmasını" isteyin veya `/subagents` kullanın.
    Gateway’in şu anda ne yaptığını (ve meşgul olup olmadığını) görmek için sohbette `/status` kullanın.

    Token ipucu: uzun görevler ve alt ajanların ikisi de token tüketir. Maliyet önemliyse,
    `agents.defaults.subagents.model` üzerinden alt ajanlar için daha ucuz bir model ayarlayın.

    Dokümanlar: [Alt ajanlar](/tr/tools/subagents), [Arka Plan Görevleri](/tr/automation/tasks).

  </Accordion>

  <Accordion title="Discord'da iş parçacığına bağlı alt ajan oturumları nasıl çalışır?">
    İş parçacığı bağlamalarını kullanın. Bir Discord iş parçacığını bir alt ajan veya oturum hedefiyle bağlayabilirsiniz; böylece o iş parçacığındaki takip mesajları bağlı oturumda kalır.

    Temel akış:

    - `thread: true` kullanarak `sessions_spawn` ile oluşturun (ve kalıcı takip için isteğe bağlı olarak `mode: "session"`).
    - Ya da `/focus <target>` ile elle bağlayın.
    - Bağlama durumunu incelemek için `/agents` kullanın.
    - Otomatik odak kaldırmayı denetlemek için `/session idle <duration|off>` ve `/session max-age <duration|off>` kullanın.
    - İş parçacığını ayırmak için `/unfocus` kullanın.

    Gerekli yapılandırma:

    - Küresel varsayılanlar: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
    - Discord geçersiz kılmaları: `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours`.
    - Oluşturma sırasında otomatik bağlama: `channels.discord.threadBindings.spawnSessions` varsayılan olarak `true` değerindedir; iş parçacığına bağlı oturum oluşturmayı devre dışı bırakmak için bunu `false` olarak ayarlayın.

    Dokümanlar: [Alt ajanlar](/tr/tools/subagents), [Discord](/tr/channels/discord), [Yapılandırma Referansı](/tr/gateway/configuration-reference), [Eğik çizgi komutları](/tr/tools/slash-commands).

  </Accordion>

  <Accordion title="Bir alt ajan tamamlandı, ancak tamamlama güncellemesi yanlış yere gitti veya hiç gönderilmedi. Neyi kontrol etmeliyim?">
    Önce çözümlenen istekte bulunan rotasını kontrol edin:

    - Tamamlama modundaki alt ajan teslimatı, mevcut olduğunda bağlı herhangi bir iş parçacığını veya konuşma rotasını tercih eder.
    - Tamamlama kaynağı yalnızca bir kanal taşıyorsa OpenClaw, doğrudan teslimatın yine de başarılı olabilmesi için istekte bulunan oturumun saklanan rotasına (`lastChannel` / `lastTo` / `lastAccountId`) geri döner.
    - Ne bağlı bir rota ne de kullanılabilir saklanan bir rota varsa doğrudan teslimat başarısız olabilir ve sonuç, sohbete hemen gönderilmek yerine kuyruğa alınmış oturum teslimatına geri döner.
    - Geçersiz veya eski hedefler yine de kuyruk geri dönüşünü ya da nihai teslimat hatasını zorlayabilir.
    - Alt öğenin son görünür asistan yanıtı tam olarak sessiz token `NO_REPLY` / `no_reply` ya da tam olarak `ANNOUNCE_SKIP` ise OpenClaw, eski önceki ilerlemeyi göndermek yerine duyuruyu kasıtlı olarak bastırır.
    - Alt öğe yalnızca araç çağrılarından sonra zaman aşımına uğradıysa duyuru, ham araç çıktısını yeniden oynatmak yerine bunu kısa bir kısmi ilerleme özetine daraltabilir.

    Hata ayıklama:

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    Dokümanlar: [Alt ajanlar](/tr/tools/subagents), [Arka Plan Görevleri](/tr/automation/tasks), [Oturum Araçları](/tr/concepts/session-tool).

  </Accordion>

  <Accordion title="Cron veya hatırlatıcılar tetiklenmiyor. Neyi kontrol etmeliyim?">
    Cron, Gateway süreci içinde çalışır. Gateway kesintisiz çalışmıyorsa,
    zamanlanmış işler çalışmaz.

    Kontrol listesi:

    - Cron’un etkin olduğunu (`cron.enabled`) ve `OPENCLAW_SKIP_CRON` ayarlanmadığını doğrulayın.
    - Gateway’in 7/24 çalıştığını kontrol edin (uyku/yeniden başlatma yok).
    - İş için saat dilimi ayarlarını doğrulayın (`--tz` ve ana makine saat dilimi).

    Hata ayıklama:

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    Dokümanlar: [Cron işleri](/tr/automation/cron-jobs), [Otomasyon ve Görevler](/tr/automation).

  </Accordion>

  <Accordion title="Cron tetiklendi, ancak kanala hiçbir şey gönderilmedi. Neden?">
    Önce gönderim modunu kontrol edin:

    - `--no-deliver` / `delivery.mode: "none"` çalıştırıcı yedek gönderiminin beklenmediği anlamına gelir.
    - Eksik veya geçersiz duyuru hedefi (`channel` / `to`), çalıştırıcının dışa teslimatı atladığı anlamına gelir.
    - Kanal kimlik doğrulama hataları (`unauthorized`, `Forbidden`), çalıştırıcının teslim etmeyi denediği ancak kimlik bilgilerinin bunu engellediği anlamına gelir.
    - Sessiz yalıtılmış sonuç (yalnızca `NO_REPLY` / `no_reply`) kasıtlı olarak teslim edilemez kabul edilir, bu yüzden çalıştırıcı sıraya alınmış yedek teslimatı da bastırır.

    Yalıtılmış cron işleri için, bir sohbet rotası mevcut olduğunda ajan yine de `message`
    aracıyla doğrudan gönderebilir. `--announce` yalnızca ajanın zaten göndermediği
    son metin için çalıştırıcı yedek yolunu kontrol eder.

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
    çalışma zamanı model devrini kalıcılaştırabilir ve yeniden deneyebilir. Yeniden deneme,
    değiştirilen sağlayıcı/modeli korur; değişiklik yeni bir kimlik doğrulama profili geçersiz kılmasını taşıdıysa cron
    yeniden denemeden önce bunu da kalıcılaştırır.

    İlgili seçim kuralları:

    - Uygulanabildiğinde önce Gmail hook model geçersiz kılması kazanır.
    - Ardından iş başına `model`.
    - Ardından saklanan herhangi bir cron oturumu model geçersiz kılması.
    - Ardından normal ajan/varsayılan model seçimi.

    Yeniden deneme döngüsü sınırlıdır. İlk deneme artı 2 değiştirme yeniden denemesinden sonra,
    cron sonsuza kadar döngüye girmek yerine iptal eder.

    Hata ayıklama:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Belgeler: [Cron işleri](/tr/automation/cron-jobs), [cron CLI](/tr/cli/cron).

  </Accordion>

  <Accordion title="Linux'ta Skills'i nasıl kurarım?">
    Yerel `openclaw skills` komutlarını kullanın veya Skills'i çalışma alanınıza bırakın. macOS Skills kullanıcı arayüzü Linux'ta kullanılamaz.
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
    eşitlemek istiyorsanız kurun. Ajanlar arasında paylaşılan kurulumlar için Skills'i
    `~/.openclaw/skills` altına koyun ve hangi ajanların görebileceğini daraltmak istiyorsanız
    `agents.defaults.skills` veya `agents.list[].skills` kullanın.

  </Accordion>

  <Accordion title="OpenClaw görevleri bir zamanlamaya göre veya arka planda sürekli çalıştırabilir mi?">
    Evet. Gateway zamanlayıcısını kullanın:

    - **Cron işleri** zamanlanmış veya yinelenen görevler için (yeniden başlatmalar arasında kalıcıdır).
    - **Heartbeat** "ana oturum" periyodik kontrolleri için.
    - **Yalıtılmış işler** özet gönderen veya sohbetlere teslim eden otonom ajanlar için.

    Belgeler: [Cron işleri](/tr/automation/cron-jobs), [Otomasyon ve Görevler](/tr/automation),
    [Heartbeat](/tr/gateway/heartbeat).

  </Accordion>

  <Accordion title="Apple macOS'a özel Skills'i Linux'tan çalıştırabilir miyim?">
    Doğrudan değil. macOS Skills, `metadata.openclaw.os` ve gerekli ikililerle sınırlandırılır; Skills yalnızca **Gateway ana makinesinde** uygun olduklarında sistem isteminde görünür. Linux'ta, `darwin`-only Skills (`apple-notes`, `apple-reminders`, `things-mac` gibi) kapılamayı geçersiz kılmadığınız sürece yüklenmez.

    Desteklenen üç deseniniz var:

    **Seçenek A - Gateway'i bir Mac üzerinde çalıştırın (en basiti).**
    Gateway'i macOS ikililerinin bulunduğu yerde çalıştırın, ardından Linux'tan [uzak modda](#gateway-ports-already-running-and-remote-mode) veya Tailscale üzerinden bağlanın. Gateway ana makinesi macOS olduğu için Skills normal şekilde yüklenir.

    **Seçenek B - bir macOS Node kullanın (SSH yok).**
    Gateway'i Linux'ta çalıştırın, bir macOS Node'u (menü çubuğu uygulaması) eşleştirin ve Mac'te **Node Çalıştırma Komutları** değerini "Her Zaman Sor" veya "Her Zaman İzin Ver" olarak ayarlayın. OpenClaw, gerekli ikililer Node üzerinde mevcut olduğunda macOS'a özel Skills'i uygun kabul edebilir. Ajan bu Skills'i `nodes` aracı üzerinden çalıştırır. "Her Zaman Sor" seçerseniz, istemde "Her Zaman İzin Ver" onayı bu komutu izin listesine ekler.

    **Seçenek C - macOS ikililerini SSH üzerinden vekilleyin (ileri düzey).**
    Gateway'i Linux'ta tutun, ancak gerekli CLI ikililerinin Mac üzerinde çalışan SSH sarmalayıcılarına çözülmesini sağlayın. Ardından Skills uygun kalabilsin diye Linux'a izin verecek şekilde Skills'i geçersiz kılın.

    1. İkili için bir SSH sarmalayıcı oluşturun (örnek: Apple Notes için `memo`):

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. Sarmalayıcıyı Linux ana makinesinde `PATH` üzerine koyun (örneğin `~/bin/memo`).
    3. Linux'a izin vermek için Skills meta verisini (çalışma alanı veya `~/.openclaw/skills`) geçersiz kılın:

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

    - **Özel Skills / Plugin:** güvenilir API erişimi için en iyisi (Notion/HeyGen ikisinin de API'leri var).
    - **Tarayıcı otomasyonu:** kod olmadan çalışır, ancak daha yavaş ve daha kırılgandır.

    Bağlamı müşteri başına tutmak istiyorsanız (ajans iş akışları), basit bir desen şudur:

    - Müşteri başına bir Notion sayfası (bağlam + tercihler + etkin çalışma).
    - Oturumun başında ajandan bu sayfayı getirmesini isteyin.

    Yerel bir entegrasyon istiyorsanız, bir özellik isteği açın veya bu API'leri
    hedefleyen bir Skills oluşturun.

    Skills'i kurun:

    ```bash
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    Yerel kurulumlar etkin çalışma alanındaki `skills/` dizinine iner. Ajanlar arasında paylaşılan Skills için bunları `~/.openclaw/skills/<name>/SKILL.md` içine yerleştirin. Yalnızca bazı ajanların paylaşılan kurulumu görmesi gerekiyorsa `agents.defaults.skills` veya `agents.list[].skills` yapılandırın. Bazı Skills, Homebrew ile kurulmuş ikililer bekler; Linux'ta bu Linuxbrew anlamına gelir (yukarıdaki Homebrew Linux SSS girişine bakın). Bkz. [Skills](/tr/tools/skills), [Skills yapılandırması](/tr/tools/skills-config) ve [ClawHub](/tr/tools/clawhub).

  </Accordion>

  <Accordion title="Mevcut oturum açılmış Chrome'umu OpenClaw ile nasıl kullanırım?">
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

    Bu yol yerel ana makine tarayıcısını veya bağlı bir tarayıcı Node'unu kullanabilir. Gateway başka bir yerde çalışıyorsa tarayıcı makinesinde bir Node ana makinesi çalıştırın ya da bunun yerine uzak CDP kullanın.

    `existing-session` / `user` üzerindeki mevcut sınırlar:

    - eylemler CSS seçici tabanlı değil, ref tabanlıdır
    - yüklemeler `ref` / `inputRef` gerektirir ve şu anda tek seferde bir dosyayı destekler
    - `responsebody`, PDF dışa aktarma, indirme yakalama ve toplu eylemler için hâlâ yönetilen tarayıcı veya ham CDP profili gerekir

  </Accordion>
</AccordionGroup>

## Korumalı alan ve bellek

<AccordionGroup>
  <Accordion title="Özel bir korumalı alan belgesi var mı?">
    Evet. Bkz. [Korumalı alan](/tr/gateway/sandboxing). Docker'a özel kurulum için (Docker içinde tam Gateway veya korumalı alan görüntüleri), bkz. [Docker](/tr/install/docker).
  </Accordion>

  <Accordion title="Docker sınırlı geliyor - tüm özellikleri nasıl etkinleştiririm?">
    Varsayılan görüntü güvenlik önceliklidir ve `node` kullanıcısı olarak çalışır, bu nedenle
    sistem paketlerini, Homebrew'u veya paketlenmiş tarayıcıları içermez. Daha eksiksiz bir kurulum için:

    - Önbelleklerin kalıcı olması için `/home/node` yolunu `OPENCLAW_HOME_VOLUME` ile kalıcılaştırın.
    - Sistem bağımlılıklarını `OPENCLAW_DOCKER_APT_PACKAGES` ile görüntünün içine yerleştirin.
    - Playwright tarayıcılarını paketlenmiş CLI üzerinden kurun:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - `PLAYWRIGHT_BROWSERS_PATH` ayarlayın ve yolun kalıcılaştırıldığından emin olun.

    Belgeler: [Docker](/tr/install/docker), [Tarayıcı](/tr/tools/browser).

  </Accordion>

  <Accordion title="Tek bir ajanla DM'leri kişisel tutup grupları herkese açık/korumalı alanlı yapabilir miyim?">
    Evet - özel trafiğiniz **DM'ler** ve herkese açık trafiğiniz **gruplar** ise.

    Grup/kanal oturumları (ana olmayan anahtarlar) yapılandırılmış korumalı alan arka ucunda çalışırken ana DM oturumu ana makinede kalsın diye `agents.defaults.sandbox.mode: "non-main"` kullanın. Birini seçmezseniz varsayılan arka uç Docker'dır. Ardından korumalı alanlı oturumlarda hangi araçların kullanılabilir olduğunu `tools.sandbox.tools` ile kısıtlayın.

    Kurulum anlatımı + örnek yapılandırma: [Gruplar: kişisel DM'ler + herkese açık gruplar](/tr/channels/groups#pattern-personal-dms-public-groups-single-agent)

    Temel yapılandırma başvurusu: [Gateway yapılandırması](/tr/gateway/config-agents#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="Bir ana makine klasörünü korumalı alana nasıl bağlarım?">
    `agents.defaults.sandbox.docker.binds` değerini `["host:path:mode"]` olarak ayarlayın (örn. `"/home/user/src:/src:ro"`). Genel + ajan başına bağlar birleştirilir; `scope: "shared"` olduğunda ajan başına bağlar yok sayılır. Hassas olan her şey için `:ro` kullanın ve bağların korumalı alan dosya sistemi duvarlarını aştığını unutmayın.

    OpenClaw, bağ kaynaklarını hem normalleştirilmiş yola hem de en derindeki mevcut ata üzerinden çözülen kanonik yola göre doğrular. Bu, son yol segmenti henüz mevcut olmasa bile symlink-ebeveyn kaçışlarının kapalı şekilde başarısız olacağı ve izin verilen kök kontrollerinin symlink çözümlemesinden sonra da uygulanacağı anlamına gelir.

    Örnekler ve güvenlik notları için bkz. [Korumalı alan](/tr/gateway/sandboxing#custom-bind-mounts) ve [Korumalı Alan vs Araç İlkesi vs Yükseltilmiş](/tr/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check).

  </Accordion>

  <Accordion title="Bellek nasıl çalışır?">
    OpenClaw belleği, ajan çalışma alanındaki Markdown dosyalarından ibarettir:

    - Günlük notlar `memory/YYYY-MM-DD.md` içinde
    - Düzenlenmiş uzun vadeli notlar `MEMORY.md` içinde (yalnızca ana/özel oturumlar)

    OpenClaw ayrıca modele otomatik Compaction öncesinde kalıcı notlar yazmasını hatırlatmak için
    **sessiz Compaction öncesi bellek boşaltma** çalıştırır. Bu yalnızca çalışma alanı
    yazılabilir olduğunda çalışır (salt okunur korumalı alanlar bunu atlar). Bkz. [Bellek](/tr/concepts/memory).

  </Accordion>

  <Accordion title="Bellek bazı şeyleri unutmaya devam ediyor. Kalıcı olmasını nasıl sağlarım?">
    bottan **olguyu belleğe yazmasını** isteyin. Uzun vadeli notlar `MEMORY.md` içine,
    kısa vadeli bağlam `memory/YYYY-MM-DD.md` içine girer.

    Bu hâlâ geliştirdiğimiz bir alan. Modele anıları saklamasını hatırlatmak yardımcı olur;
    ne yapacağını bilecektir. Unutmaya devam ederse Gateway'in her çalıştırmada aynı
    çalışma alanını kullandığını doğrulayın.

    Belgeler: [Bellek](/tr/concepts/memory), [Ajan çalışma alanı](/tr/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Bellek sonsuza kadar kalıcı mı? Sınırlar nelerdir?">
    Bellek dosyaları diskte yaşar ve siz silene kadar kalıcıdır. Sınır model değil,
    depolama alanınızdır. **Oturum bağlamı** yine de model bağlam penceresiyle sınırlıdır,
    bu yüzden uzun konuşmalar compact edilebilir veya kesilebilir. Bellek aramasının var olma nedeni budur - yalnızca ilgili parçaları bağlama geri çeker.

    Belgeler: [Bellek](/tr/concepts/memory), [Bağlam](/tr/concepts/context).

  </Accordion>

  <Accordion title="Semantik bellek araması OpenAI API anahtarı gerektirir mi?">
    Yalnızca **OpenAI embeddings** kullanırsanız. Codex OAuth sohbet/tamamlamaları kapsar ve
    embeddings erişimi **vermez**, bu yüzden **Codex ile oturum açmak (OAuth veya
    Codex CLI girişi)** semantik bellek aramasına yardımcı olmaz. OpenAI embeddings
    yine de gerçek bir API anahtarına ihtiyaç duyar (`OPENAI_API_KEY` veya `models.providers.openai.apiKey`).

    Açıkça bir sağlayıcı ayarlamazsanız, OpenClaw bir API anahtarını çözümleyebildiğinde
    otomatik olarak bir sağlayıcı seçer (auth profilleri, `models.providers.*.apiKey` veya ortam değişkenleri).
    Bir OpenAI anahtarı çözümlenirse OpenAI'ı tercih eder; aksi halde bir Gemini anahtarı
    çözümlenirse Gemini, sonra Voyage, sonra Mistral kullanılır. Uzak anahtar yoksa, bellek
    araması siz yapılandırana kadar devre dışı kalır. Yerel bir model yolu
    yapılandırılmış ve mevcutsa, OpenClaw
    `local` tercih eder. Ollama, açıkça
    `memorySearch.provider = "ollama"` ayarladığınızda desteklenir.

    Yerel kalmayı tercih ederseniz, `memorySearch.provider = "local"` ayarlayın (ve isteğe bağlı olarak
    `memorySearch.fallback = "none"`). Gemini embeddings istiyorsanız,
    `memorySearch.provider = "gemini"` ayarlayın ve `GEMINI_API_KEY` (veya
    `memorySearch.remote.apiKey`) sağlayın. **OpenAI, Gemini, Voyage, Mistral, Ollama veya yerel** embedding
    modellerini destekliyoruz - kurulum ayrıntıları için [Memory](/tr/concepts/memory) bölümüne bakın.

  </Accordion>
</AccordionGroup>

## Öğelerin diskte bulunduğu yer

<AccordionGroup>
  <Accordion title="OpenClaw ile kullanılan tüm veriler yerel olarak mı kaydedilir?">
    Hayır - **OpenClaw'ın durumu yereldir**, ancak **harici hizmetler gönderdiğiniz şeyleri yine de görür**.

    - **Varsayılan olarak yerel:** oturumlar, bellek dosyaları, yapılandırma ve çalışma alanı Gateway ana makinesinde bulunur
      (`~/.openclaw` + çalışma alanı dizininiz).
    - **Zorunlu olarak uzak:** model sağlayıcılarına (Anthropic/OpenAI/vb.) gönderdiğiniz iletiler
      onların API'lerine gider ve sohbet platformları (WhatsApp/Telegram/Slack/vb.) ileti verilerini kendi
      sunucularında depolar.
    - **Kapsamı siz kontrol edersiniz:** yerel modeller kullanmak istemleri makinenizde tutar, ancak kanal
      trafiği yine de kanalın sunucularından geçer.

    İlgili: [Aracı çalışma alanı](/tr/concepts/agent-workspace), [Memory](/tr/concepts/memory).

  </Accordion>

  <Accordion title="OpenClaw verilerini nerede depolar?">
    Her şey `$OPENCLAW_STATE_DIR` altında bulunur (varsayılan: `~/.openclaw`):

    | Yol                                                             | Amaç                                                               |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | Ana yapılandırma (JSON5)                                           |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | Eski OAuth içe aktarma (ilk kullanımda auth profillerine kopyalanır) |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | Auth profilleri (OAuth, API anahtarları ve isteğe bağlı `keyRef`/`tokenRef`) |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | `file` SecretRef sağlayıcıları için isteğe bağlı dosya destekli gizli yük |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | Eski uyumluluk dosyası (statik `api_key` girdileri temizlenmiş)     |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | Sağlayıcı durumu (örn. `whatsapp/<accountId>/creds.json`)           |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | Aracı başına durum (agentDir + oturumlar)                           |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | Konuşma geçmişi ve durum (aracı başına)                             |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | Oturum meta verileri (aracı başına)                                 |

    Eski tek aracı yolu: `~/.openclaw/agent/*` (`openclaw doctor` tarafından taşınır).

    **Çalışma alanınız** (AGENTS.md, bellek dosyaları, Skills vb.) ayrıdır ve `agents.defaults.workspace` aracılığıyla yapılandırılır (varsayılan: `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title="AGENTS.md / SOUL.md / USER.md / MEMORY.md nerede bulunmalı?">
    Bu dosyalar `~/.openclaw` içinde değil, **aracı çalışma alanında** bulunur.

    - **Çalışma alanı (aracı başına)**: `AGENTS.md`, `SOUL.md`, `IDENTITY.md`, `USER.md`,
      `MEMORY.md`, `memory/YYYY-MM-DD.md`, isteğe bağlı `HEARTBEAT.md`.
      Küçük harfli kök `memory.md` yalnızca eski onarım girdisidir; `openclaw doctor --fix`
      her iki dosya da mevcut olduğunda onu `MEMORY.md` içine birleştirebilir.
    - **Durum dizini (`~/.openclaw`)**: yapılandırma, kanal/sağlayıcı durumu, auth profilleri, oturumlar, günlükler
      ve paylaşılan Skills (`~/.openclaw/skills`).

    Varsayılan çalışma alanı `~/.openclaw/workspace` olup şu şekilde yapılandırılabilir:

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    Bot yeniden başlatmadan sonra "unutursa", Gateway'in her başlatmada aynı
    çalışma alanını kullandığını doğrulayın (ve unutmayın: uzak mod, yerel dizüstü bilgisayarınızın değil
    **gateway ana makinesinin** çalışma alanını kullanır).

    İpucu: kalıcı bir davranış veya tercih istiyorsanız, sohbet geçmişine güvenmek yerine bottan bunu
    **AGENTS.md veya MEMORY.md içine yazmasını** isteyin.

    Bkz. [Aracı çalışma alanı](/tr/concepts/agent-workspace) ve [Memory](/tr/concepts/memory).

  </Accordion>

  <Accordion title="Önerilen yedekleme stratejisi">
    **Aracı çalışma alanınızı** **özel** bir git deposuna koyun ve özel bir yerde
    yedekleyin (örneğin GitHub private). Bu, bellek + AGENTS/SOUL/USER
    dosyalarını yakalar ve asistanın "zihnini" daha sonra geri yüklemenizi sağlar.

    `~/.openclaw` altındaki hiçbir şeyi commit etmeyin (kimlik bilgileri, oturumlar, token'lar veya şifreli gizli yükler).
    Tam geri yükleme gerekiyorsa, hem çalışma alanını hem de durum dizinini
    ayrı ayrı yedekleyin (yukarıdaki geçiş sorusuna bakın).

    Belgeler: [Aracı çalışma alanı](/tr/concepts/agent-workspace).

  </Accordion>

  <Accordion title="OpenClaw'ı tamamen nasıl kaldırırım?">
    Ayrılmış kılavuza bakın: [Kaldırma](/tr/install/uninstall).
  </Accordion>

  <Accordion title="Aracılar çalışma alanının dışında çalışabilir mi?">
    Evet. Çalışma alanı **varsayılan cwd** ve bellek bağlantı noktasıdır; katı bir sandbox değildir.
    Göreli yollar çalışma alanı içinde çözümlenir, ancak sandboxing etkin değilse mutlak yollar diğer
    ana makine konumlarına erişebilir. Yalıtım gerekiyorsa
    [`agents.defaults.sandbox`](/tr/gateway/sandboxing) veya aracı başına sandbox ayarlarını kullanın. Bir
    deponun varsayılan çalışma dizini olmasını istiyorsanız, o aracının
    `workspace` değerini depo köküne yönlendirin. OpenClaw deposu yalnızca kaynak koddur; aracının
    içinde çalışmasını bilinçli olarak istemiyorsanız çalışma alanını ayrı tutun.

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
  <Accordion title="Yapılandırma hangi biçimde? Nerede?">
    OpenClaw, `$OPENCLAW_CONFIG_PATH` konumundan isteğe bağlı bir **JSON5** yapılandırması okur (varsayılan: `~/.openclaw/openclaw.json`):

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    Dosya yoksa, güvenli sayılabilecek varsayılanları kullanır (`~/.openclaw/workspace` varsayılan çalışma alanı dahil).

  </Accordion>

  <Accordion title='gateway.bind: "lan" (veya "tailnet") ayarladım ve artık hiçbir şey dinlemiyor / UI yetkisiz diyor'>
    local loopback dışı bağlamalar **geçerli bir gateway auth yolu gerektirir**. Pratikte bunun anlamı şudur:

    - paylaşılan gizli auth: token veya parola
    - doğru yapılandırılmış kimlik duyarlı ters proxy arkasında `gateway.auth.mode: "trusted-proxy"`

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

    - `gateway.remote.token` / `.password` tek başlarına yerel gateway auth'ı etkinleştirmez.
    - Yerel çağrı yolları, yalnızca `gateway.auth.*` ayarlanmamışsa `gateway.remote.*` değerini yedek olarak kullanabilir.
    - Parola auth için bunun yerine `gateway.auth.mode: "password"` ve `gateway.auth.password` (veya `OPENCLAW_GATEWAY_PASSWORD`) ayarlayın.
    - `gateway.auth.token` / `gateway.auth.password` SecretRef aracılığıyla açıkça yapılandırılmış ve çözümlenememişse, çözümleme kapalı şekilde başarısız olur (uzak yedek maskelemesi yok).
    - Paylaşılan gizli Control UI kurulumları `connect.params.auth.token` veya `connect.params.auth.password` (uygulama/UI ayarlarında saklanır) aracılığıyla kimlik doğrulaması yapar. Tailscale Serve veya `trusted-proxy` gibi kimlik taşıyan modlar bunun yerine istek başlıklarını kullanır. Paylaşılan gizlileri URL'lere koymaktan kaçının.
    - `gateway.auth.mode: "trusted-proxy"` ile, aynı ana makinedeki local loopback ters proxy'leri açık `gateway.auth.trustedProxy.allowLoopback = true` ve `gateway.trustedProxies` içinde bir local loopback girdisi gerektirir.

  </Accordion>

  <Accordion title="Artık localhost üzerinde neden token gerekiyor?">
    OpenClaw, local loopback dahil olmak üzere varsayılan olarak gateway auth uygular. Normal varsayılan yolda bu, token auth anlamına gelir: açık bir auth yolu yapılandırılmadıysa, gateway başlangıcı token moduna çözümlenir ve otomatik olarak bir token üretip `gateway.auth.token` içine kaydeder; bu yüzden **yerel WS istemcilerinin kimlik doğrulaması yapması gerekir**. Bu, diğer yerel süreçlerin Gateway'i çağırmasını engeller.

    Farklı bir auth yolu tercih ederseniz, parola modunu (veya kimlik duyarlı ters proxy'ler için `trusted-proxy`) açıkça seçebilirsiniz. **Gerçekten** açık local loopback istiyorsanız, yapılandırmanızda açıkça `gateway.auth.mode: "none"` ayarlayın. Doctor sizin için istediğiniz zaman token üretebilir: `openclaw doctor --generate-gateway-token`.

  </Accordion>

  <Accordion title="Yapılandırmayı değiştirdikten sonra yeniden başlatmam gerekiyor mu?">
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

    - `off`: slogan metnini gizler ama banner başlığı/sürüm satırını tutar.
    - `default`: her seferinde `All your chats, one OpenClaw.` kullanır.
    - `random`: dönen komik/mevsimsel sloganlar (varsayılan davranış).
    - Hiç banner istemiyorsanız, `OPENCLAW_HIDE_BANNER=1` ortam değişkenini ayarlayın.

  </Accordion>

  <Accordion title="Web aramasını (ve web getirmeyi) nasıl etkinleştiririm?">
    `web_fetch` API anahtarı olmadan çalışır. `web_search`, seçtiğiniz
    sağlayıcıya bağlıdır:

    - Brave, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Perplexity ve Tavily gibi API destekli sağlayıcılar normal API anahtarı kurulumlarını gerektirir.
    - Ollama Web Search anahtarsızdır, ancak yapılandırılmış Ollama ana makinenizi kullanır ve `ollama signin` gerektirir.
    - DuckDuckGo anahtarsızdır, ancak resmi olmayan HTML tabanlı bir entegrasyondur.
    - SearXNG anahtarsız/kendi kendine barındırılan bir seçenektir; `SEARXNG_BASE_URL` veya `plugins.entries.searxng.config.webSearch.baseUrl` yapılandırın.

    **Önerilir:** `openclaw configure --section web` çalıştırın ve bir sağlayıcı seçin.
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
    Eski `tools.web.search.*` sağlayıcı yolları uyumluluk için geçici olarak hâlâ yüklenir, ancak yeni yapılandırmalar için kullanılmamalıdır.
    Firecrawl web getirme yedek yapılandırması `plugins.entries.firecrawl.config.webFetch.*` altında bulunur.

    Notlar:

    - İzin listeleri kullanıyorsanız `web_search`/`web_fetch`/`x_search` veya `group:web` ekleyin.
    - `web_fetch` varsayılan olarak etkindir (açıkça devre dışı bırakılmadıkça).
    - `tools.web.fetch.provider` atlanırsa OpenClaw, kullanılabilir kimlik bilgilerinden ilk hazır getirme yedek sağlayıcısını otomatik olarak algılar. Bugün paketli sağlayıcı Firecrawl'dır.
    - Daemon'lar env var'ları `~/.openclaw/.env` dosyasından (veya hizmet ortamından) okur.

    Belgeler: [Web araçları](/tr/tools/web).

  </Accordion>

  <Accordion title="config.apply yapılandırmamı sildi. Nasıl kurtarır ve bunu önlerim?">
    `config.apply` **tüm yapılandırmayı** değiştirir. Kısmi bir nesne gönderirseniz diğer her şey
    kaldırılır.

    Güncel OpenClaw birçok kazara ezmeye karşı koruma sağlar:

    - OpenClaw'a ait yapılandırma yazmaları, yazmadan önce değişiklik sonrası tam yapılandırmayı doğrular.
    - Geçersiz veya yıkıcı OpenClaw'a ait yazmalar reddedilir ve `openclaw.json.rejected.*` olarak kaydedilir.
    - Doğrudan bir düzenleme başlangıcı veya sıcak yeniden yüklemeyi bozarsa Gateway kapalı başarısız olur ya da yeniden yüklemeyi atlar; `openclaw.json` dosyasını yeniden yazmaz.
    - `openclaw doctor --fix` onarımın sahibidir ve reddedilen dosyayı `openclaw.json.clobbered.*` olarak kaydederken son bilinen iyi durumu geri yükleyebilir.

    Kurtarma:

    - `Invalid config at`, `Config write rejected:` veya `config reload skipped (invalid config)` için `openclaw logs --follow` çıktısını denetleyin.
    - Etkin yapılandırmanın yanında en yeni `openclaw.json.clobbered.*` veya `openclaw.json.rejected.*` dosyasını inceleyin.
    - `openclaw config validate` ve `openclaw doctor --fix` çalıştırın.
    - Yalnızca amaçlanan anahtarları `openclaw config set` veya `config.patch` ile geri kopyalayın.
    - Son bilinen iyi durumunuz veya reddedilmiş yükünüz yoksa yedekten geri yükleyin ya da `openclaw doctor` komutunu yeniden çalıştırıp kanalları/modelleri yeniden yapılandırın.
    - Bu beklenmedik bir durumsa bir hata bildirin ve son bilinen yapılandırmanızı veya herhangi bir yedeği ekleyin.
    - Yerel bir kodlama agent'ı çoğu zaman günlüklerden veya geçmişten çalışan bir yapılandırmayı yeniden oluşturabilir.

    Önleme:

    - Küçük değişiklikler için `openclaw config set` kullanın.
    - Etkileşimli düzenlemeler için `openclaw configure` kullanın.
    - Tam yol veya alan şekli konusunda emin değilseniz önce `config.schema.lookup` kullanın; ayrıntıya inmek için sığ bir şema düğümü ve anlık alt öğe özetleri döndürür.
    - Kısmi RPC düzenlemeleri için `config.patch` kullanın; `config.apply` yalnızca tam yapılandırma değişimi için kalsın.
    - Bir agent çalıştırmasından yalnızca sahibe açık `gateway` aracını kullanıyorsanız, `tools.exec.ask` / `tools.exec.security` yazmalarını yine de reddeder (aynı korumalı exec yollarına normalize olan eski `tools.bash.*` takma adları dahil).

    Belgeler: [Yapılandırma](/tr/cli/config), [Yapılandır](/tr/cli/configure), [Gateway sorun giderme](/tr/gateway/troubleshooting#gateway-rejected-invalid-config), [Doctor](/tr/gateway/doctor).

  </Accordion>

  <Accordion title="Cihazlar arasında özelleşmiş worker'larla merkezi bir Gateway'i nasıl çalıştırırım?">
    Yaygın desen **bir Gateway** (örn. Raspberry Pi) artı **node'lar** ve **agent'lar** kullanmaktır:

    - **Gateway (merkezi):** kanalların (Signal/WhatsApp), yönlendirmenin ve oturumların sahibidir.
    - **Node'lar (cihazlar):** Mac/iOS/Android çevre birimleri olarak bağlanır ve yerel araçları (`system.run`, `canvas`, `camera`) sunar.
    - **Agent'lar (worker'lar):** özel roller için ayrı beyinler/çalışma alanlarıdır (örn. "Hetzner operasyonları", "Kişisel veriler").
    - **Alt agent'lar:** paralellik istediğinizde ana agent'tan arka plan işi başlatır.
    - **TUI:** Gateway'e bağlanır ve agent'lar/oturumlar arasında geçiş yapar.

    Belgeler: [Node'lar](/tr/nodes), [Uzak erişim](/tr/gateway/remote), [Çok Agent'lı Yönlendirme](/tr/concepts/multi-agent), [Alt agent'lar](/tr/tools/subagents), [TUI](/tr/web/tui).

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

    Varsayılan `false` (headful). Headless, bazı sitelerde bot karşıtı kontrolleri tetiklemeye daha yatkındır. Bkz. [Tarayıcı](/tr/tools/browser).

    Headless **aynı Chromium motorunu** kullanır ve çoğu otomasyon için çalışır (formlar, tıklamalar, scraping, oturum açmalar). Başlıca farklar:

    - Görünür tarayıcı penceresi yoktur (görsel gerekiyorsa ekran görüntüleri kullanın).
    - Bazı siteler headless modda otomasyon konusunda daha katıdır (CAPTCHA'lar, bot karşıtı).
      Örneğin X/Twitter çoğu zaman headless oturumları engeller.

  </Accordion>

  <Accordion title="Tarayıcı kontrolü için Brave'i nasıl kullanırım?">
    `browser.executablePath` değerini Brave binary'nize (veya Chromium tabanlı herhangi bir tarayıcıya) ayarlayın ve Gateway'i yeniden başlatın.
    Tam yapılandırma örnekleri için [Tarayıcı](/tr/tools/browser#use-brave-or-another-chromium-based-browser) bölümüne bakın.
  </Accordion>
</AccordionGroup>

## Uzak gateway'ler ve node'lar

<AccordionGroup>
  <Accordion title="Komutlar Telegram, gateway ve node'lar arasında nasıl yayılır?">
    Telegram mesajları **gateway** tarafından işlenir. gateway agent'ı çalıştırır ve
    ancak bir node aracı gerektiğinde **Gateway WebSocket** üzerinden node'ları çağırır:

    Telegram → Gateway → Agent → `node.*` → Node → Gateway → Telegram

    Node'lar gelen sağlayıcı trafiğini görmez; yalnızca node RPC çağrılarını alırlar.

  </Accordion>

  <Accordion title="Gateway uzakta barındırılıyorsa agent'ım bilgisayarıma nasıl erişebilir?">
    Kısa cevap: **bilgisayarınızı node olarak eşleştirin**. Gateway başka yerde çalışır, ancak yerel makinenizdeki `node.*` araçlarını (ekran, kamera, sistem) Gateway WebSocket üzerinden çağırabilir.

    Tipik kurulum:

    1. Gateway'i her zaman açık host üzerinde çalıştırın (VPS/ev sunucusu).
    2. Gateway host'unu ve bilgisayarınızı aynı tailnet'e koyun.
    3. Gateway WS'nin erişilebilir olduğundan emin olun (tailnet bağlama veya SSH tüneli).
    4. macOS uygulamasını yerel olarak açın ve node olarak kaydolabilmesi için **SSH üzerinden Uzak** modunda (veya doğrudan tailnet ile)
       bağlanın.
    5. Node'u Gateway üzerinde onaylayın:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Ayrı bir TCP köprüsü gerekmez; node'lar Gateway WebSocket üzerinden bağlanır.

    Güvenlik hatırlatması: Bir macOS node'unu eşleştirmek, o makinede `system.run` çalıştırılmasına izin verir. Yalnızca
    güvendiğiniz cihazları eşleştirin ve [Güvenlik](/tr/gateway/security) bölümünü gözden geçirin.

    Belgeler: [Node'lar](/tr/nodes), [Gateway protokolü](/tr/gateway/protocol), [macOS uzak modu](/tr/platforms/mac/remote), [Güvenlik](/tr/gateway/security).

  </Accordion>

  <Accordion title="Tailscale bağlı ama yanıt alamıyorum. Şimdi ne yapmalıyım?">
    Temelleri denetleyin:

    - Gateway çalışıyor: `openclaw gateway status`
    - Gateway sağlığı: `openclaw status`
    - Kanal sağlığı: `openclaw channels status`

    Ardından kimlik doğrulamayı ve yönlendirmeyi doğrulayın:

    - Tailscale Serve kullanıyorsanız `gateway.auth.allowTailscale` değerinin doğru ayarlandığından emin olun.
    - SSH tüneli üzerinden bağlanıyorsanız yerel tünelin açık olduğunu ve doğru porta işaret ettiğini doğrulayın.
    - İzin listelerinizin (DM veya grup) hesabınızı içerdiğini doğrulayın.

    Belgeler: [Tailscale](/tr/gateway/tailscale), [Uzak erişim](/tr/gateway/remote), [Kanallar](/tr/channels).

  </Accordion>

  <Accordion title="İki OpenClaw instance'ı birbiriyle konuşabilir mi (yerel + VPS)?">
    Evet. Yerleşik bir "bot-to-bot" köprüsü yoktur, ancak bunu birkaç
    güvenilir şekilde bağlayabilirsiniz:

    **En basit:** iki botun da erişebildiği normal bir sohbet kanalı kullanın (Telegram/Slack/WhatsApp).
    Bot A'nın Bot B'ye mesaj göndermesini sağlayın, sonra Bot B'nin her zamanki gibi yanıtlamasına izin verin.

    **CLI köprüsü (genel):** diğer Gateway'i
    `openclaw agent --message ... --deliver` ile çağıran ve diğer botun
    dinlediği bir sohbeti hedefleyen bir betik çalıştırın. Bir bot uzak VPS üzerindeyse CLI'nizi
    SSH/Tailscale üzerinden o uzak Gateway'e yöneltin (bkz. [Uzak erişim](/tr/gateway/remote)).

    Örnek desen (hedef Gateway'e erişebilen bir makineden çalıştırın):

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    İpucu: iki botun sonsuz döngüye girmemesi için bir güvenlik sınırı ekleyin (yalnızca bahsetme, kanal
    izin listeleri veya "bot mesajlarına yanıt verme" kuralı).

    Belgeler: [Uzak erişim](/tr/gateway/remote), [Agent CLI](/tr/cli/agent), [Agent gönderme](/tr/tools/agent-send).

  </Accordion>

  <Accordion title="Birden fazla agent için ayrı VPS'lere ihtiyacım var mı?">
    Hayır. Bir Gateway, her biri kendi çalışma alanı, model varsayılanları
    ve yönlendirmesiyle birden fazla agent barındırabilir. Normal kurulum budur ve
    her agent için bir VPS çalıştırmaktan çok daha ucuz ve basittir.

    Ayrı VPS'leri yalnızca sıkı izolasyona (güvenlik sınırları) veya paylaşmak istemediğiniz çok
    farklı yapılandırmalara ihtiyacınız olduğunda kullanın. Aksi halde tek bir Gateway tutun ve
    birden fazla agent veya alt agent kullanın.

  </Accordion>

  <Accordion title="VPS'ten SSH kullanmak yerine kişisel dizüstü bilgisayarımda node kullanmanın bir faydası var mı?">
    Evet - node'lar uzak bir Gateway'den dizüstü bilgisayarınıza ulaşmanın birinci sınıf yoludur ve
    kabuk erişiminden daha fazlasını açar. Gateway macOS/Linux üzerinde çalışır (WSL2 üzerinden Windows) ve
    hafiftir (küçük bir VPS veya Raspberry Pi sınıfı kutu yeterlidir; 4 GB RAM fazlasıyla yeter), bu nedenle yaygın bir
    kurulum her zaman açık bir host artı node olarak dizüstü bilgisayarınızdır.

    - **Gelen SSH gerekmez.** Node'lar Gateway WebSocket'e dışarı doğru bağlanır ve cihaz eşleştirmeyi kullanır.
    - **Daha güvenli yürütme denetimleri.** `system.run`, o dizüstü bilgisayardaki node izin listeleri/onaylarıyla kapılanır.
    - **Daha fazla cihaz aracı.** Node'lar `system.run` yanında `canvas`, `camera` ve `screen` sunar.
    - **Yerel tarayıcı otomasyonu.** Gateway'i VPS üzerinde tutun, ancak Chrome'u dizüstü bilgisayardaki bir node host üzerinden yerel olarak çalıştırın ya da Chrome MCP üzerinden host'taki yerel Chrome'a bağlanın.

    SSH geçici kabuk erişimi için uygundur, ancak node'lar sürekli agent iş akışları ve
    cihaz otomasyonu için daha basittir.

    Belgeler: [Node'lar](/tr/nodes), [Node'lar CLI](/tr/cli/nodes), [Tarayıcı](/tr/tools/browser).

  </Accordion>

  <Accordion title="Node'lar bir gateway hizmeti çalıştırır mı?">
    Hayır. Kasıtlı olarak izole profiller çalıştırmadığınız sürece host başına yalnızca **bir gateway** çalışmalıdır (bkz. [Birden fazla gateway](/tr/gateway/multiple-gateways)). Node'lar gateway'e bağlanan çevre birimleridir (iOS/Android node'ları veya menü çubuğu uygulamasında macOS "node modu"). Headless node
    host'ları ve CLI kontrolü için bkz. [Node host CLI](/tr/cli/node).

    `gateway`, `discovery` ve `canvasHost` değişiklikleri için tam yeniden başlatma gerekir.

  </Accordion>

  <Accordion title="Yapılandırmayı uygulamanın bir API / RPC yolu var mı?">
    Evet.

    - `config.schema.lookup`: yazmadan önce bir yapılandırma alt ağacını sığ şema düğümü, eşleşen UI ipucu ve anlık alt öğe özetleriyle inceleyin
    - `config.get`: mevcut anlık görüntüyü + hash'i getirir
    - `config.patch`: güvenli kısmi güncelleme (çoğu RPC düzenlemesi için tercih edilir); mümkün olduğunda sıcak yeniden yükler ve gerektiğinde yeniden başlatır
    - `config.apply`: tam yapılandırmayı doğrular + değiştirir; mümkün olduğunda sıcak yeniden yükler ve gerektiğinde yeniden başlatır
    - Yalnızca sahibe açık `gateway` runtime aracı `tools.exec.ask` / `tools.exec.security` değerlerini yeniden yazmayı yine de reddeder; eski `tools.bash.*` takma adları aynı korumalı exec yollarına normalize olur

  </Accordion>

  <Accordion title="İlk kurulum için en düşük makul yapılandırma">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    Bu, çalışma alanınızı ayarlar ve botu kimlerin tetikleyebileceğini sınırlar.

  </Accordion>

  <Accordion title="Bir VPS üzerinde Tailscale nasıl kurulur ve Mac'imden nasıl bağlanırım?">
    En düşük adımlar:

    1. **VPS üzerinde kurulum + oturum açma**

       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```

    2. **Mac'inizde kurulum + oturum açma**
       - Tailscale uygulamasını kullanın ve aynı tailnet'e giriş yapın.
    3. **MagicDNS'i etkinleştirme (önerilir)**
       - Tailscale yönetici konsolunda MagicDNS'i etkinleştirin, böylece VPS sabit bir ada sahip olur.
    4. **Tailnet ana makine adını kullanma**
       - SSH: `ssh user@your-vps.tailnet-xxxx.ts.net`
       - Gateway WS: `ws://your-vps.tailnet-xxxx.ts.net:18789`

    Control UI'ı SSH olmadan kullanmak istiyorsanız VPS üzerinde Tailscale Serve kullanın:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Bu, gateway'i loopback'e bağlı tutar ve HTTPS'i Tailscale üzerinden açar. Bkz. [Tailscale](/tr/gateway/tailscale).

  </Accordion>

  <Accordion title="Bir Mac Node uzak bir Gateway'e nasıl bağlanır (Tailscale Serve)?">
    Serve, **Gateway Control UI + WS**'i açar. Node'lar aynı Gateway WS uç noktası üzerinden bağlanır.

    Önerilen kurulum:

    1. **VPS + Mac'in aynı tailnet'te olduğundan emin olun**.
    2. **macOS uygulamasını Uzak modda kullanın** (SSH hedefi tailnet ana makine adı olabilir).
       Uygulama Gateway bağlantı noktasını tüneller ve Node olarak bağlanır.
    3. **Gateway üzerinde Node'u onaylayın**:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Belgeler: [Gateway protokolü](/tr/gateway/protocol), [Keşif](/tr/gateway/discovery), [macOS uzak modu](/tr/platforms/mac/remote).

  </Accordion>

  <Accordion title="İkinci bir dizüstü bilgisayara kurulum mu yapmalıyım, yoksa yalnızca Node mu eklemeliyim?">
    İkinci dizüstü bilgisayarda yalnızca **yerel araçlara** (ekran/kamera/exec) ihtiyacınız varsa onu
    **Node** olarak ekleyin. Bu, tek bir Gateway tutar ve yinelenen yapılandırmayı önler. Yerel Node araçları
    şu anda yalnızca macOS içindir, ancak bunları diğer işletim sistemlerine genişletmeyi planlıyoruz.

    Yalnızca **katı yalıtım** veya tamamen ayrı iki bot gerektiğinde ikinci bir Gateway kurun.

    Belgeler: [Node'lar](/tr/nodes), [Node'lar CLI](/tr/cli/nodes), [Birden çok gateway](/tr/gateway/multiple-gateways).

  </Accordion>
</AccordionGroup>

## Ortam değişkenleri ve .env yükleme

<AccordionGroup>
  <Accordion title="OpenClaw ortam değişkenlerini nasıl yükler?">
    OpenClaw, ortam değişkenlerini üst süreçten (shell, launchd/systemd, CI vb.) okur ve ek olarak şunları yükler:

    - Geçerli çalışma dizininden `.env`
    - `~/.openclaw/.env` içinden genel yedek `.env` (diğer adıyla `$OPENCLAW_STATE_DIR/.env`)

    Hiçbir `.env` dosyası mevcut ortam değişkenlerini geçersiz kılmaz.

    Yapılandırmada satır içi ortam değişkenleri de tanımlayabilirsiniz (yalnızca süreç ortamında eksikse uygulanır):

    ```json5
    {
      env: {
        OPENROUTER_API_KEY: "sk-or-...",
        vars: { GROQ_API_KEY: "gsk-..." },
      },
    }
    ```

    Tam öncelik ve kaynaklar için [/environment](/tr/help/environment) bölümüne bakın.

  </Accordion>

  <Accordion title="Gateway'i hizmet üzerinden başlattım ve ortam değişkenlerim kayboldu. Şimdi ne yapmalıyım?">
    İki yaygın düzeltme:

    1. Eksik anahtarları `~/.openclaw/.env` içine koyun; böylece hizmet shell ortamınızı devralmasa bile alınırlar.
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

    Bu, oturum açma shell'inizi çalıştırır ve yalnızca eksik beklenen anahtarları içe aktarır (asla geçersiz kılmaz). Ortam değişkeni karşılıkları:
    `OPENCLAW_LOAD_SHELL_ENV=1`, `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`.

  </Accordion>

  <Accordion title='COPILOT_GITHUB_TOKEN ayarladım, ancak model durumu "Shell env: off." gösteriyor. Neden?'>
    `openclaw models status`, **shell env import** özelliğinin etkin olup olmadığını bildirir. "Shell env: off"
    ortam değişkenlerinizin eksik olduğu anlamına **gelmez** - yalnızca OpenClaw'ın oturum açma
    shell'inizi otomatik olarak yüklemeyeceği anlamına gelir.

    Gateway bir hizmet olarak çalışıyorsa (launchd/systemd), shell
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

  <Accordion title="Hiç /new göndermezsem oturumlar otomatik olarak sıfırlanır mı?">
    Oturumlar `session.idleMinutes` sonrasında süresi dolabilir, ancak bu **varsayılan olarak devre dışıdır** (varsayılan **0**).
    Boşta kalma süresi sonunu etkinleştirmek için bunu pozitif bir değere ayarlayın. Etkinleştirildiğinde, boşta kalma döneminden sonraki **sonraki**
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

  <Accordion title="OpenClaw örneklerinden oluşan bir ekip kurmanın bir yolu var mı (bir CEO ve birçok aracı)?">
    Evet, **çok aracılı yönlendirme** ve **alt aracılar** üzerinden. Bir koordinatör
    aracı ve kendi çalışma alanları ile modellerine sahip birkaç çalışan aracı oluşturabilirsiniz.

    Bununla birlikte, bunu en iyi **eğlenceli bir deney** olarak görmek gerekir. Token açısından ağırdır ve çoğu zaman
    ayrı oturumlara sahip tek bir bot kullanmaktan daha az verimlidir. Öngördüğümüz tipik model,
    konuştuğunuz tek bir bot ve paralel işler için farklı oturumlardır. Bu
    bot gerektiğinde alt aracılar da oluşturabilir.

    Belgeler: [Çok aracılı yönlendirme](/tr/concepts/multi-agent), [Alt aracılar](/tr/tools/subagents), [Aracılar CLI](/tr/cli/agents).

  </Accordion>

  <Accordion title="Bağlam neden görevin ortasında kısaltıldı? Bunu nasıl önlerim?">
    Oturum bağlamı model penceresiyle sınırlıdır. Uzun sohbetler, büyük araç çıktıları veya çok sayıda
    dosya Compaction ya da kısaltma tetikleyebilir.

    Yardımcı olanlar:

    - Bottan mevcut durumu özetlemesini ve bunu bir dosyaya yazmasını isteyin.
    - Uzun görevlerden önce `/compact`, konu değiştirirken `/new` kullanın.
    - Önemli bağlamı çalışma alanında tutun ve bottan onu tekrar okumasını isteyin.
    - Uzun veya paralel işler için alt aracılar kullanın, böylece ana sohbet daha küçük kalır.
    - Bu sık oluyorsa daha büyük bağlam penceresine sahip bir model seçin.

  </Accordion>

  <Accordion title="OpenClaw'ı kurulu tutup tamamen nasıl sıfırlarım?">
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
    - Profiller kullandıysanız (`--profile` / `OPENCLAW_PROFILE`), her durum dizinini sıfırlayın (varsayılanlar `~/.openclaw-<profile>`).
    - Geliştirme sıfırlaması: `openclaw gateway --dev --reset` (yalnızca geliştirme; geliştirme yapılandırmasını + kimlik bilgilerini + oturumları + çalışma alanını siler).

  </Accordion>

  <Accordion title='"context too large" hataları alıyorum - nasıl sıfırlar veya sıkıştırırım?'>
    Şunlardan birini kullanın:

    - **Sıkıştır** (konuşmayı korur, ancak eski dönüşleri özetler):

      ```
      /compact
      ```

      veya özeti yönlendirmek için `/compact <instructions>`.

    - **Sıfırla** (aynı sohbet anahtarı için yeni oturum kimliği):

      ```
      /new
      /reset
      ```

    Devam ederse:

    - Eski araç çıktısını kırpmak için **oturum budamayı** (`agents.defaults.contextPruning`) etkinleştirin veya ayarlayın.
    - Daha büyük bağlam penceresine sahip bir model kullanın.

    Belgeler: [Compaction](/tr/concepts/compaction), [Oturum budama](/tr/concepts/session-pruning), [Oturum yönetimi](/tr/concepts/session).

  </Accordion>

  <Accordion title='"LLM request rejected: messages.content.tool_use.input field required" mesajını neden görüyorum?'>
    Bu bir sağlayıcı doğrulama hatasıdır: model, gerekli `input` olmadan bir `tool_use` bloğu yaydı.
    Bu genellikle oturum geçmişinin eski veya bozulmuş olduğu anlamına gelir (çoğunlukla uzun iş parçacıklarından
    ya da bir araç/şema değişikliğinden sonra).

    Düzeltme: `/new` ile yeni bir oturum başlatın (tek başına mesaj).

  </Accordion>

  <Accordion title="Neden her 30 dakikada bir Heartbeat mesajları alıyorum?">
    Heartbeat'ler varsayılan olarak her **30m** çalışır (OAuth kimlik doğrulaması kullanılırken **1h**). Ayarlayın veya devre dışı bırakın:

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
    başlıkları), OpenClaw API çağrılarını kaydetmek için Heartbeat çalıştırmasını atlar.
    Dosya eksikse Heartbeat yine çalışır ve model ne yapacağına karar verir.

    Aracı başına geçersiz kılmalar `agents.list[].heartbeat` kullanır. Belgeler: [Heartbeat](/tr/gateway/heartbeat).

  </Accordion>

  <Accordion title='Bir WhatsApp grubuna "bot account" eklemem gerekiyor mu?'>
    Hayır. OpenClaw **kendi hesabınızda** çalışır, bu yüzden gruptaysanız OpenClaw onu görebilir.
    Varsayılan olarak, gönderenlere izin verene kadar grup yanıtları engellenir (`groupPolicy: "allowlist"`).

    Grup yanıtlarını yalnızca **sizin** tetikleyebilmenizi istiyorsanız:

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

    `@g.us` ile biten `chatId` (veya `from`) değerini arayın, örneğin:
    `1234567890-1234567890@g.us`.

    Seçenek 2 (zaten yapılandırılmış/izin listesine alınmışsa): yapılandırmadan grupları listeleyin:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    Belgeler: [WhatsApp](/tr/channels/whatsapp), [Dizin](/tr/cli/directory), [Günlükler](/tr/cli/logs).

  </Accordion>

  <Accordion title="OpenClaw bir grupta neden yanıt vermiyor?">
    İki yaygın neden:

    - Mention gating açıktır (varsayılan). Botu @mention etmeniz (veya `mentionPatterns` ile eşleşmeniz) gerekir.
    - `channels.whatsapp.groups` yapılandırdınız ancak `"*"` eklemediniz ve grup izin listesinde değil.

    Bkz. [Gruplar](/tr/channels/groups) ve [Grup mesajları](/tr/channels/group-messages).

  </Accordion>

  <Accordion title="Gruplar/iş parçacıkları DM'lerle bağlam paylaşır mı?">
    Doğrudan sohbetler varsayılan olarak ana oturuma daraltılır. Gruplar/kanalların kendi oturum anahtarları vardır ve Telegram konuları / Discord iş parçacıkları ayrı oturumlardır. Bkz. [Gruplar](/tr/channels/groups) ve [Grup mesajları](/tr/channels/group-messages).
  </Accordion>

  <Accordion title="Kaç çalışma alanı ve aracı oluşturabilirim?">
    Katı sınırlar yoktur. Onlarcası (hatta yüzlercesi) sorun değildir, ancak şunlara dikkat edin:

    - **Disk büyümesi:** oturumlar + transkriptler `~/.openclaw/agents/<agentId>/sessions/` altında bulunur.
    - **Token maliyeti:** daha fazla aracı, daha fazla eşzamanlı model kullanımı demektir.
    - **Operasyon yükü:** aracı başına kimlik doğrulama profilleri, çalışma alanları ve kanal yönlendirme.

    İpuçları:

    - Aracı başına bir **aktif** çalışma alanı tutun (`agents.defaults.workspace`).
    - Disk büyürse eski oturumları budayın (JSONL veya store girdilerini silin).
    - Dağınık çalışma alanlarını ve profil uyuşmazlıklarını görmek için `openclaw doctor` kullanın.

  </Accordion>

  <Accordion title="Aynı anda birden çok bot veya sohbet çalıştırabilir miyim (Slack) ve bunu nasıl kurmalıyım?">
    Evet. Birden çok yalıtılmış ajan çalıştırmak ve gelen iletileri
    kanal/hesap/eşe göre yönlendirmek için **Çok Ajanlı Yönlendirme** kullanın. Slack bir kanal olarak desteklenir ve belirli ajanlara bağlanabilir.

    Tarayıcı erişimi güçlüdür, ancak "bir insanın yapabildiği her şeyi yap" anlamına gelmez; bot karşıtı önlemler, CAPTCHA'lar ve MFA
    otomasyonu yine de engelleyebilir. En güvenilir tarayıcı kontrolü için ana makinede yerel Chrome MCP kullanın
    veya tarayıcıyı gerçekten çalıştıran makinede CDP kullanın.

    En iyi uygulama kurulumu:

    - Her zaman açık Gateway ana makinesi (VPS/Mac mini).
    - Rol başına bir ajan (bağlamalar).
    - Bu ajanlara bağlı Slack kanal(lar)ı.
    - Gerektiğinde Chrome MCP veya bir node aracılığıyla yerel tarayıcı.

    Belgeler: [Çok Ajanlı Yönlendirme](/tr/concepts/multi-agent), [Slack](/tr/channels/slack),
    [Tarayıcı](/tr/tools/browser), [Node'lar](/tr/nodes).

  </Accordion>
</AccordionGroup>

## Modeller, yük devretme ve kimlik doğrulama profilleri

Model SSS — varsayılanlar, seçim, takma adlar, geçiş, yük devretme, kimlik doğrulama profilleri —
[Modeller SSS](/tr/help/faq-models) sayfasında yer alır.

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
    Çünkü "running", **supervisor'ın** görünümüdür (launchd/systemd/schtasks). Bağlantı probu ise CLI'nin gateway WebSocket'e gerçekten bağlanmasıdır.

    `openclaw gateway status` kullanın ve şu satırlara güvenin:

    - `Probe target:` (probun gerçekten kullandığı URL)
    - `Listening:` (bağlantı noktasında gerçekten neyin bağlı olduğu)
    - `Last gateway error:` (süreç canlıyken ama bağlantı noktası dinlemiyorken yaygın temel neden)

  </Accordion>

  <Accordion title='openclaw gateway status neden "Config (cli)" ve "Config (service)" değerlerini farklı gösteriyor?'>
    Hizmet başka bir yapılandırma dosyasıyla çalışırken siz farklı bir yapılandırma dosyasını düzenliyorsunuz (genellikle `--profile` / `OPENCLAW_STATE_DIR` uyumsuzluğu).

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
    `gateway.mode: "remote"` ayarlayın ve isteğe bağlı olarak paylaşılan gizli uzak kimlik bilgileriyle bir uzak WebSocket URL'si belirtin:

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

    - `openclaw gateway` yalnızca `gateway.mode` değeri `local` olduğunda (veya override bayrağını verdiğinizde) başlar.
    - macOS uygulaması yapılandırma dosyasını izler ve bu değerler değiştiğinde modları canlı olarak değiştirir.
    - `gateway.remote.token` / `.password` yalnızca istemci tarafı uzak kimlik bilgileridir; bunlar kendi başlarına yerel gateway kimlik doğrulamasını etkinleştirmez.

  </Accordion>

  <Accordion title='Control UI "unauthorized" diyor (veya yeniden bağlanmaya devam ediyor). Şimdi ne yapmalıyım?'>
    Gateway kimlik doğrulama yolunuz ile UI'nin kimlik doğrulama yöntemi eşleşmiyor.

    Gerçekler (koddan):

    - Control UI, belirteci geçerli tarayıcı sekmesi oturumu ve seçili gateway URL'si için `sessionStorage` içinde tutar; böylece aynı sekmede yenilemeler, uzun ömürlü localStorage belirteci kalıcılığını geri getirmeden çalışmaya devam eder.
    - `AUTH_TOKEN_MISMATCH` durumunda güvenilir istemciler, gateway yeniden deneme ipuçları döndürdüğünde (`canRetryWithDeviceToken=true`, `recommendedNextStep=retry_with_device_token`) önbelleğe alınmış bir cihaz belirteciyle sınırlı bir yeniden deneme yapabilir.
    - Bu önbelleğe alınmış belirteçle yeniden deneme artık cihaz belirteciyle saklanan önbelleğe alınmış onaylı kapsamları yeniden kullanır. Açık `deviceToken` / açık `scopes` çağıranları, önbelleğe alınmış kapsamları devralmak yerine istedikleri kapsam kümesini korumaya devam eder.
    - Bu yeniden deneme yolu dışında, bağlantı kimlik doğrulama önceliği önce açık paylaşılan token/parola, ardından açık `deviceToken`, ardından saklanan cihaz belirteci, ardından bootstrap belirtecidir.
    - Bootstrap belirteci kapsam denetimleri rol öneklidir. Yerleşik bootstrap operator izin listesi yalnızca operator isteklerini karşılar; node veya diğer operator olmayan rollerin hâlâ kendi rol önekleri altında kapsamlara ihtiyacı vardır.

    Düzeltme:

    - En hızlısı: `openclaw dashboard` (dashboard URL'sini yazdırır + kopyalar, açmayı dener; headless ise SSH ipucu gösterir).
    - Henüz belirteciniz yoksa: `openclaw doctor --generate-gateway-token`.
    - Uzak ise önce tünel açın: `ssh -N -L 18789:127.0.0.1:18789 user@host`, sonra `http://127.0.0.1:18789/` açın.
    - Paylaşılan gizli mod: `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` veya `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` ayarlayın, ardından eşleşen gizli değeri Control UI ayarlarına yapıştırın.
    - Tailscale Serve modu: `gateway.auth.allowTailscale` etkin olduğundan ve Tailscale kimlik başlıklarını atlayan ham bir loopback/tailnet URL'si değil, Serve URL'sini açtığınızdan emin olun.
    - Güvenilir proxy modu: ham gateway URL'siyle değil, yapılandırılmış kimlik duyarlı proxy üzerinden geldiğinizden emin olun. Aynı ana makine loopback proxy'leri için ayrıca `gateway.auth.trustedProxy.allowLoopback = true` gerekir.
    - Tek yeniden denemeden sonra uyumsuzluk devam ederse eşlenmiş cihaz belirtecini döndürün/yeniden onaylayın:
      - `openclaw devices list`
      - `openclaw devices rotate --device <id> --role operator`
    - Bu döndürme çağrısı reddedildiğini söylüyorsa iki şeyi kontrol edin:
      - eşlenmiş cihaz oturumları, `operator.admin` yetkileri de yoksa yalnızca **kendi** cihazlarını döndürebilir
      - açık `--scope` değerleri, çağıranın geçerli operator kapsamlarını aşamaz
    - Hâlâ takıldıysanız `openclaw status --all` çalıştırın ve [Sorun Giderme](/tr/gateway/troubleshooting) adımlarını izleyin. Kimlik doğrulama ayrıntıları için [Dashboard](/tr/web/dashboard) bölümüne bakın.

  </Accordion>

  <Accordion title="gateway.bind tailnet ayarladım ama bağlanamıyor ve hiçbir şey dinlemiyor">
    `tailnet` bağlaması, ağ arayüzlerinizden bir Tailscale IP'si seçer (100.64.0.0/10). Makine Tailscale üzerinde değilse (veya arayüz kapalıysa), bağlanacak hiçbir şey yoktur.

    Düzeltme:

    - O ana makinede Tailscale başlatın (böylece 100.x adresi olur), veya
    - `gateway.bind: "loopback"` / `"lan"` değerine geçin.

    Not: `tailnet` açıktır. `auto` loopback tercih eder; yalnızca tailnet'e bağlanmak istediğinizde `gateway.bind: "tailnet"` kullanın.

  </Accordion>

  <Accordion title="Aynı ana makinede birden çok Gateway çalıştırabilir miyim?">
    Genellikle hayır; tek bir Gateway birden çok mesajlaşma kanalı ve ajan çalıştırabilir. Birden çok Gateway'i yalnızca yedeklilik (örn. kurtarma botu) veya katı yalıtım gerektiğinde kullanın.

    Evet, ancak yalıtmanız gerekir:

    - `OPENCLAW_CONFIG_PATH` (instance başına yapılandırma)
    - `OPENCLAW_STATE_DIR` (instance başına durum)
    - `agents.defaults.workspace` (çalışma alanı yalıtımı)
    - `gateway.port` (benzersiz bağlantı noktaları)

    Hızlı kurulum (önerilir):

    - Her instance için `openclaw --profile <name> ...` kullanın (`~/.openclaw-<name>` otomatik oluşturulur).
    - Her profil yapılandırmasında benzersiz bir `gateway.port` ayarlayın (veya manuel çalıştırmalar için `--port` verin).
    - Profil başına bir hizmet kurun: `openclaw --profile <name> gateway install`.

    Profiller hizmet adlarına da son ek ekler (`ai.openclaw.<profile>`; eski `com.openclaw.*`, `openclaw-gateway-<profile>.service`, `OpenClaw Gateway (<profile>)`).
    Tam kılavuz: [Birden çok gateway](/tr/gateway/multiple-gateways).

  </Accordion>

  <Accordion title='"invalid handshake" / kod 1008 ne anlama gelir?'>
    Gateway bir **WebSocket sunucusudur** ve ilk iletinin
    bir `connect` çerçevesi olmasını bekler. Başka bir şey alırsa bağlantıyı
    **kod 1008** (politika ihlali) ile kapatır.

    Yaygın nedenler:

    - Bir WS istemcisi yerine tarayıcıda **HTTP** URL'sini açtınız (`http://...`).
    - Yanlış bağlantı noktası veya yolu kullandınız.
    - Bir proxy veya tünel kimlik doğrulama başlıklarını çıkardı ya da Gateway dışı bir istek gönderdi.

    Hızlı düzeltmeler:

    1. WS URL'sini kullanın: `ws://<host>:18789` (veya HTTPS ise `wss://...`).
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

    En hızlı günlük takibi:

    ```bash
    openclaw logs --follow
    ```

    Hizmet/supervisor günlükleri (gateway launchd/systemd üzerinden çalıştığında):

    - macOS: `$OPENCLAW_STATE_DIR/logs/gateway.log` ve `gateway.err.log` (varsayılan: `~/.openclaw/logs/...`; profiller `~/.openclaw-<profile>/logs/...` kullanır)
    - Linux: `journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`
    - Windows: `schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`

    Daha fazlası için [Sorun Giderme](/tr/gateway/troubleshooting) bölümüne bakın.

  </Accordion>

  <Accordion title="Gateway hizmetini nasıl başlatır/durdurur/yeniden başlatırım?">
    gateway yardımcılarını kullanın:

    ```bash
    openclaw gateway status
    openclaw gateway restart
    ```

    gateway'i manuel çalıştırıyorsanız `openclaw gateway --force` bağlantı noktasını geri alabilir. [Gateway](/tr/gateway) bölümüne bakın.

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

  <Accordion title="Gateway çalışıyor ama yanıtlar hiç gelmiyor. Neyi kontrol etmeliyim?">
    Hızlı bir sağlık taramasıyla başlayın:

    ```bash
    openclaw status
    openclaw models status
    openclaw channels status
    openclaw logs --follow
    ```

    Yaygın nedenler:

    - Model kimlik doğrulaması **gateway ana makinesinde** yüklenmemiş ( `models status` kontrol edin).
    - Kanal eşleştirme/izin listesi yanıtları engelliyor (kanal yapılandırmasını + günlükleri kontrol edin).
    - WebChat/Dashboard doğru token olmadan açık.

    Uzakta iseniz tünel/Tailscale bağlantısının açık olduğunu ve
    Gateway WebSocket'in erişilebilir olduğunu doğrulayın.

    Belgeler: [Kanallar](/tr/channels), [Sorun Giderme](/tr/gateway/troubleshooting), [Uzak erişim](/tr/gateway/remote).

  </Accordion>

  <Accordion title='"Disconnected from gateway: no reason" - şimdi ne yapmalıyım?'>
    Bu genellikle UI'nin WebSocket bağlantısını kaybettiği anlamına gelir. Kontrol edin:

    1. Gateway çalışıyor mu? `openclaw gateway status`
    2. Gateway sağlıklı mı? `openclaw status`
    3. UI doğru token'a sahip mi? `openclaw dashboard`
    4. Uzaksa, tünel/Tailscale bağlantısı açık mı?

    Ardından günlükleri izleyin:

    ```bash
    openclaw logs --follow
    ```

    Dokümanlar: [Dashboard](/tr/web/dashboard), [Uzak erişim](/tr/gateway/remote), [Sorun giderme](/tr/gateway/troubleshooting).

  </Accordion>

  <Accordion title="Telegram setMyCommands başarısız oluyor. Neyi kontrol etmeliyim?">
    Günlükler ve kanal durumuyla başlayın:

    ```bash
    openclaw channels status
    openclaw channels logs --channel telegram
    ```

    Ardından hatayı eşleştirin:

    - `BOT_COMMANDS_TOO_MUCH`: Telegram menüsünde çok fazla giriş var. OpenClaw zaten Telegram sınırına kadar kırpar ve daha az komutla yeniden dener, ancak bazı menü girişlerinin yine de kaldırılması gerekir. Plugin/skill/özel komutları azaltın veya menüye ihtiyacınız yoksa `channels.telegram.commands.native` ayarını devre dışı bırakın.
    - `TypeError: fetch failed`, `Network request for 'setMyCommands' failed!` veya benzer ağ hataları: Bir VPS üzerindeyseniz veya proxy arkasındaysanız, giden HTTPS'ye izin verildiğini ve DNS'in `api.telegram.org` için çalıştığını doğrulayın.

    Gateway uzaksa, Gateway ana makinesindeki günlüklere baktığınızdan emin olun.

    Dokümanlar: [Telegram](/tr/channels/telegram), [Kanal sorun giderme](/tr/channels/troubleshooting).

  </Accordion>

  <Accordion title="TUI çıktı göstermiyor. Neyi kontrol etmeliyim?">
    Önce Gateway'e erişilebildiğini ve ajanın çalışabildiğini doğrulayın:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    TUI içinde mevcut durumu görmek için `/status` kullanın. Bir sohbet
    kanalında yanıt bekliyorsanız, teslimatın etkin olduğundan emin olun (`/deliver on`).

    Dokümanlar: [TUI](/tr/web/tui), [Eğik çizgi komutları](/tr/tools/slash-commands).

  </Accordion>

  <Accordion title="Gateway'i tamamen nasıl durdurup sonra başlatırım?">
    Hizmeti kurduysanız:

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    Bu, **denetlenen hizmeti** durdurur/başlatır (macOS'ta launchd, Linux'ta systemd).
    Gateway arka planda daemon olarak çalıştığında bunu kullanın.

    Ön planda çalıştırıyorsanız Ctrl-C ile durdurun, ardından:

    ```bash
    openclaw gateway run
    ```

    Dokümanlar: [Gateway hizmet çalışma kılavuzu](/tr/gateway).

  </Accordion>

  <Accordion title="Basitçe: openclaw gateway restart ile openclaw gateway arasındaki fark">
    - `openclaw gateway restart`: **arka plan hizmetini** yeniden başlatır (launchd/systemd).
    - `openclaw gateway`: bu terminal oturumu için gateway'i **ön planda** çalıştırır.

    Hizmeti kurduysanız gateway komutlarını kullanın. Tek seferlik, ön planda
    bir çalıştırma istediğinizde `openclaw gateway` kullanın.

  </Accordion>

  <Accordion title="Bir şey başarısız olduğunda daha fazla ayrıntı almanın en hızlı yolu">
    Daha fazla konsol ayrıntısı almak için Gateway'i `--verbose` ile başlatın. Ardından kanal kimlik doğrulaması, model yönlendirme ve RPC hataları için günlük dosyasını inceleyin.
  </Accordion>
</AccordionGroup>

## Medya ve ekler

<AccordionGroup>
  <Accordion title="Skill bir görsel/PDF oluşturdu, ancak hiçbir şey gönderilmedi">
    Ajanın giden ekleri bir `MEDIA:<path-or-url>` satırı içermelidir (kendi satırında). Bkz. [OpenClaw asistan kurulumu](/tr/start/openclaw) ve [Ajan gönderimi](/tr/tools/agent-send).

    CLI gönderimi:

    ```bash
    openclaw message send --target +15555550123 --message "Here you go" --media /path/to/file.png
    ```

    Ayrıca şunları kontrol edin:

    - Hedef kanal giden medyayı destekliyor ve izin listeleri tarafından engellenmiyor.
    - Dosya, sağlayıcının boyut sınırları içinde (görseller en fazla 2048px olacak şekilde yeniden boyutlandırılır).
    - `tools.fs.workspaceOnly=true`, yerel yol gönderimlerini çalışma alanı, temp/media-store ve sandbox tarafından doğrulanmış dosyalarla sınırlar.
    - `tools.fs.workspaceOnly=false`, `MEDIA:` öğesinin ajanın zaten okuyabildiği ana makineye yerel dosyaları göndermesine izin verir, ancak yalnızca medya ve güvenli belge türleri için (görseller, ses, video, PDF ve Office belgeleri). Düz metin ve sır benzeri dosyalar yine de engellenir.

    Bkz. [Görseller](/tr/nodes/images).

  </Accordion>
</AccordionGroup>

## Güvenlik ve erişim denetimi

<AccordionGroup>
  <Accordion title="OpenClaw'u gelen DM'lere açmak güvenli mi?">
    Gelen DM'leri güvenilmeyen girdi olarak ele alın. Varsayılanlar riski azaltmak için tasarlanmıştır:

    - DM destekleyen kanallarda varsayılan davranış **eşleştirme**dir:
      - Bilinmeyen gönderenler bir eşleştirme kodu alır; bot iletilerini işlemez.
      - Şununla onaylayın: `openclaw pairing approve --channel <channel> [--account <id>] <code>`
      - Bekleyen istekler **kanal başına 3** ile sınırlıdır; bir kod gelmediyse `openclaw pairing list --channel <channel> [--account <id>]` kontrol edin.
    - DM'leri herkese açık şekilde açmak açık katılım gerektirir (`dmPolicy: "open"` ve izin listesi `"*"`).

    Riskli DM politikalarını ortaya çıkarmak için `openclaw doctor` çalıştırın.

  </Accordion>

  <Accordion title="Prompt enjeksiyonu yalnızca herkese açık botlar için mi bir endişedir?">
    Hayır. Prompt enjeksiyonu, yalnızca bot'a kimin DM gönderebildiğiyle değil, **güvenilmeyen içerikle** ilgilidir.
    Asistanınız harici içerik okuyorsa (web arama/getirme, tarayıcı sayfaları, e-postalar,
    dokümanlar, ekler, yapıştırılmış günlükler), bu içerik modeli ele geçirmeye çalışan
    talimatlar içerebilir. Bu, **tek gönderen siz olsanız bile** gerçekleşebilir.

    En büyük risk araçlar etkin olduğundadır: model, bağlamı dışarı sızdırmak veya sizin adınıza
    araç çağırmak için kandırılabilir. Etki alanını şu şekilde azaltın:

    - güvenilmeyen içeriği özetlemek için salt okunur veya araçları devre dışı bırakılmış bir "okuyucu" ajan kullanarak
    - araçları etkin ajanlarda `web_search` / `web_fetch` / `browser` kapalı tutarak
    - çözümlenmiş dosya/belge metnini de güvenilmeyen kabul ederek: OpenResponses
      `input_file` ve medya eki çıkarımı, ham dosya metni iletmek yerine çıkarılan metni
      açık harici içerik sınır işaretçileriyle sarar
    - sandbox kullanarak ve sıkı araç izin listeleri uygulayarak

    Ayrıntılar: [Güvenlik](/tr/gateway/security).

  </Accordion>

  <Accordion title="Bot'umun kendi e-postası, GitHub hesabı veya telefon numarası olmalı mı?">
    Evet, çoğu kurulum için. Bot'u ayrı hesaplar ve telefon numaralarıyla yalıtmak,
    bir şeyler ters giderse etki alanını azaltır. Bu ayrıca kişisel hesaplarınızı etkilemeden
    kimlik bilgilerini döndürmeyi veya erişimi iptal etmeyi kolaylaştırır.

    Küçük başlayın. Yalnızca gerçekten ihtiyacınız olan araçlara ve hesaplara erişim verin, gerekirse
    daha sonra genişletin.

    Dokümanlar: [Güvenlik](/tr/gateway/security), [Eşleştirme](/tr/channels/pairing).

  </Accordion>

  <Accordion title="Metin mesajlarım üzerinde ona özerklik verebilir miyim ve bu güvenli mi?">
    Kişisel mesajlarınız üzerinde tam özerklik **önermiyoruz**. En güvenli model şudur:

    - DM'leri **eşleştirme modunda** veya sıkı bir izin listesinde tutun.
    - Sizin adınıza mesaj göndermesini istiyorsanız **ayrı bir numara veya hesap** kullanın.
    - Taslak hazırlamasına izin verin, ardından **göndermeden önce onaylayın**.

    Denemek istiyorsanız, bunu ayrılmış bir hesapta yapın ve yalıtılmış tutun. Bkz.
    [Güvenlik](/tr/gateway/security).

  </Accordion>

  <Accordion title="Kişisel asistan görevleri için daha ucuz modeller kullanabilir miyim?">
    Evet, ajan yalnızca sohbet amaçlıysa ve girdi güvenilirse. Daha küçük katmanlar
    talimat ele geçirmeye daha yatkındır, bu nedenle araçları etkin ajanlarda
    veya güvenilmeyen içerik okurken bunlardan kaçının. Daha küçük bir model kullanmanız gerekiyorsa
    araçları kilitleyin ve bir sandbox içinde çalıştırın. Bkz. [Güvenlik](/tr/gateway/security).
  </Accordion>

  <Accordion title="Telegram'da /start çalıştırdım ama eşleştirme kodu almadım">
    Eşleştirme kodları **yalnızca** bilinmeyen bir gönderen bot'a mesaj gönderdiğinde ve
    `dmPolicy: "pairing"` etkin olduğunda gönderilir. `/start` tek başına kod oluşturmaz.

    Bekleyen istekleri kontrol edin:

    ```bash
    openclaw pairing list telegram
    ```

    Hemen erişim istiyorsanız, gönderen kimliğinizi izin listesine alın veya o hesap için
    `dmPolicy: "open"` ayarlayın.

  </Accordion>

  <Accordion title="WhatsApp: kişilerime mesaj gönderir mi? Eşleştirme nasıl çalışır?">
    Hayır. Varsayılan WhatsApp DM politikası **eşleştirme**dir. Bilinmeyen gönderenler yalnızca bir eşleştirme kodu alır ve mesajları **işlenmez**. OpenClaw yalnızca aldığı sohbetlere veya sizin açıkça tetiklediğiniz gönderimlere yanıt verir.

    Eşleştirmeyi şununla onaylayın:

    ```bash
    openclaw pairing approve whatsapp <code>
    ```

    Bekleyen istekleri listeleyin:

    ```bash
    openclaw pairing list whatsapp
    ```

    Sihirbaz telefon numarası istemi: kendi DM'lerinize izin verilmesi için **izin listesi/sahip** ayarınızı yapmakta kullanılır. Otomatik gönderim için kullanılmaz. Kişisel WhatsApp numaranızda çalıştırıyorsanız, o numarayı kullanın ve `channels.whatsapp.selfChatMode` etkinleştirin.

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

    Hâlâ gürültülüyse, Control UI içindeki oturum ayarlarını kontrol edin ve verbose ayarını
    **inherit** olarak belirleyin. Ayrıca yapılandırmada `verboseDefault` değeri
    `on` olarak ayarlanmış bir bot profili kullanmadığınızı doğrulayın.

    Dokümanlar: [Düşünme ve verbose](/tr/tools/thinking), [Güvenlik](/tr/gateway/security/index#reasoning-and-verbose-output-in-groups).

  </Accordion>

  <Accordion title="Çalışan bir görevi nasıl durdurur/iptal ederim?">
    Bunlardan herhangi birini **tek başına bir mesaj olarak** gönderin (eğik çizgi olmadan):

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

    Arka plan süreçleri için (exec aracından), ajandan şunu çalıştırmasını isteyebilirsiniz:

    ```
    process action:kill sessionId:XXX
    ```

    Eğik çizgi komutlarına genel bakış: bkz. [Eğik çizgi komutları](/tr/tools/slash-commands).

    Çoğu komut `/` ile başlayan **tek başına** bir mesaj olarak gönderilmelidir, ancak birkaç kısayol (`/status` gibi) izin listesindeki gönderenler için satır içinde de çalışır.

  </Accordion>

  <Accordion title='Telegram'dan Discord mesajı nasıl gönderirim? ("Cross-context messaging denied")'>
    OpenClaw varsayılan olarak **sağlayıcılar arası** mesajlaşmayı engeller. Bir araç çağrısı
    Telegram'a bağlıysa, açıkça izin vermediğiniz sürece Discord'a göndermez.

    Ajan için sağlayıcılar arası mesajlaşmayı etkinleştirin:

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

  <Accordion title='Bot hızlı arka arkaya mesajları "görmezden geliyor" gibi neden hissettiriyor?'>
    Kuyruk modu, yeni mesajların devam eden bir çalıştırmayla nasıl etkileşime girdiğini kontrol eder. Modları değiştirmek için `/queue` kullanın:

    - `steer` - geçerli çalıştırmada bir sonraki model sınırı için bekleyen tüm yönlendirmeyi kuyruğa al
    - `queue` - eski tek tek yönlendirme
    - `followup` - mesajları teker teker çalıştır
    - `collect` - mesajları toplu işleyip bir kez yanıtla
    - `steer-backlog` - şimdi yönlendir, ardından birikmiş işleri işle
    - `interrupt` - geçerli çalıştırmayı iptal et ve baştan başlat

    Varsayılan mod `steer` olur. Followup modları için `debounce:0.5s cap:25 drop:summarize` gibi seçenekler ekleyebilirsiniz. Bkz. [Komut kuyruğu](/tr/concepts/queue) ve [Yönlendirme kuyruğu](/tr/concepts/queue-steering).

  </Accordion>
</AccordionGroup>

## Çeşitli

<AccordionGroup>
  <Accordion title='API anahtarıyla Anthropic için varsayılan model nedir?'>
    OpenClaw'da kimlik bilgileri ve model seçimi ayrıdır. `ANTHROPIC_API_KEY` ayarlamak (veya kimlik doğrulama profillerinde bir Anthropic API anahtarı saklamak) kimlik doğrulamayı etkinleştirir, ancak asıl varsayılan model `agents.defaults.model.primary` içinde yapılandırdığınız modeldir (örneğin, `anthropic/claude-sonnet-4-6` veya `anthropic/claude-opus-4-6`). `No credentials found for profile "anthropic:default"` görürseniz, bu Gateway'in çalışan ajanın beklenen `auth-profiles.json` dosyasında Anthropic kimlik bilgilerini bulamadığı anlamına gelir.
  </Accordion>
</AccordionGroup>

---

Hala takıldınız mı? [Discord](https://discord.com/invite/clawd) üzerinde sorun veya bir [GitHub tartışması](https://github.com/openclaw/openclaw/discussions) açın.

## İlgili

- [İlk çalıştırma SSS](/tr/help/faq-first-run) — kurulum, ilk kullanım, kimlik doğrulama, abonelikler, erken hatalar
- [Modeller SSS](/tr/help/faq-models) — model seçimi, yük devretme, kimlik doğrulama profilleri
- [Sorun giderme](/tr/help/troubleshooting) — belirti odaklı triyaj
