---
read_when:
    - Używanie /steer lub /tell, gdy agent już działa
    - Porównanie trybów /steer i /queue
    - Podejmowanie decyzji, czy sterować bieżącym uruchomieniem czy sesją ACP
sidebarTitle: Steer
summary: Sterowanie aktywnym uruchomieniem bez zmiany trybu kolejki
title: Steruj
x-i18n:
    generated_at: "2026-06-27T18:30:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2e73f3f2fd938ee9dbdd14d183abe7f8676dbc7bb7382e6ad2c1fd41034fa09c
    source_path: tools/steer.md
    workflow: 16
---

`/steer` najpierw próbuje wysłać wskazówki do już aktywnego uruchomienia. Służy do momentów typu „dostosuj to uruchomienie, gdy nadal pracuje”. Jeśli bieżące środowisko uruchomieniowe nie może przyjąć sterowania, OpenClaw wysyła wiadomość jako zwykły prompt zamiast ją porzucać.

## Bieżąca sesja

Użyj `/steer` najwyższego poziomu, aby wskazać aktywne uruchomienie dla bieżącej sesji:

```text
/steer prefer the smaller patch and keep the tests focused
/tell summarize before making the next tool call
```

Zachowanie:

- Wskazuje tylko aktywne uruchomienie bieżącej sesji.
- Działa niezależnie od trybu `/queue` sesji.
- Rozpoczyna zwykłą turę z tą samą wiadomością, gdy sesja jest bezczynna albo aktywne uruchomienie nie może przyjąć sterowania.
- Używa ścieżki sterowania aktywnego środowiska uruchomieniowego, więc model widzi wskazówki przy następnej obsługiwanej granicy środowiska uruchomieniowego.

## Sterowanie a kolejka

`/queue steer` sprawia, że zwykłe wiadomości przychodzące próbują sterować aktywnym uruchomieniem, gdy nadejdą w czasie, kiedy uruchomienie jest aktywne. `/steer <message>` to jawne polecenie, które próbuje wstrzyknąć wiadomość tego polecenia do aktywnego uruchomienia przy następnej obsługiwanej granicy środowiska uruchomieniowego, niezależnie od zapisanego ustawienia `/queue`. Gdy takie wstrzyknięcie nie jest dostępne, prefiks polecenia jest usuwany, a `<message>` jest kontynuowane jako zwykły prompt.

Użyj:

- `/steer <message>`, gdy chcesz pokierować aktywnym uruchomieniem teraz.
- `/queue steer`, gdy chcesz, aby przyszłe zwykłe wiadomości domyślnie sterowały aktywnymi uruchomieniami.
- `/queue collect` lub `/queue followup`, gdy przyszłe zwykłe wiadomości powinny poczekać na późniejszą turę zamiast sterować aktywnym uruchomieniem.
- `/queue interrupt`, gdy najnowsza wiadomość powinna zastąpić aktywne uruchomienie zamiast nim sterować.

Informacje o trybach kolejki i granicach sterowania znajdziesz w sekcjach [Kolejka poleceń](/pl/concepts/queue) oraz [Kolejka sterowania](/pl/concepts/queue-steering).

## Podagenci

`/steer` najwyższego poziomu wskazuje aktywne uruchomienie bieżącej sesji. Podagenci zgłaszają wyniki z powrotem do swojej sesji nadrzędnej/żądającej; `/subagents` służy tylko do widoczności.

## Sesje ACP

Użyj `/acp steer`, gdy celem jest sesja harnessu ACP:

```text
/acp steer --session agent:main:acp:codex tighten the repro
```

Zobacz [Agentów ACP](/pl/tools/acp-agents), aby uzyskać informacje o wyborze sesji ACP i zachowaniu środowiska uruchomieniowego.

## Powiązane

- [Polecenia ukośnikowe](/pl/tools/slash-commands)
- [Kolejka poleceń](/pl/concepts/queue)
- [Kolejka sterowania](/pl/concepts/queue-steering)
- [Podagenci](/pl/tools/subagents)
