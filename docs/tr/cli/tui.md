---
read_when:
    - Gateway için bir terminal kullanıcı arayüzü istiyorsunuz (uzaktan kullanıma uygun)
    - Betiklerden url/token/session geçirmek istiyorsunuz
    - Gateway olmadan TUI'yi yerel gömülü modda çalıştırmak istiyorsunuz
    - openclaw chat veya openclaw tui --local kullanmak istiyorsunuz
summary: '`openclaw tui` için CLI başvurusu (Gateway destekli veya yerel gömülü terminal kullanıcı arayüzü)'
title: TUI
x-i18n:
    generated_at: "2026-07-12T11:36:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3e7b4a067e957c72836b22688f7446861b64fb7078b43e206bbe765ea0d62e57
    source_path: cli/tui.md
    workflow: 16
---

# `openclaw tui`

Gateway'e bağlı terminal kullanıcı arayüzünü açın veya yerel gömülü
modda çalıştırın.

İlgili kılavuz: [TUI](/tr/web/tui)

## Seçenekler

| Bayrak                       | Varsayılan                                | Açıklama                                                                           |
| ---------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------- |
| `--local`                    | `false`                                   | Gateway yerine yerel gömülü aracı çalışma zamanında çalıştırın.                    |
| `--url <url>`                | yapılandırmadaki `gateway.remote.url`      | Gateway WebSocket URL'si.                                                          |
| `--token <token>`            | (yok)                                     | Gerekiyorsa Gateway belirteci.                                                      |
| `--password <pass>`          | (yok)                                     | Gerekiyorsa Gateway parolası.                                                       |
| `--tls-fingerprint <sha256>` | `gateway.remote.tlsFingerprint`           | Sabitlenmiş bir `wss://` Gateway için beklenen TLS sertifikası parmak izi.          |
| `--session <key>`            | `main` (kapsam genelse `global`)           | Oturum anahtarı. Bir aracı çalışma alanında, ön ek belirtilmedikçe o aracıyı otomatik olarak seçer. |
| `--deliver`                  | `false`                                   | Asistan yanıtlarını yapılandırılmış kanallar üzerinden iletin.                     |
| `--thinking <level>`         | (model varsayılanı)                        | Düşünme düzeyi geçersiz kılması.                                                    |
| `--message <text>`           | (yok)                                     | Bağlandıktan sonra bir başlangıç iletisi gönderin.                                  |
| `--timeout-ms <ms>`          | `agents.defaults.timeoutSeconds`          | Aracı zaman aşımı. Geçersiz değerler bir uyarı olarak günlüğe kaydedilir ve yok sayılır. |
| `--history-limit <n>`        | `200`                                     | Bağlanırken yüklenecek geçmiş girdileri.                                            |

Takma adlar: `openclaw chat` ve `openclaw terminal`, örtük olarak
`--local` kullanarak bu komutu çağırır.

## Notlar

- `--local`; `--url`, `--token`, `--password` veya `--tls-fingerprint` ile birlikte kullanılamaz.
- `tui`, mümkün olduğunda belirteç/parola kimlik doğrulaması için yapılandırılmış
  Gateway kimlik doğrulama SecretRef'lerini çözümler (`env`/`file`/`exec` sağlayıcıları).
- Açıkça bir URL veya bağlantı noktası belirtilmediğinde `tui`, çalışan Gateway
  tarafından kaydedilen etkin yerel Gateway bağlantı noktasını izler. Açıkça belirtilen `--url`,
  `OPENCLAW_GATEWAY_URL`, `OPENCLAW_GATEWAY_PORT` ve uzak Gateway yapılandırması önceliğini korur.
- Yapılandırılmış bir aracı çalışma alanı dizininin içinden başlatıldığında TUI,
  oturum anahtarı varsayılanı için o aracıyı otomatik olarak seçer (`--session` açıkça
  `agent:<id>:...` olarak belirtilmedikçe).
- Yerel olmayan, URL destekli bağlantılarda Gateway ana bilgisayar adını alt bilgide
  göstermek için `openclaw config set tui.footer.showRemoteHost true` komutunu çalıştırın.
  Varsayılan olarak kapalıdır; local loopback veya gömülü yerel bağlantılarda hiçbir zaman gösterilmez.
- Yerel mod, gömülü aracı çalışma zamanını doğrudan kullanır. Yerel araçların çoğu çalışır,
  ancak yalnızca Gateway'e özgü özellikler kullanılamaz.
- Yerel mod, TUI komut yüzeyine `/auth [provider]` ekler.
- Plugin onay kapıları yerel modda da geçerlidir: onay gerektiren araçlar
  terminalde bir karar istemi gösterir; hiçbir şey sessizce otomatik olarak onaylanmaz.
- Oturum [hedefleri](/tr/tools/goal) alt bilgide görünür ve
  `/goal` ile yönetilebilir.

## Örnekler

```bash
openclaw chat
openclaw tui --local
openclaw tui
openclaw tui --url ws://127.0.0.1:18789 --token <token>
openclaw tui --session main --deliver
openclaw chat --message "Yapılandırmamı belgelerle karşılaştır ve neleri düzeltmem gerektiğini söyle"
# bir aracı çalışma alanında çalıştırıldığında bu aracıyı otomatik olarak çıkarır
openclaw tui --session bugfix
```

## Yapılandırma onarım döngüsü

Gömülü aracının mevcut yapılandırmayı incelemesi, belgelerle karşılaştırması
ve aynı terminalden onarılmasına yardımcı olması için yerel modu kullanın.

`openclaw config validate` zaten başarısız oluyorsa önce `openclaw configure` veya
`openclaw doctor --fix` komutunu çalıştırın; `openclaw chat`,
geçersiz yapılandırma korumasını atlamaz.

```bash
openclaw chat
```

Ardından TUI içinde:

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

`openclaw config set` veya `openclaw configure` ile hedefli düzeltmeler uygulayın,
ardından `openclaw config validate` komutunu yeniden çalıştırın. Bkz.
[TUI](/tr/web/tui) ve [Yapılandırma](/tr/cli/config).

## İlgili içerikler

- [CLI başvurusu](/tr/cli)
- [TUI](/tr/web/tui)
- [Hedef](/tr/tools/goal)
