---
read_when:
    - Zgłaszanie problemu bezpieczeństwa w ClawHub
    - Zrozumienie ujawniania podatności w ClawHub
    - Odróżnianie problemów platformy ClawHub od problemów zewnętrznych Skills lub pluginów
sidebarTitle: Security
summary: Jak zgłaszać problemy bezpieczeństwa ClawHub i kiedy podatności są ujawniane publicznie.
title: Bezpieczeństwo
x-i18n:
    generated_at: "2026-07-02T14:12:36Z"
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

Używaj GitHub Security Advisories do zgłaszania podatności w samym ClawHub. Dobre
zgłoszenia do ClawHub obejmują błędy w:

- witrynie ClawHub, API lub CLI
- publikowaniu w rejestrze, pobieraniu, instalacjach lub integralności artefaktów
- uwierzytelnianiu, autoryzacji lub tokenach API
- skanowaniu, moderacji lub obsłudze zgłoszeń

Nie używaj zgłoszeń ClawHub do podatności we własnym kodzie źródłowym Skills lub
pluginu innej firmy. Zgłaszaj je bezpośrednio do wydawcy lub repozytorium
źródłowego powiązanego z pozycją w ClawHub.

## Ujawnianie podatności

Ponieważ ClawHub jest hostowaną aplikacją chmurową, podatności usługi ClawHub
domyślnie nie są ujawniane publicznie. Są ujawniane publicznie, gdy istnieją
dowody rzeczywistego wpływu na użytkowników lub gdy użytkownicy muszą podjąć
działanie.

Przykłady rzeczywistego wpływu na użytkowników obejmują potwierdzone
wykorzystanie, ujawnienie danych użytkowników lub sekretów, złośliwe treści
docierające do użytkowników z powodu awarii platformy albo dowolny problem,
który wymaga od użytkowników rotacji poświadczeń, aktualizacji lokalnego
oprogramowania lub podjęcia innych działań ochronnych.

Podatności w oprogramowaniu instalowanym przez użytkowników są ujawniane
publicznie, na przykład pakiety CLI ClawHub, pliki binarne, biblioteki lub inne
artefakty wydań, które użytkownicy muszą zaktualizować lokalnie.

## Powiązane strony

Informacje o etykietach audytu podczas instalacji, poziomach ryzyka, ustaleniach
i interpretacji znajdziesz w [Audytach bezpieczeństwa](/clawhub/security-audits).

Informacje o zgłoszeniach marketplace, wstrzymaniach moderacyjnych, ukrytych
pozycjach, banach i stanie konta znajdziesz w [Moderacji i bezpieczeństwie konta](/clawhub/moderation).
