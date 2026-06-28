---
read_when:
    - Yeni bir OpenClaw ajan oturumu başlatma
    - Varsayılan Skills'i etkinleştirme veya denetleme
summary: Varsayılan OpenClaw ajan yönergeleri ve kişisel asistan kurulumu için Skills listesi
title: Varsayılan AGENTS.md
x-i18n:
    generated_at: "2026-06-28T01:14:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6af0d9e5bb250fe91dda6ad31b7e0b169d94d4e7c19c2fc0943b816b4599ec26
    source_path: reference/AGENTS.default.md
    workflow: 16
---

## İlk çalıştırma (önerilir)

OpenClaw, agent için ayrılmış bir workspace dizini kullanır. Varsayılan: `~/.openclaw/workspace` (`agents.defaults.workspace` üzerinden yapılandırılabilir).

1. Workspace'i oluşturun (zaten yoksa):

```bash
mkdir -p ~/.openclaw/workspace
```

2. Varsayılan workspace şablonlarını workspace'e kopyalayın:

```bash
cp docs/reference/templates/AGENTS.md ~/.openclaw/workspace/AGENTS.md
cp docs/reference/templates/SOUL.md ~/.openclaw/workspace/SOUL.md
cp docs/reference/templates/TOOLS.md ~/.openclaw/workspace/TOOLS.md
```

3. İsteğe bağlı: kişisel asistan skill listesini istiyorsanız AGENTS.md dosyasını şu dosyayla değiştirin:

```bash
cp docs/reference/AGENTS.default.md ~/.openclaw/workspace/AGENTS.md
```

4. İsteğe bağlı: `agents.defaults.workspace` ayarlayarak farklı bir workspace seçin (`~` desteklenir):

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

## Güvenlik varsayılanları

