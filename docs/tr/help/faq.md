---
read_when:
    - Yaygın kurulum, yükleme, başlangıç yönlendirmesi veya çalışma zamanı desteği sorularını yanıtlama
    - Daha derin hata ayıklamaya geçmeden önce kullanıcıların bildirdiği sorunları önceliklendirme
summary: OpenClaw kurulumu, yapılandırması ve kullanımı hakkında sıkça sorulan sorular
title: SSS
x-i18n:
    generated_at: "2026-05-10T19:40:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 121de36647f7452969b760d6b6ab0a6b1b776d63987ca6ba0be1c8cf4c9f85e9
    source_path: help/faq.md
    workflow: 16
---

Gerçek dünya kurulumları (yerel geliştirme, VPS, çoklu ajan, OAuth/API anahtarları, model yedeklemesi) için hızlı yanıtlar ve daha derin sorun giderme. Çalışma zamanı tanılamaları için [Sorun Giderme](/tr/gateway/troubleshooting) bölümüne bakın. Tam yapılandırma başvurusu için [Yapılandırma](/tr/gateway/configuration) bölümüne bakın.

## Bir şey bozulduysa ilk 60 saniye

1. **Hızlı durum (ilk kontrol)**

   ```bash
   openclaw status
   ```

   Hızlı yerel özet: işletim sistemi + güncelleme, gateway/servis erişilebilirliği, ajanlar/oturumlar, sağlayıcı yapılandırması + çalışma zamanı sorunları (gateway erişilebilir olduğunda).

