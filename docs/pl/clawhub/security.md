---
read_when:
    - Zgłaszanie problemu bezpieczeństwa ClawHub
    - Zrozumienie ujawniania podatności ClawHub
    - Rozróżnianie problemów platformy ClawHub od problemów dotyczących zewnętrznych Skills lub Plugin
sidebarTitle: Security
summary: Jak zgłaszać problemy bezpieczeństwa ClawHub i kiedy podatności są publicznie ujawniane.
title: Bezpieczeństwo
x-i18n:
    generated_at: "2026-07-03T10:01:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 64dcc75ad4210082c79326e617bac38908e927fd8d260fd029aa87e0a11cd324
    source_path: clawhub/security.md
    workflow: 16
---

# Bezpieczeństwo

Problemy bezpieczeństwa ClawHub można zgłaszać za pośrednictwem GitHub Security Advisories dla
`openclaw/clawhub`.

Używaj GitHub Security Advisories do zgłaszania podatności w samym ClawHub. Dobre
zgłoszenia advisory dla ClawHub obejmują błędy w:

- witrynie ClawHub, API lub CLI
- publikowaniu w rejestrze, pobraniach, instalacjach lub integralności artefaktów
- uwierzytelnianiu, autoryzacji lub tokenach API
- skanowaniu, moderacji lub obsłudze zgłoszeń

Nie używaj advisory ClawHub do zgłaszania podatności w kodzie źródłowym własnym dla zewnętrznego skillu lub
pluginu. Zgłaszaj je bezpośrednio do wydawcy lub repozytorium źródłowego
podlinkowanego z wpisu w ClawHub.

## Ujawnianie podatności

Ponieważ ClawHub jest hostowaną aplikacją chmurową, podatności usługi ClawHub
domyślnie nie są ujawniane publicznie. Są ujawniane publicznie, gdy istnieją
dowody rzeczywistego wpływu na użytkowników lub gdy użytkownicy muszą podjąć działania.

Przykłady rzeczywistego wpływu na użytkowników obejmują potwierdzone wykorzystanie, ujawnienie danych
użytkowników lub sekretów, dotarcie złośliwych treści do użytkowników z powodu awarii platformy
lub dowolny problem, który wymaga od użytkowników rotacji danych uwierzytelniających, aktualizacji lokalnego oprogramowania albo
podjęcia innych działań ochronnych.

Podatności w oprogramowaniu instalowanym przez użytkowników są ujawniane publicznie, takie jak
pakiety CLI ClawHub, pliki binarne, biblioteki lub inne artefakty wydania, które użytkownicy
muszą zaktualizować lokalnie.

## Powiązane strony

Informacje o etykietach audytu podczas instalacji, poziomach ryzyka, ustaleniach i interpretacji znajdziesz w
[Audytach bezpieczeństwa](/clawhub/security-audits).

Informacje o zgłoszeniach marketplace, blokadach moderacyjnych, ukrytych wpisach, banach i stanie
konta znajdziesz w [Moderacji i bezpieczeństwie konta](/clawhub/moderation).
