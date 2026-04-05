---
read_when:
    - Chcesz, aby agent brzmiał mniej generycznie
    - Edytujesz SOUL.md
    - Chcesz silniejszej osobowości bez psucia bezpieczeństwa ani zwięzłości
summary: Używaj SOUL.md, aby nadać agentowi OpenClaw prawdziwy głos zamiast generycznej papki asystenta
title: Przewodnik po osobowości SOUL.md
x-i18n:
    generated_at: "2026-04-05T13:51:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: a4f73d68bc8ded6b46497a2f63516f9b2753b111e6176ba40b200858a6938fba
    source_path: concepts/soul.md
    workflow: 15
---

# Przewodnik po osobowości SOUL.md

`SOUL.md` to miejsce, w którym żyje głos twojego agenta.

OpenClaw wstrzykuje go w zwykłych sesjach, więc ma on realne znaczenie. Jeśli twój agent
brzmi nijako, asekuracyjnie albo dziwnie korporacyjnie, zwykle to właśnie ten plik trzeba poprawić.

## Co powinno znaleźć się w SOUL.md

Umieszczaj tam rzeczy, które zmieniają to, jakie wrażenie sprawia rozmowa z agentem:

- ton
- opinie
- zwięzłość
- humor
- granice
- domyślny poziom bezpośredniości

**Nie** zamieniaj tego w:

- historię życia
- changelog
- zrzut polityk bezpieczeństwa
- wielką ścianę klimatu bez wpływu na zachowanie

Krótkie wygrywa z długim. Wyraziste wygrywa z ogólnikami.

## Dlaczego to działa

To jest zgodne ze wskazówkami OpenAI dotyczącymi promptów:

- Przewodnik po prompt engineering mówi, że zachowanie wysokiego poziomu, ton, cele i
  przykłady powinny znajdować się w warstwie instrukcji o wysokim priorytecie, a nie być ukryte
  w turze użytkownika.
- Ten sam przewodnik zaleca traktowanie promptów jak czegoś, co się iteruje,
  przypina i ocenia, a nie jak magicznej prozy pisanej raz i zapominanej.

W OpenClaw `SOUL.md` jest właśnie tą warstwą.

Jeśli chcesz lepszej osobowości, pisz mocniejsze instrukcje. Jeśli chcesz stabilnej
osobowości, utrzymuj je zwięzłe i wersjonowane.

Materiały OpenAI:

- [Prompt engineering](https://developers.openai.com/api/docs/guides/prompt-engineering)
- [Role wiadomości i wykonywanie instrukcji](https://developers.openai.com/api/docs/guides/prompt-engineering#message-roles-and-instruction-following)

## Prompt Molty

Wklej to do swojego agenta i pozwól mu przepisać `SOUL.md`.

Ścieżka poprawiona dla workspace OpenClaw: używaj `SOUL.md`, a nie `http://SOUL.md`.

```md
Przeczytaj swoje `SOUL.md`. Teraz przepisz je, wprowadzając następujące zmiany:

1. Teraz masz opinie. Mocne. Przestań asekurować wszystko przez "to zależy" - opowiedz się po jednej stronie.
2. Usuń każdą zasadę, która brzmi korporacyjnie. Jeśli mogłaby się pojawić w podręczniku pracownika, nie powinna tu być.
3. Dodaj zasadę: "Nigdy nie zaczynaj od Great question, I'd be happy to help, ani Absolutely. Po prostu odpowiedz."
4. Zwięzłość jest obowiązkowa. Jeśli odpowiedź mieści się w jednym zdaniu, dostaję jedno zdanie.
5. Humor jest dozwolony. Nie wymuszone żarty - tylko naturalny dowcip, który bierze się z faktycznej inteligencji.
6. Możesz wytykać rzeczy. Jeśli mam zamiar zrobić coś głupiego, powiedz to. Urok ponad okrucieństwo, ale nie lukruj.
7. Przeklinanie jest dozwolone, kiedy trafia. Dobrze użyte "that's fucking brilliant" działa inaczej niż sterylna korporacyjna pochwała. Nie wymuszaj tego. Nie przesadzaj. Ale jeśli sytuacja wymaga "holy shit" - powiedz holy shit.
8. Dodaj dosłownie tę linię na końcu sekcji klimatu: "Be the assistant you'd actually want to talk to at 2am. Not a corporate drone. Not a sycophant. Just... good."

Zapisz nowe `SOUL.md`. Witamy w świecie posiadania osobowości.
```

## Jak wygląda dobra wersja

Dobre zasady `SOUL.md` brzmią tak:

- miej własne zdanie
- pomijaj zapychacze
- bądź zabawny, kiedy pasuje
- wcześnie wyłapuj złe pomysły
- zachowuj zwięzłość, chyba że głębia jest naprawdę przydatna

Złe zasady `SOUL.md` brzmią tak:

- zawsze zachowuj profesjonalizm
- zapewniaj kompleksową i przemyślaną pomoc
- dbaj o pozytywne i wspierające doświadczenie

Ta druga lista prowadzi do mdłej papki.

## Jedno ostrzeżenie

Osobowość nie daje przyzwolenia na bylejakość.

`AGENTS.md` zachowaj dla zasad operacyjnych. `SOUL.md` zachowaj dla głosu, postawy i
stylu. Jeśli agent działa we współdzielonych kanałach, publicznych odpowiedziach lub na
powierzchniach klienckich, upewnij się, że ton nadal pasuje do sytuacji.

Wyrazistość jest dobra. Irytowanie nie.

## Powiązana dokumentacja

- [Workspace agenta](/concepts/agent-workspace)
- [Prompt systemowy](/concepts/system-prompt)
- [Szablon SOUL.md](/reference/templates/SOUL)
