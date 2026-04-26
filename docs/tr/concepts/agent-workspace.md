---
read_when:
    - Aracı çalışma alanını veya dosya düzenini açıklamanız gerekiyor
    - Bir aracı çalışma alanını yedeklemek veya taşımak istiyorsunuz
sidebarTitle: Agent workspace
summary: 'Aracı çalışma alanı: konum, düzen ve yedekleme stratejisi'
title: Aracı çalışma alanı
x-i18n:
    generated_at: "2026-04-26T11:27:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 35d59d1f0dec05db30f9166a43bfa519d7299b08d093bbeb905d8f83e5cd022a
    source_path: concepts/agent-workspace.md
    workflow: 15
---

Çalışma alanı, aracının evidir. Dosya araçları ve çalışma alanı bağlamı için kullanılan tek çalışma dizinidir. Gizli tutun ve bellek gibi davranın.

Bu, config, kimlik bilgileri ve oturumları saklayan `~/.openclaw/` dizininden ayrıdır.

<Warning>
Çalışma alanı **varsayılan cwd**’dir, katı bir sandbox değildir. Araçlar göreli yolları çalışma alanına göre çözer, ancak sandboxing etkin değilse mutlak yollar yine de ana makinede başka yerlere erişebilir. Yalıtım gerekiyorsa [`agents.defaults.sandbox`](/tr/gateway/sandboxing) (ve/veya aracı başına sandbox config’i) kullanın.

Sandboxing etkin olduğunda ve `workspaceAccess` değeri `"rw"` olmadığında, araçlar ana makine çalışma alanınızda değil, `~/.openclaw/sandboxes` altındaki bir sandbox çalışma alanında çalışır.
</Warning>

## Varsayılan konum

- Varsayılan: `~/.openclaw/workspace`
- `OPENCLAW_PROFILE` ayarlıysa ve `"default"` değilse, varsayılan `~/.openclaw/workspace-<profile>` olur.
- `~/.openclaw/openclaw.json` içinde geçersiz kılın:

```json5
{
  agents: {
    defaults: {
      workspace: "~/.openclaw/workspace",
    },
  },
}
```

`openclaw onboard`, `openclaw configure` veya `openclaw setup`, çalışma alanını oluşturur ve eksikse bootstrap dosyalarını yerleştirir.

<Note>
Sandbox seed kopyaları yalnızca çalışma alanı içindeki normal dosyaları kabul eder; kaynak çalışma alanının dışına çözümlenen symlink/hardlink takma adları yok sayılır.
</Note>

Çalışma alanı dosyalarını zaten kendiniz yönetiyorsanız, bootstrap dosyası oluşturmayı devre dışı bırakabilirsiniz:

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## Ek çalışma alanı klasörleri

Eski kurulumlar `~/openclaw` oluşturmuş olabilir. Birden fazla çalışma alanı dizinini ortalıkta tutmak, kafa karıştırıcı kimlik doğrulama veya durum kaymasına neden olabilir; çünkü aynı anda yalnızca bir çalışma alanı etkindir.

<Note>
**Öneri:** tek bir etkin çalışma alanı tutun. Ek klasörleri artık kullanmıyorsanız arşivleyin veya Çöp’e taşıyın (örneğin `trash ~/openclaw`). Bilerek birden fazla çalışma alanı tutuyorsanız, `agents.defaults.workspace` değerinin etkin olanı işaret ettiğinden emin olun.

`openclaw doctor`, ek çalışma alanı dizinleri algıladığında uyarı verir.
</Note>

## Çalışma alanı dosya haritası

Bunlar, OpenClaw’ın çalışma alanı içinde beklediği standart dosyalardır:

