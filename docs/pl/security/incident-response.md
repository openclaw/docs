---
read_when:
    - Reagowanie na zgłoszenie dotyczące bezpieczeństwa lub podejrzenie incydentu bezpieczeństwa
    - Przygotowywanie skoordynowanego ujawnienia lub wydania z poprawką zabezpieczeń
    - Przegląd oczekiwań dotyczących działań następczych po incydencie
summary: Jak OpenClaw klasyfikuje incydenty bezpieczeństwa, reaguje na nie i podejmuje dalsze działania
title: Reagowanie na incydenty
x-i18n:
    generated_at: "2026-07-12T15:36:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 30f2d754408e95133ee86254ce193c0d8aab293040df55e0c1cec0c4d7644c56
    source_path: security/incident-response.md
    workflow: 16
---

## 1. Wykrywanie i wstępna ocena

Sygnały dotyczące bezpieczeństwa pochodzą z:

- Alertów GitHub Security Advisories (GHSA) i prywatnych zgłoszeń podatności.
- Publicznych zgłoszeń i dyskusji w serwisie GitHub, gdy raporty nie zawierają informacji poufnych.
- Automatycznych źródeł: Dependabot, CodeQL, alertów npm i skanowania pod kątem sekretów.

Wstępna ocena:

1. Potwierdź komponent i wersję, których dotyczy problem, oraz wpływ na granicę zaufania.
2. Sklasyfikuj zgłoszenie jako problem bezpieczeństwa albo wzmocnienie zabezpieczeń/brak konieczności działania, korzystając z reguł zakresu i wyłączeń z zakresu określonych w pliku `SECURITY.md`.
3. Osoba odpowiedzialna za incydent podejmuje odpowiednie działania.

## 2. Poziom istotności

| Poziom istotności | Definicja                                                                                                                                                                                               |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Krytyczny         | Naruszenie pakietu, wydania lub repozytorium, aktywne wykorzystywanie podatności albo nieuwierzytelnione obejście granicy zaufania umożliwiające kontrolę o dużym wpływie lub ujawnienie danych.             |
| Wysoki            | Potwierdzone obejście granicy zaufania wymagające spełnienia ograniczonych warunków wstępnych (na przykład uwierzytelnione, lecz nieautoryzowane działanie o dużym wpływie) albo ujawnienie poufnych danych uwierzytelniających należących do OpenClaw. |
| Średni            | Znacząca słabość zabezpieczeń o praktycznych skutkach, lecz ograniczonych możliwościach wykorzystania lub wymagająca spełnienia istotnych warunków wstępnych.                                              |
| Niski             | Ustalenia dotyczące ochrony wielowarstwowej, odmowa usługi o wąskim zakresie albo luki we wzmocnieniu zabezpieczeń lub zgodności bez wykazanego obejścia granicy zaufania.                                |

## 3. Reagowanie

1. Potwierdź zgłaszającemu otrzymanie raportu (prywatnie, jeśli zawiera informacje poufne).
2. Odtwórz problem w obsługiwanych wydaniach i najnowszej gałęzi `main`, a następnie zaimplementuj i zweryfikuj poprawkę wraz z testami regresji.
3. Poziom krytyczny/wysoki: przygotuj poprawione wydania tak szybko, jak jest to praktycznie możliwe.
4. Poziom średni/niski: wprowadź poprawkę w standardowym cyklu wydawniczym i udokumentuj zalecenia dotyczące ograniczania ryzyka.

## 4. Komunikacja i ujawnianie informacji

Komunikuj się za pośrednictwem GitHub Security Advisories w repozytorium, którego dotyczy problem, informacji o wydaniu lub wpisów w dzienniku zmian dotyczących poprawionych wersji oraz bezpośrednich wiadomości do zgłaszającego o stanie i rozwiązaniu problemu.

Incydenty o poziomie krytycznym lub wysokim podlegają skoordynowanemu ujawnieniu, z nadaniem identyfikatora CVE, gdy jest to właściwe. Ustalenia dotyczące wzmocnienia zabezpieczeń o niskim ryzyku mogą zostać udokumentowane w informacjach o wydaniu lub alertach bez identyfikatora CVE, zależnie od wpływu i stopnia narażenia użytkowników.

## 5. Przywracanie działania i dalsze czynności

Po opublikowaniu poprawki:

1. Zweryfikuj działania naprawcze w CI i artefaktach wydania.
2. Przeprowadź krótką analizę po incydencie: oś czasu, główna przyczyna, luka w wykrywaniu i plan zapobiegania.
3. Dodaj zadania uzupełniające dotyczące wzmocnienia zabezpieczeń, testów i dokumentacji oraz śledź je aż do ukończenia.

## Powiązane materiały

- [Polityka bezpieczeństwa](https://github.com/openclaw/openclaw/blob/main/SECURITY.md) — zakres zgłoszeń i model zaufania.
- [Model zagrożeń](/pl/security/THREAT-MODEL-ATLAS)
