---
read_when:
    - Zgłaszanie problemu bezpieczeństwa w ClawHub
    - Zrozumienie ujawniania podatności ClawHub
    - Rozróżnianie problemów z platformą ClawHub od problemów z zewnętrznymi Skills lub Plugin
sidebarTitle: Security
summary: Jak zgłaszać problemy z bezpieczeństwem ClawHub i kiedy podatności są ujawniane publicznie.
title: Bezpieczeństwo
x-i18n:
    generated_at: "2026-06-28T20:42:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 64dcc75ad4210082c79326e617bac38908e927fd8d260fd029aa87e0a11cd324
    source_path: clawhub/security.md
    workflow: 16
---

# Bezpieczeństwo

Problemy z bezpieczeństwem ClawHub można zgłaszać przez GitHub Security Advisories dla
`openclaw/clawhub`.

Używaj GitHub Security Advisories dla luk w zabezpieczeniach samego ClawHub. Dobre
zgłoszenia doradcze ClawHub obejmują błędy w:

- witrynie, API lub CLI ClawHub
- publikowaniu w rejestrze, pobraniach, instalacjach lub integralności artefaktów
- uwierzytelnianiu, autoryzacji lub tokenach API
- skanowaniu, moderacji lub obsłudze zgłoszeń

Nie używaj zgłoszeń doradczych ClawHub dla luk w zabezpieczeniach we własnym kodzie
źródłowym umiejętności lub pluginu innej firmy. Zgłaszaj je bezpośrednio wydawcy albo
do repozytorium źródłowego podlinkowanego we wpisie ClawHub.

## Ujawnianie luk w zabezpieczeniach

Ponieważ ClawHub jest hostowaną aplikacją chmurową, luki w zabezpieczeniach usługi
ClawHub domyślnie nie są ujawniane publicznie. Są ujawniane publicznie, gdy istnieją
dowody rzeczywistego wpływu na użytkowników lub gdy użytkownicy muszą podjąć działanie.

Przykłady rzeczywistego wpływu na użytkowników obejmują potwierdzone wykorzystanie,
ujawnienie danych lub sekretów użytkownika, dotarcie złośliwej treści do użytkowników
z powodu awarii platformy albo dowolny problem wymagający od użytkowników rotacji
poświadczeń, aktualizacji lokalnego oprogramowania lub podjęcia innych działań ochronnych.

Luki w zabezpieczeniach oprogramowania instalowanego przez użytkowników są ujawniane
publicznie, na przykład pakiety CLI ClawHub, pliki binarne, biblioteki lub inne artefakty
wydania, które użytkownicy muszą aktualizować lokalnie.

## Powiązane strony

Informacje o etykietach audytu podczas instalacji, poziomach ryzyka, ustaleniach i interpretacji znajdziesz w
[Audytach bezpieczeństwa](/pl/clawhub/security-audits).

Informacje o zgłoszeniach marketplace, wstrzymaniach moderacyjnych, ukrytych wpisach, blokadach i statusie konta znajdziesz w [Moderacji i bezpieczeństwie konta](/pl/clawhub/moderation).
