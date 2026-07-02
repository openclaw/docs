---
read_when:
    - Zgłaszanie problemu bezpieczeństwa ClawHub
    - Zrozumienie ujawniania podatności ClawHub
    - Odróżnianie problemów platformy ClawHub od problemów zewnętrznych Skills lub Pluginów
sidebarTitle: Security
summary: Jak zgłaszać problemy bezpieczeństwa w ClawHub i kiedy luki w zabezpieczeniach są ujawniane publicznie.
title: Bezpieczeństwo
x-i18n:
    generated_at: "2026-07-02T22:51:01Z"
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

Używaj GitHub Security Advisories do zgłaszania luk w samym ClawHub. Dobre
zgłoszenia advisory dla ClawHub obejmują błędy w:

- witrynie, API lub CLI ClawHub
- publikowaniu w rejestrze, pobieraniu, instalacjach lub integralności artefaktów
- uwierzytelnianiu, autoryzacji lub tokenach API
- skanowaniu, moderacji lub obsłudze zgłoszeń

Nie używaj advisory ClawHub do zgłaszania luk w kodzie źródłowym umiejętności lub
pluginu innej firmy. Zgłaszaj je bezpośrednio wydawcy albo do repozytorium
źródłowego podlinkowanego w pozycji ClawHub.

## Ujawnianie luk

Ponieważ ClawHub jest hostowaną aplikacją chmurową, luki w usłudze ClawHub
domyślnie nie są ujawniane publicznie. Są ujawniane publicznie, gdy istnieją
dowody rzeczywistego wpływu na użytkowników albo gdy użytkownicy muszą podjąć
działanie.

Przykłady rzeczywistego wpływu na użytkowników obejmują potwierdzone wykorzystanie,
ujawnienie danych użytkowników lub sekretów, dotarcie złośliwych treści do
użytkowników z powodu awarii platformy albo dowolny problem, który wymaga od
użytkowników rotacji poświadczeń, aktualizacji lokalnego oprogramowania lub
podjęcia innych działań ochronnych.

Luki w oprogramowaniu instalowanym przez użytkowników są ujawniane publicznie,
na przykład w pakietach CLI ClawHub, plikach binarnych, bibliotekach lub innych
artefaktach wydań, które użytkownicy muszą zaktualizować lokalnie.

## Powiązane strony

Informacje o etykietach audytu podczas instalacji, poziomach ryzyka, ustaleniach
i interpretacji znajdziesz w sekcji [Audyty bezpieczeństwa](/clawhub/security-audits).

Informacje o zgłoszeniach marketplace, wstrzymaniach moderacyjnych, ukrytych
pozycjach, blokadach i stanie konta znajdziesz w sekcji [Moderacja i bezpieczeństwo konta](/clawhub/moderation).
