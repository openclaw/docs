---
read_when:
    - Yaygın kurulum, yükleme, onboarding veya çalışma zamanı destek sorularını yanıtlama
    - Daha derin hata ayıklamadan önce kullanıcı tarafından bildirilen sorunları sınıflandırma
summary: OpenClaw kurulumu, yapılandırması ve kullanımı hakkında sık sorulan sorular
title: SSS
x-i18n:
    generated_at: "2026-04-24T09:12:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0ae635d7ade265e3e79d1f5489ae23034a341843bd784f68a985b18bee5bdf6f
    source_path: help/faq.md
    workflow: 15
---

Gerçek dünya kurulumları (yerel geliştirme, VPS, çoklu ajan, OAuth/API anahtarları, model failover) için hızlı yanıtlar ve daha derin sorun giderme. Çalışma zamanı tanılamaları için bkz. [Sorun Giderme](/tr/gateway/troubleshooting). Tam yapılandırma başvurusu için bkz. [Yapılandırma](/tr/gateway/configuration).

## Bir şey bozuksa ilk 60 saniye

1. **Hızlı durum (ilk kontrol)**

   ```bash
   openclaw status
   ```

   Hızlı yerel özet: OS + güncelleme, gateway/servis erişilebilirliği, ajanlar/oturumlar, sağlayıcı yapılandırması + çalışma zamanı sorunları (gateway erişilebilirse).

