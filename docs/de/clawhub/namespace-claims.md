---
read_when:
    - Beanspruchen einer Organisation, Marke, eines Paketbereichs, Inhaber-Handles, Skill-Slugs oder Paket-Namensraums
    - Auflösen eines bereits beanspruchten oder reservierten Namensraums
    - Entscheidung zwischen Meldung, Einspruch und Namespace-Anspruch
sidebarTitle: Org and Namespace Claims
summary: So beantragen Sie eine ClawHub-Prüfung bei Streitigkeiten über die Inhaberschaft von Organisationen, Marken, Owner-Handles, Paket-Scopes, Skill-Slugs oder Namespaces.
title: Organisations- und Namespace-Ansprüche
x-i18n:
    generated_at: "2026-07-16T12:36:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 77a4d8090b55298c401154d116d93d4f8139d40983a45982288d8e48bcea40fb
    source_path: clawhub/namespace-claims.md
    workflow: 16
---

# Ansprüche auf Organisationen und Namespaces

ClawHub verwendet Inhaber-Handles, Organisations-Handles, Skill-Slugs, Plugin-Paketnamen und
Paket-Scopes als öffentliche Namespaces. Wenn ein Namespace offenbar zu einem
realen Projekt, einer Marke, einem Paket-Ökosystem oder einer Organisation gehört, auf ClawHub jedoch bereits
beansprucht, reserviert, irreführend oder umstritten ist, bitten Sie das Team über das
[Formular für Ansprüche auf Organisationen/Namespaces](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)
um eine Prüfung.

Verwenden Sie diesen Weg für öffentliche, nicht vertrauliche Prüfungen der Inhaberschaft. Verwenden Sie für
Namespace-Ansprüche weder produktinterne Meldungen noch das Formular für Einsprüche gegen Kontomaßnahmen.

## Wann ein Anspruch eingereicht werden sollte

Reichen Sie einen Namespace-Anspruch ein, wenn das ClawHub-Team Ihrer Ansicht nach prüfen sollte, ob ein
Namespace aufgrund realer Inhaberschaft reserviert, übertragen, umbenannt, ausgeblendet, unter Quarantäne gestellt, mit einem Alias versehen
oder anderweitig geändert werden sollte.

Beispiele:

- ein Organisations-Handle, das Ihrer GitHub-Organisation, Ihrem Projekt, Unternehmen oder Ihrer Community entspricht
- ein Paket-Scope wie `@example-org/*`, unter dem nur der
  entsprechende ClawHub-Inhaber veröffentlichen sollte
- ein Skill-Slug oder Plugin-Paketname, der den Anschein erweckt, sich als ein Projekt auszugeben
- ein Streitfall zu einer Marke, einem Warenzeichen, einer Projektumbenennung oder einem Paketverlauf
- ein gelöschter, inaktiver oder nicht erreichbarer Inhaber, der den rechtmäßigen Inhaber des Namespaces
  blockiert

Wenn der Eintrag über den Streit um die Inhaberschaft hinaus unsicher, bösartig oder irreführend ist,
befolgen Sie zusätzlich die entsprechenden Richtlinien zur Moderation oder Sicherheit. Das Formular für
Namespace-Ansprüche dient der Prüfung der Inhaberschaft, nicht der dringenden Offenlegung von Schwachstellen.

## Vor dem Einreichen

Vergewissern Sie sich zunächst, dass Sie mit dem Inhaber veröffentlichen, der dem Namespace entspricht.
Bei Plugin-Paketen müssen Namen mit Scope wie `@example-org/example-plugin`
unter dem entsprechenden Inhaber `example-org` veröffentlicht werden.

Wenn Sie den aktuellen Inhaber verwalten können, korrigieren Sie den Namespace direkt, indem Sie die betroffene Ressource
veröffentlichen, umbenennen, übertragen, ausblenden oder löschen. Reichen Sie einen Anspruch ein,
wenn Sie den aktuellen Inhaber nicht verwalten können oder das Team einen
Streitfall klären muss.

## Beizufügende Nachweise

Verwenden Sie öffentliche, nicht vertrauliche Nachweise. Hilfreiche Nachweise sind unter anderem:

- Verlauf der GitHub-Organisation, des Repositorys, der Releases oder der Maintainer
- offizielle Projektdokumentation, in der der Namespace genannt wird
- Nachweis über eine Domain oder eine offizielle E-Mail-Domain
- Kontrolle über einen Scope bei npm, PyPI, crates.io oder einer anderen Paketregistrierung
- Nachweise zur Inhaberschaft eines Warenzeichens, einer Marke oder eines Projekts, die bedenkenlos öffentlich
  erörtert werden können
- Verlauf des Quell-Repositorys, Paketverlauf oder öffentliche Hinweise auf Umbenennungen
- Links zum umstrittenen ClawHub-Inhaber, Skill, Plugin, Paket oder Issue

Erläutern Sie, was jeder Link belegt. Das Team sollte die
Beziehung nachvollziehen können, ohne private Anmeldedaten oder Secrets zu benötigen.

## Nicht beizufügende Inhalte

Veröffentlichen Sie keine Secrets oder privaten Nachweise in einem öffentlichen GitHub-Issue. Geben Sie Folgendes nicht an:

- API-Token, Signaturschlüssel oder Anmeldedaten
- DNS-Challenge-Token
- private Rechtsunterlagen oder Verträge
- persönliche Identitätsdokumente
- private E-Mails, private Sicherheitsberichte oder vertrauliche Kundendaten

Im Anspruchsformular wird gefragt, ob vertrauliche Nachweise einen privaten Kanal zum Team erfordern.
Verwenden Sie diese Option, anstatt vertrauliches Material öffentlich zu veröffentlichen.

## Mögliche Ergebnisse

Je nach Nachweisen und Risiko kann das ClawHub-Team einen Namespace reservieren,
die Inhaberschaft übertragen, eine Ressource umbenennen, einen bestehenden Eintrag ausblenden oder unter Quarantäne stellen,
einen Alias oder eine Weiterleitung hinzufügen, weitere Nachweise anfordern oder den Antrag ablehnen.

Eine Namespace-Prüfung garantiert nicht, dass jeder übereinstimmende Name übertragen wird.
Das Team wägt öffentliche Nachweise, die bestehende Nutzung, Sicherheitsrisiken und Auswirkungen auf Benutzer ab.

## Verwandte Dokumentation

- [Veröffentlichen](/de/clawhub/publishing)
- [Fehlerbehebung](/clawhub/troubleshooting#publish-fails-because-a-namespace-is-claimed-or-reserved)
- [Moderation und Kontosicherheit](/clawhub/moderation)
- [Sicherheit](/clawhub/security)
