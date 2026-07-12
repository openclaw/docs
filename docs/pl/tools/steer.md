---
read_when:
    - Używanie /steer lub /tell, gdy agent jest już uruchomiony
    - Porównanie `/steer` z trybami `/queue`
    - Decydowanie, czy przekierować bieżące wykonanie, czy sesję ACP
sidebarTitle: Steer
summary: Steruj aktywnym przebiegiem bez zmiany trybu kolejki
title: Sterowanie
x-i18n:
    generated_at: "2026-07-12T15:46:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2e73f3f2fd938ee9dbdd14d183abe7f8676dbc7bb7382e6ad2c1fd41034fa09c
    source_path: tools/steer.md
    workflow: 16
---

`/steer` najpierw próbuje wysłać wskazówki do już aktywnego przebiegu. Służy do
sytuacji typu „dostosuj ten przebieg, gdy nadal trwa”. Jeśli bieżące środowisko
wykonawcze nie może przyjąć sterowania, OpenClaw wysyła wiadomość jako zwykły
prompt zamiast ją odrzucać.

## Bieżąca sesja

Użyj polecenia najwyższego poziomu `/steer`, aby wskazać aktywny przebieg w bieżącej sesji:

```text
/steer prefer the smaller patch and keep the tests focused
/tell summarize before making the next tool call
```

Działanie:

- Wskazuje wyłącznie aktywny przebieg bieżącej sesji.
- Działa niezależnie od trybu `/queue` sesji.
- Rozpoczyna zwykłą turę z tą samą wiadomością, gdy sesja jest bezczynna lub
  aktywny przebieg nie może przyjąć sterowania.
- Korzysta ze ścieżki sterowania aktywnego środowiska wykonawczego, dzięki czemu
  model otrzymuje wskazówki przy następnej obsługiwanej granicy środowiska wykonawczego.

## Sterowanie a kolejka

`/queue steer` sprawia, że zwykłe wiadomości przychodzące próbują sterować aktywnym
przebiegiem, jeśli nadejdą podczas jego trwania. `/steer <message>` to jawne
polecenie, które próbuje wprowadzić treść tego polecenia do aktywnego przebiegu
przy następnej obsługiwanej granicy środowiska wykonawczego, niezależnie od
zapisanego ustawienia `/queue`. Gdy takie wprowadzenie nie jest dostępne, prefiks
polecenia jest usuwany, a `<message>` jest przetwarzane jako zwykły prompt.

Zastosowanie:

- `/steer <message>`, gdy chcesz natychmiast pokierować aktywnym przebiegiem.
- `/queue steer`, gdy chcesz, aby przyszłe zwykłe wiadomości domyślnie sterowały
  aktywnymi przebiegami.
- `/queue collect` lub `/queue followup`, gdy przyszłe zwykłe wiadomości powinny
  czekać na późniejszą turę zamiast sterować aktywnym przebiegiem.
- `/queue interrupt`, gdy najnowsza wiadomość powinna zastąpić aktywny przebieg
  zamiast nim sterować.

Informacje o trybach kolejki i granicach sterowania znajdziesz w sekcjach
[Kolejka poleceń](/pl/concepts/queue) oraz [Kolejka sterowania](/pl/concepts/queue-steering).

## Podagenci

Polecenie najwyższego poziomu `/steer` wskazuje aktywny przebieg bieżącej sesji.
Podagenci przekazują wyniki do sesji nadrzędnej lub sesji zlecającej;
`/subagents` służy wyłącznie do zapewnienia widoczności.

## Sesje ACP

Użyj `/acp steer`, gdy celem jest sesja środowiska ACP:

```text
/acp steer --session agent:main:acp:codex tighten the repro
```

Informacje o wyborze sesji ACP i działaniu środowiska wykonawczego znajdziesz
w sekcji [Agenci ACP](/pl/tools/acp-agents).

## Powiązane

- [Polecenia z ukośnikiem](/pl/tools/slash-commands)
- [Kolejka poleceń](/pl/concepts/queue)
- [Kolejka sterowania](/pl/concepts/queue-steering)
- [Podagenci](/pl/tools/subagents)
