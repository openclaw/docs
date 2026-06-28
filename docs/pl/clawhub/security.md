---
read_when:
    - Zgłaszanie problemu z bezpieczeństwem ClawHub
    - Zrozumienie ujawniania podatności w ClawHub
    - Odróżnianie problemów z platformą ClawHub od problemów ze Skills lub Pluginami innych firm
sidebarTitle: Security
summary: Jak zgłaszać problemy bezpieczeństwa ClawHub i kiedy luki w zabezpieczeniach są publicznie ujawniane.
title: Bezpieczeństwo
x-i18n:
    generated_at: "2026-06-28T10:03:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 64dcc75ad4210082c79326e617bac38908e927fd8d260fd029aa87e0a11cd324
    source_path: clawhub/security.md
    workflow: 16
---

# Bezpieczeństwo

Problemy bezpieczeństwa ClawHub można zgłaszać przez GitHub Security Advisories dla
`openclaw/clawhub`.

Używaj GitHub Security Advisories dla podatności w samym ClawHub. Dobre
zgłoszenia doradcze ClawHub obejmują błędy w:

- witrynie ClawHub, API lub CLI
- publikowaniu w rejestrze, pobieraniu, instalacjach lub integralności artefaktów
- uwierzytelnianiu, autoryzacji lub tokenach API
- skanowaniu, moderacji lub obsłudze zgłoszeń

Nie używaj zgłoszeń doradczych ClawHub do podatności we własnym kodzie źródłowym zewnętrznej umiejętności lub
pluginu. Zgłaszaj je bezpośrednio wydawcy lub do repozytorium źródłowego
podlinkowanego w wpisie ClawHub.

## Ujawnianie podatności

Ponieważ ClawHub jest hostowaną aplikacją chmurową, podatności usługi ClawHub
nie są domyślnie ujawniane publicznie. Są ujawniane publicznie, gdy istnieją
dowody rzeczywistego wpływu na użytkowników lub gdy użytkownicy muszą podjąć działania.

Przykłady rzeczywistego wpływu na użytkowników obejmują potwierdzone wykorzystanie, ujawnienie danych
użytkowników lub sekretów, dotarcie złośliwej treści do użytkowników z powodu awarii platformy
albo dowolny problem, który wymaga od użytkowników rotacji poświadczeń, aktualizacji lokalnego oprogramowania lub
podjęcia innych działań ochronnych.

Podatności w oprogramowaniu instalowanym przez użytkowników są ujawniane publicznie, na przykład
pakiety CLI ClawHub, binaria, biblioteki lub inne artefakty wydania, które użytkownicy
muszą zaktualizować lokalnie.

## Powiązane strony

Informacje o etykietach audytu podczas instalacji, poziomach ryzyka, ustaleniach i interpretacji znajdziesz w
[Audytach bezpieczeństwa](/pl/clawhub/security-audits).

Informacje o zgłoszeniach w marketplace, wstrzymaniach moderacyjnych, ukrytych wpisach, blokadach i stanie konta
znajdziesz w [Moderacji i bezpieczeństwie konta](/pl/clawhub/moderation).
