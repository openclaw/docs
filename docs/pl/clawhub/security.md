---
read_when:
    - Zgłaszanie problemu z bezpieczeństwem ClawHub
    - Zrozumienie ujawniania podatności w ClawHub
    - Odróżnianie problemów platformy ClawHub od problemów dotyczących Skills lub Plugin od innych dostawców
sidebarTitle: Security
summary: Jak zgłaszać problemy z bezpieczeństwem ClawHub i kiedy podatności są ujawniane publicznie.
title: Bezpieczeństwo
x-i18n:
    generated_at: "2026-07-01T15:32:57Z"
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

Używaj GitHub Security Advisories do zgłaszania podatności w samym ClawHub. Dobre
zgłoszenia doradcze ClawHub obejmują błędy w:

- witrynie ClawHub, API lub CLI
- publikowaniu w rejestrze, pobieraniu, instalacjach lub integralności artefaktów
- uwierzytelnianiu, autoryzacji lub tokenach API
- skanowaniu, moderacji lub obsłudze zgłoszeń

Nie używaj zgłoszeń doradczych ClawHub do podatności w kodzie źródłowym zewnętrznej umiejętności lub
Pluginu. Zgłaszaj je bezpośrednio wydawcy lub do repozytorium źródłowego
podlinkowanego z wpisu w ClawHub.

## Ujawnianie podatności

Ponieważ ClawHub jest hostowaną aplikacją chmurową, podatności usługi ClawHub
domyślnie nie są ujawniane publicznie. Są ujawniane publicznie, gdy istnieją
dowody rzeczywistego wpływu na użytkowników lub gdy użytkownicy muszą podjąć działanie.

Przykłady rzeczywistego wpływu na użytkowników obejmują potwierdzone wykorzystanie podatności, ujawnienie danych
użytkowników lub sekretów, dotarcie złośliwych treści do użytkowników z powodu awarii platformy
albo każdy problem wymagający od użytkowników rotacji danych uwierzytelniających, aktualizacji lokalnego oprogramowania lub
podjęcia innych działań ochronnych.

Podatności w oprogramowaniu instalowanym przez użytkownika są ujawniane publicznie, na przykład
pakiety CLI ClawHub, pliki binarne, biblioteki lub inne artefakty wydania, które użytkownicy
muszą zaktualizować lokalnie.

## Powiązane strony

Informacje o etykietach audytu podczas instalacji, poziomach ryzyka, ustaleniach i interpretacji znajdziesz w
[Audytach bezpieczeństwa](/clawhub/security-audits).

Informacje o zgłoszeniach z marketplace, wstrzymaniach moderacyjnych, ukrytych wpisach, banach i statusie
konta znajdziesz w [Moderacji i bezpieczeństwie konta](/clawhub/moderation).
