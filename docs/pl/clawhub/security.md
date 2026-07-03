---
read_when:
    - Zgłaszanie problemu bezpieczeństwa w ClawHub
    - Zrozumienie ujawniania podatności w ClawHub
    - Rozróżnianie problemów platformy ClawHub od problemów zewnętrznych Skills lub pluginów
sidebarTitle: Security
summary: Jak zgłaszać problemy z bezpieczeństwem ClawHub i kiedy luki w zabezpieczeniach są publicznie ujawniane.
title: Bezpieczeństwo
x-i18n:
    generated_at: "2026-07-03T01:05:26Z"
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

Nie używaj zgłoszeń doradczych ClawHub dla podatności we własnym kodzie źródłowym
Skills lub Pluginu strony trzeciej. Zgłaszaj je bezpośrednio wydawcy lub do
repozytorium źródłowego powiązanego z wpisem w ClawHub.

## Ujawnianie podatności

Ponieważ ClawHub jest hostowaną aplikacją chmurową, podatności usługi ClawHub
domyślnie nie są ujawniane publicznie. Są ujawniane publicznie, gdy istnieją
dowody rzeczywistego wpływu na użytkowników lub gdy użytkownicy muszą podjąć
działanie.

Przykłady rzeczywistego wpływu na użytkowników obejmują potwierdzone wykorzystanie,
ujawnienie danych użytkowników lub sekretów, dotarcie złośliwej zawartości do
użytkowników z powodu awarii platformy albo dowolny problem wymagający od
użytkowników rotacji poświadczeń, aktualizacji lokalnego oprogramowania lub
podjęcia innych działań ochronnych.

Podatności w oprogramowaniu instalowanym przez użytkowników są ujawniane publicznie,
na przykład w pakietach CLI ClawHub, plikach binarnych, bibliotekach lub innych
artefaktach wydania, które użytkownicy muszą zaktualizować lokalnie.

## Powiązane strony

Informacje o etykietach audytu podczas instalacji, poziomach ryzyka, ustaleniach
i interpretacji znajdziesz w sekcji [Audyty bezpieczeństwa](/clawhub/security-audits).

Informacje o zgłoszeniach marketplace, wstrzymaniach moderacyjnych, ukrytych
wpisach, blokadach i statusie konta znajdziesz w sekcji [Moderacja i bezpieczeństwo konta](/clawhub/moderation).
