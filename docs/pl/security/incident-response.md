---
read_when:
    - Reagowanie na zgłoszenie dotyczące bezpieczeństwa lub podejrzewany incydent bezpieczeństwa
    - Przygotowanie skoordynowanego ujawnienia lub wydania bezpieczeństwa z poprawkami
    - Przegląd oczekiwań dotyczących działań następczych po incydencie
summary: Jak OpenClaw klasyfikuje incydenty bezpieczeństwa, reaguje na nie i prowadzi działania następcze
title: Reagowanie na incydenty
x-i18n:
    generated_at: "2026-05-06T09:29:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 546b69242fc4674e3d27e79e4c7b5cfecb83bcb17e8edb2a4b62f1a7498fb84f
    source_path: security/incident-response.md
    workflow: 16
    postprocess_version: locale-links-v1
---

## 1. Wykrywanie i wstępna klasyfikacja

Monitorujemy sygnały bezpieczeństwa z:

- GitHub Security Advisories (GHSA) i prywatnych zgłoszeń podatności.
- Publicznych zgłoszeń/dyskusji w GitHub, gdy zgłoszenia nie są wrażliwe.
- Zautomatyzowanych sygnałów (na przykład Dependabot, CodeQL, porad npm i skanowania sekretów).

Wstępna klasyfikacja:

1. Potwierdź komponent, wersję i wpływ na granicę zaufania.
2. Sklasyfikuj jako problem bezpieczeństwa albo jako wzmacnianie zabezpieczeń/brak działań, używając zakresu i reguł wykluczeń z repozytorium `SECURITY.md`.
3. Właściciel incydentu odpowiada odpowiednio do sytuacji.

## 2. Ocena

Przewodnik po poziomach ważności:

- **Krytyczny:** Przejęcie pakietu/wydania/repozytorium, aktywne wykorzystanie albo nieuwierzytelnione obejście granicy zaufania z kontrolą o dużym wpływie lub ujawnieniem danych.
- **Wysoki:** Zweryfikowane obejście granicy zaufania wymagające ograniczonych warunków wstępnych (na przykład uwierzytelnione, ale nieautoryzowane działanie o dużym wpływie), albo ujawnienie wrażliwych poświadczeń należących do OpenClaw.
- **Średni:** Istotna słabość bezpieczeństwa o praktycznym wpływie, ale z ograniczoną możliwością wykorzystania lub znaczącymi wymaganiami wstępnymi.
- **Niski:** Ustalenia dotyczące obrony w głąb, wąsko zakrojona odmowa usługi albo luki we wzmacnianiu zabezpieczeń/parytecie bez wykazanego obejścia granicy zaufania.

## 3. Reakcja

1. Potwierdź otrzymanie zgłoszenia zgłaszającemu (prywatnie, gdy jest wrażliwe).
2. Odtwórz problem na obsługiwanych wydaniach i najnowszym `main`, a następnie zaimplementuj i zweryfikuj poprawkę z pokryciem regresyjnym.
3. W przypadku incydentów krytycznych/wysokich przygotuj poprawione wydania tak szybko, jak to praktyczne.
4. W przypadku incydentów średnich/niskich wprowadź poprawkę w zwykłym cyklu wydawniczym i udokumentuj wskazówki dotyczące mitygacji.

## 4. Komunikacja

Komunikujemy się przez:

- GitHub Security Advisories w dotkniętym repozytorium.
- Notatki do wydania/wpisy w changelogu dla poprawionych wersji.
- Bezpośredni kontakt ze zgłaszającym dotyczący statusu i rozwiązania.

Polityka ujawniania:

- Incydenty krytyczne/wysokie powinny otrzymać skoordynowane ujawnienie, z wydaniem CVE, gdy jest to właściwe.
- Ustalenia niskiego ryzyka dotyczące wzmacniania zabezpieczeń mogą zostać udokumentowane w notatkach do wydania lub poradach bez CVE, zależnie od wpływu i ekspozycji użytkowników.

## 5. Odzyskiwanie i działania następcze

Po dostarczeniu poprawki:

1. Zweryfikuj remediacje w CI i artefaktach wydania.
2. Przeprowadź krótki przegląd po incydencie (oś czasu, przyczyna źródłowa, luka w wykrywaniu, plan zapobiegania).
3. Dodaj zadania następcze dotyczące wzmacniania zabezpieczeń/testów/dokumentacji i śledź je do ukończenia.
