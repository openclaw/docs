---
read_when:
    - ClawHub-CLI- oder OpenClaw-Registry-Befehle schlagen fehl
    - Ein Paket kann nicht installiert, veröffentlicht oder aktualisiert werden
summary: Fehlerbehebung bei ClawHub-Anmeldung, Installation, Veröffentlichung, Aktualisierung und API-Problemen.
x-i18n:
    generated_at: "2026-06-28T05:32:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fc789fcc891cf8c44b5d1a10d38a4e6dd4dec9474d8d13f8058ea1c3392a9f91
    source_path: clawhub/troubleshooting.md
    workflow: 16
---

# Fehlerbehebung

## `clawhub login` öffnet einen Browser, wird aber nie abgeschlossen

Die CLI startet während der Browser-Anmeldung einen kurzlebigen lokalen Callback-Server.

- Stellen Sie sicher, dass Ihr Browser `http://127.0.0.1:<port>/callback` erreichen kann.
- Prüfen Sie lokale Firewall-, VPN- und Proxy-Regeln, wenn der Callback nie ankommt.
- Erstellen Sie in Headless-Umgebungen ein API-Token in der ClawHub-Weboberfläche und führen Sie Folgendes aus:

```bash
clawhub login --token clh_...
```

## `whoami` oder `publish` gibt `Unauthorized` (401) zurück

- Melden Sie sich erneut mit `clawhub login` an.
- Wenn Sie einen benutzerdefinierten Konfigurationspfad verwenden, bestätigen Sie, dass `CLAWHUB_CONFIG_PATH` auf die
  Datei zeigt, die Ihr aktuelles Token enthält.
- Wenn Sie ein API-Token verwenden, bestätigen Sie, dass es in der Weboberfläche nicht widerrufen wurde.

## Suche oder Installation gibt `Rate limit exceeded` (429) zurück

Lesen Sie die Wiederholungsinformationen in der Antwort:

- `Retry-After`: Sekunden, die vor einem erneuten Versuch gewartet werden soll.
- `RateLimit-Limit`: das Limit, das auf diese Anfrage angewendet wurde.
- `RateLimit-Remaining`: Ihr exakt verbleibendes Kontingent, wenn der Header vorhanden ist. Bei `429` ist es `0`.
- `RateLimit-Reset` oder `X-RateLimit-Reset`: Zeitpunkt der Zurücksetzung.

Wenn viele Benutzer eine gemeinsame Egress-IP verwenden, können anonyme IP-Limits erreicht werden, selbst wenn jede
Person nur wenige Anfragen sendet. Melden Sie sich nach Möglichkeit an und versuchen Sie es nach der
gemeldeten Verzögerung erneut.

## Suche oder Installation schlägt hinter einem Proxy fehl

