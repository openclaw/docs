---
read_when:
    - Reagowanie na zgłoszenie dotyczące bezpieczeństwa lub podejrzenie incydentu bezpieczeństwa
    - Przygotowywanie skoordynowanego ujawnienia lub wydania zabezpieczeń z poprawkami
    - Przegląd oczekiwań dotyczących działań następczych po incydencie
summary: Jak OpenClaw klasyfikuje incydenty bezpieczeństwa, reaguje na nie i prowadzi działania następcze
title: Reagowanie na incydenty
x-i18n:
    generated_at: "2026-05-03T21:37:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: ef39b037cf3574a61fd67b356654f1ea0b91d84f89345c22aae93c1db7694df8
    source_path: security/incident-response.md
    workflow: 16
---

# Reagowanie na incydenty

## 1. Wykrywanie i triage

Monitorujemy sygnały bezpieczeństwa z:

- GitHub Security Advisories (GHSA) oraz prywatnych zgłoszeń podatności.
- Publicznych zgłoszeń/dyskusji w GitHub, gdy raporty nie są poufne.
- Sygnałów automatycznych (na przykład Dependabot, CodeQL, porad npm i skanowania sekretów).

Wstępny triage:

1. Potwierdź komponent, wersję i wpływ na granicę zaufania.
2. Zaklasyfikuj jako problem bezpieczeństwa albo utwardzanie/brak działania, używając zakresu repozytorium `SECURITY.md` oraz reguł wyłączeń z zakresu.
3. Właściciel incydentu odpowiada odpowiednio.

## 2. Ocena

Przewodnik po poziomach ważności:

- **Krytyczny:** Kompromitacja pakietu/wydania/repozytorium, aktywne wykorzystanie albo nieuwierzytelnione obejście granicy zaufania z kontrolą o dużym wpływie lub ujawnieniem danych.
- **Wysoki:** Zweryfikowane obejście granicy zaufania wymagające ograniczonych warunków wstępnych (na przykład uwierzytelnione, ale nieautoryzowane działanie o dużym wpływie) albo ujawnienie wrażliwych poświadczeń należących do OpenClaw.
- **Średni:** Istotna słabość bezpieczeństwa z praktycznym wpływem, ale ograniczoną możliwością wykorzystania lub znaczącymi wymaganiami wstępnymi.
- **Niski:** Ustalenia typu defense-in-depth, wąsko ograniczona odmowa usługi albo luki w utwardzaniu/parytecie bez wykazanego obejścia granicy zaufania.

## 3. Reakcja

1. Potwierdź otrzymanie zgłoszenia reporterowi (prywatnie, gdy jest poufne).
2. Odtwórz problem w obsługiwanych wydaniach i najnowszym `main`, a następnie zaimplementuj i zweryfikuj poprawkę z pokryciem regresyjnym.
3. Dla incydentów krytycznych/wysokich przygotuj poprawione wydanie/wydania tak szybko, jak to praktyczne.
4. Dla incydentów średnich/niskich wprowadź poprawkę w normalnym przepływie wydań i udokumentuj wskazówki dotyczące ograniczania ryzyka.

## 4. Komunikacja

Komunikujemy się przez:

- GitHub Security Advisories w dotkniętym repozytorium.
- Noty wydania/wpisy changeloga dla poprawionych wersji.
- Bezpośredni kontakt z reporterem w sprawie statusu i rozwiązania.

Polityka ujawniania:

- Incydenty krytyczne/wysokie powinny otrzymać skoordynowane ujawnienie, z nadaniem CVE, gdy jest to właściwe.
- Ustalenia dotyczące utwardzania o niskim ryzyku mogą zostać udokumentowane w notach wydania lub poradach bez CVE, zależnie od wpływu i ekspozycji użytkowników.

## 5. Odzyskiwanie i działania następcze

Po dostarczeniu poprawki:

1. Zweryfikuj remediacje w CI i artefaktach wydania.
2. Przeprowadź krótki przegląd po incydencie (oś czasu, przyczyna źródłowa, luka w wykrywaniu, plan zapobiegania).
3. Dodaj następcze zadania dotyczące utwardzania/testów/dokumentacji i śledź je do ukończenia.
