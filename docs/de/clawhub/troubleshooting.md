---
read_when:
    - ClawHub CLI oder OpenClaw-Registry-Befehle schlagen fehl
    - Ein Paket kann nicht installiert, veröffentlicht oder aktualisiert werden
summary: Fehlerbehebung bei ClawHub-Problemen mit Anmeldung, Installation, Veröffentlichung, Synchronisierung, Aktualisierung und API.
x-i18n:
    generated_at: "2026-05-12T12:54:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3e23936085ebc5422d71df8a9feffbbe56ce562de8d203462d712cc58f88a0ed
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

- Melden Sie sich mit `clawhub login` erneut an.
- Wenn Sie einen benutzerdefinierten Konfigurationspfad verwenden, stellen Sie sicher, dass `CLAWHUB_CONFIG_PATH` auf die Datei verweist, die Ihr aktuelles Token enthält.
- Wenn Sie ein API-Token verwenden, stellen Sie sicher, dass es in der Weboberfläche nicht widerrufen wurde.

## Suche oder Installation gibt `Rate limit exceeded` (429) zurück

Lesen Sie die Wiederholungsinformationen in der Antwort:

- `Retry-After`: Sekunden, die vor einem erneuten Versuch gewartet werden sollen.
- `RateLimit-Remaining` und `RateLimit-Limit`: Ihr aktuelles Kontingent.
- `RateLimit-Reset` oder `X-RateLimit-Reset`: Zeitpunkt des Zurücksetzens.

Wenn viele Benutzer dieselbe ausgehende IP-Adresse teilen, können anonyme IP-Limits erreicht werden, selbst wenn jede Person nur wenige Anfragen sendet. Melden Sie sich nach Möglichkeit an und versuchen Sie es nach der gemeldeten Verzögerung erneut.

## Suche oder Installation schlägt hinter einem Proxy fehl

Die CLI berücksichtigt Standard-Proxy-Variablen:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
clawhub search "my query"
```

Unterstützte Namen umfassen `HTTPS_PROXY`, `HTTP_PROXY`, `https_proxy` und `http_proxy`.

## Ein Skill erscheint nicht in der Suche

- Prüfen Sie den genauen Slug oder die Owner-Seite, falls Sie ihn kennen.
- Stellen Sie sicher, dass das Release öffentlich ist und nicht durch Scan oder Moderation zurückgehalten wird.
- Wenn Ihnen der Skill gehört, melden Sie sich an und prüfen Sie ihn:

```bash
clawhub inspect <skill-slug>
```

Für Owner sichtbare Diagnosen können den Scan-, Upload-Gate- oder Moderationsstatus erklären.

## Veröffentlichung schlägt fehl, weil erforderliche Metadaten fehlen

Prüfen Sie bei Skills das Frontmatter von `SKILL.md`. Erforderliche Umgebungsvariablen und Tools sollten deklariert werden, damit Benutzer und Scanner das Paket verstehen können.

Prüfen Sie bei Plugins die Kompatibilitätsmetadaten in `package.json`. Veröffentlichungen von Code-Plugins benötigen OpenClaw-Kompatibilitätsfelder wie `openclaw.compat.pluginApi` und `openclaw.build.openclawVersion`.

Prüfen Sie zuerst die Veröffentlichungsnutzlast in der Vorschau:

```bash
clawhub package publish <source> --family code-plugin --dry-run
```

## Veröffentlichung schlägt mit einem GitHub-Owner- oder Quellfehler fehl

ClawHub verwendet GitHub-Identität und Quellzuordnung, um Pakete mit ihren Herausgebern zu verbinden.

- Stellen Sie sicher, dass Sie mit dem GitHub-Konto angemeldet sind, dem das Paket gehört oder das es veröffentlichen kann.
- Prüfen Sie, dass die Quell-URL öffentlich oder für ClawHub zugänglich ist.
- Verwenden Sie für GitHub-Quellen `owner/repo`, `owner/repo@ref` oder eine vollständige GitHub-URL.

## `sync` meldet, dass keine Skills gefunden wurden

`sync` sucht nach Ordnern, die `SKILL.md` oder `skill.md` enthalten.

Verweisen Sie auf die Roots, die Sie scannen möchten:

```bash
clawhub sync --root /path/to/skills
```

Prüfen Sie zuerst die Vorschau, wenn Sie unsicher sind, was veröffentlicht wird:

```bash
clawhub sync --all --dry-run --no-input
```

## `update` lehnt wegen lokaler Änderungen ab

Die lokalen Dateien entsprechen keiner Version, die ClawHub bekannt ist. Wählen Sie eine Option:

- Lokale Änderungen behalten und das Update überspringen.
- Mit der veröffentlichten Version überschreiben:

```bash
clawhub update <slug> --force
```

- Ihre bearbeitete Kopie als neuen Slug oder Fork veröffentlichen.

## Eine Plugin-Installation schlägt in OpenClaw fehl

- Verwenden Sie eine explizite ClawHub-Quelle:

```bash
openclaw plugins install clawhub:<package>
```

- Prüfen Sie die Paketdetailseite auf Scan-Status und Kompatibilitätsmetadaten.
- Stellen Sie sicher, dass Ihre OpenClaw-Version den angegebenen Kompatibilitätsbereich des Pakets erfüllt.
- Wenn das Paket ausgeblendet, zurückgehalten oder blockiert ist, ist es möglicherweise nicht installierbar, bis der Owner das Problem behebt.

## Öffentliche API-Anfragen schlagen fehl

- Beachten Sie `429`-Wiederholungsheader und cachen Sie öffentliche Listen-/Suchantworten.
- Verlinken Sie Benutzer zurück auf den kanonischen ClawHub-Eintrag.
- Spiegeln Sie keine ausgeblendeten, privaten, zurückgehaltenen oder durch Moderation blockierten Inhalte außerhalb der öffentlichen API-Oberfläche.

Siehe [HTTP-API](/de/clawhub/http-api) für Endpunktdetails.