2. **Paylaşılabilir rapor (güvenle paylaşılabilir)**

   ```bash
   openclaw status --all
   ```

   Salt okunur tanılama ve günlük sonu (token'lar sansürlenmiş).

3. **Daemon + port durumu**

   ```bash
   openclaw gateway status
   ```

   Supervisor çalışma zamanı ile RPC erişilebilirliğini, yoklama hedef URL'sini ve servisin büyük olasılıkla hangi yapılandırmayı kullandığını gösterir.

4. **Derin yoklamalar**

   ```bash
   openclaw status --deep
   ```

   Desteklendiğinde kanal yoklamaları dahil olmak üzere canlı gateway sağlık yoklaması çalıştırır
   (erişilebilir bir gateway gerektirir). Bkz. [Sağlık](/tr/gateway/health).

5. **En son günlüğü izleyin**

   ```bash
   openclaw logs --follow
   ```

   RPC kapalıysa şuna geri dönün:

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   Dosya günlükleri servis günlüklerinden ayrıdır; bkz. [Günlükleme](/tr/logging) ve [Sorun Giderme](/tr/gateway/troubleshooting).

6. **Doctor'ı çalıştırın (onarımlar)**

   ```bash
   openclaw doctor
   ```

   Yapılandırmayı/durumu onarır veya geçirir + sağlık kontrolleri çalıştırır. Bkz. [Doctor](/tr/gateway/doctor).

7. **Gateway anlık görüntüsü**

   ```bash
   openclaw health --json
   openclaw health --verbose   # hatalarda hedef URL + yapılandırma yolunu gösterir
   ```

   Çalışan gateway'den tam bir anlık görüntü ister (yalnızca WS). Bkz. [Sağlık](/tr/gateway/health).

## Hızlı başlangıç ve ilk çalıştırma kurulumu

İlk çalıştırma SSS'si — kurulum, onboarding, auth yolları, abonelikler, ilk hatalar —
[İlk çalıştırma SSS](/tr/help/faq-first-run) sayfasında yer alır.

## OpenClaw nedir?

<AccordionGroup>
  <Accordion title="OpenClaw tek paragrafta nedir?">
    OpenClaw, kendi cihazlarınızda çalıştırdığınız kişisel bir AI asistandır. Zaten kullandığınız mesajlaşma yüzeylerinde (WhatsApp, Telegram, Slack, Mattermost, Discord, Google Chat, Signal, iMessage, WebChat ve QQ Bot gibi paketlenmiş kanal Plugins'leri) yanıt verir ve desteklenen platformlarda ses + canlı Canvas da yapabilir. **Gateway** her zaman açık denetim düzlemidir; ürünün kendisi asistandır.
  </Accordion>

  <Accordion title="Değer önerisi">
    OpenClaw, "yalnızca bir Claude sarmalayıcısı" değildir. Bu, yetenekli bir asistanı **kendi donanımınızda**, zaten kullandığınız sohbet uygulamaları üzerinden erişilebilir şekilde, durum bilgili oturumlar, bellek ve araçlarla çalıştırmanızı sağlayan **local-first bir denetim düzlemidir** — iş akışlarınızın denetimini barındırılan bir SaaS'a vermeden.

    Öne çıkanlar:

    - **Cihazlarınız, veriniz:** Gateway'i istediğiniz yerde çalıştırın (Mac, Linux, VPS) ve
      çalışma alanını + oturum geçmişini yerel tutun.
    - **Gerçek kanallar, web sandbox'ı değil:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage/vb,
      ayrıca desteklenen platformlarda mobil ses ve Canvas.
    - **Modelden bağımsız:** Anthropic, OpenAI, MiniMax, OpenRouter vb. kullanın; ajan başına yönlendirme
      ve failover ile.
    - **Yalnızca yerel seçenek:** Yerel modeller çalıştırın, böylece isterseniz **tüm veriler cihazınızda kalabilir**.
    - **Çoklu ajan yönlendirmesi:** Kanal, hesap veya görev başına ayrı ajanlar; her birinin kendi
      çalışma alanı ve varsayılanları vardır.
    - **Açık kaynak ve hacklenebilir:** Satıcı kilidine girmeden inceleyin, genişletin ve self-host edin.

    Belgeler: [Gateway](/tr/gateway), [Kanallar](/tr/channels), [Çoklu ajan](/tr/concepts/multi-agent),
    [Bellek](/tr/concepts/memory).

  </Accordion>

  <Accordion title="Yeni kurdum - önce ne yapmalıyım?">
    İyi ilk projeler:

    - Bir web sitesi oluşturun (WordPress, Shopify veya basit bir statik site).
    - Bir mobil uygulama prototipi yapın (taslak, ekranlar, API planı).
    - Dosya ve klasörleri düzenleyin (temizlik, adlandırma, etiketleme).
    - Gmail'i bağlayın ve özetleri veya takipleri otomatikleştirin.

    Büyük görevleri de halledebilir, ancak bunları aşamalara böldüğünüzde ve
    paralel iş için alt ajanlar kullandığınızda en iyi sonucu verir.

  </Accordion>

  <Accordion title="OpenClaw için günlük hayattaki en önemli beş kullanım alanı nedir?">
    Günlük kazanımlar genellikle şöyle görünür:

    - **Kişisel brifingler:** gelen kutusu, takvim ve önemsediğiniz haberlerin özetleri.
    - **Araştırma ve taslak hazırlama:** e-postalar veya belgeler için hızlı araştırma, özetler ve ilk taslaklar.
    - **Hatırlatmalar ve takipler:** Cron veya Heartbeat ile çalışan dürtmeler ve kontrol listeleri.
    - **Tarayıcı otomasyonu:** formları doldurma, veri toplama ve web görevlerini tekrarlama.
    - **Cihazlar arası koordinasyon:** telefonunuzdan görev gönderin, Gateway bunu sunucuda çalıştırsın ve sonucu sohbette geri alın.

  </Accordion>

  <Accordion title="OpenClaw, bir SaaS için lead gen, outreach, reklamlar ve bloglarda yardımcı olabilir mi?">
    Evet, **araştırma, nitelendirme ve taslak hazırlama** için. Siteleri tarayabilir, kısa listeler oluşturabilir,
    potansiyel müşterileri özetleyebilir ve outreach veya reklam metni taslakları yazabilir.

    **Outreach veya reklam çalıştırmaları** için insanı döngü içinde tutun. Spam yapmaktan kaçının, yerel yasalara ve
    platform politikalarına uyun ve gönderilmeden önce her şeyi gözden geçirin. En güvenli desen,
    OpenClaw'ın taslak hazırlaması ve sizin onaylamanızdır.

    Belgeler: [Güvenlik](/tr/gateway/security).

  </Accordion>

  <Accordion title="Web geliştirme için Claude Code'a göre avantajları nelerdir?">
    OpenClaw bir **kişisel asistan** ve koordinasyon katmanıdır, bir IDE ikamesi değildir. Depo içinde en hızlı doğrudan kodlama döngüsü için
    Claude Code veya Codex kullanın. Kalıcı bellek, cihazlar arası erişim ve araç orkestrasyonu istediğinizde
    OpenClaw kullanın.

    Avantajlar:

    - Oturumlar arasında **kalıcı bellek + çalışma alanı**
    - **Çok platformlu erişim** (WhatsApp, Telegram, TUI, WebChat)
    - **Araç orkestrasyonu** (tarayıcı, dosyalar, zamanlama, hook'lar)
    - **Her zaman açık Gateway** (VPS'te çalıştırın, her yerden etkileşim kurun)
    - Yerel tarayıcı/ekran/kamera/exec için **Node'lar**

    Vitrin: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills ve otomasyon

<AccordionGroup>
  <Accordion title="Depoyu kirli tutmadan Skills'i nasıl özelleştiririm?">
    Depo kopyasını düzenlemek yerine yönetilen geçersiz kılmaları kullanın. Değişikliklerinizi `~/.openclaw/skills/<name>/SKILL.md` içine koyun (veya `~/.openclaw/openclaw.json` içinde `skills.load.extraDirs` ile bir klasör ekleyin). Öncelik sırası `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → paketlenmiş → `skills.load.extraDirs` şeklindedir; bu yüzden yönetilen geçersiz kılmalar git'e dokunmadan yine paketlenmiş Skills'in önüne geçer. Skill'in genel olarak kurulu olmasını ama yalnızca bazı ajanlara görünmesini istiyorsanız ortak kopyayı `~/.openclaw/skills` içinde tutun ve görünürlüğü `agents.defaults.skills` ve `agents.list[].skills` ile denetleyin. Yalnızca yukarı akışa uygun düzenlemeler depoda yaşamalı ve PR olarak gönderilmelidir.
  </Accordion>

  <Accordion title="Skills'i özel bir klasörden yükleyebilir miyim?">
    Evet. `~/.openclaw/openclaw.json` içinde `skills.load.extraDirs` ile ek dizinler ekleyin (en düşük öncelik). Varsayılan öncelik sırası `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → paketlenmiş → `skills.load.extraDirs` şeklindedir. `clawhub`, varsayılan olarak `./skills` içine kurar; OpenClaw bunu sonraki oturumda `<workspace>/skills` olarak değerlendirir. Skill yalnızca belirli ajanlara görünmeliyse bunu `agents.defaults.skills` veya `agents.list[].skills` ile eşleştirin.
  </Accordion>

  <Accordion title="Farklı görevler için farklı modelleri nasıl kullanabilirim?">
    Bugün desteklenen desenler şunlardır:

    - **Cron işleri**: yalıtılmış işler, iş başına `model` geçersiz kılması ayarlayabilir.
    - **Alt ajanlar**: görevleri farklı varsayılan modellere sahip ayrı ajanlara yönlendirin.
    - **İsteğe bağlı geçiş**: geçerli oturum modelini istediğiniz zaman değiştirmek için `/model` kullanın.

    Bkz. [Cron işleri](/tr/automation/cron-jobs), [Çoklu Ajan Yönlendirmesi](/tr/concepts/multi-agent) ve [Slash commands](/tr/tools/slash-commands).

  </Accordion>

  <Accordion title="Bot ağır işler yaparken donuyor. Bunu nasıl dışarı alırım?">
    Uzun veya paralel görevler için **alt ajanlar** kullanın. Alt ajanlar kendi oturumlarında çalışır,
    bir özet döndürür ve ana sohbetinizin yanıt verebilir kalmasını sağlar.

    Botunuza "bu görev için bir alt ajan başlat" deyin veya `/subagents` kullanın.
    Gateway'in şu anda ne yaptığını (ve meşgul olup olmadığını) görmek için sohbette `/status` kullanın.

    Token ipucu: uzun görevler ve alt ajanlar da token tüketir. Maliyet önemliyse
    alt ajanlar için `agents.defaults.subagents.model` üzerinden daha ucuz bir model ayarlayın.

    Belgeler: [Alt ajanlar](/tr/tools/subagents), [Arka Plan Görevleri](/tr/automation/tasks).

  </Accordion>

  <Accordion title="Discord'da konuya bağlı alt ajan oturumları nasıl çalışır?">
    Konu bağlamalarını kullanın. Bir Discord konusunu alt ajana veya oturum hedefine bağlayabilirsiniz; böylece o konudaki takip mesajları bağlı oturumda kalır.

    Temel akış:

    - `sessions_spawn` ile `thread: true` kullanarak başlatın (ve isteğe bağlı olarak kalıcı takip için `mode: "session"`).
    - Veya `/focus <target>` ile elle bağlayın.
    - Bağlama durumunu incelemek için `/agents` kullanın.
    - Otomatik unfocus davranışını denetlemek için `/session idle <duration|off>` ve `/session max-age <duration|off>` kullanın.
    - Konuyu ayırmak için `/unfocus` kullanın.

    Gerekli yapılandırma:

    - Genel varsayılanlar: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
    - Discord geçersiz kılmaları: `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours`.
    - Başlatmada otomatik bağlama: `channels.discord.threadBindings.spawnSubagentSessions: true` ayarlayın.

    Belgeler: [Alt ajanlar](/tr/tools/subagents), [Discord](/tr/channels/discord), [Yapılandırma Başvurusu](/tr/gateway/configuration-reference), [Slash commands](/tr/tools/slash-commands).

  </Accordion>

  <Accordion title="Bir alt ajan bitti, ama tamamlama güncellemesi yanlış yere gitti veya hiç gönderilmedi. Neyi kontrol etmeliyim?">
    Önce çözümlenen istekçi yolunu kontrol edin:

    - Tamamlama modundaki alt ajan teslimi, varsa herhangi bir bağlı konu veya konuşma yolunu tercih eder.
    - Tamamlama kökeni yalnızca bir kanal taşıyorsa OpenClaw, doğrudan teslim yine başarılı olabilsin diye istekçi oturumun saklanan yoluna (`lastChannel` / `lastTo` / `lastAccountId`) geri düşer.
    - Ne bağlı yol ne de kullanılabilir bir saklı yol varsa doğrudan teslim başarısız olabilir ve sonuç sohbete hemen gönderilmek yerine kuyruklu oturum teslimine geri düşer.
    - Geçersiz veya eski hedefler yine kuyruk fallback'ini veya nihai teslim başarısızlığını zorlayabilir.
    - Child'ın son görünür asistan yanıtı tam olarak sessiz belirteç `NO_REPLY` / `no_reply` veya tam olarak `ANNOUNCE_SKIP` ise OpenClaw eski ilerlemeyi göndermek yerine bildirimi kasıtlı olarak bastırır.
    - Child yalnızca araç çağrılarından sonra zaman aşımına uğradıysa bildirim, ham araç çıktısını yeniden oynatmak yerine bunu kısa bir kısmi ilerleme özeti olarak daraltabilir.

    Hata ayıklama:

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    Belgeler: [Alt ajanlar](/tr/tools/subagents), [Arka Plan Görevleri](/tr/automation/tasks), [Oturum Araçları](/tr/concepts/session-tool).

  </Accordion>

  <Accordion title="Cron veya hatırlatıcılar çalışmıyor. Neyi kontrol etmeliyim?">
    Cron, Gateway süreci içinde çalışır. Gateway sürekli çalışmıyorsa
    zamanlanmış işler çalışmaz.

    Kontrol listesi:

    - Cron'un etkin olduğunu doğrulayın (`cron.enabled`) ve `OPENCLAW_SKIP_CRON` ayarlı olmasın.
    - Gateway'in 7/24 çalıştığını kontrol edin (uyku/yeniden başlatma yok).
    - İş için saat dilimi ayarlarını doğrulayın (`--tz` ile host saat dilimi karşılaştırması).

    Hata ayıklama:

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    Belgeler: [Cron işleri](/tr/automation/cron-jobs), [Otomasyon ve Görevler](/tr/automation).

  </Accordion>

  <Accordion title="Cron tetiklendi, ama kanala hiçbir şey gönderilmedi. Neden?">
    Önce teslim modunu kontrol edin:

    - `--no-deliver` / `delivery.mode: "none"` ayarı, runner fallback gönderiminin beklenmediği anlamına gelir.
    - Eksik veya geçersiz bildirim hedefi (`channel` / `to`), runner'ın giden teslimi atlaması anlamına gelir.
    - Kanal auth hataları (`unauthorized`, `Forbidden`), runner'ın teslim etmeyi denediğini ama kimlik bilgilerinin bunu engellediğini gösterir.
    - Sessiz yalıtılmış sonuç (`NO_REPLY` / `no_reply` yalnızca) kasıtlı olarak teslim edilemez kabul edilir; bu yüzden runner kuyruklu fallback teslimini de bastırır.

    Yalıtılmış Cron işleri için, bir sohbet yolu mevcut olduğunda ajan yine de `message`
    aracıyla doğrudan gönderebilir. `--announce`, yalnızca ajanın zaten göndermediği
    nihai metin için runner fallback yolunu kontrol eder.

    Hata ayıklama:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Belgeler: [Cron işleri](/tr/automation/cron-jobs), [Arka Plan Görevleri](/tr/automation/tasks).

  </Accordion>

  <Accordion title="Yalıtılmış bir Cron çalıştırması neden model değiştirdi veya bir kez yeniden denedi?">
    Bu genellikle yinelenen zamanlama değil, canlı model değiştirme yoludur.

    Yalıtılmış Cron, etkin
    çalıştırma `LiveSessionModelSwitchError` fırlattığında çalışma zamanı model devrini kalıcılaştırabilir ve yeniden deneyebilir. Yeniden deneme, değiştirilen
    sağlayıcıyı/modeli korur ve değişiklik yeni bir auth profile geçersiz kılması taşıyorsa Cron
    bunu da yeniden denemeden önce kalıcılaştırır.

    İlgili seçim kuralları:

    - Uygun olduğunda önce Gmail hook model geçersiz kılması kazanır.
    - Sonra iş başına `model`.
    - Sonra saklanan herhangi bir Cron oturumu model geçersiz kılması.
    - Sonra normal ajan/varsayılan model seçimi.

    Yeniden deneme döngüsü sınırlıdır. İlk deneme artı 2 değiştirme yeniden denemesinden sonra
    Cron sonsuza kadar döngüye girmek yerine iptal eder.

    Hata ayıklama:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Belgeler: [Cron işleri](/tr/automation/cron-jobs), [Cron CLI](/tr/cli/cron).

  </Accordion>

  <Accordion title="Linux'ta Skills'i nasıl kurarım?">
    Yerel `openclaw skills` komutlarını kullanın veya Skills'i çalışma alanınıza bırakın. macOS Skills UI, Linux'ta mevcut değildir.
    Skills'e [https://clawhub.ai](https://clawhub.ai) üzerinden göz atın.

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

    Yerel `openclaw skills install`, etkin çalışma alanı `skills/`
    dizinine yazar. Ayrı `clawhub` CLI'yi yalnızca kendi Skills'inizi yayımlamak veya
    senkronize etmek istiyorsanız kurun. Ajanlar arası paylaşılan kurulumlar için Skill'i
    `~/.openclaw/skills` altına koyun ve hangi ajanların görebileceğini daraltmak istiyorsanız `agents.defaults.skills` veya
    `agents.list[].skills` kullanın.

  </Accordion>

  <Accordion title="OpenClaw görevleri zamanlanmış olarak veya arka planda sürekli çalıştırabilir mi?">
    Evet. Gateway zamanlayıcısını kullanın:

    - Zamanlanmış veya yinelenen görevler için **Cron işleri** (yeniden başlatmalarda korunur).
    - "Ana oturum" periyodik kontrolleri için **Heartbeat**.
    - Özet gönderen veya sohbetlere teslim eden otonom ajanlar için **Yalıtılmış işler**.

    Belgeler: [Cron işleri](/tr/automation/cron-jobs), [Otomasyon ve Görevler](/tr/automation),
    [Heartbeat](/tr/gateway/heartbeat).

  </Accordion>

  <Accordion title="Apple macOS'e özel Skills'i Linux'tan çalıştırabilir miyim?">
    Doğrudan hayır. macOS Skills'leri `metadata.openclaw.os` ve gerekli ikili dosyalarla geçitlenir ve Skills yalnızca **Gateway host** üzerinde uygun olduğunda sistem isteminde görünür. Linux'ta `darwin`-yalnızca Skills'ler (`apple-notes`, `apple-reminders`, `things-mac` gibi), geçitlemeyi geçersiz kılmadıkça yüklenmez.

    Desteklenen üç deseniniz var:

    **Seçenek A - Gateway'i Mac üzerinde çalıştırın (en kolayı).**
    Gateway'i macOS ikili dosyalarının bulunduğu yerde çalıştırın, sonra Linux'tan [uzak modda](#gateway-ports-already-running-and-remote-mode) veya Tailscale üzerinden bağlanın. Skills normal yüklenir çünkü Gateway host'u macOS'tir.

    **Seçenek B - macOS Node kullanın (SSH yok).**
    Gateway'i Linux'ta çalıştırın, bir macOS Node'u (menü çubuğu uygulaması) eşleştirin ve Mac üzerinde **Node Run Commands** ayarını "Always Ask" veya "Always Allow" yapın. OpenClaw, gerekli ikili dosyalar Node üzerinde mevcut olduğunda macOS'e özel Skills'leri uygun kabul edebilir. Ajan bu Skills'leri `nodes` aracıyla çalıştırır. "Always Ask" seçerseniz, istemde "Always Allow" onayı bu komutu izin listesine ekler.

    **Seçenek C - macOS ikili dosyalarını SSH üzerinden proxy'leyin (ileri düzey).**
    Gateway'i Linux'ta tutun, ancak gerekli CLI ikili dosyalarının bir Mac üzerinde çalışan SSH sarmalayıcılarına çözümlenmesini sağlayın. Sonra Skill'i Linux'a izin verecek şekilde geçersiz kılın; böylece uygun kalır.

    1. İkili dosya için bir SSH sarmalayıcısı oluşturun (örnek: Apple Notes için `memo`):

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. Sarmalayıcıyı Linux host üzerinde `PATH` içine koyun (örneğin `~/bin/memo`).
    3. Skill meta verilerini (çalışma alanı veya `~/.openclaw/skills`) Linux'a izin verecek şekilde geçersiz kılın:

       ```markdown
       ---
       name: apple-notes
       description: Manage Apple Notes via the memo CLI on macOS.
       metadata: { "openclaw": { "os": ["darwin", "linux"], "requires": { "bins": ["memo"] } } }
       ---
       ```

    4. Skills anlık görüntüsü yenilensin diye yeni bir oturum başlatın.

  </Accordion>

  <Accordion title="Notion veya HeyGen entegrasyonunuz var mı?">
    Bugün yerleşik olarak yok.

    Seçenekler:

    - **Özel Skill / Plugin:** güvenilir API erişimi için en iyisi (Notion/HeyGen ikisinin de API'si var).
    - **Tarayıcı otomasyonu:** kod yazmadan çalışır ama daha yavaş ve daha kırılgandır.

    İstemci başına bağlam tutmak istiyorsanız (ajans iş akışları), basit bir desen şudur:

    - İstemci başına bir Notion sayfası (bağlam + tercihler + etkin iş).
    - Ajanınızdan oturum başında o sayfayı getirmesini isteyin.

    Yerel bir entegrasyon istiyorsanız bir özellik isteği açın veya bu API'leri
    hedefleyen bir Skill oluşturun.

    Skills kurun:

    ```bash
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    Yerel kurulumlar etkin çalışma alanı `skills/` dizinine gider. Ajanlar arası paylaşılan Skills için bunları `~/.openclaw/skills/<name>/SKILL.md` içine yerleştirin. Yalnızca bazı ajanlar paylaşılan kurulumu görmeliyse `agents.defaults.skills` veya `agents.list[].skills` yapılandırın. Bazı Skills, Homebrew üzerinden kurulan ikili dosyalar bekler; Linux'ta bu Linuxbrew anlamına gelir (yukarıdaki Homebrew Linux SSS girdisine bakın). Bkz. [Skills](/tr/tools/skills), [Skills yapılandırması](/tr/tools/skills-config) ve [ClawHub](/tr/tools/clawhub).

  </Accordion>

  <Accordion title="Mevcut oturum açılmış Chrome'umu OpenClaw ile nasıl kullanırım?">
    Chrome DevTools MCP üzerinden bağlanan yerleşik `user` browser profile'ını kullanın:

    ```bash
    openclaw browser --browser-profile user tabs
    openclaw browser --browser-profile user snapshot
    ```

    Özel bir ad istiyorsanız açık bir MCP profile'ı oluşturun:

    ```bash
    openclaw browser create-profile --name chrome-live --driver existing-session
    openclaw browser --browser-profile chrome-live tabs
    ```

    Bu yol yerel host browser'ı veya bağlı bir browser node'u kullanabilir. Gateway başka bir yerde çalışıyorsa ya browser makinesinde bir node host çalıştırın ya da uzak CDP kullanın.

    `existing-session` / `user` için mevcut sınırlamalar:

    - eylemler CSS-selector odaklı değil, ref odaklıdır
    - yüklemeler `ref` / `inputRef` gerektirir ve şu anda aynı anda bir dosyayı destekler
    - `responsebody`, PDF dışa aktarma, indirme yakalama ve toplu eylemler hâlâ yönetilen browser veya ham CDP profile'ı gerektirir

  </Accordion>
</AccordionGroup>

## Sandboxing ve bellek

<AccordionGroup>
  <Accordion title="Ayrı bir sandboxing belgesi var mı?">
    Evet. Bkz. [Sandboxing](/tr/gateway/sandboxing). Docker'a özgü kurulum (Docker içinde tam gateway veya sandbox image'ları) için bkz. [Docker](/tr/install/docker).
  </Accordion>

  <Accordion title="Docker kısıtlı geliyor - tam özellikleri nasıl etkinleştiririm?">
    Varsayılan image güvenlik önceliklidir ve `node` kullanıcısı olarak çalışır, bu yüzden
    sistem paketleri, Homebrew veya paketlenmiş browser'lar içermez. Daha tam bir kurulum için:

    - Önbellekler korunsun diye `/home/node` dizinini `OPENCLAW_HOME_VOLUME` ile kalıcı yapın.
    - Sistem bağımlılıklarını `OPENCLAW_DOCKER_APT_PACKAGES` ile image içine gömün.
    - Paketlenmiş CLI ile Playwright browser'larını kurun:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - `PLAYWRIGHT_BROWSERS_PATH` ayarlayın ve yolun kalıcı olduğundan emin olun.

    Belgeler: [Docker](/tr/install/docker), [Browser](/tr/tools/browser).

  </Accordion>

  <Accordion title="DM'leri kişisel tutup grupları herkese açık/sandboxed tek ajanla yapabilir miyim?">
    Evet — özel trafiğiniz **DM**, herkese açık trafiğiniz **grup** ise.

    Grup/kanal oturumları (main olmayan anahtarlar) yapılandırılmış sandbox backend'inde çalışırken ana DM oturumunun host üzerinde kalması için `agents.defaults.sandbox.mode: "non-main"` kullanın. Bir backend seçmezseniz Docker varsayılan backend olur. Sonra sandboxed oturumlarda hangi araçların kullanılabildiğini `tools.sandbox.tools` ile kısıtlayın.

    Kurulum adım adım anlatım + örnek yapılandırma: [Gruplar: kişisel DM'ler + herkese açık gruplar](/tr/channels/groups#pattern-personal-dms-public-groups-single-agent)

    Temel yapılandırma başvurusu: [Gateway yapılandırması](/tr/gateway/config-agents#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="Bir host klasörünü sandbox içine nasıl bağlarım?">
    `agents.defaults.sandbox.docker.binds` değerini `["host:path:mode"]` olarak ayarlayın (ör. `"/home/user/src:/src:ro"`). Genel + ajan başına bind'ler birleşir; ajan başına bind'ler `scope: "shared"` olduğunda yok sayılır. Hassas her şey için `:ro` kullanın ve bind'lerin sandbox dosya sistemi duvarlarını by-pass ettiğini unutmayın.

    OpenClaw, bind kaynaklarını hem normalleştirilmiş yola hem de en derin mevcut atadan çözümlenen kanonik yola göre doğrular. Bu, son yol segmenti henüz mevcut olmasa bile symlink-parent kaçışlarının yine fail-closed olacağı ve izin verilen kök denetimlerinin symlink çözümlemesinden sonra da uygulanacağı anlamına gelir.

    Örnekler ve güvenlik notları için bkz. [Sandboxing](/tr/gateway/sandboxing#custom-bind-mounts) ve [Sandbox vs Tool Policy vs Elevated](/tr/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check).

  </Accordion>

  <Accordion title="Bellek nasıl çalışır?">
    OpenClaw belleği, ajan çalışma alanındaki Markdown dosyalarından ibarettir:

    - `memory/YYYY-MM-DD.md` içindeki günlük notlar
    - `MEMORY.md` içindeki özenle seçilmiş uzun vadeli notlar (yalnızca ana/özel oturumlar)

    OpenClaw ayrıca sessiz bir **Compaction öncesi bellek boşaltması** çalıştırır; bu, modele
    otomatik Compaction'dan önce dayanıklı notlar yazmasını hatırlatır. Bu yalnızca çalışma alanı
    yazılabilir olduğunda çalışır (salt okunur sandbox'lar bunu atlar). Bkz. [Bellek](/tr/concepts/memory).

  </Accordion>

  <Accordion title="Bellek sürekli unutuyor. Nasıl kalıcı yaparım?">
    Bota **gerçeği belleğe yazmasını** söyleyin. Uzun vadeli notlar `MEMORY.md` içine,
    kısa vadeli bağlam `memory/YYYY-MM-DD.md` içine gitmelidir.

    Bu hâlâ geliştirdiğimiz bir alan. Modelle, anıları saklamasını hatırlatmak yardımcı olur;
    ne yapacağını bilir. Hâlâ unutuyorsa Gateway'in her çalıştırmada aynı
    çalışma alanını kullandığını doğrulayın.

    Belgeler: [Bellek](/tr/concepts/memory), [Ajan çalışma alanı](/tr/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Bellek sonsuza kadar kalır mı? Sınırlar nelerdir?">
    Bellek dosyaları diskte yaşar ve siz silene kadar kalır. Sınır model değil,
    depolama alanınızdır. **Oturum bağlamı** yine modelin bağlam penceresi ile sınırlıdır;
    bu yüzden uzun konuşmalar Compaction veya truncation yaşayabilir. İşte bu nedenle
    bellek araması vardır — yalnızca ilgili parçaları yeniden bağlama çeker.

    Belgeler: [Bellek](/tr/concepts/memory), [Bağlam](/tr/concepts/context).

  </Accordion>

  <Accordion title="Anlamsal bellek araması bir OpenAI API anahtarı gerektirir mi?">
    Yalnızca **OpenAI embeddings** kullanıyorsanız. Codex OAuth, sohbet/tamamlamaları kapsar ve
    embeddings erişimi vermez; bu yüzden **Codex ile oturum açmak (OAuth veya
    Codex CLI girişi)** anlamsal bellek aramasına yardımcı olmaz. OpenAI embeddings
    için yine gerçek bir API anahtarı gerekir (`OPENAI_API_KEY` veya `models.providers.openai.apiKey`).

    Bir sağlayıcıyı açıkça ayarlamazsanız OpenClaw, bir API anahtarını çözümleyebildiğinde
    otomatik olarak bir sağlayıcı seçer (auth profile'ları, `models.providers.*.apiKey` veya env değişkenleri).
    Bir OpenAI anahtarı çözülürse OpenAI'yi, aksi halde bir Gemini anahtarı
    çözülürse Gemini'yi, sonra Voyage'ı, sonra Mistral'ı tercih eder. Uzak bir anahtar
    yoksa siz yapılandırana kadar bellek araması devre dışı kalır. Yapılandırılmış ve mevcut bir yerel model yolunuz varsa OpenClaw
    `local` seçeneğini tercih eder. Açıkça
    `memorySearch.provider = "ollama"` ayarladığınızda Ollama desteklenir.

    Yerel kalmak isterseniz `memorySearch.provider = "local"` ayarlayın (ve isteğe bağlı olarak
    `memorySearch.fallback = "none"`). Gemini embeddings istiyorsanız
    `memorySearch.provider = "gemini"` ayarlayın ve `GEMINI_API_KEY` (veya
    `memorySearch.remote.apiKey`) sağlayın. **OpenAI, Gemini, Voyage, Mistral, Ollama veya local** embedding
    modellerini destekliyoruz — kurulum ayrıntıları için [Bellek](/tr/concepts/memory) bölümüne bakın.

  </Accordion>
</AccordionGroup>

## Diske neler nereye yazılır

<AccordionGroup>
  <Accordion title="OpenClaw ile kullanılan tüm veriler yerel olarak mı kaydedilir?">
    Hayır — **OpenClaw'ın durumu yereldir**, ama **harici servisler onlara gönderdiğiniz şeyleri yine görür**.

    - **Varsayılan olarak yerel:** oturumlar, bellek dosyaları, yapılandırma ve çalışma alanı Gateway host üzerinde yaşar
      (`~/.openclaw` + çalışma alanı dizininiz).
    - **Zorunlu olarak uzak:** model sağlayıcılarına (Anthropic/OpenAI/vb.) gönderdiğiniz mesajlar
      onların API'lerine gider ve sohbet platformları (WhatsApp/Telegram/Slack/vb.) mesaj verilerini
      kendi sunucularında saklar.
    - **Ayak izini siz kontrol edersiniz:** yerel modeller kullanmak istemleri makinenizde tutar, ancak kanal
      trafiği yine kanalın sunucularından geçer.

    İlgili: [Ajan çalışma alanı](/tr/concepts/agent-workspace), [Bellek](/tr/concepts/memory).

  </Accordion>

  <Accordion title="OpenClaw verilerini nerede saklar?">
    Her şey `$OPENCLAW_STATE_DIR` altında yaşar (varsayılan: `~/.openclaw`):

    | Yol                                                             | Amaç                                                               |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | Ana yapılandırma (JSON5)                                           |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | Eski OAuth içe aktarımı (ilk kullanımda auth profile'larına kopyalanır) |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | Auth profile'ları (OAuth, API anahtarları ve isteğe bağlı `keyRef`/`tokenRef`) |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | `file` SecretRef sağlayıcıları için isteğe bağlı dosya destekli gizli bilgi payload'ı |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | Eski uyumluluk dosyası (statik `api_key` girdileri temizlenir)     |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | Sağlayıcı durumu (ör. `whatsapp/<accountId>/creds.json`)           |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | Ajan başına durum (agentDir + oturumlar)                           |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | Konuşma geçmişi ve durumu (ajan başına)                            |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | Oturum meta verileri (ajan başına)                                 |

    Eski tek ajan yolu: `~/.openclaw/agent/*` (`openclaw doctor` tarafından geçirilir).

    **Çalışma alanınız** (`AGENTS.md`, bellek dosyaları, Skills vb.) ayrıdır ve `agents.defaults.workspace` ile yapılandırılır (varsayılan: `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title="AGENTS.md / SOUL.md / USER.md / MEMORY.md nerede yaşamalı?">
    Bu dosyalar `~/.openclaw` içinde değil, **ajan çalışma alanında** yaşar.

    - **Çalışma alanı (ajan başına)**: `AGENTS.md`, `SOUL.md`, `IDENTITY.md`, `USER.md`,
      `MEMORY.md`, `memory/YYYY-MM-DD.md`, isteğe bağlı `HEARTBEAT.md`.
      Küçük harfli kök `memory.md` yalnızca eski onarım girdisidir; `openclaw doctor --fix`
      her iki dosya mevcut olduğunda bunu `MEMORY.md` içine birleştirebilir.
    - **Durum dizini (`~/.openclaw`)**: yapılandırma, kanal/sağlayıcı durumu, auth profile'ları, oturumlar, günlükler
      ve paylaşılan Skills (`~/.openclaw/skills`).

    Varsayılan çalışma alanı `~/.openclaw/workspace`'tir, şu yolla yapılandırılabilir:

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    Bot yeniden başlatmadan sonra "unutuyorsa", Gateway'in her başlatmada aynı
    çalışma alanını kullandığını doğrulayın (ve unutmayın: uzak mod **yerel laptop'unuzun** değil,
    **gateway host'unun** çalışma alanını kullanır).

    İpucu: dayanıklı bir davranış veya tercih istiyorsanız, sohbet geçmişine güvenmek yerine bottan bunu **AGENTS.md veya MEMORY.md içine yazmasını**
    isteyin.

    Bkz. [Ajan çalışma alanı](/tr/concepts/agent-workspace) ve [Bellek](/tr/concepts/memory).

  </Accordion>

  <Accordion title="Önerilen yedekleme stratejisi">
    **Ajan çalışma alanınızı**, **özel** bir git deposuna koyun ve bunu özel bir yere
    yedekleyin (örneğin GitHub private). Bu, bellek + AGENTS/SOUL/USER
    dosyalarını yakalar ve asistanın "zihnini" daha sonra geri yüklemenizi sağlar.

    `~/.openclaw` altındaki hiçbir şeyi commit etmeyin (kimlik bilgileri, oturumlar, token'lar veya şifrelenmiş gizli bilgi payload'ları).
    Tam geri yükleme gerekiyorsa, çalışma alanını ve durum dizinini
    ayrı ayrı yedekleyin (yukarıdaki taşıma sorusuna bakın).

    Belgeler: [Ajan çalışma alanı](/tr/concepts/agent-workspace).

  </Accordion>

  <Accordion title="OpenClaw'ı tamamen nasıl kaldırırım?">
    Ayrı kılavuza bakın: [Kaldırma](/tr/install/uninstall).
  </Accordion>

  <Accordion title="Ajanlar çalışma alanı dışında çalışabilir mi?">
    Evet. Çalışma alanı, katı bir sandbox değil, **varsayılan cwd** ve bellek çıpasıdır.
    Göreli yollar çalışma alanı içinde çözülür, ancak mutlak yollar başka
    host konumlarına erişebilir; sandboxing etkin değilse. Yalıtım gerekiyorsa
    [`agents.defaults.sandbox`](/tr/gateway/sandboxing) veya ajan başına sandbox ayarlarını kullanın. Bir
    deponun varsayılan çalışma dizini olmasını istiyorsanız o ajanın
    `workspace` değerini depo köküne yönlendirin. OpenClaw deposu yalnızca kaynak koddur; ajanın bilinçli olarak içinde çalışmasını istemiyorsanız
    çalışma alanını ondan ayrı tutun.

    Örnek (depo varsayılan cwd olarak):

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
    Oturum durumu **gateway host'una** aittir. Uzak moddaysanız ilgilendiğiniz oturum deposu yerel laptop'unuzda değil, uzak makinededir. Bkz. [Oturum yönetimi](/tr/concepts/session).
  </Accordion>
</AccordionGroup>

## Yapılandırma temelleri

<AccordionGroup>
  <Accordion title="Yapılandırma hangi biçimde? Nerede?">
    OpenClaw, `$OPENCLAW_CONFIG_PATH` konumundan isteğe bağlı bir **JSON5** yapılandırması okur (varsayılan: `~/.openclaw/openclaw.json`):

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    Dosya yoksa güvenli sayılabilecek varsayılanları kullanır (varsayılan çalışma alanı olarak `~/.openclaw/workspace` dahil).

  </Accordion>

  <Accordion title='gateway.bind: "lan" (veya "tailnet") ayarladım ve şimdi hiçbir şey dinlemiyor / UI unauthorized diyor'>
    Loopback dışı bind'ler **geçerli bir gateway auth yolu** gerektirir. Pratikte bu şu anlama gelir:

    - paylaşılan gizli bilgi auth'u: token veya parola
    - doğru yapılandırılmış, loopback dışı, kimlik farkındalıklı ters proxy arkasında `gateway.auth.mode: "trusted-proxy"`

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

    - `gateway.remote.token` / `.password`, yerel gateway auth'unu tek başına etkinleştirmez.
    - Yerel çağrı yolları, yalnızca `gateway.auth.*` ayarlı değilse fallback olarak `gateway.remote.*` kullanabilir.
    - Parola auth'u için bunun yerine `gateway.auth.mode: "password"` ile birlikte `gateway.auth.password` (veya `OPENCLAW_GATEWAY_PASSWORD`) ayarlayın.
    - `gateway.auth.token` / `gateway.auth.password` açıkça SecretRef ile yapılandırılmış ve çözümlenmemişse çözümleme fail-closed olur (uzak fallback bunu maskeleyemez).
    - Paylaşılan gizli bilgi Control UI kurulumları, `connect.params.auth.token` veya `connect.params.auth.password` üzerinden kimlik doğrular (uygulama/UI ayarlarında saklanır). Tailscale Serve veya `trusted-proxy` gibi kimlik taşıyan modlar bunun yerine istek header'ları kullanır. Paylaşılan gizli bilgileri URL'lere koymaktan kaçının.
    - `gateway.auth.mode: "trusted-proxy"` ile aynı host üzerindeki loopback ters proxy'ler yine de trusted-proxy auth'unu karşılamaz. Güvenilen proxy, yapılandırılmış loopback dışı bir kaynak olmalıdır.

  </Accordion>

  <Accordion title="Neden artık localhost'ta bir token'a ihtiyacım var?">
    OpenClaw, loopback dahil varsayılan olarak gateway auth zorunluluğu uygular. Normal varsayılan yolda bu token auth anlamına gelir: açık bir auth yolu yapılandırılmamışsa gateway başlangıcı token moduna çözülür ve otomatik olarak bir tane üretip bunu `gateway.auth.token` içine kaydeder; bu yüzden **yerel WS istemcilerinin kimlik doğrulaması yapması gerekir**. Bu, diğer yerel süreçlerin Gateway'i çağırmasını engeller.

    Farklı bir auth yolu tercih ederseniz parola modunu (veya loopback dışı kimlik farkındalıklı ters proxy'ler için `trusted-proxy`) açıkça seçebilirsiniz. **Gerçekten** açık loopback istiyorsanız yapılandırmanızda `gateway.auth.mode: "none"` değerini açıkça ayarlayın. Doctor sizin için herhangi bir zamanda token oluşturabilir: `openclaw doctor --generate-gateway-token`.

  </Accordion>

  <Accordion title="Yapılandırmayı değiştirdikten sonra yeniden başlatmam gerekir mi?">
    Gateway yapılandırmayı izler ve hot-reload destekler:

    - `gateway.reload.mode: "hybrid"` (varsayılan): güvenli değişiklikleri hot-apply eder, kritik olanlar için yeniden başlatır
    - `hot`, `restart`, `off` da desteklenir

  </Accordion>

  <Accordion title="Komik CLI sloganlarını nasıl kapatırım?">
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

    - `off`: slogan metnini gizler ama banner başlık/sürüm satırını korur.
    - `default`: her zaman `All your chats, one OpenClaw.` kullanır.
    - `random`: dönen komik/mevsimsel sloganlar (varsayılan davranış).
    - Hiç banner istemiyorsanız env `OPENCLAW_HIDE_BANNER=1` ayarlayın.

  </Accordion>

  <Accordion title="Web aramasını (ve web fetch'i) nasıl etkinleştiririm?">
    `web_fetch`, API anahtarı olmadan çalışır. `web_search`, seçtiğiniz
    sağlayıcıya bağlıdır:

    - Brave, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Perplexity ve Tavily gibi API destekli sağlayıcılar normal API anahtarı kurulumlarını gerektirir.
    - Ollama Web Search anahtarsızdır, ancak yapılandırılmış Ollama host'unuzu kullanır ve `ollama signin` gerektirir.
    - DuckDuckGo anahtarsızdır, ama resmi olmayan HTML tabanlı bir entegrasyondur.
    - SearXNG anahtarsız/self-hosted'dir; `SEARXNG_BASE_URL` veya `plugins.entries.searxng.config.webSearch.baseUrl` yapılandırın.

    **Önerilen:** `openclaw configure --section web` çalıştırın ve bir sağlayıcı seçin.
    Ortam değişkeni alternatifleri:

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
              provider: "firecrawl", // isteğe bağlı; otomatik algılama için belirtmeyin
            },
          },
        },
    }
    ```

    Sağlayıcıya özgü web-search yapılandırması artık `plugins.entries.<plugin>.config.webSearch.*` altında yaşar.
    Eski `tools.web.search.*` sağlayıcı yolları uyumluluk için geçici olarak hâlâ yüklenir, ancak yeni yapılandırmalarda kullanılmamalıdır.
    Firecrawl web-fetch fallback yapılandırması `plugins.entries.firecrawl.config.webFetch.*` altında yaşar.

    Notlar:

    - İzin listeleri kullanıyorsanız `web_search`/`web_fetch`/`x_search` veya `group:web` ekleyin.
    - `web_fetch` varsayılan olarak etkindir (açıkça devre dışı bırakılmadıkça).
    - `tools.web.fetch.provider` belirtilmezse OpenClaw, kullanılabilir kimlik bilgilerinden ilk hazır fetch fallback sağlayıcısını otomatik algılar. Bugün paketlenmiş sağlayıcı Firecrawl'dur.
    - Daemon'lar env değişkenlerini `~/.openclaw/.env` (veya servis ortamı) üzerinden okur.

    Belgeler: [Web araçları](/tr/tools/web).

  </Accordion>

  <Accordion title="config.apply yapılandırmamı sildi. Nasıl kurtarırım ve bunu nasıl önlerim?">
    `config.apply`, **tüm yapılandırmayı** değiştirir. Kısmi bir nesne gönderirseniz
    diğer her şey kaldırılır.

    Geçerli OpenClaw, birçok kazara clobber durumunu korur:

    - OpenClaw'a ait yapılandırma yazımları, yazmadan önce değişiklik sonrası tam yapılandırmayı doğrular.
    - Geçersiz veya yıkıcı OpenClaw'a ait yazımlar reddedilir ve `openclaw.json.rejected.*` olarak kaydedilir.
    - Doğrudan bir düzenleme başlangıcı veya hot reload'u bozarsa Gateway son bilinen iyi yapılandırmayı geri yükler ve reddedilen dosyayı `openclaw.json.clobbered.*` olarak kaydeder.
    - Kurtarmadan sonra ana ajan bir başlangıç uyarısı alır; böylece bozuk yapılandırmayı yeniden körlemesine yazmaz.

    Kurtarma:

    - `openclaw logs --follow` içinde `Config auto-restored from last-known-good`, `Config write rejected:` veya `config reload restored last-known-good config` mesajlarını kontrol edin.
    - Etkin yapılandırmanın yanında en yeni `openclaw.json.clobbered.*` veya `openclaw.json.rejected.*` dosyasını inceleyin.
    - Etkin geri yüklenen yapılandırma çalışıyorsa bunu koruyun, ardından yalnızca amaçlanan anahtarları `openclaw config set` veya `config.patch` ile geri kopyalayın.
    - `openclaw config validate` ve `openclaw doctor` çalıştırın.
    - Son bilinen iyi veya reddedilen payload yoksa yedekten geri yükleyin veya `openclaw doctor`'ı yeniden çalıştırıp kanalları/modelleri yeniden yapılandırın.
    - Bu beklenmedikse bir hata bildirimi açın ve son bilinen yapılandırmanızı veya herhangi bir yedeği ekleyin.
    - Yerel bir kodlama ajanı çoğu zaman günlüklerden veya geçmişten çalışan bir yapılandırmayı yeniden kurabilir.

    Önleme:

    - Küçük değişiklikler için `openclaw config set` kullanın.
    - Etkileşimli düzenlemeler için `openclaw configure` kullanın.
    - Tam yol veya alan şeklinden emin değilseniz önce `config.schema.lookup` kullanın; bu size sığ bir şema düğümü ve drill-down için doğrudan alt özetler döndürür.
    - Kısmi RPC düzenlemeleri için `config.patch` kullanın; `config.apply` yalnızca tam yapılandırma değişimi için kalsın.
    - Bir ajan çalıştırmasından sahip-yalnızca `gateway` aracını kullanıyorsanız, bu araç yine de `tools.exec.ask` / `tools.exec.security` üzerine yazımları reddeder (aynı korumalı exec yollarına normalize olan eski `tools.bash.*` takma adları dahil).

    Belgeler: [Config](/tr/cli/config), [Configure](/tr/cli/configure), [Gateway sorun giderme](/tr/gateway/troubleshooting#gateway-restored-last-known-good-config), [Doctor](/tr/gateway/doctor).

  </Accordion>

  <Accordion title="Cihazlar arasında uzmanlaşmış işçilerle merkezi bir Gateway'i nasıl çalıştırırım?">
    Yaygın desen **bir Gateway** (ör. Raspberry Pi) artı **Node'lar** ve **ajanlar** şeklindedir:

    - **Gateway (merkezi):** kanalları (Signal/WhatsApp), yönlendirmeyi ve oturumları sahiplenir.
    - **Node'lar (cihazlar):** Mac/iOS/Android çevre birimi olarak bağlanır ve yerel araçları açar (`system.run`, `canvas`, `camera`).
    - **Ajanlar (işçiler):** özel roller için ayrı zihinler/çalışma alanları (ör. "Hetzner ops", "Kişisel veriler").
    - **Alt ajanlar:** paralellik istediğinizde ana bir ajandan arka plan işi başlatır.
    - **TUI:** Gateway'e bağlanın ve ajanlar/oturumlar arasında geçiş yapın.

    Belgeler: [Node'lar](/tr/nodes), [Uzak erişim](/tr/gateway/remote), [Çoklu Ajan Yönlendirmesi](/tr/concepts/multi-agent), [Alt ajanlar](/tr/tools/subagents), [TUI](/tr/web/tui).

  </Accordion>

  <Accordion title="OpenClaw browser headless çalışabilir mi?">
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

    Varsayılan `false`'dur (headful). Headless bazı sitelerde anti-bot kontrollerini tetiklemeye daha yatkındır. Bkz. [Browser](/tr/tools/browser).

    Headless **aynı Chromium motorunu** kullanır ve çoğu otomasyon için çalışır (formlar, tıklamalar, scraping, girişler). Ana farklar:

    - Görünür browser penceresi yoktur (görsellere ihtiyacınız varsa ekran görüntüsü kullanın).
    - Bazı siteler headless modda otomasyona karşı daha katıdır (CAPTCHA'lar, anti-bot).
      Örneğin X/Twitter çoğu zaman headless oturumları engeller.

  </Accordion>

  <Accordion title="Browser kontrolü için Brave'i nasıl kullanırım?">
    `browser.executablePath` değerini Brave ikili dosyanıza (veya herhangi bir Chromium tabanlı browser'a) ayarlayın ve Gateway'i yeniden başlatın.
    Tam yapılandırma örnekleri için [Browser](/tr/tools/browser#use-brave-or-another-chromium-based-browser) bölümüne bakın.
  </Accordion>
</AccordionGroup>

## Uzak gateway'ler ve Node'lar

<AccordionGroup>
  <Accordion title="Komutlar Telegram, gateway ve Node'lar arasında nasıl yayılır?">
    Telegram mesajları **gateway** tarafından işlenir. Gateway ajanı çalıştırır ve
    yalnızca bir Node aracı gerektiğinde **Gateway WebSocket** üzerinden Node'ları çağırır:

    Telegram → Gateway → Ajan → `node.*` → Node → Gateway → Telegram

    Node'lar gelen sağlayıcı trafiğini görmez; yalnızca node RPC çağrılarını alırlar.

  </Accordion>

  <Accordion title="Gateway uzakta barındırılıyorsa ajanım bilgisayarıma nasıl erişebilir?">
    Kısa cevap: **bilgisayarınızı Node olarak eşleştirin**. Gateway başka bir yerde çalışır, ancak
    yerel makinenizde `node.*` araçlarını (ekran, kamera, sistem) Gateway WebSocket üzerinden çağırabilir.

    Tipik kurulum:

    1. Gateway'i her zaman açık host üzerinde çalıştırın (VPS/ev sunucusu).
    2. Gateway host'unu + bilgisayarınızı aynı tailnet üzerine koyun.
    3. Gateway WS'nin erişilebilir olduğundan emin olun (tailnet bind veya SSH tüneli).
    4. macOS uygulamasını yerelde açın ve **Remote over SSH** modunda (veya doğrudan tailnet ile)
       bağlanın; böylece Node olarak kayıt olabilir.
    5. Node'u Gateway üzerinde onaylayın:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Ayrı bir TCP köprüsü gerekmez; Node'lar Gateway WebSocket üzerinden bağlanır.

    Güvenlik hatırlatması: bir macOS Node'u eşleştirmek o makinede `system.run` yetkisi verir. Yalnızca güvendiğiniz cihazları
    eşleştirin ve [Güvenlik](/tr/gateway/security) bölümünü inceleyin.

    Belgeler: [Node'lar](/tr/nodes), [Gateway protokolü](/tr/gateway/protocol), [macOS uzak modu](/tr/platforms/mac/remote), [Güvenlik](/tr/gateway/security).

  </Accordion>

  <Accordion title="Tailscale bağlı ama yanıt alamıyorum. Şimdi ne yapmalıyım?">
    Temelleri kontrol edin:

    - Gateway çalışıyor mu: `openclaw gateway status`
    - Gateway sağlığı: `openclaw status`
    - Kanal sağlığı: `openclaw channels status`

    Sonra auth ve yönlendirmeyi doğrulayın:

    - Tailscale Serve kullanıyorsanız `gateway.auth.allowTailscale` ayarının doğru olduğundan emin olun.
    - SSH tüneli üzerinden bağlanıyorsanız yerel tünelin açık olduğunu ve doğru porta işaret ettiğini doğrulayın.
    - İzin listelerinizin (DM veya grup) hesabınızı içerdiğini doğrulayın.

    Belgeler: [Tailscale](/tr/gateway/tailscale), [Uzak erişim](/tr/gateway/remote), [Kanallar](/tr/channels).

  </Accordion>

  <Accordion title="İki OpenClaw örneği birbiriyle konuşabilir mi (yerel + VPS)?">
    Evet. Yerleşik bir "bottan bota" köprü yok, ama bunu birkaç
    güvenilir yolla bağlayabilirsiniz:

    **En basiti:** her iki botun da erişebildiği normal bir sohbet kanalı kullanın (Telegram/Slack/WhatsApp).
    Bot A'nın Bot B'ye mesaj göndermesini sağlayın, sonra Bot B normal şekilde yanıt versin.

    **CLI köprüsü (genel):** diğer Gateway'i çağıran bir script çalıştırın:
    `openclaw agent --message ... --deliver`, bunu diğer botun
    dinlediği bir sohbeti hedefleyerek yapın. Botlardan biri uzak VPS üzerindeyse CLI'nizi
    SSH/Tailscale üzerinden o uzak Gateway'e yönlendirin (bkz. [Uzak erişim](/tr/gateway/remote)).

    Örnek desen (hedef Gateway'e erişebilen bir makineden çalıştırın):

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    İpucu: iki botun sonsuz döngüye girmemesi için bir koruma ekleyin (yalnızca mention, kanal
    izin listeleri veya "bot mesajlarına yanıt verme" kuralı).

    Belgeler: [Uzak erişim](/tr/gateway/remote), [Agent CLI](/tr/cli/agent), [Ajan gönderimi](/tr/tools/agent-send).

  </Accordion>

  <Accordion title="Birden çok ajan için ayrı VPS'lere ihtiyacım var mı?">
    Hayır. Tek bir Gateway, her birinin kendi çalışma alanı, model varsayılanları
    ve yönlendirmesi olan birden çok ajan barındırabilir. Bu normal kurulumdur ve
    ajan başına bir VPS çalıştırmaktan çok daha ucuz ve basittir.

    Ayrı VPS'leri yalnızca sert yalıtıma (güvenlik sınırları) veya paylaşmak istemediğiniz çok
    farklı yapılandırmalara ihtiyacınız olduğunda kullanın. Bunun dışında tek bir Gateway tutun ve
    birden çok ajan veya alt ajan kullanın.

  </Accordion>

  <Accordion title="Kişisel laptop'umda bir Node kullanmanın, VPS'ten SSH kullanmaya göre bir avantajı var mı?">
    Evet — Node'lar uzak bir Gateway'den laptop'unuza ulaşmanın birinci sınıf yoludur ve
    shell erişiminden fazlasını açarlar. Gateway macOS/Linux üzerinde (Windows için WSL2 ile) çalışır ve
    hafiftir (küçük bir VPS veya Raspberry Pi sınıfı kutu yeterlidir; 4 GB RAM bolca yeter), bu yüzden yaygın
    bir kurulum her zaman açık bir host artı Node olarak laptop'unuzdur.

    - **Gelen SSH gerekmez.** Node'lar dışarı doğru Gateway WebSocket'e bağlanır ve cihaz eşleştirmesi kullanır.
    - **Daha güvenli yürütme denetimleri.** `system.run`, o laptop üzerindeki Node izin listeleri/onayları ile geçitlenir.
    - **Daha fazla cihaz aracı.** Node'lar `system.run`'a ek olarak `canvas`, `camera` ve `screen` açar.
    - **Yerel browser otomasyonu.** Gateway'i VPS'te tutun, ama browser makinede bir node host üzerinden Chrome'u yerelde çalıştırın veya host üzerindeki yerel Chrome'a Chrome MCP ile bağlanın.

    SSH, ad hoc shell erişimi için uygundur; ancak Node'lar devam eden ajan iş akışları ve
    cihaz otomasyonu için daha basittir.

    Belgeler: [Node'lar](/tr/nodes), [Nodes CLI](/tr/cli/nodes), [Browser](/tr/tools/browser).

  </Accordion>

  <Accordion title="Node'lar bir gateway servisi çalıştırır mı?">
    Hayır. Bilinçli olarak yalıtılmış profiller çalıştırmıyorsanız **bir host üzerinde yalnızca bir gateway**
    çalışmalıdır (bkz. [Birden çok gateway](/tr/gateway/multiple-gateways)). Node'lar gateway'e bağlanan çevre birimleridir
    (iOS/Android Node'ları veya menü çubuğu uygulamasında macOS "node mode"). Headless node
    host'ları ve CLI denetimi için bkz. [Node host CLI](/tr/cli/node).

    `gateway`, `discovery` ve `canvasHost` değişiklikleri için tam yeniden başlatma gerekir.

  </Accordion>

  <Accordion title="Yapılandırmayı uygulamak için bir API / RPC yolu var mı?">
    Evet.

    - `config.schema.lookup`: yazmadan önce sığ şema düğümü, eşleşen UI ipucu ve doğrudan alt özetleriyle tek bir yapılandırma alt ağacını inceleyin
    - `config.get`: geçerli anlık görüntüyü + hash'i al
    - `config.patch`: güvenli kısmi güncelleme (çoğu RPC düzenlemesi için tercih edilir); mümkün olduğunda hot-reload yapar ve gerektiğinde yeniden başlatır
    - `config.apply`: tam yapılandırmayı doğrular + değiştirir; mümkün olduğunda hot-reload yapar ve gerektiğinde yeniden başlatır
    - Sahip-yalnızca `gateway` çalışma zamanı aracı yine de `tools.exec.ask` / `tools.exec.security` yeniden yazımlarını reddeder; eski `tools.bash.*` takma adları aynı korumalı exec yollarına normalize olur

  </Accordion>

  <Accordion title="İlk kurulum için asgari makul yapılandırma">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    Bu, çalışma alanınızı ayarlar ve botu kimin tetikleyebileceğini kısıtlar.

  </Accordion>

  <Accordion title="Bir VPS üzerinde Tailscale'i nasıl kurar ve Mac'imden nasıl bağlanırım?">
    Asgari adımlar:

    1. **VPS üzerinde kurun + oturum açın**

       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```

    2. **Mac'inize kurun + oturum açın**
       - Tailscale uygulamasını kullanın ve aynı tailnet'e giriş yapın.
    3. **MagicDNS'i etkinleştirin (önerilir)**
       - Tailscale yönetici konsolunda MagicDNS'i etkinleştirin; böylece VPS kararlı bir ada sahip olur.
    4. **Tailnet host adını kullanın**
       - SSH: `ssh user@your-vps.tailnet-xxxx.ts.net`
       - Gateway WS: `ws://your-vps.tailnet-xxxx.ts.net:18789`

    SSH olmadan Control UI istiyorsanız VPS üzerinde Tailscale Serve kullanın:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Bu, gateway'i loopback'e bağlı tutar ve HTTPS'i Tailscale üzerinden açığa çıkarır. Bkz. [Tailscale](/tr/gateway/tailscale).

  </Accordion>

  <Accordion title="Bir Mac Node'u uzak bir Gateway'e (Tailscale Serve) nasıl bağlarım?">
    Serve, **Gateway Control UI + WS** açığa çıkarır. Node'lar aynı Gateway WS uç noktası üzerinden bağlanır.

    Önerilen kurulum:

    1. **VPS + Mac'in aynı tailnet üzerinde olduğundan emin olun**.
    2. **macOS uygulamasını Uzak modda kullanın** (SSH hedefi tailnet host adı olabilir).
       Uygulama Gateway portunu tüneller ve Node olarak bağlanır.
    3. **Node'u** gateway üzerinde onaylayın:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Belgeler: [Gateway protokolü](/tr/gateway/protocol), [Discovery](/tr/gateway/discovery), [macOS uzak modu](/tr/platforms/mac/remote).

  </Accordion>

  <Accordion title="İkinci bir laptop'a mı kurmalıyım yoksa sadece bir Node mu eklemeliyim?">
    İkinci laptop'ta yalnızca **yerel araçlara** (ekran/kamera/exec) ihtiyacınız varsa onu
    **Node** olarak ekleyin. Bu, tek bir Gateway tutar ve yinelenen yapılandırmadan kaçınır. Yerel Node araçları
    şu anda yalnızca macOS'ta vardır, ancak bunları başka işletim sistemlerine de genişletmeyi planlıyoruz.

    Yalnızca **sert yalıtıma** veya tamamen ayrı iki bota ihtiyacınız olduğunda ikinci bir Gateway kurun.

    Belgeler: [Node'lar](/tr/nodes), [Nodes CLI](/tr/cli/nodes), [Birden çok gateway](/tr/gateway/multiple-gateways).

  </Accordion>
</AccordionGroup>

## Env değişkenleri ve .env yükleme

<AccordionGroup>
  <Accordion title="OpenClaw ortam değişkenlerini nasıl yükler?">
    OpenClaw, env değişkenlerini üst süreçten (shell, launchd/systemd, CI vb.) okur ve ek olarak şunları yükler:

    - geçerli çalışma dizinindeki `.env`
    - `~/.openclaw/.env` içinden genel fallback `.env` (diğer adıyla `$OPENCLAW_STATE_DIR/.env`)

    Hiçbir `.env` dosyası mevcut env değişkenlerini geçersiz kılmaz.

    Yapılandırmada satır içi env değişkenleri de tanımlayabilirsiniz (yalnızca süreç env'inde eksikse uygulanır):

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

  <Accordion title="Gateway'i servis üzerinden başlattım ve env değişkenlerim kayboldu. Şimdi ne olacak?">
    İki yaygın düzeltme:

    1. Eksik anahtarları `~/.openclaw/.env` içine koyun; böylece servis shell env'inizi devralmasa bile bunlar alınır.
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

    Bu, giriş shell'inizi çalıştırır ve yalnızca beklenen eksik anahtarları içe aktarır (asla geçersiz kılmaz). Env değişkeni karşılıkları:
    `OPENCLAW_LOAD_SHELL_ENV=1`, `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`.

  </Accordion>

  <Accordion title='COPILOT_GITHUB_TOKEN ayarladım, ama model durumu "Shell env: off." gösteriyor. Neden?'>
    `openclaw models status`, **shell env içe aktarmasının** etkin olup olmadığını bildirir. "Shell env: off"
    ifadesi env değişkenlerinizin eksik olduğu anlamına gelmez — yalnızca OpenClaw'ın
    giriş shell'inizi otomatik yüklemeyeceği anlamına gelir.

    Gateway servis olarak çalışıyorsa (launchd/systemd), shell
    ortamınızı devralmaz. Bunu şu yollardan biriyle düzeltin:

    1. Token'ı `~/.openclaw/.env` içine koyun:

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. Veya shell içe aktarmayı etkinleştirin (`env.shellEnv.enabled: true`).
    3. Veya bunu yapılandırmanızdaki `env` bloğuna ekleyin (yalnızca eksikse uygulanır).

    Sonra gateway'i yeniden başlatın ve tekrar kontrol edin:

    ```bash
    openclaw models status
    ```

    Copilot token'ları `COPILOT_GITHUB_TOKEN` üzerinden okunur (`GH_TOKEN` / `GITHUB_TOKEN` da desteklenir).
    Bkz. [/concepts/model-providers](/tr/concepts/model-providers) ve [/environment](/tr/help/environment).

  </Accordion>
</AccordionGroup>

## Oturumlar ve birden çok sohbet

<AccordionGroup>
  <Accordion title="Yeni bir konuşmayı nasıl başlatırım?">
    `/new` veya `/reset` komutunu bağımsız bir mesaj olarak gönderin. Bkz. [Oturum yönetimi](/tr/concepts/session).
  </Accordion>

  <Accordion title="Hiç /new göndermezsem oturumlar otomatik sıfırlanır mı?">
    Oturumlar `session.idleMinutes` sonrasında sona erebilir, ancak bu varsayılan olarak **devre dışıdır** (varsayılan **0**).
    Boşta kalma süresiyle sona ermeyi etkinleştirmek için bunu pozitif bir değere ayarlayın. Etkinleştirildiğinde, boşta kalma süresinden sonraki **sonraki**
    mesaj o sohbet anahtarı için yeni bir oturum kimliği başlatır.
    Bu, transkriptleri silmez — yalnızca yeni bir oturum başlatır.

    ```json5
    {
      session: {
        idleMinutes: 240,
      },
    }
    ```

  </Accordion>

  <Accordion title="Bir OpenClaw örnekleri ekibi yapmanın bir yolu var mı (bir CEO ve birçok ajan)?">
    Evet, **çoklu ajan yönlendirmesi** ve **alt ajanlar** aracılığıyla. Bir koordinatör
    ajan ve kendi çalışma alanları ile modellerine sahip birkaç işçi ajan oluşturabilirsiniz.

    Bununla birlikte, bunu daha çok **eğlenceli bir deney** olarak görmek en iyisidir. Token açısından ağırdır ve çoğu zaman
    ayrı oturumları olan tek bir bot kullanmaktan daha verimsizdir. Tipik model,
    paralel işler için farklı oturumları olan, sizin konuştuğunuz tek bir bottur. Bu
    bot gerektiğinde alt ajanlar da başlatabilir.

    Belgeler: [Çoklu ajan yönlendirmesi](/tr/concepts/multi-agent), [Alt ajanlar](/tr/tools/subagents), [Agents CLI](/tr/cli/agents).

  </Accordion>

  <Accordion title="Bağlam neden görevin ortasında kesildi? Bunu nasıl önlerim?">
    Oturum bağlamı model penceresiyle sınırlıdır. Uzun sohbetler, büyük araç çıktıları veya çok sayıda
    dosya Compaction veya truncation tetikleyebilir.

    Yardımcı olanlar:

    - Bottan geçerli durumu özetlemesini ve bir dosyaya yazmasını isteyin.
    - Uzun görevlerden önce `/compact`, konu değiştirirken `/new` kullanın.
    - Önemli bağlamı çalışma alanında tutun ve bottan bunu yeniden okumasını isteyin.
    - Uzun veya paralel işler için alt ajanlar kullanın; böylece ana sohbet daha küçük kalır.
    - Bu sık oluyorsa daha büyük bağlam penceresine sahip bir model seçin.

  </Accordion>

  <Accordion title="OpenClaw'ı tamamen nasıl sıfırlarım ama kurulu tutarım?">
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

    - Onboarding, mevcut bir yapılandırma görürse **Reset** de sunar. Bkz. [Onboarding (CLI)](/tr/start/wizard).
    - Profiller kullandıysanız (`--profile` / `OPENCLAW_PROFILE`), her durum dizinini sıfırlayın (varsayılanlar `~/.openclaw-<profile>` şeklindedir).
    - Geliştirme sıfırlaması: `openclaw gateway --dev --reset` (yalnızca geliştirme; geliştirme yapılandırmasını + kimlik bilgilerini + oturumları + çalışma alanını siler).

  </Accordion>

  <Accordion title='"context too large" hataları alıyorum - nasıl sıfırlarım veya sıkıştırırım?'>
    Şunlardan birini kullanın:

    - **Compact** (konuşmayı korur ama eski turları özetler):

      ```
      /compact
      ```

      veya özeti yönlendirmek için `/compact <instructions>`.

    - **Reset** (aynı sohbet anahtarı için yeni oturum kimliği):

      ```
      /new
      /reset
      ```

    Bu olmaya devam ediyorsa:

    - Eski araç çıktısını kırpmak için **oturum budamayı** (`agents.defaults.contextPruning`) etkinleştirin veya ayarlayın.
    - Daha büyük bağlam penceresine sahip bir model kullanın.

    Belgeler: [Compaction](/tr/concepts/compaction), [Oturum budama](/tr/concepts/session-pruning), [Oturum yönetimi](/tr/concepts/session).

  </Accordion>

  <Accordion title='Neden "LLM request rejected: messages.content.tool_use.input field required" hatası görüyorum?'>
    Bu bir sağlayıcı doğrulama hatasıdır: model, gerekli
    `input` olmadan bir `tool_use` bloğu üretti. Genellikle oturum geçmişinin eski veya bozuk olduğu anlamına gelir (çoğu zaman uzun konulardan
    veya bir araç/şema değişikliğinden sonra).

    Düzeltme: `/new` ile yeni bir oturum başlatın (bağımsız mesaj).

  </Accordion>

  <Accordion title="Neden her 30 dakikada bir Heartbeat mesajları alıyorum?">
    Heartbeat'ler varsayılan olarak her **30 dakikada** bir çalışır (**OAuth auth** kullanırken **1 saat**). Bunları ayarlayın veya devre dışı bırakın:

    ```json5
    {
      agents: {
        defaults: {
          heartbeat: {
            every: "2h", // veya devre dışı bırakmak için "0m"
          },
        },
      },
    }
    ```

    `HEARTBEAT.md` varsa ama etkin olarak boşsa (yalnızca boş satırlar ve
    `# Heading` gibi markdown başlıkları içeriyorsa), OpenClaw API çağrılarını korumak için Heartbeat çalıştırmasını atlar.
    Dosya eksikse Heartbeat yine çalışır ve model ne yapacağına karar verir.

    Ajan başına geçersiz kılmalar `agents.list[].heartbeat` kullanır. Belgeler: [Heartbeat](/tr/gateway/heartbeat).

  </Accordion>

  <Accordion title='Bir WhatsApp grubuna bir "bot hesabı" eklemem gerekiyor mu?'>
    Hayır. OpenClaw **kendi hesabınızda** çalışır; yani siz gruptaysanız OpenClaw da onu görebilir.
    Varsayılan olarak, gönderenlere izin verene kadar grup yanıtları engellenir (`groupPolicy: "allowlist"`).

    Grup yanıtlarını yalnızca **siz** tetikleyebilin istiyorsanız:

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
    Seçenek 1 (en hızlı): günlükleri izleyin ve grupta bir test mesajı gönderin:

    ```bash
    openclaw logs --follow --json
    ```

    `@g.us` ile biten `chatId` (veya `from`) alanını arayın, örneğin:
    `1234567890-1234567890@g.us`.

    Seçenek 2 (zaten yapılandırılmış/izin listesine alınmışsa): yapılandırmadan grupları listeleyin:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    Belgeler: [WhatsApp](/tr/channels/whatsapp), [Directory](/tr/cli/directory), [Logs](/tr/cli/logs).

  </Accordion>

  <Accordion title="OpenClaw neden grupta yanıt vermiyor?">
    İki yaygın neden:

    - Mention geçitlemesi açık (varsayılan). Botu @mention ile etiketlemelisiniz (veya `mentionPatterns` ile eşleşmelidir).
    - `channels.whatsapp.groups` ayarını `"*"` olmadan yapılandırdınız ve grup izin listesinde değil.

    Bkz. [Gruplar](/tr/channels/groups) ve [Grup mesajları](/tr/channels/group-messages).

  </Accordion>

  <Accordion title="Gruplar/konular DM'lerle bağlam paylaşır mı?">
    Doğrudan sohbetler varsayılan olarak ana oturuma çöker. Gruplar/kanallar kendi oturum anahtarlarına sahiptir ve Telegram konuları / Discord konuları ayrı oturumlardır. Bkz. [Gruplar](/tr/channels/groups) ve [Grup mesajları](/tr/channels/group-messages).
  </Accordion>

  <Accordion title="Kaç çalışma alanı ve ajan oluşturabilirim?">
    Sabit sınır yok. Onlarcası (hatta yüzlercesi) sorun olmaz, ama şunlara dikkat edin:

    - **Disk büyümesi:** oturumlar + transkriptler `~/.openclaw/agents/<agentId>/sessions/` altında yaşar.
    - **Token maliyeti:** daha fazla ajan, daha fazla eşzamanlı model kullanımı demektir.
    - **Operasyon yükü:** ajan başına auth profile'ları, çalışma alanları ve kanal yönlendirmesi.

    İpuçları:

    - Ajan başına tek bir **etkin** çalışma alanı tutun (`agents.defaults.workspace`).
    - Disk büyürse eski oturumları budayın (JSONL veya store girdilerini silin).
    - Başıboş çalışma alanlarını ve profil uyumsuzluklarını görmek için `openclaw doctor` kullanın.

  </Accordion>

  <Accordion title="Aynı anda birden çok bot veya sohbet (Slack) çalıştırabilir miyim ve bunu nasıl kurmalıyım?">
    Evet. Birden çok yalıtılmış ajan çalıştırmak ve gelen mesajları
    kanal/hesap/eşe göre yönlendirmek için **Çoklu Ajan Yönlendirmesi** kullanın. Slack kanal olarak desteklenir ve belirli ajanlara bağlanabilir.

    Browser erişimi güçlüdür ama "insanın yapabildiği her şeyi yapar" anlamına gelmez — anti-bot, CAPTCHA'lar ve MFA
    yine otomasyonu engelleyebilir. En güvenilir browser kontrolü için host üzerinde yerel Chrome MCP kullanın
    veya browser'ı gerçekten çalıştıran makinede CDP kullanın.

    En iyi uygulama kurulumu:

    - Her zaman açık Gateway host'u (VPS/Mac mini).
    - Rol başına bir ajan (bindings).
    - Bu ajanlara bağlanmış Slack kanal(lar)ı.
    - Gerektiğinde Chrome MCP veya bir Node üzerinden yerel browser.

    Belgeler: [Çoklu Ajan Yönlendirmesi](/tr/concepts/multi-agent), [Slack](/tr/channels/slack),
    [Browser](/tr/tools/browser), [Node'lar](/tr/nodes).

  </Accordion>
</AccordionGroup>

## Modeller, failover ve auth profile'ları

Model SSS'si — varsayılanlar, seçim, takma adlar, geçiş, failover, auth profile'ları —
[Modeller SSS](/tr/help/faq-models) sayfasında yer alır.

## Gateway: portlar, "zaten çalışıyor" ve uzak mod

<AccordionGroup>
  <Accordion title="Gateway hangi portu kullanır?">
    `gateway.port`, tek birleştirilmiş WebSocket + HTTP portunu (Control UI, hook'lar vb.) kontrol eder.

    Öncelik:

    ```
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > varsayılan 18789
    ```

  </Accordion>

  <Accordion title='Neden openclaw gateway status "Runtime: running" ama "Connectivity probe: failed" diyor?'>
    Çünkü "running", **supervisor'un** görünümüdür (launchd/systemd/schtasks). Connectivity probe ise CLI'nin gerçekten gateway WebSocket'e bağlanmayı denemesidir.

    `openclaw gateway status` kullanın ve şu satırlara güvenin:

    - `Probe target:` (yoklamanın gerçekten kullandığı URL)
    - `Listening:` (portta gerçekte neyin bağlı olduğu)
    - `Last gateway error:` (süreç hayattayken port dinlemiyorsa en yaygın kök neden)

  </Accordion>

  <Accordion title='Neden openclaw gateway status "Config (cli)" ve "Config (service)" farklı gösteriyor?'>
    Servis bir yapılandırmayı çalıştırırken siz başka bir yapılandırma dosyasını düzenliyorsunuz (çoğunlukla bir `--profile` / `OPENCLAW_STATE_DIR` uyumsuzluğu).

    Düzeltme:

    ```bash
    openclaw gateway install --force
    ```

    Bunu, servisin kullanmasını istediğiniz aynı `--profile` / ortam ile çalıştırın.

  </Accordion>

  <Accordion title='"başka bir gateway örneği zaten dinliyor" ne anlama gelir?'>
    OpenClaw çalışma zamanı kilidini, başlangıçta WebSocket dinleyicisini hemen bağlayarak uygular (varsayılan `ws://127.0.0.1:18789`). Bağlama `EADDRINUSE` ile başarısız olursa başka bir örneğin zaten dinlediğini belirten `GatewayLockError` fırlatır.

    Düzeltme: diğer örneği durdurun, portu boşaltın veya `openclaw gateway --port <port>` ile çalıştırın.

  </Accordion>

  <Accordion title="OpenClaw'ı uzak modda nasıl çalıştırırım (istemci başka yerdeki bir Gateway'e bağlanır)?">
    `gateway.mode: "remote"` ayarlayın ve bir uzak WebSocket URL'sine yöneltin; isteğe bağlı olarak paylaşılan gizli bilgi uzak kimlik bilgileriyle birlikte:

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

    - `openclaw gateway`, yalnızca `gateway.mode` `local` olduğunda başlar (veya geçersiz kılma bayrağını geçerseniz).
    - macOS uygulaması yapılandırma dosyasını izler ve bu değerler değiştiğinde modları canlı olarak değiştirir.
    - `gateway.remote.token` / `.password`, yalnızca istemci tarafı uzak kimlik bilgileridir; kendi başlarına yerel gateway auth'u etkinleştirmezler.

  </Accordion>

  <Accordion title='Control UI "unauthorized" diyor (veya sürekli yeniden bağlanıyor). Şimdi ne yapmalıyım?'>
    Gateway auth yolunuz ve UI'nin auth yöntemi eşleşmiyor.

    Gerçekler (koddan):

    - Control UI, token'ı mevcut tarayıcı sekmesi oturumu ve seçilen gateway URL'si için `sessionStorage` içinde tutar; böylece aynı sekmedeki yenilemeler, uzun ömürlü localStorage token kalıcılığını geri yüklemeden çalışmaya devam eder.
    - `AUTH_TOKEN_MISMATCH` durumunda güvenilen istemciler, gateway yeniden deneme ipuçları döndürdüğünde (`canRetryWithDeviceToken=true`, `recommendedNextStep=retry_with_device_token`) önbelleğe alınmış cihaz token'ı ile sınırlı bir yeniden deneme yapabilir.
    - Bu önbellekli token yeniden denemesi artık cihaz token'ı ile birlikte saklanan önbelleğe alınmış onaylı kapsamları yeniden kullanır. Açık `deviceToken` / açık `scopes` çağıranlar yine istenen kapsam kümesini korur; önbellekten devralmaz.
    - Bu yeniden deneme yolu dışında bağlantı auth önceliği açık paylaşılan token/parola önce, sonra açık `deviceToken`, sonra saklanan cihaz token'ı, sonra bootstrap token'dır.
    - Bootstrap token kapsam denetimleri rol önekli yapılır. Yerleşik bootstrap operatör izin listesi yalnızca operatör isteklerini karşılar; Node veya operatör olmayan diğer roller kendi rol önekleri altında kapsam gerektirir.

    Düzeltme:

    - En hızlısı: `openclaw dashboard` (dashboard URL'sini yazdırır + kopyalar, açmayı dener; headless ise SSH ipucu gösterir).
    - Henüz token yoksa: `openclaw doctor --generate-gateway-token`.
    - Uzak moddaysanız önce tünel kurun: `ssh -N -L 18789:127.0.0.1:18789 user@host`, sonra `http://127.0.0.1:18789/` açın.
    - Paylaşılan gizli bilgi modu: `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` veya `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` ayarlayın, sonra Control UI ayarlarına eşleşen gizli bilgiyi yapıştırın.
    - Tailscale Serve modu: `gateway.auth.allowTailscale` etkin olduğundan ve ham loopback/tailnet URL'si yerine Tailscale kimlik header'larını taşıyan Serve URL'sini açtığınızdan emin olun.
    - Trusted-proxy modu: aynı host üzerindeki loopback proxy veya ham gateway URL'si değil, yapılandırılmış loopback dışı kimlik farkındalıklı proxy üzerinden geldiğinizden emin olun.
    - Tek yeniden denemeden sonra uyumsuzluk sürerse eşleştirilmiş cihaz token'ını döndürün/yeniden onaylayın:
      - `openclaw devices list`
      - `openclaw devices rotate --device <id> --role operator`
    - Bu rotate çağrısı reddedildi derse iki şeyi kontrol edin:
      - eşleştirilmiş cihaz oturumları yalnızca **kendi** cihazlarını döndürebilir; ayrıca `operator.admin` yetkileri yoksa başkalarını döndüremez
      - açık `--scope` değerleri çağıranın mevcut operatör kapsamlarını aşamaz
    - Hâlâ takılıysa `openclaw status --all` çalıştırın ve [Sorun Giderme](/tr/gateway/troubleshooting) adımlarını izleyin. Auth ayrıntıları için bkz. [Dashboard](/tr/web/dashboard).

  </Accordion>

  <Accordion title="gateway.bind tailnet ayarladım ama bağlanamıyor ve hiçbir şey dinlemiyor">
    `tailnet` bind, ağ arayüzlerinizden bir Tailscale IP'si seçer (100.64.0.0/10). Makine Tailscale üzerinde değilse (veya arayüz kapalıysa), bağlanacak bir şey yoktur.

    Düzeltme:

    - O host'ta Tailscale'i başlatın (100.x adresi olsun), veya
    - `gateway.bind: "loopback"` / `"lan"` değerine geçin.

    Not: `tailnet` açık bir seçimdir. `auto`, loopback'i tercih eder; yalnızca tailnet'e bağlı bir bind istediğinizde `gateway.bind: "tailnet"` kullanın.

  </Accordion>

  <Accordion title="Aynı host üzerinde birden çok Gateway çalıştırabilir miyim?">
    Genellikle hayır — tek bir Gateway birden çok mesajlaşma kanalını ve ajanı çalıştırabilir. Birden çok Gateway'i yalnızca yedeklilik (ör. kurtarma botu) veya sert yalıtım gerektiğinde kullanın.

    Evet, ama şunları yalıtmanız gerekir:

    - `OPENCLAW_CONFIG_PATH` (örnek başına yapılandırma)
    - `OPENCLAW_STATE_DIR` (örnek başına durum)
    - `agents.defaults.workspace` (çalışma alanı yalıtımı)
    - `gateway.port` (benzersiz portlar)

    Hızlı kurulum (önerilir):

    - Örnek başına `openclaw --profile <name> ...` kullanın (otomatik olarak `~/.openclaw-<name>` oluşturur).
    - Her profil yapılandırmasında benzersiz bir `gateway.port` ayarlayın (veya elle çalıştırmalar için `--port` geçin).
    - Profil başına servis kurun: `openclaw --profile <name> gateway install`.

    Profiller servis adlarına da sonek ekler (`ai.openclaw.<profile>`; eski `com.openclaw.*`, `openclaw-gateway-<profile>.service`, `OpenClaw Gateway (<profile>)`).
    Tam kılavuz: [Birden çok gateway](/tr/gateway/multiple-gateways).

  </Accordion>

  <Accordion title='"invalid handshake" / code 1008 ne anlama gelir?'>
    Gateway bir **WebSocket sunucusudur** ve ilk mesajın
    bir `connect` çerçevesi olmasını bekler. Farklı bir şey alırsa bağlantıyı
    **code 1008** (politika ihlali) ile kapatır.

    Yaygın nedenler:

    - **HTTP** URL'sini normal tarayıcıda açtınız (`http://...`) ama WS istemcisi kullanmadınız.
    - Yanlış portu veya yolu kullandınız.
    - Bir proxy veya tünel auth header'larını sıyırdı ya da Gateway olmayan bir istek gönderdi.

    Hızlı düzeltmeler:

    1. WS URL'sini kullanın: `ws://<host>:18789` (veya HTTPS ise `wss://...`).
    2. WS portunu normal bir tarayıcı sekmesinde açmayın.
    3. Auth açıksa `connect` çerçevesine token/parolayı ekleyin.

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

    Servis/supervisor günlükleri (gateway launchd/systemd ile çalışıyorsa):

    - macOS: `$OPENCLAW_STATE_DIR/logs/gateway.log` ve `gateway.err.log` (varsayılan: `~/.openclaw/logs/...`; profiller `~/.openclaw-<profile>/logs/...` kullanır)
    - Linux: `journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`
    - Windows: `schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`

    Daha fazlası için bkz. [Sorun Giderme](/tr/gateway/troubleshooting).

  </Accordion>

  <Accordion title="Gateway servisini nasıl başlatırım/durdururum/yeniden başlatırım?">
    Gateway yardımcılarını kullanın:

    ```bash
    openclaw gateway status
    openclaw gateway restart
    ```

    Gateway'i elle çalıştırıyorsanız `openclaw gateway --force` portu geri alabilir. Bkz. [Gateway](/tr/gateway).

  </Accordion>

  <Accordion title="Windows'ta terminalimi kapattım - OpenClaw'ı nasıl yeniden başlatırım?">
    **İki Windows kurulum modu** vardır:

    **1) WSL2 (önerilir):** Gateway Linux içinde çalışır.

    PowerShell açın, WSL'ye girin, sonra yeniden başlatın:

    ```powershell
    wsl
    openclaw gateway status
    openclaw gateway restart
    ```

    Servisi hiç kurmadıysanız ön planda başlatın:

    ```bash
    openclaw gateway run
    ```

    **2) Yerel Windows (önerilmez):** Gateway doğrudan Windows içinde çalışır.

    PowerShell açın ve şunu çalıştırın:

    ```powershell
    openclaw gateway status
    openclaw gateway restart
    ```

    Elle çalıştırıyorsanız (servis yoksa) şunu kullanın:

    ```powershell
    openclaw gateway run
    ```

    Belgeler: [Windows (WSL2)](/tr/platforms/windows), [Gateway servis çalışma kitabı](/tr/gateway).

  </Accordion>

  <Accordion title="Gateway açık ama yanıtlar hiç gelmiyor. Neyi kontrol etmeliyim?">
    Hızlı sağlık taraması ile başlayın:

    ```bash
    openclaw status
    openclaw models status
    openclaw channels status
    openclaw logs --follow
    ```

    Yaygın nedenler:

    - Model auth'u **gateway host** üzerinde yüklenmemiş (bkz. `models status`).
    - Kanal eşleştirmesi/izin listesi yanıtları engelliyor (kanal yapılandırması + günlükleri kontrol edin).
    - WebChat/Dashboard doğru token olmadan açık.

    Uzaktaysanız tünel/Tailscale bağlantısının açık olduğunu ve
    Gateway WebSocket'e erişilebildiğini doğrulayın.

    Belgeler: [Kanallar](/tr/channels), [Sorun Giderme](/tr/gateway/troubleshooting), [Uzak erişim](/tr/gateway/remote).

  </Accordion>

  <Accordion title='"Disconnected from gateway: no reason" - şimdi ne yapmalıyım?'>
    Bu genellikle UI'nin WebSocket bağlantısını kaybettiği anlamına gelir. Şunları kontrol edin:

    1. Gateway çalışıyor mu? `openclaw gateway status`
    2. Gateway sağlıklı mı? `openclaw status`
    3. UI doğru token'a sahip mi? `openclaw dashboard`
    4. Uzaktan bağlanıyorsanız tünel/Tailscale bağlantısı açık mı?

    Sonra günlükleri izleyin:

    ```bash
    openclaw logs --follow
    ```

    Belgeler: [Dashboard](/tr/web/dashboard), [Uzak erişim](/tr/gateway/remote), [Sorun Giderme](/tr/gateway/troubleshooting).

  </Accordion>

  <Accordion title="Telegram setMyCommands başarısız oluyor. Neyi kontrol etmeliyim?">
    Günlükler ve kanal durumu ile başlayın:

    ```bash
    openclaw channels status
    openclaw channels logs --channel telegram
    ```

    Sonra hatayı eşleştirin:

    - `BOT_COMMANDS_TOO_MUCH`: Telegram menüsünde çok fazla girdi var. OpenClaw zaten Telegram sınırına göre kırpıyor ve daha az komutla yeniden deniyor, ancak bazı menü girdilerinin yine de çıkarılması gerekiyor. Plugin/Skill/özel komutları azaltın veya menüye ihtiyacınız yoksa `channels.telegram.commands.native` seçeneğini devre dışı bırakın.
    - `TypeError: fetch failed`, `Network request for 'setMyCommands' failed!` veya benzeri ağ hataları: VPS üzerindeyseniz veya bir proxy arkasındaysanız `api.telegram.org` için giden HTTPS erişiminin ve DNS'in çalıştığını doğrulayın.

    Gateway uzaktaysa günlükleri Gateway host üzerinde incelediğinizden emin olun.

    Belgeler: [Telegram](/tr/channels/telegram), [Kanal sorun giderme](/tr/channels/troubleshooting).

  </Accordion>

  <Accordion title="TUI çıktı göstermiyor. Neyi kontrol etmeliyim?">
    Önce Gateway'e erişilebildiğini ve ajanın çalışabildiğini doğrulayın:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    TUI içinde geçerli durumu görmek için `/status` kullanın. Bir sohbet
    kanalında yanıt bekliyorsanız teslimin etkin olduğundan emin olun (`/deliver on`).

    Belgeler: [TUI](/tr/web/tui), [Slash commands](/tr/tools/slash-commands).

  </Accordion>

  <Accordion title="Gateway'i tamamen durdurup sonra nasıl başlatırım?">
    Servisi kurduysanız:

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    Bu, **denetlenen servisi** durdurur/başlatır (macOS'ta launchd, Linux'ta systemd).
    Gateway arka planda daemon olarak çalışıyorsa bunu kullanın.

    Ön planda çalıştırıyorsanız Ctrl-C ile durdurun, sonra:

    ```bash
    openclaw gateway run
    ```

    Belgeler: [Gateway servis çalışma kitabı](/tr/gateway).

  </Accordion>

  <Accordion title="ELI5: openclaw gateway restart vs openclaw gateway">
    - `openclaw gateway restart`: **arka plan servisini** yeniden başlatır (launchd/systemd).
    - `openclaw gateway`: gateway'i bu terminal oturumu için **ön planda** çalıştırır.

    Servisi kurduysanız gateway komutlarını kullanın. Tek seferlik, ön planda çalışma istediğinizde `openclaw gateway` kullanın.

  </Accordion>

  <Accordion title="Bir şey başarısız olduğunda daha fazla ayrıntı almanın en hızlı yolu">
    Daha fazla konsol ayrıntısı almak için Gateway'i `--verbose` ile başlatın. Sonra kanal auth, model yönlendirmesi ve RPC hataları için günlük dosyasını inceleyin.
  </Accordion>
</AccordionGroup>

## Medya ve ekler

<AccordionGroup>
  <Accordion title="Skill'im bir görsel/PDF üretti, ama hiçbir şey gönderilmedi">
    Ajandan çıkan ekler bir `MEDIA:<path-or-url>` satırı içermelidir (kendi satırında). Bkz. [OpenClaw asistan kurulumu](/tr/start/openclaw) ve [Ajan gönderimi](/tr/tools/agent-send).

    CLI ile gönderim:

    ```bash
    openclaw message send --target +15555550123 --message "Here you go" --media /path/to/file.png
    ```

    Şunları da kontrol edin:

    - Hedef kanal giden medyayı destekliyor ve izin listeleri tarafından engellenmiyor.
    - Dosya sağlayıcının boyut sınırları içinde (görseller en fazla 2048px'e yeniden boyutlandırılır).
    - `tools.fs.workspaceOnly=true`, yerel yol gönderimlerini çalışma alanı, temp/media-store ve sandbox doğrulamalı dosyalarla sınırlar.
    - `tools.fs.workspaceOnly=false`, ajanın zaten okuyabildiği host-yerel dosyaları `MEDIA:` ile göndermeye izin verir; ancak yalnızca medya + güvenli belge türleri için (görseller, ses, video, PDF ve Office belgeleri). Düz metin ve gizli bilgi benzeri dosyalar yine engellenir.

    Bkz. [Görseller](/tr/nodes/images).

  </Accordion>
</AccordionGroup>

## Güvenlik ve erişim denetimi

<AccordionGroup>
  <Accordion title="OpenClaw'ı gelen DM'lere açmak güvenli mi?">
    Gelen DM'leri güvenilmeyen girdi olarak değerlendirin. Varsayılanlar riski azaltacak şekilde tasarlanmıştır:

    - DM destekli kanallarda varsayılan davranış **eşleştirme**dir:
      - Bilinmeyen gönderenler bir eşleştirme kodu alır; bot mesajlarını işlemez.
      - Şununla onaylayın: `openclaw pairing approve --channel <channel> [--account <id>] <code>`
      - Bekleyen istekler **kanal başına 3** ile sınırlıdır; bir kod gelmediyse `openclaw pairing list --channel <channel> [--account <id>]` ile kontrol edin.
    - DM'leri herkese açık yapmak için açık bir opt-in gerekir (`dmPolicy: "open"` ve izin listesi `"*"`).

    Riskli DM politikalarını görmek için `openclaw doctor` çalıştırın.

  </Accordion>

  <Accordion title="Prompt injection yalnızca herkese açık botlar için mi bir endişe?">
    Hayır. Prompt injection, yalnızca botun size kimin DM attığıyla değil, **güvenilmeyen içerikle** ilgilidir.
    Asistanınız harici içerik okuyorsa (web search/fetch, browser sayfaları, e-postalar,
    belgeler, ekler, yapıştırılmış günlükler), bu içerik modele el koymaya çalışan yönergeler içerebilir.
    Bu, **tek gönderen siz olsanız bile** olabilir.

    En büyük risk araçlar etkin olduğunda ortaya çıkar: model, siz adına
    bağlam sızdırmaya veya araç çağırmaya kandırılabilir. Hasar alanını şunlarla azaltın:

    - güvenilmeyen içeriği özetlemek için salt okunur veya araçları kapalı bir "okuyucu" ajan kullanmak
    - araç etkin ajanlarda `web_search` / `web_fetch` / `browser` araçlarını kapalı tutmak
    - çözümlenmiş dosya/belge metnini de güvenilmeyen kabul etmek: OpenResponses
      `input_file` ve medya-ek çıkarımı, çıkarılan metni ham dosya metni olarak geçirmek yerine
      açık harici içerik sınır işaretçileri içinde sarar
    - sandboxing ve katı araç izin listeleri

    Ayrıntılar: [Güvenlik](/tr/gateway/security).

  </Accordion>

  <Accordion title="Botumun kendine ait bir e-postası, GitHub hesabı veya telefon numarası olmalı mı?">
    Evet, çoğu kurulum için. Botu ayrı hesaplar ve telefon numaralarıyla yalıtmak,
    bir şeyler ters giderse hasar alanını azaltır. Bu ayrıca kişisel hesaplarınızı etkilemeden
    kimlik bilgilerini döndürmeyi veya erişimi iptal etmeyi kolaylaştırır.

    Küçük başlayın. Yalnızca gerçekten ihtiyacınız olan araçlara ve hesaplara erişim verin, gerekirse
    daha sonra genişletin.

    Belgeler: [Güvenlik](/tr/gateway/security), [Eşleştirme](/tr/channels/pairing).

  </Accordion>

  <Accordion title="Kısa mesajlarım üzerinde özerklik verebilir miyim ve bu güvenli mi?">
    Kişisel mesajlarınız üzerinde tam özerklik **önermiyoruz**. En güvenli desen şudur:

    - DM'leri **eşleştirme modunda** veya dar bir izin listesi içinde tutun.
    - Sizin adınıza mesaj atmasını istiyorsanız **ayrı bir numara veya hesap** kullanın.
    - Taslak hazırlatsın, sonra **göndermeden önce onaylayın**.

    Deney yapmak isterseniz bunu özel bir hesapta yapın ve yalıtılmış tutun. Bkz.
    [Güvenlik](/tr/gateway/security).

  </Accordion>

  <Accordion title="Kişisel asistan görevleri için daha ucuz modeller kullanabilir miyim?">
    Evet, **eğer** ajan yalnızca sohbet amaçlıysa ve girdi güvenilirse. Küçük katmanlar
    yönerge ele geçirmeye daha yatkındır; bu yüzden bunları araç etkin ajanlar için
    veya güvenilmeyen içerik okurken kullanmayın. Daha küçük bir model kullanmanız gerekiyorsa
    araçları kilitleyin ve sandbox içinde çalıştırın. Bkz. [Güvenlik](/tr/gateway/security).
  </Accordion>

  <Accordion title="Telegram'da /start çalıştırdım ama eşleştirme kodu almadım">
    Eşleştirme kodları **yalnızca** bilinmeyen bir gönderen bota mesaj attığında ve
    `dmPolicy: "pairing"` etkin olduğunda gönderilir. `/start` tek başına kod üretmez.

    Bekleyen istekleri kontrol edin:

    ```bash
    openclaw pairing list telegram
    ```

    Hemen erişim istiyorsanız gönderen kimliğinizi izin listesine alın veya o hesap için `dmPolicy: "open"`
    ayarlayın.

  </Accordion>

  <Accordion title="WhatsApp: kişilerime mesaj atar mı? Eşleştirme nasıl çalışır?">
    Hayır. Varsayılan WhatsApp DM politikası **eşleştirme**dir. Bilinmeyen gönderenler yalnızca bir eşleştirme kodu alır ve mesajları **işlenmez**. OpenClaw yalnızca aldığı sohbetlere veya sizin tetiklediğiniz açık gönderimlere yanıt verir.

    Eşleştirmeyi şununla onaylayın:

    ```bash
    openclaw pairing approve whatsapp <code>
    ```

    Bekleyen istekleri listeleyin:

    ```bash
    openclaw pairing list whatsapp
    ```

    Sihirbaz telefon numarası istemi: bu, kendi DM'lerinizin izinli olması için **izin listenizi/sahibinizi** ayarlamakta kullanılır. Otomatik gönderim için kullanılmaz. Kişisel WhatsApp numaranızda çalıştırıyorsanız bu numarayı kullanın ve `channels.whatsapp.selfChatMode` etkinleştirin.

  </Accordion>
</AccordionGroup>

## Sohbet komutları, görevleri iptal etme ve "durmuyor"

<AccordionGroup>
  <Accordion title="Dahili sistem mesajlarının sohbette görünmesini nasıl engellerim?">
    Dahili veya araç mesajlarının çoğu yalnızca **verbose**, **trace** veya **reasoning** etkin olduğunda
    görünür.

    Bunu gördüğünüz sohbette düzeltin:

    ```
    /verbose off
    /trace off
    /reasoning off
    ```

    Hâlâ gürültülüyse Control UI içinde oturum ayarlarını kontrol edin ve verbose
    değerini **inherit** yapın. Ayrıca `verboseDefault` değeri yapılandırmada
    `on` yapılmış bir bot profile'ı kullanmadığınızı doğrulayın.

    Belgeler: [Thinking ve verbose](/tr/tools/thinking), [Güvenlik](/tr/gateway/security#reasoning-verbose-output-in-groups).

  </Accordion>

  <Accordion title="Çalışan bir görevi nasıl durdurur/iptal ederim?">
    Bunlardan herhangi birini **bağımsız mesaj** olarak gönderin (slash yok):

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

    Bunlar abort tetikleyicileridir (slash command değil).

    Arka plan süreçleri için (exec aracından gelenler), ajandan şunu çalıştırmasını isteyebilirsiniz:

    ```
    process action:kill sessionId:XXX
    ```

    Slash command'lere genel bakış için bkz. [Slash commands](/tr/tools/slash-commands).

    Çoğu komut, `/` ile başlayan **bağımsız** bir mesaj olarak gönderilmelidir; ancak birkaç kısayol (`/status` gibi) izin listesindeki gönderenler için satır içinde de çalışır.

  </Accordion>

  <Accordion title='Telegram'dan nasıl Discord mesajı gönderirim? ("Cross-context messaging denied")'>
    OpenClaw varsayılan olarak **sağlayıcılar arası** mesajlaşmayı engeller. Bir araç çağrısı
    Telegram'a bağlıysa siz açıkça izin vermedikçe Discord'a göndermez.

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

  <Accordion title='Bot neden art arda hızlı mesajları "görmezden geliyor" gibi hissettiriyor?'>
    Kuyruk modu, yeni mesajların devam eden bir çalıştırma ile nasıl etkileştiğini denetler. Modları değiştirmek için `/queue` kullanın:

    - `steer` - yeni mesajlar geçerli görevi yeniden yönlendirir
    - `followup` - mesajları teker teker çalıştırır
    - `collect` - mesajları toplar ve bir kez yanıt verir (varsayılan)
    - `steer-backlog` - şimdi yönlendirir, sonra birikeni işler
    - `interrupt` - geçerli çalıştırmayı iptal eder ve yeniden başlatır

    Followup modları için `debounce:2s cap:25 drop:summarize` gibi seçenekler ekleyebilirsiniz.

  </Accordion>
</AccordionGroup>

## Çeşitli

<AccordionGroup>
  <Accordion title='Anthropic için API anahtarıyla varsayılan model nedir?'>
    OpenClaw'da kimlik bilgileri ve model seçimi birbirinden ayrıdır. `ANTHROPIC_API_KEY` ayarlamak (veya auth profile'larında bir Anthropic API anahtarı saklamak) kimlik doğrulamayı etkinleştirir, ancak gerçek varsayılan model, `agents.defaults.model.primary` içinde yapılandırdığınız şeydir (örneğin `anthropic/claude-sonnet-4-6` veya `anthropic/claude-opus-4-6`). `No credentials found for profile "anthropic:default"` görüyorsanız, bu Gateway'in çalışan ajan için beklenen `auth-profiles.json` içinde Anthropic kimlik bilgilerini bulamadığı anlamına gelir.
  </Accordion>
</AccordionGroup>

---

Hâlâ takıldınız mı? [Discord](https://discord.com/invite/clawd) üzerinden sorun veya bir [GitHub discussion](https://github.com/openclaw/openclaw/discussions) açın.

## İlgili

- [İlk çalıştırma SSS](/tr/help/faq-first-run) — yükleme, onboarding, auth, abonelikler, erken hatalar
- [Modeller SSS](/tr/help/faq-models) — model seçimi, failover, auth profile'ları
- [Sorun Giderme](/tr/help/troubleshooting) — belirti odaklı sınıflandırma
