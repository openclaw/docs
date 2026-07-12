---
read_when:
    - Yükseltilmiş mod varsayılanlarını, izin listelerini veya eğik çizgi komutu davranışını ayarlama
    - Korumalı alan içindeki ajanların ana sisteme nasıl erişebildiğini anlama
summary: 'Yükseltilmiş yürütme modu: korumalı alandaki bir ajan üzerinden komutları korumalı alanın dışında çalıştırma'
title: Yükseltilmiş mod
x-i18n:
    generated_at: "2026-07-12T12:48:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ab035f2f0d0074da4e7661d9d690d89aa5eea25b7920ce48a2a03dffccded85b
    source_path: tools/elevated.md
    workflow: 16
---

Bir ajan korumalı alan içinde çalıştığında, `exec` komutları korumalı alan ortamıyla sınırlıdır. **Yükseltilmiş mod**, yapılandırılabilir onay geçitleriyle ajanın bu sınırın dışına çıkarak komutları korumalı alan dışında çalıştırmasına olanak tanır.

<Info>
  Yükseltilmiş mod, yalnızca ajan **korumalı alanda** olduğunda davranışı değiştirir. Korumalı alanda olmayan ajanlarda exec zaten ana makinede çalışır.
</Info>

## Yönergeler

Yükseltilmiş modu eğik çizgi komutlarıyla oturum bazında denetleyin:

| Yönerge          | İşlevi                                                                                                                                 |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `/elevated on`   | Yapılandırılmış ana makine yolunda korumalı alan dışında çalıştırır, onayları korur                                                    |
| `/elevated ask`  | `on` ile aynıdır (takma ad)                                                                                                            |
| `/elevated full` | Yapılandırılmış ana makine yolunda korumalı alan dışında çalıştırır ve mod/ana makine onay politikası zaten izin vericiyse onayları atlar |
| `/elevated off`  | Korumalı alanla sınırlı yürütmeye döner                                                                                                |

`/elev on|off|ask|full` biçiminde de kullanılabilir.

Geçerli düzeyi görmek için bağımsız değişken olmadan `/elevated` gönderin.

## Nasıl çalışır?

<Steps>
  <Step title="Kullanılabilirliği denetleyin">
    Yükseltilmiş mod yapılandırmada etkinleştirilmeli ve gönderen izin listesinde bulunmalıdır:

    ```json5
    {
      tools: {
        elevated: {
          enabled: true,
          allowFrom: {
            discord: ["user-id-123"],
            whatsapp: ["+15555550123"],
          },
        },
      },
    }
    ```

  </Step>

  <Step title="Düzeyi ayarlayın">
    Oturum varsayılanını ayarlamak için yalnızca yönerge içeren bir mesaj gönderin:

    ```
    /elevated full
    ```

    Veya satır içinde kullanın (yalnızca o mesaja uygulanır):

    ```
    /elevated on dağıtım betiğini çalıştır
    ```

  </Step>

  <Step title="Komutlar korumalı alan dışında çalışır">
    Yükseltilmiş mod etkinken `exec` çağrıları korumalı alanın dışına çıkar. Etkin ana makine varsayılan olarak
    `gateway` olur; yapılandırılmış/oturuma ait exec hedefi `node` olduğunda ise
    `node` olur. `full` modunda, çözümlenen exec modu/ana makine onay politikası
    zaten tamamen izin vericiyse (güvenlik `full`, soru `off`) exec onayları
    atlanır; aksi takdirde normal onay politikası uygulanmaya devam eder.
    `on`/`ask` modunda yapılandırılmış onay kuralları her zaman uygulanır.
  </Step>
</Steps>

## Çözümleme sırası

1. Mesajdaki **satır içi yönerge** (yalnızca o mesaja uygulanır)
2. **Oturum geçersiz kılması** (yalnızca yönerge içeren bir mesaj gönderilerek ayarlanır)
3. **Genel varsayılan** (yapılandırmadaki `agents.defaults.elevatedDefault`)

## Kullanılabilirlik ve izin listeleri

- **Genel geçit**: `tools.elevated.enabled` (`true` olmalıdır)
- **Gönderen izin listesi**: kanal başına listeler içeren `tools.elevated.allowFrom`
- **Ajan başına geçit**: `agents.list[].tools.elevated.enabled` (yalnızca daha fazla kısıtlayabilir; hem genel hem de ajan başına geçit `true` olmalıdır)
- **Ajan başına izin listesi**: `agents.list[].tools.elevated.allowFrom` (gönderen hem genel hem de ajan başına izin listesiyle eşleşmelidir)
- **Kanal tarafından sağlanan yedek izin listesi**: Kanal Plugin'leri, `tools.elevated.allowFrom.<provider>` yapılandırılmadığında kullanılan bir SDK bağdaştırıcı kancası aracılığıyla isteğe bağlı olarak yedek izin listesi sağlayabilir. Paketle gelen kanalların hiçbiri şu anda bu kancayı uygulamadığından, uygulamada bugün her sağlayıcı için açık bir `tools.elevated.allowFrom.<provider>` girdisi gerekir.
- **Tüm geçitler geçilmelidir**; aksi takdirde yükseltilmiş mod kullanılamaz kabul edilir

İzin listesi girdisi biçimleri:

| Önek                    | Eşleştiği değer                       |
| ----------------------- | ------------------------------------- |
| (yok)                   | Gönderen kimliği, E.164 veya From alanı |
| `name:`                 | Gönderenin görünen adı                |
| `username:`             | Gönderenin kullanıcı adı              |
| `tag:`                  | Gönderen etiketi                      |
| `id:`, `from:`, `e164:` | Açık kimlik hedefleme                  |

## Yükseltilmiş modun denetlemedikleri

- **Araç politikası**: `exec` araç politikası tarafından reddedilirse yükseltilmiş mod bunu geçersiz kılamaz.
- **Ana makine seçim politikası**: Yükseltilmiş mod, `auto` değerini serbest bir ana makineler arası geçersiz kılmaya dönüştürmez. Yapılandırılmış/oturuma ait exec hedefi kurallarını kullanır ve yalnızca hedef zaten `node` olduğunda `node` seçer.
- **`/exec` öğesinden ayrıdır**: `/exec` yönergesi, yetkili gönderenler için oturum başına exec varsayılanlarını (ana makine, güvenlik, soru, node) ayarlar ve yükseltilmiş mod gerektirmez.

<Note>
  Bash sohbet komutu (`!` öneki; `/bash` takma adı), kendi `tools.bash.enabled` bayrağına ek olarak `tools.elevated` öğesinin etkinleştirilmesini gerektiren ayrı bir geçittir. Yükseltilmiş modu devre dışı bırakmak `!` kabuk komutlarını da engeller.
</Note>

## İlgili

<CardGroup cols={2}>
  <Card title="Exec aracı" href="/tr/tools/exec" icon="terminal">
    Ajan tarafından kabuk komutu yürütme.
  </Card>
  <Card title="Exec onayları" href="/tr/tools/exec-approvals" icon="shield">
    `exec` için onay ve izin listesi sistemi.
  </Card>
  <Card title="Korumalı alan kullanımı" href="/tr/gateway/sandboxing" icon="box">
    Gateway düzeyinde korumalı alan yapılandırması.
  </Card>
  <Card title="Korumalı Alan, Araç Politikası ve Yükseltilmiş Mod" href="/tr/gateway/sandbox-vs-tool-policy-vs-elevated" icon="scale-balanced">
    Bir araç çağrısı sırasında üç geçidin nasıl birlikte çalıştığı.
  </Card>
</CardGroup>
