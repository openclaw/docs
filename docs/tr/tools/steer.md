---
read_when:
    - Bir ajan halihazırda çalışırken /steer veya /tell kullanımı
    - /steer ile /queue steer karşılaştırması
    - Mevcut çalıştırmayı, bir alt ajanı veya bir ACP oturumunu yönlendirip yönlendirmemeye karar verme
sidebarTitle: Steer
summary: Kuyruk modunu değiştirmeden aktif bir çalıştırmayı yönlendirin
title: Yönlendir
x-i18n:
    generated_at: "2026-05-04T07:09:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 71e1c80c0eea86d5c3c29513d3ed0675c04779fc9c6ee3b8a76c4bedaa264d22
    source_path: tools/steer.md
    workflow: 16
---

`/steer`, zaten etkin olan bir çalıştırmaya rehberlik gönderir. Yeni bir tur başlatmak için değil, "bu
çalıştırma hâlâ sürerken bunu ayarla" anları içindir.

## Geçerli oturum

Geçerli oturumun etkin çalıştırmasını hedeflemek için üst düzey `/steer` kullanın:

```text
/steer prefer the smaller patch and keep the tests focused
/tell summarize before making the next tool call
```

Davranış:

- Yalnızca geçerli oturumun etkin çalıştırmasını hedefler.
- Oturumun `/queue` modundan bağımsız çalışır.
- Oturum boştayken yeni bir çalıştırma başlatmaz.
- Yönlendirilecek etkin bir çalıştırma olmadığında bir uyarıyla yanıt verir.
- Etkin çalışma zamanının yönlendirme yolunu kullanır; böylece model rehberliği
  bir sonraki desteklenen çalışma zamanı sınırında görür.

## Yönlendirme ve kuyruk

`/queue steer`, bir çalıştırma etkinken gelen normal iletilerin nasıl davranacağını
değiştirir. `/steer <message>`, saklanan `/queue` ayarından bağımsız olarak,
bu komutun iletisini bir sonraki desteklenen çalışma zamanı sınırında etkin
çalıştırmaya enjekte etmeye çalışan açık bir komuttur.

Kullanım:

- Etkin çalıştırmayı hemen yönlendirmek istediğinizde `/steer <message>` kullanın.
- Gelecekteki normal iletilerin varsayılan olarak etkin çalıştırmaları yönlendirmesini
  istediğinizde `/queue steer` kullanın.
- Yeni iletilerin etkin çalıştırmayı yönlendirmek yerine daha sonraki bir turu
  beklemesi gerektiğinde `/queue collect` veya `/queue followup` kullanın.

Kuyruk modları ve yedek davranış için bkz. [Komut kuyruğu](/tr/concepts/queue) ve
[Yönlendirme kuyruğu](/tr/concepts/queue-steering).

## Alt aracılar

Hedef bir alt çalıştırma olduğunda `/subagents steer` kullanın:

```text
/subagents steer 2 focus only on the API surface
```

Üst düzey `/steer`, kimliğe veya liste dizinine göre bir alt aracı seçmez. Her zaman
geçerli oturumun etkin çalıştırmasını hedefler. Alt aracı kimlikleri, etiketleri ve
kontrol komutları için bkz. [Alt aracılar](/tr/tools/subagents).

## ACP oturumları

Hedef bir ACP harness oturumu olduğunda `/acp steer` kullanın:

```text
/acp steer --session agent:main:acp:codex tighten the repro
```

ACP oturumu seçimi ve çalışma zamanı davranışı için bkz. [ACP aracıları](/tr/tools/acp-agents).

## İlgili

- [Eğik çizgi komutları](/tr/tools/slash-commands)
- [Komut kuyruğu](/tr/concepts/queue)
- [Yönlendirme kuyruğu](/tr/concepts/queue-steering)
- [Alt aracılar](/tr/tools/subagents)