Die CLI berücksichtigt standardmäßige Proxy-Variablen:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
clawhub search "my query"
```

Unterstützte Namen umfassen `HTTPS_PROXY`, `HTTP_PROXY`, `https_proxy` und
`http_proxy`.

## Ein Skill erscheint nicht in der Suche

- Prüfen Sie den exakten Slug oder die Eigentümerseite, falls Sie diese kennen.
- Bestätigen Sie, dass das Release öffentlich ist und nicht durch Scan oder Moderation zurückgehalten wird.
- Wenn der Skill Ihnen gehört, melden Sie sich an und prüfen Sie ihn:

```bash
clawhub inspect @openclaw/demo
```

Für Eigentümer sichtbare Diagnosen können Scan-, Upload-Gate- oder Moderationsstatus erklären.

## Veröffentlichung schlägt fehl, weil erforderliche Metadaten fehlen

Prüfen Sie bei Skills das Frontmatter von `SKILL.md`. Erforderliche Umgebungsvariablen und
Tools sollten deklariert werden, damit Benutzer und Scanner das Paket verstehen können.

Prüfen Sie bei Plugins die Kompatibilitätsmetadaten in `package.json`. Veröffentlichungen von Code-Plugins
benötigen OpenClaw-Kompatibilitätsfelder wie `openclaw.compat.pluginApi` und
`openclaw.build.openclawVersion`.

Sehen Sie sich zuerst die Veröffentlichungs-Payload in der Vorschau an:

```bash
clawhub package publish <source> --family code-plugin --dry-run
```

## Veröffentlichung schlägt wegen eines GitHub-Eigentümer- oder Quellfehlers fehl

ClawHub verwendet GitHub-Identität und Quellenzuordnung, um Pakete mit ihren
Publishern zu verbinden.

- Stellen Sie sicher, dass Sie mit dem GitHub-Konto angemeldet sind, dem das Paket gehört oder das es veröffentlichen darf.
- Prüfen Sie, ob die Quell-URL öffentlich oder für ClawHub zugänglich ist.
- Verwenden Sie für GitHub-Quellen `owner/repo`, `owner/repo@ref` oder eine vollständige GitHub-URL.

## Veröffentlichung schlägt fehl, weil ein Namespace beansprucht oder reserviert ist

Wenn eine Veröffentlichung fehlschlägt, weil das Eigentümer-Handle, der Organisations-Namespace, der Paket-Scope, der Skill-
Slug oder der Paketname bereits beansprucht oder reserviert ist, bestätigen Sie zuerst, dass Sie
mit dem Eigentümer veröffentlichen, der zum Namespace passt. Bei Plugin-Paketen müssen
Scoped-Namen wie `@example-org/example-plugin` als passender
Eigentümer `example-org` veröffentlicht werden.

Wenn Sie glauben, dass Ihre Organisation, Ihr Projekt oder Ihre Marke der rechtmäßige Namespace-Eigentümer ist, Sie aber
den aktuellen ClawHub-Eigentümer nicht verwalten können, öffnen Sie ein
[Organisations-/Namespace-Anspruch-Issue](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)
mit öffentlichen, nicht sensiblen Nachweisen. Siehe
[Organisations- und Namespace-Ansprüche](/de/clawhub/namespace-claims) für Hinweise zu Nachweisen und dazu, was
aus öffentlichen Issues herausgehalten werden sollte.

## `sync` meldet, dass keine Skills gefunden wurden

`sync` sucht nach Ordnern, die `SKILL.md` oder `skill.md` enthalten.

Verweisen Sie auf die Roots, die Sie scannen möchten:

```bash
clawhub sync --root /path/to/skills
```

Sehen Sie sich zuerst eine Vorschau an, wenn Sie unsicher sind, was veröffentlicht wird:

```bash
clawhub sync --all --dry-run --no-input
```

## `update` verweigert wegen lokaler Änderungen

Die lokalen Dateien entsprechen keiner Version, die ClawHub kennt. Wählen Sie eine Option:

- Behalten Sie lokale Änderungen und überspringen Sie das Update.
- Überschreiben Sie mit der veröffentlichten Version:

```bash
clawhub update @openclaw/demo --force
```

- Veröffentlichen Sie Ihre bearbeitete Kopie als neuen Slug oder Fork.

## Eine Plugin-Installation schlägt in OpenClaw fehl

- Verwenden Sie eine explizite ClawHub-Quelle:

```bash
openclaw plugins install clawhub:<package>
```

- Prüfen Sie die Paketdetailseite auf Scan-Status und Kompatibilitätsmetadaten.
- Bestätigen Sie, dass Ihre OpenClaw-Version den angegebenen
  Kompatibilitätsbereich des Pakets erfüllt.
- Wenn das Paket verborgen, zurückgehalten oder blockiert ist, kann es möglicherweise nicht installiert werden, bis
  der Eigentümer das Problem behebt.

## Öffentliche API-Anfragen schlagen fehl

- Beachten Sie `429`-Retry-Header und cachen Sie öffentliche Listen-/Suchantworten.
- Verlinken Sie Benutzer zurück auf den kanonischen ClawHub-Eintrag.
- Spiegeln Sie keine verborgenen, privaten, zurückgehaltenen oder durch Moderation blockierten Inhalte außerhalb der
  öffentlichen API-Oberfläche.

Siehe [HTTP-API](/de/clawhub/http-api) für Endpoint-Details.
