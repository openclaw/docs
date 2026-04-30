---
read_when:
    - Ajan çalışma alanını veya dosya düzenini açıklamanız gerekir
    - Bir ajan çalışma alanını yedeklemek veya taşımak istiyorsunuz
sidebarTitle: Agent workspace
summary: 'Ajan çalışma alanı: konum, düzen ve yedekleme stratejisi'
title: Ajan çalışma alanı
x-i18n:
    generated_at: "2026-04-30T20:05:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: b1ccf74cbec3ff20f4c1c1ce52f099a7ca3365b2536b0aad6ff1d3a5fafcca0a
    source_path: concepts/agent-workspace.md
    workflow: 16
---

Çalışma alanı, ajanın evidir. Dosya araçları ve çalışma alanı bağlamı için kullanılan tek çalışma dizinidir. Onu özel tutun ve bellek gibi ele alın.

Bu, yapılandırma, kimlik bilgileri ve oturumları depolayan `~/.openclaw/` dizininden ayrıdır.

<Warning>
Çalışma alanı **varsayılan cwd**'dir, katı bir sandbox değildir. Araçlar göreli yolları çalışma alanına göre çözer, ancak sandboxing etkin değilse mutlak yollar host üzerinde başka yerlere hâlâ erişebilir. Yalıtım gerekiyorsa [`agents.defaults.sandbox`](/tr/gateway/sandboxing) (ve/veya ajan başına sandbox yapılandırması) kullanın.

Sandboxing etkinleştirildiğinde ve `workspaceAccess` `"rw"` değilse, araçlar host çalışma alanınızda değil, `~/.openclaw/sandboxes` altındaki bir sandbox çalışma alanında çalışır.
</Warning>

## Varsayılan konum

- Varsayılan: `~/.openclaw/workspace`
- `OPENCLAW_PROFILE` ayarlanmışsa ve `"default"` değilse varsayılan `~/.openclaw/workspace-<profile>` olur.
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

`openclaw onboard`, `openclaw configure` veya `openclaw setup`, çalışma alanını oluşturur ve eksiklerse bootstrap dosyalarını yerleştirir.

<Note>
Sandbox seed kopyaları yalnızca çalışma alanı içindeki normal dosyaları kabul eder; kaynak çalışma alanının dışına çözümlenen symlink/hardlink takma adları yok sayılır.
</Note>

Çalışma alanı dosyalarını zaten kendiniz yönetiyorsanız, bootstrap dosyası oluşturmayı devre dışı bırakabilirsiniz:

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## Ek çalışma alanı klasörleri

Eski kurulumlar `~/openclaw` oluşturmuş olabilir. Etrafta birden çok çalışma alanı dizini tutmak kafa karıştırıcı auth veya durum kaymalarına yol açabilir, çünkü aynı anda yalnızca bir çalışma alanı aktiftir.

<Note>
**Öneri:** tek bir etkin çalışma alanı tutun. Ek klasörleri artık kullanmıyorsanız arşivleyin veya Çöp Kutusu'na taşıyın (örneğin `trash ~/openclaw`). Bilerek birden çok çalışma alanı tutuyorsanız `agents.defaults.workspace` değerinin etkin olana işaret ettiğinden emin olun.

`openclaw doctor`, ek çalışma alanı dizinleri algıladığında uyarır.
</Note>

## Çalışma alanı dosya haritası

Bunlar OpenClaw'ın çalışma alanı içinde beklediği standart dosyalardır:

<AccordionGroup>
  <Accordion title="AGENTS.md — işletim talimatları">
    Ajan için işletim talimatları ve belleği nasıl kullanması gerektiği. Her oturumun başında yüklenir. Kurallar, öncelikler ve "nasıl davranılacağı" ayrıntıları için iyi bir yerdir.
  </Accordion>
  <Accordion title="SOUL.md — persona ve ton">
    Persona, ton ve sınırlar. Her oturumda yüklenir. Kılavuz: [SOUL.md kişilik kılavuzu](/tr/concepts/soul).
  </Accordion>
  <Accordion title="USER.md — kullanıcının kim olduğu">
    Kullanıcının kim olduğu ve ona nasıl hitap edileceği. Her oturumda yüklenir.
  </Accordion>
  <Accordion title="IDENTITY.md — ad, tarz, emoji">
    Ajanın adı, tarzı ve emojisi. Bootstrap ritüeli sırasında oluşturulur/güncellenir.
  </Accordion>
  <Accordion title="TOOLS.md — yerel araç kuralları">
    Yerel araçlarınız ve kurallarınız hakkında notlar. Araç kullanılabilirliğini denetlemez; yalnızca rehberliktir.
  </Accordion>
  <Accordion title="HEARTBEAT.md — Heartbeat kontrol listesi">
    Heartbeat çalıştırmaları için isteğe bağlı küçük kontrol listesi. Token tüketimini önlemek için kısa tutun.
  </Accordion>
  <Accordion title="BOOT.md — başlangıç kontrol listesi">
    Gateway yeniden başlatıldığında otomatik olarak çalıştırılan isteğe bağlı başlangıç kontrol listesi ([internal hooks](/tr/automation/hooks) etkin olduğunda). Kısa tutun; dışa gönderimler için message aracını kullanın.
  </Accordion>
  <Accordion title="BOOTSTRAP.md — ilk çalıştırma ritüeli">
    Bir defalık ilk çalıştırma ritüeli. Yalnızca yepyeni bir çalışma alanı için oluşturulur. Ritüel tamamlandıktan sonra silin.
  </Accordion>
  <Accordion title="memory/YYYY-MM-DD.md — günlük bellek günlüğü">
    Günlük bellek günlüğü (günde bir dosya). Oturum başlangıcında bugün + dünü okumanız önerilir.
  </Accordion>
  <Accordion title="MEMORY.md — düzenlenmiş uzun vadeli bellek (isteğe bağlı)">
    Düzenlenmiş uzun vadeli bellek. Yalnızca ana, özel oturumda yükleyin (paylaşılan/grup bağlamlarında değil). İş akışı ve otomatik bellek boşaltma için [Memory](/tr/concepts/memory) bölümüne bakın.
  </Accordion>
  <Accordion title="skills/ — çalışma alanı Skills (isteğe bağlı)">
    Çalışma alanına özgü Skills. O çalışma alanı için en yüksek öncelikli skill konumu. Adlar çakıştığında proje ajanı skill'lerini, kişisel ajan skill'lerini, yönetilen skill'leri, paketlenmiş skill'leri ve `skills.load.extraDirs` değerini geçersiz kılar.
  </Accordion>
  <Accordion title="canvas/ — Canvas UI dosyaları (isteğe bağlı)">
    Node gösterimleri için Canvas UI dosyaları (örneğin `canvas/index.html`).
  </Accordion>
