---
read_when:
    - Yaygın kurulum, yükleme, ilk kullanıma alma veya çalışma zamanı desteği sorularını yanıtlama
    - Daha derin hata ayıklamadan önce kullanıcıların bildirdiği sorunları önceliklendirme
summary: OpenClaw kurulumu, yapılandırması ve kullanımı hakkında sık sorulan sorular
title: SSS
x-i18n:
    generated_at: "2026-05-02T22:19:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1437a84d7da0e4111edd46297b2a486e2da4f6e4a6cff0d69d6a372e85608130
    source_path: help/faq.md
    workflow: 16
---

Gerçek dünya kurulumları (yerel geliştirme, VPS, çoklu ajan, OAuth/API anahtarları, model yedekleme) için hızlı yanıtlar ve daha derin sorun giderme. Çalışma zamanı tanıları için [Sorun Giderme](/tr/gateway/troubleshooting) bölümüne bakın. Tam yapılandırma referansı için [Yapılandırma](/tr/gateway/configuration) bölümüne bakın.

## Bir şey bozulduysa ilk 60 saniye

1. **Hızlı durum (ilk kontrol)**

   ```bash
   openclaw status
   ```

   Hızlı yerel özet: OS + güncelleme, gateway/servis erişilebilirliği, ajanlar/oturumlar, sağlayıcı yapılandırması + çalışma zamanı sorunları (gateway erişilebilir olduğunda).

