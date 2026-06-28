---
read_when:
    - Beanspruchen einer Organisation, Marke, eines Paket-Scopes, Owner-Handles, Skill-Slugs oder Paket-Namespace
    - Auflösen eines Namespace, der bereits beansprucht oder reserviert ist
    - Entscheiden, ob eine Meldung, ein Einspruch oder ein Namespace-Anspruch verwendet werden soll
sidebarTitle: Org and Namespace Claims
summary: So fordern Sie eine ClawHub-Prüfung für Streitigkeiten über Organisation, Marke, Owner-Handle, Package-Scope, Skill-Slug oder Namespace-Eigentümerschaft an.
title: Organisations- und Namespace-Claims
x-i18n:
    generated_at: "2026-06-28T05:07:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 77a4d8090b55298c401154d116d93d4f8139d40983a45982288d8e48bcea40fb
    source_path: clawhub/namespace-claims.md
    workflow: 16
---

# Organisations- und Namespace-Ansprüche

ClawHub verwendet Inhaber-Handles, Organisations-Handles, Skill-Slugs, Plugin-Paketnamen und
Paket-Scopes als öffentliche Namespaces. Wenn ein Namespace zu einem
realen Projekt, einer Marke, einem Paket-Ökosystem oder einer Organisation zu gehören scheint, aber auf ClawHub bereits
beansprucht, reserviert, irreführend oder umstritten ist, bitten Sie das Team um eine Prüfung über das
[Issue-Formular für Organisations-/Namespace-Ansprüche](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml).

Nutzen Sie diesen Weg für öffentliche, nicht vertrauliche Eigentumsprüfungen. Verwenden Sie für Namespace-Ansprüche keine
produktinternen Meldungen und kein Formular für Konto-Einsprüche.

## Wann Sie einen Anspruch eröffnen sollten

Eröffnen Sie einen Namespace-Anspruch, wenn Sie der Meinung sind, dass das ClawHub-Team prüfen sollte, ob ein
Namespace aufgrund realer Eigentumsverhältnisse reserviert, übertragen, umbenannt, ausgeblendet, in Quarantäne verschoben, mit einem Alias versehen
oder anderweitig geändert werden sollte.

Beispiele sind:

- ein Organisations-Handle, das Ihrer GitHub-Organisation, Ihrem Projekt, Unternehmen oder Ihrer Community entspricht
- ein Paket-Scope wie `@example-org/*`, unter dem nur der
  passende ClawHub-Inhaber veröffentlichen sollte
- ein Skill-Slug oder Plugin-Paketname, der ein Projekt zu imitieren scheint
- ein Streitfall zu einer Marke, einem Warenzeichen, einer Projektumbenennung oder einer Pakethistorie
- ein gelöschter, inaktiver oder nicht erreichbarer Inhaber, der den rechtmäßigen Namespace-Inhaber
  blockiert

Wenn der Eintrag über den Eigentumsstreit hinaus unsicher, bösartig oder irreführend ist,
befolgen Sie zusätzlich die relevante Moderations- oder Sicherheitsanleitung. Das Namespace-Anspruchsformular
dient der Eigentumsprüfung, nicht der dringenden Offenlegung von Sicherheitslücken.

## Bevor Sie einreichen

Bestätigen Sie zuerst, dass Sie mit dem Inhaber veröffentlichen, der zum Namespace passt.
Bei Plugin-Paketen müssen scoped Namen wie `@example-org/example-plugin` als
passender Inhaber `example-org` veröffentlicht werden.

Wenn Sie den aktuellen Inhaber verwalten können, korrigieren Sie den Namespace direkt durch Veröffentlichen,
Umbenennen, Übertragen, Ausblenden oder Löschen der betroffenen Ressource. Verwenden Sie einen Anspruch,
wenn Sie den aktuellen Inhaber nicht verwalten können oder wenn das Team einen
Streitfall lösen muss.

## Belege, die Sie einbeziehen sollten

Verwenden Sie öffentliche, nicht vertrauliche Belege. Hilfreiche Nachweise sind unter anderem:

- GitHub-Organisations-, Repository-, Release- oder Maintainer-Historie
- offizielle Projektdokumentation, die den Namespace nennt
- Domain- oder offizieller E-Mail-Domain-Nachweis
- Kontrolle über npm-, PyPI-, crates.io- oder andere Paket-Registry-Scopes
- Nachweise zu Warenzeichen, Marken- oder Projekteigentum, die öffentlich sicher besprochen werden können
- Historie des Quell-Repositorys, Pakethistorie oder öffentliche Umbenennungshinweise
- Links zum umstrittenen ClawHub-Inhaber, Skill, Plugin, Paket oder Issue

Erklären Sie, was jeder Link belegt. Das Team sollte die
Beziehung verstehen können, ohne private Zugangsdaten oder Geheimnisse zu benötigen.

## Was Sie nicht einbeziehen sollten

Veröffentlichen Sie keine Geheimnisse oder privaten Nachweise in einem öffentlichen GitHub-Issue. Fügen Sie Folgendes nicht ein:

- API-Token, Signaturschlüssel oder Zugangsdaten
- DNS-Challenge-Token
- private Rechtsdokumente oder Verträge
- persönliche Identitätsdokumente
- private E-Mails, private Sicherheitsberichte oder vertrauliche Kundendaten

Das Anspruchsformular fragt, ob sensible Belege einen privaten Team-Kanal benötigen.
Nutzen Sie diese Option, statt sensibles Material öffentlich zu posten.

## Mögliche Ergebnisse

Je nach Belegen und Risiko kann das ClawHub-Team einen Namespace reservieren,
Eigentum übertragen, eine Ressource umbenennen, einen bestehenden Eintrag ausblenden oder in Quarantäne verschieben,
einen Alias oder eine Weiterleitung hinzufügen, weitere Nachweise anfordern oder die Anfrage ablehnen.

Die Namespace-Prüfung garantiert nicht, dass jeder passende Name übertragen wird.
Das Team wägt öffentliche Belege, bestehende Nutzung, Sicherheitsrisiko und Auswirkungen auf Benutzer ab.

## Verwandte Dokumentation

- [Veröffentlichen](/de/clawhub/publishing)
- [Fehlerbehebung](/de/clawhub/troubleshooting#publish-fails-because-a-namespace-is-claimed-or-reserved)
- [Moderation und Kontosicherheit](/de/clawhub/moderation)
- [Sicherheit](/de/clawhub/security)
