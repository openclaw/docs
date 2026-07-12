---
doc-schema-version: 1
read_when:
    - Chcesz znaleźć Pluginy OpenClaw innych firm
    - Chcesz opublikować lub umieścić własny plugin na ClawHub
summary: Znajduj i publikuj Pluginy OpenClaw utrzymywane przez społeczność
title: Pluginy społecznościowe
x-i18n:
    generated_at: "2026-07-12T15:19:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6a9eb477f20da8171a35c22ea6b112d77ff4afe0878f60314c052746aef4e0ac
    source_path: plugins/community.md
    workflow: 16
---

Pluginy społecznościowe to pakiety innych firm, które rozszerzają OpenClaw o
kanały, narzędzia, dostawców, hooki lub inne możliwości. Używaj
[ClawHub](/clawhub) jako głównego miejsca wyszukiwania publicznych pluginów
społecznościowych.

## Znajdowanie pluginów

Przeszukuj ClawHub z poziomu CLI:

```bash
openclaw plugins search "calendar"
```

Zainstaluj plugin z ClawHub, używając jawnego prefiksu źródła:

```bash
openclaw plugins install clawhub:<package-name>
```

Podczas przejścia związanego z uruchomieniem npm pozostaje obsługiwaną metodą
bezpośredniej instalacji:

```bash
openclaw plugins install npm:<package-name>
```

Zobacz [Zarządzanie pluginami](/pl/plugins/manage-plugins), aby poznać typowe
przykłady instalowania, aktualizowania, sprawdzania i odinstalowywania.
Pełną dokumentację poleceń i reguły wyboru źródła zawiera strona
[`openclaw plugins`](/pl/cli/plugins).

## Publikowanie pluginów

Publikuj publiczne pluginy społecznościowe w ClawHub, aby użytkownicy OpenClaw
mogli je znajdować i instalować. ClawHub zarządza aktualną listą pakietów,
historią wydań, stanem skanowania i wskazówkami dotyczącymi instalacji;
dokumentacja nie utrzymuje statycznego katalogu pluginów innych firm.

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

Przed opublikowaniem upewnij się, że plugin ma metadane pakietu, manifest
pluginu, dokumentację konfiguracji oraz jasno wskazaną osobę odpowiedzialną
za utrzymanie. Przed utworzeniem wydania ClawHub weryfikuje zakres właściciela,
nazwę pakietu, wersję, limity plików i metadane źródła, a następnie ukrywa nowe
wydania w standardowych miejscach instalacji i pobierania do czasu zakończenia
przeglądu i weryfikacji.

Lista kontrolna przed publikacją:

| Wymaganie                   | Dlaczego                                                        |
| --------------------------- | ---------------------------------------------------------------- |
| Opublikowanie w ClawHub     | Wskazówki `openclaw plugins install` muszą działać dla użytkowników |
| Publiczne repozytorium GitHub | Przegląd źródła, śledzenie zgłoszeń i przejrzystość              |
| Dokumentacja konfiguracji i użycia | Użytkownicy muszą wiedzieć, jak skonfigurować plugin        |
| Aktywne utrzymanie          | Niedawne aktualizacje lub sprawna obsługa zgłoszeń                |

Pełna specyfikacja publikowania:

- [Publikowanie w ClawHub](/pl/clawhub/publishing) — właściciele, zakresy, wydania,
  przegląd, walidacja pakietów i przenoszenie pakietów
- [Tworzenie pluginów](/pl/plugins/building-plugins) — struktura pakietu pluginu
  i proces pierwszej publikacji
- [Manifest pluginu](/pl/plugins/manifest) — pola natywnego manifestu pluginu

## Powiązane materiały

- [Pluginy](/pl/tools/plugin) — instalowanie, konfigurowanie, ponowne uruchamianie
  i rozwiązywanie problemów
- [Zarządzanie pluginami](/pl/plugins/manage-plugins) — przykłady poleceń
- [Publikowanie w ClawHub](/pl/clawhub/publishing) — reguły publikowania i wydawania