</AccordionGroup>

<Note>
Herhangi bir bootstrap dosyası eksikse OpenClaw oturuma bir "eksik dosya" işaretçisi enjekte eder ve devam eder. Büyük bootstrap dosyaları enjekte edildiğinde kırpılır; sınırları `agents.defaults.bootstrapMaxChars` (varsayılan: 12000) ve `agents.defaults.bootstrapTotalMaxChars` (varsayılan: 60000) ile ayarlayın. `openclaw setup`, mevcut dosyaların üzerine yazmadan eksik varsayılanları yeniden oluşturabilir.
</Note>

## Çalışma alanında OLMAYANLAR

Bunlar `~/.openclaw/` altında bulunur ve çalışma alanı reposuna commit EDİLMEMELİDİR:

- `~/.openclaw/openclaw.json` (yapılandırma)
- `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (model auth profilleri: OAuth + API anahtarları)
- `~/.openclaw/agents/<agentId>/agent/codex-home/` (ajan başına Codex çalışma zamanı hesabı, yapılandırma, skills, plugins ve yerel thread durumu)
- `~/.openclaw/credentials/` (kanal/sağlayıcı durumu ve eski OAuth içe aktarma verileri)
- `~/.openclaw/agents/<agentId>/sessions/` (oturum dökümleri + metadata)
- `~/.openclaw/skills/` (yönetilen skills)

Oturumları veya yapılandırmayı taşımanız gerekiyorsa bunları ayrı kopyalayın ve sürüm kontrolünün dışında tutun.

## Git yedeği (önerilir, özel)

Çalışma alanını özel bellek olarak ele alın. Yedeklenmesi ve kurtarılabilmesi için onu **özel** bir git reposuna koyun.

Bu adımları Gateway'in çalıştığı makinede çalıştırın (çalışma alanının bulunduğu yer orasıdır).

<Steps>
  <Step title="Repoyu başlatın">
    Git yüklüyse yepyeni çalışma alanları otomatik olarak başlatılır. Bu çalışma alanı zaten bir repo değilse şunu çalıştırın:

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
        1. GitHub üzerinde yeni bir **özel** repository oluşturun.
        2. README ile başlatmayın (merge çakışmalarını önler).
        3. HTTPS remote URL'sini kopyalayın.
        4. Remote'u ekleyin ve push yapın:

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
        1. GitLab üzerinde yeni bir **özel** repository oluşturun.
        2. README ile başlatmayın (merge çakışmalarını önler).
        3. HTTPS remote URL'sini kopyalayın.
        4. Remote'u ekleyin ve push yapın:

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
Özel bir repoda bile, gizli bilgileri çalışma alanında saklamaktan kaçının:

- API anahtarları, OAuth token'ları, parolalar veya özel kimlik bilgileri.
- `~/.openclaw/` altındaki herhangi bir şey.
- Sohbetlerin veya hassas eklerin ham dump'ları.

Hassas referanslar saklamanız gerekiyorsa placeholder'lar kullanın ve gerçek sırrı başka bir yerde tutun (parola yöneticisi, ortam değişkenleri veya `~/.openclaw/`).
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
  <Step title="Repoyu clone edin">
    Repoyu istenen yola clone edin (varsayılan `~/.openclaw/workspace`).
  </Step>
  <Step title="Yapılandırmayı güncelleyin">
    `~/.openclaw/openclaw.json` içinde `agents.defaults.workspace` değerini bu yola ayarlayın.
  </Step>
  <Step title="Eksik dosyaları seed edin">
    Eksik dosyaları seed etmek için `openclaw setup --workspace <path>` çalıştırın.
  </Step>
  <Step title="Oturumları kopyalayın (isteğe bağlı)">
    Oturumlara ihtiyacınız varsa eski makineden `~/.openclaw/agents/<agentId>/sessions/` dizinini ayrı olarak kopyalayın.
  </Step>
</Steps>

## Gelişmiş notlar

- Çok ajanlı yönlendirme, ajan başına farklı çalışma alanları kullanabilir. Yönlendirme yapılandırması için [Channel routing](/tr/channels/channel-routing) bölümüne bakın.
- `agents.defaults.sandbox` etkinse, ana olmayan oturumlar `agents.defaults.sandbox.workspaceRoot` altında oturum başına sandbox çalışma alanları kullanabilir.

## İlgili

- [Heartbeat](/tr/gateway/heartbeat) — HEARTBEAT.md çalışma alanı dosyası
- [Sandboxing](/tr/gateway/sandboxing) — sandbox ortamlarında çalışma alanı erişimi
- [Session](/tr/concepts/session) — oturum depolama yolları
- [Standing orders](/tr/automation/standing-orders) — çalışma alanı dosyalarındaki kalıcı talimatlar
