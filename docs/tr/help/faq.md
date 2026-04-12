---
read_when:
    - Yaygın kurulum, yükleme, ilk kurulum veya çalışma zamanı destek sorularını yanıtlama
    - Daha derin hata ayıklamadan önce kullanıcı tarafından bildirilen sorunları triyaj etme
summary: OpenClaw kurulumu, yapılandırması ve kullanımı hakkında sık sorulan sorular
title: SSS
x-i18n:
    generated_at: "2026-04-12T23:28:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: d2a78d0fea9596625cc2753e6dc8cc42c2379a3a0c91729265eee0261fe53eaa
    source_path: help/faq.md
    workflow: 15
---

# SSS

Gerçek dünya kurulumları için hızlı yanıtlar ve daha derin sorun giderme (local geliştirme, VPS, çoklu agent, OAuth/API anahtarları, model failover). Çalışma zamanı tanılamaları için [Sorun Giderme](/tr/gateway/troubleshooting) bölümüne bakın. Tam yapılandırma başvurusu için [Yapılandırma](/tr/gateway/configuration) bölümüne bakın.

## Bir şey bozulduysa ilk 60 saniye

1. **Hızlı durum (ilk kontrol)**

   ```bash
   openclaw status
   ```

   Hızlı local özet: işletim sistemi + güncelleme, Gateway/servis erişilebilirliği, agent'lar/oturumlar, sağlayıcı yapılandırması + çalışma zamanı sorunları (Gateway erişilebilirse).

