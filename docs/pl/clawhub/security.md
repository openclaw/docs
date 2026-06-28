---
read_when:
    - Zgłaszanie problemu bezpieczeństwa ClawHub
    - Zrozumienie procesu ujawniania podatności w ClawHub
    - Odróżnianie problemów platformy ClawHub od problemów zewnętrznych Skills lub Pluginów
sidebarTitle: Security
summary: Jak zgłaszać problemy bezpieczeństwa dotyczące ClawHub i kiedy podatności są publicznie ujawniane.
title: Bezpieczeństwo
x-i18n:
    generated_at: "2026-06-28T07:42:12Z"
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

Nie używaj zgłoszeń doradczych ClawHub do podatności w kodzie źródłowym
umiejętności lub pluginu innej firmy. Zgłaszaj je bezpośrednio wydawcy lub do
repozytorium źródłowego powiązanego z wpisem w ClawHub.

## Ujawnianie podatności

Ponieważ ClawHub jest hostowaną aplikacją chmurową, podatności usługi ClawHub
domyślnie nie są ujawniane publicznie. Są ujawniane publicznie, gdy istnieją
dowody rzeczywistego wpływu na użytkowników lub gdy użytkownicy muszą podjąć
działania.

Przykłady rzeczywistego wpływu na użytkowników obejmują potwierdzone wykorzystanie,
ujawnienie danych użytkowników lub sekretów, dotarcie złośliwej treści do
użytkowników z powodu awarii platformy albo dowolny problem wymagający od
użytkowników rotacji poświadczeń, aktualizacji lokalnego oprogramowania lub
podjęcia innych działań ochronnych.

Podatności w oprogramowaniu instalowanym przez użytkownika są ujawniane publicznie,
na przykład w pakietach ClawHub CLI, plikach binarnych, bibliotekach lub innych
artefaktach wydania, które użytkownicy muszą zaktualizować lokalnie.

## Powiązane strony

Informacje o etykietach audytu podczas instalacji, poziomach ryzyka, ustaleniach
i interpretacji znajdziesz w [Audytach bezpieczeństwa](/pl/clawhub/security-audits).

Informacje o zgłoszeniach w marketplace, blokadach moderacyjnych, ukrytych wpisach,
banach i statusie konta znajdziesz w [Moderacji i bezpieczeństwie konta](/pl/clawhub/moderation).
