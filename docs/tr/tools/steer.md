---
read_when:
    - Bir agent zaten çalışırken /steer veya /tell kullanma
    - /steer ile /queue modlarını karşılaştırma
    - Geçerli çalıştırmayı mı yoksa bir ACP oturumunu mu yönlendireceğinize karar verme
sidebarTitle: Steer
summary: Kuyruk modunu değiştirmeden etkin bir çalışmayı yönlendirin
title: Yönlendir
x-i18n:
    generated_at: "2026-07-12T12:54:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2e73f3f2fd938ee9dbdd14d183abe7f8676dbc7bb7382e6ad2c1fd41034fa09c
    source_path: tools/steer.md
    workflow: 16
---

`/steer` önce zaten etkin olan bir çalıştırmaya yönlendirme göndermeyi dener. Bu komut,
“çalışma hâlâ sürerken bu çalıştırmayı ayarla” durumları içindir. Geçerli çalışma zamanı
yönlendirmeyi kabul edemiyorsa OpenClaw, iletiyi yok saymak yerine normal bir istem
olarak gönderir.

## Geçerli oturum

Geçerli oturumun etkin çalıştırmasını hedeflemek için üst düzey `/steer` komutunu kullanın:

```text
/steer daha küçük yamayı tercih et ve testleri odaklı tut
/tell sonraki araç çağrısını yapmadan önce özetle
```

Davranış:

- Yalnızca geçerli oturumun etkin çalıştırmasını hedefler.
- Oturumun `/queue` modundan bağımsız olarak çalışır.
- Oturum boştaysa veya etkin çalıştırma yönlendirmeyi kabul edemiyorsa aynı iletiyle
  normal bir tur başlatır.
- Etkin çalışma zamanının yönlendirme yolunu kullanır; böylece model, yönlendirmeyi
  desteklenen bir sonraki çalışma zamanı sınırında görür.

## Yönlendirme ve kuyruk karşılaştırması

`/queue steer`, bir çalıştırma etkinken gelen normal iletilerin etkin çalıştırmayı
yönlendirmeyi denemesini sağlar. `/steer <message>`, kayıtlı `/queue` ayarından
bağımsız olarak komutun iletisini desteklenen bir sonraki çalışma zamanı sınırında
etkin çalıştırmaya eklemeyi deneyen açık bir komuttur. Bu ekleme kullanılamadığında
komut öneki kaldırılır ve `<message>` normal bir istem olarak devam eder.

Kullanım:

- Etkin çalıştırmayı hemen yönlendirmek istediğinizde `/steer <message>` kullanın.
- Gelecekteki normal iletilerin varsayılan olarak etkin çalıştırmaları yönlendirmesini
  istediğinizde `/queue steer` kullanın.
- Gelecekteki normal iletilerin etkin çalıştırmayı yönlendirmek yerine sonraki bir turu
  beklemesi gerektiğinde `/queue collect` veya `/queue followup` kullanın.
- En yeni iletinin etkin çalıştırmayı yönlendirmek yerine onun yerini alması gerektiğinde
  `/queue interrupt` kullanın.

Kuyruk modları ve yönlendirme sınırları için [Komut kuyruğu](/tr/concepts/queue) ve
[Yönlendirme kuyruğu](/tr/concepts/queue-steering) bölümlerine bakın.

## Alt aracılar

Üst düzey `/steer`, geçerli oturumun etkin çalıştırmasını hedefler. Alt aracılar
üst/istekte bulunan oturumlarına geri bildirimde bulunur; `/subagents` yalnızca
görünürlük içindir.

## ACP oturumları

Hedef bir ACP yürütme çerçevesi oturumuysa `/acp steer` kullanın:

```text
/acp steer --session agent:main:acp:codex yeniden üretimi daralt
```

ACP oturumu seçimi ve çalışma zamanı davranışı için
[ACP aracıları](/tr/tools/acp-agents) bölümüne bakın.

## İlgili

- [Eğik çizgi komutları](/tr/tools/slash-commands)
- [Komut kuyruğu](/tr/concepts/queue)
- [Yönlendirme kuyruğu](/tr/concepts/queue-steering)
- [Alt aracılar](/tr/tools/subagents)
