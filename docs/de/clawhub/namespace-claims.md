---
read_when:
    - Beanspruchen einer Organisation, Marke, eines Paketbereichs, Inhaber-Handles, Skill-Slugs oder Paket-Namensraums
    - Auflösen eines bereits beanspruchten oder reservierten Namespace
    - Entscheidung, ob eine Meldung, ein Einspruch oder ein Namespace-Anspruch verwendet werden soll
sidebarTitle: Org and Namespace Claims
summary: So beantragen Sie eine Überprüfung durch ClawHub bei Streitfällen über die Inhaberschaft von Organisationen, Marken, Inhaber-Handles, Paket-Scopes, Skill-Slugs oder Namespaces.
title: Organisations- und Namespace-Ansprüche
x-i18n:
    generated_at: "2026-07-12T15:04:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 77a4d8090b55298c401154d116d93d4f8139d40983a45982288d8e48bcea40fb
    source_path: clawhub/namespace-claims.md
    workflow: 16
---

# Ansprüche auf Organisationen und Namespaces

ClawHub verwendet Inhaber-Handles, Organisations-Handles, Skill-Slugs, Plugin-Paketnamen und Paket-Scopes als öffentliche Namespaces. Wenn ein Namespace offenbar zu einem realen Projekt, einer Marke, einem Paketökosystem oder einer Organisation gehört, auf ClawHub jedoch bereits beansprucht oder reserviert ist, irreführend verwendet wird oder strittig ist, bitten Sie die Mitarbeitenden über das
[Formular für Ansprüche auf Organisationen/Namespaces](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)
um eine Prüfung.

Verwenden Sie diesen Weg für öffentliche, nicht vertrauliche Prüfungen von Inhaberschaftsansprüchen. Verwenden Sie für Namespace-Ansprüche weder produktinterne Meldungen noch das Einspruchsformular für Konten.

## Wann Sie einen Anspruch einreichen sollten

Reichen Sie einen Namespace-Anspruch ein, wenn Sie der Ansicht sind, dass die ClawHub-Mitarbeitenden prüfen sollten, ob ein Namespace aufgrund einer realen Inhaberschaft reserviert, übertragen, umbenannt, ausgeblendet, unter Quarantäne gestellt, mit einem Alias versehen oder anderweitig geändert werden sollte.

Beispiele:

- ein Organisations-Handle, das Ihrer GitHub-Organisation, Ihrem Projekt, Ihrem Unternehmen oder Ihrer Community entspricht
- ein Paket-Scope wie `@example-org/*`, unter dem nur der entsprechende ClawHub-Inhaber veröffentlichen dürfen sollte
- ein Skill-Slug oder Plugin-Paketname, der den Anschein erweckt, ein Projekt nachzuahmen
- ein Streitfall zu einer Marke, einem Markenzeichen, einer Projektumbenennung oder dem Verlauf eines Pakets
- ein gelöschter, inaktiver oder nicht erreichbarer Inhaber, der den rechtmäßigen Inhaber des Namespace blockiert

Wenn der Eintrag über den Inhaberschaftsstreit hinaus unsicher, böswillig oder irreführend ist, befolgen Sie zusätzlich die entsprechenden Richtlinien zur Moderation oder Sicherheit. Das Formular für Namespace-Ansprüche dient der Prüfung der Inhaberschaft, nicht der dringenden Meldung von Sicherheitslücken.

## Vor dem Einreichen

Vergewissern Sie sich zunächst, dass Sie unter dem Inhaber veröffentlichen, der dem Namespace entspricht. Bei Plugin-Paketen müssen Namen mit Scope wie `@example-org/example-plugin` unter dem entsprechenden Inhaber `example-org` veröffentlicht werden.

Wenn Sie den aktuellen Inhaber verwalten können, korrigieren Sie den Namespace direkt, indem Sie die betroffene Ressource veröffentlichen, umbenennen, übertragen, ausblenden oder löschen. Reichen Sie einen Anspruch ein, wenn Sie den aktuellen Inhaber nicht verwalten können oder die Mitarbeitenden einen Streitfall klären müssen.

## Erforderliche Nachweise

Verwenden Sie öffentliche, nicht vertrauliche Nachweise. Hilfreiche Nachweise umfassen:

- Verlauf der GitHub-Organisation, des Repositorys, der Releases oder der Maintainer
- offizielle Projektdokumentation, in der der Namespace genannt wird
- Nachweis über eine Domain oder eine offizielle E-Mail-Domain
- Kontrolle über einen Scope bei npm, PyPI, crates.io oder einer anderen Paketregistrierung
- öffentlich unbedenkliche Nachweise zur Inhaberschaft eines Markenzeichens, einer Marke oder eines Projekts
- Verlauf des Quell-Repositorys oder Pakets beziehungsweise öffentliche Hinweise zur Umbenennung
- Links zum strittigen ClawHub-Inhaber, Skill, Plugin, Paket oder Issue

Erläutern Sie, was jeder Link nachweist. Die Mitarbeitenden sollten die Beziehung nachvollziehen können, ohne private Anmeldedaten oder Geheimnisse zu benötigen.

## Nicht anzugebende Informationen

Veröffentlichen Sie keine Geheimnisse oder privaten Nachweise in einem öffentlichen GitHub-Issue. Geben Sie Folgendes nicht an:

- API-Tokens, Signaturschlüssel oder Anmeldedaten
- DNS-Challenge-Tokens
- private Rechtsunterlagen oder Verträge
- persönliche Identitätsdokumente
- private E-Mails, private Sicherheitsberichte oder vertrauliche Kundendaten

Im Anspruchsformular wird gefragt, ob vertrauliche Nachweise einen privaten Kommunikationskanal mit den Mitarbeitenden erfordern. Verwenden Sie diese Option, statt vertrauliches Material öffentlich zu veröffentlichen.

## Mögliche Ergebnisse

Je nach Nachweisen und Risiko können die ClawHub-Mitarbeitenden einen Namespace reservieren, die Inhaberschaft übertragen, eine Ressource umbenennen, einen bestehenden Eintrag ausblenden oder unter Quarantäne stellen, einen Alias oder eine Weiterleitung hinzufügen, weitere Nachweise anfordern oder den Antrag ablehnen.

Eine Namespace-Prüfung garantiert nicht, dass jeder übereinstimmende Name übertragen wird. Die Mitarbeitenden wägen öffentliche Nachweise, bestehende Nutzung, Sicherheitsrisiken und Auswirkungen auf Benutzer ab.

## Zugehörige Dokumentation

- [Veröffentlichen](/de/clawhub/publishing)
- [Fehlerbehebung](/clawhub/troubleshooting#publish-fails-because-a-namespace-is-claimed-or-reserved)
- [Moderation und Kontosicherheit](/clawhub/moderation)
- [Sicherheit](/clawhub/security)