<AccordionGroup>
  <Accordion title="AGENTS.md — çalışma talimatları">
    Aracı için çalışma talimatları ve belleği nasıl kullanması gerektiği. Her oturumun başında yüklenir. Kurallar, öncelikler ve “nasıl davranmalı” ayrıntıları için iyi bir yerdir.
  </Accordion>
  <Accordion title="SOUL.md — persona ve ton">
    Persona, ton ve sınırlar. Her oturumda yüklenir. Rehber: [SOUL.md kişilik rehberi](/tr/concepts/soul).
  </Accordion>
  <Accordion title="USER.md — kullanıcı kimdir">
    Kullanıcının kim olduğu ve ona nasıl hitap edileceği. Her oturumda yüklenir.
  </Accordion>
  <Accordion title="IDENTITY.md — ad, hava, emoji">
    Aracının adı, havası ve emojisi. Bootstrap ritüeli sırasında oluşturulur/güncellenir.
  </Accordion>
  <Accordion title="TOOLS.md — yerel araç kuralları">
    Yerel araçlarınız ve kurallarınız hakkında notlar. Araç kullanılabilirliğini denetlemez; yalnızca rehberlik sağlar.
  </Accordion>
  <Accordion title="HEARTBEAT.md — Heartbeat kontrol listesi">
    Heartbeat çalıştırmaları için isteğe bağlı küçük kontrol listesi. Token tüketimini önlemek için kısa tutun.
  </Accordion>
  <Accordion title="BOOT.md — başlangıç kontrol listesi">
    İsteğe bağlı başlangıç kontrol listesi; Gateway yeniden başlatıldığında otomatik çalışır ([internal hooks](/tr/automation/hooks) etkin olduğunda). Kısa tutun; giden iletiler için message aracını kullanın.
  </Accordion>
  <Accordion title="BOOTSTRAP.md — ilk çalıştırma ritüeli">
    Tek seferlik ilk çalıştırma ritüeli. Yalnızca yepyeni bir çalışma alanı için oluşturulur. Ritüel tamamlandıktan sonra silin.
  </Accordion>
  <Accordion title="memory/YYYY-MM-DD.md — günlük bellek günlüğü">
    Günlük bellek günlüğü (günde bir dosya). Oturum başlangıcında bugün + düne ait dosyaların okunması önerilir.
  </Accordion>
  <Accordion title="MEMORY.md — derlenmiş uzun vadeli bellek (isteğe bağlı)">
    Derlenmiş uzun vadeli bellek. Yalnızca ana, özel oturumda yüklenir (paylaşılan/grup bağlamlarında değil). İş akışı ve otomatik bellek boşaltma için [Memory](/tr/concepts/memory) sayfasına bakın.
  </Accordion>
  <Accordion title="skills/ — çalışma alanı Skills’leri (isteğe bağlı)">
    Çalışma alanına özgü Skills’ler. O çalışma alanı için en yüksek öncelikli skill konumu. Ad çakıştığında proje aracı Skills’lerini, kişisel aracı Skills’lerini, yönetilen Skills’leri, paketlenmiş Skills’leri ve `skills.load.extraDirs` değerini geçersiz kılar.
  </Accordion>
  <Accordion title="canvas/ — Canvas UI dosyaları (isteğe bağlı)">
    Node ekranları için Canvas UI dosyaları (örneğin `canvas/index.html`).
  </Accordion>
</AccordionGroup>

<Note>
Herhangi bir bootstrap dosyası eksikse, OpenClaw oturuma bir “eksik dosya” işaretçisi ekler ve devam eder. Büyük bootstrap dosyaları eklenirken kırpılır; sınırları `agents.defaults.bootstrapMaxChars` (varsayılan: 12000) ve `agents.defaults.bootstrapTotalMaxChars` (varsayılan: 60000) ile ayarlayın. `openclaw setup`, mevcut dosyaların üzerine yazmadan eksik varsayılanları yeniden oluşturabilir.
</Note>

## Çalışma alanında OLMAYANLAR

Bunlar `~/.openclaw/` altında bulunur ve çalışma alanı deposuna commit edilmemelidir:

