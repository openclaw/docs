---
read_when:
    - Yaygın kurulum, yükleme, ilk yapılandırma veya çalışma zamanı destek sorularını yanıtlama
    - Daha derin hata ayıklamadan önce kullanıcı tarafından bildirilen sorunları önceliklendirme
summary: OpenClaw kurulumu, yapılandırması ve kullanımı hakkında sık sorulan sorular
title: SSS
x-i18n:
    generated_at: "2026-06-28T00:41:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 40b32792c202944576cd983ecf8bf794551bc50986d6b5c985a8ddfe0ecf0b34
    source_path: help/faq.md
    workflow: 16
---

Gerçek dünya kurulumları (yerel geliştirme, VPS, çok ajanlı yapı, OAuth/API anahtarları, model devretmesi) için hızlı yanıtlar ve daha derin sorun giderme. Çalışma zamanı tanıları için [Sorun giderme](/tr/gateway/troubleshooting) sayfasına bakın. Tam yapılandırma başvurusu için [Yapılandırma](/tr/gateway/configuration) sayfasına bakın.

## Bir şey bozulduysa ilk 60 saniye

1. **Hızlı durum (ilk kontrol)**

   ```bash
   openclaw status
   ```

   Hızlı yerel özet: OS + güncelleme, gateway/hizmet erişilebilirliği, ajanlar/oturumlar, sağlayıcı yapılandırması + çalışma zamanı sorunları (Gateway erişilebildiğinde).