2. **Yapıştırılabilir rapor (paylaşması güvenli)**

   ```bash
   openclaw status --all
   ```

   Günlük sonu ile salt okunur tanılama (token'lar gizlenir).

3. **Daemon + port durumu**

   ```bash
   openclaw gateway status
   ```

   Gözetici çalışma zamanı ile RPC erişilebilirliğini, yoklama hedef URL'sini ve servisin muhtemelen hangi yapılandırmayı kullandığını gösterir.

4. **Derin yoklamalar**

   ```bash
   openclaw status --deep
   ```

   Desteklendiğinde kanal yoklamaları dahil canlı bir gateway sağlık yoklaması çalıştırır
   (erişilebilir bir gateway gerektirir). [Sağlık](/tr/gateway/health) bölümüne bakın.

5. **En son günlüğü takip et**

   ```bash
   openclaw logs --follow
   ```

   RPC kapalıysa şuna geri dönün:

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   Dosya günlükleri servis günlüklerinden ayrıdır; [Günlükleme](/tr/logging) ve [Sorun Giderme](/tr/gateway/troubleshooting) bölümlerine bakın.

6. **Doktoru çalıştır (onarımlar)**

   ```bash
   openclaw doctor
   ```

   Yapılandırma/durumu onarır/taşır + sağlık kontrolleri çalıştırır. [Doktor](/tr/gateway/doctor) bölümüne bakın.

7. **Gateway anlık görüntüsü**

   ```bash
   openclaw health --json
   openclaw health --verbose   # hatalarda hedef URL'yi + yapılandırma yolunu gösterir
   ```

   Çalışan gateway'den tam bir anlık görüntü ister (yalnızca WS). [Sağlık](/tr/gateway/health) bölümüne bakın.

## Hızlı başlangıç ve ilk çalıştırma kurulumu

İlk çalıştırma soru-cevapları — kurulum, ilk katılım, kimlik doğrulama rotaları, abonelikler, ilk hatalar —
[İlk çalıştırma SSS](/tr/help/faq-first-run) sayfasında yer alır.

## OpenClaw nedir?

<AccordionGroup>
  <Accordion title="OpenClaw bir paragrafta nedir?">
    OpenClaw, kendi cihazlarınızda çalıştırdığınız kişisel bir yapay zeka asistanıdır. Zaten kullandığınız mesajlaşma yüzeylerinde (WhatsApp, Telegram, Slack, Mattermost, Discord, Google Chat, Signal, iMessage, WebChat ve QQ Bot gibi birlikte gelen kanal Plugin'leri) yanıt verir ve desteklenen platformlarda ses + canlı Canvas da yapabilir. **Gateway** her zaman açık denetim düzlemidir; asistan ise ürünün kendisidir.
  </Accordion>

  <Accordion title="Değer önerisi">
    OpenClaw "yalnızca bir Claude sarmalayıcısı" değildir. Zaten kullandığınız sohbet uygulamalarından erişilebilen,
    **kendi donanımınızda** yetenekli bir asistan çalıştırmanızı sağlayan **yerel öncelikli bir denetim düzlemidir**;
    durum bilgili oturumlar, bellek ve araçlar sunar - iş akışlarınızın kontrolünü barındırılan
    bir SaaS'a devretmeden.

    Öne çıkanlar:

    - **Cihazlarınız, verileriniz:** Gateway'i istediğiniz yerde çalıştırın (Mac, Linux, VPS) ve
      çalışma alanı + oturum geçmişini yerel tutun.
    - **Web sanal alanı değil, gerçek kanallar:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage/vb,
      ayrıca desteklenen platformlarda mobil ses ve Canvas.
    - **Modelden bağımsız:** ajan başına yönlendirme
      ve yedekleme ile Anthropic, OpenAI, MiniMax, OpenRouter vb. kullanın.
    - **Yalnızca yerel seçeneği:** yerel modeller çalıştırın; isterseniz **tüm veriler cihazınızda kalabilir**.
    - **Çoklu ajan yönlendirmesi:** kanal, hesap veya görev başına ayrı ajanlar; her birinin kendi
      çalışma alanı ve varsayılanları vardır.
    - **Açık kaynak ve hacklenebilir:** satıcı kilidine takılmadan inceleyin, genişletin ve kendi kendinize barındırın.

    Belgeler: [Gateway](/tr/gateway), [Kanallar](/tr/channels), [Çoklu ajan](/tr/concepts/multi-agent),
    [Bellek](/tr/concepts/memory).

  </Accordion>

  <Accordion title="Yeni kurdum - önce ne yapmalıyım?">
    İyi ilk projeler:

    - Bir web sitesi oluşturun (WordPress, Shopify veya basit bir statik site).
    - Bir mobil uygulama prototipi hazırlayın (taslak, ekranlar, API planı).
    - Dosya ve klasörleri düzenleyin (temizlik, adlandırma, etiketleme).
    - Gmail'i bağlayın ve özetleri veya takipleri otomatikleştirin.

    Büyük görevleri halledebilir, ancak bunları aşamalara böldüğünüzde ve
    paralel çalışma için alt ajanlar kullandığınızda en iyi şekilde çalışır.

  </Accordion>

  <Accordion title="OpenClaw için en iyi beş günlük kullanım senaryosu nedir?">
    Günlük kazanımlar genellikle şöyle görünür:

    - **Kişisel brifingler:** gelen kutusu, takvim ve önemsediğiniz haberlerin özetleri.
    - **Araştırma ve taslak oluşturma:** e-postalar veya belgeler için hızlı araştırma, özetler ve ilk taslaklar.
    - **Hatırlatıcılar ve takipler:** Cron veya Heartbeat ile tetiklenen dürtmeler ve kontrol listeleri.
    - **Tarayıcı otomasyonu:** formları doldurma, veri toplama ve web görevlerini tekrarlama.
    - **Cihazlar arası koordinasyon:** telefonunuzdan bir görev gönderin, Gateway'in bunu bir sunucuda çalıştırmasına izin verin ve sonucu sohbette geri alın.

  </Accordion>

  <Accordion title="OpenClaw bir SaaS için potansiyel müşteri oluşturma, erişim, reklamlar ve bloglarda yardımcı olabilir mi?">
    **Araştırma, nitelendirme ve taslak hazırlama** için evet. Siteleri tarayabilir, kısa listeler oluşturabilir,
    potansiyel müşterileri özetleyebilir ve erişim ya da reklam metni taslakları yazabilir.

    **Erişim veya reklam çalışmaları** için, sürece bir insan dahil edin. Spam'den kaçının, yerel yasalara ve
    platform politikalarına uyun ve gönderilmeden önce her şeyi gözden geçirin. En güvenli kalıp,
    OpenClaw'ın taslak hazırlaması ve sizin onaylamanızdır.

    Dokümanlar: [Güvenlik](/tr/gateway/security).

  </Accordion>

  <Accordion title="Web geliştirme için Claude Code'a göre avantajları nelerdir?">
    OpenClaw bir IDE yerine geçen bir araç değil, bir **kişisel asistan** ve koordinasyon katmanıdır. Bir repo içinde en hızlı doğrudan kodlama döngüsü için
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
  <Accordion title="Repo'yu kirli tutmadan skills'leri nasıl özelleştiririm?">
    Repo kopyasını düzenlemek yerine yönetilen geçersiz kılmalar kullanın. Değişikliklerinizi `~/.openclaw/skills/<name>/SKILL.md` içine koyun (veya `~/.openclaw/openclaw.json` içinde `skills.load.extraDirs` ile bir klasör ekleyin). Öncelik sırası `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → paketlenmiş → `skills.load.extraDirs` şeklindedir; bu nedenle yönetilen geçersiz kılmalar git'e dokunmadan paketlenmiş skills'lere göre yine de önceliklidir. Skill'in global olarak yüklü olması ama yalnızca bazı ajanlara görünmesi gerekiyorsa, paylaşılan kopyayı `~/.openclaw/skills` içinde tutun ve görünürlüğü `agents.defaults.skills` ile `agents.list[].skills` üzerinden kontrol edin. Yalnızca upstream'e uygun düzenlemeler repo'da yaşamalı ve PR olarak gönderilmelidir.
  </Accordion>

  <Accordion title="Skills'leri özel bir klasörden yükleyebilir miyim?">
    Evet. `~/.openclaw/openclaw.json` içinde `skills.load.extraDirs` üzerinden ek dizinler ekleyin (en düşük öncelik). Varsayılan öncelik sırası `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → paketlenmiş → `skills.load.extraDirs` şeklindedir. `clawhub` varsayılan olarak `./skills` içine kurar; OpenClaw bunu bir sonraki oturumda `<workspace>/skills` olarak ele alır. Skill yalnızca belirli ajanlara görünmeliysa, bunu `agents.defaults.skills` veya `agents.list[].skills` ile eşleştirin.
  </Accordion>

  <Accordion title="Farklı görevler için farklı modelleri nasıl kullanabilirim?">
    Bugün desteklenen kalıplar şunlardır:

    - **Cron işleri**: yalıtılmış işler, iş başına bir `model` geçersiz kılması ayarlayabilir.
    - **Alt ajanlar**: görevleri farklı varsayılan modellere sahip ayrı ajanlara yönlendirin.
    - **İsteğe bağlı geçiş**: mevcut oturum modelini istediğiniz zaman değiştirmek için `/model` kullanın.

    Bkz. [Cron işleri](/tr/automation/cron-jobs), [Çok Ajanlı Yönlendirme](/tr/concepts/multi-agent) ve [Slash komutları](/tr/tools/slash-commands).

  </Accordion>

  <Accordion title="Bot ağır iş yaparken donuyor. Bunu nasıl başka yere aktarırım?">
    Uzun veya paralel görevler için **alt ajanlar** kullanın. Alt ajanlar kendi oturumlarında çalışır,
    bir özet döndürür ve ana sohbetinizin yanıt vermeye devam etmesini sağlar.

    Botunuzdan "bu görev için bir alt ajan oluşturmasını" isteyin veya `/subagents` kullanın.
    Gateway'in şu anda ne yaptığını (ve meşgul olup olmadığını) görmek için sohbette `/status` kullanın.

    Token ipucu: uzun görevler ve alt ajanların ikisi de token tüketir. Maliyet önemliyse, alt ajanlar için
    `agents.defaults.subagents.model` üzerinden daha ucuz bir model ayarlayın.

    Dokümanlar: [Alt ajanlar](/tr/tools/subagents), [Arka Plan Görevleri](/tr/automation/tasks).

  </Accordion>

  <Accordion title="Discord'da thread'e bağlı subagent oturumları nasıl çalışır?">
    Thread bağlamalarını kullanın. Bir Discord thread'ini bir subagent'e veya oturum hedefine bağlayabilirsiniz; böylece o thread'deki takip mesajları bağlı oturumda kalır.

    Temel akış:

    - `thread: true` ile `sessions_spawn` kullanarak oluşturun (ve kalıcı takip için isteğe bağlı olarak `mode: "session"`).
    - Veya `/focus <target>` ile elle bağlayın.
    - Bağlama durumunu incelemek için `/agents` kullanın.
    - Otomatik odaktan çıkmayı kontrol etmek için `/session idle <duration|off>` ve `/session max-age <duration|off>` kullanın.
    - Thread'i ayırmak için `/unfocus` kullanın.

    Gerekli yapılandırma:

    - Global varsayılanlar: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
    - Discord geçersiz kılmaları: `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours`.
    - Oluşturma sırasında otomatik bağlama: `channels.discord.threadBindings.spawnSessions` varsayılan olarak `true` değerindedir; thread'e bağlı oturum oluşturmayı devre dışı bırakmak için bunu `false` olarak ayarlayın.

    Dokümanlar: [Alt ajanlar](/tr/tools/subagents), [Discord](/tr/channels/discord), [Yapılandırma Başvurusu](/tr/gateway/configuration-reference), [Slash komutları](/tr/tools/slash-commands).

  </Accordion>

  <Accordion title="Bir subagent tamamlandı, ancak tamamlanma güncellemesi yanlış yere gitti veya hiç gönderilmedi. Neyi kontrol etmeliyim?">
    Önce çözümlenen istek sahibi rotasını kontrol edin:

    - Tamamlanma modundaki subagent teslimi, mevcutsa herhangi bir bağlı thread'i veya konuşma rotasını tercih eder.
    - Tamamlanma kaynağı yalnızca bir kanal taşıyorsa, doğrudan teslimin yine de başarılı olabilmesi için OpenClaw istek sahibi oturumun saklanan rotasına (`lastChannel` / `lastTo` / `lastAccountId`) geri döner.
    - Ne bağlı bir rota ne de kullanılabilir saklanan bir rota varsa, doğrudan teslim başarısız olabilir ve sonuç sohbet'e hemen gönderilmek yerine sıraya alınmış oturum teslimine geri döner.
    - Geçersiz veya eski hedefler yine de kuyruk geri dönüşünü ya da son teslim başarısızlığını zorlayabilir.
    - Alt öğenin son görünür asistan yanıtı tam olarak sessiz token `NO_REPLY` / `no_reply` ya da tam olarak `ANNOUNCE_SKIP` ise, OpenClaw eski daha önceki ilerlemeyi göndermek yerine duyuruyu bilerek bastırır.
    - Alt öğe yalnızca araç çağrılarından sonra zaman aşımına uğradıysa, duyuru ham araç çıktısını yeniden oynatmak yerine bunu kısa bir kısmi ilerleme özetine sıkıştırabilir.

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

    - Cron'un etkin olduğunu (`cron.enabled`) ve `OPENCLAW_SKIP_CRON` ayarlı olmadığını doğrulayın.
    - Gateway'in 7/24 çalıştığını kontrol edin (uyku/yeniden başlatma yok).
    - İş için saat dilimi ayarlarını doğrulayın (`--tz` ile ana makine saat dilimi karşılaştırması).

    Hata ayıklama:

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    Dokümanlar: [Cron işleri](/tr/automation/cron-jobs), [Otomasyon ve Görevler](/tr/automation).

  </Accordion>

  <Accordion title="Cron tetiklendi, ancak kanala hiçbir şey gönderilmedi. Neden?">
    Önce teslim modunu kontrol edin:

    - `--no-deliver` / `delivery.mode: "none"` runner yedek gönderiminin beklenmediği anlamına gelir.
    - Eksik veya geçersiz duyuru hedefi (`channel` / `to`), runner'ın giden teslimatı atladığı anlamına gelir.
    - Kanal kimlik doğrulama hataları (`unauthorized`, `Forbidden`), runner'ın teslim etmeyi denediği ancak kimlik bilgilerinin bunu engellediği anlamına gelir.
    - Sessiz yalıtılmış sonuç (yalnızca `NO_REPLY` / `no_reply`) kasıtlı olarak teslim edilemez kabul edilir, bu yüzden runner kuyruğa alınmış yedek teslimatı da bastırır.

    Yalıtılmış Cron işleri için agent, sohbet rotası mevcut olduğunda `message`
    aracıyla yine de doğrudan gönderebilir. `--announce` yalnızca agent'ın zaten
    göndermediği son metin için runner yedek yolunu kontrol eder.

    Hata ayıklama:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Belgeler: [Cron işleri](/tr/automation/cron-jobs), [Arka Plan Görevleri](/tr/automation/tasks).

  </Accordion>

  <Accordion title="Yalıtılmış bir Cron çalıştırması neden model değiştirdi veya bir kez yeniden denedi?">
    Bu genellikle yinelenen zamanlama değil, canlı model değiştirme yoludur.

    Yalıtılmış Cron, aktif çalıştırma `LiveSessionModelSwitchError` fırlattığında
    çalışma zamanı model devrini kalıcı hale getirip yeniden deneyebilir. Yeniden
    deneme, değiştirilen sağlayıcıyı/modeli korur ve değişiklik yeni bir kimlik
    doğrulama profili geçersiz kılması taşıyorsa Cron bunu da yeniden denemeden
    önce kalıcı hale getirir.

    İlgili seçim kuralları:

    - Uygulanabiliyorsa önce Gmail hook model geçersiz kılması kazanır.
    - Sonra iş başına `model`.
    - Sonra saklanan Cron oturumu model geçersiz kılmaları.
    - Sonra normal agent/varsayılan model seçimi.

    Yeniden deneme döngüsü sınırlıdır. İlk deneme artı 2 değiştirme yeniden denemesinden sonra
    Cron sonsuza kadar döngüye girmek yerine iptal eder.

    Hata ayıklama:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Belgeler: [Cron işleri](/tr/automation/cron-jobs), [Cron CLI](/tr/cli/cron).

  </Accordion>

  <Accordion title="Linux üzerinde Skills nasıl kurarım?">
    Yerel `openclaw skills` komutlarını kullanın veya Skills'i çalışma alanınıza bırakın. macOS Skills arayüzü Linux üzerinde kullanılamaz.
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
    dizinine yazar. Ayrı `clawhub` CLI'ını yalnızca kendi Skills'inizi yayımlamak
    veya eşitlemek istiyorsanız kurun. Agent'lar arasında paylaşılan kurulumlar için Skill'i
    `~/.openclaw/skills` altına koyun ve hangi agent'ların bunu görebileceğini
    daraltmak istiyorsanız `agents.defaults.skills` veya
    `agents.list[].skills` kullanın.

  </Accordion>

  <Accordion title="OpenClaw görevleri bir zamanlamaya göre veya arka planda sürekli çalıştırabilir mi?">
    Evet. Gateway zamanlayıcısını kullanın:

    - Zamanlanmış veya yinelenen görevler için **Cron işleri** (yeniden başlatmalar boyunca kalıcıdır).
    - "Ana oturum" dönemsel kontrolleri için **Heartbeat**.
    - Özet gönderen veya sohbetlere teslimat yapan otonom agent'lar için **yalıtılmış işler**.

    Belgeler: [Cron işleri](/tr/automation/cron-jobs), [Otomasyon ve Görevler](/tr/automation),
    [Heartbeat](/tr/gateway/heartbeat).

  </Accordion>

  <Accordion title="Apple macOS'a özel Skills'i Linux'tan çalıştırabilir miyim?">
    Doğrudan değil. macOS Skills'i `metadata.openclaw.os` ve gerekli ikili dosyalarla sınırlandırılır; Skills sistem isteminde yalnızca **Gateway host** üzerinde uygun olduklarında görünür. Linux üzerinde `darwin`'e özel Skills (`apple-notes`, `apple-reminders`, `things-mac` gibi), sınırlamayı geçersiz kılmadığınız sürece yüklenmez.

    Desteklenen üç kalıp vardır:

    **Seçenek A - Gateway'i bir Mac üzerinde çalıştırın (en basit).**
    Gateway'i macOS ikili dosyalarının bulunduğu yerde çalıştırın, ardından Linux'tan [uzak modda](#gateway-ports-already-running-and-remote-mode) veya Tailscale üzerinden bağlanın. Gateway host macOS olduğu için Skills normal şekilde yüklenir.

    **Seçenek B - bir macOS Node kullanın (SSH yok).**
    Gateway'i Linux üzerinde çalıştırın, bir macOS Node'u (menü çubuğu uygulaması) eşleştirin ve Mac üzerinde **Node Komutlarını Çalıştır** ayarını "Her Zaman Sor" veya "Her Zaman İzin Ver" olarak belirleyin. OpenClaw, gerekli ikili dosyalar Node üzerinde mevcut olduğunda macOS'a özel Skills'i uygun kabul edebilir. Agent bu Skills'i `nodes` aracı üzerinden çalıştırır. "Her Zaman Sor" seçerseniz istemde "Her Zaman İzin Ver" onayı, o komutu izin listesine ekler.

    **Seçenek C - macOS ikili dosyalarını SSH üzerinden proxy'leyin (ileri düzey).**
    Gateway'i Linux üzerinde tutun, ancak gerekli CLI ikili dosyalarının bir Mac üzerinde çalışan SSH sarmalayıcılarına çözümlenmesini sağlayın. Sonra uygun kalması için Skill'i Linux'a izin verecek şekilde geçersiz kılın.

    1. İkili dosya için bir SSH sarmalayıcısı oluşturun (örnek: Apple Notes için `memo`):

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. Sarmalayıcıyı Linux host üzerinde `PATH` içine koyun (örneğin `~/bin/memo`).
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

    - **Özel Skill / Plugin:** güvenilir API erişimi için en iyisi (Notion/HeyGen ikisinin de API'leri vardır).
    - **Tarayıcı otomasyonu:** kod olmadan çalışır ancak daha yavaş ve daha kırılgandır.

    Bağlamı her müşteri için ayrı tutmak istiyorsanız (ajans iş akışları), basit bir kalıp şudur:

    - Her müşteri için bir Notion sayfası (bağlam + tercihler + aktif iş).
    - Oturum başlangıcında agent'tan o sayfayı getirmesini isteyin.

    Yerel bir entegrasyon istiyorsanız, bir özellik isteği açın veya bu API'leri
    hedefleyen bir Skill oluşturun.

    Skills'i kurun:

    ```bash
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    Yerel kurulumlar etkin çalışma alanındaki `skills/` dizinine iner. Agent'lar arasında paylaşılan Skills için bunları `~/.openclaw/skills/<name>/SKILL.md` konumuna yerleştirin. Yalnızca bazı agent'ların paylaşılan bir kurulumu görmesi gerekiyorsa `agents.defaults.skills` veya `agents.list[].skills` yapılandırın. Bazı Skills, Homebrew üzerinden kurulan ikili dosyalar bekler; Linux üzerinde bu Linuxbrew anlamına gelir (yukarıdaki Homebrew Linux SSS girdisine bakın). Bkz. [Skills](/tr/tools/skills), [Skills yapılandırması](/tr/tools/skills-config) ve [ClawHub](/tr/clawhub).

  </Accordion>

  <Accordion title="OpenClaw ile mevcut oturum açılmış Chrome'umu nasıl kullanırım?">
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

    Bu yol yerel host tarayıcısını veya bağlı bir tarayıcı Node'unu kullanabilir. Gateway başka bir yerde çalışıyorsa, tarayıcı makinesinde bir Node host çalıştırın veya bunun yerine uzak CDP kullanın.

    `existing-session` / `user` üzerindeki mevcut sınırlar:

    - eylemler CSS seçici odaklı değil, ref odaklıdır
    - yüklemeler `ref` / `inputRef` gerektirir ve şu anda aynı anda bir dosyayı destekler
    - `responsebody`, PDF dışa aktarımı, indirme yakalama ve toplu eylemler için hâlâ yönetilen bir tarayıcı veya ham CDP profili gerekir

  </Accordion>
</AccordionGroup>

## Sandbox kullanımı ve bellek

<AccordionGroup>
  <Accordion title="Özel bir sandbox belgesi var mı?">
    Evet. Bkz. [Sandbox kullanımı](/tr/gateway/sandboxing). Docker'a özel kurulum için (Docker içinde tam Gateway veya sandbox imajları), bkz. [Docker](/tr/install/docker).
  </Accordion>

  <Accordion title="Docker sınırlı hissettiriyor - tam özellikleri nasıl etkinleştiririm?">
    Varsayılan imaj güvenlik önceliklidir ve `node` kullanıcısı olarak çalışır, bu nedenle
    sistem paketlerini, Homebrew'i veya paketlenmiş tarayıcıları içermez. Daha eksiksiz bir kurulum için:

    - Önbelleklerin korunması için `/home/node` konumunu `OPENCLAW_HOME_VOLUME` ile kalıcı hale getirin.
    - Sistem bağımlılıklarını `OPENCLAW_DOCKER_APT_PACKAGES` ile imaja ekleyin.
    - Playwright tarayıcılarını paketlenmiş CLI ile kurun:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - `PLAYWRIGHT_BROWSERS_PATH` ayarlayın ve yolun kalıcı olduğundan emin olun.

    Belgeler: [Docker](/tr/install/docker), [Tarayıcı](/tr/tools/browser).

  </Accordion>

  <Accordion title="DM'leri kişisel tutup grupları tek bir agent ile herkese açık/sandbox'lı yapabilir miyim?">
    Evet - özel trafiğiniz **DM'ler** ve herkese açık trafiğiniz **gruplar** ise.

    Grup/kanal oturumlarının (ana olmayan anahtarlar) yapılandırılmış sandbox arka ucunda çalışması, ana DM oturumunun ise host üzerinde kalması için `agents.defaults.sandbox.mode: "non-main"` kullanın. Bir arka uç seçmezseniz Docker varsayılan arka uçtur. Ardından sandbox'lı oturumlarda hangi araçların kullanılabilir olduğunu `tools.sandbox.tools` ile kısıtlayın.

    Kurulum adımları + örnek yapılandırma: [Gruplar: kişisel DM'ler + herkese açık gruplar](/tr/channels/groups#pattern-personal-dms-public-groups-single-agent)

    Temel yapılandırma başvurusu: [Gateway yapılandırması](/tr/gateway/config-agents#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="Bir host klasörünü sandbox içine nasıl bağlarım?">
    `agents.defaults.sandbox.docker.binds` değerini `["host:path:mode"]` olarak ayarlayın (örn. `"/home/user/src:/src:ro"`). Global + agent başına bağlamalar birleştirilir; `scope: "shared"` olduğunda agent başına bağlamalar yok sayılır. Hassas olan her şey için `:ro` kullanın ve bağlamaların sandbox dosya sistemi duvarlarını atlattığını unutmayın.

    OpenClaw, bağlama kaynaklarını hem normalleştirilmiş yola hem de mevcut en derin üst dizin üzerinden çözümlenen kanonik yola göre doğrular. Bu, son yol segmenti henüz mevcut olmadığında bile sembolik bağlantı üst dizini kaçışlarının kapalı şekilde başarısız olacağı ve izinli kök kontrollerinin sembolik bağlantı çözümlemesinden sonra da uygulanacağı anlamına gelir.

    Örnekler ve güvenlik notları için bkz. [Sandbox kullanımı](/tr/gateway/sandboxing#custom-bind-mounts) ve [Sandbox ve Araç Politikası ve Yükseltilmiş](/tr/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check).

  </Accordion>

  <Accordion title="Bellek nasıl çalışır?">
    OpenClaw belleği, agent çalışma alanındaki Markdown dosyalarından ibarettir:

    - `memory/YYYY-MM-DD.md` içinde günlük notlar
    - `MEMORY.md` içinde seçilmiş uzun vadeli notlar (yalnızca ana/özel oturumlar)

    OpenClaw ayrıca modele otomatik Compaction öncesinde kalıcı notlar yazmasını
    hatırlatmak için **sessiz Compaction öncesi bellek boşaltma** çalıştırır. Bu yalnızca çalışma alanı
    yazılabilir olduğunda çalışır (salt okunur sandbox'lar bunu atlar). Bkz. [Bellek](/tr/concepts/memory).

  </Accordion>

  <Accordion title="Bellek bazı şeyleri unutmaya devam ediyor. Kalıcı olmasını nasıl sağlarım?">
    Bot'tan **gerçeği belleğe yazmasını** isteyin. Uzun vadeli notlar `MEMORY.md`
    içine, kısa vadeli bağlam `memory/YYYY-MM-DD.md` içine girer.

    Bu hâlâ iyileştirmekte olduğumuz bir alan. Modele anıları saklamasını hatırlatmak yardımcı olur;
    ne yapacağını bilir. Unutmaya devam ederse Gateway'in her çalıştırmada aynı
    çalışma alanını kullandığını doğrulayın.

    Belgeler: [Bellek](/tr/concepts/memory), [Agent çalışma alanı](/tr/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Bellek sonsuza kadar kalıcı mı? Sınırlar nelerdir?">
    Bellek dosyaları diskte yaşar ve siz silene kadar kalıcıdır. Sınır model değil,
    depolama alanınızdır. **Oturum bağlamı** yine de model bağlam penceresiyle
    sınırlıdır, bu nedenle uzun konuşmalar sıkıştırılabilir veya kırpılabilir. Bu yüzden
    bellek araması vardır - yalnızca ilgili parçaları bağlama geri çeker.

    Belgeler: [Bellek](/tr/concepts/memory), [Bağlam](/tr/concepts/context).

  </Accordion>

  <Accordion title="Anlamsal bellek araması OpenAI API anahtarı gerektirir mi?">
    Yalnızca **OpenAI embeddings** kullanıyorsanız. Codex OAuth sohbet/tamamlamaları kapsar ve
    embeddings erişimi **vermez**, bu yüzden **Codex ile oturum açmak (OAuth veya
    Codex CLI login)** anlamsal bellek araması için yardımcı olmaz. OpenAI embeddings
    yine de gerçek bir API anahtarı gerektirir (`OPENAI_API_KEY` veya `models.providers.openai.apiKey`).

    Açıkça bir sağlayıcı ayarlamazsanız, OpenClaw bir API anahtarını çözümleyebildiğinde
    otomatik olarak bir sağlayıcı seçer (auth profiles, `models.providers.*.apiKey` veya env vars).
    Bir OpenAI anahtarı çözümlenirse OpenAI'ı tercih eder; aksi halde bir Gemini anahtarı
    çözümlenirse Gemini'yi, ardından Voyage'ı, sonra Mistral'i tercih eder. Uzak anahtar yoksa,
    siz yapılandırana kadar bellek araması devre dışı kalır. Yapılandırılmış ve mevcut
    bir yerel model yolunuz varsa, OpenClaw
    `local` tercih eder. Ollama, açıkça
    `memorySearch.provider = "ollama"` ayarladığınızda desteklenir.

    Yerelde kalmayı tercih ederseniz, `memorySearch.provider = "local"` ayarlayın (ve isteğe bağlı olarak
    `memorySearch.fallback = "none"`). Gemini embeddings istiyorsanız,
    `memorySearch.provider = "gemini"` ayarlayın ve `GEMINI_API_KEY` (veya
    `memorySearch.remote.apiKey`) sağlayın. **OpenAI, Gemini, Voyage, Mistral, Ollama veya yerel** embedding
    modellerini destekliyoruz - kurulum ayrıntıları için [Bellek](/tr/concepts/memory) bölümüne bakın.

  </Accordion>
</AccordionGroup>

## Öğelerin diskte bulunduğu yer

<AccordionGroup>
  <Accordion title="OpenClaw ile kullanılan tüm veriler yerel olarak mı kaydedilir?">
    Hayır - **OpenClaw'un durumu yereldir**, ancak **dış hizmetler yine de onlara gönderdiğiniz şeyleri görür**.

    - **Varsayılan olarak yerel:** oturumlar, bellek dosyaları, yapılandırma ve çalışma alanı Gateway ana bilgisayarında bulunur
      (`~/.openclaw` + çalışma alanı dizininiz).
    - **Zorunlu olarak uzak:** model sağlayıcılarına (Anthropic/OpenAI/vb.) gönderdiğiniz iletiler
      onların API'lerine gider ve sohbet platformları (WhatsApp/Telegram/Slack/vb.) ileti verilerini
      kendi sunucularında saklar.
    - **Kapsamı siz denetlersiniz:** yerel modeller kullanmak istemleri makinenizde tutar, ancak kanal
      trafiği yine de kanalın sunucularından geçer.

    İlgili: [Aracı çalışma alanı](/tr/concepts/agent-workspace), [Bellek](/tr/concepts/memory).

  </Accordion>

  <Accordion title="OpenClaw verilerini nerede saklar?">
    Her şey `$OPENCLAW_STATE_DIR` altında bulunur (varsayılan: `~/.openclaw`):

    | Yol                                                             | Amaç                                                               |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | Ana yapılandırma (JSON5)                                           |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | Eski OAuth içe aktarımı (ilk kullanımda auth profiles içine kopyalanır) |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | Auth profiles (OAuth, API anahtarları ve isteğe bağlı `keyRef`/`tokenRef`) |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | `file` SecretRef sağlayıcıları için isteğe bağlı dosya destekli gizli yük |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | Eski uyumluluk dosyası (statik `api_key` girdileri temizlenir)     |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | Sağlayıcı durumu (örn. `whatsapp/<accountId>/creds.json`)          |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | Aracı başına durum (agentDir + oturumlar)                          |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | Konuşma geçmişi ve durum (aracı başına)                            |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | Oturum meta verileri (aracı başına)                                |

    Eski tek aracılı yol: `~/.openclaw/agent/*` (`openclaw doctor` tarafından geçirilir).

    **Çalışma alanınız** (AGENTS.md, bellek dosyaları, skills, vb.) ayrıdır ve `agents.defaults.workspace` üzerinden yapılandırılır (varsayılan: `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title="AGENTS.md / SOUL.md / USER.md / MEMORY.md nerede bulunmalı?">
    Bu dosyalar `~/.openclaw` içinde değil, **aracı çalışma alanında** bulunur.

    - **Çalışma alanı (aracı başına)**: `AGENTS.md`, `SOUL.md`, `IDENTITY.md`, `USER.md`,
      `MEMORY.md`, `memory/YYYY-MM-DD.md`, isteğe bağlı `HEARTBEAT.md`.
      Küçük harfli kök `memory.md` yalnızca eski onarım girdisidir; `openclaw doctor --fix`
      her iki dosya da mevcut olduğunda bunu `MEMORY.md` içine birleştirebilir.
    - **Durum dizini (`~/.openclaw`)**: yapılandırma, kanal/sağlayıcı durumu, auth profiles, oturumlar, günlükler
      ve paylaşılan skills (`~/.openclaw/skills`).

    Varsayılan çalışma alanı `~/.openclaw/workspace` olup şu şekilde yapılandırılabilir:

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    Bot bir yeniden başlatmadan sonra "unutuyorsa", Gateway'in her başlatmada aynı
    çalışma alanını kullandığını doğrulayın (ve unutmayın: uzak mod **gateway ana bilgisayarının**
    çalışma alanını kullanır, yerel dizüstü bilgisayarınızınkini değil).

    İpucu: kalıcı bir davranış veya tercih istiyorsanız, sohbet geçmişine güvenmek yerine bottan bunu
    **AGENTS.md veya MEMORY.md içine yazmasını** isteyin.

    Bkz. [Aracı çalışma alanı](/tr/concepts/agent-workspace) ve [Bellek](/tr/concepts/memory).

  </Accordion>

  <Accordion title="Önerilen yedekleme stratejisi">
    **Aracı çalışma alanınızı** **özel** bir git deposuna koyun ve özel bir yere
    yedekleyin (örneğin GitHub private). Bu, bellek + AGENTS/SOUL/USER
    dosyalarını yakalar ve asistanın "zihnini" daha sonra geri yüklemenizi sağlar.

    `~/.openclaw` altındaki hiçbir şeyi commit etmeyin (kimlik bilgileri, oturumlar, tokenlar veya şifrelenmiş gizli yükler).
    Tam geri yükleme gerekiyorsa, çalışma alanını ve durum dizinini
    ayrı ayrı yedekleyin (yukarıdaki geçiş sorusuna bakın).

    Dokümanlar: [Aracı çalışma alanı](/tr/concepts/agent-workspace).

  </Accordion>

  <Accordion title="OpenClaw'u tamamen nasıl kaldırırım?">
    Özel kılavuza bakın: [Kaldırma](/tr/install/uninstall).
  </Accordion>

  <Accordion title="Aracılar çalışma alanı dışında çalışabilir mi?">
    Evet. Çalışma alanı **varsayılan cwd** ve bellek dayanağıdır, katı bir sandbox değildir.
    Göreli yollar çalışma alanı içinde çözümlenir, ancak mutlak yollar sandboxing etkinleştirilmediği sürece diğer
    ana bilgisayar konumlarına erişebilir. Yalıtım gerekiyorsa
    [`agents.defaults.sandbox`](/tr/gateway/sandboxing) veya aracı başına sandbox ayarlarını kullanın. Bir deponun varsayılan çalışma dizini olmasını
    istiyorsanız, o aracının `workspace` değerini depo köküne yönlendirin. OpenClaw deposu yalnızca kaynak koddur; aracının kasıtlı olarak onun içinde çalışmasını istemediğiniz sürece
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
    Oturum durumu **gateway ana bilgisayarına** aittir. Uzak moddaysanız, önem verdiğiniz oturum deposu yerel dizüstü bilgisayarınızda değil, uzak makinededir. Bkz. [Oturum yönetimi](/tr/concepts/session).
  </Accordion>
</AccordionGroup>

## Yapılandırma temelleri

<AccordionGroup>
  <Accordion title="Yapılandırma hangi biçimdedir? Nerede bulunur?">
    OpenClaw isteğe bağlı **JSON5** yapılandırmasını `$OPENCLAW_CONFIG_PATH` konumundan okur (varsayılan: `~/.openclaw/openclaw.json`):

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    Dosya yoksa, güvenli sayılabilecek varsayılanları kullanır (`~/.openclaw/workspace` varsayılan çalışma alanı dahil).

  </Accordion>

  <Accordion title='gateway.bind: "lan" (veya "tailnet") ayarladım ve artık hiçbir şey dinlemiyor / UI yetkisiz diyor'>
    local loopback olmayan bind'ler **geçerli bir gateway auth yolu gerektirir**. Pratikte bu şu anlama gelir:

    - paylaşılan gizli auth: token veya parola
    - doğru yapılandırılmış kimlik farkındalıklı reverse proxy arkasında `gateway.auth.mode: "trusted-proxy"`

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
    - Yerel çağrı yolları, yalnızca `gateway.auth.*` ayarlanmamışsa `gateway.remote.*` değerini fallback olarak kullanabilir.
    - Parola auth için bunun yerine `gateway.auth.mode: "password"` ile birlikte `gateway.auth.password` (veya `OPENCLAW_GATEWAY_PASSWORD`) ayarlayın.
    - `gateway.auth.token` / `gateway.auth.password` SecretRef üzerinden açıkça yapılandırılmış ve çözümlenmemişse, çözümleme güvenli şekilde kapalı kalır (remote fallback maskelemesi olmaz).
    - Paylaşılan gizli Control UI kurulumları `connect.params.auth.token` veya `connect.params.auth.password` (app/UI ayarlarında saklanır) üzerinden kimlik doğrular. Tailscale Serve veya `trusted-proxy` gibi kimlik taşıyan modlar bunun yerine istek üstbilgilerini kullanır. Paylaşılan gizli değerleri URL'lere koymaktan kaçının.
    - `gateway.auth.mode: "trusted-proxy"` ile aynı ana bilgisayardaki loopback reverse proxy'ler açık `gateway.auth.trustedProxy.allowLoopback = true` ve `gateway.trustedProxies` içinde bir loopback girdisi gerektirir.

  </Accordion>

  <Accordion title="Neden artık localhost üzerinde bir token gerekiyor?">
    OpenClaw gateway auth'u local loopback dahil varsayılan olarak zorunlu kılar. Normal varsayılan yolda bu token auth anlamına gelir: açık bir auth yolu yapılandırılmamışsa, gateway başlangıcı token moduna çözümlenir ve o başlangıç için yalnızca çalışma zamanında geçerli bir token üretir; bu yüzden **yerel WS istemcileri kimlik doğrulamalıdır**. İstemcilerin yeniden başlatmalar arasında kararlı bir gizli değere ihtiyacı olduğunda `gateway.auth.token`, `gateway.auth.password`, `OPENCLAW_GATEWAY_TOKEN` veya `OPENCLAW_GATEWAY_PASSWORD` değerini açıkça yapılandırın. Bu, diğer yerel süreçlerin Gateway'i çağırmasını engeller.

    Farklı bir auth yolu tercih ediyorsanız, parola modunu (veya kimlik farkındalıklı reverse proxy'ler için `trusted-proxy`) açıkça seçebilirsiniz. **Gerçekten** açık loopback istiyorsanız, yapılandırmanızda `gateway.auth.mode: "none"` değerini açıkça ayarlayın. Doctor sizin için her zaman bir token üretebilir: `openclaw doctor --generate-gateway-token`.

  </Accordion>

  <Accordion title="Yapılandırmayı değiştirdikten sonra yeniden başlatmam gerekir mi?">
    Gateway yapılandırmayı izler ve hot-reload destekler:

    - `gateway.reload.mode: "hybrid"` (varsayılan): güvenli değişiklikleri hot-apply yapar, kritik olanlar için yeniden başlatır
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
    - Hiç banner istemiyorsanız, `OPENCLAW_HIDE_BANNER=1` env değerini ayarlayın.

  </Accordion>

  <Accordion title="Web aramasını (ve web getirmeyi) nasıl etkinleştiririm?">
    `web_fetch` API anahtarı olmadan çalışır. `web_search` seçtiğiniz
    sağlayıcıya bağlıdır:

    - Brave, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Perplexity ve Tavily gibi API destekli sağlayıcılar normal API anahtarı kurulumlarını gerektirir.
    - Ollama Web Search anahtar gerektirmez, ancak yapılandırılmış Ollama ana bilgisayarınızı kullanır ve `ollama signin` gerektirir.
    - DuckDuckGo anahtar gerektirmez, ancak resmi olmayan HTML tabanlı bir entegrasyondur.
    - SearXNG anahtar gerektirmez/kendi kendine barındırılır; `SEARXNG_BASE_URL` veya `plugins.entries.searxng.config.webSearch.baseUrl` yapılandırın.

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
    Eski `tools.web.search.*` sağlayıcı yolları uyumluluk için geçici olarak yüklenmeye devam eder, ancak yeni yapılandırmalarda kullanılmamalıdır.
    Firecrawl web getirme yedek yapılandırması `plugins.entries.firecrawl.config.webFetch.*` altında bulunur.

    Notlar:

    - İzin listeleri kullanıyorsanız `web_search`/`web_fetch`/`x_search` veya `group:web` ekleyin.
    - `web_fetch` varsayılan olarak etkindir (açıkça devre dışı bırakılmadıkça).
    - `tools.web.fetch.provider` atlanırsa OpenClaw, mevcut kimlik bilgilerinden ilk hazır getirme yedek sağlayıcısını otomatik algılar. Bugün paketlenen sağlayıcı Firecrawl'dır.
    - Arka plan programları ortam değişkenlerini `~/.openclaw/.env` dosyasından (veya hizmet ortamından) okur.

    Dokümanlar: [Web araçları](/tr/tools/web).

  </Accordion>

  <Accordion title="config.apply yapılandırmamı sildi. Nasıl kurtarır ve bunu önlerim?">
    `config.apply` **tüm yapılandırmayı** değiştirir. Kısmi bir nesne gönderirseniz diğer
    her şey kaldırılır.

    Geçerli OpenClaw birçok yanlışlıkla yapılan ezmeye karşı koruma sağlar:

    - OpenClaw'a ait yapılandırma yazımları, yazmadan önce değişiklik sonrası tüm yapılandırmayı doğrular.
    - Geçersiz veya yıkıcı OpenClaw'a ait yazımlar reddedilir ve `openclaw.json.rejected.*` olarak kaydedilir.
    - Doğrudan bir düzenleme başlatmayı veya sıcak yeniden yüklemeyi bozarsa Gateway kapalı başarısız olur veya yeniden yüklemeyi atlar; `openclaw.json` dosyasını yeniden yazmaz.
    - `openclaw doctor --fix` onarımdan sorumludur ve reddedilen dosyayı `openclaw.json.clobbered.*` olarak kaydederken bilinen son iyi durumu geri yükleyebilir.

    Kurtarma:

    - `Invalid config at`, `Config write rejected:` veya `config reload skipped (invalid config)` için `openclaw logs --follow` çıktısını kontrol edin.
    - Etkin yapılandırmanın yanındaki en yeni `openclaw.json.clobbered.*` veya `openclaw.json.rejected.*` dosyasını inceleyin.
    - `openclaw config validate` ve `openclaw doctor --fix` çalıştırın.
    - Yalnızca amaçlanan anahtarları `openclaw config set` veya `config.patch` ile geri kopyalayın.
    - Bilinen son iyi yapılandırmanız veya reddedilmiş yükünüz yoksa yedekten geri yükleyin ya da `openclaw doctor` komutunu yeniden çalıştırıp kanalları/modelleri yeniden yapılandırın.
    - Bu beklenmedikse bir hata bildirin ve bilinen son yapılandırmanızı veya varsa herhangi bir yedeği ekleyin.
    - Yerel bir kodlama ajanı çoğu zaman günlüklerden veya geçmişten çalışan bir yapılandırmayı yeniden oluşturabilir.

    Önleme:

    - Küçük değişiklikler için `openclaw config set` kullanın.
    - Etkileşimli düzenlemeler için `openclaw configure` kullanın.
    - Tam bir yol veya alan şekli konusunda emin değilseniz önce `config.schema.lookup` kullanın; derinlemesine inceleme için sığ bir şema düğümü ve hemen altındaki çocuk özetlerini döndürür.
    - Kısmi RPC düzenlemeleri için `config.patch` kullanın; `config.apply` komutunu yalnızca tam yapılandırma değişimi için saklayın.
    - Bir ajan çalıştırmasından yalnızca sahibin kullanabildiği `gateway` aracını kullanıyorsanız araç yine de `tools.exec.ask` / `tools.exec.security` yollarına yazımları reddeder (aynı korumalı exec yollarına normalize edilen eski `tools.bash.*` takma adları dahil).

    Dokümanlar: [Yapılandırma](/tr/cli/config), [Yapılandır](/tr/cli/configure), [Gateway sorun giderme](/tr/gateway/troubleshooting#gateway-rejected-invalid-config), [Doctor](/tr/gateway/doctor).

  </Accordion>

  <Accordion title="Cihazlar arasında uzmanlaşmış çalışanlarla merkezi bir Gateway nasıl çalıştırırım?">
    Yaygın kalıp **bir Gateway** (örn. Raspberry Pi) artı **düğümler** ve **ajanlar** şeklindedir:

    - **Gateway (merkezi):** kanalları (Signal/WhatsApp), yönlendirmeyi ve oturumları yönetir.
    - **Düğümler (cihazlar):** Mac/iOS/Android çevre birimleri olarak bağlanır ve yerel araçları (`system.run`, `canvas`, `camera`) sunar.
    - **Ajanlar (çalışanlar):** özel roller için ayrı beyinler/çalışma alanlarıdır (örn. "Hetzner operasyonları", "Kişisel veriler").
    - **Alt ajanlar:** paralellik istediğinizde ana ajandan arka plan işi başlatır.
    - **TUI:** Gateway'e bağlanır ve ajanlar/oturumlar arasında geçiş yapar.

    Dokümanlar: [Düğümler](/tr/nodes), [Uzaktan erişim](/tr/gateway/remote), [Çok Ajanlı Yönlendirme](/tr/concepts/multi-agent), [Alt ajanlar](/tr/tools/subagents), [TUI](/tr/web/tui).

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

    Varsayılan `false` (görünür pencereli) değeridir. Headless, bazı sitelerde bot karşıtı kontrolleri tetiklemeye daha yatkındır. Bkz. [Tarayıcı](/tr/tools/browser).

    Headless **aynı Chromium motorunu** kullanır ve çoğu otomasyon için çalışır (formlar, tıklamalar, kazıma, oturum açmalar). Başlıca farklar:

    - Görünür tarayıcı penceresi yoktur (görsellere ihtiyacınız varsa ekran görüntülerini kullanın).
    - Bazı siteler headless modda otomasyona karşı daha katıdır (CAPTCHA'lar, bot karşıtı önlemler).
      Örneğin X/Twitter çoğu zaman headless oturumları engeller.

  </Accordion>

  <Accordion title="Tarayıcı denetimi için Brave'i nasıl kullanırım?">
    `browser.executablePath` değerini Brave ikili dosyanıza (veya Chromium tabanlı herhangi bir tarayıcıya) ayarlayın ve Gateway'i yeniden başlatın.
    Tam yapılandırma örnekleri için [Tarayıcı](/tr/tools/browser#use-brave-or-another-chromium-based-browser) bölümüne bakın.
  </Accordion>
</AccordionGroup>

## Uzak Gateway'ler ve düğümler

<AccordionGroup>
  <Accordion title="Komutlar Telegram, gateway ve düğümler arasında nasıl yayılır?">
    Telegram mesajları **gateway** tarafından işlenir. Gateway ajanı çalıştırır ve
    ancak bir düğüm aracı gerektiğinde **Gateway WebSocket** üzerinden düğümleri çağırır:

    Telegram → Gateway → Ajan → `node.*` → Düğüm → Gateway → Telegram

    Düğümler gelen sağlayıcı trafiğini görmez; yalnızca düğüm RPC çağrılarını alırlar.

  </Accordion>

  <Accordion title="Gateway uzakta barındırılıyorsa ajanım bilgisayarıma nasıl erişebilir?">
    Kısa yanıt: **bilgisayarınızı düğüm olarak eşleyin**. Gateway başka bir yerde çalışır, ancak Gateway WebSocket üzerinden yerel makinenizdeki `node.*` araçlarını (ekran, kamera, sistem) çağırabilir.

    Tipik kurulum:

    1. Gateway'i her zaman açık ana makinede (VPS/ev sunucusu) çalıştırın.
    2. Gateway ana makinesini ve bilgisayarınızı aynı tailnet'e koyun.
    3. Gateway WS'nin erişilebilir olduğundan emin olun (tailnet bağlama veya SSH tüneli).
    4. macOS uygulamasını yerel olarak açın ve düğüm olarak kaydolabilmesi için **SSH üzerinden Uzak** modunda (veya doğrudan tailnet ile) bağlanın.
    5. Gateway üzerinde düğümü onaylayın:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Ayrı bir TCP köprüsü gerekmez; düğümler Gateway WebSocket üzerinden bağlanır.

    Güvenlik hatırlatması: bir macOS düğümünü eşlemek, o makinede `system.run` çalıştırılmasına izin verir. Yalnızca
    güvendiğiniz cihazları eşleyin ve [Güvenlik](/tr/gateway/security) bölümünü inceleyin.

    Dokümanlar: [Düğümler](/tr/nodes), [Gateway protokolü](/tr/gateway/protocol), [macOS uzak modu](/tr/platforms/mac/remote), [Güvenlik](/tr/gateway/security).

  </Accordion>

  <Accordion title="Tailscale bağlı ama yanıt alamıyorum. Şimdi ne yapmalıyım?">
    Temel noktaları kontrol edin:

    - Gateway çalışıyor: `openclaw gateway status`
    - Gateway sağlığı: `openclaw status`
    - Kanal sağlığı: `openclaw channels status`

    Ardından kimlik doğrulamayı ve yönlendirmeyi doğrulayın:

    - Tailscale Serve kullanıyorsanız `gateway.auth.allowTailscale` değerinin doğru ayarlandığından emin olun.
    - SSH tüneliyle bağlanıyorsanız yerel tünelin açık olduğunu ve doğru bağlantı noktasını işaret ettiğini doğrulayın.
    - İzin listelerinizin (DM veya grup) hesabınızı içerdiğini doğrulayın.

    Dokümanlar: [Tailscale](/tr/gateway/tailscale), [Uzaktan erişim](/tr/gateway/remote), [Kanallar](/tr/channels).

  </Accordion>

  <Accordion title="İki OpenClaw örneği birbiriyle konuşabilir mi (yerel + VPS)?">
    Evet. Yerleşik bir "botlar arası" köprü yoktur, ancak bunu birkaç
    güvenilir yolla bağlayabilirsiniz:

    **En basit:** her iki botun da erişebildiği normal bir sohbet kanalı kullanın (Telegram/Slack/WhatsApp).
    Bot A'nın Bot B'ye mesaj göndermesini sağlayın, ardından Bot B'nin her zamanki gibi yanıtlamasına izin verin.

    **CLI köprüsü (genel):** diğer botun
    dinlediği bir sohbeti hedefleyerek diğer Gateway'i `openclaw agent --message ... --deliver` ile çağıran bir betik çalıştırın. Bir bot uzak bir VPS üzerindeyse CLI'nizi SSH/Tailscale üzerinden o uzak Gateway'e yönlendirin (bkz. [Uzaktan erişim](/tr/gateway/remote)).

    Örnek kalıp (hedef Gateway'e erişebilen bir makineden çalıştırın):

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    İpucu: iki botun sonsuz döngüye girmemesi için bir koruma kuralı ekleyin (yalnızca bahsetmeyle yanıt, kanal
    izin listeleri veya "bot mesajlarına yanıt verme" kuralı).

    Dokümanlar: [Uzaktan erişim](/tr/gateway/remote), [Ajan CLI](/tr/cli/agent), [Ajan gönderimi](/tr/tools/agent-send).

  </Accordion>

  <Accordion title="Birden fazla ajan için ayrı VPS'lere ihtiyacım var mı?">
    Hayır. Bir Gateway birden fazla ajanı barındırabilir; her birinin kendi çalışma alanı, model varsayılanları
    ve yönlendirmesi olabilir. Normal kurulum budur ve ajan başına bir VPS çalıştırmaktan çok daha ucuz ve basittir.

    Ayrı VPS'leri yalnızca güçlü yalıtıma (güvenlik sınırları) veya paylaşmak istemediğiniz çok
    farklı yapılandırmalara ihtiyacınız olduğunda kullanın. Aksi halde tek Gateway kullanın ve
    birden fazla ajan veya alt ajan kullanın.

  </Accordion>

  <Accordion title="VPS'den SSH kullanmak yerine kişisel dizüstü bilgisayarımda düğüm kullanmanın bir faydası var mı?">
    Evet - düğümler uzak bir Gateway'den dizüstü bilgisayarınıza erişmenin birinci sınıf yoludur ve yalnızca
    kabuk erişiminden fazlasını açığa çıkarır. Gateway macOS/Linux üzerinde (Windows'ta WSL2 üzerinden) çalışır ve
    hafiftir (küçük bir VPS veya Raspberry Pi sınıfı kutu yeterlidir; 4 GB RAM fazlasıyla yeterlidir), bu yüzden yaygın
    kurulum her zaman açık bir ana makine artı düğüm olarak dizüstü bilgisayarınızdır.

    - **Gelen SSH gerekmez.** Düğümler Gateway WebSocket'e dışarı doğru bağlanır ve cihaz eşlemeyi kullanır.
    - **Daha güvenli yürütme denetimleri.** `system.run`, o dizüstü bilgisayardaki düğüm izin listeleri/onaylarıyla denetlenir.
    - **Daha fazla cihaz aracı.** Düğümler `system.run` yanında `canvas`, `camera` ve `screen` sunar.
    - **Yerel tarayıcı otomasyonu.** Gateway'i VPS üzerinde tutun, ancak Chrome'u dizüstü bilgisayardaki bir düğüm ana makinesi üzerinden yerel olarak çalıştırın veya Chrome MCP üzerinden ana makinedeki yerel Chrome'a bağlanın.

    SSH geçici kabuk erişimi için uygundur, ancak düğümler sürekli ajan iş akışları ve
    cihaz otomasyonu için daha basittir.

    Dokümanlar: [Düğümler](/tr/nodes), [Düğümler CLI](/tr/cli/nodes), [Tarayıcı](/tr/tools/browser).

  </Accordion>

  <Accordion title="Düğümler gateway hizmeti çalıştırır mı?">
    Hayır. Bilerek yalıtılmış profiller çalıştırmıyorsanız ana makine başına yalnızca **bir gateway** çalışmalıdır (bkz. [Birden fazla gateway](/tr/gateway/multiple-gateways)). Düğümler gateway'e bağlanan çevre birimleridir
    (iOS/Android düğümleri veya menü çubuğu uygulamasında macOS "düğüm modu"). Headless düğüm
    ana makineleri ve CLI denetimi için bkz. [Düğüm ana makinesi CLI](/tr/cli/node).

    `gateway`, `discovery` ve barındırılan Plugin yüzeyi değişiklikleri için tam yeniden başlatma gerekir.

  </Accordion>

  <Accordion title="Yapılandırmayı uygulamak için bir API / RPC yolu var mı?">
    Evet.

    - `config.schema.lookup`: yazmadan önce bir config alt ağacını sığ schema düğümü, eşleşen UI ipucu ve anlık alt özetlerle incele
    - `config.get`: geçerli anlık görüntüyü + hash'i getir
    - `config.patch`: güvenli kısmi güncelleme (çoğu RPC düzenlemesi için tercih edilir); mümkün olduğunda sıcak yeniden yükler, gerektiğinde yeniden başlatır
    - `config.apply`: tam config'i doğrula + değiştir; mümkün olduğunda sıcak yeniden yükler, gerektiğinde yeniden başlatır
    - Yalnızca owner'a açık `gateway` çalışma zamanı aracı hâlâ `tools.exec.ask` / `tools.exec.security` öğelerini yeniden yazmayı reddeder; eski `tools.bash.*` takma adları aynı korumalı exec yollarına normalize edilir

  </Accordion>

  <Accordion title="İlk kurulum için asgari makul config">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    Bu, workspace'inizi ayarlar ve botu kimlerin tetikleyebileceğini sınırlar.

  </Accordion>

  <Accordion title="Bir VPS üzerinde Tailscale'i nasıl kurarım ve Mac'imden nasıl bağlanırım?">
    Asgari adımlar:

    1. **VPS üzerinde kur + oturum aç**

       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```

    2. **Mac'inizde kur + oturum aç**
       - Tailscale uygulamasını kullanın ve aynı tailnet'e giriş yapın.
    3. **MagicDNS'i etkinleştirin (önerilir)**
       - Tailscale yönetici konsolunda MagicDNS'i etkinleştirin; böylece VPS kararlı bir ada sahip olur.
    4. **tailnet ana makine adını kullanın**
       - SSH: `ssh user@your-vps.tailnet-xxxx.ts.net`
       - Gateway WS: `ws://your-vps.tailnet-xxxx.ts.net:18789`

    SSH olmadan Control UI istiyorsanız VPS üzerinde Tailscale Serve kullanın:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Bu, gateway'in loopback'e bağlı kalmasını sağlar ve HTTPS'i Tailscale üzerinden sunar. Bkz. [Tailscale](/tr/gateway/tailscale).

  </Accordion>

  <Accordion title="Bir Mac node'unu uzak Gateway'e (Tailscale Serve) nasıl bağlarım?">
    Serve, **Gateway Control UI + WS**'yi sunar. Node'lar aynı Gateway WS endpoint'i üzerinden bağlanır.

    Önerilen kurulum:

    1. **VPS + Mac'in aynı tailnet'te olduğundan emin olun**.
    2. **macOS uygulamasını Remote modda kullanın** (SSH hedefi tailnet ana makine adı olabilir).
       Uygulama Gateway portunu tüneller ve bir node olarak bağlanır.
    3. **Node'u** gateway üzerinde onaylayın:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Dokümanlar: [Gateway protokolü](/tr/gateway/protocol), [Keşif](/tr/gateway/discovery), [macOS uzak modu](/tr/platforms/mac/remote).

  </Accordion>

  <Accordion title="İkinci bir dizüstü bilgisayara kurmalı mıyım yoksa sadece bir node mu eklemeliyim?">
    İkinci dizüstü bilgisayarda yalnızca **local tools** (ekran/kamera/exec) gerekiyorsa, onu bir
    **node** olarak ekleyin. Bu, tek bir Gateway tutar ve yinelenen config'i önler. Yerel node araçları
    şu anda yalnızca macOS içindir, ancak bunları diğer işletim sistemlerine genişletmeyi planlıyoruz.

    İkinci bir Gateway'i yalnızca **sert yalıtım** veya tamamen ayrı iki bot gerektiğinde kurun.

    Dokümanlar: [Node'lar](/tr/nodes), [Node CLI](/tr/cli/nodes), [Birden çok gateway](/tr/gateway/multiple-gateways).

  </Accordion>
</AccordionGroup>

## Env var'lar ve .env yükleme

<AccordionGroup>
  <Accordion title="OpenClaw ortam değişkenlerini nasıl yükler?">
    OpenClaw env var'ları üst süreçten (shell, launchd/systemd, CI vb.) okur ve ayrıca şunları yükler:

    - geçerli çalışma dizininden `.env`
    - `~/.openclaw/.env` konumundan global yedek `.env` (diğer adıyla `$OPENCLAW_STATE_DIR/.env`)

    Hiçbir `.env` dosyası mevcut env var'ları geçersiz kılmaz.

    Config içinde satır içi env var'lar da tanımlayabilirsiniz (yalnızca process env'de eksikse uygulanır):

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

  <Accordion title="Gateway'i servis üzerinden başlattım ve env var'larım kayboldu. Şimdi ne yapmalıyım?">
    İki yaygın çözüm:

    1. Eksik anahtarları `~/.openclaw/.env` içine koyun; böylece servis shell env'nizi devralmadığında bile alınırlar.
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

    Bu, login shell'inizi çalıştırır ve yalnızca eksik beklenen anahtarları içe aktarır (asla geçersiz kılmaz). Env var eşdeğerleri:
    `OPENCLAW_LOAD_SHELL_ENV=1`, `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`.

  </Accordion>

  <Accordion title='COPILOT_GITHUB_TOKEN ayarladım, ancak models status "Shell env: off." gösteriyor. Neden?'>
    `openclaw models status`, **shell env import**'un etkin olup olmadığını bildirir. "Shell env: off"
    env var'larınızın eksik olduğu anlamına **gelmez** - yalnızca OpenClaw'ın
    login shell'inizi otomatik olarak yüklemeyeceği anlamına gelir.

    Gateway bir servis (launchd/systemd) olarak çalışıyorsa shell
    ortamınızı devralmaz. Şunlardan birini yaparak düzeltin:

    1. Token'ı `~/.openclaw/.env` içine koyun:

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. Veya shell içe aktarmayı etkinleştirin (`env.shellEnv.enabled: true`).
    3. Veya config `env` bloğunuza ekleyin (yalnızca eksikse uygulanır).

    Sonra gateway'i yeniden başlatın ve tekrar kontrol edin:

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

  <Accordion title="Hiç /new göndermezsem oturumlar otomatik olarak sıfırlanır mı?">
    Oturumlar `session.idleMinutes` sonrasında sona erebilir, ancak bu **varsayılan olarak devre dışıdır** (varsayılan **0**).
    Boşta sona ermeyi etkinleştirmek için pozitif bir değere ayarlayın. Etkinleştirildiğinde, boşta geçen süreden sonraki **sonraki**
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

  <Accordion title="OpenClaw instance'larından oluşan bir ekip (bir CEO ve çok sayıda agent) oluşturmanın bir yolu var mı?">
    Evet, **multi-agent routing** ve **sub-agents** aracılığıyla. Kendi workspace'leri ve modelleri olan bir coordinator
    agent ve birkaç worker agent oluşturabilirsiniz.

    Bununla birlikte, bu en iyi **eğlenceli bir deney** olarak görülür. Token açısından ağırdır ve çoğu zaman
    ayrı oturumlarla tek bir bot kullanmaktan daha az verimlidir. Öngördüğümüz tipik model,
    konuştuğunuz tek bir bot ve paralel işler için farklı oturumlardır. Bu
    bot gerektiğinde sub-agents da oluşturabilir.

    Dokümanlar: [Multi-agent routing](/tr/concepts/multi-agent), [Sub-agents](/tr/tools/subagents), [Agents CLI](/tr/cli/agents).

  </Accordion>

  <Accordion title="Bağlam neden görevin ortasında kırpıldı? Bunu nasıl önlerim?">
    Oturum bağlamı model penceresiyle sınırlıdır. Uzun sohbetler, büyük tool output'ları veya çok sayıda
    dosya compaction ya da kırpmayı tetikleyebilir.

    Yardımcı olanlar:

    - Bottan geçerli durumu özetlemesini ve bir dosyaya yazmasını isteyin.
    - Uzun görevlerden önce `/compact`, konu değiştirirken `/new` kullanın.
    - Önemli bağlamı workspace'te tutun ve bottan geri okumasını isteyin.
    - Ana sohbetin daha küçük kalması için uzun veya paralel işlerde sub-agents kullanın.
    - Bu sık oluyorsa daha büyük bağlam penceresine sahip bir model seçin.

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

    Sonra kurulumu yeniden çalıştırın:

    ```bash
    openclaw onboard --install-daemon
    ```

    Notlar:

    - Onboarding mevcut bir config görürse **Reset** de sunar. Bkz. [Onboarding (CLI)](/tr/start/wizard).
    - Profiller kullandıysanız (`--profile` / `OPENCLAW_PROFILE`), her state dir'i sıfırlayın (varsayılanlar `~/.openclaw-<profile>`).
    - Dev reset: `openclaw gateway --dev --reset` (yalnızca dev; dev config + credentials + sessions + workspace'i siler).

  </Accordion>

  <Accordion title='"context too large" hataları alıyorum - nasıl resetlerim veya compact yaparım?'>
    Şunlardan birini kullanın:

    - **Compact** (konuşmayı tutar ancak eski dönüşleri özetler):

      ```
      /compact
      ```

      veya özeti yönlendirmek için `/compact <instructions>`.

    - **Reset** (aynı sohbet anahtarı için taze session ID):

      ```
      /new
      /reset
      ```

    Devam ederse:

    - Eski tool output'u kırpmak için **session pruning**'i (`agents.defaults.contextPruning`) etkinleştirin veya ayarlayın.
    - Daha büyük bağlam penceresine sahip bir model kullanın.

    Dokümanlar: [Compaction](/tr/concepts/compaction), [Session pruning](/tr/concepts/session-pruning), [Oturum yönetimi](/tr/concepts/session).

  </Accordion>

  <Accordion title='"LLM request rejected: messages.content.tool_use.input field required" neden görüyorum?'>
    Bu bir sağlayıcı doğrulama hatasıdır: model, gerekli `input` olmadan bir `tool_use` bloğu yaydı.
    Bu genellikle oturum geçmişinin bayat veya bozuk olduğu anlamına gelir (çoğunlukla uzun thread'lerden
    ya da bir tool/schema değişikliğinden sonra).

    Düzeltme: `/new` ile taze bir oturum başlatın (bağımsız mesaj).

  </Accordion>

  <Accordion title="Neden her 30 dakikada bir heartbeat mesajları alıyorum?">
    Heartbeat'ler varsayılan olarak her **30m** çalışır (OAuth auth kullanırken **1h**). Bunları ayarlayın veya devre dışı bırakın:

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
    başlıkları), OpenClaw API çağrılarını tasarruf etmek için heartbeat çalıştırmasını atlar.
    Dosya eksikse heartbeat yine çalışır ve model ne yapılacağına karar verir.

    Agent başına geçersiz kılmalar `agents.list[].heartbeat` kullanır. Dokümanlar: [Heartbeat](/tr/gateway/heartbeat).

  </Accordion>

  <Accordion title='Bir WhatsApp grubuna "bot account" eklemem gerekiyor mu?'>
    Hayır. OpenClaw **kendi hesabınızda** çalışır, yani gruptaysanız OpenClaw onu görebilir.
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
    Seçenek 1 (en hızlı): logları tail edin ve grupta bir test mesajı gönderin:

    ```bash
    openclaw logs --follow --json
    ```

    `@g.us` ile biten `chatId`'yi (veya `from`) arayın, örneğin:
    `1234567890-1234567890@g.us`.

    Seçenek 2 (zaten yapılandırılmış/allowlist'e alınmışsa): grupları config'ten listeleyin:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    Dokümanlar: [WhatsApp](/tr/channels/whatsapp), [Directory](/tr/cli/directory), [Loglar](/tr/cli/logs).

  </Accordion>

  <Accordion title="OpenClaw neden bir grupta yanıt vermiyor?">
    İki yaygın neden:

    - Mention gating açık (varsayılan). Botu @mention etmelisiniz (veya `mentionPatterns` ile eşleşmelisiniz).
    - `channels.whatsapp.groups` yapılandırdınız ancak `"*"` yok ve grup allowlist'te değil.

    Bkz. [Gruplar](/tr/channels/groups) ve [Grup mesajları](/tr/channels/group-messages).

  </Accordion>

  <Accordion title="Gruplar/thread'ler DM'lerle bağlam paylaşır mı?">
    Doğrudan sohbetler varsayılan olarak ana oturuma katlanır. Grupların/kanalların kendi oturum anahtarları vardır; Telegram konuları / Discord thread'leri ayrı oturumlardır. Bkz. [Gruplar](/tr/channels/groups) ve [Grup mesajları](/tr/channels/group-messages).
  </Accordion>

  <Accordion title="Kaç çalışma alanı ve ajan oluşturabilirim?">
    Katı sınırlar yok. Onlarca, hatta yüzlercesi sorun değildir, ancak şunlara dikkat edin:

    - **Disk büyümesi:** oturumlar + dökümler `~/.openclaw/agents/<agentId>/sessions/` altında bulunur.
    - **Token maliyeti:** daha fazla ajan, daha fazla eşzamanlı model kullanımı demektir.
    - **Operasyon yükü:** ajan başına kimlik doğrulama profilleri, çalışma alanları ve kanal yönlendirme.

    İpuçları:

    - Her ajan için bir **etkin** çalışma alanı tutun (`agents.defaults.workspace`).
    - Disk büyürse eski oturumları temizleyin (JSONL veya store girdilerini silin).
    - Başıboş çalışma alanlarını ve profil uyuşmazlıklarını görmek için `openclaw doctor` kullanın.

  </Accordion>

  <Accordion title="Aynı anda birden fazla bot veya sohbet çalıştırabilir miyim (Slack) ve bunu nasıl ayarlamalıyım?">
    Evet. Birden fazla yalıtılmış ajan çalıştırmak ve gelen mesajları
    kanal/hesap/eş düzeyine göre yönlendirmek için **Çok Ajanlı Yönlendirme** kullanın. Slack kanal olarak desteklenir ve belirli ajanlara bağlanabilir.

    Tarayıcı erişimi güçlüdür, ancak "bir insanın yapabileceği her şeyi yapabilir" anlamına gelmez; bot önleme, CAPTCHA'lar ve MFA
    otomasyonu hâlâ engelleyebilir. En güvenilir tarayıcı denetimi için ana makinede yerel Chrome MCP kullanın
    veya tarayıcıyı gerçekten çalıştıran makinede CDP kullanın.

    En iyi uygulama kurulumu:

    - Her zaman açık Gateway ana makinesi (VPS/Mac mini).
    - Rol başına bir ajan (bağlamalar).
    - Bu ajanlara bağlı Slack kanal(lar)ı.
    - Gerektiğinde Chrome MCP veya bir düğüm üzerinden yerel tarayıcı.

    Belgeler: [Çok Ajanlı Yönlendirme](/tr/concepts/multi-agent), [Slack](/tr/channels/slack),
    [Tarayıcı](/tr/tools/browser), [Düğümler](/tr/nodes).

  </Accordion>
</AccordionGroup>

## Modeller, yük devri ve kimlik doğrulama profilleri

Model SSS — varsayılanlar, seçim, takma adlar, geçiş, yük devri, kimlik doğrulama profilleri —
[Modeller SSS](/tr/help/faq-models) sayfasında bulunur.

## Gateway: bağlantı noktaları, "zaten çalışıyor" ve uzak mod

<AccordionGroup>
  <Accordion title="Gateway hangi bağlantı noktasını kullanır?">
    `gateway.port`, WebSocket + HTTP (Denetim UI, hook'lar vb.) için tek çoklanan bağlantı noktasını denetler.

    Öncelik:

    ```
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > default 18789
    ```

  </Accordion>

  <Accordion title='openclaw gateway status neden "Runtime: running" ama "Connectivity probe: failed" diyor?'>
    Çünkü "running", **supervisor** görünümüdür (launchd/systemd/schtasks). Bağlantı probu ise CLI'nin gateway WebSocket'e gerçekten bağlanmasıdır.

    `openclaw gateway status` kullanın ve şu satırlara güvenin:

    - `Probe target:` (probun gerçekten kullandığı URL)
    - `Listening:` (bağlantı noktasında gerçekten neyin bağlı olduğu)
    - `Last gateway error:` (süreç canlıyken ama bağlantı noktası dinlemiyorken yaygın kök neden)

  </Accordion>

  <Accordion title='openclaw gateway status neden "Config (cli)" ve "Config (service)" değerlerini farklı gösteriyor?'>
    Hizmet başka bir yapılandırmayı çalıştırırken siz başka bir yapılandırma dosyasını düzenliyorsunuz (çoğunlukla `--profile` / `OPENCLAW_STATE_DIR` uyuşmazlığı).

    Düzeltme:

    ```bash
    openclaw gateway install --force
    ```

    Bunu, hizmetin kullanmasını istediğiniz aynı `--profile` / ortamdan çalıştırın.

  </Accordion>

  <Accordion title='"another gateway instance is already listening" ne anlama gelir?'>
    OpenClaw, başlangıçta WebSocket dinleyicisini hemen bağlayarak çalışma zamanı kilidi uygular (varsayılan `ws://127.0.0.1:18789`). Bağlama `EADDRINUSE` ile başarısız olursa, başka bir örneğin zaten dinlediğini belirten `GatewayLockError` fırlatır.

    Düzeltme: diğer örneği durdurun, bağlantı noktasını boşaltın veya `openclaw gateway --port <port>` ile çalıştırın.

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

    - `openclaw gateway` yalnızca `gateway.mode` `local` olduğunda (veya geçersiz kılma bayrağını verdiğinizde) başlar.
    - macOS uygulaması yapılandırma dosyasını izler ve bu değerler değiştiğinde modları canlı olarak değiştirir.
    - `gateway.remote.token` / `.password` yalnızca istemci tarafı uzak kimlik bilgileridir; kendi başlarına yerel gateway kimlik doğrulamasını etkinleştirmezler.

  </Accordion>

  <Accordion title='Denetim UI "unauthorized" diyor (veya yeniden bağlanmaya devam ediyor). Şimdi ne yapmalıyım?'>
    Gateway kimlik doğrulama yolunuz ve UI'nin kimlik doğrulama yöntemi eşleşmiyor.

    Gerçekler (koddan):

    - Denetim UI, token'ı geçerli tarayıcı sekmesi oturumu ve seçili gateway URL'si için `sessionStorage` içinde tutar; böylece aynı sekmede yenilemeler, uzun ömürlü localStorage token kalıcılığını geri yüklemeden çalışmaya devam eder.
    - `AUTH_TOKEN_MISMATCH` durumunda, güvenilir istemciler gateway yeniden deneme ipuçları döndürdüğünde (`canRetryWithDeviceToken=true`, `recommendedNextStep=retry_with_device_token`) önbelleğe alınmış cihaz token'ı ile sınırlı bir yeniden deneme yapabilir.
    - Bu önbelleğe alınmış token yeniden denemesi artık cihaz token'ı ile saklanan önbelleğe alınmış onaylı kapsamları yeniden kullanır. Açık `deviceToken` / açık `scopes` çağıranlar, önbelleğe alınmış kapsamları devralmak yerine istedikleri kapsam kümesini korumaya devam eder.
    - Bu yeniden deneme yolu dışında, bağlantı kimlik doğrulama önceliği önce açık paylaşılan token/parola, sonra açık `deviceToken`, sonra saklanan cihaz token'ı, sonra bootstrap token'dır.
    - Bootstrap token kapsam denetimleri rol öneklidir. Yerleşik bootstrap operatör izin listesi yalnızca operatör isteklerini karşılar; düğüm veya diğer operatör dışı rollerin yine de kendi rol önekleri altında kapsamlara ihtiyacı vardır.

    Düzeltme:

    - En hızlısı: `openclaw dashboard` (dashboard URL'sini yazdırır + kopyalar, açmayı dener; headless ise SSH ipucu gösterir).
    - Henüz token'ınız yoksa: `openclaw doctor --generate-gateway-token`.
    - Uzak ise önce tünel açın: `ssh -N -L 18789:127.0.0.1:18789 user@host` sonra `http://127.0.0.1:18789/` adresini açın.
    - Paylaşılan gizli mod: `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` veya `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` ayarlayın, ardından eşleşen gizli değeri Denetim UI ayarlarına yapıştırın.
    - Tailscale Serve modu: `gateway.auth.allowTailscale` etkin olduğundan ve Tailscale kimlik başlıklarını atlayan ham loopback/tailnet URL'si değil, Serve URL'sini açtığınızdan emin olun.
    - Güvenilir proxy modu: ham gateway URL'si değil, yapılandırılmış kimlik farkındalıklı proxy üzerinden geldiğinizden emin olun. Aynı ana makinedeki loopback proxy'leri için ayrıca `gateway.auth.trustedProxy.allowLoopback = true` gerekir.
    - Uyuşmazlık tek yeniden denemeden sonra sürerse, eşleştirilmiş cihaz token'ını döndürün/yeniden onaylayın:
      - `openclaw devices list`
      - `openclaw devices rotate --device <id> --role operator`
    - Bu döndürme çağrısı reddedildiğini söylüyorsa iki şeyi kontrol edin:
      - eşleştirilmiş cihaz oturumları yalnızca kendi **kendi** cihazlarını döndürebilir; `operator.admin` yetkileri de yoksa
      - açık `--scope` değerleri, çağıranın geçerli operatör kapsamlarını aşamaz
    - Hâlâ takıldınız mı? `openclaw status --all` çalıştırın ve [Sorun Giderme](/tr/gateway/troubleshooting) adımlarını izleyin. Kimlik doğrulama ayrıntıları için [Dashboard](/tr/web/dashboard) sayfasına bakın.

  </Accordion>

  <Accordion title="gateway.bind tailnet ayarladım ama bağlanamıyor ve hiçbir şey dinlemiyor">
    `tailnet` bağlaması, ağ arayüzlerinizden bir Tailscale IP'si seçer (100.64.0.0/10). Makine Tailscale üzerinde değilse (veya arayüz kapalıysa), bağlanacak bir şey yoktur.

    Düzeltme:

    - O ana makinede Tailscale'i başlatın (böylece 100.x adresi olur), veya
    - `gateway.bind: "loopback"` / `"lan"` değerine geçin.

    Not: `tailnet` açıktır. `auto` loopback'i tercih eder; yalnızca tailnet'e bağlanmak istediğinizde `gateway.bind: "tailnet"` kullanın.

  </Accordion>

  <Accordion title="Aynı ana makinede birden fazla Gateway çalıştırabilir miyim?">
    Genellikle hayır; tek bir Gateway birden fazla mesajlaşma kanalı ve ajan çalıştırabilir. Birden fazla Gateway'i yalnızca yedekliliğe (örn. kurtarma botu) veya sıkı yalıtıma ihtiyacınız olduğunda kullanın.

    Evet, ancak yalıtmanız gerekir:

    - `OPENCLAW_CONFIG_PATH` (örnek başına yapılandırma)
    - `OPENCLAW_STATE_DIR` (örnek başına durum)
    - `agents.defaults.workspace` (çalışma alanı yalıtımı)
    - `gateway.port` (benzersiz bağlantı noktaları)

    Hızlı kurulum (önerilir):

    - Her örnek için `openclaw --profile <name> ...` kullanın (`~/.openclaw-<name>` otomatik oluşturulur).
    - Her profil yapılandırmasında benzersiz bir `gateway.port` ayarlayın (veya manuel çalıştırmalar için `--port` verin).
    - Profil başına bir hizmet kurun: `openclaw --profile <name> gateway install`.

    Profiller hizmet adlarına da sonek ekler (`ai.openclaw.<profile>`; eski `com.openclaw.*`, `openclaw-gateway-<profile>.service`, `OpenClaw Gateway (<profile>)`).
    Tam kılavuz: [Birden fazla gateway](/tr/gateway/multiple-gateways).

  </Accordion>

  <Accordion title='"invalid handshake" / kod 1008 ne anlama gelir?'>
    Gateway bir **WebSocket sunucusudur** ve ilk mesajın
    bir `connect` karesi olmasını bekler. Başka bir şey alırsa, bağlantıyı
    **kod 1008** (politika ihlali) ile kapatır.

    Yaygın nedenler:

    - Bir WS istemcisi yerine tarayıcıda **HTTP** URL'sini açtınız (`http://...`).
    - Yanlış bağlantı noktasını veya yolu kullandınız.
    - Bir proxy veya tünel kimlik doğrulama başlıklarını kaldırdı ya da Gateway olmayan bir istek gönderdi.

    Hızlı düzeltmeler:

    1. WS URL'sini kullanın: `ws://<host>:18789` (veya HTTPS ise `wss://...`).
    2. WS bağlantı noktasını normal bir tarayıcı sekmesinde açmayın.
    3. Kimlik doğrulama açıksa, token/parolayı `connect` karesine ekleyin.

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

    `logging.file` ile kararlı bir yol ayarlayabilirsiniz. Dosya günlük düzeyi `logging.level` tarafından denetlenir. Konsol ayrıntı düzeyi `--verbose` ve `logging.consoleLevel` tarafından denetlenir.

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
    Gateway yardımcılarını kullanın:

    ```bash
    openclaw gateway status
    openclaw gateway restart
    ```

    Gateway'i manuel çalıştırıyorsanız, `openclaw gateway --force` bağlantı noktasını geri alabilir. Bkz. [Gateway](/tr/gateway).

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

    **2) Yerel Windows (önerilmez):** Gateway doğrudan Windows içinde çalışır.

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

    - Model kimlik doğrulaması **Gateway ana makinesinde** yüklenmemiş (`models status` ile kontrol edin).
    - Kanal eşleştirmesi/izin listesi yanıtları engelliyor (kanal yapılandırmasını + günlükleri kontrol edin).
    - WebChat/Dashboard doğru token olmadan açık.

    Uzaktaysanız, tünel/Tailscale bağlantısının çalıştığını ve
    Gateway WebSocket'ine erişilebildiğini doğrulayın.

    Belgeler: [Kanallar](/tr/channels), [Sorun giderme](/tr/gateway/troubleshooting), [Uzaktan erişim](/tr/gateway/remote).

  </Accordion>

  <Accordion title='"Gateway bağlantısı kesildi: neden yok" - şimdi ne yapmalı?'>
    Bu genellikle UI'ın WebSocket bağlantısını kaybettiği anlamına gelir. Şunları kontrol edin:

    1. Gateway çalışıyor mu? `openclaw gateway status`
    2. Gateway sağlıklı mı? `openclaw status`
    3. UI doğru token'a sahip mi? `openclaw dashboard`
    4. Uzakta ise, tünel/Tailscale bağlantısı çalışıyor mu?

    Ardından günlükleri izleyin:

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

    - `BOT_COMMANDS_TOO_MUCH`: Telegram menüsünde çok fazla giriş var. OpenClaw zaten Telegram sınırına göre kısaltır ve daha az komutla yeniden dener, ancak bazı menü girişlerinin yine de kaldırılması gerekir. Plugin/skill/özel komutları azaltın veya menüye ihtiyacınız yoksa `channels.telegram.commands.native` ayarını devre dışı bırakın.
    - `TypeError: fetch failed`, `Network request for 'setMyCommands' failed!` veya benzer ağ hataları: Bir VPS üzerindeyseniz veya proxy arkasındaysanız, dışa giden HTTPS'e izin verildiğini ve DNS'in `api.telegram.org` için çalıştığını doğrulayın.

    Gateway uzaktaysa, Gateway ana makinesindeki günlüklere baktığınızdan emin olun.

    Belgeler: [Telegram](/tr/channels/telegram), [Kanal sorun giderme](/tr/channels/troubleshooting).

  </Accordion>

  <Accordion title="TUI çıktı göstermiyor. Neyi kontrol etmeliyim?">
    Önce Gateway'e erişilebildiğini ve agent'ın çalışabildiğini doğrulayın:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    TUI içinde, geçerli durumu görmek için `/status` kullanın. Bir sohbet
    kanalında yanıt bekliyorsanız, teslimin etkin olduğundan emin olun (`/deliver on`).

    Belgeler: [TUI](/tr/web/tui), [Eğik çizgi komutları](/tr/tools/slash-commands).

  </Accordion>

  <Accordion title="Gateway'i tamamen durdurup sonra nasıl başlatırım?">
    Servisi kurduysanız:

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    Bu, **denetimli servisi** durdurur/başlatır (macOS'te launchd, Linux'ta systemd).
    Gateway arka planda daemon olarak çalıştığında bunu kullanın.

    Ön planda çalıştırıyorsanız, Ctrl-C ile durdurun, ardından:

    ```bash
    openclaw gateway run
    ```

    Belgeler: [Gateway servis runbook'u](/tr/gateway).

  </Accordion>

  <Accordion title="Basitçe: openclaw gateway restart ile openclaw gateway farkı">
    - `openclaw gateway restart`: **arka plan servisini** yeniden başlatır (launchd/systemd).
    - `openclaw gateway`: gateway'i bu terminal oturumu için **ön planda** çalıştırır.

    Servisi kurduysanız gateway komutlarını kullanın. Tek seferlik, ön plan
    çalıştırması istediğinizde `openclaw gateway` kullanın.

  </Accordion>

  <Accordion title="Bir şey başarısız olduğunda daha fazla ayrıntı almanın en hızlı yolu">
    Daha fazla konsol ayrıntısı almak için Gateway'i `--verbose` ile başlatın. Ardından kanal kimlik doğrulaması, model yönlendirmesi ve RPC hataları için günlük dosyasını inceleyin.
  </Accordion>
</AccordionGroup>

## Medya ve ekler

<AccordionGroup>
  <Accordion title="Skill'im bir görüntü/PDF oluşturdu, ancak hiçbir şey gönderilmedi">
    Agent'tan çıkan ekler kendi satırında bir `MEDIA:<path-or-url>` satırı içermelidir. Bkz. [OpenClaw assistant kurulumu](/tr/start/openclaw) ve [Agent gönderimi](/tr/tools/agent-send).

    CLI gönderimi:

    ```bash
    openclaw message send --target +15555550123 --message "Here you go" --media /path/to/file.png
    ```

    Ayrıca şunları kontrol edin:

    - Hedef kanal giden medyayı destekliyor ve izin listeleri tarafından engellenmiyor.
    - Dosya sağlayıcının boyut sınırları içindedir (görüntüler en fazla 2048px olacak şekilde yeniden boyutlandırılır).
    - `tools.fs.workspaceOnly=true`, yerel yol gönderimlerini çalışma alanı, temp/media-store ve sandbox tarafından doğrulanan dosyalarla sınırlı tutar.
    - `tools.fs.workspaceOnly=false`, `MEDIA:` satırının agent'ın zaten okuyabildiği ana makineye yerel dosyaları göndermesine izin verir, ancak yalnızca medya ve güvenli belge türleri için (görüntüler, ses, video, PDF ve Office belgeleri). Düz metin ve sır benzeri dosyalar yine de engellenir.

    Bkz. [Görüntüler](/tr/nodes/images).

  </Accordion>
</AccordionGroup>

## Güvenlik ve erişim denetimi

<AccordionGroup>
  <Accordion title="OpenClaw'ı gelen DM'lere açmak güvenli mi?">
    Gelen DM'leri güvenilmeyen girdi olarak ele alın. Varsayılanlar riski azaltmak üzere tasarlanmıştır:

    - DM destekleyen kanallarda varsayılan davranış **eşleştirme**dir:
      - Bilinmeyen gönderenler bir eşleştirme kodu alır; bot iletilerini işlemez.
      - Şununla onaylayın: `openclaw pairing approve --channel <channel> [--account <id>] <code>`
      - Bekleyen istekler **kanal başına 3** ile sınırlıdır; bir kod gelmediyse `openclaw pairing list --channel <channel> [--account <id>]` ile kontrol edin.
    - DM'leri herkese açık hale getirmek açık bir katılım gerektirir (`dmPolicy: "open"` ve izin listesi `"*"`).

    Riskli DM politikalarını ortaya çıkarmak için `openclaw doctor` çalıştırın.

  </Accordion>

  <Accordion title="Prompt injection yalnızca herkese açık botlar için mi endişe konusudur?">
    Hayır. Prompt injection, yalnızca bot'a kimin DM gönderebildiğiyle değil, **güvenilmeyen içerikle** ilgilidir.
    Assistant'ınız harici içerik okuyorsa (web araması/getirme, tarayıcı sayfaları, e-postalar,
    belgeler, ekler, yapıştırılmış günlükler), bu içerik modeli ele geçirmeye çalışan
    talimatlar içerebilir. Bu, **tek gönderen siz olsanız** bile gerçekleşebilir.

    En büyük risk, araçlar etkin olduğundadır: model, bağlamı dışarı sızdırmak veya
    sizin adınıza araçları çağırmak üzere kandırılabilir. Etki alanını azaltmak için:

    - güvenilmeyen içeriği özetlemek üzere salt okunur veya araçları devre dışı bırakılmış bir "okuyucu" agent kullanın
    - araçları etkin agent'lar için `web_search` / `web_fetch` / `browser` kapalı tutun
    - kodu çözülmüş dosya/belge metnini de güvenilmeyen olarak ele alın: OpenResponses
      `input_file` ve medya eki çıkarımı, ham dosya metnini geçirmek yerine çıkarılan metni
      açık harici içerik sınır işaretleyicileriyle sarmalar
    - sandboxing ve katı araç izin listeleri kullanın

    Ayrıntılar: [Güvenlik](/tr/gateway/security).

  </Accordion>

  <Accordion title="Bot'umun kendi e-postası, GitHub hesabı veya telefon numarası olmalı mı?">
    Çoğu kurulum için evet. Bot'u ayrı hesaplar ve telefon numaralarıyla yalıtmak,
    bir şey ters giderse etki alanını azaltır. Bu ayrıca kişisel hesaplarınızı etkilemeden
    kimlik bilgilerini döndürmeyi veya erişimi iptal etmeyi kolaylaştırır.

    Küçük başlayın. Yalnızca gerçekten ihtiyacınız olan araçlara ve hesaplara erişim verin ve gerekirse
    daha sonra genişletin.

    Belgeler: [Güvenlik](/tr/gateway/security), [Eşleştirme](/tr/channels/pairing).

  </Accordion>

  <Accordion title="Metin mesajlarım üzerinde özerklik verebilir miyim ve bu güvenli mi?">
    Kişisel mesajlarınız üzerinde tam özerklik önermiyoruz. En güvenli desen şudur:

    - DM'leri **eşleştirme modunda** veya sıkı bir izin listesinde tutun.
    - Sizin adınıza mesaj göndermesini istiyorsanız **ayrı bir numara veya hesap** kullanın.
    - Taslak oluşturmasına izin verin, ardından **göndermeden önce onaylayın**.

    Denemek istiyorsanız, bunu özel bir hesapta yapın ve yalıtılmış tutun. Bkz.
    [Güvenlik](/tr/gateway/security).

  </Accordion>

  <Accordion title="Kişisel assistant görevleri için daha ucuz modeller kullanabilir miyim?">
    Evet, agent yalnızca sohbet amaçlıysa ve girdi güvenilirse. Daha küçük katmanlar
    talimat ele geçirmeye daha yatkındır, bu yüzden bunları araçları etkin agent'lar
    veya güvenilmeyen içerik okunurken kullanmaktan kaçının. Daha küçük bir model kullanmanız gerekiyorsa,
    araçları sıkı şekilde kısıtlayın ve sandbox içinde çalıştırın. Bkz. [Güvenlik](/tr/gateway/security).
  </Accordion>

  <Accordion title="Telegram'da /start çalıştırdım ama eşleştirme kodu almadım">
    Eşleştirme kodları **yalnızca** bilinmeyen bir gönderen bot'a mesaj gönderdiğinde ve
    `dmPolicy: "pairing"` etkin olduğunda gönderilir. `/start` tek başına kod oluşturmaz.

    Bekleyen istekleri kontrol edin:

    ```bash
    openclaw pairing list telegram
    ```

    Anında erişim istiyorsanız, gönderen kimliğinizi izin listesine ekleyin veya o hesap için `dmPolicy: "open"`
    ayarlayın.

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

    Sihirbaz telefon numarası istemi: kendi DM'lerinize izin verilebilmesi için **izin listenizi/sahibinizi** ayarlamak amacıyla kullanılır. Otomatik gönderim için kullanılmaz. Kişisel WhatsApp numaranızda çalıştırıyorsanız, o numarayı kullanın ve `channels.whatsapp.selfChatMode` etkinleştirin.

  </Accordion>
</AccordionGroup>

## Sohbet komutları, görevleri durdurma ve "durmuyor"

<AccordionGroup>
  <Accordion title="Dahili sistem mesajlarının sohbette görünmesini nasıl durdururum?">
    Çoğu dahili veya araç mesajı yalnızca o oturum için **verbose**, **trace** veya **reasoning** etkin olduğunda görünür.

    Bunu gördüğünüz sohbette düzeltin:

    ```
    /verbose off
    /trace off
    /reasoning off
    ```

    Hâlâ gürültülüyse, Control UI'da oturum ayarlarını kontrol edin ve verbose'u
    **inherit** olarak ayarlayın. Ayrıca yapılandırmada `verboseDefault` değeri
    `on` olarak ayarlanmış bir bot profili kullanmadığınızı doğrulayın.

    Belgeler: [Düşünme ve verbose](/tr/tools/thinking), [Güvenlik](/tr/gateway/security/index#reasoning-and-verbose-output-in-groups).

  </Accordion>

  <Accordion title="Çalışan bir görevi nasıl durdurur/iptal ederim?">
    Bunlardan herhangi birini **tek başına bir mesaj** olarak gönderin (eğik çizgi yok):

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

    Arka plan süreçleri için (exec aracından), agent'tan şunu çalıştırmasını isteyebilirsiniz:

    ```
    process action:kill sessionId:XXX
    ```

    Eğik çizgi komutlarına genel bakış: bkz. [Eğik çizgi komutları](/tr/tools/slash-commands).

    Çoğu komut `/` ile başlayan **tek başına** bir mesaj olarak gönderilmelidir, ancak birkaç kısayol (`/status` gibi) izin listesindeki gönderenler için satır içinde de çalışır.

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

  <Accordion title='Bot hızlı ardışık mesajları "yok sayıyor" gibi neden hissediliyor?'>
    Kuyruk modu, yeni mesajların devam eden bir çalıştırmayla nasıl etkileşime gireceğini denetler. Modları değiştirmek için `/queue` kullanın:

    - `steer` - geçerli çalıştırmadaki bir sonraki model sınırı için bekleyen tüm yönlendirmeyi kuyruğa al
    - `queue` - eski tek seferde bir yönlendirme
    - `followup` - mesajları tek tek çalıştır
    - `collect` - mesajları toplu işle ve bir kez yanıtla
    - `steer-backlog` - şimdi yönlendir, ardından birikmiş kuyruğu işle
    - `interrupt` - geçerli çalıştırmayı iptal et ve yeniden başla

    Varsayılan mod `steer` modudur. Takip modları için `debounce:0.5s cap:25 drop:summarize` gibi seçenekler ekleyebilirsiniz. [Komut kuyruğu](/tr/concepts/queue) ve [Yönlendirme kuyruğu](/tr/concepts/queue-steering) bölümlerine bakın.

  </Accordion>
</AccordionGroup>

## Çeşitli

<AccordionGroup>
  <Accordion title='API anahtarıyla Anthropic için varsayılan model nedir?'>
    OpenClaw'da kimlik bilgileri ve model seçimi ayrıdır. `ANTHROPIC_API_KEY` ayarlamak (veya auth profillerinde bir Anthropic API anahtarı saklamak) kimlik doğrulamayı etkinleştirir, ancak gerçek varsayılan model `agents.defaults.model.primary` içinde yapılandırdığınız modeldir (örneğin, `anthropic/claude-sonnet-4-6` veya `anthropic/claude-opus-4-6`). `No credentials found for profile "anthropic:default"` görürseniz, bu Gateway'in çalışan agent için beklenen `auth-profiles.json` içinde Anthropic kimlik bilgilerini bulamadığı anlamına gelir.
  </Accordion>
</AccordionGroup>

---

Hâlâ takıldınız mı? [Discord](https://discord.com/invite/clawd) üzerinden sorun veya bir [GitHub tartışması](https://github.com/openclaw/openclaw/discussions) açın.

## İlgili

- [İlk çalıştırma SSS](/tr/help/faq-first-run) — kurulum, onboarding, auth, abonelikler, erken hatalar
- [Modeller SSS](/tr/help/faq-models) — model seçimi, failover, auth profilleri
- [Sorun giderme](/tr/help/troubleshooting) — belirti odaklı triage