2. **Yapıştırılabilir rapor (paylaşmak için güvenli)**

   ```bash
   openclaw status --all
   ```

   Günlük sonuyla birlikte salt okunur tanı (token'lar redakte edilir).

3. **Daemon + port durumu**

   ```bash
   openclaw gateway status
   ```

   Denetleyici çalışma zamanı ile RPC erişilebilirliğini, prob hedef URL'sini ve servisin muhtemelen hangi yapılandırmayı kullandığını gösterir.

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

   RPC kapalıysa şuna geri dönün:

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   Dosya günlükleri servis günlüklerinden ayrıdır; bkz. [Günlükleme](/tr/logging) ve [Sorun Giderme](/tr/gateway/troubleshooting).

6. **Doctor'ı çalıştır (onarımlar)**

   ```bash
   openclaw doctor
   ```

   Yapılandırmayı/durumu onarır/geçirir + sağlık kontrollerini çalıştırır. Bkz. [Doctor](/tr/gateway/doctor).

7. **Gateway anlık görüntüsü**

   ```bash
   openclaw health --json
   openclaw health --verbose   # shows the target URL + config path on errors
   ```

   Çalışan gateway'den tam bir anlık görüntü ister (yalnızca WS). Bkz. [Sağlık](/tr/gateway/health).

## Hızlı başlangıç ve ilk çalıştırma kurulumu

İlk çalıştırma SSS'si — kurulum, başlangıç kurulumu, kimlik doğrulama rotaları, abonelikler, ilk hatalar —
[İlk çalıştırma SSS'si](/tr/help/faq-first-run) sayfasındadır.

## OpenClaw nedir?

<AccordionGroup>
  <Accordion title="OpenClaw bir paragrafta nedir?">
    OpenClaw, kendi cihazlarınızda çalıştırdığınız kişisel bir yapay zeka asistanıdır. Zaten kullandığınız mesajlaşma yüzeylerinde (WhatsApp, Telegram, Slack, Mattermost, Discord, Google Chat, Signal, iMessage, WebChat ve QQ Bot gibi birlikte gelen kanal plugin'leri) yanıt verir ve desteklenen platformlarda ses + canlı Canvas da kullanabilir. **Gateway** her zaman açık kontrol düzlemidir; ürün ise asistandır.
  </Accordion>

  <Accordion title="Değer önerisi">
    OpenClaw "sadece bir Claude sarmalayıcısı" değildir. Zaten kullandığınız sohbet uygulamalarından erişilebilen,
    **kendi donanımınızda** yetenekli bir asistan çalıştırmanızı sağlayan, durum bilgili oturumlar,
    bellek ve araçlar sunan **yerel öncelikli bir kontrol düzlemidir** - iş akışlarınızın kontrolünü barındırılan
    bir SaaS'a vermeden.

    Öne çıkanlar:

    - **Cihazlarınız, verileriniz:** Gateway'i istediğiniz yerde çalıştırın (Mac, Linux, VPS) ve
      çalışma alanı + oturum geçmişini yerel tutun.
    - **Web sanal alanı değil, gerçek kanallar:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage/vb,
      ayrıca desteklenen platformlarda mobil ses ve Canvas.
    - **Modelden bağımsız:** Anthropic, OpenAI, MiniMax, OpenRouter vb. kullanın; ajan başına yönlendirme
      ve yedekleme ile.
    - **Yalnızca yerel seçeneği:** İsterseniz **tüm verilerin cihazınızda kalabilmesi** için yerel modeller çalıştırın.
    - **Çoklu ajan yönlendirme:** Her biri kendi çalışma alanı ve varsayılanlarına sahip, kanal, hesap veya görev başına ayrı ajanlar.
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

    Büyük görevleri ele alabilir, ancak bunları aşamalara böldüğünüzde ve
    paralel çalışma için alt ajanlar kullandığınızda en iyi şekilde çalışır.

  </Accordion>

  <Accordion title="OpenClaw için günlük en iyi beş kullanım senaryosu nedir?">
    Günlük kazanımlar genellikle şöyle görünür:

    - **Kişisel brifingler:** Önemsediğiniz gelen kutusu, takvim ve haberlerin özetleri.
    - **Araştırma ve taslak oluşturma:** E-postalar veya dokümanlar için hızlı araştırma, özetler ve ilk taslaklar.
    - **Hatırlatıcılar ve takipler:** Cron veya Heartbeat ile çalışan dürtmeler ve kontrol listeleri.
    - **Tarayıcı otomasyonu:** Form doldurma, veri toplama ve web görevlerini tekrarlama.
    - **Cihazlar arası koordinasyon:** Telefonunuzdan bir görev gönderin, Gateway'in bunu bir sunucuda çalıştırmasına izin verin ve sonucu sohbette geri alın.

  </Accordion>

  <Accordion title="OpenClaw bir SaaS için lead gen, outreach, reklamlar ve bloglarda yardımcı olabilir mi?">
    **Araştırma, nitelendirme ve taslak oluşturma** için evet. Siteleri tarayabilir, kısa listeler oluşturabilir,
    potansiyel müşterileri özetleyebilir ve outreach ya da reklam metni taslakları yazabilir.

    **Outreach veya reklam çalışmaları** için döngüde bir insan bulundurun. Spam'den kaçının, yerel yasalara ve
    platform politikalarına uyun ve gönderilmeden önce her şeyi gözden geçirin. En güvenli desen,
    OpenClaw'ın taslak hazırlaması ve sizin onaylamanızdır.

    Dokümanlar: [Güvenlik](/tr/gateway/security).

  </Accordion>

  <Accordion title="Web geliştirme için Claude Code'a göre avantajları nelerdir?">
    OpenClaw bir **kişisel asistan** ve koordinasyon katmanıdır, IDE yerine geçmez. Bir repo içinde en hızlı doğrudan kodlama döngüsü için
    Claude Code veya Codex kullanın. Kalıcı bellek, cihazlar arası erişim ve araç orkestrasyonu
    istediğinizde OpenClaw kullanın.

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
  <Accordion title="Repo'yu kirli tutmadan skills'i nasıl özelleştiririm?">
    Repo kopyasını düzenlemek yerine yönetilen geçersiz kılmalar kullanın. Değişikliklerinizi `~/.openclaw/skills/<name>/SKILL.md` içine koyun (veya `~/.openclaw/openclaw.json` içindeki `skills.load.extraDirs` üzerinden bir klasör ekleyin). Öncelik sırası `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → birlikte gelenler → `skills.load.extraDirs` şeklindedir; bu yüzden yönetilen geçersiz kılmalar git'e dokunmadan birlikte gelen skills'e karşı yine kazanır. Skill'in genel olarak kurulu olması ama yalnızca bazı ajanlara görünmesi gerekiyorsa, paylaşılan kopyayı `~/.openclaw/skills` içinde tutun ve görünürlüğü `agents.defaults.skills` ile `agents.list[].skills` üzerinden kontrol edin. Yalnızca upstream'e uygun düzenlemeler repo içinde yaşamalı ve PR olarak gönderilmelidir.
  </Accordion>

  <Accordion title="Skills'i özel bir klasörden yükleyebilir miyim?">
    Evet. `~/.openclaw/openclaw.json` içindeki `skills.load.extraDirs` üzerinden ek dizinler ekleyin (en düşük öncelik). Varsayılan öncelik sırası `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → birlikte gelenler → `skills.load.extraDirs` şeklindedir. `clawhub` varsayılan olarak `./skills` içine kurar; OpenClaw bir sonraki oturumda bunu `<workspace>/skills` olarak ele alır. Skill yalnızca belirli ajanlara görünmeliyse bunu `agents.defaults.skills` veya `agents.list[].skills` ile eşleştirin.
  </Accordion>

  <Accordion title="Farklı görevler için farklı modelleri nasıl kullanabilirim?">
    Bugün desteklenen desenler şunlardır:

    - **Cron işleri**: İzole işler, iş başına bir `model` geçersiz kılması ayarlayabilir.
    - **Alt ajanlar**: Görevleri farklı varsayılan modellere sahip ayrı ajanlara yönlendirin.
    - **İsteğe bağlı geçiş**: Geçerli oturum modelini istediğiniz zaman değiştirmek için `/model` kullanın.

    Bkz. [Cron işleri](/tr/automation/cron-jobs), [Çoklu Ajan Yönlendirme](/tr/concepts/multi-agent) ve [Slash komutları](/tr/tools/slash-commands).

  </Accordion>

  <Accordion title="Bot ağır iş yaparken donuyor. Bunu nasıl başka yere aktarırım?">
    Uzun veya paralel görevler için **alt ajanlar** kullanın. Alt ajanlar kendi oturumlarında çalışır,
    bir özet döndürür ve ana sohbetinizi yanıt verebilir tutar.

    Botunuzdan "bu görev için bir alt ajan oluşturmasını" isteyin veya `/subagents` kullanın.
    Gateway'in şu anda ne yaptığını (ve meşgul olup olmadığını) görmek için sohbette `/status` kullanın.

    Token ipucu: uzun görevler ve alt ajanların ikisi de token tüketir. Maliyet kaygısı varsa,
    `agents.defaults.subagents.model` üzerinden alt ajanlar için daha ucuz bir model ayarlayın.

    Dokümanlar: [Alt ajanlar](/tr/tools/subagents), [Arka Plan Görevleri](/tr/automation/tasks).

  </Accordion>

  <Accordion title="Discord'da thread'e bağlı alt ajan oturumları nasıl çalışır?">
    Thread bağlamalarını kullanın. Bir Discord thread'ini bir alt ajana veya oturum hedefine bağlayabilirsiniz; böylece o thread'deki takip mesajları bağlı oturumda kalır.

    Temel akış:

    - `thread: true` kullanarak `sessions_spawn` ile oluşturun (ve kalıcı takip için isteğe bağlı olarak `mode: "session"`).
    - Veya `/focus <target>` ile elle bağlayın.
    - Bağlama durumunu incelemek için `/agents` kullanın.
    - Otomatik odak kaldırmayı kontrol etmek için `/session idle <duration|off>` ve `/session max-age <duration|off>` kullanın.
    - Thread'i ayırmak için `/unfocus` kullanın.

    Gerekli yapılandırma:

    - Genel varsayılanlar: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
    - Discord geçersiz kılmaları: `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours`.
    - Oluşturma sırasında otomatik bağlama: `channels.discord.threadBindings.spawnSessions` varsayılan olarak `true` olur; thread'e bağlı oturum oluşturmayı devre dışı bırakmak için bunu `false` olarak ayarlayın.

    Dokümanlar: [Alt ajanlar](/tr/tools/subagents), [Discord](/tr/channels/discord), [Yapılandırma Referansı](/tr/gateway/configuration-reference), [Slash komutları](/tr/tools/slash-commands).

  </Accordion>

  <Accordion title="Bir alt ajan tamamlandı, ancak tamamlama güncellemesi yanlış yere gitti veya hiç gönderilmedi. Neyi kontrol etmeliyim?">
    Önce çözümlenen istekte bulunan rotasını kontrol edin:

    - Tamamlama modu alt ajan teslimi, varsa herhangi bir bağlı thread veya konuşma rotasını tercih eder.
    - Tamamlama kaynağı yalnızca bir kanal taşıyorsa OpenClaw, doğrudan teslimin yine de başarılı olabilmesi için istekte bulunan oturumun saklanan rotasına (`lastChannel` / `lastTo` / `lastAccountId`) geri döner.
    - Ne bağlı bir rota ne de kullanılabilir saklanan bir rota varsa, doğrudan teslim başarısız olabilir ve sonuç sohbete hemen gönderilmek yerine kuyruğa alınmış oturum teslimine geri düşer.
    - Geçersiz veya eski hedefler yine de kuyruk geri düşüşünü ya da son teslim başarısızlığını zorlayabilir.
    - Çocuğun son görünür asistan yanıtı tam olarak sessiz token `NO_REPLY` / `no_reply` veya tam olarak `ANNOUNCE_SKIP` ise OpenClaw, eski önceki ilerlemeyi göndermek yerine duyuruyu bilerek bastırır.
    - Çocuk yalnızca araç çağrılarından sonra zaman aşımına uğradıysa duyuru, ham araç çıktısını yeniden oynatmak yerine bunu kısa bir kısmi ilerleme özetine indirebilir.

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
    - Gateway'in 7/24 çalıştığını kontrol edin (uyku/yeniden başlatma yok).
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

    - `--no-deliver` / `delivery.mode: "none"` runner geri dönüş gönderimi beklenmediği anlamına gelir.
    - Eksik veya geçersiz duyuru hedefi (`channel` / `to`), runner'ın giden teslimatı atladığı anlamına gelir.
    - Kanal kimlik doğrulama hataları (`unauthorized`, `Forbidden`), runner'ın teslim etmeyi denediği ancak kimlik bilgilerinin bunu engellediği anlamına gelir.
    - Sessiz bir izole sonuç (yalnızca `NO_REPLY` / `no_reply`) bilinçli olarak teslim edilemez kabul edilir; bu nedenle runner sıraya alınmış geri dönüş teslimatını da bastırır.

    İzole cron işleri için, bir sohbet rotası kullanılabilir olduğunda agent yine de `message`
    tool ile doğrudan gönderebilir. `--announce`, yalnızca agent'ın halihazırda göndermediği
    son metin için runner geri dönüş yolunu kontrol eder.

    Hata ayıklama:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Belgeler: [Cron işleri](/tr/automation/cron-jobs), [Arka Plan Görevleri](/tr/automation/tasks).

  </Accordion>

  <Accordion title="İzole bir cron çalıştırması neden model değiştirdi veya bir kez yeniden denedi?">
    Bu genellikle yinelenen zamanlama değil, canlı model değiştirme yoludur.

    İzole cron, etkin çalıştırma `LiveSessionModelSwitchError` fırlattığında bir runtime
    model devrini kalıcı hale getirebilir ve yeniden deneyebilir. Yeniden deneme,
    değiştirilen sağlayıcıyı/modeli korur ve değişim yeni bir auth profile override
    taşıyorsa cron bunu da yeniden denemeden önce kalıcı hale getirir.

    İlgili seçim kuralları:

    - Uygulanabilirse önce Gmail hook model override kazanır.
    - Ardından iş başına `model`.
    - Ardından depolanmış cron-session model override.
    - Ardından normal agent/varsayılan model seçimi.

    Yeniden deneme döngüsü sınırlıdır. İlk deneme artı 2 switch yeniden denemesinden sonra,
    cron sonsuza dek döngüye girmek yerine iptal eder.

    Hata ayıklama:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Belgeler: [Cron işleri](/tr/automation/cron-jobs), [cron CLI](/tr/cli/cron).

  </Accordion>

  <Accordion title="Linux'ta Skills nasıl kurarım?">
    Yerel `openclaw skills` komutlarını kullanın veya Skills'i workspace'inize bırakın. macOS Skills UI Linux'ta kullanılamaz.
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

    Yerel `openclaw skills install`, etkin workspace `skills/`
    dizinine yazar. Ayrı `clawhub` CLI'yi yalnızca kendi Skills'inizi yayımlamak veya
    eşitlemek istiyorsanız kurun. Agent'lar arasında paylaşılan kurulumlar için skill'i
    `~/.openclaw/skills` altına koyun ve hangi agent'ların görebileceğini daraltmak
    istiyorsanız `agents.defaults.skills` veya `agents.list[].skills` kullanın.

  </Accordion>

  <Accordion title="OpenClaw görevleri bir zamanlamaya göre veya arka planda sürekli çalıştırabilir mi?">
    Evet. Gateway zamanlayıcısını kullanın:

    - Zamanlanmış veya yinelenen görevler için **Cron işleri** (yeniden başlatmalar arasında kalıcıdır).
    - "Ana oturum" dönemsel kontrolleri için **Heartbeat**.
    - Özet gönderen veya sohbetlere teslim eden otonom agent'lar için **İzole işler**.

    Belgeler: [Cron işleri](/tr/automation/cron-jobs), [Otomasyon ve Görevler](/tr/automation),
    [Heartbeat](/tr/gateway/heartbeat).

  </Accordion>

  <Accordion title="Apple macOS'a özel Skills'i Linux'tan çalıştırabilir miyim?">
    Doğrudan değil. macOS Skills, `metadata.openclaw.os` ve gerekli binary'ler tarafından sınırlandırılır ve Skills yalnızca **Gateway host** üzerinde uygun olduklarında sistem prompt'unda görünür. Linux'ta `darwin`'e özel Skills (`apple-notes`, `apple-reminders`, `things-mac` gibi), gating'i override etmediğiniz sürece yüklenmez.

    Desteklenen üç kalıbınız var:

    **Seçenek A - Gateway'i bir Mac'te çalıştırın (en basiti).**
    Gateway'i macOS binary'lerinin bulunduğu yerde çalıştırın, ardından Linux'tan [uzak modda](#gateway-ports-already-running-and-remote-mode) veya Tailscale üzerinden bağlanın. Gateway host macOS olduğu için Skills normal şekilde yüklenir.

    **Seçenek B - bir macOS Node kullanın (SSH yok).**
    Gateway'i Linux'ta çalıştırın, bir macOS Node'u (menubar app) eşleştirin ve Mac'te **Node Run Commands** ayarını "Always Ask" veya "Always Allow" yapın. Gerekli binary'ler Node üzerinde varsa OpenClaw, macOS'a özel Skills'i uygun kabul edebilir. Agent bu Skills'i `nodes` tool aracılığıyla çalıştırır. "Always Ask" seçerseniz, prompt'ta "Always Allow" onayı bu komutu allowlist'e ekler.

    **Seçenek C - macOS binary'lerini SSH üzerinden proxy'leyin (ileri düzey).**
    Gateway'i Linux'ta tutun, ancak gerekli CLI binary'lerinin Mac'te çalışan SSH wrapper'larına çözümlenmesini sağlayın. Ardından Linux'a izin vermek için skill'i override edin; böylece uygun kalır.

    1. Binary için bir SSH wrapper oluşturun (örnek: Apple Notes için `memo`):

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. Wrapper'ı Linux host üzerinde `PATH`'e koyun (örneğin `~/bin/memo`).
    3. Linux'a izin vermek için skill metadata'sını (workspace veya `~/.openclaw/skills`) override edin:

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

    - **Özel skill / Plugin:** güvenilir API erişimi için en iyisi (Notion/HeyGen'in ikisinin de API'leri vardır).
    - **Tarayıcı otomasyonu:** kod olmadan çalışır, ancak daha yavaştır ve daha kırılgandır.

    Bağlamı istemci başına tutmak istiyorsanız (ajans iş akışları), basit bir kalıp şudur:

    - Her istemci için bir Notion sayfası (bağlam + tercihler + etkin çalışma).
    - Agent'tan bir oturumun başında o sayfayı getirmesini isteyin.

    Yerel bir entegrasyon istiyorsanız, bir özellik isteği açın veya bu API'leri
    hedefleyen bir skill oluşturun.

    Skills'i kurun:

    ```bash
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    Yerel kurulumlar etkin workspace `skills/` dizinine iner. Agent'lar arasında paylaşılan Skills için bunları `~/.openclaw/skills/<name>/SKILL.md` içine yerleştirin. Paylaşılan bir kurulumu yalnızca bazı agent'ların görmesi gerekiyorsa `agents.defaults.skills` veya `agents.list[].skills` yapılandırın. Bazı Skills, Homebrew üzerinden kurulmuş binary'ler bekler; Linux'ta bu Linuxbrew anlamına gelir (yukarıdaki Homebrew Linux SSS girdisine bakın). Bkz. [Skills](/tr/tools/skills), [Skills yapılandırması](/tr/tools/skills-config) ve [ClawHub](/tr/tools/clawhub).

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

    Bu yol, yerel host tarayıcısını veya bağlı bir tarayıcı Node'unu kullanabilir. Gateway başka bir yerde çalışıyorsa, tarayıcı makinesinde bir Node host çalıştırın veya bunun yerine uzak CDP kullanın.

    `existing-session` / `user` için geçerli sınırlar:

    - eylemler CSS-selector odaklı değil, ref odaklıdır
    - upload işlemleri `ref` / `inputRef` gerektirir ve şu anda tek seferde bir dosyayı destekler
    - `responsebody`, PDF dışa aktarma, indirme yakalama ve toplu eylemler için hâlâ yönetilen tarayıcı veya ham CDP profili gerekir

  </Accordion>
</AccordionGroup>

## Sandboxlama ve bellek

<AccordionGroup>
  <Accordion title="Sandboxlama için ayrılmış bir belge var mı?">
    Evet. Bkz. [Sandboxlama](/tr/gateway/sandboxing). Docker'a özel kurulum için (Docker içinde tam gateway veya sandbox image'ları), bkz. [Docker](/tr/install/docker).
  </Accordion>

  <Accordion title="Docker sınırlı geliyor - tam özellikleri nasıl etkinleştiririm?">
    Varsayılan image güvenlik önceliklidir ve `node` kullanıcısı olarak çalışır; bu nedenle
    sistem paketleri, Homebrew veya paketlenmiş tarayıcılar içermez. Daha kapsamlı bir kurulum için:

    - Önbelleklerin kalıcı olması için `/home/node` dizinini `OPENCLAW_HOME_VOLUME` ile kalıcı hale getirin.
    - Sistem bağımlılıklarını `OPENCLAW_DOCKER_APT_PACKAGES` ile image'a ekleyin.
    - Playwright tarayıcılarını paketlenmiş CLI üzerinden kurun:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - `PLAYWRIGHT_BROWSERS_PATH` ayarlayın ve yolun kalıcı olduğundan emin olun.

    Belgeler: [Docker](/tr/install/docker), [Tarayıcı](/tr/tools/browser).

  </Accordion>

  <Accordion title="DM'leri kişisel tutup grupları tek agent ile herkese açık/sandbox içinde yapabilir miyim?">
    Evet - özel trafiğiniz **DM'ler** ve herkese açık trafiğiniz **gruplar** ise.

    Grup/kanal oturumlarının (main olmayan anahtarlar) yapılandırılan sandbox backend'inde çalışması, ana DM oturumunun ise host üzerinde kalması için `agents.defaults.sandbox.mode: "non-main"` kullanın. Birini seçmezseniz varsayılan backend Docker'dır. Ardından sandbox içindeki oturumlarda hangi tool'ların kullanılabileceğini `tools.sandbox.tools` ile kısıtlayın.

    Kurulum adımları + örnek yapılandırma: [Gruplar: kişisel DM'ler + herkese açık gruplar](/tr/channels/groups#pattern-personal-dms-public-groups-single-agent)

    Temel yapılandırma referansı: [Gateway yapılandırması](/tr/gateway/config-agents#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="Bir host klasörünü sandbox'a nasıl bağlarım?">
    `agents.defaults.sandbox.docker.binds` değerini `["host:path:mode"]` olarak ayarlayın (ör. `"/home/user/src:/src:ro"`). Global ve agent başına bind'ler birleştirilir; `scope: "shared"` olduğunda agent başına bind'ler yok sayılır. Hassas her şey için `:ro` kullanın ve bind'lerin sandbox dosya sistemi duvarlarını aştığını unutmayın.

    OpenClaw bind kaynaklarını hem normalize edilmiş yola hem de mevcut en derin üst dizin üzerinden çözümlenen canonical yola göre doğrular. Bu, son yol segmenti henüz mevcut olmadığında bile symlink-parent kaçışlarının kapalı şekilde başarısız olduğu ve symlink çözümlemesinden sonra allowed-root kontrollerinin hâlâ uygulandığı anlamına gelir.

    Örnekler ve güvenlik notları için bkz. [Sandboxlama](/tr/gateway/sandboxing#custom-bind-mounts) ve [Sandbox vs Tool Policy vs Elevated](/tr/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check).

  </Accordion>

  <Accordion title="Bellek nasıl çalışır?">
    OpenClaw belleği, agent workspace'indeki Markdown dosyalarından ibarettir:

    - `memory/YYYY-MM-DD.md` içinde günlük notlar
    - `MEMORY.md` içinde düzenlenmiş uzun vadeli notlar (yalnızca ana/özel oturumlar)

    OpenClaw ayrıca modeli auto-compaction öncesinde kalıcı notlar yazmaya
    hatırlatmak için **sessiz pre-compaction bellek flush** çalıştırır. Bu yalnızca workspace
    yazılabilir olduğunda çalışır (salt okunur sandbox'lar bunu atlar). Bkz. [Bellek](/tr/concepts/memory).

  </Accordion>

  <Accordion title="Bellek bir şeyleri unutmaya devam ediyor. Kalıcı olmasını nasıl sağlarım?">
    Bot'tan **olguyu belleğe yazmasını** isteyin. Uzun vadeli notlar `MEMORY.md` içine,
    kısa vadeli bağlam `memory/YYYY-MM-DD.md` içine gider.

    Bu hâlâ geliştirdiğimiz bir alan. Modele anıları saklamasını hatırlatmak yardımcı olur;
    ne yapacağını bilir. Unutmaya devam ederse Gateway'in her çalıştırmada aynı
    workspace'i kullandığını doğrulayın.

    Belgeler: [Bellek](/tr/concepts/memory), [Agent workspace](/tr/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Bellek sonsuza kadar kalıcı mı? Sınırları nelerdir?">
    Bellek dosyaları diskte yaşar ve siz silene kadar kalıcıdır. Sınır model değil,
    depolama alanınızdır. **Oturum bağlamı** hâlâ modelin context window'u ile sınırlıdır;
    bu nedenle uzun konuşmalar compact edilebilir veya truncate edilebilir. Bellek aramanın var olma nedeni budur - yalnızca ilgili kısımları bağlama geri çeker.

    Belgeler: [Bellek](/tr/concepts/memory), [Bağlam](/tr/concepts/context).

  </Accordion>

  <Accordion title="Semantik bellek araması bir OpenAI API anahtarı gerektirir mi?">
    Yalnızca **OpenAI embeddings** kullanıyorsanız. Codex OAuth sohbet/tamamlama işlemlerini kapsar ve
    embeddings erişimi **vermez**, bu yüzden **Codex ile oturum açmak (OAuth veya
    Codex CLI login)** semantik bellek araması için yardımcı olmaz. OpenAI embeddings
    yine de gerçek bir API anahtarı gerektirir (`OPENAI_API_KEY` veya `models.providers.openai.apiKey`).

    Açıkça bir sağlayıcı ayarlamazsanız, OpenClaw bir API anahtarını çözümleyebildiğinde
    otomatik olarak bir sağlayıcı seçer (auth profilleri, `models.providers.*.apiKey` veya ortam değişkenleri).
    Bir OpenAI anahtarı çözümlenirse OpenAI'yi tercih eder; aksi takdirde bir Gemini anahtarı
    çözümlenirse Gemini'yi, ardından Voyage'ı, ardından Mistral'i tercih eder. Uzak anahtar yoksa bellek
    araması siz yapılandırana kadar devre dışı kalır. Yerel bir model yolu
    yapılandırılmış ve mevcutsa, OpenClaw
    `local` tercih eder. Ollama, açıkça
    `memorySearch.provider = "ollama"` ayarladığınızda desteklenir.

    Yerel kalmayı tercih ediyorsanız, `memorySearch.provider = "local"` ayarlayın (ve isteğe bağlı olarak
    `memorySearch.fallback = "none"`). Gemini embeddings istiyorsanız,
    `memorySearch.provider = "gemini"` ayarlayın ve `GEMINI_API_KEY` (veya
    `memorySearch.remote.apiKey`) sağlayın. **OpenAI, Gemini, Voyage, Mistral, Ollama veya yerel** embedding
    modellerini destekliyoruz - kurulum ayrıntıları için [Bellek](/tr/concepts/memory) sayfasına bakın.

  </Accordion>
</AccordionGroup>

## Nesnelerin diskte bulunduğu yer

<AccordionGroup>
  <Accordion title="OpenClaw ile kullanılan tüm veriler yerel olarak mı kaydedilir?">
    Hayır - **OpenClaw'ın durumu yereldir**, ancak **harici hizmetler yine de onlara gönderdiklerinizi görür**.

    - **Varsayılan olarak yerel:** oturumlar, bellek dosyaları, yapılandırma ve çalışma alanı Gateway ana makinesinde bulunur
      (`~/.openclaw` + çalışma alanı dizininiz).
    - **Zorunlu olarak uzak:** model sağlayıcılarına (Anthropic/OpenAI/vb.) gönderdiğiniz iletiler onların
      API'lerine gider ve sohbet platformları (WhatsApp/Telegram/Slack/vb.) ileti verilerini kendi
      sunucularında depolar.
    - **Kapsamı siz kontrol edersiniz:** yerel modeller kullanmak istemleri makinenizde tutar, ancak kanal
      trafiği yine de kanalın sunucularından geçer.

    İlgili: [Ajan çalışma alanı](/tr/concepts/agent-workspace), [Bellek](/tr/concepts/memory).

  </Accordion>

  <Accordion title="OpenClaw verilerini nerede depolar?">
    Her şey `$OPENCLAW_STATE_DIR` altında bulunur (varsayılan: `~/.openclaw`):

    | Yol                                                             | Amaç                                                               |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | Ana yapılandırma (JSON5)                                           |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | Eski OAuth içe aktarımı (ilk kullanımda auth profillerine kopyalanır) |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | Auth profilleri (OAuth, API anahtarları ve isteğe bağlı `keyRef`/`tokenRef`) |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | `file` SecretRef sağlayıcıları için isteğe bağlı dosya destekli gizli yük |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | Eski uyumluluk dosyası (statik `api_key` girdileri temizlenmiş)     |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | Sağlayıcı durumu (örn. `whatsapp/<accountId>/creds.json`)          |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | Ajan başına durum (agentDir + oturumlar)                           |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | Konuşma geçmişi ve durumu (ajan başına)                            |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | Oturum meta verileri (ajan başına)                                 |

    Eski tek ajan yolu: `~/.openclaw/agent/*` (`openclaw doctor` tarafından taşınır).

    **Çalışma alanınız** (AGENTS.md, bellek dosyaları, skills vb.) ayrıdır ve `agents.defaults.workspace` üzerinden yapılandırılır (varsayılan: `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title="AGENTS.md / SOUL.md / USER.md / MEMORY.md nerede bulunmalı?">
    Bu dosyalar `~/.openclaw` içinde değil, **ajan çalışma alanı** içinde bulunur.

    - **Çalışma alanı (ajan başına)**: `AGENTS.md`, `SOUL.md`, `IDENTITY.md`, `USER.md`,
      `MEMORY.md`, `memory/YYYY-MM-DD.md`, isteğe bağlı `HEARTBEAT.md`.
      Küçük harfli kök `memory.md` yalnızca eski onarım girdisidir; `openclaw doctor --fix`
      iki dosya da varsa bunu `MEMORY.md` içine birleştirebilir.
    - **Durum dizini (`~/.openclaw`)**: yapılandırma, kanal/sağlayıcı durumu, auth profilleri, oturumlar, günlükler
      ve paylaşılan Skills (`~/.openclaw/skills`).

    Varsayılan çalışma alanı `~/.openclaw/workspace` şeklindedir ve şu şekilde yapılandırılabilir:

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    Bot yeniden başlatmadan sonra "unutuyorsa", Gateway'in her başlatmada aynı
    çalışma alanını kullandığını doğrulayın (ve unutmayın: uzak mod, yerel dizüstü bilgisayarınızın değil **gateway ana makinesinin**
    çalışma alanını kullanır).

    İpucu: kalıcı bir davranış veya tercih istiyorsanız, sohbet geçmişine güvenmek yerine bottan bunu
    **AGENTS.md veya MEMORY.md içine yazmasını** isteyin.

    [Ajan çalışma alanı](/tr/concepts/agent-workspace) ve [Bellek](/tr/concepts/memory) sayfalarına bakın.

  </Accordion>

  <Accordion title="Önerilen yedekleme stratejisi">
    **Ajan çalışma alanınızı** **özel** bir git deposuna koyun ve özel bir yerde
    yedekleyin (örneğin GitHub private). Bu, bellek + AGENTS/SOUL/USER
    dosyalarını yakalar ve asistanın "zihnini" daha sonra geri yüklemenizi sağlar.

    `~/.openclaw` altındaki hiçbir şeyi commit etmeyin (kimlik bilgileri, oturumlar, token'lar veya şifrelenmiş gizli yükler).
    Tam geri yükleme gerekiyorsa, hem çalışma alanını hem de durum dizinini
    ayrı ayrı yedekleyin (yukarıdaki taşıma sorusuna bakın).

    Dokümanlar: [Ajan çalışma alanı](/tr/concepts/agent-workspace).

  </Accordion>

  <Accordion title="OpenClaw'ı tamamen nasıl kaldırırım?">
    Özel kılavuza bakın: [Kaldırma](/tr/install/uninstall).
  </Accordion>

  <Accordion title="Ajanlar çalışma alanının dışında çalışabilir mi?">
    Evet. Çalışma alanı **varsayılan cwd** ve bellek dayanağıdır, katı bir sandbox değildir.
    Göreli yollar çalışma alanı içinde çözümlenir, ancak sandboxing etkin değilse mutlak yollar başka
    ana makine konumlarına erişebilir. Yalıtım gerekiyorsa,
    [`agents.defaults.sandbox`](/tr/gateway/sandboxing) veya ajan başına sandbox ayarlarını kullanın. Bir
    deponun varsayılan çalışma dizini olmasını istiyorsanız, o ajanın
    `workspace` değerini depo köküne yönlendirin. OpenClaw deposu yalnızca kaynak koddur; ajanın özellikle onun içinde çalışmasını
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
    Oturum durumunun sahibi **gateway ana makinesidir**. Uzak moddaysanız, önem verdiğiniz oturum deposu yerel dizüstü bilgisayarınızda değil, uzak makinededir. [Oturum yönetimi](/tr/concepts/session) sayfasına bakın.
  </Accordion>
</AccordionGroup>

## Yapılandırma temelleri

<AccordionGroup>
  <Accordion title="Yapılandırma hangi biçimdedir? Nerede bulunur?">
    OpenClaw, `$OPENCLAW_CONFIG_PATH` konumundan isteğe bağlı bir **JSON5** yapılandırması okur (varsayılan: `~/.openclaw/openclaw.json`):

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    Dosya yoksa, güvenli sayılabilecek varsayılanları kullanır (`~/.openclaw/workspace` şeklinde varsayılan çalışma alanı dahil).

  </Accordion>

  <Accordion title='gateway.bind: "lan" (veya "tailnet") ayarladım ve artık hiçbir şey dinlemiyor / UI yetkisiz diyor'>
    local loopback dışı bağlamalar **geçerli bir gateway auth yolu gerektirir**. Pratikte bu şu anlama gelir:

    - paylaşılan gizli anahtarlı auth: token veya parola
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

    - `gateway.remote.token` / `.password` yerel gateway auth'u tek başına etkinleştirmez.
    - Yerel çağrı yolları, yalnızca `gateway.auth.*` ayarlanmamışsa geri dönüş olarak `gateway.remote.*` kullanabilir.
    - Parola auth'u için bunun yerine `gateway.auth.mode: "password"` ve `gateway.auth.password` (veya `OPENCLAW_GATEWAY_PASSWORD`) ayarlayın.
    - `gateway.auth.token` / `gateway.auth.password` açıkça SecretRef üzerinden yapılandırılmış ve çözümlenememişse, çözümleme kapalı şekilde başarısız olur (uzak geri dönüşle maskeleme olmaz).
    - Paylaşılan gizli anahtarlı Control UI kurulumları `connect.params.auth.token` veya `connect.params.auth.password` (uygulama/UI ayarlarında saklanır) üzerinden kimlik doğrular. Tailscale Serve veya `trusted-proxy` gibi kimlik taşıyan modlar bunun yerine istek üst bilgilerini kullanır. Paylaşılan gizli anahtarları URL'lere koymaktan kaçının.
    - `gateway.auth.mode: "trusted-proxy"` ile aynı ana makinedeki loopback reverse proxy'leri açıkça `gateway.auth.trustedProxy.allowLoopback = true` ve `gateway.trustedProxies` içinde bir loopback girdisi gerektirir.

  </Accordion>

  <Accordion title="Artık localhost üzerinde neden bir token gerekiyor?">
    OpenClaw, loopback dahil olmak üzere varsayılan olarak gateway auth uygular. Normal varsayılan yolda bu token auth anlamına gelir: açıkça bir auth yolu yapılandırılmamışsa, gateway başlatma token moduna çözümlenir ve otomatik olarak bir token üretip `gateway.auth.token` içine kaydeder; bu yüzden **yerel WS istemcileri kimlik doğrulamalıdır**. Bu, diğer yerel işlemlerin Gateway'i çağırmasını engeller.

    Farklı bir auth yolu tercih ediyorsanız, parola modunu açıkça seçebilirsiniz (veya kimlik duyarlı reverse proxy'ler için `trusted-proxy`). **Gerçekten** açık loopback istiyorsanız, yapılandırmanızda açıkça `gateway.auth.mode: "none"` ayarlayın. Doctor sizin için her zaman token üretebilir: `openclaw doctor --generate-gateway-token`.

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

    - `off`: slogan metnini gizler ancak afiş başlığı/sürüm satırını korur.
    - `default`: her seferinde `All your chats, one OpenClaw.` kullanır.
    - `random`: dönen komik/mevsimsel sloganlar (varsayılan davranış).
    - Hiç afiş istemiyorsanız, `OPENCLAW_HIDE_BANNER=1` ortam değişkenini ayarlayın.

  </Accordion>

  <Accordion title="Web aramasını (ve web getirmeyi) nasıl etkinleştiririm?">
    `web_fetch` bir API anahtarı olmadan çalışır. `web_search` seçtiğiniz
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

    Sağlayıcıya özgü web arama yapılandırması artık `plugins.entries.<plugin>.config.webSearch.*` altında bulunur.
    Eski `tools.web.search.*` sağlayıcı yolları uyumluluk için geçici olarak hâlâ yüklenir, ancak yeni yapılandırmalarda kullanılmamalıdır.
    Firecrawl web getirme yedek yapılandırması `plugins.entries.firecrawl.config.webFetch.*` altında bulunur.

    Notlar:

    - İzin listeleri kullanıyorsanız `web_search`/`web_fetch`/`x_search` veya `group:web` ekleyin.
    - `web_fetch` varsayılan olarak etkindir (açıkça devre dışı bırakılmadığı sürece).
    - `tools.web.fetch.provider` atlanırsa OpenClaw, kullanılabilir kimlik bilgilerinden hazır olan ilk getirme yedek sağlayıcısını otomatik algılar. Bugün paketle gelen sağlayıcı Firecrawl'dır.
    - Daemon'lar ortam değişkenlerini `~/.openclaw/.env` dosyasından (veya hizmet ortamından) okur.

    Belgeler: [Web araçları](/tr/tools/web).

  </Accordion>

  <Accordion title="config.apply yapılandırmamı sildi. Nasıl kurtarır ve bunu nasıl önlerim?">
    `config.apply` **tüm yapılandırmayı** değiştirir. Kısmi bir nesne gönderirseniz diğer
    her şey kaldırılır.

    Geçerli OpenClaw birçok kazara ezmeyi önler:

    - OpenClaw'a ait yapılandırma yazımları, yazmadan önce değişiklik sonrası tam yapılandırmayı doğrular.
    - Geçersiz veya yıkıcı OpenClaw'a ait yazımlar reddedilir ve `openclaw.json.rejected.*` olarak kaydedilir.
    - Doğrudan bir düzenleme başlatmayı veya sıcak yeniden yüklemeyi bozarsa Gateway bilinen son iyi yapılandırmayı geri yükler ve reddedilen dosyayı `openclaw.json.clobbered.*` olarak kaydeder.
    - Ana agent kurtarmadan sonra bir önyükleme uyarısı alır, böylece bozuk yapılandırmayı körlemesine yeniden yazmaz.

    Kurtarma:

    - `Config auto-restored from last-known-good`, `Config write rejected:` veya `config reload restored last-known-good config` için `openclaw logs --follow` çıktısını kontrol edin.
    - Etkin yapılandırmanın yanındaki en yeni `openclaw.json.clobbered.*` veya `openclaw.json.rejected.*` dosyasını inceleyin.
    - Çalışıyorsa etkin geri yüklenmiş yapılandırmayı koruyun, ardından yalnızca amaçlanan anahtarları `openclaw config set` veya `config.patch` ile geri kopyalayın.
    - `openclaw config validate` ve `openclaw doctor` çalıştırın.
    - Bilinen son iyi yapılandırmanız veya reddedilen yükünüz yoksa yedekten geri yükleyin ya da `openclaw doctor` komutunu yeniden çalıştırıp kanalları/modelleri yeniden yapılandırın.
    - Bu beklenmedik bir durumsa bir hata bildirin ve bilinen son yapılandırmanızı veya herhangi bir yedeği ekleyin.
    - Yerel bir kodlama agent'ı genellikle günlüklerden veya geçmişten çalışan bir yapılandırmayı yeniden oluşturabilir.

    Önleme:

    - Küçük değişiklikler için `openclaw config set` kullanın.
    - Etkileşimli düzenlemeler için `openclaw configure` kullanın.
    - Kesin bir yol veya alan şekli konusunda emin değilseniz önce `config.schema.lookup` kullanın; bu, yüzeysel bir şema düğümü ve ayrıntıya inmek için doğrudan alt özetler döndürür.
    - Kısmi RPC düzenlemeleri için `config.patch` kullanın; `config.apply` komutunu yalnızca tam yapılandırma değişimi için saklayın.
    - Bir agent çalıştırmasından yalnızca sahip kullanımına açık `gateway` aracını kullanıyorsanız, `tools.exec.ask` / `tools.exec.security` yazımlarını yine de reddeder (aynı korumalı exec yollarına normalize olan eski `tools.bash.*` takma adları dahil).

    Belgeler: [Yapılandırma](/tr/cli/config), [Yapılandır](/tr/cli/configure), [Gateway sorun giderme](/tr/gateway/troubleshooting#gateway-restored-last-known-good-config), [Doctor](/tr/gateway/doctor).

  </Accordion>

  <Accordion title="Cihazlar arasında özelleşmiş worker'larla merkezi bir Gateway'i nasıl çalıştırırım?">
    Yaygın desen **bir Gateway** (ör. Raspberry Pi) artı **node'lar** ve **agent'lar** şeklindedir:

    - **Gateway (merkezi):** kanalların (Signal/WhatsApp), yönlendirmenin ve oturumların sahibidir.
    - **Node'lar (cihazlar):** Mac/iOS/Android çevre birimleri olarak bağlanır ve yerel araçları (`system.run`, `canvas`, `camera`) sunar.
    - **Agent'lar (worker'lar):** özel roller için ayrı beyinler/çalışma alanlarıdır (ör. "Hetzner operasyonları", "Kişisel veriler").
    - **Alt agent'lar:** paralellik istediğinizde ana agent'tan arka plan işi başlatır.
    - **TUI:** Gateway'e bağlanır ve agent'lar/oturumlar arasında geçiş yapar.

    Belgeler: [Node'lar](/tr/nodes), [Uzaktan erişim](/tr/gateway/remote), [Çoklu Agent Yönlendirme](/tr/concepts/multi-agent), [Alt agent'lar](/tr/tools/subagents), [TUI](/tr/web/tui).

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

    Varsayılan değer `false` (pencereli) şeklindedir. Headless, bazı sitelerde bot karşıtı kontrolleri tetiklemeye daha yatkındır. Bkz. [Tarayıcı](/tr/tools/browser).

    Headless **aynı Chromium motorunu** kullanır ve çoğu otomasyon için çalışır (formlar, tıklamalar, veri kazıma, oturum açmalar). Temel farklar:

    - Görünür tarayıcı penceresi yoktur (görsel gerekiyorsa ekran görüntüleri kullanın).
    - Bazı siteler headless modda otomasyon konusunda daha katıdır (CAPTCHA'lar, bot karşıtı kontroller).
      Örneğin X/Twitter, headless oturumları sıkça engeller.

  </Accordion>

  <Accordion title="Tarayıcı kontrolü için Brave'i nasıl kullanırım?">
    `browser.executablePath` değerini Brave ikili dosyanıza (veya Chromium tabanlı herhangi bir tarayıcıya) ayarlayın ve Gateway'i yeniden başlatın.
    Tam yapılandırma örnekleri için [Tarayıcı](/tr/tools/browser#use-brave-or-another-chromium-based-browser) bölümüne bakın.
  </Accordion>
</AccordionGroup>

## Uzak Gateway'ler ve node'lar

<AccordionGroup>
  <Accordion title="Komutlar Telegram, gateway ve node'lar arasında nasıl yayılır?">
    Telegram mesajları **gateway** tarafından işlenir. Gateway agent'ı çalıştırır ve
    yalnızca bir node aracı gerektiğinde **Gateway WebSocket** üzerinden node'ları çağırır:

    Telegram → Gateway → Agent → `node.*` → Node → Gateway → Telegram

    Node'lar gelen sağlayıcı trafiğini görmez; yalnızca node RPC çağrılarını alır.

  </Accordion>

  <Accordion title="Gateway uzakta barındırılıyorsa agent bilgisayarıma nasıl erişebilir?">
    Kısa yanıt: **bilgisayarınızı node olarak eşleştirin**. Gateway başka bir yerde çalışır, ancak
    Gateway WebSocket üzerinden yerel makinenizde `node.*` araçlarını (ekran, kamera, sistem) çağırabilir.

    Tipik kurulum:

    1. Gateway'i her zaman açık ana makinede (VPS/ev sunucusu) çalıştırın.
    2. Gateway ana makinesini ve bilgisayarınızı aynı tailnet'e koyun.
    3. Gateway WS'nin erişilebilir olduğundan emin olun (tailnet bind veya SSH tüneli).
    4. macOS uygulamasını yerel olarak açın ve node olarak kaydolabilmesi için **SSH Üzerinden Uzak** modda (veya doğrudan tailnet ile)
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
    Temel kontrolleri yapın:

    - Gateway çalışıyor mu: `openclaw gateway status`
    - Gateway sağlığı: `openclaw status`
    - Kanal sağlığı: `openclaw channels status`

    Ardından kimlik doğrulama ve yönlendirmeyi doğrulayın:

    - Tailscale Serve kullanıyorsanız `gateway.auth.allowTailscale` değerinin doğru ayarlandığından emin olun.
    - SSH tüneliyle bağlanıyorsanız yerel tünelin çalıştığını ve doğru bağlantı noktasını hedeflediğini doğrulayın.
    - İzin listelerinizin (DM veya grup) hesabınızı içerdiğini doğrulayın.

    Belgeler: [Tailscale](/tr/gateway/tailscale), [Uzaktan erişim](/tr/gateway/remote), [Kanallar](/tr/channels).

  </Accordion>

  <Accordion title="İki OpenClaw örneği birbiriyle konuşabilir mi (yerel + VPS)?">
    Evet. Yerleşik bir "bot'tan bot'a" köprü yoktur, ancak bunu birkaç
    güvenilir şekilde bağlayabilirsiniz:

    **En basit:** her iki botun da erişebildiği normal bir sohbet kanalı kullanın (Telegram/Slack/WhatsApp).
    Bot A'nın Bot B'ye bir mesaj göndermesini sağlayın, ardından Bot B'nin her zamanki gibi yanıtlamasına izin verin.

    **CLI köprüsü (genel):** diğer botun
    dinlediği bir sohbeti hedefleyerek diğer Gateway'i `openclaw agent --message ... --deliver` ile çağıran bir betik çalıştırın. Botlardan biri uzak bir VPS üzerindeyse CLI'nizi
    SSH/Tailscale üzerinden o uzak Gateway'e yöneltin (bkz. [Uzaktan erişim](/tr/gateway/remote)).

    Örnek desen (hedef Gateway'e erişebilen bir makineden çalıştırın):

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    İpucu: İki botun sonsuz döngüye girmemesi için bir güvenlik sınırı ekleyin (yalnızca bahsetme, kanal
    izin listeleri veya "bot mesajlarına yanıt verme" kuralı).

    Belgeler: [Uzaktan erişim](/tr/gateway/remote), [Agent CLI](/tr/cli/agent), [Agent gönderimi](/tr/tools/agent-send).

  </Accordion>

  <Accordion title="Birden fazla agent için ayrı VPS'lere ihtiyacım var mı?">
    Hayır. Bir Gateway, her biri kendi çalışma alanına, model varsayılanlarına
    ve yönlendirmesine sahip birden fazla agent barındırabilir. Normal kurulum budur ve
    agent başına bir VPS çalıştırmaktan çok daha ucuz ve basittir.

    Ayrı VPS'leri yalnızca güçlü izolasyona (güvenlik sınırları) veya paylaşmak istemediğiniz çok
    farklı yapılandırmalara ihtiyaç duyduğunuzda kullanın. Aksi halde tek Gateway kullanın ve
    birden fazla agent veya alt agent kullanın.

  </Accordion>

  <Accordion title="VPS'den SSH kullanmak yerine kişisel dizüstü bilgisayarımda node kullanmanın bir faydası var mı?">
    Evet - node'lar uzak bir Gateway'den dizüstü bilgisayarınıza ulaşmanın birinci sınıf yoludur ve
    kabuk erişiminden fazlasını açar. Gateway macOS/Linux üzerinde (Windows'ta WSL2 ile) çalışır ve
    hafiftir (küçük bir VPS veya Raspberry Pi sınıfı kutu yeterlidir; 4 GB RAM fazlasıyla yeterlidir), bu yüzden yaygın
    kurulum her zaman açık bir ana makine ve node olarak dizüstü bilgisayarınızdır.

    - **Gelen SSH gerekmez.** Node'lar Gateway WebSocket'e dışarı doğru bağlanır ve cihaz eşleştirmesi kullanır.
    - **Daha güvenli yürütme kontrolleri.** `system.run`, o dizüstü bilgisayardaki node izin listeleri/onaylarıyla denetlenir.
    - **Daha fazla cihaz aracı.** Node'lar `system.run` ek olarak `canvas`, `camera` ve `screen` sunar.
    - **Yerel tarayıcı otomasyonu.** Gateway'i bir VPS üzerinde tutun, ancak Chrome'u dizüstü bilgisayardaki bir node ana makinesi üzerinden yerel olarak çalıştırın veya Chrome MCP aracılığıyla ana makinedeki yerel Chrome'a bağlanın.

    SSH geçici kabuk erişimi için uygundur, ancak node'lar sürekli agent iş akışları ve
    cihaz otomasyonu için daha basittir.

    Belgeler: [Node'lar](/tr/nodes), [Node CLI](/tr/cli/nodes), [Tarayıcı](/tr/tools/browser).

  </Accordion>

  <Accordion title="Node'lar bir gateway hizmeti çalıştırır mı?">
    Hayır. Bilerek izole profiller çalıştırmadığınız sürece ana makine başına yalnızca **bir gateway** çalışmalıdır (bkz. [Birden fazla gateway](/tr/gateway/multiple-gateways)). Node'lar gateway'e bağlanan çevre birimleridir
    (iOS/Android node'ları veya menü çubuğu uygulamasında macOS "node modu"). Headless node
    ana makineleri ve CLI kontrolü için bkz. [Node ana makinesi CLI](/tr/cli/node).

    `gateway`, `discovery` ve `canvasHost` değişiklikleri için tam yeniden başlatma gerekir.

  </Accordion>

  <Accordion title="Yapılandırma uygulamak için bir API / RPC yolu var mı?">
    Evet.

    - `config.schema.lookup`: yazmadan önce bir yapılandırma alt ağacını, yüzeysel şema düğümü, eşleşen UI ipucu ve doğrudan alt özetleriyle inceleyin
    - `config.get`: geçerli anlık görüntüyü + karmayı getirir
    - `config.patch`: güvenli kısmi güncelleme (çoğu RPC düzenlemesi için tercih edilir); mümkün olduğunda sıcak yeniden yükler ve gerektiğinde yeniden başlatır
    - `config.apply`: tam yapılandırmayı doğrular + değiştirir; mümkün olduğunda sıcak yeniden yükler ve gerektiğinde yeniden başlatır
    - Yalnızca sahip kullanımına açık `gateway` çalışma zamanı aracı, `tools.exec.ask` / `tools.exec.security` yeniden yazımını yine de reddeder; eski `tools.bash.*` takma adları aynı korumalı exec yollarına normalize olur

  </Accordion>

  <Accordion title="İlk kurulum için makul minimum yapılandırma">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    Bu, çalışma alanınızı ayarlar ve botu kimlerin tetikleyebileceğini sınırlar.

  </Accordion>

  <Accordion title="Bir VPS üzerinde Tailscale'i nasıl kurar ve Mac'imden nasıl bağlanırım?">
    Minimum adımlar:

    1. **VPS üzerinde kurun ve oturum açın**

       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```

    2. **Mac'inizde kurun ve oturum açın**
       - Tailscale uygulamasını kullanın ve aynı tailnet'te oturum açın.
    3. **MagicDNS'i etkinleştirin (önerilir)**
       - Tailscale yönetici konsolunda MagicDNS'i etkinleştirin; böylece VPS kararlı bir ada sahip olur.
    4. **tailnet ana makine adını kullanın**
       - SSH: `ssh user@your-vps.tailnet-xxxx.ts.net`
       - Gateway WS: `ws://your-vps.tailnet-xxxx.ts.net:18789`

    SSH olmadan Denetim UI'sini istiyorsanız VPS üzerinde Tailscale Serve kullanın:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Bu, gateway'i loopback'e bağlı tutar ve Tailscale üzerinden HTTPS sunar. Bkz. [Tailscale](/tr/gateway/tailscale).

  </Accordion>

  <Accordion title="Bir Mac node'unu uzak bir Gateway'e nasıl bağlarım (Tailscale Serve)?">
    Serve, **Gateway Denetim UI'sini + WS'yi** sunar. Node'lar aynı Gateway WS uç noktası üzerinden bağlanır.

    Önerilen kurulum:

    1. **VPS + Mac'in aynı tailnet üzerinde olduğundan emin olun**.
    2. **macOS uygulamasını Uzak modda kullanın** (SSH hedefi tailnet ana makine adı olabilir).
       Uygulama Gateway portunu tüneller ve bir node olarak bağlanır.
    3. **Node'u onaylayın** gateway üzerinde:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Dokümanlar: [Gateway protokolü](/tr/gateway/protocol), [Keşif](/tr/gateway/discovery), [macOS uzak modu](/tr/platforms/mac/remote).

  </Accordion>

  <Accordion title="İkinci bir dizüstü bilgisayara kurmalı mıyım, yoksa sadece bir node mu eklemeliyim?">
    İkinci dizüstü bilgisayarda yalnızca **yerel araçlara** (ekran/kamera/exec) ihtiyacınız varsa onu bir
    **node** olarak ekleyin. Bu, tek bir Gateway tutar ve yinelenen yapılandırmayı önler. Yerel node araçları
    şu anda yalnızca macOS içindir, ancak bunları diğer işletim sistemlerine genişletmeyi planlıyoruz.

    İkinci bir Gateway'i yalnızca **katı yalıtım** veya tamamen ayrı iki bot gerektiğinde kurun.

    Dokümanlar: [Node'lar](/tr/nodes), [Node'lar CLI'si](/tr/cli/nodes), [Birden çok gateway](/tr/gateway/multiple-gateways).

  </Accordion>
</AccordionGroup>

## Ortam değişkenleri ve .env yükleme

<AccordionGroup>
  <Accordion title="OpenClaw ortam değişkenlerini nasıl yükler?">
    OpenClaw ortam değişkenlerini üst süreçten (shell, launchd/systemd, CI vb.) okur ve ayrıca şunları yükler:

    - geçerli çalışma dizininden `.env`
    - `~/.openclaw/.env` içinden genel bir yedek `.env` (diğer adıyla `$OPENCLAW_STATE_DIR/.env`)

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

    Tam öncelik sırası ve kaynaklar için bkz. [/environment](/tr/help/environment).

  </Accordion>

  <Accordion title="Gateway'i servis üzerinden başlattım ve ortam değişkenlerim kayboldu. Şimdi ne yapmalıyım?">
    Yaygın iki çözüm:

    1. Eksik anahtarları `~/.openclaw/.env` içine koyun; böylece servis shell ortamınızı devralmasa bile alınırlar.
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

  <Accordion title='COPILOT_GITHUB_TOKEN ayarladım, ama model durumu "Shell env: off." gösteriyor. Neden?'>
    `openclaw models status`, **shell ortamı içe aktarmanın** etkin olup olmadığını bildirir. "Shell env: off",
    ortam değişkenlerinizin eksik olduğu anlamına **gelmez**; yalnızca OpenClaw'ın
    oturum açma shell'inizi otomatik olarak yüklemeyeceği anlamına gelir.

    Gateway bir servis olarak çalışıyorsa (launchd/systemd), shell
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

    Copilot token'ları `COPILOT_GITHUB_TOKEN` içinden okunur (ayrıca `GH_TOKEN` / `GITHUB_TOKEN`).
    Bkz. [/concepts/model-providers](/tr/concepts/model-providers) ve [/environment](/tr/help/environment).

  </Accordion>
</AccordionGroup>

## Oturumlar ve birden çok sohbet

<AccordionGroup>
  <Accordion title="Yeni bir konuşmayı nasıl başlatırım?">
    Bağımsız bir mesaj olarak `/new` veya `/reset` gönderin. Bkz. [Oturum yönetimi](/tr/concepts/session).
  </Accordion>

  <Accordion title="/new hiç göndermezsem oturumlar otomatik olarak sıfırlanır mı?">
    Oturumlar `session.idleMinutes` sonrasında süresi dolabilir, ancak bu **varsayılan olarak devre dışıdır** (varsayılan **0**).
    Boşta kalma süresi dolmasını etkinleştirmek için pozitif bir değere ayarlayın. Etkinleştirildiğinde, boşta kalma süresinden sonraki **sonraki**
    mesaj, ilgili sohbet anahtarı için yeni bir oturum kimliği başlatır.
    Bu, transcript'leri silmez; yalnızca yeni bir oturum başlatır.

    ```json5
    {
      session: {
        idleMinutes: 240,
      },
    }
    ```

  </Accordion>

  <Accordion title="OpenClaw örneklerinden oluşan bir ekip kurmanın bir yolu var mı (bir CEO ve birçok agent)?">
    Evet, **çok agent'lı yönlendirme** ve **alt agent'lar** üzerinden. Bir koordinatör
    agent ve kendi çalışma alanları ile modelleri olan birkaç çalışan agent oluşturabilirsiniz.

    Bununla birlikte, bunu en iyi **eğlenceli bir deney** olarak görmek gerekir. Token kullanımı yüksektir ve çoğu zaman
    ayrı oturumları olan tek bir bot kullanmaktan daha az verimlidir. Öngördüğümüz tipik model,
    konuştuğunuz tek bir bot ve paralel işler için farklı oturumlardır. Bu
    bot gerektiğinde alt agent'lar da başlatabilir.

    Dokümanlar: [Çok agent'lı yönlendirme](/tr/concepts/multi-agent), [Alt agent'lar](/tr/tools/subagents), [Agent'lar CLI'si](/tr/cli/agents).

  </Accordion>

  <Accordion title="Bağlam neden görev ortasında kısaltıldı? Bunu nasıl önlerim?">
    Oturum bağlamı model penceresiyle sınırlıdır. Uzun sohbetler, büyük araç çıktıları veya çok sayıda
    dosya compaction ya da kısaltmayı tetikleyebilir.

    Yardımcı olanlar:

    - Bottan mevcut durumu özetlemesini ve bir dosyaya yazmasını isteyin.
    - Uzun görevlerden önce `/compact`, konu değiştirirken `/new` kullanın.
    - Önemli bağlamı çalışma alanında tutun ve bottan geri okumasını isteyin.
    - Ana sohbetin daha küçük kalması için uzun veya paralel işlerde alt agent'lar kullanın.
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

    - Onboarding mevcut bir yapılandırma görürse **Sıfırla** seçeneğini de sunar. Bkz. [Onboarding (CLI)](/tr/start/wizard).
    - Profiller kullandıysanız (`--profile` / `OPENCLAW_PROFILE`), her durum dizinini sıfırlayın (varsayılanlar `~/.openclaw-<profile>`).
    - Geliştirme sıfırlaması: `openclaw gateway --dev --reset` (yalnızca geliştirme; geliştirme yapılandırmasını + kimlik bilgilerini + oturumları + çalışma alanını siler).

  </Accordion>

  <Accordion title='"context too large" hataları alıyorum; nasıl sıfırlarım veya compact ederim?'>
    Bunlardan birini kullanın:

    - **Compact** (konuşmayı tutar ama eski turları özetler):

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

  <Accordion title='"LLM request rejected: messages.content.tool_use.input field required" neden görünüyor?'>
    Bu bir provider doğrulama hatasıdır: model, gerekli `input` olmadan bir `tool_use` bloğu yaydı.
    Bu genellikle oturum geçmişinin bayat veya bozulmuş olduğu anlamına gelir (çoğunlukla uzun thread'lerden
    veya bir araç/şema değişikliğinden sonra).

    Düzeltme: `/new` ile yeni bir oturum başlatın (bağımsız mesaj).

  </Accordion>

  <Accordion title="Neden her 30 dakikada bir heartbeat mesajları alıyorum?">
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

    `HEARTBEAT.md` varsa ancak fiilen boşsa (yalnızca boş satırlar ve `# Heading` gibi markdown
    başlıkları), OpenClaw API çağrılarını azaltmak için heartbeat çalışmasını atlar.
    Dosya eksikse heartbeat yine çalışır ve model ne yapacağına karar verir.

    Agent başına geçersiz kılmalar `agents.list[].heartbeat` kullanır. Dokümanlar: [Heartbeat](/tr/gateway/heartbeat).

  </Accordion>

  <Accordion title='Bir WhatsApp grubuna "bot hesabı" eklemem gerekiyor mu?'>
    Hayır. OpenClaw **kendi hesabınızda** çalışır; yani gruptaysanız OpenClaw onu görebilir.
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
    Seçenek 1 (en hızlı): logları takip edin ve grupta bir test mesajı gönderin:

    ```bash
    openclaw logs --follow --json
    ```

    `@g.us` ile biten `chatId` (veya `from`) arayın, örneğin:
    `1234567890-1234567890@g.us`.

    Seçenek 2 (zaten yapılandırılmış/izin listesine alınmışsa): yapılandırmadan grupları listeleyin:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    Dokümanlar: [WhatsApp](/tr/channels/whatsapp), [Dizin](/tr/cli/directory), [Loglar](/tr/cli/logs).

  </Accordion>

  <Accordion title="OpenClaw bir grupta neden yanıt vermiyor?">
    Yaygın iki neden:

    - Bahsetme geçidi açık (varsayılan). Botu @mention etmeniz (veya `mentionPatterns` ile eşleşmeniz) gerekir.
    - `channels.whatsapp.groups` yapılandırdınız ancak `"*"` yok ve grup izin listesinde değil.

    Bkz. [Gruplar](/tr/channels/groups) ve [Grup mesajları](/tr/channels/group-messages).

  </Accordion>

  <Accordion title="Gruplar/thread'ler DM'lerle bağlam paylaşır mı?">
    Doğrudan sohbetler varsayılan olarak ana oturuma daraltılır. Gruplar/kanalların kendi oturum anahtarları vardır ve Telegram konuları / Discord thread'leri ayrı oturumlardır. Bkz. [Gruplar](/tr/channels/groups) ve [Grup mesajları](/tr/channels/group-messages).
  </Accordion>

  <Accordion title="Kaç çalışma alanı ve agent oluşturabilirim?">
    Katı sınırlar yoktur. Düzinelerce (hatta yüzlerce) sorun değildir, ancak şunlara dikkat edin:

    - **Disk büyümesi:** oturumlar + transcript'ler `~/.openclaw/agents/<agentId>/sessions/` altında yaşar.
    - **Token maliyeti:** daha fazla agent daha fazla eşzamanlı model kullanımı demektir.
    - **Operasyon yükü:** agent başına kimlik doğrulama profilleri, çalışma alanları ve kanal yönlendirmesi.

    İpuçları:

    - Agent başına bir **aktif** çalışma alanı tutun (`agents.defaults.workspace`).
    - Disk büyürse eski oturumları budayın (JSONL veya store girdilerini silin).
    - Başıboş çalışma alanlarını ve profil uyumsuzluklarını bulmak için `openclaw doctor` kullanın.

  </Accordion>

  <Accordion title="Aynı anda birden fazla bot veya sohbet çalıştırabilir miyim (Slack) ve bunu nasıl kurmalıyım?">
    Evet. Birden fazla yalıtılmış ajan çalıştırmak ve gelen iletileri
    kanal/hesap/eş düzeyine göre yönlendirmek için **Çok Ajanlı Yönlendirme** kullanın. Slack bir kanal olarak desteklenir ve belirli ajanlara bağlanabilir.

    Tarayıcı erişimi güçlüdür ancak "bir insanın yapabildiği her şeyi yap" anlamına gelmez; bot karşıtı önlemler, CAPTCHA'lar ve MFA
    otomasyonu yine de engelleyebilir. En güvenilir tarayıcı denetimi için ana makinede yerel Chrome MCP kullanın
    veya tarayıcıyı gerçekten çalıştıran makinede CDP kullanın.

    En iyi uygulama kurulumu:

    - Her zaman açık Gateway ana makinesi (VPS/Mac mini).
    - Her rol için bir ajan (bağlamalar).
    - Bu ajanlara bağlı Slack kanalları.
    - Gerektiğinde Chrome MCP veya bir düğüm üzerinden yerel tarayıcı.

    Belgeler: [Çok Ajanlı Yönlendirme](/tr/concepts/multi-agent), [Slack](/tr/channels/slack),
    [Tarayıcı](/tr/tools/browser), [Düğümler](/tr/nodes).

  </Accordion>
</AccordionGroup>

## Modeller, yük devretme ve kimlik doğrulama profilleri

Model SSS'si — varsayılanlar, seçim, takma adlar, değiştirme, yük devretme, kimlik doğrulama profilleri —
[Modeller SSS](/tr/help/faq-models) içinde bulunur.

## Gateway: bağlantı noktaları, "zaten çalışıyor" ve uzak mod

<AccordionGroup>
  <Accordion title="Gateway hangi bağlantı noktasını kullanır?">
    `gateway.port`, WebSocket + HTTP (Control UI, kancalar vb.) için tek çoğullanmış bağlantı noktasını denetler.

    Öncelik:

    ```
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > default 18789
    ```

  </Accordion>

  <Accordion title='openclaw gateway status neden "Runtime: running" ama "Connectivity probe: failed" diyor?'>
    Çünkü "running", **supervisor** görünümüdür (launchd/systemd/schtasks). Bağlantı yoklaması ise CLI'nın gateway WebSocket'e gerçekten bağlanmasıdır.

    `openclaw gateway status` kullanın ve şu satırlara güvenin:

    - `Probe target:` (yoklamanın gerçekten kullandığı URL)
    - `Listening:` (bağlantı noktasında gerçekten neyin bağlı olduğu)
    - `Last gateway error:` (süreç canlıyken ancak bağlantı noktası dinlemede değilken yaygın kök neden)

  </Accordion>

  <Accordion title='openclaw gateway status neden "Config (cli)" ve "Config (service)" değerlerini farklı gösteriyor?'>
    Hizmet başka bir yapılandırmayla çalışırken siz farklı bir yapılandırma dosyasını düzenliyorsunuz (çoğu zaman `--profile` / `OPENCLAW_STATE_DIR` uyumsuzluğu).

    Düzeltme:

    ```bash
    openclaw gateway install --force
    ```

    Bunu hizmetin kullanmasını istediğiniz aynı `--profile` / ortamdan çalıştırın.

  </Accordion>

  <Accordion title='"another gateway instance is already listening" ne anlama gelir?'>
    OpenClaw, başlangıçta WebSocket dinleyicisini hemen bağlayarak bir çalışma zamanı kilidi uygular (varsayılan `ws://127.0.0.1:18789`). Bağlama `EADDRINUSE` ile başarısız olursa, başka bir örneğin zaten dinlemede olduğunu belirten `GatewayLockError` fırlatır.

    Düzeltme: diğer örneği durdurun, bağlantı noktasını boşaltın veya `openclaw gateway --port <port>` ile çalıştırın.

  </Accordion>

  <Accordion title="OpenClaw'ı uzak modda nasıl çalıştırırım (istemci başka yerdeki bir Gateway'e bağlanır)?">
    `gateway.mode: "remote"` ayarlayın ve isteğe bağlı olarak paylaşılan gizli uzak kimlik bilgileriyle uzak bir WebSocket URL'sine işaret edin:

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

    - `openclaw gateway` yalnızca `gateway.mode` değeri `local` olduğunda (veya geçersiz kılma bayrağını verdiğinizde) başlar.
    - macOS uygulaması yapılandırma dosyasını izler ve bu değerler değiştiğinde modları canlı olarak değiştirir.
    - `gateway.remote.token` / `.password` yalnızca istemci tarafı uzak kimlik bilgileridir; tek başlarına yerel gateway kimlik doğrulamasını etkinleştirmezler.

  </Accordion>

  <Accordion title='Control UI "unauthorized" diyor (veya yeniden bağlanmayı sürdürüyor). Şimdi ne yapmalıyım?'>
    Gateway kimlik doğrulama yolunuz ve UI'ın kimlik doğrulama yöntemi eşleşmiyor.

    Gerçekler (koddan):

    - Control UI, belirteci geçerli tarayıcı sekmesi oturumu ve seçili gateway URL'si için `sessionStorage` içinde tutar; böylece aynı sekmede yenilemeler, uzun ömürlü localStorage belirteç kalıcılığını geri yüklemeden çalışmayı sürdürür.
    - `AUTH_TOKEN_MISMATCH` durumunda, güvenilir istemciler gateway yeniden deneme ipuçları döndürdüğünde (`canRetryWithDeviceToken=true`, `recommendedNextStep=retry_with_device_token`) önbelleğe alınmış bir cihaz belirteciyle sınırlı bir yeniden deneme yapabilir.
    - Bu önbelleğe alınmış belirteç yeniden denemesi artık cihaz belirteciyle birlikte saklanan önbelleğe alınmış onaylı kapsamları yeniden kullanır. Açık `deviceToken` / açık `scopes` çağıranları ise önbelleğe alınmış kapsamları devralmak yerine istedikleri kapsam kümesini korur.
    - Bu yeniden deneme yolu dışında, bağlantı kimlik doğrulaması önceliği önce açık paylaşılan belirteç/parola, sonra açık `deviceToken`, sonra saklanan cihaz belirteci, sonra bootstrap belirtecidir.
    - Bootstrap belirteci kapsam denetimleri rol öneklidir. Yerleşik bootstrap operatör izin listesi yalnızca operatör isteklerini karşılar; düğüm veya diğer operatör olmayan rollerin yine de kendi rol önekleri altında kapsamlara ihtiyacı vardır.

    Düzeltme:

    - En hızlısı: `openclaw dashboard` (pano URL'sini yazdırır + kopyalar, açmayı dener; başsız ortamdaysa SSH ipucu gösterir).
    - Henüz belirteciniz yoksa: `openclaw doctor --generate-gateway-token`.
    - Uzaksa önce tünel kurun: `ssh -N -L 18789:127.0.0.1:18789 user@host` ardından `http://127.0.0.1:18789/` adresini açın.
    - Paylaşılan gizli mod: `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` veya `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` ayarlayın, ardından eşleşen gizli bilgiyi Control UI ayarlarına yapıştırın.
    - Tailscale Serve modu: `gateway.auth.allowTailscale` etkin olduğundan ve Tailscale kimlik başlıklarını atlayan ham bir loopback/tailnet URL'si değil, Serve URL'sini açtığınızdan emin olun.
    - Güvenilir proxy modu: ham bir gateway URL'si değil, yapılandırılmış kimlik duyarlı proxy üzerinden geldiğinizden emin olun. Aynı ana makinedeki loopback proxy'leri de `gateway.auth.trustedProxy.allowLoopback = true` gerektirir.
    - Tek yeniden denemeden sonra uyumsuzluk sürerse, eşleştirilmiş cihaz belirtecini döndürün/yeniden onaylayın:
      - `openclaw devices list`
      - `openclaw devices rotate --device <id> --role operator`
    - Bu döndürme çağrısı reddedildiğini söylüyorsa iki şeyi kontrol edin:
      - eşleştirilmiş cihaz oturumları, `operator.admin` yetkisine de sahip olmadıkları sürece yalnızca **kendi** cihazlarını döndürebilir
      - açık `--scope` değerleri çağıranın mevcut operatör kapsamlarını aşamaz
    - Hâlâ takıldınız mı? `openclaw status --all` çalıştırın ve [Sorun giderme](/tr/gateway/troubleshooting) adımlarını izleyin. Kimlik doğrulama ayrıntıları için [Pano](/tr/web/dashboard) bölümüne bakın.

  </Accordion>

  <Accordion title="gateway.bind tailnet ayarladım ancak bağlanamıyor ve hiçbir şey dinlemiyor">
    `tailnet` bağlaması, ağ arayüzlerinizden bir Tailscale IP'si seçer (100.64.0.0/10). Makine Tailscale üzerinde değilse (veya arayüz kapalıysa), bağlanacak hiçbir şey yoktur.

    Düzeltme:

    - Bu ana makinede Tailscale'i başlatın (böylece 100.x adresi olur), veya
    - `gateway.bind: "loopback"` / `"lan"` değerine geçin.

    Not: `tailnet` açıktır. `auto` loopback'i tercih eder; yalnızca tailnet'e özel bağlama istediğinizde `gateway.bind: "tailnet"` kullanın.

  </Accordion>

  <Accordion title="Aynı ana makinede birden fazla Gateway çalıştırabilir miyim?">
    Genellikle hayır; tek bir Gateway birden fazla mesajlaşma kanalı ve ajan çalıştırabilir. Birden fazla Gateway'i yalnızca yedeklilik (örn. kurtarma botu) veya katı yalıtım gerektiğinde kullanın.

    Evet, ancak yalıtmanız gerekir:

    - `OPENCLAW_CONFIG_PATH` (örnek başına yapılandırma)
    - `OPENCLAW_STATE_DIR` (örnek başına durum)
    - `agents.defaults.workspace` (çalışma alanı yalıtımı)
    - `gateway.port` (benzersiz bağlantı noktaları)

    Hızlı kurulum (önerilir):

    - Her örnek için `openclaw --profile <name> ...` kullanın (`~/.openclaw-<name>` otomatik oluşturulur).
    - Her profil yapılandırmasında benzersiz bir `gateway.port` ayarlayın (veya elle çalıştırmalar için `--port` verin).
    - Profil başına hizmet kurun: `openclaw --profile <name> gateway install`.

    Profiller hizmet adlarına da sonek ekler (`ai.openclaw.<profile>`; eski `com.openclaw.*`, `openclaw-gateway-<profile>.service`, `OpenClaw Gateway (<profile>)`).
    Tam kılavuz: [Birden fazla gateway](/tr/gateway/multiple-gateways).

  </Accordion>

  <Accordion title='"invalid handshake" / kod 1008 ne anlama gelir?'>
    Gateway bir **WebSocket sunucusudur** ve ilk iletinin
    bir `connect` çerçevesi olmasını bekler. Başka bir şey alırsa bağlantıyı
    **kod 1008** (ilke ihlali) ile kapatır.

    Yaygın nedenler:

    - Bir WS istemcisi yerine tarayıcıda **HTTP** URL'sini açtınız (`http://...`).
    - Yanlış bağlantı noktasını veya yolu kullandınız.
    - Bir proxy veya tünel kimlik doğrulama başlıklarını kaldırdı ya da Gateway olmayan bir istek gönderdi.

    Hızlı düzeltmeler:

    1. WS URL'sini kullanın: `ws://<host>:18789` (veya HTTPS ise `wss://...`).
    2. WS bağlantı noktasını normal bir tarayıcı sekmesinde açmayın.
    3. Kimlik doğrulama açıksa, belirteci/parolayı `connect` çerçevesine ekleyin.

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

    `logging.file` ile kararlı bir yol ayarlayabilirsiniz. Dosya günlük düzeyi `logging.level` tarafından denetlenir. Konsol ayrıntı düzeyi `--verbose` ve `logging.consoleLevel` tarafından denetlenir.

    En hızlı günlük izleme:

    ```bash
    openclaw logs --follow
    ```

    Hizmet/supervisor günlükleri (gateway launchd/systemd üzerinden çalıştığında):

    - macOS: `$OPENCLAW_STATE_DIR/logs/gateway.log` ve `gateway.err.log` (varsayılan: `~/.openclaw/logs/...`; profiller `~/.openclaw-<profile>/logs/...` kullanır)
    - Linux: `journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`
    - Windows: `schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`

    Daha fazlası için [Sorun giderme](/tr/gateway/troubleshooting) bölümüne bakın.

  </Accordion>

  <Accordion title="Gateway hizmetini nasıl başlatırım/durdururum/yeniden başlatırım?">
    Gateway yardımcılarını kullanın:

    ```bash
    openclaw gateway status
    openclaw gateway restart
    ```

    Gateway'i elle çalıştırıyorsanız, `openclaw gateway --force` bağlantı noktasını geri alabilir. [Gateway](/tr/gateway) bölümüne bakın.

  </Accordion>

  <Accordion title="Windows'ta terminalimi kapattım; OpenClaw'ı nasıl yeniden başlatırım?">
    **İki Windows kurulum modu** vardır:

    **1) WSL2 (önerilir):** Gateway Linux içinde çalışır.

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

    Belgeler: [Windows (WSL2)](/tr/platforms/windows), [Gateway hizmeti çalışma kitabı](/tr/gateway).

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

    - Model kimlik doğrulaması **gateway ana makinesinde** yüklenmemiş ( `models status` kontrol edin).
    - Kanal eşleştirme/izin listesi yanıtları engelliyor (kanal yapılandırmasını + günlükleri kontrol edin).
    - WebChat/Dashboard doğru belirteç olmadan açık.

    Uzakta iseniz tünel/Tailscale bağlantısının açık olduğunu ve
    Gateway WebSocket'e erişilebildiğini doğrulayın.

    Belgeler: [Kanallar](/tr/channels), [Sorun giderme](/tr/gateway/troubleshooting), [Uzak erişim](/tr/gateway/remote).

  </Accordion>

  <Accordion title='"Disconnected from gateway: no reason" - şimdi ne yapmalıyım?'>
    Bu genellikle UI'ın WebSocket bağlantısını kaybettiği anlamına gelir. Kontrol edin:

    1. Gateway çalışıyor mu? `openclaw gateway status`
    2. Gateway sağlıklı mı? `openclaw status`
    3. UI doğru token'a sahip mi? `openclaw dashboard`
    4. Uzaktaysa, tünel/Tailscale bağlantısı açık mı?

    Ardından günlükleri takip edin:

    ```bash
    openclaw logs --follow
    ```

    Belgeler: [Pano](/tr/web/dashboard), [Uzaktan erişim](/tr/gateway/remote), [Sorun giderme](/tr/gateway/troubleshooting).

  </Accordion>

  <Accordion title="Telegram setMyCommands fails. What should I check?">
    Günlükler ve kanal durumu ile başlayın:

    ```bash
    openclaw channels status
    openclaw channels logs --channel telegram
    ```

    Ardından hatayı eşleştirin:

    - `BOT_COMMANDS_TOO_MUCH`: Telegram menüsünde çok fazla giriş var. OpenClaw zaten Telegram sınırına kadar kırpar ve daha az komutla yeniden dener, ancak bazı menü girişlerinin yine de kaldırılması gerekir. Plugin/skill/özel komutları azaltın veya menüye ihtiyacınız yoksa `channels.telegram.commands.native` ayarını devre dışı bırakın.
    - `TypeError: fetch failed`, `Network request for 'setMyCommands' failed!` veya benzer ağ hataları: bir VPS üzerindeyseniz veya bir proxy arkasındaysanız, giden HTTPS'e izin verildiğini ve DNS'in `api.telegram.org` için çalıştığını doğrulayın.

    Gateway uzaktaysa, Gateway ana makinesindeki günlüklere baktığınızdan emin olun.

    Belgeler: [Telegram](/tr/channels/telegram), [Kanal sorun giderme](/tr/channels/troubleshooting).

  </Accordion>

  <Accordion title="TUI shows no output. What should I check?">
    Önce Gateway'e erişilebildiğini ve aracının çalışabildiğini doğrulayın:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    TUI içinde mevcut durumu görmek için `/status` kullanın. Bir sohbet
    kanalında yanıt bekliyorsanız, teslimatın etkin olduğundan emin olun (`/deliver on`).

    Belgeler: [TUI](/tr/web/tui), [Slash komutları](/tr/tools/slash-commands).

  </Accordion>

  <Accordion title="How do I completely stop then start the Gateway?">
    Hizmeti yüklediyseniz:

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

    Belgeler: [Gateway hizmet çalışma kitabı](/tr/gateway).

  </Accordion>

  <Accordion title="ELI5: openclaw gateway restart vs openclaw gateway">
    - `openclaw gateway restart`: **arka plan hizmetini** yeniden başlatır (launchd/systemd).
    - `openclaw gateway`: bu terminal oturumu için gateway'i **ön planda** çalıştırır.

    Hizmeti yüklediyseniz gateway komutlarını kullanın. Tek seferlik, ön planda
    çalıştırma istediğinizde `openclaw gateway` kullanın.

  </Accordion>

  <Accordion title="Fastest way to get more details when something fails">
    Daha fazla konsol ayrıntısı almak için Gateway'i `--verbose` ile başlatın. Ardından kanal kimlik doğrulaması, model yönlendirme ve RPC hataları için günlük dosyasını inceleyin.
  </Accordion>
</AccordionGroup>

## Medya ve ekler

<AccordionGroup>
  <Accordion title="My skill generated an image/PDF, but nothing was sent">
    Aracıdan çıkan ekler, (kendi satırında) bir `MEDIA:<path-or-url>` satırı içermelidir. [OpenClaw assistant kurulumu](/tr/start/openclaw) ve [Aracı gönderimi](/tr/tools/agent-send) bölümlerine bakın.

    CLI gönderimi:

    ```bash
    openclaw message send --target +15555550123 --message "Here you go" --media /path/to/file.png
    ```

    Ayrıca şunları kontrol edin:

    - Hedef kanal giden medyayı destekliyor ve izin listeleri tarafından engellenmiyor.
    - Dosya, sağlayıcının boyut sınırları içinde (görüntüler en fazla 2048px olacak şekilde yeniden boyutlandırılır).
    - `tools.fs.workspaceOnly=true`, yerel yol gönderimlerini çalışma alanı, geçici/medya deposu ve sandbox tarafından doğrulanmış dosyalarla sınırlı tutar.
    - `tools.fs.workspaceOnly=false`, `MEDIA:` ile aracının zaten okuyabildiği ana makineye yerel dosyaların gönderilmesine izin verir, ancak yalnızca medya ve güvenli belge türleri için (görüntüler, ses, video, PDF ve Office belgeleri). Düz metin ve gizli bilgiye benzeyen dosyalar yine de engellenir.

    [Görüntüler](/tr/nodes/images) bölümüne bakın.

  </Accordion>
</AccordionGroup>

## Güvenlik ve erişim denetimi

<AccordionGroup>
  <Accordion title="Is it safe to expose OpenClaw to inbound DMs?">
    Gelen DM'leri güvenilmeyen girdi olarak ele alın. Varsayılanlar riski azaltmak üzere tasarlanmıştır:

    - DM destekleyen kanallarda varsayılan davranış **eşleştirme**dir:
      - Bilinmeyen gönderenler bir eşleştirme kodu alır; bot mesajlarını işlemez.
      - Şununla onaylayın: `openclaw pairing approve --channel <channel> [--account <id>] <code>`
      - Bekleyen istekler **kanal başına 3** ile sınırlandırılır; bir kod gelmediyse `openclaw pairing list --channel <channel> [--account <id>]` komutunu kontrol edin.
    - DM'leri herkese açık açmak açıkça katılım gerektirir (`dmPolicy: "open"` ve izin listesi `"*"`).

    Riskli DM politikalarını ortaya çıkarmak için `openclaw doctor` çalıştırın.

  </Accordion>

  <Accordion title="Is prompt injection only a concern for public bots?">
    Hayır. Prompt injection, yalnızca bot'a kimin DM gönderebildiğiyle değil, **güvenilmeyen içerikle** ilgilidir.
    Yardımcınız dış içerik okuyorsa (web araması/getirme, tarayıcı sayfaları, e-postalar,
    belgeler, ekler, yapıştırılmış günlükler), bu içerik modeli ele geçirmeye çalışan
    talimatlar içerebilir. Bu, **tek gönderen siz olsanız bile** gerçekleşebilir.

    En büyük risk, araçlar etkinleştirildiğinde ortaya çıkar: model, bağlamı dışarı sızdırmaya
    veya sizin adınıza araç çağırmaya kandırılabilir. Etki alanını azaltmak için:

    - güvenilmeyen içeriği özetlemek üzere salt okunur veya araçları devre dışı bırakılmış bir "okuyucu" aracı kullanın
    - araç etkin aracılar için `web_search` / `web_fetch` / `browser` kapalı tutun
    - çözümlenmiş dosya/belge metnini de güvenilmeyen olarak ele alın: OpenResponses
      `input_file` ve medya eki çıkarma işlemleri, ham dosya metnini geçirmek yerine
      çıkarılan metni açık dış içerik sınırı işaretçileriyle sarmalar
    - sandbox ve sıkı araç izin listeleri kullanın

    Ayrıntılar: [Güvenlik](/tr/gateway/security).

  </Accordion>

  <Accordion title="Should my bot have its own email, GitHub account, or phone number?">
    Evet, çoğu kurulum için. Bot'u ayrı hesaplar ve telefon numaralarıyla yalıtmak,
    bir şey ters giderse etki alanını azaltır. Bu ayrıca kişisel hesaplarınızı etkilemeden
    kimlik bilgilerini döndürmeyi veya erişimi iptal etmeyi kolaylaştırır.

    Küçük başlayın. Yalnızca gerçekten ihtiyaç duyduğunuz araçlara ve hesaplara erişim verin,
    gerekirse daha sonra genişletin.

    Belgeler: [Güvenlik](/tr/gateway/security), [Eşleştirme](/tr/channels/pairing).

  </Accordion>

  <Accordion title="Can I give it autonomy over my text messages and is that safe?">
    Kişisel mesajlarınız üzerinde tam otonomi vermeyi **önermiyoruz**. En güvenli kalıp şudur:

    - DM'leri **eşleştirme modunda** veya sıkı bir izin listesinde tutun.
    - Sizin adınıza mesaj göndermesini istiyorsanız **ayrı bir numara veya hesap** kullanın.
    - Taslak hazırlamasına izin verin, ardından **göndermeden önce onaylayın**.

    Denemek istiyorsanız, bunu ayrılmış bir hesapta yapın ve yalıtılmış tutun. Bkz.
    [Güvenlik](/tr/gateway/security).

  </Accordion>

  <Accordion title="Can I use cheaper models for personal assistant tasks?">
    Evet, aracı yalnızca sohbet amaçlıysa ve girdi güvenilir ise. Daha küçük katmanlar
    talimat ele geçirmeye daha yatkındır, bu yüzden araç etkin aracılar için
    veya güvenilmeyen içerik okurken bunlardan kaçının. Daha küçük bir model kullanmanız gerekiyorsa
    araçları kilitleyin ve bir sandbox içinde çalıştırın. Bkz. [Güvenlik](/tr/gateway/security).
  </Accordion>

  <Accordion title="I ran /start in Telegram but did not get a pairing code">
    Eşleştirme kodları **yalnızca** bilinmeyen bir gönderen bot'a mesaj gönderdiğinde ve
    `dmPolicy: "pairing"` etkin olduğunda gönderilir. `/start` tek başına kod oluşturmaz.

    Bekleyen istekleri kontrol edin:

    ```bash
    openclaw pairing list telegram
    ```

    Hemen erişim istiyorsanız, gönderen id'nizi izin listesine ekleyin veya o hesap için
    `dmPolicy: "open"` ayarlayın.

  </Accordion>

  <Accordion title="WhatsApp: will it message my contacts? How does pairing work?">
    Hayır. Varsayılan WhatsApp DM politikası **eşleştirme**dir. Bilinmeyen gönderenler yalnızca bir eşleştirme kodu alır ve mesajları **işlenmez**. OpenClaw yalnızca aldığı sohbetlere veya sizin tetiklediğiniz açık gönderimlere yanıt verir.

    Eşleştirmeyi şununla onaylayın:

    ```bash
    openclaw pairing approve whatsapp <code>
    ```

    Bekleyen istekleri listeleyin:

    ```bash
    openclaw pairing list whatsapp
    ```

    Sihirbaz telefon numarası istemi: kendi DM'lerinize izin verilebilmesi için **izin listenizi/sahibinizi** ayarlamakta kullanılır. Otomatik gönderim için kullanılmaz. Kişisel WhatsApp numaranızda çalıştırıyorsanız, o numarayı kullanın ve `channels.whatsapp.selfChatMode` etkinleştirin.

  </Accordion>
</AccordionGroup>

## Sohbet komutları, görevleri iptal etme ve "durmuyor"

<AccordionGroup>
  <Accordion title="How do I stop internal system messages from showing in chat?">
    Çoğu dahili veya araç mesajı yalnızca o oturum için **verbose**, **trace** veya **reasoning** etkin olduğunda görünür.

    Bunu gördüğünüz sohbette düzeltin:

    ```
    /verbose off
    /trace off
    /reasoning off
    ```

    Hâlâ gürültülüyse, Control UI içinde oturum ayarlarını kontrol edin ve verbose değerini
    **inherit** olarak ayarlayın. Ayrıca yapılandırmada `verboseDefault` değeri `on` olarak ayarlanmış
    bir bot profili kullanmadığınızı doğrulayın.

    Belgeler: [Düşünme ve verbose](/tr/tools/thinking), [Güvenlik](/tr/gateway/security/index#reasoning-and-verbose-output-in-groups).

  </Accordion>

  <Accordion title="How do I stop/cancel a running task?">
    Bunlardan herhangi birini **bağımsız bir mesaj** olarak gönderin (slash yok):

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

    Arka plan süreçleri için (exec aracından), aracıdan şunu çalıştırmasını isteyebilirsiniz:

    ```
    process action:kill sessionId:XXX
    ```

    Slash komutları genel bakışı: bkz. [Slash komutları](/tr/tools/slash-commands).

    Çoğu komut, `/` ile başlayan **bağımsız** bir mesaj olarak gönderilmelidir, ancak birkaç kısayol (`/status` gibi) izin listesine alınmış gönderenler için satır içinde de çalışır.

  </Accordion>

  <Accordion title='How do I send a Discord message from Telegram? ("Cross-context messaging denied")'>
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

    Yapılandırmayı düzenledikten sonra gateway'i yeniden başlatın.

  </Accordion>

  <Accordion title='Why does it feel like the bot "ignores" rapid-fire messages?'>
    Kuyruk modu, yeni mesajların devam eden bir çalışmayla nasıl etkileştiğini kontrol eder. Modları değiştirmek için `/queue` kullanın:

    - `steer` - geçerli çalışmadaki sonraki model sınırı için bekleyen tüm yönlendirmeleri kuyruğa alır
    - `queue` - eski, tek seferde bir yönlendirme
    - `followup` - mesajları tek tek çalıştırır
    - `collect` - mesajları toplu işler ve bir kez yanıtlar
    - `steer-backlog` - şimdi yönlendirir, ardından birikmiş işleri işler
    - `interrupt` - geçerli çalışmayı iptal eder ve temiz başlar

    Varsayılan mod `steer` şeklindedir. Followup modları için `debounce:0.5s cap:25 drop:summarize` gibi seçenekler ekleyebilirsiniz. [Komut kuyruğu](/tr/concepts/queue) ve [Yönlendirme kuyruğu](/tr/concepts/queue-steering) bölümlerine bakın.

  </Accordion>
</AccordionGroup>

## Çeşitli

<AccordionGroup>
  <Accordion title='Anthropic için API anahtarıyla varsayılan model nedir?'>
    OpenClaw'da kimlik bilgileri ve model seçimi ayrıdır. `ANTHROPIC_API_KEY` ayarlamak (veya auth profillerinde bir Anthropic API anahtarı saklamak) kimlik doğrulamayı etkinleştirir, ancak gerçek varsayılan model `agents.defaults.model.primary` içinde yapılandırdığınız modeldir (örneğin `anthropic/claude-sonnet-4-6` veya `anthropic/claude-opus-4-6`). `No credentials found for profile "anthropic:default"` görüyorsanız, bu, Gateway'in çalışan agent için beklenen `auth-profiles.json` içinde Anthropic kimlik bilgilerini bulamadığı anlamına gelir.
  </Accordion>
</AccordionGroup>

---

Hâlâ takıldınız mı? [Discord](https://discord.com/invite/clawd) üzerinden sorun veya bir [GitHub tartışması](https://github.com/openclaw/openclaw/discussions) açın.

## İlgili

- [İlk çalıştırma SSS](/tr/help/faq-first-run) — kurulum, başlangıç, kimlik doğrulama, abonelikler, erken hatalar
- [Modeller SSS](/tr/help/faq-models) — model seçimi, yedek modele geçiş, auth profilleri
- [Sorun giderme](/tr/help/troubleshooting) — belirti odaklı triyaj