2. **Yapıştırılabilir rapor (paylaşması güvenli)**

   ```bash
   openclaw status --all
   ```

   Günlük kuyruğu ile salt okunur tanı (token'lar gizlenir).

3. **Daemon + port durumu**

   ```bash
   openclaw gateway status
   ```

   Supervisor çalışma zamanı ile RPC erişilebilirliğini, yoklama hedef URL'sini ve hizmetin muhtemelen hangi yapılandırmayı kullandığını gösterir.

4. **Derin yoklamalar**

   ```bash
   openclaw status --deep
   ```

   Desteklendiğinde kanal yoklamaları dahil canlı bir Gateway sağlık yoklaması çalıştırır
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

6. **Doctor'ı çalıştırın (onarımlar)**

   ```bash
   openclaw doctor
   ```

   Yapılandırmayı/durumu onarır/geçirir + sağlık kontrolleri çalıştırır. Bkz. [Doctor](/tr/gateway/doctor).

7. **Gateway anlık görüntüsü**

   ```bash
   openclaw health --json
   openclaw health --verbose   # shows the target URL + config path on errors
   ```

   Çalışan Gateway'den tam anlık görüntü ister (yalnızca WS). Bkz. [Sağlık](/tr/gateway/health).

## Hızlı başlangıç ve ilk çalıştırma kurulumu

İlk çalıştırma SSS'si - kurulum, onboard, kimlik doğrulama yolları, abonelikler, ilk hatalar -
[İlk çalıştırma SSS](/tr/help/faq-first-run) sayfasında yer alır.

## OpenClaw nedir?

<AccordionGroup>
  <Accordion title="OpenClaw tek paragrafta nedir?">
    OpenClaw, kendi cihazlarınızda çalıştırdığınız kişisel bir AI asistanıdır. Zaten kullandığınız mesajlaşma yüzeylerinde (WhatsApp, Telegram, Slack, Mattermost, Discord, Google Chat, Signal, iMessage, WebChat ve QQ Bot gibi paketlenmiş kanal Plugin'leri) yanıt verir ve desteklenen platformlarda ses + canlı Canvas da yapabilir. **Gateway** her zaman açık kontrol düzlemidir; asistan ise üründür.
  </Accordion>

  <Accordion title="Değer önermesi">
    OpenClaw "sadece bir Claude sarmalayıcısı" değildir. Zaten kullandığınız sohbet uygulamalarından erişilebilen, **kendi donanımınızda** yetenekli bir asistan çalıştırmanızı sağlayan, durum bilgili oturumlar, bellek ve araçlar sunan **yerel öncelikli bir kontrol düzlemidir**; iş akışlarınızın kontrolünü barındırılan bir SaaS'a teslim etmeniz gerekmez.

    Öne çıkanlar:

    - **Cihazlarınız, verileriniz:** Gateway'i istediğiniz yerde çalıştırın (Mac, Linux, VPS) ve çalışma alanı + oturum geçmişini yerel tutun.
    - **Web kum havuzu değil, gerçek kanallar:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage/vb.,
      ayrıca desteklenen platformlarda mobil ses ve Canvas.
    - **Modelden bağımsız:** ajan başına yönlendirme ve devretme ile Anthropic, OpenAI, MiniMax, OpenRouter vb. kullanın.
    - **Yalnızca yerel seçenek:** isterseniz **tüm verilerin cihazınızda kalabilmesi** için yerel modeller çalıştırın.
    - **Çok ajanlı yönlendirme:** kanal, hesap veya görev başına ayrı ajanlar; her birinin kendi çalışma alanı ve varsayılanları olur.
    - **Açık kaynak ve kurcalanabilir:** tedarikçi kilidine takılmadan inceleyin, genişletin ve kendi kendinize barındırın.

    Dokümanlar: [Gateway](/tr/gateway), [Kanallar](/tr/channels), [Çok ajanlı](/tr/concepts/multi-agent),
    [Bellek](/tr/concepts/memory).

  </Accordion>

  <Accordion title="Yeni kurdum - önce ne yapmalıyım?">
    İyi ilk projeler:

    - Bir web sitesi oluşturun (WordPress, Shopify veya basit bir statik site).
    - Bir mobil uygulama prototipi çıkarın (taslak, ekranlar, API planı).
    - Dosya ve klasörleri düzenleyin (temizleme, adlandırma, etiketleme).
    - Gmail'i bağlayın ve özetleri veya takipleri otomatikleştirin.

    Büyük görevleri halledebilir, ancak görevleri aşamalara böldüğünüzde ve
    paralel çalışma için alt ajanlar kullandığınızda en iyi şekilde çalışır.

  </Accordion>

  <Accordion title="OpenClaw için en iyi beş günlük kullanım senaryosu nedir?">
    Günlük kazanımlar genellikle şöyle görünür:

    - **Kişisel brifingler:** önem verdiğiniz gelen kutusu, takvim ve haber özetleri.
    - **Araştırma ve taslak oluşturma:** e-postalar veya dokümanlar için hızlı araştırma, özetler ve ilk taslaklar.
    - **Hatırlatıcılar ve takipler:** Cron veya Heartbeat ile çalışan dürtmeler ve kontrol listeleri.
    - **Tarayıcı otomasyonu:** form doldurma, veri toplama ve web görevlerini tekrarlama.
    - **Cihazlar arası koordinasyon:** telefonunuzdan bir görev gönderin, Gateway'in bunu bir sunucuda çalıştırmasına izin verin ve sonucu sohbette geri alın.

  </Accordion>

  <Accordion title="OpenClaw, bir SaaS için potansiyel müşteri bulma, erişim, reklamlar ve bloglarda yardımcı olabilir mi?">
    **Araştırma, nitelendirme ve taslak oluşturma** için evet. Siteleri tarayabilir, kısa listeler oluşturabilir,
    potansiyel müşterileri özetleyebilir ve erişim veya reklam metni taslakları yazabilir.

    **Erişim veya reklam çalışmaları** için döngüde bir insan tutun. Spam'den kaçının, yerel yasalara ve
    platform politikalarına uyun ve gönderilmeden önce her şeyi gözden geçirin. En güvenli kalıp,
    OpenClaw'ın taslak oluşturması ve sizin onaylamanızdır.

    Dokümanlar: [Güvenlik](/tr/gateway/security).

  </Accordion>

  <Accordion title="Web geliştirme için Claude Code'a göre avantajları nelerdir?">
    OpenClaw bir **kişisel asistan** ve koordinasyon katmanıdır, IDE yerine geçmez. Bir repo içinde en hızlı doğrudan kodlama döngüsü için
    Claude Code veya Codex kullanın. Kalıcı bellek, cihazlar arası erişim ve araç orkestrasyonu istediğinizde OpenClaw kullanın.

    Avantajlar:

    - Oturumlar arasında **kalıcı bellek + çalışma alanı**
    - **Çok platformlu erişim** (WhatsApp, Telegram, TUI, WebChat)
    - **Araç orkestrasyonu** (tarayıcı, dosyalar, zamanlama, hook'lar)
    - **Her zaman açık Gateway** (VPS üzerinde çalıştırın, her yerden etkileşime girin)
    - Yerel tarayıcı/ekran/kamera/exec için **Node'lar**

    Vitrin: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills ve otomasyon

<AccordionGroup>
  <Accordion title="Repoyu kirli tutmadan Skills'i nasıl özelleştiririm?">
    Repo kopyasını düzenlemek yerine yönetilen geçersiz kılmalar kullanın. Değişikliklerinizi `~/.openclaw/skills/<name>/SKILL.md` içine koyun (veya `~/.openclaw/openclaw.json` içinde `skills.load.extraDirs` üzerinden bir klasör ekleyin). Öncelik sırası `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → paketlenmiş → `skills.load.extraDirs` şeklindedir; bu nedenle yönetilen geçersiz kılmalar, git'e dokunmadan paketlenmiş Skills'e karşı yine de kazanır. Skill'in küresel olarak kurulu olması ama yalnızca bazı ajanlara görünmesi gerekiyorsa, paylaşılan kopyayı `~/.openclaw/skills` içinde tutun ve görünürlüğü `agents.defaults.skills` ve `agents.list[].skills` ile kontrol edin. Yalnızca upstream'e değer düzenlemeler repoda yaşamalı ve PR olarak çıkmalıdır.
  </Accordion>

  <Accordion title="Skills'i özel bir klasörden yükleyebilir miyim?">
    Evet. `~/.openclaw/openclaw.json` içinde `skills.load.extraDirs` ile ek dizinler ekleyin (en düşük öncelik). Varsayılan öncelik `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → paketlenmiş → `skills.load.extraDirs` şeklindedir. `clawhub` varsayılan olarak `./skills` içine kurar; OpenClaw bunu sonraki oturumda `<workspace>/skills` olarak ele alır. Skill yalnızca belirli ajanlara görünmeliyse bunu `agents.defaults.skills` veya `agents.list[].skills` ile eşleştirin.
  </Accordion>

  <Accordion title="Farklı görevler için farklı modelleri veya ayarları nasıl kullanabilirim?">
    Bugün desteklenen kalıplar şunlardır:

    - **Cron işleri**: yalıtılmış işler, iş başına bir `model` geçersiz kılması ayarlayabilir.
    - **Ajanlar**: görevleri farklı varsayılan modeller, düşünme seviyeleri ve akış parametreleri olan ayrı ajanlara yönlendirin.
    - **İsteğe bağlı değiştirme**: mevcut oturum modelini istediğiniz zaman değiştirmek için `/model` kullanın.

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

    Bkz. [Cron işleri](/tr/automation/cron-jobs), [Çok Ajanlı Yönlendirme](/tr/concepts/multi-agent), [Yapılandırma](/tr/gateway/config-agents) ve [Slash komutları](/tr/tools/slash-commands).

  </Accordion>

  <Accordion title="Bot ağır iş yaparken donuyor. Bunu nasıl başka yere aktarırım?">
    Uzun veya paralel görevler için **alt ajanlar** kullanın. Alt ajanlar kendi oturumlarında çalışır,
    bir özet döndürür ve ana sohbetinizi yanıt verir halde tutar.

    Botunuzdan "bu görev için bir alt ajan oluşturmasını" isteyin veya `/subagents` kullanın.
    Gateway'in şu anda ne yaptığını (ve meşgul olup olmadığını) görmek için sohbette `/status` kullanın.

    Token ipucu: uzun görevler ve alt ajanlar token tüketir. Maliyet kaygısı varsa,
    `agents.defaults.subagents.model` üzerinden alt ajanlar için daha ucuz bir model ayarlayın.

    Dokümanlar: [Alt ajanlar](/tr/tools/subagents), [Arka Plan Görevleri](/tr/automation/tasks).

  </Accordion>

  <Accordion title="Discord'da iş parçacığına bağlı alt ajan oturumları nasıl çalışır?">
    İş parçacığı bağlamaları kullanın. Bir Discord iş parçacığını bir alt ajana veya oturum hedefine bağlayabilirsiniz; böylece o iş parçacığındaki takip mesajları bağlı oturumda kalır.

    Temel akış:

    - `thread: true` kullanarak `sessions_spawn` ile oluşturun (kalıcı takip için isteğe bağlı olarak `mode: "session"`).
    - Veya `/focus <target>` ile elle bağlayın.
    - Bağlama durumunu incelemek için `/agents` kullanın.
    - Otomatik odaktan çıkmayı kontrol etmek için `/session idle <duration|off>` ve `/session max-age <duration|off>` kullanın.
    - İş parçacığını ayırmak için `/unfocus` kullanın.

    Gerekli yapılandırma:

    - Küresel varsayılanlar: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
    - Discord geçersiz kılmaları: `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours`.
    - Oluşturma sırasında otomatik bağlama: `channels.discord.threadBindings.spawnSessions` varsayılan olarak `true` olur; iş parçacığına bağlı oturum oluşturmayı devre dışı bırakmak için bunu `false` yapın.

    Dokümanlar: [Alt ajanlar](/tr/tools/subagents), [Discord](/tr/channels/discord), [Yapılandırma Başvurusu](/tr/gateway/configuration-reference), [Slash komutları](/tr/tools/slash-commands).

  </Accordion>

  <Accordion title="Bir alt ajan tamamlandı, ancak tamamlanma güncellemesi yanlış yere gitti veya hiç gönderilmedi. Neyi kontrol etmeliyim?">
    Önce çözümlenen istekte bulunan yolunu kontrol edin:

    - Tamamlanma modundaki alt ajan teslimi, varsa bağlı iş parçacığını veya konuşma yolunu tercih eder.
    - Tamamlanma kaynağı yalnızca bir kanal taşıyorsa OpenClaw, doğrudan teslimin yine de başarılı olabilmesi için istekte bulunan oturumunun saklanan yoluna (`lastChannel` / `lastTo` / `lastAccountId`) geri döner.
    - Ne bağlı bir yol ne de kullanılabilir bir saklanan yol varsa doğrudan teslim başarısız olabilir ve sonuç, sohbete hemen gönderilmek yerine kuyruğa alınmış oturum teslimine geri döner.
    - Geçersiz veya eski hedefler yine de kuyruk geri dönüşünü ya da nihai teslim başarısızlığını zorlayabilir.
    - Çocuğun son görünür asistan yanıtı tam sessiz token `NO_REPLY` / `no_reply` veya tam olarak `ANNOUNCE_SKIP` ise OpenClaw, eski ilerleme durumunu göndermek yerine duyuruyu bilerek bastırır.
    - Tool/toolResult çıktısı çocuk sonuç metnine yükseltilmez; sonuç, çocuğun en son görünür asistan yanıtıdır.

    Hata ayıklama:

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    Belgeler: [Alt aracılar](/tr/tools/subagents), [Arka Plan Görevleri](/tr/automation/tasks), [Oturum Araçları](/tr/concepts/session-tool).

  </Accordion>

  <Accordion title="Cron veya anımsatıcılar tetiklenmiyor. Neyi kontrol etmeliyim?">
    Cron, Gateway sürecinin içinde çalışır. Gateway sürekli çalışmıyorsa,
    zamanlanmış işler çalışmaz.

    Kontrol listesi:

    - Cron'un etkin olduğunu (`cron.enabled`) ve `OPENCLAW_SKIP_CRON` değerinin ayarlanmadığını doğrulayın.
    - Gateway'in 7/24 çalıştığını kontrol edin (uyku/yeniden başlatma yok).
    - İş için saat dilimi ayarlarını doğrulayın (`--tz` ile ana makine saat dilimi).

    Hata ayıklama:

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    Belgeler: [Cron işleri](/tr/automation/cron-jobs), [Otomasyon](/tr/automation).

  </Accordion>

  <Accordion title="Cron tetiklendi, ancak kanala hiçbir şey gönderilmedi. Neden?">
    Önce teslim modunu kontrol edin:

    - `--no-deliver` / `delivery.mode: "none"` hiçbir çalıştırıcı geri dönüş gönderiminin beklenmediği anlamına gelir.
    - Eksik veya geçersiz duyuru hedefi (`channel` / `to`), çalıştırıcının giden teslimatı atladığı anlamına gelir.
    - Kanal kimlik doğrulama hataları (`unauthorized`, `Forbidden`), çalıştırıcının teslim etmeyi denediği ancak kimlik bilgilerinin bunu engellediği anlamına gelir.
    - Sessiz izole sonuç (yalnızca `NO_REPLY` / `no_reply`), bilinçli olarak teslim edilemez kabul edilir, bu yüzden çalıştırıcı sıraya alınmış geri dönüş teslimatını da bastırır.

    İzole Cron işleri için aracı, bir sohbet rotası mevcut olduğunda yine de `message`
    aracıyla doğrudan gönderebilir. `--announce` yalnızca aracının zaten göndermediği
    nihai metin için çalıştırıcı geri dönüş yolunu denetler.

    Hata ayıklama:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Belgeler: [Cron işleri](/tr/automation/cron-jobs), [Arka Plan Görevleri](/tr/automation/tasks).

  </Accordion>

  <Accordion title="İzole bir Cron çalıştırması neden model değiştirdi veya bir kez yeniden denedi?">
    Bu genellikle yinelenen zamanlama değil, canlı model değiştirme yoludur.

    İzole Cron, etkin çalıştırma `LiveSessionModelSwitchError` fırlattığında çalışma zamanı model devrini kalıcı hale getirip yeniden deneyebilir. Yeniden deneme,
    değiştirilmiş sağlayıcı/modeli korur ve değişiklik yeni bir kimlik doğrulama profili geçersiz kılması taşıyorsa Cron yeniden denemeden önce bunu da kalıcı hale getirir.

    İlgili seçim kuralları:

    - Uygulanabilir olduğunda önce Gmail hook model geçersiz kılması kazanır.
    - Sonra iş başına `model`.
    - Sonra saklanan herhangi bir Cron oturumu model geçersiz kılması.
    - Sonra normal aracı/varsayılan model seçimi.

    Yeniden deneme döngüsü sınırlıdır. İlk deneme artı 2 değiştirme yeniden denemesinden sonra,
    Cron sonsuza kadar döngüye girmek yerine iptal eder.

    Hata ayıklama:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Belgeler: [Cron işleri](/tr/automation/cron-jobs), [Cron CLI](/tr/cli/cron).

  </Accordion>

  <Accordion title="Linux'ta Skills nasıl kurarım?">
    Yerel `openclaw skills` komutlarını kullanın veya Skills'i çalışma alanınıza bırakın. macOS Skills arayüzü Linux'ta kullanılamaz.
    Skills'e [https://clawhub.ai](https://clawhub.ai) üzerinden göz atın.

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

    Yerel `openclaw skills install` varsayılan olarak etkin çalışma alanındaki `skills/`
    dizinine yazar. Tüm yerel aracılar için paylaşılan yönetilen
    Skills dizinine kurmak üzere `--global` ekleyin. Ayrı `clawhub` CLI'yi
    yalnızca kendi Skills'inizi yayımlamak veya eşitlemek istiyorsanız kurun.
    Hangi aracıların paylaşılan Skills'i görebileceğini daraltmak istiyorsanız
    `agents.defaults.skills` veya `agents.list[].skills` kullanın.

  </Accordion>

  <Accordion title="OpenClaw görevleri bir zamanlamaya göre veya arka planda sürekli çalıştırabilir mi?">
    Evet. Gateway zamanlayıcısını kullanın:

    - Zamanlanmış veya yinelenen görevler için **Cron işleri** (yeniden başlatmalar arasında kalıcıdır).
    - "Ana oturum" periyodik kontrolleri için **Heartbeat**.
    - Özet yayımlayan veya sohbetlere teslim eden otonom aracılar için **izole işler**.

    Belgeler: [Cron işleri](/tr/automation/cron-jobs), [Otomasyon](/tr/automation),
    [Heartbeat](/tr/gateway/heartbeat).

  </Accordion>

  <Accordion title="Apple macOS'a özel Skills'i Linux'tan çalıştırabilir miyim?">
    Doğrudan değil. macOS Skills, `metadata.openclaw.os` ve gerekli ikili dosyalarla sınırlandırılır; Skills yalnızca **Gateway ana makinesinde** uygun olduklarında sistem isteminde görünür. Linux'ta `darwin`'e özel Skills (`apple-notes`, `apple-reminders`, `things-mac` gibi), sınırlandırmayı geçersiz kılmadığınız sürece yüklenmez.

    Desteklenen üç kalıp vardır:

    **Seçenek A - Gateway'i bir Mac üzerinde çalıştırın (en basit).**
    Gateway'i macOS ikili dosyalarının bulunduğu yerde çalıştırın, ardından Linux'tan [uzak modda](#gateway-ports-already-running-and-remote-mode) veya Tailscale üzerinden bağlanın. Gateway ana makinesi macOS olduğu için Skills normal şekilde yüklenir.

    **Seçenek B - bir macOS Node kullanın (SSH yok).**
    Gateway'i Linux'ta çalıştırın, bir macOS Node'u (menü çubuğu uygulaması) eşleştirin ve Mac'te **Node Çalıştırma Komutları** ayarını "Her Zaman Sor" veya "Her Zaman İzin Ver" yapın. OpenClaw, gerekli ikili dosyalar Node üzerinde mevcut olduğunda macOS'a özel Skills'i uygun kabul edebilir. Aracı bu Skills'i `nodes` aracı üzerinden çalıştırır. "Her Zaman Sor" seçerseniz, istemde "Her Zaman İzin Ver" onayı bu komutu izin listesine ekler.

    **Seçenek C - macOS ikili dosyalarını SSH üzerinden proxy'leyin (gelişmiş).**
    Gateway'i Linux'ta tutun, ancak gerekli CLI ikili dosyalarını bir Mac üzerinde çalışan SSH sarmalayıcılarına çözümlenecek hale getirin. Ardından Skill'i Linux'a izin verecek şekilde geçersiz kılın ki uygun kalsın.

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
    Bugün yerleşik olarak yok.

    Seçenekler:

    - **Özel Skill / Plugin:** güvenilir API erişimi için en iyisi (Notion/HeyGen'in ikisinin de API'leri vardır).
    - **Tarayıcı otomasyonu:** kod olmadan çalışır ancak daha yavaş ve daha kırılgandır.

    Bağlamı müşteri başına tutmak istiyorsanız (ajans iş akışları), basit bir kalıp şudur:

    - Her müşteri için bir Notion sayfası (bağlam + tercihler + etkin çalışma).
    - Aracıdan oturumun başında o sayfayı getirmesini isteyin.

    Yerel bir entegrasyon istiyorsanız, bir özellik isteği açın veya bu API'leri
    hedefleyen bir Skill oluşturun.

    Skills kurun:

    ```bash
    openclaw skills install @owner/<skill-slug>
    openclaw skills update --all
    ```

    Yerel kurulumlar etkin çalışma alanındaki `skills/` dizinine yerleşir. Tüm yerel aracılar arasında paylaşılan Skills için `openclaw skills install @owner/<skill-slug> --global` kullanın (veya bunları elle `~/.openclaw/skills/<name>/SKILL.md` konumuna yerleştirin). Yalnızca bazı aracıların paylaşılan kurulumu görmesi gerekiyorsa `agents.defaults.skills` veya `agents.list[].skills` yapılandırın. Bazı Skills, Homebrew ile kurulmuş ikili dosyalar bekler; Linux'ta bu Linuxbrew anlamına gelir (yukarıdaki Homebrew Linux SSS girdisine bakın). Bkz. [Skills](/tr/tools/skills), [Skills yapılandırması](/tr/tools/skills-config) ve [ClawHub](/tr/clawhub).

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

    Bu yol yerel ana makine tarayıcısını veya bağlı bir tarayıcı Node'unu kullanabilir. Gateway başka bir yerde çalışıyorsa, tarayıcı makinesinde bir Node ana makinesi çalıştırın veya bunun yerine uzak CDP kullanın.

    `existing-session` / `user` üzerindeki geçerli sınırlar:

    - eylemler CSS seçici odaklı değil, ref odaklıdır
    - yüklemeler `ref` / `inputRef` gerektirir ve şu anda tek seferde bir dosyayı destekler
    - `responsebody`, PDF dışa aktarma, indirme yakalama ve toplu eylemler hâlâ yönetilen tarayıcı veya ham CDP profili gerektirir

  </Accordion>
</AccordionGroup>

## Korumalı alan ve bellek

<AccordionGroup>
  <Accordion title="Özel bir korumalı alan belgesi var mı?">
    Evet. Bkz. [Korumalı alan](/tr/gateway/sandboxing). Docker'a özel kurulum için (Docker içinde tam Gateway veya korumalı alan görüntüleri), bkz. [Docker](/tr/install/docker).
  </Accordion>

  <Accordion title="Docker sınırlı hissettiriyor - tam özellikleri nasıl etkinleştiririm?">
    Varsayılan görüntü güvenlik önceliklidir ve `node` kullanıcısı olarak çalışır, bu yüzden
    sistem paketlerini, Homebrew'i veya paketlenmiş tarayıcıları içermez. Daha kapsamlı bir kurulum için:

    - Önbelleklerin kalıcı olması için `/home/node` konumunu `OPENCLAW_HOME_VOLUME` ile kalıcı hale getirin.
    - Sistem bağımlılıklarını `OPENCLAW_IMAGE_APT_PACKAGES` ile görüntünün içine ekleyin.
    - Playwright tarayıcılarını paketlenmiş CLI üzerinden kurun:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - `PLAYWRIGHT_BROWSERS_PATH` ayarlayın ve yolun kalıcı olduğundan emin olun.

    Belgeler: [Docker](/tr/install/docker), [Tarayıcı](/tr/tools/browser).

  </Accordion>

  <Accordion title="Tek aracıyla DM'leri kişisel, grupları ise herkese açık/korumalı alanlı tutabilir miyim?">
    Evet - özel trafiğiniz **DM'ler** ve herkese açık trafiğiniz **gruplar** ise.

    Grup/kanal oturumlarının (ana olmayan anahtarlar) yapılandırılmış korumalı alan arka ucunda çalışması, ana DM oturumunun ise ana makinede kalması için `agents.defaults.sandbox.mode: "non-main"` kullanın. Birini seçmezseniz varsayılan arka uç Docker'dır. Ardından korumalı alanlı oturumlarda hangi araçların kullanılabilir olduğunu `tools.sandbox.tools` üzerinden sınırlandırın.

    Kurulum adımları + örnek yapılandırma: [Gruplar: kişisel DM'ler + herkese açık gruplar](/tr/channels/groups#pattern-personal-dms-public-groups-single-agent)

    Temel yapılandırma başvurusu: [Gateway yapılandırması](/tr/gateway/config-agents#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="Bir ana makine klasörünü korumalı alana nasıl bağlarım?">
    `agents.defaults.sandbox.docker.binds` değerini `["host:path:mode"]` olarak ayarlayın (örn. `"/home/user/src:/src:ro"`). Genel + aracı başına bağlamalar birleştirilir; `scope: "shared"` olduğunda aracı başına bağlamalar yok sayılır. Hassas her şey için `:ro` kullanın ve bağlamaların korumalı alan dosya sistemi duvarlarını aştığını unutmayın.

    OpenClaw bağlama kaynaklarını hem normalleştirilmiş yola hem de en derin mevcut üst öğe üzerinden çözümlenen kanonik yola göre doğrular. Bu, son yol segmenti henüz mevcut olmasa bile sembolik bağlantı üst öğesi kaçışlarının kapalı şekilde başarısız olacağı ve izin verilen kök kontrollerinin sembolik bağlantı çözümlemesinden sonra da uygulanacağı anlamına gelir.

    Örnekler ve güvenlik notları için bkz. [Korumalı alan](/tr/gateway/sandboxing#custom-bind-mounts) ve [Korumalı Alan ile Araç İlkesi ile Yükseltilmiş](/tr/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check).

  </Accordion>

  <Accordion title="Bellek nasıl çalışır?">
    OpenClaw belleği, aracı çalışma alanındaki Markdown dosyalarından ibarettir:

    - `memory/YYYY-MM-DD.md` içinde günlük notlar
    - `MEMORY.md` içinde düzenlenmiş uzun vadeli notlar (yalnızca ana/özel oturumlar)

    OpenClaw ayrıca modele otomatik Compaction öncesinde kalıcı notlar yazmasını hatırlatmak için **sessiz Compaction öncesi bellek boşaltımı** çalıştırır. Bu yalnızca çalışma alanı yazılabilir olduğunda çalışır (salt okunur korumalı alanlar bunu atlar). Bkz. [Bellek](/tr/concepts/memory).

  </Accordion>

  <Accordion title="Bellek sürekli bir şeyleri unutuyor. Bunu nasıl kalıcı yaparım?">
    bottan **olguyu belleğe yazmasını** isteyin. Uzun süreli notlar `MEMORY.md`
    içinde yer alır, kısa süreli bağlam `memory/YYYY-MM-DD.md` içine gider.

    Bu hâlâ geliştirmekte olduğumuz bir alan. Modele anıları saklamasını hatırlatmak yardımcı olur;
    ne yapacağını bilir. Unutmaya devam ederse, Gateway'in her çalıştırmada aynı
    çalışma alanını kullandığını doğrulayın.

    Belgeler: [Bellek](/tr/concepts/memory), [Ajan çalışma alanı](/tr/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Bellek sonsuza kadar kalıcı mı? Sınırları neler?">
    Bellek dosyaları diskte bulunur ve siz silene kadar kalıcı olur. Sınır model değil,
    depolama alanınızdır. **Oturum bağlamı** hâlâ modelin bağlam penceresiyle
    sınırlıdır, bu nedenle uzun konuşmalar sıkıştırılabilir veya kırpılabilir. Bellek
    aramasının var olma nedeni budur - yalnızca ilgili kısımları bağlama geri çeker.

    Belgeler: [Bellek](/tr/concepts/memory), [Bağlam](/tr/concepts/context).

  </Accordion>

  <Accordion title="Anlamsal bellek araması OpenAI API anahtarı gerektirir mi?">
    Yalnızca **OpenAI gömmeleri** kullanıyorsanız. Codex OAuth sohbet/tamamlama işlemlerini kapsar ve
    gömme erişimi **vermez**, bu nedenle **Codex ile oturum açmak (OAuth veya
    Codex CLI oturum açma)** anlamsal bellek araması için yardımcı olmaz. OpenAI gömmeleri
    yine de gerçek bir API anahtarı gerektirir (`OPENAI_API_KEY` veya `models.providers.openai.apiKey`).

    Açıkça bir sağlayıcı ayarlamazsanız, OpenClaw OpenAI gömmelerini kullanır. Hâlâ
    `memorySearch.provider = "auto"` diyen eski yapılandırmalar da OpenAI'a çözümlenir.
    Kullanılabilir OpenAI API anahtarı yoksa, bir anahtar yapılandırana veya açıkça
    başka bir sağlayıcı seçene kadar anlamsal bellek araması kullanılamaz.

    Yerel kalmayı tercih ederseniz, `memorySearch.provider = "local"` ayarlayın (ve isteğe bağlı olarak
    `memorySearch.fallback = "none"`). Gemini gömmeleri istiyorsanız,
    `memorySearch.provider = "gemini"` ayarlayın ve `GEMINI_API_KEY` (veya
    `memorySearch.remote.apiKey`) sağlayın. **OpenAI, OpenAI uyumlu, Gemini,
    Voyage, Mistral, Bedrock, Ollama, LM Studio, GitHub Copilot, DeepInfra veya yerel**
    gömme modellerini destekliyoruz - kurulum ayrıntıları için [Bellek](/tr/concepts/memory) bölümüne bakın.

  </Accordion>
</AccordionGroup>

## Diskte nelerin nerede bulunduğu

<AccordionGroup>
  <Accordion title="OpenClaw ile kullanılan tüm veriler yerel olarak mı kaydedilir?">
    Hayır - **OpenClaw'ın durumu yereldir**, ancak **harici hizmetler onlara gönderdiğiniz şeyi yine de görür**.

    - **Varsayılan olarak yerel:** oturumlar, bellek dosyaları, yapılandırma ve çalışma alanı Gateway ana makinesinde bulunur
      (`~/.openclaw` + çalışma alanı dizininiz).
    - **Zorunlu olarak uzaktan:** model sağlayıcılarına (Anthropic/OpenAI/vb.) gönderdiğiniz iletiler
      onların API'lerine gider ve sohbet platformları (WhatsApp/Telegram/Slack/vb.) ileti verilerini
      kendi sunucularında depolar.
    - **Kapsamı siz denetlersiniz:** yerel modeller kullanmak istemleri makinenizde tutar, ancak kanal
      trafiği yine de kanalın sunucularından geçer.

    İlgili: [Ajan çalışma alanı](/tr/concepts/agent-workspace), [Bellek](/tr/concepts/memory).

  </Accordion>

  <Accordion title="OpenClaw verilerini nerede depolar?">
    Her şey `$OPENCLAW_STATE_DIR` altında bulunur (varsayılan: `~/.openclaw`):

    | Yol                                                             | Amaç                                                               |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | Ana yapılandırma (JSON5)                                           |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | Eski OAuth içe aktarımı (ilk kullanımda kimlik doğrulama profillerine kopyalanır) |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | Kimlik doğrulama profilleri (OAuth, API anahtarları ve isteğe bağlı `keyRef`/`tokenRef`) |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | `file` SecretRef sağlayıcıları için isteğe bağlı dosya destekli gizli yük |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | Eski uyumluluk dosyası (statik `api_key` girdileri temizlenmiş)    |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | Sağlayıcı durumu (örn. `whatsapp/<accountId>/creds.json`)          |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | Ajan başına durum (agentDir + oturumlar)                           |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | Konuşma geçmişi ve durum (ajan başına)                             |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | Oturum meta verileri (ajan başına)                                 |

    Eski tek ajan yolu: `~/.openclaw/agent/*` (`openclaw doctor` tarafından taşınır).

    **Çalışma alanınız** (AGENTS.md, bellek dosyaları, skills, vb.) ayrıdır ve `agents.defaults.workspace` üzerinden yapılandırılır (varsayılan: `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title="AGENTS.md / SOUL.md / USER.md / MEMORY.md nerede bulunmalı?">
    Bu dosyalar `~/.openclaw` içinde değil, **ajan çalışma alanında** bulunur.

    - **Çalışma alanı (ajan başına)**: `AGENTS.md`, `SOUL.md`, `IDENTITY.md`, `USER.md`,
      `MEMORY.md`, `memory/YYYY-MM-DD.md`, isteğe bağlı `HEARTBEAT.md`.
      Küçük harfli kök `memory.md` yalnızca eski onarım girdisidir; her iki dosya da varsa
      `openclaw doctor --fix` bunu `MEMORY.md` içine birleştirebilir.
    - **Durum dizini (`~/.openclaw`)**: yapılandırma, kanal/sağlayıcı durumu, kimlik doğrulama profilleri, oturumlar, günlükler
      ve paylaşılan skills (`~/.openclaw/skills`).

    Varsayılan çalışma alanı `~/.openclaw/workspace` olup şununla yapılandırılabilir:

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

    [Ajan çalışma alanı](/tr/concepts/agent-workspace) ve [Bellek](/tr/concepts/memory) bölümlerine bakın.

  </Accordion>

  <Accordion title="SOUL.md dosyasını büyütebilir miyim?">
    Evet. `SOUL.md`, ajan bağlamına enjekte edilen çalışma alanı önyükleme dosyalarından biridir.
    Varsayılan dosya başına enjeksiyon sınırı `20000` karakterdir
    ve dosyalar genelindeki toplam önyükleme bütçesi `60000` karakterdir.

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

    Veya tek bir ajan için geçersiz kılın:

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

    Ham ve enjekte edilen boyutları ve kırpma olup olmadığını denetlemek için `/context` kullanın.
    `SOUL.md` dosyasını ses, duruş ve kişilik üzerine odaklı tutun; işletim kurallarını
    `AGENTS.md` içine, kalıcı olguları belleğe koyun.

    [Bağlam](/tr/concepts/context) ve [Ajan yapılandırması](/tr/gateway/config-agents) bölümlerine bakın.

  </Accordion>

  <Accordion title="Önerilen yedekleme stratejisi">
    **Ajan çalışma alanınızı** **özel** bir git deposuna koyun ve özel bir yerde
    yedekleyin (örneğin GitHub private). Bu, bellek + AGENTS/SOUL/USER
    dosyalarını yakalar ve asistanın "zihnini" daha sonra geri yüklemenizi sağlar.

    `~/.openclaw` altındaki hiçbir şeyi commit etmeyin (kimlik bilgileri, oturumlar, token'lar veya şifrelenmiş gizli yükler).
    Tam geri yükleme gerekiyorsa, hem çalışma alanını hem de durum dizinini
    ayrı ayrı yedekleyin (yukarıdaki taşıma sorusuna bakın).

    Belgeler: [Ajan çalışma alanı](/tr/concepts/agent-workspace).

  </Accordion>

  <Accordion title="OpenClaw'ı tamamen nasıl kaldırırım?">
    Özel kılavuza bakın: [Kaldırma](/tr/install/uninstall).
  </Accordion>

  <Accordion title="Ajanlar çalışma alanının dışında çalışabilir mi?">
    Evet. Çalışma alanı **varsayılan cwd** ve bellek çıpasıdır, katı bir sandbox değildir.
    Göreli yollar çalışma alanı içinde çözümlenir, ancak sandboxing etkin değilse mutlak yollar diğer
    ana makine konumlarına erişebilir. Yalıtım gerekiyorsa,
    [`agents.defaults.sandbox`](/tr/gateway/sandboxing) veya ajan başına sandbox ayarlarını kullanın. Bir
    deponun varsayılan çalışma dizini olmasını istiyorsanız, o ajanın
    `workspace` değerini depo köküne yönlendirin. OpenClaw deposu yalnızca kaynak koddur; ajanın
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
    Oturum durumu **gateway ana makinesine** aittir. Uzak moddaysanız, önemsediğiniz oturum deposu yerel dizüstü bilgisayarınızda değil, uzak makinededir. [Oturum yönetimi](/tr/concepts/session) bölümüne bakın.
  </Accordion>
</AccordionGroup>

## Yapılandırma temelleri

<AccordionGroup>
  <Accordion title="Yapılandırmanın biçimi nedir? Nerede bulunur?">
    OpenClaw isteğe bağlı **JSON5** yapılandırmasını `$OPENCLAW_CONFIG_PATH` üzerinden okur (varsayılan: `~/.openclaw/openclaw.json`):

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    Dosya yoksa, güvenli sayılabilecek varsayılanları kullanır (`~/.openclaw/workspace` varsayılan çalışma alanı dahil).

  </Accordion>

  <Accordion title='gateway.bind: "lan" (veya "tailnet") ayarladım ve artık hiçbir şey dinlemiyor / arayüz yetkisiz diyor'>
    loopback dışı bağlamalar **geçerli bir gateway kimlik doğrulama yolu gerektirir**. Pratikte bu şu anlama gelir:

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
    - Parola kimlik doğrulaması için bunun yerine `gateway.auth.mode: "password"` artı `gateway.auth.password` (veya `OPENCLAW_GATEWAY_PASSWORD`) ayarlayın.
    - `gateway.auth.token` / `gateway.auth.password` SecretRef üzerinden açıkça yapılandırılmış ve çözümlenmemişse, çözümleme kapalı kalacak şekilde başarısız olur (maskeleyen uzak yedek yok).
    - Paylaşılan gizli Control UI kurulumları `connect.params.auth.token` veya `connect.params.auth.password` (uygulama/UI ayarlarında saklanır) üzerinden kimlik doğrular. Tailscale Serve veya `trusted-proxy` gibi kimlik taşıyan modlar bunun yerine istek başlıklarını kullanır. Paylaşılan gizli bilgileri URL'lere koymaktan kaçının.
    - `gateway.auth.mode: "trusted-proxy"` ile, aynı ana makinedeki loopback ters proxy'leri açıkça `gateway.auth.trustedProxy.allowLoopback = true` ve `gateway.trustedProxies` içinde bir loopback girdisi gerektirir.

  </Accordion>

  <Accordion title="Artık localhost üzerinde neden token'a ihtiyacım var?">
    OpenClaw, loopback dahil olmak üzere gateway kimlik doğrulamasını varsayılan olarak zorunlu kılar. Normal varsayılan yolda bu token kimlik doğrulaması anlamına gelir: açık bir kimlik doğrulama yolu yapılandırılmamışsa, gateway başlangıcı token moduna çözümlenir ve o başlangıç için yalnızca çalışma zamanı token'ı üretir, bu nedenle **yerel WS istemcileri kimlik doğrulamalıdır**. İstemcilerin yeniden başlatmalar arasında kararlı bir gizli bilgiye ihtiyacı olduğunda `gateway.auth.token`, `gateway.auth.password`, `OPENCLAW_GATEWAY_TOKEN` veya `OPENCLAW_GATEWAY_PASSWORD` değerini açıkça yapılandırın. Bu, diğer yerel süreçlerin Gateway'i çağırmasını engeller.

    Farklı bir kimlik doğrulama yolu tercih ediyorsanız, parola modunu (veya kimlik farkındalıklı ters proxy'ler için `trusted-proxy`) açıkça seçebilirsiniz. **Gerçekten** açık loopback istiyorsanız, yapılandırmanızda `gateway.auth.mode: "none"` değerini açıkça ayarlayın. Doctor sizin için istediğiniz zaman bir token oluşturabilir: `openclaw doctor --generate-gateway-token`.

  </Accordion>

  <Accordion title="Yapılandırmayı değiştirdikten sonra yeniden başlatmam gerekir mi?">
    Gateway yapılandırmayı izler ve hot-reload destekler:

    - `gateway.reload.mode: "hybrid"` (varsayılan): güvenli değişiklikleri sıcak uygular, kritik değişiklikler için yeniden başlatır
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

    - `off`: slogan metnini gizler ama banner başlığını/sürüm satırını korur.
    - `default`: her seferinde `All your chats, one OpenClaw.` kullanır.
    - `random`: dönen komik/mevsimsel sloganlar (varsayılan davranış).
    - Hiç banner istemiyorsanız, `OPENCLAW_HIDE_BANNER=1` env değerini ayarlayın.

  </Accordion>

  <Accordion title="Web aramasını (ve web getirmeyi) nasıl etkinleştiririm?">
    `web_fetch` bir API anahtarı olmadan çalışır. `web_search`, seçtiğiniz
    sağlayıcıya bağlıdır:

    - Brave, Exa, Firecrawl, Gemini, Kimi, MiniMax Search, Perplexity ve Tavily gibi API destekli sağlayıcılar normal API anahtarı kurulumlarını gerektirir.
    - Grok, model kimlik doğrulamasından xAI OAuth'u yeniden kullanabilir veya `XAI_API_KEY` / plugin web araması yapılandırmasına geri dönebilir.
    - Ollama Web Search anahtarsızdır, ancak yapılandırılmış Ollama host'unuzu kullanır ve `ollama signin` gerektirir.
    - DuckDuckGo anahtarsızdır, ancak resmi olmayan HTML tabanlı bir entegrasyondur.
    - SearXNG anahtarsız/kendi kendine barındırılabilir; `SEARXNG_BASE_URL` veya `plugins.entries.searxng.config.webSearch.baseUrl` yapılandırın.

    **Önerilir:** `openclaw configure --section web` çalıştırın ve bir sağlayıcı seçin.
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

    Sağlayıcıya özgü web araması yapılandırması artık `plugins.entries.<plugin>.config.webSearch.*` altında bulunur.
    Eski `tools.web.search.*` sağlayıcı yolları uyumluluk için geçici olarak hâlâ yüklenir, ancak yeni yapılandırmalar için kullanılmamalıdır.
    Firecrawl web getirme fallback yapılandırması `plugins.entries.firecrawl.config.webFetch.*` altında bulunur.

    Notlar:

    - Allowlist kullanıyorsanız, `web_search`/`web_fetch`/`x_search` veya `group:web` ekleyin.
    - `web_fetch` varsayılan olarak etkindir (açıkça devre dışı bırakılmadıkça).
    - `tools.web.fetch.provider` atlanırsa, OpenClaw mevcut kimlik bilgilerinden hazır olan ilk getirme fallback sağlayıcısını otomatik algılar. Resmi Firecrawl plugin bu fallback'i sağlar.
    - Daemon'lar env değişkenlerini `~/.openclaw/.env` dosyasından (veya hizmet ortamından) okur.

    Dokümanlar: [Web araçları](/tr/tools/web).

  </Accordion>

  <Accordion title="config.apply yapılandırmamı sildi. Nasıl kurtarır ve bundan kaçınırım?">
    `config.apply` **tüm yapılandırmayı** değiştirir. Kısmi bir nesne gönderirseniz, geri kalan her şey
    kaldırılır.

    Mevcut OpenClaw birçok kazara üzerine yazmayı engeller:

    - OpenClaw'a ait yapılandırma yazmaları, yazmadan önce değişiklik sonrası tam yapılandırmayı doğrular.
    - Geçersiz veya yıkıcı OpenClaw'a ait yazmalar reddedilir ve `openclaw.json.rejected.*` olarak kaydedilir.
    - Doğrudan düzenleme başlatmayı veya hot reload'u bozarsa, Gateway kapalı kalır ya da yeniden yüklemeyi atlar; `openclaw.json` dosyasını yeniden yazmaz.
    - `openclaw doctor --fix` onarımdan sorumludur ve reddedilen dosyayı `openclaw.json.clobbered.*` olarak kaydederken bilinen son iyi durumu geri yükleyebilir.

    Kurtarma:

    - `Invalid config at`, `Config write rejected:` veya `config reload skipped (invalid config)` için `openclaw logs --follow` çıktısını kontrol edin.
    - Etkin yapılandırmanın yanında en yeni `openclaw.json.clobbered.*` veya `openclaw.json.rejected.*` dosyasını inceleyin.
    - `openclaw config validate` ve `openclaw doctor --fix` çalıştırın.
    - Yalnızca amaçlanan anahtarları `openclaw config set` veya `config.patch` ile geri kopyalayın.
    - Bilinen son iyi yapılandırmanız veya reddedilen payload'unuz yoksa yedekten geri yükleyin ya da `openclaw doctor` komutunu yeniden çalıştırıp kanalları/modelleri yeniden yapılandırın.
    - Bu beklenmedik bir durumsa, bir hata bildirin ve bilinen son yapılandırmanızı veya herhangi bir yedeği ekleyin.
    - Yerel bir kodlama agent'ı çoğu zaman günlüklerden veya geçmişten çalışan bir yapılandırmayı yeniden oluşturabilir.

    Bundan kaçınma:

    - Küçük değişiklikler için `openclaw config set` kullanın.
    - Etkileşimli düzenlemeler için `openclaw configure` kullanın.
    - Tam yol veya alan şekli konusunda emin değilseniz önce `config.schema.lookup` kullanın; bu, ayrıntıya inme için sığ bir şema düğümü ve doğrudan alt öğe özetleri döndürür.
    - Kısmi RPC düzenlemeleri için `config.patch` kullanın; `config.apply` komutunu yalnızca tam yapılandırma değişimi için saklayın.
    - Bir agent çalıştırmasından agent'a yönelik `gateway` aracını kullanıyorsanız, bu araç `tools.exec.ask` / `tools.exec.security` alanlarına (aynı korumalı exec yollarına normalize edilen eski `tools.bash.*` alias'ları dahil) yazmaları yine de reddeder.

    Dokümanlar: [Yapılandırma](/tr/cli/config), [Yapılandır](/tr/cli/configure), [Gateway sorun giderme](/tr/gateway/troubleshooting#gateway-rejected-invalid-config), [Doctor](/tr/gateway/doctor).

  </Accordion>

  <Accordion title="Cihazlar arasında uzmanlaşmış worker'larla merkezi bir Gateway'i nasıl çalıştırırım?">
    Yaygın desen **bir Gateway** (örn. Raspberry Pi) artı **düğümler** ve **agent'lar** şeklindedir:

    - **Gateway (merkezi):** kanalları (Signal/WhatsApp), yönlendirmeyi ve oturumları sahiplenir.
    - **Düğümler (cihazlar):** Mac'ler/iOS/Android çevre birimleri olarak bağlanır ve yerel araçları (`system.run`, `canvas`, `camera`) sunar.
    - **Agent'lar (worker'lar):** özel roller için ayrı beyinler/çalışma alanları (örn. "Hetzner ops", "Kişisel veriler").
    - **Alt agent'lar:** paralellik istediğinizde ana agent'tan arka plan işi başlatır.
    - **TUI:** Gateway'e bağlanır ve agent'lar/oturumlar arasında geçiş yapar.

    Dokümanlar: [Düğümler](/tr/nodes), [Uzaktan erişim](/tr/gateway/remote), [Çoklu Agent Yönlendirme](/tr/concepts/multi-agent), [Alt agent'lar](/tr/tools/subagents), [TUI](/tr/web/tui).

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

    Varsayılan `false` değeridir (headful). Headless bazı sitelerde anti-bot kontrollerini tetikleme olasılığı daha yüksektir. Bkz. [Tarayıcı](/tr/tools/browser).

    Headless **aynı Chromium motorunu** kullanır ve çoğu otomasyon için çalışır (formlar, tıklamalar, scraping, girişler). Ana farklar:

    - Görünür tarayıcı penceresi yoktur (görsellere ihtiyacınız varsa ekran görüntülerini kullanın).
    - Bazı siteler headless modda otomasyona karşı daha katıdır (CAPTCHA'lar, anti-bot).
      Örneğin, X/Twitter çoğu zaman headless oturumları engeller.

  </Accordion>

  <Accordion title="Tarayıcı kontrolü için Brave'i nasıl kullanırım?">
    `browser.executablePath` değerini Brave binary'nize (veya herhangi bir Chromium tabanlı tarayıcıya) ayarlayın ve Gateway'i yeniden başlatın.
    Tam yapılandırma örnekleri için [Tarayıcı](/tr/tools/browser#use-brave-or-another-chromium-based-browser) bölümüne bakın.
  </Accordion>
</AccordionGroup>

## Uzak gateway'ler ve düğümler

<AccordionGroup>
  <Accordion title="Komutlar Telegram, gateway ve düğümler arasında nasıl yayılır?">
    Telegram mesajları **gateway** tarafından işlenir. Gateway agent'ı çalıştırır ve
    yalnızca bir düğüm aracı gerektiğinde **Gateway WebSocket** üzerinden düğümleri çağırır:

    Telegram → Gateway → Agent → `node.*` → Düğüm → Gateway → Telegram

    Düğümler gelen sağlayıcı trafiğini görmez; yalnızca düğüm RPC çağrılarını alırlar.

  </Accordion>

  <Accordion title="Gateway uzakta barındırılıyorsa agent'ım bilgisayarıma nasıl erişebilir?">
    Kısa cevap: **bilgisayarınızı düğüm olarak eşleştirin**. Gateway başka yerde çalışır, ancak Gateway WebSocket üzerinden yerel makinenizdeki `node.*` araçlarını (ekran, kamera, sistem) çağırabilir.

    Tipik kurulum:

    1. Gateway'i her zaman açık host'ta (VPS/ev sunucusu) çalıştırın.
    2. Gateway host'unu ve bilgisayarınızı aynı tailnet'e koyun.
    3. Gateway WS'nin erişilebilir olduğundan emin olun (tailnet bind veya SSH tüneli).
    4. macOS uygulamasını yerelde açın ve düğüm olarak kaydolabilmesi için **SSH Üzerinden Uzak** modda (veya doğrudan tailnet) bağlanın.
    5. Gateway'de düğümü onaylayın:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Ayrı bir TCP köprüsü gerekmez; düğümler Gateway WebSocket üzerinden bağlanır.

    Güvenlik hatırlatması: bir macOS düğümünü eşleştirmek, o makinede `system.run` çalıştırılmasına izin verir. Yalnızca
    güvendiğiniz cihazları eşleştirin ve [Güvenlik](/tr/gateway/security) sayfasını inceleyin.

    Dokümanlar: [Düğümler](/tr/nodes), [Gateway protokolü](/tr/gateway/protocol), [macOS uzak modu](/tr/platforms/mac/remote), [Güvenlik](/tr/gateway/security).

  </Accordion>

  <Accordion title="Tailscale bağlı ama yanıt alamıyorum. Şimdi ne yapmalıyım?">
    Temel kontrolleri yapın:

    - Gateway çalışıyor: `openclaw gateway status`
    - Gateway sağlığı: `openclaw status`
    - Kanal sağlığı: `openclaw channels status`

    Ardından kimlik doğrulamayı ve yönlendirmeyi doğrulayın:

    - Tailscale Serve kullanıyorsanız, `gateway.auth.allowTailscale` değerinin doğru ayarlandığından emin olun.
    - SSH tüneli üzerinden bağlanıyorsanız, yerel tünelin açık olduğunu ve doğru porta işaret ettiğini doğrulayın.
    - Allowlist'lerinizin (DM veya grup) hesabınızı içerdiğini doğrulayın.

    Dokümanlar: [Tailscale](/tr/gateway/tailscale), [Uzaktan erişim](/tr/gateway/remote), [Kanallar](/tr/channels).

  </Accordion>

  <Accordion title="İki OpenClaw instance'ı birbirleriyle konuşabilir mi (yerel + VPS)?">
    Evet. Yerleşik bir "bot-to-bot" köprüsü yoktur, ancak bunu birkaç
    güvenilir şekilde bağlayabilirsiniz:

    **En basit:** iki botun da erişebildiği normal bir sohbet kanalı kullanın (Telegram/Slack/WhatsApp).
    Bot A'nın Bot B'ye mesaj göndermesini sağlayın, ardından Bot B'nin her zamanki gibi yanıtlamasına izin verin.

    **CLI köprüsü (genel):** diğer Gateway'i `openclaw agent --message ... --deliver` ile çağıran ve diğer botun
    dinlediği bir sohbeti hedefleyen bir script çalıştırın. Bir bot uzak VPS'teyse CLI'nizi SSH/Tailscale üzerinden o uzak Gateway'e
    yönlendirin (bkz. [Uzaktan erişim](/tr/gateway/remote)).

    Örnek desen (hedef Gateway'e erişebilen bir makineden çalıştırın):

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    İpucu: iki botun sonsuz döngüye girmemesi için bir güvenlik sınırı ekleyin (yalnızca mention, kanal
    allowlist'leri veya "bot mesajlarına yanıt verme" kuralı).

    Dokümanlar: [Uzaktan erişim](/tr/gateway/remote), [Agent CLI](/tr/cli/agent), [Agent gönderme](/tr/tools/agent-send).

  </Accordion>

  <Accordion title="Birden fazla agent için ayrı VPS'lere ihtiyacım var mı?">
    Hayır. Bir Gateway, her biri kendi çalışma alanına, model varsayılanlarına
    ve yönlendirmesine sahip birden fazla agent barındırabilir. Normal kurulum budur ve
    agent başına bir VPS çalıştırmaktan çok daha ucuz ve basittir.

    Ayrı VPS'leri yalnızca güçlü izolasyona (güvenlik sınırları) veya paylaşmak istemediğiniz
    çok farklı yapılandırmalara ihtiyaç duyduğunuzda kullanın. Aksi takdirde, tek bir Gateway tutun ve
    birden fazla agent veya alt agent kullanın.

  </Accordion>

  <Accordion title="Kişisel dizüstü bilgisayarımdaki bir node kullanmanın, bir VPS'ten SSH kullanmaya göre bir faydası var mı?">
    Evet - node'lar, uzak bir Gateway'den dizüstü bilgisayarınıza erişmenin birinci sınıf yoludur ve
    kabuk erişiminden fazlasını sağlar. Gateway macOS/Linux üzerinde çalışır (WSL2 ile Windows) ve
    hafiftir (küçük bir VPS veya Raspberry Pi sınıfı bir cihaz uygundur; 4 GB RAM fazlasıyla yeterlidir), bu yüzden yaygın
    kurulum, sürekli açık bir ana makineye ek olarak dizüstü bilgisayarınızı node olarak kullanmaktır.

    - **Gelen SSH gerekmez.** Node'lar Gateway WebSocket'e dışarı doğru bağlanır ve cihaz eşleştirmesi kullanır.
    - **Daha güvenli yürütme kontrolleri.** `system.run`, o dizüstü bilgisayardaki node izin listeleri/onayları tarafından denetlenir.
    - **Daha fazla cihaz aracı.** Node'lar `system.run` ek olarak `canvas`, `camera` ve `screen` sunar.
    - **Yerel tarayıcı otomasyonu.** Gateway'i bir VPS üzerinde tutun, ancak Chrome'u dizüstü bilgisayardaki bir node ana makinesi üzerinden yerel olarak çalıştırın veya Chrome MCP üzerinden ana makinedeki yerel Chrome'a bağlanın.

    SSH, geçici kabuk erişimi için uygundur, ancak node'lar sürekli agent iş akışları ve
    cihaz otomasyonu için daha basittir.

    Belgeler: [Node'lar](/tr/nodes), [Node'lar CLI](/tr/cli/nodes), [Tarayıcı](/tr/tools/browser).

  </Accordion>

  <Accordion title="Node'lar bir gateway hizmeti çalıştırır mı?">
    Hayır. Bilerek yalıtılmış profiller çalıştırmıyorsanız (bkz. [Birden fazla gateway](/tr/gateway/multiple-gateways)), ana makine başına yalnızca **bir gateway** çalışmalıdır. Node'lar gateway'e bağlanan çevre birimleridir
    (iOS/Android node'ları veya menü çubuğu uygulamasında macOS "node modu"). Başsız node
    ana makineleri ve CLI kontrolü için bkz. [Node ana makinesi CLI](/tr/cli/node).

    `gateway`, `discovery` ve barındırılan plugin yüzeyi değişiklikleri için tam yeniden başlatma gerekir.

  </Accordion>

  <Accordion title="Yapılandırmayı uygulamanın bir API / RPC yolu var mı?">
    Evet.

    - `config.schema.lookup`: yazmadan önce bir yapılandırma alt ağacını, sığ şema düğümü, eşleşen UI ipucu ve doğrudan alt özetleriyle inceleyin
    - `config.get`: geçerli anlık görüntüyü + hash'i alın
    - `config.patch`: güvenli kısmi güncelleme (çoğu RPC düzenlemesi için tercih edilir); mümkün olduğunda sıcak yeniden yükleme yapar, gerektiğinde yeniden başlatır
    - `config.apply`: tam yapılandırmayı doğrular + değiştirir; mümkün olduğunda sıcak yeniden yükleme yapar, gerektiğinde yeniden başlatır
    - Agent'a dönük `gateway` çalışma zamanı aracı hâlâ `tools.exec.ask` / `tools.exec.security` yeniden yazmayı reddeder; eski `tools.bash.*` takma adları aynı korumalı exec yollarına normalize edilir

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

    1. **VPS'e kurun + oturum açın**

       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```

    2. **Mac'inize kurun + oturum açın**
       - Tailscale uygulamasını kullanın ve aynı tailnet'te oturum açın.
    3. **MagicDNS'i etkinleştirin (önerilir)**
       - Tailscale yönetici konsolunda, VPS'in kararlı bir ada sahip olması için MagicDNS'i etkinleştirin.
    4. **tailnet ana makine adını kullanın**
       - SSH: `ssh user@your-vps.tailnet-xxxx.ts.net`
       - Gateway WS: `ws://your-vps.tailnet-xxxx.ts.net:18789`

    SSH olmadan Control UI istiyorsanız, VPS üzerinde Tailscale Serve kullanın:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Bu, gateway'i loopback'e bağlı tutar ve HTTPS'i Tailscale üzerinden sunar. Bkz. [Tailscale](/tr/gateway/tailscale).

  </Accordion>

  <Accordion title="Bir Mac node'unu uzak bir Gateway'e nasıl bağlarım (Tailscale Serve)?">
    Serve, **Gateway Control UI + WS** sunar. Node'lar aynı Gateway WS uç noktası üzerinden bağlanır.

    Önerilen kurulum:

    1. **VPS + Mac'in aynı tailnet'te olduğundan emin olun**.
    2. **macOS uygulamasını Uzak modda kullanın** (SSH hedefi tailnet ana makine adı olabilir).
       Uygulama Gateway portunu tünelleyecek ve node olarak bağlanacaktır.
    3. Gateway'de **node'u onaylayın**:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Belgeler: [Gateway protokolü](/tr/gateway/protocol), [Discovery](/tr/gateway/discovery), [macOS uzak mod](/tr/platforms/mac/remote).

  </Accordion>

  <Accordion title="İkinci bir dizüstü bilgisayara kurulum yapmalı mıyım, yoksa yalnızca bir node mu eklemeliyim?">
    İkinci dizüstü bilgisayarda yalnızca **yerel araçlara** (screen/camera/exec) ihtiyacınız varsa, onu
    **node** olarak ekleyin. Bu, tek bir Gateway'i korur ve yinelenen yapılandırmayı önler. Yerel node araçları
    şu anda yalnızca macOS içindir, ancak bunları diğer işletim sistemlerine genişletmeyi planlıyoruz.

    İkinci bir Gateway'i yalnızca **katı yalıtım** veya tamamen ayrı iki bot gerektiğinde kurun.

    Belgeler: [Node'lar](/tr/nodes), [Node'lar CLI](/tr/cli/nodes), [Birden fazla gateway](/tr/gateway/multiple-gateways).

  </Accordion>
</AccordionGroup>

## Ortam değişkenleri ve .env yükleme

<AccordionGroup>
  <Accordion title="OpenClaw ortam değişkenlerini nasıl yükler?">
    OpenClaw, ortam değişkenlerini üst süreçten (kabuk, launchd/systemd, CI vb.) okur ve ayrıca şunları yükler:

    - geçerli çalışma dizininden `.env`
    - `~/.openclaw/.env` konumundan genel bir yedek `.env` (diğer adıyla `$OPENCLAW_STATE_DIR/.env`)

    Hiçbir `.env` dosyası mevcut ortam değişkenlerini geçersiz kılmaz.
    Sağlayıcı kimlik bilgisi değişkenleri çalışma alanı `.env` için bir istisnadır: `GEMINI_API_KEY`,
    `XAI_API_KEY` veya `MISTRAL_API_KEY` gibi anahtarlar çalışma alanı `.env`
    içinden yok sayılır ve süreç ortamında, `~/.openclaw/.env` içinde veya yapılandırma `env` içinde bulunmalıdır.

    Yapılandırmada satır içi ortam değişkenleri de tanımlayabilirsiniz (yalnızca süreç ortamında eksikse uygulanır):

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

  <Accordion title="Gateway'i hizmet üzerinden başlattım ve ortam değişkenlerim kayboldu. Şimdi ne yapmalıyım?">
    İki yaygın düzeltme:

    1. Eksik anahtarları `~/.openclaw/.env` içine koyun; böylece hizmet kabuk ortamınızı devralmasa bile alınırlar.
    2. Kabuk içe aktarmayı etkinleştirin (tercihe bağlı kolaylık):

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

    Bu, oturum açma kabuğunuzu çalıştırır ve yalnızca eksik beklenen anahtarları içe aktarır (asla geçersiz kılmaz). Ortam değişkeni eşdeğerleri:
    `OPENCLAW_LOAD_SHELL_ENV=1`, `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`.

  </Accordion>

  <Accordion title='COPILOT_GITHUB_TOKEN ayarladım, ancak model durumu "Shell env: off." gösteriyor. Neden?'>
    `openclaw models status`, **kabuk ortamı içe aktarmanın** etkin olup olmadığını bildirir. "Shell env: off",
    ortam değişkenlerinizin eksik olduğu anlamına **gelmez** - yalnızca OpenClaw'ın
    oturum açma kabuğunuzu otomatik olarak yüklemeyeceği anlamına gelir.

    Gateway bir hizmet (launchd/systemd) olarak çalışıyorsa, kabuk
    ortamınızı devralmaz. Şunlardan birini yaparak düzeltin:

    1. Token'ı `~/.openclaw/.env` içine koyun:

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. Veya kabuk içe aktarmayı etkinleştirin (`env.shellEnv.enabled: true`).
    3. Veya bunu yapılandırma `env` bloğunuza ekleyin (yalnızca eksikse uygulanır).

    Ardından gateway'i yeniden başlatın ve tekrar kontrol edin:

    ```bash
    openclaw models status
    ```

    Copilot token'ları `COPILOT_GITHUB_TOKEN` üzerinden okunur (ayrıca `GH_TOKEN` / `GITHUB_TOKEN`).
    Bkz. [/concepts/model-providers](/tr/concepts/model-providers) ve [/environment](/tr/help/environment).

  </Accordion>
</AccordionGroup>

## Oturumlar ve birden fazla sohbet

<AccordionGroup>
  <Accordion title="Yeni bir konuşmaya nasıl başlarım?">
    Bağımsız bir mesaj olarak `/new` veya `/reset` gönderin. Bkz. [Oturum yönetimi](/tr/concepts/session).
  </Accordion>

  <Accordion title="Hiç /new göndermesem oturumlar otomatik olarak sıfırlanır mı?">
    Oturumlar `session.idleMinutes` sonrasında sona erebilir, ancak bu **varsayılan olarak devre dışıdır** (varsayılan **0**).
    Boşta kalma süresiyle sona ermeyi etkinleştirmek için bunu pozitif bir değere ayarlayın. Etkinleştirildiğinde, boşta kalma süresinden sonraki **bir sonraki**
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

  <Accordion title="Bir OpenClaw instance ekibi oluşturmanın bir yolu var mı (bir CEO ve çok sayıda agent)?">
    Evet, **çoklu agent yönlendirme** ve **alt agent'lar** üzerinden. Kendi çalışma alanları ve modelleri olan bir koordinatör
    agent ve birkaç worker agent oluşturabilirsiniz.

    Bununla birlikte, bunu en iyi **eğlenceli bir deney** olarak görmek gerekir. Token açısından ağırdır ve çoğu zaman
    ayrı oturumlarla tek bir bot kullanmaktan daha az verimlidir. Öngördüğümüz tipik model,
    konuştuğunuz tek bir bot ve paralel işler için farklı oturumlardır. Bu
    bot gerektiğinde alt agent'lar da başlatabilir.

    Belgeler: [Çoklu agent yönlendirme](/tr/concepts/multi-agent), [Alt agent'lar](/tr/tools/subagents), [Agent'lar CLI](/tr/cli/agents).

  </Accordion>

  <Accordion title="Bağlam neden görevin ortasında kırpıldı? Bunu nasıl önlerim?">
    Oturum bağlamı model penceresiyle sınırlıdır. Uzun sohbetler, büyük araç çıktıları veya çok sayıda
    dosya Compaction ya da kırpmayı tetikleyebilir.

    Yardımcı olanlar:

    - Bottan geçerli durumu özetlemesini ve bir dosyaya yazmasını isteyin.
    - Uzun görevlerden önce `/compact`, konu değiştirirken `/new` kullanın.
    - Önemli bağlamı çalışma alanında tutun ve bottan onu tekrar okumasını isteyin.
    - Ana sohbetin daha küçük kalması için uzun veya paralel işler için alt agent'lar kullanın.
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

    - Mevcut yapılandırma görürse onboarding ayrıca **Sıfırla** seçeneğini sunar. Bkz. [Onboarding (CLI)](/tr/start/wizard).
    - Profiller kullandıysanız (`--profile` / `OPENCLAW_PROFILE`), her state dizinini sıfırlayın (varsayılanlar `~/.openclaw-<profile>`).
    - Geliştirme sıfırlaması: `openclaw gateway --dev --reset` (yalnızca geliştirme; geliştirme yapılandırmasını + kimlik bilgilerini + oturumları + çalışma alanını siler).

  </Accordion>

  <Accordion title='"context too large" hataları alıyorum - nasıl sıfırlar veya compact yaparım?'>
    Şunlardan birini kullanın:

    - **Compact** (konuşmayı tutar ancak eski dönüşleri özetler):

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

  <Accordion title='"LLM request rejected: messages.content.tool_use.input field required" neden görüyorum?'>
    Bu bir sağlayıcı doğrulama hatasıdır: model, gerekli `input` olmadan bir `tool_use` bloğu üretti.
    Genellikle oturum geçmişinin eski veya bozulmuş olduğu anlamına gelir (çoğunlukla uzun iş parçacıklarından
    veya bir araç/şema değişikliğinden sonra).

    Düzeltme: `/new` ile yeni bir oturum başlatın (bağımsız mesaj).

  </Accordion>

  <Accordion title="Neden her 30 dakikada bir heartbeat mesajları alıyorum?">
    Heartbeat'ler varsayılan olarak her **30d** çalışır (OAuth kimlik doğrulaması kullanırken **1s**). Bunları ayarlayın veya devre dışı bırakın:

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

    If `HEARTBEAT.md` varsa ancak fiilen boşsa (yalnızca boş satırlar,
    Markdown/HTML yorumları, `# Heading` gibi Markdown başlıkları, fence işaretleri
    veya boş checklist taslakları içeriyorsa), OpenClaw API çağrılarını azaltmak için heartbeat çalıştırmasını atlar.
    Dosya yoksa heartbeat yine çalışır ve model ne yapılacağına karar verir.

    Ajan başına geçersiz kılmalar `agents.list[].heartbeat` kullanır. Belgeler: [Heartbeat](/tr/gateway/heartbeat).

  </Accordion>

  <Accordion title='WhatsApp grubuna bir "bot hesabı" eklemem gerekiyor mu?'>
    Hayır. OpenClaw **kendi hesabınızda** çalışır; bu nedenle gruptaysanız OpenClaw onu görebilir.
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

  <Accordion title="Bir WhatsApp grubunun JID değerini nasıl alırım?">
    Seçenek 1 (en hızlı): günlükleri izleyin ve grupta bir test mesajı gönderin:

    ```bash
    openclaw logs --follow --json
    ```

    `@g.us` ile biten `chatId` (veya `from`) değerini arayın, örneğin:
    `1234567890-1234567890@g.us`.

    Seçenek 2 (zaten yapılandırılmış/allowlist'e alınmışsa): yapılandırmadan grupları listeleyin:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    Belgeler: [WhatsApp](/tr/channels/whatsapp), [Directory](/tr/cli/directory), [Logs](/tr/cli/logs).

  </Accordion>

  <Accordion title="OpenClaw neden bir grupta yanıt vermiyor?">
    İki yaygın neden:

    - Mention gating açıktır (varsayılan). Botu @mention ile etiketlemelisiniz (veya `mentionPatterns` ile eşleşmelisiniz).
    - `channels.whatsapp.groups` yapılandırdınız ancak `"*"` eklemediniz ve grup allowlist'te değil.

    Bkz. [Groups](/tr/channels/groups) ve [Group messages](/tr/channels/group-messages).

  </Accordion>

  <Accordion title="Gruplar/iş parçacıkları DM'lerle bağlam paylaşır mı?">
    Doğrudan sohbetler varsayılan olarak ana oturuma daraltılır. Grupların/kanalların kendi oturum anahtarları vardır ve Telegram konuları / Discord iş parçacıkları ayrı oturumlardır. Bkz. [Groups](/tr/channels/groups) ve [Group messages](/tr/channels/group-messages).
  </Accordion>

  <Accordion title="Kaç çalışma alanı ve ajan oluşturabilirim?">
    Katı sınırlar yok. Düzinelerce (hatta yüzlerce) sorun değildir, ancak şunlara dikkat edin:

    - **Disk büyümesi:** oturumlar + transkriptler `~/.openclaw/agents/<agentId>/sessions/` altında bulunur.
    - **Token maliyeti:** daha fazla ajan, daha fazla eşzamanlı model kullanımı demektir.
    - **Operasyon yükü:** ajan başına auth profilleri, çalışma alanları ve kanal yönlendirme.

    İpuçları:

    - Ajan başına bir **etkin** çalışma alanı tutun (`agents.defaults.workspace`).
    - Disk büyürse eski oturumları budayın (JSONL veya store girdilerini silin).
    - Başıboş çalışma alanlarını ve profil uyumsuzluklarını bulmak için `openclaw doctor` kullanın.

  </Accordion>

  <Accordion title="Aynı anda birden fazla bot veya sohbet çalıştırabilir miyim (Slack) ve bunu nasıl kurmalıyım?">
    Evet. Birden fazla yalıtılmış ajan çalıştırmak ve gelen mesajları
    kanal/hesap/eşe göre yönlendirmek için **Multi-Agent Routing** kullanın. Slack bir kanal olarak desteklenir ve belirli ajanlara bağlanabilir.

    Tarayıcı erişimi güçlüdür ancak "bir insanın yapabildiği her şeyi yapabilir" değildir; anti-bot, CAPTCHA'lar ve MFA
    otomasyonu yine de engelleyebilir. En güvenilir tarayıcı kontrolü için host üzerinde yerel Chrome MCP kullanın
    veya tarayıcıyı gerçekten çalıştıran makinede CDP kullanın.

    En iyi uygulama kurulumu:

    - Sürekli açık Gateway host'u (VPS/Mac mini).
    - Rol başına bir ajan (bağlamalar).
    - Bu ajanlara bağlanmış Slack kanal(ları).
    - Gerektiğinde Chrome MCP veya bir node üzerinden yerel tarayıcı.

    Belgeler: [Multi-Agent Routing](/tr/concepts/multi-agent), [Slack](/tr/channels/slack),
    [Browser](/tr/tools/browser), [Nodes](/tr/nodes).

  </Accordion>
</AccordionGroup>

## Modeller, failover ve auth profilleri

Model SSS — varsayılanlar, seçim, alias'lar, geçiş, failover, auth profilleri —
[Models FAQ](/tr/help/faq-models) sayfasında bulunur.

## Gateway: bağlantı noktaları, "zaten çalışıyor" ve uzak mod

<AccordionGroup>
  <Accordion title="Gateway hangi bağlantı noktasını kullanır?">
    `gateway.port`, WebSocket + HTTP (Control UI, hook'lar vb.) için tek çoklanmış bağlantı noktasını kontrol eder.

    Öncelik:

    ```
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > default 18789
    ```

  </Accordion>

  <Accordion title='openclaw gateway status neden "Runtime: running" ama "Connectivity probe: failed" diyor?'>
    Çünkü "running", **supervisor** görünümüdür (launchd/systemd/schtasks). Bağlanabilirlik probu ise CLI'nin gerçekten gateway WebSocket'e bağlanmasıdır.

    `openclaw gateway status` kullanın ve şu satırlara güvenin:

    - `Probe target:` (probun gerçekten kullandığı URL)
    - `Listening:` (bağlantı noktasında gerçekten bağlı olan şey)
    - `Last gateway error:` (süreç canlıyken ancak bağlantı noktası dinlemezken yaygın kök neden)

  </Accordion>

  <Accordion title='openclaw gateway status neden "Config (cli)" ve "Config (service)" değerlerini farklı gösteriyor?'>
    Servis başka bir yapılandırma dosyasıyla çalışırken siz başka bir yapılandırma dosyasını düzenliyorsunuz (çoğunlukla `--profile` / `OPENCLAW_STATE_DIR` uyumsuzluğu).

    Düzeltme:

    ```bash
    openclaw gateway install --force
    ```

    Bunu servisin kullanmasını istediğiniz aynı `--profile` / ortamdan çalıştırın.

  </Accordion>

  <Accordion title='"another gateway instance is already listening" ne anlama gelir?'>
    OpenClaw başlangıçta WebSocket dinleyicisini hemen bağlayarak çalışma zamanı kilidini uygular (varsayılan `ws://127.0.0.1:18789`). Bağlama `EADDRINUSE` ile başarısız olursa, başka bir instance'ın zaten dinlediğini belirten `GatewayLockError` fırlatır.

    Düzeltme: diğer instance'ı durdurun, bağlantı noktasını serbest bırakın veya `openclaw gateway --port <port>` ile çalıştırın.

  </Accordion>

  <Accordion title="OpenClaw'ı uzak modda nasıl çalıştırırım (istemci başka yerdeki bir Gateway'e bağlanır)?">
    `gateway.mode: "remote"` ayarlayın ve isteğe bağlı olarak shared-secret uzak kimlik bilgileriyle birlikte uzak bir WebSocket URL'si gösterin:

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

    - `openclaw gateway` yalnızca `gateway.mode` `local` olduğunda (veya override flag'ini ilettiğinizde) başlar.
    - macOS uygulaması yapılandırma dosyasını izler ve bu değerler değiştiğinde modları canlı olarak değiştirir.
    - `gateway.remote.token` / `.password` yalnızca istemci tarafı uzak kimlik bilgileridir; yerel gateway auth'u tek başlarına etkinleştirmezler.

  </Accordion>

  <Accordion title='Control UI "unauthorized" diyor (veya yeniden bağlanmaya devam ediyor). Şimdi ne yapmalıyım?'>
    Gateway auth yolunuz ve UI'nin auth yöntemi eşleşmiyor.

    Gerçekler (koddan):

    - Control UI, token'ı geçerli tarayıcı sekmesi oturumu ve seçili gateway URL'si için `sessionStorage` içinde tutar; bu nedenle aynı sekmedeki yenilemeler, uzun ömürlü localStorage token kalıcılığını geri yüklemeden çalışmaya devam eder.
    - `AUTH_TOKEN_MISMATCH` durumunda, güvenilen istemciler gateway yeniden deneme ipuçları döndürdüğünde (`canRetryWithDeviceToken=true`, `recommendedNextStep=retry_with_device_token`) önbelleğe alınmış bir cihaz token'ı ile tek sınırlı yeniden deneme girişiminde bulunabilir.
    - Bu önbelleğe alınmış token yeniden denemesi artık cihaz token'ıyla saklanan önbelleğe alınmış onaylı kapsamları yeniden kullanır. Açık `deviceToken` / açık `scopes` çağıranları, önbelleğe alınmış kapsamları miras almak yerine istenen kapsam kümesini korumaya devam eder.
    - Bu yeniden deneme yolunun dışında, bağlantı auth önceliği önce açık paylaşılan token/parola, sonra açık `deviceToken`, sonra saklanan cihaz token'ı, sonra bootstrap token'dır.
    - Yerleşik setup-code bootstrap yalnızca node içindir. Onaydan sonra `scopes: []` ile bir node cihaz token'ı döndürür ve devredilmiş bir operatör token'ı döndürmez.

    Düzeltme:

    - En hızlı: `openclaw dashboard` (dashboard URL'sini yazdırır + kopyalar, açmayı dener; headless ise SSH ipucu gösterir).
    - Henüz token'ınız yoksa: `openclaw doctor --generate-gateway-token`.
    - Uzaksa, önce tünel açın: `ssh -N -L 18789:127.0.0.1:18789 user@host` ardından `http://127.0.0.1:18789/` açın.
    - Shared-secret modu: `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` veya `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` ayarlayın, ardından eşleşen secret'ı Control UI ayarlarına yapıştırın.
    - Tailscale Serve modu: `gateway.auth.allowTailscale` etkin olduğundan ve Tailscale kimlik başlıklarını atlayan ham bir loopback/tailnet URL'si değil, Serve URL'sini açtığınızdan emin olun.
    - Trusted-proxy modu: ham gateway URL'si değil, yapılandırılmış identity-aware proxy üzerinden geldiğinizden emin olun. Aynı host'taki loopback proxy'leri de `gateway.auth.trustedProxy.allowLoopback = true` gerektirir.
    - Bir yeniden denemeden sonra uyumsuzluk devam ederse eşleşmiş cihaz token'ını döndürün/yeniden onaylayın:
      - `openclaw devices list`
      - `openclaw devices rotate --device <id> --role operator`
    - Bu rotate çağrısı reddedildiğini söylüyorsa iki şeyi kontrol edin:
      - eşleştirilmiş cihaz oturumları, `operator.admin` da yoksa yalnızca **kendi** cihazlarını döndürebilir
      - açık `--scope` değerleri çağıranın mevcut operatör kapsamlarını aşamaz
    - Hâlâ takıldıysanız `openclaw status --all` çalıştırın ve [Troubleshooting](/tr/gateway/troubleshooting) adımlarını izleyin. Auth ayrıntıları için [Dashboard](/tr/web/dashboard) bölümüne bakın.

  </Accordion>

  <Accordion title="gateway.bind tailnet ayarladım ama bağlanamıyor ve hiçbir şey dinlemiyor">
    `tailnet` bağlaması, ağ arayüzlerinizden bir Tailscale IP'si seçer (100.64.0.0/10). Makine Tailscale üzerinde değilse (veya arayüz kapalıysa), bağlanacak bir şey yoktur.

    Düzeltme:

    - O host'ta Tailscale'i başlatın (böylece 100.x adresi olur), veya
    - `gateway.bind: "loopback"` / `"lan"` değerine geçin.

    Not: `tailnet` açıktır. `auto` loopback'i tercih eder; yalnızca tailnet'e bağlanmak istediğinizde `gateway.bind: "tailnet"` kullanın.

  </Accordion>

  <Accordion title="Aynı host üzerinde birden fazla Gateway çalıştırabilir miyim?">
    Genellikle hayır; bir Gateway birden fazla mesajlaşma kanalını ve ajanı çalıştırabilir. Birden fazla Gateway'i yalnızca yedeklilik (örn: kurtarma botu) veya katı yalıtım gerektiğinde kullanın.

    Evet, ancak yalıtmanız gerekir:

    - `OPENCLAW_CONFIG_PATH` (instance başına yapılandırma)
    - `OPENCLAW_STATE_DIR` (instance başına durum)
    - `agents.defaults.workspace` (çalışma alanı yalıtımı)
    - `gateway.port` (benzersiz bağlantı noktaları)

    Hızlı kurulum (önerilir):

    - Her instance için `openclaw --profile <name> ...` kullanın (`~/.openclaw-<name>` otomatik oluşturulur).
    - Her profil yapılandırmasında benzersiz bir `gateway.port` ayarlayın (veya manuel çalıştırmalar için `--port` iletin).
    - Profil başına bir servis kurun: `openclaw --profile <name> gateway install`.

    Profiller ayrıca servis adlarına suffix ekler (`ai.openclaw.<profile>`; legacy `com.openclaw.*`, `openclaw-gateway-<profile>.service`, `OpenClaw Gateway (<profile>)`).
    Tam kılavuz: [Multiple gateways](/tr/gateway/multiple-gateways).

  </Accordion>

  <Accordion title='"invalid handshake" / kod 1008 ne anlama gelir?'>
    Gateway bir **WebSocket sunucusudur** ve ilk mesajın
    bir `connect` frame'i olmasını bekler. Başka bir şey alırsa bağlantıyı
    **kod 1008** (ilke ihlali) ile kapatır.

    Yaygın nedenler:

    - Bir WS istemcisi yerine tarayıcıda **HTTP** URL'sini açtınız (`http://...`).
    - Yanlış bağlantı noktasını veya yolu kullandınız.
    - Bir proxy veya tünel auth başlıklarını çıkardı ya da Gateway dışı bir istek gönderdi.

    Hızlı düzeltmeler:

    1. WS URL'sini kullanın: `ws://<host>:18789` (veya HTTPS ise `wss://...`).
    2. WS bağlantı noktasını normal bir tarayıcı sekmesinde açmayın.
    3. Auth açıksa token/parolayı `connect` frame'ine dahil edin.

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

    `logging.file` ile kararlı bir yol ayarlayabilirsiniz. Dosya günlük düzeyi `logging.level` tarafından denetlenir. Konsol ayrıntı düzeyi `--verbose` ve `logging.consoleLevel` tarafından denetlenir.

    En hızlı günlük izleme:

    ```bash
    openclaw logs --follow
    ```

    Hizmet/süpervizör günlükleri (Gateway launchd/systemd üzerinden çalıştığında):

    - macOS launchd stdout: `~/Library/Logs/openclaw/gateway.log` (profiller `gateway-<profile>.log` kullanır; stderr bastırılır)
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

    Gateway'i elle çalıştırıyorsanız, `openclaw gateway --force` bağlantı noktasını geri alabilir. Bkz. [Gateway](/tr/gateway).

  </Accordion>

  <Accordion title="Windows'ta terminalimi kapattım - OpenClaw'u nasıl yeniden başlatırım?">
    **Üç Windows kurulum modu** vardır:

    **1) Windows Hub yerel kurulumu:** yerel uygulama, uygulamaya ait yerel bir WSL Gateway'i yönetir.

    Başlat menüsünden veya tepsiden **OpenClaw Companion**'ı açın, ardından
    **Gateway Kurulumu**'nu veya Bağlantılar sekmesini kullanın.

    **2) Elle WSL2 Gateway:** Gateway Linux içinde çalışır.

    PowerShell'i açın, WSL'e girin, ardından yeniden başlatın:

    ```powershell
    wsl
    openclaw gateway status
    openclaw gateway restart
    ```

    Hizmeti hiç kurmadıysanız, ön planda başlatın:

    ```bash
    openclaw gateway run
    ```

    **3) Yerel Windows CLI/Gateway:** Gateway doğrudan Windows'ta çalışır.

    PowerShell'i açın ve çalıştırın:

    ```powershell
    openclaw gateway status
    openclaw gateway restart
    ```

    Elle çalıştırıyorsanız (hizmet yoksa), şunu kullanın:

    ```powershell
    openclaw gateway run
    ```

    Dokümanlar: [Windows](/tr/platforms/windows), [Gateway hizmeti çalışma kılavuzu](/tr/gateway).

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

    - Model kimlik doğrulaması **gateway ana makinesinde** yüklenmemiştir (`models status` değerini kontrol edin).
    - Kanal eşleştirme/izin listesi yanıtları engelliyordur (kanal yapılandırmasını ve günlükleri kontrol edin).
    - WebChat/Dashboard doğru belirteç olmadan açıktır.

    Uzak bağlantıdaysanız, tünel/Tailscale bağlantısının açık olduğunu ve
    Gateway WebSocket'ine erişilebildiğini doğrulayın.

    Dokümanlar: [Kanallar](/tr/channels), [Sorun giderme](/tr/gateway/troubleshooting), [Uzak erişim](/tr/gateway/remote).

  </Accordion>

  <Accordion title='"Gateway bağlantısı kesildi: neden yok" - şimdi ne yapmalıyım?'>
    Bu genellikle kullanıcı arayüzünün WebSocket bağlantısını kaybettiği anlamına gelir. Kontrol edin:

    1. Gateway çalışıyor mu? `openclaw gateway status`
    2. Gateway sağlıklı mı? `openclaw status`
    3. Kullanıcı arayüzünde doğru belirteç var mı? `openclaw dashboard`
    4. Uzak bağlantıdaysa, tünel/Tailscale bağlantısı açık mı?

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
    - `TypeError: fetch failed`, `Network request for 'setMyCommands' failed!` veya benzer ağ hataları: bir VPS üzerindeyseniz veya proxy arkasındaysanız, dışa giden HTTPS'ye izin verildiğini ve DNS'in `api.telegram.org` için çalıştığını doğrulayın.

    Gateway uzaksa, Gateway ana makinesindeki günlüklere baktığınızdan emin olun.

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
    kanalında yanıt bekliyorsanız, teslimatın etkin olduğundan emin olun (`/deliver on`).

    Dokümanlar: [TUI](/tr/web/tui), [Slash komutları](/tr/tools/slash-commands).

  </Accordion>

  <Accordion title="Gateway'i tamamen durdurup sonra nasıl başlatırım?">
    Hizmeti kurduysanız:

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    Bu, **denetlenen hizmeti** durdurur/başlatır (macOS'ta launchd, Linux'ta systemd).
    Gateway arka planda daemon olarak çalıştığında bunu kullanın.

    Ön planda çalıştırıyorsanız, Ctrl-C ile durdurun, ardından:

    ```bash
    openclaw gateway run
    ```

    Dokümanlar: [Gateway hizmeti çalışma kılavuzu](/tr/gateway).

  </Accordion>

  <Accordion title="ELI5: openclaw gateway restart ile openclaw gateway farkı">
    - `openclaw gateway restart`: **arka plan hizmetini** yeniden başlatır (launchd/systemd).
    - `openclaw gateway`: gateway'i bu terminal oturumu için **ön planda** çalıştırır.

    Hizmeti kurduysanız gateway komutlarını kullanın. Tek seferlik, ön planda bir çalıştırma
    istediğinizde `openclaw gateway` kullanın.

  </Accordion>

  <Accordion title="Bir şey başarısız olduğunda daha fazla ayrıntı almanın en hızlı yolu">
    Daha fazla konsol ayrıntısı almak için Gateway'i `--verbose` ile başlatın. Ardından kanal kimlik doğrulaması, model yönlendirme ve RPC hataları için günlük dosyasını inceleyin.
  </Accordion>
</AccordionGroup>

## Medya ve ekler

<AccordionGroup>
  <Accordion title="Skill'im bir görüntü/PDF oluşturdu, ancak hiçbir şey gönderilmedi">
    Agent'tan giden ekler `media`, `mediaUrl`, `path` veya `filePath` gibi yapılandırılmış medya alanlarını kullanmalıdır. Bkz. [OpenClaw asistan kurulumu](/tr/start/openclaw) ve [Agent gönderimi](/tr/tools/agent-send).

    CLI gönderimi:

    ```bash
    openclaw message send --target +15555550123 --message "Here you go" --media /path/to/file.png
    ```

    Şunları da kontrol edin:

    - Hedef kanal giden medyayı destekliyor ve izin listeleri tarafından engellenmiyor.
    - Dosya sağlayıcının boyut sınırları içindedir (görüntüler en fazla 2048px olacak şekilde yeniden boyutlandırılır).
    - `tools.fs.workspaceOnly=true`, yerel yol gönderimlerini çalışma alanı, geçici/medya deposu ve sandbox tarafından doğrulanmış dosyalarla sınırlı tutar.
    - `tools.fs.workspaceOnly=false`, yapılandırılmış yerel medya gönderimlerinin agent'ın zaten okuyabildiği ana makine yerel dosyalarını kullanmasına izin verir, ancak yalnızca medya ve güvenli belge türleri için (görüntüler, ses, video, PDF, Office belgeleri ve Markdown/MD, TXT, JSON, YAML ve YML gibi doğrulanmış metin belgeleri). Bu bir gizli bilgi tarayıcısı değildir: uzantı ve içerik doğrulaması eşleştiğinde agent tarafından okunabilir bir `secret.txt` veya `config.json` eklenebilir. Hassas dosyaları agent tarafından okunabilir yolların dışında tutun veya daha sıkı yerel yol gönderimleri için `tools.fs.workspaceOnly=true` ayarını koruyun.

    Bkz. [Görüntüler](/tr/nodes/images).

  </Accordion>
</AccordionGroup>

## Güvenlik ve erişim denetimi

<AccordionGroup>
  <Accordion title="OpenClaw'u gelen DM'lere açmak güvenli mi?">
    Gelen DM'leri güvenilmeyen girdi olarak ele alın. Varsayılanlar riski azaltmak üzere tasarlanmıştır:

    - DM destekleyen kanallarda varsayılan davranış **eşleştirme**dir:
      - Bilinmeyen gönderenler bir eşleştirme kodu alır; bot mesajlarını işlemez.
      - Şununla onaylayın: `openclaw pairing approve --channel <channel> [--account <id>] <code>`
      - Bekleyen istekler **kanal başına 3** ile sınırlıdır; kod gelmediyse `openclaw pairing list --channel <channel> [--account <id>]` komutunu kontrol edin.
    - DM'leri herkese açık açmak açıkça katılım gerektirir (`dmPolicy: "open"` ve izin listesi `"*"`).

    Riskli DM ilkelerini ortaya çıkarmak için `openclaw doctor` çalıştırın.

  </Accordion>

  <Accordion title="Prompt injection yalnızca herkese açık botlar için mi endişe kaynağıdır?">
    Hayır. Prompt injection, yalnızca bot'a kimin DM gönderebildiğiyle değil, **güvenilmeyen içerikle** ilgilidir.
    Asistanınız harici içerik okuyorsa (web arama/getirme, tarayıcı sayfaları, e-postalar,
    dokümanlar, ekler, yapıştırılmış günlükler), bu içerik modeli ele geçirmeye çalışan
    talimatlar içerebilir. Bu, **tek gönderen siz olsanız bile** gerçekleşebilir.

    En büyük risk araçlar etkin olduğunda ortaya çıkar: model, bağlamı dışarı sızdırmaya
    veya sizin adınıza araç çağırmaya kandırılabilir. Etki alanını şunlarla azaltın:

    - güvenilmeyen içeriği özetlemek için salt okunur veya araçları devre dışı bırakılmış bir "okuyucu" agent kullanmak
    - araçları etkin agent'lar için `web_search` / `web_fetch` / `browser` kapalı tutmak
    - çözümlenmiş dosya/belge metnini de güvenilmeyen kabul etmek: OpenResponses
      `input_file` ve medya eki ayıklama, ham dosya metnini geçirmek yerine ayıklanan metni
      açık harici içerik sınır işaretleyicileriyle sarar
    - sandbox kullanmak ve sıkı araç izin listeleri uygulamak

    Ayrıntılar: [Güvenlik](/tr/gateway/security).

  </Accordion>

  <Accordion title="OpenClaw Rust/WASM yerine TypeScript/Node kullandığı için daha mı az güvenli?">
    Dil ve çalışma zamanı önemlidir, ancak kişisel bir agent için ana risk değildir.
    Pratik OpenClaw riskleri gateway'in açığa çıkarılması, bot'a kimin mesaj gönderebildiği,
    prompt injection, araç kapsamı, kimlik bilgisi yönetimi, tarayıcı erişimi, exec
    erişimi ve üçüncü taraf skill veya plugin güvenidir.

    Rust ve WASM bazı kod sınıfları için daha güçlü yalıtım sağlayabilir, ancak
    prompt injection, kötü izin listeleri, herkese açık gateway açığı,
    aşırı geniş araçlar veya zaten hassas hesaplarda oturum açmış bir tarayıcı profilini
    çözmez. Bunları birincil denetimler olarak ele alın:

    - Gateway'i özel veya kimliği doğrulanmış tutun
    - DM'ler ve gruplar için eşleştirme ve izin listeleri kullanın
    - güvenilmeyen girdiler için riskli araçları reddedin veya sandbox'a alın
    - yalnızca güvenilir plugin'leri ve skill'leri kurun
    - yapılandırma değişikliklerinden sonra `openclaw security audit --deep` çalıştırın

    Ayrıntılar: [Güvenlik](/tr/gateway/security), [Sandbox kullanımı](/tr/gateway/sandboxing).

  </Accordion>

  <Accordion title="Açığa çıkarılmış OpenClaw örnekleri hakkında raporlar gördüm. Neyi kontrol etmeliyim?">
    Önce gerçek dağıtımınızı kontrol edin:

    ```bash
    openclaw security audit --deep
    openclaw gateway status
    ```

    Daha güvenli bir temel şudur:

    - Gateway `loopback` adresine bağlıdır veya yalnızca tailnet, SSH tüneli,
      belirteç/parola kimlik doğrulaması ya da doğru yapılandırılmış güvenilir proxy
      gibi kimliği doğrulanmış özel erişim üzerinden açığa çıkarılır
    - DM'ler `pairing` veya `allowlist` modundadır
    - tüm üyeler güvenilir değilse gruplar izin listesine alınmış ve bahsetme kapılıdır
    - güvenilmeyen içerik okuyan agent'lar için yüksek riskli araçlar (`exec`, `browser`, `gateway`, `cron`) reddedilmiş veya sıkı
      kapsamlandırılmıştır
    - araç yürütmenin daha küçük bir etki alanına ihtiyaç duyduğu yerlerde sandbox kullanımı etkindir

    Kimlik doğrulamasız herkese açık bağlamalar, araçlarla açık DM'ler/gruplar ve açığa çıkarılmış tarayıcı
    denetimi önce düzeltilmesi gereken bulgulardır. Ayrıntılar:
    [Güvenlik denetimi kontrol listesi](/tr/gateway/security#security-audit-checklist).

  </Accordion>

  <Accordion title="ClawHub skill'leri ve üçüncü taraf plugin'leri kurmak güvenli mi?">
    Üçüncü taraf skill'leri ve plugin'leri güvenmeyi seçtiğiniz kod olarak ele alın.
    ClawHub skill sayfaları kurulumdan önce tarama durumunu gösterir, ancak taramalar
    eksiksiz bir güvenlik sınırı değildir. OpenClaw, plugin veya skill kurulum/güncelleme
    akışları sırasında yerleşik yerel tehlikeli kod engellemesi çalıştırmaz; yerel
    izin/engelleme kararları için operatör tarafından sahip olunan `security.installPolicy` kullanın.

    Daha güvenli örüntü:

    - güvenilir yazarları ve sabitlenmiş sürümleri tercih edin
    - etkinleştirmeden önce skill'i veya plugin'i okuyun
    - plugin ve skill izin listelerini dar tutun
    - güvenilmeyen girdi iş akışlarını en az araçla bir sandbox içinde çalıştırın
    - üçüncü taraf koda geniş dosya sistemi, exec, tarayıcı veya gizli bilgi erişimi vermekten kaçının

    Ayrıntılar: [Skills](/tr/tools/skills), [Pluginler](/tr/tools/plugin),
    [Güvenlik](/tr/gateway/security).

  </Accordion>

  <Accordion title="Botumun kendi e-postası, GitHub hesabı veya telefon numarası olmalı mı?">
    Çoğu kurulum için evet. Botu ayrı hesaplar ve telefon numaralarıyla yalıtmak,
    bir şey ters giderse etki alanını azaltır. Bu ayrıca kişisel hesaplarınızı etkilemeden
    kimlik bilgilerini döndürmeyi veya erişimi iptal etmeyi kolaylaştırır.

    Küçük başlayın. Yalnızca gerçekten ihtiyaç duyduğunuz araçlara ve hesaplara erişim verin;
    gerekiyorsa daha sonra genişletin.

    Belgeler: [Güvenlik](/tr/gateway/security), [Eşleştirme](/tr/channels/pairing).

  </Accordion>

  <Accordion title="Metin mesajlarım üzerinde ona otonomi verebilir miyim ve bu güvenli mi?">
    Kişisel mesajlarınız üzerinde tam otonomi vermenizi **önermiyoruz**. En güvenli kalıp şudur:

    - DM'leri **eşleştirme modunda** veya sıkı bir izin listesinde tutun.
    - Sizin adınıza mesaj göndermesini istiyorsanız **ayrı bir numara veya hesap** kullanın.
    - Taslak hazırlamasına izin verin, sonra **göndermeden önce onaylayın**.

    Denemek istiyorsanız bunu özel bir hesapta yapın ve yalıtılmış tutun. Bkz.
    [Güvenlik](/tr/gateway/security).

  </Accordion>

  <Accordion title="Kişisel asistan görevleri için daha ucuz modeller kullanabilir miyim?">
    Evet, **eğer** ajan yalnızca sohbet amaçlıysa ve girdi güvenilirse. Daha küçük katmanlar
    talimat ele geçirmeye daha yatkındır; bu nedenle araç etkin ajanlarda
    veya güvenilmeyen içerik okunurken bunlardan kaçının. Daha küçük bir model kullanmanız gerekiyorsa,
    araçları sıkı şekilde kısıtlayın ve bir sandbox içinde çalıştırın. Bkz. [Güvenlik](/tr/gateway/security).
  </Accordion>

  <Accordion title="Telegram'da /start çalıştırdım ama eşleştirme kodu almadım">
    Eşleştirme kodları **yalnızca** bilinmeyen bir gönderici bota mesaj attığında ve
    `dmPolicy: "pairing"` etkin olduğunda gönderilir. `/start` tek başına kod oluşturmaz.

    Bekleyen istekleri kontrol edin:

    ```bash
    openclaw pairing list telegram
    ```

    Hemen erişim istiyorsanız gönderici kimliğinizi izin listesine alın veya o hesap için
    `dmPolicy: "open"` ayarlayın.

  </Accordion>

  <Accordion title="WhatsApp: kişilerime mesaj gönderir mi? Eşleştirme nasıl çalışır?">
    Hayır. Varsayılan WhatsApp DM ilkesi **eşleştirme**dir. Bilinmeyen göndericiler yalnızca bir eşleştirme kodu alır ve mesajları **işlenmez**. OpenClaw yalnızca aldığı sohbetlere veya sizin açıkça tetiklediğiniz gönderimlere yanıt verir.

    Eşleştirmeyi şununla onaylayın:

    ```bash
    openclaw pairing approve whatsapp <code>
    ```

    Bekleyen istekleri listeleyin:

    ```bash
    openclaw pairing list whatsapp
    ```

    Sihirbaz telefon numarası istemi: kendi DM'lerinize izin verilmesi için **izin listenizi/sahibinizi** ayarlamakta kullanılır. Otomatik gönderim için kullanılmaz. Kişisel WhatsApp numaranızda çalıştırıyorsanız o numarayı kullanın ve `channels.whatsapp.selfChatMode` öğesini etkinleştirin.

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

    Hâlâ gürültülüyse Control UI'daki oturum ayarlarını kontrol edin ve verbose değerini
    **inherit** olarak ayarlayın. Ayrıca yapılandırmada `verboseDefault` değeri
    `on` olarak ayarlanmış bir bot profili kullanmadığınızı doğrulayın.

    Belgeler: [Düşünme ve verbose](/tr/tools/thinking), [Güvenlik](/tr/gateway/security/index#reasoning-and-verbose-output-in-groups).

  </Accordion>

  <Accordion title="Çalışan bir görevi nasıl durdurur/iptal ederim?">
    Bunlardan herhangi birini **tek başına mesaj olarak** gönderin (eğik çizgi olmadan):

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

    Bunlar iptal tetikleyicileridir (eğik çizgili komutlar değildir).

    Arka plan işlemleri için (exec aracından), ajandan şunu çalıştırmasını isteyebilirsiniz:

    ```
    process action:kill sessionId:XXX
    ```

    Eğik çizgili komutlara genel bakış: bkz. [Eğik çizgili komutlar](/tr/tools/slash-commands).

    Çoğu komut, `/` ile başlayan **tek başına** bir mesaj olarak gönderilmelidir; ancak birkaç kısayol (`/status` gibi) izin listesindeki göndericiler için satır içinde de çalışır.

  </Accordion>

  <Accordion title='Telegram'dan Discord mesajı nasıl gönderirim? ("Bağlamlar arası mesajlaşma reddedildi")'>
    OpenClaw varsayılan olarak **sağlayıcılar arası** mesajlaşmayı engeller. Bir araç çağrısı
    Telegram'a bağlıysa, siz açıkça izin vermedikçe Discord'a göndermez.

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

    Yapılandırmayı düzenledikten sonra Gateway'i yeniden başlatın.

  </Accordion>

  <Accordion title='Botun hızlı gelen mesajları "yok sayıyor" gibi hissettirmesinin nedeni nedir?'>
    Çalışma ortasındaki istemler varsayılan olarak etkin çalışmaya yönlendirilir. Etkin çalışma davranışını seçmek için `/queue` kullanın:

    - `steer` - etkin çalışmayı bir sonraki model sınırında yönlendirir
    - `followup` - mesajları kuyruğa alır ve mevcut çalışma bittikten sonra tek tek çalıştırır
    - `collect` - uyumlu mesajları kuyruğa alır ve mevcut çalışma bittikten sonra bir kez yanıt verir
    - `interrupt` - mevcut çalışmayı iptal eder ve sıfırdan başlatır

    Varsayılan mod `steer` şeklindedir. Kuyruklu modlar için `debounce:0.5s cap:25 drop:summarize` gibi seçenekler ekleyebilirsiniz. Bkz. [Komut kuyruğu](/tr/concepts/queue) ve [Yönlendirme kuyruğu](/tr/concepts/queue-steering).

  </Accordion>
</AccordionGroup>

## Çeşitli

<AccordionGroup>
  <Accordion title='API anahtarıyla Anthropic için varsayılan model nedir?'>
    OpenClaw'da kimlik bilgileri ve model seçimi ayrıdır. `ANTHROPIC_API_KEY` ayarlamak (veya auth profillerinde bir Anthropic API anahtarı saklamak) kimlik doğrulamayı etkinleştirir, ancak gerçek varsayılan model `agents.defaults.model.primary` içinde yapılandırdığınız modeldir (örneğin, `anthropic/claude-sonnet-4-6` veya `anthropic/claude-opus-4-6`). `No credentials found for profile "anthropic:default"` görürseniz bu, Gateway'in çalışan ajan için beklenen `auth-profiles.json` içinde Anthropic kimlik bilgilerini bulamadığı anlamına gelir.
  </Accordion>
</AccordionGroup>

---

Hâlâ takıldınız mı? [Discord](https://discord.com/invite/clawd) üzerinde sorun veya bir [GitHub tartışması](https://github.com/openclaw/openclaw/discussions) açın.

## İlgili

- [İlk çalıştırma SSS](/tr/help/faq-first-run) — kurulum, onboard, auth, abonelikler, erken hatalar
- [Modeller SSS](/tr/help/faq-models) — model seçimi, failover, auth profilleri
- [Sorun giderme](/tr/help/troubleshooting) — belirti öncelikli triyaj
