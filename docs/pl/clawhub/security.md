---
read_when:
    - Zgłaszanie problemu bezpieczeństwa ClawHub
    - Zrozumienie ujawniania podatności w ClawHub
    - Odróżnianie problemów platformy ClawHub od problemów z Skills lub Plugin innych firm
sidebarTitle: Security
summary: Jak zgłaszać problemy dotyczące bezpieczeństwa ClawHub i kiedy luki w zabezpieczeniach są ujawniane publicznie.
title: Bezpieczeństwo
x-i18n:
    generated_at: "2026-07-02T08:53:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 64dcc75ad4210082c79326e617bac38908e927fd8d260fd029aa87e0a11cd324
    source_path: clawhub/security.md
    workflow: 16
---

# Bezpieczeństwo

Problemy bezpieczeństwa ClawHub można zgłaszać za pomocą GitHub Security Advisories dla
`openclaw/clawhub`.

Używaj GitHub Security Advisories dla podatności w samym ClawHub. Dobre
zgłoszenia advisory ClawHub obejmują błędy w:

- witrynie ClawHub, API lub CLI
- publikowaniu w rejestrze, pobieraniu, instalowaniu lub integralności artefaktów
- uwierzytelnianiu, autoryzacji lub tokenach API
- skanowaniu, moderacji lub obsłudze zgłoszeń

Nie używaj advisory ClawHub do zgłaszania podatności we własnym kodzie źródłowym Skills lub Pluginu innych firm. Zgłaszaj je bezpośrednio wydawcy albo do repozytorium źródłowego
podlinkowanego z wpisu w ClawHub.

## Ujawnianie podatności

Ponieważ ClawHub jest hostowaną aplikacją chmurową, podatności usługi ClawHub
domyślnie nie są ujawniane publicznie. Są ujawniane publicznie, gdy istnieją
dowody rzeczywistego wpływu na użytkowników lub gdy użytkownicy muszą podjąć działania.

Przykłady rzeczywistego wpływu na użytkowników obejmują potwierdzone wykorzystanie,
ujawnienie danych użytkowników lub sekretów, dotarcie złośliwych treści do użytkowników
z powodu awarii platformy albo dowolny problem, który wymaga od użytkowników rotacji
poświadczeń, aktualizacji lokalnego oprogramowania lub podjęcia innych działań ochronnych.

Podatności w oprogramowaniu instalowanym przez użytkowników są ujawniane publicznie,
na przykład pakiety CLI ClawHub, pliki binarne, biblioteki lub inne artefakty wydania,
które użytkownicy muszą zaktualizować lokalnie.

## Powiązane strony

Etykiety audytu podczas instalacji, poziomy ryzyka, ustalenia i interpretację opisuje
[Audyty bezpieczeństwa](/clawhub/security-audits).

Zgłoszenia marketplace, blokady moderacyjne, ukryte wpisy, bany i status konta opisuje
[Moderacja i bezpieczeństwo konta](/clawhub/moderation).