2. **Paylaşılabilir rapor (paylaşması güvenli)**

   ```bash
   openclaw status --all
   ```

   Günlük sonunu içeren salt okunur tanılama (token'lar redakte edilir).

3. **Daemon + port durumu**

   ```bash
   openclaw gateway status
   ```

   Supervisor çalışma zamanı ile RPC erişilebilirliğini, probe hedef URL'sini ve servisin büyük olasılıkla hangi yapılandırmayı kullandığını gösterir.

4. **Derin probe'lar**

   ```bash
   openclaw status --deep
   ```

   Desteklendiğinde kanal probe'ları da dahil olmak üzere canlı bir Gateway sağlık probe'u çalıştırır
   (erişilebilir bir Gateway gerektirir). Bkz. [Health](/tr/gateway/health).

5. **En son günlüğü takip et**

   ```bash
   openclaw logs --follow
   ```

   RPC kapalıysa şuna fallback yapın:

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   Dosya günlükleri servis günlüklerinden ayrıdır; bkz. [Logging](/tr/logging) ve [Sorun Giderme](/tr/gateway/troubleshooting).

6. **Doctor'ı çalıştırın (onarımlar)**

   ```bash
   openclaw doctor
   ```

   Yapılandırmayı/durumu onarır veya migrate eder + sağlık kontrolleri çalıştırır. Bkz. [Doctor](/tr/gateway/doctor).

7. **Gateway anlık görüntüsü**

   ```bash
   openclaw health --json
   openclaw health --verbose   # hatalarda hedef URL + yapılandırma yolunu gösterir
   ```

   Çalışan Gateway'den tam bir anlık görüntü ister (yalnızca WS). Bkz. [Health](/tr/gateway/health).

## Hızlı başlangıç ve ilk çalıştırma kurulumu

<AccordionGroup>
  <Accordion title="Takıldım, takılmaktan çıkmanın en hızlı yolu">
    Makinenizi **görebilen** local bir AI agent kullanın. Bu, Discord'da sormaktan çok daha etkilidir,
    çünkü "takıldım" durumlarının çoğu, uzaktaki yardımcıların inceleyemeyeceği **local yapılandırma veya ortam sorunlarıdır**.

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    Bu araçlar repoyu okuyabilir, komut çalıştırabilir, günlükleri inceleyebilir ve makine düzeyindeki
    kurulumunuzu (PATH, servisler, izinler, kimlik doğrulama dosyaları) düzeltmenize yardımcı olabilir. Onlara
    hackable (git) kurulum üzerinden **tam kaynak checkout'unu** verin:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Bu, OpenClaw'ı **bir git checkout'undan** kurar; böylece agent kodu + belgeleri okuyabilir ve
    çalıştırdığınız tam sürüm hakkında akıl yürütebilir. Daha sonra yükleyiciyi `--install-method git` olmadan
    yeniden çalıştırarak her zaman stable sürüme geri dönebilirsiniz.

    İpucu: agent'tan düzeltmeyi **planlamasını ve denetlemesini** isteyin (adım adım), ardından yalnızca
    gerekli komutları çalıştırın. Bu, değişiklikleri küçük tutar ve denetlemeyi kolaylaştırır.

    Gerçek bir hata veya düzeltme keşfederseniz lütfen bir GitHub issue açın veya bir PR gönderin:
    [https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
    [https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

    Şu komutlarla başlayın (yardım isterken çıktıları paylaşın):

    ```bash
    openclaw status
    openclaw models status
    openclaw doctor
    ```

    Ne yaptıkları:

    - `openclaw status`: Gateway/agent sağlığı + temel yapılandırmanın hızlı anlık görüntüsü.
    - `openclaw models status`: sağlayıcı kimlik doğrulamasını + model kullanılabilirliğini kontrol eder.
    - `openclaw doctor`: yaygın yapılandırma/durum sorunlarını doğrular ve onarır.

    Diğer yararlı CLI kontrolleri: `openclaw status --all`, `openclaw logs --follow`,
    `openclaw gateway status`, `openclaw health --verbose`.

    Hızlı hata ayıklama döngüsü: [Bir şey bozulduysa ilk 60 saniye](#bir-şey-bozulduysa-ilk-60-saniye).
    Kurulum belgeleri: [Kurulum](/tr/install), [Yükleyici bayrakları](/tr/install/installer), [Güncelleme](/tr/install/updating).

  </Accordion>

  <Accordion title="Heartbeat sürekli atlanıyor. Atlama nedenleri ne anlama geliyor?">
    Yaygın Heartbeat atlama nedenleri:

    - `quiet-hours`: yapılandırılmış aktif saatler penceresinin dışında
    - `empty-heartbeat-file`: `HEARTBEAT.md` var ama yalnızca boş/başlık-only iskelet içeriyor
    - `no-tasks-due`: `HEARTBEAT.md` görev modu etkin ama görev aralıklarının henüz hiçbiri zamanı gelmiş değil
    - `alerts-disabled`: tüm Heartbeat görünürlüğü devre dışı (`showOk`, `showAlerts` ve `useIndicator` tamamen kapalı)

    Görev modunda, zaman damgaları yalnızca gerçek bir Heartbeat çalıştırması
    tamamlandıktan sonra ilerletilir. Atlanan çalıştırmalar görevleri tamamlanmış olarak işaretlemez.

    Belgeler: [Heartbeat](/tr/gateway/heartbeat), [Otomasyon ve Görevler](/tr/automation).

  </Accordion>

  <Accordion title="OpenClaw'ı kurup ayarlamanın önerilen yolu">
    Repo, kaynaktan çalıştırmayı ve onboarding kullanmayı önerir:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    Sihirbaz ayrıca UI varlıklarını otomatik olarak build edebilir. Onboarding'den sonra Gateway'i genellikle **18789** portunda çalıştırırsınız.

    Kaynaktan (katkıda bulunanlar/geliştiriciler):

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    pnpm ui:build # ilk çalıştırmada UI bağımlılıklarını otomatik yükler
    openclaw onboard
    ```

    Henüz global bir kurulumunuz yoksa, bunu `pnpm openclaw onboard` ile çalıştırın.

  </Accordion>

  <Accordion title="Onboarding'den sonra dashboard'u nasıl açarım?">
    Sihirbaz, onboarding'den hemen sonra tarayıcınızı temiz (token içermeyen) bir dashboard URL'siyle açar ve ayrıca özette bağlantıyı yazdırır. Bu sekmeyi açık tutun; açılmadıysa, yazdırılan URL'yi aynı makinede kopyalayıp yapıştırın.
  </Accordion>

  <Accordion title="Dashboard kimlik doğrulamasını localhost'ta ve uzaktan nasıl yaparım?">
    **Localhost (aynı makine):**

    - `http://127.0.0.1:18789/` adresini açın.
    - Paylaşılan gizli anahtar kimlik doğrulaması isterse, yapılandırılmış token veya parolayı Control UI ayarlarına yapıştırın.
    - Token kaynağı: `gateway.auth.token` (veya `OPENCLAW_GATEWAY_TOKEN`).
    - Parola kaynağı: `gateway.auth.password` (veya `OPENCLAW_GATEWAY_PASSWORD`).
    - Henüz paylaşılan gizli anahtar yapılandırılmadıysa, `openclaw doctor --generate-gateway-token` ile bir token üretin.

    **Localhost'ta değilse:**

    - **Tailscale Serve** (önerilir): bind loopback olarak kalsın, `openclaw gateway --tailscale serve` çalıştırın, `https://<magicdns>/` adresini açın. `gateway.auth.allowTailscale` değeri `true` ise, kimlik başlıkları Control UI/WebSocket kimlik doğrulamasını karşılar (paylaşılan gizli anahtarı yapıştırmak gerekmez, güvenilir Gateway host'u varsayılır); HTTP API'leri ise private-ingress `none` veya trusted-proxy HTTP auth'u kasıtlı olarak kullanmadığınız sürece yine de paylaşılan gizli anahtar kimlik doğrulaması gerektirir.
      Aynı istemciden gelen hatalı eşzamanlı Serve kimlik doğrulama denemeleri, başarısız kimlik doğrulama sınırlayıcısı bunları kaydetmeden önce serileştirilir; bu nedenle ikinci hatalı yeniden deneme zaten `retry later` gösterebilir.
    - **Tailnet bind**: `openclaw gateway --bind tailnet --token "<token>"` çalıştırın (veya parola kimlik doğrulamasını yapılandırın), `http://<tailscale-ip>:18789/` adresini açın, ardından dashboard ayarlarına eşleşen paylaşılan gizli anahtarı yapıştırın.
    - **Kimlik farkındalıklı reverse proxy**: Gateway'i loopback olmayan güvenilir bir proxy arkasında tutun, `gateway.auth.mode: "trusted-proxy"` yapılandırın, ardından proxy URL'sini açın.
    - **SSH tunnel**: `ssh -N -L 18789:127.0.0.1:18789 user@host` ardından `http://127.0.0.1:18789/` adresini açın. Tunnel üzerinden de paylaşılan gizli anahtar kimlik doğrulaması geçerlidir; istenirse yapılandırılmış token veya parolayı yapıştırın.

    Bind modları ve kimlik doğrulama ayrıntıları için [Dashboard](/web/dashboard) ve [Web surfaces](/web) bölümlerine bakın.

  </Accordion>

  <Accordion title="Sohbet onayları için neden iki farklı exec approval yapılandırması var?">
    Farklı katmanları kontrol ederler:

    - `approvals.exec`: onay istemlerini sohbet hedeflerine iletir
    - `channels.<channel>.execApprovals`: o kanalın exec onayları için native bir onay istemcisi gibi davranmasını sağlar

    Host exec politikası hâlâ gerçek onay kapısıdır. Sohbet yapılandırması yalnızca onay
    istemlerinin nerede görüneceğini ve insanların nasıl yanıt verebileceğini kontrol eder.

    Çoğu kurulumda her ikisine de **ihtiyacınız olmaz**:

    - Sohbet zaten komutları ve yanıtları destekliyorsa, aynı sohbette `/approve` ortak yol üzerinden çalışır.
    - Desteklenen bir native kanal onaylayıcıları güvenli şekilde çıkarabiliyorsa, OpenClaw artık `channels.<channel>.execApprovals.enabled` ayarsız veya `"auto"` olduğunda DM-first native onayları otomatik etkinleştirir.
    - Native onay kartları/düğmeleri mevcut olduğunda, o native UI birincil yoldur; araç sonucu sohbet onaylarının kullanılamadığını veya tek yolun manuel onay olduğunu söylemediği sürece agent yalnızca manuel `/approve` komutu eklemelidir.
    - İstemlerin başka sohbetlere veya belirli operasyon odalarına da iletilmesi gerekiyorsa yalnızca `approvals.exec` kullanın.
    - Onay istemlerinin kaynak odaya/konuya da geri gönderilmesini açıkça istiyorsanız yalnızca `channels.<channel>.execApprovals.target: "channel"` veya `"both"` kullanın.
    - Plugin onayları yine ayrıdır: varsayılan olarak aynı sohbette `/approve` kullanırlar, isteğe bağlı `approvals.plugin` iletimi vardır ve yalnızca bazı native kanallar bunun üstünde plugin-approval-native işleme tutar.

    Kısaca: iletme yönlendirme içindir, native istemci yapılandırması ise kanal bazında daha zengin UX içindir.
    Bkz. [Exec Approvals](/tr/tools/exec-approvals).

  </Accordion>

  <Accordion title="Hangi çalışma zamanına ihtiyacım var?">
    Node **>= 22** gereklidir. `pnpm` önerilir. Bun, Gateway için **önerilmez**.
  </Accordion>

  <Accordion title="Raspberry Pi üzerinde çalışır mı?">
    Evet. Gateway hafiftir - belgelerde kişisel kullanım için **512MB-1GB RAM**, **1 çekirdek** ve yaklaşık **500MB**
    disk alanının yeterli olduğu belirtilir ve bir **Raspberry Pi 4'ün bunu çalıştırabildiği** not edilir.

    Ek boşluk istiyorsanız (günlükler, medya, diğer servisler), **2GB önerilir**, ancak bu
    katı bir minimum değildir.

    İpucu: küçük bir Pi/VPS Gateway'i barındırabilir ve siz de local ekran/kamera/canvas veya komut yürütme için
    dizüstü bilgisayarınızda/telefonunuzda **Node** eşleyebilirsiniz. Bkz. [Node'lar](/tr/nodes).

  </Accordion>

  <Accordion title="Raspberry Pi kurulumları için öneriler var mı?">
    Kısa cevap: çalışır, ama pürüzlerle karşılaşmayı bekleyin.

    - **64-bit** işletim sistemi kullanın ve Node >= 22 olarak tutun.
    - Günlükleri görebilmek ve hızlı güncelleme yapabilmek için **hackable (git) kurulumunu** tercih edin.
    - Kanallar/Skills olmadan başlayın, sonra bunları tek tek ekleyin.
    - Garip binary sorunlarıyla karşılaşırsanız, bu genellikle bir **ARM uyumluluğu** problemidir.

    Belgeler: [Linux](/tr/platforms/linux), [Kurulum](/tr/install).

  </Accordion>

  <Accordion title="Wake up my friend ekranında takılıyor / onboarding açılmıyor. Şimdi ne yapmalıyım?">
    Bu ekran, Gateway'in erişilebilir ve kimliği doğrulanmış olmasına bağlıdır. TUI ayrıca
    ilk hatch sırasında "Wake up, my friend!" mesajını otomatik gönderir. Bu satırı **yanıt olmadan**
    görüyorsanız ve token'lar 0 olarak kalıyorsa, agent hiç çalışmamış demektir.

    1. Gateway'i yeniden başlatın:

    ```bash
    openclaw gateway restart
    ```

    2. Durumu + kimlik doğrulamayı kontrol edin:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    3. Hâlâ takılıyorsa şunu çalıştırın:

    ```bash
    openclaw doctor
    ```

    Gateway uzaktaysa, tunnel/Tailscale bağlantısının açık olduğundan ve UI'ın
    doğru Gateway'e işaret ettiğinden emin olun. Bkz. [Uzaktan erişim](/tr/gateway/remote).

  </Accordion>

  <Accordion title="Kurulumu yeni bir makineye (Mac mini) onboarding'i yeniden yapmadan taşıyabilir miyim?">
    Evet. **Durum dizinini** ve **çalışma alanını** kopyalayın, ardından Doctor'ı bir kez çalıştırın. Bu,
    **iki** konumu da kopyaladığınız sürece botunuzu "tam olarak aynı" şekilde (bellek, oturum geçmişi, kimlik doğrulama ve kanal
    durumu) korur:

    1. Yeni makineye OpenClaw kurun.
    2. Eski makineden `$OPENCLAW_STATE_DIR` dizinini (varsayılan: `~/.openclaw`) kopyalayın.
    3. Çalışma alanınızı kopyalayın (varsayılan: `~/.openclaw/workspace`).
    4. `openclaw doctor` çalıştırın ve Gateway servisini yeniden başlatın.

    Bu, yapılandırmayı, kimlik doğrulama profillerini, WhatsApp kimlik bilgilerini, oturumları ve belleği korur. Eğer
    remote moddaysanız, oturum deposu ve çalışma alanının Gateway host'una ait olduğunu unutmayın.

    **Önemli:** yalnızca çalışma alanınızı GitHub'a commit/push ederseniz, **belleği + bootstrap dosyalarını**
    yedeklemiş olursunuz, ancak **oturum geçmişini veya kimlik doğrulamayı** yedeklemiş olmazsınız. Bunlar
    `~/.openclaw/` altında bulunur (örneğin `~/.openclaw/agents/<agentId>/sessions/`).

    İlgili: [Taşıma](/tr/install/migrating), [Diskte öğelerin bulunduğu yer](#diskte-öğelerin-bulunduğu-yer),
    [Agent çalışma alanı](/tr/concepts/agent-workspace), [Doctor](/tr/gateway/doctor),
    [Remote mod](/tr/gateway/remote).

  </Accordion>

  <Accordion title="En son sürümde nelerin yeni olduğunu nerede görebilirim?">
    GitHub changelog'una bakın:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    En yeni girdiler en üsttedir. Üst bölüm **Unreleased** olarak işaretlenmişse, bir sonraki tarihli
    bölüm en son yayımlanan sürümdür. Girdiler **Highlights**, **Changes** ve
    **Fixes** olarak gruplandırılır (gerektiğinde docs/other bölümleriyle birlikte).

  </Accordion>

  <Accordion title="docs.openclaw.ai erişilemiyor (SSL hatası)">
    Bazı Comcast/Xfinity bağlantıları, `docs.openclaw.ai` adresini Xfinity
    Advanced Security üzerinden yanlış şekilde engeller. Bunu devre dışı bırakın veya `docs.openclaw.ai` alan adını allowlist'e ekleyin, sonra yeniden deneyin.
    Lütfen engelin kaldırılmasına yardımcı olmak için buradan bildirin: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

    Siteye hâlâ erişemiyorsanız, belgeler GitHub üzerinde mirror olarak da bulunur:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="Stable ile beta arasındaki fark">
    **Stable** ve **beta**, ayrı kod hatları değil, **npm dist-tag** değerleridir:

    - `latest` = stable
    - `beta` = test için erken build

    Genellikle bir stable sürüm önce **beta**'ya gelir, ardından açık bir
    promotion adımı aynı sürümü `latest` konumuna taşır. Gerekirse maintainers doğrudan
    `latest`'e de yayımlayabilir. Bu nedenle beta ve stable, promotion sonrasında
    **aynı sürümü** gösterebilir.

    Nelerin değiştiğini görün:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Tek satırlık kurulum komutları ve beta ile dev arasındaki fark için aşağıdaki accordion'a bakın.

  </Accordion>

  <Accordion title="Beta sürümünü nasıl yüklerim ve beta ile dev arasındaki fark nedir?">
    **Beta**, npm dist-tag `beta`'dır (`promotion` sonrasında `latest` ile eşleşebilir).
    **Dev** ise `main` dalının hareketli başıdır (git); yayımlandığında npm dist-tag `dev` kullanır.

    Tek satırlık komutlar (macOS/Linux):

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --beta
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Windows yükleyicisi (PowerShell):
    [https://openclaw.ai/install.ps1](https://openclaw.ai/install.ps1)

    Daha fazla ayrıntı: [Geliştirme kanalları](/tr/install/development-channels) ve [Yükleyici bayrakları](/tr/install/installer).

  </Accordion>

  <Accordion title="En güncel parçaları nasıl deneyebilirim?">
    İki seçenek var:

    1. **Dev kanalı (git checkout):**

    ```bash
    openclaw update --channel dev
    ```

    Bu, `main` dalına geçer ve kaynaktan güncelleme yapar.

    2. **Hackable kurulum (yükleyici sitesinden):**

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Bu size düzenleyebileceğiniz local bir repo verir; ardından git üzerinden güncelleyebilirsiniz.

    Temiz bir clone işlemini elle yapmayı tercih ederseniz şunu kullanın:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    ```

    Belgeler: [Güncelleme](/cli/update), [Geliştirme kanalları](/tr/install/development-channels),
    [Kurulum](/tr/install).

  </Accordion>

  <Accordion title="Kurulum ve onboarding genellikle ne kadar sürer?">
    Yaklaşık bir rehber:

    - **Kurulum:** 2-5 dakika
    - **Onboarding:** yapılandırdığınız kanal/model sayısına bağlı olarak 5-15 dakika

    Takılırsa [Yükleyici takıldı](#hızlı-başlangıç-ve-ilk-çalıştırma-kurulumu)
    ve [Takıldım](#hızlı-başlangıç-ve-ilk-çalıştırma-kurulumu) bölümündeki hızlı hata ayıklama döngüsünü kullanın.

  </Accordion>

  <Accordion title="Yükleyici takıldı mı? Daha fazla geri bildirimi nasıl alırım?">
    Yükleyiciyi **ayrıntılı çıktıyla** yeniden çalıştırın:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --verbose
    ```

    Ayrıntılı çıktıyla beta kurulumu:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --beta --verbose
    ```

    Hackable (git) kurulum için:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git --verbose
    ```

    Windows (PowerShell) eşdeğeri:

    ```powershell
    # install.ps1 için henüz ayrılmış bir -Verbose bayrağı yok.
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

    Daha fazla seçenek: [Yükleyici bayrakları](/tr/install/installer).

  </Accordion>

  <Accordion title="Windows kurulumunda git bulunamadı veya openclaw tanınmıyor deniyor">
    Windows'ta iki yaygın sorun vardır:

    **1) npm error spawn git / git bulunamadı**

    - **Git for Windows** yükleyin ve `git` komutunun PATH üzerinde olduğundan emin olun.
    - PowerShell'i kapatıp yeniden açın, ardından yükleyiciyi tekrar çalıştırın.

    **2) Kurulumdan sonra openclaw tanınmıyor**

    - npm global bin klasörünüz PATH üzerinde değil.
    - Yolu kontrol edin:

      ```powershell
      npm config get prefix
      ```

    - Bu dizini kullanıcı PATH'inize ekleyin (Windows'ta `\bin` soneki gerekmez; çoğu sistemde `%AppData%\npm` olur).
    - PATH'i güncelledikten sonra PowerShell'i kapatıp yeniden açın.

    En sorunsuz Windows kurulumu için native Windows yerine **WSL2** kullanın.
    Belgeler: [Windows](/tr/platforms/windows).

  </Accordion>

  <Accordion title="Windows exec çıktısında bozuk Çince metin görünüyor - ne yapmalıyım?">
    Bu genellikle native Windows shell'lerinde konsol kod sayfası uyumsuzluğudur.

    Belirtiler:

    - `system.run`/`exec` çıktısı Çinceyi bozuk karakterlerle gösterir
    - Aynı komut başka bir terminal profilinde düzgün görünür

    PowerShell'de hızlı geçici çözüm:

    ```powershell
    chcp 65001
    [Console]::InputEncoding = [System.Text.UTF8Encoding]::new($false)
    [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    $OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    ```

    Ardından Gateway'i yeniden başlatın ve komutunuzu tekrar deneyin:

    ```powershell
    openclaw gateway restart
    ```

    Bunu hâlâ en son OpenClaw sürümünde yeniden üretebiliyorsanız, şurada izleyin/bildirin:

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="Belgeler soruma yanıt vermedi - daha iyi bir yanıtı nasıl alabilirim?">
    **Hackable (git) kurulumu** kullanın; böylece tam kaynak ve belgeler local olarak elinizde olur, sonra
    botunuza (veya Claude/Codex'e) _o klasörden_ sorun; böylece repoyu okuyup tam yanıt verebilir.

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Daha fazla ayrıntı: [Kurulum](/tr/install) ve [Yükleyici bayrakları](/tr/install/installer).

  </Accordion>

  <Accordion title="Linux'ta OpenClaw'ı nasıl kurarım?">
    Kısa yanıt: Linux rehberini izleyin, ardından onboarding'i çalıştırın.

    - Linux hızlı yol + servis kurulumu: [Linux](/tr/platforms/linux).
    - Tam adım adım rehber: [Başlarken](/tr/start/getting-started).
    - Yükleyici + güncellemeler: [Kurulum ve güncellemeler](/tr/install/updating).

  </Accordion>

  <Accordion title="OpenClaw'ı bir VPS üzerine nasıl kurarım?">
    Herhangi bir Linux VPS çalışır. Sunucuya kurun, ardından Gateway'e erişmek için SSH/Tailscale kullanın.

    Rehberler: [exe.dev](/tr/install/exe-dev), [Hetzner](/tr/install/hetzner), [Fly.io](/tr/install/fly).
    Uzaktan erişim: [Gateway remote](/tr/gateway/remote).

  </Accordion>

  <Accordion title="Bulut/VPS kurulum rehberleri nerede?">
    Yaygın sağlayıcıları içeren bir **hosting hub** tutuyoruz. Birini seçin ve rehberi izleyin:

    - [VPS hosting](/tr/vps) (tüm sağlayıcılar tek yerde)
    - [Fly.io](/tr/install/fly)
    - [Hetzner](/tr/install/hetzner)
    - [exe.dev](/tr/install/exe-dev)

    Bulutta nasıl çalıştığı: **Gateway sunucuda çalışır**, siz de ona
    dizüstü bilgisayarınızdan/telefonunuzdan Control UI (veya Tailscale/SSH) üzerinden erişirsiniz. Durumunuz + çalışma alanınız
    sunucuda yaşar; bu yüzden host'u doğruluk kaynağı olarak görün ve yedekleyin.

    Local ekran/kamera/canvas erişimi sağlamak veya dizüstü bilgisayarınızda komut çalıştırmak için
    o bulut Gateway ile **Node** eşleyebilirsiniz (Mac/iOS/Android/headless) ve
    Gateway'i bulutta tutmaya devam edebilirsiniz.

    Merkez: [Platformlar](/tr/platforms). Uzaktan erişim: [Gateway remote](/tr/gateway/remote).
    Node'lar: [Node'lar](/tr/nodes), [Node'lar CLI](/cli/nodes).

  </Accordion>

  <Accordion title="OpenClaw'dan kendini güncellemesini isteyebilir miyim?">
    Kısa yanıt: **mümkün, önerilmez**. Güncelleme akışı
    Gateway'i yeniden başlatabilir (bu da etkin oturumu düşürür), temiz bir git checkout gerekebilir ve
    onay isteyebilir. Daha güvenlisi: güncellemeleri operatör olarak bir shell'den çalıştırın.

    CLI'ı kullanın:

    ```bash
    openclaw update
    openclaw update status
    openclaw update --channel stable|beta|dev
    openclaw update --tag <dist-tag|version>
    openclaw update --no-restart
    ```

    Bunu bir agent'tan otomatikleştirmeniz gerekiyorsa:

    ```bash
    openclaw update --yes --no-restart
    openclaw gateway restart
    ```

    Belgeler: [Güncelleme](/cli/update), [Güncelleme](/tr/install/updating).

  </Accordion>

  <Accordion title="Onboarding gerçekte ne yapar?">
    `openclaw onboard`, önerilen kurulum yoludur. **Local modda** size şunlar konusunda rehberlik eder:

    - **Model/kimlik doğrulama kurulumu** (sağlayıcı OAuth'u, API anahtarları, Anthropic setup-token, ayrıca LM Studio gibi local model seçenekleri)
    - **Çalışma alanı** konumu + bootstrap dosyaları
    - **Gateway ayarları** (bind/port/auth/tailscale)
    - **Kanallar** (WhatsApp, Telegram, Discord, Mattermost, Signal, iMessage ve QQ Bot gibi bundled kanal Plugin'leri)
    - **Daemon kurulumu** (macOS'ta LaunchAgent; Linux/WSL2'de systemd kullanıcı birimi)
    - **Sağlık kontrolleri** ve **Skills** seçimi

    Ayrıca yapılandırılmış modeliniz bilinmiyorsa veya kimlik doğrulaması eksikse uyarır.

  </Accordion>

  <Accordion title="Bunu çalıştırmak için Claude veya OpenAI aboneliğine ihtiyacım var mı?">
    Hayır. OpenClaw'ı **API anahtarları** (Anthropic/OpenAI/diğerleri) ile veya
    verileriniz cihazınızda kalsın diye **yalnızca local modellerle** çalıştırabilirsiniz. Abonelikler (Claude
    Pro/Max veya OpenAI Codex), bu sağlayıcılarda kimlik doğrulamak için isteğe bağlı yollardır.

    Anthropic için OpenClaw içindeki pratik ayrım şöyledir:

    - **Anthropic API anahtarı**: normal Anthropic API ücretlendirmesi
    - **OpenClaw içinde Claude CLI / Claude abonelik kimlik doğrulaması**: Anthropic çalışanları
      bize bu kullanımın yeniden izinli olduğunu söyledi ve Anthropic yeni bir
      politika yayımlamadığı sürece OpenClaw, bu entegrasyon için `claude -p`
      kullanımını onaylı kabul ediyor

    Uzun ömürlü Gateway host'ları için Anthropic API anahtarları hâlâ daha
    öngörülebilir kurulumdur. OpenAI Codex OAuth, OpenClaw gibi harici
    araçlar için açıkça desteklenir.

    OpenClaw ayrıca şu diğer barındırılan abonelik tarzı seçenekleri de destekler:
    **Qwen Cloud Coding Plan**, **MiniMax Coding Plan** ve
    **Z.AI / GLM Coding Plan**.

    Belgeler: [Anthropic](/tr/providers/anthropic), [OpenAI](/tr/providers/openai),
    [Qwen Cloud](/tr/providers/qwen),
    [MiniMax](/tr/providers/minimax), [GLM Models](/tr/providers/glm),
    [Local modeller](/tr/gateway/local-models), [Modeller](/tr/concepts/models).

  </Accordion>

  <Accordion title="API anahtarı olmadan Claude Max aboneliğini kullanabilir miyim?">
    Evet.

    Anthropic çalışanları bize OpenClaw tarzı Claude CLI kullanımına yeniden izin verildiğini söyledi; bu nedenle
    Anthropic yeni bir politika yayımlamadığı sürece OpenClaw, bu entegrasyon için
    Claude abonelik kimlik doğrulamasını ve `claude -p` kullanımını onaylı kabul eder.
    Sunucu tarafında en öngörülebilir kurulumu istiyorsanız, bunun yerine bir Anthropic API anahtarı kullanın.

  </Accordion>

  <Accordion title="Claude abonelik kimlik doğrulamasını destekliyor musunuz (Claude Pro veya Max)?">
    Evet.

    Anthropic çalışanları bize bu kullanıma yeniden izin verildiğini söyledi; bu nedenle OpenClaw,
    Anthropic yeni bir politika yayımlamadığı sürece bu entegrasyon için
    Claude CLI yeniden kullanımını ve `claude -p` kullanımını onaylı kabul eder.

    Anthropic setup-token, desteklenen bir OpenClaw token yolu olarak hâlâ kullanılabilir, ancak OpenClaw artık mevcut olduğunda Claude CLI yeniden kullanımını ve `claude -p` kullanımını tercih eder.
    Production veya çok kullanıcılı iş yükleri için Anthropic API anahtarı kimlik doğrulaması hâlâ
    daha güvenli ve daha öngörülebilir seçimdir. OpenClaw içindeki diğer abonelik tarzı barındırılan
    seçenekleri istiyorsanız bkz. [OpenAI](/tr/providers/openai), [Qwen / Model
    Cloud](/tr/providers/qwen), [MiniMax](/tr/providers/minimax) ve [GLM
    Models](/tr/providers/glm).

  </Accordion>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>
<Accordion title="Anthropic'ten neden HTTP 429 rate_limit_error görüyorum?">
Bu, mevcut pencere için **Anthropic kota/hız sınırınızın** tükendiği anlamına gelir. **Claude CLI**
kullanıyorsanız, pencerenin sıfırlanmasını bekleyin veya planınızı yükseltin. Bir
**Anthropic API anahtarı** kullanıyorsanız, kullanım/faturalandırma için Anthropic Console'u
kontrol edin ve gerekirse limitleri artırın.

    Mesaj özellikle şuysa:
    `Extra usage is required for long context requests`, istek
    Anthropic'in 1M bağlam betasını (`context1m: true`) kullanmaya çalışıyor demektir. Bu yalnızca kimlik bilgileriniz
    uzun bağlam faturalandırması için uygunsa çalışır (API anahtarı faturalandırması veya
    Extra Usage etkinleştirilmiş OpenClaw Claude-login yolu).

    İpucu: bir sağlayıcı hız sınırına takıldığında OpenClaw'ın yanıt vermeye devam edebilmesi için bir **fallback model** ayarlayın.
    Bkz. [Models](/cli/models), [OAuth](/tr/concepts/oauth) ve
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/tr/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

  </Accordion>

  <Accordion title="AWS Bedrock destekleniyor mu?">
    Evet. OpenClaw, bundled bir **Amazon Bedrock (Converse)** sağlayıcısına sahiptir. AWS ortam işaretçileri mevcut olduğunda OpenClaw, akış/metin Bedrock kataloğunu otomatik keşfedebilir ve bunu örtük bir `amazon-bedrock` sağlayıcısı olarak birleştirebilir; aksi halde `plugins.entries.amazon-bedrock.config.discovery.enabled` değerini açıkça etkinleştirebilir veya manuel bir sağlayıcı girdisi ekleyebilirsiniz. Bkz. [Amazon Bedrock](/tr/providers/bedrock) ve [Model sağlayıcıları](/tr/providers/models). Yönetilen bir anahtar akışını tercih ederseniz, Bedrock önünde OpenAI uyumlu bir proxy yine de geçerli bir seçenektir.
  </Accordion>

  <Accordion title="Codex kimlik doğrulaması nasıl çalışır?">
    OpenClaw, **OpenAI Code (Codex)** için OAuth (ChatGPT oturumu açma) desteği sunar. Onboarding, OAuth akışını çalıştırabilir ve uygun olduğunda varsayılan modeli `openai-codex/gpt-5.4` olarak ayarlar. Bkz. [Model sağlayıcıları](/tr/concepts/model-providers) ve [Onboarding (CLI)](/tr/start/wizard).
  </Accordion>

  <Accordion title="ChatGPT GPT-5.4 neden OpenClaw içinde openai/gpt-5.4 kilidini açmıyor?">
    OpenClaw bu iki yolu ayrı değerlendirir:

    - `openai-codex/gpt-5.4` = ChatGPT/Codex OAuth
    - `openai/gpt-5.4` = doğrudan OpenAI Platform API

    OpenClaw içinde ChatGPT/Codex oturum açma işlemi, doğrudan `openai/*` yolu yerine
    `openai-codex/*` yoluna bağlanır. OpenClaw içinde doğrudan API yolunu istiyorsanız,
    `OPENAI_API_KEY` (veya eşdeğer OpenAI sağlayıcı yapılandırması) ayarlayın.
    OpenClaw içinde ChatGPT/Codex oturum açma istiyorsanız `openai-codex/*` kullanın.

  </Accordion>

  <Accordion title="Codex OAuth limitleri neden ChatGPT web'den farklı olabilir?">
    `openai-codex/*`, Codex OAuth yolunu kullanır ve kullanılabilir kotaları
    OpenAI tarafından yönetilir ve plana bağlıdır. Pratikte bu limitler,
    ikisi de aynı hesaba bağlı olsa bile ChatGPT web sitesi/uygulaması deneyiminden farklı olabilir.

    OpenClaw, şu anda görünür sağlayıcı kullanımını/kota pencerelerini
    `openclaw models status` içinde gösterebilir, ancak ChatGPT web
    haklarını doğrudan API erişimine dönüştürmez veya normalize etmez. Doğrudan OpenAI Platform
    faturalandırma/limit yolunu istiyorsanız, API anahtarıyla `openai/*` kullanın.

  </Accordion>

  <Accordion title="OpenAI abonelik kimlik doğrulamasını destekliyor musunuz (Codex OAuth)?">
    Evet. OpenClaw, **OpenAI Code (Codex) abonelik OAuth** desteğini tam olarak sunar.
    OpenAI, OpenClaw gibi harici araçlarda/iş akışlarında
    abonelik OAuth kullanımına açıkça izin verir. Onboarding bu OAuth akışını sizin için çalıştırabilir.

    Bkz. [OAuth](/tr/concepts/oauth), [Model sağlayıcıları](/tr/concepts/model-providers) ve [Onboarding (CLI)](/tr/start/wizard).

  </Accordion>

  <Accordion title="Gemini CLI OAuth'u nasıl kurarım?">
    Gemini CLI, `openclaw.json` içindeki bir client id veya secret yerine **Plugin auth flow** kullanır.

    Adımlar:

    1. `gemini` PATH üzerinde olacak şekilde Gemini CLI'ı local olarak yükleyin
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. Plugin'i etkinleştirin: `openclaw plugins enable google`
    3. Oturum açın: `openclaw models auth login --provider google-gemini-cli --set-default`
    4. Oturum açtıktan sonraki varsayılan model: `google-gemini-cli/gemini-3-flash-preview`
    5. İstekler başarısız olursa Gateway host'unda `GOOGLE_CLOUD_PROJECT` veya `GOOGLE_CLOUD_PROJECT_ID` ayarlayın

    Bu, OAuth token'larını Gateway host'undaki kimlik doğrulama profillerine depolar. Ayrıntılar: [Model sağlayıcıları](/tr/concepts/model-providers).

  </Accordion>

  <Accordion title="Günlük sohbetler için local bir model uygun mu?">
    Genellikle hayır. OpenClaw'ın büyük bağlama + güçlü güvenliğe ihtiyacı vardır; küçük kartlar keser ve sızdırır. Mecbur kalırsanız local olarak çalıştırabildiğiniz **en büyük** model build'ini (LM Studio) kullanın ve bkz. [/gateway/local-models](/tr/gateway/local-models). Daha küçük/kuantize modeller prompt injection riskini artırır - bkz. [Security](/tr/gateway/security).
  </Accordion>

  <Accordion title="Barındırılan model trafiğini belirli bir bölgede nasıl tutarım?">
    Bölgeye sabitlenmiş uç noktaları seçin. OpenRouter, MiniMax, Kimi ve GLM için ABD'de barındırılan seçenekler sunar; verileri bölgede tutmak için ABD'de barındırılan varyantı seçin. Seçtiğiniz bölgesel sağlayıcıya uyarak fallback'lerin kullanılabilir kalması için `models.mode: "merge"` kullanarak Anthropic/OpenAI'ı yine de bunların yanında listeleyebilirsiniz.
  </Accordion>

  <Accordion title="Bunu kurmak için Mac Mini almam gerekiyor mu?">
    Hayır. OpenClaw macOS veya Linux üzerinde çalışır (Windows için WSL2). Mac mini isteğe bağlıdır -
    bazı kişiler onu her zaman açık bir host olarak alır, ancak küçük bir VPS, ev sunucusu veya Raspberry Pi sınıfı bir kutu da işe yarar.

    Yalnızca **yalnızca macOS araçları** için bir Mac gerekir. iMessage için [BlueBubbles](/tr/channels/bluebubbles) kullanın (önerilir) - BlueBubbles sunucusu herhangi bir Mac üzerinde çalışır ve Gateway Linux'ta veya başka bir yerde çalışabilir. Başka yalnızca macOS araçları istiyorsanız, Gateway'i bir Mac üzerinde çalıştırın veya bir macOS Node eşleyin.

    Belgeler: [BlueBubbles](/tr/channels/bluebubbles), [Node'lar](/tr/nodes), [Mac remote mode](/tr/platforms/mac/remote).

  </Accordion>

  <Accordion title="iMessage desteği için Mac mini gerekiyor mu?">
    Messages'ta oturum açmış **bir tür macOS cihazına** ihtiyacınız var. Bunun Mac mini olması **gerekmez** -
    herhangi bir Mac olur. iMessage için **[BlueBubbles](/tr/channels/bluebubbles)** kullanın (önerilir) - BlueBubbles sunucusu macOS üzerinde çalışırken Gateway Linux'ta veya başka bir yerde çalışabilir.

    Yaygın kurulumlar:

    - Gateway'i Linux/VPS üzerinde çalıştırın, BlueBubbles sunucusunu ise Messages'ta oturum açmış herhangi bir Mac üzerinde çalıştırın.
    - En basit tek makine kurulumu için her şeyi Mac üzerinde çalıştırın.

    Belgeler: [BlueBubbles](/tr/channels/bluebubbles), [Node'lar](/tr/nodes),
    [Mac remote mode](/tr/platforms/mac/remote).

  </Accordion>

  <Accordion title="OpenClaw çalıştırmak için bir Mac mini alırsam, bunu MacBook Pro'ma bağlayabilir miyim?">
    Evet. **Mac mini Gateway'i çalıştırabilir**, MacBook Pro'nuz ise
    bir **Node** (eşlik eden cihaz) olarak bağlanabilir. Node'lar Gateway'i çalıştırmaz - onlar bu cihazda
    ekran/kamera/canvas ve `system.run` gibi ek yetenekler sağlar.

    Yaygın düzen:

    - Gateway Mac mini üzerinde (her zaman açık).
    - MacBook Pro, macOS uygulamasını veya bir Node host'unu çalıştırır ve Gateway ile eşleşir.
    - Bunu görmek için `openclaw nodes status` / `openclaw nodes list` kullanın.

    Belgeler: [Node'lar](/tr/nodes), [Node'lar CLI](/cli/nodes).

  </Accordion>

  <Accordion title="Bun kullanabilir miyim?">
    Bun **önerilmez**. Özellikle WhatsApp ve Telegram ile çalışma zamanı hataları görüyoruz.
    Kararlı Gateway'ler için **Node** kullanın.

    Yine de Bun ile denemek istiyorsanız, bunu WhatsApp/Telegram olmadan,
    production olmayan bir Gateway üzerinde yapın.

  </Accordion>

  <Accordion title="Telegram: allowFrom içine ne girer?">
    `channels.telegram.allowFrom`, **insan gönderenin Telegram kullanıcı kimliğidir** (sayısal). Bot kullanıcı adı değildir.

    Onboarding `@username` girişini kabul eder ve bunu sayısal kimliğe çözer, ancak OpenClaw yetkilendirmesi yalnızca sayısal kimlikleri kullanır.

    Daha güvenli (üçüncü taraf bot olmadan):

    - Botunuza DM gönderin, ardından `openclaw logs --follow` çalıştırın ve `from.id` değerini okuyun.

    Resmî Bot API:

    - Botunuza DM gönderin, ardından `https://api.telegram.org/bot<bot_token>/getUpdates` çağrısını yapın ve `message.from.id` değerini okuyun.

    Üçüncü taraf (daha az gizli):

    - `@userinfobot` veya `@getidsbot` hesabına DM gönderin.

    Bkz. [/channels/telegram](/tr/channels/telegram#access-control-and-activation).

  </Accordion>

  <Accordion title="Birden fazla kişi, farklı OpenClaw instance'larıyla tek bir WhatsApp numarasını kullanabilir mi?">
    Evet, **çoklu agent yönlendirmesi** ile. Her gönderenin WhatsApp **DM**'sini (`kind: "direct"` olan peer, `+15551234567` gibi gönderen E.164) farklı bir `agentId`'ye bağlayın; böylece her kişi kendi çalışma alanına ve oturum deposuna sahip olur. Yanıtlar yine **aynı WhatsApp hesabından** gelir ve DM erişim denetimi (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) WhatsApp hesabı başına globaldir. Bkz. [Çoklu Agent Yönlendirmesi](/tr/concepts/multi-agent) ve [WhatsApp](/tr/channels/whatsapp).
  </Accordion>

  <Accordion title='Bir "hızlı sohbet" agent'ı ve bir "kodlama için Opus" agent'ı çalıştırabilir miyim?'>
    Evet. Çoklu agent yönlendirmesi kullanın: her agent'a kendi varsayılan modelini verin, ardından gelen rotaları (sağlayıcı hesabı veya belirli peer'ler) her bir agent'a bağlayın. Örnek yapılandırma [Çoklu Agent Yönlendirmesi](/tr/concepts/multi-agent) bölümünde bulunur. Ayrıca bkz. [Modeller](/tr/concepts/models) ve [Yapılandırma](/tr/gateway/configuration).
  </Accordion>

  <Accordion title="Homebrew Linux'ta çalışır mı?">
    Evet. Homebrew, Linux'u (Linuxbrew) destekler. Hızlı kurulum:

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    OpenClaw'ı systemd ile çalıştırıyorsanız, servis PATH'inin `/home/linuxbrew/.linuxbrew/bin` (veya brew önekinizi) içerdiğinden emin olun; böylece `brew` ile kurulan araçlar giriş yapılmayan shell'lerde çözümlenebilir.
    Son build'ler ayrıca Linux systemd servislerinde yaygın kullanıcı bin dizinlerini başa ekler (örneğin `~/.local/bin`, `~/.npm-global/bin`, `~/.local/share/pnpm`, `~/.bun/bin`) ve ayarlı olduğunda `PNPM_HOME`, `NPM_CONFIG_PREFIX`, `BUN_INSTALL`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `NVM_DIR` ve `FNM_DIR` değerlerini dikkate alır.

  </Accordion>

  <Accordion title="Hackable git kurulumu ile npm install arasındaki fark">
    - **Hackable (git) kurulum:** tam kaynak checkout, düzenlenebilir, katkıda bulunanlar için en iyisi.
      Build'leri local olarak çalıştırırsınız ve kodu/belgeleri yamalayabilirsiniz.
    - **npm install:** global CLI kurulumu, repo yok, "yalnızca çalıştırmak" için en iyisi.
      Güncellemeler npm dist-tag'lerinden gelir.

    Belgeler: [Başlarken](/tr/start/getting-started), [Güncelleme](/tr/install/updating).

  </Accordion>

  <Accordion title="Daha sonra npm ve git kurulumları arasında geçiş yapabilir miyim?">
    Evet. Diğer türü yükleyin, ardından Gateway servisinin yeni entrypoint'e işaret etmesi için Doctor'ı çalıştırın.
    Bu **verilerinizi silmez** - yalnızca OpenClaw kod kurulumunu değiştirir. Durumunuz
    (`~/.openclaw`) ve çalışma alanınız (`~/.openclaw/workspace`) olduğu gibi kalır.

    npm'den git'e:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    openclaw doctor
    openclaw gateway restart
    ```

    git'ten npm'e:

    ```bash
    npm install -g openclaw@latest
    openclaw doctor
    openclaw gateway restart
    ```

    Doctor, bir Gateway servis entrypoint uyumsuzluğunu algılar ve servis yapılandırmasını mevcut kurulumla eşleşecek şekilde yeniden yazmayı önerir (otomasyonda `--repair` kullanın).

    Yedekleme ipuçları: bkz. [Yedekleme stratejisi](#diskte-öğelerin-bulunduğu-yer).

  </Accordion>

  <Accordion title="Gateway'i dizüstü bilgisayarımda mı yoksa bir VPS'te mi çalıştırmalıyım?">
    Kısa yanıt: **7/24 güvenilirlik istiyorsanız, bir VPS kullanın**. En düşük
    sürtünmeyi istiyorsanız ve uyku/yeniden başlatmalar sizin için sorun değilse, local olarak çalıştırın.

    **Dizüstü bilgisayar (local Gateway)**

    - **Artıları:** sunucu maliyeti yok, local dosyalara doğrudan erişim, canlı tarayıcı penceresi.
    - **Eksileri:** uyku/ağ kesilmeleri = bağlantı kopmaları, işletim sistemi güncellemeleri/yeniden başlatmalar kesintiye uğratır, uyanık kalması gerekir.

    **VPS / bulut**

    - **Artıları:** her zaman açık, kararlı ağ, dizüstü bilgisayar uyku sorunları yok, çalışır durumda tutmak daha kolay.
    - **Eksileri:** genellikle headless çalışır (ekran görüntüleri kullanın), yalnızca uzaktan dosya erişimi, güncellemeler için SSH kullanmanız gerekir.

    **OpenClaw'a özgü not:** WhatsApp/Telegram/Slack/Mattermost/Discord bir VPS'te gayet iyi çalışır. Tek gerçek ödünleşim **headless tarayıcı** ile görünür pencere arasındadır. Bkz. [Tarayıcı](/tr/tools/browser).

    **Önerilen varsayılan:** Daha önce Gateway bağlantı kopmaları yaşadıysanız VPS. Mac'i aktif kullanırken ve local dosya erişimi veya görünür tarayıcıyla UI otomasyonu istediğinizde local kullanım harikadır.

  </Accordion>

  <Accordion title="OpenClaw'ı özel bir makinede çalıştırmak ne kadar önemli?">
    Zorunlu değildir, ancak **güvenilirlik ve izolasyon için önerilir**.

    - **Özel host (VPS/Mac mini/Pi):** her zaman açık, daha az uyku/yeniden başlatma kesintisi, daha temiz izinler, çalışır durumda tutmak daha kolay.
    - **Paylaşılan dizüstü/masaüstü:** test ve aktif kullanım için tamamen uygundur, ancak makine uyuduğunda veya güncellendiğinde duraklamalar bekleyin.

    Her iki dünyanın en iyisini istiyorsanız, Gateway'i özel bir host üzerinde tutun ve local ekran/kamera/exec araçları için dizüstü bilgisayarınızı bir **Node** olarak eşleyin. Bkz. [Node'lar](/tr/nodes).
    Güvenlik yönergeleri için [Security](/tr/gateway/security) bölümünü okuyun.

  </Accordion>

  <Accordion title="Minimum VPS gereksinimleri ve önerilen işletim sistemi nedir?">
    OpenClaw hafiftir. Temel bir Gateway + bir sohbet kanalı için:

    - **Mutlak minimum:** 1 vCPU, 1GB RAM, ~500MB disk.
    - **Önerilen:** ek alan için 1-2 vCPU, 2GB RAM veya daha fazlası (günlükler, medya, birden fazla kanal). Node araçları ve tarayıcı otomasyonu kaynak tüketebilir.

    İşletim sistemi: **Ubuntu LTS** kullanın (veya herhangi bir modern Debian/Ubuntu). Linux kurulum yolu en iyi burada test edilmiştir.

    Belgeler: [Linux](/tr/platforms/linux), [VPS hosting](/tr/vps).

  </Accordion>

  <Accordion title="OpenClaw'ı bir VM içinde çalıştırabilir miyim ve gereksinimler nelerdir?">
    Evet. Bir VM'yi VPS ile aynı şekilde değerlendirin: her zaman açık olmalı, erişilebilir olmalı ve
    Gateway ile etkinleştirdiğiniz kanallar için yeterli RAM'e sahip olmalıdır.

    Temel rehberlik:

    - **Mutlak minimum:** 1 vCPU, 1GB RAM.
    - **Önerilen:** birden fazla kanal, tarayıcı otomasyonu veya medya araçları çalıştırıyorsanız 2GB RAM veya daha fazlası.
    - **İşletim sistemi:** Ubuntu LTS veya başka bir modern Debian/Ubuntu.

    Windows kullanıyorsanız, **WSL2 en kolay VM tarzı kurulumdur** ve en iyi araç
    uyumluluğuna sahiptir. Bkz. [Windows](/tr/platforms/windows), [VPS hosting](/tr/vps).
    macOS'u bir VM içinde çalıştırıyorsanız bkz. [macOS VM](/tr/install/macos-vm).

  </Accordion>
</AccordionGroup>

## OpenClaw nedir?

<AccordionGroup>
  <Accordion title="OpenClaw nedir, tek paragrafta?">
    OpenClaw, kendi cihazlarınızda çalıştırdığınız kişisel bir AI asistandır. Zaten kullandığınız mesajlaşma yüzeylerinde (WhatsApp, Telegram, Slack, Mattermost, Discord, Google Chat, Signal, iMessage, WebChat ve QQ Bot gibi bundled kanal Plugin'leri) yanıt verir ve desteklenen platformlarda ses + canlı Canvas da sunabilir. **Gateway** her zaman açık kontrol düzlemidir; asistan ürünün kendisidir.
  </Accordion>

  <Accordion title="Değer önerisi">
    OpenClaw, "sadece bir Claude sarmalayıcısı" değildir. Mevcut sohbet uygulamalarından erişilebilen,
    **kendi donanımınızda** yetenekli bir asistan çalıştırmanıza olanak tanıyan, durum bilgili
    oturumlar, bellek ve araçlarla birlikte, iş akışlarınızın kontrolünü barındırılan bir
    SaaS'e bırakmadan çalışan **local-first bir kontrol düzlemidir**.

    Öne çıkanlar:

    - **Sizin cihazlarınız, sizin verileriniz:** Gateway'i istediğiniz yerde çalıştırın (Mac, Linux, VPS) ve
      çalışma alanını + oturum geçmişini local tutun.
    - **Web sandbox'ı değil, gerçek kanallar:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage/vb.,
      ayrıca desteklenen platformlarda mobil ses ve Canvas.
    - **Model bağımsız:** Anthropic, OpenAI, MiniMax, OpenRouter vb. kullanın; agent başına yönlendirme
      ve failover ile.
    - **Yalnızca local seçenek:** isterseniz **tüm veriler cihazınızda kalabilsin** diye local modeller çalıştırın.
    - **Çoklu agent yönlendirmesi:** kanal, hesap veya görev başına ayrı agent'lar; her birinin kendi
      çalışma alanı ve varsayılanları vardır.
    - **Açık kaynak ve hackable:** inceleyin, genişletin ve satıcı bağımlılığı olmadan self-host edin.

    Belgeler: [Gateway](/tr/gateway), [Kanallar](/tr/channels), [Çoklu agent](/tr/concepts/multi-agent),
    [Bellek](/tr/concepts/memory).

  </Accordion>

  <Accordion title="Yeni kurdum - önce ne yapmalıyım?">
    Başlangıç için iyi projeler:

    - Bir web sitesi oluşturun (WordPress, Shopify veya basit bir statik site).
    - Bir mobil uygulama prototipi hazırlayın (taslak, ekranlar, API planı).
    - Dosya ve klasörleri düzenleyin (temizleme, adlandırma, etiketleme).
    - Gmail'i bağlayın ve özetleri veya takipleri otomatikleştirin.

    Büyük görevleri ele alabilir, ancak bunları aşamalara böldüğünüzde ve
    paralel çalışma için alt agent'lar kullandığınızda en iyi şekilde çalışır.

  </Accordion>

  <Accordion title="OpenClaw için en yaygın beş günlük kullanım senaryosu nedir?">
    Günlük kazanımlar genellikle şöyle görünür:

    - **Kişisel brifingler:** gelen kutunuzun, takviminizin ve önemsediğiniz haberlerin özetleri.
    - **Araştırma ve taslak hazırlama:** e-postalar veya belgeler için hızlı araştırma, özetler ve ilk taslaklar.
    - **Hatırlatıcılar ve takipler:** Cron veya Heartbeat ile çalışan dürtmeler ve kontrol listeleri.
    - **Tarayıcı otomasyonu:** formları doldurma, veri toplama ve web görevlerini tekrar etme.
    - **Cihazlar arası koordinasyon:** telefonunuzdan bir görev gönderin, Gateway bunu bir sunucuda çalıştırsın ve sonucu sohbette geri alın.

  </Accordion>

  <Accordion title="OpenClaw bir SaaS için lead gen, outreach, reklamlar ve bloglar konusunda yardımcı olabilir mi?">
    Evet, **araştırma, nitelendirme ve taslak hazırlama** için. Siteleri tarayabilir, kısa listeler oluşturabilir,
    potansiyel müşterileri özetleyebilir ve outreach veya reklam metni taslakları yazabilir.

    **Outreach veya reklam çalıştırmaları** için, bir insanı döngünün içinde tutun. Spam'den kaçının, yerel yasalara ve
    platform politikalarına uyun ve gönderilmeden önce her şeyi gözden geçirin. En güvenli model,
    OpenClaw'ın taslağı hazırlaması ve sizin onaylamanızdır.

    Belgeler: [Security](/tr/gateway/security).

  </Accordion>

  <Accordion title="Web geliştirme açısından Claude Code'a kıyasla avantajları nelerdir?">
    OpenClaw bir **kişisel asistan** ve koordinasyon katmanıdır, bir IDE alternatifi değildir. Bir repoda
    en hızlı doğrudan kodlama döngüsü için Claude Code veya Codex kullanın. Kalıcı bellek, cihazlar arası erişim
    ve araç orkestrasyonu istediğinizde OpenClaw kullanın.

    Avantajlar:

    - Oturumlar arasında **kalıcı bellek + çalışma alanı**
    - **Çok platformlu erişim** (WhatsApp, Telegram, TUI, WebChat)
    - **Araç orkestrasyonu** (tarayıcı, dosyalar, zamanlama, hook'lar)
    - **Her zaman açık Gateway** (bir VPS'te çalıştırın, her yerden etkileşim kurun)
    - local tarayıcı/ekran/kamera/exec için **Node'lar**

    Vitrin: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills ve otomasyon

<AccordionGroup>
  <Accordion title="Repoyu kirli tutmadan Skills'i nasıl özelleştiririm?">
    Repo kopyasını düzenlemek yerine yönetilen geçersiz kılmaları kullanın. Değişikliklerinizi `~/.openclaw/skills/<name>/SKILL.md` içine koyun (veya `~/.openclaw/openclaw.json` içinde `skills.load.extraDirs` aracılığıyla bir klasör ekleyin). Öncelik sırası `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → bundled → `skills.load.extraDirs` şeklindedir; böylece yönetilen geçersiz kılmalar git'e dokunmadan bundled Skills'in önüne geçer. Skill'in global olarak kurulu olmasını ama yalnızca bazı agent'lar tarafından görünmesini istiyorsanız, paylaşılan kopyayı `~/.openclaw/skills` içinde tutun ve görünürlüğü `agents.defaults.skills` ve `agents.list[].skills` ile kontrol edin. Yalnızca upstream'e uygun düzenlemeler repoda yaşamalı ve PR olarak gönderilmelidir.
  </Accordion>

  <Accordion title="Skills'i özel bir klasörden yükleyebilir miyim?">
    Evet. `~/.openclaw/openclaw.json` içinde `skills.load.extraDirs` aracılığıyla ek dizinler ekleyin (en düşük öncelik). Varsayılan öncelik sırası `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → bundled → `skills.load.extraDirs` şeklindedir. `clawhub`, varsayılan olarak `./skills` içine kurar; OpenClaw bunu bir sonraki oturumda `<workspace>/skills` olarak ele alır. Skill yalnızca belirli agent'lara görünür olmalıysa, bunu `agents.defaults.skills` veya `agents.list[].skills` ile eşleyin.
  </Accordion>

  <Accordion title="Farklı görevler için farklı modelleri nasıl kullanabilirim?">
    Bugün desteklenen modeller şunlardır:

    - **Cron işleri**: izole işler, iş başına bir `model` geçersiz kılması ayarlayabilir.
    - **Alt agent'lar**: görevleri farklı varsayılan modellere sahip ayrı agent'lara yönlendirin.
    - **İsteğe bağlı geçiş**: geçerli oturum modelini istediğiniz zaman değiştirmek için `/model` kullanın.

    Bkz. [Cron işleri](/tr/automation/cron-jobs), [Çoklu Agent Yönlendirmesi](/tr/concepts/multi-agent) ve [Slash komutları](/tr/tools/slash-commands).

  </Accordion>

  <Accordion title="Bot ağır iş yaparken donuyor. Bunu nasıl başka yere aktarabilirim?">
    Uzun veya paralel görevler için **alt agent'lar** kullanın. Alt agent'lar kendi oturumlarında çalışır,
    bir özet döndürür ve ana sohbetinizin yanıt vermeye devam etmesini sağlar.

    Botunuza "bu görev için bir alt agent oluştur" deyin veya `/subagents` kullanın.
    Gateway'in şu anda ne yaptığını (ve meşgul olup olmadığını) görmek için sohbette `/status` kullanın.

    Token ipucu: uzun görevler ve alt agent'ların ikisi de token tüketir. Maliyet sizin için önemliyse,
    `agents.defaults.subagents.model` aracılığıyla alt agent'lar için daha ucuz bir model ayarlayın.

    Belgeler: [Alt agent'lar](/tr/tools/subagents), [Arka plan görevleri](/tr/automation/tasks).

  </Accordion>

  <Accordion title="Discord'da thread'e bağlı subagent oturumları nasıl çalışır?">
    Thread bağlamalarını kullanın. Bir Discord thread'ini bir subagent'a veya oturum hedefine bağlayabilirsiniz; böylece o thread içindeki takip mesajları bağlı oturumda kalır.

    Temel akış:

    - `sessions_spawn` ile `thread: true` kullanarak oluşturun (ve isteğe bağlı olarak kalıcı takip için `mode: "session"`).
    - Veya `/focus <target>` ile manuel olarak bağlayın.
    - Bağlama durumunu incelemek için `/agents` kullanın.
    - Otomatik odak kaldırmayı denetlemek için `/session idle <duration|off>` ve `/session max-age <duration|off>` kullanın.
    - Thread'in bağlantısını kaldırmak için `/unfocus` kullanın.

    Gerekli yapılandırma:

    - Global varsayılanlar: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
    - Discord geçersiz kılmaları: `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours`.
    - Oluşturma sırasında otomatik bağlama: `channels.discord.threadBindings.spawnSubagentSessions: true` ayarlayın.

    Belgeler: [Alt agent'lar](/tr/tools/subagents), [Discord](/tr/channels/discord), [Yapılandırma Başvurusu](/tr/gateway/configuration-reference), [Slash komutları](/tr/tools/slash-commands).

  </Accordion>

  <Accordion title="Bir alt agent tamamlandı, ancak tamamlanma güncellemesi yanlış yere gitti veya hiç gönderilmedi. Neyi kontrol etmeliyim?">
    Önce çözümlenen requester rotasını kontrol edin:

    - Tamamlanma modundaki alt agent teslimi, varsa bağlı herhangi bir thread veya konuşma rotasını tercih eder.
    - Tamamlanma kökeni yalnızca bir kanal taşıyorsa, OpenClaw doğrudan teslimatın yine de başarılı olabilmesi için requester oturumunun depolanmış rotasına (`lastChannel` / `lastTo` / `lastAccountId`) fallback yapar.
    - Ne bağlı bir rota ne de kullanılabilir bir depolanmış rota varsa, doğrudan teslimat başarısız olabilir ve sonuç sohbete hemen gönderilmek yerine queued oturum teslimine fallback yapar.
    - Geçersiz veya bayat hedefler yine de kuyruk fallback'ini veya nihai teslimat hatasını zorlayabilir.
    - Child'ın son görünür assistant yanıtı tam olarak sessiz token `NO_REPLY` / `no_reply` ise veya tam olarak `ANNOUNCE_SKIP` ise, OpenClaw eski önceki ilerlemeyi göndermek yerine duyuruyu kasıtlı olarak bastırır.
    - Child yalnızca araç çağrılarından sonra zaman aşımına uğradıysa, duyuru ham araç çıktısını yeniden oynatmak yerine bunu kısa bir kısmi ilerleme özetine dönüştürebilir.

    Hata ayıklama:

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    Belgeler: [Alt agent'lar](/tr/tools/subagents), [Arka plan görevleri](/tr/automation/tasks), [Oturum Araçları](/tr/concepts/session-tool).

  </Accordion>

  <Accordion title="Cron veya hatırlatıcılar tetiklenmiyor. Neyi kontrol etmeliyim?">
    Cron, Gateway işlemi içinde çalışır. Gateway sürekli çalışmıyorsa,
    zamanlanmış işler çalışmaz.

    Kontrol listesi:

    - Cron'un etkin olduğunu doğrulayın (`cron.enabled`) ve `OPENCLAW_SKIP_CRON` ayarlı olmasın.
    - Gateway'in 7/24 çalıştığını kontrol edin (uyku/yeniden başlatma olmadan).
    - İş için saat dilimi ayarlarını doğrulayın (`--tz` ile host saat dilimi).

    Hata ayıklama:

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    Belgeler: [Cron işleri](/tr/automation/cron-jobs), [Otomasyon ve Görevler](/tr/automation).

  </Accordion>

  <Accordion title="Cron tetiklendi, ama kanala hiçbir şey gönderilmedi. Neden?">
    Önce teslim modunu kontrol edin:

    - `--no-deliver` / `delivery.mode: "none"` dış mesaj beklenmediği anlamına gelir.
    - Eksik veya geçersiz duyuru hedefi (`channel` / `to`), çalıştırıcının dışa teslimatı atladığı anlamına gelir.
    - Kanal kimlik doğrulama hataları (`unauthorized`, `Forbidden`), çalıştırıcının teslim etmeyi denediği ancak kimlik bilgilerinin bunu engellediği anlamına gelir.
    - Sessiz bir izole sonuç (`NO_REPLY` / `no_reply` yalnızca) kasıtlı olarak teslim edilemez kabul edilir, bu yüzden çalıştırıcı queued fallback teslimatını da bastırır.

    İzole Cron işleri için nihai teslimattan çalıştırıcı sorumludur. Agent'ın
    çalıştırıcının göndermesi için düz metin bir özet döndürmesi beklenir. `--no-deliver`,
    bu sonucu dahili tutar; bunun yerine agent'ın message aracıyla doğrudan göndermesine
    izin vermez.

    Hata ayıklama:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Belgeler: [Cron işleri](/tr/automation/cron-jobs), [Arka plan görevleri](/tr/automation/tasks).

  </Accordion>

  <Accordion title="İzole bir Cron çalıştırması neden model değiştirdi veya bir kez yeniden denedi?">
    Bu genellikle yinelenen zamanlama değil, canlı model değiştirme yoludur.

    İzole Cron, etkin çalıştırma
    `LiveSessionModelSwitchError` fırlattığında çalışma zamanı model devrini kalıcı hale getirebilir ve yeniden deneyebilir. Yeniden deneme, değiştirilen
    sağlayıcıyı/modeli korur ve değişim yeni bir kimlik doğrulama profili geçersiz kılması taşıdıysa, Cron
    yeniden denemeden önce bunu da kalıcı hale getirir.

    İlgili seçim kuralları:

    - Uygulanabiliyorsa önce Gmail hook model geçersiz kılması kazanır.
    - Sonra iş başına `model`.
    - Sonra depolanmış herhangi bir Cron oturumu model geçersiz kılması.
    - Sonra normal agent/varsayılan model seçimi.

    Yeniden deneme döngüsü sınırlıdır. İlk deneme artı 2 değiştirme yeniden denemesinden sonra
    Cron sonsuza kadar döngüye girmek yerine iptal eder.

    Hata ayıklama:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Belgeler: [Cron işleri](/tr/automation/cron-jobs), [cron CLI](/cli/cron).

  </Accordion>

  <Accordion title="Linux'ta Skills'i nasıl yüklerim?">
    Native `openclaw skills` komutlarını kullanın veya Skills'i çalışma alanınıza bırakın. macOS Skills UI Linux'ta mevcut değildir.
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

    Native `openclaw skills install`, etkin çalışma alanındaki `skills/`
    dizinine yazar. Ayrı `clawhub` CLI'ı yalnızca kendi Skills'inizi yayımlamak veya
    eşitlemek istiyorsanız yükleyin. Agent'lar arasında paylaşılan kurulumlar için Skill'i
    `~/.openclaw/skills` altına koyun ve hangi agent'ların görebileceğini daraltmak istiyorsanız
    `agents.defaults.skills` veya `agents.list[].skills` kullanın.

  </Accordion>

  <Accordion title="OpenClaw görevleri zamanlamaya göre veya arka planda sürekli çalıştırabilir mi?">
    Evet. Gateway zamanlayıcısını kullanın:

    - Zamanlanmış veya yinelenen görevler için **Cron işleri** (yeniden başlatmalardan sonra da kalıcıdır).
    - "Ana oturum" için periyodik kontrollerde **Heartbeat**.
    - Özetler gönderen veya sohbetlere teslim eden otonom agent'lar için **izole işler**.

    Belgeler: [Cron işleri](/tr/automation/cron-jobs), [Otomasyon ve Görevler](/tr/automation),
    [Heartbeat](/tr/gateway/heartbeat).

  </Accordion>

  <Accordion title="Apple'a ait yalnızca macOS Skills'i Linux'tan çalıştırabilir miyim?">
    Doğrudan değil. macOS Skills'i `metadata.openclaw.os` ve gerekli binary'ler tarafından kapatılır ve Skills sistem isteminde yalnızca **Gateway host'u** üzerinde uygun olduklarında görünür. Linux'ta `darwin`-only Skills (`apple-notes`, `apple-reminders`, `things-mac` gibi), kapatmayı geçersiz kılmadığınız sürece yüklenmez.

    Desteklenen üç model vardır:

    **Seçenek A - Gateway'i bir Mac üzerinde çalıştırın (en basit).**
    Gateway'i macOS binary'lerinin bulunduğu yerde çalıştırın, ardından Linux'tan [remote modda](#gateway-portları-zaten-çalışıyor-ve-remote-mod) veya Tailscale üzerinden bağlanın. Skills normal şekilde yüklenir çünkü Gateway host'u macOS'tur.

    **Seçenek B - bir macOS Node kullanın (SSH yok).**
    Gateway'i Linux üzerinde çalıştırın, bir macOS Node'u (menubar uygulaması) eşleyin ve Mac üzerinde **Node Run Commands** ayarını "Always Ask" veya "Always Allow" yapın. OpenClaw, gerekli binary'ler Node üzerinde varsa yalnızca macOS Skills'i uygun kabul edebilir. Agent bu Skills'i `nodes` aracıyla çalıştırır. "Always Ask" seçerseniz, istemde "Always Allow" onayı o komutu allowlist'e ekler.

    **Seçenek C - macOS binary'lerini SSH üzerinden proxy'leyin (ileri düzey).**
    Gateway'i Linux üzerinde tutun, ancak gerekli CLI binary'lerinin bir Mac üzerinde çalışan SSH sarmalayıcılarına çözümlenmesini sağlayın. Sonra Skill'i Linux'a izin verecek şekilde geçersiz kılın ki uygun kalsın.

    1. Binary için bir SSH sarmalayıcısı oluşturun (örnek: Apple Notes için `memo`):

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. Sarmalayıcıyı Linux host'unda `PATH` üzerine koyun (örneğin `~/bin/memo`).
    3. Skill metadata'sını geçersiz kılarak Linux'a izin verin (çalışma alanı veya `~/.openclaw/skills`):

       ```markdown
       ---
       name: apple-notes
       description: macOS üzerinde memo CLI aracılığıyla Apple Notes'u yönetin.
       metadata: { "openclaw": { "os": ["darwin", "linux"], "requires": { "bins": ["memo"] } } }
       ---
       ```

    4. Skills anlık görüntüsü yenilensin diye yeni bir oturum başlatın.

  </Accordion>

  <Accordion title="Notion veya HeyGen entegrasyonunuz var mı?">
    Bugün yerleşik olarak yok.

    Seçenekler:

    - **Özel Skill / Plugin:** güvenilir API erişimi için en iyisi (Notion/HeyGen'in ikisinin de API'si vardır).
    - **Tarayıcı otomasyonu:** kod gerektirmez ama daha yavaştır ve daha kırılgandır.

    Bağlamı müşteri bazında tutmak istiyorsanız (ajans iş akışları), basit bir model şudur:

    - Müşteri başına bir Notion sayfası (bağlam + tercihler + aktif işler).
    - Agent'tan oturumun başında o sayfayı getirmesini isteyin.

    Native bir entegrasyon istiyorsanız, bir özellik isteği açın veya
    bu API'leri hedefleyen bir Skill oluşturun.

    Skills yükleme:

    ```bash
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    Native kurulumlar etkin çalışma alanındaki `skills/` dizinine iner. Agent'lar arasında paylaşılan Skills için bunları `~/.openclaw/skills/<name>/SKILL.md` içine yerleştirin. Paylaşılan kurulumu yalnızca bazı agent'lar görmeliysa `agents.defaults.skills` veya `agents.list[].skills` yapılandırın. Bazı Skills, Homebrew ile kurulan binary'ler bekler; Linux'ta bu Linuxbrew anlamına gelir (yukarıdaki Homebrew Linux SSS girdisine bakın). Bkz. [Skills](/tr/tools/skills), [Skills yapılandırması](/tr/tools/skills-config) ve [ClawHub](/tr/tools/clawhub).

  </Accordion>

  <Accordion title="Mevcut oturumu açık Chrome'umu OpenClaw ile nasıl kullanırım?">
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

    Bu yol host-local'dir. Gateway başka yerde çalışıyorsa, ya tarayıcı makinesinde bir Node host çalıştırın ya da bunun yerine remote CDP kullanın.

    `existing-session` / `user` üzerindeki mevcut sınırlamalar:

    - eylemler CSS selector tabanlı değil, ref tabanlıdır
    - yüklemeler `ref` / `inputRef` gerektirir ve şu anda bir seferde bir dosyayı destekler
    - `responsebody`, PDF dışa aktarma, indirme yakalama ve toplu eylemler için hâlâ yönetilen bir tarayıcı veya ham CDP profili gerekir

  </Accordion>
</AccordionGroup>

## Sandbox ve bellek

<AccordionGroup>
  <Accordion title="Ayrı bir sandboxing belgesi var mı?">
    Evet. Bkz. [Sandboxing](/tr/gateway/sandboxing). Docker'a özgü kurulum için (Docker içinde tam Gateway veya sandbox imajları), bkz. [Docker](/tr/install/docker).
  </Accordion>

  <Accordion title="Docker sınırlı hissettiriyor - tam özellikleri nasıl etkinleştiririm?">
    Varsayılan imaj güvenlik odaklıdır ve `node` kullanıcısı olarak çalışır; bu nedenle
    sistem paketlerini, Homebrew'u veya bundled tarayıcıları içermez. Daha tam bir kurulum için:

    - Önbelleklerin kalıcı olması için `/home/node` dizinini `OPENCLAW_HOME_VOLUME` ile kalıcılaştırın.
    - `OPENCLAW_DOCKER_APT_PACKAGES` ile sistem bağımlılıklarını imajın içine bake edin.
    - Bundled CLI üzerinden Playwright tarayıcılarını yükleyin:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - `PLAYWRIGHT_BROWSERS_PATH` ayarlayın ve yolun kalıcı olduğundan emin olun.

    Belgeler: [Docker](/tr/install/docker), [Tarayıcı](/tr/tools/browser).

  </Accordion>

  <Accordion title="DM'leri kişisel tutup grupları herkese açık/sandbox'lı tek bir agent ile yapabilir miyim?">
    Evet - özel trafiğiniz **DM'ler**, genel trafiğiniz **gruplar** ise.

    `agents.defaults.sandbox.mode: "non-main"` kullanın; böylece grup/kanal oturumları (non-main anahtarlar) Docker içinde çalışırken ana DM oturumu host üzerinde kalır. Sonra sandbox'lı oturumlarda hangi araçların kullanılabildiğini `tools.sandbox.tools` ile kısıtlayın.

    Kurulum adımları + örnek yapılandırma: [Gruplar: kişisel DM'ler + herkese açık gruplar](/tr/channels/groups#pattern-personal-dms-public-groups-single-agent)

    Ana yapılandırma başvurusu: [Gateway yapılandırması](/tr/gateway/configuration-reference#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="Bir host klasörünü sandbox içine nasıl bağlarım?">
    `agents.defaults.sandbox.docker.binds` değerini `["host:path:mode"]` olarak ayarlayın (ör. `"/home/user/src:/src:ro"`). Global + agent başına bağlamalar birleştirilir; agent başına bağlamalar `scope: "shared"` olduğunda yok sayılır. Hassas her şey için `:ro` kullanın ve bağlamaların sandbox dosya sistemi duvarlarını aştığını unutmayın.

    OpenClaw, bind kaynaklarını hem normalize edilmiş yol hem de en derin mevcut ata üzerinden çözümlenen canonical yol karşısında doğrular. Bu, son yol segmenti henüz mevcut olmadığında bile symlink-parent kaçışlarının fail closed olacağı ve symlink çözümlemesinden sonra da izin verilen kök kontrollerinin geçerli olacağı anlamına gelir.

    Örnekler ve güvenlik notları için [Sandboxing](/tr/gateway/sandboxing#custom-bind-mounts) ve [Sandbox vs Tool Policy vs Elevated](/tr/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check) bölümlerine bakın.

  </Accordion>

  <Accordion title="Bellek nasıl çalışır?">
    OpenClaw belleği, agent çalışma alanındaki yalnızca Markdown dosyalarından oluşur:

    - `memory/YYYY-MM-DD.md` içindeki günlük notlar
    - `MEMORY.md` içindeki derlenmiş uzun vadeli notlar (yalnızca ana/özel oturumlar)

    OpenClaw ayrıca modele, otomatik Compaction öncesinde kalıcı notlar yazmasını hatırlatmak için
    **sessiz bir pre-Compaction bellek flush** çalıştırır. Bu yalnızca çalışma alanı
    yazılabilir olduğunda çalışır (salt okunur sandbox'lar bunu atlar). Bkz. [Bellek](/tr/concepts/memory).

  </Accordion>

  <Accordion title="Bellek bir şeyleri unutup duruyor. Bunu nasıl kalıcı hale getiririm?">
    Bottan **gerçeği belleğe yazmasını** isteyin. Uzun vadeli notlar `MEMORY.md` içine,
    kısa vadeli bağlam ise `memory/YYYY-MM-DD.md` içine gitmelidir.

    Bu hâlâ geliştirdiğimiz bir alan. Modele anıları saklamasını hatırlatmak yardımcı olur;
    ne yapacağını bilir. Hâlâ unutuyorsa, Gateway'in her çalıştırmada aynı
    çalışma alanını kullandığını doğrulayın.

    Belgeler: [Bellek](/tr/concepts/memory), [Agent çalışma alanı](/tr/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Bellek sonsuza kadar kalır mı? Sınırlar nelerdir?">
    Bellek dosyaları diskte yaşar ve siz silene kadar kalır. Sınır model değil,
    depolama alanınızdır. **Oturum bağlamı** yine de modelin bağlam
    penceresiyle sınırlıdır, bu yüzden uzun konuşmalar compact olabilir veya kesilebilir. Bu yüzden
    bellek araması vardır - yalnızca ilgili parçaları yeniden bağlama çeker.

    Belgeler: [Bellek](/tr/concepts/memory), [Bağlam](/tr/concepts/context).

  </Accordion>

  <Accordion title="Anlamsal bellek araması için OpenAI API anahtarı gerekir mi?">
    Yalnızca **OpenAI embedding'lerini** kullanıyorsanız. Codex OAuth sohbet/tamamlama işlemlerini kapsar ve
    embedding erişimi vermez; dolayısıyla **Codex ile oturum açmak (OAuth veya
    Codex CLI oturumu açma)** anlamsal bellek aramasına yardımcı olmaz. OpenAI embedding'leri
    için yine de gerçek bir API anahtarı gerekir (`OPENAI_API_KEY` veya `models.providers.openai.apiKey`).

    Açıkça bir sağlayıcı ayarlamazsanız, OpenClaw bir API anahtarını çözümleyebildiğinde
    otomatik olarak bir sağlayıcı seçer (kimlik doğrulama profilleri, `models.providers.*.apiKey` veya ortam değişkenleri).
    Bir OpenAI anahtarı çözümlenirse OpenAI'ı, aksi halde bir Gemini anahtarı
    çözümlenirse Gemini'yi, sonra Voyage'ı, ardından Mistral'i tercih eder. Kullanılabilir uzak anahtar yoksa, bellek
    araması siz onu yapılandırana kadar devre dışı kalır. Yapılandırılmış ve mevcut bir local model yolu varsa, OpenClaw
    `local`'i tercih eder. `memorySearch.provider = "ollama"` ayarını açıkça
    yaptığınızda Ollama desteklenir.

    Local kalmayı tercih ediyorsanız, `memorySearch.provider = "local"` ayarlayın (ve isteğe bağlı olarak
    `memorySearch.fallback = "none"`). Gemini embedding'leri istiyorsanız,
    `memorySearch.provider = "gemini"` ayarlayın ve `GEMINI_API_KEY` (veya
    `memorySearch.remote.apiKey`) sağlayın. **OpenAI, Gemini, Voyage, Mistral, Ollama veya local** embedding
    modellerini destekliyoruz - kurulum ayrıntıları için bkz. [Bellek](/tr/concepts/memory).

  </Accordion>
</AccordionGroup>

## Diskte öğelerin bulunduğu yer

<AccordionGroup>
  <Accordion title="OpenClaw ile kullanılan tüm veriler local olarak mı kaydedilir?">
    Hayır - **OpenClaw'ın durumu local'dir**, ancak **harici servisler onlara gönderdiğiniz şeyleri yine de görür**.

    - **Varsayılan olarak local:** oturumlar, bellek dosyaları, yapılandırma ve çalışma alanı Gateway host'unda yaşar
      (`~/.openclaw` + çalışma alanı dizininiz).
    - **Zorunlu olarak uzak:** model sağlayıcılarına (Anthropic/OpenAI/vb.) gönderdiğiniz mesajlar
      onların API'lerine gider ve sohbet platformları (WhatsApp/Telegram/Slack/vb.) mesaj verilerini kendi
      sunucularında depolar.
    - **Ayak izini siz kontrol edersiniz:** local modeller kullanmak istemleri makinenizde tutar, ancak kanal
      trafiği yine de kanalın sunucularından geçer.

    İlgili: [Agent çalışma alanı](/tr/concepts/agent-workspace), [Bellek](/tr/concepts/memory).

  </Accordion>

  <Accordion title="OpenClaw verilerini nerede depolar?">
    Her şey `$OPENCLAW_STATE_DIR` altında yaşar (varsayılan: `~/.openclaw`):

    | Path                                                            | Amaç                                                               |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | Ana yapılandırma (JSON5)                                           |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | Eski OAuth içe aktarma dosyası (ilk kullanımda auth profillerine kopyalanır) |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | Auth profilleri (OAuth, API anahtarları ve isteğe bağlı `keyRef`/`tokenRef`) |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | `file` SecretRef sağlayıcıları için isteğe bağlı dosya destekli secret payload |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | Eski uyumluluk dosyası (statik `api_key` girdileri temizlenmiş)    |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | Sağlayıcı durumu (ör. `whatsapp/<accountId>/creds.json`)           |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | Agent başına durum (agentDir + oturumlar)                          |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | Konuşma geçmişi ve durum (agent başına)                            |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | Oturum metadata'sı (agent başına)                                  |

    Eski tek-agent yolu: `~/.openclaw/agent/*` (`openclaw doctor` tarafından migrate edilir).

    **Çalışma alanınız** (AGENTS.md, bellek dosyaları, Skills vb.) ayrıdır ve `agents.defaults.workspace` ile yapılandırılır (varsayılan: `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title="AGENTS.md / SOUL.md / USER.md / MEMORY.md nerede bulunmalı?">
    Bu dosyalar `~/.openclaw` içinde değil, **agent çalışma alanında** bulunur.

    - **Çalışma alanı (agent başına)**: `AGENTS.md`, `SOUL.md`, `IDENTITY.md`, `USER.md`,
      `MEMORY.md` (veya `MEMORY.md` yoksa eski fallback `memory.md`),
      `memory/YYYY-MM-DD.md`, isteğe bağlı `HEARTBEAT.md`.
    - **Durum dizini (`~/.openclaw`)**: yapılandırma, kanal/sağlayıcı durumu, auth profilleri, oturumlar, günlükler
      ve paylaşılan Skills (`~/.openclaw/skills`).

    Varsayılan çalışma alanı `~/.openclaw/workspace` dizinidir, şu yolla yapılandırılabilir:

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    Bot yeniden başlatmadan sonra "unutuyorsa", Gateway'in her başlatmada aynı
    çalışma alanını kullandığını doğrulayın (ve unutmayın: remote mod,
    local dizüstü bilgisayarınızı değil **Gateway host'unun** çalışma alanını kullanır).

    İpucu: kalıcı bir davranış veya tercih istiyorsanız, botun buna güvenmek yerine
    **AGENTS.md veya MEMORY.md içine yazmasını** isteyin.

    Bkz. [Agent çalışma alanı](/tr/concepts/agent-workspace) ve [Bellek](/tr/concepts/memory).

  </Accordion>

  <Accordion title="Önerilen yedekleme stratejisi">
    **Agent çalışma alanınızı** özel bir git reposuna koyun ve özel bir yere
    yedekleyin (örneğin GitHub private). Bu, bellek + AGENTS/SOUL/USER
    dosyalarını yakalar ve daha sonra asistanın "zihnini" geri yüklemenizi sağlar.

    `~/.openclaw` altındaki hiçbir şeyi commit etmeyin (kimlik bilgileri, oturumlar, token'lar veya şifrelenmiş secret payload'ları).
    Tam geri yükleme gerekiyorsa, çalışma alanını ve durum dizinini
    ayrı ayrı yedekleyin (yukarıdaki taşıma sorusuna bakın).

    Belgeler: [Agent çalışma alanı](/tr/concepts/agent-workspace).

  </Accordion>

  <Accordion title="OpenClaw'ı tamamen nasıl kaldırırım?">
    Ayrı rehbere bakın: [Kaldırma](/tr/install/uninstall).
  </Accordion>

  <Accordion title="Agent'lar çalışma alanının dışında çalışabilir mi?">
    Evet. Çalışma alanı katı bir sandbox değil, **varsayılan cwd** ve bellek dayanağıdır.
    Göreli yollar çalışma alanı içinde çözülür, ancak mutlak yollar diğer
    host konumlarına erişebilir; sandboxing etkinse durum değişir. İzolasyona ihtiyacınız varsa,
    [`agents.defaults.sandbox`](/tr/gateway/sandboxing) veya agent başına sandbox ayarlarını kullanın. Bir
    repoyu varsayılan çalışma dizini yapmak istiyorsanız, o agent'ın
    `workspace` değerini repo köküne yöneltin. OpenClaw repo'su yalnızca kaynak koddur; agent'ın
    bilinçli olarak onun içinde çalışmasını istemiyorsanız çalışma alanını ayrı tutun.

    Örnek (varsayılan cwd olarak repo):

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

  <Accordion title="Remote mod: oturum deposu nerede?">
    Oturum durumu **Gateway host'una** aittir. Remote moddaysanız, önemsediğiniz oturum deposu local dizüstü bilgisayarınızda değil, uzak makinededir. Bkz. [Oturum yönetimi](/tr/concepts/session).
  </Accordion>
</AccordionGroup>

## Temel yapılandırma

<AccordionGroup>
  <Accordion title="Yapılandırma hangi biçimde? Nerede?">
    OpenClaw, `$OPENCLAW_CONFIG_PATH` konumundan isteğe bağlı bir **JSON5** yapılandırması okur (varsayılan: `~/.openclaw/openclaw.json`):

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    Dosya yoksa güvenli sayılabilecek varsayılanları kullanır (varsayılan çalışma alanı olarak `~/.openclaw/workspace` dahil).

  </Accordion>

  <Accordion title='gateway.bind: "lan" (veya "tailnet") ayarladım, şimdi hiçbir şey dinlemiyor / UI yetkisiz diyor'>
    Loopback olmayan bind'ler **geçerli bir gateway auth yolu gerektirir**. Pratikte bunun anlamı şudur:

    - paylaşılan gizli anahtar kimlik doğrulaması: token veya parola
    - doğru yapılandırılmış loopback olmayan, kimlik farkındalıklı reverse proxy arkasında `gateway.auth.mode: "trusted-proxy"`

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

    - `gateway.remote.token` / `.password` tek başına local Gateway kimlik doğrulamasını etkinleştirmez.
    - Local çağrı yolları, yalnızca `gateway.auth.*` ayarsız olduğunda `gateway.remote.*` değerlerini fallback olarak kullanabilir.
    - Parola kimlik doğrulaması için bunun yerine `gateway.auth.mode: "password"` artı `gateway.auth.password` (veya `OPENCLAW_GATEWAY_PASSWORD`) ayarlayın.
    - `gateway.auth.token` / `gateway.auth.password`, SecretRef aracılığıyla açıkça yapılandırılmışsa ve çözümlenemiyorsa çözümleme fail closed olur (örtücü remote fallback yoktur).
    - Paylaşılan gizli anahtarlı Control UI kurulumları `connect.params.auth.token` veya `connect.params.auth.password` üzerinden kimlik doğrular (uygulama/UI ayarlarında depolanır). Tailscale Serve veya `trusted-proxy` gibi kimlik taşıyan modlar bunun yerine istek başlıklarını kullanır. Paylaşılan gizli anahtarları URL'lere koymaktan kaçının.
    - `gateway.auth.mode: "trusted-proxy"` ile aynı host üzerindeki loopback reverse proxy'leri trusted-proxy kimlik doğrulamasını yine de karşılamaz. Trusted proxy, yapılandırılmış bir loopback olmayan kaynak olmalıdır.

  </Accordion>

  <Accordion title="Şimdi localhost üzerinde neden token gerekiyor?">
    OpenClaw, loopback dahil olmak üzere varsayılan olarak gateway auth uygular. Normal varsayılan yolda bu token kimlik doğrulaması anlamına gelir: açık bir auth yolu yapılandırılmamışsa, Gateway başlangıcı token moduna çözülür ve otomatik olarak bir token üretip bunu `gateway.auth.token` içine kaydeder, dolayısıyla **local WS istemcileri kimlik doğrulamalıdır**. Bu, diğer local işlemlerin Gateway'i çağırmasını engeller.

    Farklı bir auth yolu tercih ediyorsanız, parola modunu (veya loopback olmayan kimlik farkındalıklı reverse proxy'ler için `trusted-proxy`) açıkça seçebilirsiniz. **Gerçekten** açık loopback istiyorsanız, yapılandırmanızda `gateway.auth.mode: "none"` değerini açıkça ayarlayın. Doctor sizin için istediğiniz zaman bir token üretebilir: `openclaw doctor --generate-gateway-token`.

  </Accordion>

  <Accordion title="Yapılandırmayı değiştirdikten sonra yeniden başlatmam gerekir mi?">
    Gateway, yapılandırmayı izler ve hot-reload destekler:

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

    - `off`: slogan metnini gizler ancak banner başlık/sürüm satırını korur.
    - `default`: her seferinde `All your chats, one OpenClaw.` kullanır.
    - `random`: dönen komik/mevsimsel sloganlar (varsayılan davranış).
    - Hiç banner istemiyorsanız `OPENCLAW_HIDE_BANNER=1` ortam değişkenini ayarlayın.

  </Accordion>

  <Accordion title="Web aramayı (ve web fetch'i) nasıl etkinleştiririm?">
    `web_fetch` API anahtarı olmadan çalışır. `web_search`, seçtiğiniz
    sağlayıcıya bağlıdır:

    - Brave, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Perplexity ve Tavily gibi API destekli sağlayıcılar normal API anahtarı kurulumlarını gerektirir.
    - Ollama Web Search anahtarsızdır, ancak yapılandırdığınız Ollama host'unu kullanır ve `ollama signin` gerektirir.
    - DuckDuckGo anahtarsızdır, ancak gayriresmî HTML tabanlı bir entegrasyondur.
    - SearXNG anahtarsız/self-hosted'dır; `SEARXNG_BASE_URL` veya `plugins.entries.searxng.config.webSearch.baseUrl` yapılandırın.

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
              provider: "firecrawl", // isteğe bağlı; otomatik algılama için çıkarın
            },
          },
        },
    }
    ```

    Sağlayıcıya özgü web-search yapılandırması artık `plugins.entries.<plugin>.config.webSearch.*` altında bulunur.
    Eski `tools.web.search.*` sağlayıcı yolları uyumluluk için geçici olarak hâlâ yüklenir, ancak yeni yapılandırmalarda kullanılmamalıdır.
    Firecrawl web-fetch fallback yapılandırması `plugins.entries.firecrawl.config.webFetch.*` altında bulunur.

    Notlar:

    - Allowlist kullanıyorsanız `web_search`/`web_fetch`/`x_search` veya `group:web` ekleyin.
    - `web_fetch` varsayılan olarak etkindir (açıkça devre dışı bırakılmadıkça).
    - `tools.web.fetch.provider` belirtilmezse OpenClaw, mevcut kimlik bilgilerinden hazır olan ilk fetch fallback sağlayıcısını otomatik algılar. Bugün bundled sağlayıcı Firecrawl'dır.
    - Daemon'lar ortam değişkenlerini `~/.openclaw/.env` dosyasından (veya servis ortamından) okur.

    Belgeler: [Web araçları](/tr/tools/web).

  </Accordion>

  <Accordion title="config.apply yapılandırmamı sildi. Bunu nasıl kurtarır ve önlerim?">
    `config.apply`, **tüm yapılandırmayı** değiştirir. Kısmi bir nesne gönderirseniz, diğer
    her şey kaldırılır.

    Kurtarma:

    - Yedekten geri yükleyin (git veya kopyalanmış bir `~/.openclaw/openclaw.json`).
    - Yedeğiniz yoksa `openclaw doctor` yeniden çalıştırın ve kanalları/modelleri yeniden yapılandırın.
    - Bu beklenmedik bir durumsa bir hata bildirin ve bilinen son yapılandırmanızı veya herhangi bir yedeği ekleyin.
    - Local bir kodlama agent'ı, günlüklerden veya geçmişten çalışan bir yapılandırmayı çoğu zaman yeniden kurabilir.

    Önleme:

    - Küçük değişiklikler için `openclaw config set` kullanın.
    - Etkileşimli düzenlemeler için `openclaw configure` kullanın.
    - Tam yol veya alan şekli konusunda emin değilseniz önce `config.schema.lookup` kullanın; sığ bir şema düğümüyle birlikte daha derine inmek için doğrudan alt özetlerini döndürür.
    - Kısmi RPC düzenlemeleri için `config.patch` kullanın; `config.apply` yalnızca tam yapılandırma değiştirme için kalsın.
    - Bir agent çalıştırmasında owner-only `gateway` aracını kullanıyorsanız, bu araç yine de `tools.exec.ask` / `tools.exec.security` yollarına yazmayı reddeder (`aynı korumalı exec yollarına normalize olan eski `tools.bash.*` takma adları dahil`).

    Belgeler: [Yapılandırma](/cli/config), [Yapılandır](/cli/configure), [Doctor](/tr/gateway/doctor).

  </Accordion>

  <Accordion title="Cihazlar arasında uzmanlaşmış worker'larla merkezi bir Gateway'i nasıl çalıştırırım?">
    Yaygın model **tek bir Gateway** (ör. Raspberry Pi) artı **Node** ve **agent**'lardır:

    - **Gateway (merkezi):** kanalların (Signal/WhatsApp), yönlendirmenin ve oturumların sahibidir.
    - **Node'lar (cihazlar):** Mac/iOS/Android çevre birimleri olarak bağlanır ve local araçları (`system.run`, `canvas`, `camera`) açığa çıkarır.
    - **Agent'lar (worker'lar):** uzman roller için ayrı zihinler/çalışma alanlarıdır (ör. "Hetzner ops", "Personal data").
    - **Alt agent'lar:** paralellik istediğinizde ana agent'tan arka plan işi başlatır.
    - **TUI:** Gateway'e bağlanır ve agent/oturum değiştirir.

    Belgeler: [Node'lar](/tr/nodes), [Uzaktan erişim](/tr/gateway/remote), [Çoklu Agent Yönlendirmesi](/tr/concepts/multi-agent), [Alt agent'lar](/tr/tools/subagents), [TUI](/web/tui).

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

    Varsayılan `false`'tur (headful). Headless mod, bazı sitelerde anti-bot kontrollerini tetikleme olasılığı daha yüksektir. Bkz. [Tarayıcı](/tr/tools/browser).

    Headless, **aynı Chromium motorunu** kullanır ve çoğu otomasyon için çalışır (formlar, tıklamalar, scraping, oturum açmalar). Ana farklar şunlardır:

    - Görünür tarayıcı penceresi yoktur (görsellere ihtiyacınız varsa ekran görüntüleri kullanın).
    - Bazı siteler headless modda otomasyona karşı daha katıdır (CAPTCHA'lar, anti-bot).
      Örneğin X/Twitter genellikle headless oturumları engeller.

  </Accordion>

  <Accordion title="Tarayıcı kontrolü için Brave'i nasıl kullanırım?">
    `browser.executablePath` değerini Brave binary'nize (veya Chromium tabanlı başka bir tarayıcıya) ayarlayın ve Gateway'i yeniden başlatın.
    Tam yapılandırma örnekleri için [Tarayıcı](/tr/tools/browser#use-brave-or-another-chromium-based-browser) bölümüne bakın.
  </Accordion>
</AccordionGroup>

## Uzak Gateway'ler ve Node'lar

<AccordionGroup>
  <Accordion title="Komutlar Telegram, Gateway ve Node'lar arasında nasıl yayılır?">
    Telegram mesajları **Gateway** tarafından işlenir. Gateway agent'ı çalıştırır ve
    yalnızca bir Node aracı gerektiğinde **Gateway WebSocket** üzerinden Node'ları çağırır:

    Telegram → Gateway → Agent → `node.*` → Node → Gateway → Telegram

    Node'lar gelen sağlayıcı trafiğini görmez; yalnızca node RPC çağrılarını alırlar.

  </Accordion>

  <Accordion title="Gateway uzaktan barındırılıyorsa agent'ım bilgisayarıma nasıl erişebilir?">
    Kısa yanıt: **bilgisayarınızı bir Node olarak eşleyin**. Gateway başka yerde çalışır, ancak
    Gateway WebSocket üzerinden local makinenizdeki `node.*` araçlarını (ekran, kamera, sistem) çağırabilir.

    Tipik kurulum:

    1. Gateway'i her zaman açık host üzerinde çalıştırın (VPS/ev sunucusu).
    2. Gateway host'unu + bilgisayarınızı aynı tailnet'e koyun.
    3. Gateway WS'nin erişilebilir olduğundan emin olun (tailnet bind veya SSH tunnel).
    4. macOS uygulamasını local olarak açın ve **SSH üzerinden Remote** modunda (veya doğrudan tailnet ile)
       bağlanın ki bir Node olarak kaydolabilsin.
    5. Gateway üzerinde Node'u onaylayın:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Ayrı bir TCP köprüsü gerekmez; Node'lar Gateway WebSocket üzerinden bağlanır.

    Güvenlik hatırlatması: bir macOS Node eşlemek, o makinede `system.run` olanağı verir. Yalnızca
    güvendiğiniz cihazları eşleyin ve [Security](/tr/gateway/security) bölümünü inceleyin.

    Belgeler: [Node'lar](/tr/nodes), [Gateway protocol](/tr/gateway/protocol), [macOS remote mode](/tr/platforms/mac/remote), [Security](/tr/gateway/security).

  </Accordion>

  <Accordion title="Tailscale bağlı ama yanıt alamıyorum. Şimdi ne yapmalıyım?">
    Temelleri kontrol edin:

    - Gateway çalışıyor mu: `openclaw gateway status`
    - Gateway sağlığı: `openclaw status`
    - Kanal sağlığı: `openclaw channels status`

    Ardından kimlik doğrulama ve yönlendirmeyi doğrulayın:

    - Tailscale Serve kullanıyorsanız `gateway.auth.allowTailscale` değerinin doğru ayarlandığından emin olun.
    - SSH tunnel üzerinden bağlanıyorsanız local tunnel'ın açık olduğunu ve doğru porta işaret ettiğini doğrulayın.
    - Allowlist'lerinizin (DM veya grup) hesabınızı içerdiğini doğrulayın.

    Belgeler: [Tailscale](/tr/gateway/tailscale), [Uzaktan erişim](/tr/gateway/remote), [Kanallar](/tr/channels).

  </Accordion>

  <Accordion title="İki OpenClaw instance'ı birbiriyle konuşabilir mi (local + VPS)?">
    Evet. Yerleşik bir "bot-to-bot" köprüsü yoktur, ancak bunu birkaç
    güvenilir şekilde bağlayabilirsiniz:

    **En basiti:** her iki botun da erişebildiği normal bir sohbet kanalı kullanın (Telegram/Slack/WhatsApp).
    Bot A'nın Bot B'ye mesaj göndermesini sağlayın, ardından Bot B normal şekilde yanıtlasın.

    **CLI köprüsü (genel):** diğer Gateway'i
    `openclaw agent --message ... --deliver` ile çağıran bir betik çalıştırın ve diğer botun
    dinlediği bir sohbeti hedefleyin. Botlardan biri uzak bir VPS üzerindeyse, CLI'ınızı SSH/Tailscale ile
    o uzak Gateway'e yönlendirin (bkz. [Uzaktan erişim](/tr/gateway/remote)).

    Örnek model (hedef Gateway'e erişebilen bir makinede çalıştırın):

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    İpucu: iki botun sonsuz döngüye girmemesi için bir güvenlik önlemi ekleyin (yalnızca mention,
    kanal allowlist'leri veya "bot mesajlarına yanıt verme" kuralı).

    Belgeler: [Uzaktan erişim](/tr/gateway/remote), [Agent CLI](/cli/agent), [Agent gönderimi](/tr/tools/agent-send).

  </Accordion>

  <Accordion title="Birden fazla agent için ayrı VPS'lere ihtiyacım var mı?">
    Hayır. Tek bir Gateway birden fazla agent'ı barındırabilir; her birinin kendi çalışma alanı, varsayılan model ayarları
    ve yönlendirmesi olabilir. Bu normal kurulumdur ve agent başına
    bir VPS çalıştırmaktan çok daha ucuz ve basittir.

    Ayrı VPS'leri yalnızca katı izolasyona (güvenlik sınırları) veya paylaşmak
    istemediğiniz çok farklı yapılandırmalara ihtiyaç duyduğunuzda kullanın. Aksi halde tek bir Gateway tutun ve
    birden fazla agent veya alt agent kullanın.

  </Accordion>

  <Accordion title="Uzak bir VPS'ten SSH kullanmak yerine kişisel dizüstü bilgisayarımda bir Node kullanmanın faydası var mı?">
    Evet - uzak bir Gateway'den dizüstü bilgisayarınıza ulaşmanın birinci sınıf yolu Node'lardır ve
    shell erişiminden fazlasını açarlar. Gateway macOS/Linux üzerinde çalışır (Windows için WSL2) ve
    hafiftir (küçük bir VPS veya Raspberry Pi sınıfı kutu yeterlidir; 4 GB RAM fazlasıyla yeterlidir), bu yüzden
    yaygın bir kurulum, her zaman açık bir host artı Node olarak dizüstü bilgisayarınızdır.

    - **Gelen SSH gerekmez.** Node'lar dışarı doğru Gateway WebSocket'e bağlanır ve cihaz eşlemesi kullanır.
    - **Daha güvenli yürütme denetimleri.** `system.run`, o dizüstü bilgisayarda Node allowlist'leri/onayları ile kapatılır.
    - **Daha fazla cihaz aracı.** Node'lar `system.run` yanında `canvas`, `camera` ve `screen` açığa çıkarır.
    - **Local tarayıcı otomasyonu.** Gateway'i bir VPS'te tutun, ancak Chrome'u dizüstü bilgisayardaki bir Node host üzerinden local çalıştırın veya host üzerindeki local Chrome'a Chrome MCP üzerinden bağlanın.

    SSH, geçici shell erişimi için uygundur, ancak süregelen agent iş akışları ve
    cihaz otomasyonu için Node'lar daha basittir.

    Belgeler: [Node'lar](/tr/nodes), [Node'lar CLI](/cli/nodes), [Tarayıcı](/tr/tools/browser).

  </Accordion>

  <Accordion title="Node'lar bir Gateway servisi çalıştırır mı?">
    Hayır. Bilinçli olarak izole profiller çalıştırmadığınız sürece host başına yalnızca **bir Gateway**
    çalışmalıdır (bkz. [Birden fazla Gateway](/tr/gateway/multiple-gateways)). Node'lar, Gateway'e bağlanan çevre birimleridir
    (iOS/Android Node'ları veya menubar uygulamasındaki macOS "node mode"). Headless Node
    host'ları ve CLI denetimi için bkz. [Node host CLI](/cli/node).

    `gateway`, `discovery` ve `canvasHost` değişiklikleri için tam yeniden başlatma gerekir.

  </Accordion>

  <Accordion title="Yapılandırmayı uygulamak için bir API / RPC yolu var mı?">
    Evet.

    - `config.schema.lookup`: yazmadan önce sığ şema düğümü, eşleşen UI ipucu ve doğrudan alt özetleriyle birlikte tek bir yapılandırma alt ağacını inceleyin
    - `config.get`: mevcut anlık görüntüyü + hash'i alın
    - `config.patch`: güvenli kısmi güncelleme (çoğu RPC düzenlemesi için tercih edilir); mümkün olduğunda hot-reload yapar, gerektiğinde yeniden başlatır
    - `config.apply`: tam yapılandırmayı doğrular + değiştirir; mümkün olduğunda hot-reload yapar, gerektiğinde yeniden başlatır
    - Owner-only `gateway` çalışma zamanı aracı, `tools.exec.ask` / `tools.exec.security` yollarını yeniden yazmayı yine de reddeder; eski `tools.bash.*` takma adları aynı korumalı exec yollarına normalize olur

  </Accordion>

  <Accordion title="İlk kurulum için makul en küçük yapılandırma">
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

    1. **VPS üzerinde kurun + oturum açın**

       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```

    2. **Mac'inize kurun + oturum açın**
       - Tailscale uygulamasını kullanın ve aynı tailnet ile oturum açın.
    3. **MagicDNS'i etkinleştirin (önerilir)**
       - Tailscale yönetici konsolunda MagicDNS'i etkinleştirin; böylece VPS'in sabit bir adı olur.
    4. **Tailnet host adını kullanın**
       - SSH: `ssh user@your-vps.tailnet-xxxx.ts.net`
       - Gateway WS: `ws://your-vps.tailnet-xxxx.ts.net:18789`

    SSH olmadan Control UI istiyorsanız, VPS üzerinde Tailscale Serve kullanın:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Bu, Gateway'i loopback'e bağlı tutar ve Tailscale üzerinden HTTPS açığa çıkarır. Bkz. [Tailscale](/tr/gateway/tailscale).

  </Accordion>

  <Accordion title="Bir Mac Node'u uzak bir Gateway'e (Tailscale Serve) nasıl bağlarım?">
    Serve, **Gateway Control UI + WS** sunar. Node'lar aynı Gateway WS uç noktası üzerinden bağlanır.

    Önerilen kurulum:

    1. **VPS + Mac'in aynı tailnet üzerinde olduğundan emin olun**.
    2. **macOS uygulamasını Remote modda kullanın** (SSH hedefi tailnet host adı olabilir).
       Uygulama Gateway portunu tünelleyecek ve bir Node olarak bağlanacaktır.
    3. **Gateway üzerinde Node'u onaylayın**:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Belgeler: [Gateway protocol](/tr/gateway/protocol), [Discovery](/tr/gateway/discovery), [macOS remote mode](/tr/platforms/mac/remote).

  </Accordion>

  <Accordion title="İkinci bir dizüstü bilgisayara kurmalı mıyım yoksa sadece bir Node mu eklemeliyim?">
    İkinci dizüstü bilgisayarda yalnızca **local araçlara** (ekran/kamera/exec) ihtiyacınız varsa, onu bir
    **Node** olarak ekleyin. Bu, tek bir Gateway'i korur ve yinelenen yapılandırmadan kaçınır. Local Node araçları
    şu anda yalnızca macOS'a özeldir, ancak bunları diğer işletim sistemlerine genişletmeyi planlıyoruz.

    Yalnızca **katı izolasyona** veya tamamen ayrı iki bota ihtiyacınız varsa ikinci bir Gateway kurun.

    Belgeler: [Node'lar](/tr/nodes), [Node'lar CLI](/cli/nodes), [Birden fazla Gateway](/tr/gateway/multiple-gateways).

  </Accordion>
</AccordionGroup>

## Ortam değişkenleri ve .env yükleme

<AccordionGroup>
  <Accordion title="OpenClaw ortam değişkenlerini nasıl yükler?">
    OpenClaw, üst süreçten (shell, launchd/systemd, CI vb.) ortam değişkenlerini okur ve ayrıca şunları yükler:

    - geçerli çalışma dizinindeki `.env`
    - `~/.openclaw/.env` içindeki global fallback `.env` (yani `$OPENCLAW_STATE_DIR/.env`)

    Hiçbir `.env` dosyası mevcut ortam değişkenlerini geçersiz kılmaz.

    Ayrıca yapılandırmada satır içi ortam değişkenleri de tanımlayabilirsiniz (yalnızca süreç ortamında yoksa uygulanır):

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

  <Accordion title="Gateway'i servis üzerinden başlattım ve ortam değişkenlerim kayboldu. Şimdi ne yapmalıyım?">
    İki yaygın düzeltme:

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

    Bu, login shell'inizi çalıştırır ve yalnızca beklenen eksik anahtarları içe aktarır (asla geçersiz kılmaz). Ortam değişkeni eşdeğerleri:
    `OPENCLAW_LOAD_SHELL_ENV=1`, `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`.

  </Accordion>

  <Accordion title='COPILOT_GITHUB_TOKEN ayarladım, ama models status "Shell env: off." gösteriyor. Neden?'>
    `openclaw models status`, **shell env içe aktarmanın** etkin olup olmadığını bildirir. "Shell env: off"
    ifadesi ortam değişkenlerinizin eksik olduğu anlamına **gelmez** - yalnızca OpenClaw'ın
    login shell'inizi otomatik olarak yüklemeyeceği anlamına gelir.

    Gateway bir servis olarak çalışıyorsa (launchd/systemd), shell
    ortamınızı devralmaz. Bunu şu yollardan biriyle düzeltin:

    1. Token'ı `~/.openclaw/.env` içine koyun:

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. Veya shell içe aktarmayı etkinleştirin (`env.shellEnv.enabled: true`).
    3. Veya bunu yapılandırmanızın `env` bloğuna ekleyin (yalnızca eksikse uygulanır).

    Sonra Gateway'i yeniden başlatın ve tekrar kontrol edin:

    ```bash
    openclaw models status
    ```

    Copilot token'ları `COPILOT_GITHUB_TOKEN` üzerinden okunur (ayrıca `GH_TOKEN` / `GITHUB_TOKEN`).
    Bkz. [/concepts/model-providers](/tr/concepts/model-providers) ve [/environment](/tr/help/environment).

  </Accordion>
</AccordionGroup>

## Oturumlar ve birden fazla sohbet

<AccordionGroup>
  <Accordion title="Yeni bir konuşmayı nasıl başlatırım?">
    Tek başına bir mesaj olarak `/new` veya `/reset` gönderin. Bkz. [Oturum yönetimi](/tr/concepts/session).
  </Accordion>

  <Accordion title="Asla /new göndermezsem oturumlar otomatik olarak sıfırlanır mı?">
    Oturumlar `session.idleMinutes` sonrasında sona erebilir, ancak bu **varsayılan olarak devre dışıdır** (varsayılan **0**).
    Boşta kalma süresi sonlandırmasını etkinleştirmek için bunu pozitif bir değere ayarlayın. Etkin olduğunda, boşta kalma süresinden
    sonraki **bir sonraki** mesaj, o sohbet anahtarı için yeni bir oturum kimliği başlatır.
    Bu, transkriptleri silmez - yalnızca yeni bir oturum başlatır.

    ```json5
    {
      session: {
        idleMinutes: 240,
      },
    }
    ```

  </Accordion>

  <Accordion title="Bir OpenClaw instance ekibi oluşturmanın bir yolu var mı (bir CEO ve birçok agent)?">
    Evet, **çoklu agent yönlendirmesi** ve **alt agent'lar** ile. Bir koordinatör
    agent ve kendi çalışma alanlarına ve modellerine sahip birkaç worker agent oluşturabilirsiniz.

    Bununla birlikte, bunu daha çok **eğlenceli bir deney** olarak görmek en iyisidir. Token açısından ağırdır ve
    çoğu zaman ayrı oturumları olan tek bir bot kullanmaktan daha az verimlidir. Bizim
    öngördüğümüz tipik model, konuştuğunuz tek bir bot ve paralel çalışma için farklı oturumlardır. Bu
    bot gerektiğinde alt agent'lar da başlatabilir.

    Belgeler: [Çoklu agent yönlendirmesi](/tr/concepts/multi-agent), [Alt agent'lar](/tr/tools/subagents), [Agents CLI](/cli/agents).

  </Accordion>

  <Accordion title="Bağlam neden görevin ortasında kesildi? Bunu nasıl önlerim?">
    Oturum bağlamı model penceresiyle sınırlıdır. Uzun sohbetler, büyük araç çıktıları veya çok sayıda
    dosya Compaction veya truncation tetikleyebilir.

    Yardımcı olanlar:

    - Bottan mevcut durumu özetlemesini ve bir dosyaya yazmasını isteyin.
    - Uzun görevlerden önce `/compact`, konu değiştirirken `/new` kullanın.
    - Önemli bağlamı çalışma alanında tutun ve bottan onu yeniden okumasını isteyin.
    - Ana sohbet daha küçük kalsın diye uzun veya paralel işler için alt agent'lar kullanın.
    - Bu sık oluyorsa daha büyük bağlam penceresine sahip bir model seçin.

  </Accordion>

  <Accordion title="OpenClaw'ı tamamen nasıl sıfırlar ama kurulu tutarım?">
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
    - Profiller kullandıysanız (`--profile` / `OPENCLAW_PROFILE`), her durum dizinini sıfırlayın (varsayılanlar `~/.openclaw-<profile>` biçimindedir).
    - Geliştirme sıfırlaması: `openclaw gateway --dev --reset` (yalnızca geliştirme; geliştirme yapılandırmasını + kimlik bilgilerini + oturumları + çalışma alanını siler).

  </Accordion>

  <Accordion title='“context too large” hataları alıyorum - nasıl sıfırlar veya compact ederim?'>
    Şunlardan birini kullanın:

    - **Compact** (konuşmayı korur ama eski dönüşleri özetler):

      ```
      /compact
      ```

      veya özeti yönlendirmek için `/compact <instructions>`.

    - **Sıfırla** (aynı sohbet anahtarı için yeni oturum kimliği):

      ```
      /new
      /reset
      ```

    Bu sürekli oluyorsa:

    - Eski araç çıktısını kırpmak için **session pruning** (`agents.defaults.contextPruning`) özelliğini etkinleştirin veya ayarlayın.
    - Daha büyük bağlam penceresine sahip bir model kullanın.

    Belgeler: [Compaction](/tr/concepts/compaction), [Session pruning](/tr/concepts/session-pruning), [Oturum yönetimi](/tr/concepts/session).

  </Accordion>

  <Accordion title='Neden "LLM request rejected: messages.content.tool_use.input field required" görüyorum?'>
    Bu bir sağlayıcı doğrulama hatasıdır: model, gerekli `input`
    olmadan bir `tool_use` bloğu üretti. Bu genellikle oturum geçmişinin bayat veya bozuk olduğu anlamına gelir (çoğunlukla uzun thread'lerden
    veya bir araç/şema değişikliğinden sonra).

    Düzeltme: `/new` ile yeni bir oturum başlatın (tek başına mesaj).

  </Accordion>

  <Accordion title="Neden her 30 dakikada bir Heartbeat mesajları alıyorum?">
    Heartbeat'ler varsayılan olarak her **30m**'de bir çalışır (**OAuth auth** kullanılırken **1h**). Ayarlayın veya devre dışı bırakın:

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

    `HEARTBEAT.md` varsa ama fiilen boşsa (yalnızca boş satırlar ve `# Heading` gibi markdown
    başlıkları), OpenClaw API çağrılarını azaltmak için Heartbeat çalıştırmasını atlar.
    Dosya eksikse Heartbeat yine çalışır ve ne yapılacağına model karar verir.

    Agent başına geçersiz kılmalar `agents.list[].heartbeat` kullanır. Belgeler: [Heartbeat](/tr/gateway/heartbeat).

  </Accordion>

  <Accordion title='Bir WhatsApp grubuna "bot account" eklemem gerekir mi?'>
    Hayır. OpenClaw **kendi hesabınızda** çalışır, bu yüzden siz gruptaysanız OpenClaw da onu görebilir.
    Varsayılan olarak, gönderenlere izin verene kadar grup yanıtları engellenir (`groupPolicy: "allowlist"`).

    Grupta yalnızca **sizin** yanıtları tetikleyebilmenizi istiyorsanız:

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
    Seçenek 1 (en hızlısı): günlükleri izleyin ve gruba bir test mesajı gönderin:

    ```bash
    openclaw logs --follow --json
    ```

    `@g.us` ile biten `chatId` (veya `from`) alanını arayın, örneğin:
    `1234567890-1234567890@g.us`.

    Seçenek 2 (zaten yapılandırılmışsa/allowlist'e alınmışsa): grupları yapılandırmadan listeleyin:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    Belgeler: [WhatsApp](/tr/channels/whatsapp), [Directory](/cli/directory), [Günlükler](/cli/logs).

  </Accordion>

  <Accordion title="OpenClaw neden bir grupta yanıt vermiyor?">
    İki yaygın neden:

    - Mention gating açıktır (varsayılan). Botu @mention etmeniz gerekir (veya `mentionPatterns` ile eşleşmesi gerekir).
    - `channels.whatsapp.groups` değerini `"*"` olmadan yapılandırdınız ve grup allowlist'e alınmadı.

    Bkz. [Gruplar](/tr/channels/groups) ve [Grup mesajları](/tr/channels/group-messages).

  </Accordion>

  <Accordion title="Gruplar/thread'ler DM'lerle bağlam paylaşır mı?">
    Doğrudan sohbetler varsayılan olarak ana oturumda birleştirilir. Gruplar/kanallar kendi oturum anahtarlarına sahiptir ve Telegram konuları / Discord thread'leri ayrı oturumlardır. Bkz. [Gruplar](/tr/channels/groups) ve [Grup mesajları](/tr/channels/group-messages).
  </Accordion>

  <Accordion title="Kaç çalışma alanı ve agent oluşturabilirim?">
    Katı sınırlar yoktur. Onlarca (hatta yüzlerce) sorun değildir, ancak şunlara dikkat edin:

    - **Disk büyümesi:** oturumlar + transkriptler `~/.openclaw/agents/<agentId>/sessions/` altında yaşar.
    - **Token maliyeti:** daha fazla agent, daha fazla eşzamanlı model kullanımı demektir.
    - **Operasyon yükü:** agent başına auth profilleri, çalışma alanları ve kanal yönlendirmesi.

    İpuçları:

    - Agent başına bir **etkin** çalışma alanı tutun (`agents.defaults.workspace`).
    - Disk büyürse eski oturumları budayın (JSONL veya store girdilerini silin).
    - Başıboş çalışma alanlarını ve profil uyuşmazlıklarını tespit etmek için `openclaw doctor` kullanın.

  </Accordion>

  <Accordion title="Aynı anda birden fazla bot veya sohbet (Slack) çalıştırabilir miyim ve bunu nasıl kurmalıyım?">
    Evet. Birden fazla izole agent çalıştırmak ve gelen mesajları
    kanal/hesap/peer bazında yönlendirmek için **Çoklu Agent Yönlendirmesi** kullanın. Slack, desteklenen bir kanaldır ve belirli agent'lara bağlanabilir.

    Tarayıcı erişimi güçlüdür ancak "insanın yapabildiği her şeyi yapar" anlamına gelmez - anti-bot sistemleri, CAPTCHA'lar ve MFA
    otomasyonu yine de engelleyebilir. En güvenilir tarayıcı denetimi için host üzerinde local Chrome MCP kullanın
    veya tarayıcının gerçekten çalıştığı makinede CDP kullanın.

    En iyi uygulama kurulumu:

    - Her zaman açık Gateway host'u (VPS/Mac mini).
    - Rol başına bir agent (bağlamalar).
    - O agent'lara bağlı Slack kanal(lar)ı.
    - Gerektiğinde Chrome MCP veya bir Node üzerinden local tarayıcı.

    Belgeler: [Çoklu Agent Yönlendirmesi](/tr/concepts/multi-agent), [Slack](/tr/channels/slack),
    [Tarayıcı](/tr/tools/browser), [Node'lar](/tr/nodes).

  </Accordion>
</AccordionGroup>

## Modeller: varsayılanlar, seçim, takma adlar, geçiş

<AccordionGroup>
  <Accordion title='“Varsayılan model” nedir?'>
    OpenClaw'ın varsayılan modeli, şurada ayarladığınız şeydir:

    ```
    agents.defaults.model.primary
    ```

    Modeller `provider/model` biçiminde referanslanır (örnek: `openai/gpt-5.4`). Sağlayıcıyı çıkarırsanız OpenClaw önce bir takma adı, sonra tam model kimliği için benzersiz bir yapılandırılmış sağlayıcı eşleşmesini dener ve yalnızca bundan sonra kullanımdan kaldırılmış bir uyumluluk yolu olarak yapılandırılmış varsayılan sağlayıcıya fallback yapar. O sağlayıcı artık yapılandırılmış varsayılan modeli sunmuyorsa, eski ve kaldırılmış bir sağlayıcı varsayılanını göstermekte ısrar etmek yerine OpenClaw ilk yapılandırılmış sağlayıcıya/modele fallback yapar. Yine de **provider/model** biçimini açıkça ayarlamalısınız.

  </Accordion>

  <Accordion title="Hangi modeli öneriyorsunuz?">
    **Önerilen varsayılan:** sağlayıcı yığınınızda bulunan en güçlü yeni nesil modeli kullanın.
    **Araç etkin veya güvenilmeyen girdi alan agent'lar için:** maliyetten çok model gücünü önceliklendirin.
    **Rutin/düşük riskli sohbetler için:** daha ucuz fallback modeller kullanın ve agent rolüne göre yönlendirin.

    MiniMax'in kendi belgeleri vardır: [MiniMax](/tr/providers/minimax) ve
    [Local modeller](/tr/gateway/local-models).

    Genel kural: yüksek riskli işler için karşılayabildiğiniz **en iyi modeli** kullanın, rutin
    sohbet veya özetler için ise daha ucuz bir model kullanın. Model yönlendirmesini agent başına yapabilir ve uzun görevleri
    paralelleştirmek için alt agent'lar kullanabilirsiniz (her alt agent token tüketir). Bkz. [Modeller](/tr/concepts/models) ve
    [Alt agent'lar](/tr/tools/subagents).

    Güçlü uyarı: daha zayıf/aşırı kuantize modeller prompt
    injection ve güvensiz davranışlara karşı daha savunmasızdır. Bkz. [Security](/tr/gateway/security).

    Daha fazla bağlam: [Modeller](/tr/concepts/models).

  </Accordion>

  <Accordion title="Yapılandırmamı silmeden modelleri nasıl değiştiririm?">
    **Model komutlarını** kullanın veya yalnızca **model** alanlarını düzenleyin. Tam yapılandırma değiştirmelerinden kaçının.

    Güvenli seçenekler:

    - sohbette `/model` (hızlı, oturum başına)
    - `openclaw models set ...` (yalnızca model yapılandırmasını günceller)
    - `openclaw configure --section model` (etkileşimli)
    - `~/.openclaw/openclaw.json` içinde `agents.defaults.model` düzenleyin

    Tüm yapılandırmayı değiştirmeyi amaçlamıyorsanız `config.apply` ile kısmi nesne kullanmaktan kaçının.
    RPC düzenlemeleri için önce `config.schema.lookup` ile inceleyin ve `config.patch` tercih edin. Lookup payload'ı size normalize edilmiş yolu, sığ şema belgelerini/kısıtlarını ve doğrudan alt özetleri verir.
    kısmi güncellemeler için.
    Yapılandırmanın üzerine yazdıysanız yedekten geri yükleyin veya onarmak için `openclaw doctor` yeniden çalıştırın.

    Belgeler: [Modeller](/tr/concepts/models), [Yapılandır](/cli/configure), [Yapılandırma](/cli/config), [Doctor](/tr/gateway/doctor).

  </Accordion>

  <Accordion title="Self-hosted modeller (llama.cpp, vLLM, Ollama) kullanabilir miyim?">
    Evet. Local modeller için en kolay yol Ollama'dır.

    En hızlı kurulum:

    1. Ollama'yı `https://ollama.com/download` adresinden yükleyin
    2. `ollama pull gemma4` gibi bir local model çekin
    3. Bulut modelleri de istiyorsanız `ollama signin` çalıştırın
    4. `openclaw onboard` çalıştırın ve `Ollama` seçin
    5. `Local` veya `Cloud + Local` seçin

    Notlar:

    - `Cloud + Local`, size bulut modelleri ile local Ollama modellerinizi birlikte verir
    - `kimi-k2.5:cloud` gibi bulut modelleri local pull gerektirmez
    - elle geçiş için `openclaw models list` ve `openclaw models set ollama/<model>` kullanın

    Güvenlik notu: daha küçük veya yoğun biçimde kuantize edilmiş modeller prompt
    injection'a karşı daha savunmasızdır. Araç kullanabilen her bot için güçlü şekilde **büyük modeller**
    öneriyoruz. Yine de küçük modeller istiyorsanız sandboxing ve katı araç allowlist'lerini etkinleştirin.

    Belgeler: [Ollama](/tr/providers/ollama), [Local modeller](/tr/gateway/local-models),
    [Model sağlayıcıları](/tr/concepts/model-providers), [Security](/tr/gateway/security),
    [Sandboxing](/tr/gateway/sandboxing).

  </Accordion>

  <Accordion title="OpenClaw, Flawd ve Krill modeller için ne kullanıyor?">
    - Bu dağıtımlar farklı olabilir ve zaman içinde değişebilir; sabit bir sağlayıcı önerisi yoktur.
    - Her Gateway'deki mevcut çalışma zamanı ayarını `openclaw models status` ile kontrol edin.
    - Güvenliğe duyarlı/araç etkin agent'lar için mevcut en güçlü yeni nesil modeli kullanın.
  </Accordion>

  <Accordion title="Modelleri anında (yeniden başlatmadan) nasıl değiştiririm?">
    Tek başına mesaj olarak `/model` komutunu kullanın:

    ```
    /model sonnet
    /model opus
    /model gpt
    /model gpt-mini
    /model gemini
    /model gemini-flash
    /model gemini-flash-lite
    ```

    Bunlar yerleşik takma adlardır. Özel takma adlar `agents.defaults.models` aracılığıyla eklenebilir.

    Kullanılabilir modelleri `/model`, `/model list` veya `/model status` ile listeleyebilirsiniz.

    `/model` (ve `/model list`) kompakt, numaralı bir seçici gösterir. Numaraya göre seçin:

    ```
    /model 3
    ```

    Sağlayıcı için belirli bir auth profilini de zorlayabilirsiniz (oturum başına):

    ```
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    İpucu: `/model status`, hangi agent'ın etkin olduğunu, hangi `auth-profiles.json` dosyasının kullanıldığını ve sırada hangi auth profilinin deneneceğini gösterir.
    Ayrıca kullanılabilir olduğunda yapılandırılmış sağlayıcı uç noktasını (`baseUrl`) ve API modunu (`api`) da gösterir.

    **@profile ile ayarladığım pini nasıl kaldırırım?**

    `/model` komutunu `@profile` soneki **olmadan** yeniden çalıştırın:

    ```
    /model anthropic/claude-opus-4-6
    ```

    Varsayılana dönmek istiyorsanız bunu `/model` içinden seçin (veya `/model <default provider/model>` gönderin).
    Hangi auth profilinin etkin olduğunu doğrulamak için `/model status` kullanın.

  </Accordion>

  <Accordion title="Günlük işler için GPT 5.2, kodlama için Codex 5.3 kullanabilir miyim?">
    Evet. Birini varsayılan yapın ve gerektiğinde değiştirin:

    - **Hızlı geçiş (oturum başına):** günlük işler için `/model gpt-5.4`, Codex OAuth ile kodlama için `/model openai-codex/gpt-5.4`.
    - **Varsayılan + geçiş:** `agents.defaults.model.primary` değerini `openai/gpt-5.4` yapın, sonra kodlama sırasında `openai-codex/gpt-5.4` değerine geçin (veya tersi).
    - **Alt agent'lar:** kodlama görevlerini farklı bir varsayılan modele sahip alt agent'lara yönlendirin.

    Bkz. [Modeller](/tr/concepts/models) ve [Slash komutları](/tr/tools/slash-commands).

  </Accordion>

  <Accordion title="GPT 5.4 için fast mode'u nasıl yapılandırırım?">
    Bir oturum geçişi veya yapılandırma varsayılanı kullanın:

    - **Oturum başına:** oturum `openai/gpt-5.4` veya `openai-codex/gpt-5.4` kullanırken `/fast on` gönderin.
    - **Model başına varsayılan:** `agents.defaults.models["openai/gpt-5.4"].params.fastMode` değerini `true` yapın.
    - **Codex OAuth için de:** `openai-codex/gpt-5.4` kullanıyorsanız aynı bayrağı orada da ayarlayın.

    Örnek:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": {
              params: {
                fastMode: true,
              },
            },
            "openai-codex/gpt-5.4": {
              params: {
                fastMode: true,
              },
            },
          },
        },
      },
    }
    ```

    OpenAI için fast mode, desteklenen yerel Responses isteklerinde `service_tier = "priority"` değerine eşlenir. Oturumdaki `/fast` geçersiz kılmaları yapılandırma varsayılanlarını geçersiz kılar.

    Bkz. [Thinking ve fast mode](/tr/tools/thinking) ve [OpenAI fast mode](/tr/providers/openai#openai-fast-mode).

  </Accordion>

  <Accordion title='Neden "Model ... is not allowed" görüyorum ve sonra yanıt gelmiyor?'>
    `agents.defaults.models` ayarlıysa bu, `/model` ve herhangi bir
    oturum geçersiz kılması için **allowlist** olur. O listede olmayan bir model seçildiğinde şunu döndürür:

    ```
    Model "provider/model" is not allowed. Use /model to list available models.
    ```

    Bu hata normal bir yanıtın **yerine** döndürülür. Düzeltme: modeli
    `agents.defaults.models` içine ekleyin, allowlist'i kaldırın veya `/model list` içinden bir model seçin.

  </Accordion>

  <Accordion title='Neden "Unknown model: minimax/MiniMax-M2.7" görüyorum?'>
    Bu, **sağlayıcının yapılandırılmadığı** anlamına gelir (MiniMax sağlayıcı yapılandırması veya auth
    profili bulunmadı), bu yüzden model çözümlenemiyor.

    Düzeltme kontrol listesi:

    1. Güncel bir OpenClaw sürümüne yükseltin (veya kaynak `main` üzerinden çalıştırın), sonra Gateway'i yeniden başlatın.
    2. MiniMax'in yapılandırıldığından emin olun (sihirbaz veya JSON), ya da eşleşen sağlayıcının eklenebilmesi için
       env/auth profillerinde MiniMax auth
       bulunduğundan emin olun
       (`minimax` için `MINIMAX_API_KEY`, `minimax-portal` için `MINIMAX_OAUTH_TOKEN` veya depolanmış MiniMax
       OAuth).
    3. Auth yolunuz için tam model kimliğini kullanın (büyük/küçük harfe duyarlı):
       API anahtarı kurulumu için `minimax/MiniMax-M2.7` veya `minimax/MiniMax-M2.7-highspeed`,
       OAuth kurulumu için `minimax-portal/MiniMax-M2.7` /
       `minimax-portal/MiniMax-M2.7-highspeed`.
    4. Şunu çalıştırın:

       ```bash
       openclaw models list
       ```

       ve listeden seçin (veya sohbette `/model list`).

    Bkz. [MiniMax](/tr/providers/minimax) ve [Modeller](/tr/concepts/models).

  </Accordion>

  <Accordion title="MiniMax'i varsayılanım ve karmaşık görevler için OpenAI kullanabilir miyim?">
    Evet. **MiniMax'i varsayılan** olarak kullanın ve gerektiğinde modelleri **oturum başına** değiştirin.
    Fallback'ler **hatalar** içindir, "zor görevler" için değil; bu yüzden `/model` veya ayrı bir agent kullanın.

    **Seçenek A: oturum başına geçiş**

    ```json5
    {
      env: { MINIMAX_API_KEY: "sk-...", OPENAI_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "minimax/MiniMax-M2.7" },
          models: {
            "minimax/MiniMax-M2.7": { alias: "minimax" },
            "openai/gpt-5.4": { alias: "gpt" },
          },
        },
      },
    }
    ```

    Sonra:

    ```
    /model gpt
    ```

    **Seçenek B: ayrı agent'lar**

    - Agent A varsayılanı: MiniMax
    - Agent B varsayılanı: OpenAI
    - Agent'a göre yönlendirin veya değiştirmek için `/agent` kullanın

    Belgeler: [Modeller](/tr/concepts/models), [Çoklu Agent Yönlendirmesi](/tr/concepts/multi-agent), [MiniMax](/tr/providers/minimax), [OpenAI](/tr/providers/openai).

  </Accordion>

  <Accordion title="opus / sonnet / gpt yerleşik kısayollar mı?">
    Evet. OpenClaw birkaç varsayılan kısayolla gelir (yalnızca model `agents.defaults.models` içinde varsa uygulanır):

    - `opus` → `anthropic/claude-opus-4-6`
    - `sonnet` → `anthropic/claude-sonnet-4-6`
    - `gpt` → `openai/gpt-5.4`
    - `gpt-mini` → `openai/gpt-5.4-mini`
    - `gpt-nano` → `openai/gpt-5.4-nano`
    - `gemini` → `google/gemini-3.1-pro-preview`
    - `gemini-flash` → `google/gemini-3-flash-preview`
    - `gemini-flash-lite` → `google/gemini-3.1-flash-lite-preview`

    Aynı ada sahip kendi takma adınızı ayarlarsanız, sizin değeriniz kazanır.

  </Accordion>

  <Accordion title="Model kısayollarını (takma adları) nasıl tanımlar/değiştiririm?">
    Takma adlar `agents.defaults.models.<modelId>.alias` değerinden gelir. Örnek:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-6" },
          models: {
            "anthropic/claude-opus-4-6": { alias: "opus" },
            "anthropic/claude-sonnet-4-6": { alias: "sonnet" },
            "anthropic/claude-haiku-4-5": { alias: "haiku" },
          },
        },
      },
    }
    ```

    Sonra `/model sonnet` (veya desteklendiğinde `/<alias>`) bu model kimliğine çözülür.

  </Accordion>

  <Accordion title="OpenRouter veya Z.AI gibi diğer sağlayıcılardan modelleri nasıl eklerim?">
    OpenRouter (token başına ödeme; birçok model):

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "openrouter/anthropic/claude-sonnet-4-6" },
          models: { "openrouter/anthropic/claude-sonnet-4-6": {} },
        },
      },
      env: { OPENROUTER_API_KEY: "sk-or-..." },
    }
    ```

    Z.AI (GLM modelleri):

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "zai/glm-5" },
          models: { "zai/glm-5": {} },
        },
      },
      env: { ZAI_API_KEY: "..." },
    }
    ```

    Bir `provider/model` referanslarsanız ama gerekli sağlayıcı anahtarı yoksa, çalışma zamanında kimlik doğrulama hatası alırsınız (ör. `No API key found for provider "zai"`).

    **Yeni bir agent ekledikten sonra sağlayıcı için API anahtarı bulunamadı**

    Bu genellikle **yeni agent'ın** auth deposunun boş olduğu anlamına gelir. Auth agent başınadır ve
    şurada depolanır:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    Düzeltme seçenekleri:

    - `openclaw agents add <id>` çalıştırın ve sihirbaz sırasında auth'u yapılandırın.
    - Veya `auth-profiles.json` dosyasını ana agent'ın `agentDir` klasöründen yeni agent'ın `agentDir` klasörüne kopyalayın.

    `agentDir` dizinini agent'lar arasında **yeniden kullanmayın**; auth/oturum çakışmalarına neden olur.

  </Accordion>
</AccordionGroup>

## Model failover ve "All models failed"

<AccordionGroup>
  <Accordion title="Failover nasıl çalışır?">
    Failover iki aşamada gerçekleşir:

    1. Aynı sağlayıcı içinde **Auth profil rotasyonu**.
    2. `agents.defaults.model.fallbacks` içindeki bir sonraki modele **model fallback**.

    Başarısız profillere cooldown uygulanır (üstel backoff), böylece bir sağlayıcı hız sınırına takıldığında veya geçici olarak başarısız olduğunda OpenClaw yanıt vermeye devam edebilir.

    Hız sınırı bucket'ı yalnızca düz `429` yanıtlarını içermez. OpenClaw,
    `Too many concurrent requests`,
    `ThrottlingException`, `concurrency limit reached`,
    `workers_ai ... quota limit exceeded`, `resource exhausted` ve dönemsel
    kullanım penceresi sınırları (`weekly/monthly limit reached`) gibi iletileri de
    failover'a değer hız sınırları olarak değerlendirir.

    Faturalandırma gibi görünen bazı yanıtlar `402` değildir ve bazı HTTP `402`
    yanıtları da bu geçici bucket içinde kalır. Bir sağlayıcı
    `401` veya `403` üzerinde açık faturalandırma metni döndürürse, OpenClaw bunu yine de
    faturalandırma hattında tutabilir, ancak sağlayıcıya özgü metin eşleyicileri bunların sahibi olan
    sağlayıcıyla sınırlı kalır (örneğin OpenRouter `Key limit exceeded`). Bir `402`
    iletisi bunun yerine yeniden denenebilir kullanım penceresi veya
    organizasyon/çalışma alanı harcama sınırı (`daily limit reached, resets tomorrow`,
    `organization spending limit exceeded`) gibi görünüyorsa, OpenClaw bunu
    uzun süreli faturalandırma devre dışı bırakması olarak değil `rate_limit` olarak değerlendirir.

    Context overflow hataları farklıdır: örneğin
    `request_too_large`, `input exceeds the maximum number of tokens`,
    `input token count exceeds the maximum number of input tokens`,
    `input is too long for the model` veya `ollama error: context length
    exceeded` gibi imzalar model fallback'i ilerletmek yerine
    Compaction/yeniden deneme yolunda kalır.

    Genel sunucu hatası metni, "içinde unknown/error geçen her şey"den kasıtlı olarak daha dardır.
    OpenClaw, sağlayıcı bağlamı
    eşleştiğinde Anthropic'in yalın `An unknown error occurred`, OpenRouter'ın yalın
    `Provider returned error`, `Unhandled stop reason:
    error` gibi stop-reason hataları, geçici sunucu metni içeren JSON `api_error` payload'ları
    (`internal server error`, `unknown error, 520`, `upstream error`, `backend
    error`) ve `ModelNotReadyException` gibi sağlayıcı meşgul hatalarını
    failover'a değer zaman aşımı/aşırı yük sinyalleri olarak değerlendirir.
    `LLM request failed with an unknown
    error.` gibi genel iç fallback metni ise temkinli kalır ve tek başına model fallback tetiklemez.

  </Accordion>

  <Accordion title='“No credentials found for profile anthropic:default” ne anlama gelir?'>
    Bu, sistemin `anthropic:default` auth profil kimliğini kullanmaya çalıştığı ancak beklenen auth deposunda bunun için kimlik bilgisi bulamadığı anlamına gelir.

    **Düzeltme kontrol listesi:**

    - **Auth profillerinin nerede yaşadığını doğrulayın** (yeni ve eski yollar)
      - Güncel: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
      - Eski: `~/.openclaw/agent/*` (`openclaw doctor` tarafından migrate edilir)
    - **Ortam değişkeninizin Gateway tarafından yüklendiğini doğrulayın**
      - `ANTHROPIC_API_KEY` değerini shell'inizde ayarlayıp Gateway'i systemd/launchd ile çalıştırıyorsanız, bunu devralmayabilir. `~/.openclaw/.env` içine koyun veya `env.shellEnv` etkinleştirin.
    - **Doğru agent'ı düzenlediğinizden emin olun**
      - Çoklu agent kurulumlarında birden fazla `auth-profiles.json` dosyası olabilir.
    - **Model/auth durumunu akla yatkınlık açısından kontrol edin**
      - Yapılandırılmış modelleri ve sağlayıcıların kimliği doğrulanmış olup olmadığını görmek için `openclaw models status` kullanın.

    **“No credentials found for profile anthropic” için düzeltme kontrol listesi**

    Bu, çalıştırmanın bir Anthropic auth profiline sabitlendiği ancak Gateway'in
    bunu auth deposunda bulamadığı anlamına gelir.

    - **Claude CLI kullanın**
      - Gateway host'unda `openclaw models auth login --provider anthropic --method cli --set-default` çalıştırın.
    - **Bunun yerine API anahtarı kullanmak istiyorsanız**
      - **Gateway host'unda** `~/.openclaw/.env` içine `ANTHROPIC_API_KEY` koyun.
      - Eksik bir profili zorlayan sabit sırayı temizleyin:

        ```bash
        openclaw models auth order clear --provider anthropic
        ```

    - **Komutları Gateway host'unda çalıştırdığınızı doğrulayın**
      - Remote moddaysanız auth profilleri dizüstü bilgisayarınızda değil Gateway makinesinde yaşar.

  </Accordion>

  <Accordion title="Neden Google Gemini'yi de denedi ve başarısız oldu?">
    Model yapılandırmanız Google Gemini'yi fallback olarak içeriyorsa (veya bir Gemini kısayoluna geçtiyseniz), OpenClaw model fallback sırasında bunu dener. Google kimlik bilgilerini yapılandırmadıysanız `No API key found for provider "google"` görürsünüz.

    Düzeltme: ya Google auth sağlayın ya da fallback'in oraya yönlenmemesi için `agents.defaults.model.fallbacks` / takma adlardan Google modellerini kaldırın/kaçının.

    **LLM request rejected: thinking signature required (Google Antigravity)**

    Neden: oturum geçmişi, **imzasız thinking blokları** içeriyor (çoğu zaman
    iptal edilmiş/kısmi bir akıştan). Google Antigravity, thinking blokları için imza gerektirir.

    Düzeltme: OpenClaw artık Google Antigravity Claude için imzasız thinking bloklarını temizliyor. Yine de görünüyorsa **yeni bir oturum** başlatın veya o agent için `/thinking off` ayarlayın.

  </Accordion>
</AccordionGroup>

## Auth profilleri: nedirler ve nasıl yönetilirler

İlgili: [/concepts/oauth](/tr/concepts/oauth) (OAuth akışları, token depolama, çok hesaplı modeller)

<AccordionGroup>
  <Accordion title="Auth profili nedir?">
    Auth profili, bir sağlayıcıya bağlı adlandırılmış bir kimlik bilgisi kaydıdır (OAuth veya API anahtarı). Profiller şurada yaşar:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

  </Accordion>

  <Accordion title="Tipik profil kimlikleri nelerdir?">
    OpenClaw, sağlayıcı önekli kimlikler kullanır, örneğin:

    - `anthropic:default` (e-posta kimliği yoksa yaygındır)
    - OAuth kimlikleri için `anthropic:<email>`
    - seçtiğiniz özel kimlikler (ör. `anthropic:work`)

  </Accordion>

  <Accordion title="Önce hangi auth profilinin deneneceğini kontrol edebilir miyim?">
    Evet. Yapılandırma, profiller için isteğe bağlı metadata ve sağlayıcı başına bir sıralama (`auth.order.<provider>`) destekler. Bu, secret depolamaz; kimlikleri sağlayıcı/moda eşler ve rotasyon sırasını belirler.

    OpenClaw, kısa bir **cooldown** (hız sınırları/zaman aşımları/auth hataları) veya daha uzun bir **disabled** durumu (faturalandırma/yetersiz kredi) içinde olan bir profili geçici olarak atlayabilir. Bunu incelemek için `openclaw models status --json` çalıştırın ve `auth.unusableProfiles` alanını kontrol edin. Ayarlama: `auth.cooldowns.billingBackoffHours*`.

    Hız sınırı cooldown'ları model kapsamlı olabilir. Bir model için cooldown'da olan bir profil,
    aynı sağlayıcıdaki kardeş bir model için yine de kullanılabilir olabilir;
    ancak faturalandırma/devre dışı pencereleri tüm profili yine de engeller.

    Ayrıca CLI üzerinden **agent başına** sıra geçersiz kılması da ayarlayabilirsiniz (o agent'ın `auth-state.json` dosyasında saklanır):

    ```bash
    # Yapılandırılmış varsayılan agent'ı kullanır (--agent verilmezse)
    openclaw models auth order get --provider anthropic

    # Rotasyonu tek bir profile kilitle (yalnızca bunu dene)
    openclaw models auth order set --provider anthropic anthropic:default

    # Veya açık bir sıra ayarla (sağlayıcı içinde fallback)
    openclaw models auth order set --provider anthropic anthropic:work anthropic:default

    # Geçersiz kılmayı temizle (config auth.order / round-robin'e fallback yap)
    openclaw models auth order clear --provider anthropic
    ```

    Belirli bir agent'ı hedeflemek için:

    ```bash
    openclaw models auth order set --provider anthropic --agent main anthropic:default
    ```

    Gerçekte neyin deneneceğini doğrulamak için şunu kullanın:

    ```bash
    openclaw models status --probe
    ```

    Depolanmış bir profil açık sıradan çıkarılmışsa, probe
    bunu sessizce denemek yerine o profil için `excluded_by_auth_order` bildirir.

  </Accordion>

  <Accordion title="OAuth ile API anahtarı arasındaki fark nedir?">
    OpenClaw ikisini de destekler:

    - **OAuth** çoğu zaman abonelik erişiminden yararlanır (uygulanabildiği yerde).
    - **API anahtarları** token başına ödeme faturalandırması kullanır.

    Sihirbaz, Anthropic Claude CLI, OpenAI Codex OAuth ve API anahtarlarını açıkça destekler.

  </Accordion>
</AccordionGroup>

## Gateway: portlar, "already running" ve remote mod

<AccordionGroup>
  <Accordion title="Gateway hangi portu kullanır?">
    `gateway.port`, WebSocket + HTTP (Control UI, hook'lar vb.) için tek çoklanmış portu kontrol eder.

    Öncelik:

    ```
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > varsayılan 18789
    ```

  </Accordion>

  <Accordion title='Neden openclaw gateway status "Runtime: running" ama "RPC probe: failed" diyor?'>
    Çünkü "running", **supervisor**'ın görüşüdür (launchd/systemd/schtasks). RPC probe ise CLI'ın gerçekten Gateway WebSocket'e bağlanıp `status` çağırmasıdır.

    `openclaw gateway status` kullanın ve şu satırlara güvenin:

    - `Probe target:` (probe'un gerçekten kullandığı URL)
    - `Listening:` (portta gerçekten neyin bağlı olduğu)
    - `Last gateway error:` (süreç canlı ama port dinlemiyorsa yaygın kök neden)

  </Accordion>

  <Accordion title='Neden openclaw gateway status "Config (cli)" ve "Config (service)" değerlerini farklı gösteriyor?'>
    Siz bir yapılandırma dosyasını düzenlerken servis başka birini çalıştırıyor (çoğu zaman `--profile` / `OPENCLAW_STATE_DIR` uyumsuzluğu).

    Düzeltme:

    ```bash
    openclaw gateway install --force
    ```

    Bunu, servisin kullanmasını istediğiniz aynı `--profile` / ortam ile çalıştırın.

  </Accordion>

  <Accordion title='“another gateway instance is already listening” ne anlama gelir?'>
    OpenClaw, çalışma zamanı kilidini başlangıçta WebSocket dinleyicisini hemen bağlayarak uygular (varsayılan `ws://127.0.0.1:18789`). Bağlama `EADDRINUSE` ile başarısız olursa, başka bir instance'ın zaten dinlediğini belirten `GatewayLockError` fırlatır.

    Düzeltme: diğer instance'ı durdurun, portu boşaltın veya `openclaw gateway --port <port>` ile çalıştırın.

  </Accordion>

  <Accordion title="OpenClaw'ı remote modda nasıl çalıştırırım (istemci başka yerdeki bir Gateway'e bağlanır)?">
    `gateway.mode: "remote"` ayarlayın ve isteğe bağlı paylaşılan gizli anahtar uzak kimlik bilgileriyle birlikte uzak bir WebSocket URL'sine yöneltin:

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

    - `openclaw gateway` yalnızca `gateway.mode` `local` olduğunda başlar (veya geçersiz kılma bayrağını geçirirseniz).
    - macOS uygulaması yapılandırma dosyasını izler ve bu değerler değiştiğinde modları canlı olarak değiştirir.
    - `gateway.remote.token` / `.password` yalnızca istemci tarafı uzak kimlik bilgileridir; tek başlarına local Gateway auth'u etkinleştirmezler.

  </Accordion>

  <Accordion title='Control UI "unauthorized" diyor (veya sürekli yeniden bağlanıyor). Şimdi ne yapmalıyım?'>
    Gateway auth yolunuz ile UI'ın auth yöntemi eşleşmiyor.

    Gerçekler (koddan):

    - Control UI, token'ı geçerli tarayıcı sekmesi oturumu ve seçilen Gateway URL'si için `sessionStorage` içinde tutar; böylece aynı sekmedeki yenilemeler, uzun ömürlü localStorage token kalıcılığını geri yüklemeden çalışmaya devam eder.
    - `AUTH_TOKEN_MISMATCH` durumunda, güvenilir istemciler, Gateway yeniden deneme ipuçları döndürdüğünde (`canRetryWithDeviceToken=true`, `recommendedNextStep=retry_with_device_token`) önbelleğe alınmış bir cihaz token'ıyla bir kez ve sınırlı biçimde yeniden deneyebilir.
    - Bu önbelleğe alınmış token ile yeniden deneme artık cihaz token'ıyla birlikte depolanan önbelleğe alınmış onaylı kapsamları yeniden kullanır. Açık `deviceToken` / açık `scopes` çağıranlar ise önbelleğe alınmış kapsamları devralmak yerine istedikleri kapsam kümesini korur.
    - Bu yeniden deneme yolu dışında, bağlantı auth önceliği sırasıyla açık paylaşılan token/parola, sonra açık `deviceToken`, sonra depolanmış cihaz token'ı, sonra bootstrap token'dır.
    - Bootstrap token kapsam kontrolleri rol önekine bağlıdır. Yerleşik bootstrap operatör allowlist'i yalnızca operatör isteklerini karşılar; node veya diğer operatör olmayan roller yine de kendi rol önekleri altında kapsamlara ihtiyaç duyar.

    Düzeltme:

    - En hızlısı: `openclaw dashboard` (dashboard URL'sini yazdırır + kopyalar, açmayı dener; headless ise SSH ipucu gösterir).
    - Henüz token'ınız yoksa: `openclaw doctor --generate-gateway-token`.
    - Remote ise önce tünelleyin: `ssh -N -L 18789:127.0.0.1:18789 user@host` sonra `http://127.0.0.1:18789/` açın.
    - Paylaşılan gizli anahtar modu: `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` veya `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` ayarlayın, sonra eşleşen secret'ı Control UI ayarlarına yapıştırın.
    - Tailscale Serve modu: `gateway.auth.allowTailscale` etkin olsun ve Tailscale kimlik başlıklarını atlayan ham loopback/tailnet URL'si değil, Serve URL'sini açtığınızdan emin olun.
    - Trusted-proxy modu: aynı host üzerindeki bir loopback proxy veya ham Gateway URL'si üzerinden değil, yapılandırılmış loopback olmayan kimlik farkındalıklı proxy üzerinden geldiğinizden emin olun.
    - Tek yeniden denemeden sonra uyumsuzluk sürüyorsa, eşlenmiş cihaz token'ını döndürün/yeniden onaylayın:
      - `openclaw devices list`
      - `openclaw devices rotate --device <id> --role operator`
    - Bu rotate çağrısı reddedildi derse iki şeyi kontrol edin:
      - eşlenmiş cihaz oturumları yalnızca **kendi** cihazlarını döndürebilir; `operator.admin` yetkileri de varsa başka durumlar mümkündür
      - açık `--scope` değerleri çağıranın mevcut operatör kapsamlarını aşamaz
    - Hâlâ takılı mı? `openclaw status --all` çalıştırın ve [Sorun Giderme](/tr/gateway/troubleshooting) bölümünü izleyin. Auth ayrıntıları için [Dashboard](/web/dashboard) bölümüne bakın.

  </Accordion>

  <Accordion title="gateway.bind tailnet ayarladım ama bağlanamıyor ve hiçbir şey dinlemiyor">
    `tailnet` bind, ağ arayüzlerinizden bir Tailscale IP'si seçer (100.64.0.0/10). Makine Tailscale üzerinde değilse (veya arayüz kapalıysa), bağlanacak bir şey yoktur.

    Düzeltme:

    - O host üzerinde Tailscale'i başlatın (100.x adresi olsun), veya
    - `gateway.bind: "loopback"` / `"lan"` değerine geçin.

    Not: `tailnet` açık seçimdir. `auto`, loopback'i tercih eder; yalnızca tailnet bind istediğinizde `gateway.bind: "tailnet"` kullanın.

  </Accordion>

  <Accordion title="Aynı host üzerinde birden fazla Gateway çalıştırabilir miyim?">
    Genellikle hayır - tek bir Gateway birden fazla mesajlaşma kanalı ve agent çalıştırabilir. Birden fazla Gateway'i yalnızca yedeklilik (ör: rescue bot) veya katı izolasyon gerektiğinde kullanın.

    Evet, ama şunları izole etmeniz gerekir:

    - `OPENCLAW_CONFIG_PATH` (instance başına yapılandırma)
    - `OPENCLAW_STATE_DIR` (instance başına durum)
    - `agents.defaults.workspace` (çalışma alanı izolasyonu)
    - `gateway.port` (benzersiz portlar)

    Hızlı kurulum (önerilen):

    - Instance başına `openclaw --profile <name> ...` kullanın (otomatik olarak `~/.openclaw-<name>` oluşturur).
    - Her profil yapılandırmasında benzersiz bir `gateway.port` ayarlayın (veya manuel çalıştırmalar için `--port` geçin).
    - Profil başına servis kurun: `openclaw --profile <name> gateway install`.

    Profiller ayrıca servis adlarına sonek ekler (`ai.openclaw.<profile>`; eski biçimler `com.openclaw.*`, `openclaw-gateway-<profile>.service`, `OpenClaw Gateway (<profile>)`).
    Tam rehber: [Birden fazla Gateway](/tr/gateway/multiple-gateways).

  </Accordion>

  <Accordion title='“invalid handshake” / code 1008 ne anlama gelir?'>
    Gateway bir **WebSocket sunucusudur** ve ilk mesajın mutlaka
    bir `connect` çerçevesi olmasını bekler. Başka bir şey alırsa, bağlantıyı
    **code 1008** (policy violation) ile kapatır.

    Yaygın nedenler:

    - Bir tarayıcıda **HTTP** URL'sini açtınız (`http://...`), WS istemcisi kullanmadınız.
    - Yanlış portu veya yolu kullandınız.
    - Bir proxy veya tünel auth başlıklarını kaldırdı ya da Gateway olmayan bir istek gönderdi.

    Hızlı düzeltmeler:

    1. WS URL'sini kullanın: `ws://<host>:18789` (veya HTTPS ise `wss://...`).
    2. WS portunu normal bir tarayıcı sekmesinde açmayın.
    3. Auth açıksa `connect` çerçevesine token/parolayı ekleyin.

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

    `logging.file` ile sabit bir yol ayarlayabilirsiniz. Dosya günlük düzeyi `logging.level` ile kontrol edilir. Konsol ayrıntı düzeyi `--verbose` ve `logging.consoleLevel` ile kontrol edilir.

    Günlükleri izlemenin en hızlı yolu:

    ```bash
    openclaw logs --follow
    ```

    Servis/supervisor günlükleri (Gateway launchd/systemd ile çalışıyorsa):

    - macOS: `$OPENCLAW_STATE_DIR/logs/gateway.log` ve `gateway.err.log` (varsayılan: `~/.openclaw/logs/...`; profiller `~/.openclaw-<profile>/logs/...` kullanır)
    - Linux: `journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`
    - Windows: `schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`

    Daha fazlası için bkz. [Sorun Giderme](/tr/gateway/troubleshooting).

  </Accordion>

  <Accordion title="Gateway servisini nasıl başlatır/durdurur/yeniden başlatırım?">
    Gateway yardımcılarını kullanın:

    ```bash
    openclaw gateway status
    openclaw gateway restart
    ```

    Gateway'i manuel çalıştırıyorsanız, `openclaw gateway --force` portu geri alabilir. Bkz. [Gateway](/tr/gateway).

  </Accordion>

  <Accordion title="Windows'ta terminali kapattım - OpenClaw'ı nasıl yeniden başlatırım?">
    **İki Windows kurulum modu** vardır:

    **1) WSL2 (önerilir):** Gateway Linux içinde çalışır.

    PowerShell'i açın, WSL'ye girin, sonra yeniden başlatın:

    ```powershell
    wsl
    openclaw gateway status
    openclaw gateway restart
    ```

    Servisi hiç kurmadıysanız, ön planda başlatın:

    ```bash
    openclaw gateway run
    ```

    **2) Native Windows (önerilmez):** Gateway doğrudan Windows'ta çalışır.

    PowerShell'i açın ve şunu çalıştırın:

    ```powershell
    openclaw gateway status
    openclaw gateway restart
    ```

    Manuel çalıştırıyorsanız (servis yok), şunu kullanın:

    ```powershell
    openclaw gateway run
    ```

    Belgeler: [Windows (WSL2)](/tr/platforms/windows), [Gateway servis runbook'u](/tr/gateway).

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

    - Model auth **Gateway host'unda** yüklenmemiş (bkz. `models status`).
    - Kanal eşleme/allowlist yanıtları engelliyor (kanal yapılandırmasını + günlükleri kontrol edin).
    - WebChat/Dashboard doğru token olmadan açık.

    Remote iseniz, tünel/Tailscale bağlantısının açık olduğunu ve
    Gateway WebSocket'ine erişilebildiğini doğrulayın.

    Belgeler: [Kanallar](/tr/channels), [Sorun Giderme](/tr/gateway/troubleshooting), [Uzaktan erişim](/tr/gateway/remote).

  </Accordion>

  <Accordion title='"Disconnected from gateway: no reason" - şimdi ne yapmalıyım?'>
    Bu genellikle UI'ın WebSocket bağlantısını kaybettiği anlamına gelir. Şunları kontrol edin:

    1. Gateway çalışıyor mu? `openclaw gateway status`
    2. Gateway sağlıklı mı? `openclaw status`
    3. UI doğru token'a sahip mi? `openclaw dashboard`
    4. Remote ise tünel/Tailscale bağlantısı açık mı?

    Sonra günlükleri izleyin:

    ```bash
    openclaw logs --follow
    ```

    Belgeler: [Dashboard](/web/dashboard), [Uzaktan erişim](/tr/gateway/remote), [Sorun Giderme](/tr/gateway/troubleshooting).

  </Accordion>

  <Accordion title="Telegram setMyCommands başarısız oluyor. Neyi kontrol etmeliyim?">
    Önce günlükler ve kanal durumuyla başlayın:

    ```bash
    openclaw channels status
    openclaw channels logs --channel telegram
    ```

    Sonra hatayı eşleyin:

    - `BOT_COMMANDS_TOO_MUCH`: Telegram menüsünde çok fazla giriş var. OpenClaw zaten Telegram sınırına göre budayıp daha az komutla yeniden dener, ancak bazı menü girdilerinin yine de kaldırılması gerekir. Plugin/Skill/özel komutları azaltın veya menüye ihtiyacınız yoksa `channels.telegram.commands.native` değerini devre dışı bırakın.
    - `TypeError: fetch failed`, `Network request for 'setMyCommands' failed!` veya benzer ağ hataları: VPS üzerindeyseniz veya proxy arkasındaysanız, `api.telegram.org` için giden HTTPS trafiğine izin verildiğini ve DNS'in çalıştığını doğrulayın.

    Gateway remote ise günlükleri Gateway host'unda incelediğinizden emin olun.

    Belgeler: [Telegram](/tr/channels/telegram), [Kanal sorun giderme](/tr/channels/troubleshooting).

  </Accordion>

  <Accordion title="TUI hiç çıktı göstermiyor. Neyi kontrol etmeliyim?">
    Önce Gateway'in erişilebilir olduğunu ve agent'ın çalışabildiğini doğrulayın:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    TUI içinde mevcut durumu görmek için `/status` kullanın. Bir sohbet
    kanalında yanıt bekliyorsanız teslimatın etkin olduğundan emin olun (`/deliver on`).

    Belgeler: [TUI](/web/tui), [Slash komutları](/tr/tools/slash-commands).

  </Accordion>

  <Accordion title="Gateway'i tamamen durdurup sonra nasıl başlatırım?">
    Servisi kurduysanız:

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    Bu, **denetlenen servisi** durdurur/başlatır (macOS'ta launchd, Linux'ta systemd).
    Bunu, Gateway arka planda bir daemon olarak çalışırken kullanın.

    Ön planda çalıştırıyorsanız, Ctrl-C ile durdurun, ardından:

    ```bash
    openclaw gateway run
    ```

    Belgeler: [Gateway servis runbook'u](/tr/gateway).

  </Accordion>

  <Accordion title="ELI5: openclaw gateway restart ile openclaw gateway">
    - `openclaw gateway restart`: **arka plan servisini** yeniden başlatır (launchd/systemd).
    - `openclaw gateway`: bu terminal oturumu için Gateway'i **ön planda** çalıştırır.

    Servisi kurduysanız Gateway komutlarını kullanın. Tek seferlik, ön plan çalıştırması istediğinizde
    `openclaw gateway` kullanın.

  </Accordion>

  <Accordion title="Bir şey başarısız olduğunda daha fazla ayrıntı almanın en hızlı yolu">
    Daha fazla konsol ayrıntısı almak için Gateway'i `--verbose` ile başlatın. Ardından kanal auth, model yönlendirme ve RPC hataları için günlük dosyasını inceleyin.
  </Accordion>
</AccordionGroup>

## Medya ve ekler

<AccordionGroup>
  <Accordion title="Skill'im bir görsel/PDF üretti, ama hiçbir şey gönderilmedi">
    Agent'tan giden ekler bir `MEDIA:<path-or-url>` satırı içermelidir (kendi satırında). Bkz. [OpenClaw assistant kurulumu](/tr/start/openclaw) ve [Agent gönderimi](/tr/tools/agent-send).

    CLI ile gönderme:

    ```bash
    openclaw message send --target +15555550123 --message "Here you go" --media /path/to/file.png
    ```

    Şunları da kontrol edin:

    - Hedef kanal giden medyayı destekliyor ve allowlist'ler tarafından engellenmiyor.
    - Dosya sağlayıcının boyut sınırları içinde (görseller en fazla 2048px olacak şekilde yeniden boyutlandırılır).
    - `tools.fs.workspaceOnly=true`, local yol gönderimlerini çalışma alanı, temp/media-store ve sandbox tarafından doğrulanmış dosyalarla sınırlar.
    - `tools.fs.workspaceOnly=false`, agent'ın zaten okuyabildiği host-local dosyaların `MEDIA:` ile gönderilmesine izin verir, ancak yalnızca medya artı güvenli belge türleri için (görseller, ses, video, PDF ve Office belgeleri). Düz metin ve secret benzeri dosyalar yine de engellenir.

    Bkz. [Görseller](/tr/nodes/images).

  </Accordion>
</AccordionGroup>

## Güvenlik ve erişim denetimi

<AccordionGroup>
  <Accordion title="OpenClaw'ı gelen DM'lere açmak güvenli mi?">
    Gelen DM'leri güvenilmeyen girdi olarak değerlendirin. Varsayılanlar riski azaltmak üzere tasarlanmıştır:

    - DM destekli kanallarda varsayılan davranış **pairing**'dir:
      - Bilinmeyen gönderenler bir pairing kodu alır; bot mesajlarını işlemez.
      - Şununla onaylayın: `openclaw pairing approve --channel <channel> [--account <id>] <code>`
      - Bekleyen istekler **kanal başına 3** ile sınırlıdır; kod gelmediyse `openclaw pairing list --channel <channel> [--account <id>]` komutunu kontrol edin.
    - DM'leri herkese açık açmak açık katılım gerektirir (`dmPolicy: "open"` ve allowlist `"*"`).

    Riskli DM politikalarını ortaya çıkarmak için `openclaw doctor` çalıştırın.

  </Accordion>

  <Accordion title="Prompt injection yalnızca herkese açık botlar için bir endişe mi?">
    Hayır. Prompt injection, bota kimin DM attığıyla değil, **güvenilmeyen içerikle** ilgilidir.
    Asistanınız harici içerik okuyorsa (web search/fetch, tarayıcı sayfaları, e-postalar,
    belgeler, ekler, yapıştırılmış günlükler), bu içerik modeli
    ele geçirmeye çalışan komutlar içerebilir. Bu, **tek gönderen siz olsanız bile** gerçekleşebilir.

    En büyük risk, araçlar etkin olduğunda ortaya çıkar: model, bağlamı sızdırmak veya sizin adınıza
    araç çağırmak için kandırılabilir. Etki alanını şu yollarla küçültün:

    - güvenilmeyen içeriği özetlemek için salt okunur veya araçları devre dışı bir "reader" agent kullanarak
    - araç etkin agent'lar için `web_search` / `web_fetch` / `browser` araçlarını kapalı tutarak
    - çözümlenmiş dosya/belge metnini de güvenilmeyen sayarak: OpenResponses
      `input_file` ve medya eki çıkarımı, çıkarılmış metni ham dosya metni olarak geçirmek yerine
      açık harici içerik sınır işaretleyicileri içine sarar
    - sandboxing ve katı araç allowlist'leri ile

    Ayrıntılar: [Security](/tr/gateway/security).

  </Accordion>

  <Accordion title="Botumun kendine ait e-postası, GitHub hesabı veya telefon numarası olmalı mı?">
    Evet, çoğu kurulum için. Botu ayrı hesaplar ve telefon numaralarıyla izole etmek,
    bir şeyler ters giderse etki alanını küçültür. Bu ayrıca kimlik bilgilerini döndürmeyi
    veya erişimi iptal etmeyi, kişisel hesaplarınızı etkilemeden kolaylaştırır.

    Küçük başlayın. Yalnızca gerçekten ihtiyacınız olan araçlara ve hesaplara erişim verin, gerekirse
    daha sonra genişletin.

    Belgeler: [Security](/tr/gateway/security), [Pairing](/tr/channels/pairing).

  </Accordion>

  <Accordion title="Metin mesajlarım üzerinde özerklik verebilir miyim ve bu güvenli mi?">
    Kişisel mesajlarınız üzerinde tam özerklik **önermiyoruz**. En güvenli model şudur:

    - DM'leri **pairing modunda** veya sıkı bir allowlist ile tutun.
    - Sizin adınıza mesaj göndermesini istiyorsanız **ayrı bir numara veya hesap** kullanın.
    - Taslak hazırlamasına izin verin, sonra **göndermeden önce onaylayın**.

    Denemek istiyorsanız, bunu özel bir hesapta yapın ve izole tutun. Bkz.
    [Security](/tr/gateway/security).

  </Accordion>

  <Accordion title="Kişisel asistan görevleri için daha ucuz modeller kullanabilir miyim?">
    Evet, **eğer** agent yalnızca sohbet içinse ve girdi güvenilirse. Daha küçük katmanlar
    komut ele geçirmeye daha yatkındır, bu yüzden araç etkin agent'lar için
    veya güvenilmeyen içerik okunurken bunlardan kaçının. Daha küçük bir model kullanmanız gerekiyorsa,
    araçları kilitleyin ve sandbox içinde çalıştırın. Bkz. [Security](/tr/gateway/security).
  </Accordion>

  <Accordion title="Telegram'da /start çalıştırdım ama pairing kodu almadım">
    Pairing kodları yalnızca bilinmeyen bir gönderen bota mesaj attığında ve
    `dmPolicy: "pairing"` etkin olduğunda gönderilir. `/start` tek başına kod üretmez.

    Bekleyen istekleri kontrol edin:

    ```bash
    openclaw pairing list telegram
    ```

    Hemen erişim istiyorsanız, gönderen kimliğinizi allowlist'e alın veya o hesap için `dmPolicy: "open"`
    ayarlayın.

  </Accordion>

  <Accordion title="WhatsApp: kişilerime mesaj atar mı? Pairing nasıl çalışır?">
    Hayır. Varsayılan WhatsApp DM politikası **pairing**'dir. Bilinmeyen gönderenler yalnızca bir pairing kodu alır ve mesajları **işlenmez**. OpenClaw yalnızca aldığı sohbetlere veya sizin tetiklediğiniz açık gönderimlere yanıt verir.

    Pairing'i şununla onaylayın:

    ```bash
    openclaw pairing approve whatsapp <code>
    ```

    Bekleyen istekleri listeleyin:

    ```bash
    openclaw pairing list whatsapp
    ```

    Sihirbaz telefon numarası istemi: bu, kendi DM'lerinize izin verilmesi için **allowlist/owner** ayarlamakta kullanılır. Otomatik gönderim için kullanılmaz. Kişisel WhatsApp numaranızda çalıştırıyorsanız, bu numarayı kullanın ve `channels.whatsapp.selfChatMode` özelliğini etkinleştirin.

  </Accordion>
</AccordionGroup>

## Sohbet komutları, görevleri iptal etme ve "durmuyor"

<AccordionGroup>
  <Accordion title="Dahili sistem mesajlarının sohbette görünmesini nasıl durdururum?">
    Çoğu dahili veya araç mesajı yalnızca o oturum için **verbose**, **trace** veya **reasoning** etkinse
    görünür.

    Gördüğünüz sohbette düzeltme:

    ```
    /verbose off
    /trace off
    /reasoning off
    ```

    Hâlâ gürültülüyse, Control UI içindeki oturum ayarlarını kontrol edin ve verbose değerini
    **inherit** olarak ayarlayın. Ayrıca yapılandırmada `verboseDefault` değeri
    `on` olan bir bot profili kullanmadığınızı doğrulayın.

    Belgeler: [Thinking ve verbose](/tr/tools/thinking), [Security](/tr/gateway/security#reasoning-verbose-output-in-groups).

  </Accordion>

  <Accordion title="Çalışan bir görevi nasıl durdurur/iptal ederim?">
    Şunlardan herhangi birini **tek başına mesaj olarak** gönderin (slash olmadan):

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

    Bunlar abort tetikleyicileridir (slash komutları değil).

    Arka plan süreçleri için (exec aracından), agent'tan şunu çalıştırmasını isteyebilirsiniz:

    ```
    process action:kill sessionId:XXX
    ```

    Slash komutlarına genel bakış: bkz. [Slash komutları](/tr/tools/slash-commands).

    Çoğu komut, `/` ile başlayan **tek başına** bir mesaj olarak gönderilmelidir, ancak birkaç kısayol (örneğin `/status`) allowlist'e alınmış gönderenler için satır içinde de çalışır.

  </Accordion>

  <Accordion title='Telegram'dan nasıl Discord mesajı gönderirim? ("Cross-context messaging denied")'>
    OpenClaw varsayılan olarak **sağlayıcılar arası** mesajlaşmayı engeller. Bir araç çağrısı
    Telegram'a bağlıysa, siz buna açıkça izin vermediğiniz sürece Discord'a göndermez.

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

    Yapılandırmayı düzenledikten sonra Gateway'i yeniden başlatın.

  </Accordion>

  <Accordion title='Botun hızlı arka arkaya mesajları "yok saydığı" neden hissediliyor?'>
    Queue modu, yeni mesajların işlemdeki bir çalıştırmayla nasıl etkileşime girdiğini kontrol eder. Modları değiştirmek için `/queue` kullanın:

    - `steer` - yeni mesajlar mevcut görevi yeniden yönlendirir
    - `followup` - mesajları tek tek çalıştırır
    - `collect` - mesajları toplu işler ve bir kez yanıt verir (varsayılan)
    - `steer-backlog` - şimdi yönlendirir, sonra backlog'u işler
    - `interrupt` - mevcut çalıştırmayı iptal eder ve yeniden başlar

    Followup modları için `debounce:2s cap:25 drop:summarize` gibi seçenekler ekleyebilirsiniz.

  </Accordion>
</AccordionGroup>

## Çeşitli

<AccordionGroup>
  <Accordion title='Anthropic için API anahtarıyla varsayılan model nedir?'>
    OpenClaw'da kimlik bilgileri ve model seçimi ayrıdır. `ANTHROPIC_API_KEY` ayarlamak (veya auth profillerinde bir Anthropic API anahtarı depolamak) kimlik doğrulamayı etkinleştirir, ancak gerçek varsayılan model `agents.defaults.model.primary` içinde yapılandırdığınız şeydir (örneğin `anthropic/claude-sonnet-4-6` veya `anthropic/claude-opus-4-6`). `No credentials found for profile "anthropic:default"` görüyorsanız, bu, Gateway'in çalışan agent için beklenen `auth-profiles.json` içinde Anthropic kimlik bilgilerini bulamadığı anlamına gelir.
  </Accordion>
</AccordionGroup>

---

Hâlâ takıldınız mı? [Discord](https://discord.com/invite/clawd) üzerinden sorun veya bir [GitHub discussion](https://github.com/openclaw/openclaw/discussions) açın.
