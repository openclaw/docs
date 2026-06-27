---
doc-schema-version: 1
read_when:
    - Chcesz znaleźć zewnętrzne pluginy OpenClaw
    - Chcesz opublikować lub umieścić własny Plugin na ClawHub
summary: Znajdź i publikuj utrzymywane przez społeczność pluginy OpenClaw
title: Pluginy społeczności
x-i18n:
    generated_at: "2026-06-27T17:52:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0ecf059fa0c32f09d09381b2153a6a63ca522d49719aaa8476209389a6b5b36a
    source_path: plugins/community.md
    workflow: 16
---

Pluginy społeczności to pakiety firm trzecich, które rozszerzają OpenClaw o kanały,
narzędzia, dostawców, hooki lub inne możliwości. Używaj [ClawHub](/pl/clawhub) jako
głównego miejsca odkrywania publicznych Pluginów społeczności.

## Znajdź Pluginy

Przeszukaj ClawHub z CLI:

```bash
openclaw plugins search "calendar"
```

Zainstaluj Plugin ClawHub z jawnym prefiksem źródła:

```bash
openclaw plugins install clawhub:<package-name>
```

npm pozostaje obsługiwaną ścieżką bezpośredniej instalacji podczas przejścia
wdrożeniowego:

```bash
openclaw plugins install npm:<package-name>
```

Użyj [Zarządzanie Pluginami](/pl/plugins/manage-plugins), aby zobaczyć typowe
przykłady instalacji, aktualizacji, inspekcji i odinstalowania. Użyj
[`openclaw plugins`](/pl/cli/plugins), aby zobaczyć pełną dokumentację poleceń i
reguły wyboru źródła.

## Publikuj Pluginy

Publikuj publiczne Pluginy społeczności w ClawHub, gdy chcesz, aby użytkownicy
OpenClaw mogli je odkrywać i instalować. ClawHub odpowiada za bieżącą listę
pakietów, historię wydań, status skanowania i wskazówki instalacyjne; dokumentacja
nie utrzymuje statycznego katalogu Pluginów firm trzecich.

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

Przed publikacją upewnij się, że Plugin ma metadane pakietu, manifest Pluginu,
dokumentację konfiguracji i jasno wskazanego właściciela odpowiedzialnego za
utrzymanie. ClawHub weryfikuje zakres właściciela, nazwę pakietu, wersję, limity
plików i metadane źródła, zanim utworzy wydanie, a następnie ukrywa nowe wydania
przed zwykłymi powierzchniami instalacji i pobierania do czasu zakończenia
przeglądu i weryfikacji.

Użyj tej listy kontrolnej przed publikacją:

| Wymaganie           | Dlaczego                                           |
| ------------------- | -------------------------------------------------- |
| Opublikowany w ClawHub | Użytkownicy potrzebują działających wskazówek `openclaw plugins install` |
| Publiczne repozytorium GitHub | Przegląd źródeł, śledzenie zgłoszeń, przejrzystość |
| Dokumentacja konfiguracji i użycia | Użytkownicy muszą wiedzieć, jak go skonfigurować |
| Aktywne utrzymanie  | Niedawne aktualizacje lub responsywna obsługa zgłoszeń |

Użyj tych stron, aby zobaczyć pełny kontrakt publikowania:

- [Publikowanie w ClawHub](/pl/clawhub/publishing) wyjaśnia właścicieli, zakresy, wydania,
  przegląd, walidację pakietów i przenoszenie pakietów.
- [Tworzenie Pluginów](/pl/plugins/building-plugins) pokazuje kształt pakietu Pluginu
  i pierwszy przepływ publikacji.
- [Manifest Pluginu](/pl/plugins/manifest) definiuje natywne pola manifestu Pluginu.

## Powiązane

- [Pluginy](/pl/tools/plugin) - instalacja, konfiguracja, restart i rozwiązywanie problemów
- [Zarządzanie Pluginami](/pl/plugins/manage-plugins) - przykłady poleceń
- [Publikowanie w ClawHub](/pl/clawhub/publishing) - reguły publikacji i wydań
