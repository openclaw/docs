---
read_when:
    - Codex filo gözetimini tasarlama
    - Kodex oturumlarını okuyan, yönlendiren veya başlatan OpenClaw araçları oluşturma
    - Denetimli Codex için yerel, Cloudflare ve VPS dağıtımı arasında seçim yapma
summary: OpenClaw tarafından kontrol edilen Codex app-server oturumları için filo gözetim planı.
title: Claw Denetleyicisi
x-i18n:
    generated_at: "2026-06-28T01:18:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ecdd58730011c94796c6df1d757606aad7112d2f36f30921541ac7f5d46ad91f
    source_path: specs/claw-supervisor.md
    workflow: 16
---

# Claw Gözetmeni

## Amaç

Claw Gözetmeni, her zaman açık olan tek bir OpenClaw örneğinin normal Codex kullanıcı deneyimini değiştirmeden bir Codex oturumları filosunu izlemesini ve yönetmesini sağlar. Bir kullanıcı bir ana makineye SSH ile bağlanabilir, Codex’i başlatabilir, TUI içinde çalışabilir ve gözetmen yine de oturumu okuyabilir, yönlendirebilir, kesebilir, ilişkili oturumlar başlatabilir ve devirleri kabul edebilir. Codex oturumları MCP üzerinden OpenClaw’a geri çağrı da yapabilir.

## Ürün Modeli

Codex birincil çalışma yüzeyi olarak kalır. OpenClaw, Codex’i opak bir OpenClaw alt ajanının içinde gizlemek yerine Codex’i gözetir.

OpenClaw Plugin adı `codex-supervisor` olur. `crabfleet`, yeniden kullanılabilir Plugin adı olmak yerine CRAB makineleri için dağıtım
ve ana makine filosu profili olarak kalır.

Modelin üç rolü vardır:

- İnsanın bağlı olduğu Codex: paylaşılan bir uygulama sunucusu üzerinden başlatılan normal etkileşimli Codex TUI.
- Otonom Codex: gözetmen tarafından başlatılan ve bir insanın daha sonra bağlanabileceği bir Codex uygulama sunucusu iş parçacığı.
- Gözetmen Claw: filo durumu, transkript okuma, yönlendirme, kesme, başlatma ve devir için araçlara sahip, her zaman açık bir OpenClaw ajanı.

OpenClaw mevcut alt ajan mekanizmasını dahili olarak kullanabilir, ancak dış sözleşme Codex iş parçacığı kimliğine sahip bağlanılabilir bir Codex oturumudur.

## Mimari

```text
user SSH session
  -> codex --remote unix://... or ws://...
      -> local codex app-server daemon
          <-> host sidecar / supervisor connector
              <-> OpenClaw fleet supervisor
                  <-> supervisor MCP exposed back to Codex
```

Codex destekli her ana makine şunları çalıştırır:

- Codex uygulama sunucusu daemon’ı.
- Etkileşimli Codex’i her zaman `--remote` ile başlatan bir başlatıcı.
- Uygulama sunucusu uç noktalarını ve canlı iş parçacıklarını gözetmene kaydeden bir bağlayıcı.

Gözetmen şunları çalıştırır:

- Uç nokta kayıt defteri.
- Oturum kayıt defteri.
- Codex uygulama sunucusu JSON-RPC istemci havuzu.
- Codex’ten Claw’a çağrılar için MCP sunucusu.
- Claw’dan Codex’e denetim için OpenClaw araçları.
- Otonom eylemler, onaylar ve döngü önleme için politika motoru.

## Codex Uygulama Sunucusu Sözleşmesi

Kanonik denetim düzlemi olarak Codex uygulama sunucusu API’lerini kullanın:

- `initialize`, `initialized`
- `thread/loaded/list`
- `thread/list`
- `thread/read`
- `thread/resume`
- `thread/start`
- `turn/start`
- `turn/steer`
- `turn/interrupt`
- `model/list`

Etkileşimli Codex, TUI ve gözetmenin aynı uygulama sunucusuna bağlanması için `codex --remote <endpoint>` ile başlatılmalıdır. Bağımsız `codex exec` bugün canlı paylaşılan bir oturum değildir; Codex `exec --remote` desteği sunana kadar otonom çalışma için uygulama sunucusu API’lerini kullanın.

## Oturum Kayıt Defteri

Gözetmen, gözlemlenen her Codex iş parçacığı için bir kayıt saklar:

```json
{
  "sessionId": "codex-thread-id",
  "endpointId": "host-a",
  "host": "host-a.example",
  "workspace": "/workspace/repo",
  "repo": "owner/repo",
  "branch": "feature/example",
  "source": "vscode",
  "status": "idle",
  "humanAttached": true,
  "lastSeenAt": "2026-05-28T10:00:00.000Z",
  "summary": "Short working-state summary"
}
```