- Dizinleri veya gizli bilgileri sohbete dökmeyin.
- Açıkça istenmedikçe yıkıcı komutlar çalıştırmayın.
- Config veya zamanlayıcıları değiştirmeden önce (örneğin crontab, systemd birimleri, nginx config'leri veya shell rc dosyaları), önce mevcut durumu inceleyin ve varsayılan olarak koruyun/birleştirin.
- Harici mesajlaşma yüzeylerine kısmi/streaming yanıtlar göndermeyin (yalnızca nihai yanıtlar).

## Mevcut çözümler ön kontrolü

Özel bir sistem, özellik, workflow, araç, entegrasyon veya otomasyon önermeden ya da oluşturmadan önce, bunu yeterince iyi çözen açık kaynak projeler, bakımı yapılan kütüphaneler, mevcut OpenClaw plugin'leri veya ücretsiz platformlar için kısa bir kontrol yapın. Uygun olduklarında bunları tercih edin. Özel çözümü yalnızca mevcut seçenekler uygun değilse, çok pahalıysa, bakımı yapılmıyorsa, güvensizse, uyumsuzsa veya kullanıcı açıkça özel çözüm isterse oluşturun. Kullanıcı harcamayı açıkça onaylamadıkça ücretli servis önerilerinden kaçının. Bunu hafif tutun: geniş bir araştırma görevi değil, bir ön kontrol kapısı.

## Oturum başlangıcı (zorunlu)

- `SOUL.md`, `USER.md` ve `memory/` içindeki bugün+dün dosyalarını okuyun.
- Varsa `MEMORY.md` dosyasını okuyun.
- Bunu yanıt vermeden önce yapın.

## Soul (zorunlu)

- `SOUL.md` kimliği, tonu ve sınırları tanımlar. Güncel tutun.
- `SOUL.md` dosyasını değiştirirseniz kullanıcıya söyleyin.
- Her oturumda taze bir örneksiniz; süreklilik bu dosyalarda yaşar.

## Paylaşılan alanlar (önerilir)

- Kullanıcının sesi değilsiniz; grup sohbetlerinde veya herkese açık kanallarda dikkatli olun.
- Özel verileri, iletişim bilgilerini veya dahili notları paylaşmayın.

## Bellek sistemi (önerilir)

- Günlük kayıt: `memory/YYYY-MM-DD.md` (gerekiyorsa `memory/` oluşturun).
- Uzun vadeli bellek: kalıcı olgular, tercihler ve kararlar için `MEMORY.md`.
- Küçük harfli `memory.md` yalnızca eski onarım girdisidir; iki kök dosyayı bilerek birlikte tutmayın.
- Oturum başlangıcında, varsa bugün + dün + `MEMORY.md` dosyasını okuyun.
- Bellek dosyalarını yazmadan önce önce okuyun; yalnızca somut güncellemeler yazın, asla boş placeholder'lar yazmayın.
- Kaydedin: kararlar, tercihler, kısıtlar, açık döngüler.
- Açıkça istenmedikçe gizli bilgilerden kaçının.

## Araçlar ve Skills

- Araçlar Skills içinde yaşar; ihtiyaç duyduğunuzda her skill'in `SKILL.md` dosyasını izleyin.
- Ortama özgü notları `TOOLS.md` içinde tutun (Skills için Notlar).

## Yedekleme ipucu (önerilir)

Bu workspace'i Clawd'ın "belleği" olarak ele alıyorsanız, `AGENTS.md` ve bellek dosyalarınızın yedeklenmesi için bunu bir git deposu yapın (idealde özel).

```bash
cd ~/.openclaw/workspace
git init
git add AGENTS.md
git commit -m "Add Clawd workspace"
# İsteğe bağlı: özel bir remote ekleyin + push yapın
```

## OpenClaw ne yapar

- WhatsApp gateway + gömülü OpenClaw agent çalıştırır; böylece asistan sohbetleri okuyup yazabilir, context alabilir ve host Mac üzerinden skills çalıştırabilir.
- macOS uygulaması izinleri (ekran kaydı, bildirimler, mikrofon) yönetir ve paketlenmiş binary'si üzerinden `openclaw` CLI'sini sunar.
- Doğrudan sohbetler varsayılan olarak agent'ın `main` oturumuna daraltılır; gruplar `agent:<agentId>:<channel>:group:<id>` olarak izole kalır (odalar/kanallar: `agent:<agentId>:<channel>:channel:<id>`); Heartbeat'ler arka plan görevlerini canlı tutar.

## Temel skills (Ayarlar → Skills içinde etkinleştirin)

- **mcporter** - Harici skill backend'lerini yönetmek için araç sunucusu runtime/CLI'si.
- **Peekaboo** - İsteğe bağlı AI vision analiziyle hızlı macOS ekran görüntüleri.
- **camsnap** - RTSP/ONVIF güvenlik kameralarından kareler, klipler veya hareket uyarıları yakalayın.
- **oracle** - Oturum replay'i ve tarayıcı kontrolüyle OpenAI'e hazır agent CLI'si.
- **eightctl** - Uykunuzu terminalden kontrol edin.
- **imsg** - iMessage ve SMS gönderin, okuyun, stream edin.
- **wacli** - WhatsApp CLI: eşitleme, arama, gönderme.
- **discord** - Discord eylemleri: tepki, çıkartmalar, anketler. `user:<id>` veya `channel:<id>` hedeflerini kullanın (çıplak sayısal id'ler belirsizdir).
- **gog** - Google Suite CLI: Gmail, Calendar, Drive, Contacts.
- **spotify-player** - Çalma listesine eklemek/çalma kontrolü yapmak için terminal Spotify istemcisi.
- **sag** - mac tarzı say UX'iyle ElevenLabs konuşması; varsayılan olarak hoparlörlere stream eder.
- **Sonos CLI** - Sonos hoparlörlerini (keşif/durum/çalma/ses/gruplama) script'lerden kontrol edin.
- **blucli** - BluOS oynatıcıları script'lerden çalın, gruplayın ve otomatikleştirin.
- **OpenHue CLI** - Sahne ve otomasyonlar için Philips Hue aydınlatma kontrolü.
- **OpenAI Whisper** - Hızlı dikte ve sesli mesaj transkriptleri için yerel speech-to-text.
- **Gemini CLI** - Hızlı soru-cevap için terminalden Google Gemini modelleri.
- **agent-tools** - Otomasyonlar ve yardımcı script'ler için yardımcı araç seti.

## Kullanım notları

- Script yazımı için `openclaw` CLI'sini tercih edin; Mac uygulaması izinleri yönetir.
- Kurulumları Skills sekmesinden çalıştırın; binary zaten mevcutsa düğmeyi gizler.
- Asistanın hatırlatıcılar zamanlayabilmesi, gelen kutularını izleyebilmesi ve kamera yakalamalarını tetikleyebilmesi için Heartbeat'leri etkin tutun.
- Canvas UI, yerel overlay'lerle tam ekran çalışır. Kritik kontrolleri sol üst/sağ üst/alt kenarlara yerleştirmekten kaçının; layout'a açık gutters ekleyin ve safe-area inset'lerine güvenmeyin.
- Tarayıcıyla yürütülen doğrulama için OpenClaw tarafından yönetilen Chrome profiliyle `openclaw browser` (sekmeler/durum/ekran görüntüsü) kullanın.
- DOM incelemesi için `openclaw browser eval|query|dom|snapshot` kullanın (makine çıktısı gerektiğinde `--json`/`--out` ile).
- Etkileşimler için `openclaw browser click|type|hover|drag|select|upload|press|wait|navigate|back|evaluate|run` kullanın (click/type snapshot ref'leri gerektirir; CSS seçiciler için `evaluate` kullanın).

## İlgili

- [Agent workspace](/tr/concepts/agent-workspace)
- [Agent runtime](/tr/concepts/agent)
