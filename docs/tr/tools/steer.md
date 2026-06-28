---
read_when:
    - Bir agent zaten çalışırken /steer veya /tell kullanma
    - /steer ile /queue modlarını karşılaştırma
    - Mevcut çalıştırmayı mı yoksa bir ACP oturumunu mu yönlendireceğinize karar verme
sidebarTitle: Steer
summary: Kuyruk modunu değiştirmeden etkin bir çalıştırmayı yönlendirin
title: Yönlendir
x-i18n:
    generated_at: "2026-06-28T01:25:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2e73f3f2fd938ee9dbdd14d183abe7f8676dbc7bb7382e6ad2c1fd41034fa09c
    source_path: tools/steer.md
    workflow: 16
---

`/steer` önce yönergeleri zaten etkin olan bir çalıştırmaya göndermeyi dener. Bu komut,
"bu çalıştırma hâlâ devam ederken onu ayarla" anları içindir. Geçerli runtime
yönlendirmeyi kabul edemiyorsa OpenClaw, mesajı düşürmek yerine normal bir istem
olarak gönderir.

## Geçerli oturum

Geçerli oturumun etkin çalıştırmasını hedeflemek için üst düzey `/steer` kullanın:

```text
/steer prefer the smaller patch and keep the tests focused
/tell summarize before making the next tool call
```

Davranış:

- Yalnızca geçerli oturumun etkin çalıştırmasını hedefler.
- Oturumun `/queue` modundan bağımsız çalışır.
- Oturum boştayken veya etkin çalıştırma yönlendirmeyi kabul edemediğinde aynı
  mesajla normal bir tur başlatır.
- Etkin runtime'ın yönlendirme yolunu kullanır; bu nedenle model yönergeleri bir
  sonraki desteklenen runtime sınırında görür.

## Yönlendirme ve kuyruk

`/queue steer`, normal gelen mesajların bir çalıştırma etkinken geldiklerinde
etkin çalıştırmayı yönlendirmeyi denemesini sağlar. `/steer <message>`, saklanan
`/queue` ayarından bağımsız olarak, bu komutun mesajını bir sonraki desteklenen
runtime sınırında etkin çalıştırmaya enjekte etmeyi deneyen açık bir komuttur.
Bu enjeksiyon kullanılamadığında komut öneki kaldırılır ve `<message>` normal
bir istem olarak devam eder.

Kullanım:

- Etkin çalıştırmayı hemen yönlendirmek istediğinizde `/steer <message>` kullanın.
- Gelecekteki normal mesajların varsayılan olarak etkin çalıştırmaları
  yönlendirmesini istediğinizde `/queue steer` kullanın.
- Gelecekteki normal mesajların etkin çalıştırmayı yönlendirmek yerine daha
  sonraki bir turu beklemesi gerektiğinde `/queue collect` veya `/queue followup`
  kullanın.
- En yeni mesajın etkin çalıştırmayı yönlendirmek yerine onun yerini alması
  gerektiğinde `/queue interrupt` kullanın.

Kuyruk modları ve yönlendirme sınırları için [Komut kuyruğu](/tr/concepts/queue) ve
[Yönlendirme kuyruğu](/tr/concepts/queue-steering) bölümlerine bakın.

## Alt aracılar

Üst düzey `/steer`, geçerli oturumun etkin çalıştırmasını hedefler. Alt aracılar
üst/requester oturumlarına geri bildirim yapar; `/subagents` yalnızca görünürlük
içindir.

## ACP oturumları

Hedef bir ACP harness oturumu olduğunda `/acp steer` kullanın:

```text
/acp steer --session agent:main:acp:codex tighten the repro
```

ACP oturum seçimi ve runtime davranışı için [ACP aracıları](/tr/tools/acp-agents)
bölümüne bakın.

## İlgili

- [Eğik çizgi komutları](/tr/tools/slash-commands)
- [Komut kuyruğu](/tr/concepts/queue)
- [Yönlendirme kuyruğu](/tr/concepts/queue-steering)
- [Alt aracılar](/tr/tools/subagents)