Yerel uygulama çoğu alanı Codex iş parçacığı meta verilerinden türetebilir. Filo dağıtımı kayıtları ana makine kimliği, kullanıcı bağlantı durumu, git durumu ve sidecar sağlığı ile zenginleştirmelidir.

## Codex İçin MCP Yüzeyi

Gözetilen her Codex, `openclaw-codex-supervisor` adlı bir MCP sunucusu alır.

Araçlar:

- `codex_sessions_list`: görünür Codex oturumlarını listele.
- `codex_session_read`: bir transkripti oku.
- `codex_session_send`: boşta olan bir iş parçacığına mesaj gönder veya etkin bir iş parçacığını yönlendir.
- `codex_session_interrupt`: etkin turu kes.
- `codex_endpoint_probe`: uç nokta bağlantısını doğrula.
- `claw_report_progress`: mevcut görev durumunu gözetmene yayımla.
- `claw_ask`: gözetmenden yardım veya yetki devri iste.
- `codex_spawn`: yeni bir otonom Codex oturumu oluştur.
- `codex_handoff`: insan veya eş düzey devralma iste.

Kaynaklar:

- `codex://sessions`
- `codex://sessions/{sessionId}`
- `codex://sessions/{sessionId}/transcript`

## Claw Denetim Yüzeyi

Her zaman açık Claw, dahili araçlarla aynı ilkelere sahip olur:

- oturumları ve uç noktaları listeleme
- transkriptleri okuma
- metin gönderme/yönlendirme
- etkin çalışmayı kesme
- yeni oturumlar başlatma
- oturumları özetleme ve atama
- filtrelenmiş bir gruba yönergeler yayımlama
- oturumları engellendi, tamamlandı veya terk edildi olarak işaretleme

Araç davranışı:

- Hedef iş parçacığı boşta ise `codex_session_send`, `turn/start` ile eşlenir.
- Hedef iş parçacığı etkinse ve sürmekte olan bir tur kimliği görünürse `turn/steer` ile eşlenir.
- Etkin tur tanımlanamıyorsa araç, ilişkisiz bir tur oluşturmak yerine kapalı biçimde başarısız olur.
- Codex’e açılan MCP yazma denetimleri, güvenilir ve yalnızca gözetmene özel bir politika bunları etkinleştirmedikçe devre dışı kalır.
- Ham transkript okumaları, güvenilir ve yalnızca gözetmene özel bir politika bunları etkinleştirmedikçe devre dışı kalır.
- Otonom onay varsayılanları, açık bir politika aksini söylemedikçe araç/dosya onaylarını reddeder.

## Başlatma Akışı

Etkileşimli ana makine oturum açma:

1. Kullanıcı bir CRAB ana makinesine SSH ile bağlanır.
2. SSH hizmeti `codex app-server daemon start` işlemini başlatır veya doğrular.
3. Oturum açma sarmalayıcısı `codex --remote unix:// --cd <workspace>` komutunu başlatır.
4. Ana makine bağlayıcısı uç noktayı ve yüklenmiş iş parçacığını kaydeder.
5. Gözetmen yüksek öncelikli bir filo olayı yayar: yeni Codex oturumu, çalışma alanı, insan bağlı durumu, mevcut görev önizlemesi.
6. Gözetmen Claw hemen okuyabilir ve yönlendirebilir.

Otonom başlatma:

1. Gözetmen ana makineyi ve çalışma alanını seçer.
2. Ana makine bağlayıcısı bir Codex uygulama sunucusu iş parçacığını açar veya sürdürür.
3. Gözetmen ilk turu görev metni ve MCP yapılandırmasıyla başlatır.
4. Oturum kayıt defteri bunu otonom ve bağlanılabilir olarak işaretler.
5. Codex bu kesin UX’i desteklediğinde insan daha sonra `codex --remote <endpoint> resume <threadId>` ile ya da aynı uygulama sunucusundaki mevcut sürdürme akışıyla bağlanabilir.

## Dağıtım

Tercih edilen denetim düzlemi:

- Ana makine bağlayıcıları gözetmene giden WebSocket bağlantılarını açık tutar.
- Gözetmen durumu OpenClaw Gateway depolamasında yaşar.
- Codex uygulama sunucusu her ana makinede yerel kalır; ham kimlik doğrulaması olmayan bir uygulama sunucusunu asla herkese açık internete açmayın.

Cloudflare uygunluğu:

- Kayıt defteri, kalıcı nesneler, WebSocket fan-in, hafif olay yönlendirme ve herkese açık MCP/Gateway uç noktaları için iyidir.
- Workers rastgele özel Unix soketlerine veya local loopback uygulama sunucularına bağlanamadığından, doğrudan özel ana makine denetimi için tek başına yeterli değildir.
- Her ana makine bağlayıcısı giden WebSocket üzerinden eve bağlandığında Cloudflare kullanın.

