---
read_when:
    - Zgłaszanie problemu bezpieczeństwa w ClawHub
    - Informacje o ujawnianiu podatności w ClawHub
    - Rozróżnianie problemów platformy ClawHub od problemów zewnętrznych Skills lub Pluginów
sidebarTitle: Security
summary: Jak zgłaszać problemy bezpieczeństwa ClawHub i kiedy podatności są publicznie ujawniane.
title: Bezpieczeństwo
x-i18n:
    generated_at: "2026-07-04T11:05:19Z"
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

Używaj GitHub Security Advisories w przypadku podatności w samym ClawHub. Dobre
zgłoszenia advisory dotyczące ClawHub obejmują błędy w:

- witrynie ClawHub, API lub CLI
- publikowaniu w rejestrze, pobieraniu, instalacjach lub integralności artefaktów
- uwierzytelnianiu, autoryzacji lub tokenach API
- skanowaniu, moderacji lub obsłudze zgłoszeń

Nie używaj ClawHub advisories do zgłaszania podatności we własnym kodzie źródłowym zewnętrznej umiejętności lub Plugin. Zgłaszaj je bezpośrednio wydawcy albo do repozytorium źródłowego podlinkowanego z wpisu w ClawHub.

## Ujawnianie podatności

Ponieważ ClawHub jest hostowaną aplikacją chmurową, podatności usługi ClawHub
domyślnie nie są ujawniane publicznie. Są ujawniane publicznie, gdy istnieją
dowody rzeczywistego wpływu na użytkowników albo gdy użytkownicy muszą podjąć działanie.

Przykłady rzeczywistego wpływu na użytkowników obejmują potwierdzone wykorzystanie, ujawnienie danych lub sekretów użytkowników, dotarcie złośliwych treści do użytkowników z powodu awarii platformy albo dowolny problem wymagający od użytkowników rotacji poświadczeń, aktualizacji lokalnego oprogramowania lub podjęcia innych działań ochronnych.

Podatności w oprogramowaniu instalowanym przez użytkowników są ujawniane publicznie, na przykład pakiety CLI ClawHub, pliki binarne, biblioteki lub inne artefakty wydania, które użytkownicy muszą zaktualizować lokalnie.

## Powiązane strony

Informacje o etykietach audytu podczas instalacji, poziomach ryzyka, ustaleniach i interpretacji znajdziesz w
[Audytach bezpieczeństwa](/clawhub/security-audits).

Informacje o zgłoszeniach w marketplace, wstrzymaniach moderacyjnych, ukrytych wpisach, blokadach i statusie konta znajdziesz w [Moderacji i bezpieczeństwie konta](/clawhub/moderation).