- `~/.openclaw/openclaw.json` (config)
- `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (model auth profilleri: OAuth + API anahtarları)
- `~/.openclaw/credentials/` (kanal/sağlayıcı durumu ve eski OAuth içe aktarma verileri)
- `~/.openclaw/agents/<agentId>/sessions/` (oturum transcript’leri + meta veriler)
- `~/.openclaw/skills/` (yönetilen Skills)

Oturumları veya config’i taşımanız gerekiyorsa, bunları ayrı kopyalayın ve sürüm denetiminin dışında tutun.

## Git yedeği (önerilir, özel)

Çalışma alanını özel bellek olarak değerlendirin. Yedeklenebilir ve kurtarılabilir olması için **özel** bir git deposuna koyun.

Bu adımları Gateway’in çalıştığı makinede yürütün (çalışma alanı orada bulunur).

<Steps>
  <Step title="Depoyu başlatın">
    Git yüklüyse, yepyeni çalışma alanları otomatik olarak başlatılır. Bu çalışma alanı zaten bir depo değilse şunu çalıştırın:

    ```bash
    cd ~/.openclaw/workspace
    git init
    git add AGENTS.md SOUL.md TOOLS.md IDENTITY.md USER.md HEARTBEAT.md memory/
    git commit -m "Add agent workspace"
    ```

  </Step>
  <Step title="Özel bir remote ekleyin">
    <Tabs>
      <Tab title="GitHub web UI">
        1. GitHub’da yeni bir **özel** depo oluşturun.
        2. README ile başlatmayın (merge çakışmalarını önler).
        3. HTTPS remote URL’sini kopyalayın.
        4. Remote’u ekleyin ve push edin:

        ```bash
        git branch -M main
        git remote add origin <https-url>
        git push -u origin main
        ```
      </Tab>
      <Tab title="GitHub CLI (gh)">
        ```bash
        gh auth login
        gh repo create openclaw-workspace --private --source . --remote origin --push
        ```
      </Tab>
      <Tab title="GitLab web UI">
        1. GitLab’da yeni bir **özel** depo oluşturun.
        2. README ile başlatmayın (merge çakışmalarını önler).
        3. HTTPS remote URL’sini kopyalayın.
        4. Remote’u ekleyin ve push edin:

        ```bash
        git branch -M main
        git remote add origin <https-url>
        git push -u origin main
        ```
      </Tab>
    </Tabs>

  </Step>
  <Step title="Sürekli güncellemeler">
    ```bash
    git status
    git add .
    git commit -m "Update memory"
    git push
    ```
  </Step>
</Steps>

## Gizli bilgileri commit etmeyin

<Warning>
Özel bir depoda bile, gizli bilgileri çalışma alanında saklamaktan kaçının:

- API anahtarları, OAuth token’ları, parolalar veya özel kimlik bilgileri.
- `~/.openclaw/` altındaki herhangi bir şey.
- Sohbetlerin ham dökümleri veya hassas ekler.

Hassas başvuruları saklamanız gerekiyorsa yer tutucular kullanın ve gerçek gizli bilgiyi başka yerde tutun (parola yöneticisi, ortam değişkenleri veya `~/.openclaw/`).
</Warning>

Önerilen `.gitignore` başlangıcı:

```gitignore
.DS_Store
.env
**/*.key
**/*.pem
**/secrets*
```

## Çalışma alanını yeni bir makineye taşıma

<Steps>
  <Step title="Depoyu klonlayın">
    Depoyu istenen yola klonlayın (varsayılan `~/.openclaw/workspace`).
  </Step>
  <Step title="Config’i güncelleyin">
    Bu yolu `~/.openclaw/openclaw.json` içinde `agents.defaults.workspace` olarak ayarlayın.
  </Step>
  <Step title="Eksik dosyaları yerleştirin">
    Eksik dosyaları yerleştirmek için `openclaw setup --workspace <path>` çalıştırın.
  </Step>
  <Step title="Oturumları kopyalayın (isteğe bağlı)">
    Oturumlara ihtiyacınız varsa, `~/.openclaw/agents/<agentId>/sessions/` dizinini eski makineden ayrı olarak kopyalayın.
  </Step>
</Steps>

## Gelişmiş notlar

- Çoklu aracı yönlendirme, aracı başına farklı çalışma alanları kullanabilir. Yönlendirme config’i için [Channel routing](/tr/channels/channel-routing) sayfasına bakın.
- `agents.defaults.sandbox` etkinse, ana olmayan oturumlar `agents.defaults.sandbox.workspaceRoot` altında oturum başına sandbox çalışma alanları kullanabilir.

## İlgili

- [Heartbeat](/tr/gateway/heartbeat) — HEARTBEAT.md çalışma alanı dosyası
- [Sandboxing](/tr/gateway/sandboxing) — sandbox ortamlarında çalışma alanı erişimi
- [Session](/tr/concepts/session) — oturum depolama yolları
- [Standing orders](/tr/automation/standing-orders) — çalışma alanı dosyalarındaki kalıcı talimatlar
