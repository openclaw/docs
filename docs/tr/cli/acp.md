---
read_when:
    - ACP tabanlı IDE entegrasyonlarını kurma
    - ACP oturumunun Gateway'e yönlendirilmesinde hata ayıklama
summary: IDE entegrasyonları için ACP köprüsünü çalıştırın
title: ACP
x-i18n:
    generated_at: "2026-06-28T00:20:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 79fa816811f78c3fa59577342e568868ef63e88f5262fd954e346ed46b02afc3
    source_path: cli/acp.md
    workflow: 16
---

OpenClaw Gateway ile konuşan [Agent Client Protocol (ACP)](https://agentclientprotocol.com/) köprüsünü çalıştırın.

Bu komut, IDE'ler için stdio üzerinden ACP konuşur ve istemleri WebSocket
üzerinden Gateway'e iletir. ACP oturumlarını Gateway oturum anahtarlarıyla eşlenmiş tutar.

`openclaw acp`, tam ACP-yerel bir düzenleyici çalışma zamanı değil,
Gateway destekli bir ACP köprüsüdür. Oturum yönlendirmeye, istem iletimine ve
temel akış güncellemelerine odaklanır.

Bir ACP harness oturumu barındırmak yerine harici bir MCP istemcisinin doğrudan
OpenClaw kanal konuşmalarıyla konuşmasını istiyorsanız bunun yerine
[`openclaw mcp serve`](/tr/cli/mcp) kullanın.

## Bu ne değildir

Bu sayfa sık sık ACP harness oturumlarıyla karıştırılır.

`openclaw acp` şu anlama gelir:

- OpenClaw bir ACP sunucusu gibi davranır
- bir IDE veya ACP istemcisi OpenClaw'a bağlanır
- OpenClaw bu işi bir Gateway oturumuna iletir

Bu, OpenClaw'ın Codex veya Claude Code gibi harici bir harness'i `acpx`
üzerinden çalıştırdığı [ACP Aracıları](/tr/tools/acp-agents) durumundan farklıdır.

Hızlı kural:

- düzenleyici/istemci OpenClaw ile ACP konuşmak istiyor: `openclaw acp` kullanın
- OpenClaw, Codex/Claude/Gemini'yi ACP harness olarak başlatmalı: `/acp spawn` ve [ACP Aracıları](/tr/tools/acp-agents) kullanın

## Uyumluluk Matrisi

| ACP alanı                                                             | Durum       | Notlar                                                                                                                                                                                                                                           |
| --------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `initialize`, `newSession`, `prompt`, `cancel`                        | Uygulandı   | stdio üzerinden Gateway chat/send + abort'a giden temel köprü akışı.                                                                                                                                                                             |
| `listSessions`, eğik çizgi komutları                                  | Uygulandı   | Oturum listesi, Gateway oturum satırları çalışma alanı meta verisi taşıdığında sınırlı imleç sayfalaması ve `cwd` filtrelemesiyle Gateway oturum durumuna karşı çalışır; komutlar `available_commands_update` aracılığıyla duyurulur.          |
| Oturum soy zinciri meta verisi                                        | Uygulandı   | Oturum listeleri ve oturum bilgisi anlık görüntüleri, ACP istemcilerinin özel Gateway yan kanalları olmadan alt aracı grafiklerini işleyebilmesi için `_meta` içinde OpenClaw üst ve alt soy zincirini içerir.                                  |
| `resumeSession`, `closeSession`                                       | Uygulandı   | Sürdürme, geçmişi yeniden oynatmadan bir ACP oturumunu mevcut bir Gateway oturumuna yeniden bağlar. Kapatma etkin köprü işini iptal eder, bekleyen istemleri iptal edilmiş olarak çözer ve köprü oturum durumunu serbest bırakır.              |
| `loadSession`                                                         | Kısmi       | ACP oturumunu bir Gateway oturum anahtarına yeniden bağlar ve köprü tarafından oluşturulmuş oturumlar için ACP olay defteri geçmişini yeniden oynatır. Daha eski/deftersiz oturumlar saklanan kullanıcı/asistan metnine geri döner.             |
| İstem içeriği (`text`, gömülü `resource`, görseller)                  | Kısmi       | Metin/kaynaklar sohbet girdisine düzleştirilir; görseller Gateway eklerine dönüşür.                                                                                                                                                              |
| Oturum modları                                                        | Kısmi       | `session/set_mode` desteklenir ve köprü düşünce düzeyi, araç ayrıntı düzeyi, akıl yürütme, kullanım ayrıntısı ve yükseltilmiş eylemler için ilk Gateway destekli oturum denetimlerini sunar. Daha geniş ACP-yerel mod/yapılandırma yüzeyleri hâlâ kapsam dışıdır. |
| Oturum bilgisi ve kullanım güncellemeleri                             | Kısmi       | Köprü, önbelleğe alınmış Gateway oturum anlık görüntülerinden `session_info_update` ve en iyi çabayla `usage_update` bildirimleri yayar. Kullanım yaklaşık değerdir ve yalnızca Gateway token toplamları güncel olarak işaretlendiğinde gönderilir. |
| Araç akışı                                                            | Kısmi       | `tool_call` / `tool_call_update` olayları, Gateway araç argümanları/sonuçları bunları ortaya çıkardığında ham G/Ç, metin içeriği ve en iyi çabayla dosya konumlarını içerir. Gömülü terminaller ve daha zengin diff-yerel çıktı hâlâ açığa çıkarılmaz. |
| Exec onayları                                                         | Kısmi       | Etkin ACP istem dönüşleri sırasında Gateway exec onay istemleri ACP istemcisine `session/request_permission` ile aktarılır.                                                                                                                       |
| Oturum başına MCP sunucuları (`mcpServers`)                           | Desteklenmiyor | Köprü modu, oturum başına MCP sunucusu isteklerini reddeder. MCP'yi bunun yerine OpenClaw gateway veya aracı üzerinde yapılandırın.                                                                                                               |
| İstemci dosya sistemi yöntemleri (`fs/read_text_file`, `fs/write_text_file`) | Desteklenmiyor | Köprü, ACP istemci dosya sistemi yöntemlerini çağırmaz.                                                                                                                                                                                          |
| İstemci terminal yöntemleri (`terminal/*`)                            | Desteklenmiyor | Köprü ACP istemci terminalleri oluşturmaz veya terminal kimliklerini araç çağrıları üzerinden akıtmaz.                                                                                                                                           |
| Oturum planları / düşünce akışı                                       | Desteklenmiyor | Köprü şu anda ACP planı veya düşünce güncellemeleri değil, çıktı metni ve araç durumu yayar.                                                                                                                                                     |

## Bilinen Sınırlamalar

- `loadSession`, tam ACP olay defteri geçmişini yalnızca köprü tarafından
  oluşturulmuş oturumlar için yeniden oynatabilir. Daha eski/deftersiz oturumlar
  hâlâ transcript geri dönüşünü kullanır ve geçmiş araç çağrılarını veya sistem
  bildirimlerini yeniden oluşturmaz.
- Birden çok ACP istemcisi aynı Gateway oturum anahtarını paylaşırsa olay ve iptal
  yönlendirmesi istemci başına katı biçimde yalıtılmış olmak yerine en iyi çabayladır.
  Temiz düzenleyici-yerel dönüşlere ihtiyaç duyduğunuzda varsayılan yalıtılmış
  `acp-bridge:<uuid>` oturumlarını tercih edin.
- Gateway durdurma durumları ACP durdurma nedenlerine çevrilir, ancak bu eşleme
  tamamen ACP-yerel bir çalışma zamanından daha az ifade gücüne sahiptir.
- İlk oturum denetimleri şu anda odaklanmış bir Gateway ayarı alt kümesini sunar:
  düşünce düzeyi, araç ayrıntı düzeyi, akıl yürütme, kullanım ayrıntısı ve yükseltilmiş
  eylemler. Model seçimi ve exec-host denetimleri henüz ACP yapılandırma seçenekleri
  olarak açığa çıkarılmamıştır.
- `session_info_update` ve `usage_update`, canlı ACP-yerel çalışma zamanı
  muhasebesinden değil Gateway oturum anlık görüntülerinden türetilir. Kullanım
  yaklaşık değerdir, maliyet verisi taşımaz ve yalnızca Gateway toplam token
  verisini güncel olarak işaretlediğinde yayılır.
- Araç takip verisi en iyi çabayladır. Köprü, bilinen araç argümanlarında/sonuçlarında
  görünen dosya yollarını gösterebilir, ancak henüz ACP terminalleri veya
  yapılandırılmış dosya diff'leri yaymaz.
- Exec onay aktarımı etkin ACP istem dönüşüyle sınırlıdır; diğer Gateway oturumlarından
  gelen onaylar yok sayılır.

## Kullanım

```bash
openclaw acp

# Remote Gateway
openclaw acp --url wss://gateway-host:18789 --token <token>

# Remote Gateway (token from file)
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Attach to an existing session key
openclaw acp --session agent:main:main

# Attach by label (must already exist)
openclaw acp --session-label "support inbox"

# Reset the session key before the first prompt
openclaw acp --session agent:main:main --reset-session
```

## ACP istemcisi (hata ayıklama)

Köprüyü bir IDE olmadan temel doğrulamak için yerleşik ACP istemcisini kullanın.
ACP köprüsünü başlatır ve istemleri etkileşimli olarak yazmanıza izin verir.

```bash
openclaw acp client

# Point the spawned bridge at a remote Gateway
openclaw acp client --server-args --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Override the server command (default: openclaw)
openclaw acp client --server "node" --server-args openclaw.mjs acp --url ws://127.0.0.1:19001
```

İzin modeli (istemci hata ayıklama modu):

- Otomatik onay izin listesi tabanlıdır ve yalnızca güvenilen çekirdek araç kimliklerine uygulanır.
- `read` otomatik onayı geçerli çalışma diziniyle sınırlıdır (`--cwd` ayarlandığında).
- ACP yalnızca dar salt okunur sınıfları otomatik onaylar: etkin cwd altındaki kapsamlı `read` çağrıları ve salt okunur arama araçları (`search`, `web_search`, `memory_search`). Bilinmeyen/çekirdek dışı araçlar, kapsam dışı okumalar, exec-yetenekli araçlar, kontrol düzlemi araçları, değiştiren araçlar ve etkileşimli akışlar her zaman açık istem onayı gerektirir.
- Sunucu tarafından sağlanan `toolCall.kind`, güvenilmeyen meta veri olarak ele alınır (yetkilendirme kaynağı değildir).
- Bu ACP köprü politikası ACPX harness izinlerinden ayrıdır. OpenClaw'ı `acpx` backend'i üzerinden çalıştırırsanız `plugins.entries.acpx.config.permissionMode=approve-all`, bu harness oturumu için acil durum "yolo" anahtarıdır.

## Protokol smoke testi

Protokol düzeyinde hata ayıklama için yalıtılmış durumla bir Gateway başlatın ve
`openclaw acp` komutunu bir ACP JSON-RPC istemcisiyle stdio üzerinden sürün. `initialize`,
`session/new`, mutlak `cwd` ile `session/list`, `session/resume`,
`session/close`, yinelenen kapatma ve eksik sürdürmeyi kapsayın.

Kanıt, duyurulan yaşam döngüsü yeteneklerini, Gateway destekli bir oturum satırını,
güncelleme bildirimlerini ve Gateway `sessions.list` günlüğünü içermelidir:

```json
{
  "initialize": {
    "protocolVersion": 1,
    "agentCapabilities": {
      "sessionCapabilities": {
        "list": {},
        "resume": {},
        "close": {}
      }
    }
  },
  "listSessions": {
    "sessions": [
      {
        "sessionId": "agent:main:acp-smoke",
        "cwd": "/path/to/workspace",
        "_meta": {
          "sessionKey": "agent:main:acp-smoke",
          "kind": "direct"
        }
      }
    ],
    "nextCursor": null
  },
  "notifications": ["session_info_update", "available_commands_update", "usage_update"],
  "gatewayLogTail": ["[gateway] ready", "[ws] ⇄ res ✓ sessions.list 305ms"]
}
```

Tek ACP kanıtı olarak `openclaw gateway call sessions.list` kullanmaktan kaçının. Bu
CLI yolu yeni-token operatör kapsamı yükseltmesi isteyebilir; ACP köprü doğruluğu,
ACP stdio çerçeveleri ve Gateway `sessions.list` günlüğüyle kanıtlanır.

## Bunu nasıl kullanmalı

Bir IDE (veya başka istemci) Agent Client Protocol konuştuğunda ve bunun bir
OpenClaw Gateway oturumunu sürmesini istediğinizde ACP kullanın.

1. Gateway'in çalıştığından emin olun (yerel veya uzak).
2. Gateway hedefini yapılandırın (yapılandırma veya bayraklar).
3. IDE'nizi stdio üzerinden `openclaw acp` çalıştıracak şekilde yönlendirin.

Örnek yapılandırma (kalıcı):

```bash
openclaw config set gateway.remote.url wss://gateway-host:18789
openclaw config set gateway.remote.token <token>
```

Örnek doğrudan çalıştırma (yapılandırma yazmadan):

```bash
openclaw acp --url wss://gateway-host:18789 --token <token>
# preferred for local process safety
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token
```

## Aracıları seçme

ACP aracıları doğrudan seçmez. Gateway oturum anahtarına göre yönlendirir.

Belirli bir aracıyı hedeflemek için aracı-kapsamlı oturum anahtarlarını kullanın:

```bash
openclaw acp --session agent:main:main
openclaw acp --session agent:design:main
openclaw acp --session agent:qa:bug-123
```

Her ACP oturumu tek bir Gateway oturum anahtarına eşlenir. Bir agent'ın birçok
oturumu olabilir; anahtarı veya etiketi geçersiz kılmadığınız sürece ACP varsayılan
olarak yalıtılmış bir `acp-bridge:<uuid>` oturumu kullanır.

Oturum başına `mcpServers`, köprü modunda desteklenmez. Bir ACP istemcisi bunları
`newSession` veya `loadSession` sırasında gönderirse köprü, bunları sessizce yok
saymak yerine açık bir hata döndürür.

ACPX destekli oturumların OpenClaw Plugin araçlarını veya `cron` gibi seçili
yerleşik araçları görmesini istiyorsanız oturum başına `mcpServers` geçirmeye
çalışmak yerine Gateway tarafındaki ACPX MCP köprülerini etkinleştirin. Bkz.
[ACP Agent'ları](/tr/tools/acp-agents-setup#plugin-tools-mcp-bridge) ve
[OpenClaw araçları MCP köprüsü](/tr/tools/acp-agents-setup#openclaw-tools-mcp-bridge).

## `acpx` içinden kullanma (Codex, Claude, diğer ACP istemcileri)

Codex veya Claude Code gibi bir kodlama agent'ının OpenClaw botunuzla ACP üzerinden
konuşmasını istiyorsanız yerleşik `openclaw` hedefiyle `acpx` kullanın.

Tipik akış:

1. Gateway'i çalıştırın ve ACP köprüsünün ona erişebildiğinden emin olun.
2. `acpx openclaw` komutunu `openclaw acp` hedefine yönlendirin.
3. Kodlama agent'ının kullanmasını istediğiniz OpenClaw oturum anahtarını hedefleyin.

Örnekler:

```bash
# One-shot request into your default OpenClaw ACP session
acpx openclaw exec "Summarize the active OpenClaw session state."

# Persistent named session for follow-up turns
acpx openclaw sessions ensure --name codex-bridge
acpx openclaw -s codex-bridge --cwd /path/to/repo \
  "Ask my OpenClaw work agent for recent context relevant to this repo."
```

`acpx openclaw` komutunun her seferinde belirli bir Gateway'i ve oturum anahtarını
hedeflemesini istiyorsanız `~/.acpx/config.json` içindeki `openclaw` agent komutunu
geçersiz kılın:

```json
{
  "agents": {
    "openclaw": {
      "command": "env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 openclaw acp --url ws://127.0.0.1:18789 --token-file ~/.openclaw/gateway.token --session agent:main:main"
    }
  }
}
```

Depo-yerel bir OpenClaw checkout'ı için ACP akışının temiz kalması adına geliştirme
çalıştırıcısı yerine doğrudan CLI giriş noktasını kullanın. Örneğin:

```bash
env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 node openclaw.mjs acp ...
```

Bu, Codex, Claude Code veya ACP uyumlu başka bir istemcinin terminali kazımadan
bir OpenClaw agent'ından bağlamsal bilgi çekmesine izin vermenin en kolay yoludur.

## Zed düzenleyici kurulumu

`~/.config/zed/settings.json` içine özel bir ACP agent'ı ekleyin (veya Zed'in Ayarlar kullanıcı arayüzünü kullanın):

```json
{
  "agent_servers": {
    "OpenClaw ACP": {
      "type": "custom",
      "command": "openclaw",
      "args": ["acp"],
      "env": {}
    }
  }
}
```

Belirli bir Gateway'i veya agent'ı hedeflemek için:

```json
{
  "agent_servers": {
    "OpenClaw ACP": {
      "type": "custom",
      "command": "openclaw",
      "args": [
        "acp",
        "--url",
        "wss://gateway-host:18789",
        "--token",
        "<token>",
        "--session",
        "agent:design:main"
      ],
      "env": {}
    }
  }
}
```

Zed'de Agent panelini açın ve bir iş parçacığı başlatmak için "OpenClaw ACP" seçin.

## Oturum eşleme

Varsayılan olarak ACP köprüsü oturumları, `acp-bridge:` ön ekine sahip yalıtılmış
bir Gateway oturum anahtarı alır. Bu normal model köprü oturumları sentetiktir ve
eski girdi budamaya ve girdi sayısı sınırlarına tabidir. Bilinen bir oturumu yeniden
kullanmak için bir oturum anahtarı veya etiketi geçirin:

- `--session <key>`: belirli bir Gateway oturum anahtarı kullanın.
- `--session-label <label>`: mevcut bir oturumu etikete göre çözümleyin.
- `--reset-session`: o anahtar için yeni bir oturum kimliği üretin (aynı anahtar, yeni transkript).

ACP istemciniz meta verileri destekliyorsa oturum başına geçersiz kılabilirsiniz:

```json
{
  "_meta": {
    "sessionKey": "agent:main:main",
    "sessionLabel": "support inbox",
    "resetSession": true
  }
}
```

Oturum anahtarları hakkında daha fazla bilgi için [/concepts/session](/tr/concepts/session) adresine bakın.

## Seçenekler

- `--url <url>`: Gateway WebSocket URL'si (yapılandırıldığında varsayılan olarak gateway.remote.url kullanılır).
- `--token <token>`: Gateway kimlik doğrulama token'ı.
- `--token-file <path>`: Gateway kimlik doğrulama token'ını dosyadan okuyun.
- `--password <password>`: Gateway kimlik doğrulama parolası.
- `--password-file <path>`: Gateway kimlik doğrulama parolasını dosyadan okuyun.
- `--session <key>`: varsayılan oturum anahtarı.
- `--session-label <label>`: çözümlenecek varsayılan oturum etiketi.
- `--require-existing`: oturum anahtarı/etiketi yoksa başarısız olun.
- `--reset-session`: ilk kullanımdan önce oturum anahtarını sıfırlayın.
- `--no-prefix-cwd`: istemlerin başına çalışma dizinini eklemeyin.
- `--provenance <off|meta|meta+receipt>`: ACP kaynak meta verilerini veya alındılarını dahil edin.
- `--verbose, -v`: stderr'e ayrıntılı günlükleme.

Güvenlik notu:

- `--token` ve `--password`, bazı sistemlerde yerel süreç listelerinde görünebilir.
- `--token-file`/`--password-file` veya ortam değişkenlerini (`OPENCLAW_GATEWAY_TOKEN`, `OPENCLAW_GATEWAY_PASSWORD`) tercih edin.
- Gateway kimlik doğrulama çözümlemesi, diğer Gateway istemcileri tarafından kullanılan paylaşılan sözleşmeyi izler:
  - yerel mod: env (`OPENCLAW_GATEWAY_*`) -> `gateway.auth.*` -> yalnızca `gateway.auth.*` ayarlanmamışsa `gateway.remote.*` yedeği (yapılandırılmış ancak çözümlenmemiş yerel SecretRefs kapalı başarısız olur)
  - uzak mod: uzak öncelik kurallarına göre env/config yedeğiyle `gateway.remote.*`
  - `--url` geçersiz kılma açısından güvenlidir ve örtük config/env kimlik bilgilerini yeniden kullanmaz; açık `--token`/`--password` (veya dosya varyantlarını) geçirin
- ACP çalışma zamanı arka uç alt süreçleri `OPENCLAW_SHELL=acp` alır; bu, bağlama özgü shell/profil kuralları için kullanılabilir.
- `openclaw acp client`, başlatılan köprü sürecinde `OPENCLAW_SHELL=acp-client` ayarlar.

### `acp client` seçenekleri

- `--cwd <dir>`: ACP oturumu için çalışma dizini.
- `--server <command>`: ACP sunucu komutu (varsayılan: `openclaw`).
- `--server-args <args...>`: ACP sunucusuna geçirilen ek argümanlar.
- `--server-verbose`: ACP sunucusunda ayrıntılı günlüklemeyi etkinleştirin.
- `--verbose, -v`: ayrıntılı istemci günlüklemesi.

## İlgili

- [CLI referansı](/tr/cli)
- [ACP agent'ları](/tr/tools/acp-agents)