VPS yedeği:

- Uzun ömürlü süreç denetimi, SSH tünelleri, özel ağ yönlendirmesi veya yerel dosya sistemi erişimi gerektiğinde bir Hetzner hizmeti kullanın.
- Aynı protokolü koruyun: ana makine bağlayıcıları giden yönde, gözetmen kayıt defteri merkezi, Codex uygulama sunucusu yerel.

## Güvenlik

- Varsayılan bağlama yerel Unix soketidir.
- Uzak uygulama sunucusu token veya imzalı bearer kimlik doğrulaması kullanır.
- Ana makine bağlayıcısı gözetmene kapsamlı bir ana makine token’ı ile kimlik doğrular.
- Gözetmen araçları oturum başına politikayı uygular: okuma, yönlendirme, kesme, başlatma, onay.
- Ajanlar arası mesajlar `originSessionId` içerir; kendi yankısı düşürülür.
- Yayın açık bir filtre ve sınırlandırılmış hedef sayısı gerektirir.
- Transkript okumaları OpenClaw sınırında gizli bilgileri redakte eder.
- Politika izin vermedikçe gözetmen kaynaklı turlar için onay istekleri varsayılan olarak reddedilir.

## Uygulama Planı

Aşama 1: Yerel gözetmen MVP

- stdio proxy ve WebSocket uç noktaları için Codex uygulama sunucusu JSON-RPC istemcisi ekle.
- Gözetmen uç nokta/oturum kayıt defteri ekle.
- MCP araçları ekle: listeleme, okuma, gönderme, kesme, yoklama.
- Uç noktalar için yerel env yapılandırması ekle.
- Sahte uygulama sunucusu testleri ve bir canlı yerel uygulama sunucusu smoke testi ekle.

Aşama 2: OpenClaw entegrasyonu

- Gözetmen araçlarını `codex-supervisor` Plugin içinde kaydet.
- Gözetmen MCP’yi Codex iş parçacığı yapılandırmasına enjekte et.
- Ajan bağlamına oturum özetleri ekle.
- Yeni Codex iş parçacıkları göründüğünde olay bildirimleri ekle.
- Otonom gönderme/kesme/başlatma için politika yapılandırması ekle.

Aşama 3: Filo bağlayıcısı

- Ana makine sidecar’ı uygulama sunucusu uç noktasını, ana makine meta verilerini, git/çalışma alanı meta verilerini ve insan bağlantı durumunu kaydeder.
- Cloudflare veya VPS denetim düzlemi için giden WebSocket bağlayıcısı ekle.
- Yeniden bağlanma, Heartbeat ve bayat oturum temizliği ekle.
- CRAB SSH başlatıcı sarmalayıcısı ekle.

Aşama 4: Otonom operasyon

- Başlatma/sürdürme/devralma akışları ekle.
- Yayın ve yetki devri ekle.
- İlerleme raporları ve görev durumu özetleri ekle.
- Döngü önleme ve hız sınırları ekle.
- Pano görünümleri ekle.

Aşama 5: Çoklu Claw

- Oturumları gruba göre shard’la.
- Her oturum için liderlik/kira ekle.
- Denetim günlüğü ve yeniden oynatma ekle.
- Claw grupları arasında eskalasyon ekle.

## Kabul Testleri

- Bir insan paylaşılan bir uygulama sunucusu üzerinden Codex TUI başlatır.
- Gözetmen canlı iş parçacığını `thread/loaded/list` üzerinden listeler.
- Gözetmen transkripti `thread/read` üzerinden okur.
- Gözetmen boşta olan bir iş parçacığına `turn/start` üzerinden metin gönderir.
- Gözetmen etkin bir iş parçacığını `turn/steer` üzerinden yönlendirir.
- Gözetmen kesmesi etkin bir turu `turn/interrupt` üzerinden durdurur.
- Codex gözetmen MCP’yi çağırır ve eş oturumları listeler.
- Otonom bir Codex başlatılır ve daha sonra bir insan bağlanır.
- Kaybolan ana makine bağlayıcısı, geçmişi silmeden oturumları bayat olarak işaretler.

## Açık Sorular

- TUI olmadan başlatılan bir uygulama sunucusu iş parçacığı için kesin Codex TUI bağlanma UX’i.
- Codex’in başsız canlı paylaşılan çalıştırmalar için `exec --remote` ekleyip eklememesi.
- Kalıcı durum sahibi: OpenClaw Gateway DB, Cloudflare Durable Object veya VPS veritabanı.
- Gözetmen kaynaklı turlar için onay politikası ayrıntı düzeyi.
- Her zaman açık Claw bağlamına ne kadar transkript özetinin enjekte edilmesi ve ne kadarının araç/kaynak olarak tutulması gerektiği.
